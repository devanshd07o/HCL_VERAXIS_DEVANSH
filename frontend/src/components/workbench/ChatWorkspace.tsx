import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ClipboardEvent as ReactClipboardEvent,
  type Dispatch,
  type DragEvent as ReactDragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefObject,
  type SetStateAction,
} from "react";
import DOMPurify from "dompurify";
import { getApiUrl } from "@/lib/api";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Atom,
  BookOpen,
  Brain,
  Check,
  ChevronDown,
  Copy,
  Cpu,
  Dna,
  FileDown,
  FileText,
  Flame,
  History,
  Hourglass,
  Leaf,
  Loader2,
  Mic,
  Microscope,
  Orbit,
  PanelRightOpen,
  Paperclip,
  ShieldCheck,
  Sparkles,
  Square,
  Telescope,
  TriangleAlert,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ContextSegment } from "@/components/registry/ai-context-meter";
import VoiceBridge from "./VoiceBridge";
import VerifiedSourceCard from "./VerifiedSourceCard";
import ReportInspector, {
  type SourceItem,
  type ThinkingStepItem,
} from "./ReportInspector";
import {
  injectTypewriterFrontier,
  renderMarkdownWithKaTeX,
} from "@/lib/markdown";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Public types (contract with App.tsx)                                      */
/* -------------------------------------------------------------------------- */

export interface AttachedDoc {
  name: string;
  content: string;
}

export interface ChatMessageRecord {
  id: string;
  role: "user" | "bot";
  content: string;
  type?: "chat" | "research" | "error";
  sources?: SourceItem[];
  pdf_filename?: string | null;
  topic?: string | null;
  thinkingSteps?: ThinkingStepItem[] | null;
  duration?: string;
  isStreaming?: boolean;
  trace?: {
    queried: string[];
    fetched: number;
    after_dedup: number;
    after_filter: number;
    cited: number;
  };
}

interface ChatWorkspaceProps {
  theme?: "light" | "dark";
  messages: ChatMessageRecord[];
  recentSession?: { id: string; title: string } | null;
  onOpenRecentSession?: (id: string) => void;
  isLoading: boolean;
  researchPriority: boolean;
  onToggleResearchPriority: (next: boolean) => void;
  activeThinkingSteps: ThinkingStepItem[] | null;
  livePhase: string;
  livePhaseLabel: string;
  contextSegments: ContextSegment[];
  onSendQuery: (
    text: string,
    options?: {
      forceResearch?: boolean;
      modeOverride?: "auto" | "fast" | "deep";
      attachments?: AttachedDoc[];
    }
  ) => Promise<void>;
  onStopQuery: () => void;
  onDownloadPdf: (filename: string) => Promise<void>;
  inspectorOpen?: boolean;
  onToggleInspector?: () => void;
  onSetInspectorOpen?: (open: boolean) => void;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const EASE = [0.22, 1, 0.36, 1] as const;
const ACCENT_TEXT = "text-[var(--primary-text)]";
const ACCENT_SOFT =
  "border-[var(--primary-soft-border)] bg-[var(--primary-soft)] text-[var(--primary-text)]";

const ACTION_BTN =
  "focus-ring inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-secondary px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50";

const TOOL_BTN =
  "focus-ring inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40 sm:size-8";

const STAGES = [
  { key: "classify", label: "Classify", hint: "Understanding the question" },
  { key: "rephrase", label: "Scope", hint: "Scoping the topic" },
  { key: "discovery", label: "Discover", hint: "Searching literature" },
  { key: "analyst", label: "Synthesize", hint: "Synthesizing findings" },
  { key: "auditor", label: "Verify", hint: "Fact-checking claims" },
  { key: "director", label: "Compose", hint: "Composing the dossier" },
  { key: "pdf", label: "PDF", hint: "Rendering PDF" },
] as const;

const TEXT_EXTENSIONS = new Set([
  "txt", "md", "markdown", "csv", "json", "py", "ts", "tsx", "js", "jsx",
  "log", "yaml", "yml", "xml", "tex",
]);
const FILE_ACCEPT =
  ".txt,.md,.markdown,.csv,.json,.py,.ts,.tsx,.js,.jsx,.log,.yaml,.yml,.xml,.tex,text/*";
const MAX_FILES = 5;
const MAX_FILE_BYTES = 512_000;
const MAX_DOC_CHARS = 6000;
const LEDGER_PREVIEW = 6;
const NEAR_BOTTOM_PX = 140;

interface BrainstormPrompt {
  id: string;
  topic: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
}

const BRAINSTORM_POOL: BrainstormPrompt[] = [
  {
    id: "solid-state",
    topic: "Solid-state battery limits",
    category: "Materials",
    icon: Zap,
  },
  {
    id: "ssm-transformers",
    topic: "Transformers vs State-Space",
    category: "AI Architecture",
    icon: Cpu,
  },
  {
    id: "crispr-prime",
    topic: "CRISPR vs Prime Editing",
    category: "Genomics",
    icon: Dna,
  },
  {
    id: "superconductors",
    topic: "Room-Temp Superconductors",
    category: "Physics",
    icon: Atom,
  },
  {
    id: "neural-entrainment",
    topic: "Memory Phase Coupling",
    category: "Neuroscience",
    icon: Brain,
  },
  {
    id: "fusion-confinement",
    topic: "Magnetic Fusion Mirrors",
    category: "Energy",
    icon: Flame,
  },
  {
    id: "optical-computing",
    topic: "Photonic Tensor Cores",
    category: "Optics",
    icon: Sparkles,
  },
  {
    id: "carbon-capture",
    topic: "MOF Direct Air Capture",
    category: "Climate",
    icon: Leaf,
  },
  {
    id: "quantum-majorana",
    topic: "Majorana Zero Modes",
    category: "Quantum",
    icon: Orbit,
  },
  {
    id: "cellular-rejuvenation",
    topic: "Yamanaka Factor Reset",
    category: "Longevity",
    icon: Hourglass,
  },
  {
    id: "fast-radio-bursts",
    topic: "Fast Radio Burst Origins",
    category: "Astrophysics",
    icon: Telescope,
  },
  {
    id: "mrna-vaccines",
    topic: "mRNA Adjuvant Kinetics",
    category: "Immunology",
    icon: ShieldCheck,
  },
];

const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  materials: Zap,
  "ai architecture": Cpu,
  genomics: Dna,
  physics: Atom,
  neuroscience: Brain,
  energy: Flame,
  optics: Sparkles,
  climate: Leaf,
  quantum: Orbit,
  longevity: Hourglass,
  astrophysics: Telescope,
  immunology: ShieldCheck,
};

