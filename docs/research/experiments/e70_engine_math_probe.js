// e70: which Math functions give different bits in two JavaScript engines, and whether a sine and cosine written in
// plain double arithmetic (fdlibm's, as V8 once had them everywhere) give the core the same bits in both.
// For docs/DESIGN_electron_desktop_client_v2_2026-11-20.md, section 3, and backlog X1. It reads; it writes nothing.
//
//   node docs/research/experiments/e70_engine_math_probe.js            the table of functions, and the port against Math
//   node docs/research/experiments/e70_engine_math_probe.js --seams    and the seams gate's three runs, as is and on the port
//
// Under the desktop app's engine: set ELECTRON_RUN_AS_NODE=1 and give the same arguments to an Electron runtime's
// electron.exe (its output must be redirected to a file: it is a windowed program and writes to no console).
// Compare the two engines' lines: a function whose hash is the same in both gave the same bits on all 200,000 inputs.
'use strict';
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// ---------------------------------------------------------------- 1. the engine's own functions, hashed
let s = 0x9e3779b9 >>> 0;
function rnd() { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }
const N = 200000;
const xs = new Float64Array(N), ys = new Float64Array(N);
for (let i = 0; i < N; i++) { xs[i] = rnd(); ys[i] = rnd(); }
function hash(f) { const o = new Float64Array(N); for (let i = 0; i < N; i++) o[i] = f(xs[i], ys[i]); return crypto.createHash('sha256').update(Buffer.from(o.buffer)).digest('hex').slice(0, 12); }
const FNS = {
  'sqrt(x)': (x) => Math.sqrt(x),
  'pow(x,1.5)': (x) => Math.pow(x, 1.5),
  'pow(x,0.385)': (x) => Math.pow(x, 0.385),
  'pow(x,y)': (x, y) => Math.pow(x, y),
  'pow(x,2+2y)': (x, y) => Math.pow(x, 2 + 2 * y),          // the hull form's: an exponent between 2 and 4
  'x**3': (x) => x ** 3,
  'hypot(x,y)': (x, y) => Math.hypot(x, y),
  'sin(4x-2)': (x) => Math.sin(4 * x - 2),
  'cos(4x-2)': (x) => Math.cos(4 * x - 2),
  'tan(2x-1)': (x) => Math.tan(2 * x - 1),
  'atan2(y-.5,x-.5)': (x, y) => Math.atan2(y - 0.5, x - 0.5),
  'atan(8x-4)': (x) => Math.atan(8 * x - 4),
  'asin(2x-1)': (x) => Math.asin(2 * x - 1),
  'acos(2x-1)': (x) => Math.acos(2 * x - 1),
  'exp(8x-4)': (x) => Math.exp(8 * x - 4),
  'log(x)': (x) => Math.log(x),
  'cbrt(x)': (x) => Math.cbrt(x),
  'tanh(4x-2)': (x) => Math.tanh(4 * x - 2),
};
console.log('engine: node ' + process.version + ', v8 ' + process.versions.v8 + (process.versions.electron ? ', electron ' + process.versions.electron : ''));
console.log('1. the engine\'s own functions over ' + N + ' inputs (sha256, first 12 digits)');
for (const k in FNS) console.log('   ' + k.padEnd(18) + hash(FNS[k]));

// ---------------------------------------------------------------- 2. fdlibm's sine and cosine in plain arithmetic
// Sun's fdlibm 5.3 (k_sin.c, k_cos.c, s_sin.c, s_cos.c, and e_rem_pio2.c's first branch), which is what V8's
// base/ieee754.cc holds. Only +, -, * on doubles, one conversion to an integer and reads of a double's high word, so
// every engine that keeps IEEE 754 gives the same bits. Good for |x| <= 2^19 pi / 2 (about 823,000 rad); beyond that
// it throws, because the reduction's last branch (a long table of pi's digits) is not ported here.
const F = new Float64Array(1), U = new Uint32Array(F.buffer);      // little-endian: U[1] is the high word
const S1 = -1.66666666666666324348e-01, S2 = 8.33333333332248946124e-03, S3 = -1.98412698298579493134e-04,
  S4 = 2.75573137070700676789e-06, S5 = -2.50507602534068634195e-08, S6 = 1.58969099521155010221e-10;
const C1 = 4.16666666666666019037e-02, C2 = -1.38888888888741095749e-03, C3 = 2.48015872894767294178e-05,
  C4 = -2.75573143513906633035e-07, C5 = 2.08757232129817482790e-09, C6 = -1.13596475577881948265e-11;
const PIO2_1 = 1.57079632673412561417e+00, PIO2_1T = 6.07710050650619224932e-11,
  PIO2_2 = 6.07710050630396597660e-11, PIO2_2T = 2.02226624879595063154e-21;
