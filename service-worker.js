const CACHE_NAME = 'mup-harmonogram-v3';
const URLS_TO_CACHE = [
  './',
  './index.html',
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

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('./')
  );
});

async function updateWidget() {
  try {
    const response = await fetch('./harmonogram.json', { cache: 'no-store' });
    const data = await response.json();
    
    const cache = await caches.open(CACHE_NAME);
    await cache.put('./harmonogram.json', new Response(JSON.stringify(data)));
    
    // Pokaż powiadomienie z następnymi zajęciami
    await showNextClassNotification(data);
    
    return true;
  } catch (error) {
    console.error('Widget update failed:', error);
    return false;
  }
}

async function showNextClassNotification(harmonogramData) {
  try {
    const nextClass = getNextClass(harmonogramData);
    
    if (!nextClass) {
      await self.registration.showNotification('MUP Harmonogram', {
        body: 'Brak zaplanowanych zajęć',
        icon: './logo.png',
        badge: './logo.png',
        tag: 'next-class',
        requireInteraction: true,
        actions: [
          { action: 'open', title: 'Otwórz harmonogram' }
        ]
      });
      return;
    }

    const timeUntil = getTimeUntilClass(nextClass);
    const location = nextClass.location || 'Sala nieznana';
    const teacher = nextClass.teacher || '';
    
    let body = `${nextClass.start} • ${location}`;
    if (teacher) {
      body += `\n${teacher}`;
    }
    if (timeUntil) {
      body = `${timeUntil}\n${body}`;
    }

    await self.registration.showNotification(nextClass.title, {
      body: body,
      icon: './logo.png',
      badge: './logo.png',
      tag: 'next-class',
      requireInteraction: true,
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open', title: 'Otwórz harmonogram' }
      ],
      data: {
        url: './',
        classInfo: nextClass
      }
    });
  } catch (error) {
    console.error('Failed to show notification:', error);
  }
}

function getNextClass(data) {
  const now = new Date();
  
  // Jeśli dane mają strukturę z events
  if (!data.events || !Array.isArray(data.events)) {
    console.error('Brak danych o zajęciach');
    return null;
  }

  let foundClass = null;
  let minDiff = Infinity;

  for (const event of data.events) {
    // Parsuj datę i czas wydarzenia
    const eventDate = new Date(event.date);
    const [hours, minutes] = event.startTime.split(':').map(Number);
    eventDate.setHours(hours, minutes, 0, 0);
    
    // Oblicz różnicę czasu
    const diff = eventDate - now;
    
    // Pomiń przeszłe zajęcia
    if (diff < 0) continue;
    
    // Znajdź najbliższe zajęcia
    if (diff < minDiff) {
      minDiff = diff;
      foundClass = {
        title: event.title,
        start: event.startTime,
        end: event.endTime,
        location: event.location,
        teacher: event.lecturers && event.lecturers.length > 0 ? event.lecturers.join(', ') : '',
        date: event.date,
        startDateTime: eventDate
      };
    }
  }

  return foundClass;
}

function getTimeUntilClass(classInfo) {
  if (!classInfo || !classInfo.startDateTime) return '';
  
  const now = new Date();
  const diff = classInfo.startDateTime - now;
  const diffMinutes = Math.floor(diff / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `Za ${diffDays} ${diffDays === 1 ? 'dzień' : 'dni'}`;
  } else if (diffHours > 0) {
    const remainingMinutes = diffMinutes % 60;
    if (remainingMinutes > 0) {
      return `Za ${diffHours}h ${remainingMinutes}min`;
    }
    return `Za ${diffHours}h`;
  } else if (diffMinutes > 0) {
    return `Za ${diffMinutes} min`;
  } else {
    return 'Teraz';
  }
}