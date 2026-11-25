// The hull girder's gauge (core/readers/girder.js): her weight along her length, and the bending moment of her hull.
//   node tools/girder_tests.js          (about three minutes on a quiet machine; ten on one shared with other suites)
// MUST rows: invariants (the weight curve closes; the two forms of the moment agree and close at rest; the gauge writes
// nothing into a sim; the library's statement of where the record's break falls is this run's). CHECK rows: the record,
// each with its reference; a miss is information, not a failure.
// THE FINDING is printed first: on the 1912 damage preset, the moment at the governing station against time and trim,
// every five minutes and every half degree near the end, on the default curve (Prohaska's a fitted to the panel's C-7:
// 0.660 since the landing, D92) and on the note's (a = 0.566); when it enters the studies' range (4.0 GN m), passes 4.6 and 5.4; where it peaks;
// and how those answers move with the weight curve's bets (docs/research/RESEARCH_breakup_hull_girder_v1_2026-11-17.md,
// 9a-9d). The gauge's reading is the moment relieved by her inertia, with no knock-down for the joint (the coordinator's
// decisions of 2026-11-17, 21:20 CST); the note's own reading, from the stern, is printed beside it.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const C = require('../core/core.js');
const SC = require('../core/scenarios.js');
const N = require('../core/night.js');
const G = require('../core/readers/girder.js');
const ship = C.buildShip(), DEG = 180 / Math.PI, GN = 1e9, LT = C.LT / 1000;
const NOTE = { variant: G.VARIANTS.note }, NOTE_STERN = { variant: G.VARIANTS.note, reading: 'stern' }, STERN = { reading: 'stern' };
const rows = []; let fails = 0;
function row(kind, what, value, ref, ok) { rows.push([kind, what, value, ref, ok]); if (kind === 'MUST' && !ok) fails++; }
const f = (x, n) => (x === null || x === undefined || !isFinite(x) ? 'n/a' : x.toFixed(n === undefined ? 2 : n));
const gn = (x) => f(x / GN, 3);
const clock = (Tmin) => { let s = Math.round((23 * 60 + 40 + Tmin) * 60) % 86400; const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); s %= 60; return (h % 12 || 12) + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + (h < 12 ? ' am' : ' pm'); };
// her water aboard, t, as the core weighs it (D88): C.weighedWater, the pockets with it, a full space or pocket at its
// capacity (under weighOverfill 0 the over-fill is the sea's head's stand-in, not water). C-7's "35,000 t aboard" is a
// bending moment's condition, so the weight aboard is its point.
const waterT = (sim) => C.weighedWater(sim) * C.RHO / 1000;
const out = [];                                   // the tables, printed before the rows
const say = (s) => out.push(s === undefined ? '' : s);
const RANGE = [G.CAP.low, G.CAP.high];

// ---------------------------------------------------------------- 1. the weight curve
const blank = C.createSim(ship, {}, SC.PRESETS.blank.build());
const cv = G.weight(blank), cvNote = G.weight(blank, G.VARIANTS.note);
{
  say('THE WEIGHT CURVE (core/readers/girder.js; the research note, 9a), closed to the model\'s own mass and centre; the default, a = ' + G.PROHASKA_A);
  say('  layer                                                tonnes        from        to   centroid   height  tags');
  for (const l of cv.layers) say('  ' + l.name.padEnd(50) + f(l.m, 1).padStart(10) + f(l.x0, 2).padStart(11) + f(l.x1, 2).padStart(10) + f(l.xc, 2).padStart(11) + f(l.z, 2).padStart(9) + '  ' + l.tag);
  say('  ' + 'total'.padEnd(50) + f(cv.total, 1).padStart(10) + '   machinery ' + f(cv.machinery, 0) + ' t; the hull\'s trapezoid ends ' + cv.hull.ends.map(v => f(v, 3)).join(' aft, ') + ' fore (W/L), middle ' + f(cv.hull.b, 3) + ', over x ' + f(cv.hull.xs, 2) + ' to ' + f(cv.hull.xf, 2));
  say('  the note\'s curve (a = ' + G.PROHASKA_A_NOTE + '): the trapezoid\'s ends ' + cvNote.hull.ends.map(v => f(v, 3)).join(' aft, ') + ' fore, middle ' + f(cvNote.hull.b, 3) + '; every other layer the same');
  const xs = [-138.9, -130, -120, -110, -100, -90, -80, -70, -60, -50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130.2];
  say('  w(x), t/m:  ' + xs.map(x => f(x, 0) + ': ' + f(G.w(cv, x), 0)).join('  '));
  say('  the note\'s: ' + xs.map(x => f(x, 0) + ': ' + f(G.w(cvNote, x), 0)).join('  '));
  say();
  const check = (c) => {
    let wmin = Infinity, xmin = 0;
    const probe = [];
    for (let x = c.hull.xs; x <= c.hull.xf; x += 0.05) probe.push(x);
    for (const p of c.pieces) probe.push(p.x0 + 1e-9, p.x1 - 1e-9);
    for (const x of probe) { if (x < c.hull.xs || x >= c.hull.xf) continue; const v = G.w(c, x); if (v < wmin) { wmin = v; xmin = x; } }
    const ms = blank.ms / 1000;
    return { wmin, xmin, ok: Math.abs(c.total - ms) / ms < 1e-12 && Math.abs(c.lcg - blank.g0[0]) < 1e-9 && Math.abs(c.vcg - blank.g0[2]) < 1e-9 && wmin > 0 };
  };
  const a = check(cv), b = check(cvNote);
  row('MUST', 'the weight curve closes: its integral is sim.ms, its centre the model\'s own, and it is positive the whole length',
    f(cv.total, 4) + ' t, LCG ' + f(cv.lcg, 6) + ' m, VCG ' + f(cv.vcg, 6) + ' m; least ' + f(a.wmin, 1) + ' t/m at x ' + f(a.xmin, 1) + '; the note\'s curve too (least ' + f(b.wmin, 1) + ')',
    'sim.ms ' + f(blank.ms / 1000, 4) + ' t, x_G ' + f(blank.g0[0], 6) + ', KG ' + f(blank.g0[2], 6) + ' (to rounding); > 0', a.ok && b.ok);
}

