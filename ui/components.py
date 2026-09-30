"""
VERAXIS AI — Modular UI Components
- Brand Hero Header with 3D Claymorphic Logo
- Live Multi-Agent Telemetry Pods (Pills with breathing glow)
- Web Speech API Voice Input Component
- Progressive Disclosure Dossier & PDF Studio Cards
"""

import os
import base64
from datetime import datetime
import streamlit as st
import streamlit.components.v1 as components

def get_base64_image(image_path: str) -> str:
    """Read local image and convert to base64 for reliable HTML embedding."""
    if os.path.exists(image_path):
        with open(image_path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")
    return ""

def render_hero_header():
    """Renders the rebranded VERAXIS AI 3D Hero Header with logo and status badge."""
    logo_path = os.path.join(os.path.dirname(__file__), "..", "assets", "veraxis_logo.png")
    b64_logo = get_base64_image(logo_path)
    
    img_tag = f'<img src="data:image/png;base64,{b64_logo}" class="hero-logo-img" alt="Veraxis AI Logo" />' if b64_logo else '<div class="hero-logo-img" style="background:#2563EB;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;">VX</div>'

    st.markdown(f"""
    <div class="veraxis-hero">
        {img_tag}
        <div style="flex-grow: 1;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <h1 class="hero-title">VERAXIS AI</h1>
                <span style="background: rgba(16, 185, 129, 0.15); border: 1px solid #10B981; color: #10B981; font-weight: 700; font-size: 0.75rem; padding: 4px 14px; border-radius: 9999px;">
                    ● 41-KEY GROQ LPU LIVE
                </span>
            </div>
            <div class="hero-subtitle">
                Autonomous Multi-Agent Scientific Intelligence & Forensic Verification Platform
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

def render_telemetry_pods(analyst_state: tuple, auditor_state: tuple, director_state: tuple):
    """Renders live rounded telemetry pills for the 3 agents."""
    st.markdown(f"""
    <div class="telemetry-container">
        <div class="telemetry-card">
            <span class="pulse-indicator pulse-lead"></span>
            <div>
                <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Agent 1 • Discovery</div>
                <div style="font-size: 0.95rem; font-weight: 700;">Lead Analyst</div>
                <div style="font-size: 0.8rem; color: var(--accent-cyan); font-family: 'JetBrains Mono';">{analyst_state[0]}: {analyst_state[1]}</div>
            </div>
        </div>
        <div class="telemetry-card">
            <span class="pulse-indicator pulse-audit"></span>
            <div>
                <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Agent 2 • Auditor</div>
                <div style="font-size: 0.95rem; font-weight: 700;">Fact-Checker</div>
                <div style="font-size: 0.8rem; color: var(--accent-amber); font-family: 'JetBrains Mono';">{auditor_state[0]}: {auditor_state[1]}</div>
            </div>
        </div>
        <div class="telemetry-card">
            <span class="pulse-indicator pulse-editor"></span>
            <div>
                <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Agent 3 • Director</div>
                <div style="font-size: 0.95rem; font-weight: 700;">Executive Editor</div>
                <div style="font-size: 0.8rem; color: var(--accent-emerald); font-family: 'JetBrains Mono';">{director_state[0]}: {director_state[1]}</div>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

def render_voice_input_widget():
    """
    HTML5 Web Speech API Voice Dictation Component.
    Allows speaking prompts directly into the chat.
    """
    html_code = """
    <div style="display: flex; align-items: center; justify-content: flex-end; margin-bottom: 8px;">
        <button id="voice-btn" onclick="toggleSpeech()" style="
            background: linear-gradient(135deg, #0284C7 0%, #2563EB 100%);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 8px 18px;
            border-radius: 9999px;
            font-family: 'Comfortaa', sans-serif;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s ease;
        ">
            <span id="mic-icon">🎙️</span> <span id="btn-text">Voice Dictation</span>
        </button>
    </div>

    <script>
    let recognition;
    let recognizing = false;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRec();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = function() {
            recognizing = true;
            document.getElementById('btn-text').innerText = 'Listening...';
            document.getElementById('voice-btn').style.background = 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)';
        };

        recognition.onend = function() {
            recognizing = false;
            document.getElementById('btn-text').innerText = 'Voice Dictation';
            document.getElementById('voice-btn').style.background = 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)';
        };

        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            // Write into Streamlit chat input if accessible
            const textareas = window.parent.document.querySelectorAll('textarea');
            if (textareas && textareas.length > 0) {
                const ta = textareas[textareas.length - 1];
                ta.value = transcript;
                ta.dispatchEvent(new Event('input', { bubbles: true }));
            }
        };
    }

    function toggleSpeech() {
        if (!recognition) {
            alert('Web Speech API is not supported in this browser. Please use Google Chrome or Edge.');
            return;
        }
        if (recognizing) {
            recognition.stop();
        } else {
            recognition.start();
        }
    }
    </script>
    """
    components.html(html_code, height=52)
