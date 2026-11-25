// e97 (E2's groundwork, backlog X1): fdlibm's pow, exp, log, log10, tan and atan2, and hypot two ways, in plain IEEE 754
// double arithmetic, so that every engine that keeps IEEE 754 computes them alike. A research module: nothing in core/
// or site/ requires it. Wiring it in is the mainline's (pow, in the calibration epoch) and Z1's (fall.js, QC B-7).
//
// Why: E1 (core/core.js, "the model's own sine and cosine") took Math.sin and Math.cos out of the model's arithmetic.
// The QC (A-2, B-7) found the engine's other functions still in it: Math.pow in the core's step and set-up, Math.exp in
// motion.js and people.js, Math.log, Math.log10 and Math.tan in fall.js, Math.atan2 in five files, Math.hypot in
// section.js. Two engines may round these differently in the last place, as they did sine and cosine.
//
// What: the routines as V8 has them (src/base/ieee754.cc, taken from fdlibm by way of FreeBSD's msun), with the
// language's own answers at the edges where C's pow and JavaScript's Math.pow part (y NaN; |x| = 1 with y infinite).
// Math.pow is the one V8 does not take from fdlibm: it calls the C runtime Node was built against (README, "The port,
// and the oracle"), so no port can be Node's own there; this pow is fdlibm's, and its proof is fdlibm's own results
// (Java's StrictMath, whose results are fdlibm 5.3's by the Java specification), not Node's.
// Each is written from fdlibm's algorithm and constants in this file's own words; e97_e2_fdlibm_ports.js proves each
// against Node's Math over a million inputs in the ranges the model uses, and freezes a hash of the results.
// hypot: fdlibm's e_hypot.c (hypot), and V8's own Math.hypot, which is not fdlibm's but a scaled sum of squares with
// Kahan's compensation in plain arithmetic (src/builtins/math.tq; hypotV8). The proof says which is Node's.
// log10: V8's (fdlibm 5.3's form, log10 by way of log) and FreeBSD's newer form (log10Fbsd, by way of k_log1p); the
// proof says which is Node's.
//
// fdlibm's notice, kept as its licence asks:
//   Copyright (C) 1993 by Sun Microsystems, Inc. All rights reserved.
//   Developed at SunSoft, a Sun Microsystems, Inc. business.
//   Permission to use, copy, modify, and distribute this software is freely granted, provided that this notice is
//   preserved.
//
// The words of a double: little-endian (x86, ARM as Windows and the page run them): U[1] is the high word, U[0] the low.
'use strict';

const F = new Float64Array(1), U = new Uint32Array(F.buffer);
const HI = (x) => { F[0] = x; return U[1] | 0; };                  // GET_HIGH_WORD, as a signed 32-bit integer
const LO = (x) => { F[0] = x; return U[0]; };                      // GET_LOW_WORD, unsigned
const setHi = (x, hi) => { F[0] = x; U[1] = hi; return F[0]; };    // SET_HIGH_WORD
const setLo = (x, lo) => { F[0] = x; U[0] = lo; return F[0]; };    // SET_LOW_WORD
const words = (hi, lo) => { U[1] = hi; U[0] = lo; return F[0]; };  // INSERT_WORDS

const one = 1.0, huge = 1.0e300, tiny = 1.0e-300;
const two54 = 1.80143985094819840000e+16;            // 0x43500000 00000000
const twom54 = 5.55111512312578270212e-17;           // 0x3C900000 00000000

// ---------------------------------------------------------------- scalbn: x * 2^n by its exponent (s_scalbn.c)
function scalbn(x, n) {
  let hx = HI(x);
  const lx = LO(x);
  let k = (hx & 0x7ff00000) >> 20;
  if (k === 0) {                                     // 0 or subnormal
    if ((lx | (hx & 0x7fffffff)) === 0) return x;
    x *= two54;
    hx = HI(x);
    k = ((hx & 0x7ff00000) >> 20) - 54;
    if (n < -50000) return tiny * x;
  }
  if (k === 0x7ff) return x + x;                     // NaN or infinite
  k = k + n;
  if (k > 0x7fe) return huge * (x < 0 ? -huge : huge);
  if (k > 0) return setHi(x, (hx & 0x800fffff) | (k << 20));
  if (k <= -54) {
    if (n > 50000) return huge * (x < 0 ? -huge : huge);
    return tiny * (x < 0 ? -tiny : tiny);
  }
  k += 54;
  x = setHi(x, (hx & 0x800fffff) | (k << 20));
  return x * twom54;
}

