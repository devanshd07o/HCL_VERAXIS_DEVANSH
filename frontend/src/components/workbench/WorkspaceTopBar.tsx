import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import {
  Bookmark,
  Menu,
  MessageSquare,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightOpen,
  Plus,
  Settings,
  Sun,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TextScramble } from "@/components/ui/text-scramble";

/* ==========================================================================
   Constants & helpers
   ========================================================================== */

const NAV_ITEMS = [
  { path: "/", label: "Ask", icon: MessageSquare },
  { path: "/dossiers", label: "Saved", icon: Bookmark },
  { path: "/vault", label: "Settings", icon: Settings },
] as const;

const SPRING = { type: "spring", stiffness: 520, damping: 40, mass: 0.8 } as const;
const REVEAL_MS = 450;

type Theme = "light" | "dark";

interface WorkspaceTopBarProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onNewInquiry: () => void;
  onToggleRail: () => void;
  railOpen: boolean;
  hasReport?: boolean;
  inspectorOpen?: boolean;
  onToggleInspector?: () => void;
  reportSourcesCount?: number;
}

interface ViewTransitionDocument {
  startViewTransition?: (cb: () => void) => { ready: Promise<void> };
}

const readRoute = () => {
  if (typeof window === "undefined") return "/";
  const h = window.location.hash.replace(/^#/, "").split("?")[0];
  return h.startsWith("/") ? h : "/";
};

const resolveActive = (route: string) =>
  NAV_ITEMS.find(
    (i) => i.path !== "/" && (route === i.path || route.startsWith(`${i.path}/`))
  )?.path ?? "/";

/* ==========================================================================
   Small primitives
   ========================================================================== */

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-secondary px-1 font-mono text-[10px] leading-4 text-muted-foreground">
      {children}
    </kbd>
  );
}

/** CSS-only tooltip from Uiverse.io by PriyanshuGupta28 */
function Tip({
  label,
  shortcut,
  align = "center",
  children,
}: {
  label: string;
  shortcut?: string[];
  align?: "start" | "center" | "end";
  children: ReactNode;
}) {
  return (
    <span className="uv-tooltip-wrapper relative inline-flex">
      {children}
      <span
        aria-hidden
        className={cn(
          "uv-tooltip",
          align === "start" && "align-start",
          align === "end" && "align-end"
        )}
      >
        <span>{label}</span>
        {shortcut && (
          <span className="flex items-center gap-0.5">
            {shortcut.map((k) => (
              <kbd
                key={k}
                className="rounded border border-white/20 bg-white/15 px-1 font-mono text-[10px] leading-3.5 text-white/90"
              >
                {k}
              </kbd>
            ))}
          </span>
        )}
      </span>
    </span>
  );
}

const ICON_BUTTON =
  "focus-ring inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card/60 text-muted-foreground transition-[color,background-color,border-color,transform] duration-150 hover:border-[color:var(--border-strong)] hover:bg-card hover:text-foreground active:scale-95";

const swap = {
  initial: { opacity: 0, scale: 0.7, rotate: -60 },
  animate: { opacity: 1, scale: 1, rotate: 0 },
  exit: { opacity: 0, scale: 0.7, rotate: 60 },
  transition: { duration: 0.16 },
} as const;

