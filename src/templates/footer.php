<?php
declare(strict_types=1);
?>
</div> <!-- /container -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

<!-- Libs / base -->
<script src="assets/js/presets.js"></script>
<script src="assets/js/physics.js"></script>
<script src="assets/js/ticker.js"></script>

<!-- (Optionnel) graines Wikidata + couleurs si tu l'utilises encore en fallback -->
<script src="assets/js/moons_catalog.js"></script>

<!-- Lunes via JPL (déjà en place chez toi) -->
<script src="assets/js/moons-jpl-init.js"></script>

<!-- Planètes via JPL (NOUVEAU) -->
<script src="assets/js/planets-jpl-init.js"></script>

<!-- Lancer l’app une fois que JPL/lunes ont répondu ou échoué -->
<script>
  // Si ces promesses n’existent pas, on les “neutralise” pour le Promise.all
  window.MOONS_READY = (window.MOONS_READY && typeof window.MOONS_READY.then === 'function') ? window.MOONS_READY : Promise.resolve();
  window.PLANET_ELEM_READY = (window.PLANET_ELEM_READY && typeof window.PLANET_ELEM_READY.then === 'function') ? window.PLANET_ELEM_READY : Promise.resolve();
</script>

<!-- App principale (utilise les deux promesses ci-dessus) -->
<script src="assets/js/app.js"></script>

<!-- En-têtes de tableaux + tooltips/popovers -->
<script src="assets/js/hints.js"></script>
<script>
  // Active tooltips / popovers pour toute la page
  document.addEventListener('DOMContentLoaded', function(){
    if (window.bootstrap) {
      const ttEls = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
      ttEls.forEach(el => new bootstrap.Tooltip(el, {html:true, sanitize:false, container:'body'}));

      const popEls = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
      popEls.forEach(el => new bootstrap.Popover(el, {html:true, sanitize:false, container:'body', trigger:'hover focus'}));
    }
  });
</script>
</body>
</html>
