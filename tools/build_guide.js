// build_guide.js: the User Guide as a build product. The chapters are Markdown (docs/guide/src/*.md, in the order of
// their file names); this script turns them into one HTML file with its own small converter, fills the GENERATED
// BLOCKS and facts from the repository itself, and prints the PDF with headless Edge or Chrome. Node only, nothing to
// install.
//   node tools/build_guide.js           the HTML and the PDF (docs/guide/<file>.html and .pdf, named in src/guide.json)
//   node tools/build_guide.js --html    the HTML only, with no browser (its contents page then has no page numbers)
//
// The dialect (docs/guide/README.md has it in short):
//   front matter      ---\ncontents: a line for the contents page\n---  at the top of a chapter
//   # Title           the chapter's title (one per file); ## and ### are its sections and sub-sections
//   :::lede ... :::   the chapter's opening paragraph        :::note Title / :::tip Title / :::warn Title ... :::  a box
//   :::gen name args  a generated block (see GEN below); the lines inside, if any, are its typed input; closed by :::
//   **strong** *em* `code` [text](url)    {{Control}} a control by its label on the screen (a chip; checked)
//   {{:Screen text}}  a heading or readout by its words on the screen (checked)    [[A]] a key cap
//   @@fact@@          a fact pulled from the repository at build time (see FACTS below)
//   - item / 1. step  lists (numbered lists are drawn as steps);  | a | b | tables (a line "Table: caption" may follow)
//   ![alt](img/x.jpg "Caption"){.side}   a figure; .side floats it right, .half centres it narrower, .stage a little
//                     narrower than the page, .phone a phone's width; several image lines in one paragraph make a row
//   @@ch.name@@       the number of the chapter in src/NN-name.md
// Every input the build reads is hashed into the HTML (a JSON block at its end), with the SHA-256 of the PDF printed
// from it and the files it looked for and did not find (the Carpathia search's result, CARPATHIA, which may be absent):
// tools/guide_check.js uses them to tell a stale guide from a current one. What the page itself showed and
// held (its sentences, the readers' accounts of the 1912 night, the hull gauge's curve) comes from docs/guide/shots.json,
// which tools/guide_shots.js writes as it takes the pictures.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const { spawn, execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const GUIDE = path.join(root, 'docs', 'guide');
const rel = (p) => path.relative(root, p).replace(/\\/g, '/');
const abs = (r) => path.join(root, r);
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

