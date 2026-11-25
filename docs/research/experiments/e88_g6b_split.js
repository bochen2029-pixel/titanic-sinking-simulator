// e88 (G6b): the 1912 encounter's damage split by compartment, and what it does to the 1912 watch's foundering.
// On wt/split (G6 and W6 on main 4bf604e) the encounter shares its opening out as the length its tear crosses in each
// compartment: its dents stand at the ice's crushing depth, p0 / q = 0.25 m, the whole way along, so every torn metre
// opens alike (the table's first rows). The split the 1912 damage preset carries (`TITANIC_SPLIT` in
// core/scenarios.js: 4/13/21/24/32/6; its comment says Hackett and Bedford's, but it is the water each room held, not
// their opening areas: G6b's research note) puts more aft. This was G6b's first probe, aimed at that split; e89 aims
// at Hackett and Bedford's own areas (JOM 1998, Table I). ICE.openAlong (the form of tearAlong) scales each station's
// opening by its region's factor; the area constant is then refound so that the encounter still opens the calibrated
// area (tools/calibrate_encounter.js's fixed point). Candidates:
//   (1) one factor per compartment over the 1912 damage's extent, the preset's share over the watch's own;
//   (2) a ramp from bulkhead E to the stem, one number (the factor at the stem over the factor at E), scanned;
//   and the berg's taper (how much narrower each deeper band is), which does not move the split (only the top band
//   tears at any taper from 0.02 to 0.08).
// Then the watch's founder (the 1912 orders and pumps) beside the preset's, at today's flow numbers and the
// opening, and at e83's free-area refit (on the preview: area 0.8014 m2, wMul 1.217, aDown 0.362, fOpen 0.01881; the
// watch's damage scaled with the area, as e83 does).
//   node docs/research/experiments/e88_g6b_split.js [--founders] [--write]
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', '..', '..');
const C = require(path.join(root, 'core', 'core.js'));
const E = require(path.join(root, 'core', 'encounter.js'));
const N = require(path.join(root, 'core', 'night.js'));
const R = require(path.join(root, 'tools', 'encounter_run.js'));
const ship = C.buildShip(), G = Object.assign({ portAround: 0 }, N.GEOM_1912), out = [], log = (s) => { out.push(s); console.log(s); };
const HB = [4, 13, 21, 24, 32, 6], NAMES = ['FP', 'H1', 'H2', 'H3', 'BR6', 'BR5'];
const bx = C.zoneBounds(), xB = C.BULKHEADS.find(b => b.id === 'E').x - 9 * C.FT;
const ALPHA0 = E.ICE.alpha, OPEN0 = E.ICE.openAlong, TARGET = 0.7506;
E.ICE.openAlong = null;
const enc = (ice) => E.summary(R.encounter(Object.assign({}, G, { ice: Object.assign({ openAlong: null }, ice) }), ship));
const shares = (s) => { const t = s.stbd.area + s.port.area; return HB.map((_, k) => 100 * s.stbd.zone[k] / t); };
const err = (sp) => sp.reduce((a, v, k) => a + Math.abs(v - HB[k]), 0);
function fixAlpha(openAlong) {
  let alpha = ALPHA0, s;
  for (let it = 0; it < 40; it++) { s = enc({ alpha, openAlong }); const tot = s.stbd.area + s.port.area; if (Math.abs(tot - TARGET) < 1e-10) break; alpha *= TARGET / tot; }
  return { alpha, s };
}
const row = (lab, sp, extra) => log('  ' + lab.padEnd(36) + sp.map(v => v.toFixed(1).padStart(5)).join(' ') + '   error ' + err(sp).toFixed(1).padStart(4) + (extra ? '   ' + extra : ''));
log('e88 (G6b) on ' + root + ': the 1912 encounter (ahead ' + G.ahead + ' m, port ' + G.port + ' m), G6\'s tearAlong ' + JSON.stringify(E.ICE.tearAlong.map(r => r.map(v => +v.toFixed(4)))));
log('  ' + 'share of the opened area, %'.padEnd(36) + NAMES.map(n => n.padStart(5)).join(' '));
row('the preset\'s split (the water held)', HB.slice());
const base = fixAlpha(null);
row('the watch with G6 (no openAlong)', shares(base.s), 'alpha ' + base.alpha + '; tears x ' + base.s.stbd.tearFrom + '..' + base.s.stbd.tearTo);
for (const taper of [0.06, 0.04, 0.02]) row('  the same, the berg\'s taper ' + taper, shares(enc({ taper, alpha: ALPHA0 })));
const cur = shares(base.s);
const per = [[bx[1], 200, HB[0] / cur[0]], [bx[2], bx[1], HB[1] / cur[1]], [bx[3], bx[2], HB[2] / cur[2]], [bx[4], bx[3], HB[3] / cur[3]], [bx[5], bx[4], HB[4] / cur[4]], [xB, bx[5], HB[5] / cur[5]]];
const P1 = fixAlpha(per);
row('(1) a factor per compartment', shares(P1.s), 'factors ' + per.map(r => r[2].toFixed(3)).join(' ') + '; alpha ' + P1.alpha);
let best = null;
for (let r = 0.05; r <= 1.0001; r += 0.05) { const ramp = [[bx[5], 140, 1, r], [xB, bx[5], 1]], sp = shares(enc({ alpha: ALPHA0, openAlong: ramp })); if (!best || err(sp) < best.e) best = { r, e: err(sp), ramp }; }
for (const r of [0.4, 0.2, 0.1, best.r]) row('(2) a ramp, the stem at ' + r.toFixed(2) + ' of E', shares(enc({ alpha: ALPHA0, openAlong: [[bx[5], 140, 1, r], [xB, bx[5], 1]] })));
const P2 = fixAlpha(best.ramp);
row('(2) the best ramp, refound', shares(P2.s), 'the stem at ' + best.r.toFixed(2) + ' of E; alpha ' + P2.alpha);
if (process.argv.includes('--founders')) {
  const CAL = require(path.join(root, 'tools', 'calibrate.js'));
  const SETS = [{ lab: 'today\'s numbers at 0.7506 m2', area: 0.7506, params: { wMul: 1.036, aDown: 0.2815, fOpen: 0.02068 } },
    { lab: 'e83\'s free-area refit at 0.8014 m2', area: 0.8014, params: { wMul: 1.217, aDown: 0.362, fOpen: 0.01881 } }];
  const watchT = (openAlong, alpha, set) => {
    E.ICE.alpha = alpha * set.area / 0.7506; E.ICE.openAlong = openAlong;
    try { const sim = N.sink(N.create(ship, N.spec(1912), { auto: true, readers: false, params: set.params })); return sim.foundered ? (sim.founderT - sim.night.tTouch) / 60 : NaN; }
    finally { E.ICE.alpha = ALPHA0; E.ICE.openAlong = null; }
  };
  for (const set of SETS) {
    const o = CAL.simulate({ area: set.area, params: set.params });
    log('\n  ' + set.lab + ': the preset founders at T ' + (o.res.founderT / 60).toFixed(2) + ' (its calibration score J ' + CAL.score(o).toFixed(2) + '); the watch:');
    log('    with G6 alone                 T ' + watchT(null, base.alpha, set).toFixed(2));
    log('    (1) a factor per compartment  T ' + watchT(per, P1.alpha, set).toFixed(2));
    log('    (2) the best ramp             T ' + watchT(best.ramp, P2.alpha, set).toFixed(2));
  }
}
E.ICE.alpha = ALPHA0; E.ICE.openAlong = OPEN0;
log('\n(' + new Date().toISOString() + ')');
if (process.argv.includes('--write')) {
  const dir = path.join(__dirname, 'results_2026-11-20'); if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'e88_g6b_split.txt'), out.join('\n') + '\n');
}
