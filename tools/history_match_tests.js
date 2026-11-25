// The history-match harness's own mechanics (the calibration epoch, stage D; tools/history_match.js).
//   node tools/history_match_tests.js          (headless; about two minutes at BelowNormal)
// In the gate from join 17 (its row 'history_match', not quick): stage D has landed, and the mainline, the calibration's
// owner, ruled it in on 2026-11-23. It writes nothing under out/ but its own scratch folder,
// out/gate/history_match_tests (untracked), which it empties first.
// It tests the harness, not the model: no row here says anything about what the ledger keeps.
//   1  the hypercube is a hypercube: each input's bins hold one point each, and a seed gives the same design twice
//   2  the implausibility of a row exactly at its observation is 0 (every fitted row of the ledger, and a made row of
//      each form)
//   3  a one-sided row past its bound on the right side is 0, and on the wrong side is the miss over its variance
//   4  the cut-offs: 3 and 2.5; a group counts once, by its largest row
//   5  a run of 6 samples with --jobs 1 and with --jobs 2 gives the same records
//   6  a run cut off resumes to the same records (the progress file cut in the middle of a line), running only what
//      is missing
//   7  the maximin choice: its first is the one given, it repeats nothing, and it is the farthest-first order
//   8  the switches are set back: after the runs, the modules' defaults are as they were
//   9  the loose bands (Bo, 2026-11-21) are flags: --cut, --cut2, --tsigma, --band; the invariants' verdict; E-3's
//      option 1 and levelRate as the ledger and the core have them
'use strict';
const fs = require('fs');
const path = require('path');
const HM = require('./history_match.js');
const SC = require('../core/scenarios.js');
const C = require('../core/core.js');

const rows = []; let fails = 0;
function must(what, ok, detail) { rows.push((ok ? 'PASS  ' : 'FAIL  ') + what + (detail ? '   ' + detail : '')); if (!ok) fails++; console.log(rows[rows.length - 1]); }
const DIR = path.join(__dirname, '..', 'out', 'gate', 'history_match_tests');
fs.rmSync(DIR, { recursive: true, force: true });
process.env.TITANIC_OUT = path.join(DIR, 'out');                 // the kept set's file goes to the scratch folder, never out/

// ---------------------------------------------------------------- 1. the hypercube
{
  const n = 37, k = 9, u = HM.hypercube(n, k, 7);
  let ok = u.length === n && u.every(p => p.length === k && p.every(x => x >= 0 && x < 1));
  for (let j = 0; j < k && ok; j++) { const bins = new Array(n).fill(0); for (const p of u) bins[Math.floor(p[j] * n)]++; if (!bins.every(b => b === 1)) ok = false; }
  must('1 the hypercube: ' + n + ' points in ' + k + ' dimensions, each dimension\'s ' + n + ' bins hold one point each', ok);
  must('1 the same seed gives the same design, another seed another', JSON.stringify(u) === JSON.stringify(HM.hypercube(n, k, 7)) && JSON.stringify(u) !== JSON.stringify(HM.hypercube(n, k, 8)));
  const ins = HM.activeInputs(HM.CONFIG_D4), s = HM.sample(ins, 20, 1, null);
  must('1 every sampled value lies inside its input\'s range (' + ins.length + ' inputs with --d4, ' + HM.activeInputs(HM.CONFIG_TODAY).length + ' today: sideStrength needs sideOpenings)',
    s.every(x => ins.every(i => x[i.name] >= i.lo && x[i.name] <= i.hi)) && ins.length === HM.INPUTS.length && HM.activeInputs(HM.CONFIG_TODAY).length === HM.INPUTS.length - 1);
  const box = HM.boxOf(ins, s.slice(0, 3)), s2 = HM.sample(ins, 20, 2, box);
  must('1 a wave inside a box stays inside it', s2.every(x => ins.every(i => { const u0 = HM.toU(i, x[i.name]); return u0 >= box[i.name][0] - 1e-12 && u0 <= box[i.name][1] + 1e-12; })));
}

