// e33: a prototype of the fall, for docs/BRAINSTORM_the_descent_to_the_bed_v2_2026-11-19.md (section 4.4): one rigid
// body in the vertical plane (surge, heave, pitch), built from the model's own 3 m slices and the girder reader's weight
// curve. Kirchhoff's equations with strip added mass (so Munk's moment is in), cross-flow drag by slice, axial drag, the
// slender body's lift at a blunt trailing end, weight less buoyancy by slice, trapped air by Boyle. RK4, dt 0.05 s.
// A scratch experiment, not the module: every coefficient in K0 is a stated bet, to be replaced by the research note's
// (docs/research/RESEARCH_falling_hull_physics_v1_2026-11-19.md). It writes nothing.
//   node docs/research/experiments/e33_fall_prototype.js [TREE]
// TREE: a folder holding core/ (default: this repository). Output of 2026-11-19, on the committed tree a97a6bd:
// results_2026-11-19/e33_fall_prototype.txt
'use strict';
const path = require('path');
const HEAD = process.argv[2] || path.join(__dirname, '..', '..', '..');
const C = require(path.join(HEAD, 'core', 'core.js'));
const SC = require(path.join(HEAD, 'core', 'scenarios.js'));
const GI = require(path.join(HEAD, 'core', 'readers', 'girder.js'));
const DEG = Math.PI / 180, G = 9.81, NN = C.NN;
const f = (x, n) => (x === undefined || x === null || !isFinite(x) ? String(x) : x.toFixed(n === undefined ? 1 : n));
const ship = C.buildShip();
const sim = C.createSim(ship, {}, SC.PRESETS.titanic.build({ areaTitanic: SC.CALIBRATED_AREA }));
const c = ship.cols, cv = GI.weight(sim);
const sl = c.slices.slice().sort((a, b) => a.xc - b.xc);      // from the stern forward, as the girder's slices are
const zoneEnv = new Float64Array(16), zoneVmax = new Float64Array(16);
for (let n = 0; n < NN; n++) zoneVmax[n >> 2] += ship.nodeVmax[n];
const S = sl.map((s, j) => {
  let ymax = 0, zlo = 1e9, zhi = -1e9, vol = 0, mz = 0;
  for (let i = s.first; i < s.first + s.count; i++) {
    const y = Math.abs(c.y[i]) + 0.5 * c.dy; if (y > ymax) ymax = y;
    if (c.zlo[i] < zlo) zlo = c.zlo[i]; if (c.zhi[i] > zhi) zhi = c.zhi[i];
    const v = c.dxdy[i] * (c.zhi[i] - c.zlo[i]); vol += v; mz += v * 0.5 * (c.zhi[i] + c.zlo[i]);
  }
  zoneEnv[s.zone] += vol;
  return { x: s.xc, dx: s.dx, zone: s.zone, B: 2 * ymax, D: zhi - zlo, vol, zc: mz / vol, ms: cv.slice.m[j] };
});
for (const s of S) s.sol = s.vol * (1 - zoneVmax[s.zone] / zoneEnv[s.zone]);   // the model's solids: envelope less floodable

// the sea's density with depth (Fathom's core/ocean.js: its linear equation of state and its ice-edge profile)
const interp = (t, z) => { if (z <= t[0][0]) return t[0][1]; for (let i = 1; i < t.length; i++) if (z <= t[i][0]) return t[i - 1][1] + (t[i][1] - t[i - 1][1]) * (z - t[i - 1][0]) / (t[i][0] - t[i - 1][0]); return t[t.length - 1][1]; };
const TT = [[0, -1.2], [55, -1.0], [150, 0.9], [400, 1.1], [1000, 0.2], [2500, -0.4], [6000, -0.6]], SS = [[0, 32.6], [55, 33.2], [150, 34.4], [400, 34.85], [6000, 34.92]];
const rhoAt = (d) => { const z = d > 0 ? d : 0; return 1027.0 * (1 - 1.7e-4 * (interp(TT, z) - 10) + 7.6e-4 * (interp(SS, z) - 35)) + 4.5e-3 * z; };
const pAt = (d) => 101325 + 1036 * G * (d > 0 ? d : 0);

