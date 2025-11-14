// ui.js - Moduł zarządzający elementami UI (mapa kampusu, etc.)

/**
 * Inicjalizuje mapę kampusu
 */
function initCampusMap() {
  const buildings = document.querySelectorAll('.building-area');
  const mapContainer = document.querySelector('.map-container');

  if (!buildings.length || !mapContainer) return;

  buildings.forEach(building => {
    const code = building.dataset.building;
    const label = document.getElementById(`label-${code}`);

    if (!label) return;

    building.addEventListener('mouseenter', (e) => {
      // Pokaż tooltip
      label.classList.add('visible');

      // Pozycjonuj tooltip
      const rect = building.getBoundingClientRect();
      const containerRect = mapContainer.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2 - containerRect.left;
      const centerY = rect.top - containerRect.top;

      label.style.left = centerX + 'px';
      label.style.top = centerY + 'px';
    });

    building.addEventListener('mouseleave', () => {
      label.classList.remove('visible');
    });
  });
}

/**
 * Inicjalizuje wszystkie elementy UI
 */
function initUI() {
  initCampusMap();
}

export {
  initUI,
  initCampusMap
};
