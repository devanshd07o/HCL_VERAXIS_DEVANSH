import React, { useState, useEffect, useRef } from "react";
import { Cpu, CheckCircle2, Loader2, Sparkles, Layers } from "lucide-react";

export default function MultiAgentThinking({ query }) {
  const [steps, setSteps] = useState([
    { agent: "Lead Analyst", step: `Deconstructing query semantics: "${(query || 'Research Directive').slice(0, 45)}..."` },
    { agent: "arXiv Engine", step: "Connecting to arXiv REST gateway for peer-reviewed preprint abstracts" },
    { agent: "Lead Analyst", step: "Extracting empirical parameters, benchmark figures, and mathematical formulations" },
    { agent: "Forensic Auditor", step: "Auditing empirical reproducibility and claim-level verification matrix" },
    { agent: "Forensic Auditor", step: "Cross-referencing technology readiness levels and unit economics" },
    { agent: "Dossier Director", step: "Structuring multi-agent consensus synthesis & LaTeX formatting" },
    { agent: "ReportLab Engine", step: "Compiling vector typography and generating institutional publication PDF" },
  ]);

  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // Fetch query-tailored dynamic steps from backend
  useEffect(() => {
    let isMounted = true;
    async function fetchSteps() {
      if (!query) return;
      try {
        const res = await fetch("/api/thinking-steps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.steps) && data.steps.length >= 4) {
            setSteps(data.steps);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch custom thinking steps:", err);
      }
    }
    fetchSteps();
    return () => {
      isMounted = false;
    };
  }, [query]);

  // Progressively advance the active thinking step every 1.7s
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1700);

    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="w-full my-3 p-3.5 sm:p-4 rounded-xl bg-[var(--island-bg)] border border-white/[0.08] shadow-xs select-none animate-buttery-fade-in">
      {/* Top Telemetry Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/[0.06] text-[11px] font-mono text-[var(--text-muted)]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
          <span className="text-[var(--text-main)] font-semibold tracking-wide">
            CrewAI Multi-Agent Swarm Orchestrator
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-[var(--highlight-bg)] text-[var(--accent-primary)] font-medium">
            Step {Math.min(activeStepIndex + 1, steps.length)} of {steps.length}
          </span>
        </div>
      </div>

      {/* Progressing Steps List */}
      <div className="space-y-2">
        {steps.map((s, idx) => {
          const isDone = idx < activeStepIndex;
          const isCurrent = idx === activeStepIndex;
          const isQueued = idx > activeStepIndex;

          return (
            <div
              key={idx}
              className={`flex items-start gap-2.5 text-[12px] sm:text-[12.5px] transition-all duration-300 ${
                isDone
                  ? "opacity-55"
                  : isCurrent
                  ? "opacity-100 font-medium"
                  : "opacity-30"
              }`}
            >
              {/* Status Icon */}
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-3.5 h-3.5 text-[var(--accent-primary)] animate-spin" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-white/20" />
                )}
              </div>

              {/* Agent Tag & Step Description */}
              <div className="flex-1 flex flex-wrap items-center gap-1.5 leading-snug">
                <span
                  className={`px-1.5 py-0.2 rounded font-mono text-[10.5px] font-semibold tracking-tight ${
                    isCurrent
                      ? "bg-[var(--highlight-bg)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/30"
                      : "bg-white/[0.04] text-[var(--text-muted)] border border-white/[0.04]"
                  }`}
                >
                  [{s.agent}]
                </span>
                <span className={isCurrent ? "text-[var(--text-main)]" : "text-[var(--text-muted)]"}>
                  {s.step}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
