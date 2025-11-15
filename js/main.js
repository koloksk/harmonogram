// ===== GŁÓWNY PUNKT WEJŚCIA APLIKACJI =====

import { initCalendar, initViewListeners, getCalendarElement, handleResize } from './calendar.js';
import { initFilters, applyFilters, setRawData, getLastFiltered, normalizeEvent } from './filters.js';
import { initNextTile, updateNextTile, startNextTimer } from './next-tile.js';
import { initExportButton } from './export.js';
import { initUI } from './ui.js';
import { initScheduleModal } from './modals.js';
import { loadSchedulesFromStorage, getActiveSchedule, validateScheduleFile, getSchedules, saveSchedulesToStorage } from './schedule-manager.js';
import { parseXLSXToEvents } from './xlsx-parser.js';
import { initActiveScheduleBanner, renderActiveScheduleBanner } from './active-schedule.js';

console.log('✨ Harmonogram MUP - wersja modułowa');
export const version = '2.0.0';

// Główna funkcja ładująca dane
async function loadData() {
  try {
    await loadSchedulesFromStorage();
    const activeSchedule = getActiveSchedule();
    renderActiveScheduleBanner(activeSchedule);

    if (!activeSchedule) {
      throw new Error('Brak aktywnego harmonogramu');
    }

    let rawData;

    // Load from stored data or fetch from path
    if (activeSchedule.data) {
      rawData = activeSchedule.data;
    } else {
      // Sprawdź czy to plik XLSX czy JSON
      const isXlsx = activeSchedule.path.toLowerCase().endsWith('.xlsx') ||
        activeSchedule.path.toLowerCase().endsWith('.xlsm');

      let res;
      try {
        // Próba pobrania bezpośrednio
        res = await fetch(activeSchedule.path, {
          cache: 'no-store',
          mode: 'cors'
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
      } catch (corsError) {
        console.warn('⚠️ Błąd CORS, próba użycia CORS proxy...', corsError);

        // Jeśli CORS nie zadziałał, spróbuj przez proxy
        const corsProxy = 'https://corsproxy.io/?';
        const proxiedUrl = corsProxy + encodeURIComponent(activeSchedule.path);

        res = await fetch(proxiedUrl, {
          cache: 'no-store'
        });

        if (!res.ok) {
          throw new Error(`Nie udało się pobrać pliku (status: ${res.status}). Sprawdź połączenie z internetem.`);
        }
      }

      if (isXlsx) {
        // Parsuj XLSX
        const arrayBuffer = await res.arrayBuffer();
        rawData = await parseXLSXToEvents(arrayBuffer, activeSchedule.name);
      } else {
        // Parsuj JSON
        rawData = await res.json();
      }
    }

    rawData.events = (rawData.events || []).map(e => normalizeEvent(e));

    // Update schedule status
    const validation = await validateScheduleFile(rawData, activeSchedule.name);
    
    // Save validation results to schedules
    const schedules = getSchedules();
    const scheduleIndex = schedules.findIndex(s => s.id === activeSchedule.id);
    if (scheduleIndex !== -1) {
      schedules[scheduleIndex].status = validation.valid ? 'success' : (validation.errors.length > 0 ? 'error' : 'warning');
      schedules[scheduleIndex].eventsCount = validation.eventsCount;
      schedules[scheduleIndex].errors = validation.errors;
      schedules[scheduleIndex].warnings = validation.warnings || [];
      saveSchedulesToStorage();
      renderActiveScheduleBanner(schedules[scheduleIndex]);
    }

    setRawData(rawData);
    initFilters(rawData.events);
    initCalendar(rawData.events);
    applyFilters();
    handleResize();
  } catch (error) {
    console.error("Nie udało się załadować danych:", error);
    const calendarEl = getCalendarElement();
    if (calendarEl) {
      calendarEl.innerHTML = `<p style="color: var(--danger); text-align: center; padding: 20px;">Błąd ładowania harmonogramu: ${error.message}<br><br>Kliknij przycisk ? aby zarządzać harmonogramami.</p>`;
    }
  }
}

// Inicjalizacja aplikacji
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Inicjalizacja aplikacji...');
  
  // Inicjalizuj komponenty UI
  initNextTile();
  initViewListeners();
  initExportButton(getLastFiltered);
  initUI();
  initScheduleModal();
  initActiveScheduleBanner();

  // Załaduj dane
  await loadData();

  console.log('✅ Aplikacja gotowa');
});
window.harmApp = {
  version: '2.0.0-modular'
};
