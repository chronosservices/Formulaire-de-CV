/*
 * Bannière d'installation Chronos-Services.
 * Réutilise les variables CSS du site (--green-dark, --orange, --radius-md)
 * quand elles sont définies sur la page ; sinon repli sur les couleurs réelles.
 */
(function () {
  const DISMISS_KEY = "chronos:installDismissedAt";
  const DISMISS_DAYS = 7;

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true; // iOS Safari

  if (isStandalone) return; // déjà installée, rien à faire

  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  const isSafari =
    isIOS && /safari/i.test(window.navigator.userAgent) && !/crios|fxios/i.test(window.navigator.userAgent);

  function wasRecentlyDismissed() {
    const last = localStorage.getItem(DISMISS_KEY);
    if (!last) return false;
    const elapsedMs = Date.now() - parseInt(last, 10);
    return elapsedMs < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  }

  function injectStyles() {
    if (document.getElementById("chronos-pwa-banner-styles")) return;
    const style = document.createElement("style");
    style.id = "chronos-pwa-banner-styles";
    style.textContent = `
      .chronos-pwa-banner{
        position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;
        max-width:360px;margin:0 auto;
        display:flex;align-items:center;gap:10px;
        background:var(--green-dark,#094102);color:#fff;
        padding:10px;border-radius:16px;
        box-shadow:0 10px 30px rgba(0,0,0,.28);
        font-family:'DM Sans',system-ui,-apple-system,sans-serif;
        animation:chronos-pwa-pop .2s cubic-bezier(.2,.8,.2,1);
      }
      @keyframes chronos-pwa-pop{from{transform:translateY(10px) scale(.98);opacity:0;}to{transform:translateY(0) scale(1);opacity:1;}}
      .chronos-pwa-banner__icon{
        width:38px;height:38px;border-radius:11px;flex-shrink:0;
        background:rgba(255,255,255,.1);object-fit:cover;
      }
      .chronos-pwa-banner__body{flex:1;min-width:0;}
      .chronos-pwa-banner__title{
        font-family:'Sora',system-ui,sans-serif;font-size:.82rem;font-weight:700;
        line-height:1.25;margin:0 0 1px;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
      }
      .chronos-pwa-banner__subtitle{
        font-size:.72rem;line-height:1.3;color:rgba(255,255,255,.68);
        display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;
      }
      .chronos-pwa-banner__install{
        flex-shrink:0;font-family:inherit;cursor:pointer;border:none;border-radius:100px;
        background:var(--orange,#FF5700);color:#fff;
        padding:7px 13px;font-size:.74rem;font-weight:700;white-space:nowrap;
      }
      .chronos-pwa-banner__close{
        flex-shrink:0;cursor:pointer;border:none;background:transparent;color:rgba(255,255,255,.5);
        width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;
        font-size:1rem;line-height:1;padding:0;
      }
      .chronos-pwa-banner__close:hover{background:rgba(255,255,255,.12);color:#fff;}
    `;
    document.head.appendChild(style);
  }

  function dismiss(banner) {
    banner.remove();
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }

  function buildBanner({ title, subtitle, installLabel, onInstall }) {
    injectStyles();
    const banner = document.createElement("div");
    banner.className = "chronos-pwa-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Installer Chronos-Services");
    banner.innerHTML = `
      <img class="chronos-pwa-banner__icon" src="/Logo/icon-192.png" alt="" width="38" height="38">
      <div class="chronos-pwa-banner__body">
        <p class="chronos-pwa-banner__title">${title}</p>
        <p class="chronos-pwa-banner__subtitle">${subtitle}</p>
      </div>
      <button type="button" class="chronos-pwa-banner__install">${installLabel}</button>
      <button type="button" class="chronos-pwa-banner__close" aria-label="Fermer">&times;</button>
    `;
    banner.querySelector(".chronos-pwa-banner__install").addEventListener("click", () => {
      onInstall(banner);
    });
    banner.querySelector(".chronos-pwa-banner__close").addEventListener("click", () => dismiss(banner));
    document.body.appendChild(banner);
    return banner;
  }

  if (wasRecentlyDismissed()) return;

  if (isIOS) {
    // Pas d'événement beforeinstallprompt sur iOS : instructions manuelles.
    if (!isSafari) return; // installation impossible hors Safari sur iOS
    buildBanner({
      title: "Installer Chronos-Services",
      subtitle: "Partager → Sur l'écran d'accueil",
      installLabel: "Compris",
      onInstall: (banner) => dismiss(banner),
    });
    return;
  }

  let deferredPrompt = null;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;

    buildBanner({
      title: "Installer Chronos-Services",
      subtitle: "Accès rapide, même hors ligne",
      installLabel: "Installer",
      onInstall: async (banner) => {
        if (!deferredPrompt) {
          banner.remove();
          return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log("[pwa] Choix d'installation :", outcome);
        deferredPrompt = null;
        banner.remove();
      },
    });
  });

  window.addEventListener("appinstalled", () => {
    localStorage.removeItem(DISMISS_KEY);
  });
})();
