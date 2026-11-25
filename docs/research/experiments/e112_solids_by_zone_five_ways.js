'use strict';
// e112: the fall with her solids by zone from B1+B2's item list (K.solids 'items', D(G12-e) step 3, a what-if; the
// wood afloat or soaked) against the core's (K.solids 'core', the default), each let go trial 14's five ways (as she is;
// her heave rate at the flag x0.85 and x1.18; her roll 3 deg to port and to starboard), on the 1912 preset and the 1912
// watch at their flags, the lumped pocket as the default carries her air (Z1, 2026-11-21). Per run: each piece's lever
// and weight in water at the hand-over, where it lands from the point under the break and which way up, when it
// strikes. The record: the bow 772 m and the stern 148 m from the point under the break (R5 10a), both upright (R5 1.1).
//   node docs/research/experiments/e112_solids_by_zone_five_ways.js
// Output of 2026-11-21 (its stdout): results_2026-11-21/e112_solids_by_zone_five_ways.txt
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const C = require(path.join(ROOT, 'core/core.js')), N = require(path.join(ROOT, 'core/night.js')), SC = require(path.join(ROOT, 'core/scenarios.js'));
for (const r of ['girder.js', 'section.js', 'onset.js', 'people.js', 'reports.js', 'world.js']) require(path.join(ROOT, 'core/readers', r));
const F = require(path.join(ROOT, 'core/readers/fall.js')), GI = require(path.join(ROOT, 'core/readers/girder.js'));
const DEG = Math.PI / 180;
const f = (v, d) => Number.isFinite(v) ? v.toFixed(d) : String(v);
const word = (q) => { const R = F.quatR(q, new Float64Array(9)), roll = Math.abs(Math.atan2(R[7], R[8]) / DEG); return roll <= 45 ? 'upright' : (roll >= 135 ? 'upside down' : 'on her side'); };
const WAYS = [['as she is', null], ['heave rate x0.85', (s) => { s.vz *= 0.85; }], ['heave rate x1.18', (s) => { s.vz *= 1.18; }], ['roll 3 deg to port', (s) => { s.roll -= 3 * DEG; }], ['roll 3 deg to starboard', (s) => { s.roll += 3 * DEG; }]];
const SOLIDS = [['core', {}], ['items, afloat', { solids: 'items', wood: 'afloat' }], ['items, soaked', { solids: 'items', wood: 'soaked' }]];

function five(name, sim, opts) {
  console.log(name);
  for (const [sl, K] of SOLIDS) for (const [wl, change] of WAYS) {
    const keep = { vz: sim.vz, roll: sim.roll };
    if (change) change(sim);
    const fall = F.begin(sim, Object.assign({}, opts, { K }));
    sim.vz = keep.vz; sim.roll = keep.roll;
    const lev = fall.eng.bodies.map(b => F.leverOf(b));
    while (!fall.done && fall.k < 4 * 60 * 30) F.advance(fall);
    const out = fall.pieces.map((p, i) => {
      const w = F.worldOf(fall, i, [0.5 * (p.x0 + p.x1), 0, GI.Z_NA]), dX = w[0] - fall.breakAt[0], dY = w[1] - fall.breakAt[1], s = fall.events.find(e => e.id === 'strike' && e.piece === p.id);
      return p.id + ' ' + f(lev[i].lever, 2) + ' m ' + f(lev[i].wIn / 1000, 0) + ' t: ' + f(Math.hypot(dX, dY), 0) + ' m (' + f(dX, 0) + ', ' + f(dY, 0) + ') ' + word(p.q) + ', +' + f(s ? (s.t - fall.t0) / 60 : NaN, 2) + ' min';
    });
    console.log('  ' + sl.padEnd(14) + wl.padEnd(24) + out.join(' | ') + (fall.done ? '' : ' NOT DONE'));
  }
}

const simF = C.createSim(C.buildShip(), {}, SC.PRESETS.titanic.build());
while (!simF.foundered) C.step(simF);
five('the 1912 preset at its flag (T ' + f(simF.founderT / 60, 2) + ' min): solids, way | each piece: lever, weight in water: where it lands (along, across), way up, strikes', simF, {});
const sw = N.create(C.buildShip(), N.spec(1912), { auto: true });
while (!N.over(sw)) N.step(sw);
five('the 1912 watch at its flag (step ' + sw.night.k + ', T ' + f(sw.founderT / 60, 2) + ' min)', sw, { t0: sw.founderT });
