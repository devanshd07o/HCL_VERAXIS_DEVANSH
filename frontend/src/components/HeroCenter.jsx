import React from "react";
import LiquidGlassInput from "./LiquidGlassInput";
import { Sparkles, Compass } from "lucide-react";

export default function HeroCenter({
  value,
  onChange,
  onSend,
  disabled,
  suggestions = [],
  widthClass = "max-w-[940px]",
}) {
  return (
    <div className={`w-full ${widthClass} px-3 sm:px-6 flex flex-col items-center gap-6 sm:gap-7 my-auto z-20`}>
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center gap-2 sm:gap-2.5">
        <div className="relative p-1">
          <img
            src="/assets/veraxis_logo.png"
            alt="Veraxis AI Logo"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover shadow-lg border border-[var(--glass-border)]"
          />
        </div>
        <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-[var(--text-main)]">
          VERAXIS AI
        </h1>
        <p className="text-[13.5px] sm:text-[15px] text-[var(--text-muted)] max-w-[480px] px-2">
          What would you like to investigate today?
        </p>
      </div>

      {/* Prominent Centered Wide Liquid Glass Input */}
      <div className="w-full">
        <LiquidGlassInput
          value={value}
          onChange={onChange}
          onSend={onSend}
          disabled={disabled}
          widthClass="w-full"
        />
      </div>

      {/* Exactly 2 Dynamic AI Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2.5 max-w-[760px] w-full px-2">
          {suggestions.slice(0, 2).map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSend(s.query)}
              disabled={disabled}
              className="group flex items-center gap-2 px-4 py-2 rounded-full text-[12.5px] sm:text-[13px] font-normal bg-[var(--chip-bg)] border border-[var(--chip-border)] text-[var(--text-main)] hover:bg-[var(--chip-hover-bg)] hover:border-[var(--chip-hover-border)] hover:text-[var(--accent-cyan)] transition-all shadow-sm max-w-full truncate"
            >
              {idx === 0 ? (
                <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
              ) : (
                <Compass className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform shrink-0" />
              )}
              <span className="truncate">{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
