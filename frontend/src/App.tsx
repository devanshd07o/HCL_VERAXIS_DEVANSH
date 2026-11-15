import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import WorkspaceTopBar from "@/components/workbench/WorkspaceTopBar";
import SessionRail from "@/components/workbench/SessionRail";
import ChatWorkspace, {
  type AttachedDoc,
  type ChatMessageRecord,
} from "@/components/workbench/ChatWorkspace";
import DossiersArchive, {
  type ArchivedSession,
} from "@/components/workbench/DossiersArchive";
import VaultSettings from "@/components/workbench/VaultSettings";
import type { ContextSegment } from "@/components/registry/ai-context-meter";
import { applyThemePreset, getStoredThemePreset } from "@/lib/theme-presets";
import { getApiUrl } from "@/lib/api";

/* ==========================================================================
   Constants & types
   ========================================================================== */

const SESSIONS_KEY = "veraxis_sessions";
const ACTIVE_SESSION_KEY = "veraxis-active-session";
const THEME_KEY = "veraxis-theme";
const FONT_FAMILY_KEY = "veraxis-font-family";
const FONT_SIZE_KEY = "veraxis-font-size";
const GROQ_KEY = "veraxis_user_groq_key";

const DESKTOP_QUERY = "(min-width: 1024px)";
const STATUS_POLL_MS = 60_000;
const NEW_INQUIRY_TITLE = "New Inquiry";

const FONT_MAP: Record<string, string> = {
  Roboto: "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif",
  Comfortaa: "'Comfortaa', cursive, sans-serif",
  Manrope: "'Manrope', -apple-system, sans-serif",
  "Bricolage Grotesque": "'Bricolage Grotesque', sans-serif",
  Inter: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

type Theme = "light" | "dark";
type QueryMode = "auto" | "fast" | "deep";
type ThinkingSteps = Array<{ agent?: string; step?: string }>;
type SourceItem = { title: string; url: string; badge?: string };

interface SessionState extends ArchivedSession {
  messages: ChatMessageRecord[];
}

interface SendOptions {
  forceResearch?: boolean;
  modeOverride?: QueryMode;
  attachments?: AttachedDoc[];
}

interface DoneResult {
  content?: string;
  type?: "chat" | "research" | "error";
  sources?: ChatMessageRecord["sources"];
  pdf_filename?: string | null;
  topic?: string | null;
  trace?: ChatMessageRecord["trace"];
}

type ServerEvent =
  | { event: "status"; phase?: string; label?: string; progress?: number }
  | { event: "sources"; topic?: string; sources?: SourceItem[] }
  | { event: "delta"; role?: "chat" | "research"; delta?: string }
  | { event: "chunk"; content?: string }
  | { event: "trace"; trace?: unknown }
  | { event: "done"; result?: DoneResult }
  | { event: "error"; message?: string };

/* ==========================================================================
   Helpers (storage, sessions, SSE)
   ========================================================================== */

const storage = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* restricted storage or quota */
    }
  },
  remove(key: string) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* restricted storage */
    }
  },
};

const normalizeMessages = (list: unknown): ChatMessageRecord[] =>
  Array.isArray(list)
    ? list.map((m: ChatMessageRecord) => ({ ...m, isStreaming: false }))
    : [];

const isSession = (value: unknown): value is SessionState =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as { id?: unknown }).id === "string";

const normalizeSession = (s: SessionState): SessionState => ({
  ...s,
  messages: normalizeMessages(s.messages),
});

function loadBoot() {
  let sessions: SessionState[] = [];
  const raw = storage.get(SESSIONS_KEY);
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        sessions = parsed.filter(isSession).map(normalizeSession);
      }
    } catch {
      sessions = [];
    }
  }
  const activeId = storage.get(ACTIVE_SESSION_KEY);
  const active = activeId ? sessions.find((s) => s.id === activeId) : undefined;
  return {
    sessions,
    activeId: active?.id ?? null,
    messages: active?.messages ?? [],
    title: active ? active.title || "Research Dossier" : NEW_INQUIRY_TITLE,
  };
}

