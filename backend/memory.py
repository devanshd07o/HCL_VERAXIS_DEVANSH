"""
VERAXIS AI — Rolling Memory & Epistemic Intent Engine
1. Progressive Rolling Memory: Compresses multi-turn conversation into a persistent, high-density summary.
2. Contextual Query Disambiguation & Reprompting: Resolves ambiguous follow-up pronouns ('it', 'that', 'its limits')
   into self-contained, search-optimized academic queries for arXiv, OpenAlex, and Semantic Scholar.
3. Epistemic Humility & Anti-Hallucination Guardrails: Prevents false certainty without verified empirical citations.
"""

import json
import os
import re
from typing import Dict, Any, List, Optional

try:
    from backend.config import key_manager
    from backend.router import get_groq_client, strip_think_tags
except ImportError:
    from config import key_manager
    from router import get_groq_client, strip_think_tags


# In-memory session summary store as server-side fallback
_SESSION_SUMMARIES: Dict[str, str] = {}


def get_stored_session_summary(session_id: Optional[str]) -> str:
    """Retrieve rolling summary from server cache if session_id is provided."""
    if not session_id:
        return ""
    return _SESSION_SUMMARIES.get(session_id, "")


def store_session_summary(session_id: Optional[str], summary: str) -> None:
    """Persist rolling summary in server cache."""
    if session_id and summary:
        _SESSION_SUMMARIES[session_id] = summary
        # Evict oldest if cache grows beyond 500 sessions
        if len(_SESSION_SUMMARIES) > 500:
            oldest_key = next(iter(_SESSION_SUMMARIES))
            _SESSION_SUMMARIES.pop(oldest_key, None)


# ============================================================================
# 1. Progressive Rolling Memory Summarizer
# ============================================================================

def update_rolling_memory(
    previous_summary: str,
    user_query: str,
    assistant_response: str,
    sources: Optional[List[Dict[str, Any]]] = None,
    session_id: Optional[str] = None,
    override_key: Optional[str] = None,
) -> str:
    """
    Updates the rolling conversation summary after every completed turn.
    Compresses older context while keeping the latest turn high-resolution.
    """
    if not user_query.strip():
        return previous_summary

    # Extract source titles if available
    sources_note = ""
    if sources:
        titles = [s.get("title", "") for s in sources[:4] if s.get("title")]
        if titles:
            sources_note = f"\nCited papers: {'; '.join(titles)}"

    # Truncate inputs to prevent prompt bloat
    clean_prev = (previous_summary or "").strip()[:1500]
    clean_q = user_query.strip()[:600]
    clean_ans = assistant_response.strip()[:1200]

    system_instruction = (
        "You maintain the continuous Rolling Memory for VERAXIS AI.\n"
        "Your task: Update the concise conversation memory after the latest turn.\n"
        "RULES:\n"
        "1. Write 2-4 dense, bullet-point sentences max.\n"
        "2. Record: established facts/topics, specific algorithms/entities discussed, papers cited, and user preferences.\n"
        "3. If previous memory exists, consolidate older points into high-density state and append the latest conclusion.\n"
        "4. Output PLAIN TEXT summary bullets only. No conversational commentary, no prefixes like 'Here is the summary'."
    )

    user_prompt = (
        f"PREVIOUS ROLLING MEMORY:\n{clean_prev or '(None, start of conversation)'}\n\n"
        f"LATEST TURN:\n"
        f"User: {clean_q}\n"
        f"Assistant: {clean_ans}{sources_note}\n\n"
        "Generate the updated, high-density Rolling Memory now."
    )

    try:
        client = get_groq_client(override_key=override_key)
        response = client.chat.completions.create(
            model=key_manager.fast_model,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.1,
            max_tokens=220
        )
        updated = strip_think_tags(response.choices[0].message.content or "").strip()
        if updated:
            store_session_summary(session_id, updated)
            return updated
    except Exception as err:
        print(f"[RollingMemory] Update fallback due to: {err}")

    # Deterministic fallback
    fallback_line = f"• Inquiry on '{clean_q[:80]}': synthesized answer provided."
    if clean_prev:
        fallback_summary = f"{clean_prev}\n{fallback_line}"
    else:
        fallback_summary = fallback_line
    
    store_session_summary(session_id, fallback_summary)
    return fallback_summary


# ============================================================================
# 2. Contextual Query Disambiguation & Reprompting ("Reprompter")
# ============================================================================

AMBIGUOUS_PRONOUNS = {
    "it", "this", "that", "its", "their", "them", "these", "those",
    "he", "she", "they", "here", "there", "the previous", "above"
}

def is_ambiguous_query(query: str) -> bool:
    """Detect if query relies heavily on context (pronouns, ellipses, short follow-ups)."""
    words = re.findall(r"\b[a-zA-Z]+\b", query.lower())
    if len(words) <= 3:
        return True
    if any(p in words for p in AMBIGUOUS_PRONOUNS):
        return True
    followup_patterns = [
        r"^(and|also|what about|how about|why|compare|versus|vs|explain|how so|tell me more|limitations\??)",
        r"\b(its|their|the second|the first|the paper|the author|the author's)\b"
    ]
    return any(re.search(p, query.lower()) for p in followup_patterns)


