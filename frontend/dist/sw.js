const CACHE_NAME = "veraxis-pwa-v2";
const STATIC_ASSETS = ["/manifest.json", "/assets/veraxis_logo.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Always let HTML navigation, API endpoints, and dynamic requests pass straight to network
  if (
    event.request.method !== "GET" ||
    event.request.mode === "navigate" ||
    event.request.url.includes("/api/") ||
    event.request.url.endsWith("/") ||
    event.request.url.includes(".html")
  ) {
    return;
  }

  // Network-first for static assets with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
