'use strict';
// e117: G12's one measurement (docs/DESIGN_G12_the_way_up_at_the_flag_v1_2026-11-23.md, v1.1; Z1, 2026-11-23, at the
// coordinator's word). The way up from the onset across the history match's kept set.
// Each kept member of out/kept_1912.json is run as tools/history_match.js runs its 1912 watch: its configuration, its
// params, its encounter's area constant (the kept alpha) and its split, its bunker opening and its coal list, with no
// reader. It is handed over at its own onset (the what-if 'onset': the night's own check, D76 b) and let fall in trial
// 14's five ways (as she is; heave rate x0.85 and x1.18; roll 3 deg to port and to starboard), under both placements of
// the air (K.airAt 'centre', the default, and 'flag'). Each piece's way up on the bed is a word: upright (roll within
// 45 deg), upside down (beyond 135), on her side. A member counts when both pieces lie upright in all five ways.
//   node docs/research/experiments/e117_g12_onset_way_up_kept_set.js [--jobs 6] [--only 0,1] [--check 0,1]
// --check i,j also checks that members i and j are run as the match ran them. For each it reruns the fixed point of the
// area constant, against the kept alpha, and runs the watch to its flag, against the kept watchFounder. The jobs are
// forked processes at below-normal priority; the table prints in the members' order, whatever the jobs.
// The kept set came before D89 (params.keepTrace, on since the landing), so on today's model a member's watch is the
// match's to a step or two: m00 reaches its flag at T 163.4554 against the kept 163.4471. With the environment's
// E117_TRACE0=1 (D89's trace off, the step the match ran) it is the kept 163.4471 to the bit. The measurement runs on
// today's model.
// Output of 2026-11-23 (its stdout): results_2026-11-23/e117_g12_onset_way_up_kept_set.txt
const path = require('path'), fs = require('fs'), os = require('os'), cp = require('child_process');
const ROOT = path.join(__dirname, '..', '..', '..');
const DEG = Math.PI / 180, f = (v, d) => (Number.isFinite(v) ? v.toFixed(d) : String(v));
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
const KEPT = JSON.parse(fs.readFileSync(path.join(ROOT, 'out/kept_1912.json'), 'utf8'));

