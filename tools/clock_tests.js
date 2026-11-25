// clock_tests.js: the page's one clock (QC C-3; docs/DESIGN_virtual_clock_v1_1_2026-11-21.md), headless, in seconds.
// Whatever says when something happens in the page reads its clock (TitanicApp.now(), site/app.js); the wall clock stays
// only for CPU budgets, statistics, the player's hand, layout, and the clock itself. This scans every script in site/ for
// a read of the wall clock (performance.now(, Date.now(, setTimeout(, setInterval(, and requestAnimationFrame(, which
// runs on the browser's real frames, outside a test's virtual ones; work batched for the next frame goes through
// TitanicApp.after(0, fn), which runs on the next pass, real or virtual) and holds each line to one of two
// lists: PERMANENT, with its reason, or PENDING, a line still to be put on the clock, with its owner and the step that does
// it. A new read fails until it is put on a list; an entry that no longer matches any line fails until it is taken off.
// PENDING may only shrink: a line is added to it only with the coordinator's word. Comment lines are not scanned.
//   node tools/clock_tests.js
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const READ = /performance\.now\(|Date\.now\(|setTimeout\(|setInterval\(|requestAnimationFrame\(/;

// [file, a piece of the line's text, its reason]
const PERMANENT = [
  ['site/app.js', 'const clock = { t: performance.now()', 'the clock itself: where it starts'],
  ['site/app.js', 'clock.t = Math.max(clock.t, performance.now())', 'the clock itself: where the frames start counting'],
  ['site/app.js', 'clock.off = clock.t - performance.now()', 'the clock itself: back to real time, going on from where it was'],
  ['site/app.js', 'requestAnimationFrame(loop);', "the frame loop itself: the browser's frames drive the clock in real mode"],
  ['site/app.js', 'let frames = 0, wall = performance.now()', "the test entry's yield to the event loop, in real time by design"],
  ['site/app.js', 'if (performance.now() - wall > 30)', "the test entry's yield to the event loop"],
  ['site/app.js', 't0: performance.now(), moved: 0', "the player's hand: a tap against a drag"],
  ['site/app.js', 'const quick = performance.now() - drag.t0 < 450', "the player's hand: a tap against a drag"],
  ['site/app.js', 'fcTimer = setTimeout(runForecast', 'scheduling: the wait before a forecast is asked'],
  ['site/app.js', 'const t0 = performance.now();', "a CPU budget: the forecast's slices on the main thread (no worker)"],
  ['site/app.js', 'while (!done && performance.now() - t0 < 12)', "a CPU budget: the watch forecast's slices"],
  ['site/app.js', 'if (!done) { setTimeout(slice, 0); return; }', "a CPU budget: the watch forecast's slices"],
  ['site/app.js', 'while (performance.now() - t0 < 12 && sim.t < tMax', "a CPU budget: the core forecast's slices"],
  ['site/app.js', 'calm <= 1200) { setTimeout(slice, 0); return; }', "a CPU budget: the core forecast's slices"],
  ['site/app.js', "addEventListener('orientationchange', () => setTimeout(resize, 200))", 'layout: a resize after the phone turns'],
  ['site/parts/24_wake_field.js', 'performance.now ? performance.now() : Date.now()', "a CPU budget: the wave field's work for N ms a frame (the file also runs in Node)"],
  ['site/parts/55_girder.js', 'const t0 = performance.now();', "a statistic: the gauge's cost, which changes nothing"],
  ['site/parts/55_girder.js', 'const dt = performance.now() - t0;', "a statistic: the gauge's cost"],
];
// [file, a piece of the line's text, its owner, the step that puts it on the clock or removes it]
const PENDING = [
  ['site/parts/50_boats.js', 'const t = performance.now(); if (!force && t - lastUi < 200)', "the boats' lane", 'step 2'],
  ['site/parts/55_girder.js', 'const now = performance.now(), sim = S.sim;', "the girder's lane", 'step 2'],
  ['site/parts/60_reports.js', 'toastTimer = setTimeout(', "the reports' lane", 'step 2 (TitanicApp.after)'],
  ['site/parts/60_reports.js', 'const now = performance.now();', "the reports' lane", 'step 2'],
  ['site/parts/60_reports.js', 'holdUntil && performance.now() < holdUntil', "the reports' lane", 'step 2'],
  ['site/parts/70_help.js', 'const now = performance.now(); if (!force && now - lastRender < 250)', "the help's lane", 'step 2'],
  ['site/parts/70_help.js', 't0: performance.now() / 1000', "the help's lane", "step 2 (the frame hook's time)"],
  ['site/parts/70_help.js', 'const now = performance.now() / 1000, R = sim.world.rockets', "the help's lane", "step 2 (the frame hook's time)"],
];

let fails = 0;
const row = (what, got, want, ok) => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${what}: ${got} (${want})`); };
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = dir + '/' + e.name;
    if (e.isDirectory()) walk(rel); else if (e.name.endsWith('.js')) files.push(rel);
  }
})('site');
files.sort();

// 1. every read of the wall clock is on a list
const hits = [], unlisted = [], usedP = new Array(PERMANENT.length).fill(0), usedQ = new Array(PENDING.length).fill(0);
for (const f of files) {
  fs.readFileSync(path.join(root, f), 'utf8').split(/\r?\n/).forEach((line, i) => {
    const t = line.trim();
    if (!READ.test(t) || t.startsWith('//') || t.startsWith('*')) return;
    hits.push(f + ':' + (i + 1));
    const p = PERMANENT.findIndex(([file, piece]) => file === f && t.includes(piece));
    const q = p >= 0 ? -1 : PENDING.findIndex(([file, piece]) => file === f && t.includes(piece));
    if (p >= 0) usedP[p]++; else if (q >= 0) usedQ[q]++; else unlisted.push(f + ':' + (i + 1) + '  ' + t.slice(0, 110));
  });
}
row('every read of the wall clock in site/ is on a list', unlisted.length ? unlisted.length + ' not: ' + unlisted.join(' | ') : `${hits.length} reads in ${new Set(hits.map(h => h.split(':')[0])).size} files, all listed`,
  'each one permanent (with its reason) or pending (with its owner and step)', unlisted.length === 0);

// 2. every entry on the lists still matches a line (an entry that matches nothing is taken off: the pending list shrinks)
const stale = PERMANENT.filter((e, i) => !usedP[i]).map(e => 'permanent ' + e[0] + ' "' + e[1] + '"')
  .concat(PENDING.filter((e, i) => !usedQ[i]).map(e => 'pending ' + e[0] + ' "' + e[1] + '"'));
row('every entry on the two lists still matches a line', stale.length ? stale.length + ' match nothing: ' + stale.join(' | ') : `${PERMANENT.length} permanent and ${PENDING.length} pending entries, each matched`,
  'none left over', stale.length === 0);

// 3. the clock's own interface, which the browser suites rely on, is in site/app.js
const app = fs.readFileSync(path.join(root, 'site', 'app.js'), 'utf8');
const need = [
  ['the clock', /const clock = \{ t: performance\.now\(\), off: 0, virtual: /],
  ['clock=test at boot', /virtual: \/\[#&\]clock=test\(&\|\$\)\/\.test\(location\.hash/],
  ['timers on it', /function after\(ms, fn\)/],
  ['one pass a frame', /function framePass\(render\)/],
  ['the loop', /function loop\(ts\) \{\s*if \(!clock\.virtual\)/],
  ['holdPace with an owner', /function holdPace\(seconds, owner\)/],
  ['a new run ends every hold', /endHolds\(\);/],
  ['the test entry', /const TEST = \{\s*virtual\(on\)/],
  ['whether a pass draws', /passDraws = !!render;/],
  ['on TitanicApp', /now: clockNow, after, cancelAfter, drawing: \(\) => passDraws, test: TEST/],
];
const missing = need.filter(([, re]) => !re.test(app)).map(([what]) => what);
row('site/app.js keeps the clock and its interface', missing.length ? 'missing: ' + missing.join(', ') : need.map(([what]) => what).join(', '), 'all of them', missing.length === 0);

const owners = {}; for (const [, , who] of PENDING) owners[who] = (owners[who] || 0) + 1;
console.log(`  permanent ${PERMANENT.length} entries (the clock, CPU budgets, statistics, the player's hand, layout); pending ${PENDING.length}: ` + Object.entries(owners).map(([w, n]) => `${w} ${n}`).join(', '));
console.log(fails ? `FAIL: ${fails} of 3` : 'PASS: all 3 rows');
process.exit(fails ? 1 : 0);
