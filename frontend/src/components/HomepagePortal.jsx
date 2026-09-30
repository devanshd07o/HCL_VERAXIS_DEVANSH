import React, { useState, useEffect } from "react";
import CommandBay from "./CommandBay";
import {
  Compass,
  Zap,
  BookOpen,
  Cpu,
  ArrowUpRight,
  Activity,
  Bot,
  Scale,
  Sparkles,
  CheckCircle2,
  Layers,
  Radio,
  FileText,
  Binary,
} from "lucide-react";

const LIVE_ARXIV_FEED = [
  { id: "arXiv:2409.18201", tag: "cs.AI", title: "Autonomous Multi-Agent Consensus in Complex Scientific Synthesis" },
  { id: "arXiv:2409.17890", tag: "cond-mat", title: "Ionic Conductivity & Dendrite Mitigation in Solid-State Ceramic Electrolytes" },
  { id: "arXiv:2409.16543", tag: "q-bio.GN", title: "High-Fidelity In-Vivo Base Editing: Off-Target Double-Strand Break Audits" },
  { id: "arXiv:2409.15234", tag: "cs.CR", title: "Lattice Cryptanalysis: ML-KEM & ML-DSA Vulnerability Frontiers" },
  { id: "arXiv:2409.14112", tag: "physics.plasm-ph", title: "Net-Energy Q-Factor Scaling in High-Field REBCO Tokamak Confinement" },
];

const RESEARCH_SPARKS = [
  {
    num: "01",
    tag: "Energy Physics",
    query: "Commercial viability of solid-state EV batteries by 2028 with ceramic electrolyte benchmarks and dendrite suppression",
  },
  {
    num: "02",
    tag: "Genomics",
    query: "Clinical trial breakthroughs in CRISPR-Cas9 in vivo base editing for monogenic disorders and delivery vectors",
  },
  {
    num: "03",
    tag: "Cryptanalysis",
    query: "NIST Post-Quantum Cryptography standards: lattice-based Kyber and Dilithium implementation audits against Shor's algorithm",
  },
  {
    num: "04",
    tag: "Plasma Physics",
    query: "Commercial nuclear fusion net-energy Q-factor milestones: SPARC and ITER high-temperature superconductor magnet performance",
  },
];

