// Charge via public/api/moons_jpl.php, avec timeout client (20s) + fallback seeds.
(function () {
  const statusEl  = document.getElementById('wd-status');
  const barEl     = document.getElementById('wd-progress');
  const barWrapEl = barEl && barEl.closest('.progress');

  const ALLOWED_PLANETS = ['Mercure','Vénus','Terre','Mars','Jupiter','Saturne','Uranus','Neptune','Pluton'];

  function resolveApiUrl() {
    const baseTag = document.querySelector('base[href]');
    if (baseTag) return new URL('api/moons_jpl.php', baseTag.href).toString();
    const path = window.location.pathname.replace(/[^/]*$/, '');
    return path + 'api/moons_jpl.php';
  }
  const API_URL = resolveApiUrl();

  function setProgress(pct, label){
    if (barEl) barEl.style.width = pct + '%';
    if (statusEl && label !== undefined) statusEl.textContent = label;
  }

  function buildIndexes(presets){
    const parentByMoon = Object.create(null);
    const moonsByPlanet = Object.create(null);
    const norm = s => String(s).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    ALLOWED_PLANETS.forEach(p => {
      const list = Array.isArray(presets?.[p]) ? presets[p] : [];
      moonsByPlanet[p] = list.slice();
      list.forEach(m => { if (!m?.name) return; parentByMoon[m.name] = p; parentByMoon[norm(m.name)] = p; });
    });
    return { parentByMoon, moonsByPlanet };
  }

  function fetchWithTimeout(resource, options = {}) {
    const { timeout = 20000 } = options; // 20s
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    return fetch(resource, { ...options, signal: controller.signal })
      .finally(() => clearTimeout(id));
  }

  async function loadFromJPL(){
    setProgress(10, 'Contact JPL…');
    const res = await fetchWithTimeout(API_URL, { headers: { 'Accept': 'application/json' }, timeout: 20000 });
    if (!res.ok) {
      let msg = `API ${res.status}`;
      try { const err = await res.json(); if (err && err.error) msg += ` — ${err.error}`; } catch {}
      throw new Error(msg);
    }
    setProgress(70, 'Traitement des données…');
    return res.json();
  }

  window.addEventListener('DOMContentLoaded', async () => {
    try {
      if (barWrapEl) barWrapEl.style.visibility = 'visible';
      setProgress(0, 'Chargement des lunes…');

      const jpl = await loadFromJPL();

      window.MOON_PRESETS = window.MOON_PRESETS || {};
      ALLOWED_PLANETS.forEach(p => {
        const src = Array.isArray(jpl[p]) ? jpl[p] : [];
        const bucket = window.MOON_PRESETS[p] || (window.MOON_PRESETS[p] = []);
        const has = name => bucket.some(x => String(x.name).toLowerCase() === String(name).toLowerCase());
        src.forEach(m => {
          if (!m?.name || has(m.name)) return;
          bucket.push({
            name: m.name,
            a_km: (typeof m.a_km === 'number' && isFinite(m.a_km)) ? Math.round(m.a_km) : undefined,
            e:    (typeof m.e    === 'number' && isFinite(m.e))    ? +m.e : undefined,
            color: (window.colorFor ? window.colorFor(m.name) : undefined)
          });
        });
        // tri
        bucket.sort((A,B)=>{
          const aA = Number.isFinite(A.a_km) ? A.a_km : null;
          const aB = Number.isFinite(B.a_km) ? B.a_km : null;
          if (aA!==null && aB!==null) return aA-aB;
          if (aA!==null) return -1;
          if (aB!==null) return 1;
          return String(A.name).localeCompare(String(B.name),'fr',{sensitivity:'base'});
        });
      });

      const { parentByMoon, moonsByPlanet } = buildIndexes(window.MOON_PRESETS);
      window.MOON_PARENT     = parentByMoon;
      window.MOONS_BY_PLANET = moonsByPlanet;

      setProgress(100, '');
      setTimeout(()=>{ if (barWrapEl) barWrapEl.style.visibility='hidden'; }, 400);

      document.dispatchEvent(new CustomEvent('moons:updated', {
        detail: { presets: window.MOON_PRESETS, moonsByPlanet, parentByMoon, planets: ALLOWED_PLANETS.slice() }
      }));
      if (typeof window.drawScene === 'function') window.drawScene();

      window.MOONS_READY = Promise.resolve(window.MOON_PRESETS);
    } catch (err) {
      console.warn('JPL load failed:', err);
      setProgress(100, 'API JPL indisponible (timeout/erreur) — utilisation des seeds locales');
      // Fallback doux: expose quand même les structures pour que l’UI fonctionne avec les seeds
      window.MOON_PRESETS = window.MOON_PRESETS || {};
      const { parentByMoon, moonsByPlanet } = buildIndexes(window.MOON_PRESETS);
      window.MOON_PARENT     = parentByMoon;
      window.MOONS_BY_PLANET = moonsByPlanet;
      document.dispatchEvent(new CustomEvent('moons:updated', {
        detail: { presets: window.MOON_PRESETS, moonsByPlanet, parentByMoon, planets: ALLOWED_PLANETS.slice() }
      }));
      if (typeof window.drawScene === 'function') window.drawScene();
      window.MOONS_READY = Promise.resolve(window.MOON_PRESETS);
    }
  });
})();
