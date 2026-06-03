const CACHE_NAME = 'axyomis-x-v4';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
];

// Install: cache static shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Always network for API calls
  if (url.pathname.startsWith('/api/') || url.hostname.includes('googleapis') || url.hostname.includes('firestore')) {
    event.respondWith(fetch(event.request).catch(() => new Response('{"error":"offline"}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  // Always network for Vite dev assets (JS/TS/CSS files) to get latest code
  if (url.pathname.match(/\.(js|ts|tsx|css|json)$/)) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  // Network-first for same-origin static assets (always get latest HTML)
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request).then((response) => {
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          return caches.match('./index.html');
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
      .then((response) => {
        if (response) return response;
        return new Response('Service unavailable', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      })
  );
});