// K: the coefficients (all bets, with the range the plan gives them)
const K0 = { cdKeel: 1.0, cdDeck: 1.6, cm: 1.2, k3d: 0.85, k1: 0.05, cdNose: 0.35, cdBlunt: 1.0, cf: 0.002, lift: 1 };
function body(x0, x1, opt) {
  opt = opt || {};
  const K = Object.assign({}, K0, opt.K || {}), st = S.filter(s => s.x >= x0 && s.x < x1), rho0 = 1030;
  const air = opt.air || 0;                               // m3 of trapped air at the surface, at xAir (ship x)
  let ms = 0, msx = 0, vol = 0, sol = 0, mw = 0, mwx = 0, Amax = 0, wet = 0;
  for (const s of st) { ms += s.ms; msx += s.ms * s.x; vol += s.vol; sol += s.sol; const w = rho0 * (s.vol - s.sol); mw += w; mwx += w * s.x; const a = s.vol / s.dx; if (a > Amax) Amax = a; wet += (2 * s.D + 2 * s.B) * s.dx; }
  const m = ms + mw - rho0 * air, xg = (msx + mwx - rho0 * air * (opt.xAir || 0)) / m;
  let I = 0; for (const s of st) { const mi = s.ms + rho0 * (s.vol - s.sol); I += mi * ((s.x - xg) * (s.x - xg) + (s.D * s.D + s.dx * s.dx) / 12); }
  let A33 = 0, A35 = 0, A55 = 0;
  for (const s of st) { const a = K.cm * K.k3d * rho0 * Math.PI * 0.25 * s.B * s.B * s.dx, x = s.x - xg; A33 += a; A35 += a * x; A55 += a * x * x; }
  const xa = st[0].x - 0.5 * st[0].dx, xf = st[st.length - 1].x + 0.5 * st[st.length - 1].dx;
  // which end is blunt: its breadth at the end slice; the forward end's and the after end's sectional added mass
  const aEnd = (s) => K.cm * rho0 * Math.PI * 0.25 * s.B * s.B * Math.min(1, (s.vol / s.dx) / (0.6 * Amax));
  return {
    name: opt.name, K, st, xg, m, I, ms, sol, vol, air, xAir: opt.xAir || 0, zKG: sim.g0[2],
    M00: m + K.k1 * rho0 * vol, M11: m + A33, M12: A35, M22: I + A55, A33,
    Amax, wet, xa, xf, aA: aEnd(st[0]), aF: aEnd(st[st.length - 1]),
    bluntAft: opt.bluntAft, bluntFwd: opt.bluntFwd,
    plan: st.reduce((q, s) => q + s.B * s.dx, 0), wIn: (ms - rho0 * sol) / 1000,
  };
}
// derivative of the state y = [X, Z, th, u, w, Om]; th: the hull's own x axis above the horizontal (bow down negative)
function deriv(b, y) {
  const th = y[2], u = y[3], w = y[4], Om = y[5], K = b.K, sn = Math.sin(th), cs = Math.cos(th);
  const depth = -y[1], rho = rhoAt(depth);
  let Fx = 0, Fz = 0, tau = 0;
  // weight less buoyancy, slice by slice (the world's down in the hull's axes is (-sin th, -cos th))
  for (const s of b.st) {
    const x = s.x - b.xg, zs = b.zKG - 10.5, zb = s.zc - 10.5;
    const wS = s.ms * G, bS = rho * s.sol * G;
    Fx += -(wS - bS) * sn; Fz += -(wS - bS) * cs;
    tau += x * (-(wS - bS) * cs) - (zs * (-wS * sn) + zb * (bS * sn));
    const ws = w + Om * x, cd = ws < 0 ? K.cdKeel : K.cdDeck, d = -0.5 * rho * cd * s.B * s.dx * ws * Math.abs(ws);
    Fz += d; tau += x * d;
  }
  if (b.air > 0) {                                        // trapped air: Boyle, at the depth of the air itself
    const xr = b.xAir - b.xg, zr = 6, dAir = depth - (xr * sn + zr * cs);
    const va = b.air * 101325 / pAt(dAir), ba = rho * va * G;
    Fx += ba * sn; Fz += ba * cs; tau += xr * (ba * cs) - zr * (ba * sn);
  }
  // along her: the end's form drag and the skin's friction
  const blunt = u > 0 ? !!b.bluntFwd : !!b.bluntAft;
  Fx += -0.5 * rho * ((blunt ? K.cdBlunt : K.cdNose) * b.Amax + K.cf * b.wet) * u * Math.abs(u);
  // the slender body's lift where the flow leaves a blunt end
  if (K.lift) {
    if (u > 0 && b.aA > 0) { const x = b.xa - b.xg, L = -u * (w + Om * x) * b.aA; Fz += L; tau += x * L; }
    if (u < 0 && b.aF > 0) { const x = b.xf - b.xg, L = u * (w + Om * x) * b.aF; Fz += L; tau += x * L; }
  }
  const px = b.M00 * u, pz = b.M11 * w + b.M12 * Om;
  const r0 = Om * pz + Fx, r1 = -Om * px + Fz, r2 = w * px - u * pz + tau;
  const det = b.M11 * b.M22 - b.M12 * b.M12;
  return [u * cs - w * sn, u * sn + w * cs, Om, r0 / b.M00, (r1 * b.M22 - b.M12 * r2) / det, (b.M11 * r2 - b.M12 * r1) / det];
}
function run(b, init, opt) {
  opt = opt || {};
  const bed = opt.bed || 3784, dt = 0.05;
  let y = [0, -(init.depth || 30), (init.th || 0) * DEG, init.u || 0, init.w || 0, (init.om || 0) * DEG], t = 0, vmax = 0, next = 0;
  const rows = []; let thMin = 1e9, thMax = -1e9, flips = 0;
  const add = (a, k, h) => a.map((v, i) => v + h * k[i]);
  while (t < 3600) {
    const lowest = Math.max(Math.abs(b.xa - b.xg), Math.abs(b.xf - b.xg)) * Math.abs(Math.sin(y[2])) + 10 * Math.abs(Math.cos(y[2]));
    if (-y[1] + lowest >= bed) break;
    if (t >= next) { rows.push([t, -y[1], y[0], y[2] / DEG, y[3], y[4]]); next += opt.every || 30; }
    const k1 = deriv(b, y), k2 = deriv(b, add(y, k1, dt / 2)), k3 = deriv(b, add(y, k2, dt / 2)), k4 = deriv(b, add(y, k3, dt));
    y = y.map((v, i) => v + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])); t += dt;
    const sp = Math.hypot(y[3], y[4]); if (sp > vmax) vmax = sp;
    if (-y[1] > 600) { const d = y[2] / DEG; if (d < thMin) thMin = d; if (d > thMax) thMax = d; }
    if (Math.abs(y[2]) > Math.PI * (2 * flips + 1.5)) flips++;
  }
  const sn = Math.sin(y[2]), cs = Math.cos(y[2]), vX = y[3] * cs - y[4] * sn, vZ = y[3] * sn + y[4] * cs;
  return { t, X: y[0], depth: -y[1], th: y[2] / DEG, vX, vZ, speed: Math.hypot(vX, vZ), vmax, rows, thMin, thMax, flips };
}
const line = (nm, r) => console.log(nm.padEnd(46), 'to the bed', f(r.t / 60, 2).padStart(5), 'min | along her heading', f(r.X, 0).padStart(6), 'm | arrives', f(r.speed, 1).padStart(5), 'm/s (down', f(-r.vZ, 1) + ', along', f(r.vX, 1) + ') at', f(r.th, 0).padStart(5), 'deg | fastest', f(r.vmax, 1), 'm/s | below 600 m her angle ran', f(r.thMin, 0), 'to', f(r.thMax, 0));

