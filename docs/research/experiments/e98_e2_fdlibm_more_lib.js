// e98 (E2's groundwork, after e97): fdlibm's tanh (with the expm1 it uses), acos, asin and cbrt in plain IEEE 754 double
// arithmetic, as e97 did pow, exp, log, log10, tan, atan2 and hypot. A research module: nothing in core/ or site/
// requires it.
//
// The model's calls: Math.tanh in the encounter's contact (encounter.js 325: the friction against the sliding
// velocity, vt / vSlip with vSlip 0.1 m/s), in the step; Math.acos in the plant (systems.js 184: the share of a disc
// under water, d/R in (-1, 1)); Math.cbrt in the plant (systems.js 252: the steam's share above the engines' working
// pressure, in (0, 1)); Math.asin at set-up (core.js 1331: her trim from her drafts, a few thousandths).
//
// The routines as V8 has them (src/base/ieee754.cc: fdlibm by way of FreeBSD's msun). cbrt two ways: V8's is FreeBSD's
// rewrite of 2005 (a polynomial to 23 bits, rounded up, one Newton step: cbrt); fdlibm 5.3's own is older (a rational
// function to 20 bits, one Newton step: cbrtFdlibm53), and it is what Java's StrictMath gives. e98_e2_fdlibm_more.js
// proves each against Node's Math and against fdlibm's own results (Java's StrictMath), as e97.
//
// fdlibm's notice, kept as its licence asks:
//   Copyright (C) 1993 by Sun Microsystems, Inc. All rights reserved.
//   Developed at SunSoft, a Sun Microsystems, Inc. business.
//   Permission to use, copy, modify, and distribute this software is freely granted, provided that this notice is
//   preserved.
'use strict';

const F = new Float64Array(1), U = new Uint32Array(F.buffer);      // little-endian: U[1] the high word, U[0] the low
const HI = (x) => { F[0] = x; return U[1] | 0; };
const LO = (x) => { F[0] = x; return U[0]; };
const setHi = (x, hi) => { F[0] = x; U[1] = hi; return F[0]; };
const setLo = (x, lo) => { F[0] = x; U[0] = lo; return F[0]; };
const words = (hi, lo) => { U[1] = hi; U[0] = lo; return F[0]; };

const one = 1.0, two = 2.0, huge = 1.0e300, tiny = 1.0e-300;
const two1023 = 8.98846567431157953865e+307;

// ---------------------------------------------------------------- expm1 (s_expm1.c)
const o_threshold = 7.09782712893383973096e+02;
const ln2_hi = 6.93147180369123816490e-01, ln2_lo = 1.90821492927058770002e-10, invln2 = 1.44269504088896338700e+00;
const Q1 = -3.33333333333331316428e-02, Q2 = 1.58730158725481460165e-03, Q3 = -7.93650757867487942473e-05,
  Q4 = 4.00821782732936239552e-06, Q5 = -2.01099218183624371326e-07;

function expm1(x) {
  let y, hi, lo, c = 0, t, e, k;
  let hx = HI(x);
  const xsb = hx & 0x80000000;                       // the sign bit
  hx &= 0x7fffffff;
  if (hx >= 0x4043687A) {                            // |x| >= 56 ln2
    if (hx >= 0x40862E42) {                          // |x| >= 709.78...
      if (hx >= 0x7ff00000) {
        if (((hx & 0xfffff) | LO(x)) !== 0) return x + x;      // NaN
        return xsb === 0 ? x : -1.0;                           // expm1(+inf) = inf, expm1(-inf) = -1
      }
      if (x > o_threshold) return huge * huge;
    }
    if (xsb !== 0) {                                 // x < -56 ln2: -1, inexact
      if (x + tiny < 0.0) return tiny - one;
    }
  }
  if (hx > 0x3fd62e42) {                             // |x| > ln2 / 2
    if (hx < 0x3FF0A2B2) {                           // and |x| < 1.5 ln2
      if (xsb === 0) { hi = x - ln2_hi; lo = ln2_lo; k = 1; } else { hi = x + ln2_hi; lo = -ln2_lo; k = -1; }
    } else {
      k = (invln2 * x + (xsb === 0 ? 0.5 : -0.5)) | 0;
      t = k;
      hi = x - t * ln2_hi;
      lo = t * ln2_lo;
    }
    x = hi - lo;
    c = (hi - x) - lo;
  } else if (hx < 0x3c900000) {                      // |x| < 2^-54: x
    t = huge + x;
    return x - (t - (huge + x));
  } else k = 0;
  const hfx = 0.5 * x, hxs = x * hfx;
  const r1 = one + hxs * (Q1 + hxs * (Q2 + hxs * (Q3 + hxs * (Q4 + hxs * Q5))));
  t = 3.0 - r1 * hfx;
  e = hxs * ((r1 - t) / (6.0 - x * t));
  if (k === 0) return x - (x * e - hxs);
  const twopk = words(0x3ff00000 + (k << 20), 0);
  e = (x * (e - c) - c);
  e -= hxs;
  if (k === -1) return 0.5 * (x - e) - 0.5;
  if (k === 1) {
    if (x < -0.25) return -2.0 * (e - (x + 0.5));
    return one + 2.0 * (x - e);
  }
  if (k <= -2 || k > 56) {                           // exp(x) - 1 will do
    y = one - (e - x);
    if (k === 1024) y = y * 2.0 * two1023;
    else y = y * twopk;
    return y - one;
  }
  if (k < 20) {
    t = words(0x3ff00000 - (0x200000 >> k), 0);      // 1 - 2^-k
    y = t - (e - x);
    y = y * twopk;
  } else {
    t = words((0x3ff - k) << 20, 0);                 // 2^-k
    y = x - (e + t);
    y += one;
    y = y * twopk;
  }
  return y;
}

