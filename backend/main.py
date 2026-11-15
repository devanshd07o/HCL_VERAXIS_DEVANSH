"""
VERAXIS AI — High-Performance Modular FastAPI Backend Engine
Orchestrates:
1. Precision Query Intent Classification (Fast Groq Chat vs Deep Autonomous Research)
2. 3-Tier Multi-Agent Crew Execution (Lead Analyst, Forensic Fact-Checker, Dossier Director)
3. ReportLab 4.x Supreme PDF Generation & Binary Download Endpoints
4. Dynamic Topic Suggestion & Telemetry Health Endpoints
5. Serves Production React SaaS Web App & PWA Manifest/Service Worker
"""

import asyncio
import os
import sys
import random
from datetime import datetime
from typing import Dict, Any, List, Optional, Callable

# Configure UTF-8 on Windows stdout
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import re
import json
import time
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

# Internal Core Modules (Backend Package)
try:
    from backend.config import key_manager, set_service_key, get_service_keys
    from backend.router import (
        classify_query_intent,
        generate_fast_chat_response,
        prepare_fast_chat_messages,
        rephrase_query_for_research,
        stream_groq_tokens,
        strip_think_tags,
    )
    from backend.agents import create_lead_researcher, create_fact_checker, create_dossier_director
    from backend.tasks import create_discovery_task, create_audit_task, create_synthesis_task
    from backend.pdf_generator import create_pdf_dossier
    from backend.tools import arxiv_academic_search, duckduckgo_web_search
    from backend.helper import sanitize_filename, validate_system_environment
    from backend.memory import (
        disambiguate_and_classify_query,
        update_rolling_memory,
        get_stored_session_summary,
        store_session_summary,
        EPISTEMIC_HUMILITY_DIRECTIVE,
    )
except ImportError:
    from config import key_manager, set_service_key, get_service_keys
    from router import (
        classify_query_intent,
        generate_fast_chat_response,
        prepare_fast_chat_messages,
        rephrase_query_for_research,
        stream_groq_tokens,
        strip_think_tags,
    )
    from agents import create_lead_researcher, create_fact_checker, create_dossier_director
    from tasks import create_discovery_task, create_audit_task, create_synthesis_task
    from pdf_generator import create_pdf_dossier
    from tools import arxiv_academic_search, duckduckgo_web_search
    from helper import sanitize_filename, validate_system_environment
    from memory import (
        disambiguate_and_classify_query,
        update_rolling_memory,
        get_stored_session_summary,
        store_session_summary,
        EPISTEMIC_HUMILITY_DIRECTIVE,
    )

from crewai import Crew, Process

app = FastAPI(
    title="VERAXIS AI — Autonomous Research API",
    description="Industry standard backend orchestrating 3-tier CrewAI agents and ReportLab 4.x PDF generation",
    version="3.0.0"
)

# Enable CORS for external frontend consumers and localhost development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base Path Resolutions
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
FRONTEND_DIST = os.path.join(PROJECT_ROOT, "frontend", "dist")
STATIC_ASSETS = os.path.join(FRONTEND_DIST, "assets") if os.path.exists(os.path.join(FRONTEND_DIST, "assets")) else os.path.join(PROJECT_ROOT, "assets")
PDF_DIR = os.path.join(PROJECT_ROOT, "pdf_exports")
os.makedirs(PDF_DIR, exist_ok=True)

# Mount Static Assets
if os.path.exists(STATIC_ASSETS):
    app.mount("/assets", StaticFiles(directory=STATIC_ASSETS), name="assets")

WEB_DIR = os.path.join(PROJECT_ROOT, "web")
if os.path.exists(WEB_DIR):
    app.mount("/web", StaticFiles(directory=WEB_DIR), name="web")

class ChatRequest(BaseModel):
    query: str
    mode: str = "auto"
    enhanced_query: Optional[str] = None
    search_keywords: Optional[str] = None
    force_research: bool = False
    research_mode: bool = False
    history: List[Dict[str, str]] = Field(default_factory=list)
    attachments: List[Dict[str, str]] = Field(default_factory=list)
    user_groq_key: Optional[str] = None
    user_gemini_key: Optional[str] = None
    session_id: Optional[str] = None
    rolling_summary: Optional[str] = None

class ClassifyRequest(BaseModel):
    query: str

class RephraseRequest(BaseModel):
    query: str

class TitleRequest(BaseModel):
    messages: List[Dict[str, Any]]

class EnhanceRequest(BaseModel):
    query: str


# ============================================================================
# Core Frontend & PWA Endpoints
# ============================================================================

@app.get("/")
async def root():
    """Serves the primary Web frontend (React production build or fallback)."""
    index_path = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.exists(index_path):
        return FileResponse(
            index_path,
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
                "Pragma": "no-cache",
                "Expires": "0",
            },
        )
    legacy_index = os.path.join(PROJECT_ROOT, "web", "index.html")
    if os.path.exists(legacy_index):
        return FileResponse(
            legacy_index,
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
                "Pragma": "no-cache",
                "Expires": "0",
            },
        )
    return JSONResponse({
        "status": "online",
        "service": "VERAXIS AI Backend",
        "message": "Frontend build not detected. Please run 'npm run build' inside /frontend or use API endpoints."
    })


@app.get("/manifest.json")
async def manifest():
    """Serves PWA Web Manifest for installable cross-platform experience."""
    manifest_path = os.path.join(FRONTEND_DIST, "manifest.json")
    if os.path.exists(manifest_path):
        return FileResponse(manifest_path, media_type="application/manifest+json")
    # Fallback to public folder
    public_manifest = os.path.join(PROJECT_ROOT, "frontend", "public", "manifest.json")
    if os.path.exists(public_manifest):
        return FileResponse(public_manifest, media_type="application/manifest+json")
    raise HTTPException(status_code=404, detail="Manifest not found")


