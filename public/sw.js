const CACHE_NAME = 'gametime-cache-v5';
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
  // 2. Cross-origin requests (like backend running on Render)
  // 3. API endpoints
  if (
    event.request.method !== 'GET' ||
    !event.request.url.startsWith(self.location.origin) ||
    event.request.url.includes('/api/')
  ) {
    return; // Let the browser handle these normally
  }

  // Network-First strategy for HTML navigation requests (to prevent index.html from caching forever)
  const isNav = event.request.mode === 'navigate' || 
                event.request.url === self.location.origin || 
                event.request.url === self.location.origin + '/';

  if (isNav) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-First strategy for static assets
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