// ---------------------------------------------------------------- 2, 3. the implausibility
{
  const FIT = SC.RECORD_1912.filter(r => r.role === 'fit');
  // the ledger's reading of a row whose model is exactly the observation: a time at its value (or inside its
  // interval), a level reached at the row's own time, an angle at its value
  const exact = (row) => {
    const mid = row.sided === 'interval' ? 0.5 * (row.sigma[0] + row.sigma[1]) : row.value;
    if (row.kind === 'event' || row.kind === 'end') return { model: mid, reach: mid, late: 0 };
    if (row.kind === 'angle') return { model: mid, reach: null, late: null };
    return { model: row.value, reach: row.t, late: 0 };
  };
  const bad = FIT.filter(r => HM.implausibility(r, exact(r), 160).I !== 0).map(r => r.id);
  must('2 every fitted row of the ledger exactly at its observation: I = 0 (' + FIT.length + ' rows, ' + HM.GROUPS.length + ' groups)', bad.length === 0, bad.join(' '));
  const founder = FIT.find(r => r.id === 'founder'), If = HM.implausibility(founder, { model: 164, reach: 164, late: 4 }, 164);
  const den = Math.sqrt(4 * 4 + 1.35 * 1.35 + 0.06 * 0.06);
  must('2 the founder 4 min late: I = 4 / sqrt(4^2 + 1.35^2 + 0.06^2) = ' + (4 / den).toFixed(4) + ' (sigma, levelRate\'s disc, the noise floor)', Math.abs(If.I - 4 / den) < 1e-12 && Math.abs(If.den - den) < 1e-12, 'got ' + If.I.toFixed(4));
  // a made lower bound read in time: the sea at a place by T 40 to 45
  const lower = { id: 'x', kind: 'sea_at', sided: 'lower', sigma: null, disc: null, value: 0, t: 45, tLo: 40, tHi: 45, place: { x: 0, y: 0, z: 0 } };
  must('3 a lower bound met early (the model there at T 20, 20 min before the window): I = 0', HM.implausibility(lower, { model: 2, reach: 20, late: -20 }, 160).I === 0);
  must('3 the same bound met 10 min late: I = 10 / 5 = 2 (no sigma: 5 min, B1)', HM.implausibility(lower, { model: -1, reach: 55, late: 10 }, 160).I === 2);
  must('3 the same bound never met in a run that ends at T 160: I = (160 - 45) / 5 = 23 (B3)', HM.implausibility(lower, { model: -1, reach: null, late: null }, 160).I === 23);
  const upper = Object.assign({}, lower, { sided: 'upper' });
  must('3 an upper bound met late: I = 0; met 10 min early: 2', HM.implausibility(upper, { model: -1, reach: 55, late: 10 }, 160).I === 0 && HM.implausibility(upper, { model: 2, reach: 30, late: -10 }, 160).I === 2);
  const two = Object.assign({}, lower, { sided: 'two' });
  must('3 a two-sided mark 10 min early or 10 min late: 2 either way; inside its window: 0', HM.implausibility(two, { model: 0, reach: 30, late: -10 }, 160).I === 2 && HM.implausibility(two, { model: 0, reach: 55, late: 10 }, 160).I === 2 && HM.implausibility(two, { model: 0, reach: 42, late: 0 }, 160).I === 0);
  // one-sided rows in their own unit
  const ang = { id: 'a', kind: 'angle', sided: 'lower', sigma: 2, disc: null, value: 5, t: 10, tLo: 10, tHi: 10, place: { what: 'list' } };
  must('3 an angle as a lower bound: 7 against 5 is 0; 3 against 5 is 2 / 2 = 1', HM.implausibility(ang, { model: 7 }, 160).I === 0 && HM.implausibility(ang, { model: 3 }, 160).I === 1);
  const rowe = FIT.find(r => r.id === 'rowe_list');
  must('3 Rowe\'s list, an interval -9 to -3: -3 is 0; 0 is 3 / 3 = 1 (no sigma: 3 deg, B2); -12 is 1', HM.implausibility(rowe, { model: -3 }, 160).I === 0 && HM.implausibility(rowe, { model: 0 }, 160).I === 1 && HM.implausibility(rowe, { model: -12 }, 160).I === 1);
  const side = FIT.find(r => r.id === 'side_change');
  must('3 the change of side, an interval 85 to 110 min: 85 and 110 are 0; 120 is 10 / 5 = 2', HM.implausibility(side, { model: 85 }, 160).I === 0 && HM.implausibility(side, { model: 110 }, 160).I === 0 && HM.implausibility(side, { model: 120 }, 160).I === 2);
  // the row's own disc and noise, where the ledger has them
  const noisy = Object.assign({}, founder, { noise: 3, disc: { v: 0, why: '' } });
  must('3 a row\'s own noise is taken where the ledger has one: 5 min off at sigma 4, noise 3: 5 / 5 = 1', HM.implausibility(noisy, { model: 165 }, 165).I === 1);
}

