import React from "react";
import LiquidGlassInput from "./LiquidGlassInput";
import { Atom, Dna, ArrowUpRight } from "lucide-react";

export default function HeroCenter({
  value,
  onChange,
  onSend,
  disabled,
  suggestions = [],
  widthClass = "max-w-[940px]",
  theme = "dark",
}) {
  const symbolSrc =
    theme === "dark"
      ? "/assets/veraxis_symbol_light.png"
      : "/assets/veraxis_symbol_dark.png";

  const nameSrc =
    theme === "dark"
      ? "/assets/veraxis_name_light.png"
      : "/assets/veraxis_name_dark.png";

  return (
    <div className={`w-full ${widthClass} px-3 sm:px-6 flex flex-col items-center gap-6 sm:gap-7 my-auto z-20 animate-buttery-fade-in`}>
      {/* Brand AI Symbol & Name Centered Above Wide Input Box */}
      <div className="relative flex flex-col items-center justify-center gap-2.5">
        <img
          src={symbolSrc}
          alt="VERAXIS AI Symbol"
          className="w-20 h-20 sm:w-24 sm:h-24 object-contain select-none pointer-events-none drop-shadow-[0_12px_32px_rgba(0,0,0,0.5)] transition-transform duration-300 hover:scale-105"
        />
        <img
          src={nameSrc}
          alt="VERAXIS AI"
          className="h-6.5 sm:h-7.5 w-auto object-contain select-none pointer-events-none"
        />
      </div>

      {/* Prominent Centered Wide Input Box */}
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

      {/* Dynamic AI Suggested Topics Pills (Visible only on mid screen hero) */}
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
