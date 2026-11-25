// NH2: her rooms, and when the water came (core/readers/cabins.js, the cabin view's headless library;
// docs/BRAINSTORM_the_next_horizon_v1_2026-11-23.md, section 3, NH2), against R3's tables (data/rooms) and the 1912
// damage preset.
//   node tools/cabins_tests.js      (about half a minute; writes out/cabins_1912.txt through tools/outdir.js)
// MUST rows:
// - the index: built from every table in data/rooms (openings.json passed over), the tables untouched, the same index
//   from them in any order; the plans' forms of a stateroom number read as R3 writes them;
// - every stateroom number in the plans' lists resolves to exactly one row (R3's tables name five numbers twice: the
//   library's stated order settles them, and each is printed as a finding for R3's tables);
// - the lookups a reader types, and the rooms found by name;
// - (the people in her staterooms, data/rooms/occupants_1912.json, are tools/occupants_tests.js's; here the index
//   carries them, so the reverse order and the bundled library hold them too);
// - every row maps to an existing slab of rooms.js on its own deck, but rows tagged 'beyond the model';
// - each row's first-wet time equals rooms.js's slab on the 1912 preset at the same step (the suite's own reading of
//   rooms.js's waterOf against the threshold, every step);
// - the depth's level: each space's level, found as rooms.js finds it, gives back rooms.js's share-out in every slab;
// - the library is pure: the 1912 watch, read by it every step, has the fingerprint and the state of one never read,
//   and no state of the library is in the sim or in the forecast's copy.
// CHECK rows: the tie's rule in R3's rows (a block numbered all odd or all even), and the plans' side rule beside it;
// the threshold's bet (a tenth and ten times); the levels against the core's own; the table of the staterooms by deck
// with their first-wet times (out/cabins_1912.txt, tracked; stage D's refit rewrites it).
'use strict';
const fs = require('fs');
const path = require('path');
const C = require('../core/core.js');
const SC = require('../core/scenarios.js');
const N = require('../core/night.js');
const R = require('../core/readers/rooms.js');
const K = require('../core/readers/cabins.js');
const outFile = require('./outdir');

const lines = [], say = (s) => { lines.push(s === undefined ? '' : s); console.log(s === undefined ? '' : s); };
const musts = []; let fails = 0;
function must(what, value, ref, ok) { musts.push([what, value, ref, ok]); if (!ok) fails++; }
const checks = [];
function check(what, value, ref, ok) { checks.push([what, value, ref, ok]); }
const f = (x, n) => (x === null || x === undefined || Number.isNaN(x) ? 'n/a' : (+x).toFixed(n === undefined ? 2 : n));
const DIR = path.join(__dirname, '..', 'data', 'rooms');
const DECKS = K.DECKS;
const code = (z) => { const c = K.compartment(z); return (c.fwd || 'stem') + '-' + (c.aft || 'stern'); };
const sideOf = (s) => (s ? 'stbd' : 'port');

// ---------------------------------------------------------------- 1. the index
const files = fs.readdirSync(DIR).filter((x) => x.endsWith('.json')).sort();
const tables = files.map((x) => JSON.parse(fs.readFileSync(path.join(DIR, x), 'utf8')));
const before = JSON.stringify(tables);
const I = K.index(tables);
const sig0 = (J) => [J.decks, J.rows.map((e) => [e.id, e.labels]), [...J.byLabel].map(([l, e]) => [l, e.id]), J.conflicts, J.unresolved];
const sig = (J) => JSON.stringify(sig0(J).concat([J.rows.map((e) => (e.people || []).map((p) => p.n)), J.people ? [J.people.lines, J.people.names, J.people.placed, J.people.unplaced.map((u) => u.n)] : null]));
const again = K.index(tables.slice().reverse());
must('the index: every table in data/rooms (' + files.length + ' files; openings.json is not a deck\'s and is passed over, occupants_1912.json gives the people in her staterooms); the tables untouched; the same index, people and all, from them in reverse order',
  I.decks.join(' ') + '; ' + I.rows.length + ' rows; tables ' + (JSON.stringify(tables) === before ? 'untouched' : 'CHANGED') + '; reversed ' + (sig(again) === sig(I) ? 'the same' : 'DIFFERENT'),
  'the nine decks, orlop to Boat', I.decks.join(' ') === DECKS.join(' ') && JSON.stringify(tables) === before && sig(again) === sig(I));

