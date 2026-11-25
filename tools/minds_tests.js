// Ask the bridge, stage A: the crew's own words (site/parts/87_minds_words.js), headless, in seconds.
//   node tools/minds_tests.js
// docs/DESIGN_ask_the_bridge_v1_2026-11-23.md, section 13, the first list. Every row is a MUST:
//   1. the whitelist: the gathering function reads only the listed paths of the state, writes nothing, and keeps no
//      reference into it; the library reads no DOM, clock or network
//   2. what the bridge cannot know changes nothing: on copies of the 1912 watch at three moments, each hidden change leaves
//      every seat's THE FACTS (and who is in reach) byte for byte
//   3. what the bridge learns changes it: a report delivered, an order given, the time
//   4. news has a speed: through the 1912 watch, no report, line or estimate stands in THE FACTS before the step the
//      readers delivered it
//   5. reach: each row of the design's section 4 against the state that sets it, and the 1912 night's moments
//   6. reading a turn: replies of every kind, each to its exact outcome; it never throws
//   7. the checks: lines each passing or failing with its named fault
//   8. orders: a restated order read by step 1's grammar within the seat's remit, in the convention in force; two orders,
//      one outside the remit, one the grammar does not know: each dropped
//   9. the request: a man's stable part has the same bytes at every moment of the night; no request holds a key, a host or
//      an address; the schema is the fixed one, the app's own
//  10. the fake gives the same answer to the same request
//  11. people only: every line's speaker is a named person, and every generated line is marked as imagined
//  12. neutral: building THE FACTS at every step of a 1912 watch leaves its fingerprint and every reader's state as they were
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const C = require('../core/core.js');
const Mo = require('../core/motion.js');
const N = require('../core/night.js');
const People = require('../core/readers/people.js');
const World = require('../core/readers/world.js');
const Reports = require('../core/readers/reports.js');
const CW = require('../site/parts/85_crew_words.js');
const MW = require('../site/parts/87_minds_words.js');
const root = path.join(__dirname, '..');
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push(ok); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(92) + ' ' + String(value).padEnd(48) + ' ' + ref); }
const clip = (s, n) => (s.length > n ? s.slice(0, n - 3) + '...' : s);
const list = (bad, n) => bad.slice(0, n || 3).join('; ') + (bad.length > (n || 3) ? '; and ' + (bad.length - (n || 3)) + ' more' : '');
const ship = C.buildShip(), spec = N.spec(1912);
// a deep copy of a sim: plain objects, arrays, typed arrays, maps and sets copied; the ship (geometry) and functions shared
function deepCopy(x, seen) {
  seen = seen || new Map();
  if (x === null || typeof x !== 'object') return x;
  if (seen.has(x)) return seen.get(x);
  if (ArrayBuffer.isView(x)) { const y = new x.constructor(x); seen.set(x, y); return y; }
  if (Array.isArray(x)) { const y = []; seen.set(x, y); for (let i = 0; i < x.length; i++) y.push(deepCopy(x[i], seen)); return y; }
  if (x instanceof Map) { const y = new Map(); seen.set(x, y); for (const [k, v] of x) y.set(k, deepCopy(v, seen)); return y; }
  if (x instanceof Set) { const y = new Set(); seen.set(x, y); for (const v of x) y.add(deepCopy(v, seen)); return y; }
  const y = {}; seen.set(x, y);
  for (const k of Object.keys(x)) y[k] = k === 'ship' ? x[k] : deepCopy(x[k], seen);
  return y;
}
const allFacts = (sim, ctx) => MW.SEATS.map(s => MW.facts(MW.gather(sim), s, ctx || {}));
const json = (x) => JSON.stringify(x, (k, v) => (ArrayBuffer.isView(v) ? Array.from(v) : v));
// Run A: the 1912 watch on its own orders, alone (nothing of this library runs beside it), to her end. On its way it keeps
// deep copies of itself at the moments the rows below look at (minutes after the touch), which the rows read and step on
const SNAP = [1, 2, 10, 12.5, 22, 25.5, 26, 30, 36, 46, 52, 90];
const snaps = {};
const runA = (() => {
  const s = N.create(ship, spec, { auto: true });
  snaps.start = deepCopy(s);
  let i = 0;
  for (;;) {
    if (!snaps.bells && s.night.tBells >= 0) snaps.bells = deepCopy(s);
    while (i < SNAP.length && s.night.tTouch >= 0 && s.t >= s.night.tTouch + SNAP[i] * 60) { snaps[SNAP[i]] = deepCopy(s); snaps['fp' + SNAP[i]] = [s.night.k, N.fingerprint(s)]; i++; }
    if (N.over(s)) break;
    N.step(s);
  }
  snaps.end = deepCopy(s);
  return s;
})();
const snap = (m) => deepCopy(snaps[m]);

// ------------------------------------------------------------------ 1. the whitelist
console.log('1. the whitelist: the one function that reads the state reads only what is listed');
// a sim that records every path read from it (a[] each element of an array, o{} an object's keys) and every write
function recorder(target) {
  const reads = new Set(), writes = [];
  const wrap = (obj, base) => new Proxy(obj, {
    get(t, key, recv) {
      if (typeof key === 'symbol') { reads.add(base + '[symbol]'); return Reflect.get(t, key, recv); }
      const p = (Array.isArray(t) || ArrayBuffer.isView(t)) && /^\d+$/.test(key) ? base + '[]' : base + '.' + key;
      reads.add(p);
      const v = Reflect.get(t, key, recv), d = Reflect.getOwnPropertyDescriptor(t, key);
      if (d && d.configurable === false && d.writable === false) return v;          // a proxy may not stand in for a frozen value
      return v && typeof v === 'object' && !ArrayBuffer.isView(v) ? wrap(v, p) : v;
    },
    has(t, key) { reads.add(base + '.' + String(key) + '?'); return Reflect.has(t, key); },
    ownKeys(t) { reads.add(base + '{}'); return Reflect.ownKeys(t); },
    getOwnPropertyDescriptor(t, key) { reads.add(base + '{}'); return Reflect.getOwnPropertyDescriptor(t, key); },
    set(t, key) { writes.push(base + '.' + String(key)); return true; },
    defineProperty(t, key) { writes.push(base + '.' + String(key)); return true; },
    deleteProperty(t, key) { writes.push(base + '.' + String(key)); return true; },
  });
  return { sim: wrap(target, 'sim'), reads, writes };
}
const WL = MW.WHITELIST;
function allowed(p) {
  if (WL.indexOf(p) >= 0) return true;
  if (WL.some(w => w.startsWith(p + '.') || w.startsWith(p + '[') || w.startsWith(p + '{'))) return true;     // on the way to a listed path
  if (p.endsWith('.length')) { const a = p.slice(0, -7) + '[]'; return WL.some(w => w.startsWith(a)); }    // an array's length, to walk it
  return false;
}
const forbidden = (p) => MW.FORBIDDEN.some(f => p === f || p.startsWith(f + '.') || p.startsWith(f + '['));
{
  // the copies are the watch: one taken at T+10 and stepped on reaches T+12.5 with the watch's own fingerprint
  const c = snap(10), want = snaps['fp12.5'];
  while (c.night.k < want[0]) N.step(c);
  row('(the copies of the watch the rows below read are faithful: stepped on, a copy keeps the watch\'s fingerprint)', N.fingerprint(c) + ' at step ' + c.night.k, want[1] + ' at step ' + want[0], N.fingerprint(c) === want[1] && c.night.k === want[0]);
  const moments = [['the start', snap('start')], ['the bells', snap('bells')]];
  for (const m of [1, 10, 25.5, 30, 46, 90]) moments.push(['T+' + m, snap(m)]);
  moments.push(['she has gone', snap('end')]);
  const bare = N.create(ship, spec, { auto: true, readers: false }); while (bare.t < 120) N.step(bare);
  moments.push(['a watch with no readers', bare]);
  const drawn = N.create(ship, N.spec(7), { auto: true }); while (drawn.t < 900 && !N.over(drawn)) N.step(drawn);
  moments.push(['a drawn night (seed 7)', drawn]);
  const off = [], bad = [], wrote = [], paths = new Set();
  for (const [label, s] of moments) {
    const r = recorder(s);
    const v = MW.gather(r.sim);
    for (const p of r.reads) { paths.add(p); if (!allowed(p)) off.push(label + ': ' + p); if (forbidden(p)) bad.push(label + ': ' + p); }
    for (const p of r.writes) wrote.push(label + ': ' + p);
    // the view is plain data, the same as gathered from the sim itself
    if (json(v) !== json(MW.gather(s))) off.push(label + ': the view through the recorder differs');
  }
  row('gather reads only paths on its WHITELIST, at nine moments of three watches', off.length ? clip(list(off, 2), 160) : paths.size + ' paths read, all listed', 'the WHITELIST (' + WL.length + ' entries)', off.length === 0);
  row('  none of what the bridge cannot know: water, plant, pose, forecast, a report\'s data, ships, people, fall, onset', bad.length ? clip(list(bad, 2), 160) : 'none read', MW.FORBIDDEN.length + ' forbidden paths', bad.length === 0);
  row('  it writes nothing into the state', wrote.length ? clip(list(wrote, 2), 160) : 'no write', 'none', wrote.length === 0);
  const listed = WL.filter(forbidden);
  row('  the WHITELIST itself names none of the forbidden paths', listed.length ? listed.join(', ') : WL.length + ' entries, none forbidden', 'none', listed.length === 0);
  // the view keeps no reference into the state: changing every part of it changes nothing that a second gather sees
  const s = moments[5][1], v1 = MW.gather(s), before = json(MW.gather(s));
  (function scramble(o) { if (!o || typeof o !== 'object') return; if (Array.isArray(o)) { o.forEach(scramble); o.push('x'); return; } for (const k of Object.keys(o)) { if (o[k] && typeof o[k] === 'object') scramble(o[k]); else o[k] = 'x'; } })(v1);
  row('  the view is a copy: scrambling every part of one leaves the next gather as it was', json(MW.gather(s)) === before ? 'the same' : 'CHANGED', 'the same', json(MW.gather(s)) === before);
}
{
  const file = path.join(root, 'site', 'parts', '87_minds_words.js'), src = fs.readFileSync(file, 'utf8');
  const code = src.split(/\r?\n/).filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).filter(l => l.indexOf("module.exports = factory(require('./85_crew_words.js'))") < 0).join('\n');
  const reads = code.match(/\b(document|window|localStorage|sessionStorage|performance|Date|setTimeout|setInterval|requestAnimationFrame|fetch|XMLHttpRequest|WebSocket|navigator|location|process|require|TitanicApp|TitanicCore|TitanicNight|TitanicReports|TitanicPeople|TitanicWorld|TitanicMotion)\b|Math\.random/g) || [];
  row('the library reads no DOM, no clock, no chance, no network and no model (its one require is step 1\'s grammar)', reads.length ? Array.from(new Set(reads)).join(', ') : 'none', 'none', reads.length === 0);
  const box = vm.createContext({}), keys0 = Object.getOwnPropertyNames(box);
  vm.runInContext(fs.readFileSync(path.join(root, 'site', 'parts', '85_crew_words.js'), 'utf8'), box, { filename: '85_crew_words.js' });
  vm.runInContext(src, box, { filename: '87_minds_words.js' });
  const added = Object.getOwnPropertyNames(box).filter(k => keys0.indexOf(k) < 0).sort();
  const ok = added.join() === 'TitanicCrewWords,TitanicMindsWords' && typeof box.TitanicMindsWords.gather === 'function' && box.TitanicMindsWords.readTurn('{"say": "Yes, sir.", "order": null}').ok === true;
  row('  loaded as a page loads it (after step 1\'s grammar), it puts nothing on the global object but its name', added.join(', '), 'TitanicCrewWords, TitanicMindsWords', ok);
  const nonAscii = src.split(/\r?\n/).map((l, i) => (/[^\x00-\x7f]/.test(l) ? i + 1 : 0)).filter(Boolean);
  const deep = (o) => Object.isFrozen(o) && Object.keys(o).every(k => (o[k] && typeof o[k] === 'object' ? deep(o[k]) : true));
  row('  its source is ASCII; its tables and the library are frozen: it keeps no state', 'ASCII ' + (nonAscii.length ? 'NO (lines ' + nonAscii.slice(0, 5).join(', ') + ')' : 'yes') + '; frozen ' + (deep(MW.CAST) && deep(MW.TABLES) && deep(MW.FAKE) && Object.isFrozen(MW)),
    'ASCII; frozen', nonAscii.length === 0 && deep(MW.CAST) && deep(MW.TABLES) && deep(MW.FAKE) && deep(MW.WHITELIST) && Object.isFrozen(MW));
  // the model's names it copies, held to the code
  const tel = JSON.stringify(MW.TABLES.TELEGRAPH) === JSON.stringify(Mo.TELEGRAPH);
  const names = JSON.stringify(MW.TABLES.NAMES) === JSON.stringify(Reports.NAMES) && MW.TABLES.TRIM0 === Reports.TRIM[0];
  const rules = JSON.stringify(MW.TABLES.RULE_WORDS) === JSON.stringify(People.RULE_WORDS);
  const relief = /The lookouts and the wheel are relieved\./.test(fs.readFileSync(path.join(root, 'core', 'readers', 'reports.js'), 'utf8'));
  const boatIds = JSON.stringify(MW.TABLES.BOATS) === JSON.stringify(People.BOATS.map(b => b.id));
  row('  its copies of the model\'s names are the model\'s: the telegraph, the spaces, the trim, the boats\' rules, the relief, the boats in their order', [tel, names, rules, relief, boatIds].join(' '), 'core/motion.js, core/readers/reports.js, people.js', tel && names && rules && relief && boatIds);
}

