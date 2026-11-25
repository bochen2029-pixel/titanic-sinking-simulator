// P4 acceptance: the seeded night and the watch (core/night.js).
//   node tools/night_tests.js          (about a minute)
// MUST rows: a seeded night replays exactly, the watch's clock and orders, and the miss window through the order
// functions the Bridge panel uses. CHECK rows: figures that were not fitted, reported with their reference.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const C = require('../core/core.js');
const Mo = require('../core/motion.js');
const E = require('../core/encounter.js');
const N = require('../core/night.js');
const R = require('./encounter_run.js');
const ship = C.buildShip();
const rows = []; let fails = 0;
function row(kind, what, value, ref, ok) { rows.push([kind, what, value, ref, ok]); if (kind === 'MUST' && !ok) fails++; }
const f = (x, n) => (x === null || x === undefined ? 'n/a' : x.toFixed(n === undefined ? 1 : n));
const U = Mo.create({ knots: 22.5 }).u;

function state(sim) {
  const m = sim.mo, e = sim.enc; let d = 0;
  for (const D of [e.stbd, e.port]) for (const b of D) for (let i = 0; i < b.dent.length; i++) d += b.dent[i];
  let w = 0; for (let n = 0; n < C.NN; n++) w += sim.vol[n];
  return [m.u, m.v, m.r, m.X, m.Y, m.psi, m.del, m.nP, m.nS, m.nC, sim.zO, sim.pitch, sim.roll, e.berg.X, e.berg.Y, e.bow, d, w];
}
function digestOf(sim, steps, each) {             // step `steps` times, hashing the state after every step
  const h = crypto.createHash('sha256');
  for (let i = 0; i < steps; i++) { if (each) each(sim); N.step(sim); h.update(Buffer.from(new Float64Array(state(sim)).buffer)); }
  return h.digest('hex');
}

// 1. the generator
{
  const a = JSON.stringify(N.spec(48213)), b = JSON.stringify(N.spec(48213));
  let distinct = new Set(), inRange = true;
  for (let s = 1; s <= 1000; s++) {
    const sp = N.spec(s === 1912 ? 2912 : s); distinct.add(JSON.stringify([sp.ice.R, sp.off, sp.sighting, sp.lead]));
    if (!(sp.ice.R >= 25 && sp.ice.R <= 60 && sp.sighting >= 251 && sp.sighting <= 595 && sp.lead >= 12 && sp.lead <= 40 && Math.abs(sp.off) <= sp.ice.R + 34 && sp.ice.depths[2] <= 8.5 && sp.lead * 4 === Math.round(sp.lead * 4))) inRange = false;
  }
  row('MUST', 'a seed gives one night: the same spec twice, 1,000 seeds all different and inside the stated spreads', (a === b ? 'same' : 'DIFFERENT') + ', ' + distinct.size + ' distinct', 'same, 1000 distinct, in range', a === b && distinct.size === 1000 && inRange);
  // G1: the levels. Any night ('hard') is the default draw; each level inside its spreads; a seed keeps its berg, clock, quiet
  let same = true, spreads = true, keeps = true;
  for (let s = 1; s <= 1000; s++) {
    if (s === 1912) continue;
    const base = N.spec(s);
    if (JSON.stringify(base) !== JSON.stringify(N.spec(s, { level: 'hard' }))) same = false;
    for (const lv of Object.keys(N.LEVELS)) {
      const sp = N.spec(s, { level: lv }), L = N.LEVELS[lv];
      if (!(sp.level === lv && sp.sighting >= Math.round(457.2 * L.sight[0]) && sp.sighting <= Math.round(457.2 * (L.sight[0] + L.sight[1])) && Math.abs(sp.off) <= sp.ice.R + L.offPad)) spreads = false;
      if (sp.ice.R !== base.ice.R || sp.ice.depths[0] !== base.ice.depths[0] || sp.lead !== base.lead || sp.clock0 !== base.clock0 || sp.berg.h !== base.berg.h) keeps = false;
    }
  }
  row('MUST', 'the levels (G1): "Any night" is the default draw; each level inside its spreads; a seed keeps its berg and its clock', 'default ' + (same ? '= hard' : 'DIFFERS') + '; spreads ' + (spreads ? 'held' : 'BROKEN') + '; berg and clock ' + (keeps ? 'kept' : 'CHANGED'), Object.keys(N.LEVELS).map(k => k + ' ' + N.LEVELS[k].sight.join('+') + ' x 457 m, off <= R+' + N.LEVELS[k].offPad).join('; '), same && spreads && keeps);
}

