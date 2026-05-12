<?php
declare(strict_types=1);
?>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

<!-- Chart.js dark theme defaults -->
<script>
if (typeof Chart !== 'undefined') {
  Chart.defaults.color           = '#5d7a9a';
  Chart.defaults.borderColor     = 'rgba(0,210,255,0.08)';
  Chart.defaults.backgroundColor = 'rgba(0,210,255,0.10)';
  Chart.defaults.font.family     = "'JetBrains Mono', monospace";
  Chart.defaults.font.size       = 11;
}
</script>

<!-- Libs / base -->
<script src="assets/js/presets.js"></script>
<script src="assets/js/physics.js"></script>
<script src="assets/js/ticker.js"></script>

<script src="assets/js/moons_catalog.js"></script>

<!-- Lunes via JPL -->
<script src="assets/js/moons-jpl-init.js"></script>

<!-- Planètes via JPL -->
<script src="assets/js/planets-jpl-init.js"></script>

<script>
  window.MOONS_READY       = (window.MOONS_READY       && typeof window.MOONS_READY.then === 'function')       ? window.MOONS_READY       : Promise.resolve();
  window.PLANET_ELEM_READY = (window.PLANET_ELEM_READY && typeof window.PLANET_ELEM_READY.then === 'function') ? window.PLANET_ELEM_READY : Promise.resolve();
</script>

<!-- App principale -->
<script src="assets/js/app.js"></script>

<!-- Tooltips & popovers -->
<script src="assets/js/hints.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', function(){
    if (window.bootstrap) {
      [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
        .forEach(el => new bootstrap.Tooltip(el, {html:true, sanitize:false, container:'body'}));
      [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
        .forEach(el => new bootstrap.Popover(el, {html:true, sanitize:false, container:'body', trigger:'hover focus'}));
    }
  });
</script>
</body>
</html>
