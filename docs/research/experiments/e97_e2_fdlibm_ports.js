// e97 (E2's groundwork): fdlibm's pow, exp, log, log10, tan and atan2, and hypot two ways (e97_e2_fdlibm_ports_lib.js),
// each proved against this engine's own Math over a million inputs in the ranges the model uses, and their results
// frozen as a hash, as E1 did for sine and cosine (tools/engine_tests.js).
//   node docs/research/experiments/e97_e2_fdlibm_ports.js            the proof; writes its table to
//                                                                     results_2026-11-21/e97_e2_fdlibm_ports.txt
// The ranges, read from the model's own calls (main 7966a23):
//   pow    core.js 243/247: u in [0, 1] to nBlend's exponent (0.947 to 3.0); 1101: r^1.5 and (1 - r^1.5)^0.385, r in
//          [0, 1] (in the step); 1365/1366: her half-length and half-beam to the 4th (set-up); section.js 221, 314, 592:
//          squares; 376: a ratio to Q_SHED = 0.5. Also general and negative bases, for the port's own sake.
//   exp    motion.js 272: exp(-4 b^2); 400: exp(-k d), d >= 0; people.js 200: a logistic; 285, 300, 482: exp(-t/tau).
//   log    fall.js 167: aspect ratios against the table's, a ratio of two logs.
//   log10  fall.js 831: a strain rate over its reference, >= 1.
//   tan    fall.js 253: the bed's slope (0.5 degree); core.js 1345: the coal list (2 degrees). Also to pi/2 and beyond.
//   atan2  fall.js 1219: a rotation's entries in [-1, 1]; motion.js 243, 271, 435: speeds; encounter.js 230, night.js
//          261, world.js 215: offsets in metres, to a million.
//   hypot  section.js 280, 286: steps along her girth, hundredths of a metre to a metre.
// What it says: for each function, how many inputs give another double than Node's Math, the first of them, and the
// hash of the port's results. A port that equals Node's on every input can go into the model without moving a bit of
// Node's references, as E1's did.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const E = require('./e97_e2_fdlibm_ports_lib.js');

const N = 1000000;
const FROZEN = {                                     // the ports' results over this file's inputs (Node v26.13.0, 2026-11-21)
  exp: '91224d24696d71ed', log: 'aa8fd8bd4909d816', log10: '1bcd061106e20681', log10Fbsd: '6f7c616f38dbd58e',
  tan: 'dca7e95d47d314a7', atan2: '12035e7819693537', pow: 'd57f7b8a8fb00e58', hypot: '9a271bf952f9b181',
  hypotV8: '89cd24a778cb69f5',
};
let s = 2463534242;                                  // E1's xorshift
const seed = (v) => { s = v >>> 0; };
const rnd = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
const sgn = () => (rnd() < 0.5 ? -1 : 1);
// a magnitude spread evenly in its logarithm from 10^lo to 10^hi, built from its bits (scalbn: exact), so that the
// inputs, and so the frozen hash, are the same in every engine
const LOG2_10 = 3.321928094887362;
const tenTo = (lo, hi) => { const e = Math.floor((lo + (hi - lo) * rnd()) * LOG2_10); return E.scalbn(1 + rnd(), e); };

const EDGE = [0, -0, 1, -1, 2, -2, 0.5, -0.5, 3, 10, 100, 0.1, 1e-10, 1e-300, 1e300, Number.MIN_VALUE, -Number.MIN_VALUE,
  2.2250738585072014e-308, Number.MAX_VALUE, Math.PI, Math.PI / 2, Math.PI / 4, Math.E, 709.782712893384, -745.1332191019411,
  Infinity, -Infinity, NaN];
const EDGE2 = [0, -0, 1, -1, 2, 0.5, -0.5, 1e-300, 1e300, Number.MIN_VALUE, Infinity, -Infinity, NaN, 3, -3, 1.5, 0.385];

