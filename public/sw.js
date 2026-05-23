const CACHE_NAME = 'gametime-cache-v4';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/pwa-icon-512.png'
];

// Force immediate activation of the new service worker
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Clean up old caches and claim clients immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Bypass service worker for:
  // 1. Non-GET requests (like POST logins)
  // 2. Cross-origin requests (like backend running on port 3001)
  // 3. API endpoints
  if (
    event.request.method !== 'GET' ||
    !event.request.url.startsWith(self.location.origin) ||
    event.request.url.includes('/api/')
  ) {
    return; // Let the browser handle these normally
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