// the plans' forms, as R3 writes them
{
  const one = (s) => K.labels(s).map((l) => l.label + (l.berths ? '/' + l.berths : '') + (l.how === 'part' ? '/part' : l.how === 'range' ? '/range' : '')).join(' ');
  const cases = [
    ['C 102; C 100; GENTS LAV', 'C 102 C 100'],
    ['E 1 2; E 2 2; BATH (three)', 'E 1/2 E 2/2'],
    ['F 45* 2; F 47* 2; F 49* 4 (starboard); BATH*', 'F 45/2 F 47/2 F 49/4'],
    ['A 36 (printed A-36); BATH; W.C.', 'A 36'],
    ['D 36 (3 berths, mostly); 1ST CLASS STATEROOMS', 'D 36'],
    ['GENTS LAVATORY; D 40; D 42 (in part)', 'D 40 D 42/part'],
    ['#224** 2; #9A** 8; #141*; UP', '#224/2 #9A/8 #141'],
    ['2 - ASST 2ND STEWARDS**; A E; D (two); NO 4 HATCH', ''],
  ];
  const bad = cases.filter(([s, want]) => one(s) !== want).map(([s, want]) => JSON.stringify(s) + ' gave "' + one(s) + '", not "' + want + '"');
  const n = (s) => K.labels(s).length;
  const r21 = n('#103** to #123** (21 cabins, 2 to 4 berths)'), rEven = n('#140* to #162* (even numbers; 2 to 6 berths); CHIEF 3RD CL STEWARD'), rOdd = n('#139* to #167* (odd numbers, with #164, #166; 2 to 6 berths); MATRON*');
  must('the plans\' forms of a stateroom number: "C 102", "E 1 2" (its berths), "F 45* 2" (the plan\'s mark), "A 36 (printed A-36)", "D 42 (in part)", "#9A** 8"; the words that are not numbers; the three ranges, split at their semicolons only outside brackets',
    (bad.length ? bad.join('; ') : cases.length + ' lists read as written') + '; ranges ' + r21 + ', ' + rEven + ', ' + rOdd + ' numbers', 'every list as written; 21 (its own count), 12 (even 140 to 162), 17 (odd 139 to 167, with 164 and 166)',
    !bad.length && r21 === 21 && rEven === 12 && rOdd === 17);
}

// every stateroom number resolves to exactly one row
{
  const named = new Map();
  for (const e of I.rows) for (const l of K.labels(e.plan)) { if (!named.has(l.label)) named.set(l.label, new Set()); named.get(l.label).add(e.id); }
  const lost = [...named.keys()].filter((l) => !I.byLabel.has(l));
  const listed = new Map();
  for (const e of I.rows) for (const l of e.labels) listed.set(l, (listed.get(l) || []).concat(e.id));
  const off = [...I.byLabel].filter(([l, e]) => (listed.get(l) || []).length !== 1 || listed.get(l)[0] !== e.id).map(([l]) => l);
  const twice = [...named].filter(([, s]) => s.size > 1).map(([l]) => l);
  const lettered = [...I.byLabel.keys()].filter((l) => l[0] !== '#').length;
  must('every stateroom number in the plans\' lists resolves to exactly one row (a number two rows name: the stronger naming holds it, then its block\'s parity; each case below)',
    named.size + ' numbers (' + lettered + ' with a deck\'s letter, ' + (named.size - lettered) + ' as #) in ' + I.rows.filter((e) => e.labels.length).length + ' rows; named by two rows: ' + twice.length + ', settled ' + I.conflicts.filter((c) => c.to).length + '; unresolved ' + I.unresolved.length + '; lost ' + lost.length + '; rows\' lists off ' + off.length,
    'each to one row; none unresolved, lost or off', I.unresolved.length === 0 && lost.length === 0 && off.length === 0 && twice.length === I.conflicts.length && I.conflicts.every((c) => c.to));
}