// ---------------------------------------------------------------- exp (e_exp.c)
const halF = [0.5, -0.5];
const o_threshold = 7.09782712893383973096e+02;      // 0x40862E42 FEFA39EF
const u_threshold = -7.45133219101941108420e+02;     // 0xC0874910 D52D3051
const ln2HI = [6.93147180369123816490e-01, -6.93147180369123816490e-01];   // 0x3FE62E42 FEE00000
const ln2LO = [1.90821492927058770002e-10, -1.90821492927058770002e-10];   // 0x3DEA39EF 35793C76
const invln2 = 1.44269504088896338700e+00;           // 0x3FF71547 652B82FE
const P1 = 1.66666666666666019037e-01, P2 = -2.77777777770155933842e-03, P3 = 6.61375632143793436117e-05,
  P4 = -1.65339022054652515390e-06, P5 = 4.13813679705723846039e-08;
const twom1000 = 9.33263618503218878990e-302;        // 2^-1000
const two1023 = 8.98846567431157953865e+307;         // 2^1023

function exp(x) {
  let hx = HI(x);
  const xsb = (hx >>> 31) & 1;
  hx &= 0x7fffffff;
  let hi = 0, lo = 0, k = 0;
  if (hx >= 0x40862E42) {                            // |x| >= 709.78...
    if (hx >= 0x7ff00000) {
      if (((hx & 0xfffff) | LO(x)) !== 0) return x + x;        // NaN
      return xsb === 0 ? x : 0.0;                              // exp(+inf) = inf, exp(-inf) = 0
    }
    if (x > o_threshold) return huge * huge;
    if (x < u_threshold) return twom1000 * twom1000;
  }
  if (hx > 0x3fd62e42) {                             // |x| > ln2 / 2
    if (hx < 0x3FF0A2B2) {                           // and |x| < 1.5 ln2
      // V8's one change to fdlibm here: exp(1) is e's own double, where fdlibm's arithmetic gives one ulp more
      // (2.7182818284590455; Java's StrictMath, which is fdlibm's, does). e97's proof finds it at x = 1 alone.
      if (x === 1.0) return 2.718281828459045;
      hi = x - ln2HI[xsb]; lo = ln2LO[xsb]; k = 1 - xsb - xsb;
    } else {
      k = (invln2 * x + halF[xsb]) | 0;
      hi = x - k * ln2HI[0];
      lo = k * ln2LO[0];
    }
    x = hi - lo;
  } else if (hx < 0x3e300000) {                      // |x| < 2^-28
    if (huge + x > one) return one + x;
  } else k = 0;
  const t = x * x;
  const twopk = k >= -1021 ? words(0x3ff00000 + (k << 20), 0) : words(0x3ff00000 + ((k + 1000) << 20), 0);
  const c = x - t * (P1 + t * (P2 + t * (P3 + t * (P4 + t * P5))));
  if (k === 0) return one - ((x * c) / (c - 2.0) - x);
  const y = one - ((lo - (x * c) / (2.0 - c)) - hi);
  if (k >= -1021) {
    if (k === 1024) return y * 2.0 * two1023;
    return y * twopk;
  }
  return y * twopk * twom1000;
}

// ---------------------------------------------------------------- log (e_log.c)
const ln2_hi = 6.93147180369123816490e-01, ln2_lo = 1.90821492927058770002e-10;
const Lg1 = 6.666666666666735130e-01, Lg2 = 3.999999999940941908e-01, Lg3 = 2.857142874366239149e-01,
  Lg4 = 2.222219843214978396e-01, Lg5 = 1.818357216161805012e-01, Lg6 = 1.531383769920937332e-01,
  Lg7 = 1.479819860511658591e-01;

