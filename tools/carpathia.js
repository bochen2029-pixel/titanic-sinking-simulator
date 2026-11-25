// The Carpathia question, a first search (W5 of BACKLOG.md; section 8 of docs/BRAINSTORM_the_whole_night_v1_2026-11-17.md):
// could any orders the model has have kept the 1912 watch afloat until Carpathia was alongside? It tries orders after
// the ice the way a player gives them, scores each night in minutes afloat after the touch, and reruns the best nights
// on some tens of models with each guess moved inside its range.
//
//   node tools/carpathia.js [--nights N] [--jobs N] [--seed S] [--variants V] [--robust R] [--state DIR] [--out FILE] [--fresh]
//     --nights N    the budget: distinct nights tried on the model as it stands (default 40, so that a test is quick)
//     --jobs N      worker threads (default 6, leaving two of eight cores for other work); the table is the same with one or many
//     --seed S      the seed of the random restarts (default 1); the same seed and budget give the same table
//     --variants V  models in the robustness rerun, the model as it stands among them (default 6; the real run 40)
//     --robust R    how many of the best nights are rerun on them (default 3)
//     --state DIR   where the progress is kept, a night a line, so that a run cut off resumes (default out/gate/carpathia,
//                   untracked); --fresh ignores what is there
//     --out FILE    the best night's log (default out/carpathia_best.json through tools/outdir.js)
//     --warm FILE   a warm start: FILE's night (a best night written before) read back into moves, refined and polished
//                   with the search's own; a search then never publishes a night worse than one it found before (D5)
//
//   node tools/carpathia.js --remeasure LABEL [--was LABEL] [--out FILE]
//     no search: the best night's orders as FILE has them, replayed from the start on the model as it stands, and FILE
//     written again with what this model makes of them (its founder, step and fingerprint, and its own baseline, the watch
//     on its own orders); the same orders, log and address. LABEL names this model ("C (D90)"); what the model before made
//     of them goes into `was`, named by --was. A rerun of the search replaces both (the epoch's D5).
//
// The night is seed 1912 on its own orders (the reconstructed watch). The search's orders begin on the first step at which
// the encounter is over and the 1912 orders have all been given (the helm, and Stop a minute after the touch). What it
// may order is what the model has (core/night.js, act): a watertight door raised or dropped by hand, the bridge's switch,
// pumps put on a room and the pumps handed back to the engineers (core/systems.js, pumpOrder; taking pumps off is not
// searched: it frees only pumps standing in rooms that flood), the engines ahead or astern for so long, a boiler room's
// fires drawn. Not the tanks (not built), not the boats or the wireless.
//
// A night is forked, not replayed: the watch at the fork is copied whole (Night.forecastOf, a structured clone) and run on
// with the candidate's orders given at their steps through Night.act, exactly as a replay's script gives them (the
// acceptance suite, tools/carpathia_tests.js, checks fork against replay to the bit). Each night reports, beside its
// minutes, her greatest list and when, the minute the main dynamos stopped, the minute she went dark and the minute her
// engines were lost for good (the plant could give them nothing), so that "afloat" never rewards a capsize or a dark hulk.
//
// The method, cheapest first: (1) one order at a time at a few moments: what matters at all; (2) the handful that matter,
// together: times on a five-minute grid, a beam of the best few kept, then refined to the minute; (3) random restarts from
// the seed, refined, to catch orders that help only together; (4) the best night so far with one more order. No tree
// search. The budget's shares: 30 %, 60 % (the beam) and 75 % (its refinement), 92 %, the rest. Then the robustness rerun,
// and Carpathia's arrival from the help reader (core/readers/world.js) for the targets and for the best nights. A night in
// which an order backs her onto the berg (the contact opens her anew) ranks after every night that does not. Last, apart
// from the search: a what-if outside the orders, watertight doors held open against their floats (no order of the model
// does that; the floats are disarmed in the copy), on every robustness model.
//
// D5 (the calibration epoch's design v1.1, section 5.5; evaluation 3): the calibration's own uncertainty joins the
// robustness models. The search runs on the landed member (today's defaults), as before. Its models are: the model as it
// stands; each guess at each end on it; each member of the kept set (out/kept_1912.json, the 1912 history match's) alone;
// then members drawn with every guess together (GUESSES' `calib`). A member changes the damage from T 0, so each has its
// own fork: its own watch to the encounter's end (tools/ensemble.js, memberWatch), with its own encounter (memberIce:
// the area constant's fixed point at its own opening, B16, and its split, B6), found once a member in the pool and kept in
// the progress file. A model whose own baseline founders outside the kept set's band (its `band`, the history match's
// screen on the watch's founder: 150 to 170 min after the touch) is flagged and left out of every count (auditor E's
// remedy 3). D22's words: the best night, found on the landed member, past each target on k of N.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const C = require('../core/core.js');
const Mo = require('../core/motion.js');
const N = require('../core/night.js');
const Sys = require('../core/systems.js');
const EN = require('./ensemble.js');    // D5: a kept member's encounter and watch (NH3's memberIce and memberWatch)

// bump when what a night's result is changes (play, give, forkOf, setModel): it names the progress file, so that results
// of another evaluation are never mixed in. The model's own files are hashed into the name as well (codeHash), and since
// evaluation 4 the onset's check's three (a night ends at the break's onset).
const EVAL_VERSION = 4;               // 2: every night says whether the ice opened her anew after the fork (again);
                                      // 3: a model may be a member of the kept set, with its own fork (D5);
                                      // 4: a night ends at its hand-over, the break's onset by default (G12, D98)
const NIGHT_SEED = 1912;
const DT = C.DEFAULT_PARAMS.dt;
const T_MAX = 8 * 3600;               // as Night.sink: eight hours of the watch, or lying steady after four
const ROOT = path.join(__dirname, '..');
// D5: the kept set, read once a thread (tracked: an input of the search, hashed into the progress file's name below)
const KEPT_FILE = path.join(ROOT, 'out', 'kept_1912.json');
let KEPT = null;
const kept = () => KEPT || (KEPT = JSON.parse(fs.readFileSync(KEPT_FILE, 'utf8')));
const memberOf = (i) => { const M = kept().members[i]; if (!M) throw new Error('calib: the kept set has no member ' + i); return M.inputs; };

// ------------------------------------------------------------------ the guesses a robustness model moves
// Where each lives, its value in the files, its range and the range's source. Tags as the repository's: [read] in a
// source a research note read, [derived] arithmetic on those, [bet] no source.
const PLANT0 = JSON.parse(JSON.stringify({ LTh: Sys.PLANT.pumps.map(p => p.LTh), suction: Sys.PLANT.suction, holdSuction: Sys.PLANT.holdSuction, mainLTh: Sys.PLANT.mainLTh, pumpOwn: Sys.PLANT.pumpOwn, pumpLent: Sys.PLANT.pumpLent }));
const SEA0 = { bowWave: Mo.SEAFLOW.bowWave, bowLen: Mo.SEAFLOW.bowLen };
const P0 = C.DEFAULT_PARAMS;
const GUESSES = [
  { id: 'doorLowA', where: 'params.doorLowA', v: P0.doorLowA, lo: 1.0, hi: 2.0, unit: 'm2', tag: '[bet]', why: 'the tank-top doors\' size is NOT FOUND (the door note, 4.1); Empress of Ireland\'s 5 ft 6 in by 2 ft, 1.02 m2, at the low end (HANDOFF section 6); "just over 6 feet" raised (Scott)' },
  { id: 'doorA', where: 'params.doorA', v: P0.doorA, lo: 1.0, hi: 2.2, unit: 'm2', tag: '[bet]', why: 'the doors on F and E decks: no size found' },
  { id: 'sill', where: 'core.js rebuildConnections: a tank-top door\'s point 0.85 m over the tank top (code, not a parameter: moved here in the copy at the fork)', v: 0, lo: -0.35, hi: 0.45, unit: 'm', tag: '[bet]', why: 'a door over 6 ft high with its sill at the tank top has its middle at 0.91 m; a sill at the plates (0.76 m up) puts it higher' },
  { id: 'floatDepth', where: 'params.floatDepth', v: P0.floatDepth, lo: 0.46, hi: 0.61, unit: 'm', tag: '[read]', why: 'a float trips at 18 in to 2 ft over the tank top (Wilding BI 20451-20456; the door note, 4.1)' },
  { id: 'doorFall', where: 'params.doorFall', v: P0.doorFall, lo: 25, hi: 30, unit: 's', tag: '[read]', why: '25 to 30 s against the oil cataract (the Report, "Structure")' },
  { id: 'bowWave', where: 'core/motion.js SEAFLOW.bowWave (P5)', v: SEA0.bowWave, lo: 0.44, hi: 0.66, unit: '', tag: '[bet]', why: 'the bow wave\'s rise at the stem, 3 to 4.5 m at 22 knots (the ship-under-way brainstorm, 5)' },
  { id: 'bowLen', where: 'core/motion.js SEAFLOW.bowLen (P5)', v: SEA0.bowLen, lo: 20, hi: 45, unit: 'm', tag: '[bet]', why: 'how far aft the bow wave reaches' },
  { id: 'pumpRate', where: 'core/systems.js PLANT.pumps[].LTh, each scaled', v: 1, lo: 0.7, hi: 1.15, unit: 'x', tag: '[read] rated, [bet] delivered', why: 'the Report\'s 250 and 150 tons an hour are ratings; the ash pumps\' 150 is Wilding\'s hedged figure; a press figure of 11.4 t/min is 40 % of the rating, unexplained (the pumps note, 3.1)' },
  { id: 'suction', where: 'core/systems.js PLANT.suction and holdSuction, scaled', v: 1, lo: 0.8, hi: 1.2, unit: 'x', tag: '[derived]', why: 'the suctions\' sizes at 2.5 m/s, the velocity a bet; 3 m/s gives 20 % more (the pumps note, 5.1)' },
  { id: 'mains', where: 'core/systems.js PLANT.mainLTh, scaled', v: 1, lo: 0.5, hi: 1.2, unit: 'x', tag: '[derived]', why: 'one 10-in main about 460 tons an hour, two 920 (the pumps note, 5.1)' },
  { id: 'pumpOwn', where: 'core/systems.js PLANT.pumpOwn', v: PLANT0.pumpOwn, lo: 120, hi: 600, unit: 's', tag: '[bet]', why: 'a room\'s own pumps "soon after the collision" (the Court; Barrett BI 2111)' },
  { id: 'pumpLent', where: 'core/systems.js PLANT.pumpLent', v: PLANT0.pumpLent, lo: 600, hi: 2700, unit: 's', tag: '[bet]', why: 'half an hour for 500 ft of portable pipe (Wilding BI 20684-20685); the permanent main\'s valves by rods and wheels may have taken minutes (Y7)' },
  { id: 'pumpAbandon', where: 'params.pumpAbandon', v: P0.pumpAbandon, lo: 1.5, hi: 99, unit: 'm', tag: '[bet]', why: 'a pump stops when its room\'s water stands about 1.5 m over the plates (2.3 m over the tank top); "ran on unattended" not ruled out (the pumps note, 5.1): 99 is that' },
  { id: 'pumpStrum', where: 'params.pumpStrum', v: P0.pumpStrum, lo: 0.05, hi: 0.3, unit: 'm', tag: '[bet]', why: 'how low a strum box lets a pump draw a room' },
  { id: 'passage', where: 'core/systems.js passageT (the firemen\'s passage rule), as orders read it', v: 0, lo: -1, hi: 10, unit: 'min', tag: '[read] about 5 min, [bet] the rule', why: 'the passage holed within about five minutes (the Report); the model floods it when hold 2 or 3 stands over the tunnel\'s top: -1 is the valves lost at once, 10 is ten minutes longer' },
  // D5: the calibration's own uncertainty. Not a range with two ends: a member is taken whole (alone, or drawn with the
  // other guesses), its range's source the file
  { id: 'calib', where: 'out/kept_1912.json: a member of the kept set, its inputs over today\'s defaults (tools/ensemble.js memberWatch: params, coal list, bunker opening, and its own encounter)', v: null, lo: null, hi: null, unit: 'member', tag: '[the history match]', why: 'the kept set of the 1912 history match (tools/history_match.js; the epoch\'s design v1.1, 5.4 and 5.5): the parameter sets the record does not rule out' },
];

