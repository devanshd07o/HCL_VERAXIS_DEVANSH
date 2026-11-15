export interface ThemePreset {
  id: string;
  name: string;
  dot1: string;
  dot2: string;
  bg: string;
  card: string;
  secondary: string;
  muted: string;
  border: string;
  primary: string;
  primaryHover: string;
  gradient: string;
  glow: string;
}

/* -------------------------------------------------------------------------- */
/*  6 GitHub Best Developer Research Dark Palettes (Zero Brand Names)         */
/*  Every single theme has a completely different hue, background and surface */
/*  Default has ZERO blur — crisp, high-contrast, distraction-free.           */
/* -------------------------------------------------------------------------- */

export const DARK_PRESETS: ThemePreset[] = [
  {
    id: "oled-platinum",
    name: "OLED Platinum",
    dot1: "#FFFFFF",
    dot2: "#71717A",
    bg: "#000000",
    card: "#0A0A0C",
    secondary: "#141416",
    muted: "#101012",
    border: "rgba(255, 255, 255, 0.14)",
    primary: "#F4F4F5",
    primaryHover: "#FFFFFF",
    gradient: "linear-gradient(135deg, #FFFFFF, #D4D4D8 50%, #71717A)",
    glow: "rgba(255, 255, 255, 0.10)",
  },
  {
    id: "carbon-slate",
    name: "Carbon Slate",
    dot1: "#E2E8F0",
    dot2: "#64748B",
    bg: "#0B0D11",
    card: "#13171F",
    secondary: "#1A202C",
    muted: "#161B24",
    border: "rgba(226, 232, 240, 0.18)",
    primary: "#E2E8F0",
    primaryHover: "#F8FAFC",
    gradient: "linear-gradient(135deg, #F8FAFC, #E2E8F0 50%, #94A3B8)",
    glow: "rgba(226, 232, 240, 0.12)",
  },
];

/* -------------------------------------------------------------------------- */
/*  2 Clean High-Contrast Light Palettes (Graphite Minimal default, Sakura Rose) */
/* -------------------------------------------------------------------------- */

export const LIGHT_PRESETS: ThemePreset[] = [
  {
    id: "graphite-minimal",
    name: "Graphite Minimal",
    dot1: "#27272A",
    dot2: "#A1A1AA",
    bg: "#F8F9FA",
    card: "#FFFFFF",
    secondary: "#ECEFF1",
    muted: "#CFD8DC",
    border: "#B0BEC5",
    primary: "#263238",
    primaryHover: "#101416",
    gradient: "linear-gradient(135deg, #37474F, #263238 50%, #78909C)",
    glow: "rgba(38, 50, 56, 0.10)",
  },
  {
    id: "sakura-rose",
    name: "Sakura Rose",
    dot1: "#E11D48",
    dot2: "#FDA4AF",
    bg: "#FFF5F7",
    card: "#FFFFFF",
    secondary: "#FFE4E9",
    muted: "#FED0D9",
    border: "#FBB4C4",
    primary: "#E11D48",
    primaryHover: "#BE123C",
    gradient: "linear-gradient(135deg, #E11D48, #BE123C 50%, #FB7185)",
    glow: "rgba(225, 29, 72, 0.12)",
  },
];

/* -------------------------------------------------------------------------- */
/*  Universal Theme Application Engine                                        */
/* -------------------------------------------------------------------------- */

export function applyThemePreset(presetId: string, mode: "light" | "dark"): void {
  const list = mode === "dark" ? DARK_PRESETS : LIGHT_PRESETS;
  const p = list.find((x) => x.id === presetId) || list[0];
  if (!p) return;

  const root = document.documentElement;

  // 1. Structural Surfaces & Backgrounds
  root.style.setProperty("--background", p.bg);
  root.style.setProperty("--bg-void", p.bg);
  root.style.setProperty("--card", p.card);
  root.style.setProperty("--bg-surface", p.card);
  root.style.setProperty("--popover", p.card);
  root.style.setProperty("--secondary", p.secondary);
  root.style.setProperty("--bg-graphite", p.secondary);
  root.style.setProperty("--bg-sunk", p.muted);
  root.style.setProperty("--muted", p.muted);
  root.style.setProperty("--border", p.border);
  root.style.setProperty("--line", p.border);
  root.style.setProperty("--line-strong", p.border);

  // 2. Accent & Primary (Non-highlighting, high legibility)
  root.style.setProperty("--primary", p.primary);
  root.style.setProperty("--primary-hover", p.primaryHover);
  root.style.setProperty("--primary-text", p.primary);
  root.style.setProperty("--ring", p.primary);
  root.style.setProperty("--gold", p.primary);
  root.style.setProperty("--primary-soft", `${p.primary}12`);
  root.style.setProperty("--primary-soft-border", `${p.primary}25`);

  // 3. Shadows & Edge Highlights
  root.style.setProperty(
    "--shadow-solid",
    mode === "dark" ? "#000000" : "#E2E8F0"
  );
  root.style.setProperty(
    "--edge-highlight",
    mode === "dark" ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.95)"
  );

  // 4. Uiverse Galaxy Gradient & Ambient Glow
  root.style.setProperty("--uv-gradient", p.gradient);
  root.style.setProperty("--uv-glow", p.glow);

  // Save per mode so switching theme modes never wipes out the user's chosen palette!
  if (mode === "dark") {
    localStorage.setItem("veraxis-preset-dark", p.id);
  } else {
    localStorage.setItem("veraxis-preset-light", p.id);
  }
  localStorage.setItem("veraxis-preset", p.id);
}

export function getStoredThemePreset(mode: "light" | "dark"): string {
  const key = mode === "dark" ? "veraxis-preset-dark" : "veraxis-preset-light";
  const stored = localStorage.getItem(key) || localStorage.getItem("veraxis-preset");
  const list = mode === "dark" ? DARK_PRESETS : LIGHT_PRESETS;
  if (stored && list.some((x) => x.id === stored)) {
    return stored;
  }
  return list[0].id;
}
