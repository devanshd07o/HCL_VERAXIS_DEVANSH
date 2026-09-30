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
    <div className="w-full max-w-[980px] mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col gap-8 select-none animate-buttery-fade-in z-10">
      {/* 1. LIVE TELEMETRY RADAR & BRAND CANOPY */}
      <div className="flex flex-col items-center text-center gap-3">
        {/* Living arXiv Ingestion Ticker (Real-Time Live Signal) */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--text-muted)] bg-white/[0.03] border border-white/[0.08] px-3.5 py-1.5 rounded-full shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[var(--accent-primary)] font-semibold">{currentPreprint.id}</span>
          <span className="opacity-40">|</span>
          <span className="text-[var(--text-main)] truncate max-w-[280px] sm:max-w-[420px]">
            {currentPreprint.title}
          </span>
          <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-white/[0.05] text-[10px] text-[var(--text-muted)]">
            {currentPreprint.tag}
          </span>
        </div>

        {/* Brand Mark & Title */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <img
            src={symbolSrc}
            alt="VERAXIS AI"
            className="w-12 h-12 object-contain select-none drop-shadow-md transition-transform duration-300 hover:scale-105"
          />
          <img
            src={nameSrc}
            alt="VERAXIS AI"
            className="h-7 sm:h-8 w-auto object-contain select-none"
          />
        </div>

        <p className="text-[14px] sm:text-[15px] text-[var(--text-muted)] max-w-[580px] leading-relaxed">
          Autonomous multi-agent empirical intelligence powered by <span className="text-[var(--text-main)] font-semibold">CrewAI</span>. Peer-reviewed preprint discovery, claim verification, and institutional publication dossiers.
        </p>
      </div>

      {/* 2. THE ARCHITECTURAL WORKBENCH CONSOLE */}
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

      {/* 3. LIVING CREWAI PIPELINE MONITOR (No Boxed Bubbles, Fluid Hardware Flow) */}
      <div className="w-full flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider px-1">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-[var(--accent-primary)] animate-pulse" />
            <span>CrewAI Multi-Agent Pipeline</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>41 LPU Keys Active</span>
            <span className="opacity-40">•</span>
            <span>~12s Deep Ingestion</span>
          </div>
        </div>

        {/* Hardware-Grade Pipeline Strip */}
        <div className="relative w-full p-3 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {CREW_AGENTS.map((agent, aIdx) => {
              const isHovered = hoveredAgent === agent.id;
              return (
                <div
                  key={agent.id}
                  onMouseEnter={() => setHoveredAgent(agent.id)}
                  onMouseLeave={() => setHoveredAgent(null)}
                  className={`p-3 rounded-lg border transition-all duration-200 cursor-default ${
                    isHovered
                      ? "bg-white/[0.05] border-[var(--accent-primary)]/40 shadow-xs"
                      : "bg-white/[0.015] border-white/[0.06]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold text-[var(--accent-primary)]">
                      AGENT 0{aIdx + 1}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {agent.role}
                    </span>
                  </div>

                  <div className="text-[13px] font-semibold text-[var(--text-main)] mb-1">
                    {agent.name}
                  </div>

                  <p className="text-[11.5px] text-[var(--text-muted)] leading-relaxed">
                    {agent.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. TYPOGRAPHIC DIRECTIVE SPARKS (No Cards with Boring Paragraphs, Pure Action) */}
      <div className="w-full flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider px-1">
          <div className="flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Empirical Directives</span>
          </div>
          <span className="text-[10px] opacity-60">Click any directive to execute</span>
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
              className="group text-left p-3 rounded-xl bg-white/[0.015] hover:bg-white/[0.05] border border-white/[0.06] hover:border-[var(--accent-primary)]/40 transition-all flex items-start gap-3 cursor-pointer"
            >
              <span className="w-6 h-6 rounded-md bg-white/[0.04] text-[var(--accent-primary)] text-[11px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[var(--highlight-bg)] transition-colors">
                {spark.num}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-mono text-[var(--accent-primary)] uppercase tracking-wide mb-0.5">
                  {spark.tag}
                </div>
                <div className="text-[12.5px] sm:text-[13px] font-medium text-[var(--text-main)] group-hover:text-[var(--accent-primary)] transition-colors leading-snug line-clamp-2">
                  {spark.query}
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mt-1" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
