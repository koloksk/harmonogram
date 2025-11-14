// filters.js - Moduł zarządzający filtrami harmonogramu

import { STORAGE_KEY } from './config.js';
import { getCalendar } from './calendar.js';

// Elementy filtrów
const filterElements = {
  program: document.getElementById('program'),
  type: document.getElementById('type'),
  room: document.getElementById('room'),
  lecturer: document.getElementById('lecturer')
};

const statElements = {
  total: document.getElementById('statTotal'),
  visible: document.getElementById('statVisible')
};

// Zmienne dla filtrów
let rawData = { events: [] };
let lastFiltered = [];

/**
 * Zwraca unikalne wartości
 */
function unique(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

/**
 * Inicjalizuje filtry
 */
function initFilters(events) {
  // Wyczyść wszystkie filtry zachowując tylko domyślną opcję "Wszystkie"
  Object.values(filterElements).forEach(selectEl => {
    const defaultOption = selectEl.querySelector('option[value=""]');
    selectEl.innerHTML = '';
    if (defaultOption) {
      selectEl.appendChild(defaultOption.cloneNode(true));
    } else {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = selectEl.id === 'lecturer' ? 'Wszyscy' : 'Wszystkie';
      selectEl.appendChild(opt);
    }
  });

  const populateSelect = (selectEl, values) => {
    for (const val of unique(values)) {
      const o = document.createElement('option');
      o.value = o.textContent = val;
      selectEl.appendChild(o);
    }
  };

  populateSelect(filterElements.program, events.map(e => e.program));

  // Automatyczne wykrywanie typu, jeśli nie jest podany
  const typeSet = new Set(events.map(e => e.type).filter(Boolean));
  if (typeSet.size === 0) {
    events.forEach(e => {
      const t = (e.raw || '').toUpperCase();
      if (t.includes(' LAB')) e.type = 'LAB';
      else if (t.includes(' PROJEKT')) e.type = 'PROJEKT';
      else if (/\bW\b/.test(t) || t.includes(' W\n')) e.type = 'W';
      else if (t.includes(' ĆW') || t.includes(' ?W')) e.type = 'ĆW';
    });
  }
  populateSelect(filterElements.type, events.map(e => e.type));
  populateSelect(filterElements.room, events.map(e => e.location));

  // Wykładowcy - spłaszczenie tablic
  const allLecturers = events.flatMap(e => e.lecturers || []);
  populateSelect(filterElements.lecturer, allLecturers);

  // Ładowanie zapisanych filtrów
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    for (const key in saved) {
      if (filterElements[key] && saved[key] && [...filterElements[key].options].some(o => o.value === saved[key])) {
        filterElements[key].value = saved[key];
      }
    }
  } catch (e) {
    console.warn("Nie udało się załadować filtrów z LocalStorage", e);
  }

  // Event Listeners
  Object.values(filterElements).forEach(el => el.addEventListener('change', () => {
    saveFilters();
    applyFilters();
  }));

  document.getElementById('reset').addEventListener('click', () => {
    Object.values(filterElements).forEach(el => el.value = '');
    saveFilters();
    applyFilters();
  });
}

/**
 * Zapisuje filtry do localStorage
 */
function saveFilters() {
  const data = {
    program: filterElements.program.value,
    type: filterElements.type.value,
    room: filterElements.room.value,
    lecturer: filterElements.lecturer.value
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Optymalizacja: debounce dla applyFilters
 */
let applyFiltersTimeout;
function applyFilters() {
  clearTimeout(applyFiltersTimeout);
  applyFiltersTimeout = setTimeout(() => {
    applyFiltersNow();
  }, 50); // 50ms debounce
}

/**
 * Aplikuje filtry do wydarzeń
 */
function applyFiltersNow() {
  const fProg = filterElements.program.value;
  const fType = filterElements.type.value;
  const fRoom = filterElements.room.value;
  const fLecturer = filterElements.lecturer.value;

  const hasFilters = fProg || fType || fRoom || fLecturer;

  const filtered = hasFilters ? rawData.events.filter(ev => {
    if (fProg && ev.program !== fProg) return false;
    if (fType && ev.type !== fType) return false;
    if (fRoom && ev.location !== fRoom) return false;
    if (fLecturer && (!ev.lecturers || !ev.lecturers.includes(fLecturer))) return false;
    return true;
  }) : rawData.events;

  lastFiltered = filtered;

  const fc = getCalendar();
  if (fc) {
    fc.removeAllEvents();
    fc.addEventSource(filtered.map(e => ({
      title: e.title || (e.raw || '').slice(0, 60),
      start: e.start,
      end: e.end,
      classNames: e.classNames,
      extendedProps: e,
    })));
  }

  statElements.visible.textContent = filtered.length;
  
  // Aktualizuj next tile i timer
  if (window.updateNextTile) window.updateNextTile(lastFiltered);
  if (window.startNextTimer) window.startNextTimer(lastFiltered);
}

/**
 * Ustawia raw data
 */
function setRawData(data) {
  rawData = data;
  if (statElements.total) {
    statElements.total.textContent = rawData.events.length;
  }
}

/**
 * Zwraca ostatnio przefiltrowane wydarzenia
 */
function getLastFiltered() {
  return lastFiltered;
}

/**
 * Normalizuje event
 */
function normalizeEvent(e) {
  const out = { ...e };
  if (!out.title && out.raw) {
    out.title = (String(out.raw).split(/\n|\r/)[0] || '').trim();
  }
  if (out.isRemote || out.color === 'red') out.classNames = ['remote'];
  if (out.date && out.startTime) out.start = out.date + 'T' + out.startTime;
  if (out.date && out.endTime) out.end = out.date + 'T' + out.endTime;
  return out;
}

// Eksportuj applyFilters globalnie dla calendar.js
window.applyFilters = applyFilters;

export {
  initFilters,
  applyFilters,
  saveFilters,
  setRawData,
  getLastFiltered,
  normalizeEvent
};
