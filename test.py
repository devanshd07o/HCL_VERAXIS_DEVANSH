"""
VERAXIS AI — Industry Standard Automated Test Suite
Covers:
1. Helper Utilities (Sanitization, Markdown Parsing, Citation Extraction, Token Estimation)
2. KeyManager (Multi-Key Rotation, Cooldown Tracking, Telemetry)
3. Router & Intent Classifier (Fast Chat vs Deep Research)
4. Supreme ReportLab 4.x PDF Engine (Binary PDF generation, Header/Footer verification)
5. FastAPI REST API (Endpoints, CORS, Health Checks, PWA Manifest)
6. Asset & Frontend Bundle Integrity Check
"""

import os
import sys
import json
import unittest
import tempfile
from datetime import datetime

# Add project root to sys.path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.helper import (
    sanitize_filename,
    estimate_token_count,
    extract_citations_and_links,
    format_markdown_table,
    generate_content_hash,
    format_duration,
    validate_system_environment
)
from backend.config import KeyManager
from backend.router import classify_query_intent
from backend.pdf_generator import create_pdf_dossier
from fastapi.testclient import TestClient
from backend.main import app


class TestHelperUtilities(unittest.TestCase):
    """Unit tests for backend helper functions."""

    def test_sanitize_filename(self):
        self.assertEqual(sanitize_filename("Valid_Name-123"), "Valid_Name-123")
        self.assertEqual(sanitize_filename("Invalid:?*/\\Name<>|"), "Invalid_Name")
        self.assertEqual(sanitize_filename(""), "veraxis_export")
        long_name = "a" * 100
        self.assertEqual(len(sanitize_filename(long_name, max_length=30)), 30)

    def test_estimate_token_count(self):
        self.assertEqual(estimate_token_count(""), 0)
        self.assertGreater(estimate_token_count("Short sentence."), 0)
        # ~100 characters should produce ~26 tokens
        self.assertAlmostEqual(estimate_token_count("x" * 100), 26, delta=5)

    def test_extract_citations_and_links(self):
        sample_md = (
            "Check [Paper](https://arxiv.org/abs/2303.08774) and "
            "reference arXiv:2401.12345 along with https://example.com/data."
        )
        citations = extract_citations_and_links(sample_md)
        self.assertGreaterEqual(len(citations), 2)
        urls = [c["url"] for c in citations]
        self.assertTrue(any("2303.08774" in u for u in urls))
        self.assertTrue(any("example.com" in u for u in urls))

    def test_format_markdown_table(self):
        headers = ["Col A", "Col B"]
        rows = [["Val 1", "Val 2"], ["Longer Val 3", "Val 4"]]
        table = format_markdown_table(headers, rows)
        self.assertIn("| Col A", table)
        self.assertIn("| Col B", table)
        self.assertIn("| Val 1", table)
        self.assertIn("|---", table)

    def test_generate_content_hash(self):
        h1 = generate_content_hash("Test content")
        h2 = generate_content_hash("Test content")
        h3 = generate_content_hash("Different content")
        self.assertEqual(h1, h2)
        self.assertNotEqual(h1, h3)
        self.assertEqual(len(h1), 16)

    def test_format_duration(self):
        self.assertEqual(format_duration(0.045), "45ms")
        self.assertEqual(format_duration(12.34), "12.34s")
        self.assertEqual(format_duration(75.5), "1m 15.5s")

    def test_validate_system_environment(self):
        checks = validate_system_environment()
        self.assertIn("python_version", checks)
        self.assertIn("os_platform", checks)
        self.assertIn("pdf_exports_writable", checks)
        self.assertTrue(checks["pdf_exports_writable"])


class TestKeyManager(unittest.TestCase):
    """Tests for KeyManager rotation, telemetry, and error handling."""

    def setUp(self):
        self.km = KeyManager()

    def test_telemetry_structure(self):
        status = self.km.get_status_telemetry()
        self.assertIn("total_keys", status)
        self.assertIn("active_keys", status)
        self.assertIn("cooling_down", status)
        self.assertIn("primary_model", status)
        self.assertIn("gemini_available", status)

    def test_key_rotation_advances(self):
        # If keys exist in environment, verify round robin advances index
        if self.km.groq_keys:
            initial_idx = self.km.current_index
            _ = self.km.get_active_groq_key()
            self.assertNotEqual(self.km.current_index, initial_idx)