// the module-level guesses as model m has them (m null: as the files have them). Every evaluation sets them all, and
// sets them back after, so that what a thread ran before never leaks into the next night.
function setModel(m) {
  const P = Sys.PLANT, g = (m && m.g) || {};
  const x = (id, d) => (g[id] === undefined ? d : g[id]);
  P.pumps.forEach((p, i) => { p.LTh = PLANT0.LTh[i] * x('pumpRate', 1); });
  for (let i = 0; i < PLANT0.suction.length; i++) P.suction[i] = PLANT0.suction[i] * x('suction', 1);
  for (let i = 0; i < PLANT0.holdSuction.length; i++) P.holdSuction[i] = PLANT0.holdSuction[i] * x('suction', 1);
  P.mainLTh = PLANT0.mainLTh * x('mains', 1);
  P.pumpOwn = x('pumpOwn', PLANT0.pumpOwn); P.pumpLent = x('pumpLent', PLANT0.pumpLent);
  Mo.SEAFLOW.bowWave = x('bowWave', SEA0.bowWave); Mo.SEAFLOW.bowLen = x('bowLen', SEA0.bowLen);
}
function paramsOf(m) {
  const g = (m && m.g) || {}, p = {};
  for (const id of ['doorLowA', 'doorA', 'floatDepth', 'doorFall', 'pumpAbandon', 'pumpStrum']) if (g[id] !== undefined) p[id] = g[id];
  return p;
}
const modelKey = (m) => (m && m.g && Object.keys(m.g).length ? JSON.stringify(Object.keys(m.g).sort().map(k => [k, m.g[k]])) : 'asis');

// ------------------------------------------------------------------ the night, forked after the ice
// The 1912 watch on its own orders, without the readers (they change no bit: core/night.js), to the first step at which
// the encounter is over and every scripted order has been given; copied there as the page's forecast copies a watch.
// D5: a model with a member of the kept set (g.calib) forks that member's own watch, its params with the model's guesses
// over them; its encounter is m.ice when the main thread passes it (found once a member in the pool), else found here
function forkOf(ship, m) {
  const g0 = (m && m.g) || {};
  let sim;
  if (g0.calib !== undefined && g0.calib !== null) {
    const x = memberOf(g0.calib);
    sim = EN.memberWatch(x, ship, { ice: (m && m.ice) || EN.memberIce(x, ship), create: { auto: true, readers: false, params: Object.assign(EN.paramsOf(x), paramsOf(m)) } }).sim;
  } else sim = N.create(ship, N.spec(NIGHT_SEED), { auto: true, readers: false, params: paramsOf(m) });
  const w = sim.night;
  while (!(w.tClear >= 0 && w.did.every(Boolean))) { N.step(sim); if (sim.t > 900) throw new Error('the 1912 encounter did not end'); }
  const g = (m && m.g) || {};
  if (g.sill) shiftSills(sim.conn, g.sill);
  return N.forecastOf(sim);
}
// a robustness model's sills: the tank-top doors' point (core.js puts it 0.85 m over the tank top, both sides at y 0.6) moved
// by dz in the connections. The core builds them anew only when an opening is added (after the fork: she is put back
// onto the ice, astern); play() moves them again then, one step late at most
function shiftSills(S, dz) { for (let c = 0; c < S.n; c++) if (S.kind[c] === C.K.DOOR && Math.abs(Math.abs(S.y[c]) - 0.6) < 1e-9) S.z[c] += dz; }
// minutes after the touch of a watch time, and the step of "T minutes after the touch"
const minOf = (F, t) => (t - F.night.tTouch) / 60;
function kOf(base, T) { return Math.max(base.kFork, Math.ceil((base.tTouch + 60 * T) / DT - 1e-9)); }

// An order given on its step, as a replay's script gives it (core/night.js runScript: Night.act at the start of the step).
// Its outcome: done; refused (the model said why: a pump order it cannot carry out, the bridge's switch without current);
// idle (carried out, and nothing to do: a door dropped that was shut, fires drawn that were out); late (she sank first).
function give(sim, o, m) {
  const P = sim.plant, g = (m && m.g) || {};
  let status = 'done', why = '';
  if (o.type === 'door' && o.arg === false && (!sim.doorOpen[o.value] || sim.doorFall[o.value] >= 0)) { status = 'idle'; why = 'shut or falling already'; }
  if (o.type === 'door' && o.arg === true && sim.doorOpen[o.value] && sim.doorFall[o.value] < 0) { status = 'idle'; why = 'open already'; }
  if (o.type === 'fires') {
    const R = Sys.PLANT.rooms; let any = false;
    for (let j = 0; j < R.length; j++) if ((o.value < 0 || j === o.value) && R[j].lit > 0 && P.fires[j] > 0 && !P.out[j] && !P.drawn[j]) any = true;
    if (!any) { status = 'idle'; why = 'no fire there to draw'; }
  }
  if (o.type === 'doors' && P.power && !sim.doorOpen.some((v, b) => v && Sys.LOW[b] && sim.doorFall[b] < 0)) { status = 'idle'; why = 'no tank-top door open'; }
  // the firemen's passage moved (a robustness model): only an order to a hold reads it (core/systems.js suctionFor)
  let saved = null;
  if (g.passage && o.type === 'pump' && o.value >= 1 && o.value <= 3) {
    saved = P.passageT;
    if (g.passage < 0 && P.passageT < 0) P.passageT = sim.t;
    else if (g.passage > 0 && P.passageT >= 0 && sim.t < P.passageT + 60 * g.passage) P.passageT = -1;
  }
  const r = N.act(sim, o.type, o.value, o.arg);
  if (saved !== null) P.passageT = saved;
  if (r && r.ok === false) { status = 'refused'; why = r.why; }
  if (o.type === 'doors' && r === false) { status = 'refused'; why = 'no current for the bridge\'s switch'; }
  return why ? { s: status, why } : { s: status };
}

// One night from the fork F0 with these orders ([{ k, type, value, arg }], k ascending): its minutes and what came with them.
// inspect: also her greatest list from T+5 to her last ten minutes (the core stops a roll at 80.2 degrees, which every
// founder reaches in her last minute) and the minute her bridge went under; asked only of the nights the report shows.
// hold: { k, doors } a what-if outside the orders (the report's last section): at step k those doors are raised by order
// and their floats disarmed in the copy, so that they stay open. No order of the model does that; it is never searched.
// G12 (D98, evaluation 4): a night ends at its hand-over, by default the break's onset (core/night.js over), her flag where
// she founders first; its minutes are to that end. toFlag: the same night carried on to her flag, the hand-over's check
// taken out of the copy as a 'flag' watch has none (to the onset the two are the same, bit for bit): the watch D94's band
// is read on
function play(ship, F0, orders, m, inspect, hold, toFlag) {
  const sim = structuredClone(F0); sim.ship = ship;
  if (toFlag) { delete sim.night.handover; delete sim.night.onset; delete sim.onset; }
  const w = sim.night, P = sim.plant, kFork = w.k, sill = m && m.g && m.g.sill;
  let conn = sim.conn;
  const st = [], perMin = inspect ? [] : null;
  for (const o of orders) if (!(o.k >= kFork)) throw new Error('an order before the fork: step ' + o.k + ' < ' + kFork);
  let i = 0, maxList = 0, tMaxList = sim.t, tPower = -1, tLights = -1, tEng = -1;
  while (!N.over(sim) && sim.t < T_MAX) {
    if (hold && w.k === hold.k) for (const b of hold.doors) { N.act(sim, 'door', b, true); sim.doorFloat[b] = 0; }
    while (i < orders.length && orders[i].k === w.k) st.push(give(sim, orders[i++], m));
    N.step(sim);
    if (sim.conn !== conn) { conn = sim.conn; if (sill) shiftSills(conn, sill); }
    const L = sim.roll < 0 ? -sim.roll : sim.roll;
    if (L > maxList) { maxList = L; tMaxList = sim.t; }
    if (perMin) { const j = Math.floor(minOf(sim, sim.t)); if (!(perMin[j] >= L)) perMin[j] = L; }
    if (P.power) tPower = -1; else if (tPower < 0) tPower = sim.t;
    if (P.lights > 0) tLights = -1; else if (tLights < 0) tLights = sim.t;
    if (sim.mo.plant.nMax[0] > 0) tEng = -1; else if (tEng < 0) tEng = sim.t;
    if (sim.t > 4 * 3600 && Math.abs(sim.inflow) < 0.02 && Math.abs(sim.wth) < 1e-5) break;
  }
  while (i < orders.length) { st.push({ s: 'late' }); i++; }
  const M = (t) => (t < 0 ? null : minOf(sim, t)), over = N.over(sim), endT = !over ? -1 : (sim.foundered ? sim.founderT : sim.night.onset.found.t);
  let ins;
  if (perMin) {
    const end = Math.floor(over ? M(endT) : M(sim.t)) - 10;
    let l10 = 0, l10T = null;                   // from T+5: before that her heel is the turn's at the ice, not the water's
    for (let j = 5; j < end; j++) if (perMin[j] > l10) { l10 = perMin[j]; l10T = j; }
    ins = { list10: l10 * 180 / Math.PI, list10T: l10T, bridge: sim.markT.bridge >= 0 ? M(sim.markT.bridge) : null, newHoles: sim.openings.length - F0.openings.length };
  }
  return {
    ins, m: over ? M(endT) : M(sim.t), afloat: !over, founderT: sim.founderT, endT, broke: over && !sim.foundered, k: w.k, fp: N.fingerprint(sim),
    again: sim.openings.length - F0.openings.length,     // openings the ice made after the fork: she was put back onto it
    list: maxList * 180 / Math.PI, listT: M(tMaxList), power: M(tPower), dark: M(tLights), engines: M(tEng),
    pumped: sim.pumped * C.RHO / 1000, st, log: w.log.map(o => (o.refused ? { k: o.k, type: o.type, value: o.value, arg: o.arg, refused: o.refused } : { k: o.k, type: o.type, value: o.value, arg: o.arg })),
  };
}

