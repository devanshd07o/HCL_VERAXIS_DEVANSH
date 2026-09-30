import React from "react";
import { PanelLeft, Plus, Sun, Moon, Settings } from "lucide-react";

export default function Header({
  sidebarOpen,
  setSidebarOpen,
  onOpenSettings,
  theme,
  onToggleTheme,
  chatTitle = "New Chat",
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
    <header className="relative w-full h-13 shrink-0 px-3 sm:px-5 flex items-center justify-between z-40 bg-[var(--glass-surface)] backdrop-blur-xl border-b border-[var(--glass-border)] transition-colors duration-200 select-none">
      {/* Left Anchor: Sidebar Toggle + Brand Logo + New Chat */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => setSidebarOpen((prev) => !prev)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-surface-subtle)] active:scale-95 transition-all cursor-pointer border border-transparent ${
            sidebarOpen ? "text-[var(--accent-primary)] bg-[var(--highlight-bg)]" : ""
          }`}
          title="Toggle Sidebar (Ctrl+B)"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <div
          onClick={onReturnHome}
          className="flex items-center gap-2 cursor-pointer group"
          title="Return to Home"
        >
          <div className="relative flex items-center">
            <img
              src={symbolSrc}
              alt="VERAXIS AI Symbol"
              className="w-6 h-6 sm:w-7 sm:h-7 object-contain drop-shadow-xs"
            />
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          </div>
          <img
            src={nameSrc}
            alt="VERAXIS A.I"
            className="h-4 sm:h-4.5 w-auto object-contain hidden xs:block"
          />
        </div>

        <button
          type="button"
          onClick={onReturnHome}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] active:scale-95 transition-all cursor-pointer ml-1"
          title="Start New Research Inquiry (Ctrl+K)"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>

      {/* Center Title or Operational Signal */}
      <div className="flex-1 flex justify-center px-2 max-w-[480px]">
        {isInitialMode ? (
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono text-[var(--text-muted)] bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Multi-Agent Research Engine</span>
          </div>
        ) : (
          <span className="text-[12.5px] sm:text-[13px] font-medium text-[var(--text-main)] truncate opacity-90">
            {chatTitle || "Research Dossier"}
          </span>
        )}
      </div>

      {/* Right Controls: Settings + Theme Switcher */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--glass-border)] bg-[var(--glass-surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-border)] active:scale-95 transition-all cursor-pointer"
          title="Settings & Preferences"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--glass-border)] bg-[var(--glass-surface-subtle)] text-[var(--text-main)] hover:bg-[var(--glass-border)] active:scale-95 transition-all cursor-pointer"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-slate-700" />
          )}
        </button>
      </div>
    </header>
  );
}