module.exports = { body, run, line, GI, f, S, K0 };
if (require.main !== module) return;
const XB = GI.X_BREAK;
const whole = body(-1e9, 1e9, { name: 'whole' });
const bow = body(XB, 1e9, { name: 'bow', bluntAft: true });
const stern = body(-1e9, XB, { name: 'stern', bluntFwd: true });
console.log('== BODIES (wholly flooded; the model\'s slices and the girder\'s weights)');
for (const b of [whole, bow, stern]) {
  const vt = Math.sqrt(2 * b.wIn * 1000 * G / (1036 * b.K.cdKeel * b.plan));
  console.log(b.name.padEnd(6), 'moving mass t', f(b.m / 1000, 0), '(structure', f(b.ms / 1000, 0) + ') | weight in water t', f(b.wIn, 0), '| added mass across t', f(b.A33 / 1000, 0), '| centre of mass x', f(b.xg, 1), '| plan m2', f(b.plan, 0), '| closed-form flat fall m/s', f(vt, 2), '| largest section m2', f(b.Amax, 0));
}
// where each body's weight in water acts, against the middle of its plan (the lever that tilts a flat fall)
for (const b of [whole, bow, stern]) {
  let wn = 0, wx = 0, pa = 0, px = 0; for (const s of b.st) { const n = s.ms - 1036 * s.sol; wn += n; wx += n * s.x; pa += s.B * s.dx; px += s.B * s.dx * s.x; }
  console.log(b.name.padEnd(6), 'weight in water acts at x', f(wx / wn, 1), '; the plan\'s middle x', f(px / pa, 1), '; lever', f(wx / wn - px / pa, 1), 'm (+ = the forward end heavy)');
}
console.log('\n== CHECK: a flat release reaches the closed form');
for (const b of [bow, stern]) { const r = run(b, { depth: 40, th: 0 }, { bed: 1500 }); console.log(b.name, 'flat from rest: speed at 1,500 m', f(r.speed, 2), 'm/s, angle', f(r.th, 1), 'deg, drift', f(r.X, 0), 'm'); }

