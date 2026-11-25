// W6: the pockets (core/core.js: sim.pockets; the bunker of the fire, boiler room 5's empty forward starboard bunker).
//   node tools/pocket_tests.js            (about half a minute)
//   node tools/pocket_tests.js --digest   print the 1912 damage's digest with bunker 0 (to freeze REF_NO_BUNKER)
// MUST rows: neutral without it (bunker 0 gives the core before W6, to the bit, on the 1912 damage as the page runs it);
// a pocket no opening reaches changes nothing; the water is conserved with it; it fills, holds the stokehold dry
// enough for its pump, and gives way at its strength; a snapshot taken while it holds, and after, runs on to the same
// bits; its water is in her weight (the core's loads, the girder's slices). CHECK rows: her list against the record's
// points, and band A (D62) on the preset and the watch, a CHECK by D72 until D64 is settled
// (docs/DESIGN_W6_the_lists_v1_3_2026-11-20.md).
'use strict';
const crypto = require('crypto');
const C = require('../core/core.js');
const SC = require('../core/scenarios.js');
const GI = require('../core/readers/girder.js');
const W6 = require('./w6_record.js');      // Barrett's three rows of the bunker: their numbers in one place (D87)

const rows = []; let fails = 0;
function row(kind, what, value, ref, ok) { rows.push([kind, what, value, ref, ok]); if (kind === 'MUST' && !ok) fails++; }
const f = (x, n) => (x === null || x === undefined || Number.isNaN(x) ? 'n/a' : (+x).toFixed(n === undefined ? 2 : n));
const DEG = 180 / Math.PI, ship = C.buildShip();

// the 1912 damage as the page and the calibration run it (pumps, her tiers, the staircases, C3), hashed after every step
function digest(params, scen, sh) {
  const sim = C.createSim(sh || ship, params, scen || SC.PRESETS.titanic.build({}));
  const h = crypto.createHash('sha256'), b = new Float64Array(64 + 7);
  let steps = 0;
  while (!sim.foundered && sim.t < 4 * 3600) {
    C.step(sim); steps++;
    b.set(sim.vol, 0);
    b[64] = sim.zO; b[65] = sim.pitch; b[66] = sim.roll; b[67] = sim.vz; b[68] = sim.wth; b[69] = sim.wph; b[70] = sim.inflow;
    h.update(Buffer.from(b.buffer)); h.update(sim.foundered ? 'F' : 'a');
  }
  return { steps, sha: h.digest('hex').slice(0, 16), founderT: sim.founderT, sim };
}
// frozen from the core before W6 (join 3's main, 0f3f4d1), with node v26.13.0 on this machine: `--digest` there. G6b
// (2026-11-20) moved the 1912 damage's split and area and the flow numbers; the row runs the damage and the numbers the
// reference was frozen with (core/scenarios.js's TITANIC_SPLIT_GATE and GATE_AREA; S1's fit), so it stays a proof that
// bunker 0 is the core before W6, whatever the calibration does.
// The calibration epoch's B1 (the model's own pow) refroze it from 0f3f4d1 itself, its Math.pow replaced by C.pow
// (node -r tools/pow_preload.js; without the preload the same run gives the value before, 37727 steps, 97b8e5bf8f2555bd).
const REF_NO_BUNKER = { steps: 37738, sha: '6019b88b42e71c7c' };    // founders at 9,434.5 s (157.24 min)
// The calibration epoch's landing (D4) moved defaults these runs read: SC.PRE_D4 gives them back as they were; and D89
// keeps a trace of water, which these older cores zeroed (keepTrace 0).
const REF_PARAMS = Object.assign({}, SC.PRE_D4.params, { bunker: 0, wMul: 1.036, aDown: 0.2815, fOpen: 0.02068, g11: 0, keepTrace: 0 });   // G11: the paths' widths as then
const refScen = () => Object.assign(SC.PRESETS.titanic.build({ split: SC.TITANIC_SPLIT_GATE, areaTitanic: SC.GATE_AREA, bunkerOpen: null }), SC.PRE_D4.scen);
const REF_SHIP = C.buildShip({ peakTank: 0, hullEnds: 0 });         // G7: and the forepeak as one space; C3: her ends as fitted
// G7: join 6's core (17712b2), the 1912 damage as the page runs it, frozen there with this file's digest on this machine
// (node v26.13.0, 2026-11-20 23:30 CST): its defaults, and the same with join 6's numbers given (J6_*), as section 5 runs
// it so that the row stands when the calibration moves; wt/g7 (peakTank 0, g11 0) gave the same, both ways
// B1 refroze it from 17712b2 with the preload, as above (without it: 37759 steps, 08aad7cd3ebf439f, 9,439.75 s)
const REF_JOIN6 = { steps: 37749, sha: 'e2a8941d2e8b4eed' };         // founders at 9,437.25 s (157.29 min)
const J6_PARAMS = { wMul: 1.1, aDown: 0.2647, fOpen: 0.02189, g11: 0, keepTrace: 0 }, J6_AREA = 0.7853;   // join 6's calibration (D73); D89: a trace zeroed, as then
if (process.argv.includes('--digest')) { const d = digest(REF_PARAMS, refScen(), REF_SHIP); console.log(JSON.stringify({ steps: d.steps, sha: d.sha, founderT: d.founderT })); process.exit(0); }

