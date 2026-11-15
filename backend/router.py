"""
VERAXIS AI — Smart Dual-Engine Router v2.0
==========================================
Intent Classification: Multi-Signal Scoring Engine (no single-point-of-failure)
  - Signal 1: Hard-rule fast bypass (zero LLM cost, O(1))
  - Signal 2: Structural complexity heuristics (length, sentence count, punctuation)
  - Signal 3: Keyword weighted scoring (chat vs research lexicon)
  - Signal 4: LLM classifier (only when signals 1-3 are ambiguous, 0.5-0.75 confidence zone)
  - Signal 5: Confidence gating — bias toward GENERAL_CHAT on doubt

Routing guarantees:
  - Casual / conversational  → GENERAL_CHAT  → streamed LLM response (live token-by-token)
  - Definitional (simple)    → GENERAL_CHAT  → streamed LLM response
  - Deep research / analysis → DEEP_RESEARCH → 3-Tier CrewAI multi-agent pipeline

Fast Chat: Streaming via generator, sync wrapper for Streamlit compatibility.
"""

import json
import re
import time
from typing import Dict, Any, List, Iterator, Optional, Generator

from openai import OpenAI

try:
    from backend.config import key_manager
except ImportError:
    from config import key_manager


# ---------------------------------------------------------------------------
# 1. STREAM FILTER: strips <think>...</think> from LLM output tokens
# ---------------------------------------------------------------------------

def strip_think_tags(text: str) -> str:
    """Remove <think>...</think> blocks from completed LLM output."""
    if not text:
        return ""
    return re.sub(r"<think>[\s\S]*?</think>", "", text).strip()


class ThinkFilterStream:
    """Incremental streaming filter that drops <think>...</think> blocks cleanly."""

    def __init__(self) -> None:
        self._buf = ""
        self._inside_think = False
        self._started = False

    def feed(self, token: str) -> str:
        if not token:
            return ""
        self._buf += token
        out: List[str] = []

        while self._buf:
            if self._inside_think:
                end_idx = self._buf.find("</think>")
                if end_idx != -1:
                    self._buf = self._buf[end_idx + len("</think>"):]
                    self._inside_think = False
                else:
                    if len(self._buf) > 12:
                        self._buf = self._buf[-12:]
                    break
            else:
                start_idx = self._buf.find("<think>")
                if start_idx != -1:
                    before = self._buf[:start_idx]
                    if before:
                        out.append(before)
                    self._buf = self._buf[start_idx + len("<think>"):]
                    self._inside_think = True
                else:
                    hold = 0
                    for k in range(min(len(self._buf), 7), 0, -1):
                        if "<think>".startswith(self._buf[-k:]):
                            hold = k
                            break
                    if hold:
                        emit_part = self._buf[:-hold]
                        if emit_part:
                            out.append(emit_part)
                        self._buf = self._buf[-hold:]
                        break
                    out.append(self._buf)
                    self._buf = ""

        joined = "".join(out)
        if not self._started:
            joined = joined.lstrip()
            if joined:
                self._started = True
        return joined

    def flush(self) -> str:
        if self._inside_think:
            self._buf = ""
            return ""
        rem = self._buf
        self._buf = ""
        return rem if self._started else rem.lstrip()


# ---------------------------------------------------------------------------
# 2. GROQ CLIENT & STREAMING PRIMITIVES
# ---------------------------------------------------------------------------

def get_groq_client(override_key: Optional[str] = None) -> OpenAI:
    """Return an OpenAI-compatible Groq client with key rotation or user override."""
    key = (
        override_key.strip()
        if (override_key and override_key.strip().startswith("gsk_"))
        else key_manager.get_active_groq_key()
    )
    return OpenAI(base_url="https://api.groq.com/openai/v1", api_key=key)


