// The first search for the Carpathia question (tools/carpathia.js, W5): acceptance, headless, on a small budget.
//   node tools/carpathia_tests.js            (three or four minutes: the search itself runs three times on a dozen nights)
// MUST rows: the search's baseline is the watch's own foundering, to the bit; a night forked by copy equals the same night
// replayed (orders of every kind; under way; backed onto the ice again, where the core rebuilds its connections); a night's
// log written out replays in a fresh process; the same seed and budget give the same table with one thread and four, and
// the best night the tool writes replays in a fresh process; an order the model refuses is scored as the night it leaves
// and is not counted as carried out; the robustness rerun of the baseline on the model as it stands is the baseline; a run
// cut off resumes to the same table; the best night's address carries its log as the page reads it.
// It writes only under out/gate/carpathia_tests (untracked), never over out/carpathia_best.json.
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const C = require('../core/core.js');
const Mo = require('../core/motion.js');
const N = require('../core/night.js');
const K = require('./carpathia.js');

const ROOT = path.join(__dirname, '..'), TOOL = path.join(__dirname, 'carpathia.js');

// a fresh process: read a best night's file and replay its log with Night.replay (the --replay mode of this file)
if (process.argv[2] === '--replay') {
  const b = JSON.parse(fs.readFileSync(process.argv[3], 'utf8')), ship = C.buildShip();
  const sim = N.replay(ship, N.spec(b.seed), b.log, b.k);
  const endT = sim.foundered ? sim.founderT : (N.over(sim) ? sim.night.onset.found.t : -1);
  process.stdout.write(JSON.stringify({ foundered: sim.foundered, founderT: sim.founderT, over: N.over(sim), endT, fp: N.fingerprint(sim), k: sim.night.k }) + '\n');
  process.exit(0);
}

const DIR = path.join(process.env.TITANIC_OUT ? path.resolve(process.env.TITANIC_OUT) : path.join(ROOT, 'out', 'gate'), 'carpathia_tests');
fs.rmSync(DIR, { recursive: true, force: true });
fs.mkdirSync(DIR, { recursive: true });

const rows = []; let fails = 0;
const row = (kind, what, value, ref, ok) => { rows.push([kind, what, value, ref, !!ok]); if (kind === 'MUST' && !ok) fails++; };
const f = (x, n) => (x === null || x === undefined ? 'n/a' : x.toFixed(n === undefined ? 2 : n));
// G12 (D98): a night ends at its hand-over, the break's onset by default (her flag where she founders first); nights are
// compared there
const same = (a, b) => a.endT === b.endT && a.fp === b.fp && a.k === b.k;
const endOf = (s) => (s.foundered ? s.founderT : (N.over(s) ? s.night.onset.found.t : -1));
const ship = C.buildShip();
K.setModel(null);
const F0 = K.forkOf(ship, null), base = { tTouch: F0.night.tTouch, kFork: F0.night.k };
const Tm = (t) => (t - base.tTouch) / 60;

// 1. with no order, the search's baseline is the watch's own end (its hand-over), to the bit
const B0 = K.play(ship, F0, [], null);
{
  const w = N.sink(N.create(ship, N.spec(1912), { auto: true }));
  const own = { endT: endOf(w), fp: N.fingerprint(w), k: w.night.k };
  row('MUST', 'no order after the ice: the search\'s baseline (forked at step ' + base.kFork + ') is the 1912 watch run straight on, to the bit',
    'fork: ends (the hand-over) T+' + f(Tm(B0.endT)) + ', step ' + B0.k + ', ' + B0.fp + ', ' + f(B0.pumped, 3) + ' t pumped; the watch: T+' + f(Tm(own.endT)) + ', step ' + own.k + ', ' + own.fp,
    'equal: her end, step, fingerprint (0ae90224 at step 37792, her hand-over at the break\'s onset, tools/systems_tests.js; 48b71712 at 39473 at her flag before G12\'s switch; 5854a3e4 at 38386 before the epoch\'s landing, 1a1bd179 at 38389 before the epoch\'s B1, b63a2b3e at 37928 before G7, ede5d1eb at 38099 before join 6, 611be326 at 38100 before C3, 3810e155 at 37979 before S1, 9546a25c at 37970 before M7)', same(B0, own) && B0.fp === '0ae90224' && B0.broke && !B0.afloat);
}

