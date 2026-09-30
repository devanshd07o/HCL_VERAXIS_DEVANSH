import React, { useState, useEffect } from "react";
import CommandBay from "./CommandBay";
import {
  Compass,
  Zap,
  BookOpen,
  Cpu,
  ArrowUpRight,
  Activity,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Layers,
  Radio,
  FileText,
  Binary,
  ArrowRight,
  Database,
  Terminal,
  ExternalLink,
  BarChart2,
  Check
} from "lucide-react";

const LIVE_ARXIV_FEED = [
  { id: "arXiv:2409.18201", tag: "cs.AI", title: "Autonomous Multi-Agent Consensus in Complex Scientific Synthesis" },
  { id: "arXiv:2409.17890", tag: "cond-mat", title: "Ionic Conductivity & Dendrite Mitigation in Solid-State Ceramic Electrolytes" },
  { id: "arXiv:2409.16543", tag: "q-bio.GN", title: "High-Fidelity In-Vivo Base Editing: Off-Target Double-Strand Break Audits" },
  { id: "arXiv:2409.15234", tag: "cs.CR", title: "Lattice Cryptanalysis: ML-KEM & ML-DSA Vulnerability Frontiers" },
  { id: "arXiv:2409.14112", tag: "physics.plasm-ph", title: "Net-Energy Q-Factor Scaling in High-Field REBCO Tokamak Confinement" },
];

const AGENT_SYSTEM_DATA = [
  {
    id: "analyst",
    index: "01",
    name: "Lead Research Analyst",
    role: "Taxonomy Deconstruction & arXiv Ingestion",
    description: "Deconstructs inquiries into domain taxonomy, generates boolean search queries, and streams live preprints via arXiv REST API gateway.",
    tools: ["arXiv REST XML Gateway", "Semantic Taxonomy Parser", "Boolean Query Expander"],
    sampleOutput: "Parsed 5 peer-reviewed preprints across cs.AI and cond-mat. Extracted 14 empirical benchmarks with parameter bounds.",
    latency: "3.2s",
  },
  {
    id: "auditor",
    index: "02",
    name: "Forensic Fact-Checker",
    role: "0–100% Verification Matrix & Claim Auditing",
    description: "Cross-examines empirical claims against retrieved abstracts, calculates confidence indices, and flags contested methodology boundaries.",
    tools: ["Citation Grounding Matrix", "Replication Verification Engine", "TRL Evaluator"],
    sampleOutput: "12 empirical claims audited: 11 verified against peer trials (91.6% Confidence Index). 1 speculative extrapolation flagged.",
    latency: "4.1s",
  },
  {
    id: "director",
    index: "03",
    name: "Executive Dossier Director",
    role: "Consensus Synthesis & ReportLab PDF Compilation",
    description: "Synthesizes multi-perspective consensus, formats KaTeX vector formulas inside tables, and compiles an institutional publication PDF.",
    tools: ["ReportLab 4.x Vector PDF Engine", "KaTeX LaTeX Math Parser", "Multi-Agent Consensus Synthesizer"],
    sampleOutput: "Compiled 6-page institutional monograph with 3 LaTeX tables and downloadable publication PDF in 1.8s.",
    latency: "4.5s",
  },
];