// the inputs: one or two Float64Arrays a function, the edges first
function inputs1(seedV, gen) {
  seed(seedV);
  const x = new Float64Array(EDGE.length + N);
  EDGE.forEach((v, i) => { x[i] = v; });
  for (let i = 0; i < N; i++) x[EDGE.length + i] = gen(i);
  return [x];
}
function inputs2(seedV, gen) {
  seed(seedV);
  const n0 = EDGE2.length * EDGE2.length, a = new Float64Array(n0 + N), b = new Float64Array(n0 + N);
  let k = 0;
  for (const u of EDGE2) for (const v of EDGE2) { a[k] = u; b[k] = v; k++; }
  for (let i = 0; i < N; i++) { const [u, v] = gen(i); a[n0 + i] = u; b[n0 + i] = v; }
  return [a, b];
}
const nBlendLike = () => 0.9 + 2.2 * rnd();
const CASES = [
  ['exp', 'Math.exp', E.exp, Math.exp, inputs1(101, (i) => [() => 120 * rnd() - 60, () => -745 * rnd(), () => (2 * rnd() - 1) * 1e-3,
    () => 709.7 * rnd(), () => (2 * rnd() - 1) * 2, () => { const r = Math.PI * rnd(); return -4 * r * r; }][i % 6]())],
  ['log', 'Math.log', E.log, Math.log, inputs1(102, (i) => [() => tenTo(-6, 6), () => 1 + (2 * rnd() - 1) * 1e-3, () => 100 * rnd(),
    () => tenTo(-300, 300)][i % 4]())],
  ['log10', 'Math.log10', E.log10, Math.log10, inputs1(103, (i) => [() => tenTo(0, 9), () => tenTo(-6, 6), () => 1 + 1e-2 * rnd(),
    () => tenTo(-300, 300)][i % 4]())],
  ['log10Fbsd', 'Math.log10', E.log10Fbsd, Math.log10, null],                     // the same inputs as log10
  ['tan', 'Math.tan', E.tan, Math.tan, inputs1(104, (i) => [() => 0.1 * rnd(), () => (2 * rnd() - 1) * Math.PI / 4,
    () => (2 * rnd() - 1) * 1.57, () => (2 * rnd() - 1) * 100][i % 4]())],
  ['atan2', 'Math.atan2', E.atan2, Math.atan2, inputs2(105, (i) => [() => [sgn() * tenTo(-6, 6), sgn() * tenTo(-6, 6)],
    () => [2 * rnd() - 1, 2 * rnd() - 1], () => [30 * rnd() - 15, 30 * rnd() - 15], () => [2e6 * rnd() - 1e6, 2e6 * rnd() - 1e6],
    () => [sgn() * tenTo(-20, 20), sgn() * tenTo(-20, 20)]][i % 5]())],
  ['pow', 'Math.pow', E.pow, Math.pow, inputs2(106, (i) => [() => [rnd(), nBlendLike()], () => [rnd(), 1.5], () => [rnd(), 0.385],
    () => [[300 * rnd(), 120 + 30 * rnd(), 10 + 8 * rnd()][i % 3], 4], () => [1 + 49 * rnd(), 2], () => [10 * rnd(), 0.5],
    () => [tenTo(-2, 2), 20 * rnd() - 10], () => [-10 * rnd(), Math.floor(11 * rnd()) - 5]][i % 8]())],
  ['hypot', 'Math.hypot', E.hypot, Math.hypot, inputs2(107, (i) => [() => [2 * rnd(), 2 * rnd()], () => [0.05 * rnd(), 0.01],
    () => [sgn() * tenTo(-6, 6), sgn() * tenTo(-6, 6)], () => [1e-3 * rnd(), 2 * rnd()]][i % 4]())],
  ['hypotV8', 'Math.hypot', E.hypotV8, Math.hypot, null],                         // the same inputs as hypot
];
CASES.forEach((c, i) => { if (!c[4]) c[4] = CASES[i - 1][4]; });

