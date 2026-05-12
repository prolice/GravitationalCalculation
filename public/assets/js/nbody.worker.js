
// Simple N-body leapfrog integrator with adaptive dt (worker)
let bodies = []; // {name, mass_kg, a_m, e, inc_deg, node_deg, omega_deg, M_rad}
let Mstar = 0;   // central mass (kg)
let soft_m = 0;  // softening length (m)
let simSec = 0;  // current worker time (sec)
const G = 6.67430e-11;
const AU = 1.495978707e11;

// State vectors in SI
let R = []; // meters [ [x,y,z], ... ]
let V = []; // m/s

function solveE(M,e){
  // Newton-Raphson for eccentric anomaly
  let E = M;
  for (let it=0; it<10; it++){
    const f = E - e*Math.sin(E) - M;
    const fp = 1 - e*Math.cos(E);
    const d = -f / fp;
    E += d;
    if (Math.abs(d) < 1e-12) break;
  }
  return E;
}

function elemToState(a, e, inc, node, omega, M){
  const mu = G * (Mstar);
  if (!(mu>0) || !(a>0)) return {r:[0,0,0], v:[0,0,0]};
  const E = solveE(M, e);
  const cosE = Math.cos(E), sinE = Math.sin(E);
  const sqrt1me2 = Math.sqrt(Math.max(0, 1 - e*e));
  const r = a * (1 - e*cosE);
  const cosNu = (cosE - e) / (1 - e*cosE);
  const sinNu = (sqrt1me2 * sinE) / (1 - e*cosE);
  const nu = Math.atan2(sinNu, cosNu);
  const p = a * (1 - e*e);
  // perifocal coordinates
  let x_pf = r * Math.cos(nu), y_pf = r * Math.sin(nu), z_pf = 0;
  let vx_pf = -Math.sqrt(mu/p)*Math.sin(nu);
  let vy_pf =  Math.sqrt(mu/p)*(e + Math.cos(nu));
  let vz_pf = 0;
  // rotations
  const cO = Math.cos(node), sO = Math.sin(node);
  const ci = Math.cos(inc),  si = Math.sin(inc);
  const cw = Math.cos(omega), sw = Math.sin(omega);
  // R = Rz(O)·Rx(i)·Rz(w)
  function rot(x,y,z){
    // Rz(w)
    let x1 =  cw*x - sw*y, y1 = sw*x + cw*y, z1 = z;
    // Rx(i)
    let x2 = x1, y2 = ci*y1 - si*z1, z2 = si*y1 + ci*z1;
    // Rz(O)
    let x3 =  cO*x2 - sO*y2, y3 = sO*x2 + cO*y2, z3 = z2;
    return [x3,y3,z3];
  }
  const rI = rot(x_pf, y_pf, z_pf);
  const vI = rot(vx_pf, vy_pf, vz_pf);
  return { r: rI, v: vI };
}

function initState(){
  R = []; V = [];
  for (const b of bodies){
    const inc = (b.inc_deg||0)*Math.PI/180;
    const node = (b.node_deg||0)*Math.PI/180;
    const om = (b.omega_deg||0)*Math.PI/180;
    const st = elemToState(b.a_m, b.e||0, inc, node, om, b.M_rad||0);
    R.push([st.r[0], st.r[1], st.r[2]]);
    V.push([st.v[0], st.v[1], st.v[2]]);
  }
}

function accAt(i){
  const ri = R[i];
  let ax=0, ay=0, az=0;
  // Star gravity (fixed at origin)
  const dx0 = -ri[0], dy0 = -ri[1], dz0 = -ri[2];
  let r2 = dx0*dx0 + dy0*dy0 + dz0*dz0 + soft_m*soft_m;
  let invr3 = 1/Math.pow(r2, 1.5);
  const a0 = G * Mstar * invr3;
  ax += a0 * dx0; ay += a0 * dy0; az += a0 * dz0;
  // Planet-planet interactions
  for (let j=0; j<bodies.length; j++){
    if (j===i) continue;
    const mj = bodies[j].mass_kg || 0;
    if (!(mj>0)) continue;
    const dx = R[j][0]-ri[0], dy = R[j][1]-ri[1], dz = R[j][2]-ri[2];
    r2 = dx*dx + dy*dy + dz*dz + soft_m*soft_m;
    invr3 = 1/Math.pow(r2, 1.5);
    const a = G * mj * invr3;
    ax += a*dx; ay += a*dy; az += a*dz;
  }
  return [ax,ay,az];
}

function leapfrogAdvance(dt){
  const A = R.map((_,i)=>accAt(i));
  for (let i=0;i<bodies.length;i++){
    V[i][0] += 0.5*dt*A[i][0];
    V[i][1] += 0.5*dt*A[i][1];
    V[i][2] += 0.5*dt*A[i][2];
  }
  for (let i=0;i<bodies.length;i++){
    R[i][0] += dt*V[i][0];
    R[i][1] += dt*V[i][1];
    R[i][2] += dt*V[i][2];
  }
  const A2 = R.map((_,i)=>accAt(i));
  for (let i=0;i<bodies.length;i++){
    V[i][0] += 0.5*dt*A2[i][0];
    V[i][1] += 0.5*dt*A2[i][1];
    V[i][2] += 0.5*dt*A2[i][2];
  }
}

function stepTo(targetSec){
  const dir = (targetSec >= simSec) ? 1 : -1;
  let remaining = Math.abs(targetSec - simSec);
  const dt_max = 2*86400; // 2 days
  const dt_min = 60;      // 1 minute
  while (remaining > 0){
    let amax = 0;
    for (let i=0;i<bodies.length;i++){
      const a = accAt(i); const mag = Math.hypot(a[0],a[1],a[2]);
      if (mag>amax) amax = mag;
    }
    let dt = (amax>0) ? Math.sqrt(1/amax) * 5000 : 86400; // heuristic
    dt = Math.max(dt_min, Math.min(dt_max, dt));
    if (dt > remaining) dt = remaining;
    leapfrogAdvance(dir*dt);
    simSec += dir*dt;
    remaining -= dt;
  }
}

onmessage = (e)=>{
  const msg = e.data || {};
  if (msg.type === 'init'){
    Mstar = msg.Mstar || 0;
    bodies = msg.bodies || [];
    soft_m = (msg.soft_au||0) * AU;
    simSec = 0;
    initState();
    postMessage({ type:'state', simSec, positionsAU: R.map(v=>[v[0]/AU, v[1]/AU, v[2]/AU]) });
  } else if (msg.type === 'advance'){
    const target = msg.targetSimSec || 0;
    stepTo(target);
    postMessage({ type:'state', simSec, positionsAU: R.map(v=>[v[0]/AU, v[1]/AU, v[2]/AU]) });
  } else if (msg.type === 'setsoft'){
    soft_m = (msg.soft_au||0) * AU;
  }
};
