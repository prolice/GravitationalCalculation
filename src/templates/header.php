<?php
declare(strict_types=1);
?><!doctype html>
<html lang="fr" data-bs-theme="dark">
<head>
<meta charset="utf-8">
<title>Orbites & Précession — Kepler III · Schwarzschild GR</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<link href="assets/css/style.css" rel="stylesheet">

<!-- Apply saved theme before first paint to avoid flash -->
<script>
(function(){
  var t = localStorage.getItem('gc-theme') || 'dark';
  document.documentElement.setAttribute('data-bs-theme', t);
})();
</script>

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
<body>

<nav class="gc-navbar">
  <button id="btnSidebar" class="gc-icon-btn d-lg-none" type="button"
          data-bs-toggle="offcanvas" data-bs-target="#sidebarControls"
          aria-controls="sidebarControls">☰</button>
  <span class="gc-title">ORBITES &amp; PRÉCESSION</span>
  <span class="gc-subtitle d-none d-sm-inline">Kepler III · Schwarzschild GR</span>
  <div class="gc-navbar-right">
    <span class="gc-badge" id="simTimeLabel">t = 0 an</span>
    <span class="gc-badge" id="jdLabel">JD —</span>
    <span class="gc-badge" id="fpsLabel">— FPS</span>
    <span class="gc-badge d-none d-md-inline" id="dateLabel">—</span>
    <div id="wd-progress-wrap" class="d-flex flex-column align-items-end" style="min-width:120px">
      <div id="wd-status" class="mb-1">Chargement des lunes…</div>
      <div class="progress w-100" style="height:2px">
        <div id="wd-progress" class="progress-bar" role="progressbar" style="width:0%"></div>
      </div>
    </div>
    <button id="btnThemeToggle" class="gc-icon-btn" title="Basculer thème clair / sombre" aria-label="Basculer thème">
      <span id="themeIcon">☀</span>
    </button>
  </div>
</nav>

<script>
(function(){
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    var icon = document.getElementById('themeIcon');
    if (icon) icon.textContent = (theme === 'dark') ? '☀' : '☾';
    localStorage.setItem('gc-theme', theme);
    window.dispatchEvent(new CustomEvent('gc-theme-change', { detail: { theme: theme } }));
  }

  // Sync icon with current theme (already applied before paint)
  var current = document.documentElement.getAttribute('data-bs-theme') || 'dark';
  var icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = (current === 'dark') ? '☀' : '☾';

  document.getElementById('btnThemeToggle').addEventListener('click', function() {
    var now = document.documentElement.getAttribute('data-bs-theme') || 'dark';
    applyTheme(now === 'dark' ? 'light' : 'dark');
  });
})();
</script>