// ------------------------------------------------------------------ one member (in a job)
function member(idx, check) {
  const C = require(path.join(ROOT, 'core/core.js')), SC = require(path.join(ROOT, 'core/scenarios.js'));
  const N = require(path.join(ROOT, 'core/night.js')), E = require(path.join(ROOT, 'core/encounter.js'));
  const Mo = require(path.join(ROOT, 'core/motion.js')), Sys = require(path.join(ROOT, 'core/systems.js'));
  for (const r of ['girder.js', 'section.js', 'onset.js']) require(path.join(ROOT, 'core/readers', r));
  const F = require(path.join(ROOT, 'core/readers/fall.js')), GI = require(path.join(ROOT, 'core/readers/girder.js'));
  const HM = require(path.join(ROOT, 'tools/history_match.js'));
  const cfg = KEPT.config, m = KEPT.members[idx], x = m.inputs;
  // as tools/history_match.js's evaluator: the configuration's switches, its ship, the set's params, its split's blend
  const keepCfg = [Mo.SHIP.massPockets, Sys.PLANT.leadRule], keepIce = [E.ICE.alpha, E.ICE.openAlong];
  Mo.SHIP.massPockets = cfg.massPockets ? 1 : 0; Sys.PLANT.leadRule = cfg.leadRule ? 1 : 0;
  const ship = cfg.hullEnds ? C.buildShip({ hullEnds: 1 }) : C.buildShip();
  const params = { weighOverfill: cfg.weighOverfill ? 1 : 0, g11Doors: cfg.g11Doors ? 1 : 0, sideOpenings: cfg.sideOpenings ? 1 : 0 };
  for (const i of HM.activeInputs(cfg)) if (i.to === 'params') params[i.name] = x[i.name];
  if (process.env.E117_TRACE0) params.keepTrace = 0;       // the check's what-if only: D89's trace off, the step before it
  const blend = (t) => SC.TITANIC_SPLIT.map((s, i) => Object.assign({}, s, { f: (1 - t) * s.f + t * SC.TITANIC_SPLIT_GATE[i].f }));
  const sp0 = blend(x.split);
  const openAlong = x.split === 0 ? keepIce[1] : keepIce[1].map((r, i) => { const q = sp0[i].f / SC.TITANIC_SPLIT[i].f; return r.length > 3 ? [r[0], r[1], r[2] * q, r[3] * q] : [r[0], r[1], r[2] * q]; });
  const specOf = () => { const sp = N.spec(1912); sp.ice = Object.assign({}, sp.ice, { bunkerOpen: x.bunkerOpen }); if (x.coalListDeg !== undefined) sp.coalListDeg = x.coalListDeg; return sp; };
  const out = { idx, inputs: x, alpha: m.alpha, watchFounder: m.watchFounder };
  try {
    if (check) {
      // the fixed point of the area constant, as the match found it (calibrate.js's alphaFor: its start, its tolerance, its 40 turns)
      const R = require(path.join(ROOT, 'tools/encounter_run.js'));
      const G = Object.assign({ portAround: 0 }, N.GEOM_1912, { params }, x.coalListDeg === undefined ? {} : { coalListDeg: x.coalListDeg });
      let alpha = keepIce[0] * x.area / SC.CALIBRATED_AREA, it = 0, tot = NaN;
      for (; it < 40; it++) {
        const s = E.summary(R.encounter(Object.assign({}, G, { ice: { alpha, openAlong, bunkerOpen: x.bunkerOpen } }), ship)); tot = s.stbd.area + s.port.area;
        if (Math.abs(tot - x.area) < 1e-10) break;
        alpha *= x.area / tot;
      }
      out.check = { alpha, turns: it };
      E.ICE.alpha = m.alpha; E.ICE.openAlong = openAlong;
      const w = N.sink(N.create(ship, specOf(), { auto: true, readers: false, params }));
      out.check.founder = w.foundered ? (w.founderT - w.night.tTouch) / 60 : null;
    }
    E.ICE.alpha = m.alpha; E.ICE.openAlong = openAlong;
    const sim = N.sink(N.create(ship, specOf(), { auto: true, readers: false, params, handover: 'onset' }));
    const fd = sim.night.onset && sim.night.onset.found;
    if (!fd) { out.onset = null; out.foundered = !!sim.foundered; return out; }
    out.onset = { k: fd.k, T: (fd.t - sim.night.tTouch) / 60, x: fd.x, where: fd.where, sense: fd.sense, trim: sim.pitch / DEG, list: sim.roll / DEG };
    const CASES = [null, (s) => { s.vz *= 0.85; }, (s) => { s.vz *= 1.18; }, (s) => { s.roll -= 3 * DEG; }, (s) => { s.roll += 3 * DEG; }];
    out.ways = {};
    for (const at of ['centre', 'flag']) {
      out.ways[at] = CASES.map((change) => {
        const keep = { vz: sim.vz, roll: sim.roll };
        if (change) change(sim);
        const fall = F.begin(sim, { any: true, cut: fd.x, rule: 'break', t0: fd.t, K: { airAt: at } });
        sim.vz = keep.vz; sim.roll = keep.roll;
        while (!fall.done && fall.k < 4 * 60 * 30) F.advance(fall);
        const land = (id) => {
          const i = fall.pieces.findIndex(p => p.id === id), p = fall.pieces[i], w = F.worldOf(fall, i, [0.5 * (p.x0 + p.x1), 0, GI.Z_NA]);
          const R = F.quatR(p.q, new Float64Array(9)), roll = Math.atan2(R[7], R[8]) / DEG, a = Math.abs(roll);
          return { word: a <= 45 ? 'up' : (a >= 135 ? 'DOWN' : 'SIDE'), roll, dist: Math.hypot(w[0] - fall.breakAt[0], w[1] - fall.breakAt[1]) };
        };
        return { done: fall.done, bow: land('bow'), stern: land('stern') };
      });
    }
    return out;
  } finally {
    Mo.SHIP.massPockets = keepCfg[0]; Sys.PLANT.leadRule = keepCfg[1]; E.ICE.alpha = keepIce[0]; E.ICE.openAlong = keepIce[1];
  }
}

// ------------------------------------------------------------------ a job: its members in turn, each result sent back
if (process.argv[2] === '--job') {
  try { os.setPriority(os.constants.priority.PRIORITY_BELOW_NORMAL); } catch (e) { /* as it is */ }
  const list = JSON.parse(process.argv[3]), checks = JSON.parse(process.argv[4]);
  for (const idx of list) process.send(member(idx, checks.includes(idx)));
  process.exit(0);
}

