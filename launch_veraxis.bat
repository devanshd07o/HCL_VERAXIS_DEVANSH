@echo off
title VERAXIS AI Launcher
cd /d "%~dp0"

:: Check if server is already running on port 8000
powershell -NoProfile -Command "$tcp = New-Object Net.Sockets.TcpClient; try { $tcp.Connect('127.0.0.1', 8000); $tcp.Close(); exit 0 } catch { exit 1 }"
if %ERRORLEVEL% NEQ 0 (
    start /B python main.py >nul 2>&1
)

:: Wait until HTTP endpoint responds
powershell -NoProfile -Command "for ($i=0; $i -lt 30; $i++) { try { $r = Invoke-WebRequest -Uri 'http://localhost:8000/api/status' -UseBasicParsing -TimeoutSec 1; if ($r.StatusCode -eq 200) { exit 0 } } catch {} Start-Sleep -Milliseconds 300 }; exit 0"

:: Launch standalone Electron-style application window
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="http://localhost:8000" --app-id="veraxis-ai" --window-size=1380,880
) else if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app="http://localhost:8000" --app-id="veraxis-ai" --window-size=1380,880
) else (
    start "" "http://localhost:8000"
)

exit
