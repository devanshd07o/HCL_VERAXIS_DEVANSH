import React, { useState } from "react";
import {
  Plus,
  Trash2,
  MessageSquare,
  Search,
  Sparkles,
  Zap,
  Clock,
  ShieldCheck,
  Settings,
  X,
  FileText
} from "lucide-react";

export default function Sidebar({
  sidebarOpen,
  sessions,
  currentSessionId,
  onNewSession,
  onSelectSession,
  onDeleteSession,
  onOpenSettings,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchInput, setShowSearchInput] = useState(false);

  // Filter sessions by search term
  const filtered = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group sessions into Today vs Earlier
  const todaySessions = [];
  const earlierSessions = [];
  const now = new Date();

  filtered.forEach((sess) => {
    const d = new Date(sess.createdAt || Date.now());
    const diffHours = (now - d) / (1000 * 60 * 60);
    if (diffHours < 24) {
      todaySessions.push(sess);
    } else {
      earlierSessions.push(sess);
    }
  });

  return (
    <aside
      className={`fixed top-16 bottom-3 left-3 z-30 flex flex-col p-3.5 bg-[var(--island-bg)] backdrop-blur-2xl border border-[var(--island-border)] rounded-2xl sm:rounded-3xl shadow-[var(--island-shadow)] transition-all duration-300 ${
        sidebarOpen
          ? "w-72 sm:w-80 translate-x-0 opacity-100"
          : "w-0 -translate-x-full opacity-0 pointer-events-none p-0 overflow-hidden border-none"
      }`}
    >
      {/* Brand Header (Image 2 style: CHAT A.I+) */}
      <div className="flex items-center justify-between px-2 pt-1 pb-3 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[var(--accent-blue)] via-[var(--accent-cyan)] to-indigo-500 p-[1.5px] shadow-sm">
            <div className="w-full h-full bg-[var(--bg-app)] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[var(--accent-cyan)] animate-pulse-subtle" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[15.5px] tracking-tight text-[var(--text-main)]">
                VERAXIS A.I
              </span>
              <span className="text-[12px] font-bold text-[var(--accent-cyan)]">+</span>
            </div>
            <span className="text-[10px] text-[var(--text-muted)] font-medium">
              Autonomous Intelligence
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-beacon" />
          <span className="text-[10.5px] font-mono text-emerald-400 font-semibold">Ready</span>
        </div>
      </div>

      {/* Primary Action Button Row (Image 2 layout: Pill + Search Icon) */}
      <div className="flex items-center gap-2 mt-3.5 mb-3">
        <button
          onClick={onNewSession}
          className="flex-1 h-10 px-4 rounded-full flex items-center justify-center gap-2 bg-gradient-to-r from-[var(--accent-blue)] to-indigo-600 text-white font-semibold text-[13px] shadow-sm hover:shadow-md hover:brightness-110 active:scale-98 transition-all cursor-pointer group"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          <span>New Research</span>
        </button>

        <button
          onClick={() => setShowSearchInput(!showSearchInput)}
          className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
            showSearchInput
              ? "bg-[var(--highlight-bg)] border-[var(--accent-cyan)]/50 text-[var(--accent-cyan)]"
              : "bg-[var(--glass-surface-subtle)] border-[var(--glass-border)] text-[var(--text-main)] hover:bg-[var(--glass-border)]"
          }`}
          title="Search conversations"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input Filter Drawer */}
      {showSearchInput && (
        <div className="relative mb-2.5 animate-buttery-fade-in">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search research queries..."
            autoFocus
            className="w-full h-8.5 pl-3 pr-7 rounded-xl bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] text-[12px] text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent-cyan)]/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Conversations Stream Header */}
      <div className="flex items-center justify-between px-2 pt-1 pb-1 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
        <span>Your Research</span>
        {sessions.length > 0 && (
          <span className="text-[10px] font-mono opacity-80">{sessions.length} sessions</span>
        )}
      </div>

      {/* Scrollable Grouped Sessions (Image 2 style) */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1 stage-scroll-container">
        {filtered.length === 0 ? (
          <div className="text-center text-[12.5px] text-[var(--text-muted)] py-12 px-4 space-y-2">
            <Clock className="w-6 h-6 mx-auto opacity-30" />
            <div>No research sessions found</div>
            <div className="text-[11px] opacity-70">Execute a query to begin</div>
          </div>
        ) : (
          <>
            {/* TODAY GROUP */}
            {todaySessions.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-[var(--text-muted)] px-2 py-0.5 uppercase tracking-wider opacity-75">
                  Today
                </div>
                {todaySessions.map((sess) => (
                  <SessionRow
                    key={sess.id}
                    sess={sess}
                    isSelected={sess.id === currentSessionId}
                    onSelect={() => onSelectSession(sess.id)}
                    onDelete={() => onDeleteSession(sess.id)}
                  />
                ))}
              </div>
            )}

            {/* PREVIOUS 7 DAYS GROUP */}
            {earlierSessions.length > 0 && (
              <div className="space-y-1 pt-1">
                <div className="text-[10px] font-bold text-[var(--text-muted)] px-2 py-0.5 uppercase tracking-wider opacity-75">
                  Last 7 Days
                </div>
                {earlierSessions.map((sess) => (
                  <SessionRow
                    key={sess.id}
                    sess={sess}
                    isSelected={sess.id === currentSessionId}
                    onSelect={() => onSelectSession(sess.id)}
                    onDelete={() => onDeleteSession(sess.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Profile & Multi-Key Telemetry Card (Image 2 style) */}
      <div className="mt-auto pt-3 border-t border-[var(--glass-border)] space-y-2">
        {/* Key Pool Telemetry Pill */}
        <div className="p-2.5 rounded-xl bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <div className="text-[11px] font-medium text-[var(--text-main)]">41 Keys Active</div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/20">
            100% HEALTH
          </span>
        </div>

        {/* User Card with Settings Button */}
        <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-[var(--glass-surface-subtle)] transition-colors">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center text-white text-[12px] font-bold shrink-0 shadow-xs">
              DN
            </div>
            <div className="flex flex-col truncate">
              <span className="text-[12px] font-semibold text-[var(--text-main)] truncate">
                Devansh
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-mono truncate">
                Research Lead
              </span>
            </div>
          </div>

          <button
            onClick={onOpenSettings}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-border)] active:scale-95 transition-all"
            title="Preferences"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

// Single Session Item Component with Active Blue Indicator Dot (Image 2 Inspired)
function SessionRow({ sess, isSelected, onSelect, onDelete }) {
  const isDeepResearch = sess.messages?.some((m) => m.type === "research");

  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all border ${
        isSelected
          ? "bg-[var(--highlight-bg)] border-[var(--accent-cyan)]/40 text-[var(--accent-cyan)] font-semibold shadow-xs"
          : "bg-transparent border-transparent text-[var(--text-main)] hover:bg-[var(--glass-surface-subtle)] hover:border-[var(--glass-border)]"
      }`}
    >
      <div className="flex items-center gap-2.5 overflow-hidden pr-2">
        {isDeepResearch ? (
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        ) : (
          <MessageSquare className="w-3.5 h-3.5 opacity-60 shrink-0" />
        )}
        <span className="text-[12.5px] truncate font-normal">{sess.title}</span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {/* Delete action on hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-rose-500/15 hover:text-rose-400 text-[var(--text-muted)] transition-opacity"
          title="Delete"
        >
          <Trash2 className="w-3 h-3" />
        </button>

        {/* Active Blue Indicator Dot (Image 2 style) */}
        {isSelected && (
          <span className="w-2 h-2 rounded-full bg-[var(--accent-cyan)] shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
        )}
      </div>
    </div>
  );
}
