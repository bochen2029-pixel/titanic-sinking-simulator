// The observation ledger against the model (the calibration epoch, stage A3; the design, section 3).
//   node tools/ledger_tests.js          (seconds; writes out/ledger_1912.txt through tools/outdir.js)
// The 1912 damage preset is run once at its default numbers, sampled every 5 s (her pose, the 64 levels, the water,
// the core's own events; the onset of the break from core/readers/onset.js beside it), and every row of
// core/scenarios.js RECORD_1912 is read against it by core/readers/ledger.js.
// EVERY LEDGER ROW IS A CHECK: in range or "out", and the suite passes whatever the misses are. Nothing is scored from
// the ledger yet (tools/calibrate.js reads OBS); the table is printed from now on so that each later step of the epoch
// shows its effect before anything is fitted. The MUST rows are the suite's own mechanics only: every row has the
// schema's fields and a known kind; every row's operator returns a number; the library is pure (twice, the same
// numbers); and a run sampled by it is the same bits at its end as one made before the library was loaded.
'use strict';
const fs = require('fs');
const crypto = require('crypto');
const C = require('../core/core.js');
const SC = require('../core/scenarios.js');
const outFile = require('./outdir');

const lines = [], say = (s) => { lines.push(s); console.log(s); };
const musts = []; let fails = 0;
function must(what, value, ref, ok) { musts.push([what, value, ref, ok]); if (!ok) fails++; }
const f = (x, n) => (x === null || x === undefined || Number.isNaN(x) ? 'n/a' : (Object.is(+(+x).toFixed(n === undefined ? 2 : n), -0) ? (0).toFixed(n === undefined ? 2 : n) : (+x).toFixed(n === undefined ? 2 : n)));
const sg = (x, n) => (x === null || x === undefined || Number.isNaN(x) ? 'n/a' : (x > 0 ? '+' : '') + f(x, n));
const ship = C.buildShip(), EVERY = 20, T_MAX = 5 * 3600;     // 20 steps of 0.25 s: every 5 s of her time

function digestOf(sim) {
  const h = crypto.createHash('sha256'), b = new Float64Array(64 + 5);
  b.set(sim.vol.subarray(0, 64), 0); b[64] = sim.zO; b[65] = sim.pitch; b[66] = sim.roll; b[67] = sim.t; b[68] = sim.foundered ? sim.founderT : -1;
  h.update(Buffer.from(b.buffer));
  h.update(JSON.stringify(sim.events.map(e => [e.id, e.t])));
  h.update(JSON.stringify((sim.pockets || []).map(k => [k.vol, k.state])));
  return h.digest('hex');
}

// ---------------------------------------------------------------- 1. the run alone, before the library is loaded
const plain = (() => {
  const sim = C.createSim(ship, {}, SC.PRESETS.titanic.build({}));
  let k = 0;
  while (!sim.foundered && sim.t < T_MAX) { C.step(sim); k++; }
  return { steps: k, digest: digestOf(sim), vol: Float64Array.from(sim.vol), pose: [sim.zO, sim.pitch, sim.roll], founderT: sim.founderT };
})();

// ---------------------------------------------------------------- 2. the same run, sampled by the library
const L = require('../core/readers/ledger.js');
const O = require('../core/readers/onset.js');
const ROWS = SC.RECORD_1912;
const sim = C.createSim(ship, {}, SC.PRESETS.titanic.build({}));
const run = L.start(sim), onset = O.start();
{
  let k = 0;
  L.take(run, sim); O.look(sim, onset);
  while (!sim.foundered && sim.t < T_MAX) {
    C.step(sim); k++;
    O.look(sim, onset);
    if (k % EVERY === 0 || sim.foundered) L.take(run, sim);
  }
  L.close(run, sim, { onsetT: onset.found ? onset.found.t : null });
  let same = digestOf(sim) === plain.digest && k === plain.steps && Object.is(sim.zO, plain.pose[0]) && Object.is(sim.pitch, plain.pose[1]) && Object.is(sim.roll, plain.pose[2]);
  for (let n = 0; n < sim.vol.length; n++) if (!Object.is(sim.vol[n], plain.vol[n])) same = false;
  must('nothing fed back: the run sampled by the library (and looked at by the onset) ends on the bits of the run made before either was loaded',
    'step ' + k + ' / ' + plain.steps + '; state ' + digestOf(sim).slice(0, 16) + ' / ' + plain.digest.slice(0, 16), 'the same step, sim.vol and the pose bit for bit, the same events', same);
}

