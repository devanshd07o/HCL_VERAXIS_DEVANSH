import React, { useEffect } from "react";
import { X, Moon, Sun, Type, Sliders, Cpu, CheckCircle2, ShieldCheck, FileText, Maximize2 } from "lucide-react";

export default function SettingsModal({
  isOpen,
  onClose,
  theme,
  setTheme,
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  chatWidth = "normal",
  setChatWidth,
}) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const fontOptions = [
    { id: "Plus Jakarta Sans", name: "Plus Jakarta Sans", desc: "Modern & Geometric" },
    { id: "Inter", name: "Inter", desc: "Clean & Objective" },
    { id: "Outfit", name: "Outfit", desc: "Contemporary Swiss" },
    { id: "JetBrains Mono", name: "JetBrains Mono", desc: "Monospaced Technical" },
  ];

  const sizeOptions = [
    { value: "14px", label: "Small (14px)" },
    { value: "15px", label: "Default (15px)" },
    { value: "16px", label: "Medium (16px)" },
    { value: "18px", label: "Large (18px)" },
  ];

  const widthOptions = [
    { id: "narrow", label: "Narrow", desc: "760px compact reading" },
    { id: "normal", label: "Normal", desc: "940px balanced wide" },
    { id: "wide", label: "Wide", desc: "1180px panoramic view" },
  ];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
    >
      <div className="w-full max-w-[560px] max-h-[88vh] overflow-y-auto stage-scroll-container p-5 sm:p-6 rounded-3xl bg-[var(--glass-surface)] backdrop-blur-2xl border border-[var(--glass-border)] shadow-2xl text-[var(--text-main)] space-y-5">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--glass-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[var(--highlight-bg)] flex items-center justify-center text-[var(--accent-cyan)]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[16px] sm:text-[17px] font-semibold tracking-tight text-[var(--text-main)]">
                System Preferences
              </h2>
              <p className="text-[11.5px] text-[var(--text-muted)]">
                Appearance, typography, and chat workspace scaling
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] hover:bg-[var(--glass-border)] transition-all"
          >
            <X className="w-4 h-4 opacity-70" />
          </button>
        </div>

        {/* SECTION 1: Appearance & Theme */}
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Appearance & Theme
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Dark Obsidian Option */}
            <div
              onClick={() => setTheme("dark")}
              className={`p-3 rounded-2xl cursor-pointer border transition-all flex flex-col justify-between gap-1.5 ${
                theme === "dark"
                  ? "bg-[var(--highlight-bg)] border-[var(--accent-cyan)] shadow-sm"
                  : "bg-[var(--glass-surface-subtle)] border-[var(--glass-border)] hover:border-[var(--text-muted)]/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#212229] border border-white/20 flex items-center justify-center text-sky-400">
                    <Moon className="w-3 h-3" />
                  </div>
                  <span className="font-medium text-[13.5px]">Dark Obsidian</span>
                </div>
                {theme === "dark" && <CheckCircle2 className="w-4 h-4 text-[var(--accent-cyan)]" />}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Deep neutral obsidian graphite. Zero blue glare for executive focus.
              </p>
            </div>

            {/* Silk Alabaster Option */}
            <div
              onClick={() => setTheme("light")}
              className={`p-3 rounded-2xl cursor-pointer border transition-all flex flex-col justify-between gap-1.5 ${
                theme === "light"
                  ? "bg-[var(--highlight-bg)] border-[var(--accent-cyan)] shadow-sm"
                  : "bg-[var(--glass-surface-subtle)] border-[var(--glass-border)] hover:border-[var(--text-muted)]/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#F6F5F2] border border-stone-300 flex items-center justify-center text-amber-600">
                    <Sun className="w-3 h-3" />
                  </div>
                  <span className="font-medium text-[13.5px]">Silk Alabaster</span>
                </div>
                {theme === "light" && <CheckCircle2 className="w-4 h-4 text-[var(--accent-cyan)]" />}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Warm porcelain tone. Daylight anti-glare with executive clarity.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: Chat Workspace Width (Narrow / Normal / Wide) */}
        <div className="space-y-2 pt-2 border-t border-[var(--glass-border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              <Maximize2 className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
              <span>Chat Workspace Width</span>
            </div>
            <span className="text-[11px] text-[var(--text-muted)] capitalize">{chatWidth}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {widthOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setChatWidth(opt.id)}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  chatWidth === opt.id
                    ? "bg-[var(--highlight-bg)] border-[var(--accent-cyan)] text-[var(--accent-cyan)] font-medium shadow-sm"
                    : "bg-[var(--glass-surface-subtle)] border-[var(--glass-border)] text-[var(--text-main)] hover:border-[var(--text-muted)]/30"
                }`}
              >
                <div className="text-[13px] font-semibold">{opt.label}</div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 3: Typography & Readability */}
        <div className="space-y-2.5 pt-2 border-t border-[var(--glass-border)]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Typography & Scaling
          </div>

          {/* Sub-section: Font Family */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-medium">Primary Typeface</span>
              <span className="text-[11px] text-[var(--text-muted)]">System-wide font</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {fontOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setFontFamily(opt.id)}
                  className={`p-2 rounded-xl text-left border transition-all ${
                    fontFamily === opt.id
                      ? "bg-[var(--highlight-bg)] border-[var(--accent-cyan)] text-[var(--accent-cyan)] font-medium"
                      : "bg-[var(--glass-surface-subtle)] border-[var(--glass-border)] text-[var(--text-main)] hover:border-[var(--text-muted)]/30"
                  }`}
                >
                  <div className="text-[13px]" style={{ fontFamily: opt.id }}>
                    {opt.name}
                  </div>
                  <div className="text-[10.5px] text-[var(--text-muted)] mt-0.5">
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Sub-section: Font Scale */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-medium">Font Scale</span>
              <span className="text-[11px] text-[var(--text-muted)]">Active: {fontSize}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {sizeOptions.map((sz) => (
                <button
                  key={sz.value}
                  onClick={() => setFontSize(sz.value)}
                  className={`py-1 px-1.5 rounded-lg text-[11.5px] font-medium border text-center transition-all ${
                    fontSize === sz.value
                      ? "bg-[var(--accent-cyan)] text-slate-950 border-[var(--accent-cyan)] font-semibold shadow-sm"
                      : "bg-[var(--glass-surface-subtle)] border-[var(--glass-border)] text-[var(--text-main)] hover:border-[var(--text-muted)]/30"
                  }`}
                >
                  {sz.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 4: Multi-Agent Neural Architecture */}
        <div className="space-y-2 pt-2 border-t border-[var(--glass-border)]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Multi-Agent Neural Architecture
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[var(--accent-cyan)]">
                <Cpu className="w-3.5 h-3.5 shrink-0" />
                <span>Dual Intent Router</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-1">
                Fast chat &lt;400ms or 3-Tier CrewAI deep search
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Forensic Auditor</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-1">
                Ground-truth cross verification matrix
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-violet-400">
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span>ReportLab 4.x</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-1">
                Two-pass publication PDF dossier
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5: Mobile & Capstone Status */}
        <div className="p-3 rounded-xl bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] flex items-center justify-between text-[11.5px]">
          <div>
            <div className="font-semibold text-[var(--text-main)]">HCL Major B.Tech Capstone 2026</div>
            <div className="text-[10.5px] text-[var(--text-muted)]">PWA Mobile Ready • Dual-Route Intelligence</div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold text-[10.5px]">
            Engine Live
          </span>
        </div>

      </div>
    </div>
  );
}
