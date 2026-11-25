// E3: the iceberg encounter, end to end. Sail the ship at an iceberg, steer, and let the CONTACT make the damage;
// then hand the generated openings to the unmodified flooding core and let it sink her (or not).
//
// What this is: a feasibility prototype for the brainstorm (v1.1). The ship is the 3-degree-of-freedom model of
// e2_mmg.js in its "unified" form (Yoshimura, Nakao and Ishibashi 2009: no division by speed, cross-flow drag by
// strips), with two numbers fitted here to the trial record (the rudder's inflow and the cross-flow drag level).
// The iceberg is a fixed circle at the depth of the 1912 damage. Contact is a penalty force that grows with the
// overlap between the hull's own waterline at that depth (the core's halfBreadth) and the ice. Damage is the
// deepest overlap each metre of hull saw, turned into opening area by one constant, which is calibrated so that the
// 1912 encounter totals the core's calibrated 0.7506 m2.
//
// What this is not: a validated collision model. The ice stiffness, the spur's radius and the damage constant are
// bets; the point is to see whether "organic" damage comes out looking like the reconstructed damage at all.
//
// Frame: MMG's (x forward, y to STARBOARD, yaw and rudder positive to starboard); the world is north-east with the
// ship starting at the origin heading north. "Hard-a-starboard" in 1912 words is a turn to PORT: rudder -40 deg here.
// Usage: node e3_encounter.js <repo root> [out dir for JSON]
const fs = require('fs');
const path = require('path');
const root = process.argv[2], outDir = process.argv[3] || null;
const C = require(path.join(root, 'core', 'core.js'));
const SC = require(path.join(root, 'core', 'scenarios.js'));
const rho = 1025, KN = 1852 / 3600, DEG = Math.PI / 180;

// ------------------------------------------------------------------ the ship
const S = { L: 259.08, B: 28.19, d: 9.83, m: 49.02e6, xG: -3.2 };
S.CB = S.m / rho / (S.L * S.B * S.d);
const k = 2 * S.d / S.L, cbl = S.CB * S.B / S.L;
const MU = 0.5 * rho * S.L * S.L * S.d;
const mp = S.m / MU, mxp = 0.04 * mp;
const myp = Math.PI * (S.d / S.L) * (S.d / S.L) * (1 + 0.16 * S.CB * S.B / S.d - 5.1 * (S.B / S.L) * (S.B / S.L)) * (S.L / S.d);
const Jzp = Math.PI * (S.d / S.L) * (S.d / S.L) * (1 / 12 + 0.017 * S.CB * S.B / S.d - 0.33 * S.B / S.L) * (S.L / S.d);
const Izp = mp * 0.0625;
const Yv = -(0.5 * Math.PI * k + 1.4 * cbl), YR = 0.5 * cbl + mxp, Nv = -k, NR = -0.54 * k + k * k, Xvr = (2.86 * cbl - 0.21) - myp;
const CD0 = -0.0591 * (S.L / S.d) + 1.848, CrY = 0.520 * (S.L / S.B) - 1.062, CrN = 0.0742 * (S.L / S.d) - 0.297;
const U_FULL = 22.5 * KN, cR = 13231, tP = 0.15;                       // hull drag constant from Biles's 165 tons at 21 kn
const wing = { D: 7.1628, w: 0.15, J0: 1.48, n0: 75 / 60, share: 15 / 46 };
const cen = { D: 5.1816, w: 0.30, J0: 0.95, n0: 165 / 60, share: 16 / 46 };
for (const p of [wing, cen]) {
  const J = U_FULL * (1 - p.w) / (p.n0 * p.D), T = p.share * cR * U_FULL * U_FULL / (1 - tP);
  p.a = T / (rho * p.n0 * p.n0 * Math.pow(p.D, 4)) / (1 - J / p.J0);
  p.A = Math.PI * p.D * p.D / 4;
}
const screw = (p, n, u, w) => (n > 0 ? rho * Math.pow(p.D, 4) * p.a * (n * n - n * u * (1 - w) / (p.D * p.J0)) : -0.5 * rho * 0.5 * p.A * u * (1 - w) * Math.abs(u * (1 - w)));
const AR = 37.31, HR = 9.5, lam = HR * HR / AR, fa = 6.13 * lam / (lam + 2.25);
const tR = 1 - (0.28 * S.CB + 0.55), aH = 0.25, xH = -0.45 * S.L, xR = -0.5 * S.L, kap = 0.5, gamR = 0.5, lR = -0.9, xPp = -0.48, eta = cen.D / HR;
const M11 = S.m + myp * MU, M12 = S.xG * S.m, M22 = (Izp + Jzp) * MU * S.L * S.L + S.xG * S.xG * S.m, DET = M11 * M22 - M12 * M12, MX = S.m + mxp * MU;
const ZERO = { X: 0, Y: 0, N: 0, F: 0 };

