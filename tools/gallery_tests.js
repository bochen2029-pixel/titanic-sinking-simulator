// NH5's acceptance (tools/gallery.js; docs/BRAINSTORM_the_next_horizon_v1_2026-11-23.md, NH5):
//   node tools/gallery_tests.js        (about four minutes; writes only scratch tables, out/gate/gallery_tests/)
// The landed member and the first two members of the kept set, every card. MUST rows fail the suite; CHECK rows print
// what is worth seeing.
//   1 each card's baseline is the watch's own foundering: the landed member with no what-if is the 1912 watch run alone
//     (Night.sink of Night.create(ship, Night.spec(1912), { auto: true })): its fingerprint, its step and its founder
//   2 the readers' cards (Californian, the boats) change nothing in the model: member by member, their fingerprints, steps
//     and founders are the baseline's
//   3 each card's what-if was applied, member by member (a row a card)
//   4 the method, on the 1912 preset: the bulkheads' tops and the doors set after the sim is made (C.setBulkheadTop,
//     C.setDoor) give tools/validate.js's what-ifs (scen.bulkTop, scen.doorsOpen) to the bit
//   5 the same table with one thread or three (written to scratch files)
//   6 the watch's fingerprint is unchanged after the gallery has run in this thread, and what a card sets in a module
//     (Encounter.ICE, World.SHIPS) is set back
//   CHECK: each card's words; the full table (out/gallery_1912.json), where it is of this code, against NH3's
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const C = require('../core/core.js');
const N = require('../core/night.js');
const E = require('../core/encounter.js');
const Mo = require('../core/motion.js');
const SC = require('../core/scenarios.js');
const GA = require('./gallery.js');                       // loads the readers it attaches (world, people)
const World = require('../core/readers/world.js');
const EN = require('./ensemble.js');
const rows = []; let fails = 0;
function row(kind, what, value, ref, ok) { rows.push([kind, what, value, ref, ok]); if (kind === 'MUST' && !ok) fails++; }
const r4 = (x) => +x.toFixed(4);
const cal = () => World.SHIPS.find((s) => s.id === 'californian');

// the 1912 preset with a what-if made in the scenario or after the sim is made, run 3 h (or to her foundering): a digest
// of her water space by space, her pose and her founder
function presetDigest(scenWhatIf, simWhatIf, ship) {
  const scen = SC.PRESETS.titanic.build(); if (scenWhatIf) scenWhatIf(scen);
  const sim = C.createSim(ship, {}, scen); if (simWhatIf) simWhatIf(sim);
  while (!sim.foundered && sim.t < 3 * 3600) C.step(sim);
  const h = crypto.createHash('sha256');
  h.update(Buffer.from(sim.vol.buffer)); h.update(Buffer.from(new Float64Array([sim.zO, sim.pitch, sim.roll, sim.t, sim.founderT]).buffer));
  return { d: h.digest('hex').slice(0, 16), foundered: sim.foundered, T: sim.foundered ? r4(sim.founderT / 60) : null };
}