// ------------------------------------------------------------------ 2. what the bridge cannot know changes nothing
console.log('\n2. what the bridge cannot know changes nothing: hidden changes on copies of the 1912 watch');
const HIDDEN = [
  ['water in a space reported dry, or not at all', (s) => {
    const z = s.reports.zones.findIndex(z => z.state === 'unknown'), k = z >= 0 ? z : s.reports.zones.findIndex(z => z.state === 'dry');
    if (k < 0) return false;
    for (let j = 0; j < 4; j++) { const n = k * 4 + j; s.vol[n] += 500; s.level[n] += 2; }
    return true;
  }],
  ['the steam (the plant\'s pressure)', (s) => { if (!s.plant) return false; s.plant.p *= 0.25; s.plant.gen = 0; return true; }],
  ['another ship moved', (s) => { const sh = s.world.ships[0]; sh.X += 9000; sh.Y -= 4000; sh.nm += 5; return true; }],
  ['the estimate\'s own forecast', (s) => { const e = s.reports.estimate; if (!e) return false; e.forecast = (e.forecast || 0) + 47; e.biased = (e.biased || 0) + 23; return true; }],
  ['the forecast running before the estimate', (s) => { const sh = s.reports.shadow; if (!sh) return false; sh.founderT += 3600; sh.done = !sh.done; return true; }],
  ['the counts in the boats', (s) => { const b = s.people.boats[0]; b.n += 17; b.wc += 9; s.people.count.aboard -= 17; s.people.count.inBoats += 17; return true; }],
  ['a report\'s data, quantity and time of its fact', (s) => { const f = s.reports.feed[s.reports.feed.length - 1]; if (!f) return false; f.data = { hidden: 1 }; f.qty += ' (hidden)'; f.tFact -= 200; return true; }],
  ['a report still on its way (its words)', (s) => { if (!s.reports.queue.length) return false; for (const q of s.reports.queue) { q.words = 'HIDDEN WORDS'; q.data = { hidden: 1 }; } return true; }],
  ['her true pose, but the list', (s) => { s.pitch += 0.01; s.zO -= 0.4; return true; }],
  ['the fall and the onset', (s) => { s.fall = { v: 2, pieces: [] }; s.onset = { found: { t: s.t } }; return true; }],
  ['the model\'s own events', (s) => { s.events.push({ t: s.t, id: 'hidden', label: 'hidden' }); return true; }],
];
{
  for (const m of [10, 30, 90]) {
    const sim = snaps[m];
    const base = allFacts(sim), baseReach = json(MW.reach(sim)), bad = [], applied = [];
    for (const [name, change] of HIDDEN) {
      const copy = deepCopy(sim);
      if (!change(copy)) continue;
      applied.push(name);
      const f = allFacts(copy), r = json(MW.reach(copy));
      const off = MW.SEATS.filter((s, i) => f[i] !== base[i]);
      if (off.length || r !== baseReach) bad.push(name + ' moved ' + (off.join('/') || 'reach'));
    }
    const ok = bad.length === 0 && applied.length >= 8 && applied.indexOf('water in a space reported dry, or not at all') >= 0 && applied.indexOf('the steam (the plant\'s pressure)') >= 0
      && applied.indexOf('another ship moved') >= 0 && applied.indexOf('the counts in the boats') >= 0 && (m < 25 || applied.indexOf('the estimate\'s own forecast') >= 0);
    row('T+' + m + ': each hidden change leaves every seat\'s THE FACTS and who is in reach byte for byte', bad.length ? clip(list(bad, 2), 160) : applied.length + ' changes, none seen', 'water, steam, ships, forecasts, boats\' counts, data, queue, pose, fall', ok);
  }
}
// ... and STEPPED ON (the review of stage A: a change that the readers themselves carry into the state is a leak the rows
// above cannot see, since they never step). The plant's hidden state reached THE FACTS through the wireless room's log:
// with boiler room 3's fires out the operators key "Engine room flooded", and a set without current says why, with its
// volts. News has a speed: within two seconds of her time nothing of a hidden change may stand in any seat's THE FACTS.
const STEPPED = [
  ['boiler room 3\'s fires out', (s) => { if (!s.plant || !s.plant.out) return false; s.plant.out[3] = 1; return true; }],
  ['the steam falls to a quarter', (s) => { if (!s.plant) return false; s.plant.p *= 0.25; s.plant.gen = 0; return true; }],
  ['no steam at all', (s) => { if (!s.plant) return false; s.plant.p = 0; s.plant.gen = 0; return true; }],
  ['500 m3 of water in a space the bridge thinks dry, or knows nothing of', HIDDEN[0][1]],
  ['the counts in the boats', (s) => { const b = s.people.boats[0]; b.n += 17; b.wc += 9; s.people.count.aboard -= 17; s.people.count.inBoats += 17; return true; }],
];
{
  const STEPS = 8, bad = [], seenBefore = [];
  let applied = 0;
  for (const m of [46, 90]) {
    const base = snap(m); for (let i = 0; i < STEPS; i++) N.step(base);
    const fb = allFacts(base), rb = json(MW.reach(base));
    for (const [name, change] of STEPPED) {
      const copy = snap(m);
      if (!change(copy)) continue;
      applied++;
      for (let i = 0; i < STEPS; i++) N.step(copy);
      const f = allFacts(copy), off = MW.SEATS.filter((s, i) => f[i] !== fb[i]);
      if (off.length || json(MW.reach(copy)) !== rb) {
        const a = fb[MW.SEATS.indexOf(off[0] || 'murdoch')].split('\n'), added = f[MW.SEATS.indexOf(off[0] || 'murdoch')].split('\n').filter(l => a.indexOf(l) < 0);
        bad.push('T+' + m + ', ' + name + ' reached ' + (off.join('/') || 'reach') + (added.length ? ': "' + clip(added[0].trim(), 70) + '"' : ''));
      }
      // the change did move the wireless room's log (so the row can fail): what the operators keyed, or the set's state
      const lb = base.world.lines.map(l => l.text), lc = copy.world.lines.map(l => l.text).filter(t => lb.indexOf(t) < 0);
      if (lc.length) seenBefore.push(lc[0]);
    }
  }
  row('stepped two seconds on, a hidden change of the plant, the water or the boats is still in no seat\'s THE FACTS, though the wireless room\'s log has it', bad.length ? clip(list(bad, 2), 200) : applied + ' changes at T+46 and T+90, none seen; the log gained: "' + clip(seenBefore[0] || 'NOTHING', 50) + '"',
    'none seen; the log did gain a line', bad.length === 0 && applied >= 8 && seenBefore.length >= 1);
  // the kinds of the log's lines the bridge is given, and that no line of the others ever stands in THE FACTS on run A
  const end = snaps.end, kinds = {}, leaked = [];
  for (const l of end.world.lines) kinds[l.kind] = (kinds[l.kind] || 0) + 1;
  for (const m of [30, 46, 52, 90]) {
    const s = snaps[m], f = MW.facts(MW.gather(s), 'murdoch', {});
    for (const l of s.world.lines) if (l.kind !== 'order' && l.kind !== 'in' && l.kind !== 'seen' && f.indexOf(l.text.replace(/\s+/g, ' ').trim()) >= 0) leaked.push('T+' + m + ': ' + l.kind + ' "' + clip(l.text, 40) + '"');
  }
  row('  of the wireless room\'s log the bridge has its own acts, what is seen from it and a ship\'s answer: never what the operators keyed nor the set\'s state', leaked.length ? clip(list(leaked, 2), 160) : Object.keys(kinds).sort().map(k => k + ' ' + kinds[k]).join(', ') + ' on the night; none of out or set in THE FACTS',
    'order, in, seen only', leaked.length === 0 && (kinds.out || 0) >= 3 && JSON.stringify(Object.keys(MW.WORLD_KINDS).sort()) === JSON.stringify(['in', 'order', 'seen']));
}

// ------------------------------------------------------------------ 3. what the bridge learns changes it
console.log('\n3. what the bridge learns changes it');
{
  const sim = snap(10), f0 = MW.facts(MW.gather(sim), 'murdoch', {}), n0 = sim.reports.feed.length;
  while (sim.reports.feed.length === n0) N.step(sim);
  const e = sim.reports.feed[sim.reports.feed.length - 1], f1 = MW.facts(MW.gather(sim), 'murdoch', {});
  row('a report delivered changes THE FACTS, and its words stand there', '"' + clip(e.words, 60) + '" (' + e.who + ')', 'in THE FACTS from its step', f0 !== f1 && f1.indexOf(e.words.replace(/\s+/g, ' ').trim()) >= 0 && f0.indexOf(e.words) < 0);
  const copy = deepCopy(sim), g0 = MW.facts(MW.gather(copy), 'murdoch', {});
  N.act(copy, 'telegraph', 'half ahead');
  const g1 = MW.facts(MW.gather(copy), 'murdoch', {});
  row('  an order given changes them: the telegraphs and the orders of the watch', /The engine telegraphs: Half ahead\./.test(g1) && /: Half ahead\.$/m.test(g1) ? 'Half ahead, twice' : 'NOT SEEN', 'the telegraphs; the orders list', g0 !== g1 && /The engine telegraphs: Half ahead\./.test(g1) && /: Half ahead\.$/m.test(g1));
  // a helm order stands there in the bridge's own words, and its degrees are then a measure he may say (the review of
  // the measure check: "twenty degrees of helm" failed while THE FACTS said "Port twenty")
  const hm = deepCopy(sim); N.act(hm, 'helm', 20);
  const g2 = MW.facts(MW.gather(hm), 'murdoch', {}), helmLine = (g2.split('\n').filter(l => l.indexOf('- The helm, as ordered: ') === 0)[0] || '');
  const hchk = (say) => { const r = MW.check(say, g2, MW.BY.murdoch, {}); return r.ok ? 'ok' : r.faults.map(f => f.kind + ' "' + f.what + '"').join(' '); };
  const hsaid = [hchk('Port twenty, sir. Twenty degrees of helm on her.'), hchk('She has ten degrees of helm on, sir.')];
  row('  a helm order stands there in the bridge\'s words, and its degrees are a measure he may say (and no other)', clip(helmLine, 60) + ' | ' + hsaid.join(', '), 'Port twenty; ok, number "ten degrees"',
    helmLine.indexOf('- The helm, as ordered: ' + CW.phrase({ type: 'helm', value: 20 }, {}).replace(/\.$/, '') + '.') === 0 && /Port twenty/.test(helmLine) && hsaid.join() === 'ok,number "ten degrees"');
  const t1 = deepCopy(sim); t1.t += 60;
  const h0 = MW.facts(MW.gather(sim), 'murdoch', {}).split('\n')[1], h1 = MW.facts(MW.gather(t1), 'murdoch', {}).split('\n')[1];
  row('  the time changes them: the ship\'s clock and the minutes since she struck', clip(h1, 70), 'a minute on', h0 !== h1 && /minutes ago\.$/.test(h1));
  // the course and the speed set for the watch are the bridge's own: the first thing a captain asks his officer
  const st = MW.facts(MW.gather(snaps.start), 'murdoch', {}), line = st.split('\n')[2] || '';
  const slow = MW.facts(MW.gather(N.create(ship, N.spec(1912, { speedKn: 18 }), { auto: true })), 'murdoch', {}).split('\n')[2] || '';
  const chk = (say) => { const r = MW.check(say, st, MW.BY.murdoch, {}); return r.ok ? 'ok' : r.faults.map(f => f.kind).join(' '); };
  const said = [chk('She is making twenty-two and a half knots, sir.'), chk('22.5 knots, sir.'), chk('South 86 west true, sir.'), chk('Twenty-four knots, sir.')];
  row('  the course and the speed set for the watch stand there, as an officer of 1912 gave them, and he may say them (and no other speed)', clip(line, 78) + ' | ' + said.join(', '),
    'S 86 W true, 22 1/2 knots (22.5); ok, ok, ok, number', line === '- When this watch began she was steering S 86 W true and making 22 1/2 knots (22.5) by the revolutions.' && / making 18 knots by the revolutions\.$/.test(slow)
    && said.join() === 'ok,ok,ok,number' && MW.facts(MW.gather(snaps.start), 'bell', {}).indexOf('knots') < 0);
}

