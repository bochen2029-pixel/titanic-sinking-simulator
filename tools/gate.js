// The gate: every suite with one command, one verdict line each. Run it before a commit.
//
//   node tools/gate.js               every suite: the headless ones side by side, then the browser ones: those on real time
//                                    alone and in turn, those on the page's virtual clock two at a time (D83)
//   node tools/gate.js --quick       the fast headless ones and the dist check (about a minute)
//   node tools/gate.js --no-browser  everything but the browser suites
//   node tools/gate.js --sweeps      also the three 200-night sweeps (long: about half an hour, three side by side)
//   node tools/gate.js --release     also the release suites: the User Guide's check (tools/guide_check.js)
//   node tools/gate.js --only a,b    only the suites named (the names are the first column; --list prints them)
//   node tools/gate.js --write       when the run is green, copy the fresh tables over the tracked ones in out/
//   node tools/gate.js --jobs N      how many headless suites run side by side (default 4)
//   node tools/gate.js --browser-jobs N   how many browser suites on the page's virtual clock run side by side (default 2,
//                                    D83; 1: every browser suite alone, as before it). One on real time always runs alone
//   node tools/gate.js --pair-check  the browser suites on the virtual clock run alone, then side by side, and each paired
//                                    run's output is held to its lone one line for line, its volatile lines aside (D83)
//   node tools/gate.js --deadline-scale N   every suite's deadline times N (G16: tools/gate_deadline.js)
//
// A verdict is PASS, FAIL (the suite's own verdict, or it could not run) or STALE: the suite passes, but a table it
// prints or writes is no longer the one tracked in out/. A stale table fails the gate, because a commit should carry the
// tables its code produces: look at what moved, and run again with --write if it was meant to move.
//
// Nothing tracked is written without --write. Each suite's output goes to out/gate/<name>.txt, and the tools that write
// a table write it under out/gate/ as well (TITANIC_OUT, tools/outdir.js). The references a suite compares against
// (out/seams_reference.json, out/headway_reference.json) are never touched here: they are frozen on purpose, by hand.
'use strict';
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { deadlineMin, keep } = require('./gate_deadline');

const root = path.join(__dirname, '..');
const outDir = path.join(root, 'out');
const gateDir = path.join(outDir, 'gate');
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };

