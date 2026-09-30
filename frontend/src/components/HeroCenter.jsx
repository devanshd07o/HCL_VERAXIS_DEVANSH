import React from "react";
import LiquidGlassInput from "./LiquidGlassInput";
import { Sparkles, Compass, Atom, Dna, Cpu, ArrowUpRight } from "lucide-react";

export default function HeroCenter({
  value,
  onChange,
  onSend,
  disabled,
  suggestions = [],
  widthClass = "max-w-[940px]",
  theme,
}) {
  return (
    <div className={`w-full ${widthClass} px-3 sm:px-6 flex flex-col items-center gap-6 sm:gap-8 my-auto z-20`}>
      {/* Top Sparkle & Ambient Halo (Image 1 Inspired) */}
      <div className="flex flex-col items-center text-center gap-3">
        <div className="relative group">
          {/* Subtle glowing halo */}
          <div className="absolute -inset-4 bg-gradient-to-r from-sky-500/20 via-indigo-500/20 to-purple-500/20 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative w-12 h-12 rounded-2xl bg-[var(--glass-surface)] backdrop-blur-xl border border-[var(--glass-border)] flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-[var(--text-main)] animate-pulse-subtle" />
          </div>
        </div>

        {/* Editorial Heading (Image 1 style: Ask our AI anything) */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--text-main)]">
          Ask our AI anything
        </h1>
        
        <p className="text-[13.5px] sm:text-[15px] text-[var(--text-muted)] max-w-[520px] px-2 leading-relaxed">
          Autonomous multi-agent intelligence for deep scientific preprints, forensic fact-auditing, and publication-ready dossiers.
        </p>

        {/* Capability Badges */}
        <div className="flex items-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>ArXiv Preprints</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] text-[var(--accent-cyan)]">
            <span>ReportLab 4.x PDF</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] text-amber-400">
            <span>Zero Hallucination</span>
          </span>
        </div>
      </div>

      {/* Prominent Centered Wide Liquid Glass Input */}
      <div className="w-full">
        <LiquidGlassInput
          value={value}
          onChange={onChange}
          onSend={onSend}
          disabled={disabled}
          widthClass="w-full"
          theme={theme}
        />
      </div>

      {/* Dynamic AI Suggested Topics Pills with Animated Hover Icons */}
      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2.5 max-w-[800px] w-full px-2">
          {suggestions.map((s, idx) => {
            const Icon = idx % 2 === 0 ? Atom : Dna;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSend(s.query)}
                disabled={disabled}
                className="group flex items-center gap-2 px-4 py-2 rounded-full text-[12.5px] sm:text-[13px] font-medium bg-[var(--chip-bg)] border border-[var(--chip-border)] text-[var(--text-main)] hover:bg-[var(--chip-hover-bg)] hover:border-[var(--chip-hover-border)] hover:text-[var(--accent-cyan)] active:scale-95 transition-all shadow-xs cursor-pointer truncate max-w-full"
              >
                <Icon className="w-3.5 h-3.5 text-[var(--accent-cyan)] group-hover:scale-110 group-hover:rotate-12 transition-transform shrink-0" />
                <span className="truncate">{s.label}</span>
                <ArrowUpRight className="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--accent-cyan)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
