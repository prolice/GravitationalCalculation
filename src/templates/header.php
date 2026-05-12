<?php
declare(strict_types=1);
?><!doctype html>
<html lang="fr" data-bs-theme="light">
<head>
<meta charset="utf-8">
<title>Révolution planétaire + précession — Multi-planètes + Animation + Ticker + Presets</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<link href="assets/css/style.css" rel="stylesheet">

<script>window.PHYS = {
  G: <?= json_encode(G_SI) ?>,
  M_SUN: <?= json_encode(M_SUN) ?>,
  AU: <?= json_encode(AU_M) ?>,
  C: <?= json_encode(C_SI) ?>,
  JULIAN_YEAR: <?= json_encode(JULIAN_YEAR) ?>,
  DAY_S: <?= json_encode(DAY_S) ?>
};</script>

<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
</head>
<body class="py-4">
<div class="container" style="max-width: 1160px;">
  <h1 class="title mb-2">Période orbitale & précession (1 siècle)</h1>
  <p class="muted">Kepler III : <code>T = 2π √(a^3/μ)</code>, <code>μ = G Σ M_i</code>. Précession GR : <code>Δω = 6π GM / [a(1−e²)c²]</code>.</p>

  <!-- Barre de progression (chargement des lunes depuis JPL/Horizons) -->
  <div id="wd-progress-wrap" class="my-2">
    <div id="wd-status" class="mb-1 small text-muted">Chargement des lunes…</div>
    <div class="progress" style="height:6px">
      <div id="wd-progress" class="progress-bar" role="progressbar" style="width:0%"></div>
    </div>
  </div>