const deriveTitle = (text: string, words: string[]) =>
  words.length >= 3
    ? words
        .slice(0, 4)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ")
    : text.slice(0, 60);

const buildHistory = (list: ChatMessageRecord[]) =>
  list
    .filter((m) => m.type !== "error" && (m.content || "").trim())
    .slice(-8)
    .map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("assistant" as const),
      content: m.content.slice(0, 1800),
    }));

const upsertMessage = (list: ChatMessageRecord[], msg: ChatMessageRecord) =>
  list.some((m) => m.id === msg.id)
    ? list.map((m) => (m.id === msg.id ? msg : m))
    : [...list, msg];

interface LiveState {
  type: "chat" | "research";
  topic: string;
  sources: SourceItem[];
  content: string;
  trace: ChatMessageRecord["trace"];
  steps: ThinkingSteps | null;
}

const toBotMessage = (
  live: LiveState,
  id: string,
  streaming: boolean,
  duration?: string
): ChatMessageRecord => ({
  id,
  role: "bot",
  type: live.type,
  topic: live.type === "research" ? live.topic : undefined,
  sources: live.type === "research" ? live.sources : [],
  content: live.content,
  thinkingSteps: live.steps,
  trace: live.trace,
  isStreaming: streaming,
  ...(duration ? { duration } : {}),
});

async function readErrorDetail(res: Response): Promise<string> {
  try {
    const body = await res.json();
    const detail = body?.detail;
    if (typeof detail === "string" && detail) return detail;
    if (detail) return JSON.stringify(detail).slice(0, 200);
  } catch {
    /* non-JSON error body */
  }
  return `Server responded ${res.status}`;
}

/** Parses an SSE byte stream into JSON events. Handles CRLF, split chunks,
 *  multi-line data fields, comment/keep-alive lines and a trailing block. */
async function* readSSE(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<ServerEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const parseBlock = (block: string): ServerEvent | null => {
    const data = block
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).replace(/^ /, ""))
      .join("\n");
    if (!data) return null;
    try {
      const parsed: unknown = JSON.parse(data);
      if (
        parsed &&
        typeof parsed === "object" &&
        typeof (parsed as { event?: unknown }).event === "string"
      ) {
        return parsed as ServerEvent;
      }
    } catch {
      /* ignore malformed frame */
    }
    return null;
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (value) buffer += decoder.decode(value, { stream: !done });
      if (done) buffer += decoder.decode();

      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = done ? "" : blocks.pop() ?? "";

      for (const block of blocks) {
        const evt = parseBlock(block);
        if (evt) yield evt;
      }
      if (done) return;
    }
  } finally {
    void reader.cancel().catch(() => {});
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ==========================================================================
   Hooks & small UI
   ========================================================================== */

function subscribeDesktop(cb: () => void) {
  const mq = window.matchMedia(DESKTOP_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getDesktop = () => window.matchMedia(DESKTOP_QUERY).matches;

function useIsDesktop() {
  return useSyncExternalStore(subscribeDesktop, getDesktop, () => true);
}

type ToastKind = "error" | "warning" | "info";
interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
}

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, number>());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (kind: ToastKind, message: string) => {
      const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-2), { id, kind, message }]);
      timers.current.set(
        id,
        window.setTimeout(() => dismiss(id), 5000)
      );
    },
    [dismiss]
  );

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => window.clearTimeout(t));
  }, []);

  return { toasts, notify, dismiss };
}

const TOAST_DOT: Record<ToastKind, string> = {
  error: "bg-danger",
  warning: "bg-warning",
  info: "bg-info",
};

function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto flex w-full max-w-sm animate-enter items-start gap-3 rounded-lg border border-border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-[var(--elev-2)]"
        >
          <span
            aria-hidden
            className={`mt-1.5 size-2 shrink-0 rounded-full ${TOAST_DOT[t.kind]}`}
          />
          <p className="min-w-0 flex-1 leading-snug">{t.message}</p>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss notification"
            className="focus-ring -m-1 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ==========================================================================
   App
   ========================================================================== */