// ---------------------------------------------------------------- 3. the rows' form, the operators, purity
{
  const bad = ROWS.map(r => [r.id, L.problems(r)]).filter(b => b[1].length);
  const ids = new Set(ROWS.map(r => r.id));
  must('every row has the schema\'s fields, a known kind, side and role, and its own id', bad.length ? bad.map(b => b[0] + ': ' + b[1].join(', ')).join('; ') : ROWS.length + ' rows, ' + L.FIELDS.length + ' fields each', 'none wrong; ' + ROWS.length + ' ids', bad.length === 0 && ids.size === ROWS.length);
}
const frozen = JSON.stringify(ROWS);
const RES = L.evaluateAll(ROWS, run);
{
  const nan = RES.filter(r => typeof r.model !== 'number' || !isFinite(r.model));
  must('every row\'s operator returns a number', nan.length ? nan.map(r => r.id).join(', ') : RES.length + ' numbers', 'all finite', nan.length === 0);
  const again = L.evaluateAll(ROWS, run);
  const key = (r) => [r.model, r.min, r.max, r.miss, r.reach, r.late, r.trimAtReach, r.inRange];
  let same = again.length === RES.length;
  for (let i = 0; same && i < RES.length; i++) { const a = key(RES[i]), b = key(again[i]); for (let j = 0; j < a.length; j++) if (!Object.is(a[j], b[j])) same = false; }
  must('the library is pure: evaluated twice, the same numbers; the ledger\'s rows untouched', same ? 'the same, bit for bit' : 'they differ', 'the same; RECORD_1912 as it was', same && JSON.stringify(ROWS) === frozen);
}

// ---------------------------------------------------------------- 4. the table
const Tf = run.founderT === null ? null : run.founderT / 60;
const bandText = (row, r) => {
  const u = row.unit, d = u === 't' ? 0 : 2;
  if (row.sided === 'interval') return f(row.sigma[0], d) + ' to ' + f(row.sigma[1], d);
  const w = typeof row.sigma === 'number' ? ' +/- ' + f(row.sigma, d) : '';
  return (row.sided === 'lower' ? 'at least ' : (row.sided === 'upper' ? 'at most ' : '')) + f(row.value, d) + w;
};
const when = (row) => (row.tLo === null || row.tLo === row.tHi ? 'T ' + f(row.t, 0) : 'T ' + f(row.tLo, 0) + ' to ' + f(row.tHi, 0));
const isTime = (row) => row.kind === 'event' || row.kind === 'end';
function line(row, r) {
  const d = row.unit === 't' ? 0 : 2;
  const model = isTime(row) ? 'T ' + f(r.model, 1) : f(r.model, d) + ' at T ' + f(row.t, 0);
  const reach = isTime(row) || row.kind === 'angle' ? '' : (r.reach === null ? 'never' : 'T ' + f(r.reach, 1));
  const late = r.late === null || row.kind === 'angle' ? '' : (r.late === 0 ? 'in time' : sg(r.late, 1) + ' min');
  return (r.inRange ? 'in   ' : 'out  ') + 'CHECK ' + row.id.padEnd(22) + row.kind.padEnd(9) + row.role.padEnd(7) + (row.band || '-').padEnd(3) + (isTime(row) ? 'T ' : '') + (bandText(row, r) + ' ' + row.unit + (isTime(row) ? '' : ', ' + when(row))).padEnd(40) +
    model.padEnd(22) + (isTime(row) ? '' : sg(r.miss, d)).padEnd(10) + reach.padEnd(9) + late.padEnd(12) + (r.note || '');
}
say('THE OBSERVATION LEDGER AGAINST THE MODEL: the 1912 damage preset at its default numbers (' + ROWS.length + ' rows; every row a CHECK; nothing is scored from it)');
say('she founders at T ' + f(Tf, 2) + '; the onset of the break at T ' + (run.onsetT === null ? 'none' : f(run.onsetT / 60, 2)) + '; ' + run.samples.length + ' samples, one every 5 s');
say('levels are metres over the row\'s place (+ up); angles degrees (trim + by the bow, list + to starboard); T minutes after the touch; "miss" is the model at the');
say('witness\'s time against the band; "reaches" when the model is first at the witness\'s level; "late" how far that lies outside the row\'s time window (+ late, - early)');
say('');
say('     ' + 'CHECK ' + 'row'.padEnd(22) + 'kind'.padEnd(9) + 'role'.padEnd(7) + 'bd'.padEnd(3) + 'the record'.padEnd(40) + 'the model'.padEnd(22) + 'miss'.padEnd(10) + 'reaches'.padEnd(9) + 'late'.padEnd(12));
ROWS.forEach((row, i) => say(line(row, RES[i])));

