// The history match of the calibration epoch's stage D (D3; docs/DESIGN_calibration_epoch_v1_1_2026-11-21.md, section 5):
// keep every parameter set the observation ledger cannot rule out. A TOOL ONLY: it changes no default in core/, moves no
// frozen reference and turns nothing on. Every switch and every module-level number it moves is set inside one run and
// set back after it (configured(), below).
//
//   node tools/history_match.js [--n1 N] [--n2 N] [--n3 N] [--jobs N] [--seed S] [--d4] [--dry] [--state DIR] [--fresh] [--pick N] [--force3]
//     --n1 N      wave 1: a Latin hypercube of N points over the inputs, the 1912 damage preset (default 40: a quick look;
//                 the design's run is 2,000)
//     --n2 N      wave 2: the same inside the box of wave 1's kept sets (default 0; the design's 2,000)
//     --n3 N      wave 3: the 1912 watch on up to N kept sets (default 4; the design's 200)
//     --jobs N    worker threads (default 6); the records are the same with one or many
//     --seed S    the hypercubes' seed (default 1); wave 2 draws from S + 1
//     --d4        the landing's switches (CONFIG_D4) in place of today's, all off (CONFIG_TODAY)
//     --dry       print the plan and its estimated time; run nothing
//     --state DIR where the progress is kept, a run a line, so that a run cut off resumes (default out/gate/history_match,
//                 untracked); --fresh sets aside what is there
//     --pick N    wave 4's size (default 30, the design's)
//     --cut X     the cut-off on a set's largest implausibility (default 3); --cut2 X on its second largest (default 2.5)
//     --tsigma M  every time-like row's sigma is at least M minutes (default 10: Bo's loose fit); 0 gives the ledger's own
//     --band LO,HI  the band of the watch's founder, minutes after the touch (default 150,170; D73's was 157,160)
//                 The four change no run: the progress keeps each row's miss and variances, and the verdicts are made
//                 from them at every call, so a looser or tighter reading costs nothing
//     --force3    when nothing is kept, run wave 3 all the same on the N least implausible sets: a trial of the wave's
//                 mechanics and its time. Those sets are not kept, and nothing is picked from them
//     --candidates N FILE  no runs: the landing rule (candidates(), below) on out/kept_1912.json, its best N written to
//                 FILE as sets, held inputs at their held values and the rest to four figures
//     --sets FILE a JSON array of sets (each input by name) run in place of wave 1's hypercube, every one kept on to the
//                 watch and the invariants: the candidates' rerun. With it, set TITANIC_OUT so that out/kept_1912.json
//                 is not overwritten
//
// Wave 1 and 2 (the preset): each run is sampled every 5 s by core/readers/ledger.js and read against the rows of
// core/scenarios.js RECORD_1912 whose role is 'fit'. Each group's implausibility is its rows' largest (the design, 5.1):
//     I = d / sqrt(sigma^2 + disc^2 + noise^2)
// d is the miss, one-sided where the row is. A row is read in TIME when it is a time (an event, the end) or a level at a
// place (the sea at a mark, a sounding, a tonnage): d is then the minutes by which the model reaches the witness's level
// outside the row's window, tLo to tHi (the ledger's `late`); a lower bound misses only late, an upper bound only early.
// A row read in its own unit (an angle, or any row whose sigma is a number in that unit) takes the distance of the model
// at the row's time from the value, or from the interval. A set is KEPT when its largest I over the fitted groups is at
// most --cut and its second largest at most --cut2, and its water is conserved (a hard filter: every run's water aboard
// against its inflow summed less what was pumped, step by step, within 1e-5 m3, as tools/conserve_tests.js holds it).
// Wave 3 (the watch): for a kept set, the encounter's area constant at its opening (the fixed point of
// tools/calibrate.js's alphaFor, here on the configuration's own ship and split) and one 1912 watch with the set's
// numbers; its founder must lie in --band, or the set leaves the kept set.
// Wave 3b (the invariants, hard filters and not scores): on each set still kept, the validation cases whose verdicts
// bind (INVARIANTS): the floating ones float, the sinking ones sink, each conserving its water; or the set leaves.
// Wave 4: PICK of the sets left by a maximin design over the inputs, each on [0, 1] across its range, written to
// out/kept_1912.json (through tools/outdir.js), named by a hash of core/'s files and of the ledger.
//
// The harness's own bets (every [bet] below, in one place):
//   B1  a time-like row with no sigma takes 5 min (SIGMA_BET.min) [bet: the design, 5.2: the smaller of auditor E's 5 to
//       10 min]; an interval row (Wheat's stair, the change of side) is read as the distance outside its interval over
//       that same 5 min
//   B2  an angle with no numeric sigma (Rowe's list, an interval) takes 3 deg, the old score's sigma on a list
//       (SIGMA_BET.list); a trim would take 0.5 deg (no fitted row is one today)
//   B3  a level the model never reaches is as late as the run's end
//   B4  the second-largest cut-off, 2.5 [bet: the design, 5.1]
//   B5  bunkerOpen is drawn evenly in its logarithm: its range is 28 to 1, and the burst's time moves with its ratio
//       (BACKLOG G22: T 56 at 0.085, 63 at 0.03, 121 at 0.01, 171 at 0.003)
//   B6  on the watch the split's blend scales each region's factor of ICE.openAlong by its share's ratio; the area
//       constant's fixed point then sets the whole opening. The shares on the watch follow the blend to first order,
//       not exactly (a region's opening also depends on its dents)
//   B7  wave 2's box is the kept sets' bounding box widened by 5 % of each input's range on either side (BOX_PAD): the
//       box of a finite sample is inside the kept region's own
//   B8  the watch is run once, as it is (with leadRule 0 it is G18's bimodal watch: one branch, not calibrate.js's two)
//   B9  the founder's disc 1.35 min is the ledger's own bet (the smaller of levelRate's two effects)
//   B10 --dry's times when the progress holds no timings of its own: COST, measured on this laptop at BelowNormal
//   B11 the bands' widths are Bo's "say": 10 min on a time-like row, 150 to 170 on the watch's founder; an angle keeps
//       its own sigma (B2), since a list is not a time
//   B12 conservation is held to 1e-5 m3 absolute, the suite's own tolerance, not to a share of the run's water
//   B13 "without boiler room 5's seam, slower" is read as: founders, and later than the same set's 1912 preset
//   B14 the invariants are run on the sets whose watch is in the band, not on every kept set: the same sets come out
//       (each filter is a yes or no on one set) and the cheaper filter goes first; with a floating case's margin not
//       scored, an edge (Britannic's ports shut, 0.78 m) is in or out by its sign alone
//   B15 the coal list (coalListDeg) is the scenario's, not a param: the preset's build sets 2.0 and createSim takes the
//       scenario's over the params', so it goes on the built scenario (the preset, the 1912 cases), on the watch's spec
//       and on the encounter that finds the area constant. The encounter's fixed point runs at the core's default
//       params (GM0 among them), as tools/calibrate.js's alphaFor does, so its heel before the touch is the set's coal
//       list at the default GM0: the watch's opening then differs from the set's by the heel's second-order effect.
//       NOT SO (B16, below): the effect was about 9 %, not second-order
//   B16 (2026-11-23, Bo's step 1) the encounter's fixed point runs with the set's own bunker opening and its own params
//       (tools/encounter_run.js takes o.params). The first match's fixed point had neither: given to the watch only, the
//       bunker opening fixed the bunker region's share there, so the rest of her side opened alpha's share of less than
//       the set's area (#1's watch about 1.0 m2 for 1.099, alpha 0.326 against the true 0.357) and founded late. The
//       params alone move the opening by about 1 % (history_match_tests row 10: GM0 0.6 against 1.0)
//   B17 (D87) Barrett's three rows of the bunker (tools/w6_record.js, read as tools/pocket_tests.js reads them) are
//       hard filters on the preset in wave 1: it fills within 30 min, boiler room 5's stokehold stays under 20 m3 while
//       it holds, and it gives way within T 50 to 75 with the stokehold then flooded. A set that fails one is not kept
//   B18 (D85) the split is held at Hackett and Bedford's (0) when a member lands, and the landing's edge test leaves a
//       held input out (its held value is its range's end)
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
try { os.setPriority(0, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch (e) { /* as it is */ }
const C = require('../core/core.js');
const SC = require('../core/scenarios.js');
const L = require('../core/readers/ledger.js');
const W6 = require('./w6_record.js');

// ------------------------------------------------------------------ the inputs and their ranges, each with its source
// to: 'area', 'split', 'bunkerOpen' go to the preset's build (and, on the watch, to the encounter); 'params' to the sim.
// scale 'log': drawn evenly in its logarithm (B5). needs: the switch without which the input moves nothing, so that it
// is sampled only in a configuration that has it.
const INPUTS = [
  { name: 'area', lo: 0.75, hi: 1.115, to: 'area', src: 'Cd x A, sampled as the opening at CdBreach 0.6: from the old fit\'s 0.7506 m2 to Wilding\'s 12 sq ft, 1.115 m2 (D73; e103; the design, section 4)' },
  { name: 'bunkerBurst', lo: 3.5, hi: 14.3, to: 'params', src: 'D82 a: the bunker\'s after wall bears 4.5 to 6.0 m of head, 8.5 if stiffened; W6\'s 13 m above (e104); sampled jointly with bunkerOpen' },
  { name: 'bunkerOpen', lo: 0.003, hi: 0.085, to: 'bunkerOpen', scale: 'log', src: 'D82 a: one deck-hose stream, 0.003 m2, to Hackett and Bedford\'s share, 0.085 m2 (core/scenarios.js, C6)' },
  { name: 'aDown', lo: 0.14, hi: 0.42, to: 'params', src: 'half of D69\'s base either way (e103)' },
  { name: 'fOpen', lo: 0.0103, hi: 0.031, to: 'params', src: 'half of D69\'s base either way (e103)' },
  { name: 'split', lo: 0, hi: 1, to: 'split', held: 0, src: 'Hackett and Bedford\'s split (0) to the gate\'s (1), the shares blended (e103); held at 0 when a member lands (D85: G6b\'s factors stay valid), so the landing\'s edge test leaves it out (B18)' },
  { name: 'GM0', lo: 0.6, hi: 1.0, to: 'params', src: 'Hackett and Bedford\'s 0.80 m [bet: e103\'s range]' },
  { name: 'zMergeHold', lo: 3.4, hi: 6.0, to: 'params', src: 'D64: the firemen\'s tunnel\'s top' },
  { name: 'peakVent', lo: 0.004, hi: 0.016, to: 'params', src: 'G7: half to twice [bet: e103\'s range]' },
  { name: 'sideStrength', lo: 0.1, hi: 1, to: 'params', needs: 'sideOpenings', src: 'C4: a multiplier on the strengths of the openings in her side, each a bet from plate theory' },
  { name: 'coalListDeg', lo: 0.5, hi: 3, to: 'scen', src: 'her list to port before the collision, 2.0 deg in the preset (Beesley; Halpern): 0.5 to 3 [bet: e103\'s 1 to 3, opened to "a slight list" below, since the smoke\'s sets that meet the change of side lie at 1.2 to 1.9, near 1]. e103 read 0 for it because it set params.coalListDeg, which the preset\'s own 2.0 overrides (an erratum, the mainline 11-21); it is the lever on the change of side, which ruled out every set without it (B15)' },
];
// Not sampled. levelRate enters as the founder's disc (the design, 5.2; the ledger's row). The rest stand at their
// defaults: e103's screen ranked them low, or (wMul) G11's widths made them a multiplier on sourced numbers.
const FROZEN = ['levelRate (the founder\'s disc)', 'wMul', 'axHold', 'CdDoor', 'Cweir', 'bunkerLeak', 'pumpAbandon'];

// ------------------------------------------------------------------ the configuration: which stage C switches a run uses
const CONFIG_TODAY = { massPockets: 0, leadRule: 0, weighOverfill: 1, g11Doors: 1, sideOpenings: 0, hullEnds: 0 };
const CONFIG_D4 = { massPockets: 1, leadRule: 1, weighOverfill: 0, g11Doors: 0, sideOpenings: 1, hullEnds: 1 };
const cfgKey = (cfg) => Object.keys(CONFIG_TODAY).map(k => k + (cfg[k] ? 1 : 0)).join(',');
const activeInputs = (cfg) => INPUTS.filter(i => !i.needs || cfg[i.needs]);

// ------------------------------------------------------------------ the cut-offs and the variances
// Bo's answers to stage D's questions (through the mainline, 2026-11-21): the fit is LOOSE to the record and weighs
// physics, dynamics and invariants over minutes ("It doesn't have to be precise to the minute ... historically, we only
// have one exact data point"). So the bands are wide and are flags: every time-like row's sigma is at least TSIGMA
// (--tsigma), the founder's with them; the watch's founder is held to BAND (--band), 150 to 170 where D73 had 157 to
// 160; the cut-offs are --cut and --cut2. The invariants are hard filters, not scores (INVARIANTS, below). E-3 is option
// 1: the list scores by D62's band A (Rowe's list, the change of side) and Halpern's points are held out, which is the
// ledger's roles as they stand. levelRate stays a named bet at 2 a second, and is not sampled.
const CUT = { max: 3, second: 2.5 };                 // the defaults of --cut and --cut2: the design, 5.1; the second is B4
const TSIGMA = 10;                                   // min: the default of --tsigma [Bo: "say, sigma at least 10 min"]
const SIGMA_BET = { min: 5, list: 3, trim: 0.5 };    // B1, B2 (the 5 min lies under TSIGMA's floor unless --tsigma is less)
const NOISE_FOUNDER = 0.06;                          // min: A-3's floor, 3.5 s of founder for a last bit [measured: auditor A]
const BAND = [150, 170];                             // the default of --band: the watch's founder, min after the touch
const CONS_TOL = 1e-5;                               // m3: tools/conserve_tests.js's tolerance, step by step
const BOX_PAD = 0.05;                                // B7
const EVERY = 20, T_MAX = 5 * 3600;                  // the ledger's sampling, every 5 s; the preset's longest run
const EVAL_VERSION = 4;                              // bump when what a run's record is changes: it names the progress file (3: the coal list sampled, B15; 4: the encounter at the set's params, B16, and Barrett's rows kept, B17)
// The invariants: the validation cases whose verdicts bind (the design, section 9 (1); tools/validate.js builds them the
// same way). `ice`: the case is the set's own 1912 damage (its opening, split and bunker) with one thing changed; the
// others are their own damage on the set's numbers. want: 'float', 'sink', or 'later' (founders, and after the set's own
// 1912 founder). The bulkheads to B deck and the doors left open are reported and do not bind (D75): run for their
// water alone ('conserve', B19).
const INVARIANTS = [
  { id: 'four', want: 'float', what: 'four forward compartments (Wilding: floats)' },
  { id: 'five', want: 'sink', what: 'five forward compartments (Wilding: sinks)' },
  { id: 'hawke', want: 'float', what: 'Olympic and the Hawke (returned to port)' },
  { id: 'britannic', want: 'sink', what: 'Britannic 1916' },
  { id: 'britannicClosed', want: 'float', what: 'Britannic, her ports shut' },
  { id: 'titanicFour', want: 'float', ice: 1, what: 'the 1912 damage stopping at hold 3' },
  { id: 'titanicD', want: 'sink', ice: 1, what: 'the 1912 damage, the bulkheads to D deck: no help (Wilding)' },
  { id: 'titanicNoBR5', want: 'later', ice: 1, what: 'the 1912 damage without boiler room 5\'s seam: slower' },
  // B19 (2026-11-23, step 1d): the two reported cases (D75: their verdicts do not bind) are run for their water alone,
  // so that every validation case's conservation is a hard filter, as tools/conserve_tests.js holds it for the landed
  // numbers. e114 found the fault that the bulkheads-to-D case met: the bunker's flows while it fills with water on
  // both sides of its door; until it is mended, a set that meets it is not kept
  { id: 'titanicB', want: 'conserve', ice: 1, what: 'the 1912 damage, all bulkheads to B deck (its water only)' },
  { id: 'titanicDoors', want: 'conserve', ice: 1, what: 'the 1912 damage, the watertight doors left open (its water only)' },
];
// B10: s a preset run (2.3 with today's switches, 3.2 with --d4), s a watch with its fixed point (3 to 4 turns of the
// encounter; 3.4 to 4.5) [measured: 12 runs and 2 watches of each, two threads, BelowNormal, 2026-11-21]; par: a thread's
// worth among six on eight cores [bet]
// cases: the eight binding validation cases on one set, 35 s with today's switches, 70 s with --d4 [measured: 2 of each]
const COST = { preset: 3.2, watch: 5, cases: 90, par: 0.7 };   // cases: 70 s for the eight, and B19's two [bet: 90]
const ROOT = path.join(__dirname, '..');
const ROWS = SC.RECORD_1912, FIT = ROWS.filter(r => r.role === 'fit');
const GROUPS = FIT.map(r => r.group).filter((g, i, a) => a.indexOf(g) === i);

// one row's implausibility from the ledger's reading of it (ev: L.evaluate(row, run); endMin: the run's end, minutes)
const timeLike = (row) => row.kind === 'event' || row.kind === 'end' || (row.kind !== 'angle' && typeof row.sigma !== 'number');
function implausibility(row, ev, endMin, floor) {
  let d, sigma;
  floor = floor || 0;
  const oneSided = (x) => (row.sided === 'lower' ? Math.max(0, x) : row.sided === 'upper' ? Math.max(0, -x) : Math.abs(x));
  if (row.kind === 'event' || row.kind === 'end') {                  // the model is a time
    if (row.sided === 'interval') d = ev.model < row.sigma[0] ? row.sigma[0] - ev.model : (ev.model > row.sigma[1] ? ev.model - row.sigma[1] : 0);
    else d = row.sided === 'lower' ? Math.max(0, row.value - ev.model) : row.sided === 'upper' ? Math.max(0, ev.model - row.value) : Math.abs(ev.model - row.value);
    sigma = typeof row.sigma === 'number' ? row.sigma : SIGMA_BET.min;
  } else if (timeLike(row)) {                                        // a level at a place, read in time: minutes outside the window
    const tHi = row.tHi === null ? row.t : row.tHi;
    const late = ev.reach === null || ev.late === null ? Math.max(0, endMin - tHi) : ev.late;   // B3
    d = oneSided(late);                                              // a lower bound: at the level by the window's end; early is no miss
    sigma = SIGMA_BET.min;
  } else {                                                           // in the row's own unit, at the row's time
    if (row.sided === 'interval') d = ev.model < row.sigma[0] ? row.sigma[0] - ev.model : (ev.model > row.sigma[1] ? ev.model - row.sigma[1] : 0);
    else d = row.sided === 'lower' ? Math.max(0, row.value - ev.model) : row.sided === 'upper' ? Math.max(0, ev.model - row.value) : Math.abs(ev.model - row.value);
    sigma = typeof row.sigma === 'number' ? row.sigma : (row.kind === 'angle' ? (row.place.what === 'trim' ? SIGMA_BET.trim : SIGMA_BET.list) : NaN);
  }
  const disc = row.disc && typeof row.disc.v === 'number' ? row.disc.v : 0;
  const noise = typeof row.noise === 'number' ? row.noise : (row.id === 'founder' ? NOISE_FOUNDER : 0);
  const time = timeLike(row);
  if (time && floor > sigma) sigma = floor;                          // --tsigma: a time-like row's sigma is at least this
  const den = Math.sqrt(sigma * sigma + disc * disc + noise * noise);
  return { d, sigma, disc, noise, time, den, I: d === 0 ? 0 : d / den };
}
// a run's fitted rows as plain numbers, which is what the progress keeps, so that the bands and the cut-offs can be
// changed without running anything again: { id: [group, d, sigma, disc, noise, time-like 1 or 0] }
function partsOf(run, rows) {
  const fit = (rows || ROWS).filter(r => r.role === 'fit'), endMin = (run.founderT !== null ? run.founderT : run.endT) / 60, parts = {};
  for (const row of fit) { const x = implausibility(row, L.evaluate(row, run), endMin); parts[row.id] = [row.group, x.d, x.sigma, x.disc, x.noise, x.time ? 1 : 0]; }
  return parts;
}
// every fitted group's implausibility (its rows' largest) under the bands and the cut-offs of o ({ tsigma, cut, cut2 })
function judge(parts, o) {
  const I = {}, ts = o && o.tsigma !== undefined ? o.tsigma : 0;
  for (const id of Object.keys(parts)) {
    const [g, d, s0, disc, noise, time] = parts[id], s = time && ts > s0 ? ts : s0, x = d === 0 ? 0 : d / Math.sqrt(s * s + disc * disc + noise * noise);
    if (!(I[g] >= x)) I[g] = x;
  }
  return Object.assign({ I }, cutOf(I, o));
}
const verdict = (run, rows, o) => judge(partsOf(run, rows), o);
function cutOf(I, o) {
  const s = Object.keys(I).sort((a, b) => I[b] - I[a] || (a < b ? -1 : 1));
  const max = s.length ? I[s[0]] : 0, second = s.length > 1 ? I[s[1]] : 0;
  const c1 = o && o.cut !== undefined ? o.cut : CUT.max, c2 = o && o.cut2 !== undefined ? o.cut2 : CUT.second;
  return { worst: s[0] || null, max, second, kept: max <= c1 && second <= c2 };
}
// the invariants' verdict on a `cases` record: every binding case as wanted, and each conserving its water
function invariantsOf(rec, founder1912) {
  const failed = [];
  for (const c of INVARIANTS) {
    const r = rec.cases[c.id], sank = r.founder !== null;
    if (c.want !== 'conserve' && (c.want === 'float' ? sank : c.want === 'sink' ? !sank : !(sank && r.founder > founder1912))) failed.push(c.id);
    if (!(Math.abs(r.cons) <= CONS_TOL)) failed.push(c.id + ':water');
  }
  return { ok: failed.length === 0, failed };
}

// ------------------------------------------------------------------ one run, inside a thread
// The switches of a configuration that live in modules are set for the run and set back after it; the others go into
// the run's own params and its own ship. Nothing is left changed.
function evaluator() {
  const Mo = require('../core/motion.js'), Sys = require('../core/systems.js');
  const ships = {};
  const shipOf = (cfg) => { const k = cfg.hullEnds ? 1 : 0; return ships[k] || (ships[k] = k ? C.buildShip({ hullEnds: 1 }) : C.buildShip()); };
  function configured(cfg, fn) {
    const keep = [Mo.SHIP.massPockets, Sys.PLANT.leadRule];
    Mo.SHIP.massPockets = cfg.massPockets ? 1 : 0; Sys.PLANT.leadRule = cfg.leadRule ? 1 : 0;
    try { return fn(); } finally { Mo.SHIP.massPockets = keep[0]; Sys.PLANT.leadRule = keep[1]; }
  }
  const blend = (t) => SC.TITANIC_SPLIT.map((s, i) => Object.assign({}, s, { f: (1 - t) * s.f + t * SC.TITANIC_SPLIT_GATE[i].f }));
  function paramsOf(cfg, x) {
    const p = { weighOverfill: cfg.weighOverfill ? 1 : 0, g11Doors: cfg.g11Doors ? 1 : 0, sideOpenings: cfg.sideOpenings ? 1 : 0 };
    for (const i of activeInputs(cfg)) if (i.to === 'params') p[i.name] = x[i.name];
    return p;
  }
  // the set's 1912 damage as the preset builds it, with the set's coal list on it (B15)
  function built1912(x) {
    const scen = { areaTitanic: x.area, bunkerOpen: x.bunkerOpen };
    if (x.split !== 0) scen.split = blend(x.split);
    const s = SC.PRESETS.titanic.build(scen);
    if (x.coalListDeg !== undefined) s.coalListDeg = x.coalListDeg;
    return s;
  }
  function preset(cfg, x) {
    const sim = C.createSim(shipOf(cfg), paramsOf(cfg, x), built1912(x)), run = L.start(sim);
    L.take(run, sim);
    const W0 = water(sim), b6 = W6.tracker(sim);                    // B17: Barrett's three rows (D87)
    for (let k = 1; !sim.foundered && sim.t < T_MAX; k++) { C.step(sim); W0.after(sim); b6.step(); if (k % EVERY === 0 || sim.foundered) L.take(run, sim); }
    L.close(run, sim, { onsetT: null });
    return { founder: sim.foundered ? sim.founderT / 60 : 300, cons: W0.worst, parts: partsOf(run), w6: b6.result() };
  }
  // conservation, as tools/conserve_tests.js holds it: after every step, her water (the spaces' and the pockets') against
  // the inflow summed less what the pumps put over the side; `worst` is the largest difference of the run (m3, signed)
  function water(sim) {
    const sum = () => { let s = 0; for (let n = 0; n < sim.vol.length; n++) s += sim.vol[n]; for (const k of sim.pockets || []) s += k.vol; return s; };
    const v0 = sum(), w = { worst: 0, inSum: 0, after() { w.inSum += sim.inflow * sim.params.dt; const err = sum() - v0 - (w.inSum - (sim.pumped || 0)); if (Math.abs(err) > Math.abs(w.worst)) w.worst = err; } };
    return w;
  }
  // the invariants: the binding validation cases on this set's numbers, each run as tools/validate.js runs it (to eight
  // hours, or lying steady for twenty minutes), with its water held as above
  function cases(cfg, x) {
    const P = SC.PRESETS, ice = () => built1912(x);
    const build = {
      four: () => P.four.build(), five: () => P.five.build(), hawke: () => P.hawke.build(), britannic: () => P.britannic.build(),
      britannicClosed: () => { const s = P.britannic.build(); s.openings = s.openings.filter(o => o.kind !== 'porthole'); return s; },
      titanicFour: () => { const s = ice(); s.openings = s.openings.filter(o => C.zoneAt(o.x) <= 3); return s; },
      titanicD: () => { const s = ice(); s.bulkTop = { C: 'D', D: 'D', E: 'D', F: 'D', G: 'D', H: 'D', J: 'D' }; return s; },
      titanicNoBR5: () => { const s = ice(); s.openings = s.openings.filter(o => C.zoneAt(o.x) !== 5); return s; },
      titanicB: () => { const s = ice(); s.bulkTop = Object.fromEntries(C.BULKHEADS.map(b => [b.id, 'B'])); return s; },   // as tools/validate.js builds them
      titanicDoors: () => { const s = ice(); s.doorsOpen = C.BULKHEADS.map(b => b.id); return s; },
    };
    const out = {};
    for (const c of INVARIANTS) {
      const sim = C.createSim(shipOf(cfg), paramsOf(cfg, x), build[c.id]()), w = water(sim), dt = sim.params.dt;
      let calm = 0;
      while (sim.t < 8 * 3600 && !sim.foundered) {
        C.step(sim); w.after(sim);
        if (sim.t > 1800) { calm = (Math.abs(sim.inflow) < 0.02 && Math.abs(sim.wth) < 1e-5 && Math.abs(sim.vz) < 1e-3) ? calm + dt : 0; if (calm > 1200) break; }
      }
      out[c.id] = { founder: sim.foundered ? sim.founderT / 60 : null, end: sim.t / 60, cons: w.worst };
    }
    return { cases: out };
  }
  // the watch: the area constant's fixed point at this opening (calibrate.js's alphaFor: its start, its tolerance, its 40
  // turns), on this configuration's ship and this split (B6), then one 1912 watch as it is (B8)
  let W = null;
  function watch(cfg, x) {
    if (!W) { const E = require('../core/encounter.js'), N = require('../core/night.js'), R = require('./encounter_run.js'); W = { E, N, R, G: Object.assign({ portAround: 0 }, N.GEOM_1912) }; }
    const { E, N, R } = W, ship = shipOf(cfg), keep = [E.ICE.alpha, E.ICE.openAlong];
    // B15: the set's coal list; B16: the set's own params, so that the fixed point is found on the ship the watch runs
    const G = Object.assign({}, W.G, { params: paramsOf(cfg, x) }, x.coalListDeg === undefined ? {} : { coalListDeg: x.coalListDeg });
    const sp0 = blend(x.split);
    const openAlong = x.split === 0 ? keep[1] : keep[1].map((r, i) => { const q = sp0[i].f / SC.TITANIC_SPLIT[i].f; return r.length > 3 ? [r[0], r[1], r[2] * q, r[3] * q] : [r[0], r[1], r[2] * q]; });
    let alpha = keep[0] * x.area / SC.CALIBRATED_AREA, it = 0, tot = NaN;
    for (; it < 40; it++) {
      // B16: the set's own bunker opening in the fixed point too: given, it fixes the bunker region's share, so the rest
      // of her side must open the remainder (without it the watch, which gets it, opened less than the set's area)
      const s = E.summary(R.encounter(Object.assign({}, G, { ice: { alpha, openAlong, bunkerOpen: x.bunkerOpen } }), ship)); tot = s.stbd.area + s.port.area;
      if (Math.abs(tot - x.area) < 1e-10) break;
      alpha *= x.area / tot;
    }
    E.ICE.alpha = alpha; E.ICE.openAlong = openAlong;
    try {
      const sp = N.spec(1912);
      sp.ice = Object.assign({}, sp.ice, { bunkerOpen: x.bunkerOpen });
      if (x.coalListDeg !== undefined) sp.coalListDeg = x.coalListDeg;                                  // B15
      // G12's step 0 (D98): the founder is fitted at the flag, so the watch says so; when the default hand-over becomes
      // the break's onset (G12's switch), this watch stays the flag's ("the end term fits the founder, the onset a check")
      const sim = N.sink(N.create(ship, sp, { auto: true, readers: false, params: paramsOf(cfg, x), handover: 'flag' }));
      const T = sim.foundered ? (sim.founderT - sim.night.tTouch) / 60 : 300;
      return { alpha, turns: it, opened: tot, founder: T };
    } finally { E.ICE.alpha = keep[0]; E.ICE.openAlong = keep[1]; }
  }
  return (task) => configured(task.cfg, () => (task.kind === 'watch' ? watch(task.cfg, task.x) : task.kind === 'cases' ? cases(task.cfg, task.x) : preset(task.cfg, task.x)));
}

// ------------------------------------------------------------------ the designs
function rng(seed) { let s = seed | 0; return () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// a Latin hypercube: n points in k dimensions on [0, 1), each dimension's n bins holding one point each
function hypercube(n, k, seed) {
  const rnd = rng(seed), u = Array.from({ length: n }, () => new Array(k));
  for (let j = 0; j < k; j++) {
    const perm = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) { const m = Math.floor(rnd() * (i + 1)), t = perm[i]; perm[i] = perm[m]; perm[m] = t; }
    for (let i = 0; i < n; i++) u[i][j] = (perm[i] + rnd()) / n;
  }
  return u;
}
const toU = (inp, v) => (inp.scale === 'log' ? Math.log(v / inp.lo) / Math.log(inp.hi / inp.lo) : (v - inp.lo) / (inp.hi - inp.lo));
const fromU = (inp, u) => (inp.scale === 'log' ? inp.lo * Math.pow(inp.hi / inp.lo, u) : inp.lo + u * (inp.hi - inp.lo));
// n sets in the box (each input's [u0, u1] of its range; the whole range when box is null)
function sample(ins, n, seed, box) {
  return hypercube(n, ins.length, seed).map(u => Object.fromEntries(ins.map((inp, j) => { const b = box ? box[inp.name] : [0, 1]; return [inp.name, fromU(inp, b[0] + u[j] * (b[1] - b[0]))]; })));
}
function boxOf(ins, sets) {
  const box = {};
  for (const inp of ins) { const us = sets.map(x => toU(inp, x[inp.name])); box[inp.name] = [Math.max(0, Math.min(...us) - BOX_PAD), Math.min(1, Math.max(...us) + BOX_PAD)]; }
  return box;
}
// a maximin choice of m among the items (pts: their inputs on [0, 1]); the first is items[first]; each next one is the
// item farthest from those chosen (ties: the earlier). Returns indices.
function maximin(pts, m, first) {
  const n = pts.length, chosen = [first || 0], dmin = pts.map(p => dist(p, pts[first || 0]));
  while (chosen.length < Math.min(m, n)) {
    let best = -1;
    for (let i = 0; i < n; i++) if (chosen.indexOf(i) < 0 && (best < 0 || dmin[i] > dmin[best])) best = i;
    chosen.push(best);
    for (let i = 0; i < n; i++) dmin[i] = Math.min(dmin[i], dist(pts[i], pts[best]));
  }
  return chosen;
}
function dist(a, b) { let s = 0; for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) * (a[i] - b[i]); return Math.sqrt(s); }

// ------------------------------------------------------------------ the progress, a run a line (tools/carpathia.js's way)
function codeHash() {
  const h = crypto.createHash('sha256'), files = [];
  for (const d of ['core', path.join('core', 'readers')]) for (const f of fs.readdirSync(path.join(ROOT, d)).sort()) if (f.endsWith('.js')) files.push(path.join(d, f));
  for (const f of files) { h.update(f.replace(/\\/g, '/')); h.update(fs.readFileSync(path.join(ROOT, f))); }
  h.update(JSON.stringify(ROWS));                                   // the ledger as the runs read it
  h.update('eval ' + EVAL_VERSION);
  return h.digest('hex').slice(0, 12);
}
function openCache(dir, fresh) {
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'runs_' + codeHash() + '.jsonl'), map = new Map();
  if (!fresh && fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      try { const o = JSON.parse(line); if (o && typeof o.key === 'string' && o.r) map.set(o.key, o); } catch (e) { /* a line cut off: ignored, its run is made again */ }
    }
  } else if (fresh && fs.existsSync(file)) fs.renameSync(file, file + '.' + Date.now() + '.old');
  if (fs.existsSync(file) && fs.statSync(file).size > 0) { const fd = fs.openSync(file, 'r'), b = Buffer.alloc(1); fs.readSync(fd, b, 0, 1, fs.statSync(file).size - 1); fs.closeSync(fd); if (b[0] !== 10) fs.appendFileSync(file, '\n'); }
  const had = map.size, fd = fs.openSync(file, 'a');
  return { file, map, had, put(t, r, ms) { const o = { key: t.key, kind: t.kind, x: t.x, r, ms }; map.set(t.key, o); fs.writeSync(fd, JSON.stringify(o) + '\n'); }, close() { fs.closeSync(fd); } };
}
const keyOf = (kind, cfg, x) => kind + '|' + cfgKey(cfg) + '|' + JSON.stringify(x);

