"""
VERAXIS AI — High-Performance FastAPI Backend Server
Orchestrates:
1. Precision Query Intent Classification (Fast Groq Chat vs Deep Autonomous Research)
2. 3-Tier Multi-Agent Crew Execution (Lead Analyst, Forensic Fact-Checker, Dossier Director)
3. ReportLab 4.x Supreme PDF Generation & Download Endpoints
4. Serves Modern Ambient Neuform Three.js Web Frontend
"""

import os
import sys
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

# Internal Core Modules
from core.config import key_manager
from core.router import classify_query_intent, generate_fast_chat_response
from core.agents import create_lead_researcher, create_fact_checker, create_dossier_director
from core.tasks import create_discovery_task, create_audit_task, create_synthesis_task
from core.pdf_generator import create_pdf_dossier
from core.tools import arxiv_academic_search, duckduckgo_web_search
from crewai import Crew, Process

app = FastAPI(title="VERAXIS AI API", version="3.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")
STATIC_ASSETS = os.path.join(FRONTEND_DIST, "assets") if os.path.exists(os.path.join(FRONTEND_DIST, "assets")) else os.path.join(BASE_DIR, "assets")
PDF_DIR = os.path.join(BASE_DIR, "pdf_exports")
os.makedirs(PDF_DIR, exist_ok=True)

# Mount Static Files
app.mount("/assets", StaticFiles(directory=STATIC_ASSETS), name="assets")
app.mount("/web", StaticFiles(directory=os.path.join(BASE_DIR, "web")), name="web")

class ChatRequest(BaseModel):
    query: str

@app.get("/")
async def root():
    """Serves the primary Web frontend (React production build or fallback)."""
    if os.path.exists(os.path.join(FRONTEND_DIST, "index.html")):
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
    return FileResponse(os.path.join(BASE_DIR, "web", "index.html"))

@app.get("/manifest.json")
async def manifest():
    manifest_path = os.path.join(FRONTEND_DIST, "manifest.json")
    if os.path.exists(manifest_path):
        return FileResponse(manifest_path, media_type="application/manifest+json")
    raise HTTPException(status_code=404, detail="Manifest not found")

@app.get("/sw.js")
async def service_worker():
    sw_path = os.path.join(FRONTEND_DIST, "sw.js")
    if os.path.exists(sw_path):
        return FileResponse(sw_path, media_type="application/javascript")
    raise HTTPException(status_code=404, detail="Service worker not found")

@app.get("/api/status")
async def get_status():
    """Returns key pool health and model telemetry."""
    return key_manager.get_status_telemetry()

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

import random

@app.get("/api/suggestions")
async def get_suggestions():
    """Returns exactly 2 randomized cutting-edge empirical research topics for dynamic UI pills."""
    return random.sample(RESEARCH_TOPICS_POOL, 2)


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
            # Query ArXiv for primary papers
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
        pdf_filename = f"VERAXIS_{file_stamp}.pdf"
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
    safe_filename = os.path.basename(filename)
    file_path = os.path.join(PDF_DIR, safe_filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Requested PDF file not found.")
    return FileResponse(file_path, media_type="application/pdf", filename=safe_filename)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=False)
