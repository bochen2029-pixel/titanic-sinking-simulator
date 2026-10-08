// Golden trace of the calibrated 1912 run, sampled every 60 s, for checking a port.
// Run: node tools/golden.js   -> out/golden_titanic.json
const fs = require('fs');
const path = require('path');
const C = require('../core/core.js');
const SC = require('../core/scenarios.js');
const ship = C.buildShip();
const sim = C.createSim(ship, {}, SC.PRESETS.titanic.build());
const rec = [];
const sample = () => rec.push({
  t: sim.t, zO: sim.zO, pitch: sim.pitch, roll: sim.roll, vz: sim.vz, wth: sim.wth, wph: sim.wph,
  inflow: sim.inflow, Vb: sim.Vb, vol: Array.from(sim.vol),
});
sample();
let next = 60;
while (!sim.foundered && sim.t < 5 * 3600) {
  C.step(sim);
  if (sim.t >= next - 1e-9) { sample(); next += 60; }
}
const out = {
  params: sim.params, openings: sim.openings.map(o => ({ x: o.x, y: o.y, z: o.z, area: o.area, kind: o.kind })),
  dt: sim.params.dt, columns: ship.cols.N, entries: ship.entCol.length, connections: sim.conn.n,
  ms: sim.ms, KG: sim.KG, foundered: sim.foundered, founderT: sim.founderT, events: sim.events, trace: rec,
};
fs.writeFileSync(path.join(__dirname, '..', 'out', 'golden_titanic.json'), JSON.stringify(out));
console.log('wrote out/golden_titanic.json:', rec.length, 'samples, founder at', (sim.founderT / 60).toFixed(2), 'min');