// ------------------------------------------------------------------ threads (tools/carpathia.js's pool)
function makePool(jobs) {
  if (jobs <= 1) {
    let ev = null;
    return { async run(tasks, done) { if (!ev) ev = evaluator(); for (const t of tasks) { const t0 = Date.now(); done(t, ev(t), Date.now() - t0); } }, close() {} };
  }
  const workers = Array.from({ length: jobs }, () => new Worker(__filename, { workerData: { role: 'history_match' } }));
  return {
    run(tasks, done) {
      return new Promise((resolve, reject) => {
        let next = 0, busy = 0, failed = false;
        const queue = new Map();
        const send = (w) => { if (failed || next >= tasks.length) return; const i = next++; busy++; queue.get(w).push(i); w.postMessage({ task: tasks[i] }); };
        if (!tasks.length) { resolve(); return; }
        for (const w of workers) {
          queue.set(w, []);
          w.removeAllListeners('message'); w.removeAllListeners('error');
          w.on('error', (e) => { failed = true; reject(e); });
          w.on('message', (msg) => {
            const i = queue.get(w).shift(); busy--;
            if (failed) return;
            if (msg.error) { failed = true; reject(new Error(msg.error)); return; }
            done(tasks[i], msg.r, msg.ms); send(w);
            if (!busy && next >= tasks.length) resolve();
          });
          send(w); send(w);
        }
      });
    },
    close() { for (const w of workers) w.terminate(); },
  };
}
if (!isMainThread && workerData && workerData.role === 'history_match') {
  const ev = evaluator();
  parentPort.on('message', ({ task }) => {
    try { const t0 = Date.now(), r = ev(task); parentPort.postMessage({ r, ms: Date.now() - t0 }); } catch (e) { parentPort.postMessage({ error: String(e && e.stack || e) }); }
  });
}