// the orders a night carried out (status done): what the night is made of. A refused order, an idle one and one she sank
// before are no part of it; the search ranks, publishes and reruns nights by these alone
function carriedOut(orders, r) { return orders.filter((x, i) => r.st[i] && r.st[i].s === 'done'); }

// a thread's evaluator: its own ship, its forks by model
function evaluator() {
  const ship = C.buildShip(), forks = new Map();
  return function evaluate(task) {
    if (task.ice !== undefined) return EN.memberIce(memberOf(task.ice), ship);   // D5: a member's encounter, for its forks
    const m = task.model || null, key = modelKey(m);
    setModel(m);
    try {
      if (!forks.has(key)) forks.set(key, forkOf(ship, m));
      const r = play(ship, forks.get(key), task.orders, m, !!task.inspect, task.hold || null, !!task.toFlag);
      if (!task.wantLog) delete r.log;
      if (!r.ins) delete r.ins;
      return r;
    } finally { setModel(null); }
  };
}

// ------------------------------------------------------------------ what may be ordered: slots and moves
// A slot is one kind of order with its target; a move is a slot at a time T (minutes after the touch); a candidate is a
// list of moves, which expands into the orders of the log. Each slot at most once in a candidate, one engine move at most.
const TELE = ['slow ahead', 'half ahead', 'full ahead', 'slow astern', 'half astern', 'full astern'];
const lc = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const zname = (k) => { const n = C.ZONES[k].name; return n.charAt(0) === 'N' ? n : (C.ZONES[k].peak || C.ZONES[k].kind === 'engine' || C.ZONES[k].kind === 'tunnel' ? 'the ' : '') + lc(n); };
const pname = (i) => lc(Sys.PLANT.pumps[i].name);
const zs = (k) => C.ZONES[k].short;
// a pump's short name: where it stands and its tons an hour (RE 250a: the first of the two 250s in the reciprocating engine room)
const PSHORT = Sys.PLANT.pumps.map((p, i, a) => { const same = a.filter(q => q.room === p.room && q.LTh === p.LTh); return zs(p.room) + ' ' + p.LTh + (same.length > 1 ? 'ab'[same.indexOf(p)] : ''); });
function slotList() {
  const S = [], add = (s) => { S.push(s); return s; };
  C.BULKHEADS.forEach((bh, b) => {
    if (!bh.doors.length) return;
    const between = zname(b) + ' and ' + zname(b + 1), pair = zs(b) + '|' + zs(b + 1);
    add({ id: 'door:' + bh.id, kind: 'door', b, p1: 1, lab: 'raise door ' + bh.id + ' (' + pair + ')', words: 'raise the doors in bulkhead ' + bh.id + ' by hand (' + between + ')' });
    for (const D of [10, 30]) add({ id: 'doorx:' + bh.id + ':' + D, kind: 'door', b, D, lab: 'raise door ' + bh.id + ', drop ' + D + ' min later', words: 'raise the doors in bulkhead ' + bh.id + ' (' + between + '), drop them by hand ' + D + ' min later' });
  });
  add({ id: 'switch', kind: 'switch', lab: 'the bridge\'s door switch', words: 'the bridge\'s switch: release every tank-top door that is up' });
  const own = new Set(Sys.PLANT.pumps.map(p => p.room));
  for (let k = 0; k < 16; k++) {
    if (!(PLANT0.suction[k] > 0 || PLANT0.holdSuction[k] > 0)) continue;
    add({ id: 'pump:' + k + ':all', kind: 'pump', room: k, which: 'all', p1: 1, lab: 'every pump that reaches ' + zs(k) + ' on it', words: 'every free pump that can reach ' + zname(k) + ' put on it' });
    if (own.has(k)) add({ id: 'pump:' + k + ':own', kind: 'pump', room: k, which: 'own', p1: 1, lab: zs(k) + '\'s own pumps on it', words: zname(k) + '\'s own pumps put on it' });
  }
  // one pump led to another room: the boiler rooms that flood (6 to 2) and the engine rooms; at four moments in the first
  // table, every moment later
  for (let k = 4; k <= 11; k++) {
    if (k === 9) continue;
    Sys.PLANT.pumps.forEach((p, i) => { if (p.room !== k) add({ id: 'pump:' + k + ':' + i, kind: 'pump', room: k, which: i, p1: k <= 8 ? 2 : 0, lab: 'pump ' + PSHORT[i] + ' on ' + zs(k), words: pname(i) + ' put on ' + zname(k) }); });
  }
  add({ id: 'pump:-1:engineers', kind: 'pump', room: -1, which: 'engineers', lab: 'pumps back to the engineers', words: 'the pumps handed back to the engineers' });
  for (const o of TELE) for (const D of [5, 10, 20, 30, 60]) add({ id: 'eng:' + o.replace(' ', '-') + ':' + D, kind: 'eng', order: o, D, p1: D === 10 || D === 30 ? 1 : 0, lab: o + ' for ' + D + ' min', words: 'engines ' + o + ' for ' + D + ' min, then stop' });
  for (const r of [-1, 0, 1, 2, 3, 4]) add({ id: 'fires:' + r, kind: 'fires', room: r, p1: 1, lab: r < 0 ? 'draw every fire' : 'draw ' + zs(Sys.PLANT.rooms[r].zone) + '\'s fires', words: r < 0 ? 'draw the fires in every boiler room' : 'draw the fires in ' + lc(Sys.PLANT.rooms[r].name) });
  return S;
}
const SLOTS = slotList();
const SLOT = Object.fromEntries(SLOTS.map(s => [s.id, s]));

// moves -> orders. Canonical: moves by time, then slot id; their orders by step, then the moves' order
function canon(moves) { return moves.slice().sort((a, b) => a[1] - b[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)); }
function expand(base, moves) {
  const out = [];
  canon(moves).forEach(([id, T], mi) => {
    const s = SLOT[id], k = kOf(base, T), push = (kk, type, value, arg, j) => out.push({ k: kk, type, value, arg, mi, j });
    if (s.kind === 'door') { push(k, 'door', s.b, true, 0); if (s.D) push(kOf(base, T + s.D), 'door', s.b, false, 1); }
    else if (s.kind === 'switch') push(k, 'doors', 'bridge', undefined, 0);
    else if (s.kind === 'pump') push(k, 'pump', s.room, s.which, 0);
    else if (s.kind === 'eng') { push(k, 'telegraph', s.order, undefined, 0); push(kOf(base, T + s.D), 'telegraph', 'stop', undefined, 1); }
    else if (s.kind === 'fires') push(k, 'fires', s.room, undefined, 0);
  });
  out.sort((a, b) => a.k - b.k || a.mi - b.mi || a.j - b.j);
  return out.map(o => (o.arg === undefined ? { k: o.k, type: o.type, value: o.value } : { k: o.k, type: o.type, value: o.value, arg: o.arg }));
}
const keyOf = (orders) => JSON.stringify(orders.map(o => (o.arg === undefined ? [o.k, o.type, o.value] : [o.k, o.type, o.value, o.arg])));
// --warm: a night's orders after the fork read back into moves, the inverse of expand, so that a search can start from a
// night found before. Refused unless the moves are legal and expand to the same orders, to the step
function movesOf(base, orders) {
  const Tof = (k) => Math.round((k * DT - base.tTouch) / 60), moves = [], used = new Set();
  orders.forEach((o, i) => {
    if (used.has(i)) return;
    const T = Tof(o.k), later = (f) => orders.findIndex((p, q) => q > i && !used.has(q) && f(p));
    if (o.type === 'pump') moves.push(['pump:' + o.value + ':' + o.arg, T]);
    else if (o.type === 'fires') moves.push(['fires:' + o.value, T]);
    else if (o.type === 'doors' && o.value === 'bridge') moves.push(['switch', T]);
    else if (o.type === 'door' && o.arg === true) {
      const j = later(p => p.type === 'door' && p.value === o.value && p.arg === false), id = C.BULKHEADS[o.value].id;
      if (j >= 0) { used.add(j); moves.push(['doorx:' + id + ':' + (Tof(orders[j].k) - T), T]); } else moves.push(['door:' + id, T]);
    } else if (o.type === 'telegraph' && o.value !== 'stop') {
      const j = later(p => p.type === 'telegraph' && p.value === 'stop');
      if (j < 0) throw new Error('--warm: the engines ordered ' + o.value + ' at step ' + o.k + ' and never stopped: no move of the search');
      used.add(j); moves.push(['eng:' + o.value.replace(' ', '-') + ':' + (Tof(orders[j].k) - T), T]);
    } else throw new Error('--warm: no move of the search gives the order ' + JSON.stringify(o));
  });
  for (const [id] of moves) if (!SLOT[id]) throw new Error('--warm: the search has no move ' + id);
  if (!legal(moves)) throw new Error('--warm: the moves read back are not a legal night: ' + JSON.stringify(moves));
  if (keyOf(expand(base, moves)) !== keyOf(orders)) throw new Error('--warm: the moves read back do not expand to the file\'s orders, to the step');
  return canon(moves);
}
function legal(moves) {
  const ids = new Set(); let eng = 0; const doors = new Set();
  for (const [id, T] of moves) {
    const s = SLOT[id];
    if (!s || ids.has(id) || !(T >= 1 && T <= 170)) return false;
    ids.add(id);
    if (s.kind === 'eng' && ++eng > 1) return false;
    if (s.kind === 'door') { if (doors.has(s.b)) return false; doors.add(s.b); }
  }
  return true;
}

