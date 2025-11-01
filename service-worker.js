const CACHE_NAME = 'mup-cache-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './service-worker.js',
  '../harmonogram.json',
  'https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.15/index.global.min.css',
  'https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.15/index.global.min.js',
  'https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.15/locales-all.global.min.js',
  'https://cdn.jsdelivr.net/npm/@fullcalendar/daygrid@6.1.15/index.global.min.js',
  'https://cdn.jsdelivr.net/npm/@fullcalendar/timegrid@6.1.15/index.global.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Network-first for harmonogram, cache-first for others
  if (url.pathname.endsWith('/harmonogram.json')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});
