
// N-body leapfrog integrator with period-based adaptive dt and optional 1PN GR (worker)
let bodies = []; // {name, mass_kg, a_m, e, inc_deg, node_deg, omega_deg, M_rad}
let Mstar = 0;   // central mass (kg)
let soft_m = 0;  // softening length (m)
let simSec = 0;  // current worker time (sec)
let grEnabled = false; // 1PN GR correction toggle

const G  = 6.67430e-11;
const AU = 1.495978707e11;
const C  = 2.99792458e8;   // m/s (for 1PN correction)
const C2 = C * C;

// State vectors in SI
let R = []; // meters [ [x,y,z], ... ]
let V = []; // m/s

function solveE(M, e) {
  let E = M;
  for (let it = 0; it < 10; it++) {
    const f = E - e * Math.sin(E) - M;
    const fp = 1 - e * Math.cos(E);
    const d = -f / fp;
    E += d;
    if (Math.abs(d) < 1e-12) break;
  }
  return E;
}

// Fix 11.3: use G*(Mstar + mass_kg) for correct two-body μ
function elemToState(a, e, inc, node, omega, M, mass_kg) {
  const mu = G * (Mstar + (mass_kg || 0));
  if (!(mu > 0) || !(a > 0)) return { r: [0, 0, 0], v: [0, 0, 0] };
  const E = solveE(M, e);
  const cosE = Math.cos(E), sinE = Math.sin(E);
  const sqrt1me2 = Math.sqrt(Math.max(0, 1 - e * e));
  const r = a * (1 - e * cosE);
  const cosNu = (cosE - e) / (1 - e * cosE);
  const sinNu = (sqrt1me2 * sinE) / (1 - e * cosE);
  const nu = Math.atan2(sinNu, cosNu);
  const p = a * (1 - e * e);
  // perifocal coordinates
  const x_pf = r * Math.cos(nu), y_pf = r * Math.sin(nu);
  const vx_pf = -Math.sqrt(mu / p) * Math.sin(nu);
  const vy_pf =  Math.sqrt(mu / p) * (e + Math.cos(nu));
  // rotation: Rz(Ω)·Rx(i)·Rz(ω)
  const cO = Math.cos(node), sO = Math.sin(node);
  const ci = Math.cos(inc),  si = Math.sin(inc);
  const cw = Math.cos(omega), sw = Math.sin(omega);
  function rot(x, y, z) {
    const x1 = cw * x - sw * y, y1 = sw * x + cw * y; // Rz(ω)
    const x2 = x1, y2 = ci * y1 - si * z, z2 = si * y1 + ci * z; // Rx(i)
    return [cO * x2 - sO * y2, sO * x2 + cO * y2, z2]; // Rz(Ω)
  }
  const rI = rot(x_pf, y_pf, 0);
  const vI = rot(vx_pf, vy_pf, 0);
  return { r: rI, v: vI };
}

function initState() {
  R = []; V = [];
  for (const b of bodies) {
    const inc  = (b.inc_deg  || 0) * Math.PI / 180;
    const node = (b.node_deg || 0) * Math.PI / 180;
    const om   = (b.omega_deg || 0) * Math.PI / 180;
    const st   = elemToState(b.a_m, b.e || 0, inc, node, om, b.M_rad || 0, b.mass_kg || 0);
    R.push([st.r[0], st.r[1], st.r[2]]);
    V.push([st.v[0], st.v[1], st.v[2]]);
  }
}

