// e85: the model's room-by-room times on the 1912 watch, against the record's (the research notes' sources): when the
// water in each compartment first stands a given depth over its floor (0.3 m: "over the plates"; 2.44 m: 8 ft, boiler
// room 6 at T 10 by Barrett), when it first has any (1 m3), and when water reaches E deck there; the stokehold of
// boiler room 5 against Barrett's dry plates. Run on two worktrees to compare main with a preview.
//   node docs/research/experiments/e85_room_by_room.js <worktree> ['{"wMul":..,"aDown":..,"fOpen":..}']
const path = require('path');
const root = process.argv[2] || path.join(__dirname, '..', '..', '..');
const params = JSON.parse(process.argv[3] || '{}');
const C = require(path.join(root, 'core', 'core.js'));
const N = require(path.join(root, 'core', 'night.js'));
const ship = C.buildShip();
const sim = N.create(ship, N.spec(1912), { auto: true, readers: false, params });
const ZS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const first = {}, mark = (key, t) => { if (first[key] === undefined) first[key] = t; };
while (!N.over(sim) && sim.t < 5 * 3600) {
  N.step(sim);
  if (sim.night.tTouch < 0) continue;
  const T = (sim.t - sim.night.tTouch) / 60, F = C.frameOf(sim);
  for (const k of ZS) {
    const Z = sim.ship.zones[k];
    let vol = 0, depth = 0;
    for (let s = 0; s < 2; s++) { const n = C.nodeIndex(k, s, 0); vol += sim.vol[n]; if (sim.vol[n] > 1e-6) depth = Math.max(depth, sim.level[n] - C.worldZ(F, Z.xm, 0, Z.floor)); }
    const up = sim.vol[C.nodeIndex(k, 0, 1)] + sim.vol[C.nodeIndex(k, 1, 1)];
    if (vol > 1) mark(k + ':any', T);
    if (depth > 0.3) mark(k + ':0.3', T);
    if (depth > 2.44) mark(k + ':8ft', T);
    if (up > 1) mark(k + ':E', T);
  }
}
const f = (x) => (x === undefined ? '   -  ' : x.toFixed(1).padStart(6));
console.log('e85 on ' + root + ', flow numbers ' + JSON.stringify(params) + ': the 1912 watch founders at T ' + ((sim.founderT - sim.night.tTouch) / 60).toFixed(2));
console.log('   compartment   any water   0.3 m over the floor   8 ft over it   water above E deck   (minutes after the touch)');
for (const k of ZS) console.log('   ' + C.ZONES[k].short.padEnd(12) + f(first[k + ':any']) + '        ' + f(first[k + ':0.3']) + '              ' + f(first[k + ':8ft']) + '          ' + f(first[k + ':E']));
console.log('   the record (the research notes): BR6 8 ft at T 10 (Barrett); the mail room (hold 3) within a couple of feet of G deck at T 14 to 20 (Boxhall); BR5 dry over its plates until the rush, T 60 (the Report) or T 90 (Barrett); BR4 water from under the floor, about a foot by T 100; water on E deck amidships to port at T 95 to 110 (Joughin)');