function hi(x) { F[0] = x; return U[1] & 0x7fffffff; }
function kSin(x, y, iy) {
  if (hi(x) < 0x3e400000 && (x | 0) === 0) return x;
  const z = x * x, v = z * x, r = S2 + z * (S3 + z * (S4 + z * (S5 + z * S6)));
  return iy === 0 ? x + v * (S1 + z * r) : x - ((z * (0.5 * y - v * r) - y) - v * S1);
}
function kCos(x, y) {
  const ix = hi(x);
  if (ix < 0x3e400000 && (x | 0) === 0) return 1;
  const z = x * x, r = z * (C1 + z * (C2 + z * (C3 + z * (C4 + z * (C5 + z * C6)))));
  if (ix < 0x3fd33333) return 1 - (0.5 * z - (z * r - x * y));
  let qx = 0.28125;
  if (ix <= 0x3fe90000) { U[1] = ix - 0x00200000; U[0] = 0; qx = F[0]; }
  const hz = 0.5 * z - qx, a = 1 - qx;
  return a - (hz - (z * r - x * y));
}
const PIO2_3 = 2.02226624871116645580e-21, PIO2_3T = 8.47842766036889956997e-32, INVPIO2 = 6.36619772367581382433e-01;
const NPIO2_HW = [
  0x3FF921FB, 0x400921FB, 0x4012D97C, 0x401921FB, 0x401F6A7A, 0x4022D97C, 0x4025FDBB, 0x402921FB,
  0x402C463A, 0x402F6A7A, 0x4031475C, 0x4032D97C, 0x40346B9C, 0x4035FDBB, 0x40378FDB, 0x403921FB,
  0x403AB41B, 0x403C463A, 0x403DD85A, 0x403F6A7A, 0x40407E4C, 0x4041475C, 0x4042106C, 0x4042D97C,
  0x4043A28C, 0x40446B9C, 0x404534AC, 0x4045FDBB, 0x4046C6CB, 0x40478FDB, 0x404858EB, 0x404921FB,
];
let Y0 = 0, Y1 = 0;
// x less the nearest multiple of pi/2, as Y0 + Y1; returns how many quarter turns were taken off. For
// pi/4 < |x| <= 2^19 pi/2 (about 823,000 rad); beyond that fdlibm goes to a long table, which is not ported: it throws.
function remPio2(x) {
  const ix = hi(x);
  if (ix < 0x4002d97c) {                 // |x| < 3 pi/4: one quarter turn
    if (x > 0) {
      let z = x - PIO2_1;
      if (ix !== 0x3ff921fb) { Y0 = z - PIO2_1T; Y1 = (z - Y0) - PIO2_1T; } else { z -= PIO2_2; Y0 = z - PIO2_2T; Y1 = (z - Y0) - PIO2_2T; }
      return 1;
    }
    let z = x + PIO2_1;
    if (ix !== 0x3ff921fb) { Y0 = z + PIO2_1T; Y1 = (z - Y0) + PIO2_1T; } else { z += PIO2_2; Y0 = z + PIO2_2T; Y1 = (z - Y0) + PIO2_2T; }
    return -1;
  }
  if (ix > 0x413921fb) throw new Error('e70: |x| > 2^19 pi / 2 is outside this port: ' + x);
  let t = x < 0 ? -x : x;
  const n = (t * INVPIO2 + 0.5) | 0, fn = n;
  let r = t - fn * PIO2_1, w = fn * PIO2_1T;       // good to 85 bits
  if (n < 32 && ix !== NPIO2_HW[n - 1]) Y0 = r - w;
  else {
    const j = ix >> 20;
    Y0 = r - w;
    if (j - ((hi(Y0) >> 20) & 0x7ff) > 16) {       // a second round, good to 118 bits
      t = r; w = fn * PIO2_2; r = t - w; w = fn * PIO2_2T - ((t - r) - w);
      Y0 = r - w;
      if (j - ((hi(Y0) >> 20) & 0x7ff) > 49) {     // a third, 151 bits
        t = r; w = fn * PIO2_3; r = t - w; w = fn * PIO2_3T - ((t - r) - w);
        Y0 = r - w;
      }
    }
  }
  Y1 = (r - Y0) - w;
  if (x < 0) { Y0 = -Y0; Y1 = -Y1; return -n; }
  return n;
}
function sin(x) {
  if (hi(x) <= 0x3fe921fb) return kSin(x, 0, 0);
  switch (remPio2(x) & 3) {
    case 0: return kSin(Y0, Y1, 1);
    case 1: return kCos(Y0, Y1);
    case 2: return -kSin(Y0, Y1, 1);
    default: return -kCos(Y0, Y1);
  }
}
function cos(x) {
  if (hi(x) <= 0x3fe921fb) return kCos(x, 0);
  switch (remPio2(x) & 3) {
    case 0: return kCos(Y0, Y1);
    case 1: return -kSin(Y0, Y1, 1);
    case 2: return -kCos(Y0, Y1);
    default: return kSin(Y0, Y1, 1);
  }
}