function renderSafeSvgIcon(icon: unknown, category?: string) {
  if (typeof icon === "function" || (typeof icon === "object" && icon !== null && "$$typeof" in icon)) {
    const IconComponent = icon as React.ComponentType<{ className?: string }>;
    return <IconComponent className="size-4" />;
  }
  if (category) {
    const CatIcon = CATEGORY_ICON_MAP[category.toLowerCase().trim()];
    if (CatIcon) return <CatIcon className="size-4" />;
  }
  return <Sparkles className="size-4" />;
}

interface SlashCommand {
  id: "research" | "paper" | "enhance";
  label: string;
  description: string;
  icon: ReactNode;
}

const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: "research",
    label: "/research",
    description: "Deep literature review with verified sources",
    icon: <Microscope className="size-3.5" />,
  },
  {
    id: "paper",
    label: "/paper",
    description: "Literature synthesis with a methodology matrix",
    icon: <BookOpen className="size-3.5" />,
  },
  {
    id: "enhance",
    label: "/enhance",
    description: "Rewrite your prompt before sending",
    icon: <Wand2 className="size-3.5" />,
  },
];

interface ComposerDoc extends AttachedDoc {
  truncated: boolean;
}

interface Notice {
  tone: "info" | "error";
  text: string;
  undo?: () => void;
}

interface LiveInfo {
  phase: string;
  label: string;
  agent?: string;
  step?: string;
  startedAt: number | null;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function getScroller(): HTMLElement | null {
  return typeof document === "undefined"
    ? null
    : document.getElementById("workspace");
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  } catch {
    /* clipboard unavailable */
  }
}

async function readTextAttachments(
  files: File[]
): Promise<{ docs: ComposerDoc[]; skipped: string[] }> {
  const docs: ComposerDoc[] = [];
  const skipped: string[] = [];

  for (const file of files) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const textLike =
      file.type.startsWith("text/") ||
      file.type === "application/json" ||
      TEXT_EXTENSIONS.has(ext);

    if (!textLike || file.size > MAX_FILE_BYTES) {
      skipped.push(file.name);
      continue;
    }
    try {
      const text = await file.text();
      if (!text.trim()) {
        skipped.push(file.name);
        continue;
      }
      docs.push({
        name: file.name,
        content: text.slice(0, MAX_DOC_CHARS),
        truncated: text.length > MAX_DOC_CHARS,
      });
    } catch {
      skipped.push(file.name);
    }
  }
  return { docs, skipped };
}

function renderProse(content: string, streaming: boolean): string {
  const raw = renderMarkdownWithKaTeX(content, streaming);
  return DOMPurify.sanitize(streaming ? injectTypewriterFrontier(raw) : raw);
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Scroll to + briefly ring a reference target inside `root`. */
function flashRef(root: ParentNode, id: string): boolean {
  const el = root.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
  if (!el) return false;
  el.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "center",
  });
  const cls = ["ring-2", "ring-primary", "ring-offset-2", "ring-offset-card", "rounded-md"];
  el.classList.add(...cls);
  window.setTimeout(() => el.classList.remove(...cls), 1800);
  return true;
}

/** Shared click delegation for rendered markdown (citations + code copy). */
async function handleProseClick(
  e: ReactMouseEvent<HTMLElement>,
  root: ParentNode,
  onSelectRef?: (refNum: string) => void
): Promise<void> {
  const target = e.target as HTMLElement;

  const refAnchor = target.closest<HTMLElement>('a[href^="#ref-"], .citation-pill');
  if (refAnchor) {
    e.preventDefault();
    const cite =
      refAnchor.getAttribute("data-cite") ||
      refAnchor.getAttribute("href")?.replace(/\D/g, "");
    if (cite && onSelectRef) {
      onSelectRef(cite);
      return;
    }
  }

  const btn = target.closest<HTMLElement>(".uv-code-copy-btn");
  if (!btn) return;
  const code = btn.getAttribute("data-code");
  if (!code) return;

  try {
    await copyToClipboard(decodeURIComponent(code));
    const label = btn.querySelector("span");
    if (label) {
      const original = label.textContent;
      label.textContent = "Copied";
      btn.classList.add("text-success", "border-success");
      window.setTimeout(() => {
        label.textContent = original;
        btn.classList.remove("text-success", "border-success");
      }, 1600);
    }
  } catch (err) {
    console.error("Failed to copy code block", err);
  }
}

/* -------------------------------------------------------------------------- */
/*  Hooks                                                                     */
/* -------------------------------------------------------------------------- */

function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (cb: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    [query]
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}

function useCopy(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = useCallback((text: string) => {
    void copyToClipboard(text).then(() => {
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1600);
    });
  }, []);
  return [copied, copy];
}