// ---------------------------------------------------------------- 4. the cut-offs
{
  const k = (I) => HM.cutOf(I).kept;
  must('4 kept at (3, 2.5); not at (3.01, 0); not at (2.9, 2.6); kept at (2.9, 2.5, 2.5)', k({ a: 3, b: 2.5 }) && !k({ a: 3.01, b: 0 }) && !k({ a: 2.9, b: 2.6 }) && k({ a: 2.9, b: 2.5, c: 2.5 }));
  must('4 the worst group is named', HM.cutOf({ a: 1, b: 4, c: 2 }).worst === 'b' && HM.cutOf({ a: 1, b: 4, c: 2 }).second === 2);
  // a group counts once, by its largest row: two rows of one group, both far out, are one implausibility
  const run = { samples: [], events: [{ id: 'm1', t: 100 * 60 }, { id: 'm2', t: 100 * 60 }], founderT: 160 * 60, endT: 160 * 60, onsetT: null, pockets: [] };
  const ev = (id, mark, value) => ({ id, group: 'g', kind: 'event', role: 'fit', place: { mark }, value, unit: 'min', t: value, tLo: null, tHi: null, sided: 'two', sigma: 5, disc: null });
  const v = HM.verdict(run, [ev('r1', 'm1', 80), ev('r2', 'm2', 70)]);
  must('4 two rows of one group, 20 and 30 min out at sigma 5: one group, I = 6, the second largest 0', Object.keys(v.I).length === 1 && v.I.g === 6 && v.second === 0 && !v.kept);
}

