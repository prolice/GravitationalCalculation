# UI Refactor Plan — "Deep Space Observatory"

## Vision

Replace the current light-mode Bootstrap scaffold with a **dark space-control-room aesthetic**: deep void backgrounds, glass-morphism panels, monospace data readouts, and neon-glow accents derived from the orbital color palette. The canvas becomes a true star field. Controls feel like a mission-control terminal rather than a web form.

---

## 1. Design System (new `style.css`)

### Color tokens

```css
:root {
  /* Backgrounds */
  --space-void:    #050a14;   /* page background */
  --nebula-1:      #0a1628;   /* deepest panel */
  --nebula-2:      #0e1f3a;   /* card surface */
  --nebula-3:      #14294d;   /* card hover / raised */
  --panel-glass:   rgba(8, 20, 40, 0.82);

  /* Accents */
  --neon-cyan:     #00d2ff;   /* primary actions, active states */
  --neon-amber:    #ffb347;   /* warnings, perihelion markers */
  --neon-violet:   #a78bfa;   /* secondary accent, precession arc */
  --neon-green:    #34d399;   /* success, confirmed sync */

  /* Text */
  --text-primary:  #e2eaf5;
  --text-muted:    #5d7a9a;
  --text-data:     #a0c4e8;   /* numeric readouts */

  /* Grid / borders */
  --grid-line:     rgba(0, 210, 255, 0.06);
  --border-dim:    rgba(0, 210, 255, 0.14);
  --border-glow:   rgba(0, 210, 255, 0.45);

  /* Glow radii (box-shadow shorthand values) */
  --glow-sm:  0 0 8px  rgba(0,210,255,.35);
  --glow-md:  0 0 20px rgba(0,210,255,.25);
  --glow-lg:  0 0 40px rgba(0,210,255,.15);
}
```

### Typography

Add a single Google Fonts import for monospace data text (one request, two faces):

```html
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
```

- **UI labels / headings**: `system-ui, -apple-system, Segoe UI` (unchanged CDN-free)
- **All numeric values, badges, table cells with data**: `'JetBrains Mono', monospace`
- **Page title**: 2rem, `letter-spacing: .15em`, `text-transform: uppercase`

---

## 2. Layout Restructure

**Current**: single-column stack of cards.

**New**: two-column split on ≥ lg; left sidebar + right main area.

```
┌──────────────────────────────────────────────────────────────────┐
│  NAVBAR  — title + JPL sync status + FPS/JD badges              │
├──────────────────────┬───────────────────────────────────────────┤
│  SIDEBAR  (360 px)   │  MAIN PANEL                               │
│                      │                                           │
│  ☉ Étoile(s)         │  ┌─────── CANVAS (star field) ──────────┐ │
│  ─────────────────   │  │  orbit animation — fills the area    │ │
│  Planètes (list)     │  │  dark background + star dots          │ │
│    ○ Mercure         │  │  neon orbit trails                    │ │
│    ○ Vénus           │  └──────────────────────────────────────┘ │
│    ○ Terre           │                                           │
│    …                 │  TOOLBAR STRIP (below canvas)             │
│  [+ Ajouter]         │  ▶/⏸  Speed ──●── | Trail | Précession   │
│  ─────────────────   │  Date ref ________ [Maintenant][Sync]     │
│  Physique            │                                           │
│  N-corps / ε / 3D    │  TABS  ──────────────────────────────     │
│  ─────────────────   │  [Stats globales] [Stats inst.] [Réf.]   │
│  Événements          │                                           │
│  Courbes temporelles │  active tab content (table or chart)      │
│                      │                                           │
└──────────────────────┴───────────────────────────────────────────┘
```

**On < lg**: sidebar becomes a Bootstrap offcanvas drawer triggered by a hamburger button in the navbar. Main area is full-width.

### Key layout rules

- Sidebar: `position: sticky; top: 0; height: 100dvh; overflow-y: auto; width: 360px`
- Canvas: `height: clamp(480px, 70dvh, 1000px)` — same logic, new dark background
- Tabs replace the current card stack below the canvas (Stats globales / Stats instantanées / Planète de référence) → one tab bar, three panes

---

## 3. Canvas — Star Field & Visual Upgrade

### Background (CSS)

```css
#orbitCanvas {
  background:
    radial-gradient(ellipse 120% 80% at 50% 50%,
      rgba(14, 31, 58, 0.9),
      var(--space-void) 70%);
}
```

### Star field (JS — `app.js`, draw phase)