// ------------------------------------------------------------------ the waves
function args(a) {
  const o = { n1: 40, n2: 0, n3: 4, jobs: 6, seed: 1, d4: false, dry: false, fresh: false, force3: false, pick: 30, state: path.join(ROOT, 'out', 'gate', 'history_match'),
    cut: CUT.max, cut2: CUT.second, tsigma: TSIGMA, band: BAND.slice() };
  const num = (v, what) => { if (!(Number.isFinite(+v) && +v >= 0)) throw new Error('history_match: ' + what + ' wants a number, got ' + v); return +v; };
  for (let i = 0; i < a.length; i++) {
    const v = a[i + 1], int = (lo) => Math.max(lo, +v | 0);
    if (a[i] === '--sets') { o.sets = JSON.parse(fs.readFileSync(path.resolve(v), 'utf8')); o.setsFile = v; o.n1 = o.sets.length; o.n3 = Math.max(o.n3, o.sets.length); i++; continue; }   // D4's check: these sets in place of wave 1's
    if (a[i] === '--candidates') { o.candidates = Math.max(1, +a[i + 1] | 0); o.candFile = a[i + 2]; if (!o.candFile) throw new Error('history_match: --candidates N FILE'); i += 2; continue; }
    if (a[i] === '--cut') { o.cut = num(v, '--cut'); i++; continue; }
    if (a[i] === '--cut2') { o.cut2 = num(v, '--cut2'); i++; continue; }
    if (a[i] === '--tsigma') { o.tsigma = num(v, '--tsigma'); i++; continue; }
    if (a[i] === '--band') { o.band = String(v).split(',').map(s => num(s, '--band')); if (o.band.length !== 2 || !(o.band[0] <= o.band[1])) throw new Error('history_match: --band LO,HI'); i++; continue; }
    if (a[i] === '--n1') { o.n1 = int(0); i++; } else if (a[i] === '--n2') { o.n2 = int(0); i++; } else if (a[i] === '--n3') { o.n3 = int(0); i++; }
    else if (a[i] === '--jobs') { o.jobs = int(1); i++; } else if (a[i] === '--seed') { o.seed = +v | 0; i++; } else if (a[i] === '--pick') { o.pick = int(1); i++; }
    else if (a[i] === '--state') { o.state = path.resolve(v); i++; }
    else if (a[i] === '--d4') o.d4 = true; else if (a[i] === '--dry') o.dry = true; else if (a[i] === '--fresh') o.fresh = true; else if (a[i] === '--force3') o.force3 = true;
    else throw new Error('history_match: unknown argument ' + a[i]);
  }
  return o;
}
const f = (x, n) => (x === null || x === undefined || Number.isNaN(x) ? 'n/a' : (+x).toFixed(n === undefined ? 2 : n));
const g4 = (x) => +(+x).toPrecision(4);
const dur = (s) => (s >= 5400 ? (s / 3600).toFixed(1) + ' h' : s >= 90 ? Math.round(s / 60) + ' min' : Math.round(s) + ' s');