// ---------------------------------------------------------------- 9. the loose bands as flags, and the invariants
{
  const o = HM.args([]);
  must('9 the defaults: --cut 3, --cut2 2.5, --tsigma 10, --band 150,170', o.cut === 3 && o.cut2 === 2.5 && o.tsigma === 10 && o.band.join() === '150,170');
  const p = HM.args(['--cut', '4', '--cut2', '3.5', '--tsigma', '15', '--band', '145,175']);
  must('9 the flags are read', p.cut === 4 && p.cut2 === 3.5 && p.tsigma === 15 && p.band.join() === '145,175');
  // parts as the progress keeps them: [group, d, sigma, disc, noise, time-like]
  const parts = { a: ['ga', 20, 5, 0, 0, 1], b: ['gb', 6, 3, 0, 0, 0], c: ['gc', 12, 4, 0, 0, 1] };
  const j0 = HM.judge(parts, { tsigma: 0, cut: 3, cut2: 2.5 }), j10 = HM.judge(parts, { tsigma: 10, cut: 3, cut2: 2.5 });
  must('9 --tsigma widens the time-like rows only: 20 min at sigma 5 is 4, at the floor of 10 it is 2; an angle 6 at sigma 3 stays 2; 12 min at sigma 4 is 3, then 1.2',
    j0.I.ga === 4 && j10.I.ga === 2 && j0.I.gb === 2 && j10.I.gb === 2 && j0.I.gc === 3 && j10.I.gc === 1.2 && !j0.kept && j10.kept);
  must('9 the same parts under looser cut-offs are kept with no floor (--cut 4, --cut2 3)', HM.judge(parts, { tsigma: 0, cut: 4, cut2: 3 }).kept && !HM.judge(parts, { tsigma: 0, cut: 4, cut2: 2.9 }).kept);
  const founder = SC.RECORD_1912.find(r => r.id === 'founder');
  must('9 the founder 10 min late under the floor: 10 / sqrt(10^2 + 1.35^2 + 0.06^2) = ' + (10 / Math.sqrt(100 + 1.35 * 1.35 + 0.0036)).toFixed(4), Math.abs(HM.implausibility(founder, { model: 170 }, 170, 10).I - 10 / Math.sqrt(100 + 1.35 * 1.35 + 0.0036)) < 1e-12);
  // the invariants: a record in which every case is as wanted
  const good = { cases: Object.fromEntries(HM.INVARIANTS.map(c => [c.id, { founder: c.want === 'float' ? null : 200, cons: 1e-9 }])) };
  const flip = (id, ch) => ({ cases: Object.assign({}, good.cases, { [id]: Object.assign({}, good.cases[id], ch) }) });
  must('9 the invariants hold when the floating cases float, the sinking ones sink and the slower one is slower', HM.invariantsOf(good, 160).ok);
  must('9 a floating case that sinks fails by its name; a sinking one that floats; a case that does not conserve its water',
    HM.invariantsOf(flip('four', { founder: 500 }), 160).failed.join() === 'four' && HM.invariantsOf(flip('five', { founder: null }), 160).failed.join() === 'five' && HM.invariantsOf(flip('hawke', { cons: 2e-5 }), 160).failed.join() === 'hawke:water');
  must('9 without boiler room 5\'s seam she must founder later than the set\'s own 1912 run', !HM.invariantsOf(good, 200).ok && !HM.invariantsOf(flip('titanicNoBR5', { founder: null }), 160).ok);
  must('9 the binding cases are the design\'s (section 9 (1)); the bulkheads to B deck and the doors left open bind their water only (D75; B19)', HM.INVARIANTS.filter(c => c.want !== 'conserve').map(c => c.id).join() === 'four,five,hawke,britannic,britannicClosed,titanicFour,titanicD,titanicNoBR5' && HM.INVARIANTS.filter(c => c.want === 'conserve').map(c => c.id).join() === 'titanicB,titanicDoors');
  const fit = SC.RECORD_1912.filter(r => r.role === 'fit').map(r => r.id), held = SC.RECORD_1912.filter(r => r.role !== 'fit').map(r => r.id);
  must('9 E-3 option 1 is the ledger as it stands: Rowe\'s list and the change of side are fitted (band A); Halpern\'s list points are not', fit.indexOf('rowe_list') >= 0 && fit.indexOf('side_change') >= 0 && ['symons_list_85', 'halpern_list_100', 'halpern_list_130', 'halpern_list_145'].every(id => held.indexOf(id) >= 0));
  must('9 levelRate is not sampled and stands at 2 a second', !HM.INPUTS.some(i => i.name === 'levelRate') && C.DEFAULT_PARAMS.levelRate === 2);
}

