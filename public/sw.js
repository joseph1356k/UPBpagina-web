/**
 * UPB Ceremonias — Service Worker
 *
 * Minimal hand-rolled SW (no Workbox) for the scanner PWA.
 *
 * Strategies:
 *   - Static assets (_next/static, /icons, manifest)  → cache-first
 *   - Pages (/scanner, /)                              → network-first w/ cache fallback
 *   - API POSTs                                        → never cached (let app handle queue)
 *   - Everything else                                  → network-first
 */

const VERSION = "v1";
const STATIC_CACHE = `upb-static-${VERSION}`;
const PAGE_CACHE = `upb-pages-${VERSION}`;

// Pre-cache the scanner shell on install
const PRECACHE_URLS = [
  "/",
  "/scanner",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icon-maskable.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGE_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.endsWith(VERSION))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Bypass cache for non-GET (mutations, OTPs, scans, etc.)
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never cache API routes — they're real-time
  if (url.pathname.startsWith("/api/")) return;

  // Static assets — cache-first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icon") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/favicon.ico"
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // HTML pages — network-first, fall back to cached version when offline
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(networkFirst(request, PAGE_CACHE));
    return;
  }
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const fresh = await fetch(request);
    if (fresh.ok && fresh.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch {
    return Response.error();
  }
}

async function networkFirst(request, cacheName) {
  try {
    const fresh = await fetch(request);
    if (fresh.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Final fallback: cached root (best-effort offline landing)
    const fallback = await caches.match("/scanner");
    if (fallback) return fallback;
    return new Response("Sin conexión", { status: 503 });
  }
}
