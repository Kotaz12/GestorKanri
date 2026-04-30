/* Kanri PWA service worker — network-first for API, cache-first for static assets */
const CACHE_NAME = "kanri-v1";
const STATIC_ASSETS = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(STATIC_ASSETS)));
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
            ),
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const req = event.request;
    if (req.method !== "GET") return;
    const url = new URL(req.url);

    // Never intercept API calls
    if (url.pathname.startsWith("/api")) return;

    // Cache-first for same-origin static assets
    if (url.origin === self.location.origin) {
        event.respondWith(
            caches.match(req).then(
                (cached) =>
                    cached ||
                    fetch(req)
                        .then((res) => {
                            const copy = res.clone();
                            caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
                            return res;
                        })
                        .catch(() => caches.match("/index.html")),
            ),
        );
    }
});
