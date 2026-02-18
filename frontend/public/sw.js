/**
 * MEDFINANCE360 Service Worker
 * Author: Lubuto Chabusha
 * Developed: 2026
 *
 * Strategy:
 *  - Pre-caches ALL Vite build assets (hashed JS/CSS) at install time.
 *    The __PRECACHE_ASSETS__ placeholder is replaced by vite.config.js
 *    after build with the actual asset list from the Vite manifest.
 *  - Static assets: Cache-first (served from pre-cache)
 *  - API GET requests: Network-first, fall back to cache
 *  - Mutations (POST/PUT/DELETE/PATCH): Passed through — apiClient.js queues them
 *  - Navigation: Always serve index.html from cache (SPA routing)
 */

const CACHE_NAME = 'medfinance360-v3';

// Injected by vite.config.js at build time — contains all hashed asset URLs.
// Falls back to just the root in dev mode (runtime caching handles the rest).
const PRECACHE_ASSETS = self.__PRECACHE_ASSETS__ || ['/', '/index.html'];

// ─── Install: pre-cache everything ────────────────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // addAll fails if any single request fails, so we add individually
            // to be resilient against any single asset 404
            return Promise.allSettled(
                PRECACHE_ASSETS.map((url) =>
                    cache.add(url).catch((err) => {
                        console.warn(`[SW] Failed to pre-cache ${url}:`, err.message);
                    })
                )
            );
        })
    );
    self.skipWaiting();
});

// ─── Activate: clean up old caches ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
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

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET — mutations handled by apiClient offline queue
    if (request.method !== 'GET') return;

    // API requests: network-first, fall back to cache
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Navigation (page load/reload): always serve index.html for SPA routing
    if (request.mode === 'navigate') {
        event.respondWith(serveAppShell(request));
        return;
    }

    // All other assets (JS, CSS, images): cache-first
    event.respondWith(cacheFirst(request));
});

// ─── Background Sync ──────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
    if (event.tag === 'medfinance-sync') {
        event.waitUntil(notifyClientsToSync());
    }
});

async function notifyClientsToSync() {
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((client) => {
        client.postMessage({ type: 'TRIGGER_SYNC' });
    });
}

// ─── Strategies ───────────────────────────────────────────────────────────────

async function serveAppShell(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
            cache.put('/index.html', response.clone());
        }
        return response;
    } catch {
        // Offline: serve cached index.html for any route (SPA)
        const cached =
            (await caches.match('/index.html')) ||
            (await caches.match('/')) ||
            (await caches.match(request));
        if (cached) return cached;
        return new Response(
            `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>MEDFINANCE360</title>
       <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;
       min-height:100vh;margin:0;background:#0f172a;color:#e2e8f0;text-align:center;}
       h2{color:#60a5fa;}p{color:#94a3b8;}</style></head>
       <body><div><h2>📡 You are offline</h2>
       <p>MEDFINANCE360 is loading from cache.<br>If this persists, please reconnect and reload once.</p>
       </div></body></html>`,
            { status: 200, headers: { 'Content-Type': 'text/html' } }
        );
    }
}

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        return new Response('Asset unavailable offline', { status: 503 });
    }
}

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
