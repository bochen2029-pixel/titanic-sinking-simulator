// E2: feasibility prototype of a 3-DOF MMG-type manoeuvring model for the intact ship.
// QUESTION: do textbook formulas plus the ship's particulars land near the 1911-12 trial figures WITHOUT tuning?
// Every coefficient here is a first guess written from memory of the literature (Yasukawa & Yoshimura 2015,
// Yoshimura & Masumoto 2012, Kijima et al. 1990, Clarke et al. 1983). It is NOT the model to implement:
// the research notes carry the verified formulas. Convention here is MMG's: x forward, y to STARBOARD,
// r > 0 and delta > 0 turn to starboard. (The core's frame has y to port; see the brainstorm, section 4.)
//
// Run 2 (2026-11-16, after the research note arrived): two changes.
//   1. X'_vr now follows the sourced formula m'_y + X'_vr = 2.86 Cb B/L - 0.21 (Yoshimura, Nakao and Ishibashi 2009,
//      Eq. 17, quoted in the research note M6). Run 1 used a form remembered wrongly (X'_vr - m'_y = ...), which made the
//      speed loss in a turn about 2.7 times too strong. `--memory-xvr` restores run 1's value.
//   2. A third hull set, YU: the same paper's "unified" form, linear terms in velocity products plus a cross-flow drag
//      strip integral, with its regressions C_D = -0.0591 L/d + 1.848, C_rY = 0.520 L/B - 1.062,
//      C_rN = 0.0742 L/d - 0.297 (research note M10). All three coefficients are extrapolated for this hull.
// Usage: node e2_mmg.js [--memory-xvr]
const MEMORY_XVR = process.argv.includes('--memory-xvr');
const rho = 1025, KN = 0.514444, DEG = Math.PI / 180;
const S = { L: 259.08, B: 28.19, d: 9.83, m: 49.02e6, xG: -3.2, KG: 10.80, GM: 0.80 };
S.CB = S.m / rho / (S.L * S.B * S.d);
const k = 2 * S.d / S.L, cbl = S.CB * S.B / S.L;
const MU = 0.5 * rho * S.L * S.L * S.d;               // mass unit of the nondimensional form
const mp = S.m / MU;
const mxp = 0.04 * mp;
const myp = Math.PI * Math.pow(S.d / S.L, 2) * (1 + 0.16 * S.CB * S.B / S.d - 5.1 * Math.pow(S.B / S.L, 2)) * (S.L / S.d);     // Clarke
const Jzp = Math.PI * Math.pow(S.d / S.L, 2) * (1 / 12 + 0.017 * S.CB * S.B / S.d - 0.33 * S.B / S.L) * (S.L / S.d);          // Clarke
const Izp = mp * 0.25 * 0.25;

function derivs(set) {
  const D = { Xvv: 1.15 * cbl - 0.18, Xvr: MEMORY_XVR ? myp + (-1.91 * cbl + 0.08) : (2.86 * cbl - 0.21) - myp, Xrr: -0.085 * cbl + 0.008, Xvvvv: -6.68 * cbl + 1.1,
    Yv: -(0.5 * Math.PI * k + 1.4 * cbl), YR: 0.5 * cbl + mxp, Nv: -k, NR: -0.54 * k + k * k };
  if (set === 'YM') Object.assign(D, { Yvvv: -0.185 * S.L / S.B + 0.48, Yvvr: -0.75, Yvrr: -(0.26 * (1 - S.CB) * S.L / S.B + 0.11), Yrrr: -0.051,
    Nvvv: -(-0.69 * S.CB + 0.66), Nvvr: 1.55 * cbl - 0.76, Nvrr: -0.075 * (1 - S.CB) * S.L / S.B - 0.098, Nrrr: 0.25 * cbl - 0.056 });
  return D;
}
// Kijima 1990 nonlinear terms act on beta and r' with |.| forms
const KJ = { Ybb: 2.5 * S.d * (1 - S.CB) / S.B + 0.5, Yrr: 0.343 * S.d * S.CB / S.B - 0.07, Ybrr: 5.95 * S.d * (1 - S.CB) / S.B, Ybbr: 1.5 * S.d * S.CB / S.B - 0.65,
  Nbb: -0.96 * S.d * (1 - S.CB) / S.B + 0.066, Nrr: 0.5 * cbl - 0.09, Nbrr: -(0.5 * S.d * S.CB / S.B - 0.05), Nbbr: -(57.5 * cbl * cbl - 18.4 * cbl + 1.6) };

