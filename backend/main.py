"""
VERAXIS AI — High-Performance Modular FastAPI Backend Engine
Orchestrates:
1. Precision Query Intent Classification (Fast Groq Chat vs Deep Autonomous Research)
2. 3-Tier Multi-Agent Crew Execution (Lead Analyst, Forensic Fact-Checker, Dossier Director)
3. ReportLab 4.x Supreme PDF Generation & Binary Download Endpoints
4. Dynamic Topic Suggestion & Telemetry Health Endpoints
5. Serves Production React SaaS Web App & PWA Manifest/Service Worker
"""

import os
import sys
import random
from datetime import datetime
from typing import Dict, Any, List

# Configure UTF-8 on Windows stdout
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

# Internal Core Modules (Backend Package)
try:
    from backend.config import key_manager
    from backend.router import classify_query_intent, generate_fast_chat_response
    from backend.agents import create_lead_researcher, create_fact_checker, create_dossier_director
    from backend.tasks import create_discovery_task, create_audit_task, create_synthesis_task
    from backend.pdf_generator import create_pdf_dossier
    from backend.tools import arxiv_academic_search, duckduckgo_web_search
    from backend.helper import sanitize_filename, validate_system_environment
except ImportError:
    from config import key_manager
    from router import classify_query_intent, generate_fast_chat_response
    from agents import create_lead_researcher, create_fact_checker, create_dossier_director
    from tasks import create_discovery_task, create_audit_task, create_synthesis_task
    from pdf_generator import create_pdf_dossier
    from tools import arxiv_academic_search, duckduckgo_web_search
    from helper import sanitize_filename, validate_system_environment

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

class TitleRequest(BaseModel):
    messages: List[Dict[str, Any]]


# ============================================================================
# Core Frontend & PWA Endpoints
# ============================================================================

@app.get("/")
async def root():
    """Serves the primary Web frontend (React production build or fallback)."""
    index_path = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    legacy_index = os.path.join(PROJECT_ROOT, "web", "index.html")
    if os.path.exists(legacy_index):
        return FileResponse(legacy_index)
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


@app.get("/api/suggestions")
async def get_suggestions():
    """Returns exactly 2 randomized cutting-edge empirical research topics for dynamic UI pills."""
    return random.sample(RESEARCH_TOPICS_POOL, 2)


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
        raw = response.choices[0].message.content.strip().strip('"\'')
        cleaned = re.sub(r'[^\w\s-]', '', raw).strip()
        words = cleaned.split()
        if len(words) > 4:
            cleaned = " ".join(words[:4])
        return {"title": cleaned or "Research Inquiry"}
    except Exception:
        return {"title": "Active Research"}


# ============================================================================
# Chat & Research Orchestrator Endpoint
# ============================================================================

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    """
    Dual-Route Dispatcher:
    - GENERAL_CHAT: Instant Groq LPU response (<400ms) with zero tool overhead.
    - DEEP_RESEARCH: 3-Tier Multi-Agent Crew with ArXiv/Web sources and ReportLab PDF.
    """
    user_query = req.query.strip()
    if not user_query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    # 1. High-Precision Intent Classification
    intent_data = classify_query_intent(user_query)
    intent = intent_data.get("intent", "GENERAL_CHAT")
    extracted_topic = intent_data.get("extracted_topic", user_query)

    # BRANCH A: CASUAL / INSTANT CONVERSATIONAL QUERY
    if intent == "GENERAL_CHAT":
        answer = generate_fast_chat_response([{"role": "user", "content": user_query}])
        return {
            "type": "chat",
            "content": answer
        }

    # BRANCH B: DEEP EMPIRICAL RESEARCH QUERY
    try:
        # Step 1: Discover Authoritative Sources
        sources: List[Dict[str, str]] = []
        try:
            import arxiv
            client = arxiv.Client(page_size=3)
            search = arxiv.Search(query=extracted_topic, max_results=3)
            for paper in client.results(search):
                sources.append({
                    "title": f"ArXiv: {paper.title}",
                    "url": paper.entry_id
                })
        except Exception:
            pass

        # Step 2: Mobilize 3-Tier Autonomous Multi-Agent Crew
        analyst = create_lead_researcher()
        auditor = create_fact_checker()
        director = create_dossier_director()

        task1 = create_discovery_task(analyst, extracted_topic)
        task2 = create_audit_task(auditor, extracted_topic, context_tasks=[task1])
        task3 = create_synthesis_task(director, extracted_topic, context_tasks=[task1, task2])

        crew = Crew(
            agents=[analyst, auditor, director],
            tasks=[task1, task2, task3],
            process=Process.sequential,
            verbose=False
        )

        res = await crew.kickoff_async()
        dossier_text = str(res)

        # Step 3: Generate Publication-Grade ReportLab 4.x PDF
        file_stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_topic_slug = sanitize_filename(extracted_topic, max_length=24)
        pdf_filename = f"VERAXIS_{safe_topic_slug}_{file_stamp}.pdf"
        pdf_path = os.path.join(PDF_DIR, pdf_filename)
        create_pdf_dossier(extracted_topic, dossier_text, output_path=pdf_path)

        return {
            "type": "research",
            "topic": extracted_topic,
            "sources": sources,
            "content": dossier_text,
            "pdf_filename": pdf_filename
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "type": "error",
            "content": f"⚠️ Research pipeline encountered an issue: {str(e)}. Please retry with refined parameters."
        }


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
