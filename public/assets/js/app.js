(function () {
  // Raccourcis constants depuis window.PHYS (garantis par header.php)
  const { AU, JULIAN_YEAR, DAY_S } = window.PHYS;

  // === Masses planétaires (kg) pour les lunes ===
  const PLANET_MASS_KG = {
    'Mercure': 3.3011e23,
    'Vénus': 4.8675e24,
    'Terre': 5.9736e24,
    'Mars': 6.4171e23,
    'Jupiter': 1.8982e27,
    'Saturne': 5.6834e26,
    'Uranus': 8.6810e25,
    'Neptune': 1.02413e26,
    'Pluton': 1.30900e22
  };
  // --- Rayons planétaires (km) & rotation sidérale (heures) pour overlays pédagogiques ---
  const PLANET_RADIUS_KM = {
    'Mercure': 2439.7, 'Vénus': 6051.8, 'Terre': 6371.0, 'Mars': 3389.5,
    'Jupiter': 69911, 'Saturne': 58232, 'Uranus': 25362, 'Neptune': 24622
  };
  const ROTATION_PERIOD_H = {
    'Mercure': 1407.5, 'Vénus': -5832.5, 'Terre': 23.934, 'Mars': 24.623,
    'Jupiter': 9.925, 'Saturne': 10.7, 'Uranus': -17.24, 'Neptune': 16.11
  };


  // === Compositions atmosphériques (HTML) ===
  const ATMOS = {
    'Mercure': '<b>Exosphère</b>: He, Na, O, H, K (traces)',
    'Vénus': 'CO₂ ~96.5%, N₂ ~3.5%, traces SO₂, Ar, H₂O',
    'Terre': 'N₂ 78.08%, O₂ 20.95%, Ar 0.93%, CO₂ 0.04%',
    'Mars': 'CO₂ 95.3%, N₂ 2.7%, Ar 1.6%, traces O₂, CO',
    'Jupiter': 'H₂ ~89.8%, He ~10.2%, traces CH₄, NH₃',
    'Saturne': 'H₂ ~96.3%, He ~3.25%, traces CH₄',
    'Uranus': 'H₂ 82.5%, He 15.2%, CH₄ 2.3%',
    'Neptune': 'H₂ 80%, He 19%, CH₄ ~1.5%',
    'Pluton': 'N₂ ~99%, CH₄, CO (saisonnier)',
    'Lune': '<b>Exosphère</b>: He, Ar, Ne (traces)',
    'Io': 'SO₂ ténue',
    'Europe': 'O₂ ténue',
    'Ganymède': 'O₂, O₃ ténue',
    'Callisto': 'CO₂ ténue',
    'Titan': 'N₂ 98.4%, CH₄ ~1.6%, traces C₂H₆',
    'Encelade': 'H₂O vapeur, CO₂, NH₃, CH₄ (panaches)',
    'Triton': 'N₂ dominant, CH₄, CO',
    'Phobos': 'Exosphère très ténue',
    'Déimos': 'Exosphère très ténue'
  };

  // === Presets de lunes (fallback local si JPL indisponible) ===
  const MOON_PRESETS = {
    'Terre': [
      { name: 'Lune', a_km: 384400, e: 0.0549, color: '#888' },
    ],
    'Mars': [
      { name: 'Phobos', a_km: 9376, e: 0.0151, color: '#6b7280' },
      { name: 'Déimos', a_km: 23463, e: 0.0002, color: '#9ca3af' },
    ],
    'Jupiter': [
      { name: 'Io', a_km: 421700, e: 0.0041, color: '#d97706' },
      { name: 'Europe', a_km: 671034, e: 0.009, color: '#60a5fa' },
      { name: 'Ganymède', a_km: 1070412, e: 0.0013, color: '#10b981' },
      { name: 'Callisto', a_km: 1882709, e: 0.007, color: '#8b5cf6' },
    ],
    'Saturne': [
      { name: 'Titan', a_km: 1221870, e: 0.0288, color: '#f59e0b' },
      { name: 'Encelade', a_km: 238037, e: 0.0047, color: '#a7f3d0' },
    ],
    'Neptune': [
      { name: 'Triton', a_km: 354759, e: 0.0000, color: '#38bdf8' },
    ]
  };

  // Références DOM
  const elMasses = document.getElementById('masses');
  const elMUnit = document.getElementById('m_unit');
  const planetsList = document.getElementById('planetsList');
  const legendWrap = document.getElementById('planetsLegend');
  const btnAddPlanet = document.getElementById('btnAddPlanet');
  const presetSelect = document.getElementById('presetSelect');
  const btnAddPreset = document.getElementById('btnAddPreset');
  const btnAddAll = document.getElementById('btnAddAll');
  const statsTBody = document.querySelector('#planetStatsTable tbody');
  const onlyVisibleChk = document.getElementById('statsOnlyVisible');
  const instantTBody = document.querySelector('#instantStatsTable tbody');
  const instantOnlyVisibleChk = document.getElementById('instantOnlyVisible');

  const btnPlayPause = document.getElementById('btnPlayPause');
  const speedSliderY = document.getElementById('speedSliderY');
  const speedValY = document.getElementById('speedValY');
  const speedValDays = document.getElementById('speedValDays');
  const btnStep = document.getElementById('btnStep');
  const btnResetTime = document.getElementById('btnResetTime');
  const showTrailChk = document.getElementById('showTrail');
  const showPrecChk = document.getElementById('showPrecession');
  const simTimeLabel = document.getElementById('simTimeLabel');
  const jdLabel = document.getElementById('jdLabel');
  const dateLabel = document.getElementById('dateLabel');

  // Nouveaux contrôles temps (tous optionnels)
  const epochInput = document.getElementById('epochInput');
  const btnEpochNow = document.getElementById('btnEpochNow');
  const timelineSlider = document.getElementById('timelineSlider');
  const timelineYearsLabel = document.getElementById('timelineYearsLabel');
  const scaleModeSelect = document.getElementById('scaleMode');
  // System view controls
  const systemPlanetSelect = document.getElementById('systemPlanetSelect');
  const chkShowSystem = document.getElementById('showSystemView');
  const chkHill = document.getElementById('showHill');
  const chkRoche = document.getElementById('showRoche');
  const chkSync = document.getElementById('showSync');
  // N-body & 3D controls
  const nbodyToggle = document.getElementById('nbodyMode');
  const nbodySoftAU = document.getElementById('nbodySoftAU');
  const enable3DChk = document.getElementById('enable3D');
  const camPitch = document.getElementById('camPitch');
  const camYaw = document.getElementById('camYaw');

  // Events & charts controls
  const evtConj = document.getElementById('evtConj');
  const evtPeri = document.getElementById('evtPeri');
  const evtRes  = document.getElementById('evtRes');
  const evtEcl  = document.getElementById('evtEcl');
  const evtClearBtn = document.getElementById('evtClear');
  const eventsList = document.getElementById('eventsList');

  const tsBodySel = document.getElementById('tsBody');
  const tsChk_r = document.getElementById('ts_r');
  const tsChk_v = document.getElementById('ts_v');
  const tsChk_nu = document.getElementById('ts_nu');
  const tsChk_dr = document.getElementById('ts_dr');
  const tsClearBtn = document.getElementById('tsClear');

  let tsChart = null;
  let tsBuf = []; // {tJD, r, v, nu, drEarth}
  const TS_MAX = 800;
  let tsBodyName = '';




  // --- Modèle ---
  let planets = []; // {id,name,color,visible,a_au,e,period_s,precession_deg_per_orbit,mass_kg, inc_deg, node_deg, moons:[...] }
  let state = [];   // {M,omegaDeg,trail:[],scrX,scrY, moons:[{M,omegaDeg,scrX,scrY}]}
  let pxPerAU = 1;
  let nextId = 1;
  let nextMoonId = 1;

  // JD de référence de la simulation (UTC)
  let EPOCH_JD = null; // alias conservé pour compatibilité
  let RENDER_SCALE_MODE = 'pedago'; // 'pedago' | 'real'

  // Canvas
  const canvas = document.getElementById('orbitCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });

  // --- Export buttons ---
  const btnExportPNG = document.getElementById('btnExportPNG');
  const btnExportJSON = document.getElementById('btnExportJSON');

  function downloadBlob(data, filename, type='application/octet-stream'){
    const blob = new Blob([data], {type});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 0);
  }

  function buildStateSnapshot(){
    return {
      epochJD: EPOCH_JD,
      simYears: ticker.simTime / JULIAN_YEAR,
      scale: RENDER_SCALE_MODE,
      planets: planets.map((p, i)=> ({
        name: p.name, color: p.color, visible: p.visible,
        a_au: p.a_au, e: p.e, period_s: p.period_s, mass_kg: p.mass_kg || (PLANET_MASS_KG[p.name]||null),
        moons: (p.moons||[]).map(m=>({ name: m.name, a_parent_au: m.a_parent_au, e: m.e, period_s: m.period_s }))
      }))
    };
  }

  if (btnExportPNG) btnExportPNG.addEventListener('click', () => {
    try {
      const url = canvas.toDataURL('image/png');
      // Convert data URL to blob to force download filename
      fetch(url).then(r=>r.blob()).then(blob=>{
        downloadBlob(blob, 'orbits.png', 'image/png');
      });
    } catch(e){ console.error('Export PNG failed', e); }
  });
  if (btnExportJSON) btnExportJSON.addEventListener('click', () => {
    try {
      const snapshot = JSON.stringify(buildStateSnapshot(), null, 2);
      downloadBlob(snapshot, 'state.json', 'application/json');
    } catch(e){ console.error('Export JSON failed', e); }
  });

  // ---- Theme helper ----
  function isDarkTheme() {
    return document.documentElement.getAttribute('data-bs-theme') !== 'light';
  }
  // Redraw canvas immediately when theme is toggled
  window.addEventListener('gc-theme-change', function() {
    _starField = null; // force star-field regeneration if switching back to dark
    drawScene(0);
  });

  // ---- Star field (generated once per canvas size) ----
  let _starField = null;
  function buildStarField(w, h) {
    _starField = Array.from({length: 300}, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.4 + Math.random() * 0.8,
      a: 0.2 + Math.random() * 0.75,
    }));
  }
  function drawStarField(w, h) {
    if (!_starField) buildStarField(w, h);
    ctx.save();
    ctx.fillStyle = '#c8d8f0';
    _starField.forEach(s => {
      ctx.globalAlpha = s.a;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, 2 * Math.PI);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  // Append alpha hex to a 6-digit hex color
  function withAlpha(hexColor, alpha) {
    const a = Math.round(alpha * 255).toString(16).padStart(2,'0');
    return (hexColor && hexColor.startsWith('#') && hexColor.length === 7) ? hexColor + a : hexColor;
  }

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1, r = canvas.getBoundingClientRect();
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    _starField = null; // regenerate on resize
  }
  
  // ==== 3D camera & projection helpers ====
  let CAM_PITCH = (document.getElementById('camPitch') ? (parseFloat(document.getElementById('camPitch').value)||25) : 25) * Math.PI/180;
  let CAM_YAW = (document.getElementById('camYaw') ? (parseFloat(document.getElementById('camYaw').value)||0) : 0) * Math.PI/180;
  function setCameraFromUI(){
    const cp = document.getElementById('camPitch'); const cy = document.getElementById('camYaw');
    if (cp) CAM_PITCH = (parseFloat(cp.value)||25) * Math.PI/180;
    if (cy) CAM_YAW = (parseFloat(cy.value)||0) * Math.PI/180;
  }
  function rotateRz(x,y,z, ang){ const c=Math.cos(ang), s=Math.sin(ang); return [c*x - s*y, s*x + c*y, z]; }
  function rotateRx(x,y,z, ang){ const c=Math.cos(ang), s=Math.sin(ang); return [x, c*y - s*z, s*y + c*z]; }
  function projectToScreen(x_au, y_au, z_au, cx, cy){
    let [x1,y1,z1] = rotateRz(x_au, y_au, z_au, CAM_YAW);
    let [x2,y2,z2] = rotateRx(x1, y1, z1, CAM_PITCH);
    const d_cam_au = 5 * (window.sceneMaxAphAU || 1);
    const scale = 1 / Math.max(0.2, (1 + z2 / d_cam_au));
    const sx = cx + x2 * pxPerAU * scale;
    const sy = cy + y2 * pxPerAU * scale;
    return [sx, sy, scale];
  }

  // === Events & charts helpers ===
  function wrapPi(x){ x = (x + Math.PI) % (2*Math.PI); if (x < 0) x += 2*Math.PI; return x - Math.PI; }
  function deg(x){ return x * 180/Math.PI; }

  function earthIndex(){
    let idx = planets.findIndex(p => /^(Terre|Earth)$/i.test(p.name));
    if (idx < 0) idx = planets.findIndex(p => /terre/i.test(p.name));
    return idx;
  }

  function getPosAU(i){
    // Returns [x,y,z] in AU for planet i in current mode
    const st = state[i], p = planets[i];
    if (!p) return [0,0,0];
    const nbodyOn = (document.getElementById('nbodyMode') ? document.getElementById('nbodyMode').checked : false);
    if (nbodyOn && window.nbodyState && nbodyState.positionsAU && nbodyState.positionsAU[i]){
      const v = nbodyState.positionsAU[i]; return [v[0], v[1], v[2]||0];
    }
    // Kepler 3D
    const omega = (st.omegaDeg || 0) * Math.PI/180;
    const E = solveE(st.M||0, p.e||0);
    const denom = (1 - (p.e||0) * Math.cos(E)) || 1;
    const r_au = p.a_au * (1 - (p.e||0) * Math.cos(E));
    const cosNu = (Math.cos(E) - (p.e||0)) / denom;
    const sinNu = (Math.sqrt(Math.max(0, 1-(p.e||0)*(p.e||0))) * Math.sin(E)) / denom;
    const nu = Math.atan2(sinNu, cosNu);
    const x = r_au * Math.cos(omega + nu);
    const y = r_au * Math.sin(omega + nu);
    // apply inclination i and node Ω: Rz(Ω)·Rx(i) assuming ω already applied
    const inc = (p.inc_deg||0) * Math.PI/180, node = (p.node_deg||0) * Math.PI/180;
    let [x1,y1,z1] = rotateRx(x, y, 0, inc);
    let [x2,y2,z2] = rotateRz(x1, y1, z1, node);
    return [x2,y2,z2];
  }

  function getSpeedMS(i){
    // Kepler vis-viva (approx); in N-body we'll FD approximate using lastPos
    const p = planets[i];
    const st = state[i];
    const Mstar = getStarMassKg();
    const mu = window.PHYS.G * Mstar;
    const E = solveE(st.M||0, p.e||0);
    const r = p.a_au * (1 - (p.e||0) * Math.cos(E)) * window.PHYS.AU;
    const a = p.a_au * window.PHYS.AU;
    const v = Math.sqrt(Math.max(0, mu*(2/r - 1/a)));
    return v; // m/s
  }

  function jdNow(simSec){ return (typeof baseEpochJD==='number') ? baseEpochJD + simSec / DAY_S : null; }

  function pushEvent(jd, type, text){
    if (!eventsList) return;
    const item = document.createElement('div');
    const d = dateFromJD(jd);
    const pad = (n) => String(n).padStart(2,'0');
    const ts = `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
    item.innerHTML = `<span class="badge text-bg-secondary me-2">${type}</span> ${escHtml(text)} <span class="text-muted">— ${ts}</span>`;
    eventsList.prepend(item);
    // keep short
    while (eventsList.childElementCount > 100) eventsList.removeChild(eventsList.lastChild);
  }

	// Remplit le menu "Corps" et conserve la sélection quand c’est possible
	function refreshTsBodyOptions() {
	  const sel = document.getElementById('tsBody');
	  if (!sel) return;

	  const cur = sel.value;
	  sel.innerHTML = '<option value="">— Sélectionner —</option>' +
		planets.map(p =>
		  `<option value="${escHtml(p.name)}">${escHtml(p.name)}</option>`
		).join('');

	  // Restaure la sélection si encore présente
	  if (cur && planets.some(p => p.name === cur)) {
		sel.value = cur;
	  }

	  // Auto-sélection si rien de choisi : Terre si dispo, sinon 1er visible
	  if (!sel.value && planets.length) {
		const eIdx = planets.findIndex(p => /^(Terre|Earth)$/i.test(p.name));
		sel.value = (eIdx >= 0 ? planets[eIdx].name : planets[0].name);
	  }

	  // Mets à jour la variable utilisée par les courbes
	  if (typeof tsBodyName !== 'undefined') {
		tsBodyName = sel.value || '';
	  }
	}

  window.addEventListener('planet:added', refreshTsBodyOptions);
  refreshTsBodyOptions();

  function ensureTsChart(){
    if (!document.getElementById('timeseriesChart')) return;
    if (tsChart) return;
    const ctx2 = document.getElementById('timeseriesChart').getContext('2d');
    tsChart = new Chart(ctx2, {
      type: 'line',
      data: { labels: [], datasets: [
        { label:'r (UA)', data: [], yAxisID:'y1', tension:0.2, pointRadius:0 },
        { label:'v (km/s)', data: [], yAxisID:'y2', tension:0.2, pointRadius:0 },
        { label:'ν (°)', data: [], yAxisID:'y3', tension:0.2, pointRadius:0 },
        { label:'Δr Terre (UA)', data: [], yAxisID:'y1', tension:0.2, pointRadius:0, borderDash:[4,3] },
      ]},
      options: {
        animation: false,
        responsive: true,
        scales: {
          x: { ticks: { maxRotation:0 }},
          y1:{ position:'left', title:{ display:true, text:'UA' } },
          y2:{ position:'right', grid:{ drawOnChartArea:false }, title:{ display:true, text:'km/s' } },
          y3:{ position:'right', grid:{ drawOnChartArea:false }, title:{ display:true, text:'°' } },
        },
        plugins: { legend: { position:'bottom' } }
      }
    });
  }

  function updateTsChart(){
    if (!tsChart || !tsBodyName) return;
    const labels = tsBuf.map(x=>{
      const d = dateFromJD(x.tJD);
      return `${d.getUTCMonth()+1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`;
    });
    tsChart.data.labels = labels;
    // mask datasets by toggles
    const rData = tsBuf.map(x=>x.r);
    const vData = tsBuf.map(x=>x.v/1000); // km/s
    const nuData = tsBuf.map(x=>x.nu_deg);
    const drData = tsBuf.map(x=>x.drEarth);
    tsChart.data.datasets[0].data = tsChk_r && tsChk_r.checked ? rData : [];
    tsChart.data.datasets[1].data = tsChk_v && tsChk_v.checked ? vData : [];
    tsChart.data.datasets[2].data = tsChk_nu && tsChk_nu.checked ? nuData : [];
    tsChart.data.datasets[3].data = tsChk_dr && tsChk_dr.checked ? drData : [];
    tsChart.update();
  }

  function recomputeScale() {
    const r = canvas.getBoundingClientRect();
    const visibles = planets.filter(p => p.visible);
    const maxAph = visibles.length ? Math.max(...visibles.map(p => p.a_au * (1 + p.e))) : 1;
    window.sceneMaxAphAU = maxAph;
    const margin = 0.1;
    const halfMin = Math.min(r.width, r.height) / 2;
    pxPerAU = (halfMin * (1 - margin)) / (maxAph || 1);
  }
  resizeCanvas();
  window.addEventListener('resize', () => { resizeCanvas(); recomputeScale(); });

  // Tooltip flottant pour le canvas (nom des objets)
  const canvasWrap = canvas.parentElement;
  const canvasTip = document.createElement('div');
  canvasTip.className = 'canvas-tooltip';
  canvasTip.style.display = 'none';
  canvasWrap.appendChild(canvasTip);

  // Ticker
  const ticker = new Ticker();

  // === JD helpers (UTC) ===
  function jdFromUTCDate(d) { return d.getTime() / 86400000 + 2440587.5; }
  function dateFromJD(jd) { return new Date((jd - 2440587.5) * 86400000); }
  const fmtDateUTCForInput = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  };
  const parseInputToUTCDate = (value) => new Date(value + 'Z');

  // Époque de base : __timeRef.epochJD > __astro.epochJD > maintenant
  let baseEpochJD =
    (window.__timeRef && typeof window.__timeRef.epochJD === 'number') ? window.__timeRef.epochJD :
    (window.__astro && typeof window.__astro.epochJD === 'number')     ? window.__astro.epochJD     :
    jdFromUTCDate(new Date());
  EPOCH_JD = baseEpochJD; // garde l’alias en phase

  function updateCalendarLabels(simSec) {
    const currentJD = baseEpochJD + (simSec / DAY_S);
    if (jdLabel) jdLabel.textContent = currentJD.toFixed(6);
    if (dateLabel) {
      const d = dateFromJD(currentJD);
      const pad = n => String(n).padStart(2, '0');
      dateLabel.textContent =
        `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ` +
        `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
    }
  }

  function updateSimTimeLabel(simSec) {
    if (!simTimeLabel) return;
    let txt = `t = ${(simSec / JULIAN_YEAR).toFixed(3)} an (${(simSec / DAY_S).toFixed(1)} j)`;
    if (typeof baseEpochJD === 'number') {
      const jd = baseEpochJD + simSec / DAY_S;
      txt += ` — JD ${jd.toFixed(5)}`;
    }
    simTimeLabel.textContent = txt;
  }

  // Met à jour le bouton (démarre en pause par défaut)
  if (btnPlayPause) btnPlayPause.textContent = '▶️ Lecture';

  // Slider log mapping: 1/365 y/s to 100000 y/s
  const LOG_MIN = Math.log10(1 / 365.25);
  const LOG_MAX = Math.log10(100000);
  const sliderToYears = t => Math.pow(10, LOG_MIN + (t / 100) * (LOG_MAX - LOG_MIN));
  const yearsToSlider = y => 100 * (Math.log10(y) - LOG_MIN) / (LOG_MAX - LOG_MIN);
  function updateSpeedFromSlider() {
    const yearsPerSec = sliderToYears(Number(speedSliderY.value));
    if (speedValY)     speedValY.textContent   = yearsPerSec >= 1 ? yearsPerSec.toFixed(2) : yearsPerSec.toFixed(4);
    if (speedValDays)  speedValDays.textContent = (yearsPerSec * 365.25).toFixed(2);
    ticker.setSpeed(yearsPerSec * JULIAN_YEAR);
  }
  if (speedSliderY) {
    speedSliderY.value = String(Math.round(yearsToSlider(1)));
    updateSpeedFromSlider();
    speedSliderY.addEventListener('input', updateSpeedFromSlider);
  }
  if (btnPlayPause) { btnPlayPause.addEventListener('click', () => { ticker.toggle(); btnPlayPause.textContent = ticker.running ? '⏸ Pause' : '▶️ Lecture'; }); }
  if (btnStep)      { btnStep.addEventListener('click', () => { if (ticker.running) { ticker.pause(); btnPlayPause.textContent = '▶️ Lecture'; } ticker.step(); updateSimTimeLabel(ticker.simTime); updateCalendarLabels(ticker.simTime); }); }
  if (btnResetTime) { btnResetTime.addEventListener('click', () => {
      ticker.reset();
      killNBody();
      resetEvtState();
      state.forEach(s => { s.trail.length = 0; (s.moons||[]).forEach(m=>m.trail&&(m.trail.length=0)); });
      updateSimTimeLabel(0); updateCalendarLabels(0); drawScene(0);
      if (timelineSlider) { timelineSlider.value = '0'; if (timelineYearsLabel) timelineYearsLabel.textContent = '0.00'; }
    });
  }

  // Phys helpers (depuis physics.js)
  const { G, C } = window.__phys || window.PHYS;
  const { parseMasses, massesToKg, aToMeters, solveE, escHtml, fmt, degNorm, toFloat, clamp: clampFn } = window.__phys;

  function getCentralMu() {
    const arr = massesToKg(parseMasses(elMasses?.value || '1'), elMUnit?.value || 'msun');
    const Mtot = arr.reduce((s, v) => s + v, 0); if (!(Mtot > 0)) return 0;
    return G * Mtot;
  }
  function getStarMassKg() {
    const mu = getCentralMu(); if (!(mu > 0)) return 0;
    return mu / G;
  }

  // BUG 3: convert N-body (r_AU, v_m/s) → osculating Keplerian elements
  function stateToOsculating(r_au_vec, v_mps_vec, mu_m3s2) {
    const rx = r_au_vec[0] * AU, ry = r_au_vec[1] * AU, rz = (r_au_vec[2] || 0) * AU;
    const vx = v_mps_vec[0], vy = v_mps_vec[1], vz = (v_mps_vec[2] || 0);
    const r = Math.sqrt(rx * rx + ry * ry + rz * rz);
    if (!(r > 0) || !(mu_m3s2 > 0)) return null;
    const v2 = vx * vx + vy * vy + vz * vz;
    const rdv = rx * vx + ry * vy + rz * vz;
    // semi-major axis via vis-viva
    const a_m = 1 / (2 / r - v2 / mu_m3s2);
    // specific angular momentum h = r × v
    const hx = ry * vz - rz * vy, hy = rz * vx - rx * vz, hz = rx * vy - ry * vx;
    // eccentricity vector = (v × h)/μ − r̂
    const vhx = vy * hz - vz * hy, vhy = vz * hx - vx * hz, vhz = vx * hy - vy * hx;
    const evx = vhx / mu_m3s2 - rx / r;
    const evy = vhy / mu_m3s2 - ry / r;
    const evz = vhz / mu_m3s2 - rz / r;
    const e = Math.sqrt(evx * evx + evy * evy + evz * evz);
    // true anomaly: cos ν = (ê·r̂); sign from r̂·v > 0 → approaching perihelion
    const cosNu_raw = (e > 1e-10) ? (evx * rx + evy * ry + evz * rz) / (e * r) : 1;
    const nu = Math.acos(Math.max(-1, Math.min(1, cosNu_raw))) * (rdv >= 0 ? 1 : -1);
    // eccentric anomaly
    const cosE_raw = (e > 1e-10 && a_m > 0) ? (1 - r / a_m) / e : 0;
    const E_val = Math.acos(Math.max(-1, Math.min(1, cosE_raw))) * (nu >= 0 ? 1 : -1);
    const M_val = E_val - e * Math.sin(E_val);
    // argument of perihelion (2-D projection onto XY plane)
    const omegaDeg = Math.atan2(evy, evx) * 180 / Math.PI;
    return {
      a_au: a_m / AU, e, nu, E: E_val, M: M_val,
      v: Math.sqrt(v2), r_au: r / AU,
      omegaDeg,
      x_au: rx / AU, y_au: ry / AU, z_au: rz / AU,
    };
  }

  // === UI: ajout planète (avec champ masse + gestion des lunes) ===
  function addPlanetRow(preset) {
    const id = nextId++;
    const color = preset?.color || (window.COLOR_PALETTE ? window.COLOR_PALETTE[(id - 1) % window.COLOR_PALETTE.length] : '#1f77b4');
    const defaultMass = PLANET_MASS_KG[preset?.name || ''] || '';
    const row = document.createElement('div');
    row.className = 'planet-row';
    row.dataset.pid = id;
    row.innerHTML = `
      <div class="row g-2 align-items-end">
        <div class="col-md-2"><label class="form-label">Nom</label>
          <input type="text" class="form-control p-name" value="${preset?.name || ('Planète ' + id)}">
        </div>
        <div class="col-md-3"><label class="form-label">a (demi-grand axe)</label>
          <div class="input-group">
            <input type="text" class="form-control p-a" value="${preset?.a ?? '0.387'}">
            <select class="form-select p-aunit" style="max-width:100px">
              <option value="au"${(preset?.aunit || 'au') === 'au' ? ' selected' : ''}>UA</option>
              <option value="km"${(preset?.aunit || 'au') === 'km' ? ' selected' : ''}>km</option>
              <option value="m"${(preset?.aunit || 'au') === 'm' ? ' selected' : ''}>m</option>
            </select>
          </div>
        </div>
        <div class="col-md-2"><label class="form-label">Excentricité e</label>
          <input type="text" class="form-control p-e" value="${preset?.e ?? '0.2056'}">
        </div>
        <div class="col-md-2"><label class="form-label">Masse planète (kg)</label>
          <input type="text" class="form-control p-mass" value="${defaultMass}">
        </div>
        <div class="col-md-2"><label class="form-label">i (°)</label>
  <input type="number" step="0.01" class="form-control p-inc" value="0">
</div>
<div class="col-md-2"><label class="form-label">Ω (°)</label>
  <input type="number" step="0.01" class="form-control p-node" value="0">
</div>
<div class="col-md-2"><label class="form-label">Couleur</label>
          <input type="color" class="form-control form-control-color p-color" value="${color}">
        </div>
        <div class="col-md-1 text-end">
          <button class="btn btn-outline-danger btn-sm w-100 p-del">Suppr.</button>
        </div>
      </div>

      <div class="mt-2 ms-1">
        <div class="d-flex flex-wrap gap-2 align-items-center">
          <strong>Lunes</strong>
          <select class="form-select form-select-sm p-moon-preset" style="min-width:220px">
            ${buildMoonPresetOptions((preset?.name)||'')}
          </select>
          <button class="btn btn-outline-secondary btn-sm p-add-moon">Ajouter lune</button>
          <button class="btn btn-outline-success btn-sm p-add-moon-custom">+ Lune perso</button>
          <div class="form-text">Les périodes des lunes sont calculées avec la masse de la planète.</div>
        </div>
        <div class="moon-list mt-2"></div>
      </div>
    `;
    planetsList.appendChild(row);
    bindRow(row);
    rebuildModelAndLegend();
    renderPlanetStats();
    renderInstantStats();
    if (window.__applyStatsHeaders) window.__applyStatsHeaders();

    document.dispatchEvent(new CustomEvent('planet:added', { detail: { planet: preset?.name || '' } }));
  }

  // === Lunes: options de <select> — priorité JPL, fallback seeds ===
  function buildMoonPresetOptions(planetName){
    const byPlanet = (window.MOONS_BY_PLANET && window.MOONS_BY_PLANET[planetName]) || null;
    const head = '<option value="">— Charger lune —</option>';

    if (Array.isArray(byPlanet) && byPlanet.length) {
      const opts = byPlanet.map(m => {
        const aTxt = Number.isFinite(m.a_km) ? ` — a≈${m.a_km.toLocaleString('fr-BE')} km` : '';
        const eTxt = (typeof m.e === 'number' && isFinite(m.e)) ? ` — e=${m.e}` : '';
        return `<option value="${m.name}" data-a-km="${m.a_km ?? ''}" data-e="${m.e ?? ''}">${m.name}${aTxt}${eTxt}</option>`;
      }).join('');
      return head + opts;
    }
    const seeds = MOON_PRESETS[planetName] || [];
    const opts = seeds.map((m,idx) => `<option value="${idx}">${m.name}</option>`).join('');
    return head + opts;
  }

  function resolveMoonPresetFromSelect(selectEl, planetName){
    if (!selectEl) return null;
    const val = selectEl.value;
    const opt = selectEl.selectedOptions && selectEl.selectedOptions[0];
    if (opt && val && isNaN(Number(val))) {
      const a_km = opt.dataset.aKm ? Number(opt.dataset.aKm) : undefined;
      const e    = opt.dataset.e   ? Number(opt.dataset.e)   : undefined;
      const color = '#777';
      return { name: val, a_km, e, color };
    }
    const idx = Number(val);
    if (!isNaN(idx)) {
      const arr = MOON_PRESETS[planetName] || [];
      return arr[idx] || null;
    }
    return null;
  }

  function addMoonRow(planetRow, preset, custom=false){
    const moonList = planetRow.querySelector('.moon-list');
    const pid = planetRow.dataset.pid;
    const mid = nextMoonId++;
    const color = preset?.color || '#555555';
    const aVal = preset ? (preset.a_km || 10000) : 10000;
    const eVal = preset ? (preset.e ?? 0) : 0.01;
    const name = preset ? preset.name : ('Lune ' + mid);
    const item = document.createElement('div');
    item.className = 'border rounded p-2 mb-2';
    item.dataset.mid = mid;
    item.innerHTML = `
      <div class="row g-2 align-items-end">
        <div class="col-md-2"><label class="form-label">Nom</label>
          <input type="text" class="form-control m-name" value="${name}">
        </div>
        <div class="col-md-3"><label class="form-label">a (orbite autour planète)</label>
          <div class="input-group">
            <input type="text" class="form-control m-a" value="${aVal}">
            <select class="form-select m-aunit" style="max-width:100px">
              <option value="km" selected>km</option>
              <option value="m">m</option>
              <option value="au">UA</option>
            </select>
          </div>
        </div>
        <div class="col-md-2"><label class="form-label">e</label>
          <input type="text" class="form-control m-e" value="${eVal}">
        </div>
        <div class="col-md-2"><label class="form-label">i (°)</label>
  <input type="number" step="0.01" class="form-control p-inc" value="0">
</div>
<div class="col-md-2"><label class="form-label">Ω (°)</label>
  <input type="number" step="0.01" class="form-control p-node" value="0">
</div>
<div class="col-md-2"><label class="form-label">Couleur</label>
          <input type="color" class="form-control form-control-color m-color" value="${color}">
        </div>
        <div class="col-md-2 form-check mt-4">
          <input class="form-check-input m-vis" type="checkbox" checked id="mvis_${pid}_${mid}">
          <label class="form-check-label" for="mvis_${pid}_${mid}">Visible</label>
        </div>
        <div class="col-md-1 text-end">
          <button class="btn btn-outline-danger btn-sm w-100 m-del">Suppr.</button>
        </div>
      </div>
    `;
    moonList.appendChild(item);

    const inputs = item.querySelectorAll('input,select,button');
    inputs.forEach(el=>{
      const evt = el.classList.contains('m-del') ? 'click' : ((el.tagName==='SELECT'||el.type==='color')?'change':'input');
      el.addEventListener(evt,(e)=>{
        if (el.classList.contains('m-del')) { e.preventDefault(); item.remove(); rebuildModelAndLegend(); renderInstantStats(); return; }
        rebuildModelAndLegend(); renderInstantStats();
      });
    });
    rebuildModelAndLegend(); renderInstantStats();
  }

  function bindRow(row) {
    const inputs = row.querySelectorAll('input,select,button');
    inputs.forEach(el => {
      const evt = el.classList.contains('p-del') ? 'click' : ((el.tagName === 'SELECT' || el.type === 'color') ? 'change' : 'input');
      el.addEventListener(evt, (e) => {
        if (el.classList.contains('p-del')) {
          e.preventDefault();
          row.remove();
          rebuildModelAndLegend();
          renderPlanetStats();
          renderInstantStats();
          return;
        }
        if (el.classList.contains('p-name')) {
          const sel = row.querySelector('.p-moon-preset');
          const pname = row.querySelector('.p-name')?.value?.trim() || '';
          if (sel) sel.innerHTML = buildMoonPresetOptions(pname);
        }
        rebuildModelAndLegend();
        renderPlanetStats();
        renderInstantStats();
      });
    });

    const sel = row.querySelector('.p-moon-preset');
    const btnAddMoon = row.querySelector('.p-add-moon');
    const btnAddMoonCustom = row.querySelector('.p-add-moon-custom');

    btnAddMoon.addEventListener('click', (e)=>{
      e.preventDefault();
      const pname = row.querySelector('.p-name').value.trim();

      if (sel && (!sel.options || sel.options.length <= 1)) {
        sel.innerHTML = buildMoonPresetOptions(pname);
      }
      if (sel && (!sel.value || sel.value === '') && sel.options && sel.options.length > 1) {
        sel.selectedIndex = 1;
      }

      const preset = resolveMoonPresetFromSelect(sel, pname);
      if (preset) {
        addMoonRow(row, preset);
      }
    });
    btnAddMoonCustom.addEventListener('click',(e)=>{
      e.preventDefault();
      addMoonRow(row, null, true);
    });
  }

  function rebuildLegend() {
    legendWrap.innerHTML = '';
    planets.forEach(p => {
      const item = document.createElement('span');
      item.className = 'legend-item' + (p.visible ? '' : ' off');
      item.dataset.pid = p.id;
      const atmos = ATMOS[p.name] ? `data-bs-toggle="popover" data-bs-content="${ATMOS[p.name].replace(/"/g,'&quot;')}"` : '';
      item.innerHTML = `<span class="legend-dot" style="background:${p.color}"></span>
                        <span class="legend-name" ${atmos} title="${p.name}">${escHtml(p.name)}</span>`;
      item.addEventListener('click', () => {
        p.visible = !p.visible;
        item.classList.toggle('off', !p.visible);
        recomputeScale(); renderPlanetStats(); renderInstantStats(); drawScene(0);
      });
      legendWrap.appendChild(item);

      if (p.moons && p.moons.length){
        p.moons.forEach(m=>{
          const mAtmos = ATMOS[m.name] ? `data-bs-toggle="popover" data-bs-content="${ATMOS[m.name].replace(/"/g,'&quot;')}"` : '';
          const chip = document.createElement('span');
          chip.className = 'legend-moon';
          chip.style.borderColor = p.color;
          chip.innerHTML = `<span class="legend-dot" style="background:${m.color}"></span>
                            <span class="legend-moon-name" ${mAtmos} title="${m.name}">${escHtml(m.name)}</span>`;
          chip.addEventListener('click', ()=>{ m.visible = !m.visible; chip.style.opacity = m.visible? '1':'0.45'; drawScene(0); });
          legendWrap.appendChild(chip);
        });
      }
    });
    if (window.bootstrap) {
      const popEls = [].slice.call(document.querySelectorAll('#planetsLegend [data-bs-toggle="popover"]'));
      popEls.forEach(el => new bootstrap.Popover(el, {html:true, sanitize:false, container:'body', trigger:'hover focus'}));
    }
  }

  function parsePlanetMass(row, name){
    const txt = (row.querySelector('.p-mass')?.value || '').trim().replace(/\s/g,'');
    const num = parseFloat(txt);
    if (Number.isFinite(num) && num>0) return num;
    return PLANET_MASS_KG[name] || 0;
  }

  // ---- Helpers perturbations (statique)
  function intervalsOverlap(a1, a2, b1, b2) { return !(a2 < b1 || b2 < a1); }
  function estimateMinSeparationAU(p, q) {
    const q1 = p.a_au * (1 - p.e), Q1 = p.a_au * (1 + p.e);
    const q2 = q.a_au * (1 - q.e), Q2 = q.a_au * (1 + q.e);
    if (intervalsOverlap(q1, Q1, q2, Q2)) return 0.05;
    const delta = Math.abs(p.a_au - q.a_au) - 0.5 * (p.e * p.a_au + q.e * q.a_au);
    return Math.max(0.05, delta);
  }

  function rebuildModelAndLegend() {
    const mu = getCentralMu();
    planets = []; state = [];
    [...planetsList.querySelectorAll('.planet-row')].forEach((row, idx) => {
      const id = Number(row.dataset.pid);
      const name = row.querySelector('.p-name').value || ('Planète ' + id);
      const aVal = toFloat(row.querySelector('.p-a').value);
      const aUnit = row.querySelector('.p-aunit').value;
      const e = clampFn(toFloat(row.querySelector('.p-e').value), 0, 0.9999);
            const inc_deg = toFloat(row.querySelector('.p-inc')?.value || '0') || 0;
      const node_deg = toFloat(row.querySelector('.p-node')?.value || '0') || 0;
		const color = row.querySelector('.p-color').value || (window.COLOR_PALETTE ? window.COLOR_PALETTE[idx % window.COLOR_PALETTE.length] : '#1f77b4');
      const mass_kg = parsePlanetMass(row, name);

      const a_m = aToMeters(aVal, aUnit);
      const a_au = a_m / AU;
      let period_s = 0, precess_deg_per_orbit = 0;
      if (mu > 0 && a_m > 0) {
        period_s = 2 * Math.PI * Math.sqrt((a_m ** 3) / mu);
        const domega_rad = 6 * Math.PI * (mu / (G)) * (G) / (a_m * (1 - e * e) * C * C);
        precess_deg_per_orbit = domega_rad * 180 / Math.PI;
      }

      const moons = [];
      const moonStates = [];
      const moonRows = row.querySelectorAll('.moon-list > div');
      moonRows.forEach(mrow=>{
        const mname = mrow.querySelector('.m-name').value || ('Lune');
        const maVal = toFloat(mrow.querySelector('.m-a').value);
        const maUnit = mrow.querySelector('.m-aunit').value;
        const me = clampFn(toFloat(mrow.querySelector('.m-e').value), 0, 0.9999);
        const mcolor = mrow.querySelector('.m-color').value || '#777';
        const mvis = mrow.querySelector('.m-vis').checked;
        const a_m_moon = aToMeters(maVal, maUnit); // autour planète
        const mu_parent = (mass_kg>0) ? (G * mass_kg) : 0;
        let mperiod_s = 0;
        if (mu_parent>0 && a_m_moon>0){
          mperiod_s = 2 * Math.PI * Math.sqrt((a_m_moon**3)/mu_parent);
        }
        moons.push({
          id: Number(mrow.dataset.mid) || 0,
          name: mname, color: mcolor, visible: mvis,
          a_parent_m: a_m_moon, a_parent_au: a_m_moon / AU, e: me,
          period_s: mperiod_s
        });
        moonStates.push({M:0, omegaDeg:0, trail:[], scrX:null, scrY:null});
      });

      planets.push({
        id, name, color, visible: true, a_au, e, period_s,
        precession_deg_per_orbit: precess_deg_per_orbit,
        mass_kg, inc_deg, node_deg, moons
      });
      // Step 4: preserve JPL-derived M₀/ω₀ and extrapolate M to current sim time
      const _jpl = (window.PLANET_ELEM || {})[name] || null;
      const _M0  = (_jpl && Number.isFinite(_jpl.M_deg))  ? _jpl.M_deg  * Math.PI / 180 : 0;
      const _w0  = (_jpl && Number.isFinite(_jpl.w_deg))  ? _jpl.w_deg  : 0;
      const _n   = (period_s > 0) ? 2 * Math.PI / period_s : 0;
      const _Mnow = _M0 + _n * (ticker.simTime || 0);
      state.push({ M: _Mnow, omegaDeg: _w0, trail: [], scrX: null, scrY: null, moons: moonStates });
    });
    recomputeScale();
    rebuildLegend();
    killNBody();       // Step 5: worker state is stale after planet-list change
    resetEvtState();   // Step 3: stale distances would corrupt perihelion detection
	  // (nouveau) mettre à jour le sélecteur "Corps" après toute reconstruction
	dispatchEvent(new CustomEvent('planets:updated', { detail: { count: planets.length }}));
	if (typeof refreshTsBodyOptions === 'function') refreshTsBodyOptions();

  }

  // ==== Rendu ====
  function drawScene(dtReal) {
    const r = canvas.getBoundingClientRect();

    const _darkTheme = isDarkTheme();
    if (!showTrailChk.checked) {
      ctx.fillStyle = _darkTheme ? '#050a14' : '#ffffff';
      ctx.fillRect(0, 0, r.width, r.height);
      if (_darkTheme) drawStarField(r.width, r.height);
    } else {
      ctx.fillStyle = _darkTheme ? 'rgba(5,10,20,0.18)' : 'rgba(255,255,255,0.18)';
      ctx.fillRect(0, 0, r.width, r.height);
      if (_darkTheme) drawStarField(r.width, r.height);
    }

    const cx = r.width / 2, cy = r.height / 2;

    const use3D = (document.getElementById('enable3D') ? document.getElementById('enable3D').checked : true);
    const nbodyOn = (document.getElementById('nbodyMode') ? document.getElementById('nbodyMode').checked : false);

    function planetRadiusPx(p) {
      if (RENDER_SCALE_MODE === 'real') return 4;
      const n = (p.moons && p.moons.length) ? p.moons.length : 0;
      const base = 8;
      const extra = n > 0 ? (6 + 0.35 * n) : 0;
      return base + Math.min(10, extra);
    }
    function moonRadiusPx(parentRadius) {
      if (RENDER_SCALE_MODE === 'real') return 2.5;
      return Math.min(6, 4 + parentRadius * 0.15);
    }
    function moonPaddingPx(parentRadius, moonIndex) {
      if (RENDER_SCALE_MODE === 'real') return 4;
      const ring = 2 * (moonIndex || 0);
      return parentRadius + 8 + ring;
    }

    // Etoile — corona gradient + core
    const starR = RENDER_SCALE_MODE === 'real' ? 6 : 10;
    const corona = ctx.createRadialGradient(cx, cy, starR * 0.3, cx, cy, starR * 3.2);
    if (_darkTheme) {
      corona.addColorStop(0,   'rgba(255,230,100,0.65)');
      corona.addColorStop(0.4, 'rgba(255,160,30,0.28)');
      corona.addColorStop(1,   'rgba(255,100,0,0)');
    } else {
      corona.addColorStop(0,   'rgba(255,200,0,0.45)');
      corona.addColorStop(0.5, 'rgba(255,150,0,0.14)');
      corona.addColorStop(1,   'rgba(255,100,0,0)');
    }
    ctx.fillStyle = corona;
    ctx.beginPath();
    ctx.arc(cx, cy, starR * 3.2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = _darkTheme ? '#fff9e6' : '#f59e0b';
    ctx.beginPath();
    ctx.arc(cx, cy, starR, 0, 2 * Math.PI);
    ctx.fill();

    planets.forEach((p, i) => {
      if (!p.visible || !(p.period_s > 0)) return;
      const st = state[i];
      const omega = (st.omegaDeg || 0) * Math.PI / 180;

      const eP = Number.isFinite(p.e) ? p.e : 0;
      const sqrt1me2 = Math.sqrt(Math.max(0, 1 - eP * eP));
      // If N-body is on, draw current position from worker and skip Kepler path
      if (nbodyOn && nbodyState.positionsAU && nbodyState.positionsAU[i]){
        const pos = nbodyState.positionsAU[i];
        let px, py, scale3d;
        if (use3D) { [px, py, scale3d] = projectToScreen(pos[0], pos[1], pos[2], cx, cy); }
        else { px = cx + pos[0]*pxPerAU; py = cy + pos[1]*pxPerAU; scale3d = 1; }
        const pr = planetRadiusPx(p);
        ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(px, py, pr*(scale3d||1), 0, 2*Math.PI); ctx.fill();
        if (showTrailChk.checked){ st.trail.push([px, py]); if (st.trail.length > 800) st.trail.shift();
          ctx.strokeStyle = p.color; ctx.globalAlpha = 0.6;
          ctx.shadowColor = p.color; ctx.shadowBlur = _darkTheme ? 4 : 0;
          ctx.beginPath();
          for (let t = 0; t < st.trail.length; t++){ const [tx, ty] = st.trail[t]; if (t===0) ctx.moveTo(tx,ty); else ctx.lineTo(tx,ty); }
          ctx.stroke(); ctx.globalAlpha = 1; ctx.shadowBlur = 0; } else { st.trail.length = 0; }
        return;
      }


      if (!nbodyOn) { ctx.strokeStyle = withAlpha(p.color, 0.3);
      ctx.lineWidth = 1;
      ctx.beginPath();
      const steps = 240;
      for (let k = 0; k <= steps; k++) {
        const Ek = 2 * Math.PI * k / steps;
        const denom = (1 - eP * Math.cos(Ek)) || 1;
        const rk = p.a_au * (1 - eP * Math.cos(Ek));
        const cosNuk = (Math.cos(Ek) - eP) / denom;
        const sinNuk = (sqrt1me2 * Math.sin(Ek)) / denom;
        const nuk = Math.atan2(sinNuk, cosNuk);
        let theta_k = omega + nuk;
        let xr = rk*Math.cos(theta_k), yr = rk*Math.sin(theta_k), zr = 0;
        const inc = (p.inc_deg||0) * Math.PI/180, node = (p.node_deg||0) * Math.PI/180;
        let [xI1,yI1,zI1] = rotateRx(xr, yr, zr, inc);
        let [xI2,yI2,zI2] = rotateRz(xI1, yI1, zI1, node);
        let sx, sy, sc;
        if (use3D) { [sx,sy,sc] = projectToScreen(xI2,yI2,zI2,cx,cy); } else { sx = cx + xI2*pxPerAU; sy = cy + yI2*pxPerAU; }
        if (k === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      }
      ctx.stroke(); }

      const E = solveE(st.M || 0, eP);
      const denomE = (1 - eP * Math.cos(E)) || 1;
      const r_au = p.a_au * (1 - eP * Math.cos(E));
      const cosNu = (Math.cos(E) - eP) / denomE;
      const sinNu = (sqrt1me2 * Math.sin(E)) / denomE;
      const nu = Math.atan2(sinNu, cosNu);
      const theta = omega + nu;

            let xk = r_au * Math.cos(theta), yk = r_au * Math.sin(theta), zk = 0;
      const incP = (p.inc_deg||0) * Math.PI/180, nodeP = (p.node_deg||0) * Math.PI/180;
      let [xI1p,yI1p,zI1p] = rotateRx(xk, yk, zk, incP);
      let [xI2p,yI2p,zI2p] = rotateRz(xI1p, yI1p, zI1p, nodeP);
      let px, py, scale3d;
      if (use3D) { [px, py, scale3d] = projectToScreen(xI2p, yI2p, zI2p, cx, cy); }
      else { px = cx + xI2p * pxPerAU; py = cy + yI2p * pxPerAU; scale3d = 1; }

      const peri = p.a_au * (1 - eP);
            let xperi = peri * Math.cos(omega), yperi = peri * Math.sin(omega), zperi = 0;
      let [xI1q,yI1q,zI1q] = rotateRx(xperi, yperi, zperi, (p.inc_deg||0)*Math.PI/180);
      let [xI2q,yI2q,zI2q] = rotateRz(xI1q, yI1q, zI1q, (p.node_deg||0)*Math.PI/180);
      let ppx, ppy, _sc;
      if (use3D) { [ppx, ppy, _sc] = projectToScreen(xI2q, yI2q, zI2q, cx, cy); } else { ppx = cx + xI2q*pxPerAU; ppy = cy + yI2q*pxPerAU; }
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = _darkTheme ? 6 : 2;
      ctx.beginPath();
      ctx.arc(ppx, ppy, RENDER_SCALE_MODE === 'real' ? 2 : 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;

      const pr = planetRadiusPx(p);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(px, py, pr*(scale3d||1), 0, 2 * Math.PI);
      ctx.fill();

      if (showTrailChk.checked) {
        st.trail.push([px, py]);
        if (st.trail.length > 800) st.trail.shift();
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = 0.6;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = _darkTheme ? 4 : 0;
        ctx.beginPath();
        for (let t = 0; t < st.trail.length; t++) {
          const [tx, ty] = st.trail[t];
          if (t === 0) ctx.moveTo(tx, ty); else ctx.lineTo(tx, ty);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      } else {
        st.trail.length = 0;
      }

      st.scrX = px; st.scrY = py;

      if (p.moons && p.moons.length) {
        p.moons.forEach((m, mi) => {
          if (!m.visible || !(m.period_s > 0)) return;
          const mst = st.moons[mi] || (st.moons[mi] = { M: 0 });

          const eM = Number.isFinite(m.e) ? m.e : 0;
          const m_sqrt = Math.sqrt(Math.max(0, 1 - eM * eM));
          const mPad = moonPaddingPx(pr, mi);
          const mrPix = moonRadiusPx(pr);

          ctx.strokeStyle = withAlpha(m.color, 0.28);
          ctx.lineWidth = 1;
          ctx.beginPath();
          const msteps = 120;
          for (let k = 0; k <= msteps; k++) {
            const Ek = 2 * Math.PI * k / msteps;
            const denomM = (1 - eM * Math.cos(Ek)) || 1;
            const rk_au = m.a_parent_au * (1 - eM * Math.cos(Ek));
            const cosNuk = (Math.cos(Ek) - eM) / denomM;
            const sinNuk = (m_sqrt * Math.sin(Ek)) / denomM;
            const nuk = Math.atan2(sinNuk, cosNuk);
            const ux = Math.cos(nuk), uy = Math.sin(nuk);
            const ex = px + (rk_au * ux) * pxPerAU + ux * mPad;
            const ey = py + (rk_au * uy) * pxPerAU + uy * mPad;
            if (k === 0) ctx.moveTo(ex, ey); else ctx.lineTo(ex, ey);
          }
          ctx.stroke();

          const Eml = solveE(mst.M || 0, eM);
          const denomMl = (1 - eM * Math.cos(Eml)) || 1;
          const rml_au = m.a_parent_au * (1 - eM * Math.cos(Eml));
          const cosNum = (Math.cos(Eml) - eM) / denomMl;
          const sinNum = (m_sqrt * Math.sin(Eml)) / denomMl;
          const num = Math.atan2(sinNum, cosNum);
          const ux2 = Math.cos(num), uy2 = Math.sin(num);

          const mx = px + (rml_au * ux2) * pxPerAU + ux2 * mPad;
          const my = py + (rml_au * uy2) * pxPerAU + uy2 * mPad;

          ctx.fillStyle = m.color;
          ctx.beginPath();
          ctx.arc(mx, my, mrPix, 0, 2 * Math.PI);
          ctx.fill();

          if (showTrailChk.checked) {
            mst.trail = mst.trail || [];
            mst.trail.push([mx, my]);
            if (mst.trail.length > 400) mst.trail.shift();
            ctx.strokeStyle = m.color;
            ctx.globalAlpha = 0.45;
            ctx.shadowColor = m.color;
            ctx.shadowBlur = _darkTheme ? 3 : 0;
            ctx.beginPath();
            for (let t = 0; t < mst.trail.length; t++) {
              const [tx, ty] = mst.trail[t];
              if (t === 0) ctx.moveTo(tx, ty); else ctx.lineTo(tx, ty);
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
          } else if (mst.trail) {
            mst.trail.length = 0;
          }

          mst.scrX = mx; mst.scrY = my;
        });
      }
    });
  }
  
  function detectEvents(simSec){
    // Step 1: throttle on simulation time (6 h sim), not wall-clock time
    if (simSec - evtState.lastCheckSimSec < 6 * 3600) return;
    evtState.lastCheckSimSec = simSec;

    const eIdx = earthIndex();

    // 1) Perihelion/Aphélion (per-planet) — Step 2: interpolated crossing time
    if (evtPeri && evtPeri.checked){
      planets.forEach((p, i) => {
        if (!p.visible || !(p.period_s>0)) return;
        const pos = getPosAU(i);
        const r = Math.hypot(pos[0], pos[1], pos[2]);
        const rPrev = evtState.rPrev.get(i);
        if (rPrev != null){
          const drNow  = r - rPrev;
          const drPrev = evtState.drPrev.get(i) ?? drNow;
          const signPrev = Math.sign(drPrev);
          const signNow  = Math.sign(drNow);
          if (signPrev && signNow && signPrev !== signNow){
            // interpolate to the exact zero-crossing
            const sPrev = evtState.simSecPrev.get(i) ?? simSec;
            const absDrP = Math.abs(drPrev), absDrN = Math.abs(drNow);
            const frac   = absDrP / (absDrP + absDrN);
            const jdX    = jdNow(sPrev + frac * (simSec - sPrev));
            if (signPrev < 0) pushEvent(jdX, 'Périhélie', `${p.name}`);
            else              pushEvent(jdX, 'Aphélie',   `${p.name}`);
          }
          evtState.drPrev.set(i, drNow);
        } else {
          evtState.drPrev.set(i, 0);
        }
        evtState.rPrev.set(i, r);
        evtState.simSecPrev.set(i, simSec);
      });
    }

    // 2) Conjonctions/Oppositions (vs Soleil depuis la Terre)
    if (evtConj && evtConj.checked && eIdx >= 0){
      const rE = getPosAU(eIdx);
      const lonSun = Math.atan2(-rE[1], -rE[0]); // géocentrique
      planets.forEach((p, i) => {
        if (i===eIdx || !p.visible || !(p.period_s>0)) return;
        const rP = getPosAU(i);
        const rGeo = [rP[0]-rE[0], rP[1]-rE[1], rP[2]-rE[2]];
        const lonP = Math.atan2(rGeo[1], rGeo[0]);
        const d0 = wrapPi(lonP - lonSun);       // conj target 0
        const d1 = wrapPi(d0 - Math.PI);        // opp target π

        const keyC = `c${i}`, keyO = `o${i}`;
        const prevC = evtState.conjPrev.get(keyC);
        const prevO = evtState.oppPrev.get(keyO);
        if (prevC != null && prevC*d0 < 0) pushEvent(jd, 'Conjonction', `${p.name} (vs Soleil, Terre)`);
        if (prevO != null && prevO*d1 < 0) pushEvent(jd, 'Opposition', `${p.name} (vs Soleil, Terre)`);
        evtState.conjPrev.set(keyC, d0);
        evtState.oppPrev.set(keyO, d1);
      });
    }

    // 3) Résonances (analyse lente, pairwise)
    if (evtRes && evtRes.checked){
      if (!evtState._lastResMs || nowMs - evtState._lastResMs > 5000){
        evtState._lastResMs = nowMs;
        for (let i=0;i<planets.length;i++){
          for (let j=i+1;j<planets.length;j++){
            const p1=planets[i], p2=planets[j];
            if (!(p1.period_s>0 && p2.period_s>0)) continue;
            const R = p1.period_s / p2.period_s;
            // try m:n with m,n <= 5
            let best=null, err=1e9, bestm=0,bestn=0;
            for (let m=1;m<=5;m++){
              for (let n=1;n<=5;n++){
                const r = m/n;
                const e = Math.abs(R - r)/r;
                if (e < err){ err=e; bestm=m; bestn=n; }
              }
            }
            if (err < 0.015){
              const key = `${p1.name}-${p2.name}-${bestm}:${bestn}`;
              if (!evtState.resonanceAnnounced.has(key)){
                evtState.resonanceAnnounced.add(key);
                pushEvent(jd, 'Résonance', `${p1.name} : ${bestm}:${bestn} ${p2.name} (±${(err*100).toFixed(1)}%)`);
              }
            }
          }
        }
      }
    }

    // 4) Éclipses (β — très simplifié, Terre/Lune)
    if (evtEcl && evtEcl.checked && eIdx >= 0){
      try {
        const earth = planets[eIdx];
        const rE = getPosAU(eIdx);
        // find a moon named 'Lune'
        let moonInfo=null;
        planets[eIdx].moons && planets[eIdx].moons.forEach((m, mi)=>{
          if (/^(Lune|Moon)$/i.test(m.name) && m.visible) moonInfo = { m, mi };
        });
        if (moonInfo){
          // approximate moon heliocentric pos
          const st = state[eIdx]; const p = earth;
          const m = moonInfo.m; const mst = (st.moons||[])[moonInfo.mi] || {M:0};
          const E = solveE(mst.M||0, m.e||0);
          const denom = (1 - (m.e||0) * Math.cos(E)) || 1;
          const rml_au = m.a_parent_au * (1 - (m.e||0) * Math.cos(E));
          const cosNu = (Math.cos(E) - (m.e||0)) / denom;
          const sinNu = (Math.sqrt(Math.max(0,1-(m.e||0)*(m.e||0))) * Math.sin(E)) / denom;
          const nu = Math.atan2(sinNu, cosNu);
          const ux = Math.cos(nu), uy = Math.sin(nu);
          const rM = [ rE[0] + rml_au*ux, rE[1] + rml_au*uy, rE[2] ]; // coplanaire simplifié
          const lonSun = Math.atan2(-rE[1], -rE[0]);
          const lonMoon = Math.atan2((rM[1]-rE[1]), (rM[0]-rE[0]));
          const d = wrapPi(lonMoon - lonSun);
          const prev = evtState.eclipsePrev;
          if (prev != null && prev*d < 0){
            // crossing 0 means syzygy; decide solar vs lunar based on sign of dot(E->Sun, E->Moon)
            const dot = (-rE[0])*(rM[0]-rE[0]) + (-rE[1])*(rM[1]-rE[1]) + (-rE[2])*(rM[2]-rE[2]);
            if (dot > 0) pushEvent(jd, 'Éclipse solaire (β)', `Terre–Lune`);
            else pushEvent(jd, 'Éclipse lunaire (β)', `Terre–Lune`);
          }
          evtState.eclipsePrev = d;
        }
      } catch(e){ /* noop */ }
    }
  }

  function logTimeSeries(simSec){
    const nowMs = performance.now();
    if (nowMs - (evtState.lastChartRealMs||0) < 180) return; // ~5–6 Hz
    evtState.lastChartRealMs = nowMs;
    if (!tsBodyName) return;
    const i = planets.findIndex(p => p.name === tsBodyName);
    if (i < 0) return;
    ensureTsChart();
    const jd = jdNow(simSec);

    const pos = getPosAU(i);
    const r = Math.hypot(pos[0], pos[1], pos[2]);
    // v: Kepler vis-viva approx (m/s); if N-body on, keep this approx (OK for magnitude)
    const v = getSpeedMS(i);
    // ν: in Kepler it's omega+nu; in N-body, take ecliptic longitude as proxy
    let nu_deg = 0;
    const st = state[i], p = planets[i];
    if (document.getElementById('nbodyMode')?.checked){
      nu_deg = deg(Math.atan2(pos[1], pos[0]));
    } else {
      const E = solveE(st.M||0, p.e||0);
      const denom = (1 - (p.e||0) * Math.cos(E)) || 1;
      const cosNu = (Math.cos(E) - (p.e||0)) / denom;
      const sinNu = (Math.sqrt(Math.max(0,1-(p.e||0)*(p.e||0))) * Math.sin(E)) / denom;
      const nu = Math.atan2(sinNu, cosNu);
      nu_deg = deg(nu);
    }
    // Δr Terre
    const eIdx = earthIndex();
    let drEarth = null;
    if (eIdx >= 0){
      const rE = getPosAU(eIdx);
      const d = Math.hypot(pos[0]-rE[0], pos[1]-rE[1], pos[2]-rE[2]);
      drEarth = d;
    }
    tsBuf.push({ tJD: jd, r, v, nu_deg, drEarth });
    if (tsBuf.length > TS_MAX) tsBuf.shift();
    updateTsChart();
  }

  window.drawScene = drawScene;

  // Hints nom objets (planètes + lunes)
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left);
    const my = (e.clientY - rect.top);
    let best = null, bestD2 = 14 * 14;

    planets.forEach((p, i) => {
      if (!p.visible) return;
      const st = state[i];
      if (st.scrX != null){
        const dx = mx - st.scrX, dy = my - st.scrY;
        const d2 = dx*dx + dy*dy;
        if (d2 < bestD2) { bestD2 = d2; best = { name: p.name, x: st.scrX, y: st.scrY, color: p.color }; }
      }
      if (p.moons && p.moons.length){
        p.moons.forEach((m, mi)=>{
          const mst = st.moons[mi];
          if (!m.visible || !mst || mst.scrX==null) return;
          const dx = mx - mst.scrX, dy = my - mst.scrY;
          const d2 = dx*dx + dy*dy;
          if (d2 < bestD2) { bestD2 = d2; best = { name: `${p.name} · ${m.name}`, x: mst.scrX, y: mst.scrY, color: m.color }; }
        });
      }
    });

    if (best) {
      canvasTip.textContent = best.name;
      canvasTip.style.display = 'block';
      canvasTip.style.left = (best.x + 8) + 'px';
      canvasTip.style.top = (best.y - 12) + 'px';
    } else {
      canvasTip.style.display = 'none';
    }
  });
  canvas.addEventListener('mouseleave', ()=>{ canvasTip.style.display='none'; });

  // --- Risque (heuristique) + PERTURBATIONS ---
  const SIGMA_STAR = 0.05; // UA
  const SIGMA_PAIR = 0.05; // UA
  const PERTURB_SCALE_STATIC  = 5.0;
  const PERTURB_SCALE_INSTANT = 3.0;

  function orbitOverlap(p1, p2){
    const q1 = p1.a_au*(1-p1.e), Q1 = p1.a_au*(1+p1.e);
    const q2 = p2.a_au*(1-p2.e), Q2 = p2.a_au*(1+p2.e);
    return !(Q1 < q2 || Q2 < q1);
  }

  function renderPlanetStats() {
    const mu = getCentralMu();
    const Mstar = getStarMassKg();
    const earth = planets.find(p => p.name.trim().toLowerCase() === 'terre');
    const T_earth_s = (earth && earth.period_s > 0) ? earth.period_s : JULIAN_YEAR;

    const onlyVis = onlyVisibleChk && onlyVisibleChk.checked;
    const list = onlyVis ? planets.filter(p => p.visible) : planets;

    const rowsHtml = list.map(p => {
      const a_au = p.a_au, a_m = a_au * AU, e = p.e, T_s = p.period_s;
      const T_y = T_s ? (T_s / JULIAN_YEAR) : NaN;
      const T_by_Earth = T_s ? (T_s / T_earth_s) : NaN;
      const q_m = a_m * (1 - e), Q_m = a_m * (1 + e);
      const q_au = q_m / AU, Q_au = Q_m / AU;

      let vq_kms = '—', vQ_kms = '—', n_deg_day = '—';
      if (mu > 0 && a_m > 0 && T_s > 0) {
        const vq = Math.sqrt(mu * (2 / q_m - 1 / a_m));
        const vQ = Math.sqrt(mu * (2 / Q_m - 1 / a_m));
        vq_kms = (vq / 1000).toFixed(3);
        vQ_kms = (vQ / 1000).toFixed(3);
        const n = 2 * Math.PI / T_s;
        n_deg_day = (n * 180 / Math.PI * DAY_S).toFixed(5);
      }

      // Perturbations statiques
      let aPertSum = 0, domName = '', domRat = 0;
      const aStar = (Mstar>0 && a_m>0) ? (G * Mstar / (a_m*a_m)) : 0;
      planets.forEach(q => {
        if (q === p || !(q.mass_kg>0)) return;
        const d_au = estimateMinSeparationAU(p, q);
        const d_m  = d_au * AU;
        const a_j  = G * q.mass_kg / (d_m * d_m);
        aPertSum  += a_j;
        const rat = (aStar>0) ? (a_j / aStar) : 0;
        if (rat > domRat) { domRat = rat; domName = q.name; }
      });
      const eta_static = (aStar>0) ? (aPertSum / aStar) : 0;

      const overlapAny = planets.some(other => other !== p && orbitOverlap(p, other));
      const riskOverlap = overlapAny ? 0.5 : 0;
      const riskStar = Math.exp(-(q_au) / SIGMA_STAR);
      const riskPert = Math.min(1, PERTURB_SCALE_STATIC * eta_static);
      const riskStatic = 1 - (1 - riskOverlap) * (1 - riskStar) * (1 - riskPert);
      const riskPct = (riskStatic * 100).toFixed(1);

      const pre_deg = p.precession_deg_per_orbit || 0;
      const pre_arc = pre_deg * 3600;
      const orbits_per_century = T_s ? (100 * JULIAN_YEAR) / T_s : 0;
      const pre_arc_cent = pre_arc * orbits_per_century;
      const eyeClass = p.visible ? '' : ' off';
      const etaTxt = eta_static > 0 ? ` η≈${(eta_static*100).toFixed(3)}%` : '';
      const domTxt = domName ? `, dom: ${domName}` : '';
      return `<tr title="Perturbations planétaires${etaTxt}${domTxt}">
        <td><span class="legend-dot" style="background:${p.color}"></span> ${escHtml(p.name)}</td>
        <td><span class="vis-icon${eyeClass}" title="${p.visible ? 'Visible' : 'Masquée'}">👁️</span></td>
        <td>${fmt(a_au, 6)}</td>
        <td>${fmt(e, 6)}</td>
        <td>${fmt(T_y, 6)}</td>
        <td>${fmt(T_by_Earth, 6)}</td>
        <td>${n_deg_day}</td>
        <td>${fmt(q_au, 6)}</td>
        <td>${fmt(Q_au, 6)}</td>
        <td>${fmt(pre_arc, 3)}</td>
        <td>${fmt(pre_arc_cent, 2)}</td>
        <td>${vq_kms}</td>
        <td>${vQ_kms}</td>
        <td>${riskPct}%</td>
      </tr>`;
    }).join('');
    if (statsTBody) statsTBody.innerHTML = rowsHtml;
    if (window.__applyStatsHeaders) window.__applyStatsHeaders();
  }

  function renderInstantStats() {
    const mu = getCentralMu();
    const Mstar = getStarMassKg();
    const onlyVis = instantOnlyVisibleChk && instantOnlyVisibleChk.checked;
    const nbodyOn = !!(document.getElementById('nbodyMode') || {}).checked;

    // BUG 5: use 3D position via getPosAU for Earth reference
    const idxEarth = earthIndex();
    const earthPos3D = (idxEarth >= 0 && planets[idxEarth] && planets[idxEarth].period_s > 0)
      ? getPosAU(idxEarth) : null;

    const rowsHtml = planets.map((p, i) => {
      if (onlyVis && !p.visible) return '';
      const st = state[i] || { M: 0, omegaDeg: 0 };
      const a_au = p.a_au, a_m = a_au * AU, e = p.e;
      if (!(a_m > 0) || !(mu > 0) || !(p.period_s > 0)) {
        const eyeClass = p.visible ? '' : ' off';
        return `<tr>
          <td><span class="legend-dot" style="background:${p.color}"></span> ${escHtml(p.name)}</td>
          <td><span class="vis-icon${eyeClass}">👁️</span></td>
          <td colspan="12" class="text-muted">—</td>
        </tr>`;
      }

      // BUG 3: in N-body mode compute osculating elements from (r, v); in Kepler use state
      let r_au, nu, M_val, E_val, omegaDeg_val, v, x_au, y_au, z_au;
      if (nbodyOn && nbodyState.positionsAU[i]) {
        const pos3 = nbodyState.positionsAU[i];
        const vel3 = nbodyState.velocitiesMps[i] || null;
        r_au = Math.hypot(pos3[0], pos3[1], pos3[2] || 0);
        x_au = pos3[0]; y_au = pos3[1]; z_au = pos3[2] || 0;
        if (vel3) {
          const osc = stateToOsculating(pos3, vel3, mu);
          if (osc) {
            nu = osc.nu; M_val = osc.M; E_val = osc.E;
            omegaDeg_val = osc.omegaDeg; v = osc.v;
          } else {
            nu = 0; M_val = 0; E_val = 0; omegaDeg_val = st.omegaDeg || 0;
            v = Math.sqrt(Math.max(0, mu * (2 / (r_au * AU) - 1 / a_m)));
          }
        } else {
          nu = 0; M_val = 0; E_val = 0; omegaDeg_val = st.omegaDeg || 0;
          v = Math.sqrt(Math.max(0, mu * (2 / (r_au * AU) - 1 / a_m)));
        }
      } else {
        M_val = st.M;
        E_val = solveE(M_val, e);
        r_au = a_au * (1 - e * Math.cos(E_val));
        const cosNu = (Math.cos(E_val) - e) / (1 - e * Math.cos(E_val));
        const sinNu = (Math.sqrt(1 - e * e) * Math.sin(E_val)) / (1 - e * Math.cos(E_val));
        nu = Math.atan2(sinNu, cosNu);
        omegaDeg_val = st.omegaDeg || 0;
        // BUG 5: use 3D getPosAU for coordinates
        const pos3k = getPosAU(i);
        x_au = pos3k[0]; y_au = pos3k[1]; z_au = pos3k[2] || 0;
        v = Math.sqrt(Math.max(0, mu * (2 / (r_au * AU) - 1 / a_m)));
      }

      const r_m = r_au * AU;
      const thetaDeg = degNorm((omegaDeg_val || 0) + (nu || 0) * 180 / Math.PI);
      const h = Math.sqrt(Math.max(0, mu * a_m * (1 - e * e)));
      const dthetadt = (h > 0 && r_m > 0) ? h / (r_m * r_m) : 0;
      const dtheta_deg_day = (dthetadt * 180 / Math.PI * DAY_S).toFixed(5);

      // BUG 5: 3D distance to Earth
      let dEarth = '—';
      if (earthPos3D) {
        const dx = x_au - earthPos3D[0], dy = y_au - earthPos3D[1], dz = (z_au || 0) - (earthPos3D[2] || 0);
        dEarth = Math.sqrt(dx * dx + dy * dy + dz * dz).toFixed(6);
      }

      const rev = (p.period_s > 0) ? (ticker.simTime / p.period_s).toFixed(3) : '—';

      let minPairDist = Infinity;
      let aPertSum = 0;
      const aStar = (Mstar > 0 && r_m > 0) ? (G * Mstar / (r_m * r_m)) : 0;
      planets.forEach((q, j) => {
        if (j === i || !(q.period_s > 0)) return;
        const posQ = getPosAU(j); // 3D
        const dx = x_au - posQ[0], dy = y_au - posQ[1], dz = (z_au || 0) - (posQ[2] || 0);
        const d = Math.hypot(dx, dy, dz);
        if (d < minPairDist) minPairDist = d;
        const d_m = Math.max(0.01, d) * AU;
        if (q.mass_kg > 0) aPertSum += G * q.mass_kg / (d_m * d_m);
      });
      const riskPair = (minPairDist < Infinity) ? Math.exp(-minPairDist / SIGMA_PAIR) : 0;
      const riskStar = Math.exp(-r_au / SIGMA_STAR);
      const eta_now = (aStar > 0) ? (aPertSum / aStar) : 0;
      const riskPert = Math.min(1, PERTURB_SCALE_INSTANT * eta_now);
      const riskNow = 1 - (1 - riskPair) * (1 - riskStar) * (1 - riskPert);
      const riskNowPct = (riskNow * 100).toFixed(1);

      const eyeClass = p.visible ? '' : ' off';
      const etaNowTxt = eta_now > 0 ? ` (η≈${(eta_now * 100).toFixed(3)}%)` : '';
      return `<tr title="Perturbations instantanées${etaNowTxt}">
        <td><span class="legend-dot" style="background:${p.color}"></span> ${escHtml(p.name)}</td>
        <td><span class="vis-icon${eyeClass}" title="${p.visible ? 'Visible' : 'Masquée'}">👁️</span></td>
        <td>${fmt(r_au, 6)}</td>
        <td>${fmt((nu || 0) * 180 / Math.PI, 3)}</td>
        <td>${fmt((M_val || 0) * 180 / Math.PI, 3)}</td>
        <td>${fmt((E_val || 0) * 180 / Math.PI, 3)}</td>
        <td>${fmt(omegaDeg_val || 0, 3)}</td>
        <td>${fmt(thetaDeg, 3)}</td>
        <td>${((v || 0) / 1000).toFixed(3)}</td>
        <td>${dtheta_deg_day}</td>
        <td>${dEarth}</td>
        <td>${rev}</td>
        <td>${riskNowPct}%</td>
        <td>${fmt(x_au, 6)}</td>
        <td>${fmt(y_au, 6)}</td>
      </tr>`;
    }).join('');
    if (instantTBody) instantTBody.innerHTML = rowsHtml;
    if (window.__applyStatsHeaders) window.__applyStatsHeaders();
  }

  // Boucle animation
  let _lastInstantStatsTs = 0;
  ticker.on(({ dtReal, dtSim, simTime }) => { ensureNBodyStarted(); const nbodyOn = (document.getElementById('nbodyMode') ? document.getElementById('nbodyMode').checked : false);
    planets.forEach((p, i) => {
      if (!p.visible || !(p.period_s > 0)) return;
      const st = state[i];
      const n = 2 * Math.PI / p.period_s;
      if (!nbodyOn) st.M = (st.M + n * dtSim) % (2 * Math.PI);
      if (!nbodyOn && showPrecChk.checked && p.precession_deg_per_orbit) {
        st.omegaDeg = (st.omegaDeg + (p.precession_deg_per_orbit / p.period_s) * dtSim) % 360;
      }

      if (p.moons && p.moons.length){
        p.moons.forEach((m, mi)=>{
          if (!(m.period_s>0)) return;
          const mst = state[i].moons[mi];
          const nm = 2 * Math.PI / m.period_s;
          mst.M = (mst.M + nm*dtSim) % (2*Math.PI);
        });
      }
    });
    if (nbodyOn) { stepNBodyTo(simTime); } else { drawScene(dtReal); }
    updateSimTimeLabel(simTime);
    updateCalendarLabels(simTime);
    detectEvents(simTime);
    logTimeSeries(simTime);
    const nowTs = performance.now();
    if (nowTs - _lastInstantStatsTs > 200) { renderInstantStats(); _lastInstantStatsTs = nowTs; }
  });

  // Listeners masses
  [elMasses, elMUnit].forEach(el => el && el.addEventListener('input', () => { rebuildModelAndLegend(); renderPlanetStats(); renderInstantStats(); }));
  [elMasses, elMUnit].forEach(el => el && el.addEventListener('change', () => { rebuildModelAndLegend(); renderPlanetStats(); renderInstantStats(); }));

  // Boutons presets
  function addPresetByName(name) {
    const p = window.PRESETS ? window.PRESETS[name] : null; if (!p) return;
    addPlanetRow({ name, a: p.a, aunit: 'au', e: p.e, color: p.color });
  }
  if (btnAddPreset) { btnAddPreset.addEventListener('click', (e) => { e.preventDefault(); const name = presetSelect.value; if (name) addPresetByName(name); }); }
  if (btnAddAll)    { btnAddAll.addEventListener('click', (e) => { e.preventDefault(); (window.ORDER8 || []).forEach(n => addPresetByName(n)); }); }
  if (btnAddPlanet) { btnAddPlanet.addEventListener('click', (e) => { e.preventDefault(); addPlanetRow(); }); }

  // --- Appliquer les éléments JPL (a, e, M, ω, i, Ω) aux planètes déjà ajoutées ---
  function applyPlanetElementsToState() {
    if (!window.PLANET_ELEM) return;
    planets.forEach((p, i) => {
      const el = window.PLANET_ELEM[p.name];
      if (!el) return;
      if (Number.isFinite(el.a_au)) p.a_au = el.a_au;
      if (Number.isFinite(el.e))    p.e    = el.e;
      if (state[i]) {
        if (Number.isFinite(el.M_deg)) state[i].M        = el.M_deg * Math.PI / 180;
        if (Number.isFinite(el.w_deg)) state[i].omegaDeg = el.w_deg;
      }
      // BUG 1: apply inclination and node — also write to UI fields so rebuildModel keeps them
      const row = document.querySelector(`#planetsList .planet-row[data-pid="${p.id}"]`);
      if (Number.isFinite(el.inc_deg)) {
        p.inc_deg = el.inc_deg;
        if (row) { const f = row.querySelector('.p-inc');  if (f) f.value = el.inc_deg.toFixed(4); }
      }
      if (Number.isFinite(el.node_deg)) {
        p.node_deg = el.node_deg;
        if (row) { const f = row.querySelector('.p-node'); if (f) f.value = el.node_deg.toFixed(4); }
      }
      // Recalcule période avec nouveau a
      const mu = getCentralMu();
      const a_m = p.a_au * AU;
      if (mu > 0 && a_m > 0) p.period_s = 2 * Math.PI * Math.sqrt((a_m ** 3) / mu);
    });
    recomputeScale();
    renderPlanetStats();
    renderInstantStats();
    drawScene(0);
  }

  // === Nouveaux contrôles : époque, timeline, échelle ===
  function setEpochInputFromJD(jd) {
    if (!epochInput) return;
    const d = dateFromJD(jd);
    epochInput.value = fmtDateUTCForInput(d);
  }
  setEpochInputFromJD(baseEpochJD);

  if (epochInput) {
    epochInput.addEventListener('change', () => {
      const v = epochInput.value;
      if (!v) return;
      const d = parseInputToUTCDate(v);
      if (isNaN(d.getTime())) return;
      baseEpochJD = jdFromUTCDate(d);
      EPOCH_JD = baseEpochJD;
      resetEvtState();
      window.dispatchEvent(new CustomEvent('EPOCH_UPDATED', { detail: { epochJD: baseEpochJD } }));
      updateCalendarLabels(ticker.simTime);
      updateSimTimeLabel(ticker.simTime);
    });
  }
  if (btnEpochNow) {
    btnEpochNow.addEventListener('click', (e) => {
      e.preventDefault();
      const now = new Date();
      baseEpochJD = jdFromUTCDate(now);
      EPOCH_JD = baseEpochJD;
      setEpochInputFromJD(baseEpochJD);
      updateCalendarLabels(ticker.simTime);
      updateSimTimeLabel(ticker.simTime);
      window.dispatchEvent(new CustomEvent('EPOCH_UPDATED', { detail: { epochJD: baseEpochJD } }));
    });
  }
  if (timelineSlider) {
    const updateFromTimeline = () => {
      const years = parseFloat(timelineSlider.value || '0') || 0;
      if (timelineYearsLabel) timelineYearsLabel.textContent = years.toFixed(2);
      ticker.simTime = years * JULIAN_YEAR;
      updateSimTimeLabel(ticker.simTime);
      updateCalendarLabels(ticker.simTime);
      renderInstantStats();
      drawScene(0);
    };
    timelineSlider.addEventListener('input', updateFromTimeline);
    updateFromTimeline();
  }
  
  if (systemPlanetSelect) systemPlanetSelect.addEventListener('change', ()=> drawScene(0));
  if (chkShowSystem) chkShowSystem.addEventListener('change', ()=> drawScene(0));
  if (chkHill) chkHill.addEventListener('change', ()=> drawScene(0));
  if (chkRoche) chkRoche.addEventListener('change', ()=> drawScene(0));
  if (chkSync) chkSync.addEventListener('change', ()=> drawScene(0));

  
  if (evtClearBtn && eventsList) evtClearBtn.addEventListener('click', ()=>{ eventsList.innerHTML=''; });
  if (tsBodySel) tsBodySel.addEventListener('change', ()=>{ tsBodyName = tsBodySel.value || ''; tsBuf.length = 0; ensureTsChart(); updateTsChart(); });
  ['ts_r','ts_v','ts_nu','ts_dr'].forEach(id=>{ const el=document.getElementById(id); if (el) el.addEventListener('change', updateTsChart); });
  if (tsClearBtn) tsClearBtn.addEventListener('click', ()=>{ tsBuf.length=0; updateTsChart(); });

  if (scaleModeSelect) {
    scaleModeSelect.addEventListener('change', () => {
      const v = (scaleModeSelect.value || 'pedago').toLowerCase();
      RENDER_SCALE_MODE = (v === 'real') ? 'real' : 'pedago';
      drawScene(0);
    });
  }

  

  // --- Event engine state ---
  const evtState = {
    rPrev: new Map(), drSign: new Map(),
    drPrev: new Map(), simSecPrev: new Map(),   // for perihelion interpolation
    conjPrev: new Map(), oppPrev: new Map(),
    eclipsePrev: null,
    resonanceAnnounced: new Set(),
    lastCheckSimSec: -Infinity,                 // sim-time throttle (replaces real-time)
    lastChartRealMs: 0
  };

  function resetEvtState() {
    evtState.rPrev.clear(); evtState.drSign.clear();
    evtState.drPrev.clear(); evtState.simSecPrev.clear();
    evtState.conjPrev.clear(); evtState.oppPrev.clear();
    evtState.eclipsePrev = null;
    evtState.resonanceAnnounced.clear();
    evtState.lastCheckSimSec = -Infinity;
  }

  // N-body worker
  let nbodyWorker = null;
  let nbodyState = { simSec: 0, positionsAU: [], velocitiesMps: [] };
  function killNBody() { if (nbodyWorker) { nbodyWorker.terminate(); nbodyWorker = null; } }
  function currentElementsForNBody() {
    const bodies = []; const Mstar = getStarMassKg();
    planets.forEach((p, i) => {
      if (!p.visible || !(p.period_s > 0)) return;
      const st = state[i]; const M = (st.M || 0); const omega_deg = (st.omegaDeg || 0);
      bodies.push({ name: p.name, color: p.color, mass_kg: p.mass_kg || (PLANET_MASS_KG[p.name] || 0),
        a_m: p.a_au * AU, e: p.e || 0, inc_deg: p.inc_deg || 0, node_deg: p.node_deg || 0,
        omega_deg, M_rad: M });
    });
    return { Mstar, bodies };
  }
  function ensureNBodyStarted() {
    const tog = document.getElementById('nbodyMode'); if (!tog || !tog.checked) return;
    if (!nbodyWorker) {
      nbodyWorker = new Worker('assets/js/nbody.worker.js');
      nbodyWorker.onmessage = (e) => {
        const msg = e.data || {};
        if (msg.type === 'state') {
          nbodyState = {
            simSec: msg.simSec || 0,
            positionsAU:   msg.positionsAU   || [],
            velocitiesMps: msg.velocitiesMps || [],
          };
          drawScene(0);
        }
      };
      const soft_au = Math.max(0, parseFloat((document.getElementById('nbodySoftAU') || {}).value || '0') || 0);
      const init = currentElementsForNBody();
      const grOn = !!(document.getElementById('showPrecession') || {}).checked;
      nbodyWorker.postMessage({ type: 'init', Mstar: init.Mstar, bodies: init.bodies, soft_au, gr: grOn });
    }
  }
  function stepNBodyTo(simSec) { if (nbodyWorker) nbodyWorker.postMessage({ type: 'advance', targetSimSec: simSec }); }

// Démarrage app: ajoute 2 planètes de base puis applique JPL
  function startApp() {
	  addPlanetRow({ name: 'Mercure', a: 0.387098, aunit: 'au', e: 0.205630, color: '#2ca02c' });
	  addPlanetRow({ name: 'Terre',   a: 1.0000001124, aunit: 'au', e: 0.01671022, color: '#006ebd' });
	  renderPlanetStats();
	  renderInstantStats();
    
	  // Populate system view planet selector
	  function refreshSystemPlanetOptions() {
		if (!systemPlanetSelect) return;
		const sel = systemPlanetSelect;
		const cur = sel.value;
		sel.innerHTML = '<option value="">— Sélectionner —</option>' + planets.map(p => 
		  `<option value="${(window.__phys&&window.__phys.escHtml?window.__phys.escHtml(p.name):p.name)}">${(window.__phys&&window.__phys.escHtml?window.__phys.escHtml(p.name):p.name)}</option>`).join('');
		// Restore selection if possible
		for (let i=0;i<sel.options.length;i++){ if (sel.options[i].value===cur){ sel.selectedIndex=i; break; } }
	  }
	  window.addEventListener('planet:added', refreshSystemPlanetOptions);
	  window.addEventListener('planets:updated', refreshTsBodyOptions);
	  refreshSystemPlanetOptions();

		
	  const _tog = document.getElementById('nbodyMode');
	  if (_tog) _tog.addEventListener('change', () => { killNBody(); resetEvtState(); if (_tog.checked) ensureNBodyStarted(); drawScene(0); });
	  const _soft = document.getElementById('nbodySoftAU');
	  if (_soft) _soft.addEventListener('change', () => { if (nbodyWorker) { nbodyWorker.postMessage({ type: 'setsoft', soft_au: Math.max(0, parseFloat(_soft.value || '0') || 0) }); } });
	  // sync GR toggle to worker when showPrecession changes
	  if (showPrecChk) showPrecChk.addEventListener('change', () => { if (nbodyWorker) nbodyWorker.postMessage({ type: 'setgr', enabled: showPrecChk.checked }); });
	  const _pitch = document.getElementById('camPitch'); if (_pitch) _pitch.addEventListener('input', ()=>{ setCameraFromUI(); drawScene(0); });
	  const _yaw = document.getElementById('camYaw'); if (_yaw) _yaw.addEventListener('input', ()=>{ setCameraFromUI(); drawScene(0); });

	  ticker.start();
	  // (nouveau) remplir "Corps" au démarrage une fois que les planètes par défaut existent
	  if (typeof refreshTsBodyOptions === 'function') {
		// micro-task pour laisser finir les inits
		setTimeout(refreshTsBodyOptions, 0);
	  }
  }

  function refreshMoonPresetOptionsForRow(row) {
    const pname = row.querySelector('.p-name')?.value?.trim() || '';
    const sel = row.querySelector('.p-moon-preset');
    if (!sel) return;
    sel.innerHTML = buildMoonPresetOptions(pname);
  }
  function refreshMoonPresetOptionsForAllRows() {
    document.querySelectorAll('#planetsList .planet-row').forEach(row => refreshMoonPresetOptionsForRow(row));
  }

  // Attendre lunes + éléments planétaires, puis démarrer
  const ready = Promise.all([
    (window.MOONS_READY && typeof window.MOONS_READY.then === 'function') ? window.MOONS_READY : Promise.resolve(),
    (window.PLANET_ELEM_READY && typeof window.PLANET_ELEM_READY.then === 'function') ? window.PLANET_ELEM_READY : Promise.resolve()
  ]);

  ready.finally(() => {
    // Si le back a fixé l’époque, on l’emploie
    if (window.__timeRef && typeof window.__timeRef.epochJD === 'number') {
      baseEpochJD = window.__timeRef.epochJD;
      EPOCH_JD = baseEpochJD;
      setEpochInputFromJD(baseEpochJD);
    }
    startApp();
    refreshMoonPresetOptionsForAllRows();
    applyPlanetElementsToState(); // init M, ω, a, e selon JPL
    updateCalendarLabels(ticker.simTime || 0);
  });

  // Quand l’utilisateur change la date et resynchronise (évènement back)
  document.addEventListener('planets:elements', () => {
    if (window.__timeRef && typeof window.__timeRef.epochJD === 'number') {
      baseEpochJD = window.__timeRef.epochJD;
      EPOCH_JD = baseEpochJD;
      setEpochInputFromJD(baseEpochJD);
    }
    ticker.reset();
    killNBody();
    resetEvtState();
    state.forEach(s => { s.trail.length = 0; (s.moons||[]).forEach(m=>m.trail&&(m.trail.length=0)); });
    applyPlanetElementsToState();
    updateCalendarLabels(0);
    updateSimTimeLabel(0);
  });

  // (option) si un autre module signale une nouvelle époque
  window.addEventListener('JPL_EPOCH_UPDATED', (e) => {
    const jd = e?.detail?.epochJD;
    if (typeof jd === 'number' && isFinite(jd)) {
      baseEpochJD = jd; EPOCH_JD = jd;
      setEpochInputFromJD(baseEpochJD);
      updateCalendarLabels(ticker.simTime);
      updateSimTimeLabel(ticker.simTime);
    }
  });

  // Quand la liste de lunes (JPL) est mise à jour
  document.addEventListener('moons:updated', () => {
    refreshMoonPresetOptionsForAllRows();
  });

  // expose debug
  window.__orbits = { planets, state };
  refreshTsBodyOptions();
})();


  // --- Overlays: Hill sphere, Roche limit, synchronous orbit ---
  function drawSystemOverlays() {
    if (!chkShowSystem || !chkShowSystem.checked) return;
    if (!systemPlanetSelect) return;
    const pname = systemPlanetSelect.value;
    if (!pname) return;
    const idx = planets.findIndex(p => p.name === pname);
    if (idx < 0) return;
    const p = planets[idx], st = state[idx];
    if (!p || !st || st.scrX == null || st.scrY == null) return;

    // Physical params
    const Mstar = (window.PHYS && window.PHYS.M_SUN) ? window.PHYS.M_SUN : 1.98847e30;
    const Mp = (typeof p.mass_kg === 'number' && p.mass_kg>0) ? p.mass_kg : (PLANET_MASS_KG[p.name] || 0);
    const Rp_km = PLANET_RADIUS_KM[p.name] || 0;
    const omega = 2*Math.PI / ((ROTATION_PERIOD_H[p.name]||0) * 3600 || Infinity); // rad/s

    // Hill radius (planet around star), in AU
    const rHill_au = (p.a_au>0 && Mp>0) ? (p.a_au * Math.cbrt(Mp / (3*Mstar))) : 0;
    // Roche (approx): fluid satellite, r ≈ 2.44 Rp
    const rRoche_au = (Rp_km>0) ? (2.44 * (Rp_km*1000) / (window.PHYS.AU || 1.495978707e11)) : 0;
    // Synchronous orbit (geostationary): r = (GM/ω²)^{1/3}
    const rSync_au = (Mp>0 && isFinite(omega) && omega>0) ? (Math.cbrt((window.PHYS.G*Mp)/(omega*omega)) / (window.PHYS.AU)) : 0;

    const cx = st.scrX, cy = st.scrY;
    ctx.save();
    ctx.setLineDash([6,4]);
    ctx.lineWidth = 1;

    function circleAU(r_au, color) {
      if (!(r_au>0)) return;
      const rPx = r_au * pxPerAU;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, rPx, 0, 2*Math.PI);
      ctx.stroke();
    }
    if (chkHill && chkHill.checked) circleAU(rHill_au, '#22c55e');   // green
    if (chkRoche && chkRoche.checked) circleAU(rRoche_au, '#ef4444'); // red
    if (chkSync && chkSync.checked) circleAU(rSync_au, '#3b82f6');    // blue

    // Legend labels
    ctx.setLineDash([]);
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.fillStyle = '#5d7a9a';
    let yoff = 0;
    function label(text){ ctx.fillText(text, cx+8, cy+12+yoff); yoff += 12; }
    if (chkHill && chkHill.checked) label('Hill');
    if (chkRoche && chkRoche.checked) label('Roche');
    if (chkSync && chkSync.checked) label('Synchrone');
    ctx.restore();
  }

