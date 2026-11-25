// e124 (B1+B2, 2026-11-24, at the coordinator's 05:2x): the break's onset checked about HER OWN axes at a list.
//
// B2's onset (core/readers/onset.js) fires on (M/Mu)^2 + (V/Vu)^2 = 1, with M the gauge's moment about the horizontal axis
// across her (core/readers/girder.js, the reading). Her capacity Mu bends about her own deck axis (y), and a list turns
// part of the vertical forces' moment onto her vertical axis (z): Mx cos(list) about her y and Mx sin(list) about her z
// (Z1's kept-set run found the spread by cos(list)). Three checks, at every station the onset looks at (the gauge's slice
// edges and its band):
//   (i)   TODAY: (Mrel/Mu)^2 + (V/Vu)^2, as onset.js;
//   (ii)  HER Y ALONE: (MvertRel/Mu)^2 + (Vz/Vu)^2: the moment about her deck axis, relieved as Mrel is, and the shear
//         along her z;
//   (iii) BIAXIAL: (MvertRel/Mu)^2 + (MlatRel/Mu_z)^2 + (Vz/Vu)^2, a stated circular interaction. Mu_z, her capacity
//         about her vertical axis, is not computed by section.js. It is bracketed here from section.js's own elements:
//         - HIGH: her lateral fully plastic moment at the yield. Each element sits at its distance from her centre line
//           [bet]: side, bilge and sheer strakes at her half-breadth at their height, plating and members across her
//           breadth at half of it, the keel on it;
//         - LOW: that times the vertical's own ratio of Smith's hogging ultimate to its fully plastic moment (the joints,
//           the buckling, the progressive collapse) [bet: the lateral's knock-down as the vertical's].
//         Her lateral shear (along her y) is left out: the decks and the bottom carry it, far above the 0.2 V a list of
//         12 deg puts there.
// For the landed member and each kept member (out/kept_1912.json), the 1912 watch handed over at the flag (so that it runs
// on past today's onset; to that step it is the default watch to the bit), checked coarsely while every ratio is under
// 0.95 and every step past it: the first step at or past 1 under each check, its T, station and list.
// Headless; changes nothing in the repository.
//   node docs/research/experiments/e124_onset_list_axis.js [<worktree>] [members, e.g. 0,24]
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
try { os.setPriority(0, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch (e) { /* as it is */ }
const root = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', '..'));
const ONLY = process.argv[3] ? new Set(process.argv[3].split(',').map(Number)) : null;
const C = require(path.join(root, 'core', 'core.js'));
const N = require(path.join(root, 'core', 'night.js'));
const O = require(path.join(root, 'core', 'readers', 'onset.js'));
const GD = require(path.join(root, 'core', 'readers', 'girder.js'));
const S = require(path.join(root, 'core', 'readers', 'section.js'));
const EN = require(path.join(root, 'tools', 'ensemble.js'));
const DEG = 180 / Math.PI, f = (v, d) => (v === null || v === undefined || !Number.isFinite(v)) ? '-' : v.toFixed(d === undefined ? 2 : d);
const say = (s) => console.log(s === undefined ? '' : s);

// ---------------------------------------------------------------- the capacities by station (the ship is the same for
// every member: the members differ in params, coal, bunker and encounter, not in her build)
const SY = S.MAT.sY, CAPS = new Map(), KINDS = new Set();
function capsAt(ship, x) {
  const key = x.toFixed(6);
  if (CAPS.has(key)) return CAPS.get(key);
  const a = S.at(ship, x);
  let r = null;
  if (!a.none && a.hog.Mu > 0 && a.sag.Mu > 0 && a.Vu > 0) {
    const els = S.elements(ship, x);
    let Mpz = 0, Atot = 0;
    for (const e of els) {
      KINDS.add(e.kind);
      const hb = C.halfBreadth(x, e.z, ship.hull);
      const y = (e.kind === 'side' || e.kind === 'bilge' || e.kind === 'sheer') ? hb : (e.kind === 'keel' ? 0 : 0.5 * hb);
      Mpz += SY * e.A * y;                      // e.A is both sides' area, so this is both halves' about her centre line
      Atot += e.A;
    }
    // the vertical's fully plastic moment: the plastic neutral axis halves the area
    const byZ = els.slice().sort((p, q) => p.z - q.z);
    let acc = 0, zP = byZ.length ? byZ[0].z : 0;
    for (const e of byZ) { if (acc + e.A >= 0.5 * Atot) { zP = e.z; break; } acc += e.A; }
    let Mpy = 0; for (const e of els) Mpy += SY * e.A * Math.abs(e.z - zP);
    const kappa = Mpy > 0 ? a.hog.Mu / Mpy : 1;
    r = { hog: a.hog.Mu, sag: a.sag.Mu, Vu: a.Vu, where: a.where, MuzHi: Mpz, MuzLo: kappa * Mpz, kappa, Mpy };
  }
  CAPS.set(key, r);
  return r;
}

// ---------------------------------------------------------------- the three checks at every station of one moment()
const CHECKS = ['today', 'herY', 'biaxHi', 'biaxLo'];
function evaluate(sim, ship) {
  const res = GD.moment(sim), best = {};
  for (const [H, src] of [[res.hull, 'hull'], [res.band, 'band']]) {
    for (let i = 0; i < H.x.length; i++) {
      const c = capsAt(ship, H.x[i]); if (!c) continue;
      const M = H.M[i], V = H.V[i], My = H.MvertRel[i], Mz = H.MlatRel[i], Vz = H.Vz[i];
      const Mu = M >= 0 ? c.hog : c.sag, MuY = My >= 0 ? c.hog : c.sag;
      const r = {
        today: (M / Mu) ** 2 + (V / c.Vu) ** 2,
        herY: (My / MuY) ** 2 + (Vz / c.Vu) ** 2,
        biaxHi: (My / MuY) ** 2 + (Mz / c.MuzHi) ** 2 + (Vz / c.Vu) ** 2,
        biaxLo: (My / MuY) ** 2 + (Mz / c.MuzLo) ** 2 + (Vz / c.Vu) ** 2,
      };
      for (const k of CHECKS) if (!best[k] || r[k] > best[k].r) best[k] = { r: r[k], x: H.x[i], where: c.where, src, M, My, Mz, V, Vz, Mu, MuY, MuzHi: c.MuzHi, MuzLo: c.MuzLo, sense: M >= 0 ? 'hogging' : 'sagging' };
    }
  }
  return best;
}

// ---------------------------------------------------------------- one member
function runMember(i, x) {
  const ship = C.buildShip();
  const { sim } = EN.memberWatch(x, ship, { create: { handover: 'flag' } });
  const st = O.start(), first = {};
  let next = 0, peak = 0;
  while (!sim.foundered && sim.t < EN.T_MAX && CHECKS.some(k => !first[k])) {
    N.step(sim);
    const w = sim.night;
    if (!(w.tTouch >= 0)) continue;
    O.look(sim, st);                                        // today's onset, by the reader's own schedule
    const T = (sim.t - w.tTouch) / 60;
    if (T < 120 || w.k < next) continue;
    const b = evaluate(sim, ship);
    peak = Math.max(...CHECKS.map(k => b[k].r));
    next = peak < 0.95 ? w.k + 8 : w.k + 1;                 // 8 steps move a ratio well under 5 % of the way to 1
    for (const k of CHECKS) if (!first[k] && b[k].r >= 1) first[k] = Object.assign({ k: w.k, T, list: sim.roll * DEG, trim: sim.pitch * DEG }, b[k]);
  }
  return { i, found: st.found ? { k: st.found.k, T: st.found.T, x: st.found.x, list: st.found.listDeg } : null, first, fp: N.fingerprint(sim), founderT: sim.foundered ? (sim.founderT - sim.night.tTouch) / 60 : null };
}

// ---------------------------------------------------------------- the kept set
const kept = JSON.parse(fs.readFileSync(path.join(root, 'out', 'kept_1912.json'), 'utf8'));
const xs = [null].concat(kept.members.map(m => m.inputs));
const t0 = Date.now();
say('e124: the break\'s onset about her own axes at a list; the landed member and the kept set (' + kept.name + '); each 1912 watch handed over at the flag, checked every step past a ratio of 0.95');
say('   member   list     (i) today: step, T, station          (ii) her y alone: step, T (late by)      (iii) biaxial, Mu_z high: step, T (late by)   (iii) biaxial, Mu_z low: step, T (late by)');
const rows = [];
xs.forEach((x, i) => {
  if (ONLY && !ONLY.has(i)) return;
  const r = runMember(i, x); rows.push(r);
  const a = r.first.today, cell = (k) => { const b = r.first[k]; return b ? (b.k + ', ' + f(b.T, 2) + ' (' + (a ? '+' + f((b.k - a.k) * 0.25, 2) + ' s' : '-') + (b.x !== (a && a.x) ? ', at x ' + f(b.x, 2) : '') + ')') : 'none'; };
  say('   ' + (i ? '#' + i : 'landed').padEnd(8) + f(a ? Math.abs(a.list) : null, 2).padStart(6) + '   ' + (a ? (a.k + ', ' + f(a.T, 2) + ', x ' + f(a.x, 2) + (r.found && r.found.k === a.k ? '' : ' (THE READER: ' + (r.found ? r.found.k : 'none') + ')')).padEnd(36) : 'none'.padEnd(36)) +
    cell('herY').padEnd(40) + cell('biaxHi').padEnd(45) + cell('biaxLo'));
});
say();
const landed = rows.find(r => r.i === 0);
if (landed) {
  const a = landed.first.today;
  say('THE DEFAULT WATCH (the landed member): today\'s onset at step ' + (a ? a.k : '-') + ' (the reader ' + (landed.found ? landed.found.k : '-') + '; pinned 37,792); her y alone ' + (landed.first.herY ? landed.first.herY.k : '-') + ', biaxial ' + (landed.first.biaxHi ? landed.first.biaxHi.k : '-') + ' (Mu_z high) / ' + (landed.first.biaxLo ? landed.first.biaxLo.k : '-') + ' (low). Its end moves unless all four agree');
  const c = capsAt(C.buildShip(), a ? a.x : -10.929);
  if (c) say('   at its station: Mu ' + f(c.hog / 1e9, 3) + ' GN m (hogging); Mu_z ' + f(c.MuzLo / 1e9, 2) + ' to ' + f(c.MuzHi / 1e9, 2) + ' GN m (kappa ' + f(c.kappa, 3) + ', the vertical\'s fully plastic ' + f(c.Mpy / 1e9, 2) + ')');
}
const keptRows = rows.filter(r => r.i > 0);
const band = (k) => { const T = keptRows.map(r => r.first[k] && r.first[k].T).filter(v => v !== undefined && v !== null); return T.length ? f(Math.min(...T), 2) + ' to ' + f(Math.max(...T), 2) + ' (' + T.filter(v => v >= 155 && v <= 159.7).length + ' of ' + T.length + ' in T 155 to 159.7)' : '-'; };
const lag = (k) => { const L = keptRows.filter(r => r.first[k] && r.first.today).map(r => (r.first[k].k - r.first.today.k) * 0.25); return L.length ? f(Math.min(...L), 2) + ' to ' + f(Math.max(...L), 2) + ' s' : '-'; };
if (keptRows.length) {
  say('THE KEPT SET (' + keptRows.length + '): the onset\'s T, min after the touch:');
  for (const k of CHECKS) say('   ' + ({ today: '(i) today', herY: '(ii) her y alone', biaxHi: '(iii) biaxial, Mu_z high', biaxLo: '(iii) biaxial, Mu_z low' })[k].padEnd(28) + band(k) + (k === 'today' ? '' : '; later than today by ' + lag(k)));
  const st = new Set(keptRows.flatMap(r => CHECKS.map(k => r.first[k] && f(r.first[k].x, 2))).filter(Boolean));
  say('   the stations they fire at: ' + [...st].join(', '));
}
say('   the element kinds placed: ' + [...KINDS].join(', '));
say('(' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)');