export default function HomepagePortal({
  value,
  onChange,
  onSend,
  disabled,
  suggestions = [],
  mode = "deep",
  setMode,
  theme = "dark",
  onSelectTopic,
}) {
  const [activeTickerIdx, setActiveTickerIdx] = useState(0);
  const [hoveredAgent, setHoveredAgent] = useState(null);

  // Smoothly rotate the live arXiv preprint feed every 3.5s
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTickerIdx((prev) => (prev + 1) % LIVE_ARXIV_FEED.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const symbolSrc =
    theme === "dark"
      ? "/assets/veraxis_symbol_light.png"
      : "/assets/veraxis_symbol_dark.png";

  const nameSrc =
    theme === "dark"
      ? "/assets/veraxis_name_light.png"
      : "/assets/veraxis_name_dark.png";

  const currentPreprint = LIVE_ARXIV_FEED[activeTickerIdx];

  const CREW_AGENTS = [
    {
      id: "analyst",
      name: "Lead Research Analyst",
      role: "arXiv Ingestion",
      status: "Active",
      detail: "Deconstructs inquiries into domain taxonomy and streams live arXiv preprints via REST gateway.",
    },
    {
      id: "auditor",
      name: "Forensic Fact-Checker",
      role: "Verification Matrix",
      status: "Active",
      detail: "Audits empirical claims against peer literature, assigning 0-100% confidence and flagging contested data.",
    },
    {
      id: "director",
      name: "Executive Dossier Director",
      role: "ReportLab 4.x PDF",
      status: "Active",
      detail: "Synthesizes multi-perspective consensus and compiles publication-grade LaTeX PDF dossiers in 12s.",
    },
  ];

  return (
    <div className="w-full max-w-[800px] mx-auto px-2 sm:px-4 py-1 sm:py-2 flex flex-col gap-2.5 sm:gap-3 select-none animate-buttery-fade-in z-10">
      {/* 1. EDITORIAL BRAND MASTHEAD */}
      <div className="flex flex-col items-center text-center gap-1.5 pt-0.5">
        {/* Swarm Status Pill */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider bg-[var(--highlight-bg)] border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>CREWAI MULTI-AGENT RESEARCH SWARM</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)] font-sans">
          Autonomous Scientific Research Console
        </h1>

        <p className="text-[12.5px] sm:text-[13px] text-[var(--text-muted)] max-w-[540px] leading-relaxed mx-auto font-normal">
          Synthesizes peer-reviewed arXiv preprints, empirical benchmark matrices, and publication dossiers.
        </p>
      </div>

      {/* 2. LIVE arXiv RESEARCH RADAR STRIP */}
      <div
        onClick={() => {
          if (onSelectTopic) onSelectTopic(currentPreprint.title);
          else {
            onChange(currentPreprint.title);
            onSend(currentPreprint.title, "deep");
          }
        }}
        className="w-full flex items-center justify-between gap-3 px-3 py-1.5 rounded-xl bg-[var(--glass-surface-subtle)] border border-[var(--island-border)] text-[11px] font-mono text-[var(--text-muted)] hover:border-[var(--accent-primary)]/40 hover:text-[var(--text-main)] transition-all cursor-pointer group shadow-xs"
      >
        <div className="flex items-center gap-2 truncate">
          <span className="flex items-center gap-1 px-1.5 py-0.2 rounded bg-[var(--highlight-bg)] text-[var(--accent-primary)] font-semibold text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
            arXiv Radar
          </span>
          <span className="text-[var(--accent-primary)] font-semibold shrink-0">{currentPreprint.id}</span>
          <span className="opacity-40">•</span>
          <span className="truncate group-hover:text-[var(--accent-primary)] transition-colors">
            {currentPreprint.title}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <span className="px-1.5 py-0.2 rounded bg-black/[0.04] dark:bg-white/[0.05] text-[9.5px] text-[var(--text-muted)]">
            {currentPreprint.tag}
          </span>
          <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-[var(--accent-primary)]" />
        </div>
      </div>

      {/* 3. THE ARCHITECTURAL WORKBENCH CONSOLE */}
      <div className="w-full">
        <CommandBay
          value={value}
          onChange={onChange}
          onSend={onSend}
          disabled={disabled}
          mode={mode}
          setMode={setMode}
          variant="workbench"
          theme={theme}
        />
      </div>

      {/* 4. EMPIRICAL RESEARCH DIRECTIVES */}
      <div className="w-full flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider px-1">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3 h-3 text-[var(--accent-primary)]" />
            <span>Empirical Directives</span>
          </div>
          <span className="text-[9.5px] opacity-60">Click directive to execute swarm</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {RESEARCH_SPARKS.map((spark) => (
            <button
              key={spark.num}
              type="button"
              onClick={() => {
                if (onSelectTopic) {
                  onSelectTopic(spark.query);
                } else {
                  onChange(spark.query);
                  onSend(spark.query, mode);
                }
              }}
              className="group text-left p-2.5 rounded-xl bg-[var(--glass-surface-subtle)] hover:bg-[var(--highlight-bg)] border border-[var(--island-border)] hover:border-[var(--accent-primary)]/40 transition-all flex items-center gap-2.5 cursor-pointer shadow-xs"
            >
              <span className="w-5 h-5 rounded-md bg-[var(--island-bg)] text-[var(--accent-primary)] text-[10px] font-mono font-bold flex items-center justify-center shrink-0 border border-[var(--island-border)] group-hover:border-[var(--accent-primary)]/40 transition-colors">
                {spark.num}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[9.5px] font-mono text-[var(--accent-primary)] uppercase tracking-wide">
                  {spark.tag}
                </div>
                <div className="text-[12px] font-medium text-[var(--text-main)] group-hover:text-[var(--accent-primary)] transition-colors leading-tight truncate">
                  {spark.query}
                </div>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* 5. MINIMALIST CREWAI HARDWARE PIPELINE MONITOR */}
      <div className="w-full flex items-center justify-between gap-2 py-1.5 px-3 rounded-lg bg-[var(--glass-surface-subtle)] border border-[var(--island-border)] text-[10px] font-mono text-[var(--text-muted)] overflow-x-auto shadow-xs">
        <div className="flex items-center gap-1.5 shrink-0 text-[var(--text-main)] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Swarm Pipeline:</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[var(--accent-primary)] font-medium">01 Analyst</span>
          <span className="opacity-30">➔</span>
          <span className="text-[var(--accent-primary)] font-medium">02 arXiv REST</span>
          <span className="opacity-30">➔</span>
          <span className="text-[var(--accent-primary)] font-medium">03 Forensic Auditor</span>
          <span className="opacity-30">➔</span>
          <span className="text-[var(--accent-primary)] font-medium">04 Dossier Director</span>
          <span className="opacity-30">➔</span>
          <span className="text-emerald-400 font-semibold">05 ReportLab PDF</span>
        </div>
      </div>
    </div>
  );
}
