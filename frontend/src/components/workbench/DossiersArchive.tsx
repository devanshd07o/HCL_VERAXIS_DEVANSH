import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import {
  ArrowUpRight,
  FileDown,
  FileText,
  Loader2,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Public types (contract with App.tsx)                                      */
/* -------------------------------------------------------------------------- */

interface ArchivedMessage {
  id: string;
  role: string;
  content: string;
  type?: string;
  topic?: string | null;
  sources?: Array<{ title: string; url: string; badge?: string }>;
  pdf_filename?: string | null;
  duration?: string;
}

export interface ArchivedSession {
  id: string;
  title?: string;
  createdAt?: string;
  messages?: ArchivedMessage[];
  rolling_summary?: string;
}

interface DossiersArchiveProps {
  sessions: ArchivedSession[];
  onOpenSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onDownloadPdf: (filename: string) => Promise<void>;
}

/* -------------------------------------------------------------------------- */
/*  Constants & helpers                                                       */
/* -------------------------------------------------------------------------- */

const EASE = [0.22, 1, 0.36, 1] as const;
const ACCENT_TEXT = "text-[var(--primary-text)]";
const ACCENT_SOFT =
  "border-[var(--primary-soft-border)] bg-[var(--primary-soft)] text-[var(--primary-text)]";

const ACTION_BTN =
  "focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-60";

type FilterKey = "all" | "reports";

interface ArchiveItem {
  session: ArchivedSession;
  title: string;
  reportCount: number;
  messageCount: number;
  topic: string | null;
  sourceCount: number;
  duration: string | null;
  pdf: string | null;
  date: Date | null;
  haystack: string;
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatRelative(date: Date): string {
  const now = Date.now();
  const minutes = Math.floor((now - date.getTime()) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const sameYear = date.getFullYear() === new Date(now).getFullYear();
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

function buildItem(session: ArchivedSession): ArchiveItem {
  const msgs = Array.isArray(session.messages) ? session.messages : [];
  const research = msgs.filter((m) => m.type === "research");
  const latest = research[research.length - 1] ?? null;

  const title = session.title?.trim() || "Untitled inquiry";
  const topicRaw = latest?.topic?.trim() || "";
  const topic =
    topicRaw && topicRaw.toLowerCase() !== title.toLowerCase() ? topicRaw : null;
  const allTopics = research.map((m) => m.topic ?? "").join(" ");

  return {
    session,
    title,
    reportCount: research.length,
    messageCount: msgs.length,
    topic,
    sourceCount: latest?.sources?.length ?? 0,
    duration: latest?.duration ?? null,
    pdf: latest?.pdf_filename || null,
    date: parseDate(session.createdAt),
    haystack: `${title} ${allTopics}`.toLowerCase(),
  };
}

/* -------------------------------------------------------------------------- */
/*  Card                                                                      */
/* -------------------------------------------------------------------------- */

interface ItemCardProps {
  item: ArchiveItem;
  confirming: boolean;
  pdfPending: boolean;
  onOpen: (id: string) => void;
  onAskDelete: (id: string) => void;
  onCancelDelete: (id: string) => void;
  onConfirmDelete: (id: string, title: string) => void;
  onPdf: (id: string, filename: string) => void;
  registerTrigger: (id: string, el: HTMLButtonElement | null) => void;
}

const ItemCard = memo(function ItemCard({
  item,
  confirming,
  pdfPending,
  onOpen,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
  onPdf,
  registerTrigger,
}: ItemCardProps) {
  const { session, title, reportCount, messageCount, topic, sourceCount, duration, pdf, date } =
    item;
  const hasReports = reportCount > 0;

  return (
    <article
      onKeyDown={(e) => {
        if (confirming && e.key === "Escape") {
          e.preventDefault();
          onCancelDelete(session.id);
        }
      }}
      className={cn(
        "edge-highlight group relative flex h-full flex-col gap-3 rounded-2xl border bg-card p-4 shadow-[var(--elev-1)] transition-colors",
        confirming
          ? "border-destructive/50"
          : "border-border hover:border-[var(--border-strong)]"
      )}
    >
      <div>
        <span
          className={cn(
            "inline-flex h-6 items-center gap-1.5 rounded-md border px-2 font-mono text-[11px] font-medium",
            hasReports
              ? ACCENT_SOFT
              : "border-border bg-secondary text-muted-foreground"
          )}
        >
          {hasReports && <FileText className="size-3" aria-hidden="true" />}
          {hasReports ? plural(reportCount, "report", "reports") : "Chat"}
        </span>
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <h2 className="font-display text-base font-semibold leading-snug text-foreground">
          <button
            type="button"
            onClick={() => onOpen(session.id)}
            className={cn(
              "block w-full rounded-sm text-left outline-none",
              confirming
                ? "focus-visible:ring-2 focus-visible:ring-ring"
                : "after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-ring"
            )}
          >
            <span className="line-clamp-2 break-words">{title}</span>
          </button>
        </h2>

        {topic && (
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <FileText
              className={cn("mt-0.5 size-3.5 shrink-0", ACCENT_TEXT)}
              aria-hidden="true"
            />
            <span className="line-clamp-2 break-words">{topic}</span>
          </p>
        )}

        <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 pt-1 font-mono text-[11px] tabular-nums text-muted-foreground">
          {date && <time dateTime={date.toISOString()}>{formatRelative(date)}</time>}
          <span>{plural(messageCount, "message", "messages")}</span>
          {sourceCount > 0 && <span>{plural(sourceCount, "source", "sources")}</span>}
          {duration && <span>{duration}</span>}
        </p>
      </div>

      <div className="flex min-h-9 items-center gap-2 border-t border-border pt-3">
        {confirming ? (
          <div
            role="group"
            aria-label={`Confirm deleting ${title}`}
            className="relative z-10 flex w-full items-center gap-2"
          >
            <p className="min-w-0 flex-1 text-xs text-foreground">Delete this chat?</p>
            <button
              type="button"
              autoFocus
              onClick={() => onCancelDelete(session.id)}
              className={ACTION_BTN}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirmDelete(session.id, title)}
              className="focus-ring inline-flex h-9 items-center rounded-lg bg-destructive px-3 text-xs font-medium text-white transition-opacity hover:opacity-90"
            >
              Delete
            </button>
          </div>
        ) : (
          <>
            <span
              aria-hidden="true"
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground"
            >
              Open
              <ArrowUpRight className="size-3.5" />
            </span>

            <div className="ml-auto flex items-center gap-1.5">
              {pdf && (
                <button
                  type="button"
                  onClick={() => onPdf(session.id, pdf)}
                  disabled={pdfPending}
                  aria-busy={pdfPending}
                  aria-label={`Download PDF for ${title}`}
                  className={cn(ACTION_BTN, "relative z-10")}
                >
                  {pdfPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <FileDown className="size-3.5 text-muted-foreground" />
                  )}
                  PDF
                </button>
              )}
              <button
                ref={(el) => registerTrigger(session.id, el)}
                type="button"
                onClick={() => onAskDelete(session.id)}
                aria-label={`Delete ${title}`}
                className="focus-ring relative z-10 inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </article>
  );
});

/* -------------------------------------------------------------------------- */
/*  Small pieces                                                              */
/* -------------------------------------------------------------------------- */

function FilterButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "focus-ring inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors",
        active
          ? "bg-card text-foreground shadow-[var(--elev-1)]"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      <span className="font-mono tabular-nums text-muted-foreground">{count}</span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  DossiersArchive                                                           */
/* -------------------------------------------------------------------------- */

export default function DossiersArchive({
  sessions,
  onOpenSession,
  onDeleteSession,
  onDownloadPdf,
}: DossiersArchiveProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [pdfPending, setPdfPending] = useState<ReadonlySet<string>>(() => new Set());
  const [announcement, setAnnouncement] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocus = useRef<string | null>(null);

  const deferredQuery = useDeferredValue(query);

  /* ---- derived data ---- */
  const all = useMemo(() => sessions.map(buildItem), [sessions]);
  const totalReports = useMemo(
    () => all.reduce((sum, it) => sum + it.reportCount, 0),
    [all]
  );

  const searched = useMemo(() => {
    const tokens = deferredQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return all;
    return all.filter((it) => tokens.every((t) => it.haystack.includes(t)));
  }, [all, deferredQuery]);

  const withReports = useMemo(
    () => searched.filter((it) => it.reportCount > 0),
    [searched]
  );
  const visible = filter === "reports" ? withReports : searched;

  const filtering = query.trim() !== "" || filter !== "all";
  const activeConfirmId = visible.some((it) => it.session.id === confirmingId)
    ? confirmingId
    : null;

  /* ---- focus restore after cancelling a delete ---- */
  useEffect(() => {
    if (confirmingId !== null) return;
    const id = pendingFocus.current;
    if (!id) return;
    pendingFocus.current = null;
    triggerRefs.current.get(id)?.focus();
  }, [confirmingId]);

  /* ---- handlers ---- */
  const registerTrigger = useCallback((id: string, el: HTMLButtonElement | null) => {
    if (el) triggerRefs.current.set(id, el);
    else triggerRefs.current.delete(id);
  }, []);

  const askDelete = useCallback((id: string) => setConfirmingId(id), []);

  const cancelDelete = useCallback((id: string) => {
    pendingFocus.current = id;
    setConfirmingId(null);
  }, []);

  const confirmDelete = useCallback(
    (id: string, title: string) => {
      setConfirmingId(null);
      onDeleteSession(id);
      setAnnouncement(`Deleted “${title}”`);
      headingRef.current?.focus({ preventScroll: true });
    },
    [onDeleteSession]
  );

  const handlePdf = useCallback(
    async (id: string, filename: string) => {
      setPdfPending((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
      try {
        await onDownloadPdf(filename);
      } catch {
        /* App already shows the error toast; only local state here */
      } finally {
        setPdfPending((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [onDownloadPdf]
  );

  const clearSearch = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  /* ---- render ---- */
  return (
    <MotionConfig reducedMotion="user">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-8 sm:px-6">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              Library
            </p>
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-foreground outline-none sm:text-3xl"
            >
              Saved chats &amp; reports
            </h1>
            <p className="mt-1.5 font-mono text-xs tabular-nums text-muted-foreground">
              {plural(all.length, "chat", "chats")} ·{" "}
              {plural(totalReports, "report", "reports")}
            </p>
          </div>

          <div className="focus-ring-within flex h-10 w-full items-center gap-2 rounded-xl border border-border bg-card px-3 sm:w-72">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape" && query) {
                  e.preventDefault();
                  setQuery("");
                }
              }}
              placeholder="Search chats and topics…"
              aria-label="Search saved chats and reports"
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="search"
              className="min-w-0 flex-1 appearance-none bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground sm:text-sm [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="focus-ring -mr-1 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </header>

        {all.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              role="group"
              aria-label="Filter"
              className="inline-flex rounded-lg border border-border bg-sunk p-0.5"
            >
              <FilterButton
                active={filter === "all"}
                label="All"
                count={searched.length}
                onClick={() => setFilter("all")}
              />
              <FilterButton
                active={filter === "reports"}
                label="With reports"
                count={withReports.length}
                onClick={() => setFilter("reports")}
              />
            </div>

            <p
              role="status"
              className="font-mono text-xs tabular-nums text-muted-foreground"
            >
              {filtering ? `${visible.length} of ${all.length}` : ""}
            </p>
          </div>
        )}

        <p role="status" className="sr-only">
          {announcement}
        </p>

        {all.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
            <p className="text-sm font-medium text-foreground">No saved chats yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Run a question in the workbench and it will show up here automatically.
            </p>
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
            <p className="text-sm font-medium text-foreground">No matches</p>
            <p className="mx-auto mt-1 max-w-sm break-words text-xs text-muted-foreground">
              {query.trim()
                ? `Nothing matches “${query.trim()}”${filter === "reports" ? " among chats with reports" : ""}.`
                : "None of your chats have a research report yet."}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {query && (
                <button type="button" onClick={clearSearch} className={ACTION_BTN}>
                  Clear search
                </button>
              )}
              {filter !== "all" && (
                <button type="button" onClick={() => setFilter("all")} className={ACTION_BTN}>
                  Show all
                </button>
              )}
            </div>
          </div>
        ) : (
          <ul className="relative grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence initial={false} mode="popLayout">
              {visible.map((item) => (
                <motion.li
                  key={item.session.id}
                  layout="position"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: EASE }}
                  className="min-w-0"
                >
                  <ItemCard
                    item={item}
                    confirming={activeConfirmId === item.session.id}
                    pdfPending={pdfPending.has(item.session.id)}
                    onOpen={onOpenSession}
                    onAskDelete={askDelete}
                    onCancelDelete={cancelDelete}
                    onConfirmDelete={confirmDelete}
                    onPdf={handlePdf}
                    registerTrigger={registerTrigger}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>
    </MotionConfig>
  );
}
