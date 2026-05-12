# Planet Orbits & Precession (Modular PHP)

## Structure
```
public/
  index.php
  assets/
    css/style.css
    js/presets.js
    js/physics.js
    js/ticker.js
    js/app.js
src/
  bootstrap.php
  constants.php
  helpers.php
  compute.php
  templates/
    header.php
    planets_panel.php
    animation_panel.php
    reference_block.php
    footer.php
```

## Usage
- Place the `public/` folder on a PHP server (or serve as document root).
- Open `public/index.php` in a browser.
- The animation, stats (global & instant) and the reference calculations should work as in the monolithic version.

> CDN is used for Bootstrap & Chart.js.
