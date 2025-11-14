// next-tile.js - Moduł zarządzający kafelkiem "Następne zajęcia"

// Elementy next tile
const nextEls = {
  card: null,
  status: null,
  badge: null,
  title: null,
  range: null,
  room: null,
  bar: null
};

let nextTimerId;
let lastNextState = null;

/**
 * Inicjalizuje elementy next tile
 */
function initNextTile() {
  nextEls.card = document.getElementById('nextCard');
  nextEls.status = document.getElementById('nextStatus');
  nextEls.badge = document.getElementById('nextBadge');
  nextEls.title = document.getElementById('nextTitle');
  nextEls.range = document.getElementById('nextRange');
  nextEls.room = document.getElementById('nextRoom');
  nextEls.bar = document.getElementById('nextProgress');
}

/**
 * Humanizuje minuty do czytelnego formatu
 */
function humanizeMinutes(mins) {
  const m = Math.max(0, Math.round(mins));
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  const mm = m % 60;
  if (d > 0 && h > 0) return `${d} d ${h} h`;
  if (d > 0) return `${d} d`;
  if (h > 0 && mm > 0) return `${h} h ${mm} min`;
  if (h > 0) return `${h} h`;
  return `${mm} min`;
}

/**
 * Formatuje datę do HH:MM
 */
function fmtHM(d) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Zapewnia end ISO dla wydarzenia
 */
function ensureEndISO(ev) {
  if (ev.end) return ev.end;
  const d = new Date(ev.start);
  d.setMinutes(d.getMinutes() + 60);
  return d.toISOString();
}

/**
 * Wybiera następne lub bieżące zajęcia
 */
function pickNextOrCurrent(events) {
  const now = new Date();
  const enriched = events
    .filter(e => e.start)
    .map(e => ({
      e,
      start: new Date(e.start),
      end: new Date(ensureEndISO(e))
    }))
    .filter(x => !isNaN(x.start) && !isNaN(x.end))
    .sort((a, b) => a.start - b.start);

  const ongoing = enriched.filter(x => now >= x.start && now < x.end)
    .sort((a, b) => a.end - b.end);
  if (ongoing.length) return { kind: 'ongoing', ...ongoing[0] };

  const upcoming = enriched.filter(x => x.start > now);
  if (upcoming.length) return { kind: 'upcoming', ...upcoming[0] };

  return null;
}

/**
 * Aktualizuje kafelek następnych zajęć
 */
function updateNextTile(lastFiltered = []) {
  if (!nextEls.card) return;
  const pick = pickNextOrCurrent(lastFiltered);

  // Generuj hash stanu - optymalizacja
  const stateHash = pick ? `${pick.e.title}|${pick.start.getTime()}|${pick.kind}` : 'none';

  // Pomiń update jeśli stan się nie zmienił
  if (lastNextState === stateHash) return;
  lastNextState = stateHash;

  if (!pick) {
    nextEls.card.classList.remove('remote');
    nextEls.status.textContent = 'Brak nadchodzących zajęć';
    nextEls.badge.style.display = 'none';
    nextEls.title.textContent = '—';
    nextEls.range.textContent = '—';
    nextEls.room.textContent = '';
    nextEls.bar.style.width = '0%';
    nextEls.bar.parentElement.setAttribute('aria-valuenow', '0');
    return;
  }

  const { e, start, end, kind } = pick;
  const isRemote = (e.classNames || []).includes('remote');
  nextEls.card.classList.toggle('remote', isRemote);
  nextEls.badge.style.display = isRemote ? '' : 'none';

  nextEls.title.textContent = (e.title || 'Zajęcia');
  nextEls.range.textContent = `${fmtHM(start)}–${fmtHM(end)}`;
  nextEls.room.textContent = e.location ? `• ${e.location}` : (isRemote ? '• Zdalnie' : '');

  const totalMin = (end - start) / 60000;
  const leftToStart = (start - new Date()) / 60000;

  if (kind === 'ongoing') {
    const elapsed = (new Date() - start) / 60000;
    const pct = Math.max(0, Math.min(100, (elapsed / totalMin) * 100));
    nextEls.status.textContent = `Trwają · do końca ${humanizeMinutes(totalMin - elapsed)}`;
    nextEls.bar.style.width = pct.toFixed(1) + '%';
    nextEls.bar.parentElement.setAttribute('aria-valuenow', String(Math.round(pct)));
  } else {
    nextEls.status.textContent = `Następne za ${humanizeMinutes(leftToStart)}`;
    nextEls.bar.style.width = '0%';
    nextEls.bar.parentElement.setAttribute('aria-valuenow', '0');
  }
}

/**
 * Uruchamia timer dla next tile
 */
function startNextTimer(lastFiltered = []) {
  clearInterval(nextTimerId);
  nextTimerId = setInterval(() => updateNextTile(lastFiltered), 30000); // co 30s
}

// Eksportuj funkcje globalnie dla innych modułów
window.updateNextTile = updateNextTile;
window.startNextTimer = startNextTimer;

export {
  initNextTile,
  updateNextTile,
  startNextTimer
};