function init(kn) {
  const f = kn / 22.5;
  return { t: 0, u: kn * KN, v: 0, r: 0, psi: 0, X: 0, Y: 0, del: 0, delCmd: 0, nW: wing.n0 * f, nC: cen.n0 * f, ay: 0, dr: 0, dv: 0 };
}
function stepShip(s, P, dt, ext) {
  const L = S.L, d = S.d, rate = P.rate * DEG;
  s.del += Math.max(-rate * dt, Math.min(rate * dt, s.delCmd - s.del));
  const u = s.u, v = s.v, r = s.r, U = Math.sqrt(u * u + v * v);
  let sy = 0, sn = 0; const NS = 40, dx = L / NS, CD = CD0 * P.cd;
  for (let i = 0; i < NS; i++) { const x = -L / 2 + (i + 0.5) * dx, a = v + CrY * r * x, b = v + CrN * r * x; sy += Math.abs(a) * a * dx; sn += Math.abs(b) * b * x * dx; }
  const YH = 0.5 * rho * L * d * (Yv * v * Math.abs(u) + YR * L * r * u) - 0.5 * rho * d * CD * sy;
  const NH = 0.5 * rho * L * L * d * (Nv * v * u + NR * L * r * Math.abs(u)) - 0.5 * rho * d * CD * sn;
  const XH = -cR * u * Math.abs(u) + 0.5 * rho * L * d * Xvr * v * r * L;
  const beta = Math.atan2(-v, u), rp = U > 0.1 ? r * L / U : 0, betaP = beta - xPp * rp, wC = cen.w * Math.exp(-4 * betaP * betaP);
  const TW = screw(wing, s.nW, u, wing.w), TC = screw(cen, s.nC, u, wC);
  const XP = (1 - tP) * (2 * TW + TC);
  const VA = u * (1 - wC), uinf = Math.sqrt(Math.max(0, VA * VA + 8 * TC / (rho * Math.PI * cen.D * cen.D)));   // no 1/n: finite when the screw stops
  const uR = P.uRk * Math.sqrt(eta * (VA + kap * (uinf - VA)) * (VA + kap * (uinf - VA)) + (1 - eta) * VA * VA);
  const vR = U * gamR * (beta - lR * rp), UR2 = uR * uR + vR * vR, UR = Math.sqrt(UR2);
  let CN = UR > 1e-6 ? fa * (Math.sin(s.del) * uR - Math.cos(s.del) * vR) / UR : 0;    // f_alpha sin(alpha_R), no atan2
  CN = Math.max(-1.3, Math.min(1.3, CN));
  const FN = 0.5 * rho * AR * UR2 * CN;
  const Xt = XH + XP - (1 - tR) * FN * Math.sin(s.del) + ext.X;
  const Yt = YH - (1 + aH) * FN * Math.cos(s.del) + ext.Y;
  const Nt = NH - (xR + aH * xH) * FN * Math.cos(s.del) + ext.N;
  const du = (Xt + (S.m + myp * MU) * v * r + S.xG * S.m * r * r) / MX;
  const bY = Yt - MX * u * r, bN = Nt - S.xG * S.m * u * r;
  const dv = (bY * M22 - M12 * bN) / DET, dr = (M11 * bN - M12 * bY) / DET;
  s.u += du * dt; s.v += dv * dt; s.r += dr * dt;                       // velocities first ...
  s.psi += s.r * dt;                                                    // ... then positions from the new velocities
  s.X += (s.u * Math.cos(s.psi) - s.v * Math.sin(s.psi)) * dt; s.Y += (s.u * Math.sin(s.psi) + s.v * Math.cos(s.psi)) * dt;
  s.t += dt; s.dv = dv; s.dr = dr; s.ay = dv + u * r;
}