function plan(o, cfg, say) {
  const ins = activeInputs(cfg);
  say('HISTORY MATCH, the 1912 preset and watch (tools/history_match.js, evaluation ' + EVAL_VERSION + '; core and ledger ' + codeHash() + ')');
  say('the switches (' + (o.d4 ? '--d4, the landing\'s' : 'today\'s, all off') + '): ' + Object.keys(CONFIG_TODAY).map(k => k + ' ' + cfg[k]).join(', '));
  say('the inputs sampled (' + ins.length + '):');
  for (const i of ins) say('  ' + i.name.padEnd(13) + (i.lo + ' to ' + i.hi + (i.scale === 'log' ? ' (log)' : '')).padEnd(22) + i.src);
  say('frozen: ' + FROZEN.join(', '));
  say('the fitted groups (' + GROUPS.length + '): ' + GROUPS.join(', '));
  say('kept: largest I <= ' + o.cut + ' (--cut) and second largest <= ' + o.cut2 + ' (--cut2); a time-like row\'s sigma at least ' + o.tsigma + ' min (--tsigma); the watch\'s founder in ' + o.band.join(' to ') + ' min (--band)');
  say('hard filters, not scores: every run\'s water conserved step by step within ' + CONS_TOL + ' m3; Barrett\'s three rows of the bunker on every preset run (B17); on a kept set, the validation cases: ' + INVARIANTS.map(c => c.id + ' ' + (c.want === 'later' ? 'sinks later than 1912' : c.want === 'conserve' ? 'conserves its water' : c.want + 's')).join(', '));
}
// the plan's time: from the progress's own timings where it has them, else COST (B10)
function estimate(o, cache, say) {
  const ms = { preset: [], watch: [], cases: [] };
  if (cache) for (const v of cache.values()) if (typeof v.ms === 'number' && ms[v.kind] && v.key.indexOf('|' + cfgKey(o.d4 ? CONFIG_D4 : CONFIG_TODAY) + '|') > 0) ms[v.kind].push(v.ms);
  const mean = (a, d) => (a.length >= 4 ? a.reduce((s, x) => s + x, 0) / a.length / 1000 : d);
  const tp = mean(ms.preset, COST.preset), tw = mean(ms.watch, COST.watch), tc = mean(ms.cases, COST.cases), eff = o.jobs > 1 ? o.jobs * COST.par : 1;
  const rows = [['1 ', 'a Latin hypercube over the inputs, the preset', o.n1, tp], ['2 ', 'the same inside the box of wave 1\'s kept sets', o.n2, tp], ['3 ', 'the watch on up to ' + o.n3 + ' kept sets: the area constant\'s fixed point, then one watch', o.n3, tw],
    ['3b', 'the ' + INVARIANTS.length + ' binding validation cases on each set whose watch is in the band (at most ' + o.n3 + '; ' + f(tc, 0) + ' s a set' + (ms.cases.length >= 4 ? ' [measured: ' + ms.cases.length + ']' : ' [B10]') + ')', o.n3, tc]];
  let total = 0;
  say('the plan (' + o.jobs + ' thread' + (o.jobs > 1 ? 's' : '') + ', seed ' + o.seed + '): a preset run ' + f(tp, 1) + ' s' + (ms.preset.length >= 4 ? ' [measured: ' + ms.preset.length + ' runs with these switches in the progress, as they ran there]' : ' [B10]') + ', a watch with its fixed point ' + f(tw, 0) + ' s' + (ms.watch.length >= 4 ? ' [measured: ' + ms.watch.length + ']' : ' [B10]') + '; ' + o.jobs + ' threads taken as ' + f(eff, 1) + ' [bet]');
  for (const [w, what, n, t] of rows) { const one = n * t, many = one / eff; total += many; say('  wave ' + w + ': ' + String(n).padStart(5) + ' runs, ' + dur(one).padStart(8) + ' on one thread, ' + dur(many).padStart(8) + ' here   ' + what); }
  say('  wave 4 : ' + o.pick + ' of the sets left, by maximin: no runs');
  say('  in all about ' + dur(total) + ' at BelowNormal with the machine otherwise idle; allow twice that beside another session\'s suite (the design, 5.3)');
  return total;
}
function groupTable(recs, say, o) {
  const n = recs.length, kept = recs.filter(r => r.kept).length, leak = recs.filter(r => !r.conserved), bar = recs.filter(r => !r.barrett);
  if (n) { const v = recs.map(r => W6.verdict(r.w6)); say('  Barrett\'s W6 rows (B17, D87, hard filters): ' + bar.length + ' of ' + n + ' sets fail one or more (fills in 30 min: ' + v.filter(x => !x.fills).length + ' fail; the stokehold workable while it holds: ' + v.filter(x => !x.workable).length + '; gives way in T 50 to 75: ' + v.filter(x => !x.burst).length + ')'); }
  say('  ' + kept + ' of ' + n + ' kept' + (n ? ' (' + f(100 * kept / n, 1) + ' %)' : '') + '; ' + (leak.length ? leak.length + ' runs do NOT conserve their water within ' + CONS_TOL + ' m3 and are out whatever they score (the worst ' + Math.max(...leak.map(r => Math.abs(r.cons))).toExponential(2) + ' m3)' : 'every run conserves its water (the worst ' + (n ? Math.max(...recs.map(r => Math.abs(r.cons))).toExponential(2) : 0) + ' m3)'));
  if (!n) return;
  say('  ' + 'group'.padEnd(24) + ('I > ' + o.cut).padStart(8) + ('I > ' + o.cut2).padStart(9) + 'the largest in a set ruled out'.padStart(32) + 'median I'.padStart(10) + 'least I'.padStart(9));
  const out = recs.filter(r => !r.kept);
  for (const g of GROUPS.slice().sort((a, b) => out.filter(r => r.worst === b).length - out.filter(r => r.worst === a).length || recs.filter(r => r.I[b] > o.cut).length - recs.filter(r => r.I[a] > o.cut).length)) {
    const v = recs.map(r => r.I[g]).sort((a, b) => a - b);
    say('  ' + g.padEnd(24) + String(v.filter(x => x > o.cut).length).padStart(8) + String(v.filter(x => x > o.cut2).length).padStart(9) + String(out.filter(r => r.worst === g).length).padStart(32) + f(v[v.length >> 1]).padStart(10) + f(v[0]).padStart(9));
  }
  const fo = recs.map(r => r.founder).sort((a, b) => a - b);
  say('  the founder: ' + f(fo[0], 1) + ' to ' + f(fo[n - 1], 1) + ' min, median ' + f(fo[n >> 1], 1) + (fo[n - 1] >= 300 ? ' (300: afloat at five hours)' : ''));
}