// 1. neutral without it
{
  const d = digest(REF_PARAMS, refScen(), REF_SHIP);
  row('MUST', 'bunker 0: the 1912 damage is the core before W6, to the bit (pumps, tiers, staircases, C3: as the page runs it)', d.steps + ' steps, ' + d.sha, REF_NO_BUNKER.steps + ' steps, ' + REF_NO_BUNKER.sha + ' (0f3f4d1)', d.steps === REF_NO_BUNKER.steps && d.sha === REF_NO_BUNKER.sha);
  const s = C.createSim(REF_SHIP, { bunker: 0 }, SC.PRESETS.titanic.build({}));
  row('MUST', '  ... and it has no pocket, and the flow arrays are the 64 spaces\' own', s.pockets.length + ' pockets; ' + s._acc.length + ' places', '0; 64', s.pockets.length === 0 && s._acc.length === C.NN);
}
{ // the four forward compartments open (a damage that misses the bunker), with the coal list set as on the night
  const scen = () => Object.assign(SC.PRESETS.four.build({}), { coalListDeg: 2.0 });
  const a = digest({}, scen(), REF_SHIP), b = digest({ bunker: 0 }, scen(), REF_SHIP);   // the bunker alone (G7's tank apart)
  row('MUST', 'a pocket no opening reaches changes nothing: four compartments open, the coal list as on the night, with the bunker and without', a.sha + ' (' + a.steps + ' steps, ' + a.sim.pockets.length + ' pocket, ' + f(a.sim.pockets[0] && a.sim.pockets[0].vol, 1) + ' m3 in it)', b.sha + ' (' + b.steps + ' steps): the same bits', a.sha === b.sha && a.steps === b.steps && a.sim.pockets.length === 1 && a.sim.pockets[0].vol === 0);
}