// Fix 11.1: includes optional 1PN GR correction (Schwarzschild, EIH)
function accAt(i) {
  const ri = R[i];
  const vi = V[i];
  let ax = 0, ay = 0, az = 0;

  // Newtonian: star gravity (star fixed at origin, softened)
  const dx0 = -ri[0], dy0 = -ri[1], dz0 = -ri[2];
  const r2s = dx0 * dx0 + dy0 * dy0 + dz0 * dz0 + soft_m * soft_m;
  const invr3 = 1 / Math.pow(r2s, 1.5);
  const a0 = G * Mstar * invr3;
  ax += a0 * dx0; ay += a0 * dy0; az += a0 * dz0;

  // 1PN GR correction: a_GR = (μ/c²r³)·[(4μ/r − v²)r + 4(r·v)v]
  if (grEnabled && Mstar > 0) {
    const r2 = ri[0] * ri[0] + ri[1] * ri[1] + ri[2] * ri[2];
    if (r2 > 0) {
      const r_gr = Math.sqrt(r2);
      const v2   = vi[0] * vi[0] + vi[1] * vi[1] + vi[2] * vi[2];
      const mu_s = G * Mstar;
      const rdv  = ri[0] * vi[0] + ri[1] * vi[1] + ri[2] * vi[2];
      const cf   = mu_s / (C2 * r2 * r_gr);
      const term = 4 * mu_s / r_gr - v2;
      ax += cf * (term * ri[0] + 4 * rdv * vi[0]);
      ay += cf * (term * ri[1] + 4 * rdv * vi[1]);
      az += cf * (term * ri[2] + 4 * rdv * vi[2]);
    }
  }

  // Newtonian: planet-planet interactions (softened)
  for (let j = 0; j < bodies.length; j++) {
    if (j === i) continue;
    const mj = bodies[j].mass_kg || 0;
    if (!(mj > 0)) continue;
    const dx = R[j][0] - ri[0], dy = R[j][1] - ri[1], dz = R[j][2] - ri[2];
    const r2p = dx * dx + dy * dy + dz * dz + soft_m * soft_m;
    const inv3 = 1 / Math.pow(r2p, 1.5);
    const ap = G * mj * inv3;
    ax += ap * dx; ay += ap * dy; az += ap * dz;
  }
  return [ax, ay, az];
}

function leapfrogAdvance(dt) {
  const A = R.map((_, i) => accAt(i));
  for (let i = 0; i < bodies.length; i++) {
    V[i][0] += 0.5 * dt * A[i][0];
    V[i][1] += 0.5 * dt * A[i][1];
    V[i][2] += 0.5 * dt * A[i][2];
  }
  for (let i = 0; i < bodies.length; i++) {
    R[i][0] += dt * V[i][0];
    R[i][1] += dt * V[i][1];
    R[i][2] += dt * V[i][2];
  }
  const A2 = R.map((_, i) => accAt(i));
  for (let i = 0; i < bodies.length; i++) {
    V[i][0] += 0.5 * dt * A2[i][0];
    V[i][1] += 0.5 * dt * A2[i][1];
    V[i][2] += 0.5 * dt * A2[i][2];
  }
}

// Fix BUG 4: period-based timestep (T_min / 200) replaces dimensionally wrong heuristic
function computeDtBase() {
  const dt_max = 2 * 86400;
  const dt_min = 60;
  if (bodies.length === 0 || !(Mstar > 0)) return dt_max;
  let T_min = Infinity;
  for (const b of bodies) {
    if (b.a_m > 0) {
      const T = 2 * Math.PI * Math.sqrt((b.a_m ** 3) / (G * Mstar));
      if (T < T_min) T_min = T;
    }
  }
  const dt = isFinite(T_min) ? T_min / 200 : dt_max;
  return Math.max(dt_min, Math.min(dt_max, dt));
}

function stepTo(targetSec) {
  const dir = (targetSec >= simSec) ? 1 : -1;
  let remaining = Math.abs(targetSec - simSec);
  const dt_base = computeDtBase();
  while (remaining > 0) {
    let dt = dt_base;
    if (dt > remaining) dt = remaining;
    leapfrogAdvance(dir * dt);
    simSec += dir * dt;
    remaining -= dt;
  }
}

function postState() {
  postMessage({
    type: 'state',
    simSec,
    positionsAU:   R.map(v => [v[0] / AU, v[1] / AU, v[2] / AU]),
    velocitiesMps: V.map(v => [v[0], v[1], v[2]]),
  });
}

onmessage = (e) => {
  const msg = e.data || {};
  if (msg.type === 'init') {
    Mstar     = msg.Mstar    || 0;
    bodies    = msg.bodies   || [];
    soft_m    = (msg.soft_au || 0) * AU;
    grEnabled = !!msg.gr;
    simSec    = 0;
    initState();
    postState();
  } else if (msg.type === 'advance') {
    stepTo(msg.targetSimSec || 0);
    postState();
  } else if (msg.type === 'setsoft') {
    soft_m = (msg.soft_au || 0) * AU;
  } else if (msg.type === 'setgr') {
    grEnabled = !!msg.enabled;
  }
};