function log(x) {
  let hx = HI(x);
  const lx = LO(x);
  let k = 0;
  if (hx < 0x00100000) {                             // x < 2^-1022
    if (((hx & 0x7fffffff) | lx) === 0) return -two54 / 0.0;   // log(+-0) = -inf
    if (hx < 0) return (x - x) / 0.0;                          // log(negative) = NaN
    k -= 54; x *= two54;                                       // subnormal: scale up
    hx = HI(x);
  }
  if (hx >= 0x7ff00000) return x + x;
  k += (hx >> 20) - 1023;
  hx &= 0x000fffff;
  let i = (hx + 0x95f64) & 0x100000;
  x = setHi(x, hx | (i ^ 0x3ff00000));               // x or x/2, into [sqrt(2)/2, sqrt(2))
  k += (i >> 20);
  const f = x - 1.0;
  if ((0x000fffff & (2 + hx)) < 3) {                 // -2^-20 <= f < 2^-20
    if (f === 0) {
      if (k === 0) return 0;
      const dk = k;
      return dk * ln2_hi + dk * ln2_lo;
    }
    const R = f * f * (0.5 - 0.33333333333333333 * f);
    if (k === 0) return f - R;
    const dk = k;
    return dk * ln2_hi - ((R - dk * ln2_lo) - f);
  }
  const s = f / (2.0 + f), dk = k, z = s * s;
  i = hx - 0x6147a;
  const w = z * z;
  const j = 0x6b851 - hx;
  const t1 = w * (Lg2 + w * (Lg4 + w * Lg6));
  const t2 = z * (Lg1 + w * (Lg3 + w * (Lg5 + w * Lg7)));
  i |= j;
  const R = t2 + t1;
  if (i > 0) {
    const hfsq = 0.5 * f * f;
    if (k === 0) return f - (hfsq - s * (hfsq + R));
    return dk * ln2_hi - ((hfsq - (s * (hfsq + R) + dk * ln2_lo)) - f);
  }
  if (k === 0) return f - s * (f - R);
  return dk * ln2_hi - ((s * (f - R) - dk * ln2_lo) - f);
}

// ---------------------------------------------------------------- log10 (e_log10.c), two forms
const ivln10 = 4.34294481903251816668e-01;           // 0x3FDBCB7B 1526E50E
const log10_2hi = 3.01029995663611771306e-01;        // 0x3FD34413 509F6000
const log10_2lo = 3.69423907715893078616e-13;        // 0x3D59FEF3 11F12B36

// fdlibm 5.3's form, as V8 has it: by way of log, after taking out the power of two
function log10(x) {
  let hx = HI(x);
  let lx = LO(x);
  let k = 0;
  if (hx < 0x00100000) {
    if (((hx & 0x7fffffff) | lx) === 0) return -two54 / 0.0;
    if (hx < 0) return (x - x) / 0.0;
    k -= 54; x *= two54;
    hx = HI(x); lx = LO(x);
  }
  if (hx >= 0x7ff00000) return x + x;
  if (hx === 0x3ff00000 && lx === 0) return 0;       // log10(1) = +0
  k += (hx >> 20) - 1023;
  const i = k >>> 31;                                // 1 when k < 0
  hx = (hx & 0x000fffff) | ((0x3ff - i) << 20);
  const y = k + i;
  x = words(hx, lx);
  const z = y * log10_2lo + ivln10 * log(x);
  return z + y * log10_2hi;
}

// FreeBSD's newer form: f - f^2/2 + k_log1p(f), split into high and low parts before dividing by ln 10
const ivln10hi = 4.34294481878168880939e-01;         // 0x3FDBCB7B 15200000
const ivln10lo = 2.50829467116452752298e-11;         // 0x3DBB9438 CA9AADD5
function kLog1p(f) {
  const s = f / (2.0 + f), z = s * s, w = z * z;
  const t1 = w * (Lg2 + w * (Lg4 + w * Lg6));
  const t2 = z * (Lg1 + w * (Lg3 + w * (Lg5 + w * Lg7)));
  const R = t2 + t1, hfsq = 0.5 * f * f;
  return s * (hfsq + R);
}
function log10Fbsd(x) {
  let hx = HI(x);
  const lx = LO(x);
  let k = 0;
  if (hx < 0x00100000) {
    if (((hx & 0x7fffffff) | lx) === 0) return -two54 / 0.0;
    if (hx < 0) return (x - x) / 0.0;
    k -= 54; x *= two54;
    hx = HI(x);
  }
  if (hx >= 0x7ff00000) return x + x;
  if (hx === 0x3ff00000 && lx === 0) return 0;
  k += (hx >> 20) - 1023;
  hx &= 0x000fffff;
  const i = (hx + 0x95f64) & 0x100000;
  x = setHi(x, hx | (i ^ 0x3ff00000));
  k += (i >> 20);
  const y = k, f = x - 1.0, hfsq = 0.5 * f * f, r = kLog1p(f);
  const hi = setLo(f - hfsq, 0);
  const lo = (f - hi) - hfsq + r;
  let valHi = hi * ivln10hi;
  const y2 = y * log10_2hi;
  let valLo = y * log10_2lo + (lo + hi) * ivln10lo + lo * ivln10hi;
  const w = y2 + valHi;
  valLo += (y2 - w) + valHi;
  valHi = w;
  return valLo + valHi;
}