// ------------------------------------------------------------------ inputs: every file the build reads, hashed
const inputs = new Map();                         // repo-relative path -> sha256
function readBuf(r) { const b = fs.readFileSync(abs(r)); inputs.set(r, sha(b)); return b; }
function read(r) { return readBuf(r).toString('utf8').replace(/\r\n/g, '\n'); }
function need(r) { if (!fs.existsSync(abs(r))) throw new Error('missing ' + r + (/^out\//.test(r) ? ' (the test that writes it has not been run)' : '')); }
function req(r, deps) { for (const d of [r].concat(deps || [])) readBuf(d); return require(abs(r)); }

class GuideError extends Error {}
const fail = (where, msg) => { throw new GuideError((where ? where + ': ' : '') + msg); };

// ------------------------------------------------------------------ what the repository holds (each read once)
const once = (f) => { let v, done = false; return () => { if (!done) { v = f(); done = true; } return v; }; };
const conf = once(() => JSON.parse(read('docs/guide/src/guide.json')));
const core = once(() => req('core/core.js'));
const scen = once(() => req('core/scenarios.js', ['core/core.js']));
const plant = once(() => req('core/systems.js', ['core/core.js']).PLANT);
const motion = once(() => req('core/motion.js', ['core/core.js']));
const appSrc = once(() => read('site/app.js'));
const page = once(() => read('site/index.template.html'));
const validation = once(() => { need('out/validation.json'); return JSON.parse(read('out/validation.json')); });
// NH3 and NH5 (join 16): the kept set's table (tools/ensemble.js) and the counterfactual gallery's (tools/gallery.js), as
// the page inlines them; every figure the guide quotes from them is read here at the build
const ensemble = once(() => { need('out/ensemble_1912.json'); return JSON.parse(read('out/ensemble_1912.json')); });
const galleryTable = once(() => { need('out/gallery_1912.json'); return JSON.parse(read('out/gallery_1912.json')); });
// the observation ledger against the 1912 damage (out/ledger_1912.txt, tools/ledger_tests.js's table; the calibration
// epoch's stage A3): every row a CHECK, nothing scored from it. The guide quotes how many rows it has, how many lie in
// their band, and the three largest misses the epoch names (E-1): her list's change of side, Weeks and Halpern's tonnage
// and Poingdestre's mark
const ledger = once(() => {
  const f = 'out/ledger_1912.txt'; need(f);
  const t = read(f), rows = t.split('\nTHE HELD-OUT ROWS')[0].split('\n').filter(l => /^(in|out)\s+CHECK\s/.test(l));
  const head = /\((\d+) rows;/.exec(t);
  if (!head || +head[1] !== rows.length) fail(f, `its header's count and its rows disagree (${head ? head[1] : 'no count'} against ${rows.length})`);
  const row = (id, re) => { const l = rows.find(x => new RegExp('^\\w+\\s+CHECK ' + id + '\\s').test(x)), m = l && re.exec(l); if (!m) fail(f, `its row ${id} was not read`); return m; };
  const side = row('side_change', /T ([\d.]+) to ([\d.]+) min\s+T ([\d.]+)/);
  const ton = row('weeks_halpern_tonnage', /(\d+) t, T ([\d.]+)\s+(\d+) at T/);
  const poi = row('poingdestre_quarters', /([+-][\d.]+) min\s*$/);
  return {
    rows: String(rows.length), inBand: String(rows.filter(l => /^in\s/.test(l)).length),
    sideChange: String(Math.round(+side[3])), sideChangeFrom: String(Math.round(+side[1])), sideChangeTo: String(Math.round(+side[2])),
    tonnageT: String(Math.round(+ton[2])), tonnageRecord: int(+ton[1]), tonnageShort: Math.round(100 * (ton[1] - ton[3]) / ton[1]) + ' %',
    poingdestreLate: String(Math.round(+poi[1])),
  };
});
// the fall's trials (out/fall_trials.txt): trials 6 to 10, each piece let go wholly under and flooded with nothing tuned,
// against the survey's places (trial 7's line names them); and trial 13's joint as built, its release after the onset
const trials = once(() => {
  const f = 'out/fall_trials.txt'; need(f);
  const t = read(f), place = /the bow lands (\d+) m from the point under the break and the stern (\d+) m/.exec(t);
  const block = /\nTRIALS 6 TO 10[^\n]*\n([\s\S]*?)\n\n/.exec(t), joint = /\n\s+as built, Lh 20 m\s+[\d.]+\s+\+\s*[\d.]+s\s+\+\s*([\d.]+)s/.exec(t);
  if (!place || !block || !joint) fail(f, 'its trials 6 to 10, trial 7\'s places or trial 13\'s joint as built were not read');
  const at = (piece) => block[1].split('\n').map(l => new RegExp('^\\s+' + piece + '\\s.*?\\s(\\d+) m \\(along').exec(l)).filter(Boolean).map(m => +m[1]);
  const bow = at('bow'), stern = at('stern'), B = +place[1], S = +place[2];
  if (!bow.length || !stern.length) fail(f, 'its trials 6 to 10 have no bow or no stern');
  // where the bows land against the survey's bow, said the way it falls (lo, hi: metres beyond it, negative if short):
  // the bows land beyond it, which "short" (bowShortMin, bowShortMax) printed as "-176 to -64 m short" in 1.10 and 1.11
  const lo = Math.min(...bow) - B, hi = Math.max(...bow) - B;
  return {
    bowShortMin: String(B - Math.max(...bow)), bowShortMax: String(B - Math.min(...bow)),
    bowAgainstPlace: lo >= 0 ? `${lo} to ${hi} m beyond its place` : hi <= 0 ? `${-hi} to ${-lo} m short of its place`
      : `between ${-lo} m short of its place and ${hi} m beyond it`,
    sternWithin: String(Math.max(...stern.map(d => Math.abs(S - d)))), jointLetGo: String(Math.round(+joint[1])),
  };
});
// the site build's name and version, read but not counted among the inputs: its time and commit change with every build
// of the same sources. The pictures carry the build they were taken from (shots.json, an input), and guide_check.js
// compares it with dist/ as it is
const site = once(() => { need('dist/version.json'); return JSON.parse(fs.readFileSync(abs('dist/version.json'), 'utf8')); });
const people = once(() => req('core/readers/people.js', ['core/core.js', 'core/motion.js', 'core/night.js']));
const world = once(() => req('core/readers/world.js', ['core/core.js', 'core/night.js', 'core/systems.js']));
const girder = once(() => req('core/readers/girder.js', ['core/core.js']));
const shots = once(() => {
  if (!fs.existsSync(abs('docs/guide/shots.json'))) fail('docs/guide/shots.json', 'missing: run node tools/guide_shots.js first');
  return JSON.parse(read('docs/guide/shots.json'));
});
// the watch's cards and the order of the scenario cards, as site/app.js declares them
const appCards = once(() => {
  const src = appSrc(), m1 = /const SCEN_ORDER = (\[[^\]]*\]);/.exec(src), m2 = /const WATCH_CARDS = (\{[\s\S]*?\n {2}\});/.exec(src);
  if (!m1 || !m2) fail('site/app.js', 'SCEN_ORDER or WATCH_CARDS is no longer where tools/build_guide.js looks for it (appCards)');
  return { order: vm.runInNewContext(m1[1]), watch: vm.runInNewContext('(' + m2[1] + ')') };
});
const repo = once(() => {
  let commit = 'nogit', changed = [];
  try {
    commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    // the guide's own files, and dist/ (a build product the guide names by its app's hash), are not "local changes"
    const own = /^(docs\/guide\/|dist\/|tools\/(build_guide|guide_shots|guide_check)\.js$)/;
    changed = execFileSync('git', ['status', '--porcelain'], { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().split('\n')
      .filter(l => l.trim() && !l.startsWith('??')).map(l => l.slice(3).trim()).filter(p => !own.test(p));
  } catch (e) { /* no git */ }
  return { commit, changed };
});

// ------------------------------------------------------------------ formatting, as the page does it (site/app.js)
const hm = (sec) => { const m = Math.round(sec / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`; };
const clockAt = (min) => { let m = 23 * 60 + 40 + min; m = ((m % 1440) + 1440) % 1440; let h = Math.floor(m / 60); const mm = Math.round(m % 60); const ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return `${h}:${String(mm).padStart(2, '0')} ${ap}`; };
const outcome = (r) => (!r ? '–' : r.foundered ? `Founders in ${hm(r.founderMin * 60)}` : `Floats, ${Math.abs(r.trim).toFixed(1)}° by the ${r.trim >= 0 ? 'head' : 'stern'}`);
const int = (n) => Math.round(n).toLocaleString('en-US');
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const longDate = (iso) => { const [y, mo, d] = iso.split('-').map(Number); return `${d} ${MONTHS[mo - 1]} ${y}`; };
const cell = (s) => String(s).replace(/\|/g, '\\|');
const mdTable = (head, rows, align) => [
  '| ' + head.map(cell).join(' | ') + ' |',
  '|' + head.map((h, i) => (align && align[i] === 'r' ? '---:' : '---')).join('|') + '|',
  ...rows.map(r => '| ' + r.map(cell).join(' | ') + ' |')].join('\n');
// a block's typed rows: "key | a | b", blank lines and lines starting with # skipped
const typedRows = (body) => body.filter(l => l.trim() && !/^\s*#/.test(l)).map(l => l.split('|').map(s => s.trim()));

// ------------------------------------------------------------------ the sources of the generated blocks
// the 1912 night's miss window (tools/night_tests.js writes it)
const windowRows = once(() => {
  need('out/night_window_1912.txt');
  const rows = [];
  for (const l of read('out/night_window_1912.txt').split('\n')) {
    const m = /order\s+([\d.]+) s after the bells \(ice (\d+) m ahead\)\s+(.*\S)\s*$/.exec(l);
    if (m) rows.push({ t: m[1], ahead: m[2], text: m[3] });
  }
  if (rows.length < 3) fail('out/night_window_1912.txt', 'no rows found');
  return rows;
});
// the three 200-night sweeps (tools/night_sweep.js): the share of nights each outcome takes, by the moment of the order
const SWEEPS = [['early', 'out/night_sweep_early.txt'], ['hard', 'out/night_sweep.txt'], ['night1912', 'out/night_sweep_night1912.txt']];
const sweeps = once(() => {
  const out = {};
  for (const [level, f] of SWEEPS) {
    need(f);
    const txt = read(f), n = /Of (\d+) nights/.exec(txt);
    const rows = {};
    for (const l of txt.split('\n')) {
      const m = /^\s+(no order|order ([\d.]+) s after the bells)\s+clear\s+(\d+) %\s+dented only\s+(\d+) %\s+seams opened\s+(\d+) %\s+stem into the ice\s+(\d+) %/.exec(l);
      if (m) rows[m[2] === undefined ? 'none' : m[2]] = { clear: +m[3], dented: +m[4], seams: +m[5], stem: +m[6] };
    }
    if (!n || !rows.none) fail(f, 'its tally ("Of N nights ...") was not found');
    out[level] = { nights: +n[1], rows };
  }
  return out;
});
// the Systems tab's chain, as the page lists it: [key, label]
const chainItems = once(() => {
  const items = [...page().matchAll(/<li data-k="(\w+)"><i><\/i><b>([^<]+)<\/b>/g)].map(m => [m[1], m[2]]);
  if (items.length < 5) fail('site/index.template.html', 'the Systems chain (#sysChain) was not found');
  return items;
});
// the engine-order telegraph's buttons, in the page's order: [order, label]
const telegraphButtons = once(() => {
  const m = /<div class="seg wide"[^>]*id="telegraph">([\s\S]*?)<\/div>/.exec(page());
  if (!m) fail('site/index.template.html', 'the telegraph (#telegraph) was not found');
  return [...m[1].matchAll(/data-order="([^"]+)"[^>]*>([^<]+)</g)].map(x => [x[1], x[2]]);
});
// the Commands block of CLAUDE.md: [command, what it does]
const commands = once(() => {
  const m = /## Commands\s*\n```[^\n]*\n([\s\S]*?)\n```/.exec(read('CLAUDE.md'));
  if (!m) fail('CLAUDE.md', 'its "## Commands" block was not found');
  return m[1].split('\n').filter(l => l.trim()).map(l => { const i = l.search(/\s#\s/); return i < 0 ? [l.trim(), ''] : [l.slice(0, i).trim(), l.slice(i).replace(/^\s#\s*/, '').trim()]; });
});

// ------------------------------------------------------------------ the readers of the watch, as the page showed them
// a fact of shots.json, or a clear failure: the pictures and readings must be retaken
function sfact(k, where) {
  const S = shots().facts || {};
  if (S[k] === undefined) fail(where || 'shots.json', `no reading "${k}": run node tools/guide_shots.js`);
  return S[k];
}
const clockSec = (min) => { const s = Math.round((23 * 60 + 40 + min) * 60); const d = ((s % 86400) + 86400) % 86400; let h = Math.floor(d / 3600); const m = Math.floor(d % 3600 / 60), ss = d % 60; const ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')} ${ap}`; };
// the boats on the 1912 orders (the page, at her end) beside the launch record (core/readers/people.js, BOATS[].rec)
const boatsCompared = once(() => {
  const P = sfact('people'), rec = people().BOATS, byId = new Map(P.list.map(b => [b.id, b]));
  const rows = rec.map(d => ({ d, m: byId.get(d.id) }));
  const timed = rows.filter(r => r.d.rec && r.d.rec.T !== null && r.d.rec.T !== undefined);
  const within = timed.filter(r => r.m && r.m.away !== null && Math.abs(r.m.away - r.d.rec.T) <= 10).length;
  const recN = timed.reduce((a, r) => a + r.d.rec.n, 0), modelN = timed.reduce((a, r) => a + (r.m && r.m.away !== null ? r.m.n : 0), 0);
  const outside = timed.filter(r => !(r.m && r.m.away !== null && Math.abs(r.m.away - r.d.rec.T) <= 10)).map(r => r.d.id + (r.m && r.m.away !== null ? ' (' + (r.m.away > r.d.rec.T ? '+' : '') + Math.round(r.m.away - r.d.rec.T) + ')' : ''));
  return { P, rows, timed: timed.length, within, recN, modelN, outside, places: people().PLACES };
});
// the hull gauge's readings on the 1912 damage (the page's own model, read every minute, and on every step from 2:10 am):
// a moment is the first step at or past it, as tools/girder_tests.js takes them (its RECORD)
const gauge = once(() => {
  const C = sfact('gaugeCurve'), G = girder(), low = G.CAP.low / 1e9, high = G.CAP.high / 1e9;
  if (!Array.isArray(C) || C.length < 20) fail('shots.json', 'the gauge curve is too short');
  const cross = (k, v) => { for (let i = 1; i < C.length; i++) if (C[i - 1][k] < v && C[i][k] >= v) return C[i]; return null; };
  const entry = cross(2, low), peak = C.reduce((a, s) => (s[2] > a[2] ? s : a), C[0]);
  const atTrim = (deg) => cross(1, deg);
  return { low, high, entry, peak, atTrim, intact: C[0][2], record: G.RECORD };
});

// ------------------------------------------------------------------ the first search for the Carpathia question (W5)
// Its result is two files of the search's own: the best night found (out/carpathia_best.json, written by
// tools/carpathia.js) and the note that reads it (section 0, "The answer"). When both are in the tree every figure is
// pulled from them, and the two are checked against each other. When they are not, the build still succeeds: it says
// so, quotes CARPATHIA_TYPED (typed from the note's v5 of 23 November 2026, G12's evaluation 4 on the landed member C
// with the kept set as its robustness models, each night to its hand-over at the break's onset, and the file beside it,
// as this parser pulls them), and records the missing files as absent, so that tools/guide_check.js calls the guide
// stale once they arrive.
const CARPATHIA = { best: 'out/carpathia_best.json', note: 'docs/research/RESULT_carpathia_search_v5_2026-11-23.md' };
const CARPATHIA_TYPED = {
  best: '161.2', base: '156.5', gain: '4.8', tried: '2,020', models: '79', keeps: 'whole', ends: 'breaks',
  answer: 'Not on this model, nor on any of the 79 models in the kept set\'s band.',
  t1912: '265.1', tCall: '213.2', tNear: '193.9', need1912: '108.7', needCall: '56.7', needNear: '37.5', short: '32.7',
  pumped: '1,581', pumpedWatch: '896', firmHalf: '56', firmAny: '76',
  orders: [[2, 'boiler room 4\'s ash-ejector pump put on boiler room 6'], [4, 'the pumps handed back to the engineers'],
    [28, 'engines: full astern'], [31, 'every free pump that can reach boiler room 6 put on it'],
    [31, 'every free pump that can reach boiler room 4 put on it'], [55, 'draw the fires in every boiler room'], [58, 'engines: stop'],
    [70, 'raise the doors in bulkhead F by hand'], [90, 'the other ballast pump in the reciprocating engine room put on boiler room 3']],
};
const absent = new Set();                           // inputs the build looked for and did not find (recorded, see build())
const carpathia = once(() => {
  const missing = Object.values(CARPATHIA).filter(f => !fs.existsSync(abs(f)));
  if (missing.length) {
    missing.forEach(f => absent.add(f));
    console.log(`  the Carpathia search's result is not in this tree (${missing.join(', ')} absent): its section quotes the figures typed in tools/build_guide.js (CARPATHIA_TYPED)`);
    return Object.assign({ pulled: false }, CARPATHIA_TYPED);
  }
  // the note measured the search's own model. A file remeasured on a later model (tools/carpathia.js --remeasure: the v3
  // search's orders on C, D90, 2026-11-23) keeps the note's model's figures in `was`, and the guide quotes the note's model
  // whole (its targets and shortfall are measured against it) until the search is rerun (the epoch's D5)
  const J0 = JSON.parse(read(CARPATHIA.best)), f = CARPATHIA.note, txt = read(f);
  const J = J0.was ? Object.assign({}, J0, { foundered: J0.was.foundered, minutes: J0.was.minutes, baseline: J0.was.baseline }) : J0;
  const s0 = /\n## 0\. The answer\n([\s\S]*?)\n## 1\. /.exec(txt);
  if (!s0) fail(f, 'its section "0. The answer" was not found');
  const t = s0[1].replace(/\s+/g, ' ');
  const grab = (what, re) => { const m = re.exec(t); if (!m) fail(f, `its sentence on ${what} was not found in section 0`); return m; };
  const ans = grab('the answer', /\*\*(Not on this model[^*]*)\*\*/);
  // since evaluation 4 (G12, D98) a night ends at its hand-over: the break's onset by default ("she breaks", kept whole
  // so much longer), her flag where she founders first ("she founders", kept afloat)
  const gain = grab('the gain', /(afloat|whole) ([\d.]+) minutes longer: she (founders|breaks) ([\d.]+) minutes after the touch against ([\d.]+)/);
  const broke = !!(J0.was ? J0.was.broke : J0.broke);
  if ((gain[3] === 'breaks') !== broke || (gain[1] === 'whole') !== broke) fail(f, `its gain's sentence says she is kept ${gain[1]} and ${gain[3]}, and ${CARPATHIA.best} says the best night ${broke ? 'broke' : 'foundered'}`);
  const tg = grab('the targets', /alongside ([\d.]+) minutes after the touch as the night went, ([\d.]+) had the distress call been made at once, and ([\d.]+) had she also made five miles toward Carpathia[,.] [Ss]o the watch needed ([\d.]+), ([\d.]+) and ([\d.]+) more minutes/);
  const sh = grab('the shortfall', /falls ([\d.]+) minutes short of the nearest of the three/);
  const pu = grab('the tons pumped', /It pumps ([\d,]+) t against the watch's ([\d,]+)/);
  const fi = grab('how firm it is', /holds \(at least half of it\) on (\d+) of (\d+) models with the guesses moved, and helps at all on (\d+)/);
  const best = J.minutes, base = J.baseline && J.baseline.minutes;
  // D5 (D94): the counts are over the models whose own baseline founders in the kept set's band, robust.N of the
  // search's variants; a record before D5 has no robust, and its counts were over every model
  const modelsN = J.robust ? J.robust.N : J.search.variants;
  if (!(J.foundered && isFinite(best) && isFinite(base) && Array.isArray(J.orders) && J.orders.length && J.search)) fail(CARPATHIA.best, 'it is not the best night of tools/carpathia.js as the guide reads it (foundered, minutes, baseline, orders, search)');
  const C = {
    pulled: true, best: best.toFixed(1), base: base.toFixed(1), gain: (best - base).toFixed(1), tried: int(J.search.tried), models: String(modelsN),
    keeps: gain[1], ends: gain[3],
    answer: ans[1].trim(), t1912: tg[1], tCall: tg[2], tNear: tg[3], need1912: tg[4], needCall: tg[5], needNear: tg[6], short: sh[1],
    pumped: pu[1], pumpedWatch: pu[2], firmHalf: fi[1], firmAny: fi[3], orders: J.orders.map(o => [o.T, o.words]),
  };
  // the note's figures against the file's, each at the note's own precision (v2 gave the minutes to one decimal, v3 to two)
  const atNote = (v, x) => x.toFixed((v.split('.')[1] || '').length);
  const odd = [['gain', gain[2], best - base], ['best', gain[4], best], ['base', gain[5], base], ['models', fi[2], modelsN]]
    .filter(([k, v, x]) => atNote(v, x) !== v);
  if (odd.length) fail(f, 'the note and ' + CARPATHIA.best + ' disagree: ' + odd.map(([k, v, x]) => `${k} ${v} in the note, ${atNote(v, x)} in the file`).join('; '));
  const stale = Object.keys(CARPATHIA_TYPED).filter(k => JSON.stringify(CARPATHIA_TYPED[k]) !== JSON.stringify(C[k]));
  console.log(`  the Carpathia search's figures pulled from ${CARPATHIA.best} and ${f}` + (stale.length ? `; CARPATHIA_TYPED (used only without them) differs in ${stale.join(', ')}: bring it up to date` : ''));
  return C;
});

// ------------------------------------------------------------------ FACTS: @@name@@ in the text
function fact(name, where) {
  const S = shots().facts || {}, V = validation(), P = plant();
  const shot = (k, strip) => { if (S[k] === undefined) fail(where, `@@${name}@@: shots.json has no "${k}": run node tools/guide_shots.js`); return strip ? String(S[k]).replace(strip, '') : String(S[k]); };
  const parts = name.split('.');
  switch (parts[0]) {
    case 'edition': return conf().edition;
    case 'date': return longDate(conf().date);
    case 'site': {
      const v = site();
      const map = { version: v.version, app: (v.app || '').replace(/^app\.|\.js$/g, ''), commit: v.builtFromCommit, built: (v.built || '').slice(0, 10) };
      if (map[parts[1]] === undefined) break;
      return map[parts[1]];
    }
    case 'repo': if (parts[1] === 'commit') return repo().commit; break;
    case 'watch': {                                  // sentences read from the page on the 1912 orders (tools/guide_shots.js)
      if (parts[1] === 'bellsRange') { const m = / Range (\d+) m/.exec(shot('bells')); if (m) return m[1]; break; }
      if (parts[1] === 'call') { const m = /"([^"]+)"/.exec(shot('bells')); if (m) return m[1]; break; }
      const map = { forecast: ['forecast', /^Forecast:\s*/], verdict: ['verdict'], bells: ['bells', / Range .*$/], touch: ['touch'], pumps: ['pumpsRow'] };
      if (!map[parts[1]]) break;
      return shot(map[parts[1]][0], map[parts[1]][1]);
    }
    case 'stem': if (parts[1] === 'verdict') return shot('stemVerdict'); if (parts[1] === 'forecast') return shot('stemForecast', /^Forecast:\s*/); break;
    case 'preset': {
      if (parts[1] === 'forecast') return shot('presetForecast', /^Forecast:\s*/);
      if (parts[1] === 'founderMin') return sfact('presetEnd', where).min.toFixed(1);
      if (parts[1] === 'founderClock') return clockAt(sfact('presetEnd', where).min);
      break;
    }
    case 'dome': {                                   // the first grand staircase's dome to give way on the 1912 damage, on the step
      const o = S.dome; if (!o) { shot('dome'); break; }   // it goes (tools/guide_shots.js, the picture dome.jpg)
      if (parts[1] === 'clock') return clockAt(o.min);
      break;
    }
    case 'damage': {                                 // the hole punched in the damage picture: the Damage tab's row for it
      if (parts[1] === 'forecast') return shot('damageForecast', /^Forecast:\s*/);
      const row = S.damageRow; if (!row) { shot('damageRow'); break; }
      const map = { where: `${row[0]}, ${row[1] === 'stbd' ? 'starboard' : row[1]}`, depth: row[2], tpm: row[4] };
      if (map[parts[1]] === undefined) break;
      return map[parts[1]];
    }
    // the readouts at a picture's moment; onset, fall, rest and walk: what the page held at the pictures of where she
    // would break, of her fall, of her pieces at rest and of the walk; presetOnset: the line where she would break on the
    // 1912 damage, as the page shows it at her end (tools/guide_shots.js)
    case 'at0209': case 'at40': case 'at145': case 'gaugeIn': case 'bridgeKnew': case 'onset': case 'presetOnset': case 'fall': case 'rest': case 'walk': {
      const o = S[parts[0]]; if (!o) { shot(parts[0]); break; }
      if (o[parts[1]] === undefined) break;
      return String(o[parts[1]]);
    }
    case 'rudder': {                                 // the rudder's rate and stops (core/motion.js); hardOver: seconds from midships
      const r = motion().SHIP.rudder;
      if (parts[1] === 'rate') return String(r.rate);
      if (parts[1] === 'max') return String(r.max);
      if (parts[1] === 'hardOver') return String(Math.round(r.max / r.rate));
      break;
    }
    case 'pumps1912': {                              // the 1912 preset's own pump schedule (core/scenarios.js): minutes
      const P = scen().PUMPS_1912, z = { br5: 5, br4: 6 }[parts[1]];
      const t = z === undefined ? [] : P.filter(p => p.zone === z).map(p => p.t0 / 60);
      if (t.length) return String(Math.min(...t));
      break;
    }
    case 'e22': {                                    // what the pumps do against the 1912 damage (experiment e22, its results)
      const f = 'docs/research/experiments/results_2026-11-17/e22_pumps_1912.txt'; need(f);
      const txt = read(f), m = {
        asWorked: /The pumps as worked add ([\d.]+) min/.exec(txt),
        everySuction: /every suction at its limit ([\d.]+) min/.exec(txt),
        pumped: /the pumps as worked \(BR5[^)]*\)\s+founders [\d.]+ min\s+pumped\s+(\d+) t/.exec(txt),
      }[parts[1]];
      if (m) return m[1];
      if (parts[1] in { asWorked: 1, everySuction: 1, pumped: 1 }) fail(f, `its line for @@${name}@@ was not found`);
      break;
    }
    case 'area': {                                   // the calibrated opening of the 1912 damage (core/scenarios.js)
      const a = scen().CALIBRATED_AREA;
      if (parts[1] === 'm2') return a.toFixed(2);
      if (parts[1] === 'sqft') return (a * 10.7639).toFixed(1);
      break;
    }
    case 'val': {                                   // val.<case>: the model's outcome; val.titanic.wilding: minutes to 16,000 tons
      const r = V[parts[1]]; if (!r) break;
      if (parts[2] === 'wilding') return String(r.wildingMin);
      if (parts[2] === 'founder') return clockAt(r.founderMin);
      // a floating case's margin (the epoch's stage A4): the lowest top, above the sea, of a bulkhead wet on one side and
      // dry on the other (m), and that bulkhead's letter
      if (parts[2] === 'margin') { if (!r.margin) break; return r.margin.m.toFixed(2); }
      if (parts[2] === 'marginAt') { if (!r.margin) break; return r.margin.bulkhead; }
      // the founder's noise floor (A4): the most one number moved by one unit in its last place moves her foundering (s)
      if (parts[2] === 'noise') { const u = (r.noise || []).filter(x => /ulp/.test(x[0])).map(x => Math.abs(x[1])); if (!u.length) break; return Math.max(...u).toFixed(1); }
      return outcome(r);
    }
    case 'plant': {                                  // the plant's numbers, in the units the guide uses
      const map = { pumpOwn: P.pumpOwn / 60, pumpLent: P.pumpLent / 60, drawTime: P.drawTime / 60, burnOut: P.burnOut / 60, quench: P.quench,
        coalAboard: int(P.coalAboard), coalPerDay: int(P.coalPerDayFull), psi: P.psi, pumpPsiLow: P.pumpPsi[0], pumpPsiFull: P.pumpPsi[1],
        lights: Math.round(100 * P.emergency.lights), breakTrim: P.breakTrimDeg, furnaces: P.rooms.reduce((a, r) => a + r.lit, 0) };
      if (map[parts[1]] === undefined) break;
      return String(map[parts[1]]);
    }
    case 'pumps': {                                  // pumps.main: the ballast and bilge pumps; pumps.all: with the ash ejectors
      const all = P.pumps.reduce((a, p) => a + p.LTh, 0), main = P.pumps.filter(p => !/ash-ejector/.test(p.name)).reduce((a, p) => a + p.LTh, 0);
      const map = { all: int(all), main: int(main), count: String(P.pumps.length), abandon: String(core().DEFAULT_PARAMS.pumpAbandon) };
      if (map[parts[1]] === undefined) break;
      return map[parts[1]];
    }
    case 'doors': if (parts[1] === 'fall') return String(core().DEFAULT_PARAMS.doorFall); if (parts[1] === 'float') return String(core().DEFAULT_PARAMS.floatDepth); break;
    case 'telegraph': { const t = motion().TELEGRAPH[parts[1] + ' ahead']; if (t === undefined) break; return String(t); }
    case 'sweep': {                                  // sweep.<level>.<none | seconds>.<clear | dented | seams | stem>, a percentage
      const L = sweeps()[parts[1]]; if (!L) break;
      const key = parts.length > 4 ? parts[2] + '.' + parts[3] : parts[2], what = parts[parts.length - 1];
      if (key === 'nights') return String(L.nights);
      const r = L.rows[key]; if (!r || r[what] === undefined) break;
      return String(r[what]);
    }
    case 'window': {                                 // window.clearUpTo: the last order (s) that clears; window.stemFrom: the first stem strike
      const W = windowRows();
      if (parts[1] === 'clearUpTo') { const c = W.filter(r => /^Clear/.test(r.text)); return c.length ? c[c.length - 1].t : '–'; }
      if (parts[1] === 'stemFrom') { const s = W.find(r => /^Stem/.test(r.text)); return s ? s.t : '–'; }
      break;
    }
    case 'end': {                                    // the end of the 1912 watch on its orders, as the page had it
      const map = {
        founderMin: () => sfact('founderMin', where).toFixed(1), founderClock: () => clockAt(sfact('founderMin', where)),
        forecastMin: () => sfact('forecastMin', where).toFixed(1), title: () => sfact('endCard', where).title,
        lightsMin: () => { const l = sfact('lights', where); return l.min === null ? '–' : l.min.toFixed(0); },
        lightsClock: () => { const l = sfact('lights', where); return l.min === null ? '–' : clockAt(l.min); },
        lightsWhy: () => sfact('lights', where).why || '',
        linkStart: () => sfact('link', where).slice(0, 22) + '…',
      };
      if (!map[parts[1]]) break;
      return String(map[parts[1]]());
    }
    case 'boats': {                                  // the boats: the record (core/readers/people.js) and the page's 1912 watch
      const B = boatsCompared(), P = B.P, Pp = people();
      const map = { places: int(B.places), aboard: int(Pp.PEOPLE.aboard), count: String(Pp.BOATS.length), away: String(P.boatsAway), inBoats: int(P.inBoatsAway), recordIn: int(B.recN), modelIn: int(B.modelN), outside: B.outside.join(', '),
        empty: int(P.emptyAway), water: int(P.water), timed: String(B.timed), within: String(B.within), uncoverMin: P.uncoverMin.toFixed(0), callMin: P.callMin.toFixed(0),
        uncoverClock: clockAt(P.uncoverMin), callClock: clockAt(P.callMin), fitted: String(Object.keys(Pp.FIT).length), minFill: String(Math.round(100 * Pp.RATE.minFill)),
        wayFull: String(Pp.RATE.wayFull), wayNone: String(Pp.RATE.wayNone), lowStation: String(Pp.RATE.lowStation), uncoverAfter: String(Pp.T.uncoverAfter), call: String(Pp.T.call),
        rulePort: Pp.RULE_WORDS[Pp.fresh().rule.P], ruleStarboard: Pp.RULE_WORDS[Pp.fresh().rule.S], jumpTrim: String(Pp.RATE.jumpTrim) };
      if (map[parts[1]] === undefined) break;
      return map[parts[1]];
    }
    case 'help': {                                   // help: the 1912 conduct and the ships (core/readers/world.js); the page's night
      const Wd = world(), Wf = sfact('world', where), ship = (id) => Wf.ships.find(s => s.id === id) || {}, def = (id) => Wd.SHIPS.find(s => s.id === id) || {};
      const c = ship('carpathia'), cal = ship('californian');
      const map = { orderMin: String(Wd.CONDUCT.order), firstRocketMin: String(Wd.CONDUCT.rockets[0]), rockets: String(Wd.CONDUCT.rockets.length), stock: String(Wd.ROCKETS.stock),
        orderClock: clockAt(Wd.CONDUCT.order), firstRocketClock: clockAt(Wd.CONDUCT.rockets[0]), lastRocketClock: clockAt(Wd.CONDUCT.rockets[Wd.CONDUCT.rockets.length - 1]),
        callMin: Wf.call.firstT === null ? '–' : Wf.call.firstT.toFixed(0), callClock: Wf.call.firstT === null ? '–' : clockAt(Wf.call.firstT), fired: String(Wf.rockets.fired),
        carpathiaHeard: c.heardT === null || c.heardT === undefined ? '–' : c.heardT.toFixed(0), carpathiaHeardClock: c.heardT == null ? '–' : clockAt(c.heardT),
        carpathiaEta: c.etaT == null ? '–' : c.etaT.toFixed(0), carpathiaEtaClock: c.etaT == null ? '–' : clockAt(c.etaT), carpathiaNm: String(def('carpathia').d), carpathiaKn: String(def('carpathia').kn),
        californianNm: String(def('californian').d), californianState: cal.state || '–', battery: String(Wd.SET.battery), reach: int(Wd.SET.night) };
      if (map[parts[1]] === undefined) break;
      return map[parts[1]];
    }
    case 'ensemble': {                               // NH3: the kept set's founders, as the Run tab's forecast paragraph gives them:
      // members; then presetN, presetLo, presetMed, presetHi, presetLanded (the 1912 damage) and the same for the watch
      // (watchN ... watchLanded): how many founder, their least, middle and most, and the landed member's, at her clock.
      // G12's cascade (D98): a watch hands her over at the break's onset by default, and the paragraph then gives where
      // the kept set breaks (the table's onset band, and the landed member's onset): watchBreakN ... watchBreakLanded
      const E = ensemble();
      if (parts[1] === 'members') return String(E.members);
      const brk = /^watchBreak/.test(parts[1]), key = brk ? 'onset' : 'founder';
      const run = brk ? 'watch' : (/^preset/.test(parts[1]) ? 'preset' : (/^watch/.test(parts[1]) ? 'watch' : null)), B = run && E[key] && E[key][run];
      if (!B || !(B.n > 0)) break;
      const L = E.landed && E.landed[run], map = { N: String(B.n), Lo: clockAt(B.lo), Med: clockAt(B.med), Hi: clockAt(B.hi), Landed: L && L[key] !== undefined ? clockAt(L[key]) : undefined };
      const v = map[parts[1].slice(brk ? 'watchBreak'.length : run.length)];
      if (v === undefined) break;
      return v;
    }
    case 'gauge': {                                  // the hull gauge: its range (core/readers/girder.js) and the page's 1912 damage
      const g = gauge(), f2 = (v) => v.toFixed(2), f1 = (v) => v.toFixed(1), at = (d) => { const s = g.atTrim(d); return s ? f2(s[2]) : '–'; };
      const map = { low: f1(g.low), high: f1(g.high), intact: f2(g.intact), entryClock: g.entry ? clockSec(g.entry[0]) : '–', entryTrim: g.entry ? f1(g.entry[1]) : '–',
        at11: at(11), at13: at(13), at17: at(17), peak: f2(g.peak[2]), peakTrim: f1(g.peak[1]), recordLow: String(g.record.trim[0]), recordHigh: String(g.record.trim[1]),
        watchMin: () => null };
      if (parts[1] === 'watchIn') { const w = sfact('gaugeIn', where); return w.hull; }
      if (parts[1] === 'watchInClock') { const w = sfact('gaugeIn', where); return clockAt(w.min); }
      if (map[parts[1]] === undefined || typeof map[parts[1]] === 'function') break;
      return map[parts[1]];
    }
    case 'pumpOrder': {                              // every pump that can reach boiler rooms 4 and 5, three minutes after the touch
      // (the page, tools/guide_shots.js): minutes after the touch to two places, as the page's forecast gives them
      const o = sfact('pumpOrder', where);
      if (!o.br4 || o.after.log.length !== 2) fail(where, `@@${name}@@: shots.json holds the older pump order (one room): run node tools/guide_shots.js`);
      const g = o.after.min - o.before.min;      // change: the gain in words by its sign (1.8 printed "-0.09 minutes more")
      const change = Math.abs(g) < 0.005 ? 'no change' : Math.abs(g).toFixed(2) + ' minutes ' + (g > 0 ? 'more' : 'less');
      const map = { at: String(o.atMin), before: o.before.min.toFixed(2), after: o.after.min.toFixed(2), gain: g.toFixed(2), change, toast: o.toast };
      if (map[parts[1]] === undefined) break;
      return map[parts[1]];
    }
    case 'rocketAt': return sfact('rocketAt', where).toFixed(0);
    case 'eyes': {                                   // the two eyes of site/parts/20_night_scene.js, as the page holds them
      const e = sfact('eyes', where), map = { nest: String(e.nestAbove), boat: String(e.boatDist), boatH: String(e.boatH), stars: int(e.stars) };
      if (map[parts[1]] === undefined) break;
      return map[parts[1]];
    }
    case 'list': {                                   // list.<minutes>: the calibrated 1912 run's list then (out/validation.json), degrees to port
      const H = validation().titanic.hist, t = +parts[1];
      if (!isFinite(t)) break;
      let v = null;
      for (let i = 1; i < H.length; i++) if (H[i][0] >= t) { const a = H[i - 1], b = H[i], u = (t - a[0]) / (b[0] - a[0]); v = a[2] + u * (b[2] - a[2]); break; }
      if (v === null) break;
      return Math.abs(v).toFixed(0) + '° to ' + (v < 0 ? 'port' : 'starboard');
    }
    case 'carpathia': {                              // the first search for the Carpathia question (see CARPATHIA above)
      if (parts[1] === 'note') return CARPATHIA.note;
      const c = carpathia(), v = c[parts[1]];
      if (typeof v === 'string') return v;
      break;
    }
    case 'ch': {                                     // ch.<name>: the number of the chapter in src/NN-<name>.md, in reading order
      const i = chapterFiles().findIndex(f => f.replace(/^.*\/\d\d-|\.md$/g, '') === parts.slice(1).join('.'));
      if (i >= 0) return String(i + 1);
      break;
    }
    case 'ledger': {                                 // ledger.<rows|inBand|sideChange|sideChangeFrom|sideChangeTo|tonnageT|tonnageRecord|tonnageShort|poingdestreLate>
      const v = ledger()[parts[1]]; if (v === undefined) break;
      return v;
    }
    case 'rooms': {                                  // rooms.rows: her rooms from the deck plans, the rows of data/rooms/*_deck.json (R3)
      if (parts[1] !== 'rows') break;
      const files = fs.readdirSync(abs('data/rooms')).filter(n => /_deck\.json$/.test(n)).sort();
      if (!files.length) fail('data/rooms', 'no deck tables (*_deck.json)');
      return int(files.reduce((s, n) => s + (JSON.parse(read('data/rooms/' + n)).rows || []).length, 0));
    }
    case 'trials': {                                 // trials.<bowShortMin|bowShortMax|bowAgainstPlace|sternWithin|jointLetGo>: the fall's trials (m, s; bowAgainstPlace a phrase)
      const v = trials()[parts[1]]; if (v === undefined) break;
      return v;
    }
    default: break;
  }
  fail(where, `unknown fact @@${name}@@ (the facts are listed in tools/build_guide.js, FACTS)`);
}
const expandFacts = (text, where) => text.replace(/@@([A-Za-z0-9_.-]+)@@/g, (m, n) => fact(n, where));

// ------------------------------------------------------------------ GEN: :::gen name, filled from the repository
const GEN = {
  // NH5: the counterfactual gallery's cards, as the Evidence tab gives them (out/gallery_1912.json): the watch as recorded
  // first, then each what-if, with its question and its result in the table's own words, which keep D22's rule (k of N of
  // the kept set, never one model's word); nothing here adds to them
  gallery() {
    const G = galleryTable(), cards = [Object.assign({ id: 'baseline' }, G.baseline || {})].concat(G.cards || []).filter(c => c && c.title && c.say);
    if (cards.length < 2) fail('out/gallery_1912.json', 'the gallery holds no cards');
    // in tables of three cards: one table of all of them is taller than a printed page (guide_check's fit)
    const rows = cards.map(c => ['**' + c.title + '**' + (c.question ? ' ' + c.question : ''), c.say]), parts = [];
    for (let i = 0; i < rows.length; i += 3) parts.push(mdTable(['The card', 'What the kept set shows'], rows.slice(i, i + 3)));
    return parts.join('\n\n');
  },
  // the Run tab's scenario cards, in the page's order: the watch's two cards (site/app.js), then the presets
  // (core/scenarios.js), with what the model makes of each (out/validation.json; the watch: the page, via shots.json)
  cards() {
    const { order, watch } = appCards(), P = scen().PRESETS, V = validation();
    const key = { titanic: 'titanic', four: 'four', five: 'five', hawke: 'hawke', britannic: 'britannic' };
    const rows = [
      ['**' + watch.watch.title + '**', watch.watch.blurb, 'On the 1912 orders: ' + fact('watch.forecast', 'cards').replace(/^(Founders|Breaks)\b/, (m) => m.toLowerCase())],
      ['**' + watch.night.title + '**', watch.night.blurb, 'Whatever the seed and your orders make of it'],
    ];
    for (const k of order) {
      if (!P[k]) fail('site/app.js', 'SCEN_ORDER names a preset core/scenarios.js does not have: ' + k);
      rows.push(['**' + P[k].title + '**', P[k].blurb, key[k] ? outcome(V[key[k]]) : (k === 'blank' ? 'Floats until you make a hole' : '–')]);
    }
    return mdTable(['Card', 'What the card says', 'In the model'], rows);
  },
  // the fit and the other cases: the record typed in the guide (key | case | record), the model from out/validation.json
  validation(args, body, where) {
    const V = validation();
    const rows = typedRows(body).map(([k, name, record]) => {
      if (!V[k]) fail(where, `out/validation.json has no case "${k}"`);
      return [name, record, outcome(V[k])];                     // no "(disagrees)" since candidate 2: the page's record says how the sources divide
    });
    return mdTable(['Case', 'The record', 'The model'], rows);
  },
  // the Evidence tab's timeline check, as the page builds it: the eyewitness events (core/scenarios.js) against the
  // calibrated run (out/validation.json)
  timeline() {
    // as the page builds it since candidate 2 (site/app.js, the red team's row 21): the middle column is "The record"
    // (for the events and the trim, Halpern's reconstruction); Wheat's own range for the water down the stair (the
    // ledger's wheat_stair_f); the trim at 2:15 am; Wilding's 16,000 tons as his assumption
    const SC = scen(), OBS = SC.OBS, V = validation().titanic;
    const ids = { overF: /bulkhead F/, ports: /Second row/, well: /well deck/, fcastle: /Forecastle/, bridge: /bridge/ };
    const find = (id) => { const e = V.events.find(e => ids[id] && ids[id].test(e.label)); return e ? clockAt(e.t) : '–'; };
    const wheat = SC.RECORD_1912 ? SC.RECORD_1912.find(r => r.id === 'wheat_stair_f') : null;
    const rows = OBS.events.map(o => [o.label, o.id === 'overF' && wheat && Array.isArray(wheat.sigma) ? clockAt(wheat.sigma[0]) + ' to ' + clockAt(wheat.sigma[1]) : clockAt(o.t), find(o.id)]);
    rows.push(['Trim at 2:15 am (Halpern\'s reconstruction)', '10.0°', (V.hist.find(h => h[0] >= 155) || [0, 0])[1].toFixed(1) + '°']);
    rows.push(['Foundered (stern under)', clockAt(OBS.founder), clockAt(V.founderMin)]);
    rows.push(['16,000 tons aboard (Wilding\'s assumption)', clockAt(40), clockAt(V.wildingMin)]);
    return mdTable(['Event', 'The record', 'Model'], rows, ['', 'r', 'r']);
  },
  // trim by the head: Halpern's eyewitness points (core/scenarios.js) against the calibrated run (out/validation.json)
  trim() {
    const OBS = scen().OBS, H = validation().titanic.hist;
    const at = (t) => { for (let i = 1; i < H.length; i++) if (H[i][0] >= t) { const a = H[i - 1], b = H[i], u = (t - a[0]) / (b[0] - a[0]); return a[1] + u * (b[1] - a[1]); } return H[H.length - 1][1]; };
    const rows = OBS.trim.filter(o => o[0] > 0).map(o => [clockAt(o[0]), o[1].toFixed(1) + '°', at(o[0]).toFixed(1) + '°']);
    return mdTable(['Time', 'Eyewitness reconstruction', 'The model'], rows, ['', 'r', 'r']);
  },
  // the same berg, another watch: the 1912 night's miss window (out/night_window_1912.txt, from tools/night_tests.js)
  window() {
    return mdTable(['Order after the bells', 'Ice ahead', 'What the ice does'], windowRows().map(r => [r.t + ' s', r.ahead + ' m', r.text]), ['r', 'r', '']);
  },
  // how hard a drawn night is, by level and by the moment of the order (out/night_sweep*.txt, tools/night_sweep.js)
  sweeps() {
    const S = sweeps(), names = { early: 'Seen early', hard: 'Any night', night1912: 'Like 1912' };
    // the order of the rows: the order at the bells, then later, then none at all (the file's own order of times)
    const keys = Object.keys(S.hard.rows).filter(k => k !== 'none').sort((a, b) => a - b).concat(['none']);
    const label = (k) => (k === 'none' ? 'No order at all' : k === '0' ? 'At the bells' : k + ' s after the bells');
    const rows = keys.map(k => [label(k), ...SWEEPS.map(([lv]) => { const r = S[lv].rows[k]; return r ? `${r.clear} % · ${r.stem} %` : '–'; })]);
    return mdTable(['The order', ...SWEEPS.map(([lv]) => names[lv] + ': clear · stem')], rows, ['', 'r', 'r', 'r']) +
      `\nTable: Of ${S.hard.nights} drawn nights at each level, the share on which she clears the ice, and the share on which she meets it stem first. The order is the 1912 drill: the helm hard over away from the ice, reversed at the touch.`;
  },
  // the Systems tab's chain: the links as the page lists them (site/index.template.html), described in the guide
  // (key | needs | fails when); the build stops if the page and the guide list different links
  chain(args, body, where) {
    const typed = new Map(typedRows(body).map(r => [r[0], r]));
    const items = chainItems();
    const missing = items.filter(([k]) => !typed.has(k)).map(([k, l]) => `${l} (${k})`);
    const extra = [...typed.keys()].filter(k => !items.some(([kk]) => kk === k));
    if (missing.length) fail(where, 'the Systems tab lists links the guide does not describe: ' + missing.join(', '));
    if (extra.length) fail(where, 'the guide describes links the Systems tab does not list: ' + extra.join(', '));
    return mdTable(['Link', 'Needs', 'Fails when'], items.map(([k, label]) => ['**' + label + '**', typed.get(k)[1], typed.get(k)[2]]));
  },
  // the boiler rooms and what was lit on the night (core/systems.js, PLANT.rooms)
  rooms() {
    // each boiler end has three furnaces (159 in all, The Shipbuilder); `lit` counts the ends fired on the night, as the
    // Systems tab's "Ends lit" does
    const R = plant().rooms;
    const rows = R.map(r => [r.name, `${r.boilers}, ${r.ends === 2 ? 'double' : 'single'}-ended`, String(r.boilers * r.ends * 3), `${r.lit} of ${r.boilers * r.ends}` + (r.lit ? '' : ': cold')]);
    rows.push(['**In all**', String(R.reduce((a, r) => a + r.boilers, 0)), '**' + R.reduce((a, r) => a + r.boilers * r.ends * 3, 0) + '**', `${R.reduce((a, r) => a + r.lit, 0)} of ${R.reduce((a, r) => a + r.boilers * r.ends, 0)}`]);
    return mdTable(['Room', 'Boilers', 'Furnaces', 'Ends lit on the night'], rows, ['', '', 'r', 'r']);
  },
  // the steam pumps that could reach the bilges (core/systems.js, PLANT.pumps)
  pumps() {
    const P = plant();
    const rows = P.pumps.map(p => [p.name, int(p.LTh)]);
    rows.push(['**In all**', '**' + int(P.pumps.reduce((a, p) => a + p.LTh, 0)) + '**']);
    return mdTable(['Pump', 'Tons of water an hour'], rows, ['', 'r']);
  },
  // the best night of the first search for the Carpathia question: its orders after the 1912 orders (see CARPATHIA)
  carpathia() {
    const c = carpathia(), up = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    return mdTable(['After the touch', 'The order'], c.orders.map(([T, w]) => [`${Math.round(T)} min`, up(w)]), ['r', '']) +
      `\nTable: The best night of the ${c.tried} the search tried: its orders after the 1912 orders, which it keeps to a minute after the touch.`;
  },
  // the engine-order telegraph: its positions as the page has them, the revolutions core/motion.js gives each
  telegraph() {
    const T = motion().TELEGRAPH;
    return mdTable(['Position', 'Button', 'Revolutions a minute'], telegraphButtons().map(([o, l]) => {
      if (T[o] === undefined) fail('core/motion.js', 'TELEGRAPH has no order "' + o + '" that the page offers');
      return [o.charAt(0).toUpperCase() + o.slice(1), '{{' + l + '}}', T[o] === 0 ? '0' : Math.abs(T[o]) + (T[o] < 0 ? ' astern' : ' ahead')];
    }), ['', '', 'r']);
  },
  // the twenty boats on the 1912 orders as the page had them at her end, beside the launch record (core/readers/people.js)
  boats() {
    const B = boatsCompared(), side = { S: 'stbd', P: 'port' };
    const rows = B.rows.map(({ d, m }) => {
      const rec = d.rec || {}, recT = rec.T === null || rec.T === undefined ? (rec.float ? 'floated off' : '–') : clockAt(rec.T);
      const mod = !m ? '–' : (m.away !== null ? clockAt(m.away) : (m.floated !== null ? 'floated off' : (m.state === 'lost' ? 'went down with her' : m.state)));
      const diff = m && m.away !== null && rec.T !== null && rec.T !== undefined ? Math.round(m.away - rec.T) : null;
      return [d.id, side[d.side], String(d.cap), recT, rec.n === undefined ? '–' : String(rec.n), mod, m && m.away !== null ? String(m.n) : '–', diff === null ? '' : (diff > 0 ? '+' : '') + diff];
    });
    return mdTable(['Boat', 'Side', 'Places', 'The record: away', 'In her', 'The model: away', 'In her', 'Minutes'], rows, ['', '', 'r', 'r', 'r', 'r', 'r', 'r']) +
      `\nTable: The record is the re-examined launch times and numbers that core/readers/people.js keeps; the model's columns are the page's at her end on the 1912 orders. "Minutes": the model's time less the record's.`;
  },
  // the other ships: where the model puts them (core/readers/world.js, SHIPS) and what the page's 1912 night made of them
  ships() {
    const Wd = world(), Wf = sfact('world', 'ships'), by = new Map(Wf.ships.map(s => [s.id, s]));
    const words = { coming: 'coming', none: 'heard nothing', alongside: 'alongside', stopped: 'stopped', heard: 'answered', ice: 'in the ice' };
    const rows = Wd.SHIPS.map(d => {
      const s = by.get(d.id) || {};
      return [d.name, d.d + ' miles', d.kn + ' kn', s.heardT == null ? '–' : clockAt(s.heardT), (words[s.state] || s.state || '–') + (s.etaT != null ? ', expected at ' + clockAt(s.etaT) : (s.state === 'coming' ? ', the ice between' : ''))];
    });
    return mdTable(['Ship', 'Off at the start', 'Speed', 'Hears her', 'At her end'], rows, ['', 'r', 'r', 'r', '']) +
      `\nTable: Distances from her wreck, and speeds, as core/readers/world.js places the ships; the last two columns are the page's 1912 night.`;
  },
  // the wireless and the rockets on the 1912 orders (the page's log of them, sim.world.lines): every message out and the
  // set's end; of the answers, Carpathia's; of the rockets, the first and the last
  wireless() {
    const L = sfact('world', 'wireless').lines, rk = L.filter(l => /rocket goes up/.test(l.text));
    const keep = L.filter(l => l.kind !== 'in' || /Carpathia/.test(l.text)).filter(l => !/rocket goes up/.test(l.text) || l === rk[0] || l === rk[rk.length - 1]);
    const others = L.filter(l => l.kind === 'in' && !/Carpathia/.test(l.text)).length;
    return mdTable(['Time', 'On the wireless and the bridge'], keep.map(l => [clockAt(l.T), l.text.replace(/, (\d+) of (\d+)\.$/, (m, a, b) => ', ' + a + ' of ' + b + (l === rk[0] ? ' (one every few minutes after it)' : '') + '.')]), ['r', '']) +
      `\nTable: The page's own log on the 1912 orders. Left out: ${rk.length - 2} rockets between the first and the last, and ${others} answers from the other ships.`;
  },
  // the reports to the bridge on the 1912 orders (the page's feed, sim.reports), the commutator's readings left out
  reports() {
    const R = sfact('reports', 'reports'), keep = R.filter(r => !/^The commutator/.test(r.who)), com = R.length - keep.length;
    return mdTable(['Time', 'Who, and how', 'What he said'], keep.map(r => [clockAt(r.min), r.who + ', ' + r.by, r.words]), ['r', '', '']) +
      `\nTable: The page's feed on the 1912 orders, oldest first. Left out: the commutator, read ${com} times.`;
  },
  // the hull gauge on the 1912 damage: the moment where the record's break falls, read on the page's own run
  gauge() {
    const g = gauge(), s = (x) => (x ? x : null), row = (what, smp) => [what, smp ? clockSec(smp[0]) : '–', smp ? smp[1].toFixed(1) + '°' : '–', smp ? smp[2].toFixed(2) : '–'];
    const rows = [row('Enters the studies\' range (' + g.low.toFixed(1) + ' GN m)', s(g.entry))];
    for (const d of [11, 13, 17]) rows.push(row(d + '° of trim' + (d === g.record.trim[0] || d === g.record.trim[1] ? ': the record\'s break' + (d === g.record.trim[0] ? ' begins' : ' at the latest') : ''), g.atTrim(d)));
    rows.push(row('The greatest moment', g.peak));
    return mdTable(['On the 1912 damage', 'Ship\'s time', 'Trim', 'GN m'], rows, ['', 'r', 'r', 'r']);
  },
  // the card at the end of the 1912 watch on its orders, as the page wrote it
  endcard() {
    const c = sfact('endCard', 'endcard');
    return [':::note The card at her end, on the 1912 orders', '**' + c.title + '.** ' + c.lines.join(' '), ':::'].join('\n');
  },
  // the commands, as CLAUDE.md lists them
  commands() {
    return mdTable(['Command', 'What it does'], commands().map(([c, w]) => ['`' + c + '`', w]));
  },
};

// ------------------------------------------------------------------ the Markdown converter
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const UNITS = 'm|m²|m2|cm|km|s|min|t|kn|knots|h|ft|rpm|psi|°|%|tons|nights|degrees';
function inline(s, where) {
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (m, c) => { codes.push(c); return '\u0000' + (codes.length - 1) + '\u0000'; });
  s = esc(s);
  s = s.replace(/\[\[([^\]]+)\]\]/g, (m, k) => `<kbd>${k}</kbd>`);
  // a control's label as a chip; a long one may wrap (a chip that will not wrap could run past the page)
  s = s.replace(/\{\{(:?)([^}]+)\}\}/g, (m, ui, c) => (ui ? `<span class="ui">${c}</span>` : `<span class="chip${c.length > 28 ? ' long' : ''}">${c}</span>`));
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => `<a href="${u}">${t}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*\w])\*([^*\s](?:[^*]*[^*\s])?)\*(?![*\w])/g, '$1<em>$2</em>');
  s = s.replace(new RegExp(`(\\d) (${UNITS})(?![\\w²])`, 'g'), '$1&nbsp;$2');   // never a number at a line's end and its unit on the next
  s = s.replace(/\u0000(\d+)\u0000/g, (m, i) => `<code>${esc(codes[+i])}</code>`);
  if (/\{\{|\}\}|\[\[|\]\]/.test(s)) fail(where, 'an unclosed {{ }} or [[ ]] in: ' + s.slice(0, 80));
  return s;
}
const slug = (s) => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
const isBlank = (l) => /^\s*$/.test(l);
// a line that ends a paragraph and starts something else. A numbered list breaks into a paragraph only at "1." (as in
// CommonMark), so that a wrapped line starting "1916. " stays in its sentence
const startsBlock = (l) => /^(#{1,4}\s|:::|\||\s*[-*]\s+\S|\s*1[.)]\s+\S|!\[)/.test(l);
const startsList = (l) => /^\s*[-*]\s+\S/.test(l) || /^\s*\d{1,2}[.)]\s+\S/.test(l);
const IMG = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)(\{[^}]*\})?/g;

function blocks(lines, ctx) {
  const out = [];
  let i = 0;
  const at = () => `${ctx.file}:${ctx.line0 + i + 1}`;
  while (i < lines.length) {
    const l = lines[i];
    if (isBlank(l)) { i++; continue; }
    let m;
    if ((m = /^:::(\w+)\s*(.*)$/.exec(l))) {          // a container, to the next line holding only :::
      const where = at(), kind = m[1], arg = m[2].trim(), body = [], line0 = ctx.line0 + i + 1;
      i++;
      while (i < lines.length && !/^:::\s*$/.test(lines[i])) body.push(lines[i++]);
      if (i >= lines.length) fail(where, `:::${kind} is never closed`);
      i++;
      out.push(container(kind, arg, body, Object.assign({}, ctx, { line0 }), where));
      continue;
    }
    if ((m = /^(#{1,4})\s+(.*)$/.exec(l))) {
      if (m[1].length === 1) fail(at(), 'a second "# " title: a chapter has one; use ## for its sections');
      const lv = m[1].length + 1, html = inline(m[2], at()), id = ctx.prefix + '-' + slug(html);
      out.push(`<h${lv} id="${id}">${html}</h${lv}>`);
      i++; continue;
    }
    if (/^\|/.test(l)) {
      const where = at(), t = [];
      while (i < lines.length && /^\|/.test(lines[i])) t.push(lines[i++]);
      let cap = null;
      if (i < lines.length && /^Table:\s/.test(lines[i])) cap = lines[i++].replace(/^Table:\s*/, '');
      out.push(table(t, cap, where));
      continue;
    }
    if (startsList(l)) {
      const ordered = /^\s*\d{1,2}[.)]\s+/.test(l), itemRe = ordered ? /^\s*\d{1,2}[.)]\s+(.*)$/ : /^\s*[-*]\s+(.*)$/, items = [], where = at();
      while (i < lines.length) {
        const x = lines[i], mm = itemRe.exec(x);
        if (mm) { items.push([mm[1]]); i++; continue; }
        if (isBlank(x)) { let j = i; while (j < lines.length && isBlank(lines[j])) j++; if (j < lines.length && itemRe.test(lines[j])) { i = j; continue; } break; }
        if (!startsBlock(x) || /^\s{2,}\S/.test(x)) { items[items.length - 1].push(x.trim()); i++; continue; }
        break;
      }
      const lis = items.map(it => `<li>${inline(it.join(' '), where)}</li>`).join('\n');
      out.push(ordered ? `<ol class="steps">\n${lis}\n</ol>` : `<ul>\n${lis}\n</ul>`);
      continue;
    }
    // a paragraph, or a figure when it holds images only
    const where = at(), para = [l];
    i++;
    while (i < lines.length && !isBlank(lines[i]) && !startsBlock(lines[i])) para.push(lines[i++]);
    if (/^!\[/.test(l)) {
      while (i < lines.length && /^!\[/.test(lines[i])) para.push(lines[i++]);
      const text = para.join(' ');
      if (text.replace(IMG, '').trim()) fail(where, 'a paragraph that starts with an image must hold images only');
      const ims = [...text.matchAll(IMG)], figs = ims.map(mm => figure(mm[1], mm[2], mm[3], mm[4], where, ctx));
      const kinds = [...new Set(ims.map(mm => mm[4] || ''))];          // a row of phones is a row of phones
      out.push(figs.length > 1 ? `<div class="figrow n${figs.length}${kinds.length === 1 && kinds[0] ? ' ' + kinds[0].replace(/[{}.]/g, '') : ''}">\n${figs.join('\n')}\n</div>` : figs[0]);
      continue;
    }
    out.push(`<p>${inline(para.join(' '), where)}</p>`);
  }
  return out.join('\n');
}
function container(kind, arg, body, ctx, where) {
  if (kind === 'lede') return `<p class="lede">${inline(body.join(' '), where)}</p>`;
  if (kind === 'note' || kind === 'tip' || kind === 'warn') {
    return `<aside class="box ${kind}">${arg ? `<b class="lab">${inline(arg, where)}</b>` : ''}\n${blocks(body, ctx)}\n</aside>`;
  }
  if (kind === 'gen') {
    const [name, ...args] = arg.split(/\s+/);
    if (!GEN[name]) fail(where, `unknown generated block "${name}" (the blocks are listed in tools/build_guide.js, GEN)`);
    ctx.gens.push(name);
    const md = GEN[name](args, body, where);
    return `<div class="gen" data-gen="${name}">\n${blocks(md.split('\n'), Object.assign({}, ctx, { line0: 0, file: 'generated block ' + name }))}\n</div>`;
  }
  fail(where, `unknown container :::${kind} (lede, note, tip, warn, gen)`);
}
function table(rows, cap, where) {
  const cells = (r) => r.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(c => c.trim().replace(/\\\|/g, '|'));
  if (rows.length < 2) fail(where, 'a table needs a header row and a separator row');
  const head = cells(rows[0]), sep = cells(rows[1]);
  if (sep.length !== head.length || !sep.every(c => /^:?-{2,}:?$/.test(c))) fail(where, 'a table\'s second row must be its separator (|---|---|), one cell per column');
  const al = sep.map(c => (c.endsWith(':') ? (c.startsWith(':') ? ' class="c"' : ' class="r"') : ''));
  const body = rows.slice(2).map((r, j) => {
    const c = cells(r);
    if (c.length !== head.length) fail(where, `table row ${j + 1} has ${c.length} cells, its header ${head.length}`);
    return '<tr>' + c.map((x, k) => `<td${al[k]}>${inline(x, where)}</td>`).join('') + '</tr>';
  });
  // A short table keeps together. A long one may break across pages, its header repeated; its first three rows and its
  // last two are kept together, so that no page holds one row of it alone. The wrapper is its own formatting context,
  // so that beside a floated figure a short table narrows to fit; a long one clears the floats (a table that begins
  // beside a float and runs on to the next page is drawn there with the narrow rows' heights)
  const long = body.length > 8;
  const tbodies = long ? `<tbody class="first">\n${body.slice(0, 3).join('\n')}\n</tbody>\n<tbody>\n${body.slice(3, -2).join('\n')}\n</tbody>\n<tbody class="last">\n${body.slice(-2).join('\n')}\n</tbody>`
    : `<tbody>\n${body.join('\n')}\n</tbody>`;
  return `<div class="tw${long ? ' long' : ''}">\n<table>\n<thead><tr>${head.map((h, k) => `<th${al[k]}>${inline(h, where)}</th>`).join('')}</tr></thead>\n${tbodies}\n</table>` +
    (cap ? `\n<p class="tcap">${inline(cap, where)}</p>` : '') + '\n</div>';
}
function figure(alt, src, cap, attrs, where, ctx) {
  if (/^[a-z]+:/i.test(src) || src.startsWith('/')) fail(where, 'an image must be a file under docs/guide/: ' + src);
  const file = path.join(GUIDE, src);
  if (!fs.existsSync(file)) fail(where, 'the image ' + src + ' is missing (take it with node tools/guide_shots.js, or fix the name)');
  readBuf(rel(file));
  ctx.images.push(src);
  const cls = ['fig'].concat(((attrs || '').match(/\.([a-z]+)/g) || []).map(c => c.slice(1)));
  if (!alt.trim()) fail(where, 'an image needs its alt text: ' + src);
  return `<figure class="${cls.join(' ')}"><img src="${esc(src)}" alt="${esc(alt)}">${cap ? `<figcaption>${inline(cap, where)}</figcaption>` : ''}</figure>`;
}

// ------------------------------------------------------------------ chapters
function chapterFiles() {
  const dir = path.join(GUIDE, 'src');
  return fs.readdirSync(dir).filter(f => /^\d\d-[a-z0-9-]+\.md$/.test(f)).sort().map(f => 'docs/guide/src/' + f);
}
function loadChapter(r, n) {
  let text = read(r), meta = {}, line0 = 0;
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (fm) {
    for (const l of fm[1].split('\n')) { const m = /^(\w+):\s*(.*)$/.exec(l); if (m) meta[m[1]] = m[2].trim(); }
    line0 = fm[0].split('\n').length - 1; text = text.slice(fm[0].length);
  }
  // comments out (keeping the line count), then the facts, line by line, for messages that name the line
  text = text.replace(/<!--[\s\S]*?-->/g, (c) => c.replace(/[^\n]/g, ''));
  const lines = text.split('\n').map((l, i) => expandFacts(l, `${r}:${line0 + i + 1}`));
  const t = lines.findIndex(l => /^# /.test(l));
  if (t < 0) fail(r, 'no "# Title" line');
  if (lines.slice(0, t).some(l => !isBlank(l))) fail(`${r}:${line0 + 1}`, 'text before the "# Title" line');
  const title = lines[t].slice(2).trim();
  const ctx = { file: r, line0: line0 + t + 1, prefix: 'c' + n, images: [], gens: [] };
  const html = blocks(lines.slice(t + 1), ctx);
  return { file: r, n, id: 'ch' + n, title, contents: meta.contents || '', html, images: ctx.images, gens: ctx.gens };
}

// ------------------------------------------------------------------ the PDF: print it, read its pages and destinations
// headless Edge or Chrome prints the page, each attempt with a profile of its own, and every launch is ended through
// tools/cdp.js's closeBrowser, the close every launch site shares (G16): the browser killed if it still runs (past the
// deadline, PRINT_MS), waited for up to 5 s, its profile removed with retries. So no guide-pdf-* folder is left behind
const PRINT_MS = 180000;
async function printPdf(htmlFile, pdfFile) {
  const { findBrowser, closeBrowser } = require('./cdp');
  for (let attempt = 1; attempt <= 2; attempt++) {
    try { fs.rmSync(pdfFile, { force: true }); } catch (e) { /* none */ }
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'guide-pdf-'));
    const child = spawn(findBrowser(), ['--headless=new', '--no-pdf-header-footer', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
      '--user-data-dir=' + profile, '--generate-pdf-document-outline', '--print-to-pdf=' + pdfFile, 'file:///' + htmlFile.replace(/\\/g, '/')], { stdio: 'ignore' });
    const how = await new Promise((resolve) => {
      const timer = setTimeout(() => resolve('past ' + PRINT_MS / 1000 + ' s'), PRINT_MS);
      child.once('exit', (code, signal) => { clearTimeout(timer); resolve('status ' + (code === null ? signal : code)); });
      child.once('error', (e) => { clearTimeout(timer); resolve(e.message); });
    });
    if (!(await closeBrowser(child, profile))) console.log(`  the browser's profile is still held and is left in place: ${profile}`);
    if (fs.existsSync(pdfFile) && fs.statSync(pdfFile).size > 1000) return;
    console.log(`  the browser did not write the PDF (attempt ${attempt}, ${how})`);
  }
  throw new GuideError('headless Edge or Chrome did not print the PDF (set BROWSER to its path if it is elsewhere)');
}
// a PDF as Skia writes it: a classic cross-reference table. Returns its page count, the page of each named
// destination (the element ids the contents page links to), and its title
function pdfInfo(buf) {
  const s = buf.toString('latin1');
  const sx = /startxref\s+(\d+)\s+%%EOF\s*$/.exec(s);
  if (!sx) throw new GuideError('the PDF has no startxref');
  const xr = /^xref\s+(\d+)\s+(\d+)\s+/.exec(s.slice(+sx[1]));
  if (!xr) throw new GuideError('the PDF\'s cross-reference table is not a classic one');
  const first = +xr[1], count = +xr[2], base = +sx[1] + xr[0].length, off = new Map();
  for (let k = 0; k < count; k++) { const e = s.substr(base + 20 * k, 20); if (e[17] === 'n') off.set(first + k, +e.slice(0, 10)); }
  const obj = (n) => { const o = off.get(n); if (o === undefined) return ''; const t = s.slice(o, o + 200000); const e = t.search(/\bstream\b|\bendobj\b/); return t.slice(0, e < 0 ? t.length : e); };
  const trailer = s.slice(s.lastIndexOf('trailer'));
  const rootN = +(/\/Root (\d+) 0 R/.exec(trailer) || [])[1], cat = obj(rootN);
  const pages = [];
  const walk = (n) => { const o = obj(n); if (/\/Type\s*\/Pages\b/.test(o)) { const kids = /\/Kids\s*\[([^\]]*)\]/.exec(o); for (const m of (kids ? kids[1] : '').matchAll(/(\d+) 0 R/g)) walk(+m[1]); } else if (/\/Type\s*\/Page\b/.test(o)) pages.push(n); };
  walk(+(/\/Pages (\d+) 0 R/.exec(cat) || [])[1]);
  const pageOf = new Map(pages.map((p, i) => [p, i + 1]));
  const dests = {};
  const take = (txt) => { for (const m of txt.matchAll(/\/([A-Za-z0-9_.#-]+)\s*\[\s*(\d+) 0 R/g)) dests[m[1].replace(/#([0-9A-Fa-f]{2})/g, (x, h) => String.fromCharCode(parseInt(h, 16)))] = pageOf.get(+m[2]) || null; };
  const d = /\/Dests (\d+) 0 R/.exec(cat);
  if (d) take(obj(+d[1]));
  const info = obj(+(/\/Info (\d+) 0 R/.exec(trailer) || [])[1]);
  const tm = /\/Title\s*\(((?:\\.|[^\\)])*)\)/.exec(info);
  const title = tm ? tm[1].replace(/\\([()\\])/g, '$1') : null;
  return { pages: pages.length, dests, title, outline: /\/Outlines \d+ 0 R/.test(cat) };
}
// the PDF's creation and modification dates set to the edition's date (the same length, so no offset moves): a rebuild
// from the same sources then gives the same bytes
function pinDate(buf, iso) {
  const s = buf.toString('latin1'), want = iso.replace(/-/g, '') + '000000', b = Buffer.from(buf);
  for (const key of ['/CreationDate (D:', '/ModDate (D:']) {
    const i = s.indexOf(key);
    if (i >= 0 && /^\d{14}/.test(s.slice(i + key.length, i + key.length + 14))) b.write(want, i + key.length, 'latin1');
  }
  return b;
}

// ------------------------------------------------------------------ the page around the chapters
function assemble(chapters, pageNos, buildRec) {
  const C = conf(), v = site(), rp = repo();
  const css = read('docs/guide/template/guide.css');
  let html = read('docs/guide/template/guide.html');
  const toc = chapters.map(c => `<li><a href="#${c.id}"><span class="n">${c.n}</span><span class="t">${esc(c.title)}<small>${esc(c.contents)}</small></span><span class="pg">${pageNos && pageNos[c.id] ? pageNos[c.id] : ''}</span></a></li>`).join('\n');
  const body = chapters.map(c => `<section class="chapter" id="${c.id}">\n<div class="eyebrow">Chapter ${c.n}</div>\n<h2>${esc(c.title)}</h2>\n<hr class="rule">\n${c.html}\n</section>`).join('\n\n');
  const repoLine = `Built from repository commit ${rp.commit}` + (rp.changed.length ? ` with local changes to ${rp.changed.length} file${rp.changed.length > 1 ? 's' : ''}` : '');
  const tokens = {
    TITLE: esc(C.title), CSS: css, CONTENTS: toc, CHAPTERS: body, REPO_LINE: esc(repoLine),
    BUILD: JSON.stringify(buildRec).replace(/</g, '\\u003c'),
  };
  html = html.replace(/@@([A-Z_]+)@@/g, (m, k) => { if (tokens[k] === undefined) fail('docs/guide/template/guide.html', 'unknown token ' + m); return tokens[k]; });
  html = expandFacts(html, 'docs/guide/template/guide.html');
  if (/@@[A-Za-z0-9_.-]+@@/.test(html)) fail('the page', 'a fact was left unexpanded');
  return html;
}

// ------------------------------------------------------------------ the build
// the guide built: a promise (the PDF's printing waits on the browser), of { htmlFile, pdfFile, chapters, pages, info }
async function build(opts) {
  opts = opts || {};
  const C = conf();
  const files = chapterFiles();
  if (!files.length) fail('docs/guide/src', 'no chapters (files named NN-name.md)');
  const chapters = files.map((f, i) => loadChapter(f, i + 1));
  // every generated input is read now, so that the record below names it
  shots(); site(); read('docs/guide/template/guide.css'); read('docs/guide/template/guide.html'); readBuf('tools/build_guide.js');
  const outBase = path.join(GUIDE, C.file);
  const htmlFile = outBase + '.html', pdfFile = outBase + '.pdf';
  const record = (pdfHash, pageNos, pages) => ({
    tool: 'tools/build_guide.js', edition: C.edition, file: C.file, repoCommit: repo().commit,
    site: { version: site().version, app: site().app, builtFromCommit: site().builtFromCommit },
    chapters: chapters.map(c => ({ id: c.id, file: c.file, title: c.title, page: pageNos ? pageNos[c.id] || null : null })),
    images: [...new Set(chapters.flatMap(c => c.images))].sort(),
    generated: [...new Set(chapters.flatMap(c => c.gens))].sort(),
    inputs: Object.fromEntries([...inputs.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))),
    absent: [...absent].sort(),                     // looked for and not found: the guide is stale once one arrives
    pages: pages || null, pdf: pdfHash || null,
  });
  if (opts.htmlOnly) {
    fs.writeFileSync(htmlFile, assemble(chapters, null, record(null, null, null)));
    return { htmlFile, chapters, pages: null };
  }
  // pass 1 prints without page numbers; pass 2 fills them in from the PDF's own destinations, and is printed again;
  // the numbers must come out the same (the contents page keeps its layout whatever the numbers are)
  const tmpHtml = path.join(GUIDE, '.' + C.file + '.tmp.html'), tmpPdf = path.join(os.tmpdir(), 'guide-' + process.pid + '.pdf');
  let pageNos = null, info = null;
  try {
    for (let pass = 1; pass <= 3; pass++) {
      fs.writeFileSync(tmpHtml, assemble(chapters, pageNos, record(null, pageNos, null)));
      await printPdf(tmpHtml, tmpPdf);
      info = pdfInfo(fs.readFileSync(tmpPdf));
      const found = Object.fromEntries(chapters.map(c => [c.id, info.dests[c.id] || null]));
      const missing = chapters.filter(c => !found[c.id]);
      if (missing.length) fail('the PDF', 'no destination for ' + missing.map(c => c.id).join(', ') + ' (the contents page links to each chapter)');
      console.log(`  pass ${pass}: ${info.pages} pages; chapters start on ${chapters.map(c => found[c.id]).join(', ')}`);
      if (pageNos && chapters.every(c => pageNos[c.id] === found[c.id])) break;
      if (pass === 3) fail('the PDF', 'the page numbers did not settle in three passes');
      pageNos = found;
    }
    const pdf = pinDate(fs.readFileSync(tmpPdf), C.date);
    const pdfHash = sha(pdf);
    fs.writeFileSync(pdfFile, pdf);
    fs.writeFileSync(htmlFile, assemble(chapters, pageNos, record(pdfHash, pageNos, info.pages)));
  } finally {
    try { fs.rmSync(tmpHtml, { force: true }); fs.rmSync(tmpPdf, { force: true }); } catch (e) { /* gone */ }
  }
  return { htmlFile, pdfFile, chapters, pages: info.pages, info };
}

module.exports = { build, pdfInfo, chapterFiles, inline, esc, GuideError, sha };

if (require.main === module) (async () => {
  const t0 = Date.now();
  try {
    const htmlOnly = process.argv.includes('--html');
    const r = await build({ htmlOnly });
    const kb = (f) => (fs.statSync(f).size / 1024).toFixed(0) + ' KB';
    console.log(`wrote ${rel(r.htmlFile)} (${kb(r.htmlFile)})` + (r.pdfFile ? ` and ${rel(r.pdfFile)} (${kb(r.pdfFile)}, ${r.pages} pages${r.info.outline ? ', with an outline' : ''})` : ' (no PDF: --html)'));
    console.log(`PASS: ${r.chapters.length} chapters, ${[...new Set(r.chapters.flatMap(c => c.images))].length} figures, ${[...new Set(r.chapters.flatMap(c => c.gens))].length} kinds of generated block, ${inputs.size} inputs${absent.size ? `, ${absent.size} absent (${[...absent].join(', ')})` : ''} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
    process.exit(0);
  } catch (e) {
    console.log('FAIL ' + (e instanceof GuideError ? e.message : (e.stack || e.message)));
    process.exit(1);
  }
})();