// ------------------------------------------------------------------ the progress, a night a line
function codeHash() {
  const h = crypto.createHash('sha256');
  for (const f of ['core.js', 'motion.js', 'encounter.js', 'night.js', 'systems.js', 'scenarios.js']) h.update(fs.readFileSync(path.join(ROOT, 'core', f)));
  // evaluation 4 (G12): a night ends at the break's onset, which the night's own check finds (core/readers/onset.js, on
  // the girder's gauge and section.js's strength), so those three decide a night's result as the model's files do
  for (const f of ['onset.js', 'section.js', 'girder.js']) h.update(fs.readFileSync(path.join(ROOT, 'core', 'readers', f)));
  h.update('eval ' + EVAL_VERSION);
  h.update('kept ' + kept().name);                // D5: another kept set is another set of models
  return h.digest('hex').slice(0, 12);
}
function openCache(dir, fresh) {
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'nights_' + codeHash() + '.jsonl'), map = new Map();
  if (!fresh && fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      try { const o = JSON.parse(line); if (o && typeof o.key === 'string' && o.r) map.set(o.key, o.r); } catch (e) { /* a line cut off: ignored, its night is run again */ }
    }
  } else if (fresh && fs.existsSync(file)) fs.renameSync(file, file + '.' + Date.now() + '.old');
  // a run cut off in the middle of a line: start the next on a line of its own
  if (fs.existsSync(file) && fs.statSync(file).size > 0) { const fd = fs.openSync(file, 'r'), b = Buffer.alloc(1); fs.readSync(fd, b, 0, 1, fs.statSync(file).size - 1); fs.closeSync(fd); if (b[0] !== 10) fs.appendFileSync(file, '\n'); }
  const had = map.size;
  // one handle for the whole run: a file opened and closed for every night was the run's bottleneck (each close let the
  // file be scanned again while the threads waited for their next night)
  const fd = fs.openSync(file, 'a');
  return { file, map, had, put(key, r) { map.set(key, r); fs.writeSync(fd, JSON.stringify({ key, r }) + '\n'); }, close() { fs.closeSync(fd); } };
}

// ------------------------------------------------------------------ threads
// one task a key: two candidates whose effective orders are the same night share a key, and a batch holding both ran
// that night twice and wrote it twice (the callers read every result back from the cache by its key). Seen at G6b's
// landing, 2026-11-20, as the resume row's count one short; a night's result is the same either way.
const uniqueTasks = (tasks) => { const s = new Set(); return tasks.filter(t => (s.has(t.key) ? false : (s.add(t.key), true))); };
function makePool(jobs) {
  if (jobs <= 1) {
    let ev = null;
    return { async run(tasks, done) { if (!ev) ev = evaluator(); for (const t of uniqueTasks(tasks)) done(t, ev(t)); }, close() {} };
  }
  const workers = Array.from({ length: jobs }, () => new Worker(__filename, { workerData: { role: 'night' } }));
  return {
    // each thread holds a second night in its queue, so that it never waits for the main thread between nights (with one
    // at a time the threads stood idle half the time on this laptop); results are keyed, so the order they come in is free
    run(tasks, done) {
      tasks = uniqueTasks(tasks);
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
            done(tasks[i], msg.r); send(w);
            if (!busy && next >= tasks.length) resolve();
          });
          send(w); send(w);
        }
      });
    },
    close() { for (const w of workers) w.terminate(); },
  };
}
if (!isMainThread && workerData && workerData.role === 'night') {
  const ev = evaluator();
  parentPort.on('message', ({ task }) => {
    try { parentPort.postMessage({ r: ev(task) }); } catch (e) { parentPort.postMessage({ error: String(e && e.stack || e) }); }
  });
}

// ------------------------------------------------------------------ Carpathia's arrival, from the help reader
// The reader is loaded only here: a loaded reader is attached to every watch made after it (the search's own watches
// are made without readers, and the copy at the fork leaves them behind, so nothing above depends on it).
const NM = 1852, KN_ = NM / 3600, DEG = Math.PI / 180;
function carpathiaOf(W, sim) { const s = W.readouts(sim).ships.find(x => x.id === 'carpathia'); return s ? (s.alongsideT !== null ? s.alongsideT : s.etaT) : null; }
// five miles made good toward Carpathia's place, then stopped: tools/world_tests.js's procedure (makeGood), as the help
// reader's what-if (b) is measured there
function makeGood(W, sim, nm) {
  const Wd = sim.world, cs = W.SHIPS[0], wx = Wd.X0 + W.WRECK_1912.X, wy = Wd.Y0 + W.WRECK_1912.Y;
  const ux = Math.cos(cs.brg * DEG), uy = Math.sin(cs.brg * DEG), qx = wx + nm * NM * ux, qy = wy + nm * NM * uy;
  let lastHelm = -1e9, lastRud = 999, tel = null, phase = 'go';
  const ring = (o) => { if (tel !== o) { N.telegraph(sim, o); tel = o; } };
  while (!N.over(sim) && phase !== 'stopped') {
    const m = sim.mo, dx = qx - m.X, dy = qy - m.Y, u = Math.sqrt(m.u * m.u + m.v * m.v);
    const err = ((Math.atan2(dy, dx) / DEG - m.psi / DEG) % 360 + 540) % 360 - 180;
    if (phase === 'go') {
      const rud = Math.max(-40, Math.min(40, Math.round(2 * err)));
      if (Math.abs(rud - lastRud) >= 5 && sim.t - lastHelm >= 15) { N.helm(sim, rud); lastRud = rud; lastHelm = sim.t; }
      ring(Math.sqrt(dx * dx + dy * dy) > NM && Math.abs(err) < 60 ? 'half ahead' : 'slow ahead');
      if (dx * Math.cos(m.psi) + dy * Math.sin(m.psi) < 150 * u && Math.abs(err) < 60) { phase = 'astern'; ring('full astern'); N.helm(sim, 0); }
    } else if (m.u < 0.15 * KN_) { phase = 'stopped'; ring('stop'); }
    N.step(sim);
  }
}
function arrivals(ship, logs) {
  const W = require('../core/readers/world.js'), sp = N.spec(NIGHT_SEED), T = (s) => (s.t - s.night.tTouch) / 60;
  const until = (s, Tm) => { while (!N.over(s) && (s.night.tTouch < 0 || T(s) < Tm - 1e-9)) N.step(s); return s; };
  // G12: a watch's end, the hand-over (the break's onset by default; her flag where she founders first)
  const endOf = (s) => (s.foundered ? s.founderT : (s.night.onset && s.night.onset.found ? s.night.onset.found.t : -1));
  const out = {};
  { const s = N.sink(N.create(ship, sp, { auto: true })); out.asWent = { carpathia: carpathiaOf(W, s), founders: T({ t: endOf(s), night: s.night }) }; }
  { const s = until(N.create(ship, sp, { auto: true }), 5); W.call(s); N.sink(s); out.callAtOnce = { carpathia: carpathiaOf(W, s), founders: T({ t: endOf(s), night: s.night }) }; }
  { const s = until(N.create(ship, sp, { auto: true }), 5); W.call(s); until(s, 10); makeGood(W, s, 5.0); N.sink(s); out.fiveMiles = { carpathia: carpathiaOf(W, s), founders: N.over(s) ? T({ t: endOf(s), night: s.night }) : null }; }
  // the best nights, replayed from the start with the reader on: her own arrival there (the 1912 call, as the bridge made it)
  out.nights = logs.map((L) => { const s = N.replay(ship, sp, L.log, L.k); return { carpathia: carpathiaOf(W, s), fp: N.fingerprint(s), founderT: s.founderT, foundered: s.foundered, endT: endOf(s), over: N.over(s) }; });
  return out;
}

// ------------------------------------------------------------------ the search
function args() {
  const a = process.argv.slice(2), o = { nights: 40, jobs: 6, seed: 1, variants: 6, robust: 3, state: null, out: null, fresh: false, remeasure: null, was: null };
  for (let i = 0; i < a.length; i++) {
    const v = a[i + 1];
    if (a[i] === '--remeasure') { o.remeasure = v; i++; } else if (a[i] === '--was') { o.was = v; i++; } else if (a[i] === '--warm') { o.warm = v; i++; }
    else if (a[i] === '--nights') { o.nights = Math.max(1, +v | 0); i++; } else if (a[i] === '--jobs') { o.jobs = Math.max(1, +v | 0); i++; }
    else if (a[i] === '--seed') { o.seed = +v >>> 0; i++; } else if (a[i] === '--variants') { o.variants = Math.max(1, +v | 0); i++; }
    else if (a[i] === '--robust') { o.robust = Math.max(0, +v | 0); i++; } else if (a[i] === '--state') { o.state = v; i++; }
    else if (a[i] === '--out') { o.out = v; i++; } else if (a[i] === '--fresh') o.fresh = true;
    else { console.error('unknown argument: ' + a[i]); process.exit(2); }
  }
  o.state = path.resolve(o.state || path.join(ROOT, 'out', 'gate', 'carpathia'));
  o.out = path.resolve(o.out || require('./outdir')('carpathia_best.json'));
  return o;
}

// the robustness models: the model as it stands; each guess at each end of its range alone; each member of the kept set
// alone (D5); then every guess drawn together, on a member drawn with them. The real run asks for enough of them to reach
// the joint draws (--variants 80: 1, 29, 30, then 20 drawn)
function variantsOf(n, seed) {
  const list = [{ id: 'asis', name: 'as the files have it', g: {} }];
  for (const G of GUESSES) for (const side of ['lo', 'hi']) { if (G.id === 'calib' || G[side] === G.v) continue; list.push({ id: G.id + '-' + side, name: G.id + ' ' + G[side] + (G.unit && G.unit !== 'x' ? ' ' + G.unit : (G.unit === 'x' ? 'x' : '')), g: { [G.id]: G[side] } }); }
  const K = kept().members.length;
  for (let i = 0; i < K; i++) list.push({ id: 'member-' + i, name: 'the kept set\'s member ' + i, g: { calib: i } });
  const r = N.rng((seed * 7919 + 17) >>> 0);
  for (let j = 1; list.length < n; j++) {
    const g = {};
    for (const G of GUESSES) { if (G.id === 'calib') continue; const u = r(); g[G.id] = G.id === 'passage' ? [G.lo, 0, G.hi][Math.floor(u * 3)] : +(G.lo + (G.hi - G.lo) * u).toPrecision(3); }
    if (g.pumpAbandon > 10) g.pumpAbandon = r() < 0.5 ? 99 : +(1.5 + 3 * r()).toPrecision(3);   // "ran on unattended", or a depth
    g.calib = Math.floor(r() * K);                // D5: the member they are drawn on
    list.push({ id: 'joint-' + j, name: 'every guess drawn, on member ' + g.calib + ' (' + j + ')', g });
  }
  return list.slice(0, n);
}

const fmt = (x, n) => (x === null || x === undefined ? '-' : x.toFixed(n === undefined ? 1 : n));
const sgn = (x, n) => (x === null || x === undefined ? '-' : (x >= 0 ? '+' : '') + x.toFixed(n === undefined ? 1 : n));

