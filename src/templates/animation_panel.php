<?php
declare(strict_types=1);
?>
<!-- ===== CANVAS ===== -->
<div class="orbit-canvas-wrap">
  <canvas id="orbitCanvas"></canvas>
  <div class="gc-star-pulse"></div>
</div>

<!-- ===== TOOLBAR (below canvas) ===== -->
<div class="gc-toolbar">

  <button id="btnPlayPause" class="gc-btn-primary">▶️ Lecture</button>

  <div class="vr"></div>

  <label class="form-label mb-0" style="color:var(--text-muted);font-size:.75rem;">
    Vitesse (ans/s)
    <input type="range" id="speedSliderY" min="0" max="100" step="1" value="60"
           style="vertical-align:middle; width:160px;">
    <span id="speedValY" style="font-family:'JetBrains Mono',monospace;font-size:.78rem;color:var(--text-data)">1.00</span>
    <small style="color:var(--text-muted);">(≈ <span id="speedValDays">365.25</span> j/s)</small>
  </label>

  <div class="vr"></div>

  <button id="btnStep" class="gc-btn-ghost btn-sm" title="Avance d'un pas">Step</button>
  <button id="btnResetTime" class="gc-btn-ghost btn-sm" title="Remet le temps simulé à 0">Reset</button>

  <div class="vr"></div>

  <label class="form-label mb-0" style="display:flex;align-items:center;gap:.4rem;font-size:.75rem;color:var(--text-muted);">
    <input type="checkbox" id="showTrail" class="form-check-input m-0" checked>
    Trajectoire
  </label>
  <label class="form-label mb-0" style="display:flex;align-items:center;gap:.4rem;font-size:.75rem;color:var(--text-muted);">
    <input type="checkbox" id="showPrecession" class="form-check-input m-0" checked>
    Précession
  </label>

  <div class="vr"></div>

  <!-- Date de référence -->
  <label for="epochInput" class="form-label mb-0" style="font-size:.75rem;color:var(--text-muted);">Date réf.</label>
  <input id="epochInput" type="datetime-local" class="form-control form-control-sm"
         style="max-width:190px; font-size:.75rem;">
  <button id="btnEpochNow" class="gc-btn-ghost btn-sm" title="Heure UTC courante">Maintenant</button>
  <button id="btnSyncEpoch" class="gc-btn-primary btn-sm" title="Synchronise les positions JPL">Synchroniser</button>

</div><!-- /.gc-toolbar -->