// ---------------------------------------------------------------- tan (s_tan.c, k_tan.c, e_rem_pio2.c)
// The reduction is E1's (core/core.js), the same arithmetic: good for |x| up to 2^19 pi/2; beyond it, or for a value
// that is not finite, the engine's own is used, as E1 does.
const PIO2_1 = 1.57079632673412561417e+00, PIO2_1T = 6.07710050650619224932e-11,
  PIO2_2 = 6.07710050630396597660e-11, PIO2_2T = 2.02226624879595063154e-21,
  PIO2_3 = 2.02226624871116645580e-21, PIO2_3T = 8.47842766036889956997e-32, INVPIO2 = 6.36619772367581382433e-01;
const NPIO2_HW = [
  0x3FF921FB, 0x400921FB, 0x4012D97C, 0x401921FB, 0x401F6A7A, 0x4022D97C, 0x4025FDBB, 0x402921FB,
  0x402C463A, 0x402F6A7A, 0x4031475C, 0x4032D97C, 0x40346B9C, 0x4035FDBB, 0x40378FDB, 0x403921FB,
  0x403AB41B, 0x403C463A, 0x403DD85A, 0x403F6A7A, 0x40407E4C, 0x4041475C, 0x4042106C, 0x4042D97C,
  0x4043A28C, 0x40446B9C, 0x404534AC, 0x4045FDBB, 0x4046C6CB, 0x40478FDB, 0x404858EB, 0x404921FB,
];
let Y0 = 0, Y1 = 0;
const hiAbs = (x) => HI(x) & 0x7fffffff;
function remPio2(x, ix) {
  if (ix < 0x4002d97c) {
    if (x > 0) {
      let z = x - PIO2_1;
      if (ix !== 0x3ff921fb) { Y0 = z - PIO2_1T; Y1 = (z - Y0) - PIO2_1T; } else { z -= PIO2_2; Y0 = z - PIO2_2T; Y1 = (z - Y0) - PIO2_2T; }
      return 1;
    }
    let z = x + PIO2_1;
    if (ix !== 0x3ff921fb) { Y0 = z + PIO2_1T; Y1 = (z - Y0) + PIO2_1T; } else { z += PIO2_2; Y0 = z + PIO2_2T; Y1 = (z - Y0) + PIO2_2T; }
    return -1;
  }
  let t = x < 0 ? -x : x;
  const n = (t * INVPIO2 + 0.5) | 0, fn = n;
  let r = t - fn * PIO2_1, w = fn * PIO2_1T;
  if (n < 32 && ix !== NPIO2_HW[n - 1]) Y0 = r - w;
  else {
    const j = ix >> 20;
    Y0 = r - w;
    if (j - ((hiAbs(Y0) >> 20) & 0x7ff) > 16) {
      t = r; w = fn * PIO2_2; r = t - w; w = fn * PIO2_2T - ((t - r) - w);
      Y0 = r - w;
      if (j - ((hiAbs(Y0) >> 20) & 0x7ff) > 49) {
        t = r; w = fn * PIO2_3; r = t - w; w = fn * PIO2_3T - ((t - r) - w);
        Y0 = r - w;
      }
    }
  }
  Y1 = (r - Y0) - w;
  if (x < 0) { Y0 = -Y0; Y1 = -Y1; return -n; }
  return n;
}
const T = [
  3.33333333333334091986e-01, 1.33333333333201242699e-01, 5.39682539762260521377e-02, 2.18694882948595424599e-02,
  8.86323982359930005737e-03, 3.59207910759131235356e-03, 1.45620945432529025516e-03, 5.88041240820264096874e-04,
  2.46463134818469906812e-04, 7.81794442939557092300e-05, 7.14072491382608190305e-05, -1.85586374855275456654e-05,
  2.59073051863633712884e-05,
];
const pio4 = 7.85398163397448278999e-01, pio4lo = 3.06161699786838301793e-17;
function kTan(x, y, iy) {
  let z, r, v, w, s;
  const hx = HI(x), ix = hx & 0x7fffffff;
  if (ix < 0x3e300000) {                             // |x| < 2^-28
    if ((x | 0) === 0) {
      if (((ix | LO(x)) | (iy + 1)) === 0) return one / Math.abs(x);
      if (iy === 1) return x;
      z = w = x + y;                                 // -1/(x+y), carefully
      z = setLo(z, 0);
      v = y - (z - x);
      let a, t;
      t = a = -one / w;
      t = setLo(t, 0);
      s = one + t * z;
      return t + a * (s + t * v);
    }
  }
  if (ix >= 0x3FE59428) {                            // |x| >= 0.6744
    if (hx < 0) { x = -x; y = -y; }
    z = pio4 - x; w = pio4lo - y; x = z + w; y = 0.0;
  }
  z = x * x; w = z * z;
  r = T[1] + w * (T[3] + w * (T[5] + w * (T[7] + w * (T[9] + w * T[11]))));
  v = z * (T[2] + w * (T[4] + w * (T[6] + w * (T[8] + w * (T[10] + w * T[12])))));
  s = z * x;
  r = y + z * (s * (r + v) + y);
  r += T[0] * s;
  w = x + r;
  if (ix >= 0x3FE59428) {
    v = iy;
    return (1 - ((hx >> 30) & 2)) * (v - 2.0 * (x - (w * w / (w + v) - r)));
  }
  if (iy === 1) return w;
  let a, t;                                          // -1/(x+r), carefully
  z = setLo(w, 0);
  v = r - (z - x);
  t = a = -1.0 / w;
  t = setLo(t, 0);
  s = 1.0 + t * z;
  return t + a * (s + t * v);
}
function tan(x) {
  const ix = hiAbs(x);
  if (ix <= 0x3fe921fb) return kTan(x, 0.0, 1);      // |x| <= pi/4
  if (ix >= 0x7ff00000) return x - x;                // NaN or infinite: NaN
  if (ix > 0x413921fb) return Math.tan(x);           // beyond the port, as E1
  const n = remPio2(x, ix);
  return kTan(Y0, Y1, 1 - ((n & 1) << 1));           // 1: n even, -1: n odd
}

