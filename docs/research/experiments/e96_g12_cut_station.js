// e96 (G12): where she is cut and when, against how the pieces lie. Part 1: the 1912 watch handed over at B2's onset's
// own step, cut clean at eleven stations across the record's band (x -16 to -27, bulkhead K to J; the girder note) and
// around B2's own station, each under ten of Z1's perturbations. Part 2: the same at moments after the onset (every half
// minute of her time to two minutes on), six stations, six perturbations: how often both pieces land upright. (e94: cut at the flag rule's x -23 the bow turns over at some moments after the
// onset even near upright; cut at B2's station it never does before trim 40.) If restoring her hull's ends (R3, G14)
// moves B2's onset later or its station aft into the band, this map says whether the knife-edge comes back.
// Headless; changes nothing (each moment is a structured clone of the watch).
//   node docs/research/experiments/e96_g12_cut_station.js [<worktree>]
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
const copyOf = (sim) => { const o = Object.assign({}, sim); o.ship = null; const c = structuredClone(o); c.ship = ship; return c; };

// the watch from B2's onset on, copied every half minute for two minutes (or to the flag)
const w = N.create(ship, N.spec(1912), { auto: true });
let fd = null, next = 0; const moments = [];
while (!w.foundered && w.t < 5 * 3600 && moments.length < 5) {
  N.step(w);
  if (!fd && w.onset && w.onset.found) { fd = w.onset.found; next = w.t; }
  if (fd && w.t >= next - 1e-9) { moments.push({ sim: copyOf(w), T: L.Tof(w), trim: w.pitch / DEG, list: w.roll / DEG }); next += 30; }
}
const lieOf = (q) => (q.lies === 'upright' ? 'U' : (q.lies === 'UPSIDE DOWN' ? 'X' : 'S'));
// part 1: at the onset's own step, eleven cuts under ten perturbations
const CUTS1 = [-27, -25, -23, -21, -19, -17, -15, -13, fd.x, -9, -7];
const PERT1 = L.PERTURB.filter(p => ['none', 'trim +1 deg', 'trim -1 deg', 'list +1 deg', 'list -1 deg', 'roll rate x1.2', 'heave rate x0.8', 'heave rate x1.2', 'last-bit noise, seed 1', 'last-bit noise, seed 2'].indexOf(p.id) >= 0);
say('e96 (G12) on ' + root + ' at ' + head + ', part 1: the 1912 watch at B2\'s onset (' + f(moments[0].T, 2) + ' after the touch, trim ' + f(moments[0].trim, 1) + ', list ' + f(moments[0].list, 1) + '), cut clean at each station, under ' + PERT1.length + ' of Z1\'s perturbations');
say('  each cell: the bow / the stern, U upright, X upside down, S on her side (the record\'s band x -16 to -27; B2\'s station x ' + f(fd.x, 2) + ')');
say('  ' + 'x of the cut'.padEnd(14) + PERT1.map(p => p.id.replace('last-bit noise, seed ', 'noise ').padEnd(16)).join('') + '  both upright');
let all1 = 0, n1 = 0;
for (const x of CUTS1) {
  let both = 0;
  const cells = PERT1.map(p => {
    const r = L.perturbed(F, GI, moments[0].sim, { any: true, cut: x, rule: 'break', t0: moments[0].sim.t }, p), b = r.land.find(q => q.id === 'bow'), s = r.land.find(q => q.id === 'stern');
    if (b.lies === 'upright' && s.lies === 'upright') both++;
    return (lieOf(b) + '/' + lieOf(s)).padEnd(16);
  });
  all1 += both; n1 += PERT1.length;
  say('  ' + (f(x, 2) + (Math.abs(x - fd.x) < 1e-9 ? ' (B2)' : '')).padEnd(14) + cells.join('') + '  ' + both + ' of ' + PERT1.length);
}
say('  both upright in ' + all1 + ' of ' + n1);
say();
// part 2: the moment against the cut, from the onset to two minutes on
const CUTS = [-27, -23, -19, -15, fd.x, -7];
const PERT = L.PERTURB.filter(p => ['none', 'trim +1 deg', 'trim -1 deg', 'list +1 deg', 'list -1 deg', 'heave rate x1.2'].indexOf(p.id) >= 0);
say('e96, part 2: the 1912 watch from B2\'s onset (x ' + f(fd.x, 2) + ') on, every half minute, cut clean at each station, under ' + PERT.length + ' of Z1\'s perturbations (' + PERT.map(p => p.id).join(', ') + ')');
say('  each cell: how many of the ' + PERT.length + ' land both pieces upright; then which piece turned over when one did (b the bow, s the stern)');
say('  ' + 'moment'.padEnd(30) + CUTS.map(x => ('x ' + f(x, 2) + (Math.abs(x - fd.x) < 1e-9 ? ' B2' : '')).padEnd(13)).join(''));
for (const m of moments) {
  const cells = CUTS.map(x => {
    let both = 0, turned = '';
    for (const p of PERT) {
      const r = L.perturbed(F, GI, m.sim, { any: true, cut: x, rule: 'break', t0: m.sim.t }, p), b = r.land.find(q => q.id === 'bow'), s = r.land.find(q => q.id === 'stern');
      if (b.lies === 'upright' && s.lies === 'upright') both++;
      else turned += (b.lies !== 'upright' && turned.indexOf('b') < 0 ? 'b' : '') + (s.lies !== 'upright' && turned.indexOf('s') < 0 ? 's' : '');
    }
    return (both + (turned ? ' (' + turned + ')' : '')).padEnd(13);
  });
  say('  ' + ('T ' + f(m.T, 2) + ', trim ' + f(m.trim, 1) + ', list ' + f(m.list, 1)).padEnd(30) + cells.join(''));
}
say('(e96 took ' + f((Date.now() - t0) / 1000, 0) + ' s)');