const engineSin = Math.sin, engineCos = Math.cos;
const D = new Float64Array(1), DB = new BigInt64Array(D.buffer);
const bitsOf = (v) => { D[0] = v; return DB[0]; };
function against(M, span) {
  let dSin = 0, dCos = 0, ulpSin = 0, ulpCos = 0;
  const hp = crypto.createHash('sha256'), buf = new Float64Array(2);
  for (let i = 0; i < M; i++) {
    const x = (2 * rnd() - 1) * span, a = sin(x), b = cos(x), ea = engineSin(x), eb = engineCos(x);
    if (a !== ea) { dSin++; const u = Number(bitsOf(a) - bitsOf(ea)); if (Math.abs(u) > ulpSin) ulpSin = Math.abs(u); }
    if (b !== eb) { dCos++; const u = Number(bitsOf(b) - bitsOf(eb)); if (Math.abs(u) > ulpCos) ulpCos = Math.abs(u); }
    buf[0] = a; buf[1] = b; hp.update(Buffer.from(buf.buffer));
  }
  console.log('   ' + M + ' angles within ' + span + ' rad: the port\'s own results ' + hp.digest('hex').slice(0, 12)
    + '; against this engine\'s Math.sin ' + dSin + ' differ' + (dSin ? ' (at most ' + ulpSin + ' in the last place)' : '')
    + ', Math.cos ' + dCos + ' differ' + (dCos ? ' (at most ' + ulpCos + ' in the last place)' : ''));
}
console.log('2. fdlibm\'s sine and cosine in plain arithmetic (the port\'s own hash must be the same in every engine)');
against(1000000, 1.4);                   // her pitch and roll: held under 80 degrees
against(1000000, 7);                     // a full turn either way: headings and bearings
against(1000000, 1000);                  // the reduction's later rounds
against(1000000, 800000);                // near the port's limit

// ---------------------------------------------------------------- 3. the seams gate's runs on the port
// tools/seams.js's three runs, hashed after every step as it hashes them, first as the engine is and then with
// Math.sin and Math.cos replaced by the port (the core calls them by name at every step, in core/core.js's poseFrame,
// and core/scenarios.js once when the 1912 damage is laid out).
if (process.argv.includes('--seams')) {
  const root = path.join(__dirname, '..', '..', '..');
  const C = require(path.join(root, 'core', 'core.js')), SC = require(path.join(root, 'core', 'scenarios.js'));
  const ref = JSON.parse(fs.readFileSync(path.join(root, 'out', 'seams_reference.json'), 'utf8'));
  const GATE_PARAMS = { wMul: 1.182, aDown: 0.277, fOpen: 0.0101, stairs: 0 }, GATE_SHIP = { tiers: 0 };
  const SCEN = [['titanic', 4 * 3600], ['britannic', 4 * 3600], ['hawke', 4 * 3600]];
  function digest(key, tMax) {
    const sim = C.createSim(C.buildShip(GATE_SHIP), GATE_PARAMS, SC.PRESETS[key].build({ noPumps: true }));
    const h = crypto.createHash('sha256'), b = new Float64Array(64 + 7);
    let steps = 0;
    while (!sim.foundered && sim.t < tMax) {
      C.step(sim); steps++;
      b.set(sim.vol, 0);
      b[64] = sim.zO; b[65] = sim.pitch; b[66] = sim.roll; b[67] = sim.vz; b[68] = sim.wth; b[69] = sim.wph; b[70] = sim.inflow;
      h.update(Buffer.from(b.buffer)); h.update(sim.foundered ? 'F' : 'a');
    }
    return { steps, sha256: h.digest('hex') };
  }
  function pass(title) {
    console.log('   ' + title);
    let same = 0;
    for (const [key, tMax] of SCEN) {
      const a = digest(key, tMax), r = ref.scenarios[key], ok = a.sha256 === r.sha256 && a.steps === r.steps;
      if (ok) same++;
      console.log('     ' + (ok ? 'SAME ' : 'DIFF ') + key.padEnd(10) + String(a.steps).padStart(6) + ' steps ' + a.sha256.slice(0, 16));
    }
    return same;
  }
  console.log('3. the seams gate\'s runs against out/seams_reference.json (frozen with node ' + ref.node + ')');
  const asIs = pass('as the engine is');
  Math.sin = sin; Math.cos = cos;
  const ported = pass('with Math.sin and Math.cos replaced by the port (asin and tan, used once when a sim is made, left as the engine\'s)');
  Math.sin = engineSin; Math.cos = engineCos;
  console.log('   as is: ' + asIs + ' of 3 the reference\'s; on the port: ' + ported + ' of 3');
}