def stream_groq_tokens(
    messages: List[Dict[str, str]],
    model: str,
    temperature: float = 0.25,
    max_tokens: int = 1200,
    override_key: Optional[str] = None,
) -> Iterator[str]:
    """Stream clean text tokens from Groq with <think> filtering and key failover."""
    max_attempts = 1 if override_key else min(3, len(key_manager.groq_keys) or 1)
    last_err: Optional[Exception] = None

    for _ in range(max_attempts):
        client = None
        emitted_any = False
        think_filter = ThinkFilterStream()
        try:
            client = get_groq_client(override_key=override_key)
            stream = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
            )
            for chunk in stream:
                delta = chunk.choices[0].delta.content if chunk.choices else None
                if not delta:
                    continue
                cleaned = think_filter.feed(delta)
                if cleaned:
                    emitted_any = True
                    yield cleaned
            tail = think_filter.flush()
            if tail:
                emitted_any = True
                yield tail
            return
        except Exception as err:
            last_err = err
            print(f"[RouterStream] Attempt error: {err}")
            try:
                if client is not None and getattr(client, "api_key", None):
                    key_manager.mark_rate_limited(client.api_key)
            except Exception:
                pass
            if emitted_any:
                break

    if last_err:
        yield f"\n\nNotice: Response interrupted ({str(last_err)})."


# ---------------------------------------------------------------------------
# 3. MULTI-SIGNAL INTENT CLASSIFIER
# ---------------------------------------------------------------------------

# --- Hard-coded Chat Vocabulary (Signal 1 & 3) ---
_CHAT_EXACT = frozenset([
    "hello", "hi", "hey", "hola", "namaste", "good morning", "good evening",
    "good afternoon", "how are you", "how are you doing", "what's up", "whats up",
    "who are you", "what can you do", "help", "thanks", "thank you", "bye",
    "goodbye", "test", "ping", "ok", "okay", "sup", "yo", "nice", "cool",
    "awesome", "great", "good", "fine", "accha", "theek", "haan", "nahi",
    "bilkul", "sahi", "perfect", "got it", "understood", "i see", "makes sense",
    "lol", "haha", "😊", "👍", "🙏",
])

_CHAT_PREFIXES = ("hello", "hi", "hey", "how", "what is", "what are", "who is",
                  "can you", "please", "explain", "tell me", "describe", "define",
                  "accha", "theek", "yaar", "bhai", "ek", "mujhe", "kya")

# --- Research Vocabulary (Signal 3) ---
# Each tuple: (keyword, score_weight)
_RESEARCH_SIGNALS: List[tuple] = [
    # Hard research triggers (high weight)
    ("arxiv", 10), ("peer-reviewed", 10), ("deep research", 10),
    ("literature review", 10), ("meta-analysis", 10), ("clinical trial", 10),
    ("state of the art", 9), ("systematic review", 9), ("empirical study", 9),
    ("benchmark", 8), ("feasibility study", 8), ("white paper", 8),
    ("market analysis", 8), ("commercialization", 8), ("roadmap", 7),
    ("compare", 6), ("comparison", 6), ("versus", 6), (" vs ", 6),
    ("forecast", 7), ("projection", 7), ("evidence", 6), ("breakthrough", 6),
    ("paper", 5), ("study", 4), ("research", 4), ("survey", 4),
    ("report", 4), ("analysis", 4), ("review", 4), ("investigate", 4),
    ("mechanism", 5), ("algorithm", 4), ("architecture", 4), ("implementation", 3),
    ("statistics", 5), ("data", 3), ("metrics", 4), ("performance", 3),
    ("scalability", 5), ("tradeoff", 5), ("trade-off", 5), ("regulation", 4),
    ("policy", 4), ("economic", 4), ("viability", 6), ("commercial", 5),
    ("deployment", 4), ("production", 3), ("enterprise", 4), ("industry", 3),
    ("drug", 5), ("therapy", 5), ("treatment", 5), ("diagnosis", 5),
    ("model", 3), ("transformer", 4), ("neural", 4), ("quantum", 5),
    ("semiconductor", 5), ("battery", 4), ("energy density", 7), ("photovoltaic", 5),
]

