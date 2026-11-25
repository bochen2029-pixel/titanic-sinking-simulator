// e98 (E2's groundwork, after e97): fdlibm's tanh (with expm1), asin, acos and cbrt (e98_e2_fdlibm_more_lib.js), each
// proved against this engine's own Math and against fdlibm's own results (Java's StrictMath) over a million inputs in
// the ranges the model uses, and their results frozen as a hash, as e97.
//   node docs/research/experiments/e98_e2_fdlibm_more.js      writes its table to results_2026-11-21/e98_e2_fdlibm_more.txt
// The ranges (main 7966a23): tanh, the contact's slip over 0.1 m/s (encounter.js 325), so tens and past 22, where it is
// +-1; acos, a disc's share under water, d/R in (-1, 1) (systems.js 184); cbrt, the steam's share over the engines'
// pressure, (0, 1) (systems.js 252); asin, her trim from her drafts, a few thousandths (core.js 1331). Each also over
// its whole range and its edges, for the port's own sake. A port that equals Node's on every input is neutral in Node:
// wiring it in moves none of Node's bits.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const E = require('./e98_e2_fdlibm_more_lib.js');
const E97 = require('./e97_e2_fdlibm_ports_lib.js');

const N = 1000000;
const FROZEN = {                                     // the ports' results over this file's inputs (Node v26.13.0, 2026-11-21)
  expm1: 'a446bd79d16883a7', tanh: '17ba51f4a1fa7457', asin: 'b47ea762c4662fe9', acos: '616b0c936b30790c',
  cbrt: 'dc60426dbc0d2cfe', cbrtFdlibm53: '620437aef64049d6',
};
let s = 2463534242;
const seed = (v) => { s = v >>> 0; };
const rnd = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
const sgn = () => (rnd() < 0.5 ? -1 : 1);
const LOG2_10 = 3.321928094887362;
const tenTo = (lo, hi) => { const e = Math.floor((lo + (hi - lo) * rnd()) * LOG2_10); return E97.scalbn(1 + rnd(), e); };
const EDGE = [0, -0, 1, -1, 2, -2, 0.5, -0.5, 0.975, -0.975, 3, 10, 22, -22, 100, 0.1, 1e-10, 1e-300, 1e300,
  Number.MIN_VALUE, -Number.MIN_VALUE, 2.2250738585072014e-308, Number.MAX_VALUE, Math.PI, Math.E, 709.782712893384,
  -745.1332191019411, 1 - Number.EPSILON / 2, -1 + Number.EPSILON / 2, Infinity, -Infinity, NaN];
function inputs(seedV, gen) {
  seed(seedV);
  const x = new Float64Array(EDGE.length + N);
  EDGE.forEach((v, i) => { x[i] = v; });
  for (let i = 0; i < N; i++) x[EDGE.length + i] = gen(i);
  return x;
}
const nearOne = () => sgn() * (1 - tenTo(-16, -1) * rnd());
const CASES = [
  ['expm1', 'Math.expm1', E.expm1, Math.expm1, inputs(201, (i) => [() => 80 * rnd() - 40, () => sgn() * tenTo(-20, -1),
    () => -745 * rnd(), () => 709.7 * rnd(), () => 2 * rnd() - 1][i % 5]())],
  ['tanh', 'Math.tanh', E.tanh, Math.tanh, inputs(202, (i) => [() => 10 * rnd() - 5, () => 60 * rnd() - 30,
    () => 240 * rnd() - 120, () => sgn() * tenTo(-20, -1), () => (2 * rnd() - 1) * 1.2][i % 5]())],
  ['asin', 'Math.asin', E.asin, Math.asin, inputs(203, (i) => [() => 2 * rnd() - 1, nearOne, () => sgn() * tenTo(-20, -1),
    () => (2 * rnd() - 1) * 0.02][i % 4]())],
  ['acos', 'Math.acos', E.acos, Math.acos, inputs(204, (i) => [() => 2 * rnd() - 1, nearOne, () => sgn() * tenTo(-20, -1),
    () => (2 * rnd() - 1) * 0.02][i % 4]())],
  ['cbrt', 'Math.cbrt', E.cbrt, Math.cbrt, inputs(205, (i) => [() => rnd(), () => sgn() * tenTo(-300, 300),
    () => sgn() * E97.scalbn(1 + rnd(), -1023 - Math.floor(51 * rnd())), () => 1000 * rnd()][i % 4]())],
  ['cbrtFdlibm53', 'Math.cbrt', E.cbrtFdlibm53, Math.cbrt, null],               // the same inputs as cbrt
];
CASES.forEach((c, i) => { if (!c[4]) c[4] = CASES[i - 1][4]; });