// ------------------------------------------------------------------ the trials, and a two-number fit
function turnTrial(P, kn, deltaDeg, opt) {
  opt = opt || {};
  const s = init(kn); s.delCmd = deltaDeg * DEG; if (opt.centreStopped) s.nC = 0;
  const o = { t225: null, adv: null, trans: null, tact: null };
  while (s.t < 1500) {
    stepShip(s, P, 0.25, ZERO);
    const a = Math.abs(s.psi) / DEG;
    if (o.t225 === null && a >= 22.5) { o.t225 = s.t; o.x225 = s.X; }
    if (o.adv === null && a >= 90) { o.adv = s.X; o.trans = Math.abs(s.Y); }
    if (o.tact === null && a >= 180) o.tact = Math.abs(s.Y);
    if (a >= 540) break;
  }
  const U = Math.sqrt(s.u * s.u + s.v * s.v);
  o.ratio = U / (kn * KN); o.rate = Math.abs(s.r) / DEG; o.drift = Math.atan2(-s.v, s.u) / DEG * Math.sign(deltaDeg);
  o.heel = U * Math.abs(s.r) * (10.80 - S.d / 2) / (9.81 * 0.80) / DEG;
  return o;
}
function fit(rate) {
  let best = null;
  for (let uRk = 1.0; uRk <= 2.001; uRk += 0.05) for (let cd = 0.4; cd <= 4.001; cd += 0.1) {
    const P = { uRk, cd, rate };
    const a = turnTrial(P, 21.5, 40), b = turnTrial(P, 20, 40);
    if (a.t225 === null || b.tact === null) continue;
    const e = Math.pow((a.t225 - 37) / 37, 2) + Math.pow((b.tact - 1173.48) / 1173.48, 2);
    if (!best || e < best.e) best = { e, P, a, b };
  }
  return best;
}

// ------------------------------------------------------------------ the iceberg and the contact
function hullStations(zs) {                       // the hull's own waterline at the spur's height, every metre, bow to stern
  const xs = [], hb = [];
  for (let x = Math.floor(C.xFwd(zs)); x >= C.G.xAP; x -= 1) { const h = C.halfBreadth(x, zs); if (h > 0.02) { xs.push(x); hb.push(h); } }
  return { xs, hb, n: xs.length, stem: C.xFwd(zs) };
}
function newRec(n) {
  const side = () => ({ pen: new Float64Array(n), t0: new Float64Array(n).fill(-1) });
  return { stbd: side(), port: side(), tFirst: -1, tLast: -1, Fmax: 0, minGap: 1e9, headOn: false };
}
function contact(s, berg, st, rec) {
  let Fx = 0, Fy = 0, N = 0; const c = Math.cos(s.psi), sn = Math.sin(s.psi);
  for (let sd = 0; sd < 2; sd++) {
    const sg = sd === 0 ? 1 : -1, R = sd === 0 ? rec.stbd : rec.port;
    for (let i = 0; i < st.n; i++) {
      const x = st.xs[i], y = sg * st.hb[i];
      const Xw = s.X + x * c - y * sn, Yw = s.Y + x * sn + y * c;
      const ex = Xw - berg.X, ey = Yw - berg.Y, dist = Math.sqrt(ex * ex + ey * ey), pen = berg.R - dist;
      if (-pen < rec.minGap) rec.minGap = -pen;
      if (pen <= 0) continue;
      const nx = ex / dist, ny = ey / dist, fn = berg.K * pen;                 // N per metre of hull (stations are 1 m apart)
      const ub = s.u - s.r * y, vb = s.v + s.r * x, Vx = ub * c - vb * sn, Vy = ub * sn + vb * c;
      const vt = -Vx * ny + Vy * nx, ft = -berg.mu * fn * Math.sign(vt);
      const fx = fn * nx - ft * ny, fy = fn * ny + ft * nx;
      Fx += fx; Fy += fy; N += (Xw - s.X) * fy - (Yw - s.Y) * fx;
      if (pen > R.pen[i]) R.pen[i] = pen;
      if (R.t0[i] < 0) R.t0[i] = s.t;
    }
  }
  const F = Math.sqrt(Fx * Fx + Fy * Fy);
  if (F > 0) { if (rec.tFirst < 0) rec.tFirst = s.t; rec.tLast = s.t; if (F > rec.Fmax) rec.Fmax = F; }
  // head-on: the stem itself is driving into the ice
  const Xs = s.X + st.stem * c, Ys = s.Y + st.stem * sn, ex = Xs - berg.X, ey = Ys - berg.Y, ds = Math.sqrt(ex * ex + ey * ey);
  if (berg.R - ds > 3 && (ex * c + ey * sn) / ds < -0.75) rec.headOn = true;
  return { X: Fx * c + Fy * sn, Y: -Fx * sn + Fy * c, N, F };
}

