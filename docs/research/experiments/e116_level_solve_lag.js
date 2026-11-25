// e116 (measure only; the coordinator's ask of 2026-11-23, after U0's u3_water finding on the landed member C): the
// core's level solve (core/core.js solveOne and solvePair: regula falsi with Newton steps, at most 6 a step, 40 when a
// space is full) can end its loop without meeting its own tolerance, max(1e-3 x Vtol, 0.5 m3). The water is then shared
// out at the level reached, so the water aboard is exact; what lags is the LEVEL, a space's head in the next step's flows.
// How often across the 1912 preset and the 1912 watch, and by how much; and does the founder move if the solve gets 40
// steps? The repo's core is copied to a scratch folder and patched THERE only (counters, and the cap as
// params.levelIters); with the cap at 6 the copy must give the landed bits (checked against golden and BASE).
//   node docs/research/experiments/e116_level_solve_lag.js [--write]
'use strict';
const fs = require('fs'), path = require('path'), os = require('os');
try { os.setPriority(0, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch (e) {}
const ROOT = path.join(__dirname, '..', '..', '..'), out = [], log = (s) => { out.push(s); console.log(s); };
// the copy: core/ and core/readers/, core.js patched
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'e116-'));
for (const d of ['core', path.join('core', 'readers')]) { fs.mkdirSync(path.join(TMP, d), { recursive: true }); for (const f of fs.readdirSync(path.join(ROOT, d))) if (f.endsWith('.js')) fs.copyFileSync(path.join(ROOT, d, f), path.join(TMP, d, f)); }
let src = fs.readFileSync(path.join(ROOT, 'core', 'core.js'), 'utf8');
const LOOP = 'for (let it = 0; it < (full ? 40 : 6); it++) {', BRK = 'if (Math.abs(err) < tol) break;';
const nLoop = src.split(LOOP).length - 1, nBrk = src.split(BRK).length - 1;
if (nLoop !== 2 || nBrk !== 2) throw new Error('e116: the solve loops are not as read (' + nLoop + ' loops, ' + nBrk + ' breaks)');
src = src.split(LOOP).join('let _ok = false; for (let it = 0; it < (full ? 40 : (sim.params.levelIters || 6)); it++) {').split(BRK).join('if (Math.abs(err) < tol) { _ok = true; break; }');
// solveOne: after its loop, sc.vol is the volume at h
src = src.replace('    sim.level[n] = h; sim.area[n] = sc.dv;\n    if (sc.vol > 1e-9) { sim.cx[n] = sc.mx / sc.vol;', '    { const L = sim._lag || (sim._lag = { solves: 0, missed: 0, worst: 0, worstN: -1, at: [] }); L.solves++; if (!_ok) { const r = Math.abs(sc.vol - V) / V; L.missed++; if (r > L.worst) { L.worst = r; L.worstN = n; } L.at.push([sim.t, n, r]); } }\n    sim.level[n] = h; sim.area[n] = sc.dv;\n    if (sc.vol > 1e-9) { sim.cx[n] = sc.mx / sc.vol;');
// solvePair: after its loop, A.vol + B.vol is the volume at h
src = src.replace('    // share the water in proportion to the geometry at this level (mass is conserved exactly)', '    { const L = sim._lag || (sim._lag = { solves: 0, missed: 0, worst: 0, worstN: -1, at: [] }); L.solves++; if (!_ok) { const r = Math.abs(A.vol + B.vol - V) / V; L.missed++; if (r > L.worst) { L.worst = r; L.worstN = nP; } L.at.push([sim.t, nP, r]); } }\n    // share the water in proportion to the geometry at this level (mass is conserved exactly)');
if (src.split('sim._lag ||').length - 1 !== 2) throw new Error('e116: the counters did not go in twice');
fs.writeFileSync(path.join(TMP, 'core', 'core.js'), src);
const C = require(path.join(TMP, 'core', 'core.js')), SC = require(path.join(TMP, 'core', 'scenarios.js')), N = require(path.join(TMP, 'core', 'night.js'));
const ship = C.buildShip();
const golden = JSON.parse(fs.readFileSync(path.join(ROOT, 'out', 'golden_titanic.json'), 'utf8'));
const sum = (lag, steps) => lag ? lag.missed + ' of ' + lag.solves + ' solves miss (' + (100 * lag.missed / lag.solves).toFixed(3) + ' %), in ' + new Set(lag.at.map((a) => Math.round(a[0] * 4))).size + ' of ' + steps + ' steps; the worst ' + (100 * lag.worst).toFixed(2) + ' % of the space\'s water (space ' + lag.worstN + ')' : 'none';
const bins = (lag) => { const b = { '<0.1 %': 0, '0.1-1 %': 0, '1-5 %': 0, '>5 %': 0 }; for (const [, , r] of (lag ? lag.at : [])) b[r < 0.001 ? '<0.1 %' : r < 0.01 ? '0.1-1 %' : r < 0.05 ? '1-5 %' : '>5 %']++; return Object.entries(b).map(([k, v]) => k + ' ' + v).join(', '); };
log('e116: the level solve against its own tolerance, on the landed member (the core copied to ' + TMP + ')');
const preset = (iters) => { const p = iters ? { levelIters: iters } : {}; const sim = C.createSim(ship, p, SC.PRESETS.titanic.build({})); let k = 0; while (!sim.foundered && sim.t < 5 * 3600) { C.step(sim); k++; } return { sim, k }; };
const watch = (iters) => { const sim = N.sink(N.create(ship, N.spec(1912), iters ? { auto: true, params: { levelIters: iters } } : { auto: true })); return { sim, T: (sim.founderT - sim.night.tTouch) / 60 }; };
const p6 = preset(), p40 = preset(40);
log('the 1912 preset, the cap at 6 (the core as it is): founders ' + (p6.sim.founderT / 60).toFixed(4) + ' min (golden ' + (golden.founderT / 60).toFixed(4) + ': ' + (p6.sim.founderT === golden.founderT ? 'the same' : 'NOT the same') + '); ' + sum(p6.sim._lag, p6.k));
log('   the misses by size: ' + bins(p6.sim._lag));
log('   ... the cap at 40: founders ' + (p40.sim.founderT / 60).toFixed(4) + ' min (' + ((p40.sim.founderT - p6.sim.founderT)).toFixed(2) + ' s); ' + sum(p40.sim._lag, p40.k));
const w6 = watch(), w40 = watch(40);
log('the 1912 watch, the cap at 6: ' + N.fingerprint(w6.sim) + ' at step ' + w6.sim.night.k + ' (BASE 48b71712 at 39473), founders T ' + w6.T.toFixed(4) + '; ' + sum(w6.sim._lag, w6.sim.night.k));
log('   the misses by size: ' + bins(w6.sim._lag));
log('   ... the cap at 40: founders T ' + w40.T.toFixed(4) + ' (' + ((w40.T - w6.T) * 60).toFixed(2) + ' s); ' + sum(w40.sim._lag, w40.sim.night.k));
fs.rmSync(TMP, { recursive: true, force: true });
if (process.argv.includes('--write')) {
  const dir = path.join(__dirname, 'results_2026-11-23'); if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'e116_level_solve_lag.txt'), out.join('\n').replace(TMP, '<scratch>') + '\n(' + new Date().toISOString() + ')\n');
}