// name; the tool and its arguments; table: the tracked file its printed output is; files: tracked files it writes;
// quick: part of --quick; browser: drives headless Edge or Chrome, and runs alone unless virtual; virtual: a browser
// suite on the page's virtual clock (QC C-3), so what it sees is the same however busy the machine, and it may run beside
// another such suite (D83; mark one only once --pair-check holds its paired output to its lone one); report: a tool with
// no verdict of its own (it passes when it runs and its files are the tracked ones); volatile: lines of a table, or of a
// virtual suite's output, that may differ from run to run (a row it runs on real time)
const SUITES = [
  { name: 'seams', run: ['tools/seams.js'], quick: true },
  { name: 'engine', run: ['tools/engine_tests.js'], quick: true },
  { name: 'clock', run: ['tools/clock_tests.js'], quick: true },     // QC C-3: the page's one clock, no stray wall-clock read
  { name: 'crew', run: ['tools/crew_tests.js'], quick: true },       // the spoken bridge, step 1: the bridge's words, held to the model
  { name: 'minds', run: ['tools/minds_tests.js'], quick: true },     // ask the bridge, stage A: the crew's own words, the fog of the bridge, the fake
  { name: 'minds_part', run: ['tools/minds_part_tests.js'], quick: true },   // its two page parts on a stand-in for the page (a toy DOM, no browser): each path run to its end
  { name: 'voice_part', run: ['tools/voice_part_tests.js'], quick: true },   // the bridge heard: a man's line spoken by this PC's own local voices (a stand-in for the browser's speech)
  // the men's voices by Deepgram, the app's side in plain Node: the key by the system's asynchronous store, one host, the
  // player's own word, every fault, against a Deepgram on this PC (no Electron, no key, no network)
  { name: 'voice_app', run: ['tools/voice_app_tests.js'], quick: true },
  // ask the bridge, the app's side in plain Node: the settings, the key, one host, both adapters against a provider on this
  // PC (no Electron, no key, no network; Claude's rows need the app's runtime packages installed: tools/app_packages.js)
  { name: 'minds_app', run: ['tools/minds_app_tests.js'], quick: true },
  { name: 'astern', run: ['tools/astern_tests.js'], quick: true },
  { name: 'visuals', run: ['tools/visuals_tests.js'], quick: true },
  { name: 'topsides', run: ['tools/topsides_tests.js'], quick: true },
  { name: 'trials', run: ['tools/trials.js'], quick: true, table: 'trials.txt' },
  { name: 'systems', run: ['tools/systems_tests.js'], quick: true },
  { name: 'stairs', run: ['tools/stairs_tests.js'], quick: true, table: 'stairs_tests.txt' },
  { name: 'hull_ends', run: ['tools/hull_ends_tests.js'], quick: true },     // the epoch's C3: her ends from the deck plans, dark
  // G24's remainder (U0, join 19): every call of C.halfBreadth made without the ship's hull, held by caller
  { name: 'g24_callers', run: ['tools/g24_callers_tests.js'] },
  { name: 'rooms', run: ['tools/rooms_tests.js'], quick: true, table: 'rooms_tests.txt', volatile: /^~ / },
  { name: 'rooms_table', run: ['tools/rooms_table_tests.js'], quick: true, table: 'rooms_table_tests.txt' },
  // NH7's vents table (data/vents_1912.json, in R3's form) against the model: places, decks, areas, the after body
  { name: 'vents_table', run: ['tools/vents_table_tests.js'], quick: true, files: ['vents_table_tests.txt'] },
  // NH2: her staterooms and when the water came (core/readers/cabins.js), the 1912 preset's table tracked (about 30 s)
  { name: 'cabins', run: ['tools/cabins_tests.js'], files: ['cabins_1912.txt'] },
  // NH2: the people in her staterooms (data/rooms/occupants_1912.json, the Cave list's first class) against R3's rows and
  // the page's asset, the list's table tracked (seconds)
  { name: 'occupants', run: ['tools/occupants_tests.js'], quick: true, files: ['occupants_1912.txt'] },
  // NH6 stage 1: her rooms as the flooding network (core/readers/roomnet.js), the 1912 preset's table tracked (about 90 s)
  { name: 'roomnet', run: ['tools/roomnet_tests.js'], files: ['roomnet_1912.txt'] },
  // G26: her named places and the walks between them (core/readers/places.js, baked by tools/places_table.js), the table
  // tracked (seconds)
  { name: 'places', run: ['tools/places_tests.js'], quick: true, files: ['places_1912.txt'] },
  { name: 'conserve', run: ['tools/conserve_tests.js'], quick: true },
  { name: 'pocket', run: ['tools/pocket_tests.js'] },     // W6: the bunker of the fire
  // the epoch's stage A3: the observation ledger against the 1912 preset, every row a CHECK (nothing is scored from it)
  { name: 'ledger', run: ['tools/ledger_tests.js'], quick: true, files: ['ledger_1912.txt'] },
  // named apart from its table: the gate logs each suite to out/gate/<name>.txt, which would overwrite the tool's own
  { name: 'wake_scale', run: ['tools/wake_spectrum.js'], quick: true, files: ['wake_spectrum.txt'] },
  { name: 'validate', run: ['tools/validate.js'], report: true, table: 'validate.txt', files: ['validation.json'] },
  { name: 'golden', run: ['tools/golden.js'], report: true, files: ['golden_titanic.json'] },
  { name: 'encounter', run: ['tools/encounter_tests.js'], table: 'encounter_tests.txt', files: ['encounter_whatifs.txt'] },
  { name: 'night', run: ['tools/night_tests.js'], table: 'night_tests.txt', files: ['night_window_1912.txt'] },
  { name: 'girder', run: ['tools/girder_tests.js'] },
  { name: 'strength', run: ['tools/strength_tests.js'], table: 'strength_tests.txt', volatile: /^~ / },
  { name: 'fall', run: ['tools/fall_trials.js'], files: ['fall_trials.txt'] },
  { name: 'night_after', run: ['tools/night_after_tests.js'], files: ['night_after_tests.txt'] },
  { name: 'people', run: ['tools/people_tests.js'] },
  { name: 'reports', run: ['tools/reports_tests.js'] },
  { name: 'world', run: ['tools/world_tests.js'] },
  // NH15 (the living ship, U0): her lights by circuit, a reader neutral to the watch, and the nervous system's RULES
  // held to the plant's own fields and events
  { name: 'circuits', run: ['tools/circuits_tests.js'] },
  { name: 'nerves', run: ['tools/nerves_tests.js'] },
  { name: 'wake', run: ['tools/wake_tests.js'], files: ['wake_tests.txt'] },
  { name: 'export', run: ['tools/export_tests.js'], table: 'export_tests.txt', volatile: /^~ / },
  { name: 'u3_water', run: ['tools/u3_water_tests.js'] },
  { name: 'u3_lights', run: ['tools/u3_lights.js'] },
  { name: 'u3_smoke', run: ['tools/u3_smoke.js'] },
  { name: 'carpathia', run: ['tools/carpathia_tests.js'] },
  // NH3 and NH5 (the mainline): the kept set's bands and the counterfactual gallery. ensemble_tests runs the whole table
  // and writes it, so the gate says STALE when the bands move; gallery_tests writes scratch tables only, and its CHECK
  // holds the tracked tables' `core` to this tree's. The gallery's own table is a sweep (13 to 20 min).
  { name: 'ensemble', run: ['tools/ensemble_tests.js'], files: ['ensemble_1912.json'] },
  { name: 'gallery', run: ['tools/gallery_tests.js'] },
  // the history match's harness (the mainline; a gate row since stage D landed, join 17): it made the kept set, and so
  // the robustness models of D5, NH3 and NH5. About 2 min. It writes only its scratch folder,
  // out/gate/history_match_tests/, which it empties first; its row 5 runs one thread and two, briefly.
  { name: 'history_match', run: ['tools/history_match_tests.js'] },
  { name: 'dist', run: ['tools/build_site.js', '--check'], quick: true },
  // the desktop app (NH13, docs/DESIGN_electron_desktop_client_v3_2026-11-23.md, D5): the package written to release/
  // (untracked; it refuses a stale dist/), then the app's self-test, which opens the app's window: a browser row, alone
  { name: 'package', run: ['tools/package_app.js'] },
  { name: 'app', run: ['tools/app_test.js'], browser: true },
  { name: 'visuals_site', run: ['tools/visuals_site_test.js'], browser: true },
  { name: 'topsides_site', run: ['tools/topsides_site_test.js'], browser: true },
  { name: 'systems_site', run: ['tools/systems_site_test.js'], browser: true, virtual: true },
  // NH15: the nervous-system view in the Systems tab, every node as U0's rules (core/readers/nerves.js) on the page's own
  // sim; on the page's virtual clock, paired since join 18 (--pair-check, 2026-11-23)
  { name: 'nerves_site', run: ['tools/nerves_site_test.js'], browser: true, virtual: true },
  { name: 'night_scene_site', run: ['tools/night_scene_site_test.js'], browser: true },
  // its plunge row prints the audio clock (the sound's own time, on real time, checked nowhere)
  { name: 'sound_site', run: ['tools/sound_site_test.js'], browser: true, virtual: true, volatile: /^(PASS|FAIL) the plunge at her own pace/ },
  { name: 'girder_site', run: ['tools/girder_site_test.js'], browser: true },
  { name: 'boats_site', run: ['tools/boats_site_test.js'], browser: true, virtual: true },
  // its section 3, the reports' hold at 60 times, runs on real time
  { name: 'reports_site', run: ['tools/reports_site_test.js'], browser: true, virtual: true, volatile: /^(PASS|FAIL) a report at 60 times/ },
  { name: 'help_site', run: ['tools/help_site_test.js'], browser: true, virtual: true },
  { name: 'night_site', run: ['tools/night_site_test.js'], browser: true, table: 'night_site_test.txt' },
  { name: 'night_end_site', run: ['tools/night_end_site_test.js'], browser: true, virtual: true },
  // its row 3, the first boat's hold in seconds, runs on real time
  { name: 'director_site', run: ['tools/director_site_test.js'], browser: true, virtual: true, volatile: /^(PASS|FAIL) the hold is her own pace and ends/ },
  // NH3's bands and NH5's gallery in the page (the kept set's tables, out/ensemble_1912.json and out/gallery_1912.json,
  // inlined by the build): their words and bands the tables', only where they apply; on the page's virtual clock, paired since join 18
  { name: 'gallery_site', run: ['tools/gallery_site_test.js'], browser: true, virtual: true },
  // its row of what a frame costs (two pieces against the whole ship) measures real frames, on real time
  { name: 'deep_site', run: ['tools/deep_site_test.js'], browser: true, virtual: true, volatile: /^(PASS|FAIL) what the frame costs with two pieces/ },
  // NH4, the scrubber (site/app.js's kept minutes and TitanicApp.scrub; site/parts/82_scrub.js): back to a kept minute and
  // on to her end, the same to the bit, cut for cut; a new order drops the later ones, a hole or a preset's change by hand
  // the later minutes (G32); on the page's virtual clock, paired since join 21 (--pair-check held its paired output to its
  // lone one; its CHECK rows are volatile: a scrub's time, the minutes kept, the notices the page paces)
  { name: 'scrub_site', run: ['tools/scrub_site_test.js'], browser: true, virtual: true, volatile: /^CHECK / },
  // RC1, a newcomer's first minute: "Start here" and the Run tab's order (Time above the watch), the footer's early access
  // mark and its links, on a desktop and a phone upright; on the page's virtual clock, unpaired until a --pair-check
  { name: 'firstrun_site', run: ['tools/firstrun_site_test.js'], browser: true },
  { name: 'walk_site', run: ['tools/walk_site_test.js'], browser: true },
  // NH2: her rooms in the Damage tab (site/parts/79_cabins.js on core/readers/cabins.js): the lookup, the first wet times
  // against a record of every step, the card's words, the mark, the walk from a room; on the page's virtual clock, paired since join 18. Its first row prints
  // the address the rooms were fetched from, whose port is the run's own: volatile in a paired comparison
  { name: 'cabins_site', run: ['tools/cabins_site_test.js'], browser: true, virtual: true, volatile: /^(PASS|FAIL) the Damage tab gains her rooms/ },
// QC B-4: a watch handed over at the break's onset (handover=onset): Bo's words, the forecast, the fall from the onset to the bed
{ name: 'onset_site', run: ['tools/onset_site_test.js'], browser: true },
// QC C-4 step 3: the parts' claims, one rule per key (the marks, X-ray, the columns, the materials), and the holds' owners (C-7)
{ name: 'claims_site', run: ['tools/claims_site_test.js'], browser: true },
// NH1: the observation ledger in the Evidence tab, every figure the tool's table's (out/ledger_1912.txt); on the page's
// virtual clock, paired since join 18
{ name: 'evidence_site', run: ['tools/evidence_site_test.js'], browser: true, virtual: true },
// the spoken bridge, step 1: the order line typed against the clicked night, on the page's virtual clock, paired since
// join 18 (D83: beside another; --pair-check held its paired output to its lone one)
{ name: 'crew_site', run: ['tools/crew_site_test.js'], browser: true, virtual: true },
// G27: the damage brush on a watch, on the page's virtual clock, paired since join 21 (D83: beside another; --pair-check
// held its paired output to its lone one)
{ name: 'brush', run: ['tools/brush_site_test.js'], browser: true, virtual: true },
// ask the bridge, stage A: the crew's own words in the page with the fake transport, on the page's virtual clock. Marked
// virtual (D83: beside another) only once --pair-check holds its paired output to its lone one
{ name: 'minds_site', run: ['tools/minds_site_test.js'], browser: true },
// the bridge heard: the voice part in the page with a stand-in for the app's object (this browser's own local voices, a
// WAV decoded by the browser's own Web Audio; the suite makes no sound). Its pages are on the virtual clock; two rows wait
// on the audio's own clock, which is real: on real time in the gate until --pair-check has held it beside another
{ name: 'voice_site', run: ['tools/voice_site_test.js'], browser: true },
  { name: 'wake_site', run: ['tools/wake_site_test.js'], browser: true },
  // the stage's layout at six sizes (QC C-4, D78): its faults are CHECK rows until C-4's step 2, its table tracked
  { name: 'layout_site', run: ['tools/layout_site_test.js'], browser: true, files: ['layout_site_test.txt'] },
  // a release suite: chosen only with --release (or by name with --only). The guide goes stale on purpose with any change
  // to the page until it is rebuilt, so its check is for a push or a deploy, not for every commit
  { name: 'guide', run: ['tools/guide_check.js'], browser: true, release: true },
  { name: 'sweep', run: ['tools/night_sweep.js', '200', '1', 'hard'], sweep: true, report: true, files: ['night_sweep.txt'], volatile: /^\(\d+ s\)$/ },
  { name: 'sweep_early', run: ['tools/night_sweep.js', '200', '1', 'early'], sweep: true, report: true, files: ['night_sweep_early.txt'], volatile: /^\(\d+ s\)$/ },
  { name: 'sweep_1912', run: ['tools/night_sweep.js', '200', '1', 'night1912'], sweep: true, report: true, files: ['night_sweep_night1912.txt'], volatile: /^\(\d+ s\)$/ },
  // NH5: the gallery's own table (--sweeps only), so the gate can say STALE when its cards move
  { name: 'gallery_table', run: ['tools/gallery.js'], sweep: true, report: true, files: ['gallery_1912.json'] },
  // B4's gate 3 (B1+B2): the joint from the onset across the kept set (--sweeps only, about 5 min); strength_tests'
  // section 10 reads the table and says whether it is of this tree's core
  { name: 'joint_table', run: ['tools/joint_kept.js'], sweep: true, report: true, files: ['joint_kept_1912.json'] },
];
// for tools/gate_deadline_tests.js only (G16): a suite that never ends, with a deadline of 6 s; one that passes; one that
// passes with a table that is not tracked, so STALE. Their times are kept apart from the real suites' (durFile, below)
if (flag('--g16-fixtures')) SUITES.push({ name: 'g16_hang', run: ['tools/fixtures/g16_hang_suite.js'], deadlineMin: 0.1 }, { name: 'g16_pass', run: ['tools/fixtures/g16_pass_suite.js'] }, { name: 'g16_stale', run: ['tools/fixtures/g16_pass_suite.js'], table: 'g16_no_such_table.txt' });
if (flag('--g16-fixtures') && flag('--write')) { console.error('--g16-fixtures is for tools/gate_deadline_tests.js, never with --write'); process.exit(2); }
// for tools/gate_pairs_tests.js only (D83): stand-ins for browser suites that start no browser, three on the virtual
// clock, one whose output says whether another ran beside it (so its paired output differs from its lone one), and one
// on real time. Their times are kept apart from the real suites' (durFile, below)
const D83_FIX = 'tools/fixtures/d83_suite.js';
if (flag('--d83-fixtures')) SUITES.push(
  { name: 'd83_v1', run: [D83_FIX, 'v1'], browser: true, virtual: true, volatile: /^~ / },
  { name: 'd83_v2', run: [D83_FIX, 'v2'], browser: true, virtual: true, volatile: /^~ / },
  { name: 'd83_v3', run: [D83_FIX, 'v3'], browser: true, virtual: true, volatile: /^~ / },
  { name: 'd83_vary', run: [D83_FIX, 'vary', 'vary'], browser: true, virtual: true, volatile: /^~ / },
  { name: 'd83_rt', run: [D83_FIX, 'rt'], browser: true, volatile: /^~ / });