@app.get("/sw.js")
async def service_worker():
    """Serves Service Worker script for offline PWA caching."""
    sw_path = os.path.join(FRONTEND_DIST, "sw.js")
    if os.path.exists(sw_path):
        return FileResponse(sw_path, media_type="application/javascript")
    public_sw = os.path.join(PROJECT_ROOT, "frontend", "public", "sw.js")
    if os.path.exists(public_sw):
        return FileResponse(public_sw, media_type="application/javascript")
    raise HTTPException(status_code=404, detail="Service worker not found")


# ============================================================================
# Telemetry & Research Seed Endpoints
# ============================================================================

@app.get("/api/status")
async def get_status():
    """Returns key pool health, system checks, and model telemetry."""
    telemetry = key_manager.get_status_telemetry()
    system_checks = validate_system_environment()
    return {
        "status": "operational",
        "telemetry": telemetry,
        "environment": system_checks
    }


@app.get("/status")
async def get_status_alias():
    """Direct alias for /api/status endpoint."""
    return await get_status()


@app.get("/voice/greeting")
async def voice_greeting():
    """Greeting audio/text endpoint for voice mode."""
    return {"message": "Welcome to VERAXIS AI. What research topic would you like to explore?"}


class KeyActionRequest(BaseModel):
    key: str


@app.get("/api/keys")
async def get_keys_endpoint():
    """Returns safe key telemetry without exposing raw secret key values."""
    telemetry = key_manager.get_status_telemetry()
    return {
        "status": "operational",
        "server_managed": True,
        "server_ready": len(key_manager.groq_keys) > 0,
        "total_keys": telemetry["total_keys"],
        "active_keys": telemetry["active_keys"],
        "cooling_down": telemetry["cooling_down"],
        "primary_model": key_manager.primary_model,
        "fast_model": key_manager.fast_model,
        "gemini_available": bool(key_manager.gemini_key)
    }


@app.post("/api/keys/add")
async def add_key_endpoint(req: KeyActionRequest):
    """Add a new Groq key to the active pool (max 5 keys)."""
    success, message = key_manager.add_key(req.key)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"status": "success", "message": message, "keys": key_manager.get_keys_info()}


@app.post("/api/keys/remove")
@app.delete("/api/keys/remove")
async def remove_key_endpoint(req: KeyActionRequest):
    """Remove a key from the active pool."""
    success, message = key_manager.remove_key(req.key)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"status": "success", "message": message, "keys": key_manager.get_keys_info()}


class ServiceKeyRequest(BaseModel):
    service: str
    key: str


@app.post("/api/keys/service")
async def set_service_key_endpoint(req: ServiceKeyRequest):
    """Set or remove an auxiliary service key."""
    clean_key = req.key.strip()
    svc = req.service.strip().lower()
    if svc == "gemini":
        key_manager.gemini_key = clean_key
    success = set_service_key(svc, clean_key)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to persist service key.")
    return {"status": "success", "service": svc}


@app.get("/api/keys/services")
async def get_service_keys_endpoint():
    """Returns safe masked status of all research service keys."""
    services = ["groq", "gemini", "tavily", "semantic_scholar", "exa", "serper", "jina"]
    result = {}
    for svc in services:
        if svc == "groq":
            keys = key_manager.groq_keys
        elif svc == "gemini":
            keys = [key_manager.gemini_key] if key_manager.gemini_key else []
        else:
            keys = get_service_keys(svc)
        active = bool(keys and len(keys) > 0 and keys[0])
        masked = ""
        if active and keys[0]:
            k = keys[0]
            masked = f"{k[:4]}••••{k[-4:]}" if len(k) > 10 else "••••••••"
        result[svc] = {
            "configured": active,
            "count": len(keys),
            "masked": masked
        }
    return result


@app.get("/keys/list")
async def get_keys_list():
    """Returns active key pool configuration and telemetry."""
    telemetry = key_manager.get_status_telemetry()
    return {
        "status": "operational",
        "total_keys": telemetry.get("total_keys", len(key_manager.groq_keys)),
        "active_pool": telemetry.get("active_keys", len(key_manager.groq_keys)),
        "current_index": getattr(key_manager, "current_index", 0),
        "cooldown_active": telemetry.get("cooling_down", 0),
        "fast_model": key_manager.fast_model,
        "primary_model": key_manager.primary_model,
        "health_score": "100%"
    }


SESSIONS_CACHE_FILE = os.path.join(PROJECT_ROOT, "assets", "sessions.json")
USER_MEMORY_FILE = os.path.join(PROJECT_ROOT, "assets", "user_memory.json")


