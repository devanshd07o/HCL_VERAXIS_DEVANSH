# VERAXIS AI — Setup Guide

> **Multi-Agent Agentic Research Intelligence System**  
> ABES Engineering College | CSE-AI | Major Project | Batch 2026

---

## 📁 Project Structure (This ZIP)

```
VERAXIS_AI/
├── backend/
│   ├── main.py               # FastAPI app entrypoint + all API routes
│   ├── research_engine.py    # CrewAI multi-agent orchestration engine
│   ├── router.py             # Agent routing & task dispatch logic
│   └── pdf_generator.py      # ReportLab-based PDF export engine
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                        # Root React component
│   │   ├── index.css                      # Global CSS + all theme tokens
│   │   └── components/
│   │       └── workbench/
│   │           ├── ChatWorkspace.tsx      # Main chat UI + SSE streaming
│   │           ├── VaultSettings.tsx      # API key vault + theme switcher
│   │           └── SessionRail.tsx        # Session sidebar + history
│   ├── package.json          # Node dependencies
│   ├── vite.config.js        # Vite build config
│   └── index.html            # HTML shell
│
├── requirements.txt          # Python dependencies
├── .env.example              # API keys template
├── config.py                 # App config & env loader
├── server.py                 # Uvicorn server launcher
├── INSTALL.bat               # ← ONE-CLICK install (run this first)
├── launch_veraxis.bat        # ← Launch after install
└── VERAXIS_AI_Major_Project_Synopsis.md   # Full project documentation
```

---

## ⚡ Quick Start (Windows)

### Step 1 — Prerequisites
| Tool | Version | Download |
|------|---------|----------|
| Python | 3.10+ | https://python.org |
| Node.js | 18+ | https://nodejs.org |

### Step 2 — Install (One Click)
```
Double-click: INSTALL.bat
```
This will:
1. Install all Python packages (`pip install -r requirements.txt`)
2. Install Node.js packages (`npm install` in `/frontend`)
3. Build the React frontend (`npm run build`)
4. Copy `.env.example` → `.env` if not present

### Step 3 — Configure API Keys
Open `.env` and fill in:
```env
OPENAI_API_KEY=sk-...          # Required: OpenAI GPT-4o
GROQ_API_KEY=gsk_...           # Optional: Groq LLM (faster)
TAVILY_API_KEY=tvly-...        # Optional: Tavily web search
```

### Step 4 — Launch
```
Double-click: launch_veraxis.bat
```
App opens automatically in browser/Edge app mode at `http://localhost:8000`

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3.11, FastAPI, Uvicorn |
| **AI Engine** | CrewAI, OpenAI GPT-4o, Groq |
| **Research** | Arxiv API, DuckDuckGo, Wikipedia |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4 |
| **UI Effects** | Liquid-GL, Framer Motion |
| **PDF Export** | ReportLab |

---

## 🔑 Key Features

- **Multi-Agent Research** — Parallel AI agents (Analyst, Strategist, Synthesizer, Critic) collaborate on queries
- **Live SSE Streaming** — Real-time token-by-token response streaming
- **Source Citations** — All claims linked to verified sources
- **PDF Export** — Publication-grade research dossiers downloadable as PDF
- **Session Memory** — Persistent conversation history with session management
- **6 Themes** — Carbon Titanium, Cyber Rose, Imperial Gold, Crimson Noir, Solar Blaze, OLED Platinum
- **API Vault** — Secure in-app key management (no plaintext logging)

---

## 🛠️ Manual Setup (if INSTALL.bat fails)

```bash
# Backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
npm run build
cd ..

# Launch
python server.py
```

---

## 📌 Notes

- The app serves pre-built frontend from `/frontend/dist` via FastAPI static files
- No separate frontend server needed in production mode
- For development (hot-reload): run `npm run dev` in `/frontend` separately
- Port 8000 is used by default; change in `config.py`

---

*VERAXIS AI — Built with CrewAI + FastAPI + React 19*