Generate once on `initCanvas()`: ~300 points at random positions, radius 0.4–1.2 px, opacity 0.2–0.9, color `#c8d8f0`. Draw before planets each frame (or pre-render to an offscreen `OffscreenCanvas` and blit — no per-frame cost).

```js
// Pseudo-code addition to app.js
function buildStarField(w, h, n = 300) {
  return Array.from({length: n}, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: 0.4 + Math.random() * 0.9,
    a: 0.2 + Math.random() * 0.75,
  }));
}
```

### Orbit trails

Change `ctx.strokeStyle` for trails to use the planet color at 55% opacity with a 1.5 px `shadowBlur` matching the planet color — gives a soft neon glow without a full filter.

### Central star

Draw a two-layer radial gradient circle:
1. Solid white-yellow core (r ≈ 10 px)
2. Soft corona gradient to transparent (r ≈ 30 px, amber/gold tones)

Add a 2 s CSS `animation: starPulse` on a `<div>` overlay positioned at canvas center for a slow brightness oscillation — purely cosmetic.

### Grid overlay (optional, toggleable)

Faint polar grid lines (every 1 AU) in `--grid-line` color, drawn as part of the canvas render before star field. Toggled by a new checkbox "Grille AU".

---

## 4. Panel & Card Redesign

Replace all Bootstrap `.card` usages with the following pattern:

```css
.gc-panel {
  background: var(--panel-glass);
  border: 1px solid var(--border-dim);
  border-radius: 16px;
  backdrop-filter: blur(12px) saturate(140%);
  box-shadow: 0 8px 32px rgba(0,0,0,.45), var(--glow-lg);
}
.gc-panel:hover {
  border-color: var(--border-glow);
  box-shadow: 0 8px 32px rgba(0,0,0,.55), var(--glow-md);
  transition: border-color .25s, box-shadow .25s;
}
```

### Sidebar planet rows

Each planet row becomes a compact horizontal strip with:
- Colored circle (the orbit color) — 10 px dot
- Planet name in `--text-primary`
- Inline `a` and `e` inputs (40 px wide each) in a small monospace style
- Eye icon to toggle visibility (replaces the checkbox)
- Drag handle icon (future: reorder)
- No outer dashed border — subtle `border-bottom: 1px solid var(--grid-line)` separator

### Section headers in sidebar

Replace `<h5>` with a small all-caps label with a colored left-border accent:

```css
.gc-section-header {
  font-size: .7rem;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--text-muted);
  border-left: 2px solid var(--neon-cyan);
  padding-left: .6rem;
  margin: 1.25rem 0 .6rem;
}
```

---

## 5. Navbar

Replace the current `<h1>` + paragraph header with a sticky top navbar:

```html
<nav class="gc-navbar">
  <button id="btnSidebar" class="d-lg-none gc-icon-btn">☰</button>
  <span class="gc-title">ORBITES &amp; PRÉCESSION</span>
  <span class="gc-subtitle">Kepler III · Schwarzschild GR</span>
  <div class="gc-navbar-right">
    <!-- status badges moved here from toolbar -->
    <span class="gc-badge" id="simTimeLabel">t = 0 an</span>
    <span class="gc-badge" id="jdLabel">JD —</span>
    <span class="gc-badge" id="fpsLabel">— FPS</span>
    <div id="wd-progress-wrap">…</div>
  </div>
</nav>
```

```css
.gc-navbar {
  position: sticky; top: 0; z-index: 100;
  display: flex; align-items: center; gap: 1rem;
  padding: .6rem 1.25rem;
  background: rgba(5, 10, 20, 0.92);
  border-bottom: 1px solid var(--border-dim);
  backdrop-filter: blur(16px);
}
.gc-title {
  font-size: 1rem; letter-spacing: .2em; font-weight: 700;
  color: var(--neon-cyan); text-shadow: var(--glow-sm);
}
.gc-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: .75rem; padding: .2rem .55rem;
  background: var(--nebula-1); border: 1px solid var(--border-dim);
  border-radius: 6px; color: var(--text-data);
}
```

---

## 6. Toolbar Strip (below canvas)

Consolidate all playback controls into a single dark strip:

```css
.gc-toolbar {
  display: flex; flex-wrap: wrap; align-items: center; gap: .75rem;
  padding: .6rem 1rem;
  background: var(--nebula-1);
  border: 1px solid var(--border-dim);
  border-top: none; border-radius: 0 0 14px 14px;
}
```

- Play/Pause button: pill shape, background `var(--neon-cyan)`, text `var(--space-void)` — stands out
- Speed slider: custom styled with cyan thumb, dark track
- Step / Reset: ghost buttons, `border: 1px solid var(--border-dim)`, cyan hover
- Checkboxes (Trail, Précession, Grille AU): replaced with small toggle pills