// 2. a night forked by copy equals the same night replayed: orders of every kind, at rest and under way
const nights = {
  'every kind of order at rest': [['pump:6:all', 3], ['pump:2:all', 3], ['pump:1:all', 10], ['door:G', 20], ['switch', 25], ['eng:half-astern:10', 30], ['doorx:K:10', 30], ['pump:-1:engineers', 40], ['door:F', 60], ['pump:10:4', 50], ['fires:2', 100]],
  'under way: half ahead for 20 min (the sea\'s heads of P5), boiler room 3\'s pumps': [['eng:half-ahead:20', 2], ['pump:7:all', 2], ['fires:3', 15]],
  'slow astern for 60 min from T+10, the rudder hard to starboard from T+25: she backs onto the ice again and the contact opens her anew': [['eng:slow-astern:60', 10]],
};
// helm orders beside a night's moves (the search gives none), [T, rudder deg]. M7 (2026-11-18): with a stopped screw's drag
// she stops 2.5 nm nearer the ice, and 30 min of slow astern alone carry her past it 740 m off before the sternway's own
// yaw sets in (before M7 they put her back onto it, 26 openings); with sternway the stern follows the rudder. Join 6
// (2026-11-20: G6, G6b and W6 change the water let in during the contact, and her way after it): slow astern for 30 min
// from T+30 with the rudder over from T+50 no longer brings her back to the ice; of sixty orders near it, slow astern for
// 60 min from T+20 with the rudder over from T+40 does, and opens two new openings. The calibration epoch's landing (D4,
// 2026-11-21): that one no longer does (the fork still equals its replay); of 12 tried, slow astern for 60 min from T+10
// with the rudder over from T+25 does, and opens 22
const helms = { 'slow astern for 60 min from T+10, the rudder hard to starboard from T+25: she backs onto the ice again and the contact opens her anew': [[25, 40]] };
const forked = {};
require('../core/readers/world.js');                   // a reader attached to the replays (it changes no bit: core/night.js)
for (const [name, moves] of Object.entries(nights)) {
  const orders = K.expand(base, moves);
  for (const [T, deg] of helms[name] || []) orders.push({ k: K.kOf(base, T), type: 'helm', value: deg });
  orders.sort((a, b) => a.k - b.k);
  const r = K.play(ship, F0, orders, null, true);
  const rp = N.replay(ship, N.spec(1912), r.log, r.k), rr = { endT: endOf(rp), fp: N.fingerprint(rp), k: rp.night.k };
  const kinds = [...new Set(orders.map(o => o.type))].join(', '), st = r.st.map(x => x.s), again = /onto the ice/.test(name);
  forked[name] = { orders, r };
  row('MUST', 'forked equals replayed: ' + name + ' (' + orders.length + ' orders: ' + kinds + '; ' + st.filter(s => s !== 'done').length + ' refused or idle)',
    'fork: T+' + f(r.m) + ', step ' + r.k + ', ' + r.fp + (r.ins.newHoles ? ', ' + r.ins.newHoles + ' openings made after the fork' : '') + '; replay (the world reader on): T+' + f(Tm(rr.endT)) + ', step ' + rr.k + ', ' + rr.fp,
    'equal to the bit' + (again ? '; new openings after the fork' : ''), N.over(rp) && same(r, rr) && !!rp.world && (!again || r.ins.newHoles > 0));
}

