const CACHE_NAME = 'mup-harmonogram-v10';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './logo.png',
  './campus-map.png',
  './manifest.webmanifest',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.15/index.global.min.css',
  'https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.15/index.global.min.js',
  'https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.15/locales-all.global.min.js',
  'https://cdn.jsdelivr.net/npm/@fullcalendar/daygrid@6.1.15/index.global.min.js',
  'https://cdn.jsdelivr.net/npm/@fullcalendar/timegrid@6.1.15/index.global.min.js',
  'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js'
];

self.addEventListener('install', event => {
  console.log('SW: Instalacja rozpoczęta...');
  // UPROSZCZONE: Nie cache'uj podczas instalacji - to blokuje aktywację
  event.waitUntil(self.skipWaiting());
  console.log('SW: skipWaiting() wywołane');
});

self.addEventListener('activate', event => {
  console.log('SW: Aktywacja rozpoczęta...');
  event.waitUntil(
    self.clients.claim().then(() => {
      console.log('SW: clients.claim() - Service Worker aktywny!');
    })
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