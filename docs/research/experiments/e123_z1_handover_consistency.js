// e123 (Z1, 2026-11-24; reserved 05:19 CST): the joint at the break's onset against the gauge, the hand-over's
// consistency (the coordinator's 3.6 %, D114, D115). Member C's watch to its onset (B2's check), then the fall from there
// joined (Lh 20, the mended step), begun as the fall reader begins it:
//   A. the joint at the hand-over, its moment M0 and shear |V0| (the locked solve's: loads and inertia together) against
//      the onset's own M and V at the same step, and its margin to its yield there (Mu, or Mu under(0, V0) on the onset's
//      circle), with each consistency alone and the three together: the hinge on the onset's M-V circle
//      (hinge.yieldOn 'circle', B1+B2's S.hinge under(s, V)), G7's peak tank weighed as the core weighs it
//      (K.peakTank 'weighed'), the section polygon at full resolution (K.section 'full'); under the pocket at 'flag'
//      (the default) and at 'centre', and under the spaces (D113's judge); and whether she parts in 90 s, when, how;
//   B. the joined body's static loads at the hand-over, piece by piece and term by term (the structure, the envelope's
//      buoyancy wholly under and cut by the surface, the water counted full, the air's lift), each term's moment about
//      the joint's pin about her y split into its part across her (the gauge's "beam form") and along her (its
//      "off-axis"), mirrored slice by slice from loads() and closed on the engine's own loads() to the bit's order;
//      against the gauge's terms at the same station (B1+B2's gap_axes.js, about her y at the pin, 2026-11-24 05:2x);
//   C. the cost of the section at full resolution, a fall step, under the pocket to rest and under the spaces.
// Nothing in the model changes: the switches are what-ifs (their defaults the fall before, to the bit).
//   node docs/research/experiments/e123_z1_handover_consistency.js [SECS]
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const C = require(path.join(ROOT, 'core/core.js')), N = require(path.join(ROOT, 'core/night.js'));
for (const r of ['girder.js', 'section.js', 'onset.js']) require(path.join(ROOT, 'core/readers', r));
const F = require(path.join(ROOT, 'core/readers/fall.js'));
const SECS = Number(process.argv[2] || 90), T0 = Date.now();
const f = (v, d) => (Number.isFinite(v) ? v.toFixed(d) : String(v)), s = (v, d) => (Number.isFinite(v) ? (v >= 0 ? '+' : '') + v.toFixed(d) : String(v)), DEG = 180 / Math.PI;
const sim = N.create(C.buildShip(), N.spec(1912), { auto: true, readers: false, handover: 'onset' });
while (!N.over(sim)) N.step(sim);
const fd = sim.night.onset.found, sense = fd.sense === 'sagging' ? 'sag' : 'hog';
console.log('e123: member C at its onset, step ' + fd.k + ' (T+' + f(fd.T, 2) + ' min), x ' + f(fd.x, 3) + ', ' + fd.sense + ', trim ' + f(fd.trimDeg, 3) + ', list ' + f(fd.listDeg, 3) + ' deg; the onset\'s M ' + f(fd.M / 1e9, 4) + ' GN m, V ' + f(Math.abs(fd.V) / 1e6, 3) + ' MN, Mu ' + f(fd.Mu / 1e9, 4) + ', Vu ' + f(fd.Vu / 1e6, 2));
const begin = (K, yieldOn) => { const hold = sim.fall; const fall = F.begin(sim, { any: true, cut: fd.x, rule: 'break', t0: fd.t, K, hinge: { sense, Lh: 20, yieldOn } }); sim.fall = hold; return fall; };

// A. the joint at the hand-over, each consistency alone and the three together
console.log('\nA. THE JOINT AT THE HAND-OVER against the onset\'s M and V; its margin to its yield there; ' + SECS + ' s followed');
const AIRS = [['the pocket at \'flag\'', {}], ['the pocket at \'centre\'', { airAt: 'centre' }], ['the spaces', { air: 'spaces' }]];
const SETS = [['none (the fall as it is)', {}, 'moment'], ['the circle', {}, 'circle'], ['the tank weighed', { peakTank: 'weighed' }, 'moment'], ['the section full', { section: 'full' }, 'moment'], ['the three together', { peakTank: 'weighed', section: 'full' }, 'circle']];
for (const [la, KA] of AIRS) {
  console.log('  ' + la + ':');
  for (const [ls, KS, yieldOn] of SETS) {
    const fall = begin(Object.assign({}, KA, KS), yieldOn), J = fall.eng.joint, Mu = J.H.Mu, V0 = Math.abs(J.demand0.V), y = Mu * (yieldOn === 'circle' ? J.H.under(0, V0) : 1);
    while (!J.released && !fall.done && fall.t - fall.t0 < SECS - 1e-9) F.advance(fall);
    console.log('    ' + ls.padEnd(26) + 'M0 ' + f(J.M0 / 1e9, 4) + ' (' + s(100 * (J.M0 - fd.M) / fd.M, 3) + ' %)  |V0| ' + f(V0 / 1e6, 3) + ' (' + s(100 * (V0 - Math.abs(fd.V)) / Math.abs(fd.V), 2) + ' %)  the yield ' + f(y / Mu, 4) + ' Mu, the margin ' + s(100 * (1 - J.M0 / y), 3) + ' %  ' +
      (J.released ? 'parts at +' + f(J.release.t - fall.t0, 3) + ' s by ' + J.release.by + ' at ' + f(J.release.theta * DEG, 3) + ' deg' : 'holds ' + SECS + ' s'));
  }
}

