'use strict';
// e122 (Z1, 2026-11-24): NH8's stage 0, the shadow body, and the hand-over's error budget
// (docs/DESIGN_NH8_one_body_from_the_ice_to_the_bed_v1_1_2026-11-24.md). Member C's 1912 watch, handed over at its onset.
//   1. The shadow: from --min minutes before the onset, the fall's whole body (begin's pieces 1, the pocket, its air at
//      'flag') is built afresh from the core's water every core step and carried on at its own pose and velocities
//      (F.place: its ship-frame origin, attitude and velocities kept, its momenta made again from its new mass), then
//      advanced one step. Nothing goes back (begin's write of sim.fall undone; readers off). After each core step its pose
//      is set against the core's: pitch, roll and the ship-frame origin's Z. The fingerprint at the onset against the
//      watch alone.
//   2. The joint at the onset (two pieces, Lh 20, the mended step), the hinge made unbreakable (Mu, Nt and Vs infinite)
//      so its moment M0 + k0 theta runs clean for 60 s, placed four ways: at the core's pose and rates (today) or at the
//      shadow's pose and velocities (joined after the placing, F.join, so its M0 is its own there); with the pieces' air
//      venting by milestone 1's stand-in (fOpen times the length, a fixed head: the default) or with those vents shut.
//      Its trough and first peak against Mu.
//   node docs/research/experiments/e122_nh8_shadow_body.js [--min 10]
// Prints its table (results_2026-11-24/e122_nh8_shadow_body.txt is a run of it); writes nothing.
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const C = require(path.join(ROOT, 'core/core.js')), N = require(path.join(ROOT, 'core/night.js'));
for (const r of ['girder.js', 'section.js', 'onset.js']) require(path.join(ROOT, 'core/readers', r));
const F = require(path.join(ROOT, 'core/readers/fall.js'));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const MIN = Number(arg('--min', 10));
const f = (v, d) => (Number.isFinite(v) ? v.toFixed(d) : String(v)), DEG = 180 / Math.PI, T0 = Date.now();
const fp = (sim) => (sim.night.hash >>> 0).toString(16).padStart(8, '0');
const mk = () => N.create(C.buildShip(), N.spec(1912), { auto: true, readers: false, handover: 'onset' });
const attOf = (R) => ({ pitch: Math.asin(Math.max(-1, Math.min(1, -R[6]))), roll: Math.atan2(R[7], R[8]) });
const coreR = (sim) => { const Fc = C.frameOf(sim); return { R: [Fc.R00, Fc.R01, Fc.R02, Fc.R10, Fc.R11, Fc.R12, Fc.R20, Fc.R21, Fc.R22], z: Fc.tz }; };
const originOf = (b, R) => [0, 1, 2].map(k => b.X[k] - (R[k * 3] * b.C[0] + R[k * 3 + 1] * b.C[1] + R[k * 3 + 2] * b.C[2]));
const vAt = (b0, C1) => { const om = [b0.nu[3], b0.nu[4], b0.nu[5]], d = [C1[0] - b0.C[0], C1[1] - b0.C[1], C1[2] - b0.C[2]]; return [b0.nu[0] + om[1] * d[2] - om[2] * d[1], b0.nu[1] + om[2] * d[0] - om[0] * d[2], b0.nu[2] + om[0] * d[1] - om[1] * d[0]]; };