// ---------------------------------------------------------------- atan (s_atan.c) and atan2 (e_atan2.c)
const atanhi = [4.63647609000806093515e-01, 7.85398163397448278999e-01, 9.82793723247329054082e-01, 1.57079632679489655800e+00];
const atanlo = [2.26987774529616870924e-17, 3.06161699786838301793e-17, 1.39033110312309984516e-17, 6.12323399573676603587e-17];
const aT = [
  3.33333333333329318027e-01, -1.99999999998764832476e-01, 1.42857142725034663711e-01, -1.11111104054623557880e-01,
  9.09088713343650656196e-02, -7.69187620504482999495e-02, 6.66107313738753120669e-02, -5.83357013379057348645e-02,
  4.97687799461593236017e-02, -3.65315727442169155270e-02, 1.62858201153657823623e-02,
];
function atan(x) {
  const hx = HI(x), ix = hx & 0x7fffffff;
  let id;
  if (ix >= 0x44100000) {                            // |x| >= 2^66
    if (ix > 0x7ff00000 || (ix === 0x7ff00000 && LO(x) !== 0)) return x + x;   // NaN
    return hx > 0 ? atanhi[3] + atanlo[3] : -atanhi[3] - atanlo[3];
  }
  if (ix < 0x3fdc0000) {                             // |x| < 0.4375
    if (ix < 0x3e400000) {                           // |x| < 2^-27
      if (huge + x > one) return x;
    }
    id = -1;
  } else {
    x = Math.abs(x);
    if (ix < 0x3ff30000) {                           // |x| < 1.1875
      if (ix < 0x3fe60000) { id = 0; x = (2.0 * x - one) / (2.0 + x); }        // 7/16 <= |x| < 11/16
      else { id = 1; x = (x - one) / (x + one); }                               // 11/16 <= |x| < 19/16
    } else if (ix < 0x40038000) { id = 2; x = (x - 1.5) / (one + 1.5 * x); }    // |x| < 2.4375
    else { id = 3; x = -1.0 / x; }                                              // 2.4375 <= |x| < 2^66
  }
  const z = x * x, w = z * z;
  const s1 = z * (aT[0] + w * (aT[2] + w * (aT[4] + w * (aT[6] + w * (aT[8] + w * aT[10])))));
  const s2 = w * (aT[1] + w * (aT[3] + w * (aT[5] + w * (aT[7] + w * aT[9]))));
  if (id < 0) return x - x * (s1 + s2);
  const zz = atanhi[id] - ((x * (s1 + s2) - atanlo[id]) - x);
  return hx < 0 ? -zz : zz;
}
const pi_o_4 = 7.8539816339744827900E-01, pi_o_2 = 1.5707963267948965580E+00, pi = 3.1415926535897931160E+00;
const pi_lo = 1.2246467991473531772E-16;
function atan2(y, x) {
  if (x !== x || y !== y) return x + y;              // NaN
  const hx = HI(x), lx = LO(x), ix = hx & 0x7fffffff;
  const hy = HI(y), ly = LO(y), iy = hy & 0x7fffffff;
  if (hx === 0x3ff00000 && lx === 0) return atan(y); // x = 1
  let m = ((hy >>> 31) & 1) | ((hx >>> 30) & 2);     // 2 * sign(x) + sign(y)
  if ((iy | ly) === 0) {                             // y = 0
    if (m <= 1) return y;
    return m === 2 ? pi + tiny : -pi - tiny;
  }
  if ((ix | lx) === 0) return hy < 0 ? -pi_o_2 - tiny : pi_o_2 + tiny;          // x = 0
  if (ix === 0x7ff00000) {                           // x infinite
    if (iy === 0x7ff00000) return [pi_o_4 + tiny, -pi_o_4 - tiny, 3.0 * pi_o_4 + tiny, -3.0 * pi_o_4 - tiny][m];
    return [0.0, -0.0, pi + tiny, -pi - tiny][m];
  }
  if (iy === 0x7ff00000) return hy < 0 ? -pi_o_2 - tiny : pi_o_2 + tiny;        // y infinite
  const k = (iy - ix) >> 20;
  let z;
  // |y/x| > 2^60: the answer is +-pi/2 whatever x's sign (FreeBSD's change to fdlibm 5.3, which V8 has: m &= 1).
  // fdlibm 5.3 itself, and Java's StrictMath with it, give one ulp more when x < 0 there (e97's proof: those alone)
  if (k > 60) { z = pi_o_2 + 0.5 * pi_lo; m &= 1; }
  else if (hx < 0 && k < -60) z = 0.0;               // 0 > |y|/x > -2^-60
  else z = atan(Math.abs(y / x));
  switch (m) {
    case 0: return z;
    case 1: return -z;
    case 2: return pi - (z - pi_lo);
    default: return (z - pi_lo) - pi;
  }
}

