// ===== CACHE I STORAGE UTILITIES =====

// Cache dla parsowanych dat
export const dateCache = new Map();

// Cache dla parsowanych komórek
export const cellDetailsCache = new Map();

// Funkcje do zarządzania localStorage
export function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch(e) {
    console.error('Błąd zapisywania do localStorage:', e);
    return false;
  }
}

export function loadFromLocalStorage(key, defaultValue = null) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch(e) {
    console.error('Błąd odczytu z localStorage:', e);
    return defaultValue;
  }
}

export function removeFromLocalStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch(e) {
    console.error('Błąd usuwania z localStorage:', e);
    return false;
  }
}

// Funkcja helper do escape HTML
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