// the tie's rule, a block on one side of a passage numbered all odd or all even, in R3's rows wholly on one side; and,
// beside it, the rule the first-class plans keep (even numbers to port), which the third-class numbers do not
{
  const num = (l) => parseInt(l.replace(/^[A-G] |^#/, ''), 10);
  let n = 0, kept = 0, nSide = 0, keptSide = 0;
  const mixed = [], against = new Map();
  for (const e of I.rows) {
    const sides = new Set(e.pieces.map((p) => p.side));
    const listed = K.labels(e.plan).filter((l) => l.how !== 'range').map((l) => l.label);
    if (sides.size !== 1 || listed.length < 2) continue;
    const odd = listed.filter((l) => num(l) % 2 === 1).length, most = Math.max(odd, listed.length - odd);
    n += listed.length; kept += most;
    if (most < listed.length) mixed.push(e.id + ' (' + (listed.length - most) + ' of ' + listed.length + ')');
    const side = [...sides][0];
    for (const l of listed) { nSide++; if ((num(l) % 2) === side) keptSide++; else { const k = e.deck + (l[0] === '#' ? ' #' : ''); against.set(k, (against.get(k) || 0) + 1); } }
  }
  // the tie's rule is no rule of the plans (E deck's first class numbers its blocks straight through), so each tie it
  // settles must be clear on its own: the kept row's other numbers all of the number's parity, the other's none
  const ties = I.conflicts.filter((c) => /parity/.test(c.rule || ''));
  const ev = ties.map((c) => c.label + ': ' + c.named.map((x) => {
    const o = K.labels(I.byId.get(x.id).plan).filter((l) => l.how !== 'range' && l.label !== c.label);
    return x.id + ' ' + o.filter((l) => num(l.label) % 2 === num(c.label) % 2).length + ' of ' + o.length;
  }).join(', ') + ' -> ' + c.to);
  const clear = ties.every((c) => c.named.every((x) => {
    const o = K.labels(I.byId.get(x.id).plan).filter((l) => l.how !== 'range' && l.label !== c.label), same = o.filter((l) => num(l.label) % 2 === num(c.label) % 2).length;
    return x.id === c.to ? same === o.length && o.length > 0 : same === 0;
  }));
  check('each number settled by its block\'s parity is clear: the kept row\'s other numbers all share its parity, the other row\'s none (the rule is the library\'s, not the plans\': ' + kept + ' of ' + n + ' numbers in one-sided rows share their row\'s parity; even to port, odd to starboard ' + keptSide + ' of ' + nSide + ')',
    (ev.join('; ') || 'no such tie') + (mixed.length ? '; rows that mix: ' + mixed.slice(0, 8).join(', ') + (mixed.length > 8 ? ' and ' + (mixed.length - 8) + ' more' : '') : ''), 'each tie clear', clear);
}

// the lookups a reader types, and the rooms by name
{
  const want = [['C 102', 'C-021'], ['c102', 'C-021'], ['C-102', 'C-021'], [' C 102 ', 'C-021'], ['E 200', 'E-033'], ['#139', 'E-108'], ['139', 'E-108'], ['#9A', 'E-028'], ['9a', 'E-028'],
    ['#224', 'G-011'], ['F 4', 'F-080'], ['D 42', 'D-017'], ['A 36', 'A-009'], ['B 98', 'B-017'], ['C-021', 'C-021'], ['Bt-04', 'Bt-04'], ['e-sr1', 'E-SR1'], ['Z 9', null], ['C 999', null], ['', null], ['F 3', null]];
  const bad = want.filter(([q, id]) => { const e = K.find(I, q); return (e ? e.id : null) !== id; }).map(([q, id]) => JSON.stringify(q) + ' gave ' + ((K.find(I, q) || {}).id || 'none') + ', not ' + (id || 'none'));
  must('the lookups: a stateroom number as a reader types it (any case, with or without its space or a hyphen; # or none for a third-class number) or a row\'s id; none where the tables have no such room',
    bad.length ? bad.join('; ') : want.length + ' queries, each to its row (or none)', 'C 102 is C-021 in every form; #139 E-108; F 4 F-080; Z 9, C 999 and F 3 none', !bad.length);
  const first = [['swimming bath', ['F-042']], ['Turkish bath', ['F-045', 'F-046', 'F-047', 'F-048', 'F-055']], ['Cafe Parisien', ['B-010']], ['Caf\u00e9 Parisien', ['B-010']],
    ['Scotland Road', ['E-SR1', 'E-SR2', 'E-SR3', 'E-SR4', 'E-SR5', 'E-SR6', 'E-SR7', 'E-SR8']], ['post office', ['G-018']], ['gymnasium', ['Bt-07']], ['squash', ['F-024', 'G-020', 'F-025']]];
  const badN = first.filter(([q, ids]) => K.search(I, q, ids.length).map((e) => e.id).join(' ') !== ids.join(' ')).map(([q, ids]) => q + ': ' + K.search(I, q, ids.length).map((e) => e.id).join(' ') + ', not ' + ids.join(' '));
  must('by name: a room the record names comes first (the name begins with the words; then the name holds them; then the name and the plan do)',
    badN.length ? badN.join('; ') : first.map(([q, ids]) => q + ' ' + ids[0]).join(', '), 'each first', !badN.length);
}

// ---------------------------------------------------------------- 2. the rows against rooms.js's slabs
const ship = C.buildShip(), T = R.table(ship);
{
  const floorOf = (d) => (d === 'orlop' ? 'below G' : d);
  let pieces = 0;
  const bad = [], none = [], outside = [];
  for (const e of I.rows) {
    if (!e.pieces.length) { none.push(e); continue; }
    for (const p of e.pieces) {
      pieces++;
      const s = T.list[p.slab];
      if (p.slab < 0 || !s) { outside.push([e, p]); continue; }
      if (s.key !== p.key || s.zone !== p.zone || s.side !== p.side || s.floor !== floorOf(e.deck)) bad.push(e.id + ' piece ' + p.key + ' against slab ' + p.slab + ' ' + s.key);
    }
  }
  const untagged = none.filter((e) => !e.beyond).map((e) => e.id).concat(outside.filter(([e]) => !e.beyond).map(([e]) => e.id));
  const outRows = [...new Set(outside.map(([e]) => e.id))].map((id) => id + ' (' + outside.filter(([e]) => e.id === id).length + ' of ' + I.byId.get(id).pieces.length + ' pieces)');
  must('every row maps to an existing slab: each piece names a slab of rooms.js\'s table with its own zone, side and key, standing on the row\'s deck (the orlop\'s rooms below G deck); a row with no piece, or a piece where the model has no space, is tagged \'beyond the model\'',
    I.rows.length + ' rows, ' + pieces + ' pieces; wrong slab ' + bad.length + '; no piece: ' + (none.map((e) => e.id).join(', ') || 'none') + '; outside the model\'s spaces: ' + (outRows.join(', ') || 'none') + '; untagged among them ' + untagged.length,
    'every piece on its slab; the exceptions tagged', bad.length === 0 && untagged.length === 0 && none.length + outside.length > 0);
}

// ---------------------------------------------------------------- 3. the 1912 damage preset, every step
const P = SC.PRESETS.titanic, BASE = P.clock.h * 3600 + P.clock.m * 60;
const sim = C.createSim(ship, {}, P.build({}));
const tr = K.track(ship), tLo = K.track(ship, { wet: K.WET / 10 }), tHi = K.track(ship, { wet: K.WET * 10 });
const own = T.list.map(() => null);   // the suite's own reading: rooms.js's waterOf against WET times the slab's floor
// the pockets' water rooms.js puts in a space's lowest slab (min(vol, cap); a pocket of both sides half to each half)
const pocketShare = (s) => {
  const n = T.list[s].n;
  if (T.byNode[n][0] !== s) return 0;
  let v = 0;
  for (const p of sim.pockets || []) { const h = Math.min(p.vol, p.cap); if (!(h > 0)) continue; if (p.side < 0) { if (p.node === n || p.node - 2 === n) v += 0.5 * h; } else if (p.node === n) v += h; }
  return v;
};
let k = 0, nextMin = 60, worstErr = 0, nLevels = 0, nSlabs = 0;
let costObs = 0n, nObs = 0, pending = null;
const vsCore = [];
// the depth over the room's deck at its place, every ten minutes and when she founders: a slice through her forward
// decks, from the post office on G deck to A 1 and A 2
const SLICE = ['G-018', 'F-009', 'E-SR1', 'E-034', 'D-014', 'C-070', 'B-034', 'A-034'].map((id) => I.byId.get(id)).filter(Boolean);
const series = new Map(SLICE.map((e) => [e, []]));
let nextTen = 600, at30 = null;
const SANDBOX_STEPS = 30 * 60 * 4;      // the first thirty minutes, for the library as the page bundles it (section 3b)
while (!sim.foundered && sim.t < 5 * 3600) {
  C.step(sim);
  k++;
  // the levels found after the last minute's step, against the core's own solve of that water at this step's start
  if (pending) {
    for (const p of pending) vsCore.push({ d: Math.abs(p.level - sim.level[p.n]), n: p.n, t: p.t, trim: p.trim, merged: sim.merged[(p.n >> 2) * 2 + (p.n & 1)] });
    pending = null;
  }
  const w = R.waterOf(sim);
  for (let s = 0; s < T.list.length; s++) if (own[s] === null && w[s] >= K.WET * T.list[s].foot) own[s] = { t: sim.t, step: k };
  const a = process.hrtime.bigint();
  K.observe(tr, sim);                  // the library's own share-out
  costObs += process.hrtime.bigint() - a; nObs++;
  K.observe(tLo, sim, w);
  K.observe(tHi, sim, w);
  if (k === SANDBOX_STEPS) at30 = JSON.stringify(tr);
  if (sim.t >= nextTen) {
    nextTen += 600;
    const lv = K.levels(sim);
    for (const e of SLICE) series.get(e).push({ t: sim.t, d: K.depth(I, sim, e, w, lv) });
  }
  if (sim.t >= nextMin) {
    // every minute: each space's level as the library finds it, and every slab's water below it against rooms.js's
    nextMin += 60;
    const F = sim._F || C.frameOf(sim), trim = Math.abs(sim.pitch) * 180 / Math.PI;
    pending = [];
    for (const L of K.levels(sim, F)) {
      if (L.dry || L.full) continue;
      nLevels++;
      for (const s of T.byNode[L.n]) {
        nSlabs++;
        worstErr = Math.max(worstErr, Math.abs(K.slabCut(sim, s, L.level, F) + pocketShare(s) - w[s]) / T.list[s].vmax);
      }
      // kept for the core's own level at the next step, away from the space's floor and top (there a few m3 move a
      // level far)
      const fill = sim.vol[L.n] / ship.nodeVmax[L.n];
      if (fill >= 0.05 && fill <= 0.95) pending.push({ n: L.n, level: L.level, t: sim.t, trim });
    }
  }
}
const founderT = sim.founderT, founderK = k;
{ const w = R.waterOf(sim), lv = K.levels(sim); for (const e of SLICE) series.get(e).push({ t: sim.t, d: K.depth(I, sim, e, w, lv), end: true }); }
// each row's first-wet: the library's against the suite's own reading of its slabs
{
  let n = 0, wet = 0;
  const bad = [];
  for (const e of I.rows) {
    const slabs = e.pieces.filter((p) => p.slab >= 0).map((p) => p.slab);
    if (!slabs.length) continue;
    n++;
    let want = null;
    for (const s of slabs) if (own[s] && (!want || own[s].t < want.t)) want = own[s];
    const got = K.firstWet(tr, e);
    if (want) wet++;
    const same = want ? !!got && got.t === want.t && got.step === want.step && own[got.slab] && own[got.slab].t === got.t : got === null;
    if (!same) bad.push(e.id + ': ' + (got ? 'T ' + f(got.t / 60) + ' step ' + got.step : 'dry') + ' against ' + (want ? 'T ' + f(want.t / 60) + ' step ' + want.step : 'dry'));
  }
  must('each row\'s first-wet time on the 1912 preset is rooms.js\'s: the earliest step at which one of its slabs holds ' + K.WET * 100 + ' cm of water over its floor (waterOf, read by the suite every step)',
    bad.length ? bad.slice(0, 6).join('; ') : n + ' rows with slabs: ' + wet + ' wet before she founders (T ' + f(founderT / 60) + ', step ' + founderK + '), ' + (n - wet) + ' dry; every time and step the same', 'the same step for every row', !bad.length && n > 500);
}
must('the depth\'s level: each partly wet space\'s level, found as rooms.js finds it, gives back rooms.js\'s share-out in every one of its slabs (the water below it, its pockets\' with it in the lowest)',
  nLevels + ' levels at every minute, ' + nSlabs + ' slabs: the worst off by ' + worstErr.toExponential(1) + ' of its capacity', 'under 1e-9 of capacity', worstErr < 1e-9 && nLevels > 0);
{
  // the core holds a merged pair (both sides of a space joined) at one level and shares its water anew each step;
  // rooms.js levels each side's own water, so a step's inflow to one side stands apart until the core's next share
  const worst = (list) => list.reduce((a, b) => (!a || b.d > a.d ? b : a), null);
  const say1 = (x) => (x ? f(x.d * 1000, 1) + ' mm (space ' + x.n + (x.merged ? ', a merged pair' : '') + ', T ' + f(x.t / 60, 0) + ', trim ' + f(x.trim, 0) + ' deg)' : 'none');
  const early = (m) => vsCore.filter((x) => !!x.merged === m && x.t < founderT - 600), late = (m) => vsCore.filter((x) => !!x.merged === m && x.t >= founderT - 600);
  const we = worst(early(false).concat(early(true)));
  check('those levels against the core\'s own solve of the same water (sim.level at the next step: in the step the core solves its levels in at most six iterations to 0.5 m3, and holds a merged pair\'s two sides at one level, sharing their water anew each step), in spaces 5 to 95 % full (nearer their floor or top a few m3 move a level by up to a metre)',
    vsCore.length + ' levels; until ten minutes before she founders: alone ' + early(false).length + ', the worst ' + say1(worst(early(false))) + '; merged ' + early(true).length + ', the worst ' + say1(worst(early(true))) + '; in her last ten minutes: alone ' + say1(worst(late(false))) + ', merged ' + say1(worst(late(true))),
    'within 3 cm until her last ten minutes (the core\'s own solve in the step)', !!we && we.d < 0.03);
}

// ---------------------------------------------------------------- 3b. the library as the page bundles it
// The build bundles core/readers/ in name order (tools/build_site.js), so this file comes before rooms.js, and the page
// has no module: the library must find TitanicRooms when it first wants it. In a sandbox, the files in that order:
{
  const vm = require('vm');
  const box = { console };
  box.self = box;
  vm.createContext(box);
  let loaded = true;
  try {
    for (const file of ['core/core.js', 'core/scenarios.js', 'core/readers/cabins.js', 'core/readers/rooms.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), box, { filename: file });
  } catch (e) { loaded = false; }
  let same = false, sameIndex = false, steps = 0;
  if (loaded && box.TitanicCabins && box.TitanicRooms) {
    const KB = box.TitanicCabins, CB = box.TitanicCore, IB = KB.index(tables);
    sameIndex = sig(IB) === sig(I);
    const shipB = CB.buildShip(), simB = CB.createSim(shipB, {}, box.TitanicScenarios.PRESETS.titanic.build({})), trB = KB.track(shipB);
    while (steps < SANDBOX_STEPS && !simB.foundered) { CB.step(simB); steps++; KB.observe(trB, simB); }
    same = at30 !== null && JSON.stringify(trB) === at30;
  }
  must('the library as the page bundles it (core/readers/ in name order, so this file before rooms.js, and no module): it finds TitanicRooms when first wanted; its index, and its first-wet times over the 1912 preset\'s first thirty minutes, are Node\'s to the bit',
    (loaded ? 'loaded' : 'FAILED to load') + '; the index ' + (sameIndex ? 'the same' : 'DIFFERENT') + '; ' + steps + ' steps, the track ' + (same ? 'the same' : 'DIFFERENT'), 'the same', loaded && sameIndex && same);
}

// ---------------------------------------------------------------- 4. a library, not a reader: the 1912 watch
let costDepth = 0n, nDepth = 0;
{
  const bare = N.sink(N.create(C.buildShip(), N.spec(1912), { auto: true, handover: 'flag' }));
  const shipW = C.buildShip(), w = N.create(shipW, N.spec(1912), { auto: true, handover: 'flag' }), trW = K.track(shipW);
  let deepest = 0;
  while (!w.foundered) {
    N.step(w);
    K.observe(trW, w);
    if (w.night.k % 40 === 0) {
      const a = process.hrtime.bigint();
      const sh = R.waterOf(w), lv = K.levels(w);
      for (const e of I.rows) for (const d of K.depth(I, w, e, sh, lv)) if (d.depth > deepest) deepest = d.depth;
      costDepth += process.hrtime.bigint() - a; nDepth++;
    }
  }
  const fc = N.forecastOf(w);
  const keys = Object.keys(w).filter((x) => /cabin/i.test(x)).concat(Object.keys(fc).filter((x) => /cabin/i.test(x)));
  must('a library: the 1912 watch read by it (observe every step, the depth of every row every 10 s) has the fingerprint and the state of one never read; no state of its own in the sim or the forecast\'s copy',
    N.fingerprint(w) + ' at step ' + w.night.k + '; serialize ' + (JSON.stringify(C.serialize(w)) === JSON.stringify(C.serialize(bare)) ? 'the same' : 'DIFFERENT') + '; its keys in the sim or the copy: ' + (keys.join(', ') || 'none') + '; ' + trW.t.filter((x) => x !== null).length + ' slabs wet, ' + f(deepest) + ' m the deepest',
    N.fingerprint(bare) + ' at step ' + bare.night.k + ' never read',
    N.fingerprint(w) === N.fingerprint(bare) && w.night.k === bare.night.k && JSON.stringify(C.serialize(w)) === JSON.stringify(C.serialize(bare)) && !keys.length);
  must('  ... and the tables are still untouched at the end', JSON.stringify(tables) === before ? 'the same bytes' : 'CHANGED', 'the same bytes', JSON.stringify(tables) === before);
}

// ---------------------------------------------------------------- 5. the table: the staterooms by deck, with their first-wet times
const when = (t) => (t === null ? 'dry' : K.clock(t, BASE).padStart(8) + '  T ' + f(t / 60, 1).padStart(5));
say('NH2: HER STATEROOMS, AND WHEN THE WATER CAME: the 1912 damage preset at its default numbers (core/readers/cabins.js, level 0)');
say('she founders at T ' + f(founderT / 60) + ' (' + K.clock(founderT, BASE) + '); T is minutes after the touch, at ' + K.clock(0, BASE));
say('a room\'s water is its slab\'s: a deck\'s space in one of the model\'s zones, on one side; inside a space her decks are open floor [stand-in],');
say('so each time below is "water on that deck in that compartment, on that side", never at one cabin\'s door. A row is a block of rooms where the plans');
say('are dense: its staterooms share its pieces and times. Wet [bet]: the slab\'s water (rooms.js\'s waterOf) would stand ' + K.WET * 100 + ' cm deep over its floor.');
say('each row: its id and its stateroom numbers; then each piece: its compartment (between the bulkheads named) and side, and when it was first wet');
const byDeck = new Map();
for (const e of I.rows) if (e.labels.length) { if (!byDeck.has(e.deck)) byDeck.set(e.deck, []); byDeck.get(e.deck).push(e); }
const summary = [];
for (const d of DECKS.slice().reverse()) {
  const rows = byDeck.get(d);
  if (!rows) continue;
  const fw = rows.map((e) => K.firstWet(tr, e)), wet = fw.filter(Boolean), ts = wet.map((p) => p.t);
  const nums = rows.reduce((a, e) => a + e.labels.length, 0);
  const head = (d === 'Boat' ? 'the Boat deck' : d + ' deck') + ': ' + rows.length + ' rows, ' + nums + ' stateroom numbers; wet before she founders: ' + wet.length + ' rows' + (wet.length ? ', the first at ' + K.clock(Math.min.apply(null, ts), BASE) + ' (T ' + f(Math.min.apply(null, ts) / 60, 1) + ')' : '') + '; dry ' + (rows.length - wet.length);
  summary.push(head);
  say('');
  say(head);
  for (const e of rows) {
    const L = e.labels.join(', ');
    const chunks = [];
    for (let i = 0, cur = ''; i < e.labels.length; i++) {
      const next = cur ? cur + ', ' + e.labels[i] : e.labels[i];
      if (next.length > 100 && cur) { chunks.push(cur + ','); cur = e.labels[i]; } else cur = next;
      if (i === e.labels.length - 1) chunks.push(cur);
    }
    say('  ' + e.id.padEnd(7) + (chunks[0] || L));
    for (const c of chunks.slice(1)) say('         ' + c);
    K.wetPieces(tr, e).forEach((p) => {
      if (p.outside) { say('           ' + (code(p.zone) + ' ' + sideOf(p.side)).padEnd(15) + 'where the model has no space of this deck'); return; }
      say('           ' + (code(p.zone) + ' ' + sideOf(p.side)).padEnd(15) + when(p.t));
    });
  }
}

// the depth over the room's deck at its place, over time: the slice through her forward decks
say('');
say('THE DEPTH OVER THE ROOM\'S DECK AT ITS PLACE, every ten minutes and when she founders (m; "full": to the deckhead; "-": no water in that slab):');
say('a slice through her forward decks. The depth is her space\'s one level over the deck at the centroid of the row\'s outline in that compartment');
const S0 = series.get(SLICE[0]) || [];
say('  ' + 'row and piece'.padEnd(24) + S0.map((x) => (x.end ? 'end' : 'T ' + Math.round(x.t / 60)).padStart(6)).join(''));
for (const e of SLICE) {
  const name = e.labels.length ? e.labels.slice(0, 3).join(', ') + (e.labels.length > 3 ? ', ...' : '') : e.name.split(/[,:(]/)[0].trim();
  say('  ' + e.id.padEnd(7) + e.deck + ' deck, ' + name);
  const S = series.get(e);
  (S[0] ? S[0].d : []).forEach((p, j) => {
    say('    ' + (code(p.zone) + ' ' + sideOf(p.side)).padEnd(22) + S.map((x) => { const q = x.d[j]; return (!(q.m3 > 0) ? '-' : q.full ? 'full' : f(q.depth)).padStart(6); }).join(''));
  });
}

// the threshold's bet: a tenth of it and ten times it
{
  let n = 0, moved = 0, worst = 0, worstRow = null, flips = 0;
  for (const e of I.rows) {
    if (!e.labels.length) continue;
    n++;
    const a = K.firstWet(tr, e), lo = K.firstWet(tLo, e), hi = K.firstWet(tHi, e);
    for (const b of [lo, hi]) {
      if (!a !== !b) { flips++; continue; }
      if (!a) continue;
      const d = Math.abs(b.t - a.t) / 60;
      if (d > 1) moved++;
      if (d > worst) { worst = d; worstRow = e.id + ' (' + code(a.zone) + ' ' + sideOf(a.side) + ')'; }
    }
  }
  check('the threshold\'s bet (' + K.WET * 100 + ' cm over the slab\'s floor): at a tenth of it and at ten times it, the staterooms\' rows whose first-wet time moves more than a minute',
    moved + ' of ' + 2 * n + ' readings; the largest move ' + f(worst, 1) + ' min (' + (worstRow || '-') + '); wet under one and dry under the other: ' + flips, 'most move less than a minute', moved + flips <= n);
}

say('');
say('FINDINGS FOR R3\'S TABLES (the numbers two rows name, as the library settles them; a finding, not a correction)');
for (const c of I.conflicts) say('  ' + c.label.padEnd(6) + c.named.map((x) => x.id + ' "' + x.printed + '" (' + x.how + ')').join(' and ') + ' -> ' + (c.to || 'unresolved') + ', by ' + c.rule);
say('');
say('THE CHECK ROWS');
for (const [what, value, ref, ok] of checks) say((ok ? 'in   ' : 'out  ') + 'CHECK ' + what + ' | ' + value + ' | ' + ref);
fs.writeFileSync(outFile('cabins_1912.txt'), lines.join('\n') + '\n');

console.log('');
for (const s of summary) console.log('  ' + s);
console.log('~ cost: observe ' + (Number(costObs) / nObs / 1000).toFixed(0) + ' us a step (rooms.js\'s share-out with it), over ' + nObs + ' steps; the depth of every row ' + (Number(costDepth) / nDepth / 1e6).toFixed(1) + ' ms a reading, over ' + nDepth);
for (const [what, value, ref, ok] of musts) console.log((ok ? 'PASS' : 'FAIL') + ' MUST  ' + what + ' | ' + value + ' | ' + ref);
console.log(fails ? 'FAIL: ' + fails + ' of ' + musts.length + ' MUST rows' : 'PASS: every MUST row (' + musts.length + '); CHECK rows in: ' + checks.filter((c) => c[3]).length + ' of ' + checks.length);
process.exit(fails ? 1 : 0);
