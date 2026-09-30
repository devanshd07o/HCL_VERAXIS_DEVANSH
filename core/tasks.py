"""
MULTIINTEL AI — The 3-Tier Multi-Agent Sequential Tasks
Configures Discovery, Forensic Auditing, and Executive Dossier Synthesis tasks.
"""

from crewai import Task, Agent

def create_discovery_task(agent: Agent, topic: str) -> Task:
    """
    Task 1: Deep Academic & Market Discovery
    """
    return Task(
        description=(
            f"Conduct exhaustive technical and market discovery on the topic: '{topic}'.\n\n"
            "Execution Steps:\n"
            "1. Use `arxiv_academic_search` to unearth recent peer-reviewed preprints, foundational papers, and quantitative benchmarks.\n"
            "2. Use `duckduckgo_web_search` to uncover recent corporate roadmaps, industrial pilots, government policies, and market numbers.\n"
            "3. Use `wikipedia_entity_lookup` to ground core concepts, chemical/mathematical principles, and taxonomies.\n"
            "4. Collate findings into a dense, empirical dossier with exact numbers, dates, author names, ArXiv IDs, and publication URLs."
        ),
        expected_output=(
            "A structured technical research brief containing:\n"
            "- Scientific Foundations & Core Principles\n"
            "- Granular Empirical Findings & Benchmarks (with numbers)\n"
            "- Key Industrial Pilots & Market Timelines\n"
            "- Enumerated list of 5+ key factual claims with associated direct URLs/DOIs."
        ),
        agent=agent
    )

def create_audit_task(agent: Agent, topic: str, context_tasks: list = None) -> Task:
    """
    Task 2: Forensic Fact-Checking & Hallucination Elimination
    """
    return Task(
        description=(
            f"Rigorously audit and cross-verify every claim, benchmark, and timeline identified for '{topic}'.\n\n"
            "Execution Steps:\n"
            "1. Scrutinize the Lead Analyst's findings for commercial exaggeration, unverified projections, or conflicting metrics.\n"
            "2. If a timeline or metric looks questionable, use search tools to verify conflicting perspectives.\n"
            "3. Assign an evidence-backed Confidence Score (0-100%) to each distinct claim.\n"
            "4. Classify each claim into: [VERIFIED], [CONTESTED], [SPECULATIVE], or [UNCONFIRMED].\n"
            "5. Build the master Markdown Verification Matrix table with columns:\n"
            "   | Claim | Source / URL | Verification Status | Confidence % | Audit Notes |"
        ),
        expected_output=(
            "A forensic verification report containing an audit summary, identified risk factors or conflicting data, "
            "and the complete markdown table formatted as:\n"
            "| Claim | Source / URL | Verification Status | Confidence % | Audit Notes |"
        ),
        agent=agent,
        context=context_tasks
    )

def create_synthesis_task(agent: Agent, topic: str, context_tasks: list = None) -> Task:
    """
    Task 3: Executive Dossier & Strategic Synthesis
    """
    return Task(
        description=(
            f"Synthesize the verified research and audited verification matrix for '{topic}' into a C-Suite executive dossier.\n\n"
            "Report Requirements:\n"
            "1. # Executive Briefing: High-level strategic context and bottom-line verdict.\n"
            "2. ## Key Quantitative Metrics: Three primary KPIs in the exact format:\n"
            "   - **KPI 1 [Metric Name]**: [Value] — [Significance]\n"
            "   - **KPI 2 [Metric Name]**: [Value] — [Significance]\n"
            "   - **KPI 3 [Metric Name]**: [Value] — [Significance]\n"
            "3. ## Technical Architecture & Empirical Breakthroughs: Deep dive into mechanisms, trade-offs, and data.\n"
            "4. ## Commercialization & Market Trajectory: Timelines, regulatory hurdles, cost parity curves, and industry leaders.\n"
            "5. ## Forensic Verification Matrix: Embed the audited verification table.\n"
            "6. ## Strategic Recommendations: 3-4 high-impact recommendations for enterprise decision makers.\n"
            "7. ## Citations & References: List of formal papers, ArXiv IDs, and authoritative links.\n\n"
            "Tone: McKinsey/Gartner style, objective, authoritative, dense, zero fluff."
        ),
        expected_output=(
            "A comprehensive, publication-ready Executive Dossier formatted in pristine Markdown matching all required sections."
        ),
        agent=agent,
        context=context_tasks
    )
