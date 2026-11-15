import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  Check,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Keyboard,
  KeyRound,
  Monitor,
  Moon,
  Palette,
  Server,
  Smartphone,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { getApiUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  DARK_PRESETS,
  LIGHT_PRESETS,
  applyThemePreset,
  getStoredThemePreset,
  type ThemePreset,
} from "@/lib/theme-presets";

/* -------------------------------------------------------------------------- */
/*  Public Types & Service Key Configurations                                 */
/* -------------------------------------------------------------------------- */

export interface VaultSettingsProps {
  theme?: "light" | "dark";
  onThemeChange?: (theme: "light" | "dark") => void;
  fontFamily: string;
  onFontFamilyChange: (f: string) => void;
  fontSize: string;
  onFontSizeChange: (s: string) => void;
  onTelemetrySync?: (t: { activeKeys: number; totalKeys: number }) => void;
  onClose?: () => void;
}

const FONTS = [
  { id: "Roboto", name: "Roboto", family: "'Roboto', sans-serif" },
  { id: "Comfortaa", name: "Comfortaa", family: "'Comfortaa', sans-serif" },
  { id: "Inter", name: "Inter", family: "'Inter', sans-serif" },
  { id: "Manrope", name: "Manrope", family: "'Manrope', sans-serif" },
];

const FONT_SIZES = [
  { id: "15px", label: "Small" },
  { id: "16px", label: "Medium" },
  { id: "18px", label: "Large" },
];

interface ServiceKeyConfig {
  id: string;
  name: string;
  badge: string;
  storageKey: string;
  placeholder: string;
  consoleUrl: string;
  consoleLabel: string;
  prefix?: string;
  description: string;
}

const SERVICE_KEY_CONFIGS: ServiceKeyConfig[] = [
  {
    id: "groq",
    name: "Groq Cloud LPU",
    badge: "Primary Inference",
    storageKey: "veraxis_groq_key",
    placeholder: "gsk_...",
    consoleUrl: "https://console.groq.com/keys",
    consoleLabel: "Groq Console",
    prefix: "gsk_",
    description: "Ultra-fast LPU inference for synthesis, reasoning, and real-time chat.",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    badge: "Fallback / Vision",
    storageKey: "veraxis_gemini_key",
    placeholder: "AIza...",
    consoleUrl: "https://aistudio.google.com/apikey",
    consoleLabel: "Google AI Studio",
    prefix: "AIza",
    description: "Multimodal analysis and high-capacity fallback reasoning.",
  },
  {
    id: "tavily",
    name: "Tavily AI",
    badge: "Literature Search",
    storageKey: "veraxis_tavily_key",
    placeholder: "tvly-...",
    consoleUrl: "https://app.tavily.com",
    consoleLabel: "Tavily Console",
    prefix: "tvly-",
    description: "Academic literature search and web citation discovery.",
  },
  {
    id: "semantic_scholar",
    name: "Semantic Scholar",
    badge: "Citation Graph",
    storageKey: "veraxis_semantic_scholar_key",
    placeholder: "s2k-...",
    consoleUrl: "https://www.semanticscholar.org/product/api",
    consoleLabel: "S2 API Portal",
    prefix: "s2k-",
    description: "Academic graph indexing, citation counts, and paper metadata.",
  },
  {
    id: "exa",
    name: "Exa.ai",
    badge: "Neural Embeddings",
    storageKey: "veraxis_exa_key",
    placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    consoleUrl: "https://dashboard.exa.ai/api-keys",
    consoleLabel: "Exa Dashboard",
    description: "Neural semantic search across scientific preprints and web corpora.",
  },
  {
    id: "serper",
    name: "Serper.dev",
    badge: "Scholar Search",
    storageKey: "veraxis_serper_key",
    placeholder: "API key...",
    consoleUrl: "https://serper.dev",
    consoleLabel: "Serper Console",
    description: "Google Scholar search integration and citation queries.",
  },
  {
    id: "jina",
    name: "Jina AI",
    badge: "Neural Reader",
    storageKey: "veraxis_jina_key",
    placeholder: "jina_...",
    consoleUrl: "https://jina.ai",
    consoleLabel: "Jina Console",
    prefix: "jina_",
    description: "Deep web content reader and structured article parsing.",
  },
];