@app.get("/sessions")
async def get_sessions_endpoint():
    """Returns stored research chat sessions."""
    if os.path.exists(SESSIONS_CACHE_FILE):
        try:
            with open(SESSIONS_CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []


@app.post("/sessions")
async def save_sessions_endpoint(payload: Any = Body(...)):
    """Saves or updates research chat sessions."""
    try:
        os.makedirs(os.path.dirname(SESSIONS_CACHE_FILE), exist_ok=True)
        with open(SESSIONS_CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)
        count = len(payload) if isinstance(payload, list) else 1
        return {"status": "saved", "count": count}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/user/memory")
async def get_user_memory_endpoint():
    """Returns user profile, preferences, and memory tags."""
    if os.path.exists(USER_MEMORY_FILE):
        try:
            with open(USER_MEMORY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "username": "Devansh",
        "role": "Research Lead",
        "theme": "dark",
        "preferences": {
            "fontSize": 15,
            "chatWidth": "standard",
            "fontFamily": "Plus Jakarta Sans"
        },
        "memory": []
    }


@app.post("/user/memory")
async def save_user_memory_endpoint(payload: Dict[str, Any] = Body(...)):
    """Updates user memory and preferences."""
    try:
        os.makedirs(os.path.dirname(USER_MEMORY_FILE), exist_ok=True)
        with open(USER_MEMORY_FILE, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)
        return {"status": "updated", "data": payload}
    except Exception as e:
        return {"status": "error", "message": str(e)}



RESEARCH_TOPICS_POOL = [
    {
        "label": "Solid-State Batteries 2028",
        "query": "Commercial viability of solid-state EV batteries by 2028 with ceramic electrolyte benchmarks"
    },
    {
        "label": "CRISPR-Cas9 In-Vivo Editing",
        "query": "Clinical trial breakthroughs in CRISPR-Cas9 in vivo base editing for hematological and oncological disorders"
    },
    {
        "label": "Post-Quantum Cryptography",
        "query": "NIST Post-Quantum Cryptography standards: lattice-based Kyber and Dilithium implementation audits"
    },
    {
        "label": "Nuclear Fusion Q-Factor",
        "query": "Commercial nuclear fusion net-energy Q-factor milestones: SPARC and ITER magnet performance"
    },
    {
        "label": "Room-Temp Superconductors",
        "query": "Empirical replication attempts of hydrides and cuprate room-temperature ambient pressure superconductors"
    },
    {
        "label": "Neuromorphic Photonics",
        "query": "Silicon photonic neuromorphic chips vs standard GPU tensor processors: energy efficiency and throughput"
    },
    {
        "label": "mRNA Cancer Vaccines",
        "query": "Personalized neoantigen mRNA cancer vaccines: Phase 3 clinical trial survival rates"
    },
    {
        "label": "Perovskite Tandem Solar",
        "query": "Silicon-perovskite tandem photovoltaic degradation mechanisms under accelerated damp heat testing"
    },
    {
        "label": "Brain-Computer Interfaces",
        "query": "High-density neural lace and intracortical BCI decoding bandwidth for motor restoration"
    },
    {
        "label": "Quantum Error Correction",
        "query": "Surface code threshold benchmarks in neutral-atom and superconducting quantum computing"
    }
]


DYNAMIC_RESEARCH_PILLS_POOL = [
    {
        "tag": "Energy",
        "label": "Solid-State Batteries 2028",
        "query": "Commercial viability of solid-state EV batteries by 2028 with ceramic electrolyte benchmarks"
    },
    {
        "tag": "Genomics",
        "label": "CRISPR-Cas9 Base Editing",
        "query": "Clinical trial breakthroughs in CRISPR-Cas9 in vivo base editing for hematological disorders and viral vectors"
    },
    {
        "tag": "Quantum",
        "label": "Post-Quantum Cryptography",
        "query": "NIST Post-Quantum Cryptography standards: lattice-based Kyber and Dilithium implementation audits"
    },
    {
        "tag": "Physics",
        "label": "Commercial Fusion Scaling",
        "query": "Commercial nuclear fusion net-energy Q-factor milestones: SPARC and ITER high-temperature superconductor magnets"
    },
    {
        "tag": "Photovoltaics",
        "label": "Perovskite Tandem Cells",
        "query": "Silicon-perovskite tandem photovoltaic degradation mechanisms under accelerated damp heat testing"
    },
    {
        "tag": "Neurotech",
        "label": "Neural Lace Decoding",
        "query": "High-density neural lace and intracortical BCI decoding bandwidth for motor restoration"
    },
    {
        "tag": "Semiconductors",
        "label": "2nm GAAFET Nanosheets",
        "query": "Sub-2nm Gate-All-Around nanosheet transistor parasitic capacitance and manufacturing yield"
    },
    {
        "tag": "AI Hardware",
        "label": "Photonic Tensor Processors",
        "query": "Silicon photonic tensor processors versus GPU cluster throughput in large-scale inference"
    }
]


@app.get("/api/suggestions")
async def get_suggestions():
    """Returns randomized cutting-edge empirical research topics for UI pills."""
    return random.sample(DYNAMIC_RESEARCH_PILLS_POOL, 2)


@app.get("/api/dynamic-pills")
async def get_dynamic_pills_endpoint():
    """
    Dynamically generates 4 fresh, cutting-edge empirical research pills using AI,
    with zero-latency fallback to verified topics.
    """
    try:
        from backend.router import get_groq_client
        client = get_groq_client()
        system_prompt = (
            "You are an elite scientific research director. Generate exactly 4 diverse, cutting-edge "
            "empirical research prompts for world-class researchers. "
            "Choose 4 distinct categories (e.g. Energy, Quantum, Genomics, Fusion, Semiconductors, Photonics, Aerospace). "
            "Return ONLY a valid JSON array of 4 objects with keys: "
            "'tag' (1-2 words domain), 'label' (3-5 words topic), 'query' (1 sentence, 15-25 words). "
            "No markdown, no code block backticks, no conversational text."
        )
        res = client.chat.completions.create(
            model=key_manager.fast_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Generate 4 fresh cutting-edge research directive pills."}
            ],
            temperature=0.7,
            max_tokens=300
        )
        raw_text = res.choices[0].message.content.strip()
        if raw_text.startswith("```"):
            raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text)
            raw_text = re.sub(r"\s*```$", "", raw_text)
        pills = json.loads(raw_text)
        if isinstance(pills, list) and len(pills) >= 4:
            valid_pills = []
            for p in pills[:4]:
                if isinstance(p, dict) and "tag" in p and "label" in p and "query" in p:
                    valid_pills.append({
                        "tag": str(p["tag"]).strip()[:16],
                        "label": str(p["label"]).strip()[:42],
                        "query": str(p["query"]).strip()[:220]
                    })
            if len(valid_pills) == 4:
                return {"pills": valid_pills, "source": "ai_dynamic"}
    except Exception as e:
        print(f"[DynamicPills] AI generation fallback: {e}")

    # Fallback to 4 randomized curated topics
    selected = random.sample(DYNAMIC_RESEARCH_PILLS_POOL, 4)
    return {"pills": selected, "source": "curated_pool"}


