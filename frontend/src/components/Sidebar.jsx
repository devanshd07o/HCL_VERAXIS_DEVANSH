import React from "react";
import { Plus, Trash2, MessageSquare } from "lucide-react";

export default function Sidebar({
  sidebarOpen,
  sessions,
  currentSessionId,
  onNewSession,
  onSelectSession,
  onDeleteSession,
}) {
  return (
    <aside
      className={`fixed top-14 bottom-0 left-0 z-30 flex flex-col p-4 bg-[var(--sidebar-bg)] backdrop-blur-xl border-r border-[var(--glass-border)] transition-all duration-300 ${
        sidebarOpen
          ? "w-64 translate-x-0 opacity-100"
          : "w-0 -translate-x-full opacity-0 pointer-events-none p-0 overflow-hidden"
      }`}
    >
      <button
        onClick={onNewSession}
        className="w-full h-10 rounded-full flex items-center justify-center gap-2 bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-cyan)] text-white font-medium text-[13.5px] shadow-sm hover:opacity-90 active:scale-98 transition-all mb-4"
      >
        <Plus className="w-4 h-4" />
        <span>New Session</span>
      </button>

      <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-2">
        Recent Sessions
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 pr-1 stage-scroll-container">
        {sessions.length === 0 ? (
          <div className="text-center text-[13px] text-[var(--text-muted)] py-8">
            No previous sessions
          </div>
        ) : (
          sessions.map((sess) => (
            <div
              key={sess.id}
              onClick={() => onSelectSession(sess.id)}
              className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all border ${
                sess.id === currentSessionId
                  ? "bg-[var(--highlight-bg)] border-[var(--glass-border)] text-[var(--accent-cyan)] font-medium"
                  : "bg-transparent border-transparent text-[var(--text-main)] hover:bg-[var(--glass-surface-subtle)] hover:border-[var(--glass-border)]"
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-50" />
                <span className="text-[13px] truncate">{sess.title}</span>
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
          ))
        )}
      </div>

      <div className="mt-auto pt-3 border-t border-[var(--glass-border)] text-center text-[11px] text-[var(--text-muted)]">
        HCL Major Capstone 2026
      </div>
    </aside>
  );
}
