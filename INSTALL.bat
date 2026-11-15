@echo off
title VERAXIS AI — One-Click Installer
cd /d "%~dp0"
color 0A

echo ==========================================================
echo   VERAXIS AI — Automated Setup ^& Install
echo   Multi-Agent Agentic Research Intelligence System
echo ==========================================================
echo.

:: ── 1. Python check ───────────────────────────────────────
echo [1/4] Checking Python...
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Python not found. Install Python 3.10+ from https://python.org
    pause & exit /b 1
)
python --version

:: ── 2. Backend dependencies ───────────────────────────────
echo.
echo [2/4] Installing Python dependencies (requirements.txt)...
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: pip install failed. Check your internet connection.
    pause & exit /b 1
)
echo [OK] Python dependencies installed.

:: ── 3. Frontend dependencies ──────────────────────────────
echo.
echo [3/4] Installing Node.js dependencies (frontend)...
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: npm not found. Skipping frontend dev-mode install.
    echo          The pre-built app in /dist will still work via Python server.
    goto :build_skip
)
cd frontend
npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm install failed.
    pause & exit /b 1
)

:: ── 4. Build frontend ─────────────────────────────────────
echo.
echo [4/4] Building frontend (npm run build)...
npm run build
cd ..
echo [OK] Frontend built.

:build_skip

:: ── .env setup prompt ────────────────────────────────────
echo.
if not exist ".env" (
    echo [SETUP] .env file not found — copying from .env.example
    copy .env.example .env >nul
    echo [ACTION REQUIRED] Open .env and fill in your API keys before launching.
) else (
    echo [OK] .env file already exists.
)

echo.
echo ==========================================================
echo   DONE! Run launch_veraxis.bat to start VERAXIS AI.
echo ==========================================================
echo.
pause