/** clientHeight of the #workspace scroller, so sticky panels fit exactly. */
function useWorkspaceHeight(): number | null {
  const [height, setHeight] = useState<number | null>(null);
  useEffect(() => {
    const el = getScroller();
    if (!el) return;
    const update = () => setHeight(el.clientHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return height;
}

/* -------------------------------------------------------------------------- */
/*  Small presentational pieces                                               */
/* -------------------------------------------------------------------------- */

function Reveal({
  animate,
  children,
}: {
  animate: boolean;
  children: ReactNode;
}) {
  if (!animate) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function PipelineProgress({
  phase,
  label,
  agent,
  step,
  startedAt,
  showStepper,
}: LiveInfo & { showStepper: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const stageIdx = STAGES.findIndex((s) => s.key === phase);
  const seconds =
    startedAt === null ? null : Math.max(0, Math.floor((now - startedAt) / 1000));
  const statusText =
    label || (stageIdx >= 0 ? STAGES[stageIdx].hint : "Working…");

  return (
    <div className="rounded-xl border border-border bg-sunk p-3.5">
      {showStepper && (
        <ol className="mb-3 grid grid-cols-7 gap-1.5" aria-label="Pipeline stages">
          {STAGES.map((s, i) => {
            const done = stageIdx > i;
            const running = stageIdx === i;
            return (
              <li
                key={s.key}
                className="min-w-0"
                aria-current={running ? "step" : undefined}
              >
                <div
                  className={cn(
                    "h-1 rounded-full transition-colors",
                    done && "bg-primary",
                    running && "animate-pulse bg-primary/60",
                    !done && !running && "bg-border"
                  )}
                />
                <span
                  className={cn(
                    "mt-1.5 hidden truncate font-mono text-[10px] uppercase tracking-wide sm:block",
                    running ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {s.label}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <div
        className="flex items-center gap-2 text-xs"
        role="status"
        aria-live="polite"
      >
        <span className="status-dot text-primary" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-foreground">
          {statusText}
        </span>
        {seconds !== null && (
          <span className="font-mono tabular-nums text-muted-foreground">
            {formatClock(seconds)}
          </span>
        )}
      </div>

      {step && (
        <p className="mt-1.5 truncate pl-4 font-mono text-[11px] text-muted-foreground">
          {agent ? `${agent} · ` : ""}
          {step}
        </p>
      )}
    </div>
  );
}

function TraceFunnel({
  trace,
}: {
  trace: NonNullable<ChatMessageRecord["trace"]>;
}) {
  const rows = [
    { label: "Retrieved", value: trace.fetched, accent: false },
    { label: "Unique", value: trace.after_dedup, accent: false },
    { label: "Relevant", value: trace.after_filter, accent: false },
    { label: "Cited", value: trace.cited, accent: true },
  ];
  const max = Math.max(trace.fetched, 1);
  const queried = trace.queried ?? [];

  return (
    <details className="group mt-6 rounded-xl border border-border bg-sunk">
      <summary className="focus-ring flex cursor-pointer list-none items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs [&::-webkit-details-marker]:hidden">
        <ShieldCheck className={cn("size-3.5 shrink-0", ACCENT_TEXT)} />
        <span className="font-medium text-foreground">Pipeline audit</span>
        <span className="min-w-0 flex-1 truncate font-mono tabular-nums text-muted-foreground">
          {trace.fetched} → {trace.after_dedup} → {trace.after_filter} →{" "}
          {trace.cited} cited
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>

      <div className="space-y-3 border-t border-border px-3.5 py-3">
        {queried.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">Queried</span>
            {queried.map((q) => (
              <span
                key={q}
                className="rounded-md border border-border bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-foreground"
              >
                {q}
              </span>
            ))}
          </div>
        )}
        <dl className="space-y-2">
          {rows.map((r) => (
            <div key={r.label} className="grid grid-cols-[5.5rem_1fr_2.5rem] items-center gap-2">
              <dt className="text-[11px] text-muted-foreground">{r.label}</dt>
              <dd className="h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className={cn("h-full rounded-full", r.accent ? "bg-primary" : "bg-muted-foreground/50")}
                  style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }}
                />
              </dd>
              <dd className="text-right font-mono text-[11px] tabular-nums text-foreground">
                {r.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </details>
  );
}

/* -------------------------------------------------------------------------- */
/*  Messages                                                                  */
/* -------------------------------------------------------------------------- */

const UserMessage = memo(function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-xs border border-border/80 bg-card px-4 py-2.5 text-[15px] font-medium leading-relaxed text-foreground shadow-xs">
        {content}
      </div>
    </div>
  );
});

const ErrorNote = memo(function ErrorNote({ content }: { content: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-foreground"
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
      <p className="min-w-0 break-words">{content}</p>
    </div>
  );
});

const ChatAnswer = memo(function ChatAnswer({
  msg,
  live,
  onSelectRef,
}: {
  msg: ChatMessageRecord;
  live: LiveInfo | null;
  onSelectRef?: (refNum: string) => void;
}) {
  const [copied, copy] = useCopy();
  const [thinkingOpen, setThinkingOpen] = useState(false);
  const html = useMemo(
    () => renderProse(msg.content, Boolean(msg.isStreaming)),
    [msg.content, msg.isStreaming]
  );
  const waiting = Boolean(msg.isStreaming) && !msg.content;
  const hasContent = Boolean(msg.content && msg.content.trim().length > 0);

  return (
    <div className="group flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-1">
        <img
          src="/assets/veraxis_logo.png"
          alt=""
          width={22}
          height={22}
          className="size-5.5 shrink-0 object-contain"
        />
        <span className="font-display text-xs font-bold tracking-tight text-foreground/90">
          VERAXIS
        </span>
      </div>

      {waiting && live ? (
        <PipelineProgress {...live} showStepper={false} />
      ) : (
        <div
          className="prose-dossier text-[15px]"
          onClick={(e) => void handleProseClick(e, document, onSelectRef)}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}

      {!msg.isStreaming && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
          <button
            type="button"
            onClick={() => copy(msg.content)}
            className={cn("uv-micro-copy-btn", copied && "is-copied")}
            title="Copy answer"
            aria-label="Copy answer"
          >
            {copied ? <Check className="size-3 text-emerald-400 stroke-[2.5]" /> : <Copy className="size-3 opacity-70" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      )}
    </div>
  );
});

interface DossierProps {
  msg: ChatMessageRecord;
  live: LiveInfo | null;
  inspecting: boolean;
  onInspect: (id: string) => void;
  onSelectRef?: (refNum: string) => void;
  onDownloadPdf: (filename: string) => Promise<void>;
}

const ResearchDossier = memo(function ResearchDossier({
  msg,
  live,
  inspecting,
  onInspect,
  onSelectRef,
  onDownloadPdf,
}: DossierProps) {
  const articleRef = useRef<HTMLElement>(null);
  const [copied, copy] = useCopy();
  const [pdfPending, setPdfPending] = useState(false);
  const [thinkingOpen, setThinkingOpen] = useState(false);

  const sources = msg.sources ?? [];
  const streaming = Boolean(msg.isStreaming);
  const html = useMemo(
    () => renderProse(msg.content, streaming),
    [msg.content, streaming]
  );
  const hasContent = Boolean(msg.content && msg.content.trim().length > 0);

  const handleProse = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    void handleProseClick(e, articleRef.current ?? document, onSelectRef);
  }, [onSelectRef]);

  const handlePdf = async () => {
    if (!msg.pdf_filename || pdfPending) return;
    setPdfPending(true);
    try {
      await onDownloadPdf(msg.pdf_filename);
    } catch {
      /* App already shows the error toast */
    } finally {
      setPdfPending(false);
    }
  };

  return (
    <article
      ref={articleRef}
      aria-busy={streaming}
      className="scroll-mt-4 w-full"
    >
      <div className="py-2">
        <div className="flex items-center gap-2 mb-2.5">
          <img
            src="/assets/veraxis_logo.png"
            alt=""
            width={22}
            height={22}
            className="size-5.5 shrink-0 object-contain"
          />
          <span className="font-display text-xs font-bold tracking-tight text-foreground/90">
            VERAXIS
          </span>
        </div>
        {/* Clean Topic Header without clutter */}
        {msg.topic && (
          <div className="mb-4">
            <h2 className="text-balance font-display text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[28px]">
              {msg.topic}
            </h2>
          </div>
        )}
        {/* Live pipeline progress: auto-collapses once report generation starts */}
        {live && !hasContent && (
          <div className="mb-5">
            <PipelineProgress {...live} showStepper />
          </div>
        )}

        {/* Clean Output with live typing indicator */}
        <div
          className="prose-dossier"
          onClick={handleProse}
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Standard compact action buttons and metadata AFTER the answer */}
        {!streaming && hasContent && (
          <footer className="mt-4 flex items-center justify-between gap-3 border-t border-border/40 pt-2.5 text-xs text-muted-foreground">
            {/* Left: Galaxy Micro Action Buttons (Smaller than Text) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copy(msg.content)}
                aria-label="Copy markdown"
                title="Copy markdown"
                className={cn("uv-micro-copy-btn", copied && "is-copied")}
              >
                {copied ? (
                  <Check className="size-3 text-emerald-400 stroke-[2.5]" />
                ) : (
                  <Copy className="size-3 opacity-70" />
                )}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>

              {msg.pdf_filename && (
                <button
                  type="button"
                  onClick={handlePdf}
                  disabled={pdfPending}
                  aria-label="Download PDF report"
                  title="Download PDF report"
                  className="uv-micro-copy-btn"
                >
                  {pdfPending ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <FileDown className="size-3 opacity-70" />
                  )}
                  <span>PDF</span>
                </button>
              )}
            </div>
          </footer>
        )}
      </div>
    </article>
  );
});

/* -------------------------------------------------------------------------- */
/*  Composer                                                                  */
/* -------------------------------------------------------------------------- */

interface ComposerProps {
  hero?: boolean;
  value: string;
  onValueChange: Dispatch<SetStateAction<string>>;
  command: SlashCommand | null;
  onCommandChange: (c: SlashCommand | null) => void;
  docs: ComposerDoc[];
  onAddFiles: (files: File[]) => void;
  onRemoveDoc: (name: string) => void;
  notice: Notice | null;
  onDismissNotice: () => void;
  isLoading: boolean;
  enhancing: boolean;
  researchPriority: boolean;
  onToggleResearchPriority: (next: boolean) => void;
  voiceOpen: boolean;
  onVoiceOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  onEnhance: () => void;
  onStop: () => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

function Composer({
  hero,
  value,
  onValueChange,
  command,
  onCommandChange,
  docs,
  onAddFiles,
  onRemoveDoc,
  notice,
  onDismissNotice,
  isLoading,
  enhancing,
  researchPriority,
  onToggleResearchPriority,
  voiceOpen,
  onVoiceOpenChange,
  onSubmit,
  onEnhance,
  onStop,
  textareaRef,
}: ComposerProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [menuIndex, setMenuIndex] = useState(0);
  const [menuDismissed, setMenuDismissed] = useState(false);

  const slashQuery =
    !command && value.startsWith("/") && !/\s/.test(value)
      ? value.slice(1).toLowerCase()
      : null;
  const matches =
    slashQuery === null
      ? []
      : SLASH_COMMANDS.filter((c) => c.id.startsWith(slashQuery));
  const menuOpen = matches.length > 0 && !menuDismissed;
  const activeIdx = Math.min(menuIndex, Math.max(matches.length - 1, 0));

  useEffect(() => {
    setMenuIndex(0);
    setMenuDismissed(false);
  }, [slashQuery]);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 208)}px`;
  }, [value, textareaRef]);

  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) {
      textareaRef.current?.focus({ preventScroll: true });
    }
  }, [textareaRef]);

  const selectCommand = (c: SlashCommand) => {
    onCommandChange(c);
    onValueChange("");
    textareaRef.current?.focus();
  };

  const trimmed = value.trim();
  const isEnhanceCmd = command?.id === "enhance";
  const canSend = trimmed.length > 0 && !enhancing && (isEnhanceCmd || !isLoading);

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (menuOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMenuIndex((activeIdx + 1) % matches.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMenuIndex((activeIdx - 1 + matches.length) % matches.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        selectCommand(matches[activeIdx]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMenuDismissed(true);
        return;
      }
    }

    if (e.key === "Backspace" && !value && command) {
      e.preventDefault();
      onCommandChange(null);
      return;
    }

    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (canSend) onSubmit();
    }
  };

  const handlePaste = (e: ReactClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.clipboardData.files ?? []);
    if (files.length > 0) {
      e.preventDefault();
      onAddFiles(files);
    }
  };

  const handleDrop = (e: ReactDragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    onAddFiles(Array.from(e.dataTransfer.files ?? []));
  };

  return (
    <div className="relative w-full">
      <VoiceBridge
        open={voiceOpen}
        onClose={() => onVoiceOpenChange(false)}
        onTranscriptCommit={(spoken) =>
          onValueChange((prev) => (prev ? `${prev.trim()} ${spoken}` : spoken))
        }
      />

      {notice && (
        <div className="mb-2 flex justify-center">
          <div
            role={notice.tone === "error" ? "alert" : "status"}
            className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/95 px-3 py-1 text-[11.5px] font-medium text-foreground shadow-xs backdrop-blur-md animate-enter"
          >
            <span className="truncate">{notice.text}</span>
            {notice.undo && (
              <button
                type="button"
                onClick={notice.undo}
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                Undo
              </button>
            )}
            <button
              type="button"
              onClick={onDismissNotice}
              aria-label="Dismiss"
              className="text-muted-foreground hover:text-foreground ml-0.5"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <div
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setDragging(true);
          }
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setDragging(false);
          }
        }}
        onDrop={handleDrop}
        className={cn(
          "focus-ring-within relative rounded-2xl border bg-card shadow-[var(--elev-2)] transition-colors",
          dragging ? "border-primary" : "border-border"
        )}
      >
        {menuOpen && (
          <div
            id="slash-menu"
            role="listbox"
            aria-label="Commands"
            className="absolute inset-x-0 bottom-full z-30 mb-2 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-[var(--elev-3)]"
          >
            {matches.map((c, i) => (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={i === activeIdx}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setMenuIndex(i)}
                onClick={() => selectCommand(c)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm",
                  i === activeIdx ? "bg-secondary" : "hover:bg-secondary/60"
                )}
              >
                <span className={ACCENT_TEXT}>{c.icon}</span>
                <span className="font-mono text-xs text-foreground">{c.label}</span>
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                  {c.description}
                </span>
              </button>
            ))}
          </div>
        )}

        {(command || docs.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5 px-3 pt-3">
            {command && (
              <span
                className={cn(
                  "inline-flex h-6 items-center gap-1.5 rounded-md border px-2 text-xs font-medium",
                  ACCENT_SOFT
                )}
              >
                {command.icon}
                {command.label}
                <button
                  type="button"
                  onClick={() => onCommandChange(null)}
                  aria-label={`Remove ${command.label}`}
                  className="focus-ring -mr-1 rounded p-0.5 hover:bg-black/10"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}
            {docs.map((d) => (
              <span
                key={d.name}
                title={d.truncated ? `${d.name} — only the first ${MAX_DOC_CHARS.toLocaleString()} characters will be sent` : d.name}
                className="inline-flex h-6 max-w-[220px] items-center gap-1.5 rounded-md border border-border bg-secondary px-2 text-xs text-foreground"
              >
                <FileText className="size-3 shrink-0 text-muted-foreground" />
                <span className="truncate">{d.name}</span>
                {d.truncated && (
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                    trimmed
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onRemoveDoc(d.name)}
                  aria-label={`Remove ${d.name}`}
                  className="focus-ring -mr-1 rounded p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          rows={1}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          aria-label="Message"
          placeholder={
            isLoading
              ? "Working… you can draft your next question"
              : hero
              ? "Ask a question or describe a research topic…"
              : "Ask a follow-up, or type / for commands…"
          }
          className="block max-h-52 min-h-[48px] w-full resize-none bg-transparent px-4 pb-1 pt-3.5 text-base leading-relaxed text-foreground outline-none placeholder:text-muted-foreground sm:text-[15px]"
        />

        <div className="flex items-center gap-1 px-2 pb-2 pt-1">
          <button
            type="button"
            role="switch"
            aria-checked={researchPriority}
            onClick={() => onToggleResearchPriority(!researchPriority)}
            title={
              researchPriority
                ? "Deep research on: arXiv, OpenAlex, Semantic Scholar"
                : "Deep research off: the router decides"
            }
            className={cn(
              "focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors sm:h-8",
              researchPriority
                ? ACCENT_SOFT
                : "border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Microscope className="size-3.5" />
            Deep research
          </button>

          <button
            type="button"
            onClick={onEnhance}
            disabled={!trimmed || enhancing}
            aria-label="Enhance prompt"
            title="Rewrite this prompt more clearly"
            className={TOOL_BTN}
          >
            {enhancing ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
          </button>

          <button
            type="button"
            onClick={() => onVoiceOpenChange(!voiceOpen)}
            aria-pressed={voiceOpen}
            aria-label="Voice input"
            className={cn(TOOL_BTN, voiceOpen && ACCENT_TEXT)}
          >
            <Mic className="size-4" />
          </button>

          <div className="ml-auto flex items-center gap-2">
            {isLoading ? (
              <button
                type="button"
                onClick={onStop}
                aria-label="Stop generation"
                className="focus-ring inline-flex size-9 items-center justify-center rounded-xl border border-border bg-secondary text-foreground transition-colors hover:bg-muted"
              >
                <Square className="size-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                disabled={!canSend}
                aria-label={isEnhanceCmd ? "Enhance prompt" : "Send"}
                className="focus-ring inline-flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-30"
              >
                {isEnhanceCmd ? <Wand2 className="size-4" /> : <ArrowUp className="size-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  ChatWorkspace                                                             */
/* -------------------------------------------------------------------------- */

export default function ChatWorkspace({
  messages,
  recentSession,
  onOpenRecentSession,
  isLoading,
  researchPriority,
  onToggleResearchPriority,
  activeThinkingSteps,
  livePhase,
  livePhaseLabel,
  contextSegments,
  onSendQuery,
  onStopQuery,
  onDownloadPdf,
  inspectorOpen,
  onToggleInspector,
  onSetInspectorOpen,
}: ChatWorkspaceProps) {
  /* ---- composer state ---- */
  const [draft, setDraft] = useState("");
  const [command, setCommand] = useState<SlashCommand | null>(null);
  const [docs, setDocs] = useState<ComposerDoc[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [enhancing, setEnhancing] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ---- 4 Randomly Brainstormed AI Prompts ---- */
  const [brainstormPrompts, setBrainstormPrompts] = useState<BrainstormPrompt[]>(() => {
    const shuffled = [...BRAINSTORM_POOL].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  });

  useEffect(() => {
    // Sanitize in case previous HMR state or old session has string/emoji icon
    setBrainstormPrompts((prev) =>
      prev.map((p) => ({
        ...p,
        icon:
          typeof p.icon === "function" ||
          (typeof p.icon === "object" && p.icon !== null && "$$typeof" in p.icon)
            ? p.icon
            : CATEGORY_ICON_MAP[p.category.toLowerCase().trim()] || Sparkles,
      }))
    );
  }, []);

  /* ---- inspector state ---- */
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const wsHeight = useWorkspaceHeight();
  const [inspectedMessageId, setInspectedMessageId] = useState<string | null>(null);
  const [localInspectorCollapsed, setLocalInspectorCollapsed] = useState(true);
  const [localMobileInspectorOpen, setLocalMobileInspectorOpen] = useState(false);

  const effectiveInspectorOpen = onSetInspectorOpen
    ? Boolean(inspectorOpen)
    : isDesktop
    ? !localInspectorCollapsed
    : localMobileInspectorOpen;

  const setEffectiveInspectorOpen = useCallback(
    (open: boolean) => {
      if (onSetInspectorOpen) {
        onSetInspectorOpen(open);
      } else {
        if (isDesktop) setLocalInspectorCollapsed(!open);
        else setLocalMobileInspectorOpen(open);
      }
    },
    [onSetInspectorOpen, isDesktop]
  );

  /* ---- scroll state ---- */
  const stickRef = useRef(true);
  const [atBottom, setAtBottom] = useState(true);

  /* ---- run timing ---- */
  const [startedAt, setStartedAt] = useState<number | null>(null);
  useEffect(() => {
    setStartedAt(isLoading ? Date.now() : null);
  }, [isLoading]);

  const isEmpty = messages.length === 0 && !isLoading;
  const firstId = messages[0]?.id ?? "";
  const lastMsg = messages[messages.length - 1];

  /* Messages present when a session is opened do not animate in. */
  const baseline = useRef({ firstId: "\u0000", count: 0 });
  if (baseline.current.firstId !== firstId) {
    baseline.current = { firstId, count: messages.length };
  }

  /* ---- derived research data ---- */
  const researchMessages = useMemo(
    () => messages.filter((m) => m.type === "research"),
    [messages]
  );
  const lastResearchId = researchMessages[researchMessages.length - 1]?.id ?? null;

  useEffect(() => {
    setInspectedMessageId(null);
  }, [lastResearchId]);

  const activeResearchMessage = useMemo(() => {
    if (inspectedMessageId) {
      const hit = researchMessages.find((m) => m.id === inspectedMessageId);
      if (hit) return hit;
    }
    return researchMessages[researchMessages.length - 1] ?? null;
  }, [researchMessages, inspectedMessageId]);

  const hasInspectorContent =
    Boolean(activeResearchMessage) || (isLoading && Boolean(activeThinkingSteps));
  const showInspectorColumn =
    hasInspectorContent && effectiveInspectorOpen && isDesktop;

  const lastStep = activeThinkingSteps?.[activeThinkingSteps.length - 1] as unknown as
    | { agent?: string; step?: string }
    | undefined;

  const liveInfo = useMemo<LiveInfo>(
    () => ({
      phase: livePhase,
      label: livePhaseLabel,
      agent: lastStep?.agent,
      step: lastStep?.step,
      startedAt,
    }),
    [livePhase, livePhaseLabel, lastStep?.agent, lastStep?.step, startedAt]
  );

  const lastIsStreamingBot =
    Boolean(lastMsg) && lastMsg.role === "bot" && Boolean(lastMsg.isStreaming);
  const showStandalonePipeline = isLoading && !lastIsStreamingBot;
  const standaloneStepper =
    STAGES.some((s) => s.key === livePhase) && livePhase !== "classify";

  /* ---- scroll anchoring (#workspace is the scroller) ---- */
  useEffect(() => {
    const el = getScroller();
    if (!el) return;
    const onScroll = () => {
      const gap = el.scrollHeight - el.scrollTop - el.clientHeight;
      const near = gap < NEAR_BOTTOM_PX;
      stickRef.current = near;
      setAtBottom((prev) => (prev === near ? prev : near));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const prevFirstId = useRef(firstId);
  useLayoutEffect(() => {
    const el = getScroller();
    if (!el || isEmpty) return;
    const sessionChanged = prevFirstId.current !== firstId;
    prevFirstId.current = firstId;
    if (sessionChanged || lastMsg?.role === "user") stickRef.current = true;
    if (stickRef.current) el.scrollTo({ top: el.scrollHeight });
  }, [messages, isLoading, livePhase, firstId, isEmpty, lastMsg?.role]);

  const jumpToLatest = useCallback(() => {
    const el = getScroller();
    if (!el) return;
    stickRef.current = true;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, []);

  /* ---- inspector actions ---- */
  const handleInspect = useCallback(
    (id: string) => {
      setInspectedMessageId(id);
      if (showInspectorColumn && activeResearchMessage?.id === id) {
        setEffectiveInspectorOpen(false);
      } else {
        setEffectiveInspectorOpen(true);
      }
    },
    [showInspectorColumn, activeResearchMessage?.id, setEffectiveInspectorOpen]
  );

  /* ---- Jump to specific reference in right side panel (NEVER closes panel) ---- */
  const handleJumpToRef = useCallback(
    (refNum: string | number, messageId?: string) => {
      // 1. Point active inspector to this message
      if (messageId) {
        setInspectedMessageId(messageId);
      } else if (!inspectedMessageId) {
        const latestResearch = [...messages].reverse().find((m) => m.type === "research");
        if (latestResearch) {
          setInspectedMessageId(latestResearch.id);
        }
      }

      // 2. Open inspector column (Desktop) or dialog (Mobile) — NEVER toggle closed!
      setEffectiveInspectorOpen(true);

      // 3. Scroll smoothly to target card in inspector
      const num = String(refNum).replace(/\D/g, "");
      const doScroll = () => {
        const target =
          document.getElementById(`ref-${num}`) ||
          document.querySelector(`[data-ref="${num}"]`) ||
          document.getElementById(`inspector-ref-${num}`);

        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          const highlightCls = [
            "ring-2",
            "ring-primary",
            "ring-offset-2",
            "ring-offset-card",
            "rounded-xl",
          ];
          target.classList.add(...highlightCls);
          setTimeout(() => target.classList.remove(...highlightCls), 2200);
          return true;
        }
        return false;
      };

      if (!doScroll()) {
        setTimeout(doScroll, 120);
        setTimeout(doScroll, 350);
      }
    },
    [isDesktop, inspectedMessageId, messages]
  );

  /* ---- composer actions ---- */
  const addFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      const room = MAX_FILES - docs.length;
      if (room <= 0) {
        setNotice({ tone: "info", text: `Up to ${MAX_FILES} files per message.` });
        return;
      }
      const { docs: read, skipped } = await readTextAttachments(files.slice(0, room));
      setDocs((prev) => {
        const names = new Set(prev.map((d) => d.name));
        return [...prev, ...read.filter((d) => !names.has(d.name))].slice(0, MAX_FILES);
      });
      const parts: string[] = [];
      if (skipped.length > 0) {
        parts.push(`Skipped ${skipped.join(", ")} (text or code under 500 KB only).`);
      }
      if (files.length > room) {
        parts.push(`Only the first ${room} file(s) were added.`);
      }
      if (parts.length > 0) setNotice({ tone: "error", text: parts.join(" ") });
    },
    [docs.length]
  );

  const removeDoc = useCallback((name: string) => {
    setDocs((prev) => prev.filter((d) => d.name !== name));
  }, []);

  const runEnhance = useCallback(
    async (source: string) => {
      const text = source.trim();
      if (!text || enhancing) return;
      setEnhancing(true);
      setNotice(null);
      try {
        const res = await fetch(getApiUrl("/api/enhance"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: text }),
        });
        if (!res.ok) throw new Error(`Enhance failed (${res.status})`);
        const data = await res.json();
        const enhanced =
          typeof data.enhanced_query === "string" ? data.enhanced_query.trim() : "";
        if (!enhanced) {
          setNotice({ tone: "error", text: "Enhance returned nothing. Your text is unchanged." });
          return;
        }
        setDraft(enhanced);
        setNotice({
          tone: "info",
          text: "Prompt rewritten.",
          undo: () => {
            setDraft(source);
            setNotice(null);
          },
        });
      } catch (err) {
        setNotice({
          tone: "error",
          text: err instanceof Error ? err.message : "Unable to enhance the prompt.",
        });
      } finally {
        setEnhancing(false);
      }
    },
    [enhancing]
  );

  const handleSend = useCallback(async () => {
    let text = draft.trim();
    let cmd = command;

    // "/research topic" typed in one go, without picking from the menu
    if (!cmd) {
      const m = text.match(/^\/(research|paper|enhance)\s+([\s\S]+)$/i);
      if (m) {
        cmd = SLASH_COMMANDS.find((c) => c.id === m[1].toLowerCase()) ?? null;
        text = m[2].trim();
      }
    }
    if (!text) return;

    if (cmd?.id === "enhance") {
      await runEnhance(text);
      setCommand(null);
      return;
    }
    if (isLoading) return;

    const deep = cmd?.id === "research" || cmd?.id === "paper";
    const modeOverride: "auto" | "deep" = deep ? "deep" : "auto";
    const forceResearch = deep ? true : researchPriority;
    const attachments: AttachedDoc[] = docs.map(({ name, content }) => ({ name, content }));

    const snapshot = { draft, command, docs };
    setNotice(null);
    setDraft("");
    setCommand(null);
    setDocs([]);

    try {
      await onSendQuery(text, { forceResearch, modeOverride, attachments });
    } catch {
      setDraft(snapshot.draft);
      setCommand(snapshot.command);
      setDocs(snapshot.docs);
      setNotice({ tone: "error", text: "Couldn't send that message. Your draft was restored." });
    }
  }, [draft, command, docs, isLoading, researchPriority, onSendQuery, runEnhance]);

  const composerProps: ComposerProps = {
    value: draft,
    onValueChange: setDraft,
    command,
    onCommandChange: setCommand,
    docs,
    onAddFiles: (files) => void addFiles(files),
    onRemoveDoc: removeDoc,
    notice,
    onDismissNotice: () => setNotice(null),
    isLoading,
    enhancing,
    researchPriority,
    onToggleResearchPriority,
    voiceOpen,
    onVoiceOpenChange: setVoiceOpen,
    onSubmit: () => void handleSend(),
    onEnhance: () => void runEnhance(draft),
    onStop: onStopQuery,
    textareaRef,
  };

  const inspectorProps = {
    topic: activeResearchMessage?.topic,
    sources: activeResearchMessage?.sources ?? [],
    thinkingSteps:
      isLoading && activeThinkingSteps
        ? activeThinkingSteps
        : activeResearchMessage?.thinkingSteps,
    duration: activeResearchMessage?.duration,
    isRunning: isLoading,
    livePhase,
    pdfFilename: activeResearchMessage?.pdf_filename,
    onDownloadPdf,
  };

  /* ------------------------------------------------------------------------ */
  /*  Empty / hero                                                            */
  /* ------------------------------------------------------------------------ */

  if (isEmpty) {
    return (
      <MotionConfig reducedMotion="user">
        <div className="uv-hero-kencode7 relative flex flex-1 flex-col px-4 py-10">
          <div className="relative z-10 mx-auto my-auto flex w-full max-w-2xl flex-col items-center text-center animate-enter">
            <h1 className="text-balance font-display text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
              What are we investigating?
            </h1>
            <p className="mb-7 mt-3 max-w-prose text-sm text-muted-foreground sm:text-base">
              Quick answers by default. Switch on Deep research for peer-reviewed
              sources, fact-checked claims, and a PDF dossier.
            </p>

            <Composer {...composerProps} hero />

            {/* 4 Brainstormed AI Inquiries in Galaxy Pill Cards (Mobile shows exactly 2) */}
            <div className="mt-6 w-full max-w-xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                {brainstormPrompts.map((item, idx) => (
                  <div
                    key={item.id}
                    className={cn(idx >= 2 && "hidden sm:block")}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setDraft(item.topic);
                        requestAnimationFrame(() => textareaRef.current?.focus());
                      }}
                      className="uv-galaxy-prompt-card group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="uv-galaxy-prompt-icon" aria-hidden="true">
                          {renderSafeSvgIcon(item.icon, item.category)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="font-mono text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground/80 block leading-tight">
                            {item.category}
                          </span>
                          <span className="text-xs font-semibold text-foreground tracking-tight leading-snug truncate block group-hover:text-primary transition-colors">
                            {item.topic}
                          </span>
                        </div>
                      </div>
                      <span className="uv-galaxy-prompt-arrow" aria-hidden="true">
                        <ArrowUpRight className="size-3.5" />
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </MotionConfig>
    );
  }

  /* ------------------------------------------------------------------------ */
  /*  Conversation                                                            */
  /* ------------------------------------------------------------------------ */

  const feedWidth = showInspectorColumn ? "max-w-3xl" : "max-w-3xl xl:max-w-4xl";

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={cn(
          "grid flex-1 grid-cols-1",
          showInspectorColumn && "lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_440px]"
        )}
      >
        <div className="flex min-w-0 flex-col">
          {hasInspectorContent && !effectiveInspectorOpen && isDesktop && (
            <div className="pointer-events-none sticky top-3 z-10 flex h-0 items-start justify-end px-4">
              <button
                type="button"
                onClick={() => setEffectiveInspectorOpen(true)}
                className="focus-ring pointer-events-auto inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground shadow-[var(--elev-2)] transition-colors hover:bg-secondary cursor-pointer"
              >
                <PanelRightOpen className={cn("size-3.5", ACCENT_TEXT)} />
                Sources &amp; steps
                {(activeResearchMessage?.sources?.length ?? 0) > 0 && (
                  <span className="font-mono tabular-nums text-muted-foreground">
                    {activeResearchMessage?.sources?.length}
                  </span>
                )}
              </button>
            </div>
          )}

          <div
            role="log"
            aria-label="Conversation"
            aria-live="off"
            className={cn("mx-auto flex w-full flex-1 flex-col gap-6 px-3 py-6 sm:px-6", feedWidth)}
          >
            {messages.map((msg, i) => {
              const animate = i >= baseline.current.count;
              const isLast = i === messages.length - 1;
              const live = msg.isStreaming && isLast ? liveInfo : null;

              let body: ReactNode;
              if (msg.role === "user") {
                body = <UserMessage content={msg.content} />;
              } else if (msg.type === "error") {
                body = <ErrorNote content={msg.content} />;
              } else if (msg.type === "research") {
                body = (
                  <ResearchDossier
                    msg={msg}
                    live={live}
                    inspecting={showInspectorColumn && activeResearchMessage?.id === msg.id}
                    onInspect={handleInspect}
                    onSelectRef={(refNum) => handleJumpToRef(refNum, msg.id)}
                    onDownloadPdf={onDownloadPdf}
                  />
                );
              } else {
                body = (
                  <ChatAnswer
                    msg={msg}
                    live={live}
                    onSelectRef={(refNum) => handleJumpToRef(refNum, msg.id)}
                  />
                );
              }

              return (
                <Reveal key={msg.id} animate={animate}>
                  {body}
                </Reveal>
              );
            })}

            {showStandalonePipeline && (
              <Reveal animate>
                <PipelineProgress {...liveInfo} showStepper={standaloneStepper} />
              </Reveal>
            )}
          </div>

          <div className="sticky bottom-0 z-20 mt-auto bg-background/85 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:px-6">
            <div className={cn("relative mx-auto w-full", feedWidth)}>
              <div className="pointer-events-none absolute inset-x-0 -top-12 flex justify-center">
                <AnimatePresence>
                  {!atBottom && (
                    <motion.button
                      type="button"
                      onClick={jumpToLatest}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15, ease: EASE }}
                      className="focus-ring pointer-events-auto inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-medium text-foreground shadow-[var(--elev-2)] hover:bg-secondary"
                    >
                      <ArrowDown className="size-3.5" />
                      Latest
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
              <Composer {...composerProps} />
            </div>
          </div>
        </div>

        {showInspectorColumn && (
          <aside
            aria-label="Sources and agent steps"
            className="relative hidden border-l border-border lg:block"
          >
            <div
              className="sticky top-0 overflow-hidden p-3"
              style={{ height: wsHeight ?? "calc(100dvh - 3.5rem)" }}
            >
              <div className="h-full min-h-0 overflow-y-auto">
                <ReportInspector
                  {...inspectorProps}
                  onToggleCollapse={() => setEffectiveInspectorOpen(false)}
                />
              </div>
            </div>
          </aside>
        )}

        <Dialog open={effectiveInspectorOpen && !isDesktop} onOpenChange={setEffectiveInspectorOpen}>
          <DialogContent className="max-h-[85vh] max-w-lg overflow-hidden p-4">
            <DialogHeader>
              <DialogTitle>Sources &amp; progress</DialogTitle>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto">
              <ReportInspector {...inspectorProps} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MotionConfig>
  );
}
