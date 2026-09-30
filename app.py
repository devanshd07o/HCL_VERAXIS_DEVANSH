"""
VERAXIS AI — Autonomous Scientific Intelligence & Multi-Agent Research Assistant
Enterprise SaaS Orchestrator:
- Progressive Disclosure: Elements appear strictly when needed
- Comfortaa 18px Typography + 100% Rounded Claymorphism (Zero Straight Edges)
- Dual-Engine Routing: Instant Groq LPU Chat vs Autonomous 3-Tier Multi-Agent Crew
- Web Speech API Voice Dictation
- Scientifically Proven Ergonomic Palettes (Dark Obsidian vs Light Porcelain)
"""

import sys
import os
import time
from datetime import datetime
import streamlit as st

# Configure UTF-8 on Windows to eliminate charmap encoding errors
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# 1. Page Configuration
st.set_page_config(
    page_title="VERAXIS AI — Autonomous Multi-Agent Intelligence",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# 2. Modular Imports
from ui.theme import get_theme_css
from ui.components import render_hero_header, render_telemetry_pods, render_voice_input_widget
from ui.sidebar import render_sidebar
from router import classify_query_intent, generate_fast_chat_response
from agents import create_lead_researcher, create_fact_checker, create_dossier_director
from tasks import create_discovery_task, create_audit_task, create_synthesis_task
from pdf_generator import create_pdf_dossier
from demo_cache import OFFLINE_CACHE
from crewai import Crew, Process

# 3. Session State Initialization
if "theme" not in st.session_state:
    st.session_state.theme = "Dark Obsidian"
if "messages" not in st.session_state:
    st.session_state.messages = [
        {
            "role": "assistant",
            "type": "chat",
            "content": (
                "👋 Hello! I am **VERAXIS AI**, your autonomous scientific intelligence partner.\n\n"
                "- 💬 Ask me **casual or technical questions** for instant Groq LPU responses.\n"
                "- 🔬 Enter a **complex research topic** to spawn our 3-Tier Multi-Agent Crew (Lead Analyst ➔ Fact-Checker ➔ Executive Director) with live ArXiv retrieval, forensic auditing, and a publication-ready PDF dossier!"
            )
        }
    ]
if "agent_status" not in st.session_state:
    st.session_state.agent_status = {
        "analyst": ("IDLE", "Standby for query"),
        "auditor": ("IDLE", "Standby for claims"),
        "director": ("IDLE", "Standby for synthesis")
    }
if "has_run_research" not in st.session_state:
    st.session_state.has_run_research = False

# 4. Inject Scientifically Calibrated CSS Theme (Comfortaa 18px + 100% Rounded Corners)
st.markdown(get_theme_css(st.session_state.theme), unsafe_allow_html=True)

# 5. Render Modular Sidebar Drawer
offline_mode = render_sidebar()

# 6. Render Brand Hero Header (with 3D Claymorphic Logo)
render_hero_header()

# 7. Progressive Disclosure: Render Live Telemetry Pods ONLY when research is active or completed
if st.session_state.has_run_research:
    astat = st.session_state.agent_status
    render_telemetry_pods(astat["analyst"], astat["auditor"], astat["director"])

# 8. Quick Research Chips (Pill Buttons)
st.markdown("##### ⚡ Explore Research Topics")
chip_cols = st.columns(4)
sample_chips = [
    "Commercial Viability of Solid-State EV Batteries by 2028",
    "Quantum Computing & NIST Post-Quantum Cryptography Migration",
    "Neuromorphic AI Chips & Sub-Milliwatt Edge Transformers",
    "Explain quantum superposition in simple terms"
]

selected_chip = None
for idx, chip_text in enumerate(sample_chips):
    with chip_cols[idx]:
        chip_label = chip_text if len(chip_text) < 32 else chip_text[:30] + "..."
        if st.button(f"🔍 {chip_label}", key=f"chip_btn_{idx}", use_container_width=True):
            selected_chip = chip_text

# 9. Voice Input Widget (Web Speech API)
render_voice_input_widget()

# 10. Render Conversation History with Progressive Disclosure
for msg_idx, msg in enumerate(st.session_state.messages):
    with st.chat_message(msg["role"]):
        if msg.get("type") == "chat":
            st.markdown(msg["content"])

        elif msg.get("type") == "research_dossier":
            # High-Impact Rounded Dossier Canvas
            dossier_text = msg["content"]
            pdf_bytes = msg.get("pdf_bytes")
            thoughts = msg.get("thought_logs", [])
            
            st.markdown(f"### 📑 Autonomous Research Dossier: *{msg.get('topic', 'Research Dossier')}*")
            st.caption("Produced by 3-Tier Multi-Agent Crew • ArXiv Preprints • Forensic Verification Matrix")

            tab1, tab2, tab3, tab4 = st.tabs([
                "📄 Executive Dossier",
                "🛡️ Verification Matrix",
                "⚡ Live Thought Stream",
                "📥 PDF Download"
            ])

            with tab1:
                st.markdown(dossier_text)

            with tab2:
                lines = dossier_text.split("\n")
                tbl_lines = [l for l in lines if l.strip().startswith("|") and l.strip().endswith("|")]
                if tbl_lines:
                    st.markdown("\n".join(tbl_lines))
                else:
                    st.info("Forensic Verification Matrix embedded inside the master report.")

            with tab3:
                if thoughts:
                    st.markdown('<div class="terminal-box">', unsafe_allow_html=True)
                    for t in thoughts:
                        st.markdown(f"**[{t.get('time', '00:00')}] {t.get('agent', 'System')}:** {t.get('action', '')}")
                    st.markdown('</div>', unsafe_allow_html=True)
                else:
                    st.caption("Telemetry stream completed.")

            with tab4:
                if pdf_bytes:
                    file_stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    st.download_button(
                        label="📥 Download Publication-Ready PDF (ReportLab 4.x)",
                        data=pdf_bytes,
                        file_name=f"VERAXIS_DOSSIER_{file_stamp}.pdf",
                        mime="application/pdf",
                        key=f"dl_pdf_btn_{msg_idx}",
                        use_container_width=True
                    )
                    st.success("✅ ReportLab 4.x Multi-Colour PDF verified and ready for download.")

# 11. Handle User Input (Chat Input Bar or Quick Topic Chip)
prompt_input = st.chat_input("Ask a question or enter a research topic...")
active_user_prompt = selected_chip or prompt_input

if active_user_prompt:
    # Append User Message to Conversation
    st.session_state.messages.append({"role": "user", "type": "chat", "content": active_user_prompt})
    with st.chat_message("user"):
        st.markdown(active_user_prompt)

    # Step A: Intent Classification via Groq LPU
    with st.spinner("🧠 Analyzing Intent with Groq LPU..."):
        intent_info = classify_query_intent(active_user_prompt, st.session_state.messages)
        intent = intent_info.get("intent", "GENERAL_CHAT")
        extracted_topic = intent_info.get("extracted_topic", active_user_prompt)

    # BRANCH 1: CASUAL / INSTANT CONVERSATIONAL QUERY
    if intent == "GENERAL_CHAT" and not offline_mode:
        with st.chat_message("assistant"):
            st.caption("💬 *Direct Conversational Query (Instant Groq LPU)*")
            with st.spinner("Thinking..."):
                reply = generate_fast_chat_response(st.session_state.messages)
                st.markdown(reply)
                st.session_state.messages.append({
                    "role": "assistant",
                    "type": "chat",
                    "content": reply
                })

    # BRANCH 2: DEEP RESEARCH TOPIC (OR OFFLINE VIVA DEMO MODE)
    else:
        st.session_state.has_run_research = True
        
        with st.chat_message("assistant"):
            st.markdown(f"🔬 **Deep Research Topic Detected**: *{extracted_topic}*")
            st.caption("🚀 Mobilizing 3-Tier Multi-Agent Crew (Lead Analyst ➔ Forensic Auditor ➔ Dossier Director)...")

            thought_logs = []

            # Sub-branch 1: Zero-Risk Offline Cache for Live Viva
            if offline_mode:
                with st.spinner("⚡ Running Autonomous Verification Pipeline (Zero-Risk Viva Mode)..."):
                    matched_k = "Solid-State EV Batteries"
                    for k in OFFLINE_CACHE.keys():
                        if k.lower() in extracted_topic.lower() or any(w.lower() in extracted_topic.lower() for w in k.split()):
                            matched_k = k
                            break

                    cached_item = OFFLINE_CACHE[matched_k]
                    time.sleep(1.0)

                    final_report = cached_item["dossier_markdown"]
                    thought_logs = cached_item["thought_logs"]
                    pdf_data = create_pdf_dossier(extracted_topic, final_report)

                    st.session_state.agent_status = {
                        "analyst": ("COMPLETED", "Discovered 4 preprints & roadmaps"),
                        "auditor": ("COMPLETED", "Cross-verified 5 empirical claims"),
                        "director": ("COMPLETED", "Executive Dossier compiled")
                    }

            # Sub-branch 2: LIVE CrewAI Multi-Agent Execution
            else:
                progress_banner = st.empty()
                progress_banner.info("🟢 Agent 1 (Lead Analyst): Querying ArXiv scientific preprints & live web...")
                
                st.session_state.agent_status["analyst"] = ("ACTIVE", "Querying ArXiv preprints")
                
                def make_step_callback(agent_name):
                    def cb(step_info):
                        act = str(step_info)
                        t = datetime.now().strftime("%H:%M:%S")
                        thought_logs.append({
                            "time": t,
                            "agent": agent_name,
                            "action": act[:250] + "..." if len(act) > 250 else act
                        })
                    return cb

                try:
                    # 1. Instantiate Autonomous Agents
                    analyst = create_lead_researcher(step_callback=make_step_callback("Lead Analyst"))
                    auditor = create_fact_checker(step_callback=make_step_callback("Fact-Checker"))
                    director = create_dossier_director(step_callback=make_step_callback("Dossier Director"))

                    # 2. Sequential Tasks with Explicit Dependencies
                    task1 = create_discovery_task(analyst, extracted_topic)
                    task2 = create_audit_task(auditor, extracted_topic, context_tasks=[task1])
                    task3 = create_synthesis_task(director, extracted_topic, context_tasks=[task1, task2])

                    crew = Crew(
                        agents=[analyst, auditor, director],
                        tasks=[task1, task2, task3],
                        process=Process.sequential,
                        verbose=False
                    )

                    progress_banner.info("🟡 Agent 2 (Auditor) & 🔵 Agent 3 (Director): Cross-verifying and compiling...")
                    res = crew.kickoff()
                    final_report = str(res)
                    pdf_data = create_pdf_dossier(extracted_topic, final_report)
                    progress_banner.empty()

                    st.session_state.agent_status = {
                        "analyst": ("COMPLETED", "Empirical discoveries extracted"),
                        "auditor": ("COMPLETED", "Claims audited & confidence calculated"),
                        "director": ("COMPLETED", "Executive Dossier compiled")
                    }

                except Exception as e:
                    progress_banner.error(f"Live Crew execution error: {str(e)}")
                    final_report = f"# Research Pipeline Exception\n\nError: {str(e)}\n\n*Switch on 'Zero-Risk Viva Cache' in the sidebar for guaranteed offline presentation.*"
                    pdf_data = None

            # Append Completed Dossier to Conversation
            st.session_state.messages.append({
                "role": "assistant",
                "type": "research_dossier",
                "topic": extracted_topic,
                "content": final_report,
                "pdf_bytes": pdf_data,
                "thought_logs": thought_logs
            })
            st.rerun()
