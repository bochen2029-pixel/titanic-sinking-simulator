// B4's joint from the onset across the kept set: gate 3 of docs/DESIGN_B4_the_joint_from_the_onset_v1_1_2026-11-23.md
// (B1+B2; the coordinator's plan for join 20, 2026-11-23 18:52).
//
// For the landed member (today's defaults) and each member of the 1912 history match's kept set (out/kept_1912.json):
//   1. the default watch, handed over at the break's onset (G12's switch, D98), run to its onset with the night's own
//      check finding it (readers off), each member's watch made as tools/ensemble.js makes it (memberWatch: its params,
//      its coal list, its bunker opening, its own encounter);
//   2. the fall from that onset with B4's joint, begun as the fall reader begins it (core/readers/fall.js onStep: cut at
//      the onset's own station, the 'break' rule, t0 the onset's time; Z1: "the reader's path to the bit"), the hinge
//      passed here in the onset's own sense, until the joint lets go, the fall ends, or TMAX past the onset.
// For each it keeps the onset (T after the touch, x, sense, trim, list) and the joint:
//   - the moment it carried at the hand-over;
//   - when it let go after the onset, by tension or by shear, at what angle;
//   - each force over its capacity there (rN along her, rV across) and the largest of each while it held.
// The table, out/joint_kept_1912.json, is written through tools/outdir.js, so the gate says STALE when it moves. It
// counts the kept set k of N (released, by shear, by tension, held, no onset) and bands the times, angles and ratios.
// It never picks a sense: it reports both (B4's rule, the coordinator's ledger of 2026-11-20).
// A TOOL: nothing in the model changes. Encounter.ICE is set back after each member's watch is made (ensemble.js).
// tools/strength_tests.js section 10 reads the table.
// Since D113 (the coordinator, 2026-11-24) the joint is judged under the spaces (K.air 'spaces': 'held', the floats).
// The lumped pocket's stand-in vent drained the joined pieces from the hand-over and drove the swing that parted 23 of 30
// at the surface (Z1's finding). Its sweep stays reachable for the record (--air pocket, with --centre for its place).
//   node tools/joint_kept.js [--jobs N] [--members N] [--tmax s] [--air spaces|pocket] [--centre] [--yield moment|circle]
//                            [--k name=value[,name=value]] [--out FILE]
//     --jobs N     worker threads (default 1: the lanes need the CPU); the table is the same with one or many
//     --members N  the first N members only (a quick look)
//     --tmax s     the longest the fall is followed past the onset without the joint letting go (default 90 under the
//                  spaces, 1200 under the pocket)
//     --air A      the fall's air: spaces (the default) or pocket
//     --centre     under the pocket, the same sweep again with the pocket placed at 'centre' (the hand-over's what-if)
//     --yield Y    the hinge's yield (D114, Z1 for B1+B2): moment (the default, on M = Mu alone), circle (the onset's
//                  own M-V interaction, S.hinge's under(s, V)) or resultant (the same circle on the resultant of the
//                  joint's bending moments about her y and her z, B1+B2's e124: the onset's own axis)
//     --k K        the fall's switches by name, passed through F.begin's opts.K (D114: --k peakTank=weighed)
// Each joint also keeps its margin at the hand-over: the yield there (Mu, or Mu under(0, V0) under 'circle', V0 the
// locked solve's shear at t0) against M0, in % of the yield (positive: inside it)
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
try { os.setPriority(0, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch (e) { /* as it is */ }
const C = require('../core/core.js');
const SC = require('../core/scenarios.js');
const EN = require('./ensemble.js');

const DEG = 180 / Math.PI;
const r4 = (x) => (x === null || x === undefined || !Number.isFinite(x) ? null : +x.toFixed(4));

// the fall's air for a sweep (v): { air: 'spaces' } (D113, the default since 2026-11-24: the joint is judged under the
// spaces, 'held' and the floats, main's defaults under K.air 'spaces'), or { air: 'pocket' } (the lumped pocket, whose
// stand-in vent drains the joined pieces from the hand-over: Z1's finding, the cause of the swing), with airAt the
// pocket's place ('centre' in place of K0.airAtBreak's 'flag'); passed through F.begin's opts.K, which wins
const kOf = (v) => { const K = {}; if (v && v.air === 'spaces') K.air = 'spaces'; if (v && v.airAt) K.airAt = v.airAt; if (v && v.K) Object.assign(K, v.K); return Object.keys(K).length ? { K } : {}; };
// the hinge's yield for a sweep (v.yieldOn, D114): nothing passed for the default, so a sweep without it is as before
const yOf = (v) => (v && v.yieldOn ? { yieldOn: v.yieldOn } : {});
// the joint's yield at the hand-over and its margin there (% of the yield; positive inside it)
const atHandOver = (J, F) => { const V0 = Math.abs(J.demand0 ? J.demand0.V : 0), y = J.H.Mu * (F && F.yieldShare ? F.yieldShare(J, 0) : (J.yieldOn === 'circle' ? J.H.under(0, V0) : 1)); return { V0: r4(V0 / 1e6), yield0: r4(y / 1e9), margin0: r4(100 * (1 - J.M0 / y)) }; };
// one member (x: its inputs, or null for the landed member), under the sweep's air (v)
function runMember(x, tmax, v) {
  const N = require('../core/night.js'), F = require('../core/readers/fall.js');
  const ship = C.buildShip();
  const { sim, ice } = EN.memberWatch(x, ship);          // the night's default hand-over: the onset (D98)
  while (!N.over(sim) && sim.t < EN.T_MAX) N.step(sim);
  const w = sim.night, q = w.onset && w.onset.found;
  const base = { area: r4(x ? x.area : SC.CALIBRATED_AREA), alpha: x ? r4(ice.alpha) : null, k: w.k, fp: N.fingerprint(sim) };
  if (!q) return Object.assign(base, { onset: null, founder: sim.foundered ? r4((sim.founderT - w.tTouch) / 60) : null, joint: null });
  const onset = { T: r4(q.T), t: r4(q.t), x: r4(q.x), where: q.where, sense: q.sense, trim: r4(q.trimDeg), list: r4(q.listDeg), M: r4(q.M / 1e9), Mu: r4(q.Mu / 1e9), V: r4(q.V / 1e6), Vu: r4(q.Vu / 1e6) };
  const fall = F.begin(sim, Object.assign({ any: true, cut: q.x, rule: 'break', t0: q.t, hinge: Object.assign({ sense: q.sense === 'sagging' ? 'sag' : 'hog' }, yOf(v)) }, kOf(v)));
  const J = fall.eng.joint;
  if (!J) return Object.assign(base, { onset, joint: { built: false } });
  const h0 = atHandOver(J, F);
  // the bed's first touch by either piece while they hold: a joint that lets go only there has sunk joined; and the
  // largest opening while it held, for the peak of its demand
  let touched = null, thMax = -Infinity;
  while (!J.released && !fall.done && fall.t - q.t < tmax) {
    F.advance(fall);
    if (J.theta > thMax) thMax = J.theta;
    if (touched === null && fall.eng.bodies.some(b => b.touched)) touched = fall.t - q.t;
  }
  const rel = J.released ? J.release : null, ev = rel ? fall.events.find(e => e.id === 'release') : null;
  // where she parts: at the surface (before either piece has touched the bed, and in the first km of the column), or
  // joined to the bed (held to rest, or let go only at the touch)
  const surface = !!rel && touched === null && !!ev && ev.depth < 1000;
  // a joint that never yielded stayed on its elastic line, so its demand's peak is M0 + k0 thetaMax (what a hinge made
  // unbreakable would carry): against Mu, the margin she lacked to part, and two ways to read it (B1+B2, at the
  // coordinator's D113): the ligament's loss that would close it (the crack running), and the water aft of the station,
  // at the stern piece's lever, that would (the tear's flooding; a stern settling back adds to it, not counted here)
  const elastic = J.tYield === undefined && isFinite(thMax), bs = fall.eng.bodies[J.is];
  const peak = elastic ? (J.M0 + J.H.k0 * thMax) / J.H.Mu : null, marginM = elastic ? J.H.Mu - (J.M0 + J.H.k0 * thMax) : null;
  const lever = bs && bs.C ? Math.abs(J.xb - bs.C[0]) : null;
  return Object.assign(base, {
    onset,
    joint: {
      built: true, xb: r4(J.xb), sense: J.sense > 0 ? 'hog' : 'sag', M0: r4(J.M0 / 1e9), Mu: r4(J.H.Mu / 1e9),
      released: !!rel, after: rel ? r4(rel.t - q.t) : null, by: rel ? rel.by : null, theta: rel ? r4(rel.theta * DEG) : null,
      rN: rel ? r4(rel.rN) : null, rV: rel ? r4(rel.rV) : null, maxN: r4(J.maxN), maxV: r4(J.maxV), W: r4(J.W / 1e6),
      followed: r4(fall.t - q.t), done: !!fall.done,
      yieldAt: J.tYield !== undefined ? r4(J.tYield - q.t) : null, depth: ev ? r4(ev.depth) : null, touched: r4(touched), surface,
      thetaMax: isFinite(thMax) ? r4(thMax * DEG) : null, peak: r4(peak), marginM: r4(marginM === null ? null : marginM / 1e9),
      loss: r4(marginM === null ? null : 100 * marginM / J.H.Mu), lever: r4(lever), water: r4(marginM === null || !lever ? null : marginM / (C.GRAV * lever) / 1000),
      V0: h0.V0, yield0: h0.yield0, margin0: h0.margin0,
    },
  });
}

// Gate 4: the as-built ligament and the sourced alternatives, as what-ifs on the landed member. Each runs the landed watch
// to its onset (with the section as built: the onset is the model's own), then begins the fall with a joint whose hinge
// is built on the alternative. The double bottom's girders through section.js's SCANT, set and put back around the
// hinge's own build, on a fresh ship (S.hinge caches by ship); the joints and the hinge's length through S.hinge's
// options. Sources: the girders' research (docs/research/RESEARCH_double_bottom_girders_v1_2026-11-20.md: Halpern's
// five intercostal girders a side [read]; Britannic's 3/4 in [read]); Stoney's period strengths (strength_tests' own
// what-if); Lh's two what-ifs (section.js). The riveted joints' parting strains (section.js EPS_SLIP and EPS_DROP, each
// 5e-4 [bet]: a rivet's slip before it shears, then the joint's load gone over as much again) halved and doubled,
// through S.hinge's opts.parting (the coordinator's word, 19:11): every riveted joint's, since the strain is the rivets'
// own, in deck and side alike.
const WHATIFS = [
  ['as built (the default)', {}],
  ['side girders five a side (Halpern) [read]', { girders: { n: 5 } }],
  ['side girders 3/4 in (Britannic\'s) [read]', { girders: { t: 0.75 } }],
  ['the joints at Stoney\'s period strengths', { opts: { eta: { quad: 0.75 * 430 / 245, double: 0.60 * 430 / 245 } } }],
  ['Lh a web frame\'s spacing, 9 ft', { Lh: 9 * 0.3048 }],
  ['Lh a frame\'s spacing, 36 in', { Lh: 36 * 0.0254 }],
  ['the joints\' parting strains halved [bet]', { opts: { parting: { slip: 2.5e-4, drop: 2.5e-4 } } }],
  ['the joints\' parting strains doubled [bet]', { opts: { parting: { slip: 1e-3, drop: 1e-3 } } }],
];
function runWhatIf(label, v, tmax, air) {
  const N = require('../core/night.js'), F = require('../core/readers/fall.js'), S = require('../core/readers/section.js');
  const ship = C.buildShip();
  const { sim } = EN.memberWatch(null, ship);
  while (!N.over(sim) && sim.t < EN.T_MAX) N.step(sim);
  const q = sim.night.onset && sim.night.onset.found;
  if (!q) return { label, onset: null, joint: null };
  const sense = q.sense === 'sagging' ? 'sag' : 'hog', ho = Object.assign({}, v.opts || {}, v.Lh ? { Lh: v.Lh } : {});
  const keep = Object.assign({}, S.SCANT.sideGirders);
  let H;
  try {
    if (v.girders) Object.assign(S.SCANT.sideGirders, v.girders);
    H = S.hinge(v.girders ? C.buildShip() : ship, q.x, sense, ho);
  } finally { S.SCANT.sideGirders.n = keep.n; S.SCANT.sideGirders.t = keep.t; }
  const fall = F.begin(sim, Object.assign({ any: true, cut: q.x, rule: 'break', t0: q.t, hinge: Object.assign({ sense, H }, yOf(air)) }, kOf(air)));
  const J = fall.eng.joint;
  let touched = null, thMax = -Infinity;
  while (J && !J.released && !fall.done && fall.t - q.t < tmax) { F.advance(fall); if (J.theta > thMax) thMax = J.theta; if (touched === null && fall.eng.bodies.some(b => b.touched)) touched = fall.t - q.t; }
  // what still holds at the tear's top (the side shell parted, so the shear rides the double bottom's webs): the coin's edge
  const rel = J && J.released ? J.release : null, hs = H.at(H.thetaTop), ev = rel ? fall.events.find(e => e.id === 'release') : null;
  const peak = J && J.tYield === undefined && isFinite(thMax) ? (J.M0 + J.H.k0 * thMax) / J.H.Mu : null;
  return {
    label, onset: { T: r4(q.T), x: r4(q.x), sense: q.sense }, VsTop: r4(hs.Vs / 1e6), NtTop: r4(hs.Nt / 1e6), Lh: r4(H.Lh), Mu: r4(H.Mu / 1e9),
    joint: J ? { built: true, M0: r4(J.M0 / 1e9), released: !!rel, after: rel ? r4(rel.t - q.t) : null, by: rel ? rel.by : null, theta: rel ? r4(rel.theta * DEG) : null, rN: rel ? r4(rel.rN) : null, rV: rel ? r4(rel.rV) : null, maxN: r4(J.maxN), maxV: r4(J.maxV), followed: r4(fall.t - q.t), done: !!fall.done,
      yieldAt: J.tYield !== undefined ? r4(J.tYield - q.t) : null, depth: ev ? r4(ev.depth) : null, touched: r4(touched), surface: !!rel && touched === null && !!ev && ev.depth < 1000, peak: r4(peak) } : { built: false },
  };
}

function makePool(jobs, tmax) {
  if (jobs <= 1) return { run: async (xs, each, v) => xs.map((x, i) => { const r = runMember(x, tmax, v); if (each) each(i, r); return r; }) };
  return {
    run(xs, each, v) {
      return new Promise((resolve, reject) => {
        const res = new Array(xs.length); let next = 0, done = 0;
        const ws = Array.from({ length: Math.min(jobs, xs.length) }, () => new Worker(__filename, { workerData: { role: 'joint_kept', tmax } }));
        const send = (wk) => { if (next < xs.length) { const i = next++; wk.postMessage({ i, x: xs[i], v: v || null }); } };
        for (const wk of ws) {
          wk.on('error', reject);
          wk.on('message', (m) => { if (m.error) { reject(new Error(m.error)); return; } res[m.i] = m.r; if (each) each(m.i, m.r); done++; if (done === xs.length) { for (const q of ws) q.terminate(); resolve(res); } else send(wk); });
          send(wk);
        }
      });
    },
  };
}
if (!isMainThread && workerData && workerData.role === 'joint_kept') {
  parentPort.on('message', ({ i, x, v }) => { try { parentPort.postMessage({ i, r: runMember(x, workerData.tmax, v || undefined) }); } catch (e) { parentPort.postMessage({ error: String(e && e.stack || e) }); } });
}

const f = (v, d) => (v === null || v === undefined || !Number.isFinite(v)) ? '-' : v.toFixed(d === undefined ? 2 : d);
function line(label, r) {
  const q = r.onset, j = r.joint;
  if (!q) return '  ' + label.padEnd(8) + 'no onset' + (r.founder !== null ? '; founders T ' + f(r.founder) : '');
  const yl = j && j.built ? (j.yieldAt === null || j.yieldAt === undefined ? 'never yielded' : 'yielded +' + f(j.yieldAt, 2) + ' s') : '';
  const pk = j && j.peak !== null && j.peak !== undefined ? '; its peak ' + f(j.peak, 4) + ' of Mu: she lacks ' + f(j.marginM, 3) + ' GN m, the ligament ' + f(j.loss, 2) + ' % weaker or ' + f(j.water, 0) + ' t more water ' + f(j.lever, 0) + ' m aft' : '';
  const jt = !j || !j.built ? 'NO JOINT BUILT' : (j.released && j.surface ? 'parts at the surface ' + f(j.after, 2).padStart(7) + ' s after, by ' + j.by.padEnd(7) + ' at ' + f(j.theta, 3) + ' deg (' + yl + '); rN ' + f(j.rN, 3) + ', rV ' + f(j.rV, 3)
    : (j.released ? 'SINKS JOINED: lets go only at the bed, ' + f(j.after, 1) + ' s after (' + f(j.depth, 0) + ' m), by ' + j.by : (j.done ? 'SINKS JOINED: held to rest on the bed, ' + f(j.followed, 0) + ' s' : 'HOLDS through the window, ' + f(j.followed, 0) + ' s')) + ' (' + yl + ')' + pk) + '; most while held rN ' + f(j.maxN, 3) + ', rV ' + f(j.maxV, 3);
  return '  ' + label.padEnd(8) + ('T ' + f(q.T)).padEnd(10) + ('x ' + f(q.x)).padEnd(10) + q.sense.padEnd(9) + ('trim ' + f(q.trim, 1)).padEnd(10) + ('M0 ' + f(j && j.M0, 3)).padEnd(10) + ('margin ' + f(j && j.margin0, 2) + ' %').padEnd(16) + jt;
}

// one sweep's counts and bands. A member parts at the surface when its joint lets go before either piece touches the bed;
// otherwise it sinks joined (held to rest, or let go only at the touch). Since gate 5's mend (Z1, cf233ac: the hinge's
// moment at the sub-step's middle) every release at the surface comes at the fold's start, by shear; the members that
// sink joined never yield, their joint's first peak stopping within 0.05 to 0.18 % of Mu (B1+B2's check, 2026-11-24)
function summarise(all) {
  const landed = all[0], runs = all.slice(1);
  const withOnset = runs.filter((r) => r.onset), rel = withOnset.filter((r) => r.joint && r.joint.released), surf = rel.filter((r) => r.joint.surface);
  const counts = {
    N: runs.length, onset: withOnset.length, noOnset: runs.length - withOnset.length, built: withOnset.filter((r) => r.joint && r.joint.built).length,
    released: rel.length, shear: rel.filter((r) => r.joint.by === 'shear').length, tension: rel.filter((r) => r.joint.by === 'tension').length,
    held: withOnset.length - rel.length,
    surface: surf.length, joined: withOnset.length - surf.length, yielded: withOnset.filter((r) => r.joint && r.joint.yieldAt !== null && r.joint.yieldAt !== undefined).length,
    window: withOnset.filter((r) => r.joint && r.joint.built && !r.joint.released && !r.joint.done).length,
  };
  const els = withOnset.filter((r) => r.joint && r.joint.peak !== null && r.joint.peak !== undefined);
  const bands = {
    after: EN.bandOf(rel.map((r) => r.joint.after)), theta: EN.bandOf(rel.map((r) => r.joint.theta)),
    rN: EN.bandOf(rel.map((r) => r.joint.rN)), rV: EN.bandOf(rel.map((r) => r.joint.rV)),
    M0: EN.bandOf(withOnset.map((r) => r.joint && r.joint.M0)), onsetT: EN.bandOf(withOnset.map((r) => r.onset.T)), trim: EN.bandOf(withOnset.map((r) => r.onset.trim)),
    surfaceAfter: EN.bandOf(surf.map((r) => r.joint.after)), surfaceTheta: EN.bandOf(surf.map((r) => r.joint.theta)),
    yieldAt: EN.bandOf(withOnset.map((r) => r.joint && r.joint.yieldAt)),
    // the joints that never yielded: their demand's peak against Mu, and what she lacked to part, read two ways
    peak: EN.bandOf(els.map((r) => r.joint.peak)), loss: EN.bandOf(els.map((r) => r.joint.loss)), water: EN.bandOf(els.map((r) => r.joint.water)), lever: EN.bandOf(els.map((r) => r.joint.lever)),
    // the margin at the hand-over (% of the yield there; positive inside it)
    margin0: EN.bandOf(withOnset.map((r) => r.joint && r.joint.margin0)),
  };
  return { landed, runs, counts, bands };
}

async function run(o, say) {
  say = say || (() => {});
  const kept = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'out', 'kept_1912.json'), 'utf8'));   // an input
  const members = kept.members.slice(0, o.members || kept.members.length).map((m) => m.inputs);
  const t0 = Date.now();
  const v0 = Object.assign({ air: o.air }, o.yieldOn ? { yieldOn: o.yieldOn } : {}, o.K ? { K: o.K } : {});
  say('joint_kept: B4\'s joint from the onset, the landed member and ' + members.length + ' of the kept set\'s ' + kept.members.length + ' members (out/kept_1912.json, ' + kept.name + '), ' + o.jobs + ' thread' + (o.jobs > 1 ? 's' : '') + '; the fall\'s air: ' + (o.air === 'spaces' ? 'the spaces (\'held\', the floats; D113)' : 'the lumped pocket and its stand-in vent') + '; followed up to ' + o.tmax + ' s past the onset' +
    (o.yieldOn || o.K ? '; the hinge yields on ' + (o.yieldOn === 'circle' ? 'the onset\'s circle' : 'the moment') + (o.K ? ', K ' + JSON.stringify(o.K) : '') + ' (D114)' : ''));
  const all = await makePool(o.jobs, o.tmax).run([null].concat(members), o.each ? (i, r) => say(line(i === 0 ? 'landed' : '#' + i, r)) : null, v0);
  const S0 = summarise(all), landed = S0.landed, runs = S0.runs, counts = S0.counts;
  const table = {
    what: 'B4\'s joint from the break\'s onset on the 1912 watch, the landed member and the kept set (tools/joint_kept.js; gate 3 of docs/DESIGN_B4_the_joint_from_the_onset_v1_1_2026-11-23.md)',
    core: EN.codeHash(), kept: kept.name, air: o.air, tmax: o.tmax, yieldOn: o.yieldOn || 'moment', K: o.K || {}, counts, bands: S0.bands,
    landed, members: runs,
  };
  // the pocket's own what-if (Z1's probe, 2026-11-24: the onset's pocket at 'centre' in place of D98's 'flag' moves
  // member C's first peak of the joint's moment by 1.5 % of Mu): the same sweep with the pocket placed at 'centre'.
  // Counted beside, never chosen; under the pocket only (--air pocket --centre)
  if (o.centre && o.air === 'pocket') {
    say('the same with the onset\'s pocket at \'centre\' (the hand-over\'s what-if; the default is D98\'s \'flag\'):');
    const SC_ = summarise(await makePool(o.jobs, o.tmax).run([null].concat(members), o.each ? (i, r) => say(line(i === 0 ? 'landed' : '#' + i, r)) : null, Object.assign({}, v0, { air: 'pocket', airAt: 'centre' })));
    table.centre = { airAt: 'centre', counts: SC_.counts, bands: SC_.bands, landed: SC_.landed.joint, members: SC_.runs.map((r) => (r.joint ? { after: r.joint.after, by: r.joint.by, theta: r.joint.theta, surface: r.joint.surface, depth: r.joint.depth, yieldAt: r.joint.yieldAt, M0: r.joint.M0, maxV: r.joint.maxV, margin0: r.joint.margin0 } : null)) };
  }
  // gate 4, on the landed member (in this thread: each a watch to the onset and a short fall), under the sweep's air
  if (o.whatifs) {
    table.whatifs = WHATIFS.map(([label, v]) => runWhatIf(label, v, o.tmax, v0));
    for (const w of table.whatifs) {
      const j = w.joint;
      say('  what-if: ' + w.label.padEnd(44) + 'at the tear\'s top Vs ' + f(w.VsTop, 2) + ' MN, Nt ' + f(w.NtTop, 1) + ' MN; Lh ' + f(w.Lh, 2) + ' m; ' + (j && j.released ? (j.surface ? 'parts at the surface ' : 'lets go only at the bed ') + f(j.after, 2) + ' s after, by ' + j.by + ' at ' + f(j.theta, 2) + ' deg (rN ' + f(j.rN, 3) + ', rV ' + f(j.rV, 3) + ')' : (j && j.built ? (j.done ? 'SINKS JOINED, held to rest, ' : 'HOLDS through the window, ') + f(j.followed, 0) + ' s' + (j.peak !== null && j.peak !== undefined ? ', its peak ' + f(j.peak, 4) + ' of Mu' : '') : 'no joint')));
    }
  }
  const file = o.out ? path.resolve(o.out) : require('./outdir')('joint_kept_1912.json');
  fs.writeFileSync(file, JSON.stringify(table, null, 1) + '\n');
  if (!o.each) { say(line('landed', landed)); runs.forEach((r, i) => say(line('#' + (i + 1), r))); }
  const sb = table.bands;
  say('the kept set: an onset in ' + counts.onset + ' of ' + counts.N + '; she parts at the surface in ' + counts.surface + ' of ' + counts.onset + (counts.surface ? ', ' + f(sb.surfaceAfter.lo) + ' to ' + f(sb.surfaceAfter.hi) + ' s after (median ' + f(sb.surfaceAfter.med) + ') at ' + f(sb.surfaceTheta.lo, 2) + ' to ' + f(sb.surfaceTheta.hi, 2) + ' deg' : '') + '; does not in ' + counts.joined +
    ' (holds through the ' + o.tmax + ' s window ' + counts.window + ', lets go only at the bed ' + (counts.released - counts.surface) + ', held to rest ' + (counts.held - counts.window) + '); by shear ' + counts.shear + ', by tension ' + counts.tension + '; yielded in ' + counts.yielded + '; the landed member ' + (landed.joint && landed.joint.released ? (landed.joint.surface ? 'parts at the surface ' : 'lets go at the bed ') + f(landed.joint.after) + ' s, by ' + landed.joint.by : 'does not part'));
  if (sb.margin0 && sb.margin0.n) say('  the margin at the hand-over, M0 against the yield there: ' + f(sb.margin0.lo, 2) + ' to ' + f(sb.margin0.hi, 2) + ' % of the yield (median ' + f(sb.margin0.med, 2) + '; positive inside it)');
  if (sb.peak.n) say('  the joints that never yielded (' + sb.peak.n + '):their demand\'s peak ' + f(sb.peak.lo, 4) + ' to ' + f(sb.peak.hi, 4) + ' of Mu (median ' + f(sb.peak.med, 4) + '): to part she lacks the ligament ' + f(sb.loss.lo, 2) + ' to ' + f(sb.loss.hi, 2) + ' % weaker, or ' + f(sb.water.lo, 0) + ' to ' + f(sb.water.hi, 0) + ' t more water aft of the station at the stern piece\'s lever (' + f(sb.lever.lo, 0) + ' to ' + f(sb.lever.hi, 0) + ' m)');
  if (table.centre) { const cc = table.centre.counts, cb = table.centre.bands; say('  with the pocket at \'centre\': parts at the surface in ' + cc.surface + ' of ' + cc.onset + ' (' + f(cb.surfaceAfter.lo) + ' to ' + f(cb.surfaceAfter.hi) + ' s), sinks joined in ' + cc.joined + '; the landed member ' + (table.centre.landed && table.centre.landed.surface ? 'parts at ' + f(table.centre.landed.after) + ' s' : 'sinks joined')); }
  say('written ' + file + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)');
  return { table, file };
}

