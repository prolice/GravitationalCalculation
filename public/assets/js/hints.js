(function(){
  // Mini SVGs inline pour les hints
  const SVG = {
    a: `<svg class="svg-mini" width="120" height="50" viewBox="0 0 120 50" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="60" cy="25" rx="48" ry="18" fill="none" stroke="#7c9cff" stroke-width="2"/>
          <circle cx="30" cy="25" r="3" fill="#22d3ee"/>
          <text x="60" y="47" fill="#cbd5e1" font-size="10" text-anchor="middle">Demi-grand axe a</text>
        </svg>`,
    e: `<svg class="svg-mini" width="120" height="50" viewBox="0 0 120 50" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="60" cy="25" rx="48" ry="18" fill="none" stroke="#7c9cff" stroke-width="2"/>
          <line x1="12" y1="25" x2="108" y2="25" stroke="#94a3b8" stroke-width="1" stroke-dasharray="3 2"/>
          <circle cx="30" cy="25" r="3" fill="#22d3ee"/>
          <circle cx="90" cy="25" r="3" fill="#22d3ee"/>
          <text x="60" y="47" fill="#cbd5e1" font-size="10" text-anchor="middle">Excentricité e</text>
        </svg>`,
    pre: `<svg class="svg-mini" width="120" height="50" viewBox="0 0 120 50" xmlns="http://www.w3.org/2000/svg">
            <g opacity=".35">
              <ellipse cx="60" cy="25" rx="46" ry="17" fill="none" stroke="#94a3b8" stroke-width="2" transform="rotate(-15 60 25)"/>
              <ellipse cx="60" cy="25" rx="46" ry="17" fill="none" stroke="#94a3b8" stroke-width="2" transform="rotate(-7 60 25)"/>
            </g>
            <ellipse cx="60" cy="25" rx="46" ry="17" fill="none" stroke="#7c9cff" stroke-width="2"/>
            <text x="60" y="47" fill="#cbd5e1" font-size="10" text-anchor="middle">Précession</text>
          </svg>`,
    angles: `<svg class="svg-mini" width="120" height="50" viewBox="0 0 120 50" xmlns="http://www.w3.org/2000/svg">
              <circle cx="60" cy="25" r="1.5" fill="#22d3ee"/>
              <path d="M60 25 L110 25" stroke="#94a3b8" stroke-width="1"/>
              <path d="M60 25 A 30 30 0 0 1 90 15" fill="none" stroke="#7c9cff" stroke-width="2"/>
              <text x="60" y="47" fill="#cbd5e1" font-size="10" text-anchor="middle">ν, M, E, ω, θ</text>
            </svg>`,
    periapo: `<svg class="svg-mini" width="120" height="50" viewBox="0 0 120 50" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="60" cy="25" rx="48" ry="18" fill="none" stroke="#7c9cff" stroke-width="2"/>
                <circle cx="30" cy="25" r="3" fill="#22d3ee"/>
                <circle cx="12" cy="25" r="2.5" fill="#fbbf24"/>
                <circle cx="108" cy="25" r="2.5" fill="#fbbf24"/>
                <text x="60" y="47" fill="#cbd5e1" font-size="10" text-anchor="middle">q (périhélie), Q (aphélie)</text>
              </svg>`,
    v: `<svg class="svg-mini" width="120" height="50" viewBox="0 0 120 50" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="60" cy="25" rx="48" ry="18" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
          <circle cx="108" cy="25" r="3" fill="#22d3ee"/>
          <path d="M102 21 L112 25 L102 29" fill="#7c9cff"/>
          <text x="60" y="47" fill="#cbd5e1" font-size="10" text-anchor="middle">v (km/s)</text>
        </svg>`
  };

  // Config colonnes -> titre & tooltip
  const CFG_GLOBAL = [
    {k:'name',  t:'Corps',             tip:'Nom du corps (planète / lune).'},
    {k:'vis',   t:'Visibilité',        tip:'Icône œil = visible dans l’animation.'},
    {k:'a',     t:'a (UA)',            tip:`Demi-grand axe en unités astronomiques.<div class="mt-2">${SVG.a}</div>`},
    {k:'e',     t:'e',                 tip:`Excentricité (0=cercle, &rightarrow;1=ellipse allongée).<div class="mt-2">${SVG.e}</div>`},
    {k:'Ty',    t:'T (ans)',           tip:'Période orbitale en années siderales (Kepler III).'},
    {k:'TE',    t:'T/ Terre',          tip:'Période normalisée par celle de la Terre.'},
    {k:'n',     t:'n (°/j)',           tip:'Vitesse angulaire moyenne (degrés par jour).'},
    {k:'q',     t:'q (UA)',            tip:`Périhélie (distance mini au foyer).<div class="mt-2">${SVG.periapo}</div>`},
    {k:'Q',     t:'Q (UA)',            tip:`Aphélie (distance maxi au foyer).<div class="mt-2">${SVG.periapo}</div>`},
    {k:'pre_o', t:'Δω/orbite (″)',     tip:`Précession (relativité générale) par orbite.<div class="mt-2">${SVG.pre}</div>`},
    {k:'pre_c', t:'Δω/siècle (″)',     tip:`Précession cumulée sur 100 ans.`},
    {k:'vq',    t:'v(q) km/s',         tip:`Vitesse au périhélie (énergie orbitale).<div class="mt-2">${SVG.v}</div>`},
    {k:'vQ',    t:'v(Q) km/s',         tip:`Vitesse à l’aphélie.<div class="mt-2">${SVG.v}</div>`},
    {k:'risk',  t:'Risque',            tip:'Score heuristique de proximité étoile/planètes (0–100%).'}
  ];

  const CFG_INSTANT = [
    {k:'name',   t:'Corps',        tip:'Nom du corps (planète / lune).'},
    {k:'vis',    t:'',             tip:'Icône œil = visible dans l’animation.'},
    {k:'r',      t:'r (UA)',       tip:'Distance instantanée au foyer.'},
    {k:'nu',     t:'ν (°)',        tip:`Anomalie vraie.<div class="mt-2">${SVG.angles}</div>`},
    {k:'M',      t:'M (°)',        tip:`Anomalie moyenne.<div class="mt-2">${SVG.angles}</div>`},
    {k:'E',      t:'E (°)',        tip:`Anomalie excentrique.<div class="mt-2">${SVG.angles}</div>`},
    {k:'omega',  t:'ω (°)',        tip:`Argument du périhélie.<div class="mt-2">${SVG.angles}</div>`},
    {k:'theta',  t:'θ (°)',        tip:`Angle polaire (orientation actuelle).<div class="mt-2">${SVG.angles}</div>`},
    {k:'vkms',   t:'v (km/s)',     tip:`Vitesse instantanée orbitale.<div class="mt-2">${SVG.v}</div>`},
    {k:'dth',    t:'dθ/dt (°/j)',  tip:'Vitesse angulaire instantanée.'},
    {k:'dEarth', t:'Δr Terre (UA)',tip:'Distance au centre de la Terre (si présente).'},
    {k:'rev',    t:'Révolutions',  tip:'Nombre d’orbites complètes depuis t=0 (3 décimales).'},
    {k:'risk',   t:'Risque',       tip:'Risque heuristique instantané (0–100%).'},
    {k:'x',      t:'x (UA)',       tip:'Coordonnée x dans le repère du plan.'},
    {k:'y',      t:'y (UA)',       tip:'Coordonnée y dans le repère du plan.'}
  ];

  // --- construction de <thead>
  function buildHeadRow(cfg){
    const tr = document.createElement('tr');
    cfg.forEach(col=>{
      const th = document.createElement('th');
      const wrap = document.createElement('span');
      wrap.className = 'th-wrap';
      const label = document.createElement('span'); label.textContent = col.t;
      wrap.appendChild(label);
      if (col.tip){
        const hint = document.createElement('span');
        hint.className = 'th-hint';
        hint.setAttribute('data-bs-toggle','tooltip');
        hint.setAttribute('data-bs-title', col.tip);
        hint.innerHTML = 'i';
        wrap.appendChild(hint);
      }
      th.appendChild(wrap);
      tr.appendChild(th);
    });
    return tr;
  }

  // --- helpers tooltips/popovers
  function cleanupOrphans() {
    document.querySelectorAll('.tooltip, .popover').forEach(n => {
      const id = n.getAttribute('id');
      if (!id) { n.remove(); return; }
      const owner = document.querySelector('[aria-describedby="'+id+'"]');
      if (!owner || !document.body.contains(owner)) n.remove();
    });
  }

  function init(scope=document){
    if (!window.bootstrap) return;
    const root = scope;

    // Tooltips
    root.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
      // évite les doublons : s'il y a déjà une instance, ne recrée pas
      let inst = bootstrap.Tooltip.getInstance(el);
      if (!inst) inst = new bootstrap.Tooltip(el, {html:true, sanitize:false, container:'body'});
    });

    // Popovers (au cas où tu en utilises dans tes tables)
    root.querySelectorAll('[data-bs-toggle="popover"]').forEach(el => {
      let inst = bootstrap.Popover.getInstance(el);
      if (!inst) inst = new bootstrap.Popover(el, {html:true, sanitize:false, container:'body', trigger:'hover focus'});
    });
  }

  function dispose(scope=document){
    if (window.bootstrap) {
      scope.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
        const inst = bootstrap.Tooltip.getInstance(el);
        if (inst) inst.dispose();
      });
      scope.querySelectorAll('[data-bs-toggle="popover"]').forEach(el => {
        const inst = bootstrap.Popover.getInstance(el);
        if (inst) inst.dispose();
      });
    }
    cleanupOrphans();
  }

  // --- applique/rafraîchit les en-têtes des tables stats
  function applyHeaders(){
    const g = document.querySelector('#planetStatsTable thead');
    const i = document.querySelector('#instantStatsTable thead');

    // On "dispose" d'abord les hints existants sur ces tableaux
    if (g) dispose(g.closest('table') || g);
    if (i) dispose(i.closest('table') || i);

    if (g){
      g.innerHTML = '';
      g.appendChild(buildHeadRow(CFG_GLOBAL));
    }
    if (i){
      i.innerHTML = '';
      i.appendChild(buildHeadRow(CFG_INSTANT));
    }

    // Puis on ré-initialise les tooltips/popovers sur la zone impactée
    if (g) init(g.closest('table') || g);
    if (i) init(i.closest('table') || i);
  }

  // Expose une API propre, utilisée par moons-ui-refresh.js
  window.Hints = { init, dispose };

  // Compat: garde ton hook existant
  window.__applyStatsHeaders = applyHeaders;

  // Auto-run initial
  document.addEventListener('DOMContentLoaded', () => {
    applyHeaders();
    // si l’UI demande explicitement un refresh (ex: document.dispatchEvent(new CustomEvent('hints:refresh')))
    document.addEventListener('hints:refresh', (ev) => {
      const scope = (ev.detail && ev.detail.scope) ? ev.detail.scope : document;
      // on ne touche pas aux <thead> si ce n’est pas nécessaire; juste re-init
      dispose(scope);
      init(scope);
    });
    // petit filet de sécurité : si scroll fort, on purge les artefacts orphelins
    window.addEventListener('scroll', cleanupOrphans, { passive:true });
  });
})();