// One encounter. sc: kn, Dh (m from the stem to the ice along the track when the helm order is given), o (m the ice
// reaches to PORT of the track's centreline), R, K, mu, helm (deg, negative = to port), portAround (s after first
// touch to reverse the helm, or null), engines ('ahead' or 'stop'), late (s the order comes after t = 0).
function encounter(P, sc) {
  const st = hullStations(sc.zs || 2.75), rec = newRec(st.n), s = init(sc.kn);
  const berg = { R: sc.R, K: sc.K, mu: sc.mu, X: st.stem + sc.Dh + sc.R, Y: sc.R - sc.o };
  let psiAtTouch = null, uAtTouch = null, aBowMax = 0, done = false;
  while (!done && s.t < 400) {
    if (s.t >= (sc.late || 0)) {
      s.delCmd = sc.helm * DEG;
      if (sc.engines === 'stop') { s.nC = 0; s.nW = Math.max(0, s.nW - (wing.n0 / 30) * 0.05); }
    }
    if (rec.tFirst >= 0 && sc.portAround !== null && sc.portAround !== undefined && s.t >= rec.tFirst + sc.portAround) s.delCmd = -sc.helm * DEG;
    const near = Math.hypot(s.X - berg.X, s.Y - berg.Y) < berg.R + 160;
    const dt = near ? 0.05 : 0.25;
    const ext = near ? contact(s, berg, st, rec) : ZERO;
    if (rec.headOn) { uAtTouch = s.u; break; }
    if (ext.F > 0 && psiAtTouch === null) { psiAtTouch = s.psi / DEG; uAtTouch = s.u; }
    stepShip(s, P, dt, ext);
    if (ext.F > 0) aBowMax = Math.max(aBowMax, ext.F);
    if (s.X - 135 > berg.X + berg.R || Math.abs(s.psi) > 100 * DEG) done = true;
  }
  const out = { sc, berg, st, rec, kind: rec.headOn ? 'head-on' : (rec.tFirst < 0 ? 'miss' : 'side'), minGap: rec.minGap, psiAtTouch, uAtTouch, tFirst: rec.tFirst, dur: rec.tLast - rec.tFirst, Fmax: rec.Fmax };
  for (const [name, R] of [['stbd', rec.stbd], ['port', rec.port]]) {
    let xmax = null, xmin = null, D = 0, pmax = 0, len = 0;
    for (let i = 0; i < st.n; i++) if (R.pen[i] > 0) { if (xmax === null) xmax = st.xs[i]; xmin = st.xs[i]; len++; pmax = Math.max(pmax, R.pen[i]); D += Math.max(0, R.pen[i] - sc.dy); }
    out[name] = { xmax, xmin, len, pmax, D };
  }
  return out;
}

// the generated damage as openings for the flooding core (core frame: y to PORT, so starboard is negative y)
function toOpenings(out, cw, zs) {
  const ops = [], t0 = out.rec.tFirst;
  for (const [name, R, sg] of [['stbd', out.rec.stbd, -1], ['port', out.rec.port, 1]]) {
    for (let i = 0; i < out.st.n; i++) {
      const a = cw * Math.max(0, R.pen[i] - out.sc.dy);
      if (a <= 0) continue;
      const x = out.st.xs[i], z = zs + 0.35 * Math.sin(i * 2.3);
      ops.push({ x, y: sg * (C.halfBreadth(x, z) + 0.02), z, area: a, kind: 'breach', label: 'iceberg (generated)', tOpen: Math.max(0, R.t0[i] - t0) });
    }
  }
  return ops;
}
function split(ops) { const f = new Array(16).fill(0); let tot = 0; for (const o of ops) { f[C.zoneAt(o.x)] += o.area; tot += o.area; } return { tot, f: f.map(v => (tot > 0 ? v / tot : 0)) }; }
const ship = C.buildShip();
function sink(ops, label) {
  const sim = C.createSim(ship, {}, { openings: ops, coalListDeg: 2.0 });
  const res = C.run(sim, { tMax: 12 * 3600, every: 60, stopWhenStable: true });
  const r = res.final;
  return { label, foundered: res.foundered, min: res.foundered ? res.founderT / 60 : null, trim: r.trimDeg, list: r.listDeg, water: r.waterT };
}