// 2. the same night twice
{
  let ok = true; const shown = [];
  for (const seed of [1912, 7, 16]) {
    const sp = N.spec(seed), a = N.create(ship, sp, { auto: true }), b = N.create(ship, sp, { auto: true });
    const da = digestOf(a, 700), db = digestOf(b, 700);
    if (da !== db || N.fingerprint(a) !== N.fingerprint(b)) ok = false;
    shown.push(seed + ':' + N.fingerprint(a));
  }
  row('MUST', 'a seeded night replays exactly: every state of 700 steps, three nights, run twice', shown.join(' '), 'equal SHA-256 of the state after every step', ok);
}

// 2b. readers (core/night.js, "readers"): a module registered with the watch is attached to it, stepped once a step and
// owns its own orders in the log; and the night is the same night, every state of 700 steps, with it and without
{
  const seen = { attached: 0, steps: 0, orders: [] };
  N.reader({
    name: 'test-reader',
    attach(sim) { seen.attached++; sim.testReader = { n: 0 }; },
    step(sim) { seen.steps++; sim.testReader.n++; },
    orders: { 'test:mark': (sim, value, arg) => { seen.orders.push([sim.night.k, value, arg]); return value !== 'refuse'; } },
    valid: (type, value) => type === 'test:mark' && typeof value === 'string',
  });
  const sp = N.spec(1912), a = N.create(ship, sp, { auto: true }), b = N.create(ship, sp, { auto: true, readers: false });
  let done = null;
  const da = digestOf(a, 700, (sim) => { if (sim.night.k === 300) done = N.act(sim, 'test:mark', 'here', 7); }), db = digestOf(b, 700);
  const stepsA = seen.steps, mine = a.night.log.filter(o => o.type === 'test:mark');
  let unknown = false; try { N.act(a, 'test:nobody', 1); } catch (e) { unknown = /unknown order/.test(e.message); }
  let taken = false; try { N.reader({ name: 'another', orders: { helm: () => true } }); } catch (e) { taken = /taken/.test(e.message); }
  const c = N.replay(ship, sp, a.night.log, a.night.k);     // the reader's order replays from the log with the helm's
  const replayed = seen.orders.length === 2 && seen.orders[1][0] === 300 && N.fingerprint(c) === N.fingerprint(a) && c.testReader.n === 700;
  // the same log on a watch without the readers: the reader's order goes in that log and does nothing; the same night
  const d = N.replay(ship, sp, a.night.log, a.night.k, { readers: false });
  const bare = seen.orders.length === 2 && !d.testReader && d.night.log.some(o => o.type === 'test:mark') && N.fingerprint(d) === N.fingerprint(a);
  N.READERS.splice(N.READERS.findIndex(r => r.name === 'test-reader'), 1);   // leave nothing behind for the rows below
  row('MUST', 'a reader is attached, stepped once a step and owns its orders in the log; the night is the same with it and without (700 steps)',
    'attached ' + (a.testReader ? 'yes' : 'NO') + ', ' + stepsA + ' steps, order at step ' + (mine[0] ? mine[0].k : '?') + ' ' + (done ? 'done' : 'REFUSED') + '; without it: ' + (b.testReader ? 'ATTACHED' : 'none') + ', states ' + (da === db ? 'equal' : 'DIFFER') + '; replay ' + (replayed ? 'the same' : 'DIFFERS') + ', and without the readers ' + (bare ? 'the same, its order idle' : 'DIFFERS') + '; nobody\'s order ' + (unknown ? 'unknown' : 'TAKEN') + '; a taken name ' + (taken ? 'refused' : 'ACCEPTED'),
    '700 steps, the order logged at step 300 and replayed; equal SHA-256 of every state; the log replays without the readers too; "helm" cannot be taken',
    !!a.testReader && !b.testReader && stepsA === 700 && mine.length === 1 && mine[0].k === 300 && done === true && unknown && taken && da === db && N.fingerprint(a) === N.fingerprint(b) && replayed && bare);
}

