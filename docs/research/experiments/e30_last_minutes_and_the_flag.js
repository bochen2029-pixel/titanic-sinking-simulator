// e30: measurements for docs/BRAINSTORM_the_descent_to_the_bed_v2_2026-11-19.md (sections 1 and 4.1).
// The 1912 damage preset, stepped to "Foundered": her last minutes, the state at the founder flag, and the two parts
// either side of the break station (the girder reader's X_BREAK). Read-only: nothing is written.
//   node docs/research/experiments/e30_last_minutes_and_the_flag.js [TREE]
// TREE: a folder holding core/ (default: this repository). The output of 2026-11-19 was taken on the committed tree
// a97a6bd, exported with `git archive HEAD core tools`, because core/core.js was being changed in the checkout that day:
// results_2026-11-19/e30_last_minutes_and_the_flag.txt
'use strict';
const path = require('path');
const HEAD = process.argv[2] || path.join(__dirname, '..', '..', '..');
const C = require(path.join(HEAD, 'core', 'core.js'));
const SC = require(path.join(HEAD, 'core', 'scenarios.js'));
const GI = require(path.join(HEAD, 'core', 'readers', 'girder.js'));
const DEG = 180 / Math.PI, NN = C.NN, RHO = C.RHO;
const f = (x, n) => (x === undefined || x === null || !isFinite(x) ? String(x) : x.toFixed(n === undefined ? 1 : n));
const ship = C.buildShip();
const scen = SC.PRESETS.titanic.build({ areaTitanic: SC.CALIBRATED_AREA });
const sim = C.createSim(ship, {}, scen);
const c = ship.cols, ZB = C.zoneBounds();
const XB = GI.X_BREAK;

// ---------------------------------------------------------------- static geometry, by slice
const sl = c.slices.slice().sort((a, b) => a.xc - b.xc);
const geo = sl.map(s => {
  let ymax = 0, zlo = 1e9, zhi = -1e9, vol = 0;
  for (let i = s.first; i < s.first + s.count; i++) {
    const y = Math.abs(c.y[i]) + 0.5 * c.dy; if (y > ymax) ymax = y;
    if (c.zlo[i] < zlo) zlo = c.zlo[i]; if (c.zhi[i] > zhi) zhi = c.zhi[i];
    vol += c.dxdy[i] * (c.zhi[i] - c.zlo[i]);
  }
  return { xc: s.xc, dx: s.dx, zone: s.zone, B: 2 * ymax, D: zhi - zlo, zlo, zhi, vol, sect: vol / s.dx };
});
function part(x0, x1) {
  let L = 0, plan = 0, side = 0, vol = 0, sect = 0, xs = 1e9, xf = -1e9, mPlan = 0, mSide = 0;
  for (const g of geo) {
    if (g.xc < x0 || g.xc >= x1) continue;
    L += g.dx; plan += g.B * g.dx; side += g.D * g.dx; vol += g.vol; if (g.sect > sect) sect = g.sect;
    mPlan += g.B * g.dx * g.xc; mSide += g.D * g.dx * g.xc;
    if (g.xc - 0.5 * g.dx < xs) xs = g.xc - 0.5 * g.dx; if (g.xc + 0.5 * g.dx > xf) xf = g.xc + 0.5 * g.dx;
  }
  return { xs, xf, L, plan, side, vol, sect, xPlan: mPlan / plan, xSide: mSide / side };
}
let Venv = 0; for (let i = 0; i < c.N; i++) Venv += c.dxdy[i] * (c.zhi[i] - c.zlo[i]);
let Vfl = 0; for (let n = 0; n < NN; n++) Vfl += ship.nodeVmax[n];
// floodable volume by zone, and each zone's share forward of the break station (by length)
const zoneVmax = new Float64Array(16); for (let n = 0; n < NN; n++) zoneVmax[n >> 2] += ship.nodeVmax[n];
const fwdShare = (k) => { const xf = ZB[k], xa = ZB[k + 1]; if (xa >= XB) return 1; if (xf <= XB) return 0; return (xf - XB) / (xf - xa); };

