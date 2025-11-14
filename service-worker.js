const CACHE_NAME = 'mup-harmonogram-v12'; // Zwiększona wersja dla automatycznego update'u
const URLS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './logo.png',
  './campus-map.png',
  './manifest.webmanifest',
  './js/main.js',
  './js/config.js',
  './js/cache.js',
  './js/xlsx-parser.js',
  './js/schedule-manager.js',
  './js/calendar.js',
  './js/filters.js',
  './js/next-tile.js',
  './js/export.js',
  './js/ui.js',
  './js/modals.js'
];

// Zasoby zewnętrzne - cache z długim TTL
const EXTERNAL_CACHE = 'mup-external-v1';
const EXTERNAL_URLS = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.15/index.global.min.js',
  'https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.15/locales-all.global.min.js',
  'https://cdn.jsdelivr.net/npm/@fullcalendar/daygrid@6.1.15/index.global.min.js',
  'https://cdn.jsdelivr.net/npm/@fullcalendar/timegrid@6.1.15/index.global.min.js',
  'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js'
];

self.addEventListener('install', event => {
  console.log('✨ SW: Instalacja nowej wersji...');
  event.waitUntil(
    Promise.all([
      // Natychmiast aktywuj nową wersję
      self.skipWaiting(),
      // Pre-cache tylko kluczowe zasoby lokalne
      caches.open(CACHE_NAME).then(cache => {
        console.log('📦 SW: Cache\'owanie podstawowych zasobów...');
        return cache.addAll(URLS_TO_CACHE);
      })
    ])
  );
});

self.addEventListener('activate', event => {
  console.log('🔄 SW: Aktywacja...');
  event.waitUntil(
    Promise.all([
      // Przejmij kontrolę natychmiast
      self.clients.claim(),
      // Usuń stare cache'e
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== EXTERNAL_CACHE) {
              console.log('🗑️ SW: Usuwam stary cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ]).then(() => {
      console.log('✅ SW: Aktywacja zakończona!');
    })
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Dla plików HTML, CSS, JS - zawsze próbuj najpierw sieci (Network First)
  if (url.origin === location.origin && 
      (request.url.endsWith('.html') || 
       request.url.endsWith('.css') || 
       request.url.endsWith('.js') || 
       request.url.endsWith('/'))) {
    
    event.respondWith(
      fetch(request)
        .then(response => {
          // Zapisz nową wersję do cache
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Jeśli sieć nie działa, użyj cache
          return caches.match(request);
        })
    );
    return;
  }
  
  // Dla zasobów zewnętrznych (CDN) - Cache First (rzadko się zmieniają)
  if (EXTERNAL_URLS.some(extUrl => request.url.startsWith(extUrl.split('?')[0]))) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) {
          return cached;
        }
        return fetch(request).then(response => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(EXTERNAL_CACHE).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        });
      })
    );
    return;
  }
  
  // Dla obrazków i innych statycznych zasobów - Cache First
  if (request.url.endsWith('.png') || request.url.endsWith('.jpg') || 
      request.url.endsWith('.svg') || request.url.endsWith('.webmanifest')) {
    event.respondWith(
      caches.match(request).then(cached => {
        return cached || fetch(request).then(response => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        });
      })
    );
    return;
  }
  
  // Dla wszystkich innych zasobów - tylko sieć (np. API, harmonogramy XLSX)
  event.respondWith(fetch(request));
});

self.addEventListener('message', event => {
  // Obsługa SKIP_WAITING - natychmiastowa aktywacja
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('SW: Otrzymano SKIP_WAITING, aktywuję natychmiast...');
    self.skipWaiting();
    return;
  }
  
  // Obsługa showWidget
  if (event.data && event.data.action === 'showWidget') {
    console.log('SW: Otrzymano polecenie showWidget, uruchamiam updateWidget...');
    event.waitUntil(updateWidget());
  }
});

self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-widget') {
    event.waitUntil(updateWidget());
  }
});

self.addEventListener('notificationclick', event => {
  const action = event.action;
  
  event.notification.close();
  
  if (action === 'dismiss') {
    // Użytkownik kliknął "Zamknij" - nic nie rób, tylko zamknij
    return;
  }
  
  // Domyślnie lub przycisk "Zobacz harmonogram" - otwórz aplikację
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Jeśli aplikacja jest już otwarta, przełącz na nią
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      // Jeśli nie ma otwartej aplikacji, otwórz nową kartę
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});

async function updateWidget() {
  try {
    // UWAGA: Widget nie działa z XLSX - wymaga lokalnego parsowania
    // Tymczasowo wyłączamy automatyczne aktualizacje widgetu
    console.log('SW: Widget wyłączony - używamy plików XLSX');
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
      await self.registration.showNotification('📅 MUP Harmonogram', {
        body: '✨ Brak zaplanowanych zajęć w najbliższym czasie',
        icon: './logo.png',
        badge: './logo.png',
        tag: 'next-class',
        requireInteraction: true,
        actions: [
          { action: 'open', title: '📖 Otwórz harmonogram', icon: './logo.png' }
        ]
      });
      return;
    }

    const timeUntil = getTimeUntilClass(nextClass);
    const location = nextClass.location || 'Sala nieznana';
    const teacher = nextClass.teacher || '';
    
    // Buduj piękny, czytelny body
    let bodyLines = [];
    
    // Linia 1: Czas pozostały (duży, wyróżniony)
    if (timeUntil) {
      bodyLines.push(`⏰ ${timeUntil}`);
    }
    
    // Linia 2: Godzina rozpoczęcia
    bodyLines.push(`🕐 ${nextClass.start} - ${nextClass.end}`);
    
    // Linia 3: Lokalizacja
    bodyLines.push(`📍 ${location}`);
    
    // Linia 4: Prowadzący (jeśli jest)
    if (teacher) {
      bodyLines.push(`👨‍🏫 ${teacher}`);
    }
    
    const body = bodyLines.join('\n');

    // Tytuł z emoji (kategoryzacja typu zajęć)
    let titleEmoji = '📚';
    const titleLower = nextClass.title.toLowerCase();
    if (titleLower.includes('wykład')) titleEmoji = '🎓';
    else if (titleLower.includes('laboratorium') || titleLower.includes('lab')) titleEmoji = '🔬';
    else if (titleLower.includes('ćwiczenia') || titleLower.includes('ćw')) titleEmoji = '✏️';
    else if (titleLower.includes('projekt')) titleEmoji = '💻';
    else if (titleLower.includes('seminarium')) titleEmoji = '💬';

    await self.registration.showNotification(`${titleEmoji} ${nextClass.title}`, {
      body: body,
      icon: './logo.png',
      badge: './logo.png',
      tag: 'next-class',
      requireInteraction: true,
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open', title: '📖 Zobacz harmonogram', icon: './logo.png' },
        { action: 'dismiss', title: '✖️ Zamknij', icon: './logo.png' }
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