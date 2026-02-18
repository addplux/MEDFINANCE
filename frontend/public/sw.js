/**
 * MEDFINANCE360 Service Worker
 * Author: Lubuto Chabusha
 * Developed: 2026
 *
 * Strategy:
 *  - Static assets (JS, CSS, fonts, images): Cache-first with runtime population.
 *    On first visit (online), all assets are cached as they load.
 *    On subsequent visits (offline), served from cache.
 *  - API GET requests: Network-first, fall back to cache.
 *  - Mutations (POST/PUT/DELETE/PATCH): Passed through — apiClient.js handles queuing.
 *  - Navigation requests: Cache-first, always serve index.html for SPA routing.
 */

const CACHE_NAME = 'medfinance360-v2';

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
    // Pre-cache the root HTML immediately
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.add('/');
        }).catch(() => {
            // Ignore if offline during install (SW will still activate)
        })
    );
    self.skipWaiting();
});

// ─── Activate ─────────────────────────────────────────────────────────────────
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

    // Only handle same-origin requests (and API calls)
    if (url.origin !== self.location.origin && !url.pathname.startsWith('/api/')) {
        return;
    }

    // Skip non-GET requests — mutations are handled by apiClient offline queue
    if (request.method !== 'GET') return;

    // API requests: network-first, fall back to cache
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Navigation requests (page loads/reloads): serve index.html from cache for SPA
    if (request.mode === 'navigate') {
        event.respondWith(serveAppShell(request));
        return;
    }

    // Static assets (JS, CSS, images, fonts): cache-first with runtime caching
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

/**
 * For SPA navigation: try network first, fall back to cached index.html.
 * This ensures page reloads work offline for any route.
 */
async function serveAppShell(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
            // Also cache as /index.html for fallback
            cache.put('/index.html', response.clone());
        }
        return response;
    } catch {
        // Offline: serve cached index.html for any navigation (SPA routing)
        const cached =
            (await caches.match('/index.html')) ||
            (await caches.match('/')) ||
            (await caches.match(request));
        if (cached) return cached;
        return new Response(
            '<html><body><h2>MEDFINANCE360 — You are offline</h2><p>Please connect to the internet and reload.</p></body></html>',
            { status: 503, headers: { 'Content-Type': 'text/html' } }
        );
    }
}

/**
 * Cache-first: serve from cache if available, otherwise fetch and cache.
 */
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

/**
 * Network-first: try network, fall back to cache.
 */
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
