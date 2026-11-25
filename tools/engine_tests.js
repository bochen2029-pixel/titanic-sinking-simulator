// E1 and E2a (backlog X1): the model computes its own transcendental functions, plain arithmetic that every IEEE 754
// engine does alike, so a watch is the same night in Node, in a browser and in the desktop app. E1: C.sin and C.cos.
// E2a: C.exp, C.log, C.log10, C.tan, C.atan2, C.hypot, C.tanh, C.asin, C.acos and C.cbrt, beside them in core/core.js,
// each equal to Node's own Math on every input of docs/research/experiments/e97_e2_fdlibm_ports.js and
// e98_e2_fdlibm_more.js (a million a function in the model's ranges, and fdlibm's own results by Java's StrictMath), so
// Node's bits did not move. And C.pow, fdlibm's, which core/core.js calls at every power since the calibration epoch's
// B1 (G17): Node's Math.pow is the C runtime's, so taking it moved Node's bits once, a change of arithmetic, not of
// physics (the code before B1 with C.pow preloaded over its Math.pow gives B1's bits: tools/pow_preload.js, e107).
// MUST rows fail the suite; CHECK rows print what is worth seeing.   node tools/engine_tests.js
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const C = require('../core/core.js');
const root = path.join(__dirname, '..');
const rows = []; let fails = 0, checks = 0;
function row(kind, what, value, ref, ok) { rows.push([kind, what, value, ref, ok]); if (!ok) { if (kind === 'MUST') fails++; else checks++; } }