// ---------------------------------------------------------------- 10. stage D's step 1 (Bo, 2026-11-23): B17, B18, B19
{
  const W6 = require('./w6_record.js'), L6 = W6.LIMITS;
  const ok = { full: 20 * 60, dryMax: 5, burst: 60 * 60, after: 500 };
  const v = (ch) => W6.verdict(Object.assign({}, ok, ch));
  must('10 B17: Barrett\'s three rows (tools/w6_record.js, one place for their numbers): a bunker full at T 20, the stokehold at 5 m3, giving way at T 60 passes',
    v({}).ok && L6.fullBy === 1800 && L6.stokeholdMax === 20 && L6.burst[0] === 3000 && L6.burst[1] === 4500);
  must('10   ... full at T 31 fails "fills"; the stokehold at 20 m3 fails "workable"; giving way at T 49 or T 76, or with the stokehold then at 150 m3, fails "burst"; no bunker fails all',
    !v({ full: 31 * 60 }).fills && !v({ dryMax: 20 }).workable && !v({ burst: 49 * 60 }).burst && !v({ burst: 76 * 60 }).burst && !v({ after: 150 }).burst && !W6.verdict({ full: null, dryMax: Infinity, burst: null, after: null }).ok);
  // B18: a made table of four members; the split is held at 0 (its range's end), so it is not an edge
  const inputs = HM.INPUTS.map(i => ({ name: i.name, lo: i.lo, hi: i.hi, scale: i.scale || 'linear' }));
  const mid = (over) => Object.assign(Object.fromEntries(HM.INPUTS.map(i => [i.name, HM.fromU(i, 0.5)])), over);
  const table = { band: [150, 170], inputs, members: [
    { inputs: mid({ split: 0.003 }), maxI: 1.5, watchFounder: 160 },                      // the split at its end: kept, held to 0
    { inputs: mid({ area: HM.INPUTS[0].hi }), maxI: 0.5, watchFounder: 160 },              // the opening at its end: out
    { inputs: mid({ split: 0.4, aDown: 0.2123456789 }), maxI: 1.0, watchFounder: 165 },  // best kept: rounded to four figures
    { inputs: mid({}), maxI: 0.8, watchFounder: 169.9 },                                    // 0.1 min from the band's wall: out
  ] };
  const cs = HM.candidates(table, 5);
  must('10 B18: the landing rule leaves out the opening at its range\'s end and the watch 0.1 min from the band\'s wall, keeps the split at its end (held), orders by largest I, holds the split at 0 and rounds the rest to four figures',
    cs.length === 2 && cs[0].aDown === 0.2123 && cs[0].split === 0 && cs[1].split === 0 && HM.EDGE === 0.02 && HM.BAND_IN === 0.2, JSON.stringify(cs.map(c => [c.split, c.aDown])));
  // B19: the two water-only cases bind their water and not their verdict
  const good = { cases: Object.fromEntries(HM.INVARIANTS.map(c => [c.id, { founder: c.want === 'float' ? null : 200, cons: 1e-9 }])) };
  const set = (id, ch) => ({ cases: Object.assign({}, good.cases, { [id]: Object.assign({}, good.cases[id], ch) }) });
  must('10 B19: the bulkheads to B deck afloat or sunk is no failure; its water leaking 2e-5 m3 is',
    HM.invariantsOf(set('titanicB', { founder: null }), 160).ok && HM.invariantsOf(set('titanicB', { founder: 300 }), 160).ok && HM.invariantsOf(set('titanicB', { cons: 2e-5 }), 160).failed.join() === 'titanicB:water');
}

// ---------------------------------------------------------------- 7. maximin
{
  const pts = [[0, 0], [0.1, 0], [1, 1], [0.5, 0.5], [1, 0], [0.11, 0]];
  const c = HM.maximin(pts, 4, 0);
  must('7 maximin: starts at the one given, then the farthest, then the farthest from both (0, 2, 4, 3)', JSON.stringify(c) === '[0,2,4,3]', JSON.stringify(c));
  must('7 asked for more than there are: every one once', HM.maximin(pts, 30, 0).slice().sort().join() === '0,1,2,3,4,5');
}