// ------------------------------------------------------------------ the table
const N0 = KEPT.members.length;
const only = arg('--only') ? arg('--only').split(',').map(Number) : [...Array(N0).keys()];
const checks = arg('--check') ? arg('--check').split(',').map(Number) : [];
const jobs = Math.max(1, Math.min(Number(arg('--jobs') || 1), only.length));
const t0 = Date.now(), res = new Map();
const lists = [...Array(jobs)].map(() => []);
only.forEach((idx, k) => lists[k % jobs].push(idx));
Promise.all(lists.map(list => new Promise((ok, no) => {
  const ch = cp.fork(__filename, ['--job', JSON.stringify(list), JSON.stringify(checks)], { stdio: ['ignore', 'inherit', 'inherit', 'ipc'] });
  ch.on('message', (r) => res.set(r.idx, r));
  ch.on('exit', (code) => (code === 0 ? ok() : no(new Error('a job exited with ' + code))));
}))).then(() => {
  const words = (cs, id) => cs.map(c => c[id].word + (c.done ? '' : '*')).join(' ');
  const allUp = (cs) => cs.every(c => c.bow.word === 'up' && c.stern.word === 'up' && c.done);
  const isC = (x) => Math.abs(x.area - 0.9773) < 5e-5 && Math.abs(x.bunkerOpen - 0.07609) < 5e-6;
  console.log('e117: the way up from the onset across the kept set (' + KEPT.name + ', ' + N0 + ' members; configuration ' + JSON.stringify(KEPT.config) + ')');
  console.log('each member as tools/history_match.js runs its watch, handed over at its own onset; trial 14\'s five ways (as she is; heave x0.85, x1.18; roll 3 deg to port, to starboard); up: roll within 45 deg, DOWN beyond 135, SIDE between; * not at rest');
  let kC = 0, kF = 0, kB = 0, n = 0;
  for (const idx of only) {
    const r = res.get(idx), x = r.inputs;
    const head = 'm' + String(idx).padStart(2, '0') + (isC(x) ? ' (C)' : '    ') + ' area ' + f(x.area, 4) + ', split ' + f(x.split, 2) + ', GM0 ' + f(x.GM0, 3) + ', aDown ' + f(x.aDown, 3) + ', bunkerOpen ' + f(x.bunkerOpen, 4);
    if (!r.onset) { console.log(head + ': NO ONSET (' + (r.foundered ? 'foundered first' : 'never') + ')'); continue; }
    n++;
    const c = r.ways.centre, fl = r.ways.flag, uc = allUp(c), uf = allUp(fl);
    if (uc) kC++; if (uf) kF++; if (uc && uf) kB++;
    const span = (cs, id) => f(Math.min(...cs.map(q => q[id].dist)), 0) + '-' + f(Math.max(...cs.map(q => q[id].dist)), 0);
    console.log(head + ': onset T ' + f(r.onset.T, 2) + ', x ' + f(r.onset.x, 2) + ', trim ' + f(r.onset.trim, 1) + ', list ' + f(r.onset.list, 1));
    console.log('      centre: bow ' + words(c, 'bow') + ' (' + span(c, 'bow') + ' m), stern ' + words(c, 'stern') + ' (' + span(c, 'stern') + ' m)' + (uc ? '' : '  <-') +
      ';  flag: bow ' + words(fl, 'bow') + ' (' + span(fl, 'bow') + ' m), stern ' + words(fl, 'stern') + ' (' + span(fl, 'stern') + ' m)' + (uf ? '' : '  <-'));
    if (r.check) console.log('      check: the fixed point ' + r.check.alpha + ' in ' + r.check.turns + ' turns against the kept ' + r.alpha + (r.check.alpha === r.alpha ? ' (the same)' : ' (' + ((r.check.alpha / r.alpha - 1) * 1e9).toFixed(3) + 'e-9 apart)') +
      '; the watch to its flag T ' + f(r.check.founder, 4) + ' against the kept ' + f(r.watchFounder, 4) + (r.check.founder === r.watchFounder ? ' (the same)' : ''));
  }
  console.log('');
  console.log('BOTH PIECES UPRIGHT IN ALL FIVE WAYS, handed over at the onset: ' + kC + ' of ' + n + ' with the air through each slice\'s floodable centre (the default); ' + kF + ' of ' + n + ' with it where it lay at the hand-over (\'flag\'); ' + kB + ' of ' + n + ' with both' + (n < only.length ? ' (' + (only.length - n) + ' with no onset)' : ''));
  console.log('(' + f((Date.now() - t0) / 1000, 0) + ' s on ' + jobs + ' job(s))');
}, (e) => { console.error(e.stack || e); process.exit(1); });