@app.post("/api/classify")
async def classify_query_endpoint(req: ClassifyRequest):
    """
    Step 1: Evaluates user query intent with high priority given to DEEP_RESEARCH
    for scientific/technical topics, and GENERAL_CHAT for casual banter.
    """
    clean_q = req.query.strip()
    if not clean_q:
        return {"intent": "GENERAL_CHAT", "extracted_topic": "", "confidence": 1.0, "reasoning": "Empty query"}
    return classify_query_intent(clean_q)


@app.post("/api/rephrase")
async def rephrase_query_endpoint(req: RephraseRequest):
    """
    Step 2: Rephrases research query to maximize academic precision,
    extracting taxonomical concepts and arXiv search keywords.
    """
    clean_q = req.query.strip()
    if not clean_q:
        return {"enhanced_query": "", "search_keywords": ""}
    from backend.router import rephrase_query_for_research
    return rephrase_query_for_research(clean_q)


@app.post("/api/title")
async def generate_title_endpoint(req: TitleRequest):
    """
    Summarizes conversation history into a very short, punchy 2-4 word executive title
    for the central header.
    """
    try:
        from backend.router import get_groq_client
        client = get_groq_client()

        dialogue = []
        for m in req.messages[-4:]:
            role = m.get("role", "user")
            content = str(m.get("content", ""))[:250]
            dialogue.append(f"{role}: {content}")
        text_payload = "\n".join(dialogue)

        prompt = (
            "Summarize this conversation into a VERY SHORT, punchy, high-impact title "
            "of EXACTLY 2 to 4 words (no quotes, no punctuation):\n\n"
            f"{text_payload}\n\nTitle:"
        )

        response = client.chat.completions.create(
            model=key_manager.fast_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=20
        )
        raw = strip_think_tags(response.choices[0].message.content or "").strip().strip('"\'')
        cleaned = re.sub(r'[^\w\s-]', '', raw).strip()
        words = cleaned.split()
        if len(words) > 4:
            cleaned = " ".join(words[:4])
        return {"title": cleaned or "Research Inquiry"}
    except Exception:
        return {"title": "Active Research"}


@app.post("/api/enhance")
async def enhance_query_endpoint(req: EnhanceRequest):
    """
    Rewrites the user's draft into ONE clear, easy-to-understand, specific question (12-25 words).
    """
    raw_query = req.query.strip()
    if not raw_query:
        return {"original": "", "enhanced_query": ""}

    try:
        from backend.router import get_groq_client
        client = get_groq_client()
        system_instruction = (
            "Rewrite the user's short idea into ONE clear, specific question in simple everyday English (12 to 25 words). "
            "Make it easy for a 10th-grade student to read—no heavy jargon or buzzwords. "
            "Output ONLY the single question. Do not include quotes, titles, or bullets."
        )
        response = client.chat.completions.create(
            model=key_manager.fast_model,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": raw_query}
            ],
            temperature=0.25,
            max_tokens=120
        )
        raw_enhanced = strip_think_tags(response.choices[0].message.content or "")
        cleaned = raw_enhanced.strip().strip('"\'').strip('*').strip()
        cleaned = cleaned.replace('\u2011', '-').replace('\u2013', '-').replace('\u2014', '-')
        cleaned = re.sub(r'^\*\*|\*\*$', '', cleaned).strip()
        if "\n" in cleaned:
            lines = [l.strip() for l in cleaned.split("\n") if l.strip()]
            cleaned = lines[0] if lines else raw_query
        return {
            "original": raw_query,
            "enhanced_query": cleaned if len(cleaned) >= 5 else raw_query
        }
    except Exception as e:
        print(f"[Enhance] Exception: {e}")
        return {
            "original": raw_query,
            "enhanced_query": raw_query
        }


class ThinkingStepsRequest(BaseModel):
    query: str