// ---------------------------------------------------------------- 2. intact at rest, the drafts of 14 April
{
  const r = G.moment(blank, { loads: true }), H = r.hull, n = H.x.length - 1, rn = G.moment(blank, NOTE);
  let pk = 0, worst = 0, dmax = 0, diff = 0, relDiff = 0;
  for (let j = 0; j <= n; j++) { pk = Math.max(pk, Math.abs(H.Mstern[j])); worst = Math.max(worst, Math.abs(H.Mstern[j] - H.Mbeam[j] - H.D[j])); dmax = Math.max(dmax, Math.abs(H.D[j])); diff = Math.max(diff, Math.abs(H.Mstern[j] - H.Mbeam[j])); relDiff = Math.max(relDiff, Math.abs(H.Mrel[j] - H.Mstern[j])); }
  for (let i = 0; i < r.band.x.length; i++) { worst = Math.max(worst, Math.abs(r.band.Mstern[i] - r.band.Mbeam[i] - r.band.D[i])); diff = Math.max(diff, Math.abs(r.band.Mstern[i] - r.band.Mbeam[i])); dmax = Math.max(dmax, Math.abs(r.band.D[i])); }
  const K = r.closure;
  say('INTACT AT REST, the drafts of 14 April (trim ' + f(r.trimDeg, 2) + ' deg, list ' + f(r.listDeg, 2) + ' deg), the default curve: along the hull, every fourth slice edge');
  say('  x m       M exact GN m   M beam GN m   shear MN   buoyancy t/m   weight t/m');
  for (let j = 0; j <= n; j += 4) { const k = Math.min(j, n - 1); say('  ' + f(H.x[j], 1).padStart(7) + gn(H.Mstern[j]).padStart(14) + gn(H.Mbeam[j]).padStart(14) + f(H.V[j] / 1e6, 2).padStart(11) + f(r.loads.b[k], 1).padStart(15) + f(r.loads.w[k], 1).padStart(13)); }
  say('  the break band (bulkhead K to J), every station: ' + Array.from(r.band.x).map((x, i) => f(x, 2) + ' ' + gn(r.band.M[i])).join(', '));
  say('  the gauge at rest: ' + G.describe(r) + ' (' + r.gov.zone + ' the range); on the note\'s curve ' + gn(rn.gov.M) + ' GN m');
  say();
  row('MUST', 'intact at rest: the beam form\'s shear and moment come back to zero at the bow (buoyancy equals weight)', 'shear ' + f(100 * K.VbeamShare, 4) + ' %, moment ' + f(100 * K.MbeamShare, 3) + ' % of their peaks (' + f(K.Vpeak / 1e6, 1) + ' MN, ' + gn(K.Mpeak) + ' GN m)', 'within 2 % (the note, 9a)', K.VbeamShare < 0.02 && K.MbeamShare < 0.02);
  row('MUST', '  ... and the exact form closes too: every force on her about any point sums to nothing at the core\'s equilibrium', 'moment ' + (100 * K.Mshare).toExponential(1) + ' %, shear ' + (100 * K.Vshare).toExponential(1) + ' % of the peaks', 'under 0.1 % (the core\'s Newton tolerance)', K.Mshare < 1e-3 && K.Vshare < 1e-3);
  row('MUST', '  ... and the exact form differs from the beam form by the term the beam form drops, and by nothing else', 'they differ by up to ' + gn(diff) + ' GN m; the dropped term (g sin(trim) at heights off the neutral axis) is up to ' + gn(dmax) + '; what is left ' + gn(worst) + ' GN m',
    'the difference no larger than the dropped term and 0.5 % of the peak; the rest under 0.5 % of the peak (' + gn(0.005 * pk) + ')', diff <= dmax + 0.005 * pk && worst < 0.005 * pk);
  row('MUST', '  ... and at rest the gauge\'s reading, relieved by her inertia, is the note\'s own, from the stern', 'they differ by up to ' + (relDiff / GN).toExponential(1) + ' GN m', 'under 0.1 % of the peak: there is nothing to relieve at rest', relDiff < 1e-3 * pk);
  const m23 = r.at(G.X_BREAK);
  row('CHECK', 'the intact still-water moment at x -23 m: a modest hog', gn(m23.Mstern) + ' GN m on the default curve (the note\'s ' + gn(rn.at(G.X_BREAK).Mstern) + '); the hull\'s peak ' + gn(r.peak.M) + ' at x ' + f(r.peak.x, 1), 'under about 1.5 GN m, a third of the capacity (the note\'s sanity bound, 9a) [bet]', m23.Mstern > 0 && m23.Mstern < 1.5 * GN);
}

