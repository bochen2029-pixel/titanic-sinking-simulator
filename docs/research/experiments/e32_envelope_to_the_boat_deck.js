// e32: a look only, for docs/BRAINSTORM_the_descent_to_the_bed_v2_2026-11-19.md (section 1.3): does the 80-degree roll
// of the model's last minutes come from the hull's top standing at B deck? Copies of the core with the envelope carried
// up to A deck, or to the boat deck, over the superstructure's length (x -78 to +76.9), each run on the 1912 damage
// preset with no refit. The copies are written to OUT, never into the repository.
//   node docs/research/experiments/e32_envelope_to_the_boat_deck.js [TREE] [OUT]
// TREE: a folder holding core/ (default: this repository); OUT: where the patched copies go (default: the system's
// temporary folder). It expects zTopAt as it stands in a97a6bd and stops if it has changed. Output of 2026-11-19, on the
// committed tree a97a6bd: results_2026-11-19/e32_envelope_to_the_boat_deck.txt
'use strict';
const fs = require('fs'), path = require('path'), os = require('os');
const HEAD = process.argv[2] || path.join(__dirname, '..', '..', '..'), OUT = process.argv[3] || path.join(os.tmpdir(), 'titanic_e32');
const DEG = 180 / Math.PI;
const f = (x, n) => (x === undefined || x === null || !isFinite(x) ? String(x) : x.toFixed(n === undefined ? 1 : n));
const src = fs.readFileSync(path.join(HEAD, 'core', 'core.js'), 'utf8');
const scen = fs.readFileSync(path.join(HEAD, 'core', 'scenarios.js'), 'utf8');
const OLD = 'function zTopAt(x) { return (inWell(x) ? G.deck.C : G.deck.B) + sheer(x); }';
if (src.indexOf(OLD) < 0) throw new Error('zTopAt not found as expected');
function load(deck) {
  const dir = path.join(OUT, 'top_' + deck); fs.mkdirSync(dir, { recursive: true });
  const patched = deck === 'B' ? src : src.replace(OLD, 'function zTopAt(x) { return (inWell(x) ? G.deck.C : ((x > -78 && x < 76.9) ? G.deck.' + deck + ' : G.deck.B)) + sheer(x); }');
  fs.writeFileSync(path.join(dir, 'core.js'), patched); fs.writeFileSync(path.join(dir, 'scenarios.js'), scen);
  return { C: require(path.join(dir, 'core.js')), SC: require(path.join(dir, 'scenarios.js')) };
}
for (const deck of ['B', 'A', 'Boat']) {
  const { C, SC } = load(deck), ship = C.buildShip();
  let Venv = 0; const c = ship.cols; for (let i = 0; i < c.N; i++) Venv += c.dxdy[i] * (c.zhi[i] - c.zlo[i]);
  for (const [nm, p] of [['as committed', {}], ['upperSplit 1, axUp 0.3', { upperSplit: 1, axUp: 0.3 }]]) {
    const sim = C.createSim(ship, p, SC.PRESETS.titanic.build({ areaTitanic: SC.CALIBRATED_AREA }));
    const marks = [100, 130, 145, 150, 152, 154, 155, 156, 157, 158, 159, 160, 162, 165, 170]; let i = 0; const rows = [];
    let t10 = -1, t20 = -1, t45 = -1, tr11 = -1, tr17 = -1, l11 = 0, l17 = 0;
    while (!sim.foundered && sim.t < 5 * 3600) {
      C.step(sim);
      const p1 = sim.pitch * DEG, r = Math.abs(sim.roll * DEG);
      if (t10 < 0 && r >= 10 && sim.t > 3600) t10 = sim.t; if (t20 < 0 && r >= 20) t20 = sim.t; if (t45 < 0 && r >= 45) t45 = sim.t;
      if (tr11 < 0 && p1 >= 11) { tr11 = sim.t; l11 = sim.roll * DEG; } if (tr17 < 0 && p1 >= 17) { tr17 = sim.t; l17 = sim.roll * DEG; }
      while (i < marks.length && sim.t >= marks[i] * 60) { rows.push('T' + marks[i] + ' ' + f(p1, 1) + '/' + f(sim.roll * DEG, 1)); i++; }
    }
    const ev = (id) => { const e = sim.events.find(q => q.id === id); return e ? f(e.t / 60, 1) : '-'; };
    const why = sim.hullTop < -0.5 ? 'hull top under' : (Math.abs(sim.pitch) > 1.2 ? 'trim over 68.75' : 'other');
    console.log(('top at ' + deck + ' deck, ' + nm).padEnd(42), 'envelope', f(Venv, 0), 'm3 | founders', sim.foundered ? f(sim.founderT / 60, 2) : 'no', 'min (' + why + ') at trim', f(sim.pitch * DEG, 1), 'list', f(sim.roll * DEG, 1), '| list 10 at T', f(t10 / 60, 1), ', 20 at', t20 < 0 ? 'never' : f(t20 / 60, 1), ', 45 at', t45 < 0 ? 'never' : f(t45 / 60, 1), '| trim 11 at T', f(tr11 / 60, 2), '(list', f(l11, 1) + '), 17 at T', f(tr17 / 60, 2), '(list', f(l17, 1) + ')');
    console.log('   trim/list:', rows.join('  '));
    console.log('   marks: over F', ev('overF'), ' ports', ev('ports'), ' well', ev('well'), ' fcastle', ev('fcastle'), ' bridge', ev('bridge'), ' (record: 75, 100, 130, 145, 155)');
  }
}