// ---------------------------------------------------------------- pow (e_pow.c), with JavaScript's edges
const bp = [1.0, 1.5], dp_h = [0.0, 5.84962487220764160156e-01], dp_l = [0.0, 1.35003920212974897128e-08];
const two53 = 9007199254740992.0;
const L1 = 5.99999999999994648725e-01, L2 = 4.28571428578550184252e-01, L3 = 3.33333329818377432918e-01,
  L4 = 2.72728123808534006489e-01, L5 = 2.30660745775561754067e-01, L6 = 2.06975017800338417784e-01;
const lg2 = 6.93147180559945286227e-01, lg2_h = 6.93147182464599609375e-01, lg2_l = -1.90465429995776804525e-09;
const ovt = 8.0085662595372944372e-17;
const cp = 9.61796693925975554329e-01, cp_h = 9.61796700954437255859e-01, cp_l = -7.02846165095275826516e-09;
const ivln2 = 1.44269504088896338700e+00, ivln2_h = 1.44269502162933349609e+00, ivln2_l = 1.92596299112661746887e-08;
const thrd = 3.3333333333333331e-01;

function powC(x, y) {                                // C's pow: 1^y = 1 and x^0 = 1 even for a NaN
  let z, ax, zH, zL, pH, pL, y1, t1, t2, r, s, t, u, v, w;
  let i, j, k, yisint, n;
  let hx = HI(x);
  const lx = LO(x);
  const hy = HI(y), ly = LO(y);
  let ix = hx & 0x7fffffff;
  const iy = hy & 0x7fffffff;
  if ((iy | ly) === 0) return one;                   // x^0 = 1
  if (hx === 0x3ff00000 && lx === 0) return one;     // 1^y = 1
  if (ix > 0x7ff00000 || (ix === 0x7ff00000 && lx !== 0) || iy > 0x7ff00000 || (iy === 0x7ff00000 && ly !== 0)) return x + y;
  // y an odd integer (1), an even integer (2) or neither (0), when x < 0
  yisint = 0;
  if (hx < 0) {
    if (iy >= 0x43400000) yisint = 2;
    else if (iy >= 0x3ff00000) {
      k = (iy >> 20) - 0x3ff;
      if (k > 20) {
        j = ly >>> (52 - k);
        if (((j << (52 - k)) >>> 0) === ly) yisint = 2 - (j & 1);
      } else if (ly === 0) {
        j = iy >> (20 - k);
        if ((j << (20 - k)) === iy) yisint = 2 - (j & 1);
      }
    }
  }
  if (ly === 0) {                                    // y infinite, +-1, 2 or 1/2
    if (iy === 0x7ff00000) {
      if (((ix - 0x3ff00000) | lx) === 0) return one;
      if (ix >= 0x3ff00000) return hy >= 0 ? y : 0.0;
      return hy < 0 ? -y : 0.0;
    }
    if (iy === 0x3ff00000) return hy < 0 ? one / x : x;
    if (hy === 0x40000000) return x * x;
    if (hy === 0x3fe00000 && hx >= 0) return Math.sqrt(x);     // sqrt is correctly rounded in every engine
  }
  ax = Math.abs(x);
  if (lx === 0 && (ix === 0x7ff00000 || ix === 0 || ix === 0x3ff00000)) {        // x +-0, +-inf or +-1
    z = ax;
    if (hy < 0) z = one / z;
    if (hx < 0) {
      if (((ix - 0x3ff00000) | yisint) === 0) z = (z - z) / (z - z);   // (-1)^non-integer: NaN
      else if (yisint === 1) z = -z;
    }
    return z;
  }
  n = (hx >>> 31) - 1;
  if ((n | yisint) === 0) return (x - x) / (x - x);  // (x < 0)^non-integer: NaN
  s = one;
  if ((n | (yisint - 1)) === 0) s = -one;            // (x < 0)^odd
  if (iy > 0x41e00000) {                             // |y| > 2^31
    if (iy > 0x43f00000) {                           // |y| > 2^64: over or underflow
      if (ix <= 0x3fefffff) return hy < 0 ? huge * huge : tiny * tiny;
      if (ix >= 0x3ff00000) return hy > 0 ? huge * huge : tiny * tiny;
    }
    if (ix < 0x3fefffff) return hy < 0 ? s * huge * huge : s * tiny * tiny;
    if (ix > 0x3ff00000) return hy > 0 ? s * huge * huge : s * tiny * tiny;
    t = ax - one;                                    // |1 - x| <= 2^-20: log(x) by its series
    w = (t * t) * (0.5 - t * (thrd - t * 0.25));
    u = ivln2_h * t;
    v = t * ivln2_l - w * ivln2;
    t1 = setLo(u + v, 0);
    t2 = v - (t1 - u);
  } else {
    let ss, s2, sH, sL, tH, tL;
    n = 0;
    if (ix < 0x00100000) { ax *= two53; n -= 53; ix = HI(ax); }   // subnormal x
    n += (ix >> 20) - 0x3ff;
    j = ix & 0x000fffff;
    ix = j | 0x3ff00000;
    if (j <= 0x3988E) k = 0;                         // |x| < sqrt(3/2)
    else if (j < 0xBB67A) k = 1;                     // |x| < sqrt(3)
    else { k = 0; n += 1; ix -= 0x00100000; }
    ax = setHi(ax, ix);
    u = ax - bp[k];                                  // ss = sH + sL = (x - 1)/(x + 1) or (x - 1.5)/(x + 1.5)
    v = one / (ax + bp[k]);
    ss = u * v;
    sH = setLo(ss, 0);
    tH = words(((ix >> 1) | 0x20000000) + 0x00080000 + (k << 18), 0);
    tL = ax - (tH - bp[k]);
    sL = v * ((u - sH * tH) - sH * tL);
    s2 = ss * ss;                                    // log(ax)
    r = s2 * s2 * (L1 + s2 * (L2 + s2 * (L3 + s2 * (L4 + s2 * (L5 + s2 * L6)))));
    r += sL * (sH + ss);
    s2 = sH * sH;
    tH = setLo(3.0 + s2 + r, 0);
    tL = r - ((tH - 3.0) - s2);
    u = sH * tH;
    v = sL * tH + tL * ss;
    pH = setLo(u + v, 0);
    pL = v - (pH - u);
    zH = cp_h * pH;
    zL = cp_l * pH + pL * cp + dp_l[k];
    t = n;                                           // log2(ax) = n + dp_h + zH + zL
    t1 = setLo(((zH + zL) + dp_h[k]) + t, 0);
    t2 = zL - (((t1 - t) - dp_h[k]) - zH);
  }
  y1 = setLo(y, 0);                                  // (y1 + y2) * (t1 + t2)
  pL = (y - y1) * t1 + y * t2;
  pH = y1 * t1;
  z = pL + pH;
  j = HI(z); i = LO(z);
  if (j >= 0x40900000) {                             // z >= 1024
    if (((j - 0x40900000) | i) !== 0) return s * huge * huge;
    if (pL + ovt > z - pH) return s * huge * huge;
  } else if ((j & 0x7fffffff) >= 0x4090cc00) {       // z <= -1075
    if (((j - 0xc090cc00) | i) !== 0) return s * tiny * tiny;
    if (pL <= z - pH) return s * tiny * tiny;
  }
  i = j & 0x7fffffff;                                // 2^(pH + pL)
  k = (i >> 20) - 0x3ff;
  n = 0;
  if (i > 0x3fe00000) {                              // |z| > 0.5: n = [z + 0.5]
    n = j + (0x00100000 >> (k + 1));
    k = ((n & 0x7fffffff) >> 20) - 0x3ff;
    t = words(n & ~(0x000fffff >> k), 0);
    n = ((n & 0x000fffff) | 0x00100000) >> (20 - k);
    if (j < 0) n = -n;
    pH -= t;
  }
  t = setLo(pL + pH, 0);
  u = t * lg2_h;
  v = (pL - (t - pH)) * lg2 + t * lg2_l;
  z = u + v;
  w = v - (z - u);
  t = z * z;
  t1 = z - t * (P1 + t * (P2 + t * (P3 + t * (P4 + t * P5))));
  r = (z * t1) / (t1 - 2.0) - (w + z * w);
  z = one - (r - z);
  j = HI(z);
  j += (n << 20);
  if ((j >> 20) <= 0) z = scalbn(z, n);              // subnormal output
  else z = setHi(z, j);
  return s * z;
}
// JavaScript's Math.pow: NaN when y is NaN, and when |x| is 1 and y is infinite (where C's pow gives 1)
function pow(x, y) {
  if (y !== y) return NaN;
  if ((x === 1 || x === -1) && (y === Infinity || y === -Infinity)) return NaN;
  return powC(x, y);
}