// ---------------------------------------------------------------- 3. the 1912 damage preset, moment() every step: pure, and the finding
const golden = path.join(__dirname, '..', 'out', 'golden_titanic.json');
function run1912(withGirder) {
  const sim = C.createSim(ship, {}, SC.PRESETS.titanic.build());
  const rec = [], h = crypto.createHash('sha256');
  const sample = () => rec.push({ t: sim.t, zO: sim.zO, pitch: sim.pitch, roll: sim.roll, vz: sim.vz, wth: sim.wth, wph: sim.wph, inflow: sim.inflow, Vb: sim.Vb, vol: Array.from(sim.vol) });
  const state = () => { for (const a of [sim.vol, sim.level, sim.cx, sim.cy, sim.cz, sim.area, sim.zmin, sim.zmax, sim.merged, sim.pump]) h.update(Buffer.from(a.buffer, a.byteOffset, a.byteLength)); h.update(Buffer.from(new Float64Array([sim.t, sim.zO, sim.pitch, sim.roll, sim.vz, sim.wth, sim.wph, sim.inflow, sim.Vb, sim.mw, sim.hullTop, sim.pumped, sim.events.length]).buffer)); };
  const table = [], each = [];
  let tCost = 0, nCost = 0, nextT = 0, half = 4.5;
  sample(); let next = 60;
  const look = () => {
    const a = process.hrtime.bigint(), r = G.moment(sim), dt = Number(process.hrtime.bigint() - a) / 1e6;
    tCost += dt; nCost++;
    const trim = r.trimDeg, T = sim.t / 60, water = waterT(sim), g = r.gov;
    const e = { T, trim, water, M: g.M, Mstern: g.Mstern, Mfwd: g.Mfwd, x: g.x, zone: g.zone, clos: r.closure.Mshare, peak: r.peak };
    if (T >= 130) {                                // the note's curve, and the joint's option, every step where it matters
      const n = G.moment(sim, NOTE).gov, j = G.moment(sim, { joint: true }).gov;
      e.note = n.M; e.noteStern = n.Mstern; e.joint = j.M; e.jointX = j.x;
    }
    each.push(e);
    const step = half < 25 ? 0.5 : 5;               // every five minutes; every half degree from 5 deg, every 5 past 25
    if (sim.t >= nextT - 1e-9 || trim >= half + step) {
      if (sim.t >= nextT - 1e-9) nextT += 300;
      if (trim >= half + step) half = Math.floor(trim / step) * step;
      table.push({ T, trim, list: r.listDeg, water, r, note: G.moment(sim, NOTE).gov });
    }
  };
  if (withGirder) look();
  while (!sim.foundered && sim.t < 5 * 3600) {
    C.step(sim);
    if (withGirder) look();
    state();
    if (sim.t >= next - 1e-9) { sample(); next += 60; }
  }
  const g = { params: sim.params, openings: sim.openings.map(o => ({ x: o.x, y: o.y, z: o.z, area: o.area, kind: o.kind })),
    dt: sim.params.dt, columns: ship.cols.N, entries: ship.entCol.length, connections: sim.conn.n,
    ms: sim.ms, KG: sim.KG, foundered: sim.foundered, founderT: sim.founderT, events: sim.events, trace: rec };
  return { sim, json: JSON.stringify(g), digest: h.digest('hex'), table, each, cost: { mean: tCost / Math.max(1, nCost), n: nCost } };
}
const t0 = Date.now();
const bare = run1912(false), seen = run1912(true);
const runSecs = (Date.now() - t0) / 1000;
{
  const tracked = fs.existsSync(golden) ? fs.readFileSync(golden, 'utf8') : null;
  row('MUST', 'pure: the 1912 damage preset to its end with moment(sim) after every step gives the golden trace, byte for byte', (seen.json === tracked ? 'identical to' : 'DIFFERS from') + ' out/golden_titanic.json (' + seen.json.length + ' bytes; founders ' + f(seen.sim.founderT / 60, 2) + ' min)',
    'the tracked golden trace (tools/golden.js); the run without the gauge: ' + (bare.json === tracked ? 'identical too' : 'DIFFERS: the tracked file is not this code\'s'), tracked !== null && seen.json === tracked && bare.json === tracked);
  row('MUST', '  ... and every step\'s whole state (water, levels, centroids, pose, velocities, events) is the same bits with it and without', seen.digest.slice(0, 16) + ' over ' + seen.each.length + ' steps', bare.digest.slice(0, 16) + ' without the gauge', seen.digest === bare.digest);
  // what it costs, in this process's own CPU time (a wall clock on a shared machine measures the other work as well)
  const cpu = (sim) => { G.moment(sim); const a = process.cpuUsage(); for (let i = 0; i < 200; i++) G.moment(sim); const d = process.cpuUsage(a); return (d.user + d.system) / 1000 / 200; };
  const cIntact = cpu(blank), cFull = cpu(seen.sim);
  row('CHECK', 'what the gauge costs headless: moment() in CPU time a call', 'intact ' + f(cIntact, 3) + ' ms; ' + f(waterT(seen.sim), 0) + ' t aboard ' + f(cFull, 3) + ' ms (wall clock over the run, machine shared: mean ' + f(seen.cost.mean, 2) + ' ms)', 'well under a frame (16.7 ms): under 2 ms; the page reads it four times a second', cIntact < 2 && cFull < 2);
}

