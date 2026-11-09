// Service worker minimal des Nice Boys.
// - Aucune page du site n'est mise en cache : tout passe par le réseau, jamais de contenu périmé.
// - Seules /offline.html et le logo sont précachés, pour afficher une page "Hors ligne"
//   quand une navigation échoue faute de réseau.
// Pour forcer la mise à jour de la page hors ligne : incrémenter CACHE_NAME.
const CACHE_NAME = "niceboys-offline-v2";
const OFFLINE_URL = "/offline.html";
const LOGO_URL = "/logo.webp";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll([OFFLINE_URL, LOGO_URL].map((url) => new Request(url, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Navigation preload : la page est demandée au réseau en parallèle du démarrage du SW (pas de ralentissement)
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      for (const key of await caches.keys()) {
        if (key !== CACHE_NAME) await caches.delete(key);
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Navigation (ouverture d'une page) : réseau, et page hors ligne en cas d'échec
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const preloaded = await event.preloadResponse;
          if (preloaded) return preloaded;
          return await fetch(request);
        } catch {
          return (await caches.match(OFFLINE_URL)) || Response.error();
        }
      })()
    );
    return;
  }

  // Logo affiché par la page hors ligne : réseau d'abord, cache en secours
  if (new URL(request.url).pathname === LOGO_URL) {
    event.respondWith(fetch(request).catch(() => caches.match(LOGO_URL)));
  }
  // Tout le reste : comportement normal du navigateur (le SW n'intervient pas)
});
