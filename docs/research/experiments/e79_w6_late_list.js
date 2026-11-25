// e79 (W6, Part B): what could carry her late port list (the record: -6 at T 120, Rowe; -10 and -15 at T 130 and 145,
// Halpern from qualitative witnesses) on the 1912 damage preset, with the bunker of the fire (Part A) in:
//   - the forward port gangway door, opened from inside at about 12:30 to 12:45 by Lightoller's bosun's mate and six
//     men and not shut again (HANDOFF.md 4b; the lists research note, mechanism 4: National Geographic 2019 says it
//     could not be shut against the list and the sea reached it by about 1:50 [read]); here a door in her port side at
//     E deck (the note, 4.3: the port side's one gangway door is on E deck [read]), its place and size what-ifs;
//   - her tiers above B deck (S1): the ship built without them, to see what their buoyancy does late;
//   - the coal list at 3 degrees (the research note's 1.9 to 3.1).
// Her GM at T 130 and 145 is C.gmNow on a restored copy (the run is untouched).
//   node docs/research/experiments/e79_w6_late_list.js [worktree]   (about half a minute)
const path = require('path');
const root = process.argv[2] || path.join(__dirname, '..', '..', '..');
const C = require(path.join(root, 'core', 'core.js'));
const SC = require(path.join(root, 'core', 'scenarios.js'));
const DEG = 180 / Math.PI;
const door = (x, area, tMin) => ({ x, y: C.halfBreadth(x, C.deckZ('E', x) + 0.3) + 0.02, z: C.deckZ('E', x) + 0.3, area, kind: 'porthole', tOpen: tMin * 60, label: 'the forward port gangway door (what-if)' });
const VARIANTS = [
  ['the bets (Part A)', {}, null, () => SC.PRESETS.titanic.build({})],
  ['+ port gangway door at x 100, 2.2 m2, open from T 55', {}, null, () => { const s = SC.PRESETS.titanic.build({}); s.openings.push(door(100, 2.2, 55)); return s; }],
  ['+ port gangway door at x 85, 2.2 m2, open from T 55', {}, null, () => { const s = SC.PRESETS.titanic.build({}); s.openings.push(door(85, 2.2, 55)); return s; }],
  ['+ port gangway door at x 85, 1.1 m2 (half), from T 55', {}, null, () => { const s = SC.PRESETS.titanic.build({}); s.openings.push(door(85, 1.1, 55)); return s; }],
  ['+ port gangway door at x 65, 2.2 m2, open from T 55', {}, null, () => { const s = SC.PRESETS.titanic.build({}); s.openings.push(door(65, 2.2, 55)); return s; }],
  ['without her tiers (tiers 0, stairs 0)', { stairs: 0 }, { tiers: 0 }, () => SC.PRESETS.titanic.build({})],
  ['coal list 3 degrees', {}, null, () => Object.assign(SC.PRESETS.titanic.build({}), { coalListDeg: 3.0 })],
];
const MARKS = [10, 60, 85, 100, 110, 120, 130, 140, 145, 150, 155];
const f = (x) => (x === undefined || !isFinite(x) ? '  -  ' : (x >= 0 ? '+' : '') + x.toFixed(1));
console.log('e79 on ' + root);
console.log('variant'.padEnd(56) + MARKS.map(m => ('T' + m).padStart(6)).join('') + '   GM130  GM145  founds  the door under at');
for (const [name, params, shipOpts, scen] of VARIANTS) {
  const ship = C.buildShip(shipOpts || {});
  const sim = C.createSim(ship, params, scen());
  const L = {}, gm = {}; let doorT = null;
  const d = sim.openings.find(o => /gangway/.test(o.label));
  while (!sim.foundered && sim.t < 5 * 3600) {
    C.step(sim);
    const T = sim.t / 60;
    for (const m of MARKS) if (L[m] === undefined && T >= m) L[m] = sim.roll * DEG;
    for (const m of [130, 145]) if (gm[m] === undefined && T >= m) gm[m] = C.gmNow(C.restore(ship, C.serialize(sim)));
    if (d && doorT === null && T * 60 >= d.tOpen) { const F = C.frameOf(sim); if (C.worldZ(F, d.x, d.y, d.z) < 0) doorT = T; }
  }
  console.log(name.padEnd(56) + MARKS.map(m => f(L[m]).padStart(6)).join('') + '   ' + (gm[130] === undefined ? '  -  ' : gm[130].toFixed(2)) + '   ' + (gm[145] === undefined ? '  -  ' : gm[145].toFixed(2)) + '   ' + (sim.foundered ? (sim.founderT / 60).toFixed(2) : '  -   ') + '   ' + (d ? (doorT === null ? 'never' : 'T ' + doorT.toFixed(1)) : ''));
}
