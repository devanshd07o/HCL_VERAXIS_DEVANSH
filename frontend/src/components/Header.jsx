import React from "react";
import { Menu, Settings, Sun, Moon } from "lucide-react";

export default function Header({
  sidebarOpen,
  setSidebarOpen,
  onOpenSettings,
  theme,
  onToggleTheme,
}) {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 px-4 sm:px-6 flex items-center justify-between z-40 bg-[var(--glass-surface)] backdrop-blur-xl border-b border-[var(--glass-border)] transition-colors duration-300">
      {/* Brand Anchor */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] text-[var(--text-main)] hover:bg-[var(--glass-border)] active:scale-95 transition-all"
          title="Toggle Navigation Sidebar"
        >
          <Menu className="w-4 h-4 opacity-80" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center">
            <img
              src="/assets/veraxis_logo.png"
              alt="Veraxis AI Logo"
              className="w-7 h-7 rounded-lg object-cover shadow-sm"
            />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-[var(--bg-app)] animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[16px] tracking-tight text-[var(--text-main)]">
              VERAXIS AI
            </span>
            <span className="hidden sm:inline-flex text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--highlight-bg)] text-[var(--accent-cyan)] border border-[var(--glass-border)]">
              RESEARCH 3.0
            </span>
          </div>
        </div>
      </div>

      {/* Center Status Pill */}
      <div className="hidden md:flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] text-[12px] font-medium text-[var(--text-muted)]">
        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse" />
        <span className="text-[var(--text-main)] font-normal opacity-90">
          Autonomous Neural Engine Online
        </span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleTheme}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] text-[var(--text-main)] hover:bg-[var(--glass-border)] active:scale-95 transition-all"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        <button
          onClick={onOpenSettings}
          className="h-9 px-3 rounded-full flex items-center gap-1.5 bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] text-[var(--text-main)] hover:bg-[var(--glass-border)] active:scale-95 transition-all text-[13px] font-medium"
          title="Open Preferences"
        >
          <Settings className="w-3.5 h-3.5 opacity-80" />
          <span className="hidden sm:inline">Preferences</span>
        </button>
      </div>
    </header>
  );
}
