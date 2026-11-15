"""
backend/claim_verifier.py — ZERNEXA Claim Verification & Contradiction Detection Engine
========================================================================================
Runs during the research and fact-checking stage.
Cross-checks technical & factual claims across retrieved multi-source evidence and subtasks.
Detects contradictions, code vs text mismatches, unverified premises, and false assertions.
"""

from __future__ import annotations

import json
import logging
import re
import time
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger("multiintel.claim_verifier")

_CLAIM_EXTRACTION_PROMPT = """You are a rigorous technical fact-checker and contradiction detector in a multi-model scientific AI pipeline.

Original inquiry:
{original_query}

Retrieved evidence / subtask outputs:
{task_results_text}

Instructions:
1. Extract ALL core technical, numerical, factual, and behavioral claims from the retrieved evidence and worker outputs (e.g., rules, limits, benchmarks, dates, physical mechanisms).
2. Rigorously cross-check these claims against each other for SEMANTIC CONTRADICTIONS:
   - Source A vs Source B (e.g. Source A claims "efficiency is 12%", Source B claims "efficiency reached 28%").
   - Code snippet behavior vs text explanations.
   - Explicitly evaluate any unverified premise or false assumption in the original query.
3. For each claim, assign a verdict:
   - "consistent": supported or non-contradicted across sources.
   - "contradicted": directly contradicted by another source or proven scientifically false.
   - "unverifiable": asserted without backing evidence or source agreement.

Return ONLY a valid JSON array of objects, with NO markdown code fences:
[
  {{
    "claim": "Exact statement of technical or factual claim",
    "verdict": "consistent" | "contradicted" | "unverifiable",
    "conflicting_source": "Exact conflicting statement or citation",
    "reasoning": "Detailed technical explanation of why this claim is consistent, contradicted, or unverifiable"
  }}
]"""


class ClaimVerifier:
    """
    Independent Claim Verification & Contradiction Detection Stage.
    Blocks hallucinated claims and flags conflicting evidence before report generation.
    """

    def __init__(self, key_manager: Any = None) -> None:
        if key_manager is None:
            try:
                from backend.config import key_manager as km
            except ImportError:
                from config import key_manager as km
            self.key_manager = km
        else:
            self.key_manager = key_manager

    def audit_evidence_claims(
        self,
        evidence_text: str,
        original_query: str,
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Audits multi-source evidence for contradictions and unverified premises.
        Returns:
            (all_claims, contradicted_claims)
        """
        if not evidence_text or not evidence_text.strip():
            return [], []

        # 1. Local heuristic check
        local_claims = self._local_heuristic_check([{"text": evidence_text}])

        # 2. LLM Semantic Cross-check
        llm_claims = self._llm_verify(evidence_text[:6000], original_query)

        seen_claims = set()
        all_claims = []
        for c in local_claims + llm_claims:
            claim_text = c.get("claim", "").strip().lower()
            if claim_text and claim_text not in seen_claims:
                seen_claims.add(claim_text)
                all_claims.append(c)

        contradictions = [c for c in all_claims if c.get("verdict") == "contradicted"]
        return all_claims, contradictions

    def verify_claims(
        self,
        task_results: List[Dict[str, Any]],
        original_query: str,
        trace_cb: Any = None,
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Verify claims across multi-agent task results.
        Returns:
          (updated_task_results, claims_verdict_list)
        """
        if not task_results:
            return task_results, []

        successful_results = [r for r in task_results if r.get("success", True) and r.get("text")]
        if not successful_results:
            return task_results, []

        formatted_parts = []
        for r in task_results:
            tid = r.get("task_id", r.get("id", "?"))
            instr = r.get("instruction", "")
            text = r.get("text", "")
            formatted_parts.append(f"Task ID: {tid}\nInstruction: {instr}\nOutput:\n{text}\n")

        task_results_text = "\n----------------------------------------\n".join(formatted_parts)

        local_claims = self._local_heuristic_check(task_results)
        llm_claims = self._llm_verify(task_results_text, original_query)

        all_claims = local_claims + [c for c in llm_claims if c.get("claim") not in [lc.get("claim") for lc in local_claims]]
        contradictions = [c for c in all_claims if c.get("verdict") == "contradicted"]

        if trace_cb:
            trace_cb({
                "event": "claim_verification",
                "total_claims": len(all_claims),
                "contradictions": len(contradictions),
                "status": "CONTRADICTION DETECTED" if contradictions else "CONSISTENT",
            })

        updated_task_results = list(task_results)
        if contradictions:
            logger.warning("Claim Verifier detected %d contradiction(s)", len(contradictions))
            for r in updated_task_results:
                r["contradictions_detected"] = contradictions

        return updated_task_results, all_claims

    def _local_heuristic_check(self, task_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Fast structural heuristic check for explicit error/contradiction markers."""
        claims = []
        for r in task_results:
            text = r.get("text") or ""
            if "[CONTRADICTION_FLAG]" in text or "[FAILED_PREMISE]" in text:
                claims.append({
                    "claim": f"Worker task {r.get('task_id', 'T1')} flagged an explicit premise failure.",
                    "verdict": "contradicted",
                    "conflicting_source": "Explicit conflict tag present in response.",
                    "reasoning": "Detected structural conflict marker.",
                })
        return claims

    def _llm_verify(self, task_results_text: str, original_query: str) -> List[Dict[str, Any]]:
        """Call fast LLM to perform deep claim extraction and contradiction check."""
        from backend.router import get_groq_client, strip_think_tags

        prompt = _CLAIM_EXTRACTION_PROMPT.format(
            original_query=original_query,
            task_results_text=task_results_text[:6000],
        )

        max_retries = min(3, len(self.key_manager.groq_keys) or 1)
        for _ in range(max_retries):
            client = None
            try:
                client = get_groq_client()
                resp = client.chat.completions.create(
                    model=self.key_manager.fast_model,
                    messages=[
                        {"role": "system", "content": "You are an automated JSON-only technical claim verification engine."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.0,
                    max_tokens=600,
                )
                text = resp.choices[0].message.content or ""
                text = strip_think_tags(text)
                return self._parse_claims_json(text)
            except Exception as e:
                logger.warning("ClaimVerifier LLM call failed: %s", e)
                if client is not None and hasattr(client, "api_key") and client.api_key:
                    self.key_manager.mark_rate_limited(client.api_key)
                time.sleep(0.3)
        return []

    def _parse_claims_json(self, text: str) -> List[Dict[str, Any]]:
        clean = re.sub(r"```(?:json)?\s*", "", text).strip().strip("```")
        start = clean.find("[")
        end = clean.rfind("]")
        if start == -1 or end == -1:
            return []
        try:
            items = json.loads(clean[start : end + 1])
            parsed = []
            for it in items:
                if isinstance(it, dict) and "claim" in it:
                    verdict = str(it.get("verdict", "unverifiable")).lower()
                    if verdict not in ("consistent", "contradicted", "unverifiable"):
                        verdict = "unverifiable"
                    parsed.append({
                        "task_id": str(it.get("task_id", "")).strip(),
                        "claim": str(it["claim"]),
                        "verdict": verdict,
                        "conflicting_source": str(it.get("conflicting_source", "")),
                        "reasoning": str(it.get("reasoning", "")),
                    })
            return parsed
        except Exception as e:
            logger.warning("ClaimVerifier JSON parse error: %s", e)
            return []
