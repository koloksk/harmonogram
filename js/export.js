// export.js - Moduł eksportu harmonogramu do formatu ICS (Google Calendar)

/**
 * Dodaje minuty do daty w formacie ISO
 */
function addMinutesLocalIso(dtStr, minutes) {
  const d = new Date(dtStr);
  d.setMinutes(d.getMinutes() + (minutes || 0));
  return d.toISOString();
}

/**
 * Escapuje tekst dla formatu ICS
 */
function icsEscape(str) {
  return String(str || '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

/**
 * Generuje prosty hash dla UID
 */
function simpleHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

/**
 * Składa linię ICS do 75 znaków (RFC 5545)
 */
function foldIcsLine(line) {
  const maxLen = 75;
  if (line.length <= maxLen) return line;
  let out = '';
  for (let i = 0; i < line.length; i += maxLen) {
    const chunk = line.slice(i, i + maxLen);
    out += (i === 0 ? chunk : `\r\n ${chunk}`);
  }
  return out;
}

/**
 * Składa wszystkie linie ICS
 */
function foldIcs(lines) {
  return lines.map(foldIcsLine).join('\r\n');
}

/**
 * Format daty w UTC do ICS: YYYYMMDDTHHMMSSZ
 */
function toIcsUtc(dt) {
  const d = (dt instanceof Date) ? dt : new Date(dt);
  const y = d.getUTCFullYear();
  const M = String(d.getUTCMonth() + 1).padStart(2, '0');
  const D = String(d.getUTCDate()).padStart(2, '0');
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  const s = String(d.getUTCSeconds()).padStart(2, '0');
  return `${y}${M}${D}T${h}${m}${s}Z`;
}

/**
 * Buduje plik ICS z wydarzeń
 */
function buildICS(events) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MUP Harmonogram//PL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  const stamp = toIcsUtc(new Date());
  events.forEach((e) => {
    if (!e.start) return; // wymagany DTSTART
    const startUtc = toIcsUtc(e.start);
    const endUtc = toIcsUtc(e.end || addMinutesLocalIso(e.start, 60));
    const title = icsEscape(e.title || 'Zajęcia');
    const lecturers = (e.lecturers && e.lecturers.length) ? `Prowadzący: ${e.lecturers.join(', ')}` : '';
    const parts = [
      e.program ? `Program: ${e.program}` : '',
      e.type ? `Typ: ${e.type}` : '',
      e.location ? `Sala: ${e.location}` : ((e.classNames || []).includes('remote') ? 'Zdalnie' : ''),
      lecturers,
      e.zjazd ? `Zjazd: ${e.zjazd}` : '',
    ].filter(Boolean);
    const desc = icsEscape(parts.join('\n'));
    const loc = icsEscape(e.location || ((e.classNames || []).includes('remote') ? 'Zdalnie' : ''));
    const uid = simpleHash(`${e.start}|${e.end}|${e.title || ''}|${e.location || ''}`) + '@mup';

    lines.push('BEGIN:VEVENT');
    if (stamp) lines.push(`DTSTAMP:${stamp}`);
    lines.push(`UID:${uid}`);
    lines.push(`DTSTART:${startUtc}`);
    if (endUtc) lines.push(`DTEND:${endUtc}`);
    lines.push(`SUMMARY:${title}`);
    if (desc) lines.push(`DESCRIPTION:${desc}`);
    if (loc) lines.push(`LOCATION:${loc}`);
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return foldIcs(lines) + '\r\n';
}

/**
 * Eksportuje harmonogram do Google Calendar (plik ICS)
 */
function exportToGoogleCalendar(events) {
  const btn = document.getElementById('exportGoogle');
  if (!events || !events.length) {
    if (btn) {
      btn.classList.add('shiver');
      setTimeout(() => btn.classList.remove('shiver'), 300);
    }
    return;
  }
  try {
    const ics = buildICS(events);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'harmonogram_przefiltrowany.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch (err) {
    console.error('Eksport ICS nie powiódł się', err);
    if (btn) {
      btn.classList.add('shiver');
      setTimeout(() => btn.classList.remove('shiver'), 600);
    }
  }
}

/**
 * Inicjalizuje przycisk eksportu
 */
function initExportButton(getLastFilteredCallback) {
  const exportBtn = document.getElementById('exportGoogle');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const lastFiltered = getLastFilteredCallback();
      exportToGoogleCalendar(lastFiltered);
    });
  }
}

export {
  exportToGoogleCalendar,
  initExportButton,
  buildICS
};
