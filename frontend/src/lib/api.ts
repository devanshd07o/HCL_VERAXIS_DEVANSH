/**
 * Dynamic API endpoint resolver.
 * Allows Veraxis frontend to point to a remote cloud backend (Render, Railway, Cloudflare Tunnel)
 * without requiring visitors to enter their own API keys (Zero-BYOK mode).
 */
export function getApiUrl(path: string): string {
  const customBase =
    typeof window !== "undefined"
      ? window.localStorage.getItem("veraxis_api_url")?.trim()
      : undefined;

  const envBase = (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env
    ?.VITE_API_URL?.trim();

  const base = customBase || envBase || "";
  if (!base) return path;

  const cleanBase = base.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}