# --- Simple Definition / Explanation Vocabulary (Signal 3) ---
_DEFINITION_SIGNALS: List[tuple] = [
    ("what is", 5), ("what are", 5), ("what does", 5), ("define", 5),
    ("meaning of", 5), ("explain", 4), ("how does", 4), ("how do", 4),
    ("tell me about", 4), ("describe", 3), ("summarize", 3),
    ("in simple terms", 6), ("in hindi", 5), ("easy explanation", 6),
    ("for beginners", 6), ("simply put", 6), ("eli5", 7), ("eli 5", 7),
    ("layman", 6), ("basic", 3), ("introduction to", 4), ("overview of", 4),
    ("briefly", 5), ("short", 4), ("quick", 4),
]

# --- Casual / Emotional Vocabulary (Signal 3) ---
_CASUAL_SIGNALS: List[tuple] = [
    ("happy", 5), ("sad", 5), ("feel", 4), ("feeling", 4), ("emotion", 4),
    ("bored", 5), ("tired", 4), ("excited", 4), ("good day", 5), ("bad day", 5),
    ("joke", 6), ("funny", 5), ("laugh", 5), ("fun", 4), ("play", 3),
    ("love", 4), ("like", 3), ("hate", 3), ("miss", 3), ("friend", 4),
    ("accha", 7), ("theek hai", 7), ("mast", 6), ("badhiya", 6), ("shukriya", 6),
    ("zindagi", 5), ("yaar", 6), ("bhai", 5), ("dost", 5),
    ("weather", 5), ("food", 4), ("movie", 4), ("music", 4), ("game", 4),
    ("today", 3), ("tomorrow", 3), ("yesterday", 3),
    ("how was", 5), ("how's", 5), ("i am", 4), ("i'm", 4), ("i feel", 5),
    ("we are", 3), ("let's", 4), ("can we", 4), ("will you", 4),
]