if (flag('--d83-fixtures') && flag('--write')) { console.error('--d83-fixtures is for tools/gate_pairs_tests.js, never with --write'); process.exit(2); }

if (flag('--list')) { for (const s of SUITES) console.log(s.name.padEnd(18) + s.run.join(' ') + (s.browser ? (s.virtual ? '   (browser, virtual clock)' : '   (browser)') : '') + (s.sweep ? '   (--sweeps)' : '') + (s.release ? '   (--release)' : '')); process.exit(0); }

const only = opt('--only') ? opt('--only').split(',').map(s => s.trim()).filter(Boolean) : null;
if (only) for (const n of only) if (!SUITES.some(s => s.name === n)) { console.error('no such suite: ' + n + ' (node tools/gate.js --list)'); process.exit(2); }
const chosen = SUITES.filter(s => only ? only.includes(s.name)
  : s.release ? (flag('--release') && !flag('--no-browser'))
  : (s.sweep ? flag('--sweeps') : (flag('--quick') ? !!s.quick : !(s.browser && flag('--no-browser')))));
const JOBS = Math.max(1, +(opt('--jobs') || 4));
// D83 (Bo, through the coordinator, 11-21): the browser suites on the page's virtual clock two at a time, as the wake's
// share trial ran them (all 12 paired runs printed their lone output line for line, in about 25 % less time); one on
// real time alone, night_site (the real-time canary) among them
const BJOBS = Math.max(1, +(opt('--browser-jobs') || 2));
const PAIR_CHECK = flag('--pair-check');
const WRITE = flag('--write');

