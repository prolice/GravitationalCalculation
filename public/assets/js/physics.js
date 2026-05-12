// Physics constants and helpers (JS side)
// S'assure que window.PHYS est disponible
if (!window.PHYS) {
  window.PHYS = {};
}
const {
  G = 6.67430e-11,
  M_SUN = 1.98847e30,
  AU = 1.495978707e11,
  C = 299792458.0,
  JULIAN_YEAR = 365.25 * 86400,
  DAY_S = 86400
} = window.PHYS;

// Helpers généraux
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function toFloat(s) {
  if (typeof s !== 'string') return Number(s) || 0;
  s = s.replace(/\u00A0/g, '').replace(/\s+/g, '').replace(',', '.');
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : 0;
}

function parseMasses(text) {
  const raw = (text || '').trim(); if (!raw) return [];
  if (raw.startsWith('[')) {
    try {
      const arr = JSON.parse(raw);
      return (Array.isArray(arr) ? arr : []).map(Number).filter(v => isFinite(v) && v > 0);
    } catch {}
  }
  return raw.split(/[,;\n]+/).map(toFloat).filter(v => isFinite(v) && v > 0);
}

function massesToKg(arr, unit) { return unit === 'kg' ? arr : arr.map(v => v * M_SUN); }
function aToMeters(a, unit) { return unit === 'm' ? a : (unit === 'km' ? a * 1e3 : (unit === 'au' ? a * AU : a)); }

// Kepler solver E (M = E − e sinE) — Newton-Raphson, convergence to 1e-12
function solveE(M, e) {
  let E = M;
  for (let i = 0; i < 10; i++) {
    const f = E - e * Math.sin(E) - M;
    const fp = 1 - e * Math.cos(E);
    const d = -f / fp;
    E += d;
    if (Math.abs(d) < 1e-12) break;
  }
  return E;
}

// Escaping HTML sans token invalide
function escHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

function fmt(v, d) { return (Number.isFinite(v) ? Number(v).toFixed(d) : '—'); }
function degNorm(x) { x = x % 360; return x < 0 ? x + 360 : x; }

// Expose (optionnel) si besoin ailleurs
window.__phys = { G, M_SUN, AU, C, JULIAN_YEAR, DAY_S, clamp, toFloat, parseMasses, massesToKg, aToMeters, solveE, escHtml, fmt, degNorm };