// ------------------------------------------------------------------ run
const f1 = (v, n) => (v === null || v === undefined ? 'n/a' : v.toFixed(n === undefined ? 1 : n));
console.log('SHIP: unified hull form; cross-flow regressions give C_D', CD0.toFixed(3), 'C_rY', CrY.toFixed(2), 'C_rN', CrN.toFixed(2), '; rudder', AR, 'm2');
console.log('\n1. FIT to the trial record: two numbers (rudder inflow factor, cross-flow drag factor) against two measurements');
console.log('   targets: two points in 37 s from the order at 21.5 kn (Olympic 1912); tactical diameter 3,850 ft = 1,173.5 m (Titanic trials)');
console.log('   rudder rate   inflow x   C_D x    t(2 pts)   tactical   | NOT fitted:  advance   speed ratio  steady rate   heel   | centre screw stopped: t(2 pts)  tactical');
const fits = {};
for (const rate of [2.5, 4, 8]) {
  const b = fit(rate); fits[rate] = b;
  const c = turnTrial(b.P, 21.5, 40, { centreStopped: true }), c2 = turnTrial(b.P, 20, 40, { centreStopped: true });
  console.log('   ' + (rate + ' deg/s').padEnd(12), b.P.uRk.toFixed(2).padStart(7), b.P.cd.toFixed(1).padStart(8), (f1(b.a.t225) + ' s').padStart(10), (f1(b.b.tact, 0) + ' m').padStart(10),
    '               ', (f1(b.b.adv, 0) + ' m').padStart(7), f1(b.b.ratio, 2).padStart(11), (f1(b.b.rate, 2) + ' deg/s').padStart(13), (f1(b.b.heel) + ' deg').padStart(8), '                      ', (f1(c.t225) + ' s').padStart(8), (f1(c2.tact, 0) + ' m').padStart(9));
}
console.log('   record, not fitted: advance about 640 m (Wilding) or 774 m (Halpern\'s model); speed ratio 0.76 and 0.86 deg/s (Halpern\'s model); heel about 5.4 deg (Hackett and Bedford)');
const P = fits[4].P;
console.log('   the encounter runs below use the 4 deg/s fit: inflow x', P.uRk.toFixed(2), ', C_D x', P.cd.toFixed(1));
for (const kn of [11, 19.5, 21.75]) { const t = turnTrial(P, kn, 40); console.log('   circle at', String(kn).padStart(5), 'kn: tactical', f1(t.tact, 0), 'm, advance', f1(t.adv, 0), 'm   (Wilding: speed changes the circle "only by a very small amount")'); }

// the ice: a fixed circle at the height of the 1912 damage
const ICE = { R: 40, K: 0.3e6, mu: 0.1, dy: 0.2 };
const base = (o) => Object.assign({ kn: 22.5, helm: -40, portAround: null, engines: 'ahead', late: 0 }, ICE, o);

console.log('\n2. THE MAP: what happens, by how far off the ice is when the helm order comes (rows) and how far the ice reaches to port of the track (columns)');
console.log('   helm hard-a-starboard (turn to port), engines untouched, 22.5 kn. M = miss (clearance m), H = head-on, numbers = starboard side contact from x to x (m from amidships, + forward)');
const os = [-12, -8, -4, 0, 4, 8, 12, 16, 20, 24, 30];
console.log('   order at'.padEnd(22) + os.map(o => (o + ' m').padStart(11)).join(''));
const grid = [];
for (const Dh of [150, 200, 250, 290, 350, 430, 500, 600]) {
  let line = ('   ' + Dh + ' m (' + (Dh / (22.5 * KN)).toFixed(0) + ' s)').padEnd(22);
  for (const o of os) {
    const r = encounter(P, base({ Dh, o })); grid.push(r);
    let cell;
    if (r.kind === 'miss') cell = 'M ' + r.minGap.toFixed(0);
    else if (r.kind === 'head-on') cell = 'H';
    else cell = (r.stbd.len ? r.stbd.xmax + '..' + r.stbd.xmin : '') + (r.port.len ? ' P' : '');
    line += cell.padStart(11);
  }
  console.log(line);
}

