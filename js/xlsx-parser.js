// ===== PARSOWANIE XLSX =====

import { MONTH_VARIANTS, TYPE_KEYWORDS } from './config.js';
import { dateCache, cellDetailsCache } from './cache.js';

export function parsePolishDateCell(cell) {
  if (!cell) return null;
  const cacheKey = String(cell);
  if (dateCache.has(cacheKey)) return dateCache.get(cacheKey);

  const s = cacheKey.toLowerCase();

  const yearMatch = s.match(/(20\d{2})/);
  if (!yearMatch) return null;
  const year = parseInt(yearMatch[1]);

  const dayMatch = s.match(/\b(\d{1,2})\b/);
  if (!dayMatch) return null;
  const day = parseInt(dayMatch[1]);

  let monthNum = null;
  for (const [mNum, variants] of Object.entries(MONTH_VARIANTS)) {
    for (const v of variants) {
      if (s.includes(v)) {
        monthNum = mNum;
        break;
      }
    }
    if (monthNum) break;
  }

  if (!monthNum) {
    const parts = s.match(/[a-ząćęłńóśźż\?]+/gi) || [];
    if (parts.length >= 2) {
      const mid = parts[1].replace(/\?/g, 'z');
      for (const [mNum, variants] of Object.entries(MONTH_VARIANTS)) {
        if (variants.some(v => mid === v)) {
          monthNum = mNum;
          break;
        }
      }
    }
  }

  if (!monthNum) return null;

  try {
    const dt = new Date(Date.UTC(year, parseInt(monthNum) - 1, day));
    const result = dt.toISOString().split('T')[0];
    dateCache.set(cacheKey, result);
    return result;
  } catch (e) {
    dateCache.set(cacheKey, null);
    return null;
  }
}

export function addMinutes(hhmm, minutes) {
  const [h, m] = hhmm.split(':').map(Number);
  const dt = new Date(2000, 0, 1, h, m);
  dt.setMinutes(dt.getMinutes() + minutes);
  return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
}

export function parseCellDetails(text) {
  const s = String(text || '').trim();

  if (cellDetailsCache.has(s)) {
    const cached = cellDetailsCache.get(s);
    return {
      ...cached,
      lecturers: [...cached.lecturers]
    };
  }

  const base = {
    title: null,
    type: null,
    lecturers: [],
    location: null,
    isRemote: false,
    color: null,
    raw: s
  };

  if (!s) return base;

  const sUp = ' ' + s.toUpperCase();
  for (const [key, val] of TYPE_KEYWORDS) {
    if (sUp.includes(key.toUpperCase())) {
      base.type = val;
      break;
    }
  }

  const lecturerPattern = /\b(?:dr hab\.|dr|mgr|prof\.?)(?: [a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\.]+){1,3}/g;
  const lecturers = s.match(lecturerPattern) || [];
  if (lecturers.length) base.lecturers = lecturers;

  const roomPatterns = [
    /\b\d+\.\d+\s*(?:CP|CI|CsH)\b/i,
    /\b(?:CP|CI|CsH)\s*\d+\b/i,
    /\baula[^;\n]*/i,
    /\bsala[^;\n]*/i
  ];

  for (const pat of roomPatterns) {
    const m = s.match(pat);
    if (m) {
      base.location = m[0].trim();
      break;
    }
  }

  let t = s;
  t = t.replace(/\b\d+\s*\/\s*\d+\b/g, ' ');
  for (const lec of lecturers) t = t.replace(lec, ' ');
  if (base.location) t = t.replace(base.location, ' ');

  t = t.replace(/\bLAB\b/gi, ' ');
  t = t.replace(/\bPROJEKT\b/gi, ' ');
  t = t.replace(/\bĆW\b/gi, ' ');
  t = t.replace(/\bĆw\b/gi, ' ');
  t = t.replace(/\b[ćĆ]w\b/gi, ' ');
  t = t.replace(/\bK\b(?!\w)/g, ' ');
  t = t.replace(/\bwykład\b/gi, ' ');
  t = t.replace(/\bkonwersatorium\b/gi, ' ');
  t = t.replace(/^\s*W\s+/i, ' ');
  t = t.replace(/\s+W\s*$/i, ' ');
  t = t.replace(/\s+W\s+(?=[A-ZĄĆĘŁŃÓŚŹŻ])/g, ' ');

  t = t.replace(/\s+/g, ' ').replace(/^[ ;,\n\t]+|[ ;,\n\t]+$/g, '');

  if (t) base.title = t;

  cellDetailsCache.set(s, base);

  return base;
}

export function isCellTextRed(cell) {
  if (!cell) return false;

  const font = cell.font;
  if (font && font.color) {
    const color = font.color;

    if (color.argb) {
      const argb = String(color.argb).toUpperCase();
      const rgb = argb.length >= 6 ? argb.slice(-6) : argb;

      if (rgb === 'FF0000' || argb === 'FFFF0000' ||
        rgb.startsWith('FF00') || rgb.startsWith('F00') ||
        rgb.startsWith('E00') || rgb.startsWith('C00')) {
        return true;
      }
    }

    if (color.indexed !== undefined) {
      const redIndexes = [2, 3, 10];
      if (redIndexes.includes(color.indexed)) {
        return true;
      }
    }

    if (color.theme !== undefined) {
      if (color.theme === 2 || color.theme === 6) {
        return true;
      }
    }
  }

  let text = '';
  if (cell.value) {
    if (cell.value.richText) {
      text = cell.value.richText.map(t => t.text).join('');
    } else {
      text = String(cell.value);
    }

    text = text.toLowerCase();
    if (text.includes('zdalnie') || text.includes('online') || text.includes('teams')) {
      return true;
    }
  }

  return false;
}

