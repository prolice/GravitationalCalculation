/* Moons catalog — seeds + exhaustive autofill from Wikidata
   - Conserve tes presets pour les lunes majeures (rendu immédiat)
   - Auto-complète à l’exécution avec toutes les lunes connues
   - Filtre strict: uniquement les *satellites naturels* (Q2537)
   - Lit a (P2233) + unité, et e (P1096); convertit a en kilomètres
   - Sûr à inclure *avant* app.js ; expose:
       window.MOON_PRESETS
       window.completeMoonPresetsFromWikidata(options?)
*/

(function () {
  // Palette simple (recyclée si > longueur)
  const PALETTE = [
    '#888', '#6b7280', '#9ca3af', '#d97706', '#60a5fa', '#10b981', '#8b5cf6',
    '#f59e0b', '#a7f3d0', '#38bdf8', '#ef4444', '#22c55e', '#3b82f6', '#a855f7',
    '#eab308', '#14b8a6', '#e11d48', '#0ea5e9', '#84cc16', '#f97316'
  ];
  let _paletteIdx = 0;
  const nextColor = () => PALETTE[(_paletteIdx++) % PALETTE.length];

  // ===== 1) PRESETS (rendu immédiat) =====
  const MOON_PRESETS = {
    'Mercure': [], // pas de lunes
    'Vénus':   [], // pas de lunes

    'Terre': [
      { name: 'Lune', a_km: 384400, e: 0.0549, color: '#888' },
    ],

    'Mars': [
      { name: 'Phobos', a_km: 9376,  e: 0.0151,  color: '#6b7280' },
      { name: 'Déimos', a_km: 23463, e: 0.0002,  color: '#9ca3af' },
    ],

    'Jupiter': [
      { name: 'Io',        a_km: 421700,  e: 0.0041, color: '#d97706' },
      { name: 'Europe',    a_km: 671034,  e: 0.0090, color: '#60a5fa' },
      { name: 'Ganymède',  a_km: 1070412, e: 0.0013, color: '#10b981' },
      { name: 'Callisto',  a_km: 1882709, e: 0.0070, color: '#8b5cf6' },
    ],

    'Saturne': [
      { name: 'Mimas',     a_km: 185539,  e: 0.0196, color: nextColor() },
      { name: 'Encelade',  a_km: 238037,  e: 0.0047, color: '#a7f3d0' },
      { name: 'Téthys',    a_km: 294619,  e: 0.0001, color: nextColor() },
      { name: 'Dioné',     a_km: 377396,  e: 0.0022, color: nextColor() },
      { name: 'Rhéa',      a_km: 527108,  e: 0.0010, color: nextColor() },
      { name: 'Titan',     a_km: 1221870, e: 0.0288, color: '#f59e0b' },
      { name: 'Hypérion',  a_km: 1481100, e: 0.1042, color: nextColor() },
      { name: 'Japet',     a_km: 3560820, e: 0.0283, color: nextColor() },
      { name: 'Phoebe',    a_km: 12952000,e: 0.1634, color: nextColor() },
    ],

    'Uranus': [
      { name: 'Miranda', a_km: 129900, e: 0.0013, color: nextColor() },
      { name: 'Ariel',   a_km: 190900, e: 0.0012, color: nextColor() },
      { name: 'Umbriel', a_km: 266000, e: 0.0042, color: nextColor() },
      { name: 'Titania', a_km: 436300, e: 0.0011, color: nextColor() },
      { name: 'Obéron',  a_km: 583500, e: 0.0014, color: nextColor() },
    ],

    'Neptune': [
      { name: 'Néso',       a_km: 48387000, e: 0.571,  color: nextColor() },
      { name: 'Psamathée',  a_km: 46695000, e: 0.450,  color: nextColor() },
      { name: 'Laomédie',   a_km: 23571000, e: 0.396,  color: nextColor() },
      { name: 'Sao',        a_km: 22422000, e: 0.137,  color: nextColor() },
      { name: 'Halimède',   a_km: 16611000, e: 0.265,  color: nextColor() },
      { name: 'Néréide',    a_km: 5513818,  e: 0.751,  color: nextColor() },
      { name: 'Triton',     a_km: 354759,   e: 0.0000, color: '#38bdf8' },
      { name: 'Protée',     a_km: 117646,   e: 0.0005, color: nextColor() },
      { name: 'Hippocampe', a_km: 105300,   e: 0.0000, color: nextColor() },
      { name: 'Larissa',    a_km: 73548,    e: 0.0014, color: nextColor() },
      { name: 'Galatée',    a_km: 61953,    e: 0.0002, color: nextColor() },
      { name: 'Despina',    a_km: 52526,    e: 0.0001, color: nextColor() },
      { name: 'Thalassa',   a_km: 50074,    e: 0.0002, color: nextColor() },
      { name: 'Naïade',     a_km: 48227,    e: 0.0047, color: nextColor() },
    ],

    'Pluton': [
      { name: 'Charon',   a_km: 19596, e: 0.0002, color: nextColor() },
      { name: 'Styx',     a_km: 42656, e: 0.0000, color: nextColor() },
      { name: 'Nix',      a_km: 48694, e: 0.0020, color: nextColor() },
      { name: 'Kerbéros', a_km: 57783, e: 0.0070, color: nextColor() },
      { name: 'Hydra',    a_km: 64738, e: 0.0050, color: nextColor() },
    ],

    // Planètes naines / TNOs notables (certaines sans lunes)
    'Cérès':   [], // aucune lune connue
    'Hauméa':  [], // Hiʻiaka, Namaka seront ajoutées via WD
    'Makémaké':[], // S/2015 (136472) 1 (MK2) via WD
    'Éris':    [], // Dysnomia via WD
    'Quaoar':  [], // Weywot via WD
    'Orcus':   [], // Vanth via WD
    'Gonggong':[], // Xiangliu via WD
    'Salacie': [], // Actaea via WD
    'Sedna':   [], // aucune lunaire connue
  };

  // ===== 2) WIKIDATA (autofill exhaustif) =====

  // QIDs des corps parents (WD)
  const WD_QID = {
    'Mercure':  'Q308',
    'Vénus':    'Q313',
    'Terre':    'Q2',
    'Mars':     'Q111',
    'Jupiter':  'Q319',
    'Saturne':  'Q193',
    'Uranus':   'Q324',
    'Neptune':  'Q332',
    'Pluton':   'Q339',

    // planètes naines / TNOs
    'Cérès':    'Q596',
    'Hauméa':   'Q601',
    'Makémaké': 'Q604',
    'Éris':     'Q611',
    'Quaoar':   'Q15586',
    'Orcus':    'Q15603',
    'Gonggong': 'Q6587',
    'Salacie':  'Q136964',
    'Sedna':    'Q15610',
  };

  // Convertit "Q11573" (mètre) / "Q828224" (kilomètre) / "Q174728" (UA) -> facteur vers km
  function unitToKmFactor(unitIri) {
    if (!unitIri) return 1e-3; // par défaut: m -> km
    if (unitIri.endsWith('/Q11573')) return 1e-3;         // metre
    if (unitIri.endsWith('/Q828224')) return 1;           // kilometre
    if (unitIri.endsWith('/Q174728')) return 149597870.7; // astronomical unit -> km
    return 1e-3; // fallback (m)
  }

  function colorFor(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = ((h << 5) - h) + name.charCodeAt(i);
    const idx = Math.abs(h) % PALETTE.length;
    return PALETTE[idx];
  }

  function ensurePresetBucket(obj, key) {
    if (!obj[key]) obj[key] = [];
    return obj[key];
  }

  function hasMoon(arr, moonName) {
    return !!arr.find(m => m.name.toLowerCase() === String(moonName).toLowerCase());
  }

  // petit utilitaire fetch avec backoff sur 429/503
  async function fetchJSON(url, { signal, tries = 3, pauseMs = 800 } = {}) {
    for (let k = 0; k < tries; k++) {
      const res = await fetch(url, {
        headers: { 'Accept': 'application/sparql-results+json' },
        signal
      });
      if (res.ok) return res.json();
      if ((res.status === 429 || res.status >= 500) && k < tries - 1) {
        await new Promise(r => setTimeout(r, pauseMs * (k + 1)));
        continue;
      }
      throw new Error(`WDQS HTTP ${res.status}`);
    }
  }

  async function fetchMoonsFor(planetName, signal) {
    const qid = WD_QID[planetName];
    if (!qid) return [];

    // SPARQL : satellites naturels d’un corps parent + a (quantité + unité) + e
    // - filtre strict par "instance of / subclass of" natural satellite (Q2537)
    const sparql = `
      SELECT ?moon ?moonLabel ?aAmount ?aUnit ?e WHERE {
        ?moon wdt:P397 wd:${qid} .
        ?moon wdt:P31/wdt:P279* wd:Q2537 .  # natural satellite only

        OPTIONAL {
          ?moon p:P2233/psn:P2233 ?aNode .
          ?aNode wikibase:quantityAmount ?aAmount ;
                 wikibase:quantityUnit   ?aUnit .
        }
        OPTIONAL { ?moon wdt:P1096 ?e . }   # orbital eccentricity
        SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". }
      }
      ORDER BY ?moonLabel
    `.trim();

    const url = 'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(sparql);
    const json = await fetchJSON(url, { signal });
    const rows = (json && json.results && json.results.bindings) || [];

    return rows.map(r => {
      const name = r.moonLabel?.value || r.moon?.value?.split('/').pop() || 'Lune';
      const aAmt = r.aAmount ? Number(r.aAmount.value) : NaN;
      const aUnit = r.aUnit?.value || '';
      const e     = r.e ? Number(r.e.value) : null;
      const km    = Number.isFinite(aAmt) ? aAmt * unitToKmFactor(aUnit) : null;
      return {
        name,
        a_km: (km !== null && Number.isFinite(km)) ? Math.round(km) : null,
        e:    (e  !== null && Number.isFinite(e))  ? +e : null,
        color: colorFor(name)
      };
    });
  }

  async function completeMoonPresetsFromWikidata(options = {}) {
    const {
      planets = Object.keys(WD_QID),
      onProgress = () => {}
    } = options;

    const controller = new AbortController();
    const { signal } = controller;

    try {
      for (let i = 0; i < planets.length; i++) {
        const pname = planets[i];
        onProgress({ planet: pname, index: i, total: planets.length });

        const bucket = ensurePresetBucket(MOON_PRESETS, pname);
        const fetched = await fetchMoonsFor(pname, signal);

        // Fusion: on ajoute ce qui n’existe pas déjà (a_km/e peuvent être null)
        fetched.forEach(m => {
          if (!m.name) return;
          if (!hasMoon(bucket, m.name)) {
            bucket.push({
              name:  m.name,
              a_km:  m.a_km ?? undefined,
              e:     m.e    ?? undefined,
              color: m.color || nextColor()
            });
          }
        });

        // Tri: par a_km si dispo, sinon alpha
        bucket.sort((A, B) => {
          const aA = Number.isFinite(A.a_km) ? A.a_km : null;
          const aB = Number.isFinite(B.a_km) ? B.a_km : null;
          if (aA !== null && aB !== null) return aA - aB;
          if (aA !== null) return -1;
          if (aB !== null) return 1;
          return A.name.localeCompare(B.name, 'fr', { sensitivity: 'base' });
        });
      }
    } catch (err) {
      console.warn('Wikidata autofill aborted/failed:', err);
      // On laisse simplement les seeds ; l’appli reste fonctionnelle
    }

    return MOON_PRESETS;
  }

  // Expose global
  window.MOON_PRESETS = MOON_PRESETS;
  window.completeMoonPresetsFromWikidata = completeMoonPresetsFromWikidata;
})();