// 3. nothing changes before the ice is near: Night.step is Motion.step
{
  const sp = N.spec(1912), a = N.create(ship, sp, {});
  const b = C.createSim(ship, {}, { openings: [], coalListDeg: C.DEFAULT_PARAMS.coalListDeg }); Mo.attach(b, { knots: sp.speedKn, heading: sp.heading });   // the watch's own coal list (the epoch's landing moved it from 2.0)
  const ha = crypto.createHash('sha256'), hb = crypto.createHash('sha256'), pick = s => Buffer.from(new Float64Array([s.mo.u, s.mo.v, s.mo.r, s.mo.X, s.mo.Y, s.mo.psi, s.roll, s.zO, s.pitch]).buffer);
  for (let i = 0; i < 68; i++) { N.step(a); Mo.step(b); ha.update(pick(a)); hb.update(pick(b)); }
  const da = ha.digest('hex'), db = hb.digest('hex');
  row('MUST', 'before the ice is near, Night.step is exactly Motion.step (17 s of the 1912 watch)', da.slice(0, 12), db.slice(0, 12), da === db);
}

// 4. the 1912 watch: the clock
const h1912 = N.spec(1912), G = N.GEOM_1912;
const auto = N.run(N.create(ship, h1912, { auto: true })), sa = N.summary(auto);
{
  const order = auto.night.log[0];
  row('MUST', 'the 1912 watch: bells, then the helm order 20.5 s later with the ice ' + G.ahead + ' m ahead', 'bells ' + f(sa.tBells, 2) + ' s at ' + f(sa.rangeBells, 1) + ' m; order ' + f(sa.reaction, 2) + ' s later, ' + f(sa.aheadOrder, 6) + ' m',
    'bells at ' + h1912.lead + ' s; "about 500 yards" (457 m, British report), within 45 m; ' + G.ahead + ' m (the 1912 geometry, core/night.js)', sa.tBells === h1912.lead && Math.abs(sa.rangeBells - 457.2) < 45 && sa.reaction === 20.5 && Math.abs(sa.aheadOrder - G.ahead) < 1e-6 && order.type === 'helm' && order.value === -40);
  const clock = h1912.clock0 + sa.tTouch, hh = Math.floor(clock / 3600), mm = Math.floor(clock % 3600 / 60), ss = clock % 60;
  row('MUST', 'the 1912 watch: she touches the ice at 11.40 pm', hh + ':' + String(mm).padStart(2, '0') + ':' + f(ss, 1).padStart(4, '0'), '23:40 (ship\'s time)', Math.abs(clock - (23 * 3600 + 40 * 60)) < 1);
  row('CHECK', 'the 1912 watch: her head had swung at the touch', f(-sa.swingTouch, 1) + ' deg to port', '"about two points" (22.5 deg, Hichens); about one point (11.25 deg, Halpern\'s model)', -sa.swingTouch > 8 && -sa.swingTouch < 25);
}