console.log('\n== THE BOW (x > ' + XB + '), wholly flooded, let go nose down');
for (const th of [-10, -20, -30, -45, -60]) line('bow, ' + (-th) + ' deg nose down, 2 m/s along her', run(bow, { depth: 30, th, u: 2 }));
console.log('  the same at 20 deg, coefficient by coefficient:');
const vary = [['cross-flow drag 0.8', { cdKeel: 0.8 }], ['cross-flow drag 1.4', { cdKeel: 1.4 }], ['no lift at the blunt end', { lift: 0 }], ['added mass across x 1.0', { cm: 1.0 }], ['added mass across x 1.5', { cm: 1.5 }], ['nose drag 0.2', { cdNose: 0.2 }], ['nose drag 0.8 (torn decks)', { cdNose: 0.8 }]];
for (const [nm, K] of vary) line('  bow 20 deg, ' + nm, run(body(XB, 1e9, { name: 'bow', bluntAft: true, K }), { depth: 30, th: -20, u: 2 }));

console.log('\n== THE STERN (x < ' + XB + '), wholly flooded (its air gone), let go with its broken end down');
for (const th of [-85, -70, -45, -20]) line('stern, broken end ' + (-th) + ' deg down', run(stern, { depth: 60, th, u: 1 }));
console.log('  with air kept (m3 at the surface, at x -90), 70 deg:');
for (const air of [2000, 6000, 11000]) line('  stern 70 deg, air ' + air + ' m3', run(body(-1e9, XB, { name: 'stern', bluntFwd: true, air, xAir: -90 }), { depth: 60, th: -70, u: 1 }));

console.log('\n== ONE PIECE (the model\'s pose at the founder flag: 69 deg by the head, sinking 1.2 m/s)');
line('whole, no air', run(whole, { depth: 65, th: -69, u: 1.2 }));
line('whole, 53,113 m3 of air aft, all kept', run(body(-1e9, 1e9, { name: 'whole', air: 53113, xAir: -70 }), { depth: 65, th: -69, u: 1.2 }));
line('whole, 20,000 m3 of air aft kept', run(body(-1e9, 1e9, { name: 'whole', air: 20000, xAir: -70 }), { depth: 65, th: -69, u: 1.2 }));

console.log('\n== THE BOW AT 20 DEG, every 30 s: t s, depth m, along m, angle deg, u m/s, w m/s');
for (const r of run(bow, { depth: 30, th: -20, u: 2 }).rows) console.log('  ', r.map((v, i) => f(v, i === 0 ? 0 : 1).padStart(8)).join(''));
console.log('\n== THE STERN AT 70 DEG, every 30 s');
for (const r of run(stern, { depth: 60, th: -70, u: 1 }).rows) console.log('  ', r.map((v, i) => f(v, i === 0 ? 0 : 1).padStart(8)).join(''));