export default function App() {
  const pathname = usePathname();
  const isDesktop = useIsDesktop();
  const { toasts, notify, dismiss } = useToasts();

  const [boot] = useState(loadBoot);

  /* ---------- Appearance ---------- */
  const [theme, setTheme] = useState<Theme>(() =>
    storage.get(THEME_KEY) === "light" ? "light" : "dark"
  );
  const [fontFamily, setFontFamily] = useState(
    () => storage.get(FONT_FAMILY_KEY) || "Roboto"
  );
  const [fontSize, setFontSize] = useState(
    () => storage.get(FONT_SIZE_KEY) || "16px"
  );

  /* ---------- Layout ---------- */
  const [railOpen, setRailOpen] = useState(false);

  /* ---------- PWA Install Prompt Listener ---------- */
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      (window as unknown as { __veraxisInstallPrompt?: Event }).__veraxisInstallPrompt = e;
      window.dispatchEvent(new CustomEvent("veraxis-install-available"));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  /* ---------- Sessions & chat ---------- */
  const [sessions, setSessions] = useState<SessionState[]>(boot.sessions);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    boot.activeId
  );
  const [messages, setMessages] = useState<ChatMessageRecord[]>(boot.messages);
  const [chatTitle, setChatTitle] = useState(boot.title);

  const [researchPriority, setResearchPriority] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [livePhase, setLivePhase] = useState("");
  const [livePhaseLabel, setLivePhaseLabel] = useState("");
  const [activeThinkingSteps, setActiveThinkingSteps] =
    useState<ThinkingSteps | null>(null);
  const [telemetry, setTelemetry] = useState({ activeKeys: 0, totalKeys: 0 });

  /* Refs always hold the latest value, so long-running streams never
     write back stale state. */
  const sessionsRef = useRef(boot.sessions);
  const messagesRef = useRef(boot.messages);
  const currentSessionIdRef = useRef<string | null>(boot.activeId);
  const abortControllerRef = useRef<AbortController | null>(null);
  const syncTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  /* ---------- Appearance effects ---------- */
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.classList.toggle("dark", theme === "dark");
    storage.set(THEME_KEY, theme);
    const presetId = getStoredThemePreset(theme);
    applyThemePreset(presetId, theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    const stack = FONT_MAP[fontFamily] || FONT_MAP.Manrope;
    root.style.setProperty("--font-family", stack);
    root.style.setProperty("--font-sans", stack);
    root.style.setProperty("--base-font-size", fontSize);
    storage.set(FONT_FAMILY_KEY, fontFamily);
    storage.set(FONT_SIZE_KEY, fontSize);
  }, [fontFamily, fontSize]);

  useEffect(() => {
    if (currentSessionId) storage.set(ACTIVE_SESSION_KEY, currentSessionId);
    else storage.remove(ACTIVE_SESSION_KEY);
  }, [currentSessionId]);

  /* ---------- Rail: breakpoint + keyboard ---------- */

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setRailOpen((v) => !v);
        return;
      }
      if (e.key === "Escape" && !isDesktop && railOpen) setRailOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDesktop, railOpen]);

  const closeRailOnMobile = useCallback(() => {
    if (!isDesktop) setRailOpen(false);
  }, [isDesktop]);

  /* ---------- Navigation ---------- */
  const navigate = useCallback((route: string) => {
    const normalized = `#${route}`;
    if (window.location.hash !== normalized) {
      window.history.replaceState(null, "", normalized);
    }
    window.dispatchEvent(new CustomEvent("veraxis:nav", { detail: route }));
  }, []);

  /* ---------- Session store ---------- */
  const activate = useCallback((id: string | null) => {
    currentSessionIdRef.current = id;
    setCurrentSessionId(id);
  }, []);

  const scheduleRemoteSync = useCallback(() => {
    window.clearTimeout(syncTimerRef.current);
    syncTimerRef.current = window.setTimeout(() => {
      fetch(getApiUrl("/sessions"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionsRef.current),
      }).catch(() => {});
    }, 400);
  }, []);

  const commitSessions = useCallback(
    (
      updater: (prev: SessionState[]) => SessionState[],
      opts?: { remote?: boolean }
    ) => {
      const next = updater(sessionsRef.current);
      sessionsRef.current = next;
      setSessions(next);
      storage.set(SESSIONS_KEY, JSON.stringify(next));
      if (opts?.remote !== false) scheduleRemoteSync();
    },
    [scheduleRemoteSync]
  );

  /** Writes a finished message list into a session (never re-creates a
   *  deleted one) and updates the visible chat only if it is still open. */
  const finalizeRun = useCallback(
    (sessionId: string, next: ChatMessageRecord[], rollingSummary?: string) => {
      commitSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, messages: next, ...(rollingSummary ? { rolling_summary: rollingSummary } : {}) }
            : s
        )
      );
      if (currentSessionIdRef.current === sessionId) setMessages(next);
    },
    [commitSessions]
  );

  const requestTitle = useCallback(
    async (sessionId: string, list: ChatMessageRecord[]) => {
      try {
        const res = await fetch(getApiUrl("/api/title"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: list }),
        });
        if (!res.ok) return;
        const data = await res.json();
        const title = typeof data?.title === "string" ? data.title.trim() : "";
        if (!title || title === "Research Inquiry") return;
        commitSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, title } : s))
        );
        if (currentSessionIdRef.current === sessionId) setChatTitle(title);
      } catch {
        /* title is cosmetic */
      }
    },
    [commitSessions]
  );

  /* ---------- Boot: telemetry polling ---------- */
  useEffect(() => {
    let cancelled = false;
    let warned = false;
    const ctrl = new AbortController();

    const poll = async () => {
      try {
        const res = await fetch(getApiUrl("/api/status"), { signal: ctrl.signal });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        if (cancelled || !data?.telemetry) return;
        setTelemetry({
          activeKeys: data.telemetry.active_keys ?? 0,
          totalKeys: data.telemetry.total_keys ?? 0,
        });
        warned = false;
      } catch {
        if (cancelled || ctrl.signal.aborted || warned) return;
        warned = true;
        notify("warning", "Backend telemetry is unreachable.");
      }
    };

    void poll();
    const id = window.setInterval(() => {
      if (!document.hidden) void poll();
    }, STATUS_POLL_MS);

    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearInterval(id);
    };
  }, [notify]);

  /* ---------- Boot: server session hydration ---------- */
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(getApiUrl("/sessions"), { signal: ctrl.signal });
        if (!res.ok) return;
        const data: unknown = await res.json();
        if (
          !Array.isArray(data) ||
          data.length === 0 ||
          sessionsRef.current.length > 0
        ) {
          return;
        }
        const hydrated = data.filter(isSession).map(normalizeSession);
        if (hydrated.length === 0) return;
        commitSessions(() => hydrated, { remote: false });
        if (!currentSessionIdRef.current && !abortControllerRef.current) {
          const first = hydrated[0];
          activate(first.id);
          setChatTitle(first.title || "Research Dossier");
          setMessages(first.messages);
        }
      } catch {
        /* offline: local sessions remain the source of truth */
      }
    })();
    return () => ctrl.abort();
  }, [commitSessions, activate]);

  /* ---------- Session actions ---------- */
  const cancelActive = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
    setLivePhase("");
    setLivePhaseLabel("");
  }, []);

  const handleNewInquiry = useCallback(() => {
    cancelActive();
    activate(null);
    setMessages([]);
    setChatTitle(NEW_INQUIRY_TITLE);
    setActiveThinkingSteps(null);
    navigate("/");
    closeRailOnMobile();
  }, [cancelActive, activate, navigate, closeRailOnMobile]);

  const handleSelectSession = useCallback(
    (id: string) => {
      const found = sessionsRef.current.find((s) => s.id === id);
      if (!found) return;
      cancelActive();
      activate(id);
      setChatTitle(found.title || "Research Dossier");
      setMessages(normalizeMessages(found.messages));
      setActiveThinkingSteps(null);
      navigate("/");
      closeRailOnMobile();
    },
    [cancelActive, activate, navigate, closeRailOnMobile]
  );

  const handleDeleteSession = useCallback(
    (id: string) => {
      if (currentSessionIdRef.current === id) {
        cancelActive();
        activate(null);
        setMessages([]);
        setChatTitle(NEW_INQUIRY_TITLE);
        setActiveThinkingSteps(null);
      }
      commitSessions((prev) => prev.filter((s) => s.id !== id));
    },
    [cancelActive, activate, commitSessions]
  );

  const handleStopQuery = useCallback(() => {
    cancelActive();
  }, [cancelActive]);

  /* ---------- Query execution (SSE) ---------- */
  const handleSendQuery = useCallback(
    async (rawText: string, options?: SendOptions) => {
      const text = rawText.trim();
      if (!text || abortControllerRef.current) return;

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const startMs = Date.now();
      const elapsed = () => `${((Date.now() - startMs) / 1000).toFixed(1)}s`;
      const words = text.split(/\s+/).filter(Boolean);

      /* Session bootstrap */
      const priorMessages = messagesRef.current;
      const history = buildHistory(priorMessages);
      const userMsg: ChatMessageRecord = {
        id: `u-${startMs}`,
        role: "user",
        content: text,
        type: "chat",
      };
      const baseMessages = [...priorMessages, userMsg];

      const sessionId = currentSessionIdRef.current ?? `sess-${startMs}`;
      const existing = sessionsRef.current.find((s) => s.id === sessionId);
      const title =
        existing && priorMessages.length > 0
          ? existing.title || "Research Dossier"
          : deriveTitle(text, words);

      commitSessions((prev) =>
        existing
          ? prev.map((s) =>
              s.id === sessionId ? { ...s, title, messages: baseMessages } : s
            )
          : [
              {
                id: sessionId,
                title,
                createdAt: new Date().toISOString(),
                messages: baseMessages,
              },
              ...prev,
            ]
      );
      activate(sessionId);
      setChatTitle(title);
      setMessages(baseMessages);
      setIsLoading(true);
      setActiveThinkingSteps(null);
      setLivePhase("classify");
      setLivePhaseLabel("Classifying inquiry intent...");

      /* Live assistant message, painted at most once per frame */
      const liveBotId = `b-${startMs}`;
      const live: LiveState = {
        type: "research",
        topic: text,
        sources: [],
        content: "",
        trace: undefined,
        steps: null,
      };
      let visible = false;
      let raf = 0;

      const paint = () => {
        raf = 0;
        if (currentSessionIdRef.current !== sessionId) return;
        const msg = toBotMessage(live, liveBotId, true);
        setMessages((prev) => upsertMessage(prev, msg));
      };
      const schedule = () => {
        if (!raf) raf = window.requestAnimationFrame(paint);
      };
      const show = () => {
        visible = true;
        schedule();
      };
      const cancelPaint = () => {
        if (raf) window.cancelAnimationFrame(raf);
        raf = 0;
      };

      try {
        /* Request shape */
        const priority = options?.forceResearch ?? researchPriority;
        const override = options?.modeOverride;
        const wantsResearch = priority && words.length > 2;
        const isAcademic =
          override === "deep" ||
          wantsResearch ||
          /^\/(research|paper)\b/i.test(text);
        const mode: QueryMode = override ?? "auto";
        const forceResearch =
          override === "fast" ? false : override === "deep" ? true : wantsResearch;

        let latestRollingSummary: string | undefined = existing?.rolling_summary;

        const res = await fetch(getApiUrl("/api/chat/stream"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            query: text,
            mode,
            force_research: forceResearch,
            research_mode: isAcademic,
            history,
            attachments: options?.attachments || [],
            user_groq_key: storage.get(GROQ_KEY) || undefined,
            user_gemini_key: storage.get("veraxis_gemini_key") || undefined,
            session_id: sessionId,
            rolling_summary: existing?.rolling_summary || undefined,
          }),
        });

        if (!res.ok || !res.body) throw new Error(await readErrorDetail(res));

        let finalResult: ChatMessageRecord | null = null;

        for await (const evt of readSSE(res.body)) {
          if (controller.signal.aborted) break;

          switch (evt.event) {
            case "status":
              setLivePhase(String(evt.phase || ""));
              setLivePhaseLabel(String(evt.label || ""));
              break;

            case "sources":
              live.type = "research";
              live.topic = evt.topic || text;
              live.sources = Array.isArray(evt.sources) ? evt.sources : [];
              show();
              break;

            case "delta":
              live.type = evt.role === "research" ? "research" : "chat";
              live.content += evt.delta ?? "";
              show();
              break;

            case "chunk":
              live.content = evt.content ?? "";
              show();
              break;

            case "trace":
              live.trace = evt.trace as ChatMessageRecord["trace"];
              show();
              break;

            case "error":
              throw new Error(evt.message || "Streaming error");

            case "done": {
              const r = evt.result;
              if (!r) break;
              if (r.rolling_summary) {
                latestRollingSummary = String(r.rolling_summary);
              }
              finalResult = {
                id: liveBotId,
                role: "bot",
                content: String(r.content || live.content || ""),
                type: r.type || live.type,
                sources: r.sources || [],
                pdf_filename: r.pdf_filename || null,
                topic: r.topic || null,
                thinkingSteps: live.steps,
                duration: elapsed(),
                isStreaming: false,
                trace: r.trace || live.trace,
              };
              break;
            }
          }

          if (finalResult) break;
        }

        if (controller.signal.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }

        cancelPaint();

        if (!finalResult) {
          if (!live.content) {
            throw new Error("Stream ended before response completed.");
          }
          finalResult = toBotMessage(live, liveBotId, false, elapsed());
        }

        const completed = [...baseMessages, finalResult];
        finalizeRun(sessionId, completed, latestRollingSummary);

        if (
          completed.length >= 2 &&
          completed.length <= 4 &&
          finalResult.type !== "error"
        ) {
          void requestTitle(sessionId, completed);
        }
      } catch (err) {
        cancelPaint();

        const partial = live.content
          ? toBotMessage(live, liveBotId, false, elapsed())
          : null;

        if (controller.signal.aborted) {
          if (partial) {
            finalizeRun(sessionId, [...baseMessages, partial]);
          } else if (currentSessionIdRef.current === sessionId) {
            setMessages(baseMessages);
          }
          return;
        }

        const message = err instanceof Error ? err.message : "Request failed";
        const errorMsg: ChatMessageRecord = {
          id: `e-${Date.now()}`,
          role: "bot",
          content: `Execution error: ${message}`,
          type: "error",
        };
        finalizeRun(sessionId, [
          ...baseMessages,
          ...(partial ? [partial] : []),
          errorMsg,
        ]);
      } finally {
        cancelPaint();
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
          setIsLoading(false);
          setLivePhase("");
          setLivePhaseLabel("");
        }
      }
    },
    [researchPriority, commitSessions, activate, finalizeRun, requestTitle]
  );

  /* ---------- PDF download ---------- */
  const handleDownloadPdf = useCallback(
    async (filename: string) => {
      try {
        const res = await fetch(
          getApiUrl(`/api/download-pdf/${encodeURIComponent(filename)}`)
        );
        if (!res.ok) throw new Error(`PDF download failed (${res.status})`);
        triggerDownload(await res.blob(), filename);
      } catch (err) {
        notify(
          "error",
          err instanceof Error ? err.message : "PDF download failed."
        );
        throw err;
      }
    },
    [notify]
  );

  /* ---------- Derived ---------- */
  const contextSegments: ContextSegment[] = useMemo(() => {
    let dialogueChars = 0;
    let sourcesChars = 0;
    for (const m of messages) {
      dialogueChars += (m.content || "").length;
      for (const s of m.sources || []) {
        sourcesChars += (s.title || "").length + (s.url || "").length;
      }
    }
    return [
      { id: "sys", label: "System Prompts", tokens: 650, color: "bg-zinc-500" },
      {
        id: "src",
        label: "Retrieved Citations",
        tokens: Math.ceil(sourcesChars / 4),
        color: "bg-primary/70",
      },
      {
        id: "msg",
        label: "Active Dialogue",
        tokens: Math.ceil(dialogueChars / 4),
        color: "bg-primary",
      },
    ];
  }, [messages]);

  const recentSession = useMemo(() => {
    const first = sessions[0];
    return first
      ? { id: first.id, title: first.title || "Untitled inquiry" }
      : null;
  }, [sessions]);

  /* ---- Report Inspector open state & presence ---- */
  const [inspectorOpen, setInspectorOpen] = useState(false);

  const hasReport = useMemo(() => {
    return (
      messages.some((m) => m.type === "research") ||
      Boolean(isLoading && activeThinkingSteps && activeThinkingSteps.length > 0)
    );
  }, [messages, isLoading, activeThinkingSteps]);

  const reportSourcesCount = useMemo(() => {
    const latestResearch = [...messages].reverse().find((m) => m.type === "research");
    return latestResearch?.sources?.length ?? 0;
  }, [messages]);

  /* ---------- Render ---------- */
  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-background text-foreground">
      <WorkspaceTopBar
        theme={theme}
        onThemeChange={setTheme}
        onNewInquiry={handleNewInquiry}
        onToggleRail={() => setRailOpen((v) => !v)}
        railOpen={railOpen}
        hasReport={hasReport}
        inspectorOpen={inspectorOpen}
        onToggleInspector={() => setInspectorOpen((v) => !v)}
        reportSourcesCount={reportSourcesCount}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <SessionRail
          open={railOpen}
          onCloseMobile={() => setRailOpen(false)}
          sessions={sessions}
          activeSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          onNewInquiry={handleNewInquiry}
          onOpenVault={() => {
            navigate("/vault");
            closeRailOnMobile();
          }}
          telemetry={telemetry}
        />

        <main
          id="workspace"
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto"
        >
          {pathname === "/dossiers" ? (
            <DossiersArchive
              sessions={sessions}
              onOpenSession={handleSelectSession}
              onDeleteSession={handleDeleteSession}
              onDownloadPdf={handleDownloadPdf}
            />
          ) : (
            <ChatWorkspace
              theme={theme}
              messages={messages}
              recentSession={recentSession}
              onOpenRecentSession={handleSelectSession}
              isLoading={isLoading}
              researchPriority={researchPriority}
              onToggleResearchPriority={setResearchPriority}
              activeThinkingSteps={activeThinkingSteps}
              livePhase={livePhase}
              livePhaseLabel={livePhaseLabel}
              contextSegments={contextSegments}
              onSendQuery={handleSendQuery}
              onStopQuery={handleStopQuery}
              onDownloadPdf={handleDownloadPdf}
              inspectorOpen={inspectorOpen}
              onToggleInspector={() => setInspectorOpen((v) => !v)}
              onSetInspectorOpen={setInspectorOpen}
            />
          )}
        </main>
      </div>

      {/* Centered Settings Dialog */}
      {pathname === "/vault" && (
        <VaultSettings
          theme={theme}
          onThemeChange={setTheme}
          fontFamily={fontFamily}
          onFontFamilyChange={setFontFamily}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          onTelemetrySync={setTelemetry}
          onClose={() => navigate("/")}
        />
      )}

      <Toaster toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
