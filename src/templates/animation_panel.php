<?php
declare(strict_types=1);
?>
<!-- ANIMATION CANVAS + TICKER -->
<div class="orbit-widget mb-4">
  <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
    <h5 class="mb-0">Animation orbitale (étoile au foyer)</h5>
    <div class="orbit-toolbar">
      <button id="btnPlayPause" class="btn btn-primary btn-sm">⏸ Pause</button>

      <!-- Nouvelle échelle : années simulées / seconde réelle (logarithmique) -->
      <label class="form-label mb-0 ms-2">Vitesse (années/s)
        <input type="range" id="speedSliderY" min="0" max="100" step="1" value="60" style="vertical-align:middle; width:240px;">
        <span id="speedValY">1.00</span>
        <small class="text-muted">(≈ <span id="speedValDays">365.25</span> j/s)</small>
      </label>

      <div class="vr mx-2"></div>

      <button id="btnStep" class="btn btn-outline-secondary btn-sm" title="Avance d’un pas">Step</button>
      <button id="btnResetTime" class="btn btn-outline-secondary btn-sm" title="Remet le temps simulé à 0">Reset</button>

      <div class="vr mx-2"></div>

      <span class="badge text-bg-light">
        ⏱ <span id="simTimeLabel">t = 0 an (0 j)</span>
      </span>
      <span class="badge text-bg-light ms-1">
        FPS: <span id="fpsLabel">—</span>
      </span>
      <span class="badge text-bg-light ms-1">
        JD: <span id="jdLabel">—</span>
      </span>
      <span class="badge text-bg-light ms-1">
        Date (UTC): <span id="dateLabel">—</span>
      </span>

      <div class="vr mx-2"></div>

      <label class="form-label mb-0 ms-2"><input type="checkbox" id="showTrail" checked> Tracer la trajectoire</label>
      <label class="form-label mb-0 ms-2"><input type="checkbox" id="showPrecession" checked> Précession</label>
    </div>
  </div>

  <!-- Contrôles de datation absolue (positionnement réel) -->
  <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
    <label for="epochInput" class="form-label mb-0">Date de référence</label>
    <input id="epochInput" type="datetime-local" class="form-control form-control-sm" style="max-width:260px">
    <button id="btnEpochNow" class="btn btn-outline-secondary btn-sm" title="Renseigne la date/heure UTC courante">Maintenant</button>
    <button id="btnSyncEpoch" class="btn btn-primary btn-sm" title="Récupère les éléments JPL à cette date et synchronise les positions">Synchroniser positions</button>
    <!-- Affichage optionnel de l’époque en JD (pas utilisé par app.js, laissé sans id pour éviter les doublons) -->
    <span class="text-muted small ms-2">(JD affiché dans les badges ci-dessus)</span>
  </div>

  <div class="orbit-canvas-wrap"><canvas id="orbitCanvas"></canvas></div>
  <div class="orbit-help mt-2">
    Ellipse vraie centrée sur le <em>foyer</em> (l’étoile). La précession fait pivoter lentement l’ellipse.
    Cliquez dans la légende pour (dé)masquer une planète.
  </div>
</div>

<!-- STATS INSTANTANÉES (proches du graphique) -->
<div class="card shadow-sm mb-4">
  <div class="card-body">
    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
      <h5 class="mb-0">Statistiques instantanées (animation)</h5>
      <div class="d-flex align-items-center gap-3">
        <span class="stats-note">Valeurs au temps simulé courant.</span>
        <div class="form-check form-switch m-0">
          <input class="form-check-input" type="checkbox" id="instantOnlyVisible" checked>
          <label class="form-check-label" for="instantOnlyVisible">N’inclure que les planètes visibles</label>
        </div>
      </div>
    </div>
    <div class="table-responsive mt-3" style="max-height:420px;">
      <table class="table table-sm align-middle" id="instantStatsTable">
        <thead>
          <tr>
            <th>
              Planète
              <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true"
                title="Nom et couleur. Les valeurs évoluent en temps réel lorsque l’animation tourne.">ⓘ</span>
            </th>
            <th>
              Vis.
              <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true"
                title="👁️ = visible / (grisé) = masquée. Le switch filtre les lignes.">ⓘ</span>
            </th>
            <th>
              r (UA)
              <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true"
                title="Distance instantanée au foyer&nbsp;: r = a(1 − e cos E).">ⓘ</span>
            </th>
            <th>
              ν (°)
              <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true"
                title="Anomalie vraie (angle planète–foyer depuis le périhélie).">ⓘ</span>
            </th>
            <th>
              M (°)
              <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true"
                title="Anomalie moyenne (progresse linéairement avec le temps).">ⓘ</span>
            </th>
            <th>
              E (°)
              <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true"
                title="Anomalie excentrique&nbsp;: solution de M = E − e sin E.">ⓘ</span>
            </th>
            <th>
              ω(t) (°)
              <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true"
                title="Argument du périhélie incluant la précession relativiste.">ⓘ</span>
            </th>
            <th>
              θ = ω + ν (°)
              <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true"
                title="Angle polaire instantané utilisé pour le rendu (repère du canvas).">ⓘ</span>
            </th>
            <th>
              v (km/s)
              <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true"
                title="Vitesse instantanée (vis-viva)&nbsp;: v = √( μ(2/r − 1/a) ).">ⓘ</span>
            </th>
            <th>
              dθ/dt (°/j)
              <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true"
                title="Vitesse angulaire instantanée&nbsp;: h/r² (avec h = √(μ a(1−e²))).">ⓘ</span>
            </th>
            <th>
              Δr Terre (UA)
              <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true"
                title="Distance entre la planète et la Terre en UA (calculée même si la Terre est masquée).">ⓘ</span>
            </th>
            <th>
              Révolutions (compl.)
              <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true"
                title="Nombre d’orbites accomplies depuis t=0&nbsp;: t_simulé / T (affiché avec 3 décimales).">ⓘ</span>
            </th>
            <th>
              Risque coll. (inst.)
              <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true"
                title="Taux instantané (0–100%) basé sur la distance minimale aux autres corps (max exp(−d/σ)) et la proximité à l’étoile (exp(−r/σ★)).">ⓘ</span>
            </th>
            <th>
              x (UA)
              <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true"
                title="Coordonnée X dans le plan de l’animation.">ⓘ</span>
            </th>
            <th>
              y (UA)
              <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true"
                title="Coordonnée Y dans le plan de l’animation.">ⓘ</span>
            </th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  </div>
