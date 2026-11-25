// e94 (G12): which moment of her last minutes a hand-over can take and still land both pieces upright. The 1912 watch
// copied at moments from B2's onset to the flag (every 15 s of her time, and the flag's own step), as the core has her and
// with her list held from the onset (e93's what-if), each copy handed to the fall there and cut clean at two stations:
// B2's onset's (x -10.93 on the 1912 watch) and the flag rule's (the girder's X_BREAK, x -23): how each piece lies against
// the trim and list it was let go at, and against where she was cut. Separates the moment, the list and the cut (e93 cut
// at X_BREAK). Headless; changes nothing (each copy is a structured clone of the watch).
//   node docs/research/experiments/e94_g12_handover_moment.js [<worktree>]
'use strict';
const path = require('path');
const cp = require('child_process');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', '..'));
const C = require(path.join(root, 'core', 'core.js'));
const N = require(path.join(root, 'core', 'night.js'));
const GI = require(path.join(root, 'core', 'readers', 'girder.js'));
const F = require(path.join(root, 'core', 'readers', 'fall.js'));
require(path.join(root, 'core', 'readers', 'onset.js'));
const L = require(path.join(__dirname, 'e91_g12_lib.js'));
const { f, DEG } = L;
const t0 = Date.now(), ship = C.buildShip();
let head = '?'; try { head = cp.execSync('git -C "' + root + '" rev-parse --short HEAD').toString().trim(); } catch (e) { /* not a repository */ }
const say = (s) => console.log(s === undefined ? '' : s);
// a copy of the watch at this step (as the forecast copies it, the ship put back), and the fall from it
const copyOf = (sim) => { const o = Object.assign({}, sim); o.ship = null; const c = structuredClone(o); c.ship = ship; return c; };
const lie = (c, x) => { const fall = L.toRest(F, F.begin(c, { any: true, cut: x, rule: 'break', t0: c.t })), land = L.landing(F, GI, fall); return { b: land.find(p => p.id === 'bow'), s: land.find(p => p.id === 'stern') }; };
function sweep(hold) {
  const sim = N.create(ship, N.spec(1912), { auto: true });
  const rows = []; let fd = null, next = 0;
  const take = () => { const c = copyOf(sim); rows.push({ T: L.Tof(sim), trim: sim.pitch / DEG, list: sim.roll / DEG, flag: sim.foundered, on: lie(c, fd.x), xb: lie(copyOf(sim), GI.X_BREAK) }); };
  while (!sim.foundered && sim.t < 5 * 3600) {
    N.step(sim);
    if (!fd && sim.onset && sim.onset.found) { fd = sim.onset.found; next = sim.t; if (hold) { sim.Iph0 = 1e30; sim.wph = 0; } }
    if (fd && (sim.t >= next - 1e-9 || sim.foundered)) { take(); next += 15; }
  }
  return { rows, fd };
}
const cell = (r) => (r.b.lies === 'upright' ? 'U' : (r.b.lies === 'UPSIDE DOWN' ? 'X' : 'S')) + '/' + (r.s.lies === 'upright' ? 'U' : (r.s.lies === 'UPSIDE DOWN' ? 'X' : 'S')) + ' (' + f(r.b.a.roll, 0) + ', ' + f(r.s.a.roll, 0) + ')';
say('e94 (G12) on ' + root + ' at ' + head + ': the 1912 watch let go at moments of her last minutes, cut clean at B2\'s station and at the flag rule\'s');
say('  each cell: the bow / the stern, U upright, X upside down, S on her side; their rolls on the bed (deg)');
for (const [name, hold] of [['as the core has her (the roll to its clamp)', false], ['her list held from the onset', true]]) {
  const { rows, fd } = sweep(hold);
  say('  ' + name + ':');
  say('    T after the touch   trim   list    cut at B2\'s x ' + f(fd.x, 2).padEnd(10) + 'cut at the flag rule\'s x ' + f(GI.X_BREAK, 2));
  for (const r of rows) say('    ' + f(r.T, 2).padStart(8) + (r.flag ? ' flag' : '     ') + f(r.trim, 1).padStart(7) + f(r.list, 1).padStart(7) + '    ' + cell(r.on).padEnd(26) + cell(r.xb));
}
say('(e94 took ' + f((Date.now() - t0) / 1000, 0) + ' s)');