// how far apart two doubles are, in units in the last place
const FB = new Float64Array(1), BI = new BigInt64Array(FB.buffer);
const ord = (v) => { FB[0] = v; const b = BI[0]; return b < 0n ? -(b & 0x7fffffffffffffffn) : b; };
const ulps = (a, b) => { if (a !== a || b !== b) return (a !== a) === (b !== b) ? 0n : -1n; const d = ord(a) - ord(b); return d < 0n ? -d : d; };
const hex = (v) => { FB[0] = v; return '0x' + BigInt.asUintN(64, BI[0]).toString(16).padStart(16, '0'); };

const lines = [], rows = []; let fails = 0;
const say = (t) => { lines.push(t); console.log(t); };
function row(kind, what, value, ref, ok) { rows.push(ok); if (!ok && kind === 'MUST') fails++; say((ok ? 'PASS ' : (kind === 'MUST' ? 'FAIL ' : 'CHECK ')) + kind.padEnd(6) + what.padEnd(72) + ' ' + String(value).padEnd(44) + ' ' + ref); }

say('e97: fdlibm\'s ports against ' + process.version + ' (V8 ' + process.versions.v8 + '), ' + N.toLocaleString('en-US') + ' inputs a function and the edges');
const results = {};
for (const [name, mathName, port, math, ins] of CASES) {
  const t0 = Date.now(), n = ins[0].length, out = new Float64Array(n);
  let differ = 0, worst = 0n; const first = [];
  for (let i = 0; i < n; i++) {
    const a = ins[0][i], b = ins.length > 1 ? ins[1][i] : undefined;
    const p = ins.length > 1 ? port(a, b) : port(a), m = ins.length > 1 ? math(a, b) : math(a);
    out[i] = p;
    if (!Object.is(p, m)) {
      differ++;
      const u = ulps(p, m);
      if (u > worst || u < 0n) worst = u < 0n ? 9999n : u;
      if (first.length < 6) first.push((ins.length > 1 ? '(' + a + ', ' + b + ')' : '(' + a + ')') + ' ' + (ins.length > 1 ? hex(a) + ' ' + hex(b) : hex(a)) + ': port ' + p + ', ' + mathName + ' ' + m + ' (' + u + ' ulp)');
    }
  }
  const h = crypto.createHash('sha256').update(Buffer.from(out.buffer)).digest('hex').slice(0, 16);
  results[name] = { differ, worst: Number(worst), first, hash: h, n, ms: Date.now() - t0, out, ins };
  row('CHECK', name + ': against ' + mathName + ' on ' + n.toLocaleString('en-US') + ' inputs (the edges with them)', differ + ' differ' + (differ ? ', the most ' + worst + ' ulp' : ''), '0 differ: Node\'s bits, unmoved', differ === 0);
  for (const f of first) say('       ' + f);
  if (FROZEN[name]) row('MUST', '  ... ' + name + '\'s results hash as when frozen', h, FROZEN[name], h === FROZEN[name]);
  else say('       ' + name + '\'s results hash ' + h + ' (not frozen yet)');
}
// the ports the model would take: each equal to Node's Math everywhere here, but pow, which V8 does not take from
// fdlibm (its Math.pow is the C runtime's: README), so that its port moves Node's bits wherever the two part; it is
// held to fdlibm's own results below, and to within one ulp of Node's here
const take = { pow: 'pow', exp: 'exp', log: 'log', log10: results.log10.differ <= results.log10Fbsd.differ ? 'log10' : 'log10Fbsd', tan: 'tan', atan2: 'atan2', hypot: results.hypotV8.differ <= results.hypot.differ ? 'hypotV8' : 'hypot' };
for (const [fn, port] of Object.entries(take)) {
  if (fn === 'pow') row('MUST', 'Math.pow: the port to take (pow, fdlibm\'s) within one ulp of Node\'s (the C runtime\'s) everywhere here', results.pow.differ + ' differ, the most ' + results.pow.worst + ' ulp', 'at most 1 ulp', results.pow.worst <= 1);
  else row('MUST', 'Math.' + fn + ': the port to take (' + port + ') equals Node\'s on every input here', results[port].differ + ' differ', '0', results[port].differ === 0);
}

