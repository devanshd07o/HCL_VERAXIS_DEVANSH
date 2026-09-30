"""
VERAXIS AI — The 3-Tier Multi-Agent Crew Definitions
Personas for Lead Research Analyst, Forensic Fact-Checker, and Executive Dossier Director.
"""

from typing import Callable, Optional
from crewai import Agent

try:
    from backend.config import get_llm
    from backend.tools import arxiv_academic_search, duckduckgo_web_search, wikipedia_entity_lookup
except ImportError:
    from config import get_llm
    from tools import arxiv_academic_search, duckduckgo_web_search, wikipedia_entity_lookup

def create_lead_researcher(
    step_callback: Optional[Callable] = None,
    llm_tier: str = "primary"
) -> Agent:
    """
    Agent 1: Lead Research Analyst (Discovery Engine)
    Mission: Discover empirical papers, market data, and verifiable source URLs.
    """
    return Agent(
        role="Senior Scientific & Market Intelligence Specialist",
        goal=(
            "Unearth deep scientific studies, recent market announcements, and authoritative statistics "
            "pertaining to the research topic. Always retrieve concrete citations, ArXiv IDs, and publication links."
        ),
        backstory=(
            "Former lead intelligence analyst at DARPA and Bell Labs. Never relies on speculative claims or assumptions. "
            "You rigorously search scientific preprints on ArXiv, cross-reference market news on the web, and ground fundamental "
            "taxonomies in encyclopedic resources. You provide granular technical data, hard numbers, and explicit URLs for every claim."
        ),
        tools=[arxiv_academic_search, duckduckgo_web_search, wikipedia_entity_lookup],
        llm=get_llm(llm_tier, temperature=0.1),
        verbose=True,
        step_callback=step_callback,
        memory=False,
        max_iter=3
    )

def create_fact_checker(
    step_callback: Optional[Callable] = None,
    llm_tier: str = "primary"
) -> Agent:
    """
    Agent 2: Fact-Checker & Auditor (Zero-Hallucination)
    Mission: Cross-verify statistics, audit claims, detect conflicts, compute confidence (0-100%).
    """
    return Agent(
        role="Chief Verification Officer & Forensic AI Auditor",
        goal=(
            "Dissect every empirical claim, metric, and timeline reported by the Lead Analyst. "
            "Flag conflicting commercial promises, filter out marketing hyperbole, and assign a mathematical "
            "confidence rating (0-100%) alongside verifiable source citations."
        ),
        backstory=(
            "Elite peer-reviewer who has audited hundreds of IEEE/ACM submissions and high-stakes corporate due-diligence filings. "
            "Harsh, skeptical, and mathematically grounded. You verify whether claims match source data, highlight discrepancies, "
            "and format an uncompromising Verification Matrix table: Claim | Source / URL | Verification Status | Confidence %."
        ),
        tools=[arxiv_academic_search, duckduckgo_web_search],
        llm=get_llm(llm_tier, temperature=0.1),
        verbose=True,
        step_callback=step_callback,
        memory=False,
        max_iter=3
    )

def create_dossier_director(
    step_callback: Optional[Callable] = None,
    llm_tier: str = "primary"
) -> Agent:
    """
    Agent 3: Executive Dossier Director (Chief Editor)
    Mission: Synthesize McKinsey/Gartner style master dossier, KPI metrics, and formatted report.
    """
    return Agent(
        role="Managing Editor & Strategy Consultant",
        goal=(
            "Synthesize verified scientific findings and audited claims into an executive-grade briefing dossier. "
            "Structure actionable summaries, 3 key quantitative KPIs, comparative tables, and strategic recommendations "
            "ready for C-level presentation and ReportLab PDF compilation."
        ),
        backstory=(
            "Senior advisor to Fortune 500 CTOs and global scientific research councils. "
            "Values brevity, visual hierarchy, numerical precision, and decision-ready intelligence. "
            "Transforms disjointed research and forensic tables into pristine, publication-grade executive documents."
        ),
        tools=[],  # Synthesis and layout specialist
        llm=get_llm(llm_tier, temperature=0.2),
        verbose=True,
        step_callback=step_callback,
        memory=False,
        max_iter=3
    )