// the finding
const E = seen.each, T = seen.table;
const first = (key, v) => { for (const e of E) if (e[key] !== undefined && e[key] >= v) return e; return null; };
const atTrim = (a) => { for (const e of E) if (e.trim >= a) return e; return null; };
const at = (e) => e ? 'T ' + f(e.T, 2) + ' min (' + clock(e.T) + '), trim ' + f(e.trim, 1) + ' deg' : 'never';
const fin = {};
{
  say('THE FINDING: the 1912 damage preset (core/scenarios.js "titanic"), the moment at the governing station (the largest in the');
  say('break band, bulkhead K to J); every five minutes, and every half degree of trim once she passes 5 degrees.');
  say('  M rel: relieved by her inertia (the left-over force and moment spread over her mass, so that both ends close): the gauge.');
  say('  M stern: from the stern (the note\'s definition). M bow: from the bow. They agree at rest; past 10 deg she is accelerating');
  say('  into the plunge and they part ("clos": the moment left at the bow, from the stern, as a share of its peak).');
  say('  The default curve (a = ' + G.PROHASKA_A + ', fitted to the panel\'s C-7) and the note\'s (a = ' + G.PROHASKA_A_NOTE + '). Range: where M rel stands');
  say('  against the studies\' 4.0 to 5.4 GN m. M vert: about her own deck axis (cos list; the list is a known gap, the gauge does not use it).');
  say('     T  clock         trim   list   water t   station  M rel  M stern  M bow  M vert  range    | note: M rel  M stern | hull max (x)   clos');
  for (const e of T) {
    const r = e.r, g = r.gov;
    say('  ' + f(e.T, 2).padStart(6) + '  ' + clock(e.T).padEnd(11) + f(e.trim, 2).padStart(6) + f(e.list, 1).padStart(7) + f(e.water, 0).padStart(10) + f(g.x, 2).padStart(9) + gn(g.M).padStart(7) + gn(g.Mstern).padStart(9) + gn(g.Mfwd).padStart(7) + gn(g.Mvert).padStart(8) + ('  ' + g.zone).padEnd(9) + '|' + gn(e.note.M).padStart(12) + gn(e.note.Mstern).padStart(9) + ' |' + (gn(r.peak.M) + ' (' + f(r.peak.x, 1) + ')').padStart(15) + (f(100 * r.closure.Mshare, 1) + ' %').padStart(8));
  }
  // the first maximum from the stern: the moment falls half a per cent below the most it has reached (her heave and pitch
  // make it wobble from step to step by less than that)
  const firstMax = (key) => { let pk = null; for (const e of E) { if (e[key] === undefined) continue; if (pk && e.trim > 5 && e[key] < 0.995 * pk[key]) return pk; if (!pk || e[key] > pk[key]) pk = e; } return pk; };
  const maxOf = (key) => { let pk = null; for (const e of E) if (e[key] !== undefined && (!pk || e[key] > pk[key])) pk = e; return pk; };
  Object.assign(fin, { in40: first('M', 4.0 * GN), c46: first('M', 4.6 * GN), c54: first('M', 5.4 * GN), s40: first('Mstern', 4.0 * GN), s54: first('Mstern', 5.4 * GN),
    n40: first('note', 4.0 * GN), n54: first('note', 5.4 * GN), ns54: first('noteStern', 5.4 * GN), j40: first('joint', 4.0 * GN), j54: first('joint', 5.4 * GN),
    pk: maxOf('M'), spk1: firstMax('Mstern'), spk: maxOf('Mstern'), npk: maxOf('note'), at: {} });
  for (const a of [10, 11, 13, 17, 20, 22]) fin.at[a] = atTrim(a);
  const w35 = E.find(e => e.water >= 35000);
  fin.w35 = w35;
  const moved = E.find(e => e.x !== E[0].x);
  say();
  say('  the governing station: x ' + f(E[0].x, 2) + ' m (' + G.where(E[0].x) + ', the forward end of the band: the moment grows toward amidships) from the start' + (moved ? ' until T ' + f(moved.T, 2) + ' min, trim ' + f(moved.trim, 1) + ' deg, when it moves aft' : ' to the end'));
  say('  the default (the gauge: a = ' + G.PROHASKA_A + ', relieved, no knock-down):');
  say('    enters the studies\' range (4.0 GN m) at ' + at(fin.in40) + '; passes 4.6 at ' + at(fin.c46) + '; passes its top, 5.4, ' + (fin.c54 ? 'at ' + at(fin.c54) : 'never'));
  say('    at the trims: ' + [10, 11, 13, 17, 20, 22].map(a => a + ' deg ' + (fin.at[a] ? gn(fin.at[a].M) + ' (T ' + f(fin.at[a].T, 2) + ')' : 'n/a')).join(';  '));
  say('    its largest ' + gn(fin.pk.M) + ' GN m at ' + at(fin.pk) + '; at the founder ' + gn(E[E.length - 1].M));
  say('  the same curve from the stern (the note\'s reading): enters the range at ' + at(fin.s40) + '; 5.4 ' + (fin.s54 ? 'at ' + at(fin.s54) : 'never') + '; first stops rising at ' + gn(fin.spk1.Mstern) + ' GN m, ' + at(fin.spk1) + '; highest ' + gn(fin.spk.Mstern) + ' at ' + at(fin.spk));
  say('  the note\'s curve (a = ' + G.PROHASKA_A_NOTE + '), relieved: enters the range at ' + at(fin.n40) + '; passes 5.4 at ' + at(fin.n54) + ' (from the stern: ' + at(fin.ns54) + '); largest ' + gn(fin.npk.note) + ' GN m at ' + at(fin.npk) +
    '; at 11 and 17 deg ' + gn(fin.at[11].note) + ' and ' + gn(fin.at[17].note));
  say('  with the joint\'s knock-down (an option, off): the governing station x ' + f(fin.at[11].jointX, 2) + '; at 11 and 17 deg ' + gn(fin.at[11].joint) + ' and ' + gn(fin.at[17].joint) + ' GN m; the range entered at ' + at(fin.j40) + '; 5.4 ' + (fin.j54 ? 'at ' + at(fin.j54) : 'never'));
  say('  at 35,000 t aboard (the panel\'s stress model): ' + at(w35) + '; the hull\'s largest moment ' + gn(w35.peak.M) + ' GN m at x ' + f(w35.peak.x, 1) + ' (' + G.where(w35.peak.x) + ')');
  say();
  const a11 = fin.at[11], a17 = fin.at[17];
  row('MUST', 'the library\'s statement of where the record\'s break falls on its curve (RECORD, quoted by the page) is this run\'s', 'at 11 deg ' + gn(a11.M) + ', at 17 deg ' + gn(a17.M) + ' GN m', 'RECORD: ' + G.RECORD.M.map(gn).join(' and ') + ', to 0.01 GN m', Math.abs(a11.M - G.RECORD.M[0]) <= 0.01 * GN && Math.abs(a17.M - G.RECORD.M[1]) <= 0.01 * GN);
  row('CHECK', 'THE FINDING: the gauge at the record\'s attitude, 11 to 17 degrees of trim', gn(a11.M) + ' to ' + gn(a17.M) + ' GN m (T ' + f(a11.T, 2) + ' to ' + f(a17.T, 2) + ', ' + clock(a11.T) + ' to ' + clock(a17.T) + '); at 13 deg ' + gn(fin.at[13].M),
    'inside the studies\' range, 4.0 to 5.4 GN m (9b): where she broke, the moment the model gives is one her hull could have failed at. Above it since the landing (D92): a refitted to C-7 at 0.660 on the model with her ends restored and C5, which had held 0.40 down; on 0.40 the landed model reads 4.860 to 4.995 (e113)', a11.M >= RANGE[0] && a17.M <= RANGE[1] && a11.M <= RANGE[1]);
  row('CHECK', '  ... enters the range (4.0 GN m), and passes its top (5.4)', 'enters ' + at(fin.in40) + '; the top ' + (fin.c54 ? at(fin.c54) : 'never (largest ' + gn(fin.pk.M) + ' at ' + f(fin.pk.trim, 1) + ' deg)'),
    'the record\'s break at T 155 to 159.7 min (the witnesses: the mainline\'s ruling of 2026-11-24), 11 to 17 deg (9d): the range entered before it, its top not passed before it', !!fin.in40 && fin.in40.trim < 11 && (!fin.c54 || fin.c54.trim >= 11));
  row('CHECK', '  ... passes the range\'s central 4.6 GN m', at(fin.c46) + ' (from the stern: ' + at(first('Mstern', 4.6 * GN)) + ')', 'the record\'s 11 to 17 deg; the note\'s rule: before 10 deg blames the weight curve or the flooding', !!fin.c46 && fin.c46.trim >= 10 && fin.c46.trim <= 17);
  row('CHECK', '  ... and peaks', 'relieved ' + f(fin.pk.trim, 1) + ' deg (' + gn(fin.pk.M) + ' GN m); from the stern it first stops rising at ' + f(fin.spk1.trim, 1) + ' deg (' + gn(fin.spk1.Mstern) + '), highest at ' + f(fin.spk.trim, 1) + ' deg',
    'Halpern: 11 to 13 deg (and nearly equal at 10 and 20); Stettler and Thomas: 23 deg', (fin.spk1.trim >= 11 && fin.spk1.trim <= 13.5) || (fin.pk.trim >= 21 && fin.pk.trim <= 25));
  row('CHECK', '  ... the panel\'s condition C-7: about 35,000 t forward, its largest moment 4.64 GN m, inside boiler room 2', gn(w35.peak.M) + ' GN m at x ' + f(w35.peak.x, 1) + ' (' + G.where(w35.peak.x) + ') at ' + f(w35.water, 0) + ' t, ' + f(w35.trim, 1) + ' deg',
    '4.64 GN m in boiler room 2 [search summary; derived]: the default curve\'s fit (a = ' + G.PROHASKA_A + ' was fitted to it at the landing, D92; e113), so within 2 %', Math.abs(w35.peak.M / 4.64e9 - 1) <= 0.02 && /boiler room 2/.test(G.where(w35.peak.x)));
  row('CHECK', '  ... where the range is entered the moment is quasi-static: the dynamic term there', f(100 * fin.in40.clos, 2) + ' % of the peak', 'a few per cent (the note, 9a)', fin.in40.clos < 0.03);
}