def disambiguate_and_classify_query(
    query: str,
    rolling_summary: str = "",
    recent_history: Optional[List[Dict[str, str]]] = None,
    force_research: bool = False,
    override_key: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Analyzes intent, resolves follow-up ambiguities into a standalone academic query,
    and extracts targeted search keywords using the rolling conversation memory.
    """
    clean_q = query.strip()
    clean_lower = clean_q.lower()

    # Fast check for simple zero-latency greetings
    common_greetings = [
        "hello", "hi", "hey", "hola", "namaste", "good morning", "good evening",
        "good afternoon", "how are you", "who are you", "what can you do", "help",
        "thanks", "thank you", "bye", "goodbye", "ping", "test", "ok", "okay"
    ]
    if clean_lower in common_greetings or any(clean_lower.startswith(g + " ") for g in ["hello", "hi", "hey"]):
        return {
            "intent": "GENERAL_CHAT",
            "standalone_query": clean_q,
            "search_keywords": clean_q,
            "display_topic": clean_q,
            "is_ambiguous": False,
            "confidence": 1.0,
            "reasoning": "Standard conversational greeting"
        }

    # Extract last user topic or recent turn if available
    recent_context_lines = []
    if recent_history:
        for turn in recent_history[-4:]:
            r = turn.get("role", "user")
            c = str(turn.get("content", ""))[:200]
            recent_context_lines.append(f"{r}: {c}")
    recent_context_str = "\n".join(recent_context_lines)

    memory_context = rolling_summary.strip()
    if not memory_context and recent_context_str:
        memory_context = recent_context_str

    ambiguous = is_ambiguous_query(clean_q)

    # If force_research is explicitly requested, honor intent
    intent_constraint = "You MUST set 'intent': 'DEEP_RESEARCH' because research mode is activated.\n" if force_research else ""

    system_instruction = (
        "You are the VERAXIS Intent Classifier & Contextual Reprompting Engine.\n"
        f"{intent_constraint}"
        "Your role:\n"
        "1. INTENT: Classify as 'DEEP_RESEARCH' (scientific analysis, papers, technical comparison, benchmarks, empirical claims) or 'GENERAL_CHAT' (everyday talk, simple definitions, summaries of conversation).\n"
        "2. STANDALONE_QUERY: If the user query is ambiguous, contains pronouns ('it', 'that', 'its limits'), or is a follow-up, REWRITE it into a fully self-contained, standalone question incorporating the rolling conversation memory.\n"
        "   Example: Previous memory about 'Mamba State Space Models' + Query: 'What are its limitations?' -> Standalone Query: 'What are the architectural and empirical limitations of Mamba state space models?'\n"
        "3. SEARCH_KEYWORDS: 3 to 5 core academic topic keywords separated by spaces (targeted for arXiv & OpenAlex).\n"
        "4. DISPLAY_TOPIC: Clean, professional 2-5 word title.\n\n"
        "Respond ONLY in valid JSON format:\n"
        '{"intent": "GENERAL_CHAT" | "DEEP_RESEARCH", "standalone_query": "...", "search_keywords": "...", "display_topic": "...", "confidence": 0.95, "reasoning": "..."}'
    )

    user_payload = (
        f"ROLLING MEMORY CONTEXT:\n{memory_context or '(No prior context)'}\n\n"
        f"CURRENT USER QUESTION: '{clean_q}'\n\n"
        "Resolve pronouns, classify intent, and output JSON."
    )

    try:
        client = get_groq_client(override_key=override_key)
        response = client.chat.completions.create(
            model=key_manager.fast_model,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_payload}
            ],
            temperature=0.0,
            max_tokens=220
        )
        content = strip_think_tags(response.choices[0].message.content or "").strip()
        json_match = re.search(r"\{[\s\S]*\}", content)
        if json_match:
            data = json.loads(json_match.group(0))
            if "standalone_query" in data and "intent" in data:
                data["is_ambiguous"] = ambiguous
                return data
    except Exception as err:
        print(f"[Reprompter] Reprompting fallback: {err}")

    # Robust Fallback
    keywords = " ".join(clean_q.split()[:5])
    return {
        "intent": "DEEP_RESEARCH" if force_research else "GENERAL_CHAT",
        "standalone_query": clean_q,
        "search_keywords": keywords,
        "display_topic": clean_q,
        "is_ambiguous": ambiguous,
        "confidence": 0.8,
        "reasoning": "Rule-based fallback"
    }


# ============================================================================
# 3. Epistemic Humility & Anti-Hallucination Directives
# ============================================================================

EPISTEMIC_HUMILITY_DIRECTIVE = (
    "\n\nCRITICAL SCIENTIFIC EPISTEMIC RULES (ANTI-HALLUCINATION):\n"
    "1. ZERO UNGROUNDED CERTAINTY: Never declare 100% certainty or absolute truth for an empirical claim unless supported by an explicitly numbered source from the retrieved literature [n].\n"
    "2. EVIDENTIARY HEDGING: When scientific literature has gaps, conflicting data, or limits, state clearly: 'Current peer-reviewed literature does not conclusively establish...' or 'Preliminary benchmarks indicate X, though verification under noise models remains open.'\n"
    "3. CITATION RIGOR: Every factual metric, algorithm property, sample size, and finding must end with its exact source tag [n]. Never invent papers, authors, or DOI references.\n"
    "4. ADAPTIVE CONVERSATION: If the user asks a follow-up or conversational question, answer directly with intellectual clarity and humility, referencing prior findings when relevant."
)