const cv = GI.weight(sim);
const aft = GI.aftOf(cv, XB, [0, 0, 0]);
const ms = sim.ms;
console.log('== STATIC (HEAD a97a6bd, the 1912 damage preset)');
console.log('mass ms t', f(ms / 1000, 0), ' g0 (xG, yG, KG) m', sim.g0.map(v => f(v, 3)).join(', '));
console.log('hull envelope m3', f(Venv, 0), ' floodable m3', f(Vfl, 0), ' solids (envelope - floodable) m3', f(Venv - Vfl, 0));
console.log('weight in water, wholly flooded, by the model\'s permeabilities t', f(ms / 1000 - RHO * (Venv - Vfl) / 1000, 0));
const whole = part(-1e9, 1e9), bow = part(XB, 1e9), stern = part(-1e9, XB);
for (const [nm, p] of [['whole', whole], ['bow (x > ' + XB + ')', bow], ['stern (x < ' + XB + ')', stern]]) {
  console.log(nm.padEnd(22), 'x', f(p.xs), 'to', f(p.xf), ' L', f(p.L), ' plan m2', f(p.plan, 0), '(centroid x', f(p.xPlan) + ')', ' side m2', f(p.side, 0), '(centroid x', f(p.xSide) + ')', ' envelope m3', f(p.vol, 0), ' largest section m2', f(p.sect, 0));
}
let VflBow = 0; for (let k = 0; k < 16; k++) VflBow += zoneVmax[k] * fwdShare(k);
const mSternS = aft[0], mBowS = ms - aft[0];
console.log('structure and load (the girder\'s weight curve): bow t', f(mBowS / 1000, 0), ' centre x', f((ms * sim.g0[0] - aft[1]) / mBowS, 1), ' | stern t', f(mSternS / 1000, 0), ' centre x', f(aft[1] / aft[0], 1));
console.log('floodable: bow m3', f(VflBow, 0), ' stern m3', f(Vfl - VflBow, 0));
const wwBow = mBowS / 1000 - RHO * (bow.vol - VflBow) / 1000, wwStern = mSternS / 1000 - RHO * (stern.vol - (Vfl - VflBow)) / 1000;
console.log('weight in water wholly flooded (permeabilities): bow t', f(wwBow, 0), ' stern t', f(wwStern, 0));
console.log('weight layers (t):'); for (const l of cv.layers) console.log('  ', l.name.padEnd(52), f(l.m, 0).padStart(7), ' x', f(l.x0), 'to', f(l.x1), ' centre', f(l.xc));

