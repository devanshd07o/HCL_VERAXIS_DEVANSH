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
  Globe,
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
      category: "Material Physics & Energy",
      desc: "Commercial viability, ceramic electrolyte ionic conductivity, and lithium dendrite suppression benchmarks.",
      query: "Commercial viability of solid-state EV batteries by 2028 with ceramic electrolyte benchmarks and dendrite suppression",
      stat: "arXiv:2408.0121",
    },
    {
      title: "CRISPR-Cas9 In-Vivo Base Editing",
      category: "Molecular Genomics",
      desc: "Clinical trial safety, off-target double-strand break reduction, and adeno-associated viral delivery efficacy.",
      query: "Clinical trial breakthroughs in CRISPR-Cas9 in vivo base editing for monogenic disorders and delivery vectors",
      stat: "Clinical Phase II",
    },
    {
      title: "NIST Post-Quantum Cryptography",
      category: "Applied Cryptanalysis",
      desc: "Lattice-based encryption transition (ML-KEM/Kyber & ML-DSA/Dilithium) against future fault-tolerant Shor attacks.",
      query: "NIST Post-Quantum Cryptography standards: lattice-based Kyber and Dilithium implementation audits against Shor's algorithm",
      stat: "NIST FIPS 203/204",
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
    <div className="w-full max-w-[1080px] mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-8 animate-buttery-fade-in select-none">
      {/* 1. ARCHITECTURAL CANOPY & TELEMETRY */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <img
              src={symbolSrc}
              alt="VERAXIS AI"
              className="w-10 h-10 object-contain drop-shadow-md select-none"
            />
            <div className="flex flex-col">
              <img
                src={nameSrc}
                alt="VERAXIS AI"
                className="h-6 w-auto object-contain select-none"
              />
              <span className="text-[11px] font-mono tracking-wider text-[var(--accent-primary)] uppercase">
                Autonomous Empirical Intelligence
              </span>
            </div>
          </div>
          <p className="text-[13.5px] sm:text-[14px] text-[var(--text-muted)] max-w-[560px] leading-relaxed">
            Multi-agent consensus synthesis engine backed by real-time arXiv preprint ingestion and automated institutional PDF dossier generation.
          </p>
        </div>

        {/* Live System Beacon Array */}
        <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-1.5 text-[11px] font-mono text-[var(--text-muted)]">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[var(--island-bg)] border border-white/[0.06]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>41/41 Groq LPU Keys</span>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[var(--island-bg)] border border-white/[0.06]">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span>arXiv REST Index Online</span>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[var(--island-bg)] border border-white/[0.06]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>ReportLab 4.x Active</span>
          </div>
        </div>
      </div>

      {/* 2. THE COMMAND CONSOLE BAY */}
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

      {/* 3. TWO-COLUMN EMPIRICAL WORKBENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Left Column: Active Scientific Frontiers (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-[11.5px] font-mono text-[var(--text-muted)] uppercase tracking-wider px-1">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>Empirical Research Frontiers</span>
            </span>
            <span>Direct Ingestion</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EMPIRICAL_FRONTIERS.map((frontier, idx) => (
              <div
                key={idx}
                onClick={() => onSelectTopic ? onSelectTopic(frontier.query) : onSend(frontier.query, mode)}
                className="group p-3.5 rounded-xl bg-[var(--island-bg)] border border-white/[0.07] hover:border-[var(--accent-primary)]/40 hover:bg-[var(--workbench-surface)] transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-xs"
              >
                <div className="space-y-1.5">
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
                  <span>Launch Deep Dossier</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Platform Intelligence Pipeline & Metrics (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-[11.5px] font-mono text-[var(--text-muted)] uppercase tracking-wider px-1">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>Consensus Architecture</span>
            </span>
            <span>3 Tiers</span>
          </div>

          <div className="p-4 rounded-xl bg-[var(--island-bg)] border border-white/[0.07] space-y-4 shadow-xs">
            {/* Tier 1 */}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-[var(--highlight-bg)] border border-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary)] font-mono text-[11px] font-bold shrink-0">
                01
              </div>
              <div className="space-y-0.5">
                <div className="text-[12.5px] font-semibold text-[var(--text-main)]">
                  Lead Analyst Ingestion
                </div>
                <div className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Queries live arXiv preprint metadata & extracts technical abstracts via REST gateway.
                </div>
              </div>
            </div>

            {/* Tier 2 */}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-[var(--highlight-bg)] border border-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary)] font-mono text-[11px] font-bold shrink-0">
                02
              </div>
              <div className="space-y-0.5">
                <div className="text-[12.5px] font-semibold text-[var(--text-main)]">
                  Forensic Fact-Check Matrix
                </div>
                <div className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Cross-verifies claims, assigns confidence scores, and audits reproducibility evidence.
                </div>
              </div>
            </div>

            {/* Tier 3 */}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-[var(--highlight-bg)] border border-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary)] font-mono text-[11px] font-bold shrink-0">
                03
              </div>
              <div className="space-y-0.5">
                <div className="text-[12.5px] font-semibold text-[var(--text-main)]">
                  Autonomous ReportLab 4.x PDF
                </div>
                <div className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Compiles a formal institutional research dossier ready for 1-click download.
                </div>
              </div>
            </div>

            {/* Micro Spec Footer */}
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10.5px] font-mono text-[var(--text-muted)]">
              <span>Benchmark Latency: ~12.6s</span>
              <span className="text-emerald-400 font-medium">Verified 20/20 Gates</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
