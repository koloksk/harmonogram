// modals.js - Moduł zarządzający modalami

import { getSchedules, getActiveScheduleId, addScheduleFromFile, addScheduleFromURL, deleteSchedule, switchSchedule } from './schedule-manager.js';

/**
 * Inicjalizuje modal zarządzania harmonogramami
 */
export function initScheduleModal() {
  const modal = document.getElementById('scheduleModal');
  const helpBtn = document.getElementById('helpBtn');
  const closeBtn = document.getElementById('modalClose');
  const fileInput = document.getElementById('fileInput');
  const urlInput = document.getElementById('urlInput');
  const addUrlBtn = document.getElementById('addUrlBtn');

  if (!modal || !helpBtn) return;

  // Otwórz modal
  helpBtn.addEventListener('click', () => {
    modal.classList.add('active');
    renderScheduleList();
  });

  // Zamknij modal
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  // Zamknij modal klikając poza nim
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

  // Zamknij modal klawiszem ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      modal.classList.remove('active');
    }
  });

  // Dodaj harmonogram z pliku
  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        await addScheduleFromFile(file);
        renderScheduleList();
        // Reload aplikacji
        window.location.reload();
      } catch (error) {
        alert('Błąd dodawania harmonogramu: ' + error.message);
      }

      // Reset input
      fileInput.value = '';
    });
  }

  // Dodaj harmonogram z URL
  if (addUrlBtn && urlInput) {
    addUrlBtn.addEventListener('click', async () => {
      const url = urlInput.value.trim();
      if (!url) return;

      try {
        await addScheduleFromURL(url);
        renderScheduleList();
        urlInput.value = '';
        // Reload aplikacji
        window.location.reload();
      } catch (error) {
        alert('Błąd dodawania harmonogramu: ' + error.message);
      }
    });

    // Enter w polu URL
    urlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addUrlBtn.click();
      }
    });
  }
}

/**
 * Renderuje listę harmonogramów
 */
function renderScheduleList() {
  const container = document.getElementById('scheduleListContainer');
  if (!container) return;

  const schedules = getSchedules();
  const activeScheduleId = getActiveScheduleId();

  if (schedules.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">Brak harmonogramów. Dodaj nowy poniżej.</p>';
    return;
  }

  container.innerHTML = schedules.map(schedule => {
    const isActive = schedule.id === activeScheduleId;
    const statusClass = schedule.status === 'success' ? 'success' : schedule.status === 'error' ? 'error' : 'warning';
    const statusText = schedule.status === 'error' ? '✕ Błąd' : schedule.status === 'warning' ? '⚠ Ostrzeżenie' : '';
    
    const eventsCount = schedule.eventsCount || 0;
    const dateInfo = schedule.addedAt ? new Date(schedule.addedAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }) : '?';
    
    const warnings = schedule.warnings || [];
    const fullPath = schedule.path || schedule.fileName || schedule.url || 'Nieznane źródło';

    return `
      <div class="schedule-card ${isActive ? 'schedule-card-active' : ''}" data-id="${schedule.id}">
        <div class="schedule-card-top">
          <strong style="color: var(--text); font-size: 13px;">${schedule.name}</strong>
          ${isActive 
            ? '<div class="schedule-card-status schedule-card-status-success">✓ Aktywny</div>'
            : statusText ? `<div class="schedule-card-status schedule-card-status-${statusClass}">${statusText}</div>` : ''
          }
        </div>

        <div class="schedule-card-stats">
          <div class="schedule-stat">
            <span class="schedule-stat-value">${eventsCount}</span>
            <span class="schedule-stat-label">wydarzeń</span>
          </div>
          <div class="schedule-stat">
            <span class="schedule-stat-label">Dodano:</span>
            <span class="schedule-stat-value">${dateInfo}</span>
          </div>
        </div>

        <div class="schedule-card-path">${fullPath}</div>

        ${warnings.length > 0 ? `
          <div class="schedule-card-warnings">
            ${warnings.map(warn => `<div class="schedule-card-warning">⚠ ${warn}</div>`).join('')}
          </div>
        ` : ''}

        <div class="schedule-card-actions">
          ${!isActive ? `
            <button class="schedule-card-btn schedule-card-btn-primary btn-switch" data-id="${schedule.id}">
              Przełącz
            </button>
          ` : ''}
          ${!schedule.isDefault ? `
            <button class="schedule-card-btn schedule-card-btn-danger btn-delete" data-id="${schedule.id}" title="Usuń">
              ✕
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Event listeners dla przycisków
  container.querySelectorAll('.btn-switch').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      await switchSchedule(id);
      window.location.reload();
    });
  });

  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      const schedules = getSchedules();
      const activeScheduleId = getActiveScheduleId();
      const schedule = schedules.find(s => s.id === id);
      if (confirm(`Czy na pewno chcesz usunąć harmonogram "${schedule.name}"?`)) {
        await deleteSchedule(id);
        renderScheduleList();
        if (id === activeScheduleId) {
          window.location.reload();
        }
      }
    });
  });
}