// B. the static loads at the hand-over, term by term (mirrored from loads(), closed on it)
const GAUSS = [[-Math.sqrt(0.6), 5 / 18], [0, 8 / 18], [Math.sqrt(0.6), 5 / 18]], g = C.GRAV;
function clip(bd, i, a, bb, c) {
  const o = bd.polyOff[i], m = bd.polyOff[i + 1] - o, Y = bd.polyY, Z = bd.polyZ;
  let A = 0, my = 0, mz = 0, py = 0, pz = 0, has = false, fy = 0, fz = 0;
  const emit = (y, z) => { if (has) { const cr = py * z - y * pz; A += cr; my += (py + y) * cr; mz += (pz + z) * cr; } else { fy = y; fz = z; has = true; } py = y; pz = z; };
  let y0 = Y[o + m - 1], z0 = Z[o + m - 1], in0 = a * y0 + bb * z0 < c;
  for (let k = 0; k < m; k++) {
    const y1 = Y[o + k], z1 = Z[o + k], in1 = a * y1 + bb * z1 < c;
    if (in1 !== in0) { const d0 = a * y0 + bb * z0 - c, d1 = a * y1 + bb * z1 - c, t = d0 / (d0 - d1); emit(y0 + t * (y1 - y0), z0 + t * (z1 - z0)); }
    if (in1) emit(y1, z1);
    y0 = y1; z0 = z1; in0 = in1;
  }
  if (has) { const cr = py * fz - fy * pz; A += cr; my += (py + fy) * cr; mz += (pz + fz) * cr; }
  A *= 0.5;
  return [A, A !== 0 ? my / (6 * A) : 0, A !== 0 ? mz / (6 * A) : 0];
}
function terms(fall, b, pin) {
  const sp = fall.sea, R = F.quatR(b.q, new Float64Array(9)), X = b.X, cx = b.C[0], cy = b.C[1], cz = b.C[2], u = [R[6], R[7], R[8]];
  const zAt = (px, py, pz) => X[2] + R[6] * px + R[7] * py + R[8] * pz;
  const T = {}; for (const k of ['structure', 'buoyancy', 'water', 'air']) T[k] = { F: 0, Sx: 0, Sz: 0 };
  const add = (t, Fv, px, py, pz) => { t.F += Fv; t.Sx += Fv * (px + cx - pin[0]); t.Sz += Fv * (pz + cz - pin[2]); };
  for (let i = 0; i < b.n; i++) {
    const xi = b.x[i] - cx, dx = b.dx[i];
    add(T.structure, -b.ms[i] * g, b.gx[i] - cx, b.gy[i] - cy, b.gz[i] - cz);
    const ex = b.ey[i] - cy, ez = b.ez[i] - cz, zmid = zAt(xi, ex, ez), rad = b.rad[i];
    let fsub = 1, cut = false;
    if (zmid + rad > 0) {
      if (zmid - rad >= 0) fsub = 0;
      else {
        let A = 0, ax = 0, ay = 0, az = 0;
        const a = R[7], bb = R[8], A0 = b.polyA[i], oy = b.ey[i] - b.polyCy[i], oz = b.ez[i] - b.polyCz[i];
        for (const [gq, wg] of GAUSS) {
          const xg = xi + gq * 0.5 * dx, c = -(X[2] + R[6] * xg) + a * cy + bb * cz;
          let fr, yc, zc;
          if (Math.abs(a) + Math.abs(bb) < 1e-12) { fr = c > 0 ? 1 : 0; yc = b.polyCy[i]; zc = b.polyCz[i]; }
          else { const o = clip(b, i, a, bb, c); fr = A0 > 0 ? o[0] / A0 : 0; yc = o[1]; zc = o[2]; }
          if (fr > 1) fr = 1; if (fr < 0) fr = 0;
          A += wg * fr; ax += wg * fr * xg; ay += wg * fr * (yc + oy - cy); az += wg * fr * (zc + oz - cz);
        }
        if (A < 1 - 1e-12) { cut = true; fsub = A; if (A > 0) { const px = ax / A, py = ay / A, pz = az / A; add(T.buoyancy, F.rhoAt(sp, -zAt(px, py, pz)) * g * b.Venv[i] * A, px, py, pz); } }
      }
    }
    if (!cut && fsub === 1) add(T.buoyancy, F.rhoAt(sp, -zAt(xi, ex, ez)) * g * b.Venv[i], xi, ex, ez);
    if (b.Vf[i] > 0) { const fy = b.fy[i] - cy, fz = b.fz[i] - cz; add(T.water, -F.rhoAt(sp, -zAt(xi, fy, fz)) * g * b.Vf[i], xi, fy, fz); }
  }
  const Vair = b.Vair || 0;
  if (Vair > 0) { const pax = b.air.p[0] - cx, pay = b.air.p[1] - cy, paz = b.air.p[2] - cz; add(T.air, F.rhoAt(sp, -zAt(pax, pay, paz)) * g * Vair, pax, pay, paz); }
  const o6 = [0, 0, 0, 0, 0, 0]; F.loads(b, sp, [0, 0, 0, 0, 0, 0], X, R, X, R, X, R, Vair, o6, {});
  const r = [pin[0] - cx, pin[1] - cy, pin[2] - cz], Mst = (o6[4] - (r[2] * o6[0] - r[0] * o6[2])) / 1e9;
  const out = {}; let sum = 0;
  for (const k of Object.keys(T)) { const t = T[k]; out[k] = { Mn: -t.Sx * u[2] / 1e9, Ma: t.Sz * u[0] / 1e9, V: t.F * u[2] / 1e6 }; sum += out[k].Mn + out[k].Ma; }
  return { out, sum, Mst, R };
}
// the gauge's terms at the station (B1+B2, gap_axes.js, 2026-11-24 05:2x: about her y at the pin, hogging +, the
// columns cut at the station, the core's 1025): the bow's water counts G7's tank (pocketPoints) and its air
const GAUGE = { bow: { structure: [15.1704, 0.0548], buoyancy: [-39.0208, -0.2134], water: [28.7540, null] }, stern: { structure: [11.4866, -0.0639], buoyancy: [-6.4896, -0.0722], water: [0, 0] } };
console.log('\nB. THE STATIC LOADS AT THE HAND-OVER (the spaces, the tank weighed), about the joint\'s pin about her y, GN m, hogging +: across her / along her; the gauge\'s (B1+B2, the columns cut at the station, 1025 kg/m3)');
for (const section of ['decimated', 'full']) {
  const fall = begin({ air: 'spaces', peakTank: 'weighed', section }, 'circle'), J = fall.eng.joint, pin = [J.xb, 0, J.H.at(0).zNA];
  console.log('  the section ' + section + ': M0 ' + f(J.M0 / 1e9, 4) + ' GN m, |V0| ' + f(Math.abs(J.demand0.V) / 1e6, 3) + ' MN (the pin at x ' + f(pin[0], 3) + ', z ' + f(pin[2], 3) + ')');
  for (const [i, name] of [[0, 'bow'], [1, 'stern']]) {
    const sg = i === 0 ? 1 : -1, r = terms(fall, fall.eng.bodies[i], pin), o = r.out, G = GAUGE[name];
    const wat = { Mn: o.water.Mn + o.air.Mn, Ma: o.water.Ma + o.air.Ma };
    const line = (lab, Mn, Ma, gg) => '      ' + lab.padEnd(34) + s(sg * Mn, 4) + ' / ' + s(sg * Ma, 4) + (gg ? '   the gauge ' + s(gg[0], 4) + ' / ' + (gg[1] === null ? '-' : s(gg[1], 4)) + ' (' + s(sg * Mn - gg[0], 4) + ' across her)' : '');
    console.log('    ' + name + ': static ' + f(sg * r.sum, 4) + ' (the engine\'s loads() ' + f(sg * r.Mst, 4) + ', closure ' + (Math.abs(r.sum - r.Mst) < 1e-9 ? 'to 1e-9' : 'OFF ' + f(r.sum - r.Mst, 9)) + '); her inertia from it ' + s((J.M0 / 1e9) - sg * r.Mst, 4));
    console.log(line('structure (with the tank\'s water)', o.structure.Mn, o.structure.Ma, null));
    console.log(line('buoyancy', o.buoyancy.Mn, o.buoyancy.Ma, G.buoyancy));
    console.log(line('water counted full less the air', wat.Mn, wat.Ma, null));
  }
}
console.log('  (the bow\'s structure with the tank\'s 330.7 t is the gauge\'s structure 15.1704 and the tank\'s 0.4212 across her; its water less the air, the tank moved to it, against the gauge\'s 28.7540; the stern dry, its water and air cancelling)');

