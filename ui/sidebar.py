"""
VERAXIS AI — Modular SaaS Sidebar Drawer
Contains scientific theme switcher, key pool telemetry, and presentation failover controls.
"""

import streamlit as st
from config import key_manager

def render_sidebar():
    """Renders the modular enterprise SaaS sidebar drawer."""
    with st.sidebar:
        st.markdown("### 🎛️ System Controls")
        
        # 1. Scientific Theme Selector (Ergonomic Palettes)
        theme_choice = st.radio(
            "🎨 Ergonomic Theme Mode",
            options=["Dark Obsidian", "Light Porcelain"],
            index=0 if st.session_state.theme == "Dark Obsidian" else 1,
            help="Dark Obsidian eliminates circadian blue-light strain; Light Porcelain eliminates glare for daytime readability."
        )
        if theme_choice != st.session_state.theme:
            st.session_state.theme = theme_choice
            st.rerun()

        st.markdown("---")
        
        # 2. Viva Presentation Failover Toggle
        offline_toggle = st.toggle(
            "⚡ Zero-Risk Viva Cache",
            value=st.session_state.get("offline_toggle", False),
            help="When toggled ON, instantly loads pre-computed empirical dossiers for zero-risk campus viva evaluation if Wi-Fi degrades."
        )
        st.session_state["offline_toggle"] = offline_toggle

        st.markdown("---")
        
        # 3. Dynamic Key Telemetry Pool
        st.markdown("#### 🔑 Multi-Key Telemetry Pool")
        telemetry = key_manager.get_status_telemetry()
        col1, col2 = st.columns(2)
        with col1:
            st.metric("Total Keys", telemetry["total_keys"])
        with col2:
            st.metric("Active Keys", telemetry["active_keys"])
        
        st.caption(f"**Primary Inference**: `{telemetry['primary_model']}`")
        st.caption(f"**Fallback Engine**: `Gemini 2.5 Flash ({'Armed' if telemetry['gemini_available'] else 'Offline'})`")

        st.markdown("---")
        
        # 4. Actions
        if st.button("🧹 Clear Chat History", use_container_width=True):
            st.session_state.messages = [
                {
                    "role": "assistant",
                    "type": "chat",
                    "content": "Conversation cleared. Ready for your next query or deep-tech research topic!"
                }
            ]
            st.rerun()

        st.caption("VERAXIS AI v2.4 • HCL B.Tech Capstone 2026")
    return offline_toggle