// ---------------------------------------------------------------- 5, 6, 8. the runs
(async () => {
  const Mo = require('../core/motion.js'), Sys = require('../core/systems.js'), E = require('../core/encounter.js'), N16 = require('../core/night.js');
  const before = JSON.stringify([Mo.SHIP.massPockets, Sys.PLANT.leadRule, E.ICE.alpha, E.ICE.openAlong, E.ICE.bunkerOpen, C.DEFAULT_PARAMS]);
  const opts = (state, jobs, more) => Object.assign(HM.args(['--n1', '6', '--n2', '0', '--n3', '0', '--jobs', String(jobs), '--state', path.join(DIR, state)]), more || {});
  const strip = (recs) => JSON.stringify(recs);
  const a = await HM.run(opts('one', 1));
  const b = await HM.run(opts('two', 2));
  must('5 six samples with --jobs 1 and with --jobs 2: the same records (' + a.records.length + ' each; founders ' + a.records.map(r => r.founder.toFixed(1)).join(' ') + ')', a.records.length === 6 && strip(a.records) === strip(b.records));
  const sorted = (file) => fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map(l => { const o = JSON.parse(l); delete o.ms; return JSON.stringify(o); }).sort().join('\n');
  must('5 every one of them conserves its water step by step within ' + HM.CONS_TOL + ' m3 (the worst ' + Math.max(...a.records.map(r => Math.abs(r.cons))).toExponential(1) + ')', a.records.every(r => r.conserved && Math.abs(r.cons) <= HM.CONS_TOL));
  must('5 and the same lines in the progress, but for their order and their timings', sorted(a.file) === sorted(b.file));
  // 6: cut the two-thread progress after its third line, in the middle of the fourth, and resume on one thread
  const whole = fs.readFileSync(b.file, 'utf8'), ls = whole.split('\n').filter(Boolean);
  fs.writeFileSync(b.file, ls.slice(0, 3).join('\n') + '\n' + ls[3].slice(0, Math.floor(ls[3].length / 2)));
  const said = [], c = await HM.run(opts('two', 1), (s) => said.push(s));
  must('6 resumed after a cut: the same records', strip(c.records) === strip(a.records));
  must('6 only the three missing runs were made (the line cut off among them)', said.some(s => /wave 1: 6 sets .*\(3 run now/.test(s)), said.find(s => /^wave 1/.test(s)));
  must('6 the progress after the resume holds the six runs, each once whole', (() => { const keys = fs.readFileSync(c.file, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l).key; } catch (e) { return null; } }).filter(Boolean); return keys.length === 6 && new Set(keys).size === 6; })());
  const d = await HM.run(opts('two', 2), (s) => said.push(s));
  must('6 a run with everything there makes none and gives the same records', strip(d.records) === strip(a.records) && said.some(s => /wave 1: 6 sets .*\(0 run now/.test(s)));
  // 8: a --d4 run in this thread (one sample), then the modules as they were
  const e = await HM.run(Object.assign(opts('d4', 1), { n1: 1, d4: true }));
  must('8 after the runs (today\'s and one with --d4, in this thread): SHIP.massPockets, PLANT.leadRule, ICE.alpha, ICE.openAlong, ICE.bunkerOpen and the core\'s default params as before',
    JSON.stringify([Mo.SHIP.massPockets, Sys.PLANT.leadRule, E.ICE.alpha, E.ICE.openAlong, E.ICE.bunkerOpen, C.DEFAULT_PARAMS]) === before && e.records.length === 1);
  must('8 a --d4 run is another record than today\'s at the same inputs (its key names the switches)', e.records[0].key.indexOf('massPockets1,leadRule1,weighOverfill0,g11Doors0,sideOpenings1,hullEnds1') > 0);
  must('10 B17: every preset record carries Barrett\'s reading and its verdict (barrett), and a set kept has it true', a.records.every(r => r.w6 && typeof r.barrett === 'boolean' && (!r.kept || r.barrett)));
  // B16: the encounter's fixed point sees the run's own params: at the same alpha, GM0 0.6 and 1.0 open her differently
  const R = require('./encounter_run.js'), G = Object.assign({ portAround: 0 }, N16.GEOM_1912), sh = C.buildShip();
  const open = (gm) => { const s = E.summary(R.encounter(Object.assign({}, G, { params: { GM0: gm } }), sh)); return s.stbd.area + s.port.area; };
  const o6 = open(0.6), o10 = open(1.0), o0 = (() => { const s = E.summary(R.encounter(G, sh)); return s.stbd.area + s.port.area; })(), oD = open(C.DEFAULT_PARAMS.GM0);
  must('10 B16: tools/encounter_run.js runs the encounter at the params it is given (GM0 0.6 against 1.0 opens ' + o6.toFixed(4) + ' against ' + o10.toFixed(4) + ' m2); none given is the defaults, to the bit', o6 !== o10 && o0 === oD);
  const oB = (() => { const s = E.summary(R.encounter(Object.assign({}, G, { ice: { bunkerOpen: 0.01144 } }), sh)); return s.stbd.area + s.port.area; })();
  must('10 B16: a bunker opening given to the encounter moves the whole opening at the same alpha (' + o0.toFixed(4) + ' m2 without, ' + oB.toFixed(4) + ' with 0.01144), so the fixed point must be found with it', Math.abs(oB - o0) > 0.01);
  // the gate's form (tools/gate.js reads a line that begins PASS: or FAIL:), since this suite is a gate row (join 17)
  console.log(fails ? 'FAIL: history match tests: ' + fails + ' row(s) failed' : 'PASS: history match tests: all ' + rows.length + ' rows');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