// 2. the bunker on the 1912 damage
const run = (() => {
  const sim = C.createSim(ship, {}, SC.PRESETS.titanic.build({}));
  const k = sim.pockets[0], n = k.node, w6 = W6.tracker(sim);       // Barrett's three rows, read by tools/w6_record.js
  let inflow = 0, worst = 0, full = null, dryMax = 0, snap = null, snapAfter = null, after = null;
  const list = {};
  while (!sim.foundered && sim.t < 4 * 3600) {
    C.step(sim); w6.step();
    inflow += sim.inflow * sim.params.dt;
    let pumped = sim.pumped;
    let water = 0; for (const q of sim.pockets) water += q.vol; for (let m = 0; m < C.NN; m++) water += sim.vol[m];   // every pocket's (G7's tank too)
    worst = Math.max(worst, Math.abs(water + pumped - inflow));
    if (full === null && k.vol >= k.cap) full = sim.t;
    if (k.state === 0) dryMax = Math.max(dryMax, sim.vol[n] + sim.vol[n - 2]);
    if (snap === null && sim.t >= 30 * 60) snap = { k: Math.round(sim.t / sim.params.dt), d: C.serialize(sim) };
    if (snapAfter === null && k.state === 1 && sim.t >= k.t + 60) snapAfter = { k: Math.round(sim.t / sim.params.dt), d: C.serialize(sim) };
    const T = Math.round(sim.t / 60 * 4) / 4; if ([5, 10, 30, 60, 85, 100, 120, 130, 145].includes(T) && list[T] === undefined) list[T] = sim.roll * DEG;
    if (after === null && k.state === 1) after = { t: sim.t, stokehold: sim.vol[n] + sim.vol[n - 2] };
  }
  return { sim, k, inflow, worst, full, dryMax, snap, snapAfter, after, list, w6: W6.verdict(w6.result()) };
})();
{
  const { k, worst, full, dryMax, after, w6 } = run;
  row('MUST', 'the bunker on the 1912 damage: the water is conserved with it (her spaces and the pocket, against what came in less what was pumped)', 'at worst ' + worst.toExponential(2) + ' m3', 'within 1e-5 m3', worst < 1e-5);
  row('MUST', '  ... it fills to its capacity from the hull\'s openings inside it', 'capacity ' + f(k.cap, 1) + ' m3 (from the hull\'s form: ' + f(k.x0, 2) + ' to ' + f(k.x1, 2) + ' m, ' + f(k.z0, 2) + ' to ' + f(k.z1, 2) + ' m up); full at T ' + f(full / 60, 1), 'full within 30 minutes; 250 to 270 m3 (the research note: half of 500 to 540)', w6.fills && k.cap > 240 && k.cap < 280);
  row('MUST', '  ... while it holds, its door\'s leak is less than the stokehold\'s pump: boiler room 5 stays workable', 'the stokehold\'s water at most ' + f(dryMax, 1) + ' m3 while it held', 'under 20 m3 (Barrett: the pumps kept boiler room 5 workable)', w6.workable);
  row('MUST', '  ... and gives way at its strength, its water into the stokehold at once', after ? 'at T ' + f(k.t / 60, 2) + ' (strength ' + run.sim.params.bunkerBurst + ' m of head); the stokehold then ' + f(after.stokehold, 1) + ' m3' : 'never', 'within T 50 to 75 (the pumps note: "the bunker door burst at about 12:40 (T 60)"; the Report: "about an hour"; the head peaks at T 73: e76); the stokehold holds its water', w6.burst);
}
{ // snapshots: one taken while it holds (T 30), one after it has gone. A snapshot carries the pocket: restored, its water,
  // state and openings are the snapshot's, and two restores of one snapshot run on to the same bits. (restore solves the
  // levels again to the tight tolerance, so a restored run is not the run itself to the bit, before W6 as after: on
  // 0f3f4d1 the 1912 damage restored at T 30 founders at 9,433.25 s against 9,431.75 s.)
  const go = (s) => { const r = C.restore(ship, s.d); const k0 = { vol: r.pockets[0].vol, state: r.pockets[0].state, routed: Array.from(r.conn.pk.slice(0, r.conn.n)).filter(j => j === 0).length }; while (!r.foundered && r.t < 4 * 3600) C.step(r); return { r, k0 }; };
  const res = [run.snap, run.snapAfter].map(s => {
    if (!s) return null;
    const a = go(s), b = go(s), d = s.d.pockets[0];
    const carried = a.k0.vol === d.vol && a.k0.state === d.state && (d.state === 0 ? a.k0.routed > 0 : a.k0.routed === 0);
    const same = a.r.founderT === b.r.founderT && a.r.roll === b.r.roll && a.r.vol.every((v, i) => v === b.r.vol[i]);
    return { carried, same, founderT: a.r.founderT, routed: a.k0.routed, state: d.state };
  });
  const ok = res.every(x => x && x.carried && x.same);
  row('MUST', 'a snapshot carries the pocket: taken while it holds (T 30) and after it gave way, restored, its water, state and openings are the snapshot\'s; two restores run on to the same bits',
    res.map((x, i) => !x ? 'no snapshot' : (i ? 'after: ' : 'holding: ') + x.routed + ' openings into it, ' + (x.carried ? 'carried' : 'NOT carried') + ', ' + (x.same ? 'the same bits twice' : 'DIFFERENT') + ', founders at ' + f(x.founderT, 2) + ' s').join('; '),
    'carried, the same bits twice (the run itself: ' + f(run.sim.founderT, 2) + ' s; restore is not the run to the bit, as before W6)', ok);
}
{ // her weight: the core's loads and the girder's slices both carry the pocket's water
  const sim = C.createSim(ship, {}, SC.PRESETS.titanic.build({}));
  while (sim.pockets[0].vol < 100) C.step(sim);
  const D = GI.shipData(ship), L = GI.moment(sim, { loads: true }).loads;   // the flood water by slice, t a metre
  let slices = 0; for (let j = 0; j < D.nS; j++) slices += L.f[j] * D.dx[j] * 1000 / C.RHO;
  // the slices weigh her water as loads does (C5: with weighOverfill 0, the default since the epoch's landing, a full
  // space or pocket at its capacity), so the spaces' and the pockets' water are taken as weighed
  const cut = !sim.params.weighOverfill;
  let spaces = 0; for (let m = 0; m < C.NN; m++) spaces += cut ? Math.min(sim.vol[m], ship.nodeVmax[m]) : sim.vol[m];
  const pocket = sim.pockets.reduce((a, q) => a + (cut ? Math.min(q.vol, q.cap) : q.vol), 0);           // every pocket's (G7's tank too)
  row('MUST', 'her weight carries the pockets\' water: the girder\'s slices hold her spaces\' water and the pockets\'', f(slices, 3) + ' m3 in the slices against ' + f(spaces, 3) + ' + ' + f(pocket, 3) + ' (the pockets: ' + sim.pockets.map(q => f(q.vol, 1)).join(' + ') + ')', 'equal to 1e-6 of the water', Math.abs(slices - spaces - pocket) < 1e-6 * (spaces + pocket));
}

