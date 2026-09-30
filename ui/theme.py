"""
VERAXIS AI — Design System & Scientifically Proven Ergonomic Themes
- Font: Comfortaa 18px
- Strict Invariant: 100% Rounded Corners (Zero Straight Edges)
- Dual Palettes: Circadian Obsidian Clay (Dark) & Nordic Porcelain Clay (Bright)
- Micro-animations: slideUpFade, breathing pulses, claymorphic insets
"""

def get_theme_css(theme_mode: str = "Dark Obsidian") -> str:
    """Returns CSS with scientifically calibrated contrast, animations, and strict rounding."""
    is_dark = (theme_mode == "Dark Obsidian")
    
    if is_dark:
        # Dark Obsidian Clay (Circadian Ergonomics - Low Eye Strain, High Contrast)
        palette = """
        --bg-app: #080C15;
        --card-surface: #121A2B;
        --card-surface-subtle: #18233A;
        --card-shadow-out: 14px 14px 34px rgba(0, 3, 10, 0.75), -10px -10px 28px rgba(255, 255, 255, 0.035);
        --card-shadow-in: inset 3px 3px 6px rgba(255, 255, 255, 0.08), inset -3px -3px 8px rgba(0, 0, 0, 0.6);
        --clay-pill-shadow: 6px 6px 16px rgba(0, 0, 0, 0.6), inset 2px 2px 4px rgba(255, 255, 255, 0.12);
        --text-primary: #F8FAFC;
        --text-muted: #94A3B8;
        --border-clay: rgba(255, 255, 255, 0.08);
        --accent-cyan: #38BDF8;
        --accent-violet: #A78BFA;
        --accent-emerald: #10B981;
        --accent-amber: #F59E0B;
        --terminal-bg: #05080F;
        --user-bubble-bg: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%);
        --bot-bubble-bg: #121A2B;
        --input-bg: #121A2B;
        """
    else:
        # Nordic Porcelain Clay (Daylight Ergonomics - Anti-Glare, Soft Tactile Depth)
        palette = """
        --bg-app: #EEF3F8;
        --card-surface: #FFFFFF;
        --card-surface-subtle: #F1F5F9;
        --card-shadow-out: 12px 12px 28px rgba(165, 178, 198, 0.55), -10px -10px 24px rgba(255, 255, 255, 0.95);
        --card-shadow-in: inset 2px 2px 5px rgba(255, 255, 255, 0.95), inset -2px -2px 6px rgba(165, 178, 198, 0.28);
        --clay-pill-shadow: 6px 6px 14px rgba(165, 178, 198, 0.4), inset 2px 2px 4px rgba(255, 255, 255, 0.8);
        --text-primary: #0F172A;
        --text-muted: #475569;
        --border-clay: rgba(0, 0, 0, 0.08);
        --accent-cyan: #0284C7;
        --accent-violet: #7C3AED;
        --accent-emerald: #059669;
        --accent-amber: #D97706;
        --terminal-bg: #1E293B;
        --user-bubble-bg: linear-gradient(135deg, #0284C7 0%, #2563EB 100%);
        --bot-bubble-bg: #FFFFFF;
        --input-bg: #FFFFFF;
        """

    return f"""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

    :root {{
        {palette}
    }}

    /* STRICT MANDATE: ZERO STRAIGHT EDGES ANYWHERE IN THE APPLICATION */
    *, *::before, *::after {{
        border-radius: 28px !important;
    }}

    /* Global Typography: Comfortaa 18px */
    html, body, [class*="css"], .stApp, p, div, span, label, input, button, textarea {{
        font-family: 'Comfortaa', -apple-system, sans-serif !important;
        font-size: 18px !important;
        line-height: 1.65 !important;
    }}

    /* Base App Canvas */
    .stApp {{
        background-color: var(--bg-app) !important;
        color: var(--text-primary) !important;
    }}

    /* Hide Streamlit Native Header, Footer & MainMenu */
    header[data-testid="stHeader"] {{
        background: transparent !important;
        display: none !important;
    }}
    footer {{
        display: none !important;
    }}
    #MainMenu {{
        visibility: hidden !important;
    }}

    .block-container {{
        padding-top: 1.8rem !important;
        padding-bottom: 5.5rem !important;
        max-width: 1280px !important;
    }}

    /* Micro-Animations */
    @keyframes slideUpFade {{
        from {{
            opacity: 0;
            transform: translateY(18px);
        }}
        to {{
            opacity: 1;
            transform: translateY(0);
        }}
    }}

    @keyframes pulseGlow {{
        0% {{
            box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.6);
        }}
        70% {{
            box-shadow: 0 0 0 12px rgba(56, 189, 248, 0);
        }}
        100% {{
            box-shadow: 0 0 0 0 rgba(56, 189, 248, 0);
        }}
    }}

    @keyframes typingDot {{
        0%, 80%, 100% {{ transform: scale(0); opacity: 0.3; }}
        40% {{ transform: scale(1.0); opacity: 1; }}
    }}

    /* Claymorphic 3D Card */
    .clay-surface {{
        background: var(--card-surface) !important;
        border: 1px solid var(--border-clay) !important;
        box-shadow: var(--card-shadow-out), var(--card-shadow-in) !important;
        padding: 26px 32px !important;
        border-radius: 34px !important;
        color: var(--text-primary) !important;
        margin-bottom: 22px !important;
        animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }}

    /* Brand Header */
    .veraxis-hero {{
        display: flex;
        align-items: center;
        gap: 24px;
        background: var(--card-surface) !important;
        border: 1px solid var(--border-clay) !important;
        box-shadow: var(--card-shadow-out), var(--card-shadow-in) !important;
        padding: 24px 32px !important;
        border-radius: 36px !important;
        margin-bottom: 24px !important;
        animation: slideUpFade 0.5s ease forwards;
    }}

    .hero-logo-img {{
        width: 78px !important;
        height: 78px !important;
        border-radius: 24px !important;
        box-shadow: var(--clay-pill-shadow) !important;
        object-fit: cover !important;
    }}

    .hero-title {{
        font-size: 2.2rem !important;
        font-weight: 700 !important;
        margin: 0 !important;
        letter-spacing: -0.02em !important;
        color: var(--text-primary) !important;
    }}

    .hero-subtitle {{
        font-size: 0.95rem !important;
        color: var(--text-muted) !important;
        margin-top: 4px !important;
    }}

    /* Telemetry Row */
    .telemetry-container {{
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 22px;
        animation: slideUpFade 0.6s ease forwards;
    }}

    .telemetry-card {{
        background: var(--card-surface) !important;
        border: 1px solid var(--border-clay) !important;
        box-shadow: var(--card-shadow-out), var(--card-shadow-in) !important;
        padding: 16px 22px !important;
        border-radius: 9999px !important;
        display: flex;
        align-items: center;
        gap: 16px;
    }}

    .pulse-indicator {{
        width: 16px;
        height: 16px;
        border-radius: 9999px !important;
        display: inline-block;
        animation: pulseGlow 2.2s infinite;
    }}

    .pulse-lead {{ background-color: var(--accent-cyan); }}
    .pulse-audit {{ background-color: var(--accent-amber); }}
    .pulse-editor {{ background-color: var(--accent-emerald); }}

    /* Conversational Chat Bubbles */
    .chat-bubble-user {{
        background: var(--user-bubble-bg) !important;
        color: #FFFFFF !important;
        padding: 20px 28px !important;
        border-radius: 32px 32px 6px 32px !important;
        box-shadow: var(--card-shadow-out) !important;
        margin-left: auto !important;
        max-width: 82% !important;
        margin-bottom: 18px !important;
        animation: slideUpFade 0.35s ease forwards;
    }}

    .chat-bubble-bot {{
        background: var(--bot-bubble-bg) !important;
        color: var(--text-primary) !important;
        border: 1px solid var(--border-clay) !important;
        box-shadow: var(--card-shadow-out), var(--card-shadow-in) !important;
        padding: 22px 30px !important;
        border-radius: 32px 32px 32px 6px !important;
        max-width: 90% !important;
        margin-bottom: 20px !important;
        animation: slideUpFade 0.4s ease forwards;
    }}

    /* Streamlit Chat Message Override */
    div[data-testid="stChatMessage"] {{
        background: var(--card-surface) !important;
        border: 1px solid var(--border-clay) !important;
        box-shadow: var(--card-shadow-out), var(--card-shadow-in) !important;
        padding: 22px 28px !important;
        border-radius: 32px !important;
        margin-bottom: 18px !important;
        color: var(--text-primary) !important;
        animation: slideUpFade 0.35s ease forwards;
    }}

    /* Input Pill Bar */
    div[data-testid="stChatInput"] {{
        background: transparent !important;
    }}

    div[data-testid="stChatInput"] > div {{
        background: var(--input-bg) !important;
        border: 1px solid var(--border-clay) !important;
        box-shadow: var(--card-shadow-out), var(--card-shadow-in) !important;
        border-radius: 9999px !important;
        padding: 8px 16px !important;
    }}

    div[data-testid="stChatInput"] textarea {{
        font-family: 'Comfortaa', sans-serif !important;
        font-size: 18px !important;
        color: var(--text-primary) !important;
    }}

    /* Buttons: Tactile 3D Pillows */
    div.stButton > button,
    .stDownloadButton > button {{
        background: linear-gradient(135deg, #0284C7 0%, #2563EB 100%) !important;
        color: #FFFFFF !important;
        font-family: 'Comfortaa', sans-serif !important;
        font-size: 18px !important;
        font-weight: 700 !important;
        border-radius: 9999px !important;
        padding: 14px 30px !important;
        border: 1px solid rgba(255, 255, 255, 0.25) !important;
        box-shadow: var(--clay-pill-shadow) !important;
        transition: transform 0.2s ease, box-shadow 0.2s ease !important;
    }}

    div.stButton > button:hover,
    .stDownloadButton > button:hover {{
        transform: translateY(-2px) scale(1.02) !important;
        box-shadow: 0 10px 24px rgba(2, 132, 199, 0.45) !important;
    }}

    div.stButton > button:active,
    .stDownloadButton > button:active {{
        transform: translateY(1px) scale(0.98) !important;
    }}

    /* Tabs: Rounded Soft Pills */
    .stTabs [data-baseweb="tab-list"] {{
        background: transparent !important;
        gap: 14px !important;
        margin-bottom: 20px !important;
    }}

    .stTabs [data-baseweb="tab"] {{
        background: var(--card-surface) !important;
        border-radius: 9999px !important;
        border: 1px solid var(--border-clay) !important;
        box-shadow: var(--card-shadow-out) !important;
        color: var(--text-muted) !important;
        font-weight: 600 !important;
        padding: 10px 26px !important;
        font-size: 18px !important;
        transition: all 0.25s ease !important;
    }}

    .stTabs [aria-selected="true"] {{
        background: var(--card-surface-subtle) !important;
        color: var(--accent-cyan) !important;
        border: 1px solid var(--accent-cyan) !important;
        box-shadow: var(--card-shadow-out), var(--card-shadow-in) !important;
    }}

    /* Terminal Thought Log */
    .terminal-box {{
        background: var(--terminal-bg) !important;
        border-radius: 28px !important;
        padding: 22px 26px !important;
        font-family: 'JetBrains Mono', monospace !important;
        font-size: 15px !important;
        color: #E2E8F0 !important;
        box-shadow: inset 4px 4px 10px rgba(0, 0, 0, 0.7), inset -2px -2px 6px rgba(255, 255, 255, 0.05) !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        max-height: 400px;
        overflow-y: auto;
        line-height: 1.6 !important;
    }}

    /* Tables: Strictly Rounded */
    table {{
        width: 100%;
        border-collapse: separate !important;
        border-spacing: 0 !important;
        border-radius: 28px !important;
        overflow: hidden !important;
        border: 1px solid var(--border-clay) !important;
        margin: 18px 0 !important;
    }}

    th {{
        background: #1E293B !important;
        color: #FFFFFF !important;
        font-weight: 700 !important;
        padding: 14px 18px !important;
        font-size: 16px !important;
    }}

    td {{
        padding: 14px 18px !important;
        font-size: 16px !important;
        border-top: 1px solid var(--border-clay) !important;
    }}
    </style>
    """