const FB = new Float64Array(1), BI = new BigInt64Array(FB.buffer);
const ord = (v) => { FB[0] = v; const b = BI[0]; return b < 0n ? -(b & 0x7fffffffffffffffn) : b; };
const ulps = (a, b) => { if (a !== a || b !== b) return (a !== a) === (b !== b) ? 0n : -1n; const d = ord(a) - ord(b); return d < 0n ? -d : d; };
const lines = []; let fails = 0;
const say = (t) => { lines.push(t); console.log(t); };
function row(kind, what, value, ref, ok) { if (!ok && kind === 'MUST') fails++; say((ok ? 'PASS ' : (kind === 'MUST' ? 'FAIL ' : 'CHECK ')) + kind.padEnd(6) + what.padEnd(78) + ' ' + String(value).padEnd(40) + ' ' + ref); }
function compare(out, ref, x) {
  let differ = 0, worst = 0n; const first = [];
  for (let i = 0; i < out.length; i++) {
    if (Object.is(out[i], ref[i])) continue;
    differ++;
    const u = ulps(out[i], ref[i]);
    if (u < 0n || u > worst) worst = u < 0n ? 9999n : u;
    if (first.length < 5) first.push('(' + x[i] + '): port ' + out[i] + ', other ' + ref[i] + ' (' + u + ' ulp)');
  }
  return { differ, worst: Number(worst), first };
}

say('e98: fdlibm\'s ports against ' + process.version + ' (V8 ' + process.versions.v8 + '), ' + N.toLocaleString('en-US') + ' inputs a function and the edges');
const results = {};
for (const [name, mathName, port, math, x] of CASES) {
  const out = new Float64Array(x.length), node = new Float64Array(x.length);
  for (let i = 0; i < x.length; i++) { out[i] = port(x[i]); node[i] = math(x[i]); }
  const c = compare(out, node, x), h = crypto.createHash('sha256').update(Buffer.from(out.buffer)).digest('hex').slice(0, 16);
  results[name] = Object.assign(c, { out, x, hash: h });
  row('CHECK', name + ': against ' + mathName + ' on ' + x.length.toLocaleString('en-US') + ' inputs (neutral in Node when 0)', c.differ + ' differ' + (c.differ ? ', the most ' + c.worst + ' ulp' : ''), '0 differ', c.differ === 0);
  for (const f of c.first) say('       ' + f);
  if (FROZEN[name]) row('MUST', '  ... ' + name + '\'s results hash as when frozen', h, FROZEN[name], h === FROZEN[name]);
  else say('       ' + name + '\'s results hash ' + h + ' (not frozen yet)');
}

const JAVA = process.env.JAVA || ['C:\\Program Files\\Android\\Android Studio\\jbr\\bin\\java.exe'].find((p) => fs.existsSync(p));
const FDLIBM = { expm1: 'expm1', tanh: 'tanh', asin: 'asin', acos: 'acos', cbrtFdlibm53: 'cbrt', cbrt: 'cbrt' };
if (!JAVA) row('MUST', 'fdlibm\'s own results (Java\'s StrictMath): no Java here (set JAVA)', 'not run', 'every port equals fdlibm\'s', false);
else {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'e98-'));
  try {
    for (const f of ['expm1', 'tanh', 'asin', 'acos', 'cbrt']) fs.writeFileSync(path.join(tmp, f + '.x'), Buffer.from(results[f].x.buffer));
    const r = spawnSync(JAVA, [path.join(__dirname, 'e98_e2_fdlibm_more_ref.java'), tmp], { encoding: 'utf8' });
    const ok = r.status === 0 && /E98REF_OK/.test(r.stdout);
    say('fdlibm\'s own results: ' + (ok ? r.stdout.trim() : 'the Java run failed: ' + String(r.stderr || r.error).split('\n').slice(0, 3).join(' | ')));
    for (const [name, file] of Object.entries(FDLIBM)) {
      if (!ok) { row('MUST', name + ': against fdlibm\'s own (Java\'s StrictMath)', 'not run', '0 differ', false); continue; }
      const buf = fs.readFileSync(path.join(tmp, file + '.java')), ref = new Float64Array(buf.buffer, buf.byteOffset, buf.length / 8);
      const c = compare(results[name].out, ref, results[name].x);
      // V8's cbrt is FreeBSD's rewrite, not fdlibm 5.3's: against StrictMath it is shown, not held. V8's tanh returns
      // x itself below 2^-28 (FreeBSD's change, the lib's comment): those inputs alone may differ
      let ok2 = c.differ === 0;
      if (name === 'tanh') { ok2 = true; const x = results.tanh.x, out = results.tanh.out; for (let i = 0; i < x.length; i++) if (!Object.is(out[i], ref[i]) && !((E.HI(x[i]) & 0x7fffffff) < 0x3e300000)) ok2 = false; }
      row(name === 'cbrt' ? 'CHECK' : 'MUST', name + ': against fdlibm\'s own (Java\'s StrictMath)' + (name === 'cbrt' ? ' (V8\'s is FreeBSD\'s rewrite)' : (name === 'tanh' ? ', but |x| < 2^-28 (V8: x itself)' : '')), c.differ + ' differ' + (c.differ ? ', the most ' + c.worst + ' ulp' : ''), name === 'tanh' ? 'none but those' : '0 differ', ok2);
      for (const f of c.first) say('       ' + f);
    }
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}
const neutral = ['expm1', 'tanh', 'asin', 'acos', 'cbrt'].filter((n) => results[n].differ === 0 || (n === 'cbrt' && results.cbrtFdlibm53.differ === 0));
say('');
say('neutral in Node (a port equal to Node\'s Math on every input here): ' + (neutral.join(', ') || 'none'));
say(fails ? 'FAIL: ' + fails + ' MUST row(s)' : 'PASS: all MUST rows');
const dir = path.join(__dirname, 'results_2026-11-21');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'e98_e2_fdlibm_more.txt'), lines.join('\n') + '\n');
process.exit(fails ? 1 : 0);
