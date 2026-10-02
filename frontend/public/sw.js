// Service worker: makes the app installable and opens it without a network.
//  - Pages: network first, falling back to the cached app shell.
//  - Built assets (/assets/*, content-hashed): cache first.
//  - Icons, manifest, Google Fonts: stale-while-revalidate.
//  - /api and map tiles are never cached here: forecasts must be fresh, and
//    the planner keeps its own copy of the last result for offline viewing.
const VERSION = 'v1';
const SHELL = `shell-${VERSION}`;
const RUNTIME = `runtime-${VERSION}`;
const PRECACHE = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== SHELL && k !== RUNTIME).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin && url.pathname.startsWith('/api/')) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(SHELL).then(c => c.put('/', copy)); }
          return res;
        })
        .catch(() => caches.match('/')),
    );
    return;
  }

  if (sameOrigin && url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(RUNTIME).then(c => c.put(req, copy)); }
        return res;
      })),
    );
    return;
  }

  if (sameOrigin || FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.open(RUNTIME).then(cache => cache.match(req).then(hit => {
        const network = fetch(req).then(res => {
          if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
          return res;
        }).catch(() => hit);
        return hit || network;
      })),
    );
  }
});