function RailIcon({ open }: { open: boolean }) {
  return (
    <span className="grid size-4 place-items-center">
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={open ? "open" : "closed"}
          {...swap}
          className="grid place-items-center"
        >
          <span className="lg:hidden">
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </span>
          <span className="hidden lg:block">
            {open ? (
              <PanelLeftClose className="size-4" />
            ) : (
              <PanelLeftOpen className="size-4" />
            )}
          </span>
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ==========================================================================
   Top bar
   ========================================================================== */

export default function WorkspaceTopBar({
  theme,
  onThemeChange,
  onNewInquiry,
  onToggleRail,
  railOpen,
  hasReport,
  inspectorOpen,
  onToggleInspector,
  reportSourcesCount,
}: WorkspaceTopBarProps) {
  const headerRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const [route, setRoute] = useState(readRoute);
  const [hovered, setHovered] = useState<string | null>(null);
  const [logoHovered, setLogoHovered] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [mod] = useState(() =>
    typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent)
      ? "⌘"
      : "Ctrl"
  );

  const active = resolveActive(route);

  /* ---------- Route sync ---------- */
  useEffect(() => {
    const onHash = () => setRoute(readRoute());
    const onNav = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) setRoute(detail);
    };
    window.addEventListener("hashchange", onHash);
    window.addEventListener("veraxis:nav", onNav);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("veraxis:nav", onNav);
    };
  }, []);

  const go = useCallback((path: string) => {
    if (window.location.hash !== `#${path}`) {
      window.history.replaceState(null, "", `#${path}`);
    }
    window.dispatchEvent(new CustomEvent("veraxis:nav", { detail: path }));
    setRoute(path);
  }, []);

  const handleNavClick = useCallback(
    (e: ReactMouseEvent<HTMLAnchorElement>, path: string) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      go(path);
    },
    [go]
  );

  /* ---------- Scroll progress + elevation (no re-renders) ---------- */
  useEffect(() => {
    const header = headerRef.current;
    const bar = barRef.current;
    if (!header || !bar) return;
    let raf = 0;

    const onScroll = (e: Event) => {
      const el = e.target;
      if (!(el instanceof HTMLElement)) return;
      const main = document.getElementById("workspace");
      if (!main || !main.contains(el)) return;
      if (el.clientHeight < main.clientHeight * 0.5) return;
      const max = el.scrollHeight - el.clientHeight;
      if (max <= 1) return;

      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const top = el.scrollTop;
        bar.style.transform = `scaleX(${Math.min(1, Math.max(0, top / max))})`;
        bar.style.opacity = top > 4 ? "1" : "0";
        header.dataset.scrolled = top > 4 ? "true" : "false";
      });
    };

    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("scroll", onScroll, { capture: true });
    };
  }, []);

  useEffect(() => {
    const bar = barRef.current;
    const header = headerRef.current;
    if (bar) {
      bar.style.transform = "scaleX(0)";
      bar.style.opacity = "0";
    }
    if (header) header.dataset.scrolled = "false";
  }, [route]);

  /* ---------- Theme toggle: circular reveal from the button ---------- */
  const toggleTheme = useCallback(
    (e: ReactMouseEvent<HTMLButtonElement>) => {
      const next: Theme = theme === "dark" ? "light" : "dark";
      const doc = document as unknown as ViewTransitionDocument;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (!doc.startViewTransition || reduce) {
        onThemeChange(next);
        return;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const radius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      try {
        const transition = doc.startViewTransition(() => {
          flushSync(() => onThemeChange(next));
        });
        transition.ready
          .then(() => {
            document.documentElement.animate(
              {
                clipPath: [
                  `circle(0px at ${x}px ${y}px)`,
                  `circle(${radius}px at ${x}px ${y}px)`,
                ],
              },
              {
                duration: REVEAL_MS,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                pseudoElement: "::view-transition-new(root)",
              }
            );
          })
          .catch(() => {});
      } catch {
        onThemeChange(next);
      }
    },
    [theme, onThemeChange]
  );

  /* ---------- Skip link ---------- */
  const focusWorkspace = useCallback(() => {
    const main = document.getElementById("workspace");
    if (!main) return;
    if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
    main.style.outline = "none";
    main.focus({ preventScroll: true });
  }, []);

  /* ---------- Render ---------- */
  return (
    <MotionConfig reducedMotion="user">
      <header
        ref={headerRef}
        data-scrolled="false"
        className="shrink-0 sticky top-0 z-40 w-full border-b border-border bg-background transition-[shadow,border-color] duration-200 data-[scrolled=true]:shadow-[var(--elev-1)]"
      >
        <button
          type="button"
          onClick={focusWorkspace}
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-1.5 focus:text-xs focus:font-semibold focus:text-primary-foreground"
        >
          Skip to workspace
        </button>

        <div className="grid h-14 w-full grid-cols-[auto_1fr_auto] items-center gap-2 px-2.5 sm:gap-4 sm:px-3">
          {/* Left: rail toggle + brand */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Tip
              align="start"
              label={railOpen ? "Close sidebar" : "Open sidebar"}
              shortcut={[mod, "B"]}
            >
              <button
                type="button"
                onClick={onToggleRail}
                aria-label={railOpen ? "Close sidebar" : "Open sidebar"}
                aria-expanded={railOpen}
                className={ICON_BUTTON}
              >
                <RailIcon open={railOpen} />
              </button>
            </Tip>

            <a
              href="#/"
              onClick={(e) => handleNavClick(e, "/")}
              onMouseEnter={() => setLogoHovered(true)}
              onMouseLeave={() => setLogoHovered(false)}
              aria-label="VERAXIS, go to Ask"
              className="focus-ring -ml-0.5 flex shrink-0 items-center gap-2 rounded-lg px-1 py-1 text-foreground no-underline transition-opacity duration-150 hover:opacity-90"
            >
              {logoFailed ? (
                <span
                  aria-hidden
                  className="grid size-8 place-items-center font-display text-base font-bold text-primary"
                >
                  V
                </span>
              ) : (
                <img
                  src="/assets/veraxis_logo.png"
                  alt="VERAXIS"
                  width={34}
                  height={34}
                  onError={() => setLogoFailed(true)}
                  className="size-8 sm:size-8.5 shrink-0 object-contain transition-transform duration-200 hover:scale-105"
                />
              )}
              <span className="hidden font-display text-[15px] font-bold tracking-tight text-foreground sm:inline">
                <TextScramble trigger={logoHovered} duration={0.35} speed={0.03}>
                  VERAXIS
                </TextScramble>
              </span>
            </a>
          </div>

          {/* Center: primary navigation (Uiverse.io expanding pill menu - hidden on mobile, placed in left panel) */}
          <nav
            aria-label="Primary"
            className="uv-nav-menu justify-self-center !hidden sm:!flex"
          >
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
              const isActive = path === active;
              return (
                <a
                  key={path}
                  href={`#${path}`}
                  aria-label={label}
                  aria-current={isActive ? "page" : undefined}
                  onClick={(e) => handleNavClick(e, path)}
                  className={cn(
                    "uv-nav-link",
                    isActive && "active"
                  )}
                >
                  <span className="uv-nav-icon">
                    <Icon
                      aria-hidden
                      className={cn(
                        "size-3.5 transition-colors duration-150",
                        isActive ? "text-[color:var(--primary-text)]" : "text-muted-foreground"
                      )}
                    />
                  </span>
                  <span className="uv-nav-title">{label}</span>
                </a>
              );
            })}
          </nav>

          {/* Right: actions (Pinned to right corner) */}
          <div className="flex items-center gap-1.5 sm:gap-2 justify-self-end ml-auto">
            <Tip label="New inquiry">
              <button
                type="button"
                onClick={onNewInquiry}
                aria-label="New inquiry"
                className="uv-btn-viki h-8 px-2.5 sm:px-3 text-xs"
              >
                <Plus
                  aria-hidden
                  className="size-3.5 transition-transform duration-200 group-hover:rotate-90"
                />
                <span className="viki-label !hidden sm:!inline">
                  New<span className="hidden lg:inline"> inquiry</span>
                </span>
              </button>
            </Tip>

            <Tip
              align="end"
              label={theme === "dark" ? "Switch to light" : "Switch to dark"}
            >
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={
                  theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
                }
                className="uv-btn-mrhyddenn h-8"
              >
                <AnimatePresence initial={false} mode="wait">
                  <motion.span
                    key={theme}
                    {...swap}
                    className="flex items-center gap-1.5"
                  >
                    {theme === "dark" ? (
                      <Sun className="size-3.5" aria-hidden />
                    ) : (
                      <Moon className="size-3.5" aria-hidden />
                    )}
                    <span className="theme-label !hidden sm:!inline font-mono text-[10px]">
                      {theme === "dark" ? "Light" : "Dark"}
                    </span>
                  </motion.span>
                </AnimatePresence>
              </button>
            </Tip>

            {/* Report Sources & Steps Panel Toggle (Rightest edge - only visible when research report exists) */}
            {hasReport && (
              <Tip
                align="end"
                label={inspectorOpen ? "Close sources & steps" : "View sources & steps"}
              >
                <button
                  type="button"
                  onClick={onToggleInspector}
                  aria-label={inspectorOpen ? "Close sources & steps" : "View sources & steps"}
                  aria-expanded={inspectorOpen}
                  className={cn(
                    "focus-ring inline-flex h-8 items-center gap-1.5 rounded-lg border px-2 sm:px-2.5 text-xs font-medium transition-all active:scale-95 cursor-pointer",
                    inspectorOpen
                      ? "border-primary bg-primary/10 text-primary shadow-xs font-semibold"
                      : "border-border bg-card/60 text-muted-foreground hover:border-[color:var(--border-strong)] hover:bg-card hover:text-foreground"
                  )}
                >
                  <PanelRightOpen className="size-3.5" />
                  <span className="!hidden sm:!inline font-mono text-[10px] tracking-tight">
                    {reportSourcesCount ? `${reportSourcesCount} sources` : "Report"}
                  </span>
                  {Boolean(reportSourcesCount) && (
                    <span className="sm:hidden size-1.5 rounded-full bg-primary" />
                  )}
                </button>
              </Tip>
            )}
          </div>
        </div>

        {/* Scroll progress: only visible once the workspace is scrolled */}
        <div
          ref={barRef}
          aria-hidden
          style={{ transform: "scaleX(0)" }}
          className="pointer-events-none absolute inset-x-0 -bottom-px h-0.5 origin-left bg-primary opacity-0 transition-opacity duration-200 will-change-transform"
        />
      </header>
    </MotionConfig>
  );
}
