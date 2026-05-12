<?php
declare(strict_types=1);
?>
<!-- BLOC CALCUL CLASSIQUE (planète de référence) -->
<form method="post" novalidate id="refForm">
  <div class="row g-3">
    <div class="col-md-4">
      <label class="form-label">Demi-grand axe \(a\)</label>
      <div class="input-group">
        <input type="text" name="a_value" id="ref_a_value" class="form-control"
               placeholder="ex: 0.387 (UA) ou 5.8e10 (m)"
               value="<?= esc($_POST['a_value'] ?? '0.387') ?>">
        <select name="a_unit" id="ref_a_unit" class="form-select" style="max-width:110px">
          <?php $optsA=['au'=>'UA','km'=>'km','m'=>'m']; $selA=$_POST['a_unit']??'au';
          foreach($optsA as $v=>$lab){$sel=$selA===$v?'selected':'';echo "<option value='".esc($v)."' $sel>".esc($lab)."</option>";} ?>
        </select>
      </div>
      <div class="form-text">1 UA ≈ <?= number_format(AU_M,0,',',' ') ?> m</div>
    </div>
    <div class="col-md-4">
      <label class="form-label">Excentricité \(e\)</label>
      <input type="text" name="e" id="ref_e" class="form-control"
             placeholder="ex: 0.2056 (Mercure)"
             value="<?= esc($_POST['e'] ?? '0.2056') ?>">
    </div>
    <div class="col-md-4">
      <label class="form-label">Masses stellaires</label>
      <textarea name="masses" id="ref_masses" class="form-control" rows="2"><?= esc($_POST['masses'] ?? '1') ?></textarea>
      <div class="mt-1">
        <label class="form-label">Unité</label>
        <select name="m_unit" id="ref_m_unit" class="form-select form-select-sm">
          <?php $optsM=['msun'=>'M☉ (masses solaires)','kg'=>'kg']; $selM=$_POST['m_unit']??'msun';
          foreach($optsM as $v=>$lab){$sel=$selM===$v?'selected':'';echo "<option value='".esc($v)."' $sel>".esc($lab)."</option>";} ?>
        </select>
      </div>
    </div>
  </div>
  <div class="mt-3 d-flex gap-2">
    <button class="btn btn-primary btn-sm">Calculer</button>
    <button type="reset" class="btn btn-outline-secondary btn-sm">Réinitialiser</button>
  </div>
</form>

<?php if ($result): ?>
<hr>
<div class="row mt-3">
  <div class="col-md-6">
    <ul class="list-unstyled">
      <li><strong>a</strong> : <?= esc($result['a_input']) ?> <?= esc($result['a_unit']) ?> (<?= number_format($result['a_m'], 3, ',', ' ') ?> m)</li>
      <li><strong>e</strong> : <?= esc($result['e']) ?></li>
      <li>Σ masses : <strong><?= number_format($result['mtot_kg'], 3, ',', ' ') ?></strong> kg</li>
      <li>μ : <strong><?= sprintf('%.6e',$result['mu']) ?></strong> m³/s²</li>
    </ul>
  </div>
  <div class="col-md-6">
    <ul class="list-unstyled">
      <li>Période \(T\) : <strong><?= number_format($result['T_s'],3,',',' ') ?></strong> s
        (<?= number_format($result['T_days'],6,',',' ') ?> j,
         <?= number_format($result['T_years'],9,',',' ') ?> an)</li>
      <li>Fréquence : <strong><?= sprintf('%.6e',$result['freq_Hz']) ?></strong> Hz</li>
      <li>q = a(1−e) : <strong><?= number_format(m_to_unit($result['q_m'],$result['a_unit']), 6, ',', ' ') . ' ' . esc($result['a_unit']) ?></strong></li>
      <li>Q = a(1+e) : <strong><?= number_format(m_to_unit($result['Q_m'],$result['a_unit']), 6, ',', ' ') . ' ' . esc($result['a_unit']) ?></strong></li>
    </ul>
  </div>
</div>