fs.mkdirSync(gateDir, { recursive: true });
const secs = (ms) => { const s = Math.round(ms / 1000); return s < 100 ? s + ' s' : Math.floor(s / 60) + ' min ' + String(s % 60).padStart(2, '0') + ' s'; };
const lf = (s) => s.replace(/\r\n/g, '\n');

// Each suite's deadline (BACKLOG G16; a browser that stopped answering once held reports_site, and the queue, for 91
// minutes on 11-18): three times the longest of its last five PASS times, at least 10 minutes; with none kept yet, 30
// minutes, a sweep 120 (tools/gate_deadline.js). The times are kept in out/gate/durations.json (untracked), the last five
// of each suite, only from a PASS verdict (not STALE, FAIL or TIMEOUT); the test fixtures keep theirs in
// g16_durations.json and d83_durations.json. s.deadlineMin overrides; --deadline-scale multiplies. On expiry only that
// suite's own process tree is killed (its browser with it), it fails as TIMEOUT, and the gate goes on.
const durFile = path.join(gateDir, flag('--g16-fixtures') ? 'g16_durations.json' : (flag('--d83-fixtures') ? 'd83_durations.json' : 'durations.json'));
const durations = (() => { try { return JSON.parse(fs.readFileSync(durFile, 'utf8')); } catch (e) { return {}; } })();
const deadlineScale = Number(opt('--deadline-scale')) || 1;
const deadlineMs = (s) => 60000 * deadlineMin(s, durations, deadlineScale);
const killTree = (child) => { try { if (process.platform === 'win32') spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' }); else child.kill('SIGKILL'); } catch (e) { /* gone already */ } };

// tag 'alone': --pair-check's lone run, logged to out/gate/<name>.alone.txt beside the paired run's <name>.txt
function runSuite(s, tag) {
  return new Promise((resolve) => {
    const t0 = Date.now(), base = s.name + (tag === 'alone' ? '.alone' : ''), log = path.join(gateDir, base + '.txt'), chunks = [];
    const child = spawn(process.execPath, s.run, { cwd: root, env: Object.assign({}, process.env, { TITANIC_OUT: gateDir }), stdio: ['ignore', 'pipe', 'pipe'] });
    const limit = deadlineMs(s); let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; killTree(child); }, limit);
    let err = '';
    child.stdout.on('data', (d) => chunks.push(d));
    child.stderr.on('data', (d) => { err += d; });
    child.on('error', (e) => { err += String(e); });
    child.on('close', (code) => {
      clearTimeout(timer);
      const text = lf(Buffer.concat(chunks).toString('utf8'));
      fs.writeFileSync(log, text);
      if (err.trim()) fs.writeFileSync(path.join(gateDir, base + '.err.txt'), lf(err));
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const own = lines.filter(l => /^(PASS|FAIL|STALE):/.test(l)).pop() || '';
      let ok = code === 0, said = own || lines[lines.length - 1] || (err.trim().split('\n').pop() || 'no output');
      if (!s.report && !own) { ok = false; said = 'no verdict line (exit ' + code + '): ' + said; }
      if (timedOut) { ok = false; said = 'TIMEOUT after ' + secs(Date.now() - t0) + ' (its deadline ' + secs(limit) + '): its process tree killed'; }
      resolve({ s, ok, said, ms: Date.now() - t0, text, t0, t1: Date.now() });
    });
  });
}

