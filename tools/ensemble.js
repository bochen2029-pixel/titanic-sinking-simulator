// NH3: one model, many histories (docs/BRAINSTORM_the_next_horizon_v1_2026-11-23.md, NH3; BACKLOG section 2k). The landed
// member (today's defaults, the calibration epoch's candidate C) and the kept set's members (out/kept_1912.json, the
// history match's) run through the 1912 preset and the 1912 watch; their spread is written as bands to
// out/ensemble_1912.json through tools/outdir.js, so that the gate says STALE when it moves. A TOOL: nothing in the model
// changes, and what a run sets in a module (Encounter.ICE) is set back after it.
//   node tools/ensemble.js [--jobs N] [--members N]
//     --jobs N     worker threads (default 2: the lanes need the CPU); the table is the same with one or many
//     --members N  the first N members of the kept set only (a quick look; the tests use it)
// A member is its inputs over today's defaults, as the history match ran it: the opening, the split and the bunker's
// opening on the 1912 build, the coal list on the scenario, the rest as params. On the watch the encounter's area
// constant is the fixed point at the member's opening on its own params, coal list and bunker opening (the match's
// B16), the split's blend scaling ICE.openAlong (its B6). The landed member is the defaults, untouched: its watch is THE
// watch, its fingerprint the systems suite's BASE.
// The bands: every 5 min of the preset's time and of the watch's time after the touch, the members' least, median and
// most of trim, list and water aboard (those still afloat, counted), and of their founders and their onsets (B2's
// onset.js, looked at on every step as the reader looks); the landed member's own value beside each.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
try { os.setPriority(0, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch (e) { /* as it is */ }
const C = require('../core/core.js');
const SC = require('../core/scenarios.js');

const EVERY = 5 * 60;                     // s: the bands' sampling
const T_MAX = 8 * 3600;                   // s: Night.sink's own cap
const PARAMS = ['bunkerBurst', 'aDown', 'fOpen', 'GM0', 'zMergeHold', 'peakVent', 'sideStrength'];
const blend = (t) => SC.TITANIC_SPLIT.map((s, i) => Object.assign({}, s, { f: (1 - t) * s.f + t * SC.TITANIC_SPLIT_GATE[i].f }));
const r4 = (x) => (x === null || x === undefined || !Number.isFinite(x) ? x : +x.toFixed(4));
const paramsOf = (x) => { const p = {}; if (x) for (const k of PARAMS) p[k] = x[k]; return p; };

// a member's encounter on the watch (x: its inputs; null: the landed member, today's ICE): the area constant as the fixed
// point at the member's opening on its own params, coal list and bunker opening (the match's B16), the split's blend
// scaling ICE.openAlong (its B6). Found once a member; nothing in a module changes.
function memberIce(x, ship) {
  const E = require('../core/encounter.js');
  if (!x) return { alpha: E.ICE.alpha, openAlong: E.ICE.openAlong, turns: null };
  const N = require('../core/night.js'), R = require('./encounter_run.js'), sp0 = blend(x.split);
  const openAlong = x.split === 0 ? E.ICE.openAlong : E.ICE.openAlong.map((r, i) => { const q = sp0[i].f / SC.TITANIC_SPLIT[i].f; return r.length > 3 ? [r[0], r[1], r[2] * q, r[3] * q] : [r[0], r[1], r[2] * q]; });
  const G = Object.assign({ portAround: 0 }, N.GEOM_1912, { params: paramsOf(x), coalListDeg: x.coalListDeg });
  let alpha = E.ICE.alpha * x.area / SC.CALIBRATED_AREA, turns = 0;
  for (; turns < 40; turns++) {
    const sum = E.summary(R.encounter(Object.assign({}, G, { ice: { alpha, openAlong, bunkerOpen: x.bunkerOpen } }), ship)), tot = sum.stbd.area + sum.port.area;
    if (Math.abs(tot - x.area) < 1e-10) break;
    alpha *= x.area / tot;
  }
  return { alpha, openAlong, turns };
}
// a member's 1912 watch, made and not yet stepped: its params, coal list and bunker opening on the night, and its
// encounter (memberIce; o.ice when found already) on E.ICE for the watch's create alone (the encounter keeps its own copy
// from then: core/encounter.js, create), set back at once. o.spec(sp): a what-if on the night before it is made; o.create:
// Night.create's options over these (auto, no readers), or a function of the night giving them. Returns { sim, ice }.
function memberWatch(x, ship, o) {
  o = o || {};
  const E = require('../core/encounter.js'), N = require('../core/night.js'), ice = o.ice || memberIce(x, ship), sp = N.spec(1912);
  if (x) { sp.ice = Object.assign({}, sp.ice, { bunkerOpen: x.bunkerOpen }); sp.coalListDeg = x.coalListDeg; }
  if (o.spec) o.spec(sp);
  const opts = Object.assign(x ? { auto: true, readers: false, params: paramsOf(x) } : { auto: true, readers: false }, typeof o.create === 'function' ? o.create(sp) : o.create);
  const keep = [E.ICE.alpha, E.ICE.openAlong];
  try { E.ICE.alpha = ice.alpha; E.ICE.openAlong = ice.openAlong; return { sim: N.create(ship, sp, opts), ice }; } finally { E.ICE.alpha = keep[0]; E.ICE.openAlong = keep[1]; }
}

// one member (x: its inputs, or null for the landed member): the preset and the watch, sampled
function runMember(x) {
  const N = require('../core/night.js'), O = require('../core/readers/onset.js');
  const ship = C.buildShip(), DEG = 180 / Math.PI;
  const params = paramsOf(x);
  const sample = (sim, T) => { const r = C.readouts(sim); return [r4(T / 60), r4(sim.pitch * DEG), r4(sim.roll * DEG), r4(r.waterT)]; };
  // the preset
  const pre = (() => {
    let scen;
    if (x) { const b = { areaTitanic: x.area, bunkerOpen: x.bunkerOpen }; if (x.split !== 0) b.split = blend(x.split); scen = SC.PRESETS.titanic.build(b); scen.coalListDeg = x.coalListDeg; }
    else scen = SC.PRESETS.titanic.build({});
    const sim = C.createSim(ship, params, scen), st = O.start(), s = [sample(sim, 0)];
    let next = EVERY;
    while (!sim.foundered && sim.t < T_MAX) { C.step(sim); O.look(sim, st); if (sim.t >= next - 1e-9) { s.push(sample(sim, sim.t)); next += EVERY; } }
    return { founder: sim.foundered ? r4(sim.founderT / 60) : null, onset: st.found ? r4(st.found.T) : null, series: s };
  })();
  // the watch
  // G12's step 0 (D98): the watch runs to its flag, so that each member's founder and its onset (the onset library's own
  // look, below) are both measured, whatever the default hand-over becomes. memberWatch itself stays neutral: the gallery
  // and the Carpathia search take the night's default, and move with G12's switch on purpose (its step 3)
  const { sim, ice } = memberWatch(x, ship, { create: { handover: 'flag' } }), st = O.start(), s = [];
  let next = null;
  while (!N.over(sim) && sim.t < T_MAX) {                  // Night.sink's loop, sampled
    N.step(sim);
    if (sim.night.tTouch >= 0) {
      O.look(sim, st);
      const T = sim.t - sim.night.tTouch;
      if (next === null) { next = 0; }
      if (T >= next - 1e-9) { s.push(sample(sim, T)); next += EVERY; }
    }
    if (sim.t > 4 * 3600 && Math.abs(sim.inflow) < 0.02 && Math.abs(sim.wth) < 1e-5) break;
  }
  return { pre, watch: { founder: sim.foundered ? r4((sim.founderT - sim.night.tTouch) / 60) : null, onset: st.found ? r4(st.found.T) : null, fp: N.fingerprint(sim), k: sim.night.k, alpha: x ? ice.alpha : null, turns: x ? ice.turns : null, series: s } };
}

// the bands of the members' series and of a value each (least, median, most; n counted); the landed member's beside
function bandOf(vals) { const v = vals.filter((a) => a !== null && Number.isFinite(a)).sort((a, b) => a - b); return v.length ? { lo: v[0], med: v.length % 2 ? v[v.length >> 1] : r4(0.5 * (v[v.length / 2 - 1] + v[v.length / 2])), hi: v[v.length - 1], n: v.length } : { lo: null, med: null, hi: null, n: 0 }; }
function seriesBands(runs, landed) {
  const out = [], T = new Set(); for (const r of runs.concat([landed])) for (const p of r.series) T.add(p[0]);
  for (const t of [...T].sort((a, b) => a - b)) {
    const at = runs.map((r) => r.series.find((p) => p[0] === t)).filter(Boolean), me = landed.series.find((p) => p[0] === t);
    const b = [1, 2, 3].map((j) => bandOf(at.map((p) => p[j])));
    out.push({ T: t, trim: b[0], list: b[1], water: b[2], landed: me ? { trim: me[1], list: me[2], water: me[3] } : null });
  }
  return out;
}

function makePool(jobs) {
  if (jobs <= 1) return { run: async (xs) => xs.map((x) => runMember(x)), close() {} };
  return {
    run(xs) {
      return new Promise((resolve, reject) => {
        const res = new Array(xs.length); let next = 0, done = 0;
        const ws = Array.from({ length: Math.min(jobs, xs.length) }, () => new Worker(__filename, { workerData: { role: 'ensemble' } }));
        const send = (w) => { if (next < xs.length) { const i = next++; w.postMessage({ i, x: xs[i] }); } };
        for (const w of ws) {
          w.on('error', reject);
          w.on('message', (m) => { if (m.error) { reject(new Error(m.error)); return; } res[m.i] = m.r; done++; if (done === xs.length) { for (const q of ws) q.terminate(); resolve(res); } else send(w); });
          send(w);
        }
      });
    },
    close() {},
  };
}
if (!isMainThread && workerData && workerData.role === 'ensemble') {
  parentPort.on('message', ({ i, x }) => { try { parentPort.postMessage({ i, r: runMember(x) }); } catch (e) { parentPort.postMessage({ error: String(e && e.stack || e) }); } });
}

function codeHash() {
  const ROOT = path.join(__dirname, '..'), h = crypto.createHash('sha256');
  for (const d of ['core', path.join('core', 'readers')]) for (const f of fs.readdirSync(path.join(ROOT, d)).sort()) if (f.endsWith('.js')) { h.update(f); h.update(fs.readFileSync(path.join(ROOT, d, f))); }
  return h.digest('hex').slice(0, 12);
}

async function run(o, say) {
  say = say || (() => {});
  const kept = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'out', 'kept_1912.json'), 'utf8'));   // the tracked kept set: an input
  const members = kept.members.slice(0, o.members || kept.members.length).map((m) => m.inputs);
  const t0 = Date.now(), pool = makePool(o.jobs);
  say('ensemble: the landed member and ' + members.length + ' of the kept set\'s ' + kept.members.length + ' members (out/kept_1912.json, ' + kept.name + '), ' + o.jobs + ' thread' + (o.jobs > 1 ? 's' : ''));
  const all = await pool.run([null].concat(members));
  const landed = all[0], runs = all.slice(1);
  const table = {
    what: 'the 1912 preset and watch run by the landed member and the kept set\'s members: their bands (tools/ensemble.js, NH3)',
    core: codeHash(), kept: kept.name, members: runs.length, every: EVERY / 60,
    landed: { preset: { founder: landed.pre.founder, onset: landed.pre.onset }, watch: { founder: landed.watch.founder, onset: landed.watch.onset, fp: landed.watch.fp, k: landed.watch.k } },
    founder: { preset: bandOf(runs.map((r) => r.pre.founder)), watch: bandOf(runs.map((r) => r.watch.founder)) },
    onset: { preset: bandOf(runs.map((r) => r.pre.onset)), watch: bandOf(runs.map((r) => r.watch.onset)) },
    afloat: { preset: runs.filter((r) => r.pre.founder === null).length, watch: runs.filter((r) => r.watch.founder === null).length },
    bands: { preset: seriesBands(runs.map((r) => r.pre), landed.pre), watch: seriesBands(runs.map((r) => r.watch), landed.watch) },
  };
  const file = o.out ? path.resolve(o.out) : require('./outdir')('ensemble_1912.json');   // o.out: a test's own file
  fs.writeFileSync(file, JSON.stringify(table, null, 1) + '\n');
  const fb = table.founder;
  say('the founder, preset: ' + landed.pre.founder + ' min (' + fb.preset.lo + ' to ' + fb.preset.hi + ', ' + fb.preset.n + ' of ' + runs.length + ' founder); the watch: T ' + landed.watch.founder + ' (' + fb.watch.lo + ' to ' + fb.watch.hi + ', ' + fb.watch.n + ' of ' + runs.length + ')');
  say('the onset, preset: ' + landed.pre.onset + ' (' + table.onset.preset.lo + ' to ' + table.onset.preset.hi + '); the watch: ' + landed.watch.onset + ' (' + table.onset.watch.lo + ' to ' + table.onset.watch.hi + ')');
  say('the landed watch: ' + landed.watch.fp + ' at step ' + landed.watch.k + '; written ' + file + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)');
  return { table, all, file };
}

function args(a) {
  const o = { jobs: 2, members: 0 };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--jobs') o.jobs = Math.max(1, +a[++i] | 0);
    else if (a[i] === '--members') o.members = Math.max(1, +a[++i] | 0);
    else throw new Error('ensemble: unknown argument ' + a[i]);
  }
  return o;
}
module.exports = { run, args, runMember, memberIce, memberWatch, paramsOf, bandOf, seriesBands, codeHash, EVERY, T_MAX };
if (isMainThread && require.main === module) run(args(process.argv.slice(2)), (s) => console.log(s)).then(() => process.exit(0), (e) => { console.error(e && e.stack || e); process.exit(1); });
