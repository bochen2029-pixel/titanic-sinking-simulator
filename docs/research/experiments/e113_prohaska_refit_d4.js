// e113 (the calibration epoch's landing, D4; D(G14-c) of docs/DESIGN_G14_hull_ends_girder_and_section_v1_2026-11-21.md):
// Prohaska's a, the end ordinate of the hull's trapezoid in the girder's weight curve (core/readers/girder.js,
// PROHASKA_A), refitted once to the one outside figure it was fitted to: the Marine Forensics Panel's condition C-7,
// about 35,000 t aboard, its largest moment 4.64 GN m, inside boiler room 2. It is fitted on the landed model (the
// history match's member as the defaults, every stage C switch on, her hull's ends restored).
//   - C-7: the hull's largest moment (moment().peak) at the first step of the 1912 damage preset with 35,000 t of water
//     aboard. The water is counted as the core weighs it (D88: C.weighedWater, the pockets with it, a full space or
//     pocket at its capacity; the over-fill is not water). girder_tests section 3's C-7 row counts it the same way
//     from the landing on.
//   - The gauge is a reader: a changes no step of the run, only what the gauge reads. So the step of C-7 is fixed, and
//     the moment there is solved for a by bisection inside the bounds the code brackets (0.40 to 0.75), then rounded
//     to three figures.
//   - RECORD (girder.js: the gauge, relieved, the largest in the break band, when her trim first reaches 11 and 17
//     degrees) is measured as girder_tests section 3 measures it, after every step: on the fitted curve and on 0.40.
//   - Where the drift comes from, for the coordinator's ruling (does D(G14-c) hold, or do C3's ends explain the
//     drift?): C-7 on a = 0.40, and its own fit, with the landing's switches taken back one at a time (her ends,
//     hullEnds 0; C5, weighOverfill 1; C4, g11Doors 1 and sideOpenings 0), the ends and C5 together, and the whole of
//     SC.PRE_D4 (the model before the landing, on today's code).
// The first run (2026-11-21, on member #1, b6de930, later withdrawn by D87) counted the water as sim.vol summed, before
// D88: C-7 read 3.825 GN m on 0.40 (-17.6 %), and the fit was a = 0.681.
// Headless; changes nothing in the repository (about a minute).
//   node docs/research/experiments/e113_prohaska_refit_d4.js [<worktree>]
'use strict';
const path = require('path');
const cp = require('child_process');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', '..'));
const C = require(path.join(root, 'core', 'core.js'));
const SC = require(path.join(root, 'core', 'scenarios.js'));
const G = require(path.join(root, 'core', 'readers', 'girder.js'));
const t0 = Date.now(), GN = 1e9, DEG = 180 / Math.PI;
const C7 = { water: 35000, M: 4.64e9 }, BOUNDS = [0.40, 0.75], OLD_A = 0.40;
let head = '?'; try { head = cp.execSync('git -C "' + root + '" rev-parse --short HEAD').toString().trim(); } catch (e) { /* not a repository */ }
const say = (s) => console.log(s === undefined ? '' : s);
const f = (v, d) => (v === null || v === undefined || !Number.isFinite(v)) ? 'n/a' : v.toFixed(d === undefined ? 2 : d);
const gn = (x) => f(x / GN, 3);
const pc = (x) => (x >= 0 ? '+' : '') + f(100 * x, 1) + ' %';
const waterT = (sim) => C.weighedWater(sim) * C.RHO / 1000;   // t aboard as the core weighs it (D88)
const gauge = (sim, a) => G.moment(sim, { variant: { a } });
if (!SC.PRE_D4 || !C.weighedWater) { say('e113 needs the landing (SC.PRE_D4) and C5 (C.weighedWater)'); process.exit(1); }

// one run of the 1912 damage preset: C-7's step, the moment there on a few curves, and the fit; with rec, RECORD too
function run(label, o, rec) {
  const ship = C.buildShip(o.ship || {});
  const scen = Object.assign(SC.PRESETS.titanic.build(o.build), o.scen || {});
  const sim = C.createSim(ship, Object.assign({}, o.params || {}), scen);
  let c7 = null, steps = 0, early = false;
  const R = {}, R0 = {};
  const look = () => {
    if (!c7 && waterT(sim) >= C7.water) {
      const g = (a) => gauge(sim, a).peak.M - C7.M;
      let lo = BOUNDS[0], hi = BOUNDS[1], glo = g(lo);
      const ghi = g(hi);
      let aFit = null;
      if (glo * ghi <= 0) {
        for (let i = 0; i < 60; i++) { const mid = 0.5 * (lo + hi), gm = g(mid); if ((gm <= 0) === (glo <= 0)) { lo = mid; glo = gm; } else hi = mid; }
        aFit = 0.5 * (lo + hi);
      }
      const aNew = aFit === null ? null : Math.round(aFit * 1000) / 1000;
      c7 = { step: steps, T: sim.t / 60, trim: sim.pitch * DEG, water: waterT(sim), vol: C.readouts(sim).waterM3 * C.RHO / 1000, aFit, aNew, rows: [] };
      for (const [name, a] of [['0.40, today\'s', OLD_A], ['the note\'s', G.PROHASKA_A_NOTE], ['the bounds\' top', BOUNDS[1]]].concat(aNew === null ? [] : [['the fit, rounded', aNew]])) {
        const pk = gauge(sim, a).peak; c7.rows.push({ name, a, M: pk.M, x: pk.x, where: G.where(pk.x) });
      }
    }
    if (!rec) return;
    const r0 = gauge(sim, OLD_A), trim = r0.trimDeg;
    for (const a of [11, 17]) if (!R0[a] && trim >= a) R0[a] = { T: sim.t / 60, trim, M: r0.gov.M, x: r0.gov.x };
    if (c7 && c7.aNew !== null) {
      const r = gauge(sim, c7.aNew);
      for (const a of [11, 17]) if (!R[a] && r.trimDeg >= a) R[a] = { T: sim.t / 60, trim: r.trimDeg, M: r.gov.M, x: r.gov.x };
    } else if (trim >= 11) early = true;
  };
  look();
  while (!sim.foundered && sim.t < 5 * 3600) {
    C.step(sim); steps++;
    if (rec ? !(R[17] && R0[17]) : !c7) look();
  }
  return { label, steps, foundered: sim.foundered, founderT: sim.founderT, c7, R, R0, early };
}