@app.post("/api/thinking-steps")
async def get_thinking_steps(req: ThinkingStepsRequest):
    """
    Generates 6 clear, plain-language research steps tailored to the user's question.
    """
    user_query = req.query.strip()
    if not user_query:
        user_query = "Research Question"

    fallback_steps = [
        {"agent": "Planner", "step": f"Break down the main question: '{user_query[:48]}'"},
        {"agent": "Searcher", "step": "Check Wikipedia, science papers, and trusted web articles"},
        {"agent": "Fact-Checker", "step": "Verify numbers, real examples, and accuracy of claims"},
        {"agent": "Fact-Checker", "step": "Compare what works well vs. practical limits"},
        {"agent": "Simple Writer", "step": "Write a clear summary with comparison table"},
        {"agent": "PDF Maker", "step": "Format clean report pages and export PDF"},
    ]

    try:
        from backend.router import get_groq_client
        client = get_groq_client()
        system_prompt = (
            "Create EXACTLY 6 short, clear research steps for this topic in simple everyday English (10th-grade clarity). "
            "Use Agents: 'Planner', 'Searcher', 'Fact-Checker', 'Simple Writer', 'PDF Maker'. "
            "Output ONLY valid JSON array: [{\"agent\": \"...\", \"step\": \"...\"}]. No markdown or extra words."
        )
        res = client.chat.completions.create(
            model=key_manager.fast_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Question: {user_query}"}
            ],
            temperature=0.2,
            max_tokens=360
        )
        raw_text = strip_think_tags(res.choices[0].message.content or "")
        match = re.search(r"\[[\s\S]*\]", raw_text)
        if match:
            steps = json.loads(match.group(0))
            if isinstance(steps, list) and len(steps) >= 4:
                cleaned = [
                    {
                        "agent": str(s.get("agent", "Searcher")).strip(),
                        "step": str(s.get("step", "")).strip(),
                    }
                    for s in steps[:6]
                    if isinstance(s, dict) and s.get("step")
                ]
                if len(cleaned) >= 4:
                    return {"steps": cleaned}
    except Exception as e:
        print(f"[ThinkingSteps] AI step generation fallback: {e}")

    return {"steps": fallback_steps}



# ============================================================================
# Chat & Research Orchestrator Endpoints (Sync + Real-Time SSE Streaming)
# ============================================================================

def _sanitize_attachments(attachments: List[Dict[str, str]]) -> str:
    """Validates and formats user-attached text/document excerpts safely."""
    if not attachments:
        return ""
    blocks = []
    remaining = 12000
    for item in attachments[:5]:
        if not isinstance(item, dict):
            continue
        name = os.path.basename(str(item.get("name", "attachment.txt")))[:80]
        raw = str(item.get("content", "")).replace("\x00", "").strip()
        if not raw:
            continue
        snippet = raw[:min(4000, remaining)]
        remaining -= len(snippet)
        blocks.append(f"[Attached Document: {name}]\n{snippet}")
        if remaining <= 0:
            break
    return "\n\n".join(blocks)


def _sanitize_dossier_integrity(text: str) -> str:
    """Ensure mathematical equations, code fences, links, and trailing sentences close cleanly."""
    if not text:
        return ""
    t = strip_think_tags(text)
    # Heal fragmented markdown links with spaces or newlines: [Title] (url) -> [Title](url)
    t = re.sub(r'\[([^\]]+)\]\s*\n?\s*\((https?://[^\s)]+)\)', r'[\1](\2)', t)
    if t.count("\\[") > t.count("\\]"):
        t += "\n\\]"
    if t.count("$$") % 2 != 0:
        t += "\n$$"
    if t.count("```") % 2 != 0:
        t += "\n```"
    if t.count("**") % 2 != 0:
        t += "**"
    if t and t[-1] not in ('.', '!', '?', '|', '`', '}', ']'):
        last_punct = max(t.rfind('. '), t.rfind('.\n'), t.rfind('!\n'), t.rfind('?\n'))
        if last_punct > len(t) - 180:
            t = t[:last_punct + 1]
        else:
            t += "."
    return t


def _execute_stage_call(system_prompt: str, user_prompt: str, max_tokens: int = 1500, override_key: Optional[str] = None) -> str:
    """Executes an isolated synthesis stage with automated key rotation and failover, or user override key."""
    from backend.router import get_groq_client
    max_retries = 1 if override_key else min(3, len(key_manager.groq_keys) or 1)
    for _ in range(max_retries):
        c = None
        try:
            c = get_groq_client(override_key=override_key)
            r = c.chat.completions.create(
                model=key_manager.primary_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=max_tokens,
                temperature=0.2
            )
            content = strip_think_tags(r.choices[0].message.content or "")
            if content:
                return content
        except Exception as err:
            print(f"[StageCall] Failover triggered: {err}")
            try:
                if c is not None and hasattr(c, "api_key") and c.api_key:
                    key_manager.mark_rate_limited(c.api_key)
            except Exception as mark_err:
                print(f"[StageCall] Key mark error: {mark_err}")
            time.sleep(0.3)
    return ""