// ---------------------------------------------------------------- 4. the same answers on the weight curve's bets
{
  const VARS = [
    ['the default (a = ' + G.PROHASKA_A + ', fitted to C-7)', {}],
    ['the note\'s curve (a = 0.566)', G.VARIANTS.note],              // S[1]: the CHECK below reads it as the note's
    ['a = 0.40, the fit before the landing', { a: 0.40 }],
    ['Prohaska\'s a = 0.75 (heavier ends)', { a: 0.75 }],
    ['the remainder over the whole hull', { remainder: [-130, 125] }],
    ['the remainder amidships, x -40 to +40', { remainder: [-40, 40] }],
    ['the coal as the plant shares it', { coal: 'plant' }],
    ['cargo 559 t', { cargo: 559 }],
    ['cargo 1,400 t', { cargo: 1400 }],
    ['lightship 37,500 LT', { lightship: 37500 * LT }],
    ['lightship 40,000 LT', { lightship: 40000 * LT }],
    ['every layer at the model\'s KG', { zAll: true }],
    ['HANDOFF 4d: shaped like her buoyancy', { shape: 'buoyancy' }],
  ];
  const S = VARS.map(([name, v]) => ({ name, v, intact: G.moment(blank, { variant: v }), c: {}, at: {}, pk: null, w35: null }));
  const sim = C.createSim(ship, {}, SC.PRESETS.titanic.build());
  let next = 0, last = -1;
  while (!sim.foundered) {
    C.step(sim);
    const trim = sim.pitch * DEG;
    if (!(sim.t >= next || trim >= last + 0.1)) continue;
    if (sim.t >= next) next += 60;
    if (trim >= last + 0.1) last = trim;
    const water = waterT(sim);
    for (const s of S) {
      const r = G.moment(sim, { variant: s.v }), g = r.gov, e = { T: sim.t / 60, trim, M: g.M };
      for (const v of [4.0, 4.6, 5.4]) if (!s.c[v] && g.M >= v * GN) s.c[v] = e;
      for (const a of [11, 17]) if (!s.at[a] && trim >= a) s.at[a] = e;
      if (!s.pk || g.M > s.pk.M) s.pk = e;
      if (!s.w35 && water >= 35000) s.w35 = r.peak.M;
    }
  }
  say('THE SAME ANSWERS ON THE WEIGHT CURVE\'S BETS (each curve closed to the same mass and centre; the gauge\'s reading: relieved, no knock-down)');
  say('  curve                                     intact -23 m   enters (4.0)       4.6        5.4     at 11 deg  at 17 deg        largest            at 35,000 t');
  for (const s of S) {
    const a = (e) => e ? f(e.trim, 1) + ' deg' : 'never';
    say('  ' + s.name.padEnd(40) + (gn(s.intact.at(G.X_BREAK).Mstern) + ' GN m').padStart(14) + a(s.c[4.0]).padStart(14) + a(s.c[4.6]).padStart(11) + a(s.c[5.4]).padStart(11) + (s.at[11] ? gn(s.at[11].M) : 'n/a').padStart(11) + (s.at[17] ? gn(s.at[17].M) : 'n/a').padStart(11) + (gn(s.pk.M) + ' at ' + f(s.pk.trim, 1) + ' deg').padStart(23) + (gn(s.w35) + ' GN m').padStart(13));
  }
  say();
  const d = S[0], nt = S[1], b = S[S.length - 1];
  row('CHECK', 'the weight curve\'s ends: the default, fitted, against the note\'s 0.566', 'default: C-7 ' + gn(d.w35) + ', 11 to 17 deg ' + gn(d.at[11].M) + ' to ' + gn(d.at[17].M) + ', 5.4 ' + (d.c[5.4] ? 'at ' + f(d.c[5.4].trim, 1) + ' deg' : 'never') + '; the note\'s: C-7 ' + gn(nt.w35) + ', 11 to 17 deg ' + gn(nt.at[11].M) + ' to ' + gn(nt.at[17].M) + ', 5.4 at ' + (nt.c[5.4] ? f(nt.c[5.4].trim, 1) + ' deg' : 'never'),
    'C-7: 4.64 GN m at 35,000 t [search summary; derived]: the default within 2 %, the note\'s not', Math.abs(d.w35 / 4.64e9 - 1) <= 0.02 && Math.abs(nt.w35 / 4.64e9 - 1) > 0.02);
  row('CHECK', 'HANDOFF 4d\'s buoyancy-shaped curve (fewer bets): the cross-check the note says understates the hog', 'intact ' + gn(b.intact.at(-23).Mstern) + ' GN m at -23 m; the range ' + (b.c[4.0] ? 'entered at ' + f(b.c[4.0].trim, 1) + ' deg' : 'never entered') + '; largest ' + gn(b.pk.M) + ' GN m', 'lower than the default curve all through (the light, fine ends ignored)', b.intact.at(-23).Mstern < d.intact.at(-23).Mstern && b.pk.M < d.pk.M);
}

