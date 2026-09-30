"""
MULTIINTEL AI — Dual-Engine Router & Fast Chat LLM
1. Intent Classifier: Categorizes user queries into GENERAL_CHAT vs DEEP_RESEARCH.
2. Fast Chat Engine: Ultra-fast direct conversational responses via Groq LPU.
"""

import json
import re
from typing import Dict, Any, List
from config import key_manager
from openai import OpenAI

def get_groq_client() -> OpenAI:
    """Return an OpenAI client configured for Groq with key rotation."""
    key = key_manager.get_active_groq_key()
    return OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=key
    )

def classify_query_intent(query: str, chat_history: List[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Classifies user intent using Groq fast inference:
    - GENERAL_CHAT: Casual banter, quick definitions, greetings, programming assistance, simple facts.
    - DEEP_RESEARCH: Technical feasibility, comparative benchmarks, multi-paper scientific inquiries, commercial market viability.
    """
    client = get_groq_client()
    system_prompt = (
        "You are the MultiIntel Autonomous Intent Classifier.\n"
        "Analyze the user query and classify it into:\n"
        "- 'GENERAL_CHAT': Casual greetings, personal questions, simple facts, quick code fixes, conversational banter.\n"
        "- 'DEEP_RESEARCH': Complex scientific topics, commercial feasibility, empirical benchmarks, market analysis, paper reviews, future forecasts.\n\n"
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
            max_tokens=120
        )
        content = response.choices[0].message.content.strip()
        # Regex extraction to handle any potential backticks or text wrapper
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group(0))
            if "intent" in data and data["intent"] in ["GENERAL_CHAT", "DEEP_RESEARCH"]:
                return data
    except Exception as e:
        pass

    # Heuristic fallback
    research_indicators = [
        "commercial", "viability", "benchmark", "market", "paper", "arxiv",
        "quantum", "battery", "architecture", "patent", "cost", "feasibility",
        "versus", "vs", "forecast", "solid-state", "pqc", "neuromorphic"
    ]
    query_lower = query.lower()
    is_deep = any(term in query_lower for term in research_indicators) or len(query.split()) >= 8
    
    return {
        "intent": "DEEP_RESEARCH" if is_deep else "GENERAL_CHAT",
        "extracted_topic": query,
        "confidence": 0.85,
        "reasoning": "Keyword-density & structural intent detection"
    }

def generate_fast_chat_response(messages: List[Dict[str, str]]) -> str:
    """
    Generate an instant, high-quality conversational response for GENERAL_CHAT queries.
    """
    client = get_groq_client()
    system_instruction = {
        "role": "system",
        "content": (
            "You are MULTIINTEL AI, a witty, brilliant, and polite technical intelligence assistant. "
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
            max_tokens=600
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Encountered temporary error: {str(e)}. Please retry."
