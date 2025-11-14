// calendar.js - Moduł zarządzający kalendarzem FullCalendar

import { escapeHtml } from './cache.js';

// Zmienne globalne kalendarza
let fc = null;
const calendarEl = document.getElementById('calendar');
const viewButtons = document.querySelectorAll('.seg button');

// Element tooltipa
const tooltip = document.createElement('div');
tooltip.className = 'tooltip';
tooltip.style.opacity = '0';
tooltip.style.display = 'none';
tooltip.style.top = '0';
tooltip.style.left = '0';
document.body.appendChild(tooltip);

/**
 * Funkcja do dynamicznego dostosowywania widoku
 */
function getDayMax() {
  const w = window.innerWidth;
  if (w <= 480) return 4;
  if (w <= 700) return 5;
  if (w <= 900) return 6;
  return 6;
}

/**
 * Debounce function - opóźnia wykonanie funkcji do momentu gdy użytkownik przestanie zmieniać rozmiar
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Uproszczona funkcja resize, głównie do ustawiania zmiennej CSS
 */
function handleResize() {
  const header = document.querySelector('header');
  const headerHeight = header ? header.offsetHeight : 65;
  document.documentElement.style.setProperty('--header-h', `${headerHeight}px`);

  if (fc) {
    fc.setOption('dayMaxEventRows', getDayMax());
    fc.updateSize();
  }
}

// Wersja z debouncing dla płynniejszego działania
const debouncedResize = debounce(handleResize, 150);

/**
 * Przełącza widok kalendarza
 */
function switchView(viewName) {
  if (!fc) return;
  fc.changeView(viewName);
  viewButtons.forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.view === viewName));
  });
}

/**
 * Buduje HTML tooltipa
 */
function buildTooltipHtml(e, isRemote) {
  const rows = [];
  const addRow = (label, value) => {
    if (value) rows.push(`<div class="tt-row"><span>${label}:</span><b>${escapeHtml(value)}</b></div>`);
  };

  if (e.title) rows.push(`<div class="tt-title">${escapeHtml(e.title)}</div>`);
  addRow('Data', e.date);
  addRow('Godziny', e.startTime && e.endTime ? `${e.startTime}–${e.endTime}` : e.startTime);
  addRow('Program', e.program);
  addRow('Typ', e.type);
  addRow('Sala', e.location);
  addRow('Prowadzący', e.lecturers?.join(', '));
  addRow('Zjazd', e.zjazd);

  if (isRemote) rows.push(`<div class="tt-badge tt-remote">Zajęcia zdalne</div>`);
  return rows.join('');
}

/**
 * Pokazuje tooltip
 */
function showTooltip(el, html) {
  if (!html) return;
  tooltip.innerHTML = html;
  tooltip.style.display = 'block';
  requestAnimationFrame(() => {
    tooltip.style.opacity = '1';
    const rect = el.getBoundingClientRect();
    const pad = 8;

    let left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2);
    left = Math.max(10, Math.min(left, window.innerWidth - tooltip.offsetWidth - 10));

    let top = rect.top - tooltip.offsetHeight - pad;
    if (top < 10) { top = rect.bottom + pad; }

    tooltip.style.transform = `translate(${left}px, ${top}px)`;
  });
}

/**
 * Ukrywa tooltip
 */
function hideTooltip() {
  tooltip.style.opacity = '0';
  setTimeout(() => {
    if (tooltip.style.opacity === '0') {
      tooltip.style.display = 'none';
    }
  }, 150);
}

/**
 * Inicjalizuje kalendarz FullCalendar
 */
function initCalendar(events) {
  if (fc) fc.destroy();
  const isMobile = window.innerWidth <= 900;
  fc = new FullCalendar.Calendar(calendarEl, {
    locale: 'pl',
    firstDay: 1,
    initialView: 'dayGridMonth',
    height: isMobile ? 'auto' : 'auto',
    contentHeight: isMobile ? 'auto' : undefined,
    events: [],
    displayEventEnd: true,
    dayMaxEventRows: getDayMax(),
    fixedWeekCount: false,
    showNonCurrentDates: true,
    moreLinkClick: isMobile ? 'popover' : 'popover',
    dayMaxEvents: isMobile,
    allDaySlot: false,
    handleWindowResize: false,
    slotDuration: '00:15:00',
    slotLabelInterval: '01:00:00',
    slotLabelFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
    slotMinTime: '08:00:00',
    slotMaxTime: '21:30:00',
    expandRows: true,
    nowIndicator: true,
    eventContent: arg => {
      const e = arg.event.extendedProps;
      const time = (e.startTime && e.endTime) ? `${e.startTime}–${e.endTime}` : '';
      const title = (arg.event.title || '').trim();
      const html = `<div class="evt"><span class="t">${escapeHtml(title)}</span>${time ? `<span class="tm">${time}</span>` : ''}</div>`;
      return { html };
    },
    eventDidMount: info => {
      info.el.addEventListener('mouseenter', () => showTooltip(info.el, buildTooltipHtml(info.event.extendedProps, info.event.classNames.includes('remote'))));
      info.el.addEventListener('mouseleave', hideTooltip);
    },
    moreLinkContent: arg => {
      return { html: `<span style="font-weight: 700; color: var(--accent);">+${arg.num} więcej</span>` };
    },
    moreLinkDidMount: info => {
      info.el.style.transition = 'all 0.2s';
      info.el.addEventListener('mouseenter', () => {
        info.el.style.transform = 'translateY(-1px)';
        info.el.style.textDecoration = 'none';
      });
      info.el.addEventListener('mouseleave', () => {
        info.el.style.transform = 'translateY(0)';
      });
    },
    datesSet: () => {
      // Wywołaj callback gdy kalendarz zmienia widok dat
      if (window.applyFilters) window.applyFilters();
      handleResize();
    },
  });
  fc.render();
}

/**
 * Inicjalizuje event listenery dla widoku
 */
function initViewListeners() {
  viewButtons.forEach(button => {
    button.addEventListener('click', () => switchView(button.dataset.view));
  });

  window.addEventListener('resize', debouncedResize);
  window.addEventListener('orientationchange', handleResize);
  handleResize();
}

/**
 * Zwraca instancję kalendarza
 */
function getCalendar() {
  return fc;
}

/**
 * Zwraca element kalendarza
 */
function getCalendarElement() {
  return calendarEl;
}

export {
  initCalendar,
  initViewListeners,
  getCalendar,
  getCalendarElement,
  handleResize,
  switchView
};
