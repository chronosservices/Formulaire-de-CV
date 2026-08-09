/*
 * Service Worker — Chronos-Services
 * Stratégie :
 *  - cache-first (+ mise en cache à la volée) pour les assets statiques
 *    (CSS, JS, polices, images)
 *  - network-first pour /.netlify/functions/groq-proxy, formspree.io et
 *    les pages HTML (avec repli sur le cache / offline.html si hors-ligne)
 *  - le nouveau SW reste en "waiting" tant que l'utilisateur n'a pas
 *    confirmé la mise à jour (voir js/pwa-update-banner.js)
 */

const CACHE_VERSION = "v1";
const CACHE_NAME = `chronos-cv-cache-${CACHE_VERSION}`;

// Coquille minimale pré-cachée à l'install (pages + manifest + icônes + scripts PWA)
const PRECACHE_ASSETS = [
  "/index.html",
  "/interface-new.html",
  "/Interview.html",
  "/catalogue de CV.html",
  "/formulaire-cv-scanner.html",
  "/formulaire-lettre.html",
  "/formulaire-mise-a-jour-cv.html",
  "/manifest.json",
  "/offline.html",
  "/js/pwa-register.js",
  "/js/pwa-install-banner.js",
  "/js/pwa-update-banner.js",
  "/Logo/icon-192.png",
  "/Logo/icon-512.png",
  "/Logo/icon-512-maskable.png",
  "/Logo/apple-touch-icon.png"
];

const isApiOrFormRequest = (url) =>
  url.includes("/.netlify/functions/groq-proxy") || url.includes("formspree.io");

const isHtmlRequest = (request) =>
  request.mode === "navigate" ||
  (request.headers.get("accept") || "").includes("text/html");

self.addEventListener("install", (event) => {
  // IMPORTANT : pas de self.skipWaiting() ici — le nouveau SW doit rester
  // en attente tant que l'utilisateur n'a pas cliqué "Mettre à jour".
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Précache best-effort : un seul asset manquant/404 ne doit pas faire
      // échouer toute l'installation du service worker.
      Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn("[sw] précache échouée pour", url, err);
          })
        )
      )
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name.startsWith("chronos-cv-cache-") && name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Le SW en attente écoute ce message envoyé par pwa-update-banner.js
// quand l'utilisateur clique sur "Mettre à jour".
self.addEventListener("message", (event) => {
  if (event.data && event.data.action === "skipWaiting") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return; // laisser passer POST/PUT (Formspree, groq-proxy) sans interception
  }

  const url = request.url;

  // --- Network-first : API groq-proxy, Formspree, pages HTML ---
  if (isApiOrFormRequest(url)) {
    event.respondWith(fetch(request));
    return;
  }

  if (isHtmlRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/offline.html"))
        )
    );
    return;
  }

  // --- Cache-first : CSS, JS, polices, images et autres assets statiques ---
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