// ---------------------------------------------------------------- 5. the held-out table
say('');
say('THE HELD-OUT ROWS (role held: printed before and after every refit, never fitted)');
ROWS.forEach((row, i) => { if (row.role === 'held') say(line(row, RES[i])); });
{
  const held = ROWS.map((r, i) => [r, RES[i]]).filter(p => p[0].role === 'held');
  say('  in range: ' + held.filter(p => p[1].inRange).length + ' of ' + held.length);
}

// ---------------------------------------------------------------- 6. the reported rows
say('');
say('THE REPORTED ROWS (role report: beside the record, never fitted)');
ROWS.forEach((row, i) => {
  if (row.role !== 'report') return;
  const r = RES[i];
  say(line(row, r) + (row.kind === 'tonnage' ? '  (' + sg(100 * (r.model - row.value) / row.value, 1) + ' %)' : ''));
});

// ---------------------------------------------------------------- 7. the score's groups, were the ledger the score
// One term a group (the mean of its rows' terms), one-sided where the row says. A row has a term only where the ledger
// gives it a sigma in its own unit: (miss / sigma)^2, or for an interval 0 inside and (miss / its half width)^2
// outside. The sea_at rows have none yet: their sigma and disc are stage D's, so they show their lateness instead.
say('');
say('THE SCORE\'S GROUPS AS THEY WOULD READ IF THE LEDGER WERE THE SCORE (role fit; E-3\'s option 1). IT IS NOT: tools/calibrate.js reads OBS, and J is as it was');
{
  const fam = (row) => (row.band ? 'the list' : (row.kind === 'end' ? 'the end' : 'fore and aft'));
  const term = (row, r) => {
    if (row.sided === 'interval') { const h = 0.5 * (row.sigma[1] - row.sigma[0]); return h > 0 ? (r.miss / h) * (r.miss / h) : null; }
    if (typeof row.sigma === 'number' && row.sigma > 0) { const z = row.sided === 'two' ? (r.model - row.value) / row.sigma : r.miss / row.sigma; return z * z; }
    return null;
  };
  const groups = new Map();
  ROWS.forEach((row, i) => { if (row.role !== 'fit') return; if (!groups.has(row.group)) groups.set(row.group, []); groups.get(row.group).push([row, RES[i]]); });
  const sums = {}, counts = {};
  say('  ' + 'group'.padEnd(24) + 'family'.padEnd(14) + 'rows'.padEnd(30) + 'verdict'.padEnd(9) + 'term'.padEnd(8) + 'or its lateness');
  for (const [g, list] of groups) {
    const fm = fam(list[0][0]), terms = list.map(p => term(p[0], p[1])), have = terms.filter(t => t !== null);
    const t = have.length ? have.reduce((a, b) => a + b, 0) / have.length : null;
    counts[fm] = (counts[fm] || 0) + 1; if (t !== null) sums[fm] = (sums[fm] || 0) + t;
    const late = list.map(p => (p[1].late === null ? (p[0].kind === 'angle' ? sg(p[1].miss, 2) + ' deg' : 'never') : (p[1].late === 0 ? 'in time' : sg(p[1].late, 1) + ' min'))).join(', ');
    say('  ' + g.padEnd(24) + fm.padEnd(14) + list.map(p => p[0].id).join(', ').padEnd(30) + (list.every(p => p[1].inRange) ? 'in' : 'out').padEnd(9) + (t === null ? '-' : f(t, 3)).padEnd(8) + late);
  }
  say('  groups: ' + Object.keys(counts).map(k => k + ' ' + counts[k]).join(', ') + ' (today\'s score: 7 trim terms, 2 founders, 5 list terms, 3 events)');
  say('  the terms that can be written today: ' + (Object.keys(sums).length ? Object.keys(sums).map(k => k + ' ' + f(sums[k], 3)).join(', ') : 'none') + '; the fore-and-aft rows wait for stage D\'s sigma and disc');
}

