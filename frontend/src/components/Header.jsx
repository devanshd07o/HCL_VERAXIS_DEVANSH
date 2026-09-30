import React from "react";
import { PanelRightClose, PanelRightOpen, Compass, ArrowLeft, Sun, Moon, Radio } from "lucide-react";
import HoverPill from "./HoverPill";

export default function Header({
  sidebarOpen,
  setSidebarOpen,
  rightPanelOpen,
  setRightPanelOpen,
  onOpenSettings,
  theme,
  onToggleTheme,
  hasActiveResearch = false,
  chatTitle = "New Chat",
  onDoubleClickHeader,
  isInitialMode = true,
  onReturnHome,
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
    <header
      onDoubleClick={onDoubleClickHeader}
      className="relative w-full h-14 shrink-0 px-3 sm:px-6 flex items-center justify-between z-40 bg-[var(--glass-surface)] backdrop-blur-2xl border-b border-[var(--glass-border)] transition-colors duration-300 select-none"
    >
      {/* Brand Anchor */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={onReturnHome}>
          <div className="relative flex items-center">
            <img
              src={symbolSrc}
              alt="VERAXIS AI Symbol"
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain drop-shadow-xs select-none"
            />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-[var(--bg-app)] animate-pulse" />
          </div>
          <img
            src={nameSrc}
            alt="VERAXIS A.I"
            className="h-5 sm:h-5.5 w-auto object-contain select-none"
          />
        </div>

        {/* If inside active dossier, show Return to Mission Control button */}
        {!isInitialMode && (
          <button
            onClick={onReturnHome}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Mission Control</span>
          </button>
        )}
      </div>

      {/* Center Dynamic Status or Title */}
      <div className="flex-1 flex justify-center px-4 max-w-[500px]">
        {isInitialMode ? (
          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-[var(--text-muted)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[var(--text-main)] font-medium">CrewAI Multi-Agent Swarm</span>
            <span className="opacity-40">•</span>
            <span>Online</span>
          </div>
        ) : (
          <span className="text-[13px] sm:text-[13.5px] font-medium text-[var(--text-main)] truncate opacity-90 select-none">
            {chatTitle || "Research Dossier"}
          </span>
        )}
      </div>

      {/* Right Actions: Theme Toggle + Research Inspector Drawer Toggle */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <HoverPill text={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}>
          <button
            onClick={onToggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-[var(--glass-border)] bg-[var(--glass-surface-subtle)] text-[var(--text-main)] hover:bg-[var(--glass-border)] active:scale-95 transition-all cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </HoverPill>

        <HoverPill text={rightPanelOpen ? "Close Inspector (Ctrl+I)" : "Open Research Inspector (Ctrl+I)"}>
          <button
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
              rightPanelOpen
                ? "bg-[var(--highlight-bg)] border-[var(--accent-primary)]/40 text-[var(--accent-primary)] shadow-xs"
                : "bg-[var(--glass-surface-subtle)] border-[var(--glass-border)] text-[var(--text-main)] hover:bg-[var(--glass-border)]"
            }`}
          >
            {rightPanelOpen ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <PanelRightOpen className="w-4 h-4" />
            )}
            {hasActiveResearch && !rightPanelOpen && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)] ring-2 ring-[var(--bg-app)] animate-pulse" />
            )}
          </button>
        </HoverPill>
      </div>
    </header>
  );
}