// 3. her list against the record's points
{
  const L = run.list, rec = [[10, 5, 'Hichens, the inclinometer'], [85, 2, 'Symons, slight'], [100, 0, 'Halpern'], [120, -6, 'Rowe'], [130, -10, 'Halpern'], [145, -15, 'Halpern']];
  for (const [T, r, who] of rec) row('CHECK', 'her list at T ' + T + ' (+ starboard)', f(L[T], 2) + ' deg', r + ' (' + who + ')', L[T] !== undefined && Math.abs(L[T] - r) <= (Math.abs(r) >= 10 ? 5 : 3));
}

// 4. W6's band A (D62: Hichens's +3 to +7 early, the change of side between T 85 and T 110, Rowe's -3 to -9 at T 120),
// on the 1912 damage preset and on the 1912 watch. D72 (2026-11-20, docs/DESIGN_W6_the_lists_v1_3_2026-11-20.md) made
// its rows CHECKs, printed and failing visibly, until D64's tunnel height is settled; they return to MUST in the commit
// that settles it. The change of side is the last time she goes over to port past half a degree, before T 150.
{
  const N = require('../core/night.js');
  const trace = (sim, step, t0of, done) => {
    const at = {}; let lastPort = null, side = 0;
    while (!done(sim)) {
      step(sim);
      const t0 = t0of(sim); if (t0 < 0) continue;
      const T = (sim.t - t0) / 60, r = sim.roll * DEG;
      for (const m of [10, 120]) if (at[m] === undefined && T >= m) at[m] = r;
      const s = r > 0.5 ? 1 : (r < -0.5 ? -1 : 0);
      if (T < 150 && s === -1 && side !== -1) lastPort = T;
      if (s !== 0) side = s;
    }
    return { at, lastPort };
  };
  const band = (lab, b) => {
    row('CHECK', 'band A, ' + lab + ': early, Hichens +3 to +7 (T 10, + starboard)', f(b.at[10], 2) + ' deg', '+3 to +7 (D62; a CHECK by D72)', b.at[10] >= 3 && b.at[10] <= 7);
    row('CHECK', 'band A, ' + lab + ': over to port for good between T 85 and T 110', b.lastPort === null ? 'never' : 'T ' + f(b.lastPort, 1), 'T 85 to 110 (D62; a CHECK by D72)', b.lastPort !== null && b.lastPort >= 85 && b.lastPort <= 110);
    row('CHECK', 'band A, ' + lab + ': Rowe -3 to -9 (T 120)', f(b.at[120], 2) + ' deg', '-3 to -9 (D62; a CHECK by D72)', b.at[120] <= -3 && b.at[120] >= -9);
  };
  band('the preset', trace(C.createSim(ship, {}, SC.PRESETS.titanic.build({})), C.step, () => 0, (s) => s.foundered || s.t > 5 * 3600));
  band('the watch', trace(N.create(ship, N.spec(1912), { auto: true, readers: false }), N.step, (s) => s.night.tTouch, (s) => N.over(s) || s.t > 5 * 3600));
}

