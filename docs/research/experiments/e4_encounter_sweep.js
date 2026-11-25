// E4: which of the encounter's bets shape the 1912 damage? One geometry (helm order 200 m from the ice, the ice
// reaching 27 m to port of the track, helm reversed 2 s after the touch), the ice and plating parameters swept.
// Reports where the tears run and how the opening area splits by compartment (Hackett-Bedford: 4 13 21 24 32 6 0).
// Usage: node e4_encounter_sweep.js <repo root>
const path = require('path');
const root = process.argv[2];
const C = require(path.join(root, 'core', 'core.js'));
const E = require(path.join(root, 'core', 'encounter.js'));
const R = require(path.join(root, 'tools', 'encounter_run.js'));
const ship = C.buildShip();
const HB = [4, 13, 21, 24, 32, 6, 0];
function score(z, tot) { let e = 0; for (let k = 0; k < 7; k++) e += Math.abs((tot > 0 ? 100 * z[k] / tot : 0) - HB[k]); for (let k = 7; k < 16; k++) e += tot > 0 ? 100 * z[k] / tot : 0; return e; }
const rows = [];
function run(label, ice, geo) {
  geo = Object.assign({ ahead: 200, port: 27, portAround: 2 }, geo || {});
  const sim = R.encounter(Object.assign({}, geo, { ice }), ship), s = E.summary(sim), tot = s.stbd.area + s.port.area;
  const split = [0, 1, 2, 3, 4, 5, 6].map(k => (tot > 0 ? 100 * s.stbd.zone[k] / tot : 0).toFixed(0)).join('/');
  const aft = tot > 0 ? (100 * (1 - [0, 1, 2, 3, 4, 5, 6].reduce((a, k) => a + s.stbd.zone[k], 0) / tot)).toFixed(0) : '0';
  rows.push([score(s.stbd.zone, tot), label]);
  console.log(label.padEnd(44), (s.kind).padEnd(7), ('tears ' + s.stbd.tears + ' x ' + s.stbd.tearFrom + '..' + s.stbd.tearTo).padEnd(24), ('dents ' + s.stbd.dents).padEnd(10), 'split', split.padEnd(22), 'aft of BR4', (aft + '%').padStart(4), ' score', score(s.stbd.zone, tot).toFixed(0));
}
console.log('base ICE', JSON.stringify(E.ICE));
run('base', {});
for (const q of [3e6, 12e6, 24e6]) run('q ' + q / 1e6 + ' MN/m3', { q });
for (const p0 of [3e6, 12e6, 24e6]) run('p0 ' + p0 / 1e6 + ' MPa', { p0 });
for (const dTear of [0.1, 0.3, 0.4]) run('dTear ' + dTear + ' m', { dTear });
for (const mass of [1e8, 2e9]) run('berg mass ' + mass / 1e9 + 'e9 kg', { mass });
for (const R0 of [20, 80]) run('spur radius ' + R0 + ' m', { R: R0 });
for (const taper of [0, 0.2]) run('taper ' + taper, { taper });
run('p0 12, q 24, dTear 0.3', { p0: 12e6, q: 24e6, dTear: 0.3 });
run('p0 24, q 24, dTear 0.4', { p0: 24e6, q: 24e6, dTear: 0.4 });
run('p0 12, q 12, dTear 0.4', { p0: 12e6, q: 12e6, dTear: 0.4 });
for (const pa of [null, 0, 4, 8]) run('base, port-around ' + pa, {}, { portAround: pa });
for (const [ah, po] of [[180, 27], [220, 27], [200, 22], [200, 32], [240, 32]]) run('base, geometry ' + ah + '/' + po, {}, { ahead: ah, port: po });
rows.sort((a, b) => a[0] - b[0]);
console.log('\nclosest to the reconstructed split:', rows.slice(0, 5).map(r => r[1] + ' (' + r[0].toFixed(0) + ')').join('; '));