console.log('\n3. THE 1912 ENCOUNTER, found by the damage: which geometry gives starboard contact from the forepeak (x 124) to boiler room 5 (x 53)?');
let best = null;
for (const pa of [null, 2, 4, 6]) for (let Dh = 200; Dh <= 520; Dh += 10) for (let o = -12; o <= 30; o += 1) {
  const r = encounter(P, base({ Dh, o, portAround: pa }));
  if (r.kind !== 'side' || !r.stbd.len || r.port.len) continue;
  const e = Math.abs(r.stbd.xmax - 124) + Math.abs(r.stbd.xmin - 53.2);
  if (!best || e < best.e) best = { e, r, Dh, o, pa };
}
const h = best.r, cw = SC.CALIBRATED_AREA / h.stbd.D;
console.log('   best match: helm order', best.Dh, 'm (' + (best.Dh / (22.5 * KN)).toFixed(1) + ' s) from the ice; the ice reaches', best.o, 'm to port of the track; helm reversed', best.pa === null ? 'never' : best.pa + ' s after the first touch');
console.log('   contact on the starboard side from x', h.stbd.xmax, 'to x', h.stbd.xmin, '(' + h.stbd.len + ' m of hull) for', f1(h.dur), 's; heading had swung', f1(Math.abs(h.psiAtTouch)), 'deg at the first touch; speed', f1(h.uAtTouch / KN), 'kn');
console.log('   deepest overlap with the ice', f1(h.stbd.pmax, 2), 'm; peak contact force', f1(h.Fmax / 1e6, 2), 'MN =', f1(h.Fmax / 9964.02 / 1000, 2), 'thousand tons-force; as a sideways push on the bow (effective mass 29,600 t):', f1(h.Fmax / 29.6e6 / 9.81, 3), 'g');
console.log('   damage constant: 0.7506 m2 / ' + f1(h.stbd.D, 1) + ' m2 of overlap-length = ' + cw.toExponential(3) + ' m2 of opening per metre of hull per metre of overlap beyond ' + ICE.dy + ' m');
const ops = toOpenings(h, cw, 2.75), sp = split(ops);
const ref = [0.04, 0.13, 0.21, 0.24, 0.32, 0.06];
console.log('   openings generated:', ops.length, ' total', sp.tot.toFixed(4), 'm2');
console.log('   share by compartment   forepeak   hold 1   hold 2   hold 3   boiler 6   boiler 5   boiler 4');
console.log('   generated            ' + [0, 1, 2, 3, 4, 5, 6].map(z => (100 * sp.f[z]).toFixed(0).padStart(7) + ' %').join(''));
console.log('   reconstructed (H&B)  ' + ref.map(v => (100 * v).toFixed(0).padStart(7) + ' %').join('') + '      0 %');
const s0 = sink(SC.PRESETS.titanic.build().openings, 'the hand-made 1912 preset'), s1 = sink(ops, 'the generated 1912 damage');
for (const r of [s0, s1]) console.log('   flooding core,', r.label.padEnd(28), r.foundered ? 'founders at ' + r.min.toFixed(1) + ' min' : 'afloat, trim ' + r.trim.toFixed(2) + ' deg', ' water', Math.round(r.water), 't');
if (outDir) { fs.mkdirSync(outDir, { recursive: true }); fs.writeFileSync(path.join(outDir, 'e3_openings_1912_generated.json'), JSON.stringify({ made: 'e3_encounter.js', geometry: { Dh: best.Dh, o: best.o, portAround: best.pa }, ice: ICE, cw, openings: ops }, null, 1)); }