// ---------------------------------------------------------------- 5. the cases that float stay under the range's lower bound
{
  const P = SC.PRESETS, nb = SC.PRESETS.britannic.build(); nb.openings = nb.openings.filter(o => o.kind !== 'porthole');
  const cases = [['Four forward compartments (Wilding: floats)', P.four.build()], ['Olympic and HMS Hawke, 1911', P.hawke.build()], ['Britannic, ports shut (floats at 8.8 deg)', nb]];
  for (const [label, scen] of cases) {
    const sim = C.createSim(ship, {}, scen);
    let worst = null, k = 0;
    const look = () => { const r = G.moment(sim); let i = 0; for (let j = 1; j < r.band.x.length; j++) if (Math.abs(r.band.M[j]) > Math.abs(r.band.M[i])) i = j; const m = r.band.M[i]; if (!worst || Math.abs(m) > Math.abs(worst.M)) worst = { M: m, x: r.band.x[i], T: sim.t / 60, trim: r.trimDeg, zone: G.zone(m), ratio: Math.abs(m) / (m < 0 ? G.CAP.sag : G.CAP.low) }; };
    look();
    C.run(sim, { tMax: 8 * 3600, every: 600, stopWhenStable: true, onTick: () => { if (++k % 4 === 0) look(); } });
    look();
    row('CHECK', 'a case that floats: ' + label, (sim.foundered ? 'FOUNDERED; ' : 'afloat at ' + f(sim.t / 60, 0) + ' min; ') + 'the band\'s largest moment ' + gn(worst.M) + ' GN m (' + (worst.M < 0 ? 'sagging' : 'hogging') + ', ' + worst.zone + ' the range) at x ' + f(worst.x, 1) + ', ' + f(worst.T, 0) + ' min, trim ' + f(worst.trim, 1) + ' deg',
      'under the studies\' range, 4.0 GN m (5.6 sagging), to the end', !sim.foundered && worst.ratio < 1);
  }
}

// ---------------------------------------------------------------- 6. the 1912 watch on its reconstructed orders (core/night.js)
// Run to her founder: the flag hand-over, the named what-if since G12's switch (D98), today's watch before it to the bit.
// The gauge's finding on the watch reads her trim past the break's onset, to the record's 11 and 17 degrees; the default
// watch hands her to the fall at the onset (about 7 degrees on member C) and never gets there.
{
  const go = (withGirder) => {
    const sim = N.create(ship, N.spec(1912), { auto: true, handover: 'flag' }), tab = [], each = [];
    let nextT = 0, half = 4.5;
    while (!N.over(sim) && sim.t < 4 * 3600) {
      N.step(sim);
      if (!withGirder) continue;
      const r = G.moment(sim), w = sim.night;
      if (w.tTouch < 0) { if (sim.night.k % 40 === 0) each.push({ pre: true, M: r.gov.M, clos: r.closure.Mshare }); continue; }
      const T = (sim.t - w.tTouch) / 60, trim = r.trimDeg;
      each.push({ T, trim, M: r.gov.M, Mstern: r.gov.Mstern, clos: r.closure.Mshare, x: r.gov.x });
      const step = half < 25 ? 0.5 : 5;
      if (T >= nextT - 1e-9 || trim >= half + step) { if (T >= nextT - 1e-9) nextT += 5; if (trim >= half + step) half = Math.floor(trim / step) * step; tab.push({ T, trim, list: r.listDeg, water: waterT(sim), kn: Math.hypot(sim.mo.u, sim.mo.v) / 0.514444, r }); }
    }
    return { sim, tab, each, fp: N.fingerprint(sim), k: sim.night.k };
  };
  const plain = go(false), watch = go(true);
  row('MUST', 'the 1912 watch (to the flag, D98\'s what-if) with moment(sim) after every step: the model\'s own watch, to the bit', 'fingerprint ' + watch.fp + ' at step ' + watch.k, plain.fp + ' at step ' + plain.k + ' without the gauge', watch.fp === plain.fp && watch.k === plain.k);
  say('THE 1912 WATCH on its reconstructed orders (core/night.js), to the flag (handover \'flag\', D98\'s what-if; the default watch hands her over at the onset): T from the touch; under way at first, so the moment sees her speed');
  say('     T  clock          kn   trim   list   water t   station  M rel  M stern  range     clos');
  for (const e of watch.tab) { const g = e.r.gov; say('  ' + f(e.T, 2).padStart(6) + '  ' + clock(e.T).padEnd(11) + f(e.kn, 1).padStart(5) + f(e.trim, 2).padStart(7) + f(e.list, 1).padStart(7) + f(e.water, 0).padStart(10) + f(g.x, 2).padStart(9) + gn(g.M).padStart(7) + gn(g.Mstern).padStart(9) + ('  ' + g.zone).padEnd(9) + (f(100 * e.r.closure.Mshare, 1) + ' %').padStart(8)); }
  const E2 = watch.each.filter(e => !e.pre), pre = watch.each.filter(e => e.pre);
  const w40 = E2.find(e => e.M >= 4.0 * GN), w54 = E2.find(e => e.M >= 5.4 * GN), w11 = E2.find(e => e.trim >= 11), w17 = E2.find(e => e.trim >= 17);
  let pk = E2[0]; for (const e of E2) if (e.M > pk.M) pk = e;
  let preClos = 0, preM = 0; for (const e of pre) { preClos = Math.max(preClos, e.clos); preM = Math.max(preM, e.M); }
  say('  under way before the touch (22.5 knots): the moment ' + gn(preM) + ' GN m at most; left over at the bow at most ' + f(100 * preClos, 1) + ' % (her motion\'s own loads, sim.xFz and sim.xMth, are not spread along her)');
  say('  enters the range at ' + (w40 ? 'T ' + f(w40.T, 2) + ' min, trim ' + f(w40.trim, 1) + ' deg' : 'never') + '; at 11 and 17 deg ' + gn(w11.M) + ' and ' + gn(w17.M) + ' GN m; 5.4 ' + (w54 ? 'at T ' + f(w54.T, 2) : 'never') + '; largest ' + gn(pk.M) + ' GN m at trim ' + f(pk.trim, 1) + ' deg; founders T ' + f((watch.sim.founderT - watch.sim.night.tTouch) / 60, 2));
  say();
  row('CHECK', 'the 1912 watch: the gauge on a ship that was under way, against the preset', 'enters the range at ' + (w40 ? 'T ' + f(w40.T, 2) + ', ' + f(w40.trim, 1) + ' deg' : 'never') + '; 11 to 17 deg ' + gn(w11.M) + ' to ' + gn(w17.M) + '; under way before the touch ' + gn(preM) + ' GN m, ' + f(100 * preClos, 1) + ' % left over',
    'the preset: ' + at(fin.in40) + ', ' + gn(fin.at[11].M) + ' to ' + gn(fin.at[17].M) + '; the same night within a degree', !!w40 && Math.abs(w40.trim - fin.in40.trim) < 1);
}

