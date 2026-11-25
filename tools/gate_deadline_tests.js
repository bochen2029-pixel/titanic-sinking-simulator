// gate_deadline_tests.js: tools/gate.js's deadlines (BACKLOG G16), headless. The gate is run one suite at a time on three
// fixture suites (--g16-fixtures): one that never ends, with a deadline of 6 s; one that passes; one that passes with a
// table that is not tracked (STALE). The first must fail as TIMEOUT within its deadline and a little, its process killed,
// and the gate go on to the next. The fixtures' times (out/gate/g16_durations.json, never the gate's durations.json) are
// seeded first: only the PASS may add its time, and each suite keeps its last five. Then the deadline itself
// (tools/gate_deadline.js): the floor and the factor, the first run's, the overrides, the longest of the last five.
//   node tools/gate_deadline_tests.js
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { deadlineMin, keep } = require('./gate_deadline');
const root = path.join(__dirname, '..');
const kept = path.join(root, 'out', 'gate', 'g16_durations.json');
fs.mkdirSync(path.dirname(kept), { recursive: true });
fs.writeFileSync(kept, JSON.stringify({ g16_pass: [1, 2, 3, 4, 5], g16_stale: [7] }));   // the fixtures' own times, seeded
const t0 = Date.now();
const r = spawnSync(process.execPath, ['tools/gate.js', '--g16-fixtures', '--jobs', '1', '--only', 'g16_hang,g16_pass,g16_stale'], { cwd: root, encoding: 'utf8', timeout: 120000 });
const ms = Date.now() - t0, out = (r.stdout || '') + (r.stderr || '');
const line = (name) => out.split('\n').find(l => new RegExp('^\\w+\\s+' + name + '\\b').test(l)) || '';
const hang = line('g16_hang'), pass = line('g16_pass'), stale = line('g16_stale');
let fails = 0; const row = (what, got, want, ok) => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${what}: ${got} (${want})`); };
row('a suite that never ends', hang.trim() || 'no line', 'FAIL, TIMEOUT at its deadline of 6 s, its process tree killed', /^FAIL/.test(hang) && /TIMEOUT after/.test(hang));
row('the gate goes on to the next suite', pass.trim() || 'no line', 'PASS', /^PASS/.test(pass));
row('a suite that passes with a table not tracked', stale.trim() || 'no line', 'STALE', /^STALE/.test(stale));
row('the whole run', `${(ms / 1000).toFixed(1)} s, the gate's exit ${r.status}`, 'under 60 s, and the gate failing (one suite failed)', ms < 60000 && r.status === 1);
let times = null; try { times = JSON.parse(fs.readFileSync(kept, 'utf8')); } catch (e) { /* not readable */ }
const show = (v) => Array.isArray(v) ? '[' + v.join(', ') + ']' : String(v);
const names = times ? Object.keys(times).sort() : [], p = times && times.g16_pass, st = times && times.g16_stale;
row('the times kept', times ? names.map(n => n + ' ' + show(times[n])).join('; ') : 'no file',
  'seeded g16_pass [1, 2, 3, 4, 5] and g16_stale [7]: the PASS drops its oldest and adds its own; the STALE and the TIMEOUT add nothing',
  names.join() === 'g16_pass,g16_stale' && Array.isArray(p) && p.length === 5 && p.slice(0, 4).join() === '2,3,4,5' && p[4] > 0 && show(st) === '[7]');
// the deadline in minutes, from a suite and its kept PASS times in ms (a list, or a number as join 7's gate kept it)
const d = (s, k, scale) => deadlineMin(Object.assign({ name: 'x' }, s), k === undefined ? {} : { x: k }, scale);
const same = (a, b) => Math.abs(a - b) < 1e-9;
const ff = [[60000, 10], [300000, 15], [1200000, 60]].map(([t, want]) => ({ t, want, got: d({}, [t]) }));
row('the deadline from the last PASS: the floor and the factor', ff.map(c => `${c.t / 60000} min -> ${c.got} min`).join(', '), 'max(10 min, 3 x the last PASS): 10, 15, 60', ff.every(c => same(c.got, c.want)));
const first = [['none kept', d({}), 30], ['a browser suite, none kept', d({ browser: true }), 30], ['a sweep, none kept', d({ sweep: true }), 120],
  ['deadlineMin 0.1 over a kept 5 min', d({ deadlineMin: 0.1 }, [300000]), 0.1], ['a kept 5 min at --deadline-scale 2', d({}, [300000], 2), 30]];
row('the deadline with no PASS kept, and its overrides', first.map(([w, got]) => `${w}: ${got} min`).join('; '), '30, 30, 120, 0.1, 30', first.every(([, got, want]) => same(got, want)));
// a loaded run's time holds for five PASSes, so a run on an idle machine can't trap a loaded gate
const D = {}, at = () => deadlineMin({ name: 'x' }, D);
for (const m of [2, 8, 3, 3, 3]) keep(D, 'x', m * 60000);
const five = at(); keep(D, 'x', 180000); const six = at(); keep(D, 'x', 180000); const seven = at(), num = d({}, 300000);
row('the deadline from the longest of the last five PASS times', `[2, 8, 3, 3, 3] min -> ${five} min; then 3 -> ${six} min; then 3 again -> ${seven} min (${D.x.length} kept); a number as join 7's gate kept it, 5 min -> ${num} min`,
  '24 (3 x 8); 24, the 8 still among the five; 10, the 8 gone; 15', same(five, 24) && same(six, 24) && same(seven, 10) && D.x.length === 5 && same(num, 15));
console.log(fails ? `FAIL: ${fails} of 8` : 'PASS: all 8 rows');
process.exit(fails ? 1 : 0);
