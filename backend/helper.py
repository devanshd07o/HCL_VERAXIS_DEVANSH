"""
VERAXIS AI — Industry Standard Helper Utilities
Contains production-grade utility functions for text normalization, citation extraction,
mathematical token estimation, table formatting, security sanitization, and system diagnostics.
"""

import os
import re
import sys
import time
import hashlib
from typing import Dict, List, Any, Optional, Tuple
from dotenv import load_dotenv

load_dotenv()


def sanitize_filename(name: str, max_length: int = 60) -> str:
    """
    Sanitizes arbitrary text to create safe, OS-agnostic file basenames.
    Removes invalid Windows/Linux characters and truncates safely.
    """
    if not name:
        return "veraxis_export"
    # Replace non-alphanumeric (except hyphen and underscore) with underscore
    clean = re.sub(r'[^a-zA-Z0-9_\-]', '_', name.strip())
    # Collapse consecutive underscores
    clean = re.sub(r'_+', '_', clean).strip('_')
    return clean[:max_length] if clean else "veraxis_export"


def estimate_token_count(text: str) -> int:
    """
    Empirical heuristic for token estimation across BPE tokenizers (~4 chars/token).
    Used for context budgeting across Groq/Gemini calls.
    """
    if not text:
        return 0
    # Standard rule of thumb: ~4 characters per token for English text & code
    return max(1, int(len(text) / 3.8))


def extract_citations_and_links(markdown_text: str) -> List[Dict[str, str]]:
    """
    Parses Markdown and plain text to extract scholarly citations, arXiv IDs,
    and HTTP/HTTPS reference hyperlinks.
    """
    if not markdown_text:
        return []
    
    citations = []
    seen_urls = set()

    # Match standard markdown links: [Title](URL)
    md_link_pattern = re.compile(r'\[([^\]]+)\]\((https?://[^\)]+)\)')
    for match in md_link_pattern.finditer(markdown_text):
        title, url = match.groups()
        if url not in seen_urls:
            seen_urls.add(url)
            citations.append({
                "type": "markdown_link",
                "title": title.strip(),
                "url": url.strip()
            })

    # Match bare URLs: http:// or https://
    bare_url_pattern = re.compile(r'(?<!\()(https?://[^\s\),>]+)')
    for match in bare_url_pattern.finditer(markdown_text):
        url = match.group(1).rstrip('.,;:')
        if url not in seen_urls:
            seen_urls.add(url)
            citations.append({
                "type": "direct_url",
                "title": url,
                "url": url
            })

    # Match ArXiv IDs (e.g., arXiv:2303.08774)
    arxiv_pattern = re.compile(r'\barXiv:(\d{4}\.\d{4,5}(?:v\d+)?)\b', re.IGNORECASE)
    for match in arxiv_pattern.finditer(markdown_text):
        arxiv_id = match.group(1)
        url = f"https://arxiv.org/abs/{arxiv_id}"
        if url not in seen_urls:
            seen_urls.add(url)
            citations.append({
                "type": "arxiv_paper",
                "title": f"arXiv:{arxiv_id}",
                "url": url
            })

    return citations


def format_markdown_table(headers: List[str], rows: List[List[Any]]) -> str:
    """
    Constructs a deterministic, compliant GitHub-flavored Markdown table.
    Ensures column alignment and escapes internal pipe characters.
    """
    if not headers:
        return ""

    escaped_headers = [str(h).replace("|", "\\|").strip() for h in headers]
    col_widths = [len(h) for h in escaped_headers]

    # Calculate required column widths
    clean_rows = []
    for row in rows:
        clean_row = []
        for i in range(len(escaped_headers)):
            val = str(row[i]) if i < len(row) else ""
            escaped_val = val.replace("|", "\\|").replace("\n", " ").strip()
            clean_row.append(escaped_val)
            if len(escaped_val) > col_widths[i]:
                col_widths[i] = len(escaped_val)
        clean_rows.append(clean_row)

    # Format header & divider
    header_line = "| " + " | ".join(h.ljust(col_widths[i]) for i, h in enumerate(escaped_headers)) + " |"
    divider_line = "|-" + "-|-".join("-" * col_widths[i] for i in range(len(escaped_headers))) + "-|"

    # Format data rows
    data_lines = [
        "| " + " | ".join(r[i].ljust(col_widths[i]) for i in range(len(escaped_headers))) + " |"
        for r in clean_rows
    ]

    return "\n".join([header_line, divider_line] + data_lines)


