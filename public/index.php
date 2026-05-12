<?php
declare(strict_types=1);
require __DIR__.'/../src/bootstrap.php';
require __DIR__.'/../src/templates/header.php';
?>
<div class="gc-layout">

  <!-- Sidebar: offcanvas on mobile, sticky on ≥ lg -->
  <aside id="sidebarControls"
         class="offcanvas offcanvas-start offcanvas-lg gc-sidebar"
         tabindex="-1" data-bs-scroll="true">
    <div class="offcanvas-header d-lg-none">
      <h5 class="offcanvas-title">Contrôles</h5>
      <button type="button" class="btn-close" data-bs-dismiss="offcanvas"
              data-bs-target="#sidebarControls" aria-label="Fermer"></button>
    </div>
    <div class="offcanvas-body gc-sidebar-body">
      <?php require __DIR__.'/../src/templates/planets_panel.php'; ?>
    </div>
  </aside>

  <!-- Main content area -->
  <main class="gc-main">
    <?php require __DIR__.'/../src/templates/animation_panel.php'; ?>
  </main>

</div><!-- /.gc-layout -->
<?php require __DIR__.'/../src/templates/footer.php'; ?>
