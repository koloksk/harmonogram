const CACHE_NAME = 'mup-harmonogram-v1';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './widget.html',
  './harmonogram.json',
  './logo.png',
  './campus-map.png',
  './manifest.webmanifest',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.15/index.global.min.css',
  'https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.15/index.global.min.js',
  'https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.15/locales-all.global.min.js',
  'https://cdn.jsdelivr.net/npm/@fullcalendar/daygrid@6.1.15/index.global.min.js',
  'https://cdn.jsdelivr.net/npm/@fullcalendar/timegrid@6.1.15/index.global.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(URLS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

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
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request).then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-widget') {
    event.waitUntil(updateWidget());
  }
});

async function updateWidget() {
  try {
    const response = await fetch('./harmonogram.json', { cache: 'no-store' });
    const data = await response.json();
    
    const cache = await caches.open(CACHE_NAME);
    await cache.put('./harmonogram.json', new Response(JSON.stringify(data)));
    
    return true;
  } catch (error) {
    console.error('Widget update failed:', error);
    return false;
  }
}