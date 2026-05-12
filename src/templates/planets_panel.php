<?php
declare(strict_types=1);
?>
<!-- MASSE CENTRALE (étoile(s)) -->
<div class="card shadow-sm mb-4">
  <div class="card-body">
    <h5>Étoile(s) centrale(s)</h5>
    <div class="row g-3">
      <div class="col-md-8">
        <label class="form-label">Masses stellaires (une ou plusieurs)</label>
        <textarea id="masses" class="form-control" rows="3"
          placeholder="Ex: 1 (M☉)  •  0.8, 0.2  •  [1.0,0.9]"><?= esc($_POST['masses'] ?? '1') ?></textarea>
      </div>
      <div class="col-md-4">
        <label class="form-label">Unité des masses</label>
        <select id="m_unit" class="form-select">
          <?php $optsM=['msun'=>'M☉ (masses solaires)','kg'=>'kg']; $selM=$_POST['m_unit']??'msun';
            foreach($optsM as $v=>$lab){$sel=$selM===$v?'selected':'';echo "<option value='".esc($v)."' $sel>".esc($lab)."</option>";} ?>
        </select>
        <div class="form-text">Somme → masse centrale totale (barycentre).</div>
      </div>
    </div>
  </div>
</div>

<!-- STATS DES PLANÈTES (au-dessus de l'animation) -->
<div class="card shadow-sm mb-4">
  <div class="card-body">
    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
      <h5 class="mb-0">Statistiques des planètes</h5>
      <div class="d-flex align-items-center gap-3">
        <span class="stats-note">T (années) en années juliennes. « T / Terre » compare à la période de la Terre si présente (sinon 1 an).</span>
        <div class="form-check form-switch m-0">
          <input class="form-check-input" type="checkbox" id="statsOnlyVisible" checked>
          <label class="form-check-label" for="statsOnlyVisible">N’inclure que les planètes visibles</label>
        </div>
      </div>
    </div>
    <div class="table-responsive mt-3" style="max-height: 420px;">
      <table class="table table-sm align-middle" id="planetStatsTable">
        <thead>
          <tr>
            <th>
              Planète
              <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true"
                title="Nom et couleur de la trajectoire. L’icône 👁️ bascule la visibilité.">ⓘ</span>
            </th>
            <th>
              Vis.
              <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true"
                title="👁️ = visible dans l’animation&nbsp;; icône grisée = masquée.">ⓘ</span>
            </th>
            <th>
              a (UA)
              <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true"
                title="Demi-grand axe (moitié du grand axe de l’ellipse).<br><img alt='a' style='width:140px;height:auto' src='data:image/svg+xml;utf8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27140%27 height=%2760%27 viewBox=%270 0 140 60%27%3E%3Cellipse cx=%2770%27 cy=%2730%27 rx=%2750%27 ry=%2720%27 fill=%27none%27 stroke=%27black%27 stroke-width=%272%27/%3E%3Cline x1=%2770%27 y1=%2730%27 x2=%27120%27 y2=%2730%27 stroke=%27black%27 stroke-width=%272%27/%3E%3Ccircle cx=%2770%27 cy=%2730%27 r=%273%27 fill=%27black%27/%3E%3Ctext x=%2795%27 y=%2725%27 font-size=%2712%27%3Ea%3C/text%3E%3C/svg%3E'/>">ⓘ</span>
            </th>
            <th>
              e
              <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true"
                title="Excentricité de l’ellipse (0 cercle → proche de 1 très allongée).">ⓘ</span>
            </th>
            <th>
              T (années)
              <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true"
                title="Période sidérale&nbsp;: T = 2π √(a³/μ). μ = G·ΣM (masses stellaires).">ⓘ</span>
            </th>
            <th>
              T / Terre
              <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true"
                title="Période rapportée à celle de la Terre (≈1 an).">ⓘ</span>
            </th>
            <th>
              n (°/j)
              <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true"
                title="Vitesse angulaire moyenne&nbsp;: n = 360° / T(jours).">ⓘ</span>
            </th>
            <th>
              q (UA)
              <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true"
                title="Périhélie&nbsp;: q = a(1−e).<br><img alt='qQ' style='width:160px;height:auto' src='data:image/svg+xml;utf8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27160%27 height=%2760%27 viewBox=%270 0 160 60%27%3E%3Cellipse cx=%2780%27 cy=%2730%27 rx=%2760%27 ry=%2720%27 fill=%27none%27 stroke=%27black%27 stroke-width=%272%27/%3E%3Ccircle cx=%27100%27 cy=%2730%27 r=%273%27 fill=%27black%27/%3E%3Ccircle cx=%27140%27 cy=%2730%27 r=%273%27 fill=%27red%27/%3E%3Ctext x=%27140%27 y=%2720%27 font-size=%2712%27%3Eq%3C/text%3E%3Ccircle cx=%2720%27 cy=%2730%27 r=%273%27 fill=%27blue%27/%3E%3Ctext x=%2720%27 y=%2720%27 font-size=%2712%27%3EQ%3C/text%3E%3C/svg%3E'/>">ⓘ</span>
            </th>
            <th>
              Q (UA)
              <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true"
                title="Aphélie&nbsp;: Q = a(1+e).<br><img alt='qQ' style='width:160px;height:auto' src='data:image/svg+xml;utf8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27160%27 height=%2760%27 viewBox=%270 0 160 60%27%3E%3Cellipse cx=%2780%27 cy=%2730%27 rx=%2760%27 ry=%2720%27 fill=%27none%27 stroke=%27black%27 stroke-width=%272%27/%3E%3Ccircle cx=%27100%27 cy=%2730%27 r=%273%27 fill=%27black%27/%3E%3Ccircle cx=%27140%27 cy=%2730%27 r=%273%27 fill=%27red%27/%3E%3Ctext x=%27140%27 y=%2720%27 font-size=%2712%27%3Eq%3C/text%3E%3Ccircle cx=%2720%27 cy=%2730%27 r=%273%27 fill=%27blue%27/%3E%3Ctext x=%2720%27 y=%2720%27 font-size=%2712%27%3EQ%3C/text%3E%3C/svg%3E'/>">ⓘ</span>
            </th>
            <th>
              Δω/orbite (″)
              <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true"
                title="Précession relativiste par orbite&nbsp;: Δω = 6πGM / [a(1−e²)c²] (en arcsec).">ⓘ</span>
            </th>
            <th>
              Δω/siècle (″)
              <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true"
                title="Précession cumulée sur 100 ans&nbsp;: Δω_orbite × (100 ans / T).">ⓘ</span>
            </th>
            <th>
              v<sub>peri</sub> (km/s)
              <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true"
                title="Vitesse au périhélie (vis-viva) : v = √( μ(2/r − 1/a) ) avec r = q.">ⓘ</span>
            </th>
            <th>
              v<sub>apo</sub> (km/s)
              <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true"
                title="Vitesse à l’aphélie (vis-viva) avec r = Q.">ⓘ</span>
            </th>
            <th>
              Risque coll. (stat.)
              <span class="th-hint" data-bs-toggle="tooltip" data-bs-html="true"
                title="Taux synthétique (0–100%) basé sur le recouvrement des intervalles orbitaux [q,Q] avec d’autres corps et la proximité du périhélie à l’étoile (exp(−q/σ)).">ⓘ</span>
            </th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  </div>
</div>

<!-- UI MULTI-PLANÈTES (+ menu "Charger planète") -->
<div class="card shadow-sm mb-4">
  <div class="card-body">
    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
      <h5 class="mb-0">Planètes (orbites elliptiques)</h5>
      <div class="d-flex align-items-center gap-2">
        <select id="presetSelect" class="form-select form-select-sm" style="min-width:220px">
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
        <button id="btnAddPreset" class="btn btn-outline-secondary btn-sm">Ajouter</button>
        <button id="btnAddAll" class="btn btn-outline-primary btn-sm">Ajouter toutes (8)</button>
        <button id="btnAddPlanet" class="btn btn-outline-success btn-sm">+ Personnalisée</button>
      </div>
    </div>
    <div id="planetsList" class="mt-3"></div>
    <div class="mt-2">
      <div id="planetsLegend"></div>
    </div>
  </div>
</div>
