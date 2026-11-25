// NH5: the counterfactual gallery (docs/BRAINSTORM_the_next_horizon_v1_2026-11-23.md, NH5; BACKLOG section 2k). The
// questions people ask, each a CARD: one what-if, run on the 1912 WATCH by the landed member (today's defaults, the
// calibration epoch's candidate C) and by the kept set's members (out/kept_1912.json, the history match's), written with
// its robustness table to out/gallery_1912.json through tools/outdir.js, so that the gate says STALE when it moves.
// A TOOL: nothing in the model changes; what a run sets in a module (Encounter.ICE, World.SHIPS) is set back after it.
//   node tools/gallery.js [--jobs N] [--members N] [--cards id,id]
//     --jobs N     worker threads (default 2: the lanes need the CPU); the table is the same with one or many
//     --members N  the first N members of the kept set only, beside the landed member (a quick look; the tests use it)
//     --cards ...  these cards only: headOn, lookout, doors, bulkD, bulkB, californian, boats (the baseline always runs)
// A member is NH3's (tools/ensemble.js, memberWatch): its inputs over today's defaults on the watch, the encounter's area
// constant the fixed point at its own opening on its own params, coal list and bunker opening (found once a member,
// memberIce), its split's blend scaling ICE.openAlong. A card's run is that watch with the card's what-if, run as
// Night.sink runs it: to her foundering, to 8 h, or lying steady from 4 h. The cards that count people and ships attach
// the readers (core/readers/people.js and world.js, loaded here so that they register) and, past her foundering, run on
// the readers alone (the model and the fingerprint stand still) until a ship is alongside.
// The robustness table (D22): how many of the kept set's N members show each outcome (k of N); the band (least, median,
// most) of the founder, and of the people where a card counts them, over them; the landed member's own value beside, not
// counted (it is candidate C, the kept set's member 19 on 2026-11-23, rounded, its split held at 0: counted, C would
// count twice); and the same for
// the watch as recorded, the baseline. NH3's bands are the same kept set's. D22 governs every word: a result is its
// table, never "she could have been saved" on one model, and the readers' counts rest on their own bets, named where
// they are used.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
try { os.setPriority(0, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch (e) { /* as it is */ }
const C = require('../core/core.js');
const Mo = require('../core/motion.js');
const N = require('../core/night.js');
const World = require('../core/readers/world.js');      // the readers register with the night as they load; a card that
const People = require('../core/readers/people.js');    // reads them asks Night.create for them (readers), the rest do not
const EN = require('./ensemble.js');

const T_MAX = EN.T_MAX;                                  // s: Night.sink's own cap
const r4 = (x) => (x === null || x === undefined || !Number.isFinite(x) ? null : +x.toFixed(4));
let SHIP = null;
const theShip = () => SHIP || (SHIP = C.buildShip());

// ------------------------------------------------------------------ the cards
const DOORED = C.BULKHEADS.map((b, i) => (b.doors.length ? i : -1)).filter((i) => i >= 0);   // the bulkheads with doors: C to O
const BULK_D = { C: 'D', D: 'D', E: 'D', F: 'D', G: 'D', H: 'D', J: 'D' };                    // tools/validate.js's titanicD
const BULK_B = Object.fromEntries(C.BULKHEADS.map((b) => [b.id, 'B']));                         // and its titanicB
function topsTo(sim, tops) { for (const id of Object.keys(tops)) C.setBulkheadTop(sim, C.BULKHEADS.findIndex((b) => b.id === id), tops[id]); }
const START = (type, value, arg) => (arg === undefined ? { when: 'start', after: 0, type, value } : { when: 'start', after: 0, type, value, arg });

// kind: 'founder' (the model's what-if: her founder), 'rescue' (the ships: the readers' rescue), 'boats' (the people in
// the boats). spec(sp): the night changed before the watch is made; create(sp): Night.create's options (the script);
// around(make): the watch made inside a module's setting, set back after; after(sim): the watch changed before its first step
const BASE = { id: 'baseline', title: 'The watch as recorded', readers: true,
  how: 'The 1912 watch on its own orders (Night.spec(1912), Night.scriptOf), member by member: what each card is set against. The readers are attached (core/readers/people.js and world.js): they change nothing in the model, so its founder and fingerprint are the watch\'s own.' };
const CARDS = [
  { id: 'headOn', kind: 'founder', title: 'Head-on, no helm', damage: true,
    question: 'What if the helm had not been put over, and she had met the berg head-on?',
    how: 'On the watch: its recorded orders without the helm\'s. Night.scriptOf with turn and around null (no hard-a-starboard 20.5 s after the bells, no port-around at the touch), and its helm entries left out (amidships with the stop, and at the clear), so that the log holds no helm order; the engines as recorded, stopped a minute after the touch.',
    // RC2 (the red team's row 23): why these figures do not vary, and who the card does not count [read: data/rooms, the
    // firemen's quarters on D deck forward and the crew's messes on C deck forward]
    caveat: () => 'The members share the ice\'s guesses (the force at which her bow crushes, the berg\'s mass), which are among the least certain numbers in the model, so these figures do not vary. The model counts no one here: her firemen\'s and seamen\'s quarters were in her bow, where the blow would fall.',
    create: (sp) => ({ script: N.scriptOf(Object.assign({}, sp.orders, { turn: null, around: null })).filter((o) => o.type !== 'helm') }) },
  { id: 'lookout', kind: 'founder', title: 'The lookout 30 s sooner', damage: true,
    question: 'What if the lookout had seen the berg 30 seconds sooner?',
    how: 'On the watch: the same berg seen 30 s of her way further off, spec.sighting + 30 u (u her speed at spec.speedKn, Motion.create: 11.575 m/s at 22.5 knots). Night.create places the berg from the sighting, so the bells ring at the same moment with the berg 347.25 m farther ahead; the orders as recorded, from the bells.',
    spec: (sp) => { sp.sighting += 30 * Mo.create({ knots: sp.speedKn }).u; } },
  { id: 'doors', kind: 'founder', title: 'The watertight doors left open',
    question: 'What if the watertight doors had been left open?',
    how: 'On the watch: the order to raise the doors of every bulkhead that has them (C to O) at the start, one script entry of the watch\'s own \'door\' order each (logged), and their floats disarmed before the first step (sim.doorFloat), as core/systems.js leaves unarmed a door that a scenario holds open. Night.create takes no doorsOpen, so that one write is outside the orders, as the Carpathia search\'s held doors are (tools/carpathia.js): a replay of the log alone would let the floats drop them. tools/validate.js\'s what-if is the same on the preset (scen.doorsOpen); the bridge\'s switch is not thrown, as on the recorded watch.',
    create: (sp) => ({ script: DOORED.map((b) => START('door', b, true)).concat(N.scriptOf(sp.orders)) }),
    after: (sim) => { for (const b of DOORED) sim.doorFloat[b] = 0; } },
  { id: 'bulkD', kind: 'founder', title: 'The bulkheads to D deck',
    question: 'What if the bulkheads C to J had been carried up to D deck?',
    how: 'On the watch: tools/validate.js\'s what-if (titanicD), bulkheads C to J topped at D deck, by C.setBulkheadTop after Night.create and before the first step (it rebuilds the connections); the orders as recorded.',
    after: (sim) => topsTo(sim, BULK_D) },
  { id: 'bulkB', kind: 'founder', title: 'The bulkheads to B deck',
    question: 'What if every bulkhead had been carried up to B deck?',
    how: 'On the watch: tools/validate.js\'s what-if (titanicB), every bulkhead topped at B deck, by C.setBulkheadTop after Night.create and before the first step (it rebuilds the connections); the orders as recorded.',
    // RC2 (the red team's row 13; B1+B2's reading of 2026-11-24): the Evidence tab's row for this what-if is the damage
    // card run on with no break (tools/validate.js's titanicB), where she floats; a watch ends where her loads first
    // reach her strength, hours later here and with her still afloat. The card says both, from the two tables
    caveat: (o) => {
      const t = o.table, V = validationCase('titanicB'), all = t.breaks === t.N && t.founder && t.founder.n;
      return (all ? 'On this card "breaks" is the watch\'s rule and not a sinking: she is still afloat when her own loads first reach the model\'s hull strength, ' + (d1(t.founder.lo / 60) === d1(t.founder.hi / 60) ? d1(t.founder.med / 60) : d1(t.founder.lo / 60) + ' to ' + d1(t.founder.hi / 60)) + ' hours after the touch, and the watch ends there. ' : '') +
        (V ? 'Run on with no break, as the damage card is, the model\'s defaults ' + (V.foundered ? 'founder ' + num(V.founderMin) + ' minutes after the collision' : 'stay afloat, ' + d1(Math.abs(V.trim)) + ' degrees by the ' + (V.trim >= 0 ? 'head' : 'stern')) + ' (the Evidence tab\'s row). ' : '') +
        'The model\'s break comes early and flat on the 1912 night itself, so read these hours with that in mind.';
    },
    after: (sim) => topsTo(sim, BULK_B) },
  { id: 'californian', kind: 'rescue', title: 'Californian answering', readers: true,
    question: 'What if Californian\'s operator had been at his set for the first CQD, and she had come?',
    how: 'On the watch, with the readers: Californian\'s operator listening when the first CQD goes out (T 47 on the 2:02 clock). World.SHIPS\'s Californian entry is made without its turning-in hour (offCal: 11:35 pm her time [read]), so that the reader takes her operator as listening throughout, as it takes the other ships\' operators [bet]; it reads the table once, when Night.create attaches it, and the entry is set back at once. Her distance stays the reader\'s default, 18 nm (the 1992 reappraisal); her watch acts on no rocket (acts false), as on the night. She hears the call, then 10 min to rouse her master and ring her engines, 1.5 nm of ice in 30 min, 13 knots [the reader\'s bets and reads].',
    settable: 'What core/readers/world.js lets one set: through spec.world, her distance (californian, 1 to 40 nm: 18 by default, 9 inside the Court\'s "not more than eight to ten"), whether her watch acts on Titanic\'s rockets and Morse lamp (acts), the clock (2:02 or 1:50) and the bridge\'s own conduct (conduct); through the orders, the call made at once (help:call), rockets and the lamp. Her operator\'s hours are not a setting of the night: they are the reader\'s table of ships (World.SHIPS, offCal), as every ship\'s are.',
    rescue: 'Who is picked up and when, by the readers alone: the first ship alongside (world.js) takes up the boats, the people in them at her end, her hand-over (people.js\'s count). Of the people in the water when she founders, people.js\'s survival bet, exp(-t / 17.5 min) [bet: the boats note\'s 15 to 20; "reported, never drawn"], says how many are alive when that ship is alongside (at her founder, where the ship is there already). The readers take nobody off her and nobody out of the water: world.js\'s rule is that arrival is not rescue. The bet\'s figures are kept in this table (rescue.alive, and each run\'s world.alive), never added to the boats, and since RC2 said on no card: they are a bet about the cold, not a count of anyone saved.',
    around: (make) => { const s = World.SHIPS.find((x) => x.id === 'californian'), keep = s.offCal; try { s.offCal = undefined; return make(); } finally { s.offCal = keep; } } },
  { id: 'boats', kind: 'boats', title: 'The boats filled', readers: true,
    question: 'What if every boat had been filled before she was lowered?',
    how: 'On the watch, with the readers: core/readers/people.js\'s own orders at the start, as the page gives them (site/parts/50_boats.js, through TitanicApp.order): boats:rule \'fill\' on the port side and on the starboard side ("fill her": all comers, and each boat lowered full) and boats:fill 1, script entries of the watch (logged). Everything else as recorded, the officers\' order to uncover at T 20 included.',
    create: (sp) => ({ script: [START('boats:rule', 'fill', 'port'), START('boats:rule', 'fill', 'starboard'), START('boats:fill', 1)].concat(N.scriptOf(sp.orders)) }) },
];
const IDS = CARDS.map((c) => c.id);

// ------------------------------------------------------------------ one member
// her end (G12): the hand-over's time, the break's onset (the night's own check), or her flag where she founders first
const endOf = (sim) => (sim.foundered ? sim.founderT : (sim.night.onset && sim.night.onset.found ? sim.night.onset.found.t : -1));
// the first ship alongside (world.js), or null
function firstAlongside(sim) { let f = null; for (const s of sim.world.ships) if (s.state === 'alongside' && (!f || s.tAlong < f.tAlong)) f = s; return f; }

// one card's watch for one member, run, and what it shows (plain data)
function runCard(x, ship, ice, card) {
  const make = () => EN.memberWatch(x, ship, { ice, spec: card.spec, create: (sp) => Object.assign({ readers: !!card.readers }, card.create ? card.create(sp) : null) }).sim;
  const sim = card.around ? card.around(make) : make();
  if (card.after) card.after(sim);
  let steady = false;
  while (!N.over(sim) && sim.t < T_MAX) {                  // Night.sink's loop
    N.step(sim);
    if (sim.t > 4 * 3600 && Math.abs(sim.inflow) < 0.02 && Math.abs(sim.wth) < 1e-5) { steady = true; break; }
  }
  const w = sim.night, s = N.summary(sim), ro = C.readouts(sim), log = w.log;
  const r = {
    // G12 (D98): a run ends at its hand-over, the break's onset by default ('breaks'), her flag where she founders first
    outcome: sim.foundered ? 'founders' : (N.over(sim) ? 'breaks' : (s.kind === 'holed' ? 'afloat' : 'clear')),
    T: N.over(sim) ? r4((endOf(sim) - w.tTouch) / 60) : null,           // min after the touch: her end
    endH: r4(sim.t / 3600), steady,                                           // where the model's run ended: hours of the watch
    trim: r4(ro.trimDeg), list: r4(ro.listDeg), water: r4(ro.waterT),         // there
    fp: N.fingerprint(sim), k: w.k,
    enc: { kind: s.kind, area: r4(s.area), zones: s.zones.join(','), crush: r4(s.bow && s.bow.crush ? s.bow.crush : 0), clearance: r4(s.clearance), exact: s.clearanceExact, touchT: r4(w.tTouch), knTouch: r4(w.knTouch) },
    // what each card's what-if leaves to be seen: the orders in the log, the doors, the bulkheads' tops, the bells
    ev: { helm: log.filter((o) => o.type === 'helm').length, door: log.filter((o) => o.type === 'door').length, orders: log.length,
      open: DOORED.filter((b) => sim.doorOpen[b]).length, armed: DOORED.filter((b) => sim.doorFloat[b]).length,
      fell: sim.events.filter((e) => /^(door|shut)[A-Z]:\d+$/.test(e.id)).length, tops: sim.bulkTop.join(''),
      sighting: r4(w.spec.sighting), tBells: r4(w.tBells), rangeBells: r4(w.rangeBells) },
  };
  if (card.readers) {
    const P = sim.people, c = P.count;                                       // when she founders (or where the run ended)
    // of the people in a boat at her end: those in the 18 boats the record has lowered (each with a number aboard in the
    // reader's own rec), and those in collapsible A or B, which the record has floating off as she went
    const in18 = P.boats.reduce((s, b, i) => s + (b.state !== 'lost' && People.BOATS[i].rec && Number.isFinite(People.BOATS[i].rec.n) ? b.n : 0), 0);
    r.people = { boats: c.inBoats, away: c.inBoatsAway, boatsAway: c.boatsAway, empty: c.emptyAway, floated: c.floated, lost: c.lost, water: c.water, aboard: c.aboard,
      rule: P.rule.P + '/' + P.rule.S, fill: P.fill, orders: P.orders.length, refused: P.refused.length, lowered: in18, roof: c.inBoats - in18 };
    if (N.over(sim)) while (!firstAlongside(sim) && sim.t < T_MAX) N.step(sim);   // the readers alone, past her end
    const f = firstAlongside(sim), T = (t) => (t >= 0 ? r4((t - w.tTouch) / 60) : null);
    const cal = sim.world.ships.find((q) => q.id === 'californian'), carp = sim.world.ships.find((q) => q.id === 'carpathia');
    r.world = { first: f ? f.id : null, firstT: f ? T(f.tAlong) : null,
      gap: f && N.over(sim) ? r4((f.tAlong - endOf(sim)) / 60) : null,                       // min after her end (< 0: before)
      alive: f && N.over(sim) ? r4(People.aliveInWater(sim, f.tAlong - endOf(sim))) : null,   // the survival bet, then
      cal: { heardT: T(cal.tHeard), how: cal.how, goT: T(cal.tGo), alongT: T(cal.tAlong), listening: cal.offT === Infinity },
      carpathiaT: T(carp.tAlong), endH: r4(sim.t / 3600) };
  }
  return r;
}
function runMember(x, ids) {
  const ship = theShip(), ice = EN.memberIce(x, ship);
  const out = { alpha: x ? ice.alpha : null, turns: x ? ice.turns : null, base: runCard(x, ship, ice, BASE), cards: {} };
  for (const c of CARDS) if (ids.indexOf(c.id) >= 0) out.cards[c.id] = runCard(x, ship, ice, c);
  return out;
}

// ------------------------------------------------------------------ the tables
const bandOf = EN.bandOf;
const tally = (xs) => { const o = {}; for (const x of xs) o[x] = (o[x] || 0) + 1; return o; };   // in the members' order
// runs[0] is the landed member's, beside; runs[1..] the kept set's members, which the counts and bands are over
function founderTable(all, base0) {
  const me = all[0], runs = all.slice(1), base = base0 ? base0.slice(1) : null;
  const of = (o) => runs.filter((r) => r.outcome === o), Br = of('breaks'), F = of('founders').concat(Br), A = of('afloat'), L = of('clear'), S = A.filter((r) => r.steady);
  const M = L.filter((r) => r.enc.kind === 'miss');
  const t = { N: runs.length, founders: F.length, breaks: Br.length, afloat: A.length, clear: L.length, afloatSteady: S.length,
    founder: bandOf(F.map((r) => r.T)), steadyH: bandOf(S.map((r) => r.endH)),
    afloatTrim: bandOf(A.map((r) => r.trim)), afloatWater: bandOf(A.map((r) => r.water)),     // how she lies where the run ends: deg (+ by the head), t
    damage: { kind: tally(runs.map((r) => r.enc.kind)), zones: tally(runs.map((r) => r.enc.zones)), area: bandOf(runs.map((r) => r.enc.area)), crush: bandOf(runs.map((r) => (r.enc.crush > 0 ? r.enc.crush : null))),
      clearance: bandOf(M.map((r) => r.enc.clearance)), clearanceExact: M.every((r) => r.enc.exact) } };   // m: how far off a miss passes her side
  if (base) t.later = bandOf(runs.map((r, i) => (r.T !== null && base[i].T !== null ? r4(r.T - base[i].T) : null)));   // min, where both end (G12: her hand-over, or her flag)
  t.landed = { outcome: me.outcome, kind: me.enc.kind, T: me.T, endH: me.endH };
  return t;
}
function boatsTable(all, base0) {
  const me = all[0].people, runs = all.slice(1), base = base0 ? base0.slice(1) : null, p = (k) => bandOf(runs.map((r) => r.people[k]));
  const t = { N: runs.length, boats: p('boats'), water: p('water'), boatsAway: p('boatsAway'), empty: p('empty') };
  if (base) t.more = bandOf(runs.map((r, i) => r.people.boats - base[i].people.boats));
  t.landed = { boats: me.boats, water: me.water, boatsAway: me.boatsAway, empty: me.empty, lowered: me.lowered, roof: me.roof };
  t.lowered = p('lowered'); t.roof = p('roof');   // in the 18 boats the record has lowered, and in collapsible A or B
  return t;
}
function rescueTable(all) {
  const me = all[0].world, runs = all.slice(1), w = runs.map((r) => r.world), by = {};
  for (const q of w) if (q.first) by[q.first] = (by[q.first] || 0) + 1;
  return { N: runs.length, alongside: w.filter((q) => q.first).length, before: w.filter((q) => q.gap !== null && q.gap < 0).length, after: w.filter((q) => q.gap !== null && q.gap >= 0).length,
    first: by, firstT: bandOf(w.map((q) => q.firstT)), gap: bandOf(w.map((q) => q.gap)),
    boats: bandOf(runs.map((r) => r.people.boats)), water: bandOf(runs.map((r) => r.people.water)), alive: bandOf(w.map((q) => q.alive)),
    heardT: bandOf(w.map((q) => q.cal.heardT)), calAlongT: bandOf(w.map((q) => q.cal.alongT)),
    landed: { first: me.first, firstT: me.firstT, gap: me.gap, boats: all[0].people.boats, water: all[0].people.water, alive: me.alive } };
}

// ------------------------------------------------------------------ the words (D22: a result is its table)
const num = (v) => { const r = Math.round(v); return (r < 0 ? '-' : '') + String(Math.abs(r)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
const sgn = (v) => (Math.round(v) > 0 ? '+' : '') + num(v);
const d1 = (v) => (Math.round(v * 10) / 10).toFixed(1);
// RC2 (the red team's row 24): no figure is said finer than the model can bear. A time is a whole minute, a length a whole
// metre, and a band whose least and most are said alike is one value, "the same in every member" (the members share
// that input), never "(x to x)"
const SAME = ' (the same in every member)';
const bandW = (B, f) => (B.n ? (f(B.lo) === f(B.hi) ? f(B.med) + SAME : f(B.med) + ' (' + f(B.lo) + ' to ' + f(B.hi) + ')') : 'none');
const bandU = (B, f, unit) => (B.n ? f(B.med) + ' ' + unit + (f(B.lo) === f(B.hi) ? SAME : ' (' + f(B.lo) + ' to ' + f(B.hi) + ')') : 'none');
const upTo = (v) => (v < 1 ? 'by under a minute' : 'by up to ' + num(Math.ceil(v)) + ' min');
// the record beside the boats' count (row 11): Wormstedt and Fitch's numbers aboard the 18 boats lowered, which the
// people reader keeps as each boat's rec.n (671 in all), and the saved [read: docs/research/
// RESEARCH_lifeboats_launch_sequence_v1_2026-11-17.md, its table of totals: 712, with 705 to 712 cited]
const REC_BOATS = People.BOATS.filter((b) => b.rec && Number.isFinite(b.rec.n));
const REC18 = REC_BOATS.reduce((s, b) => s + b.rec.n, 0), SAVED_1912 = 712;
// a case of tools/validate.js's table as tracked (out/validation.json), for a card that must say what the damage card
// makes of the same what-if (row 13); null where the table has no such case
function validationCase(k) { try { const V = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'out', 'validation.json'), 'utf8')); return V && V[k] ? V[k] : null; } catch (e) { return null; } }
const shipName = (id) => World.SHIPS.find((s) => s.id === id).name;
const zoneW = (k) => { const n = C.ZONES[k].name; return k === 0 || k === 15 ? 'the ' + n.toLowerCase() : (n.charAt(0) === 'N' ? n : n.charAt(0).toLowerCase() + n.slice(1)); };   // as core/night.js names them
const zonesW = (z) => { const ks = z ? z.split(',').map(Number) : []; return ks.length < 2 ? (ks.length ? zoneW(ks[0]) : 'nothing') : ks.slice(0, -1).map(zoneW).join(', ') + ' and ' + zoneW(ks[ks.length - 1]); };
function outcomeW(t) {
  const p = [], a = t.afloat, s = t.afloatSteady, H = t.steadyH, D = t.damage;
  if (t.founders) p.push((t.breaks === t.founders ? 'breaks' : (t.breaks ? 'ends' : 'founders')) + ' T ' + bandW(t.founder, num) + ' in ' + t.founders + ' of ' + t.N + (t.breaks && t.breaks < t.founders ? ' (breaks in ' + t.breaks + ', founders first in ' + (t.founders - t.breaks) + ')' : ''));
  if (a) {
    const Tr = t.afloatTrim, lies = ', with ' + bandW(t.afloatWater, num) + ' t of water in her and her trim ' +
      (d1(Tr.lo) === d1(Tr.hi) ? d1(Math.abs(Tr.med)) + ' deg by the ' + (Tr.med >= 0 ? 'head' : 'stern') + SAME : d1(Tr.med) + ' deg (' + d1(Tr.lo) + ' to ' + d1(Tr.hi) + (Tr.lo > 0 ? ', by the head)' : '; + by the head)'));
    p.push('afloat ' + (s === 0 ? 'at 8 h in ' + a + ' of ' + t.N : 'in ' + a + ' of ' + t.N + ', ' + (s < a ? 'lying steady in ' + s + ' (by ' + d1(H.hi) + ' h of the watch) and still settling at 8 h in ' + (a - s) : 'lying steady when the run ends (at ' + (H.lo === H.hi ? d1(H.lo) : d1(H.lo) + ' to ' + d1(H.hi)) + ' h of the watch)')) + lies);
  }
  if (t.clear) {
    const miss = D.kind.miss || 0, dent = D.kind.dented || 0, Cl = D.clearance;
    p.push('no water let in, in ' + t.clear + ' of ' + t.N + ' (' + [miss ? 'she misses the ice in ' + miss + (Cl.n ? ', passing ' + (D.clearanceExact ? '' : 'more than ') + bandU(Cl, num, 'm') + ' off her side' : '') : '', dent ? 'the ice dents her plating and opens no seam in ' + dent : ''].filter(Boolean).join('; ') + ')');
  }
  return p.join('; ');
}
const landedW = (L) => (L.outcome === 'founders' || L.outcome === 'breaks' ? (L.outcome === 'breaks' ? 'breaks' : 'founders') + ' T ' + num(L.T) : (L.outcome === 'afloat' ? 'is afloat' : (L.kind === 'miss' ? 'misses the ice' : 'lets in no water')));
// the damage, where the card changes the encounter: the stem's crush, and the commonest opening
function damageW(t) {
  const D = t.damage, z = Object.keys(D.zones).sort((p, q) => D.zones[q] - D.zones[p])[0], n = D.zones[z];
  if (!D.area.hi) return '';
  return (D.crush.n ? 'her stem crushed ' + bandU(D.crush, num, 'm') + ' into the ice in ' + D.crush.n + ' of ' + t.N + ', and ' : '') +
    zonesW(z) + ' open to the sea in ' + n + ' of ' + t.N + ', ' + bandU(D.area, num, 'm2') + '. ';
}
function founderSay(c, o) {
  const t = o.table, b = o.baseline, later = t.later && t.later.n ? '; where both end, hers moves ' + bandU(t.later, sgn, 'min') + ' against the watch as recorded' : '';
  const dmg = c.damage ? damageW(t) : '', out = outcomeW(t), caveat = c.caveat ? c.caveat(o) : '';
  return c.title + ': ' + (dmg ? dmg + out.charAt(0).toUpperCase() + out.slice(1) : out) + later + '. The landed member ' + landedW(t.landed) + '. ' + (caveat ? caveat + ' ' : '') + 'As recorded: ' + outcomeW(b) + ', the landed member T ' + num(b.landed.T) + '.';
}
// the people in the boats at her end, with the record beside it and what the count holds (the red team's row 11): the 18
// boats the record has lowered, and collapsible A or B where the model gets one away (on the night both floated off)
function boatsRecordW(Bt, lead) {
  if (!Bt.lowered || !Bt.lowered.n) return '';
  const roof = Bt.roof && Bt.roof.n && Bt.roof.hi > 0;
  return ' ' + lead + ', ' + bandW(Bt.lowered, num) + ' are in the 18 boats the record has lowered, where the night had about ' + num(REC18) + ' (Wormstedt and Fitch\'s count)' +
    (roof ? ', and ' + bandW(Bt.roof, num) + ' in collapsible A or B, which the model gets away where on the night both floated off as she went' : '') + '; ' + num(SAVED_1912) + ' were saved in all.';
}
function rescueSay(c, o) {
  const R = o.rescue, B = o.baselineRescue, t = o.table, g = R.gap;
  let when = 'no ship is alongside by 8 h';
  if (R.alongside) {
    const lead = -Math.min(0, g.lo), lag = Math.max(0, g.hi);
    const lagB = { n: g.n, med: g.med, lo: g.lo, hi: lag }, leadB = { n: g.n, med: -g.med, lo: -g.hi, hi: lead };
    when = 'is alongside at T ' + bandW(R.calAlongT, num) + ' in ' + R.calAlongT.n + ' of ' + R.N + ': ' +
      (R.before && R.after ? 'before her end in ' + R.before + ' of ' + R.N + ' (' + upTo(lead) + ') and after it in ' + R.after + ' (' + upTo(lag) + ')'
        : (R.before ? 'before her end in ' + R.before + ' of ' + R.N + ', by ' + bandU(leadB, num, 'min') : 'after her end in ' + R.after + ' of ' + R.N + ', by ' + bandU(lagB, num, 'min')));
  }
  const firstB = Object.keys(B.first).map(shipName).join(', ');
  // Her distance is a choice between sources, so the card names it (core/readers/world.js: 18 nm the default, 9 nm a
  // setting). The 1992 reappraisal's two inspectors differed: the first held that she was within sight of Titanic, and
  // the Deputy Chief Inspector put her 17 to 20 miles off, most likely about 18 [read: docs/research/
  // RESEARCH_wireless_rockets_ships_clock_v1_2026-11-17.md for the 17 to 20 and the Court's words; the inspectors'
  // split is the red team's row 4, from summaries of the report, 2026-11-24]. The Court of 1912: "not more than eight to
  // ten miles".
  // RC2 (the red team's row 3): the card said how many of the people in the water the survival bet (people.js,
  // exp(-t / 17.5 min)) has alive when a ship is alongside. That reads as a count of the saved, and nothing here models
  // taking anyone from the water, so the card no longer says it. The table keeps the bet's figures (rescue.alive),
  // labelled as the bet they are
  return c.title + ' (her operator listening; at 18 nautical miles, the distance the 1992 reappraisal\'s Deputy Chief Inspector thought most likely, where its first inspector held she was within sight; the British Court of 1912 held she was "not more than eight to ten miles" off): she hears the first CQD at T ' + num(R.heardT.med) + ' in ' + R.heardT.n + ' of ' + R.N + ' and ' + when + '. ' +
    'The model counts as saved only the people in the boats: ' + bandW(R.boats, num) + ', the same as with the 1912 calls, whose first ship alongside is ' + firstB + ' at T ' + bandW(B.firstT, num) + ': the boats do not wait on the ships. ' +
    'In the water at her end: ' + bandW(R.water, num) + '. How many of them a ship alongside could have saved is not modelled: nothing here takes anyone off her or out of the water, and the Court of 1912 and the reappraisal of 1992 disagree about what she could have done. ' +
    'Her end is the watch\'s own, member by member: ' + outcomeW(t) + '.';
}
function boatsSay(c, o) {
  const B = o.boats, b = o.baselineBoats, t = o.table;
  return c.title + ' ("fill her" on both sides, each boat lowered full): ' + bandW(B.boats, num) + ' in the boats at her end, in ' + B.boats.n + ' of ' + B.N + ', against ' + bandW(b.boats, num) + ' on the watch as recorded: ' + bandW(B.more, sgn) + ', member by member. ' +
    bandW(B.boatsAway, num) + ' boats away with ' + bandW(B.empty, num) + ' places empty in them, against ' + bandW(b.boatsAway, num) + ' with ' + bandW(b.empty, num) + '; in the water ' + bandW(B.water, num) + ' against ' + bandW(b.water, num) + '.' +
    boatsRecordW(b, 'Of those in the boats on the watch as recorded') + ' The landed member: ' + num(B.landed.boats) + ' in the boats against ' + num(b.landed.boats) + '. The count is of places and minutes, fitted to the launches of 1912, and names nobody; her end is the watch\'s own, member by member: ' + outcomeW(t) + '.';
}
// the watch as recorded, in the table's words (the baseline's card)
function baselineSay(B) {
  return 'The watch as recorded: ' + outcomeW(B.table) + '; the landed member T ' + num(B.table.landed.T) + '. In the boats at her end: ' + bandW(B.boats.boats, num) + '.' + boatsRecordW(B.boats, 'Of them') +
    ' The first ship alongside: ' + Object.keys(B.rescue.first).map(shipName).join(', ') + ' at T ' + bandW(B.rescue.firstT, num) + '.';
}
// a member's run as the table keeps it (the in-memory run also holds what the tests read: the log's orders, the doors)
function rowOf(r, i) {
  const o = { m: i === 0 ? 'landed' : i - 1, outcome: r.outcome, T: r.T, endH: r.endH, steady: r.steady, trim: r.trim, list: r.list, water: r.water, fp: r.fp, k: r.k,
    enc: { kind: r.enc.kind, area: r.enc.area, zones: r.enc.zones, crush: r.enc.crush, clearance: r.enc.clearance } };
  if (r.people) o.people = { boats: r.people.boats, water: r.people.water, boatsAway: r.people.boatsAway, empty: r.people.empty, lowered: r.people.lowered, roof: r.people.roof };
  if (r.world) o.world = { first: r.world.first, firstT: r.world.firstT, gap: r.world.gap, alive: r.world.alive, calT: r.world.cal.alongT };
  return o;
}
// the table as text: each member's row on a line of its own, and so each band, count and landed value
function tableText(table) {
  const MARK = '\u0001', flat = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).every((q) => v[q] === null || typeof v[q] !== 'object');
  return JSON.stringify(table, (k, v) => ((k === 'runs' || k === 'ice') && Array.isArray(v) ? v.map((r) => MARK + JSON.stringify(r)) : (k !== '' && flat(v) ? MARK + JSON.stringify(v) : v)), 1)
    .replace(/"\\u0001((?:[^"\\]|\\.)*)"/g, (m, s) => JSON.parse('"' + s + '"')) + '\n';
}
function cardOut(c, runs, base) {
  const o = { id: c.id, title: c.title, question: c.question, on: 'the 1912 watch', how: c.how };
  if (c.settable) o.settable = c.settable;
  if (c.rescue) o.rescueRule = c.rescue;
  o.table = founderTable(runs, base); o.baseline = Object.assign(founderTable(base), { fp: base[0].fp, k: base[0].k });   // the landed member's: the watch's own
  if (c.kind === 'rescue') { o.rescue = rescueTable(runs); o.baselineRescue = rescueTable(base); }
  if (c.kind === 'boats') { o.boats = boatsTable(runs, base); o.baselineBoats = boatsTable(base); }
  o.say = c.kind === 'rescue' ? rescueSay(c, o) : (c.kind === 'boats' ? boatsSay(c, o) : founderSay(c, o));
  o.runs = runs.map(rowOf);
  return o;
}