console.log('\n4. WHAT IF: the same ice, the same damage constant, a different watch');
const G0 = { Dh: best.Dh, o: best.o, portAround: best.pa };
const cases = [
  ['as it happened (the match above)', {}],
  ['the order 5 s sooner', { Dh: best.Dh + 5 * 22.5 * KN }],
  ['the order 10 s sooner', { Dh: best.Dh + 10 * 22.5 * KN }],
  ['the order 20 s sooner', { Dh: best.Dh + 20 * 22.5 * KN }],
  ['the order 5 s later', { Dh: best.Dh - 5 * 22.5 * KN }],
  ['the order 10 s later', { Dh: best.Dh - 10 * 22.5 * KN }],
  ['no helm order at all', { helm: 0, portAround: null }],
  ['helm held hard over, never reversed', { portAround: null }],
  ['helm reversed 2 s after the touch', { portAround: 2 }],
  ['engines stopped with the helm order', { engines: 'stop' }],
  ['at 15 kn, same distance', { kn: 15 }],
  ['at 10 kn, same distance', { kn: 10 }],
  ['turned the other way (to starboard)', { helm: 40 }],
];
console.log('   case'.padEnd(42) + 'outcome'.padEnd(34) + 'opening   compartments open        flooding core');
for (const [label, ch] of cases) {
  const r = encounter(P, base(Object.assign({}, G0, ch)));
  let line = ('   ' + label).padEnd(42), core = '';
  if (r.kind === 'miss') line += ('miss by ' + r.minGap.toFixed(1) + ' m').padEnd(34) + '   0';
  else if (r.kind === 'head-on') {
    // bow crush by energy: 120 MN (Wilding's 80 to 100 ft at 22.5 kn makes that force); compartments forward of the crush front open
    const E = 0.5 * S.m * r.uAtTouch * r.uAtTouch, crush = E / 120e6, zb = C.zoneBounds();
    const opened = []; for (let z = 0; z < 16; z++) if (zb[z + 1] > C.G.xFP - crush - 0.01 || zb[z] > C.G.xFP - crush) opened.push(z);
    const hops = opened.map(z => SC.zoneHole(z, 2.0, 3.0, 'starboard'));
    const sr = sink(hops, 'head-on');
    line += ('HEAD-ON at ' + f1(r.uAtTouch / KN) + ' kn, bow crushed ' + crush.toFixed(0) + ' m').padEnd(34) + ' (crush)  ' + opened.map(z => C.ZONES[z].short).join(' ').padEnd(24);
    core = sr.foundered ? 'founders at ' + sr.min.toFixed(0) + ' min' : 'AFLOAT, ' + sr.trim.toFixed(1) + ' deg by the head';
  } else {
    const o2 = toOpenings(r, cw, 2.75), s2 = split(o2), sr = sink(o2, label);
    const zs = []; for (let z = 0; z < 16; z++) if (s2.f[z] > 0.002) zs.push(C.ZONES[z].short);
    const side = (r.stbd.len ? 'stbd ' + r.stbd.xmax + '..' + r.stbd.xmin : '') + (r.port.len ? ' port ' + r.port.xmax + '..' + r.port.xmin : '');
    line += (side + ', ' + f1(r.Fmax / 1e6) + ' MN').padEnd(34) + (s2.tot.toFixed(2) + ' m2').padEnd(10) + zs.join(' ').padEnd(24);
    core = sr.foundered ? 'founders at ' + sr.min.toFixed(0) + ' min' : 'AFLOAT, ' + sr.trim.toFixed(1) + ' deg by the head';
  }
  console.log(line + ' ' + core);
}

console.log('\n5. HOW MUCH THE BETS MATTER: the 1912 match re-run with the ice stiffer or softer, the spur larger or smaller (damage constant re-fitted each time)');
for (const [label, ch] of [['as above', {}], ['ice 3 times stiffer', { K: 0.9e6 }], ['ice 3 times softer', { K: 0.1e6 }], ['spur radius 20 m', { R: 20 }], ['spur radius 80 m', { R: 80 }], ['no friction', { mu: 0 }], ['friction 0.3', { mu: 0.3 }]]) {
  const r = encounter(P, base(Object.assign({}, G0, ch)));
  if (r.kind !== 'side' || !r.stbd.len) { console.log('   ' + label.padEnd(22), r.kind, r.kind === 'miss' ? 'by ' + r.minGap.toFixed(1) + ' m' : ''); continue; }
  const cw2 = SC.CALIBRATED_AREA / r.stbd.D, o2 = toOpenings(r, cw2, 2.75), s2 = split(o2), sr = sink(o2, label);
  console.log('   ' + label.padEnd(22), 'contact x', String(r.stbd.xmax).padStart(4), 'to', String(r.stbd.xmin).padStart(4), ' overlap', f1(r.stbd.pmax, 2), 'm  force', f1(r.Fmax / 1e6, 1).padStart(5), 'MN  split',
    [0, 1, 2, 3, 4, 5, 6].map(z => (100 * s2.f[z]).toFixed(0)).join('/'), ' ', sr.foundered ? 'founders at ' + sr.min.toFixed(0) + ' min' : 'AFLOAT');
}
