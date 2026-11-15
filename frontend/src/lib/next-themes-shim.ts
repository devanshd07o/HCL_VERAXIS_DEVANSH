import { useEffect, useState } from "react";

export function useTheme() {
  const [theme, setThemeState] = useState(
    () => document.documentElement.getAttribute("data-theme") || "dark"
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setThemeState(document.documentElement.getAttribute("data-theme") || "dark");
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  const setTheme = (next) => {
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("veraxis-theme", next);
  };

  return {
    theme,
    resolvedTheme: theme,
    systemTheme: theme,
    setTheme,
  };
}
