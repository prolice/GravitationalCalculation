// moons-autofill-init.js
// - Charge uniquement 8 planètes + Pluton
// - Construit des index : MOON_PARENT (lune->planète) et MOONS_BY_PLANET (planète->[lunes])
// - Émet 'moons:updated' une fois prêt

(function () {
  const statusEl  = document.getElementById('wd-status');
  const barEl     = document.getElementById('wd-progress');
  const barWrapEl = barEl && barEl.closest('.progress');

  const ALLOWED_PLANETS = [
    'Mercure','Vénus','Terre','Mars','Jupiter','Saturne','Uranus','Neptune','Pluton'
  ];

  function updateProgress(index, total, planet) {
    const pct = Math.round(((index + 1) / total) * 100);
    if (barEl)  barEl.style.width = pct + '%';
    if (statusEl) statusEl.textContent = `Chargement des lunes : ${planet} (${index + 1}/${total})…`;
    if (pct === 100) {
      setTimeout(() => {
        if (statusEl) statusEl.textContent = '';
        if (barWrapEl) barWrapEl.style.visibility = 'hidden';
      }, 400);
    }
  }

  function buildMoonIndexes(presets) {
    const parentByMoon = Object.create(null);
    const moonsByPlanet = Object.create(null);
    const norm = s => String(s).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    (ALLOWED_PLANETS).forEach(p => {
      const arr = Array.isArray(presets?.[p]) ? presets[p] : [];
      moonsByPlanet[p] = arr.slice();
      arr.forEach(m => {
        if (!m?.name) return;
        parentByMoon[m.name] = p;
        parentByMoon[norm(m.name)] = p;
      });
    });
    return { parentByMoon, moonsByPlanet };
  }

  window.addEventListener('DOMContentLoaded', () => {
    if (typeof window.completeMoonPresetsFromWikidata !== 'function') return;

    if (barWrapEl) barWrapEl.style.visibility = 'visible';
    if (barEl)     barEl.style.width = '0%';
    if (statusEl)  statusEl.textContent = 'Chargement des lunes…';

    window.MOONS_READY = window.completeMoonPresetsFromWikidata({
      planets: ALLOWED_PLANETS,
      onProgress: ({ planet, index, total }) => updateProgress(index, total, planet)
    });

    window.MOONS_READY.then(() => {
      const { parentByMoon, moonsByPlanet } = buildMoonIndexes(window.MOON_PRESETS);
      window.MOON_PARENT     = parentByMoon;   // "Io" -> "Jupiter"
      window.MOONS_BY_PLANET = moonsByPlanet;  // "Jupiter" -> [{name, a_km, e, ...}]

      document.dispatchEvent(new CustomEvent('moons:updated', {
        detail: { planets: ALLOWED_PLANETS.slice(), presets: window.MOON_PRESETS, moonsByPlanet, parentByMoon }
      }));

      if (typeof window.drawScene === 'function') window.drawScene();
    });
  });
})();
