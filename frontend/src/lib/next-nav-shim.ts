import { useEffect, useState } from "react";

function readRouteFromHash(): string {
  const hash = window.location.hash;
  if (hash.startsWith("#/")) {
    return hash.slice(1);
  }
  return "/";
}

export function usePathname(): string {
  const [path, setPath] = useState<string>(() => readRouteFromHash());

  useEffect(() => {
    const onNav = (e: Event) => {
      const custom = e as CustomEvent<string>;
      if (typeof custom.detail === "string") {
        setPath(custom.detail);
      }
    };
    const onHash = () => setPath(readRouteFromHash());
    window.addEventListener("veraxis:nav", onNav);
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener("veraxis:nav", onNav);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  return path;
}