def _score_intent(query: str) -> Dict[str, Any]:
    """
    Multi-signal scoring engine. Returns a dict with:
      intent, confidence, reasoning, score_research, score_chat, word_count
    """
    clean_q = query.strip().lower()
    words = clean_q.split()
    word_count = len(words)

    # --- Signal 1: Hard-match exact known casual phrases ---
    if clean_q in _CHAT_EXACT:
        return {
            "intent": "GENERAL_CHAT",
            "confidence": 1.0,
            "reasoning": "Hard match: known casual phrase",
            "score_research": 0,
            "score_chat": 100,
            "word_count": word_count,
        }

    # --- Signal 1b: Pure emoji / reaction message ---
    emoji_only = re.fullmatch(r"[\U0001F300-\U0001FAFF\s\W]+", clean_q)
    if emoji_only and word_count <= 3:
        return {
            "intent": "GENERAL_CHAT",
            "confidence": 1.0,
            "reasoning": "Hard match: emoji/reaction message",
            "score_research": 0,
            "score_chat": 100,
            "word_count": word_count,
        }

    # --- Signal 3: Keyword weighted scoring ---
    score_research = 0
    score_chat = 0
    matched_research = []
    matched_chat = []

    for kw, weight in _RESEARCH_SIGNALS:
        if kw in clean_q:
            score_research += weight
            matched_research.append(kw)

    for kw, weight in _DEFINITION_SIGNALS:
        if kw in clean_q:
            score_chat += weight
            matched_chat.append(f"definition:{kw}")

    for kw, weight in _CASUAL_SIGNALS:
        if kw in clean_q:
            score_chat += weight
            matched_chat.append(f"casual:{kw}")

    # --- Signal 2: Structural heuristics ---
    # Short query bonus for chat
    if word_count <= 5:
        score_chat += 20
    elif word_count <= 10:
        score_chat += 10
    elif word_count >= 20:
        score_research += 8   # Long detailed query → likely research
    elif word_count >= 30:
        score_research += 15

    # Has question mark but short → chat
    if "?" in clean_q and word_count <= 12:
        score_chat += 6

    # Multiple sentences → more complex → research lean
    sentence_count = len(re.split(r"[.!?]+", clean_q.strip()))
    if sentence_count >= 3:
        score_research += 8

    # Explicit "how to" → usually chat (instructional, not research)
    if clean_q.startswith("how to") or " how to " in clean_q:
        score_chat += 10

    # Starts with known chat prefix
    for prefix in _CHAT_PREFIXES:
        if clean_q.startswith(prefix):
            score_chat += 6
            break

    # --- Definition Query with Complex Topic (special case) ---
    # "what is photosynthesis" → chat (score_research=0, boost chat)
    # "what is the commercial viability of solid state batteries" → research (score_research>=10, no chat boost)
    is_definitional = any(clean_q.startswith(p) for p in
                          ("what is", "what are", "explain", "define", "how does", "how do"))
    if is_definitional and score_research < 10:
        # Simple definition with no substantial research signals → boost chat
        score_chat += 15

    # --- Compute net score and confidence ---
    total = score_research + score_chat
    if total == 0:
        # No signals fired — default to chat for short, research for long
        intent = "GENERAL_CHAT" if word_count <= 15 else "DEEP_RESEARCH"
        confidence = 0.65
        reasoning = "No keyword signals — length heuristic fallback"
    else:
        ratio_research = score_research / total
        ratio_chat = score_chat / total

        if ratio_research >= 0.70:
            intent = "DEEP_RESEARCH"
            confidence = min(0.97, 0.70 + ratio_research * 0.30)
            reasoning = f"Research signals dominant: {matched_research[:4]}"
        elif ratio_chat >= 0.70:
            intent = "GENERAL_CHAT"
            confidence = min(0.97, 0.70 + ratio_chat * 0.30)
            reasoning = f"Chat signals dominant: {matched_chat[:4]}"
        else:
            # Ambiguous zone — will trigger LLM classifier
            intent = "AMBIGUOUS"
            confidence = max(ratio_research, ratio_chat)
            reasoning = f"Ambiguous — R:{score_research} C:{score_chat}"

    return {
        "intent": intent,
        "confidence": confidence,
        "reasoning": reasoning,
        "score_research": score_research,
        "score_chat": score_chat,
        "word_count": word_count,
    }


def _llm_classify(query: str) -> Dict[str, Any]:
    """
    Signal 4: LLM classifier — fires ONLY when multi-signal scoring is ambiguous.
    Uses a tight, deterministic prompt with temperature=0.0.
    """
    system_prompt = (
        "You are the VERAXIS Intent Classifier. Your sole job: classify one user message.\n\n"
        "Rules:\n"
        "- DEEP_RESEARCH: User wants a detailed multi-source report, literature/paper analysis, "
        "market comparison, empirical benchmarks, clinical/feasibility study, or technical deep dive "
        "requiring real external data retrieval.\n"
        "- GENERAL_CHAT: Greetings, casual chat, emotional messages, simple definitions "
        "('what is X in simple terms'), basic how-to, homework help, single-concept explanations, "
        "or anything a person would answer from general knowledge without looking up papers.\n\n"
        "IMPORTANT: When in doubt, choose GENERAL_CHAT. Reserve DEEP_RESEARCH only for clearly "
        "complex, multi-faceted research requests.\n\n"
        "Output ONLY valid JSON — no markdown, no backticks:\n"
        '{"intent": "GENERAL_CHAT" | "DEEP_RESEARCH", '
        '"extracted_topic": "2-5 word topic", '
        '"confidence": 0.95, '
        '"reasoning": "one line reason"}'
    )
    try:
        client = get_groq_client()
        response = client.chat.completions.create(
            model=key_manager.fast_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query},
            ],
            temperature=0.0,
            max_tokens=120,
        )
        content = strip_think_tags(response.choices[0].message.content or "")
        m = re.search(r"\{.*\}", content, re.DOTALL)
        if m:
            data = json.loads(m.group(0))
            if "intent" in data and data["intent"] in ("GENERAL_CHAT", "DEEP_RESEARCH"):
                return data
    except Exception as err:
        print(f"[Router] LLM classifier error: {err}")
    return {"intent": "GENERAL_CHAT", "confidence": 0.6, "reasoning": "LLM classifier fallback"}