function args(a) {
  const o = { jobs: 1, members: 0, tmax: null, out: null, each: true, whatifs: true, centre: false, air: 'spaces', yieldOn: null, K: null };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--no-whatifs') o.whatifs = false;
    else if (a[i] === '--yield') { o.yieldOn = a[++i]; if (o.yieldOn !== 'moment' && o.yieldOn !== 'circle' && o.yieldOn !== 'resultant') throw new Error('joint_kept: --yield is moment, circle or resultant'); }
    else if (a[i] === '--k') {
      o.K = o.K || {};
      for (const kv of String(a[++i]).split(',')) { const m = /^([A-Za-z]\w*)=(.+)$/.exec(kv.trim()); if (!m) throw new Error('joint_kept: --k takes name=value[,name=value], not ' + kv); o.K[m[1]] = /^-?\d+(\.\d+)?$/.test(m[2]) ? +m[2] : m[2]; }
    }
    else if (a[i] === '--centre') o.centre = true;
    else if (a[i] === '--air') { o.air = a[++i]; if (o.air !== 'spaces' && o.air !== 'pocket') throw new Error('joint_kept: --air is spaces or pocket'); }
    else if (a[i] === '--jobs') o.jobs = Math.max(1, +a[++i] | 0);
    else if (a[i] === '--members') o.members = Math.max(1, +a[++i] | 0);
    else if (a[i] === '--tmax') o.tmax = Math.max(1, +a[++i]);
    else if (a[i] === '--out') o.out = a[++i];
    else throw new Error('joint_kept: unknown argument ' + a[i]);
  }
  // the window: 90 s under the spaces (D113: does she part at the surface; their implicit solve costs about 0.1 s a
  // step), 1,200 s under the pocket (to the bed)
  if (o.tmax === null) o.tmax = o.air === 'spaces' ? 90 : 1200;
  return o;
}
module.exports = { run, args, runMember };
if (isMainThread && require.main === module) run(args(process.argv.slice(2)), (s) => console.log(s)).then(() => process.exit(0), (e) => { console.error(e && e.stack || e); process.exit(1); });
