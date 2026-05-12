<?php
declare(strict_types=1);
?>
<!-- ☉ Étoile(s) centrale(s) -->
<div class="gc-section-header">☉ Étoile(s) centrale(s)</div>
<div class="gc-panel">
  <div class="mb-2">
    <label class="form-label">Masses stellaires (une ou plusieurs)</label>
    <textarea id="masses" class="form-control" rows="2"
      placeholder="Ex: 1 (M☉)  •  0.8, 0.2  •  [1.0,0.9]"><?= esc($_POST['masses'] ?? '1') ?></textarea>
  </div>
  <div>
    <label class="form-label">Unité des masses</label>
    <select id="m_unit" class="form-select form-select-sm">
      <?php $optsM=['msun'=>'M☉ (masses solaires)','kg'=>'kg']; $selM=$_POST['m_unit']??'msun';
        foreach($optsM as $v=>$lab){$sel=$selM===$v?'selected':'';echo "<option value='".esc($v)."' $sel>".esc($lab)."</option>";} ?>
    </select>
    <div class="form-text mt-1">Somme → masse centrale totale (barycentre).</div>
  </div>
</div>

<!-- Planètes -->
<div class="gc-section-header">Planètes (orbites elliptiques)</div>
<div class="gc-panel">
  <div class="d-flex flex-wrap gap-1 mb-2">
    <select id="presetSelect" class="form-select form-select-sm flex-grow-1" style="min-width:130px">
      <option value="">— Charger planète —</option>
      <option value="Mercure">Mercure</option>
      <option value="Vénus">Vénus</option>
      <option value="Terre">Terre</option>
      <option value="Mars">Mars</option>
      <option value="Jupiter">Jupiter</option>
      <option value="Saturne">Saturne</option>
      <option value="Uranus">Uranus</option>
      <option value="Neptune">Neptune</option>
      <option value="Pluton">Pluton (naine)</option>
    </select>
    <button id="btnAddPreset" class="btn btn-outline-secondary btn-sm">+</button>
  </div>
  <div class="d-flex gap-1 mb-2">
    <button id="btnAddAll" class="btn btn-outline-primary btn-sm flex-grow-1">Ajouter 8 planètes</button>
    <button id="btnAddPlanet" class="btn btn-outline-success btn-sm flex-grow-1">+ Personnalisée</button>
  </div>
  <div id="planetsList"></div>
  <div id="planetsLegend" class="mt-2"></div>
</div>

<!-- Physique & précision -->
<div class="gc-section-header">Physique & précision</div>
<div class="gc-panel">
  <div class="d-flex flex-column gap-2">
    <div class="d-flex align-items-center gap-2 flex-wrap">
      <div class="form-check form-switch m-0">
        <input class="form-check-input" type="checkbox" id="nbodyMode">
        <label class="form-check-label" for="nbodyMode">N‑corps (β)</label>
      </div>
      <label class="form-label mb-0 ms-2">ε (AU)
        <input type="number" step="0.0001" min="0" value="0" id="nbodySoftAU"
               class="form-control form-control-sm d-inline-block" style="width:90px">
      </label>
    </div>
    <div class="d-flex align-items-center gap-2 flex-wrap">
      <div class="form-check form-switch m-0">
        <input class="form-check-input" type="checkbox" id="enable3D" checked>
        <label class="form-check-label" for="enable3D">Vue 3D</label>
      </div>
    </div>
    <label class="form-label mb-0">Pitch (°)
      <input type="range" id="camPitch" min="0" max="75" step="1" value="25"
             style="width:100%; vertical-align:middle;">
    </label>
    <label class="form-label mb-0">Yaw (°)
      <input type="range" id="camYaw" min="0" max="360" step="1" value="0"
             style="width:100%; vertical-align:middle;">
    </label>
  </div>
</div>

<!-- Événements détectés -->
<div class="gc-section-header">Événements détectés</div>
<div class="gc-panel">
  <div class="d-flex flex-wrap gap-2 align-items-center mb-2">
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
    <button id="evtClear" class="btn btn-sm btn-outline-secondary ms-auto">Effacer</button>
  </div>
  <div id="eventsList" class="small"></div>
</div>

<!-- Courbes temporelles -->
<div class="gc-section-header">Courbes temporelles</div>
<div class="gc-panel">
  <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
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
  <canvas id="timeseriesChart" height="280"></canvas>
</div>