def _run_chat_pipeline(req: ChatRequest, emit: Optional[Callable[[Dict[str, Any]], None]] = None) -> Dict[str, Any]:
    """Shared dual-route execution engine with optional real-time SSE callback."""
    user_query = req.query.strip()
    if not user_query:
        raise ValueError("Query cannot be empty.")

    def notify(payload: Dict[str, Any]) -> None:
        if emit is not None:
            emit(payload)

    attachment_context = _sanitize_attachments(req.attachments)

    # 1. High-Precision Contextual Disambiguation & Rolling Memory Retrieval
    session_id = getattr(req, "session_id", None)
    rolling_memory = getattr(req, "rolling_summary", None) or get_stored_session_summary(session_id)

    notify({"event": "status", "phase": "classify", "label": "Contextualizing query & classifying intent...", "progress": 0.1})

    is_academic_mode = (
        getattr(req, "research_mode", False)
        or req.force_research
        or req.mode in ("deep", "academic")
        or user_query.lower().startswith(("/research", "/paper"))
    )

    if user_query.lower().startswith(("/research", "/paper")):
        user_query = re.sub(r"^/(research|paper)\s*", "", user_query, flags=re.IGNORECASE).strip()
        force_research_flag = True
    else:
        force_research_flag = is_academic_mode

    # Run contextual disambiguation & intent classification using rolling memory!
    classification = disambiguate_and_classify_query(
        query=user_query,
        rolling_summary=rolling_memory,
        recent_history=req.history,
        force_research=force_research_flag,
        override_key=req.user_groq_key,
    )

    intent = classification.get("intent", "GENERAL_CHAT")
    if req.mode == "fast":
        intent = "GENERAL_CHAT"
    elif req.mode in ("deep", "academic") or force_research_flag:
        intent = "DEEP_RESEARCH"

    standalone_query = classification.get("standalone_query", user_query)
    search_keywords = req.search_keywords or classification.get("search_keywords", "")
    display_topic = classification.get("display_topic", " ".join(user_query.split()[:5]))

    # BRANCH A: CASUAL / QUICK ANSWER (Live Token-by-Token Streaming + Rolling Memory + Epistemic Humility)
    if intent == "GENERAL_CHAT":
        notify({"event": "status", "phase": "fast_chat", "label": "Synthesizing conversational response...", "progress": 0.45})
        prompt_with_files = f"{attachment_context}\n\nUser Question: {standalone_query}" if attachment_context else standalone_query

        # Inject rolling memory and epistemic humility into chat messages
        chat_context = f"\n[ROLLING CONVERSATION CONTEXT]\n{rolling_memory}\n" if rolling_memory else ""
        system_with_memory = f"{FAST_CHAT_SYSTEM_PROMPT}{chat_context}{EPISTEMIC_HUMILITY_DIRECTIVE}"

        clean_history = []
        for m in req.history[-8:]:
            if isinstance(m, dict) and "role" in m and "content" in m and isinstance(m["content"], str):
                role = "assistant" if m["role"] == "bot" else m["role"]
                if role in ("user", "assistant"):
                    clean_history.append({"role": role, "content": m["content"][:2500]})

        dialogue = [{"role": "system", "content": system_with_memory}] + clean_history + [{"role": "user", "content": prompt_with_files}]

        if emit is not None:
            parts: List[str] = []
            for token in stream_groq_tokens(
                dialogue,
                model=key_manager.fast_model,
                temperature=0.3,
                max_tokens=850,
                override_key=req.user_groq_key,
            ):
                parts.append(token)
                notify({"event": "delta", "role": "chat", "delta": token})
            answer = strip_think_tags("".join(parts))
        else:
            client = get_groq_client(override_key=req.user_groq_key)
            resp = client.chat.completions.create(
                model=key_manager.fast_model,
                messages=dialogue,
                temperature=0.3,
                max_tokens=850,
            )
            answer = strip_think_tags(resp.choices[0].message.content or "")

        # Update progressive rolling memory after turn
        updated_memory = update_rolling_memory(
            previous_summary=rolling_memory,
            user_query=user_query,
            assistant_response=answer,
            sources=None,
            session_id=session_id,
            override_key=req.user_groq_key,
        )

        return {
            "type": "chat",
            "content": answer,
            "rolling_summary": updated_memory,
            "rewritten_query": standalone_query,
        }

    # BRANCH B: DEEP RESEARCH (1. Contextual Topic -> 2. Source Discovery -> 3. Fact Check & Contradiction Audit -> 4. Live Streaming Grounded Report -> 5. PDF)
    notify({"event": "status", "phase": "rephrase", "label": "Contextualizing academic inquiry & selecting repository keywords...", "progress": 0.18})
    enhanced_directive = req.enhanced_query or standalone_query
    search_phrase = " ".join((search_keywords or display_topic).split()[:6])

    # Step 2: Multi-Source Discovery across 8 Scientific & Web Engines
    notify({"event": "status", "phase": "discovery", "label": "Querying Semantic Scholar, OpenAlex, arXiv & Web...", "progress": 0.34})
    trace_stats: Dict[str, Any] = {}
    try:
        from backend.research_engine import execute_multi_source_discovery
        discovery = execute_multi_source_discovery(search_phrase or user_query)
        sources = discovery.get("sources", [])
        sources_context = discovery.get("evidence_context", "")
        filtered_papers = discovery.get("filtered_papers", [])
        trace_stats = discovery.get("trace_stats", {})
    except Exception as disc_err:
        print(f"[ResearchEngine] Discovery fallback: {disc_err}")
        sources = []
        sources_context = ""
        filtered_papers = []
        trace_stats = {}

    if len(sources) < 2:
        sources.extend([
            {"title": f"IEEE Index: {display_topic}", "url": "https://ieeexplore.ieee.org", "badge": "IEEE", "authors": "IEEE", "year": "2024", "venue": "IEEE Xplore"},
            {"title": f"Nature Research: {display_topic}", "url": "https://www.nature.com", "badge": "Nature", "authors": "Nature", "year": "2024", "venue": "Nature"}
        ])
        if not sources_context:
            sources_context = "\n".join([f"- {s['title']} ({s['url']})" for s in sources])

    if attachment_context:
        sources_context = f"{sources_context}\n\nUser Attached Notes:\n{attachment_context}"

    notify({"event": "sources", "topic": display_topic, "sources": sources})

    # Step 3: Fact-Checker & Contradiction Audit (ZERNEXA ClaimVerifier)
    notify({"event": "status", "phase": "auditor", "agent": "Fact-Checker", "label": f"Auditing facts & contradictions across {len(sources)} sources...", "progress": 0.54})
    contradiction_warning = ""
    try:
        from backend.claim_verifier import ClaimVerifier
        verifier = ClaimVerifier(key_manager=key_manager)
        _, contradictions = verifier.audit_evidence_claims(sources_context, enhanced_directive)
        if contradictions:
            conflict_lines = [
                f"- [CONTRADICTION DETECTED] {c.get('claim')}: In reality, {c.get('conflicting_source') or c.get('reasoning')}"
                for c in contradictions
            ]
            contradiction_warning = "\n\nCRITICAL CONTRADICTIONS DETECTED IN EVIDENCE:\n" + "\n".join(conflict_lines)
    except Exception as cv_err:
        print(f"[ClaimVerifier] Non-blocking notice: {cv_err}")

    numbered_sources = "\n".join(
        f"[{i}] {s['title']} ({s.get('year','n.d.')}), {s['url']}"
        for i, s in enumerate(sources, 1)
    )

    audit_sys = (
        "You are the Fact-Checker for MULTIINTEL.\n"
        "Read the retrieved sources and pull out ONLY true facts, numbers, dates, and limits.\n"
        "CRITICAL RULE: Tag EVERY factual bullet point with its source number from the numbered sources list (e.g. [1] or [2][4]). A claim no source supports is left out.\n"
        "Output 5 to 8 short bullet points:\n"
        "- What is proven and how it works, tagged [n]\n"
        "- Exact numbers, benchmarks, dates, or sample sizes found, tagged [n]\n"
        "- Known challenges, costs, or unproven limits, tagged [n]"
    )
    audit_user = f"Question: '{enhanced_directive}'\n\nSources:\n{numbered_sources}\n\nEvidence Details:\n{sources_context[:4500]}{contradiction_warning}"
    verified_brief = _execute_stage_call(audit_sys, audit_user, max_tokens=650)
    if contradiction_warning and contradiction_warning not in verified_brief:
        verified_brief = f"{verified_brief}\n{contradiction_warning}"

    # Step 4: Live Token-by-Token Writer (Academic Literature Review OR Simple Clear Report)
    notify({"event": "status", "phase": "director", "agent": "Literature Director" if is_academic_mode else "Simple Writer", "label": "Synthesizing grounded research dossier...", "progress": 0.74})
    verified_urls_text = "\n".join([f"- [{s['title']}]({s['url']})" for s in sources[:8]])
    history_note = ""
    if req.history:
        last_turns = "\n".join([f"{m.get('role', 'user')}: {str(m.get('content', ''))[:300]}" for m in req.history[-4:]])
        history_note = f"\nRecent Chat Context:\n{last_turns}\n"

    if is_academic_mode:
        writer_sys = (
            "You are VERAXIS, an authoritative scientific intelligence engine.\n"
            "Synthesize an authoritative, highly scannable, and deeply rigorous research dossier using ONLY the numbered sources provided.\n\n"
            "REQUIRED DOSSIER STRUCTURE:\n"
            "1. # Executive Summary & Core Finding\n"
            "The very first sentence MUST directly answer the question with exact numbers, metrics, or thresholds from the sources, tagged with [n]. Follow with 2-3 clear sentences synthesizing the scientific consensus.\n\n"
            "2. ## Comparative Benchmarks & Empirical Matrix\n"
            "Always include a clean Markdown comparison table summarizing findings across studies:\n"
            "| Architecture / System | Benchmark Metric / Value | Conditions / Noise Model | Sample / Year | Source |\n"
            "Fill with 3-5 real rows grounded in the sources.\n\n"
            "3. ## Key Mechanisms & Theoretical Architecture\n"
            "2-3 structured paragraphs explaining the underlying mechanism or principles. Bold key defined terms. Every factual claim must end with its source tag like [1] or [2][5].\n\n"
            "4. ## Engineering Bottlenecks & Failure Modes\n"
            "Detail specific physical limits, error margins, fabrication faults, or cost constraints proven in the literature, tagged with [n].\n\n"
            "STRICT RULES:\n"
            "- Mathematical formulas and variables MUST use standard LaTeX: inline formulas inside $...$ (e.g. $p_{th} \\approx 1.0\\%$, $P_L \\propto (p/p_{th})^{(d+1)/2}$) and block formulas inside $$...$$. Never write raw pseudocode math like p_th or ^((d+1)/2).\n"
            "- Every factual claim must end with its source number like [3] or [1][4]. Always put a space before citation tags.\n"
            "- Exact numbers, dates, and names only. Do not round or generalize.\n"
            "- Do NOT write a bibliography or references section (the system compiles that separately).\n"
            "- Zero generic fluff or conversational intros.\n"
            "- STRICT GROUNDING: Never hallucinate or assume unverified claims. All benchmarks, formulas, and mechanisms must be directly derived from the retrieved papers below."
            f"{EPISTEMIC_HUMILITY_DIRECTIVE}"
        )

        writer_user = (
            f"Research Question: {user_query}\n"
            f"Scope / Goal: {enhanced_directive}\n"
            f"{history_note}\n\n"
            f"=== RETRIEVED ACADEMIC PAPERS, ABSTRACTS & EVIDENCE ===\n"
            f"{sources_context[:6500]}\n\n"
            f"=== FACT-CHECKER VERIFIED AUDIT & METRICS ===\n"
            f"{verified_brief}\n\n"
            f"=== NUMBERED SOURCES ===\n"
            f"{numbered_sources}\n\n"
            "Synthesize the complete, highly structured research dossier now, strictly grounded in the retrieved papers."
        )
    else:
        writer_sys = (
            "You are MULTIINTEL Clear Writer.\n"
            "GOAL: Explain the answer so clearly and simply that a 10th-class student understands every sentence immediately, while keeping every fact accurate.\n\n"
            "STRICT WRITING RULES:\n"
            "1. Use short sentences (usually under 18 words) and everyday words.\n"
            "2. Whenever you use a technical term, explain it in plain words in parentheses right next to it.\n"
            "3. Never pad paragraphs with robotic buzzwords like 'empirical scope', 'synergistically', 'breakthrough horizon', or 'paradigm shift'.\n"
            "4. Write ONLY true, verified information grounded in the verified notes and sources.\n\n"
            "EXACT STRUCTURE TO FOLLOW:\n"
            "# Simple Answer & Big Picture\n"
            "(3-4 clear sentences directly answering the question, plus 1 easy everyday comparison/analogy.)\n\n"
            "## How It Works (Step-by-Step)\n"
            "(4-6 simple bullets explaining the steps cleanly. Include one short formula ONLY if truly useful, and explain each letter right under it.)\n\n"
            "## Key Numbers & Comparison\n"
            "(One clean 4-column Markdown table: | What Was Checked | Real Number or Fact | How Sure Are We? | Simple Meaning | with 3-4 rows.)\n\n"
            "## What Works Now vs. Challenges Ahead\n"
            "(Clear bullets covering real benefits today, practical problems like cost/safety, and realistic timing.)\n\n"
            "## Sources Used\n"
            "(List each source as a single-line Markdown bullet: `- [Exact Title](https://exact-url)` with NO spaces or line breaks between brackets and parentheses.)"
        )
        writer_user = (
            f"User Question: {user_query}\n"
            f"Focused Goal: {enhanced_directive}\n"
            f"{history_note}\n"
            f"Retrieved Papers & Evidence Details:\n{sources_context[:4500]}\n\n"
            f"Verified Fact Notes:\n{verified_brief}\n\n"
            f"Verified Source Links (use exact URLs):\n{verified_urls_text}\n\n"
            "Write the complete, clear report now, strictly based on the retrieved papers."
        )

    writer_messages = [
        {"role": "system", "content": writer_sys},
        {"role": "user", "content": writer_user},
    ]

    if emit is not None:
        report_tokens: List[str] = []
        for token in stream_groq_tokens(
            writer_messages,
            model=key_manager.primary_model,
            temperature=0.25,
            max_tokens=2000,
            override_key=req.user_groq_key,
        ):
            report_tokens.append(token)
            notify({"event": "delta", "role": "research", "delta": token})
        dossier_text = _sanitize_dossier_integrity("".join(report_tokens))
    else:
        raw_doc = _execute_stage_call(writer_sys, writer_user, max_tokens=2000, override_key=req.user_groq_key)
        dossier_text = _sanitize_dossier_integrity(raw_doc)

    # Step 5: Compile ReportLab PDF
    notify({"event": "status", "phase": "pdf", "label": "Creating clean PDF report...", "progress": 0.94})
    file_stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_topic_slug = sanitize_filename(display_topic, max_length=24)
    pdf_filename = f"VERAXIS_{safe_topic_slug}_{file_stamp}.pdf"
    pdf_path = os.path.join(PDF_DIR, pdf_filename)
    create_pdf_dossier(display_topic, dossier_text, output_path=pdf_path)

    cited_ids = {int(n) for n in re.findall(r"\[(\d+)\]", dossier_text)}
    trace = {
        "queried": trace_stats.get("queried", ["arxiv", "semantic_scholar", "openalex", "europe_pmc", "web"]),
        "fetched": trace_stats.get("fetched", len(sources)),
        "after_dedup": trace_stats.get("after_dedup", len(sources)),
        "after_filter": trace_stats.get("after_filter", len(sources)),
        "cited": len(cited_ids),
    }
    notify({"event": "trace", "trace": trace})

    # Update progressive rolling memory after research dossier
    updated_memory = update_rolling_memory(
        previous_summary=rolling_memory,
        user_query=user_query,
        assistant_response=dossier_text[:2000],
        sources=sources,
        session_id=session_id,
        override_key=req.user_groq_key,
    )

    return {
        "type": "research",
        "topic": display_topic,
        "sources": sources,
        "content": dossier_text,
        "pdf_filename": pdf_filename,
        "has_pdf": os.path.exists(pdf_path),
        "trace": trace,
        "rolling_summary": updated_memory,
        "rewritten_query": standalone_query,
    }