// ---------------------------------------------------------------- 7. C5 (the calibration epoch, dark): the gauge weighs as the core
// With params.weighOverfill 0 the core's loads weigh a full space or pocket at its capacity (C.weighedWater: each
// space min(vol, nodeVmax), each pocket min(vol, cap)); the excess is the sea's head on a stiff virtual area. The gauge
// must weigh the same water, or it drifts from the core before the epoch's landing (D4). The 1912 damage preset with the
// switch at 0, every minute and every step past 8 degrees of trim: the gauge's water (its slices' sum, from its loads)
// against C.weighedWater at that moment. With 1, the default, the gauge is as before to the bit (sections 3 to 6 run it).
{
  const sim = C.createSim(ship, {}, SC.PRESETS.titanic.build());
  sim.params.weighOverfill = 0;
  const Dd = G.shipData(ship);
  let worst = 0, worstAt = null, over = 0, overAt = null, nRead = 0, next = 0;
  const at0 = {};
  while (!sim.foundered && sim.t < 5 * 3600) {
    C.step(sim);
    const trimNow = sim.pitch * 180 / Math.PI;
    if (!(sim.t >= next || trimNow > 8)) continue;
    if (sim.t >= next) next += 60;
    const r = G.moment(sim, { loads: true }), Lw = r.loads;
    let gw = 0; for (let j = 0; j < Dd.nS; j++) gw += Lw.f[j] * Dd.dx[j] * 1000 / C.RHO;
    const cw = C.weighedWater(sim), d = Math.abs(gw - cw) / Math.max(1, cw);
    nRead++;
    if (d > worst || !worstAt) { worst = d; worstAt = { T: sim.t / 60, gw, cw }; }
    let all = 0; C.eachWater(sim, (V) => { all += V; });
    if (all - cw > over) { over = all - cw; overAt = { T: sim.t / 60, all, cw }; }
    for (const a of [11, 17]) if (!at0[a] && r.trimDeg >= a) at0[a] = { T: sim.t / 60, M: r.gov.M };
  }
  say('C5 (the calibration epoch, dark): the 1912 damage preset with params.weighOverfill 0, the gauge weighing as the core\'s loads');
  say('  read ' + nRead + ' times; the gauge\'s water against C.weighedWater: worst ' + worst.toExponential(2) + ' of it (T ' + f(worstAt.T, 2) + ', ' + f(worstAt.gw, 3) + ' against ' + f(worstAt.cw, 3) + ' m3)');
  say('  the over-fill the switch leaves out of the weight (her water less the weighed): at most ' + f(over, 0) + ' m3' + (overAt ? ' (T ' + f(overAt.T, 2) + ', of ' + f(overAt.all, 0) + ' m3 aboard)' : '') + '; founders T ' + f(sim.founderT / 60, 2));
  say('  the gauge at the record\'s 11 and 17 degrees with the switch at 0 (along its own path): ' + [11, 17].map(a => at0[a] ? gn(at0[a].M) + ' GN m (T ' + f(at0[a].T, 2) + ')' : 'not reached').join(' and ') + '; RECORD, the switch at 1: ' + G.RECORD.M.map(gn).join(' and '));
  say();
  row('MUST', 'C5 (on since D4): with params.weighOverfill 0 the gauge weighs her water as the core\'s loads do: its slices\' sum is C.weighedWater, every minute and every step past 8 deg', 'worst ' + worst.toExponential(2) + ' of it over ' + nRead + ' readings', 'under 1e-9 of it (the same sum in another order)', worst < 1e-9 && nRead > 100);
}