<div class="orbit-help">
  Ellipse vraie centrée sur le <em>foyer</em> (l'étoile). La précession fait pivoter lentement l'ellipse.
  Cliquez dans la légende pour (dé)masquer une planète.
</div>

<!-- ===== TABS ===== -->
<div class="gc-tabs-bar">
  <button class="gc-tab-btn active" data-tab="tab-stats-global">Stats globales</button>
  <button class="gc-tab-btn" data-tab="tab-stats-instant">Stats inst.</button>
  <button class="gc-tab-btn" data-tab="tab-ref">Planète de réf.</button>
</div>

<!-- Tab 1 — Stats globales -->
<div id="tab-stats-global" class="gc-tab-pane active gc-panel">
  <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
    <span class="stats-note">T (années juliennes). « T / Terre » compare à la période de la Terre si présente (sinon 1 an).</span>
    <div class="form-check form-switch m-0">
      <input class="form-check-input" type="checkbox" id="statsOnlyVisible" checked>
      <label class="form-check-label" for="statsOnlyVisible">Planètes visibles seulement</label>
    </div>
  </div>
  <div class="table-responsive" style="max-height:400px;">
    <table class="table table-sm align-middle gc-table" id="planetStatsTable">
      <thead>
        <tr>
          <th>Planète <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true" title="Nom et couleur de la trajectoire.">ⓘ</span></th>
          <th>Vis.</th>
          <th>a (UA) <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true" title="Demi-grand axe (moitié du grand axe de l'ellipse).">ⓘ</span></th>
          <th>e <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true" title="Excentricité de l'ellipse (0 cercle → proche de 1 très allongée).">ⓘ</span></th>
          <th>T (années) <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true" title="Période sidérale&nbsp;: T = 2π √(a³/μ). μ = G·ΣM.">ⓘ</span></th>
          <th>T / Terre <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true" title="Période rapportée à celle de la Terre (≈1 an).">ⓘ</span></th>
          <th>n (°/j) <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true" title="Vitesse angulaire moyenne&nbsp;: n = 360° / T(jours).">ⓘ</span></th>
          <th>q (UA) <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true" title="Périhélie&nbsp;: q = a(1−e).">ⓘ</span></th>
          <th>Q (UA) <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true" title="Aphélie&nbsp;: Q = a(1+e).">ⓘ</span></th>
          <th>Δω/orbite (″) <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true" title="Précession relativiste par orbite&nbsp;: Δω = 6πGM / [a(1−e²)c²] (arcsec).">ⓘ</span></th>
          <th>Δω/siècle (″) <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true" title="Précession cumulée sur 100 ans.">ⓘ</span></th>
          <th>v<sub>peri</sub> (km/s) <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true" title="Vitesse au périhélie (vis-viva).">ⓘ</span></th>
          <th>v<sub>apo</sub> (km/s) <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true" title="Vitesse à l'aphélie (vis-viva).">ⓘ</span></th>
          <th>Risque coll. (stat.) <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true" title="Taux synthétique (0–100%) basé sur le recouvrement des intervalles orbitaux.">ⓘ</span></th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>
</div>

<!-- Tab 2 — Stats instantanées -->
<div id="tab-stats-instant" class="gc-tab-pane gc-panel">
  <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
    <span class="stats-note">Valeurs au temps simulé courant.</span>
    <div class="form-check form-switch m-0">
      <input class="form-check-input" type="checkbox" id="instantOnlyVisible" checked>
      <label class="form-check-label" for="instantOnlyVisible">Planètes visibles seulement</label>
    </div>
  </div>
  <div class="table-responsive" style="max-height:400px;">
    <table class="table table-sm align-middle gc-table" id="instantStatsTable">
      <thead>
        <tr>
          <th>Planète <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true" title="Nom et couleur. Les valeurs évoluent en temps réel.">ⓘ</span></th>
          <th>Vis.</th>
          <th>r (UA) <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true" title="Distance instantanée au foyer&nbsp;: r = a(1 − e cos E).">ⓘ</span></th>
          <th>ν (°) <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true" title="Anomalie vraie (angle planète–foyer depuis le périhélie).">ⓘ</span></th>
          <th>M (°) <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true" title="Anomalie moyenne (progresse linéairement avec le temps).">ⓘ</span></th>
          <th>E (°) <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true" title="Anomalie excentrique&nbsp;: solution de M = E − e sin E.">ⓘ</span></th>
          <th>ω(t) (°) <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true" title="Argument du périhélie incluant la précession relativiste.">ⓘ</span></th>
          <th>θ = ω + ν (°) <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true" title="Angle polaire instantané utilisé pour le rendu (repère du canvas).">ⓘ</span></th>
          <th>v (km/s) <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true" title="Vitesse instantanée (vis-viva)&nbsp;: v = √( μ(2/r − 1/a) ).">ⓘ</span></th>
          <th>dθ/dt (°/j) <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true" title="Vitesse angulaire instantanée.">ⓘ</span></th>
          <th>Δr Terre (UA) <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true" title="Distance entre la planète et la Terre en UA.">ⓘ</span></th>
          <th>Révolutions <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true" title="Nombre d'orbites accomplies depuis t=0.">ⓘ</span></th>
          <th>Risque coll. (inst.) <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true" title="Taux instantané (0–100%) basé sur la distance minimale aux autres corps.">ⓘ</span></th>
          <th>x (UA)</th>
          <th>y (UA)</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>
</div>

<!-- Tab 3 — Planète de référence -->
<div id="tab-ref" class="gc-tab-pane gc-panel">
  <?php include __DIR__ . '/reference_block.php'; ?>
</div>

<script>
(function(){
  document.querySelectorAll('.gc-tab-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var target = this.dataset.tab;
      document.querySelectorAll('.gc-tab-btn').forEach(function(b){ b.classList.remove('active'); });
      document.querySelectorAll('.gc-tab-pane').forEach(function(p){ p.classList.remove('active'); });
      this.classList.add('active');
      var pane = document.getElementById(target);
      if (pane) pane.classList.add('active');
    });
  });
})();
</script>
