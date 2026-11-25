// E0: does this machine reproduce the frozen golden trace of the 1912 run?
// Usage: node e0_golden.js <repo root>
// Read-only: it never writes into the repo.
const fs = require('fs');
const path = require('path');
const root = process.argv[2];
const C = require(path.join(root, 'core', 'core.js'));
const SC = require(path.join(root, 'core', 'scenarios.js'));
const gold = JSON.parse(fs.readFileSync(path.join(root, 'out', 'golden_titanic.json'), 'utf8'));

const ship = C.buildShip();
const sim = C.createSim(ship, {}, SC.PRESETS.titanic.build());
const rec = [];
const sample = () => rec.push({ t: sim.t, zO: sim.zO, pitch: sim.pitch, roll: sim.roll, vz: sim.vz, wth: sim.wth, wph: sim.wph, inflow: sim.inflow, Vb: sim.Vb, vol: Array.from(sim.vol) });
sample();
let next = 60;
const t0 = Date.now();
while (!sim.foundered && sim.t < 5 * 3600) {
  C.step(sim);
  if (sim.t >= next - 1e-9) { sample(); next += 60; }
}
const ms = Date.now() - t0;

let firstDiff = -1, maxPose = 0, maxVol = 0, bitEqual = 0;
const n = Math.min(rec.length, gold.trace.length);
for (let i = 0; i < n; i++) {
  const a = rec[i], b = gold.trace[i];
  let same = a.zO === b.zO && a.pitch === b.pitch && a.roll === b.roll && a.vz === b.vz && a.wth === b.wth && a.wph === b.wph && a.inflow === b.inflow && a.Vb === b.Vb;
  maxPose = Math.max(maxPose, Math.abs(a.zO - b.zO), Math.abs(a.pitch - b.pitch), Math.abs(a.roll - b.roll));
  for (let k = 0; k < 64; k++) { if (a.vol[k] !== b.vol[k]) same = false; maxVol = Math.max(maxVol, Math.abs(a.vol[k] - b.vol[k])); }
  if (same) bitEqual++; else if (firstDiff < 0) firstDiff = i;
}
console.log('node', process.version, ' run ms', ms);
console.log('samples: this run', rec.length, ' golden', gold.trace.length);
console.log('founder: this run', sim.founderT, 's =', (sim.founderT / 60).toFixed(3), 'min; golden', gold.founderT, 's');
console.log('bit-identical samples:', bitEqual, 'of', n, ' first differing sample index:', firstDiff, firstDiff >= 0 ? '(t = ' + rec[firstDiff].t + ' s)' : '');
console.log('max |pose diff| (m or rad):', maxPose, ' max |vol diff| (m3):', maxVol);
console.log('columns', ship.cols.N, 'connections', sim.conn.n, 'ms(kg)', sim.ms, 'KG', sim.KG);
console.log('mass t', (sim.ms / 1000).toFixed(1), ' XO', sim.XO, ' g0', sim.g0.map(v => +v.toFixed(4)).join(','), ' pose0', JSON.stringify(sim.pose0));
const hyd = ship.hyd;
console.log('hyd at mean draft: V', hyd.V.toFixed(1), 'Awp', hyd.Awp.toFixed(1), 'KB', hyd.KB.toFixed(3), 'BM', hyd.BM.toFixed(3), 'BML', hyd.BML.toFixed(2), 'LCF', hyd.LCF.toFixed(3), 'LCB', hyd.LCB.toFixed(3));