// C. the cost of the section at full resolution
console.log('\nC. THE COST of the section at full resolution (the three consistencies otherwise on): a fall step');
for (const [la, KA, cap] of [['the pocket at \'flag\', to rest', {}, 1800], ['the spaces, 120 s', { air: 'spaces' }, 120]]) {
  const ms = [];
  for (const section of ['decimated', 'full']) {
    const fall = begin(Object.assign({ peakTank: 'weighed', section }, KA), 'circle'), k0 = fall.k, t0 = process.hrtime.bigint();
    while (!fall.done && fall.t - fall.t0 < cap - 1e-9) F.advance(fall);
    ms.push([Number(process.hrtime.bigint() - t0) / 1e6 / (fall.k - k0), fall.k - k0]);
  }
  console.log('  ' + la + ': decimated ' + f(ms[0][0], 3) + ' ms a step (' + ms[0][1] + ' steps), full ' + f(ms[1][0], 3) + ' (' + ms[1][1] + '): ' + s(100 * (ms[1][0] / ms[0][0] - 1), 1) + ' %');
}
// D. the list's axis: the gauge (girder.js moment().at(x), and so B2's onset) takes the moment about the world's
// horizontal axis across her; the joint's hinge and her capacity Mu bend about her own y. Members of the kept set with
// little and much list at their onsets: the gauge's moment from the stern against the fall's (the engine's loads()
// about the pin about her y, the three on), their ratio against cos(list); the joint's margin to its yield at t0
const EN = require(path.join(ROOT, 'tools/ensemble.js')), G = require(path.join(ROOT, 'core/readers/girder.js'));
const kept = JSON.parse(require('fs').readFileSync(path.join(ROOT, 'out/kept_1912.json'), 'utf8'));
console.log('\nD. THE LIST\'S AXIS: the gauge\'s moment from the stern (about the horizontal axis across her) against the fall\'s (about her own y), the three on, the pocket at \'flag\'');
for (const id of [0, 6, 4, 24]) {
  const shp = C.buildShip(), { sim: sm } = EN.memberWatch(id === 0 ? null : kept.members[id - 1].inputs, shp);
  while (!N.over(sm) && sm.t < EN.T_MAX) N.step(sm);
  const q = sm.night.onset && sm.night.onset.found;
  if (!q) { console.log('  ' + (id ? '#' + id : 'landed') + ': no onset'); continue; }
  const gq = G.moment(sm).at(q.x), hold = sm.fall;
  const fl = F.begin(sm, { any: true, cut: q.x, rule: 'break', t0: q.t, K: { peakTank: 'weighed', section: 'full' }, hinge: { sense: q.sense === 'sagging' ? 'sag' : 'hog', Lh: 20, yieldOn: 'circle' } });
  sm.fall = hold;
  const Jq = fl.eng.joint, pin = [Jq.xb, 0, Jq.H.at(0).zNA], bs = fl.eng.bodies[1], Rs = F.quatR(bs.q, new Float64Array(9)), o6 = [0, 0, 0, 0, 0, 0];
  F.loads(bs, fl.sea, [0, 0, 0, 0, 0, 0], bs.X, Rs, bs.X, Rs, bs.X, Rs, bs.Vair || 0, o6, {});
  const rr = [pin[0] - bs.C[0], pin[1] - bs.C[1], pin[2] - bs.C[2]], Mst = -(o6[4] - (rr[2] * o6[0] - rr[0] * o6[2]));
  const V0 = Math.abs(Jq.demand0.V), y = Jq.H.Mu * Jq.H.under(0, V0);
  console.log('  ' + (id ? '#' + id : 'landed').padEnd(7) + 'list ' + f(q.listDeg, 2).padStart(6) + ' deg: the gauge from the stern ' + f(gq.Mstern / 1e9, 4) + ', the fall ' + f(Mst / 1e9, 4) + ' GN m: ' + f(Mst / gq.Mstern, 4) + ' against cos(list) ' + f(C.cos(q.listDeg * Math.PI / 180), 4) + '; the joint\'s margin at t0 ' + s(100 * (1 - Jq.M0 / y), 2) + ' % (1 - cos(list) ' + f(100 * (1 - C.cos(q.listDeg * Math.PI / 180)), 2) + ' %)');
}
console.log('\ne123 done in ' + Math.round((Date.now() - T0) / 1000) + ' s');
