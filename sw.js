// Vigie : service worker limité aux notifications (aucune mise en cache des pages ni des données).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { texte: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(String(d.titre || "Vigie").slice(0, 80), {
    body: String(d.texte || "").slice(0, 200),
    icon: "icon-192.png",
    tag: "vigie-admin",
    renotify: true,
    data: { lien: String(d.lien || "./") }
  }));
});

// Appui sur la notification : ouvre (ou réutilise) l'application à l'endroit indiqué, dans la portée du site seulement
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  let url = new URL("./", self.registration.scope).href;
  try {
    const u = new URL(e.notification.data?.lien || "./", self.registration.scope);
    if (u.href.startsWith(self.registration.scope)) url = u.href;
  } catch (err) { /* lien invalide : accueil */ }
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((fenetres) => {
    // Fenêtre déjà ouverte : on la réutilise ; si elle ne peut pas naviguer (non contrôlée), on en ouvre une autre
    for (const f of fenetres) {
      if (f.url.startsWith(self.registration.scope)) {
        return f.focus().then((g) => (g || f).navigate(url)).catch(() => self.clients.openWindow(url));
      }
    }
    return self.clients.openWindow(url);
  }));
});