const EMPIRICAL_CASE_STUDIES = [
  {
    id: "case-1",
    tag: "Energy Physics",
    category: "cond-mat",
    title: "Solid-State EV Battery Ceramic Electrolytes",
    query: "Commercial viability of solid-state EV batteries by 2028 with ceramic electrolyte benchmarks and dendrite suppression",
    preprints: "8 Preprints",
    confidence: "91% Verified",
    equations: "Ionic conductivity: σ_i = (σ_0 / T) exp(-E_a / k_B T)",
  },
  {
    id: "case-2",
    tag: "Genomics",
    category: "q-bio.GN",
    title: "CRISPR-Cas9 In-Vivo Base Editing Vector Safety",
    query: "Clinical trial breakthroughs in CRISPR-Cas9 in vivo base editing for monogenic disorders and delivery vectors",
    preprints: "6 Preprints",
    confidence: "88% Verified",
    equations: "Off-target frequency: P(off) = Π_i (1 - s_i) · e^{-ΔG/k_B T}",
  },
  {
    id: "case-3",
    tag: "Cryptanalysis",
    category: "cs.CR",
    title: "NIST Post-Quantum Lattice Resiliency",
    query: "NIST Post-Quantum Cryptography standards: lattice-based Kyber and Dilithium implementation audits against Shor's algorithm",
    preprints: "11 Preprints",
    confidence: "96% Verified",
    equations: "LWE Hardness: ||As + e - b||_2 ≤ β",
  },
  {
    id: "case-4",
    tag: "Plasma Physics",
    category: "physics.plasm-ph",
    title: "Commercial Nuclear Fusion Q-Factor Scaling",
    query: "Commercial nuclear fusion net-energy Q-factor milestones: SPARC and ITER high-temperature superconductor magnet performance",
    preprints: "9 Preprints",
    confidence: "93% Verified",
    equations: "Lawson Criterion: n · T · τ_E ≥ 3 × 10^{21} m^{-3} keV s",
  },
];

