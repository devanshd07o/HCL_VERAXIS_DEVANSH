import React from "react";
import { Sparkles, PanelRightClose, PanelRightOpen } from "lucide-react";
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
      className="fixed top-0 left-0 right-0 h-14 px-3 sm:px-5 flex items-center justify-between z-40 bg-[var(--glass-surface)] backdrop-blur-2xl border-b border-[var(--glass-border)] transition-colors duration-300 select-none"
    >
      {/* Brand Anchor: White/Bright Logo & Name in Dark Mode, Dark in Light Mode (No duplicate sidebar button) */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex items-center">
          <img
            src={symbolSrc}
            alt="VERAXIS AI Symbol"
            className="w-8 h-8 object-contain drop-shadow-xs select-none"
          />
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-[var(--bg-app)] animate-pulse" />
        </div>
        <img
          src={nameSrc}
          alt="VERAXIS A.I"
          className="h-5.5 sm:h-6 w-auto object-contain select-none"
        />
      </div>

      {/* Center Dynamic AI Chat Title Pill (Renames 2 times) */}
      <div className="flex-1 flex justify-center px-2 max-w-[500px]">
        <HoverPill text="Active Chat Topic (Auto-summarized by AI)">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--island-bg)] border border-[var(--glass-border)] shadow-xs transition-all max-w-[220px] sm:max-w-[360px] md:max-w-[420px] cursor-default">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent-cyan)] shrink-0 animate-pulse-subtle" />
            <span className="text-[12.5px] sm:text-[13px] font-semibold text-[var(--text-main)] truncate tracking-tight">
              {chatTitle || "New Chat"}
            </span>
          </div>
        </HoverPill>
      </div>

      {/* Right Action: Clean Research Inspector Drawer Toggle */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <HoverPill text={rightPanelOpen ? "Close Inspector (Ctrl+I)" : "Open Research Inspector (Ctrl+I)"}>
          <button
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
              rightPanelOpen
                ? "bg-[var(--highlight-bg)] border-[var(--accent-cyan)]/40 text-[var(--accent-cyan)] shadow-xs"
                : "bg-[var(--glass-surface-subtle)] border-[var(--glass-border)] text-[var(--text-main)] hover:bg-[var(--glass-border)]"
            }`}
          >
            {rightPanelOpen ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <PanelRightOpen className="w-4 h-4" />
            )}
            {hasActiveResearch && !rightPanelOpen && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--accent-cyan)] ring-2 ring-[var(--bg-app)] animate-pulse" />
            )}
          </button>
        </HoverPill>
      </div>
    </header>
  );
}