// propulsion, calibrated so that 75/75/165 rpm balances R = c u^2 at 22.5 kn with thrust deduction tP
const U_FULL = 22.5 * KN, R_FULL = 1.5e6, cR = R_FULL / (U_FULL * U_FULL), tP = 0.15;
const wing = { D: 7.16, w: 0.15, J0: 1.48, n0: 75 / 60, share: 15 / 46 };
const cen = { D: 5.03, w: 0.30, J0: 0.95, n0: 165 / 60, share: 16 / 46 };
for (const p of [wing, cen]) {
  const J = U_FULL * (1 - p.w) / (p.n0 * p.D);
  const T = p.share * R_FULL / (1 - tP);
  p.a = T / (rho * p.n0 * p.n0 * Math.pow(p.D, 4)) / (1 - J / p.J0);
}
const thrust = (p, n, u, w) => { const J = u * (1 - w) / (n * p.D); return rho * n * n * Math.pow(p.D, 4) * p.a * (1 - J / p.J0); };

function simulate(o) {
  const D = derivs(o.set), L = S.L, d = S.d;
  const AR = o.AR, HR = 9.5, lam = HR * HR / AR, fa = 6.13 * lam / (lam + 2.25);
  const tR = 1 - (0.28 * S.CB + 0.55), aH = 0.25, xH = -0.45 * L, xR = -0.5 * L, eps = 1.0, kap = 0.5, gamR = 0.5, lR = -0.9, xPp = -0.48;
  const eta = cen.D / HR;
  const U0 = o.kn * KN, scale = U0 / U_FULL;
  const nW = wing.n0 * scale, nC = o.centreStopped ? 0 : cen.n0 * scale;
  let u = U0, v = 0, r = 0, psi = 0, X = 0, Y = 0, del = 0, t = 0;
  const dt = o.dt || 0.25, rate = (o.rate || 2.5) * DEG, delCmd = o.delta * DEG;
  const out = { t225: null, adv: null, trans: null, tact: null, t90: null, t180: null, maxHeel: 0 };
  const M11 = S.m + myp * MU, M12 = S.xG * S.m, M22 = (Izp + Jzp) * MU * L * L + S.xG * S.xG * S.m, det = M11 * M22 - M12 * M12;
  while (t < 1800) {
    del += Math.max(-rate * dt, Math.min(rate * dt, delCmd - del));
    const U = Math.hypot(u, v), vp = v / U, rp = r * L / U, beta = Math.atan2(-v, u);
    const FU = 0.5 * rho * L * d * U * U;
    let XH = -cR * u * Math.abs(u) + FU * (D.Xvv * vp * vp + D.Xvr * vp * rp + D.Xrr * rp * rp + D.Xvvvv * Math.pow(vp, 4));
    let YH, NH;
    if (o.set === 'YM') {
      YH = FU * (D.Yv * vp + D.YR * rp + D.Yvvv * vp * vp * vp + D.Yvvr * vp * vp * rp + D.Yvrr * vp * rp * rp + D.Yrrr * rp * rp * rp);
      NH = FU * L * (D.Nv * vp + D.NR * rp + D.Nvvv * vp * vp * vp + D.Nvvr * vp * vp * rp + D.Nvrr * vp * rp * rp + D.Nrrr * rp * rp * rp);
    } else if (o.set === 'YU') {   // Yoshimura 2009 unified form: no division by U, cross-flow drag by strips
      const CD = -0.0591 * (L / d) + 1.848, CrY = 0.520 * (L / S.B) - 1.062, CrN = 0.0742 * (L / d) - 0.297;
      const NS = 60, dx = L / NS; let sy = 0, sn = 0;
      for (let i = 0; i < NS; i++) { const x = -L / 2 + (i + 0.5) * dx, a = v + CrY * r * x, b = v + CrN * r * x; sy += Math.abs(a) * a * dx; sn += Math.abs(b) * b * x * dx; }
      YH = 0.5 * rho * L * d * (D.Yv * v * Math.abs(u) + D.YR * L * r * u) - 0.5 * rho * d * CD * sy;
      NH = 0.5 * rho * L * L * d * (D.Nv * v * u + D.NR * L * r * Math.abs(u)) - 0.5 * rho * d * CD * sn;
      XH = -cR * u * Math.abs(u) + 0.5 * rho * L * d * D.Xvr * v * r * L;
    } else {   // Kijima: linear part as above (same formulas), nonlinear in beta, r'
      YH = FU * (-D.Yv * beta + D.YR * rp + KJ.Ybb * beta * Math.abs(beta) + KJ.Yrr * rp * Math.abs(rp) + (KJ.Ybbr * beta + KJ.Ybrr * rp) * beta * rp);
      NH = FU * L * (-D.Nv * beta + D.NR * rp + KJ.Nbb * beta * Math.abs(beta) + KJ.Nrr * rp * Math.abs(rp) + (KJ.Nbbr * beta + KJ.Nbrr * rp) * beta * rp);
    }
    // propellers (constant rpm); wake at the centre screw changes with the local drift angle
    const betaP = beta - xPp * rp, wC = cen.w * Math.exp(-4 * betaP * betaP);
    const TW = thrust(wing, nW, u, wing.w);
    const TC = nC > 0 ? thrust(cen, nC, u, wC) : -0.5 * rho * 0.5 * (Math.PI * cen.D * cen.D / 4) * Math.pow(u * (1 - wC), 2);  // locked screw: drag, Cd 0.5 (guess)
    const XP = (1 - tP) * (2 * TW + TC);
    // rudder in the centre screw's race
    const VA = u * (1 - wC), CTh = TC / (0.5 * rho * VA * VA * (Math.PI * cen.D * cen.D / 4));
    const uR = eps * VA * Math.sqrt(eta * Math.pow(1 + kap * (Math.sqrt(Math.max(0, 1 + CTh)) - 1), 2) + (1 - eta));
    const vR = U * gamR * (beta - lR * rp);
    const aR = del - Math.atan2(vR, uR);
    let CN = fa * Math.sin(aR); if (o.cnMax) CN = Math.max(-o.cnMax, Math.min(o.cnMax, CN));
    const FN = 0.5 * rho * AR * (uR * uR + vR * vR) * CN;
    const XR = -(1 - tR) * FN * Math.sin(del), YR = -(1 + aH) * FN * Math.cos(del), NR = -(xR + aH * xH) * FN * Math.cos(del);
    const Xt = XH + XP + XR, Yt = YH + YR, Nt = NH + NR;
    const du = (Xt + (S.m + myp * MU) * v * r + S.xG * S.m * r * r) / (S.m + mxp * MU);
    const bY = Yt - (S.m + mxp * MU) * u * r, bN = Nt - S.xG * S.m * u * r;
    const dv = (bY * M22 - M12 * bN) / det, dr = (M11 * bN - M12 * bY) / det;
    X += (u * Math.cos(psi) - v * Math.sin(psi)) * dt; Y += (u * Math.sin(psi) + v * Math.cos(psi)) * dt;
    u += du * dt; v += dv * dt; r += dr * dt; psi += r * dt; t += dt;
    // quasi-static heel from the lateral acceleration of the centre of gravity (v' + u r + xG r'), lever KG - d/2;
    // in a steady turn this is the textbook u r (KG - d/2) / (g GM). Positive = outward.
    const heel = (dv + u * r + S.xG * dr) * Math.sign(delCmd || 1) * (S.KG - S.d / 2) / (9.81 * S.GM) / DEG;
    out.maxHeel = Math.max(out.maxHeel, heel);
    if (out.t225 === null) out.heel225 = heel;
    const a = Math.abs(psi) / DEG;
    if (out.t225 === null && a >= 22.5) { out.t225 = t; out.x225 = X; }
    if (out.t90 === null && a >= 90) { out.t90 = t; out.adv = X; out.trans = Math.abs(Y); }
    if (out.t180 === null && a >= 180) { out.t180 = t; out.tact = Math.abs(Y); }
    if (a >= 540) break;
  }
  const U = Math.hypot(u, v);
  Object.assign(out, { Uend: U / KN, Rend: U / Math.abs(r), beta: Math.atan2(-v, u) / DEG, heelEnd: S.m * u * r * (S.KG - S.d / 2) / (S.m * 9.81 * S.GM) / DEG, rdeg: r / DEG * 60, FN0: null });
  return out;
}