// 3. a candidate's log, written out and read back in a fresh process, replays to the same night
{
  const { r } = forked['every kind of order at rest'], file = path.join(DIR, 'night_every_kind.json');
  fs.writeFileSync(file, JSON.stringify({ seed: 1912, k: r.k, founderT: r.founderT, endT: r.endT, fingerprint: r.fp, log: r.log }, null, 1) + '\n');
  const p = spawnSync(process.execPath, [__filename, '--replay', file], { encoding: 'utf8' });
  let got = null; try { got = JSON.parse(p.stdout.trim().split('\n').pop()); } catch (e) { got = null; }
  row('MUST', 'a night\'s log written out and read back in a fresh process replays to the same night',
    got ? 'fresh process: ends T+' + f(Tm(got.endT)) + ', step ' + got.k + ', ' + got.fp : 'no answer: ' + (p.stderr || '').slice(0, 200),
    'the fork\'s: T+' + f(r.m) + ', step ' + r.k + ', ' + r.fp, got && got.over && same(got, { endT: r.endT, fp: r.fp, k: r.k }));
}

// 4. the same seed and budget give the same table with --jobs 1 and --jobs 4; the tool's own best night replays in a fresh process
const run = (tag, jobs, extra) => {
  const st = path.join(DIR, 'state_' + tag), out = path.join(DIR, 'best_' + tag + '.json');
  const p = spawnSync(process.execPath, [TOOL, '--nights', '12', '--seed', '7', '--variants', '3', '--robust', '1', '--jobs', String(jobs), '--state', st, '--out', out].concat(extra || []), { encoding: 'utf8', maxBuffer: 1 << 26 });
  const lines = (p.stdout || '').replace(/\r\n/g, '\n').trimEnd().split('\n');
  return { code: p.status, err: p.stderr || '', table: lines.slice(0, -1).join('\n'), last: lines[lines.length - 1] || '', out, st, best: fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : null };
};
const A = run('jobs1', 1), D = run('jobs4', 4);
{
  const diff = A.table.split('\n').filter((l, i) => l !== D.table.split('\n')[i]).length;
  row('MUST', 'the same seed and budget (seed 7, 12 nights, 3 models) give the same table with --jobs 1 and --jobs 4',
    'exit ' + A.code + ' and ' + D.code + '; ' + A.table.split('\n').length + ' lines, ' + diff + ' differ; the best nights\' files ' + (A.best === D.best ? 'equal' : 'differ') + '; ' + A.last.slice(1, 40) + ' | ' + D.last.slice(1, 40),
    'the same to the letter (the last line, the time taken, aside)', A.code === 0 && D.code === 0 && A.table.length > 500 && A.table === D.table && A.best !== null && A.best === D.best);
  if (A.code !== 0) console.log(A.err.slice(0, 2000));
  const b = A.best ? JSON.parse(A.best) : null;
  const p = b ? spawnSync(process.execPath, [__filename, '--replay', A.out], { encoding: 'utf8' }) : null;
  let got = null; try { got = JSON.parse(p.stdout.trim().split('\n').pop()); } catch (e) { got = null; }
  row('MUST', '  ... and the best night it writes (seed and orders) replays with Night.replay in a fresh process to its end (its hand-over) and fingerprint',
    got ? 'T+' + f(Tm(got.endT)) + ', step ' + got.k + ', ' + got.fp + ' (' + b.orders.length + ' order(s) after the ice)' : 'no answer',
    b ? 'the file: T+' + f(b.minutes) + ', step ' + b.k + ', ' + b.fingerprint : 'no file', got && b && got.over === b.foundered && got.endT === b.endT && got.fp === b.fingerprint && got.k === b.k);
  // the address: the page's own encoding (site/parts/40_night_end.js, encodeLog), and orders its checks accept
  if (b) {
    const raw = JSON.parse(Buffer.from(b.address.split('&log=')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('latin1'));
    const ok1 = (o) => {
      const [k, type, v, arg] = o;
      if (!Number.isInteger(k) || k < 0 || k > 500000) return false;
      if (type === 'helm') return typeof v === 'number' && Math.abs(v) <= 40 + 1e-9;
      if (type === 'telegraph') return Object.prototype.hasOwnProperty.call(Mo.TELEGRAPH, v) && (arg == null || arg === 'port' || arg === 'starboard');
      if (type === 'door') return Number.isInteger(v) && v >= 0 && v < C.BULKHEADS.length && (arg === true || arg === false);
      if (type === 'doors') return v === 'bridge' && arg == null;
      if (type === 'fires') return Number.isInteger(v) && v >= -1 && v < 6 && arg == null;
      if (type === 'pump') return Number.isInteger(v) && v >= -1 && v < 16 && ((Number.isInteger(arg) && arg >= 0 && arg < 32) || ['own', 'all', 'off', 'engineers'].includes(arg));
      return false;
    };
    const back = raw.map(o => ({ k: o[0], type: o[1], value: o[2], arg: o[3] === null ? undefined : o[3] }));
    const eq = JSON.stringify(back.map(o => [o.k, o.type, o.value, o.arg])) === JSON.stringify(b.log.map(o => [o.k, o.type, o.value, o.arg]));
    row('MUST', '  ... and its address (#night=1912&log=...) carries that log as the page decodes it, every order one the page accepts',
      raw.length + ' orders decoded from ' + b.address.length + ' characters; ' + (eq ? 'the same log' : 'NOT the same log'), 'site/parts/40_night_end.js: encodeLog, decodeLog, validOrder',
      eq && raw.length <= 600 && raw.every(ok1) && raw.every((o, i) => i === 0 || o[0] >= raw[i - 1][0]) && b.address.startsWith('#night=1912&log='));
  }
}

// 5. an order the model refuses is scored as the night it leaves, and is not counted as carried out
{
  const orders = K.expand(base, [['pump:2:all', 10]]), r = K.play(ship, F0, orders, null);
  row('MUST', 'refused: every pump that can reach No. 2 hold, T+10, after the firemen\'s passage has flooded: the night is the baseline\'s',
    r.st[0].s + ': "' + (r.st[0].why || '') + '"; T+' + f(r.m) + ', ' + r.fp + '; carried out: ' + K.carriedOut(orders, r).length + ' of 1',
    'refused; the baseline to the bit, T+' + f(B0.m) + ', ' + B0.fp, r.st[0].s === 'refused' && /firemen's passage/.test(r.st[0].why) && same(r, B0) && K.carriedOut(orders, r).length === 0);
  // no steam: every fire drawn at the fork; find the step the pumps lose their steam; a pump order a second later
  const s = structuredClone(F0); s.ship = ship;
  N.act(s, 'fires', -1);
  while (!N.over(s) && !(s.pumpScale <= 0)) N.step(s);
  const kDry = s.night.k + 4, fires = [{ k: base.kFork, type: 'fires', value: -1 }], both = fires.concat([{ k: kDry, type: 'pump', value: 7, arg: 'own' }]);
  const a = K.play(ship, F0, fires, null), b = K.play(ship, F0, both, null);
  row('MUST', '  ... and a pump with no steam: every fire drawn at T+' + f(Tm(base.kFork * 0.25), 1) + ', boiler room 3\'s own pumps ordered at T+' + f(Tm(kDry * 0.25), 1) + ', the pressure gone',
    b.st[1].s + ': "' + (b.st[1].why || '') + '"; T+' + f(b.m) + ', ' + b.fp + '; carried out: ' + K.carriedOut(both, b).length + ' of 2',
    'refused; the night of the fires alone to the bit, T+' + f(a.m) + ', ' + a.fp, !N.over(s) && b.st[0].s === 'done' && b.st[1].s === 'refused' && /No steam/.test(b.st[1].why) && same(a, b) && K.carriedOut(both, b).length === 1);
}

// 6. the robustness rerun of the baseline on the model as it stands is the baseline; a moved model moves it; nothing leaks
{
  const ev = K.evaluator(), files = {};
  for (const G of K.GUESSES) files[G.id] = G.v;
  const asis = ev({ orders: [], model: null }), explicit = ev({ orders: [], model: { g: files } });
  const moved = ev({ orders: [], model: { g: { pumpRate: 0.7, bowWave: 0.66, sill: 0.3, passage: -1, pumpAbandon: 99, pumpLent: 600 } } });
  const after = ev({ orders: [], model: null }), v0 = K.variantsOf(5, 1)[0];
  row('MUST', 'the robustness rerun of the baseline on the model as it stands is the baseline (its first model; and every guess set to its file value by the rerun\'s own machinery)',
    'first model "' + v0.name + '": T+' + f(asis.m) + ', ' + asis.fp + '; every guess at its value: T+' + f(explicit.m) + ', ' + explicit.fp,
    'the baseline to the bit: T+' + f(B0.m) + ', ' + B0.fp, Object.keys(v0.g).length === 0 && same(asis, B0) && same(explicit, B0));
  row('MUST', '  ... and a model with guesses moved (pumps 0.7x, the bow wave 0.66, the sills 0.3 m up, pumps run on, the main in 10 min) is another night; the next one on the model as it stands is the baseline again',
    'moved: T+' + f(moved.m) + ', ' + moved.fp + '; then as it stands: T+' + f(after.m) + ', ' + after.fp, 'moved differs; then the baseline to the bit', moved.fp !== B0.fp && same(after, B0));
}

// 6b. D5 (the epoch's design v1.1, 5.5): a member of the kept set as a robustness model. Its fork, at the landed member's
// step, run on with no order, is that member's own watch (tools/ensemble.js memberWatch, as NH3 and the gallery run it),
// to the bit; the best night's search orders are carried out on it. The models: each member once, alone, after the
// guesses' ends; every joint draw on a member; a small run's models as they were
{
  const EN = require('./ensemble.js'), keptSet = JSON.parse(fs.readFileSync(path.join(ROOT, 'out', 'kept_1912.json'), 'utf8'));
  const bestFile = JSON.parse(fs.readFileSync(path.join(ROOT, 'out', 'carpathia_best.json'), 'utf8'));
  const sOrders = bestFile.log.filter(o => o.k >= base.kFork).map(o => ({ k: o.k, type: o.type, value: o.value, arg: o.arg }));
  const ev = K.evaluator(), out = [];
  for (const i of [0, 1]) {
    const ice = ev({ ice: i }), model = { g: { calib: i }, ice }, F = K.forkOf(ship, model);
    const r = ev({ orders: [], model }), w = N.sink(EN.memberWatch(keptSet.members[i].inputs, ship, { ice }).sim), rb = ev({ orders: sOrders, model });
    out.push({ i, kF: F.night.k, r, own: { fp: N.fingerprint(w), k: w.night.k, endT: endOf(w) }, done: rb.st.filter(s => s.s === 'done').length, rb });
  }
  row('MUST', 'D5: a member of the kept set as a robustness model: its fork (at the landed step ' + base.kFork + ') run on with no order is its own watch, to the bit; the best night\'s ' + sOrders.length + ' search orders carried out on it',
    out.map(x => 'member ' + x.i + ': fork step ' + x.kF + ', ' + x.r.fp + ' at ' + x.r.k + ' (T+' + f(x.r.m) + ') against its own ' + x.own.fp + ' at ' + x.own.k + '; the best night T+' + f(x.rb.m) + ', ' + x.done + ' done').join('; '),
    'the same step; the same night to the bit; every order done', out.every(x => x.kF === base.kFork && x.r.fp === x.own.fp && x.r.k === x.own.k && x.r.endT === x.own.endT && x.done === sOrders.length));
  const v80 = K.variantsOf(80, 1), ids = v80.map(m => m.id), mem = v80.filter(m => /^member-/.test(m.id)).map(m => m.g.calib), joint = v80.filter(m => /^joint-/.test(m.id));
  const firstMem = ids.findIndex(id => /^member-/.test(id)), lastEnd = ids.reduce((a, id, j) => (/-(lo|hi)$/.test(id) ? j : a), -1);
  const v6 = K.variantsOf(6, 1).map(m => m.id).join(' ');
  row('MUST', '  ... and the models: each of the kept set\'s ' + keptSet.members.length + ' members once, alone, after the guesses\' ends; every joint draw on a member; a small run\'s models as before D5',
    v80.length + ' models: members ' + mem.length + ' (' + new Set(mem).size + ' distinct), first at ' + firstMem + ' after the last end at ' + lastEnd + '; joint draws ' + joint.length + ', each on a member: ' + joint.every(m => Number.isInteger(m.g.calib) && m.g.calib >= 0 && m.g.calib < keptSet.members.length) + '; six models: ' + v6,
    'every member once; joint draws on members; six: asis doorLowA-lo doorLowA-hi doorA-lo doorA-hi sill-lo',
    mem.length === keptSet.members.length && new Set(mem).size === keptSet.members.length && firstMem > lastEnd && joint.length > 0 && joint.every(m => Number.isInteger(m.g.calib) && m.g.calib >= 0 && m.g.calib < keptSet.members.length) && v6 === 'asis doorLowA-lo doorLowA-hi doorA-lo doorA-hi sill-lo');
}

// 6c. --warm (D5): a night's orders read back into the search's moves (movesOf, expand's inverse) expand to the same
// orders, to the step: the best night the tree holds, and a made-up night with every kind of move
{
  const bestFile = JSON.parse(fs.readFileSync(path.join(ROOT, 'out', 'carpathia_best.json'), 'utf8'));
  const fileOrders = bestFile.log.filter(o => o.k >= base.kFork).map(o => (o.arg === undefined ? { k: o.k, type: o.type, value: o.value } : { k: o.k, type: o.type, value: o.value, arg: o.arg }));
  const made = [['pump:5:all', 3], ['doorx:E:10', 5], ['eng:slow-ahead:20', 10], ['fires:-1', 30], ['switch', 40], ['pump:-1:engineers', 50], ['door:F', 60]];
  const back = K.movesOf(base, K.expand(base, made)), fileMoves = K.movesOf(base, fileOrders);
  const ok = JSON.stringify(back) === JSON.stringify(K.canon(made)) && K.keyOf(K.expand(base, fileMoves)) === K.keyOf(fileOrders);
  row('MUST', '--warm: a night\'s orders read back into moves expand to the same orders, to the step (the tree\'s best night, and every kind of move)',
    'the best night: ' + JSON.stringify(fileMoves) + '; made up: ' + (JSON.stringify(back) === JSON.stringify(K.canon(made)) ? 'the same moves back' : 'DIFFERENT: ' + JSON.stringify(back)),
    'the same orders and moves', ok);
}

// 7. a run cut off resumes: half its progress kept (the last line cut in two), the same table, the rest run again
{
  const st = path.join(DIR, 'state_resume');
  fs.mkdirSync(st, { recursive: true });
  const src = fs.readdirSync(A.st).find(n => /^nights_.*\.jsonl$/.test(n));
  const all = fs.readFileSync(path.join(A.st, src), 'utf8').split('\n').filter(Boolean), keep = Math.floor(all.length / 2);
  fs.writeFileSync(path.join(st, src), all.slice(0, keep).join('\n') + '\n' + all[keep].slice(0, Math.floor(all[keep].length / 2)));
  const Rr = run('resume', 4);                           // its state folder is the one just cut
  const m = /(\d+) computed, (\d+) read back/.exec(Rr.last), mA = /(\d+) computed/.exec(A.last);
  row('MUST', 'a run cut off resumes: half of a run\'s progress kept, its next line cut in two; run again, the same table',
    'kept ' + keep + ' of ' + all.length + ' lines; the rerun: ' + (m ? m[1] + ' computed, ' + m[2] + ' read back' : Rr.last) + '; the table ' + (Rr.table === A.table ? 'the same' : 'DIFFERENT'),
    'the same table to the letter; only what was lost computed again (' + (mA ? mA[1] : '?') + ' in the whole run)', Rr.code === 0 && Rr.table === A.table && m && +m[2] === keep && +m[1] === all.length - keep);
}

for (const [kind, what, value, ref, ok] of rows) console.log((kind === 'MUST' ? (ok ? 'PASS ' : 'FAIL ') : (ok ? 'in   ' : 'OUT  ')) + what + '\n      ' + value + '\n      against: ' + ref);
console.log(fails ? '\nFAIL: ' + fails + ' MUST row(s)' : '\nPASS: every MUST row (' + rows.filter(r => r[0] === 'MUST').length + ')');
process.exit(fails ? 1 : 0);
