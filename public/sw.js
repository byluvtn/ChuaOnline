// Minimal app-shell service worker. Never caches /api or /socket.io; only same-origin GET static assets.
const CACHE = 'co-shell-v1';
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const r = e.request;
  const u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api') || u.pathname.startsWith('/socket.io')) return;
  if (r.mode === 'navigate') {
    // network first so deployments show up immediately; fall back to cached shell offline
    e.respondWith(fetch(r).then((res) => { const c = res.clone(); caches.open(CACHE).then((x) => x.put('/', c)); return res; }).catch(() => caches.match('/')));
    return;
  }
  if (u.pathname.startsWith('/assets/') || u.pathname.startsWith('/icons/')) {
    e.respondWith(caches.match(r).then((hit) => hit || fetch(r).then((res) => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then((x) => x.put(r, c)); } return res; })));
  }
});
