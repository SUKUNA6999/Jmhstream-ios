const CACHE_NAME = "jmh-stream-v2";
const STATIC_ASSETS = [
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/favicon.ico",
];

// ── Rate-limit map (SW-side, per-origin) ─────────────────
// Prevents the service worker from forwarding abuse traffic
const requestCounts = new Map(); // path → { count, resetAt }
const SW_RATE_LIMIT = 60;    // requests per window
const SW_RATE_WINDOW = 60000; // 1 minute

// Periodically purge expired entries to prevent unbounded memory growth.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requestCounts) {
    if (now > entry.resetAt) requestCounts.delete(key);
  }
}, 5 * 60000);

function isRateLimited(path) {
  const now = Date.now();
  const entry = requestCounts.get(path) || { count: 0, resetAt: now + SW_RATE_WINDOW };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + SW_RATE_WINDOW;
  }
  entry.count++;
  requestCounts.set(path, entry);
  return entry.count > SW_RATE_LIMIT;
}

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
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip admin routes — admin panel is NOT part of the PWA
  if (url.pathname.startsWith("/jmh-admin")) return;

  // Skip API calls — never cache these; also apply SW-side rate limiting
  if (url.pathname.startsWith("/api/")) {
    if (isRateLimited(url.pathname)) {
      event.respondWith(
        new Response(JSON.stringify({ error: "Too many requests" }), {
          status: 429,
          headers: { "Content-Type": "application/json", "Retry-After": "60" },
        })
      );
    }
    // Let API calls pass through normally (no caching)
    return;
  }

  // Network-first strategy for navigation requests (SPA page loads)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) =>
            cache.put("/index.html", clone)
          );
          return response;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Cache-first strategy for static assets (JS, CSS, images, fonts)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) =>
            cache.put(event.request, clone)
          );
        }
        return response;
      });
    })
  );
});
