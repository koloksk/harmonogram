// active-schedule.js - komponent baneru aktywnego harmonogramu

const STATUS_LABELS = {
  success: 'Działa poprawnie',
  warning: 'Wymaga uwagi',
  error: 'Błąd pliku',
  unknown: 'Weryfikacja w toku'
};

function formatEvents(count) {
  if (typeof count !== 'number' || Number.isNaN(count)) {
    return 'Wydarzenia: —';
  }

  const abs = Math.abs(count);
  const suffix = abs === 1 ? 'wydarzenie' : (abs % 10 >= 2 && abs % 10 <= 4 && (abs % 100 < 10 || abs % 100 >= 20) ? 'wydarzenia' : 'wydarzeń');
  return `${count} ${suffix}`;
}

function detectSource(schedule) {
  if (!schedule) return 'Źródło: —';
  if (schedule.isDefault && schedule.path) return 'Źródło: Uczelnia (auto)';
  if (schedule.path && schedule.path.startsWith('http')) return 'Źródło: URL';
  if (schedule.path) return 'Źródło: Plik lokalny';
  return 'Źródło: Importowany plik';
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = text;
  }
}

export function initActiveScheduleBanner() {
  const manageBtn = document.getElementById('activeScheduleManage');
  if (manageBtn) {
    manageBtn.addEventListener('click', () => {
      const helpBtn = document.getElementById('helpBtn');
      if (helpBtn) {
        helpBtn.click();
      }
    });
  }

  renderActiveScheduleBanner(null);
}

export function renderActiveScheduleBanner(schedule) {
  const container = document.getElementById('activeScheduleBanner');
  if (!container) return;

  if (!schedule) {
    container.dataset.status = 'unknown';
    setText('activeScheduleName', 'Oczekiwanie na dane harmonogramu…');
    setText('activeScheduleStatus', 'Status: —');
    setText('activeScheduleEvents', 'Wydarzenia: —');
    setText('activeScheduleSource', 'Źródło: —');
    return;
  }

  const status = schedule.status || 'unknown';
  const eventsCount = typeof schedule.eventsCount === 'number'
    ? schedule.eventsCount
    : Array.isArray(schedule.data?.events) ? schedule.data.events.length : null;

  container.dataset.status = status;
  setText('activeScheduleName', schedule.name || 'Nieznany harmonogram');
  setText('activeScheduleStatus', `Status: ${STATUS_LABELS[status] || STATUS_LABELS.unknown}`);
  setText('activeScheduleEvents', formatEvents(eventsCount ?? 0));
  setText('activeScheduleSource', detectSource(schedule));
}
