// e107: the calibration epoch's M3, stage B's proof (docs/DESIGN_calibration_epoch_v1_1_2026-11-21.md, section 2, B1).
// Is the model's own pow (C.pow: fdlibm's e_pow.c in plain doubles, U0's E2a) the routine V8 keeps beside the C
// runtime's? Node v26.13.0 lists "--use-std-math-pow (use std::pow instead of our custom implementation)", default on,
// so plain Node's Math.pow is the C runtime's, and `node --no-use-std-math-pow` gives V8's own. Run it both ways:
//   node --no-use-std-math-pow docs/research/experiments/e107_epoch_m3_pow.js [--ef DIR] [--pre DIR] [--write]
//   node docs/research/experiments/e107_epoch_m3_pow.js [--ef DIR] [--pre DIR] [--write]
// Part 1: ten million inputs in the four forms core/core.js uses: the hull form's u^n (u in [0, 1), n over nBlend's
// range and a little beyond), the submerged weir's r^1.5 and its (1 - r^1.5)^0.385, and the damping's x^4.
// Part 2: every Math.pow call the model makes as it runs, recorded, each checked against C.pow: ef60334's three seams
// scenarios (--ef, a checkout of ef60334, run as the seams gate froze them, each with its digest), and the code before
// B1 (--pre, a checkout of it): the 1912 preset and the 1912 watch as they are by default (the watch's fingerprint).
// Under the flag every row had to read 0 differ for B1's reference to be made from ef60334 itself with the flag (B1's
// step 1 as the design wrote it).
//
// THE RESULT (2026-11-21 11:2x, the mainline): M3 FAILS. V8's own pow on this build is not fdlibm's: under the flag it
// differs from C.pow on about 4.5 % of part 1's inputs and on 3.2 to 4.5 % of the model's own calls, one ulp at most
// (plain Node's std::pow on about 10 %). So B1's proof does not use the flag. It puts C.pow itself in Math.pow's place
// in the old code (tools/pow_preload.js, preloaded with node -r), which runs the old code with exactly B1's routine:
//   1. the reference: in a checkout of ef60334 with 2da3c47's tools/seams.js,
//        node -r <B1 tree>/tools/pow_preload.js tools/seams.js --freeze
//      (the same command without the preload reproduces the reference frozen at P0, to the bit);
//   2. MUST: the B1 tree, plain Node: node tools/seams.js against it;
//   3. MUST: the commit before B1 with the preload against B1's new references: tools/astern_tests.js (the headway
//      reference copied in), the 1912 watch's fingerprint as tools/systems_tests.js's BASE runs it, and tools/golden.js's
//      file byte for byte. All three held (B1's commit message has the numbers).
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');
try { os.setPriority(0, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch (e) {}
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const EF = path.resolve(arg('--ef', 'C:/temp/titanic-b1-ef60334')), PRE = path.resolve(arg('--pre', 'C:/temp/titanic-wt-epoch-c3'));
const FLAG = process.execArgv.includes('--no-use-std-math-pow');
const P0 = Math.pow;                                    // this engine's, before part 2 wraps it
const CP = require('../../../core/core.js').pow;        // the model's
const out = [], log = (s) => { out.push(s); console.log(s); };
const F = new Float64Array(1), B = new BigInt64Array(F.buffer);
const bits = (x) => { F[0] = x; return B[0]; };
const ulps = (a, b) => { const d = bits(a) - bits(b); return d < 0n ? -d : d; };   // both results here are >= 0
const t0 = Date.now();
log('e107 (the epoch, M3): C.pow against this engine\'s Math.pow; ' + process.version + ', ' +
  (FLAG ? 'node --no-use-std-math-pow (V8\'s own pow)' : 'plain node (std::pow, the C runtime\'s)'));

// Part 1: the four forms, 2.5 million each, from a fixed generator of 53-bit uniforms
log('Part 1: ten million inputs in the four forms of core/core.js');
let s = 107;
const r32 = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s; };
const rnd = () => (r32() * 2097152 + (r32() >>> 11)) / 9007199254740992;              // [0, 1), every bit drawn
const FORMS = [
  ['the hull form u^n: u in [0, 1), n in [0.9, 3.1) (nBlend 0.947 to 3.0)', () => [rnd(), 0.9 + 2.2 * rnd()]],
  ['the submerged weir r^1.5: r in [0, 1)', () => [rnd(), 1.5]],
  ['the submerged weir (1 - r^1.5)^0.385: in [0, 1)', () => [rnd(), 0.385]],
  ['the damping x^4: x in [0, 300)', () => [300 * rnd(), 4]],
];
const N1 = 2500000;
let diff1 = 0;
for (const [what, gen] of FORMS) {
  const o = new Float64Array(N1); let d = 0, worst = 0n;
  for (let i = 0; i < N1; i++) {
    const [x, y] = gen(), c = CP(x, y), m = P0(x, y); o[i] = c;
    if (!Object.is(c, m)) { d++; const u = ulps(c, m); if (u > worst) worst = u; }
  }
  diff1 += d;
  const h = crypto.createHash('sha256').update(Buffer.from(o.buffer)).digest('hex').slice(0, 16);
  log('  ' + what.padEnd(70) + String(d).padStart(9) + ' of ' + N1.toLocaleString('en-US') + ' differ' +
    (d ? ' (' + (100 * d / N1).toFixed(2) + ' %, at most ' + worst + ' ulp)' : '') + '; C.pow\'s results hash ' + h);
}

// Part 2: the model's own calls, recorded as it runs (the wrapper returns this engine's value, so the run is unchanged)
log('Part 2: every Math.pow call the model makes, recorded as it runs, against C.pow');
let rec = new Float64Array(1 << 22), nr = 0, diff2 = 0, calls2 = 0;
Math.pow = function pow(x, y) {
  if (nr + 2 > rec.length) { const t = new Float64Array(rec.length * 2); t.set(rec); rec = t; }
  rec[nr++] = x; rec[nr++] = y; return P0(x, y);
};
function check(what) {
  let d = 0, worst = 0n;
  for (let i = 0; i < nr; i += 2) { const c = CP(rec[i], rec[i + 1]), m = P0(rec[i], rec[i + 1]); if (!Object.is(c, m)) { d++; const u = ulps(c, m); if (u > worst) worst = u; } }
  log('  ' + what.padEnd(100) + String(d).padStart(9) + ' of ' + (nr / 2).toLocaleString('en-US') + ' calls differ' +
    (d ? ' (' + (200 * d / nr).toFixed(2) + ' %, at most ' + worst + ' ulp)' : ''));
  diff2 += d; calls2 += nr / 2; nr = 0;
}
const CE = require(path.join(EF, 'core', 'core.js')), SE = require(path.join(EF, 'core', 'scenarios.js'));
for (const [key, tMax] of [['titanic', 4 * 3600], ['britannic', 4 * 3600], ['hawke', 4 * 3600]]) {
  nr = 0;
  const sim = CE.createSim(CE.buildShip(), {}, SE.PRESETS[key].build());    // as tools/seams.js at 2da3c47 froze it
  const h = crypto.createHash('sha256'), buf = new Float64Array(64 + 7);
  let steps = 0;
  while (!sim.foundered && sim.t < tMax) {
    CE.step(sim); steps++;
    buf.set(sim.vol, 0);
    buf[64] = sim.zO; buf[65] = sim.pitch; buf[66] = sim.roll; buf[67] = sim.vz; buf[68] = sim.wth; buf[69] = sim.wph; buf[70] = sim.inflow;
    h.update(Buffer.from(buf.buffer)); h.update(sim.foundered ? 'F' : 'a');
  }
  check('ef60334, the seams scenario ' + key.padEnd(9) + ': ' + String(steps).padStart(5) + ' steps, digest ' + h.digest('hex').slice(0, 16));
}
const CPR = require(path.join(PRE, 'core', 'core.js')), SPR = require(path.join(PRE, 'core', 'scenarios.js')), NPR = require(path.join(PRE, 'core', 'night.js'));
{
  nr = 0;
  const sim = CPR.createSim(CPR.buildShip(), {}, SPR.PRESETS.titanic.build());   // as tools/golden.js runs it
  while (!sim.foundered && sim.t < 5 * 3600) CPR.step(sim);
  check('the code before B1, the 1912 preset: founders at ' + sim.founderT + ' s (' + (sim.founderT / 60).toFixed(4) + ' min)');
}
{
  nr = 0;
  const w = NPR.sink(NPR.create(CPR.buildShip(), NPR.spec(1912), { auto: true }));   // as tools/systems_tests.js's BASE
  check('the code before B1, the 1912 watch: fingerprint ' + NPR.fingerprint(w) + ' at step ' + w.night.k + ', founders at ' + w.founderT + ' s');
}
Math.pow = P0;
log('Total: part 1 ' + diff1 + ' of ' + (4 * N1).toLocaleString('en-US') + ' differ; part 2 ' + diff2 + ' of ' + calls2.toLocaleString('en-US') +
  ' of the model\'s own calls differ' + (FLAG ? (diff1 + diff2 === 0 ? ': C.pow is V8\'s own pow on every input tried (M3 holds)' : ': M3 FAILS, V8\'s own pow is not fdlibm\'s here (B1\'s proof preloads C.pow instead: tools/pow_preload.js)') : ''));
log('(' + ((Date.now() - t0) / 1000).toFixed(1) + ' s; ef60334 from ' + EF + ', the code before B1 from ' + PRE + ')');
if (process.argv.includes('--write')) {
  const dir = path.join(__dirname, 'results_2026-11-21'); if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'e107_epoch_m3_pow_' + (FLAG ? 'flag' : 'plain') + '.txt'), out.join('\n') + '\n(' + new Date().toISOString() + ')\n');
}
process.exit(0);                                        // a finding either way, not a test