// 1. no file of the model calls the engine's own transcendental functions: not sine and cosine (E1), and none but Math.pow
// since E2a; the ports' own fallbacks beyond their range excepted (core/readers/fall.js switched in QC B-7: it is allowed
// nothing now)
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.js')) files.push(p); } })(path.join(root, 'core'));
const rel = (f) => path.relative(root, f).replace(/\\/g, '/');
const FALLBACK = /beyond the port|return Math\.cos\(x\);/;
const calls = [];
for (const f of files) fs.readFileSync(f, 'utf8').split('\n').forEach((l, i) => { if (/Math\.(sin|cos)\(/.test(l) && !FALLBACK.test(l)) calls.push(rel(f) + ':' + (i + 1)); });
row('MUST', 'no file of the model (core/) calls Math.sin or Math.cos: they call C.sin and C.cos', calls.length ? calls.join(', ') : files.length + ' files, none', 'none (the viewer, site/, may)', calls.length === 0);
const TRANS = /Math\.(sin|cos|tan|asin|acos|atan|atan2|sinh|cosh|tanh|asinh|acosh|atanh|exp|expm1|log|log1p|log2|log10|cbrt|hypot)\(/;
const ALLOW = {};                                     // a file allowed its engine calls until it switches: none since QC B-7
const trans = [], allowed = [];
for (const f of files) fs.readFileSync(f, 'utf8').split('\n').forEach((l, i) => { if (TRANS.test(l) && !FALLBACK.test(l)) (ALLOW[rel(f)] ? allowed : trans).push(rel(f) + ':' + (i + 1)); });
row('MUST', 'no file of the model calls the engine\'s transcendental functions but Math.pow: they call C.exp, C.log, ... (E2a)', trans.length ? trans.join(', ') : files.length + ' files, none', 'none (Math.pow: B1 took core/core.js\'s, below)', trans.length === 0);
row('CHECK', '  ... allowed until it switches: ' + (Object.keys(ALLOW).length ? Object.entries(ALLOW).map(([f, why]) => f + ', ' + why).join('; ') : 'no file (core/readers/fall.js switched, QC B-7)'), allowed.length + ' call(s)' + (allowed.length ? ': ' + allowed.slice(0, 5).join(', ') : ''), 'none, once switched', allowed.length === 0);
// B1 (the calibration epoch, G17): every power of core/core.js is the model's own (fpow, FM.pow, exported as C.pow), and
// core/core.js keeps no Math.pow or non-square ** (the step's, the hull form's, the damping's). The other files' powers
// (core/readers/section.js's, the strength's, not in the step) are listed, and go with E2.
const CORE = path.join(root, 'core', 'core.js'), coreSrc = fs.readFileSync(CORE, 'utf8').split('\n');
const corePow = [], fpowCalls = [], otherPow = [];
coreSrc.forEach((l, i) => { const c = l.replace(/\/\/.*$/, ''); if (/Math\.pow\(|\*\*/.test(c)) corePow.push('core/core.js:' + (i + 1)); if (/\bfpow\(/.test(c)) fpowCalls.push(i + 1); });
for (const f of files) if (f !== CORE) fs.readFileSync(f, 'utf8').split('\n').forEach((l, i) => { const c = l.replace(/\/\/.*$/, ''); if (/Math\.pow\(|\*\*/.test(c)) otherPow.push(rel(f) + ':' + (i + 1)); });
row('MUST', 'core/core.js calls no Math.pow and no **: its powers are the model\'s own (B1)', corePow.length ? corePow.join(', ') : 'none', 'none', corePow.length === 0);
row('MUST', '  ... C.pow is the routine core/core.js calls at its powers (the hull form twice, the weir twice, the damping twice)', typeof C.pow !== 'function' ? 'MISSING' : fpowCalls.length + ' lines: ' + fpowCalls.join(', '), '5 lines (one with two calls)', typeof C.pow === 'function' && fpowCalls.length === 5);
row('CHECK', '  ... the other files\' powers, for E2 (not in the step)', otherPow.length + ': ' + otherPow.join(', '), 'core/readers/section.js only', otherPow.every((s) => s.startsWith('core/readers/section.js')));

// 2. E1's arithmetic: its results over a million angles hash to the value frozen when it went in (Node v26,
// 2026-11-20), the same in any engine that keeps IEEE 754
let s = 2463534242;
const rnd = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
const N = 1000000, o = new Float64Array(2 * N); let differ = 0;
for (let i = 0; i < N; i++) {
  const x = (rnd() * 2 - 1) * [0.5, 3.2, 7, 100, 10000, 800000][i % 6];
  o[2 * i] = C.sin(x); o[2 * i + 1] = C.cos(x);
  if (!Object.is(o[2 * i], Math.sin(x)) || !Object.is(o[2 * i + 1], Math.cos(x))) differ++;
}
const h = crypto.createHash('sha256').update(Buffer.from(o.buffer)).digest('hex').slice(0, 16), FROZEN = 'aa44d915186f00d6';
row('MUST', 'the model\'s sine and cosine over a million angles (to 800,000 rad) hash as when they went in', h, FROZEN + ' (the same in every engine)', h === FROZEN);

// 3. against this engine's own: Node's are the port's (so the references made with Node's stand); a browser's differ
row('CHECK', '  ... and against this engine\'s own Math.sin and Math.cos', differ + ' of ' + N + ' angles differ (' + process.version + ')', '0 under Node (e70: a browser\'s engine differs on about 3.5 %)', differ === 0);
row('MUST', 'beyond the ports\' range, and for values that are not finite, the engine\'s own', [C.sin(1e7) === Math.sin(1e7), Number.isNaN(C.cos(Infinity)), Number.isNaN(C.sin(NaN)), Object.is(C.sin(-0), -0), C.tan(1e7) === Math.tan(1e7), Number.isNaN(C.tan(Infinity))].join(', '), 'true, true, true, true, true, true', C.sin(1e7) === Math.sin(1e7) && Number.isNaN(C.cos(Infinity)) && Number.isNaN(C.sin(NaN)) && Object.is(C.sin(-0), -0) && C.tan(1e7) === Math.tan(1e7) && Number.isNaN(C.tan(Infinity)));

// 4. E2a's arithmetic: each function's results over a quarter of a million inputs, in the model's ranges and beyond them,
// hash to the value frozen when it went in (Node v26, 2026-11-21), the same in any engine that keeps IEEE 754: the inputs
// are made from the generator's bits and exact powers of two, and none gives a NaN, whose bits an engine may choose. And
// against this engine's own Math: equal under Node for all but pow (the full proofs are e97's and e98's)
const W = new Float64Array(1), WU = new Uint32Array(W.buffer);
const two = (k) => { WU[1] = (k + 1023) << 20; WU[0] = 0; return W[0]; };         // 2^k, exactly (-1022 <= k <= 1023)
const mag = (lo, hi) => (1 + rnd()) * two(lo + Math.floor((hi - lo) * rnd()));      // spread evenly in its exponent
const sg = () => (rnd() < 0.5 ? -1 : 1);
const M = 250000;
const near1 = () => sg() * (1 - mag(-50, -2));
const ONE = {
  exp: (i) => [() => 120 * rnd() - 60, () => -745 * rnd(), () => 709 * rnd(), () => (2 * rnd() - 1) * 1e-3][i % 4](),
  log: (i) => [() => mag(-20, 20), () => 1 + (2 * rnd() - 1) * 1e-3, () => mag(-1000, 1000)][i % 3](),
  log10: (i) => [() => mag(0, 30), () => mag(-20, 20), () => 1 + 1e-2 * rnd()][i % 3](),
  tan: (i) => [() => 0.1 * rnd(), () => (2 * rnd() - 1) * 1.57, () => (2 * rnd() - 1) * 100][i % 3](),
  tanh: (i) => [() => 10 * rnd() - 5, () => 240 * rnd() - 120, () => sg() * mag(-60, -1)][i % 3](),
  asin: (i) => [() => 2 * rnd() - 1, () => (2 * rnd() - 1) * 0.02, near1][i % 3](),
  acos: (i) => [() => 2 * rnd() - 1, () => (2 * rnd() - 1) * 0.02, near1][i % 3](),
  cbrt: (i) => [() => rnd(), () => sg() * mag(-1000, 1000), () => 1000 * rnd()][i % 3](),
};
const TWO = {
  atan2: (i) => [() => [sg() * mag(-20, 20), sg() * mag(-20, 20)], () => [2 * rnd() - 1, 2 * rnd() - 1], () => [30 * rnd() - 15, 30 * rnd() - 15]][i % 3](),
  hypot: (i) => [() => [2 * rnd(), 2 * rnd()], () => [0.05 * rnd(), 0.01], () => [sg() * mag(-20, 20), sg() * mag(-20, 20)]][i % 3](),
  pow: (i) => [() => [rnd(), 0.9 + 2.2 * rnd()], () => [rnd(), 1.5], () => [rnd(), 0.385], () => [300 * rnd(), 4], () => [mag(-7, 7), 20 * rnd() - 10]][i % 5](),
};
const FROZEN2 = {                                    // frozen when E2a went in (Node v26.13.0, 2026-11-21)
  exp: 'c97c9658235ed97b', log: '1c582d902ff60d20', log10: 'ba1091242a0a9d96', tan: '6b60d7aa3a1f5d70', tanh: '22c4e5ce93c4da3d',
  asin: '0f50a5791937cee5', acos: '64c754e907fb44f4', cbrt: 'd93b70ea0589f607', atan2: '1c13acaaf2941f44', hypot: 'fafb71eb6a0fbb1c',
  pow: 'd6c74c73373ac9d5',
};
const nodeDiff = {};
let seedN = 3000;
for (const [name, gen] of Object.entries(Object.assign({}, ONE, TWO))) {
  s = seedN++;
  const out = new Float64Array(M), two2 = name in TWO; let d = 0;
  for (let i = 0; i < M; i++) {
    if (two2) { const [a, b] = gen(i); out[i] = C[name](a, b); if (!Object.is(out[i], Math[name](a, b))) d++; }
    else { const x = gen(i); out[i] = C[name](x); if (!Object.is(out[i], Math[name](x))) d++; }
  }
  nodeDiff[name] = d;
  const hh = crypto.createHash('sha256').update(Buffer.from(out.buffer)).digest('hex').slice(0, 16);
  row('MUST', 'the model\'s ' + name + ' over ' + M.toLocaleString('en-US') + ' inputs hashes as when it went in (E2a)', hh, (FROZEN2[name] || 'not frozen') + ' (the same in every engine)', hh === FROZEN2[name]);
}
const neutral = Object.keys(nodeDiff).filter((n) => n !== 'pow');
row('CHECK', '  ... and against this engine\'s own Math: ' + neutral.join(', '), neutral.map((n) => nodeDiff[n]).reduce((a, b) => a + b, 0) + ' differ (' + process.version + ')', '0 under Node (e97, e98)', neutral.every((n) => nodeDiff[n] === 0));
row('CHECK', '  ... and pow against this engine\'s Math.pow (the C runtime\'s; why B1 moved Node\'s bits)', nodeDiff.pow + ' of ' + M.toLocaleString('en-US') + ' differ', '7 to 10 % under Node, by the inputs (e97: one ulp at most)', true);

for (const [kind, what, value, ref, ok] of rows) console.log((ok ? 'PASS ' : (kind === 'MUST' ? 'FAIL ' : 'CHECK ')) + kind.padEnd(6) + what.padEnd(100) + ' ' + String(value).padEnd(48) + ' ' + ref);
console.log(fails ? '\nFAIL: ' + fails + ' MUST row(s)' + (checks ? ', ' + checks + ' CHECK row(s) off' : '') : '\nPASS: all ' + rows.filter(r => r[0] === 'MUST').length + ' MUST rows' + (checks ? '; ' + checks + ' CHECK row(s) off' : ''));
process.exit(fails ? 1 : 0);