// D83's check of a suite on the virtual clock: its paired run's output against its lone run's, line for line, its
// volatile lines aside, and how much of its run another suite ran beside it (the union of its overlaps with the others)
function pairCheck(r, lone, paired) {
  const kept = (t) => t.split('\n').filter(l => l.trim() && !(r.s.volatile && r.s.volatile.test(l)));
  const a = kept(lone.text), b = kept(r.text);
  let n = 0, first = -1;
  for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) { n++; if (first < 0) first = i; }
  const segs = paired.filter(o => o !== r).map(o => [Math.max(r.t0, o.t0), Math.min(r.t1, o.t1)]).filter(([x, y]) => y > x).sort((p, q) => p[0] - q[0]);
  let beside = 0, end = -Infinity;
  for (const [x, y] of segs) { if (y > end) { beside += y - Math.max(x, end); end = y; } }
  const share = r.t1 > r.t0 ? beside / (r.t1 - r.t0) : 0, aside = r.text.split('\n').filter(l => l.trim()).length - b.length;
  const head = 'paired (beside another for ' + Math.round(100 * share) + ' % of its run): ';
  if (!lone.ok) { r.ok = false; r.said = head + 'not compared, its lone run failed'; }
  else if (!r.ok) r.said = head + r.said;
  else if (n) { r.ok = false; r.said = head + 'its output differs from its lone one in ' + n + ' line(s), the first: ' + String(b[first] === undefined ? '(none)' : b[first]).trim().slice(0, 160); }
  else if (!share) { r.ok = false; r.said = head + 'it never ran beside another, so nothing was shown'; }
  else r.said = head + 'its output is its lone one, line for line (' + b.length + ' lines' + (aside ? ', ' + aside + ' volatile aside' : '') + '); ' + r.said;
}

