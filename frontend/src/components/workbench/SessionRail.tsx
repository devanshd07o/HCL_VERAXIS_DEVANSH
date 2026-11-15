import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from "motion/react";
import {
  Bookmark,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ==========================================================================
   Types, constants, helpers
   ========================================================================== */

export interface SessionRecord {
  id: string;
  title?: string;
  createdAt?: string;
  messages?: unknown[];
}

interface SessionRailProps {
  open: boolean;
  onCloseMobile: () => void;
  sessions: SessionRecord[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onNewInquiry: () => void;
  onOpenVault: () => void;
  telemetry: { activeKeys: number; totalKeys: number };
}

const RAIL_WIDTH = 272;
const DESKTOP_QUERY = "(min-width: 1024px)";
const CONFIRM_TIMEOUT_MS = 5000;
const EASE = [0.22, 1, 0.36, 1] as const;
const SPRING = { type: "spring", stiffness: 520, damping: 40, mass: 0.8 } as const;
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

const TIME_FMT = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});
const DATE_FMT = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
});
const DATE_YEAR_FMT = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

type GroupLabel = "Today" | "Yesterday" | "Previous 7 days" | "Earlier";

interface Entry {
  session: SessionRecord;
  time: number | null;
}
interface Group {
  label: GroupLabel;
  items: Entry[];
}

const GROUP_ORDER: GroupLabel[] = [
  "Today",
  "Yesterday",
  "Previous 7 days",
  "Earlier",
];

function groupSessions(list: SessionRecord[]): Group[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const startToday = new Date(y, m, d).getTime();
  const startYesterday = new Date(y, m, d - 1).getTime();
  const startWeek = new Date(y, m, d - 7).getTime();

  const entries: Entry[] = list.map((session) => {
    const t = session.createdAt ? Date.parse(session.createdAt) : NaN;
    return { session, time: Number.isFinite(t) ? t : null };
  });

  entries.sort((a, b) => {
    if (a.time === b.time) return 0;
    if (a.time === null) return 1;
    if (b.time === null) return -1;
    return b.time - a.time;
  });

  const buckets: Record<GroupLabel, Entry[]> = {
    Today: [],
    Yesterday: [],
    "Previous 7 days": [],
    Earlier: [],
  };

  for (const e of entries) {
    const t = e.time;
    const label: GroupLabel =
      t === null
        ? "Earlier"
        : t >= startToday
        ? "Today"
        : t >= startYesterday
        ? "Yesterday"
        : t >= startWeek
        ? "Previous 7 days"
        : "Earlier";
    buckets[label].push(e);
  }

  return GROUP_ORDER.filter((l) => buckets[l].length > 0).map((label) => ({
    label,
    items: buckets[label],
  }));
}

function formatStamp(time: number | null, label: GroupLabel): string {
  if (time === null) return "";
  if (label === "Today" || label === "Yesterday") return TIME_FMT.format(time);
  const sameYear = new Date(time).getFullYear() === new Date().getFullYear();
  return (sameYear ? DATE_FMT : DATE_YEAR_FMT).format(time);
}

function turnsLabel(messages: unknown[] | undefined): string {
  const count = Array.isArray(messages) ? messages.length : 0;
  if (count === 0) return "Empty";
  const turns = Math.ceil(count / 2);
  return `${turns} ${turns === 1 ? "turn" : "turns"}`;
}

function subscribeDesktop(cb: () => void) {
  const mq = window.matchMedia(DESKTOP_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getDesktop = () => window.matchMedia(DESKTOP_QUERY).matches;

function useIsDesktop() {
  return useSyncExternalStore(subscribeDesktop, getDesktop, () => true);
}

/* ==========================================================================
   Small pieces
   ========================================================================= */

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const i = text.toLowerCase().indexOf(query);
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-[3px] bg-primary/20 px-px text-inherit">
        {text.slice(i, i + query.length)}
      </mark>
      {text.slice(i + query.length)}
    </>
  );
}

interface SessionRowProps {
  session: SessionRecord;
  isActive: boolean;
  query: string;
  meta: string;
  confirming: boolean;
  onSelect: (id: string) => void;
  onAskDelete: (id: string) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (id: string) => void;
}

