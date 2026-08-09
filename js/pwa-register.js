/*
 * Enregistrement du Service Worker Chronos-Services.
 * La détection d'une mise à jour disponible est déléguée à
 * pwa-update-banner.js (séparation des responsabilités).
 */
(function () {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("[pwa] Service Worker enregistré :", registration.scope);

        // Un SW est déjà en attente au moment de l'enregistrement
        if (registration.waiting) {
          window.dispatchEvent(
            new CustomEvent("chronos:sw-update-available", { detail: { registration } })
          );
        }

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // Nouvelle version installée et en attente : on prévient l'app
              window.dispatchEvent(
                new CustomEvent("chronos:sw-update-available", { detail: { registration } })
              );
            }
          });
        });
      })
      .catch((error) => {
        console.error("[pwa] Échec de l'enregistrement du Service Worker :", error);
      });

    // Une fois que le nouveau SW prend le contrôle (après skipWaiting),
    // on recharge pour servir la nouvelle version.
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
})();
