// assets/js/moons-ui-refresh.js
(function () {
  const PLANETS_ORDER = ['Mercure','Vénus','Terre','Mars','Jupiter','Saturne','Uranus','Neptune','Pluton'];

  // ---- Hints helpers (si hints.js est présent)
  function hintsDispose(scope) {
    try { window.Hints && window.Hints.dispose(scope || document); } catch {}
  }
  function hintsRefresh(scope) {
    try {
      // rafraîchit proprement (dispose + init) via l'API de hints.js
      document.dispatchEvent(new CustomEvent('hints:refresh', { detail: { scope: scope || document }}));
    } catch {}
  }

  // ---- Data helpers
  function getMoons(planet) {
    const list = (window.MOONS_BY_PLANET && window.MOONS_BY_PLANET[planet]) || [];
    return Array.isArray(list) ? list : [];
  }

  function refreshPresetSelect() {
    const sel = document.getElementById('presetSelect');
    if (!sel) return;
    const current = sel.value;

    const opts = PLANETS_ORDER.map(p => {
      const count = getMoons(p).length;
      const label = p === 'Pluton' ? `Pluton (naine)${count ? ` (${count})` : ''}` : (count ? `${p} (${count})` : p);
      return `<option value="${p}">${label}</option>`;
    }).join('');

    sel.innerHTML = `<option value="">— Charger planète —</option>${opts}`;
    if (current && PLANETS_ORDER.includes(current)) sel.value = current;
  }

  function fillMoonPresetSelect(selectEl, planet) {
    if (!selectEl) return;
    const moons = getMoons(planet);
    const currentVal = selectEl.value;

    const head  = `<option value="">— Lune —</option>`;
    const opts  = moons.map(m => {
      const a = Number.isFinite(m.a_km) ? ` — a≈${m.a_km.toLocaleString('fr-BE')} km` : '';
      const e = (typeof m.e === 'number' && isFinite(m.e)) ? ` — e=${m.e}` : '';
      return `<option value="${m.name}" data-a-km="${m.a_km ?? ''}" data-e="${m.e ?? ''}" data-planet="${planet}">${m.name}${a}${e}</option>`;
    }).join('');

    selectEl.innerHTML = head + opts;
    selectEl.disabled = moons.length === 0;

    // Restaure la sélection si encore valide
    if (currentVal && moons.some(m => String(m.name) === String(currentVal))) {
      selectEl.value = currentVal;
    }
  }

  function findPlanetNameInRow(row) {
    if (!row) return '';
    // 1) attributs explicites
    const attr = row.getAttribute('data-planet') || row.getAttribute('data-planet-name');
    if (attr) return attr;

    // 2) select planète interne
    const pSel = row.querySelector('[data-role="planet-select"], select.planet-select, select[name="planet"], select[data-planet]');
    if (pSel && pSel.value) return pSel.value;

    // 3) badge/label
    const label = row.querySelector('[data-role="planet-name"], .planet-name, .badge-planet, .card-title, .h5, h5');
    if (label && label.textContent) {
      const txt = label.textContent.trim();
      const canon = PLANETS_ORDER.find(p => txt.startsWith(p));
      if (canon) return canon;
    }
    return '';
  }

  // ---- Après ajout d'une planète : remplir ses selects lune
  function afterPlanetAddedPopulate(planet) {
    const list = document.getElementById('planetsList');
    if (!list) return;

    // Dispose les hints avant maj
    hintsDispose(list);

    const rows = Array.from(list.querySelectorAll('.planet-row, [data-planet-row]'));
    const row = rows[rows.length - 1] || null;

    const selects = row
      ? Array.from(row.querySelectorAll('select.p-moon-preset'))
      : Array.from(list.querySelectorAll('select.p-moon-preset'));

    selects.forEach(sel => fillMoonPresetSelect(sel, planet || findPlanetNameInRow(row || sel.closest('.planet-row') || document)));

    // Réinit hints après maj
    hintsRefresh(list);
  }

  // ---- Bouton "Ajouter" du bandeau haut
  function wireAddPlanetButton() {
    const btn = document.getElementById('btnAddPreset');
    const presetSel = document.getElementById('presetSelect');
    const list = document.getElementById('planetsList');
    if (!btn || !presetSel || !list) return;

    btn.addEventListener('click', () => {
      const planet = presetSel.value;
      if (!planet) return;

      const beforeCount = list.childElementCount;
      const observer = new MutationObserver(() => {
        const afterCount = list.childElementCount;
        if (afterCount > beforeCount) {
          observer.disconnect();
          setTimeout(() => afterPlanetAddedPopulate(planet), 0);
        }
      });
      observer.observe(list, { childList: true });

      setTimeout(() => { observer.disconnect(); afterPlanetAddedPopulate(planet); }, 1000);
    });
  }

  // ---- Branche les boutons "Ajouter lune" dans un scope (ligne)
  function wireAddMoonButtons(scope) {
    const root = scope || document;
    const selectors = [
      '.p-add-moon',        // <<< ton bouton
      '.btn-add-moon',
      '[data-action="add-moon"]',
      '#btnAddMoon'
    ];
    const buttons = new Set();
    selectors.forEach(sel => root.querySelectorAll(sel).forEach(b => buttons.add(b)));

    buttons.forEach(btn => {
      if (btn.dataset.boundAddMoon === '1') return; // évite double-binding
      btn.dataset.boundAddMoon = '1';

      btn.addEventListener('click', () => {
        const row = btn.closest('.planet-row, [data-planet-row]') || document;

        // Sélecteur de lune le plus proche de ce bouton / cette ligne
        let moonSel =
          row.querySelector('select.p-moon-preset') ||
          document.getElementById('moonSelect');

        // Si le select n'est pas encore rempli, essaye de le remplir maintenant
        if (moonSel && (!moonSel.options || moonSel.options.length <= 1)) {
          const planet = findPlanetNameInRow(row) || (moonSel.getAttribute('data-planet') || '');
          if (planet) fillMoonPresetSelect(moonSel, planet);
        }

        // Si rien choisi, sélectionner la 1re lune disponible
        if (moonSel && (!moonSel.value || moonSel.value === '') && moonSel.options && moonSel.options.length > 1) {
          moonSel.selectedIndex = 1;
        }

        const selectedMoon = (moonSel && moonSel.value) ? moonSel.value : '';
        if (!selectedMoon) return;

        // Déduire la planète (ligne > select data > MOON_PARENT)
        let planet = findPlanetNameInRow(row);
        if (!planet) planet = moonSel?.getAttribute('data-planet') || '';
        if (!planet && window.MOON_PARENT) {
          const key = String(selectedMoon).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
          planet = window.MOON_PARENT[selectedMoon] || window.MOON_PARENT[key] || '';
        }
        if (!planet) {
          console.warn('Impossible de déduire la planète pour la lune', selectedMoon);
          return;
        }

        // App hook vers l’animation
        if (typeof window.addMoonToAnimation === 'function') {
          window.addMoonToAnimation({ planet, moon: selectedMoon });
        } else if (typeof window.addOrbitBody === 'function') {
          window.addOrbitBody({ planet, moon: selectedMoon });
        } else {
          // évènement UI générique — ton app.js peut écouter ceci
          document.dispatchEvent(new CustomEvent('ui:moon-selected', { detail: { planet, moon: selectedMoon } }));
        }

        // Rafraîchir les hints juste après (les tables stats viennent souvent d’être regénérées)
        setTimeout(() => hintsRefresh(document), 0);
      });
    });
  }

  // ---- Branche une ligne planète (utile si clone/template)
  function wirePlanetRow(row) {
    if (!row) return;

    // Si la ligne contient un select planète -> tenir à jour la/les liste(s) lune
    const pSel = row.querySelector('[data-role="planet-select"], select.planet-select, select[name="planet"], select[data-planet]');
    if (pSel) {
      pSel.addEventListener('change', () => {
        const planet = pSel.value;
        row.querySelectorAll('select.p-moon-preset').forEach(sel => fillMoonPresetSelect(sel, planet));
      });
    }

    // Remplir immédiatement si la planète est déjà indiquée
    const planet = findPlanetNameInRow(row);
    if (planet) row.querySelectorAll('select.p-moon-preset').forEach(sel => fillMoonPresetSelect(sel, planet));

    // Bouton "Ajouter lune" de la ligne
    wireAddMoonButtons(row);
  }

  function initAll() {
    refreshPresetSelect();

    const list = document.getElementById('planetsList');
    if (list) {
      hintsDispose(list);
      list.querySelectorAll('.planet-row, [data-planet-row]').forEach(wirePlanetRow);
      hintsRefresh(list);
    }

    wireAddPlanetButton();
    wireAddMoonButtons(document); // boutons globaux éventuels
  }

  // Premier passage si index déjà prêts (cache)
  if (window.MOONS_BY_PLANET) initAll();

  // Après chargement JPL/Horizons
  document.addEventListener('moons:updated', initAll);

  // Si l'app ajoute dynamiquement des lignes et émet 'planet:added' {planet}
  document.addEventListener('planet:added', (ev) => {
    const planet = ev.detail && ev.detail.planet;
    afterPlanetAddedPopulate(planet || '');
    const list = document.getElementById('planetsList');
    if (list) {
      const rows = list.querySelectorAll('.planet-row, [data-planet-row]');
      wirePlanetRow(rows[rows.length - 1]);
    }
  });
})();
