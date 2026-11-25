// One iceberg encounter, headless, and the sinking that follows.
//   node tools/encounter_run.js [ahead m] [port m] [portAround s|-] [knots] [json ICE overrides]
// The ship steams at the berg; the helm goes hard-a-starboard at t = 0; optionally the helm is reversed `portAround`
// seconds after the first touch ("port around"); the engines are stopped 60 s after the first touch.
const C = require('../core/core.js');
const Mo = require('../core/motion.js');
const E = require('../core/encounter.js');

function encounter(o, ship) {
  ship = ship || C.buildShip();
  // o.params: the run's own params (the history match's B16: the encounter's fixed point at each set's own numbers)
  const sim = C.createSim(ship, o.params || {}, { openings: [], coalListDeg: o.coalListDeg === undefined ? C.DEFAULT_PARAMS.coalListDeg : o.coalListDeg });
  Mo.attach(sim, { knots: o.knots || 22.5 });
  E.create(sim, { ahead: o.ahead, port: o.port }, o.ice);
  if (o.helm !== null) Mo.rudder(sim, o.helm === undefined ? -40 : o.helm);
  if (o.stopNow) Mo.telegraph(sim, 'stop');
  let reversed = false, stopped = !!o.stopNow;
  const e = sim.enc;
  while (sim.t < (o.encounterSecs || 240)) {
    E.step(sim);
    if (e.tFirst >= 0 && !reversed && o.portAround !== null && o.portAround !== undefined && sim.mo.t >= e.tFirst + o.portAround) { Mo.rudder(sim, -sim.mo.delCmd / Mo.DEG); reversed = true; }
    if (e.tFirst >= 0 && !stopped && sim.mo.t >= e.tFirst + 60) { Mo.telegraph(sim, 'stop'); Mo.rudder(sim, 0); stopped = true; }
    if (o.each) o.each(sim);                       // a look at every step, for a test that follows the whole run
  }
  return sim;
}
function sinkOn(sim, tMax) {
  while (!sim.foundered && sim.t < (tMax || 6 * 3600)) {
    E.step(sim);
    if (sim.t > 3600 && Math.abs(sim.inflow) < 0.02 && Math.abs(sim.wth) < 1e-5 && sim.t > 4 * 3600) break;
  }
  return sim;
}
module.exports = { encounter, sinkOn };

if (require.main === module) {
  const a = process.argv.slice(2);
  const o = { ahead: +(a[0] || 200), port: +(a[1] || 27), portAround: a[2] === undefined || a[2] === '-' ? null : +a[2], knots: +(a[3] || 22.5), ice: a[4] ? JSON.parse(a[4]) : {} };
  const t0 = Date.now(), sim = encounter(o), s = E.summary(sim);
  const f = (v, n) => (v === null ? 'n/a' : v.toFixed(n === undefined ? 1 : n));
  console.log('encounter', JSON.stringify(o), (Date.now() - t0) + ' ms');
  console.log(' kind', s.kind, ' min gap', f(s.minGap, 1), 'm  contact', f(s.dur, 1), 's  peak force', f(s.Fmax / 1e6, 1), 'MN  berg moved', f(s.bergMoved, 2), 'm  ice crushed', f(s.crushed, 1), 'm (summed over bins)');
  for (const side of ['stbd', 'port']) { const d = s[side]; console.log(' ', side, 'tears', d.tears, 'from x', d.tearFrom, 'to', d.tearTo, ' dents', d.dents, 'from x', d.dentFrom, 'to', d.dentTo, ' deepest', f(d.dmax, 2), 'm  area', f(d.area, 3), 'm2'); }
  const z = s.stbd.zone, tot = s.stbd.area + s.port.area;
  console.log('  starboard opening by compartment FP..BR4:', [0, 1, 2, 3, 4, 5, 6].map(k => (tot > 0 ? 100 * z[k] / tot : 0).toFixed(0) + '%').join(' '), ' (Hackett and Bedford 5 12 25 26 22 10 0)');
  if (a[5] === 'sink') { sinkOn(sim); console.log('  core:', sim.foundered ? 'founders at ' + (sim.founderT / 60).toFixed(1) + ' min' : 'afloat at ' + (sim.t / 60).toFixed(0) + ' min'); }
}
