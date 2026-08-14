/**
 * Offline-first service worker.
 *
 * Cell service is unreliable at the pyramids and along the North Coast, which is exactly
 * where the app is needed. Every same-origin asset is cached on first visit and served
 * from cache thereafter, so a dropped signal never blocks a price check.
 *
 * Live currency rates are deliberately NOT cached here -- lib/currency.ts owns their
 * freshness via localStorage, and a stale rate cached at the SW layer would be invisible.
 */

const CACHE = "egypt-prices-v6";

/**
 * Pre-cache the shell, every page route and every product photo.
 *
 * Two things would otherwise be missed. The CSS and JS of the first page load are fetched
 * before this worker controls the page, so they never pass through the fetch handler; and
 * product photos are lazy-loaded, so any below the fold are never requested at all. Both
 * would leave a tourist with a broken page exactly when they are offline and need it.
 *
 * out/precache.json is generated from the real build output by scripts/gen-precache.mjs,
 * so the list cannot drift from what was actually deployed.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      await cache.add("/");
      try {
        const response = await fetch("/precache.json");
        const paths = await response.json();
        // Individually, so one missing photo cannot reject the whole install.
        await Promise.all(paths.map((p) => cache.add(p).catch(() => {})));
      } catch {
        // No manifest: the app still works, images just fill in as they are seen.
      }
    }),
  );
  // Take over immediately rather than waiting for every tab to close.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/**
 * Find a cached response, tolerating URL shape differences.
 *
 * Hosts disagree about trailing slashes: the precache lists "/price/dasani-15l" but the
 * app may navigate to "/price/dasani-15l/", and a static export stores the file as
 * "/price/dasani-15l.html". An exact match alone silently misses, and the page falls back
 * to the homepage offline -- which looks like the app losing the user's place.
 */
async function matchCached(request) {
  const exact = await caches.match(request);
  if (exact) return exact;

  const url = new URL(request.url);
  const path = url.pathname;
  const variants = [
    path.endsWith("/") ? path.slice(0, -1) : `${path}/`,
    path.endsWith("/") ? `${path.slice(0, -1)}.html` : `${path}.html`,
  ];
  for (const variant of variants) {
    if (!variant || variant === path) continue;
    const hit = await caches.match(variant);
    if (hit) return hit;
  }
  return undefined;
}

/**
 * How long a navigation waits for the network before falling back to cache.
 *
 * Long enough for ordinary mobile data to answer, short enough that a dead zone at the
 * pyramids still renders the cached page without a perceptible hang.
 */
const NAV_TIMEOUT_MS = 3500;

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // let rate lookups hit the network

  // Pages go network-first. Cache-first HTML meant every deploy was one visit behind:
  // the first load served the previous build and only refreshed the cache in the
  // background, so updates appeared on the SECOND visit -- which reads as "the site
  // didn't update". Assets are content-hashed so staleness cannot bite them the same way.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cachedPromise = matchCached(request);
        const network = fetch(request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => null);

        const timer = new Promise((resolve) =>
          setTimeout(() => resolve(null), NAV_TIMEOUT_MS),
        );
        const fresh = await Promise.race([network, timer]);
        if (fresh) return fresh;

        // Slow or offline: serve cache now; the fetch above still updates the cache for
        // the next visit if it eventually completes.
        const cached = await cachedPromise;
        return cached ?? (await network) ?? caches.match("/");
      })(),
    );
    return;
  }

  // Everything else (hashed JS/CSS, photos, data) stays cache-first for speed.
  event.respondWith(
    matchCached(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached ?? caches.match("/"));

      return cached ?? network;
    }),
  );
});