// ---- fdlibm's own results: Java's StrictMath (fdlibm 5.3's by the Java specification), on the same inputs
const os = require('os');
const { spawnSync } = require('child_process');
const JAVA = process.env.JAVA || ['C:\\Program Files\\Android\\Android Studio\\jbr\\bin\\java.exe'].find((p) => fs.existsSync(p));
const FDLIBM = ['exp', 'log', 'log10', 'tan', 'atan2', 'pow', 'hypot'];
if (!JAVA) row('CHECK', 'fdlibm\'s own results (Java\'s StrictMath): no Java here (set JAVA)', 'not run', 'every port equals fdlibm\'s', false);
else {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'e97-'));
  try {
    for (const f of FDLIBM) {
      const ins = results[f].ins;
      if (ins.length === 1) fs.writeFileSync(path.join(tmp, f + '.x'), Buffer.from(ins[0].buffer));
      else { fs.writeFileSync(path.join(tmp, f + '.a'), Buffer.from(ins[0].buffer)); fs.writeFileSync(path.join(tmp, f + '.b'), Buffer.from(ins[1].buffer)); }
    }
    const r = spawnSync(JAVA, [path.join(__dirname, 'e97_e2_fdlibm_ref.java'), tmp], { encoding: 'utf8', maxBuffer: 1 << 24 });
    const ok = r.status === 0 && /E97REF_OK/.test(r.stdout);
    say((ok ? '' : 'the Java run failed: ' + (r.stderr || r.stdout || r.error).toString().split('\n').slice(0, 3).join(' | ') + '\n') + 'fdlibm\'s own results: ' + (r.stdout || '').trim());
    for (const f of FDLIBM) {
      if (!ok) { row('MUST', f + ': the port equals fdlibm\'s own (Java\'s StrictMath) on every input', 'not run', '0 differ', false); continue; }
      const buf = fs.readFileSync(path.join(tmp, f + '.java')), ref = new Float64Array(buf.buffer, buf.byteOffset, buf.length / 8), out = results[f].out, ins = results[f].ins;
      let differ = 0; const first = [], at = [];
      for (let i = 0; i < out.length; i++) {
        if (Object.is(out[i], ref[i])) continue;
        differ++; at.push(ins.length > 1 ? [ins[0][i], ins[1][i]] : [ins[0][i]]);
        if (first.length < 4) first.push('(' + at[at.length - 1].join(', ') + '): port ' + out[i] + ', StrictMath ' + ref[i] + ' (' + ulps(out[i], ref[i]) + ' ulp)');
      }
      // V8's two changes to fdlibm 5.3 (the lib's comments), and nothing else: exp(1) is e's own double; atan2 with
      // |y/x| > 2^60 is +-pi/2 whatever x's sign (fdlibm 5.3 gives one ulp more there when x < 0)
      const steep = (a) => ((E.HI(a[0]) & 0x7fffffff) - (E.HI(a[1]) & 0x7fffffff)) >> 20 > 60 && a[1] < 0;
      const allowed = f === 'exp' ? at.every((a) => a[0] === 1) : (f === 'atan2' ? at.every(steep) : differ === 0);
      const but = f === 'exp' ? ', but exp(1)' : (f === 'atan2' ? ', but where |y/x| > 2^60 and x < 0' : '');
      row('MUST', f + ': the port equals fdlibm\'s own (Java\'s StrictMath) on every input' + but, differ + ' differ' + (f === 'exp' && differ ? ' (x = 1: V8\'s e)' : (f === 'atan2' && differ ? ', each |y/x| > 2^60 with x < 0' : '')), but ? 'none but those' : '0 differ', allowed);
      for (const t of first) say('       ' + t);
    }
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}
say('');
say(fails ? 'FAIL: ' + fails + ' MUST row(s)' : 'PASS: all MUST rows. Every port is fdlibm\'s own; all but pow equal Node\'s Math on every input' + (Object.values(FROZEN).some(Boolean) ? '; the hashes are as frozen' : ''));
const dir = path.join(__dirname, 'results_2026-11-21');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'e97_e2_fdlibm_ports.txt'), lines.join('\n') + '\n');
process.exit(fails ? 1 : 0);