def classify_query_intent(
    query: str,
    chat_history: Optional[List[Dict[str, str]]] = None,
) -> Dict[str, Any]:
    """
    Main entry point. Returns:
      {intent, extracted_topic, confidence, reasoning, routed_by}

    Routing pipeline:
      1. Multi-signal scoring
      2. If AMBIGUOUS (confidence 0.5-0.75) → LLM classifier (Signal 4)
      3. If still ambiguous → bias toward GENERAL_CHAT (Signal 5)
    """
    scored = _score_intent(query)
    intent = scored["intent"]
    confidence = scored["confidence"]
    routing_source = "multi_signal"

    if intent == "AMBIGUOUS":
        # Signal 4: LLM classifier
        llm_result = _llm_classify(query)
        intent = llm_result.get("intent", "GENERAL_CHAT")
        confidence = float(llm_result.get("confidence", 0.7))
        routing_source = "llm_classifier"
        scored["reasoning"] = llm_result.get("reasoning", "LLM classified")

    # Signal 5: Final confidence gate — bias toward GENERAL_CHAT on low confidence
    if confidence < 0.60 and intent == "DEEP_RESEARCH":
        intent = "GENERAL_CHAT"
        confidence = 0.65
        routing_source += "+confidence_gate"
        scored["reasoning"] += " → downgraded to GENERAL_CHAT (low confidence)"

    # Extract a clean topic label
    topic_words = query.strip().split()
    extracted_topic = " ".join(topic_words[:6]) if len(topic_words) > 6 else query.strip()

    return {
        "intent": intent,
        "extracted_topic": extracted_topic,
        "confidence": round(confidence, 3),
        "reasoning": scored["reasoning"],
        "routed_by": routing_source,
        "score_research": scored["score_research"],
        "score_chat": scored["score_chat"],
        "word_count": scored["word_count"],
    }


# ---------------------------------------------------------------------------
# 4. RESEARCH QUERY REPHRASER
# ---------------------------------------------------------------------------

def rephrase_query_for_research(query: str) -> Dict[str, str]:
    """
    Creates a clean short topic title + tight 3-5 word academic search phrase
    so Wikipedia, OpenAlex & arXiv return highly relevant on-topic sources.
    """
    client = get_groq_client()
    system_instruction = (
        "You optimize a user's question for encyclopedias and science search APIs.\n"
        "Return JSON ONLY with 3 fields:\n"
        '{"topic_title": "Short 2-5 word title", '
        '"enhanced_query": "Clear 1-sentence question in plain English", '
        '"search_keywords": "3 to 5 core topic words separated by spaces (no commas)"}\n'
        "Keep search_keywords clean and tight (example: 'solid state battery ceramic electrolyte')."
    )
    try:
        response = client.chat.completions.create(
            model=key_manager.fast_model,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": query},
            ],
            temperature=0.15,
            max_tokens=200,
        )
        content = strip_think_tags(response.choices[0].message.content or "")
        m = re.search(r"\{.*\}", content, re.DOTALL)
        if m:
            data = json.loads(m.group(0))
            if "enhanced_query" in data:
                return data
    except Exception as err:
        print(f"[Router] Rephrase fallback: {err}")
    short = " ".join(query.strip().split()[:5])
    return {"topic_title": short, "enhanced_query": query, "search_keywords": short}


# ---------------------------------------------------------------------------
# 5. FAST CHAT ENGINE (with live streaming support)
# ---------------------------------------------------------------------------

