import React, { useState } from "react";
import { Plus, Trash2, MessageSquare, Search, Shield, Zap, FolderGit2 } from "lucide-react";

export default function Sidebar({
  sidebarOpen,
  sessions,
  currentSessionId,
  onNewSession,
  onSelectSession,
  onDeleteSession,
}) {
  const [filterQuery, setFilterQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "research" | "chat"

  const filteredSessions = sessions.filter((sess) => {
    const matchesSearch = sess.title.toLowerCase().includes(filterQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeFilter === "research") {
      return sess.messages?.some((m) => m.type === "research");
    }
    if (activeFilter === "chat") {
      return !sess.messages?.some((m) => m.type === "research");
    }
    return true;
  });

  return (
    <aside
      className={`fixed top-14 bottom-0 left-0 z-30 flex flex-col p-3 bg-[var(--sidebar-bg)] backdrop-blur-2xl border-r border-[var(--glass-border)] transition-all duration-300 shadow-xl ${
        sidebarOpen
          ? "w-64 sm:w-72 translate-x-0 opacity-100"
          : "w-0 -translate-x-full opacity-0 pointer-events-none p-0 overflow-hidden"
      }`}
    >
      {/* Primary Action Button */}
      <button
        onClick={onNewSession}
        className="w-full h-10 rounded-xl flex items-center justify-between px-3.5 bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-cyan)] text-white font-medium text-[13px] shadow-sm hover:opacity-95 active:scale-98 transition-all mb-3 cursor-pointer group"
      >
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          <span>New Research</span>
        </div>
        <kbd className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-white/20 font-mono">
          Ctrl+K
        </kbd>
      </button>

      {/* Quick Search Input */}
      <div className="relative mb-2.5">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter research history..."
          className="w-full h-8 pl-8 pr-3 rounded-lg bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] text-[12px] text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent-cyan)]/50 transition-colors"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1 mb-2 px-1">
        {[
          { id: "all", label: "All" },
          { id: "research", label: "Dossiers" },
          { id: "chat", label: "Quick Chat" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
              activeFilter === tab.id
                ? "bg-[var(--highlight-bg)] text-[var(--accent-cyan)] border border-[var(--glass-border)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sessions Scrollable Stream */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 stage-scroll-container">
        {filteredSessions.length === 0 ? (
          <div className="text-center text-[12.5px] text-[var(--text-muted)] py-10 px-4 space-y-1">
            <FolderGit2 className="w-6 h-6 mx-auto opacity-40 mb-2" />
            <div>No matching sessions</div>
            <div className="text-[11px] opacity-75">Start a new query to generate dossiers</div>
          </div>
        ) : (
          filteredSessions.map((sess) => {
            const isResearch = sess.messages?.some((m) => m.type === "research");
            const isSelected = sess.id === currentSessionId;
            return (
              <div
                key={sess.id}
                onClick={() => onSelectSession(sess.id)}
                className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all border ${
                  isSelected
                    ? "bg-[var(--highlight-bg)] border-[var(--glass-border)] text-[var(--accent-cyan)] font-medium"
                    : "bg-transparent border-transparent text-[var(--text-main)] hover:bg-[var(--glass-surface-subtle)] hover:border-[var(--glass-border)]"
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {isResearch ? (
                    <Shield className="w-3.5 h-3.5 shrink-0 text-emerald-400 opacity-80" />
                  ) : (
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-50" />
                  )}
                  <span className="text-[12.5px] truncate">{sess.title}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(sess.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-rose-500/15 hover:text-rose-400 text-[var(--text-muted)] transition-opacity"
                  title="Delete Session"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom SaaS Telemetry Card */}
      <div className="mt-auto pt-2.5 border-t border-[var(--glass-border)] space-y-2">
        <div className="p-2.5 rounded-xl bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <div className="text-[11.5px] font-medium text-[var(--text-main)]">Key Pool Ready</div>
          </div>
          <span className="text-[10.5px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">
            41 / 41 OK
          </span>
        </div>

        <div className="flex items-center justify-between px-1 text-[11px] text-[var(--text-muted)]">
          <span>Enterprise MultiIntel</span>
          <span className="font-mono">v3.0</span>
        </div>
      </div>
    </aside>
  );
}
