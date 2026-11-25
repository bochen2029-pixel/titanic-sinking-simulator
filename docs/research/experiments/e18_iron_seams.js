// e18: P3b's last part, the seams' strength along the hull. Where the rivets were wrought iron set by hand (the ends of
// the hull, out of the hydraulic riveting machines' reach), a seam may open at a smaller dent than where steel rivets
// were set hydraulically (amidships): core/encounter.js ICE.tearAlong gives the regions a factor on ICE.dTear. This
// runs the 1912 encounter at its committed point (GEOM_1912) with a forward iron region of several extents and
// factors: the opened area at the committed area constant, the tear's extent, the split against Hackett and Bedford's,
// and the core's sinking once the area constant is refitted for each (a fixed point, as tools/calibrate_encounter.js).
//   node docs/research/experiments/e18_iron_seams.js [repo root] [--write] [--regions '[[xAft,xFwd,f],...]']
// Output of 2026-11-17: results_2026-11-17/e18_iron_seams.txt
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2), root = args[0] && !args[0].startsWith('--') ? args[0] : path.join(__dirname, '..', '..', '..');
const C = require(path.join(root, 'core', 'core.js'));
const E = require(path.join(root, 'core', 'encounter.js'));
const N = require(path.join(root, 'core', 'night.js'));
const R = require(path.join(root, 'tools', 'encounter_run.js'));
const SC = require(path.join(root, 'core', 'scenarios.js'));
const ship = C.buildShip(), out = [], log = (s) => { out.push(s); console.log(s); };
const HB = [4, 13, 21, 24, 32, 6, 0], G = Object.assign({ portAround: 0 }, N.GEOM_1912), A0 = SC.CALIBRATED_AREA;
const split = (s) => { const tot = s.stbd.area + s.port.area; return [...Array(16).keys()].map(k => (tot > 0 ? 100 * s.stbd.zone[k] / tot : 0)); };
const splitErr = (sp) => { let e = 0; for (let k = 0; k < 16; k++) e += Math.abs(sp[k] - (k < 7 ? HB[k] : 0)); return e; };
function run(tearAlong, alpha) { return R.encounter(Object.assign({}, G, { ice: { tearAlong, alpha } }), ship); }
function fit(tearAlong) {                     // the area constant that opens the calibrated area with these seams (fixed point)
  let alpha = E.ICE.alpha;
  for (let it = 0; it < 30; it++) { const s = E.summary(run(tearAlong, alpha)), tot = s.stbd.area + s.port.area; if (!(tot > 0)) return null; if (Math.abs(tot - A0) < 1e-9) break; alpha *= A0 / tot; }
  return alpha;
}
function line(label, tearAlong) {
  const s0 = E.summary(run(tearAlong, E.ICE.alpha)), a0 = s0.stbd.area + s0.port.area;
  const alpha = fit(tearAlong); if (alpha === null) return label.padEnd(34) + ' no tear';
  const sim = run(tearAlong, alpha), s = E.summary(sim), sp = split(s);
  R.sinkOn(sim, 8 * 3600);
  return label.padEnd(34) + ' area ' + a0.toFixed(4) + ' m2 at the committed alpha; tears x ' + s.stbd.tearFrom + '..' + s.stbd.tearTo + ' (' + s.stbd.tears + ')' + (s.port.tears ? ', port ' + s.port.tears : '') +
    ' | split ' + sp.slice(0, 7).map(v => v.toFixed(0)).join('/') + ' (error ' + splitErr(sp).toFixed(0) + ') | alpha ' + alpha.toFixed(5) + ' | ' + (sim.foundered ? 'founders ' + ((sim.t - sim.enc.tFirst) / 60).toFixed(1) + ' min after the touch' : 'afloat at 8 h');
}
const t0 = Date.now(), xFP = C.G.LBP / 2;
log('e18: the 1912 encounter at GEOM_1912 ' + JSON.stringify(N.GEOM_1912) + ', dTear ' + E.ICE.dTear + ' m, committed alpha ' + E.ICE.alpha + '; record 157-160 min, Hackett and Bedford ' + HB.join('/'));
const user = args.indexOf('--regions');
if (user >= 0) log(line('regions ' + args[user + 1], JSON.parse(args[user + 1])));
else {
  log(line('uniform (as committed)', null));
  for (const fwd of [0.20, 0.25, 0.30]) for (const f of [0.75, 0.5, 0.35]) {
    const xB = xFP - fwd * C.G.LBP;
    log(line('forward ' + (100 * fwd).toFixed(0) + ' % (x > ' + xB.toFixed(1) + ') x ' + f, [[xB, 200, f]]));
  }
}
log('\n(' + ((Date.now() - t0) / 1000).toFixed(0) + ' s; ' + new Date().toISOString() + ')');
if (args.includes('--write')) {
  const dir = path.join(__dirname, 'results_2026-11-17');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'e18_iron_seams.txt'), out.join('\n') + '\n');
}
