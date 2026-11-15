import { useEffect, useState } from "react";

export interface LiquidGlassOptions {
  refraction?: number;
  aberration?: number;
  bevelDepth?: number;
  bevelWidth?: number;
  frost?: number;
  shadow?: boolean;
  specular?: boolean;
  interaction?: "none" | "fluid";
  interactionStrength?: number;
  interactionRadius?: number;
  interactionViscosity?: number;
  tint?: string | null;
  resolution?: number;
  zIndex?: number;
  theme?: "light" | "dark";
}

/**
 * useLiquidGlass — Turn any fixed/sticky element into a real WebGPU/WebGL liquid glass pane.
 * Powered by naughtyduk/liquidGL (Apple Liquid Glass simulation with real-time refraction & chromatic aberration).
 */
export function useLiquidGlass(
  selector: string,
  options: LiquidGlassOptions = {},
  deps: any[] = []
) {
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark";
    return document.documentElement.classList.contains("dark") ||
      document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const observer = new MutationObserver(() => {
      const isDark =
        document.documentElement.classList.contains("dark") ||
        document.documentElement.getAttribute("data-theme") === "dark";
      setCurrentTheme(isDark ? "dark" : "light");
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let destroyed = false;
    let instances: any = null;

    const timer = setTimeout(async () => {
      if (destroyed) return;
      try {
        const el = document.querySelector(selector);
        if (!el) return;

        const liquidGLModule = await import("liquid-gl");
        const liquidGL = liquidGLModule.default || liquidGLModule;

        const isDark =
          options.theme === "dark" ||
          (options.theme !== "light" && currentTheme === "dark");

        const defaultTint = isDark
          ? "rgba(9, 11, 16, 0.35)"
          : "rgba(255, 255, 255, 0.45)";

        instances = liquidGL({
          target: selector,
          snapshot: "body",
          resolution: options.resolution ?? 1.5,
          refraction: options.refraction ?? 0.012,
          aberration: options.aberration ?? 0.02,
          bevelDepth: options.bevelDepth ?? 0.06,
          bevelWidth: options.bevelWidth ?? 0.1,
          frost: options.frost ?? 0,
          shadow: options.shadow ?? false,
          specular: options.specular ?? true,
          interaction: options.interaction ?? "none",
          interactionStrength: options.interactionStrength ?? 0.3,
          interactionRadius: options.interactionRadius ?? 0.25,
          tint: options.tint !== undefined ? options.tint : defaultTint,
          zIndex: options.zIndex,
        });
      } catch (err) {
        console.warn("[liquidGL] WebGL lens fallback:", err);
      }
    }, 120);

    return () => {
      destroyed = true;
      clearTimeout(timer);
      try {
        if (Array.isArray(instances)) {
          instances.forEach((inst: any) => inst?.destroy?.());
        } else if (instances?.destroy) {
          instances.destroy();
        }
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selector,
    currentTheme,
    options.theme,
    options.refraction,
    options.interaction,
    options.tint,
    ...deps,
  ]);
}
