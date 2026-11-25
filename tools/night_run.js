// One night, headless: the seeded berg, the lookout, the bridge's orders, and the sinking that follows (or not).
//   node tools/night_run.js [seed] [auto | none | seconds] [sink] [knots]
//     seed      1912 is the reconstructed night of 14 April 1912; any other whole number draws a night
//     auto      the 1912 orders: helm hard over away from the ice 20.5 s after the bells, reversed at the touch,
//               engines stopped a minute later (default)
//     seconds   the same drill with the helm order that many seconds after the bells
//     none      no order at all
//     sink      run on until she founders or lies steady
const C = require('../core/core.js');
const N = require('../core/night.js');

if (require.main === module) {
  const a = process.argv.slice(2);
  const seed = a[0] === undefined ? 1912 : +a[0], how = a[1] === undefined ? 'auto' : a[1], kn = a[3] ? +a[3] : undefined;
  const ship = C.buildShip(), sp = N.spec(seed, kn ? { speedKn: kn } : undefined);
  const opts = how === 'auto' ? { auto: true } : (how === 'none' ? {} : { script: N.scriptOf(Object.assign({}, sp.orders, { delay: +how })) });
  const t0 = Date.now(), sim = N.run(N.create(ship, sp, opts)), s = N.summary(sim), w = sim.night;
  const f = (v, n) => (v === null || v === undefined ? 'n/a' : v.toFixed(n === undefined ? 1 : n));
  console.log(sp.title + ' (seed ' + sp.seed + ', generator ' + sp.gen + '): ' + N.describe(sp));
  console.log('  bells at ' + f(s.tBells, 2) + ' s, range ' + f(s.rangeBells, 1) + ' m, bearing ' + f(s.bearingBells, 1) + ' deg' +
    (s.reaction === null ? '; no order' : '; first order ' + f(s.reaction, 2) + ' s after the bells, the ice ' + f(s.aheadOrder, 1) + ' m ahead') + (s.hindsight ? ' (an order BEFORE the bells)' : ''));
  for (const o of w.log) console.log('    order  t ' + f(o.t, 2).padStart(7) + ' s  step ' + String(o.k).padStart(4) + '  ' + o.type + ' ' + o.value + (o.arg === undefined ? '' : ' ' + o.arg));
  for (const e of sim.events) console.log('    event  t ' + f(e.t, 2).padStart(7) + ' s  ' + e.label);
  console.log('  ' + s.kind + (s.tTouch >= 0 ? ': first touch ' + f(s.tTouch - s.tBells, 1) + ' s after the bells, head swung ' + f(s.swingTouch, 1) + ' deg, ' + f(s.knTouch, 1) + ' kn; contact ' + f(s.dur, 1) + ' s, peak ' + f(s.Fmax / 1e6, 1) + ' MN' : ''));
  console.log('  ' + N.verdict(sim));
  for (const side of ['stbd', 'port']) { const d = s[side]; if (d.tears + d.dents) console.log('    ' + side + ': seams open at ' + d.tears + ' stations' + (d.tears ? ', x ' + d.tearFrom + ' to ' + d.tearTo : '') + ', ' + f(d.area, 3) + ' m2; dented only at ' + d.dents + '; deepest dent ' + f(d.dmax, 2) + ' m'); }
  if (s.bow.crush > 0) console.log('    bow: crushed ' + f(s.bow.crush, 1) + ' m, ' + f(s.bow.area, 1) + ' m2 open');
  console.log('  fingerprint ' + s.fingerprint + ' at step ' + w.k + '  (' + (Date.now() - t0) + ' ms)');
  if (a[2] === 'sink') { N.sink(sim); console.log('  core: ' + (sim.foundered ? 'founders ' + f(sim.founderT / 60, 1) + ' min after the start of the watch, ' + f((sim.founderT - s.tTouch) / 60, 1) + ' min after the touch' : 'afloat at ' + f(sim.t / 60, 0) + ' min')); }
}