// ---------------------------------------------------------------- the run
const pitchMarks = [5, 8, 10, 11, 12, 14.4, 15, 17, 17.7, 20, 25, 30, 45, 60, 68.75];
const rollMarks = [5, 10, 15, 20, 30, 45, 60, 80];
const momMarks = [4.0, 4.6, 5.0, 5.2, 5.3, 5.4];
let iP = 0, iR = 0, iM = 0, nextRow = 144 * 60, lastMom = null;
function partState(F) {
  // buoyancy of each part's envelope under the sea, water and air in each part
  const iRr = 1 / F.R22; let vB = 0, vS = 0;
  for (let i = 0; i < c.N; i++) {
    const zp = -(F.R20 * c.x[i] + F.R21 * c.y[i] + F.tz) * iRr; if (zp <= c.zlo[i]) continue;
    const v = c.dxdy[i] * ((zp >= c.zhi[i] ? c.zhi[i] : zp) - c.zlo[i]);
    if (c.x[i] >= XB) vB += v; else vS += v;
  }
  let wB = 0, wS = 0, aB = 0, aS = 0, over = 0;
  for (let n = 0; n < NN; n++) {
    const k = n >> 2, vm = ship.nodeVmax[n], v = Math.min(sim.vol[n], vm), sh = fwdShare(k);
    over += Math.max(0, sim.vol[n] - vm);
    wB += v * sh; wS += v * (1 - sh); aB += (vm - v) * sh; aS += (vm - v) * (1 - sh);
  }
  return { vB, vS, wB, wS, aB, aS, over };
}
function snap(label) {
  const F = C.frameOf(sim), P = partState(F), mo = GI.moment(sim);
  const bowTop = C.worldZ(F, C.xFwd(C.zTopAt(C.G.xFP)), 0, C.zTopAt(C.G.xFP)), sternTop = C.worldZ(F, C.G.xAP - C.G.sternOverhang, 0, C.zTopAt(C.G.xAP));
  const keelAft = C.worldZ(F, C.G.xAP, 0, 0), prop = C.worldZ(F, -127, 0, 6.5);
  // where the sea stands along the boat deck's centre line (x of the waterline at boat-deck height), and at B deck's edge
  let xBoat = null; for (let x = 130; x >= -135; x -= 0.5) { if (C.worldZ(F, x, 0, C.deckZ('Boat', x)) > 0) { xBoat = x; break; } }
  console.log(`-- ${label}: t ${f(sim.t / 60, 2)} min | trim ${f(sim.pitch * DEG, 2)} deg, list ${f(sim.roll * DEG, 2)} deg (+ = starboard down) | zO ${f(sim.zO, 2)} m, vz ${f(sim.vz, 3)} m/s, trim rate ${f(sim.wth * DEG, 3)} deg/s, roll rate ${f(sim.wph * DEG, 3)} deg/s`);
  console.log(`   hull top ${f(sim.hullTop, 1)} m, stem head ${f(bowTop, 1)} m, taffrail ${f(sternTop, 1)} m, keel at AP ${f(keelAft, 1)} m, centre screw ${f(prop, 1)} m; the sea on the boat deck's centre line reaches x ${xBoat === null ? 'nowhere (all under)' : f(xBoat, 1)}`);
  console.log(`   displaced ${f(sim.Vb, 0)} m3 of ${f(Venv, 0)} (${f(100 * sim.Vb / Venv, 1)} %); water aboard ${f((P.wB + P.wS) * RHO / 1000, 0)} t as fits, ${f(P.over * RHO / 1000, 0)} t pressed over; air ${f(P.aB + P.aS, 0)} m3 (bow ${f(P.aB, 0)}, stern ${f(P.aS, 0)})`);
  console.log(`   girder: ${f(mo.gov.M / 1e9, 2)} GN m at x ${f(mo.gov.x, 1)} (${GI.zone(mo.gov.M)})`);
  const netB = (RHO * P.vB - mBowS - RHO * P.wB) / 1000, netS = (RHO * P.vS - mSternS - RHO * P.wS) / 1000;
  console.log(`   cut at x ${XB}: bow displaces ${f(RHO * P.vB / 1000, 0)} t, weighs ${f(mBowS / 1000, 0)} + ${f(RHO * P.wB / 1000, 0)} water: net ${f(netB, 0)} t (+ floats) | stern displaces ${f(RHO * P.vS / 1000, 0)} t, weighs ${f(mSternS / 1000, 0)} + ${f(RHO * P.wS / 1000, 0)}: net ${f(netS, 0)} t; stern's reserve if wholly under ${f((RHO * stern.vol - mSternS - RHO * P.wS) / 1000, 0)} t`);
}
snap('at the damage');
console.log('\n== THE LAST MINUTES (every 30 s from T 144 min, and each mark as it is passed)');
console.log('  t min   trim    list     zO      vz    hullTop  displaced%  M GN m');
while (!sim.foundered && sim.t < 4 * 3600) {
  C.step(sim);
  const p = sim.pitch * DEG, r = Math.abs(sim.roll * DEG);
  if (sim.t >= 140 * 60 && Math.abs(sim.t % 1) < 1e-9) {
    const M = GI.moment(sim).gov.M / 1e9;
    while (iM < momMarks.length && M >= momMarks[iM]) { snap('girder moment reaches ' + momMarks[iM] + ' GN m'); iM++; }
    lastMom = M;
  }
  while (iP < pitchMarks.length && p >= pitchMarks[iP]) { snap('trim reaches ' + pitchMarks[iP] + ' deg'); iP++; }
  while (iR < rollMarks.length && r >= rollMarks[iR]) { snap('list reaches ' + rollMarks[iR] + ' deg'); iR++; }
  if (sim.t >= nextRow) {
    console.log(' ', f(sim.t / 60, 2).padStart(6), f(p, 2).padStart(6), f(sim.roll * DEG, 2).padStart(7), f(sim.zO, 2).padStart(7), f(sim.vz, 3).padStart(7), f(sim.hullTop, 1).padStart(7), f(100 * sim.Vb / Venv, 1).padStart(8), f(lastMom, 2).padStart(9));
    nextRow += 30;
  }
}
snap('FOUNDERED flag');
console.log('\n== AT THE FOUNDER FLAG, by compartment (m3): floodable, water as fits, pressed over, air; x of its middle');
let tW = 0, tA = 0, tO = 0;
for (let k = 0; k < 16; k++) {
  let vm = 0, w = 0, o = 0;
  for (let s = 0; s < 4; s++) { const n = k * 4 + s; vm += ship.nodeVmax[n]; w += Math.min(sim.vol[n], ship.nodeVmax[n]); o += Math.max(0, sim.vol[n] - ship.nodeVmax[n]); }
  tW += w; tA += vm - w; tO += o;
  console.log('  ', String(k).padStart(2), C.ZONES[k].short.padEnd(4), f(vm, 0).padStart(7), f(w, 0).padStart(7), f(o, 0).padStart(7), f(vm - w, 0).padStart(7), ' x', f(0.5 * (ZB[k] + ZB[k + 1]), 1).padStart(7), '  upper layer air', f(ship.nodeVmax[k * 4 + 1] + ship.nodeVmax[k * 4 + 3] - Math.min(sim.vol[k * 4 + 1], ship.nodeVmax[k * 4 + 1]) - Math.min(sim.vol[k * 4 + 3], ship.nodeVmax[k * 4 + 3]), 0));
}
console.log('   total: water as fits', f(tW, 0), 'm3 =', f(tW * RHO / 1000, 0), 't; pressed over', f(tO * RHO / 1000, 0), 't; air', f(tA, 0), 'm3');
console.log('   net buoyancy to spare at the flag (envelope wholly under, water as fits): t', f((RHO * Venv - ms - RHO * tW) / 1000, 0));
console.log('events:'); for (const e of sim.events) console.log('  ', f(e.t / 60, 2).padStart(7), e.label);