// 5. G7: the forepeak's tank (docs/DESIGN_G7_the_forepeak_tank_v1_2026-11-20.md). Without it (peakTank 0, and G11's
// widths off) the 1912 damage is join 6's core to the bit; with it the tank fills from its hole and holds, the
// forepeak's own space (from the orlop up) is dry for the first ten minutes (the Report: "not flooded above the Orlop
// deck"), and water comes up the tank's vent only once the tank is full (Hemming, BI 17716-33: the vent blowing hard
// and the storerooms above dry soon after the jar)
{
  const N = require('../core/night.js');
  const d = digest(Object.assign({}, SC.PRE_D4.params, J6_PARAMS), Object.assign(SC.PRESETS.titanic.build({ areaTitanic: J6_AREA, bunkerOpen: null }), SC.PRE_D4.scen), C.buildShip({ peakTank: 0, hullEnds: 0 }));   // D4's defaults as before (SC.PRE_D4)
  row('MUST', 'peakTank 0 (and G11\'s widths off): the 1912 damage is join 6\'s core, to the bit', d.steps + ' steps, ' + d.sha, REF_JOIN6.steps + ' steps, ' + REF_JOIN6.sha + ' (17712b2)', d.steps === REF_JOIN6.steps && d.sha === REF_JOIN6.sha);
  const fore = (lab, sim, step, t0of, done) => {
    const tank = sim.pockets.find(k => k.name === 'the forepeak tank'), n0 = C.nodeIndex(0, 0, 0), n1 = C.nodeIndex(0, 1, 0);
    let dry10 = 0, full = null, vent0 = null, vent30 = 0;
    while (!done(sim)) {
      step(sim); const t0 = t0of(sim); if (t0 < 0) continue;
      const T = (sim.t - t0) / 60;
      if (T <= 10) dry10 = Math.max(dry10, sim.vol[n0] + sim.vol[n1]);
      if (full === null && tank.vol >= tank.cap) full = T;
      if (tank.dV > 0 && vent0 === null) vent0 = T;
      if (T <= 30 && tank.dV > 0) vent30 += tank.dV;
      if (T > 40) break;
    }
    row('MUST', 'G7, ' + lab + ': the forepeak\'s own space is dry for the first ten minutes (the Report: "not flooded above the Orlop deck")', 'at most ' + f(dry10, 3) + ' m3 by T 10', 'under 0.5 m3', dry10 < 0.5);
    row('MUST', 'G7, ' + lab + ': the tank fills from its hole and holds', 'full (' + f(tank.cap, 0) + ' m3) at T ' + (full === null ? 'never' : f(full, 1)) + '; ' + (tank.state === 0 ? 'holding' : 'given way'), 'full within 40 minutes; holding', full !== null && tank.state === 0);
    row('CHECK', 'G7, ' + lab + ': water comes up the tank\'s vent only once it is full, after Hemming found the stores dry', 'from T ' + (vent0 === null ? 'never' : f(vent0, 1)) + '; ' + f(vent30, 2) + ' m3 by T 30', 'after T 10 (Hemming: soon after the jar, the stores dry; the vent blowing air hard)', vent0 === null || vent0 > 10);
  };
  fore('the preset', C.createSim(ship, {}, SC.PRESETS.titanic.build({})), C.step, () => 0, (s) => s.foundered || s.t > 5 * 3600);
  fore('the watch', N.create(ship, N.spec(1912), { auto: true, readers: false }), N.step, (s) => s.night.tTouch, (s) => N.over(s) || s.t > 5 * 3600);
}

// 6. G7 (QC B-3, A-6): one count of the water for every mirror of it. A holding pocket keeps its water outside
// sim.vol; C.spaceWater(sim, n) is space n's water with its pockets', and over the 64 spaces it must be the water the
// core reports (C.readouts(sim).waterM3) while the bunker and the tank both hold. A mirror that sums sim.vol alone
// misses the pockets' water: the CHECK row says how much (the fall's hand-over, rooms.js, the walk and U0's record
// adopt C.spaceWater after join 7; motion.js's syncMass with the calibration epoch, since it moves the watch)
{
  const sim = C.createSim(ship, {}, SC.PRESETS.titanic.build({}));
  const tank = sim.pockets.find(k => k.name === 'the forepeak tank'), bunker = sim.pockets.find(k => k !== tank);
  const n0 = C.nodeIndex(0, 0, 0), n1 = C.nodeIndex(0, 1, 0);
  let gap = 0, halves = 0, both = true, miss = '', missOk = true;
  for (const T of [10, 30, 50]) {
    while (sim.t < T * 60 && !sim.foundered) C.step(sim);
    let sw = 0, sv = 0, sp = 0;
    for (let n = 0; n < C.NN; n++) { sw += C.spaceWater(sim, n); sv += sim.vol[n]; }
    for (const k of sim.pockets) sp += k.vol;
    const w = C.readouts(sim).waterM3;
    gap = Math.max(gap, Math.abs(sw - w));
    halves = Math.max(halves, Math.abs(C.spaceWater(sim, n0) - sim.vol[n0] - 0.5 * tank.vol), Math.abs(C.spaceWater(sim, n1) - sim.vol[n1] - 0.5 * tank.vol));
    both = both && tank.state === 0 && bunker.state === 0 && tank.vol > 1 && bunker.vol > 1;
    if (T === 30) miss = f(w - sv, 1) + ' m3 of ' + f(w, 0) + ' at T 30 (the tank ' + f(tank.vol, 1) + ', the bunker ' + f(bunker.vol, 1) + ')';
    missOk = missOk && Math.abs(w - sv - sp) < 1e-6;
  }
  row('MUST', 'G7 (QC B-3): the 64 spaces\' water with their pockets\' (C.spaceWater) is the water the core reports, the bunker and the tank holding', 'largest gap ' + gap.toExponential(2) + ' m3 at T 10, 30, 50; ' + (both ? 'both pockets holding' : 'a pocket empty or given way'), 'under 1e-6 m3, both holding', gap < 1e-6 && both);
  row('MUST', 'G7: the tank (of both sides) counts half to each half of the forepeak', 'largest error ' + halves.toExponential(2) + ' m3', 'under 1e-9 m3', halves < 1e-9);
  row('CHECK', 'G7: what a mirror summing sim.vol alone misses (the pockets\' water) until it adopts C.spaceWater', miss, 'the fall, rooms.js, the walk, U0\'s record after join 7; syncMass in the epoch', missOk);
}