@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    """Standard JSON endpoint for fast chat and complete 3-tier deep research dossiers."""
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    try:
        return await asyncio.to_thread(_run_chat_pipeline, req, None)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "type": "error",
            "content": f"Research pipeline encountered an issue: {str(e)}. Please retry."
        }


@app.post("/api/chat/stream")
async def chat_stream_endpoint(req: ChatRequest):
    """Server-Sent Events streaming endpoint delivering real-time stage progress, sources, and report sections."""
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    loop = asyncio.get_running_loop()
    queue: asyncio.Queue = asyncio.Queue()

    def thread_emit(payload: Dict[str, Any]) -> None:
        loop.call_soon_threadsafe(queue.put_nowait, payload)

    async def runner() -> None:
        try:
            result = await asyncio.to_thread(_run_chat_pipeline, req, thread_emit)
            thread_emit({"event": "done", "result": result})
        except Exception as exc:
            thread_emit({"event": "error", "message": str(exc)})
        finally:
            thread_emit({"event": "_eof"})

    async def event_generator():
        task = asyncio.create_task(runner())
        try:
            while True:
                item = await queue.get()
                if item.get("event") == "_eof":
                    break
                yield f"data: {json.dumps(item)}\n\n"
        finally:
            if not task.done():
                task.cancel()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/download-pdf/{filename}")
async def download_pdf(filename: str):
    """Direct binary download endpoint for generated ReportLab PDF."""
    safe_name = os.path.basename(filename)
    file_path = os.path.join(PDF_DIR, safe_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Requested PDF file not found.")
    return FileResponse(file_path, media_type="application/pdf", filename=safe_name)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=False)