</div>


  <!-- Physique & précision -->
  <div class="card card-body py-2 px-3 mb-2" style="background:#f8fafc">
    <div class="d-flex flex-wrap align-items-center gap-3">
      <strong>Physique & précision :</strong>
      <div class="form-check form-switch m-0">
        <input class="form-check-input" type="checkbox" id="nbodyMode">
        <label class="form-check-label" for="nbodyMode">N‑corps (β)</label>
      </div>
      <label class="form-label mb-0">Adoucissement ε (AU)
        <input type="number" step="0.0001" min="0" value="0" id="nbodySoftAU" class="form-control form-control-sm d-inline-block" style="width:110px">
      </label>
      <div class="vr mx-1"></div>
      <div class="form-check form-switch m-0">
        <input class="form-check-input" type="checkbox" id="enable3D" checked>
        <label class="form-check-label" for="enable3D">Vue 3D</label>
      </div>
      <label class="form-label mb-0">Caméra — Pitch (°)
        <input type="range" id="camPitch" min="0" max="75" step="1" value="25" style="vertical-align:middle; width:160px;">
      </label>
      <label class="form-label mb-0">Yaw (°)
        <input type="range" id="camYaw" min="0" max="360" step="1" value="0" style="vertical-align:middle; width:160px;">
      </label>
    </div>
  </div>

  <!-- Événements & analyses -->
  <div class="card card-body py-2 px-3 mb-2" style="background:#f1f5f9">
    <div class="d-flex flex-wrap align-items-center gap-3 mb-2">
      <strong>Événements détectés</strong>
      <div class="form-check form-switch m-0">
        <input class="form-check-input" type="checkbox" id="evtConj" checked>
        <label class="form-check-label" for="evtConj">Conj./Opp.</label>
      </div>
      <div class="form-check form-switch m-0">
        <input class="form-check-input" type="checkbox" id="evtPeri" checked>
        <label class="form-check-label" for="evtPeri">Périh./Aph.</label>
      </div>
      <div class="form-check form-switch m-0">
        <input class="form-check-input" type="checkbox" id="evtRes" checked>
        <label class="form-check-label" for="evtRes">Résonances</label>
      </div>
      <div class="form-check form-switch m-0">
        <input class="form-check-input" type="checkbox" id="evtEcl" checked>
        <label class="form-check-label" for="evtEcl">Éclipses (β)</label>
      </div>
      <button id="evtClear" class="btn btn-sm btn-outline-secondary">Effacer</button>
      <span class="small text-muted ms-auto">Réf.: Terre (par défaut)</span>
    </div>
    <div id="eventsList" class="small" style="max-height:200px; overflow:auto; border:1px dashed #cbd5e1; border-radius:.5rem; padding:.25rem .5rem;"></div>
  </div>

  <!-- Courbes temporelles -->
  <div class="card card-body py-2 px-3 mb-3" style="background:#f8fafc">
    <div class="d-flex flex-wrap align-items-center gap-3 mb-2">
      <strong>Courbes temporelles</strong>
      <label class="form-label mb-0">Corps
        <select id="tsBody" class="form-select form-select-sm d-inline-block" style="width:auto">
          <option value="">— Sélectionner —</option>
        </select>
      </label>
      <div class="form-check form-switch m-0">
        <input class="form-check-input" type="checkbox" id="ts_r" checked>
        <label class="form-check-label" for="ts_r">r(t)</label>
      </div>
      <div class="form-check form-switch m-0">
        <input class="form-check-input" type="checkbox" id="ts_v" checked>
        <label class="form-check-label" for="ts_v">v(t)</label>
      </div>
      <div class="form-check form-switch m-0">
        <input class="form-check-input" type="checkbox" id="ts_nu" checked>
        <label class="form-check-label" for="ts_nu">ν(t)</label>
      </div>
      <div class="form-check form-switch m-0">
        <input class="form-check-input" type="checkbox" id="ts_dr" checked>
        <label class="form-check-label" for="ts_dr">Δr Terre</label>
      </div>
      <button id="tsClear" class="btn btn-sm btn-outline-secondary">Clear</button>
    </div>
    <canvas id="timeseriesChart" height="400"></canvas>
  </div>