// a night's log as the page's address carries it (site/parts/40_night_end.js, encodeLog)
const encLog = (log) => Buffer.from(JSON.stringify(log.map(x => (x.arg === undefined ? [x.k, x.type, x.value] : [x.k, x.type, x.value, x.arg]))), 'latin1').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// --remeasure (the coordinator's ask of 2026-11-23, for join 15): the best night's orders, as the file has them, replayed
// from the start on the model as it stands (no readers: they change no bit), with the watch on its own orders as its
// baseline, as the search's baseline is (tools/carpathia_tests.js holds the two equal). Every order must be accepted.
function remeasure(o) {
  const t0 = Date.now(), ship = C.buildShip(), sp = N.spec(NIGHT_SEED), old = JSON.parse(fs.readFileSync(o.out, 'utf8'));
  if (old.seed !== NIGHT_SEED) throw new Error('--remeasure: ' + o.out + ' is night ' + old.seed + ', not ' + NIGHT_SEED);
  if (old.address !== '#night=' + NIGHT_SEED + '&log=' + encLog(old.log)) throw new Error('--remeasure: the address in ' + o.out + ' is not its log\'s');
  const s = N.sink(N.create(ship, sp, { script: old.log.map(x => ({ k: x.k, type: x.type, value: x.value, arg: x.arg })), readers: false }), T_MAX);
  const b = N.sink(N.create(ship, sp, { auto: true, readers: false }), T_MAX);
  const refused = s.night.log.filter(x => x.refused);
  if (refused.length) throw new Error('--remeasure: ' + refused.length + ' order(s) refused on this model: ' + refused.map(x => 'step ' + x.k + ' ' + x.type + ' ' + x.value + ': ' + x.refused).join('; '));
  const end = (w) => (w.foundered ? w.founderT : (N.over(w) ? w.night.onset.found.t : w.t));   // G12: her end, the hand-over
  const tt = s.night.tTouch, M = (w) => (end(w) - w.night.tTouch) / 60;
  const best = Object.assign({}, old, {
    gen: N.GEN, k: s.night.k, founderT: s.founderT, foundered: s.foundered || N.over(s), minutes: M(s), fingerprint: N.fingerprint(s), endT: end(s), broke: N.over(s) && !s.foundered,
    baseline: { minutes: M(b), k: b.night.k, fingerprint: N.fingerprint(b) },
    orders: old.orders.map(x => ({ k: x.k, T: +((x.k * DT - tt) / 60).toFixed(2), words: x.words })),
  });
  best.measured = 'the same orders on ' + o.remeasure + ', replayed from the start by tools/carpathia.js --remeasure; `search` is the search that found them';
  best.was = { on: o.was || old.measured || 'the search\'s own model', k: old.k, founderT: old.founderT, foundered: old.foundered, minutes: old.minutes, fingerprint: old.fingerprint, baseline: old.baseline, endT: old.endT, broke: old.broke };
  fs.mkdirSync(path.dirname(o.out), { recursive: true });
  fs.writeFileSync(o.out, JSON.stringify(best, null, 1) + '\n');
  const say = (w, x) => 'T+' + fmt(x.minutes, 2) + ' (' + sgn(x.minutes - x.baseline.minutes, 2) + ' over its own baseline, T+' + fmt(x.baseline.minutes, 2) + ' at step ' + x.baseline.k + ', ' + x.baseline.fingerprint + '), step ' + x.k + ', ' + x.fingerprint + ' on ' + w;
  console.log('THE BEST NIGHT\'S ' + old.orders.length + ' ORDERS (' + old.log.length + ' in its log, none refused), remeasured:');
  console.log('  ' + say(o.remeasure, best));
  console.log('  ' + say(best.was.on, best.was));
  console.log('(' + ((Date.now() - t0) / 1000).toFixed(0) + ' s; written to ' + path.relative(ROOT, o.out) + ')');
}