// 7. The calibration epoch's C1 (QC A-6): with motion.js's SHIP.massPockets on, her mass under way is the ship's and
// every body of water's (C.eachWater), so it is the ship's mass plus 1025 times the water the core reports while the
// bunker and the tank hold; off (the default until the epoch's landing), the watch is as it was (systems_tests' BASE)
{
  const Mo = require('../core/motion.js'), N = require('../core/night.js'), keep = Mo.SHIP.massPockets;
  const at = (on) => {
    Mo.SHIP.massPockets = on;
    try {
      // the motion takes her mass at the start of a step, from the water as the core left it: compare with the water
      // before the last step (one step's inflow, about 0.9 m3 at T 30, is the difference otherwise)
      // her mass takes the water as loads weighs it (C5: since the epoch's landing weighOverfill is 0, a full space at its
      // capacity), so the gap is read against the weighed water; the agreement with the readouts against all of it
      const sim = N.create(ship, N.spec(1912), { auto: true, readers: false });
      const weighed = (s) => { let v = 0; C.eachWater(s, (V) => { v += V; }, true); return v; }, water = (s) => { let v = 0; C.eachWater(s, (V) => { v += V; }); return v; };
      let wPrev = 0;
      while (sim.night.tTouch < 0 || sim.t - sim.night.tTouch < 30 * 60) { wPrev = weighed(sim); N.step(sim); }
      return { gap: (sim.mo.mass - sim.ms) - C.RHO * wPrev, mass: sim.mo.mass, held: sim.pockets.filter(k => k.state === 0 && k.vol > 1).length, agree: Math.abs(water(sim) - C.readouts(sim).waterM3) };
    } finally { Mo.SHIP.massPockets = keep; }
  };
  const on = at(1), off = at(0);
  row('MUST', 'C1: with SHIP.massPockets on, her mass under way is the ship\'s plus 1025 times her water, every body of it (C.eachWater, which is the water the core reports), the pockets holding (T 30 on the 1912 watch)', 'off by ' + on.gap.toExponential(2) + ' kg of ' + (on.mass / 1e6).toFixed(3) + ' kt; C.eachWater against readouts ' + on.agree.toExponential(1) + ' m3; ' + on.held + ' pockets holding', 'within 1e-9 of her mass; eachWater within 1e-6 m3 of readouts; both pockets holding', Math.abs(on.gap) < 1e-9 * on.mass && on.agree < 1e-6 && on.held === 2);
  row('CHECK', '  ... and off (today\'s sum of sim.vol), what it leaves out then', (-off.gap / 1000).toFixed(1) + ' t (the pockets\' water)', 'the tank\'s and the bunker\'s, until the epoch lands', off.gap < 0);
}