// 5. the 1912 watch is the P3 encounter
{
  const p3 = E.summary(R.encounter({ ahead: G.ahead, port: G.port, portAround: 0 }, ship)), a3 = p3.stbd.area + p3.port.area;
  row('MUST', 'the 1912 watch on the reconstructed orders is the P3 encounter (course 266 deg, not north)', f(sa.area, 6) + ' m2, starboard x ' + sa.stbd.tearFrom + ' to ' + sa.stbd.tearTo,
    f(a3, 6) + ' m2, x ' + p3.stbd.tearFrom + ' to ' + p3.stbd.tearTo + ' (tools/encounter_tests.js)', Math.abs(sa.area - a3) < 1e-3 && sa.stbd.tearFrom === p3.stbd.tearFrom && Math.abs(sa.stbd.tearTo - p3.stbd.tearTo) <= 1 && sa.port.tears === 0 && sa.bow.crush === 0);
}

// 6, 7. a played watch, replayed from its log; and resumed from its snapshot
{
  const sp = N.spec(1912), a = N.create(ship, sp, {});
  const played = sim => {                         // orders as a player might give them, at odd moments
    const w = sim.night, t = sim.t - w.tBells;
    if (w.tBells < 0) return;
    if (w.k === Math.round((w.tBells + 3.25) * 4) && !w.x1) { w.x1 = 1; N.helm(sim, -25); }
    if (t >= 6 && !w.x2) { w.x2 = 1; N.telegraph(sim, 'half astern'); }
    if (t >= 7.5 && !w.x3) { w.x3 = 1; N.helm(sim, -40); }
    if (t >= 9 && !w.x4) { w.x4 = 1; N.telegraph(sim, 'full astern', 'port'); }
    if (w.tTouch >= 0 && !w.x5) { w.x5 = 1; N.helm(sim, 'reverse'); N.door(sim, 3, true); }
    if (w.tTouch >= 0 && sim.t >= w.tTouch + 20 && !w.x6) { w.x6 = 1; N.telegraph(sim, 'stop'); N.helm(sim, 0); }
  };
  const da = digestOf(a, 900, played), fa = N.fingerprint(a), log = a.night.log;
  const b = N.create(ship, sp, { script: log.map(o => ({ k: o.k, type: o.type, value: o.value, arg: o.arg })) });
  const db = digestOf(b, 900), fb = N.fingerprint(b);
  row('MUST', 'a played watch (' + log.length + ' orders: helm, telegraph, one shaft, a door) replays from its log, bit for bit', fb + ' at step ' + b.night.k, fa + ' at step ' + a.night.k, da === db && fa === fb && JSON.stringify(Array.from(a.enc.stbd[0].dent)) === JSON.stringify(Array.from(b.enc.stbd[0].dent)));
  const snap = JSON.parse(JSON.stringify(N.snapshot(a))), c = N.resume(ship, snap);
  const d1 = digestOf(a, 400), d2 = digestOf(c, 400);
  row('MUST', 'a snapshot (seed, orders, step) resumes the night: 400 more steps equal the uninterrupted run', N.fingerprint(c), N.fingerprint(a), d1 === d2 && N.fingerprint(a) === N.fingerprint(c));
  const sp2 = N.summary(a);
  row('MUST', 'the reaction time runs from the bells to the first order', f(sp2.reaction, 2) + ' s, hindsight ' + sp2.hindsight, '3.25 s, false', sp2.reaction === 3.25 && sp2.hindsight === false);
  const early = N.create(ship, sp, {}); N.helm(early, -40); N.run(early);
  const se = N.summary(early);
  row('MUST', 'an order before the bells is marked as hindsight, not as a reaction', 'reaction ' + f(se.reaction, 2) + ', hindsight ' + se.hindsight + ', ' + se.kind, 'no reaction time, hindsight true', se.reaction === null && se.hindsight === true);
}

