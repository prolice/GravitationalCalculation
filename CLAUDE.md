# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Planet Orbits & Precession** is an interactive web application for simulating and analyzing planetary orbital mechanics, including relativistic precession effects. It combines classical Kepler mechanics with N-body gravitational interactions and demonstrates gravitational precession (Einstein effect).

- **Type**: PHP/JavaScript full-stack web application
- **Domain**: Astrophysics & Orbital Mechanics
- **Frontend**: HTML5 Canvas animation + Bootstrap 5 UI + Chart.js
- **Backend**: Modular PHP with REST API endpoints
- **Special Features**: Web Worker for N-body physics, JPL Horizons data integration, real-time orbital animation

## Technology Stack

- **Backend**: PHP 7.4+ with type declarations (`declare(strict_types=1)`)
- **Frontend**: Vanilla JavaScript (ES6+) with Web Workers
- **Physics**: N-body leapfrog integrator, Kepler solver (Newton-Raphson)
- **Data**: JPL Horizons API integration, local moon/planet catalogs
- **UI Framework**: Bootstrap 5.3+ (CDN), custom CSS with CSS variables
- **Charting**: Chart.js 4.4+ (CDN)
- **Caching**: File-based JSON cache (var/cache/) with TTL support

## Architecture

### High-Level Structure

```
public/                          # Document root (web-accessible)
  index.php                       # Main entry point - orchestrates templates
  api/                            # REST endpoints
    planets_jpl.php               # Fetch planetary positions from JPL Horizons
    moons_jpl.php                 # Fetch moon orbital elements
    jpl_raw.php                   # Raw data from JPL parser
    check_env.php                 # Environment/dependency diagnostics
    ping.php                       # Health check
  assets/
    js/
      app.js (1725 lines)         # Main application logic - orchestrates all UI/animation
      nbody.worker.js             # Web Worker - N-body physics engine (leapfrog integration)
      physics.js                  # Shared physics constants & helpers (Kepler solvers, coordinate transforms)
      ticker.js                   # Animation timing controller (requestAnimationFrame loop)
      presets.js                  # Planet orbital data (a, e, color)
      planets-jpl-init.js         # Initialize JPL planet data fetch
      moons-jpl-init.js           # Initialize JPL moon data fetch
      moons-ui-refresh.js         # Update UI with moon catalogs
      moons-autofill-init.js      # Auto-populate moon fields from JPL
      moons_catalog.js            # Moon preset database
      hints.js                     # Tooltip/help text initialization

    css/
      style.css                   # Main styling (light theme, cards, animations)
      ui-refactor.css             # Additional UI refinements

src/                              # Server-side logic (not web-accessible)
  bootstrap.php                   # Load constants, helpers, compute logic
  constants.php                   # Physical constants (G, M_SUN, AU, C, etc.)
  helpers.php                     # Utility functions (parsing, conversions, escaping)
  compute.php                     # Kepler orbital computation & precession calculations
  api/
    moons_jpl.php                 # JPL moon data fetcher (with curl/stream context, TLS, caching)
  templates/
    header.php                    # HTML head + navbar, includes JS constants in <script>
    planets_panel.php             # UI for central star masses & planet list
    animation_panel.php           # Canvas + animation controls + instant stats
    reference_block.php           # Reference planet calculator (demi-grand axe, eccentricity form)
    footer.php                    # Footer HTML

var/
  cache/                          # Cached API responses (JSON)
    moons_jpl_cache.json          # 24h TTL moon data cache
    jpl_planets/                  # Timestamped planet state files from Horizons
  certs/                          # CA certificates for TLS verification (optional)
```

### Key Data Flow

1. **Page Load** (index.php):
   - Bootstrap loads constants and helpers
   - Templates render HTML skeleton with form controls
   - window.PHYS object injected with physics constants (from PHP)
   - Presets.js defines planet orbital elements

2. **User Interaction**:
   - User adds planets (from presets or JPL)
   - User submits form → PHP compute.php calculates Kepler period & precession
   - Results displayed in reference block (period, precession rate table, graphs)

3. **Animation Loop**:
   - app.js initializes N-body bodies from user input
   - ticker.js drives requestAnimationFrame at 60 FPS
   - Web Worker (nbody.worker.js) receives target time → computes state → posts back positions
   - Canvas renders ellipses + points + trails + precession markers

4. **JPL Data Fetch**:
   - planets_jpl.php queries Horizons API (or caches results)
   - Returns JSON: {Mercure: [...], Vénus: [...], ...} with orbital elements (a, e, M, w)
   - Browser caches in localStorage; fallback to presets if offline

### Core Physics Modules

**Kepler Solver** (in physics.js & nbody.worker.js):
- Solves eccentric anomaly E from mean anomaly M via Newton-Raphson
- Converts orbital elements (a, e, i, Ω, ω, M) → Cartesian (x, y, z, vx, vy, vz)
- Handles 3D rotations: Rz(Ω)·Rx(i)·Rz(ω) (longitude of ascending node, inclination, argument of perihelion)

