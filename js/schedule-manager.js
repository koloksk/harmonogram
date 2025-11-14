// ===== ZARZĄDZANIE HARMONOGRAMAMI =====

import { SCHEDULES_STORAGE_KEY, ACTIVE_SCHEDULE_KEY, STORAGE_KEY } from './config.js';
import { saveToLocalStorage, loadFromLocalStorage } from './cache.js';
import { parseXLSXToEvents } from './xlsx-parser.js';

export let schedules = [];
export let activeScheduleId = null;

export async function fetchScheduleUrlFromUniversity() {
  try {
    const pageUrl = 'http://uczelniaoswiecim.edu.pl/instytuty/new-instytut-nauk-inzynieryjno-technicznych/harmonogramy/';
    const corsProxy = 'https://corsproxy.io/?';
    const proxiedUrl = corsProxy + encodeURIComponent(pageUrl);

    const response = await fetch(proxiedUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Nie udało się pobrać strony (status: ${response.status})`);

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const links = Array.from(doc.querySelectorAll('a'));
    const scheduleLink = links.find(link => {
      const text = link.textContent || '';
      const href = link.href || '';
      return text.toLowerCase().includes('niestacjonarne') &&
        (href.toLowerCase().endsWith('.xlsx') || href.toLowerCase().endsWith('.xlsm'));
    });

    if (scheduleLink && scheduleLink.href) {
      let url = scheduleLink.href;
      if (!url.startsWith('http')) {
        url = new URL(url, pageUrl).href;
      }
      url = url.replace(/^https:\/\//i, 'http://');
      return url;
    }

    throw new Error('Nie znaleziono linku do harmonogramu niestacjonarnego na stronie');
  } catch (error) {
    console.error('❌ Błąd pobierania linku harmonogramu:', error);
    return 'http://uczelniaoswiecim.edu.pl/wp-content/uploads/2022/10/Harmonogram-studia-niestacjonarne-aktualizacja-13.11.2025.xlsx';
  }
}

export async function loadSchedulesFromStorage() {
  try {
    const stored = loadFromLocalStorage(SCHEDULES_STORAGE_KEY, []);
    schedules = stored;
    activeScheduleId = loadFromLocalStorage(ACTIVE_SCHEDULE_KEY, null);

    if (schedules.length === 0) {
      const scheduleUrl = await fetchScheduleUrlFromUniversity();

      schedules.push({
        id: 'default',
        name: 'Harmonogram studia niestacjonarne',
        path: scheduleUrl,
        isDefault: true,
        addedAt: new Date().toISOString(),
        status: 'unknown',
        eventsCount: 0,
        errors: [],
        autoUpdate: true
      });
      activeScheduleId = 'default';
      saveSchedulesToStorage();
    }

    const defaultSchedule = schedules.find(s => s.id === 'default' && s.autoUpdate);
    if (defaultSchedule) {
      const lastCheck = localStorage.getItem('harm_last_url_check');
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;

      if (!lastCheck || (now - parseInt(lastCheck)) > oneDayMs) {
        const newUrl = await fetchScheduleUrlFromUniversity();

        if (newUrl !== defaultSchedule.path) {
          defaultSchedule.path = newUrl;
          saveSchedulesToStorage();
        }

        localStorage.setItem('harm_last_url_check', now.toString());
      }
    }
  } catch (e) {
    console.error('Błąd wczytywania harmonogramów', e);
    schedules = [];
  }
}

export function saveSchedulesToStorage() {
  saveToLocalStorage(SCHEDULES_STORAGE_KEY, schedules);
  if (activeScheduleId) {
    saveToLocalStorage(ACTIVE_SCHEDULE_KEY, activeScheduleId);
  }
}

export function getSchedules() {
  return schedules;
}

export function getActiveScheduleId() {
  return activeScheduleId;
}

export function getActiveSchedule() {
  return schedules.find(s => s.id === activeScheduleId) || schedules[0];
}

export async function validateScheduleFile(data, scheduleName) {
  const errors = [];
  const warnings = [];

  if (!data || typeof data !== 'object') {
    errors.push('Nieprawidłowy format pliku JSON');
    return { valid: false, errors, warnings, eventsCount: 0 };
  }

  if (!Array.isArray(data.events)) {
    errors.push('Brak tablicy "events" w pliku');
    return { valid: false, errors, warnings, eventsCount: 0 };
  }

  const eventsCount = data.events.length;

  if (eventsCount === 0) {
    warnings.push('Plik nie zawiera żadnych wydarzeń');
  }

  let invalidEvents = 0;
  data.events.forEach((e, idx) => {
    if (!e.date && !e.start) {
      invalidEvents++;
    }
  });

  if (invalidEvents > 0) {
    warnings.push(`${invalidEvents} wydarzeń nie ma daty`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    eventsCount
  };
}

export async function addScheduleFromFile(file) {
  const fileName = file.name.toLowerCase();
  const isXlsx = fileName.endsWith('.xlsx') || fileName.endsWith('.xlsm');

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        let data;

        if (isXlsx) {
          data = await parseXLSXToEvents(e.target.result, file.name);
        } else {
          data = JSON.parse(e.target.result);
        }

        const validation = await validateScheduleFile(data, file.name);

        const newSchedule = {
          id: 'custom_' + Date.now(),
          name: file.name.replace(/\.(json|xlsx|xlsm)$/i, ''),
          path: null,
          data: data,
          isDefault: false,
          addedAt: new Date().toISOString(),
          status: validation.valid ? 'success' : (validation.errors.length > 0 ? 'error' : 'warning'),
          eventsCount: validation.eventsCount,
          errors: validation.errors,
          warnings: validation.warnings || []
        };

        schedules.push(newSchedule);
        saveSchedulesToStorage();
        resolve(newSchedule);
      } catch (err) {
        reject(new Error('Nieprawidłowy format pliku: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('Błąd wczytywania pliku'));

    if (isXlsx) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  });
}

export async function addScheduleFromURL(url, customName = null) {
  try {
    if (!url || !url.trim()) throw new Error('Podaj adres URL');

    url = url.trim();

    let urlObj;
    try {
      urlObj = new URL(url);
    } catch (e) {
      throw new Error('Nieprawidłowy format URL');
    }

    const fileName = urlObj.pathname.split('/').pop() || 'harmonogram';
    const lowerFileName = fileName.toLowerCase();
    const isXlsx = lowerFileName.endsWith('.xlsx') || lowerFileName.endsWith('.xlsm');
    const isJson = lowerFileName.endsWith('.json');

    if (!isXlsx && !isJson) {
      throw new Error('Nieobsługiwany format pliku. Wspierane: .xlsx, .xlsm, .json');
    }

    const existing = schedules.find(s => s.path === url);
    if (existing) throw new Error('Harmonogram z tym URL już istnieje');

    let res;
    try {
      res = await fetch(url, { cache: 'no-store', mode: 'cors' });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    } catch (corsError) {
      const corsProxy = 'https://corsproxy.io/?';
      const proxiedUrl = corsProxy + encodeURIComponent(url);
      res = await fetch(proxiedUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Nie udało się pobrać pliku (status: ${res.status})`);
    }

    let data;
    if (isXlsx) {
      const arrayBuffer = await res.arrayBuffer();
      data = await parseXLSXToEvents(arrayBuffer, fileName);
    } else {
      data = await res.json();
    }

    const validation = await validateScheduleFile(data, fileName);

    const newSchedule = {
      id: 'url_' + Date.now(),
      name: customName || fileName.replace(/\.(json|xlsx|xlsm)$/i, ''),
      path: url,
      isDefault: false,
      addedAt: new Date().toISOString(),
      status: validation.valid ? 'success' : (validation.errors.length > 0 ? 'error' : 'warning'),
      eventsCount: validation.eventsCount,
      errors: validation.errors,
      warnings: validation.warnings || []
    };

    schedules.push(newSchedule);
    saveSchedulesToStorage();

    return newSchedule;
  } catch (error) {
    throw error;
  }
}

export function deleteSchedule(scheduleId) {
  if (schedules.find(s => s.id === scheduleId)?.isDefault) {
    alert('Nie można usunąć domyślnego harmonogramu');
    return;
  }

  schedules = schedules.filter(s => s.id !== scheduleId);

  if (activeScheduleId === scheduleId) {
    activeScheduleId = schedules[0]?.id || null;
  }

  saveSchedulesToStorage();
}

export function switchSchedule(scheduleId) {
  activeScheduleId = scheduleId;
  saveSchedulesToStorage();
}