// the fresh tables against the tracked ones: [[tracked name, fresh text, tracked text or null, lines that differ]]
function compare(res) {
  const s = res.s, out = [];
  const diff = (name, fresh) => {
    const p = path.join(outDir, name), have = fs.existsSync(p) ? lf(fs.readFileSync(p, 'utf8')) : null;
    const keep = (t) => t.split('\n').filter(l => !(s.volatile && s.volatile.test(l)));
    let n = 0;
    if (have === null) n = -1;
    else if (have !== fresh) { const a = keep(have), b = keep(fresh); for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) n++; }
    out.push({ name, fresh, n });
  };
  if (s.table) diff(s.table, res.text);
  for (const f of s.files || []) { const p = path.join(gateDir, f); if (fs.existsSync(p)) diff(f, lf(fs.readFileSync(p, 'utf8'))); else out.push({ name: f, fresh: null, n: -2 }); }
  return out;
}

async function pool(list, n, done, tag) {
  const queue = list.slice(), running = new Set();
  await new Promise((resolve) => {
    const next = () => {
      if (!queue.length && !running.size) return resolve();
      while (queue.length && running.size < n) {
        const s = queue.shift(), p = runSuite(s, tag).then((r) => { running.delete(p); done(r); next(); });
        running.add(p);
      }
    };
    next();
  });
}