// ------------------------------------------------------------------ threads
function makePool(jobs) {
  if (jobs <= 1) return { run: async (ts) => ts.map((t) => runMember(t.x, t.ids)) };
  return {
    run(ts) {
      return new Promise((resolve, reject) => {
        const res = new Array(ts.length); let next = 0, done = 0;
        const ws = Array.from({ length: Math.min(jobs, ts.length) }, () => new Worker(__filename, { workerData: { role: 'gallery' } }));
        const send = (w) => { if (next < ts.length) { const i = next++; w.postMessage({ i, t: ts[i] }); } };
        for (const w of ws) {
          w.on('error', reject);
          w.on('message', (m) => { if (m.error) { reject(new Error(m.error)); return; } res[m.i] = m.r; done++; if (done === ts.length) { for (const q of ws) q.terminate(); resolve(res); } else send(w); });
          send(w);
        }
      });
    },
  };
}
if (!isMainThread && workerData && workerData.role === 'gallery') {
  parentPort.on('message', ({ i, t }) => { try { parentPort.postMessage({ i, r: runMember(t.x, t.ids) }); } catch (e) { parentPort.postMessage({ error: String(e && e.stack || e) }); } });
}

// ------------------------------------------------------------------ the gallery
async function run(o, say) {
  say = say || (() => {});
  const kept = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'out', 'kept_1912.json'), 'utf8'));   // the tracked kept set: an input
  const members = kept.members.slice(0, o.members || kept.members.length).map((m) => m.inputs);
  const ids = o.cards ? IDS.filter((id) => o.cards.indexOf(id) >= 0) : IDS;
  const t0 = Date.now(), xs = [null].concat(members);
  say('gallery: ' + ids.length + ' card' + (ids.length > 1 ? 's' : '') + ' and the baseline on the 1912 watch, by the landed member and ' + members.length + ' of the kept set\'s ' + kept.members.length + ' members (out/kept_1912.json, ' + kept.name + '), ' + o.jobs + ' thread' + (o.jobs > 1 ? 's' : ''));
  const all = await makePool(o.jobs).run(xs.map((x) => ({ x, ids })));
  const base = all.map((m) => m.base);
  const table = {
    what: 'the counterfactual gallery: what-ifs on the 1912 watch, each run by the landed member and the kept set\'s members, with its robustness table (tools/gallery.js, NH5)',
    core: EN.codeHash(), kept: kept.name, N: members.length,
    members: (members.length === kept.members.length ? 'the kept set\'s ' + members.length : 'the first ' + members.length + ' of the kept set\'s ' + kept.members.length) + ' (out/kept_1912.json), which N counts, as NH3\'s bands do; the landed member (today\'s defaults) beside them, not counted: it is the history match\'s candidate C, one of the kept set\'s members, rounded and with its split held at 0, so counted it would be C twice',
    // RC2 (the red team's row 22): the rule in plain words, as the page shows it under the gallery's lead (D22: a result
    // is its robustness table, never "she could have been saved" on one model; a run ends as Night.sink ends it)
    rule: 'How to read a card: "k of N" is how many of the kept set\'s N members show an outcome, and a band is the middle value over them with the least and the most in brackets; the landed member\'s own value stands beside, not counted. No card says she could have been saved: each is this model\'s answer, member by member, and never one run\'s. T is minutes after the touch. A run ends where she breaks or founders, when she lies steady after 4 hours, or at 8 hours.',
    ice: all.map((m, i) => ({ m: i === 0 ? 'landed' : i - 1, alpha: m.alpha, turns: m.turns })),
    baseline: { title: BASE.title, how: BASE.how, table: founderTable(base), fp: base[0].fp, k: base[0].k, boats: boatsTable(base), rescue: rescueTable(base) },
    cards: ids.map((id) => cardOut(CARDS.find((c) => c.id === id), all.map((m) => m.cards[id]), base)),
  };
  const B = table.baseline;
  B.say = baselineSay(B);
  B.runs = base.map(rowOf);
  const file = o.out ? path.resolve(o.out) : require('./outdir')('gallery_1912.json');   // o.out: a test's own file
  fs.writeFileSync(file, tableText(table));
  say(B.say);
  for (const c of table.cards) say(c.say);
  say('written ' + file + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)');
  return { table, all, file };
}

function args(a) {
  const o = { jobs: 2, members: 0, cards: null };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--jobs') o.jobs = Math.max(1, +a[++i] | 0);
    else if (a[i] === '--members') o.members = Math.max(1, +a[++i] | 0);
    else if (a[i] === '--cards') { o.cards = String(a[++i]).split(','); for (const id of o.cards) if (IDS.indexOf(id) < 0) throw new Error('gallery: no card ' + id + ' (' + IDS.join(', ') + ')'); }
    else throw new Error('gallery: unknown argument ' + a[i]);
  }
  return o;
}
module.exports = { run, args, runMember, runCard, CARDS, BASE, IDS, DOORED, BULK_D, BULK_B, founderTable, boatsTable, rescueTable, tableText,
  founderSay, rescueSay, boatsSay, baselineSay, outcomeW };   // the words, for a check of them on a table already made
if (isMainThread && require.main === module) run(args(process.argv.slice(2)), (s) => console.log(s)).then(() => process.exit(0), (e) => { console.error(e && e.stack || e); process.exit(1); });