export async function parseXLSXToEvents(arrayBuffer, fileName) {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.worksheets[0];
    const maxCol = worksheet.columnCount;
    const maxRow = worksheet.rowCount;

    const headers = {};
    let lastZjazd = null, lastDateRaw = null, lastDay = null, lastProgram = null;

    const getCellValue = (row, col) => {
      const cell = worksheet.getRow(row).getCell(col);
      return cell ? cell.value : null;
    };

    const getCell = (row, col) => worksheet.getRow(row).getCell(col);

    const toDateISO = (val) => {
      if (!val) return null;
      if (val instanceof Date) {
        const year = val.getUTCFullYear();
        const month = String(val.getUTCMonth() + 1).padStart(2, '0');
        const day = String(val.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      if (typeof val === 'number') {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        const d = new Date(excelEpoch.getTime() + val * 86400000);
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      if (val && val.richText) {
        const text = val.richText.map(t => t.text).join('');
        return parsePolishDateCell(text);
      }
      return parsePolishDateCell(String(val));
    };

    for (let c = 1; c <= maxCol; c++) {
      const zjazd = getCellValue(1, c);
      const dateV = getCellValue(2, c);
      const dayV = getCellValue(3, c);
      const programV = getCellValue(4, c);

      if (zjazd && String(zjazd).trim()) {
        const zjazdStr = String(zjazd).trim().toLowerCase();
        if (zjazdStr !== 'nr' && zjazdStr !== 'zjazd' && zjazdStr !== 'lp' && zjazdStr !== 'lp.') {
          lastZjazd = String(zjazd).trim();
        }
      }
      if (dateV) lastDateRaw = dateV;
      if (dayV && String(dayV).trim()) lastDay = String(dayV).trim();
      if (programV && String(programV).trim()) lastProgram = String(programV).trim();

      headers[c] = {
        zjazd: lastZjazd,
        date: toDateISO(lastDateRaw),
        day: lastDay,
        program: lastProgram
      };
    }

    const mergedMap = {};
    const merges = worksheet.model?.merges || [];
    for (const mergeAddr of merges) {
      const [start, end] = mergeAddr.split(':');
      const startCell = worksheet.getCell(start);
      const endCell = worksheet.getCell(end);

      const minR = startCell.row;
      const minC = startCell.col;
      const maxR = endCell.row;
      const maxC = endCell.col;

      for (let rr = minR; rr <= maxR; rr++) {
        for (let cc = minC; cc <= maxC; cc++) {
          mergedMap[`${rr},${cc}`] = { minR, minC, maxR, maxC };
        }
      }
    }

    const timeFromRow = (rr) => {
      if (rr < 6) return null;
      const idx = rr - 6;
      const h = 8 + Math.floor((idx * 15) / 60);
      const m = (idx * 15) % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const events = [];

    for (let c = 1; c <= maxCol; c++) {
      const meta = headers[c] || {};
      const dateISO = meta.date;
      const dayName = meta.day;
      const program = meta.program;
      const zjazd = meta.zjazd;

      if (!dateISO || !program || !zjazd) continue;

      const zjazdLower = String(zjazd).toLowerCase().trim();
      if (zjazdLower === 'nr' || zjazdLower === 'zjazd' || zjazdLower === 'lp' || zjazdLower === 'lp.') continue;

      if (!/\d/.test(String(zjazd))) continue;

      const yearMatch = dateISO.match(/^(\d{4})/);
      if (yearMatch && parseInt(yearMatch[1]) < 2020) continue;

      let r = 6;
      while (r <= Math.min(maxRow, 57)) {
        const mergeKey = `${r},${c}`;
        const tl = mergedMap[mergeKey];
        let height = 1;
        let topLeftR = r, topLeftC = c;

        if (tl) {
          if (r !== tl.minR || c !== tl.minC) {
            r++;
            continue;
          }
          height = tl.maxR - tl.minR + 1;
          topLeftR = tl.minR;
          topLeftC = tl.minC;
        }

        const cellObj = getCell(topLeftR, topLeftC);
        const cellVal = cellObj ? cellObj.value : null;
        let text = '';

        if (cellVal && cellVal.richText) {
          text = cellVal.richText.map(t => t.text).join('').trim();
        } else {
          text = String(cellVal || '').trim();
        }

        if (text) {
          const details = parseCellDetails(text);

          if (!details.title || !details.title.trim()) {
            r++;
            continue;
          }

          const titleOnlyDigits = /^[\d\s:.\-/]+$/.test(details.title.trim());
          if (titleOnlyDigits) {
            r++;
            continue;
          }

          const startTime = timeFromRow(r);
          const endTime = startTime ? addMinutes(startTime, height * 15) : null;
          const remote = isCellTextRed(cellObj);

          events.push({
            zjazd: zjazd,
            program: program,
            date: dateISO,
            day: dayName,
            startTime: startTime,
            endTime: endTime,
            title: details.title,
            type: details.type,
            lecturers: details.lecturers,
            location: details.location,
            isRemote: remote,
            color: remote ? 'red' : null,
            raw: details.raw
          });

          r += height;
        } else {
          r++;
        }
      }
    }

    events.sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);

      const progA = a.program || '';
      const progB = b.program || '';
      if (progA !== progB) return progA.localeCompare(progB);

      const timeA = a.startTime || '';
      const timeB = b.startTime || '';
      return timeA.localeCompare(timeB);
    });

    return {
      source_file: fileName,
      generated_at: new Date().toISOString(),
      program: 'ALL',
      events: events
    };
  } catch (err) {
    console.error('Błąd parsowania XLSX:', err);
    throw new Error('Nie udało się przetworzyć pliku XLSX: ' + err.message);
  }
}