// ---------------------------------------------------------------- tanh (s_tanh.c)
function tanh(x) {
  let t, z;
  const jx = HI(x), ix = jx & 0x7fffffff;
  if (ix >= 0x7ff00000) {                            // infinite or NaN
    if (jx >= 0) return one / x + one;               // tanh(+inf) = 1
    return one / x - one;                            // tanh(-inf) = -1, tanh(NaN) = NaN
  }
  if (ix < 0x40360000) {                             // |x| < 22
    // |x| < 2^-28: x itself (FreeBSD's change to fdlibm 5.3, which V8 has). fdlibm 5.3 returns x(1 + x) only below
    // 2^-55 and goes by way of expm1 between, landing one ulp off on some (Java's StrictMath: e98's proof, those alone)
    if (ix < 0x3e300000) {
      if (huge + x > one) return x;
    }
    if (ix >= 0x3ff00000) {                          // |x| >= 1
      t = expm1(two * Math.abs(x));
      z = one - two / (t + two);
    } else {
      t = expm1(-two * Math.abs(x));
      z = -t / (t + two);
    }
  } else z = one - tiny;                             // |x| >= 22: +-1
  return jx >= 0 ? z : -z;
}

// ---------------------------------------------------------------- asin (e_asin.c) and acos (e_acos.c)
const pi = 3.14159265358979311600e+00, pio2_hi = 1.57079632679489655800e+00, pio2_lo = 6.12323399573676603587e-17,
  pio4_hi = 7.85398163397448278999e-01;
const pS0 = 1.66666666666666657415e-01, pS1 = -3.25565818622400915405e-01, pS2 = 2.01212532134862925881e-01,
  pS3 = -4.00555345006794114027e-02, pS4 = 7.91534994289814532176e-04, pS5 = 3.47933107596021167570e-05;
const qS1 = -2.40339491173441421878e+00, qS2 = 2.02094576023350569471e+00, qS3 = -6.88283971605453293030e-01,
  qS4 = 7.70381505559019352791e-02;
const P = (z) => z * (pS0 + z * (pS1 + z * (pS2 + z * (pS3 + z * (pS4 + z * pS5)))));
const Q = (z) => one + z * (qS1 + z * (qS2 + z * (qS3 + z * qS4)));

function asin(x) {
  let t, w, p, q, c, r, s;
  const hx = HI(x), ix = hx & 0x7fffffff;
  if (ix >= 0x3ff00000) {                            // |x| >= 1
    if (((ix - 0x3ff00000) | LO(x)) === 0) return x * pio2_hi + x * pio2_lo;   // asin(+-1) = +-pi/2
    return (x - x) / (x - x);                        // |x| > 1: NaN
  } else if (ix < 0x3fe00000) {                      // |x| < 0.5
    if (ix < 0x3e500000) {                           // |x| < 2^-26
      if (huge + x > one) return x;
    }
    t = x * x;
    p = P(t); q = Q(t);
    w = p / q;
    return x + x * w;
  }
  w = one - Math.abs(x);                             // 1 > |x| >= 0.5
  t = w * 0.5;
  p = P(t); q = Q(t);
  s = Math.sqrt(t);
  if (ix >= 0x3FEF3333) {                            // |x| > 0.975
    w = p / q;
    t = pio2_hi - (2.0 * (s + s * w) - pio2_lo);
  } else {
    w = setLo(s, 0);
    c = (t - w * w) / (s + w);
    r = p / q;
    p = 2.0 * s * r - (pio2_lo - 2.0 * c);
    q = pio4_hi - 2.0 * w;
    t = pio4_hi - (p - q);
  }
  return hx > 0 ? t : -t;
}

