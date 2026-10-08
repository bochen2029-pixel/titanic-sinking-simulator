const C = require('../core/core.js');
const SC = require('../core/scenarios.js');
const ship = C.buildShip();
const area = process.argv[2] ? +process.argv[2] : SC.CALIBRATED_AREA;   // default: the calibrated 0.7506 m2
const params = process.argv[3] ? JSON.parse(process.argv[3]) : {};
const scen = SC.PRESETS.titanic.build({ areaTitanic: area });
const sim = C.createSim(ship, params, scen);
const t0 = Date.now();
const res = C.run(sim, { tMax: 4 * 3600, every: 60 });
console.log('run ms', Date.now() - t0, 'openings', scen.openings.length, 'foundered', res.foundered, 'at min', (res.founderT / 60).toFixed(1));
const at = (m) => res.hist.reduce((b, h) => Math.abs(h.t - m * 60) < Math.abs(b.t - m * 60) ? h : b);
console.log('min  trim  (obs)   list (obs)  water_t  inflow_t/min  dF    dA');
const obsT = Object.fromEntries(SC.OBS.trim), obsL = Object.fromEntries(SC.OBS.list);
for (const m of [5, 10, 15, 20, 30, 40, 45, 60, 75, 90, 100, 110, 120, 130, 140, 145, 150, 155, 160]) {
  const h = at(m);
  console.log(String(m).padStart(3), h.trim.toFixed(2).padStart(6), (obsT[m] !== undefined ? obsT[m].toFixed(1) : '').padStart(6), h.list.toFixed(2).padStart(7), (obsL[m] !== undefined ? obsL[m].toFixed(0) : '').padStart(5), h.water.toFixed(0).padStart(8), h.inflow.toFixed(0).padStart(10), h.dF.toFixed(2).padStart(6), h.dA.toFixed(2).padStart(6));
}
for (const e of res.events) console.log('event', (e.t / 60).toFixed(1).padStart(6), 'min', e.label);
