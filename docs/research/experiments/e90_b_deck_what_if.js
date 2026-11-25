// e90 (G6b): validate.js's "Titanic damage, all bulkheads to B deck" what-if sits on a knife edge. Main keeps her
// afloat; candidate A's best refit (e89: area 0.83983, wMul 1.397, aDown 0.1545, fOpen 0.01278) founders her at about
// 6 h. Which part flips it, and where it stays afloat on Hackett and Bedford's split. Run on wt/split (G6, W6 and
// G6b's openAlong). The preset is built as validate.js builds it, with every bulkhead carried to B deck.
//   node docs/research/experiments/e90_b_deck_what_if.js [--grid] [--write]
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', '..', '..');
const C = require(path.join(root, 'core', 'core.js'));
const E = require(path.join(root, 'core', 'encounter.js'));
const N = require(path.join(root, 'core', 'night.js'));
const SC = require(path.join(root, 'core', 'scenarios.js'));
const ship = C.buildShip(), out = [], log = (s) => { out.push(s); console.log(s); };
const F0 = SC.TITANIC_SPLIT.map(s => s.f), HB = [0.056, 0.139, 0.288, 0.307, 0.260, 0.121].map(a => a / 1.171);
const A = { wMul: 1.397, aDown: 0.1545, fOpen: 0.01278 };
function bDeck(split, area, params) {
  SC.TITANIC_SPLIT.forEach((s, k) => { s.f = split[k]; });
  const scen = SC.PRESETS.titanic.build({ areaTitanic: area });
  scen.bulkTop = Object.fromEntries(C.BULKHEADS.map(b => [b.id, 'B']));
  const sim = C.createSim(ship, params, scen), res = C.run(sim, { tMax: 8 * 3600, every: 60, stopWhenStable: true });
  SC.TITANIC_SPLIT.forEach((s, k) => { s.f = F0[k]; });
  const z = new Float64Array(16); for (let n = 0; n < C.NN; n++) z[n >> 2] += sim.vol[n];
  return (res.foundered ? 'FOUNDERS at ' + (res.founderT / 3600).toFixed(2) + ' h' : 'afloat to ' + (sim.t / 3600).toFixed(2) + ' h') + '; trim ' + res.final.trimDeg.toFixed(2) + ', list ' + res.final.listDeg.toFixed(2) + '; boiler room 4 holds ' + z[6].toFixed(0) + ' m3';
}
log('e90 (G6b) on ' + root + ': validate.js\'s bulkheads-to-B-deck what-if, the 1912 damage with every bulkhead to B deck');
const ROWS = [
  ['the preset\'s split (the water held), today\'s numbers, 0.7506 m2', F0, 0.7506, {}],
  ['the preset\'s split, A\'s numbers, 0.83983 m2', F0, 0.83983, A],
  ['Hackett and Bedford\'s split, today\'s numbers, 0.7506 m2', HB, 0.7506, {}],
  ['Hackett and Bedford\'s split, today\'s numbers, 0.83983 m2', HB, 0.83983, {}],
  ['Hackett and Bedford\'s split, A\'s numbers, 0.7506 m2', HB, 0.7506, A],
  ['Hackett and Bedford\'s split, A\'s numbers, 0.83983 m2 (A)', HB, 0.83983, A],
  ['  the same without the bunker (bunker 0)', HB, 0.83983, Object.assign({ bunker: 0 }, A)],
  ['  the same, wMul 1.397 alone', HB, 0.83983, { wMul: 1.397 }],
  ['  the same, aDown 0.1545 alone', HB, 0.83983, { aDown: 0.1545 }],
  ['  the same, fOpen 0.01278 alone', HB, 0.83983, { fOpen: 0.01278 }],
  ['A-kept (e89): 0.79554 m2, wMul 1.1, aDown 0.24, fOpen 0.01879', HB, 0.79554, { wMul: 1.1, aDown: 0.24, fOpen: 0.01879 }],
];
for (const [lab, split, area, params] of ROWS) log('  ' + lab.padEnd(66) + bDeck(split, area, params));
if (process.argv.includes('--grid')) {
  log('\n  Hackett and Bedford\'s split at 0.83983 m2, fOpen 0.01278: the what-if over wMul and aDown');
  for (const wMul of [1.036, 1.1, 1.15, 1.25]) for (const aDown of [0.2815, 0.24, 0.20]) log('    wMul ' + wMul.toFixed(3) + ', aDown ' + aDown.toFixed(4) + ': ' + bDeck(HB, 0.83983, { wMul, aDown, fOpen: 0.01278 }));
}
log('\n(' + new Date().toISOString() + ')');
if (process.argv.includes('--write')) {
  const dir = path.join(__dirname, 'results_2026-11-20'); if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'e90_b_deck_what_if.txt'), out.join('\n') + '\n');
}