function SessionRow({
  session,
  isActive,
  query,
  meta,
  confirming,
  onSelect,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}: SessionRowProps) {
  const title = session.title || "Untitled inquiry";
  const selectRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
  }, [confirming]);

  const cancel = () => {
    onCancelDelete();
    requestAnimationFrame(() => selectRef.current?.focus());
  };

  return (
    <li
      className="group/row"
      onKeyDown={(e) => {
        if (confirming && e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          cancel();
        }
      }}
    >
      <div
        className={cn(
          "uv-rail-item relative flex items-center rounded-lg",
          confirming && "bg-danger/10 border-danger/30",
          isActive && "active"
        )}
      >

        <button
          ref={selectRef}
          type="button"
          data-session-btn={session.id}
          aria-current={isActive ? "true" : undefined}
          title={title}
          onClick={() => onSelect(session.id)}
          className="focus-ring flex min-w-0 flex-1 flex-col gap-0.5 rounded-lg py-2 pr-1 pl-3 text-left"
        >
          <span className="truncate text-[13px] leading-5 font-medium text-foreground">
            <Highlight text={title} query={query} />
          </span>
          <span
            className={cn(
              "truncate font-mono text-[11px] leading-4 tabular-nums",
              confirming ? "text-danger" : "text-muted-foreground"
            )}
          >
            {confirming ? "Delete this chat?" : meta}
          </span>
        </button>

        {confirming ? (
          <div className="flex shrink-0 items-center gap-1 pr-1.5">
            <button
              ref={cancelRef}
              type="button"
              onClick={cancel}
              className="focus-ring h-7 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirmDelete(session.id)}
              className="focus-ring h-7 rounded-md bg-destructive px-2 text-xs font-semibold text-destructive-foreground transition-opacity hover:opacity-90"
            >
              Delete
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onAskDelete(session.id)}
            aria-label={`Delete ${title}`}
            className="focus-ring mr-1 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 transition-[opacity,color,background-color] duration-150 group-focus-within/row:opacity-100 group-hover/row:opacity-100 hover:bg-danger/10 hover:text-danger focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
          >
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        )}
      </div>
    </li>
  );
}

/* ==========================================================================
   Session rail
   ========================================================================== */