console.log('particulars: CB', S.CB.toFixed(3), ' k=2d/L', k.toFixed(4), ' m\'', mp.toFixed(4), ' my\'', myp.toFixed(4), ' Jz\'', Jzp.toFixed(5), ' Iz\'', Izp.toFixed(5));
const D0 = derivs('YM');
console.log('linear derivatives: Yv', D0.Yv.toFixed(4), ' YR', D0.YR.toFixed(4), ' Nv', D0.Nv.toFixed(4), ' NR', D0.NR.toFixed(4));
const xGp = S.xG / S.L;
const Cst = D0.Yv * (D0.NR - mp * xGp) - D0.Nv * (D0.YR - mp - mxp);
console.log('course-stability index C = Yv(NR - m\'xG\') - Nv(YR - m\' - mx\') =', Cst.toExponential(3), Cst > 0 ? '(stable)' : '(unstable)');
console.log('propeller fit: wing K_T(0)', wing.a.toFixed(3), ' centre K_T(0)', cen.a.toFixed(3), ' hull drag c', cR.toFixed(0), 'kg/m');
console.log('');
console.log('case'.padEnd(52), 't(22.5deg) x(22.5)  advance transfer tactical  steadyDia  U_end  drift  turnRate  heelMax heelEnd');
const ft = (m) => (m === null || m === undefined ? '  n/a' : (m / 0.3048).toFixed(0));
function show(label, o) {
  const r = simulate(o);
  console.log(label.padEnd(52), (r.t225 === null ? 'n/a' : r.t225.toFixed(1) + ' s').padStart(9), (ft(r.x225) + ' ft').padStart(8), (ft(r.adv) + ' ft').padStart(9), (ft(r.trans) + ' ft').padStart(8), (ft(r.tact) + ' ft').padStart(8),
    (ft(2 * r.Rend) + ' ft').padStart(10), (r.Uend.toFixed(1) + ' kn').padStart(8), (r.beta.toFixed(1) + '°').padStart(6), (r.rdeg.toFixed(1) + '°/min').padStart(10), (r.maxHeel.toFixed(1) + '°').padStart(7), (r.heelEnd.toFixed(1) + '°').padStart(7),
    ' heel at 22.5°:', (r.heel225 === undefined ? 'n/a' : r.heel225.toFixed(2) + '°'));
}
console.log('targets (from memory, to be confirmed by the research note): trial circle about 3,850 ft diameter, advance about 2,100 ft at 20.5 kn;');
console.log('         Olympic 1912: two points (22.5 deg) in about 37 s at about 21.5 kn');
console.log(MEMORY_XVR ? 'X\'_vr: run 1 value (from memory)' : 'X\'_vr: sourced formula (run 2)', ' X\'_vr =', derivs('YM').Xvr.toFixed(4), ' m\'_y + X\'_vr =', (myp + derivs('YM').Xvr).toFixed(4));
for (const set of ['YM', 'KJ', 'YU']) {
  show(set + ' 20.5 kn, 40 deg, AR 37, no CN cap', { set, kn: 20.5, delta: 40, AR: 37 });
  show(set + ' 20.5 kn, 40 deg, AR 37, CN <= 1.3', { set, kn: 20.5, delta: 40, AR: 37, cnMax: 1.3 });
  show(set + ' 20.5 kn, 35 deg, AR 37, CN <= 1.3', { set, kn: 20.5, delta: 35, AR: 37, cnMax: 1.3 });
  show(set + ' 21.5 kn, 40 deg, AR 37, CN <= 1.3', { set, kn: 21.5, delta: 40, AR: 37, cnMax: 1.3 });
  show(set + ' 21.5 kn, 40 deg, AR 37, CN<=1.3, centre screw stopped', { set, kn: 21.5, delta: 40, AR: 37, cnMax: 1.3, centreStopped: true });
  show(set + ' 20.5 kn, 40 deg, AR 45, CN <= 1.3', { set, kn: 20.5, delta: 40, AR: 45, cnMax: 1.3 });
  show(set + ' 10 kn, 40 deg, AR 37, CN <= 1.3', { set, kn: 10, delta: 40, AR: 37, cnMax: 1.3 });
}
// integrator check: explicit Euler at 0.25 s against 0.01 s
const a = simulate({ set: 'YM', kn: 20.5, delta: 40, AR: 37, cnMax: 1.3, dt: 0.25 }), b = simulate({ set: 'YM', kn: 20.5, delta: 40, AR: 37, cnMax: 1.3, dt: 0.01 });
console.log('\nEuler dt 0.25 s against dt 0.01 s: tactical diameter', a.tact.toFixed(2), 'vs', b.tact.toFixed(2), 'm; advance', a.adv.toFixed(2), 'vs', b.adv.toFixed(2), 'm; t(22.5 deg)', a.t225, 'vs', b.t225.toFixed(2), 's');