// ------------------------------------------------------------------ 4. news has a speed (run B), and 12
// Run B: the same watch as run A, THE FACTS built for every seat at every step; checked as it goes
console.log('\n4. news has a speed: through the 1912 watch, nothing stands in THE FACTS before the step that delivered it');
const FEED = runA.reports.feed.map(e => e.words.replace(/\s+/g, ' ').trim()), LINES = runA.world.lines.map(l => l.text.replace(/\s+/g, ' ').trim());
const ESTIMATE = runA.reports.estimate ? runA.reports.estimate.words : null;
let runB, stableBad = [], requestBad = [], early = [], sizeMax = 0, samples = 0, stateBad = [], shipSpeaker = [], factsBuilt = 0;
const spoke = [], spokeBad = []; let nSpoke = 0;            // 13: each report of the night, and the man who would give it (stage C)
{
  const s = N.create(ship, spec, { auto: true });
  const stable0 = {}; for (const c of MW.CAST) for (const conv of ['1912', 'modern']) stable0[c.id + conv] = MW.stable(c.id, { convention: conv });
  let last = '', lastE = '';
  const HOST = [/https?:\/\//i, /\bwww\./i, /\b[a-z0-9-]+\.(com|net|org|io|ai|dev|app|cloud)\b/i, /\blocalhost\b/i, /\b127\.0\.0\.1\b/];
  const KEYISH = [/\bapi[ _-]?key\b/i, /\bauthorization\b/i, /\bbearer\b/i, /\bx-api-key\b/i, /\bsk-[A-Za-z0-9]/, /\btoken=/i, /\bpassword\b/i];
  for (;;) {
    const v = MW.gather(s);
    const F = MW.SEATS.map(seat => MW.facts(v, seat, {}));
    factsBuilt += F.length;
    const f = F[0], fe = F[F.length - 1];
    if (f !== last) {                                       // the text changed: hold it to what has been delivered
      const nFeed = s.reports.feed.length, nLines = s.world.lines.length, now = new Set(s.reports.feed.map(e => e.words.replace(/\s+/g, ' ').trim())), nowL = new Set(s.world.lines.map(l => l.text.replace(/\s+/g, ' ').trim()));
      for (let i = nFeed; i < FEED.length; i++) if (!now.has(FEED[i]) && f.indexOf(FEED[i]) >= 0) early.push('step ' + s.night.k + ': report ' + (i + 1) + ' "' + clip(FEED[i], 40) + '"');
      for (let i = nLines; i < LINES.length; i++) if (!nowL.has(LINES[i]) && f.indexOf(LINES[i]) >= 0) early.push('step ' + s.night.k + ': line "' + clip(LINES[i], 40) + '"');
      if (!s.reports.estimate && /Mr Andrews's estimate|he gives her|he says she will/i.test(f)) early.push('step ' + s.night.k + ': the estimate');
      for (let k = 0; k < 16; k++) if (s.reports.zones[k].state === 'unknown' && f.indexOf('  - ' + MW.TABLES.NAMES[k].charAt(0).toUpperCase() + MW.TABLES.NAMES[k].slice(1) + ': ') >= 0) early.push('step ' + s.night.k + ': zone ' + k);
      for (const line of f.split('\n')) if (/\bThe ship[,:]/.test(line)) shipSpeaker.push('step ' + s.night.k + ': ' + clip(line, 60));
      last = f;
    }
    if (fe !== lastE) { for (const line of fe.split('\n')) if (/\bThe ship[,:]/.test(line)) shipSpeaker.push('step ' + s.night.k + ': ' + clip(line, 60)); lastE = fe; }
    // 13 (stage C): each report as it reaches the bridge, the man who would give it, his request, and the fake's answer
    // (the report given back as it came) read and checked as the part would
    if (v.reports && v.reports.feed.length > nSpoke) {
      for (let i = nSpoke; i < v.reports.feed.length; i++) {
        const e = v.reports.feed[i], sp = MW.speaker(v, e);
        spoke.push({ T: s.night.tTouch >= 0 ? Math.round((e.t - s.night.tTouch) / 60) : -1, who: e.who, ch: e.ch, rule: e.rule, words: e.words, seat: sp ? sp.seat : null, how: sp ? sp.how : null });
        if (!sp) continue;
        const r = MW.requestReport(sp.seat, v, [], e, sp.how, {}), t = MW.readTurn(MW.fakeReply(r)), c = t.ok ? MW.check(t.say, r.changing, MW.BY[sp.seat], {}) : null;
        if (r.stable !== stable0[sp.seat + '1912'] || Object.keys(r).join() !== 'seat,stable,changing' || !t.ok || !c.ok || t.order !== null || r.changing.indexOf(e.words.replace(/\s+/g, ' ').trim()) < 0)
          spokeBad.push('T+' + spoke[spoke.length - 1].T + ' ' + sp.seat + ' "' + clip(e.words, 40) + '": ' + (!t.ok ? t.fault : (c && !c.ok ? c.faults.map(f => f.kind + ' ' + f.what).join(', ') : 'its request')));
      }
      nSpoke = v.reports.feed.length;
    }
    if (s.night.k % 400 === 0) {                            // the request, every 100 s of her time
      for (const c of MW.CAST) for (const conv of ['1912', 'modern']) {
        const r = MW.request(c.id, v, [{ t: '11:59 pm', who: 'You', words: 'What now?' }], 'Mr ' + c.full + ', what do you make of it?', { convention: conv });
        if (r.stable !== stable0[c.id + conv]) stableBad.push(c.id + ' ' + conv + ' at step ' + s.night.k);
        const text = r.stable + '\n' + r.changing;
        if (HOST.some(x => x.test(text)) || KEYISH.some(x => x.test(text))) requestBad.push(c.id + ' at step ' + s.night.k + ': a host, an address or a key');
        if (Object.keys(r).join() !== 'seat,stable,changing' || !/^[a-z][a-z0-9_-]{0,39}$/.test(r.seat) || r.stable.length > 24000 || r.changing.length > 24000) requestBad.push(c.id + ' at step ' + s.night.k + ': its shape or size');
        sizeMax = Math.max(sizeMax, r.stable.length, r.changing.length);
      }
    }
    if (s.night.k % 200 === 0) {                            // 12: the readers' states, before and after building THE FACTS
      const before = json([s.reports, s.people, s.world]);
      MW.SEATS.forEach(seat => MW.facts(MW.gather(s), seat, { convention: 'modern' }));
      MW.reach(s);
      if (json([s.reports, s.people, s.world]) !== before) stateBad.push('step ' + s.night.k);
      samples++;
    }
    if (N.over(s)) break;
    N.step(s);
  }
  runB = s;
}
row('no report, wireless line, estimate or compartment stands in THE FACTS before the step that delivered it', early.length ? clip(list(early, 2), 160) : FEED.length + ' reports, ' + LINES.length + ' lines, through ' + runB.night.k + ' steps', 'each from its own step', early.length === 0 && FEED.length > 20 && LINES.length > 10);
row('  the estimate stands there once it reached the bridge, in the builder\'s own words', ESTIMATE ? clip(ESTIMATE, 60) : 'no estimate', 'design 5: words and when', !!ESTIMATE && MW.facts(MW.gather(runB), 'andrews', {}).indexOf(ESTIMATE.charAt(0).toLowerCase() + ESTIMATE.slice(1).replace(/\.$/, '')) >= 0);

// ------------------------------------------------------------------ 5. reach
console.log('\n5. reach: who is in reach, by the design\'s section 4');
{
  const mk = (o) => {
    const s = { t: 3000, roll: 0, night: { k: 12000, spec: { clock0: 85140 }, tBells: 10, tTouch: 40, log: [] }, mo: { delCmd: 0, setP: 0, setS: 0 },
      reports: { zones: [], feed: [], estimate: null, errands: {}, tasks: [], queue: [] }, people: { uncoverT: -1, callT: -1, rule: { P: 'only', S: 'first' }, fill: 0.3, boats: [] }, world: { lines: [] } };
    return Object.assign(s, o || {});
  };
  const R = (o) => MW.reach(mk(o));
  // the people reader's boats with some in the given states, by id (the rest covered), and the boats called
  const boatsAt = (o) => People.BOATS.map(b => ({ state: o[b.id] || 'covered' }));
  const called = () => ({ uncoverT: 1000, callT: 2500, rule: {}, fill: 0.3 });
  const cases = [
    ['Murdoch and Moody before the call to the boats', R({}), { murdoch: true, moody: true }],
    ['  after it: gone to the boats', R({ people: { uncoverT: 1000, callT: 2500, rule: {}, fill: 0.3, boats: [] } }), { murdoch: false, moody: false }, /has gone to the boats/],
    ['  a call still to come', R({ people: { uncoverT: 1000, callT: 3500, rule: {}, fill: 0.3, boats: [] } }), { murdoch: true, moody: true }],
    ['Boxhall: an errand that carries the Fourth Officer, on his way', R({ reports: { zones: [], feed: [], tasks: [{ type: 'visit', who: 'The Fourth Officer', part: 'forward' }], queue: [], errands: { 'look:forward': true } } }), { boxhall: false }, /Mr Boxhall has gone forward to look\./],
    ['  and on his way back from the mail room', R({ reports: { zones: [], feed: [], tasks: [], queue: [{ who: 'The Fourth Officer', errand: 'look:mailroom', rule: 'officer' }], errands: {} } }), { boxhall: false }, /to the mail room/],
    ['  an officer sent by the captain is not named: Boxhall stays', R({ reports: { zones: [], feed: [], tasks: [{ type: 'visit', who: 'An officer', part: 'aft' }], queue: [], errands: {} } }), { boxhall: true }],
    ['  his own errand not yet begun (the look a minute after the touch)', R({ reports: { zones: [], feed: [], tasks: [{ type: 'look', who: 'The Fourth Officer', value: 'forward' }], queue: [], errands: {} } }), { boxhall: true }],
    ['Hichens until the routine relieves the wheel', R({ reports: { zones: [], feed: [{ t: 2000, kind: 'routine', words: 'Eight bells. The lookouts and the wheel are relieved.' }], tasks: [], queue: [], errands: {} } }), { hichens: false }, /relieved at the wheel/],
    ['  no relief when it has lapsed', R({ reports: { zones: [], feed: [{ t: 2000, kind: 'routine', words: 'No relief for the crow\'s nest or the wheel.' }], tasks: [], queue: [], errands: {} } }), { hichens: true }],
    ['Andrews not on the bridge before anything', R({}), { andrews: false }, /Mr Andrews is not on the bridge\./],
    ['  below while his estimate is on its way', R({ reports: { zones: [], feed: [], tasks: [], queue: [{ who: 'The builder\'s man', rule: 'designer' }], errands: {} } }), { andrews: false }, /below/],
    ['  on the bridge for ten minutes from his estimate', R({ reports: { zones: [], feed: [], tasks: [], queue: [], errands: {}, estimate: { words: 'He gives her from an hour to an hour and a half.', tKnown: 2700 } } }), { andrews: true }],
    ['  then gone', R({ reports: { zones: [], feed: [], tasks: [], queue: [], errands: {}, estimate: { words: 'x', tKnown: 2300 } } }), { andrews: false }, /has left the bridge/],
    // the chief engineer is the second stage: until his own view of the engine room is built he is out of reach whatever the
    // telephones' state (a man with nothing to go on is not asked), and the row says so
    ['Bell: out of reach until the engine room\'s telephone is built, and the row says so', R({}), { bell: false }, /by its telephone is not built yet/],
    ['  the telephones with no current: the same', R({ reports: { zones: [], feed: [], tasks: [], queue: [], errands: {}, phone: { current: false } } }), { bell: false }, /not built yet/],
    ['  the telephones with current (join 16): still the same', R({ reports: { zones: [], feed: [], tasks: [], queue: [], errands: {}, phone: { current: true } } }), { bell: false }, /not built yet/],
    // THE RED TEAM'S ROW 18 (release candidate 1): a man of the cast who went away in a boat is gone from the bridge once the
    // model's own people reader lowers her, and the reason is an authored line. Each of the first two fails without it
    ['Boxhall: gone once the model lowers boat No. 2 (her state "lowering"), in an authored line', R({ people: Object.assign(called(), { boats: boatsAt({ 2: 'lowering' }) }) }), { boxhall: false }, /^Mr Boxhall went away in boat No\. 2, in charge of her\.$/],
    ['Hichens: gone once the model lowers boat No. 6, before any relief of the wheel', R({ people: Object.assign(called(), { boats: boatsAt({ 6: 'away' }) }) }), { hichens: false }, /^Quartermaster Hichens went away in boat No\. 6, in charge of her\.$/],
    ['  boat No. 2 away: still gone, whatever errand is out', R({ people: Object.assign(called(), { boats: boatsAt({ 2: 'away' }) }), reports: { zones: [], feed: [], tasks: [], queue: [{ who: 'The Fourth Officer', errand: 'look:forward', rule: 'officer' }], errands: {} } }), { boxhall: false }, /went away in boat No\. 2/],
    ['  boat No. 2 still loading, and other boats away: Boxhall stays; Hichens stays until No. 6 goes', R({ people: Object.assign(called(), { boats: boatsAt({ 2: 'loading', 4: 'away', 8: 'lowering', 14: 'away' }) }) }), { boxhall: true, hichens: true }],
  ];
  for (const [what, r, want, re] of cases) {
    const got = Object.keys(want).map(k => k + ' ' + (r[k].in ? 'in' : 'out')).join(', ');
    const ok = Object.keys(want).every(k => r[k].in === want[k]) && (!re || Object.keys(want).every(k => re.test(r[k].where)));
    row(what, got + (re ? ': "' + clip(Object.keys(want).map(k => r[k].where)[0], 44) + '"' : ''), JSON.stringify(want), ok);
  }
  // the 1912 night's moments (the readers' own timeline on her own orders)
  const want = {
    2: 'murdoch moody hichens', 12.5: 'murdoch moody boxhall hichens', 22: 'murdoch moody', 26: 'murdoch moody andrews', 30: 'murdoch moody boxhall andrews',
    36: 'murdoch moody boxhall', 46: 'boxhall', 52: '',
  };
  const got = [], bad = [];
  for (const m of Object.keys(want).map(Number).sort((a, b) => a - b)) {
    const r = MW.reach(snaps[m]), ins = MW.SEATS.filter(id => r[id].in).join(' ');
    got.push('T+' + m + ' ' + (ins || 'nobody'));
    if (ins !== want[m]) bad.push('T+' + m + ': ' + (ins || 'nobody') + ', not ' + (want[m] || 'nobody'));
  }
  row('the 1912 night: who is in reach at eight moments', bad.length ? clip(list(bad, 2), 160) : clip(got.join('; '), 110), 'the design\'s table on the readers\' own timeline', bad.length === 0);
  // the red team's row 18 on the 1912 watch itself: at T+46 Mr Boxhall is on the bridge (the design's table above; boat
  // No. 2 not yet lowered by the model); by her end the model has lowered No. 2 and No. 6, and Mr Boxhall and Quartermaster
  // Hichens are gone, each with his authored line. (The model's people reader lowers No. 2 at about T+81 on member C, the
  // record about T+125: the line follows the model's boat, as the rule says, not the record's clock)
  const at = (id) => People.BOATS.findIndex(b => b.id === id), E = snaps.end.people.boats, b2 = E[at('2')], b6 = E[at('6')];
  const s46 = snaps[46].people.boats[at('2')], r46 = MW.reach(snaps[46]).boxhall, rEnd = MW.reach(snaps.end);
  const minOf = (b) => (b.tLower >= 0 ? 'T+' + ((b.tLower - snaps.end.night.tTouch) / 60).toFixed(1) : 'never');
  row('the 1912 watch: Mr Boxhall on the bridge at T+46 (No. 2 ' + s46.state + '), gone once the model lowers No. 2 (' + minOf(b2) + '); Hichens gone with No. 6 (' + minOf(b6) + ')',
    'T+46 ' + (r46.in ? 'in' : 'out') + '; at her end: Boxhall ' + (rEnd.boxhall.in ? 'in' : 'out: "' + rEnd.boxhall.where + '"') + '; Hichens ' + (rEnd.hichens.in ? 'in' : 'out: "' + clip(rEnd.hichens.where, 40) + '"'),
    'in at T+46; out at her end, each in his boat\'s line', r46.in && b2.tLower >= 0 && b6.tLower >= 0 && snaps[46].t < b2.tLower
      && !rEnd.boxhall.in && /^Mr Boxhall went away in boat No\. 2, in charge of her\.$/.test(rEnd.boxhall.where) && !rEnd.hichens.in && /^Quartermaster Hichens went away in boat No\. 6, in charge of her\.$/.test(rEnd.hichens.where));
}

// ------------------------------------------------------------------ 6. reading a turn
console.log('\n6. reading a turn: each reply to its exact outcome');
{
  const BOM = String.fromCharCode(0xFEFF), Y = '{"say": "Yes, sir.", "order": null}';
  const TURNS = [
    [Y, 'ok: Yes, sir. | null'], ['{"say":"Hard a-port, sir.","order":"hard a-port"}', 'ok: Hard a-port, sir. | hard a-port'],
    ['```json\n' + Y + '\n```', 'ok: Yes, sir. | null'], ['```\n' + Y + '\n```', 'ok: Yes, sir. | null'],
    ['Here is my answer: ' + Y + ' I hope it serves.', 'ok: Yes, sir. | null'], [' \n ' + Y + ' \n', 'ok: Yes, sir. | null'], [BOM + Y, 'ok: Yes, sir. | null'],
    ['{"say": "  Yes,\\n   sir.  ", "order": null}', 'ok: Yes, sir. | null'], ['{"order": null, "say": "Yes, sir."}', 'ok: Yes, sir. | null'],
    ['{"say": "Yes, sir.", "order": "none"}', 'ok: Yes, sir. | null'], ['{"say": "Yes, sir.", "order": ""}', 'ok: Yes, sir. | null'], ['{"say": "Yes, sir.", "order": "NULL"}', 'ok: Yes, sir. | null'],
    ['{"say": "Stop her, sir.", "order": "  stop  "}', 'ok: Stop her, sir. | stop'], ['{"say": "A {brace} in words, sir.", "order": null}', 'ok: A {brace} in words, sir. | null'],
    // the second review: "None." was read as an order, and a notice then said his order was not given
    ['{"say": "Yes, sir.", "order": "None."}', 'ok: Yes, sir. | null'], ['{"say": "Yes, sir.", "order": "No order"}', 'ok: Yes, sir. | null'], ['{"say": "Yes, sir.", "order": "N/A"}', 'ok: Yes, sir. | null'],
    ['{"say": "Yes, sir.", "order": "-"}', 'ok: Yes, sir. | null'], ['{"say": "Yes, sir.", "order": "nil."}', 'ok: Yes, sir. | null'],
    ['', 'empty'], ['  \n ', 'empty'], [null, 'not text'], [undefined, 'not text'], [42, 'not text'], [{ say: 'Yes, sir.', order: null }, 'not text'],
    ['Yes, sir. I will see to it.', 'not json'], ['{"say": "Yes, sir.", "order": null', 'not json'], ['{\'say\': \'Yes, sir.\', \'order\': null}', 'not json'],
    ['{"say": "Yes, sir.", "order": null,}', 'not json'], ['x'.repeat(100000), 'not json'],
    [Y + ' ' + Y, 'two objects'], ['[' + Y + ']', 'not an object'], ['"Yes, sir."', 'not an object'], ['null', 'not an object'], ['```json\n["Yes, sir."]\n```', 'not an object'],
    ['{"say": "Yes, sir.", "order": null, "mood": "calm"}', 'extra field'], ['{"say": "Yes, sir."}', 'no order'], ['{"order": null}', 'no say'],
    ['{"say": 5, "order": null}', 'say not text'], ['{"say": ["Yes"], "order": null}', 'say not text'], ['{"say": null, "order": null}', 'say not text'],
    ['{"say": "Yes, sir.", "order": 5}', 'order not text'], ['{"say": "Yes, sir.", "order": ["stop", "full astern"]}', 'order not text'], ['{"say": "Yes, sir.", "order": false}', 'order not text'],
    ['{"say": "", "order": null}', 'say empty'], ['{"say": "   ", "order": null}', 'say empty'],
    ['{"say": "' + 'Yes, sir. '.repeat(41) + '", "order": null}', 'say too long'], ['{"say": "Yes, sir.", "order": "' + 'stop and '.repeat(10) + 'stop"}', 'order too long'],
    // a model that thinks aloud in its answer (many run on one's own PC do): the thinking is dropped, braces and all
    ['<think>\nThe captain asks {what} I saw. I should answer {"say": "No"} briefly.\n</think>\n\n' + Y, 'ok: Yes, sir. | null'], ['<think>short</think>```json\n' + Y + '\n```', 'ok: Yes, sir. | null'],
    ['<thinking>hm</thinking>' + Y, 'ok: Yes, sir. | null'], ['<think>only thinking, and no answer</think>', 'empty'], ['<think>never closed ' + Y, 'ok: Yes, sir. | null'],
  ];
  const bad = [], kinds = {};
  let threw = 0;
  for (const [text, want] of TURNS) {
    let r; try { r = MW.readTurn(text); } catch (e) { threw++; continue; }
    const got = r.ok ? 'ok: ' + r.say + ' | ' + r.order : r.fault;
    kinds[r.ok ? 'ok' : r.fault] = 1;
    if (got !== want || (!r.ok && !r.why)) bad.push(clip(JSON.stringify(text) || String(text), 30) + ' gave ' + got + ', not ' + want);
  }
  row('each reply to its exact outcome (clean, fenced, prose around, wrong types, extra fields, too long, not JSON)', bad.length ? clip(list(bad, 2), 160) : TURNS.length + ' replies, ' + Object.keys(kinds).length + ' outcomes', 'at least thirty', bad.length === 0 && threw === 0 && TURNS.length >= 30);
  const odd = [Symbol('x'), { toString() { throw new Error('no'); } }, [], () => 1, NaN, '{', '}', '{{}}', '"', '\\', '```', '```json', '{"say": "a\\', String.fromCharCode(0xD800)];
  let oddThrew = 0; for (const t of odd) { try { const r = MW.readTurn(t); if (typeof r.ok !== 'boolean') oddThrew++; } catch (e) { oddThrew++; } }
  row('  it never throws, whatever it is given', oddThrew + ' threw or gave no verdict, of ' + odd.length, 'none', oddThrew === 0 && threw === 0);
}

// ------------------------------------------------------------------ 7. the checks
console.log('\n7. the checks on the words: each line passes, or fails with its named fault');
{
  const A = 'THE FACTS\n- Now: 12:10 am. She struck the ice at 11:40 pm, 30 minutes ago.\n  - No. 1 hold: 14 ft in the well (the carpenter, 11:52 pm).\n'
    + '  - Boiler room 6: flooded, its men have left (the chief engineer, 11:56 pm).\n- Mr Andrews\'s estimate: he gives her from an hour to an hour and a half.';
  const B = A + '\n  - 12:37 am: Carpathia answers: 46 miles off.\n  - 12:57 am: SOS: the new call goes out with the old.';
  const A0 = A.split('\n').filter(l => l.indexOf('Mr Andrews') < 0).join('\n');     // before Mr Andrews's estimate has reached the bridge
  const A39 = 'THE FACTS\n- Now: 11:39 pm. A clear, calm night with no moon.';       // before the ice: a man has little but his card
  // THE FACTS as the bridge has them half an hour on: the compartments by name, a list, a sounding, the boats' count
  const M = 'THE FACTS\n- Now: 12:10 am.\n- Her list by the commutator: 1 degree to port. Her trim by eye: down by the head.\n- What has been reported of each compartment:\n'
    + '  - No. 1 hold: 14 ft in the well (the carpenter, 11:52 pm).\n- Nothing has been reported of: No. 2 hold, No. 3 hold, boiler room 6, boiler room 5, boiler room 4, boiler room 3, boiler room 2, boiler room 1.\n'
    + '- The boats: uncovered at 12:05 am; the passengers have not yet been called to them. Away: 0 of 20.';
  // ... and later: five boats away, twenty degrees of helm on her (the helm's line as facts() writes it)
  const M5 = M.replace('Away: 0 of 20.', 'Away: 5 of 20.') + '\n- The helm, as ordered: Port twenty. The engine telegraphs: Stop.';
  const DEG = String.fromCharCode(176);                                             // the degree sign (this file is ASCII)
  const CASES = [
    ['Yes, sir.', A, 'murdoch', '1912', 'ok'], ['She is making water fast in No. 1 hold, sir: 14 ft in the well.', A, 'murdoch', '1912', 'ok'],
    ['Fourteen feet in the well, sir.', A, 'murdoch', '1912', 'ok'], ['Twenty feet in the well, sir.', A, 'murdoch', '1912', 'number'],
    ['She struck at 11:40, sir.', A, 'murdoch', '1912', 'ok'], ['She will go at 2:20, sir.', A, 'murdoch', '1912', 'time'],
    ['It is ten past twelve, sir.', A, 'murdoch', '1912', 'ok'], ['I have counted 37 bergs this night, sir.', A, 'murdoch', '1912', 'number'],
    ['He gives her an hour and a half, sir.', A, 'andrews', '1912', 'ok'], ['Boiler room six is flooded, sir.', A, 'murdoch', '1912', 'ok'],
    ['Two hundred and fifty men, sir.', A, 'murdoch', '1912', 'number'], ['A hundred feet of her, sir.', A, 'murdoch', '1912', 'number'],
    ['Thirty minutes since she struck, sir.', A, 'moody', '1912', 'ok'], ['I am thirty-nine, sir, and have been at sea since 1888.', A, 'murdoch', '1912', 'ok'],
    ['The Carpathia is coming, sir.', A, 'murdoch', '1912', 'ship'], ['The Carpathia is coming, sir: 46 miles off.', B, 'murdoch', '1912', 'ok'],
    ['As in the Olympic, sir.', A, 'murdoch', '1912', 'ok'], ['As in the Olympic, sir.', A, 'moody', '1912', 'ok'], ['The carpathia is coming, sir.', A, 'murdoch', '1912', 'ship'],
    ['Mr Lightoller has the port boats, sir.', A, 'murdoch', '1912', 'ok'], ['Captain Rostron is on his way, sir.', A, 'murdoch', '1912', 'person'],
    ['Captain Lord will come, sir.', A, 'murdoch', '1912', 'person'], ['Rostron is coming.', A, 'murdoch', '1912', 'person'],
    ['Okay, sir.', A, 'murdoch', '1912', 'world'], ['OK.', A, 'hichens', '1912', 'world'], ['As an AI, I cannot say.', A, 'murdoch', '1912', 'world'],
    ['This simulation is very real, sir.', A, 'murdoch', '1912', 'world'], ['Send an SOS, sir.', A, 'murdoch', '1912', 'world'], ['The SOS has gone, sir.', B, 'murdoch', '1912', 'ok'],
    ['Hard to port, sir.', A, 'hichens', '1912', 'world'], ['Hard to port, sir.', A, 'hichens', 'modern', 'ok'], ['Put on your life jacket, sir.', A, 'murdoch', '1912', 'world'],
    ['The hull breach is forward, sir.', A, 'murdoch', '1912', 'world'], ['Roger, sir.', A, 'moody', '1912', 'world'], ['Mayday, sir.', A, 'moody', '1912', 'world'],
    ['Captain Smith, the boats are ready.', A, 'murdoch', '1912', 'world'], ['The radio room has her, sir.', A, 'moody', '1912', 'world'],
    ['The metres are wrong, sir.', A, 'murdoch', '1912', 'world'], ['The guys at the boats are ready, sir.', A, 'murdoch', '1912', 'world'],
    ['She sank, sir.', A, 'murdoch', '1912', 'end'], ['Many will drown, sir.', A, 'murdoch', '1912', 'end'], ['Dead slow ahead, sir.', A, 'moody', '1912', 'ok'],
    ['The dead are many.', A, 'murdoch', '1912', 'end'], ['She is unsinkable, sir.', A, 'andrews', '1912', 'end'], ['The survivors will be picked up.', A, 'murdoch', '1912', 'end'],
    ['Every man for himself, sir.', A, 'murdoch', '1912', 'end'], ['*salutes* Yes, sir.', A, 'murdoch', '1912', 'stage'], ['(pauses) Yes, sir.', A, 'murdoch', '1912', 'stage'],
    ['Yes, sir [nods].', A, 'murdoch', '1912', 'stage'], ['It is 2340 hours, sir.', A, 'murdoch', '1912', 'number world'], ['Twenty-three forty, sir.', A, 'murdoch', '1912', 'number world'],
    ['The commutator shows three degrees, sir.', A, 'murdoch', '1912', 'number'], ['North 71 west by the steering compass, sir.', A, 'hichens', '1912', 'ok'],
    // the review of stage A. A time in THE FACTS does not make its hour and its minutes figures he may speak ...
    ['Forty feet of water, sir.', A, 'murdoch', '1912', 'number'], ['Eleven degrees of list, sir.', A, 'murdoch', '1912', 'number'], ['Fifty-two feet, sir.', A, 'murdoch', '1912', 'number'],
    ['There are 56 of them, sir.', A, 'murdoch', '1912', 'number'], ['About 40 tons an hour, sir.', A, 'murdoch', '1912', 'number'],
    // ... while a time said in words, as a man says it, is held to the times he knows
    ['At eleven forty, sir.', A, 'murdoch', '1912', 'ok'], ['Twenty to twelve, sir.', A, 'murdoch', '1912', 'ok'], ['About twelve o\'clock, sir.', A, 'murdoch', '1912', 'ok'],
    ['At 12 o\'clock, sir.', A, 'murdoch', '1912', 'ok'], ['Eight minutes to twelve, sir, by the carpenter.', A, 'murdoch', '1912', 'ok'], ['It was struck at eight bells, sir.', A, 'hichens', '1912', 'ok'],
    ['At eleven fifty, sir.', A, 'murdoch', '1912', 'time'], ['A quarter past one, sir.', A, 'murdoch', '1912', 'time'], ['At 3 o\'clock, sir.', A, 'murdoch', '1912', 'time'], ['Half past two, sir.', A, 'murdoch', '1912', 'time'],
    // words that break the frame, each of which passed
    ['I am Claude, made by Anthropic.', A, 'murdoch', '1912', 'world'], ['As your assistant, sir, I advise it.', A, 'murdoch', '1912', 'world'], ['This is a role-play, sir.', A, 'moody', '1912', 'world'],
    ['ChatGPT would know, sir.', A, 'moody', '1912', 'world'], ['I\'m sorry, but I can\'t portray a real person.', A, 'andrews', '1912', 'world'], ['My instructions do not say, sir.', A, 'murdoch', '1912', 'world'],
    ['The assistant engineers are below, sir.', A, 'murdoch', '1912', 'ok'], ['I will be prompt, sir.', A, 'moody', '1912', 'ok'], ['He is a man of good character, sir.', A, 'murdoch', '1912', 'ok'],
    // the end: plain speech that the first list failed ...
    ['It is a dead calm, sir.', A, 'murdoch', '1912', 'ok'], ['The telephone is dead, sir.', A, 'moody', '1912', 'ok'], ['I will make inquiry, sir.', A, 'moody', '1912', 'ok'],
    ['The wind has died away, sir.', A, 'murdoch', '1912', 'ok'], ['The fires are drowned in boiler room six, sir.', A, 'murdoch', '1912', 'ok'], ['She is dead in the water, sir.', A, 'murdoch', '1912', 'ok'],
    // ... and the prophecy it missed: barred until Mr Andrews's estimate has reached the bridge, and men's fates always
    ['She will founder, sir.', A0, 'murdoch', '1912', 'end'], ['She will founder, sir.', A, 'murdoch', '1912', 'ok'], ['She cannot float, sir.', A0, 'andrews', '1912', 'end'], ['She cannot float, sir.', A, 'andrews', '1912', 'ok'],
    ['The ship is doomed, sir.', A0, 'murdoch', '1912', 'end'], ['Nobody will be saved, sir.', A, 'murdoch', '1912', 'end'], ['We shall all be lost, sir.', A, 'murdoch', '1912', 'end'],
    ['The men below will be drowned, sir.', A, 'murdoch', '1912', 'end'], ['The rescue will come too late.', A, 'murdoch', '1912', 'end'], ['All will perish, sir.', A, 'murdoch', '1912', 'end'],
    // THE SECOND REVIEW. A man repeating a time from his own card, in words, is not giving a time he does not know ...
    ['At ten o\'clock, sir, from Quartermaster Olliver, for a two-hour trick.', A39, 'hichens', '1912', 'ok'], ['In the chart room since eight o\'clock, sir.', A39, 'boxhall', '1912', 'ok'],
    ['At about half past nine, sir.', A39, 'moody', '1912', 'ok'], ['At about a quarter past seven, sir.', A39, 'murdoch', '1912', 'ok'], ['At a quarter to ten, sir.', A39, 'hichens', '1912', 'ok'],
    ['At half past nine, sir.', A39, 'murdoch', '1912', 'time'], ['At a quarter to ten, sir.', A39, 'moody', '1912', 'time'],          // (another man's card is not his)
    // ... a watch's name is not a clock time, an hour said alone is that hour when he knows a time in it, a range is figures
    ['I have the ten-to-two watch, sir.', A39, 'murdoch', '1912', 'ok'], ['I am relieved at twelve, sir.', A39, 'hichens', '1912', 'ok'], ['Mr Moody made it about eleven, sir.', A39, 'murdoch', '1912', 'ok'],
    ['I had the wheel from ten to twelve, sir.', A39, 'hichens', '1912', 'ok'], ['It was ten to two, sir.', A39, 'murdoch', '1912', 'time'], ['She struck at about five, sir.', A39, 'moody', '1912', 'number'],
    // ... a name with its possessive is the man; a title's full stop is not carried over a sentence's end
    ['A little, sir, by Mr Murdoch\'s eye.', A, 'moody', '1912', 'ok'], ['Gladly, Captain. It is a fine clear night.', A, 'moody', '1912', 'ok'], ['By Captain Rostron\'s order, sir.', A, 'murdoch', '1912', 'person'],
    // ... the end's rows on plain speech: her trim, a man going below, "dead" of the sea and the reckoning, a rescue she comes to
    ['Mr Boxhall went down below to look, sir.', A, 'murdoch', '1912', 'ok'], ['He went down with you before he gave his estimate, sir.', A, 'murdoch', '1912', 'ok'],
    ['She went down by the head after the carpenter\'s sounding, sir.', A, 'murdoch', '1912', 'ok'], ['We are dead in the water, sir, with the engines stopped.', A, 'murdoch', '1912', 'ok'],
    ['In the dead calm there was no surf on the berg, sir.', A, 'murdoch', '1912', 'ok'], ['She is coming to the rescue, sir.', A, 'boxhall', '1912', 'ok'], ['She is going down by the head, sir.', A0, 'murdoch', '1912', 'ok'],
    // ... a man's own way of not knowing or of refusing, his own instructions, a star, a plain word that is also a ship's name
    ['I\'m sorry, but I cannot say, sir.', A, 'moody', '1912', 'ok'], ['I cannot do that, sir: the rockets are kept aft.', A, 'boxhall', '1912', 'ok'],
    ['My instructions are to call you if it becomes at all doubtful, sir.', A, 'murdoch', '1912', 'ok'], ['Castor in Gemini, sir, by the star sights.', A, 'boxhall', '1912', 'ok'], ['A majestic sight, sir.', A, 'moody', '1912', 'ok'],
    ['The Majestic is near, sir.', A, 'moody', '1912', 'ship'],
    // ... and what passed that must not: the short forms of the prophecy, her sinking said before she has been given up, a
    // man named with his fate, the frame, a refusal in a language model's own voice, a speaker's label
    ['She\'ll sink, sir.', A0, 'murdoch', '1912', 'end'], ['She\'s done for, sir.', A0, 'murdoch', '1912', 'end'], ['She can\'t stay afloat, sir.', A0, 'andrews', '1912', 'end'], ['She won\'t last, sir.', A0, 'murdoch', '1912', 'end'],
    ['She is sinking, sir.', A0, 'murdoch', '1912', 'end'], ['She is sinking, sir.', A, 'murdoch', '1912', 'ok'], ['Nothing can save her, sir.', A0, 'murdoch', '1912', 'end'], ['She will be gone by dawn, sir.', A0, 'murdoch', '1912', 'end'],
    ['She will break in half, sir.', A, 'murdoch', '1912', 'end'], ['Mr Wilde will die at his post, sir.', A, 'murdoch', '1912', 'end'], ['The officers have their revolvers, sir.', A, 'murdoch', '1912', 'end'],
    ['This is only a game, sir.', A, 'murdoch', '1912', 'world'], ['According to THE FACTS, sir, the hold is flooded.', A, 'murdoch', '1912', 'world'], ['Sorry, I cannot provide that information.', A, 'murdoch', '1912', 'world'],
    ['I\'m sorry, but I can\'t help with that.', A, 'moody', '1912', 'world'], ['Mr Murdoch: It is a clear night, sir.', A, 'murdoch', '1912', 'stage'], ['We are gonna need the boats, sir.', A, 'murdoch', '1912', 'world'],
    // ... and a measure said with its unit is held to that measure in what he knows: THE FACTS name boiler rooms 1 to 6, so
    // as bare figures 1 to 6 are always known, and each of the first five passed
    ['There are 6 feet of water in boiler room 4, sir.', M, 'murdoch', '1912', 'number'], ['Three boats are away, sir.', M, 'murdoch', '1912', 'number'], ['She has a list of five degrees to starboard, sir.', M, 'murdoch', '1912', 'number'],
    ['She is down 5 degrees by the head, sir.', M, 'murdoch', '1912', 'number'], ['Two of the boats have gone, sir.', M, 'murdoch', '1912', 'number'],
    ['Fourteen feet in No. 1 hold, sir, and one degree of list to port.', M, 'murdoch', '1912', 'ok'], ['Nothing from boiler room 4 or boiler room 5 yet, sir.', M, 'murdoch', '1912', 'ok'],
    ['No. 6 boiler room has not reported, sir, nor No. 2 hold.', M, 'murdoch', '1912', 'ok'], ['No boat is away yet, sir, of the 20.', M, 'murdoch', '1912', 'ok'], ['No. 2 boat is away, sir.', M, 'murdoch', '1912', 'ok'],
    ['All 20 boats can be lowered in an hour, sir.', M, 'murdoch', '1912', 'ok'],
    // THE REVIEW OF THE MEASURE CHECK. It failed good lines in plain play: a count of the boats away is the count SAID
    // away ("five of the twenty" is five; none, not one and no boat are nought), in its own phrase ...
    ['Five of the twenty boats are away, sir.', M5, 'murdoch', '1912', 'ok'], ['Of the twenty boats, five are away, sir.', M5, 'murdoch', '1912', 'ok'], ['Five boats away, sir, of the twenty.', M5, 'murdoch', '1912', 'ok'],
    ['None of the twenty boats is away yet, sir.', M, 'murdoch', '1912', 'ok'], ['Not one boat is away yet, sir.', M, 'murdoch', '1912', 'ok'], ['Not one of the boats is away yet, sir.', M, 'murdoch', '1912', 'ok'],
    // ... the helm's own degrees are a measure he knows; a man's height is no depth; the degree sign is degrees
    ['Port twenty, sir. Twenty degrees of helm on her.', M5, 'murdoch', '1912', 'ok'], ['She has twenty degrees of port helm on, sir.', M5, 'murdoch', '1912', 'ok'],
    ['He is a six-foot man, sir.', M, 'murdoch', '1912', 'ok'], ['A list of 1' + DEG + ' to port, sir.', M, 'murdoch', '1912', 'ok'], ['One degree to port, sir, by the commutator.', M, 'murdoch', '1912', 'ok'],
    // ... and each of these, whose figure he knows bare (14 ft, 20 boats, boiler rooms 3, 5 and 6), is no measure he knows
    ['Fourteen of our twenty boats are away, sir.', M5, 'murdoch', '1912', 'number'], ['Fourteen of the boats are away, sir.', M5, 'murdoch', '1912', 'number'], ['Twenty boats are away, sir.', M5, 'murdoch', '1912', 'number'],
    ['None of the boats is away, sir.', M5, 'murdoch', '1912', 'number'], ['Not one boat is away, sir.', M5, 'murdoch', '1912', 'number'], ['No boat is away yet, sir.', M5, 'murdoch', '1912', 'number'],
    ['She has five degrees of helm on, sir.', M5, 'murdoch', '1912', 'number'], ['Three fathoms of water in boiler room 4, sir.', M, 'murdoch', '1912', 'number'], ['She is down 5 deg. by the head, sir.', M, 'murdoch', '1912', 'number'],
    ['Six inches of water over the plates, sir.', M, 'murdoch', '1912', 'number'], ['There is six-foot of water in the hold, sir.', M, 'murdoch', '1912', 'number'], ['She has a list of 5' + DEG + ' to starboard, sir.', M, 'murdoch', '1912', 'number'],
  ];
  const bad = [], seen = {};
  for (const [say, facts, seat, conv, want] of CASES) {
    const r = MW.check(say, facts, MW.BY[seat], { convention: conv });
    const got = r.ok ? 'ok' : Array.from(new Set(r.faults.map(f => f.kind))).sort().join(' ');
    seen[got] = (seen[got] || 0) + 1;
    if (got !== want || (!r.ok && r.faults.some(f => !f.why || !f.what))) bad.push('"' + clip(say, 30) + '" (' + seat + ', ' + conv + ') gave ' + got + ', not ' + want);
  }
  row('each line to its verdict and its named fault (numbers, times, ships, people, world, the end, stage directions)', bad.length ? clip(list(bad, 2), 160) : CASES.length + ' lines: ' + Object.entries(seen).map(e => e[1] + ' ' + e[0]).join(', '), 'at least forty', bad.length === 0 && CASES.length >= 40);
  // the readings behind those verdicts, one by one (the second review)
  {
    const T0 = new Set(), unk = (s, T) => MW.spokenTimes(s, T || T0).unknown.join('|'), left = (s, T) => MW.spokenTimes(s, T || T0).left.split(' ').filter(x => x !== '.').join(' ');
    const got = [unk('the twelve to four'), unk('the ten-to-two watch'), unk('ten to two'), unk('five to nine'), unk('two to three minutes'), unk('boiler rooms two to six'), unk('seven fifty tons'), unk('eleven forty'),
      left('at twelve knots', new Set(['12:10'])), left('relieved at twelve', new Set(['12:00'])), left('relieved at twelve')];
    const want = ['', '', 'ten to two', 'five to nine', '', '', '', 'eleven forty', 'at twelve knots', 'relieved at', 'relieved at twelve'];
    const f = new Set(); MW.spokenTimes('at ten o\'clock, at about half past nine, a quarter to ten, eleven forty, since eight', T0, f);
    const read = Array.from(f).sort().join(' '), off = got.map((g, i) => (g === want[i] ? null : i + ': "' + g + '"')).filter(Boolean);
    row('  a watch\'s name, a range and a figure before a measure are no clock times; an hour said alone is one only when he knows a time in it; the times in his card are read',
      off.length ? clip(off.join('; '), 120) : got.length + ' readings; in a card: ' + read, 'each as meant; 10:00 11:40 8:00 9:30 9:45', off.length === 0 && read === '10:00 11:40 8:00 9:30 9:45');
  }
  const lists = MW.WORLD.concat(MW.END);
  const unsourced = lists.filter(x => !(x[2] && x[3])).map(x => x[0]);
  const s11 = MW.WORLD.filter(x => /personas 11/.test(x[3])).length;
  row('  each word of the lists has its reason and its source; section 11 of the persona note gives the period words', unsourced.length ? unsourced.join(', ') : lists.length + ' entries, each with both; ' + s11 + ' from section 11', 'each with a reason and a source', unsourced.length === 0 && s11 >= 15);
  const retry = MW.retry({ seat: 'murdoch', stable: 's', changing: 'c' }, MW.check('Okay, sir: 37 of them.', A, MW.BY.murdoch).faults);
  const said = retry.changing.split('\n').pop();
  row('  a fault is named to the man when he is asked once more', clip(said, 90), 'YOUR LAST ANSWER COULD NOT BE USED: ...', /^YOUR LAST ANSWER COULD NOT BE USED: /.test(said) && /"Okay"/.test(said) && /figure 37/.test(said) && retry.stable === 's' && retry.changing.indexOf('c\n\n') === 0);
}

// ------------------------------------------------------------------ 8. orders
console.log('\n8. orders: a restated order is read by step 1\'s grammar, within the man\'s remit, in the convention in force');
{
  const show = (o) => o.type + ':' + o.value + (o.arg !== undefined ? ':' + o.arg : '');
  const READ = [
    // a helm order that turns her names her head too, and the two agree in the convention in force
    ['hard a-port, her head to starboard', 'murdoch', '1912', 'helm:40'], ['Hard a-starboard, her head to port.', 'hichens', '1912', 'helm:-40'], ['Hard a-starboard, her head to starboard', 'hichens', 'modern', 'helm:40'],
    ['Starboard ten; her head to port', 'murdoch', '1912', 'helm:-10'], ['hard to port, the head going to port', 'murdoch', 'modern', 'helm:-40'], ['midships', 'hichens', '1912', 'helm:0'],
    ['Stop.', 'moody', '1912', 'telegraph:stop'], ['full astern', 'murdoch', '1912', 'telegraph:full astern'], ['close the watertight doors', 'murdoch', '1912', 'doors:bridge'],
    ['go forward and look', 'boxhall', '1912', 'report:look:forward'], ['fire a rocket', 'boxhall', '1912', 'help:rocket:socket'], ['uncover the boats', 'murdoch', '1912', 'boats:uncover:now'],
    ['sound the wells', 'moody', '1912', 'report:sound:wells'], ['draw the fires in boiler room six', 'bell', '1912', 'fires:0'], ['ease to ten, her head to port', 'hichens', '1912', 'helm:-10', -40],
    ['away from the ice', 'murdoch', '1912', 'helm:away'], ['Women and children first', 'murdoch', '1912', 'boats:rule:first:both'],
    // the second review: her head had to be the very last words, in one form, and each of these correct orders was dropped
    ['Hard a-starboard, her head to port, sir.', 'hichens', '1912', 'helm:-40'], ['Hard a-starboard (her head to port)', 'hichens', '1912', 'helm:-40'], ['Hard a-starboard, head to port', 'hichens', '1912', 'helm:-40'],
    ['Hard a-starboard, her bow to port', 'hichens', '1912', 'helm:-40'], ['Hard a-starboard, ship\'s head to port', 'hichens', '1912', 'helm:-40'], ['Hard a-starboard; her head will go to port', 'hichens', '1912', 'helm:-40'],
  ];
  const DROP = [
    ['hard a-starboard and full astern', 'murdoch', 'more than one order'], ['fire a rocket', 'murdoch', 'not his to give'], ['hard a-port', 'andrews', 'not his to give'],
    ['stop', 'hichens', 'not his to give'], ['send the call for assistance', 'murdoch', 'not his to give'], ['make tea', 'murdoch', 'not an order the bridge knows'],
    ['hard over', 'hichens', 'not an order the bridge knows'], ['what now?', 'murdoch', 'not an order the bridge knows'], ['', 'murdoch', 'no order'], [null, 'murdoch', 'no order'],
    // the review of stage A: helm words alone cannot be told from their opposite, and a modern phrase was read reversed
    ['hard a-port', 'murdoch', 'a helm order must say which way her head is to go'], ['hard to starboard', 'hichens', 'a helm order must say which way her head is to go'],
    ['port twenty', 'murdoch', 'a helm order must say which way her head is to go'], ['hard to starboard, her head to starboard', 'murdoch', 'its helm words and her head do not agree'],
    ['port twenty, her head to port', 'hichens', 'its helm words and her head do not agree'], ['stop, her head to port', 'moody', 'her head was named for an order that does not turn her'],
    ['hard a-port, her head to starboard', 'moody', 'not his to give'],
    // the second review: the wider forms of her head let no opposite turn through; "away" turns her by where the ice is
    ['hard a-starboard, her head to starboard, sir.', 'hichens', 'its helm words and her head do not agree'], ['hard a-starboard (her bow to starboard)', 'hichens', 'its helm words and her head do not agree'],
    ['away from the ice, her head to starboard', 'murdoch', 'her head was named for an order that turns her by where the ice is'],
  ];
  const bad = [];
  for (const [text, seat, conv, want, helm] of READ) {
    const r = MW.readOrder(text, seat, { convention: conv, helm: helm || 0 });
    if (!r.ok || show(r.order) !== want || !r.words) bad.push('"' + text + '" (' + seat + ') gave ' + (r.ok ? show(r.order) : r.why));
  }
  row('each restated order read to its order, within the man\'s remit', bad.length ? clip(list(bad, 2), 160) : READ.length + ' orders', 'the grammar\'s orders', bad.length === 0);
  const bad2 = [];
  for (const [text, seat, want] of DROP) { const r = MW.readOrder(text, seat, {}); if (r.ok || r.why.indexOf(want) !== 0) bad2.push('"' + text + '" (' + seat + ') gave ' + (r.ok ? show(r.order) : r.why)); }
  row('  two orders, one outside the remit, one the grammar does not know: each dropped with its reason', bad2.length ? clip(list(bad2, 2), 160) : DROP.length + ' dropped', 'more than one; not his to give; not known', bad2.length === 0);
  const bad3 = [];
  for (const c of MW.CAST) for (const conv of ['1912', 'modern']) {
    const words = MW.orderWords(c.id, { convention: conv });
    if (c.remit.length && words.length < 2) bad3.push(c.id + ': too few words');
    words.forEach((w, i) => { const r = MW.readOrder(w, c.id, { convention: conv }); const s = c.samples[i]; if (!r.ok || r.order.type !== s[0] || r.order.value !== s[1] || r.order.arg !== s[2]) bad3.push(c.id + ' ' + conv + ' "' + w + '"'); });
    for (const t of c.remit) if (CW.domain().every(o => o.type !== t)) bad3.push(c.id + ': ' + t + ' is no order of the grammar\'s');
  }
  row('  every seat\'s order words (its stable part\'s) read back as its own orders, in both conventions', bad3.length ? clip(list(bad3, 2), 160) : MW.CAST.map(c => c.id + ' ' + c.samples.length).join(', '), 'each in its remit', bad3.length === 0);
  // who is spoken to, and "yes" or "no" to an offer (the review of stage A: neither was held by a row)
  const WHO = [['Mr Moody, what do you see?', 'moody'], ['Mr. Moody, what do you see?', 'moody'], ['Mr.Moody, what do you see?', 'moody'], ['Mr. Andrews, how long has she got?', 'andrews'], ['Mister Murdoch: report.', 'murdoch'],
    ['What do you see, Mr. Boxhall?', 'boxhall'], ['Quartermaster, how does she answer?', 'hichens'], ['Officer of the watch, what did you see?', 'murdoch'], ['Chief engineer, the fires?', 'bell'],
    ['Mr Phillips, anything from the Carpathia?', 'other:Mr Phillips:wireless'], ['Mr. Lightoller, the boats?', 'other:Mr Lightoller:other'], ['How is she?', 'nobody'], ['What does Mr Moody say?', 'nobody']];
  const badWho = WHO.filter(([t, want]) => { const a = MW.addressee(t), got = a.seat ? a.seat : (a.other ? 'other:' + a.other + ':' + a.line : 'nobody'); return got !== want; }).map(x => '"' + x[0] + '"');
  row('  a name or a rank at the start of a line, or after its last comma, says who is spoken to: with "Mr." too', badWho.length ? clip(list(badWho, 3), 160) : WHO.length + ' lines', 'each to its man, another person, or nobody', badWho.length === 0);
  const ANS = [['yes', 'yes'], ['Yes.', 'yes'], ['aye aye', 'yes'], ['Do so, Mr Murdoch.', 'yes'], ['Mr. Murdoch, yes', 'yes'], ['no', 'no'], ['Belay that, Mr Murdoch', 'no'], ['No, sir', 'no'],
    ['Mr Moody, yes', null], ['Mr Phillips, yes', null], ['Yes, Mr Moody', null], ['Yes?', null], ['hard a-port', null], ['', null],
    // the second review: a captain's other words for yes each went to the model as a new question, the offer still open
    ['yes please', 'yes'], ['Very well.', 'yes'], ['Make it so, Mr Murdoch', 'yes'], ['carry on', 'yes'], ['Go ahead', 'yes'], ['Give it', 'yes'], ['Mr Moody, very well', null], ['Very well?', null], ['belay', 'no']];
  const badAns = ANS.filter(([t, want]) => MW.offerAnswer(t, 'murdoch') !== want).map(x => '"' + x[0] + '" gave ' + MW.offerAnswer(x[0], 'murdoch'));
  row('  "yes" or "no" to an offer answers the man who made it: a word to another man, or a question, answers nothing', badAns.length ? clip(list(badAns, 3), 160) : ANS.length + ' lines', 'yes, no, or nothing', badAns.length === 0);
  // a man who went on an errand himself is away on it while it is out (the reports reader says only "an officer")
  {
    const s = snap(10), before = MW.reach(s).boxhall;
    const took = N.act(s, 'report:look', 'mailroom'), v = MW.gather(s), key = MW.errandOf({ type: 'report:look', value: 'mailroom' }, 'boxhall');
    const plain = MW.reach(v).boxhall, told = MW.reach(v, { boxhall: [key] }).boxhall, other = MW.reach(v, { boxhall: [key] }).murdoch, stale = MW.reach(v, { boxhall: ['look:aft'] }).boxhall;
    row('  a man who went on an errand by his own answer is away while it is out: told whose errand it is, reach says so', `${took !== false ? 'sent' : 'NOT SENT'} (${key}): untold ${plain.in ? 'in' : 'out'}; told ${told.in ? 'IN' : 'out'}: "${told.where}"; Mr Murdoch ${other.in ? 'in' : 'OUT'}; an errand not out: ${stale.in ? 'in' : 'OUT'}`,
      'out: "Mr Boxhall has gone to the mail room to look."', before.in && took !== false && key === 'look:mailroom' && v.reports.errands.indexOf(key) >= 0 && plain.in && !told.in && told.where === 'Mr Boxhall has gone to the mail room to look.' && other.in && stale.in
      // only a man who goes himself: the officer of the watch who has an officer sent forward stays on the bridge
      && MW.errandOf({ type: 'telegraph', value: 'stop' }, 'boxhall') === null && MW.errandOf({ type: 'report:look', value: 'mailroom' }, 'murdoch') === null && MW.errandOf({ type: 'report:look', value: 'mailroom' }) === null);
  }
  const s1 = MW.stable('hichens', { convention: '1912' }), s2 = MW.stable('hichens', { convention: 'modern' });
  row('  the stable part says the helm\'s convention in force: which order turns her head which way', /"hard a-starboard" turns her head to port/.test(s1) && /turns her head to starboard\./.test(s2) ? 'both said' : 'NOT SAID', '1912: to port; modern: to starboard',
    /"hard a-starboard" turns her head to port/.test(s1) && /"hard a-starboard" \(or "hard to starboard"\) turns her head to starboard/.test(s2) && s1 !== s2);
}

// ------------------------------------------------------------------ 9. the request
console.log('\n9. the request: the stable part, no key or host, the fixed schema');
row('a man\'s stable part has the same bytes at every moment of the night (each seat, each convention)', stableBad.length ? clip(list(stableBad, 2), 160) : MW.CAST.length + ' men x 2 conventions, every 400 steps', 'the same bytes', stableBad.length === 0);
row('  no request holds a key, a host or an address; each has a seat and two parts within 24,000 characters', requestBad.length ? clip(list(requestBad, 2), 160) : 'none; the largest part ' + sizeMax + ' characters', 'app/minds.js LIMITS.part', requestBad.length === 0 && sizeMax > 1000);
{
  const literal = { type: 'object', properties: { say: { type: 'string' }, order: { anyOf: [{ type: 'string' }, { type: 'null' }] } }, required: ['say', 'order'], additionalProperties: false };
  let app = null; try { app = require('../app/minds.js').TURN_SCHEMA; } catch (e) { app = null; }
  const ok = JSON.stringify(MW.SCHEMA) === JSON.stringify(literal) && (app === null || JSON.stringify(MW.SCHEMA) === JSON.stringify(app));
  row('  the schema is the one fixed form of a turn, the app\'s own', clip(JSON.stringify(MW.SCHEMA), 60), app ? 'app/minds.js TURN_SCHEMA, key for key' : 'the design\'s (app/minds.js not here)', ok);
  const v = MW.gather(snaps[30]);
  const r = MW.request('murdoch', v, [{ t: '12:09 am', who: 'You', words: 'Mr Murdoch, how is she?' }, { t: '12:09 am', who: 'Mr Murdoch', words: 'Down by the head, sir.' }], 'Mr Murdoch, what did you see?', {});
  const parts = r.changing.split('\n\n');
  const ok2 = parts.length === 3 && parts[0] === MW.facts(v, 'murdoch', {}) && /^THE TALK ON THE BRIDGE \(newest last\)\n- 12:09 am, the captain: Mr Murdoch, how is she\?\n- 12:09 am, Mr Murdoch: Down by the head, sir\.$/.test(parts[1])
    && parts[2] === 'THE CAPTAIN SAYS TO YOU: Mr Murdoch, what did you see?' && /^You are William Murdoch, First Officer, of the Royal Mail Steamer Titanic/.test(r.stable);
  row('  the changing part: THE FACTS, the talk on the bridge (newest last), the captain\'s words to him', clip(parts.map(p => p.split('\n')[0]).join(' / '), 90), 'design 6.1', ok2);
  const toks = Math.round(parts[0].length / 4);
  row('  THE FACTS in the middle of the night: about 400 to 900 tokens [bet]', toks + ' tokens (at four characters a token), T+30', 'design 5: about 400 to 900', toks >= 200 && toks <= 1800);
}

// ------------------------------------------------------------------ 10. the fake
console.log('\n10. the fake gives the same answer to the same request');
{
  const v = MW.gather(snaps[26]), reqs = [];
  for (const c of MW.CAST) for (const w of ['What did you see?', 'How long has she got?', 'Get her clear of it.', 'Close the doors if you think best.', 'Is there anything from the boats?', 'What do you make of it, Mr ' + c.full + '?'])
    reqs.push(MW.request(c.id, v, [], w, {}));
  const first = reqs.map(r => MW.fakeReply(r));
  for (const r of reqs.slice().reverse()) MW.fakeReply(r, [{ replies: ['other'] }]);   // other calls between
  const second = reqs.map(r => MW.fakeReply(r));
  const differ = first.filter((x, i) => x !== second[i]).length;
  row('the same request, the same answer, whatever was asked between', differ + ' of ' + reqs.length + ' differ', 'none', differ === 0 && reqs.length >= 30);
  const bad = [];
  reqs.forEach((r, i) => {
    const t = MW.readTurn(first[i]), c = t.ok ? MW.check(t.say, r.changing, MW.BY[r.seat], {}) : null;
    if (!t.ok || !c.ok) bad.push(r.seat + ': ' + first[i] + (c ? ' ' + c.faults.map(f => f.kind).join() : ''));
    else if (t.order !== null) { const o = MW.readOrder(t.order, r.seat, {}); if (!o.ok) bad.push(r.seat + ': its order ' + t.order + ' ' + o.why); }
  });
  row('  every answer of the default table reads, passes the checks, and gives only orders within the man\'s remit', bad.length ? clip(list(bad, 1), 160) : reqs.length + ' answers', 'design 9: the suites\' provider', bad.length === 0);
  const T = [{ seat: 'murdoch', when: 'doors', replies: ['raw text, not JSON'] }, { replies: [{ say: 'All right, sir.', order: 'stop' }] }];
  const a1 = MW.fakeReply(MW.request('murdoch', v, [], 'The doors, Mr Murdoch?', {}), T), a2 = MW.fakeReply(MW.request('moody', v, [], 'The doors?', {}), T);
  let threw = 0; for (const x of [null, undefined, {}, 42, { seat: 5, changing: {} }]) { try { if (typeof MW.fakeReply(x) !== 'string') threw++; } catch (e) { threw++; } }
  row('  a table\'s row is chosen by the seat and the captain\'s words; a string is sent as it is; it never throws', a1 + ' / ' + a2 + '; ' + threw + ' threw', 'raw text, not JSON / {"say":"All right, sir.","order":"stop"}; 0',
    a1 === 'raw text, not JSON' && a2 === '{"say":"All right, sir.","order":"stop"}' && threw === 0);
}

// ------------------------------------------------------------------ 11. people only
console.log('\n11. people only: every line has a named person; every generated line is marked as imagined');
{
  const NOT = /\b(ship|system|computer|AI|assistant|model|machine|narrator|the bridge)\b/i, bad = [];
  for (const c of MW.CAST) {
    if (!/^(Mr|Quartermaster) [A-Z][a-z]+$/.test(c.name) || NOT.test(c.name) || NOT.test(c.short)) bad.push(c.id + ': ' + c.name);
    for (const how of ['generated', 'floor']) {
      const l = MW.lineOf(c.id, 'Yes, sir.', how);
      if (!l || l.who !== c.name || l.imagined !== (how === 'generated') || l.floor !== (how === 'floor') || !l.words) bad.push(c.id + ' ' + how);
    }
  }
  row('every man\'s line is said by a named person; a generated one is marked as imagined, the floor is not', bad.length ? bad.join(', ') : MW.CAST.map(c => c.name).join(', '), 'never the ship, the system, a machine', bad.length === 0 && MW.lineOf('nobody', 'x', 'generated') === null);
  const N1 = [['asked', 'Mr Murdoch'], ['waiting', 'Mr Murdoch'], ['two'], ['limit', '200 questions'], ['off'], ['fault', 'Mr Murdoch', 'No answer came in 20 seconds'], ['gone', 'Mr Murdoch'],
    ['left', 'Mr Murdoch'], ['lapsed', 'Hard a-port'], ['declined', 'Hard a-port'], ['dropped', 'Mr Murdoch', 'not his to give'], ['other', 'Mr Lightoller'], ['wireless', 'Mr Phillips']];
  const bad2 = N1.map(a => MW.notice.apply(null, a)).filter(s => !s || /^[A-Z][a-z]*( [A-Z][a-z]+)*: /.test(s) || /\b(The ship|the system|AI|assistant)\b/.test(s));
  row('  the notices are nobody\'s line: none is a person speaking, none speaks as the ship or a system', bad2.length ? bad2.join(' | ') : N1.length + ' notices, e.g. "' + MW.notice('fault', 'Mr Murdoch', 'No answer came in 20 seconds') + '"', 'outside the fiction', bad2.length === 0);
  row('  THE FACTS never make the ship a speaker (the touch is "felt on the bridge"), through the whole night', shipSpeaker.length ? clip(list(shipSpeaker, 1), 140) : 'never, in ' + factsBuilt + ' texts built', 'design 2, rule 1', shipSpeaker.length === 0);
  const cards = MW.CAST.map(c => MW.stable(c.id, {})).join('\n'), never = /\b(died|drowned|lost at sea|body was|perished|survived|shot|bribe|unsinkable|suicide)\b/i;
  const outside = MW.CAST.filter(c => c.card.concat(c.voice).some(l => never.test(l) || /\b(\d{4})\b/.test(l) && +/\b(\d{4})\b/.exec(l)[1] > 1912)).map(c => c.id);
  row('  no card speaks of a man\'s end or a contested story outside its "never speak of" line, nor of any year after 1912', outside.length ? outside.join(', ') : 'none, in ' + MW.CAST.length + ' cards', 'personas (f), (g)', outside.length === 0 && /Never speak of: /.test(cards));
}

// ------------------------------------------------------------------ 12. neutral
console.log('\n12. neutral: THE FACTS built at every step of a 1912 watch change nothing');
row('the watch\'s fingerprint with THE FACTS built at every step is the watch\'s alone', N.fingerprint(runB) + ' at step ' + runB.night.k, 'alone: ' + N.fingerprint(runA) + ' at step ' + runA.night.k, N.fingerprint(runB) === N.fingerprint(runA) && runB.night.k === runA.night.k);
row('  the readers\' states at her end are the same, with and without (reports, boats, other ships)', json([runB.reports, runB.people, runB.world]) === json([runA.reports, runA.people, runA.world]) ? 'the same' : 'DIFFER', 'deep copies, byte for byte',
  json([runB.reports, runB.people, runB.world]) === json([runA.reports, runA.people, runA.world]));
row('  and before and after each building, at every 200th step', stateBad.length ? clip(list(stateBad, 3), 120) : samples + ' samples, unchanged', 'unchanged', stateBad.length === 0 && samples > 100);

// ------------------------------------------------------------------ 13. the bridge speaks (design 14, stage C)
console.log('\n13. the bridge speaks: each report of the 1912 night, and the man who would give it in his own words');
{
  const of = (pred) => spoke.filter(pred), names = (list) => Array.from(new Set(list.map(x => x.seat + (x.how ? ' ' + x.how : '')))).join(', ') || 'nobody';
  const eye = of(x => x.rule === 'eye'), fourth = of(x => x.who === 'The Fourth Officer'), builder = of(x => x.who === 'The builder\'s man'), carp = of(x => x.who === 'The carpenter');
  const quiet = of(x => x.rule === 'commutator' || x.rule === 'routine' || x.rule === 'touch'), brought = of(x => (x.ch === 'runner' || x.ch === 'phone') && x.who !== 'The Fourth Officer');
  const early = brought.filter(x => x.T < 40), late = brought.filter(x => x.T >= 50);
  row('what he saw himself he gives (the officer of the watch, by eye); what he brought he gives (Mr Boxhall back from a look, Mr Andrews with his estimate)',
    `by eye: ${names(eye.filter(x => x.T < 40))}; the Fourth Officer back: ${names(fourth)}; the builder: ${names(builder)}`, 'murdoch own; boxhall back; andrews back',
    eye.length >= 3 && eye.filter(x => x.T < 40).every(x => x.seat === 'murdoch' && x.how === 'own') && fourth.length >= 2 && fourth.every(x => x.seat === 'boxhall' && x.how === 'back') && builder.length === 1 && builder[0].seat === 'andrews' && builder[0].how === 'back');
  row('  a man who is not of the cast is received by the officer of the watch; once he has gone to the boats, by the officer still on the bridge',
    `the carpenter: ${names(carp)}; brought before T+40: ${names(early)}; after T+50: ${names(late)}`, 'murdoch relay; murdoch relay; boxhall relay (or nobody)',
    carp.length === 1 && carp[0].seat === 'murdoch' && carp[0].how === 'relay' && early.length >= 3 && early.every(x => x.seat === 'murdoch' && x.how === 'relay') && late.length >= 1 && late.every(x => x.seat === null || (x.seat === 'boxhall' && x.how === 'relay')));
  row('  the commutator\'s readings, the routine\'s bells and the touch all of them felt are nobody\'s to give', quiet.length + ' lines, given by ' + names(quiet.filter(x => x.seat)), 'nobody', quiet.length >= 10 && quiet.every(x => x.seat === null));
  const given = spoke.filter(x => x.seat).length;
  row('  each such request is the man\'s own stable part with the report as its last word; given back as it came, it reads and passes every check', spokeBad.length ? clip(list(spokeBad, 2), 170) : given + ' of the night\'s ' + spoke.length + ' reports', 'each reads and passes',
    spokeBad.length === 0 && given >= 10 && spoke.length === runA.reports.feed.length);
  const v = MW.gather(snaps[30]), e0 = v.reports.feed[v.reports.feed.length - 1];
  const cue = MW.reportCue(e0, 'relay').split('\n'), own = MW.reportCue(e0, 'own').split('\n')[0], back = MW.reportCue(e0, 'back').split('\n')[0];
  row('  the cue says how it came to him (seen, brought, or received from whom), and asks for one or two sentences and no order', clip(cue[0], 80), 'THIS REPORT HAS JUST REACHED YOU ON THE BRIDGE (who, how): ...',
    /^THIS REPORT HAS JUST REACHED YOU ON THE BRIDGE \([^)]+\): /.test(cue[0]) && /^YOU HAVE JUST SEEN THIS YOURSELF: /.test(own) && /^YOU HAVE JUST COME TO THE CAPTAIN WITH THIS: /.test(back) && /one or two sentences/.test(cue[1]) && /"order" is null/.test(cue[1])
    && MW.speaker(v, null) === null && MW.speaker(v, { kind: 'routine' }) === null && MW.speaker(null, e0) === null);
}

console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${rows.length} rows`);
process.exit(fails ? 1 : 0);