---

## 7. Data Tables

```css
.gc-table {
  font-family: 'JetBrains Mono', monospace;
  font-size: .78rem;
  color: var(--text-data);
  --bs-table-bg: transparent;
  --bs-table-striped-bg: rgba(0, 210, 255, 0.03);
}
.gc-table thead th {
  color: var(--text-muted);
  font-size: .65rem; letter-spacing: .08em; text-transform: uppercase;
  border-bottom: 1px solid var(--border-dim);
  background: transparent;
}
.gc-table td, .gc-table th { border-color: var(--grid-line); }
```

Risk percentage cells: color-coded via inline `style` from JS — green → amber → red as percentage rises, matching the existing JS population of `<td>` content.

---

## 8. Buttons & Inputs

```css
/* Primary CTA */
.gc-btn-primary {
  background: var(--neon-cyan); color: var(--space-void);
  border: 0; border-radius: 8px; font-weight: 700;
  box-shadow: 0 0 12px rgba(0,210,255,.4);
  transition: box-shadow .2s;
}
.gc-btn-primary:hover { box-shadow: 0 0 20px rgba(0,210,255,.65); }

/* Ghost */
.gc-btn-ghost {
  background: transparent; color: var(--text-muted);
  border: 1px solid var(--border-dim); border-radius: 8px;
}
.gc-btn-ghost:hover {
  border-color: var(--neon-cyan); color: var(--neon-cyan);
}

/* Inputs */
.gc-input {
  background: var(--nebula-1); color: var(--text-primary);
  border: 1px solid var(--border-dim); border-radius: 8px;
  font-family: 'JetBrains Mono', monospace;
}
.gc-input:focus {
  border-color: var(--neon-cyan);
  box-shadow: 0 0 0 3px rgba(0,210,255,.18); outline: none;
}
```

---

## 9. Charts (Chart.js)

Update the shared Chart.js defaults once at page load (in `footer.php` or a new `chart-theme.js`):

```js
Chart.defaults.color = '#5d7a9a';
Chart.defaults.borderColor = 'rgba(0,210,255,0.08)';
Chart.defaults.backgroundColor = 'rgba(0,210,255,0.10)';
Chart.defaults.font.family = "'JetBrains Mono', monospace";
Chart.defaults.font.size = 11;
```

Individual dataset `borderColor` stays planet-specific. Grid lines become `--grid-line`.

---

## 10. Progress Bar & Loading State

Replace the current plain blue Bootstrap progress bar with a neon scanner line:

```css
#wd-progress { background: var(--neon-cyan); box-shadow: var(--glow-sm); }
.progress { background: var(--nebula-1); border-radius: 0; height: 2px; }
#wd-status { font-family: 'JetBrains Mono', monospace; font-size: .72rem; color: var(--neon-cyan); }
```

---

## Implementation Order

| Step | Scope | Files touched |
|------|-------|---------------|
| 1 | New CSS variables + dark body + fonts | `style.css`, `header.php` |
| 2 | Navbar component | `header.php`, `style.css` |
| 3 | Sidebar layout + offcanvas wiring | `index.php`, `planets_panel.php`, `ui-refactor.css` |
| 4 | Canvas dark background + star field | `style.css`, `app.js` |
| 5 | Panel/card class swap (`card` → `gc-panel`) | All `templates/*.php` |
| 6 | Toolbar strip (below canvas) | `animation_panel.php`, `style.css` |
| 7 | Tab bar (Stats globales / Instantanées / Réf.) | `animation_panel.php`, `planets_panel.php`, `reference_block.php` |
| 8 | Button + input class swap | All templates |
| 9 | Table styles + monospace data | `style.css`, no JS changes |
| 10 | Chart.js theme defaults | `footer.php` or new `chart-theme.js` |
| 11 | Central star glow + orbit trail glow | `app.js` |
| 12 | Cleanup: remove `ui-refactor.css`, merge into `style.css` | — |

Each step is independently shippable. Steps 1–4 produce a visible transformation; steps 5–12 refine details.

---

## What Does NOT Change

- All PHP business logic (`compute.php`, `constants.php`, helpers, API endpoints)
- All JS physics (`nbody.worker.js`, `physics.js`, `ticker.js`)
- All `id=` and `name=` attributes on form elements (JS hooks into these)
- Bootstrap 5 CDN inclusion (still used for offcanvas, tooltips, grid system)
- French copy throughout
