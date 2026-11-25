// NH3's acceptance (tools/ensemble.js; docs/BRAINSTORM_the_next_horizon_v1_2026-11-23.md, NH3):
//   node tools/ensemble_tests.js        (about five minutes at two threads; writes out/ensemble_1912.json through outdir)
// MUST rows fail the suite; CHECK rows print what is worth seeing.
//   1 the landed member's watch is THE watch (the 1912 watch run alone to her flag): its fingerprint and its step; its preset is the
//     golden trace's founder
//   2 the bands contain it: its founders and its onsets lie within the kept set's (MUST); its trim, list and water at
//     every sample within theirs (CHECK: the landed member is not one of the kept set, its numbers rounded and its split
//     held at 0, so a sample can lie just outside, and each such is printed)
//   3 the same table with one thread or three (the first three members, written to scratch files)
'use strict';
const fs = require('fs');
const path = require('path');
const C = require('../core/core.js');
const N = require('../core/night.js');
const EN = require('./ensemble.js');
const rows = []; let fails = 0;
function row(kind, what, value, ref, ok) { rows.push([kind, what, value, ref, ok]); if (kind === 'MUST' && !ok) fails++; }
const r4 = (x) => +x.toFixed(4);

(async () => {
  const full = await EN.run(EN.args(['--jobs', '2']), (s) => console.log('  ' + s)), t = full.table, L = t.landed;
  // 1. the landed member is the watch, and the preset the golden trace's
  const w = N.sink(N.create(C.buildShip(), N.spec(1912), { auto: true, handover: 'flag' }));
  row('MUST', 'the landed member\'s watch is the 1912 watch run alone to her flag, as the member\'s run names it: its fingerprint and its step', L.watch.fp + ' at step ' + L.watch.k, N.fingerprint(w) + ' at step ' + w.night.k, L.watch.fp === N.fingerprint(w) && L.watch.k === w.night.k);
  const g = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'out', 'golden_titanic.json'), 'utf8'));
  row('MUST', '  ... and its preset founders when the golden trace does', L.preset.founder + ' min', r4(g.founderT / 60) + ' min (out/golden_titanic.json)', L.preset.founder === r4(g.founderT / 60));
  // 2. the bands contain it
  const inside = (B, v) => B.n > 0 && v !== null && v >= B.lo && v <= B.hi;
  const ends = [['the preset\'s founder', t.founder.preset, L.preset.founder], ['the watch\'s founder (T)', t.founder.watch, L.watch.founder], ['the preset\'s onset', t.onset.preset, L.preset.onset], ['the watch\'s onset (T)', t.onset.watch, L.watch.onset]];
  row('MUST', 'the bands contain it: its founders and its onsets lie within the kept set\'s (' + t.members + ' members)', ends.map(([n, B, v]) => n + ' ' + v + ' in ' + B.lo + ' to ' + B.hi).join('; '), 'each within', ends.every(([, B, v]) => inside(B, v)));
  const out = []; let n = 0;
  for (const k of ['preset', 'watch']) for (const b of t.bands[k]) { if (!b.landed) continue; for (const q of ['trim', 'list', 'water']) { if (!b[q].n) continue; n++; if (!inside(b[q], b.landed[q])) out.push(k + ' T ' + b.T + ' ' + q + ' ' + b.landed[q] + ' (the band ' + b[q].lo + ' to ' + b[q].hi + ')'); } }
  row('CHECK', '  ... and its trim, list and water at every sample within theirs', (n - out.length) + ' of ' + n + ' within' + (out.length ? '; outside: ' + out.join('; ') : ''), 'all (the landed member is not one of the kept set)', out.length === 0);
  // 3. the same table with one thread or three
  const dir = path.join(__dirname, '..', 'out', 'gate', 'ensemble_tests'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const a = await EN.run({ jobs: 1, members: 3, out: path.join(dir, 'one.json') }), b = await EN.run({ jobs: 3, members: 3, out: path.join(dir, 'three.json') });
  const same = fs.readFileSync(a.file, 'utf8') === fs.readFileSync(b.file, 'utf8');
  row('MUST', 'the same table with one thread or three (the landed member and the first three of the kept set)', same ? 'the same, byte for byte' : 'DIFFERENT', 'the same', same);
  for (const [kind, what, value, ref, ok] of rows) console.log((ok ? 'PASS ' : (kind === 'MUST' ? 'FAIL ' : 'CHECK ')) + kind.padEnd(6) + what.padEnd(100) + ' ' + String(value).slice(0, 400) + '   ' + ref);
  console.log(fails ? '\nFAIL: ' + fails + ' MUST row(s)' : '\nPASS: all ' + rows.filter((r) => r[0] === 'MUST').length + ' MUST rows');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
