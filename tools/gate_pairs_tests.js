// gate_pairs_tests.js: tools/gate.js's browser phase under D83, headless. The gate is run on stand-ins for browser suites
// that start no browser (--d83-fixtures, tools/fixtures/d83_suite.js): three on the page's virtual clock, one whose output
// says whether another ran beside it, one on real time. Each prints its start and end; from those: the virtual ones run
// two at a time and the real-time one beside none; with --browser-jobs 1 none beside another; --pair-check runs each
// virtual one alone, then paired, and holds its paired output to its lone one (the one that says it had company fails,
// and so does the gate); --pair-check with one suite is refused. Their times are kept in out/gate/d83_durations.json,
// never the gate's durations.json.
//   node tools/gate_pairs_tests.js
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const root = path.join(__dirname, '..');
const gateDir = path.join(root, 'out', 'gate'), fixDir = path.join(gateDir, 'd83');
let fails = 0, rows = 0;
const row = (what, got, want, ok) => { rows++; if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${what}: ${got} (${want})`); };
const gate = (extra) => {
  fs.rmSync(fixDir, { recursive: true, force: true });
  const t0 = Date.now(), r = spawnSync(process.execPath, ['tools/gate.js', '--d83-fixtures', ...extra], { cwd: root, encoding: 'utf8', timeout: 120000 });
  return { out: (r.stdout || '') + (r.stderr || ''), status: r.status, ms: Date.now() - t0 };
};
// a stand-in's run, [start, end] in ms, from its log (out/gate/<name>.txt, or <name>.alone.txt for --pair-check's lone run)
const span = (name, alone) => {
  try {
    const t = fs.readFileSync(path.join(gateDir, name + (alone ? '.alone' : '') + '.txt'), 'utf8');
    const at = (k) => +((t.match(new RegExp('^~ ' + k + ' (\\d+)', 'm')) || [])[1]);
    return [at('start'), at('end')];
  } catch (e) { return [NaN, NaN]; }
};
const meet = (a, b) => Math.min(a[1], b[1]) > Math.max(a[0], b[0]);
const most = (spans) => Math.max(0, ...spans.map(s => spans.filter(o => o[0] <= s[0] && o[1] > s[0]).length));
const lines = (out, name) => out.split('\n').filter(l => new RegExp('^\\w+\\s+' + name + '\\s').test(l));
const V = ['d83_v1', 'd83_v2', 'd83_v3'], ALL = 'd83_rt,' + V.join(',');
const show = (sp) => sp.map(([a, b]) => `${((b - a) / 1000).toFixed(1)} s`).join(', ');

// 1. the default: the virtual ones two at a time, the real-time one alone
let g = gate(['--only', ALL]);
let rt = span('d83_rt'), vs = V.map(n => span(n));
row('the browser suites on the virtual clock run two at a time', `at most ${most(vs)} at once; v1 beside v2 ${meet(vs[0], vs[1])}; runs ${show(vs)}`,
  'two at once, the first two together', most(vs) === 2 && meet(vs[0], vs[1]));
row('one on real time runs alone', `beside a virtual one: ${vs.some(v => meet(rt, v))}`, 'beside none', vs.every(v => !meet(rt, v)) && rt.every(Number.isFinite));
const said = (g.out.split('\n').find(l => /^gate:/.test(l)) || '').trim();
row('every verdict, the gate\'s, and what it says it does', `${lines(g.out, 'd83_\\w+').filter(l => /^PASS/.test(l)).length} PASS of 4, exit ${g.status}; "${said}"`,
  '4 PASS, exit 0, naming 1 on real time and 3 on the virtual clock 2 side by side', lines(g.out, 'd83_\\w+').filter(l => /^PASS/.test(l)).length === 4 && g.status === 0 && /real time alone and in turn \(1\)/.test(said) && /virtual clock 2 side by side \(3\)/.test(said));

// 2. --browser-jobs 1: every browser suite alone, as before D83
g = gate(['--only', ALL, '--browser-jobs', '1']);
const all1 = [span('d83_rt'), ...V.map(n => span(n))];
row('--browser-jobs 1 runs every browser suite alone', `at most ${most(all1)} at once; exit ${g.status}`, 'one at a time, exit 0', most(all1) === 1 && g.status === 0);

// 3. --pair-check: each virtual one alone, then paired, its paired output held to its lone one
g = gate(['--only', ALL, '--pair-check']);
const pl = V.map(n => lines(g.out, n));
const okPaired = pl.every(ls => ls.length === 2 && /^PASS\s+\S+\s+.*alone: PASS:/.test(ls[0]) && /^PASS\s+\S+\s+.*paired \(beside another for \d+ % of its run\): its output is its lone one, line for line \(4 lines, 2 volatile aside\)/.test(ls[1]));
row('--pair-check: each virtual suite alone, then paired, its paired output its lone one', pl.map(ls => ls.map(l => l.replace(/\s+/g, ' ').slice(0, 150)).join(' / ')).join(' | '),
  'two lines each: alone PASS, then paired PASS with 4 lines equal and the 2 volatile ones aside', okPaired && lines(g.out, 'd83_rt').length === 1 && g.status === 0);
const lone = V.map(n => span(n, true)), pair = V.map(n => span(n));
row('--pair-check\'s lone runs ran alone, its paired ones beside each other', `lone at most ${most(lone)} at once, paired ${most(pair)}`, 'lone 1, paired 2',
  most(lone) === 1 && most(pair) === 2 && lone.every(s => s.every(Number.isFinite)));

// 4. a paired output that differs from its lone one fails its row and the gate
g = gate(['--only', 'd83_v1,d83_vary', '--pair-check']);
const vl = lines(g.out, 'd83_vary'), v1 = lines(g.out, 'd83_v1');
row('a suite whose paired output differs from its lone one fails, and the gate with it', `${(vl[1] || 'no line').replace(/\s+/g, ' ').slice(0, 170)}; v1 ${(v1[1] || '').slice(0, 4)}; exit ${g.status}`,
  'vary FAIL, differing in 1 line; v1 PASS; exit 1', /^FAIL/.test(vl[1] || '') && /differs from its lone one in 1 line/.test(vl[1] || '') && /^PASS/.test(v1[1] || '') && g.status === 1);

// 5. --pair-check with one virtual suite proves nothing: refused
g = gate(['--only', 'd83_rt,d83_v1', '--pair-check']);
row('--pair-check with one suite on the virtual clock', `exit ${g.status}; ${g.out.trim().split('\n').pop()}`, 'refused, exit 2', g.status === 2 && /needs two or more/.test(g.out));

fs.rmSync(fixDir, { recursive: true, force: true });
console.log(fails ? `FAIL: ${fails} of ${rows}` : `PASS: all ${rows} rows`);
process.exit(fails ? 1 : 0);