// ---------------------------------------------------------------- hypot, two ways
// fdlibm's e_hypot.c: scaled, then a square root of a sum split so that its rounding error stays under 1 ulp
function hypot(x, y) {
  let a, b, t1, t2, y1, y2, w;
  let ha = HI(x) & 0x7fffffff, hb = HI(y) & 0x7fffffff;
  if (hb > ha) { a = y; b = x; const j = ha; ha = hb; hb = j; } else { a = x; b = y; }
  a = Math.abs(a); b = Math.abs(b);
  if ((ha - hb) > 0x3c00000) return a + b;           // a/b > 2^60
  let k = 0;
  if (ha > 0x5f300000) {                             // a > 2^500
    if (ha >= 0x7ff00000) {                          // infinite or NaN: JavaScript's rule, an infinity wins
      if (a === Infinity || b === Infinity) return Infinity;
      return a + b;
    }
    ha -= 0x25800000; hb -= 0x25800000; k += 600;    // scale by 2^-600
    a = setHi(a, ha); b = setHi(b, hb);
  }
  if (hb < 0x20b00000) {                             // b < 2^-500
    if (hb <= 0x000fffff) {                          // subnormal b or 0
      if ((hb | LO(b)) === 0) return a;
      t1 = words(0x7fd00000, 0);                     // 2^1022
      b *= t1; a *= t1; k -= 1022;
    } else {                                         // scale by 2^600
      ha += 0x25800000; hb += 0x25800000; k -= 600;
      a = setHi(a, ha); b = setHi(b, hb);
    }
  }
  w = a - b;
  if (w > b) {
    t1 = words(ha, 0);
    t2 = a - t1;
    w = Math.sqrt(t1 * t1 - (b * (-b) - t2 * (a + t1)));
  } else {
    a = a + a;
    y1 = words(hb, 0);
    y2 = b - y1;
    t1 = words(ha + 0x00100000, 0);
    t2 = a - t1;
    w = Math.sqrt(t1 * y1 - (w * (-w) - (t1 * y2 + t2 * b)));
  }
  if (k !== 0) return words(0x3ff00000 + (k << 20), 0) * w;
  return w;
}
// V8's Math.hypot (src/builtins/math.tq): the largest magnitude taken out, the squares of the rest summed with Kahan's
// compensation, the square root put back. Plain arithmetic: division, multiplication, addition and sqrt, each correctly
// rounded in every engine.
function hypotV8(...args) {
  if (args.length === 0) return 0;
  let max = 0, nan = false;
  const abs = args.map((v) => { v = +v; if (v !== v) { nan = true; return 0; } const a = Math.abs(v); if (a > max) max = a; return a; });
  if (max === Infinity) return Infinity;
  if (nan) return NaN;
  if (max === 0) return 0;
  let sum = 0, comp = 0;
  for (const a of abs) {
    const n = a / max, summand = n * n - comp, prelim = sum + summand;
    comp = (prelim - sum) - summand;
    sum = prelim;
  }
  return Math.sqrt(sum) * max;
}

module.exports = { exp, log, log10, log10Fbsd, tan, atan, atan2, pow, powC, hypot, hypotV8, scalbn, HI, LO };