<p class="gc-section-header mt-3">Précession (Schwarzschild)</p>
<ul class="list-unstyled">
  <li>par orbite : <strong><?= sprintf('%.6e',$result['domega_orbit_deg']) ?></strong> ° / <strong><?= sprintf('%.6f',$result['domega_orbit_arcsec']) ?></strong> ″</li>
  <li>orbites / siècle : <strong><?= sprintf('%.3f',$result['orbits_century']) ?></strong></li>
  <li>sur 1 siècle : <strong><?= sprintf('%.6f',$result['domega_century_deg']) ?></strong> ° / <strong><?= sprintf('%.3f',$result['domega_century_arcsec']) ?></strong> ″</li>
</ul>

<hr>

<div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
  <span style="color:var(--text-muted);font-size:.8rem;">ω(t) sur 1 siècle</span>
  <div class="d-flex gap-2">
    <button id="btnCsv" class="btn btn-outline-primary btn-sm">Exporter CSV</button>
    <button id="btnJson" class="btn btn-outline-secondary btn-sm">Exporter JSON</button>
  </div>
</div>
<canvas id="omegaChartDeg" class="fixed-chart mb-3"></canvas>
<canvas id="omegaChartArcsec" class="fixed-chart mb-3"></canvas>

<div class="table-responsive" style="max-height:380px;">
  <table class="table table-sm table-striped align-middle gc-table" id="evolutionTable">
    <thead><tr><th>Année</th><th>ω (°)</th><th>ω (″)</th><th>q (<?= esc($result['a_unit']) ?>)</th><th>Q (<?= esc($result['a_unit']) ?>)</th></tr></thead>
    <tbody>
      <?php foreach($table as $row): ?>
       <tr>
         <td><?= (int)$row['year'] ?></td>
         <td><?= number_format($row['omega_deg'],6,',',' ') ?></td>
         <td><?= number_format($row['omega_arcsec'],3,',',' ') ?></td>
         <td><?= number_format($row['q'],6,',',' ') ?></td>
         <td><?= number_format($row['Q'],6,',',' ') ?></td>
       </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
</div>

<script>
(()=> {
  const rows = <?= json_encode($table, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_NUMERIC_CHECK) ?>;
  const labels = rows.map(r=>r.year), dataDeg = rows.map(r=>r.omega_deg), dataArc = rows.map(r=>r.omega_arcsec);
  new Chart(document.getElementById('omegaChartDeg').getContext('2d'), {
    type:'line', data:{labels, datasets:[{label:'ω(t) [°]', data:dataDeg, tension:0.15, pointRadius:0, borderWidth:2}]},
    options:{responsive:true, maintainAspectRatio:false, scales:{x:{title:{display:true,text:'Année'}}, y:{title:{display:true,text:'ω (°)'}}}, plugins:{legend:{display:true}, tooltip:{mode:'index',intersect:false}}}
  });
  new Chart(document.getElementById('omegaChartArcsec').getContext('2d'), {
    type:'line', data:{labels, datasets:[{label:'ω(t) [″]', data:dataArc, tension:0.15, pointRadius:0, borderWidth:2}]},
    options:{responsive:true, maintainAspectRatio:false, scales:{x:{title:{display:true,text:'Année'}}, y:{title:{display:true,text:'ω (″)'}}}, plugins:{legend:{display:true}, tooltip:{mode:'index',intersect:false}}}
  });
  document.getElementById('btnCsv').addEventListener('click', ()=>{
    const headers=['Annee','Omega_deg','Omega_arcsec','q_<?= esc($result['a_unit']) ?>','Q_<?= esc($result['a_unit']) ?>'];
    const lines=[headers.join(',')]; rows.forEach(r=>lines.push([r.year,r.omega_deg,r.omega_arcsec,r.q,r.Q].join(',')));
    const blob=new Blob([lines.join('\n')],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='evolution_perihelie_1_siecle.csv'; document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); a.remove();
  });
  document.getElementById('btnJson').addEventListener('click', ()=>{
    const blob=new Blob([JSON.stringify(rows,null,2)],{type:'application/json;charset=utf-8;'}); const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='evolution_perihelie_1_siecle.json'; document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); a.remove();
  });
})();
</script>
<?php endif; ?>
