"""
VERAXIS AI — Dual-Engine Router & Fast Chat LLM
1. Intent Classifier: Categorizes user queries into GENERAL_CHAT vs DEEP_RESEARCH.
2. Fast Chat Engine: Ultra-fast direct conversational responses via Groq LPU.
"""

import json
import re
from typing import Dict, Any, List
from openai import OpenAI

try:
    from backend.config import key_manager
except ImportError:
    from config import key_manager

def get_groq_client() -> OpenAI:
    """Return an OpenAI client configured for Groq with key rotation."""
    key = key_manager.get_active_groq_key()
    return OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=key
    )

def classify_query_intent(query: str, chat_history: List[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Classifies user intent using instant heuristics and Groq fast inference:
    - GENERAL_CHAT: Casual banter, quick definitions, greetings, programming assistance, simple facts.
    - DEEP_RESEARCH: Technical feasibility, comparative benchmarks, multi-paper scientific inquiries, commercial market viability.
    """
    clean_q = query.strip().lower()
    
    # Fast-path for common greetings & conversational queries (0ms latency, zero API roundtrip)
    common_chats = [
        "hello", "hi", "hey", "hola", "namaste", "good morning", "good evening",
        "good afternoon", "how are you", "how are you doing", "what's up", "whats up",
        "who are you", "what can you do", "help", "thanks", "thank you", "bye",
        "goodbye", "test", "ping", "ok", "okay", "sup", "yo"
    ]
    if clean_q in common_chats or any(clean_q.startswith(g + " ") for g in ["hello", "hi", "hey"]):
        return {
            "intent": "GENERAL_CHAT",
            "extracted_topic": query,
            "confidence": 1.0,
            "reasoning": "Instant zero-latency casual greeting match"
        }

    client = get_groq_client()
    system_prompt = (
        "You are the VERAXIS AI Autonomous Intent Classifier.\n"
        "Analyze the user query. PRIORITIZE 'DEEP_RESEARCH' for ANY question that is researchable: scientific topics, engineering, technical mechanisms, quantitative parameters, academic questions, comparative evaluations, technology benchmarks, or domain hypotheses.\n"
        "Only classify as 'GENERAL_CHAT' if the query is purely casual greeting, conversational pleasantry, or brief non-technical banter.\n\n"
        "Respond ONLY with valid JSON (no markdown formatting, no code block backticks):\n"
        '{"intent": "GENERAL_CHAT" | "DEEP_RESEARCH", "extracted_topic": "topic string", "confidence": 0.95, "reasoning": "brief rationale"}'
    )

    try:
        response = client.chat.completions.create(
            model=key_manager.fast_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ],
            temperature=0.0,
            max_tokens=100
        )
        content = response.choices[0].message.content.strip()
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group(0))
            if "intent" in data and data["intent"] in ["GENERAL_CHAT", "DEEP_RESEARCH"]:
                return data
    except Exception:
        pass

    # Heuristic fallback for scientific & empirical queries (High Priority for Research)
    research_indicators = [
        "commercial", "viability", "benchmark", "paper", "arxiv",
        "quantum", "battery", "feasibility", "versus", "vs", "forecast",
        "solid-state", "pqc", "neuromorphic", "empirical", "comparison",
        "density", "electrolyte", "superconductor", "cryptography", "clinical trial",
        "crispr", "perovskite", "fusion", "photovoltaic", "algorithm", "bandwidth",
        "mechanism", "physics", "chemistry", "model", "analysis", "system", "rate",
        "how does", "what is the mechanism", "difference", "study", "research"
    ]
    is_deep = any(term in clean_q for term in research_indicators) or len(clean_q.split()) >= 4
    
    return {
        "intent": "DEEP_RESEARCH" if is_deep else "GENERAL_CHAT",
        "extracted_topic": query,
        "confidence": 0.90,
        "reasoning": "Scientific marker and structural analysis (Research Priority)"
    }


def rephrase_query_for_research(query: str) -> Dict[str, str]:
    """
    Rephrases and expands user query into an authoritative, information-dense
    academic research directive with specific arXiv domain keywords.
    """
    client = get_groq_client()
    system_instruction = (
        "You are an elite scientific research prompt engineer for multi-agent CrewAI synthesis. "
        "Transform the user's inquiry into an authoritative, deeply structured scientific research inquiry of 1 to 2 complete sentences "
        "with precise technical and domain terminology, plus 4-6 academic search keywords. "
        "Output JSON ONLY: {\"enhanced_query\": \"...\", \"search_keywords\": \"...\"}"
    )
    try:
        response = client.chat.completions.create(
            model=key_manager.fast_model,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": query}
            ],
            temperature=0.2,
            max_tokens=250
        )
        content = response.choices[0].message.content.strip()
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group(0))
            if "enhanced_query" in data:
                return data
    except Exception:
        pass
    return {"enhanced_query": query, "search_keywords": query}

def generate_fast_chat_response(messages: List[Dict[str, str]]) -> str:
    """
    Generate an instant, high-quality conversational response for GENERAL_CHAT queries.
    """
    client = get_groq_client()
    system_instruction = {
        "role": "system",
        "content": (
            "You are VERAXIS AI, a witty, brilliant, and polite technical intelligence assistant. "
            "You speak in clear, natural Hinglish or English. "
            "Answer directly without fluff. If the user asks for deep scientific papers or market analysis, "
            "let them know you can activate your 3-Tier Multi-Agent Research Crew anytime."
        )
    }
    
    # Filter only role and content
    clean_history = []
    for m in messages[-6:]:
        if isinstance(m, dict) and "role" in m and "content" in m and isinstance(m["content"], str):
            clean_history.append({"role": m["role"], "content": m["content"]})
            
    full_messages = [system_instruction] + clean_history
    
    try:
        response = client.chat.completions.create(
            model=key_manager.fast_model,
            messages=full_messages,
            temperature=0.3,
            max_tokens=150
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Encountered temporary error: {str(e)}. Please retry."
