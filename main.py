"""
VERAXIS AI — Unified Application Entrypoint
Industry-standard single entrypoint for booting the fullstack research intelligence platform.
Usage:
    python main.py                 # Boots production server on http://localhost:8000
    python main.py --port 8080     # Custom port
    python main.py --reload        # Hot reloading for backend development
    python main.py --test          # Runs automated test suite
    python main.py --health        # Runs diagnostic health checks
"""

import os
import sys
import argparse

# Configure UTF-8 stdout
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.helper import validate_system_environment


def print_banner(host: str, port: int):
    """Displays startup banner with active endpoints."""
    print("=" * 72)
    print("   ⚡ VERAXIS AI — Autonomous Scientific Research & Intelligence Platform")
    print("=" * 72)
    print(f" • Architecture : 3-Tier Multi-Agent CrewAI + ReportLab 4.x PDF")
    print(f" • Web UI Engine: React + Tailwind CSS + WebGL 2 Liquid Glass")
    print(f" • Primary URL  : http://{host}:{port}")
    print(f" • API Health   : http://{host}:{port}/api/status")
    print(f" • API Docs     : http://{host}:{port}/docs")
    print("=" * 72)


def run_health_check():
    """Runs non-destructive system diagnostics."""
    print("\n🔍 Running VERAXIS System Diagnostics...")
    results = validate_system_environment()
    for k, v in results.items():
        icon = "✅" if v else "⚠️"
        print(f"  {icon} {k.ljust(25)}: {v}")
    if results["all_checks_passed"]:
        print("\n✨ All critical systems operational.\n")
    else:
        print("\n⚠️ Note: Set GROQ_API_KEYS in .env for live multi-agent execution.\n")


def main():
    parser = argparse.ArgumentParser(description="VERAXIS AI Application Launcher")
    parser.add_argument("--host", default="0.0.0.0", help="Binding host address (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=8000, help="Port to serve on (default: 8000)")
    parser.add_argument("--reload", action="store_true", help="Enable uvicorn hot reloading")
    parser.add_argument("--health", action="store_true", help="Run system diagnostics and exit")
    parser.add_argument("--test", action="store_true", help="Execute automated test suite and exit")
    args = parser.parse_args()

    if args.health:
        run_health_check()
        return

    if args.test:
        import subprocess
        print("🧪 Executing test suite via test.py...\n")
        sys.exit(subprocess.call([sys.executable, os.path.join(PROJECT_ROOT, "test.py")]))

    # Pre-flight check
    run_health_check()
    print_banner(args.host if args.host != "0.0.0.0" else "localhost", args.port)

    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload
    )


if __name__ == "__main__":
    main()