def normalize_math_and_prose(text: str) -> str:
    """
    Sanitizes LLM markdown output to ensure bulletproof LaTeX and typography:
    - Protects true block equations: \\[ ... \\] and $$ ... $$
    - Converts chemical subscripts like Li$_{7}$La$_{3}$Zr$_{2}$O$_{12}$ to clean scientific Unicode subscripts: Li₇La₃Zr₂O₁₂
    - Normalizes superscript exponents: 10^{-6} -> 10⁻⁶, cm^{-2} -> cm⁻², m^{1/2} -> m½
    - Replaces naked TeX macros in prose & tables: \\le -> ≤, \\ge -> ≥, \\approx -> ≈, \\times -> ×, \\pm -> ±, \\cdot -> ·, \\mu -> μ, \\Omega -> Ω, \\text{...} -> ...
    - Fixes naked dollar signs in table cells (e.g. '30$' -> '$30')
    - Restores protected block math intact
    """
    if not text:
        return ""

    blocks = []
    def save_block(m):
        blocks.append(m.group(0))
        return f"__MATH_BLOCK_{len(blocks)-1}__"

    # Save true block equations so their internal LaTeX syntax is preserved
    clean = re.sub(r'(\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$)', save_block, text)

    sub_map = str.maketrans('0123456789+-=', '₀₁₂₃₄₅₆₇₈₉₊₋₌')
    sup_map = str.maketrans('0123456789+-=', '⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼')

    # Convert chemical subscripts like Li$_{7}$, Li_{7}, Li_3
    clean = re.sub(
        r'([A-Z][a-z]?)(?:\$_\{?(\d+)\}?\$|_\{?(\d+)\}?|\b_(\d+)\b)',
        lambda m: m.group(1) + (m.group(2) or m.group(3) or m.group(4) or '').translate(sub_map),
        clean
    )

    # Convert common scientific superscripts like 10^{-6}, 10^{-7}, cm^{-2}, m^{1/2}
    def replace_sup(m):
        base = m.group(1)
        val = m.group(2)
        if val == '1/2':
            return f"{base}½"
        if val.startswith('-'):
            return f"{base}⁻" + val[1:].translate(sup_map)
        return f"{base}" + val.translate(sup_map)

    clean = re.sub(r'([a-zA-Z0-9]+)\^\{?(-?\d+|1/2)\}?', replace_sup, clean)

    # Strip / replace naked TeX macros in regular prose and markdown tables
    replacements = [
        (r'\\le\b', '≤'),
        (r'\\ge\b', '≥'),
        (r'\\approx\b', '≈'),
        (r'\\times\b', '×'),
        (r'\\pm\b', '±'),
        (r'\\cdot\b', '·'),
        (r'\\mu\b', 'μ'),
        (r'\\alpha\b', 'α'),
        (r'\\beta\b', 'β'),
        (r'\\gamma\b', 'γ'),
        (r'\\sigma\b', 'σ'),
        (r'\\Omega\b', 'Ω'),
        (r'\\text\{([^}]+)\}', r'\1'),
        (r'\\([ ]+)', ' '),
        (r'\\,', ' '),
    ]
    for pattern, rep in replacements:
        clean = re.sub(pattern, rep, clean)

    # Fix trailing dollar signs in tables or prices: " 30$" -> " $30", " 120$" -> " $120"
    clean = re.sub(r'(?<=\s)(\d+(?:\.\d+)?)\$', r'$\1', clean)
    clean = re.sub(r'([≤≥≈~])\s*(\d+(?:\.\d+)?)\$', r'\1 $\2', clean)

    # Restore protected equations
    for i, b in enumerate(blocks):
        clean = clean.replace(f"__MATH_BLOCK_{i}__", b)

    return clean


def generate_content_hash(content: str) -> str:
    """Generates a consistent SHA-256 fingerprint for cache keys and verification tracking."""
    return hashlib.sha256(content.encode("utf-8", errors="ignore")).hexdigest()[:16]


def format_duration(seconds: float) -> str:
    """Formats execution elapsed time into human-readable strings."""
    if seconds < 1.0:
        return f"{int(seconds * 1000)}ms"
    if seconds < 60.0:
        return f"{seconds:.2f}s"
    minutes = int(seconds // 60)
    rem_sec = seconds % 60
    return f"{minutes}m {rem_sec:.1f}s"


def validate_system_environment() -> Dict[str, Any]:
    """
    Validates runtime system health, Python environment, directory scaffolds,
    and presence of LLM API keys.
    """
    checks = {
        "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        "os_platform": sys.platform,
        "groq_keys_available": False,
        "gemini_key_available": bool(os.getenv("GEMINI_API_KEY", "").strip()),
        "pdf_exports_writable": False,
        "all_checks_passed": False
    }

    # Check Groq keys via key_manager or environment
    try:
        from backend.config import key_manager
        if key_manager.groq_keys:
            checks["groq_keys_available"] = True
    except Exception:
        keys_env = os.getenv("GROQ_API_KEYS", "") or os.getenv("GROQ_API_KEY", "")
        if any(k.strip().startswith("gsk_") for k in keys_env.split(",")):
            checks["groq_keys_available"] = True

    # Check export directory
    export_dir = os.path.join(os.getcwd(), "pdf_exports")
    try:
        os.makedirs(export_dir, exist_ok=True)
        test_file = os.path.join(export_dir, ".health_check.tmp")
        with open(test_file, "w") as f:
            f.write("ok")
        if os.path.exists(test_file):
            os.remove(test_file)
            checks["pdf_exports_writable"] = True
    except Exception:
        checks["pdf_exports_writable"] = False

    checks["all_checks_passed"] = checks["groq_keys_available"] and checks["pdf_exports_writable"]
    return checks