function acos(x) {
  let z, p, q, r, w, s, c, df;
  const hx = HI(x), ix = hx & 0x7fffffff;
  if (ix >= 0x3ff00000) {                            // |x| >= 1
    if (((ix - 0x3ff00000) | LO(x)) === 0) {         // |x| = 1
      if (hx > 0) return 0.0;                        // acos(1) = 0
      return pi + 2.0 * pio2_lo;                     // acos(-1) = pi
    }
    return (x - x) / (x - x);                        // |x| > 1: NaN
  }
  if (ix < 0x3fe00000) {                             // |x| < 0.5
    if (ix <= 0x3c600000) return pio2_hi + pio2_lo;  // |x| < 2^-57
    z = x * x;
    p = P(z); q = Q(z);
    r = p / q;
    return pio2_hi - (x - (pio2_lo - x * r));
  } else if (hx < 0) {                               // x < -0.5
    z = (one + x) * 0.5;
    p = P(z); q = Q(z);
    s = Math.sqrt(z);
    r = p / q;
    w = r * s - pio2_lo;
    return pi - 2.0 * (s + w);
  }
  z = (one - x) * 0.5;                               // x > 0.5
  s = Math.sqrt(z);
  df = setLo(s, 0);
  c = (z - df * df) / (s + df);
  p = P(z); q = Q(z);
  r = p / q;
  w = r * s + c;
  return 2.0 * (df + w);
}

// ---------------------------------------------------------------- cbrt, two ways
const B1 = 715094163, B2 = 696219795;                // (1023 - 1023/3 - 0.03306235651) * 2^20; less 54/3 for B2
// V8's (FreeBSD's s_cbrt.c of 2005): |1/cbrt(x) - p(x)| < 2^-23.5, rounded up to 23 bits, one Newton step
const C0 = 1.87595182427177009643, C1 = -1.88497979543377169875, C2 = 1.621429720105354466140,
  C3 = -0.758397934778766047437, C4 = 0.145996192886612446982;
function cbrt(x) {
  let hx = HI(x);
  const low = LO(x), sign = hx & 0x80000000;
  hx ^= sign;
  if (hx >= 0x7ff00000) return x + x;                // NaN, infinite: itself
  let t;
  if (hx < 0x00100000) {                             // 0 or subnormal
    if ((hx | low) === 0) return x;
    t = words(0x43500000, 0) * x;                    // 2^54 x
    const high = HI(t) & 0x7fffffff;
    t = words(sign | (Math.floor(high / 3) + B2), 0);
  } else t = words(sign | (Math.floor(hx / 3) + B1), 0);
  let r = (t * t) * (t / x);
  t = t * ((C0 + r * (C1 + r * C2)) + ((r * r) * r) * (C3 + r * C4));
  F[0] = t;                                          // round away from zero to 23 bits
  let lo = U[0] + 0x80000000, hi = U[1];
  if (lo >= 4294967296) { lo -= 4294967296; hi = (hi + 1) >>> 0; }
  U[1] = hi; U[0] = (lo & 0xc0000000) >>> 0;
  t = F[0];
  const s = t * t;                                   // one Newton step to 53 bits
  r = x / s;
  const w = t + t;
  r = (r - t) / (w + r);
  return t + t * r;
}
// fdlibm 5.3's own (Java's StrictMath): a rational function to 20 bits, chopped and made larger, one Newton step
const CC = 5.42857142857142815906e-01, DD = -7.05306122448979611050e-01, EE = 1.41428571428571436819e+00,
  FF = 1.60714285714285720630e+00, GG = 3.57142857142857150787e-01;
function cbrtFdlibm53(x) {
  let hx = HI(x);
  const sign = hx & 0x80000000;
  hx ^= sign;
  if (hx >= 0x7ff00000) return x + x;
  if ((hx | LO(x)) === 0) return x;
  x = setHi(x, hx);                                  // |x|
  let t = 0.0;
  if (hx < 0x00100000) {                             // subnormal
    t = words(0x43500000, 0) * x;
    t = setHi(t, Math.floor(HI(t) / 3) + B2);
  } else t = words(Math.floor(hx / 3) + B1, 0);
  let r = t * t / x, s = CC + r * t;
  t *= GG + FF / (s + EE + DD / s);
  t = setLo(t, 0); t = setHi(t, HI(t) + 1);          // chopped to 20 bits, made larger than cbrt(x)
  s = t * t;
  r = x / s;
  const w = t + t;
  r = (r - t) / (w + r);
  t = t + t * r;
  return setHi(t, HI(t) | sign);                     // the sign back
}

module.exports = { expm1, tanh, asin, acos, cbrt, cbrtFdlibm53, HI, LO };