// 7b. G27 (docs/DESIGN_G27_the_brush_on_a_watch_v1_2026-11-24.md): a hole made by the player's hand on a watch (the
// page's brush) is an order of the model's own (`hole`), logged, and replayed from the log to the bit; its bounds need
// no state, so a link's address check and the model agree
{
  const sp = N.spec(1912), bx = C.zoneBounds(), xm = (k) => +(0.5 * (bx[k] + bx[k + 1])).toFixed(2);
  const w = N.create(ship, sp, { auto: true });
  let given = false;
  while (!N.over(w) && w.t < 6 * 3600) {
    N.step(w);
    if (!given && w.night.tTouch >= 0 && w.t - w.night.tTouch >= 600) {
      given = true;
      N.hole(w, xm(7), 4.0, -1, 0.0624);                                                        // a punch: boiler room 3, starboard
      for (let i = 0; i < 5; i++) N.hole(w, +(xm(3) - 2.6 * i).toFixed(2), 3.5, 1, 0.0624);   // a short stroke: hold 3, port
    }
  }
  const holes = w.night.log.filter(o => o.type === 'hole'), r = N.replay(ship, sp, w.night.log, w.night.k);
  row('MUST', 'G27: a watch holed by hand at T+10 (a punch and a stroke of five, logged as `hole`, the model\'s own order) replays from its log, bit for bit',
    N.fingerprint(r) + ' at step ' + r.night.k, N.fingerprint(w) + ' at step ' + w.night.k + ' (' + holes.length + ' holes; she breaks at T+' + f((w.t - w.night.tTouch) / 60, 2) + ')',
    holes.length === 6 && N.owns('hole') && N.fingerprint(r) === N.fingerprint(w) && r.night.k === w.night.k);
  const inside = [[[0, 4, 1], 0.0624], [[-20, 2.5, -1], 1], [[bx[0] - 1.5, 6, 1], 0.02], [[bx[16] + 1.5, 9, -1], N.HOLE_MAX]];
  const outside = [[[0, 4, 0], 0.1], [[0, 4, 1], 0], [[0, 4, 1], N.HOLE_MAX + 0.01], [[bx[0] + 1, 4, 1], 0.1], [[0, 0.5, 1], 0.1], [[0, 30, 1], 0.1], [[0, 4], 0.1], [['0', 4, 1], 0.1]];
  const ins = inside.map(([v, a]) => N.validHole(v, a)), outs = outside.map(([v, a]) => N.validHole(v, a));
  row('MUST', '  ... and its bounds need no state: inside her zones 1 m clear of either end, from her floor + 0.25 m to E deck, area up to ' + N.HOLE_MAX + ' m2 (the brush\'s largest)',
    'inside ' + ins.filter(Boolean).length + ' of ' + ins.length + ' accepted; outside ' + outs.filter(x => !x).length + ' of ' + outs.length + ' refused', 'all accepted; all refused', ins.every(Boolean) && outs.every(x => !x));
}

// 8. the miss window through the order functions, against the P3 table
{
  const lines = [], delays = [0.5, 5.5, 10.5, 15.5, 20.5, 25.5, 30.5];
  let same = true;
  for (const d of delays) {
    const sim = N.run(N.create(ship, h1912, { script: N.scriptOf(Object.assign({}, h1912.orders, { delay: d })) }), { tMax: 600 }), s = N.summary(sim);
    const p3 = E.summary(R.encounter({ ahead: G.ahead + (20.5 - d) * U, port: G.port, portAround: 0 }, ship)), a3 = p3.stbd.area + p3.port.area + p3.bow.area;
    const ok = s.kind === p3.kind && Math.abs(s.area - a3) < 5e-3 * Math.max(1, a3) && (s.kind !== 'miss' || Math.abs(s.clearance - p3.minGap) < 0.05) && Math.abs(s.bow.crush - p3.bow.crush) < 0.05;
    if (!ok) same = false;
    lines.push('    order ' + f(d, 1).padStart(4) + ' s after the bells (ice ' + f(s.aheadOrder, 0).padStart(3) + ' m ahead)  ' + N.verdict(sim) + (ok ? '' : '   [P3: ' + p3.kind + ' ' + f(a3, 3) + ' m2, bow ' + f(p3.bow.crush, 1) + ']'));
  }
  row('MUST', 'the miss window, order 0.5 to 30.5 s after the bells: each outcome equals the P3 encounter\'s', same ? 'all 7 equal' : 'DIFFERENT', 'kind, clearance, area and bow crush as tools/encounter_run.js', same);
  const kinds = delays.map(d => N.summary(N.run(N.create(ship, h1912, { script: [{ when: 'bells', after: d, type: 'helm', value: 'away' }] }))).kind);
  row('MUST', 'the miss window turns between 15 and 21 s: sooner she clears, later she is holed', delays.map((d, i) => d + ':' + kinds[i]).join(' '), 'miss up to 15.5 s; holed from 20.5 s (helm only, never reversed; the ice 256 m ahead at 20.5 s since P3c)', kinds[0] === 'miss' && kinds[1] === 'miss' && kinds[2] === 'miss' && kinds[3] === 'miss' && kinds[4] === 'holed' && kinds[5] === 'holed');
  fs.writeFileSync(require('./outdir')('night_window_1912.txt'),'The 1912 berg, the 1912 drill (helm hard over away from the ice, reversed at the touch, engines stopped a minute later), the order given so many seconds after the bells:\n' + lines.join('\n') + '\n');
  globalThis.windowLines = lines;
}