// 8. The calibration epoch's C5: with params.weighOverfill 0 a full space or pocket weighs its capacity (the excess is the
// sea's head on a stiff virtual area, not water). The switch acts on the over-fill alone: the 1912 damage runs to the bit
// as today until the first step in which some space or pocket is over full; then the rung (its founder) is printed
{
  const over = (s) => { for (let n = 0; n < C.NN; n++) if (s.vol[n] > ship.nodeVmax[n]) return true; for (const k of s.pockets) if (k.vol > k.cap) return true; return false; };
  const a = C.createSim(ship, {}, SC.PRESETS.titanic.build({})), b = C.createSim(ship, { weighOverfill: 0 }, SC.PRESETS.titanic.build({}));
  let k = 0, same = true, k0 = -1;
  // a step weighs the water its own flows leave, so the step at whose end a space is first over full already differs: the
  // runs are compared up to the step before it
  while (!a.foundered && !b.foundered && a.t < 5 * 3600 && k0 < 0) {
    C.step(a); C.step(b); k++;
    if (over(a)) { k0 = k; break; }
    for (let n = 0; same && n < C.NN; n++) same = a.vol[n] === b.vol[n]; same = same && a.zO === b.zO && a.pitch === b.pitch && a.roll === b.roll;
  }
  while (!a.foundered && a.t < 5 * 3600) C.step(a);
  while (!b.foundered && b.t < 5 * 3600) C.step(b);
  row('MUST', 'C5: with weighOverfill 0 the 1912 damage is today\'s to the bit until the first step any space or pocket is over full', (same ? 'the same' : 'DIFFERENT') + ' to step ' + k0 + ' (T ' + (k0 * 0.25 / 60).toFixed(1) + ')', 'the same', same && k0 > 0);
  row('CHECK', '  ... and the rung: her founder with the over-fill weighed at capacity', 'T ' + (b.founderT / 60).toFixed(2) + ' against ' + (a.founderT / 60).toFixed(2) + ' today (' + ((b.founderT - a.founderT) / 60 >= 0 ? '+' : '') + ((b.founderT - a.founderT) / 60).toFixed(2) + ' min)', 'as it comes (the epoch\'s refit absorbs it)', true);
}

