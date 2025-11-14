// ===== KONFIGURACJA I STAŁE =====

// Klucze localStorage
export const STORAGE_KEY = 'harm_filters_v1';
export const SCHEDULES_STORAGE_KEY = 'harm_schedules_v1';
export const ACTIVE_SCHEDULE_KEY = 'harm_active_schedule_v1';

// Warianty nazw miesięcy po polsku
export const MONTH_VARIANTS = {
  '01': ['stycznia'],
  '02': ['lutego'],
  '03': ['marca'],
  '04': ['kwietnia'],
  '05': ['maja'],
  '06': ['czerwca'],
  '07': ['lipca'],
  '08': ['sierpnia'],
  '09': ['wrzesnia', 'września', 'wrze?nia'],
  '10': ['października', 'pazdziernika', 'pa?dziernika'],
  '11': ['listopada'],
  '12': ['grudnia']
};

// Słowa kluczowe typów zajęć
export const TYPE_KEYWORDS = [
  ['LAB', 'LAB'],
  [' PROJEKT', 'PROJEKT'],
  ['PROJEKT', 'PROJEKT'],
  ['wykład', 'W'],
  ['konwersatorium', 'K'],
  ['ćw', 'ĆW'],
  [' ĆW', 'ĆW'],
  [' ?W', 'ĆW'],
  [' ?w', 'ĆW'],
  [' W ', 'W'],
  [' W\n', 'W'],
  ['\nW ', 'W'],
  [' K ', 'K'],
  [' K\n', 'K'],
];
