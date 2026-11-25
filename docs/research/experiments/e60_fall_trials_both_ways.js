'use strict';
// e60: the fall's trials both ways (Z1, 2026-11-20). tools/fall_trials.js run twice on a tree with the mainline's tiers
// above B deck: once with the tiers' share of the section the water acts on (fall.js K.tiersFlow) at 1, the code's
// default, and once at 0, the hull's own section (the coordinator's pick, decision D52). Then the rows whose verdict
// differs. It supersedes the 08:30 dry runs with 'whole' and 'hull' sections (K.sections, since renamed K.tiersFlow).
// Found on 2026-11-20, on a read-only copy of the mainline's uncommitted tiers:
//   - share 1: three MUST rows fail (trial 6, trial 7's bow, trial 10), and every piece lands on its side;
//   - share 0: only trial 6's time fails (7.14 to 7.19 min against 4.5 to 7), and she falls keel down.
// So share 0 settles every row but trial 6's time. On a tree without the tiers the two runs are the same to the bit.
//   node docs/research/experiments/e60_fall_trials_both_ways.js [--root <tree>] [--write]
// How it sets the share: the trials run as children with this file preloaded (`node -r e60_... tools/fall_trials.js`).
// The preload sets the share in fall.js's K0 before the trials load it; E60_SHARE and E60_ROOT carry the share and the tree.
// Output of 2026-11-20: results_2026-11-20/e60_fall_trials_both_ways.txt, and beside it the two tables
// (e60_fall_trials_share1.txt and e60_fall_trials_share0.txt).
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
if (process.env.E60_SHARE !== undefined && require.main !== module) {
  // preloaded into a trials run: the share goes into K0 before tools/fall_trials.js requires fall.js (the same module)
  require(path.join(process.env.E60_ROOT, 'core/readers/fall.js')).K0.tiersFlow = +process.env.E60_SHARE;
  return;
}
const argv = process.argv.slice(2), WRITE = argv.includes('--write'), ri = argv.indexOf('--root');
const ROOT = ri >= 0 ? path.resolve(argv[ri + 1]) : path.resolve(__dirname, '../../..');
const out = [], say = (s) => { s = s === undefined ? '' : s; out.push(s); console.log(s); };
const tables = {};
for (const share of [1, 0]) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'e60-'));
  const r = cp.spawnSync(process.execPath, ['-r', __filename, path.join(ROOT, 'tools/fall_trials.js')], {
    cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28,
    env: Object.assign({}, process.env, { TITANIC_OUT: tmp, E60_SHARE: String(share), E60_ROOT: ROOT }),
  });
  const file = path.join(tmp, 'fall_trials.txt');
  if (!fs.existsSync(file)) { console.error(r.stdout); console.error(r.stderr); throw new Error('e60: the trials wrote no table at share ' + share); }
  tables[share] = fs.readFileSync(file, 'utf8');
  fs.rmSync(tmp, { recursive: true, force: true });
}
const A = tables[1].split(/\r?\n/), B = tables[0].split(/\r?\n/);
const word = (l) => ((/^\s*(PASS|FAIL|in|OUT)\b/.exec(l || '') || [])[1] || '');
const verdict = (L) => L.filter(l => l.trim()).slice(-1)[0];
say('e60: the fall\'s trials with the tiers\' share of the section at 1 and at 0 (fall.js K.tiersFlow, D52)');
say('tree: ' + (ri >= 0 ? path.basename(ROOT) + ' (given by --root)' : 'this repository'));
say('share 1: ' + verdict(A));
say('share 0: ' + verdict(B));
if (A.length !== B.length) say('(the two tables differ in length: ' + A.length + ' and ' + B.length + ' lines; rows are compared by line)');
say('');
say('the rows whose verdict differs (share 1 -> share 0), each with its value both ways:');
// a row is the verdict (5 characters), what (112), a space, the value (80), a space, the reference (tools/fall_trials.js)
const what = (l) => (l || '').slice(5, 117).trim(), value = (l) => (l || '').slice(118, 198).trim();
let nd = 0;
for (let i = 0; i < Math.max(A.length, B.length); i++) {
  const a = word(A[i]), b = word(B[i]);
  if (a !== b) {
    nd++;
    say('  ' + (a || '-').padEnd(4) + ' -> ' + (b || '-').padEnd(4) + ' ' + what(B[i] || A[i]));
    say('      share 1: ' + value(A[i]));
    say('      share 0: ' + value(B[i]));
  }
}
if (!nd) say('  none: the share changes no verdict on this tree');
if (WRITE) {
  const d = path.join(__dirname, 'results_2026-11-20');
  fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, 'e60_fall_trials_both_ways.txt'), out.join('\n') + '\n');
  fs.writeFileSync(path.join(d, 'e60_fall_trials_share1.txt'), tables[1]);
  fs.writeFileSync(path.join(d, 'e60_fall_trials_share0.txt'), tables[0]);
}