// 9. the course does not matter
{
  const areas = [0, 90, 180, 266].map(hd => N.summary(N.run(N.create(ship, Object.assign({}, h1912, { heading: hd }), { auto: true }))).area);
  const spread = Math.max(...areas) - Math.min(...areas);
  row('MUST', 'the same night on courses 0, 90, 180 and 266 deg: the same damage', areas.map(a => f(a, 6)).join(' '), 'within 1e-4 m2 (whole turns of the round berg\'s outline nodes: the same problem)', spread < 1e-4);
  // between the outline's nodes (0.03125 deg since P3c; whole degrees fall on nodes and reproduce the 1912 point exactly)
  const odd = [266.37, 267.13, 311.61].map(hd => N.summary(N.run(N.create(ship, Object.assign({}, h1912, { heading: hd }), { auto: true }))).area);
  const worst = Math.max(...odd.map(a => Math.abs(a - areas[3]) / areas[3]));
  row('CHECK', 'the same night on courses 266.37, 267.13 and 311.61 deg (between the outline\'s nodes)', odd.map(a => f(a, 4)).join(' ') + ' m2', 'within 2 % of ' + f(areas[3], 4) + ' m2 (1.7 % at e11\'s point; the 1912 point grazes a stem strike: BACKLOG P3e)', worst < 0.02);
}

// 10. a stem strike through the night
{
  const sim = N.run(N.create(ship, Object.assign({}, h1912, { off: 0 }), {}), { tMax: 600 }), s = N.summary(sim);
  N.sink(sim, 6 * 3600);
  row('CHECK', 'the 1912 berg dead ahead and no order: the bow crushes, and the core floats her', 'bow ' + f(s.bow.crush, 1) + ' m, ' + (sim.foundered ? 'founders ' + f(sim.founderT / 60, 0) + ' min' : 'afloat') + '; verdict after ' + f(s.tClear - s.tTouch, 0) + ' s',
    '80 to 100 ft crushed and afloat (Wilding); the watch must end by itself', s.headOn && !sim.foundered && s.tClear > 0);
}

for (const [kind, what, value, ref, ok] of rows) console.log((kind === 'MUST' ? (ok ? 'PASS ' : 'FAIL ') : (ok ? 'in   ' : 'OUT  ')) + what.padEnd(100) + ' ' + String(value).padEnd(64) + ' ' + ref);
console.log('\nTHE MISS WINDOW of the 1912 night (out/night_window_1912.txt)');
for (const l of globalThis.windowLines) console.log(l);
console.log(fails ? '\nFAIL: ' + fails + ' MUST row(s)' : '\nPASS: every MUST row (' + rows.filter(r => r[0] === 'MUST').length + '); CHECK rows in range: ' + rows.filter(r => r[0] === 'CHECK' && r[4]).length + ' of ' + rows.filter(r => r[0] === 'CHECK').length);
process.exit(fails ? 1 : 0);