// ---------------------------------------------------------------- 8. her hull's ends behind their switch (C3, G14; D80 d)
// C.buildShip({ hullEnds: 1 }) restores her ends above the waterline from the deck plans (above 11.0 m, over every
// preset's first sea). The gauge reads the ship's columns, so it follows with no change here. Its weight curve reads no
// breadth, only sim.ms, sim.g0 and C.zoneBounds(), which the switch leaves alone, so the curve is the same to the bit;
// at rest the restored ends are dry and above the sea, so the gauge reads the same bits. And the ship with the switch
// off keeps the gauge's run it had when the switch came in, on the numbers of that time (core/scenarios.js's PRE_D4, every
// default the landing moved as it stood before; tools/pocket_tests.js keeps join 6's the same way): the epoch's landing
// (D4) turns the switch on and refits the numbers, and this row still says the off ship is the one before. A default a
// later landing moves goes into SC.PRE_D4 by its own rule, and this row reads it there.
{
  const shipOff = C.buildShip({ hullEnds: 0 }), shipOn = C.buildShip({ hullEnds: 1 });
  const pre = () => SC.PRESETS.titanic.build();
  const cvOff = G.weight(C.createSim(shipOff, {}, pre())), cvOn = G.weight(C.createSim(shipOn, {}, pre()));
  const pcs = (cv) => JSON.stringify({ p: cv.pieces, t: cv.total, l: cv.lcg, v: cv.vcg, h: cv.hull });
  row('MUST', 'C3 (on since D4): with hullEnds 1 the weight curve is the same to the bit (its pieces, total, centre and the hull\'s trapezoid): it reads no breadth, and sim.ms, sim.g0 and the profile\'s ends stand',
    (pcs(cvOn) === pcs(cvOff) ? 'the same' : 'DIFFERENT') + ': ' + cvOn.pieces.length + ' pieces, ' + f(cvOn.total, 3) + ' t', 'the same as hullEnds 0', pcs(cvOn) === pcs(cvOff));
  const restOff = G.moment(C.createSim(shipOff, {}, SC.PRESETS.blank.build())), restOn = G.moment(C.createSim(shipOn, {}, SC.PRESETS.blank.build()));
  const bits = (r) => Buffer.concat([r.hull.M, r.hull.V, r.band.M, r.band.V].map(a => Buffer.from(a.buffer, a.byteOffset, a.byteLength))).toString('hex');
  row('MUST', '  ... and at rest the gauge reads the same bits along her whole length (the restored ends dry and above the sea)', bits(restOn) === bits(restOff) ? 'the same' : 'DIFFERENT', 'the same as hullEnds 0', bits(restOn) === bits(restOff));
  // the off ship's 1912 damage on the numbers before the landing, the gauge after every step: its readings and the core's
  // state digested (frozen at the switch's commit, f677ae7, node v26.13.0 on this machine, as 37987 steps,
  // 56042fc34cfeb7a3, founders 158.28 min; refrozen with the model's pow, B1/e107: a change of arithmetic, not of
  // physics, since f677ae7's code run with C.pow preloaded over its Math.pow, node -r tools/pow_preload.js, gives these)
  // The numbers before the landing are SC.PRE_D4's: the calibration of join 7 (D73) and the epoch's switches dark (C5
  // weighs the whole vol, C4 keeps every door and gives her no side openings), the params' other defaults as they
  // stood, the ship with hullEnds 0, the build's opening 0.8196 m2 with no bunker opening of its own, and the
  // scenario's coal list 2.0. The gauge reads its own weight curve as it stood too, Prohaska's a = 0.40 (PRE_GAUGE),
  // so that D(G14-c)'s refit of a, when it lands, leaves this row standing; with a at 0.40 it is the default curve to
  // the bit. And D89's trace zeroed, as then (keepTrace 0).
  const P = SC.PRE_D4, PRE_GAUGE = { variant: { a: 0.40 } };
  const REF_OFF = { steps: 37992, sha: 'f0dac8035bd69fe1' };          // founders 158.30 min, the golden trace's before D4
  const sim = C.createSim(C.buildShip(P.ship), Object.assign({}, P.params, { keepTrace: 0 }), Object.assign(SC.PRESETS.titanic.build(P.build), P.scen));
  const h = crypto.createHash('sha256'); let steps = 0;
  while (!sim.foundered && sim.t < 5 * 3600) {
    C.step(sim); steps++;
    const r = G.moment(sim, PRE_GAUGE);
    for (const a of [sim.vol, sim.level]) h.update(Buffer.from(a.buffer, a.byteOffset, a.byteLength));
    h.update(Buffer.from(new Float64Array([sim.t, sim.zO, sim.pitch, sim.roll, r.gov.M, r.gov.Mstern, r.gov.x, r.peak.M, r.closure.Mshare]).buffer));
  }
  const sha = h.digest('hex').slice(0, 16);
  row('MUST', '  ... and the ship with hullEnds 0 keeps the gauge\'s run it had when the switch came in: the 1912 damage on the numbers before the landing (SC.PRE_D4), the gauge after every step, digested',
    steps + ' steps, ' + sha + '; founders ' + f(sim.founderT / 60, 2) + ' min', REF_OFF.steps + ' steps, ' + REF_OFF.sha + ' (frozen at f677ae7, refrozen with the model\'s pow, B1/e107)', steps === REF_OFF.steps && sha === REF_OFF.sha);
}

for (const l of out) console.log(l);
for (const [kind, what, value, ref, ok] of rows) console.log((kind === 'MUST' ? (ok ? 'PASS ' : 'FAIL ') : (ok ? 'in   ' : 'OUT  ')) + what.padEnd(112) + ' ' + String(value).padEnd(80) + ' ' + ref);
console.log('(the two 1912 runs took ' + f(runSecs, 0) + ' s)');
console.log(fails ? '\nFAIL: ' + fails + ' MUST row(s)' : '\nPASS: every MUST row (' + rows.filter(r => r[0] === 'MUST').length + '); CHECK rows in range: ' + rows.filter(r => r[0] === 'CHECK' && r[4]).length + ' of ' + rows.filter(r => r[0] === 'CHECK').length);
process.exit(fails ? 1 : 0);