/* -------------------------------------------------------------------------- */
/*  Centered Modal Settings Component (Zero Blur Backdrop, Pristine Standard) */
/* -------------------------------------------------------------------------- */

export default function VaultSettings({
  theme,
  onThemeChange,
  fontFamily,
  onFontFamilyChange,
  fontSize,
  onFontSizeChange,
  onClose,
}: VaultSettingsProps) {
  const [activeTab, setActiveTab] = useState<"appearance" | "keys" | "shortcuts">("appearance");
  const [colorMode, setColorMode] = useState<"light" | "dark">(() => theme || "dark");
  const [selectedPreset, setSelectedPreset] = useState<string>("oled-platinum");

  /* ---- Synchronize with external theme changes ---- */
  useEffect(() => {
    if (theme && theme !== colorMode) {
      setColorMode(theme);
      const presetId = getStoredThemePreset(theme);
      setSelectedPreset(presetId);
      applyThemePreset(presetId, theme);
    }
  }, [theme]);

  /* ---- Service Keys State ---- */
  const [keysState, setKeysState] = useState<Record<string, string>>({});
  const [inputsState, setInputsState] = useState<Record<string, string>>({});
  const [revealedState, setRevealedState] = useState<Record<string, boolean>>({});
  const [savedBanner, setSavedBanner] = useState<string | null>(null);
  const [errorsState, setErrorsState] = useState<Record<string, string>>({});
  const [serverServices, setServerServices] = useState<Record<string, { configured: boolean; masked: string }>>({});
  const [backendUrlInput, setBackendUrlInput] = useState(() => {
    return typeof window !== "undefined" ? localStorage.getItem("veraxis_api_url") || "" : "";
  });
  const [serverOnline, setServerOnline] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  const handleSaveBackendUrl = () => {
    const clean = backendUrlInput.trim().replace(/\/+$/, "");
    if (!clean) {
      localStorage.removeItem("veraxis_api_url");
      setSavedBanner("Default local/relative backend");
    } else {
      localStorage.setItem("veraxis_api_url", clean);
      setSavedBanner("Cloud backend endpoint");
    }
    setTimeout(() => setSavedBanner(null), 3000);

    // Test ping
    fetch(getApiUrl("/api/status"))
      .then((r) => {
        setServerOnline(r.ok);
      })
      .catch(() => setServerOnline(false));
  };

  /* ---- Detect standalone PWA / install capability ---- */
  useEffect(() => {
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as unknown as { standalone?: boolean }).standalone)
    );

    const checkPrompt = () => {
      setCanInstall(
        Boolean(
          (window as unknown as { __veraxisInstallPrompt?: unknown })
            .__veraxisInstallPrompt
        )
      );
    };

    checkPrompt();
    window.addEventListener("veraxis-install-available", checkPrompt);
    return () => window.removeEventListener("veraxis-install-available", checkPrompt);
  }, []);

  const handleTriggerInstall = async () => {
    const promptEvent = (
      window as unknown as {
        __veraxisInstallPrompt?: {
          prompt: () => Promise<void>;
          userChoice: Promise<{ outcome: string }>;
        };
      }
    ).__veraxisInstallPrompt;

    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice?.outcome === "accepted") {
          setCanInstall(false);
        }
      } catch (err) {
        console.warn("[PWA] Install prompt error:", err);
      }
    } else {
      alert(
        "To install VERAXIS:\n• On Windows: Click the install icon in your browser address bar\n• On Android: Tap Chrome menu (⋮) → 'Add to Home screen' / 'Install App'"
      );
    }
  };

  /* ---- Close handler ---- */
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      window.location.hash = "#/";
      window.dispatchEvent(new CustomEvent("veraxis:nav", { detail: "/" }));
    }
  }, [onClose]);

  /* ---- Esc shortcut to close modal ---- */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  /* ---- Load Initial Theme & Keys ---- */
  useEffect(() => {
    try {
      const storedTheme = (localStorage.getItem("veraxis-theme") || "dark") as "light" | "dark";
      setColorMode(storedTheme);
      const presetId = getStoredThemePreset(storedTheme);
      setSelectedPreset(presetId);
      applyThemePreset(presetId, storedTheme);

      // Load all stored keys
      const initialKeys: Record<string, string> = {};
      SERVICE_KEY_CONFIGS.forEach((cfg) => {
        const stored = localStorage.getItem(cfg.storageKey);
        if (stored) {
          initialKeys[cfg.id] = stored;
        }
      });
      setKeysState(initialKeys);

      // Fetch server keys status
      fetch(getApiUrl("/api/keys/services"))
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setServerServices(data);
        })
        .catch(() => {});
    } catch {
      /* ignore */
    }
  }, []);

  /* ---- Apply Preset Color ---- */
  const handleApplyPreset = (preset: ThemePreset) => {
    setSelectedPreset(preset.id);
    applyThemePreset(preset.id, colorMode);
  };

  /* ---- Switch Color Mode ---- */
  const handleToggleColorMode = (mode: "light" | "dark") => {
    setColorMode(mode);
    if (onThemeChange) {
      onThemeChange(mode);
    }
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("veraxis-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("veraxis-theme", "light");
    }
    const presetId = getStoredThemePreset(mode);
    setSelectedPreset(presetId);
    applyThemePreset(presetId, mode);
  };

  /* ---- Save Service Key ---- */
  const handleSaveServiceKey = async (cfg: ServiceKeyConfig, e?: FormEvent) => {
    if (e) e.preventDefault();
    const val = (inputsState[cfg.id] || "").trim();
    if (!val) {
      setErrorsState((prev) => ({ ...prev, [cfg.id]: "Please enter a valid key." }));
      return;
    }
    if (cfg.prefix && !val.startsWith(cfg.prefix)) {
      setErrorsState((prev) => ({
        ...prev,
        [cfg.id]: `Key must start with '${cfg.prefix}'.`,
      }));
      return;
    }

    setErrorsState((prev) => {
      const copy = { ...prev };
      delete copy[cfg.id];
      return copy;
    });

    try {
      localStorage.setItem(cfg.storageKey, val);
      if (cfg.id === "groq") {
        localStorage.setItem("veraxis_user_groq_key", val);
      }
      setKeysState((prev) => ({ ...prev, [cfg.id]: val }));
      setInputsState((prev) => ({ ...prev, [cfg.id]: "" }));
      setSavedBanner(cfg.name);
      setTimeout(() => setSavedBanner(null), 3000);

      // Sync with backend
      await fetch(getApiUrl("/api/keys/service"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: cfg.id, key: val }),
      }).catch(() => {});
    } catch {
      setErrorsState((prev) => ({ ...prev, [cfg.id]: "Failed to save to local storage." }));
    }
  };

  /* ---- Remove Service Key ---- */
  const handleRemoveServiceKey = async (cfg: ServiceKeyConfig) => {
    try {
      localStorage.removeItem(cfg.storageKey);
      if (cfg.id === "groq") {
        localStorage.removeItem("veraxis_user_groq_key");
      }
      setKeysState((prev) => {
        const copy = { ...prev };
        delete copy[cfg.id];
        return copy;
      });
      // Sync removal with backend
      await fetch(getApiUrl("/api/keys/service"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: cfg.id, key: "" }),
      }).catch(() => {});
    } catch {
      /* ignore */
    }
  };

  const activePresets = colorMode === "dark" ? DARK_PRESETS : LIGHT_PRESETS;

  /* -------------------------------------------------------------------------- */
  /*  Render Center Dialog Modal (Solid High-Contrast, Zero Backdrop Blur)       */
  /* -------------------------------------------------------------------------- */

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2.5 sm:p-6 animate-enter"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="relative flex w-full max-w-2xl max-h-[92vh] sm:max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Top Header — Clean, Zero Filler */}
        <header className="flex items-center justify-between border-b border-border bg-sunk/40 px-3.5 sm:px-5 py-3 sm:py-3.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/veraxis_logo.png"
              alt=""
              width={24}
              height={24}
              className="size-6 shrink-0 object-contain"
            />
            <h2 className="font-display text-sm font-bold tracking-tight text-foreground">
              Settings
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <kbd className="hidden sm:inline-flex items-center rounded border border-border bg-secondary/80 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              Esc
            </kbd>
            <button
              type="button"
              onClick={handleClose}
              className="uv-galaxy-icon-btn"
              aria-label="Close settings"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </header>

        {/* Tab Switcher (Clean Ergonomic Segmented Controls with Safe Scroll on Narrow Screens) */}
        <div className="flex items-center flex-nowrap gap-1.5 sm:gap-2 border-b border-border bg-secondary/20 px-3 sm:px-5 py-2 shrink-0 overflow-x-auto no-scrollbar">
          {[
            { id: "appearance", label: "Appearance", icon: Palette },
            { id: "keys", label: "API Keys", icon: KeyRound },
            { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id as any)}
              style={{ whiteSpace: "nowrap" }}
              className={cn(
                "inline-flex shrink-0 flex-nowrap whitespace-nowrap items-center gap-1.5 sm:gap-2 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-all cursor-pointer select-none",
                activeTab === id
                  ? "bg-card text-foreground shadow-xs border border-border/80 font-semibold"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              <span className="whitespace-nowrap inline-block">{label}</span>
            </button>
          ))}
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-3.5 sm:p-5 space-y-5 sm:space-y-6">
          {/* ================= TAB 1: APPEARANCE ================= */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              {/* Palette Header with Mode Toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Color Palette
                  </span>
                  <div className="inline-flex rounded-lg border border-border bg-secondary/50 p-0.5 gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleToggleColorMode("dark")}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                        colorMode === "dark"
                          ? "bg-card text-foreground shadow-xs border border-border/60 font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Moon className="size-3" />
                      <span>Dark</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleColorMode("light")}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                        colorMode === "light"
                          ? "bg-card text-foreground shadow-xs border border-border/60 font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Sun className="size-3" />
                      <span>Light</span>
                    </button>
                  </div>
                </div>

                {/* 2-Column Preset Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activePresets.map((preset) => {
                    const isSelected = selectedPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className={cn(
                          "flex items-center justify-between rounded-xl border border-border bg-card p-3 text-left transition-all cursor-pointer hover:border-foreground/30 hover:bg-secondary/30",
                          isSelected && "border-primary ring-1 ring-primary bg-primary/5"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="size-3.5 shrink-0 rounded-full border border-black/20 dark:border-white/20 shadow-xs"
                            style={{ backgroundColor: preset.previewColor }}
                          />
                          <span className="text-xs font-semibold text-foreground truncate">
                            {preset.name}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="size-3 shrink-0 text-primary stroke-[2.5]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Typography & Font Section */}
              <div className="space-y-3 pt-2 border-t border-border">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Typography
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {FONTS.map((font) => {
                    const isSelected = fontFamily === font.id;
                    return (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => onFontFamilyChange(font.id)}
                        className={cn(
                          "flex items-center justify-between rounded-xl border border-border bg-card p-3 text-left transition-all cursor-pointer hover:border-foreground/30 hover:bg-secondary/30",
                          isSelected && "border-primary ring-1 ring-primary bg-primary/5"
                        )}
                      >
                        <span
                          className="text-xs font-semibold text-foreground truncate"
                          style={{ fontFamily: font.family }}
                        >
                          {font.name}
                        </span>
                        {isSelected && (
                          <Check className="size-3 shrink-0 text-primary stroke-[2.5]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Scale Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <span className="font-mono text-xs text-muted-foreground">Text Scale</span>
                  <div className="inline-flex rounded-lg border border-border bg-secondary/50 p-0.5 gap-0.5">
                    {FONT_SIZES.map((sz) => (
                      <button
                        key={sz.id}
                        type="button"
                        onClick={() => onFontSizeChange(sz.id)}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition-all cursor-pointer",
                          fontSize === sz.id && "bg-card text-foreground shadow-xs border border-border/60 font-semibold"
                        )}
                      >
                        {sz.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: API KEYS (ALL RESEARCH SERVICES) ================= */}
          {activeTab === "keys" && (
            <div className="space-y-4">
              {/* Success Banner */}
              {savedBanner && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs font-medium text-emerald-400 flex items-center gap-2 animate-enter">
                  <Check className="size-4 shrink-0" />
                  <span>{savedBanner} saved successfully.</span>
                </div>
              )}

              {/* Cloud Backend Endpoint (Zero-BYOK Mode) */}
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Server className="size-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Cloud Backend Endpoint (Zero-BYOK Mode)
                    </span>
                  </div>
                  {serverOnline ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <Check className="size-3" /> Online
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Connect a cloud-hosted FastAPI server (Render, Railway, Cloudflare Tunnel) to enable instant research for all visitors without requiring personal API keys.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={backendUrlInput}
                    onChange={(e) => setBackendUrlInput(e.target.value)}
                    placeholder="https://your-backend.onrender.com (or empty for localhost)"
                    className="h-8.5 flex-1 rounded-lg border border-border bg-secondary/30 px-3 font-mono text-base sm:text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleSaveBackendUrl}
                    className="uv-btn-galaxy shrink-0 cursor-pointer"
                  >
                    <span className="uv-btn-galaxy-inner px-3 py-1.5 text-xs font-medium">
                      Save URL
                    </span>
                  </button>
                </div>
              </div>

              {/* Service Key Cards */}
              <div className="space-y-3">
                {SERVICE_KEY_CONFIGS.map((cfg) => {
                  const currentVal = keysState[cfg.id];
                  const isCustomActive = Boolean(currentVal);
                  const isServerActive = Boolean(serverServices[cfg.id]?.configured);
                  const isRevealed = Boolean(revealedState[cfg.id]);
                  const errorMsg = errorsState[cfg.id];
                  const maskedDisplay = currentVal
                    ? isRevealed
                      ? currentVal
                      : `${currentVal.slice(0, 6)}••••••••••••${currentVal.slice(-4)}`
                    : "";

                  return (
                    <div
                      key={cfg.id}
                      className="rounded-xl border border-border bg-card p-3.5 space-y-3 transition-colors hover:border-border/80"
                    >
                      {/* Card Header */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground truncate">
                            {cfg.name}
                          </h3>
                          <span className="hidden sm:inline-flex rounded border border-border bg-secondary/40 px-1.5 py-0.2 font-mono text-[10px] text-muted-foreground">
                            {cfg.badge}
                          </span>
                          {isCustomActive ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Custom Key
                            </span>
                          ) : isServerActive ? (
                            <span className="inline-flex items-center rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              Server Pool
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-border bg-secondary/30 px-2 py-0.5 text-[10px] font-medium text-muted-foreground/60">
                              Optional
                            </span>
                          )}
                        </div>

                        {/* Direct Link to Console */}
                        <a
                          href={cfg.consoleUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline shrink-0"
                          title={`Open ${cfg.consoleLabel}`}
                        >
                          <span>{cfg.consoleLabel}</span>
                          <ExternalLink className="size-3 opacity-80" />
                        </a>
                      </div>

                      {/* Card Content: Configured Key vs Form Input */}
                      {isCustomActive ? (
                        <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-secondary/25 px-3 py-2">
                          <code className="font-mono text-xs text-foreground tracking-wider truncate">
                            {maskedDisplay}
                          </code>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                setRevealedState((prev) => ({
                                  ...prev,
                                  [cfg.id]: !prev[cfg.id],
                                }))
                              }
                              className="rounded-md border border-border bg-card p-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                              title={isRevealed ? "Hide key" : "Reveal key"}
                            >
                              {isRevealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveServiceKey(cfg)}
                              className="rounded-md border border-destructive/30 bg-destructive/10 p-1.5 text-destructive hover:bg-destructive hover:text-white transition-colors cursor-pointer"
                              title="Remove key"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <form
                          onSubmit={(e) => handleSaveServiceKey(cfg, e)}
                          className="space-y-1.5"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="password"
                              value={inputsState[cfg.id] || ""}
                              onChange={(e) =>
                                setInputsState((prev) => ({
                                  ...prev,
                                  [cfg.id]: e.target.value,
                                }))
                              }
                              placeholder={cfg.placeholder}
                              className="h-8.5 flex-1 rounded-lg border border-border bg-secondary/30 px-3 font-mono text-base sm:text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
                            />
                            <button
                              type="submit"
                              className="uv-btn-galaxy shrink-0 cursor-pointer"
                            >
                              <span className="uv-btn-galaxy-inner px-3 py-1.5 text-xs font-medium">
                                Save
                              </span>
                            </button>
                          </div>
                          {errorMsg && (
                            <p className="text-[11px] text-destructive">{errorMsg}</p>
                          )}
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= TAB 3: SHORTCUTS ================= */}
          {activeTab === "shortcuts" && (
            <div className="space-y-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Keyboard Shortcuts
              </span>

              <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
                {[
                  { key: "Ctrl + B", label: "Toggle Sidebar" },
                  { key: "Ctrl + K", label: "New Inquiry" },
                  { key: "/", label: "Focus Composer" },
                  { key: "Esc", label: "Close Overlays" },
                  { key: "Enter", label: "Submit" },
                  { key: "Shift + Enter", label: "Newline" },
                ].map((sc, i) => (
                  <div key={i} className="flex items-center justify-between px-3.5 py-2.5 text-xs">
                    <span className="font-medium text-foreground">{sc.label}</span>
                    <kbd className="rounded border border-border bg-secondary/60 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground">
                      {sc.key}
                    </kbd>
                  </div>
                ))}
              </div>

              {/* Install App for Windows & Android */}
              <div className="rounded-xl border border-border bg-card p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Download className="size-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Install App (Windows / Android)
                    </span>
                  </div>
                  {isStandalone ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <Check className="size-3" /> Installed
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleTriggerInstall}
                      className="uv-btn-galaxy shrink-0 cursor-pointer text-xs"
                      title="Install app to your home screen or desktop"
                    >
                      <span className="uv-btn-galaxy-inner px-2.5 py-1 text-[11px] font-medium flex items-center gap-1.5">
                        <Download className="size-3" /> Install Now
                      </span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-muted-foreground">
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-secondary/30 border border-border/50">
                    <Monitor className="size-3.5 mt-0.5 text-foreground shrink-0" />
                    <div>
                      <strong className="text-foreground block font-medium">Windows Desktop</strong>
                      Click &quot;Install Now&quot; or click the install icon in your browser address bar.
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-secondary/30 border border-border/50">
                    <Smartphone className="size-3.5 mt-0.5 text-foreground shrink-0" />
                    <div>
                      <strong className="text-foreground block font-medium">Android Mobile</strong>
                      Tap &quot;Install Now&quot; or browser menu (⋮) → &quot;Install App&quot; / &quot;Add to Home screen&quot;.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