async function main() {
  const o = args(), t0 = Date.now();
  if (o.remeasure) return remeasure(o);
  const ship = C.buildShip();
  setModel(null);
  const F0 = forkOf(ship, null), base = { tTouch: F0.night.tTouch, kFork: F0.night.k };
  const cache = openCache(o.state, o.fresh), pool = makePool(o.jobs);
  const lines = [], say = (s) => { lines.push(s); };
  let spent = 0, computed = 0;
  const seen = new Map();                      // key -> { moves, orders, r } for this run's nights on the model as it stands
  const budget = () => o.nights - spent;
  // evaluate candidates (lists of moves): those already seen cost nothing; new ones count against the budget, in order
  async function trial(cands, cap) {
    const fresh = [], picked = [];
    for (const moves of cands) {
      if (!legal(moves)) continue;
      const orders = expand(base, moves), key = keyOf(orders);
      if (seen.has(key)) { picked.push(seen.get(key)); continue; }
      if (fresh.some(f => f.key === key)) continue;
      if (fresh.length >= Math.min(cap === undefined ? Infinity : cap, budget())) continue;
      fresh.push({ key, moves: canon(moves), orders });
    }
    spent += fresh.length;
    const todo = fresh.filter(f => !cache.map.has('asis|' + f.key));
    await pool.run(todo.map(f => ({ key: 'asis|' + f.key, orders: f.orders })), (t, r) => { cache.put(t.key, r); computed++; });
    for (const f of fresh) { const e = { key: f.key, moves: f.moves, orders: f.orders, r: cache.map.get('asis|' + f.key) }; seen.set(f.key, e); picked.push(e); }
    return picked;
  }
  const gainOf = (e) => e.r.m - BASE.r.m;
  // a night that puts her back onto the ice (an order astern can back her onto the berg, and the contact opens her anew) is
  // no remedy, whatever its minutes: it ranks after every night that does not
  const struck = (e) => e.r.again > 0;
  const better = (a, b) => (struck(a) - struck(b)) || (b.r.m - a.r.m) || (eff(a).length - eff(b).length) || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
  const eff = (e) => carriedOut(e.orders, e.r);
  const effKey = (e) => keyOf(eff(e));
  // the nights in order, each night once: the same orders carried out, or the same night to the bit (an order that moved
  // nothing, a door raised and dropped between dry rooms, is no part of a night), the fewer orders kept
  function ranked(list) {
    const best = new Map(), bits = new Set();
    for (const e of list.slice().sort(better)) {
      const k = effKey(e), b = e.r.fp + '@' + e.r.k;
      if (best.has(k) || bits.has(b)) continue;
      best.set(k, e); bits.add(b);
    }
    return [...best.values()];
  }

  // 0. the baseline: no order after the ice
  const BASE = (await trial([[]], 1))[0];

  // 1. one order at a time, at a few moments each
  const MOMENTS = [1, 3, 5, 10, 20, 30, 45, 60, 90, 120], FEW = [1, 30, 60, 90];
  const p1 = [];
  for (const s of SLOTS) if (s.p1) for (const T of (s.p1 === 2 ? FEW : MOMENTS)) p1.push([[s.id, T]]);
  const r1 = await trial(p1, Math.max(1, Math.floor(0.3 * o.nights)));
  const bySlot = new Map();
  for (const e of r1) { if (!e.moves.length) continue; const id = e.moves[0][0]; if (!bySlot.has(id)) bySlot.set(id, []); bySlot.get(id).push(e); }

  // 2. the handful that matter, together: a beam on a five-minute grid, then refined to the minute
  const GRID = [1]; for (let T = 5; T <= 150; T += 5) GRID.push(T);
  const best1 = [...bySlot.entries()].map(([id, es]) => ({ id, g: Math.max(-1e9, ...es.filter(e => !struck(e)).map(gainOf)) })).sort((a, b) => b.g - a.g || (a.id < b.id ? -1 : 1));
  // the handful: the best order of each kind of action that gains a quarter of a minute alone (pumps by the room they are put
  // on, the engines by direction, each door, the fires), eight at most: one pump or another on the same room is one action
  const groupOf = (id) => { const s = SLOT[id]; return s.kind === 'pump' ? 'pump>' + s.room : s.kind === 'eng' ? 'eng ' + (/astern/.test(s.order) ? 'astern' : 'ahead') : s.kind === 'door' ? 'door ' + s.b : s.kind; };
  const handful = [], groups = new Set();
  for (const x of best1) { if (!(x.g >= 0.25) || handful.length >= 8) break; const gk = groupOf(x.id); if (!groups.has(gk)) { groups.add(gk); handful.push(x.id); } }
  if (handful.some(id => SLOT[id].kind === 'pump')) handful.push('pump:-1:engineers');
  // the beam takes up to 60 % of the budget, its refinement up to 75 %, the random restarts the rest
  const capBeam = () => Math.max(0, Math.floor(0.6 * o.nights) - spent), cap2 = () => Math.max(0, Math.floor(0.75 * o.nights) - spent);
  const B = 5;
  // the beam: the best of each set of orders first (the same orders a few minutes apart do not crowd it), then the rest
  const beamOf = (list) => {
    const r0 = ranked(list), out = [], sets = new Set();
    for (const e of r0) { const s = e.moves.map(mv => mv[0]).sort().join('+'); if (!sets.has(s) && out.length < B) { sets.add(s); out.push(e); } }
    for (const e of r0) if (out.length < B && !out.includes(e)) out.push(e);
    return out.sort(better);
  };
  let beam = [];
  const p2log = [];
  if (handful.length && capBeam() > 0) {
    const level = await trial(handful.filter(id => id !== 'pump:-1:engineers').flatMap(id => GRID.map(T => [[id, T]])), capBeam());
    beam = beamOf(level.concat([BASE]));
    p2log.push('level 1: ' + level.length + ' nights, best ' + fmt(beam[0].r.m, 2));
    for (let L = 2; L <= Math.min(5, handful.length) && capBeam() > 0; L++) {
      const cands = [];
      for (const e of beam) for (const id of handful) { if (e.moves.some(mv => mv[0] === id)) continue; for (const T of GRID) cands.push(e.moves.concat([[id, T]])); }
      const got = await trial(cands, capBeam());
      const nb = beamOf(beam.concat(got));
      p2log.push('level ' + L + ': ' + got.length + ' nights, best ' + fmt(nb[0].r.m, 2));
      const improved = nb[0].r.m > beam[0].r.m;
      beam = nb;
      if (!improved) break;
    }
  }
  // refine to the minute: each move's time a minute or three either way, while that helps
  async function refine(e, steps, cap, drop) {
    let cur = e;
    for (let pass = 0; pass < 12 && cap() > 0; pass++) {
      const cands = [];
      cur.moves.forEach((mv, i) => {
        for (const d of steps) { const T = mv[1] + d; if (T >= 1 && T <= 160) cands.push(cur.moves.map((x, j) => (j === i ? [x[0], T] : x))); }
        if (drop && cur.moves.length > 1) cands.push(cur.moves.filter((x, j) => j !== i));
      });
      const got = await trial(cands, cap());
      const nb = ranked(got.concat([cur]))[0];
      if (nb === cur || !(nb.r.m > cur.r.m)) break;
      cur = nb;
    }
    return cur;
  }
  const refined2 = [];
  for (const e of beam.slice(0, 3)) if (e.moves.length && cap2() > 0) refined2.push(await refine(e, [-3, -2, -1, 1, 2, 3], cap2, false));

  // 3. random restarts from the seed: two to four moves anywhere in the slots, on the grid; the best few refined (to 92 % of
  // the budget)
  const cap3 = () => Math.max(0, Math.floor(0.92 * o.nights) - spent);
  const r = N.rng(o.seed), rnd = (n) => Math.floor(r() * n), pool3 = SLOTS.map(s => s.id);
  const nRand = Math.max(0, Math.min(400, Math.floor(0.6 * cap3())));
  const rand = [];
  for (let j = 0; j < nRand * 4 && rand.length < nRand; j++) {
    const m = 2 + rnd(3), moves = [];
    for (let q = 0; q < m; q++) moves.push([pool3[rnd(pool3.length)], GRID[rnd(GRID.length)]]);
    if (legal(moves)) rand.push(moves);
  }
  const r3 = await trial(rand, cap3());
  const refined3 = [];
  for (const e of ranked(r3).slice(0, 4)) if (cap3() > 0) refined3.push(await refine(e, [-5, -1, 1, 5], cap3, true));

  // 3b. the warm start (--warm FILE): the best night of a search before, its orders after the fork read back into moves,
  // refined as the beam's best are, on the rest of the budget; so that a search never publishes a night worse than one it
  // found before. D5's reason: on C every pump order alone costs time, so the beam never tries v3's pumps with the
  // engines astern, and v3's orders beat D5's own best there
  let warm = null;
  if (o.warm) {
    const W = JSON.parse(fs.readFileSync(path.resolve(o.warm), 'utf8'));
    if (W.seed !== NIGHT_SEED) throw new Error('--warm: ' + o.warm + ' is night ' + W.seed + ', not ' + NIGHT_SEED);
    const wm = movesOf(base, W.log.filter(x => x.k >= base.kFork)), first = (await trial([wm]))[0];
    if (first) warm = { file: path.basename(o.warm), there: W.minutes, moves: wm, first, refined: await refine(first, [-3, -2, -1, 1, 2, 3], budget, true) };
  }

  // 4. polish: the best night so far with one more order (each of the first table's at its best moment there, the pumps
  // handed back on the grid), and refined again if that helps (the rest of the budget)
  const champ0 = ranked([...seen.values()])[0], polished = [];
  if (champ0 && champ0.moves.length && budget() > 0) {
    const adds = [...bySlot.entries()].map(([id, es]) => [id, es.slice().sort(better)[0].moves[0][1]]);
    if (champ0.moves.some(mv => SLOT[mv[0]].kind === 'pump')) for (const T of GRID) adds.push(['pump:-1:engineers', T]);
    const got = await trial(adds.filter(([id]) => !champ0.moves.some(mv => mv[0] === id)).map(mv => champ0.moves.concat([mv])), budget());
    const nb = ranked(got.concat([champ0]))[0];
    polished.push(nb !== champ0 && nb.r.m > champ0.r.m ? await refine(nb, [-3, -2, -1, 1, 2, 3], budget, true) : champ0);
  }

  // the best nights found, each set of orders once (the same orders a minute or two apart are one night here)
  const all = [...seen.values()], sets = new Set(), top = [];
  for (const e of ranked(all)) { const s = JSON.stringify(eff(e).map(x => [x.type, x.value, x.arg])); if (sets.has(s)) continue; sets.add(s); top.push(e); if (top.length >= 12) break; }
  // the nights the report shows, run once more for their list before the last ten minutes, their bridge, and whether she
  // was put back onto the ice (an order astern can back her onto the berg: the contact opens her anew)
  const inspectKey = (e) => 'asis|inspect5|' + keyOf(eff(e)), shown = [BASE].concat(top.filter(e => e !== BASE));
  await pool.run(shown.filter(e => !cache.map.has(inspectKey(e))).map(e => ({ key: inspectKey(e), orders: eff(e), inspect: true })), (t, rr) => { cache.put(t.key, rr); computed++; });
  const insOf = (e) => { const x = cache.map.get(inspectKey(e)); return x && x.fp === e.r.fp && x.k === e.r.k ? x.ins : null; };
  // the best nights, as published and rerun: gaining, and not struck by the ice again (a second collision is no remedy)
  const bestN = top.filter(e => e !== BASE && eff(e).length && gainOf(e) > 0 && !struck(e)).slice(0, Math.max(o.robust, 1));

  // 4. robustness: the best nights and the baseline on models with each guess moved
  const models = variantsOf(o.variants, o.seed), rob = [];
  // D5: each member's encounter, found once in the pool (seconds a member) and kept with the nights; it goes with every
  // model on that member, so that no thread finds it again
  const calibs = [...new Set(models.filter(m => m.g.calib !== undefined).map(m => m.g.calib))].sort((a, b) => a - b);
  const iceKey = (i) => 'ice|' + kept().name + '|' + i;
  await pool.run(calibs.filter(i => !cache.map.has(iceKey(i))).map(i => ({ key: iceKey(i), ice: i })), (t, rr) => { cache.put(t.key, rr); computed++; });
  const modelOf = (m) => (m.id === 'asis' ? null : (m.g.calib !== undefined ? { g: m.g, ice: cache.map.get(iceKey(m.g.calib)) } : { g: m.g }));
  const rtasks = [];
  for (const m of models) for (const e of [BASE].concat(bestN.slice(0, o.robust))) {
    const key = modelKey(m) + '|' + keyOf(eff(e));
    rtasks.push({ key, model: modelOf(m), orders: eff(e), m, e });
  }
  const todoR = rtasks.filter(t => !cache.map.has(t.key));
  await pool.run(todoR.map(t => ({ key: t.key, model: t.model, orders: t.orders })), (t, rr) => { cache.put(t.key, rr); computed++; });
  for (const t of rtasks) rob.push({ m: t.m, e: t.e, r: cache.map.get(t.key) });
  // G12 (D94's band): each model's baseline carried on to its flag, run here while the pool and the progress file are open
  const ftasks = models.map(m => ({ key: 'flagbase|' + modelKey(m), model: modelOf(m), orders: [], toFlag: true, m }));
  await pool.run(ftasks.filter(x => !cache.map.has(x.key)).map(x => ({ key: x.key, model: x.model, orders: x.orders, toFlag: true })), (x, rr) => { cache.put(x.key, rr); computed++; });

  // OUTSIDE THE ORDERS: watertight doors held open against their floats. The model has no such order (a raised door's
  // float drops it when water reaches it; the search raises each door once), and nobody in 1912 is recorded doing it
  // (the door note, 10(b): a bet). The validation case "doors left open" says it is the model's largest lever, so the
  // report gives what the model says of it, on every model of the robustness rerun, apart from the search.
  const allDoors = C.BULKHEADS.map((b, i) => (b.doors.length ? i : -1)).filter(i => i >= 0);
  const HOLDS = [
    { id: 'all1', words: 'every door, C to O, held open from T+1', T: 1, doors: allDoors },
    { id: 'all30', words: 'every door held open from T+30, when the engineers began raising them in 1912', T: 30, doors: allDoors },
    { id: 'DEF1', words: 'D, E and F only (the doors between the flooded rooms and boiler room 4) held open from T+1', T: 1, doors: allDoors.filter(b => b >= 3 && b <= 5) },
    { id: 'GO30', words: 'G to O held open from T+30 (the doors raised in 1912, held)', T: 30, doors: allDoors.filter(b => b >= 6) },
  ];
  const htasks = [];
  for (const m of models) for (const h of HOLDS) htasks.push({ key: 'hold|' + modelKey(m) + '|' + h.id + '|' + kOf(base, h.T), model: modelOf(m), orders: [], hold: { k: kOf(base, h.T), doors: h.doors }, m, h });
  await pool.run(htasks.filter(t => !cache.map.has(t.key)).map(t => ({ key: t.key, model: t.model, orders: t.orders, hold: t.hold, inspect: true })), (t, rr) => { cache.put(t.key, rr); computed++; });
  const held = htasks.map(t => ({ m: t.m, h: t.h, r: cache.map.get(t.key) }));

  // the best night's whole log: the 1912 orders and the search's, the refused ones left out (they changed nothing)
  const champion = bestN[0] || BASE;
  const cKey = 'asis|log|' + keyOf(eff(champion));
  if (!cache.map.has(cKey)) await pool.run([{ key: cKey, orders: eff(champion), wantLog: true }], (t, rr) => { cache.put(t.key, rr); computed++; });
  const champ = cache.map.get(cKey);
  pool.close();

  // Carpathia: the help reader's own times (the targets) and her arrival on the best nights
  // (the help reader is not in the progress file's name: its own hash is in this entry's key)
  const worldHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, 'core', 'readers', 'world.js'))).digest('hex').slice(0, 12);
  const aKey = 'asis|arrivals|' + worldHash + '|' + bestN.slice(0, o.robust).map(e => effKey(e)).join('/');
  let arr = cache.map.get(aKey);
  if (!arr) {
    const logs = [];
    let ev = null;
    for (const e of bestN.slice(0, o.robust)) {
      const kL = 'asis|log|' + keyOf(eff(e));
      if (!cache.map.has(kL)) { ev = ev || evaluator(); cache.put(kL, ev({ orders: eff(e), wantLog: true })); computed++; }
      const rr = cache.map.get(kL); logs.push({ log: rr.log, k: rr.k });
    }
    arr = arrivals(ship, logs); cache.put(aKey, arr); computed++;
  }
  cache.close();

  // ------------------------------------------------------------------ the report
  const RB = BASE.r, Tk = (k) => (k * DT - base.tTouch) / 60;
  const words = (ord) => {
    const s = (o2) => {
      if (o2.type === 'door') return (o2.arg ? 'raise' : 'drop') + ' the doors in bulkhead ' + C.BULKHEADS[o2.value].id + ' by hand';
      if (o2.type === 'doors') return 'the bridge\'s switch for the tank-top doors';
      if (o2.type === 'telegraph') return 'engines: ' + o2.value;
      if (o2.type === 'fires') return o2.value < 0 ? 'draw the fires in every boiler room' : 'draw the fires in ' + lc(Sys.PLANT.rooms[o2.value].name);
      if (o2.type === 'pump') {
        if (o2.value === -1) return o2.arg === 'engineers' ? 'the pumps handed back to the engineers' : pname(o2.arg) + ' taken off';
        if (o2.arg === 'all') return 'every free pump that can reach ' + zname(o2.value) + ' put on it';
        if (o2.arg === 'own') return zname(o2.value) + '\'s own pumps put on it';
        if (o2.arg === 'off') return 'every pump taken off ' + zname(o2.value);
        return pname(o2.arg) + ' put on ' + zname(o2.value);
      }
      return o2.type + ' ' + o2.value;
    };
    return 'T+' + fmt(Tk(ord.k), 1) + ' ' + s(ord);
  };
  // what came with a night's minutes: her list before her last ten minutes and her bridge (the inspection run), her lights, her engines
  const stateE = (e) => {
    const i = insOf(e), r0 = e.r, T1 = (x) => (x === null || x === undefined ? 'never' : 'T+' + fmt(x, 1));
    return (i ? 'list ' + fmt(i.list10, 1) + ' at T+' + i.list10T + ' (' + fmt(r0.list, 1) + ' at ' + T1(r0.listT) + ')' : 'list ' + fmt(r0.list, 1) + ' at ' + T1(r0.listT)) +
      '; bridge under ' + (i ? T1(i.bridge) : '?') + '; dynamos ' + T1(r0.power) + '; dark ' + T1(r0.dark) + '; engines lost ' + T1(r0.engines) +
      (r0.again ? '; ON THE ICE AGAIN after the fork: ' + r0.again + ' new openings' : '');
  };
  say('THE CARPATHIA QUESTION: a first search over the orders after the ice (tools/carpathia.js, evaluation ' + EVAL_VERSION + ')');
  say('The night: seed ' + NIGHT_SEED + ' on its own orders. The touch at ' + fmt(base.tTouch, 3) + ' s; the search\'s orders begin at step ' + base.kFork + ', T+' + fmt(Tk(base.kFork), 2) + ' min (T: minutes after the touch).');
  say('Budget: ' + o.nights + ' nights on the model as it stands, seed ' + o.seed + '; ' + spent + ' tried. Robustness: ' + models.length + ' models x ' + (1 + Math.min(o.robust, bestN.length)) + ' nights.');
  say('');
  say('The baseline, no order after the ice: ' + (RB.broke ? 'handed over at the break\'s onset' : 'founders') + ' T+' + fmt(RB.m, 2) + ' (step ' + RB.k + ', fingerprint ' + RB.fp + '); ' + fmt(RB.pumped, 0) + ' t pumped. A night\'s minutes run to her hand-over (G12, D98: the break\'s onset; her flag where she founders first)');
  say('   ' + stateE(BASE));
  say('   (list: her greatest list from T+5 to her last ten minutes, in degrees, and in brackets her greatest of the night: every foundering');
  say('   ends at 80.2, where the core stops a roll. Dynamos: the minute the main dynamos stopped; dark: the minute she went dark;');
  say('   engines lost: the minute from which the plant could give her engines nothing.)');
  say('');
  say('1. ONE ORDER AT A TIME: minutes afloat gained over the baseline. "0" the same night to the bit; "=" changed, within 0.05 min; "ref" refused by the model (the night is the baseline\'s).');
  {
    say('Rooms: ' + [...Array(16).keys()].map(k => zs(k) + ' ' + C.ZONES[k].name.toLowerCase()).join(', ') + '. Pumps: ' + PSHORT.map((s, i) => s + ' ' + pname(i)).join('; ') + '.');
    const head = 'order'.padEnd(40) + MOMENTS.map(T => ('T+' + T).padStart(7)).join('');
    say(head);
    for (const s of SLOTS) {
      if (!s.p1) continue;
      const es = bySlot.get(s.id) || [];
      if (!es.length) continue;
      const cell = (T) => {
        const e = es.find(x => x.moves[0][1] === T);
        if (!e) return ''.padStart(7);
        if (struck(e)) return 'ICE'.padStart(7);
        if (e.r.st.some(x => x.s === 'refused')) return 'ref'.padStart(7);
        if (e.r.fp === RB.fp && e.r.k === RB.k) return '0'.padStart(7);
        const g = gainOf(e); return (Math.abs(g) < 0.05 ? '=' : sgn(g, 1)).padStart(7);
      };
      say(s.lab.slice(0, 39).padEnd(40) + MOMENTS.map(cell).join(''));
    }
    say('the best moment of each, the most first: ' + best1.slice(0, 12).map(x => SLOT[x.id].lab + ' ' + sgn(x.g, 2)).join('; '));
    say('the least: ' + best1.slice(-6).map(x => SLOT[x.id].lab + ' ' + sgn(x.g, 2)).join('; '));
    const nothing = [...bySlot.entries()].filter(([, es]) => es.every(e => e.r.st.some(x => x.s === 'refused') || (e.r.fp === RB.fp && e.r.k === RB.k)));
    say('orders that change no bit of the night at any moment tried: ' + (nothing.length ? nothing.map(([id]) => SLOT[id].lab).join('; ') : 'none'));
    const ice = r1.filter(e => e.moves.length && struck(e));
    say('"ICE": the order backs her onto the berg and the contact opens her anew (not counted as a gain): ' + (ice.length ? ice.map(e => SLOT[e.moves[0][0]].lab + ' at T+' + e.moves[0][1] + ' (' + e.r.again + ' openings, ' + sgn(gainOf(e), 2) + ' min)').join('; ') : 'none'));
  }
  say('');
  say('2. THE HANDFUL THAT MATTER, TOGETHER: ' + (handful.length ? handful.join(', ') : 'none gains a quarter of a minute alone') + (p2log.length ? '; ' + p2log.join('; ') : ''));
  for (const e of refined2) say('   refined: ' + fmt(e.r.m, 2) + ' min, ' + eff(e).map(words).join('; '));
  say('3. RANDOM RESTARTS (seed ' + o.seed + '): ' + r3.length + ' nights; the best of them refined: ' + refined3.map(e => fmt(e.r.m, 2)).join(', '));
  if (o.warm) say('3b. WARM START (--warm ' + path.basename(o.warm) + '): ' + (warm ? 'its night, T+' + fmt(warm.there, 2) + ' where it was measured, read back as ' + warm.moves.length + ' moves; here T+' + fmt(warm.first.r.m, 2) + '; refined: T+' + fmt(warm.refined.r.m, 2) + ', ' + eff(warm.refined).map(words).join('; ') : 'no budget left to run it'));
  say('4. POLISH: the best night then,' + (champ0 ? fmt(champ0.r.m, 2) : '-') + ' min, with one more order: ' + (polished.length ? (polished[0] === champ0 ? 'nothing added helps' : fmt(polished[0].r.m, 2) + ' min') : 'not run (no budget left, or no order to add to)'));
  say('');
  say('THE BEST NIGHTS FOUND (refused orders left out: they change nothing; a night that puts her back onto the ice is shown, and never');
  say('taken as a best night: a second collision is no remedy)');
  say(' #  minutes   gain  orders');
  top.slice(0, 8).forEach((e, i) => {
    say(String(i + 1).padStart(2) + '  ' + fmt(e.r.m, 2).padStart(7) + (e.r.afloat ? '+' : ' ') + sgn(gainOf(e), 2).padStart(6) + '  ' + (eff(e).length ? eff(e).map(words).join('; ') : 'no order after the ice'));
    say('                     ' + stateE(e) + '; ' + fmt(e.r.pumped, 0) + ' t pumped');
  });
  say('');
  // D5: a model whose own baseline founders outside the kept set's band is flagged and left out of every count (auditor
  // E's remedy 3); the kept members are inside it by construction, guesses moved on them may not be
  const BAND = kept().band, inBand = (b) => b >= BAND[0] && b <= BAND[1];
  // G12: since the switch a model's baseline ends at its hand-over; the band is the history match's screen on the watch's
  // FOUNDER, so each model's baseline is also carried on to its flag (the same night, the onset's check taken out)
  const flagBase = new Map(ftasks.map(x => [x.m, cache.map.get(x.key).m]));
  const baseOf = (m) => flagBase.get(m), flagged = new Set(models.filter(m => !inBand(baseOf(m))));
  const counted = models.filter(m => !flagged.has(m)), TARGETS = [['five miles made good', arr.fiveMiles.carpathia], ['the call at once', arr.callAtOnce.carpathia], ['as the night went', arr.asWent.carpathia]];
  say('ROBUSTNESS: the baseline and the best ' + Math.min(o.robust, bestN.length) + ' night(s) on ' + models.length + ' models (minutes afloat; in brackets the gain over that model\'s own baseline).');
  say('THE BAND (D94): a model counts when its own baseline, the watch on its own orders carried on to her flag, founders ' + BAND.join(' to ') + ' min after the touch (the kept set\'s band, out/kept_1912.json); ' + counted.length + ' of the ' + models.length + ' models are in it, the N of every count below; ' + flagged.size + ' flagged * and left out.');
  const robRows = (e) => counted.map(m => { const row = rob.filter(x => x.m === m); return { m, b: row.find(x => x.e === BASE).r.m, n: row.find(x => x.e === e).r.m }; });
  {
    const nb = Math.min(o.robust, bestN.length);
    say('model'.padEnd(44) + 'baseline'.padStart(9) + bestN.slice(0, nb).map((e, i) => ('night ' + (i + 1)).padStart(18)).join(''));
    for (const m of models) {
      const row = rob.filter(x => x.m === m), b0 = row.find(x => x.e === BASE);
      say((flagged.has(m) ? '* ' : '') + m.name.slice(0, flagged.has(m) ? 41 : 43).padEnd(flagged.has(m) ? 42 : 44) + fmt(b0.r.m, 2).padStart(9) + bestN.slice(0, nb).map(e => { const x = row.find(y => y.e === e); return (fmt(x.r.m, 2) + ' (' + sgn(x.r.m - b0.r.m, 2) + ')').padStart(18); }).join(''));
    }
    for (let i = 0; i < nb; i++) {
      const e = bestN[i], g0 = gainOf(e);
      const rows = robRows(e);
      const holds = rows.filter(x => x.n - x.b >= 0.5 * g0 && x.n - x.b >= 0.5).length, still = rows.filter(x => x.n >= e.r.m - 0.5).length, helps = rows.filter(x => x.n - x.b > 0.05).length;
      say('night ' + (i + 1) + ' (gain ' + sgn(g0, 2) + ' on the model as it stands): its gain holds (at least half of it, and half a minute) in ' + holds + ' of ' + rows.length + ' models; it lasts as long (within half a minute) in ' + still + '; it helps at all in ' + helps);
      say('   past the target (D22) in: ' + TARGETS.map(([w, T]) => rows.filter(x => x.n >= T).length + ' of ' + rows.length + ' (T+' + fmt(T, 1) + ', ' + w + ')').join('; '));
      const mem = rows.filter(x => /^member-/.test(x.m.id)), mg = mem.map(x => x.n - x.b).sort((p, q) => p - q);
      if (mem.length) say('   on the kept set\'s members alone (' + mem.length + ' in the band): her end T+' + fmt(Math.min(...mem.map(x => x.n)), 2) + ' to T+' + fmt(Math.max(...mem.map(x => x.n)), 2) + '; its gain ' + sgn(mg[0], 2) + ' to ' + sgn(mg[mg.length - 1], 2) + ', median ' + sgn(mg[Math.floor(mg.length / 2)], 2) + '; it helps in ' + mem.filter(x => x.n - x.b > 0.05).length);
      const flips = GUESSES.filter(G => { const a = rows.find(x => x.m.id === G.id + '-lo'), b = rows.find(x => x.m.id === G.id + '-hi'); return [a, b].filter(Boolean).some(x => !(x.n - x.b >= 0.5 * g0 && x.n - x.b >= 0.5)); }).map(G => G.id);
      say('   one guess moved alone, and the gain does not hold: ' + (flips.length ? flips.join(', ') : 'none'));
      const asis = rows.find(x => x.m.id === 'asis'), xa = asis ? rob.find(y => y.m === asis.m && y.e === e) : null;
      if (xa) say('   its orders carried out, alone, on the model as it stands: ' + (xa.r.fp === e.r.fp && xa.r.k === e.r.k ? 'the same night to the bit (fingerprint ' + xa.r.fp + ')' : 'NOT the same night: ' + xa.r.fp + ' against ' + e.r.fp));
    }
  }
  say('');
  say('CARPATHIA, from the help reader (core/readers/world.js): alongside T+' + fmt(arr.asWent.carpathia, 2) + ' as the night went (she needed ' + fmt(arr.asWent.carpathia - RB.m, 1) + ' min more); T+' + fmt(arr.callAtOnce.carpathia, 2) + ' with the call made at once (' + fmt(arr.callAtOnce.carpathia - RB.m, 1) + '); T+' + fmt(arr.fiveMiles.carpathia, 2) + ' with five miles made good as well (' + fmt(arr.fiveMiles.carpathia - RB.m, 1) + '; that night itself founders T+' + fmt(arr.fiveMiles.founders, 2) + ')');
  arr.nights.forEach((a, i) => say('   night ' + (i + 1) + ': Carpathia alongside T+' + fmt(a.carpathia, 2) + ' on its own track (the 1912 call); replayed from the start it ends T+' + fmt(a.over ? (a.endT - base.tTouch) / 60 : null, 2) + ', fingerprint ' + a.fp + (a.fp === bestN[i].r.fp ? ' (the fork\'s)' : ' (NOT the fork\'s ' + bestN[i].r.fp + ')')));

  say('');
  say('OUTSIDE THE ORDERS, not searched and not a night to publish: watertight doors held open against their floats. The model has no such');
  say('order (a raised door\'s float drops it when water reaches it); here the floats are disarmed in the copy. Minutes afloat on the model as');
  say('it stands (the gain in brackets); her list from T+5 to her last ten minutes; then over the ' + counted.length + ' models in the band (' + flagged.size + ' flagged, left out): the least, the median and the');
  say('most gain over each model\'s own baseline, and in how many she lasts past Carpathia with five miles made good (T+' + fmt(arr.fiveMiles.carpathia, 1) + '),');
  say('with the call at once (T+' + fmt(arr.callAtOnce.carpathia, 1) + ') and as the night went (T+' + fmt(arr.asWent.carpathia, 1) + ').');
  const heldRows = (h, all) => (all ? models : counted).map(m => { const x = held.find(y => y.m === m && y.h === h), b = rob.find(y => y.m === m && y.e === BASE); return { m, n: x.r.m, b: b.r.m, afloat: x.r.afloat, ins: x.r.ins, power: x.r.power, dark: x.r.dark, flagged: flagged.has(m) }; });
  for (const h of HOLDS) {
    const rows = heldRows(h), a = heldRows(h, true).find(x => x.m.id === 'asis'), gains = rows.map(x => x.n - x.b).sort((p, q) => p - q), past = (T) => rows.filter(x => x.n >= T).length;
    say('  ' + h.words + ': T+' + fmt(a.n, 2) + (a.afloat ? ' (afloat)' : '') + ' (' + sgn(a.n - a.b, 2) + '); list ' + (a.ins ? fmt(a.ins.list10, 1) + ' at T+' + a.ins.list10T : '-') +
      '; dynamos stop ' + (a.power === null ? 'never' : 'T+' + fmt(a.power, 1)) + '; dark ' + (a.dark === null ? 'never' : 'T+' + fmt(a.dark, 1)) +
      '; gain least ' + sgn(gains[0], 1) + ', median ' + sgn(gains[Math.floor(gains.length / 2)], 1) + ', most ' + sgn(gains[gains.length - 1], 1) +
      '; past T+' + fmt(arr.fiveMiles.carpathia, 1) + ' in ' + past(arr.fiveMiles.carpathia) + ', T+' + fmt(arr.callAtOnce.carpathia, 1) + ' in ' + past(arr.callAtOnce.carpathia) + ', T+' + fmt(arr.asWent.carpathia, 1) + ' in ' + past(arr.asWent.carpathia) + ' of ' + rows.length);
    const flips = GUESSES.filter(G => [G.id + '-lo', G.id + '-hi'].some(id => { const x = rows.find(y => y.m.id === id); return x && a.n - a.b > 0.5 && !(x.n - x.b >= 0.5 * (a.n - a.b)); })).map(G => G.id);
    say('     one guess moved alone and less than half of that gain is left: ' + (flips.length ? flips.join(', ') : 'none'));
  }

  // the best night's log, for Night.replay and the page's address (site/parts/40_night_end.js, encodeLog)
  const enc = encLog;
  const clean = champ.log.filter(x => !x.refused).map(x => (x.arg === undefined ? { k: x.k, type: x.type, value: x.value } : { k: x.k, type: x.type, value: x.value, arg: x.arg }));
  const best = {
    what: 'The best night found by tools/carpathia.js: seed 1912, its own orders to the touch and a minute after, then the search\'s. Replay: Night.replay(ship, Night.spec(seed), log, k) ends at endT, her hand-over (the break\'s onset since G12; founderT is her flag where she founders first), with this fingerprint.',
    seed: NIGHT_SEED, gen: N.GEN, k: champ.k, founderT: champ.founderT, foundered: !champ.afloat, minutes: champ.m, fingerprint: champ.fp, endT: champ.endT, broke: !!champ.broke,
    baseline: { minutes: RB.m, k: RB.k, fingerprint: RB.fp },
    orders: eff(champion).map(x => ({ k: x.k, T: +Tk(x.k).toFixed(2), words: words(x).replace(/^T\+[\d.]+ /, '') })),
    log: clean, address: '#night=' + NIGHT_SEED + '&log=' + enc(clean),
    search: { evaluation: EVAL_VERSION, nights: o.nights, tried: spent, seed: o.seed, variants: models.length, kept: kept().name, band: BAND, warm: o.warm ? path.basename(o.warm) : null },
  };
  // D5, D22's words for the best night: on how many of the models in the band (N) it lasts past each target, its gain
  // holds and it helps at all; the flagged models left out
  if (champion !== BASE) {
    const rows = robRows(champion), g0 = gainOf(champion), keys = ['fiveMiles', 'callAtOnce', 'asWent'];
    best.robust = { band: BAND, models: models.length, N: rows.length, flagged: flagged.size, past: Object.fromEntries(TARGETS.map(([w, T], i) => [keys[i], rows.filter(x => x.n >= T).length])),
      targets: Object.fromEntries(TARGETS.map(([w, T], i) => [keys[i], T])), holds: rows.filter(x => x.n - x.b >= 0.5 * g0 && x.n - x.b >= 0.5).length, helps: rows.filter(x => x.n - x.b > 0.05).length,
      members: rows.filter(x => /^member-/.test(x.m.id)).length };
  }
  say('');
  say('THE BEST NIGHT: ' + fmt(champ.m, 2) + ' min (' + sgn(champ.m - RB.m, 2) + '), fingerprint ' + champ.fp + '; its address: ' + best.address);
  fs.mkdirSync(path.dirname(o.out), { recursive: true });
  fs.writeFileSync(o.out, JSON.stringify(best, null, 1) + '\n');
  const text = lines.join('\n') + '\n', tag = 'seed' + o.seed + '_n' + o.nights + '_v' + o.variants;
  fs.writeFileSync(path.join(o.state, 'report_' + tag + '.txt'), text);
  // the same tables as data, for a note to be made from rather than copied by hand
  const nightOf = (e) => ({ minutes: e.r.m, gain: gainOf(e), afloat: e.r.afloat, again: e.r.again, fp: e.r.fp, k: e.r.k, pumped: e.r.pumped, list: e.r.list, listT: e.r.listT, power: e.r.power, dark: e.r.dark, engines: e.r.engines, ins: insOf(e), orders: eff(e).map(x => ({ T: +Tk(x.k).toFixed(2), k: x.k, words: words(x).replace(/^T\+[\d.]+ /, '') })) });
  fs.writeFileSync(path.join(o.state, 'summary_' + tag + '.json'), JSON.stringify({
    baseline: nightOf(BASE), moments: MOMENTS,
    one: SLOTS.filter(s => s.p1 && bySlot.has(s.id)).map(s => ({ id: s.id, lab: s.lab, words: s.words, cells: bySlot.get(s.id).map(e => ({ T: e.moves[0][1], gain: gainOf(e), ice: struck(e), refused: e.r.st.some(x => x.s === 'refused'), same: e.r.fp === RB.fp && e.r.k === RB.k })) })),
    handful, p2log, refined2: refined2.map(nightOf), refined3: refined3.map(nightOf), polished: polished.map(nightOf), random: r3.length, tried: spent,
    top: top.map(nightOf), best: bestN.map(nightOf),
    robustness: models.map(m => ({ id: m.id, name: m.name, g: m.g, baseline: rob.find(x => x.m === m && x.e === BASE).r.m, nights: bestN.slice(0, o.robust).map(e => rob.find(x => x.m === m && x.e === e).r.m), flagged: flagged.has(m) })),
    arrivals: arr, address: best.address,
    holds: HOLDS.map(h => ({ id: h.id, words: h.words, T: h.T, doors: h.doors.map(b => C.BULKHEADS[b].id), rows: heldRows(h, true).map(x => ({ id: x.m.id, name: x.m.name, minutes: x.n, baseline: x.b, afloat: x.afloat, list10: x.ins ? x.ins.list10 : null, list10T: x.ins ? x.ins.list10T : null, power: x.power, dark: x.dark, flagged: x.flagged })) })),
    kept: kept().name, band: BAND, robust: best.robust || null,
    warm: warm ? { file: warm.file, there: warm.there, moves: warm.moves, first: nightOf(warm.first), refined: nightOf(warm.refined) } : null,
  }, null, 1) + '\n');
  process.stdout.write(text);
  console.log('(' + ((Date.now() - t0) / 1000).toFixed(0) + ' s; ' + computed + ' computed, ' + cache.had + ' read back from ' + path.relative(ROOT, cache.file) + ' (a night or a set of arrivals a line); ' + o.jobs + ' thread(s); best night written to ' + path.relative(ROOT, o.out) + ')');
}

module.exports = { GUESSES, SLOTS, SLOT, forkOf, play, give, setModel, evaluator, expand, kOf, keyOf, canon, carriedOut, variantsOf, modelKey, movesOf, NIGHT_SEED, EVAL_VERSION };
if (isMainThread && require.main === module) main().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
