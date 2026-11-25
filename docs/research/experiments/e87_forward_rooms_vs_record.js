// e87 (G6b): the forward rooms' first ten to twenty minutes against the record's depths, on the 1912 watch (the
// encounter's split) and the 1912 damage preset (Hackett and Bedford's split, `TITANIC_SPLIT`), to see which split the
// record's early depths support. Depths are over the model's floor, the tank top (5.3 ft above the keel in the holds
// and boiler room 6). The record (docs/research/RESEARCH_room_by_room_flooding_record_v1_2026-11-20.md):
//   - boiler room 6: 8 ft "above the plates" when Barrett came back, "just on ten minutes" after he left at the touch
//     (BI 1926-37). The plates' height over the tank top is not settled (Barrett: 2 ft above the bunker's bottom, BI
//     2096; "six feet above the tank tops", BI 1883), so the 8 ft is timed at 0, 2, 2.5, 3 and 6 ft of plates;
//   - hold 1: the carpenter's sounding, 7 ft, at about T 10 (Poingdestre BI 2821-25; its time is loose);
//   - the Report: 14 ft above the keel in the forward compartments at about T 10.
//   node docs/research/experiments/e87_forward_rooms_vs_record.js <worktree> ['{"wMul":..}'] [--write <label>]
const fs = require('fs'), path = require('path');
const root = process.argv[2] || path.join(__dirname, '..', '..', '..');
const params = process.argv[3] && process.argv[3][0] === '{' ? JSON.parse(process.argv[3]) : {};
const C = require(path.join(root, 'core', 'core.js'));
const N = require(path.join(root, 'core', 'night.js'));
const SC = require(path.join(root, 'core', 'scenarios.js'));
const ship = C.buildShip(), FT = 0.3048, out = [], log = (s) => { out.push(s); console.log(s); };
const MARKS = { 1: [7], 4: [8, 10, 10.5, 11, 14] };            // feet over the floor: hold 1; boiler room 6 (8 ft + plates)
function run(kind) {
  const sim = kind === 'watch' ? N.create(ship, N.spec(1912), { auto: true, readers: false, params })
    : C.createSim(ship, params, SC.PRESETS.titanic.build({}));
  const first = {}, mark = (key, t) => { if (first[key] === undefined) first[key] = t; };
  while (sim.t < 5 * 3600) {
    if (kind === 'watch') { if (N.over(sim)) break; N.step(sim); if (sim.night.tTouch < 0) continue; }
    else { if (sim.foundered) break; C.step(sim); }
    const T = kind === 'watch' ? (sim.t - sim.night.tTouch) / 60 : sim.t / 60;
    if (T > 25) break;
    const F = C.frameOf(sim);
    for (let k = 0; k <= 4; k++) {
      const Z = sim.ship.zones[k];
      let depth = 0, keel = 0;
      for (let s = 0; s < 2; s++) { const n = C.nodeIndex(k, s, 0); if (sim.vol[n] > 1e-6) { depth = Math.max(depth, sim.level[n] - C.worldZ(F, Z.xm, 0, Z.floor)); keel = Math.max(keel, sim.level[n] - C.worldZ(F, Z.xm, 0, 0)); } }
      for (const ft of (MARKS[k] || [])) if (depth > ft * FT) mark(k + ':' + ft, T);
      if (keel > 14 * FT) mark(k + ':keel14', T);
      if (first[k + ':at10'] === undefined && T >= 10) { first[k + ':at10'] = depth / FT; first[k + ':floor'] = Z.floor / FT; }
    }
  }
  return first;
}
const names = ['forepeak', 'hold 1', 'hold 2', 'hold 3', 'boiler room 6'];
const t = (v) => (v === undefined ? '-' : v.toFixed(1));
log('e87 on ' + root + ', flow numbers ' + JSON.stringify(params) + ' (minutes after the touch; depths over the tank top)');
for (const kind of ['watch', 'preset']) {
  const r = run(kind);
  log('== the 1912 ' + (kind === 'watch' ? 'watch (the encounter\'s split)' : 'damage preset (Hackett and Bedford\'s split)'));
  for (let k = 0; k <= 4; k++) {
    const parts = [];
    for (const ft of (MARKS[k] || [])) parts.push(ft + ' ft at T ' + t(r[k + ':' + ft]));
    parts.push('14 ft above the keel at T ' + t(r[k + ':keel14']));
    parts.push('at T 10 ' + t(r[k + ':at10']) + ' ft over the floor (the floor ' + t(r[k + ':floor']) + ' ft above the keel)');
    log('   ' + names[k].padEnd(14) + parts.join('; '));
  }
}
log('   the record: boiler room 6, 8 ft above the plates at about T 10 (with the plates 0, 2, 2.5, 3 or 6 ft up: 8, 10,');
log('   10.5, 11 or 14 ft over the floor); hold 1, 7 ft at about T 10; the Report, 14 ft above the keel at about T 10');
const wi = process.argv.indexOf('--write');
if (wi > 0) {
  const dir = path.join(__dirname, 'results_2026-11-20'); if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  const file = path.join(dir, 'e87_forward_rooms.txt'), label = process.argv[wi + 1] || '';
  fs.appendFileSync(file, '#### ' + label + '\n' + out.join('\n') + '\n\n');
}