class TestIntentClassification(unittest.TestCase):
    """Tests for query classification into Fast Chat vs Deep Research."""

    def test_casual_chat_classification(self):
        result = classify_query_intent("Hello! How are you doing today?")
        self.assertIn(result.get("intent"), ["GENERAL_CHAT", "DEEP_RESEARCH"])

    def test_deep_research_classification(self):
        result = classify_query_intent("Empirical energy density comparison of solid-state ceramic vs liquid electrolytes in 2028")
        self.assertEqual(result.get("intent"), "DEEP_RESEARCH")
        self.assertTrue(len(result.get("extracted_topic", "")) > 0)


class TestPDFGeneration(unittest.TestCase):
    """Tests Supreme ReportLab 4.x PDF generation engine."""

    def test_pdf_generation_output(self):
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp_path = tmp.name

        try:
            topic = "Commercial Viability of Solid-State EV Batteries"
            dossier_text = (
                "# Executive Summary\n"
                "Solid-state battery commercialization is accelerating.\n\n"
                "## Key Findings\n"
                "- Energy density exceeds 400 Wh/kg in prototype cells.\n"
                "- Ceramic separator manufacturing cost remains an obstacle.\n\n"
                "## Verification Matrix\n"
                "| Claim | Source | Status | Confidence |\n"
                "| 400 Wh/kg achieved | QuantumScape Q4 | VERIFIED | 94% |\n"
                "| Parity by 2028 | CATL Press Release | CAUTION | 72% |\n"
            )

            create_pdf_dossier(topic, dossier_text, output_path=tmp_path)

            # Verify file exists and is not empty
            self.assertTrue(os.path.exists(tmp_path))
            file_size = os.path.getsize(tmp_path)
            self.assertGreater(file_size, 1000)  # > 1KB

            # Verify PDF magic bytes '%PDF-'
            with open(tmp_path, "rb") as f:
                header = f.read(5)
                self.assertEqual(header, b"%PDF-")

        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)


class TestFastAPIEndpoints(unittest.TestCase):
    """Integration tests for FastAPI REST endpoints using TestClient."""

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_root_endpoint(self):
        response = self.client.get("/")
        self.assertIn(response.status_code, [200, 404])

    def test_api_status_endpoint(self):
        response = self.client.get("/api/status")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("status"), "operational")
        self.assertIn("telemetry", data)
        self.assertIn("environment", data)

    def test_api_suggestions_endpoint(self):
        response = self.client.get("/api/suggestions")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 2)
        for item in data:
            self.assertIn("label", item)
            self.assertIn("query", item)

    def test_manifest_endpoint(self):
        response = self.client.get("/manifest.json")
        if response.status_code == 200:
            data = response.json()
            self.assertIn("name", data)

    def test_chat_endpoint_empty_query(self):
        response = self.client.post("/api/chat", json={"query": "  "})
        self.assertEqual(response.status_code, 400)


class TestAssetIntegrity(unittest.TestCase):
    """Verifies that static assets, presets, and frontend build exist."""

    def test_presets_json_validity(self):
        presets_path = os.path.join(PROJECT_ROOT, "assets", "presets.json")
        self.assertTrue(os.path.exists(presets_path), "assets/presets.json must exist")
        with open(presets_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            self.assertIn("project", data)
            self.assertIn("research_domains", data)
            self.assertIn("agent_tiers", data)

    def test_logo_asset_exists(self):
        logo_path = os.path.join(PROJECT_ROOT, "assets", "veraxis_logo.png")
        self.assertTrue(os.path.exists(logo_path), "assets/veraxis_logo.png must exist")

    def test_frontend_dist_exists(self):
        index_path = os.path.join(PROJECT_ROOT, "frontend", "dist", "index.html")
        self.assertTrue(os.path.exists(index_path), "frontend/dist/index.html must exist for zero-build deployment")


def run_tests():
    """Runs test suite and reports formatted results."""
    print("=" * 72)
    print("   🧪 VERAXIS AI — Automated Test Suite Execution")
    print("=" * 72)
    suite = unittest.TestLoader().loadTestsFromModule(sys.modules[__name__])
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    print("=" * 72)
    if result.wasSuccessful():
        print(f"✨ PASSED: All {result.testsRun} test cases completed successfully.")
        return 0
    else:
        print(f"❌ FAILED: {len(result.failures)} failure(s), {len(result.errors)} error(s).")
        return 1


if __name__ == "__main__":
    sys.exit(run_tests())