const P = C.DEFAULT_PARAMS, PRE = SC.PRE_D4;
say('e113: Prohaska\'s a refitted to the panel\'s C-7 on the landed model, RECORD remeasured, and where the drift comes from');
say('  tree ' + root + ' at ' + head + '; node ' + process.version);
say('  the landed defaults: the opening ' + SC.CALIBRATED_AREA + ' m2, the bunker\'s own ' + SC.BUNKER_OPEN_1912 + ' m2; aDown ' + P.aDown + ', fOpen ' + P.fOpen + ', zMergeHold ' + P.zMergeHold +
  ', GM0 ' + f(P.GM0, 4) + ', coalListDeg ' + P.coalListDeg + '; weighOverfill ' + P.weighOverfill + ', g11Doors ' + P.g11Doors + ', sideOpenings ' + P.sideOpenings + '; the ship C.buildShip() (hullEnds on)');
say('  girder.js\'s a ' + G.PROHASKA_A + ' (fitted on join 1\'s path); the note\'s ' + G.PROHASKA_A_NOTE + '; the bounds ' + BOUNDS.join(' to ') + '; C-7: ' + gn(C7.M) + ' GN m at ' + C7.water + ' t aboard (weighed, D88)');
say();

const L = run('the landed model', {}, true);
say('THE LANDED MODEL: the 1912 damage preset, ' + L.steps + ' steps; ' + (L.foundered ? 'founders at ' + f(L.founderT / 60, 2) + ' min' : 'afloat at 5 h'));
if (!L.c7) { say('  C-7 never reached: no fit'); process.exit(1); }
const c = L.c7;
say('C-7, the first step with ' + C7.water + ' t aboard as weighed: step ' + c.step + ', T ' + f(c.T, 2) + ' min, trim ' + f(c.trim, 2) + ' deg; ' + f(c.water, 0) + ' t weighed (' + f(c.vol, 0) + ' t as the readouts count it, the over-fill with it)');
say('  curve                 a        the hull\'s largest moment   x m     where                   against C-7');
for (const q of c.rows) say('  ' + q.name.padEnd(20) + f(q.a, 3).padStart(6) + (gn(q.M) + ' GN m').padStart(26) + f(q.x, 1).padStart(10) + '     ' + q.where.padEnd(24) + pc(q.M / C7.M - 1));
say('  the fit: a = ' + (c.aFit === null ? 'none inside the bounds' : f(c.aFit, 6) + ', taken as ' + f(c.aNew, 3)));
if (L.early) say('  NOTE: her trim reached 11 deg before C-7: RECORD on the fitted curve needs a second pass');
say();
say('RECORD (the gauge, relieved, the largest in the band, at the first step her trim reaches the angle):');
for (const a of [11, 17]) {
  const n = L.R[a], o = L.R0[a];
  say('  ' + String(a).padStart(2) + ' deg: on the fit (a ' + (c.aNew === null ? 'n/a' : f(c.aNew, 3)) + ') ' + (n ? gn(n.M) + ' GN m at T ' + f(n.T, 2) + ', x ' + f(n.x, 2) : 'n/a') +
    '; on 0.40 ' + (o ? gn(o.M) + ' GN m at T ' + f(o.T, 2) + ', x ' + f(o.x, 2) : 'n/a') + '; girder.js RECORD now ' + gn(G.RECORD.M[a === 11 ? 0 : 1]));
}
say();

const VARIANTS = [
  ['her ends off (hullEnds 0)', { ship: { hullEnds: 0 } }],
  ['C5 off (weighOverfill 1)', { params: { weighOverfill: 1 } }],
  ['C4 off (g11Doors 1, sideOpenings 0)', { params: { g11Doors: 1, sideOpenings: 0 } }],
  ['her ends and C5 off', { ship: { hullEnds: 0 }, params: { weighOverfill: 1 } }],
  ['before the landing (SC.PRE_D4)', { ship: PRE.ship, params: PRE.params, build: PRE.build, scen: PRE.scen }],
];
say('WHERE THE DRIFT COMES FROM: C-7 on a = 0.40, and its own fit, with the landing\'s switches taken back');
say('  run                                     founders   C-7: T    trim   t weighed   on a 0.40                 x m   its own fit');
const line = (r) => {
  const q = r.c7, z = q ? q.rows[0] : null;
  return '  ' + r.label.padEnd(38) + (r.foundered ? f(r.founderT / 60, 2) : 'afloat').padStart(9) + (q ? f(q.T, 2).padStart(10) + f(q.trim, 2).padStart(7) + f(q.water, 0).padStart(12) + ('   ' + gn(z.M) + ' GN m (' + pc(z.M / C7.M - 1) + ')').padEnd(26) + f(z.x, 1).padStart(6) + '   ' + (q.aNew === null ? 'none in the bounds' : f(q.aNew, 3)) : '   C-7 never reached');
};
say(line(L));
for (const [label, o] of VARIANTS) say(line(run(label, o, false)));
say();
say('(' + Math.round((Date.now() - t0) / 1000) + ' s)');
