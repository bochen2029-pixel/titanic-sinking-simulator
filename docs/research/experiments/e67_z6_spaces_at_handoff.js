'use strict';
// e67: the core's 64 spaces at a hand-off, the state Z6 would start from (Z1, 2026-11-20;
// docs/DESIGN_free_body_air_by_space_v1, sections 2 and 3).
// For each space: its x range, its layer and side, its floodable volume, its water, its air, and which piece it falls in
// when cut at x -23. A space the cut crosses is split by length. Then the connections by kind, for each piece by x.
// Found on 2026-11-20 at T 155.5 (the mainline's tiers):
//   - the cut crosses Boiler room 1 (bulkheads J at -16.2 and K at -27.1);
//   - the bow's 34,782 m3 of air is all in BR6's upper spaces to BR1;
//   - the stern is dry, 52,022 m3, its engine room shut behind bulkhead K.
//   node docs/research/experiments/e67_z6_spaces_at_handoff.js [--root <tree>] [--at <minutes>] [--write]
// Output of 2026-11-20: results_2026-11-20/e67_z6_spaces_at_handoff.txt
const fs = require('fs'), path = require('path');
const argv = process.argv.slice(2), WRITE = argv.includes('--write'), ri = argv.indexOf('--root'), ai = argv.indexOf('--at');
const ROOT = ri >= 0 ? path.resolve(argv[ri + 1]) : path.resolve(__dirname, '../../..'), TM = ai >= 0 ? +argv[ai + 1] : 155.5;
const C = require(path.join(ROOT, 'core/core.js')), SC = require(path.join(ROOT, 'core/scenarios.js'));
const GI = require(path.join(ROOT, 'core/readers/girder.js'));
const out = [], say = (s) => { s = s === undefined ? '' : s; out.push(s); console.log(s); };
const ship = C.buildShip(), sim = C.createSim(ship, {}, SC.PRESETS.titanic.build());
while (!sim.foundered && sim.t < TM * 60 - 1e-9) C.step(sim);
const XB = GI.X_BREAK, Z = ship.zones;
say('e67: the core\'s spaces at T ' + (sim.t / 60).toFixed(2) + ', the cut at x ' + XB);
say('tree: ' + (ri >= 0 ? path.basename(ROOT) + ' (given by --root)' : 'this repository'));
const tot = { bow: { V: 0, W: 0, n: 0, air: 0 }, stern: { V: 0, W: 0, n: 0, air: 0 } };
for (const z of Z) {
  for (let layer = 0; layer < 2; layer++) for (let side = 0; side < 2; side++) {
    const n = C.nodeIndex(z.k, side, layer), V = ship.nodeVmax[n], W = sim.vol[n];
    // the share of the space forward of the cut, by length
    const fBow = z.xa >= XB ? 1 : (z.xf <= XB ? 0 : (z.xf - XB) / (z.xf - z.xa));
    for (const [pc, fr] of [['bow', fBow], ['stern', 1 - fBow]]) {
      if (fr <= 0) continue;
      tot[pc].V += fr * V; tot[pc].W += fr * W; tot[pc].n++; tot[pc].air += fr * Math.max(0, V - W);
    }
    say(z.short.padEnd(4) + ' x ' + z.xa.toFixed(1).padStart(7) + ' to ' + z.xf.toFixed(1).padStart(7) + (layer ? ' above E' : ' below E') + (side ? ' stbd' : ' port') + '  V ' + V.toFixed(0).padStart(6) + '  water ' + W.toFixed(0).padStart(6) + '  air ' + Math.max(0, V - W).toFixed(0).padStart(6) + (fBow > 0 && fBow < 1 ? '  CUT: ' + (100 * fBow).toFixed(0) + ' % bow' : '  ' + (fBow ? 'bow' : 'stern')));
  }
}
for (const pc of ['bow', 'stern']) say(pc + ': ' + tot[pc].n + ' spaces (the cut\'s counted in both), floodable ' + tot[pc].V.toFixed(0) + ' m3, water ' + tot[pc].W.toFixed(0) + ', air ' + tot[pc].air.toFixed(0));
const S = sim.conn, names = ['door', 'over', 'down', 'xlow', 'xmerge', 'xup', 'top', 'breach', 'open', 'stair'], byKind = {};
for (let c = 0; c < S.n; c++) {
  const pc = S.x[c] >= XB ? 'bow' : 'stern', k = (names[S.kind[c]] || 'kind ' + S.kind[c]) + (S.en[c] ? '' : ' (shut)');
  byKind[k] = byKind[k] || { bow: 0, stern: 0 }; byKind[k][pc]++;
}
say('connections by kind (bow / stern, by their x): ' + Object.entries(byKind).map(([k, v]) => k + ' ' + v.bow + '/' + v.stern).join(', '));
if (WRITE) { const d = path.join(__dirname, 'results_2026-11-20'); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'e67_z6_spaces_at_handoff.txt'), out.join('\n') + '\n'); }