export default function SessionRail({
  open,
  onCloseMobile,
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onNewInquiry,
  onOpenVault,
  telemetry,
}: SessionRailProps) {
  const isDesktop = useIsDesktop();
  const reduceMotion = useReducedMotion();

  const [filterText, setFilterText] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const query = filterText.trim().toLowerCase();
  const drawerOpen = !isDesktop && open;

  /* ---------- Derived list ---------- */
  const filtered = useMemo(() => {
    if (!query) return sessions;
    return sessions.filter((s) =>
      (s.title || "Untitled inquiry").toLowerCase().includes(query)
    );
  }, [sessions, query]);

  const groups = useMemo(() => groupSessions(filtered), [filtered]);
  const flatIds = useMemo(
    () => groups.flatMap((g) => g.items.map((e) => e.session.id)),
    [groups]
  );

  /* ---------- Delete confirmation lifecycle ---------- */
  useEffect(() => {
    if (!confirmId) return;
    if (!sessions.some((s) => s.id === confirmId)) {
      setConfirmId(null);
      return;
    }
    const t = window.setTimeout(() => setConfirmId(null), CONFIRM_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [confirmId, sessions]);

  const focusRow = useCallback((id: string | undefined) => {
    requestAnimationFrame(() => {
      const el = id
        ? document.querySelector<HTMLElement>(
            `[data-session-btn="${CSS.escape(id)}"]`
          )
        : null;
      (el ?? searchRef.current)?.focus();
    });
  }, []);

  const handleConfirmDelete = useCallback(
    (id: string) => {
      const idx = flatIds.indexOf(id);
      const neighbor = flatIds[idx + 1] ?? flatIds[idx - 1];
      setConfirmId(null);
      onDeleteSession(id);
      focusRow(neighbor);
    },
    [flatIds, onDeleteSession, focusRow]
  );

  /* ---------- "/" focuses search ---------- */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) {
        return;
      }
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  /* ---------- Mobile drawer: focus in, focus restore ---------- */
  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() =>
      drawerRef.current?.focus({ preventScroll: true })
    );
    return () => {
      cancelAnimationFrame(raf);
      previous?.focus?.({ preventScroll: true });
    };
  }, [drawerOpen]);

  const trapTab = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;
    const nodes = drawerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!nodes || nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const current = document.activeElement;
    if (e.shiftKey && (current === first || current === drawerRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && current === last) {
      e.preventDefault();
      first.focus();
    }
  };

  /* ---------- Arrow-key navigation inside the list ---------- */
  const onListKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const buttons = Array.from(
      listRef.current?.querySelectorAll<HTMLElement>("[data-session-btn]") ?? []
    );
    const i = buttons.indexOf(document.activeElement as HTMLElement);
    if (i === -1 || buttons.length === 0) return;
    e.preventDefault();
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
        ? buttons.length - 1
        : e.key === "ArrowDown"
        ? Math.min(i + 1, buttons.length - 1)
        : Math.max(i - 1, 0);
    buttons[next].focus();
  };

  /* ---------- Shared body (a JSX value, not a component, so the
     search input never loses focus on re-render) ---------- */
  const body = (
    <aside
      aria-label="Chat history"
      className="uv-rail-aside flex h-full w-full flex-col overflow-hidden rounded-r-2xl border-y border-r border-border/40 bg-card/60 backdrop-blur-md text-card-foreground shadow-xs"
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h2 className="font-mono text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          Chats{" "}
          <span className="ml-1 tabular-nums text-foreground">{sessions.length}</span>
        </h2>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close sidebar"
          className="focus-ring -my-2 -mr-2 grid size-10 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground lg:hidden"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="flex flex-col gap-2 px-3 pb-3">
        <button
          type="button"
          onClick={onNewInquiry}
          className="uv-btn-viki h-9 w-full gap-2 text-xs"
        >
          <Plus className="size-3.5" aria-hidden />
          New inquiry
        </button>

        <div
          role="search"
          className="uv-search-box flex h-9 items-center"
        >
          <Search
            className="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground"
            aria-hidden
          />
          <input
            ref={searchRef}
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && filterText) {
                e.preventDefault();
                e.stopPropagation();
                setFilterText("");
              } else if (e.key === "ArrowDown") {
                const first = listRef.current?.querySelector<HTMLElement>(
                  "[data-session-btn]"
                );
                if (first) {
                  e.preventDefault();
                  first.focus();
                }
              }
            }}
            placeholder="Search chats"
            aria-label="Search chats"
            autoComplete="off"
            spellCheck={false}
            className="h-full w-full bg-transparent pr-8 pl-8 text-base text-foreground outline-none sm:text-sm"
          />
          {filterText ? (
            <button
              type="button"
              onClick={() => {
                setFilterText("");
                searchRef.current?.focus();
              }}
              aria-label="Clear search"
              className="focus-ring absolute right-1.5 grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          ) : (
            <kbd
              aria-hidden
              className="pointer-events-none absolute right-2 hidden rounded border border-border bg-secondary px-1 font-mono text-[10px] leading-4 text-muted-foreground lg:block"
            >
              /
            </kbd>
          )}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {query ? `${filtered.length} ${filtered.length === 1 ? "chat" : "chats"} found` : ""}
      </p>

      <div
        ref={listRef}
        onKeyDown={onListKeyDown}
        className="scroll-fade-y [--scroll-fade-size:1.25rem] min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-border px-2 py-2"
      >
        {groups.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <span className="grid size-9 place-items-center rounded-lg border border-border bg-sunk text-muted-foreground">
              <MessageSquare className="size-4" aria-hidden />
            </span>
            {sessions.length === 0 ? (
              <>
                <p className="text-sm font-medium text-foreground">No saved chats yet</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Ask a question and it will show up here.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground">No matches</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Nothing found for “{filterText.trim()}”.
                </p>
                <button
                  type="button"
                  onClick={() => setFilterText("")}
                  className="focus-ring rounded-md px-2 py-1 text-xs font-medium text-[color:var(--primary-text)] underline-offset-4 hover:underline"
                >
                  Clear search
                </button>
              </>
            )}
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.label} className="mb-3 last:mb-0">
              <h3 className="px-3 pt-2 pb-1 font-mono text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                {group.label}
              </h3>
              <ul className="flex flex-col gap-0.5">
                {group.items.map(({ session, time }) => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    isActive={session.id === activeSessionId}
                    query={query}
                    meta={formatStamp(time, group.label)}
                    confirming={confirmId === session.id}
                    onSelect={onSelectSession}
                    onAskDelete={setConfirmId}
                    onCancelDelete={() => setConfirmId(null)}
                    onConfirmDelete={handleConfirmDelete}
                  />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      {/* Bottom Navigation (Ask, Saved, Settings) in Left Panel - Mobile Only */}
      {!isDesktop && (
        <div className="shrink-0 border-t border-border/80 bg-card/60 p-2">
          <div className="grid grid-cols-3 gap-1">
            <a
              href="#/"
              onClick={onCloseMobile}
              className="flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-xs transition-colors text-muted-foreground hover:bg-secondary/60 hover:text-foreground active:scale-95"
              title="Ask"
            >
              <MessageSquare className="size-4" />
              <span className="font-mono text-[10px] tracking-tight">Ask</span>
            </a>
            <a
              href="#/dossiers"
              onClick={onCloseMobile}
              className="flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-xs transition-colors text-muted-foreground hover:bg-secondary/60 hover:text-foreground active:scale-95"
              title="Saved"
            >
              <Bookmark className="size-4" />
              <span className="font-mono text-[10px] tracking-tight">Saved</span>
            </a>
            <button
              type="button"
              onClick={() => {
                onCloseMobile();
                onOpenVault();
              }}
              className="flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-xs transition-colors cursor-pointer text-muted-foreground hover:bg-secondary/60 hover:text-foreground active:scale-95"
              title="Settings"
            >
              <Settings className="size-4" />
              <span className="font-mono text-[10px] tracking-tight">Settings</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );

  /* ---------- Render ---------- */
  return (
    <MotionConfig reducedMotion="user">
      {isDesktop && (
        <motion.div
          initial={false}
          animate={{ width: open ? RAIL_WIDTH : 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.22, ease: EASE }}
          inert={!open}
          aria-hidden={!open}
          className="h-full shrink-0 overflow-hidden"
        >
          <div className="h-full py-2 pr-1" style={{ width: RAIL_WIDTH }}>
            {body}
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            key="rail-backdrop"
            aria-hidden
            onClick={onCloseMobile}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs"
          />
        )}
        {drawerOpen && (
          <motion.div
            key="rail-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Chat history"
            tabIndex={-1}
            onKeyDown={trapTab}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.26, ease: EASE }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.35, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80 || info.velocity.x < -500) onCloseMobile();
            }}
            className="fixed inset-y-0 left-0 z-50 w-[min(86vw,320px)] py-2 pr-1 outline-none"
          >
            {body}
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