(async () => {
  const t0 = Date.now(), results = [];
  const headless = chosen.filter(s => !s.browser && !s.sweep), browser = chosen.filter(s => s.browser), sweeps = chosen.filter(s => s.sweep);
  // D83: the browser suites on real time alone and in turn, then those on the virtual clock BJOBS at a time
  const alone = browser.filter(s => !s.virtual), virt = browser.filter(s => s.virtual), PJ = PAIR_CHECK ? Math.max(2, BJOBS) : BJOBS;
  if (PAIR_CHECK && virt.length < 2) { console.error('--pair-check needs two or more browser suites on the virtual clock (--list marks them)'); process.exit(2); }
  const side = PJ > 1 && virt.length > 1;
  const bmsg = !browser.length ? '' : (!side ? ', the browser ones alone and in turn'
    : ', the browser ones on real time alone and in turn (' + alone.length + '), then those on the page\'s virtual clock ' + Math.min(PJ, virt.length) + ' side by side (' + virt.length + ')'
      + (PAIR_CHECK ? ', each first alone and then paired, its paired output held to its lone one' : ''));
  console.log('gate: ' + chosen.length + ' suite(s)' + (headless.length > 1 ? ', the headless ones ' + Math.min(JOBS, headless.length) + ' side by side' : '') + bmsg + (sweeps.length ? ', then ' + sweeps.length + ' sweep(s) side by side' : '') + (WRITE ? '; fresh tables will be written to out/' : ''));
  const done = (r) => {
    const cmp = r.ok ? compare(r) : [];
    r.stale = cmp.filter(c => c.n !== 0);
    r.cmp = cmp;
    const verdict = !r.ok ? 'FAIL ' : (r.stale.length ? 'STALE' : 'PASS ');
    // its time is kept only from a PASS (G16): the next deadline is three times the longest of its last five, at least 10 minutes
    if (verdict === 'PASS ') { keep(durations, r.s.name, r.ms); try { fs.writeFileSync(durFile, JSON.stringify(durations, null, 1)); } catch (e) { /* not kept */ } }
    const note = r.stale.map(c => 'out/' + c.name + (c.n === -1 ? ' is not there' : (c.n === -2 ? ' was not written' : (c.n === 0 ? ' differs only in volatile lines' : ' differs in ' + c.n + ' line(s)')))).join('; ');
    console.log(verdict + ' ' + r.s.name.padEnd(17) + secs(r.ms).padStart(13) + '   ' + r.said + (note ? '   | ' + note : ''));
    results.push(r);
  };
  await pool(headless, JOBS, done);
  // dist/ must be the build of the sources before the browser suites say anything about them
  const distStale = results.find(r => r.s.name === 'dist' && !r.ok);
  if (browser.length && distStale) console.log('      the browser suites test dist/, which is stale: they run anyway, on the old build');
  for (const s of alone) done(await runSuite(s));
  if (PAIR_CHECK) {
    const lone = new Map(), paired = [];
    for (const s of virt) { const r = await runSuite(s, 'alone'); r.said = 'alone: ' + r.said; lone.set(s, r); done(r); }
    await pool(virt, PJ, (r) => paired.push(r));
    for (const s of virt) { const r = paired.find(p => p.s === s); pairCheck(r, lone.get(s), paired); done(r); }
  } else await pool(virt, PJ, done);
  await pool(sweeps, 3, done);

  const failed = results.filter(r => !r.ok), stale = results.filter(r => r.ok && r.stale.length);
  let wrote = [];
  if (WRITE && !failed.length) {
    for (const r of results) for (const c of r.cmp) if (c.fresh !== null && c.n !== 0) { fs.writeFileSync(path.join(outDir, c.name), c.fresh); wrote.push('out/' + c.name); }
  }
  const good = !failed.length && (!stale.length || (WRITE && wrote.length));
  const why = [failed.length ? failed.map(r => r.s.name).join(', ') + ' failed' : '', stale.length ? (WRITE && !failed.length ? 'written: ' + wrote.join(', ') : stale.map(r => r.s.name).join(', ') + ' stale') : ''].filter(Boolean).join('; ');
  console.log('\nGATE: ' + (good ? 'PASS' : 'FAIL') + ' (' + (results.length - failed.length - (WRITE && !failed.length ? 0 : stale.length)) + ' of ' + results.length + ' good' + (why ? '; ' + why : '') + ') in ' + secs(Date.now() - t0));
  if (stale.length && !WRITE) console.log('  a stale table: compare out/gate/<file> with out/<file>; if the change is meant, run the gate again with --write and say in the commit why it moved');
  if (WRITE && failed.length) console.log('  nothing was written: a suite failed');
  process.exit(good ? 0 : 1);
})();