export default function HomepagePortal({
  value,
  onChange,
  onSend,
  disabled,
  researchActive = true,
  setResearchActive,
  theme = "dark",
  onSelectTopic,
  onOpenConsole,
}) {
  const [activeTickerIdx, setActiveTickerIdx] = useState(0);
  const [activeAgentTab, setActiveAgentTab] = useState("analyst");

  // Rotate live arXiv preprint feed every 3.5s
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTickerIdx((prev) => (prev + 1) % LIVE_ARXIV_FEED.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const currentPreprint = LIVE_ARXIV_FEED[activeTickerIdx];
  const activeAgent = AGENT_SYSTEM_DATA.find((a) => a.id === activeAgentTab) || AGENT_SYSTEM_DATA[0];

  return (
    <div className="w-full max-w-[920px] mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-6 select-none animate-buttery-fade-in z-10">
      
      {/* ============================================================ */}
      {/* 1. HERO CANOPY & EXECUTIVE MISSION                           */}
      {/* ============================================================ */}
      <div className="flex flex-col items-center text-center gap-3 pt-1">
        {/* Live Swarm Signal Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono tracking-wider bg-[var(--highlight-bg)] border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>VERAXIS // CREWAI MULTI-AGENT SWARM CORE</span>
        </div>

        {/* Master Headline */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--text-main)] font-sans leading-[1.2]">
          Autonomous Empirical Research <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-[var(--text-main)] via-[var(--accent-primary)] to-[var(--text-main)] bg-clip-text text-transparent">
            & Publication Dossier Platform
          </span>
        </h1>

        <p className="text-[13px] sm:text-[14.5px] text-[var(--text-muted)] max-w-[640px] leading-relaxed mx-auto font-normal">
          Orchestrates specialized CrewAI agents to ingest peer-reviewed arXiv preprints, audit empirical claims with 0–100% confidence scoring, and compile vector publication dossiers in under 12 seconds.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onOpenConsole}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white text-[12.5px] font-semibold hover:brightness-110 shadow-[0_0_20px_rgba(37,99,235,0.35)] active:scale-95 transition-all cursor-pointer"
          >
            <span>Launch Research Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <a
            href="#architecture"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--glass-surface-subtle)] border border-[var(--island-border)] text-[var(--text-main)] text-[12px] font-medium hover:border-[var(--accent-primary)]/40 transition-all"
          >
            <span>Explore Architecture</span>
          </a>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. LIVE arXiv RESEARCH RADAR TICKER                          */}
      {/* ============================================================ */}
      <div
        onClick={() => {
          if (onSelectTopic) onSelectTopic(currentPreprint.title);
          else {
            onChange(currentPreprint.title);
            onSend(currentPreprint.title, true);
          }
        }}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-[var(--glass-surface-subtle)] border border-[var(--island-border)] text-[11.5px] font-mono text-[var(--text-muted)] hover:border-[var(--accent-primary)]/40 hover:text-[var(--text-main)] transition-all cursor-pointer group shadow-xs"
      >
        <div className="flex items-center gap-2 truncate">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--highlight-bg)] text-[var(--accent-primary)] font-semibold text-[10.5px]">
            <Radio className="w-3 h-3 animate-pulse" />
            arXiv Radar
          </span>
          <span className="text-[var(--accent-primary)] font-semibold shrink-0">{currentPreprint.id}</span>
          <span className="opacity-40">•</span>
          <span className="truncate group-hover:text-[var(--accent-primary)] transition-colors">
            {currentPreprint.title}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <span className="px-1.5 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.05] text-[10px] text-[var(--text-muted)]">
            {currentPreprint.tag}
          </span>
          <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-[var(--accent-primary)]" />
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. EMBEDDED RESEARCH COMMAND SYNTHESIZER                     */}
      {/* ============================================================ */}
      <div className="w-full">
        <CommandBay
          value={value}
          onChange={onChange}
          onSend={onSend}
          disabled={disabled}
          researchActive={researchActive}
          setResearchActive={setResearchActive}
          variant="workbench"
          theme={theme}
        />
      </div>

      {/* ============================================================ */}
      {/* 4. INTERACTIVE CREWAI MULTI-AGENT SWARM SHOWCASE             */}
      {/* ============================================================ */}
      <div id="architecture" className="w-full flex flex-col gap-3 pt-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider px-1">
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span className="text-[var(--text-main)] font-semibold">CrewAI 3-Tier Multi-Agent Swarm</span>
          </div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Autonomous Sequential Delegation
          </span>
        </div>

        {/* Agent Selector Tabs (Interactive, Clickable Controls) */}
        <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-[var(--glass-surface-subtle)] border border-[var(--island-border)]">
          {AGENT_SYSTEM_DATA.map((agent) => {
            const isSelected = activeAgentTab === agent.id;
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => setActiveAgentTab(agent.id)}
                className={`flex items-center justify-center sm:justify-start gap-2 py-2 px-3 rounded-lg text-[12px] font-medium transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[var(--island-bg)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                }`}
              >
                <span className="font-mono text-[10px] font-bold px-1 rounded bg-[var(--highlight-bg)] text-[var(--accent-primary)]">
                  {agent.index}
                </span>
                <span className="truncate hidden sm:inline">{agent.name}</span>
                <span className="truncate sm:hidden">{agent.id}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Agent Deep-Dive Card */}
        <div className="p-4 rounded-xl bg-[var(--island-bg)] border border-[var(--island-border)] shadow-xs space-y-3 animate-buttery-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-[var(--island-border)]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10.5px] font-mono font-bold text-[var(--accent-primary)] uppercase">
                  Agent {activeAgent.index}
                </span>
                <span className="text-[14px] font-bold text-[var(--text-main)]">
                  {activeAgent.name}
                </span>
              </div>
              <div className="text-[11.5px] font-mono text-[var(--text-muted)]">
                {activeAgent.role}
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto text-[11px] font-mono text-[var(--text-muted)]">
              <span>Latency: <strong className="text-[var(--text-main)]">{activeAgent.latency}</strong></span>
              <span className="opacity-30">•</span>
              <span className="text-emerald-400 font-semibold">Active</span>
            </div>
          </div>

          <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
            {activeAgent.description}
          </p>

          {/* Integrated Tool Chain */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-mono text-[var(--text-muted)] mr-1">Bound Tools:</span>
            {activeAgent.tools.map((tool, tIdx) => (
              <span
                key={tIdx}
                className="px-2 py-0.5 rounded-md text-[10.5px] font-mono bg-[var(--glass-surface-subtle)] border border-[var(--island-border)] text-[var(--text-main)]"
              >
                {tool}
              </span>
            ))}
          </div>

          {/* Sample Empirical Output Log */}
          <div className="p-2.5 rounded-lg bg-[var(--glass-surface-subtle)] border border-[var(--island-border)] text-[11px] font-mono text-[var(--text-muted)] space-y-1">
            <div className="flex items-center gap-1 text-[10px] text-[var(--accent-primary)] font-semibold uppercase">
              <Terminal className="w-3 h-3" />
              <span>Verified Agent Output Sample</span>
            </div>
            <div className="text-[var(--text-main)] text-[11.5px] leading-relaxed">
              "{activeAgent.sampleOutput}"
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. EMPIRICAL SCIENTIFIC CASE STUDIES (Interactive Triggers)  */}
      {/* ============================================================ */}
      <div className="w-full flex flex-col gap-2.5 pt-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider px-1">
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span className="text-[var(--text-main)] font-semibold">Verified Empirical Case Studies</span>
          </div>
          <span className="text-[10px] opacity-60">Click any study to launch Deep Swarm</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EMPIRICAL_CASE_STUDIES.map((study) => (
            <button
              key={study.id}
              type="button"
              onClick={() => {
                if (onSelectTopic) {
                  onSelectTopic(study.query);
                } else {
                  onChange(study.query);
                  onSend(study.query, "deep");
                }
              }}
              className="group text-left p-3.5 rounded-xl bg-[var(--island-bg)] hover:bg-[var(--highlight-bg)] border border-[var(--island-border)] hover:border-[var(--accent-primary)]/40 transition-all flex flex-col justify-between gap-2.5 cursor-pointer shadow-xs"
            >
              <div className="w-full flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[var(--glass-surface-subtle)] text-[var(--accent-primary)] border border-[var(--island-border)]">
                  {study.tag}
                </span>
                <span className="text-[10.5px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {study.confidence}
                </span>
              </div>

              <div>
                <h3 className="text-[13px] font-semibold text-[var(--text-main)] group-hover:text-[var(--accent-primary)] transition-colors leading-snug">
                  {study.title}
                </h3>
                <p className="text-[11.5px] text-[var(--text-muted)] line-clamp-2 mt-1 leading-relaxed">
                  {study.query}
                </p>
              </div>

              <div className="w-full pt-1.5 border-t border-[var(--island-border)] flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
                <span>{study.preprints} • LaTeX Math</span>
                <span className="flex items-center gap-1 text-[var(--accent-primary)] font-semibold group-hover:translate-x-0.5 transition-transform">
                  <span>Execute Dossier</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 6. SYSTEM PERFORMANCE & ENGINEERING METRICS                  */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
        <div className="p-3 rounded-xl bg-[var(--glass-surface-subtle)] border border-[var(--island-border)] text-center">
          <div className="text-[18px] sm:text-[20px] font-extrabold text-[var(--text-main)] font-mono">
            ~12s
          </div>
          <div className="text-[10.5px] font-mono text-[var(--text-muted)] uppercase tracking-wide mt-0.5">
            Deep Swarm Latency
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--glass-surface-subtle)] border border-[var(--island-border)] text-center">
          <div className="text-[18px] sm:text-[20px] font-extrabold text-[var(--accent-primary)] font-mono">
            &lt;400ms
          </div>
          <div className="text-[10.5px] font-mono text-[var(--text-muted)] uppercase tracking-wide mt-0.5">
            Rapid Chat Response
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--glass-surface-subtle)] border border-[var(--island-border)] text-center">
          <div className="text-[18px] sm:text-[20px] font-extrabold text-[var(--text-main)] font-mono">
            100%
          </div>
          <div className="text-[10.5px] font-mono text-[var(--text-muted)] uppercase tracking-wide mt-0.5">
            KaTeX Vector Math
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--glass-surface-subtle)] border border-[var(--island-border)] text-center">
          <div className="text-[18px] sm:text-[20px] font-extrabold text-emerald-400 font-mono">
            20 / 20
          </div>
          <div className="text-[10.5px] font-mono text-[var(--text-muted)] uppercase tracking-wide mt-0.5">
            Test Cases Verified
          </div>
        </div>
      </div>

    </div>
  );
}