FAST_CHAT_SYSTEM_PROMPT = (
    "You are Veraxis, a friendly AI assistant. Follow these rules WITHOUT EXCEPTION:\n\n"
    "RESPONSE STYLE:\n"
    "1. Write simply — a smart 10th-class student must understand every sentence.\n"
    "2. Match the user's language style: English, Hinglish, casual, formal — mirror it.\n"
    "3. For greetings / casual / emotional messages → respond warmly in 1-3 sentences MAX. No lists, no headers.\n"
    "4. For simple questions → answer directly in 2-4 short sentences or a few crisp bullet points.\n"
    "5. For how-to / coding / technical explanations → be clear and step-by-step but concise.\n\n"
    "ABSOLUTE PROHIBITIONS (never break these):\n"
    "- NEVER fabricate citations, percentages, statistics, superscripts, or footnote numbers.\n"
    "- NEVER produce 'Executive Summary', 'Core Finding', 'Literature Review', 'Key Metrics', "
    "  or any research-report structure for a casual or conversational message.\n"
    "- NEVER use corporate jargon or academic hedging ('it is worth noting', 'it has been observed').\n"
    "- NEVER mention internal modes, routing decisions, or system architecture.\n"
    "- NEVER pad a short answer with unnecessary context, caveats, or background.\n\n"
    "TONE EXAMPLES:\n"
    "  User: 'accha good i am happy' → 'That's awesome to hear! Hope your day stays great 😊'\n"
    "  User: 'what is photosynthesis' → Short, clear 2-3 sentence explanation. No citations.\n"
    "  User: 'explain quantum computing simply' → Analogy-based, plain English, 4-6 sentences max.\n"
    "  User: 'write me a python function to reverse a string' → Clean code with a 1-line explanation."
)


def prepare_fast_chat_messages(messages: List[Dict[str, str]]) -> List[Dict[str, str]]:
    """
    Build sanitized multi-turn message list for fast chat.
    - Strips research_dossier entries (they pollute chat context).
    - Caps content length to avoid context blowup.
    - Keeps last 10 clean chat turns.
    """
    clean_history = []
    for m in messages[-14:]:
        if not isinstance(m, dict):
            continue
        if m.get("type") == "research_dossier":
            continue
        if "role" not in m or "content" not in m or not isinstance(m.get("content"), str):
            continue
        role = "assistant" if m["role"] == "bot" else m["role"]
        if role in ("user", "assistant"):
            content = m["content"].strip()
            if content:
                clean_history.append({"role": role, "content": content[:2500]})

    # Keep last 10 turns after filtering
    clean_history = clean_history[-10:]
    return [{"role": "system", "content": FAST_CHAT_SYSTEM_PROMPT}] + clean_history


def stream_fast_chat_response(messages: List[Dict[str, str]]) -> Iterator[str]:
    """
    Live streaming generator for GENERAL_CHAT.
    Yields clean text tokens one by one for real-time Streamlit rendering.
    Usage:
        for token in stream_fast_chat_response(messages):
            accumulated += token
            placeholder.markdown(accumulated + "▌")
    """
    full_messages = prepare_fast_chat_messages(messages)
    yield from stream_groq_tokens(
        messages=full_messages,
        model=key_manager.fast_model,
        temperature=0.35,
        max_tokens=600,
    )


def generate_fast_chat_response(messages: List[Dict[str, str]]) -> str:
    """
    Synchronous (non-streaming) fast chat response — kept for compatibility.
    Prefer stream_fast_chat_response for live UI rendering.
    """
    client = get_groq_client()
    full_messages = prepare_fast_chat_messages(messages)
    try:
        response = client.chat.completions.create(
            model=key_manager.fast_model,
            messages=full_messages,
            temperature=0.35,
            max_tokens=600,
        )
        return strip_think_tags(response.choices[0].message.content or "")
    except Exception as e:
        return f"Temporary error: {str(e)}. Please retry."