(async () => {
  const t0 = Date.now(), ship = C.buildShip();
  const keep = { alpha: E.ICE.alpha, openAlong: E.ICE.openAlong, offCal: cal().offCal };
  const w0 = N.sink(N.create(ship, N.spec(1912), { auto: true })), fp0 = N.fingerprint(w0), k0 = w0.night.k, T0 = r4(((w0.foundered ? w0.founderT : w0.night.onset.found.t) - w0.night.tTouch) / 60);   // G12: her end, the hand-over
  const dir = path.join(__dirname, '..', 'out', 'gate', 'gallery_tests'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const a = await GA.run({ jobs: 1, members: 2, out: path.join(dir, 'one.json') }, (s) => console.log('  ' + s)), t = a.table;
  // 6 first, before anything else runs here: the watch again, and the modules
  const w1 = N.sink(N.create(ship, N.spec(1912), { auto: true }));
  const back = E.ICE.alpha === keep.alpha && E.ICE.openAlong === keep.openAlong && cal().offCal === keep.offCal;
  // 1. each card's baseline is the watch's own foundering
  const bases = [['the baseline', t.baseline.fp, t.baseline.k, t.baseline.table.landed.T]].concat(t.cards.map((c) => [c.id, c.baseline.fp, c.baseline.k, c.baseline.landed.T]));
  const bad1 = bases.filter(([, fp, k, T]) => fp !== fp0 || k !== k0 || T !== T0);
  row('MUST', 'each card\'s baseline is the watch\'s own foundering: the landed member, no what-if, is the 1912 watch run alone', bases.length + ' baselines (' + bases.map((b) => b[0]).join(', ') + '): ' + (bad1.length ? 'DIFFER: ' + bad1.map((b) => b[0] + ' ' + b[1] + ' at ' + b[2] + ', T ' + b[3]).join('; ') : t.baseline.fp + ' at step ' + t.baseline.k + ', T ' + t.baseline.table.landed.T),
    fp0 + ' at step ' + k0 + ', T ' + T0 + ' (Night.sink, Night.create(ship, Night.spec(1912), { auto: true }))', bad1.length === 0);
  // 2. the readers' cards change nothing in the model
  const M = a.all, by = (id) => M.map((m) => m.cards[id]);
  for (const id of ['californian', 'boats']) {
    const diff = M.filter((m) => m.cards[id].fp !== m.base.fp || m.cards[id].k !== m.base.k || m.cards[id].T !== m.base.T).length;
    row('MUST', 'the readers\' card ' + id + ' changes nothing in the model: each member\'s fingerprint, step and founder are its baseline\'s', diff ? diff + ' of ' + M.length + ' DIFFER' : 'the same in ' + M.length + ' of ' + M.length + ' (' + M.map((m) => m.cards[id].fp).join(' ') + ')', 'the same: a reader writes into none of the model', diff === 0);
  }
  // 3. each card's what-if was applied
  const every = (id, f) => M.every((m) => f(m.cards[id], m.base));
  const sOf = (id, f) => M.map((m) => f(m.cards[id], m.base)).join('; ');
  row('MUST', 'card headOn: no helm order in the log, the engines stopped as recorded', sOf('headOn', (c, b) => 'helm orders ' + c.ev.helm + ' (as recorded ' + b.ev.helm + '), orders ' + c.ev.orders + ', the stem crushed ' + c.enc.crush + ' m'),
    'no helm order; the one order the telegraph\'s stop a minute after the touch', every('headOn', (c, b) => c.ev.helm === 0 && b.ev.helm > 0 && c.ev.orders === 1));
  const u = Mo.create({ knots: N.spec(1912).speedKn }).u;
  row('MUST', 'card lookout: the bells at the same moment, the berg 30 s of her way farther off', sOf('lookout', (c, b) => 'bells t ' + c.ev.tBells + ' s (as recorded ' + b.ev.tBells + '), range ' + c.ev.rangeBells + ' m (' + b.ev.rangeBells + '), sighting +' + r4(c.ev.sighting - b.ev.sighting) + ' m'),
    'the same bells; the sighting +' + r4(30 * u) + ' m (30 u), the range at the bells within a step\'s way of it', every('lookout', (c, b) => c.ev.tBells === b.ev.tBells && Math.abs(c.ev.sighting - b.ev.sighting - 30 * u) < 1e-6 && Math.abs(c.ev.rangeBells - b.ev.rangeBells - 30 * u) < u * 0.25 + 1e-6));
  row('MUST', 'card doors: every door, C to O, raised by order at the start, its float disarmed, open at the end, none dropped', sOf('doors', (c, b) => 'orders ' + c.ev.door + ', open ' + c.ev.open + ', floats armed ' + c.ev.armed + ', dropped ' + c.ev.fell + ' (as recorded: open ' + b.ev.open + ', armed ' + b.ev.armed + ')'),
    GA.DOORED.length + ' door orders, ' + GA.DOORED.length + ' open, no float armed, none dropped', every('doors', (c) => c.ev.door === GA.DOORED.length && c.ev.open === GA.DOORED.length && c.ev.armed === 0 && c.ev.fell === 0));
  const topsOf = (tops) => C.BULKHEADS.map((b) => tops[b.id] || b.top).join('');
  for (const [id, tops] of [['bulkD', GA.BULK_D], ['bulkB', GA.BULK_B]]) {
    row('MUST', 'card ' + id + ': the bulkheads\' tops (sim.bulkTop, A to P) changed', sOf(id, (c, b) => c.ev.tops + ' (as recorded ' + b.ev.tops + ')'), topsOf(tops), every(id, (c, b) => c.ev.tops === topsOf(tops) && b.ev.tops === topsOf({})));
  }
  row('MUST', 'card californian: her operator listening, she hears the first CQD by wireless and comes', sOf('californian', (c, b) => 'heard T ' + c.world.cal.heardT + ' (' + c.world.cal.how + '), alongside T ' + c.world.cal.alongT + ' (as recorded: ' + (b.world.cal.heardT === null ? 'never heard' : 'heard T ' + b.world.cal.heardT) + ')'),
    'heard at the first CQD, T 47 on the 2:02 clock; never as recorded', every('californian', (c, b) => c.world.cal.listening && c.world.cal.how === 'wireless' && Math.abs(c.world.cal.heardT - 47) < 0.1 && b.world.cal.heardT === null && !b.world.cal.listening));
  row('MUST', 'card boats: "fill her" on both sides and boats lowered full, by the reader\'s orders, none refused', sOf('boats', (c, b) => 'rule ' + c.people.rule + ', fill ' + c.people.fill + ', orders ' + c.people.orders + ', refused ' + c.people.refused + ' (as recorded: ' + b.people.rule + ', ' + b.people.fill + ')'),
    'fill/fill, 1, three orders, none refused; port only and starboard first, 0.3, as recorded', every('boats', (c, b) => c.people.rule === 'fill/fill' && c.people.fill === 1 && c.people.orders === 3 && c.people.refused === 0 && b.people.rule === 'only/first' && b.people.fill === 0.3));
  // 4. the method on the 1912 preset
  {
    const ids = C.BULKHEADS.map((b) => b.id);
    const cases = [
      ['the bulkheads C to J to D deck', (s) => { s.bulkTop = GA.BULK_D; }, (sim) => { for (const id of Object.keys(GA.BULK_D)) C.setBulkheadTop(sim, ids.indexOf(id), GA.BULK_D[id]); }],
      ['every bulkhead to B deck', (s) => { s.bulkTop = GA.BULK_B; }, (sim) => { for (const id of Object.keys(GA.BULK_B)) C.setBulkheadTop(sim, ids.indexOf(id), GA.BULK_B[id]); }],
      ['the doors left open', (s) => { s.doorsOpen = ids; }, (sim) => { for (const b of GA.DOORED) C.setDoor(sim, b, true); }],
    ];
    const plain = presetDigest(null, null, ship);
    for (const [what, inScen, onSim] of cases) {
      const p = presetDigest(inScen, null, ship), q = presetDigest(null, onSim, ship);
      row('MUST', 'the method, on the 1912 preset, ' + what + ': set after the sim is made, as on the watch, it is validate\'s what-if to the bit', 'in the scenario ' + p.d + (p.foundered ? ' (T ' + p.T + ')' : ' (afloat at 3 h)') + '; after ' + q.d + '; without it ' + plain.d,
        'the same 3 h of water, pose and founder; and not the preset without it', p.d === q.d && p.d !== plain.d);
    }
  }
  // 5. the same table with one thread or three
  const b = await GA.run({ jobs: 3, members: 2, out: path.join(dir, 'three.json') });
  const same = fs.readFileSync(a.file, 'utf8') === fs.readFileSync(b.file, 'utf8');
  row('MUST', 'the same table with one thread or three (the landed member and the first two of the kept set, every card)', same ? 'the same, byte for byte' : 'DIFFERENT', 'the same', same);
  // 6. after the gallery in this thread
  row('MUST', 'the watch\'s fingerprint is unchanged after the gallery has run in this thread; Encounter.ICE and World.SHIPS set back', N.fingerprint(w1) + ' at step ' + w1.night.k + '; ' + (back ? 'set back' : 'NOT set back'), fp0 + ' at step ' + k0 + ' (before it); the modules as they were', N.fingerprint(w1) === fp0 && w1.night.k === k0 && back);
  // CHECK: the words
  row('CHECK', 'the baseline\'s words', t.baseline.say, '', true);
  for (const c of t.cards) row('CHECK', 'card ' + c.id + '\'s words', c.say, '', true);
  // CHECK: the full table, where it is of this code: its baseline over the kept set is NH3's watch, member by member
  {
    const f = path.join(__dirname, '..', 'out', 'gallery_1912.json'), e = path.join(__dirname, '..', 'out', 'ensemble_1912.json');
    if (!fs.existsSync(f) || !fs.existsSync(e)) row('CHECK', 'the full table against NH3\'s', 'out/gallery_1912.json or out/ensemble_1912.json missing', 'both', false);
    else {
      // G12: the gallery's watches end at the hand-over, the break's onset, so its baseline is NH3's ONSET band (NH3's
      // watch runs to the flag, G12's step 0, and measures the onset on the way, by the same look as the night's check)
      const g = JSON.parse(fs.readFileSync(f, 'utf8')), en = JSON.parse(fs.readFileSync(e, 'utf8')), kb = EN.bandOf(g.baseline.runs.filter((r) => r.m !== 'landed').map((r) => r.T)), eb = en.onset.watch;
      const tb = g.baseline.table.founder;              // the table's own band of her end: over the kept set, as NH3's (the landed member beside)
      const ok = g.core === EN.codeHash() && g.core === en.core && kb.lo === eb.lo && kb.med === eb.med && kb.hi === eb.hi && kb.n === eb.n && g.baseline.table.landed.T === en.landed.watch.onset &&
        g.N === eb.n && tb.lo === eb.lo && tb.med === eb.med && tb.hi === eb.hi && tb.n === eb.n;
      row('CHECK', 'the full table (out/gallery_1912.json, N ' + g.N + ', core ' + g.core + '): its baseline over the kept set, and its own band, are NH3\'s watch\'s onset (G12: the hand-over)', 'T ' + kb.lo + ' to ' + kb.hi + ' (median ' + kb.med + ', ' + kb.n + '); its band ' + tb.lo + ' to ' + tb.hi + ' (median ' + tb.med + ', ' + tb.n + '); the landed T ' + g.baseline.table.landed.T + ', ' + g.baseline.fp,
        'NH3 (core ' + en.core + '): the onset T ' + eb.lo + ' to ' + eb.hi + ' (median ' + eb.med + ', ' + eb.n + '); the landed onset T ' + en.landed.watch.onset + '; this code ' + EN.codeHash(), ok);
    }
  }
  for (const [kind, what, value, ref, ok] of rows) console.log((ok ? 'PASS ' : (kind === 'MUST' ? 'FAIL ' : 'CHECK ')) + kind.padEnd(6) + what.padEnd(118) + ' ' + String(value).slice(0, 900) + '   ' + ref);
  console.log('\n(' + Math.round((Date.now() - t0) / 1000) + ' s)');
  console.log(fails ? 'FAIL: ' + fails + ' MUST row(s)' : 'PASS: all ' + rows.filter((r) => r[0] === 'MUST').length + ' MUST rows');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
