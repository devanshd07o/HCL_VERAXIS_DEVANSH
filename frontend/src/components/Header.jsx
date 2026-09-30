import React from "react";
import {
  Menu,
  Settings,
  Sun,
  Moon,
  Sparkles,
  PanelRightClose,
  PanelRightOpen,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
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
  return (
    <header
      onDoubleClick={onDoubleClickHeader}
      className="fixed top-0 left-0 right-0 h-14 px-3 sm:px-5 flex items-center justify-between z-40 bg-[var(--glass-surface)] backdrop-blur-2xl border-b border-[var(--glass-border)] transition-colors duration-300 select-none"
    >
      {/* Brand Anchor & Left Sidebar Toggle (Symbols Only + Hover Pill) */}
      <div className="flex items-center gap-2">
        <HoverPill text={sidebarOpen ? "Collapse Navigation (Ctrl+B)" : "Expand Navigation (Ctrl+B)"}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] text-[var(--text-main)] hover:bg-[var(--glass-border)] active:scale-95 transition-all cursor-pointer"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="w-4 h-4 opacity-80" />
            ) : (
              <PanelLeftOpen className="w-4 h-4 opacity-80" />
            )}
          </button>
        </HoverPill>

        <div className="flex items-center gap-2.5 ml-1">
          <div className="relative flex items-center">
            <img
              src="/assets/veraxis_logo.png"
              alt="Veraxis AI Logo"
              className="w-7 h-7 rounded-lg object-cover shadow-sm"
            />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-[var(--bg-app)] animate-pulse" />
          </div>
          <span className="font-extrabold text-[15.5px] tracking-tight text-[var(--text-main)] hidden xs:inline">
            VERAXIS
          </span>
        </div>
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

      {/* Right Actions: Symbols Only with Premium Hover Pills */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Theme Toggle Symbol */}
        <HoverPill text={theme === "dark" ? "Light Mode" : "Dark Mode"}>
          <button
            onClick={onToggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] text-[var(--text-main)] hover:bg-[var(--glass-border)] active:scale-95 transition-all cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </HoverPill>

        {/* Preferences / Settings Symbol */}
        <HoverPill text="Preferences & Settings">
          <button
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] text-[var(--text-main)] hover:bg-[var(--glass-border)] active:scale-95 transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4 opacity-80" />
          </button>
        </HoverPill>

        {/* Research Inspector Drawer Symbol */}
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

