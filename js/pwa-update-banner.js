/*
 * Bannière de mise à jour Chronos-Services.
 * Écoute l'événement custom envoyé par pwa-register.js quand un nouveau
 * Service Worker est en attente, et déclenche skipWaiting() au clic.
 * Priorité : l'utilisateur ne doit jamais être bloqué sur une ancienne
 * version sans le savoir — cette bannière ne retarde jamais la réception
 * des mises à jour, elle se contente de proposer de les activer.
 */
(function () {
  if (!("serviceWorker" in navigator)) return;

  let shown = false;

  function injectStyles() {
    if (document.getElementById("chronos-pwa-update-styles")) return;
    const style = document.createElement("style");
    style.id = "chronos-pwa-update-styles";
    style.textContent = `
      .chronos-pwa-update{
        position:fixed;left:12px;right:12px;top:12px;z-index:9999;
        max-width:360px;margin:0 auto;
        display:flex;align-items:center;gap:10px;
        background:var(--orange,#FF5700);color:#fff;
        padding:9px 10px 9px 14px;border-radius:100px;
        box-shadow:0 10px 26px rgba(255,87,0,.32);
        font-family:'DM Sans',system-ui,-apple-system,sans-serif;
        animation:chronos-pwa-pop .2s cubic-bezier(.2,.8,.2,1);
      }
      @keyframes chronos-pwa-pop{from{transform:translateY(-10px) scale(.98);opacity:0;}to{transform:translateY(0) scale(1);opacity:1;}}
      .chronos-pwa-update__text{flex:1;font-size:.78rem;font-weight:700;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .chronos-pwa-update button{
        flex-shrink:0;font-family:inherit;cursor:pointer;border:none;border-radius:100px;
        padding:6px 13px;font-size:.74rem;font-weight:700;
        background:var(--green-dark,#094102);color:#fff;
      }
    `;
    document.head.appendChild(style);
  }

  function showUpdateBanner(registration) {
    if (shown) return;
    shown = true;
    injectStyles();

    const banner = document.createElement("div");
    banner.className = "chronos-pwa-update";
    banner.setAttribute("role", "status");
    banner.innerHTML = `
      <span class="chronos-pwa-update__text">Nouvelle version disponible</span>
      <button type="button">Mettre à jour</button>
    `;
    banner.querySelector("button").addEventListener("click", () => {
      const waitingWorker = registration.waiting;
      if (waitingWorker) {
        waitingWorker.postMessage({ action: "skipWaiting" });
      }
      banner.remove();
    });
    document.body.appendChild(banner);
  }

  window.addEventListener("chronos:sw-update-available", (event) => {
    showUpdateBanner(event.detail.registration);
  });
})();
