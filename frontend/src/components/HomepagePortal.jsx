import React from "react";
import CommandBay from "./CommandBay";
import {
  Compass,
  Zap,
  BookOpen,
  Cpu,
  Layers,
  FileText,
  ShieldCheck,
  ArrowUpRight,
  Activity,
  Bot,
  Scale,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

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
  const symbolSrc =
    theme === "dark"
      ? "/assets/veraxis_symbol_light.png"
      : "/assets/veraxis_symbol_dark.png";

  const nameSrc =
    theme === "dark"
      ? "/assets/veraxis_name_light.png"
      : "/assets/veraxis_name_dark.png";

  const EMPIRICAL_FRONTIERS = [
    {
      title: "Solid-State Batteries 2028",
      category: "Energy & Materials",
      desc: "Commercial viability, ceramic electrolyte ionic conductivity, and lithium dendrite suppression benchmarks.",
      query: "Commercial viability of solid-state EV batteries by 2028 with ceramic electrolyte benchmarks and dendrite suppression",
      stat: "arXiv:2408.0121",
    },
    {
      title: "CRISPR-Cas9 In-Vivo Base Editing",
      category: "Biotechnology",
      desc: "Clinical trial safety, off-target double-strand break reduction, and adeno-associated viral delivery efficacy.",
      query: "Clinical trial breakthroughs in CRISPR-Cas9 in vivo base editing for monogenic disorders and delivery vectors",
      stat: "Phase II Clinical",
    },
    {
      title: "NIST Post-Quantum Cryptography",
      category: "Cryptanalysis",
      desc: "Lattice-based encryption transition (ML-KEM/Kyber & ML-DSA/Dilithium) against fault-tolerant Shor attacks.",
      query: "NIST Post-Quantum Cryptography standards: lattice-based Kyber and Dilithium implementation audits against Shor's algorithm",
      stat: "FIPS 203/204",
    },
    {
      title: "Nuclear Fusion Net-Energy Q > 1",
      category: "Plasma Physics",
      desc: "High-field REBCO magnet confinement milestones in SPARC and stellarator non-inductive current drive.",
      query: "Commercial nuclear fusion net-energy Q-factor milestones: SPARC and ITER high-temperature superconductor magnet performance",
      stat: "Q-Factor > 1.2",
    },
  ];

  return (
    <div className="w-full max-w-[1040px] mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-7 select-none animate-buttery-fade-in">
      {/* 1. HERO CANOPY & CREWAI BRANDING */}
      <div className="flex flex-col items-center text-center gap-3 pt-2">
        <div className="flex items-center gap-3">
          <img
            src={symbolSrc}
            alt="VERAXIS AI"
            className="w-12 h-12 object-contain select-none drop-shadow-md"
          />
          <img
            src={nameSrc}
            alt="VERAXIS AI"
            className="h-7 sm:h-8 w-auto object-contain select-none"
          />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--highlight-bg)] border border-[var(--accent-primary)]/30 text-[11px] font-mono text-[var(--accent-primary)]">
          <Bot className="w-3.5 h-3.5" />
          <span>Multi-Agent Research Assistant powered by CrewAI</span>
        </div>

        <p className="text-[13.5px] sm:text-[14.5px] text-[var(--text-muted)] max-w-[640px] leading-relaxed">
          Autonomous multi-agent intelligence orchestrating lead research analysis, forensic preprint verification on arXiv, and institutional ReportLab PDF dossiers.
        </p>
      </div>

      {/* 2. ARCHITECTURAL COMMAND BAY */}
      <div className="w-full max-w-[940px] mx-auto">
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

      {/* 3. CREWAI MULTI-AGENT SWARM TOPOLOGY */}
      <div className="space-y-2.5 max-w-[940px] mx-auto w-full">
        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider px-1">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Autonomous CrewAI Agent Topology</span>
          </span>
          <span>41 Groq LPU Keys Load-Balanced</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Agent 1 */}
          <div className="p-3.5 rounded-xl bg-[var(--island-bg)] border border-white/[0.07] space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-lg bg-[var(--highlight-bg)] border border-[var(--accent-primary)]/25 flex items-center justify-center text-[var(--accent-primary)] font-mono text-[11px] font-bold">
                01
              </span>
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Literature</span>
            </div>
            <h4 className="text-[13px] font-semibold text-[var(--text-main)] flex items-center gap-1.5">
              <span>Lead Research Analyst</span>
            </h4>
            <p className="text-[11.5px] text-[var(--text-muted)] leading-relaxed">
              Deconstructs inquiries into domain taxonomy & queries arXiv REST for peer-reviewed preprint abstracts.
            </p>
          </div>

          {/* Agent 2 */}
          <div className="p-3.5 rounded-xl bg-[var(--island-bg)] border border-white/[0.07] space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-lg bg-[var(--highlight-bg)] border border-[var(--accent-primary)]/25 flex items-center justify-center text-[var(--accent-primary)] font-mono text-[11px] font-bold">
                02
              </span>
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Verification</span>
            </div>
            <h4 className="text-[13px] font-semibold text-[var(--text-main)] flex items-center gap-1.5">
              <span>Forensic Fact-Checker</span>
            </h4>
            <p className="text-[11.5px] text-[var(--text-muted)] leading-relaxed">
              Audits empirical claims against replication data, assigning 0-100% confidence & detecting bias.
            </p>
          </div>

          {/* Agent 3 */}
          <div className="p-3.5 rounded-xl bg-[var(--island-bg)] border border-white/[0.07] space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-lg bg-[var(--highlight-bg)] border border-[var(--accent-primary)]/25 flex items-center justify-center text-[var(--accent-primary)] font-mono text-[11px] font-bold">
                03
              </span>
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Publication</span>
            </div>
            <h4 className="text-[13px] font-semibold text-[var(--text-main)] flex items-center gap-1.5">
              <span>Executive Dossier Director</span>
            </h4>
            <p className="text-[11.5px] text-[var(--text-muted)] leading-relaxed">
              Synthesizes multi-perspective consensus & compiles publication-grade ReportLab 4.x PDF dossiers.
            </p>
          </div>
        </div>
      </div>

      {/* 4. ACTIVE EMPIRICAL RESEARCH FRONTIERS */}
      <div className="space-y-2.5 max-w-[940px] mx-auto w-full pt-1">
        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider px-1">
          <span className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Empirical Research Directives</span>
          </span>
          <span>Click to Explore</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EMPIRICAL_FRONTIERS.map((frontier, idx) => (
            <div
              key={idx}
              onClick={() => {
                if (onSelectTopic) {
                  onSelectTopic(frontier.query);
                } else {
                  onChange(frontier.query);
                  onSend(frontier.query, mode);
                }
              }}
              className="group p-3.5 rounded-xl bg-[var(--island-bg)] border border-white/[0.07] hover:border-[var(--accent-primary)]/40 hover:bg-[var(--glass-surface-subtle)] transition-all cursor-pointer flex flex-col justify-between gap-2.5 shadow-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
                  <span className="text-[var(--accent-primary)] font-semibold">
                    {frontier.category}
                  </span>
                  <span className="opacity-70">{frontier.stat}</span>
                </div>
                <h4 className="text-[13px] font-semibold text-[var(--text-main)] group-hover:text-[var(--accent-primary)] transition-colors line-clamp-1">
                  {frontier.title}
                </h4>
                <p className="text-[11.5px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                  {frontier.desc}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-[11px] font-medium text-[var(--text-muted)] group-hover:text-[var(--accent-primary)]">
                <span>Launch CrewAI Research</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