// The landing rule (design v1.2, section 2; D86) on a kept set's table: the members whose watch stands at least
// BAND_IN min inside each wall of the band and whose inputs lie off their ranges' ends (EDGE of each range; a held
// input, B18, is left out of that test, since its held value may be an end), by their largest I. Each comes back with
// its held inputs at their held values and every other rounded to four significant figures, ready for --sets: the
// landing must run them again, since both move the numbers (D85's fallback, 2026-11-21).
const EDGE = 0.02, BAND_IN = 0.2;
function candidates(table, n) {
  const ins = table.inputs.map((i) => Object.assign({}, i, INPUTS.find((j) => j.name === i.name) || {}));
  const off = (m) => !ins.some((inp) => inp.held === undefined && (toU(inp, m.inputs[inp.name]) < EDGE || toU(inp, m.inputs[inp.name]) > 1 - EDGE));
  return table.members.filter((m) => m.watchFounder >= table.band[0] + BAND_IN && m.watchFounder <= table.band[1] - BAND_IN && off(m))
    .sort((a, b) => a.maxI - b.maxI).slice(0, n)
    .map((m) => Object.fromEntries(Object.entries(m.inputs).map(([k, v]) => { const inp = ins.find((i) => i.name === k); return [k, inp && inp.held !== undefined ? inp.held : +(+v).toPrecision(4)]; })));
}

