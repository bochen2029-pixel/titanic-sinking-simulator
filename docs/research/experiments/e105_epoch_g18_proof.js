// e105: the calibration epoch's C2 (G18), its proof. At rung 2's numbers of G7's ladder (the opening 0.8286 m2, wMul 1.1,
// aDown 0.256, fOpen 0.0214; the encounter's area constant at that opening, 0.24539018557499465), where today's doctrine
// (PLANT.leadRule 0) flips the 1912 watch's founder between two branches on a last-bit change, the same sweep of the
// area constant under today's rule and under C2's (leadRule 1: each room judged once by whether its pumps can hold it).
//   node docs/research/experiments/e105_epoch_g18_proof.js [--write]
'use strict';
const fs = require('fs'), path = require('path'), os = require('os');
try { os.setPriority(0, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch (e) {}
const C = require('../../../core/core.js'), E = require('../../../core/encounter.js'), N = require('../../../core/night.js'), Sys = require('../../../core/systems.js');
const ship = C.buildShip(), out = [], log = (s) => { out.push(s); console.log(s); };
const RUNG2 = { wMul: 1.1, aDown: 0.256, fOpen: 0.0214 }, A0 = 0.24539018557499465;
const EPS = [-1e-4, -1e-6, -1e-8, -1e-10, -1e-12, 0, 1e-12, 1e-10, 1e-8, 1e-6, 1e-4];
function watch(alpha, rule) {
  const kA = E.ICE.alpha, kR = Sys.PLANT.leadRule;
  E.ICE.alpha = alpha; Sys.PLANT.leadRule = rule;
  try { const s = N.sink(N.create(ship, N.spec(1912), { auto: true, readers: false, params: RUNG2 })); return (s.founderT - s.night.tTouch) / 60; }
  finally { E.ICE.alpha = kA; Sys.PLANT.leadRule = kR; }
}
log('e105 (the epoch, C2): the 1912 watch at rung 2\'s numbers, the area constant alpha x (1 + e); her founder, min after the touch');
for (const rule of [0, 1]) {
  const T = EPS.map(e => watch(A0 * (1 + e), rule)), base = T[EPS.indexOf(0)];
  const near = EPS.map((e, i) => [e, T[i]]).filter(([e]) => Math.abs(e) <= 1e-6), worst = Math.max(...near.map(([, t]) => Math.abs(t - base)));
  log('  leadRule ' + rule + (rule ? ' (C2: judged by inflow)' : ' (today: lost or not at the due instant)') + ': ' + T.map(t => t.toFixed(2)).join(', '));
  log('      the largest step from e = 0 within |e| <= 1e-6: ' + worst.toFixed(3) + ' min; the spread over all eleven: ' + (Math.max(...T) - Math.min(...T)).toFixed(3) + ' min');
}
if (process.argv.includes('--write')) {
  const dir = path.join(__dirname, 'results_2026-11-21'); if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'e105_epoch_g18_proof.txt'), out.join('\n') + '\n(' + new Date().toISOString() + ')\n');
}