// ---------------------------------------------------------------- 8. E-13: the geometry no flow number can move
say('');
say('HER TRIM WHEN THE SEA REACHES EACH MARK, beside Halpern\'s trim for the same sighting (QC E, E-13: the hull and the decks against his waterline curves)');
ROWS.forEach((row, i) => { if (row.trimWas !== undefined && row.kind === 'sea_at') say('  ' + row.id.padEnd(22) + (RES[i].trimAtReach === null ? 'never reached' : f(RES[i].trimAtReach, 2) + ' deg at T ' + f(RES[i].reach, 1)).padEnd(26) + 'Halpern ' + f(row.trimWas, 1) + ' deg at T ' + f(row.t, 0)); });

// ---------------------------------------------------------------- 9. the counts, and the suite's own rows
say('');
{
  const count = (key, names) => names.map(n => n + ' ' + ROWS.filter(r => r[key] === n).length).filter(s => !/ 0$/.test(s)).join(', ');
  say('rows by kind: ' + count('kind', L.KINDS) + '; by role: ' + count('role', L.ROLES) + '; groups: ' + new Set(ROWS.map(r => r.group)).size + '; list rows by band: ' + count('band', ['A', 'B', 'C']));
  say('in range: ' + RES.filter(r => r.inRange).length + ' of ' + RES.length + ' (fit ' + ROWS.filter((r, i) => r.role === 'fit' && RES[i].inRange).length + ' of ' + ROWS.filter(r => r.role === 'fit').length + ')');
}
// RC2 (the red team's row 22): every row has a cite, its source in plain words for the page's ledger
// (site/parts/78_ledger.js), with none of the project's working names in it: an audit, a decision, a tag, a file
{
  const WORKING = /auditor|QC |\bOBS\b|\bD\d\d\b|\be\d{2,3}\b|\[(read|bet|derived|checked|measured)|G6b|S1c|\bsigma\b|the score|tools\/|docs\/|core\//;
  const none = ROWS.filter(r => typeof r.cite !== 'string' || r.cite.length < 40), named = ROWS.filter(r => typeof r.cite === 'string' && WORKING.test(r.cite));
  must('every row has a cite: its source in plain words for the page, with no working name in it',
    (ROWS.length - none.length) + ' of ' + ROWS.length + ' rows with a cite' + (none.length ? ' (without: ' + none.map(r => r.id).join(', ') + ')' : '') + '; a working name in ' + (named.length ? named.map(r => r.id).join(', ') : 'none'),
    'every row; none', none.length === 0 && named.length === 0);
}
fs.writeFileSync(outFile('ledger_1912.txt'), lines.join('\n') + '\n');

console.log('');
for (const [what, value, ref, ok] of musts) console.log((ok ? 'PASS' : 'FAIL') + ' MUST  ' + what + ' | ' + value + ' | ' + ref);
console.log(fails ? 'FAIL: ' + fails + ' of ' + musts.length + ' MUST rows' : 'PASS: every MUST row (' + musts.length + '); ledger rows in range: ' + RES.filter(r => r.inRange).length + ' of ' + RES.length + ' (each a CHECK)');
process.exit(fails ? 1 : 0);