// 9. The calibration epoch's C6 (D82b): the bunker's own opening, a build option of the 1912 damage (bunkerOpen, m2;
// core/scenarios.js). Absent, the damage is today's to the bit; given, boiler room 5's holes total it, where they were,
// and every other compartment's are as they are. CHECK: when the bunker gives way at today's strength over D82a's range
// of openings (0.003 m2, one deck-hose stream, to 0.085, Hackett and Bedford's share)
{
  const scen = (o) => SC.PRESETS.titanic.build(o), build = (o) => scen(o).openings, same = (a, b) => a.length === b.length && a.every((o, i) => Object.keys(o).length === Object.keys(b[i]).length && Object.keys(o).every(key => Object.is(o[key], b[i][key])));
  const inBunker = (o) => C.zoneAt(o.x) === SC.BUNKER_ZONE, sum = (ops, pick) => ops.filter(pick).reduce((a, o) => a + o.area, 0);
  // absent: the same arrays, and join 6's frozen run through the option given as null (section 5's row, by the new door)
  // since the epoch's landing (D4) "absent" is the landed opening (SC.BUNKER_OPEN_1912) and null is the region's share,
  // as absent was before: null and the share given are the same openings, absent and the landed number given too
  const today = build({ bunkerOpen: null }), share = sum(today, inBunker);
  const d = digest(Object.assign({}, SC.PRE_D4.params, J6_PARAMS), Object.assign(scen({ areaTitanic: J6_AREA, bunkerOpen: null }), SC.PRE_D4.scen), C.buildShip({ peakTank: 0, hullEnds: 0 }));
  const arrays = same(today, build({ bunkerOpen: share })) && same(build({}), build({ bunkerOpen: SC.BUNKER_OPEN_1912 })) && same(build({}), build({ bunkerOpen: undefined }));
  row('MUST', 'C6: bunkerOpen null, the 1912 damage is the region\'s share to the bit (null, and that share given: the same openings; absent, the landed opening; join 6\'s run with it null)', (arrays ? 'the same openings' : 'DIFFERENT openings') + '; ' + d.steps + ' steps, ' + d.sha, 'the same; ' + REF_JOIN6.steps + ' steps, ' + REF_JOIN6.sha + ' (17712b2)', arrays && d.steps === REF_JOIN6.steps && d.sha === REF_JOIN6.sha);
  // given: half of 0.085 m2
  const B = 0.085, half = build({ bunkerOpen: 0.5 * B }), full = build({ bunkerOpen: B });
  const others = same(today.filter(o => !inBunker(o)), half.filter(o => !inBunker(o))), place = today.length === half.length && today.every((o, i) => o.x === half[i].x && o.y === half[i].y && o.z === half[i].z);
  const tot = (ops) => ops.reduce((a, o) => a + o.area, 0);
  row('MUST', 'C6: bunkerOpen 0.085 x 0.5 halves the bunker\'s openings\' total; every other compartment\'s openings and every hole\'s place are today\'s; the whole opening moves by the difference',
    f(sum(half, inBunker), 6) + ' m2 against ' + f(sum(full, inBunker), 6) + ' at 0.085 (today\'s share ' + f(share, 6) + ', ' + today.filter(inBunker).length + ' hole or holes); the whole ' + f(tot(half), 6) + ' against ' + f(tot(today), 6) + ' m2', '0.042500 against 0.085000; the whole less by today\'s share - 0.0425',
    Math.abs(sum(half, inBunker) - 0.5 * B) < 1e-15 && Math.abs(sum(full, inBunker) - B) < 1e-15 && others && place && Math.abs(tot(today) - tot(half) - (share - 0.5 * B)) < 1e-12);
  // the bunker at an opening: every one of its holes fills it, when it is full, the stokehold while it holds, when it goes
  const at = (bunkerOpen) => {
    const sim = C.createSim(ship, {}, scen(bunkerOpen === null ? {} : { bunkerOpen })), k = sim.pockets[0], n = k.node;
    let fullT = null, dryMax = 0, routed = -1;
    while (!sim.foundered && sim.t < 5 * 3600 && k.state === 0) {
      C.step(sim);
      if (routed < 0) routed = Array.from(sim.conn.pk.slice(0, sim.conn.n)).filter(j => j === 0).length;
      if (fullT === null && k.vol >= k.cap) fullT = sim.t;
      if (k.state === 0) dryMax = Math.max(dryMax, sim.vol[n] + sim.vol[n - 2]);
    }
    return { k, fullT, dryMax, routed, burst: k.state === 1 ? k.t : null, founderT: sim.foundered ? sim.founderT : null, vol: k.vol };
  };
  const h = at(0.5 * B), nB = today.filter(inBunker).length;
  // D90 (b), the coordinator 2026-11-23 10:38: a CHECK since the epoch's landing. It is a mechanism what-if at an opening
  // that is not the landed one (BUNKER_OPEN_1912), and D87 binds Barrett's rows at the landed numbers (section 2's, which
  // the landed member passes). It prints the stokehold's peak, so that it fails visibly
  row('CHECK', '  ... and at 0.0425 m2 (a what-if) the bunker still fills from every one of its holes, and holds: the stokehold workable until it gives way', h.routed + ' openings into it; full at T ' + f(h.fullT / 60, 1) + '; the stokehold\'s water at most ' + f(h.dryMax, 1) + ' m3 while it held (its peak); ' + (h.burst === null ? 'it never gives way' : 'it gives way at T ' + f(h.burst / 60, 2)),
    nB + ' openings; full; under 20 m3 (section 2\'s row); it gives way after it is full', h.routed === nB && h.fullT !== null && h.dryMax < 20 && h.burst !== null && h.burst >= h.fullT);
  const strength = C.DEFAULT_PARAMS.bunkerBurst, mins = [0.003, 0.01, 0.03, B].map(a => [a, at(a)]), t0 = at(null);
  row('CHECK', 'C6: when the bunker gives way at today\'s strength (' + strength + ' m of head), by its own opening',
    mins.map(([a, r]) => a + ' m2: ' + (r.burst === null ? 'never (' + f(100 * r.vol / r.k.cap, 0) + ' % full' + (r.founderT === null ? '' : ' when she founders at T ' + f(r.founderT / 60, 1)) + ')' : 'T ' + f(r.burst / 60, 2) + ' (full at T ' + f(r.fullT / 60, 1) + ')')).join('; ') + '; today\'s share (' + f(share, 4) + ' m2): T ' + (t0.burst === null ? 'never' : f(t0.burst / 60, 2)),
    'T 60 to 90 (the Report\'s "about an hour"; Barrett\'s 1:10); stage D samples the opening with the strength (D82a)', mins.every(([, r]) => r.burst !== null && r.burst / 60 >= 60 && r.burst / 60 <= 90));
}

const w0 = Math.max(...rows.map(r => r[1].length)) + 2;
for (const [kind, what, value, ref, ok] of rows) console.log((ok ? 'PASS' : (kind === 'MUST' ? 'FAIL' : 'out ')) + ' ' + kind.padEnd(5) + ' ' + what.padEnd(Math.min(w0, 110)) + ' ' + String(value).padEnd(60) + ' ' + ref);
const nm = rows.filter(r => r[0] === 'MUST').length, nc = rows.filter(r => r[0] === 'CHECK'), inR = nc.filter(r => r[4]).length;
console.log(fails ? 'FAIL: ' + fails + ' of ' + nm + ' MUST rows' : 'PASS: every MUST row (' + nm + '); CHECK rows in range: ' + inR + ' of ' + nc.length);
process.exit(fails ? 1 : 0);