// ---------------------------------------------------------------- 1. the shadow
const s1 = mk(); while (!N.over(s1)) N.step(s1);
const kOn = s1.night.k, fp1 = fp(s1);
console.log('e122: NH8 stage 0. Member C\'s watch alone: onset at step ' + kOn + ' (T+' + f((s1.night.onset.found.t - s1.night.tTouch) / 60, 2) + ' min), fingerprint ' + fp1);
console.log('\n1. THE SHADOW from ' + MIN + ' min before the onset (the whole body, the pocket at \'flag\'), against the core');
const sim = mk(), k0 = kOn - Math.round(MIN * 60 / sim.params.dt);
let shadow = null, prev = null, last = null, cost = 0, nS = 0, lastMin = -1;
const worst = { dp: 0, dr: 0, dz: 0 };
for (;;) {
  N.step(sim);
  if (sim.night.k < k0) { if (N.over(sim)) break; continue; }
  if (prev) {
    const c = coreR(sim), ac = attOf(c.R), dp = (prev.pitch - ac.pitch) * DEG, dr = (prev.roll - ac.roll) * DEG, dz = prev.z - c.z;
    if (Math.abs(dp) > Math.abs(worst.dp)) worst.dp = dp; if (Math.abs(dr) > Math.abs(worst.dr)) worst.dr = dr; if (Math.abs(dz) > Math.abs(worst.dz)) worst.dz = dz;
    last = { ac, c, dp, dr, dz, p: prev };
    const m = Math.floor((sim.night.k - k0) * sim.params.dt / 60);
    if (m !== lastMin) { lastMin = m; console.log('  -' + f((kOn - sim.night.k) * sim.params.dt / 60, 2) + ' min: the core pitch ' + f(ac.pitch * DEG, 3) + ', roll ' + f(ac.roll * DEG, 3) + ', origin Z ' + f(c.z, 3) + ' | the shadow apart: pitch ' + f(dp, 3) + ' deg, roll ' + f(dr, 3) + ' deg, Z ' + f(dz, 3) + ' m'); }
  }
  if (N.over(sim)) break;
  const t1 = Date.now(), hold = sim.fall, nf = F.begin(sim, { any: true, pieces: 1, rule: 'flag', t0: sim.t, K: { airAt: 'flag' } });
  sim.fall = hold;
  if (shadow) { const b0 = shadow.eng.bodies[0], b1 = nf.eng.bodies[0], R0 = F.quatR(b0.q, new Float64Array(9)); F.place(nf, 0, { R: R0, r: originOf(b0, R0), vC: vAt(b0, b1.C), om: [b0.nu[3], b0.nu[4], b0.nu[5]] }); }
  F.advance(nf);
  shadow = nf; cost += Date.now() - t1; nS++;
  const b = shadow.eng.bodies[0], R = F.quatR(b.q, new Float64Array(9)), a = attOf(R);
  prev = { pitch: a.pitch, roll: a.roll, z: originOf(b, R)[2], om: [b.nu[3], b.nu[4], b.nu[5]] };
}
console.log('  AT THE ONSET: the core pitch ' + f(last.ac.pitch * DEG, 3) + ' deg, roll ' + f(last.ac.roll * DEG, 3) + ', origin Z ' + f(last.c.z, 3) + ' m; its rates pitch ' + f(sim.wth * DEG, 4) + ' deg/s, roll ' + f(sim.wph * DEG, 4) + ', heave ' + f(sim.vz, 4) + ' m/s');
console.log('  the shadow apart there: pitch ' + f(last.dp, 3) + ' deg, roll ' + f(last.dr, 3) + ' deg, Z ' + f(last.dz, 3) + ' m; its turning in her axes ' + last.p.om.map(x => f(x * DEG, 4)).join(', ') + ' deg/s; the largest apart over the ' + MIN + ' min: pitch ' + f(worst.dp, 3) + ', roll ' + f(worst.dr, 3) + ', Z ' + f(worst.dz, 3));
console.log('  the fingerprint at the onset with the shadow ' + fp(sim) + ' against ' + fp1 + ' alone: ' + (fp(sim) === fp1 && sim.night.k === kOn ? 'the same' : 'DIFFERENT') + '; the shadow ' + f(cost / Math.max(1, nS), 2) + ' ms a step');

// ---------------------------------------------------------------- 2. the joint, placed four ways
const fd = sim.night.onset.found, sb = shadow.eng.bodies[0], Rs = F.quatR(sb.q, new Float64Array(9)), rs = originOf(sb, Rs), oms = [sb.nu[3], sb.nu[4], sb.nu[5]];
console.log('\n2. THE JOINT AT THE ONSET (x ' + f(fd.x, 2) + ', Lh 20, the mended step; the hinge unbreakable): its moment over 60 s against Mu; the gauge ' + f(fd.M / 1e9, 3) + ' GN m');
function swing(label, atShadow, vent) {
  const hold = sim.fall;
  const fall = F.begin(sim, Object.assign({ any: true, cut: fd.x, rule: 'break', t0: fd.t, hinge: atShadow ? undefined : { sense: fd.sense, Lh: 20 } }, vent ? { vent } : {}));
  sim.fall = hold;
  if (atShadow) {
    for (let i = 0; i < fall.eng.bodies.length; i++) F.place(fall, i, { R: Rs, r: rs, vC: vAt(sb, fall.eng.bodies[i].C), om: oms });
    F.join(fall, { sense: fd.sense === 'sagging' ? 'sag' : 'hog', Lh: 20, x: fd.x }, sim.ship);
  }
  const J = fall.eng.joint, H0 = J.H, Mu = H0.Mu;
  J.H = Object.assign({}, H0, { Mu: Infinity, at: (s) => Object.assign({}, H0.at(s), { Nt: Infinity, Vs: Infinity }) });
  const M = [], T = [];
  while (fall.t - fd.t < 60 - 1e-9 && !fall.done) { F.advance(fall); T.push(fall.t - fd.t); M.push(J.M0 + H0.k0 * J.theta); }
  let iMin = 0; for (let i = 0; i < M.length && T[i] <= 15; i++) if (M[i] < M[iMin]) iMin = i;
  let iMax = iMin; for (let i = iMin; i < M.length && T[i] <= 40; i++) if (M[i] > M[iMax]) iMax = i;
  console.log('  ' + label + ': M0 ' + f(J.M0 / Mu, 4) + ' Mu (the gauge ' + f(fd.M / Mu, 4) + '); trough ' + f(M[iMin] / Mu, 4) + ' at +' + f(T[iMin], 2) + ' s; first peak ' + f(M[iMax] / Mu, 4) + ' at +' + f(T[iMax], 2) + ' s (' + (M[iMax] >= Mu ? 'past' : 'short of') + ' Mu by ' + f(Math.abs(100 * (M[iMax] / Mu - 1)), 2) + ' %)');
}
swing('the core\'s pose and rates, the stand-in vents (today)', false);
swing('the shadow\'s pose and velocities, the stand-in vents', true);
swing('the core\'s pose and rates, the vents shut', false, { bow: 0, stern: 0 });
swing('the shadow\'s pose and velocities, the vents shut', true, { bow: 0, stern: 0 });
console.log('\ne122 done in ' + f((Date.now() - T0) / 1000, 0) + ' s');
