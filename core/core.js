/*
 * Titanic flooding core — headless, deterministic, no DOM.
 *
 * Ship frame: x forward from amidships (m), y to PORT, z up from the keel baseline.
 * World frame: X, Y horizontal, Z up; the sea surface is Z = 0.
 * Pose: heave (world Z of the ship's reference point), pitch theta (bow down +),
 *       roll phi (starboard down +). R = Ry(theta) * Rx(phi).
 *
 * The hull is integrated as vertical columns in the ship frame (the "proxy" idea
 * from VXGI, applied to water). Every hydrostatic quantity — buoyancy, flood water
 * volume, free-surface shift — comes from the same column set, at any attitude.
 *
 * State lives in flat typed arrays so the step maps 1:1 onto C++/CUDA later
 * (columns -> threads, nodes -> warps, scenarios -> blocks).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TitanicCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------------------------------------------------------------- the model's own sine and cosine (E1, backlog X1)
  // Two engines may round Math.sin and Math.cos differently: System Node and Electron's V8 differ on about 3.5 % of
  // angles, by one unit in the last place (docs/DESIGN_electron_desktop_client_v2_2026-11-20.md, section 3), which is
  // why a watch in the page parts from the same watch in Node in its last bits. These are fdlibm's sin and cos (the
  // routines V8 has used) in plain arithmetic of doubles, which every IEEE 754 engine does alike: equal to Node's own on
  // the 4,000,000 angles of docs/research/experiments/e70_engine_math_probe.js, so Node's bits do not move. Every
  // computation of the model calls these (C.sin, C.cos), not Math's; the viewer may keep Math's. Good for |x| up to
  // 2^19 pi/2 (about 823,000 rad); beyond that, or for a value that is not finite, Math's own is used (the long table of
  // pi's digits that fdlibm takes there is not ported).
  const FM = (function () {
    const F = new Float64Array(1), U = new Uint32Array(F.buffer);   // little-endian: U[1] is the high word
    const S1 = -1.66666666666666324348e-01, S2 = 8.33333333332248946124e-03, S3 = -1.98412698298579493134e-04,
      S4 = 2.75573137070700676789e-06, S5 = -2.50507602534068634195e-08, S6 = 1.58969099521155010221e-10;
    const C1 = 4.16666666666666019037e-02, C2 = -1.38888888888741095749e-03, C3 = 2.48015872894767294178e-05,
      C4 = -2.75573143513906633035e-07, C5 = 2.08757232129817482790e-09, C6 = -1.13596475577881948265e-11;
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
    const hi = (x) => { F[0] = x; return U[1] & 0x7fffffff; };
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
    // x less the nearest multiple of pi/2, as Y0 + Y1; the number of quarter turns taken off (pi/4 < |x| <= 2^19 pi/2)
    function remPio2(x, ix) {
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
      let t = x < 0 ? -x : x;
      const n = (t * INVPIO2 + 0.5) | 0, fn = n;
      let r = t - fn * PIO2_1, w = fn * PIO2_1T;
      if (n < 32 && ix !== NPIO2_HW[n - 1]) Y0 = r - w;
      else {
        const j = ix >> 20;
        Y0 = r - w;
        if (j - ((hi(Y0) >> 20) & 0x7ff) > 16) {
          t = r; w = fn * PIO2_2; r = t - w; w = fn * PIO2_2T - ((t - r) - w);
          Y0 = r - w;
          if (j - ((hi(Y0) >> 20) & 0x7ff) > 49) {
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
      const ix = hi(x);
      if (ix <= 0x3fe921fb) return kSin(x, 0, 0);
      if (ix > 0x413921fb) return Math.sin(x);       // beyond the port, or not finite
      switch (remPio2(x, ix) & 3) {
        case 0: return kSin(Y0, Y1, 1);
        case 1: return kCos(Y0, Y1);
        case 2: return -kSin(Y0, Y1, 1);
        default: return -kCos(Y0, Y1);
      }
    }
    function cos(x) {
      const ix = hi(x);
      if (ix <= 0x3fe921fb) return kCos(x, 0);
      if (ix > 0x413921fb) return Math.cos(x);
      switch (remPio2(x, ix) & 3) {
        case 0: return kCos(Y0, Y1);
        case 1: return -kSin(Y0, Y1, 1);
        case 2: return -kCos(Y0, Y1);
        default: return kSin(Y0, Y1, 1);
      }
    }
    // ---- E2a: the model's own exp, log, log10, tan, atan2, hypot, tanh (by its expm1), asin, acos and cbrt, as V8 has
    // them (fdlibm's, by way of FreeBSD's msun; hypot V8's own scaled sum with Kahan's compensation), in plain doubles:
    // equal to Node's Math on every input of docs/research/experiments/e97 and e98 (a million a function, in the model's
    // ranges, and fdlibm's own results by Java's StrictMath), so Node's bits do not move. And pow, fdlibm's, which this
    // file calls at every power since the calibration epoch's B1 (G17): Node's Math.pow is the C runtime's, so taking it
    // moved Node's bits once, a change of arithmetic, not of physics (the seams reference refrozen from ef60334 itself
    // with this routine preloaded over its Math.pow: tools/pow_preload.js, docs/research/experiments/e107).
    // fdlibm: Copyright (C) 1993 by Sun Microsystems, Inc. All rights reserved. Developed at SunSoft, a Sun
    // Microsystems, Inc. business. Permission to use, copy, modify, and distribute this software is freely granted,
    // provided that this notice is preserved.
    const HI = (x) => { F[0] = x; return U[1] | 0; }, LO = (x) => { F[0] = x; return U[0]; };
    const setHi = (x, h) => { F[0] = x; U[1] = h; return F[0]; }, setLo = (x, l) => { F[0] = x; U[0] = l; return F[0]; };
    const words = (h, l) => { U[1] = h; U[0] = l; return F[0]; };
    const HUGE = 1.0e300, TINY = 1.0e-300, TWO54 = 1.80143985094819840000e+16, TWOM54 = 5.55111512312578270212e-17;
    const TWOM1000 = 9.33263618503218878990e-302, TWO1023 = 8.98846567431157953865e+307;
    const LN2_HI = 6.93147180369123816490e-01, LN2_LO = 1.90821492927058770002e-10, INVLN2 = 1.44269504088896338700e+00;
    function scalbn(x, n) {
      let hx = HI(x);
      const lx = LO(x);
      let k = (hx & 0x7ff00000) >> 20;
      if (k === 0) { if ((lx | (hx & 0x7fffffff)) === 0) return x; x *= TWO54; hx = HI(x); k = ((hx & 0x7ff00000) >> 20) - 54; if (n < -50000) return TINY * x; }
      if (k === 0x7ff) return x + x;
      k = k + n;
      if (k > 0x7fe) return HUGE * (x < 0 ? -HUGE : HUGE);
      if (k > 0) return setHi(x, (hx & 0x800fffff) | (k << 20));
      if (k <= -54) return n > 50000 ? HUGE * (x < 0 ? -HUGE : HUGE) : TINY * (x < 0 ? -TINY : TINY);
      x = setHi(x, (hx & 0x800fffff) | ((k + 54) << 20));
      return x * TWOM54;
    }
    // exp (e_exp.c), with V8's exp(1) = e's own double
    const EP1 = 1.66666666666666019037e-01, EP2 = -2.77777777770155933842e-03, EP3 = 6.61375632143793436117e-05,
      EP4 = -1.65339022054652515390e-06, EP5 = 4.13813679705723846039e-08;
    function exp(x) {
      let hx = HI(x);
      const xsb = (hx >>> 31) & 1;
      hx &= 0x7fffffff;
      let hi = 0, lo = 0, k = 0;
      if (hx >= 0x40862E42) {
        if (hx >= 0x7ff00000) { if (((hx & 0xfffff) | LO(x)) !== 0) return x + x; return xsb === 0 ? x : 0.0; }
        if (x > 7.09782712893383973096e+02) return HUGE * HUGE;
        if (x < -7.45133219101941108420e+02) return TWOM1000 * TWOM1000;
      }
      if (hx > 0x3fd62e42) {
        if (hx < 0x3FF0A2B2) {
          if (x === 1.0) return 2.718281828459045;
          if (xsb === 0) { hi = x - LN2_HI; lo = LN2_LO; k = 1; } else { hi = x + LN2_HI; lo = -LN2_LO; k = -1; }
        } else {
          k = (INVLN2 * x + (xsb === 0 ? 0.5 : -0.5)) | 0;
          hi = x - k * LN2_HI; lo = k * LN2_LO;
        }
        x = hi - lo;
      } else if (hx < 0x3e300000) { if (HUGE + x > 1) return 1 + x; } else k = 0;
      const t = x * x;
      const twopk = k >= -1021 ? words(0x3ff00000 + (k << 20), 0) : words(0x3ff00000 + ((k + 1000) << 20), 0);
      const c = x - t * (EP1 + t * (EP2 + t * (EP3 + t * (EP4 + t * EP5))));
      if (k === 0) return 1 - ((x * c) / (c - 2.0) - x);
      const y = 1 - ((lo - (x * c) / (2.0 - c)) - hi);
      if (k >= -1021) return k === 1024 ? y * 2.0 * TWO1023 : y * twopk;
      return y * twopk * TWOM1000;
    }
    // log (e_log.c) and log10 (e_log10.c, fdlibm 5.3's form, V8's)
    const LG1 = 6.666666666666735130e-01, LG2 = 3.999999999940941908e-01, LG3 = 2.857142874366239149e-01,
      LG4 = 2.222219843214978396e-01, LG5 = 1.818357216161805012e-01, LG6 = 1.531383769920937332e-01, LG7 = 1.479819860511658591e-01;
    function log(x) {
      let hx = HI(x);
      const lx = LO(x);
      let k = 0;
      if (hx < 0x00100000) {
        if (((hx & 0x7fffffff) | lx) === 0) return -TWO54 / 0.0;
        if (hx < 0) return (x - x) / 0.0;
        k -= 54; x *= TWO54; hx = HI(x);
      }
      if (hx >= 0x7ff00000) return x + x;
      k += (hx >> 20) - 1023;
      hx &= 0x000fffff;
      let i = (hx + 0x95f64) & 0x100000;
      x = setHi(x, hx | (i ^ 0x3ff00000));
      k += (i >> 20);
      const f = x - 1.0;
      if ((0x000fffff & (2 + hx)) < 3) {
        if (f === 0) return k === 0 ? 0 : k * LN2_HI + k * LN2_LO;
        const R = f * f * (0.5 - 0.33333333333333333 * f);
        return k === 0 ? f - R : k * LN2_HI - ((R - k * LN2_LO) - f);
      }
      const s = f / (2.0 + f), dk = k, z = s * s;
      i = hx - 0x6147a;
      const w = z * z, j = 0x6b851 - hx;
      const t1 = w * (LG2 + w * (LG4 + w * LG6)), t2 = z * (LG1 + w * (LG3 + w * (LG5 + w * LG7)));
      i |= j;
      const R = t2 + t1;
      if (i > 0) {
        const hfsq = 0.5 * f * f;
        return k === 0 ? f - (hfsq - s * (hfsq + R)) : dk * LN2_HI - ((hfsq - (s * (hfsq + R) + dk * LN2_LO)) - f);
      }
      return k === 0 ? f - s * (f - R) : dk * LN2_HI - ((s * (f - R) - dk * LN2_LO) - f);
    }
    function log10(x) {
      let hx = HI(x), lx = LO(x), k = 0;
      if (hx < 0x00100000) {
        if (((hx & 0x7fffffff) | lx) === 0) return -TWO54 / 0.0;
        if (hx < 0) return (x - x) / 0.0;
        k -= 54; x *= TWO54; hx = HI(x); lx = LO(x);
      }
      if (hx >= 0x7ff00000) return x + x;
      if (hx === 0x3ff00000 && lx === 0) return 0;
      k += (hx >> 20) - 1023;
      const i = k >>> 31;
      hx = (hx & 0x000fffff) | ((0x3ff - i) << 20);
      const y = k + i;
      x = words(hx, lx);
      const z = y * 3.69423907715893078616e-13 + 4.34294481903251816668e-01 * log(x);
      return z + y * 3.01029995663611771306e-01;
    }
    // tan (s_tan.c, k_tan.c), by E1's remPio2
    const TT = [3.33333333333334091986e-01, 1.33333333333201242699e-01, 5.39682539762260521377e-02, 2.18694882948595424599e-02,
      8.86323982359930005737e-03, 3.59207910759131235356e-03, 1.45620945432529025516e-03, 5.88041240820264096874e-04,
      2.46463134818469906812e-04, 7.81794442939557092300e-05, 7.14072491382608190305e-05, -1.85586374855275456654e-05,
      2.59073051863633712884e-05];
    function kTan(x, y, iy) {
      let z, r, v, w, s, a, t;
      const hx = HI(x), ix = hx & 0x7fffffff;
      if (ix < 0x3e300000 && (x | 0) === 0) {
        if (((ix | LO(x)) | (iy + 1)) === 0) return 1 / Math.abs(x);
        if (iy === 1) return x;
        z = w = x + y; z = setLo(z, 0); v = y - (z - x);
        t = a = -1 / w; t = setLo(t, 0); s = 1 + t * z;
        return t + a * (s + t * v);
      }
      if (ix >= 0x3FE59428) {
        if (hx < 0) { x = -x; y = -y; }
        z = 7.85398163397448278999e-01 - x; w = 3.06161699786838301793e-17 - y; x = z + w; y = 0.0;
      }
      z = x * x; w = z * z;
      r = TT[1] + w * (TT[3] + w * (TT[5] + w * (TT[7] + w * (TT[9] + w * TT[11]))));
      v = z * (TT[2] + w * (TT[4] + w * (TT[6] + w * (TT[8] + w * (TT[10] + w * TT[12])))));
      s = z * x;
      r = y + z * (s * (r + v) + y);
      r += TT[0] * s;
      w = x + r;
      if (ix >= 0x3FE59428) { v = iy; return (1 - ((hx >> 30) & 2)) * (v - 2.0 * (x - (w * w / (w + v) - r))); }
      if (iy === 1) return w;
      z = setLo(w, 0); v = r - (z - x);
      t = a = -1.0 / w; t = setLo(t, 0); s = 1.0 + t * z;
      return t + a * (s + t * v);
    }
    function tan(x) {
      const ix = hi(x);
      if (ix <= 0x3fe921fb) return kTan(x, 0.0, 1);
      if (ix >= 0x7ff00000) return x - x;
      if (ix > 0x413921fb) return Math.tan(x);       // beyond the port, as sin and cos
      const n = remPio2(x, ix);
      return kTan(Y0, Y1, 1 - ((n & 1) << 1));
    }
    // atan (s_atan.c) and atan2 (e_atan2.c)
    const ATANHI = [4.63647609000806093515e-01, 7.85398163397448278999e-01, 9.82793723247329054082e-01, 1.57079632679489655800e+00];
    const ATANLO = [2.26987774529616870924e-17, 3.06161699786838301793e-17, 1.39033110312309984516e-17, 6.12323399573676603587e-17];
    const AT = [3.33333333333329318027e-01, -1.99999999998764832476e-01, 1.42857142725034663711e-01, -1.11111104054623557880e-01,
      9.09088713343650656196e-02, -7.69187620504482999495e-02, 6.66107313738753120669e-02, -5.83357013379057348645e-02,
      4.97687799461593236017e-02, -3.65315727442169155270e-02, 1.62858201153657823623e-02];
    function atan(x) {
      const hx = HI(x), ix = hx & 0x7fffffff;
      let id;
      if (ix >= 0x44100000) {
        if (ix > 0x7ff00000 || (ix === 0x7ff00000 && LO(x) !== 0)) return x + x;
        return hx > 0 ? ATANHI[3] + ATANLO[3] : -ATANHI[3] - ATANLO[3];
      }
      if (ix < 0x3fdc0000) { if (ix < 0x3e400000 && HUGE + x > 1) return x; id = -1; }
      else {
        x = Math.abs(x);
        if (ix < 0x3ff30000) {
          if (ix < 0x3fe60000) { id = 0; x = (2.0 * x - 1) / (2.0 + x); } else { id = 1; x = (x - 1) / (x + 1); }
        } else if (ix < 0x40038000) { id = 2; x = (x - 1.5) / (1 + 1.5 * x); } else { id = 3; x = -1.0 / x; }
      }
      const z = x * x, w = z * z;
      const s1 = z * (AT[0] + w * (AT[2] + w * (AT[4] + w * (AT[6] + w * (AT[8] + w * AT[10])))));
      const s2 = w * (AT[1] + w * (AT[3] + w * (AT[5] + w * (AT[7] + w * AT[9]))));
      if (id < 0) return x - x * (s1 + s2);
      const zz = ATANHI[id] - ((x * (s1 + s2) - ATANLO[id]) - x);
      return hx < 0 ? -zz : zz;
    }
    const PI_O_4 = 7.8539816339744827900E-01, PI_O_2 = 1.5707963267948965580E+00, PI = 3.1415926535897931160E+00,
      PI_LO = 1.2246467991473531772E-16;
    function atan2(y, x) {
      if (x !== x || y !== y) return x + y;
      const hx = HI(x), lx = LO(x), ix = hx & 0x7fffffff, hy = HI(y), ly = LO(y), iy = hy & 0x7fffffff;
      if (hx === 0x3ff00000 && lx === 0) return atan(y);
      let m = ((hy >>> 31) & 1) | ((hx >>> 30) & 2);
      if ((iy | ly) === 0) return m <= 1 ? y : (m === 2 ? PI + TINY : -PI - TINY);
      if ((ix | lx) === 0) return hy < 0 ? -PI_O_2 - TINY : PI_O_2 + TINY;
      if (ix === 0x7ff00000) {
        if (iy === 0x7ff00000) return [PI_O_4 + TINY, -PI_O_4 - TINY, 3.0 * PI_O_4 + TINY, -3.0 * PI_O_4 - TINY][m];
        return [0.0, -0.0, PI + TINY, -PI - TINY][m];
      }
      if (iy === 0x7ff00000) return hy < 0 ? -PI_O_2 - TINY : PI_O_2 + TINY;
      const k = (iy - ix) >> 20;
      let z;
      if (k > 60) { z = PI_O_2 + 0.5 * PI_LO; m &= 1; } else if (hx < 0 && k < -60) z = 0.0; else z = atan(Math.abs(y / x));
      return m === 0 ? z : (m === 1 ? -z : (m === 2 ? PI - (z - PI_LO) : (z - PI_LO) - PI));
    }
    // hypot: V8's own (src/builtins/math.tq), for two arguments
    function hypot(x, y) {
      x = +x; y = +y;
      const a = Math.abs(x), b = Math.abs(y);
      const max = (x !== x ? 0 : a) > (y !== y ? 0 : b) ? a : b;
      if (a === Infinity || b === Infinity) return Infinity;
      if (x !== x || y !== y) return NaN;
      if (max === 0) return 0;
      let sum = 0, comp = 0;
      for (const v of [a, b]) { const n = v / max, summand = n * n - comp, prelim = sum + summand; comp = (prelim - sum) - summand; sum = prelim; }
      return Math.sqrt(sum) * max;
    }
    // expm1 (s_expm1.c) and tanh (s_tanh.c)
    const EQ1 = -3.33333333333331316428e-02, EQ2 = 1.58730158725481460165e-03, EQ3 = -7.93650757867487942473e-05,
      EQ4 = 4.00821782732936239552e-06, EQ5 = -2.01099218183624371326e-07;
    function expm1(x) {
      let y, hi, lo, c = 0, t, e, k;
      let hx = HI(x);
      const xsb = hx & 0x80000000;
      hx &= 0x7fffffff;
      if (hx >= 0x4043687A) {
        if (hx >= 0x40862E42) {
          if (hx >= 0x7ff00000) { if (((hx & 0xfffff) | LO(x)) !== 0) return x + x; return xsb === 0 ? x : -1.0; }
          if (x > 7.09782712893383973096e+02) return HUGE * HUGE;
        }
        if (xsb !== 0 && x + TINY < 0.0) return TINY - 1;
      }
      if (hx > 0x3fd62e42) {
        if (hx < 0x3FF0A2B2) {
          if (xsb === 0) { hi = x - LN2_HI; lo = LN2_LO; k = 1; } else { hi = x + LN2_HI; lo = -LN2_LO; k = -1; }
        } else {
          k = (INVLN2 * x + (xsb === 0 ? 0.5 : -0.5)) | 0;
          hi = x - k * LN2_HI; lo = k * LN2_LO;
        }
        x = hi - lo;
        c = (hi - x) - lo;
      } else if (hx < 0x3c900000) { t = HUGE + x; return x - (t - (HUGE + x)); } else k = 0;
      const hfx = 0.5 * x, hxs = x * hfx;
      const r1 = 1 + hxs * (EQ1 + hxs * (EQ2 + hxs * (EQ3 + hxs * (EQ4 + hxs * EQ5))));
      t = 3.0 - r1 * hfx;
      e = hxs * ((r1 - t) / (6.0 - x * t));
      if (k === 0) return x - (x * e - hxs);
      const twopk = words(0x3ff00000 + (k << 20), 0);
      e = (x * (e - c) - c);
      e -= hxs;
      if (k === -1) return 0.5 * (x - e) - 0.5;
      if (k === 1) return x < -0.25 ? -2.0 * (e - (x + 0.5)) : 1 + 2.0 * (x - e);
      if (k <= -2 || k > 56) { y = 1 - (e - x); y = k === 1024 ? y * 2.0 * TWO1023 : y * twopk; return y - 1; }
      if (k < 20) { t = words(0x3ff00000 - (0x200000 >> k), 0); y = t - (e - x); y = y * twopk; }
      else { t = words((0x3ff - k) << 20, 0); y = x - (e + t); y += 1; y = y * twopk; }
      return y;
    }
    function tanh(x) {
      let t, z;
      const jx = HI(x), ix = jx & 0x7fffffff;
      if (ix >= 0x7ff00000) return jx >= 0 ? 1 / x + 1 : 1 / x - 1;
      if (ix < 0x40360000) {
        if (ix < 0x3e300000 && HUGE + x > 1) return x;
        if (ix >= 0x3ff00000) { t = expm1(2 * Math.abs(x)); z = 1 - 2 / (t + 2); } else { t = expm1(-2 * Math.abs(x)); z = -t / (t + 2); }
      } else z = 1 - TINY;
      return jx >= 0 ? z : -z;
    }
    // asin (e_asin.c) and acos (e_acos.c)
    const PIO2_HI = 1.57079632679489655800e+00, PIO2_LO = 6.12323399573676603587e-17, PIO4_HI = 7.85398163397448278999e-01;
    const AP = (z) => z * (1.66666666666666657415e-01 + z * (-3.25565818622400915405e-01 + z * (2.01212532134862925881e-01 +
      z * (-4.00555345006794114027e-02 + z * (7.91534994289814532176e-04 + z * 3.47933107596021167570e-05)))));
    const AQ = (z) => 1 + z * (-2.40339491173441421878e+00 + z * (2.02094576023350569471e+00 + z * (-6.88283971605453293030e-01 +
      z * 7.70381505559019352791e-02)));
    function asin(x) {
      let t, w, p, q, c, r, s;
      const hx = HI(x), ix = hx & 0x7fffffff;
      if (ix >= 0x3ff00000) { if (((ix - 0x3ff00000) | LO(x)) === 0) return x * PIO2_HI + x * PIO2_LO; return (x - x) / (x - x); }
      if (ix < 0x3fe00000) {
        if (ix < 0x3e500000 && HUGE + x > 1) return x;
        t = x * x; w = AP(t) / AQ(t);
        return x + x * w;
      }
      w = 1 - Math.abs(x); t = w * 0.5; p = AP(t); q = AQ(t); s = Math.sqrt(t);
      if (ix >= 0x3FEF3333) { w = p / q; t = PIO2_HI - (2.0 * (s + s * w) - PIO2_LO); }
      else {
        w = setLo(s, 0); c = (t - w * w) / (s + w); r = p / q;
        p = 2.0 * s * r - (PIO2_LO - 2.0 * c); q = PIO4_HI - 2.0 * w; t = PIO4_HI - (p - q);
      }
      return hx > 0 ? t : -t;
    }
    function acos(x) {
      let z, r, w, s, c, df;
      const hx = HI(x), ix = hx & 0x7fffffff;
      if (ix >= 0x3ff00000) {
        if (((ix - 0x3ff00000) | LO(x)) === 0) return hx > 0 ? 0.0 : PI + 2.0 * PIO2_LO;
        return (x - x) / (x - x);
      }
      if (ix < 0x3fe00000) {
        if (ix <= 0x3c600000) return PIO2_HI + PIO2_LO;
        z = x * x; r = AP(z) / AQ(z);
        return PIO2_HI - (x - (PIO2_LO - x * r));
      } else if (hx < 0) {
        z = (1 + x) * 0.5; s = Math.sqrt(z); r = AP(z) / AQ(z); w = r * s - PIO2_LO;
        return PI - 2.0 * (s + w);
      }
      z = (1 - x) * 0.5; s = Math.sqrt(z); df = setLo(s, 0); c = (z - df * df) / (s + df); r = AP(z) / AQ(z); w = r * s + c;
      return 2.0 * (df + w);
    }
    // cbrt: V8's (FreeBSD's s_cbrt.c of 2005)
    function cbrt(x) {
      let hx = HI(x);
      const low = LO(x), sign = hx & 0x80000000;
      hx ^= sign;
      if (hx >= 0x7ff00000) return x + x;
      let t;
      if (hx < 0x00100000) {
        if ((hx | low) === 0) return x;
        t = words(0x43500000, 0) * x;
        t = words(sign | (Math.floor((HI(t) & 0x7fffffff) / 3) + 696219795), 0);
      } else t = words(sign | (Math.floor(hx / 3) + 715094163), 0);
      let r = (t * t) * (t / x);
      t = t * ((1.87595182427177009643 + r * (-1.88497979543377169875 + r * 1.621429720105354466140)) +
        ((r * r) * r) * (-0.758397934778766047437 + r * 0.145996192886612446982));
      F[0] = t;
      let lo = U[0] + 0x80000000, h = U[1];
      if (lo >= 4294967296) { lo -= 4294967296; h = (h + 1) >>> 0; }
      U[1] = h; U[0] = (lo & 0xc0000000) >>> 0;
      t = F[0];
      const s = t * t;
      r = x / s;
      const w = t + t;
      r = (r - t) / (w + r);
      return t + t * r;
    }
    // pow (e_pow.c), with JavaScript's edges; every power of this file since the epoch's B1 (G17)
    const BP = [1.0, 1.5], DP_H = [0.0, 5.84962487220764160156e-01], DP_L = [0.0, 1.35003920212974897128e-08];
    const PL1 = 5.99999999999994648725e-01, PL2 = 4.28571428578550184252e-01, PL3 = 3.33333329818377432918e-01,
      PL4 = 2.72728123808534006489e-01, PL5 = 2.30660745775561754067e-01, PL6 = 2.06975017800338417784e-01;
    const PLN2 = 6.93147180559945286227e-01, PLN2_H = 6.93147182464599609375e-01, PLN2_L = -1.90465429995776804525e-09;
    const CP = 9.61796693925975554329e-01, CP_H = 9.61796700954437255859e-01, CP_L = -7.02846165095275826516e-09;
    const IVLN2 = 1.44269504088896338700e+00, IVLN2_H = 1.44269502162933349609e+00, IVLN2_L = 1.92596299112661746887e-08;
    function pow(x, y) {
      if (y !== y) return NaN;
      if ((x === 1 || x === -1) && (y === Infinity || y === -Infinity)) return NaN;
      let z, ax, zH, zL, pH, pL, y1, t1, t2, r, s, t, u, v, w, i, j, k, yisint, n;
      const hx = HI(x), lx = LO(x), hy = HI(y), ly = LO(y);
      let ix = hx & 0x7fffffff;
      const iy = hy & 0x7fffffff;
      if ((iy | ly) === 0) return 1;
      if (hx === 0x3ff00000 && lx === 0) return 1;
      if (ix > 0x7ff00000 || (ix === 0x7ff00000 && lx !== 0) || iy > 0x7ff00000 || (iy === 0x7ff00000 && ly !== 0)) return x + y;
      yisint = 0;
      if (hx < 0) {
        if (iy >= 0x43400000) yisint = 2;
        else if (iy >= 0x3ff00000) {
          k = (iy >> 20) - 0x3ff;
          if (k > 20) { j = ly >>> (52 - k); if (((j << (52 - k)) >>> 0) === ly) yisint = 2 - (j & 1); }
          else if (ly === 0) { j = iy >> (20 - k); if ((j << (20 - k)) === iy) yisint = 2 - (j & 1); }
        }
      }
      if (ly === 0) {
        if (iy === 0x7ff00000) {
          if (((ix - 0x3ff00000) | lx) === 0) return 1;
          if (ix >= 0x3ff00000) return hy >= 0 ? y : 0.0;
          return hy < 0 ? -y : 0.0;
        }
        if (iy === 0x3ff00000) return hy < 0 ? 1 / x : x;
        if (hy === 0x40000000) return x * x;
        if (hy === 0x3fe00000 && hx >= 0) return Math.sqrt(x);
      }
      ax = Math.abs(x);
      if (lx === 0 && (ix === 0x7ff00000 || ix === 0 || ix === 0x3ff00000)) {
        z = ax;
        if (hy < 0) z = 1 / z;
        if (hx < 0) { if (((ix - 0x3ff00000) | yisint) === 0) z = (z - z) / (z - z); else if (yisint === 1) z = -z; }
        return z;
      }
      n = (hx >>> 31) - 1;
      if ((n | yisint) === 0) return (x - x) / (x - x);
      s = 1;
      if ((n | (yisint - 1)) === 0) s = -1;
      if (iy > 0x41e00000) {
        if (iy > 0x43f00000) {
          if (ix <= 0x3fefffff) return hy < 0 ? HUGE * HUGE : TINY * TINY;
          if (ix >= 0x3ff00000) return hy > 0 ? HUGE * HUGE : TINY * TINY;
        }
        if (ix < 0x3fefffff) return hy < 0 ? s * HUGE * HUGE : s * TINY * TINY;
        if (ix > 0x3ff00000) return hy > 0 ? s * HUGE * HUGE : s * TINY * TINY;
        t = ax - 1;
        w = (t * t) * (0.5 - t * (3.3333333333333331e-01 - t * 0.25));
        u = IVLN2_H * t;
        v = t * IVLN2_L - w * IVLN2;
        t1 = setLo(u + v, 0);
        t2 = v - (t1 - u);
      } else {
        let ss, s2, sH, sL, tH, tL;
        n = 0;
        if (ix < 0x00100000) { ax *= 9007199254740992.0; n -= 53; ix = HI(ax); }
        n += (ix >> 20) - 0x3ff;
        j = ix & 0x000fffff;
        ix = j | 0x3ff00000;
        if (j <= 0x3988E) k = 0; else if (j < 0xBB67A) k = 1; else { k = 0; n += 1; ix -= 0x00100000; }
        ax = setHi(ax, ix);
        u = ax - BP[k]; v = 1 / (ax + BP[k]); ss = u * v; sH = setLo(ss, 0);
        tH = words(((ix >> 1) | 0x20000000) + 0x00080000 + (k << 18), 0);
        tL = ax - (tH - BP[k]);
        sL = v * ((u - sH * tH) - sH * tL);
        s2 = ss * ss;
        r = s2 * s2 * (PL1 + s2 * (PL2 + s2 * (PL3 + s2 * (PL4 + s2 * (PL5 + s2 * PL6)))));
        r += sL * (sH + ss);
        s2 = sH * sH;
        tH = setLo(3.0 + s2 + r, 0);
        tL = r - ((tH - 3.0) - s2);
        u = sH * tH; v = sL * tH + tL * ss;
        pH = setLo(u + v, 0); pL = v - (pH - u);
        zH = CP_H * pH; zL = CP_L * pH + pL * CP + DP_L[k];
        t = n;
        t1 = setLo(((zH + zL) + DP_H[k]) + t, 0);
        t2 = zL - (((t1 - t) - DP_H[k]) - zH);
      }
      y1 = setLo(y, 0);
      pL = (y - y1) * t1 + y * t2; pH = y1 * t1; z = pL + pH;
      j = HI(z); i = LO(z);
      if (j >= 0x40900000) { if (((j - 0x40900000) | i) !== 0) return s * HUGE * HUGE; if (pL + 8.0085662595372944372e-17 > z - pH) return s * HUGE * HUGE; }
      else if ((j & 0x7fffffff) >= 0x4090cc00) { if (((j - 0xc090cc00) | i) !== 0) return s * TINY * TINY; if (pL <= z - pH) return s * TINY * TINY; }
      i = j & 0x7fffffff; k = (i >> 20) - 0x3ff; n = 0;
      if (i > 0x3fe00000) {
        n = j + (0x00100000 >> (k + 1)); k = ((n & 0x7fffffff) >> 20) - 0x3ff;
        t = words(n & ~(0x000fffff >> k), 0);
        n = ((n & 0x000fffff) | 0x00100000) >> (20 - k);
        if (j < 0) n = -n;
        pH -= t;
      }
      t = setLo(pL + pH, 0);
      u = t * PLN2_H; v = (pL - (t - pH)) * PLN2 + t * PLN2_L; z = u + v; w = v - (z - u);
      t = z * z;
      t1 = z - t * (EP1 + t * (EP2 + t * (EP3 + t * (EP4 + t * EP5))));
      r = (z * t1) / (t1 - 2.0) - (w + z * w);
      z = 1 - (r - z);
      j = HI(z) + (n << 20);
      z = (j >> 20) <= 0 ? scalbn(z, n) : setHi(z, j);
      return s * z;
    }
    return { sin, cos, exp, log, log10, tan, atan2, hypot, pow, tanh, asin, acos, cbrt };
  })();
  const fsin = FM.sin, fcos = FM.cos, fpow = FM.pow;   // fpow: every power of this file since the epoch's B1 (G17)

  // ---------------------------------------------------------------- constants
  const FT = 0.3048;
  const RHO = 1025;          // sea water kg/m3
  const GRAV = 9.81;
  const LT = 1016.05;        // long ton in kg

  // Principal particulars (Harland & Wolff / British Wreck Commission)
  const G = {
    LBP: 850 * FT,
    xFP: 425 * FT,
    xAP: -425 * FT,
    B: 92.5 * FT,
    tankTop: 5.25 * FT,                 // inner bottom height
    // deck heights above keel, amidships (derived from deck spacings; F deck = 36'9")
    deck: {
      orlop: 20.75 * FT, G: 28.75 * FT, F: 36.75 * FT, E: 45.25 * FT,
      D: 54.25 * FT, C: 64.75 * FT, B: 73.75 * FT, A: 82.75 * FT, Boat: 92.25 * FT,
    },
    sheerF: 3.9,                        // E deck meets the stem ~58 ft above keel
    sheerA: 1.9,
    stemRefZ: 58 * FT,                  // FP crosses the stem at E deck (H&W plans)
    stemRake: 1 / 12,
    forefootR: 6.0,
    sternOverhang: 9.4,                 // LOA 882'9" vs LBP 850'
    counterZ0: 11.0,
    counterZ1: 15.0,
    thZ: 17.0,                          // tumblehome starts
    thAmount: 0.30,
    // open well decks (C deck level) between forecastle / superstructure / poop
    wellFwd: [76.9, 92.0],
    wellAft: [-106.0, -90.8],
  };

  // Fitted hull-form parameters (tools/fit_hull.js). Targets: displacement,
  // waterplane, LCF, KB, BM at 32'3" and 34'7" from H&W records.
  const HULL = {
    xPF0: 4.899, xPF1: 29.937, xPA0: -22.105, xPA1: -46.482,
    nF0: 1.354, nF1: 2.097, nF2: 2.6,
    nA0: 0.947, nA1: 2.156, nA2: 3.0,
    rb: 4.244, T0: 10.0,
  };

  function sheer(x) {
    if (x >= 0) { const s = x / G.xFP; return G.sheerF * s * s; }
    const s = x / G.xAP; return G.sheerA * s * s;
  }
  function deckZ(name, x) { return G.deck[name] + sheer(x); }
  function inWell(x) {
    return (x > G.wellFwd[0] && x < G.wellFwd[1]) || (x > G.wellAft[0] && x < G.wellAft[1]);
  }
  function zTopAt(x) { return (inWell(x) ? G.deck.C : G.deck.B) + sheer(x); }

  // S1: the tiers above B deck (docs/DESIGN_grand_staircases_dome_flooding_v1_2026-11-19.md, section 4). The hull's top
  // is B deck (zTopAt); over it stand the bridge deck's house from well to well (B to A deck, the ship's full breadth),
  // the promenade deck's (A deck to the Boat deck: the house, and forward of `screen` the promenade as well, shut in by
  // its glazed screen) and the houses on the Boat deck. A ship built with them (buildShip's `tiers`, the default)
  // carries her columns up through them, so that they are buoyant while they are dry and hold water as the decks under
  // them do; without them the sea passes through them as it did before S1.
  // The numbers are those of docs/research/RESEARCH_topsides_dimensions_v1_2026-11-19.md (its sections 0 and 1.2),
  // most of them scaled off the Boat-deck plan and the profile, within about half a metre.
  const TIER = {
    B: [-90.8, 76.9],                    // the bridge deck's house: from well to well, as this hull has the wells
    A: [-77.8, 72.6],                    // the promenade deck and the Boat deck over it [scaled; 190 ft from the bow: read]
    screen: 14.1,                        // the after end of the promenade's steel screen, 192 ft from its forward end [read]
    houseA: 9.6,                         // the half breadth of the house on A deck abaft the screen [the lounge and the smoke room are 63 ft wide: read]
    // on the Boat deck: x0 to x1, half breadth, height over the deck. The houses and the raised roofs of the rooms under
    // them; the boiler casings are left out (they are open to the boiler rooms), and the second funnel's house, which
    // has the gymnasium to starboard only, is given the same plan area on the centreline [bet].
    houses: [
      { x0: 64.8, x1: 67.8, hw: 2.95, h: 2.4 },     // the wheelhouse
      { x0: 36.0, x1: 64.8, hw: 6.9, h: 2.4 },      // the officers' house
      { x0: 26.3, x1: 36.0, hw: 8.6, h: 3.9 },      // the forward first-class entrance
      { x0: 11.9, x1: 26.3, hw: 5.8, h: 2.8 },      // the second funnel's house and the gymnasium
      { x0: -14.1, x1: 5.1, hw: 8.9, h: 1.0 },      // the lounge's raised roof
      { x0: -35.0, x1: -26.6, hw: 6.9, h: 2.7 },    // the engine casing's house and the tank room
      { x0: -64.3, x1: -43.9, hw: 8.6, h: 1.0 },    // the smoke room's raised roof
      { x0: -72.2, x1: -65.3, hw: 2.8, h: 2.3 },    // the second-class entrance
    ],
  };
  // the top of what is shut in over the point (x, y) of a ship with her tiers (y from the centreline, either side)
  function tierTop(x, y) {
    if (!(x > TIER.B[0] && x < TIER.B[1])) return zTopAt(x);
    if (!(x > TIER.A[0] && x < TIER.A[1]) || (x <= TIER.screen && y > TIER.houseA)) return deckZ('A', x);
    for (const h of TIER.houses) if (x > h.x0 && x <= h.x1 && y <= h.hw) return deckZ('Boat', x) + h.h;
    return deckZ('Boat', x);
  }
  // the weather deck on the centreline there: where the sea first stands on her top
  function deckTopAt(x) {
    if (!(x > TIER.B[0] && x < TIER.B[1])) return zTopAt(x);
    return deckZ(x > TIER.A[0] && x < TIER.A[1] ? 'Boat' : 'A', x);
  }

  function xFwd(z) {
    const R = G.forefootR;
    const zs = z < 0 ? 0 : z;
    if (zs >= R) return G.xFP + (zs - G.stemRefZ) * G.stemRake;
    const xsR = G.xFP + (R - G.stemRefZ) * G.stemRake;
    const d = R - zs;
    return xsR - R + Math.sqrt(R * R - d * d);
  }
  function xAft(z) {
    if (z <= G.counterZ0) return G.xAP;
    if (z >= G.counterZ1) return G.xAP - G.sternOverhang;
    const s = (G.counterZ1 - z) / (G.counterZ1 - G.counterZ0);
    return G.xAP - G.sternOverhang * Math.sqrt(Math.max(0, 1 - s * s));
  }
  function nBlend(z, n0, n1, n2, T0, zD) {
    if (z <= T0) { const s = z / T0; const ss = s * s * (3 - 2 * s); return n0 + (n1 - n0) * ss; }
    const s = Math.min(1, (z - T0) / (zD - T0)); return n1 + (n2 - n1) * s;
  }

  // Moulded half-breadth at (x, z). Zero outside the profile. A hull with her ends restored (C3: P.ends, from
  // buildShip's `hullEnds`) is wider above P.ends.z0 where the deck plans are; every other hull is halfBreadth0, to
  // the bit.
  function halfBreadth(x, z, P) {
    const hb = halfBreadth0(x, z, P);
    return P && P.ends && hb > 0 && z > P.ends.z0 ? endsSide(x, z, hb, P) : hb;
  }
  function halfBreadth0(x, z, P) {
    P = P || HULL;
    if (z < 0) return 0;
    let W;
    const sb = z >= P.T0 ? 1 : (z / P.T0) * (z / P.T0) * (3 - 2 * z / P.T0);
    const xPF = P.xPF0 + (P.xPF1 - P.xPF0) * sb;
    const xPA = P.xPA0 + (P.xPA1 - P.xPA0) * sb;
    if (x > xPF) {
      const xe = xFwd(z); if (x >= xe) return 0;
      const u = (x - xPF) / (xe - xPF);
      W = 1 - fpow(u, nBlend(z, P.nF0, P.nF1, P.nF2, P.T0, 26));
    } else if (x < xPA) {
      const xe = xAft(z); if (x <= xe) return 0;
      const u = (xPA - x) / (xPA - xe);
      W = 1 - fpow(u, nBlend(z, P.nA0, P.nA1, P.nA2, P.T0, 24));
    } else W = 1;
    const Bh = G.B / 2;
    let S = 1;
    if (z < P.rb) { const d = P.rb - z; S = (Bh - P.rb + Math.sqrt(P.rb * P.rb - d * d)) / Bh; }
    let TH = 1;
    if (z > G.thZ) { const s = (z - G.thZ) / (G.deck.Boat - G.thZ); TH = 1 - (G.thAmount / Bh) * s * s; }
    return Bh * W * S * TH;
  }

  // C3 (the calibration epoch; D80): her hull's ends above the waterline as the deck plans draw them. The fitted form
  // (HULL) is held to her hydrostatics at the load waterline and carries its lines up from there, so that above it her
  // ends are too fine: at E deck 1.15 m inside the plan at 80 frames forward, 0.25 m at 80 aft, more beyond
  // (docs/research/RESEARCH_rooms_hull_ends_v1_1_2026-11-21.md and v1). buildShip({ hullEnds: 1 }) gives a ship whose
  // hull (ship.hull) carries the plans' side; it reaches halfBreadth only through its third argument. The profile
  // (xFwd, xAft), zoneBounds, deckZ and inWell are as they are.
  // The readings: her outer line on Encyclopedia Titanica's plans of E, D, C and B deck (R3 and the B1+B2 lane;
  // data/rooms/<deck>_deck.json's side.at, numbers only), here as [feet forward of amidships, feet from the centreline],
  // the mean of port and starboard (the model's hull is symmetric; they agree within the plans' scatter, about 0.1 m),
  // from the stern to 40 frames aft and from 40 frames forward to the stem; `stern` and `stem`, where the plan ends
  // the deck. tools/hull_ends_tests.js holds the table equal to the data. The outer line lies about 0.1 ft outside the
  // moulded line (the shell and the line's own width): it is not taken off.
  const ENDS_READ = {
    E: { aft: [[-417.259, 11.18], [-406.04, 20.06], [-394.571, 24.82], [-383.11, 29.135], [-370.285, 31.83], [-357.22, 34.43], [-343.47, 37.28], [-329.55, 39.04], [-299.41, 41.64], [-269.222, 43.36], [-239.305, 44.83], [-224.364, 45.225], [-209.305, 45.62], [-194.166, 45.91], [-179.093, 46.16], [-164.019, 46.3], [-149.02, 46.35], [-134.048, 46.35], [-118.989, 46.35]],
      fwd: [[119.012, 46.35], [133.842, 46.25], [148.77, 46.11], [163.845, 45.96], [178.924, 45.715], [194.01, 45.27], [209.096, 44.68], [224.13, 43.9], [239.13, 43.065], [268.691, 40.22], [297.96, 36.1], [311.375, 33.16], [324.79, 30.9], [336.986, 27.96], [349.182, 24.87], [360.866, 21.68], [372.21, 18.44], [382.745, 15.205], [393.28, 12.07], [403.348, 8.73], [413.416, 5.25], [421.47, 2.16]], stern: -424.96, stem: 425.33 },
    D: { aft: [[-428.477, 27.265], [-423.99, 29.03], [-417.259, 30.79], [-406.04, 34.12], [-394.571, 36.175], [-383.11, 37.84], [-370.285, 39.11], [-357.22, 40.285], [-343.47, 41.36], [-329.55, 42.295], [-299.41, 43.615], [-269.222, 44.595], [-239.305, 45.475], [-224.364, 45.82], [-209.305, 46.11], [-194.166, 46.21], [-179.093, 46.26], [-164.019, 46.31], [-149.02, 46.31], [-134.048, 46.355], [-118.989, 46.405]],
      fwd: [[119.012, 46.01], [133.842, 45.965], [148.77, 45.915], [163.845, 45.82], [178.924, 45.72], [194.01, 45.57], [209.096, 45.33], [224.13, 44.84], [239.13, 43.91], [268.691, 41.41], [297.96, 38.035], [311.375, 36.075], [324.79, 33.63], [336.986, 30.985], [349.182, 27.755], [360.866, 25.21], [372.21, 21.54], [382.745, 18.21], [393.28, 14.44], [403.348, 10.575], [413.416, 6.215], [421.47, 2.595]], stern: -433.3, stem: 425.33 },
    C: { aft: [[-428.477, 31.12], [-423.99, 32.34], [-417.259, 33.76], [-406.04, 35.72], [-394.571, 37.235], [-383.11, 38.46], [-370.285, 39.49], [-357.22, 40.32], [-343.47, 41.1], [-329.55, 42.08], [-299.41, 43.65], [-269.222, 44.82], [-239.305, 45.55], [-224.364, 45.85], [-209.305, 46.04], [-194.166, 46.19], [-179.093, 46.19], [-164.019, 46.29], [-149.02, 46.29], [-134.048, 46.34], [-118.989, 46.39]],
      fwd: [[119.012, 45.99], [133.842, 45.9], [148.77, 45.9], [163.845, 45.8], [178.924, 45.7], [194.01, 45.5], [209.096, 45.31], [224.13, 44.92], [239.13, 44.48], [268.691, 42.86], [297.96, 40.07], [311.375, 38.56], [324.79, 36.31], [336.986, 33.91], [349.182, 31.07], [360.866, 28.085], [372.21, 24.27], [382.745, 20.625], [393.28, 16.24], [403.348, 11.55], [413.416, 7.24], [421.47, 3.33]], stern: -455.5, stem: 429.2 },
    // B deck is read from 80 frames aft to 80 forward only (its ends, the poop and the forecastle, are not)
    B: { aft: [[-239.305, 45.41], [-224.364, 45.65], [-209.305, 45.945], [-194.166, 46.14], [-179.093, 46.14], [-164.019, 46.09], [-149.02, 46.09], [-134.048, 46.09], [-118.989, 46.09]],
      fwd: [[119.012, 45.85], [133.842, 45.7], [148.77, 45.55], [163.845, 45.36], [178.924, 45.11], [194.01, 44.87], [209.096, 44.575], [224.13, 44.18], [239.13, 43.84]] },
  };
  // What the plans do not give, each a bet:
  //   z0: where the restored side begins, m above the keel. Nothing at or below any first waterline may change (her
  //     mass, her hydrostatics, the calibration's first state); the highest is the 1912 preset's, 10.29 m at the stern
  //     post on the centreline and, with her coal's list of 2 degrees, 10.6 m at her side abreast the after well; every
  //     other preset's is 10.32 m or less [bet: 11.0, a round figure over them; tools/hull_ends_tests.js holds it over
  //     every preset's sea].
  //   from z0 up to E deck: today's side and, added to it, a share of what the plan has over it at E deck, rising in a
  //     straight line from nothing at z0 to all of it at E deck [bet: no plan read below E deck; the model is 1.0 to
  //     1.9 m inside the plan at E deck's ends, and this takes that out over 3 to 7 m of height].
  //   above B deck (the tiers): today's side and what the plan has over it at B deck [bet: A deck's side is not read].
  //   fade: the plans are read from 40 frames out. Inside 40 the model is within the plans' scatter of them, and is
  //     left as it is; what the plan has over it at 40 comes in over the 5 frames inside (15 ft) [bet], so that her
  //     side has no step there.
  //   B deck beyond 80 frames: C deck's side [R3's bet], less what B deck read under it at 80, that difference going
  //     in a straight line to nothing by 90 [bet], so that her side has no step at 80.
  //   beyond a deck's last reading: forward, a straight line to nothing where the plan ends the deck (her sides run
  //     nearly straight to the stem); aft, a quarter ellipse to where the plan ends it (her round stern) [bets]. Past
  //     that the plan has no deck (E deck ends at the stern post, D deck 2.5 m abaft it): the model's own counter stays.
  const ENDS_BET = { z0: 11.0, fade: 15, bFade: 30 };
  // a monotone cubic through the readings (Fritsch and Carlson 1980): it makes no hollow or bulge the readings do not
  const DECKS_READ = ['E', 'D', 'C', 'B'];
  function endsCurve(pts) {
    const n = pts.length, x = pts.map(p => p[0] * FT), y = pts.map(p => p[1] * FT), d = [], m = new Array(n);
    for (let i = 0; i < n - 1; i++) d.push((y[i + 1] - y[i]) / (x[i + 1] - x[i]));
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] > 0 ? 0.5 * (d[i - 1] + d[i]) : 0;
    for (let i = 0; i < n - 1; i++) {
      if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
      const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
      if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
    }
    return { x, y, m };
  }
  function curveAt(c, x) {
    let lo = 0, hi = c.x.length - 1;
    while (hi - lo > 1) { const k = (lo + hi) >> 1; if (c.x[k] <= x) lo = k; else hi = k; }
    const h = c.x[hi] - c.x[lo], t = (x - c.x[lo]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * c.y[lo] + (t3 - 2 * t2 + t) * h * c.m[lo] + (-2 * t3 + 3 * t2) * c.y[hi] + (t3 - t2) * h * c.m[hi];
  }
  let ENDS = null, HULL_ENDS = null;       // HULL_ENDS: the fitted form with her ends restored, one object for every such ship
  function hullEnds() {
    if (ENDS) return ENDS;
    const E = { z0: ENDS_BET.z0, fade: ENDS_BET.fade * FT, bFade: ENDS_BET.bFade * FT, deck: {} };
    for (const d of DECKS_READ) {
      const R = ENDS_READ[d];
      E.deck[d] = { aft: endsCurve(R.aft), fwd: endsCurve(R.fwd), stern: R.stern !== undefined ? R.stern * FT : null, stem: R.stem !== undefined ? R.stem * FT : null };
    }
    // the innermost reading, the same frame on every deck (40 aft, 40 forward)
    E.xa = E.deck.E.aft.x[E.deck.E.aft.x.length - 1]; E.xf = E.deck.E.fwd.x[0];
    return (ENDS = E);
  }
  // the plan's side on one deck at x, m; 0 where the plan has no deck. x is at or outside the innermost reading.
  function endsDeck(E, d, x) {
    const D = E.deck[d];
    if (x > 0) {
      const c = D.fwd, n = c.x.length - 1;
      if (x <= c.x[n]) return curveAt(c, x);
      if (D.stem === null) { const o = c.y[n] - endsDeck(E, 'C', c.x[n]), t = (x - c.x[n]) / E.bFade; return Math.max(0, endsDeck(E, 'C', x) + (t < 1 ? o * (1 - t) : 0)); }
      return x < D.stem ? c.y[n] * (D.stem - x) / (D.stem - c.x[n]) : 0;
    }
    const c = D.aft;
    if (x >= c.x[0]) return curveAt(c, x);
    if (D.stern === null) { const o = c.y[0] - endsDeck(E, 'C', c.x[0]), t = (c.x[0] - x) / E.bFade; return Math.max(0, endsDeck(E, 'C', x) + (t < 1 ? o * (1 - t) : 0)); }
    if (x <= D.stern) return 0;
    const u = (c.x[0] - x) / (c.x[0] - D.stern);
    return c.y[0] * Math.sqrt(1 - u * u);
  }
  // her side at (x, z) with her ends restored: hb is the fitted form's there (more than 0), z is over P.ends.z0. Never
  // inside the fitted form.
  function endsSide(x, z, hb, P) {
    const E = P.ends, xi = x > 0 ? E.xf : E.xa, ax = x > 0 ? x : -x, ai = x > 0 ? xi : -xi;
    if (ax < ai) {                                                         // inside 40 frames: the fade
      if (ax <= ai - E.fade) return hb;
      const hi = halfBreadth0(xi, z, P), over = endsSide(xi, z, hi, P) - hi;
      return hb + over * (ax - (ai - E.fade)) / E.fade;
    }
    const zE = deckZ('E', x);
    let v;
    if (z <= zE) {
      const mE = halfBreadth0(x, zE, P), over = endsDeck(E, 'E', x) - mE;
      v = mE > 0 && over > 0 ? hb + over * (z - E.z0) / (zE - E.z0) : hb;
    } else {
      let k = 0, za = zE, zb = deckZ('D', x);
      while (k < 2 && z > zb) { k++; za = zb; zb = deckZ(DECKS_READ[k + 1], x); }
      if (z <= zb) {
        const ra = endsDeck(E, DECKS_READ[k], x), rb = endsDeck(E, DECKS_READ[k + 1], x);
        v = ra + (rb - ra) * (z - za) / (zb - za);
      } else {
        const mB = halfBreadth0(x, zb, P), over = endsDeck(E, 'B', x) - mB;
        v = mB > 0 && over > 0 ? hb + over : hb;
      }
    }
    return v > hb ? v : hb;
  }

  // ------------------------------------------------------------ subdivision
  // Compartment lengths from the British Inquiry report (ft), bow to stern.
  const BULKHEADS = [
    { id: 'A', dFP: 46, top: 'D', doors: [] },
    { id: 'B', dFP: 91, top: 'D', doors: [] },
    { id: 'C', dFP: 142, top: 'E', doors: [['F', 1]] },
    { id: 'D', dFP: 193, top: 'E', doors: [['low', 1], ['F', 1]] },
    { id: 'E', dFP: 247, top: 'E', doors: [['low', 1], ['F', 1]] },
    { id: 'F', dFP: 304, top: 'E', doors: [['low', 1], ['F', 2]] },
    { id: 'G', dFP: 361, top: 'E', doors: [['low', 1], ['F', 1]] },
    { id: 'H', dFP: 418, top: 'E', doors: [['low', 1], ['F', 2]] },
    { id: 'J', dFP: 478, top: 'E', doors: [['low', 1], ['F', 2]] },
    { id: 'K', dFP: 514, top: 'D', doors: [['low', 1], ['E', 2]] },
    { id: 'L', dFP: 583, top: 'D', doors: [['low', 1], ['E', 2]] },
    { id: 'M', dFP: 640, top: 'D', doors: [['low', 1], ['F', 1], ['E', 2]] },
    { id: 'N', dFP: 703, top: 'D', doors: [['low', 1], ['G', 1], ['F', 1], ['E', 2]] },
    { id: 'O', dFP: 757, top: 'D', doors: [['low', 1], ['E', 1]] },
    { id: 'P', dFP: 814, top: 'D', doors: [] },
  ];
  for (const b of BULKHEADS) b.x = (425 - b.dFP) * FT;
  // C4 (G11's doors): the watertight doors of BULKHEADS that the deck plans do not show (R3: Encyclopedia Titanica's
  // plans of F and G deck, data/rooms/F_deck.json and G_deck.json): none on F deck in bulkhead E or G, none on G deck in
  // N. params.g11Doors 0 leaves these three out; 1 keeps them, as before. N's 'low' door stays either way: the plans
  // mark one watertight door in N on the orlop deck, 4.3 m over where the model's 'low' door stands (0.85 m over the
  // tank top), and the plans read (the orlop deck up) show nothing at the tank top, so nothing contradicts it.
  const G11_NO_DOOR = { E: 'F', G: 'F', N: 'G' };

  // muLow: permeability below E deck. kind drives colour in the viewer.
  const ZONES = [
    { name: 'Forepeak', short: 'FP', kind: 'peak', mu: 0.95, peak: true },
    { name: 'No. 1 hold', short: 'H1', kind: 'hold', mu: 0.95 },
    { name: 'No. 2 hold', short: 'H2', kind: 'hold', mu: 0.95 },
    { name: 'No. 3 hold', short: 'H3', kind: 'hold', mu: 0.90 },
    { name: 'Boiler room 6', short: 'BR6', kind: 'boiler', mu: 0.85 },
    { name: 'Boiler room 5', short: 'BR5', kind: 'boiler', mu: 0.85 },
    { name: 'Boiler room 4', short: 'BR4', kind: 'boiler', mu: 0.85 },
    { name: 'Boiler room 3', short: 'BR3', kind: 'boiler', mu: 0.85 },
    { name: 'Boiler room 2', short: 'BR2', kind: 'boiler', mu: 0.85 },
    { name: 'Boiler room 1', short: 'BR1', kind: 'boiler', mu: 0.85 },
    { name: 'Reciprocating engine room', short: 'RE', kind: 'engine', mu: 0.85 },
    { name: 'Turbine engine room', short: 'TE', kind: 'engine', mu: 0.85 },
    { name: 'Electric engine room', short: 'EL', kind: 'engine', mu: 0.85 },
    { name: 'Shaft tunnel / refrigerated cargo', short: 'T1', kind: 'tunnel', mu: 0.90 },
    { name: 'Shaft tunnel / cargo', short: 'T2', kind: 'tunnel', mu: 0.90 },
    { name: 'After peak', short: 'AP', kind: 'peak', mu: 0.95, peak: true },
  ];
  const MU_UP = 0.95; // accommodation above E deck

  // ------------------------------------------------------------ column proxies
  function columnInterval(xc, yc, zt, P) {
    const step = 0.2;
    const n = Math.max(2, Math.ceil(zt / step));
    let first = -1, last = -1;
    for (let i = 0; i <= n; i++) {
      const z = (zt * i) / n;
      if (halfBreadth(xc, z, P) >= yc) { if (first < 0) first = i; last = i; }
    }
    if (first < 0) return null;
    let zlo = (zt * first) / n, zhi = (zt * last) / n;
    if (first > 0) {
      let a = (zt * (first - 1)) / n, b = zlo;
      for (let k = 0; k < 14; k++) { const m = 0.5 * (a + b); if (halfBreadth(xc, m, P) >= yc) b = m; else a = m; }
      zlo = b;
    }
    if (last < n) {
      let a = zhi, b = (zt * (last + 1)) / n;
      for (let k = 0; k < 14; k++) { const m = 0.5 * (a + b); if (halfBreadth(xc, m, P) >= yc) a = m; else b = m; }
      zhi = a;
    }
    if (zhi - zlo < 1e-3) return null;
    return [zlo, zhi];
  }

  // S1: how far up from z0 the column at (xc, yc) stays inside the ship's side, no higher than z1
  function columnUp(xc, yc, z0, z1, P) {
    const n = Math.max(1, Math.ceil((z1 - z0) / 0.2));
    let last = 0;
    for (let i = 1; i <= n; i++) { if (halfBreadth(xc, z0 + (z1 - z0) * i / n, P) >= yc) last = i; else break; }
    if (last === n) return z1;
    let a = z0 + (z1 - z0) * last / n, b = z0 + (z1 - z0) * (last + 1) / n;
    for (let k = 0; k < 14; k++) { const m = 0.5 * (a + b); if (halfBreadth(xc, m, P) >= yc) a = m; else b = m; }
    return a;
  }

  // x boundaries: stem top, 15 bulkheads, stern tip (descending)
  function zoneBounds() {
    const xMax = xFwd(zTopAt(G.xFP)) + 0.05;
    const xMin = G.xAP - G.sternOverhang - 0.05;
    return [xMax].concat(BULKHEADS.map(b => b.x), [xMin]);
  }

  function buildColumns(P, opt) {
    P = P || HULL; opt = opt || {};
    const dxT = opt.dx || 3.0, dy = opt.dy || 0.5;
    const bx = zoneBounds();
    const out = { x: [], y: [], dxdy: [], zlo: [], zhi: [], zhiH: [], zone: [], side: [], dx: [], dy };
    const slices = [];
    for (let k = 0; k < 16; k++) {
      const xf = bx[k], xa = bx[k + 1];
      const n = Math.max(2, Math.ceil((xf - xa) / dxT));
      const dx = (xf - xa) / n;
      for (let i = n - 1; i >= 0; i--) {
        const xc = xa + (i + 0.5) * dx;
        const zt = zTopAt(xc);
        const s = { xc, dx, zone: k, first: out.x.length };
        for (let j = 0; ; j++) {
          const yc = (j + 0.5) * dy;
          if (yc > G.B / 2 + 0.05) break;
          const iv = columnInterval(xc, yc, zt, P);
          if (!iv) continue;
          // S1: a column that reaches the hull's top goes on up through the tiers that stand over it (zhiH: the hull's own top)
          const hullTop = iv[1];
          if (opt.tiers && iv[1] >= zt - 1e-3) { const top = tierTop(xc, yc); if (top > zt + 1e-6) iv[1] = columnUp(xc, yc, zt, top, P); }
          for (let sd = 0; sd < 2; sd++) {     // 0 = port (+y), 1 = starboard (-y)
            out.x.push(xc); out.y.push(sd === 0 ? yc : -yc);
            out.dxdy.push(dx * dy); out.dx.push(dx);
            out.zlo.push(iv[0]); out.zhi.push(iv[1]); out.zhiH.push(hullTop);
            out.zone.push(k); out.side.push(sd);
          }
        }
        s.count = out.x.length - s.first;
        slices.push(s);
      }
    }
    const N = out.x.length;
    const cols = {
      N, dy,
      x: Float64Array.from(out.x), y: Float64Array.from(out.y),
      dxdy: Float64Array.from(out.dxdy), dx: Float64Array.from(out.dx),
      zlo: Float64Array.from(out.zlo), zhi: Float64Array.from(out.zhi), zhiH: Float64Array.from(out.zhiH),
      zone: Int32Array.from(out.zone), side: Int32Array.from(out.side),
      slices,
    };
    return cols;
  }

  // Even-keel hydrostatics (used by the hull fit and for reporting).
  function evenKeel(cols, T) {
    let V = 0, Mx = 0, Mz = 0, Awp = 0, Mwx = 0, It = 0, Il = 0;
    const dy = cols.dy;
    for (let i = 0; i < cols.N; i++) {
      const lo = cols.zlo[i], hi = cols.zhi[i];
      const s = T <= lo ? 0 : (T >= hi ? hi - lo : T - lo);
      if (s <= 0) continue;
      const a = cols.dxdy[i];
      V += a * s; Mx += a * s * cols.x[i]; Mz += a * s * (lo + 0.5 * s);
      if (T > lo && T < hi) {
        const y = cols.y[i];
        Awp += a; Mwx += a * cols.x[i]; It += a * (y * y + dy * dy / 12);
      }
    }
    const LCF = Mwx / Awp;
    for (let i = 0; i < cols.N; i++) {
      const lo = cols.zlo[i], hi = cols.zhi[i];
      if (T > lo && T < hi) { const d = cols.x[i] - LCF; Il += cols.dxdy[i] * d * d; }
    }
    return { V, LCB: Mx / V, KB: Mz / V, Awp, LCF, BM: It / V, BML: Il / V, It };
  }

  // ============================================================ simulation
  const SQ2G = Math.sqrt(2 * GRAV);
  const NN = 64;                       // 16 zones x {port, starboard} x {below, above E deck}
  const nodeIndex = (k, side, layer) => ((k * 2 + side) * 2 + layer);

  const DEFAULT_PARAMS = {
    dt: 0.25,
    // A-1 (the calibration epoch, stage A; QC_A): the stability limit's share of what would level two sides, per
    // second. A connection moves at most min(0.5, levelRate * dt) / deg of it in a step, where it moved 0.5 / deg, so
    // the share is held per second and not per step. At dt 0.25 and 2 a second it is 0.5 exactly: no bit moves. It is
    // a bet of the right order (two spaces cannot level faster than a gravity wave crosses one, sqrt(g h) / L, about
    // 0.3 to 0.5 a second; with 3 to 6 connections, 0.3 to 0.7). tools/stairs_tests.js holds the half step.
    levelRate: 2,
    CdBreach: 0.60,       // discharge coefficient of hull openings
    CdDoor: 0.60,
    Cweir: 0.60,
    wPort: 3.0,           // E-deck overflow path widths, m (Scotland Road / 1st-class alleyway)
    wStbd: 2.0,
    // wMul, aDown, fOpen: calibrated (tools/calibrate.js 45 --fix-area). Y3 (2026-11-17) refitted them with the 1912
    // damage's pumps as worked, the opening held at 0.7506 m2: J 9.49 (10.41 before, without the pumps; 12.80 with them
    // on the old values). They were 1.182, 0.277, 0.0101. wMul is weakly held by the record: the score is nearly flat
    // in it, and without the pumps the same refit puts it at 1.377 (docs/research/experiments/e23).
    // S1 (2026-11-19) refitted them again, with the tiers above B deck, their windows and the grand staircases, the
    // opening still held: J 9.39 with the values below as rounded (9.56 before S1, scored the same way; 12.5 with S1
    // on the old values, 2.735, 0.280, 0.01411). wMul came back to about 1, which puts the port path at 3.1 m, near
    // Scotland Road's own 2.6 to 2.7 m; the score is still nearly flat in it (a second refit from these values ended
    // at 0.726, 0.2745, 0.02177 with J 9.40 as rounded; one with other staircase sizes at 3.0).
    // G6, G6b and W6 (2026-11-20, join 6; docs/DESIGN_W6_the_lists_v1_3_2026-11-20.md, D69 to D73) refitted them with the
    // area, the preset and the 1912 watch on one damage split (Hackett and Bedford's), boiler room 5 holed only inside
    // its bunker and the bunker holding: `node tools/calibrate.js 45` (D73: the watch's founder in the score, both
    // founders held to 157 to 160 min, wMul at most 1.1 and aDown at least 0.24 to keep validate.js's knife-edge
    // bulkheads-to-B-deck what-if afloat). The preset's J 7.83 (9.39 before, scored the same way); the preset founders at
    // T 157.33, the watch at T 157.02. They were 1.036, 0.2815, 0.02068, and wMul sits on its bound.
    // G7 and G11 (2026-11-21, join 7; docs/research/RESULT_G7_ladder_v1_1_2026-11-21.md, rung 2b) refitted them with
    // the forepeak's tank and the E-deck widths at bulkheads D to J, D73's bounds kept (`node tools/calibrate.js 45`),
    // the watch's term taken where no pumps are led through the main (BACKLOG G18: the 1912 watch is bimodal at the bit
    // level, by the engineers' one-shot lead of pumps to boiler room 4 at about T 105), with the opening taken at 0.8196
    // m2 (core/scenarios.js): J 8.23; the preset founders at T 158.28, the watch at T 158.95 as it is and T 157.16 with
    // no pumps led. They were 1.1, 0.2647, 0.02189 (rung 2's
    // 0.256 and 0.0214 put the watch at T 156.60 on the branch the landed bits took); wMul still sits on its bound,
    // whose reason (the B-deck what-if) no longer binds under D75: the calibration epoch frees it (QC E-2).
    wMul: 1.1,
    // The calibration epoch's landing (D4; D90, 2026-11-23): aDown, zMergeHold, fOpen, bunkerBurst, peakVent, sideStrength,
    // coalListDeg and GM0 are the history match's candidate C (docs/DESIGN_calibration_epoch_v1_2_2026-11-21.md, out/
    // kept_1912.json), each inside its sourced range, with every stage C switch on. Before: aDown 0.2786, zMergeHold 4.6,
    // fOpen 0.02087, bunkerBurst 13.0, peakVent 0.008, sideStrength 1, coalListDeg 2.0, GM0 0.8001.
    aDown: 0.2093,        // m2 per side: stairways and hatches through E deck (the history match; D69's base 0.28)
    axHold: 0.05,         // m2: cross-flow beneath the firemen's tunnel (holds 2-3)
    axOpen: 6.0,          // m2: cross-flow in open compartments
    zMergeHold: 5.538,    // m: top of the firemen's tunnel (D64's 3.4 to 6; the history match)
    upperSplit: 0,        // 1: above E deck, port and starboard exchange water through cross passages only
    axUp: 1.0,            // m2 per compartment: cross passages above E deck
    fOpen: 0.02522,       // share of the top deck open to the sea once submerged (the history match)
    doorLowA: 1.5, doorA: 1.67,
    // Y2: a released watertight door falls shut by gravity through its oil cataract in 25-30 s; it counts as open until
    // it lands [bet: the time is unsourced; docs/research/RESEARCH_ship_systems_plant_v1_2026-11-16.md, section 7]. A
    // float under the floor of each compartment releases the doors into it when water enters: here when water stands
    // floatDepth over the lowest point of the space on either side [bet]. Floats act only where sim.doorFloat is set (the
    // ship's plant, core/systems.js, arms them); with every door shut nothing here runs, so the bits are as before.
    doorFall: 25, floatDepth: 0.5,
    // Y3: the steam bilge pumps (docs/research/RESEARCH_pumps_bilge_ballast_v1_2026-11-17.md). A scheduled pump draws
    // from the bottom of its zone, both sides in proportion, down to its strum, pumpStrum m over the space's lowest point
    // [bet: about 0.1 m over the tank top]; it stops for good when the water in the room it stands in is pumpAbandon m
    // over that room's lowest point (about 1.5 m over the stokehold plates: its crew has left [bet]). With nothing
    // scheduled nothing here runs, so the bits are as before.
    pumpStrum: 0.1, pumpAbandon: 2.3,
    // S1: the two grand staircases and the windows of the tiers above B deck (STAIRS, WINDOWS, weatherOpenings below;
    // docs/DESIGN_grand_staircases_dome_flooding_v1_2026-11-19.md). Every strength is a head of sea water, m, less any
    // water behind the opening: at a door's sill, at the middle of a window's pane, on a dome's cover. Each is from
    // docs/research/RESEARCH_downflooding_stairwells_glazing_v1_2026-11-19.md, section 10.2, with its range there.
    // stairs: 0 leaves the staircases out, and on a ship without her tiers the step is then what it was before S1, to
    // the bit (the seams gate runs so). CdStair: the discharge coefficient of every such opening [0.50 to 0.70].
    // hDoor, leakDoor: a wooden entrance door gives way with 1.0 m at its sill [0.7 to 1.5: tests of wooden doors], and
    // leaks 0.03 of its area until then [0.02 to 0.05]. leakShell: a steel gangway door in the ship's side never gives
    // way; the share of its area that leaks is 0 here [bet: tight, as the conservators of the door raised from the wreck
    // describe its gasket]. The British Report says the D-deck doors "had no rubber": a gap of a millimetre round them
    // is 0.002, and with that the two what-ifs that float deep by the head for hours (her bulkheads carried to B deck;
    // Britannic with her ports shut) founder instead, after 7 h 40 min and 2 h 03 min, the doors lying 5 m under the
    // sea (docs/research/experiments/e25; backlog S1d). The 1912 night does not feel it.
    // hDome: a dome's weather cover gives way with 0.5 m of sea on it [0.2 to 1.2: its iron bars before its glass].
    // hAir: or sooner, from below: once the sea stands this far over the lintel of every door of its staircase that has
    // given way, the air shut in under the dome lifts the cover's panes off their beds [0.05; 0.02 to 0.2]; a negative
    // hAir leaves that out, and the dome then goes by the sea on it alone.
    stairs: 1, CdStair: 0.60, hDoor: 1.0, leakDoor: 0.03, leakShell: 0, hDome: 0.5, leakDome: 0, hAir: 0.05,
    // conserve (C3): a space never gives more in a step than it holds. Where its outflows would take more, every one of
    // them is cut in the same proportion, so the water that leaves it is the water that arrives (0 leaves the step as it
    // was before C3: the space was set to nothing and the rest counted as arrived, water made from nothing).
    conserve: 1,
    // keepTrace (D89, e114): a pair of spaces holding a trace of water (1e-6 m3 or less) keeps it, with no surface and
    // no head, where solvePair zeroed it and lost the water; 0 zeroes it as before, to the bit (a pin frozen from older
    // code passes 0). It acts only with conserve.
    keepTrace: 1,
    // W6, the bunker of the fire (docs/DESIGN_W6_the_lists_v1_1_2026-11-20.md): with a coal list to port (coalListDeg > 0)
    // the starboard half of boiler room 5's forward bunker, against bulkhead E, was empty: its coal was dug out with the
    // fire, and that coal's absence is the list [read: docs/research/RESEARCH_lists_bunkers_scotland_road_v1_2026-11-17.md,
    // sections 0 and 3.3]. bunker: 1 makes it a pocket (sim.pockets): the hull's openings inside it fill it and not the
    // stokehold; it gives water to the stokehold only through its shut door (bunkerLeak, m2 [bet: Barrett's pumps kept the
    // stokehold workable]) until the head of its own water over its floor reaches bunkerBurst (m) [bet: the head the 1912
    // damage puts on it at T 60: the pumps research note, "its plates stayed dry until the bunker door burst at about
    // 12:40 (T 60)", and the Report's "about an hour". Held for good on join 7, the bunker's head does not peak: it is
    // 13.19 m at T 60, 14.24 at T 90 and 15.49 at T 140, so Barrett's 1:10 is within a head's reach, at a strength of
    // 14.2 to 14.3 m (B1+B2's e104, docs/research/RESEARCH_bunker_burst_head_W6_v1_2026-11-21.md; e76's "peaks at 13.7 m
    // at T 73, out of a head's reach" was wt/w6 before G6b's refit)], when it gives way and its water goes into the
    // stokehold at once (Barrett's rush). The stokehold's water on the wall's other side is left out [bet]: counted, the stokehold's
    // pumps would decide when the bunker goes (pumped dry, its wall carries the most), and the 1912 damage would founder
    // sooner with its pumps than without (e78). bunkerLen: the bunker's length fore and aft, the
    // watertight passage through it [read: 9 ft]. bunkerAov: the stiff virtual area of the full pocket, pressed up, as a
    // space's nodeAov [bet]. bunker: 0 leaves it out, and the step is then what it was before W6, to the bit.
    bunker: 1, bunkerLen: 9 * FT, bunkerLeak: 0.005, bunkerBurst: 13.65, bunkerAov: 1.0,   // bunkerBurst: D82 a's 3.5 to 14.3 (the history match)
    // G7: the forepeak tank's vent (peakPocket): its area, a 4 in pipe [bet; the history match took 0.01484 in G7's half
    // to twice], and the deck its outlet stands at [bet]
    peakVent: 0.01329, peakVentDeck: 'G',
    // C5 (the calibration epoch, dark until its landing): 1 weighs a full space's or pocket's whole vol, as before, to
    // the bit; 0 weighs its capacity (nodeVmax; cap), the excess being the sea's head over its top on a stiff virtual
    // area, pressure and not water (e101: about 14,900 m3 of it at the flag). readouts still counts vol either way.
    // 0 since the epoch's landing (D4).
    weighOverfill: 0,
    g11: 1,               // G11: E deck's paths at the deck plan's widths where a bulkhead stops at E deck (G11_E); 0: as before
    // C4 (the calibration epoch, dark until its landing). g11Doors: 1 keeps every watertight door of BULKHEADS, as
    // before, to the bit; 0 leaves out the three the deck plans do not show (G11_NO_DOOR below).
    // sideOpenings: 0, none, as before, to the bit; 1 gives her the openings in her side on D and E deck as the deck
    // plans write them (SIDE_OPENINGS, SIDE_KIND below): sidelights and the doors in her side, each holding until the
    // head on it reaches its strength, as the tiers' windows do. sideStrength: a multiplier on every one of those
    // strengths [they are bets, each in SIDE_KIND]. leakSide: the share of a shut sidelight's area that leaks [bet: 0,
    // a light screwed down on its gasket]; a door in her side leaks leakShell, as the staircase's gangway doors do.
    // Since the epoch's landing (D4): g11Doors 0, sideOpenings 1, sideStrength the history match's (0.1 to 1 [bet]).
    g11Doors: 0, sideOpenings: 1, sideStrength: 0.9759, leakSide: 0,

    // windows: 1 gives a ship built with her tiers (buildShip) the windows of their sides: plate glass bedded in its
    // frames, which leaks nothing (leakWin) and breaks with 1.5 m of sea on a pane's sill [0.5 to 3.5: plate theory
    // with the glass of the time, 6 to 13 mm thick]; 0 leaves the tiers' sides whole.
    windows: 1, hWin: 1.5, leakWin: 0,
    zetaHeave: 0.6, zetaPitch: 0.6, zetaRoll: 0.12,
    addedHeave: 1.0, addedPitch: 1.0, addedRoll: 0.2,
    kRoll: 0.38, kPitch: 0.25,
    coalListDeg: 1.598,   // list to port before the collision (Beesley; Halpern: 2; the history match in 0.5 to 3, B15)
    GM0: 0.7839,          // m (Hackett & Bedford 2.625 ft, 0.80; the history match in 0.6 to 1.0)
    draftF: (30 + 9 / 12) * FT, draftA: (33 + 9 / 12) * FT,   // Wilding, night of 14 April
  };

  // group kinds for connections
  const K_DOOR = 0, K_OVER = 1, K_DOWN = 2, K_XLOW = 3, K_XMERGE = 4, K_XUP = 5, K_TOP = 6, K_BREACH = 7, K_OPEN = 8, K_STAIR = 9;

  // ------------------------------------------------- the grand staircases (S1)
  // The two first-class staircases, each an open well through the decks under a dome of iron and glass, the dome under
  // a glazed weather cover on the roof. In this model the decks from E deck up to the top of what is shut in over them
  // are one space in each compartment (the well is why that is fair where a staircase stands), so a staircase adds no
  // space of its own: it adds its own openings to the weather. Its doors: steel gangway doors in the ship's side, which
  // leak and hold, and wooden entrance doors, which leak and then give way. And its dome: nothing, until its cover
  // goes, then a level opening the size of the smaller of its own glass and the free plan of the well under it. Each
  // holds until the head on it reaches its strength, then is open for good (stairsStep).
  // The numbers: docs/research/RESEARCH_grand_staircases_domes_record_v1_2026-11-19.md (the record) and
  // RESEARCH_topsides_dimensions_v1_2026-11-19.md (the plan); [scaled] is off the Boat-deck plan, within half a metre.
  // x: the middle of the dome's cover on the plan [scaled], m forward of amidships: the forward well over boiler room
  //   4, just abaft bulkhead F [read: the flight from E to F deck is "just aft" of it]; the after one over the
  //   reciprocating engine room [read: between the third and fourth funnels].
  // well: the free plan of the open well, m2 [bet: the flights' footprint, 16 to 20 ft by 17 ft, 24 to 34 m2; no
  //   plan of the well was found].
  // dome: the cover's glass, `up` m over `deck` (forward: the entrance's roof 3.9 m over the Boat deck [scaled] and the
  //   cover 1.0 m over that [scaled; a lead gives 6 ft]; aft: the cover stands 1.1 m on the Boat deck itself [scaled]),
  //   an ellipse l by b [scaled: the plan's circle of 6.4 by 6.6 m; "a 20 ft dome" in an unsourced account].
  // doors: on `deck`, their sills `up` m over it, b wide in all on each side and h high, y from the centreline (0: in
  //   the ship's side there); steel: a gangway door in the ship's side.
  //   Forward, on D deck: two gangway doors close together on each side into the reception room's vestibules, each
  //   1.87 m high and 1.43 m wide [read: the door raised from the wreck], "closed by lever handles but had no rubber"
  //   [read: the British Report]; on the Boat deck: a vestibule each side with its wooden door to the deck [read: the
  //   vestibules; bet: the door 0.85 m by 2.0 m; the hall is 56 ft wide]. On A deck the hall's vestibules open onto the
  //   promenade inside its screen, so they are no way in from the sea (the screen's windows are, among WINDOWS); the
  //   side doors that some accounts give B and C deck are not in the British Report's list and are left out.
  //   Aft: the hall's doors on A deck to the open after promenade [bet: as the forward ones]; it goes no higher.
  const STAIRS = [
    { id: 'F', name: 'forward grand staircase', x: 31.1, well: 28.0,
      dome: { deck: 'Boat', up: 4.9, l: 6.6, b: 6.4 },
      doors: [
        { deck: 'D', name: 'D-deck gangway doors', up: 0.0, b: 2.85, h: 1.87, y: 0, steel: true },
        { deck: 'Boat', name: 'Boat-deck entrance', up: 0.1, b: 0.85, h: 2.0, y: 8.6 },
      ] },
    { id: 'A', name: 'aft grand staircase', x: -38.75, well: 28.0,
      dome: { deck: 'Boat', up: 1.1, l: 6.6, b: 6.4 },
      doors: [
        { deck: 'A', name: 'A-deck entrance', up: 0.1, b: 0.85, h: 2.0, y: 9.6 },
      ] },
  ];
  // The two flow laws of those openings, each as its discharge over Cd sqrt(2g) (and over the width, for the first). H1
  // is the higher of the two levels above the sill or the plane, H2 the lower (0 when it stands under it); H1 > 0.
  // An upright rectangle of height h, its sill at 0: at each height the water runs at the speed of the head across the
  // opening there, summed over the opening. The part under the lower level runs drowned, at sqrt(H1 - H2); the part
  // above it as over a weir. So it is a weir while the higher level is under the opening's top, an orifice once both
  // are over it, and there is no join between the two; equal levels give nothing.
  function lawUpright(H1, H2, h) {
    const d = H2 < h ? H2 : h, e = H1 - d, r = H1 > h ? H1 - h : 0;
    return d * Math.sqrt(H1 - H2) + (2 / 3) * (e * Math.sqrt(e) - r * Math.sqrt(r));
  }
  // A level opening of area A and rim P (a dome that has gone, a well through a deck): shallow water runs in over its
  // rim as over a weir, deep water through it as through an orifice, and it carries the smaller of the two (they are
  // equal with 1.5 A / P of water on it); equal levels give nothing.
  function lawLevel(H1, H2, A, P) {
    const qo = A * Math.sqrt(H1 - H2), qw = P * (2 / 3) * H1 * Math.sqrt(H1);
    return qo < qw ? qo : qw;
  }
  // The windows in the sides of the tiers above B deck (a ship built with them): on each deck so many m2 of glass for
  // each metre of the tier's length on each side, their sills `sill` m over the deck, `h` high. A row of them is two
  // openings in each compartment on each side, and a row's panes go together, at the strength of the middling pane
  // (params.hWin; in the ship they would go one by one between about 0.75 and 1.2 of it). The areas are bets [B deck: a
  // window of about 0.5 m2 to every two metres of side; A deck: the screen's and the house's larger windows; the Boat
  // deck's houses: fewer]; so are the sills and heights.
  const WINDOWS = [
    { deck: 'B', a: 0.25, sill: 0.9, h: 0.8, name: 'B deck' },
    { deck: 'A', a: 0.30, sill: 0.9, h: 0.9, name: 'A deck' },
    { deck: 'Boat', a: 0.15, sill: 0.9, h: 0.8, name: 'the Boat deck\'s houses' },
  ];
  // where the side of each tier stands at x, at the height z: its half breadth, or 0 where there is none
  function tierSide(deck, x, z, P) {
    if (deck === 'B') return x > TIER.B[0] && x < TIER.B[1] ? halfBreadth(x, z, P) : 0;
    if (deck === 'A') return x > TIER.A[0] && x < TIER.A[1] ? (x > TIER.screen ? halfBreadth(x, z, P) : TIER.houseA) : 0;
    for (const h of TIER.houses) if (x > h.x0 && x <= h.x1) return h.hw;
    return 0;
  }
  // every opening to the weather above B deck as the step uses it: the staircases' doors and domes, then the tiers'
  // windows (plain data: a watch's forecast copies the sim whole)
  function weatherOpenings(p, ship) {
    const P = ship.hull;                                                   // C3: each stands on this ship's own side
    const out = p.stairs ? stairOpenings(p, P) : [];
    if (ship.tiers && p.windows) for (const Z of ship.zones) for (const w of WINDOWS) for (let i = 0; i < 2; i++) {
      const x = Z.xa + (0.25 + 0.5 * i) * Z.len, z = deckZ(w.deck, x) + w.sill, y = tierSide(w.deck, x, z + 0.5 * w.h, P);
      if (!(y > 0) || tierTop(x, y) < z + w.h) continue;            // no tier there, or one too low for a window (a raised roof)
      for (let sd = 0; sd < 2; sd++) out.push({
        stair: '', id: 'win:' + w.deck + ':' + Z.k + (sd ? 'S' : 'P') + i, label: '', first: 'win' + w.deck, firstLabel: `The sea breaks in at the windows of ${w.name}`,
        type: 2, x, y: sd ? -y : y, z, zc: z + 0.5 * w.h, size: w.a * 0.5 * Z.len / w.h, dim: w.h, leak: p.leakWin, hc: p.hWin,
        nodes: [nodeIndex(Z.k, sd, 1)], conn: -1,
      });
    }
    if (p.sideOpenings) sideOpenings(p, out, P);                            // C4: after every other, so that none of them moves
    return out;
  }
  // C4: the openings in her side on D and E deck (params.sideOpenings), as the deck plans write them: R3's table,
  // data/rooms/openings.json (Encyclopedia Titanica's plans, numbers only; D deck and E deck's bow by
  // docs/research/RESEARCH_rooms_openings_v1_1_2026-11-21.md). The rows are made from it by tools/side_openings.js, and
  // tools/stairs_tests.js holds them equal to it: [deck, kind, a, b, side, zone, count, x], a and b the plan's size in
  // inches (b 0 for a round light), side 0 to port and 1 to starboard, the model's compartment, how many, and the mean
  // of their places, m forward of amidships. One row is the like openings of one side in one compartment; they go
  // together, as a row of the tiers' windows does.
  const SIDE_OPENINGS = [
    ['D', 'light', 12, 0, 0, 0, 2, 118.27], ['D', 'light', 12, 0, 0, 1, 8, 108.2], ['D', 'light', 12, 0, 0, 2, 1, 99.37],
    ['D', 'light', 14, 0, 0, 2, 7, 91.59], ['D', 'light', 14, 0, 0, 3, 5, 80.74], ['D', 'pivot', 24, 19, 0, 3, 2, 73.34],
    ['D', 'pivot', 24, 19, 0, 4, 10, 63.36], ['D', 'pivot', 24, 19, 0, 5, 7, 49.22], ['D', 'door', 72, 53, 0, 5, 1, 40.8],
    ['D', 'doorwin', 20, 12, 0, 5, 2, 40.8], ['D', 'door', 72, 53, 0, 6, 1, 36.73], ['D', 'doorwin', 20, 12, 0, 6, 2, 36.73],
    ['D', 'bottom', 19.75, 0, 0, 6, 7, 27.11], ['D', 'top', 17, 0, 0, 6, 7, 27.11], ['D', 'bottom', 19.75, 0, 0, 7, 11, 10.31],
    ['D', 'top', 17, 0, 0, 7, 11, 10.31], ['D', 'bottom', 19.75, 0, 0, 8, 12, -7.04], ['D', 'top', 17, 0, 0, 8, 12, -7.04],
    ['D', 'bottom', 19.75, 0, 0, 9, 5, -22.04], ['D', 'top', 17, 0, 0, 9, 5, -22.04], ['D', 'bottom', 19.75, 0, 0, 10, 12, -37.71],
    ['D', 'top', 17, 0, 0, 10, 12, -37.71], ['D', 'bottom', 19.75, 0, 0, 11, 6, -53.82], ['D', 'top', 17, 0, 0, 11, 6, -53.82],
    ['D', 'light', 17, 0, 0, 11, 3, -62.41], ['D', 'pivot', 24, 19, 0, 12, 12, -74.76], ['D', 'light', 15, 0, 0, 13, 10, -93.84],
    ['D', 'light', 15, 0, 0, 14, 7, -107.59], ['D', 'light', 12, 0, 0, 14, 3, -115.83], ['D', 'light', 12, 0, 0, 15, 6, -123.16],
    ['D', 'light', 12, 0, 1, 0, 2, 118.27], ['D', 'light', 12, 0, 1, 1, 7, 109.15], ['D', 'light', 12, 0, 1, 2, 2, 100.48],
    ['D', 'light', 14, 0, 1, 2, 7, 91.53], ['D', 'light', 14, 0, 1, 3, 5, 80.56], ['D', 'pivot', 24, 19, 1, 3, 2, 73.34],
    ['D', 'pivot', 24, 19, 1, 4, 10, 63.36], ['D', 'pivot', 24, 19, 1, 5, 7, 49.22], ['D', 'door', 72, 53, 1, 5, 2, 38.99],
    ['D', 'doorwin', 20, 12, 1, 5, 4, 38.99], ['D', 'bottom', 19.75, 0, 1, 6, 7, 27.11], ['D', 'top', 17, 0, 1, 6, 7, 27.11],
    ['D', 'bottom', 19.75, 0, 1, 7, 11, 10.31], ['D', 'top', 17, 0, 1, 7, 11, 10.31], ['D', 'bottom', 19.75, 0, 1, 8, 12, -7.04],
    ['D', 'top', 17, 0, 1, 8, 12, -7.04], ['D', 'bottom', 19.75, 0, 1, 9, 4, -22.04], ['D', 'top', 17, 0, 1, 9, 4, -22.04],
    ['D', 'bottom', 19.75, 0, 1, 10, 11, -38.76], ['D', 'top', 17, 0, 1, 10, 11, -38.76], ['D', 'bottom', 19.75, 0, 1, 11, 7, -53.73],
    ['D', 'top', 17, 0, 1, 11, 7, -53.73], ['D', 'light', 17, 0, 1, 11, 3, -62.56], ['D', 'pivot', 24, 19, 1, 12, 12, -74.76],
    ['D', 'light', 15, 0, 1, 13, 10, -93.84], ['D', 'light', 15, 0, 1, 14, 7, -107.59], ['D', 'light', 12, 0, 1, 14, 3, -115.83],
    ['D', 'light', 12, 0, 1, 15, 6, -123.16], ['E', 'light', 10, 0, 0, 0, 2, 117.46], ['E', 'light', 10, 0, 0, 1, 8, 108.67],
    ['E', 'light', 10, 0, 0, 2, 1, 100.11], ['E', 'light', 12, 0, 0, 2, 6, 94.25], ['E', 'light', 12, 0, 0, 3, 4, 80.56],
    ['E', 'light', 15, 0, 0, 3, 2, 73.34], ['E', 'light', 15, 0, 0, 4, 10, 62.99], ['E', 'light', 15, 0, 0, 5, 8, 45.71],
    ['E', 'light', 15, 0, 0, 6, 10, 28.24], ['E', 'light', 15, 0, 0, 7, 9, 9.75], ['E', 'light', 15, 0, 0, 8, 9, -7.44],
    ['E', 'light', 15, 0, 0, 9, 8, -21.69], ['E', 'light', 15, 0, 0, 10, 11, -36.68], ['E', 'light', 15, 0, 0, 11, 11, -56.64],
    ['E', 'door', 96, 54, 0, 12, 1, -71.57], ['E', 'light', 15, 0, 0, 12, 8, -74.54], ['E', 'door', 72, 54, 0, 12, 1, -83.43],
    ['E', 'light', 15, 0, 0, 13, 9, -92.34], ['E', 'light', 15, 0, 0, 14, 1, -101.34], ['E', 'light', 12, 0, 0, 14, 8, -110.12],
    ['E', 'light', 12, 0, 0, 15, 4, -121.52], ['E', 'light', 10, 0, 1, 0, 2, 117.46], ['E', 'light', 10, 0, 1, 1, 8, 108.67],
    ['E', 'light', 10, 0, 1, 2, 1, 100.11], ['E', 'light', 12, 0, 1, 2, 6, 94.25], ['E', 'light', 12, 0, 1, 3, 4, 80.56],
    ['E', 'light', 15, 0, 1, 3, 3, 74.26], ['E', 'light', 15, 0, 1, 4, 10, 63.36], ['E', 'light', 15, 0, 1, 5, 11, 45.99],
    ['E', 'light', 15, 0, 1, 6, 10, 27.97], ['E', 'light', 15, 0, 1, 7, 11, 10.64], ['E', 'light', 15, 0, 1, 8, 10, -6.98],
    ['E', 'light', 15, 0, 1, 9, 6, -21.43], ['E', 'light', 15, 0, 1, 10, 12, -37.1], ['E', 'light', 15, 0, 1, 11, 10, -56.71],
    ['E', 'door', 96, 54, 1, 12, 1, -71.57], ['E', 'light', 15, 0, 1, 12, 10, -73.85], ['E', 'door', 72, 54, 1, 12, 1, -83.43],
    ['E', 'light', 15, 0, 1, 13, 9, -93.78], ['E', 'light', 12, 0, 1, 14, 8, -110.12], ['E', 'light', 12, 0, 1, 15, 4, -121.52],
  ];
  // What the plans do not give, each a bet. mid: the middle of a light over its deck, m; the plans give no heights, so
  // every light is placed on its deck's sidelight line [bet: 1.5 m over the deck, about 5 ft; the saloon's pairs one
  // over the other, the bottom light at 1.3 m and the top light at 2.0 m, clear of each other]. A door's sill is the
  // deck's [bet], and its windows' middle 1.5 m over it [bet]. tall: 1 where the plan's first figure is the height
  // [bet: a door's (6 ft by 4 ft 5 in: the door raised from the wreck is 1.87 m high) and its sliding windows'], 0
  // where it is the width [bet: Utley's 24 by 19 in pivoting lights].
  // h: the strength, the head of sea on the opening's middle less any water behind it there, m (times
  // params.sideStrength). No test of a 1912 sidelight was found, so each is a bet from plate theory: a disc of glass
  // 3/4 in thick [bet] simply supported at its rim, breaking at 40 MPa [bet], holds 50 m of sea at 12 in, 32 m at 15
  // in, 25 m at 17 in and 18.5 m at 19 3/4 in.
  //   light: 30 [bet: the 15 in light's; one figure for the round lights of 10 to 17 in];
  //   pivot: 12 [bet: a rectangle of 24 by 19 in on its pivots, under its glass's 16];
  //   top: 20 [bet: the saloon's top light, which opens: on its hinge and dogs, under its glass's 25];
  //   bottom: 18 [bet: the saloon's bottom light, which does not open: it lets the sea in only once its glass breaks];
  //   door: 10 [bet: a steel door in her side on its lever handles; S1 let the gangway doors hold for ever];
  //   doorwin: 5 [bet: a sliding window in a door's leaf, thinner glass in a lighter frame].
  // A door's row carries its leaf less its windows, which have their own row, so that nothing is counted twice.
  const SIDE_KIND = {
    light: { mid: 1.5, h: 30, name: 'sidelights' }, pivot: { mid: 1.5, h: 12, name: 'sidelights' },
    top: { mid: 2.0, h: 20, name: 'sidelights' }, bottom: { mid: 1.3, h: 18, name: 'sidelights' },
    door: { sill: 0, h: 10, tall: 1, name: 'doors in her side', own: 'door' }, doorwin: { mid: 1.5, h: 5, tall: 1, name: 'windows of the doors in her side', own: 'doorwin' },
  };
  const INCH = 0.0254;
  function sideOpenings(p, out, P) {
    const areaOf = (r) => r[3] ? r[2] * INCH * r[3] * INCH : Math.PI / 4 * (r[2] * INCH) * (r[2] * INCH);
    for (const r of SIDE_OPENINGS) {
      const deck = r[0], kind = r[1], sd = r[4], k = r[5], n = r[6], x = r[7], K = SIDE_KIND[kind];
      const h = (r[3] ? (K.tall ? r[2] : r[3]) : r[2]) * INCH, area = n * areaOf(r);
      let open = area;                                                     // a door's leaf less its windows (the row at its place)
      if (kind === 'door') for (const w of SIDE_OPENINGS) if (w[1] === 'doorwin' && w[0] === deck && w[4] === sd && w[5] === k && w[7] === x) open -= w[6] * areaOf(w);
      const z = deckZ(deck, x) + (kind === 'door' ? K.sill : K.mid - 0.5 * h), y = halfBreadth(x, z + 0.5 * h, P);
      out.push({
        stair: '', id: 'side:' + deck + ':' + kind + r[2] + ':' + k + (sd ? 'S' : 'P'), label: '', first: 'side' + deck + (K.own || ''),
        firstLabel: `The sea breaks in at the ${K.name} on ${deck} deck`,
        type: 2, x, y: sd ? -y : y, z, zc: z + 0.5 * h, size: open / h, dim: h, leak: kind === 'door' ? p.leakShell : p.leakSide, hc: K.h * p.sideStrength,
        nodes: [nodeIndex(k, sd, 1)], conn: -1, side: { deck, kind, count: n, area },
      });
    }
    return out;
  }
  function stairOpenings(p, P) {
    const out = [];
    for (const s of STAIRS) {
      const k = zoneAt(s.x);
      const wood = [];                                                     // its doors that can give way: the dome's air path
      for (const d of s.doors) for (let sd = 0; sd < 2; sd++) {            // 0 port, 1 starboard
        if (d.steel && p.sideOpenings) continue;                           // C4: the plans' own doors in her side stand for them (SIDE_OPENINGS)
        const z = deckZ(d.deck, s.x) + d.up, y = d.y > 0 ? d.y : halfBreadth(s.x, z + 0.5 * d.h, P);
        if (!d.steel) wood.push(out.length);
        // a door's strength is the depth of water at its sill (zc); a steel door in the ship's side has none to reach
        out.push({
          stair: s.id, id: 'ent' + s.id + ':' + d.deck + (sd ? 'S' : 'P'), label: d.steel ? '' : `The sea breaks in at the ${s.name}'s ${d.name} (${sd ? 'starboard' : 'port'} door)`,
          type: 2, x: s.x, y: sd ? -y : y, z, zc: z, size: d.b, dim: d.h, leak: d.steel ? p.leakShell : p.leakDoor, hc: d.steel ? Infinity : p.hDoor,
          nodes: [nodeIndex(k, sd, 1)], conn: -1,
        });
      }
      const m = s.dome, z = deckZ(m.deck, s.x) + m.up, a = 0.5 * m.l, b = 0.5 * m.b;
      const glass = Math.PI * a * b, A = glass < s.well ? glass : s.well;
      const rim = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));      // an ellipse's rim (Ramanujan)
      out.push({
        stair: s.id, id: 'dome' + s.id, label: `The dome over the ${s.name} gives way`,
        type: 3, x: s.x, y: 0, z, zc: z, size: A, dim: rim, leak: p.leakDome, hc: p.hDome, doors: wood,
        nodes: [nodeIndex(k, 0, 1), nodeIndex(k, 1, 1)], conn: -1,
      });
    }
    return out;
  }

  function buildShip(opts) {
    opts = opts || {};
    // C3: hullEnds: 1, the default since the calibration epoch's landing (D4), gives her hull's ends above the waterline
    // as the deck plans draw them (ENDS_READ above); 0 is the fitted form alone, the ship before C3, to the bit (the seams
    // gate pins it)
    const hullEndsOn = !(opts.hullEnds === 0 || opts.hullEnds === false);
    const P = hullEndsOn ? (opts.hull ? Object.assign({}, opts.hull, { ends: hullEnds() }) : (HULL_ENDS || (HULL_ENDS = Object.assign({}, HULL, { ends: hullEnds() })))) : (opts.hull || HULL);
    // S1: tiers: the superstructure above B deck as part of her (TIER above); buildShip({ tiers: 0 }) is the hull that
    // stops at B deck, as before S1 (the seams gate builds her so)
    const tiers = !(opts.tiers === 0 || opts.tiers === false);
    // G7: peakTank: the forepeak's space below E deck begins at the orlop deck, the peak tank under it a pocket
    // (peakPocket); buildShip({ peakTank: 0 }) is the ship before G7, to the bit (the seams gate builds her so)
    const peakTank = !(opts.peakTank === 0 || opts.peakTank === false);
    const cols = buildColumns(P, { dx: opts.dx || 3.0, dy: opts.dy || 0.5, tiers });
    const bx = zoneBounds();
    const zones = ZONES.map((z, k) => Object.assign({}, z, {
      k, xf: bx[k], xa: bx[k + 1], xm: 0.5 * (bx[k] + bx[k + 1]), len: bx[k] - bx[k + 1],
      floor: z.peak ? 0 : G.tankTop,
    }));
    const lists = Array.from({ length: NN }, () => []);
    for (let i = 0; i < cols.N; i++) {
      const k = cols.zone[i], sd = cols.side[i];
      const zE = deckZ('E', cols.x[i]);
      const a0 = Math.max(cols.zlo[i], peakTank && k === 0 ? deckZ('orlop', cols.x[i]) : zones[k].floor), e0 = Math.min(cols.zhi[i], zE);
      if (e0 > a0 + 1e-3) lists[nodeIndex(k, sd, 0)].push([i, a0, e0]);
      const a1 = Math.max(cols.zlo[i], zE), e1 = cols.zhi[i];
      if (e1 > a1 + 1e-3) lists[nodeIndex(k, sd, 1)].push([i, a1, e1]);
    }
    const nodeStart = new Int32Array(NN), nodeCount = new Int32Array(NN);
    const ent = [];
    for (let n = 0; n < NN; n++) { nodeStart[n] = ent.length; nodeCount[n] = lists[n].length; for (const e of lists[n]) ent.push(e); }
    const entCol = Int32Array.from(ent.map(e => e[0]));
    const entA = Float64Array.from(ent.map(e => e[1]));
    const entE = Float64Array.from(ent.map(e => e[2]));
    const nodeMu = new Float64Array(NN), nodeVmax = new Float64Array(NN), nodeAmin = new Float64Array(NN), nodeAov = new Float64Array(NN);
    // S1: nodeVtol, what the space holds up to the hull's own top: the level solver's tolerance is set by it, so that
    // a ship's tiers do not loosen it (without them it is nodeVmax, to the bit)
    const nodeVtol = new Float64Array(NN);
    for (let n = 0; n < NN; n++) {
      const layer = n & 1, k = n >> 2;
      nodeMu[n] = layer ? MU_UP : zones[k].mu;
      let vm = 0, fp = 0, vh = 0;
      for (let j = nodeStart[n]; j < nodeStart[n] + nodeCount[n]; j++) {
        const i = entCol[j]; vm += cols.dxdy[i] * (entE[j] - entA[j]); fp += cols.dxdy[i];
        vh += cols.dxdy[i] * ((entE[j] < cols.zhiH[i] ? entE[j] : cols.zhiH[i]) - entA[j]);
      }
      nodeVmax[n] = nodeMu[n] * vm; nodeVtol[n] = nodeMu[n] * vh;
      nodeAmin[n] = Math.max(4, 0.15 * nodeMu[n] * fp);
      nodeAov[n] = Math.max(1, 0.03 * fp);     // a full space is "pressed up": stiff virtual head
    }
    // intact hydrostatics at the mean draft of the night (for damping and GM)
    const hyd = evenKeel(cols, 0.5 * (DEFAULT_PARAMS.draftF + DEFAULT_PARAMS.draftA));
    return { cols, zones, nodeStart, nodeCount, entCol, entA, entE, nodeMu, nodeVmax, nodeVtol, nodeAmin, nodeAov, hyd, hull: P, tiers, peakTank, hullEnds: hullEndsOn ? 1 : 0 };
  }

  // ---------------------------------------------------------- connections
  function makeConnStore(cap) {
    return {
      n: 0, cap,
      a: new Int32Array(cap), b: new Int32Array(cap), type: new Uint8Array(cap),
      x: new Float64Array(cap), y: new Float64Array(cap), z: new Float64Array(cap),
      area: new Float64Array(cap), coef: new Float64Array(cap), en: new Uint8Array(cap),
      kind: new Uint8Array(cap), idx: new Int32Array(cap), q: new Float64Array(cap),
      tOn: new Float64Array(cap),
      // seams for a ship under way (docs/BRAINSTORM_ship_under_way_v1): set before each step, neutral by default.
      // hx: outside piezometric level (m above the calm sea) at a sea-side connection; cm: factor on an orifice's Cd.
      hx: new Float64Array(cap), cm: new Float64Array(cap).fill(1),
      // S1: the second measure of an opening that has two: an upright one's height (type 2; area is then its width), a
      // level one's rim (type 3; area is its area)
      dim: new Float64Array(cap),
      // W6: the pocket a hull opening fills instead of its space (index into sim.pockets), -1 for none
      pk: new Int8Array(cap).fill(-1),
    };
  }
  function pushConn(S, a, b, type, x, y, z, area, coef, kind, idx, en) {
    if (S.n >= S.cap) throw new Error('connection store full');
    const i = S.n++;
    S.a[i] = a; S.b[i] = b; S.type[i] = type; S.x[i] = x; S.y[i] = y; S.z[i] = z;
    S.area[i] = area; S.coef[i] = coef; S.kind[i] = kind; S.idx[i] = idx; S.en[i] = en ? 1 : 0; S.q[i] = 0; S.tOn[i] = 0;
    return i;
  }

  // G11: E deck's two fore-and-aft paths where they cross a bulkhead that stops at E deck, at the deck plan's widths
  // (R3's pilot, data/rooms/E_deck.json and its report, from Encyclopedia Titanica's plans checked against The
  // Shipbuilder's plate): Scotland Road 2.24 m clear between its walls from 82.5F to 19A (2.63 over them, the record's
  // 8.5 to 9 ft), so at D to J; the starboard passage 1.31 to 1.49 m, 1.49 where R3 placed it between the first-class
  // cabins (D, E), its middle 1.40 elsewhere [derived: the mean where R3 gives the range]. C stands forward of Scotland
  // Road's head, in the third-class open space round the forward hatches, and keeps the model's widths. Before G11 the
  // paths were 3.0 and 2.0 m times wMul at every bulkhead (params.wPort, wStbd: still used where G11 has no row).
  const G11_E = { D: [2.24, 1.49], E: [2.24, 1.49], F: [2.24, 1.40], G: [2.24, 1.40], H: [2.24, 1.40], J: [2.24, 1.40] };

  // ------------------------------------------------- W6: pockets (the bunker of the fire)
  // A pocket is a space inside one of the 64, sealed from it but by a door: here the empty starboard half of boiler room
  // 5's forward bunker, from bulkhead E aft the bunker's length, from the tank top to G deck, from the centreline to the
  // shell (its capacity from the hull's own form). Its water is its own (pk.vol, not in sim.vol): it weighs where the
  // pocket stands, filling it from the bottom. In the step's flow arrays it is space NN + j.
  function bunkerPocket(ship, p) {
    const xE = BULKHEADS.find(b => b.id === 'E').x, x0 = xE - p.bunkerLen, x1 = xE, k = zoneAt(0.5 * (x0 + x1));
    const z0 = ship.zones[k].floor, nx = 8, nz = 48;
    let z1 = 0; for (let i = 0; i < nx; i++) z1 += deckZ('G', x0 + (i + 0.5) * (x1 - x0) / nx); z1 /= nx;
    let V = 0, My = 0;
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const hb = halfBreadth(x0 + (i + 0.5) * (x1 - x0) / nx, z0 + (j + 0.5) * (z1 - z0) / nz), dV = hb * (x1 - x0) / nx * (z1 - z0) / nz;
      V += dV; My -= dV * 0.5 * hb;                  // starboard: y negative
    }
    const yc = My / V;
    return {
      name: 'the bunker of the fire (boiler room 5, forward, starboard)', node: nodeIndex(k, 1, 0), side: 1,
      x0, x1, z0, z1, cap: V, xc: 0.5 * (x0 + x1), yc, area: V / (z1 - z0), aov: p.bunkerAov,
      xd: x0, yd: yc, zd: z0 + 0.5,                   // its door, aft, at the stokehold's plates [bet]
      vol: 0, state: 0, t: -1, live: false, dV: 0, q: 0,
    };
  }
  // G7: the forepeak's tank as a pocket (docs/DESIGN_G7_the_forepeak_tank_v1_2026-11-20.md). The peak tank, from the
  // collision bulkhead (A) to the stem and from the keel to the orlop deck, its top the orlop's watertight flat (The
  // Shipbuilder, 1911: "The orlop deck in the forepeak tank was also a watertight flat"); the Report: the forepeak "was
  // not flooded above the Orlop deck - i.e., the peak tank top" in the first ten minutes. Both sides, its capacity from
  // the hull's own form (a tank of water: permeability 1 [bet]); no strength given [bet: no source has the flat giving
  // way]; its vent, Hemming's "exhaust pipe" (BI 17724), a pipe of params.peakVent m2 with its outlet at G deck just
  // forward of A [bet: the pipe's size and outlet are not in the open record], by which water rises into the
  // forepeak's own space once the tank is full and its head stands over the outlet. The forepeak's own space then
  // begins at the orlop deck (buildShip's peakTank): none of its columns lie in the tank, so no overlap.
  function peakPocket(ship, p) {
    const x0 = BULKHEADS.find(b => b.id === 'A').x, x1 = ship.zones[0].xf, nx = 24, nz = 48, z0 = 0;
    let V = 0, Mx = 0, zs = 0;
    for (let i = 0; i < nx; i++) {
      const x = x0 + (i + 0.5) * (x1 - x0) / nx, zt = deckZ('orlop', x); zs += zt;
      for (let j = 0; j < nz; j++) { const dV = 2 * halfBreadth(x, z0 + (j + 0.5) * (zt - z0) / nz) * (x1 - x0) / nx * (zt - z0) / nz; V += dV; Mx += dV * x; }
    }
    const z1 = zs / nx, xd = x0 + 3;
    return {
      name: 'the forepeak tank', node: nodeIndex(0, 1, 0), side: -1, deck: 'orlop',
      x0, x1, z0, z1, cap: V, xc: Mx / V, yc: 0, area: V / (z1 - z0), aov: p.bunkerAov,
      xd, yd: 0, zd: deckZ(p.peakVentDeck, xd), leak: p.peakVent, burst: Infinity, overlap: false,
      vol: 0, state: 0, t: -1, live: false, dV: 0, q: 0,
    };
  }
  // the holding pocket a hull opening lies in (-1: none); a pocket of both sides (side -1) takes either, and one whose
  // top is a deck (G7's tank) takes an opening under that deck where it stands
  function pocketOf(sim, o) {
    for (let j = 0; j < sim.pockets.length; j++) {
      const k = sim.pockets[j];
      if (k.state === 0 && (k.side < 0 || o.side === k.side) && o.layer === 0 && o.x >= k.x0 && o.x <= k.x1 && o.z >= k.z0 && o.z <= (k.deck ? deckZ(k.deck, o.x) : k.z1)) return j;
    }
    return -1;
  }
  // a pocket's level (world) and the area its level moves by, as a space's hEff and Aeff
  function pocketHead(sim, F, j, hEff, Aeff) {
    const k = sim.pockets[j], n = NN + j;
    if (k.vol <= 1e-6) { hEff[n] = -1e9; Aeff[n] = k.area; return; }
    if (k.vol < k.cap) { hEff[n] = worldZ(F, k.xc, k.yc, k.z0 + (k.z1 - k.z0) * k.vol / k.cap); Aeff[n] = k.area; }
    else { hEff[n] = worldZ(F, k.xc, k.yc, k.z1) + (k.vol - k.cap) / k.aov; Aeff[n] = k.aov; }
  }
  // A pocket's water as point masses (volume, x, y, z in the ship frame; four numbers a point): its own water where the
  // pocket stands, filling it from the bottom; and, because its space's columns include the pocket's place, the space's
  // water that the level solve puts there below the space's level is taken out of the pocket's place and put at the
  // space's own centre across the beam (its two halves together), where that water stands (the pocket is sealed). So a
  // pocket full of water inside a flooded space weighs only by what it holds above the space's level. Its mass is the
  // pocket's water alone (the moved water is moved, not added). The core's loads and the girder's weight both read it.
  function pocketPoints(sim, F, k) {
    // C5 (the epoch, dark): with params.weighOverfill 0 a full pocket weighs its capacity, as a full space does
    const V = sim.params.weighOverfill ? k.vol : Math.min(k.vol, k.cap), pts = [V, k.xc, k.yc, k.z0 + 0.5 * (k.z1 - k.z0) * (V < k.cap ? V / k.cap : 1)];
    const n = k.node, nO = n - 2;                      // the space's starboard and port halves (the pair at its floor)
    if (k.overlap !== false && sim.vol[n] > 1e-6) {     // G7's tank shares no column with its space: nothing to move
      const zs = (sim.level[n] - (F.R20 * k.xc + F.R21 * k.yc + F.tz)) / F.R22;
      const f = zs <= k.z0 ? 0 : (zs >= k.z1 ? 1 : (zs - k.z0) / (k.z1 - k.z0));
      if (f > 0) {
        const O = k.cap * f, zO = k.z0 + 0.5 * f * (k.z1 - k.z0), vP = sim.vol[nO], vS = sim.vol[n];
        const yS = (vP * sim.cy[nO] + vS * sim.cy[n]) / (vP + vS);
        pts.push(-O, k.xc, k.yc, zO, O, k.xc, yS, zO);
      }
    }
    return pts;
  }
  // G7 (QC B-3, A-6): the water of space n with the water of the pockets in it (m3). sim.vol[n] is the space's own; a
  // holding pocket keeps its water outside sim.vol (W6's bunker, G7's tank, which never gives way), in the place of its
  // space k.node, the starboard half of the pair at its floor; a pocket of both sides (k.side < 0) counts half to each
  // half. Over the 64 spaces it sums to C.readouts(sim).waterM3 (tools/pocket_tests.js holds it while a pocket holds).
  // A mirror of the core's water counts a space's water by it, not by sim.vol alone: the fall's hand-over, rooms.js,
  // the walk and U0's record adopt it after join 7; motion.js's syncMass with the calibration epoch, since it moves the
  // watch. Nothing in the step reads it.
  function spaceWater(sim, n) {
    let v = sim.vol[n];
    if (sim.pockets) for (const k of sim.pockets) {
      if (k.side < 0) { if (n === k.node || n === k.node - 2) v += 0.5 * k.vol; } else if (n === k.node) v += k.vol;
    }
    return v;
  }
  // The epoch's C1 (QC A-6): every body of water aboard, the 64 spaces in order and then the pockets, as
  // fn(vol, x, y, z, n, j): its volume (m3) and centre (ship frame), the space n it belongs to, and j the pocket's index
  // (-1 for a space). A pocket's centre is its own water's (pocketPoints' first point). The step does not read it; a
  // mirror that weighs her water by bodies (motion.js's syncMass, when SHIP.massPockets is on) reads it.
  // C5: her water as `loads` weighs it (m3): every body's volume, cut at its capacity when params.weighOverfill is 0.
  // A mirror that weighs her water (the girder, the fall's hand-over) holds its own total to this one with the switch at 0.
  function weighedWater(sim) { let v = 0; eachWater(sim, (V) => { v += V; }, true); return v; }
  // weighed (C5): with params.weighOverfill 0, a full space's or pocket's volume up to its capacity, as `loads` weighs it
  function eachWater(sim, fn, weighed) {
    const cut = weighed && !sim.params.weighOverfill, vm = sim.ship.nodeVmax;
    for (let n = 0; n < NN; n++) fn(cut ? Math.min(sim.vol[n], vm[n]) : sim.vol[n], sim.cx[n], sim.cy[n], sim.cz[n], n, -1);
    if (sim.pockets) for (let j = 0; j < sim.pockets.length; j++) {
      const k = sim.pockets[j], V = cut ? Math.min(k.vol, k.cap) : k.vol;
      fn(V, k.xc, k.yc, k.z0 + 0.5 * (k.z1 - k.z0) * (V < k.cap ? V / k.cap : 1), k.node, j);
    }
  }
  // after the step: a holding pocket gives way once the head of its own water over its floor reaches
  // params.bunkerBurst (its space's water on the wall's other side left out: DEFAULT_PARAMS); its water goes into its
  // space at once, and its openings then fill the space as any other
  function pocketsStep(sim, F) {
    const p = sim.params, hEff = sim._hEff, Aeff = sim._Aeff;
    let rebuild = false;
    for (let j = 0; j < sim.pockets.length; j++) {
      const k = sim.pockets[j];
      if (k.state !== 0 || k.vol <= 1e-6) continue;
      pocketHead(sim, F, j, hEff, Aeff);
      if (hEff[NN + j] - worldZ(F, k.xd, k.yd, k.z0) >= (k.burst !== undefined ? k.burst : p.bunkerBurst)) {
        sim.vol[k.node] += k.vol; k.vol = 0; k.state = 1; k.t = sim.t;
        sim.events.push({ t: sim.t, id: 'bunker', label: 'The bunker of the fire gives way: its water rushes into boiler room 5' });
        rebuild = true;
      }
    }
    if (rebuild) rebuildConnections(sim);
  }

  function rebuildConnections(sim) {
    const ship = sim.ship, p = sim.params, zones = ship.zones;
    const S = makeConnStore(2048);
    const Bh = G.B / 2;
    // bulkheads: doors and E/D-deck overflow
    for (let b = 0; b < BULKHEADS.length; b++) {
      const bh = BULKHEADS[b], x = bh.x, kF = b, kA = b + 1;
      const open = sim.doorOpen[b] === 1;
      for (const [deck, count] of bh.doors) {
        if (!p.g11Doors && G11_NO_DOOR[bh.id] === deck) continue;         // C4: a door the deck plans do not show
        if (deck === 'low') {
          const z = Math.max(zones[kF].floor, zones[kA].floor) + 0.85;
          for (let sd = 0; sd < 2; sd++) pushConn(S, nodeIndex(kF, sd, 0), nodeIndex(kA, sd, 0), 0, x, sd ? -0.6 : 0.6, z, p.doorLowA / 2, p.CdDoor, K_DOOR, b, open);
        } else {
          const z = deckZ(deck, x) + 1.0;
          const layer = z < deckZ('E', x) ? 0 : 1;
          const A = p.doorA * count / 2;
          for (let sd = 0; sd < 2; sd++) pushConn(S, nodeIndex(kF, sd, layer), nodeIndex(kA, sd, layer), 0, x, sd ? -6 : 6, z, A, p.CdDoor, K_DOOR, b, open);
        }
      }
      const topDeck = sim.bulkTop[b];
      const crest = deckZ(topDeck, x);
      if (crest < zTopAt(x) - 0.3) {
        // port path (Scotland Road), starboard path (alleyway), plus a centre stair share. G11 (2026-11-21, with G7):
        // where the bulkhead stops at E deck, the paths at the deck plan's own widths (G11_E), wMul a multiplier on them
        const g = p.g11 && topDeck === 'E' ? G11_E[bh.id] : null, wP = g ? g[0] : p.wPort, wS = g ? g[1] : p.wStbd;
        pushConn(S, nodeIndex(kF, 0, 1), nodeIndex(kA, 0, 1), 1, x, 8.0, crest, wP * p.wMul, p.Cweir, K_OVER, b, true);
        pushConn(S, nodeIndex(kF, 1, 1), nodeIndex(kA, 1, 1), 1, x, -8.0, crest, wS * p.wMul, p.Cweir, K_OVER, b, true);
        pushConn(S, nodeIndex(kF, 0, 1), nodeIndex(kA, 0, 1), 1, x, 1.5, crest, 0.5 * p.wMul, p.Cweir, K_OVER, b, true);
        pushConn(S, nodeIndex(kF, 1, 1), nodeIndex(kA, 1, 1), 1, x, -1.5, crest, 0.5 * p.wMul, p.Cweir, K_OVER, b, true);
      } else if (ship.tiers && deckTopAt(x) > zTopAt(x)) {
        // S1: a bulkhead carried to the hull's top (a what-if; Britannic's) stops there: the tiers over it are open fore
        // and aft, by the same paths at B deck [bet: as wide as E deck's]
        const top = zTopAt(x);
        pushConn(S, nodeIndex(kF, 0, 1), nodeIndex(kA, 0, 1), 1, x, 8.0, top, p.wPort * p.wMul, p.Cweir, K_OVER, b, true);
        pushConn(S, nodeIndex(kF, 1, 1), nodeIndex(kA, 1, 1), 1, x, -8.0, top, p.wStbd * p.wMul, p.Cweir, K_OVER, b, true);
        pushConn(S, nodeIndex(kF, 0, 1), nodeIndex(kA, 0, 1), 1, x, 1.5, top, 0.5 * p.wMul, p.Cweir, K_OVER, b, true);
        pushConn(S, nodeIndex(kF, 1, 1), nodeIndex(kA, 1, 1), 1, x, -1.5, top, 0.5 * p.wMul, p.Cweir, K_OVER, b, true);
      }
    }
    // within each compartment
    for (const Z of zones) {
      const k = Z.k;
      // through E deck (two openings per side)
      for (const f of [0.25, 0.75]) {
        const x = Z.xa + f * Z.len, zE = deckZ('E', x);
        const yb = Math.max(1, 0.45 * halfBreadth(x, zE, ship.hull));
        for (let sd = 0; sd < 2; sd++) pushConn(S, nodeIndex(k, sd, 0), nodeIndex(k, sd, 1), 0, x, sd ? -yb : yb, zE, p.aDown / 2, p.CdDoor, K_DOWN, k, true);
      }
      // port <-> starboard
      if (sim.mergeAlways[k * 2] === 0) {
        pushConn(S, nodeIndex(k, 0, 0), nodeIndex(k, 1, 0), 0, Z.xm, 0, Z.floor + 0.4, p.axHold, p.CdDoor, K_XLOW, k, true);
        pushConn(S, nodeIndex(k, 0, 0), nodeIndex(k, 1, 0), 1, Z.xm, 0, sim.zMerge[k], 0.3 * Z.len, p.Cweir, K_XMERGE, k, true);
      }
      if (sim.mergeAlways[k * 2 + 1] === 0) {
        pushConn(S, nodeIndex(k, 0, 1), nodeIndex(k, 1, 1), 0, Z.xm, 0, deckZ('E', Z.xm) + 0.3, p.axUp, p.CdDoor, K_XUP, k, true);
      }
      // top deck open to the sea once it goes under (hatches, companionways, doors) — centreline
      for (const f of [1 / 6, 0.5, 5 / 6]) {
        const x = Z.xa + f * Z.len, zt = ship.tiers ? deckTopAt(x) : zTopAt(x);   // S1: with her tiers, the weather deck over them
        if (halfBreadth(x, zt - 0.05, ship.hull) < 0.3) continue;
        for (let sd = 0; sd < 2; sd++) pushConn(S, -1, nodeIndex(k, sd, 1), 1, x, 0, zt, 0.5 * p.fOpen * Z.len / 3, p.Cweir, K_TOP, k, true);
      }
    }
    // user openings: hull breaches and portholes
    for (const pk of sim.pockets || []) pk.live = false;
    for (const o of sim.openings) {
      if (!o.active) continue;
      o.conn = pushConn(S, -1, o.node, 0, o.x, o.y, o.z, o.area, p.CdBreach, o.kind === 'breach' ? K_BREACH : K_OPEN, o.id, true);
      S.tOn[o.conn] = o.tOpen || 0;
      if (sim.pockets && sim.pockets.length) { const j = pocketOf(sim, o); S.pk[o.conn] = j; if (j >= 0) sim.pockets[j].live = true; }   // W6
    }
    // S1: the grand staircases' openings to the weather. They come last, so that no connection before them moves, and
    // each stays off until the sea reaches it (stairsStep), so that until then nothing of the step changes.
    const ops = sim.stairOps;
    for (let j = 0; j < ops.length; j++) {
      const o = ops[j], st = sim.stairSt[j];
      const f = st === 2 ? 1 : o.leak, en = st === 2 || (st === 1 && o.leak > 0);
      o.conn = S.n;
      for (let i = 0; i < o.nodes.length; i++) {
        const c = pushConn(S, -1, o.nodes[i], o.type, o.x, o.y, o.z, f * o.size / o.nodes.length, p.CdStair, K_STAIR, j, en);
        S.dim[c] = o.type === 3 ? f * o.dim / o.nodes.length : o.dim;
      }
    }
    sim.conn = S;
  }

  // ------------------------------------------------------------ the step
  function poseFrame(sim, zO, th, ph, F) {
    const cth = fcos(th), sth = fsin(th), cph = fcos(ph), sph = fsin(ph);
    F.R00 = cth; F.R01 = sth * sph; F.R02 = sth * cph;
    F.R10 = 0; F.R11 = cph; F.R12 = -sph;
    F.R20 = -sth; F.R21 = cth * sph; F.R22 = cth * cph;
    const g = sim.g0;
    F.tx = sim.XO - (F.R00 * g[0] + F.R01 * g[1] + F.R02 * g[2]);
    F.ty = sim.YO - (F.R10 * g[0] + F.R11 * g[1] + F.R12 * g[2]);
    F.tz = zO - (F.R20 * g[0] + F.R21 * g[1] + F.R22 * g[2]);
    F.cth = cth;
    return F;
  }

  // Buoyancy of the hull envelope below the world plane Z = 0.
  function hydroPass(sim, F, out) {
    const c = sim.ship.cols, N = c.N;
    const iR = 1 / F.R22;
    let V = 0, Mx = 0, My = 0, Mz = 0, top = -1e9;
    for (let i = 0; i < N; i++) {
      const x = c.x[i], y = c.y[i], lo = c.zlo[i], hi = c.zhi[i];
      const base = F.R20 * x + F.R21 * y + F.tz;
      const wt = base + F.R22 * hi; if (wt > top) top = wt;
      const zp = -base * iR;
      if (zp <= lo) continue;
      const s = zp >= hi ? hi - lo : zp - lo;
      const v = c.dxdy[i] * s;
      V += v; Mx += v * x; My += v * y; Mz += v * (lo + 0.5 * s);
    }
    out.V = V; out.x = V > 0 ? Mx / V : 0; out.y = V > 0 ? My / V : 0; out.z = V > 0 ? Mz / V : 0; out.top = top;
    return out;
  }

  // Volume below world level h inside node n; fills scratch with moments.
  function nodePass(sim, F, n, h, sc) {
    const ship = sim.ship, c = ship.cols;
    const s0 = ship.nodeStart[n], s1 = s0 + ship.nodeCount[n];
    const iR = 1 / F.R22;
    let vol = 0, dv = 0, mx = 0, my = 0, mz = 0, zmin = 1e9, zmax = -1e9;
    for (let j = s0; j < s1; j++) {
      const i = ship.entCol[j];
      const x = c.x[i], y = c.y[i], a = ship.entA[j], b = ship.entE[j];
      const base = F.R20 * x + F.R21 * y + F.tz;
      const wa = base + F.R22 * a, wb = base + F.R22 * b;
      if (wa < zmin) zmin = wa; if (wb > zmax) zmax = wb;
      const zp = (h - base) * iR;
      if (zp <= a) continue;
      const A = c.dxdy[i];
      let L;
      if (zp >= b) L = b - a; else { L = zp - a; dv += A; }
      const v = A * L;
      vol += v; mx += v * x; my += v * y; mz += v * (a + 0.5 * L);
    }
    const mu = ship.nodeMu[n];
    sc.vol = vol * mu; sc.dv = dv * mu * iR; sc.mx = mx * mu; sc.my = my * mu; sc.mz = mz * mu;
    sc.zmin = zmin; sc.zmax = zmax;
    return sc;
  }

  // Free-surface level of one node for the current pose (Newton, safeguarded).
  function solveOne(sim, F, n, full) {
    const ship = sim.ship, sc = sim._sc;
    const V = sim.vol[n], Vmax = ship.nodeVmax[n];
    let h = sim.level[n];
    nodePass(sim, F, n, h, sc);
    const lo = sc.zmin, hi = sc.zmax;
    sim.zmin[n] = lo; sim.zmax[n] = hi;
    if (V <= 1e-6) { sim.level[n] = lo; sim.area[n] = 0; return; }
    if (V >= Vmax * (1 - 1e-7)) {
      nodePass(sim, F, n, hi, sc);
      sim.level[n] = hi + Math.max(0, V - Vmax) / ship.nodeAov[n]; sim.area[n] = ship.nodeAov[n];
      if (sc.vol > 1e-9) { sim.cx[n] = sc.mx / sc.vol; sim.cy[n] = sc.my / sc.vol; sim.cz[n] = sc.mz / sc.vol; }
      return;
    }
    if (h < lo || h > hi) { h = Math.min(hi, Math.max(lo, h)); nodePass(sim, F, n, h, sc); }
    const tol = full ? 1e-6 * Vmax + 1e-3 : Math.max(1e-3 * ship.nodeVtol[n], 0.5);
    let a = lo, b = hi;
    for (let it = 0; it < (full ? 40 : 6); it++) {
      const err = sc.vol - V;
      if (Math.abs(err) < tol) break;
      if (err > 0) b = h; else a = h;
      let hn = sc.dv > 1e-9 ? h - err / sc.dv : 0.5 * (a + b);
      if (!(hn > a && hn < b)) hn = 0.5 * (a + b);
      h = hn; nodePass(sim, F, n, h, sc);
    }
    sim.level[n] = h; sim.area[n] = sc.dv;
    if (sc.vol > 1e-9) { sim.cx[n] = sc.mx / sc.vol; sim.cy[n] = sc.my / sc.vol; sim.cz[n] = sc.mz / sc.vol; }
  }

  // Port and starboard halves of an open space share one free surface.
  function solvePair(sim, F, nP, nS, full) {
    const ship = sim.ship, A = sim._sc, B = sim._sc2;
    const V = sim.vol[nP] + sim.vol[nS];
    const VmP = ship.nodeVmax[nP], VmS = ship.nodeVmax[nS], Vmax = VmP + VmS;
    let h = sim.vol[nP] > 0 && sim.vol[nS] > 0 ? 0.5 * (sim.level[nP] + sim.level[nS]) : (sim.vol[nP] > 0 ? sim.level[nP] : sim.level[nS]);
    nodePass(sim, F, nP, h, A); nodePass(sim, F, nS, h, B);
    sim.zmin[nP] = A.zmin; sim.zmax[nP] = A.zmax; sim.zmin[nS] = B.zmin; sim.zmax[nS] = B.zmax;
    const lo = Math.min(A.zmin, B.zmin), hi = Math.max(A.zmax, B.zmax);
    if (V <= 1e-6) {
      // a trace of water (a millionth of a cubic metre or less): no surface and no head (hEff). With params.keepTrace (D89,
      // on) and the conserving step (params.conserve, C3) it is KEPT. Zeroing it lost the water (e114: the bunker's door
      // trickling into a stokehold the pumps keep dry, up to 1e-6 m3 a step, 2.8e-5 m3 over the bulkheads-to-D case).
      // keepTrace 0, or conserve 0 (the step before C3, as the seams gate runs it), zeroes it as before, to the bit
      if (!(sim.params.conserve && sim.params.keepTrace)) { sim.vol[nP] = 0; sim.vol[nS] = 0; }
      sim.level[nP] = A.zmin; sim.level[nS] = B.zmin; sim.area[nP] = 0; sim.area[nS] = 0; return;
    }
    if (V >= Vmax * (1 - 1e-7)) {
      const over = Math.max(0, V - Vmax), aP = ship.nodeAov[nP], aS = ship.nodeAov[nS];
      const dh = over / (aP + aS);
      sim.vol[nP] = VmP + dh * aP; sim.vol[nS] = V - sim.vol[nP];
      nodePass(sim, F, nP, hi, A); nodePass(sim, F, nS, hi, B);
      sim.level[nP] = hi + dh; sim.level[nS] = hi + dh; sim.area[nP] = aP; sim.area[nS] = aS;
      if (A.vol > 1e-9) { sim.cx[nP] = A.mx / A.vol; sim.cy[nP] = A.my / A.vol; sim.cz[nP] = A.mz / A.vol; }
      if (B.vol > 1e-9) { sim.cx[nS] = B.mx / B.vol; sim.cy[nS] = B.my / B.vol; sim.cz[nS] = B.mz / B.vol; }
      return;
    }
    if (!(h >= lo && h <= hi)) { h = Math.min(hi, Math.max(lo, h)); nodePass(sim, F, nP, h, A); nodePass(sim, F, nS, h, B); }
    const tol = full ? 1e-6 * Vmax + 1e-3 : Math.max(1e-3 * (ship.nodeVtol[nP] + ship.nodeVtol[nS]), 0.5);
    let a = lo, b = hi;
    for (let it = 0; it < (full ? 40 : 6); it++) {
      const err = A.vol + B.vol - V;
      if (Math.abs(err) < tol) break;
      if (err > 0) b = h; else a = h;
      const dv = A.dv + B.dv;
      let hn = dv > 1e-9 ? h - err / dv : 0.5 * (a + b);
      if (!(hn > a && hn < b)) hn = 0.5 * (a + b);
      h = hn; nodePass(sim, F, nP, h, A); nodePass(sim, F, nS, h, B);
    }
    // share the water in proportion to the geometry at this level (mass is conserved exactly)
    const tot = A.vol + B.vol;
    let vP = tot > 0 ? V * A.vol / tot : 0.5 * V;
    if (vP > VmP) vP = VmP; if (V - vP > VmS) vP = V - VmS;
    sim.vol[nP] = vP; sim.vol[nS] = V - vP;
    sim.level[nP] = h; sim.level[nS] = h; sim.area[nP] = A.dv; sim.area[nS] = B.dv;
    if (A.vol > 1e-9) { sim.cx[nP] = A.mx / A.vol; sim.cy[nP] = A.my / A.vol; sim.cz[nP] = A.mz / A.vol; }
    if (B.vol > 1e-9) { sim.cx[nS] = B.mx / B.vol; sim.cy[nS] = B.my / B.vol; sim.cz[nS] = B.mz / B.vol; }
  }

  function solveLevels(sim, F, full) {
    const ship = sim.ship;
    for (let k = 0; k < 16; k++) {
      for (let L = 0; L < 2; L++) {
        const nP = nodeIndex(k, 0, L), nS = nodeIndex(k, 1, L), g = k * 2 + L;
        let merged = sim.mergeAlways[g] === 1;
        if (!merged && L === 0) {
          // tunnel-separated halves join once both stand above the divider
          const zMw = worldZ(F, ship.zones[k].xm, 0, sim.zMerge[k]);
          merged = sim.vol[nP] > 1e-6 && sim.vol[nS] > 1e-6 && sim.level[nP] > zMw + 0.05 && sim.level[nS] > zMw + 0.05;
        }
        sim.merged[g] = merged ? 1 : 0;   // eslint-disable-line
        if (merged) solvePair(sim, F, nP, nS, full);
        else { solveOne(sim, F, nP, full); solveOne(sim, F, nS, full); }
      }
    }
  }

  // Net vertical force and pitch/roll moments for a pose, with node water in place.
  function loads(sim, F, hb, out) {
    const ship = sim.ship;
    const W = RHO * GRAV;
    const Fb = W * hb.V;
    // buoyancy centre in world
    const bxw = F.R00 * hb.x + F.R01 * hb.y + F.R02 * hb.z + F.tx;
    const byw = F.R10 * hb.x + F.R11 * hb.y + F.R12 * hb.z + F.ty;
    let tauX = (byw - sim.YO) * Fb, tauY = -(bxw - sim.XO) * Fb;
    let Fz = Fb - GRAV * sim.ms;
    let mw = 0, Iw_p = 0, Iw_r = 0;
    for (let n = 0; n < NN; n++) {
      // C5 (the epoch, dark): with params.weighOverfill 0 a full space weighs its capacity; the excess is its head's stand-in
      const V = sim.params.weighOverfill ? sim.vol[n] : Math.min(sim.vol[n], ship.nodeVmax[n]); if (V <= 0) continue;
      const x = sim.cx[n], y = sim.cy[n], z = sim.cz[n];
      const wx = F.R00 * x + F.R01 * y + F.R02 * z + F.tx - sim.XO;
      const wy = F.R10 * x + F.R11 * y + F.R12 * z + F.ty - sim.YO;
      const wz = F.R20 * x + F.R21 * y + F.R22 * z + F.tz - sim.zO;
      const f = -W * V;
      tauX += wy * f; tauY -= wx * f; Fz += f;
      const m = RHO * V; mw += m; Iw_p += m * (wx * wx + wz * wz); Iw_r += m * (wy * wy + wz * wz);
    }
    if (sim.pockets) for (const k of sim.pockets) {        // W6: a pocket's water where the pocket stands (pocketPoints)
      if (k.vol <= 0) continue;
      const pts = pocketPoints(sim, F, k);
      for (let i = 0; i < pts.length; i += 4) {
        const V = pts[i], x = pts[i + 1], y = pts[i + 2], z = pts[i + 3];
        const wx = F.R00 * x + F.R01 * y + F.R02 * z + F.tx - sim.XO;
        const wy = F.R10 * x + F.R11 * y + F.R12 * z + F.ty - sim.YO;
        const wz = F.R20 * x + F.R21 * y + F.R22 * z + F.tz - sim.zO;
        const f = -W * V;
        tauX += wy * f; tauY -= wx * f; Fz += f;
        const m = RHO * V; mw += m; Iw_p += m * (wx * wx + wz * wz); Iw_r += m * (wy * wy + wz * wz);
      }
    }
    out.Fz = Fz; out.Mth = tauY; out.Mph = tauX * F.cth; out.mw = mw; out.Iw_p = Iw_p; out.Iw_r = Iw_r;
    out.bxw = bxw; out.byw = byw;
    return out;
  }

  function step(sim) {
    const ship = sim.ship, p = sim.params, dt = p.dt, S = sim.conn;
    const F = poseFrame(sim, sim.zO, sim.pitch, sim.roll, sim._F);
    const hb = hydroPass(sim, F, sim._hb);
    solveLevels(sim, F, false);

    // effective levels: a full lower space is pressed up by the water above it
    const hEff = sim._hEff, Aeff = sim._Aeff;
    for (let n = 0; n < NN; n++) {
      hEff[n] = sim.vol[n] > 1e-6 ? sim.level[n] : -1e9;   // an empty space exerts no head
      Aeff[n] = sim.vol[n] >= ship.nodeVmax[n] ? ship.nodeAov[n] : Math.max(sim.area[n], ship.nodeAmin[n]);
    }
    const NP = sim.pockets ? sim.pockets.length : 0;    // W6: the pockets, spaces NN + j in the flow arrays
    for (let j = 0; j < NP; j++) pocketHead(sim, F, j, hEff, Aeff);
    const acc = sim._acc; acc.fill(0);
    // C3: each connection's move this step, and what each space gives (the cut below reads them)
    if (!sim._dV || sim._dV.length < S.q.length) sim._dV = new Float64Array(S.q.length);   // sized to the store
    if (!sim._out) sim._out = new Float64Array(NN);       // a sim restored from an older snapshot
    const D = sim._dV, out = sim._out; out.fill(0);
    // how many openings act on each space this step (shares the stability limit between them)
    const deg = sim._deg; deg.fill(0);
    for (let c = 0; c < S.n; c++) {
      if (!S.en[c]) continue;
      const a = S.a[c], b = S.pk[c] >= 0 ? NN + S.pk[c] : S.b[c];   // W6: an opening into a pocket fills the pocket
      if (a >= 0 && hEff[a] < -1e8 && hEff[b] < -1e8) continue;
      if (a >= 0) deg[a]++; deg[b]++;
    }
    for (let j = 0; j < NP; j++) { const k = sim.pockets[j]; if (k.state === 0 && k.vol > 1e-6) { deg[NN + j]++; deg[k.node]++; } }
    let seaIn = 0;
    for (let c = 0; c < S.n; c++) {
      D[c] = 0;
      if (!S.en[c] || S.tOn[c] > sim.t) { S.q[c] = 0; continue; }
      const kd = S.kind[c];
      if ((kd === K_XLOW || kd === K_XMERGE) && sim.merged[S.idx[c] * 2] === 1) { S.q[c] = 0; continue; }
      const a = S.a[c], b = S.pk[c] >= 0 ? NN + S.pk[c] : S.b[c];
      const zo = F.R20 * S.x[c] + F.R21 * S.y[c] + F.R22 * S.z[c] + F.tz;
      const ha = a < 0 ? S.hx[c] : hEff[a], hbv = hEff[b];
      const Ha = ha > zo ? ha - zo : 0, Hb = hbv > zo ? hbv - zo : 0;
      let q = 0;
      if (S.type[c] === 0) {
        const d = Ha - Hb;
        if (d !== 0) q = S.coef[c] * S.area[c] * SQ2G * d / Math.sqrt(Math.max(Math.abs(d), 0.01)) * S.cm[c];
      } else if (S.type[c] === 1) {
        const H1 = Ha > Hb ? Ha : Hb;
        if (H1 > 0) {
          const H2 = Ha > Hb ? Hb : Ha;
          let f = 1;
          if (H2 > 0) { const r = H2 / H1; f = fpow(Math.max(0, 1 - fpow(r, 1.5)), 0.385); }
          q = S.coef[c] * S.area[c] * (2 / 3) * SQ2G * H1 * Math.sqrt(H1) * f * (Ha >= Hb ? 1 : -1);
        }
      } else if (S.type[c] === 2) {             // S1: an upright opening, width `area`, height `dim` (lawUpright)
        const H1 = Ha > Hb ? Ha : Hb;
        if (H1 > 0) q = S.coef[c] * S.area[c] * SQ2G * lawUpright(H1, Ha > Hb ? Hb : Ha, S.dim[c]) * (Ha >= Hb ? 1 : -1);
      } else {                                  // S1: a level opening, area `area`, rim `dim` (lawLevel)
        const H1 = Ha > Hb ? Ha : Hb;
        if (H1 > 0) q = S.coef[c] * SQ2G * lawLevel(H1, Ha > Hb ? Hb : Ha, S.area[c], S.dim[c]) * (Ha >= Hb ? 1 : -1);
      }
      if (q === 0) { S.q[c] = 0; continue; }
      let dV = q * dt;
      // stability limit: never move more than a share of what would level the two sides: half at dt 0.25, held per
      // second by params.levelRate (A-1)
      const src = dV > 0 ? a : b, dst = dV > 0 ? b : a;
      const hs = src < 0 ? S.hx[c] : hEff[src];
      const hd = dst < 0 ? S.hx[c] : hEff[dst];
      const inv = (src < 0 ? 0 : 1 / Aeff[src]) + (dst < 0 ? 0 : 1 / Aeff[dst]);
      const share = Math.min(0.5, p.levelRate * dt) / Math.max(1, src < 0 ? deg[dst] : (dst < 0 ? deg[src] : Math.max(deg[src], deg[dst])));
      let lim = inv > 0 ? share * (hs - Math.max(hd, zo)) / inv : Math.abs(dV);
      if (lim < 0) lim = 0;
      if (Math.abs(dV) > lim) dV = dV > 0 ? lim : -lim;
      S.q[c] = dV / dt;
      if (a >= 0) acc[a] -= dV; else seaIn += dV;
      acc[b] += dV;
      D[c] = dV;
      if (src >= 0) out[src] += dV > 0 ? dV : -dV;
    }
    // W6: each holding pocket's door, an orifice to its space, as a connection of type 0 with its stability limit
    for (let j = 0; j < NP; j++) {
      const k = sim.pockets[j]; k.dV = 0;
      if (k.state !== 0 || !(k.vol > 1e-6)) continue;
      const P = NN + j, n = k.node, zo = worldZ(F, k.xd, k.yd, k.zd);
      const Ha = hEff[P] > zo ? hEff[P] - zo : 0, Hb = hEff[n] > zo ? hEff[n] - zo : 0, d = Ha - Hb;
      if (d === 0) continue;
      let dV = p.CdDoor * (k.leak !== undefined ? k.leak : p.bunkerLeak) * SQ2G * d / Math.sqrt(Math.max(Math.abs(d), 0.01)) * dt;
      const src = dV > 0 ? P : n, dst = dV > 0 ? n : P;
      const share = Math.min(0.5, p.levelRate * dt) / Math.max(1, Math.max(deg[src], deg[dst]));
      let lim = share * (hEff[src] - Math.max(hEff[dst], zo)) / (1 / Aeff[src] + 1 / Aeff[dst]);
      if (lim < 0) lim = 0;
      if (Math.abs(dV) > lim) dV = dV > 0 ? lim : -lim;
      k.dV = dV; acc[P] -= dV; acc[n] += dV; out[src] += dV > 0 ? dV : -dV;
    }
    // C3: a space asked for more than it holds gives what it holds, every outflow cut in proportion; the sums are then
    // made again from the cut moves (only when some space is cut, so a step that cuts nothing keeps its bits)
    if (p.conserve) {
      let cut = false;
      for (let n = 0; n < NN; n++) { if (out[n] > sim.vol[n]) { out[n] = sim.vol[n] / out[n]; cut = true; } else out[n] = 1; }
      for (let j = 0; j < NP; j++) { const n = NN + j, v = sim.pockets[j].vol; if (out[n] > v) { out[n] = v / out[n]; cut = true; } else out[n] = 1; }
      if (cut) {
        acc.fill(0); seaIn = 0;
        for (let c = 0; c < S.n; c++) {
          let dV = D[c]; if (dV === 0) continue;
          const a = S.a[c], b = S.pk[c] >= 0 ? NN + S.pk[c] : S.b[c], src = dV > 0 ? a : b;
          if (src >= 0 && out[src] < 1) { dV *= out[src]; S.q[c] = dV / dt; }
          if (a >= 0) acc[a] -= dV; else seaIn += dV;
          acc[b] += dV;
        }
        for (let j = 0; j < NP; j++) {
          const k = sim.pockets[j]; let dV = k.dV; if (dV === 0) continue;
          const src = dV > 0 ? NN + j : k.node;
          if (out[src] < 1) { dV *= out[src]; k.dV = dV; }
          acc[NN + j] -= dV; acc[k.node] += dV;
        }
      }
    }
    for (let n = 0; n < NN; n++) {
      let v = sim.vol[n] + acc[n];
      if (v < 0) v = 0;
      // no space can be pressed above the sea surface: every drop came from the sea
      const vm = ship.nodeVmax[n];
      if (v > vm) {
        const head = Math.max(0, -sim.zmax[n]);
        const cap = vm + ship.nodeAov[n] * head;
        if (v > cap) { seaIn -= v - cap; v = cap; }
      }
      sim.vol[n] = v;
    }
    for (let j = 0; j < NP; j++) {                         // W6: the pockets' water, pressed up no higher than the sea
      const k = sim.pockets[j];
      let v = k.vol + acc[NN + j];
      if (v < 0) v = 0;
      if (v > k.cap) { const capP = k.cap + k.aov * Math.max(0, -worldZ(F, k.xc, k.yc, k.z1)); if (v > capP) { seaIn -= v - capP; v = capP; } }
      k.vol = v; k.q = k.dV / dt;
    }
    sim.inflow = seaIn / dt;  // m3/s entering the hull (all openings)
    if (sim.pumpSched.length) pumpStep(sim, dt);

    // rigid body: heave, pitch, roll
    const L = loads(sim, F, hb, sim._ld);
    const mh = sim.mh0 + L.mw;
    const Ith = sim.Ith0 + L.Iw_p, Iph = sim.Iph0 + L.Iw_r;
    // xFz, xMth, xMph: loads from the ship's motion (seam S3; N and N m, signs as heave, pitch and roll), default 0
    const az = (L.Fz + sim.xFz - sim.cDz * sim.vz - sim.qz * Math.abs(sim.vz) * sim.vz) / mh;
    const ath = (L.Mth + sim.xMth - sim.cDth * sim.wth - sim.qth * Math.abs(sim.wth) * sim.wth) / Ith;
    const aph = (L.Mph + sim.xMph - sim.cDph * sim.wph - sim.qph * Math.abs(sim.wph) * sim.wph) / Iph;
    sim.vz += az * dt; sim.wth += ath * dt; sim.wph += aph * dt;
    sim.zO += sim.vz * dt; sim.pitch += sim.wth * dt; sim.roll += sim.wph * dt;
    if (sim.pitch > 1.35) { sim.pitch = 1.35; sim.wth = 0; }
    if (sim.pitch < -1.35) { sim.pitch = -1.35; sim.wth = 0; }
    if (sim.roll > 1.4) { sim.roll = 1.4; sim.wph = 0; }       // on her beam ends: stop there
    if (sim.roll < -1.4) { sim.roll = -1.4; sim.wph = 0; }
    sim.t += dt;
    sim.Vb = hb.V; sim.hullTop = hb.top; sim.mw = L.mw;
    trackEvents(sim, F);
    doorsStep(sim);
    if (sim.stairOps.length) stairsStep(sim, F);
    if (NP) pocketsStep(sim, F);
  }

  // ------------------------------------------------------------- events
  const MARKS = [
    // id, label, ship-frame point, condition ('under' when below the sea, 'clear' when above)
    { id: 'ports', label: 'Second row of ports under the forecastle submerges', p: () => [118, 9, deckZ('C', 118) - 1.0], when: 'under', obs: 100 },
    { id: 'well', label: 'Forward well deck awash', p: () => [84, 0, deckZ('C', 84)], when: 'under', obs: 130 },
    { id: 'fcastle', label: 'Forecastle head goes under', p: () => [126, 0, zTopAt(126)], when: 'under', obs: 145 },
    { id: 'bridge', label: 'Water reaches the bridge', p: () => [72, 0, deckZ('Boat', 72)], when: 'under', obs: 155 },
    { id: 'props', label: 'Centre propeller breaks the surface', p: () => [-127, 0, 6.5], when: 'clear', obs: null },
  ];

  function trackEvents(sim, F) {
    const S = sim.conn;
    // overflow over bulkhead tops
    const over = sim._over; over.fill(0);
    for (let c = 0; c < S.n; c++) if (S.kind[c] === K_OVER && S.q[c] > 0) over[S.idx[c]] += S.q[c];
    for (let b = 0; b < BULKHEADS.length; b++) {
      sim.overflow[b] = over[b];
      if (over[b] > 0.05 && sim.overT[b] < 0) {
        sim.overT[b] = sim.t;
        sim.events.push({ t: sim.t, id: 'over' + BULKHEADS[b].id, label: `Water flows over bulkhead ${BULKHEADS[b].id} at ${sim.bulkTop[b]} deck` });
      }
    }
    for (const m of MARKS) {
      if (sim.markT[m.id] >= 0) continue;
      const q = m.p();
      const wz = F.R20 * q[0] + F.R21 * q[1] + F.R22 * q[2] + F.tz;
      if ((m.when === 'under' && wz < 0) || (m.when === 'clear' && wz > 0)) {
        sim.markT[m.id] = sim.t; sim.events.push({ t: sim.t, id: m.id, label: m.label });
      }
    }
    if (!sim.foundered && (sim.hullTop < -0.5 || Math.abs(sim.pitch) > 1.2 || (sim.Vb < 1 && sim.t > 10))) {
      sim.foundered = true; sim.founderT = sim.t;
      sim.events.push({ t: sim.t, id: 'founder', label: 'Foundered' });
    }
  }

  // --------------------------------------------------------------- setup
  function equilibrate(sim) {
    // Newton on (heave, pitch, roll) with the current water in place.
    const F = sim._F, hb = sim._hb, L = sim._ld;
    const evalF = (z, th, ph) => {
      const Fr = poseFrame(sim, z, th, ph, F);
      sim.zO = z; // loads() measures arms from zO
      hydroPass(sim, Fr, hb); solveLevels(sim, Fr, true); loads(sim, Fr, hb, L);
      return [L.Fz / 5e7, L.Mth / 2e11, L.Mph / 4e8];
    };
    let x = [sim.zO, sim.pitch, sim.roll];
    const dx = [0.01, 1e-4, 1e-3];
    for (let it = 0; it < 30; it++) {
      const f0 = evalF(x[0], x[1], x[2]);
      if (Math.abs(f0[0]) + Math.abs(f0[1]) + Math.abs(f0[2]) < 1e-7) break;
      const J = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      for (let j = 0; j < 3; j++) {
        const xp = x.slice(); xp[j] += dx[j];
        const fp = evalF(xp[0], xp[1], xp[2]);
        for (let i = 0; i < 3; i++) J[i][j] = (fp[i] - f0[i]) / dx[j];
      }
      const d = solve3(J, f0.map(v => -v));
      const lim = [0.5, 0.02, 0.05];
      for (let j = 0; j < 3; j++) x[j] += Math.max(-lim[j], Math.min(lim[j], d[j]));
    }
    evalF(x[0], x[1], x[2]);
    sim.zO = x[0]; sim.pitch = x[1]; sim.roll = x[2];
  }
  function solve3(A, b) {
    const M = A.map((r, i) => r.concat([b[i]]));
    for (let c = 0; c < 3; c++) {
      let piv = c; for (let r = c + 1; r < 3; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
      [M[c], M[piv]] = [M[piv], M[c]];
      const d = M[c][c] || 1e-12;
      for (let r = 0; r < 3; r++) if (r !== c) { const f = M[r][c] / d; for (let k = c; k < 4; k++) M[r][k] -= f * M[c][k]; }
    }
    return [M[0][3] / (M[0][0] || 1e-12), M[1][3] / (M[1][1] || 1e-12), M[2][3] / (M[2][2] || 1e-12)];
  }

  function createSim(ship, params, scen) {
    scen = scen || {};
    const p = Object.assign({}, DEFAULT_PARAMS, params || {});
    const sim = {
      ship, params: p, t: 0,
      vol: new Float64Array(NN), level: new Float64Array(NN), area: new Float64Array(NN),
      cx: new Float64Array(NN), cy: new Float64Array(NN), cz: new Float64Array(NN),
      zmin: new Float64Array(NN), zmax: new Float64Array(NN),
      _hEff: new Float64Array(NN), _Aeff: new Float64Array(NN), _acc: new Float64Array(NN),
      _out: new Float64Array(NN), _dV: null,              // C3's scratch: what each space gives; each connection's move
      _F: {}, _hb: {}, _ld: {}, _sc: {}, _sc2: {}, _over: new Float64Array(BULKHEADS.length),
      merged: new Uint8Array(32), mergeAlways: new Uint8Array(32).fill(1), zMerge: new Float64Array(16), _deg: new Int32Array(NN),
      doorOpen: new Uint8Array(BULKHEADS.length),
      doorFloat: new Uint8Array(BULKHEADS.length), doorFall: new Float64Array(BULKHEADS.length).fill(-1), doorN: new Int32Array(BULKHEADS.length),
      bulkTop: BULKHEADS.map(b => b.top),
      overflow: new Float64Array(BULKHEADS.length), overT: new Float64Array(BULKHEADS.length).fill(-1),
      markT: {}, events: [], openings: [], nextId: 1,
      foundered: false, founderT: -1, inflow: 0,
      vz: 0, wth: 0, wph: 0, xFz: 0, xMth: 0, xMph: 0,
      // Y3: the pumps. pumpSched: { zone it draws from, room it stands in, q m3/s, t0 s, off, tOff, label } (from the
      // scenario, or added by the plant's engineers on a watch); pumpScale: the share of their rate the steam allows (the
      // plant sets it; 1 without the plant); pump: m3/s drawn from each zone in the last step; pumped: m3 put overboard
      pump: new Float64Array(16), pumpSched: [], pumpScripted: false, pumpScale: 1, pumped: 0, pumpOut: 0,
      // S1: the grand staircases' openings to the weather (none with params.stairs 0), and each one's state: 0 dry,
      // 1 the sea at it and holding (leaking), 2 given way; stairT: when it gave way, s (-1 before)
      stairOps: weatherOpenings(p, ship), stairSt: null, stairT: null,
    };
    // C3's fix to C4: the openings in her side (params.sideOpenings) are the Titanic's, shut on the night. A scenario
    // that brings a ship's own open ports (kind 'porthole': Britannic's) keeps those alone: E deck's sidelights would
    // be counted twice with them. Such a sim has sideOpenings 0, and the openings it has with 0.
    if (p.sideOpenings && scen.openings && scen.openings.some(o => o.kind === 'porthole')) { p.sideOpenings = 0; sim.stairOps = weatherOpenings(p, ship); }
    sim.stairSt = new Uint8Array(sim.stairOps.length); sim.stairT = new Float64Array(sim.stairOps.length).fill(-1);
    if (scen.pumps) { for (const e of scen.pumps) addPump(sim, e); sim.pumpScripted = true; }
    for (const m of MARKS) sim.markT[m.id] = -1;
    // holds 2 and 3: the firemen's tunnel splits the lower hold into port and starboard
    for (const k of [2, 3]) { sim.mergeAlways[k * 2] = 0; sim.zMerge[k] = p.zMergeHold; }
    if (p.upperSplit) for (let k = 0; k < 16; k++) sim.mergeAlways[k * 2 + 1] = 0;
    if (scen.bulkTop) for (const k in scen.bulkTop) { const b = BULKHEADS.findIndex(x => x.id === k); if (b >= 0) sim.bulkTop[b] = scen.bulkTop[k]; }
    if (scen.doorsOpen) for (const id of scen.doorsOpen) { const b = BULKHEADS.findIndex(x => x.id === id); if (b >= 0) sim.doorOpen[b] = 1; }
    if (scen.coalListDeg !== undefined) p.coalListDeg = scen.coalListDeg;
    // W6: the bunker of the fire, empty where the coal list says its coal was taken out; the flow arrays then have a
    // place for it after the 64 spaces (without it they are as before)
    sim.pockets = p.bunker && p.coalListDeg > 0 ? [bunkerPocket(ship, p)] : [];
    if (ship.peakTank) sim.pockets.push(peakPocket(ship, p));    // G7: a ship built with the tank has it as a pocket
    if (sim.pockets.length) {
      const M = NN + sim.pockets.length;
      sim._hEff = new Float64Array(M); sim._Aeff = new Float64Array(M); sim._acc = new Float64Array(M);
      sim._out = new Float64Array(M); sim._deg = new Int32Array(M);
    }

    // mass properties from the night's drafts (Wilding): 30'9" fwd, 33'9" aft
    const th0 = FM.asin((p.draftF - p.draftA) / G.LBP);
    const tz0 = -0.5 * (p.draftF + p.draftA);
    sim.g0 = [0, 0, 0]; sim.XO = 0; sim.YO = 0;
    const F0 = { };
    {
      const c = fcos(th0), s = fsin(th0);
      Object.assign(F0, { R00: c, R01: 0, R02: s, R10: 0, R11: 1, R12: 0, R20: -s, R21: 0, R22: c, tx: 0, ty: 0, tz: tz0, cth: c });
    }
    const hb0 = hydroPass(sim, F0, {});
    sim.ms = RHO * hb0.V;
    const KM = ship.hyd.KB + ship.hyd.BM;
    const KG = KM - p.GM0;
    const xBw = F0.R00 * hb0.x + F0.R02 * hb0.z;          // world X of buoyancy centre
    const xG = (xBw - fsin(th0) * KG) / fcos(th0);
    const yG = p.GM0 * FM.tan(p.coalListDeg * Math.PI / 180);  // + = port
    sim.g0 = [xG, yG, KG];
    sim.XO = fcos(th0) * xG + fsin(th0) * KG;
    sim.YO = 0;
    sim.zO = -fsin(th0) * xG + fcos(th0) * KG + tz0;
    sim.pitch = th0; sim.roll = 0;
    sim.KG = KG;

    // inertia and damping
    const B = G.B, Lp = G.LBP;
    sim.mh0 = sim.ms * (1 + p.addedHeave);
    // A-12 (the epoch, stage A2): squares as products, not `**`, which V8 may compute through its pow (B1 moves pow)
    const kP = p.kPitch * Lp, kR = p.kRoll * B;
    sim.Ith0 = sim.ms * (kP * kP) * (1 + p.addedPitch);
    sim.Iph0 = sim.ms * (kR * kR) * (1 + p.addedRoll);
    const Kz = RHO * GRAV * ship.hyd.Awp;
    const Kth = RHO * GRAV * ship.hyd.V * ship.hyd.BML;
    const Kph = RHO * GRAV * ship.hyd.V * p.GM0;
    sim.cDz = 2 * p.zetaHeave * Math.sqrt(Kz * sim.mh0);
    sim.cDth = 2 * p.zetaPitch * Math.sqrt(Kth * sim.Ith0);
    sim.cDph = 2 * p.zetaRoll * Math.sqrt(Kph * sim.Iph0);
    sim.qz = 0.5 * RHO * 1.0 * Lp * B * 0.8;
    sim.qth = 0.25 * RHO * 1.0 * B * fpow(Lp / 2, 4);
    sim.qph = 0.25 * RHO * 1.0 * Lp * fpow(B / 2, 4);

    rebuildConnections(sim);
    equilibrate(sim);
    sim.pose0 = { zO: sim.zO, pitch: sim.pitch, roll: sim.roll };
    if (scen.openings) for (const o of scen.openings) addOpening(sim, o);
    return sim;
  }

  // ------------------------------------------------------- user actions
  function zoneAt(x) {
    const bx = zoneBounds();
    for (let k = 0; k < 16; k++) if (x <= bx[k] && x > bx[k + 1]) return k;
    return x > bx[0] ? 0 : 15;
  }
  // Hull opening in ship coordinates. kind: 'breach' (below the waterline) or 'porthole'.
  function addOpening(sim, o) {
    const k = zoneAt(o.x);
    const side = o.y >= 0 ? 0 : 1;
    const layer = o.z < deckZ('E', o.x) ? 0 : 1;
    const rec = {
      id: sim.nextId++, kind: o.kind || 'breach', x: o.x, y: o.y, z: o.z, area: o.area, tOpen: o.tOpen || 0,
      zone: k, side, layer, node: nodeIndex(k, side, layer), active: true, conn: -1, label: o.label || '',
    };
    sim.openings.push(rec);
    rebuildConnections(sim);
    return rec;
  }
  function removeOpening(sim, id) {
    const i = sim.openings.findIndex(o => o.id === id);
    if (i >= 0) { sim.openings.splice(i, 1); rebuildConnections(sim); }
  }
  function setOpeningArea(sim, id, area) {
    const o = sim.openings.find(o => o.id === id);
    if (o) { o.area = area; if (o.conn >= 0) sim.conn.area[o.conn] = area; }
  }
  function setDoor(sim, b, open) {
    sim.doorOpen[b] = open ? 1 : 0;
    sim.doorFall[b] = -1;                           // opened or shut outright: no fall under way
    const S = sim.conn;
    for (let c = 0; c < S.n; c++) if (S.kind[c] === K_DOOR && S.idx[c] === b) S.en[c] = open ? 1 : 0;
  }
  // Y2: release the doors in bulkhead b (from the bridge, by their float, by hand at the lever): they fall shut over
  // params.doorFall seconds (doorsStep). Returns false if they are shut or already falling.
  function releaseDoor(sim, b, how) {
    if (!sim.doorOpen[b] || sim.doorFall[b] >= 0) return false;
    sim.doorFall[b] = sim.params.doorFall; sim.doorN[b]++;
    sim.events.push({ t: sim.t, id: 'door' + BULKHEADS[b].id + ':' + sim.doorN[b], label: `Watertight doors in bulkhead ${BULKHEADS[b].id} released ${how || 'by hand'}: they fall shut` });
    return true;
  }
  // each step: the falls under way, and the armed floats (neutral while every door is shut)
  function doorsStep(sim) {
    const p = sim.params;
    for (let b = 0; b < BULKHEADS.length; b++) {
      if (!sim.doorOpen[b]) continue;
      if (sim.doorFall[b] >= 0) {
        sim.doorFall[b] -= p.dt;
        if (sim.doorFall[b] <= 0) { setDoor(sim, b, false); sim.events.push({ t: sim.t, id: 'shut' + BULKHEADS[b].id + ':' + sim.doorN[b], label: `Watertight doors in bulkhead ${BULKHEADS[b].id} shut` }); }
        continue;
      }
      if (!sim.doorFloat[b]) continue;
      let wet = false;
      for (let k = b; k <= b + 1 && !wet; k++) for (let sd = 0; sd < 2; sd++) {
        const n = nodeIndex(k, sd, 0);
        if (sim.vol[n] > 1e-6 && sim.level[n] - sim.zmin[n] > p.floatDepth) { wet = true; break; }
      }
      if (wet) releaseDoor(sim, b, 'by their float');
    }
  }
  function setBulkheadTop(sim, b, deck) { sim.bulkTop[b] = deck; rebuildConnections(sim); }

  // S1, each step after the flows: the sea at each opening to the weather that still holds. It is wet (state 1) from
  // the step the sea stands over its sill, and leaks from then on; it gives way (state 2), for good, on the step the
  // head on it reaches its strength: the sea's head at a door's sill, at the middle of a pane, on a dome's cover, less
  // the head of any water standing behind it there. Until the sea reaches the first of them nothing here changes
  // anything.
  function stairsStep(sim, F) {
    const ops = sim.stairOps, S = sim.conn;
    for (let j = 0; j < ops.length; j++) {
      if (sim.stairSt[j] === 2) continue;
      const o = ops[j], c0 = o.conn, n = o.nodes.length;
      const base = F.R20 * o.x + F.R21 * o.y + F.tz;
      let go = false;
      if (sim.stairSt[j] === 0 && S.hx[c0] - (base + F.R22 * o.z) > 0) {
        sim.stairSt[j] = 1;
        if (o.leak > 0) for (let i = 0; i < n; i++) S.en[c0 + i] = 1;
      }
      if (sim.stairSt[j] === 1) {
        const zm = base + F.R22 * o.zc, out = S.hx[c0] - zm;
        if (out > 0) {
          let back = 0;
          for (let i = 0; i < n; i++) { const nd = o.nodes[i]; if (sim.vol[nd] > 1e-6 && sim.level[nd] - zm > back) back = sim.level[nd] - zm; }
          go = out - back >= o.hc;
        }
      }
      // A dome goes from below as well, wet or dry (params.hAir): once the sea stands hAir over the lintel of every
      // door of its staircase that has given way (one at least), the air shut in under the dome lifts its cover's
      // panes off their beds. It is then open, and takes the sea when the sea reaches it. Its doors come before it in
      // the list, so the same step sees them.
      if (!go && o.type === 3 && sim.params.hAir >= 0) {
        let any = false, all = true;
        for (let i = 0; i < o.doors.length && all; i++) {
          const d = ops[o.doors[i]];
          if (sim.stairSt[o.doors[i]] !== 2) continue;
          any = true;
          if (!(S.hx[d.conn] - (F.R20 * d.x + F.R21 * d.y + F.R22 * (d.z + d.dim) + F.tz) >= sim.params.hAir)) all = false;
        }
        go = any && all;
      }
      if (!go) continue;
      sim.stairSt[j] = 2; sim.stairT[j] = sim.t;
      for (let i = 0; i < n; i++) { S.en[c0 + i] = 1; S.area[c0 + i] = o.size / n; if (o.type === 3) S.dim[c0 + i] = o.dim / n; }
      // a staircase's opening says so; of a deck's windows only the first to go
      if (o.label) sim.events.push({ t: sim.t, id: o.id, label: o.label });
      else if (o.first && !sim.events.some(e => e.id === o.first)) sim.events.push({ t: sim.t, id: o.first, label: o.firstLabel });
    }
  }
  // what the viewer and the tests read of them: each opening's id, its staircase, its state and when it gave way
  function stairState(sim) {
    return sim.stairOps.map((o, j) => ({ id: o.id, stair: o.stair, dome: o.type === 3, state: sim.stairSt[j], t: sim.stairT[j], q: stairFlow(sim, j) }));
  }
  function stairFlow(sim, j) { const o = sim.stairOps[j], S = sim.conn; let q = 0; for (let i = 0; i < o.nodes.length; i++) q += S.q[o.conn + i]; return q; }

  // Y3: a pump put to work: it draws q m3/s from zone `zone` from time t0, standing in zone `room` (its own room unless
  // led through the bilge main from elsewhere). Returns the entry (the plant may switch it off).
  function addPump(sim, e) {
    const r = { zone: e.zone, room: e.room === undefined ? e.zone : e.room, q: e.q, t0: e.t0 || 0, off: false, tOff: -1, label: e.label || '' };
    sim.pumpSched.push(r);
    return r;
  }
  // each step, after the flows: the pumps running draw from the bottom of their zones (see params.pumpStrum, pumpAbandon)
  function pumpStep(sim, dt) {
    const p = sim.params, Q = sim.pump;
    Q.fill(0);
    for (const e of sim.pumpSched) {
      if (e.off || sim.t < e.t0) continue;
      let lost = false;                             // the room it stands in flooded: its crew has gone, and it stops for good
      for (let sd = 0; sd < 2; sd++) { const n = nodeIndex(e.room, sd, 0); if (sim.vol[n] > 1e-6 && sim.level[n] - sim.zmin[n] > p.pumpAbandon) lost = true; }
      if (lost) { e.off = true; e.tOff = sim.t; continue; }
      Q[e.zone] += e.q * sim.pumpScale;
    }
    let out = 0;
    for (let k = 0; k < 16; k++) {
      if (!(Q[k] > 0)) continue;
      const nP = nodeIndex(k, 0, 0), nS = nodeIndex(k, 1, 0);
      const aP = sim.vol[nP] > 1e-6 && sim.level[nP] - sim.zmin[nP] > p.pumpStrum ? sim.vol[nP] : 0;
      const aS = sim.vol[nS] > 1e-6 && sim.level[nS] - sim.zmin[nS] > p.pumpStrum ? sim.vol[nS] : 0;
      const avail = aP + aS; if (!(avail > 0)) continue;
      const dV = Math.min(Q[k] * dt, avail);
      sim.vol[nP] = Math.max(0, sim.vol[nP] - dV * aP / avail); sim.vol[nS] = Math.max(0, sim.vol[nS] - dV * aS / avail);
      out += dV;
    }
    sim.pumped += out; sim.pumpOut = out / dt;
  }

  // ------------------------------------------------------------- readouts
  function frameOf(sim) { return poseFrame(sim, sim.zO, sim.pitch, sim.roll, {}); }
  function worldZ(F, x, y, z) { return F.R20 * x + F.R21 * y + F.R22 * z + F.tz; }
  function readouts(sim) {
    const F = frameOf(sim);
    const draftF = -worldZ(F, G.xFP, 0, 0), draftA = -worldZ(F, G.xAP, 0, 0);
    let water = 0;
    for (let n = 0; n < NN; n++) water += sim.vol[n];
    const zoneFill = new Float64Array(16), zoneVol = new Float64Array(16);
    for (let n = 0; n < NN; n++) { const k = n >> 2; zoneVol[k] += sim.vol[n]; }
    if (sim.pockets) for (const k of sim.pockets) { water += k.vol; zoneVol[k.node >> 2] += k.vol; }   // W6: her water in the pockets too
    for (let k = 0; k < 16; k++) {
      let vm = 0; for (let s = 0; s < 4; s++) vm += sim.ship.nodeVmax[k * 4 + s];
      zoneFill[k] = zoneVol[k] / vm;
    }
    let breachIn = 0, stairIn = 0;
    const S = sim.conn;
    for (let c = 0; c < S.n; c++) { if (S.kind[c] === K_BREACH || S.kind[c] === K_OPEN) breachIn += S.q[c]; else if (S.kind[c] === K_STAIR) stairIn += S.q[c]; }
    return {
      t: sim.t, trimDeg: sim.pitch * 180 / Math.PI, listDeg: sim.roll * 180 / Math.PI,
      draftF, draftA, waterT: water * RHO / 1000, waterM3: water,
      inflowTpm: sim.inflow * RHO / 1000 * 60,
      holeTpm: breachIn * RHO / 1000 * 60,
      stairTpm: stairIn * RHO / 1000 * 60,                                        // S1: down the grand staircases, now
      pumpTpm: sim.pumpOut * RHO / 1000 * 60, pumpedT: sim.pumped * RHO / 1000,   // Y3: the pumps, now and so far
      zoneFill, zoneVol, foundered: sim.foundered,
    };
  }

  // Equivalent GM (m) at the current pose from the roll stiffness, water re-levelled.
  function gmNow(sim) {
    const save = { zO: sim.zO, level: Float64Array.from(sim.level), cx: Float64Array.from(sim.cx), cy: Float64Array.from(sim.cy), cz: Float64Array.from(sim.cz), area: Float64Array.from(sim.area) };
    const d = 0.01, out = [];
    for (const s of [-1, 1]) {
      const F = poseFrame(sim, sim.zO, sim.pitch, sim.roll + s * d, {});
      const hb = hydroPass(sim, F, {}); solveLevels(sim, F, true); const L = loads(sim, F, hb, {});
      out.push(L.Mph);
    }
    sim.level.set(save.level); sim.cx.set(save.cx); sim.cy.set(save.cy); sim.cz.set(save.cz); sim.area.set(save.area);
    let w = sim.ms; for (let n = 0; n < NN; n++) w += RHO * sim.vol[n];
    return -(out[1] - out[0]) / (2 * d) / (w * GRAV);
  }

  // Headless run with a sampled history (used by calibration and the viewer's forecast).
  function run(sim, opts) {
    opts = opts || {};
    const tMax = opts.tMax || 6 * 3600, every = opts.every || 30;
    const hist = [];
    let next = 0, calm = 0;
    while (sim.t < tMax && !sim.foundered) {
      if (sim.t >= next) {
        const r = readouts(sim);
        hist.push({ t: sim.t, trim: r.trimDeg, list: r.listDeg, water: r.waterT, inflow: r.inflowTpm, dF: r.draftF, dA: r.draftA });
        next += every;
      }
      step(sim);
      if (opts.stopWhenStable && sim.t > 1800) {
        calm = (Math.abs(sim.inflow) < 0.02 && Math.abs(sim.wth) < 1e-5 && Math.abs(sim.vz) < 1e-3) ? calm + sim.params.dt : 0;
        if (calm > 1200) break;
      }
      if (opts.onTick && opts.onTick(sim) === false) break;
    }
    const r = readouts(sim);
    hist.push({ t: sim.t, trim: r.trimDeg, list: r.listDeg, water: r.waterT, inflow: r.inflowTpm, dF: r.draftF, dA: r.draftA });
    return { hist, foundered: sim.foundered, founderT: sim.founderT, events: sim.events.slice(), final: r };
  }

  // --------------------------------------------------------- snapshots
  // Plain-data copy of a running simulation (for workers, replays, MCTS rollouts).
  function serialize(sim) {
    return {
      t: sim.t, zO: sim.zO, pitch: sim.pitch, roll: sim.roll, vz: sim.vz, wth: sim.wth, wph: sim.wph,
      vol: Array.from(sim.vol), level: Array.from(sim.level),
      doorOpen: Array.from(sim.doorOpen), bulkTop: sim.bulkTop.slice(),
      doorFloat: Array.from(sim.doorFloat), doorFall: Array.from(sim.doorFall), doorN: Array.from(sim.doorN),
      openings: sim.openings.map(o => ({ x: o.x, y: o.y, z: o.z, area: o.area, kind: o.kind, tOpen: o.tOpen, label: o.label })),
      params: Object.assign({}, sim.params),
      overT: Array.from(sim.overT), markT: Object.assign({}, sim.markT), events: sim.events.slice(),
      foundered: sim.foundered, founderT: sim.founderT,
      pumpSched: sim.pumpSched.map(e => Object.assign({}, e)), pumpScripted: sim.pumpScripted, pumpScale: sim.pumpScale, pumped: sim.pumped,
      stairs: sim.stairOps.map((o, j) => ({ id: o.id, stair: o.stair, dome: o.type === 3, state: sim.stairSt[j], t: sim.stairT[j] })),   // S1
      pockets: (sim.pockets || []).map(k => ({ vol: k.vol, state: k.state, t: k.t })),   // W6
    };
  }
  function restore(ship, d) {
    const bulkTop = {}; BULKHEADS.forEach((b, i) => { bulkTop[b.id] = d.bulkTop[i]; });
    const doorsOpen = BULKHEADS.filter((b, i) => d.doorOpen[i]).map(b => b.id);
    const sim = createSim(ship, d.params, { bulkTop, doorsOpen, coalListDeg: d.params.coalListDeg });
    for (const o of d.openings) addOpening(sim, o);
    sim.t = d.t; sim.zO = d.zO; sim.pitch = d.pitch; sim.roll = d.roll; sim.vz = d.vz; sim.wth = d.wth; sim.wph = d.wph;
    sim.vol.set(d.vol); sim.level.set(d.level);
    if (d.doorFloat) { sim.doorFloat.set(d.doorFloat); sim.doorFall.set(d.doorFall); sim.doorN.set(d.doorN); }
    sim.overT.set(d.overT); Object.assign(sim.markT, d.markT); sim.events = d.events.slice();
    sim.foundered = d.foundered; sim.founderT = d.founderT;
    if (d.pumpSched) { sim.pumpSched = d.pumpSched.map(e => Object.assign({}, e)); sim.pumpScripted = d.pumpScripted; sim.pumpScale = d.pumpScale; sim.pumped = d.pumped; }
    if (d.stairs && d.stairs.length === sim.stairOps.length) {     // S1: each opening's state, and its connections to match
      d.stairs.forEach((s, j) => { sim.stairSt[j] = s.state; sim.stairT[j] = s.t; });
      rebuildConnections(sim);
    }
    if (d.pockets && d.pockets.length === sim.pockets.length) {      // W6: each pocket's water and state, and its openings to match
      d.pockets.forEach((s, j) => { const k = sim.pockets[j]; k.vol = s.vol; k.state = s.state; k.t = s.t; });
      if (d.pockets.some(s => s.state !== 0)) rebuildConnections(sim);
    }
    const F = poseFrame(sim, sim.zO, sim.pitch, sim.roll, sim._F);
    solveLevels(sim, F, true);
    return sim;
  }

  return {
    serialize, restore,
    FT, RHO, GRAV, LT, G, HULL, BULKHEADS, ZONES, MU_UP, NN, DEFAULT_PARAMS, MARKS,
    K: { DOOR: K_DOOR, OVER: K_OVER, DOWN: K_DOWN, XLOW: K_XLOW, XMERGE: K_XMERGE, XUP: K_XUP, TOP: K_TOP, BREACH: K_BREACH, OPEN: K_OPEN, STAIR: K_STAIR },
    G11_NO_DOOR, SIDE_OPENINGS, SIDE_KIND,
    STAIRS, TIER, WINDOWS, tierTop, deckTopAt, stairOpenings, weatherOpenings, stairState, lawUpright, lawLevel,
    sin: fsin, cos: fcos, exp: FM.exp, log: FM.log, log10: FM.log10, tan: FM.tan, atan2: FM.atan2, hypot: FM.hypot, pow: FM.pow, tanh: FM.tanh, asin: FM.asin, acos: FM.acos, cbrt: FM.cbrt,                                 // E1: the model's own; every model file calls these, not Math's
    sheer, deckZ, inWell, zTopAt, xFwd, xAft, halfBreadth, ENDS_READ, ENDS_BET, nodeIndex, zoneAt,
    zoneBounds, buildColumns, evenKeel,
    buildShip, createSim, step, run, readouts, gmNow, frameOf, worldZ, poseFrame, hydroPass,
    addOpening, removeOpening, setOpeningArea, setDoor, releaseDoor, setBulkheadTop, equilibrate, addPump,
    pocketPoints,                                       // W6: a pocket's water as point masses (the girder reads it)
    spaceWater,                                         // G7 (QC B-3): a space's water with its pockets' (the mirrors')
    eachWater,                                          // the epoch's C1: every body of water, spaces and pockets
    weighedWater,                                       // the epoch's C5: her water as loads weighs it (the mirrors' check)
  };
});
