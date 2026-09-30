import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Search,
  Settings,
  X,
  PanelLeftClose,
  PanelLeft,
  Sun,
  Moon,
  Compass,
} from "lucide-react";

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  sessions = [],
  currentSessionId,
  onNewSession,
  onSelectSession,
  onDeleteSession,
  onOpenSettings,
  theme = "dark",
  onToggleTheme,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = sessions.filter((s) =>
    s.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* 1. EXPANDED SIDEBAR DRAWER */}
      <aside
        className={`fixed top-14 bottom-0 left-0 z-35 flex flex-col w-72 sm:w-80 bg-[var(--island-bg)] backdrop-blur-2xl border-r border-[var(--island-border)] shadow-xl transition-transform duration-200 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        }`}
      >
        {/* Top Action Bar: New Chat & Search & Close */}
        <div className="p-3 border-b border-[var(--glass-border)] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onNewSession}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[var(--accent-primary)] text-white text-[12.5px] font-semibold hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Research</span>
            </button>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="ml-2 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-surface-subtle)] active:scale-95 transition-all cursor-pointer"
              title="Close Sidebar (Ctrl+B)"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search previous dossiers..."
              className="w-full pl-8 pr-7 py-1.5 rounded-lg text-[12px] bg-[var(--glass-surface-subtle)] border border-[var(--island-border)] text-[var(--text-main)] placeholder:text-[var(--text-muted)] placeholder:opacity-60 outline-none focus:border-[var(--accent-primary)]/50 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="text-[10.5px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-wider px-2 py-1">
            Research History ({filtered.length})
          </div>

          {filtered.length === 0 ? (
            <div className="py-8 text-center text-[12px] text-[var(--text-muted)] opacity-60">
              {searchQuery ? "No matching queries" : "No previous research yet"}
            </div>
          ) : (
            filtered.map((sess) => {
              const isSelected = sess.id === currentSessionId;
              const isResearch = sess.messages?.some((m) => m.type === "research");

              return (
                <div
                  key={sess.id}
                  onClick={() => onSelectSession(sess.id)}
                  className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? "bg-[var(--highlight-bg)] border-[var(--accent-primary)]/40 text-[var(--accent-primary)] font-semibold shadow-xs"
                      : "bg-transparent border-transparent text-[var(--text-main)] hover:bg-[var(--glass-surface-subtle)] hover:border-[var(--glass-border)]"
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden pr-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isSelected
                          ? "bg-[var(--accent-primary)]"
                          : isResearch
                          ? "bg-emerald-400"
                          : "bg-[var(--text-muted)]/40"
                      }`}
                    />
                    <span className="text-[12.5px] truncate font-normal leading-tight">
                      {sess.title}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(sess.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-rose-500/15 hover:text-rose-400 text-[var(--text-muted)] transition-opacity shrink-0 cursor-pointer"
                    title="Delete dossier"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Profile & Quick Settings */}
        <div className="p-2.5 border-t border-[var(--glass-border)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <div className="flex items-center gap-2 px-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[10.5px]">Groq LPU Active</span>
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-surface-subtle)] cursor-pointer transition-all"
            title="Open Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* 2. MINIMALIST COLLAPSED LEFT DOCK */}
      {!sidebarOpen && (
        <aside className="hidden sm:flex fixed top-18 left-3 z-30 flex-col items-center gap-2 p-1.5 rounded-2xl bg-[var(--island-bg)] backdrop-blur-2xl border border-[var(--island-border)] shadow-md select-none">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-surface-subtle)] transition-all cursor-pointer"
            title="Expand Sidebar (Ctrl+B)"
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onNewSession}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--accent-primary)] text-white shadow-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            title="New Research (Ctrl+K)"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>

          <div className="w-4 h-[1px] bg-[var(--island-border)] my-0.5" />

          <button
            type="button"
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-surface-subtle)] transition-all cursor-pointer"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </aside>
      )}
    </>
  );
}