async function run(o, sayIn) {
  const lines = [], say = (s) => { lines.push(s); if (sayIn) sayIn(s); };
  const cfg = o.d4 ? CONFIG_D4 : CONFIG_TODAY, ins = activeInputs(cfg);
  if (o.candidates) {                                    // --candidates N FILE: the landing rule on out/kept_1912.json
    const table = JSON.parse(fs.readFileSync(require('./outdir')('kept_1912.json'), 'utf8')), sets = candidates(table, o.candidates);
    fs.writeFileSync(path.resolve(o.candFile), JSON.stringify(sets, null, 1) + '\n');
    say('candidates: ' + sets.length + ' of ' + table.members.length + ' members by the landing rule (the watch ' + BAND_IN + ' min inside ' + table.band.join(' to ') + ', no input within ' + 100 * EDGE + ' % of an end but the held, by largest I), held inputs at their values, the rest to four figures -> ' + o.candFile);
    for (const s of sets) say('  ' + JSON.stringify(s));
    return { candidates: sets, lines };
  }
  plan(o, cfg, say);
  if (o.dry) {
    let seen = null;
    const file = path.join(o.state, 'runs_' + codeHash() + '.jsonl');
    if (fs.existsSync(file)) { seen = new Map(); for (const line of fs.readFileSync(file, 'utf8').split('\n')) { try { const v = JSON.parse(line); if (v && v.key) seen.set(v.key, v); } catch (e) { /* cut off */ } } }
    const total = estimate(o, seen, say);
    say('--dry: nothing run.');
    return { dry: true, seconds: total, lines };
  }
  const cache = openCache(o.state, o.fresh), pool = makePool(o.jobs), t0 = Date.now();
  say('progress: ' + cache.file + (cache.had ? ' (' + cache.had + ' runs there already)' : ''));
  const records = [];                                    // every run of this call, in the design's order
  async function wave(kind, sets) {
    const tasks = sets.map(x => ({ kind, cfg, x, key: keyOf(kind, cfg, x) }));
    const todo = tasks.filter((t, i) => !cache.map.has(t.key) && tasks.findIndex(u => u.key === t.key) === i);
    let n = 0;
    await pool.run(todo, (t, r, ms) => { cache.put(t, r, ms); n++; if (sayIn && (n % 50 === 0 || (kind !== 'preset' && n % 5 === 0))) sayIn('    ' + n + ' of ' + todo.length + ' (' + dur((Date.now() - t0) / 1000) + ')'); });
    // the progress keeps what a run measured; the verdicts are made here, from this call's bands and cut-offs
    const out = tasks.map(t => {
      const r = Object.assign({ key: t.key, kind, x: t.x }, cache.map.get(t.key).r);
      if (kind === 'preset') { const j = judge(r.parts, o), b = W6.verdict(r.w6); r.conserved = Math.abs(r.cons) <= CONS_TOL; r.barrett = b.ok; Object.assign(r, { I: j.I, worst: j.worst, max: j.max, second: j.second, kept: j.kept && r.conserved && b.ok }); delete r.parts; }
      if (kind === 'watch') r.ok = r.founder >= o.band[0] && r.founder <= o.band[1];
      return r;
    });
    for (const r of out) records.push(r);
    return { out, ran: todo.length };
  }
  try {
    // wave 1
    const w1 = await wave('preset', o.sets || sample(ins, o.n1, o.seed, null));
    say('wave 1: ' + o.n1 + ' sets over the whole ranges (' + w1.ran + ' run now, the rest from the progress)');
    groupTable(w1.out, say, o);
    let kept = w1.out.filter(r => r.kept), w2 = { out: [] };
    // wave 2
    if (o.n2 > 0 && !kept.length) say('wave 2: not run: wave 1 kept nothing. That is the result (the design, 5.3); the table above says which group empties the set.');
    else if (o.n2 > 0 && kept.length > o.n1 / 5) say('wave 2: not run: wave 1 kept more than a fifth of its points, and the matching stops there (the design, 5.3).');
    else if (o.n2 > 0) {
      const box = boxOf(ins, kept.map(r => r.x));
      say('wave 2: ' + o.n2 + ' sets inside the kept sets\' box (widened by ' + 100 * BOX_PAD + ' % of each range, B7): ' + ins.map(i => i.name + ' ' + g4(fromU(i, box[i.name][0])) + ' to ' + g4(fromU(i, box[i.name][1]))).join('; '));
      w2 = await wave('preset', sample(ins, o.n2, o.seed + 1, box));
      groupTable(w2.out, say, o);
      kept = kept.concat(w2.out.filter(r => r.kept));
    }
    kept = kept.filter((r, i) => kept.findIndex(q => q.key === r.key) === i);
    kept.sort((a, b) => a.max - b.max || (a.key < b.key ? -1 : 1));    // the first is the least implausible: maximin starts from it
    const norm = (r) => ins.map(i => toU(i, r.x[i.name]));
    // wave 3
    let checked = [], inBand = [];
    const BAND = o.band;
    // wave 3b: the invariants on the sets given, as hard filters; returns those that pass
    async function invariants(sets, label) {
      if (!sets.length) return [];
      const wc = await wave('cases', sets.map(r => r.x));
      const all = sets.map((r, i) => Object.assign({}, r, { cases: wc.out[i].cases, inv: invariantsOf(wc.out[i], r.founder) }));
      const pass = all.filter(r => r.inv.ok), count = {};
      for (const r of all) for (const id of r.inv.failed) count[id] = (count[id] || 0) + 1;
      say('wave 3b' + label + ': the invariants on ' + all.length + ' sets: ' + pass.length + ' pass every one' + (Object.keys(count).length ? '; failed: ' + Object.keys(count).sort((a, b) => count[b] - count[a]).map(id => id + ' ' + count[id]).join(', ') : ''));
      for (const r of all.slice(0, 6)) say('    area ' + f(r.x.area, 4) + '  ' + INVARIANTS.map(c => c.id + ' ' + (r.cases[c.id].founder === null ? 'afloat' : f(r.cases[c.id].founder, 0) + ' min') + (r.inv.failed.indexOf(c.id) >= 0 ? ' (!)' : '')).join(', ') + '; water within ' + Math.max(...INVARIANTS.map(c => Math.abs(r.cases[c.id].cons))).toExponential(1) + ' m3');
      return pass;
    }
    if (kept.length && o.n3 > 0) {
      const sel = kept.length > o.n3 ? maximin(kept.map(norm), o.n3, 0).map(i => kept[i]) : kept;
      const w3 = await wave('watch', sel.map(r => r.x));
      const both = sel.map((r, i) => Object.assign({}, r, { watch: w3.out[i] }));
      inBand = both.filter(r => r.watch.ok);
      const T = both.map(r => r.watch.founder).sort((a, b) => a - b);
      say('wave 3: the watch on ' + sel.length + ' of ' + kept.length + ' kept sets' + (kept.length > o.n3 ? ' (chosen by maximin)' : '') + ': ' + inBand.length + ' founder within ' + BAND.join(' to ') + ' min; ' + both.filter(r => r.watch.founder < BAND[0]).length + ' sooner, ' + both.filter(r => r.watch.founder > BAND[1]).length + ' later (the watch\'s founders ' + f(T[0], 1) + ' to ' + f(T[T.length - 1], 1) + ' min)');
      for (const r of both.slice(0, 12)) say('    area ' + f(r.x.area, 4) + '  preset ' + f(r.founder) + '  watch ' + f(r.watch.founder) + (r.watch.ok ? '  in  ' : '  OUT ') + ' alpha ' + r.watch.alpha.toPrecision(8) + ' (' + r.watch.turns + ' turns)  max I ' + f(r.max) + ' (' + r.worst + ')');
      if (both.length > 12) say('    ... and ' + (both.length - 12) + ' more, in the progress');
      checked = await invariants(inBand, '');
    } else if (!kept.length && o.force3 && o.n3 > 0) {
      const all = w1.out.concat(w2.out).sort((a, b) => a.max - b.max || (a.key < b.key ? -1 : 1)).slice(0, o.n3), w3 = await wave('watch', all.map(r => r.x));
      say('wave 3 (--force3: NOTHING IS KEPT; the watch on the ' + all.length + ' least implausible sets, to try the wave; none of them is kept or picked):');
      all.forEach((r, i) => say('    area ' + f(r.x.area, 4) + '  preset ' + f(r.founder) + '  watch ' + f(w3.out[i].founder) + (w3.out[i].ok ? '  in  ' : '  OUT ') + ' alpha ' + w3.out[i].alpha.toPrecision(8) + ' (' + w3.out[i].turns + ' turns, opened ' + f(w3.out[i].opened, 6) + ' m2)  max I ' + f(r.max) + ' (' + r.worst + ')'));
      await invariants(all, ' (--force3: on those same sets, to try it; none is kept)');
    } else say('wave 3: not run: ' + (kept.length ? '--n3 0' : 'nothing kept'));
    // wave 4
    let picked = [];
    if (checked.length) {
      picked = maximin(checked.map(norm), o.pick, 0).map(i => checked[i]);
      say('wave 4: ' + picked.length + ' of ' + checked.length + ' kept sets whose watch is in the band and whose invariants hold, by maximin' + (picked.length < o.pick ? ' (fewer than ' + o.pick + ': every one there is)' : ''));
    } else say('wave 4: nothing to pick');
    const table = {
      what: 'the kept set of the 1912 history match (tools/history_match.js; docs/DESIGN_calibration_epoch_v1_1_2026-11-21.md, 5.4)',
      name: codeHash(), evaluation: EVAL_VERSION, config: cfg, seed: o.seed, waves: { n1: o.n1, n2: o.n2, n3: o.n3, pick: o.pick },
      cut: { max: o.cut, second: o.cut2 }, tsigma: o.tsigma, band: o.band, conserve: CONS_TOL, invariants: INVARIANTS.map(c => ({ id: c.id, want: c.want })), inputs: ins.map(i => ({ name: i.name, lo: i.lo, hi: i.hi, scale: i.scale || 'linear', source: i.src })), frozen: FROZEN, groups: GROUPS,
      counts: { wave1: w1.out.length, kept1: w1.out.filter(r => r.kept).length, wave2: w2.out.length, kept2: w2.out.filter(r => r.kept).length, kept: kept.length, watchInBand: inBand.length, invariantsPass: checked.length },
      members: picked.map(r => ({ inputs: r.x, founder: r.founder, watchFounder: r.watch.founder, alpha: r.watch.alpha, maxI: r.max, secondI: r.second, worst: r.worst, I: r.I, water: r.cons,
        cases: Object.fromEntries(INVARIANTS.map(c => [c.id, r.cases[c.id].founder])) })),
    };
    const outFile = require('./outdir')('kept_1912.json');
    fs.writeFileSync(outFile, JSON.stringify(table, null, 1) + '\n');
    say('written: ' + outFile + ' (' + picked.length + ' members)');
    say('(' + dur((Date.now() - t0) / 1000) + ')');
    return { records, kept, checked, picked, table, lines, file: cache.file, outFile };
  } finally { pool.close(); cache.close(); }
}

module.exports = { INPUTS, FROZEN, CONFIG_TODAY, CONFIG_D4, CUT, TSIGMA, SIGMA_BET, NOISE_FOUNDER, BAND, CONS_TOL, INVARIANTS, GROUPS, EDGE, BAND_IN, activeInputs, implausibility, partsOf, judge, verdict, cutOf, invariantsOf, candidates, hypercube, sample, boxOf, maximin, toU, fromU, codeHash, keyOf, args, run, EVAL_VERSION };
if (isMainThread && require.main === module) run(args(process.argv.slice(2)), (s) => console.log(s)).then(() => process.exit(0), (e) => { console.error(e && e.stack || e); process.exit(1); });