**N-Body Integration** (nbody.worker.js):
- Leapfrog integrator (velocity Verlet)
- Adaptive timestep heuristic: dt ∝ 1/√(acceleration)
- Softening parameter for numerical stability near collision
- Central star gravity + planet-planet interactions

**Precession Calculation** (compute.php):
- Relativistic GR precession: Δω = 6πGM/[a(1-e²)c²] per orbit
- Precession over 100-year century: Δω_century = Δω × (100 JULIAN_YEAR / orbital_period)
- Table output: precession angle vs. year (0–100)

### Configuration & Caching

**PHP Settings** (in API endpoints):
- `declare(strict_types=1)` enforced throughout
- Error handling: custom handlers convert errors/exceptions to JSON
- TLS verification: uses var/certs/cacert.pem if available
- Timeout: 12 seconds per HTTP request

**Cache Strategy**:
- Moon data: 24-hour TTL JSON file (moons_jpl_cache.json)
- Planet data: One JSON file per request timestamp (jpl_planets/{id}_{datetime}.json)
- Fallback: Local presets if JPL unavailable

**Environment**:
- No .env file; configuration is inline (const declarations)
- CA_BUNDLE path: var/certs/cacert.pem (optional for TLS)
- Document root: public/
- Source: src/ (not web-accessible for security)

## Deployment & Setup

### Running Locally

1. **Serve the `public/` directory** as document root:
   ```bash
   # Using PHP built-in server (development only)
   cd /path/to/GravitationalCalculation/public
   php -S localhost:8000
   ```

2. **Access** http://localhost:8000/index.php

3. **TLS/Certificates** (optional):
   - Download cacert.pem to var/certs/ if curl SSL verification fails
   - Check env: http://localhost:8000/api/check_env.php

### Building & Testing

- **No formal build process**: PHP is interpreted; JavaScript is vanilla (no bundler)
- **Linting**: No configured linter (could add PHP CodeSniffer, JSHint)
- **Testing**: Manual browser testing; unit tests not present
- **Validation**: use check_env.php API endpoint to diagnose missing extensions/permissions

### Common Development Tasks

**Adding a New Planet to Presets**:
1. Edit `public/assets/js/presets.js` → add to `window.PRESETS` object
2. Update `window.ORDER8` if needed
3. Add color to `window.COLOR_PALETTE`

**Modifying Physics Constants**:
1. Edit `src/constants.php` (G, AU, M_SUN, C, etc.)
2. Constants auto-injected into JS via header.php (window.PHYS)
3. Physics.js has local fallbacks for safety

**Integrating New JPL Data**:
1. Edit endpoints in `public/api/planets_jpl.php` or `src/api/moons_jpl.php`
2. Adjust parser if JPL format changes
3. Update cache TTL or invalidate cache manually (rm var/cache/*.json)

**Changing UI Layout/Styling**:
- CSS: `public/assets/css/style.css` (light theme with CSS variables)
- Templates: `src/templates/*.php` (Bootstrap 5 components)
- Icons/symbols: HTML entities (⏸, ⏱, ☉, etc.)

## Key Implementation Details

### French Localization

- All UI text, variable names, and comments are in French
- Planet/moon names use French convention (Mercure, Vénus, Terre, etc.)
- Mathematical notation uses subscripts/special chars (Δω, e, i, Ω)

### Avoiding Common Pitfalls

1. **Coordinate Systems**:
   - SI units internally (meters, kg, seconds, m³/s²)
   - Convert AU ↔ meters at boundaries (constants.php has AU_M = 1.495978707e11 m)
   - Perifocal coordinates (orbits) → Inertial frame via 3D rotations

2. **Numerical Stability**:
   - Leapfrog integrator is symplectic (energy-conserving)
   - Softening length prevents singularities near collision
   - Adaptive timestep ensures accuracy across wide orbital scales

3. **Physics Precision**:
   - Kepler solver uses 6 iterations (nbody.worker.js) or 10 (planets_jpl.php parser)
   - GR precession formula assumes point mass; breaks down near black holes/neutron stars
   - N-body assumes no close encounters (could improve with hierarchical methods)

4. **Cache Invalidation**:
   - Manual: delete var/cache/*.json or wait 24 hours (TTL)
   - No cache busting on code change; be aware when testing JPL API changes

### Critical Files for Understanding the Physics

1. **nbody.worker.js** → Kepler solver + leapfrog integration
2. **physics.js** → Kepler anomaly solver + coordinate transforms
3. **compute.php** → Orbital period (Kepler III) + GR precession formula
4. **app.js** (lines ~1200–1600) → Canvas rendering + orbit drawing

## Debugging & Troubleshooting

- **JPL API failures**: Check `check_env.php`, look at curl/SSL settings
- **Physics divergence**: Lower softening or adaptive dt_min (nbody.worker.js)
- **Performance**: Monitor FPS badge; reduce visible planets or disable trails
- **Cache stale**: Manually clear var/cache/ or edit TTL in moons_jpl.php
- **Missing data**: Fallback to local presets (presets.js, moons_catalog.js)

