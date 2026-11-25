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

/*
 * The ship under way: surge, sway and yaw, three shafts and one rudder, joined to the flooding core through its seams.
 * Headless, deterministic, no DOM, the same module pattern as core.js. Design: docs/BRAINSTORM_ship_under_way_v1 and
 * v1_1 (P1). Every number below carries its source or is marked [bet].
 *
 * FRAME (the one trap). Inside this file the manoeuvring literature's frame is used (MMG: Yasukawa and Yoshimura 2015):
 *   x forward, y to STARBOARD, z down; u, v the velocities at amidships; r > 0 turns the bow to starboard;
 *   rudder angle delta > 0 turns the bow to starboard; earth frame x0 north, y0 east; heading psi clockwise from north.
 * The core's frame is x forward, y to PORT, z up, roll positive starboard down. The only quantity that crosses is the
 * roll moment from turning (seam xMph), mapped in heelMoment() below. Flood-water centroids (core x) need no mapping.
 * 1912 helm orders were tiller orders: "hard-a-starboard" put the head to PORT, i.e. delta = -40 here (helm1912()).
 *
 * STEP. Motion.step(sim): forces from the state at t; the roll moment into sim.xMph; C.step(sim); then velocities,
 * then positions from the new velocities (semi-implicit Euler, dt = the core's 0.25 s). At rest with the engines
 * stopped every force is zero and the core gives the same bits as without motion (tools/trials.js checks it).
 * No Math.pow inside the step (its last bit depends on the C runtime: README); no Math.hypot; no division by speed.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'));
  else root.TitanicMotion = factory(root.TitanicCore);
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';
  const RHO = C.RHO, FT = C.FT, G = C.GRAV, KN = 1852 / 3600, DEG = Math.PI / 180, PI07 = 0.7 * Math.PI;

  // ---------------------------------------------------------------- ship data
  const SHIP = {
    L: C.G.LBP, B: C.G.B,
    d: 0.5 * (C.DEFAULT_PARAMS.draftF + C.DEFAULT_PARAMS.draftA),        // 9.83 m, the night's mean draft (Wilding)
    m: 49020667.158, xG: -3.1954, KG: 10.7987,     // the core's mass, LCG and KG for 14 April (createSim; used when not attached)
    zH: 0.5,                                       // hull side force acts at this share of the draft above the keel [bet; 0.5-0.65, M4]
    // resistance R = cR u|u| g(|u| / uB): Biles's 165 tons at 21 kn for about 53,000 t (Hawke inquiry), scaled to 49,021 t
    // (abacus1:4cefc0a23470), times a shape g in x = u / uB, a cubic g0 + g1 x + g2 x^2 + g3 x^3 with g(1) = 1, held at its
    // values at x0 and x1 outside them. M3 (2026-11-17): the shape of Holtrop's 1984 method for this hull (friction with its
    // form factor, wave-making, correlation; no bulb or transom; C_M 0.975 and C_WP 0.78 assumed, the shape hardly moves
    // with them), fitted over 3-25 kn within 0.84 % as used (docs/research/experiments/e16_resistance_shape.js; the period
    // curve research note keeps it: docs/research/RESEARCH_period_resistance_curve_v1_2026-11-17.md). Until M3 it was 1:
    // a quadratic resistance made the speed exactly proportional to the revolutions
    cR: 13231,
    resist: { uB: 21 * KN, x0: 3 / 21, x1: 25 / 21, g: [1.0822331610460612, -0.69099582864974440, 0.48388570807433345, 0.12487695952934966] },
    tP: 0.15,                                      // thrust deduction [bet]
    // calibration point for the screws: 75 rpm gives 22.15 kn straight ahead (Halpern, "Speed and Revolutions", Titanic table;
    // 22.06 kn averaged at 75 rpm on the 13-14 April run), with power shared 15 : 15 : 16 (2 x 15,000 ihp + 16,000 shp)
    cal: { rpm: 75, kn: 22.15, share: [15 / 46, 15 / 46, 16 / 46] },
    // screws: Harland & Wolff notebook via Chirnside (fact sheet section 2). J0 = advance ratio of zero thrust [bet]
    wing: { D: 23.5 * FT, w: 0.15, J0: 1.48, y: 6.0 },   // y: wing shaft off the centreline, m [bet: not found in any source]
    // Cdw: drag coefficient (on its disc) of the centre screw trailing free with the turbine out. M4: the B-series' drag at
    // zero torque, 0.10 for B4-70 of pitch ratio 1.0 (0.03 at 1.4; the centre screw's is 0.85, so more is possible); 0.25 [bet]
    // before (four-quadrant research note, section 6)
    centre: { D: 17 * FT, w: 0.30, J0: 0.95, Cdw: 0.10 },
    turbineRatio: 2.2,                             // turbine rpm per engine rpm (Thearle: 175-180 at 80; fact sheet section 3)
    // rudder: 401.63 sq ft (Weeks; abacus1:2b8bb87f9a58), hard over 40 deg (Hichens, BI 998); immersed span [bet]
    rudder: { A: 37.31, H: 9.5, max: 40, rate: 4 },   // rate deg/s [bet: never measured; the fit is insensitive to it]
    asternLift: 0.5,                               // the rudder's lift slope with sternway, share of ahead [bet] (M1)
    // M4 (2026-11-17). A wing screw turning astern while she still goes ahead (n < 0, Va > 0, the "crash-back" quadrant)
    // takes the shape of the Wageningen B4-70 screw of pitch ratio 1.4, the series' nearest to the wing screws' 1.49:
    // MARIN's four-quadrant Fourier series (1984), as reprinted in Roddy, Hess and Faller (2006), NSWCCD-50-TR-2006/004
    // (approved for public release), evaluated in docs/research/RESEARCH_propeller_four_quadrant_v1_2026-11-17.md.
    // ct: its thrust coefficient C_T* at beta = 180, 175, ..., 90 deg, i.e. at x = atan2(Va, 0.7 pi |n| D) = 0, 5, ..., 90.
    //   |T| = rho D^4 a fA [C_T*(x) / C_T*(0)] (n^2 + Va^2 / (0.49 pi^2 D^2))
    // so fA sets the astern bollard pull (as before M4) and the table the rest: the pull grows about as 1 + 0.85 J^2 with
    // the advance ratio J = Va / (|n| D) (before M4: 1 + J / 1.48, too weak at speed). held: while an engine is being
    // reversed (its dead time) the screw is held and drags as at x = 90, so the force is continuous as it starts astern;
    // a screw stopped by "Stop": SHIP.stopped below (M7; before it, no force at all). With sternway the ahead law
    // mirrored (J0), as before.
    astern: { ct: [-0.2515, -0.2397, -0.2262, -0.2479, -0.3310, -0.4180, -0.4723, -0.5290, -0.5760, -0.6332, -0.7100, -0.7601, -0.7579, -0.7228, -0.6907, -0.6543, -0.6347, -0.6305, -0.6545], held: true },
    // M7 (2026-11-18). A wing screw whose engine is stopped while she has way ("Stop", or the plant's limit 0: no steam,
    // water at the engines) gave no force at all before M7, so her way after "Stop" was the hull's resistance alone (and
    // 4 % from the centre screw): from 22.5 kn, 4.1 kn 26 minutes later and 1.9 at an hour. A stopped screw drags, by its
    // state (docs/research/RESEARCH_way_after_stop_v1_2026-11-18.md):
    //   'held'  it stands: the held screw of a reversal's dead time, x = 90 of the table above, C_D 0.54 on its disc at the
    //           advance speed [derived: the B4-70 shape scaled by fA; the sources give 0.30 for these screws' blade area
    //           (Tabaczek and Bugalski's eq. 7) to 0.65 (B4-70 P/D 1.4, MARIN's series)]. With sternway the series' locked
    //           screw at 270 deg, aft = 0.5985 / 0.6545 of it [read: research note four-quadrant, section 3]
    //   'trail' the water turns the screw and the engine against the engine's friction: held below the speed uB at which
    //           the water's torque on the held screw equals that friction; above it the drag of the series' first quadrant
    //           beyond zero torque where its torque equals the friction. trail: pairs [r, share of held drag], r = (uB / u)^2
    //           = the friction over the held screw's torque [derived: B4-70 P/D 1.4, beta 34.4 (zero torque) to 65 deg];
    //           uB 6 kn [bet: 3.7 to 9.8 kn for a friction of 3 to 10 % of the engine's full torque]
    //   'free'  turned by the water with no friction: the series' drag at zero torque, 0.045 of held [derived]
    // state: the engine-room witnesses say the engines stood between the orders after the collision (Dillon, BI 3720-3723,
    // among the main engines; Scott, BI 5617-5622), and below about 4 to 10 kn a held wing screw's torque is under any
    // likely friction of the engine (the note, section 3): 'held' [read]. The centre screw keeps its own law (Cdw, M4:
    // trailing free with the turbine cut out). With no way (u = 0) every state gives exactly 0.
    stopped: { state: 'held', aft: 0.5985 / 0.6545, uB: 6 * KN, free: 0.045,
      trail: [[0, 0.045], [0.0334, 0.0790], [0.2555, 0.3066], [0.4516, 0.4776], [0.6047, 0.6382], [0.7484, 0.7769], [0.9081, 0.9072], [1, 0.998]] },
    // MMG rudder interaction (Yasukawa and Yoshimura 2015 typical values; t_R from Kijima 1990): research note M1, M2
    // (kappa, the share of the centre screw's race acceleration that reaches the rudder, typically 0.5, is fitted: SHIP.fit)
    tR: 1 - (0.28 * 0.666 + 0.55), aH: 0.25, xH: -0.45, xR: -0.5, gamR: 0.5, lR: -0.9, xP: -0.48,
    // engines: rates from H. I. Cone (US Navy, 1912), via Halpern: 10-20 s to stop and start astern, 30-50 s more to back hard [bet]
    engine: { down: 5.0, up: 1.0, astern: 1.5, dead: 5.0, turbineTau: 10, spinDownTau: 30 },
    // fitted to the 1911-12 trials by tools/calibrate_motion.js (values and residuals in its output)
    // 2026-11-16 (P1): two points 37.3 s helm only, tactical diameter 1,175 m, stop 914 m: { uRk: 1.60, cd: 2.7, fA: 0.518, kap: 0.5 }
    // M2 (the same day): refitted to the handling consensus of the three sisters' record (docs/research/
    // RESEARCH_handling_consensus_v1_2026-11-16.md; experiments e7, e8): two points in 37.00 s at 74 rpm with both engines
    // rung full astern at the helm order (35.5 s with the helm alone), tactical diameter 1,173.5 m at 20 kn, the 11-kn circle
    // 1.03 times it, stop 914 m from 60 rpm. kap fell from MMG's typical 0.5: the record says the centre screw's race
    // mattered little to her steering, and with 0.5 no drag gave both the 37 s and the trial circle: { uRk: 1.8125, cd: 2.4281,
    // fA: 0.518, kap: 0.0458 }. M3 and M4 (2026-11-17): refitted with the resistance's shape, the B-series' astern law, the
    // centre screw's windmilling drag and the trial's slow reversal (its 914 m now under TRIAL_1912), the trial measures
    // interpolated between steps
    fit: { uRk: 1.8225, cd: 2.4774, fA: 0.6501, kap: 0.0552 },
    // The calibration epoch's C1 (QC A-6): her mass under way counts the pockets' water too (W6's bunker while it holds,
    // G7's tank for good), through C.eachWater. 0 is the sum of sim.vol alone, as before, to the bit; 1 lands with the
    // epoch's ONE refit (D4), since it moves the watch.
    massPockets: 1,   // the calibration epoch's landing (D4): on
  };
  // engine-order telegraph, open water (Captain Smith, Hawke inquiry: Full about 75, Half 50, Slow 30; fact sheet section 4)
  const TELEGRAPH = {
    'full ahead': 75, 'half ahead': 50, 'slow ahead': 30, 'dead slow ahead': 20, 'stop': 0,
    'dead slow astern': -20, 'slow astern': -30, 'half astern': -50, 'full astern': -75,
  };

  // ------------------------------------------------------- derived constants
  function derive(fitOverride, engineOverride) {
    const S = Object.assign({}, SHIP, { fit: Object.assign({}, SHIP.fit, fitOverride || {}), engine: Object.assign({}, SHIP.engine, engineOverride || {}) });
    const L = S.L, d = S.d, B = S.B;
    const CB = S.m / RHO / (L * B * d), k = 2 * d / L, cbl = CB * B / L;
    const MU = 0.5 * RHO * L * L * d;
    const mp = S.m / MU, mxp = 0.04 * mp;
    const r2 = (d / L) * (d / L), bl2 = (B / L) * (B / L);
    // added masses: Clarke, Gedling and Hine 1983 (via Fossen's MSS; research note M2c, M3); surge 4 % [bet]
    const myp = Math.PI * r2 * (1 + 0.16 * CB * B / d - 5.1 * bl2) * (L / d);
    const Jzp = Math.PI * r2 * (1 / 12 + 0.017 * CB * B / d - 0.33 * B / L) * (L / d);
    const H = {
      CB, mx: mxp * MU, my: myp * MU, Jz: Jzp * MU * L * L,
      // linear terms: Kijima 1990 in Yoshimura 2009's v-form (three reproductions agree; research note M2a, M10)
      Yv: -(0.5 * Math.PI * k + 1.4 * cbl), YR: 0.5 * cbl + mxp, Nv: -k, NR: -0.54 * k + k * k,
      Xvr: (2.86 * cbl - 0.21) - myp,                         // Yoshimura, Nakao and Ishibashi 2009, Eq. 17
      // cross-flow drag by strips (the same paper, Eqs. 9 and 19-21), extrapolated to L/B 9.2 and scaled by the fit
      CD: (-0.0591 * (L / d) + 1.848) * S.fit.cd, CrY: 0.520 * (L / B) - 1.062, CrN: 0.0742 * (L / d) - 0.297,
      NS: 40,
    };
    // screws: fix each screw's K_T slope so that the calibration point balances the hull resistance
    const u0 = S.cal.kn * KN, n0 = S.cal.rpm / 60, sc = [S.wing, S.wing, S.centre];
    const ns = [n0, n0, n0 * S.turbineRatio], scr = [];
    for (let i = 0; i < 3; i++) {
      const p = sc[i], D2 = p.D * p.D, D4 = D2 * D2, J = u0 * (1 - p.w) / (ns[i] * p.D);
      const T = S.cal.share[i] * S.cR * u0 * u0 * gR(S, u0) / (1 - S.tP);
      scr.push({ D: p.D, D3: D2 * p.D, D4, w: p.w, J0: p.J0, a: T / (RHO * ns[i] * ns[i] * D4 * (1 - J / p.J0)), A: Math.PI * D2 / 4 });
    }
    const lam = S.rudder.H * S.rudder.H / S.rudder.A;
    const R = { fa: 6.13 * lam / (lam + 2.25), eta: S.centre.D / S.rudder.H };
    return { S, H, scr, R };
  }
  // the resistance's shape at speed |u| (SHIP.resist): a cubic by Horner's rule, no Math.pow
  function gR(S, au) {
    const P = S.resist; let x = au / P.uB;
    if (x < P.x0) x = P.x0; else if (x > P.x1) x = P.x1;
    return P.g[0] + x * (P.g[1] + x * (P.g[2] + x * P.g[3]));
  }
  let DEF = derive();

  // ---------------------------------------------------------------- state
  function create(opts) {
    opts = opts || {};
    const K = opts.fit || opts.engine ? derive(opts.fit, opts.engine) : DEF;   // engine: other reversing rates (a trial's handling)
    const m = {
      K, t: 0, u: 0, v: 0, r: 0, X: 0, Y: 0, psi: (opts.heading || 0) * DEG,
      del: 0, delCmd: 0,
      nP: 0, nS: 0, nC: 0, deadP: 0, deadS: 0, setP: 0, setS: 0, turbine: false,
      mass: K.S.m, xG: K.S.xG, KG: K.S.KG, IzG: K.S.m * 0.0625 * K.S.L * K.S.L,   // with flood water when attached (syncMass)
      ay: 0, dv: 0, dr: 0, du: 0, Fn: 0, TP: 0, TS: 0, TC: 0, inflow: 0, couple: opts.couple !== false,
    };
    if (opts.order !== undefined || opts.rpm !== undefined || opts.knots !== undefined) {
      let rpm = opts.rpm !== undefined ? opts.rpm : (typeof opts.order === 'number' ? opts.order : TELEGRAPH[opts.order || 'stop']);
      if (opts.knots !== undefined) rpm = rpmFor(m, opts.knots);
      setOrder(m, rpm, rpm);
      m.nP = m.nS = rpm; m.turbine = turbineRule(m); m.nC = m.turbine ? rpm * K.S.turbineRatio : 0;
      m.u = steadySpeed(m, rpm, rpm, m.turbine);
    }
    return m;
  }
  function setOrder(m, port, stbd) { m.setP = port; m.setS = stbd; }
  // the turbine is in only at Half or Full ahead (Fleming); reversing cuts it out (Wilding); noTurbine forces it out (a what-if)
  function turbineRule(m) { return !m.noTurbine && m.setP >= 50 && m.setS >= 50; }

  // straight-line steady speed for given shaft speeds: cR u^2 g(u) = (1 - tP) sum T(u). For a fixed g it is a quadratic,
  // solved exactly; g is then taken at that speed and the quadratic solved again until the speed stops changing (a
  // contraction: the shape changes slowly). With g = 1 the first solution is the answer.
  function steadySpeed(m, rpmP, rpmS, turbineIn) {
    const K = m.K, S = K.S, nn = [rpmP / 60, rpmS / 60, turbineIn ? 0.5 * (rpmP + rpmS) / 60 * S.turbineRatio : 0];
    let a0 = 0, a1 = 0, kc = 0;
    for (let i = 0; i < 3; i++) {
      const p = K.scr[i], n = nn[i];
      if (i === 2 && !turbineIn) { kc = (1 - S.tP) * 0.5 * RHO * S.centre.Cdw * p.A * (1 - p.w) * (1 - p.w); continue; }
      if (n <= 0) continue;
      a0 += (1 - S.tP) * RHO * p.D4 * p.a * n * n;
      a1 += (1 - S.tP) * RHO * p.D3 * p.a * n * (1 - p.w) / p.J0;
    }
    if (!(a0 > 0)) return 0;
    let u = -1;
    for (let it = 0; it < 200; it++) {
      const a2 = S.cR * gR(S, u < 0 ? S.cal.kn * KN : u) + kc, un = (-a1 + Math.sqrt(a1 * a1 + 4 * a2 * a0)) / (2 * a2);
      if (un === u) break;
      u = un;
    }
    return u;
  }
  function balanceTerms(m, rpm, turbineIn) {          // the coefficients of the quadratic, for an independent check (Abacus)
    const K = m.K, S = K.S, nn = [rpm / 60, rpm / 60, turbineIn ? rpm / 60 * S.turbineRatio : 0];
    const out = { cR: S.cR, tP: S.tP, screws: [], resist: { uB: S.resist.uB, x0: S.resist.x0, x1: S.resist.x1, g: S.resist.g.slice() } };
    for (let i = 0; i < 3; i++) { const p = K.scr[i]; out.screws.push({ n: nn[i], rhoD4a: RHO * p.D4 * p.a, D: p.D, w: p.w, J0: p.J0, A: p.A }); }
    out.centreDrag = turbineIn ? 0 : 0.5 * RHO * S.centre.Cdw * K.scr[2].A * (1 - K.scr[2].w) * (1 - K.scr[2].w);
    return out;
  }
  function rpmFor(m, knots) {                         // the shaft speed whose steady speed is `knots` (bisection, turbine rule applied)
    let lo = 0, hi = 90;
    for (let i = 0; i < 60; i++) { const mid = 0.5 * (lo + hi); if (steadySpeed(m, mid, mid, mid >= 50) / KN < knots) lo = mid; else hi = mid; }
    return 0.5 * (lo + hi);
  }

  // ---------------------------------------------------------------- engines
  function shaft(n, set, dead, dt, E) {               // returns [n, dead]; n in rpm
    if (dead > 0) return [n, dead - dt];
    if (n !== 0 && (set === 0 || (set > 0) !== (n > 0))) {           // stopping, or must reverse: run down first
      const dn = E.down * dt;
      if ((n > 0 ? n : -n) <= dn) return [0, set !== 0 ? E.dead : 0];  // valve gear reversed: a dead time
      return [n > 0 ? n - dn : n + dn, 0];
    }
    const up = set < 0 ? E.astern : E.up, rate = ((set > 0 ? set : -set) > (n > 0 ? n : -n)) ? up : E.down;
    const dn = rate * dt;
    if (set > n) return [n + dn < set ? n + dn : set, 0];
    return [n - dn > set ? n - dn : set, 0];
  }
  // the crash-back quadrant's shape C_T*(x) / C_T*(0), x in degrees (0 bollard, 90 held), linear between the table's 5 degrees
  function asternShape(As, x) {
    let i = Math.floor(x / 5); if (i > 17) i = 17; else if (i < 0) i = 0;
    const c = As.ct, f = (x - 5 * i) / 5;
    return (c[i] + f * (c[i + 1] - c[i])) / c[0];
  }
  // M7: the share of the held screw's drag that a stopped screw gives in its state (SHIP.stopped), at her speed |u|
  function stoppedShare(St, au) {
    if (St.state === 'held') return 1;
    if (St.state === 'free') return St.free;
    const b2 = St.uB * St.uB, u2 = au * au;
    if (u2 <= b2) return 1;                          // 'trail' below uB: the friction holds it
    const r = b2 / u2, T = St.trail;                 // the friction over the held screw's torque; u2 > b2 > 0 here
    for (let i = 1; i < T.length; i++) if (r <= T[i][0]) return T[i - 1][1] + (r - T[i - 1][0]) / (T[i][0] - T[i - 1][0]) * (T[i][1] - T[i - 1][1]);
    return 1;
  }
  // St: SHIP.stopped when the shaft is stopped by order (M7), else null
  function screwThrust(p, n, u, w, fA, As, held, St) {   // n in rev/s; ahead: linear K_T in J; astern: SHIP.astern
    const Va = u * (1 - w);
    if (n > 0) return RHO * p.D4 * p.a * (n * n - n * Va / (p.D * p.J0));
    if (n < 0) {
      if (Va > 0) {                                  // she still goes ahead: the crash-back quadrant
        const x = C.atan2(Va, PI07 * -n * p.D) / DEG;
        return -RHO * p.D4 * p.a * fA * asternShape(As, x) * (n * n + Va * Va / (PI07 * PI07 * p.D * p.D));
      }
      return -RHO * p.D4 * p.a * fA * (n * n - n * Va / (p.D * p.J0));   // sternway
    }
    if (held && As.held && Va > 0) return -RHO * p.D4 * p.a * fA * asternShape(As, 90) * Va * Va / (PI07 * PI07 * p.D * p.D);
    if (St && Va !== 0) {                            // M7: stopped by order, it drags by its state
      const h = RHO * p.D4 * p.a * fA * asternShape(As, 90) * Va * Va / (PI07 * PI07 * p.D * p.D) * stoppedShare(St, u < 0 ? -u : u);
      return Va > 0 ? -h : h * St.aft;
    }
    return 0;
  }

  // ---------------------------------------------------------------- forces and integration
  function accelerations(m, extX, extY, extN) {
    const K = m.K, S = K.S, H = K.H, R = K.R, L = S.L, d = S.d;
    const u = m.u, v = m.v, r = m.r, U2 = u * u + v * v, U = Math.sqrt(U2), au = u < 0 ? -u : u;
    // hull: Yoshimura 2009 unified form (no division by speed): linear terms in velocity products plus cross-flow by strips
    let sy = 0, sn = 0;
    const NS = H.NS, dx = L / NS;
    for (let i = 0; i < NS; i++) {
      const x = -0.5 * L + (i + 0.5) * dx, a = v + H.CrY * r * x, b = v + H.CrN * r * x;
      sy += (a < 0 ? -a : a) * a * dx; sn += (b < 0 ? -b : b) * b * x * dx;
    }
    const YH = 0.5 * RHO * L * d * (H.Yv * v * au + H.YR * L * r * u) - 0.5 * RHO * d * H.CD * sy;
    const NH = 0.5 * RHO * L * L * d * (H.Nv * v * u + H.NR * L * r * au) - 0.5 * RHO * d * H.CD * sn;
    const XH = -S.cR * u * au * gR(S, au) + 0.5 * RHO * L * d * H.Xvr * v * r * L;
    // screws
    const beta = U > 1e-9 ? C.atan2(-v, u) : 0, rp = U > 0.1 ? r * L / U : 0;
    const bP = beta - S.xP * rp, wC = S.centre.w * C.exp(-4 * bP * bP);
    const fA = S.fit.fA;
    const pl = m.plant;                             // what the machinery can do (core/systems.js); null: everything works
    // M7: a wing shaft at rest, out of a reversal's dead time, with its order (as far as the plant can carry it out) at Stop
    const stP = m.nP === 0 && !(m.deadP > 0) && (pl ? limited(m.setP, pl.nMax[0]) : m.setP) === 0 ? S.stopped : null;
    const stS = m.nS === 0 && !(m.deadS > 0) && (pl ? limited(m.setS, pl.nMax[1]) : m.setS) === 0 ? S.stopped : null;
    const TP0 = screwThrust(K.scr[0], m.nP / 60, u, S.wing.w, fA, S.astern, m.deadP > 0, stP), TS0 = screwThrust(K.scr[1], m.nS / 60, u, S.wing.w, fA, S.astern, m.deadS > 0, stS);
    const VAc = u * (1 - wC);
    const TC0 = m.turbine ? screwThrust(K.scr[2], m.nC / 60, u, wC, fA, S.astern, false) : -0.5 * RHO * S.centre.Cdw * K.scr[2].A * VAc * (VAc < 0 ? -VAc : VAc);
    // a screw out of the water pushes nothing: its thrust goes with the share of its disc under water [bet: no ventilation law]
    const TP = pl ? TP0 * pl.imm[0] : TP0, TS = pl ? TS0 * pl.imm[2] : TS0, TC = pl ? TC0 * pl.imm[1] : TC0;
    const XP = (1 - S.tP) * (TP + TS + TC);
    const NP = S.wing.y * (1 - S.tP) * (TP - TS);                  // port screw ahead swings the head to starboard
    let X, Y, N;
    if (u >= 0) {
      // rudder in the centre screw's race: momentum theory written with the thrust (no 1/n: research note M7)
      const ui = Math.sqrt(Math.max(0, VAc * VAc + 8 * TC / (RHO * Math.PI * S.centre.D * S.centre.D)));
      const q = VAc + S.fit.kap * (ui - VAc);
      const uR = S.fit.uRk * Math.sqrt(R.eta * q * q + (1 - R.eta) * VAc * VAc);
      const vR = U * S.gamR * (beta - S.lR * rp), UR2 = uR * uR + vR * vR, UR = Math.sqrt(UR2);
      let CN = UR > 1e-6 ? R.fa * (C.sin(m.del) * uR - C.cos(m.del) * vR) / UR : 0;   // f_alpha sin(alpha_R), without atan2
      if (CN > 1.3) CN = 1.3; else if (CN < -1.3) CN = -1.3;                        // stall [bet]
      let FN = 0.5 * RHO * S.rudder.A * UR2 * CN;
      if (pl) FN *= pl.rudImm;                      // only the rudder's area under water works
      const cd = C.cos(m.del);
      X = XH + XP - (1 - S.tR) * FN * C.sin(m.del) - RHO * m.inflow * u + extX;   // the ingested water must be brought to speed
      Y = YH - (1 + S.aH) * FN * cd + extY;
      N = NH + NP - (S.xR + S.aH * S.xH) * L * FN * cd + extN;
      m.Fn = FN;
    } else {
      // Sternway (M1). The water meets the rudder from aft, so the MMG terms written for headway do not apply: the
      // magnitude uR and the drift angle beta (which turns to 180 degrees) made a side force of their own and none
      // from the rudder. Written instead with the water's velocity at the rudder as a vector, signed: uRs > 0 when it
      // moves aft. The rudder leads, so nothing straightens the flow (gamma_R = 1, l_R at the rudder's own place) and
      // the hull adds nothing to its force (t_R = a_H = 0) [bet]. Its trailing edge now meets the water first: half the
      // lift slope [bet]. The centre screw's race, if the turbine still drives it, is added as at u = 0 ahead.
      const ui0 = Math.sqrt(Math.max(0, 8 * TC / (RHO * Math.PI * S.centre.D * S.centre.D)));
      const uRs = u + S.fit.uRk * Math.sqrt(R.eta) * S.fit.kap * ui0;
      const vRs = -(v + r * S.xR * L), UR2 = uRs * uRs + vRs * vRs, UR = Math.sqrt(UR2);
      let CN = UR > 1e-6 ? S.asternLift * R.fa * (C.sin(m.del) * uRs - C.cos(m.del) * vRs) / UR : 0;
      if (CN > 1.3) CN = 1.3; else if (CN < -1.3) CN = -1.3;
      let FN = 0.5 * RHO * S.rudder.A * UR2 * CN; if (pl) FN *= pl.rudImm;
      const cd = C.cos(m.del);
      X = XH + XP - FN * C.sin(m.del) - RHO * m.inflow * u + extX;
      Y = YH - FN * cd + extY;
      N = NH + NP - S.xR * L * FN * cd + extN;
      m.Fn = FN;
    }
    // equations of motion about amidships (MMG standard, Eq. 4), with the flood water in the mass
    const M = m.mass, xG = m.xG, MX = M + H.mx, MY = M + H.my;
    const M22 = m.IzG + H.Jz + xG * xG * M, M12 = xG * M, DET = MY * M22 - M12 * M12;
    const du = (X + MY * v * r + xG * M * r * r) / MX;
    const bY = Y - MX * u * r, bN = N - xG * M * u * r;
    m.du = du; m.dv = (bY * M22 - M12 * bN) / DET; m.dr = (MY * bN - M12 * bY) / DET;
    m.ay = m.dv + u * r; m.TP = TP; m.TS = TS; m.TC = TC;
  }
  // an order the engines cannot obey for want of steam (or water in their room) is carried out as far as they can
  function limited(set, L) { return (set < 0 ? -set : set) <= L ? set : (set > 0 ? L : -L); }
  function advance(m, dt) {                         // engines and rudder, then velocities, then positions (semi-implicit)
    const S = m.K.S, E = S.engine, pl = m.plant;
    let o = shaft(m.nP, pl ? limited(m.setP, pl.nMax[0]) : m.setP, m.deadP, dt, E); m.nP = o[0]; m.deadP = o[1];
    o = shaft(m.nS, pl ? limited(m.setS, pl.nMax[1]) : m.setS, m.deadS, dt, E); m.nS = o[0]; m.deadS = o[1];
    const tin = turbineRule(m) && m.nP > 40 && m.nS > 40 && (!pl || pl.turbine);   // the turbine also needs its room dry
    m.turbine = tin;
    const tgt = tin ? 0.5 * (m.nP + m.nS) * S.turbineRatio : 0, tau = tin ? E.turbineTau : E.spinDownTau;
    m.nC += (tgt - m.nC) * (dt / tau);
    // the steering engines move the rudder only with steam; without it the rudder stays where it is
    const rate = pl ? S.rudder.rate * DEG * dt * pl.steerRate : S.rudder.rate * DEG * dt, lim = S.rudder.max * DEG;
    const cmd = pl && !pl.steer ? m.del : (m.delCmd > lim ? lim : (m.delCmd < -lim ? -lim : m.delCmd));
    m.del += cmd - m.del > rate ? rate : (cmd - m.del < -rate ? -rate : cmd - m.del);
    m.u += m.du * dt; m.v += m.dv * dt; m.r += m.dr * dt;
    m.psi += m.r * dt;
    const c = C.cos(m.psi), s = C.sin(m.psi);
    m.X += (m.u * c - m.v * s) * dt; m.Y += (m.u * s + m.v * c) * dt;
    m.t += dt;
  }
  // standalone (no flooding core): the trials and the fit use this
  function stepAlone(m, dt, ext) { accelerations(m, ext ? ext.X : 0, ext ? ext.Y : 0, ext ? ext.N : 0); advance(m, dt); }

  // ---------------------------------------------------------------- the core
  // the turning moment on roll, in the CORE's sign (starboard down positive): a turn to starboard (ay > 0) heels her to port
  function heelMoment(m) { return -m.mass * m.ay * (m.KG - m.K.S.zH * m.K.S.d); }
  function syncMass(sim, m) {                       // ship plus flood water: mass, centre, and the water's yaw inertia
    let mw = 0, mx = 0, Iw = 0, M, xG;
    if (SHIP.massPockets && sim.pockets && sim.pockets.length) {   // C1: every body of water, the pockets' too
      C.eachWater(sim, (V, x) => { const w = RHO * V; if (w > 0) { mw += w; mx += w * x; } }, true);
      M = sim.ms + mw; xG = (sim.ms * sim.g0[0] + mx) / M;
      C.eachWater(sim, (V, x) => { const w = RHO * V; if (w > 0) { const e = x - xG; Iw += w * e * e; } }, true);
    } else {
      for (let n = 0; n < C.NN; n++) { const w = RHO * sim.vol[n]; if (w > 0) { mw += w; mx += w * sim.cx[n]; } }
      M = sim.ms + mw; xG = (sim.ms * sim.g0[0] + mx) / M;
      for (let n = 0; n < C.NN; n++) { const w = RHO * sim.vol[n]; if (w > 0) { const e = sim.cx[n] - xG; Iw += w * e * e; } }
    }
    const e0 = sim.g0[0] - xG, L = m.K.S.L;
    // yaw inertia about the combined centre: the ship's own (radius of gyration L/4, MMG standard) moved by e0, plus the water's
    m.mass = M; m.xG = xG; m.IzG = sim.ms * (0.0625 * L * L + e0 * e0) + Iw;
    m.KG = sim.KG; m.inflow = sim.inflow;
  }
  // P5, flooding at speed (Tier 0 of docs/BRAINSTORM_ship_under_way_v1_2026-11-16.md, section 5): the sea's pressure at
  // each hull opening while she moves, through the core's seam hx (the outside level, m above the calm sea). In her frame
  // the flow is steady, so the outside level rises by C_p U^2 / 2g, U the water's speed past the opening and C_p the
  // stagnation share of the plating's angle to that flow: sin^2 of the angle at which the water meets the plate, 1
  // head-on, about 0.02 along the 1912 damage (6 to 9 degrees to the centreline), and 0 where the water leaves the plate
  // (no suction: Tier 0) [bet]. A crushed bow faces the flow: C_p 1 ahead [bet]. Near the stem the bow wave adds its rise:
  // SEAFLOW.bowWave U^2 / 2g at the stem (the brainstorm's 3 to 4.5 m at 22 knots and about 1 m at 10), falling to
  // nothing SEAFLOW.bowLen m aft, and with depth as exp(-g d / U^2) (0.60 at 7 m at 22.5 knots, 0.07 at 10) [bets]. The
  // discharge factor cm stays 1: the loss of a compact hole in a cross-flow (the brainstorm's 5.3) waits for its source.
  // Stopped, every head is 0 and the core's bits are as before.
  const SEAFLOW = { on: true, bowWave: 0.55, bowLen: 30 };   // on: false for experiments only (e24)
  function seaHeads(sim) {
    const m = sim.mo, ops = sim.openings, S = sim.conn;
    if (!ops.length || !SEAFLOW.on) return;
    const u = m.u, v = m.v, r = m.r, twoG = 2 * G;
    const moving = u !== 0 || v !== 0 || r !== 0;
    const F = moving ? (sim._F && sim._F.R20 !== undefined ? sim._F : C.frameOf(sim)) : null;   // her pose at the last step
    for (let i = 0; i < ops.length; i++) {
      const o = ops[i], c = o.conn; if (c < 0) continue;
      if (!moving) { S.hx[c] = 0; continue; }
      if (o.nx === undefined) {                     // the plating's outward normal in MMG axes (x forward, y to starboard)
        const sg = o.y >= 0 ? 1 : -1;
        if (o.label && o.label.indexOf('bow:') === 0) { o.nx = 1; o.ny = 0; }      // a crushed bow faces ahead
        else {
          // G24: on the ship's own hull, her ends with it (every watch's openings lie below 11.0 m, where it is the same)
          const H = sim.ship.hull, hx = (C.halfBreadth(o.x + 0.5, o.z, H) - C.halfBreadth(o.x - 0.5, o.z, H)), nn = Math.sqrt(hx * hx + 1);
          o.nx = -hx / nn; o.ny = -sg / nn;
        }
      }
      const Vx = u + r * o.y, Vy = v + r * o.x, U2 = Vx * Vx + Vy * Vy;   // her velocity at the opening (y to port: y_mmg = -o.y)
      const wn = -(Vx * o.nx + Vy * o.ny);          // the water's velocity relative to her, along the outward normal
      let h = wn < 0 && U2 > 0 ? (wn * wn / U2) * U2 / twoG : 0;
      if (u > 0) {                                  // the bow wave
        const back = C.xFwd(o.z) - o.x;
        if (back < SEAFLOW.bowLen) {
          const d = -(F.R20 * o.x + F.R21 * o.y + F.R22 * o.z + F.tz), k = G / (u * u);
          h += SEAFLOW.bowWave * u * u / twoG * (1 - (back > 0 ? back : 0) / SEAFLOW.bowLen) * C.exp(-k * (d > 0 ? d : 0));
        }
      }
      S.hx[c] = h;
    }
  }
  function attach(sim, opts) { sim.mo = create(opts); syncMass(sim, sim.mo); return sim.mo; }
  function step(sim) {
    const m = sim.mo;
    syncMass(sim, m);
    accelerations(m, 0, 0, 0);
    if (m.couple) sim.xMph = heelMoment(m);
    seaHeads(sim);
    C.step(sim);
    advance(m, sim.params.dt);
  }

  // ---------------------------------------------------------------- orders
  function telegraph(sim, order, side) {
    const m = sim.mo || sim, rpm = typeof order === 'number' ? order : TELEGRAPH[order];
    if (rpm === undefined) throw new Error('unknown telegraph order: ' + order);
    if (side === 'port') m.setP = rpm; else if (side === 'starboard') m.setS = rpm; else { m.setP = rpm; m.setS = rpm; }
  }
  function rudder(sim, deg) { const m = sim.mo || sim; m.delCmd = deg * DEG; }      // + = to starboard (head to starboard)
  function helm1912(sim, order) {                   // tiller orders of 1912
    const t = { 'hard-a-starboard': -40, 'hard-a-port': 40, 'midships': 0, 'starboard': -15, 'port': 15 }[order];
    if (t === undefined) throw new Error('unknown helm order: ' + order);
    rudder(sim, t);
  }

  // ---------------------------------------------------------------- readouts and snapshots
  function readouts(sim) {
    const m = sim.mo || sim, U = Math.sqrt(m.u * m.u + m.v * m.v);
    let hdg = (m.psi / DEG) % 360; if (hdg < 0) hdg += 360;
    return {
      t: m.t, knots: U / KN, surgeKn: m.u / KN, heading: hdg, rotDegMin: m.r / DEG * 60, drift: U > 0.1 ? C.atan2(-m.v, m.u) / DEG : 0,
      rudder: m.del / DEG, rpmPort: m.nP, rpmStbd: m.nS, rpmCentre: m.nC, turbine: m.turbine,
      northNm: m.X / 1852, eastNm: m.Y / 1852, heel: sim.roll !== undefined ? sim.roll / DEG : null,
      thrustT: (m.TP + m.TS + m.TC) / 9964.02, rudderForceT: m.Fn / 9964.02,
    };
  }
  const KEYS = ['t', 'u', 'v', 'r', 'X', 'Y', 'psi', 'del', 'delCmd', 'nP', 'nS', 'nC', 'deadP', 'deadS', 'setP', 'setS', 'turbine', 'couple'];
  function serialize(sim) { const o = { core: C.serialize(sim), motion: {} }; for (const k of KEYS) o.motion[k] = sim.mo[k]; return o; }
  function restore(ship, d) { const sim = C.restore(ship, d.core); sim.mo = create({}); Object.assign(sim.mo, d.motion); syncMass(sim, sim.mo); return sim; }

  return {
    SHIP, TELEGRAPH, KN, DEG, derive, create, attach, step, stepAlone, accelerations, advance,
    steadySpeed, balanceTerms, rpmFor, telegraph, rudder, helm1912, heelMoment, syncMass, readouts, serialize, restore,
    seaHeads, SEAFLOW,
    setFit(fit) { DEF = derive(fit); },
  };
});

/*
 * The iceberg encounter (P2, P3 of docs/BRAINSTORM_ship_under_way_v1_1): a ship under way (core/motion.js) meets a
 * berg, and the CONTACT makes the damage, which the flooding core then sinks her with.
 *
 * Model, per sub-step (dt / 5 while the ship is near the ice):
 *   - The berg's underwater spur is three horizontal bands (depths below the waterline); each band's outline is a
 *     continuous, piecewise-linear curve through a polar radius table around the berg's centre (ICE.nodes, in the
 *     berg's own frame; P3b: until then it was 180 flat 2-degree bins in the earth frame, and a course one degree off
 *     opened up to 28 % more). The berg moves as a free body (mass plus added mass) under the contact force, and turns
 *     under its moment: on a round berg only the sliding friction has one (P3b).
 *   - The hull is the core's own form: at each band's depth, a station every ICE.ds metres from stem to stern, both
 *     sides, using halfBreadth(x, z) at the pose when the encounter starts; each stands for ds metres of side. The
 *     torn stations of each metre are gathered into one opening for the flooding core (P3c).
 *   - Contact at a station: overlap = ice radius - distance of the (dented) hull point from the berg's centre.
 *     The interface force is the smaller of what the plating resists, q h (dent + overlap), and what the ice can carry
 *     before it crushes, p h, with p = p0 / sqrt(contact area) (the falling pressure-area relation of ice [bet: form]).
 *     A station's contact ramps in over its first ICE.aRamp metres of overlap (P3c: counted whole as soon as it
 *     touched, the area jumped as stations came and went, and the outcome followed the stations' spacing: e11).
 *     If the plating is weaker, it dents by the whole overlap; otherwise it dents to p/q and the ice outline crushes
 *     back by the rest. Dents and crushing are permanent.
 *   - A station whose dent exceeds dTear opens: a seam or plate tear of area alpha (dent - dTear) per metre of hull,
 *     handed to the core as an opening (addOpening, then setOpeningArea as it grows). Shallower dents are dents: no water.
 *   - Friction mu along the contact. The force acts on the ship (surge, sway, yaw, and roll about G through sim.xMph)
 *     and, reversed, on the berg. The berg also feels the water's drag.
 *   - A stem strike (added with P4): where her centreline itself is inside ice that faces her bow, the bow structure
 *     crushes at a force rising with the depth crushed (S1b) and the stem recedes; the compartments the crush reaches
 *     are open to the sea.
 *     Glancing touches such as the reconstructed 1912 one never meet this law (see ICE.bowF).
 * Far from the ice, Encounter.step is exactly Motion.step (checked by tools/encounter_tests.js).
 * Frame: as motion.js (MMG: x forward, y to starboard; earth x north, y east). Openings are written in the core's frame
 * (y to port), so a starboard station has y < 0.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'), require('./motion.js'));
  else root.TitanicEncounter = factory(root.TitanicCore, root.TitanicMotion);
})(typeof self !== 'undefined' ? self : this, function (C, Mo) {
  'use strict';
  const DEG = Math.PI / 180, TWO_PI = 2 * Math.PI;
  const GAP_EXACT = 100;                            // m: the smallest gap between hull and ice (minGap) is tracked exactly below this

  const ICE = {
    R: 40,                  // spur radius at the top band, m [bet]
    taper: 0.08,            // each deeper band is this share narrower [bet]
    depths: [5.75, 6.75, 7.75], h: 1.0,   // band centres below the waterline and band height, m: the 1912 damage lay 6.6-7.5 m down
    // q, p0 and mass were chosen by a joint search with the 1912 geometry (docs/research/experiments/e5): the tears must
    // run from the forepeak to about boiler room 5, starboard only, with the split near Hackett and Bedford's. They are
    // fitted bets, not measurements. Searched again with P3c's contact law (e13, e14): q 24 MPa (it was 12), p0 and the
    // berg's mass as they were; with the 1912 geometry of core/night.js the damage then sinks her in 159 minutes.
    mass: 1e8, added: 0.5,  // berg mass, kg (100,000 t), and added-mass ratio [fitted bet: published estimates span 1e8 to over 1e9 kg]
    mu: 0.1,                // friction, ice on steel [bet]
    p0: 6e6,                // ice pressure at 1 m2 of contact, Pa; p = p0 / sqrt(A) [bet: order of ship-ice process pressures]
    q: 24e6,                // side-shell resistance, N per m2 of contact per m of dent [fitted bet]
    dTear: 0.2,             // dent at which riveted seams and plates open, m [bet]
    // P3b: where along the hull the seams open at another dent: [[xAft, xFwd, factor on dTear], ...] in the ship frame
    // (x forward from amidships, m), or [xAft, xFwd, factor at xAft, factor at xFwd] for a linear ramp; the first region
    // holding a station counts; null: the same everywhere (as before P3b's first use).
    // G6 (2026-11-20; docs/research/RESEARCH_br5_damage_extent_G6_v1_2026-11-20.md): along boiler room 5's own side,
    // from bulkhead F to the after end of its forward bunker (9 ft abaft bulkhead E), the seams open only at twice the
    // dent. What it rests on is the 1912 record, which ends the damage in that bunker:
    //   - the Report: "No. 5 boiler room was damaged at the ship's side in the starboard forward bunker", 2 ft from the
    //     bulkhead, and "In No. 4 boiler room there was no indication of any damage";
    //   - Barrett, BI 2105-2109: the stokehold's plates never covered.
    // [Fitted bet, and on any night but 1912 a bet: no structural source makes boiler room 5's side stronger than any
    // other (the shell's thickness along her length is not in the open record).] A dent never passes the ice's crushing
    // depth (p0 / q = 0.25 m), so twice the tearing dent (0.4 m) makes this stretch untearable by the side law on every
    // night; any factor from 2 gives the same 1912 night, and 2 is the least (e82).
    // Narrowed at G6b's landing (2026-11-20, join 6) from the whole hull aft of the bunker to boiler room 5's own side:
    // the wide rule stopped every night's tear aft of the bunker, which no source supports (the night suite's miss window,
    // the Carpathia suite's second contact). On the 1912 watch the ice dents boiler room 4 by 0.17 m at most and tears
    // nothing there either way, so the 1912 night is the same to the bit. A what-if switch to run a night without the
    // rule comes with G7.
    tearAlong: [[C.BULKHEADS.find(b => b.id === 'F').x, C.BULKHEADS.find(b => b.id === 'E').x - 9 * C.FT, 2]],
    // G6b (2026-11-20; docs/research/RESEARCH_damage_split_by_compartment_G6b_v1_2026-11-20.md, W6's design v1.3): where
    // along the hull a torn station's opening is scaled, in the form of tearAlong: [[xAft, xFwd, factor on alpha], ...]
    // or [xAft, xFwd, factor at xAft, factor at xFwd] for a ramp; the first region holding a station counts; null: 1
    // everywhere, and the openings keep their bits. The contact law dents every station to where the ice crushes back
    // (p0 / q, 0.25 m), so every torn metre opens alike and the split is only the length the tear crosses in each
    // compartment (e88). One factor per compartment over the 1912 damage's extent (from the stem to the end of boiler
    // room 5's bunker, 9 ft abaft bulkhead E; 1 elsewhere) makes the 1912 encounter share its opening as Hackett and
    // Bedford's areas do (JOM 1998, Table I: 4.8, 11.9, 24.6, 26.2, 22.2 and 10.3 %, the forepeak to boiler room 5), the
    // split the 1912 damage preset carries too (`TITANIC_SPLIT`) [fitted bet: their split is a flooding model's reading
    // of the record, not a measurement, and no structural source gives the factors]. Read physically, along the 1912
    // damage the shell opened less per metre forward, where the bow's frames are closer: 24 to 27 in apart in the
    // forepeak, 27 to 30 in hold 1, 30 to 33 in hold 2, 36 in from hold 3 aft (Olympic's frame spacing, Bob Read's
    // hull lines, Plan Sheet 8, 2010, CC BY-NC-ND 4.0: the numbers cited, nothing traced). The forepeak's and hold 1's
    // factors lie near the square of their spacing against amidships's (0.44 to 0.69); hold 2's and the bunker's are
    // not explained by it.
    openAlong: (() => { const x = (id) => C.BULKHEADS.find(b => b.id === id).x; return [[x('A'), 200, 0.4544], [x('B'), x('A'), 0.6002], [x('C'), x('B'), 1.2224], [x('D'), x('C'), 1.1508], [x('E'), x('D'), 0.9487], [x('E') - 9 * C.FT, x('E'), 3.0466]]; })(),
    // The calibration epoch's C6 (D82b; docs/research/RESEARCH_bunker_burst_head_W6_v1_2026-11-21.md on B1+B2's branch):
    // the bunker's own opening on a night, m2, a what-if through the night's own ice overrides (spec.ice) as tearAlong's
    // switch is. With bunkerOpen given, the torn stations of her starboard side along bunkerAlong (boiler room 5's
    // forward bunker, 9 ft abaft bulkhead E: openAlong's last region) open bunkerOpen between them, each in proportion
    // to its dent beyond the tearing dent, whatever alpha and openAlong say there; every other station opens as it
    // does. The total is bunkerOpen exactly from the first step in which a station tears there: it does not grow in
    // with the dents while the ice crosses the bunker (a third of a second at 22 knots), and a night whose tear never
    // reaches the bunker opens nothing there. null: the region opens by alpha and openAlong, and every night keeps its
    // bits. It sets the region's stations, as the summary counts them by compartment; a metre of hull is one opening
    // (syncOpenings), so the metres that straddle the bunker's two ends carry part of it to their own places, as they
    // do without it (on the 1912 night about 73 % of the region's opening lies in the pocket, 13 % in boiler room 5's
    // stokehold and 14 % in boiler room 6).
    bunkerAlong: [C.BULKHEADS.find(b => b.id === 'E').x - 9 * C.FT, C.BULKHEADS.find(b => b.id === 'E').x],
    bunkerOpen: 0.07609,   // the calibration epoch's landing (D4; D90): the history match's candidate C, as core/scenarios.js's BUNKER_OPEN_1912 (null before: the region's share)
    // m2 of opening per m of hull per m of dent beyond dTear: a seam gap of about 14 % of the excess dent. Fitted so that
    // the 1912 encounter opens the core's calibrated 0.7506 m2 (a fixed point: the holes change her motion a little
    // during the contact, and so the damage; tools/calibrate_encounter.js finds it, tools/encounter_tests.js checks it).
    // Refitted 2026-11-16 when the berg's drag was added (it had been 0.14326), and again the same day when the handling
    // was refitted to the sisters' consensus and the 1912 geometry with it (M2, e9: the tear now runs x 127 to 29, 98 m,
    // where it ran 69 m; it had been 0.14448247622448618), and again with P3c's contact law, its q and its 1912 geometry
    // (e13, e14; it had been 0.10976148390199011), and again with M3 and M4's handling and the 1912 geometry found with it
    // (e17; it had been 0.2069376129044827), and again with P5's sea pressure at the openings (the water let in during
    // the contact moves her a little; it had been 0.20714452400484218), and again with G6's tearAlong (boiler room 5's
    // stokehold side no longer torn: the same 0.7506 m2 opened forward of it; it had been 0.20701033996361745), and
    // again with G6b's openAlong and the area that calibration then found, 0.7853 m2 (it had been 0.21936823156251853),
    // and again with G7's forepeak tank and G11's widths and the area their refit found, 0.8196 m2 (rung 2b of
    // docs/research/RESULT_G7_ladder_v1_1_2026-11-21.md; it had been 0.23058811512419958).
    // The calibration epoch's landing (D4; D90): the fixed point at 0.9773 m2 on the ship with her ends, the landed
    // params, the bunker's opening and switches (node tools/calibrate_encounter.js). It was 0.24256786344109968 at 0.8196 m2.
    alpha: 0.2954447289602645,
    sub: 40,                // sub-steps a step while near the ice: the hull slides about half a station each (P3c, e11)
    // A stem strike. The bands above are a spur three metres thick; a ship that runs her stem into the berg meets its
    // whole face. Where her centreline is inside the ice and the ice faces her bow (within about 60 degrees of square),
    // the bow structure crushes along her axis at a force that rises with the depth crushed, F = bowF + bowFk s (s the
    // metres crushed so far), and the stem recedes to the ice. S1b (2026-11-17): the bow-crushing note's option B
    // (docs/research/RESEARCH_bow_crushing_head_on_v1_2026-11-17.md, section 6): a line through the mean of four
    // section-based crushing laws on her own bow (Amdahl 1983; Paik and Pedersen 1995; Zhang and Pedersen 2017; Minorsky
    // 1959 with frames), static 49 + 1.5 s MN, times 1.7 for mild steel's rate effects [derived there]. Against a fixed
    // face it crushes 28.8 m from 22.5 knots, Wilding's "80 or perhaps 100 feet" (British Inquiry Q20276, Q20280; 108-141 MN
    // as a constant), and 7.3 m from 10 knots, inside the section laws' 5.5-11.5 m (docs/research/experiments/e21). Until
    // S1b it was a constant 120 MN, which crushes too little in a slow strike (5.7 m at 10 knots). The one FE study of her
    // (Paik, Kim and Thomas 2025: riveted joints at reduced yield, rigid berg) gives about 62 MN on average, also rising with
    // depth, and 24.7 m at 10 knots: the weak end. Modern whole-ship laws (Pedersen 1993, 2020; 376-489 MN) were fitted to
    // welded bulbous bows: not used. The berg's face is rigid in a stem strike [bet, kept by S1b]: the side law's
    // p0/sqrt(A) would let the ice yield first up to about 400 m2 of contact (the note's section 4), but no ice law is
    // calibrated at the 100-500 m2 of a stem strike, and Wilding's estimate and the FE study both crush the bow against an
    // unyielding face; the Arizona (1879), where both gave way, crushed 6 m. The force acts along the ice's normal,
    // so an oblique blow also throws her head off. Between cosines 0.4 and 0.7 of the angle between that normal and her
    // axis the law fades in; more glancing touches are the side law's alone (the 1912 touch is one of those, and is
    // unchanged by this law). bowZ: the force's height above the keel, the centroid of the crushed section's steel,
    // 12.6-14.2 m over the first 5-40 m [derived, the note's section 3.3; it was 5.0, which put the force 5.8 m below her
    // centre of gravity and heeled her 17-27 degrees in an oblique strike, now 2-3]
    bowF: 84e6, bowFk: 2.5e6, bowCos0: 0.4, bowCos1: 0.7, bowZ: 13.0,
    bowOpen: 0.5,           // m2 of opening per metre of bow crushed, each side [bet: a crushed bow is open; the size matters little]
    bowMin: 0.5,            // m of crush before the forepeak is open [bet]
    // the berg's own resistance in the water: a blunt body, drag coefficient 1 on its breadth times its draft, the draft
    // from its mass as a slab of its own radius [bet]. Without it a pushed berg would coast for ever.
    cdBerg: 1.0,
    // P3b. The outline: nodes per band around the berg, joined by straight lines, fine enough that each hull station's
    // metre of side spans several (0.25 degree: 0.17 m of arc at 40 m). A crush clips the outline to the dented hull over
    // that metre's arc. Turning: the berg's moment of inertia is a disc of its spur's radius, a round body moves no water
    // turning (added 0) [bets], and the water slows its turning as it slows its drift, at the rim's speed [bet].
    nodes: 11520, turns: false, addedYaw: 0,
    // P3c (e11): refined together, stations every 0.125 m, the outline at the same arc per station, 40 sub-steps, and the
    // contact ramping in over 0.1 m of overlap [bet], the opened area converges and a course a fraction of a degree off
    // changes it under 2 % (it was 28 %); counting stations whole, it does not (10 % at the finest). Friction smooth
    // through zero sliding speed, over vSlip m/s [bet]. The berg's turning stays off: it made the outcome erratic (e10).
    aRamp: 0.1, vSlip: 0.1,
    ds: 0.125,              // m of hull each station stands for (its force, its contact and its opening scale with it)
    // X2 (2026-11-17): which stations the contact looks at. A station can matter only while it is nearer the berg's
    // centre than its band's radius as the berg was made (the outline only ever crushes back from there) plus the
    // smallest gap so far: farther off it neither touches the ice nor sets a new smallest gap. Such stations are passed
    // over: first a whole stretch of hull at a time (the berg's centre in her own axes gives the stretch that can be
    // within reach), then one by one by their distance. CULL_EPS of slack is tens of thousands of times the
    // arithmetic's rounding even 100 km from the origin, so nothing that could count is passed over, and the outcome is
    // the same to the last bit: tools/encounter_tests.js runs nights both ways (false: every station, every sub-step,
    // as it was until X2). A ship lying by the ice no longer pays for some 13,000 stations forty times a step.
    cull: true,
  };
  const CULL_EPS = 1e-6;                            // m
  // in a list that falls (the stations run from the stem aft): the first place not above v, and the first place below v
  function firstNotAbove(a, n, v) { let lo = 0, hi = n; while (lo < hi) { const mid = (lo + hi) >> 1; if (a[mid] > v) lo = mid + 1; else hi = mid; } return lo; }
  function firstBelow(a, n, v) { let lo = 0, hi = n; while (lo < hi) { const mid = (lo + hi) >> 1; if (a[mid] >= v) lo = mid + 1; else hi = mid; } return lo; }

  function bandStations(sim, depth, ds) {         // hull points at `depth` below the waterline, every ds metres, at the current pose
    ds = ds || 1;
    const F = C.frameOf(sim), xs = [], hb = [], zs = [];
    const xStem = C.xFwd(8);
    for (let x = Math.floor(xStem + 1); x >= C.G.xAP - C.G.sternOverhang; x -= ds) {
      const keelDepth = -C.worldZ(F, x, 0, 0);    // keel's depth below the sea at this station
      const z = keelDepth - depth;
      if (z <= 0.05) continue;
      const h = C.halfBreadth(x, z);
      if (h > 0.05) { xs.push(x); hb.push(h); zs.push(z); }
    }
    // the metre of hull each station belongs to: its opening is the metre's
    const gid = new Int32Array(xs.length), gx = [], gz = [], gn = [];
    for (let i = 0; i < xs.length; i++) {
      const m = Math.floor(xs[i]);
      if (!gx.length || Math.floor(gx[gx.length - 1] / gn[gn.length - 1]) !== m) { gx.push(0); gz.push(0); gn.push(0); }
      const g = gx.length - 1; gid[i] = g; gx[g] += xs[i]; gz[g] += zs[i]; gn[g]++;
    }
    for (let g = 0; g < gx.length; g++) { gx[g] /= gn[g]; gz[g] /= gn[g]; }
    return { depth, ds, n: xs.length, xs: Float64Array.from(xs), hb: Float64Array.from(hb), zs: Float64Array.from(zs), gid, ng: gx.length, gx: Float64Array.from(gx), gz: Float64Array.from(gz) };
  }

  // Attach an encounter. place: { ahead (m from the stem to the ice's edge along the heading), port (m the ice's edge
  // reaches to port of the ship's centreline track) }, or { X, Y } in the earth frame. ice: overrides of ICE.
  function create(sim, place, ice) {
    const P = Object.assign({}, ICE, ice || {}), m = sim.mo;
    const bands = P.depths.map(d => bandStations(sim, d, P.ds));
    // each station's tearing dent (P3b): dTear, or dTear times its region's factor
    for (const B of bands) {
      B.dt = new Float64Array(B.n);
      for (let i = 0; i < B.n; i++) {
        let f = 1;
        if (P.tearAlong) for (const [xa, xf, k, k2] of P.tearAlong) if (B.xs[i] >= xa && B.xs[i] < xf) { f = k2 === undefined ? k : k + (k2 - k) * (B.xs[i] - xa) / (xf - xa); break; }
        B.dt[i] = f === 1 ? P.dTear : P.dTear * f;
      }
      // G6b: each station's share of opening, alpha times its region's factor (P.openAlong, the form of tearAlong);
      // with none, every station's factor is 1 and the openings keep their bits
      if (P.openAlong) {
        B.fo = new Float64Array(B.n);
        for (let i = 0; i < B.n; i++) {
          let f = 1;
          for (const [xa, xf, k, k2] of P.openAlong) if (B.xs[i] >= xa && B.xs[i] < xf) { f = k2 === undefined ? k : k + (k2 - k) * (B.xs[i] - xa) / (xf - xa); break; }
          B.fo[i] = f;
        }
      }
      // C6: the stations of the bunker's own opening (P.bunkerOpen), marked only on a night that gives one
      if (P.bunkerOpen !== null && P.bunkerOpen !== undefined) {
        B.bk = new Uint8Array(B.n);
        for (let i = 0; i < B.n; i++) if (B.xs[i] >= P.bunkerAlong[0] && B.xs[i] < P.bunkerAlong[1]) B.bk[i] = 1;
      }
      // X2: the band's greatest half-breadth, and whether its stations fall from the stem aft (they do; the stretch of
      // hull within reach is found by halving, which needs it)
      B.hbMax = 0; B.desc = true;
      for (let i = 0; i < B.n; i++) { if (B.hb[i] > B.hbMax) B.hbMax = B.hb[i]; if (i && !(B.xs[i] < B.xs[i - 1])) B.desc = false; }
    }
    const R = P.depths.map((d, i) => P.R * (1 - P.taper * i));
    const rIce = R.map(r => new Float64Array(P.nodes).fill(r));
    let bX, bY;
    if (place.X !== undefined) { bX = place.X; bY = place.Y; }
    else {
      const c = C.cos(m.psi), s = C.sin(m.psi), along = C.xFwd(8) + place.ahead + R[0], across = R[0] - place.port;
      bX = m.X + along * c - across * s; bY = m.Y + along * s + across * c;
    }
    // dmax: the side's deepest dent in that band (X2; contact() keeps it: whoever else writes a dent must keep it too)
    const side = () => bands.map(b => ({ dent: new Float64Array(b.n), t0: new Float64Array(b.n).fill(-1), op: new Int32Array(b.ng).fill(-1), ga: new Float64Array(b.ng), dmax: 0 }));
    sim.enc = {
      P, bands, rIce, rTop: R, NB: P.nodes, Rmax: R[0], berg: { X: bX, Y: bY, VX: 0, VY: 0, X0: bX, Y0: bY, PSI: 0, W: 0 },
      Iz: P.mass * (1 + P.addedYaw) * R[0] * R[0] / 2,
      stbd: side(), port: side(), area: 1, minGap: 1e9, tFirst: -1, tLast: -1, Fmax: 0, crushed: 0, pending: [],
      xStem: C.xFwd(8), bow: 0, bowOp: new Int32Array(32).fill(-1),      // the stem, metres of bow crushed, its openings
      // drag deceleration per (m/s)^2: 0.5 rho Cd (2R)(draft) / (mass with added mass), draft = mass / (rho pi R^2)
      dragK: 0.5 * C.RHO * P.cdBerg * 2 * R[0] * (P.mass / (C.RHO * Math.PI * R[0] * R[0])) / (P.mass * (1 + P.added)),
    };
    return sim.enc;
  }

  // where a point at (ex, ey) from the berg's centre falls on the outline: nodes j and j1 either side, and the weight w
  // of j1 (the outline is in the berg's frame, turned by PSI). Shared by the contact law and the viewer.
  function outlineAt(e, ex, ey) {
    const n = e.NB;
    let u = (C.atan2(ey, ex) + Math.PI - e.berg.PSI) / TWO_PI * n;
    u -= n * Math.floor(u / n);
    let j = Math.floor(u); if (j >= n) j = n - 1;
    const w = u - j;
    return [j, j + 1 === n ? 0 : j + 1, w];
  }
  // contact forces for the current ship and berg states; updates dents and the ice outline
  function contact(sim, m, e, dt) {
    const P = e.P, b0 = e.berg, c = C.cos(m.psi), s = C.sin(m.psi);
    const p = P.p0 / Math.sqrt(e.area > 1 ? e.area : 1);
    let Fx = 0, Fy = 0, N = 0, roll = 0, area = 0, Tb = 0;
    // the stem: her centreline inside ice that faces her bow crushes the bow (see ICE.bowF)
    {
      const xs = e.xStem - e.bow, ex = m.X + xs * c - b0.X, ey = m.Y + xs * s - b0.Y, d2 = ex * ex + ey * ey;
      if (d2 < e.Rmax * e.Rmax && d2 > 1e-9) {
        const dist = Math.sqrt(d2), nx = ex / dist, ny = ey / dist;
        const at = outlineAt(e, ex, ey), r0 = e.rIce[0][at[0]] * (1 - at[2]) + e.rIce[0][at[1]] * at[2];
        const nxs = nx * c + ny * s, nys = -nx * s + ny * c, cax = -nxs;      // the ice's outward normal in her axes
        if (r0 - dist > 0 && cax > P.bowCos0) {
          const vb = m.v + m.r * xs;                                         // the stem's velocity against the berg's, along the normal
          const vn = -((m.u * c - vb * s - b0.VX) * nx + (m.u * s + vb * c - b0.VY) * ny);
          if (vn > 0) {
            const w = cax >= P.bowCos1 ? 1 : (cax - P.bowCos0) / (P.bowCos1 - P.bowCos0);
            const H = m.K.H, arm = xs * nys;                                 // no more force than ends the closing in this step
            const inv = nxs * nxs / (m.mass + H.mx) + nys * nys / (m.mass + H.my) + arm * arm / (m.IzG + H.Jz + m.xG * m.xG * m.mass) + 1 / (P.mass * (1 + P.added));
            const Fb = w * (P.bowF + P.bowFk * e.bow), stop = vn / (inv * dt), F = Fb < stop ? Fb : stop;
            const fx = F * nx, fy = F * ny;
            Fx += fx; Fy += fy; N += xs * c * fy - xs * s * fx;
            roll -= F * nys * (m.KG - P.bowZ);
            e.bow += w * vn * dt / cax;                                      // the stem recedes along her axis as fast as it closes
          }
        }
      }
    }
    const xFront = e.xStem - e.bow;                 // forward of this the hull is crushed away
    const far = e.Rmax + GAP_EXACT, far2 = far * far;
    // X2 (see ICE.cull): the berg's centre in her own axes, x0 forward and y0 to starboard of her origin
    const cull = P.cull !== false && e.rTop !== undefined;
    const rx = b0.X - m.X, ry = b0.Y - m.Y, x0 = rx * c + ry * s, y0 = ry * c - rx * s;
    for (let k = 0; k < e.bands.length; k++) {
      const B = e.bands[k], rI = e.rIce[k];
      for (let sd = 0; sd < 2; sd++) {
        const sg = sd === 0 ? 1 : -1, D = sd === 0 ? e.stbd[k] : e.port[k];
        let i0 = 0, i1 = B.n, lim2 = far2;
        if (cull) {
          // within reach: the band's radius as made, plus the smallest gap so far (it can only fall while this side is
          // gone through, so the reach taken here is never too short), and never beyond the old limit
          const reach = e.rTop[k] + (e.minGap > 0 ? e.minGap : 0) + CULL_EPS;
          let rw = far;
          if (reach < far) { lim2 = reach * reach; rw = reach; }
          if (B.desc && D.dmax !== undefined) {
            // this side's points lie between yLo and yHi off her centreline (a dent moves a point inboard, at most by
            // the side's deepest), so sideways they are no nearer the berg's centre than g; the stretch of hull that
            // can be within rw of it is then x0 - hw to x0 + hw, and nothing forward of the crushed bow counts
            rw += CULL_EPS;
            const yLo = sd === 0 ? -D.dmax : -B.hbMax, yHi = sd === 0 ? B.hbMax : D.dmax;
            const g = y0 > yHi ? y0 - yHi : (y0 < yLo ? yLo - y0 : 0);
            if (g > rw) continue;
            const hw = Math.sqrt(rw * rw - g * g);
            i0 = firstNotAbove(B.xs, B.n, xFront < x0 + hw ? xFront : x0 + hw); i1 = firstBelow(B.xs, B.n, x0 - hw);
          }
        }
        for (let i = i0; i < i1; i++) {
          const x = B.xs[i], y = sg * (B.hb[i] - D.dent[i]);
          if (x > xFront) continue;
          const Xw = m.X + x * c - y * s, Yw = m.Y + x * s + y * c;
          const ex = Xw - b0.X, ey = Yw - b0.Y;
          if (ex * ex + ey * ey > lim2) continue;   // out of reach: no force, and no part in the smallest gap (exact below GAP_EXACT)
          const dist = Math.sqrt(ex * ex + ey * ey);
          const at = outlineAt(e, ex, ey), j = at[0], j1 = at[1], w = at[2];
          const ov = rI[j] * (1 - w) + rI[j1] * w - dist;
          if (-ov < e.minGap) e.minGap = -ov;
          if (ov <= 0) continue;
          const fIce = p * P.h, d0 = D.dent[i];
          let f;
          if (P.q * P.h * (d0 + ov) <= fIce) { D.dent[i] = d0 + ov; f = P.q * P.h * D.dent[i]; }
          else {
            const dn = fIce / (P.q * P.h) > d0 ? fIce / (P.q * P.h) : d0;
            const crush = ov - (dn - d0), rNew = dist + (dn - d0);
            // the ice crushes back to the dented hull over the arc this station's metre of hull covers (half a metre
            // each side): the outline is clipped to rNew there, so the crushed ice is the envelope of the hull's passage
            const n = e.NB, half = 0.5 * B.ds / dist * n / TWO_PI, u = j + w;
            const lo = Math.ceil(u - half), hi = Math.floor(u + half);
            for (let q = lo; q <= hi; q++) { const jj = ((q % n) + n) % n; if (rI[jj] > rNew) rI[jj] = rNew; }
            if (rI[j] > rNew) rI[j] = rNew; if (rI[j1] > rNew) rI[j1] = rNew;
            e.crushed += crush;
            D.dent[i] = dn; f = fIce;
          }
          if (D.dent[i] > D.dmax) D.dmax = D.dent[i];
          if (D.t0[i] < 0) D.t0[i] = sim.t;
          f *= B.ds; area += P.h * B.ds * (P.aRamp > 0 ? (ov < P.aRamp ? ov / P.aRamp : 1) : 1);   // the station stands for ds metres of hull
          const nx = ex / dist, ny = ey / dist;
          // friction against the relative sliding velocity of the hull point
          const ub = m.u - m.r * y, vb = m.v + m.r * x;
          const Vx = ub * c - vb * s - b0.VX, Vy = ub * s + vb * c - b0.VY, vt = -Vx * ny + Vy * nx;
          const ft = P.vSlip > 0 ? -P.mu * f * C.tanh(vt / P.vSlip) : (vt > 0 ? -P.mu * f : (vt < 0 ? P.mu * f : 0));
          const fx = f * nx - ft * ny, fy = f * ny + ft * nx;
          Fx += fx; Fy += fy; N += (Xw - m.X) * fy - (Yw - m.Y) * fx;
          Tb += ey * fx - ex * fy;                        // the reaction's moment about the berg's centre (friction alone)
          const yB = -fx * s + fy * c;                    // the force's starboard component in the ship's axes
          roll -= yB * (m.KG - B.zs[i]);                  // core sign: a push to starboard below G heels her to port
        }
      }
    }
    e.area = area;
    const F = Math.sqrt(Fx * Fx + Fy * Fy);
    if (F > 0) { if (e.tFirst < 0) e.tFirst = m.t; e.tLast = m.t; if (F > e.Fmax) e.Fmax = F; }
    return { X: Fx * c + Fy * s, Y: -Fx * s + Fy * c, N, roll, Fx, Fy, Tb };
  }

  // C6: m2 of opening per m2 of torn excess (dent beyond the tearing dent, times the station's length) along the bunker
  // on her starboard side, so that those stations open P.bunkerOpen between them; -1 with no bunkerOpen, or while no
  // station is torn there
  function bunkerScale(e) {
    const P = e.P;
    if (P.bunkerOpen === null || P.bunkerOpen === undefined) return -1;
    let S = 0;
    for (let k = 0; k < e.bands.length; k++) {
      const B = e.bands[k], R = e.stbd[k];
      for (let i = 0; i < B.n; i++) if (B.bk[i]) { const ex = R.dent[i] - B.dt[i]; if (ex > 0) S += ex * B.ds; }
    }
    return S > 0 ? P.bunkerOpen / S : -1;
  }

  // hand torn stations to the flooding core: one opening per metre of hull, band and side, new or larger (P3c)
  function syncOpenings(sim, e) {
    const P = e.P;
    for (let sd = 0; sd < 2; sd++) {
      const D = sd === 0 ? e.stbd : e.port, kB = sd === 0 ? bunkerScale(e) : -1;
      for (let k = 0; k < e.bands.length; k++) {
        const B = e.bands[k], R = D[k], ga = R.ga;
        ga.fill(0);
        for (let i = 0; i < B.n; i++) { const ex = R.dent[i] - B.dt[i]; if (ex > 0) ga[B.gid[i]] += kB >= 0 && B.bk[i] ? kB * ex * B.ds : (B.fo ? P.alpha * ex * B.ds * B.fo[i] : P.alpha * ex * B.ds); }
        for (let g = 0; g < B.ng; g++) {
          if (ga[g] <= 0) continue;
          if (R.op[g] < 0) {
            const z = B.gz[g], x = B.gx[g], yc = C.halfBreadth(x, z) + 0.02;
            R.op[g] = C.addOpening(sim, { x, y: sd === 0 ? -yc : yc, z, area: ga[g], kind: 'breach', label: 'ice:' + k + ':' + sd + ':' + g, tOpen: 0 }).id;
          } else C.setOpeningArea(sim, R.op[g], ga[g]);
        }
      }
    }
    if (e.bow > P.bowMin) {                         // the crushed bow: every compartment the crush has reached is open, both sides
      const bx = C.zoneBounds(), xF = e.xStem - e.bow, kf = C.zoneAt(xF), z = 3.0;
      for (let k = 0; k <= kf; k++) {
        const len = (bx[k] < e.xStem ? bx[k] : e.xStem) - (bx[k + 1] > xF ? bx[k + 1] : xF);
        if (len <= 0) continue;
        for (let sd = 0; sd < 2; sd++) {
          const j = k * 2 + sd, a = P.bowOpen * len;
          if (e.bowOp[j] < 0) {
            let x = Math.max(bx[k + 1] + 0.5, Math.min(bx[k] - 1.5, xF - 0.5)), hb = C.halfBreadth(x, z);
            while (hb < 0.3 && x > bx[k + 1] + 1) { x -= 1; hb = C.halfBreadth(x, z); }
            e.bowOp[j] = C.addOpening(sim, { x, y: sd === 0 ? -(hb + 0.02) : hb + 0.02, z, area: a, kind: 'breach', label: 'bow:' + k + ':' + sd, tOpen: 0 }).id;
          } else C.setOpeningArea(sim, e.bowOp[j], a);
        }
      }
    }
  }

  function drift(e, dt) {                           // the water's drag on a moving berg (implicit, so it can only slow it)
    const b = e.berg, V = Math.sqrt(b.VX * b.VX + b.VY * b.VY);
    if (V > 0) { const k = 1 / (1 + e.dragK * V * dt); b.VX *= k; b.VY *= k; }
    if (b.W !== 0) { const rim = e.Rmax * (b.W < 0 ? -b.W : b.W); b.W /= 1 + e.dragK * rim * dt; }   // its turning, at the rim's speed
  }
  function near(sim) {
    const e = sim.enc, m = sim.mo, dx = m.X - e.berg.X, dy = m.Y - e.berg.Y;
    return dx * dx + dy * dy < (0.5 * C.G.LBP + 20 + e.Rmax + 60) * (0.5 * C.G.LBP + 20 + e.Rmax + 60);
  }
  function step(sim) {
    const e = sim.enc, m = sim.mo;
    if (!e || !near(sim)) {
      if (e) { drift(e, sim.params.dt); e.berg.X += e.berg.VX * sim.params.dt; e.berg.Y += e.berg.VY * sim.params.dt; e.berg.PSI += e.berg.W * sim.params.dt; }
      Mo.step(sim); return;
    }
    const P = e.P, dt = sim.params.dt / P.sub, Mb = P.mass * (1 + P.added);
    Mo.syncMass(sim, m);
    let roll = 0;
    for (let k = 0; k < P.sub; k++) {
      const f = contact(sim, m, e, dt);
      Mo.accelerations(m, f.X, f.Y, f.N);
      roll += Mo.heelMoment(m) + f.roll;
      Mo.advance(m, dt);
      e.berg.VX -= f.Fx / Mb * dt; e.berg.VY -= f.Fy / Mb * dt;
      if (P.turns) e.berg.W += f.Tb / e.Iz * dt;
      drift(e, dt);
      e.berg.X += e.berg.VX * dt; e.berg.Y += e.berg.VY * dt; e.berg.PSI += e.berg.W * dt;
    }
    if (m.couple) sim.xMph = roll / P.sub;
    syncOpenings(sim, e);
    Mo.seaHeads(sim);                              // P5: the sea's pressure at the openings while she moves
    C.step(sim);
  }

  // what happened, for tests and the viewer
  function summary(sim) {
    const e = sim.enc, P = e.P, out = { minGap: e.minGap, tFirst: e.tFirst, dur: e.tFirst < 0 ? 0 : e.tLast - e.tFirst, Fmax: e.Fmax,
      bergMoved: Math.sqrt((e.berg.X - e.berg.X0) * (e.berg.X - e.berg.X0) + (e.berg.Y - e.berg.Y0) * (e.berg.Y - e.berg.Y0)), bergTurned: e.berg.PSI / DEG, crushed: e.crushed };
    for (const [name, D] of [['stbd', e.stbd], ['port', e.port]]) {
      let tears = 0, dents = 0, area = 0, excess = 0, xT0 = null, xT1 = null, xD0 = null, xD1 = null, dmax = 0;
      const zone = new Float64Array(16), kB = name === 'stbd' ? bunkerScale(e) : -1;   // C6
      for (let k = 0; k < e.bands.length; k++) {
        const B = e.bands[k], R = D[k];
        for (let i = 0; i < B.n; i++) {
          const d = R.dent[i]; if (d <= 0) continue;
          const x = B.xs[i]; if (d > dmax) dmax = d;
          if (xD0 === null || x > xD0) xD0 = x; if (xD1 === null || x < xD1) xD1 = x;
          if (d > B.dt[i]) {
            tears++; excess += d - B.dt[i]; const a = kB >= 0 && B.bk[i] ? kB * (d - B.dt[i]) * B.ds : (B.fo ? P.alpha * (d - B.dt[i]) * B.ds * B.fo[i] : P.alpha * (d - B.dt[i]) * B.ds); area += a; zone[C.zoneAt(x)] += a;
            if (xT0 === null || x > xT0) xT0 = x; if (xT1 === null || x < xT1) xT1 = x;
          } else dents++;
        }
      }
      out[name] = { tears, dents, area, excess, tearFrom: xT0, tearTo: xT1, dentFrom: xD0, dentTo: xD1, dmax, zone };
    }
    // the crushed bow, if her stem went in: metres crushed, the opening it makes, and by compartment
    const bow = { crush: e.bow, area: 0, zone: new Float64Array(16) };
    if (e.bow > P.bowMin) {
      const bx = C.zoneBounds(), xF = e.xStem - e.bow, kf = C.zoneAt(xF);
      for (let k = 0; k <= kf; k++) {
        const len = (bx[k] < e.xStem ? bx[k] : e.xStem) - (bx[k + 1] > xF ? bx[k + 1] : xF);
        if (len > 0) { bow.zone[k] = 2 * P.bowOpen * len; bow.area += bow.zone[k]; }
      }
    }
    out.bow = bow;
    out.kind = out.stbd.tears + out.port.tears > 0 || bow.area > 0 ? 'holed' : (out.stbd.dents + out.port.dents > 0 ? 'dented' : 'miss');
    return out;
  }
  function setAlpha(sim, alpha) { sim.enc.P.alpha = alpha; syncOpenings(sim, sim.enc); }

  return { ICE, GAP_EXACT, create, step, near, summary, setAlpha, contact, bandStations, outlineAt };
});

/*
 * The ship's plant: the systems that depend on each other, so that a failure cascades the way it would have.
 *
 *   coal -> fires in each boiler room -> steam -> pressure -> the reciprocating engines -> the wing screws
 *                                                          -> their exhaust -> the turbine -> the centre screw
 *                                                 pressure -> the steering engines -> the rudder
 *                                                 pressure -> the dynamos -> electric light
 *   flooding: a boiler room's fires, the engine rooms, the turbine room, the dynamo flat, each knocked out by water
 *   the sea: a screw or the rudder out of the water does nothing
 *
 * Each step it reads the flooding core (water in each room, her pose) and writes what the machinery can do into
 * sim.mo.plant, which core/motion.js obeys (neutral when everything works: an intact ship gives the same bits as
 * before this module; tools/systems_tests.js and tools/astern_tests.js check it). Without the motion model (the damage
 * presets) it still runs the boilers and the dynamos, so the lights are an outcome there too.
 * Numbers: docs/research/RESEARCH_ship_systems_plant_v1_2026-11-16.md and the steering fact sheet; [read] where a source
 * gives it, [derived] where it is arithmetic on sources, [bet] where none was found. Design: docs/DESIGN_ship_systems_v1_1.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'));
  else root.TitanicSystems = factory(root.TitanicCore);
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';
  const PLANT = {
    // boiler rooms from forward, the core's zones 4 to 9: four double-ended boilers in 6, five in each of 5 to 2, five
    // single-ended in 1, 159 furnaces in all [read: The Shipbuilder 1911]; on 14 April the 24 double-ended were lit and
    // room 1 was cold [read: docs/research/RESEARCH_ship_systems_plant_v1_2026-11-16.md]. `lit` counts furnace ends.
    rooms: [
      { zone: 4, name: 'Boiler room 6', boilers: 4, ends: 2, lit: 8 }, { zone: 5, name: 'Boiler room 5', boilers: 5, ends: 2, lit: 10 },
      { zone: 6, name: 'Boiler room 4', boilers: 5, ends: 2, lit: 10 }, { zone: 7, name: 'Boiler room 3', boilers: 5, ends: 2, lit: 10 },
      { zone: 8, name: 'Boiler room 2', boilers: 5, ends: 2, lit: 10 }, { zone: 9, name: 'Boiler room 1', boilers: 5, ends: 1, lit: 0 },
    ],
    furnaceAbove: 1.0,     // m above the stokehold plates (the tank top): water there puts the fires out [bet]
    quench: 45,            // s for a room's fires to die once the water is at them [bet]
    drawTime: 1200,        // s for a room's stokers to draw its fires: room 5's 30 furnaces took 15-20 men about 20 minutes [read]
    burnOut: 900,          // s for the coal on the grates to burn down once a room's bunkers are empty [bet]
    store: 300,            // s: the steam and hot water in the boilers carry full demand this long from working pressure [bet]
    aux: 0.04,             // the auxiliaries' share of full-ahead steam: dynamos, steering, pumps [bet]
    nMax: 80,              // rpm the engines can turn at full pressure [read: 78 in normal service, 83 recorded; fact sheet section 3]
    nSteam: 78,            // rpm the boilers lit on the night hold at working pressure: her normal service maximum [read: fact
                           // sheet section 3]; the watch's 22.5 knots (about 76.5 rpm) is inside it, so an intact plant never limits her
    pEngine: 0.35,         // share of working pressure below which the main engines give nothing: above the dynamos' and the
                           // steering engines' needs, so a falling pressure stops the big consumers first, as the engineers
                           // kept the lights on to the end on the night [bet]
    pSteer: [0.25, 100 / 215],   // the steering engines: nothing below 25 %, full rate from 100 psi [read: 100 psi; the floor a bet]
    pDynamo: 0.3,          // the dynamos stop below this share of working pressure [bet]
    crank: 3.80, turbineAxis: 4.82, dynamoFlat: 1.0,   // m above the keel (R1 measured) / above the electric room's floor [bet]
    rooms2: { re: 10, te: 11, el: 12 },
    // the screws' discs and the rudder (ship frame: x, y to port, z up), m; site/visuals.js draws them from this table.
    // Stations from Engineering's side plan of 1911 (R2: docs/research/experiments/e20_screw_stations_side_plan_1911.js):
    // the wing screws 9.72 m ahead of the rudder's stock, the centre screw 3.03 m ahead of it and 3.75 m above the keel,
    // in the aperture [measured]; the wing shafts' offset and height as R1 found them [measured]
    screws: [{ x: C.G.xAP + 9.72, y: 6.0, z: 3.80, R: 23.5 * 0.3048 / 2 }, { x: C.G.xAP + 3.03, y: 0, z: 3.75, R: 17 * 0.3048 / 2 },
      { x: C.G.xAP + 9.72, y: -6.0, z: 3.80, R: 23.5 * 0.3048 / 2 }],
    // the rudder's area under water from its traced outline (below); heel [bet]. slack: the fitted rudder law holds until
    // her stern has risen this far above the night's draft aft (the blade's top half-metre works in the counter's shadow,
    // and the fit cannot resolve it); past that the outline's area counts [bet]. It keeps the 1912 encounter's bits.
    rudder: { x: -129.54, heel: 0.3, slack: 0.5 },
    // Y5: the 12 fans that blew air to the stokeholds were electric [read: the plant research note]; with the dynamos
    // stopped the fires burn on natural draught and make this share of the steam [bet: forced against natural draught]
    natDraught: 0.65,
    // Y1: the stokers fire to what she uses. With the engines idle for bankDelay s they bank the fires toward bankMargin
    // times the steam used, over bankTau s, and raise them again over raiseTau s [bets]; until then the surplus lifts the
    // safety valves: the roar from the escape pipes after the engines stopped, "through the first hour" [read: plant note].
    // idle: the engines count as idle below this share of full-ahead steam [bet]. Y1b: under way at working pressure the
    // stokers hold the fires to what she uses with the dampers and the fans, so she raises no more steam than she uses and
    // the valves stay shut at any speed she holds; once the engines are idle the surplus is more than the draught can hold
    // back, and the valves lift until the fires are banked
    bankDelay: 600, bankTau: 1200, raiseTau: 300, bankMargin: 1.2, blowEvent: 0.25, idle: 0.1,
    // Y4: two 30 kW emergency dynamos on D deck in the turbine room's casing, about 20 ft above the waterline, on their own
    // steam pipe above E deck; they ran every night and fed the emergency lights and the wireless [read: plant note].
    // Dry until the sea reaches D deck there; they need steam as the main sets do; her emergency lights are this share
    // of all her light [bet]. The stokehold fans are the main sets' load.
    // G3 (NH15's design, U0, its F3; the mainline's ruling as the plant's owner, 2026-11-23): their pipe had branches
    // from boiler rooms 5, 3 and 2, and a cross-connection by which any boiler could feed them "by opening two or three
    // valves" [read: the British Report, "Electrical Installation"; Wilding, BI 19822]. The plant keeps all its boilers'
    // steam in one store (P.p): a room whose fires are out, by the sea or by the stokers, keeps its boilers' steam in it,
    // and the main sets run on that steam after every lit room has flooded. So their pipe stands at the store's pressure
    // while it stands, whichever rooms' fires burn, and it crosses boiler room 1, where she breaks: the break takes it with
    // the mains, on the same step [derived]. Each set on its own rooms' boilers (the main sets' from rooms 1, 2 and 4)
    // needs a room's boilers to leave the store as the sea quenches them, which moves the steam that drives the engines,
    // the steering and the pumps: class C, for both sets at once
    emergency: { zone: 11, lights: 0.15 },
    breakTrimDeg: 20,      // past this trim the boilers and the steam mains give way: the break-up began about then [bet]
    breakTau: 10,          // s for the steam to go once the mains are broken [bet]
    // coal: Olympic burned 629 tons a day at 21.4 knots, so Titanic about 700 at 22 knots, which asks 95 % of full
    // firing: 750 t a day at full firing [derived]. 5,892 tons aboard at Southampton less about 4.5 days at 620 to 700
    // tons a day leaves about 3,000 tons, 3,050 t, on the night [derived] (the plant research note, items 3 and 4)
    coalPerDayFull: 750,
    coalAboard: 3050,
    psi: 215,              // working pressure [read: fact sheet section 3]
    // Y3: the steam bilge pumps (docs/research/RESEARCH_pumps_bilge_ballast_v1_2026-11-17.md): where each stood (the core's
    // zone), its rate in long tons of water an hour, all on the bilge main [read: the British Report; the ash-ejector
    // pumps' 150 is Wilding's estimate]. The ash-ejector pumps of boiler rooms 5, 3 and 2 shared a pump room with a 250 and
    // reached the bilges only by a portable pipe: left out. No pump needed the dynamos [read].
    pumps: [
      { room: 4, LTh: 150, name: 'Boiler room 6\'s ash-ejector pump' },
      { room: 5, LTh: 250, name: 'Boiler room 5\'s ballast-and-bilge pump' },
      { room: 6, LTh: 150, name: 'Boiler room 4\'s ash-ejector pump' },
      { room: 7, LTh: 250, name: 'Boiler room 3\'s ballast-and-bilge pump' },
      { room: 8, LTh: 250, name: 'Boiler room 2\'s ballast-and-bilge pump' },
      { room: 10, LTh: 250, name: 'A ballast pump in the reciprocating engine room' },
      { room: 10, LTh: 250, name: 'The other ballast pump in the reciprocating engine room' },
      { room: 10, LTh: 150, name: 'A bilge pump in the reciprocating engine room' },
      { room: 10, LTh: 150, name: 'The other bilge pump in the reciprocating engine room' },
      { room: 11, LTh: 150, name: 'The turbine room\'s bilge pump' },
    ],
    // what each zone's own suctions take at 2.5 m/s, LT/h [derived there]; 0 where nothing could be pumped: the peaks had no
    // suction, and the holds' valves stood in the firemen's passage, holed within minutes [read]
    suction: [0, 0, 0, 0, 345, 367, 345, 367, 367, 310, 591, 541, 225, 196, 196, 0],
    mainLTh: 920,          // what pumps standing elsewhere draw from one zone through the two 10-in mains [derived there]
    pumpOwn: 300,          // s from water in a room to its own pumps working [bet: "soon after the collision" in boiler room 5]
    pumpLent: 1800,        // s to lead pumps from dry rooms to it through the main [bet: boiler room 3's on 4 from about 12:10]
    // G18 (the calibration epoch's C2), dark until the epoch lands. leadRule 0: the room is judged lost or not at the
    // moment the led pumps would start (pumpT + pumpLent), yes or no: a step in every input. leadRule 1 (the design's
    // "e with d" as the mainline revised it): the room is judged once, when its own pumps start (pumpT + pumpOwn:
    // Wilding's half hour runs "from decision to start"), by whether the pumps can hold it, not by its depth (the night's
    // record has a deep boiler room 4 pumped through the main to about T 148, and boiler room 6 given up at once): its
    // mean inflow since water was seen, against its own pumps' rate with what the lead would bring. All of the lead at
    // a ratio of 1 or under, none at leadRatio or over, linear between [bet]. A room given none takes no pump from the
    // others; the pumps led start at pumpT + pumpLent and run as under rule 0.
    leadRule: 1,   // the calibration epoch's landing (D4): C2's rule, judged by inflow (G18)
    doorsHeld: false,   // D112's what-if (e120's bracket): the doors the engineers raise are held open, their floats disarmed
    leadRatio: 3,          // inflow over the pumps' rate at which a room is given up [bet]
    pumpPsi: [30, 80],     // psi at the pumps: nothing below, their full rate above, linear between [bet: direct-acting pumps]
    // Y6: the holds' own suctions for an order from the bridge, LT/h at 2.5 m/s (hold 1: 2 x 3.5 in; holds 2 and 3: 2 x 3.5
    // and 2 x 3 in) [derived in the note, section 5.1], through the forward mains while their valves can be worked. The
    // valves stood in the firemen's passage [read: the Report, "Pumping Arrangements"]; it is taken as flooded, and the
    // valves lost, once the water in hold 2 or 3 stands over its top (the core's params.zMergeHold) [bet]; on the night it
    // was holed within about five minutes [read]. The engineers' rules leave the holds alone, as on the night (`suction`).
    holdSuction: [0, 113, 196, 196],
  };
  const LTH = 1 / 3632;    // long tons of sea water an hour, in m3/s

  // The rudder's trailing edge, traced from the photograph of the stern castings (The Shipbuilder 1911, Fig. 17):
  // [height above the heel, chord from the stock's axis], m [measured, R1; docs/research/RESEARCH_stern_gear_wake_lights_v1_1].
  // Its chords are scaled so that the area under the night's draft aft is the plans' 401.63 sq ft (site/visuals.js draws it).
  const RUDDER_TRACE = [[0, 0.62], [0.22, 1.10], [0.84, 1.82], [1.77, 2.89], [3.02, 3.61], [4.26, 4.05], [5.50, 4.26],
    [6.75, 4.32], [8.00, 4.32], [9.24, 4.14], [10.48, 3.84], [11.72, 3.31], [12.97, 2.62], [14.21, 1.82], [15.46, 1.04],
    [16.70, 0.54], [17.63, 0.36], [17.95, 0]];
  function rudderArea(T, h) {                     // area of the outline from the heel up to h, m2 (trapezoids)
    let A = 0;
    for (let i = 1; i < T.length; i++) {
      const h0 = T[i - 1][0], h1 = Math.min(T[i][0], h); if (h1 <= h0) break;
      const c1 = T[i - 1][1] + (T[i][1] - T[i - 1][1]) * (h1 - h0) / (T[i][0] - h0);
      A += 0.5 * (T[i - 1][1] + c1) * (h1 - h0);
    }
    return A;
  }
  const RUDDER_NIGHT = rudderArea(RUDDER_TRACE, 33.75 * 0.3048 - PLANT.rudder.heel);   // under the night's draft aft (10.29 m)

  function attach(sim, opts) {
    opts = opts || {};
    const R = PLANT.rooms, litTotal = R.reduce((a, r) => a + r.lit, 0);
    const coal = Float64Array.from(R.map(r => r.lit > 0 ? PLANT.coalAboard * r.lit / litTotal : 0));
    if (opts.coal !== undefined) for (let k = 0; k < R.length; k++) coal[k] = R[k].lit > 0 ? opts.coal * R[k].lit / litTotal : 0;
    sim.plant = {
      fires: Float64Array.from(R.map(r => (r.lit > 0 ? 1 : 0))), out: new Uint8Array(R.length), drawn: new Uint8Array(R.length), coal, litTotal,
      p: 1, gen: 1, can: 1, demand: PLANT.aux, re: false, te: false, el: false, power: true, broken: false, events: {},
      firing: 1, idle: 0, blow: 0, emWet: false, emergency: true, lights: 1,
      // Y3: the engineers put the pumps to work on a ship under way (a watch); a scenario with its own schedule (the
      // 1912 damage) and the damage presets keep theirs
      doctrine: opts.pumps === undefined ? (!sim.pumpScripted && !!sim.mo) : !!opts.pumps,
      pumpT: new Float64Array(16).fill(-1), pumpLed: new Uint8Array(16), pumpOwnLTh: new Float64Array(16), pumpUsed: new Uint8Array(PLANT.pumps.length),
      // Y6: the entry in sim.pumpSched each pump works under (-1: none yet), whether the bridge has the pumps (the
      // engineers' rules then wait), when the firemen's passage flooded (-1: dry), and the orders counted for the log
      pumpOn: new Int32Array(PLANT.pumps.length).fill(-1), pumpBridge: false, passageT: -1, pumpN: 0,
      // D112: the doors the engineers raise by hand on a night whose record says so (DOORS_RAISED, by the spec's key),
      // the schedule's entries done, and each door raised (its bulkhead, when, why)
      doorsRaised: opts.doorsRaised && DOORS_RAISED[opts.doorsRaised] ? opts.doorsRaised : null, raisedN: 0, raised: [],
    };
    if (sim.mo) sim.mo.plant = { nMax: [PLANT.nMax, PLANT.nMax], turbine: true, steer: true, steerRate: 1, imm: [1, 1, 1], rudImm: 1 };
    // Y2: the floats under the floors arm the tank-top doors (bulkheads D to O); a door a scenario holds open (jammed, or
    // left open on purpose) stays unarmed. The bridge's switch starts off.
    sim.plant.doorSwitch = false;
    if (sim.doorFloat) for (let b = 0; b < LOW.length; b++) sim.doorFloat[b] = LOW[b] && !sim.doorOpen[b] ? 1 : 0;
    return sim.plant;
  }

  // Y2, the watertight doors. Twelve at the tank top, held open by friction clutches, were released all at once from the
  // bridge by electromagnets, so the bridge's switch needs current from the main dynamos [read: the British Report,
  // "Electrical Installation": "The watertight doors were released by electric magnets."; the plant note, section 7].
  // Without current a float under the floor of each compartment releases the doors into it, and a lever at each door
  // releases it by hand (the core: releaseDoor, doorsStep). Reopening was by hand, a pump handle and two or three men,
  // with the bridge's switch off ("Doors cannot ... be operated mechanically whilst switch is on"): opening a door by
  // hand here turns the switch off, and it opens at once [bet: the time it took is not modelled].
  const LOW = C.BULKHEADS.map(b => b.doors.some(d => d[0] === 'low'));
  // the bridge's switch: true if it released the doors, false if it had no current
  function bridgeDoors(sim) {
    const P = sim.plant;
    if (P && !P.power) { event(sim, 'doorsDead@' + sim.t, 'The bridge\'s switch for the watertight doors: no current, the magnets release nothing'); return false; }
    if (P) P.doorSwitch = true;
    for (let b = 0; b < LOW.length; b++) if (LOW[b]) C.releaseDoor(sim, b, 'from the bridge');
    return true;
  }
  function openDoor(sim, b) { if (sim.plant) sim.plant.doorSwitch = false; C.setDoor(sim, b, true); }
  function closeDoor(sim, b) { return C.releaseDoor(sim, b, 'by hand'); }

  // D112 (docs/DESIGN_D112_the_engineers_raise_the_after_doors_v1_2026-11-24.md): on the 1912 night the engineers raised
  // watertight doors by hand [read: docs/research/RESEARCH_tanks_counterflooding_door_schedule_v1_2026-11-17.md, section
  // 8, "medium": G, H, J and K from about T 30 on the chief engineer's order, to reach the pumps and valves; L, M, N and
  // O fully at about T 60 to 65, to fetch the 10-in suction pipe; none shut again by hand]. O's 2 ft at T 30 to 35 is not
  // modelled (a door here is open or shut). It is the engineers' own act, not the bridge's: no order in the watch's log,
  // no report to the bridge (there was no door indicator on the bridge, Olliver: the same note). A raised door's float
  // stays armed, as the yard built it, so its own float drops it when water stands over the floor on either side
  // (core.js doorsStep). e120: the 1912 watch with this schedule is the same night to the bit up to the hand-over.
  // PLANT.doorsHeld (a what-if, e120's bracket, never the default) disarms each raised door's float.
  const DOORS_RAISED = {
    1912: [
      { T: 30, ids: 'GHJK', why: 'to reach the pumps and valves, on the chief engineer\'s order' },
      { T: 62, ids: 'LMNO', why: 'to fetch the 10-in suction pipe' },
    ],
  };
  // whether the water stands at a float's depth on either side of bulkhead b (the core's own test, doorsStep)
  function floatWet(sim, b) {
    for (let k = b; k <= b + 1; k++) for (let sd = 0; sd < 2; sd++) {
      const n = C.nodeIndex(k, sd, 0);
      if (sim.vol[n] > 1e-6 && sim.level[n] - sim.zmin[n] > sim.params.floatDepth) return true;
    }
    return false;
  }
  function raiseDoors(sim, P) {
    const list = DOORS_RAISED[P.doorsRaised], T = (sim.t - sim.night.tTouch) / 60;
    while (P.raisedN < list.length && T >= list[P.raisedN].T) {
      const e = list[P.raisedN], done = [];
      for (const id of e.ids) {
        const b = C.BULKHEADS.findIndex(x => x.id === id);
        if (b < 0 || sim.doorOpen[b] || floatWet(sim, b)) continue;   // already open, or water at it: no man raises it into water
        openDoor(sim, b);
        if (PLANT.doorsHeld) sim.doorFloat[b] = 0;
        done.push(id); P.raised.push({ id, t: sim.t, why: e.why });
      }
      if (done.length) event(sim, 'raised' + P.raisedN, 'The engineers raise the doors in bulkhead' + (done.length > 1 ? 's ' : ' ') + done.join(', ') + ' by hand, ' + e.why);
      P.raisedN++;
    }
  }

  // is the water in room k at height h (m above its floor, ship frame) or above?
  function wet(sim, F, k, hAbove) {
    const Z = sim.ship.zones[k], thr = C.worldZ(F, 0.5 * (Z.xa + Z.xf), 0, Z.floor + hAbove);
    for (let s = 0; s < 4; s++) { const n = k * 4 + s; if (sim.vol[n] > 0.5 && sim.level[n] >= thr) return true; }
    return false;
  }
  // the share of a disc of radius R whose centre is d below the surface (negative: above) that is under water
  function immersed(d, R) {
    if (d >= R) return 1; if (d <= -R) return 0;
    const c = d / R; return 1 - (C.acos(c) - c * Math.sqrt(1 - c * c)) / Math.PI;
  }
  function event(sim, id, label) { const P = sim.plant; if (P.events[id]) return; P.events[id] = sim.t; sim.events.push({ t: sim.t, id: 'plant:' + id, label }); }

  function step(sim, dt) {
    const P = sim.plant; if (!P) return;
    dt = dt || sim.params.dt;
    if (P.doorsRaised && sim.night && sim.night.tTouch >= 0) raiseDoors(sim, P);   // D112: the engineers' doors (the 1912 night)
    const F = C.frameOf(sim), R = PLANT.rooms, m = sim.mo;
    // past a steep trim the boilers and the steam mains give way (the break-up): no steam made, what is left escapes
    if (!P.broken && sim.pitch > PLANT.breakTrimDeg * Math.PI / 180) { P.broken = true; event(sim, 'break', 'Her boilers and steam mains give way as she rises'); }
    // the boiler rooms: water at the furnaces puts the fires out for good; a room out of coal dies down
    let gen = 0;
    for (let k = 0; k < R.length; k++) {
      if (!P.out[k] && R[k].lit > 0 && wet(sim, F, R[k].zone, PLANT.furnaceAbove)) { P.out[k] = 1; event(sim, 'flood' + k, R[k].name + ' flooded: its fires are out'); }
      if (P.fires[k] > 0) {                       // fires never come back: water, the stokers' rakes, or no coal
        const tau = P.out[k] ? PLANT.quench : (P.drawn[k] ? PLANT.drawTime : (P.coal[k] <= 0 ? PLANT.burnOut : 0));
        if (tau > 0) P.fires[k] = Math.max(0, P.fires[k] - dt / tau);
        if (P.coal[k] <= 0 && !P.out[k] && !P.drawn[k]) event(sim, 'coal' + k, R[k].name + ': the bunkers are empty; the fires burn down');
      }
      gen += R[k].lit * P.fires[k];
    }
    const litOn = gen;                            // the fires' own weight, before the draught and the firing scale it (F1)
    if (P.broken) gen = 0;
    // the stokehold fans run on the dynamos: without them the fires make less (the lights as they stood last step)
    if (!P.power) { gen *= PLANT.natDraught; if (gen > 0) event(sim, 'fans', 'The stokehold fans stop with the dynamos: the fires burn on natural draught'); }
    // the stokers' firing (Y1): full unless the engines have stood idle long enough to bank the fires (last step's demand)
    const cap = gen / P.litTotal;
    P.idle = P.demand < PLANT.idle ? P.idle + dt : 0;
    const fTgt = P.idle > PLANT.bankDelay && cap > 0 ? Math.min(1, Math.max(0.05, PLANT.bankMargin * P.demand / cap)) : 1;
    if (P.firing !== fTgt) P.firing += (fTgt - P.firing) * dt / (fTgt < P.firing ? PLANT.bankTau : PLANT.raiseTau);
    gen *= P.firing;
    P.can = gen / P.litTotal;                     // the steam the fires can raise at their firing
    // demand: the engines' power goes as the cube of their revolutions; the auxiliaries take the rest
    const nP = m ? m.nP : 0, nS = m ? m.nS : 0, f = PLANT.nSteam * PLANT.nSteam * PLANT.nSteam;
    P.demand = PLANT.aux + (1 - PLANT.aux) * ((Math.abs(nP) * nP * nP + Math.abs(nS) * nS * nS) / (2 * f));
    // the boilers banked when supply exceeds demand (pressure held at the safety valves); drawn down when it does not
    P.p = P.broken ? Math.max(0, P.p - dt / PLANT.breakTau) : Math.max(0, Math.min(1, P.p + (P.can - P.demand) * dt / PLANT.store));
    if (P.p < 0.8) event(sim, 'p80', 'Steam pressure falling: ' + Math.round(P.p * PLANT.psi) + ' psi');
    // the steam raised (Y1b): at working pressure with the engines working, what she uses (PLANT.idle's note); else all
    // the fires can raise. The pressure above moves as it did before Y1b, to the bit, and so does the coal below
    P.gen = P.p >= 1 && P.demand >= PLANT.idle && P.can > P.demand ? P.demand : P.can;
    // at the safety valves with steam to spare: it blows off (Y1)
    P.blow = P.p >= 1 && P.gen > P.demand ? P.gen - P.demand : 0;
    if (P.blow > PLANT.blowEvent) event(sim, 'blowoff', 'Her safety valves lift: steam roars from the escape pipes on her funnels');
    if (P.firing < 0.5) event(sim, 'banked', 'The stokers bank the fires: the roar dies away');
    // coal burnt for the steam actually raised, shared among the rooms by their fires' weight, so that the shares sum to
    // one. F1 (NH15's design, U0; the mainline's ruling 2026-11-23): the share divided by gen after the draught and the
    // firing had scaled it, so a banked step burned up to 20 times its steam's coal. No bunker empties on the night, so
    // nothing else moved; the bunkers' readouts did
    const burn = Math.min(P.gen, P.demand) * PLANT.coalPerDayFull / 86400 * dt;
    if (gen > 0 && litOn > 0) for (let k = 0; k < R.length; k++) if (P.fires[k] > 0) P.coal[k] = Math.max(0, P.coal[k] - burn * R[k].lit * P.fires[k] / litOn);
    // the engine rooms, the turbine room, the dynamo flat
    if (!P.re && wet(sim, F, PLANT.rooms2.re, PLANT.crank - sim.ship.zones[PLANT.rooms2.re].floor)) { P.re = true; event(sim, 're', 'Reciprocating engine room flooded: both engines stop'); }
    if (!P.te && wet(sim, F, PLANT.rooms2.te, PLANT.turbineAxis - sim.ship.zones[PLANT.rooms2.te].floor)) { P.te = true; event(sim, 'te', 'Turbine room flooded: the turbine stops'); }
    if (!P.el && wet(sim, F, PLANT.rooms2.el, PLANT.dynamoFlat)) { P.el = true; }
    const power = !P.el && P.p > PLANT.pDynamo;
    // the emergency dynamos on D deck (Y4): dry until the sea reaches D deck at their room; steam from the one store, as
    // the main sets (G3's ruling, at PLANT.emergency)
    if (!P.emWet) { const ez = PLANT.emergency.zone, Z = sim.ship.zones[ez]; if (wet(sim, F, ez, C.deckZ('D', 0.5 * (Z.xa + Z.xf)) - Z.floor)) P.emWet = true; }
    const emergency = !P.emWet && P.p > PLANT.pDynamo;
    const lights = power ? 1 : (emergency ? PLANT.emergency.lights : 0);
    if (P.power && !power && lights > 0) event(sim, 'mainDark', P.el ? 'Water reaches the main dynamos: only the emergency dynamos on D deck light her now' : 'The main dynamos stop: only the emergency dynamos light her now');
    if (P.lights > 0 && lights === 0) event(sim, 'dark', P.el || P.emWet ? 'The last dynamos stop: the ship goes dark' : 'The dynamos stop for want of steam: the ship goes dark');
    P.power = power; P.emergency = emergency; P.lights = lights;
    // Y3: the pumps run on steam alone: their share of their rate at this pressure; and the engineers' orders
    { const psi = P.p * PLANT.psi, a = PLANT.pumpPsi[0], b = PLANT.pumpPsi[1]; sim.pumpScale = psi >= b ? 1 : (psi <= a ? 0 : (psi - a) / (b - a)); }
    // Y6: the firemen's passage, where the forward holds' bilge valves stood, runs along the tank top between the two halves
    // of holds 2 and 3: flooded once their water stands over its top (PLANT.holdSuction) [bet]. It is only read by orders.
    if (P.passageT < 0) for (let k = 2; k <= 3; k++) if (wet(sim, F, k, sim.params.zMergeHold - sim.ship.zones[k].floor)) { P.passageT = sim.t; break; }
    if (P.doctrine) pumpOrders(sim, P);
    if (!m || !m.plant) return;
    // what the machinery can do, for core/motion.js
    const L = m.plant, pe = (P.p - PLANT.pEngine) / (1 - PLANT.pEngine);
    const nMax = P.re ? 0 : (pe >= 1 ? PLANT.nMax : (pe <= 0 ? 0 : PLANT.nMax * C.cbrt(pe)));
    L.nMax[0] = nMax; L.nMax[1] = nMax;
    const want = Math.max(Math.abs(m.setP), Math.abs(m.setS));      // the revolutions the bridge has ordered
    if (nMax < want - 0.5) event(sim, 'slow', P.re ? 'The engines have stopped' : 'The engines cannot make the revolutions ordered: steam for ' + Math.round(nMax) + ' rpm');
    if (nMax <= 0 && !P.re) event(sim, 'nosteam', 'The engines have no steam');
    L.turbine = !P.te;
    const sr = (P.p - PLANT.pSteer[0]) / (PLANT.pSteer[1] - PLANT.pSteer[0]);
    L.steerRate = sr >= 1 ? 1 : (sr <= 0 ? 0 : sr); L.steer = L.steerRate > 0;
    if (!L.steer) event(sim, 'steer', 'The steering engines have no steam: the rudder stays where it is');
    for (let k = 0; k < 3; k++) { const s = PLANT.screws[k]; L.imm[k] = immersed(-C.worldZ(F, s.x, s.y, s.z), s.R); }
    const imm = L.imm[0] + L.imm[1] + L.imm[2];
    if (imm < 2.9) event(sim, 'screws', 'The tips of her screws are breaking the surface');
    if (imm < 1.5) event(sim, 'screwsHalf', 'Her screws are half out of the water: what they push falls with it');
    if (imm < 0.05) event(sim, 'screwsOut', 'Her screws are out of the water: no engine order can move her');
    // the rudder's area under water against the night's: the sea's height up the blade, through its traced outline
    const ru = PLANT.rudder, wl = (-(F.R20 * ru.x + F.tz) / F.R22) - ru.heel + ru.slack;
    const ra = wl <= 0 ? 0 : rudderArea(RUDDER_TRACE, wl) / RUDDER_NIGHT;
    L.rudImm = ra >= 1 ? 1 : ra;
  }

  // Y3, the engineers on a ship under way: water first seen in a room with suctions puts its own pumps to work
  // PLANT.pumpOwn later, and pumps standing in dry rooms are led to it through the main PLANT.pumpLent later, nearest
  // first, up to its suctions and what the mains carry; a room already lost when they would start (water over the core's
  // params.pumpAbandon) is given up [bets on the night's practice: boiler room 6 abandoned at once, 5 and 4 pumped]. A
  // pump works for one room only. The 1912 damage preset carries the night's own schedule instead (core/scenarios.js).
  function roomWater(sim, k) { let w = 0; for (let s = 0; s < 4; s++) w += sim.vol[k * 4 + s]; return w; }
  const lc = (s) => s.charAt(0).toLowerCase() + s.slice(1);
  function roomLost(sim, k) {
    for (let sd = 0; sd < 2; sd++) { const n = C.nodeIndex(k, sd, 0); if (sim.vol[n] > 1e-6 && sim.level[n] - sim.zmin[n] > sim.params.pumpAbandon) return true; }
    return false;
  }
  // G18, PLANT.leadRule 1: room k judged, once, when its own pumps start: its mean inflow since water was seen (before
  // any pump drew; over the time since, if the bridge had the pumps then) against its own pumps with the lead's most.
  // The judgement is plain data in the plant's state (sim.plant.pumpJudge, made only under this rule, so that the
  // state under rule 0 is what it was): w0 the room's water when first seen, m3; qin and qcap, m3/s; g, -1 until judged.
  function judgeRoom(sim, P, J, k) {
    const qin = (roomWater(sim, k) - J.w0[k]) / (sim.t - P.pumpT[k]);
    const qcap = (P.pumpOwnLTh[k] + Math.max(0, Math.min(PLANT.suction[k] - P.pumpOwnLTh[k], PLANT.mainLTh))) * LTH;
    const r = qcap > 0 ? qin / qcap : Infinity, R = PLANT.leadRatio;
    J.qin[k] = qin; J.qcap[k] = qcap;
    J.g[k] = r <= 1 ? 1 : (r >= R ? 0 : (R - r) / (R - 1));
  }
  function pumpOrders(sim, P) {
    const Pp = PLANT.pumps, graded = PLANT.leadRule === 1;
    const J = graded ? (P.pumpJudge || (P.pumpJudge = { w0: new Float64Array(16), qin: new Float64Array(16), qcap: new Float64Array(16), g: new Float64Array(16).fill(-1) })) : null;
    for (let k = 0; k < 16; k++) {
      if (!(PLANT.suction[k] > 0)) continue;
      if (P.pumpT[k] < 0) {                         // water first seen here: its own pumps, which stay on it
        if (roomWater(sim, k) < 1) continue;
        P.pumpT[k] = sim.t; if (graded) J.w0[k] = roomWater(sim, k);
        for (let i = 0; i < Pp.length; i++) {
          if (P.pumpUsed[i] || Pp[i].room !== k) continue;
          P.pumpUsed[i] = 1; P.pumpOwnLTh[k] += Pp[i].LTh; P.pumpOn[i] = sim.pumpSched.length;
          C.addPump(sim, { zone: k, room: k, q: Pp[i].LTh * LTH, t0: sim.t + PLANT.pumpOwn, label: Pp[i].name });
        }
        event(sim, 'pumps' + k, 'Water in ' + lc(C.ZONES[k].name) + ': the engineers put its pumps on it');
        continue;
      }
      if (graded && J.g[k] < 0 && sim.t >= P.pumpT[k] + PLANT.pumpOwn) judgeRoom(sim, P, J, k);
      if (P.pumpLed[k] || sim.t < P.pumpT[k] + PLANT.pumpLent) continue;
      P.pumpLed[k] = 1;                             // time to lead more pumps to it, from rooms still dry, unless it is lost
      let cap = Math.min(PLANT.suction[k] - P.pumpOwnLTh[k], PLANT.mainLTh), full = PLANT.suction[k] - P.pumpOwnLTh[k];
      // G18: under the graded rule the room's judgement says how much is led; a room given none takes no pump
      if (graded) { cap *= J.g[k] < 0 ? 1 : J.g[k]; full = cap; if (!(cap > 0)) continue; }
      else if (roomLost(sim, k)) continue;
      const idle = [];
      for (let i = 0; i < Pp.length; i++) if (!P.pumpUsed[i] && Pp[i].room !== k && roomWater(sim, Pp[i].room) < 1) idle.push(i);
      idle.sort((i, j) => Math.abs(Pp[i].room - k) - Math.abs(Pp[j].room - k) || i - j);
      for (const i of idle) {
        if (!(cap > 0)) break;
        const q = Math.min(Pp[i].LTh, cap); cap -= q; P.pumpUsed[i] = 1; P.pumpOn[i] = sim.pumpSched.length;
        C.addPump(sim, { zone: k, room: Pp[i].room, q: q * LTH, t0: sim.t, label: Pp[i].name + ', on ' + lc(C.ZONES[k].name) + ' through the main' });
      }
      if (cap < full) event(sim, 'led' + k, 'Pumps led to ' + lc(C.ZONES[k].name) + ' through the bilge main');
    }
  }

  // Y6, the bridge's orders to the pumps: pumpOrder(sim, room, which), logged on a watch by core/night.js as 'pump'
  //   room 0-15, which a pump's index in PLANT.pumps, 'own' or 'all': that pump, the room's own pumps, or every free pump
  //     that can reach it, put on the room; which 'off': every pump on the room taken off
  //   room -1, which a pump's index: that pump taken off; which 'engineers': the pumps handed back to the engineers' rules
  //     (pumpOrders above), which go on from where the pumps then stand
  // An order carried out takes the pumps from the engineers until they are handed back. Its times are the rules' own
  // [bets]: a pump put on the room it stands in works PLANT.pumpOwn after the order (its steam valve opened in its pump
  // room, Barrett BI 2111; "soon after the collision", the Court); one led to another room through the bilge main works
  // PLANT.pumpLent after it (to couple a pump to boiler room 4, "half an hour from decision to start" would be good going,
  // Wilding BI 20684-20685; Halpern's 12:10). A pump taken off stops at once [bet: its steam valve shut]; a pump moved is
  // taken off its room and led anew. What a room takes [the note, section 5.1]: a pump on its own room works at its full
  // rate on that room's suctions, less what pumps led through the main already draw from them (as the rules have it);
  // pumps led through the main draw what is left of the room's suctions, and at most PLANT.mainLTh in all. Steam scales
  // them all (sim.pumpScale), and the core stops a pump for good when the room it stands in floods. Refused, changing
  // nothing, with the reason in plain words: no steam; a peak (no suction); a hold once the firemen's passage has flooded;
  // a pump whose room has flooded (its crew has gone); a room whose suctions or mains take no more; no free pump.
  // Returns { ok: false, why } or { ok: true, text, short } (short: one line, for the page's notice), and says it in
  // sim.events either way.
  const cap1 = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  function roomName(k) { const Z = C.ZONES[k], n = Z.name; return n.charAt(0) === 'N' ? n : (Z.peak || Z.kind === 'engine' || Z.kind === 'tunnel' ? 'the ' : '') + lc(n); }
  const pumpName = (i) => lc(PLANT.pumps[i].name);
  const isPump = (i) => Number.isInteger(i) && i >= 0 && i < PLANT.pumps.length;
  // the entry pump i works under now (sim.pumpSched), or null: none, or it has stopped
  function onNow(sim, P, i) { const j = P.pumpOn[i], e = j >= 0 ? sim.pumpSched[j] : null; return e && !e.off ? e : null; }
  // LT/h drawn from room k by the pumps on it: its own, and those led to it through the main
  function loadOn(sim, k) {
    let own = 0, led = 0;
    for (const e of sim.pumpSched) if (!e.off && e.zone === k) { if (e.room === k) own += e.q / LTH; else led += e.q / LTH; }
    return { own, led };
  }
  // what room k's suctions take on an order, LT/h, or why nothing can be drawn from it
  function suctionFor(P, k) {
    if (C.ZONES[k].peak) return { lth: 0, why: cap1(roomName(k)) + ' has no bilge suction: no pump can draw from it' };
    if (PLANT.holdSuction[k] > 0) return P.passageT >= 0 ? { lth: 0, why: cap1(roomName(k)) + '\'s bilge valves stand in the firemen\'s passage, and it has flooded' } : { lth: PLANT.holdSuction[k] };
    return { lth: PLANT.suction[k] };
  }
  // what pump i would draw from room k, LT/h, with L on it already and its suctions S; or why nothing
  function drawOn(i, k, L, S) {
    const own = PLANT.pumps[i].room === k, left = own ? S.lth - L.led : S.lth - L.own - L.led, main = own ? Infinity : PLANT.mainLTh - L.led;
    if (!(left >= 0.5)) return { q: 0, own, why: cap1(roomName(k)) + '\'s suctions take no more' };
    if (!(main >= 0.5)) return { q: 0, own, why: 'The bilge mains carry no more to ' + roomName(k) };
    return { q: Math.min(PLANT.pumps[i].LTh, left, main), own };
  }
  function takeOff(sim, P, i) { const e = onNow(sim, P, i); if (!e) return false; e.off = true; e.tOff = sim.t; e.taken = true; P.pumpOn[i] = -1; P.pumpUsed[i] = 0; return true; }
  function putOn(sim, P, i, k, q) {
    const p = PLANT.pumps[i], own = p.room === k;
    takeOff(sim, P, i);                             // a pump moved comes off its room first
    P.pumpOn[i] = sim.pumpSched.length; P.pumpUsed[i] = 1;
    C.addPump(sim, { zone: k, room: p.room, q: q * LTH, t0: sim.t + (own ? PLANT.pumpOwn : PLANT.pumpLent), label: p.name + (own ? '' : ', on ' + roomName(k) + ' through the main') });
  }
  function said(sim, P, label) { sim.events.push({ t: sim.t, id: 'plant:pump' + (++P.pumpN), label }); }
  function pumpOrder(sim, room, which) {
    const P = sim.plant, Pp = PLANT.pumps;
    if (!P) return { ok: false, why: 'No plant: there is nobody to give the order to' };
    const no = (why) => { said(sim, P, 'Pumps: an order that cannot be carried out. ' + why); return { ok: false, why }; };
    const yes = (text, short) => {                  // (no "bridge" in the log's words: the forecast picks out "Water reaches the bridge")
      const first = !P.pumpBridge; P.pumpBridge = true; P.doctrine = false;
      said(sim, P, 'Pumps, by order: ' + text + (first ? '. The engineers now wait for orders' : ''));
      return { ok: true, text: cap1(text), short };
    };
    if (which === 'engineers') {
      if (!P.pumpBridge) return no(P.doctrine ? 'The engineers have the pumps already' : 'The pumps are not under orders: there is nothing to hand back');
      P.pumpBridge = false; P.doctrine = true;
      for (let k = 0; k < 16; k++) { const L = loadOn(sim, k); P.pumpOwnLTh[k] = L.own + L.led; }   // the rules' account of what is on each room
      said(sim, P, 'Pumps: handed back to the engineers. Their rules from now on: a room\'s own pumps on it when water comes in, more led to it through the main later');
      return { ok: true, text: 'The pumps are the engineers\' again', short: 'The pumps are the engineers\' again' };
    }
    if (room === -1) {                              // one pump taken off, wherever it is
      if (!isPump(which)) return no('There is no such pump');
      const e = onNow(sim, P, which);
      if (!e) return no(cap1(pumpName(which)) + ' is not at work, nor being rigged');
      takeOff(sim, P, which);
      return yes(pumpName(which) + ' taken off ' + roomName(e.zone), cap1(pumpName(which)) + ' taken off');
    }
    if (!(Number.isInteger(room) && room >= 0 && room < 16)) return no('There is no such room');
    if (which === 'off') {                          // every pump taken off the room
      const on = []; for (let i = 0; i < Pp.length; i++) { const e = onNow(sim, P, i); if (e && e.zone === room) on.push(i); }
      if (!on.length) return no('No pump is on ' + roomName(room));
      for (const i of on) takeOff(sim, P, i);
      const t = (on.length === 1 ? pumpName(on[0]) : on.length + ' pumps') + ' taken off ' + roomName(room);
      return yes(t, cap1(t));
    }
    const S = suctionFor(P, room);
    if (!(S.lth > 0)) return no(S.why);
    if (!(sim.pumpScale > 0)) return no('No steam for the pumps: ' + (P.p * PLANT.psi).toFixed(1) + ' psi in the boilers, and they stop at ' + PLANT.pumpPsi[0]);
    const lost = (i) => roomLost(sim, Pp[i].room);
    let cands;
    if (which === 'own' || which === 'all') {
      const own = [], other = [];
      for (let i = 0; i < Pp.length; i++) {
        const e = onNow(sim, P, i);
        if (Pp[i].room === room) { if (!(e && e.zone === room) && (which === 'own' || !e)) own.push(i); }   // 'all' takes free pumps only
        else if (which === 'all' && !e && !lost(i)) other.push(i);
      }
      if (which === 'own') {
        if (!Pp.some(p => p.room === room)) return no(cap1(roomName(room)) + ' has no pump of its own: lead one to it through the main');
        if (!own.length) return no('The pumps of ' + roomName(room) + ' are on it already');
      }
      if (own.length && roomLost(sim, room)) { if (which === 'own') return no(cap1(roomName(room)) + ' has flooded: the crews of its pumps have gone'); own.length = 0; }
      other.sort((i, j) => Math.abs(Pp[i].room - room) - Math.abs(Pp[j].room - room) || i - j);   // nearest first, as the rules
      cands = own.concat(other);
      if (!cands.length) return no('No free pump can reach ' + roomName(room) + ': each is at work or its room has flooded');
    } else {
      if (!isPump(which)) return no('There is no such pump');
      const e = onNow(sim, P, which);
      if (e && e.zone === room) return no(cap1(pumpName(which)) + ' is on ' + roomName(room) + ' already');
      if (lost(which)) return no(cap1(pumpName(which)) + ': its room has flooded, its crew gone');
      cands = [which];
    }
    const L = loadOn(sim, room), done = [];
    let why = null;
    for (const i of cands) {
      const d = drawOn(i, room, L, S);
      if (!(d.q > 0)) { why = why || d.why; continue; }
      putOn(sim, P, i, room, d.q); if (d.own) L.own += d.q; else L.led += d.q; done.push([i, d.q, d.own]);
    }
    if (!done.length) return no(why);
    const part = (list, many, how, secs) => (list.length === 1 ? pumpName(list[0][0]) : many) + how + ', ' + Math.round(list.reduce((a, d) => a + d[1], 0)) + ' tons an hour, at work in ' + Math.round(secs / 60) + ' minutes';
    const own = done.filter(d => d[2]), led = done.filter(d => !d[2]), mins = [own.length ? PLANT.pumpOwn : 0, led.length ? PLANT.pumpLent : 0].filter(Boolean).map(s => Math.round(s / 60)).join(' and ');
    return yes('on ' + roomName(room) + ': ' + [own.length ? part(own, 'its ' + own.length + ' own pumps', '', PLANT.pumpOwn) : '', led.length ? part(led, led.length + ' pumps', ' led through the main', PLANT.pumpLent) : ''].filter(Boolean).join('; '),
      (done.length === 1 ? cap1(pumpName(done[0][0])) : done.length + ' pumps') + ' on ' + roomName(room) + ': at work in ' + mins + ' min');
  }

  // an order to the stokehold: draw the fires in room k (0 = boiler room 6, forward), or in every room (k < 0)
  function drawFires(sim, k) {
    const P = sim.plant, R = PLANT.rooms; if (!P) return;
    for (let j = 0; j < R.length; j++) {
      if ((k < 0 || j === k) && R[j].lit > 0 && P.fires[j] > 0 && !P.out[j] && !P.drawn[j]) { P.drawn[j] = 1; event(sim, 'drawn' + j, R[j].name + ': the order to draw the fires'); }
    }
  }
  // tonnes of coal for so many hours at Full ahead (the coal option of a restart or a watch)
  const coalFor = (hours) => hours * PLANT.coalPerDayFull / 24;

  function readouts(sim) {
    const P = sim.plant; if (!P) return null;
    const L = sim.mo && sim.mo.plant, coal = P.coal.reduce((a, v) => a + v, 0), burn = Math.min(P.gen, P.demand) * PLANT.coalPerDayFull / 24;
    return {
      rooms: PLANT.rooms.map((r, k) => ({ name: r.name, lit: r.lit, fires: P.fires[k], flooded: !!P.out[k], drawn: !!P.drawn[k], coal: P.coal[k] })),
      psi: P.p * PLANT.psi, p: P.p, gen: P.gen, can: P.can, demand: P.demand, coal, hoursLeft: burn > 1e-9 ? coal / burn : Infinity,
      firing: P.firing, blow: P.blow, lights: P.lights, emergency: P.emergency,
      engines: !P.re, turbineRoom: !P.te, power: P.power, dynamosFlooded: P.el, broken: P.broken,
      nMax: L ? L.nMax[0] : null, steer: L ? L.steerRate : null, screws: L ? L.imm.slice() : null, rudder: L ? L.rudImm : null,
      doorSwitch: !!P.doorSwitch, doors: C.BULKHEADS.map((b, i) => ({ id: b.id, low: LOW[i], open: !!sim.doorOpen[i], falling: sim.doorFall ? sim.doorFall[i] >= 0 : false, float: sim.doorFloat ? !!sim.doorFloat[i] : false })),
      // D112: the doors the engineers raised by hand (the record's schedule), each with when and why
      raised: (P.raised || []).map(r => ({ id: r.id, t: r.t, why: r.why })),
      pumps: pumpsNow(sim),
    };
  }
  // Y3: the pumps as they stand: scheduled, at work (started and not stopped), being rigged (not yet started), stopped (the
  // room it stands in flooded), taken off by order (Y6). Y6: who has them, each pump, and each room with water or with
  // pumps on it (the Systems tab gives its orders from these)
  function pumpsNow(sim) {
    const list = sim.pumpSched || [], P = sim.plant;
    let running = 0, waiting = 0, stopped = 0, taken = 0;
    for (const e of list) { if (e.off) { if (e.taken) taken++; else stopped++; } else if (sim.t < e.t0) waiting++; else running++; }
    const out = { scheduled: list.length, running, waiting, stopped, taken, scale: sim.pumpScale === undefined ? 1 : sim.pumpScale,
      tpm: (sim.pumpOut || 0) * C.RHO / 1000 * 60, pumpedT: (sim.pumped || 0) * C.RHO / 1000,
      list: list.map(e => ({ label: e.label, zone: e.zone, room: e.room, LTh: e.q / LTH, t0: e.t0, off: e.off, tOff: e.tOff, taken: !!e.taken })) };
    if (!P || !P.pumpOn) return out;
    out.who = P.pumpBridge ? 'bridge' : (P.doctrine ? 'engineers' : (sim.pumpScripted ? 'night' : 'none'));
    out.passageT = P.passageT;
    const pumpOf = new Map(); P.pumpOn.forEach((j, i) => { if (j >= 0) pumpOf.set(j, i); });
    const state = (e) => (e.off ? 'stopped' : (sim.t < e.t0 ? 'rigging' : 'working'));
    out.each = PLANT.pumps.map((p, i) => { const e = onNow(sim, P, i); return { i, name: p.name, room: p.room, LTh: p.LTh, on: e ? e.zone : -1, state: e ? state(e) : (roomLost(sim, p.room) ? 'lost' : 'free'), t0: e ? e.t0 : -1 }; });
    out.rooms = [];
    for (let k = 0; k < 16; k++) {
      const on = [];
      list.forEach((e, j) => { if (e.zone === k && !e.taken) on.push({ i: pumpOf.has(j) ? pumpOf.get(j) : -1, label: e.label, LTh: e.q / LTH, room: e.room, state: state(e), t0: e.t0, tOff: e.tOff }); });
      const water = roomWater(sim, k);
      if (water < 1 && !on.some(p => p.state !== 'stopped')) continue;
      let depth = 0; for (let sd = 0; sd < 2; sd++) { const n = C.nodeIndex(k, sd, 0); if (sim.vol[n] > 1e-6) depth = Math.max(depth, sim.level[n] - sim.zmin[n]); }
      const S = suctionFor(P, k);
      out.rooms.push({ k, name: C.ZONES[k].name, waterT: water * C.RHO / 1000, depth, lost: roomLost(sim, k), suction: S.lth, why: S.why || '',
        tpm: (sim.pump ? sim.pump[k] : 0) * C.RHO / 1000 * 60, own: PLANT.pumps.some(p => p.room === k), pumps: on });
    }
    return out;
  }

  return { PLANT, RUDDER_TRACE, rudderArea, attach, step, readouts, immersed, drawFires, coalFor, bridgeDoors, openDoor, closeDoor, LOW, pumpOrder, DOORS_RAISED };
});

/*
 * The night and the watch (P4 of docs/BRAINSTORM_ship_under_way_v1_1): a scenario drawn from a seed, the lookout's
 * sighting, the bridge's orders, and the record that lets a night be replayed exactly.
 *
 *   spec(seed)            the night: where the berg lies, how large its spur is, how far off the lookout sees it.
 *                         Seed 1912 is reserved for the reconstructed night of 14 April 1912 (fixed, not drawn).
 *   create(ship, spec)    a sim with the ship under way (core/motion.js) and the berg ahead (core/encounter.js)
 *   step(sim)             orders due, one step of the encounter, then the lookout: bells, touch, clear
 *   helm, telegraph       the bridge's orders. Every order is logged with the step it was given at, so
 *   replay(ship, spec, log)   gives the same night again, bit for bit (tools/night_tests.js proves it).
 *   forecast(ship, forecastOf(sim))   a copy of the watch run on with no further order: the page's forecast (Y6)
 *
 * Nothing before the bells tells the bridge that ice is there. The time from the bells to the first order is the
 * reaction time; the viewer's Bridge panel and the scripts below give their orders through the same two functions.
 *
 * Geometry. The ship starts on her course at her speed; the berg's centre lies `off` metres to starboard of her track
 * (negative: to port) and far enough ahead that, if she holds her course, the range from her stem to the ice falls
 * to `sighting` after `lead` seconds. Frame: as motion.js (x forward, y to starboard; earth x north, y east).
 *
 * What is drawn at random, and from what spread, is a design choice [bet], listed in draw(). A change there changes
 * every seeded night, so the generator carries a version (GEN).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'), require('./motion.js'), require('./encounter.js'), require('./systems.js'));
  else root.TitanicNight = factory(root.TitanicCore, root.TitanicMotion, root.TitanicEncounter, root.TitanicSystems);
})(typeof self !== 'undefined' ? self : this, function (C, Mo, E, Sys) {
  'use strict';
  const DEG = Math.PI / 180, KN = Mo.KN, GEN = 1;
  const XS = C.xFwd(8);                       // the stem, as encounter.js measures "ahead"
  const XA = C.G.xAP - C.G.sternOverhang;     // the stern
  const HALF_B = 0.5 * C.G.B;

  // a deterministic stream from a 32-bit seed (mulberry32: integer arithmetic only, the same on every engine)
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const r1 = x => Math.round(x * 10) / 10;

  // The bridge's orders on 14 April 1912 as this repository reconstructs them (tools/encounter_tests.js, G1912):
  // helm hard over away from the ice 20.5 s after the bells, reversed at the first touch ("port around"), engines
  // stopped and the helm amidships a minute later. No engine order before the touch.
  const ORDERS_1912 = { delay: 20.5, turn: 'away', around: 0, stop: 60 };

  // Where the ice was when the helm went over on the reconstructed night: her stem `ahead` m short of it, the ice
  // reaching `port` m to port of her track. Not a record: fitted so that the contact makes the damage the record
  // describes (tears from the stem aft along the starboard side, the split against Hackett and Bedford's), the sighting
  // falls at about 500 yards and the impact 20-25 s after the order. P3 found 220 m and 32 m (e5); refitted with the
  // handling's consensus (M2, e9): 224 m and 36 m; refitted with P3c's contact law (e13, e14): 256 m and 46 m; refitted
  // with M3 and M4's handling (e17): 257 m and 47 m (tears x 123 to 42, from the stem into boiler room 5; split error 29
  // points; sighted at about 495 m; impact 25.9 s after the order; the core then sinks her 158.6 minutes after the touch).
  // She grazes the edge of a stem strike there: a metre either way changes the damage a good deal (e14, e17), as the
  // 1912 timing was near the worst (the miss window); no point in the timeline is steadier across courses (e17, P3e).
  // tools/encounter_tests.js, tools/calibrate_encounter.js and tools/night_tests.js read it from here.
  const GEOM_1912 = { ahead: 257, port: 47 };

  // The reconstructed night. With the order 20.5 s after the bells at 22.5 knots the sighting falls at 463 m: the
  // British report's "about 500 yards" (457 m). Course 266 deg true at 22.5 knots (Halpern).
  function historic(speedKn) {
    // off: the ice's centre from her track, + to starboard; reaching `port` m to port means its centre R - port to starboard
    const dt = C.DEFAULT_PARAMS.dt, u = Mo.create({ knots: 22.5 }).u, R = E.ICE.R, off = R - GEOM_1912.port, ahead = GEOM_1912.ahead;
    const reach = ahead + R + u * (ORDERS_1912.delay + 0.5 * dt);
    return {
      gen: GEN, seed: 1912, kind: '1912', title: 'The watch of 14 April 1912',
      // the bells 13.75 s into the watch, so that she touches at 11:40 pm (the Report): the order 20.5 s after them, the
      // impact 25.9 s after that (P3c's geometry; it was 17.25 s before P3c)
      speedKn: speedKn || 22.5, heading: 266, lead: 13.75, off, sighting: Math.sqrt(reach * reach + off * off) - R,
      // the recorded order, "hard-a-starboard": her head to port (rudder -40). Drawn nights keep 'away' for their bergs;
      // at P3c's geometry the berg's centre lies 6 m to port of her track, where 'away' would turn her to starboard
      ice: {}, orders: Object.assign({}, ORDERS_1912, { turn: -40 }), clock0: 23 * 3600 + 39 * 60, berg: { h: 20, seed: 1912 },
      // D112: the engineers raise the after doors by hand, as the record has it (core/systems.js, DOORS_RAISED)
      plant: { doorsRaised: 1912 },
    };
  }

  // A night drawn from a seed. The spreads [bet]:
  //   spur radius 25 to 60 m (the 1912 fit is 40), mass with its cube from 100,000 t at 40 m;
  //   top of the spur 4.5 to 6.5 m below the waterline (1912: 5.75), three bands a metre apart;
  //   sighting 250 to 595 m around the 500 yards (457 m) of 1912: the same flat calm and no moon, with worse or
  //   better luck. This makes a hard watch on purpose; it is not a climatology of ice sightings;
  //   the berg's centre anywhere within its radius plus 34 m of the track, either side: beyond radius plus 14 m
  //   she passes clear if nothing is done, so about a quarter of the nights need no order at all;
  //   12 to 40 s of quiet before the bells.
  // G1, how hard a drawn night is (opts.level). Each level maps the same draws to its own spreads, so a seed keeps its
  // berg's size, depth, height and clock across the levels; only where the ice lies and when it is seen change.
  //   hard: the generator above, and the default: a seed's night without a level is the night it always was (GEN stays);
  //   early: the ice seen sooner, from 1912's 457 m out to 1.6 times it, the berg anywhere as in hard;
  //   night1912: as on the night, seen at 0.9 to 1.1 times 457 m with the berg's centre within its radius plus 10 m of
  //     her track, so that nearly every night needs an order [bets, all]
  const LEVELS = {
    early: { name: 'Seen early', sight: [1.0, 0.6], offPad: 34 },
    hard: { name: 'Any night', sight: [0.55, 0.75], offPad: 34 },
    night1912: { name: 'Like 1912', sight: [0.9, 0.2], offPad: 10 },
  };
  function draw(seed, opts) {
    opts = opts || {};
    seed = seed >>> 0;
    const level = LEVELS[opts.level] ? opts.level : 'hard', L = LEVELS[level];
    const r = rng(seed);
    const R = r1(25 + 35 * r());
    const sighting = Math.round(457.2 * (L.sight[0] + L.sight[1] * r()));
    const lead = 0.25 * Math.round((12 + 28 * r()) * 4);
    const off = r1((2 * r() - 1) * (R + L.offPad));
    const d0 = Math.round((4.5 + 2 * r()) * 4) / 4;
    const h = Math.round(10 + 20 * r());                       // height of the visible berg, m (witnesses: 50 to 100 ft)
    const clock0 = 22 * 3600 + Math.floor(r() * 3.5 * 3600);
    const k = R / 40;
    return {
      gen: GEN, seed, kind: 'random', level, title: 'Night ' + seed + (level === 'hard' ? '' : ' · ' + L.name.toLowerCase()),
      speedKn: opts.speedKn || 22.5, heading: 266, lead, off, sighting,
      ice: { R, mass: 1e8 * k * k * k, depths: [d0, d0 + 1, d0 + 2] }, orders: ORDERS_1912, clock0, berg: { h, seed },
    };
  }
  function spec(seed, opts) {
    seed = seed >>> 0;
    return seed === 1912 ? historic(opts && opts.speedKn) : draw(seed, opts);
  }

  // the bridge's orders as a script: entries fire once, on a step count (k) or a time after an event of the watch
  function scriptOf(orders) {
    const o = Object.assign({}, ORDERS_1912, orders || {}), sc = [];
    if (o.engines0) sc.push({ when: 'start', after: 0, type: 'telegraph', value: o.engines0 });
    if (o.turn !== null) sc.push({ when: 'bells', after: o.delay, type: 'helm', value: o.turn });
    if (o.engines) sc.push({ when: 'bells', after: o.delay, type: 'telegraph', value: o.engines });
    if (o.around !== null) sc.push({ when: 'touch', after: o.around, type: 'helm', value: 'reverse' });
    if (o.stop !== null) {
      sc.push({ when: 'touch', after: o.stop, type: 'telegraph', value: 'stop' });
      sc.push({ when: 'touch', after: o.stop, type: 'helm', value: 0 });
    }
    sc.push({ when: 'clear', after: 0, type: 'helm', value: 0, unless: 'touch' });
    return sc;
  }

  // ------------------------------------------------------------------ readers
  // Modules that read the night and keep a state of their own beside it (the reports to the bridge, the boats, the other
  // ships: core/readers/*.js). Each registers itself here when it is loaded. From then on it is attached to every watch,
  // stepped after the model's own step, and may own order types of the watch's log, so that its orders replay with the
  // helm's. A reader never writes into the flooding, the motion, the ice or the plant: a watch has the same fingerprint
  // with every reader and with none (tools/night_tests.js). What a reader draws at random it draws from the night's seed.
  //   { name, state, attach(sim, spec), step(sim), orders: { type: (sim, value, arg) => done }, valid(type, value, arg) }
  // state: the key of its state in the sim (sim.people, sim.world), so that a copy of the watch made for a forecast can
  // leave it behind; valid: which of its orders it would accept from a shared address.
  // create(ship, spec, { readers: false }) gives a watch with none attached (the tests use it to show they change nothing);
  // an order of a reader's given to such a watch goes in its log and does nothing else.
  const OWN = { helm: 1, telegraph: 1, door: 1, doors: 1, fires: 1, pump: 1, hole: 1 };   // the orders this file carries out itself
  // G27 (docs/DESIGN_G27_the_brush_on_a_watch_v1_2026-11-24.md): a hole made by the player's hand on a watch (the page's
  // brush), an order of the model's own that no man on her gives or hears: value [x, z, side] (m, ship frame; side +1
  // port, -1 starboard), arg its area (m2). Its bounds need no state, so the page's address check and the model agree:
  // inside her sixteen zones 1 m clear of either end, from her floor there + 0.25 m (her inner bottom contains anything
  // lower: the brush's rule) to E deck, and no larger than the brush's largest, 0.02 x 250 = 5 m2 (site/app.js)
  const HOLE_MAX = 5;
  let SHIP0 = null;
  function validHole(value, arg) {
    if (!Array.isArray(value) || value.length !== 3 || !value.every(v => typeof v === 'number' && isFinite(v))) return false;
    if (!(typeof arg === 'number' && isFinite(arg) && arg > 0 && arg <= HOLE_MAX)) return false;
    const x = value[0], z = value[1], side = value[2], bx = C.zoneBounds();
    if (side !== 1 && side !== -1) return false;
    if (!(x < bx[0] - 1 && x > bx[16] + 1)) return false;
    const ship = SHIP0 || (SHIP0 = C.buildShip());
    return z >= ship.zones[C.zoneAt(x)].floor + 0.25 && z <= C.deckZ('E', x);
  }
  // whether an order is one of those (the model's own) and not a reader's: only the model's own change what she does, so
  // the page asks for a new forecast after them alone (site/app.js, order)
  function owns(type) { return OWN[type] === 1; }
  const READERS = [];
  // the onset's check (D76 b): the onset reader's plain functions, { start, look }, when it is loaded; the night carries
  // it itself on a watch handed over at the onset (create, step, over), so that copies and reader-less watches meet it.
  // G12 (D98): every watch hands over at the onset by default, so the check must be there wherever a watch is made. The
  // page bundles the reader after this file; in Node the night loads it itself the first time it is wanted, so that no
  // tool keeps the flag by forgetting to load it (a tool that wants the flag says so: handover 'flag')
  function onsetCheck() {
    let r = READERS.find(x => x.name === 'onset' && x.check);
    if (!r && typeof module === 'object' && module.exports && typeof require === 'function') { require('./readers/onset.js'); r = READERS.find(x => x.name === 'onset' && x.check); }
    return r ? r.check : null;
  }
  function reader(r) {
    if (!r || !r.name) throw new Error('a reader needs a name');
    for (const t of Object.keys(r.orders || {})) {
      if (OWN[t] || READERS.some(x => x.name !== r.name && x.orders && x.orders[t])) throw new Error('the order "' + t + '" is already taken');
    }
    const i = READERS.findIndex(x => x.name === r.name);        // loaded twice (a test, a page): the later one stands
    if (i >= 0) READERS[i] = r; else READERS.push(r);
    return r;
  }

  // opts: { auto: true } the reconstructed 1912 orders; { script } any script; { params } core parameters
  function create(ship, sp, opts) {
    opts = opts || {};
    const sim = C.createSim(ship, opts.params || {}, { openings: [], coalListDeg: sp.coalListDeg === undefined ? C.DEFAULT_PARAMS.coalListDeg : sp.coalListDeg });
    const m = Mo.attach(sim, { knots: sp.speedKn, heading: sp.heading });
    const R = sp.ice && sp.ice.R !== undefined ? sp.ice.R : E.ICE.R, dt = sim.params.dt;
    // half a step short, so that the bells ring on the step at t = lead and not, by a rounding, on the next
    const reach = Math.sqrt((sp.sighting + R) * (sp.sighting + R) - sp.off * sp.off);
    const along = XS + m.u * (sp.lead - 0.5 * dt) + reach, c = C.cos(m.psi), s = C.sin(m.psi);
    E.create(sim, { X: m.X + along * c - sp.off * s, Y: m.Y + along * s + sp.off * c }, sp.ice);
    if (Sys && opts.plant !== false) Sys.attach(sim, sp.plant);      // the machinery, and what flooding does to it (core/systems.js)
    const script = opts.script || (opts.auto ? scriptOf(sp.orders) : null);
    sim.night = {
      spec: sp, k: 0, phase: 'watch', tBells: -1, tOrder: -1, tTouch: -1, tClear: -1,
      range: 0, bearing: 0, ahead: 0, abeam: 0, minDist: 1e9, bearingBells: 0, rangeBells: 0, knTouch: 0, swingTouch: 0, aheadOrder: -1, calm: 0,
      hindsight: false, log: [], script, did: script ? new Uint8Array(script.length) : null, psi0: m.psi, hash: 2166136261,
      readers: opts.readers !== false,
    };
    // G12 (D98, Bo, 2026-11-23: "Yes, option (a)"): a watch is handed over to the fall at B2's onset by default; 'flag', the
    // core's foundering flag (rule H1), is the what-if, and every harness that fits or measures the founder names it
    // (G12's step 0). A flag watch carries no field for it, so it is today's watch to the bit. Anything else is refused
    const handover = opts.handover === undefined || opts.handover === null ? 'onset' : opts.handover;
    if (handover !== 'onset' && handover !== 'flag') throw new Error('Night.create: handover is \'onset\' or \'flag\', not ' + JSON.stringify(opts.handover));
    if (handover === 'onset') sim.night.handover = 'onset';
    // D76 (b): on an onset watch the night carries B2's check itself, its state plain data in sim.night.onset (a copy of
    // the watch, its forecast and a watch with no readers meet the same onset); a default watch has none
    if (sim.night.handover === 'onset') { const chk = onsetCheck(); if (chk) sim.night.onset = chk.start(); }
    look(sim, sim.night);
    if (sim.night.readers) for (const r of READERS) if (r.attach) r.attach(sim, sp);
    return sim;
  }

  // ------------------------------------------------------------------ orders
  // returns what the order did where it can fail: the bridge's door switch (Y2) is false without current; an order to the
  // pumps (Y6) says whether it was carried out, and why not
  function act(sim, type, value, arg) {
    const w = sim.night, m = sim.mo;
    let done = true;
    if (type === 'helm') {
      if (value === 'away') value = w.spec.off >= 0 ? -m.K.S.rudder.max : m.K.S.rudder.max;
      else if (value === 'toward') value = w.spec.off >= 0 ? m.K.S.rudder.max : -m.K.S.rudder.max;
      else if (value === 'reverse') value = -m.delCmd / DEG;
      Mo.rudder(sim, value);
    } else if (type === 'telegraph') Mo.telegraph(sim, value, arg);
    // the doors of bulkhead `value` by hand (Y2): opened at once (the bridge's switch goes off); shut by the lever, they fall
    else if (type === 'door') { if (arg) { if (sim.plant) Sys.openDoor(sim, value); else C.setDoor(sim, value, true); } else C.releaseDoor(sim, value, 'by hand'); }
    // the bridge's switch for the doors at the tank top (Y2): nothing without current from the main dynamos
    else if (type === 'doors') { if (sim.plant) done = Sys.bridgeDoors(sim); else for (let b = 0; b < C.BULKHEADS.length; b++) if (C.BULKHEADS[b].doors.some(d => d[0] === 'low')) C.releaseDoor(sim, b, 'from the bridge'); }
    else if (type === 'fires') { if (sim.plant) Sys.drawFires(sim, value); }   // to the stokehold: draw room value's fires (< 0: all)
    // to the pumps (Y6): value the room (-1: none), arg which pumps (core/systems.js, pumpOrder). An order that cannot be
    // carried out changes nothing; it goes in the log with its reason, and a replay refuses it again
    else if (type === 'pump') done = sim.plant ? Sys.pumpOrder(sim, value, arg) : { ok: false, why: 'No plant on this watch: there is nobody to give the order to' };
    // G27: a hole made by hand (the brush on a watch), placed on her shell's outer face from her own half-breadth as the
    // presets' holes are, so that the log's numbers alone place it and a replay gives the same opening to the bit
    else if (type === 'hole') {
      if (!validHole(value, arg)) throw new Error('Night.act: a hole out of bounds: ' + JSON.stringify([value, arg]));
      const x = value[0], z = value[1], y = value[2] * (C.halfBreadth(x, z, sim.ship.hull) + 0.02);
      C.addOpening(sim, { x, y, z, area: arg, kind: 'breach', label: 'a hole made by hand', tOpen: sim.t });
    } else {
      // an order a reader owns (above). On a watch without the readers it is logged and nothing more, so that a log
      // holding such orders replays there too (a forecast, a test of the model alone), to the same fingerprint
      const r = READERS.find(x => x.orders && x.orders[type]);
      if (!r) throw new Error('unknown order: ' + type);
      if (w.readers) done = r.orders[type](sim, value, arg);
    }
    const entry = { k: w.k, t: sim.t, type, value, arg };
    if (done && done.ok === false) entry.refused = done.why;      // an order that could not be carried out says why (the pumps'; a reader's may too)
    w.log.push(entry);
    if (type === 'helm' || type === 'telegraph') {                            // the wheel and the engines: the bridge's answer to the ice
      if (w.tBells < 0) w.hindsight = true;                    // an order before the bells: she was warned by nobody
      else if (w.tOrder < 0) { w.tOrder = sim.t; w.aheadOrder = w.ahead - XS - sim.enc.Rmax; }
    }
    return done;
  }
  function helm(sim, deg) { act(sim, 'helm', deg); }           // + = rudder to starboard (head to starboard); 'away', 'toward', 'reverse'
  function telegraph(sim, order, side) { act(sim, 'telegraph', order, side); }
  function door(sim, b, open) { act(sim, 'door', b, !!open); }
  function doors(sim) { return act(sim, 'doors', 'bridge'); }  // the bridge's switch: false if it had no current
  function fires(sim, k) { act(sim, 'fires', k); }
  // Y6, to the pumps: room 0-15 with which a pump's index, 'own', 'all' or 'off'; room -1 with a pump's index (take it
  // off) or 'engineers' (hand them back). Returns { ok, why } or { ok, text, short } (core/systems.js, pumpOrder)
  function pump(sim, room, which) { return act(sim, 'pump', room, which); }
  function hole(sim, x, z, side, area) { act(sim, 'hole', [x, z, side], area); }   // G27: the brush's hole on a watch

  function runScript(sim, w) {
    const sc = w.script, m = sim.mo;
    for (let i = 0; i < sc.length; i++) {
      if (w.did[i]) continue;
      const o = sc[i], after = o.after || 0;
      let due;
      if (o.k !== undefined) due = w.k >= o.k;
      else if (o.when === 'start') due = sim.t >= after;
      else if (o.when === 'bells') due = w.tBells >= 0 && sim.t >= w.tBells + after;
      else if (o.when === 'touch') due = w.tTouch >= 0 && m.t >= w.tTouch + after;
      else if (o.when === 'clear') due = w.tClear >= 0 && sim.t >= w.tClear + after;
      else throw new Error('unknown script entry');
      if (!due) continue;
      w.did[i] = 1;
      if (o.unless === 'touch' && w.tTouch >= 0) continue;
      act(sim, o.type, o.value, o.arg);
    }
  }

  // ------------------------------------------------------------------ the lookout
  const HB = new Float64Array(1), HU = new Uint32Array(HB.buffer);
  function mix(h, x) { HB[0] = x; h = Math.imul(h ^ HU[0], 16777619); return Math.imul(h ^ HU[1], 16777619); }

  function look(sim, w) {                                      // where the ice is: from the stem, and from amidships
    const m = sim.mo, e = sim.enc, b = e.berg, c = C.cos(m.psi), s = C.sin(m.psi);
    const dx = b.X - m.X, dy = b.Y - m.Y, fwd = dx * c + dy * s, stb = -dx * s + dy * c, fs = fwd - XS;
    w.ahead = fwd; w.abeam = stb;
    w.range = Math.sqrt(fs * fs + stb * stb) - e.Rmax;
    w.bearing = C.atan2(stb, fs) / DEG;                     // off the bow, + to starboard
    // the ice's centre from her centreline (stern to stem), for a lower bound on a wide miss
    const over = fwd > XS ? fwd - XS : (fwd < XA ? XA - fwd : 0), d = Math.sqrt(over * over + stb * stb);
    if (d < w.minDist) w.minDist = d;
  }
  function sideName(stb) { return stb >= 0 ? 'starboard' : 'port'; }
  function observe(sim, w) {
    const m = sim.mo, e = sim.enc;
    look(sim, w);
    if (w.tBells < 0 && w.range <= w.spec.sighting) {
      w.tBells = sim.t; w.phase = 'sighted'; w.bearingBells = w.bearing; w.rangeBells = w.range;
      const a = Math.abs(w.bearing), call = a < 2 ? 'Iceberg right ahead!' : 'Ice ' + (a < 11.25 ? 'fine' : 'broad') + ' on the ' + sideName(w.bearing) + ' bow!';
      sim.events.push({ t: sim.t, id: 'bells', label: 'Three bells from the crow\'s nest: "' + call + '" Range ' + w.range.toFixed(0) + ' m' });
    }
    if (w.tTouch < 0 && e.tFirst >= 0) {
      w.tTouch = e.tFirst; w.phase = 'contact';
      w.knTouch = Math.sqrt(m.u * m.u + m.v * m.v) / KN; w.swingTouch = (m.psi - w.psi0) / DEG;
      const where = w.ahead > 60 ? 'bow' : (w.ahead < -60 ? 'quarter' : 'side');
      sim.events.push({ t: sim.t, id: 'touch', label: 'She touches the ice on the ' + sideName(w.abeam) + ' ' + where + ' at ' + w.knTouch.toFixed(1) + ' knots' });
    }
    if (w.tClear < 0) {
      // the encounter is over when the ice is abaft the beam and out of reach, when she has stopped, or when she has
      // lain against the ice for ten seconds without closing on it (stopped on it, or the two moving as one)
      const b = e.berg, c = C.cos(m.psi), s = C.sin(m.psi), rx = m.u * c - m.v * s - b.VX, ry = m.u * s + m.v * c - b.VY;
      w.calm = w.tTouch >= 0 && rx * rx + ry * ry < 0.09 ? w.calm + sim.params.dt : 0;
      if ((!E.near(sim) && w.ahead < 0) || m.u * m.u + m.v * m.v < 0.0625 || w.calm >= 10) {
        w.tClear = sim.t; w.phase = 'clear';
        sim.events.push({ t: sim.t, id: 'clear', label: verdict(sim) });
      }
    }
    let h = w.hash;
    h = mix(h, m.u); h = mix(h, m.v); h = mix(h, m.r); h = mix(h, m.X); h = mix(h, m.Y); h = mix(h, m.psi); h = mix(h, m.del);
    h = mix(h, m.nP); h = mix(h, m.nS); h = mix(h, m.nC);
    h = mix(h, sim.zO); h = mix(h, sim.pitch); h = mix(h, sim.roll); h = mix(h, sim.inflow); h = mix(h, e.berg.X); h = mix(h, e.berg.Y);
    w.hash = h;
  }

  // Z3: she is gone: the core's flag, or under handover 'onset' the onset B2's check found (the night's own, D76 b; the
  // reader's on a watch made without it)
  function over(sim) {
    if (sim.foundered) return true;
    const w = sim.night;
    if (!w || w.handover !== 'onset') return false;
    const o = w.onset || sim.onset;
    return !!(o && o.found);
  }
  function step(sim) {
    const w = sim.night;
    if (over(sim)) {
      if (w.script) runScript(sim, w);
      w.k++; sim.t += sim.params.dt;
      if (w.readers) for (let i = 0; i < READERS.length; i++) if (READERS[i].step) READERS[i].step(sim);
      return;
    }
    if (w.script) runScript(sim, w);
    if (sim.plant) Sys.step(sim);                  // what the machinery can do this step, from the water in each room and her pose
    E.step(sim);
    w.k++;
    observe(sim, w);
    if (w.onset && !w.onset.found) { const chk = onsetCheck(); if (chk) chk.look(sim, w.onset); }   // D76 (b): onset watches only
    if (w.readers) for (let i = 0; i < READERS.length; i++) if (READERS[i].step) READERS[i].step(sim);   // they read; they change nothing above
  }
  // true while the watch needs real time: until the encounter is over (the ice passed, or she lies stopped or against it)
  function busy(sim) { return sim.night.tClear < 0; }
  function fingerprint(sim) { return (sim.night.hash >>> 0).toString(16).padStart(8, '0'); }

  // ------------------------------------------------------------------ what happened
  function summary(sim) {
    const w = sim.night, s = E.summary(sim);
    s.area = s.stbd.area + s.port.area + s.bow.area;
    s.zones = []; for (let k = 0; k < 16; k++) if (s.stbd.zone[k] + s.port.zone[k] + s.bow.zone[k] > 1e-6) s.zones.push(k);
    // the smallest gap between hull and ice: exact when under GAP_EXACT; for a wider miss a lower bound, from the
    // ice's distance off her centreline less her half breadth
    s.clearanceExact = s.minGap < E.GAP_EXACT;
    s.clearance = s.clearanceExact ? s.minGap : Math.max(E.GAP_EXACT, w.minDist - sim.enc.Rmax - HALF_B);
    s.seed = w.spec.seed; s.phase = w.phase; s.tBells = w.tBells; s.tOrder = w.tOrder; s.tTouch = w.tTouch; s.tClear = w.tClear;
    s.reaction = w.tBells >= 0 && w.tOrder >= 0 ? w.tOrder - w.tBells : null;
    s.hindsight = w.hindsight; s.knTouch = w.knTouch; s.swingTouch = w.swingTouch; s.rangeBells = w.rangeBells; s.bearingBells = w.bearingBells;
    s.aheadOrder = w.aheadOrder;
    s.headOn = s.bow.crush >= 1;                               // her stem went into the ice and the bow crushed
    s.fingerprint = fingerprint(sim);
    return s;
  }
  // compartments by name: "the forepeak to boiler room 4" when they lie in a row
  function zoneName(k) { const n = C.ZONES[k].name; return k === 0 || k === 15 ? 'the ' + n.toLowerCase() : (n.charAt(0) === 'N' ? n : n.charAt(0).toLowerCase() + n.slice(1)); }
  function zoneSpan(zs) {
    if (!zs.length) return 'no compartment';
    if (zs.length === 1) return zoneName(zs[0]);
    return zs[zs.length - 1] - zs[0] === zs.length - 1 ? zoneName(zs[0]) + ' to ' + zoneName(zs[zs.length - 1]) : zs.map(zoneName).join(', ');
  }
  // what happened, in one sentence (the headless tools print the metres from summary())
  function verdict(sim) {
    const s = summary(sim);
    if (s.kind === 'miss') {
      const side = sideName(sim.night.abeam);
      return 'Clear of the ice: it passed ' + (s.clearanceExact ? '' : 'more than ') + Math.max(0, s.clearance).toFixed(0) + ' m off her ' + side + ' side';
    }
    if (s.kind === 'dented') {
      return 'Clear of the ice: ' + (s.stbd.dents + s.port.dents) + ' m of plating dented, the deepest ' + (100 * Math.max(s.stbd.dmax, s.port.dmax)).toFixed(0) + ' cm. No seam opened, no water';
    }
    const tears = s.stbd.area + s.port.area, sides = s.stbd.tears && s.port.tears ? 'both sides' : 'the ' + (s.stbd.tears ? 'starboard' : 'port') + ' side';
    const seams = tears > 0 ? tears.toFixed(2) + ' m2 of seams open along ' + sides : '';
    if (s.bow.area > 0) return 'Stem into the ice: bow crushed in ' + s.bow.crush.toFixed(0) + ' m' + (seams ? ', ' + seams : '') + '. Open to the sea: ' + zoneSpan(s.zones);
    return 'Holed: ' + seams + ', ' + zoneSpan(s.zones);
  }

  // ------------------------------------------------------------------ headless helpers
  function run(sim, opts) {                                    // to the end of the encounter (the ice passed), or tMax
    opts = opts || {};
    const tMax = opts.tMax || 600, extra = opts.settle || 0;
    while (sim.t < tMax && (sim.night.tClear < 0 || sim.t < sim.night.tClear + extra)) step(sim);
    return sim;
  }
  function sink(sim, tMax) {                                   // on, until she founders or lies steady
    tMax = tMax || 8 * 3600;
    while (!over(sim) && sim.t < tMax) {
      step(sim);
      if (sim.t > 4 * 3600 && Math.abs(sim.inflow) < 0.02 && Math.abs(sim.wth) < 1e-5) break;
    }
    return sim;
  }
  function replay(ship, sp, log, kEnd, opts) {
    const sim = create(ship, sp, Object.assign({}, opts || {}, { script: log.map(o => ({ k: o.k, type: o.type, value: o.value, arg: o.arg })) }));
    while (sim.night.k < kEnd) step(sim);
    return sim;
  }
  // a night is its seed and its orders: that is the snapshot, and resuming is replaying
  function snapshot(sim) { const w = sim.night; return { spec: w.spec, k: w.k, log: w.log.map(o => Object.assign({}, o)) }; }
  function resume(ship, snap, opts) {
    const sim = replay(ship, snap.spec, snap.log, snap.k, opts);
    sim.night.script = null; sim.night.did = null;
    return sim;
  }
  // The forecast after the ice (Y6): what the watch does from now if no further order is given. Everything a step reads is
  // plain data in the sim (the core, her motion, the ice, the plant and its pumps, the night with its log and the scripted
  // orders still to come), so the watch is copied whole and run on: its plant, the engineers' later orders and the
  // bridge's orders all go with it, and so does a change no log holds (a hole made by hand). On one engine its "founders
  // at" is the watch's own, to the bit (tools/systems_tests.js, tools/systems_site_test.js). It replays nothing, so it
  // costs about what running the watch on costs. forecastOf(sim) is the copy (structured clone), without the ship's
  // geometry, which nothing in the sim shares: the page posts it, about 1 MB, to its forecast worker, which has its own ship.
  // The readers' states stay behind (each names its key in the sim, `state`), and the copy runs without the readers: a
  // forecast is of the model, which no reader changes; an order of theirs still to come is logged in the copy and idle.
  function forecastOf(sim) {
    const o = Object.assign({}, sim); o.ship = null;
    for (const r of READERS) if (r.state) delete o[r.state];
    o.night = Object.assign({}, sim.night, { readers: false });
    return structuredClone(o);
  }
  // forecaster(ship, f) runs that copy on in slices: go(n) takes up to n steps and returns true when done; result() gives
  // what core.run gives, the history every opts.every s, to her foundering (on an onset watch to its hand-over: over()),
  // 20 minutes lying steady, or opts.tMax s (6 h); over and overT (the hand-over's time, -1 for none) beside foundered
  function forecaster(ship, f, opts) {
    opts = opts || {};
    const sim = f; sim.ship = ship;
    const every = opts.every || 30, tEnd = sim.t + (opts.tMax || 6 * 3600), hist = [], dt = sim.params.dt;
    let next = sim.t, calm = 0, done = false;
    const sample = () => { const r = C.readouts(sim); hist.push({ t: sim.t, trim: r.trimDeg, list: r.listDeg, water: r.waterT, inflow: r.inflowTpm, dF: r.draftF, dA: r.draftA }); };
    function go(n) {
      for (let i = 0; i < n && !done; i++) {
        if (over(sim) || sim.t >= tEnd) { done = true; break; }
        if (sim.t >= next) { sample(); next += every; }
        step(sim);
        if (sim.t > 1800) { calm = Math.abs(sim.inflow) < 0.02 && Math.abs(sim.wth) < 1e-5 && Math.abs(sim.vz) < 1e-3 ? calm + dt : 0; if (calm > 1200) done = true; }
      }
      return done;
    }
    function result() {
      sample();
      const o = sim.night && (sim.night.onset || sim.onset), isOver = over(sim);
      return { hist, foundered: sim.foundered, founderT: sim.founderT, over: isOver, overT: !isOver ? -1 : (sim.foundered ? sim.founderT : o.found.t), final: C.readouts(sim), events: sim.events.slice(), endT: sim.t, k: sim.night.k };
    }
    return { sim, go, result };
  }
  function forecast(ship, f, opts) { const r = forecaster(ship, f, opts); r.go(Infinity); return r.result(); }
  // the same berg, another watch: the 1912 drill with the helm order `times` seconds after the bells
  function missWindow(ship, sp, opts) {
    opts = opts || {};
    const times = opts.times || [0, 5, 10, 15, 20, 25, 30], rows = [];
    for (const r of times) {
      const sim = run(create(ship, sp, { script: scriptOf(Object.assign({}, sp.orders, opts.orders || {}, { delay: r })) }), { tMax: opts.tMax || 600 });
      const s = summary(sim);
      rows.push({ reaction: r, kind: s.kind, clearance: s.clearance, clearanceExact: s.clearanceExact, area: s.area, zones: s.zones, headOn: s.headOn,
        stbd: s.stbd.tears ? [s.stbd.tearFrom, s.stbd.tearTo] : null, port: s.port.tears ? [s.port.tearFrom, s.port.tearTo] : null, text: verdict(sim) });
    }
    return rows;
  }
  function describe(sp) {
    const R = sp.ice && sp.ice.R !== undefined ? sp.ice.R : E.ICE.R, d = sp.ice && sp.ice.depths ? sp.ice.depths[0] : E.ICE.depths[0];
    const where = Math.abs(sp.off) < 0.05 ? 'dead on her track' : Math.abs(sp.off).toFixed(0) + ' m to ' + sideName(sp.off) + ' of her track';
    return 'Spur ' + (2 * R).toFixed(0) + ' m across, ' + d.toFixed(1) + ' m down, its centre ' + where + '; seen at ' + sp.sighting.toFixed(0) + ' m; ' + sp.speedKn + ' knots';
  }

  return {
    GEN, LEVELS, ORDERS_1912, GEOM_1912, XS, rng, spec, draw, historic, scriptOf, create, step, busy, helm, telegraph, door, doors, fires, pump, act,
    reader, READERS, owns, hole, validHole, HOLE_MAX,
    over, summary, verdict, fingerprint, run, sink, replay, snapshot, resume, forecastOf, forecaster, forecast, missWindow, describe,
  };
});

/*
 * NH2: her rooms, and when the water came (the cabin view). The headless library of
 * docs/BRAINSTORM_the_next_horizon_v1_2026-11-23.md, section 3, NH2; the page's part follows in the page's own lane (Z2).
 *
 * It joins R3's tables of her rooms (data/rooms/<deck>_deck.json, read from the deck plans: each row a room, or a block
 * of rooms between passages, with its stateroom numbers listed in its `plan` and each of its pieces placed in the
 * model's zone, side and slab) to core/readers/rooms.js's slabs, and through them to a run's water.
 *
 *   index(tables)          the rows of the decks given (each deck's table as parsed JSON, in any order; a table that is
 *                          not a deck's, as openings.json, is passed over), by id, by stateroom number and by name.
 *                          A list of the people in her staterooms (table 'occupants', as data/rooms/occupants_1912.json:
 *                          the Cave list's first class) puts each line's names on the rows its staterooms resolve to
 *                          (each row's people: { labels, cabin, names, n, list }); I.people counts its lines and names
 *                          and keeps those not placed, with why
 *   named(I, text)         the people whose names hold every word of the text ("astor"), each with its row, its
 *                          staterooms and its line in its list, the best first
 *   labels(plan)           the stateroom numbers one row's plan list names: { label, printed, berths, how, note } each
 *   lookup(I, query)       a stateroom number as a reader types it ("C 102", "c102", "C-102", "#139", "139") or a row's
 *                          id as the tables write it ("C-021"): { query, label, row, how }, row null when none
 *   find(I, query)         lookup's row
 *   search(I, text)        the rows whose name or plan words hold every word of the text, the best first
 *   track(ship, opt)       a run's record of the first time each slab is wet: plain data that the caller keeps
 *   observe(tr, sim, w)    call after a step: a slab whose water reaches its threshold for the first time takes this
 *                          step's time and number (w: rooms.js's waterOf(sim), when the caller has it already)
 *   wetPieces(tr, row)     each of the row's pieces with its own first-wet time and step (null while dry)
 *   firstWet(tr, row)      the row's earliest wet piece { zone, side, slab, deck, floor, t, step }, or null while dry
 *   levelOf(sim, n, F)     space n's water as it stands now: its level in the world as rooms.js finds it, or that it is
 *                          dry or full; levels(sim, F) every space's at once
 *   slabCut(sim, s, L, F)  slab s's water below the world's level L (rooms.js's column cut on the slab's own pieces)
 *   depth(I, sim, row, w, lv)   in each of the row's slabs, now: its water (m3, and its share of the slab), whether it
 *                          is full, and the depth over the row's deck at the row's place
 *   compartment(zone)      the zone's bulkheads and the name of its space below E deck
 *   words(piece, when)     "water on C deck between bulkheads D and E, port side, at 1:58 am"
 *   clock(t, base)         a time of the night as the page's clockOf writes it ("1:58 am"); base: the run's start, in
 *                          seconds of the day (the 1912 preset's clock, 23:40; a watch's spec.clock0)
 *
 * Wet [bet]: a slab is wet from the first step its water (rooms.js's waterOf, m3 of sea) would stand WET = 1 cm deep
 * spread over its floor (its footprint, rooms.js's foot: the permeable plan area of its columns). Below that the water
 * is a film in its lowest corner. tools/cabins_tests.js prints what a tenth of it and ten times it would move.
 *
 * Honest words. At level 0 a room's water is its slab's: a deck's space in one of the model's 16 zones, on one side.
 * Inside a space her decks are open floor [stand-in], as they are in the core, until NH6's stage 1 shares a space's water
 * among its rooms. So this says "water on C deck between bulkheads D and E, port side, at 1:58 am", never "at this
 * cabin's door". Where the plans are dense a row is a block of rooms between passages, and a stateroom's own place inside
 * its block is not in the tables: a stateroom has its block's pieces and times.
 *
 * The depth over the room's deck. In each of a row's slabs the water stands at its space's one level (the core has one
 * level to a space), found from the space's water as rooms.js's waterOf finds it, so that the slabs' water below it is
 * rooms.js's share-out. It is measured up from the row's deck at the row's place there (the centroid of its outline in
 * that zone and on that side), to the deckhead at most (the slab's top over the place); a full slab gives the deckhead
 * and says so. The lowest slab of a space also holds its pockets' water (W6's bunker, G7's tank) in rooms.js's
 * share-out; that water is apart from the space's (the core keeps it outside sim.vol), so the level is the space's own.
 * Near a space's floor or its top a few m3 move its level far (the last of the air is a thin wedge under her deckhead):
 * there the depth follows rooms.js's share-out and may stand up to a metre from the core's own sim.level, which the core
 * solves for a merged pair to its own tolerance. A slab's water (m3) and its share are the steady numbers there.
 *
 * Stateroom numbers. The plans print a first- or second-class room's number with its deck's letter ("C 102") and a
 * third-class or crew room's as a number alone, which R3 writes "#139" (one numbering for the ship). The tables list them
 * in each row's plan, some with the berths ("E 1 2", "#20* 2"), some with the plan's own marks ("*", "**", kept as
 * printed), three as ranges ("#140* to #162* (even numbers; 2 to 6 berths)"). Where two rows name one number the
 * stronger naming holds it: a number listed with its berths, then one listed alone, then one listed "(in part)", then
 * one inside a range. Between two of equal strength, the row whose other numbers share the number's parity (a block on
 * one side of a passage is numbered all odd or all even; tools/cabins_tests.js counts how far R3's rows keep it).
 * index() keeps every such case in I.conflicts: findings for R3's tables, not corrections of them. A number it cannot
 * settle is in I.unresolved and resolves to no row.
 *
 * A library, as rooms.js and girder.js are: it keeps no state, registers no reader and writes nothing into a sim or into
 * the tables; its caches are keyed by the index and the ship, outside the sim, and a track is the caller's plain data. So
 * no fingerprint can move and the forecast never meets it (tools/cabins_tests.js). It reads the core's public functions
 * and rooms.js's table and share-out, and mirrors one piece of rooms.js for the depth: its space's level (its column cut,
 * cutAt, and its Newton's steps). A change there needs the same change here; the suite holds every slab's water below
 * the mirrored level to rooms.js's share-out. rooms.js is found when it is first wanted: the build bundles core/readers/
 * in name order, this file before it.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../core.js'), function () { return require('./rooms.js'); });
  else root.TitanicCabins = factory(root.TitanicCore, function () { return root.TitanicRooms; });
})(typeof self !== 'undefined' ? self : this, function (C, roomsLib) {
  'use strict';
  if (!C) return null;
  const DECKS = ['orlop', 'G', 'F', 'E', 'D', 'C', 'B', 'A', 'Boat'];   // keel up, as R3's tables
  const FLOOR = { orlop: 'below G' };   // the floor of the slab a deck's rooms stand in, where it is not the deck itself
  const WET = 0.01;                     // m [bet]: a slab is wet once its water would stand this deep over its floor
  const STRENGTH = { berths: 3, listed: 2, part: 1, range: 0 };
  // a plan's item that names a stateroom: "C 102", "E 1 2" (with its berths), "F 45* 2", "D 36 (3 berths, mostly)";
  // "#224** 2", "#9A** 8", "#141*"; and the ranges, "#140* to #162* (even numbers; 2 to 6 berths)"
  const ONE = /^([A-G]) (\d+)(\*{0,2})(?:\s+(\d+))?(?:\s*\((.*)\))?$/;
  const HASH = /^#(\d+[A-Z]?)(\*{0,2})(?:\s+(\d+))?(?:\s*\((.*)\))?$/;
  const RANGE = /^#(\d+)(\*{0,2}) to #(\d+)(\*{0,2})(?:\s*\((.*)\))?$/;
  const R = () => roomsLib();
  const cache = new WeakMap();          // index -> ship -> the rows' places
  const slabCache = new WeakMap();      // ship -> each slab's column pieces

  // a plan's list, split at its semicolons outside brackets ("#140* to #162* (even numbers; 2 to 6 berths)" is one item)
  function split(plan) {
    const out = [];
    let depth = 0, cur = '';
    for (const ch of String(plan == null ? '' : plan)) {
      if (ch === '(') depth++;
      else if (ch === ')' && depth > 0) depth--;
      if (ch === ';' && depth === 0) { if (cur.trim()) out.push(cur.trim()); cur = ''; } else cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  // the stateroom numbers a plan's list names, in its order; a range gives each of its numbers
  function labels(plan) {
    const out = [];
    for (const item of split(plan)) {
      let m = RANGE.exec(item);
      if (m) {
        const note = m[5] || '', even = /\beven numbers\b/.test(note), odd = /\bodd numbers\b/.test(note);
        for (let n = +m[1]; n <= +m[3]; n++) if (!(even && n % 2 === 1) && !(odd && n % 2 === 0)) out.push({ label: '#' + n, printed: item, berths: null, how: 'range', note });
        const w = /\bwith ((?:#\d+[A-Z]?(?:,\s*|\s+and\s+)?)+)/.exec(note);
        if (w) for (const x of w[1].match(/#\d+[A-Z]?/g)) out.push({ label: x, printed: item, berths: null, how: 'range', note });
        continue;
      }
      m = ONE.exec(item);
      const lettered = !!m;
      if (!m) m = HASH.exec(item);
      if (!m) continue;
      const label = lettered ? m[1] + ' ' + +m[2] : '#' + m[1].replace(/^0+(?=\d)/, '');
      const berths = lettered ? m[4] : m[3], note = (lettered ? m[5] : m[4]) || null;
      const how = note && /\bin part\b/.test(note) ? 'part' : berths ? 'berths' : 'listed';
      out.push({ label, printed: item, berths: berths ? +berths : null, how, note });
    }
    return out;
  }
  const numberOf = (label) => parseInt(label.replace(/^[A-G] |^#/, ''), 10);
  // words for searching: no accents, no case, letters and digits only
  const norm = (s) => String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9#]+/g, ' ').trim();

  // the index of the decks' rows
  function index(tables) {
    const decks = [].concat(tables || []).filter((T) => T && Array.isArray(T.rows) && DECKS.indexOf(T.deck) >= 0)
      .sort((a, b) => DECKS.indexOf(a.deck) - DECKS.indexOf(b.deck));
    const rows = [], byId = new Map(), byName = new Map(), cand = new Map(), named = new Map();
    for (const T of decks) {
      for (const r of T.rows) {
        const e = {
          id: r.id, deck: T.deck, floor: FLOOR[T.deck] || T.deck, kind: r.kind, name: r.name, plan: r.plan,
          beyond: (r.tags || []).indexOf('beyond the model') >= 0,
          pieces: (r.pieces || []).map((p) => ({ zone: p.zone, side: p.side, slab: p.slab, area: p.area, key: p.key })),
          x: r.x_m, y: r.y_m, labels: [], people: [], words: norm(r.name), planWords: norm(r.plan), src: r,
        };
        rows.push(e); byId.set(e.id, e);
        if (!byName.has(e.words)) byName.set(e.words, []);
        byName.get(e.words).push(e);
        const L = labels(r.plan);
        named.set(e, L);
        for (const l of L) {
          if (!cand.has(l.label)) cand.set(l.label, []);
          const list = cand.get(l.label), had = list.find((c) => c.row === e);
          if (!had) list.push({ row: e, how: l.how, printed: l.printed, berths: l.berths });
          else if (STRENGTH[l.how] > STRENGTH[had.how]) Object.assign(had, { how: l.how, printed: l.printed, berths: l.berths });
        }
      }
    }
    const byLabel = new Map(), conflicts = [], unresolved = [];
    for (const [label, list] of cand) {
      let keep = list, rule = [];
      if (keep.length > 1) {
        const top = Math.max.apply(null, keep.map((c) => STRENGTH[c.how]));
        const strong = keep.filter((c) => STRENGTH[c.how] === top);
        if (strong.length < keep.length) { keep = strong; rule.push('the stronger naming'); }
        if (keep.length > 1) {
          // the row whose other numbers share this one's parity (a block on one side of a passage is numbered all odd or
          // all even): the share of its other listed numbers that do
          const par = numberOf(label) % 2;
          const share = (c) => {
            const o = named.get(c.row).filter((l) => l.label !== label && l.how !== 'range');
            return o.length ? o.filter((l) => numberOf(l.label) % 2 === par).length / o.length : 0;
          };
          const best = Math.max.apply(null, keep.map(share)), same = keep.filter((c) => share(c) === best);
          if (same.length < keep.length) { keep = same; rule.push('its block\'s parity'); }
        }
        conflicts.push({ label, named: list.map((c) => ({ id: c.row.id, how: c.how, printed: c.printed })), to: keep.length === 1 ? keep[0].row.id : null, rule: rule.join(', then ') || null });
      }
      if (keep.length === 1) byLabel.set(label, keep[0].row);
      else unresolved.push(label);
    }
    for (const [e, L] of named) for (const l of L) if (byLabel.get(l.label) === e && e.labels.indexOf(l.label) < 0) e.labels.push(l.label);
    // the people a list names in her staterooms: each line's names on every row its staterooms resolve to, in the list's
    // order; a line with no stateroom, or with one her plans do not number, is kept apart with why
    const people = { lists: [], lines: 0, names: 0, placed: 0, unplaced: [] };
    const lists = [].concat(tables || []).filter((T) => T && T.table === 'occupants' && Array.isArray(T.rows))
      .sort((a, b) => (a.title < b.title ? -1 : a.title > b.title ? 1 : 0));
    for (const T of lists) {
      const list = T.title || 'a list';
      people.lists.push({ title: list, source: T.source ? T.source.title || null : null, what: T.source ? T.source.what || null : null });
      for (const r of T.rows) {
        const names = [].concat(r.names || []), ls = [].concat(r.labels || []), at = ls.map((l) => byLabel.get(l) || null);
        people.lines++; people.names += names.length;
        const missing = ls.filter((l, i) => !at[i]);
        if (!ls.length || missing.length) people.unplaced.push({ n: r.n, cabin: r.cabin == null ? null : r.cabin, names, list, why: !ls.length ? (r.cabin == null ? 'the list gives no stateroom' : 'no deck\'s letter and number to read in "' + r.cabin + '"') : 'her plans in R3\'s tables number no ' + missing.join(', ') });
        if (ls.length && !missing.length) people.placed++;
        const done = new Set();
        at.forEach((e) => {
          if (!e || done.has(e)) return;
          done.add(e);
          e.people.push({ labels: ls.filter((l, j) => at[j] === e), cabin: r.cabin == null ? null : r.cabin, names, n: r.n, list });
        });
      }
    }
    return { decks: decks.map((T) => T.deck), rows, byId, byName, byLabel, conflicts, unresolved, people };
  }

  // the people whose names hold the text as a phrase, or every one of its words, with the rows they stand in: the
  // phrase first, then by their line in their list and the row's id (a line of two staterooms in two rows gives both)
  function named(I, text, max) {
    const q = norm(text);
    if (!q || !I.people) return [];
    const words = q.split(' '), hits = [];
    for (const e of I.rows) {
      for (const p of e.people) {
        const n = norm(p.names.join(' '));
        const score = n.indexOf(q) >= 0 ? 0 : words.every((w) => n.indexOf(w) >= 0) ? 1 : -1;
        if (score >= 0) hits.push([score, { row: e, names: p.names, labels: p.labels, cabin: p.cabin, n: p.n, list: p.list }]);
      }
    }
    hits.sort((a, b) => a[0] - b[0] || (a[1].list < b[1].list ? -1 : a[1].list > b[1].list ? 1 : 0) || a[1].n - b[1].n || (a[1].row.id < b[1].row.id ? -1 : a[1].row.id > b[1].row.id ? 1 : 0));
    const out = hits.map((h) => h[1]);
    return max > 0 ? out.slice(0, max) : out;
  }

  // a stateroom number or a row's id, from what a reader types
  function lookup(I, query) {
    const q = String(query == null ? '' : query).trim();
    const id = I.byId.get(q) || I.rows.find((e) => e.id.toUpperCase() === q.toUpperCase());
    if (id) return { query, label: null, row: id, how: 'id' };
    const u = q.toUpperCase().replace(/\*/g, '');
    let label = null, m = /^([A-G])\s*-?\s*(\d+)$/.exec(u);
    if (m) label = m[1] + ' ' + +m[2];
    else if ((m = /^#?\s*(\d+)\s*([A-Z]?)$/.exec(u))) label = '#' + +m[1] + m[2];
    return { query, label, row: label ? I.byLabel.get(label) || null : null, how: label ? 'number' : null };
  }
  function find(I, query) { return lookup(I, query).row; }

  // the rows whose name or plan hold every word of the text, best first: the name is the text, begins with it, holds it
  // as a phrase, holds each of its words, or the name and the plan together do; then by id
  function search(I, text, max) {
    const q = norm(text);
    if (!q) return [];
    const words = q.split(' '), hits = [];
    for (const e of I.rows) {
      const n = e.words;
      const score = n === q ? 0 : n.indexOf(q + ' ') === 0 ? 1 : n.indexOf(q) >= 0 ? 2 : words.every((w) => n.indexOf(w) >= 0) ? 3
        : words.every((w) => n.indexOf(w) >= 0 || e.planWords.indexOf(w) >= 0) ? 4 : -1;
      if (score >= 0) hits.push([score, e]);
    }
    hits.sort((a, b) => a[0] - b[0] || (a[1].id < b[1].id ? -1 : a[1].id > b[1].id ? 1 : 0));
    const out = hits.map((h) => h[1]);
    return max > 0 ? out.slice(0, max) : out;
  }

  // ------------------------------------------------------------ a run's first-wet times, by slab
  function track(ship, opt) {
    const T = R().table(ship), wet = opt && opt.wet != null ? opt.wet : WET, n = T.list.length;
    const thr = new Array(n), t = new Array(n), step = new Array(n);
    for (let s = 0; s < n; s++) { thr[s] = wet * T.list[s].foot; t[s] = null; step[s] = null; }
    return { v: 1, wet, slabs: n, thr, t, step, calls: 0, tLast: null };
  }
  function observe(tr, sim, w) {
    w = w || R().waterOf(sim);
    const k = sim.night ? sim.night.k : Math.round(sim.t / sim.params.dt);
    for (let s = 0; s < tr.slabs; s++) if (tr.t[s] === null && w[s] >= tr.thr[s]) { tr.t[s] = sim.t; tr.step[s] = k; }
    tr.calls++;
    tr.tLast = sim.t;
    return tr;
  }
  function wetPieces(tr, row) {
    return row.pieces.map((p) => ({ zone: p.zone, side: p.side, slab: p.slab, area: p.area, deck: row.deck, floor: row.floor,
      t: p.slab >= 0 ? tr.t[p.slab] : null, step: p.slab >= 0 ? tr.step[p.slab] : null, outside: p.slab < 0 }));
  }
  function firstWet(tr, row) {
    let best = null;
    for (const p of wetPieces(tr, row)) if (p.t !== null && (!best || p.t < best.t || (p.t === best.t && p.slab < best.slab))) best = p;
    return best;
  }

  // ------------------------------------------------------------ the depth over the room's deck
  // the model's zones by x, bow first, as tools/rooms_table.js cut the rows into their pieces
  const ZB = [Infinity].concat(C.BULKHEADS.map((b) => b.x), [-Infinity]);
  function clip(poly, f) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length], fp = f(p), fq = f(q);
      if (fp >= 0) out.push(p);
      if ((fp >= 0) !== (fq >= 0)) { const u = fp / (fp - fq); out.push([p[0] + u * (q[0] - p[0]), p[1] + u * (q[1] - p[1])]); }
    }
    return out;
  }
  function centroid(poly) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length], c = p[0] * q[1] - q[0] * p[1];
      a += c; cx += (p[0] + q[0]) * c; cy += (p[1] + q[1]) * c;
    }
    return Math.abs(a) > 1e-9 ? [cx / (3 * a), cy / (3 * a)] : null;
  }
  // each slab's column pieces in rooms.js's table, for one ship
  function slabPieces(ship) {
    let S = slabCache.get(ship);
    if (S) return S;
    const T = R().table(ship), Q = T.list.map(() => []);
    for (let q = 0; q < T.col.length; q++) Q[T.slab[q]].push(q);
    S = { T, Q };
    slabCache.set(ship, S);
    return S;
  }
  // the row's place in each of its pieces, for one index and ship
  function geo(I, ship) {
    let byShip = cache.get(I);
    if (!byShip) { byShip = new WeakMap(); cache.set(I, byShip); }
    let G = byShip.get(ship);
    if (G) return G;
    const { T, Q } = slabPieces(ship), c = ship.cols;
    const place = new Map();
    for (const e of I.rows) {
      const at = [];
      for (const p of e.pieces) {
        if (p.slab < 0 || !T.list[p.slab]) { at.push(null); continue; }
        let poly = (e.src.poly_m || []).map((v) => [v[0], v[1]]);
        poly = clip(poly, (v) => ZB[p.zone] - v[0]);
        poly = clip(poly, (v) => v[0] - ZB[p.zone + 1]);
        poly = clip(poly, (v) => (p.side === 0 ? v[1] : -v[1]));
        let xy = poly.length >= 3 ? centroid(poly) : null;
        if (!xy) {   // a sliver: the middle of the row's extent, inside the zone and on the side
          const x0 = Math.max(Math.min(e.x[0], e.x[1]), ZB[p.zone + 1]), x1 = Math.min(Math.max(e.x[0], e.x[1]), ZB[p.zone]);
          const ys = p.side === 0 ? [Math.max(0, Math.min(e.y[0], e.y[1])), Math.max(0, e.y[0], e.y[1])] : [Math.min(0, e.y[0], e.y[1]), Math.min(0, Math.max(e.y[0], e.y[1]))];
          xy = [0.5 * (x0 + x1), 0.5 * (ys[0] + ys[1])];
        }
        // the slab's top over the place: its column piece nearest to it
        let best = -1, d2 = Infinity;
        for (const q of Q[p.slab]) { const i = T.col[q], dx = c.x[i] - xy[0], dy = c.y[i] - xy[1], d = dx * dx + dy * dy; if (d < d2) { d2 = d; best = q; } }
        at.push({ x: xy[0], y: xy[1], zDeck: C.deckZ(e.deck, xy[0]), zTop: T.hi[best] });
      }
      place.set(e, at);
    }
    G = { T, place };
    byShip.set(ship, G);
    return G;
  }
  // the water a space's lowest slab holds of its pockets in rooms.js's share-out (min(vol, cap); a pocket of both sides
  // half to each half)
  function pocketsIn(sim, T, s) {
    const n = T.list[s].n;
    if (T.byNode[n][0] !== s) return 0;
    let v = 0;
    for (const k of sim.pockets || []) {
      const held = Math.min(k.vol, k.cap);
      if (!(held > 0)) continue;
      if (k.side < 0) { if (k.node === n || k.node - 2 === n) v += 0.5 * held; } else if (k.node === n) v += held;
    }
    return v;
  }
  // the water of space n's pieces, or of one of its slabs (only), below the world's level L at the pose F (m3), and its
  // rate with L (m2): rooms.js's column cut (its cutAt), on the same pieces in the same order
  function cutAt(T, sim, n, F, L, only) {
    const c = sim.ship.cols, mu = sim.ship.nodeMu[n];
    let v = 0, a = 0;
    for (let q = T.start[n]; q < T.start[n + 1]; q++) {
      if (only !== undefined && T.slab[q] !== only) continue;
      const i = T.col[q], zc = (L - (F.R20 * c.x[i] + F.R21 * c.y[i] + F.tz)) / F.R22;
      if (zc <= T.lo[q]) continue;
      if (zc < T.hi[q]) { v += mu * c.dxdy[i] * (zc - T.lo[q]); a += mu * c.dxdy[i] / F.R22; }
      else v += mu * c.dxdy[i] * (T.hi[q] - T.lo[q]);
    }
    return [v, a];
  }
  // space n's water as it stands at the pose F: the world's level at which the space holds its water (sim.vol) below it,
  // found as rooms.js's waterOf finds it (its bracket, its start at the core's sim.level, its Newton's steps and its
  // tolerance), so that its slabs' water below that level is rooms.js's share-out; dry or full, no level. A slab alone
  // cannot give it: at the founder's trim a slab's columns can stand clear of each other, and a slab's water is then the
  // same over a band of levels; the space's columns, each the space's whole height, never can.
  function levelOf(sim, n, F) {
    const T = R().table(sim.ship), c = sim.ship.cols, V = sim.vol[n], Vmax = sim.ship.nodeVmax[n];
    F = F || sim._F || C.frameOf(sim);
    if (!(V > 0) || !T.byNode[n].length) return { n, dry: true, full: false, level: null, err: 0 };
    if (V >= Vmax) return { n, dry: false, full: true, level: null, err: 0 };
    let lo = Infinity, hi = -Infinity;
    for (let q = T.start[n]; q < T.start[n + 1]; q++) {
      const i = T.col[q], b = F.R20 * c.x[i] + F.R21 * c.y[i] + F.tz;
      const z0 = b + F.R22 * T.lo[q], z1 = b + F.R22 * T.hi[q];
      if (z0 < lo) lo = z0; if (z1 > hi) hi = z1;
    }
    let L = Math.min(hi, Math.max(lo, sim.level[n])), err = 0;
    for (let it = 0; it < 60; it++) {
      const [v, a] = cutAt(T, sim, n, F, L), d = V - v;
      err = Math.abs(d);
      if (Math.abs(d) <= 1e-12 * Vmax) break;
      if (d > 0) lo = L; else hi = L;
      const Ln = a > 0 ? L + d / a : NaN;
      L = Ln > lo && Ln < hi ? Ln : 0.5 * (lo + hi);   // Newton's step, or halve the bracket
    }
    return { n, dry: false, full: false, level: L, err };
  }
  // every space's level at once (for depth over many rows at one step)
  function levels(sim, F) {
    F = F || sim._F || C.frameOf(sim);
    const out = new Array(C.NN);
    for (let n = 0; n < C.NN; n++) out[n] = levelOf(sim, n, F);
    return out;
  }
  // slab s's water below the world's level L at the pose F (m3): the column cut on the slab's own pieces
  function slabCut(sim, s, L, F) {
    const T = R().table(sim.ship);
    return cutAt(T, sim, T.list[s].n, F || sim._F || C.frameOf(sim), L, s)[0];
  }
  // in each of the row's slabs now: its water (m3) and its share of the slab, whether it is full, and the depth over the
  // row's deck at the row's place there, up to the deckhead (lv: levels(sim), when the caller has them already)
  function depth(I, sim, row, w, lv) {
    const G = geo(I, sim.ship), T = G.T, at = G.place.get(row) || [];
    w = w || R().waterOf(sim);
    const F = sim._F || C.frameOf(sim);
    const out = [];
    row.pieces.forEach((p, j) => {
      const g = at[j];
      if (!g) return;
      const s = p.slab, n = T.list[s].n, L = lv ? lv[n] : levelOf(sim, n, F), head = g.zTop - g.zDeck;
      const full = L.full || w[s] - pocketsIn(sim, T, s) >= T.list[s].vmax * (1 - 1e-12);
      let d = 0;
      if (full) d = head;
      else if (!L.dry) d = Math.min(Math.max((L.level - (F.R20 * g.x + F.R21 * g.y + F.tz)) / F.R22 - g.zDeck, 0), head);
      out.push({ zone: p.zone, side: p.side, slab: s, deck: row.deck, floor: row.floor, x: g.x, y: g.y, m3: w[s], fill: w[s] / T.list[s].vmax, depth: d, head, full, level: L.level });
    });
    return out;
  }

  // ------------------------------------------------------------ words
  function compartment(zone) {
    const B = C.BULKHEADS, fwd = zone > 0 ? B[zone - 1].id : null, aft = zone < B.length ? B[zone].id : null;
    const between = fwd && aft ? 'between bulkheads ' + fwd + ' and ' + aft : fwd ? 'abaft bulkhead ' + fwd : 'forward of bulkhead ' + aft;
    return { zone, fwd, aft, between, below: C.ZONES[zone] ? C.ZONES[zone].name : null };
  }
  function deckWords(floor) { return floor === 'below G' ? 'below G deck' : floor === 'Boat' ? 'on the Boat deck' : 'on ' + floor + ' deck'; }
  function words(piece, when) {
    return 'water ' + deckWords(piece.floor) + ' ' + compartment(piece.zone).between + ', ' + (piece.side ? 'starboard' : 'port') + ' side' + (when ? ', at ' + when : '');
  }
  function clock(t, base) {
    const s = (((base + t) % 86400) + 86400) % 86400, m = Math.floor(s % 3600 / 60);
    let h = Math.floor(s / 3600);
    const ap = h >= 12 ? 'pm' : 'am';
    h %= 12;
    if (h === 0) h = 12;
    return h + ':' + String(m).padStart(2, '0') + ' ' + ap;
  }

  return { DECKS, WET, split, labels, index, lookup, find, search, named, track, observe, wetPieces, firstWet, levelOf, levels, slabCut, depth, compartment, words, clock };
});

/*
 * Her lights by circuit: G1 of docs/DESIGN_the_living_ship_v1_2026-11-23.md (NH15), "the sea shorts a section before the
 * dynamos fail".
 *
 * A reader of the watch (core/night.js, "readers"): attached to every watch, stepped after the model's own step. Its
 * state is sim.circuits, plain data. It reads the plant's supply (sim.plant: power, lights) and the core's water (sim.vol,
 * sim.level, at the pose of the core's last flows, sim._F) and writes into none of them; it pushes nothing into
 * sim.events and draws nothing at random. The plant keeps the supply: its lights (1 all her light, PLANT.emergency.lights
 * on the emergency dynamos alone, 0 none) stay what they are, and a watch has the same fingerprint with this reader as
 * without (tools/circuits_tests.js).
 *
 * Sources: the plant note, docs/research/RESEARCH_ship_systems_plant_v1_2026-11-16.md, section 5 (tags as there: [read]
 * in a source the note read, [bet] no source):
 * - about 10,000 lamps on the main circuit [read: the British Report, "Electrical Installation"];
 * - a separate emergency circuit, fed by the two emergency dynamos on D deck: 500 lamps "in passenger and crew passages,
 *   stairways, machinery spaces and the Boat deck" [read: ibid.];
 * - her lights aft burned until her after end went under, then went out gradually; flooding blows the fuses (Greaser
 *   Ranger agreed with counsel, BI 4110-4153) [read].
 * Not found: how the mains were divided, which of the Boat deck's lamps were on the emergency circuit, and how high the
 * fittings stood over her decks. So, each a bet until a source is found:
 * - [bet] a section is one of the slabs of core/readers/rooms.js: one deck's space in one watertight compartment on one
 *   side, 250 of them, in that table's order. Each section has a main circuit and an emergency circuit (the passages,
 *   stairways and machinery spaces run through every compartment; in a cargo hold's slab, a stand-in).
 * - [bet] a section's share of her light is its floor's share of all her floors (the slabs' footprints, by the core's
 *   columns). Of each section's share, the emergency circuit's is the plant's own PLANT.emergency.lights [bet there]: a
 *   share of her light, where the lamps' count would give 500 of 10,500.
 * - [bet] SET.short: a section's fuses blow, both its circuits together and for good, once the sea in its space stands
 *   1.2 m (about 4 ft, the switches by the doors) over the section's floor at its middle: the core's own level (sim.level,
 *   with more than 0.5 m3 of water in the space) against the world height of that point at the pose of the core's last
 *   flows, as the plant asks of a room's furnaces (wet() in core/systems.js). A section lower than SET.short blows when
 *   the sea reaches its deckhead there. A short blows its own fuses and drags nothing down (the design's question: the
 *   sources point to the fuse).
 * A circuit is lit while its supply has current, as the plant's lights say (a main circuit while the main dynamos run,
 * P.power; an emergency circuit while any dynamo runs, P.lights > 0), and its section's fuses hold. So her light by
 * circuit is the plant's lights times the share of her sections whose fuses hold: with no section shorted, the plant's
 * lights exactly.
 *
 * A watch's settings (spec.circuits, so that a replay carries them; SET when absent): short, m (Infinity: no fuse ever
 * blows, the plant's one level for the whole ship).
 *
 * sim.circuits:
 *   short       the bet in force, m
 *   emergency   the emergency circuits' share of each section's light (PLANT.emergency.lights at the watch's start)
 *   held        the share of her light whose sections' fuses hold (1 at the start)
 *   lit         her light by circuit now: P.lights x held (1 all her light, 0 none)
 *   out         how many sections' fuses have blown
 *   sections    [{ key, zone, side, floor, share, out }]: rooms.js's slabs in its order (key zone:P|S:floor; side 0 port,
 *               1 starboard; floor the deck the section stands on, 'below G' the lowest); share of her light; out the
 *               watch's clock (s) when its fuses blew, -1 while they hold
 * Circuits.list(sim) gives every circuit (main and emergency of each section) with its share and whether it is lit now.
 *
 * A preset has no readers (the page steps it with C.step and the plant's step): Circuits.start(sim, spec) gives it the
 * same state as a watch's sim.circuits, kept by the stepper, and Circuits.step(sim, st) carries it on after each step
 * (D97: the page's ports by their sections). Circuits.sectionOf(ship, x, y, z) is the section a point of her frame lies
 * in (rooms.js's slabAt), an index into sections, -1 outside her spaces: a port's light is its section's, lit while the
 * plant has light and the section holds (as tools/u3_lights.js draws them, version 2).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../core.js'), require('../night.js'), require('../systems.js'), () => require('./rooms.js'));
  else root.TitanicCircuits = factory(root.TitanicCore, root.TitanicNight, root.TitanicSystems, () => root.TitanicRooms);
})(typeof self !== 'undefined' ? self : this, function (C, N, Sys, roomsOf) {
  'use strict';
  if (!C || !N || !N.reader) return null;
  const SET = { short: 1.2 };       // m over a section's floor at its middle, at which its fuses blow [bet: the switches by the doors]
  const TRACE = 0.5;                // m3: less water than this in a space is no sea in it (the plant's wet())
  const cache = new WeakMap();

  // each section's place, by rooms.js's slabs (the bundle loads this file before rooms.js, so it is asked for when a watch
  // is made): its space n; the middle of its floor (x, y: its columns' centroid by their footprints; z: the mean of its
  // columns' bottoms there, the deck or, below G deck, the space's own bottom), m in her frame; its mean height h (its
  // volume over its footprint), m; its share of all her floors
  function table(ship) {
    let G = cache.get(ship);
    if (G) return G;
    const R = roomsOf(); if (!R) return null;
    const T = R.table(ship), c = ship.cols, S = T.list.length;
    const a = new Float64Array(S), ax = new Float64Array(S), ay = new Float64Array(S), az = new Float64Array(S), av = new Float64Array(S);
    for (let q = 0; q < T.col.length; q++) {
      const i = T.col[q], j = T.slab[q], w = c.dxdy[i];
      a[j] += w; ax[j] += w * c.x[i]; ay[j] += w * c.y[i]; az[j] += w * T.lo[q]; av[j] += w * (T.hi[q] - T.lo[q]);
    }
    let A = 0;
    for (let j = 0; j < S; j++) A += a[j];
    G = { list: T.list, n: new Int32Array(S), x: new Float64Array(S), y: new Float64Array(S), z: new Float64Array(S), h: new Float64Array(S), share: new Float64Array(S) };
    for (let j = 0; j < S; j++) {
      G.n[j] = T.list[j].n; G.x[j] = ax[j] / a[j]; G.y[j] = ay[j] / a[j]; G.z[j] = az[j] / a[j]; G.h[j] = av[j] / a[j]; G.share[j] = a[j] / A;
    }
    cache.set(ship, G);
    return G;
  }

  // a fresh state of her circuits for a run: a watch's sim.circuits (attach), or the one a preset's stepper keeps itself
  // (the page steps a preset with no readers: start, then step(sim, st) after each of the model's steps, as the onset's
  // check is kept). spec.circuits.short, where given, sets the bet
  function start(sim, spec) {
    const G = table(sim.ship); if (!G) return null;
    const set = spec && spec.circuits;
    const short = set && set.short !== undefined ? set.short : SET.short;
    return {
      short, emergency: Sys ? Sys.PLANT.emergency.lights : 0.15, held: 1, lit: sim.plant ? sim.plant.lights : 1, out: 0,
      sections: G.list.map((s, j) => ({ key: s.key, zone: s.zone, side: s.side, floor: s.floor, share: G.share[j], out: -1 })),
    };
  }
  function attach(sim, spec) { const S = start(sim, spec); if (S) sim.circuits = S; }

  // the world height of section j's switches at the pose F (its floor at its middle, SET.short over it, or its deckhead)
  function switchesZ(G, j, short, F) { return C.worldZ(F, G.x[j], G.y[j], G.z[j] + Math.min(short, G.h[j])); }

  // after each of the model's steps: a watch's own state (sim.circuits, the reader's step), or a preset's st
  function step(sim, st) {
    const S = st || sim.circuits; if (!S) return;
    const L = S.sections;
    if (S.out < L.length && S.short < Infinity) {
      const G = table(sim.ship), F = sim._F || C.frameOf(sim);
      let blew = false;
      for (let j = 0; j < L.length; j++) {
        if (L[j].out >= 0) continue;
        const n = G.n[j];
        if (sim.vol[n] > TRACE && sim.level[n] >= switchesZ(G, j, S.short, F)) { L[j].out = sim.t; S.out++; blew = true; }
      }
      if (blew) {      // the share still held, summed in the table's order (0 once every section has gone)
        let h = 0;
        if (S.out < L.length) for (let j = 0; j < L.length; j++) if (L[j].out < 0) h += L[j].share;
        S.held = h;
      }
    }
    S.lit = (sim.plant ? sim.plant.lights : 1) * S.held;
  }

  // every circuit, two to a section: { section (its index), kind 'main' | 'emergency', share of her light, lit now }; st as
  // for step
  function list(sim, st) {
    const S = st || sim.circuits; if (!S) return [];
    const P = sim.plant, main = !P || P.power, any = !P || P.lights > 0, out = [];
    S.sections.forEach((s, j) => {
      out.push({ section: j, kind: 'main', share: s.share * (1 - S.emergency), lit: main && s.out < 0 });
      out.push({ section: j, kind: 'emergency', share: s.share * S.emergency, lit: any && s.out < 0 });
    });
    return out;
  }

  // the section a point of her frame lies in (rooms.js's slabAt: its compartment, its side, the deck under it), as an index
  // into sections; -1 outside her spaces. A port, a window, any lamp of the drawn ship: its light is its section's
  function sectionOf(ship, x, y, z) { const R = roomsOf(); return R ? R.slabAt(ship, x, y, z) : -1; }

  N.reader({ name: 'circuits', state: 'circuits', attach, step });
  return { SET, TRACE, table, start, attach, step, list, switchesZ, sectionOf };
});

/*
 * The fall: the free body (step Z1 of docs/BRAINSTORM_the_descent_to_the_bed_v2_2026-11-19.md, sections 4, 5.1, 5.2;
 * the break design's B5). From the founder flag she is one rigid body or two, carried to the bed on physics. Headless,
 * deterministic (sums in a fixed order; the one draw, the bed's slope, from a seed), no DOM; every state is plain data
 * or typed arrays. It registers nothing with core/night.js: joining it to the watch is step Z3, not this file's.
 *
 *   sea(spec)                        the water column to the bed, and the bed (plain data)
 *   piece(ship, sim, x0, x1, opts)   a rigid body built from the model itself between two stations of her length
 *   begin(sim, opts)                 sim.fall from a sim at its founder flag, by the interim rule H1
 *   step(sim)                        sim.fall on by one dt (the model's 0.25 s); `done` once every piece is at rest
 *   body, make, place, advance       the same machinery for the trials: bodies let go where a test puts them
 *
 * THE CONTRACT (the plan's 5.1, v: 3; the page reads these fields and nothing else of the fall). v: 2 is v: 1 with one
 * field more, breakAt (agreed by the lanes on 2026-11-20; a reader of v: 1 finds nothing else changed); v: 3 is v: 2
 * with one field more, lights (G2 of NH15, 2026-11-23; a reader of v: 2 finds nothing else changed):
 *   sim.fall = { v: 3, rule: 'flag' | 'break', t0, k, t, done,
 *     sea: { depth, ... },        the column's tables at z = i dz (dz, n, T deg C, S, rho kg/m3, p Pa absolute, c m/s) and
 *                                 the bed: its depth at (X, Y) is depth + slope[0] X + slope[1] Y (+ relief, none here)
 *     at: { X, Y, psi },          where the fall's frame lies on the earth when it began (all 0 on a preset)
 *     breakAt: [X, Y] | null,     the point on the sea's surface under the break when the fall began, in the frame of
 *                                 pieces[].r: the cut station on the girder's neutral axis (x at the cut, y 0, z Z_NA).
 *                                 null when she falls whole. The boilers mark it on the bed (the wreck's boiler field)
 *     pieces: [{ id: 'bow' | 'stern' | 'whole', x0, x1, r: [X, Y, Z], q: [w, x, y, z], v: [u, v, w], om: [p, q, r],
 *                state: 'afloat' | 'under' | 'falling' | 'striking' | 'at rest', depth, speed, air, bury: Float64Array }],
 *     debris: [],                 Z7's (closed forms); empty here
 *     events: [{ t, id: 'under' | 'report' | 'strike' | 'rest', piece, depth, energy, speed }],
 *     lights: { level: [], lit: [] | null, dark: [], sections: { piece: [], out: [] } | null } | null }
 * and one key beside them that the page must not read, sim.fall.eng: the engine's own state (each piece's slices, its
 * mass matrix, momenta and air; the coefficients; how her lights run down). Its form may change without a new contract
 * version.
 * The fields, exactly:
 *   r, q      a ship-frame point p of the piece stands at R(q) p + r in the fall's world frame (below): r is where the
 *             ship frame's origin (amidships, centreline, keel) is carried, and q her attitude, a unit quaternion
 *   v, om     the velocity of that same point and her angular velocity, both in her own axes (m/s, rad/s)
 *   depth     the depth of her lowest point, m (positive down); speed: her centre of mass's speed through the water, m/s
 *   air       m3 of air in her now, at its own pressure; bury: m of each slice's lowest point below the mud line, from
 *             her after end forward (her slices are the model's 3 m slices cut at x0 and x1)
 *   events    depth: her `depth` at the event; energy: her kinetic energy then, with the water in her and the water she
 *             drags (J; at 'rest', the work the mud took); speed: her `speed` then. 'report' is Z6's: one a space giving
 *             way with an energy past K.reportMin (an audible failure), its depth the depth of that space's free surface
 *             and its energy its air's lag behind the sea times its volume (J); it fires only under the what-if K.air
 *             'spaces' (none by default)
 *   t         the fall's clock, on sim.t's scale (t0 + k dt); step() never writes sim.t
 *   lights    her light carried piece by piece from the hand-over (G2 of docs/DESIGN_the_living_ship_v1_2026-11-23.md;
 *             "HER LIGHTS" below); null when the hand-over has no plant (sim.plant), as on a preset of the trials. Per
 *             piece, in pieces' order: level, its supply now as the plant's lights are (1 the main dynamos, the
 *             emergency share PLANT.emergency.lights the emergency dynamos alone, 0 none); dark, the clock (sim.t's
 *             scale) when its supply ended, -1 while it has one (the plant's own time of 'dark' when she was dark
 *             before the hand-over; t0 for a piece cut from her dynamos at the break); lit, its light now as a share of
 *             her whole light (its level times the share of her light whose sections' fuses hold on it), so that the
 *             pieces' lit sum to the circuits' sim.circuits.lit before the cut; null without sections. sections, when the
 *             hand-over has G1's circuits (sim.circuits, core/readers/circuits.js), in that table's order: piece, the
 *             index of the piece the section rides (by its middle), and out, the clock when its fuses blew (as
 *             sim.circuits had it at the hand-over, then the fall's), -1 while they hold. A section's main circuit is
 *             lit while its piece's level is 1 and its fuses hold, its emergency circuit while the level is above 0
 *             and they hold (G1's rule). Past the hand-over sim.circuits stands as the hand-over left it: read these
 *             instead
 *
 * FRAMES. Her own axes are the ship frame's: x forward from amidships, y to port, z up from the keel. The fall's world
 * frame is the core's at the hand-over: X along her heading then, Y to port of it, Z up, the sea's surface at Z = 0. At
 * the hand-over each piece has the core's own pose (R = Ry(pitch) Rx(roll), r = frameOf's translation), so she does not
 * jump. `at` puts that frame on the earth as core/motion.js has it (X north, Y east, psi clockwise from north):
 *   earth (N, E) = (at.X, at.Y) + X (cos psi, sin psi) + Y (sin psi, -cos psi)                    (earthOf below)
 * Fathom's frame has z down and y to starboard: a vector there is (x, -y, -z) here. Nothing of Fathom's is called.
 *
 * THE MOTION. Six degrees of freedom about the envelope's centroid C, her attitude a unit quaternion: no Euler angle
 * and no clamp anywhere (a falling hull passes 90 degrees). Kirchhoff's equations in her generalized momenta P, L with
 * M the whole 6 x 6 mass matrix about C (her structure, the water in her, less her air, plus the added mass):
 *   dP/dt = P x om + F          dL/dt = L x om + P x v + T          (Lamb 1932; Fossen 2011, 6.3)
 * so that Munk's moment, the P x v term, comes from the added masses alone, with no coefficient of its own. Water that
 * comes into her as her air is squeezed or vents arrives at rest: her momenta are kept and her speed falls.
 * THE STEP. Kick then drift, sub-stepped (sub in the water, subBed near and in the bed): each sub-step takes its
 * forces at the sub-step's middle (the implicit midpoint rule, iterated to 1e-12), then kicks the momenta and drifts
 * her place and attitude on the middle velocities (the attitude by the Cayley map). So the inviscid forces do no net
 * work, gravity and buoyancy work exactly through their potential (their density averaged over each point's path), and
 * the energy closes to rounding (tools/fall_trials.js, trial 2). Fathom's step (its motion.js) is the same
 * kick and drift, explicit, with its pitch clamped at 1.4 rad (:158), which this one must not have. In the step: no
 * Math.pow and no Math.hypot (core/motion.js's rule). Every transcendental is the model's own, plain arithmetic that
 * every engine computes alike (E1, E2a; QC B-7): C.sin and C.cos; C.log10 in the step's two lines (friction's Reynolds
 * number, the mud's rate factor) and C.atan2 for the joint's angle; C.log and C.tan only in its tables (the added mass,
 * Lamb's coefficients, the bed's slope). So a fall in the page has the same bits as in Node (tools/engine_tests.js
 * allows this file nothing). Halving the step moves her place on the bed by a millimetre (trials, "convergence").
 *
 * THE FORCES, slice by slice (docs/research/RESEARCH_falling_hull_physics_v1_2026-11-19.md, "R6", section 10; each
 * coefficient's source is beside it in K below):
 *   weight      the structure's, by the girder reader's curve (TitanicGirder.weight: the model's own, closed to sim.ms
 *               and its centre), at each slice's centroid; the water in her at the floodable volume's centroid
 *   buoyancy    the envelope's, at the local in-situ density (partly out of the sea: the section cut by the sea's plane
 *               at three Gauss points along the slice, exactly, at any attitude; there her drag is in proportion to how
 *               much of each slice is under, her added mass kept whole [mine: the water taken as unbounded; Z6's])
 *               Wholly flooded, the water in her and the envelope round it cancel, and what is left is her structure's
 *               weight against the buoyancy of her solids: the model's are her double bottom and the share of each space
 *               its permeability leaves, and they sit low. So the model's flooded hull is top-heavy, her weight in water
 *               acting about 0.5 m above her section's centre: falling flat the flow holds her keel down; end on, nothing
 *               does, and she turns over (tools/fall_trials.js, trials 5 and 12)
 *   air         one lumped pocket a piece, along her where her air was when the fall began, across her through each
 *               slice's floodable centre (K.airAt, G12; 'flag': where the air lay at the hand-over's pose, the default
 *               for a hand-over at the break's onset, K0.airAtBreak, D98): Boyle,
 *               isothermal, at its own depth; it vents through `vent` m2 (by default the core's own share of the top
 *               deck open to the sea, params.fOpen, over the piece's length) under a head of K.ventHead. A stand-in for
 *               Z6's spaces, which the what-if K.air 'spaces' puts in its place (M2 4c: core/readers/spaces.js; each
 *               space's own water and air, exchanged through the core's openings and the cut, giving way past its
 *               head with a 'report'; their air the pocket, its volume and its centroid, each sub-step)
 *   cross-flow  0.5 rho Cd h |c| c on each slice's cross-flow c, h and Cd by the face that leads (keel, deck, side)
 *   along her   form drag on the leading end (faired or torn), ITTC-57 friction with a roughness allowance
 *   lift        the slender body's, where the flow leaves a torn end: -|u| m'(end) c(end) (R6 10.1; e33's form)
 *   turning     each section's own cross-flow drag as it rolls about its centre [mine: the cross-flow principle
 *               applied across the section]
 *   added mass  2-D rectangles by each slice's own proportions (DNV-RP-C205 Table A-1 as R6 remembers it), the
 *               spheroid's k2 for the ends and k' for the turning modes (Lamb), k1 along her; at the column's mean
 *               density, so that her impulse is her own (0.9 % off at either end, a tenth of its own uncertainty)
 *   the bed     each slice below the mud line is resisted by R6's bearing law (True's form), q = R_f N_c s_u + 0.5 C_d
 *               rho_s v_n^2, on the shadow of its part in the mud, against its motion, at the centroid of its corners
 *               in the mud weighted by how far each is in; the mud does not pull. At her first touch the water she drags
 *               is shed (R6's default: not carried into the mud), its energy counted as the following water's. A piece
 *               whose every slice has moved slower than K.vRest for K.tRest, with the mud's static capacity under her
 *               above her weight in water, is held where it is ('at rest'). Z5 refines all of it
 *
 * NOT HERE (the plan's later steps): the spaces' own air and their reports by default (Z6: a what-if, K.air 'spaces',
 * without the joint), the three sets of columns at the surface (Z6), the bed's faces, adhesion and the landing's
 * bending (Z5), debris (Z7), currents, and any coupling between two pieces once the joint has let go (they do not touch
 * each other).
 *
 * Numbers: [read] where a source gives it, [derived] for arithmetic on them, [bet] where nothing was found, [textbook]
 * from memory, as R6 tags them; [mine] for a choice of this module's, with its reason.
 */
(function (root, factory) {
  // the girder reader is found when it is called, not when this file loads: the build bundles core/readers/ in name
  // order, so fall.js comes before girder.js in the page and the worker; so too section.js (the joint's law, S.hinge)
  // (and spaces.js, Z6's spaces, after it)
  // (G2) the plant's constants (core/systems.js), and G1's circuits (circuits.js, a reader: asked for only when a
  // hand-over carries sim.circuits, so that this file never loads it, and so never registers it, by itself)
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../core.js'), function () { return require('./girder.js'); }, require('../night.js'), function () { return require('./section.js'); }, function () { return require('./spaces.js'); }, function () { return require('../systems.js'); }, function () { return require('./circuits.js'); });
  else root.TitanicFall = factory(root.TitanicCore, function () { return root.TitanicGirder; }, root.TitanicNight, function () { return root.TitanicSection; }, function () { return root.TitanicSpaces; }, function () { return root.TitanicSystems; }, function () { return root.TitanicCircuits; });
})(typeof self !== 'undefined' ? self : this, function (C, girderOf, N, sectionOf, spacesLib, sysOf, circuitsOf) {
  'use strict';
  const GRAV = C.GRAV, DEG = Math.PI / 180, P_ATM = 101325;
  const RHO_AIR0 = P_ATM / (287.05 * 275.15);       // air at one atmosphere and 2 deg C, kg/m3 [textbook]
  const GAUSS = [[-Math.sqrt(0.6), 5 / 18], [0, 8 / 18], [Math.sqrt(0.6), 5 / 18]];   // 3-point Gauss on [-1, 1], weights / 2

  // ================================================================ the coefficients
  // Each with its source. A piece takes these, overridden by opts.K; the trials vary them by name.
  const K0 = {
    // cross-flow drag, effective (finite length included): beam-on 0.9 (0.6-1.2), keel-on 1.1 (0.8-1.4), deck-on 1.3
    // (1.0-1.6) [R6 1.2, 10.1, 10.10: bets, anchored by the surface model's fitted 0.72 in sway]
    cdBeam: 0.9, cdKeel: 1.1, cdDeck: 1.3,
    // along her, on her largest section: a faired end leading 0.25 (0.15-0.35), a torn end 0.95 (0.8-1.1), the whole
    // hull either way 0.15 [R6 1.2: Hoerner's base drag; flat face to cup]
    cdxFaired: 0.25, cdxTorn: 0.95, cdxWhole: 0.15,
    // skin friction: ITTC-57 plus 0.4e-3 (0.2-0.6e-3) on 0.85 of the girth times the length; nu of sea water at 2 deg C
    // [R6 10.1]
    dCf: 0.4e-3, wetShare: 0.85, nu: 1.75e-6,
    // added mass along her, a share of her displaced mass: 0.04 whole, 0.08 bow, 0.12 stern [R6 10.2]; a body of no
    // kind takes Lamb's k1 for its own proportions
    k1: { whole: 0.04, bow: 0.08, stern: 0.12 },
    // roll: 0.25 rho pi (B/2)^4 a metre [R6 10.2: bet, 0.2-0.3]
    rollAdded: 0.25,
    lift: 1,          // the slender body's lift at a torn trailing end [R6 10.1]; 0: none (e34's what-if)
    turn: 1,          // each section's own drag as it rolls [mine]
    potential: 1,     // Kirchhoff's added-mass terms (0 for a test of the rest alone)
    drag: 1,          // the viscous and separated terms (cross-flow, along her, friction, lift, turning)
    // the air: one lumped pocket. Isothermal [R6 4.1: n = 1, the brainstorm's]. Vent: Cd 0.6 [textbook], head 5 m [R6
    // 4.2: the air's height over the opening, 2-10 m]
    ventCd: 0.6, ventHead: 5,
    // where the pocket's lift acts in her, a stand-in until Z6's spaces carry each space's air [mine; G12, from QC B's
    // B-1, 2026-11-20]. Along her the pocket stands where her air was at the hand-over, slice by slice, in either case.
    // Across her:
    //   'centre': through each slice's own floodable centre, the default since G12 (Z1's call, at the coordinator's
    //             word, 2026-11-20: an interim until milestone 2's air space by space). The air at the top of a round
    //             section lifts through the section's centre whichever way she turns (the round-section idealisation;
    //             in a wide flat space the air seeks a corner, which Z6's spaces carry). Handed over at the flag, both
    //             pieces land upright as she is; a piece still turns over if her list there passes a threshold (on
    //             join 6's watch the bow beyond about 83 deg; the flag's is the core's clamp, 80) (trial 14).
    //   'flag':   where the air lay at the hand-over's pose, kept fixed in her as she turns (the engine to G12). At the
    //             flag's 80 deg of list that point is low in her: a lift under her weight in water, which holds a piece
    //             keel up (the watch's bow beyond about 75 deg of list), so that which way a piece lands turned on a
    //             hair (Q1; trial 14).
    airAt: 'centre',
    // and handed over at the break's onset (rule 'break'): 'flag' by default (D98, Bo 2026-11-23: G12's option (a)
    // with the onset's own air). There she is near upright (about 7 deg by the head, 1 to 11 of list on the kept set),
    // so her air lies high in her dry spaces, where 'flag' puts it, and 'centre' is the one that misplaces it. From
    // the onset both pieces land upright in all five ways on 30 of the kept set's 30 members with 'flag', 26 with
    // 'centre' (e117). An explicit K.airAt still wins
    airAtBreak: 'flag',
    // B4's joint from the onset (gate 1, docs/DESIGN_B4_Z6_the_break_from_the_onset_gates_1_2_v1_2026-11-23.md): 1 joins
    // the pieces at the onset's station in its sense when the reader hands over there; 0, the default until join 20, the
    // cut fall. A begin() given its own hinge is unchanged by it
    jointOnset: 0,
    // her air (M2, 4c): 'pocket', the one lumped pocket a piece above (the default, as before to the bit); 'spaces', the
    // what-if of Z6's spaces (core/readers/spaces.js): each of the piece's share of the core's 64 spaces holds its own
    // water and air, the air at its own pressure, exchanged through the core's openings and the cut's torn faces (e84's
    // laws), the spaces giving way past their heads (K.failHead, K.failShare) with a 'report' each, from the hand-over
    // on. Each sub-step the spaces are stepped at her pose and their air stands in as the pocket: its whole volume, its
    // lift through its volume-weighted centroid (exact for the moment of parallel forces). Not yet with the joint. The
    // spaces' own bets pass through K too: K.slot, K.clear and K.cutCd (openingsOf), K.failHead and K.failShare
    // (failSpaces), each defaulted there
    air: 'pocket',
    // the spaces' own step (K.air 'spaces'): they are stepped at most this often, the sub-steps between taking the
    // pocket as their last step left it (near the bed a sub-step is 1/256 s, for the mud) [mine: trial 17's step]
    spaceDt: 1 / 32,
    // a space giving way is a 'report', an audible failure, past this energy, J [bet: about 0.1 GJ, R6 4.4's scale; the
    // design v1, section 5]; every failure stays in the engine's own list (each body's spc.ev, with its node)
    reportMin: 1e8,
    // how the spaces give way (K.air 'spaces'): 'boundaries', section 5's fuller form, the default since its review
    // (failBoundaries: each space once, at its weakest link: each bulkhead, joiner work and E deck at its own head into the
    // space across it, K.headBulkhead, K.headJoiner, K.headDeckBelow, K.headDeckAbove; the shell at K.headShell to the
    // sea); 'simple', failSpaces' first form (a space lagging the sea past K.failHead gives way to the sea)
    fail: 'boundaries',
    // under K.fail 'boundaries', how often a space gives way (spaces.failBoundaries): 'space', once, at its weakest link,
    // and then it holds at any load (the default, as before to the bit); 'boundary', each boundary and each space's
    // shell once, so a space can give way again at another link (a what-if: the stern-work team found spaces holding
    // air 46 to 67 m behind the sea once given way, past the shell's 40 m)
    failOnce: 'space',
    // the watertight doors under K.air 'spaces' (Z1, 2026-11-24, with the mainline's e120): 'core', the default, the
    // core's own law mirrored (spaces.doorsOf, doorsStep): a door open at the hand-over with its float armed is released
    // once water stands params.floatDepth over the lowest point of a space below E deck either side of its bulkhead, and
    // falls shut over params.doorFall; 'none', each door as the hand-over left it, open to the bed (the fall before, and
    // e120's held-open bracket). With every door shut at the hand-over, as on the model's own 1912 night, the two are
    // the same bits
    floats: 'core',
    // the openings to the weather under K.air 'spaces' (Z1, 2026-11-24, the coordinator's (3); D115's fourth consistency,
    // the default since join 22, D116): 'core', the core's own law mirrored (spaces.weatherOf, weatherStep): each gives
    // way, for good, when the sea's head over its centre less the head of the water behind it reaches its own strength,
    // and a dome when the sea stands params.hAir over the lintels of its staircase's given-way doors; 'none', each as the
    // hand-over left it (the fall before join 22, a what-if: on member C 1 of the 197 had given way at the onset and 58
    // had the sea at their sills, and the others never opened in the fall)
    weather: 'core',
    // the spaces' one-way limiter (K.air 'spaces'; e84's safeguard 1, spaces.stepPiece): 'held', the default since D108
    // (join 20; Z1 on the stern-work team's finding, 2026-11-23): a space whose water stands over an open opening to the
    // sea, or to a held space, has its pressure kept by the sea, so its own stiffness leaves the pair's limiter (a sealed
    // space keeps its own); 'pair', the limiter before D108 (a what-if, to the bit): each side of an opening judged by its
    // own stiffness, its free surface's and its air's, so a full space fed by the sea (its free surface's area floored at
    // 1e-6 m2) or a nearly full one with a trapped bubble passes a dry neighbour 1 to 2 m3/s where the law asks 265 and
    // the stern hangs on them (fall_trials, trial 18; e119)
    limiter: 'held',
    // her solids in the fall (D(G12-e)'s step 3): 'core', what the core's permeabilities leave of each space (with the
    // double bottom), as before to the bit; 'items', each zone's solids made B1+B2's item-by-item volume (SOLIDS_ITEMS),
    // the zone's floodable volume and the hand-over's water in it scaled together (each slice keeps its fill), the core's
    // own permeabilities untouched (under K.air 'spaces', each space's room, permeability, water and air by the same
    // factor). K.wood: 'afloat' or 'soaked', the items' one switch (their band's spread, 1,544 m3)
    solids: 'core', wood: 'afloat',
    // G7's peak tank in the fall (Z1, 2026-11-24, on the hand-over's gap; the default since join 22, D116): the tank
    // shares no column with its space (its pocket's overlap is false), so it lies outside the floodable volume. 'weighed'
    // weighs its water as the core's loads and the girder do (C.pocketPoints: min(vol, cap) at the core's own point, at
    // the core's RHO), a mass in the slice where it stands, carried with her; the room stays in the envelope, so a full
    // tank is neutral, as a sealed tank of sea water is. 'solid' is the fall before join 22 (a what-if): the room buoyant
    // and its water not weighed, the bow light by the tank's water against the core and the gauge (330.7 t at x 119.89 on
    // member C at its onset). W6's bunker lies inside its space's columns and is weighed either way
    peakTank: 'weighed',
    // each slice's section in the fall (Z1, 2026-11-24, D115, with B1+B2): the polygon her buoyancy at the surface is
    // clipped on (three Gauss sections a slice), her bounding radii and the mud's corners are taken from, and its girth
    // her wetted area. 'full', the default since join 22 (D116): every column, the core's own section. 'decimated' is the
    // fall before join 22 (a what-if): every k-th column, about twelve a side, which at member C's onset (trim 6.93 deg; the
    // waterline across all the stern's slices and the bow's after 31) put the bow's centre of buoyancy 0.62 m forward and
    // the stern 70 t short against the core's own columns: 0.33 of the hand-over's 0.35 % in the joint's moment and its 1 %
    // in the shear. With 'full' the stern's statics at the joint's pin are the gauge's to 0.002 % (the rest the fall's
    // in-situ density, its own, against the core's uniform 1025). The slices' clip holds at any attitude, as the core's
    // column prisms would not
    section: 'full',
    // what her weight in water is measured against: the column's mean density, for her inertia and her added mass [mine]
    rhoRef: null,
    // the bed's regularization [mine, bets]: below vReg the mud's resistance falls in proportion to the speed (a plastic
    // law made smooth, so that the step need not stop on a discontinuity); a slice's face comes to bear over its own tilt
    // along her plus `ramp` m. The mud is plastic: a piece whose every slice has moved slower than vRest for tRest
    // seconds, with the mud's static capacity under her (N_c s_u on each slice's bearing) above her weight in water, is
    // held where it is ('at rest'). A plastic body would have stopped within v^2 M / (2 (capacity - weight)) of there:
    // centimetres
    vReg: 0.2, ramp: 0.5, vRest: 0.2, tRest: 0.5,
    // the water she drags is not carried into the mud [R6 10.7: "not carried in", the default of its worked example; a
    // switch]: at her first touch of the bed its momentum is shed (it flows on round her: the following water), and she
    // strikes with her own mass and the water in her. 1: carried in fully
    strikeAdded: 0,
    // the tiers' share of the section the water acts on, 0 to 1 [bet; decision D52, Bo's: 0]. The tiers above B deck
    // (each column above cols.zhiH, where the ship gives it) count for her buoyancy, her weight and the water in her at
    // any value; this says how far they also stand in the flow, for her added mass, her cross-flow and turning drag, and
    // where those act. 0, the default since D52 (Bo, 2026-11-20 10:09 CST: "yes share 0"): her hull's own envelope only,
    // because by the time she falls the tiers are no wall: their windows give way at 1.5 m of head (hWin in the core) and
    // a 10 m/s fall puts about 5 m on them; the A-deck promenade is open at the sides and the boat deck's houses are
    // narrower than her beam; the wreck's superstructure was largely stripped on the way down. 1: a solid wall to the
    // flow, as her hull is; on the tiers her sections are then taller than wide, and the flow lays every piece on its side
    // (docs/research/experiments/e60). Between, the share of the tiers' section that stands.
    // D76's D(G12-e) (2026-11-21) splits that one share in two, by what it moves:
    //   tiersAdded: the tiers' part in her added mass and in the torn end's lift. 0: D52's reason (a row of windows
    //               entrains little).
    //   tiersSide:  their side in her cross-flow and turning drag, and where those act: their solidity to a flow across
    //               her, 0.85 [derived: R3's openings on B, A and the Boat deck, in her side or a house wall, from
    //               the deck plans (data/rooms/openings.json, R3's c549e38), 154 m2 open to port and 172 to starboard,
    //               the glass gone, against the model's own tiers' side, 1,125 m2 a side (each slice's envelope above
    //               the hull's top): 0.863 and 0.847; 13 doors the table gives no area leave it about 1 % high]. A
    //               plate under about 20 % open keeps a solid plate's wake (Castro 1971 [search summary, in B1+B2's
    //               note 04bbb18, docs/DESIGN_G12_the_break_side_v1_2026-11-21.md, section 2]). Band: 0.5 to 1.
    // tiersFlow, where a run gives it, sets both: D52's one number, for the what-ifs and the experiments that name it
    // (e60 to e66). null: the two shares below
    tiersFlow: null, tiersAdded: 0, tiersSide: 0.85,
    // the step [mine; tools/fall_trials.js shows it converged]: sub-steps of the model's dt in the water and within
    // bedNear m of the bed; the midpoint's iteration
    sub: 8, subBed: 64, bedNear: 5, iterMax: 100, tol: 1e-12,
  };

  // the 2-D rectangle's added-mass coefficient against the ratio of the side across the motion to the side along it
  // (a/b), DNV-RP-C205 Table A-1 after Wendel 1956, as R6 1.3 remembers it [textbook]: interpolated in ln(a/b)
  const CA_RECT = [[0.1, 2.23], [0.2, 1.98], [0.5, 1.70], [1, 1.51], [2, 1.36], [5, 1.21], [10, 1.14], [1e6, 1.00]];
  function caRect(ab) {
    if (!(ab > CA_RECT[0][0])) return CA_RECT[0][1];
    for (let i = 1; i < CA_RECT.length; i++) {
      if (ab <= CA_RECT[i][0]) { const a = CA_RECT[i - 1], b = CA_RECT[i], u = C.log(ab / a[0]) / C.log(b[0] / a[0]); return a[1] + (b[1] - a[1]) * u; }
    }
    return 1.0;
  }
  // Lamb's coefficients of a prolate spheroid of length over diameter LD: along (k1), across (k2), turning (kr)
  // [R6 1.3: Lamb 1932; it reproduces 0.021 / 0.960 / 0.883 at 10 and 0.059 / 0.894 / 0.700 at 5]
  function lamb(LD) {
    if (!(LD > 1.0001)) return { k1: 0.5, k2: 0.5, kr: 0 };
    const e = Math.sqrt(1 - 1 / (LD * LD)), e2 = e * e, e3 = e2 * e, lg = C.log((1 + e) / (1 - e));
    const a0 = 2 * (1 - e2) / e3 * (0.5 * lg - e), b0 = 1 / e2 - (1 - e2) / (2 * e3) * lg;
    return { k1: a0 / (2 - a0), k2: b0 / (2 - b0), kr: e2 * e2 * (b0 - a0) / ((2 - e2) * (2 * e2 - (2 - e2) * (b0 - a0))) };
  }

  // ================================================================ the sea
  // EOS-80 (UNESCO 1983, Fofonoff and Millard; R6 5.1): in-situ density from salinity, temperature (IPTS-68) and
  // pressure (bar). It gives UNESCO's eight check values to 5e-6 kg/m3 and R6's 1,070.95838408 at (35, 0, 10,000 dbar).
  function rhoEOS(S, t, pb) {
    const t2 = t * t, t3 = t2 * t, t4 = t3 * t, t5 = t4 * t, s15 = S * Math.sqrt(S);
    const rw = 999.842594 + 6.793952e-2 * t - 9.095290e-3 * t2 + 1.001685e-4 * t3 - 1.120083e-6 * t4 + 6.536332e-9 * t5;
    const r0 = rw + (8.24493e-1 - 4.0899e-3 * t + 7.6438e-5 * t2 - 8.2467e-7 * t3 + 5.3875e-9 * t4) * S + (-5.72466e-3 + 1.0227e-4 * t - 1.6546e-6 * t2) * s15 + 4.8314e-4 * S * S;
    const Kw = 19652.21 + 148.4206 * t - 2.327105 * t2 + 1.360477e-2 * t3 - 5.155288e-5 * t4;
    const K = Kw + (54.6746 - 0.603459 * t + 1.09987e-2 * t2 - 6.1670e-5 * t3) * S + (7.944e-2 + 1.6483e-2 * t - 5.3009e-4 * t2) * s15
      + (3.239908 + 1.43713e-3 * t + 1.16092e-4 * t2 - 5.77905e-7 * t3 + (2.2838e-3 - 1.0981e-5 * t - 1.6078e-6 * t2) * S + 1.91075e-4 * s15) * pb
      + (8.50935e-5 - 6.12293e-6 * t + 5.2787e-8 * t2 + (-9.9348e-7 + 2.0816e-8 * t + 9.1697e-10 * t2) * S) * pb * pb;
    return r0 / (1 - pb / K);
  }
  // Mackenzie (1981), the speed of sound, m/s, for the readouts (as Fathom's core/ocean.js has it) [textbook]
  function mackenzie(T, S, D) {
    return 1448.96 + 4.591 * T - 5.304e-2 * T * T + 2.374e-4 * T * T * T + 1.340 * (S - 35) + 1.630e-2 * D + 1.675e-7 * D * D - 1.025e-2 * T * (S - 35) - 7.139e-13 * T * D * D * D;
  }
  // The column for an April night at the wreck: R6 5.2's nodes. The temperatures and salinities are its bets; the
  // density is computed. The 1912 sea: 3,790 m to the bed [R5 10a; decision D38], half a degree of slope, its direction
  // drawn from the night's seed (D38), at the wreck's latitude [R5 1.1].
  const PROFILES = {
    april1912: {
      z: [0, 10, 50, 100, 200, 500, 1000, 2000, 3000, 3784, 3800],
      T: [0, 0, 0, 1, 3.5, 4.2, 3.6, 3.1, 2.5, 2.0, 2.0],
      S: [32.80, 32.84, 33.00, 33.60, 34.40, 34.90, 34.90, 34.93, 34.93, 34.90, 34.90],
    },
  };
  // the bed: s_u = 2 + 1.8 z kPa (1-5, 1.2-2.5 a metre), N_c 7.5 on the flat (9 at a prow; 5.14-9), R_f = 1 + 0.1
  // log10(rate / 1e-5) capped at 4, C_d 0.8, the mud 1,600 kg/m3 [R6 6.2, 10.7: bets anchored by 25 kPa at 10-16 m];
  // the overburden term gamma' d off, as the plan's 4.6 and R6's worked example have it
  const SOIL = { su0: 2000, suK: 1800, Nc: 7.5, lambda: 0.1, gref: 1e-5, rfMax: 4, cd: 0.8, rho: 1600, overburden: 0 };
  // her solids by zone, item by item (K.solids 'items', D(G12-e)'s step 3): m3 a zone, bow to stern, with her wood afloat
  // (2,200 t at 0.6) and soaked (to neutral). B1+B2's list of 2026-11-21 (their note's v1.1; abacus receipts
  // 7edb6df9d626, e234b9c108a4, 29847baa331c, bf7c27c37f4c): the boilers and their water, coal, engines, turbine,
  // dynamos, shafts, castings, cargo, liquids and stores, people, hull steel, fittings, wood, each placed by zone [their
  // bets where marked: the heights, coal's density, the liquids' places, the fittings' density]. 19,091 or 17,547 m3 in all
  const SOLIDS_ITEMS = {
    afloat: [210, 719, 920, 999, 1607, 1834, 1864, 1864, 1947, 1165, 1688, 1210, 1154, 1022, 519, 368],
    soaked: [172, 672, 853, 918, 1505, 1710, 1735, 1735, 1811, 1084, 1531, 1088, 1039, 939, 449, 307],
  };
  const SEA_1912 = { depth: 3790, slope: 0.5, lat: 41.73, profile: 'april1912' };
  const lin = (xs, ys, x) => { if (x <= xs[0]) return ys[0]; for (let i = 1; i < xs.length; i++) if (x <= xs[i]) return ys[i - 1] + (ys[i] - ys[i - 1]) * (x - xs[i - 1]) / (xs[i] - xs[i - 1]); return ys[ys.length - 1]; };
  // a deterministic stream from a 32-bit seed (mulberry32, as core/night.js has it)
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // spec: { depth, slope (deg), lat (deg), profile, seed, psi (rad: her heading, to turn the bed's dip into the fall's
  //   frame), uniform (kg/m3: a column of one density, for the closed-form tests), soil: {} }
  function sea(spec) {
    spec = Object.assign({}, SEA_1912, spec || {});
    const depth = +spec.depth, DZ = 5, n = Math.ceil((depth + 300) / DZ) + 1, P = PROFILES[spec.profile] || PROFILES.april1912;
    const sl = C.sin(spec.lat * DEG), s2 = sl * sl;
    const g0 = 9.7803253359 * (1 + 0.00193185265241 * s2) / Math.sqrt(1 - 0.00669437999013 * s2);   // normal gravity (Somigliana, WGS84)
    const T = new Float64Array(n), S = new Float64Array(n), rho = new Float64Array(n), p = new Float64Array(n), phi = new Float64Array(n), c = new Float64Array(n);
    const uni = spec.uniform ? +spec.uniform : 0;
    let pg = 0;                                     // gauge pressure, Pa, integrated in 1 m steps (midpoint, R6's way)
    for (let i = 0; i < n; i++) {
      const z = i * DZ;
      T[i] = lin(P.z, P.T, z); S[i] = lin(P.z, P.S, z);
      rho[i] = uni || rhoEOS(S[i], 1.00024 * T[i], pg / 1e5);
      p[i] = P_ATM + pg; c[i] = mackenzie(T[i], S[i], z);
      if (i < n - 1) for (let k = 0; k < DZ; k++) {
        const zm = z + k + 0.5, g = g0 + 3.086e-6 * zm;   // the free-air gradient [textbook], as R6 integrated it
        let r = uni || rhoEOS(lin(P.z, P.S, zm), 1.00024 * lin(P.z, P.T, zm), (pg + 0.5 * 1030 * g) / 1e5);
        if (!uni) r = rhoEOS(lin(P.z, P.S, zm), 1.00024 * lin(P.z, P.T, zm), (pg + 0.5 * r * g) / 1e5);
        pg += r * g;
      }
    }
    // the integral of the density, kg/m2, exact for the density linear between nodes (the potential of buoyancy)
    for (let i = 1; i < n; i++) phi[i] = phi[i - 1] + 0.5 * (rho[i - 1] + rho[i]) * DZ;
    // the bed: deepening by `slope` toward a bearing drawn from the seed; its dip turned into the fall's frame
    const r = rng(((spec.seed === undefined ? 1912 : spec.seed) ^ 0x5bd1e995) >>> 0);
    const bearing = 2 * Math.PI * r(), psi = spec.psi || 0;
    const bed = Object.assign({ depth, slope: spec.slope * DEG, bearing, dipX: C.cos(bearing - psi), dipY: -C.sin(bearing - psi) }, SOIL, spec.soil || {});
    // as the page reads the bed (Z2's note of 15:04): depth(X, Y) = depth + slope . (X, Y) + relief (none here)
    const tg = C.tan(bed.slope), slope = [tg * bed.dipX, tg * bed.dipY]; bed.tan = Math.abs(tg);
    return { depth, dz: DZ, n, lat: spec.lat, g: g0, uniform: uni, profile: spec.profile, T, S, rho, p, phi, c, slope, relief: [], bed };
  }
  // at a depth d (m, positive down): density, its integral, pressure (Pa absolute), temperature, the bed's depth
  function rhoAt(sp, d) {
    if (!(d > 0)) return sp.rho[0];
    const f = d / sp.dz, i = Math.floor(f);
    if (i >= sp.n - 1) return sp.rho[sp.n - 1];
    return sp.rho[i] + (sp.rho[i + 1] - sp.rho[i]) * (f - i);
  }
  function phiAt(sp, d) {
    if (!(d > 0)) return sp.rho[0] * d;
    let i = Math.floor(d / sp.dz); if (i > sp.n - 2) i = sp.n - 2;
    const u = d - i * sp.dz;
    return sp.phi[i] + sp.rho[i] * u + 0.5 * (sp.rho[i + 1] - sp.rho[i]) / sp.dz * u * u;
  }
  // the density a point meets on its way from depth d0 to d1 (the mean, so that buoyancy works through its potential)
  function rhoPath(sp, d0, d1) {
    const c0 = d0 > 0 ? Math.floor(d0 / sp.dz) : -1, c1 = d1 > 0 ? Math.floor(d1 / sp.dz) : -1;
    if (c0 === c1 || d1 === d0) return rhoAt(sp, 0.5 * (d0 + d1));      // linear within a cell: the middle's is the mean
    return (phiAt(sp, d1) - phiAt(sp, d0)) / (d1 - d0);
  }
  function pAt(sp, d) {
    if (!(d > 0)) return P_ATM;
    const f = d / sp.dz, i = Math.floor(f);
    if (i >= sp.n - 1) return sp.p[sp.n - 1];
    return sp.p[i] + (sp.p[i + 1] - sp.p[i]) * (f - i);
  }
  function tempAt(sp, d) { const f = (d > 0 ? d : 0) / sp.dz, i = Math.floor(f); return i >= sp.n - 1 ? sp.T[sp.n - 1] : sp.T[i] + (sp.T[i + 1] - sp.T[i]) * (f - i); }
  function bedDepth(sp, X, Y) { return sp.depth + sp.slope[0] * X + sp.slope[1] * Y; }
  function earthOf(fall, X, Y) { const a = fall.at, c = C.cos(a.psi), s = C.sin(a.psi); return [a.X + X * c + Y * s, a.Y + X * s - Y * c]; }

  // ================================================================ the model's slices (static for a ship)
  // Each of the ship's column slices, from the stern forward: its envelope (volume, centroid, breadth, depth, section
  // polygon, girth) and its floodable volume (the nodes' columns, at their permeabilities). Cached by ship, outside any
  // sim, as the girder reader caches its curves.
  const SHIPS = new WeakMap();
  function shipTables(ship) {
    let T = SHIPS.get(ship); if (T) return T;
    const c = ship.cols, sl = c.slices.slice().sort((a, b) => a.xc - b.xc), nS = sl.length;
    const colSlice = new Int32Array(c.N);
    const A = (k) => new Float64Array(k);
    T = { nS, colSlice, xc: A(nS), dx: A(nS), zone: new Int32Array(nS), e: A(nS + 1), Venv: A(nS), ey: A(nS), ez: A(nS), Vf: A(nS), fy: A(nS), fz: A(nS), B: A(nS), H: A(nS), zlo: A(nS), zhi: A(nS), Hh: A(nS), ezh: A(nS), Vh: A(nS), perim: A(nS), poly: [], perimFull: A(nS), polyFull: [] };
    // the hull's own top, where the ship gives it apart from the tiers above it (cols.zhiH); else the columns' top
    const top = c.zhiH || c.zhi;
    for (let j = 0; j < nS; j++) {
      const s = sl[j];
      T.xc[j] = s.xc; T.dx[j] = s.dx; T.zone[j] = s.zone; T.e[j] = s.xc - 0.5 * s.dx;
      let V = 0, my = 0, mz = 0, ymax = 0, zlo = 1e9, zhi = -1e9, Vh = 0, mzh = 0, zhh = -1e9;
      const port = [];
      for (let i = s.first; i < s.first + s.count; i++) {
        colSlice[i] = j;
        const v = c.dxdy[i] * (c.zhi[i] - c.zlo[i]);
        V += v; my += v * c.y[i]; mz += v * 0.5 * (c.zlo[i] + c.zhi[i]);
        const ay = Math.abs(c.y[i]); if (ay > ymax) ymax = ay;
        if (c.zlo[i] < zlo) zlo = c.zlo[i]; if (c.zhi[i] > zhi) zhi = c.zhi[i];
        const th = top[i] < c.zhi[i] ? top[i] : c.zhi[i];
        if (th > c.zlo[i]) { const vh = c.dxdy[i] * (th - c.zlo[i]); Vh += vh; mzh += vh * 0.5 * (c.zlo[i] + th); if (th > zhh) zhh = th; }
        if (c.side[i] === 0) port.push([c.y[i], c.zlo[i], c.zhi[i]]);
      }
      T.Venv[j] = V; T.ey[j] = V > 0 ? my / V : 0; T.ez[j] = V > 0 ? mz / V : 0.5 * (zlo + zhi);
      T.B[j] = 2 * ymax + c.dy; T.H[j] = zhi - zlo; T.zlo[j] = zlo; T.zhi[j] = zhi;
      T.Hh[j] = zhh > zlo ? zhh - zlo : T.H[j]; T.ezh[j] = Vh > 0 ? mzh / Vh : T.ez[j]; T.Vh[j] = Vh;
      // the section as a polygon: its bottom from starboard to port, then its top back; every k-th column, the outer
      // edge at the outer column's side. The hull is the same both sides of her centreline (the columns are). Two of
      // them (K.section): every k-th column, about twelve a side (the default, as before), and every column (the
      // section at full resolution), each with its girth
      port.sort((a, b) => a[0] - b[0]);
      const sectionOf = (step) => {
        const m = port.length, pick = [];
        for (let k = 0; k < m; k += step) pick.push(port[k]);
        if (pick[pick.length - 1] !== port[m - 1]) pick.push(port[m - 1]);
        const Y = port[m - 1][0] + 0.5 * c.dy, py = [], pz = [];
        const at = (k) => (k === pick.length - 1 ? Y : pick[k][0]);
        for (let k = pick.length - 1; k >= 0; k--) { py.push(-at(k)); pz.push(pick[k][1]); }
        for (let k = 0; k < pick.length; k++) { py.push(at(k)); pz.push(pick[k][1]); }
        for (let k = pick.length - 1; k >= 0; k--) { py.push(at(k)); pz.push(pick[k][2]); }
        for (let k = 0; k < pick.length; k++) { py.push(-at(k)); pz.push(pick[k][2]); }
        let per = 0; for (let k = 0; k < py.length; k++) { const k2 = (k + 1) % py.length; per += Math.sqrt((py[k2] - py[k]) * (py[k2] - py[k]) + (pz[k2] - pz[k]) * (pz[k2] - pz[k])); }
        return { poly: { y: py, z: pz }, per };
      };
      const sd = sectionOf(Math.max(1, Math.ceil(port.length / 12))), sf = sectionOf(1);
      T.poly.push(sd.poly); T.perim[j] = sd.per;
      T.polyFull.push(sf.poly); T.perimFull[j] = sf.per;
    }
    T.e[nS] = sl[nS - 1].xc + 0.5 * sl[nS - 1].dx;
    // the floodable volume: every node's columns at its permeability (the core's own nodeVmax, spread by slice)
    const NNs = ship.nodeVmax.length;
    for (let n = 0; n < NNs; n++) {
      const mu = ship.nodeMu[n], s1 = ship.nodeStart[n] + ship.nodeCount[n];
      for (let jj = ship.nodeStart[n]; jj < s1; jj++) {
        const i = ship.entCol[jj], a = ship.entA[jj], b = ship.entE[jj], v = mu * c.dxdy[i] * (b - a), k = colSlice[i];
        T.Vf[k] += v; T.fy[k] += v * c.y[i]; T.fz[k] += v * 0.5 * (a + b);
      }
    }
    for (let j = 0; j < nS; j++) { const v = T.Vf[j]; if (v > 0) { T.fy[j] /= v; T.fz[j] /= v; } else { T.fy[j] = T.ey[j]; T.fz[j] = T.ez[j]; } }
    SHIPS.set(ship, T);
    return T;
  }

  // The water in her as the core leaves it, by slice: each space's free surface solved again for the pose and the
  // water now in it, the water capped at what the space holds (the core keeps water "pressed over" in full spaces: that
  // is dropped), spread over its columns. It mirrors the girder reader's waterBySlice, which mirrors the core's
  // solveLevels (the same merging of port and starboard, the same column cut): a change to either needs it here too.
  function waterBySlice(sim, F, T) {
    const ship = sim.ship, c = ship.cols, iR = 1 / F.R22, nS = T.nS;
    const W = new Float64Array(nS), WY = new Float64Array(nS), WZ = new Float64Array(nS);
    const tV = new Float64Array(nS), tY = new Float64Array(nS), tZ = new Float64Array(nS);
    let dv = 0, zmin = 0, zmax = 0;
    const pass = (n1, n2, h, bounds) => {
      tV.fill(0); tY.fill(0); tZ.fill(0);
      let vol = 0, a2 = 0; zmin = 1e9; zmax = -1e9;
      for (let q = 0; q < 2; q++) {
        const n = q === 0 ? n1 : n2; if (n < 0) continue;
        const mu = ship.nodeMu[n], s1 = ship.nodeStart[n] + ship.nodeCount[n];
        for (let j = ship.nodeStart[n]; j < s1; j++) {
          const i = ship.entCol[j], a = ship.entA[j], b = ship.entE[j], base = F.R20 * c.x[i] + F.R21 * c.y[i] + F.tz;
          if (bounds) { const wa = base + F.R22 * a, wb = base + F.R22 * b; if (wa < zmin) zmin = wa; if (wb > zmax) zmax = wb; }
          const zp = (h - base) * iR;
          if (zp <= a) continue;
          let L; if (zp >= b) L = b - a; else { L = zp - a; a2 += c.dxdy[i] * mu; }
          const v = c.dxdy[i] * L * mu, k = T.colSlice[i];
          vol += v; tV[k] += v; tY[k] += v * c.y[i]; tZ[k] += v * (a + 0.5 * L);
        }
      }
      dv = a2 * iR;
      return vol;
    };
    const spread = (n1, n2, V, h0) => {
      const Vmax = ship.nodeVmax[n1] + (n2 >= 0 ? ship.nodeVmax[n2] : 0);
      if (V > Vmax) V = Vmax;                        // the phantom water dropped
      if (!(V > 1e-6)) return;
      let vol = pass(n1, n2, 1e9, true);
      if (!(zmax > zmin) || !(vol > 0)) return;
      if (V < Vmax * (1 - 1e-7)) {
        let lo = zmin, hi = zmax, h = h0 > lo && h0 < hi ? h0 : 0.5 * (lo + hi);
        const tol = 1e-7 * Vmax + 1e-4;
        for (let it = 0; it < 40; it++) {
          vol = pass(n1, n2, h, false);
          const err = vol - V;
          if (Math.abs(err) < tol) break;
          if (err > 0) hi = h; else lo = h;
          let hn = dv > 1e-9 ? h - err / dv : 0.5 * (lo + hi);
          if (!(hn > lo && hn < hi)) hn = 0.5 * (lo + hi);
          h = hn;
        }
      }
      const s = vol > 0 ? V / vol : 0;
      for (let j = 0; j < nS; j++) { if (tV[j] === 0) continue; W[j] += tV[j] * s; WY[j] += tY[j] * s; WZ[j] += tZ[j] * s; }
    };
    const nZ = ship.zones.length;
    for (let k = 0; k < nZ; k++) for (let L = 0; L < 2; L++) {
      const nP = C.nodeIndex(k, 0, L), nS2 = C.nodeIndex(k, 1, L), g = k * 2 + L;
      let merged = sim.mergeAlways[g] === 1;
      if (!merged && L === 0) {
        const zMw = C.worldZ(F, ship.zones[k].xm, 0, sim.zMerge[k]);
        merged = sim.vol[nP] > 1e-6 && sim.vol[nS2] > 1e-6 && sim.level[nP] > zMw + 0.05 && sim.level[nS2] > zMw + 0.05;
      }
      // C5 (the epoch, dark): with params.weighOverfill 0 each space weighs its capacity, so a merged pair's water is each
      // side's cut at its own room, as C.eachWater(sim, fn, true) gives it; at 1 (today) the pair is cut as a pair
      if (merged) spread(nP, nS2, sim.params.weighOverfill === 0 ? Math.min(sim.vol[nP], ship.nodeVmax[nP]) + Math.min(sim.vol[nS2], ship.nodeVmax[nS2]) : sim.vol[nP] + sim.vol[nS2], sim.level[nP]);
      else { spread(nP, -1, sim.vol[nP], sim.level[nP]); spread(nS2, -1, sim.vol[nS2], sim.level[nS2]); }
    }
    // W6: a pocket's water (the bunker of the fire) as the core weighs it (C.pocketPoints), in the slice where it stands,
    // as the girder reader takes it. Its water is its own, not in sim.vol: without this the fall would count the
    // pocket's room as air (QC B, B-3)
    if (sim.pockets) for (const pk of sim.pockets) {
      if (!(pk.vol > 0)) continue;
      const pts = C.pocketPoints(sim, F, pk);
      for (let i = 0; i < pts.length; i += 4) {
        const x = pts[i + 1]; let j = -1;
        for (let q = 0; q < nS; q++) { const a = Math.min(T.e[q], T.e[q + 1]), b = Math.max(T.e[q], T.e[q + 1]); if (x >= a && x < b) { j = q; break; } }
        if (j >= 0) { W[j] += pts[i]; WY[j] += pts[i] * pts[i + 2]; WZ[j] += pts[i] * pts[i + 3]; }
      }
    }
    return { W, WY, WZ };
  }

  // The structure's weight over [lo, hi] from the girder's curve: its mass (kg), centroid and second moments about the
  // centroid, exact for the curve's linear pieces (so that the pieces of a cut ship sum to the whole to rounding)
  function structureIn(cv, lo, hi) {
    const xm = 0.5 * (lo + hi);
    let m = 0, m1 = 0, m2 = 0, mz = 0, mzz = 0, m1z = 0;
    for (const p of cv.pieces) {
      const u0 = lo > p.x0 ? lo : p.x0, u1 = hi < p.x1 ? hi : p.x1;
      if (!(u1 > u0)) continue;
      const s = (p.w1 - p.w0) / (p.x1 - p.x0), a = p.w0 + s * (xm - p.x0), v0 = u0 - xm, v1 = u1 - xm;
      const d1 = v1 - v0, d2 = 0.5 * (v1 * v1 - v0 * v0), d3 = (v1 * v1 * v1 - v0 * v0 * v0) / 3, d4 = 0.25 * (v1 * v1 * v1 * v1 - v0 * v0 * v0 * v0);
      const pm = (a * d1 + s * d2) * 1000, p1 = (a * d2 + s * d3) * 1000, p2 = (a * d3 + s * d4) * 1000;
      m += pm; m1 += p1; m2 += p2; mz += pm * p.z; mzz += pm * p.z * p.z; m1z += p1 * p.z;
    }
    if (!(m > 1e-9)) return { m: 0, gx: xm, gz: cv.KG, sxx: 0, szz: 0, sxz: 0 };
    const gl = m1 / m, gz = mz / m;
    return { m, gx: xm + gl, gz, sxx: m2 - m * gl * gl, szz: mzz - m * gz * gz, sxz: m1z - m * gl * gz };
  }

  // a point mass (kg) added to a slice's structure: its mass, centroid and second moments about the centroid (the
  // parallel axes), so that the weight and the body's mass matrix take it as they take the slice's structure
  function addMass(s, m2, px, py, pz) {
    const m1 = s.ms, M = m1 + m2;
    if (!(m2 > 0) || !(M > 0)) return;
    const gx = (m1 * s.gx + m2 * px) / M, gy = (m1 * s.gy + m2 * py) / M, gz = (m1 * s.gz + m2 * pz) / M;
    const ax = s.gx - gx, ay = s.gy - gy, az = s.gz - gz, bx = px - gx, by = py - gy, bz = pz - gz, o = s.own;
    s.own = { xx: o.xx + m1 * ax * ax + m2 * bx * bx, yy: o.yy + m1 * ay * ay + m2 * by * by, zz: o.zz + m1 * az * az + m2 * bz * bz, xz: o.xz + m1 * ax * az + m2 * bx * bz };
    s.ms = M; s.gx = gx; s.gy = gy; s.gz = gz;
  }

  // K.solids 'items' (D(G12-e)'s step 3): a factor a zone (bow to stern) on its floodable volume, so that its solids, the
  // envelope less the floodable volume (the double bottom and what the core's permeabilities leave of each space), are
  // the items' (SOLIDS_ITEMS, K.wood). Spread over the zone's slices as its floodable volume already is, the room it
  // gains or loses is like the rest of its spaces', and the floodable centroid of each slice stays where it was
  function solidsScale(T, wood) {
    const items = SOLIDS_ITEMS[wood], S = new Float64Array(16), V = new Float64Array(16), g = new Float64Array(16);
    for (let j = 0; j < T.nS; j++) { const z = T.zone[j]; S[z] += T.Venv[j] - T.Vf[j]; V[z] += T.Vf[j]; }
    for (let z = 0; z < 16; z++) g[z] = V[z] > 0 ? (V[z] + S[z] - items[z]) / V[z] : 1;
    return g;
  }

  // ================================================================ a piece of the model
  // The ship's slices between x0 and x1 (cut exactly: a slice across a station is shared by its length), its structure
  // from the girder reader's weight curve integrated over each slice, its water and air from the sim (opts.air: 'sim',
  // the default; 0 for none; a number of m3 at the air's own centroid). opts: { id, kind, lever, vent, air, K }
  function piece(ship, sim, x0, x1, opts) {
    opts = opts || {};
    const T = shipTables(ship), GI = girderOf(), cv = GI.weight(sim), F = C.frameOf(sim);
    const xs = T.e[0], xf = T.e[T.nS];
    if (!(x1 > x0)) throw new Error('a piece needs x1 > x0');
    x0 = Math.max(x0, xs); x1 = Math.min(x1, xf);
    const kind = opts.kind || (x0 <= xs + 1e-6 && x1 >= xf - 1e-6 ? 'whole' : (x0 <= xs + 1e-6 ? 'stern' : (x1 >= xf - 1e-6 ? 'bow' : 'middle')));
    const water = opts.air === undefined || opts.air === 'sim' ? waterBySlice(sim, F, T) : null;
    const KP = Object.assign({}, K0, opts.K || {}), airAt = KP.airAt;   // where the pocket's lift acts across her (K0.airAt)
    if (airAt !== 'centre' && airAt !== 'flag') throw new Error('K.airAt is \'centre\' or \'flag\', not ' + JSON.stringify(airAt));
    if (KP.peakTank !== 'solid' && KP.peakTank !== 'weighed') throw new Error('K.peakTank is \'solid\' or \'weighed\', not ' + JSON.stringify(KP.peakTank));
    if (KP.section !== 'decimated' && KP.section !== 'full') throw new Error('K.section is \'decimated\' or \'full\', not ' + JSON.stringify(KP.section));
    const full = KP.section === 'full';
    // K.solids 'items': each zone's floodable volume and the hand-over's water in it, by the zone's factor (solidsScale)
    const gz = KP.solids === 'items' ? solidsScale(T, KP.wood) : null;
    const slices = [];
    let airV = 0, airX = 0, airY = 0, airZ = 0;
    for (let j = 0; j < T.nS; j++) {
      const lo = Math.max(x0, T.e[j]), hi = Math.min(x1, T.e[j + 1]);
      if (!(hi - lo > 1e-9)) continue;
      const f = (hi - lo) / T.dx[j], st = structureIn(cv, lo, hi);
      // her structure spread across her beam as a uniform plate [bet: the curve gives no breadth]
      const s = {
        x: 0.5 * (lo + hi), dx: hi - lo, B: T.B[j], H: T.H[j], Venv: f * T.Venv[j], ey: T.ey[j], ez: T.ez[j],
        Vf: gz ? f * T.Vf[j] * gz[T.zone[j]] : f * T.Vf[j], fy: T.fy[j], fz: T.fz[j], ms: st.m, gx: st.gx, gy: cv.yG, gz: st.gz,
        own: { xx: st.sxx, yy: st.m * T.B[j] * T.B[j] / 12, zz: st.szz, xz: st.sxz },
        Hh: T.Hh[j], ezh: T.ezh[j], Vh: f * T.Vh[j], perim: full ? T.perimFull[j] : T.perim[j], poly: full ? T.polyFull[j] : T.poly[j], shape: 'rect',
      };
      slices.push(s);
      if (water) {
        const Wv = gz ? f * water.W[j] * gz[T.zone[j]] : f * water.W[j], air = Math.max(0, s.Vf - Wv);
        if (air > 1e-9) {
          let cy = s.fy, cz = s.fz;                 // 'centre': the slice's own floodable centre
          if (airAt === 'flag') {                   // 'flag': the unfilled volume's centre at the hand-over's pose
            const wy = water.W[j] > 0 ? water.WY[j] / water.W[j] : s.fy, wz = water.W[j] > 0 ? water.WZ[j] / water.W[j] : s.fz;
            cy = (s.Vf * s.fy - Wv * wy) / air; cz = (s.Vf * s.fz - Wv * wz) / air;
          }
          airV += air; airX += air * s.x; airY += air * cy; airZ += air * cz;
        }
      }
    }
    // K.peakTank 'weighed': a pocket outside every space's columns (G7's tank) weighed as the core weighs it, its water a
    // mass in the slice of this piece where it stands
    if (KP.peakTank === 'weighed' && sim.pockets) for (const k of sim.pockets) {
      if (k.overlap !== false || !(k.vol > 0)) continue;
      const pts = C.pocketPoints(sim, F, k);
      for (let i = 0; i < pts.length; i += 4) {
        const px = pts[i + 1], s = slices.find(q => px >= q.x - 0.5 * q.dx && px < q.x + 0.5 * q.dx);
        if (s) addMass(s, C.RHO * pts[i], px, pts[i + 2], pts[i + 3]);
      }
    }
    let air = null;
    if (water && airV > 1e-6) air = { V: airV, p: [airX / airV, airY / airV, airZ / airV] };
    else if (typeof opts.air === 'number' && opts.air > 0) {
      let vf = 0, mx = 0, my = 0, mz = 0; for (const s of slices) { vf += s.Vf; mx += s.Vf * s.x; my += s.Vf * s.fy; mz += s.Vf * s.fz; }
      air = { V: Math.min(opts.air, vf), p: opts.airAt || [mx / vf, my / vf, mz / vf] };
    }
    // the vent: the core's own share of the top deck open to the sea once submerged (params.fOpen, the K_TOP openings of
    // core.js), over the piece's length [the model's own, calibrated to the night's flooding]
    const vent = opts.vent !== undefined ? opts.vent : (sim.params.fOpen || 0) * (x1 - x0);
    const torn = { aft: x0 > xs + 1e-6, fwd: x1 < xf - 1e-6 };
    return { id: opts.id || kind, kind, x0, x1, slices, ends: { aft: torn.aft ? 'torn' : 'faired', fwd: torn.fwd ? 'torn' : 'faired' }, air, vent, lever: opts.lever || 0, K: opts.K || {}, yG: cv.yG };
  }

  // ================================================================ a body: the engine's piece
  // From a spec ({ id, kind, x0, x1, slices: [{ x, dx, B, H, Venv, ey, ez, Vf, fy, fz, ms, gx, gy, gz, perim, poly,
  // shape: 'rect' | 'circle' }], ends: { aft, fwd: 'torn' | 'faired' | 'none' }, air: { V, p } | null, vent, lever, K })
  // the plain-data body the step moves: its tables as typed arrays, its mass matrix about C, its momenta.
  function body(spec, sp) {
    const K = Object.assign({}, K0, spec.K || {});
    if (K.air !== 'pocket' && K.air !== 'spaces') throw new Error('K.air is \'pocket\' or \'spaces\', not ' + JSON.stringify(K.air));
    if (K.fail !== 'simple' && K.fail !== 'boundaries') throw new Error('K.fail is \'simple\' or \'boundaries\', not ' + JSON.stringify(K.fail));
    if (K.floats !== 'core' && K.floats !== 'none') throw new Error('K.floats is \'core\' or \'none\', not ' + JSON.stringify(K.floats));
    if (K.weather !== 'none' && K.weather !== 'core') throw new Error('K.weather is \'none\' or \'core\', not ' + JSON.stringify(K.weather));
    if (K.failOnce !== 'space' && K.failOnce !== 'boundary') throw new Error('K.failOnce is \'space\' or \'boundary\', not ' + JSON.stringify(K.failOnce));
    if (K.limiter !== 'pair' && K.limiter !== 'held') throw new Error('K.limiter is \'pair\' or \'held\', not ' + JSON.stringify(K.limiter));
    if (K.solids !== 'core' && K.solids !== 'items') throw new Error('K.solids is \'core\' or \'items\', not ' + JSON.stringify(K.solids));
    if (K.wood !== 'afloat' && K.wood !== 'soaked') throw new Error('K.wood is \'afloat\' or \'soaked\', not ' + JSON.stringify(K.wood));
    if (K.peakTank !== 'solid' && K.peakTank !== 'weighed') throw new Error('K.peakTank is \'solid\' or \'weighed\', not ' + JSON.stringify(K.peakTank));
    if (K.section !== 'decimated' && K.section !== 'full') throw new Error('K.section is \'decimated\' or \'full\', not ' + JSON.stringify(K.section));
    const S = spec.slices, n = S.length;
    const A = () => new Float64Array(n);
    const b = {
      id: spec.id, kind: spec.kind || 'body', x0: spec.x0 === undefined ? S[0].x - 0.5 * S[0].dx : spec.x0, x1: spec.x1 === undefined ? S[n - 1].x + 0.5 * S[n - 1].dx : spec.x1,
      n, K, ends: Object.assign({ aft: 'none', fwd: 'none' }, spec.ends || {}),
      x: A(), dx: A(), B: A(), H: A(), Hd: A(), ezd: A(), Ha: A(), eza: A(), Venv: A(), ey: A(), ez: A(), Vf: A(), fy: A(), fz: A(), ms: A(), gx: A(), gy: A(), gz: A(), perim: A(), ca22: A(), ca33: A(),
      polyOff: new Int32Array(n + 1), polyY: null, polyZ: null, polyA: A(), polyCy: A(), polyCz: A(), lever: spec.lever || 0, vent: spec.vent || 0,
    };
    let np = 0;
    for (let i = 0; i < n; i++) np += S[i].poly.y.length;
    b.polyY = new Float64Array(np); b.polyZ = new Float64Array(np);
    np = 0;
    for (let i = 0; i < n; i++) {
      const s = S[i];
      b.x[i] = s.x; b.dx[i] = s.dx; b.B[i] = s.B; b.H[i] = s.H; b.Venv[i] = s.Venv; b.ey[i] = s.ey; b.ez[i] = s.ez;
      b.Vf[i] = s.Vf || 0; b.fy[i] = s.Vf ? s.fy : s.ey; b.fz[i] = s.Vf ? s.fz : s.ez; b.ms[i] = s.ms; b.gx[i] = s.gx; b.gy[i] = s.gy; b.gz[i] = s.gz;
      b.perim[i] = s.perim || 2 * (s.B + s.H);
      // the section the water acts on, its depth and the height of its centre, twice (K.tiersSide, K.tiersAdded: D52's
      // one share, split by D(G12-e)): for her cross-flow and turning drag (Hd, ezd), and for her added mass and the torn
      // end's lift (Ha, eza). At 1 (and wherever no tiers stand) the whole section, as it was, to the bit; at 0 the
      // hull's own; between, the tiers' share of the depth above the hull's top, and of the tiers' volume in the centre
      const Vt = s.Vh > 0 ? s.Venv - s.Vh : 0;
      const sect = (tf) => {
        if (tf === 1 || !(s.Hh > 0) || !(Vt > 1e-9)) return [s.H, s.ez];
        if (tf === 0) return [s.Hh, s.ezh];
        const ezt = (s.Venv * s.ez - s.Vh * s.ezh) / Vt;
        return [s.Hh + tf * (s.H - s.Hh), (s.Vh * s.ezh + tf * Vt * ezt) / (s.Vh + tf * Vt)];
      };
      const both = K.tiersFlow !== null && K.tiersFlow !== undefined, dS = sect(both ? K.tiersFlow : K.tiersSide), dA = sect(both ? K.tiersFlow : K.tiersAdded);
      b.Hd[i] = dS[0]; b.ezd[i] = dS[1]; b.Ha[i] = dA[0]; b.eza[i] = dA[1];
      if (s.shape === 'circle') { b.ca22[i] = 1; b.ca33[i] = 1; }
      else { b.ca22[i] = caRect(b.Ha[i] / s.B); b.ca33[i] = caRect(s.B / b.Ha[i]); }
      b.polyOff[i] = np;
      let ar = 0, my = 0, mz = 0;
      const py = s.poly.y, pz = s.poly.z, m = py.length;
      for (let k = 0; k < m; k++) { b.polyY[np + k] = py[k]; b.polyZ[np + k] = pz[k]; const k2 = (k + 1) % m, cr = py[k] * pz[k2] - py[k2] * pz[k]; ar += cr; my += (py[k] + py[k2]) * cr; mz += (pz[k] + pz[k2]) * cr; }
      b.polyA[i] = 0.5 * ar; b.polyCy[i] = ar !== 0 ? my / (3 * ar) : s.ey; b.polyCz[i] = ar !== 0 ? mz / (3 * ar) : s.ez;
      np += m;
    }
    b.polyOff[n] = np;
    // the column's mean density: what her inertia and her added mass are taken at [mine]
    const rhoRef = K.rhoRef || (sp ? rhoAt(sp, 0.5 * sp.depth) : 1035);
    b.rhoRef = rhoRef;
    // her weight's lever, the one fitted number (decision D49): her weight in water moved `lever` m along her (+ forward)
    // by tilting her structure's weight in a straight line over her slices, its total kept
    if (b.lever) {
      let m = 0, mx = 0, vs = 0; for (let i = 0; i < n; i++) { m += b.ms[i]; mx += b.ms[i] * b.x[i]; vs += b.Venv[i] - b.Vf[i]; }
      const xb = mx / m; let i2 = 0; for (let i = 0; i < n; i++) i2 += b.ms[i] * (b.x[i] - xb) * (b.x[i] - xb);
      const kap = (m - rhoRef * vs) * b.lever / i2;
      for (let i = 0; i < n; i++) b.ms[i] *= 1 + kap * (b.x[i] - xb);
    }
    // C: the envelope's centroid, her own origin for every term below
    let V = 0, vx = 0, vy = 0, vz = 0, Amax = 0;
    for (let i = 0; i < n; i++) { V += b.Venv[i]; vx += b.Venv[i] * b.x[i]; vy += b.Venv[i] * b.ey[i]; vz += b.Venv[i] * b.ez[i]; const a = b.Venv[i] / b.dx[i]; if (a > Amax) Amax = a; }
    b.C = [vx / V, vy / V, vz / V]; b.V = V; b.Amax = Amax; b.L = b.x1 - b.x0;
    // each slice's bounding radius about its envelope centroid, and the body's about C (for the quick tests of the
    // surface and the bed)
    b.rad = A(); let Rb = 0;
    for (let i = 0; i < n; i++) {
      let r2 = 0; for (let k = b.polyOff[i]; k < b.polyOff[i + 1]; k++) { const dy = b.polyY[k] - b.ey[i], dz = b.polyZ[k] - b.ez[i], d2 = dy * dy + dz * dz; if (d2 > r2) r2 = d2; }
      b.rad[i] = Math.sqrt(r2 + 0.25 * b.dx[i] * b.dx[i]);
      const ax = b.x[i] - b.C[0], ay = b.ey[i] - b.C[1], az = b.ez[i] - b.C[2], rr = Math.sqrt(ax * ax + ay * ay + az * az) + b.rad[i];
      if (rr > Rb) Rb = rr;
    }
    b.Rb = Rb;
    // the spheroid's end corrections for her own proportions [R6 1.3]
    const Lb = lamb(b.L / Math.sqrt(4 * Amax / Math.PI));
    b.lamb = Lb;
    const k1 = K.k1 && typeof K.k1 === 'object' ? (K.k1[b.kind] !== undefined ? K.k1[b.kind] : Lb.k1) : (typeof K.k1 === 'number' ? K.k1 : Lb.k1);
    b.k1 = k1;
    // the rigid body about C: her structure, and the water in her as if every floodable space were full (the pocket
    // takes its share out below). Each slice's structure at its centroid with its own second moments about it (the
    // girder curve's, exact; a body of no ship takes a uniform box), its water at its centroid spread evenly along the
    // slice. So every part is additive: the pieces of a cut ship sum to the whole.
    const M = new Float64Array(36), cx = b.C[0], cy = b.C[1], cz = b.C[2];
    let m = 0, sx = 0, sy = 0, sz = 0;
    const I = [0, 0, 0, 0, 0, 0];                     // Ixx Iyy Izz Ixy Ixz Iyz about C
    const pt = (mm, px, py, pz) => { m += mm; sx += mm * px; sy += mm * py; sz += mm * pz; I[0] += mm * (py * py + pz * pz); I[1] += mm * (px * px + pz * pz); I[2] += mm * (px * px + py * py); I[3] -= mm * px * py; I[4] -= mm * px * pz; I[5] -= mm * py * pz; };
    for (let i = 0; i < n; i++) {
      const ms = b.ms[i], o = S[i].own, sc = ms / (S[i].ms || 1);      // a lever's tilt scales a slice's own moments with its mass
      pt(ms, b.gx[i] - cx, b.gy[i] - cy, b.gz[i] - cz);
      const oxx = o ? o.xx * sc : ms * b.dx[i] * b.dx[i] / 12, oyy = o ? o.yy * sc : ms * b.B[i] * b.B[i] / 12, ozz = o ? o.zz * sc : ms * b.H[i] * b.H[i] / 12, oxz = o ? o.xz * sc : 0;
      I[0] += oyy + ozz; I[1] += oxx + ozz; I[2] += oxx + oyy; I[4] -= oxz;
      if (b.Vf[i] > 0) { const mw = rhoRef * b.Vf[i]; pt(mw, b.x[i] - cx, b.fy[i] - cy, b.fz[i] - cz); I[1] += mw * b.dx[i] * b.dx[i] / 12; I[2] += mw * b.dx[i] * b.dx[i] / 12; }
    }
    b.mass = m; b.mc = [sx, sy, sz];
    M[0] = m; M[7] = m; M[14] = m;
    // P = m v - S(c) w ; L = S(c) v + I w   (c = m r_G)
    const Sc = [[0, -sz, sy], [sz, 0, -sx], [-sy, sx, 0]];
    for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) { M[r * 6 + 3 + k] = -Sc[r][k]; M[(3 + r) * 6 + k] = Sc[r][k]; }
    M[21] = I[0]; M[28] = I[1]; M[35] = I[2]; M[22] = I[3]; M[27] = I[3]; M[23] = I[4]; M[33] = I[4]; M[29] = I[5]; M[34] = I[5];
    b.MRB = M;
    // the added mass about C, strip by strip: the section's velocity across her (v_y, v_z) with the spheroid's k2 on
    // its translations and k' on its turning, a quadratic form in (u v w p q r) [R6 10.2]
    const MA = new Float64Array(36), a2 = Math.sqrt(Lb.k2), ar = Math.sqrt(Lb.kr);
    const add = (w, c6) => { for (let r = 0; r < 6; r++) { if (c6[r] === 0) continue; for (let k = 0; k < 6; k++) MA[r * 6 + k] += w * c6[r] * c6[k]; } };
    for (let i = 0; i < n; i++) {
      const xi = b.x[i] - cx, eta = b.ey[i] - cy, zeta = b.eza[i] - cz;
      const m22 = b.ca22[i] * rhoRef * Math.PI * 0.25 * b.Ha[i] * b.Ha[i] * b.dx[i];
      const m33 = b.ca33[i] * rhoRef * Math.PI * 0.25 * b.B[i] * b.B[i] * b.dx[i];
      add(m22, [0, a2, 0, -a2 * zeta, 0, ar * xi]);
      add(m33, [0, 0, a2, a2 * eta, -ar * xi, 0]);
      const hb = 0.5 * b.B[i];
      MA[21] += K.rollAdded * rhoRef * Math.PI * hb * hb * hb * hb * b.dx[i];
    }
    MA[0] += k1 * rhoRef * V;
    if (!K.potential) MA.fill(0);
    b.MA = MA;
    b.M = new Float64Array(36); for (let k = 0; k < 36; k++) b.M[k] = M[k] + MA[k];
    // the pocket of air: its amount in m3 at one atmosphere (a), its place in her (ship frame)
    b.air = spec.air ? { a: 0, V0: spec.air.V, p: spec.air.p.slice() } : null;
    b.airMax = 0; for (let i = 0; i < n; i++) b.airMax += b.Vf[i];
    // the leading end's area along her, her wetted girth
    let wet = 0; for (let i = 0; i < n; i++) wet += b.perim[i] * b.dx[i];
    b.wet = K.wetShare * wet;
    b.cfL = b.L;
    // state, set by place()
    b.X = [0, 0, 0]; b.q = [1, 0, 0, 0]; b.P = [0, 0, 0]; b.Lm = [0, 0, 0]; b.nu = [0, 0, 0, 0, 0, 0];
    b.rate = [0, 0, 0, 0, 0, 0];
    b.state = 'falling'; b.tSlow = 0; b.struck = false; b.touched = false; b.arrival = null; b.wentUnder = false; b.bury = new Float64Array(n); b.shed = false; b.inMud = false;
    b.W = { drag: 0, mud: 0, cons: 0, surf: 0, air: 0, shed: 0, freeze: 0 };
    b.iters = 0; b.subs = 0; b.unconv = 0;
    return b;
  }

  // ================================================================ small linear algebra
  function quatR(q, R) {
    const w = q[0], x = q[1], y = q[2], z = q[3];
    R[0] = 1 - 2 * (y * y + z * z); R[1] = 2 * (x * y - w * z); R[2] = 2 * (x * z + w * y);
    R[3] = 2 * (x * y + w * z); R[4] = 1 - 2 * (x * x + z * z); R[5] = 2 * (y * z - w * x);
    R[6] = 2 * (x * z - w * y); R[7] = 2 * (y * z + w * x); R[8] = 1 - 2 * (x * x + y * y);
    return R;
  }
  function quatOfR(R) {                             // Shepperd: sqrt only
    const t = R[0] + R[4] + R[8];
    let q;
    if (t > 0) { const s = 2 * Math.sqrt(1 + t); q = [0.25 * s, (R[7] - R[5]) / s, (R[2] - R[6]) / s, (R[3] - R[1]) / s]; }
    else if (R[0] > R[4] && R[0] > R[8]) { const s = 2 * Math.sqrt(1 + R[0] - R[4] - R[8]); q = [(R[7] - R[5]) / s, 0.25 * s, (R[1] + R[3]) / s, (R[2] + R[6]) / s]; }
    else if (R[4] > R[8]) { const s = 2 * Math.sqrt(1 + R[4] - R[0] - R[8]); q = [(R[2] - R[6]) / s, (R[1] + R[3]) / s, 0.25 * s, (R[5] + R[7]) / s]; }
    else { const s = 2 * Math.sqrt(1 + R[8] - R[0] - R[4]); q = [(R[3] - R[1]) / s, (R[2] + R[6]) / s, (R[5] + R[7]) / s, 0.25 * s]; }
    if (q[0] < 0) { q[0] = -q[0]; q[1] = -q[1]; q[2] = -q[2]; q[3] = -q[3]; }
    const nq = Math.sqrt(q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3]);
    return [q[0] / nq, q[1] / nq, q[2] / nq, q[3] / nq];
  }
  // the core's pose, R = Ry(pitch) Rx(roll) (pitch bow down +, roll starboard down +), as a row-major 3 x 3
  function poseR(pitch, roll) {
    const ct = C.cos(pitch), st = C.sin(pitch), cp = C.cos(roll), spp = C.sin(roll);
    return [ct, st * spp, st * cp, 0, cp, -spp, -st, ct * spp, ct * cp];
  }
  // Cholesky solve of the 6 x 6 symmetric positive-definite M: x = M^-1 b (L in scratch)
  function solve6(M, bv, x, Lw) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j <= i; j++) {
        let s = M[i * 6 + j];
        for (let k = 0; k < j; k++) s -= Lw[i * 6 + k] * Lw[j * 6 + k];
        Lw[i * 6 + j] = i === j ? Math.sqrt(s) : s / Lw[j * 6 + j];
      }
    }
    const y = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 6; i++) { let s = bv[i]; for (let k = 0; k < i; k++) s -= Lw[i * 6 + k] * y[k]; y[i] = s / Lw[i * 6 + i]; }
    for (let i = 5; i >= 0; i--) { let s = y[i]; for (let k = i + 1; k < 6; k++) s -= Lw[k * 6 + i] * x[k]; x[i] = s / Lw[i * 6 + i]; }
    return x;
  }

  // ================================================================ the pocket
  // its volume now, m3, with its centre at depth d (the sea's pressure there, never less than one atmosphere)
  function airVolume(b, sp, d) {
    if (!b.air || !(b.air.a > 0)) return 0;
    const p = Math.max(pAt(sp, d), P_ATM), v = b.air.a * P_ATM / p;
    return v < b.airMax ? v : b.airMax;
  }
  // the mass matrix with the pocket's share of water taken out: a point of rhoRef V at the pocket. In the mud, with the
  // water she drags shed (K.strikeAdded 0), her own alone
  function massWithAir(b, Vair, M) {
    const M0 = b.shed ? b.MRB : b.M;
    for (let k = 0; k < 36; k++) M[k] = M0[k];
    if (!(Vair > 0)) return M;
    const m = b.rhoRef * Vair, px = b.air.p[0] - b.C[0], py = b.air.p[1] - b.C[1], pz = b.air.p[2] - b.C[2];
    M[0] -= m; M[7] -= m; M[14] -= m;
    const cx = m * px, cy = m * py, cz = m * pz;
    // -S(c) in the top right, S(c) in the bottom left
    M[4] -= cz; M[5] += cy; M[9] += cz; M[11] -= cx; M[15] -= cy; M[16] += cx;
    M[19] += cz; M[20] -= cy; M[24] -= cz; M[26] += cx; M[30] += cy; M[31] -= cx;
    M[21] -= m * (py * py + pz * pz); M[28] -= m * (px * px + pz * pz); M[35] -= m * (px * px + py * py);
    M[22] += m * px * py; M[27] += m * px * py; M[23] += m * px * pz; M[33] += m * px * pz; M[29] += m * py * pz; M[34] += m * py * pz;
    return M;
  }

  // ---------------------------------------------------------------- Z6's spaces as the pocket (K.air 'spaces', M2 4c)
  // b.spc = { sp, st, ops, K, t, acc, ev, seen, V }: the piece's spaces (spaces.spacesOf), their water and air
  // (stateOf's, changed in place), its openings (openingsOf's, with failSpaces' added), the spaces' clock, the time
  // owed to their next step, the reports logged (with the node) and how many of them the fall has heard, their air now.
  // spacesPocket: their air's whole volume (each space's room above its water, at its own pressure) through its
  // volume-weighted centroid in her frame, which is exact for the moment of the parallel lifts (the air's spread about
  // that point is left out of her inertia, as the pocket leaves it); the pocket's amount is what gives that volume at the
  // centroid's depth by airVolume. R, r: her pose (R row-major, her frame to the world; r her frame's origin in it)
  const SPW = {};
  function spacesPocket(b, sp, R, r) {
    const S = b.spc, water = spacesLib().water, ssp = S.sp, st = S.st, u = [R[6], R[7], R[8]], zr = r[2];
    let V = 0, mx = 0, my = 0, mz = 0;
    for (let k = 0; k < ssp.n; k++) {
      if (!(ssp.V[k] - st.W[k] > 1e-9 * ssp.V[k])) continue;
      water(ssp, k, u, zr, st.W[k], st.lev[k], SPW); st.lev[k] = SPW.level;
      V += SPW.air; mx += SPW.air * SPW.ax; my += SPW.air * SPW.ay; mz += SPW.air * SPW.az;
    }
    S.V = V;
    if (!(V > 0)) { b.air.a = 0; return; }
    b.air.p[0] = mx / V; b.air.p[1] = my / V; b.air.p[2] = mz / V;
    const da = -(zr + u[0] * b.air.p[0] + u[1] * b.air.p[1] + u[2] * b.air.p[2]);
    b.air.a = V * Math.max(pAt(sp, da), P_ATM) / P_ATM;
  }
  // a sub-step of h at her pose R (her centre C at b.X): the spaces are stepped over the time owed to them once it
  // reaches K.spaceDt, the spaces lagging the sea past their heads then give way (each report with her speed then), and
  // their air is set as the pocket. Returns whether they were stepped
  function spacesStep(b, sp, R, h) {
    const S = b.spc, SPm = spacesLib();
    if (S.tear) tearStep(S);                         // B4's gate 2: the tear's openings at the joint's state, or the release
    S.acc += h;
    if (S.acc < S.K.spaceDt * (1 - 1e-9)) return false;
    const dt = S.acc, c = b.C;
    S.acc = 0;
    const r = [b.X[0] - (R[0] * c[0] + R[1] * c[1] + R[2] * c[2]), b.X[1] - (R[3] * c[0] + R[4] * c[1] + R[5] * c[2]), b.X[2] - (R[6] * c[0] + R[7] * c[1] + R[8] * c[2])];
    SPm.stepPiece(S.sp, S.st, S.ops, R, r, dt, undefined, S.K.limiter);
    S.t += dt;
    if (S.doors && S.doors.length) SPm.doorsStep(S.sp, S.st, S.doors, S.ops, R, r, dt, S.P, S.t);   // the floats (K.floats 'core')
    if (S.weather && S.weather.list.length) SPm.weatherStep(S.sp, S.st, S.weather, S.ops, R, r, S.t, S.P);   // the openings to the weather (K.weather 'core')
    const n0 = S.ev.length;
    spacesFail(b, R, r, S.t);
    if (S.ev.length > n0) { const v = comSpeed(b, b.nu); for (let e = n0; e < S.ev.length; e++) S.ev[e].speed = v; }
    spacesPocket(b, sp, R, r);
    return true;
  }
  // the spaces giving way at her pose (K.fail): the first form, or section 5's by boundary (b.spc.bnd)
  function spacesFail(b, R, r, t) {
    const S = b.spc, SPm = spacesLib();
    return S.bnd ? SPm.failBoundaries(S.sp, S.st, S.ops, S.bnd, R, r, S.K, t, S.ev) : SPm.failSpaces(S.sp, S.st, S.ops, R, r, S.K, t, S.ev);
  }
  // K.torn (Z6 from the onset, docs/DESIGN_Z6_the_stern_from_the_onset_v1_2026-11-23.md): a hull that breaks in hogging
  // fails over a length, not at a plane (B4's hinge yields over Lh [bet 20 m]; the boiler field and the double bottom's
  // pieces lie between the pieces on the bed, R5 1.1). Within K.torn/2 of the cut, from the hand-over on, every boundary
  // of the piece (bulkhead, joiner work, E deck) whose centroid lies there gives way over K.failShare of its area, as
  // failBoundaries opens one, and every space with a box there opens its shell to the sea, as failSpaces does; each is
  // then given way for good (its 'once'). Counted in b.spc.torn. K.torn 0, the default: nothing, to the bit
  function tornOpen(b, xc, half) {
    const S = b.spc, sp = S.sp, st = S.st, SPm = spacesLib(), share = S.K.failShare === undefined ? 0.5 : S.K.failShare;
    st.failed = st.failed || new Uint8Array(sp.n);
    let nb = 0, ns = 0;
    if (S.bnd) {
      st.bfailed = st.bfailed || new Uint8Array(S.bnd.length);
      for (let i = 0; i < S.bnd.length; i++) {
        const B = S.bnd[i];
        if (st.bfailed[i] || Math.abs(B.px - xc) > half) continue;
        const A = share * B.A, L = B.kind === 'deck' ? Math.sqrt(A) : 2 * B.hz;
        S.ops.push({ c: -1, kind: 'torn ' + B.kind, a: B.a, b: B.b, px: B.px, py: B.py, pz: B.pz, nx: B.nx, ny: B.ny, nz: B.nz, A, L, Cd: 0.6, open: true });
        st.bfailed[i] = 1; nb++;
      }
    }
    for (let k = 0; k < sp.n; k++) {
      if (st.failed[k]) continue;
      let near = false;
      for (let q = sp.start[k], q1 = q + sp.count[k]; q < q1 && !near; q++) if (sp.bx[q] + sp.wx[q] >= xc - half && sp.bx[q] - sp.wx[q] <= xc + half) near = true;
      if (!near) continue;
      S.ops.push(SPm.shellOpening(sp, k, share)); st.failed[k] = 1; ns++;
      if (S.K.failOnce === 'boundary') (st.sfailed || (st.sfailed = new Uint8Array(sp.n)))[k] = 1;   // its shell given way (K.failOnce, claude/z1-limiter)
    }
    S.torn = { half, boundaries: nb, shells: ns };
  }
  // the failures the fall has not yet heard: each past K.reportMin into its events as a 'report', in the contract's form
  // (depth, the depth of the space's free surface; energy, its air's lag behind the sea times its volume, J; speed, hers
  // then)
  function spacesReport(fall, i) {
    const S = fall.eng.bodies[i].spc, id = fall.pieces[i].id;
    for (; S.seen < S.ev.length; S.seen++) {
      const e = S.ev[S.seen];
      if (e.energy >= S.K.reportMin) fall.events.push({ t: e.t, id: 'report', piece: id, depth: e.depth, energy: e.energy, speed: e.speed });
    }
  }

  // ================================================================ the section cut by the sea's plane
  // The part of slice i's section below the line a y + b z < c (the sea's plane at one point along the slice): area and
  // centroid, by clipping its polygon (Sutherland-Hodgman against one half-plane, then the shoelace)
  function clipArea(bd, i, a, bb, c, out) {
    const o = bd.polyOff[i], m = bd.polyOff[i + 1] - o, Y = bd.polyY, Z = bd.polyZ;
    let A = 0, my = 0, mz = 0, py = 0, pz = 0, has = false, fy = 0, fz = 0;
    const emit = (y, z) => { if (has) { const cr = py * z - y * pz; A += cr; my += (py + y) * cr; mz += (pz + z) * cr; } else { fy = y; fz = z; has = true; } py = y; pz = z; };
    let y0 = Y[o + m - 1], z0 = Z[o + m - 1], in0 = a * y0 + bb * z0 < c;
    for (let k = 0; k < m; k++) {
      const y1 = Y[o + k], z1 = Z[o + k], in1 = a * y1 + bb * z1 < c;
      if (in1 !== in0) { const d0 = a * y0 + bb * z0 - c, d1 = a * y1 + bb * z1 - c, t = d0 / (d0 - d1); emit(y0 + t * (y1 - y0), z0 + t * (z1 - z0)); }
      if (in1) emit(y1, z1);
      y0 = y1; z0 = z1; in0 = in1;
    }
    if (has) { const cr = py * fz - fy * pz; A += cr; my += (py + fy) * cr; mz += (pz + fz) * cr; }
    A *= 0.5;
    out[0] = A; out[1] = A !== 0 ? my / (6 * A) : 0; out[2] = A !== 0 ? mz / (6 * A) : 0;
    return out;
  }

  // ================================================================ the loads at a sub-step's middle
  // Everything on body b with her momenta's middle nu = (v, w), her place and attitude at the sub-step's start (X0, R0)
  // and end (X1, R1), their middle (Xm, Rm = (R0 + R1) / 2). F, T in her own axes about C. Works (J/s) into pw.
  const SC = { cut: [0, 0, 0] };
  function loads(b, sp, nu, X0, R0, X1, R1, Xm, Rm, Vair, out, pw) {
    const K = b.K, n = b.n, cx = b.C[0], cy = b.C[1], cz = b.C[2], g = GRAV;
    const v0 = nu[0], v1 = nu[1], v2 = nu[2], w0 = nu[3], w1 = nu[4], w2 = nu[5];
    const r3x = Rm[6], r3y = Rm[7], r3z = Rm[8];   // world up in her axes (the middle's)
    let cS0 = 0, cSx = 0, cSy = 0, cSz = 0;          // conservative vertical forces: their sum and first moment (N, N m)
    let sS0 = 0, sSx = 0, sSy = 0, sSz = 0;          // the same for buoyancy at the surface (not conservative as computed)
    let Fx = 0, Fy = 0, Fz = 0, Tx = 0, Ty = 0, Tz = 0;   // viscous and separated
    let Mx = 0, My = 0, Mz = 0, Nx = 0, Ny = 0, Nz = 0;   // the mud
    // the world Z of a point of hers at the start, the end and the middle
    const zAt = (Xv, R, px, py, pz) => Xv[2] + R[6] * px + R[7] * py + R[8] * pz;
    const vert = (F, px, py, pz) => { cS0 += F; cSx += F * px; cSy += F * py; cSz += F * pz; };
    let fsubSum = 0;
    for (let i = 0; i < n; i++) {
      const xi = b.x[i] - cx, dx = b.dx[i];
      // the structure's weight
      vert(-b.ms[i] * g, b.gx[i] - cx, b.gy[i] - cy, b.gz[i] - cz);
      // how much of the slice is under the sea: its box's extent in the world's Z about its middle
      const ex = b.ey[i] - cy, ez = b.ez[i] - cz, zmid = zAt(Xm, Rm, xi, ex, ez), rad = b.rad[i];
      let fsub = 1, cut = false;
      if (zmid + rad > 0) {
        if (zmid - rad >= 0) fsub = 0;
        else {
          // three sections along the slice, each cut exactly by the plane Z = 0; the polygon's centroid moved onto the
          // section's own, so that a slice that goes wholly under does not jump
          let A = 0, ax = 0, ay = 0, az = 0;
          const a = Rm[7], bb = Rm[8], A0 = b.polyA[i], oy = b.ey[i] - b.polyCy[i], oz = b.ez[i] - b.polyCz[i];
          for (let gq = 0; gq < 3; gq++) {
            const xg = xi + GAUSS[gq][0] * 0.5 * dx, wg = GAUSS[gq][1];
            // the section at xg is under where Xm_z + Rm20 xg + a (y - cy) + bb (z - cz) < 0
            const c = -(Xm[2] + Rm[6] * xg) + a * cy + bb * cz;
            let fr, yc, zc;
            if (Math.abs(a) + Math.abs(bb) < 1e-12) { fr = c > 0 ? 1 : 0; yc = b.polyCy[i]; zc = b.polyCz[i]; }
            else { clipArea(b, i, a, bb, c, SC.cut); fr = A0 > 0 ? SC.cut[0] / A0 : 0; yc = SC.cut[1]; zc = SC.cut[2]; }
            if (fr > 1) fr = 1; if (fr < 0) fr = 0;
            A += wg * fr; ax += wg * fr * xg; ay += wg * fr * (yc + oy - cy); az += wg * fr * (zc + oz - cz);
          }
          if (A < 1 - 1e-12) {
            cut = true; fsub = A;
            if (A > 0) {
              const px = ax / A, py = ay / A, pz = az / A, d = -zAt(Xm, Rm, px, py, pz);
              const Fb = rhoAt(sp, d) * g * b.Venv[i] * A;
              sS0 += Fb; sSx += Fb * px; sSy += Fb * py; sSz += Fb * pz;
            }
          }
        }
      }
      fsubSum += fsub;
      if (!cut && fsub === 1) {
        // wholly under: the envelope's buoyancy at its centroid, at the density met on the centroid's path
        const d0 = -zAt(X0, R0, xi, ex, ez), d1 = -zAt(X1, R1, xi, ex, ez);
        vert(rhoPath(sp, d0, d1) * g * b.Venv[i], xi, ex, ez);
      }
      // the water in her, every floodable space counted full (the pocket's lift gives back what is not)
      if (b.Vf[i] > 0) {
        const fx = xi, fy = b.fy[i] - cy, fz = b.fz[i] - cz;
        const d0 = -zAt(X0, R0, fx, fy, fz), d1 = -zAt(X1, R1, fx, fy, fz);
        vert(-rhoPath(sp, d0, d1) * g * b.Vf[i], fx, fy, fz);
      }
      if (!K.drag || fsub <= 0) continue;
      // cross-flow on the slice, at the centre of the section the water acts on (K.sections), at the local density
      const rho = rhoAt(sp, -zmid), ed = b.ezd[i] - cz;
      const Vy = v1 + w2 * xi - w0 * ed, Vz = v2 + w0 * ex - w1 * xi;
      const c2 = Vy * Vy + Vz * Vz;
      if (c2 > 0) {
        const cm = Math.sqrt(c2), ny = Vy / cm, nz = Vz / cm;
        const h = b.Hd[i] * Math.abs(ny) + b.B[i] * Math.abs(nz);
        const cd = K.cdBeam * ny * ny + (nz < 0 ? K.cdKeel : K.cdDeck) * nz * nz;
        const q = -0.5 * rho * cd * h * dx * cm * fsub, fy = q * Vy, fz = q * Vz;
        Fy += fy; Fz += fz;
        Tx += ex * fz - ed * fy; Ty += -xi * fz; Tz += xi * fy;
      }
      // the section's own drag as it rolls about its centre [mine]
      if (K.turn && w0 !== 0) {
        const hb = 0.5 * b.B[i], hh = 0.5 * b.Hd[i];
        Tx -= 0.25 * rho * dx * w0 * Math.abs(w0) * (0.5 * (K.cdKeel + K.cdDeck) * hb * hb * hb * hb + K.cdBeam * hh * hh * hh * hh) * fsub;
      }
    }
    // along her: the leading end's form drag and the skin's friction, at the density at C
    if (K.drag && fsubSum > 0) {
      const u = v0, dC = -Xm[2], rho = rhoAt(sp, dC), share = fsubSum / n;
      const lead = u > 0 ? b.ends.fwd : b.ends.aft;
      const cdx = b.kind === 'whole' ? K.cdxWhole : (lead === 'torn' ? K.cdxTorn : (lead === 'none' ? 0 : K.cdxFaired));
      const au = Math.abs(u), re = (au > 0.5 ? au : 0.5) * b.cfL / K.nu, lg = C.log10(re) - 2, cf = 0.075 / (lg * lg) + K.dCf;
      Fx += -0.5 * rho * (cdx * b.Amax + cf * b.wet) * u * au * share;
      // the slender body's lift where the flow leaves a torn end: -|u| m'(end) c(end), at the end
      if (K.lift) {
        const trail = u > 0 ? (b.ends.aft === 'torn' ? 0 : -1) : (u < 0 ? (b.ends.fwd === 'torn' ? n - 1 : -1) : -1);
        if (trail >= 0) {
          const i = trail, xe = (trail === 0 ? b.x0 : b.x1) - cx, ex = b.ey[i] - cy, ez = b.eza[i] - cz;
          const de = -zAt(Xm, Rm, xe, ex, ez);
          if (de > 0) {
            const re2 = rhoAt(sp, de), m22 = b.ca22[i] * re2 * Math.PI * 0.25 * b.Ha[i] * b.Ha[i], m33 = b.ca33[i] * re2 * Math.PI * 0.25 * b.B[i] * b.B[i];
            const Vy = v1 + w2 * xe - w0 * ez, Vz = v2 + w0 * ex - w1 * xe;
            const fy = -au * m22 * Vy, fz = -au * m33 * Vz;
            Fy += fy; Fz += fz;
            Tx += ex * fz - ez * fy; Ty += -xe * fz; Tz += xe * fy;
          }
        }
      }
    }
    // the pocket's lift, at the density where it stands
    let Fa = 0, pax = 0, pay = 0, paz = 0;
    if (Vair > 0) {
      pax = b.air.p[0] - cx; pay = b.air.p[1] - cy; paz = b.air.p[2] - cz;
      const da = -zAt(Xm, Rm, pax, pay, paz);
      Fa = rhoAt(sp, da) * g * Vair;
    }
    // the bed: each slice whose lowest point is below the mud line (none while all of her is well clear of it)
    const bed = sp.bed;
    let inMud = false, capStatic = 0;
    const clear = Xm[2] - b.Rb > -bedDepth(sp, Xm[0], Xm[1]) + bed.tan * b.Rb + 1;
    if (clear) { for (let i = 0; i < n; i++) b.bury[i] = 0; }
    for (let i = 0; i < n && !clear; i++) {
      const o = b.polyOff[i], m = b.polyOff[i + 1] - o, xi = b.x[i] - cx, dx = b.dx[i];
      // the mud line under the slice's middle (its slope is under a degree: the same across one slice)
      const ex = b.ey[i] - cy, ez = b.ez[i] - cz;
      const Zbed = -bedDepth(sp, Xm[0] + Rm[0] * xi + Rm[1] * ex + Rm[2] * ez, Xm[1] + Rm[3] * xi + Rm[4] * ex + Rm[5] * ez);
      // the corners of its section at both its ends: how far each is in the mud; the deepest is the slice's burial, and
      // the mud acts at their centroid weighted by how far each is in (a point that moves smoothly as she settles, where
      // the lowest corner alone would jump from one bilge to the other as she rolls through level)
      let d = 0, sw = 0, swx = 0, swy = 0, swz = 0;
      for (let sx = -0.5; sx <= 0.5; sx += 1) {
        const xe = xi + sx * dx, base = Xm[2] + Rm[6] * xe - Zbed;
        for (let k = 0; k < m; k++) {
          const yk = b.polyY[o + k] - cy, zk = b.polyZ[o + k] - cz, dk = -(base + Rm[7] * yk + Rm[8] * zk);
          if (dk > 0) { sw += dk; swx += dk * xe; swy += dk * yk; swz += dk * zk; if (dk > d) d = dk; }
        }
      }
      if (!(d > 0)) { b.bury[i] = 0; continue; }
      const px = swx / sw, py = swy / sw, pz = swz / sw, Zl = Zbed - d;
      b.bury[i] = d; inMud = true;
      // the shadow of the slice's part in the mud [mine: Z5 refines it face by face]
      let shadow = Math.abs(Rm[8]) * dx * b.B[i] + Math.abs(Rm[7]) * dx * b.H[i];
      if ((i === 0 && Rm[6] > 0) || (i === n - 1 && Rm[6] < 0)) shadow += Math.abs(Rm[6]) * b.B[i] * b.H[i];
      const e = Math.abs(Rm[6]) * dx + K.ramp, Ab = shadow * (d < e ? d / e : 1);
      capStatic += bed.Nc * (bed.su0 + bed.suK * d) * Ab;
      // the point's velocity in the world
      const lx = v0 + w1 * pz - w2 * py, ly = v1 + w2 * px - w0 * pz, lz = v2 + w0 * py - w1 * px;
      const VX = Rm[0] * lx + Rm[1] * ly + Rm[2] * lz, VY = Rm[3] * lx + Rm[4] * ly + Rm[5] * lz, VZ = Rm[6] * lx + Rm[7] * ly + Rm[8] * lz;
      const vn = -VZ, sp2 = VX * VX + VY * VY + VZ * VZ, spd = Math.sqrt(sp2);
      const su = bed.su0 + bed.suK * d;
      const rate = spd / b.B[i];
      let rf = 1 + bed.lambda * C.log10((rate > bed.gref ? rate : bed.gref) / bed.gref);
      if (rf > bed.rfMax) rf = bed.rfMax;
      let q = rf * bed.Nc * su + (vn > 0 ? 0.5 * bed.cd * bed.rho * vn * vn : 0) + (bed.overburden ? (bed.rho - rhoAt(sp, -Zl)) * g * d : 0);
      let FXw, FYw, FZw;
      if (vn > 0) { const k = q * Ab / (spd > K.vReg ? spd : K.vReg); FXw = -k * VX; FYw = -k * VY; FZw = -k * VZ; }
      else { const hs = Math.sqrt(VX * VX + VY * VY), k = q * Ab / (hs > K.vReg ? hs : K.vReg); FXw = -k * VX; FYw = -k * VY; FZw = 0; }
      // into her axes by the middle's attitude
      const fx = Rm[0] * FXw + Rm[3] * FYw + Rm[6] * FZw, fy = Rm[1] * FXw + Rm[4] * FYw + Rm[7] * FZw, fz = Rm[2] * FXw + Rm[5] * FYw + Rm[8] * FZw;
      Mx += fx; My += fy; Mz += fz;
      Nx += py * fz - pz * fy; Ny += pz * fx - px * fz; Nz += px * fy - py * fx;
    }
    // the vertical forces into her axes: F = S0 r3, T = S1 x r3
    const cF = [cS0 * r3x, cS0 * r3y, cS0 * r3z], cT = [cSy * r3z - cSz * r3y, cSz * r3x - cSx * r3z, cSx * r3y - cSy * r3x];
    const sF = [sS0 * r3x, sS0 * r3y, sS0 * r3z], sT = [sSy * r3z - sSz * r3y, sSz * r3x - sSx * r3z, sSx * r3y - sSy * r3x];
    const aF = [Fa * r3x, Fa * r3y, Fa * r3z], aT = [Fa * (pay * r3z - paz * r3y), Fa * (paz * r3x - pax * r3z), Fa * (pax * r3y - pay * r3x)];
    out[0] = cF[0] + sF[0] + aF[0] + Fx + Mx; out[1] = cF[1] + sF[1] + aF[1] + Fy + My; out[2] = cF[2] + sF[2] + aF[2] + Fz + Mz;
    out[3] = cT[0] + sT[0] + aT[0] + Tx + Nx; out[4] = cT[1] + sT[1] + aT[1] + Ty + Ny; out[5] = cT[2] + sT[2] + aT[2] + Tz + Nz;
    if (pw) {
      pw.cons = cF[0] * v0 + cF[1] * v1 + cF[2] * v2 + cT[0] * w0 + cT[1] * w1 + cT[2] * w2;
      pw.surf = sF[0] * v0 + sF[1] * v1 + sF[2] * v2 + sT[0] * w0 + sT[1] * w1 + sT[2] * w2;
      pw.air = aF[0] * v0 + aF[1] * v1 + aF[2] * v2 + aT[0] * w0 + aT[1] * w1 + aT[2] * w2;
      pw.drag = Fx * v0 + Fy * v1 + Fz * v2 + Tx * w0 + Ty * w1 + Tz * w2;
      pw.mud = Mx * v0 + My * v1 + Mz * v2 + Nx * w0 + Ny * w1 + Nz * w2;
      pw.inMud = inMud; pw.fsub = fsubSum / n; pw.cap = capStatic;
    }
    return out;
  }

  // ================================================================ one sub-step: kick then drift, at the middle
  const WK = { R0: new Float64Array(9), R1: new Float64Array(9), Rm: new Float64Array(9), X1: [0, 0, 0], Xm: [0, 0, 0], q1: [1, 0, 0, 0], M: new Float64Array(36), Lw: new Float64Array(36), z: [0, 0, 0, 0, 0, 0], zn: [0, 0, 0, 0, 0, 0], nu: [0, 0, 0, 0, 0, 0], nun: [0, 0, 0, 0, 0, 0], F: [0, 0, 0, 0, 0, 0], pw: {} };
  // her centre of mass's speed through the water at velocities nu (her air taken out of her mass)
  function comSpeed(b, nu) {
    let mm = b.mass, mx = b.mc[0], my = b.mc[1], mz = b.mc[2];
    if (b.Vair > 0) { const ma = b.rhoRef * b.Vair; mm -= ma; mx -= ma * (b.air.p[0] - b.C[0]); my -= ma * (b.air.p[1] - b.C[1]); mz -= ma * (b.air.p[2] - b.C[2]); }
    const gx = mx / mm, gy = my / mm, gz = mz / mm;
    const vx = nu[0] + nu[4] * gz - nu[5] * gy, vy = nu[1] + nu[5] * gx - nu[3] * gz, vz = nu[2] + nu[3] * gy - nu[4] * gx;
    return Math.sqrt(vx * vx + vy * vy + vz * vz);
  }
  function subStep(b, sp, h) {
    const K = b.K, R0 = quatR(b.q, WK.R0), R1 = WK.R1, Rm = WK.Rm, X1 = WK.X1, Xm = WK.Xm, q1 = WK.q1, M = WK.M, z = WK.z, zn = WK.zn, nu = WK.nu, nun = WK.nun, Fo = WK.F, pw = WK.pw;
    const P0 = [b.P[0], b.P[1], b.P[2], b.Lm[0], b.Lm[1], b.Lm[2]], nu0 = b.nu.slice();
    // the pocket: it vents through its opening over the sub-step at the rate its start allows, then is squeezed by Boyle
    let a0 = 0, a1 = 0;
    if (b.spc) {
      // Z6's spaces (K.air 'spaces'): stepped at the sub-step's start, their air the pocket over it (it leaves her through
      // the spaces' own openings, not the pocket's vent); squeezed by Boyle to the sub-step's end as the pocket is
      spacesStep(b, sp, R0, h);
      a0 = a1 = b.air.a;
    } else if (b.air && b.air.a > 0) {
      a0 = b.air.a;
      const da = -(b.X[2] + R0[6] * (b.air.p[0] - b.C[0]) + R0[7] * (b.air.p[1] - b.C[1]) + R0[8] * (b.air.p[2] - b.C[2]));
      const pk = Math.max(pAt(sp, da), P_ATM), dp = rhoAt(sp, da) * GRAV * K.ventHead;
      const rate = b.vent > 0 ? K.ventCd * b.vent * Math.sqrt(2 * dp * RHO_AIR0 * pk / P_ATM) / RHO_AIR0 : 0;   // m3 a second at one atmosphere
      a1 = a0 - rate * h; if (a1 < 0) a1 = 0;
      // more air than her spaces hold at this pressure bubbles out below
      const amax = b.airMax * pk / P_ATM; if (a0 > amax) a0 = amax; if (a1 > amax) a1 = amax;
    }
    // the first guess: the last sub-step's rate
    for (let k = 0; k < 6; k++) z[k] = P0[k] + 0.5 * h * b.rate[k];
    // her pocket over the sub-step: its middle amount at the start's depth (a lag of half a sub-step), her mass with it
    let Vair = 0;
    if (b.air && (a0 > 0 || a1 > 0)) {
      b.air.a = 0.5 * (a0 + a1);
      Vair = airVolume(b, sp, -(b.X[2] + R0[6] * (b.air.p[0] - b.C[0]) + R0[7] * (b.air.p[1] - b.C[1]) + R0[8] * (b.air.p[2] - b.C[2])));
    }
    massWithAir(b, Vair, M);
    let it = 0, conv = false, dlast = Infinity, relax = 1;
    for (; it < K.iterMax; it++) {
      solve6(M, z, nu, WK.Lw);
      // drift: the attitude by the Cayley map of the middle's turning, the place by the middle's velocity
      const hx = 0.5 * h * nu[3], hy = 0.5 * h * nu[4], hz = 0.5 * h * nu[5], q = b.q;
      let w = q[0] - q[1] * hx - q[2] * hy - q[3] * hz, x = q[0] * hx + q[1] + q[2] * hz - q[3] * hy, y = q[0] * hy - q[1] * hz + q[2] + q[3] * hx, zq = q[0] * hz + q[1] * hy - q[2] * hx + q[3];
      const nq = 1 / Math.sqrt(w * w + x * x + y * y + zq * zq); q1[0] = w * nq; q1[1] = x * nq; q1[2] = y * nq; q1[3] = zq * nq;
      quatR(q1, R1);
      for (let k = 0; k < 9; k++) Rm[k] = 0.5 * (R0[k] + R1[k]);
      for (let r = 0; r < 3; r++) { X1[r] = b.X[r] + h * (Rm[r * 3] * nu[0] + Rm[r * 3 + 1] * nu[1] + Rm[r * 3 + 2] * nu[2]); Xm[r] = 0.5 * (b.X[r] + X1[r]); }
      loads(b, sp, nu, b.X, R0, X1, R1, Xm, Rm, Vair, Fo, pw);
      // kick: the middle momenta from the rates at the middle (Kirchhoff's form)
      const Px = z[0], Py = z[1], Pz = z[2], Lx = z[3], Ly = z[4], Lz = z[5], v0 = nu[0], v1 = nu[1], v2 = nu[2], w0 = nu[3], w1 = nu[4], w2 = nu[5];
      const r0 = Py * w2 - Pz * w1 + Fo[0], r1 = Pz * w0 - Px * w2 + Fo[1], r2 = Px * w1 - Py * w0 + Fo[2];
      const r3 = Ly * w2 - Lz * w1 + Py * v2 - Pz * v1 + Fo[3], r4 = Lz * w0 - Lx * w2 + Pz * v0 - Px * v2 + Fo[4], r5 = Lx * w1 - Ly * w0 + Px * v1 - Py * v0 + Fo[5];
      b.rate[0] = r0; b.rate[1] = r1; b.rate[2] = r2; b.rate[3] = r3; b.rate[4] = r4; b.rate[5] = r5;
      for (let k = 0; k < 6; k++) zn[k] = P0[k] + 0.5 * h * b.rate[k];
      solve6(M, zn, nun, WK.Lw);
      let dmax = 0, vmax = 0;
      for (let k = 0; k < 6; k++) { const d = Math.abs(nun[k] - nu[k]); if (d > dmax) dmax = d; const a = Math.abs(nu[k]); if (a > vmax) vmax = a; }
      if (dmax <= K.tol * (1 + vmax)) { for (let k = 0; k < 6; k++) z[k] = zn[k]; conv = true; it++; break; }
      // an iteration that does not shrink (a stiff mud, a law that switches) is relaxed, more each time it fails
      if (dmax >= dlast) relax *= 0.5;
      dlast = dmax;
      for (let k = 0; k < 6; k++) z[k] += relax * (zn[k] - z[k]);
    }
    b.iters += it; b.subs++; if (!conv) b.unconv++;
    // the works over the sub-step: the middle's power times h (the forces of the last pass, the velocities they met)
    b.W.cons += h * pw.cons; b.W.surf += h * pw.surf; b.W.air += h * pw.air; b.W.drag += h * pw.drag; b.W.mud += h * pw.mud;
    // the end of the sub-step
    for (let k = 0; k < 3; k++) { b.P[k] = P0[k] + h * b.rate[k]; b.Lm[k] = P0[3 + k] + h * b.rate[3 + k]; b.X[k] = X1[k]; }
    b.q[0] = q1[0]; b.q[1] = q1[1]; b.q[2] = q1[2]; b.q[3] = q1[3];
    if (b.air) b.air.a = a1;
    b.inMud = pw.inMud; b.fsub = pw.fsub; b.cap = pw.cap;
    // her first touch of the bed: how she arrived (her speed and energy at the start of the sub-step that touched)
    if (pw.inMud && !b.touched) {
      b.touched = true;
      b.arrival = { speed: comSpeed(b, nu0), energy: 0.5 * (P0[0] * nu0[0] + P0[1] * nu0[1] + P0[2] * nu0[2] + P0[3] * nu0[3] + P0[4] * nu0[4] + P0[5] * nu0[5]), depth: bedDepth(sp, b.X[0], b.X[1]) };
    }
    // her velocities at the end, with her mass at the end
    const Ve = b.air && a1 > 0 ? airVolume(b, sp, -(b.X[2] + R1[6] * (b.air.p[0] - b.C[0]) + R1[7] * (b.air.p[1] - b.C[1]) + R1[8] * (b.air.p[2] - b.C[2]))) : 0;
    b.Vair = Ve;
    massWithAir(b, Ve, M);
    solve6(M, [b.P[0], b.P[1], b.P[2], b.Lm[0], b.Lm[1], b.Lm[2]], b.nu, WK.Lw);
    // her first touch of the bed (K.strikeAdded 0): the water she drags flows on, its momentum shed and its energy with
    // it (the following water); her velocity is kept. Out of the mud again she takes it up from rest, her momenta kept
    if (!K.strikeAdded && pw.inMud !== b.shed) {
      const ke = () => 0.5 * (b.P[0] * b.nu[0] + b.P[1] * b.nu[1] + b.P[2] * b.nu[2] + b.Lm[0] * b.nu[3] + b.Lm[1] * b.nu[4] + b.Lm[2] * b.nu[5]);
      const k0 = ke();
      b.shed = pw.inMud;
      massWithAir(b, Ve, M);
      if (b.shed) for (let r = 0; r < 3; r++) { let s = 0, t = 0; for (let k = 0; k < 6; k++) { s += M[r * 6 + k] * b.nu[k]; t += M[(3 + r) * 6 + k] * b.nu[k]; } b.P[r] = s; b.Lm[r] = t; }
      else solve6(M, [b.P[0], b.P[1], b.P[2], b.Lm[0], b.Lm[1], b.Lm[2]], b.nu, WK.Lw);
      b.W.shed += ke() - k0;
      b.rate = [0, 0, 0, 0, 0, 0];
    }
  }

  // ================================================================ placing a body
  // Her pose in the fall's frame and her velocities: R (row-major 3 x 3, her axes to the world's), Xc (where C is), and
  // the velocity of C and her turning, both in her axes. Her momenta follow from her mass with her air.
  function setState(b, sp, R, Xc, vC, om) {
    b.q = quatOfR(R); b.X = Xc.slice();
    const Rq = quatR(b.q, new Float64Array(9));
    if (b.air) {
      const da = -(Xc[2] + Rq[6] * (b.air.p[0] - b.C[0]) + Rq[7] * (b.air.p[1] - b.C[1]) + Rq[8] * (b.air.p[2] - b.C[2]));
      // the air as the core leaves it: its volume kept at the hand-over, at the pressure of its depth
      if (!(b.air.a > 0)) b.air.a = b.air.V0 * Math.max(pAt(sp, da), P_ATM) / P_ATM;
      b.Vair = airVolume(b, sp, da);
    } else b.Vair = 0;
    const M = massWithAir(b, b.Vair, new Float64Array(36)), nu = [vC[0], vC[1], vC[2], om[0], om[1], om[2]];
    b.nu = nu.slice();
    for (let r = 0; r < 3; r++) { let s = 0, t = 0; for (let k = 0; k < 6; k++) { s += M[r * 6 + k] * nu[k]; t += M[(3 + r) * 6 + k] * nu[k]; } b.P[r] = s; b.Lm[r] = t; }
    b.rate = [0, 0, 0, 0, 0, 0];
  }
  // the extent of a body in the world's Z: [lowest, highest] (its sections' corners at its slices' ends)
  function extent(b, R, Xc) {
    let lo = 1e300, hi = -1e300;
    for (let i = 0; i < b.n; i++) {
      const o = b.polyOff[i], m = b.polyOff[i + 1] - o, xe = Math.abs(R[6]) * 0.5 * b.dx[i], base = Xc[2] + R[6] * (b.x[i] - b.C[0]);
      for (let k = 0; k < m; k++) { const z = base + R[7] * (b.polyY[o + k] - b.C[1]) + R[8] * (b.polyZ[o + k] - b.C[2]); if (z - xe < lo) lo = z - xe; if (z + xe > hi) hi = z + xe; }
    }
    return [lo, hi];
  }

  // ================================================================ the fall
  // make(sea, specs, opts): a fall from piece specs (piece() or a test's), each placed with opts.poses[i] or later by
  // place(); opts: { rule, t0, dt, at, K (the step's), breakAt }
  function make(sp, specs, opts) {
    opts = opts || {};
    const fall = { v: 3, rule: opts.rule || 'flag', t0: opts.t0 || 0, k: 0, t: opts.t0 || 0, done: false, sea: sp, at: opts.at || { X: 0, Y: 0, psi: 0 }, breakAt: opts.breakAt || null, pieces: [], debris: [], events: [], lights: null,
      eng: { dt: opts.dt || C.DEFAULT_PARAMS.dt, bodies: [] } };
    for (const s of specs) {
      const b = body(s, sp);
      fall.eng.bodies.push(b);
      fall.pieces.push({ id: s.id || b.kind, x0: b.x0, x1: b.x1, r: [0, 0, 0], q: [1, 0, 0, 0], v: [0, 0, 0], om: [0, 0, 0], state: 'falling', depth: 0, speed: 0, air: 0, bury: new Float64Array(b.n) });
    }
    return fall;
  }
  // place(fall, i, pose): { R or pitch/roll (the core's convention), r (where her ship-frame origin is) or top (the
  //   height of her highest point, the horizontal place of C at X, Y), vC/om (her velocities in her axes, default 0) }
  function place(fall, i, pose) {
    const b = fall.eng.bodies[i], sp = fall.sea;
    if (b.K.air === 'spaces') throw new Error('K.air \'spaces\' is begin()\'s alone (the hand-over\'s spaces)');
    const R = pose.R ? Array.from(pose.R) : poseR(pose.pitch || 0, pose.roll || 0);
    let Xc;
    if (pose.r) Xc = [pose.r[0] + R[0] * b.C[0] + R[1] * b.C[1] + R[2] * b.C[2], pose.r[1] + R[3] * b.C[0] + R[4] * b.C[1] + R[5] * b.C[2], pose.r[2] + R[6] * b.C[0] + R[7] * b.C[1] + R[8] * b.C[2]];
    else { Xc = [pose.X || 0, pose.Y || 0, 0]; const ex = extent(b, R, Xc); Xc[2] = (pose.top === undefined ? -1 : pose.top) - ex[1]; }
    b.shed = false; b.inMud = false;
    setState(b, sp, R, Xc, pose.vC || [0, 0, 0], pose.om || [0, 0, 0]);
    b.state = 'falling'; b.tSlow = 0; b.struck = false; b.touched = false; b.arrival = null; b.wentUnder = false; b.bury.fill(0);
    b.W = { drag: 0, mud: 0, cons: 0, surf: 0, air: 0, shed: 0, freeze: 0 };
    sync(fall, i, true);
  }

  // the contract's fields of piece i from its body
  const RS = new Float64Array(9);
  function sync(fall, i, first) {
    const b = fall.eng.bodies[i], p = fall.pieces[i], sp = fall.sea, R = quatR(b.q, RS), c = b.C, nu = b.nu;
    p.r = [b.X[0] - (R[0] * c[0] + R[1] * c[1] + R[2] * c[2]), b.X[1] - (R[3] * c[0] + R[4] * c[1] + R[5] * c[2]), b.X[2] - (R[6] * c[0] + R[7] * c[1] + R[8] * c[2])];
    p.q = b.q.slice();
    // the ship-frame origin's velocity: v_C + w x (0 - c) = v_C - w x c
    p.v = [nu[0] - (nu[4] * c[2] - nu[5] * c[1]), nu[1] - (nu[5] * c[0] - nu[3] * c[2]), nu[2] - (nu[3] * c[1] - nu[4] * c[0])];
    p.om = [nu[3], nu[4], nu[5]];
    if (p.bury !== b.bury) p.bury.set(b.bury);
    const ex = extent(b, R, b.X);
    p.depth = -ex[0];
    // her centre of mass, with her air: the speed through the water
    let mm = b.mass, mx = b.mc[0], my = b.mc[1], mz = b.mc[2];
    if (b.Vair > 0) { const ma = b.rhoRef * b.Vair; mm -= ma; mx -= ma * (b.air.p[0] - c[0]); my -= ma * (b.air.p[1] - c[1]); mz -= ma * (b.air.p[2] - c[2]); }
    const gx = mx / mm, gy = my / mm, gz = mz / mm;
    const vx = nu[0] + nu[4] * gz - nu[5] * gy, vy = nu[1] + nu[5] * gx - nu[3] * gz, vz = nu[2] + nu[3] * gy - nu[4] * gx;
    p.speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
    p.air = b.Vair || 0;
    p.state = b.state;
    b.top = ex[1]; b.low = ex[0];
    return p;
  }
  // her kinetic energy with the water in her and the water she drags (J), and her potential: her structure's weight,
  // and the water in her and the sea about her through the column (J; while she is wholly under)
  function energy(fall, i) {
    const b = fall.eng.bodies[i], sp = fall.sea, R = quatR(b.q, new Float64Array(9)), cx = b.C[0], cy = b.C[1], cz = b.C[2];
    const KE = 0.5 * (b.P[0] * b.nu[0] + b.P[1] * b.nu[1] + b.P[2] * b.nu[2] + b.Lm[0] * b.nu[3] + b.Lm[1] * b.nu[4] + b.Lm[2] * b.nu[5]);
    const z = (px, py, pz) => b.X[2] + R[6] * px + R[7] * py + R[8] * pz;
    let U = 0;
    for (let i2 = 0; i2 < b.n; i2++) {
      const xi = b.x[i2] - cx;
      U += b.ms[i2] * GRAV * z(b.gx[i2] - cx, b.gy[i2] - cy, b.gz[i2] - cz);
      U += GRAV * b.Venv[i2] * phiAt(sp, -z(xi, b.ey[i2] - cy, b.ez[i2] - cz));
      if (b.Vf[i2] > 0) U -= GRAV * b.Vf[i2] * phiAt(sp, -z(xi, b.fy[i2] - cy, b.fz[i2] - cz));
    }
    return { KE, U };
  }

  // one dt for every piece; events; done. While a joint holds (fall.eng.joint: the 'break' hand-over with a hinge), its
  // two bodies take each sub-step together (subStepPair), at the finer of their two counts; once it lets go, the rest
  // of that dt's sub-steps, and every dt after, are each body's own, as for any piece
  function advance(fall) {
    const sp = fall.sea, dt = fall.eng.dt, J = fall.eng.joint;
    if (J && !J.released) {
      const bb = fall.eng.bodies[J.ib], bs = fall.eng.bodies[J.is];
      const ns = Math.max(subsOf(fall, J.ib, dt), subsOf(fall, J.is, dt)), h = dt / ns;
      for (let s = 0; s < ns; s++) {
        if (!J.released) subStepPair(fall, h, s);
        else { if (bb.state !== 'at rest') subStep(bb, sp, h); if (bs.state !== 'at rest') subStep(bs, sp, h); }
      }
      if (bb.state !== 'at rest') afterSteps(fall, J.ib, dt);
      if (bs.state !== 'at rest') afterSteps(fall, J.is, dt);
      for (let i = 0; i < fall.eng.bodies.length; i++) if (i !== J.ib && i !== J.is) stepOne(fall, i, dt);
    } else for (let i = 0; i < fall.eng.bodies.length; i++) stepOne(fall, i, dt);
    // B4's gate 2: the tear's openings at the joint's state at the dt's end (idempotent; the release seen here at once)
    if (J) for (const b of fall.eng.bodies) if (b.spc && b.spc.tear) tearStep(b.spc);
    fall.k++; fall.t = fall.t0 + fall.k * dt;
    if (fall.lights) lightsAt(fall);
    let all = true; for (const b of fall.eng.bodies) if (b.state !== 'at rest') { all = false; break; }
    fall.done = all;
    return fall;
  }
  // near the bed (or in it) the step is finer: within bedNear m, and the way she makes in a step, of the bed under her
  function subsOf(fall, i, dt) {
    const b = fall.eng.bodies[i], K = b.K, sp = fall.sea;
    const reach = (fall.pieces[i].speed + 1) * dt + K.bedNear + sp.bed.tan * b.Rb;
    const nearBed = b.inMud || (-b.low) > bedDepth(sp, b.X[0], b.X[1]) - reach;
    return nearBed ? K.subBed : K.sub;
  }
  function stepOne(fall, i, dt) {
    const b = fall.eng.bodies[i];
    if (b.state === 'at rest') return;
    const ns = subsOf(fall, i, dt), h = dt / ns;
    for (let s = 0; s < ns; s++) subStep(b, fall.sea, h);
    afterSteps(fall, i, dt);
  }
  // after a dt's sub-steps: what she is now, and its events
  function afterSteps(fall, i, dt) {
    {
      const b = fall.eng.bodies[i], K = b.K;
      const p = sync(fall, i);
      if (b.spc) spacesReport(fall, i);
      if (b.inMud) {
        if (!b.struck) { b.struck = true; const a = b.arrival; fall.events.push({ t: fall.t + dt, id: 'strike', piece: p.id, depth: a.depth, energy: a.energy, speed: a.speed }); }
        // slower than vRest everywhere for tRest: held by the mud
        let vmax = 0;
        for (let k = 0; k < b.n; k++) {
          const px = b.x[k] - b.C[0], py = b.ey[k] - b.C[1], pz = b.ez[k] - b.C[2], nu = b.nu;
          const lx = nu[0] + nu[4] * pz - nu[5] * py, ly = nu[1] + nu[5] * px - nu[3] * pz, lz = nu[2] + nu[3] * py - nu[4] * px;
          const s2 = lx * lx + ly * ly + lz * lz; if (s2 > vmax) vmax = s2;
        }
        b.tSlow = Math.sqrt(vmax) < K.vRest && b.cap > weightInWater(b) * GRAV - GRAV * fall.sea.rho[0] * (b.Vair || 0) ? b.tSlow + dt : 0;
        b.state = 'striking';
        if (b.tSlow >= K.tRest - 1e-9) {
          const KE = energy(fall, i).KE;
          b.W.freeze = KE; b.W.mud -= KE;
          b.P = [0, 0, 0]; b.Lm = [0, 0, 0]; b.nu = [0, 0, 0, 0, 0, 0]; b.rate = [0, 0, 0, 0, 0, 0];
          b.state = 'at rest';
          sync(fall, i);
          fall.events.push({ t: fall.t + dt, id: 'rest', piece: p.id, depth: p.depth, energy: -b.W.mud, speed: 0 });
        }
      } else if (b.top > 0) b.state = 'afloat';
      else {
        if (!b.wentUnder) { b.wentUnder = true; fall.events.push({ t: fall.t + dt, id: 'under', piece: p.id, depth: p.depth, energy: energy(fall, i).KE, speed: p.speed }); }
        // under while her air still bears a tenth of her weight in water [mine]; falling after
        const wIn = weightInWater(b);
        b.state = b.Vair > 0 && fall.sea.rho[0] * b.Vair > 0.1 * wIn ? 'under' : 'falling';
      }
      p.state = b.state;
    }
  }
  // her weight in water, kg (her structure less the sea's weight of her solids, at the column's mean density)
  function weightInWater(b) {
    let m = 0, vs = 0; for (let i = 0; i < b.n; i++) { m += b.ms[i]; vs += b.Venv[i] - b.Vf[i]; }
    return m - b.rhoRef * vs;
  }

  // ================================================================ the joint (Z6 inside B4)
  // docs/DESIGN_free_body_air_by_space_v1_1 (section 1) and v1_2 (section 1); proved on rigid bodies in
  // docs/research/experiments/e68_z6_joint_rigs.js. While the ligament holds, the bow and the stern are one pin on the
  // hinge's axis at the break, (xb, 0, zNA) in the ship frame (both pieces keep the parent's ship frame): the hinge's
  // angle theta is free about her own y, the five other relative freedoms are locked. Both bodies take each sub-step
  // together, and the constraint's force is found at the sub-step's middle inside the midpoint's iterations, so that the
  // five locked velocities of the middle agree and the force does no work there. The hinge's moment is its law: the
  // intact section's line from the moment the joint carried at the hand-over, S.hinge's backbone at its furthest angle,
  // its unloading line below (S.hinge.unload: the ligament springs back, the torn part never mends), from theta at the
  // sub-step's start, as an equal and opposite pair about the hinge's axis. The joint lets go at the first sub-step
  // where its own force passes what still holds (S.hinge: its tension along her above Nt, or its shear across her above
  // Vs); that sub-step is run again with the bodies free. It is built only when a hand-over asks for it (begin's
  // opts.hinge); without it nothing here runs, and every fall is as before, to the bit.
  // The joint's state, fall.eng.joint (the engine's own): { H (S.hinge at the break, in its sense), xb, sense (+1
  // hogging: theta opens the deck, the bow's head down against the stern; -1 sagging), ib, is (the bodies: the bow, the
  // stern), theta, thMax, thY, yielded, M0 (the moment at the hand-over, closing positive), released, release (what let
  // go: t, theta, by, N/Nt, |V|/Vs), maxN, maxV (the largest ratios while it held), W (the hinge's own work, J: the
  // tear's, with its elastic returns), drift (the largest drift projected out), demand0 }
  const dot6 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3] + a[4] * b[4] + a[5] * b[5];
  const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const unit3 = (a) => { const n = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]); return [a[0] / n, a[1] / n, a[2] / n]; };
  const RTv3 = (R, v) => [R[0] * v[0] + R[3] * v[1] + R[6] * v[2], R[1] * v[0] + R[4] * v[1] + R[7] * v[2], R[2] * v[0] + R[5] * v[1] + R[8] * v[2]];
  const Rv3 = (R, v) => [R[0] * v[0] + R[1] * v[1] + R[2] * v[2], R[3] * v[0] + R[4] * v[1] + R[5] * v[2], R[6] * v[0] + R[7] * v[1] + R[8] * v[2]];
  // Gaussian elimination with partial pivoting, fixed order (n <= 6)
  function solveN(K, rhs) {
    const n = rhs.length, A = K.map((r, i) => r.slice().concat([rhs[i]]));
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      if (p !== c) { const t = A[p]; A[p] = A[c]; A[c] = t; }
      for (let r = c + 1; r < n; r++) { const f = A[r][c] / A[c][c]; for (let j = c; j <= n; j++) A[r][j] -= f * A[c][j]; }
    }
    const x = new Array(n).fill(0);
    for (let r = n - 1; r >= 0; r--) { let s = A[r][n]; for (let j = r + 1; j < n; j++) s -= A[r][j] * x[j]; x[r] = s / A[r][r]; }
    return x;
  }
  const hingeAt = (J, s) => J.H.at(s > 0 ? s : 0);
  // the hinge's moment, closing positive, at theta, from its state: pure (commitHinge moves the state)
  // hinge.yieldOn (J.yieldOn; Z1 with B1+B2, 2026-11-24, on the coordinator's 3.6 % at the hand-over): 'resultant', the
  // default since join 22 (D116, below); 'moment' (the hinge before join 22, a what-if) yields on M = Mu alone; 'circle'
  // (a what-if) yields on the onset's own interaction,
  // (M/Mu)^2 + (V/Vs)^2 = 1: the moment capacity under the joint's shear (its last solve's; the hand-over's demand at the
  // first) is Mu sqrt(1 - (V/Vs)^2), and the backbone is scaled by the same factor with the ligament's Vs(s) as it tears.
  // The factor is the hinge's own, S.hinge's under(s, V) (B1+B2, core/readers/section.js), at the same abscissa as hingeAt.
  // 'resultant' (B1+B2's e124, 2026-11-24, on the list's axis): B2's onset judges the moment about the world's
  // horizontal axis across her, the resultant of M cos(list) about her y and M sin(list) about her z with her strength
  // the same both ways; the hinge bends about her y and its pin locks her relative yaw. So it yields on the resultant of
  // its own bending moments on the same circle, sqrt(m_y^2 + m_z^2) = Mu under(s, V): its capacity about her y is
  // Mu sqrt(1 - (V/Vs(s))^2 - (m_z/Mu)^2), m_z the locked yaw's moment (the joint's e3 row; its relative roll, e1, is
  // torsion and stays out), 0 past it: S.hinge's under(s, V, Mz) (B1+B2, 9ea7928). Its backbone stays about her y
  function shearShare(J, s) {
    if (J.yieldOn !== 'circle' && J.yieldOn !== 'resultant') return 1;
    const f0 = J.force ? J.force : J.demand0, ss = s > 0 ? s : 0, V = f0 ? f0.V : 0;
    return J.yieldOn === 'circle' ? J.H.under(ss, V) : J.H.under(ss, V, f0 && f0.Mz ? f0.Mz : 0);
  }
  function hingeLaw(J, th) {
    const Mu = J.H.Mu * shearShare(J, 0), k0 = J.H.k0;
    if (!J.yielded) { const m = J.M0 + k0 * th; if (m < Mu) return { m, yielded: false }; }
    // it yields where the intact line reaches Mu (under 'circle', the shear's share of it); at once (thY 0) when the
    // hand-over already asks more
    const thY = J.yielded ? J.thY : Math.max(0, (Mu - J.M0) / k0), thMax = Math.max(J.yielded ? J.thMax : thY, th);
    if (th >= thMax) return { m: hingeAt(J, th - thY).M * shearShare(J, th - thY), yielded: true, thY, thMax };
    return { m: J.H.unload(thMax - thY, th - thY).M * shearShare(J, thMax - thY), yielded: true, thY, thMax };
  }
  function commitHinge(J, th) { const r = hingeLaw(J, th); if (r.yielded) { J.yielded = true; J.thY = r.thY; J.thMax = r.thMax; } return r.m; }
  // B4's gate 2 (docs/DESIGN_B4_Z6_the_break_from_the_onset_gates_1_2_v1_2026-11-23.md): the tear's openings to the sea,
  // m2 a space in the core's node order [port below E, port above E, stbd below E, stbd above E], and their spans (m
  // above the keel), at the joint's state, by the hinge law's own angle as hingeLaw reads it: none before it yields; on
  // its backbone at theta - thY while loading; on its unloading line back from thMax (its spans then thMax's)
  function tearAt(J) {
    if (!J.yielded) return { open: [0, 0, 0, 0], span: [null, null, null, null] };
    const th = J.theta, top = hingeAt(J, J.thMax - J.thY);
    return th >= J.thMax ? hingeAt(J, th - J.thY) : { open: J.H.unload(J.thMax - J.thY, th - J.thY).open, span: top.span };
  }
  // under the spaces with the joint: while it holds, the broken spaces open to the sea only through the tear, each
  // piece's half of each space at the cut over its share of the space's room [bet: B1+B2's "your call"]; the cut's faces
  // stand shut. At the release they open, and the tear's last openings stand (tearStep, from spacesStep)
  function tearBegin(fall, J) {
    const B = fall.eng.bodies, room = new Map();
    for (const b of B) if (b.spc) for (const op of b.spc.ops) if (op.kind === 'cut') { const n = b.spc.sp.node[op.a]; room.set(n, (room.get(n) || 0) + b.spc.sp.V[op.a]); }
    for (const b of B) {
      if (!b.spc) continue;
      const S = b.spc, cut = [], tear = [];
      for (let i = 0, n0 = S.ops.length; i < n0; i++) {
        const op = S.ops[i];
        if (op.kind !== 'cut') continue;
        op.open = false; cut.push(i);
        const n = S.sp.node[op.a];
        S.ops.push({ c: -1, kind: 'tear', a: op.a, b: -1, px: op.px, py: op.py, pz: op.pz, nx: op.nx, ny: 0, nz: 0, A: 0, L: op.L, Cd: op.Cd, open: false });
        tear.push({ i: S.ops.length - 1, q: ((n >> 1) & 1) * 2 + (n & 1), share: S.sp.V[op.a] / room.get(n) });
      }
      S.tear = { J, cut, tear, released: false };
    }
    for (const b of B) if (b.spc) tearStep(b.spc);
  }
  function tearStep(S) {
    const T = S.tear, J = T.J;
    if (T.released) return;
    if (J.released) { for (const i of T.cut) S.ops[i].open = true; T.released = true; return; }
    const at = tearAt(J);
    for (const t of T.tear) {
      const op = S.ops[t.i], sp = at.span[t.q];
      op.A = (at.open[t.q] || 0) * t.share; op.open = op.A > 0;
      if (sp) { op.pz = 0.5 * (sp[0] + sp[1]); op.L = sp[1] - sp[0]; }
    }
  }
  // where the backbone stands (its abscissa) and the pin's height there: the neutral axis the parts turn about
  const backbone = (J) => (J.yielded ? Math.max(0, J.thMax - J.thY) : 0);
  const pinZ = (J) => hingeAt(J, backbone(J)).zNA;
  // the joint's rows at the bodies' attitudes Rb, Rs (row-major): each 12 long, [bow linear, bow angular, stern linear,
  // stern angular] in each body's own axes; the pin's three (along the world's axes), the relative roll and yaw (about
  // e1, e3), and with six the hinge's own (theta-dot, sense applied). e1 along her (the bodies' mean x), e2 the hinge's
  // axis (the bow's y), e3 = e1 x e2, all in the world
  function jointRows(J, bb, bs, Rb, Rs, six) {
    const zp = pinZ(J), rb = [J.xb - bb.C[0], -bb.C[1], zp - bb.C[2]], rs = [J.xb - bs.C[0], -bs.C[1], zp - bs.C[2]];
    const e2 = unit3([Rb[1], Rb[4], Rb[7]]), e1 = unit3([Rb[0] + Rs[0], Rb[3] + Rs[3], Rb[6] + Rs[6]]), e3 = unit3(crs(e1, e2));
    const rows = [];
    for (let k = 0; k < 3; k++) {
      // u_k . R (v + w x r) = a . v + w . (r x a), with a the row k of R
      const ab = [Rb[3 * k], Rb[3 * k + 1], Rb[3 * k + 2]], as = [Rs[3 * k], Rs[3 * k + 1], Rs[3 * k + 2]], cb = crs(rb, ab), cs = crs(rs, as);
      rows.push([ab[0], ab[1], ab[2], cb[0], cb[1], cb[2], -as[0], -as[1], -as[2], -cs[0], -cs[1], -cs[2]]);
    }
    const ax = six ? [e1, e3, e2] : [e1, e3];
    for (let a = 0; a < ax.length; a++) {
      const e = ax[a], sg = a === 2 ? J.sense : 1, gb = RTv3(Rb, e), gs = RTv3(Rs, e);
      rows.push([0, 0, 0, sg * gb[0], sg * gb[1], sg * gb[2], 0, 0, 0, -sg * gs[0], -sg * gs[1], -sg * gs[2]]);
    }
    return { rows, e1, e2, e3, rb, rs };
  }
  // K = J M^-1 J^T over both bodies (M each body's own 6 x 6, with her added mass and her air)
  function jointK(rows, Mb, Ms, Lw) {
    const Yb = rows.map(r => solve6(Mb, r.slice(0, 6), [0, 0, 0, 0, 0, 0], Lw)), Ys = rows.map(r => solve6(Ms, r.slice(6, 12), [0, 0, 0, 0, 0, 0], Lw));
    return rows.map(ri => rows.map((rj, j) => dot6(ri.slice(0, 6), Yb[j]) + dot6(ri.slice(6, 12), Ys[j])));
  }
  // Kirchhoff's rates from the momenta z, the velocities nu and the loads F (as subStep has them)
  function kirchhoff(z, nu, F, out) {
    const Px = z[0], Py = z[1], Pz = z[2], Lx = z[3], Ly = z[4], Lz = z[5], v0 = nu[0], v1 = nu[1], v2 = nu[2], w0 = nu[3], w1 = nu[4], w2 = nu[5];
    out[0] = Py * w2 - Pz * w1 + F[0]; out[1] = Pz * w0 - Px * w2 + F[1]; out[2] = Px * w1 - Py * w0 + F[2];
    out[3] = Ly * w2 - Lz * w1 + Py * v2 - Pz * v1 + F[3]; out[4] = Lz * w0 - Lx * w2 + Pz * v0 - Px * v2 + F[4]; out[5] = Lx * w1 - Ly * w0 + Px * v1 - Py * v0 + F[5];
    return out;
  }
  // the moment the joint carries now to hold theta (closing positive), from one locked solve at the bodies' state
  function jointDemand(fall, J) {
    const sp = fall.sea, B = [fall.eng.bodies[J.ib], fall.eng.bodies[J.is]], Lw = new Float64Array(36);
    const S = B.map(b => {
      const R = quatR(b.q, new Float64Array(9)), M = massWithAir(b, b.Vair || 0, new Float64Array(36)), F = [0, 0, 0, 0, 0, 0];
      loads(b, sp, b.nu, b.X, R, b.X, R, b.X, R, b.Vair || 0, F, {});
      const z = [b.P[0], b.P[1], b.P[2], b.Lm[0], b.Lm[1], b.Lm[2]], r = kirchhoff(z, b.nu, F, [0, 0, 0, 0, 0, 0]);
      return { R, M, r, a: solve6(M, r, [0, 0, 0, 0, 0, 0], Lw) };
    });
    const ax = jointRows(J, B[0], B[1], S[0].R, S[1].R, true), K = jointK(ax.rows, S[0].M, S[1].M, Lw);
    const lam = solveN(K, ax.rows.map(row => -(dot6(row.slice(0, 6), S[0].a) + dot6(row.slice(6, 12), S[1].a))));
    const F = [lam[0], lam[1], lam[2]];
    return { M0: -lam[5], N: -(F[0] * ax.e1[0] + F[1] * ax.e1[1] + F[2] * ax.e1[2]), V: F[0] * ax.e3[0] + F[1] * ax.e3[1] + F[2] * ax.e3[2], L: F[0] * ax.e2[0] + F[1] * ax.e2[1] + F[2] * ax.e2[2], Mz: lam[4] };
  }
  // the hinge's angle from the two attitudes: the bow's against the stern's, about the stern's y
  function jointTheta(J, bb, bs) {
    const Rb = quatR(bb.q, new Float64Array(9)), Rs = quatR(bs.q, new Float64Array(9));
    const r20 = Rs[2] * Rb[0] + Rs[5] * Rb[3] + Rs[8] * Rb[6], r00 = Rs[0] * Rb[0] + Rs[3] * Rb[3] + Rs[6] * Rb[6];
    return J.sense * C.atan2(-r20, r00);
  }
  // the five locked freedoms' drift at the bodies' places: the pin's gap (m, world) and the relative roll and yaw (rad)
  function jointError(J, bb, bs) {
    const Rb = quatR(bb.q, new Float64Array(9)), Rs = quatR(bs.q, new Float64Array(9)), ax = jointRows(J, bb, bs, Rb, Rs, false);
    const pb = Rv3(Rb, ax.rb), ps = Rv3(Rs, ax.rs), gap = [bb.X[0] + pb[0] - bs.X[0] - ps[0], bb.X[1] + pb[1] - bs.X[1] - ps[1], bb.X[2] + pb[2] - bs.X[2] - ps[2]];
    // the bow's attitude against the stern's turned by theta about the stern's y: E = Rb (Rs Ry)^T, its small rotation
    const th = J.sense * jointTheta(J, bb, bs), c = C.cos(th), s = C.sin(th);
    const T = [Rs[0] * c - Rs[2] * s, Rs[1], Rs[0] * s + Rs[2] * c, Rs[3] * c - Rs[5] * s, Rs[4], Rs[3] * s + Rs[5] * c, Rs[6] * c - Rs[8] * s, Rs[7], Rs[6] * s + Rs[8] * c];
    const E = (i, j) => Rb[3 * i] * T[3 * j] + Rb[3 * i + 1] * T[3 * j + 1] + Rb[3 * i + 2] * T[3 * j + 2];
    const phi = [(E(2, 1) - E(1, 2)) / 2, (E(0, 2) - E(2, 0)) / 2, (E(1, 0) - E(0, 1)) / 2];
    return { ax, Rb, Rs, c: [gap[0], gap[1], gap[2], phi[0] * ax.e1[0] + phi[1] * ax.e1[1] + phi[2] * ax.e1[2], phi[0] * ax.e3[0] + phi[1] * ax.e3[1] + phi[2] * ax.e3[2]] };
  }
  // the drift projected out, weighted by each body's own mass (one Newton step, twice); places and attitudes only. What
  // that moves is kept: the largest drift met (drift), the largest left after (resid), and the potential energy the
  // move made (Wproj, J: the identity counts it)
  function jointProject(fall, J, bb, bs) {
    const Lw = new Float64Array(36), U0 = energy(fall, J.ib).U + energy(fall, J.is).U;
    for (let it = 0; it < 2; it++) {
      const e = jointError(J, bb, bs), Mb = massWithAir(bb, bb.Vair || 0, new Float64Array(36)), Ms = massWithAir(bs, bs.Vair || 0, new Float64Array(36));
      J.drift = Math.max(J.drift, Math.sqrt(e.c[0] * e.c[0] + e.c[1] * e.c[1] + e.c[2] * e.c[2]));
      const l = solveN(jointK(e.ax.rows, Mb, Ms, Lw), e.c.map(v => -v));
      for (const [b, R, off, M] of [[bb, e.Rb, 0, Mb], [bs, e.Rs, 6, Ms]]) {
        const g = [0, 0, 0, 0, 0, 0];
        for (let i = 0; i < 5; i++) for (let k = 0; k < 6; k++) g[k] += e.ax.rows[i][off + k] * l[i];
        const d = solve6(M, g, [0, 0, 0, 0, 0, 0], Lw), dX = Rv3(R, [d[0], d[1], d[2]]), dPhi = Rv3(R, [d[3], d[4], d[5]]);
        b.X[0] += dX[0]; b.X[1] += dX[1]; b.X[2] += dX[2];
        const a = Math.sqrt(dPhi[0] * dPhi[0] + dPhi[1] * dPhi[1] + dPhi[2] * dPhi[2]);
        if (a > 0) {
          const sa = C.sin(a / 2) / a, d0 = C.cos(a / 2), d1 = dPhi[0] * sa, d2 = dPhi[1] * sa, d3 = dPhi[2] * sa, q = b.q;
          const r = [d0 * q[0] - d1 * q[1] - d2 * q[2] - d3 * q[3], d0 * q[1] + d1 * q[0] + d2 * q[3] - d3 * q[2], d0 * q[2] - d1 * q[3] + d2 * q[0] + d3 * q[1], d0 * q[3] + d1 * q[2] - d2 * q[1] + d3 * q[0]];
          const n = Math.sqrt(r[0] * r[0] + r[1] * r[1] + r[2] * r[2] + r[3] * r[3]); b.q = [r[0] / n, r[1] / n, r[2] / n, r[3] / n];
        }
      }
    }
    const e = jointError(J, bb, bs).c;
    J.resid = Math.max(J.resid, Math.sqrt(e[0] * e[0] + e[1] * e[1] + e[2] * e[2]), Math.abs(e[3]), Math.abs(e[4]));
    J.Wproj += energy(fall, J.ib).U + energy(fall, J.is).U - U0;
  }
  // a body's state that a sub-step moves, to run it again free if the ligament parts in it
  function snapBody(b) { return { P: b.P.slice(), Lm: b.Lm.slice(), X: b.X.slice(), q: b.q.slice(), nu: b.nu.slice(), rate: b.rate.slice(), a: b.air ? b.air.a : 0, Vair: b.Vair, inMud: b.inMud, fsub: b.fsub, cap: b.cap, shed: b.shed, touched: b.touched, arrival: b.arrival, iters: b.iters, subs: b.subs, unconv: b.unconv, W: Object.assign({}, b.W) }; }
  function restoreBody(b, s) { b.P = s.P; b.Lm = s.Lm; b.X = s.X; b.q = s.q; b.nu = s.nu; b.rate = s.rate; if (b.air) b.air.a = s.a; b.Vair = s.Vair; b.inMud = s.inMud; b.fsub = s.fsub; b.cap = s.cap; b.shed = s.shed; b.touched = s.touched; b.arrival = s.arrival; b.iters = s.iters; b.subs = s.subs; b.unconv = s.unconv; b.W = s.W; }
  // one sub-step of the two joined bodies: subStep's midpoint for each, iterated together, with the constraint's force
  // at the middle and the hinge's moment; then the release test, the drift and theta
  function subStepPair(fall, h, sIdx) {
    const J = fall.eng.joint, sp = fall.sea, B = [fall.eng.bodies[J.ib], fall.eng.bodies[J.is]], save = B.map(snapBody);
    const th0 = J.theta, mid = J.at !== 'start';
    let mh = hingeLaw(J, th0).m;                     // 'mid': the first iteration's, then the middle's (below)
    const S = B.map(b => {
      const s = { b, K: b.K, R0: quatR(b.q, new Float64Array(9)), R1: new Float64Array(9), Rm: new Float64Array(9), X1: [0, 0, 0], Xm: [0, 0, 0], q1: [1, 0, 0, 0], M: new Float64Array(36), Lw: new Float64Array(36),
        z: [0, 0, 0, 0, 0, 0], zn: [0, 0, 0, 0, 0, 0], nu: [0, 0, 0, 0, 0, 0], nun: [0, 0, 0, 0, 0, 0], Fo: [0, 0, 0, 0, 0, 0], pw: {}, r: [0, 0, 0, 0, 0, 0],
        P0: [b.P[0], b.P[1], b.P[2], b.Lm[0], b.Lm[1], b.Lm[2]], nu0: b.nu.slice(), a0: 0, a1: 0, Vair: 0 };
      const K = b.K, R0 = s.R0;
      // the pocket: as subStep. Under the spaces (B4's gate 2) each body's spaces are stepped at its own pose at the
      // sub-step's start, their air the pocket over it, as subStep does
      if (b.spc) { spacesStep(b, sp, R0, h); s.a0 = s.a1 = b.air.a; }
      else if (b.air && b.air.a > 0) {
        s.a0 = b.air.a;
        const da = -(b.X[2] + R0[6] * (b.air.p[0] - b.C[0]) + R0[7] * (b.air.p[1] - b.C[1]) + R0[8] * (b.air.p[2] - b.C[2]));
        const pk = Math.max(pAt(sp, da), P_ATM), dp = rhoAt(sp, da) * GRAV * K.ventHead;
        const rate = b.vent > 0 ? K.ventCd * b.vent * Math.sqrt(2 * dp * RHO_AIR0 * pk / P_ATM) / RHO_AIR0 : 0;
        s.a1 = s.a0 - rate * h; if (s.a1 < 0) s.a1 = 0;
        const amax = b.airMax * pk / P_ATM; if (s.a0 > amax) s.a0 = amax; if (s.a1 > amax) s.a1 = amax;
      }
      for (let k = 0; k < 6; k++) s.z[k] = s.P0[k] + 0.5 * h * b.rate[k];
      if (b.air && (s.a0 > 0 || s.a1 > 0)) {
        b.air.a = 0.5 * (s.a0 + s.a1);
        s.Vair = airVolume(b, sp, -(b.X[2] + R0[6] * (b.air.p[0] - b.C[0]) + R0[7] * (b.air.p[1] - b.C[1]) + R0[8] * (b.air.p[2] - b.C[2])));
      }
      massWithAir(b, s.Vair, s.M);
      return s;
    });
    const iterMax = Math.max(S[0].K.iterMax, S[1].K.iterMax), tol = Math.min(S[0].K.tol, S[1].K.tol), Lw = new Float64Array(36);
    let it = 0, conv = false, dlast = Infinity, relax = 1, lam = null, ax = null;
    for (; it < iterMax; it++) {
      for (const s of S) {
        const b = s.b, nu = s.nu, q = b.q, R0 = s.R0, R1 = s.R1, Rm = s.Rm;
        solve6(s.M, s.z, nu, s.Lw);
        const hx = 0.5 * h * nu[3], hy = 0.5 * h * nu[4], hz = 0.5 * h * nu[5];
        const w = q[0] - q[1] * hx - q[2] * hy - q[3] * hz, x = q[0] * hx + q[1] + q[2] * hz - q[3] * hy, y = q[0] * hy - q[1] * hz + q[2] + q[3] * hx, zq = q[0] * hz + q[1] * hy - q[2] * hx + q[3];
        const nq = 1 / Math.sqrt(w * w + x * x + y * y + zq * zq); s.q1[0] = w * nq; s.q1[1] = x * nq; s.q1[2] = y * nq; s.q1[3] = zq * nq;
        quatR(s.q1, R1);
        for (let k = 0; k < 9; k++) Rm[k] = 0.5 * (R0[k] + R1[k]);
        for (let r = 0; r < 3; r++) { s.X1[r] = b.X[r] + h * (Rm[r * 3] * nu[0] + Rm[r * 3 + 1] * nu[1] + Rm[r * 3 + 2] * nu[2]); s.Xm[r] = 0.5 * (b.X[r] + s.X1[r]); }
        loads(b, sp, nu, b.X, R0, s.X1, R1, s.Xm, Rm, s.Vair, s.Fo, s.pw);
      }
      ax = jointRows(J, B[0], B[1], S[0].Rm, S[1].Rm, false);
      if (mid) {                                     // the hinge at the middle: theta from the trial end attitudes (pure)
        const Rb = S[0].R1, Rs = S[1].R1, r20 = Rs[2] * Rb[0] + Rs[5] * Rb[3] + Rs[8] * Rb[6], r00 = Rs[0] * Rb[0] + Rs[3] * Rb[3] + Rs[6] * Rb[6];
        mh = hingeLaw(J, 0.5 * (th0 + J.sense * C.atan2(-r20, r00))).m;
      }
      // the hinge's moment, closing positive: about e2, -sense on the bow, +sense on the stern, in each one's axes
      const tw = [-J.sense * mh * ax.e2[0], -J.sense * mh * ax.e2[1], -J.sense * mh * ax.e2[2]], tb = RTv3(S[0].Rm, tw), ts = RTv3(S[1].Rm, tw);
      for (let k = 0; k < 3; k++) { S[0].Fo[3 + k] += tb[k]; S[1].Fo[3 + k] -= ts[k]; }
      for (const s of S) kirchhoff(s.z, s.nu, s.Fo, s.r);
      // the constraint's force at the middle: J M^-1 (P0 + h/2 (r + J^T lam)) = 0 for the five rows
      const K = jointK(ax.rows, S[0].M, S[1].M, Lw);
      const wb = solve6(S[0].M, S[0].P0.map((p, k) => p + 0.5 * h * S[0].r[k]), [0, 0, 0, 0, 0, 0], Lw);
      const ws = solve6(S[1].M, S[1].P0.map((p, k) => p + 0.5 * h * S[1].r[k]), [0, 0, 0, 0, 0, 0], Lw);
      lam = solveN(K.map(row => row.map(v => 0.5 * h * v)), ax.rows.map(row => -(dot6(row.slice(0, 6), wb) + dot6(row.slice(6, 12), ws))));
      let dmax = 0, vmax = 0;
      for (let j = 0; j < 2; j++) {
        const s = S[j], off = 6 * j;
        for (let k = 0; k < 6; k++) { let g = 0; for (let i = 0; i < 5; i++) g += ax.rows[i][off + k] * lam[i]; s.zn[k] = s.P0[k] + 0.5 * h * (s.r[k] + g); }
        solve6(s.M, s.zn, s.nun, s.Lw);
        for (let k = 0; k < 6; k++) { const d = Math.abs(s.nun[k] - s.nu[k]); if (d > dmax) dmax = d; const a = Math.abs(s.nu[k]); if (a > vmax) vmax = a; }
      }
      if (dmax <= tol * (1 + vmax)) { for (const s of S) for (let k = 0; k < 6; k++) s.z[k] = s.zn[k]; conv = true; it++; break; }
      if (dmax >= dlast) relax *= 0.5;
      dlast = dmax;
      for (const s of S) for (let k = 0; k < 6; k++) s.z[k] += relax * (s.zn[k] - s.z[k]);
    }
    // the force across the joint, on the bow, from the pin's three rows (the world's axes): N along her (tension
    // positive: it pulls the bow aft), V across her (e3), L lateral (e2); against what still holds there
    const F = [lam[0], lam[1], lam[2]], N = -(F[0] * ax.e1[0] + F[1] * ax.e1[1] + F[2] * ax.e1[2]);
    const V = F[0] * ax.e3[0] + F[1] * ax.e3[1] + F[2] * ax.e3[2], L = F[0] * ax.e2[0] + F[1] * ax.e2[1] + F[2] * ax.e2[2];
    const hs = hingeAt(J, backbone(J)), rN = N / hs.Nt, rV = Math.abs(V) / hs.Vs;
    if (J.trace) J.trace.push([rN, rV]);
    if (rN > 1 || rV > 1) {
      // the ligament parts: this sub-step is run again with the bodies free, from where it began
      B.forEach((b, j) => restoreBody(b, save[j]));
      J.released = true;
      J.release = { t: fall.t + (sIdx + 1) * h, k: fall.k, sub: sIdx, theta: th0, s: backbone(J), N, V, L, rN, rV, by: rN > 1 ? 'tension' : 'shear', maxN: J.maxN, maxV: J.maxV, W: J.W };
      fall.events.push({ t: J.release.t, id: 'release', piece: 'joint', depth: Math.max(fall.pieces[J.ib].depth, fall.pieces[J.is].depth), energy: J.W, speed: 0, by: J.release.by, theta: th0, rN, rV });
      for (const b of B) subStep(b, sp, h);
      return;
    }
    if (rN > J.maxN) J.maxN = rN;
    if (rV > J.maxV) J.maxV = rV;
    J.force = { N, V, L, rN, rV, Mz: lam[4] };
    // the end of the sub-step, each body as subStep ends it, with the joint's force in her rate
    for (let j = 0; j < 2; j++) {
      const s = S[j], b = s.b, off = 6 * j, pw = s.pw, K = s.K;
      for (let k = 0; k < 6; k++) { let g = 0; for (let i = 0; i < 5; i++) g += ax.rows[i][off + k] * lam[i]; b.rate[k] = s.r[k] + g; }
      b.iters += it; b.subs++; if (!conv) b.unconv++;
      b.W.cons += h * pw.cons; b.W.surf += h * pw.surf; b.W.air += h * pw.air; b.W.drag += h * pw.drag; b.W.mud += h * pw.mud;
      for (let k = 0; k < 3; k++) { b.P[k] = s.P0[k] + h * b.rate[k]; b.Lm[k] = s.P0[3 + k] + h * b.rate[3 + k]; b.X[k] = s.X1[k]; }
      b.q[0] = s.q1[0]; b.q[1] = s.q1[1]; b.q[2] = s.q1[2]; b.q[3] = s.q1[3];
      if (b.air) b.air.a = s.a1;
      b.inMud = pw.inMud; b.fsub = pw.fsub; b.cap = pw.cap;
      if (pw.inMud && !b.touched) {
        b.touched = true;
        b.arrival = { speed: comSpeed(b, s.nu0), energy: 0.5 * (s.P0[0] * s.nu0[0] + s.P0[1] * s.nu0[1] + s.P0[2] * s.nu0[2] + s.P0[3] * s.nu0[3] + s.P0[4] * s.nu0[4] + s.P0[5] * s.nu0[5]), depth: bedDepth(sp, b.X[0], b.X[1]) };
      }
      const R1 = s.R1, Ve = b.air && s.a1 > 0 ? airVolume(b, sp, -(b.X[2] + R1[6] * (b.air.p[0] - b.C[0]) + R1[7] * (b.air.p[1] - b.C[1]) + R1[8] * (b.air.p[2] - b.C[2]))) : 0;
      b.Vair = Ve;
      massWithAir(b, Ve, s.M);
      solve6(s.M, [b.P[0], b.P[1], b.P[2], b.Lm[0], b.Lm[1], b.Lm[2]], b.nu, s.Lw);
      if (!K.strikeAdded && pw.inMud !== b.shed) {
        const ke = () => 0.5 * (b.P[0] * b.nu[0] + b.P[1] * b.nu[1] + b.P[2] * b.nu[2] + b.Lm[0] * b.nu[3] + b.Lm[1] * b.nu[4] + b.Lm[2] * b.nu[5]);
        const k0 = ke();
        b.shed = pw.inMud;
        massWithAir(b, Ve, s.M);
        if (b.shed) for (let r = 0; r < 3; r++) { let a = 0, t = 0; for (let k = 0; k < 6; k++) { a += s.M[r * 6 + k] * b.nu[k]; t += s.M[(3 + r) * 6 + k] * b.nu[k]; } b.P[r] = a; b.Lm[r] = t; }
        else solve6(s.M, [b.P[0], b.P[1], b.P[2], b.Lm[0], b.Lm[1], b.Lm[2]], b.nu, s.Lw);
        b.W.shed += ke() - k0;
        b.rate = [0, 0, 0, 0, 0, 0];
      }
    }
    // the hinge's work as the bodies met it: its moment (the middle's, or the start's under 'start') against the middle's opening rate,
    // times h (the integrator's own reckoning of every load's work)
    const wb = Rv3(S[0].Rm, [S[0].nu[3], S[0].nu[4], S[0].nu[5]]), ws = Rv3(S[1].Rm, [S[1].nu[3], S[1].nu[4], S[1].nu[5]]);
    J.W += h * mh * J.sense * (ax.e2[0] * (wb[0] - ws[0]) + ax.e2[1] * (wb[1] - ws[1]) + ax.e2[2] * (wb[2] - ws[2]));
    // the drift out, theta from the attitudes, the hinge's state
    jointProject(fall, J, B[0], B[1]);
    J.theta = jointTheta(J, B[0], B[1]);
    const was = J.yielded;
    commitHinge(J, mid ? J.theta : th0);             // 'mid': the step's end angle; 'start': its start's, as before
    if (J.yielded && !was) J.tYield = fall.t + (sIdx + 1) * h;
  }
  // join(fall, hinge): the two pieces of a fall (0 the bow, 1 the stern, cut at hinge.x) pinned, as begin's opts.hinge
  // does at a hand-over; for a fall made and placed by hand (the trials). They must stand as one body when it is called
  function join(fall, hg, ship) {
    const sense = hg.sense === 'sag' ? -1 : 1, x = hg.x;
    // where in its sub-step the hinge's moment is taken (B4's gate 5, Z1 with B1+B2, 2026-11-24): 'mid', the default, at
    // the middle's angle inside the sub-step's iteration, its state committed at the step's end angle: the midpoint rule
    // of the rest of the step, so the release converges (member C: +22.69 s at K.sub 8, +22.63 at 64); 'start', the
    // scheme before, to the bit: the moment frozen at the start's angle, whose explicit step pumped the joint's elastic
    // mode (about 1 s) until it crossed the yield on a peak, so the release came 8 s early at K.sub 8 and moved with it
    const at = hg.at === undefined ? 'mid' : hg.at;
    if (at !== 'mid' && at !== 'start') throw new Error('hinge.at is \'mid\' or \'start\', not ' + JSON.stringify(hg.at));
    const yieldOn = hg.yieldOn === undefined ? 'resultant' : hg.yieldOn;   // D116, join 22: the onset's own check
    if (yieldOn !== 'moment' && yieldOn !== 'circle' && yieldOn !== 'resultant') throw new Error('hinge.yieldOn is \'moment\', \'circle\' or \'resultant\', not ' + JSON.stringify(hg.yieldOn));
    const H = hg.H || sectionOf().hinge(ship, x, sense < 0 ? 'sag' : 'hog', Object.assign({}, hg.opts || {}, hg.Lh ? { Lh: hg.Lh } : {}));
    if (!H) throw new Error('no hinge at x ' + x + ' (S.hinge gave none)');
    const J = { H, xb: x, sense, at, yieldOn, ib: 0, is: 1, theta: 0, thMax: 0, thY: 0, yielded: false, M0: 0, released: false, release: null, maxN: 0, maxV: 0, W: 0, Wproj: 0, drift: 0, resid: 0, force: null, trace: hg.trace ? [] : null };
    fall.eng.joint = J;
    J.demand0 = jointDemand(fall, J);
    J.M0 = J.demand0.M0;
    if (fall.eng.bodies.some(bd => bd.spc)) tearBegin(fall, J);    // B4's gate 2: the spaces with the joint
    return J;
  }

  // ================================================================ her lights (G2 of NH15)
  // HER LIGHTS. From the hand-over the fall carries her light piece by piece (docs/DESIGN_the_living_ship_v1_2026-11-23.md,
  // G2). Past the hand-over the plant is not stepped and no boiler raises steam, so the steam that is left goes as the
  // plant's own law for broken mains lets it go (core/systems.js): her pressure falls at 1/PLANT.breakTau a second from
  // sim.plant.p at the hand-over, and a set of dynamos stops at PLANT.pDynamo, or once the sea floods it. The dynamos feed
  // only the piece they stand in. Both sets stand aft, aft of every cut the model makes: the main sets in zone
  // PLANT.rooms2.el, the emergency sets on D deck in zone PLANT.emergency.zone. So the forward piece is dark from the
  // break, its leads cut there [derived: the design's G2, every lit boiler forward of the break]. The stern burns while
  // its dynamos run down: (1 - pDynamo) breakTau, 7 s from working pressure, with the plant's bets [Beesley's "single
  // flash", the plant note]. With the joint too the leads part at the hand-over: in hogging her upper decks, where they
  // run, part first [bet].
  // Her light by section is G1's (core/readers/circuits.js), when the hand-over carries it (sim.circuits). Each section
  // rides the piece its middle lies in, and keeps its fuses as the circuits had them. In the fall a section's fuses blow,
  // for good, on the step the sea outside her reaches its switches, if they stood in the air at the hand-over and its
  // piece has current then (a fuse blows only with current in it). Switches that stood under the sea at the hand-over
  // and held go on holding: the fall knows no space's own water [stand-in: a dry space under the sea keeps its lamps
  // while the dynamos run down]. The dynamos flood by the same rule, at the points the plant's wet() takes (their flat;
  // the emergency sets' D deck). A hand-over before the plant's own break (the onset, 6.9 deg by the head on member C)
  // begins lit; one at the flag begins as the plant left her (on the 1912 night, dark since its 20 deg rule). Nothing
  // here feeds back: the pieces' motion, the core and the plant are untouched (tools/night_after_tests.js).
  const RL = new Float64Array(9);
  function lightsBegin(fall, sim, F) {
    const P = sim.plant, Sy = P ? sysOf() : null;
    if (!P || !Sy) return;
    const PL = Sy.PLANT, ship = sim.ship, np = fall.pieces.length;
    // the piece a station lies in (the nearer end's, beyond her ends)
    const pieceAt = (x) => {
      for (let i = 0; i < np; i++) if (x >= fall.pieces[i].x0 && x <= fall.pieces[i].x1) return i;
      let best = 0, d = Infinity;
      for (let i = 0; i < np; i++) { const pc = fall.pieces[i], di = x < pc.x0 ? pc.x0 - x : x - pc.x1; if (di < d) { d = di; best = i; } }
      return best;
    };
    const mid = (z) => 0.5 * (ship.zones[z].xa + ship.zones[z].xf), xm = mid(PL.rooms2.el), xe = mid(PL.emergency.zone);
    const mainPt = [xm, 0, ship.zones[PL.rooms2.el].floor + PL.dynamoFlat], emPt = [xe, 0, C.deckZ('D', xe)];
    const e = { t0: fall.t, p0: P.p, p: P.p, tau: PL.breakTau, pDyn: PL.pDynamo, E: PL.emergency.lights, main: pieceAt(xm), em: pieceAt(xe),
      el: !!P.el, emWet: !!P.emWet, mainPt, emPt, mainAir: C.worldZ(F, mainPt[0], mainPt[1], mainPt[2]) > 0, emAir: C.worldZ(F, emPt[0], emPt[1], emPt[2]) > 0,
      sw: null, air: null, share: null, off: false };
    const L = { level: new Array(np).fill(0), lit: null, dark: new Array(np).fill(-1), sections: null };
    const S = sim.circuits, Ci = S ? circuitsOf() : null;
    if (S && Ci) {
      const G = Ci.table(ship), n = S.sections.length, blows = S.short < Infinity;
      const piece = new Array(n), out = new Array(n), sw = new Array(3 * n), air = new Array(n), share = new Array(n);
      for (let j = 0; j < n; j++) {
        const z = G.z[j] + Math.min(S.short, G.h[j]);
        piece[j] = pieceAt(G.x[j]); out[j] = S.sections[j].out; share[j] = S.sections[j].share;
        sw[3 * j] = G.x[j]; sw[3 * j + 1] = G.y[j]; sw[3 * j + 2] = z;
        air[j] = blows && C.worldZ(F, G.x[j], G.y[j], z) > 0;
      }
      L.sections = { piece, out }; L.lit = new Array(np).fill(0);
      e.sw = sw; e.air = air; e.share = share;
    }
    fall.lights = L; fall.eng.lights = e;
    lightsAt(fall);
    // a piece dark from the hand-over: since the plant's own 'dark' when she was dark before it; else cut at the break
    const before = P.lights === 0 && P.events && P.events.dark !== undefined ? P.events.dark : fall.t;
    for (let i = 0; i < np; i++) if (L.level[i] === 0) L.dark[i] = P.lights === 0 ? before : fall.t;
  }
  // her lights at the fall's clock now (begin, then each advance); nothing once every piece is dark
  function lightsAt(fall) {
    const L = fall.lights, e = fall.eng.lights;
    if (e.off) return;
    const np = fall.pieces.length, t = fall.t;
    const zOf = (i, p) => { const pc = fall.pieces[i], R = quatR(pc.q, RL); return R[6] * p[0] + R[7] * p[1] + R[8] * p[2] + pc.r[2]; };
    e.p = Math.max(0, e.p0 - (t - e.t0) / e.tau);
    if (!e.el && e.mainAir && e.p > e.pDyn && zOf(e.main, e.mainPt) < 0) e.el = true;
    if (!e.emWet && e.emAir && e.p > e.pDyn && zOf(e.em, e.emPt) < 0) e.emWet = true;
    const mainRun = !e.el && e.p > e.pDyn, emRun = !e.emWet && e.p > e.pDyn;
    let any = false;
    for (let i = 0; i < np; i++) {
      const lv = mainRun && e.main === i ? 1 : (emRun && e.em === i ? e.E : 0);
      L.level[i] = lv;
      if (lv > 0) any = true; else if (L.dark[i] < 0) L.dark[i] = t;
    }
    if (L.sections) {
      // a section's fuses blow where the sea outside reaches switches that stood in the air, while its piece has current;
      // the share of her light still held on each piece, summed in the table's order
      const S = L.sections, n = S.piece.length, held = new Array(np).fill(0), Rs = new Array(np).fill(null);
      for (let i = 0; i < np; i++) if (L.level[i] > 0) Rs[i] = quatR(fall.pieces[i].q, new Float64Array(9));
      for (let j = 0; j < n; j++) {
        const i = S.piece[j];
        if (S.out[j] < 0 && e.air[j] && Rs[i]) {
          const R = Rs[i], r = fall.pieces[i].r;
          if (R[6] * e.sw[3 * j] + R[7] * e.sw[3 * j + 1] + R[8] * e.sw[3 * j + 2] + r[2] < 0) S.out[j] = t;
        }
        if (S.out[j] < 0) held[i] += e.share[j];
      }
      for (let i = 0; i < np; i++) L.lit[i] = L.level[i] * held[i];
    }
    if (!any) e.off = true;
  }

  // ================================================================ the hand-over at the flag (H1)
  // opts: { pieces: 1 (whole) | 2 (the default: cut at X_BREAK), cut (x, m), lever: { bow, stern, whole } (m),
  //   vent: { bow, stern, whole } (m2), sea: a sea() spec (default the 1912 sea, its seed the night's), K (each body's) }
  function seedOf(sim) { return sim.night && sim.night.spec && sim.night.spec.seed !== undefined ? sim.night.spec.seed : 1912; }
  function begin(sim, opts) {
    opts = opts || {};
    if (!sim.foundered && !opts.any) throw new Error('the fall begins at the founder flag (rule H1)');
    const ship = sim.ship, GI = girderOf(), T = shipTables(ship), xs = T.e[0], xf = T.e[T.nS], XB = opts.cut === undefined ? GI.X_BREAK : opts.cut;
    const m = sim.mo;
    const at = m ? { X: m.X, Y: m.Y, psi: m.psi } : { X: 0, Y: 0, psi: 0 };
    const sp = sea(Object.assign({ seed: seedOf(sim), psi: at.psi }, opts.sea || {}));
    const cuts = opts.pieces === 1 ? [['whole', xs, xf]] : [['bow', XB, xf], ['stern', xs, XB]];
    const lev = opts.lever || {}, ven = opts.vent || {}, airs = opts.air || {};
    // the pocket's place across her: at the break's onset the air where it lay (K0.airAtBreak, D98), at the flag K0's
    // own; a K.airAt given wins
    const Kh = opts.rule === 'break' && !(opts.K && opts.K.airAt !== undefined) ? Object.assign({}, opts.K || {}, { airAt: K0.airAtBreak }) : opts.K;
    const specs = cuts.map(([id, a, b]) => piece(ship, sim, a, b, { id, kind: id, lever: lev[id] || 0, vent: ven[id], air: airs[id] === undefined ? 'sim' : airs[id], K: Kh }));
    // the core's pose and rates: her reference point G does not move across the world in the core; she heaves, pitches
    // and rolls about it. On a watch her way and her turning are core/motion.js's (u forward, v to starboard, r to
    // starboard: here -v to port, and -r about the world's Z)
    const F = C.frameOf(sim), R = [F.R00, F.R01, F.R02, F.R10, F.R11, F.R12, F.R20, F.R21, F.R22], t = [F.tx, F.ty, F.tz];
    // her turning in the world: d/dt of Ry(pitch) Rx(roll) is (roll' cos pitch, pitch', -roll' sin pitch); on a watch
    // her yaw too, about the world's Z (r turns her head to starboard: -r about Z up)
    const th = sim.pitch, wC = [sim.wph * C.cos(th), sim.wth, -sim.wph * C.sin(th)];
    const wW = [wC[0], wC[1], wC[2] - (m ? m.r : 0)];
    const g0 = sim.g0, gW = [R[0] * g0[0] + R[1] * g0[1] + R[2] * g0[2] + t[0], R[3] * g0[0] + R[4] * g0[1] + R[5] * g0[2] + t[1], R[6] * g0[0] + R[7] * g0[1] + R[8] * g0[2] + t[2]];
    // the point under the break (contract v: 2): the cut station on the girder's neutral axis, where the fall began;
    // none when she falls whole
    const breakW = opts.pieces === 1 ? null : [R[0] * XB + R[2] * GI.Z_NA + t[0], R[3] * XB + R[5] * GI.Z_NA + t[1]];
    const fall = make(sp, specs, { rule: opts.rule || 'flag', t0: opts.t0 === undefined ? sim.t : opts.t0, dt: sim.params.dt, at, breakAt: breakW });
    // Z6's spaces (K.air 'spaces', M2 4c): each piece's share of the core's spaces at the hand-over (stateOf) and its
    // openings; the spaces whose air lags the sea past their heads there give way at once (their reports follow the
    // placing, with her speed then). Their air is the pocket from the placing on: the lumped pocket and its vent go
    const SPm = fall.eng.bodies[0].K.air === 'spaces' ? spacesLib() : null;
    if (SPm) {
      const whole = SPm.spacesOf(ship, -1e9, 1e9), walls = C.BULKHEADS.map(w => ({ x: w.x, top: C.deckZ(w.top, w.x) }));
      const K1 = fall.eng.bodies[0].K, gz = K1.solids === 'items' ? solidsScale(T, K1.wood) : null;
      for (let i = 0; i < specs.length; i++) {
        const b = fall.eng.bodies[i], kd = specs[i].kind, lo = kd === 'bow' ? XB : -1e9, hi = kd === 'stern' ? XB : 1e9, ssp = SPm.spacesOf(ship, lo, hi);
        const st = SPm.stateOf(ssp, whole, sim, F);
        // K.solids 'items': each space's room and permeability, its water and its air by its zone's factor, as the slices'
        // floodable volumes and water are scaled (each space keeps its fill, and its level at her pose)
        if (gz) for (let k = 0; k < ssp.n; k++) { const g = gz[ssp.node[k] >> 2]; ssp.mu[k] *= g; ssp.V[k] *= g; st.W[k] *= g; st.a[k] *= g; }
        const sops = SPm.openingsOf(ssp, sim, lo, hi, b.K);
        b.spc = { sp: ssp, st, ops: sops, bnd: b.K.fail === 'boundaries' ? SPm.boundariesOf(ssp, walls) : null, K: b.K, t: fall.t, acc: 0, ev: [], seen: 0, V: 0,
          doors: b.K.floats === 'core' ? SPm.doorsOf(sim, ssp, sops) : null, P: { floatDepth: sim.params.floatDepth, doorFall: sim.params.doorFall, hAir: sim.params.hAir },
          weather: b.K.weather === 'core' ? SPm.weatherOf(sim, ssp, sops, b.K) : null };
        b.air = { a: 0, V0: 0, p: [b.C[0], b.C[1], b.C[2]] };
        if (b.K.torn > 0 && specs.length === 2) tornOpen(b, XB, 0.5 * b.K.torn);   // the torn length about the cut (Z6 from the onset)
        spacesFail(b, R, t, fall.t);
        spacesPocket(b, sp, R, t);
      }
    }
    for (let i = 0; i < specs.length; i++) {
      const b = fall.eng.bodies[i], c = b.C;
      const Xc = [R[0] * c[0] + R[1] * c[1] + R[2] * c[2] + t[0], R[3] * c[0] + R[4] * c[1] + R[5] * c[2] + t[1], R[6] * c[0] + R[7] * c[1] + R[8] * c[2] + t[2]];
      // the velocity of C in the world: G's heave and her pitch and roll about G (the core holds G's X and Y)
      const rx = Xc[0] - gW[0], ry = Xc[1] - gW[1], rz = Xc[2] - gW[2];
      const vW = [wC[1] * rz - wC[2] * ry, wC[2] * rx - wC[0] * rz, sim.vz + wC[0] * ry - wC[1] * rx];
      if (m) {
        // on a watch, her way at amidships, (u, -v) in this frame, and her yaw about amidships: (0, 0, -r) x arm
        const ax = Xc[0] - t[0], ay = Xc[1] - t[1];
        vW[0] += m.u + m.r * ay; vW[1] += -m.v - m.r * ax;
      }
      const vC = [R[0] * vW[0] + R[3] * vW[1] + R[6] * vW[2], R[1] * vW[0] + R[4] * vW[1] + R[7] * vW[2], R[2] * vW[0] + R[5] * vW[1] + R[8] * vW[2]];
      const om = [R[0] * wW[0] + R[3] * wW[1] + R[6] * wW[2], R[1] * wW[0] + R[4] * wW[1] + R[7] * wW[2], R[2] * wW[0] + R[5] * wW[1] + R[8] * wW[2]];
      setState(b, sp, R, Xc, vC, om);
      const p = sync(fall, i, true);
      b.state = b.top > 0 ? 'afloat' : 'falling';
      p.state = b.state;
      if (b.state !== 'afloat') { b.wentUnder = true; fall.events.push({ t: fall.t, id: 'under', piece: p.id, depth: p.depth, energy: energy(fall, i).KE, speed: p.speed }); }
    }
    if (SPm) for (let i = 0; i < specs.length; i++) { for (const e of fall.eng.bodies[i].spc.ev) e.speed = fall.pieces[i].speed; spacesReport(fall, i); }
    // her lights from the hand-over (G2): the plant's and the circuits' state there, each piece placed
    lightsBegin(fall, sim, F);
    // the joint (Z6 inside B4), only when asked: opts.hinge = { sense: 'hog' | 'sag', Lh, H (an S.hinge result at the
    // cut, else S.hinge(ship, cut, sense, { Lh })), opts (S.hinge's own: a ligament's what-if) }. The two pieces start as
    // one rigid body, so the joint holds at the hand-over; it carries what the bodies ask of it there (M0)
    if (opts.hinge && specs.length === 2) join(fall, Object.assign({}, opts.hinge, { x: XB }), ship);
    sim.fall = fall;
    return fall;
  }
  function step(sim) { if (sim.fall && !sim.fall.done) advance(sim.fall); return sim.fall; }
  // Z3: the fall as a reader of the night. Nothing before the hand-over; on the first step past it (its own step has
  // stepped the model, and sim.t is still the hand-over's), begin from the hand-over's state with t0 its time and
  // advance once, so that sim.fall.t equals sim.t from then on
  function onStep(sim) {
    if (sim.fall) { if (!sim.fall.done) advance(sim.fall); return; }
    if (!N || !N.over || !N.over(sim)) return;
    const onset = !sim.foundered, tHand = onset ? sim.onset.found.t : sim.founderT;
    if (!(sim.t > tHand)) return;
    if (!onset) begin(sim, { t0: tHand });
    else {
      // B4's gate 1 (join 20's plan): with K0.jointOnset the pieces are joined at the onset's own station, in its own
      // sense ('sagging' is sag; else hog), the hinge's length Lh 20 m [bet]; 0, until join 20, the cut fall to the bit
      const fo = sim.onset.found;
      begin(sim, { any: true, cut: fo.x, rule: 'break', t0: tHand, hinge: K0.jointOnset ? { sense: fo.sense === 'sagging' ? 'sag' : 'hog', Lh: 20 } : undefined });
    }
    advance(sim.fall);
  }
  if (N && N.reader) N.reader({ name: 'fall', state: 'fall', step: onStep });

  // ================================================================ readings for the trials and the page
  // the world place of a ship-frame point p of piece i (R(q) p + r)
  function worldOf(fall, i, p) {
    const pc = fall.pieces[i], R = quatR(pc.q, new Float64Array(9));
    return [R[0] * p[0] + R[1] * p[1] + R[2] * p[2] + pc.r[0], R[3] * p[0] + R[4] * p[1] + R[5] * p[2] + pc.r[1], R[6] * p[0] + R[7] * p[1] + R[8] * p[2] + pc.r[2]];
  }
  // where her weight in water acts along her, the middle of her plan, and the lever between them (m, + forward)
  function leverOf(b) {
    let wn = 0, wx = 0, pa = 0, px = 0;
    for (let i = 0; i < b.n; i++) { const w = b.ms[i] - b.rhoRef * (b.Venv[i] - b.Vf[i]); wn += w; wx += b.ms[i] * b.gx[i] - b.rhoRef * (b.Venv[i] - b.Vf[i]) * b.x[i]; pa += b.B[i] * b.dx[i]; px += b.B[i] * b.dx[i] * b.x[i]; }
    return { xw: wx / wn, xplan: px / pa, lever: wx / wn - px / pa, wIn: wn };
  }
  // the potential flow's loads on body b at velocities nu (her axes) and accelerations nud: Kirchhoff's terms alone
  // (F = -M_A nud - w x P_A, T = -M_A nud - w x L_A - v x P_A), for the closed-form tests
  function potentialLoads(b, nu, nud) {
    const MA = b.MA, PA = [0, 0, 0, 0, 0, 0], An = [0, 0, 0, 0, 0, 0];
    for (let r = 0; r < 6; r++) for (let k = 0; k < 6; k++) { PA[r] += MA[r * 6 + k] * nu[k]; An[r] += MA[r * 6 + k] * (nud ? nud[k] : 0); }
    const v = [nu[0], nu[1], nu[2]], w = [nu[3], nu[4], nu[5]];
    const cr = (a, c) => [a[1] * c[2] - a[2] * c[1], a[2] * c[0] - a[0] * c[2], a[0] * c[1] - a[1] * c[0]];
    const wP = cr(w, PA.slice(0, 3)), wL = cr(w, PA.slice(3)), vP = cr(v, PA.slice(0, 3));
    return { F: [-An[0] - wP[0], -An[1] - wP[1], -An[2] - wP[2]], T: [-An[3] - wL[0] - vP[0], -An[4] - wL[1] - vP[1], -An[5] - wL[2] - vP[2]] };
  }
  // the mass, centre (ship frame) and inertia about that centre of a body (all floodable water in, no air)
  function massOf(b) {
    const m = b.mass, g = [b.mc[0] / m + b.C[0], b.mc[1] / m + b.C[1], b.mc[2] / m + b.C[2]];
    const r = [g[0] - b.C[0], g[1] - b.C[1], g[2] - b.C[2]], M = b.MRB;
    // I about G = I about C - m (|r|^2 I - r r^T)
    const I = [M[21] - m * (r[1] * r[1] + r[2] * r[2]), M[28] - m * (r[0] * r[0] + r[2] * r[2]), M[35] - m * (r[0] * r[0] + r[1] * r[1]), M[22] + m * r[0] * r[1], M[23] + m * r[0] * r[2], M[29] + m * r[1] * r[2]];
    return { m, g, I };
  }

  return {
    K0, SEA_1912, SOIL, PROFILES, P_ATM, SOLIDS_ITEMS, solidsScale, caRect, lamb, rhoEOS, mackenzie,
    sea, rhoAt, phiAt, pAt, tempAt, bedDepth, earthOf,
    shipTables, waterBySlice, piece, body, make, place, advance, begin, step, sync, join, hingeLaw, tearAt,
    worldOf, leverOf, potentialLoads, massOf, energy, airVolume, weightInWater, extent, poseR, quatR, quatOfR, loads, yieldShare: shearShare,
  };
});

/*
 * The hull girder's gauge (step 7a of docs/BRAINSTORM_the_whole_night_v1_2026-11-17.md): her weight along her length,
 * and the bending moment of her hull at any instant, as pure functions of the ship and a sim's state at that instant.
 *
 *   weight(sim)          the weight curve w(x) in the research note's layers (machinery by room, coal, cargo, people, the
 *                        hull as Prohaska's trapezoid, the remainder), closed to the model's own mass and centre exactly
 *                        (sim.ms, sim.g0), each layer with the height its weight acts at
 *   moment(sim, opts)    the bending moment and the shear at stations from bulkhead K to bulkhead J (x -27.1 to -16.2,
 *                        the break band) and along the whole hull, hogging positive; the governing station (the largest
 *                        moment in the band, over capacity), where its moment stands against the studies' range (below,
 *                        within, above 4.0 to 5.4 GN m); the beam form beside the exact one, as a cross-check
 *   capacity(x, M0)      what the girder can bear in hogging at x: 4.6 GN m central; with opts.joint, 10 % less near the aft
 *                        expansion joint (a bet, off by default)
 *   describe(res)        "hull 4.3 GN m, hogging at bulkhead J"
 *
 * Defaults (the coordinator's decisions of 2026-11-17, 21:20 CST, on this lane's finding): the weight curve with Prohaska's
 * a fitted to the panel's C-7 moment (PROHASKA_A below: 0.660 since the landing, D92; the note's 0.566 stays
 * selectable, VARIANTS.note); the
 * moment relieved by her inertia (opts.reading 'relieved'; 'stern' gives the note's definition); no knock-down for the
 * joint (opts.joint). A gauge shows the moment against the studies' range, not as a share of one capacity.
 *
 * It is not a reader in the registering sense: it keeps no state and owns no orders. It lives in core/readers/ because the
 * build bundles that folder after core/night.js, into the page and the forecast worker alike. Nothing here writes into a
 * sim: no event, no flag, no cache on it (the caches are keyed by the ship and the mass properties, outside the sim). It
 * breaks nothing: there is no break in this step, only the gauge.
 *
 * The two forms of the moment (docs/research/RESEARCH_breakup_hull_girder_v1_2026-11-17.md, section 9a):
 *   exact   about the section's neutral axis at the station (x_b, y 0, z_NA in the ship frame), the moment of every force
 *           on the part of her aft of x_b at its own point: the weights at their blocks' centroids and heights, the flood
 *           water in each column at its centroid, each column's buoyancy at its centre of buoyancy, all vertical in the
 *           world. The moment is taken about the horizontal axis across her (the world's Y: the core's pose is
 *           Ry(pitch) Rx(roll), so her x axis always lies in the world's X-Z plane): the bending in the vertical plane
 *           through her keel. Her list does not enter it except through the loads themselves; the model's list is a
 *           known gap (README) and the note says not to make the break depend on it (9d). With a list this moment is the
 *           resultant of the bending about her own deck axis (its cos(list) share, returned as Mvert) and the lateral
 *           bending (its sin(list) share).
 *   beam    q(x) = g cos(trim) (b(x) - w(x) - f(x)) per metre of her own x, shear V = the integral of q from the stern,
 *           moment M = the integral of V from the stern (trapezoids at the column slices' edges). It drops the along-hull
 *           components of the loads (g sin(trim)) acting at heights off the neutral axis: the term D below. Both must
 *           close at the bow at rest; a residual there in motion is the dynamic term (her heave and pitch accelerating,
 *           her damping, and on a watch the motion model's own loads, sim.xFz and sim.xMth): it is reported, not hidden.
 * Signs: hogging positive (the ends drooping about a supported middle); the shear V positive where the part aft of the
 * station is the heavier, so that dM/dx = V.
 *
 * Numbers: [read] where a source gives it, [search summary] where only a search digest did, [derived] for arithmetic on
 * them, [bet] where nothing was found, as the research note tags them (section 9). Units: SI inside (N, N m, kg);
 * tonnes in the weight table.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../core.js'));
  else root.TitanicGirder = factory(root.TitanicCore);
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';
  const GRAV = C.GRAV, RHO = C.RHO, LTT = C.LT / 1000;    // tonnes in a long ton (1.01605)
  const FT = C.FT, IN = 0.0254;
  const ZB = C.zoneBounds();                              // [the stem, bulkheads A to P, the stern], x m, from forward
  const bulk = (id) => C.BULKHEADS.find(b => b.id === id).x;
  const room = (k) => [ZB[k + 1], ZB[k]];                 // zone k from its after to its forward bulkhead
  const XJ = bulk('J'), XK = bulk('K');                   // -16.154, -27.127: boiler room 1 between them

  // ---------------------------------------------------------------- the section and its capacity (note, 9b and 9c)
  // the neutral axis 398 in above the keel, midship section (Marine Forensics Panel; Mengot and Woytowich) [search
  // summary]; taken for every station of the break band, which lies in her parallel middle body
  const Z_NA = 398 * IN;
  const CAP = {
    // N m in hogging at the break station. Central 4.6 GN m: the panel's flooding condition C-7, 22 ksi at B deck x
    // 1.86e6 in3 [derived from search summaries]; it agrees with the riveted deck, 30.5 m3 x 153 MPa = 4.7 GN m, and
    // with the 1912 design moment W L / 30 = 4.5 GN m (Archer, BI 24318) [derived from read]
    hog: 4.6e9,
    low: 4.0e9,     // 10 % under: the aft joint's weaker section (Paik et al. 2025) and C-7's uncertainty [bet]
    high: 5.4e9,    // Stettler and Thomas's largest moment, 1.79 million ft-tons [search summary; SI derived]
    whatIf: 8.5e9,  // the deck's plate-yield moment, 30.5 m3 x 280 MPa: a hull that never breaks [derived]
    sag: 5.6e9,     // sagging: the keel's modulus 36.5 m3 x 153 MPa [derived; a bet, not needed for 1912]
    // the aft expansion joint (frame 28A, between the third and fourth funnels) at x -25.1 [derived from search-summary
    // frames]: the section there about 10 % weaker than amidships (Paik et al.) [search summary]; within 3 m [bet].
    // Hogging only: the joint opens the deck, which hogging puts in tension [bet]. An option (opts.joint), off by default.
    joint: { x: -25.1, half: 3.0, factor: 0.9 },
  };
  // the break band: from bulkhead K to bulkhead J, the model's own (the note's -27 to -16 m), over boiler room 1 [read:
  // the wreck's bottom pieces and the funnels; section 1.3]; the note's central station -23 m, Mengot's frame 25A
  // -22.4 m (the bottom's centre) and the joint -25.1 m (the deck's) are stations of their own
  const BAND = [XK, XJ];
  const X_BREAK = -23.0;
  // capacity at x, N m: M0 the central value (default CAP.hog); joint: the aft joint's 10 % within 3 m [bet]
  function capacity(x, M0, sense, joint) {
    if (sense === 'sag' || sense === 'sagging') return CAP.sag;
    const c = M0 === undefined || M0 === null ? CAP.hog : M0;
    return joint && Math.abs(x - CAP.joint.x) <= CAP.joint.half + 1e-9 ? c * CAP.joint.factor : c;
  }
  // where a moment stands against the studies' range of what her hull could bear (the note, 9b): 'below' 4.0 GN m,
  // 'within' 4.0 to 5.4, 'above' 5.4 [the range: search summaries and derived; its use as one band: the coordinator's]
  function zone(M) { const m = Math.abs(M); return m > CAP.high ? 'above' : (m >= CAP.low ? 'within' : 'below'); }
  // Where the record's break falls on this model's curve: on the 1912 damage preset (core/scenarios.js "titanic"), the
  // default moment (the default curve, relieved, no knock-down, the largest in the band) when her trim first reaches
  // 11 and 17 degrees, the record's attitude at the break (the note, 9d) [measured: tools/girder_tests.js checks these
  // figures against its own run, to 0.01 GN m]. The page's gauge quotes them. Measured again with S1 (2026-11-19: the
  // tiers above B deck are buoyant until their windows go, which lifts her forward part late and bends her more): they
  // were 4.98 and 5.28. Measured again with G6, G6b and W6 (2026-11-20, join 6: the damage shared as Hackett and
  // Bedford's and refitted): they were 5.11 and 5.87. Measured again with G7 (2026-11-21, join 7: the forepeak held to
  // its tank, G11's widths, refitted): they were 5.11 and 5.84. Measured again at the calibration epoch's landing (D4,
  // 2026-11-23: the history match's member C, every stage C switch on, her ends restored, and a refitted to C-7 at
  // 0.660, D92; e113): they were 5.125 and 5.871 (on a = 0.40 the landed model gives 4.860 and 4.995).
  const RECORD = { trim: [11, 17], M: [5.591e9, 5.708e9] };

  // ---------------------------------------------------------------- her weight along her length (note, 9a)
  // Masses in tonnes; x in the model's frame (forward of amidships positive), from its own bulkheads where a room is meant.
  const DE = 140 * LTT;    // a double-ended boiler with its water: 91.5 LT dry + 48.5 LT [search summary] = 142.2 t
  const SE = 84;           // a single-ended boiler, 11 ft 9 in long against 20 ft: 11.75/20 x 140 LT = 83.6 t [derived; bet]
  const Z_BOILER = C.G.tankTop + 0.3 + 0.5 * (15.75 * FT);   // m: on saddles [bet: 0.3 m] on the tank top [read: core
                           // G.tankTop], 15 ft 9 in across [read: The Shipbuilder, via the note 4.2]: 4.3 m [derived]
  function fixedLayers(V) {
    const L = [];
    const add = (name, m, x0, x1, z, tag, machinery) => L.push({ name, m, x0, x1, z: V.zAll ? null : z, tag, machinery: !!machinery, shape: 'uniform' });
    // the boilers by room: four double-ended in 6, five in each of 5 to 2, five single-ended in 1 [read: The Shipbuilder 1911]
    add('Boilers, boiler room 6', 4 * DE, ...room(4), Z_BOILER, 'count [read]; unit weight [search summary]; height [derived, bet]', true);
    for (let k = 5; k <= 8; k++) add('Boilers, ' + C.ZONES[k].name.toLowerCase(), 5 * DE, ...room(k), Z_BOILER, 'count [read]; unit weight [search summary]; height [derived, bet]', true);
    add('Boilers, boiler room 1 (single-ended)', 5 * SE, ...room(9), Z_BOILER, 'count [read]; weight [bet]', true);
    // two engines of about 990 LT each [read: TRMA], plus 300 t of pumps and auxiliaries [bet], over x -45 to -30 where
    // the engines stand in their room (K to L) [note]; their crankshafts 3.80 m up (R1, core/systems.js PLANT.crank), the
    // cylinders above: 7 m [bet]
    add('Reciprocating engines and their room', 2 * 990 * LTT + 300, -45, -30, 7.0, 'engines [read]; the 300 t [bet]; place [note]; height [bet]', true);
    // the turbine, 420 LT complete [read: Norway Heritage], plus 300 t of condensers and auxiliaries [bet], over its room;
    // at its axis, 4.82 m up (R1, PLANT.turbineAxis) [measured]
    add('Turbine room', 420 * LTT + 300, ...room(11), 4.82, 'turbine [read]; the 300 t [bet]; height [measured: R1]', true);
    add('Electric engine room', 200, ...room(12), 4.0, '[bet]', true);
    // the shafts 250 t [bet] from the turbine room to the stern frame; the stern frame and its brackets and boss arms,
    // about 190 LT [read: Norway Heritage], and three screws, about 92 LT [search summary], at the stern
    add('Shafts', 250, -118, -50, 3.80, 'mass and place [bet]; height: the wing shafts\' 3.80 m [measured: R1]', true);
    add('Stern castings and screws', 190 * LTT + 92 * LTT, -130, -118, 5.0, 'castings [read]; screws [search summary]; height [bet]', true);
    // coal: about 3,050 t on the night (5,892 tons at Southampton less 4.5 days' burning; core/systems.js PLANT.coalAboard)
    // [derived], spread evenly over the bunkers of boiler rooms 6 to 1 [bet: the shape]; bunkers about half full: 5 m [bet].
    // What-if 'plant': as core/systems.js shares it out, by the furnace ends lit in each room (boiler room 1 cold, none)
    if (V.coal === 'plant') {
      const lit = [8, 10, 10, 10, 10];
      for (let k = 4; k <= 8; k++) add('Coal, ' + C.ZONES[k].name.toLowerCase(), 3050 * lit[k - 4] / 48, ...room(k), 5.0, 'mass [derived]; shared by the fires lit (core/systems.js); height [bet]');
    } else add('Coal', 3050, room(9)[0], room(4)[1], 5.0, 'mass [derived]; shape and height [bet]');
    // cargo 900 LT [bet: 559 to 1,400 tons in the digests], 60 % in holds 1 to 3 (bulkheads A to D), 40 % aft [bet]
    const cargo = V.cargo === undefined ? 910 : V.cargo;
    add('Cargo, holds 1 to 3', cargo * 550 / 910, room(3)[0], room(1)[1], 5.0, '[bet]');
    add('Cargo aft', cargo * 360 / 910, -113, room(13)[1], 5.0, '[bet]');
    add('People and luggage', 260, -100, 100, 17.0, '[bet]: about 2,200 aboard, on C to E decks');
    return L;
  }
  const LIGHTSHIP = 38760 * LTT;   // 38,760 LT [search summary]
  // The end ordinate of the hull's trapezoid, in W/L. 0.660 [fitted: the one outside figure, the panel's C-7 moment of
  // 4.64 GN m at about 35,000 t aboard (her water as the core weighs it, D88), which it gives to 0.1 % on the landed
  // model (tools/girder_tests.js, sections 3 and 4; docs/research/experiments/e113_prohaska_refit_d4.js)]. Refitted once
  // at the calibration epoch's landing (D(G14-c), D92, 2026-11-23). It was 0.40, fitted on join 1's path, on a model
  // without her ends above E deck (C3) and weighing the over-fill (C5): it absorbed their absence. On the landed model
  // 0.40 gives C-7 16.2 % low; the ends carry 59 % of that and C5 17 %, and with both off the old drift of about 3 %
  // returns (e113). 0.660 lies inside the 0.40 to 0.75 the code brackets. The note's 0.566, a recollection of a textbook
  // table for passenger ships (Munro-Smith after Prohaska) [bet], gives 5.8 % too little. 0.40 is the value the note
  // quotes for a small passenger paddle steamer (the Medway Queen study) [search summary].
  const PROHASKA_A = 0.660;
  const PROHASKA_A_NOTE = 0.566;
  const VARIANTS = { note: { a: PROHASKA_A_NOTE } };   // the note's own curve, for the finding's second column
  const REMAINDER = [-100, 115];   // fresh and feed water, stores, double-bottom liquids: the double bottom [bet: the place]
  const Z_REMAINDER = 0.8;         // m: half the double bottom's 1.60 m [bet]
  // What-ifs on the bets, for the sensitivity of the finding (tools/girder_tests.js); every one still closes exactly:
  //   a: Prohaska's end ordinate (0.4 to 0.75 brackets the values seen); lightship: t; remainder: [x0, x1];
  //   coal: 'plant'; cargo: t; zAll: every layer at the model's KG (the note's first cut for the heights);
  //   shape: 'buoyancy': HANDOFF 4d's curve with fewer bets, everything but the machinery spread like her intact buoyancy at
  //   the night's pose (sim.pose0), closed in LCG by a straight tilt [the note: a cross-check that understates the hog]
  const DEFAULT_VARIANT = {};

  // linear pieces: { x0, x1, w0, w1 (t/m at each end), z (m), layer }
  function piece(x0, x1, w0, w1, z, layer) { return { x0, x1, w0, w1, z, layer }; }
  // mass and first moment of a piece over [lo, hi] (t, t m): exact for a linear density
  function integ(p, lo, hi) {
    const u0 = lo > p.x0 ? lo : p.x0, u1 = hi < p.x1 ? hi : p.x1;
    if (!(u1 > u0)) return null;
    const s = (p.w1 - p.w0) / (p.x1 - p.x0), a = p.w0 + s * (u0 - p.x0), b = p.w0 + s * (u1 - p.x0), d = u1 - u0;
    return [0.5 * (a + b) * d, d / 6 * (a * (2 * u0 + u1) + b * (u0 + 2 * u1))];
  }

  const CURVES = new WeakMap();    // ship -> Map(mass properties and variant -> curve): outside the sim, so a call writes nothing into it
  function weight(sim, variant) {
    const ship = sim.ship, ms = sim.ms / 1000, xG = sim.g0[0], yG = sim.g0[1], KG = sim.g0[2], V = variant || DEFAULT_VARIANT;
    let byShip = CURVES.get(ship); if (!byShip) { byShip = new Map(); CURVES.set(ship, byShip); }
    const p0 = V.shape === 'buoyancy' ? sim.pose0 : null;
    const key = ms + '|' + xG + '|' + yG + '|' + KG + '|' + JSON.stringify(V) + (p0 ? '|' + p0.zO + '|' + p0.pitch + '|' + p0.roll : '');
    let cv = byShip.get(key); if (cv) return cv;
    cv = buildCurve(sim, ms, xG, yG, KG, V);
    byShip.set(key, cv);
    return cv;
  }
  function buildCurve(sim, ms, xG, yG, KG, V) {
    const ship = sim.ship, D = shipData(ship);
    let layers = fixedLayers(V);
    const mach = layers.filter(l => l.machinery).reduce((s, l) => s + l.m, 0);
    const xs = ZB[ZB.length - 1], xf = ZB[0], Lh = xf - xs;
    const a = V.a === undefined ? PROHASKA_A : V.a, b = (3 - a) / 2;
    const P = [];
    let lay, hullInfo;
    if (V.shape === 'buoyancy') {
      // HANDOFF 4d: the machinery as above; everything else, sim.ms less the machinery, spread like her intact buoyancy at
      // the night's pose (by column slice), tilted in a straight line to close her LCG, at the one height that closes KG
      layers = layers.filter(l => l.machinery);
      const F0 = C.poseFrame(sim, sim.pose0.zO, sim.pose0.pitch, sim.pose0.roll, {}), c = ship.cols, iR = 1 / F0.R22;
      const b0 = new Float64Array(D.nS);
      for (let i = 0; i < c.N; i++) { const zp = -(F0.R20 * c.x[i] + F0.R21 * c.y[i] + F0.tz) * iR; if (zp > c.zlo[i]) b0[D.colSlice[i]] += c.dxdy[i] * ((zp >= c.zhi[i] ? c.zhi[i] : zp) - c.zlo[i]); }
      let B0 = 0, xb = 0; for (let j = 0; j < D.nS; j++) { B0 += b0[j]; xb += b0[j] * D.xc[j]; } xb /= B0;
      let I2 = 0; for (let j = 0; j < D.nS; j++) I2 += b0[j] * (D.xc[j] - xb) * D.xc[j];
      const restM = ms - mach, momMach = layers.reduce((s, l) => s + l.m * 0.5 * (l.x0 + l.x1), 0);
      const kap = (((ms * xG - momMach) / restM) - xb) / (I2 / B0);
      const zr = V.zAll ? KG : (ms * KG - layers.reduce((s, l) => s + l.m * (l.z === null ? KG : l.z), 0)) / restM;
      const shaped = { name: 'Everything but the machinery, as her intact buoyancy', m: restM, x0: xs, x1: xf, z: zr, tag: 'HANDOFF 4d [bet]: sim.ms less the machinery, shaped like b0(x), tilted to close the LCG', shape: 'slices' };
      lay = layers.concat([shaped]);
      layers.forEach((l, i) => { if (l.z === null) l.z = KG; P.push(piece(l.x0, l.x1, l.m / (l.x1 - l.x0), l.m / (l.x1 - l.x0), l.z, i)); });
      for (let j = 0; j < D.nS; j++) {
        const wj = restM * b0[j] / B0 * (1 + kap * (D.xc[j] - xb)) / D.dx[j];
        if (b0[j] > 0) P.push(piece(D.e[j], D.e[j + 1], wj, wj, zr, lay.length - 1));
      }
      hullInfo = { xs, xf, L: Lh, shape: 'buoyancy', tilt: kap, z: zr };
    } else {
      // the hull, its structure and outfit: the lightship less the machinery [search summary; derived], as Prohaska's
      // trapezoid over her whole length (the model's own profile, stern tip to stem head: the note's "about -137 to +130")
      let Wh = (V.lightship === undefined ? LIGHTSHIP : V.lightship) - mach;
      let rest = ms - layers.reduce((s, l) => s + l.m, 0) - Wh;
      if (rest < 0) { Wh += rest; rest = 0; }    // a lighter sim than these layers: the hull gives way, never below zero
      const R0 = V.remainder || REMAINDER;
      const aTag = a === PROHASKA_A ? '[fitted: the panel\'s C-7 moment at 35,000 t aboard as weighed, to 0.1 %, on the landed model (D92)]' : (a === PROHASKA_A_NOTE ? '[bet: the note\'s textbook recollection]' : '[what-if]');
      const hull = { name: 'Hull, structure and outfit', m: Wh, x0: xs, x1: xf, z: 0, tag: 'lightship [search summary] less the machinery; Prohaska\'s trapezoid, a = ' + a + ' ' + aTag + '; height closes KG [derived]', shape: 'trapezoid' };
      const rem = { name: 'Remainder (water, stores, double-bottom liquids)', m: rest, x0: R0[0], x1: R0[1], z: V.zAll ? null : Z_REMAINDER, tag: 'mass closes sim.ms [derived]; place and height [bet]', shape: 'uniform' };
      lay = layers.concat([hull, rem]);
      // LCG closure (Prohaska): the trapezoid's end ordinates moved by equal and opposite amounts, +d forward and -d aft
      // (in W/L), keep its area and move its centroid 7 d L / 54 [derived: two end triangles of height d over L/3]
      const mom = (l) => l.m * 0.5 * (l.x0 + l.x1);
      const others = layers.reduce((s, l) => s + mom(l), 0) + mom(rem);
      let d = Wh > 0 ? (ms * xG - others - Wh * 0.5 * (xs + xf)) / (7 * Wh * Lh / 54) : 0;
      let slide = 0;
      if (Math.abs(d) > 0.9 * a) {               // not this ship: a centre too far out for the trapezoid; slide the remainder
        const dd = Math.sign(d) * 0.9 * a;
        slide = rest > 0 ? (ms * xG - others - Wh * 0.5 * (xs + xf) - 7 * dd * Wh * Lh / 54) / rest : 0;
        d = dd; rem.x0 += slide; rem.x1 += slide;
      }
      const wl = Wh / Lh;
      // height closure: the hull's own weight acts where the others leave KG [derived]
      for (const l of lay) if (l.z === null) l.z = KG;
      const zOthers = layers.reduce((s, l) => s + l.m * l.z, 0) + rem.m * rem.z;
      hull.z = V.zAll ? KG : (Wh > 0 ? (ms * KG - zOthers) / Wh : 0);
      lay.forEach((l, i) => {
        if (l.shape === 'trapezoid') {
          const x1 = xs + Lh / 3, x2 = xs + 2 * Lh / 3;
          P.push(piece(xs, x1, (a - d) * wl, b * wl, l.z, i), piece(x1, x2, b * wl, b * wl, l.z, i), piece(x2, xf, b * wl, (a + d) * wl, l.z, i));
        } else if (l.m > 0) P.push(piece(l.x0, l.x1, l.m / (l.x1 - l.x0), l.m / (l.x1 - l.x0), l.z, i));
      });
      hullInfo = { xs, xf, L: Lh, a, ends: [a - d, a + d], b, d, z: hull.z, slide };
    }
    for (const l of lay) if (l.z === null) l.z = KG;
    // its own integrals, from the pieces (the closure checks read these, not the bookkeeping above)
    let M = 0, Mx = 0, Mz = 0;
    for (const p of P) { const r = integ(p, -1e9, 1e9); M += r[0]; Mx += r[1]; Mz += r[0] * p.z; }
    for (const l of lay) { let m = 0, mx = 0; for (const p of P) if (lay[p.layer] === l) { const r = integ(p, -1e9, 1e9); m += r[0]; mx += r[1]; } l.xc = m > 0 ? mx / m : 0.5 * (l.x0 + l.x1); }
    // per column slice of this ship: mass, first moment, z moment (kg, kg m), for the beam form and the prefix sums
    const nS = D.nS, sm = new Float64Array(nS), smx = new Float64Array(nS), smz = new Float64Array(nS);
    for (let j = 0; j < nS; j++) for (const p of P) { const r = integ(p, D.e[j], D.e[j + 1]); if (r) { sm[j] += r[0] * 1000; smx[j] += r[1] * 1000; smz[j] += r[0] * p.z * 1000; } }
    return { ms, xG, yG, KG, variant: V, layers: lay, pieces: P, total: M, lcg: Mx / M, vcg: Mz / M, machinery: mach, hull: hullInfo, slice: { m: sm, mx: smx, mz: smz } };
  }
  // the weight per metre at x (t/m); w(curve, x, layer) for one layer alone
  function w(cv, x, layer) {
    let s = 0;
    for (const p of cv.pieces) {
      if (layer !== undefined && p.layer !== layer) continue;
      if (x >= p.x0 && x < p.x1) s += p.w0 + (p.w1 - p.w0) * (x - p.x0) / (p.x1 - p.x0);
    }
    return s;
  }
  // the weight aft of x: mass, first moment in x, moment in z (kg, kg m)
  function aftOf(cv, x, out) {
    let m = 0, mx = 0, mz = 0;
    for (const p of cv.pieces) {
      if (p.x0 >= x) continue;
      const r = integ(p, p.x0, x); if (!r) continue;
      m += r[0]; mx += r[1]; mz += r[0] * p.z;
    }
    out[0] = m * 1000; out[1] = mx * 1000; out[2] = mz * 1000;
    return out;
  }

  // ---------------------------------------------------------------- the ship's columns by slice (static per ship)
  const SHIPS = new WeakMap();
  function shipData(ship) {
    let d = SHIPS.get(ship); if (d) return d;
    const sl = ship.cols.slices.slice().sort((a, b) => a.xc - b.xc);       // from the stern forward
    const nS = sl.length, e = new Float64Array(nS + 1), xc = new Float64Array(nS), dx = new Float64Array(nS), zone = new Int32Array(nS);
    const colSlice = new Int32Array(ship.cols.N);
    for (let j = 0; j < nS; j++) {
      const s = sl[j]; xc[j] = s.xc; dx[j] = s.dx; zone[j] = s.zone; e[j] = s.xc - 0.5 * s.dx;
      for (let i = s.first; i < s.first + s.count; i++) colSlice[i] = j;
    }
    e[nS] = sl[nS - 1].xc + 0.5 * sl[nS - 1].dx;
    // the break band's stations: every column boundary from K to J, every half metre between, and the named points
    const xs = [];
    for (let j = 0; j <= nS; j++) if (e[j] >= BAND[0] - 1e-6 && e[j] <= BAND[1] + 1e-6) xs.push(e[j]);
    for (let x = -16.5; x >= -27.0 - 1e-9; x -= 0.5) xs.push(Math.round(x * 10) / 10);
    xs.push(-22.4, -25.1, CAP.joint.x + CAP.joint.half);
    xs.sort((a, b) => a - b);
    const band = []; for (const x of xs) if (!band.length || x - band[band.length - 1] > 1e-6) band.push(x);
    // each zone's slices (a run of them: the slices are cut zone by zone); scratch for the water's spread
    const zoneSlices = []; for (let k = 0; k < 16; k++) { let a = nS, b = 0; for (let j = 0; j < nS; j++) if (zone[j] === k) { a = Math.min(a, j); b = Math.max(b, j + 1); } zoneSlices.push([a, b]); }
    d = { nS, e, xc, dx, zone, colSlice, band: Float64Array.from(band), zoneSlices, tV: new Float64Array(nS), tY: new Float64Array(nS), tZ: new Float64Array(nS) };
    SHIPS.set(ship, d);
    return d;
  }

  // ---------------------------------------------------------------- the flood water, column by column
  // Each space's free surface for this pose and the water now in it, as the core's next step will find it (solveLevels:
  // the same merging of port and starboard, the same columns, its permeability), spread over the columns and summed by
  // slice: volume, and its moments in y and z (m3, m4). The core keeps a level from the start of the last step; this
  // solves it again for the pose and the water as they stand now, then scales the spread to the water exactly.
  function waterBySlice(sim, F, D, fV, fY, fZ) {
    const ship = sim.ship, c = ship.cols, iR = 1 / F.R22, tV = D.tV, tY = D.tY, tZ = D.tZ;
    let j0 = 0, j1 = 0, dv = 0, zmin = 0, zmax = 0;
    // the water under world level h in nodes n1 (and n2, a merged pair), by slice into the scratch (the zone's slices
    // only); returns its volume, and leaves the free surface's area per metre of h in dv. `bounds`: also find the
    // world heights of the spaces' lowest and highest points
    const pass = (n1, n2, h, bounds) => {
      for (let j = j0; j < j1; j++) { tV[j] = 0; tY[j] = 0; tZ[j] = 0; }
      let vol = 0, a2 = 0; zmin = 1e9; zmax = -1e9;
      for (let q = 0; q < 2; q++) {
        const n = q === 0 ? n1 : n2; if (n < 0) continue;
        const mu = ship.nodeMu[n], s1 = ship.nodeStart[n] + ship.nodeCount[n];
        for (let j = ship.nodeStart[n]; j < s1; j++) {
          const i = ship.entCol[j], a = ship.entA[j], b = ship.entE[j], base = F.R20 * c.x[i] + F.R21 * c.y[i] + F.tz;
          if (bounds) { const wa = base + F.R22 * a, wb = base + F.R22 * b; if (wa < zmin) zmin = wa; if (wb > zmax) zmax = wb; }
          const zp = (h - base) * iR;
          if (zp <= a) continue;
          let L; if (zp >= b) L = b - a; else { L = zp - a; a2 += c.dxdy[i] * mu; }
          const v = c.dxdy[i] * L * mu, k = D.colSlice[i];
          vol += v; tV[k] += v; tY[k] += v * c.y[i]; tZ[k] += v * (a + 0.5 * L);
        }
      }
      dv = a2 * iR;
      return vol;
    };
    const spread = (k, n1, n2, V, h0) => {
      if (!(V > 1e-6)) return;
      j0 = D.zoneSlices[k][0]; j1 = D.zoneSlices[k][1];
      const Vmax = ship.nodeVmax[n1] + (n2 >= 0 ? ship.nodeVmax[n2] : 0);
      let vol = pass(n1, n2, 1e9, true);            // the whole space, and its bounds
      if (!(zmax > zmin) || !(vol > 0)) return;
      if (V < Vmax * (1 - 1e-7)) {                  // not full: find the level, from the core's last one (Newton, bracketed)
        let lo = zmin, hi = zmax, h = h0 > lo && h0 < hi ? h0 : 0.5 * (lo + hi);
        const tol = 1e-7 * Vmax + 1e-4;
        for (let it = 0; it < 40; it++) {
          vol = pass(n1, n2, h, false);
          const err = vol - V;
          if (Math.abs(err) < tol) break;
          if (err > 0) hi = h; else lo = h;
          let hn = dv > 1e-9 ? h - err / dv : 0.5 * (lo + hi);
          if (!(hn > lo && hn < hi)) hn = 0.5 * (lo + hi);
          h = hn;
        }
      }                                             // full, or pressed up: the whole space carries all its water
      const s = vol > 0 ? V / vol : 0;              // the last pass, scaled to the water exactly
      for (let j = j0; j < j1; j++) { fV[j] += tV[j] * s; fY[j] += tY[j] * s; fZ[j] += tZ[j] * s; }
    };
    // C5 (the calibration epoch, dark until its landing): with params.weighOverfill 0 the core's loads weigh a full space
    // at its capacity, each space on its own, min(vol, nodeVmax); the excess is the sea's head over its top on a stiff
    // virtual area, pressure and not water. The gauge weighs as the core does, by the core's own test of the switch
    // (C.eachWater's), so that its water's total is C.weighedWater's (tools/girder_tests.js holds it). With 1, the
    // default, every space weighs its whole vol, as before, to the bit. A pocket follows through C.pocketPoints.
    const cut = !sim.params.weighOverfill, vm = ship.nodeVmax;
    const W = (n) => (cut ? Math.min(sim.vol[n], vm[n]) : sim.vol[n]);
    for (let k = 0; k < 16; k++) for (let L = 0; L < 2; L++) {
      const nP = C.nodeIndex(k, 0, L), nS = C.nodeIndex(k, 1, L), g = k * 2 + L;
      let merged = sim.mergeAlways[g] === 1;
      if (!merged && L === 0) {
        const zMw = C.worldZ(F, ship.zones[k].xm, 0, sim.zMerge[k]);
        merged = sim.vol[nP] > 1e-6 && sim.vol[nS] > 1e-6 && sim.level[nP] > zMw + 0.05 && sim.level[nS] > zMw + 0.05;
      }
      if (merged) spread(k, nP, nS, W(nP) + W(nS), sim.level[nP]);
      else { spread(k, nP, -1, W(nP), sim.level[nP]); spread(k, nS, -1, W(nS), sim.level[nS]); }
    }
    // W6: a pocket's water (the bunker of the fire) as the core weighs it (C.pocketPoints), in the slice where it stands
    if (sim.pockets) for (const pk of sim.pockets) {
      if (!(pk.vol > 0)) continue;
      const pts = C.pocketPoints(sim, F, pk);
      for (let i = 0; i < pts.length; i += 4) {
        const x = pts[i + 1]; let j = -1;
        for (let q = 0; q < D.nS; q++) { const a = Math.min(D.e[q], D.e[q + 1]), b = Math.max(D.e[q], D.e[q + 1]); if (x >= a && x < b) { j = q; break; } }
        if (j >= 0) { fV[j] += pts[i]; fY[j] += pts[i] * pts[i + 2]; fZ[j] += pts[i] * pts[i + 3]; }
      }
    }
  }

  // ---------------------------------------------------------------- the moment
  function where(x) {
    if (Math.abs(x - XJ) < 0.05) return 'bulkhead J';
    if (Math.abs(x - XK) < 0.05) return 'bulkhead K';
    const n = C.ZONES[C.zoneAt(x)].name;
    return n.charAt(0) === 'N' ? n : n.charAt(0).toLowerCase() + n.slice(1);
  }
  // opts: { reading: 'relieved' (the default: her inertia counted) or 'stern' (the note's: integrated from the stern),
  //         joint: true for the aft joint's 10 % knock-down [bet; off by default], cap: the central capacity in hogging
  //         for the ratio (N m, default CAP.hog), variant: a what-if weight curve (weight(); VARIANTS.note is the note's),
  //         loads: true for b, w, f per metre by slice }
  // The result's M is the reading's moment; Mstern, Mrel and Mfwd are all given beside it (gov, band, at(x)).
  function moment(sim, opts) {
    opts = opts || {};
    const ship = sim.ship, D = shipData(ship), cv = weight(sim, opts.variant), F = C.frameOf(sim), nS = D.nS, c = ship.cols;
    const cap0 = opts.cap === undefined ? CAP.hog : opts.cap, rel = opts.reading !== 'stern', joint = !!opts.joint;
    // buoyancy by slice, exactly as the core's hydroPass integrates it: each column under the world's plane Z = 0, cut at
    // its own centre line; its centre of buoyancy at (x, y, lo + s/2)
    const bV = new Float64Array(nS), bY = new Float64Array(nS), bZ = new Float64Array(nS);
    const iR = 1 / F.R22;
    for (let i = 0; i < c.N; i++) {
      const x = c.x[i], y = c.y[i], lo = c.zlo[i], hi = c.zhi[i];
      const zp = -(F.R20 * x + F.R21 * y + F.tz) * iR;
      if (zp <= lo) continue;
      const s = zp >= hi ? hi - lo : zp - lo, v = c.dxdy[i] * s, k = D.colSlice[i];
      bV[k] += v; bY[k] += v * y; bZ[k] += v * (lo + 0.5 * s);
    }
    const fV = new Float64Array(nS), fY = new Float64Array(nS), fZ = new Float64Array(nS);
    waterBySlice(sim, F, D, fV, fY, fZ);
    // the columns' net upward force by slice (buoyancy less the water in her), N, and its moments in y and z; prefix sums
    // from the stern, so that the part aft of any slice edge is one subtraction
    const rg = RHO * GRAV, P0 = new Float64Array(nS + 1), PX = new Float64Array(nS + 1), PY = new Float64Array(nS + 1), PZ = new Float64Array(nS + 1);
    for (let j = 0; j < nS; j++) {
      const f = rg * (bV[j] - fV[j]);
      P0[j + 1] = P0[j] + f; PX[j + 1] = PX[j] + f * D.xc[j]; PY[j + 1] = PY[j] + rg * (bY[j] - fY[j]); PZ[j + 1] = PZ[j] + rg * (bZ[j] - fZ[j]);
    }
    const yG = cv.yG, tmp = [0, 0, 0];
    // everything aft of x: net upward force and its moments, columns and weights (N, N m)
    const aft = (x, out) => {
      let j = 0;
      if (x >= D.e[nS]) j = nS; else if (x > D.e[0]) { let lo = 0, hi = nS; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (D.e[m] <= x) lo = m; else hi = m; } j = lo; }
      let s0 = P0[j], sx = PX[j], sy = PY[j], sz = PZ[j];
      if (j < nS && x > D.e[j]) {                // part of slice j: its loads are even along it
        const fr = (x - D.e[j]) / D.dx[j], f = P0[j + 1] - P0[j];
        s0 += fr * f; sx += fr * f * (D.e[j] + 0.5 * fr * D.dx[j]); sy += fr * (PY[j + 1] - PY[j]); sz += fr * (PZ[j + 1] - PZ[j]);
      }
      aftOf(cv, x, tmp);
      out[0] = s0 - GRAV * tmp[0]; out[1] = sx - GRAV * tmp[1]; out[2] = sy - GRAV * yG * tmp[0]; out[3] = sz - GRAV * tmp[2];
      return out;
    };
    // the exact form at x: about (x, 0, Z_NA), the horizontal axis across her (P_X - Q_X = R00 dx + R01 dy + R02 dz)
    const s4 = [0, 0, 0, 0], all = aft(D.e[nS] + 1, [0, 0, 0, 0]);
    const exact = (x, o) => {
      aft(x, s4);
      const S = s4[0], Mx = s4[1] - x * S, My = s4[2], Mz = s4[3] - Z_NA * S;
      o.Mstern = F.R00 * Mx + F.R01 * My + F.R02 * Mz;
      o.D = F.R01 * My + F.R02 * Mz;                            // what the beam form drops
      o.Mvert = F.R22 * Mx - F.R20 * Mz;                        // about her own deck axis (ship frame y)
      o.V = -F.R00 * S;
      // every force on her about the same axis: zero at rest; in motion the dynamic term, so that the moment taken from
      // the bow (the part forward of x) is the stern's less it. The two bracket the moment her inertia would give.
      o.R = F.R00 * (all[1] - x * all[0]) + F.R01 * all[2] + F.R02 * (all[3] - Z_NA * all[0]);
      o.Mfwd = o.Mstern - o.R;
      const rl = relief(x);
      o.Mrel = o.Mstern + rl;
      o.M = rel ? o.Mrel : o.Mstern;                            // the reading's
      // About HER OWN axes (B1+B2, 2026-11-24, e124: the onset's check at a list). The reading above is about the
      // horizontal axis across her. Her capacity Mu bends about her deck axis (y), and a list turns part of the vertical
      // forces' moment onto her vertical axis (z). So:
      // - MvertRel is Mvert relieved by her inertia as Mrel is;
      // - Mlat is the moment about her z (R21 Mx - R20 My), and MlatRel the same relieved. The relief's loads are
      //   vertical, along her centre line at the neutral axis: their normal part counts about her y, their lateral part
      //   about her z;
      // - Vz and Vlat are the shear's parts along her z and her y.
      // New fields only: the reading M and every figure before them stand to the bit.
      o.MvertRel = o.Mvert + (F.R22 / F.R00) * rl;
      o.Mlat = F.R21 * Mx - F.R20 * My;
      o.MlatRel = o.Mlat + (F.R21 / F.R00) * rl;
      o.Vz = -F.R22 * S; o.Vlat = -F.R21 * S;
      return o;
    };
    // Relieved by her inertia: what is left over (all the loads' force and moment, zero at rest) balanced by a rigid
    // acceleration of her mass, so that the moment is the same taken from either end. The mass by slice is her own (from
    // the weight curve, with the core's added mass in heave spread like it, params.addedHeave) and the water in her
    // [bet: how the added mass and the damping lie along her]. p_j = -mu_j (A + B (x_j - x_mu)): sum p = -sum F and
    // their moment about x_mu = -R(x_mu).
    const kA = 1 + (sim.params.addedHeave || 0);
    let mu0 = 0, mux = 0;
    const mu = new Float64Array(nS);
    for (let j = 0; j < nS; j++) { mu[j] = kA * cv.slice.m[j] + RHO * fV[j]; mu0 += mu[j]; mux += mu[j] * D.xc[j]; }
    const xmu = mux / mu0;
    let Imu = 0; for (let j = 0; j < nS; j++) Imu += mu[j] * (D.xc[j] - xmu) * (D.xc[j] - xmu);
    const Rmu = F.R00 * (all[1] - xmu * all[0]) + F.R01 * all[2] + F.R02 * (all[3] - Z_NA * all[0]);
    const pA = all[0] / mu0, pB = Rmu / (F.R00 * Imu);
    const Q0 = new Float64Array(nS + 1), QX = new Float64Array(nS + 1);
    for (let j = 0; j < nS; j++) { const p = -mu[j] * (pA + pB * (D.xc[j] - xmu)); Q0[j + 1] = Q0[j] + p; QX[j + 1] = QX[j] + p * D.xc[j]; }
    const relief = (x) => {                        // the moment of the inertial loads aft of x about x (cos(trim) lever)
      let j = 0;
      if (x >= D.e[nS]) j = nS; else if (x > D.e[0]) { let lo = 0, hi = nS; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (D.e[m] <= x) lo = m; else hi = m; } j = lo; }
      let s0 = Q0[j], sx = QX[j];
      if (j < nS && x > D.e[j]) { const fr = (x - D.e[j]) / D.dx[j], p = Q0[j + 1] - Q0[j]; s0 += fr * p; sx += fr * p * (D.e[j] + 0.5 * fr * D.dx[j]); }
      return F.R00 * (sx - x * s0);
    };
    // the beam form at the slice edges: V and M integrated from the stern (q even along each slice; trapezoids)
    const Vb = new Float64Array(nS + 1), Mb = new Float64Array(nS + 1), Fs = new Float64Array(nS);
    for (let j = 0; j < nS; j++) {
      Fs[j] = (P0[j + 1] - P0[j]) - GRAV * cv.slice.m[j];
      Vb[j + 1] = Vb[j] - F.R00 * Fs[j];
      Mb[j + 1] = Mb[j] + 0.5 * (Vb[j] + Vb[j + 1]) * D.dx[j];
    }
    const beamAt = (x) => {
      let j = 0; while (j < nS - 1 && D.e[j + 1] <= x) j++;
      const u = x - D.e[j], dV = Vb[j + 1] - Vb[j];
      return [Vb[j] + dV * u / D.dx[j], Mb[j] + Vb[j] * u + 0.5 * dV * u * u / D.dx[j]];
    };
    // along the whole hull, at every slice edge (M the reading's; the closure is the stern's: what is left at the bow)
    const hull = { x: Float64Array.from(D.e), M: new Float64Array(nS + 1), Mstern: new Float64Array(nS + 1), Mrel: new Float64Array(nS + 1), V: new Float64Array(nS + 1), D: new Float64Array(nS + 1), Mbeam: Mb, Vbeam: Vb,
      MvertRel: new Float64Array(nS + 1), MlatRel: new Float64Array(nS + 1), Vz: new Float64Array(nS + 1) };
    const o = {};
    let pk = 0, pkx = 0, spk = 0, Vpk = 0, Mbpk = 0, Vbpk = 0;
    for (let j = 0; j <= nS; j++) {
      exact(D.e[j], o); hull.M[j] = o.M; hull.Mstern[j] = o.Mstern; hull.Mrel[j] = o.Mrel; hull.V[j] = o.V; hull.D[j] = o.D;
      hull.MvertRel[j] = o.MvertRel; hull.MlatRel[j] = o.MlatRel; hull.Vz[j] = o.Vz;
      if (j < nS && Math.abs(o.M) > Math.abs(pk)) { pk = o.M; pkx = D.e[j]; }
      if (j < nS) { spk = Math.max(spk, Math.abs(o.Mstern)); Vpk = Math.max(Vpk, Math.abs(o.V)); Mbpk = Math.max(Mbpk, Math.abs(Mb[j])); Vbpk = Math.max(Vbpk, Math.abs(Vb[j])); }
    }
    // the break band: the governing station is the largest moment over capacity (with no knock-down, the largest moment)
    const B = D.band, nb = B.length;
    const band = { x: Float64Array.from(B), M: new Float64Array(nb), Mstern: new Float64Array(nb), Mfwd: new Float64Array(nb), Mrel: new Float64Array(nb), Mbeam: new Float64Array(nb), V: new Float64Array(nb), D: new Float64Array(nb), Mvert: new Float64Array(nb), cap: new Float64Array(nb), ratio: new Float64Array(nb),
      MvertRel: new Float64Array(nb), MlatRel: new Float64Array(nb), Vz: new Float64Array(nb) };
    let gi = 0, bpi = 0;
    for (let i = 0; i < nb; i++) {
      exact(B[i], o);
      band.M[i] = o.M; band.Mstern[i] = o.Mstern; band.Mfwd[i] = o.Mfwd; band.Mrel[i] = o.Mrel; band.V[i] = o.V; band.D[i] = o.D; band.Mvert[i] = o.Mvert; band.Mbeam[i] = beamAt(B[i])[1];
      band.MvertRel[i] = o.MvertRel; band.MlatRel[i] = o.MlatRel; band.Vz[i] = o.Vz;
      const sag = o.M < 0;
      band.cap[i] = sag ? CAP.sag : capacity(B[i], cap0, 'hog', joint);
      band.ratio[i] = (sag ? -o.M : o.M) / band.cap[i];
      if (band.ratio[i] > band.ratio[gi]) gi = i;
      if (o.M > band.M[bpi]) bpi = i;
    }
    const gov = { i: gi, x: B[gi], M: band.M[gi], cap: band.cap[gi], ratio: band.ratio[gi], zone: zone(band.M[gi]), sense: band.M[gi] < 0 ? 'sagging' : 'hogging', where: where(B[gi]),
      Mstern: band.Mstern[gi], Mrel: band.Mrel[gi], Mfwd: band.Mfwd[gi], Mbeam: band.Mbeam[gi], D: band.D[gi], Mvert: band.Mvert[gi] };
    // at the bow: what is left over from the stern (zero at rest; the dynamic term in motion)
    const nE = nS;
    const closure = {
      M: hull.Mstern[nE], V: hull.V[nE], Mpeak: spk, Vpeak: Vpk,
      Mshare: spk > 0 ? Math.abs(hull.Mstern[nE]) / spk : 0, Vshare: Vpk > 0 ? Math.abs(hull.V[nE]) / Vpk : 0,
      Mbeam: Mb[nE], Vbeam: Vb[nE], MbeamShare: Mbpk > 0 ? Math.abs(Mb[nE]) / Mbpk : 0, VbeamShare: Vbpk > 0 ? Math.abs(Vb[nE]) / Vbpk : 0,
    };
    const res = {
      t: sim.t, trimDeg: sim.pitch * 180 / Math.PI, listDeg: sim.roll * 180 / Math.PI, reading: rel ? 'relieved' : 'stern', joint,
      gov, band, hull, peak: { x: pkx, M: pk }, bandPeak: { x: B[bpi], M: band.M[bpi] }, closure,
      at: (x) => { const r = exact(x, {}); r.Mbeam = beamAt(x)[1]; r.Vbeam = beamAt(x)[0]; return r; },
    };
    if (opts.loads) {                              // per metre of her length, by slice: tonnes a metre
      const n = nS, L = { x: Float64Array.from(D.xc), b: new Float64Array(n), w: new Float64Array(n), f: new Float64Array(n) };
      for (let j = 0; j < n; j++) { L.b[j] = RHO * bV[j] / D.dx[j] / 1000; L.f[j] = RHO * fV[j] / D.dx[j] / 1000; L.w[j] = cv.slice.m[j] / D.dx[j] / 1000; }
      res.loads = L;
    }
    return res;
  }
  // the gauge's words: "hogging at bulkhead J" (where), "hull 4.3 GN m, hogging at bulkhead J" (describe)
  function placeOf(g) { return g.sense + (/^bulkhead/.test(g.where) ? ' at ' : ' over ') + g.where; }
  function describe(res) { return 'hull ' + (res.gov.M / 1e9).toFixed(1) + ' GN m, ' + placeOf(res.gov); }

  return { CAP, BAND, X_BREAK, Z_NA, RECORD, capacity, zone, weight, w, aftOf, moment, describe, placeOf, where, shipData, LIGHTSHIP, PROHASKA_A, PROHASKA_A_NOTE, VARIANTS };
});

/*
 * The observation ledger's operators (the calibration epoch, stage A3; the design, section 3.2; P-D1). The ledger is
 * data: core/scenarios.js RECORD_1912, one row for one thing one witness saw. This file reads a run against it.
 *
 *   start(sim)             a fresh run for this sim: { dtS, samples: [], pockets: [...], events, founderT, onsetT }
 *   sample(sim)            her state now as plain data: time, trim, list, the pose's third row, the 64 levels and
 *                          volumes, each pocket's water, the water aboard
 *   take(run, sim)         push sample(sim) onto the run (call it every 5 s of her time)
 *   close(run, sim, more)  the run's end: the core's own events (copied), the founder's time; more.onsetT, if the caller
 *                          ran core/readers/onset.js beside it
 *   evaluate(row, run)     one row's operator: { model, lo, hi, min, max, inRange, miss, reach, late, trimAtReach, note }
 *   evaluateAll(rows, run) the same for every row, in order
 *   problems(row)          what is wrong with a row's form (empty when it has the schema's fields and a known kind)
 *   series(row, run)       the row's quantity at every sample (the level kinds), for a chart or a test
 *
 * It is not a reader in the registering sense, as core/readers/girder.js is not: it keeps no state, registers nothing
 * with core/night.js, owns no orders. Nothing here writes into a sim: no event, no flag, no cache on it. So a run or a
 * watch has the same bits with it bundled, and with it sampling, as without (tools/ledger_tests.js). Its operators are
 * pure functions of a run's samples and a row; they use only the core's public functions (worldZ, deckZ, nodeIndex,
 * zoneAt, readouts, frameOf) and the state a snapshot carries (the pose, sim.level, sim.vol, the pockets' water).
 *
 * The operators, by kind. A level is in metres over the row's place, + up; `value` is the level the witness saw there.
 *   sea_at     the sea outside over the place: -worldZ(place). A witness who looked down a hatch or a stair is one of
 *              these: the trunk stood at the sea's level before the rooms beside it filled (QC E, E-12)
 *   water_in   the water inside the space the place lies in (its zone, its side, below or above E deck), over the
 *              place: sim.level of that space less worldZ(place); a dry space reads its floor (the tank top below E
 *              deck, E deck above). A place inside a holding pocket reads the pocket's own water, placed as the core
 *              places it: min(vol, cap) of its height (P-D1: place min(vol, cap), count vol)
 *   sounding   the depth of the space's own water over its floor at the place's x, on the centreline, the deeper side;
 *              0 when dry. A holding pocket's water is not the space's (boiler room 5's stokehold with the bunker of
 *              the fire holding is dry)
 *   angle      trim (+ by the bow) or list (+ to starboard), in degrees
 *   tonnage    the water aboard in tonnes, pockets counted whole (C.readouts(sim).waterM3 x 1.025)
 *   event      the time of one of the core's own events (place.mark: its id in sim.events), in minutes; or `toPort`,
 *              the last time she goes over to port past half a degree before T 150 (tools/pocket_tests.js's rule for
 *              D62's change of side), from the samples. One that never comes reads the run's end, with a note
 *   end        the founder flag's time, or the onset of the break's (run.onsetT, from core/readers/onset.js), minutes
 *
 * The verdict. The band is [value - sigma, value + sigma] (`two`; sigma null counts 0), value - sigma and up (`lower`),
 * value + sigma and down (`upper`), or sigma's own [lo, hi] (`interval`). For a level kind the model is read over the
 * row's time window, tLo to tHi: the row is in range when the model's values in the window meet the band (for a level
 * that only rises, that is "it passes the witness's level inside the window", or for a lower bound "it is there by the
 * window's end"). `model` is the value at t; `miss` how far that is outside the band (0 inside, signed); `reach` the
 * first time the quantity is at `value` and `late` how far that lies outside the window (minutes; + late, - early).
 * For an event or the end the model is a time and the band is in minutes.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../core.js'));
  else root.TitanicLedger = factory(root.TitanicCore);
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';
  if (!C) return null;
  const DEG = 180 / Math.PI, NN = C.NN, EPS = 1e-6;
  const FIELDS = ['id', 'witness', 'source', 'group', 'kind', 'place', 'value', 'unit', 't', 'tLo', 'tHi', 'sided', 'sigma', 'disc', 'role', 'tag', 'was'];
  const KINDS = ['sea_at', 'water_in', 'sounding', 'angle', 'event', 'tonnage', 'end'];
  const LEVEL_KINDS = ['sea_at', 'water_in', 'sounding', 'angle', 'tonnage'];   // read at a time; the others are times
  const SIDED = ['two', 'lower', 'upper', 'interval'];
  const ROLES = ['fit', 'held', 'report'];
  const UNITS = { sea_at: 'm', water_in: 'm', sounding: 'm', angle: 'deg', tonnage: 't', event: 'min', end: 'min' };

  // ------------------------------------------------------------------ the run: plain data taken from a sim
  function start(sim) {
    return {
      dtS: null, samples: [], events: [], founderT: null, onsetT: null, endT: null,
      pockets: (sim.pockets || []).map(k => ({ name: k.name, node: k.node, side: k.side, x0: k.x0, x1: k.x1, z0: k.z0, z1: k.z1, cap: k.cap, xc: k.xc, yc: k.yc, deck: k.deck || null })),
    };
  }
  function sample(sim) {
    const F = C.frameOf(sim);
    return {
      t: sim.t, trim: sim.pitch * DEG, list: sim.roll * DEG,
      R20: F.R20, R21: F.R21, R22: F.R22, tz: F.tz,
      level: Float64Array.from(sim.level.subarray ? sim.level.subarray(0, NN) : sim.level.slice(0, NN)),
      vol: Float64Array.from(sim.vol.subarray ? sim.vol.subarray(0, NN) : sim.vol.slice(0, NN)),
      pk: (sim.pockets || []).map(k => ({ vol: k.vol, state: k.state })),
      waterT: C.readouts(sim).waterM3 * C.RHO / 1000,
    };
  }
  function take(run, sim) { run.samples.push(sample(sim)); return run; }
  function close(run, sim, more) {
    run.events = sim.events.map(e => ({ t: e.t, id: e.id }));
    run.founderT = sim.foundered ? sim.founderT : null;
    run.endT = sim.t;
    run.onsetT = more && more.onsetT !== undefined ? more.onsetT : null;
    return run;
  }

  // ------------------------------------------------------------------ the geometry
  const worldZ = (s, x, y, z) => C.worldZ(s, x, y, z);      // a sample carries the frame's third row under the core's names
  const layerOf = (p) => (p.z < C.deckZ('E', p.x) ? 0 : 1);
  function pocketAt(run, s, p) {                          // the holding pocket the place lies in (the core's pocketOf), or -1
    if (layerOf(p) !== 0) return -1;
    const side = p.y >= 0 ? 0 : 1;
    for (let j = 0; j < run.pockets.length; j++) {
      const k = run.pockets[j];
      if (s.pk[j].state === 0 && (k.side < 0 || side === k.side) && p.x >= k.x0 && p.x <= k.x1 && p.z >= k.z0 && p.z <= (k.deck ? C.deckZ(k.deck, p.x) : k.z1)) return j;
    }
    return -1;
  }
  const seaAt = (run, s, p) => -worldZ(s, p.x, p.y, p.z);
  function waterIn(run, s, p) {
    const here = worldZ(s, p.x, p.y, p.z), j = pocketAt(run, s, p);
    if (j >= 0) {                                         // P-D1: the pocket's water placed as min(vol, cap) of its height
      const k = run.pockets[j], v = Math.min(s.pk[j].vol, k.cap);
      return worldZ(s, k.xc, k.yc, k.z0 + (k.z1 - k.z0) * (v > EPS ? v / k.cap : 0)) - here;
    }
    const layer = layerOf(p), n = C.nodeIndex(C.zoneAt(p.x), p.y >= 0 ? 0 : 1, layer);
    if (s.vol[n] > EPS) return s.level[n] - here;
    return worldZ(s, p.x, p.y, layer ? C.deckZ('E', p.x) : C.G.tankTop) - here;   // dry: its floor
  }
  function sounding(run, s, p) {
    const k = C.zoneAt(p.x), floor = worldZ(s, p.x, 0, p.z);
    let d = 0;
    for (let sd = 0; sd < 2; sd++) { const n = C.nodeIndex(k, sd, 0); if (s.vol[n] > EPS) d = Math.max(d, s.level[n] - floor); }
    return d;
  }
  function quantity(row, run, s) {
    const p = row.place;
    switch (row.kind) {
      case 'sea_at': return seaAt(run, s, p);
      case 'water_in': return waterIn(run, s, p);
      case 'sounding': return sounding(run, s, p);
      case 'angle': return p.what === 'trim' ? s.trim : s.list;
      case 'tonnage': return s.waterT;
      default: return NaN;
    }
  }
  function series(row, run) { return run.samples.map(s => quantity(row, run, s)); }

  // ------------------------------------------------------------------ reading a series
  // the value at tS seconds, between the two samples about it; past the last sample, the last
  function valueAt(run, q, tS) {
    const S = run.samples, n = S.length;
    if (!n) return NaN;
    if (tS <= S[0].t) return q[0];
    if (tS >= S[n - 1].t) return q[n - 1];
    let a = 0, b = n - 1;
    while (b - a > 1) { const m = (a + b) >> 1; if (S[m].t <= tS) a = m; else b = m; }
    const u = (tS - S[a].t) / (S[b].t - S[a].t);
    return q[a] + u * (q[b] - q[a]);
  }
  // the first time (s) the series is at or above v, between samples by a straight line; null if never
  function firstAt(run, q, v) {
    const S = run.samples;
    for (let i = 0; i < S.length; i++) {
      if (q[i] >= v) {
        if (i === 0 || q[i - 1] >= v || q[i] === q[i - 1]) return S[i].t;
        return S[i - 1].t + (S[i].t - S[i - 1].t) * (v - q[i - 1]) / (q[i] - q[i - 1]);
      }
    }
    return null;
  }
  function bandOf(row) {
    const s = row.sigma;
    if (row.sided === 'interval') return [s[0], s[1]];
    const w = typeof s === 'number' ? s : 0;
    if (row.sided === 'lower') return [row.value - w, Infinity];
    if (row.sided === 'upper') return [-Infinity, row.value + w];
    return [row.value - w, row.value + w];
  }
  const outside = (v, lo, hi) => (v < lo ? v - lo : (v > hi ? v - hi : 0));

  // D62's change of side as tools/pocket_tests.js reads it: the last time she goes over to port past half a degree,
  // before T 150 (seconds; null if she never does)
  function toPort(run) {
    let last = null, side = 0;
    for (const s of run.samples) {
      const sg = s.list > 0.5 ? 1 : (s.list < -0.5 ? -1 : 0);
      if (s.t < 150 * 60 && sg === -1 && side !== -1) last = s.t;
      if (sg !== 0) side = sg;
    }
    return last;
  }
  function timeOf(row, run) {
    const m = row.place.mark;
    if (row.kind === 'end') return m === 'onset' ? run.onsetT : run.founderT;
    if (m === 'toPort') return toPort(run);
    const e = run.events.find(e => e.id === m);
    return e ? e.t : null;
  }

  // ------------------------------------------------------------------ a row against a run
  function evaluate(row, run) {
    const band = bandOf(row), lo = band[0], hi = band[1];
    const out = { id: row.id, kind: row.kind, model: NaN, lo, hi, min: NaN, max: NaN, inRange: false, miss: NaN, reach: null, late: null, trimAtReach: null, note: '' };
    if (LEVEL_KINDS.indexOf(row.kind) >= 0) {
      const q = series(row, run), S = run.samples;
      const t0 = 60 * (row.tLo === null ? row.t : row.tLo), t1 = 60 * (row.tHi === null ? row.t : row.tHi);
      out.model = valueAt(run, q, 60 * row.t);
      let mn = Math.min(valueAt(run, q, t0), valueAt(run, q, t1)), mx = Math.max(valueAt(run, q, t0), valueAt(run, q, t1));
      for (let i = 0; i < S.length; i++) if (S[i].t > t0 && S[i].t < t1) { if (q[i] < mn) mn = q[i]; if (q[i] > mx) mx = q[i]; }
      out.min = mn; out.max = mx;
      out.inRange = mx >= lo && mn <= hi;
      out.miss = outside(out.model, lo, hi);
      if (row.kind !== 'angle') {                          // the kinds that rise: when the model is at the witness's level
        const tr = firstAt(run, q, row.value);
        if (tr !== null) {
          out.reach = tr / 60;
          out.late = outside(out.reach, t0 / 60, t1 / 60);
          if (row.kind === 'sea_at') out.trimAtReach = valueAt(run, S.map(s => s.trim), tr);
        } else out.note = 'never at the witness\'s level in the run';
      }
      if (run.founderT !== null && 60 * row.t > run.founderT) out.note = (out.note ? out.note + '; ' : '') + 'the witness\'s time is after the model\'s founder: read at the last sample';
    } else {
      const tS = timeOf(row, run);
      if (tS === null || tS === undefined) { out.model = (run.founderT !== null ? run.founderT : run.endT) / 60; out.note = 'never in the run: read as its end'; }
      else out.model = tS / 60;
      out.min = out.max = out.model;
      out.inRange = out.model >= lo && out.model <= hi;
      out.miss = outside(out.model, lo, hi);
      out.reach = tS === null || tS === undefined ? null : out.model;
      out.late = out.miss;
    }
    return out;
  }
  function evaluateAll(rows, run) { return rows.map(r => evaluate(r, run)); }

  // ------------------------------------------------------------------ a row's form
  function problems(row) {
    const bad = [];
    for (const f of FIELDS) if (!Object.prototype.hasOwnProperty.call(row, f)) bad.push('no ' + f);
    if (bad.length) return bad;
    if (KINDS.indexOf(row.kind) < 0) bad.push('kind ' + row.kind);
    if (SIDED.indexOf(row.sided) < 0) bad.push('sided ' + row.sided);
    if (ROLES.indexOf(row.role) < 0) bad.push('role ' + row.role);
    if (UNITS[row.kind] && row.unit !== UNITS[row.kind]) bad.push('unit ' + row.unit + ' for ' + row.kind);
    if (typeof row.value !== 'number' || !isFinite(row.value)) bad.push('value');
    if (typeof row.t !== 'number' || !isFinite(row.t)) bad.push('t');
    if (row.sided === 'interval' ? !(Array.isArray(row.sigma) && row.sigma.length === 2 && row.sigma[0] <= row.sigma[1]) : !(row.sigma === null || (typeof row.sigma === 'number' && row.sigma >= 0))) bad.push('sigma');
    if (row.tLo !== null && row.tHi !== null && !(row.tLo <= row.t && row.t <= row.tHi)) bad.push('tLo <= t <= tHi');
    if ((row.tLo === null) !== (row.tHi === null)) bad.push('tLo and tHi together');
    if (!row.tag || typeof row.tag.value !== 'string' || typeof row.tag.place !== 'string') bad.push('tag');
    if (!Array.isArray(row.was)) bad.push('was');
    if (!row.place || typeof row.place !== 'object') bad.push('place');
    else if (row.kind === 'sea_at' || row.kind === 'water_in' || row.kind === 'sounding') { for (const c of ['x', 'y', 'z']) if (typeof row.place[c] !== 'number' || !isFinite(row.place[c])) bad.push('place.' + c); }
    else if (row.kind === 'angle') { if (row.place.what !== 'trim' && row.place.what !== 'list') bad.push('place.what'); }
    else if (row.kind === 'event' || row.kind === 'end') { if (typeof row.place.mark !== 'string') bad.push('place.mark'); }
    for (const f of ['id', 'witness', 'source', 'group']) if (typeof row[f] !== 'string' || !row[f]) bad.push(f);
    return bad;
  }

  return { FIELDS, KINDS, LEVEL_KINDS, SIDED, ROLES, UNITS, start, sample, take, close, evaluate, evaluateAll, problems, series, bandOf, valueAt, firstAt, toPort };
});

/*
 * The living ship's nervous system (NH15: docs/DESIGN_the_living_ship_v1_2026-11-23.md, parts 1 and 5): each of her
 * systems as a node with its state, the reason in words and the model's time it took that state, read from the model's
 * own fields. A library, as rooms.js and girder.js are: it keeps no state, registers no reader and writes nothing into a
 * sim, so a watch has the same bits with it as without (tools/nerves_tests.js). The page's view (site/parts/77_nerves.js,
 * Z2's) draws from it, and its suite holds the page to this same table.
 *
 *   NV.NODES          [{ id, label, group, x, y }]: her systems, placed on a unit square left to right as the chain runs
 *                     (the view may move them: the places are appearance)
 *   NV.EDGES          [[from, to]]: what depends on what (core/systems.js and the readers, as the design's part 1 traces)
 *   NV.RULES          { id: (sim) -> { state, why, t } }: each node from the model's fields
 *   NV.EVENTS         { plant event id (its stem): node ids }: where each of the plant's events shows
 *   NV.stateOf(sim)   { id: { state, why, t } } for every node. state: 'green' (working), 'amber' (working short, or on
 *                     a stand-by), 'red' (failed), 'grey' (not here, or not in use). why: words, the plant's and the
 *                     readers' own where they keep them. t: the model's time (s, sim.t) the state began where the plant
 *                     marks it with an event (sim.plant.events: each id's first time), else null; the lights' amber
 *                     with the dynamos running, the first of her sections' fuses to blow (sim.circuits, G1: its words
 *                     name how many of her sections are dark). Every node is { state, why, t } and nothing more.
 *
 * Its thresholds are the plant's own (core/systems.js, PLANT) and the readers' own states (sim.world.set and .lamp,
 * sim.reports.phone, sim.circuits): it copies no law. Two of the plant's inline numbers are named here with their place: the steam's
 * warning at 0.8 of working pressure (its event p80) and the blow-off's 0.02 (the page's and the wireless's).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../systems.js'));
  else root.TitanicNerves = factory(root.TitanicSystems);
})(typeof self !== 'undefined' ? self : this, function (Sys) {
  'use strict';
  const PL = Sys.PLANT, ROOMS = PL.rooms, NR = ROOMS.length;
  const P80 = 0.8, BLOW = 0.02;                       // core/systems.js: the event p80 (p < 0.8); the blow-off read as steam

  // ------------------------------------------------------------------ the nodes, placed [appearance]
  const NODES = [];
  const node = (id, label, group, x, y) => NODES.push({ id, label, group, x, y });
  for (let k = 0; k < NR; k++) node('coal:' + k, ROOMS[k].name + ': coal', 'fuel', 0.04, 0.08 + 0.15 * k);
  for (let k = 0; k < NR; k++) node('fires:' + k, ROOMS[k].name + ': fires', 'fuel', 0.19, 0.08 + 0.15 * k);
  node('fans', 'Stokehold fans', 'fuel', 0.19, 0.98);
  node('steam', 'Steam', 'steam', 0.36, 0.45);
  node('engine:port', 'Port engine', 'drive', 0.53, 0.10); node('engine:starboard', 'Starboard engine', 'drive', 0.53, 0.26);
  node('turbine', 'Turbine', 'drive', 0.53, 0.42);
  node('steering', 'Steering engines', 'steer', 0.53, 0.58);
  node('pumps', 'Pumps', 'water', 0.53, 0.74);
  node('dynamos', 'Main dynamos', 'power', 0.53, 0.88); node('emergency', 'Emergency dynamos', 'power', 0.53, 1.00);
  node('screw:port', 'Port screw', 'drive', 0.72, 0.10); node('screw:starboard', 'Starboard screw', 'drive', 0.72, 0.26);
  node('screw:centre', 'Centre screw', 'drive', 0.72, 0.42);
  node('rudder', 'Rudder', 'steer', 0.72, 0.58);
  node('lights', 'Lights', 'power', 0.72, 0.80); node('doors', 'Doors\' switch', 'power', 0.72, 0.92);
  node('wireless', 'Wireless', 'signal', 0.92, 0.70); node('morse', 'Morse lamp', 'signal', 0.92, 0.82);
  node('phones', 'Telephones', 'signal', 0.92, 0.94); node('boats', 'Boats\' work', 'people', 0.92, 0.58);

  // ------------------------------------------------------------------ the edges: what each depends on
  const EDGES = [];
  for (let k = 0; k < NR; k++) EDGES.push(['coal:' + k, 'fires:' + k], ['fires:' + k, 'steam'], ['fans', 'fires:' + k]);
  EDGES.push(['steam', 'engine:port'], ['steam', 'engine:starboard'], ['engine:port', 'screw:port'], ['engine:starboard', 'screw:starboard'],
    ['engine:port', 'turbine'], ['engine:starboard', 'turbine'], ['turbine', 'screw:centre'],
    ['steam', 'steering'], ['steering', 'rudder'], ['steam', 'pumps'], ['steam', 'dynamos'], ['steam', 'emergency'],
    ['dynamos', 'fans'], ['dynamos', 'lights'], ['emergency', 'lights'], ['dynamos', 'doors'],
    ['dynamos', 'wireless'], ['emergency', 'wireless'], ['dynamos', 'morse'], ['emergency', 'morse'], ['dynamos', 'phones'], ['lights', 'boats']);

  // ------------------------------------------------------------------ the plant's events, by the node that shows them
  const EVENTS = {
    flood: ['fires:'], drawn: ['fires:'], coal: ['coal:', 'fires:'], banked: ['fires:', 'steam'], fans: ['fans', 'fires:'], blowoff: ['steam'],
    p80: ['steam'], break: ['steam', 'dynamos', 'emergency'], nosteam: ['engine:port', 'engine:starboard'], slow: ['engine:port', 'engine:starboard'],
    re: ['engine:port', 'engine:starboard'], te: ['turbine'], steer: ['steering'], screws: ['screw:'], screwsHalf: ['screw:'], screwsOut: ['screw:'],
    mainDark: ['lights', 'dynamos'], dark: ['lights', 'dynamos', 'emergency'], doorsDead: ['doors'], pumps: ['pumps'], led: ['pumps'],
    raised: ['doors'],   // D112: the engineers raise the after doors by hand (core/systems.js, raiseDoors)
  };

  // ------------------------------------------------------------------ helpers
  const S = (state, why, t) => ({ state, why, t: t === undefined ? null : t });
  const ev = (sim, id) => (sim.plant && sim.plant.events[id] !== undefined ? sim.plant.events[id] : null);
  const first = (...ts) => { let v = null; for (const t of ts) if (t !== null && (v === null || t < v)) v = t; return v; };
  const psi = (P) => Math.round(P.p * PL.psi) + ' psi';
  const pct = (x) => Math.round(100 * x) + ' %';
  const mainLost = (sim) => first(ev(sim, 'mainDark'), ev(sim, 'dark'));

  // ------------------------------------------------------------------ the rules, one a node
  const RULES = {};
  for (let k = 0; k < NR; k++) {
    RULES['coal:' + k] = (sim) => {
      const P = sim.plant; if (!P) return S('grey', 'no plant');
      if (ROOMS[k].lit <= 0) return S('grey', 'not lit on the night');
      if (P.coal[k] <= 0) return S('red', 'the bunkers are empty', ev(sim, 'coal' + k));
      return S('green', Math.round(P.coal[k]) + ' t in her bunkers');
    };
    RULES['fires:' + k] = (sim) => {
      const P = sim.plant; if (!P) return S('grey', 'no plant');
      if (ROOMS[k].lit <= 0) return S('grey', 'not lit on the night');
      if (P.out[k]) return S('red', 'flooded: its fires are out', ev(sim, 'flood' + k));
      if (P.fires[k] <= 0) return P.drawn[k] ? S('red', 'its fires drawn', ev(sim, 'drawn' + k)) : S('red', 'burnt down: the bunkers are empty', ev(sim, 'coal' + k));
      if (P.drawn[k]) return S('amber', 'its fires being drawn', ev(sim, 'drawn' + k));
      if (P.coal[k] <= 0) return S('amber', 'burning down: the bunkers are empty', ev(sim, 'coal' + k));
      if (P.broken) return S('amber', 'lit, but the steam mains have given way', ev(sim, 'break'));
      if (P.firing < 0.5) return S('amber', 'banked', ev(sim, 'banked'));
      if (!P.power) return S('amber', 'on natural draught: the fans have stopped', ev(sim, 'fans'));
      return S('green', 'lit');
    };
  }
  RULES.fans = (sim) => {
    const P = sim.plant; if (!P) return S('grey', 'no plant');
    return P.power ? S('green', 'running on the main dynamos') : S('amber', 'stopped with the dynamos: the fires on natural draught', ev(sim, 'fans'));
  };
  RULES.steam = (sim) => {
    const P = sim.plant; if (!P) return S('grey', 'no plant');
    if (P.broken) return S('red', 'the steam mains have given way', ev(sim, 'break'));
    if (P.p <= PL.pEngine) return S('red', psi(P) + ': too little for the engines', first(ev(sim, 'nosteam'), ev(sim, 'p80')));
    if (P.p < P80) return S('amber', psi(P) + ': falling', ev(sim, 'p80'));
    if (P.blow > BLOW) return S('green', psi(P) + ': blowing off at the safety valves', ev(sim, 'blowoff'));
    return S('green', psi(P));
  };
  const engine = (i, name) => (sim) => {
    const P = sim.plant, m = sim.mo; if (!P || !m || !m.plant) return S('grey', 'no engines working here');
    if (P.re) return S('red', 'the engine room flooded: both engines stop', ev(sim, 're'));
    const nMax = m.plant.nMax[i], want = Math.abs(i === 0 ? m.setP : m.setS), n = Math.abs(i === 0 ? m.nP : m.nS);
    if (nMax <= 0) return S('red', 'no steam', ev(sim, 'nosteam'));
    if (nMax < want - 0.5) return S('amber', 'steam for ' + Math.round(nMax) + ' rpm of the ' + Math.round(want) + ' ordered', ev(sim, 'slow'));
    return S('green', Math.round(n) + ' rpm' + (want ? '' : ', stopped'));
  };
  RULES['engine:port'] = engine(0, 'port'); RULES['engine:starboard'] = engine(1, 'starboard');
  RULES.turbine = (sim) => {
    const P = sim.plant, m = sim.mo; if (!P || !m || !m.plant) return S('grey', 'no engines working here');
    if (P.te) return S('red', 'the turbine room flooded', ev(sim, 'te'));
    return Math.abs(m.nC) > 1 ? S('green', 'turning: ' + Math.round(Math.abs(m.nC)) + ' rpm') : S('grey', 'out: the wing engines are below half ahead');
  };
  const screw = (j) => (sim) => {
    const m = sim.mo; if (!m || !m.plant) return S('grey', 'no engines working here');
    const a = m.plant.imm[j];
    if (a < 0.05) return S('red', 'out of the water: it pushes nothing', ev(sim, 'screwsOut'));
    if (a < 1) return S('amber', pct(a) + ' of its disc under water', first(ev(sim, 'screws'), ev(sim, 'screwsHalf')));
    return S('green', 'under water');
  };
  RULES['screw:port'] = screw(0); RULES['screw:centre'] = screw(1); RULES['screw:starboard'] = screw(2);
  RULES.steering = (sim) => {
    const m = sim.mo; if (!m || !m.plant) return S('grey', 'no steering gear working here');
    if (!m.plant.steer) return S('red', 'no steam: the rudder stays where it is', ev(sim, 'steer'));
    if (m.plant.steerRate < 1) return S('amber', 'slow: ' + pct(m.plant.steerRate) + ' of its rate');
    return S('green', 'answering the wheel');
  };
  RULES.rudder = (sim) => {
    const m = sim.mo; if (!m || !m.plant) return S('grey', 'no rudder working here');
    const a = m.plant.rudImm;
    if (a < 0.05) return S('red', 'out of the water');
    if (a < 1) return S('amber', pct(a) + ' of its area under water');
    return S('green', 'under water');
  };
  RULES.pumps = (sim) => {
    const E = sim.pumpSched || [], t = sim.t, started = E.filter(e => t >= e.t0);
    if (!started.length) return S('grey', E.length ? 'none at work yet' : 'none at work');
    const on = started.filter(e => !e.off), off = started.filter(e => e.off);
    const tOff = off.reduce((v, e) => (v === null || e.tOff > v ? e.tOff : v), null);
    if (!on.length) return S('red', 'every pump stopped: their rooms lost', tOff);
    const sc = sim.pumpScale === undefined ? 1 : sim.pumpScale;
    if (sc <= 0) return S('red', on.length + ' pumps without steam');
    if (sc < 1 || off.length) return S('amber', on.length + ' at work' + (sc < 1 ? ' at ' + pct(sc) + ' of their rate' : '') + (off.length ? '; ' + off.length + ' stopped, their rooms lost' : ''), off.length ? tOff : null);
    return S('green', on.length + ' at work');
  };
  RULES.dynamos = (sim) => {
    const P = sim.plant; if (!P) return S('grey', 'no plant');
    if (P.power) return S('green', 'running');
    if (P.el) return S('red', 'the dynamo flat flooded', mainLost(sim));
    if (P.broken) return S('red', 'stopped: the steam mains have given way', ev(sim, 'break'));
    return S('red', 'stopped: no steam for them', mainLost(sim));
  };
  RULES.emergency = (sim) => {
    const P = sim.plant; if (!P) return S('grey', 'no plant');
    if (P.emergency) return S('green', P.power ? 'running (every night after sunset)' : 'running: her emergency lights');
    if (P.emWet) return S('red', 'flooded at D deck', ev(sim, 'dark'));
    if (P.broken) return S('red', 'stopped: the steam mains have given way', ev(sim, 'break'));
    return S('red', 'stopped: no steam for them', ev(sim, 'dark'));
  };
  // her lights by circuit (G1, core/readers/circuits.js), where the watch has them: how many of her sections the sea has
  // put out, in the words; amber while the dynamos run and some are out, its time the first section's fuses (the
  // reader's own, sim.circuits). Every node keeps { state, why, t } and nothing more: the view reads them as they are
  const darkOf = (sim) => { const Ci = sim.circuits; return Ci && Ci.sections && Ci.out > 0 ? Ci.out + ' of ' + Ci.sections.length + ' sections dark' : ''; };
  const firstOut = (sim) => { let t = null; for (const s of sim.circuits.sections) if (s.out >= 0 && (t === null || s.out < t)) t = s.out; return t; };
  RULES.lights = (sim) => {
    const P = sim.plant; if (!P) return S('grey', 'no plant');
    const dark = darkOf(sim);
    if (P.lights >= 1) return dark ? S('amber', dark + ': the sea in them has blown their fuses', firstOut(sim)) : S('green', 'all her lights');
    if (P.lights > 0) return S('amber', 'the emergency lights only' + (dark ? '; ' + dark : ''), ev(sim, 'mainDark'));
    return S('red', 'dark', ev(sim, 'dark'));
  };
  RULES.doors = (sim) => {
    const P = sim.plant; if (!P) return S('grey', 'no plant');
    if (!P.power) return S('red', 'the bridge\'s switch is dead: the floats alone shut the doors', mainLost(sim));
    return S('green', P.doorSwitch ? 'the bridge\'s switch thrown: the doors released' : 'the bridge\'s switch has current');
  };
  RULES.wireless = (sim) => {
    const W = sim.world; if (!W || !W.set) return S('grey', 'no wireless here');
    const s = W.set;
    if (!s.working) return S('red', s.why);
    const reach = s.reach ? ': ' + Math.round(s.reach) + ' nm' : '';
    return s.supply === 'main' ? S('green', s.why + reach) : S('amber', s.why + reach);
  };
  RULES.morse = (sim) => {
    const W = sim.world; if (!W || !W.lamp || W.lamp.lit === undefined) return S('grey', 'no Morse lamp here');
    return W.lamp.lit ? S(/emergency/.test(W.lamp.why) ? 'amber' : 'green', W.lamp.why) : S('red', W.lamp.why);
  };
  RULES.phones = (sim) => {
    const R = sim.reports; if (!R || !R.phone) return S('grey', 'no telephones here');
    if (!R.phone.current) return S('red', R.phone.why);
    return /battery/.test(R.phone.why) ? S('amber', R.phone.why, mainLost(sim)) : S('green', R.phone.why);
  };
  RULES.boats = (sim) => {
    const P = sim.plant; if (!sim.people) return S('grey', 'no boats\' work here');
    if (P && P.lights <= 0) return S('amber', 'in the dark: the boats\' work at half its pace', ev(sim, 'dark'));
    return S('green', P && P.lights < 1 ? 'by the emergency lights' : 'lit');
  };

  function stateOf(sim) {
    const out = {};
    for (const n of NODES) out[n.id] = RULES[n.id](sim);
    return out;
  }

  return { NODES, EDGES, EVENTS, RULES, stateOf, P80, BLOW };
});

/*
 * The onset of the break (stage B2 of docs/DESIGN_the_break_and_two_bodies_v1_2026-11-19.md, section 4.3, step 1): the
 * first step at which, somewhere along her, the hull girder gauge's bending moment and shear (core/readers/girder.js,
 * moment(sim): relieved by her inertia, its defaults) reach what her hull could bear there (core/readers/section.js: the
 * ultimate moment in the sense the moment acts, hogging or sagging, and the shear capacity):
 *
 *     (M / Mu)^2 + (V / Vu)^2 >= 1
 *
 * That step, its time, the station, the moment and the capacity there, the sense, her trim and her list are recorded
 * once. It is an event that breaks nothing: it writes nothing into the model and pushes nothing into sim.events. A watch
 * has the same fingerprint with it as without (tools/strength_tests.js). Splitting her there is stages B3 and B4.
 *
 *   start(opts)            a fresh state for a run: { k, next, found, peak, looks, ... }
 *   look(sim, st)          after each step: compares when due (below); records the onset once; returns st.found
 *   check(sim, opts)       the comparison now, at every station: the worst station's { r, u, x, M, Mu, V, Vu, sense, ... };
 *                          with { all: true } every station's too; `over`, the stations at or past 1 (found.over keeps
 *                          them for the onset's step: the torn zone of stage B4 starts there)
 *   run(sim, opts)         a damage preset run to its end with look() after every step (headless): the state
 *   describe(found)        "she would break at x -24.4 m (boiler room 1), hogging, 4.9 of 5.0 GN m"
 *   the reader             registered with core/night.js as 'onset': its state is sim.onset, stepped after every step
 *   the night's own check  on a watch handed over at the onset (handover 'onset'), core/night.js carries the check
 *                          itself (D76 b): sim.night.onset is start()'s state, looked at by the night's step before the
 *                          readers, so that the watch's copies, its forecast and a watch with no readers meet the same
 *                          onset; the reader then only mirrors it (sim.onset is the same object). The night finds the two
 *                          functions in the reader's registration (check: { start, look }).
 *
 * The plain functions serve a damage preset the same way (the page's girder part keeps the state itself there, outside
 * the sim): st = start(); after every C.step(sim): look(sim, st).
 *
 * The stations. The gauge's own: every slice edge of her columns (along the whole hull) and every station of its break
 * band (bulkhead K to J, every half metre and the named points). A station where the section has no hull worth the name
 * (the stem's and the stern's tips) is passed over.
 *
 * When it looks. Comparing costs one moment(sim) (about a tenth of a millisecond to half of one); every step of a page
 * at 900 times her pace that would cost more than the model. So it looks every step only near the onset: after a look
 * with the worst station at u = sqrt(r), the next is due min(MAX_GAP, max(1, floor((1 - u) / RATE))) steps later. RATE
 * is a bound on how fast u can grow in one step [stated, not physics: tools/strength_tests.js measures the 1912 night's
 * fastest and prints it beside RATE]; if a look ever finds the onset more than one step after the one before it, the
 * record says so (exact: false, and the steps it lies between), so a broken bound shows instead of hiding. opts.every
 * looks every step (the tests prove the two give the same step).
 *
 * Time. T is minutes after the touch on a watch, after the damage (t = 0) on a preset; the clock is the page's.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../core.js'), require('../night.js'), require('./girder.js'), function () { return require('./section.js'); });
  // the page bundles core/readers/*.js in name order, so section.js comes after this file: it is found when first used
  else root.TitanicOnset = factory(root.TitanicCore, root.TitanicNight, root.TitanicGirder, function () { return root.TitanicSection; });
})(typeof self !== 'undefined' ? self : this, function (C, N, G, sectionLib) {
  'use strict';
  if (!C || !G) return null;
  const RATE = 0.01;       // the most u may grow in one step between looks [stated: a schedule, tested, not a property of her]
  const MAX_GAP = 120;     // never more than 30 s between looks
  const DEG = 180 / Math.PI;

  // the stations: the gauge's slice edges and its band, as one list (cached by ship), and the capacities there
  const STATIONS = new WeakMap();
  function stationsOf(sim, res, sopts) {
    const S = sectionLib(), ship = sim.ship, key = JSON.stringify(sopts || {});
    let byShip = STATIONS.get(ship); if (!byShip) { byShip = new Map(); STATIONS.set(ship, byShip); }
    let st = byShip.get(key); if (st) return st;
    const nH = res.hull.x.length, nB = res.band.x.length, list = [];
    for (let j = 0; j < nH; j++) list.push({ src: 'hull', i: j, x: res.hull.x[j] });
    for (let i = 0; i < nB; i++) list.push({ src: 'band', i, x: res.band.x[i] });
    const keep = [];
    for (const s of list) { const a = S.at(ship, s.x, sopts); if (a.none || !(a.hog.Mu > 0) || !(a.sag.Mu > 0) || !(a.Vu > 0)) continue; s.hog = a.hog.Mu; s.sag = a.sag.Mu; s.Vu = a.Vu; s.where = a.where; keep.push(s); }
    st = { list: keep, nHull: nH, nBand: nB };
    byShip.set(key, st);
    return st;
  }

  // The comparison now. opts: { section: options for core/readers/section.js (a what-if: { scale } and so on), all:
  // true for every station's ratio as well (the torn zone of stage B4: the stations past 1) }. `over` always lists the
  // stations at or past 1, worst first.
  function check(sim, opts) {
    opts = opts || {};
    const res = G.moment(sim);
    const st = stationsOf(sim, res, opts.section);
    let best = null;
    const all = opts.all ? [] : null, over = [];
    for (const s of st.list) {
      const H = s.src === 'hull' ? res.hull : res.band;
      const M = H.M[s.i], V = H.V[s.i], Mu = M >= 0 ? s.hog : s.sag;
      const m = M / Mu, v = V / s.Vu, r = m * m + v * v, sense = M >= 0 ? 'hogging' : 'sagging';
      if (all) all.push({ x: s.x, where: s.where, r, M, Mu, V, Vu: s.Vu, sense, src: s.src });
      if (r >= 1) over.push({ x: s.x, r });
      if (!best || r > best.r) best = { r, x: s.x, where: s.where, M, Mu, V, Vu: s.Vu, sense, src: s.src };
    }
    if (best) best.u = Math.sqrt(best.r);
    over.sort((a, b) => b.r - a.r || a.x - b.x);
    return { best, all, over, res, t: sim.t, trimDeg: sim.pitch * DEG, listDeg: sim.roll * DEG };
  }

  function start(opts) {
    return { k: 0, next: 0, last: -1, found: null, peak: null, looks: 0, opts: opts || {} };
  }
  // T: minutes after the touch on a watch (null before it), after t = 0 on a preset
  function Tof(sim) { const w = sim.night; return w ? (w.tTouch >= 0 ? (sim.t - w.tTouch) / 60 : null) : sim.t / 60; }
  // the step: the watch's own count; on a preset the steps taken since t = 0 (t is a whole number of steps of dt)
  function stepOf(sim) { return sim.night ? sim.night.k : Math.round(sim.t / sim.params.dt); }
  function look(sim, st) {
    const k = stepOf(sim);
    st.k = k;
    if (st.found || k < st.next) return st.found;
    const c = check(sim, st.opts), b = c.best;
    st.looks++;
    if (!b) { st.next = k + MAX_GAP; st.last = k; return null; }
    if (!st.peak || b.r > st.peak.r) st.peak = { r: b.r, u: b.u, k, t: sim.t, x: b.x, where: b.where, M: b.M, Mu: b.Mu, V: b.V, Vu: b.Vu, sense: b.sense, trimDeg: c.trimDeg, listDeg: c.listDeg };
    if (b.r >= 1) {
      const T = Tof(sim);
      // exact: the step before was looked at too (or this is her first step), so this is the first step past it; a state
      // started late in a run, or a schedule outrun, says so instead
      st.found = { k, t: sim.t, T, x: b.x, where: b.where, sense: b.sense, M: b.M, Mu: b.Mu, V: b.V, Vu: b.Vu, r: b.r,
        trimDeg: c.trimDeg, listDeg: c.listDeg, exact: st.last >= 0 ? k - st.last <= 1 : k <= 1, after: st.last,
        over: c.over.map(o => o.x) };                              // every station at or past 1 on that step, worst first
      return st.found;
    }
    const gap = st.opts.every ? 1 : Math.min(MAX_GAP, Math.max(1, Math.floor((1 - b.u) / RATE)));
    st.last = k; st.next = k + gap;
    return null;
  }
  // a damage preset (or any sim without a watch) to its end, looking after every step: the state, with found or not
  function run(sim, opts) {
    opts = opts || {};
    const st = start(opts), tMax = opts.tMax || 5 * 3600;
    look(sim, st);
    while (!sim.foundered && sim.t < tMax) {
      C.step(sim);
      look(sim, st);
      if (opts.stopAtOnset && st.found) break;
      if (opts.stopWhenStable && sim.t > 3600 && Math.abs(sim.inflow) < 0.02 && Math.abs(sim.wth) < 1e-5 && Math.abs(sim.vz) < 1e-3) break;
    }
    return st;
  }
  const f1 = (v) => (Math.round(v * 10) / 10).toFixed(1);
  function describe(found) {
    if (!found) return 'no onset';
    return 'she would break at x ' + f1(found.x) + ' m (' + found.where + '), ' + found.sense + ', ' + f1(Math.abs(found.M) / 1e9) + ' of ' + f1(found.Mu / 1e9) + ' GN m';
  }

  // the reader: attached to every watch; stepped after each step; owns no orders; draws nothing at random. On a watch
  // whose night carries the check (an onset watch, D76 b) it mirrors the night's state and does not look itself
  if (N && N.reader) N.reader({
    name: 'onset', state: 'onset',
    check: { start, look: (sim, st) => (sectionLib() ? look(sim, st) : null) },
    attach(sim) { sim.onset = sim.night && sim.night.onset ? sim.night.onset : start(); },
    step(sim) {
      if (sim.night && sim.night.onset) { sim.onset = sim.night.onset; return; }
      if (sim.onset && sectionLib()) look(sim, sim.onset);
    },
  });

  return { RATE, MAX_GAP, start, look, check, run, describe, stationsOf, Tof, stepOf };
});

/*
 * The boats and the people: a reader of the watch (core/night.js, "readers"; step 8 of
 * docs/BRAINSTORM_the_whole_night_v1_2026-11-17.md, section 5). Its state is sim.people.
 *
 * Twenty boats for 1,178 places, uncovered, loaded and lowered through the night by a model of places and minutes,
 * fitted to the launch record of 1912. Facts and rates are the research note's
 * (docs/research/RESEARCH_lifeboats_launch_sequence_v1_2026-11-17.md, "the note"; its section 11 is the specification),
 * each with its tag: [read] in a source the note opened, [derived] arithmetic on those, [bet] a judgement, no source.
 *
 * It counts places and minutes. It names nobody and draws no person: people are whole numbers moved between pools (on
 * board; waiting at a group of boats; in a boat; in the water). Nothing is drawn at random.
 *
 * What it reads, after the model's own step, and nothing else: her trim and list (sim.pitch, sim.roll); the height above
 * the sea of the boat deck's edge at each boat's davits (C.frameOf, C.worldZ: "the drop"); light on the boat deck (the
 * plant's dynamos, sim.plant.lights); her speed through the water, her place and heading (sim.mo); whether the sea is
 * in her (sim.openings); the touch (sim.night.tTouch); whether she has foundered. It writes sim.people and nothing else:
 * never the flooding, the motion, the ice or the plant, and nothing into sim.events, so a watch has the same fingerprint
 * with it and without (tools/people_tests.js). Left out on purpose: the weight of the people who leave her in the boats
 * (about 50 t against her 49,000: the brainstorm, section 2.2).
 *
 * A step, in order:
 *   1. The order to uncover: the officers' own, 20 minutes after the touch on a night that has let the sea in [read], or
 *      the player's (boats:uncover) at any time after the touch. The deck hands uncover and clear the fourteen lifeboats
 *      side by side and swing them out; the cutters are outboard already; collapsibles C and D are unfolded on deck and
 *      hooked to the cutters' davits once the cutters have gone; A and B are got down from the roof once C and D have
 *      gone (on the night neither reached the falls before the water did [read]).
 *   2. The call to the boats, 25 minutes after the order to uncover [derived: T 20 and T 45]. From then on the people on
 *      each quarter of the boat deck come forward to its boats, each with a chance a minute that rises with her trim
 *      (fitted: the fill jumped as the trim passed about 3.5 degrees [derived]). Men come forward only where the side's
 *      rule lets them in: more slowly under "women and children first" than under "fill her" [bet].
 *   3. Two parties of officers and hands, one to a side [read: the note, section 3.3], work the boats. A party loads up to
 *      two boats at once (one or two officers to a group [read]), in the order its group was worked on the night [read],
 *      hands each to the men on the falls, and moves to the other group on its side when it has no boat left to load where
 *      it is (RATE.follow; the other rule tried, going where people wait, fits the record no better).
 *   4. A boat is lowered once its party has given it its pace (fitted) and nobody more is waiting and it holds the fill
 *      asked (the officers' own: 30 % of her places [derived]; the player's boats:fill), or when it is full, or when
 *      nobody is left on that part of the deck to come, or when the water is near. By hand at 0.055 m/s over the drop
 *      the model gives at that station at that moment [derived]: slower with trim, with way on, when she bears on the
 *      high side, in the dark; not at all above 5 knots. A minute to release and clear, and she is away.
 *   5. A station within 2 m of the sea launches nothing more: a boat still there floats off [bet: 2 m]. When she founders
 *      the people still aboard are in the water, and a boat still at its davits goes with her.
 *
 * The orders it owns (each a logged order type of the watch, so a watch with them replays bit for bit):
 *   boats:uncover 'now'                                    uncover the boats now (after the touch; once)
 *   boats:rule    'only' | 'first' | 'fill', 'port' | 'starboard' | 'both'
 *                 women and children only / women and children first / fill her (all comers, and lowered full)
 *   boats:fill    0.3 | 0.5 | 0.75 | 1                     how full a boat must be before it is lowered
 * An order that cannot be carried out is refused, and sim.people.refused says why.
 *
 * Known consequence, reported and not patched: it reads the model's own list, which is too small late in the night
 * (README, "Known gaps: List"), so the gap at the last port boats is understated (tools/people_tests.js reports it).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../core.js'), require('../motion.js'), require('../night.js'));
  else root.TitanicPeople = factory(root.TitanicCore, root.TitanicMotion, root.TitanicNight);
})(typeof self !== 'undefined' ? self : this, function (C, Mo, N) {
  'use strict';
  const DEG = Math.PI / 180, KN = Mo && Mo.KN ? Mo.KN : 1852 / 3600, MIN = 60;

  // ------------------------------------------------------------------ the boats (the note, 11.1)
  // id; side (S starboard, P port: odd numbers starboard [read]); g, the group: 0 starboard forward, 1 starboard after,
  // 2 port forward, 3 port after [read]; x, the boat's station in metres forward of amidships, midway between her
  // davits [derived: the davits stand at frames 72F, 61F, 50F, 39F and 28F and at 35A, 46A, 57A, 68A and 79A, three feet
  // a frame, each a few inches off its frame: docs/research/RESEARCH_topsides_dimensions_v1_2026-11-19.md; until
  // 2026-11-19 these were placed from landmarks, 2 to 6 m off]; cap, places [read]; type; man, the hands who go with her to man her [bet: the
  // note's "to man in the water"]; davits, for a collapsible: the cutter whose davits she is launched from [read]; after:
  // the boat that must have gone from those davits first [read: A was meant for boat 1's davits after C]; stow, where she
  // stands until hooked on (x, and roof for the officers' house) [bet].
  // rec: the record, for the tests and the fit only (the model never reads it): T, minutes after 11:40 pm when she was
  // lowered on Wormstedt, Fitch and Behe's times, and n, the number aboard at lowering by Wormstedt and Fitch [read: the
  // note, 3.2 and 11.1]; A and B floated off at about T 155 to 160 [read].
  const BOATS = [
    { id: '7', side: 'S', g: 0, x: 30.03, cap: 65, type: 'lifeboat', man: 4, rec: { T: 60, n: 28 } },
    { id: '5', side: 'S', g: 0, x: 40.23, cap: 65, type: 'lifeboat', man: 4, rec: { T: 64, n: 36 } },
    { id: '3', side: 'S', g: 0, x: 50.55, cap: 65, type: 'lifeboat', man: 4, rec: { T: 75, n: 32 } },
    { id: '1', side: 'S', g: 0, x: 60.71, cap: 40, type: 'cutter', man: 3, rec: { T: 85, n: 12 } },
    { id: '9', side: 'S', g: 1, x: -36.57, cap: 65, type: 'lifeboat', man: 4, rec: { T: 110, n: 40 } },
    { id: '11', side: 'S', g: 1, x: -46.79, cap: 65, type: 'lifeboat', man: 4, rec: { T: 115, n: 50 } },
    { id: '13', side: 'S', g: 1, x: -56.87, cap: 65, type: 'lifeboat', man: 4, rec: { T: 120, n: 55 } },
    { id: '15', side: 'S', g: 1, x: -67.01, cap: 65, type: 'lifeboat', man: 4, rec: { T: 121, n: 68 } },
    { id: '8', side: 'P', g: 2, x: 30.03, cap: 65, type: 'lifeboat', man: 4, rec: { T: 80, n: 25 } },
    { id: '6', side: 'P', g: 2, x: 40.23, cap: 65, type: 'lifeboat', man: 4, rec: { T: 90, n: 23 } },
    { id: '4', side: 'P', g: 2, x: 50.55, cap: 65, type: 'lifeboat', man: 4, rec: { T: 130, n: 30 } },
    { id: '2', side: 'P', g: 2, x: 60.71, cap: 40, type: 'cutter', man: 3, rec: { T: 125, n: 17 } },
    { id: '16', side: 'P', g: 3, x: -67.01, cap: 65, type: 'lifeboat', man: 4, rec: { T: 100, n: 53 } },
    { id: '14', side: 'P', g: 3, x: -56.87, cap: 65, type: 'lifeboat', man: 4, rec: { T: 105, n: 40 } },
    { id: '12', side: 'P', g: 3, x: -46.79, cap: 65, type: 'lifeboat', man: 4, rec: { T: 110, n: 42 } },
    { id: '10', side: 'P', g: 3, x: -36.57, cap: 65, type: 'lifeboat', man: 4, rec: { T: 130, n: 57 } },
    { id: 'C', side: 'S', g: 0, x: 60.71, cap: 47, type: 'collapsible', man: 3, davits: '1', stow: { x: 60.71 }, rec: { T: 140, n: 43 } },
    { id: 'D', side: 'P', g: 2, x: 60.71, cap: 47, type: 'collapsible', man: 3, davits: '2', stow: { x: 60.71 }, rec: { T: 145, n: 20 } },
    { id: 'A', side: 'S', g: 0, x: 60.71, cap: 47, type: 'roof', man: 3, davits: '1', after: 'C', stow: { x: 55, roof: true }, rec: { T: null, float: [155, 160] } },
    { id: 'B', side: 'P', g: 2, x: 60.71, cap: 47, type: 'roof', man: 3, davits: '2', after: 'D', stow: { x: 55, roof: true }, rec: { T: null, float: [155, 155] } },
  ];
  const NB = BOATS.length, IDX = {};
  BOATS.forEach((b, i) => { IDX[b.id] = i; });
  // the order in which each group's boats were worked on the night [read: the note, 3.2 and 3.3], the collapsibles after
  // the cutters whose davits they take [read]
  const WORK = [['7', '5', '3', '1', 'C', 'A'], ['9', '11', '13', '15'], ['8', '6', '2', '4', 'D', 'B'], ['16', '14', '12', '10']].map(l => l.map(id => IDX[id]));
  const GROUPS = [{ id: 'Sf', side: 'S', name: 'starboard forward' }, { id: 'Sa', side: 'S', name: 'starboard after' }, { id: 'Pf', side: 'P', name: 'port forward' }, { id: 'Pa', side: 'P', name: 'port after' }];
  const OTHER = [1, 0, 3, 2];
  const PLACES = BOATS.reduce((a, b) => a + b.cap, 0);   // 1,178 [read]

  // where each boat is launched from: the boat deck's edge at her davits (ship frame: x forward, y to port, z up). The
  // edge is the hull's moulded half-breadth at the boat deck there (core/core.js), a little inside the davits [derived].
  // G24: on the ship's own hull, her ends with it (since the calibration's landing they widen her above 11.0 m): the
  // default ship's, C.buildShip().hull, built once when first asked, the same object a page or a watch of the default
  // ship carries (as site/topsides.js's useHull has by default), so that the drawn deck's edge and the stations agree
  let STATION_ = null;
  function stations() {
    if (STATION_) return STATION_;
    const H = C.buildShip().hull;
    return (STATION_ = BOATS.map(b => { const z = C.deckZ('Boat', b.x), e = C.halfBreadth(b.x, z, H); return { x: b.x, y: b.side === 'P' ? e : -e, z, edge: e }; }));
  }
  const OUT = 1.5;          // m from the deck's edge to the centre of a boat swung out [bet: a 9 ft 1 in boat clear of the side]

  // ------------------------------------------------------------------ the people
  // aboard at 11:40 pm: 2,201, the Court's count [read: the note 1.3]; of them women and children 534 [bet: 402 women and
  // 109 children among the passengers and 23 women in the crew, as remembered from the Court's table "Numbers Saved";
  // the note did not record the split, so check it there before leaning on it]. Each quarter of the boat deck (a group
  // of boats) draws on a quarter of each [bet].
  const PEOPLE = { aboard: 2201, wc: 534 };

  // ------------------------------------------------------------------ the rates (the note, 11.2)
  const T = {
    uncoverAfter: 20,     // min after the touch: the Captain's order to uncover, on a night that has let the sea in [read]
    uncover: 17.5,        // min to uncover a lifeboat and clear her falls, two or three hands, all fourteen side by side [read: 15 to 20]
    swing: 2.5,           // min to swing her out once cleared [read: 2 to 3]
    cutter: 5,            // min to ready a cutter, kept swung out at sea [bet]
    fold: 17.5,           // min to unfold a collapsible on deck and raise her sides [bet: the note's 15 to 20]
    hook: 3,              // min to hook a collapsible to a cutter's davits once the cutter has gone [bet]
    roof: 15,             // min to get A or B down from the officers' house with six to ten men [bet: the note's 10 to 20]
    call: 25,             // min from the order to uncover to the call to the boats [derived: T 20 and T 45 on the night]
    walk: 2,              // min for a party to move between the forward and after groups, about 100 m [bet]
    release: 1,           // min to release the falls and clear the side once afloat [derived: the note, "a minute more"]
  };
  const RATE = {
    load: 4.5,            // persons a minute into a boat with people waiting [derived: 3 to 6, a boat in 10 to 15 min]
    lower: 0.055,         // m/s by hand [derived: 60 ft in 5 to 6 minutes]
    gapL: 3, gap0: 0.3,   // the gap at a boat on the low side: g = gap0 + gapL sin(list), m [derived; L and g0 bets]
    gapHalf: 0.6, gapJump: 1.0,   // full rate below 0.6 m, half to 1.0 m, a quarter beyond (by jumping) [bet]
    reach: 0.75,          // m the davits hold a boat off the side: one on the high side bears on it below reach / sin(list) [bet: 0.5 to 1]
    noLower: 15,          // deg of list away from a boat beyond which she cannot be lowered [bet]
    trimSlow: 0.1,        // lowering time +10 % for each degree of trim beyond 5 [bet]
    wayFull: 1, wayNone: 5,   // knots: lowering as usual up to 1, half to 5, none above 5 [read: 5 kn, today's design limit;
                              // bet: 1, the boats note's proposal (launching normal at 1 knot or less). Until M7 it was 3,
                              // because the model kept 1 to 2 knots of way all night; since M7 she is under 1 knot from
                              // T+59.6, before the first boat (T+66.5), so 1 fits the same on the 1912 orders (Bo, 18 Nov.)]
    dark: 0.5,            // the work at the boats goes at half pace with no light on the boat deck [bet]
    lowStation: 2,        // m: a station this near the sea launches nothing; a boat there floats off [bet: the note's "about 2 m"]
    near: 4,              // m: the water this near, a loaded boat is lowered at once whatever she holds [bet]
    minFill: 0.3,         // the officers' own: no boat lowered with fewer than this share of her places (the smallest of the
                          // night: boat 1, 12 of 40; boat 6, 23 of 65) [derived]
    menFirst: 0.5,        // men come forward this much more slowly than women and children under "women and children first" [bet]
    tauWater: 17.5,       // min: survival in water near 0 C taken as exp(-t / tau) [bet: the note's 15 to 20]. Reported, never drawn
    jumpTrim: 3.5, jumpWidth: 0.25,   // deg: willingness rises across this trim [derived: the note, 3.2 at 12:55, 4.0 at 1:20];
                                      // the width [bet]
    follow: 'group',      // how a party chooses its group: 'group', work it to the end; or 'people', go where people wait
                          // (party(), below). On the 1912 record the two fit alike (tools/calibrate_people.js): the simpler stands
  };
  // fitted to the 1912 launch record by tools/calibrate_people.js: kLo and kHi, the chance a minute that a person on the boat
  // deck comes forward to a boat, well below and well above the trim of the jump; pace, the minutes a party gives a boat
  // before it will lower her (compare WFB's estimate of a boat's loading, 10 to 15 minutes [read]). The fit of 17 November:
  // 14 of the 18 within ten minutes of the re-examined times, 664 in them against 671; outside: 4 and 2 (port forward,
  // 40 and 32 minutes early: boat 4 hung at A deck for its windows, which the model leaves out), 11 (11 early), C (16 early).
  // Refitted 18 November on M7 (a stopped screw's drag: her way after the ice): the same 14 and the same four outside
  // (4 and 2 40 and 32 early, 11 11, C 16), 661 against 671; before it { kLo: 0.00185, kHi: 0.0421, pace: 8 }.
  // Refitted 23 November at G12's switch (D98: the watch ends at her hand-over, the break's onset), the fit having stood
  // off its optimum since the calibration epoch's landing (stage D; U0's finding, with and without its stations' mend):
  // J 0.896, 11 of the 18 within ten minutes, 677 in them against 671; collapsible A away, B lost with her at the
  // hand-over (T 156.46, before the record's floating-off at 155 to 160). Before it { kLo: 0.002, kHi: 0.04, pace: 8 }
  const FIT = { kLo: 0.000603, kHi: 0.08, pace: 8 };
  const RULES = ['only', 'first', 'fill'], FILLS = [0.3, 0.5, 0.75, 1], SIDES = { port: ['P'], starboard: ['S'], both: ['P', 'S'] };
  const MEN = { only: 0, first: RATE.menFirst, fill: 1 };
  const STATES = ['covered', 'cleared', 'swungOut', 'loading', 'lowering', 'away', 'floated', 'lost'];

  // ------------------------------------------------------------------ state
  function fresh() {
    const wc = [], men = [];
    for (let g = 0; g < 4; g++) {     // a quarter of each to each group, the remainders to the first groups
      wc.push(Math.floor(PEOPLE.wc / 4) + (g < PEOPLE.wc % 4 ? 1 : 0));
      const m = PEOPLE.aboard - PEOPLE.wc;
      men.push(Math.floor(m / 4) + (g < m % 4 ? 1 : 0));
    }
    return {
      damaged: false, tDamage: -1, uncoverT: -1, uncoverBy: null, callT: -1, over: false, tFounder: -1,
      rule: { S: 'first', P: 'only' },      // the night's: starboard "first", port "only" [read: the note 4.1]
      fill: RATE.minFill,
      boats: BOATS.map(() => ({ state: 'covered', n: 0, wc: 0, men: 0, prep: 0, prepT: -1, hook: -1, credit: 0, loadT: 0, low: 0, h: NaN, drop: NaN, waterT: 0,
        party: -1, slot: -1, tReady: -1, tLoad: -1, tLower: -1, tWater: -1, tAway: -1, tFloat: -1, tLost: -1, gap: NaN, list: NaN, kn: NaN, place: null })),
      groups: GROUPS.map((G, g) => ({ R: [wc[g], men[g]], Q: [0, 0], credit: [0, 0] })),
      parties: [{ side: 'S', g: 0, walk: 0, slots: [-1, -1] }, { side: 'P', g: 2, walk: 0, slots: [-1, -1] }],
      water: 0, orders: [], refused: [], log: [],
      count: { aboard: PEOPLE.aboard, inBoats: 0, inBoatsAway: 0, water: 0, boatsAway: 0, emptyAway: 0, floated: 0, lost: 0, total: PEOPLE.aboard },
      obs: { t: 0, dt: 0.25, tTouch: -1, damaged: false, foundered: false, trim: 0, list: 0, kn: 0, light: true, X: 0, Y: 0, psi: 0, drop: new Float64Array(NB) },
    };
  }

  // what the model shows the boats this step
  function observe(sim, o) {
    const F = C.frameOf(sim), m = sim.mo, w = sim.night;
    o.t = sim.t; o.dt = sim.params.dt; o.tTouch = w ? w.tTouch : -1;
    o.damaged = sim.openings.length > 0; o.foundered = !!(N && N.over ? N.over(sim) : sim.foundered);
    o.trim = sim.pitch / DEG; o.list = sim.roll / DEG;                    // + by the head; + starboard down
    o.kn = m ? Math.sqrt(m.u * m.u + m.v * m.v) / KN : 0;
    o.light = sim.plant ? sim.plant.lights > 0 : true;                    // either set of dynamos lights the boat deck [read]
    o.X = m ? m.X : 0; o.Y = m ? m.Y : 0; o.psi = m ? m.psi : 0;
    const ST = stations();
    for (let i = 0; i < NB; i++) { const s = ST[i]; o.drop[i] = C.worldZ(F, s.x, s.y, s.z); }
    return o;
  }

  // ------------------------------------------------------------------ the step
  const sigma = (x) => 1 / (1 + C.exp(-x));
  function willing(trim, F) { return F.kLo + (F.kHi - F.kLo) * sigma((Math.abs(trim) - RATE.jumpTrim) / RATE.jumpWidth); }
  const isGone = (b) => b.state === 'away' || b.state === 'floated' || b.state === 'lost';
  const onDeck = (b) => b.state === 'covered' || b.state === 'cleared' || b.state === 'swungOut' || b.state === 'loading';
  function note(P, t, id, what) { P.log.push({ t, id, what }); }
  // where on the earth a point of her side is (motion's frame: x north, y east; the ship's y to port)
  function placeOf(o, i) {
    const s = stations()[i], c = C.cos(o.psi), sn = C.sin(o.psi), yS = -(s.y + (s.y > 0 ? OUT : -OUT));   // to starboard
    const X = o.X + s.x * c - yS * sn, Y = o.Y + s.x * sn + yS * c, out = BOATS[i].side === 'S' ? 1 : -1;
    return { X, Y, dx: -sn * out, dy: c * out, psi: o.psi };
  }

  function uncover(P, t, by) { P.uncoverT = t; P.uncoverBy = by; note(P, t, null, by === 'order' ? 'The order to uncover the boats (yours)' : 'The officers\' order to uncover the boats'); }

  function tick(P, o, F) {
    F = F || FIT;
    if (P.over) return;
    const t = o.t, dt = o.dt, work = o.light ? 1 : RATE.dark, B = P.boats;
    // 1. the sea in her; the officers' order to uncover; the call to the boats
    if (!P.damaged && o.damaged) { P.damaged = true; P.tDamage = t; }
    if (P.uncoverT < 0 && P.damaged && o.tTouch >= 0 && t >= o.tTouch + T.uncoverAfter * MIN) uncover(P, t, 'officers');
    if (P.callT < 0 && P.damaged && P.uncoverT >= 0 && t >= P.uncoverT + T.call * MIN) { P.callT = t; note(P, t, null, 'The call to the boats: women and children first to the boat deck'); }
    for (let i = 0; i < NB; i++) B[i].drop = o.drop[i];
    // 2. she has gone: everyone still aboard is in the water; a boat still at her davits goes with her
    if (o.foundered) { founder(P, o); count(P); return; }
    // 3. the hands at the boats
    if (P.uncoverT >= 0) prepare(P, o, work);
    // 4. the people come forward, once called
    if (P.callT >= 0) forward(P, o, F);
    // 5. the parties choose their work; the boats being loaded take on their people and are handed to the falls
    if (P.callT >= 0) for (let p = 0; p < P.parties.length; p++) party(P, p, o, F, work);
    for (let i = 0; i < NB; i++) if (B[i].state === 'loading') load(P, i, o, F, work);
    // 6. the boats in the falls
    for (let i = 0; i < NB; i++) if (B[i].state === 'lowering') lower(P, i, o, work);
    // 7. a station the sea has reached launches nothing more: what is still there floats off
    for (let i = 0; i < NB; i++) {
      const b = B[i];
      if (onDeck(b) && o.drop[i] <= RATE.lowStation) {
        release(P, b);
        b.state = 'floated'; b.tFloat = t; b.h = 0; b.place = placeOf(o, i);
        note(P, t, BOATS[i].id, 'floats off' + (b.n ? ' with ' + b.n + ' in her' : ', empty'));
      }
      if (b.state === 'covered' || b.state === 'cleared' || b.state === 'swungOut' || b.state === 'loading') b.h = o.drop[i];
    }
    count(P);
  }

  // the hands uncover and clear the lifeboats side by side and swing them out; ready the cutters; unfold C and D and hook
  // them on once the cutters have gone; get A and B down once C and D have gone
  function prepare(P, o, work) {
    const t = o.t, dt = o.dt, B = P.boats;
    for (let i = 0; i < NB; i++) {
      const b = B[i], d = BOATS[i];
      if (b.state !== 'covered' && b.state !== 'cleared') continue;
      if (d.type === 'roof' && b.prepT < 0) { const a = B[IDX[d.after]]; if (!isGone(a)) continue; }   // A and B wait for C and D
      if (b.prepT < 0) b.prepT = t;
      b.prep += dt * work / MIN;            // minutes of work done
      if (d.type === 'lifeboat') {
        if (b.state === 'covered' && b.prep >= T.uncover) { b.state = 'cleared'; }
        if (b.state === 'cleared' && b.prep >= T.uncover + T.swing) { b.state = 'swungOut'; b.tReady = t; }
      } else if (d.type === 'cutter') {
        if (b.prep >= T.cutter) { b.state = 'swungOut'; b.tReady = t; }
      } else {                              // C and D unfolded; A and B got down; then hooked on once the davits are free
        if (b.state === 'covered' && b.prep >= (d.type === 'roof' ? T.roof : T.fold)) b.state = 'cleared';
        if (b.state === 'cleared') {
          const c = B[IDX[d.davits]], before = d.after ? B[IDX[d.after]] : null;
          if (isGone(c) && (!before || isGone(before))) {
            if (b.hook < 0) b.hook = 0;
            b.hook += dt * work / MIN;
            if (b.hook >= T.hook) { b.state = 'swungOut'; b.tReady = t; }
          }
        }
      }
    }
  }

  // each person on a quarter of the deck comes forward with a chance a minute that rises with her trim; men only where the
  // side's rule lets them in. Whole persons: the expected arrivals accumulate and move when they make one.
  function forward(P, o, F) {
    const k = willing(o.trim, F);
    for (let g = 0; g < 4; g++) {
      const G = P.groups[g], mu = MEN[P.rule[GROUPS[g].side]];
      for (let j = 0; j < 2; j++) {
        const h = j === 0 ? k : k * mu;
        if (!(h > 0) || G.R[j] <= 0) continue;
        G.credit[j] += G.R[j] * (1 - C.exp(-h * o.dt / MIN));
        const move = Math.min(G.R[j], Math.floor(G.credit[j]));
        if (move > 0) { G.R[j] -= move; G.Q[j] += move; G.credit[j] -= move; }
      }
    }
  }
  // who the rule lets into a boat at group g: waiting now, and still to come
  function waiting(P, g) { const G = P.groups[g]; return P.rule[GROUPS[g].side] === 'only' ? G.Q[0] : G.Q[0] + G.Q[1]; }
  function toCome(P, g) { const G = P.groups[g], r = P.rule[GROUPS[g].side]; return r === 'only' ? G.R[0] + G.Q[0] : (G.R[0] + G.Q[0] + (MEN[r] > 0 ? G.R[1] : 0) + G.Q[1]); }
  // the next boat a party could start loading at group g, in the order of the night
  function nextBoat(P, g) { for (const i of WORK[g]) if (P.boats[i].state === 'swungOut') return i; return -1; }

  // the people the next boat at group g could expect within a party's pace: those waiting, and those likely to come
  function expected(P, g, o, F) {
    const G = P.groups[g], mu = MEN[P.rule[GROUPS[g].side]];
    return waiting(P, g) + (G.R[0] + mu * G.R[1]) * (1 - C.exp(-willing(o.trim, F) * F.pace));
  }
  // A party has two loading points (one or two officers to a group [read: the note 11.2]). With both free it chooses its
  // group. RATE.follow 'group' (the reader's): it stays while a boat there is ready to load, and moves to the other group on
  // its side when none is. 'people' (tried in the calibration): it also leaves when its next boat could not expect the
  // officers' minimum within its pace while people enough to fill a boat wait at the other group [bet: "the port boats
  // waited for passengers" while the officers worked aft, the note 3.3]. A free loading point takes the next boat ready
  // at the party's group.
  function party(P, p, o, F, work) {
    const pt = P.parties[p];
    if (pt.walk > 0) { pt.walk -= o.dt * work / MIN; if (pt.walk > 0) return; pt.walk = 0; }
    if (pt.slots[0] < 0 && pt.slots[1] < 0) {
      const g = pt.g, other = OTHER[g], here = nextBoat(P, g), there = nextBoat(P, other);
      const stay = here >= 0 && (there < 0 || RATE.follow === 'group' || expected(P, g, o, F) >= RATE.minFill * BOATS[here].cap ||
        waiting(P, other) < BOATS[there].cap);
      if (!stay) { if (there >= 0) { pt.g = other; pt.walk = T.walk; } return; }
    }
    for (let s = 0; s < pt.slots.length; s++) {
      if (pt.slots[s] >= 0) continue;
      const i = nextBoat(P, pt.g); if (i < 0) return;
      const b = P.boats[i];
      b.state = 'loading'; b.tLoad = o.t; b.loadT = 0; b.credit = 0; b.party = p; b.slot = s; pt.slots[s] = i;
    }
  }
  function release(P, b) { if (b.party >= 0) { P.parties[b.party].slots[b.slot] = -1; b.party = -1; b.slot = -1; } }

  // the gap at a boat on the low side, m (the note, section 5)
  function gapAt(i, list) {
    const side = BOATS[i].side, lowSide = (side === 'P' && list < 0) || (side === 'S' && list > 0);
    return RATE.gap0 + (lowSide ? RATE.gapL * C.sin(Math.abs(list) * DEG) : 0);
  }
  // list away from a boat (her side high), deg
  function listAway(i, list) { return BOATS[i].side === 'S' ? -list : list; }
  function wayFactor(kn) { return kn <= RATE.wayFull ? 1 : (kn <= RATE.wayNone ? 0.5 : 0); }

  function load(P, i, o, F, work) {
    const b = P.boats[i], d = BOATS[i], g = d.g, G = P.groups[g], rule = P.rule[d.side];
    b.loadT += o.dt * work / MIN;
    // people step in at the load rate, slower across a gap; women and children first, men where the rule lets them
    const gap = gapAt(i, o.list), gf = gap < RATE.gapHalf ? 1 : (gap < RATE.gapJump ? 0.5 : 0.25);
    b.credit += RATE.load * work * gf * o.dt / MIN;
    while (b.credit >= 1 && b.n + d.man < d.cap) {
      let j = -1;
      if (G.Q[0] > 0) j = 0; else if (rule !== 'only' && G.Q[1] > 0) j = 1;
      if (j < 0) break;
      G.Q[j]--; b.n++; if (j === 0) b.wc++; else b.men++; b.credit -= 1;
    }
    if (b.credit > 1) b.credit = 1;           // nobody waiting: the rate is not banked
    // the officer's word to lower
    const held = b.n + d.man, full = held >= d.cap, want = rule === 'fill' ? 1 : P.fill;
    const near = o.drop[i] <= RATE.near, gone = toCome(P, g) < 1;
    const ready = b.loadT >= F.pace && (full || gone || (held >= want * d.cap && waiting(P, g) < 1));
    if (!(ready || near)) return;
    if (wayFactor(o.kn) <= 0 || listAway(i, o.list) > RATE.noLower) return;   // she cannot be lowered now: she waits, loaded
    // her hands come aboard from the men on that part of the deck, else from anywhere aboard
    let need = d.man;
    for (let k = 0; k < 4 && need > 0; k++) {
      const H = P.groups[(g + k) % 4];
      const r = Math.min(need, H.R[1]); H.R[1] -= r; need -= r;
      const q = Math.min(need, H.Q[1]); H.Q[1] -= q; need -= q;
    }
    const crew = d.man - need;
    b.n += crew; b.men += crew;
    b.state = 'lowering'; b.tLower = o.t; b.low = 0; b.h = o.drop[i];
    b.gap = gap; b.list = o.list; b.kn = o.kn;
    release(P, b);
  }

  function lower(P, i, o, work) {
    const b = P.boats[i];
    if (b.tWater >= 0) {                      // afloat: the falls released, she pulls clear
      b.h = 0; b.waterT += o.dt / MIN;
      if (b.waterT >= T.release) { b.state = 'away'; b.tAway = o.t; note(P, o.t, BOATS[i].id, 'away with ' + b.n); }
      return;
    }
    const away = listAway(i, o.list);
    let v = RATE.lower * work * wayFactor(o.kn) / (1 + RATE.trimSlow * Math.max(0, Math.abs(o.trim) - 5));
    if (away > RATE.noLower) v = 0;
    else if (away > 0 && RATE.gapL + b.low > RATE.reach / C.sin(away * DEG)) v *= 0.5;   // she bears on the side
    b.low += v * o.dt;
    b.h = o.drop[i] - b.low;
    if (b.h <= 0 || o.drop[i] <= RATE.lowStation) { b.h = 0; b.tWater = o.t; b.waterT = 0; b.place = placeOf(o, i); }
  }

  function founder(P, o) {
    const t = o.t;
    P.over = true; P.tFounder = t;
    for (let i = 0; i < NB; i++) {
      const b = P.boats[i];
      if (b.state === 'lowering') {
        if (b.tWater >= 0) { b.state = 'away'; b.tAway = t; note(P, t, BOATS[i].id, 'away with ' + b.n); }
        else { b.state = 'floated'; b.tFloat = t; b.h = 0; b.place = placeOf(o, i); note(P, t, BOATS[i].id, 'cut free as she goes, ' + b.n + ' in her'); }
      } else if (onDeck(b)) {
        P.water += b.n; b.state = 'lost'; b.tLost = t; b.h = NaN;
        release(P, b);
        note(P, t, BOATS[i].id, 'goes down with her' + (b.n ? ', ' + b.n + ' in her' : ''));
      }
    }
    for (const G of P.groups) { P.water += G.R[0] + G.R[1] + G.Q[0] + G.Q[1]; G.R[0] = G.R[1] = G.Q[0] = G.Q[1] = 0; }
    note(P, t, null, 'She founders');
  }

  function count(P) {
    const c = P.count;
    let aboard = 0, inBoats = 0, inAway = 0, away = 0, empty = 0, floated = 0, lost = 0;
    for (const G of P.groups) aboard += G.R[0] + G.R[1] + G.Q[0] + G.Q[1];
    for (let i = 0; i < NB; i++) {
      const b = P.boats[i];
      if (b.state === 'lost') { lost++; continue; }
      inBoats += b.n;
      if (b.state === 'away') { away++; inAway += b.n; empty += BOATS[i].cap - b.n; }
      if (b.state === 'floated') floated++;
    }
    c.aboard = aboard; c.inBoats = inBoats; c.inBoatsAway = inAway; c.water = P.water; c.boatsAway = away; c.emptyAway = empty;
    c.floated = floated; c.lost = lost; c.total = aboard + inBoats + P.water;
  }

  // ------------------------------------------------------------------ the reader
  function attach(sim) { sim.people = fresh(); return sim.people; }
  function step(sim) { const P = sim.people; if (!P) return; tick(P, observe(sim, P.obs)); }

  // the orders: why one would be refused now (null: it would be carried out)
  function valid(type, value, arg) {
    if (type === 'boats:uncover') return value === 'now' && arg === undefined;
    if (type === 'boats:rule') return RULES.indexOf(value) >= 0 && typeof arg === 'string' && Object.prototype.hasOwnProperty.call(SIDES, arg);
    if (type === 'boats:fill') return typeof value === 'number' && FILLS.indexOf(value) >= 0 && arg === undefined;
    return false;
  }
  const RULE_WORDS = { only: 'women and children only', first: 'women and children first', fill: 'fill her' };
  const SIDE_WORDS = { P: 'port', S: 'starboard' };
  function why(sim, type, value, arg) {
    const P = sim.people;
    if (!P) return 'There are no boats on this run';
    if (!valid(type, value, arg)) return 'That is not an order the boats know';
    if (sim.foundered || P.over) return 'She has gone: there is nothing left to order';
    if (type === 'boats:uncover') {
      if (!(sim.night && sim.night.tTouch >= 0)) return 'Nothing calls for the boats yet: she has not touched the ice';
      if (P.uncoverT >= 0) return 'The boats are already being uncovered, since ' + Math.round((P.uncoverT - sim.night.tTouch) / MIN) + ' min after the touch';
      return null;
    }
    const open = (s) => P.boats.some((b, i) => BOATS[i].side === s && onDeck(b));
    if (type === 'boats:rule') {
      const sides = SIDES[arg];
      if (sides.every(s => P.rule[s] === value)) return 'That is already the rule on the ' + (sides.length > 1 ? 'both sides' : SIDE_WORDS[sides[0]] + ' side') + ': ' + RULE_WORDS[value];
      if (!sides.some(open)) return 'No boat is left to load on the ' + (sides.length > 1 ? 'either side' : SIDE_WORDS[sides[0]] + ' side');
      return null;
    }
    if (type === 'boats:fill') {
      if (P.fill === value) return 'That is already the order: lower a boat once she holds ' + Math.round(value * 100) + ' % of her places';
      if (!open('P') && !open('S')) return 'Every boat has gone';
      return null;
    }
    return 'That is not an order the boats know';
  }
  function give(type) {
    return function (sim, value, arg) {
      const P = sim.people, no = why(sim, type, value, arg);
      if (no) { if (P) P.refused.push({ k: sim.night ? sim.night.k : -1, t: sim.t, type, value, arg, why: no }); return false; }
      if (type === 'boats:uncover') uncover(P, sim.t, 'order');
      else if (type === 'boats:rule') { for (const s of SIDES[arg]) P.rule[s] = value; note(P, sim.t, null, 'Your order: ' + RULE_WORDS[value] + ', ' + (arg === 'both' ? 'both sides' : arg + ' side')); }
      else if (type === 'boats:fill') { P.fill = value; note(P, sim.t, null, 'Your order: lower a boat once she holds ' + Math.round(value * 100) + ' % of her places'); }
      P.orders.push({ k: sim.night ? sim.night.k : -1, t: sim.t, type, value, arg });
      return true;
    };
  }
  const ORDERS = { 'boats:uncover': give('boats:uncover'), 'boats:rule': give('boats:rule'), 'boats:fill': give('boats:fill') };

  // ------------------------------------------------------------------ what it says
  // the count, and each boat: everything a page or a test needs, as plain data
  function readouts(sim) {
    const P = sim && sim.people; if (!P) return null;
    const c = P.count, tT = sim.night ? sim.night.tTouch : -1;
    return {
      aboard: c.aboard, inBoats: c.inBoats, inBoatsAway: c.inBoatsAway, water: c.water, total: c.total, boatsAway: c.boatsAway, emptyAway: c.emptyAway,
      floated: c.floated, lost: c.lost, places: PLACES, boats: NB, aboardAtStart: PEOPLE.aboard,
      rule: { port: P.rule.P, starboard: P.rule.S }, fill: P.fill, uncoverT: P.uncoverT, uncoverBy: P.uncoverBy, callT: P.callT, tTouch: tT, tFounder: P.tFounder,
      parties: P.parties.map(p => ({ side: p.side, group: GROUPS[p.g].name, walking: p.walk > 0, boats: p.slots.filter(i => i >= 0).map(i => BOATS[i].id) })),
      list: P.boats.map((b, i) => ({ id: BOATS[i].id, side: BOATS[i].side, group: GROUPS[BOATS[i].g].name, cap: BOATS[i].cap, state: b.state, n: b.n, h: b.h, drop: b.drop,
        tLower: b.tLower, tWater: b.tWater, tAway: b.tAway, tFloat: b.tFloat, tLost: b.tLost, place: b.place })),
    };
  }
  // the people in the water still alive t seconds after she went, by the survival bet (RATE.tauWater): a number, plainly
  function aliveInWater(sim, after) { const P = sim.people; if (!P || P.tFounder < 0) return 0; return P.water * C.exp(-Math.max(0, after) / (RATE.tauWater * MIN)); }
  function stateOf(i) { return STATES.indexOf(i); }

  const API = { BOATS, GROUPS, WORK, get STATION() { return stations(); }, OUT, PEOPLE, T, RATE, FIT, RULES, FILLS, STATES, PLACES, RULE_WORDS, IDX,
    fresh, observe, tick, willing, attach, step, valid, why, readouts, aliveInWater, gapAt, stateOf, ORDERS };
  if (N && N.reader) N.reader({ name: 'boats', state: 'people', attach, step, orders: ORDERS, valid });
  return API;
});

/*
 * G26: her named places as one table, and the walk between two along her decks and stairs
 * (docs/DESIGN_G26_her_named_places_and_walks_v1_2026-11-24.md). A library, as cabins.js is: it keeps no state,
 * registers no reader and writes nothing into a sim, so no fingerprint moves. Its two tables are baked here, since core
 * reads no data file at run time. tools/places_table.js --write derives them (the places from their sources by the
 * model's own functions, the walks over roomnet's rooms), and tools/places_tests.js holds them.
 *
 *   PLACES            [{ key, name, deck, x, y, z, zone, side, row, room, src, tag }], in the ship frame (m): z is the
 *                     floor a man stands on; row is the R3 row it stands in (null on an open deck); room is the roomnet
 *                     room the walk starts from; src and tag are its source ([read], [scaled], [derived] or [bet])
 *   place(key)        the place, or null
 *   walk(a, b)        { m, climb }: metres along her decks and stairs between two places, and the height climbed or
 *                     descended on the way (a stair counts its rise x 1.6 in m) [bet]; null for an unknown place
 *   nearest(x, y, z)  every place by straight distance from a point, the nearest first: [{ key, d }]
 *
 * Nothing here times a walk or says who hears whom: a reader turns metres into minutes at its own pace, and sets its own
 * earshot. The numbers that disagree elsewhere (the bridge's front, the wireless room, the rocket socket) are printed
 * by tools/places_tests.js, not settled here.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TitanicPlaces = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  // the places (tools/places_table.js --write)
  const PLACES = /* PLACES BEGIN */ [
    {"key":"bridge","name":"the navigating bridge's front, on the centreline","deck":"Boat","x":72.5,"y":0,"z":29.34,"zone":3,"side":0,"row":null,"room":"rest@4:P:Boat","src":"the topsides note (docs/research/RESEARCH_topsides_dimensions_v1_2026-11-19.md): the front +72.5 on the centreline, curving back to +69.6 at the wing cabs; BWC's \"190 ft. from the bow\" gives +72.7","tag":"scaled"},
    {"key":"wing.port","name":"the bridge's port wing cab","deck":"Boat","x":68.6,"y":14.7,"z":29.21,"zone":4,"side":0,"row":null,"room":"rest@4:P:Boat","src":"the topsides note (docs/research/RESEARCH_topsides_dimensions_v1_2026-11-19.md): the wing cabs at +67.6 to +69.6, about 0.4 m beyond her side","tag":"scaled"},
    {"key":"wing.stbd","name":"the bridge's starboard wing cab","deck":"Boat","x":68.6,"y":-14.7,"z":29.21,"zone":4,"side":1,"row":null,"room":"rest@4:S:Boat","src":"the topsides note (docs/research/RESEARCH_topsides_dimensions_v1_2026-11-19.md): the wing cabs at +67.6 to +69.6, about 0.4 m beyond her side","tag":"scaled"},
    {"key":"wheelhouse","name":"the wheelhouse","deck":"Boat","x":65.75,"y":0,"z":29.12,"zone":4,"side":0,"row":"Bt-12","room":"Bt-12@4:P:Boat","src":"R3 Bt-12, its outline's centroid; the topsides note (docs/research/RESEARCH_topsides_dimensions_v1_2026-11-19.md) gives +64.8 to +67.8","tag":"read"},
    {"key":"chartroom","name":"the chart room","deck":"Boat","x":63,"y":0,"z":29.04,"zone":4,"side":0,"row":"Bt-10","room":"Bt-10@4:P:Boat","src":"the topsides note (docs/research/RESEARCH_topsides_dimensions_v1_2026-11-19.md): \"immediately abaft\" the wheelhouse; one room deep [bet]","tag":"bet"},
    {"key":"wireless","name":"the Marconi room, with the silent room","deck":"Boat","x":48,"y":0,"z":28.65,"zone":5,"side":0,"row":"Bt-10","room":"Bt-10@5:P:Boat","src":"R3 Bt-10 names the silent room and the Marconi room; the topsides note (docs/research/RESEARCH_topsides_dimensions_v1_2026-11-19.md) puts the Marconi rooms on the centreline abaft funnel 1's casing (+50.7 to +59.4). Its x is a bet: core/readers/world.js has 50 [bet], and Bride's \"at the after end of the officers' deckhouse\" would be +36 to +40","tag":"bet"},
    {"key":"nest","name":"the crow's nest, its floor","deck":null,"x":92.61,"y":0,"z":37,"zone":2,"side":0,"row":"C-076","room":"C-076@2:P:C","src":"site/topsides.js's nestOf: the lookouts' eye 29.0 m over her waterline at the night's drafts (BWC \"about 95 ft.\" [read]), the floor 1.5 m under it, on the foremast's axis; reached by the mast's ladder from the forecastle deck [bet]","tag":"derived"},
    {"key":"socket.stbd","name":"the rocket socket in the starboard rail, by emergency boat No. 1","deck":"Boat","x":65.9,"y":-14.1,"z":29.13,"zone":4,"side":1,"row":null,"room":"rest@4:S:Boat","src":"Boxhall: in the starboard rail by emergency boat No. 1 (core/readers/world.js) [read]; No. 1's davits at +65.72 and +66.18 (Read's davit article, via the topsides note (docs/research/RESEARCH_topsides_dimensions_v1_2026-11-19.md)) [read]; the socket between them [bet]","tag":"bet"},
    {"key":"socket.port","name":"a rocket socket in the port rail, by emergency boat No. 2","deck":"Boat","x":55.9,"y":14.1,"z":28.84,"zone":4,"side":0,"row":null,"room":"rest@4:P:Boat","src":"a socket a side [bet]; No. 2's davits at +55.70 and +56.16 (Read's davit article, via the topsides note (docs/research/RESEARCH_topsides_dimensions_v1_2026-11-19.md))","tag":"bet"},
    {"key":"lamp","name":"the Morse lamp","deck":"Boat","x":68.6,"y":-14.7,"z":29.21,"zone":4,"side":1,"row":null,"room":"rest@4:S:Boat","src":"NOT FOUND: taken at the bridge's starboard wing cab [bet]","tag":"bet"},
    {"key":"platform","name":"the reciprocating engines' starting platform","deck":"orlop","x":-29,"y":0,"z":1.6,"zone":10,"side":0,"row":"O-024","room":"O-024@10:P:below G","src":"R3 O-024 names \"its platforms\"; at the engine room's forward end on the centreline, on its floor [bet]","tag":"bet"},
    {"key":"stokehold.6","name":"boiler room 6, its stokehold","deck":"orlop","x":63.59,"y":0,"z":1.6,"zone":4,"side":0,"row":"O-013","room":"O-013@4:P:below G","src":"R3 O-013, its outline's centroid, on its floor","tag":"read"},
    {"key":"stokehold.5","name":"boiler room 5, its stokehold","deck":"orlop","x":45.57,"y":0,"z":1.6,"zone":5,"side":0,"row":"O-015","room":"O-015@5:P:below G","src":"R3 O-015, its outline's centroid, on its floor","tag":"read"},
    {"key":"stokehold.4","name":"boiler room 4, its stokehold","deck":"orlop","x":27.97,"y":0,"z":1.6,"zone":6,"side":0,"row":"O-017","room":"O-017@6:P:below G","src":"R3 O-017, its outline's centroid, on its floor","tag":"read"},
    {"key":"stokehold.3","name":"boiler room 3, its stokehold","deck":"orlop","x":10.75,"y":0,"z":1.6,"zone":7,"side":0,"row":"O-019","room":"O-019@7:P:below G","src":"R3 O-019, its outline's centroid, on its floor","tag":"read"},
    {"key":"stokehold.2","name":"boiler room 2, its stokehold","deck":"orlop","x":-7.8,"y":0,"z":1.6,"zone":8,"side":0,"row":"O-021","room":"O-021@8:P:below G","src":"R3 O-021, its outline's centroid, on its floor","tag":"read"},
    {"key":"stokehold.1","name":"boiler room 1, its stokehold","deck":"orlop","x":-23.28,"y":0,"z":1.6,"zone":9,"side":0,"row":"O-023","room":"O-023@9:P:below G","src":"R3 O-023, its outline's centroid, on its floor","tag":"read"},
    {"key":"postoffice","name":"the post office (the sorting room), where the mail clerks worked","deck":"G","x":75.31,"y":-8.46,"z":10.08,"zone":3,"side":1,"row":"G-018","room":"G-018@3:S:G","src":"R3 G-018, its outline's centroid","tag":"read"},
    {"key":"mailroom","name":"the mail room (the sorting room's store), under the post office","deck":"orlop","x":78.4,"y":-6.62,"z":7.75,"zone":3,"side":1,"row":"O-010","room":"O-010@3:S:below G","src":"R3 O-010, its outline's centroid","tag":"read"},
  ] /* PLACES END */;
  // the walks: WALK[a][b] = [metres, climb] for a place a before b in PLACES' order (tools/places_table.js --write)
  const WALK = /* WALK BEGIN */ {
    "bridge": {"wing.port":[21.1,0.37],"wing.stbd":[30.3,0.54],"wheelhouse":[12.9,0.29],"chartroom":[18.9,0.5],"wireless":[32.2,0.79],"nest":[169.3,26.32],"socket.stbd":[28.3,0.46],"socket.port":[23.1,0.5],"lamp":[30.3,0.54],"platform":[279.4,28.56],"stokehold.6":[186.9,29.69],"stokehold.5":[205.9,29.69],"stokehold.4":[219.9,29.69],"stokehold.3":[235.5,29.69],"stokehold.2":[259.1,29.69],"stokehold.1":[270,29.69],"postoffice":[142.5,20.71],"mailroom":[144.2,23.04]},
    "wing.port": {"wing.stbd":[33.3,0.41],"wheelhouse":[15.9,0.16],"chartroom":[21.9,0.37],"wireless":[35.2,0.66],"nest":[172.3,26.19],"socket.stbd":[31.3,0.33],"socket.port":[26.1,0.37],"lamp":[33.3,0.41],"platform":[282.3,28.43],"stokehold.6":[189.9,29.56],"stokehold.5":[208.9,29.56],"stokehold.4":[222.9,29.56],"stokehold.3":[238.5,29.56],"stokehold.2":[262.1,29.56],"stokehold.1":[273,29.56],"postoffice":[145.4,20.58],"mailroom":[147.2,22.91]},
    "wing.stbd": {"wheelhouse":[21.4,0.32],"chartroom":[23.6,0.37],"wireless":[34.2,0.66],"nest":[168,26.19],"socket.stbd":[22.1,0.33],"socket.port":[35.3,0.53],"lamp":[24.1,0.41],"platform":[278,28.43],"stokehold.6":[185.6,29.56],"stokehold.5":[204.6,29.56],"stokehold.4":[218.6,29.56],"stokehold.3":[234.2,29.56],"stokehold.2":[257.8,29.56],"stokehold.1":[268.7,29.56],"postoffice":[141.1,20.58],"mailroom":[142.9,22.91]},
    "wheelhouse": {"chartroom":[11.9,0.29],"wireless":[25.2,0.57],"nest":[162.3,26.11],"socket.stbd":[19.4,0.24],"socket.port":[17.9,0.29],"lamp":[21.4,0.32],"platform":[272.4,28.35],"stokehold.6":[179.9,29.47],"stokehold.5":[198.9,29.47],"stokehold.4":[212.9,29.47],"stokehold.3":[228.5,29.47],"stokehold.2":[252.1,29.47],"stokehold.1":[263,29.47],"postoffice":[135.4,20.49],"mailroom":[137.2,22.82]},
    "chartroom": {"wireless":[21.4,0.49],"nest":[158.5,26.02],"socket.stbd":[21.6,0.29],"socket.port":[24,0.5],"lamp":[23.6,0.37],"platform":[268.5,28.26],"stokehold.6":[176.1,29.39],"stokehold.5":[195.1,29.39],"stokehold.4":[209.1,29.39],"stokehold.3":[224.7,29.39],"stokehold.2":[248.3,29.39],"stokehold.1":[259.2,29.39],"postoffice":[131.6,20.41],"mailroom":[133.4,22.74]},
    "wireless": {"nest":[143.3,25.63],"socket.stbd":[32.2,0.58],"socket.port":[37.2,0.78],"lamp":[34.2,0.66],"platform":[253.3,27.87],"stokehold.6":[160.9,29],"stokehold.5":[179.9,29],"stokehold.4":[193.9,29],"stokehold.3":[209.5,29],"stokehold.2":[233.1,29],"stokehold.1":[243.9,29],"postoffice":[116.4,20.02],"mailroom":[118.2,22.35]},
    "nest": {"socket.stbd":[166,26.11],"socket.port":[174.3,26.32],"lamp":[168,26.19],"platform":[203.1,35.4],"stokehold.6":[102,35.4],"stokehold.5":[121,35.4],"stokehold.4":[135,35.4],"stokehold.3":[150.6,35.4],"stokehold.2":[174.2,35.4],"stokehold.1":[185.1,35.4],"postoffice":[72.3,26.97],"mailroom":[74,29.3]},
    "socket.stbd": {"socket.port":[33.3,0.45],"lamp":[22.1,0.33],"platform":[276,28.35],"stokehold.6":[183.6,29.48],"stokehold.5":[202.6,29.48],"stokehold.4":[216.6,29.48],"stokehold.3":[232.2,29.48],"stokehold.2":[255.8,29.48],"stokehold.1":[266.7,29.48],"postoffice":[139.1,20.5],"mailroom":[140.9,22.83]},
    "socket.port": {"lamp":[35.3,0.53],"platform":[284.4,28.56],"stokehold.6":[191.9,29.68],"stokehold.5":[210.9,29.68],"stokehold.4":[224.9,29.68],"stokehold.3":[240.5,29.68],"stokehold.2":[264.1,29.68],"stokehold.1":[275,29.68],"postoffice":[147.5,20.7],"mailroom":[149.2,23.03]},
    "lamp": {"platform":[278,28.43],"stokehold.6":[185.6,29.56],"stokehold.5":[204.6,29.56],"stokehold.4":[218.6,29.56],"stokehold.3":[234.2,29.56],"stokehold.2":[257.8,29.56],"stokehold.1":[268.7,29.56],"postoffice":[141.1,20.58],"mailroom":[142.9,22.91]},
    "platform": {"stokehold.6":[126,0],"stokehold.5":[109.3,0],"stokehold.4":[102.3,0],"stokehold.3":[69.9,0],"stokehold.2":[48.4,0],"stokehold.1":[36.5,0],"postoffice":[159,8.62],"mailroom":[148,6.15]},
    "stokehold.6": {"stokehold.5":[43.9,0],"stokehold.4":[57.9,0],"stokehold.3":[73.5,0],"stokehold.2":[97.1,0],"stokehold.1":[108,0],"postoffice":[61.4,8.62],"mailroom":[50.4,6.15]},
    "stokehold.5": {"stokehold.4":[41.2,0],"stokehold.3":[56.8,0],"stokehold.2":[80.4,0],"stokehold.1":[91.2,0],"postoffice":[80.4,8.62],"mailroom":[69.4,6.15]},
    "stokehold.4": {"stokehold.3":[49.8,0],"stokehold.2":[73.4,0],"stokehold.1":[84.2,0],"postoffice":[94.5,8.62],"mailroom":[83.4,6.15]},
    "stokehold.3": {"stokehold.2":[41,0],"stokehold.1":[51.9,0],"postoffice":[110.1,8.62],"mailroom":[99.1,6.15]},
    "stokehold.2": {"stokehold.1":[30.3,0],"postoffice":[133.6,8.62],"mailroom":[122.6,6.15]},
    "stokehold.1": {"postoffice":[144.5,8.62],"mailroom":[133.5,6.15]},
    "postoffice": {"mailroom":[11.1,2.47]},
    "mailroom": {},
  } /* WALK END */;

  const byKey = new Map(PLACES.map((p) => [p.key, p]));
  function place(key) { return byKey.get(key) || null; }
  function walk(a, b) {
    if (!byKey.has(a) || !byKey.has(b)) return null;
    if (a === b) return { m: 0, climb: 0 };
    const w = (WALK[a] && WALK[a][b]) || (WALK[b] && WALK[b][a]) || null;
    return w ? { m: w[0], climb: w[1] } : null;
  }
  function nearest(x, y, z) {
    return PLACES.map((p) => ({ key: p.key, d: Math.sqrt((p.x - x) * (p.x - x) + (p.y - y) * (p.y - y) + (p.z - z) * (p.z - z)) }))
      .sort((a, b) => a.d - b.d || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  }
  return { PLACES, WALK, place, walk, nearest };
});

/*
 * Reports to the bridge: the night as the bridge knew it (step 3 of docs/BRAINSTORM_the_whole_night_v1_2026-11-17.md,
 * sections 2.3, 2.4 and 7). A reader of the watch (core/night.js, "readers"): attached to every watch, stepped after
 * the model's own step, its state in sim.reports. It reads the model and never writes into the flooding, the motion,
 * the ice or the plant, and it pushes nothing into sim.events: the feed is its own.
 *
 * Nothing on the bridge measured water: every word about flooding came by a man on foot or a telephone, and for the
 * first ten minutes of 1912 none came at all. A report here is a fact of the model (water over the orlop deck in the
 * mail room, water over the plates in a boiler room), noticed by someone placed to notice it, carried to the bridge in
 * the time that took, in the words of the day. Its content is the model's state when the fact was so, never when it
 * arrives. The bridge learns words and feet, never tons or tons a minute.
 *
 *   RULES     the bridge note's 11.2 as one table: who notices water in which space and when, the route, the delay, the
 *             words. A probability is drawn from the night's seed, one keyed draw per decision, so a night replays.
 *   UNASKED   what the bridge did by itself after the touch on the night: an officer below, the carpenter sent for, the
 *             commutator read, a note to the chief engineer; then an officer to a space a man has reported, and the
 *             builder's man below once water is reported. They run on any night with a touch, as the pump rules do.
 *   PARTS, SOUND, ASK   the orders the player can give (and the bridge gives itself): an officer to look at a part of
 *             the ship, the carpenter to sound the wells, a note to the engine room; each logged ('report:look',
 *             'report:sound', 'report:ask') like the helm's, and replayed with it.
 *   DESIGNER  the builder's man's estimate: the model's own forecast from the moment his view is formed, with the bias
 *             of the night in one constant (a bet fitted to one night).
 *   ROUTINE   the bells on the half hour, the reliefs, and how they lapse once the boats are ordered (one switch).
 *   knowledge(sim)   what the bridge knows now: each compartment unknown, reported dry, water reported, or lost; her
 *             list from the commutator; her trim in words.        feed(sim)   the reports so far, as they arrived.
 *
 * Sources: docs/research/RESEARCH_the_night_on_the_bridge_v1_2026-11-17.md (the bridge note, cited "note"): section 11
 * is the specification. Tags: [read] where the note reads it in a source, [derived] where it is worked from the note's
 * script, [bet] where nothing gives it. Times: T = minutes after the touch; the note's 11.1 rows are cited by their t.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../core.js'), require('../night.js'));
  else root.TitanicReports = factory(root.TitanicCore, root.TitanicNight);
})(typeof self !== 'undefined' ? self : this, function (C, N) {
  'use strict';
  if (!C || !N || !N.reader) return null;
  const FT = C.FT, MIN = 60, EPS = 1e-9, DEG = Math.PI / 180;
  const ft = (m) => m / FT;
  const r5 = (x) => 5 * Math.round(x / 5);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const list = (a) => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];

  // the spaces as the men named them (the core's zones, core/core.js ZONES); the mail room is in No. 3 hold [read: the
  // note's 11.1 key, "the mail room is in zone 3"]
  const NAMES = ['the forepeak', 'No. 1 hold', 'No. 2 hold', 'No. 3 hold', 'boiler room 6', 'boiler room 5', 'boiler room 4',
    'boiler room 3', 'boiler room 2', 'boiler room 1', 'the engine room', 'the turbine room', 'the electric engine room',
    'the refrigerated hold', 'the after hold', 'the after peak'];
  const VOL = 1;            // m3 in a space before anyone there notices it [bet: the plant's "water first seen" (core/systems.js)]
  const AREAS = { forward: [1, 2, 3], amidships: [4, 5, 6, 7, 8, 9, 10, 11, 12], aft: [13, 14, 15] };

  // ------------------------------------------------------------------ the model, as a man would see it
  function level(sim, k) {                   // the highest free surface below E deck in zone k (world, m); -Infinity dry
    let h = -Infinity;
    for (let sd = 0; sd < 2; sd++) { const n = C.nodeIndex(k, sd, 0); if (sim.vol[n] > 1e-6 && sim.level[n] > h) h = sim.level[n]; }
    return h;
  }
  function sounding(sim, k) {                // the deepest water there, m: what a rod finds in the well (level less its lowest point)
    let d = 0;
    for (let sd = 0; sd < 2; sd++) { const n = C.nodeIndex(k, sd, 0); if (sim.vol[n] > 1e-6) d = Math.max(d, sim.level[n] - sim.zmin[n]); }
    return d;
  }
  function water(sim, k) { let v = 0; for (let s = 0; s < 4; s++) v += sim.vol[k * 4 + s]; return v; }
  const upper = (sim, k) => sim.vol[C.nodeIndex(k, 0, 1)] + sim.vol[C.nodeIndex(k, 1, 1)] >= VOL;      // water above E deck
  function deckAt(sim, F, k, deck) { const x = sim.ship.zones[k].xm; return C.worldZ(F, x, 0, C.deckZ(deck, x)); }
  // the forecastle head (the core's own mark, core/core.js MARKS 'fcastle'): its height above the sea, m
  const FC = [126, 0, C.zTopAt(126)];
  const freeboard = (F) => C.worldZ(F, FC[0], FC[1], FC[2]);

  // ------------------------------------------------------------------ the words
  const feet = (x) => Math.max(1, Math.round(x)) + ' ft';
  const feetN = (x) => { const n = Math.max(1, Math.round(x)); return n === 1 ? 'a foot' : n + ' feet'; };
  const rising = (rate) => rate >= 0.5 ? ', rising fast' : (rate >= 0.1 ? ', rising' : '');   // ft a minute [bet: what a man calls fast]
  // a room as the engineers or an officer report it: flooded and left, so many feet over the plates, or dry
  function roomWords(rooms, pumps) {
    const wet = rooms.filter(r => r.ft >= 0.5);
    if (!wet.length) return null;
    return wet.map(r => r.left ? cap(NAMES[r.k]) + ' flooded; its men have left' : cap(NAMES[r.k]) + ': ' + feet(r.ft) + ' of water' + (pumps && r.pumps ? ', its pumps on it' : '')).join('. ') + '.';
  }
  const WORDS = {
    look: {
      forward: (d) => {
        const F = d.zones.filter(z => z.overF !== null), E = d.zones.filter(z => z.onE);
        if (!F.length && !E.length) return 'No damage seen forward, down to F deck.';
        return [F.length ? 'Water on F deck over ' + list(F.map(z => NAMES[z.k])) : '', E.length ? 'water on E deck forward' : ''].filter(Boolean).map((s, i) => i ? s : cap(s)).join('; ') + '.';
      },
      mailroom: (d) => {
        if (!d.overOrlop) return 'The mail room is dry.';
        if (d.toG > 0) return 'Water in the mail room within ' + feetN(d.toG) + ' of G deck' + rising(d.rate) + '.';
        return 'Water ' + feetN(-d.toG) + ' over G deck at the mail room' + rising(d.rate) + '.';
      },
      boilers: (d) => roomWords(d.rooms, false) || 'The boiler rooms are dry.',
      engines: (d) => roomWords(d.rooms, false) || 'The engine rooms are dry.',
      aft: (d) => {
        const wet = d.rooms.filter(r => r.ft >= 0.5);
        return wet.length ? 'Water aft: ' + wet.map(r => NAMES[r.k] + ' ' + feet(r.ft)).join(', ') + '.' : 'Dry aft: no water in the shaft tunnel.';
      },
    },
    sound: (d) => {
      const wet = d.wells.filter(w => w.ft >= 0.5);
      if (!wet.length) return 'The wells are dry.';
      return (wet.some(w => w.ft >= 2) ? 'Making water fast: ' : 'Making water: ') + wet.map(w => feet(w.ft) + ' in ' + NAMES[w.k]).join(', ') + '.';
    },
    ask: (d) => roomWords(d.rooms, true) || 'The engine and boiler rooms are dry.',
    forepeak: (d) => d.store ? 'Water in the forepeak storerooms.' : 'Air hissing out of the forepeak tank: she is making water there. The storerooms are dry.',
    mail: (d) => 'The mail room is filling' + (d.rate >= 0.5 ? ' rapidly' : '') + '.',
    steward: (d) => 'Water on ' + d.deck + ' deck ' + d.area + '.',
    commutator: (d) => d.deg === 0 ? 'The commutator shows her upright.' : 'The commutator shows ' + Math.abs(d.deg) + (Math.abs(d.deg) === 1 ? ' degree' : ' degrees') + ' to ' + (d.deg > 0 ? 'starboard' : 'port') + '.',
    eye: (d) => cap(TRIM[d.cat]) + ': the forecastle head about ' + d.ft + ' ft above the water.',
  };
  const TRIM = ['on an even keel', 'a little down by the head', 'down by the head', 'well down by the head'];

  // ------------------------------------------------------------------ RULES: the bridge note's 11.2, one row a space
  // space, who notices and when, the route to the bridge and its delay (min), the words (WORDS), the tag.
  const RULES = {
    engineer: { space: 'boiler and engine rooms (zones 4 to 12)', who: 'The chief engineer', by: 'by telephone', ch: 'phone', words: 'ask',
      notices: 'the watch below, at once, water through the side or over the plates', pass: 0.5, judge: [10, 20], phone: 1,
      tag: '[bet] unasked only when the chief engineer judges it: with probability 0.5, 10 to 20 min after the water, by telephone (1 min) (note 11.2; in 1912 no unasked report is recorded); not when a note from the bridge has reached him since the water was seen: he has answered that [bet]; asked: ASK' },
    forepeak: { space: 'the forepeak (zone 0)', who: 'The chief officer, from the lamp trimmer', by: 'in person', ch: 'runner', words: 'forepeak',
      notices: 'anyone berthed forward hears the air forced out of the tank\'s air pipe', notice: [1, 5], relay: 5, pass: 0.5, then: [0, 5],
      tag: '[read] Hemming heard it and told Wilde, T 3 to 8 (BI 17711-17733; note 11.1); 1 to 5 min [read]; to the nearest officer about 5 min, and on to the bridge with probability 0.5 within 5 more [bet] (note 11.2)' },
    holds: { space: 'the holds (zones 1 to 3; the peaks and the after holds 13 to 15 [bet])', who: 'The carpenter', by: 'in person', ch: 'runner', words: 'sound',
      notices: 'his soundings, once ordered', tag: '[read] for 1912; the timing [derived] (note 11.2): see SOUND' },
    mail: { space: 'the mail room (zone 3: the orlop deck of No. 3 hold, the sorting room on G deck above it)', who: 'A mail clerk', by: 'in person', ch: 'runner', words: 'mail',
      notices: 'the clerks on duty, as soon as water covers the orlop deck, the mail room\'s floor', delay: 5,
      tag: '[read] the clerks found the mail room filling and one went on to the captain, about 5 min (Boxhall BI 15371; note 11.1 row t 13, 11.2)' },
    crew: { space: 'the crew\'s quarters forward (above zones 0 to 2)', who: 'the men in them', by: null, ch: null, words: null,
      notices: 'water on their deck', tag: '[read] it happened (Poingdestre BI 2844-2872); it reached the bridge only as "all hands to the boats" went the other way: no report here (note 11.2)' },
    steward: { space: 'passenger spaces on F and E decks: forward (1 to 3) [bet: and amidships 4 to 12 and aft 13 to 15]', who: 'The purser, from a steward', by: 'in person', ch: 'runner', words: 'steward',
      notices: 'stewards and passengers, when water reaches the deck', delay: [10, 20],
      tag: '[bet] steward -> chief steward or purser -> bridge, 10 to 20 min (note 11.2)' },
    officer: { space: 'the decks he walks', who: 'an officer', by: 'back from below', ch: 'runner', words: 'look',
      notices: 'what the model\'s levels were on the decks and at the times of his visit, so an early visit finds nothing',
      tag: '[derived] from Boxhall\'s two trips (note 11.2): see PARTS' },
    commutator: { space: 'her list', who: 'The commutator', by: 'on the bridge', ch: 'instrument', words: 'commutator', step: 2, gap: 5,
      notices: 'read at once, to about a degree', tag: '[read] the list indicator in the wheelhouse, read to about 1 degree, instantly (note 2, 11.2); a line when it has moved 2 degrees since the last, at most one in 5 min [bet]' },
    eye: { space: 'her trim', who: 'The officer of the watch', by: 'by eye', ch: 'instrument', words: 'eye', steps: [5, 15, 30],
      notices: 'the forecastle head\'s height above the water, judged to 5 ft',
      tag: '[read] by eye: the forecastle\'s freeboard and the forward well deck awash (note 11.2); the words change when the forecastle head stands 5, 15 and 30 ft lower than at the touch [bet: Olliver\'s "down 15 to 20 ft at the bows" at T 80 is the second step]' },
    phone: { space: 'a telephone to the bridge', unanswered: 0.3,
      tag: '[read] Hogg\'s call from the nest went unanswered, Rowe\'s from the poop did not (note 11.2); a probability 0.3 of no answer once the boats are ordered [bet]' },
    noise: { space: 'the boat deck while the steam blows off', add: 1, applied: false,
      tag: '[read] that it happened; add 1 min to a voice report on deck [bet] (note 11.2). Not applied here: the 1912 delays every rule above is worked from already carry the roar, which lasts from about T 1 to T 27 in the model (core/systems.js, Y1)' },
  };

  // ------------------------------------------------------------------ the orders, and their trips (min after the order)
  // An officer sent to look: where he goes, which spaces he sees, when he sees them (visit) and when he is back (back).
  const PARTS = {
    forward: { name: 'forward', zones: [1, 2, 3], visit: 4, back: 8,
      tag: '[derived] Boxhall went below on his own about a minute after the touch, down to F deck forward and up by the well deck, and was back at T 9 having seen no damage: there at about T 5, back 8 min after leaving (note 11.1 row t 9, fact 5; BI 15358-15367; the 6 to 9 min of 11.2)' },
    mailroom: { name: 'the mail room', zones: [3], visit: 3.5, back: 7,
      tag: '[derived] Boxhall went to the mail room on the clerk\'s report (T 13), saw it at about T 17 and reported at T 20 (note 11.1 row t 20; BI 15372-15377)' },
    boilers: { name: 'the boiler rooms', zones: [4, 5, 6, 7, 8, 9], visit: 5, back: 10, tag: '[bet] down an escape trunk to the stokeholds and back' },
    engines: { name: 'the engine rooms', zones: [10, 11, 12], visit: 6, back: 12, tag: '[bet] aft along the working alleyway and down' },
    aft: { name: 'aft', zones: [13, 14, 15], visit: 7, back: 14, tag: '[bet] the shaft tunnel and the after holds, the length of her' },
  };
  // The carpenter sent to sound: the wells he sounds, when, and when he reaches the bridge.
  const SOUND = { zones: [0, 1, 2, 3, 13, 14, 15], at: 6, back: 10,
    tag: '[derived] sent for at T 2 to 5, he had sounded the forward wells by about T 8 and reached the captain at T 12 (note 11.1 rows t 12, fact 8; Olliver US Day 7; Boxhall BI 15369); "10 to 13 min after the order" (11.2): the earliest. The after wells and the peaks [bet]' };
  // A note to the chief engineer: the runner there, the answer back.
  const ASK = { zones: [4, 5, 6, 7, 8, 9, 10, 11, 12], at: 4, back: 8,
    tag: '[derived] Olliver took the captain\'s note to the chief engineer, waited 2 or 3 min and came back: about 8 min (note 2, 11.1 row t 16: fact 12, delay 4; US Day 7 p.2)' };

  // What the bridge did unasked after the touch on the night (min after the touch).
  const UNASKED = [
    { after: 1, order: 'look', value: 'forward', who: 'The Fourth Officer',
      tag: '[read] Boxhall went below on his own about a minute after the touch (BI 15358; the note\'s conflict 12: his own account)' },
    { after: 2, order: 'sound', tag: '[read] the captain sent for the carpenter to sound the ship, T 2 to 5 (Olliver, US Day 7 p.2) [derived: the earliest]' },
    { after: 7, order: 'commutator', tag: '[read] the captain read the commutator 5 to 10 min after the touch (Hichens, US Day 5; the note\'s conflict 3)' },
    { after: 8, order: 'ask', tag: '[read] the captain\'s note to the chief engineer, carried by Olliver, T 10 to 18 (note 11.1 row t 16, fact 12)' },
  ];
  // ... and on the reports: an officer to see a space a man (not an officer) has reported, unless one is on his way there
  // or has looked in the last FOLLOW.recent min; and the builder's man below once water is reported (DESIGNER).
  const FOLLOW = { mail: 'mailroom', 'steward:forward': 'forward', 'steward:aft': 'aft', recent: 15,
    tag: '[derived] on the mail clerk\'s report the captain sent Boxhall to the mail room (BI 15372; note 11.1 rows t 13 and t 20); extended to the stewards\' reports forward and aft [bet]; 15 min [bet]' };

  // The builder's man's estimate. On the night he gave her "from an hour to an hour and a half" (BI 15610, passed on by
  // the captain), and she lasted two hours and forty minutes. The rule: he goes below with the captain when the first
  // report of water reaches the bridge, and his estimate is the model's own forecast from that moment (the core run
  // ahead from that state, as the page's forecast is run), the time left from when he speaks times `bias`, said in the
  // half hours either side of it. The forecast runs `pace` steps of the core a step of the watch, so that it looks
  // `horizon` min ahead in the `delay` min before he speaks (spread so, it costs the page a little a step instead of a
  // stall); past that he says "more than", and a forecast that lies steady (the page's rule: core/core.js run,
  // stopWhenStable) is "she will float".
  const DESIGNER = {
    who: 'The builder\'s man', by: 'to the captain', ch: 'voice',
    delay: 13,      // min from the first report of water reaching the bridge to his words to the captain [derived: the carpenter's
                    // report at T 12, the estimate at about T 25 (note 11.1 rows t 12 and t 25; Andrews had been below with
                    // the captain, the note's section 3 after Butler 1998); the note's own "fact 20, delay 5" is low confidence]
    bias: 0.57,     // [bet fitted to one night] the middle of what he said (75 min) over the time the model's forecast leaves
                    // her when he speaks on the 1912 watch (tools/reports_tests.js prints both): a little over half
    horizon: 180,   // min ahead the forecast can look before he speaks [a design figure: pace = horizon / delay]
    tag: '[read] the words (Boxhall BI 15610); [bet] the rule and its one constant, bias, fitted to the 1912 watch',
  };
  DESIGNER.pace = Math.round(DESIGNER.horizon / DESIGNER.delay);
  function halfHours(m) {                    // "an hour and a half" ...
    const h = Math.round(m / 30) / 2, whole = Math.floor(h), half = h - whole > 0;
    if (whole === 0) return 'half an hour';
    const n = ['', 'an hour', 'two hours', 'three hours', 'four hours', 'five hours', 'six hours', 'seven hours', 'eight hours'][whole] || whole + ' hours';
    return half ? (whole === 1 ? 'an hour and a half' : n.replace(' hours', ' and a half hours')) : n;
  }
  function estimateWords(e) {
    if (e.floats) return 'He says she will float.';
    if (e.beyond) return 'He gives her more than ' + halfHours(e.lo) + '.';
    if (e.lo <= 0) return 'He gives her less than half an hour.';
    return 'He gives her from ' + halfHours(e.lo) + ' to ' + halfHours(e.hi) + '.';
  }

  // The routine of a watch (note 11.3), and its lapse once the boats are ordered. This reader cannot see the boats
  // (another reader's): it takes them as ordered when the bridge learns she will founder, from the builder's man (on the
  // night the boat order came at T 20 to 25 and his estimate at about T 25: note 11.1, conflicts 6 and 7) [bet].
  const ROUTINE = {
    bell: 30,       // min: the bell on the half hour, struck by the quartermaster and answered from the nest [read: Hichens US
                    // Day 5; Boxhall US Day 3] (note 11.3); seven bells at 11:30 on the night [read: Lee BI 2420]
    relief: 120,    // min: the lookouts and the wheel relieved at the even hours [read: Lee BI 2393-2396; Fleet BI 17319;
                    // Hichens BI 935] (11.3); after the touch on the night the lookouts on time, the wheel 23 min late [read]
    call: 15,       // min before a relief: one bell, the next watch called [read: Hichens US Day 5, at 9:45 pm] (11.3, M)
    lapse: true,    // [bet] the note's proposal (11.3): after the boats are ordered the bells lapse when no quartermaster
                    // stands by (from the next half hour), the nest and the wheel at their next relief. false: never
    tag: '[read] the routine; [bet] its lapse (no bell is recorded after midnight on the night; note 11.3)',
  };
  const BELLS = ['Eight bells', 'One bell', 'Two bells', 'Three bells', 'Four bells', 'Five bells', 'Six bells', 'Seven bells'];
  // in seconds of the ship's clock: the bell, the relief, and the call before it (21:45, 23:45, 1:45 ...)
  const BELL = ROUTINE.bell * MIN, RELIEF = ROUTINE.relief * MIN, CALL = RELIEF - ROUTINE.call * MIN;

  // ------------------------------------------------------------------ the seed's draws
  // one number in [0, 1) for each decision, keyed by what it decides: from the night's seed through core/night.js's rng
  function draw(R, key) {
    let h = (2166136261 ^ R.seed) >>> 0;
    for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
    const u = N.rng(h >>> 0)();
    R.draws.push({ key, u });
    return u;
  }
  const within = (R, key, ab) => ab[0] + (ab[1] - ab[0]) * draw(R, key);

  // ------------------------------------------------------------------ state
  function attach(sim, sp) {
    const clock0 = (sp && sp.clock0) || 0, s0 = clock0 + sim.t;
    let call = Math.floor((s0 - CALL) / RELIEF) * RELIEF + CALL; while (call <= s0) call += RELIEF;
    const F = C.poseFrame(sim, sim.zO, sim.pitch, sim.roll, {});
    sim.reports = {
      seed: ((sp && sp.seed) || 0) >>> 0, clock0,
      feed: [], queue: [], tasks: [], seq: 0, draws: [], calls: 0, unanswered: [], phone: { current: true, why: 'on the lighting circuit' },
      zones: C.ZONES.map(() => ({ state: 'unknown', words: '', t: -1, tKnown: -1, who: '' })),
      tTouch: -1, stem: false, done: false, estimate: null, sinking: -1, water: -1, shadow: null,
      seen: new Float64Array(16).fill(-1), deckF: new Float64Array(16).fill(-1), deckE: new Float64Array(16).fill(-1),
      mail: -1, area: {}, engineer: false, askAt: -1, errands: {}, looked: {},
      bellT: (Math.floor(s0 / BELL) + 1) * BELL - clock0, callT: call - clock0, lapsedBells: false, lapsedReliefs: false,
      list: { read: false, said: 0, t: -1 }, trim: { fb0: freeboard(F), cat: 0, well: false, fcastle: false },
      samples: [{ t: -1, d: new Float64Array(16) }, { t: -1, d: new Float64Array(16) }],
      final: null, F: {},
    };
  }

  // a line to the bridge, delivered when its time comes (in order of time, then of saying)
  function say(R, q) {
    q.seq = R.seq++;
    let i = R.queue.length;
    while (i > 0 && R.queue[i - 1].t > q.t) i--;
    R.queue.splice(i, 0, q);
    return q;
  }
  function task(R, due, type, data) {
    const x = Object.assign({ due, type, seq: R.seq++ }, data || {});
    let i = R.tasks.length;
    while (i > 0 && R.tasks[i - 1].due > due) i--;
    R.tasks.splice(i, 0, x);
    return x;
  }
  // what the bridge knows of a space: lost > water > dry > unknown; a newer report of the same weight replaces the words
  const RANK = { unknown: 0, dry: 1, water: 2, lost: 3 };
  function know(R, k, state, words, tFact, tKnown, who) {
    const z = R.zones[k];
    if (RANK[state] < RANK[z.state]) return;
    z.state = state; z.words = words; z.t = tFact; z.tKnown = tKnown; z.who = who;
  }

  // ------------------------------------------------------------------ what a man sees, at the moment he sees it
  function riseRate(R, sim, k) {            // ft a minute in the deepest part of zone k, over the last 30 to 60 s
    const s = R.samples[0];
    if (s.t < 0 || sim.t - s.t < 1) return 0;
    return ft(sounding(sim, k) - s.d[k]) / ((sim.t - s.t) / MIN);
  }
  function rooms(sim, zones) {
    const P = sim.plant, out = [];
    for (const k of zones) {
      const d = sounding(sim, k);
      // its men leave when the water stands the core's own pumpAbandon over its lowest point (core/core.js params) [bet there]
      out.push({ k, ft: ft(d), left: d > sim.params.pumpAbandon, pumps: !!(P && P.pumpT && P.pumpT[k] >= 0) });
    }
    return out;
  }
  function roomsKnown(rs) {
    return rs.map(r => ({ k: r.k, state: r.ft < 0.5 ? 'dry' : (r.left ? 'lost' : 'water'), words: r.ft < 0.5 ? 'dry' : (r.left ? 'flooded, its men have left' : feet(r.ft) + ' of water') }));
  }
  function look(sim, R, part, F) {
    const P = PARTS[part];
    if (part === 'forward') {
      const zones = P.zones.map(k => { const h = level(sim, k), f = h - deckAt(sim, F, k, 'F'); return { k, overF: h > -Infinity && f > 0 ? ft(f) : null, onE: upper(sim, k) }; });
      return { data: { zones }, zones: zones.map(z => ({ k: z.k, state: z.onE ? 'lost' : (z.overF !== null ? 'water' : 'dry'), words: z.onE ? 'water on E deck' : (z.overF !== null ? 'water on F deck' : 'no water seen on F deck') })) };
    }
    if (part === 'mailroom') {
      const h = level(sim, 3), o = h - deckAt(sim, F, 3, 'orlop'), g = deckAt(sim, F, 3, 'G') - h, rate = riseRate(R, sim, 3);
      const d = { overOrlop: h > -Infinity && o > 0, toG: ft(g), rate };
      const words = !d.overOrlop ? 'the mail room dry' : (d.toG > 0 ? 'water within ' + feetN(d.toG) + ' of G deck' : 'water ' + feetN(-d.toG) + ' over G deck');
      return { data: d, zones: [{ k: 3, state: !d.overOrlop ? 'dry' : (upper(sim, 3) ? 'lost' : 'water'), words }] };
    }
    const rs = rooms(sim, P.zones);
    return { data: { rooms: rs }, zones: roomsKnown(rs) };
  }

  // ------------------------------------------------------------------ the orders (the player's, and the bridge's own)
  function startLook(sim, R, part, who) {
    const key = 'look:' + part;
    if (R.done || R.errands[key]) return false;          // an officer is already on his way there
    R.errands[key] = true;
    task(R, sim.t + PARTS[part].visit * MIN, 'visit', { part, who, t0: sim.t });
    return true;
  }
  function startSound(sim, R) {
    if (R.done || R.errands.sound) return false;
    R.errands.sound = true;
    task(R, sim.t + SOUND.at * MIN, 'sounding', { t0: sim.t });
    return true;
  }
  function startAsk(sim, R) {
    if (R.done || R.errands.ask) return false;
    R.errands.ask = true;
    task(R, sim.t + ASK.at * MIN, 'engine', { t0: sim.t });
    return true;
  }
  function orderLook(sim, value) { const R = sim.reports; return !!R && Object.prototype.hasOwnProperty.call(PARTS, value) && startLook(sim, R, value, 'An officer'); }
  function orderSound(sim, value) { const R = sim.reports; return !!R && value === 'wells' && startSound(sim, R); }
  function orderAsk(sim, value) { const R = sim.reports; return !!R && value === 'engine room' && startAsk(sim, R); }
  // which of its orders, read from an address, this reader would accept (site/parts/40_night_end.js asks it)
  function valid(type, value, arg) {
    if (arg !== undefined) return false;
    if (type === 'report:look') return typeof value === 'string' && Object.prototype.hasOwnProperty.call(PARTS, value);
    if (type === 'report:sound') return value === 'wells';
    if (type === 'report:ask') return value === 'engine room';
    return false;
  }

  // ------------------------------------------------------------------ the tasks
  function runTask(sim, R, x) {
    const F = C.poseFrame(sim, sim.zO, sim.pitch, sim.roll, R.F), t = sim.t;
    if (x.type === 'look') { startLook(sim, R, x.value, x.who); return; }
    if (x.type === 'sound') { startSound(sim, R); return; }
    if (x.type === 'ask') { startAsk(sim, R); return; }
    if (x.type === 'visit') {                                  // he looks: what is there now, said when he is back
      R.looked[x.part] = t;
      const o = look(sim, R, x.part, F), P = PARTS[x.part];
      say(R, { t: x.t0 + P.back * MIN, tFact: t, ch: 'runner', who: x.who, by: 'back from ' + P.name, rule: 'officer', part: x.part,
        words: WORDS.look[x.part](o.data), data: o.data, zones: o.zones, errand: 'look:' + x.part, qty: 'the levels at ' + P.name + ' (zones ' + P.zones.join(', ') + ') against its decks' });
      return;
    }
    if (x.type === 'sounding') {                               // the carpenter's rod in each well
      const wells = SOUND.zones.map(k => ({ k, ft: ft(sounding(sim, k)) }));
      say(R, { t: x.t0 + SOUND.back * MIN, tFact: t, ch: 'runner', who: 'The carpenter', by: 'in person', rule: 'holds', words: WORDS.sound({ wells }), data: { wells },
        zones: wells.map(w => ({ k: w.k, state: w.ft < 0.5 ? 'dry' : 'water', words: w.ft < 0.5 ? 'dry in the well' : feet(w.ft) + ' in the well' })), errand: 'sound', qty: 'the soundings of zones ' + SOUND.zones.join(', ') });
      return;
    }
    if (x.type === 'engine') {                                 // the chief engineer answers the note
      R.askAt = t;
      const rs = rooms(sim, ASK.zones);
      say(R, { t: x.t0 + ASK.back * MIN, tFact: t, ch: 'runner', who: 'The chief engineer', by: 'by a messenger', rule: 'engineer', words: WORDS.ask({ rooms: rs }), data: { rooms: rs },
        zones: roomsKnown(rs), errand: 'ask', qty: 'the water in zones 4 to 12' });
      return;
    }
    if (x.type === 'commutator') {                             // the captain reads the list indicator
      const deg = Math.round(sim.roll / DEG);
      R.list = { read: true, said: deg, t };
      say(R, { t, tFact: t, ch: 'instrument', who: 'The commutator', by: 'read by the captain', rule: 'commutator', words: WORDS.commutator({ deg }), data: { deg, roll: sim.roll / DEG }, qty: 'her roll' });
      return;
    }
    if (x.type === 'call') {                                   // the chief engineer telephones, unasked
      R.engineer = false;
      if (R.askAt >= x.since) return;                          // a note from the bridge reached him since: he has answered it
      const rs = rooms(sim, ASK.zones);
      say(R, { t: t + RULES.engineer.phone * MIN, tFact: t, ch: 'phone', who: RULES.engineer.who, by: RULES.engineer.by, rule: 'engineer', words: WORDS.ask({ rooms: rs }), data: { rooms: rs },
        zones: roomsKnown(rs), qty: 'the water in zones 4 to 12' });
      return;
    }
    if (x.type === 'peak') {                                   // the lamp trimmer hears the air: tells the chief officer
      const h = level(sim, 0), store = h > deckAt(sim, F, 0, 'orlop');
      task(R, t + RULES.forepeak.relay * MIN, 'relay', { tFact: t, data: { store, ft: ft(sounding(sim, 0)) } });
      return;
    }
    if (x.type === 'relay') {                                  // the chief officer takes it to the bridge, or does not
      const u = draw(R, 'forepeak:pass');
      if (u >= RULES.forepeak.pass) return;
      say(R, { t: t + within(R, 'forepeak:then', RULES.forepeak.then) * MIN, tFact: x.tFact, ch: 'runner', who: RULES.forepeak.who, by: RULES.forepeak.by, rule: 'forepeak',
        words: WORDS.forepeak(x.data), data: x.data, zones: [{ k: 0, state: 'water', words: x.data.store ? 'water in the storerooms' : 'making water in the tank' }], qty: 'water in zone 0' });
      return;
    }
    if (x.type === 'designer') {                               // he goes below: the model's own forecast from here
      R.shadow = { sim: C.restore(sim.ship, C.serialize(sim)), t0: t, done: false, founderT: -1, calm: 0, stable: false, horizon: t + DESIGNER.horizon * MIN };
      say(R, { t: t + DESIGNER.delay * MIN, tFact: t, ch: DESIGNER.ch, who: DESIGNER.who, by: DESIGNER.by, rule: 'designer', words: '', build: true, qty: 'the model\'s own forecast from the state when he went below, with the bias' });
    }
  }
  function shadowStep(sh) {                  // the forecast, `pace` steps of the core a step of the watch
    const s = sh.sim;
    for (let i = 0; i < DESIGNER.pace && !sh.done; i++) {
      C.step(s);
      if (s.foundered) { sh.done = true; sh.founderT = s.founderT; break; }
      if (s.t > 1800) {                       // as the page's forecast lies steady (core/core.js run, stopWhenStable)
        sh.calm = Math.abs(s.inflow) < 0.02 && Math.abs(s.wth) < 1e-5 && Math.abs(s.vz) < 1e-3 ? sh.calm + s.params.dt : 0;
        if (sh.calm > 1200) { sh.done = true; sh.stable = true; }
      }
      if (s.t >= sh.horizon) sh.done = true;
    }
  }
  function estimate(R, q) {
    const sh = R.shadow, e = { tFact: q.tFact, tKnown: q.t, floats: false, beyond: false, forecast: null, biased: null, lo: 0, hi: 0 };
    if (sh && sh.founderT >= 0) {                              // the time the forecast leaves her from when he speaks
      e.forecast = (sh.founderT - q.t) / MIN; e.biased = DESIGNER.bias * Math.max(0, e.forecast);
      e.lo = 30 * Math.floor(e.biased / 30); e.hi = e.lo + 30;
    } else if (sh && sh.stable) e.floats = true;
    else { e.beyond = true; e.lo = 30 * Math.floor(DESIGNER.bias * DESIGNER.horizon / 30); }
    e.words = estimateWords(e);
    R.shadow = null;
    return e;
  }

  // ------------------------------------------------------------------ noticing (once a second of her time, after a touch)
  function firstWater(sim, R, k, t) {
    if (k === 0) { task(R, t + within(R, 'forepeak:notice', RULES.forepeak.notice) * MIN, 'peak', {}); return; }
    if (k >= 4 && k <= 12 && !R.engineer) {
      if (draw(R, 'engineer:' + k) >= RULES.engineer.pass) return;
      R.engineer = true;
      task(R, t + within(R, 'engineer:' + k + ':judge', RULES.engineer.judge) * MIN, 'call', { since: t });
    }
  }
  function notice(sim, R) {
    const F = C.poseFrame(sim, sim.zO, sim.pitch, sim.roll, R.F), t = sim.t;
    for (let k = 0; k < 16; k++) if (R.seen[k] < 0 && water(sim, k) >= VOL) { R.seen[k] = t; firstWater(sim, R, k, t); }
    // the mail clerks: water over the orlop deck in No. 3 hold
    if (R.mail < 0 && level(sim, 3) > deckAt(sim, F, 3, 'orlop')) {
      R.mail = t;
      const d = { rate: riseRate(R, sim, 3) };
      say(R, { t: t + RULES.mail.delay * MIN, tFact: t, ch: 'runner', who: RULES.mail.who, by: RULES.mail.by, rule: 'mail', words: WORDS.mail(d), data: d,
        zones: [{ k: 3, state: 'water', words: 'the mail room filling' }], follow: FOLLOW.mail, qty: 'zone 3 water reaching the orlop deck' });
    }
    // the stewards: water on F deck or E deck, by area (the crew's spaces over the forepeak excepted: RULES.crew)
    for (const area in AREAS) for (const deck of ['F', 'E']) {
      const key = area + ':' + deck; if (R.area[key]) continue;
      const wet = AREAS[area].filter(k => deck === 'F' ? level(sim, k) > deckAt(sim, F, k, 'F') : (upper(sim, k) || level(sim, k) > deckAt(sim, F, k, 'E')));
      if (!wet.length) continue;
      R.area[key] = t;
      const d = { deck, area, zones: wet.slice() };
      say(R, { t: t + within(R, 'steward:' + key, RULES.steward.delay) * MIN, tFact: t, ch: 'runner', who: RULES.steward.who, by: RULES.steward.by, rule: 'steward', words: WORDS.steward(d), data: d,
        zones: wet.map(k => ({ k, state: deck === 'E' ? 'lost' : 'water', words: 'water on ' + deck + ' deck' })), follow: FOLLOW['steward:' + area], qty: 'water at ' + deck + ' deck in zones ' + wet.join(', ') });
    }
    // the commutator, once the captain has read it: a line when it has moved
    if (R.list.read) {
      const deg = Math.round(sim.roll / DEG);
      if (Math.abs(deg - R.list.said) >= RULES.commutator.step && t - R.list.t >= RULES.commutator.gap * MIN) {
        R.list = { read: true, said: deg, t };
        say(R, { t, tFact: t, ch: 'instrument', who: RULES.commutator.who, by: RULES.commutator.by, rule: 'commutator', words: WORDS.commutator({ deg }), data: { deg, roll: sim.roll / DEG }, qty: 'her roll' });
      }
    }
    // her trim by eye: the forecastle head against where it stood at the touch; and the model's own marks
    const fb = freeboard(F), drop = ft(R.trim.fb0 - fb), S = RULES.eye.steps;
    const cat = drop >= S[2] ? 3 : (drop >= S[1] ? 2 : (drop >= S[0] ? 1 : 0));
    if (cat > R.trim.cat) {
      R.trim.cat = cat;
      const d = { cat, ft: Math.max(0, r5(ft(fb))), drop };
      say(R, { t, tFact: t, ch: 'instrument', who: RULES.eye.who, by: RULES.eye.by, rule: 'eye', words: WORDS.eye(d), data: d, qty: 'the forecastle head\'s height (her trim)' });
    }
    for (const [id, words] of [['well', 'The forward well deck is awash.'], ['fcastle', 'The forecastle head goes under.']]) {
      if (!R.trim[id] && sim.markT[id] >= 0) {
        R.trim[id] = true;
        say(R, { t: sim.markT[id], tFact: sim.markT[id], ch: 'instrument', who: RULES.eye.who, by: RULES.eye.by, rule: 'eye', words, data: { mark: id }, qty: 'the core\'s mark "' + id + '"' });
      }
    }
  }

  // ------------------------------------------------------------------ the routine
  function routine(sim, R) {
    const t = sim.t, lapse = ROUTINE.lapse && R.sinking >= 0;
    if (t >= R.callT - EPS) {
      if (!(lapse && R.callT > R.sinking)) say(R, { t: R.callT, tFact: R.callT, ch: 'routine', who: 'The quartermaster', by: 'on the bridge', rule: 'routine', kind: 'routine', words: 'One bell: the next watch is called.' });
      R.callT += RELIEF;
    }
    if (t >= R.bellT - EPS) {
      const s = R.clock0 + R.bellT, k = Math.round(s / BELL), n = ((k % 8) + 8) % 8, relief = (((Math.round(s) % RELIEF) + RELIEF) % RELIEF) === 0;
      if (lapse && R.bellT > R.sinking) {
        if (!R.lapsedBells) { R.lapsedBells = true; say(R, { t: R.bellT, tFact: R.bellT, ch: 'routine', who: 'The quartermasters', by: 'at the boats', rule: 'routine', kind: 'routine', words: 'No bell is struck: the quartermasters are at the boats.' }); }
        if (relief && !R.lapsedReliefs) { R.lapsedReliefs = true; say(R, { t: R.bellT, tFact: R.bellT, ch: 'routine', who: 'The watch', by: 'at the boats', rule: 'routine', kind: 'routine', words: 'No relief for the crow\'s nest or the wheel.' }); }
      } else {
        say(R, { t: R.bellT, tFact: R.bellT, ch: 'routine', who: 'The quartermaster', by: 'on the bridge', rule: 'routine', kind: 'routine',
          words: BELLS[n] + (relief ? '. The lookouts and the wheel are relieved.' : ', answered from the nest.') });
      }
      R.bellT += BELL;
    }
  }

  // ------------------------------------------------------------------ the step
  // the telephones (G7, NH15: docs/DESIGN_the_living_ship_v1_2026-11-23.md): "worked from the lighting circuit through a
  // motor generator, with a stand-by battery that switched in by itself" [read: the British Report, "Electrical
  // Installation", through note 11.2's table]. A call has current on the main dynamos, or on that battery from the moment
  // they stop (the plant's own mainDark or dark) for PHONE.batteryHours [bet: its life NOT FOUND; the wireless's
  // battery-and-coil set's "at least 6 h", the plant note]
  const PHONE = { batteryHours: 6 };
  function phoneState(sim) {
    const P = sim.plant;
    if (!P || P.power) return { current: true, why: 'on the lighting circuit' };
    const ev = P.events, t0 = Math.min(ev.mainDark === undefined ? Infinity : ev.mainDark, ev.dark === undefined ? Infinity : ev.dark);
    if (t0 < Infinity && sim.t < t0 + PHONE.batteryHours * 3600) return { current: true, why: 'on its stand-by battery' };
    return { current: false, why: 'no current: its stand-by battery is spent' };
  }
  function arrive(sim, R, q) {
    if (R.done) return;
    // the bridge knows she will founder (and the boats are ordered: ROUTINE) only when he gives her a time
    if (q.build) { const e = estimate(R, q); q.words = e.words; q.data = e; R.estimate = e; if (!e.floats && !e.beyond) R.sinking = q.t; }
    if (q.ch === 'phone' && R.sinking >= 0) {                 // once the boats are ordered a call can go unanswered
      if (draw(R, 'phone:' + (R.calls++)) < RULES.phone.unanswered) { R.unanswered.push({ t: q.t, who: q.who, words: q.words }); return; }
    }
    // G7 (NH15): a telephone with no current goes unanswered, after the draw above so that every draw keeps its place
    if (q.ch === 'phone') { const ph = phoneState(sim); if (!ph.current) { R.unanswered.push({ t: q.t, who: q.who, words: q.words, why: ph.why }); return; } }
    if (q.errand) delete R.errands[q.errand];
    const e = { n: R.feed.length + 1, t: q.t, tFact: q.tFact, ch: q.ch, who: q.who, by: q.by, words: q.words, kind: q.kind || 'report', rule: q.rule, qty: q.qty || '', data: q.data || null };
    R.feed.push(e);
    let wet = false;
    if (q.zones) for (const z of q.zones) { know(R, z.k, z.state, z.words, q.tFact, q.t, q.who); if (z.state === 'water' || z.state === 'lost') wet = true; }
    if (wet && R.water < 0) { R.water = q.t; task(R, q.t, 'designer', {}); }
    if (q.follow) {                                            // an officer to see what a man has reported
      const part = q.follow;
      if (!R.errands['look:' + part] && !(R.looked[part] >= 0 && q.t - R.looked[part] < FOLLOW.recent * MIN)) startLook(sim, R, part, 'The Fourth Officer');
    }
    if (q.end) { R.done = true; R.final = { list: listNow(sim), trim: trimNow(sim, R) }; }
  }
  function step(sim) {
    const R = sim.reports, w = sim.night;
    if (!R || R.done) return;
    const t = sim.t;
    R.phone = phoneState(sim);                                 // the telephones' current, as plain data for a view (G7)
    if (R.tTouch < 0 && w.tTouch >= 0) {                      // the touch, felt on the bridge; then the bridge's own routine
      R.tTouch = w.tTouch;
      R.trim.fb0 = freeboard(C.poseFrame(sim, sim.zO, sim.pitch, sim.roll, R.F));
      say(R, { t: w.tTouch, tFact: w.tTouch, ch: 'felt', who: 'The ship', by: 'felt on the bridge', rule: 'touch', words: 'A tremble and a grinding along her ' + (w.abeam >= 0 ? 'starboard' : 'port') + ' side.', qty: 'the touch (core/night.js)' });
      for (const u of UNASKED) task(R, R.tTouch + u.after * MIN, u.order, { value: u.value, who: u.who });
    } else if (R.tTouch < 0 && w.k % 4 === 0) {
      // G27 (docs/DESIGN_G27_the_brush_on_a_watch_v1_2026-11-24.md, section 4): a night holed by hand before any touch
      // (the brush on a watch). The bridge's routine starts at the first water a man finds, by this reader's own
      // first-water rule (a room's water at VOL, as notice has it), on that second; the room's own report comes by its
      // route in the same step's notice. Its two fields are set on this path alone, so a night that meets the ice first
      // keeps its state to the bit
      for (let k = 0; k < 16; k++) if (water(sim, k) >= VOL) {
        R.tTouch = t; R.byWater = k;
        R.trim.fb0 = freeboard(C.poseFrame(sim, sim.zO, sim.pitch, sim.roll, R.F));
        for (const u of UNASKED) task(R, R.tTouch + u.after * MIN, u.order, { value: u.value, who: u.who });
        break;
      }
    }
    if (R.byWater !== undefined && !R.felt && w.tTouch >= 0) {  // G27: a touch after the water is felt, and restarts nothing
      R.felt = true;
      say(R, { t: w.tTouch, tFact: w.tTouch, ch: 'felt', who: 'The ship', by: 'felt on the bridge', rule: 'touch', words: 'A tremble and a grinding along her ' + (w.abeam >= 0 ? 'starboard' : 'port') + ' side.', qty: 'the touch (core/night.js)' });
    }
    if (R.tTouch >= 0 && !R.stem && sim.enc && sim.enc.bow > sim.enc.P.bowMin) {
      R.stem = true;
      say(R, { t, tFact: t, ch: 'felt', who: 'The ship', by: 'felt on the bridge', rule: 'touch', words: 'A heavy blow at the stem.', qty: 'the bow crushed (core/encounter.js)' });
    }
    if (t >= R.callT - EPS || t >= R.bellT - EPS) routine(sim, R);
    if (R.tTouch >= 0) {
      if (w.k % 120 === 0) {                                   // every 30 s: the depths, for "rising" [a design figure]
        const a = R.samples[0], b = R.samples[1];
        R.samples[0] = b; R.samples[1] = a; a.t = t; for (let k = 0; k < 16; k++) a.d[k] = sounding(sim, k);
      }
      if (w.k % 4 === 0) notice(sim, R);                       // once a second: a fact is timed to the second [a design figure]
    }
    while (R.tasks.length && R.tasks[0].due <= t + EPS) runTask(sim, R, R.tasks.shift());
    if (R.shadow && !R.shadow.done) shadowStep(R.shadow);
    if (sim.markT.bridge >= 0 && !R.ended) {                  // the water over the bridge: the end of the bridge's night
      R.ended = true;
      say(R, { t: sim.markT.bridge, tFact: sim.markT.bridge, ch: 'instrument', who: RULES.eye.who, by: RULES.eye.by, rule: 'eye', words: 'Water comes over the bridge.', end: true, qty: 'the core\'s mark "bridge"' });
    }
    while (R.queue.length && R.queue[0].t <= t + EPS) arrive(sim, R, R.queue.shift());
    if (!R.done && (N.over ? N.over(sim) : sim.foundered)) { R.done = true; R.final = { list: listNow(sim), trim: trimNow(sim, R) }; }
  }

  // ------------------------------------------------------------------ what the bridge knows now
  function listNow(sim) {
    const deg = Math.round(sim.roll / DEG);
    return { deg, words: deg === 0 ? 'upright' : Math.abs(deg) + '° ' + (deg > 0 ? 'starboard' : 'port') };
  }
  function trimNow(sim, R) {
    if (R.ended && R.final) return R.final.trim;
    const F = C.poseFrame(sim, sim.zO, sim.pitch, sim.roll, {}), fb = freeboard(F), drop = ft(R.trim.fb0 - fb), S = RULES.eye.steps;
    const cat = R.tTouch < 0 ? 0 : (drop >= S[2] ? 3 : (drop >= S[1] ? 2 : (drop >= S[0] ? 1 : 0)));
    const mark = sim.markT.bridge >= 0 ? 'water over the bridge' : (sim.markT.fcastle >= 0 ? 'the forecastle head under' : (sim.markT.well >= 0 ? 'the forward well deck awash' : null));
    return { cat, words: mark || TRIM[cat], ft: Math.max(0, r5(ft(fb))) };
  }
  function knowledge(sim) {
    const R = sim && sim.reports;
    if (!R) return null;
    const fin = R.done && R.final;
    return {
      t: sim.t, done: R.done,
      zones: R.zones.map((z, k) => ({ k, short: C.ZONES[k].short, name: NAMES[k], state: z.state, words: z.words, t: z.t, tKnown: z.tKnown, who: z.who })),
      list: fin ? R.final.list : listNow(sim),
      trim: fin ? R.final.trim : trimNow(sim, R),
      estimate: R.estimate ? { words: R.estimate.words, tFact: R.estimate.tFact, tKnown: R.estimate.tKnown, floats: R.estimate.floats, beyond: R.estimate.beyond } : null,
      sinking: R.sinking,
      errands: Object.keys(R.errands),
    };
  }
  function feed(sim) { return sim && sim.reports ? sim.reports.feed.slice() : []; }

  N.reader({ name: 'reports', state: 'reports', attach, step, valid, orders: { 'report:look': orderLook, 'report:sound': orderSound, 'report:ask': orderAsk } });
  return { RULES, UNASKED, FOLLOW, PARTS, SOUND, ASK, DESIGNER, ROUTINE, NAMES, TRIM, knowledge, feed, valid, estimateWords, halfHours, PHONE, phoneState };
});

/*
 * NH6, stage 1: her rooms as the flooding network, at level 0. The design and every choice below:
 * docs/DESIGN_her_rooms_as_the_flooding_network_v1_2026-11-23.md.
 *
 * Inside each of the core's 64 spaces it shares the space's water among the space's rooms: R3's rows, read from the
 * deck plans (data/rooms, through core/readers/cabins.js's index), each cut into its pieces by the model's zones, sides
 * and decks, and each slab's rest (what no row covers). The rooms are joined by the openings the plans give: the doors
 * a row names, and the stairs, hatches, lifts, trunks and casings that pass a deck; where the plans give none, by
 * stand-ins, each named below and in the design. The law is hydrostatic and history-free (the design, section 6): the
 * space's own water (sim.vol) fills its rooms from the lowest up, each room joining the water when its level reaches
 * the lowest opening by which the water can reach it. The water is shared exactly; the pockets' water (W6's bunker,
 * G7's tank) is kept apart, as rooms.js keeps it.
 *
 *   graph(I, ship, opt)      the rooms and openings of every space, for cabins.js's index I (cached by I, ship, opt)
 *   share(G, sim, opt)       every space's rooms now: water (m3), level (world, m; NaN while dry), each slab's sum
 *   pour(rooms, edges, V, r0)   the law on one space, the rooms given as capacity functions (the hand-worked test)
 *   ofRow(G, id)             a row's rooms (its pieces), by the row's id
 *   depthAt(G, res, k, sim)  room k's depth over its deck at its place
 *   track(G, opt), observe(tr, G, res, sim)   a run's first-wet time per room (the caller's plain data)
 *
 * Options: sill (m over the deck, a door's sill, BET.sill [bet]), coaming (a hatch's, BET.coaming [bet]), open (every
 * opening at the bottom of its rooms and every plate open: the open floor, rooms.js's own sharing, the identity test).
 *
 * The stand-ins (the design, section 4): a passage, and a row that names no door to a row of its slab, open to the
 * slab's rest at the row's deck; a set of rooms with doors only among themselves opens to the rest the same way; every
 * plate inside a space opens at its highest point (once the deck under it is pressed full the water passes it, by the
 * openings the plans do not show); a deck is no floor in a zone where all its rows there are casings, bunkers or
 * machinery (R3: G deck is no floor between bulkheads E and K, the orlop none between D and M), and its plate is open.
 *
 * A library, as rooms.js and cabins.js are: no state, no reader registered, nothing written into a sim or the tables;
 * its caches are keyed by the index and the ship, outside the sim; a track is the caller's plain data. So no fingerprint
 * can move and the forecast never meets it (tools/roomnet_tests.js). It reads rooms.js's table (the column pieces of
 * every slab) and mirrors its column cut; a change to that cut needs the same change here, and the suite's identity row
 * catches one. rooms.js is found when first wanted: the build bundles core/readers/ in name order, this file before it.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../core.js'), function () { return require('./rooms.js'); });
  else root.TitanicRoomNet = factory(root.TitanicCore, function () { return root.TitanicRooms; });
})(typeof self !== 'undefined' ? self : this, function (C, roomsLib) {
  'use strict';
  if (!C) return null;
  const R = () => roomsLib();
  const DECKS = ['orlop', 'G', 'F', 'E', 'D', 'C', 'B', 'A', 'Boat'];   // keel up, as R3's tables
  const VERTICAL = ['stair', 'hatch', 'lift', 'trunk', 'casing'];      // rows that pass a deck
  const NOFLOOR = ['casing', 'bunker', 'machinery'];                   // a deck of only these in a zone is no floor there
  const BET = {
    sill: 0,          // m over the deck: a door's sill [bet: no source read gives one; R3 reads none but two stairs' 6 in]
    coaming: 0,       // m over the deck: a hatch's coaming [bet: none read]
    minOverlap: 0.5,  // m2: rows on two decks overlapping less than this in plan are not joined by a vertical row [bet]
    minPiece: 0.5,    // m2: a row's piece smaller than this in a slab is left to the slab's rest [bet]
  };
  const WET = 0.01;   // m [bet], as cabins.js's: a room is wet once its water would stand this deep over its floor
  const GRID = 0.25;  // m: the plan grid on which rows on two decks are overlapped
  const ZB = [Infinity].concat(C.BULKHEADS.map((b) => b.x), [-Infinity]);
  const gcache = new WeakMap(), ocache = new WeakMap();

  // ------------------------------------------------------------ plane geometry
  function clip(P, f) {
    const out = [];
    for (let i = 0; i < P.length; i++) {
      const p = P[i], q = P[(i + 1) % P.length], fp = f(p), fq = f(q);
      if (fp >= 0) out.push(p);
      if ((fp >= 0) !== (fq >= 0)) { const u = fp / (fp - fq); out.push([p[0] + u * (q[0] - p[0]), p[1] + u * (q[1] - p[1])]); }
    }
    return out;
  }
  function area(P) { let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a) / 2; }
  function centroid(P) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length], c = p[0] * q[1] - q[0] * p[1]; a += c; cx += (p[0] + q[0]) * c; cy += (p[1] + q[1]) * c; }
    return Math.abs(a) > 1e-9 ? [cx / (3 * a), cy / (3 * a)] : null;
  }
  function rectArea(P, x0, x1, y0, y1) {
    let Q = clip(P, (v) => v[0] - x0);
    Q = clip(Q, (v) => x1 - v[0]); Q = clip(Q, (v) => v[1] - y0); Q = clip(Q, (v) => y1 - v[1]);
    return Q.length >= 3 ? area(Q) : 0;
  }
  const polyOf = (e) => (e.src && e.src.poly_m ? e.src.poly_m.map((v) => [v[0], v[1]]) : []);
  // the rows of two neighbouring decks that overlap in plan, where one of them passes the deck: on a grid of GRID m,
  // each overlap's cells grouped by the model's zone and side (one opening a group), for one index
  function overlaps(I) {
    let O = ocache.get(I);
    if (O) return O;
    const cells = new Map();
    for (const e of I.rows) {
      const P = polyOf(e), S = new Map();
      if (P.length >= 3) {
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
        for (const [x, y] of P) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        for (let i = Math.floor(x0 / GRID); i <= Math.ceil(x1 / GRID); i++) for (let j = Math.floor(y0 / GRID); j <= Math.ceil(y1 / GRID); j++) {
          const px = (i + 0.5) * GRID, py = (j + 0.5) * GRID;
          let inside = false;
          for (let a = 0, b = P.length - 1; a < P.length; b = a++) { const A = P[a], B = P[b]; if ((A[1] > py) !== (B[1] > py) && px < (B[0] - A[0]) * (py - A[1]) / (B[1] - A[1]) + A[0]) inside = !inside; }
          if (inside) S.set(i + ',' + j, [px, py]);
        }
      }
      cells.set(e, S);
    }
    O = [];
    for (let d = 1; d < DECKS.length; d++) {
      const up = I.rows.filter((e) => e.deck === DECKS[d]), dn = I.rows.filter((e) => e.deck === DECKS[d - 1]);
      for (const a of up) for (const b of dn) {
        if (VERTICAL.indexOf(a.kind) < 0 && VERTICAL.indexOf(b.kind) < 0) continue;
        const A = cells.get(a), B = cells.get(b);
        if (!A.size || !B.size) continue;
        const groups = new Map();
        for (const [key, p] of A) {
          if (!B.has(key)) continue;
          const g = C.zoneAt(p[0]) + ':' + (p[1] >= 0 ? 0 : 1);
          const s = groups.get(g) || { n: 0, x: 0, y: 0 };
          s.n++; s.x += p[0]; s.y += p[1];
          groups.set(g, s);
        }
        for (const [g, s] of groups) if (s.n * GRID * GRID >= BET.minOverlap) {
          const [zone, side] = g.split(':').map(Number);
          O.push({ up: a, down: b, zone, side, x: s.x / s.n, y: s.y / s.n, area: s.n * GRID * GRID, kind: VERTICAL.indexOf(a.kind) >= 0 ? a.kind : b.kind });
        }
      }
    }
    ocache.set(I, O);
    return O;
  }

  // ------------------------------------------------------------ the graph
  // A room is a list of sub-pieces: a column piece q of rooms.js's table (in the room's slab), the share f of the
  // column's plan the room covers, and the band [lo, hi] of the column it holds (its slab's, or from the orlop deck up
  // for an orlop row where the orlop is a floor). Every column piece's shares, its rooms' and its rest's, add up to the
  // whole piece: so a slab's rooms hold exactly the slab's columns, and a space's its columns.
  function graph(I, ship, opt) {
    opt = Object.assign({}, BET, opt || {});
    const key = JSON.stringify([opt.sill, opt.coaming, opt.minOverlap, opt.minPiece, !!opt.open]);
    let byShip = gcache.get(I);
    if (!byShip) { byShip = new WeakMap(); gcache.set(I, byShip); }
    let byKey = byShip.get(ship);
    if (!byKey) { byKey = new Map(); byShip.set(ship, byKey); }
    if (byKey.has(key)) return byKey.get(key);
    const T = R().table(ship), c = ship.cols, NS = T.list.length, NQ = T.col.length;
    const Q = T.list.map(() => []);
    for (let q = 0; q < NQ; q++) Q[T.slab[q]].push(q);
    // which decks are no floor in which zone
    const kinds = new Map();
    for (const e of I.rows) for (const p of e.pieces) {
      if (p.slab < 0) continue;
      const k = e.deck + ':' + p.zone;
      if (!kinds.has(k)) kinds.set(k, new Set());
      kinds.get(k).add(e.kind);
    }
    const noFloor = (deck, zone) => { const s = kinds.get(deck + ':' + zone); return !!s && [...s].every((k) => NOFLOOR.indexOf(k) >= 0); };
    // each row's shares of the column pieces of its deck's slabs, its 'minus' rows taken out
    const shares = new Map();
    for (const e of I.rows) {
      const P = polyOf(e), m = new Map();
      shares.set(e, m);
      if (P.length < 3 || area(P) < 1e-9) continue;
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const [x, y] of P) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      for (const s of T.list) {
        if (s.floor !== e.floor) continue;
        for (const q of Q[s.id]) {
          const i = T.col[q], hx = 0.5 * c.dx[i], hy = 0.5 * c.dy;
          if (c.x[i] + hx < x0 || c.x[i] - hx > x1 || c.y[i] + hy < y0 || c.y[i] - hy > y1) continue;
          const a = rectArea(P, c.x[i] - hx, c.x[i] + hx, c.y[i] - hy, c.y[i] + hy);
          if (a > 1e-9) m.set(q, a / (c.dx[i] * c.dy));
        }
      }
    }
    for (const e of I.rows) for (const id of (e.src && e.src.minus) || []) {
      const b = I.byId.get(id), m = shares.get(e);
      if (!b || !shares.get(b)) continue;
      for (const [q, f] of shares.get(b)) if (m.has(q)) m.set(q, Math.max(0, m.get(q) - f));
    }
    // where R3's rows cover a column piece past its plan (rows overlapping beyond 'minus'), each row's share is scaled
    // down to fit [stand-in]
    const sum = new Float64Array(NQ);
    for (const [, m] of shares) for (const [q, f] of m) sum[q] += f;
    let overlapping = 0;
    for (let q = 0; q < NQ; q++) if (sum[q] > 1 + 1e-9) overlapping++;
    const fit = (q, f) => (sum[q] > 1 ? f / sum[q] : f);
    const bandOf = (e, q) => (e.deck === 'orlop' && !noFloor('orlop', T.list[T.slab[q]].zone)) ? [Math.max(T.lo[q], C.deckZ('orlop', c.x[T.col[q]])), T.hi[q]] : [T.lo[q], T.hi[q]];
    const restSub = Array.from({ length: NS }, () => ({ q: [], f: [], lo: [], hi: [] }));
    const toRest = (q, f, lo, hi) => { if (f > 1e-15 && hi > lo + 1e-12) { const r = restSub[T.slab[q]]; r.q.push(q); r.f.push(f); r.lo.push(lo); r.hi.push(hi); } };
    // each column piece's plan that no row covers
    for (let q = 0; q < NQ; q++) toRest(q, 1 - Math.min(1, sum[q]), T.lo[q], T.hi[q]);
    // each row's pieces by slab; a piece under minPiece m2 goes to its slab's rest, and so does the hold under an
    // orlop row's floor
    const rowRooms = [];
    for (const e of I.rows) {
      const bySlab = new Map();
      for (const [q, f0] of shares.get(e)) {
        const f = fit(q, f0);
        if (!(f > 0)) continue;
        if (!bySlab.has(T.slab[q])) bySlab.set(T.slab[q], []);
        bySlab.get(T.slab[q]).push([q, f]);
      }
      for (const [s, list] of bySlab) {
        let a = 0;
        for (const [q, f] of list) a += f * c.dxdy[T.col[q]];
        const sub = { q: [], f: [], lo: [], hi: [] };
        for (const [q, f] of list) {
          const [lo, hi] = bandOf(e, q);
          toRest(q, f, T.lo[q], Math.min(lo, T.hi[q]));
          if (a < opt.minPiece) toRest(q, f, lo, hi);
          else if (hi > lo + 1e-12) { sub.q.push(q); sub.f.push(f); sub.lo.push(lo); sub.hi.push(hi); }
        }
        if (a >= opt.minPiece && sub.q.length) rowRooms.push({ e, s, sub });
      }
    }
    // the rooms
    const rooms = [], bySpace = Array.from({ length: C.NN }, () => []), restOf = new Int32Array(NS).fill(-1), ofRowMap = new Map();
    const lowestLo = (sub) => { let z = Infinity; for (const v of sub.lo) if (v < z) z = v; return z === Infinity ? 0 : z; };
    const mkRoom = (kind, e, s, sub) => {
      const k = rooms.length, sl = T.list[s];
      const room = {
        k, kind, row: e || null, id: (e ? e.id : 'rest') + '@' + sl.key, n: sl.n, slab: s, zone: sl.zone, side: sl.side, deck: e ? e.deck : sl.floor,
        q: Int32Array.from(sub.q), f: Float64Array.from(sub.f), lo: Float64Array.from(sub.lo), hi: Float64Array.from(sub.hi), plan: 0, x: 0, y: 0, zDeck: 0,
      };
      let a = 0, mx = 0, my = 0;
      for (let j = 0; j < room.q.length; j++) { const i = T.col[room.q[j]], w = room.f[j] * c.dxdy[i]; a += w; mx += w * c.x[i]; my += w * c.y[i]; }
      room.plan = a;
      let xy = a > 0 ? [mx / a, my / a] : [0, 0];
      if (e) {   // a row's place: the centroid of its outline in this zone and on this side, as cabins.js's
        let P = polyOf(e);
        P = clip(P, (v) => ZB[sl.zone] - v[0]); P = clip(P, (v) => v[0] - ZB[sl.zone + 1]); P = clip(P, (v) => (sl.side === 0 ? v[1] : -v[1]));
        const cc = P.length >= 3 ? centroid(P) : null;
        if (cc) xy = cc;
      }
      room.x = xy[0]; room.y = xy[1];
      const floorDeck = e ? e.deck : sl.floor;
      room.zDeck = floorDeck === 'below G' || (floorDeck === 'orlop' && noFloor('orlop', sl.zone)) ? lowestLo(sub) : C.deckZ(floorDeck, xy[0]);
      rooms.push(room); bySpace[sl.n].push(k);
      if (e) { if (!ofRowMap.has(e.id)) ofRowMap.set(e.id, []); ofRowMap.get(e.id).push(k); }
      return k;
    };
    for (const { e, s, sub } of rowRooms) mkRoom('row', e, s, sub);
    for (let s = 0; s < NS; s++) restOf[s] = mkRoom('rest', null, s, restSub[s]);
    // ---- the openings, each { a, b, kind, x, y, z }: z its sill in the ship frame (-Infinity: always open), or pts
    // for a plate (its sill the plate's highest point at the pose)
    const edges = [], seen = new Set();
    const addEdge = (a, b, kind, x, y, z, more) => {
      if (a === b || a === undefined || b === undefined) return;
      const id = Math.min(a, b) + ':' + Math.max(a, b) + ':' + kind;
      if (seen.has(id)) return;
      seen.add(id);
      edges.push(Object.assign({ a, b, kind, x, y, z }, more || {}));
    };
    const roomOf = (e, s) => (ofRowMap.get(e.id) || []).find((k) => rooms[k].slab === s);
    const doored = new Set();
    // the doors a row names to a row of its own deck, in each slab the two share (R3 writes each door once, so both
    // directions come from either row's list)
    for (const e of I.rows) for (const d of (e.src && e.src.doors) || []) {
      const t = I.byId.get(d.to);
      if (!t || t === e || t.deck !== e.deck) continue;
      for (const k of ofRowMap.get(e.id) || []) {
        const kt = roomOf(t, rooms[k].slab);
        if (kt === undefined) continue;
        const x = 0.5 * (rooms[k].x + rooms[kt].x), y = 0.5 * (rooms[k].y + rooms[kt].y);
        addEdge(k, kt, 'door', x, y, (e.deck === 'orlop' && noFloor('orlop', rooms[k].zone) ? rooms[k].zDeck : C.deckZ(e.deck, x)) + opt.sill, { door: d.kind || 'door', atLow: true, sill: opt.sill });
        doored.add(k); doored.add(kt);
      }
    }
    // a row that passes a deck, where it overlaps a row of the deck below in one space: an opening in the upper deck
    const slabOf = new Map(T.list.map((s) => [s.zone + ':' + s.side + ':' + s.floor, s]));
    for (const o of overlaps(I)) {
      const sUp = slabOf.get(o.zone + ':' + o.side + ':' + o.up.floor), sDn = slabOf.get(o.zone + ':' + o.side + ':' + o.down.floor);
      if (!sUp || !sDn || sUp.n !== sDn.n || sUp.id === sDn.id) continue;   // across E deck: two spaces, the core's own
      addEdge(roomOf(o.up, sUp.id), roomOf(o.down, sDn.id), o.kind, o.x, o.y, C.deckZ(o.up.deck, o.x) + (o.kind === 'hatch' ? opt.coaming : 0), { area: o.area });
    }
    // the orlop's own vertical rows open to the hold under it (its slab's rest)
    for (const e of I.rows) if (e.deck === 'orlop' && VERTICAL.indexOf(e.kind) >= 0) for (const k of ofRowMap.get(e.id) || []) addEdge(k, restOf[rooms[k].slab], e.kind, rooms[k].x, rooms[k].y, rooms[k].zDeck + (e.kind === 'hatch' ? opt.coaming : 0));
    // stand-ins: a passage, and a row with no door to a row of its slab, open to the rest at its deck; a row on a deck
    // that is no floor there is the space's own volume (always open)
    for (const r of rooms) {
      if (r.kind !== 'row') continue;
      const nf = noFloor(r.deck, r.zone);
      if (nf || r.row.kind === 'passage' || !doored.has(r.k)) addEdge(r.k, restOf[r.slab], nf ? 'nofloor' : 'rest', r.x, r.y, nf ? -Infinity : r.zDeck, { standIn: true, atLow: true, sill: 0 });
    }
    // the plates inside a space: open where the deck over them is no floor; else open at their highest point
    for (let n = 0; n < C.NN; n++) {
      const ids = T.byNode[n];
      for (let j = 0; j + 1 < ids.length; j++) {
        const lower = ids[j], upper = ids[j + 1], su = T.list[upper];
        if ((su.floor === 'G' || su.floor === 'F') && noFloor(su.floor, su.zone)) { addEdge(restOf[lower], restOf[upper], 'nofloor', 0, 0, -Infinity, { standIn: true }); continue; }
        const pts = [];
        for (const q of Q[upper]) { const i = T.col[q]; pts.push(c.x[i], c.y[i], T.lo[q]); }
        addEdge(restOf[lower], restOf[upper], 'plate', 0, 0, NaN, { standIn: true, pts: Float64Array.from(pts) });
      }
    }
    // a set of rooms joined only among themselves on their deck (doors to each other, none to a passage or the rest,
    // whatever stairs lead from them) opens to its slab's rest at its own lowest point [stand-in]: within a slab, every
    // room reaches the rest by the slab's own openings
    const bySlab = Array.from({ length: NS }, () => []);
    for (const r of rooms) bySlab[r.slab].push(r.k);
    for (let s = 0; s < NS; s++) {
      const adj = new Map(bySlab[s].map((k) => [k, []]));
      for (const ed of edges) if (rooms[ed.a].slab === s && rooms[ed.b].slab === s) { adj.get(ed.a).push(ed.b); adj.get(ed.b).push(ed.a); }
      const seenK = new Set([restOf[s]]), stack = [restOf[s]];
      while (stack.length) { const u = stack.pop(); for (const v of adj.get(u)) if (!seenK.has(v)) { seenK.add(v); stack.push(v); } }
      for (const k of bySlab[s]) if (!seenK.has(k)) addEdge(k, restOf[s], 'rest', rooms[k].x, rooms[k].y, rooms[k].zDeck, { standIn: true, closed: true, atLow: true, sill: 0 });
    }
    const edgesBySpace = Array.from({ length: C.NN }, () => []);
    edges.forEach((ed, j) => edgesBySpace[rooms[ed.a].n].push(j));
    const G = { I, ship, opt, T, rooms, bySpace, restOf, edges, edgesBySpace, ofRow: ofRowMap, overlapping, noFloor };
    byKey.set(key, G);
    return G;
  }

  // ------------------------------------------------------------ the law on one space
  // rooms: [{ cap(h) -> [v, dv/dh], low, top }] in world heights; edges: [{ a, b, sill }] (world; -Infinity: open);
  // V: the space's water (m3); r0: the room the water starts in (the lowest). Each room joins the water at its joining
  // level: over the paths from r0, the lowest of the highest sill on the path (a minimax path; r0's is its own lowest
  // point). The rooms that have joined stand at one level. When the water stands exactly at a joining level, the rooms
  // joining there take what is left as one pool at a common level under it. Returns per room its level (NaN while dry)
  // and water, the pool's level, and how many rooms have joined.
  function pour(rooms, edges, V, r0, rTop) {
    const N = rooms.length, lam = new Float64Array(N).fill(Infinity), done = new Uint8Array(N);
    const water = new Float64Array(N), level = new Float64Array(N).fill(NaN);
    if (!(V > 0) || !N) return { level, water, pool: NaN, joined: 0, lam };
    const adj = Array.from({ length: N }, () => []);
    for (const e of edges) { adj[e.a].push([e.b, e.sill]); adj[e.b].push([e.a, e.sill]); }
    lam[r0] = rooms[r0].low;
    for (;;) {
      let u = -1;
      for (let i = 0; i < N; i++) if (!done[i] && lam[i] < Infinity && (u < 0 || lam[i] < lam[u])) u = i;
      if (u < 0) break;
      done[u] = 1;
      for (const [v, s] of adj[u]) { const l = s > lam[u] ? s : lam[u]; if (l < lam[v]) lam[v] = l; }
    }
    const order = [];
    for (let i = 0; i < N; i++) if (lam[i] < Infinity) order.push(i);
    order.sort((a, b) => lam[a] - lam[b] || a - b);
    const capOf = (set, h) => { let v = 0, a = 0; for (const i of set) { const r = rooms[i].cap(h); v += r[0]; a += r[1]; } return [v, a]; };
    const lowOf = (set) => { let z = Infinity; for (const i of set) if (rooms[i].low < z) z = rooms[i].low; return z; };
    const topOf = (set) => { let z = -Infinity; for (const i of set) if (rooms[i].top > z) z = rooms[i].top; return z; };
    const solve = (set, target, lo, hi) => {   // the level in [lo, hi] at which the set holds target (it holds less at lo)
      let L = lo + 0.5 * (hi - lo);
      for (let it = 0; it < 200; it++) {
        const [v, a] = capOf(set, L), d = target - v;
        if (Math.abs(d) <= 1e-12 * Math.max(1, target) || hi - lo <= 1e-12) break;
        if (d > 0) lo = L; else hi = L;
        const Ln = a > 0 ? L + d / a : NaN;
        L = Ln > lo && Ln < hi ? Ln : 0.5 * (lo + hi);
      }
      return L;
    };
    const fill = (set, h) => { for (const k of set) { water[k] = rooms[k].cap(h)[0]; level[k] = h; } };
    let pool = [], i = 0;
    while (i < order.length) {
      const lk = lam[order[i]], group = [];
      while (i < order.length && lam[order[i]] === lk) group.push(order[i++]);
      if (pool.length) {
        const before = capOf(pool, lk)[0];
        if (V < before) { i -= group.length; break; }          // the water stands under this joining level
        const after = before + capOf(group, lk)[0];
        if (V < after) {                                       // it stands at it: the joining rooms share what is left
          fill(pool, lk);
          const h = solve(group, V - before, Math.min(lowOf(group), lk), lk);
          fill(group, h);
          return finish(water, level, V, lk, pool.length + group.length, lam);
        }
      }
      pool = pool.concat(group);
    }
    const next = i < order.length ? lam[order[i]] : Infinity, top = topOf(pool), hi = Math.min(next, top);
    if (next === Infinity && V >= capOf(pool, top)[0]) {     // every room full: what is over goes on rTop, or the highest
      fill(pool, top);
      let tk = pool[0];
      for (const k of pool) if (rooms[k].top > rooms[tk].top) tk = k;
      if (rTop !== undefined && rTop >= 0) tk = rTop;
      let got = 0;
      for (const k of pool) got += water[k];
      water[tk] += V - got;
      return { level, water, pool: top, joined: pool.length, lam };
    }
    const h = solve(pool, V, lowOf(pool), hi);
    fill(pool, h);
    return finish(water, level, V, h, pool.length, lam);
  }
  // the last trace of difference to the room the surface stands in (never more than rounding), as rooms.js does
  function finish(water, level, V, h, joined, lam) {
    let got = 0, s = -1;
    for (let k = 0; k < water.length; k++) { got += water[k]; if (water[k] > 0) s = k; }
    if (s >= 0 && got !== V) water[s] += V - got;
    return { level, water, pool: h, joined, lam };
  }

  // ------------------------------------------------------------ every space now
  // room's water below the world level h at the pose F: rooms.js's column cut on the room's sub-pieces
  function capFn(T, c, mu, room, F) {
    const nq = room.q.length, b = new Float64Array(nq), w = new Float64Array(nq);
    let low = Infinity, top = -Infinity;
    for (let j = 0; j < nq; j++) {
      const i = T.col[room.q[j]];
      b[j] = F.R20 * c.x[i] + F.R21 * c.y[i] + F.tz;
      w[j] = room.f[j] * mu * c.dxdy[i];
      const z0 = b[j] + F.R22 * room.lo[j], z1 = b[j] + F.R22 * room.hi[j];
      if (z0 < low) low = z0;
      if (z1 > top) top = z1;
    }
    return {
      low, top,
      cap(h) {
        let v = 0, a = 0;
        for (let j = 0; j < nq; j++) {
          const zc = (h - b[j]) / F.R22;
          if (zc <= room.lo[j]) continue;
          if (zc < room.hi[j]) { v += w[j] * (zc - room.lo[j]); a += w[j] / F.R22; } else v += w[j] * (room.hi[j] - room.lo[j]);
        }
        return [v, a];
      },
    };
  }
  function share(G, sim, opt) {
    opt = opt || {};
    const T = G.T, c = sim.ship.cols, F = sim._F || C.frameOf(sim);
    const water = new Float64Array(G.rooms.length), level = new Float64Array(G.rooms.length).fill(NaN);
    const spaces = new Array(C.NN), only = opt.spaces ? new Set(opt.spaces) : null;
    for (let n = 0; n < C.NN; n++) {
      if (only && !only.has(n)) continue;
      const ks = G.bySpace[n], loc = new Map(ks.map((k, j) => [k, j]));
      const caps = ks.map((k) => capFn(T, c, sim.ship.nodeMu[n], G.rooms[k], F));
      const E = [];
      for (const j of G.edgesBySpace[n]) {
        const e = G.edges[j];
        let sill;
        if (G.opt.open || e.z === -Infinity) sill = -Infinity;
        else if (e.kind === 'plate') { sill = -Infinity; for (let p = 0; p < e.pts.length; p += 3) { const z = F.R20 * e.pts[p] + F.R21 * e.pts[p + 1] + F.R22 * e.pts[p + 2] + F.tz; if (z > sill) sill = z; } }
        else if (e.atLow) {
          // on one deck, where the plans give no place: a door at the higher of its two rooms' lowest floor points; an
          // opening to the slab's rest (gaps all over the deck) beside its row, at the row's own lowest point
          const la = caps[loc.get(e.a)].low, lb = e.kind === 'rest' ? -Infinity : caps[loc.get(e.b)].low;
          sill = Math.max(la === Infinity ? -Infinity : la, lb === Infinity ? -Infinity : lb) + e.sill * F.R22;
        } else sill = F.R20 * e.x + F.R21 * e.y + F.R22 * e.z + F.tz;
        E.push({ a: loc.get(e.a), b: loc.get(e.b), sill });
      }
      let r0 = 0;
      for (let j = 1; j < caps.length; j++) if (caps[j].low < caps[r0].low) r0 = j;
      const V = sim.vol[n] > 0 ? sim.vol[n] : 0, top = loc.get(G.restOf[T.byNode[n][T.byNode[n].length - 1]]);
      let res;
      if (V >= sim.ship.nodeVmax[n]) {
        // full or pressed up, as rooms.js has it: every room full, and what is over on the space's top slab (its rest)
        res = { water: new Float64Array(ks.length), level: new Float64Array(ks.length), pool: NaN, joined: ks.length };
        let got = 0;
        caps.forEach((cp, j) => { res.water[j] = cp.cap(cp.top)[0]; res.level[j] = cp.top; got += res.water[j]; });
        res.water[top] += V - got;
      } else res = pour(caps, E, V, r0, top);
      ks.forEach((k, j) => { water[k] = res.water[j]; level[k] = res.level[j]; });
      spaces[n] = { n, V, pool: res.pool, joined: res.joined, rooms: ks.length };
    }
    // each slab's sum, with its space's pockets' water as far as each holds in the space's lowest slab (as rooms.js)
    const slabs = new Float64Array(T.list.length);
    G.rooms.forEach((r, k) => { slabs[r.slab] += water[k]; });
    for (const p of sim.pockets || []) {
      const held = Math.min(p.vol, p.cap);
      if (!(held > 0)) continue;
      const put = (n, v) => { const ids = T.byNode[n]; if (ids && ids.length) slabs[ids[0]] += v; };
      if (p.side < 0) { put(p.node, 0.5 * held); put(p.node - 2, 0.5 * held); } else put(p.node, held);
    }
    return { water, level, spaces, slabs, F };
  }

  // ------------------------------------------------------------ reading a room
  function ofRow(G, id) { return G.ofRow.get(id) || []; }
  function depthAt(G, res, k, sim) {
    const r = G.rooms[k], F = res.F, L = res.level[k], T = G.T, c = sim.ship.cols;
    let best = -1, d2 = Infinity;
    for (let j = 0; j < r.q.length; j++) { const i = T.col[r.q[j]], dx = c.x[i] - r.x, dy = c.y[i] - r.y, d = dx * dx + dy * dy; if (d < d2) { d2 = d; best = j; } }
    const head = best >= 0 ? r.hi[best] - r.zDeck : 0;
    if (!(L === L)) return { depth: 0, dry: true, full: false, head };
    const zw = (L - (F.R20 * r.x + F.R21 * r.y + F.tz)) / F.R22, d = Math.min(Math.max(zw - r.zDeck, 0), head);
    return { depth: d, dry: false, full: d >= head - 1e-9, head };
  }
  function track(G, opt) {
    const wet = opt && opt.wet != null ? opt.wet : WET, n = G.rooms.length, thr = new Array(n), t = new Array(n), step = new Array(n);
    for (let k = 0; k < n; k++) { thr[k] = wet * G.rooms[k].plan * G.ship.nodeMu[G.rooms[k].n]; t[k] = null; step[k] = null; }
    return { v: 1, wet, rooms: n, thr, t, step, calls: 0 };
  }
  function observe(tr, G, res, sim) {
    const k0 = sim.night ? sim.night.k : Math.round(sim.t / sim.params.dt);
    for (let k = 0; k < tr.rooms; k++) if (tr.t[k] === null && tr.thr[k] > 0 && res.water[k] >= tr.thr[k]) { tr.t[k] = sim.t; tr.step[k] = k0; }
    tr.calls++;
    return tr;
  }

  return { DECKS, VERTICAL, NOFLOOR, BET, WET, graph, pour, share, ofRow, depthAt, track, observe, overlaps };
});

// Her rooms, level 0: R1 of docs/BRAINSTORM_rooms_and_a_walk_through_her_v1_1_2026-11-20.md, as Z2 set it on
// 2026-11-20 (the reason is below).
// Each of the core's 64 spaces is cut at her decks into slabs: a deck's space in one watertight compartment, one side.
// That makes about 250 slabs. Each slab's water is shared out from the core's own: the space's water below its level, by
// the core's own column cut, scaled so that the slabs of a space hold exactly the space's water. The core's pockets (W6's
// bunker, G7's tank, whose water it keeps apart) go to their space's lowest slab, as much as each holds; a pocket's
// over-fill (its water past its capacity, standing for the sea's head over its top) has no place and is kept apart
// (overfill). Slabs and over-fill together are the readouts' water, as C.spaceWater summed.
// A library, as girder.js is: it keeps no state, registers no reader and steps nothing; it is called when a slab's water
// is wanted. So no fingerprint can move, and the forecast never meets it.
// Why not a model of the slabs free of the core at level 0 (the brainstorm's way b): inside each of the core's spaces
// her decks are open floor (the core has one volume to a space). A free model of the slabs would either reproduce the
// core (with the decks open, nothing is learned) or need openings through her decks that no source gives yet. The free
// model waits for her rooms and their openings (the brainstorm's R3 on, read from the deck plans under
// docs/research/RESEARCH_rooms_plans_licence_v1_1_2026-11-20.md); this table is what they will replace, slab by slab.
// The slabs:
// - The cuts are her decks at each column's place (C.deckZ, with her sheer). Below E deck (the core's own cut between its
//   two layers) the cuts are G and F deck; above it D, C, B, A and the Boat deck.
// - A slab is named by the deck that is its floor, "below G" being the lowest (the tank top's or the peak's floor).
// - [stand-in] a deck is cut through the whole compartment, though in the boiler and engine rooms there is none: there,
//   such a slab is a band of the space, not a room.
// - The slabs of a space sum to the core's nodeVmax: the top slab takes the remainder, so the sum is exact.
// It reads the core's own ship (sim.ship: its columns and their entries per space) and copies none of its laws.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../core.js'));
  else root.TitanicRooms = factory(root.TitanicCore);
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';
  const FLOORS = [['below G', 'G', 'F'], ['E', 'D', 'C', 'B', 'A', 'Boat']];   // each layer's slab floors, keel up
  const CUTS = [['G', 'F'], ['D', 'C', 'B', 'A', 'Boat']];                    // the decks that cut a layer, keel up
  const cache = new WeakMap();

  // the level-0 table of a ship: each slab's space (n: zone, side, layer), floor deck, capacity and footprint, and for
  // each of its columns the interval it holds (the column's entry in the space, cut at the decks)
  function table(ship) {
    let T = cache.get(ship);
    if (T) return T;
    const c = ship.cols, list = [], byNode = [];
    const ec = [], elo = [], ehi = [], es = [];   // the slabs' column pieces: column, bottom, top, slab
    const start = new Int32Array(C.NN + 1);       // where each space's pieces begin (they are pushed space by space)
    for (let n = 0; n < C.NN; n++) {
      start[n] = ec.length;
      const k = n >> 2, side = (n >> 1) & 1, layer = n & 1, mu = ship.nodeMu[n];
      const floors = FLOORS[layer], cuts = CUTS[layer], S = floors.length;
      const vol = new Float64Array(S), foot = new Float64Array(S), pieces = Array.from({ length: S }, () => []);
      for (let j = ship.nodeStart[n]; j < ship.nodeStart[n] + ship.nodeCount[n]; j++) {
        const i = ship.entCol[j], a = ship.entA[j], e = ship.entE[j], x = c.x[i], w = c.dxdy[i];
        for (let s = 0; s < S; s++) {
          const lo = s === 0 ? a : Math.max(a, C.deckZ(cuts[s - 1], x));
          const hi = s === S - 1 ? e : Math.min(e, C.deckZ(cuts[s], x));
          if (hi > lo + 1e-9) { vol[s] += w * (hi - lo); foot[s] += w; pieces[s].push([i, lo, hi]); }
        }
      }
      const idx = [];
      let sum = 0, last = -1;
      for (let s = 0; s < S; s++) if (pieces[s].length) last = s;
      for (let s = 0; s < S; s++) {
        if (!pieces[s].length) continue;
        const vmax = s === last ? ship.nodeVmax[n] - sum : mu * vol[s];   // the top slab takes the remainder: the sum is exact
        sum += vmax;
        const id = list.length;
        list.push({ id, n, zone: k, side, layer, floor: floors[s], vmax, foot: mu * foot[s], key: k + ':' + (side ? 'S' : 'P') + ':' + floors[s] });
        for (const [i, lo, hi] of pieces[s]) { ec.push(i); elo.push(lo); ehi.push(hi); es.push(id); }
        idx.push(id);
      }
      byNode.push(idx);
    }
    start[C.NN] = ec.length;
    T = { list, byNode, col: Int32Array.from(ec), lo: Float64Array.from(elo), hi: Float64Array.from(ehi), slab: Int32Array.from(es), start };
    cache.set(ship, T);
    return T;
  }

  // the water of space n below the world's level L at the pose F (m3), and its rate with L (m2): the core's column cut
  function cutAt(T, c, mu, n, F, L) {
    let v = 0, a = 0;
    for (let q = T.start[n]; q < T.start[n + 1]; q++) {
      const i = T.col[q], zc = (L - (F.R20 * c.x[i] + F.R21 * c.y[i] + F.tz)) / F.R22;
      if (zc <= T.lo[q]) continue;
      if (zc < T.hi[q]) { v += mu * c.dxdy[i] * (zc - T.lo[q]); a += mu * c.dxdy[i] / F.R22; }
      else v += mu * c.dxdy[i] * (T.hi[q] - T.lo[q]);
    }
    return [v, a];
  }
  // each slab's water (m3 of sea, as the core's sim.vol), from the core's own. The level is the one at which the space's
  // own water lies below it, at the pose F (sim._F, the frame of the core's last flows, else her pose now), by the core's
  // column cut; it is found from the core's sim.level (solved before that step's flows) by Newton's steps, kept inside
  // a bracket. The slabs then hold exactly sim.vol, and none holds more than it can unless the space is over-full; the
  // water past the top goes to the top slab.
  function waterOf(sim, F, out) {
    const T = table(sim.ship), c = sim.ship.cols;
    F = F || sim._F || C.frameOf(sim);
    const w = out && out.length === T.list.length ? out.fill(0) : new Float64Array(T.list.length);
    for (let n = 0; n < C.NN; n++) {
      const V = sim.vol[n]; if (!(V > 0)) continue;
      const ids = T.byNode[n]; if (!ids.length) continue;
      const mu = sim.ship.nodeMu[n], Vmax = sim.ship.nodeVmax[n];
      if (V >= Vmax) {                          // full, or over-full ("pressed up", as the core lets a space be)
        for (const id of ids) w[id] = T.list[id].vmax;
        w[ids[ids.length - 1]] += V - Vmax;
        continue;
      }
      // the bracket: the space's lowest and highest points in the world at this pose
      let lo = Infinity, hi = -Infinity;
      for (let q = T.start[n]; q < T.start[n + 1]; q++) {
        const i = T.col[q], b = F.R20 * c.x[i] + F.R21 * c.y[i] + F.tz;
        const z0 = b + F.R22 * T.lo[q], z1 = b + F.R22 * T.hi[q];
        if (z0 < lo) lo = z0; if (z1 > hi) hi = z1;
      }
      let L = Math.min(hi, Math.max(lo, sim.level[n]));
      for (let it = 0; it < 60; it++) {
        const [v, a] = cutAt(T, c, mu, n, F, L), d = V - v;
        if (Math.abs(d) <= 1e-12 * Vmax) break;
        if (d > 0) lo = L; else hi = L;
        const Ln = a > 0 ? L + d / a : NaN;
        L = Ln > lo && Ln < hi ? Ln : 0.5 * (lo + hi);   // Newton's step, or halve the bracket
      }
      let got = 0;
      for (let q = T.start[n]; q < T.start[n + 1]; q++) {
        const i = T.col[q], zc = (L - (F.R20 * c.x[i] + F.R21 * c.y[i] + F.tz)) / F.R22;
        const top = zc < T.hi[q] ? zc : T.hi[q];
        if (top > T.lo[q]) { const v = mu * c.dxdy[i] * (top - T.lo[q]); w[T.slab[q]] += v; got += v; }
      }
      // the last trace of difference, to the slab the surface stands in (never more than rounding)
      if (got !== V) { let s = ids[0]; for (const id of ids) if (w[id] > 0 && w[id] < T.list[id].vmax) s = id; w[s] += V - got; }
    }
    // A pocket's own water (W6's bunker, G7's tank) is kept by the core outside sim.vol and counted in its space
    // (C.spaceWater: a pocket of both sides half to each half). As much of it as the pocket holds, min(vol, cap), goes to
    // that space's lowest slab. Both pockets lie below G deck: the bunker inside that slab's place, the tank under the
    // orlop's flat beneath it.
    // The rest, its over-fill, stands for the sea's head over its top (the core's law, as for over-full spaces: a stiff
    // virtual area, params.bunkerAov), not for water with a place. A mirror that sums water must keep it, and one that
    // places water must not place it (the mainline, 11-21). So it is kept apart (overfill, below): the slabs and the
    // over-fill together are the readouts' water, and no slab holds water above a pocket's top
    for (const k of sim.pockets || []) {
      const held = Math.min(k.vol, k.cap); if (!(held > 0)) continue;
      const put = (n, v) => { const ids = T.byNode[n]; if (ids && ids.length) w[ids[0]] += v; };
      if (k.side < 0) { put(k.node, 0.5 * held); put(k.node - 2, 0.5 * held); } else put(k.node, held);
    }
    return w;
  }
  // the pockets' over-fill (m3 of sea): each pocket's water past its capacity, which the core keeps for the sea's head
  // over its top and which has no place. With waterOf's slabs it makes the readouts' water (waterM3)
  function overfill(sim) {
    const out = [];
    (sim.pockets || []).forEach((k, j) => { if (k.vol > k.cap) out.push({ j, name: k.name, node: k.node, side: k.side, m3: k.vol - k.cap }); });
    return out;
  }

  // the water on each deck, all her compartments and sides together (m3): the slabs whose floor is that deck
  function byDeck(sim, F) {
    const T = table(sim.ship), w = waterOf(sim, F), out = {};
    for (const s of T.list) out[s.floor] = (out[s.floor] || 0) + w[s.id];
    return out;
  }

  // the slab holding a point of her frame (x, y, z): its zone, side, and the deck below z there; -1 outside her spaces
  function slabAt(ship, x, y, z) {
    const T = table(ship), k = C.zoneAt(x), side = y >= 0 ? 0 : 1, layer = z >= C.deckZ('E', x) ? 1 : 0, n = C.nodeIndex(k, side, layer);
    const floors = FLOORS[layer], cuts = CUTS[layer];
    let s = 0;
    for (let d = 0; d < cuts.length; d++) if (z >= C.deckZ(cuts[d], x)) s = d + 1;
    const want = floors[s];
    for (const id of T.byNode[n]) if (T.list[id].floor === want) return id;
    return -1;
  }

  return { FLOORS, CUTS, table, waterOf, overfill, byDeck, slabAt };
});

/*
 * Her strength along her length (stage B1 of docs/DESIGN_the_break_and_two_bodies_v1_2026-11-19.md, section 4.2): the
 * hull's cross-section at a station as longitudinal elements, each with an area, a height and a load-shortening curve,
 * and Smith's progressive-collapse method on it. Impose a curvature, find the neutral axis where the section's net force
 * is nothing, sum the moments: the moment against curvature rises, peaks at the ultimate moment Mu and falls. The falling
 * branch is kept (stage B4's hinge carries it). With the shear the side shell can carry, Vu, that is what the hull could
 * bear at that station; core/readers/girder.js gives what it is asked to bear, and core/readers/onset.js compares the two.
 *
 *   elements(ship, x, opts)        the section at x: [{ name, kind, z, A, t, sT, sC, tLaw, cLaw, ... }], from the ship's own
 *                                  form (core/core.js: halfBreadth, deckZ, inWell) and the scantlings below
 *   elastic(els)                   area, neutral axis, moment of inertia, moduli at the strength deck and the keel
 *   collapse(els, sense, opts)     Smith's curve in 'hog' or 'sag': { k, M, zNA, Mu, kU, zU, iU, first, order }
 *   shear(els)                     Vu: the side shell's area in shear times what its seams carry
 *   at(ship, x, opts)              all of it at one station, cached: { x, el, hog, sag, Vu, where }
 *   along(ship, xs, opts)          at many stations: { x, hog, sag, Vu } as Float64Arrays
 *   curve(ship, x, sense, opts)    the whole moment-curvature curve to opts.kMax yield curvatures (default 6), cached
 *   hinge(ship, x, sense, opts)    stage B4's law from the falling branch: against the angle between the parts, the
 *                                  joint's moment and its slope, the share torn, the work, the hinge's height, the
 *                                  ligament's tension and shear capacity, and the tear's opening in each space; cached
 *
 * It reads the ship's form and nothing of a sim's state: strength belongs to the ship, not to the night. It writes into
 * nothing; its caches are keyed by the ship (a WeakMap) and the options, outside any sim. It is pure: the same ship and
 * options give the same bits. Deterministic: fixed-order sums, a bracketed root-find with a fixed number of iterations.
 *
 * Signs: z up from the keel (the ship frame); strain positive in tension; a hogging curvature puts the top in tension;
 * the moment hogging positive (as the gauge's), so a sagging section's Mu is reported as a positive magnitude.
 *
 * Numbers carry their source as core/readers/girder.js tags them: [read] in a source the repository's notes read;
 * [search summary] only in a digest; [derived] arithmetic on those, shown; [bet] no source, this lane's judgement;
 * [fitted] set to reproduce a reference. The notes: docs/research/RESEARCH_breakup_hull_girder_v1_2026-11-17.md ("the
 * girder note"; its section 3 is the structure), docs/research/RESEARCH_hull_strength_along_length_v1_2026-11-17.md ("the
 * strength note"; its section 4 is the plating and the frames), docs/research/RESEARCH_bow_crushing_head_on_v1_2026-11-17.md
 * (Paik et al. 2025, via "the bow note"), and this stage's own research, docs/research/RESEARCH_midship_scantlings_v1_2026-11-19.md
 * ("the scantlings note": Mengot's pages, Walker 1912, Halpern, the Report, Wilding, Layton, read by a research subagent
 * on 2026-11-19, web pages only).
 *
 * Decided before any result was computed, and kept whatever the result:
 *   - each element as the design prescribes it (4.2): in tension up to its riveted joint's strength, then parting; in
 *     compression up to its buckling stress between floors (or beams, or frames), then shedding load;
 *   - a plate's buckling as the girder note derives it: a wide plate between its supports, k about 1.1, with the
 *     plasticity correction of Johnson and Ostenfeld;
 *   - the strength decks B and C (Mengot); the decks below them out, "not continuously riveted" (Mengot); nothing above B;
 *   - the tank top at the Marine Forensics Panel's own 0.75 in, its section being the reference of the check.
 * Decided after the first comparison with the panel's elastic section (its neutral axis then 0.77 m high), each a source
 * replacing a bet of this lane's: no extra strake inboard of B deck's doubled edge (Mengot's words need none); the
 * girders at the panel's own 1 in, not 0.75; the margin plate the panel names. Then the one figure no source gives, C
 * deck's plating against B's, fitted to the panel's section (FIT). No choice looked at the ultimate moment, which is what
 * the elements give, fitted to nothing; it lay inside 4.0 to 5.4 GN m at every step it was computed.
 * tools/strength_tests.js prints what other choices give beside these; none of them is chosen by its result.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../core.js'));
  else root.TitanicSection = factory(root.TitanicCore);
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';
  const IN = 0.0254, FT = C.FT;
  const bulk = (id) => C.BULKHEADS.find(b => b.id === id).x;

  // ---------------------------------------------------------------- the steel
  const MAT = {
    E: 207e9,        // Pa: mild steel [derived in the girder note, section 3: "E 207 GPa, nu 0.3"]
    nu: 0.3,         // [the same]
    // yield of her hull plate, recovered: 262 and 280 MPa (NIST-IR 6118, Table 1) [read in the girder note, section 3];
    // the lower is taken (the 1996 plate's 38 ksi) [bet: which specimen ran along her is not stated]; 280 is a what-if
    sY: 262e6,
    // the base yield Paik et al. state their joints' equivalent efficiencies against, so that 0.626 x 245 = 153.4 MPa
    // [read in the bow note, via the girder note, section 3]
    base: 245e6,
  };

  // ---------------------------------------------------------------- her riveted joints, in tension (and shear)
  // A joint's strength as a stress on the plate's gross area, as an efficiency on MAT.base. A strake carries the hull's
  // tension across its butts (the seams between strakes carry only shear), so the butts' riveting is what counts.
  // The scantlings note (docs/research/RESEARCH_midship_scantlings_v1_2026-11-19.md; its tags are kept): bottom butts
  // lapped and quadruple-riveted, bottom seams double-riveted laps, topside
  // seams treble or quadruple, topside and doubling butts double-strapped (The Shipbuilder, 1911) [search summary]; the
  // tank top's butts triple-riveted (the panel) [search summary]; the sheer strake's butts with triple plates, heavily
  // riveted (the panel) [search summary]
  const JOINT = {
    // a quadruple-riveted 1.00 in side-shell joint: 0.626 x 245 = 153.4 MPa (Paik et al. 2025, Table 4) [read in the bow
    // note]: taken for every quadruple-riveted or double-strapped butt of 1 in plate (the bottom's, the side's, the
    // sheer strake's, the strength decks', the keel's and the girders') [bet: the one such joint the notes give]
    quad: 0.626,
    // a triple-riveted joint: 42 % on the gross area (the panel's efficiencies: 28 % double, 42 % triple) [search summary,
    // the scantlings note, 6], as a stress on her plate's yield: 0.42 x 262 = 110 MPa, on Paik's base 0.449 [derived]
    triple: 0.42 * 262 / 245,
    // a double-riveted joint: 28 % (the panel) [search summary]: 0.28 x 262 = 73 MPa, on Paik's base 0.299 [derived]
    double: 0.28 * 262 / 245,
  };

  // ---------------------------------------------------------------- her frames and plating along her length
  // Frames: 36 in amidships, the widest anywhere in her (Chirnside); 24 in at the very bow, 27 in at the stern (Mengot)
  // [read in the strength note, section 4]. Where the spacing changes: NOT FOUND. Taken 36 in over x -60 to +60 and
  // closing in a straight line to 24 in at the stem and 27 in at the stern [bet].
  function frameAt(x) {
    const s0 = 36 * IN;
    if (x > 60) return s0 + (24 * IN - s0) * Math.min(1, (x - 60) / (129.54 - 60));
    if (x < -60) return s0 + (27 * IN - s0) * Math.min(1, (-60 - x) / (129.54 - 60));
    return s0;
  }
  // Shell plating: 1 in amidships (Wilding: 20/20ths) [read in the strength note, section 4]; the sides taper "fore and
  // aft of the funnels" to 0.7 and 0.6 in (Mengot) [read there]; in the forward body 0.84 to 0.90 in toward boiler room 6,
  // 0.70 to 0.84 over the holds, 0.60 to 0.70 near the stem (Paik et al., Fig. 51) [read in the bow note]. As a line
  // through those: 1.00 in to x +45, 0.87 at +62 (boiler room 6), 0.77 at +93 (the holds), 0.65 at +122 and on to the
  // stem [derived]; the after body the same, mirrored about amidships [bet: no figures aft].
  const SIDE_T = [[0, 1.00], [45, 1.00], [62, 0.87], [93, 0.77], [122, 0.65], [140, 0.65]];
  // the bottom: 14/20 to 21/20 in in the forward body (Paik et al., Fig. 51) [read in the bow note]; 1 in amidships as the
  // shell [bet: its own figure amidships NOT FOUND], tapering as the sides to 0.70 in (14/20) at the ends [bet]
  const BOTTOM_T = [[0, 1.00], [45, 1.00], [62, 0.90], [93, 0.80], [122, 0.70], [140, 0.70]];
  const lerpT = (tab, x) => {
    const a = Math.abs(x);
    for (let i = 1; i < tab.length; i++) if (a <= tab[i][0]) { const [x0, t0] = tab[i - 1], [x1, t1] = tab[i]; return (t0 + (t1 - t0) * (a - x0) / (x1 - x0)) * IN; }
    return tab[tab.length - 1][1] * IN;
  };

  // ---------------------------------------------------------------- the scantlings, element by element
  // Every figure here is a number the checks can move; each carries its tag. t in inches unless stated.
  // Her plates were generally 6 ft wide and 30 ft long (the Titanic Historical Society) [read in the strength note, 4]: a
  // strake whose width the sources do not give is taken as one plate's, 6 ft [bet].
  const STRAKE = 72 * IN;
  const SCANT = {
    // the keel: a flat keel plate, "a single thickness of plating" 1 1/2 in (Walker 1912) [read]; the A strake over the
    // keel bar 30/20 in amidships, 24/20 at the ends (Layton) [read]; its width NOT FOUND: one strake [bet]
    keelPlate: { w: STRAKE, t: [[0, 1.50], [45, 1.50], [122, 1.20], [140, 1.20]], tag: 'flat keel plate 1 1/2 in (Walker; Layton) [read], 1.2 in at the ends (24/20, Layton) [read]; one strake wide [bet]' },
    keelBar: { w: 19.5 * IN, t: 3 * IN, tag: 'keel bar, a flat bar 19 1/2 x 3 in (Walker 1912; Mengot) [read]' },
    // the bilge strake doubled (Wilding; Walker: "doubling of the plating at the bilges") [read]; bilge plating over 1 in
    // for two-fifths of her length (Layton) [read]: over x -52 to +52 [derived: 0.4 x 850 ft, amidships]; the doubling
    // 1 in over one strake at the turn of the bilge [bet]
    bilgeDouble: { t: 1.0, w: STRAKE, x: 0.2 * 850 * FT, tag: 'the bilge strake doubled [read], over two-fifths of her length [read]; 1 in, one strake [bet]' },
    // the double bottom: 63 in deep at the centre line, 78 in in way of the reciprocating machinery (the Wreck
    // Commissioner's Report; Halpern) [read; Mengot gives 75 in]; the change begins at frame 25A (Mengot) [read in the
    // girder note, 1.3]: x -22.4 [derived there]; it runs aft to bulkhead L, the after end of the engines' room [bet]
    db: { d: 63 * IN, dDeep: 78 * IN, deepFrom: -22.4, deepTo: bulk('L'), tag: '63 in; 78 in under the reciprocating engines [read]; from frame 25A [read] to bulkhead L [bet]' },
    // the double bottom from the forepeak's bulkhead A to the after peak's bulkhead P (the core's peaks have none)
    // [read: core/core.js ZONES]; the tank top full width from the dynamo room to boiler room 6 (Mengot) [read], a
    // narrower wedge fore and aft [read]: taken full width throughout [bet]
    dbExtent: [bulk('P'), bulk('A')],
    // the tank top: 0.75 in in the panel's own model of the bottom (Mengot and Woytowich 2010) [search summary]: the panel's
    // section is the reference, so its figure is taken; "about half as thick" as the 1 in shell (Mengot) [read] and 0.60 in
    // forward (Paik et al.) [read in the bow note] are what-ifs
    tankTop: { t: 0.75, tag: 'tank top 0.75 in (the panel\'s model) [search summary]; about 0.5 in by Mengot [read], a what-if' },
    // Where two sources differ, the panel's own figure is taken, since the panel's section is the reference of the check
    // (rule set before any result). The centre keelson, watertight, 670 ft from bulkhead B to O, the double bottom's depth
    // (Halpern) [read]; four side girders a side "between keel and margin plate", as the panel counted them in its midship
    // section [search summary] (Halpern: five intercostal girders a side [read]), the outermost taken as the watertight
    // wing longitudinal 30 ft off the centre line, bulkhead D to M (Halpern) [read]; the margin plate, continuous, dropping
    // nearly vertically from the tank top's edge to the bottom shell (Halpern) [read]. Their thicknesses: 1 in, the panel's
    // model of the bottom (1 in for every plate but the tank top's 0.75) [search summary]
    centreGirder: { t: 1.0, x: [bulk('O'), bulk('B')], tag: 'centre keelson, B to O [read]; 1 in (the panel\'s model) [search summary]' },
    sideGirders: { n: 4, t: 1.0, tag: 'four side girders a side (the panel) [search summary]; 1 in (the panel\'s model) [search summary]' },
    margin: { t: 1.0, tag: 'the margin plate, continuous, nearly vertical (Halpern) [read]; 1 in (the panel\'s model) [search summary]; at the tank top\'s edge [bet]' },
    // the sheer strake doubled with 1 in plate over its top 100 in (Mengot) [read]; the shell doubled between C and B decks
    // (the Report) [read]; its extent along her NOT FOUND: the bridge deck's length less its ends, x -77.7 to +77.7 (the
    // three-fifths zone of the period rules) [bet]; the 0.9 in angle joining it to B deck's stringer (Mengot) [read]: a
    // 6 x 6 in angle [bet]
    sheerDouble: { t: 1.0, h: 100 * IN, x: 77.7, angle: (6 + 6 - 0.9) * 0.9 * IN * IN, tag: 'sheer strake doubled 1 in over its top 100 in [read]; over x -77.7 to +77.7 [bet]; its 0.9 in angle [read], 6 x 6 in [bet]' },
    // The strength decks, B and C ("B&C decks are the strength decks", Mengot) [read]. Across her (Mengot, both pages)
    // [read]: "Double 1 inch plates at the outer edge of B Deck", then it "tapers to 3/4", with a 1 in plate down each
    // side of each funnel's uptake, the plating getting thicker going outboard; C deck the same pattern, no figures given
    // [read]. As elements: the doubled edge strake 2 x 1 in, one strake wide [read; its width a bet]; 3/4 in across the
    // rest [read]; a 1 in strake each side of an uptake [read; one strake wide, bet]. Beyond x +/-77.7 the edge single
    // [bet]. C deck: B's pattern scaled by FIT.cDeck [fitted]
    strong: { edge: { w: STRAKE, t: 2.0 }, field: 0.75, uptake: { w: STRAKE, t: 1.0 }, edgeX: 77.7,
      tag: 'doubled 1 in edge strake, 3/4 in across the rest, 1 in beside the uptakes (Mengot) [read]; strake widths one plate [bet]; C deck B\'s pattern x FIT.cDeck [fitted]' },
    // The decks below C: "not continuously riveted", attached by brackets at each frame (Mengot) [read], and the panel's
    // author counts B and C as the strength decks [read]: left out of the section; their thicknesses are NOT FOUND in any
    // open source (the scantlings note). opts.lowerDecks puts D, E and F in at 1/2 in [bet], a what-if.
    lower: { D: 0.5, E: 0.5, F: 0.5, tag: 'D, E and F decks: not continuously riveted (Mengot) [read]: out; a what-if puts them in at 1/2 in [bet]' },
    // deck beams on every frame (Walker; the Report) [read]; four lines of longitudinal girders under B to E decks
    // (Walker) [read]: the plating's panels between them about a fifth of her breadth, 5.6 m [derived]
    beamSpan: 92.5 * FT / 5,
  };
  // FITTED: the one figure no source gives that sets how her steel is shared between her top and her bottom: C deck's
  // plating, which Mengot gives only as B's pattern, as a share of B's (bounds set beforehand: 0.5 to 1.5), fitted by least
  // squares to the Marine Forensics Panel's elastic midship section (neutral axis 398 in; moduli 1.86e6 in3 at B deck and
  // 2.23e6 in3 at the keel: three figures, one parameter, so two of the three remain a check). tools/strength_tests.js
  // prints the section as found (C deck as B) beside the fit, refits it and holds this figure to the refit. The ultimate
  // moment is fitted to nothing.
  const FIT = { cDeck: 0.893, tag: '[fitted: the panel\'s elastic midship section]' };
  // The openings through the strength decks, across her (m) over x0..x1 [sizes read in Mengot, "Titanic's Blueprints",
  // via the scantlings note, 4; places derived or bet as each says]. Only B and C enter the section.
  const OPENINGS = [
    // the uptakes' holes 20 x 45 ft (which way is across not stated: 20 ft across, as the funnel's 19 ft beam [bet]);
    // each funnel's uptakes merge over the bulkhead between its two boiler rooms (Halpern) [read]: E, G and J [derived]
    { name: 'first funnel\'s uptakes', x0: bulk('E') - 22.5 * FT, x1: bulk('E') + 22.5 * FT, w: 20 * FT, decks: ['B', 'C'], uptake: true, tag: '20 x 45 ft [read]; over bulkhead E [derived]' },
    { name: 'second funnel\'s uptakes', x0: bulk('G') - 22.5 * FT, x1: bulk('G') + 22.5 * FT, w: 20 * FT, decks: ['B', 'C'], uptake: true, tag: '20 x 45 ft [read]; over bulkhead G [derived]' },
    { name: 'third funnel\'s uptakes', x0: bulk('J') - 22.5 * FT, x1: bulk('J') + 22.5 * FT, w: 20 * FT, decks: ['B', 'C'], uptake: true, tag: '20 x 45 ft [read]; over bulkhead J [derived]' },
    // the reciprocating engines' opening, 42 x 38 ft at the launch, closed down to 24 x 20 ft (Mengot) [read]; centred in
    // their room, K to L [bet: the place]
    { name: 'engine room opening', x0: 0.5 * (bulk('K') + bulk('L')) - 12 * FT, x1: 0.5 * (bulk('K') + bulk('L')) + 12 * FT, w: 20 * FT, decks: ['B', 'C'], tag: '24 x 20 ft as completed [read]; centred in its room [bet]' },
    // the turbine's opening, 25 x 48 ft at the launch, closed down to 18 x 20 ft for the fourth funnel (Mengot) [read];
    // centred in its room, L to M [bet]
    { name: 'turbine room opening', x0: 0.5 * (bulk('L') + bulk('M')) - 10 * FT, x1: 0.5 * (bulk('L') + bulk('M')) + 10 * FT, w: 18 * FT, decks: ['B', 'C'], tag: '18 x 20 ft as completed [read]; centred in its room [bet]' },
    // the forward grand staircase: 16 ft wide (the 1911 brochure) [read], boat deck to E deck [read], its forward end at
    // about frame 43F and running 33 ft aft (the scantlings note) [derived]
    { name: 'forward grand staircase', x0: (425 - 330) * FT, x1: (425 - 297) * FT, w: 16 * FT, decks: ['B', 'C'], tag: '16 ft wide [read]; 297 to 330 ft from the FP [derived]' },
    // Not here: the aft grand staircase (A to C decks, between the third and fourth funnels [read]): no source places it
    // along her except "at or just aft of the point of rupture", which would put the record into the strength; the
    // expansion joints, which cut nothing at or below B deck ("no construct at all on B-deck itself", Mengot; they "go
    // down to the strong deck", Wilding) [read]; hatches, light wells and lifts, whose sizes are NOT FOUND
  ];

  // ---------------------------------------------------------------- the section at a station
  const deckZ = (name, x) => C.deckZ(name, x);
  // the strength deck: B, except in the open well decks, where the hull's top is C (core/core.js inWell) [read: the core]
  function strengthDeck(x) { return C.inWell(x) ? 'C' : 'B'; }
  function openW(deck, x) { let w = 0; for (const o of OPENINGS) if (x >= o.x0 && x <= o.x1 && o.decks.indexOf(deck) >= 0) w += o.w; return w; }
  const inSpan = (spans, x) => spans.some(s => x >= s[0] && x <= s[1]);
  // load-shortening laws, chosen per element (see stress() below):
  //   tension 'joint': elastic to sT, a plateau of slip EPS_SLIP, then to nothing over EPS_DROP (the joint parts)
  //   compression 'buckle': elastic to sC, then shedding as (eC / e)^Q_SHED; 'yield': elastic to sC, then held
  const EPS_SLIP = 5e-4;   // a rivet's slip before it shears, a fifth of a 1 in rivet's diameter over a 30 ft plate [bet]
  const EPS_DROP = 5e-4;   // the joint's load gone over as much again [bet]
  const Q_SHED = 0.5;      // a buckled wide plate's load falls as the square root of its shortening [bet]

  // a wide plate between supports s apart (along her) and b apart (across), compressed along her: its elastic buckling
  // stress k pi^2 E / (12 (1 - nu^2)) (t/s)^2 with k = (1 + (s/b)^2)^2 (about 1.1 for the bottom: the girder note, 3),
  // and the plasticity correction of Johnson and Ostenfeld above half the yield [derived: the girder note's method]
  function buckle(t, s, b, sY, opts) {
    const kb = opts && opts.buckle === 'clamped' ? 4 : 1;     // what-if: the floors holding the plate's edges from turning
    const k = kb * Math.pow(1 + (s / b) * (s / b), 2);
    const sE = k * Math.PI * Math.PI * MAT.E / (12 * (1 - MAT.nu * MAT.nu)) * (t / s) * (t / s);
    return sE <= 0.5 * sY ? sE : sY * (1 - sY / (4 * sE));
  }

  // The section at x: elements { name, kind, z, A, dz (vertical extent, for its own inertia), t, s, sT, sC, tLaw, cLaw,
  // web (true for the side shell: it carries the shear) }. Each pair of mirrored elements (port and starboard) is one
  // element of twice the area: the section is symmetric. What-ifs: opts.scale multiplies every element's strengths, in
  // tension and in compression, buckling included (the monotonicity check; a hull stronger than any load); opts.sY
  // replaces the yield; opts.eta replaces joint efficiencies ({ quad, triple, double }); opts.buckle 'clamped' holds the
  // plates' loaded edges from turning (k four times); opts.fit replaces the fitted figure ({ cDeck }); opts.tankTop its
  // thickness (in); opts.lowerDecks puts D, E and F decks in; opts.parting { slip, drop } replaces the riveted joints'
  // parting strains (EPS_SLIP, EPS_DROP, each a strain; B4's gate 4 what-if, the coordinator's word of 2026-11-23 19:11).
  // That one is set on the joints' elements (eSlip, eDrop) only when asked, so that the default's elements, and every
  // hash of them, stay as they are; the laws below read an element's own value, else the constant, in the same order.
  function elements(ship, x, opts) {
    opts = opts || {};
    const els = build(ship, x, opts), sc = opts.scale || 1;
    if (sc !== 1) for (const e of els) { e.sT *= sc; e.sC *= sc; }
    if (opts.parting) for (const e of els) if (e.tLaw === 'joint') { if (opts.parting.slip !== undefined) e.eSlip = opts.parting.slip; if (opts.parting.drop !== undefined) e.eDrop = opts.parting.drop; }
    return els;
  }
  function build(ship, x, opts) {
    const P = ship && ship.hull ? ship.hull : undefined;
    const hb = (z) => C.halfBreadth(x, z, P);
    const sY = opts.sY || MAT.sY, base = MAT.base;
    const J = Object.assign({}, JOINT, opts.eta || {});
    const F = Object.assign({}, FIT, opts.fit || {});            // the fitted figures; opts.fit for the fit itself and what-ifs
    const jT = (eta) => eta * base;
    const s = frameAt(x);
    const top = strengthDeck(x), zTop = deckZ(top, x);
    const els = [];
    const add = (e) => { if (e.A > 0) els.push(e); };
    const tSide = lerpT(SIDE_T, x), tBot = lerpT(BOTTOM_T, x), tKeel = lerpT(SCANT.keelPlate.t, x);
    // the lowest point of the section at x: the flat of her bottom where she has one, else the first height with breadth
    let z0 = 0; if (!(hb(0) > 1e-3)) { while (z0 < zTop && !(hb(z0) > 1e-3)) z0 += 0.05; }
    if (z0 >= zTop - 0.5) return els;                         // no hull here worth the name (the stem, the stern tip)
    const dbD = (x <= SCANT.db.deepFrom && x >= SCANT.db.deepTo) ? SCANT.db.dDeep : SCANT.db.d;
    // the double bottom where she has one and her bottom lies far enough under its tank top to hold it
    const inDB = x >= SCANT.dbExtent[0] && x <= SCANT.dbExtent[1] && dbD > z0 + 0.3;
    const zTT = inDB ? dbD : 0;
    const rb = (P || C.HULL).rb;                                // her bilge's radius, the ship's own form
    const zMargin = inDB ? 7 * FT : 0;                          // the double bottom up her side to 7 ft over half her length [read: the Report]
    const yFlat = hb(z0);
    const nSG = SCANT.sideGirders.n, gs = Math.max(1, yFlat / (nSG + 1));
    // the bottom: lapped butts carry load only through rivet shear (the panel's argument, via the girder note, 2 and 3)
    // [read], so the joint limits the bottom in compression as well as in tension [derived from that]
    const lapC = (sb) => Math.min(sb, jT(J.quad));
    // the flat of her bottom: the keel plate (one strake about the centre line), then the bottom shell out to the bilge;
    // plates between floors (s along her) and between the double bottom's girders (gs across)
    if (yFlat > 0.05) {
      const yK = Math.min(0.5 * SCANT.keelPlate.w, yFlat);
      add({ name: 'keel plate', kind: 'bottom', z: z0, dz: 0, A: 2 * tKeel * yK, t: tKeel, s, sT: jT(J.quad), sC: lapC(buckle(tKeel, s, inDB ? gs : SCANT.beamSpan, sY, opts)), tLaw: 'joint', cLaw: 'buckle', web: false });
      const yb = yFlat - yK, nb = Math.max(1, Math.round(yb / 2));
      for (let i = 0; i < nb && yb > 0; i++) add({ name: 'bottom shell', kind: 'bottom', z: z0, dz: 0, A: 2 * tBot * yb / nb, t: tBot, s, sT: jT(J.quad), sC: lapC(buckle(tBot, s, inDB ? gs : SCANT.beamSpan, sY, opts)), tLaw: 'joint', cLaw: 'buckle', web: false });
    }
    // the shell from the bilge up to the strength deck, by girth: strips about 0.6 m long, with C deck an edge of its own
    // and the sheer strake's doubling over its top 100 in
    const zC = deckZ('C', x), sheerX = Math.abs(x) <= SCANT.sheerDouble.x && top === 'B', zSh = zTop - SCANT.sheerDouble.h;
    const zs = [z0];
    { let z = z0, acc = 0; const dz = 0.1;
      while (z < zTop - 1e-9) {
        let zn = Math.min(zTop, z + dz); if (sheerX && z < zSh - 1e-9 && zn > zSh) zn = zSh;
        acc += C.hypot(hb(zn) - hb(z), zn - z); z = zn;
        if (acc >= 0.6 || z >= zTop - 1e-9 || (sheerX && Math.abs(z - zSh) < 1e-9)) { zs.push(z); acc = 0; }
      } }
    // the bilge strake's doubling: one strake about the middle of the bilge's turn, amidships [read: doubled; bet: where]
    const bilgeX = inDB && Math.abs(x) <= SCANT.bilgeDouble.x;
    let gBil0 = 0, gBil1 = 0;
    if (bilgeX) { let g = 0, gMid = 0; for (let z = z0; z < rb; z += 0.01) { const d = C.hypot(hb(z + 0.01) - hb(z), 0.01); if (z + 0.005 < 0.5 * rb) gMid = g + d; g += d; } gBil0 = gMid - 0.5 * SCANT.bilgeDouble.w; gBil1 = gMid + 0.5 * SCANT.bilgeDouble.w; }
    let girth = 0;
    for (let i = 1; i < zs.length; i++) {
      const za = zs[i - 1], zb = zs[i];
      if (!(zb > za + 1e-6)) continue;
      // the strip's girth length, by its 0.1 m pieces
      let L = 0; { const n = Math.max(1, Math.ceil((zb - za) / 0.1)); for (let j = 0; j < n; j++) { const a = za + (zb - za) * j / n, b = za + (zb - za) * (j + 1) / n; L += C.hypot(hb(b) - hb(a), b - a); } }
      const g0 = girth, g1 = girth + L; girth = g1;
      const zm = 0.5 * (za + zb), bilge = zm < zMargin || (zm < rb && !inDB);
      const t = bilge ? tBot : tSide;
      const td = sheerX && zm >= zSh - 1e-6 ? SCANT.sheerDouble.t * IN : 0;
      // the share of this strip under the bilge strake's doubling
      const bd = bilgeX ? Math.max(0, Math.min(g1, gBil1) - Math.max(g0, gBil0)) : 0;
      const tb = SCANT.bilgeDouble.t * IN;
      // the shell between frames (s along her) and between the decks (about a deck's height up her, 2.7 m) [derived];
      // doubled, the two plates riveted together buckle as one of their summed thickness [bet]
      const sBk = buckle(t + td, s, 2.7, sY, opts), sBkB = buckle(t + tb, s, 2.7, sY, opts);
      // below the margin, the bottom's lapped butts [read]; above it, the topside's double-strapped butts, whose plates bear
      // on each other in compression [bet]
      const sC = bilge ? lapC(bd > 0 ? sBkB : sBk) : sBk;
      add({ name: bilge ? 'bilge' : 'side shell', kind: bilge ? 'bilge' : 'side', z: zm, dz: zb - za, A: 2 * t * L, t, s, sT: jT(J.quad), sC, tLaw: 'joint', cLaw: 'buckle', web: true, wz: zb - za });
      if (bd > 0) add({ name: 'bilge strake doubling', kind: 'bilge', z: zm, dz: zb - za, A: 2 * tb * bd, t: tb, s, sT: jT(J.quad), sC: lapC(sBkB), tLaw: 'joint', cLaw: 'buckle', web: true, wz: (zb - za) * bd / L });
      if (td > 0) add({ name: 'sheer strake doubling', kind: 'sheer', z: zm, dz: zb - za, A: 2 * td * L, t: td, s, sT: jT(J.quad), sC: sBk, tLaw: 'joint', cLaw: 'buckle', web: true, wz: zb - za });
    }
    // the keel bar, a hard corner [read: its size and that it is flat]
    add({ name: 'keel bar', kind: 'keel', z: z0, dz: 0, A: SCANT.keelBar.w * SCANT.keelBar.t, t: SCANT.keelBar.t, s, sT: jT(J.quad), sC: sY, tLaw: 'joint', cLaw: 'yield', web: false });
    // the double bottom: tank top, centre keelson, side girders. A girder's web between floors (s along her, the double
    // bottom's depth up her) buckles as a plate loaded on its short edges [derived: k = (h/s + s/h)^2 on (t/h)^2]
    const web = (t, h) => { const k = Math.pow(h / s + s / h, 2), sE = k * Math.PI * Math.PI * MAT.E / (12 * (1 - MAT.nu * MAT.nu)) * (t / h) * (t / h); return sE <= 0.5 * sY ? sE : sY * (1 - sY / (4 * sE)); };
    if (inDB) {
      const yTT = hb(zTT), tTT = (opts.tankTop || SCANT.tankTop.t) * IN;     // opts.tankTop (in): a what-if
      // its butts triple-riveted (the panel) [search summary], lapped as the bottom's [bet]: the joint limits it both ways
      add({ name: 'tank top', kind: 'tanktop', z: zTT, dz: 0, A: 2 * tTT * yTT, t: tTT, s, sT: jT(J.triple), sC: Math.min(buckle(tTT, s, gs, sY, opts), jT(J.triple)), tLaw: 'joint', cLaw: 'buckle', web: false });
      const hG = zTT - z0, tCG = SCANT.centreGirder.t * IN, tSG = SCANT.sideGirders.t * IN;
      // the margin plate: from the tank top's edge (a twentieth of its half breadth in from the shell) down to where that
      // line meets the shell of the bilge [bet: where; read: that it drops nearly vertically]
      { const yM = 0.95 * yTT; let zM = z0; while (zM < zTT && hb(zM) < yM) zM += 0.01; const hM = zTT - zM, tM = SCANT.margin.t * IN;
        if (hM > 0.05) add({ name: 'margin plate', kind: 'girder', z: zM + 0.5 * hM, dz: hM, A: 2 * tM * hM, t: tM, s, sT: jT(J.quad), sC: web(tM, hM), tLaw: 'joint', cLaw: 'buckle', web: false }); }
      if (x >= SCANT.centreGirder.x[0] && x <= SCANT.centreGirder.x[1]) add({ name: 'centre keelson', kind: 'girder', z: z0 + 0.5 * hG, dz: hG, A: tCG * hG, t: tCG, s, sT: jT(J.quad), sC: web(tCG, hG), tLaw: 'joint', cLaw: 'buckle', web: false });
      // intercostal: cut at every floor and joined to it by angles; their joints double-riveted [bet]
      for (let g = 1; g <= nSG; g++) {
        const yg = g * gs; if (yg >= yFlat) break;
        add({ name: 'side girder ' + g, kind: 'girder', z: z0 + 0.5 * hG, dz: hG, A: 2 * tSG * hG, t: tSG, s, sT: jT(J.double), sC: web(tSG, hG), tLaw: 'joint', cLaw: 'buckle', web: false });
      }
    }
    // the decks: B and C, the strength decks (in the wells C is the top); with opts.lowerDecks, D, E and F as well
    const SG = SCANT.strong, camber = (2 / 3) * 3 * IN;          // a 3 in camber on all decks (Mengot) [read]: the plating's mean rise [derived]
    const decks = ['C', 'B'].concat(opts.lowerDecks ? ['F', 'E', 'D'] : []);
    for (const d of decks) {
      const zd = deckZ(d, x);
      if (zd > zTop + 1e-6 || zd < zTT + 0.5) continue;
      if (d === 'B' && top !== 'B') continue;
      const y = hb(zd); if (!(y > 0.5)) continue;
      const wOpen = openW(d, x), uptake = OPENINGS.some(o => o.uptake && x >= o.x0 && x <= o.x1 && o.decks.indexOf(d) >= 0);
      const bW = SCANT.beamSpan, bk = (t) => buckle(t, s, bW, sY, opts);
      if (d === 'B' || d === 'C') {
        // across her from the side: the edge strake (doubled amidships), then 3/4 in to the middle, with a 1 in strake each
        // side of an uptake [read: Mengot's pattern; widths one strake, bet]; C deck the same pattern x FIT.cDeck [fitted]
        const mid = Math.abs(x) <= SG.edgeX, f = d === 'C' ? F.cDeck : 1;
        const wE = Math.min(SG.edge.w, 0.5 * y), tE = (mid ? SG.edge.t : 1.0) * IN * f;
        const wU = uptake ? Math.min(2 * SG.uptake.w, Math.max(0, 2 * (y - wE) - wOpen)) : 0, tU = SG.uptake.t * IN * f;
        const wF = Math.max(0, 2 * (y - wE) - wOpen - wU), tF = SG.field * IN * f;
        add({ name: d + ' deck edge strake', kind: 'stringer', deck: d, z: zd, dz: 0, A: 2 * wE * tE, t: tE, s, sT: jT(J.quad), sC: buckle(tE, s, wE, sY, opts), tLaw: 'joint', cLaw: 'buckle', web: false });
        if (wU > 0) add({ name: d + ' deck by the uptakes', kind: 'deck', deck: d, z: zd + camber, dz: 0, A: wU * tU, t: tU, s, sT: jT(J.quad), sC: bk(tU), tLaw: 'joint', cLaw: 'buckle', web: false });
        add({ name: d + ' deck plating', kind: 'deck', deck: d, z: zd + camber, dz: 0, A: wF * tF, t: tF, s, sT: jT(J.quad), sC: bk(tF), tLaw: 'joint', cLaw: 'buckle', web: false, open: wOpen, width: 2 * y });
      } else {
        // a what-if: a lower deck plated across at 1/2 in [bet], its joints double-riveted [bet], the uptakes through it
        const t = SCANT.lower[d] * IN, w = Math.max(0, 2 * y - openW('C', x));
        add({ name: d + ' deck', kind: 'deck', deck: d, z: zd + camber, dz: 0, A: w * t, t, s, sT: jT(J.double), sC: bk(t), tLaw: 'joint', cLaw: 'buckle', web: false });
      }
    }
    // the angle joining B deck's stringer to the sheer strake: a hard corner [read: 0.9 in; bet: 6 x 6 in]
    if (sheerX) add({ name: 'sheer strake angle', kind: 'stringer', z: zTop - 0.08, dz: 0, A: 2 * SCANT.sheerDouble.angle, t: 0.9 * IN, s, sT: jT(J.quad), sC: sY, tLaw: 'joint', cLaw: 'yield', web: false });
    return els;
  }

  // ---------------------------------------------------------------- an element's stress at a strain
  function stress(e, eps) {
    const E = MAT.E;
    if (eps >= 0) {
      const eT = e.sT / E;
      if (eps <= eT) return E * eps;
      if (e.tLaw === 'yield') return e.sT;
      const sl = e.eSlip === undefined ? EPS_SLIP : e.eSlip, dr = e.eDrop === undefined ? EPS_DROP : e.eDrop;
      const e1 = eT + sl; if (eps <= e1) return e.sT;
      const e2 = e1 + dr; if (eps >= e2) return 0;
      return e.sT * (e2 - eps) / dr;
    }
    const a = -eps, eC = e.sC / E;
    if (a <= eC) return E * eps;
    if (e.cLaw === 'yield') return -e.sC;
    return -e.sC * Math.pow(eC / a, Q_SHED);
  }
  // whether an element has passed its peak at this strain (for the order in which they fail)
  function failed(e, eps) { return eps >= 0 ? eps > e.sT / MAT.E + (e.tLaw === 'yield' ? Infinity : (e.eSlip === undefined ? EPS_SLIP : e.eSlip)) : (-eps > e.sC / MAT.E && e.cLaw !== 'yield'); }

  // ---------------------------------------------------------------- the elastic section
  function elastic(els) {
    let A = 0, Az = 0;
    for (const e of els) { A += e.A; Az += e.A * e.z; }
    const zNA = A > 0 ? Az / A : 0;
    let I = 0, zMin = Infinity, zMax = -Infinity;
    for (const e of els) { const d = e.z - zNA; I += e.A * (d * d + e.dz * e.dz / 12); if (e.z - 0.5 * e.dz < zMin) zMin = e.z - 0.5 * e.dz; if (e.z + 0.5 * e.dz > zMax) zMax = e.z + 0.5 * e.dz; }
    let zDeck = zMax; for (const e of els) if (e.kind === 'deck' || e.kind === 'stringer') zDeck = Math.max(zDeck, e.z);
    return { A, zNA, I, zMin, zMax, zDeck, Zdeck: I / (zDeck - zNA), Zkeel: I / (zNA - zMin) };
  }

  // ---------------------------------------------------------------- Smith's method
  // the net force on the section for curvature k (1/m, hogging positive) about a neutral axis at height zn
  function netForce(els, k, zn) { let F = 0; for (let i = 0; i < els.length; i++) { const e = els[i]; F += e.A * stress(e, k * (e.z - zn)); } return F; }
  function momentOf(els, k, zn) { let M = 0; for (let i = 0; i < els.length; i++) { const e = els[i]; M += e.A * stress(e, k * (e.z - zn)) * (e.z - zn); } return M; }
  // the neutral axis for curvature k, near z0: the nearest root of the net force from z0 in the direction its sign
  // points, bracketed and refined (the Illinois form of false position, then bisection to the last bit that matters)
  function findNA(els, k, z0, lo, hi) {
    const f = (z) => netForce(els, k, z);
    const f0 = f(z0);
    if (f0 === 0) return z0;
    // F falls with zn in hogging (k > 0) and rises in sagging: step the way that brings it toward nothing
    const dir = (f0 > 0) === (k > 0) ? 1 : -1;
    let a = z0, fa = f0, step = 0.02, b = z0, fb = f0;
    for (let it = 0; it < 60; it++) {
      b = a + dir * step;
      if (b > hi) b = hi; if (b < lo) b = lo;
      fb = f(b);
      if (fb === 0) return b;
      if ((fb > 0) !== (fa > 0)) break;
      if (b === hi || b === lo) return b;          // no root inside: the section has nothing left in one sense
      a = b; fa = fb; step *= 1.6;
    }
    if ((fb > 0) === (fa > 0)) return b;
    // Illinois false position, then bisection
    let side = 0;
    for (let it = 0; it < 60; it++) {
      const c = (a * fb - b * fa) / (fb - fa), fc = f(c);
      if (fc === 0 || Math.abs(b - a) < 1e-7) return c;
      if ((fc > 0) === (fb > 0)) { b = c; fb = fc; if (side === -1) fa *= 0.5; side = -1; }
      else { a = c; fa = fc; if (side === 1) fb *= 0.5; side = 1; }
    }
    return 0.5 * (a + b);
  }
  // Smith's curve. sense 'hog' or 'sag'; opts: { kMax: in yield curvatures (default 6), steps (default 120), stopAfter:
  // stop once the moment has fallen to this share of its peak after the peak (default: run to kMax), refine (default 8:
  // sub-steps between the two coarse steps either side of the peak) }
  function collapse(els, sense, opts) {
    opts = opts || {};
    const sg = sense === 'sag' ? -1 : 1, el = elastic(els);
    if (!(el.A > 0)) return null;
    const lo = el.zMin - 0.01, hi = el.zMax + 0.01;
    const ky = MAT.sY / (MAT.E * Math.max(el.zMax - el.zNA, el.zNA - el.zMin));
    const kMax = (opts.kMax || 6) * ky, n = opts.steps || 120;
    const K = [0], Mx = [0], Z = [el.zNA];
    let z = el.zNA, peak = 0, ip = 0;
    for (let i = 1; i <= n; i++) {
      const k = sg * kMax * i / n;
      z = findNA(els, k, z, lo, hi);
      const M = sg * momentOf(els, k, z);         // a magnitude in the sense asked
      K.push(Math.abs(k)); Mx.push(M); Z.push(z);
      if (M > peak) { peak = M; ip = i; }
      if (opts.stopAfter && ip > 0 && i > ip + 2 && M < opts.stopAfter * peak) break;
    }
    // refine about the peak: between the coarse steps either side of it, on its own continuation
    let Mu = peak, kU = K[ip], zU = Z[ip];
    const r = opts.refine === undefined ? 8 : opts.refine;
    if (r > 0 && ip > 0 && ip < K.length - 1) {
      let zr = Z[ip - 1];
      for (let j = 1; j < 2 * r; j++) {
        const k = K[ip - 1] + (K[ip + 1] - K[ip - 1]) * j / (2 * r);
        zr = findNA(els, sg * k, zr, lo, hi);
        const M = sg * momentOf(els, sg * k, zr);
        if (M > Mu) { Mu = M; kU = k; zU = zr; }
      }
    }
    // which elements have failed at the peak, and the first to fail on the way up
    let first = null;
    for (let i = 1; i < K.length && !first; i++) for (const e of els) if (failed(e, sg * K[i] * (e.z - Z[i]))) { first = { name: e.name, kind: e.kind, z: e.z, k: K[i], tension: sg * (e.z - Z[i]) > 0 }; break; }
    const gone = els.filter(e => failed(e, sg * kU * (e.z - zU))).map(e => e.name);
    return { sense: sense === 'sag' ? 'sag' : 'hog', k: Float64Array.from(K), M: Float64Array.from(Mx), zNA: Float64Array.from(Z), Mu, kU, zU, iU: ip, ky, first, gone, el };
  }

  // ---------------------------------------------------------------- the shear the side shell carries
  // Vu: every web element (the side shell and its doubling) at the least of the plate's shear yield (sY / sqrt 3), its
  // seams' (the joint's efficiency on Paik's base, in shear as in tension [bet]) and its elastic buckling between frames
  // (k_s = 5.34 + 4 (s/h)^2, h a deck's height, 2.7 m), corrected for plasticity; times its vertical extent [derived: the
  // plastic shear of the webs, as rules take it]
  // opts as elements(): scale multiplies the result (every strength), sY and eta replace the yield and the joints
  function webShear(e, opts) {                     // one web element's share of Vu, both sides (N); 0 for any other
    if (!e.web) return 0;
    opts = opts || {};
    const sY = opts.sY || MAT.sY, eta = Object.assign({}, JOINT, opts.eta || {}).quad, tY = sY / Math.sqrt(3), tJ = eta * MAT.base / Math.sqrt(3);
    const ks = 5.34 + 4 * (e.s / 2.7) * (e.s / 2.7), tE = ks * Math.PI * Math.PI * MAT.E / (12 * (1 - MAT.nu * MAT.nu)) * (e.t / e.s) * (e.t / e.s);
    const tB = tE <= 0.5 * tY ? tE : tY * (1 - tY / (4 * tE));
    return Math.min(tY, tJ, tB) * e.t * 2 * e.wz * (opts.scale || 1);
  }
  function shear(els, opts) { let V = 0; for (const e of els) V += webShear(e, opts); return V; }

  // ---------------------------------------------------------------- along her, cached by ship
  const CACHE = new WeakMap();
  const NOSHIP = {};
  function cacheFor(ship, opts) {
    const s = ship || NOSHIP;
    let m = CACHE.get(s); if (!m) { m = new Map(); CACHE.set(s, m); }
    const key = JSON.stringify(opts || {});
    let c = m.get(key); if (!c) { c = new Map(); m.set(key, c); }
    return c;
  }
  function where(x) {
    for (const b of C.BULKHEADS) if (Math.abs(x - b.x) < 0.05) return 'bulkhead ' + b.id;
    const n = C.ZONES[C.zoneAt(x)].name;
    return n.charAt(0) === 'N' ? n : n.charAt(0).toLowerCase() + n.slice(1);
  }
  function at(ship, x, opts) {
    const c = cacheFor(ship, opts), key = x.toFixed(6);
    let r = c.get(key); if (r) return r;
    const els = elements(ship, x, opts);
    if (!els.length) r = { x, where: where(x), none: true, hog: null, sag: null, Vu: 0, el: null, n: 0 };
    else {
      const o = { stopAfter: 0.8 };
      const hog = collapse(els, 'hog', o), sag = collapse(els, 'sag', o);
      r = { x, where: where(x), none: false, el: hog.el, n: els.length, Vu: shear(els, opts),
        hog: { Mu: hog.Mu, kU: hog.kU, zU: hog.zU, ky: hog.ky, first: hog.first, gone: hog.gone },
        sag: { Mu: sag.Mu, kU: sag.kU, zU: sag.zU, ky: sag.ky, first: sag.first, gone: sag.gone } };
    }
    c.set(key, r);
    return r;
  }
  function along(ship, xs, opts) {
    const n = xs.length, out = { x: Float64Array.from(xs), hog: new Float64Array(n), sag: new Float64Array(n), Vu: new Float64Array(n), at: [] };
    for (let i = 0; i < n; i++) { const r = at(ship, xs[i], opts); out.at.push(r); out.hog[i] = r.none ? 0 : r.hog.Mu; out.sag[i] = r.none ? 0 : r.sag.Mu; out.Vu[i] = r.Vu; }
    return out;
  }
  // ---------------------------------------------------------------- the hinge: stage B4's law, from B1's falling branch
  // From the onset the section at x becomes a hinge. The two parts either side of it turn about it by theta (rad),
  // positive as the side that failed opens (the deck in hogging, the bottom in sagging), about her own y axis through
  // (x, zNA). The turning is spread over a hinge length Lh, so the section's curvature is kU + theta / Lh, and the moment
  // the joint still carries is Smith's there: Mu at theta 0, then the falling branch. At each theta:
  //   M, dM    the joint's moment (N m) and its slope dM/dtheta (N m per rad; central differences on the grid; at() gives
  //            the slope of the segment theta falls in)
  //   c        the share of the section's steel torn (parted in tension): the tear's state. It reaches cTop at thetaTop,
  //            when everything on the opening side has parted; the rest, the ligament, goes only at the release, which
  //            is the free body's (c is 1 from then)
  //   cPast    the share past its peak, torn or buckled
  //   W        the work the steel has taken since the onset (J), the integral of M over theta: the tear's energy; its
  //            rate is the tear's power
  //   zNA      the height the parts turn about (m)
  //   Nt, Vs   the ligament still holding (N): the tension the elements not yet parted can carry, each at its joint's
  //            strength (a buckled plate pulled straight again carries its joint's [bet]); and the shear its webs can
  //            carry, by whichever path is the stronger: the side shell's strakes not yet parted (B2's Vu at theta 0),
  //            or, once the side is torn, the double bottom's own webs (the centre keelson, the side girders, the margin
  //            plates: each at the least of its shear yield, its joint's strength over sqrt 3 and its buckling between
  //            floors) [bet: the stronger path carries it all]. THE RELEASE RULE (the free body's, each step): the joint
  //            carries the moment min(its demand, M(theta)), and lets go at the first step where the force across it
  //            passes the ligament: its tension (along her) above Nt, or its shear above Vs.
  //   open     the tear's opening to the sea in each of the core's four spaces at x, in the core's node order: port
  //            below E deck, port above, starboard below, starboard above (m2). Each parted strip of shell opens by its
  //            length round the girth times the gap its stretching past parting leaves over the hinge, Lh (eps -
  //            eps_parted) [derived], half to each side; a strip is placed by its centre's height against E deck's.
  //            Past the curve's end the parts turn on as rigid bodies about the hinge's height, and each torn strip's
  //            gap grows by its height above it times the further angle [derived]. Decks that part open spaces to each
  //            other, not to the sea, and are not counted here.
  //   span     the tear's height range in each of those four spaces: [bottom, top] (m above the keel) over the strips
  //            of shell parted so far that open there, clipped to the space's side of E deck; null where none has. The
  //            exchange of water and air through a tear wants its top and bottom [derived].
  //   ku       the joint's slope on unloading (N m per rad): E I / Lh of what still holds, every element not yet parted,
  //            about its own centroid [bet: unloading elastic at E, a buckled plate's too, as Smith's method takes it].
  //            Past the tear's top the joint's moment is mostly the ligament bending elastically, so when its demand
  //            falls the joint springs back down this line, and on reloading goes up it to the curve again: the torn
  //            part never mends, the ligament does not stay bent. k0 (one number) is the intact section's E I / Lh,
  //            the joint's slope before it yields.
  //   zU, unload  the joint unloading: the parts turn back about zU, the centroid of what still holds (m above the
  //            keel). unload(thetaMax, theta) is the joint on its unloading line from thetaMax back to theta: the moment
  //            M(thetaMax) - ku (thetaMax - theta) (below zero, the ligament bent back the other way), and each space's
  //            opening, every torn strip's gap closing by its height above zU times the springback, none below contact
  //            [derived]; at unloading's start it is at(thetaMax). at(theta).closeRate is that closing's first rate, by
  //            space (m2 per rad of springback), over the strips not at contact.
  // Lh: the hinge's length, about the girder's depth, 20 m (BRAINSTORM v2, 5.6 item 5: "the usual rule") [bet]; its
  // what-ifs a web frame's spacing in the boiler rooms (9 ft) and a frame's (36 in): tools/strength_tests.js prints them.
  // opts as elements(), and { Lh (m), kMax (curvature's end, in yield curvatures: default 10), steps (default 400) }
  const HINGE_LH = 20;
  const HINGES = new WeakMap();
  function hinge(ship, x, sense, opts) {
    opts = opts || {};
    const s0 = ship || NOSHIP; let m = HINGES.get(s0); if (!m) { m = new Map(); HINGES.set(s0, m); }
    const key = x.toFixed(6) + '|' + sense + '|' + JSON.stringify(opts);
    if (m.has(key)) return m.get(key);
    const eo = Object.assign({}, opts); delete eo.Lh; delete eo.kMax; delete eo.steps;
    const els = elements(ship, x, eo);
    if (!els.length) { m.set(key, null); return null; }
    const Lh = opts.Lh || HINGE_LH, sg = sense === 'sag' ? -1 : 1;
    const cv = collapse(els, sense, { kMax: opts.kMax || 10, steps: opts.steps || 400 });
    // the falling branch from the peak: (kU, Mu, zU), then every step of the curve beyond it
    const K = [cv.kU], Mv = [cv.Mu], Z = [cv.zU];
    for (let i = 0; i < cv.k.length; i++) if (cv.k[i] > cv.kU * (1 + 1e-12)) { K.push(cv.k[i]); Mv.push(cv.M[i]); Z.push(cv.zNA[i]); }
    const n = K.length, A0 = els.reduce((t, e) => t + e.A, 0), zE = C.deckZ('E', x);
    const theta = new Float64Array(n), M = Float64Array.from(Mv), zNA = Float64Array.from(Z);
    const c = new Float64Array(n), cPast = new Float64Array(n), W = new Float64Array(n), Nt = new Float64Array(n), Vs = new Float64Array(n), open = new Float64Array(4 * n);
    const ku = new Float64Array(n), span = new Float64Array(8 * n).fill(NaN), k0 = MAT.E * elastic(els).I / Lh;
    const parted = new Uint8Array(els.length), past = new Uint8Array(els.length);
    const shell = (e) => e.kind === 'side' || e.kind === 'bilge' || e.kind === 'bottom' || e.kind === 'sheer';
    // the strips of shell, each one's gap at each point of the curve (m; as open sums them), and the centroid of what holds
    const sIdx = [], sOf = new Int32Array(els.length).fill(-1);
    for (let j = 0; j < els.length; j++) if (shell(els[j]) && els[j].t > 0) { sOf[j] = sIdx.length; sIdx.push(j); }
    const nS = sIdx.length, gapS = new Float64Array(nS * n), zU = new Float64Array(n);
    // a double-bottom web's shear (N): the least of shear yield, its joint's strength over sqrt 3, and its buckling as a
    // panel between floors (s along her, its own depth up her) [derived as webShear's]
    const sYh = (eo.sY || MAT.sY) * (eo.scale || 1);
    const dbShear = (e) => {
      const tY = sYh / Math.sqrt(3), tJ = e.sT / Math.sqrt(3), h = e.dz > 0 ? e.dz : 1;
      const ks = 5.34 + 4 * Math.pow(Math.min(e.s, h) / Math.max(e.s, h), 2), b = Math.min(e.s, h);
      const tE = ks * Math.PI * Math.PI * MAT.E / (12 * (1 - MAT.nu * MAT.nu)) * (e.t / b) * (e.t / b) * (eo.scale || 1);
      const tB = tE <= 0.5 * tY ? tE : tY * (1 - tY / (4 * tE));
      return Math.min(tY, tJ, tB) * e.A;
    };
    for (let i = 0; i < n; i++) {
      theta[i] = (K[i] - cv.kU) * Lh;
      let aParted = 0, aPast = 0, nt = 0, vSide = 0, vBottom = 0;
      for (let j = 0; j < els.length; j++) {
        const e = els[j], eps = sg * K[i] * (e.z - Z[i]), ePart = e.sT / MAT.E + (e.eSlip === undefined ? EPS_SLIP : e.eSlip) + (e.eDrop === undefined ? EPS_DROP : e.eDrop);
        if (e.tLaw !== 'yield' && eps >= ePart) parted[j] = 1;           // once parted, parted for good
        if (failed(e, eps)) past[j] = 1;
        if (parted[j]) {
          aParted += e.A;
          if (shell(e) && e.t > 0) {                                     // the gap it leaves, round its girth, each side
            const gap = Math.max(0, Lh * (eps - ePart)), side = e.A / (2 * e.t) * gap, layer = e.z < zE ? 0 : 1;
            open[4 * i + layer] += side; open[4 * i + 2 + layer] += side; gapS[sOf[j] * n + i] = gap;
          }
        } else { nt += e.A * e.sT; vSide += webShear(e, eo); if (e.kind === 'girder') vBottom += dbShear(e); }
        if (past[j] || parted[j]) aPast += e.A;
      }
      c[i] = aParted / A0; cPast[i] = aPast / A0; Nt[i] = nt; Vs[i] = Math.max(vSide, vBottom);
      // what still holds, for the joint's slope on unloading; and each space's tear by height, over every strip parted so far
      const hold = []; for (let j = 0; j < els.length; j++) if (!parted[j]) hold.push(els[j]);
      const eh = hold.length ? elastic(hold) : null;
      ku[i] = eh ? MAT.E * eh.I / Lh : 0; zU[i] = eh ? eh.zNA : Z[i];
      for (let j = 0; j < els.length; j++) {
        const e = els[j]; if (!parted[j] || !shell(e) || !(e.t > 0)) continue;
        const up = e.z >= zE, lo = up ? Math.max(zE, e.z - 0.5 * e.dz) : e.z - 0.5 * e.dz, hi = up ? e.z + 0.5 * e.dz : Math.min(zE, e.z + 0.5 * e.dz);
        for (const q of up ? [1, 3] : [0, 2]) { const a = 8 * i + 2 * q; if (!(span[a] <= lo)) span[a] = lo; if (!(span[a + 1] >= hi)) span[a + 1] = hi; }
      }
      if (i > 0) { W[i] = W[i - 1] + 0.5 * (M[i] + M[i - 1]) * (theta[i] - theta[i - 1]); for (let q = 0; q < 4; q++) open[4 * i + q] = Math.max(open[4 * i + q], open[4 * (i - 1) + q]); }
    }
    const dM = new Float64Array(n);
    for (let i = 0; i < n; i++) { const a = i > 0 ? i - 1 : 0, b = i < n - 1 ? i + 1 : n - 1; dM[i] = b > a ? (M[b] - M[a]) / (theta[b] - theta[a]) : 0; }
    let iTop = 0; for (let i = 1; i < n; i++) if (c[i] > c[iTop] + 1e-12) iTop = i;
    let rise = 0; for (let i = 1; i < n; i++) rise = Math.max(rise, M[i] - M[i - 1]);
    // past the curve's end: the rate at which each space's opening grows with the angle (m2 per rad), the torn strips
    // turning as rigid parts about the hinge's last height
    const openRate = [0, 0, 0, 0], zEnd = zNA[n - 1];
    for (let j = 0; j < els.length; j++) {
      const e = els[j]; if (!parted[j] || !shell(e) || !(e.t > 0)) continue;
      const arm = Math.max(0, sg * (e.z - zEnd)), side = e.A / (2 * e.t) * arm, layer = e.z < zE ? 0 : 1;
      openRate[layer] += side; openRate[2 + layer] += side;
    }
    const thEnd = theta[n - 1];
    // where theta falls on the curve: the point at or below it, the next, the share between, and the angle past the end
    const place = (th) => {
      let i = 0;
      if (th >= thEnd) i = n - 1; else if (th > 0) { let lo = 0, hi = n - 1; while (hi - lo > 1) { const md = (lo + hi) >> 1; if (theta[md] <= th) lo = md; else hi = md; } i = lo; }
      const j = Math.min(n - 1, i + 1), f = j > i ? Math.min(1, Math.max(0, (th - theta[i]) / (theta[j] - theta[i]))) : 0;
      return { i, j, f, past: th > thEnd ? th - thEnd : 0 };
    };
    // a torn strip's gap there (m), as open sums it, the parts turning as rigid bodies past the curve's end
    const gapAt = (s, p) => { const j = sIdx[s], b = s * n; return gapS[b + p.i] + (gapS[b + p.j] - gapS[b + p.i]) * p.f + (parted[j] ? Math.max(0, sg * (els[j].z - zEnd)) * p.past : 0); };
    // the tear's closing on unloading, by space (m2 per rad of springback): each torn strip not at contact, its girth
    // times its height above the centroid of what holds
    const closeAt = (p) => {
      const zp = zU[p.i] + (zU[p.j] - zU[p.i]) * p.f, out = [0, 0, 0, 0];
      for (let s = 0; s < nS; s++) {
        const e = els[sIdx[s]]; if (!(gapAt(s, p) > 0)) continue;
        const rate = e.A / (2 * e.t) * Math.max(0, sg * (e.z - zp)), layer = e.z < zE ? 0 : 1; out[layer] += rate; out[2 + layer] += rate;
      }
      return out;
    };
    const atTheta = (th) => {
      const p = place(th), i = p.i, j = p.j, f = p.f, past = p.past, L = (a) => a[i] + (a[j] - a[i]) * f;
      return { theta: th, M: L(M), dM: j > i ? (M[j] - M[i]) / (theta[j] - theta[i]) : 0, c: L(c), cPast: L(cPast), W: L(W) + M[n - 1] * past, zNA: L(zNA), Nt: L(Nt), Vs: L(Vs),
        open: [0, 1, 2, 3].map(q => open[4 * i + q] + (open[4 * j + q] - open[4 * i + q]) * f + openRate[q] * past), beyond: past > 0,
        ku: L(ku), span: [0, 1, 2, 3].map(q => { const a = 8 * i + 2 * q; return span[a] === span[a] ? [span[a], span[a + 1]] : null; }),
        zU: L(zU), closeRate: closeAt(p) };
    };
    // the joint on its unloading line, from thetaMax back to theta (see zU, unload above)
    const unload = (thMax, th) => {
      const p = place(thMax), a = atTheta(thMax), d = Math.max(0, thMax - th), op = a.open.slice();
      for (let s = 0; s < nS; s++) {
        const e = els[sIdx[s]], g = gapAt(s, p), arm = Math.max(0, sg * (e.z - a.zU)); if (!(g > 0) || !(arm > 0)) continue;
        const shut = e.A / (2 * e.t) * Math.min(g, arm * d), layer = e.z < zE ? 0 : 1;
        op[layer] -= shut; op[2 + layer] -= shut;
      }
      return { theta: thMax - d, thetaMax: thMax, M: a.M - a.ku * d, open: op.map(v => Math.max(0, v)) };
    };
    // the moment capacity under shear (B1+B2, 2026-11-24, for B4's consistency with the onset): the onset's own circle,
    // (M/Mu)^2 + (V/Vu)^2 = 1 (core/readers/onset.js), with the ligament's own Vs(s) for Vu. Vs at s = 0 is the
    // section's Vu, the onset's, so a joint that yields at Mu under(0, V) yields where the onset fired. The factor on the
    // moment capacity at the backbone's abscissa s: sqrt(1 - (V/Vs(s))^2), 0 once |V| reaches Vs(s). Nothing calls it by
    // default (the fall's hinge law takes it behind its own switch), so it moves no bit
    // (a ligament with no shear left, Vs(s) 0, holds no moment under any shear and its full moment under none: no 0/0)
    // A third argument, the joint's own moment about her z at a list (Z1's hinge.yieldOn 'resultant', D116), takes the
    // onset's biaxial check as it stands: her lateral capacity taken as her vertical, so Mz is set against Mu.
    // sqrt(1 - (V/Vs(s))^2 - (Mz/Mu)^2), 0 past it. A fourth argument, Muz, is for a lateral capacity once one is
    // computed (e124: bracketed 5.15 to 9.50 GN m at x -10.93 against Mu 4.939). With two arguments it is the shear
    // circle alone, to the bit.
    const under = (s, V, Mz, Muz) => {
      const vs = atTheta(s).Vs, u = vs > 0 ? Math.abs(V) / vs : (V ? Infinity : 0), w = Mz ? Math.abs(Mz) / (Muz || cv.Mu) : 0, q = 1 - u * u - w * w;
      return u >= 1 || !(q > 0) ? 0 : Math.sqrt(q);
    };
    const r = { x, where: where(x), sense: cv.sense, Lh, Mu: cv.Mu, kU: cv.kU, ky: cv.ky, theta, M, dM, c, cPast, W, zNA, Nt, Vs, open, openRate, k0, ku, span, zU, unload, under,
      thetaTop: theta[iTop], cTop: c[iTop], thetaEnd: thEnd, rise, monotone: rise <= 1e-6 * cv.Mu, at: atTheta, n };
    m.set(key, r);
    return r;
  }

  const CURVES = new WeakMap();
  function curve(ship, x, sense, opts) {
    const s = ship || NOSHIP; let m = CURVES.get(s); if (!m) { m = new Map(); CURVES.set(s, m); }
    const key = x.toFixed(6) + '|' + sense + '|' + JSON.stringify(opts || {});
    let r = m.get(key); if (r) return r;
    const els = elements(ship, x, opts);
    r = els.length ? collapse(els, sense, { kMax: (opts && opts.kMax) || 6, steps: (opts && opts.steps) || 180 }) : null;
    m.set(key, r);
    return r;
  }

  return { MAT, JOINT, SCANT, FIT, OPENINGS, SIDE_T, BOTTOM_T, STRAKE, EPS_SLIP, EPS_DROP, Q_SHED, HINGE_LH,
    frameAt, strengthDeck, buckle, elements, stress, failed, elastic, collapse, shear, webShear, at, along, curve, hinge, where };
});

/*
 * Z6's spaces: a falling piece's share of the core's 64 spaces, and the water and the air in each at any attitude
 * (milestone 2 of docs/DESIGN_free_body_air_by_space_v1_3_2026-11-20.md, section 1; v1 and v1.1 beside it).
 *
 * Each space is its own column segments, as the core builds them (buildShip: nodeStart, nodeCount, entCol, entA, entE;
 * a column cols.dx by cols.dy in plan, its segment from entA to entE up her), each segment a box in her frame, cut by
 * length at the piece's ends. Nothing else is tabled.
 *
 * The part of a box below a level plane is exact in closed form (e83's rule: its volume, its free surface's area and
 * its three first moments; docs/research/experiments/e83_z6_box_moments_lib.js, its derivation and its 705 cases
 * there). So in a space holding W m3:
 *   - the level that holds W is solved by Newton on the boxes, from the last level, inside the space's own bracket;
 *   - the water's centroid is the boxes' moments over W;
 *   - the air's is the space's own centroid less the water's, by moments: exact, and above the free surface.
 * At small angles the rule gives the core's own centre-line volumes (a prism cut through its sides only).
 *
 * A library of the fall (core/readers/fall.js): it reads the ship and registers nothing with the night. It also holds
 * the exchange through one opening (e84's laws P and X: `flow.exchange`) and one space's air pressure taken implicitly
 * (`flow.stepSpace`), ported so that they call no engine transcendental. Milestone 2's later parts build on them: each
 * piece's openings, its spaces' water and air stepped, and the failures.
 *
 * It calls no Math.sin or Math.cos (E1).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TitanicSpaces = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ================================================================ e83's box rule
  // boxMoments(w, g, s, out): the part R = { t : |t_k| <= w_k, g.t <= s } of a box centred at the origin, in its own
  // axes, below the plane g.t = s (|g| = 1; any signs, zeros allowed): out.V = vol(R), out.A = dV/ds, out.M[k] = the
  // integral over R of t_k. Copied from e83's library, unchanged but for its names' scope.
  let c1 = 0, c2 = 0, h = 0, bmin = 0;
  let rV = 0, rA = 0, rI = 0;
  function fR(r) {
    const a = r < 0 ? -r : r;
    if (a <= c1) return h;
    if (a >= c2) return 0;
    let p = (c2 - a) / (2 * bmin);
    if (p > 1) p = 1;
    return h * p;
  }
  function FR(r) {
    if (r <= -c2) return 0;
    if (r >= c2) return 1;
    if (r < -c1) {
      let p = (r + c2) / (2 * bmin);
      if (p > 1) p = 1;
      return h * bmin * p * p;
    }
    if (r <= c1) return h * (bmin + (r + c1));
    let p = (c2 - r) / (2 * bmin);
    if (p > 1) p = 1;
    return 1 - h * bmin * p * p;
  }
  function pieces(bk, bi, bj, s, full) {
    const bmax = bi > bj ? bi : bj;
    if (bmax <= 1e-150 * bk) {
      const y = s / bk;
      if (y >= 1) { rI = 0; rA = 0; rV = 1; return; }
      if (y <= -1) { rI = 0; rA = 0; rV = 0; return; }
      rI = (1 - y * y) / bk;
      rA = 0.5 / bk;
      rV = 0.5 * (y + 1);
      return;
    }
    bmin = bi > bj ? bj : bi;
    c1 = bmax - bmin;
    c2 = bmax + bmin;
    h = 0.5 / bmax;
    let sI = 0, sA = 0, sV = 0;
    for (let j = 0; j < 3; j++) {
      const p = j === 0 ? -c2 : (j === 1 ? -c1 : c1);
      const q = j === 0 ? -c1 : (j === 1 ? c1 : c2);
      if (!(q > p)) continue;
      const zp = p - s, zq = q - s;
      if (zq <= -bk || zp >= bk) continue;
      const lo = zp < -bk, hi = zq > bk;
      const dz = lo ? (hi ? 2 * bk : zq + bk) : (hi ? bk - zp : q - p);
      if (!(dz > 0)) continue;
      const ra = lo ? s - bk : p, rb = hi ? s + bk : q;
      const ya = lo ? 1 : -zp / bk, yb = hi ? -1 : -zq / bk;
      const fa = lo ? fR(ra) : (j === 0 ? 0 : h);
      const fb = hi ? fR(rb) : (j === 2 ? 0 : h);
      const fm = 0.5 * (fa + fb);
      const ym = 0.5 * (ya + yb);
      let ka = 1 - ya * ya, kb = 1 - yb * yb, km = 1 - ym * ym;
      if (ka < 0) ka = 0;
      if (kb < 0) kb = 0;
      if (km < 0) km = 0;
      sI += dz * (ka * fa + 4 * km * fm + kb * fb);
      if (full) {
        sA += dz * fm;
        sV += dz * (FR(ra) + 4 * FR(0.5 * (ra + rb)) + FR(rb));
      }
    }
    rI = sI / (6 * bk);
    if (full) {
      const zp = c2 - s;
      let tail = 0;
      if (zp < bk) tail = zp < -bk ? 2 * bk : bk - zp;
      let v = (sV / 6 + tail) / (2 * bk);
      if (v > 1) v = 1;
      rV = v;
      rA = sA / (2 * bk);
    }
  }
  function boxMoments(w, g, s, out) {
    const w1 = w[0], w2 = w[1], w3 = w[2];
    const g1 = g[0], g2 = g[1], g3 = g[2];
    const b1 = w1 * (g1 < 0 ? -g1 : g1);
    const b2 = w2 * (g2 < 0 ? -g2 : g2);
    const b3 = w3 * (g3 < 0 ? -g3 : g3);
    const B = b1 + b2 + b3;
    const Vbox = 8 * w1 * w2 * w3;
    const M = out.M;
    M[0] = 0; M[1] = 0; M[2] = 0;
    out.A = 0;
    if (s >= B) { out.V = Vbox; return out; }
    if (s <= -B) { out.V = 0; return out; }
    const q = -0.25 * Vbox;
    if (b1 >= b2 && b1 >= b3) {
      pieces(b1, b2, b3, s, true);
      out.V = Vbox * rV; out.A = Vbox * rA; M[0] = q * w1 * w1 * g1 * rI;
      if (b2 > 0) { pieces(b2, b1, b3, s, false); M[1] = q * w2 * w2 * g2 * rI; }
      if (b3 > 0) { pieces(b3, b1, b2, s, false); M[2] = q * w3 * w3 * g3 * rI; }
    } else if (b2 >= b3) {
      pieces(b2, b1, b3, s, true);
      out.V = Vbox * rV; out.A = Vbox * rA; M[1] = q * w2 * w2 * g2 * rI;
      if (b1 > 0) { pieces(b1, b2, b3, s, false); M[0] = q * w1 * w1 * g1 * rI; }
      if (b3 > 0) { pieces(b3, b1, b2, s, false); M[2] = q * w3 * w3 * g3 * rI; }
    } else {
      pieces(b3, b1, b2, s, true);
      out.V = Vbox * rV; out.A = Vbox * rA; M[2] = q * w3 * w3 * g3 * rI;
      if (b1 > 0) { pieces(b1, b2, b3, s, false); M[0] = q * w1 * w1 * g1 * rI; }
      if (b2 > 0) { pieces(b2, b1, b3, s, false); M[1] = q * w2 * w2 * g2 * rI; }
    }
    return out;
  }

  // ================================================================ a piece's spaces
  // spacesOf(ship, x0, x1): the spaces of the piece between x0 and x1 (her frame), each the core's node n with its
  // permeability mu, its room V (m3, mu counted), its own centroid, and its boxes: centres (bx, by, bz) and half widths
  // (wx, wy, wz). A column's segment that a cut crosses keeps the part inside, by length; a space with no box left out
  function spacesOf(ship, x0, x1) {
    const c = ship.cols, NN = ship.nodeMu.length, dy = c.dy;
    const bx = [], by = [], bz = [], wx = [], wy = [], wz = [];
    const node = [], start = [], count = [], mu = [], V = [], cx = [], cy = [], cz = [];
    for (let n = 0; n < NN; n++) {
      const s0 = bx.length, m = ship.nodeMu[n];
      let v = 0, mx = 0, my = 0, mz = 0;
      for (let j = ship.nodeStart[n], j1 = j + ship.nodeCount[n]; j < j1; j++) {
        const i = ship.entCol[j], a = ship.entA[j], b = ship.entE[j];
        if (!(b > a)) continue;
        const lo = Math.max(x0, c.x[i] - 0.5 * c.dx[i]), hi = Math.min(x1, c.x[i] + 0.5 * c.dx[i]);
        if (!(hi - lo > 1e-9)) continue;
        const xm = 0.5 * (lo + hi), hx = 0.5 * (hi - lo), hz = 0.5 * (b - a), zm = 0.5 * (a + b);
        bx.push(xm); by.push(c.y[i]); bz.push(zm); wx.push(hx); wy.push(0.5 * dy); wz.push(hz);
        const vb = m * 8 * hx * (0.5 * dy) * hz;
        v += vb; mx += vb * xm; my += vb * c.y[i]; mz += vb * zm;
      }
      if (bx.length > s0 && v > 0) { node.push(n); start.push(s0); count.push(bx.length - s0); mu.push(m); V.push(v); cx.push(mx / v); cy.push(my / v); cz.push(mz / v); }
    }
    const A = (a) => Float64Array.from(a);
    return { n: node.length, node: Int32Array.from(node), start: Int32Array.from(start), count: Int32Array.from(count), mu: A(mu), V: A(V), cx: A(cx), cy: A(cy), cz: A(cz),
      bx: A(bx), by: A(by), bz: A(bz), wx: A(wx), wy: A(wy), wz: A(wz) };
  }

  // ================================================================ the water in a space at any attitude
  // u: the world's up in her frame (unit: R^T z, R taking her frame to the world); zr: the world height of her frame's
  // origin. below() fills out with the room below the world level h in space k (V, mu counted), its free surface's
  // area along the vertical (A = dV/dh) and its first moments about her frame's origin (mx, my, mz)
  const W3 = new Float64Array(3), BOX = { V: 0, A: 0, M: new Float64Array(3) };
  function below(sp, k, u, zr, h, out) {
    const m = sp.mu[k];
    let V = 0, A = 0, mx = 0, my = 0, mz = 0;
    for (let q = sp.start[k], q1 = q + sp.count[k]; q < q1; q++) {
      W3[0] = sp.wx[q]; W3[1] = sp.wy[q]; W3[2] = sp.wz[q];
      const s = h - zr - (u[0] * sp.bx[q] + u[1] * sp.by[q] + u[2] * sp.bz[q]);
      boxMoments(W3, u, s, BOX);
      if (BOX.V === 0) continue;
      V += m * BOX.V; A += m * BOX.A;
      mx += m * (BOX.V * sp.bx[q] + BOX.M[0]); my += m * (BOX.V * sp.by[q] + BOX.M[1]); mz += m * (BOX.V * sp.bz[q] + BOX.M[2]);
    }
    out.V = V; out.A = A; out.mx = mx; out.my = my; out.mz = mz;
    return out;
  }
  // the space's lowest and highest world heights at this attitude: the bracket of its level
  function bracket(sp, k, u, zr, out) {
    let lo = Infinity, hi = -Infinity;
    const au0 = u[0] < 0 ? -u[0] : u[0], au1 = u[1] < 0 ? -u[1] : u[1], au2 = u[2] < 0 ? -u[2] : u[2];
    for (let q = sp.start[k], q1 = q + sp.count[k]; q < q1; q++) {
      const zc = zr + u[0] * sp.bx[q] + u[1] * sp.by[q] + u[2] * sp.bz[q], e = au0 * sp.wx[q] + au1 * sp.wy[q] + au2 * sp.wz[q];
      if (zc - e < lo) lo = zc - e;
      if (zc + e > hi) hi = zc + e;
    }
    out[0] = lo; out[1] = hi;
    return out;
  }
  // water(sp, k, u, zr, W, h0, out): the world level that holds W m3 in space k (Newton from h0, kept inside the
  // space's bracket; to 1e-12 of its room), and the water's and the air's centroids in her frame
  const BR = new Float64Array(2), WB = { V: 0, A: 0, mx: 0, my: 0, mz: 0 };
  function water(sp, k, u, zr, W, h0, out) {
    const Vk = sp.V[k];
    bracket(sp, k, u, zr, BR);
    let lo = BR[0], hi = BR[1], lev, it = 0;
    if (!(W > 0)) { lev = lo; WB.V = 0; WB.mx = 0; WB.my = 0; WB.mz = 0; }
    else if (!(W < Vk)) { lev = hi; below(sp, k, u, zr, hi, WB); }
    else {
      lev = h0 > lo && h0 < hi ? h0 : lo + (hi - lo) * W / Vk;
      const tol = 1e-12 * Vk;
      for (it = 0; it < 100; it++) {
        below(sp, k, u, zr, lev, WB);
        const err = WB.V - W;
        if ((err < 0 ? -err : err) <= tol) break;
        if (err > 0) hi = lev; else lo = lev;
        let hn = WB.A > 0 ? lev - err / WB.A : 0.5 * (lo + hi);
        if (!(hn > lo && hn < hi)) hn = 0.5 * (lo + hi);
        lev = hn;
      }
    }
    const wv = WB.V;
    out.level = lev; out.iter = it; out.V = wv;
    out.wx = wv > 0 ? WB.mx / wv : sp.cx[k]; out.wy = wv > 0 ? WB.my / wv : sp.cy[k]; out.wz = wv > 0 ? WB.mz / wv : sp.cz[k];
    const air = Vk - wv;
    out.air = air;
    out.ax = air > 1e-9 * Vk ? (Vk * sp.cx[k] - WB.mx) / air : sp.cx[k];
    out.ay = air > 1e-9 * Vk ? (Vk * sp.cy[k] - WB.my) / air : sp.cy[k];
    out.az = air > 1e-9 * Vk ? (Vk * sp.cz[k] - WB.mz) / air : sp.cz[k];
    return out;
  }


  // ================================================================ a piece's spaces at the hand-over
  // stateOf(sp, whole, sim, F): each space's water W (m3) and air a (m3 at one atmosphere: the core's air stands at the
  // atmosphere's pressure) at the hand-over, and its level by the box rule at the hand-over's pose F. A space's water is
  // the core's, its over-fill dropped as the fall drops it (min(vol, room); C5's rule); a space the cut crosses takes
  // the share of it that lies on this piece's side: its boxes' room below the core's own level, over the whole space's
  // (`whole`: spacesOf(ship, -inf, inf)). The two pieces' shares of a space sum to its water to rounding.
  const SB = { V: 0, A: 0, mx: 0, my: 0, mz: 0 }, SO = {};
  function stateOf(sp, whole, sim, F) {
    const n = sp.n, W = new Float64Array(n), a = new Float64Array(n), lev = new Float64Array(n), u = [F.R20, F.R21, F.R22], zr = F.tz;
    const idx = new Map(); for (let q = 0; q < whole.n; q++) idx.set(whole.node[q], q);
    for (let k = 0; k < n; k++) {
      const node = sp.node[k], q = idx.get(node), Wn = Math.min(sim.vol[node], whole.V[q]);
      let Wk = Wn;
      if (Math.abs(sp.V[k] - whole.V[q]) > 1e-9 * whole.V[q]) {   // the cut crosses this space: this piece's share
        const h = sim.level[node], mine = below(sp, k, u, zr, h, SB).V, all = below(whole, q, u, zr, h, SB).V;
        Wk = all > 0 ? Wn * mine / all : Wn * sp.V[k] / whole.V[q];
        if (Wk > sp.V[k]) Wk = sp.V[k];
      }
      W[k] = Wk; a[k] = sp.V[k] - Wk;
      water(sp, k, u, zr, Wk, sim.level[node], SO); lev[k] = SO.level;
    }
    return { W, a, lev };
  }

  // ================================================================ a piece's openings
  // openingsOf(sp, sim, x0, x1, K): the core's connections whose point lies in [x0, x1), each between two of this
  // piece's spaces or a space and the sea (-1), as e84's openings in her frame (the core's buildConnections, its kinds
  // K_DOOR 0 to K_STAIR 9):
  //   a, b     the inside space and the other side (a space, or -1 for the sea); the normal points from a to b
  //   px py pz its point in her frame; nx ny nz its unit normal in her frame
  //   A, L, Cd its clear area, its extent in its own plane (e84's L), its discharge coefficient
  //   open     whether it is open now (a door shut, a staircase's window not yet given way, a breach not yet come on)
  // An orifice (type 0) is a square of its area. A weir (type 1: area is its crest's length) is an upright slot of that
  // width from its crest up, K.slot m high [bet: 1 m; the clearance to the deck above for OVER is the geometry's, a
  // refinement]: under free overflow e84's strip law over it is the weir law; drowned it is an orifice. S1's upright
  // openings (type 2) take their width and height; its level ones (type 3), their area. The cut adds, for each space it
  // crosses, its boxes' faces at the cut times K.clear [bet: 0.4 to 0.8 of the gross section, v1.3; 0.6], to the sea,
  // its normal along her length out of the piece, its discharge coefficient K.cutCd [e84's: a sharp-edged orifice, 0.6;
  // band 0.45 to 0.75 for a clear opening].
  const KIND_NORMAL = [[-1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, -1, 0], [0, -1, 0], [0, -1, 0], [0, 0, 1], null, null, null];
  function openingsOf(sp, sim, x0, x1, K) {
    K = K || {};
    const slot = K.slot === undefined ? 1.0 : K.slot, clear = K.clear === undefined ? 0.6 : K.clear, cutCd = K.cutCd === undefined ? 0.6 : K.cutCd;
    const S = sim.conn, idx = new Map(), ops = [];
    for (let k = 0; k < sp.n; k++) idx.set(sp.node[k], k);
    for (let c = 0; c < S.n; c++) {
      if (!(S.x[c] >= x0 && S.x[c] < x1)) continue;
      const kd = S.kind[c], t = S.type[c], ca = S.a[c], cb = S.b[c];
      // inside: a space of this piece; the other side: a space or the sea. The core's a is the sea for its openings to the
      // weather (TOP, BREACH, OPEN, STAIR), so those turn round: inside the space, outside the sea
      let a, b, flip = 1;
      if (ca < 0) { a = idx.has(cb) ? idx.get(cb) : -2; b = -1; flip = -1; } else { a = idx.has(ca) ? idx.get(ca) : -2; b = cb < 0 ? -1 : (idx.has(cb) ? idx.get(cb) : -2); }
      if (a < 0 || b === -2) continue;
      let n = KIND_NORMAL[kd];
      if (!n) n = t === 3 ? [0, 0, 1] : [0, S.y[c] >= 0 ? 1 : -1, 0];   // her side (BREACH, OPEN, STAIR upright) or a dome
      else if (flip < 0) n = [-n[0], -n[1], -n[2]];
      let A, L, pz = S.z[c];
      if (kd === 6) { n = [0, 0, 1]; A = S.area[c] * slot; L = Math.sqrt(A); }   // TOP: hatches in the deck, level, out upward: the crest times K.slot [bet]
      else if (t === 0) { A = S.area[c]; L = Math.sqrt(A); }
      else if (t === 1) { A = S.area[c] * slot; L = slot; pz = S.z[c] + 0.5 * slot; }
      else if (t === 2) { A = S.area[c] * S.dim[c]; L = S.dim[c]; pz = S.z[c] + 0.5 * S.dim[c]; }
      else { A = S.area[c]; L = Math.sqrt(A); }
      const open = S.en[c] === 1 && !(S.tOn[c] > sim.t);
      const op = { c, kind: kd, a, b, px: S.x[c], py: S.y[c], pz, nx: n[0], ny: n[1], nz: n[2], A, L, Cd: S.coef[c], open };
      if (kd === 0) op.door = S.idx[c];                                 // K_DOOR: its bulkhead (doorsOf, doorsStep)
      ops.push(op);
    }
    // the cut: each space the cut crosses opens to the sea over its boxes' faces there
    const xc = x0 > -1e8 ? x0 : (x1 < 1e8 ? x1 : null);
    if (xc !== null) {
      const out = x0 > -1e8 ? -1 : 1;                                   // the bow's cut is its after end, the stern's its fore
      for (let k = 0; k < sp.n; k++) {
        let A = 0, zA = 0, yA = 0, zlo = Infinity, zhi = -Infinity;
        for (let q = sp.start[k], q1 = q + sp.count[k]; q < q1; q++) {
          if (Math.abs((out < 0 ? sp.bx[q] - sp.wx[q] : sp.bx[q] + sp.wx[q]) - xc) > 1e-6) continue;
          const f = 4 * sp.wy[q] * sp.wz[q];
          A += f; zA += f * sp.bz[q]; yA += f * sp.by[q];
          if (sp.bz[q] - sp.wz[q] < zlo) zlo = sp.bz[q] - sp.wz[q];
          if (sp.bz[q] + sp.wz[q] > zhi) zhi = sp.bz[q] + sp.wz[q];
        }
        if (!(A > 0)) continue;
        ops.push({ c: -1, kind: 'cut', a: k, b: -1, px: xc, py: yA / A, pz: zA / A, nx: out, ny: 0, nz: 0, A: clear * A, L: zhi - zlo, Cd: cutCd, open: true });
      }
    }
    return ops;
  }

  // ================================================================ the exchange through an opening (e84's laws P and X)
  // e84's library (docs/research/experiments/e84_z6_exchange_lib.js and its tests e84_z6_exchange.js; the research note
  // docs/research/RESEARCH_torn_end_exchange_law_v1_2026-11-20.md), copied here with two changes so that it calls no
  // engine transcendental (E2a): x^0.25 as two square roots, and stepSpace's bisection geometric by sqrt(lo hi) in place
  // of exp of the logs' mean. e84's own tests give the same output to the digit on the copy (Z1, 2026-11-21).
  // Conventions (world frame): z up, metres, sea surface at z = 0. Pressures absolute, Pa.
  // A "side" is { zw, pa }: the free surface's world height and the air pressure above it.
  //   the sea:           { zw: 0, pa: P_ATM }
  //   a compartment:     { zw: its level at the opening, pa: its air pocket's pressure }
  // An opening is { A, L, zc, nz, Cd, Dh?, C?, m?, Ku?, kuCap? }:
  //   A   clear area, m2            L   its extent along the dip direction in its own plane, m
  //   zc  world height of centroid  nz  z-component of the unit normal that points from side a
  //                                     (inside) to side b (outside): 0 = vertical opening,
  //                                     +1 = faces up (b above a), -1 = faces down
  //   Cd  discharge coefficient (obstruction included)
  //   Dh  hydraulic diameter of ONE unobstructed cell of the opening (default: of the whole)
  // Flows returned are volumes per second, each at its upstream side's pressure:
  //   wIn (water b->a), wOut (water a->b), aIn (air b->a), aOut (air a->b).

  const G = 9.80665, RHO_W = 1025, P_ATM = 101325;
  const RHO_A0 = 1.27;      // air at 1 atm, about 5 C, kg/m3 (isothermal: rho = RHO_A0 * p / P_ATM)
  const SIGMA = 0.074;      // sea water / air, N/m
  const CHOKE = 0.47;       // air: (p_up - p_down) / p_up beyond which the flow is choked

  const DEFAULTS = {
    Cd: 0.60,               // sourced: sharp-edged orifice; band 0.45-0.75 for a clear opening
    C: 0.70,                // Wallis intercept, sharp-edged ends; band 0.55-1.0 (see exchange_law.md)
    m: 1.0,                 // Wallis slope; band 0.8-1.0
    Ku: 3.2,                // Pushkina & Sorokin's zero-penetration Kutateladze number (C_K = 1.79)
    kuCap: true             // [bet] cap the gas intercept by Kutateladze at large Dh
  };

  function rhoAir(p) { return RHO_A0 * p / P_ATM; }
  function sideP(side, z) { return side.pa + RHO_W * G * Math.max(side.zw - z, 0); }

  // mean of sqrt(x) for x linear between a and b (a, b >= 0): exact
  function meanSqrt(a, b) {
    const d = b - a;
    if (Math.abs(d) <= 1e-9 * Math.max(a, b, 1e-300)) return Math.sqrt(0.5 * (a + b));
    return (2 / 3) * (b * Math.sqrt(b) - a * Math.sqrt(a)) / d;
  }

  // ---------------------------------------------------------------------------------------
  // Law P: the pressure law. Each strip of the opening carries the fluid that stands on its
  // upstream side, at Bernoulli's speed for the local pressure difference. Exact integral of
  // a piecewise-linear pressure difference. Covers (a) orifice, (b) one-way, (c) two-layer
  // exchange with the neutral plane inside the opening, (f) compression-driven inflow.
  // ---------------------------------------------------------------------------------------
  function lawP(op, a, b) {
    const Cd = op.Cd != null ? op.Cd : DEFAULTS.Cd;
    const nz = Math.max(-1, Math.min(1, op.nz || 0));
    const h = op.L * Math.sqrt(Math.max(0, 1 - nz * nz));     // vertical extent
    const zlo = op.zc - 0.5 * h;
    const out = { wIn: 0, wOut: 0, aIn: 0, aOut: 0, dpLo: 0, dpHi: 0, h: h };
    const dpAt = (s) => { const z = zlo + s * h; return sideP(b, z) - sideP(a, z); };
    out.dpLo = dpAt(0); out.dpHi = dpAt(1);

    // break points in s: the two free surfaces (kinks of the pressure difference)
    const cuts = [0, 1];
    if (h > 1e-9) {
      const sa = (a.zw - zlo) / h, sb = (b.zw - zlo) / h;
      if (sa > 0 && sa < 1) cuts.push(sa);
      if (sb > 0 && sb < 1) cuts.push(sb);
      cuts.sort((x, y) => x - y);
    }
    const piece = (s0, s1, d0, d1) => {
      if (s1 - s0 <= 0) return;
      const sgn = (d0 + d1) >= 0 ? 1 : -1;                    // + : b -> a
      const up = sgn > 0 ? b : a;
      const zm = zlo + 0.5 * (s0 + s1) * h;
      const water = zm < up.zw;
      let x0 = Math.abs(d0), x1 = Math.abs(d1), rho = RHO_W;
      if (!water) {
        rho = rhoAir(up.pa);
        const cap = CHOKE * up.pa;                            // choked air: no faster
        x0 = Math.min(x0, cap); x1 = Math.min(x1, cap);
      }
      const q = Cd * op.A * (s1 - s0) * Math.sqrt(2 / rho) * meanSqrt(x0, x1);
      if (sgn > 0) { if (water) out.wIn += q; else out.aIn += q; }
      else { if (water) out.wOut += q; else out.aOut += q; }
    };
    for (let i = 0; i + 1 < cuts.length; i++) {
      const s0 = cuts[i], s1 = cuts[i + 1];
      const d0 = dpAt(s0), d1 = dpAt(s1);
      if (d0 * d1 < 0) {                                      // the neutral plane is in this piece
        const sr = s0 + (s1 - s0) * d0 / (d0 - d1);
        piece(s0, sr, d0, 0); piece(sr, s1, 0, d1);
      } else piece(s0, s1, d0, d1);
    }
    return out;
  }

  // ---------------------------------------------------------------------------------------
  // The flooding line: sqrt(jg/jg0) + sqrt(jf/jf0) = 1, with a given net flux n = jf - jg
  // (downward positive). Returns the pair on the line; outside it, one-way flow.
  // ---------------------------------------------------------------------------------------
  function floodingPair(n, jg0, jf0) {
    if (n >= jf0) return { jg: 0, jf: n };
    if (n <= -jg0) return { jg: -n, jf: 0 };
    const a = 1 / Math.sqrt(jg0), b = 1 / Math.sqrt(jf0);
    let lo = Math.max(0, -n), hi = jg0;
    for (let i = 0; i < 40; i++) {                            // fixed count: deterministic
      const x = 0.5 * (lo + hi);
      if (a * Math.sqrt(x) + b * Math.sqrt(Math.max(0, x + n)) - 1 < 0) lo = x; else hi = x;
    }
    const jg = 0.5 * (lo + hi);
    return { jg: jg, jf: Math.max(0, jg + n) };
  }

  // The two intercepts of the flooding line for an opening with air (density rg) under water.
  function intercepts(op, rg) {
    const C = op.C != null ? op.C : DEFAULTS.C, m = op.m != null ? op.m : DEFAULTS.m;
    const Ku = op.Ku != null ? op.Ku : DEFAULTS.Ku;
    const kuCap = op.kuCap != null ? op.kuCap : DEFAULTS.kuCap;
    const b = op.A / op.L;
    const Dh = op.Dh != null ? op.Dh : 2 * op.L * b / (op.L + b);
    // air pressed past about 800 bar is denser than the sea: no buoyant exchange (the line's intercepts 0). Only a speck
    // squeezed into a sliver of room gets there, and only in a pressure solve's bracket (Z1, 4d: its square root of a
    // negative was a NaN that the solve took for its root)
    const dr = RHO_W > rg ? RHO_W - rg : 0;
    const jf0 = C * C * Math.sqrt(G * Dh * dr / RHO_W) / (m * m);   // water alone (Froude)
    const jgW = C * C * Math.sqrt(G * Dh * dr / rg);                // air alone, Wallis
    const jgK = Ku * Math.sqrt(Math.sqrt(G * SIGMA * dr)) / Math.sqrt(rg); // air alone, Kutateladze (x^0.25 by two sqrt: the same bits in every engine)
    return { jf0: jf0, jg0: kuCap ? Math.min(jgW, jgK) : jgW, Dh: Dh };
  }

  // ---------------------------------------------------------------------------------------
  // The whole law for one opening: law P, plus the counter-current exchange (law X) wherever
  // water stands over air across the opening, weighted by how far the opening is from vertical.
  // ---------------------------------------------------------------------------------------
  function exchange(op, a, b) {
    const f = lawP(op, a, b);
    const nz = Math.max(-1, Math.min(1, op.nz || 0));
    f.extra = 0;
    if (Math.abs(nz) < 1e-6) return f;
    const upper = nz > 0 ? b : a, lower = nz > 0 ? a : b;
    // the share of the opening with water above it and air below it
    const hb = Math.max(f.h, 0.02 * op.L);
    const z0 = op.zc - 0.5 * hb, z1 = op.zc + 0.5 * hb;
    const fx = Math.max(0, Math.min(z1, upper.zw) - Math.max(z0, lower.zw)) / hb;
    if (fx <= 0) return f;
    const W = fx * Math.sqrt(Math.abs(nz));                   // [bet] g's share along the normal
    const ic = intercepts(op, rhoAir(lower.pa));
    const down = nz > 0 ? f.wIn + f.aIn : f.wOut + f.aOut;
    const up = nz > 0 ? f.wOut + f.aOut : f.wIn + f.aIn;
    const pair = floodingPair((down - up) / op.A, ic.jg0, ic.jf0);
    const eW = Math.min(pair.jg, pair.jf), eP = Math.min(down, up) / op.A;
    const extra = Math.max(0, W * eW - eP) * op.A;            // never less than law P's own
    f.extra = extra;
    if (nz > 0) { f.wIn += extra; f.aOut += extra; } else { f.wOut += extra; f.aIn += extra; }
    return f;
  }

  // ---------------------------------------------------------------------------------------
  // Safeguard 1: the one-way limiter. For q = c*sqrt(dp) relaxing a pressure difference dp
  // against a stiffness k (Pa per m3 moved), the exact volume moved in dt is
  //   V = q*dt*(1 - x/4) for x < 2,  V = dp/k for x >= 2,   x = k*q*dt/dp
  // so a sub-step can level the two sides but never pass the level. k of a side is
  // rho*g/S (its free surface S) + pa/Va (its air pocket, if closed); the sea's is 0.
  // With several openings on one space, use the space's summed net flow, or safeguard 2.
  // (Z1, 2026-11-23, on the stern-work team's finding: in a piece's spaces it is applied pair by pair, so a side is
  // judged by its own stiffness alone, and a space the sea holds through another opening is taken as stiff as if it
  // were sealed: a full one by its free surface's floor, 1e-6 m2, a nearly full one by a trapped bubble's pa/Va.
  // stepPiece's 'held' (heldBySea) gives such a side the sea's 0; 'pair' is the limiter as it was.)
  // ---------------------------------------------------------------------------------------
  function sideStiffness(side) {
    let k = 0;
    if (side.S > 0 && isFinite(side.S)) k += RHO_W * G / side.S;
    if (side.Va > 0 && isFinite(side.Va)) k += side.pa / side.Va;
    return k;
  }
  function limitOneWay(f, a, b, dt) {
    const net = f.wIn + f.aIn - f.wOut - f.aOut;
    const dp = Math.max(Math.abs(f.dpLo), Math.abs(f.dpHi));
    const k = sideStiffness(a) + sideStiffness(b);
    if (!(k > 0) || net === 0) return 1;
    if (!(dp > 0)) return 0;
    const x = k * Math.abs(net) * dt / dp;
    return x < 2 ? 1 - 0.25 * x : 1 / x;                      // scale the NET part by this
  }

  // ---------------------------------------------------------------------------------------
  // Safeguard 2 (the one to use for air): one space's air pressure taken implicitly.
  // Air pressure is the stiff variable (at depth pa/Va grows as depth squared); the levels
  // are slow. Find the end-of-step pressure p at which Boyle's law closes with the flows
  // evaluated AT p. The residual is monotone in p, so bisection cannot fail or overshoot.
  // space: { zw, pa, Va, S } (S: free-surface area; Va: air volume); ops: [{ op, other }].
  // Returns the flows' volumes moved in dt and the new state. Fixed iteration count.
  // ---------------------------------------------------------------------------------------
  function stepSpace(space, ops, dt) {
    const M0 = space.pa * space.Va;                           // isothermal: p*V is the air's amount
    const evalAt = (p) => {
      const a = { zw: space.zw, pa: p };
      let w = 0, aOutPV = 0, aInPV = 0, wIn = 0, wOut = 0, aOut = 0;
      for (let i = 0; i < ops.length; i++) {
        const f = exchange(ops[i].op, a, ops[i].other);
        w += (f.wIn - f.wOut) * dt; wIn += f.wIn * dt; wOut += f.wOut * dt;
        aOut += f.aOut * dt; aOutPV += p * f.aOut * dt; aInPV += ops[i].other.pa * f.aIn * dt;
      }
      // positivity: never more air out than there is, never more water in than there is room
      const Mn = Math.max(0, M0 - Math.min(aOutPV, M0) + aInPV);
      const Vn = Math.max(1e-9, space.Va - w);
      return { R: p * Vn - Mn, Mn: Mn, Vn: Vn, w: w, wIn: wIn, wOut: wOut, aOut: aOut };
    };
    let pmax = space.pa;
    for (let i = 0; i < ops.length; i++) {
      const o = ops[i].other, op = ops[i].op;
      pmax = Math.max(pmax, sideP(o, op.zc - 0.5 * op.L), sideP(space, op.zc - 0.5 * op.L));
    }
    // bisection on the pressure, geometric: the midpoint sqrt(lo hi) is exp of the logs' mean, by sqrt alone (correctly
    // rounded, so the same bits in every engine)
    let lo = 1, hi = 2 * pmax;
    for (let i = 0; i < 48; i++) {
      const mid = Math.sqrt(lo * hi);
      if (evalAt(mid).R < 0) lo = mid; else hi = mid;
    }
    const p = Math.sqrt(lo * hi), e = evalAt(p);
    const Va = e.Vn, pa = e.Mn / e.Vn;
    return { pa: e.Mn > 0 ? pa : p, Va: Va, zw: space.zw + (space.Va - Va) / space.S,
             airPV: e.Mn, moved: e };
  }


  // ================================================================ a piece's spaces stepped
  // stepPiece(sp, st, ops, R, r, dt, how, lim): one step of a piece's spaces over dt at her pose: R takes her frame to the
  // world (row-major), r is her frame's origin in the world, the sea's surface at z = 0. Each space's level by the box
  // rule at the pose and its pressure (airP: its air's, P_ATM a / (V - W), isothermal, a its air in m3 at one
  // atmosphere); each open opening's world centre and the world z of its normal. Then each space in turn, in a fixed
  // order (Gauss-Seidel): its air's pressure at the step's end taken implicitly over all its openings (e84's safeguard 2:
  // the root of stepSpace's residual, by rootIllinois from the space's last pressure, st.pLast; how 'bisect' takes e84's
  // 48 halvings, which it matches to about 1e-7 of a room a step at 1.7 times the speed), and every one of its openings'
  // flows at that pressure moved, all the water and then all the air, out of
  // one side and into the other. The solve and the moves take the same flows (flowsAt), as they can move: between two
  // spaces the net held by e84's one-way limiter (safeguard 1: a step levels the two sides, never passes the level;
  // lim 'held': a side the sea holds at the step's start, heldBySea's, counted as stiff as the sea, 0; 'pair' or none:
  // each side by its own stiffness, as before);
  // over the openings to one neighbour, no more water than it holds or has room for and no more air than it holds, and
  // no air into it with no room; the sea gives and takes without limit. Z1, 4c: with the caps applied only after the
  // solve, a space counted on moves the caps then refused (into a full neighbour, past a neighbour's air), and its air
  // was squeezed past the sea's, to 400 to 1,800 bar where the sea gave 150 to 220, and stranded in no room. A move
  // never takes more water or air than a side holds, nor more water than the other has room for, and no air goes into a
  // space with no room above its water; air left in a space its water has filled bubbles out to the sea (st.bubbled, m3
  // at one atmosphere). So her water and air change only by what passes to and from the sea. st: { W, a, lev }
  // (stateOf's), changed in place.
  // The root of a residual that rises with p, in [lo, hi]. rootBisect: 48 geometric halvings (sqrt alone, correctly
  // rounded, so the same bits in every engine), e84's stepSpace's. rootIllinois: geometric halvings until hi < 4 lo, then
  // Illinois false position (the end kept twice running has the other's residual halved), each point kept inside the
  // bracket, to a width of 1e-13 of p or 100 evaluations; a residual of exactly 0 ends it there
  function rootBisect(f, lo, hi) {
    for (let i = 0; i < 48; i++) { const mid = Math.sqrt(lo * hi); if (f(mid) < 0) lo = mid; else hi = mid; }
    return Math.sqrt(lo * hi);
  }
  function rootIllinois(f, lo, hi, guess) {
    let n = 0, flo, fhi;
    if (guess > lo && guess < hi) {
      // from the space's last pressure: a bracket a factor 1.5 about it, widened four-fold a side while it holds none
      let a = guess / 1.5, b = guess * 1.5;
      if (a < lo) a = lo; if (b > hi) b = hi;
      let fa = f(a), fb = f(b); n += 2;
      while (fa > 0 && a > lo && n < 40) { b = a; fb = fa; a = a / 4 < lo ? lo : a / 4; fa = f(a); n++; }
      while (fb < 0 && b < hi && n < 40) { a = b; fa = fb; b = b * 4 > hi ? hi : b * 4; fb = f(b); n++; }
      if (fa === 0) return a;
      if (fb === 0) return b;
      if (fa < 0 && fb > 0) { lo = a; flo = fa; hi = b; fhi = fb; }
      else if (fa > 0) return a;
      else return b;
    } else {
      flo = f(lo); n++;
      if (!(flo < 0)) return lo;
      while (hi > 4 * lo && n < 100) { const mid = Math.sqrt(lo * hi), fm = f(mid); n++; if (fm < 0) { lo = mid; flo = fm; } else { hi = mid; fhi = fm; } }
      if (fhi === undefined) { fhi = f(hi); n++; }
      if (!(fhi > 0)) return hi;
    }
    let kept = 0, step = 0, w2 = hi - lo;
    while (hi - lo > 1e-13 * hi && n < 160) {
      // two false-position steps that do not halve the bracket are followed by a halving: so it halves at least every
      // three evaluations whatever the residual's shape
      let x;
      if (step === 2) { x = 0.5 * (lo + hi); step = 0; kept = 0; w2 = hi - lo; }
      else {
        x = (lo * fhi - hi * flo) / (fhi - flo);
        if (!(x > lo && x < hi)) x = 0.5 * (lo + hi);
        step++;
      }
      const fx = f(x); n++;
      if (fx < 0) { lo = x; flo = fx; if (kept < 0) fhi *= 0.5; kept = -1; }
      else if (fx === 0) return x;
      else { hi = x; fhi = fx > 0 ? fx : Infinity; if (kept > 0) flo *= 0.5; kept = 1; }   // a NaN (a law past its range) counts as above the root, as rootBisect takes it
      if (step === 2 && hi - lo <= 0.5 * w2) { step = 0; w2 = hi - lo; }
    }
    return lo - flo * (hi - lo) / (fhi - flo);
  }
  // ================================================================ the watertight doors' floats in the fall
  // The core's doorsStep (core.js, Y2) mirrored in a piece's spaces (Z1, 2026-11-24, with the mainline's e120): a door
  // open at the hand-over whose float is armed (sim.doorFloat) is released once water stands P.floatDepth over the lowest
  // point of a space below E deck on either side of its bulkhead (zones b and b + 1, both sides, as the core's nodes b
  // and b + 1 at layer 0), and falls shut over P.doorFall seconds; a fall under way at the hand-over (sim.doorFall)
  // goes on. A door shut at the hand-over stays shut; nothing in the fall opens one. doorsOf(sim, sp, ops): this piece's
  // bulkheads with an open door, each { b, fall (seconds left, or -1), float, ops (indices), spaces (this piece's
  // spaces the float sees) }. doorsStep(sp, st, D, ops, R, r, dt, P, t): one step of them at her pose, t the clock at
  // the step's end; returns the count shut in it (each kept in st.doorsShut, { b, t }; each release in st.doorsReleased)
  function doorsOf(sim, sp, ops) {
    const byB = new Map(), idx = new Map();
    for (let k = 0; k < sp.n; k++) idx.set(sp.node[k], k);
    for (let i = 0; i < ops.length; i++) {
      const o = ops[i];
      if (!(o.door >= 0) || !o.open) continue;
      let d = byB.get(o.door);
      if (!d) {
        const b = o.door, spaces = [];
        for (let z = b; z <= b + 1; z++) for (let sd = 0; sd < 2; sd++) { const k = idx.get((z * 2 + sd) * 2); if (k !== undefined) spaces.push(k); }
        byB.set(b, d = { b, fall: sim.doorFall && sim.doorFall[b] >= 0 ? sim.doorFall[b] : -1, float: !!(sim.doorFloat && sim.doorFloat[b]), ops: [], spaces });
      }
      d.ops.push(i);
    }
    return Array.from(byB.values()).sort((x, y) => x.b - y.b);
  }
  const BRD = new Float64Array(2);
  function doorsStep(sp, st, D, ops, R, r, dt, P, t) {
    const u = [R[6], R[7], R[8]], zr = r[2];
    let n = 0;
    for (const d of D) {
      if (!d.ops.some(i => ops[i].open)) continue;
      if (d.fall >= 0) {
        d.fall -= dt;
        if (d.fall <= 0) { for (const i of d.ops) ops[i].open = false; n++; (st.doorsShut || (st.doorsShut = [])).push({ b: d.b, t }); }
        continue;
      }
      if (!d.float) continue;
      for (const k of d.spaces) {
        if (!(st.W[k] > 1e-6)) continue;
        bracket(sp, k, u, zr, BRD);
        if (st.lev[k] - BRD[0] > P.floatDepth) { d.fall = P.doorFall; (st.doorsReleased || (st.doorsReleased = [])).push({ b: d.b, t }); break; }
      }
    }
    return n;
  }
  // ================================================================ the openings to the weather in the fall
  // The core's stairsStep (core.js; S1, and C4's openings in her side) mirrored in a piece's spaces (Z1, 2026-11-24, the
  // coordinator's (3)): each of sim.stairOps (the tiers' windows, the grand staircases' doors and domes, D and E decks'
  // side openings) that this piece holds, in the state the hand-over left it (sim.stairSt: 0 the sea below its sill, 1
  // the sea at it, 2 given way). The sea reaching its sill makes it 1 (where it has a leak, its connections open with
  // their own area as handed over); it gives way, for good, once the sea's head over its centre less the head of the
  // water behind it (its spaces' levels) reaches its own strength (o.hc); a dome also once the sea stands
  // sim.params.hAir over the lintel of every door of its staircase that has given way (one at least). Given way, its
  // connections take its size shared among them, as the core's do (stairsStep). The sea's surface is the world's 0 (the
  // fall's sea has no heads of her motion). weatherOf(sim, sp, ops, K): this piece's openings to the weather not yet
  // given way, { list: [{ j, st, o, ops (indices), give ([A, L] for each), spaces }], st0, ops0 }. weatherStep(sp, st,
  // Wt, ops, R, r, t, P): one step at her pose, t the clock at its end; returns the count given way in it (each kept in
  // st.weatherOpened, { j, id, t })
  function weatherOf(sim, sp, ops, K) {
    const S = sim.conn, so = sim.stairOps || [], slot = K && K.slot !== undefined ? K.slot : 1.0;
    const idx = new Map(), byC = new Map(), list = [];
    for (let k = 0; k < sp.n; k++) idx.set(sp.node[k], k);
    for (let i = 0; i < ops.length; i++) if (ops[i].c >= 0) byC.set(ops[i].c, i);
    for (let j = 0; j < so.length; j++) {
      const o = so[j], s0 = sim.stairSt ? sim.stairSt[j] : 0, nc = o.nodes.length;
      if (s0 === 2) continue;
      const mine = [], give = [];
      for (let i = 0; i < nc; i++) {
        const q = byC.get(o.conn + i); if (q === undefined) continue;
        const c = o.conn + i, t = S.type[c], area = o.size / nc;
        mine.push(q);
        // its clear area and extent once given way, as openingsOf makes them from the connection's area
        if (S.kind[c] === 6) { const A = area * slot; give.push([A, Math.sqrt(A)]); }
        else if (t === 0) give.push([area, Math.sqrt(area)]);
        else if (t === 1) give.push([area * slot, slot]);
        else if (t === 2) give.push([area * S.dim[c], S.dim[c]]);
        else give.push([area, Math.sqrt(area)]);
      }
      if (!mine.length) continue;
      const spaces = []; for (const nd of o.nodes) { const k = idx.get(nd); if (k !== undefined && spaces.indexOf(k) < 0) spaces.push(k); }
      list.push({ j, st: s0, o, ops: mine, give, spaces });
    }
    return { list, st0: Uint8Array.from(sim.stairSt || []), ops0: so };
  }
  function weatherStep(sp, st, Wt, ops, R, r, t, P) {
    const u0 = R[6], u1 = R[7], u2 = R[8], zr = r[2], zAt = (x, y, z) => zr + u0 * x + u1 * y + u2 * z;
    const stOf = (j) => { for (const w of Wt.list) if (w.j === j) return w.st; return Wt.st0[j]; };
    let n = 0;
    for (const w of Wt.list) {
      if (w.st === 2) continue;
      const o = w.o;
      if (w.st === 0 && -zAt(o.x, o.y, o.z) > 0) {                    // the sea at its sill
        w.st = 1;
        if (o.leak > 0) for (const i of w.ops) ops[i].open = true;
      }
      let go = false;
      if (w.st === 1) {
        const zm = zAt(o.x, o.y, o.zc), out = -zm;
        if (out > 0) {
          let back = 0;
          for (const k of w.spaces) if (st.W[k] > 1e-6 && st.lev[k] - zm > back) back = st.lev[k] - zm;
          go = out - back >= o.hc;
        }
      }
      if (!go && o.type === 3 && P.hAir >= 0 && o.doors) {
        let any = false, all = true;
        for (let i = 0; i < o.doors.length && all; i++) {
          const dj = o.doors[i]; if (stOf(dj) !== 2) continue;
          any = true;
          const d = Wt.ops0[dj];
          if (!(-zAt(d.x, d.y, d.z + d.dim) >= P.hAir)) all = false;
        }
        go = any && all;
      }
      if (!go) continue;
      w.st = 2; n++;
      for (let q = 0; q < w.ops.length; q++) { const op = ops[w.ops[q]]; op.open = true; op.A = w.give[q][0]; op.L = w.give[q][1]; }
      (st.weatherOpened || (st.weatherOpened = [])).push({ j: w.j, id: o.id, t });
    }
    return n;
  }
  // heldBySea(ops, side, n): which of a piece's spaces the sea holds at the step's start (1 a space): a space whose water
  // stands over the bottom of an open opening to the sea that lies below the sea's surface, or over the bottom of an open
  // opening to a held space whose water stands over it too. Its water is one body with the sea's, so its pressure there
  // is the sea's, kept by the sea through that way however much it gives through another: for the one-way limiter its own
  // stiffness is 0, as the sea's is. A space with no such way (sealed, or dry below every way in) keeps its own: a full
  // space sealed cannot give water without leaving a void. Each opening's bottom is the law's (its centre less half its
  // vertical extent), at the pose stepPiece set (o.zcW, o.nzW); side[k].zw each space's level. Fixed order
  const HELD = { zw: 0, pa: 0, S: Infinity, Va: Infinity };          // a side the sea holds: sideStiffness 0
  function heldBySea(ops, side, n) {
    const held = new Uint8Array(n), q = [];
    const bottom = (o) => o.zcW - 0.5 * o.L * Math.sqrt(Math.max(0, 1 - o.nzW * o.nzW));
    for (const o of ops) {
      if (!o.open || o.b !== -1) continue;
      const z = bottom(o);
      if (z < 0 && side[o.a].zw > z && !held[o.a]) { held[o.a] = 1; q.push(o.a); }
    }
    while (q.length) {
      const k = q.pop();
      for (const o of ops) {
        if (!o.open || o.b < 0) continue;
        const j = o.a === k ? o.b : (o.b === k ? o.a : -1);
        if (j < 0 || held[j]) continue;
        const z = bottom(o);
        if (side[k].zw > z && side[j].zw > z) { held[j] = 1; q.push(j); }
      }
    }
    return held;
  }
  const SL = {}, SA = { V: 0, A: 0, mx: 0, my: 0, mz: 0 };
  function stepPiece(sp, st, ops, R, r, dt, how, lim) {
    const u = [R[6], R[7], R[8]], zr = r[2], n = sp.n, sea = { zw: 0, pa: P_ATM };
    const side = st.side || (st.side = Array.from({ length: n }, () => ({ zw: 0, pa: P_ATM, Va: 0, S: 0 })));
    for (let k = 0; k < n; k++) {
      water(sp, k, u, zr, st.W[k], st.lev[k], SL); st.lev[k] = SL.level;
      const Va = sp.V[k] - st.W[k], s = side[k];
      s.zw = SL.level; s.Va = Va; s.pa = airP(sp, st, k, Va, s.zw);
      s.S = Math.max(below(sp, k, u, zr, SL.level, SA).A, 1e-6);
    }
    for (const o of ops) if (o.open) { o.zcW = zr + u[0] * o.px + u[1] * o.py + u[2] * o.pz; o.nzW = u[0] * o.nx + u[1] * o.ny + u[2] * o.nz; }
    const held = lim === 'held' ? heldBySea(ops, side, n) : null;        // 'pair' (or none): the limiter as it was
    for (let k = 0; k < n; k++) {
      const list = [], nb = [];
      for (const o of ops) {
        if (!o.open) continue;
        if (o.a === k) list.push({ op: { A: o.A, L: o.L, zc: o.zcW, nz: o.nzW, Cd: o.Cd }, other: o.b < 0 ? sea : side[o.b], j: o.b });
        else if (o.b === k) list.push({ op: { A: o.A, L: o.L, zc: o.zcW, nz: -o.nzW, Cd: o.Cd }, other: side[o.a], j: o.a });
      }
      if (!list.length) continue;
      for (let i = 0; i < list.length; i++) { const j = list[i].j; if (j < 0) continue; let g = nb.find(x => x.j === j); if (!g) nb.push(g = { j, idx: [] }); g.idx.push(i); }
      const sk = side[k], k0 = { zw: sk.zw, pa: sk.pa, S: sk.S, Va: sk.Va }, FL = new Array(list.length);
      const flowsAt = (p) => {
        const me = { zw: sk.zw, pa: p };
        for (let i = 0; i < list.length; i++) {
          const it = list[i], f = exchange(it.op, me, it.other);
          if (it.j >= 0) {
            // the limiter, with k's stiffness at the step's start (so that the residual stays monotone in p)
            const s = limitOneWay(f, held && held[k] ? HELD : k0, held && held[it.j] ? HELD : it.other, dt);
            if (s < 1) {
              const vin = f.wIn + f.aIn, vout = f.wOut + f.aOut;
              if (vin > vout) { const q = (vout + s * (vin - vout)) / vin; f.wIn *= q; f.aIn *= q; }
              else if (vout > vin) { const q = (vin + s * (vout - vin)) / vout; f.wOut *= q; f.aOut *= q; }
            }
          }
          FL[i] = f;
        }
        for (const g of nb) {
          const j = g.j, room = Math.max(0, sp.V[j] - st.W[j]), full = !(room > 1e-9 * sp.V[j]), aj = st.a[j] > 0 ? st.a[j] * P_ATM / side[j].pa : 0;
          let wo = 0, wi = 0, ai = 0;
          for (const i of g.idx) { wo += FL[i].wOut; wi += FL[i].wIn; ai += FL[i].aIn; }
          const so = wo * dt > room ? room / (wo * dt) : 1, si = wi * dt > st.W[j] ? st.W[j] / (wi * dt) : 1, sa = ai * dt > aj ? aj / (ai * dt) : 1;
          for (const i of g.idx) { FL[i].wOut *= so; FL[i].wIn *= si; FL[i].aIn *= sa; if (full) FL[i].aOut = 0; }
        }
        return FL;
      };
      // the pressure at the step's end at which Boyle's law closes with the flows at it (stepSpace's residual and bracket)
      const M0 = sk.pa * sk.Va;
      const resid = (p) => {
        flowsAt(p);
        let w = 0, aOutPV = 0, aInPV = 0;
        for (let i = 0; i < list.length; i++) { const f = FL[i]; w += (f.wIn - f.wOut) * dt; aOutPV += p * f.aOut * dt; aInPV += list[i].other.pa * f.aIn * dt; }
        const Mn = Math.max(0, M0 - Math.min(aOutPV, M0) + aInPV), Vn = Math.max(1e-9, sk.Va - w);
        return p * Vn - Mn;
      };
      let pmax = sk.pa;
      for (const it of list) pmax = Math.max(pmax, sideP(it.other, it.op.zc - 0.5 * it.op.L), sideP(sk, it.op.zc - 0.5 * it.op.L));
      const p = how === 'bisect' ? rootBisect(resid, 1, 2 * pmax) : rootIllinois(resid, 1, 2 * pmax, st.pLast ? st.pLast[k] : 0);
      if (how !== 'bisect') (st.pLast || (st.pLast = new Float64Array(n)))[k] = p;
      flowsAt(p);
      for (let i = 0; i < list.length; i++) {                                // the water
        const f = FL[i], j = list[i].j;
        let w = (f.wIn - f.wOut) * dt;
        if (w > 0) { w = Math.min(w, sp.V[k] - st.W[k]); if (j >= 0) w = Math.min(w, st.W[j]); }
        else if (w < 0) { w = -Math.min(-w, st.W[k]); if (j >= 0) w = -Math.min(-w, sp.V[j] - st.W[j]); }
        st.W[k] += w; if (j >= 0) st.W[j] -= w;
      }
      for (let i = 0; i < list.length; i++) {                                // then the air, m3 at one atmosphere
        const f = FL[i], j = list[i].j;
        let am = (f.aIn * list[i].other.pa - f.aOut * p) * dt / P_ATM;
        if (am > 0) { if (j >= 0) am = Math.min(am, st.a[j]); if (!(sp.V[k] - st.W[k] > 1e-9 * sp.V[k])) am = 0; }
        else if (am < 0) { am = -Math.min(-am, st.a[k]); if (j >= 0 && !(sp.V[j] - st.W[j] > 1e-9 * sp.V[j])) am = 0; }
        st.a[k] += am; if (j >= 0) st.a[j] -= am;
      }
      // air left in a space its water has filled (where the water filled a neighbour before the air could pass into it)
      // has nowhere to stand: it bubbles out to the sea, as the lumped pocket's does past its room, and is counted
      for (let q = -1; q < nb.length; q++) {
        const j = q < 0 ? k : nb[q].j;
        if (st.a[j] > 0 && !(sp.V[j] - st.W[j] > 1e-9 * sp.V[j])) { st.bubbled = (st.bubbled || 0) + st.a[j]; st.a[j] = 0; }
      }
      for (const g of nb) refresh(sp, st, side, g.j);
      refresh(sp, st, side, k);                                             // the next spaces see k and its neighbours as they now are
    }
  }
  // failSpaces(sp, st, ops, R, r, K, t, events): a space's boundaries giving way (v1, section 5, in its simplest form). A
  // space whose air lags the sea's pressure at its free surface by more than K.failHead m of sea water [bet: 10 m; v1's
  // heads run from 2 (decks loaded from below) to 30 (watertight bulkheads) and 60 (the shell)] gives way at once, for
  // good: it opens to the sea across her, over K.failShare [bet: 0.5] of its own mean section (its room over its length),
  // as high as the space. A 'report' is logged with the time, the space's node, its free surface's depth and its energy,
  // the lag times its air's volume (J; v1: 500 m3 at 60 m is 0.3 GJ). Applied at the hand-over as well (Z1, 2026-11-21:
  // at the flag the core leaves air at one atmosphere in spaces a hundred metres down). Returns the count failed now.
  function failSpaces(sp, st, ops, R, r, K, t, events) {
    K = K || {};
    const head = K.failHead === undefined ? 10 : K.failHead, share = K.failShare === undefined ? 0.5 : K.failShare;
    const u = [R[6], R[7], R[8]], zr = r[2], RG = RHO_W * G;
    st.failed = st.failed || new Uint8Array(sp.n);
    let n = 0;
    for (let k = 0; k < sp.n; k++) {
      if (st.failed[k]) continue;
      const Va = sp.V[k] - st.W[k];
      if (!(Va > 1e-6 * sp.V[k])) continue;
      water(sp, k, u, zr, st.W[k], st.lev[k], SL); st.lev[k] = SL.level;
      const p = P_ATM * st.a[k] / Va, sea = P_ATM + RG * Math.max(0, -SL.level), lag = (sea - p) / RG;
      if (!(lag > head)) continue;
      ops.push(shellOpening(sp, k, share));
      st.failed[k] = 1; n++;
      if (events) events.push({ t, id: 'report', node: sp.node[k], depth: -SL.level, energy: lag * RG * Va });
    }
    return n;
  }
  // a space's shell given way: open to the sea across her over share of its mean section (its room over its length), as
  // high as the space
  function shellOpening(sp, k, share) {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (let q = sp.start[k], q1 = q + sp.count[k]; q < q1; q++) {
      if (sp.bx[q] - sp.wx[q] < x0) x0 = sp.bx[q] - sp.wx[q]; if (sp.bx[q] + sp.wx[q] > x1) x1 = sp.bx[q] + sp.wx[q];
      if (sp.bz[q] - sp.wz[q] < z0) z0 = sp.bz[q] - sp.wz[q]; if (sp.bz[q] + sp.wz[q] > z1) z1 = sp.bz[q] + sp.wz[q];
    }
    const A = share * sp.V[k] / Math.max(x1 - x0, 1e-6);
    return { c: -1, kind: 'failed', a: k, b: -1, px: sp.cx[k], py: sp.cy[k], pz: 0.5 * (z0 + z1), nx: 0, ny: sp.cy[k] >= 0 ? 1 : -1, nz: 0, A, L: z1 - z0, Cd: 0.6, open: true };
  }
  // boundariesOf(sp, walls): each space's boundaries with its neighbours in the piece (v1, section 5), from the faces its
  // boxes share with theirs. The core's node is (zone 2 + side) 2 + layer (layer 0 below E deck). walls[z] = { x, top }:
  // the bulkhead between zone z and z + 1, at x, its top deck's height there (her frame; from the core's BULKHEADS and
  // deckZ: the caller's, so that this library needs no core). Kinds:
  //   'bulkhead'  across a bulkhead below its top deck (watertight)
  //   'joiner'    across it above its top deck (non-watertight joiner work)
  //   'deck'      E deck, between a space's two layers; a is the lower
  // Port and starboard of one compartment are open to each other in the core (its cross connections): no boundary. The
  // shell is failSpaces' (to the sea). Each boundary: { kind, a, b, A (m2), px py pz (its centroid), nx ny nz (its normal,
  // a to b), qx qy qz and hx hy hz (the centre and half extents of its bounding box along her axes) }, in a fixed order
  function boundariesOf(sp, walls) {
    const out = [], byNode = new Map();
    for (let k = 0; k < sp.n; k++) byNode.set(sp.node[k], k);
    const add = (kind, a, b, axis, sgn, A, cx, cy, cz, ex, ey, ez) => {
      const key = kind + ':' + a + ':' + b;
      let r = out.find(o => o.key === key);
      if (!r) out.push(r = { key, kind, a, b, A: 0, mx: 0, my: 0, mz: 0, lo: [Infinity, Infinity, Infinity], hi: [-Infinity, -Infinity, -Infinity], axis, sgn });
      r.A += A; r.mx += A * cx; r.my += A * cy; r.mz += A * cz;
      const c = [cx, cy, cz], e = [ex, ey, ez];
      for (let d = 0; d < 3; d++) { if (c[d] - e[d] < r.lo[d]) r.lo[d] = c[d] - e[d]; if (c[d] + e[d] > r.hi[d]) r.hi[d] = c[d] + e[d]; }
    };
    const ov = (c1, w1, c2, w2) => Math.min(c1 + w1, c2 + w2) - Math.max(c1 - w1, c2 - w2);
    for (let k = 0; k < sp.n; k++) {
      const nd = sp.node[k], zone = nd >> 2, side = (nd >> 1) & 1, layer = nd & 1;
      // across the bulkhead aft of this zone, the same side and layer
      const ja = byNode.get(((zone + 1) * 2 + side) * 2 + layer);
      if (ja !== undefined && zone < walls.length) {
        const xw = walls[zone].x, zt = walls[zone].top;
        for (let q = sp.start[k], q1 = q + sp.count[k]; q < q1; q++) {
          if (Math.abs(sp.bx[q] - sp.wx[q] - xw) > 1e-6) continue;
          for (let q2 = sp.start[ja], q3 = q2 + sp.count[ja]; q2 < q3; q2++) {
            if (Math.abs(sp.bx[q2] + sp.wx[q2] - xw) > 1e-6) continue;
            const oy = ov(sp.by[q], sp.wy[q], sp.by[q2], sp.wy[q2]); if (!(oy > 1e-9)) continue;
            const z0 = Math.max(sp.bz[q] - sp.wz[q], sp.bz[q2] - sp.wz[q2]), z1 = Math.min(sp.bz[q] + sp.wz[q], sp.bz[q2] + sp.wz[q2]);
            if (!(z1 - z0 > 1e-9)) continue;
            const yc = 0.5 * (Math.max(sp.by[q] - sp.wy[q], sp.by[q2] - sp.wy[q2]) + Math.min(sp.by[q] + sp.wy[q], sp.by[q2] + sp.wy[q2]));
            // split at the bulkhead's top deck: watertight below it, joiner work above
            const parts = [[z0, Math.min(z1, zt), 'bulkhead'], [Math.max(z0, zt), z1, 'joiner']];
            for (const [p0, p1, kind] of parts) if (p1 - p0 > 1e-9) add(kind, k, ja, 0, -1, oy * (p1 - p0), xw, yc, 0.5 * (p0 + p1), 0, 0.5 * oy, 0.5 * (p1 - p0));
          }
        }
      }
      // E deck, from the lower layer to the upper of the same compartment and side
      const ju = layer === 0 ? byNode.get(nd + 1) : undefined;
      if (ju !== undefined) {
        for (let q = sp.start[k], q1 = q + sp.count[k]; q < q1; q++) {
          const ztop = sp.bz[q] + sp.wz[q];
          for (let q2 = sp.start[ju], q3 = q2 + sp.count[ju]; q2 < q3; q2++) {
            if (Math.abs(sp.bz[q2] - sp.wz[q2] - ztop) > 1e-6) continue;
            const ox = ov(sp.bx[q], sp.wx[q], sp.bx[q2], sp.wx[q2]); if (!(ox > 1e-9)) continue;
            const oy = ov(sp.by[q], sp.wy[q], sp.by[q2], sp.wy[q2]); if (!(oy > 1e-9)) continue;
            const xc = 0.5 * (Math.max(sp.bx[q] - sp.wx[q], sp.bx[q2] - sp.wx[q2]) + Math.min(sp.bx[q] + sp.wx[q], sp.bx[q2] + sp.wx[q2]));
            const yc = 0.5 * (Math.max(sp.by[q] - sp.wy[q], sp.by[q2] - sp.wy[q2]) + Math.min(sp.by[q] + sp.wy[q], sp.by[q2] + sp.wy[q2]));
            add('deck', k, ju, 2, 1, ox * oy, xc, yc, ztop, 0.5 * ox, 0.5 * oy, 0);
          }
        }
      }
    }
    return out.map(r => ({ kind: r.kind, a: r.a, b: r.b, A: r.A, px: r.mx / r.A, py: r.my / r.A, pz: r.mz / r.A,
      nx: r.axis === 0 ? r.sgn : 0, ny: r.axis === 1 ? r.sgn : 0, nz: r.axis === 2 ? r.sgn : 0,
      qx: 0.5 * (r.hi[0] + r.lo[0]), qy: 0.5 * (r.hi[1] + r.lo[1]), qz: 0.5 * (r.hi[2] + r.lo[2]),
      hx: 0.5 * (r.hi[0] - r.lo[0]), hy: 0.5 * (r.hi[1] - r.lo[1]), hz: 0.5 * (r.hi[2] - r.lo[2]) }));
  }
  // failBoundaries(sp, st, ops, bnd, R, r, K, t, events): section 5's fuller form (Z1, M2 4d). Each boundary of
  // boundariesOf holds until the pressure across it (its greatest over the face at her pose: at its ends and where a free
  // surface crosses it) passes its strength as a head of sea water, each a bet in v1's band:
  //   a bulkhead K.headBulkhead [15 m; v1's 8 to 30; the wrong side's 0.6 to 0.8 not taken: which side each bulkhead's
  //   stiffeners face is not read]; joiner work K.headJoiner [2 m; v1's 1 to 3.5]; E deck loaded from below
  //   K.headDeckBelow [5 m; v1's 2 to 10] and from above K.headDeckAbove [15 m, a bulkhead's: v1's table has none].
  // A space gives way once, at its weakest link: of the boundaries pressed into it, and its shell, the one loaded furthest
  // past its strength (v1: the space floods at once through the failed boundary; judged pass by pass, a sub-step's flow
  // through the first opening would leave its load on the rest, and its one implosion would be logged again and again).
  // A boundary between two spaces can still give way from the other side, as that space's failure. The
  // shell's load is failSpaces' (its air's lag behind the sea at its free surface), its strength K.headShell [40 m; v1's
  // 20 to 60]: it opens to the sea as failSpaces' does. A boundary that gives way opens for good between its two spaces
  // over K.failShare of its own area (an upright face as high as it; E deck level), so the space floods from its
  // neighbour, or two air spaces share their air. Each failure is logged as failSpaces' are, once for the space: its
  // depth its free surface's, its energy the pressure across times its air, and the boundary's kind. Returns the count.
  // K.failOnce (Z1, 2026-11-24, on the stern-work team's finding): 'space' (or none), the rule above, to the bit: a space
  // gives way once and then holds at any load, even its shell 46 to 67 m behind the sea; 'boundary', each boundary and
  // each space's shell give way once: a space that has given way can give way again at another link, judged pass by
  // pass on the loads as they then stand (so a first opening that relieves the load leaves the rest standing), each
  // failure logged. st.sfailed: the shells given way, under 'boundary' (K.torn's shells mark it too)
  function failBoundaries(sp, st, ops, bnd, R, r, K, t, events) {
    K = K || {};
    const hb = K.headBulkhead === undefined ? 15 : K.headBulkhead, hj = K.headJoiner === undefined ? 2 : K.headJoiner;
    const hdb = K.headDeckBelow === undefined ? 5 : K.headDeckBelow, hda = K.headDeckAbove === undefined ? 15 : K.headDeckAbove;
    const hs = K.headShell === undefined ? 40 : K.headShell, share = K.failShare === undefined ? 0.5 : K.failShare, RG = RHO_W * G;
    const u = [R[6], R[7], R[8]], zr = r[2];
    st.bfailed = st.bfailed || new Uint8Array(bnd.length);
    st.failed = st.failed || new Uint8Array(sp.n);
    const each = K.failOnce === 'boundary';
    if (each) st.sfailed = st.sfailed || new Uint8Array(sp.n);
    const sd = new Array(sp.n);
    const sideOf = (k) => {
      if (!sd[k]) { water(sp, k, u, zr, st.W[k], st.lev[k], SL); st.lev[k] = SL.level; const Va = sp.V[k] - st.W[k]; sd[k] = { zw: SL.level, pa: airP(sp, st, k, Va, SL.level), Va }; }
      return sd[k];
    };
    // each space's weakest link: the largest load over strength past 1, which boundary (-1 its shell), the load
    const ratio = new Float64Array(sp.n).fill(1), pick = new Int32Array(sp.n).fill(-2), load = new Float64Array(sp.n);
    for (let i = 0; i < bnd.length; i++) {
      if (st.bfailed[i]) continue;
      const B = bnd[i], sa = sideOf(B.a), sb = sideOf(B.b);
      const zc = zr + u[0] * B.qx + u[1] * B.qy + u[2] * B.qz, e = (u[0] < 0 ? -u[0] : u[0]) * B.hx + (u[1] < 0 ? -u[1] : u[1]) * B.hy + (u[2] < 0 ? -u[2] : u[2]) * B.hz;
      let dmax = -Infinity, dmin = Infinity;
      for (const z of [zc - e, zc + e, sa.zw, sb.zw]) {
        if (z < zc - e - 1e-9 || z > zc + e + 1e-9) continue;
        const d = sideP(sb, z) - sideP(sa, z);
        if (d > dmax) dmax = d;
        if (d < dmin) dmin = d;
      }
      // its strength against b pressing into a, and against a pressing into b (E deck: a is the lower space)
      const vsB = B.kind === 'deck' ? hda : (B.kind === 'joiner' ? hj : hb), vsA = B.kind === 'deck' ? hdb : vsB;
      const ra = dmax / (vsB * RG), rb = -dmin / (vsA * RG);
      if (ra > ratio[B.a] && (each || !st.failed[B.a])) { ratio[B.a] = ra; pick[B.a] = i; load[B.a] = dmax; }
      if (rb > ratio[B.b] && (each || !st.failed[B.b])) { ratio[B.b] = rb; pick[B.b] = i; load[B.b] = -dmin; }
    }
    for (let k = 0; k < sp.n; k++) {
      if (each ? st.sfailed[k] : st.failed[k]) continue;
      const Va = sp.V[k] - st.W[k];
      if (!(Va > 1e-6 * sp.V[k])) continue;
      const s = sideOf(k), lag = (P_ATM + RG * Math.max(0, -s.zw) - P_ATM * st.a[k] / Va) / RG;
      if (lag / hs > ratio[k]) { ratio[k] = lag / hs; pick[k] = -1; load[k] = lag * RG; }
    }
    let n = 0;
    for (let k = 0; k < sp.n; k++) {
      const i = pick[k];
      if (i === -2) continue;
      let kind;
      if (i === -1) { ops.push(shellOpening(sp, k, share)); kind = 'shell'; if (each) st.sfailed[k] = 1; }
      else {
        if (st.bfailed[i]) continue;                                  // its other side took it first, this pass
        const B = bnd[i], A = share * B.A, L = B.kind === 'deck' ? Math.sqrt(A) : 2 * B.hz;
        ops.push({ c: -1, kind: 'failed ' + B.kind, a: B.a, b: B.b, px: B.px, py: B.py, pz: B.pz, nx: B.nx, ny: B.ny, nz: B.nz, A, L, Cd: 0.6, open: true });
        st.bfailed[i] = 1; kind = B.kind;
      }
      st.failed[k] = 1;                                               // it has given way: once, as the first form's
      n++;
      const s = sd[k];
      if (events) events.push({ t, id: 'report', node: sp.node[k], depth: -s.zw, energy: load[k] * (s.Va > 0 ? s.Va : 0), boundary: kind });
    }
    return n;
  }
  function refresh(sp, st, side, k) {
    const Va = sp.V[k] - st.W[k], s = side[k];
    s.Va = Va; s.pa = airP(sp, st, k, Va, s.zw);
  }
  // a space's pressure over its water: its air's (isothermal, a at one atmosphere in Va), never below water's vapour
  // pressure (a space with room and no air is a void the water fills); with no room above its water, the sea's at its
  // free surface (Z1, 4c: it is full because the sea's head filled it. The stand-in of one atmosphere made a full space
  // at depth a sink its neighbours' implicit steps counted on, so their air was squeezed past the sea's by the share
  // that could not go in, to 400 to 1,800 bar where the sea gave 150 to 220, and stranded in no room; and a void's 0 Pa
  // gave the law no density, so NaN)
  const P_VAP = 705;   // Pa, water's vapour pressure at 2 deg C [textbook]
  function airP(sp, st, k, Va, zw) {
    if (!(Va > 1e-9 * sp.V[k])) return P_ATM + RHO_W * G * Math.max(0, -zw);
    const p = P_ATM * st.a[k] / Va;
    return p > P_VAP ? p : P_VAP;
  }

  return {
    boxMoments, spacesOf, below, bracket, water, stateOf, openingsOf, stepPiece, heldBySea, doorsOf, doorsStep, weatherOf, weatherStep, failSpaces, shellOpening, boundariesOf, failBoundaries,
    // the exchange through one opening, and one space's air taken implicitly (e84's, ported: see above)
    flow: { G, RHO_W, P_ATM, RHO_A0, SIGMA, CHOKE, DEFAULTS, rhoAir, sideP, meanSqrt, lawP, floodingPair, intercepts, exchange, sideStiffness, limitOneWay, stepSpace },
  };
});

/*
 * The calls for help: the wireless as a load on the ship's plant, the distress call, the rockets and the Morse lamp as
 * orders, and the other ships as places with speeds, operators' hours and an arrival rule. Step 9 of
 * docs/BRAINSTORM_the_whole_night_v1_2026-11-17.md (section 6).
 *
 * A reader of the watch (core/night.js, "readers"): attached to every watch, stepped after the model's own step. Its
 * state is sim.world. It reads the flooding, the motion and the plant and writes into none of them; it pushes nothing
 * into sim.events (what the bridge is told is its own list, sim.world.lines). It draws nothing at random.
 *
 * Numbers: docs/research/RESEARCH_wireless_rockets_ships_clock_v1_2026-11-17.md ("the note", by section; its section 10
 * is this file's specification) and docs/research/RESEARCH_ship_systems_plant_v1_2026-11-16.md ("the plant note").
 * Tags as there: [read] in a source the note read, [derived] arithmetic on those, [bet] no source; [measured] this
 * model's own figure, checked by tools/world_tests.js.
 *
 * Time. T is minutes after the touch, which is 11:40 pm by her own clock (apparent time, ATS). Her witnesses gave ATS;
 * the other ships' operators logged New York time; the two are joined by her offset from New York, which is disputed:
 * 2 h 02 min (Halpern, the modern reading: the default) or 1 h 50 min (implied by the British Report: a switch). It moves
 * every New York event 12 minutes (the note, sections 2.1 and 7; Conflicts 1, 4 and 7).
 *
 * Settings of the night, in its spec (spec.world), so that a replay and a snapshot carry them; history when absent:
 *   californian  her distance in nautical miles: 18 (the 1992 reappraisal, the default) or 9 (the Court, 1912)
 *   acts         whether her watch acts on what it sees of Titanic (her rockets, her Morse lamp): false, as on the night
 *   clock        '2:02' (the default) or '1:50'
 *   conduct      true: with no order from the player the bridge does as it did in 1912; false: nothing unless ordered
 *
 * Orders (logged in the watch's log like the helm's; each prefixed help: so that no two readers collide):
 *   help:call 'cqd'      make the distress call now (with no order: the captain's at T 25, the first call at T 47)
 *   help:rocket 'socket' fire a socket signal: 36 in the locker aft, the box to be fetched first (with no order: eight
 *                        from T 66)
 *   help:lamp 'cqd'      work the Morse lamp at the nearest ship's light
 * World.call(sim), World.rocket(sim), World.lamp(sim) give them through core/night.js, as Night.helm gives the helm's.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../core.js'), require('../night.js'), require('../systems.js'));
  else root.TitanicWorld = factory(root.TitanicCore, root.TitanicNight, root.TitanicSystems);
})(typeof self !== 'undefined' ? self : this, function (C, N, Sys) {
  'use strict';
  if (!C || !N || !N.reader) return null;
  const NM = 1852, KN = NM / 3600, FT = 0.3048, DEG = Math.PI / 180;
  const hm = (h, m) => h * 60 + m;
  const TOUCH = hm(23, 40);                 // the touch: 11:40 pm by her clock [read: the British Report; Pitman]

  // ------------------------------------------------------------------ the clocks (the note, sections 2.1 and 7)
  // minutes each ship's clock ran ahead of New York's. Titanic: 2 h 02 min from her noon longitude of 14 April, her
  // clocks not changed that night (Halpern; Pitman) [read]; 1 h 50 min implied by the British Report [derived there].
  // Carpathia: NY + 1:57 (Halpern) on the first reading, NY + 1:50 (Rostron) on the second [read]. Californian: NY + 1:50
  // (Lord) [read]; 12 minutes behind Titanic on the first reading, the same clock on the second (Conflicts 7).
  const CLOCKS = {
    '2:02': { titanic: 122, carpathia: 117, californian: 110, name: 'her clock 2 h 02 min ahead of New York (Halpern)' },
    '1:50': { titanic: 110, carpathia: 110, californian: 110, name: 'her clock 1 h 50 min ahead of New York (the British Report)' },
  };
  const tNY = (ck, n) => n + ck.titanic - TOUCH;                     // T of a New York time (minutes after midnight, 14 April)
  const tCarp = (ck, c) => c - ck.carpathia + ck.titanic - TOUCH;    // T of a time on Carpathia's clock
  const tCal = (ck, c) => c - ck.californian + ck.titanic - TOUCH;   // T of a time on Californian's clock

  // ------------------------------------------------------------------ the call (the note, sections 2.2 and 10.2)
  // New York times as logged [read: the Cape Race log; the Mount Temple's, Olympic's and Baltic's logs; Cottam]
  const NYT = {
    cqd: hm(22, 25),       // the first CQD, with the captain's position, struck a berg
    position: hm(22, 35),  // Boxhall's corrected position: ten minutes after the first
    noise: hm(22, 36),     // "Sinking; cannot hear for noise of steam" (the British Report's 12:26, moved to New York)
    sos: hm(22, 55),       // the first SOS
    engine: hm(23, 41),    // "engine room flooded" (11:41-11:45)
    come: hm(23, 55),      // to Carpathia, her last: come as quickly as possible, the engine room filling up to the boilers
  };
  // With no order from the player, on a night whose touch let the sea in, the bridge does as it did in 1912:
  const CONDUCT = {
    order: 25,             // T: the captain tells the operators to get assistance, about ten minutes after Bride turned out
                           // at about five to twelve (Bride, US Day 10) [read; T derived]; the call waited for the position
    // the socket signals, about eight, one every 8.9 minutes from T 66 [derived: the note, 10.4, from the first at T 65-67
    // and the last at T 125-132 (Titanic's witnesses, ATS: the same on either clock)]
    rockets: [66, 75, 84, 93, 102, 111, 119, 128],
  };

  // ------------------------------------------------------------------ the set (the note, sections 1 and 10.3)
  const PDYN = Sys && Sys.PLANT ? Sys.PLANT.pDynamo : 0.3;   // the plant's own: the dynamos stop below this share of working pressure
  // F2 (NH15's design, U0; the mainline's ruling, 2026-11-23): the operators' "Engine room flooded" goes out once boiler
  // room 3's fires are out. Their "engine room" is read as the boiler rooms [bet]: the record's next message has it
  // "filling up to the boilers", and her own engine rooms (the plant's `re` and `te`) flood only near her end. The room
  // is found by its name, not by its place in the plant's list
  const ENGINE_ROOM = Sys && Sys.PLANT ? Sys.PLANT.rooms.findIndex((r) => r.name === 'Boiler room 3') : 3;
  const SET = {
    // the operating room on the boat deck, at the after end of the officers' deckhouse (Bride, BI 16346-16355) [read];
    // x in the ship's frame: G26's places table's (tools/places_table.js, 'wireless': just abaft funnel 1's casing, from
    // R3's row Bt-10 and the topsides) [bet]; it was 50 [bet: about 22 m abaft the bridge's front at x 72]
    roomX: 48.0,
    vBus: 100,             // V: the DC bus the 5 kW motor generator ran from [derived: the note, 10.3; the plant note]
    pFull: 0.5,            // share of working pressure down to which the dynamos' governors hold the bus at full voltage;
                           // below it the voltage falls in a line to vSpark at the plant's own stopping point [bet, this file's]
    vRange: 90,            // V: full reach at or above this; the reach falls in proportion to the voltage below it [bet: the note, 10.3]
    vSpark: 70,            // V: no usable spark below this [bet: the note, 10.3]
    night: 1500,           // nm: the reach at night at full power [read: the note, section 1 (1,500 to 2,000); every ship here is inside it]
    battery: 150,          // nm: the reach on the storage battery in the wireless cabin [bet: the note's 100 to 200; NOT FOUND for Titanic]
    batteryHours: 6,       // its life [read: the plant note, the battery-and-coil set, "at least 6 h"]
    changeover: 2,         // min for a man to throw the change-over to the emergency dynamos, or to the battery [bet: the note, 10.3]
  };
  // Who throws the battery in: the operator at the key, when he has the call to make and finds the set without current
  // [bet]. The operators stay at the key until the sea reaches the room (Phillips went back to it after the captain had
  // released them: the note, 2.2) [read, bet].

  // ------------------------------------------------------------------ rockets and the lamp (the note, sections 5 and 10.4)
  const ROCKETS = {
    stock: 36,             // socket signals carried [read, secondary: THS; an equipment list in a forum post]
    fetch: 10,             // min to bring the box from the locker under the poop (Rowe fetched them from aft) [bet: the note,
                           // 10.4: the earliest first rocket about T 10-15]
    reload: 1,             // min between two from the one socket [bet: the firers' estimate of the interval was about five]
    burstFt: 600,          // ft: the burst ["several hundred feet" (Lightoller) read; 600 ft a secondary figure]
    lum: 25,               // nm: a burst's luminous range on a clear dark night [bet: the note, 10.4]
    report: 5,             // nm: its report heard within this [bet: the note, 10.4; NOT FOUND]
    socketX: 65.9,         // m: the socket in the starboard rail by emergency boat No. 1 [read: Boxhall], between No. 1's davits at
                           // +65.72 and +66.18 [read: Read's davit article; G26's places table, 'socket.stbd'] [bet: between them]; it was 62
  };
  const LAMP = { nm: 10 };          // read within this by a watch that is watching [read: Lord's claim of his own lamp]
  // a ship's lights seen from Titanic's bridge: her masthead light [bet: 100 ft] above the horizon of a 65.5 ft eye [derived:
  // the core's boat deck, 92.25 ft above the keel, less the night's mean draft, 9.83 m, plus 5.5 ft] is 21.2 nm off, so the
  // light's own range decides: 17 nm [read: Halpern's estimate for Titanic's masthead light]
  const LIGHTS = { nm: 17 };
  const horizon = (H, h) => 1.17 * (Math.sqrt(H) + Math.sqrt(h));    // nm: a light H ft up on the horizon of an eye h ft up [read: the note, 5.1]

  // ------------------------------------------------------------------ the other ships (the note, sections 3, 4 and 10.1)
  // Places from the wreck: bearing (true, deg) and distance (nm); speed (kn, a mean that includes her ice); delay (min from
  // hearing to under way at that speed); eye (ft, her bridge, for seeing a rocket). Rules for the model (the note, 10.1):
  // a rescuer steers for where Titanic is (the position she was sent, and where her lights and rockets then lead her);
  // if Titanic moves, the distance is from where she lies now. Arrival is not rescue.
  // Operators: the others were listening throughout [bet: the note, 10.3].
  const CQD_POS = { brg: 281, d: 13.1 };                  // Boxhall's position from the wreck [derived: the note, Conflicts 2]
  const SHIPS = [
    // heard by her one operator at 10:35 NY, who had called Titanic himself (T 57) [read]; she turned at 12:35 her time and
    // stopped among the boats at 4:00 (T 265): 46.5 nm [derived: 46.9 to the wreck, 45.9 to the boats at 4 a.m.] in 205 min,
    // 13.6 kn [derived]; bearing S 44 E from the wreck [derived]
    { id: 'carpathia', name: 'Carpathia', brg: 136, d: 46.5, kn: 13.6, delay: { '2:02': 3, '1:50': 10 }, eye: 55,
      // his watch: about to turn in at 10:35 NY; asleep from about 10:40-10:45 [bet: the note, 10.3]. Before 10:35 he was
      // taking Cape Cod's news and waiting for the Parisian (Cottam, BI 17085-17107) [read]; when that began is not in the
      // note [bet: 10:15 NY, after T 5, so that a call made at once is heard at once, as the note takes it in 10.5 (a)]
      offNY: hm(22, 45), busyNY: [hm(22, 15), hm(22, 35)] },
    // stopped in field ice at 10:21 pm her time, 22.8 nm N 19 W of the wreck on her own reckoning [read, derived]; her
    // distance is a setting (spec.world.californian). Her operator turned in at 11:35 her time (Evans, US; 11:30 at the
    // British inquiry) [read]. On a call heard or a signal acted on: 10 min to rouse the master and ring the engines [bet],
    // then the ice round her, 1.5 nm [bet: the note's d - 1.5 in open water] in 30 min [bet: 15-60, anchored on her morning],
    // or 15 min at the Court's distance, where the Court found the ice loose, 2-3 nm [read], then 13 kn [read: 12.5-13 full;
    // 13-13.5 on her morning run]. Eye 45 ft [read: Halpern's].
    { id: 'californian', name: 'Californian', brg: 341, d: 18, kn: 13, delay: { '2:02': 10, '1:50': 10 }, eye: 45,
      offCal: hm(23, 35), ice: { nm: 1.5, mins: 30, courtNm: 10, courtMins: 15 } },
    // answered the first CQD (10:25 NY) and reversed at 10:40 (15 min) [read]; 49.5 nm S 65 W of the position she was sent
    // [read: Moore; derived], so 60.6 nm from the wreck [derived]; about 11.5 kn [read]; met ice at about 3:00 her time and
    // stopped about 14 nm short [read]: here, after 35.5 nm of her run [derived], and she does not come on
    { id: 'mountTemple', name: 'Mount Temple', from: CQD_POS, brg: 245, d: 49.5, kn: 11.5, delay: { '2:02': 15, '1:50': 15 }, eye: 55, stopAfter: 35.5 },
    // 154 nm S 36 W [read; derived 148-154], 12.5 kn listed [read]; delay [bet]
    { id: 'frankfurt', name: 'Frankfurt', brg: 216, d: 154, kn: 12.5, delay: { '2:02': 15, '1:50': 15 }, eye: 55 },
    // SSW; 100 nm by her master [read] (70 at 12:25 NY in her own message; 106-107 by her operator: Conflicts 11); 13 kn [read]
    { id: 'birma', name: 'Birma', brg: 202.5, d: 100, kn: 13, delay: { '2:02': 15, '1:50': 15 }, eye: 55 },
    // about 170 nm N [read: the US Report, Cape Race]; 18 kn listed [read]
    { id: 'virginian', name: 'Virginian', brg: 0, d: 170, kn: 18, delay: { '2:02': 15, '1:50': 15 }, eye: 55 },
    // 243 nm E by her bridge [read] (SE in the US Report: Conflicts 13); 17.5 kn [derived: 134 nm west in about 7.5 h]
    { id: 'baltic', name: 'Baltic', brg: 90, d: 243, kn: 17.5, delay: { '2:02': 15, '1:50': 15 }, eye: 55 },
    // 505 nm W by S [read: her log; Haddock]; 22.7 kn [derived: 505 to 310 nm between 11:10 pm and 7:45 am NY]
    { id: 'olympic', name: 'Olympic', brg: 258.75, d: 505, kn: 22.7, delay: { '2:02': 15, '1:50': 15 }, eye: 55 },
  ];
  // Where the wreck lies from her place at the touch [measured: the 1912 watch on its own orders founders 1,295.7 m north
  // and 7,700.4 m west of where she was on the step of the touch, T 157.2; tools/world_tests.js checks it]. The note's
  // distances are to the wreck; this model's 1912 ship does not stop where she struck but runs on 4.2 nm after the touch
  // (6.75 before M7, when a stopped screw dragged nothing: 2,202.7 m north and 12,317.3 m west), so the other ships are
  // placed from her wreck, and the 1912 night brings Carpathia to it at the note's minute. A night that stops sooner lies
  // nearer them (the report says how much).
  // remeasured at G12's switch (D98): the 1912 watch now ends at her hand-over, the break's onset (T 156.46), so the wreck
  // is where she lies then; at her flag (the 'flag' what-if, T 163.47) she is 74 m on, at 1,323.4 m N and 7,816.3 m W
  // (remeasured at the calibration epoch's landing, D4, D90; 1,295.7 and 7,700.4 before it)
  const WRECK_1912 = { X: 1306.0, Y: -7744.0 };

  // ------------------------------------------------------------------ settings
  function settings(spec) {
    const w = (spec && spec.world) || {};
    return {
      californian: typeof w.californian === 'number' && isFinite(w.californian) && w.californian >= 1 && w.californian <= 40 ? w.californian : 18,
      acts: w.acts === true,
      clock: Object.prototype.hasOwnProperty.call(CLOCKS, w.clock) ? w.clock : '2:02',
      conduct: w.conduct !== false,
    };
  }

  // ------------------------------------------------------------------ attach
  function attach(sim, spec) {
    const o = settings(spec), ck = CLOCKS[o.clock];
    sim.world = {
      o, ck, clock0: spec && spec.clock0 !== undefined ? spec.clock0 : TOUCH * 60,
      anchored: false, X0: 0, Y0: 0, distress: false,
      set: { supply: 'main', volts: SET.vBus, reach: SET.night, working: true, why: 'on the main dynamos', room: false, emSince: -1,
        deadSince: -1, battery: -1, wasWorking: true },
      call: { order: -1, by: null, due: -1, first: -1, sent: {} },
      rockets: { fired: 0, pending: 0, fetched: -1, last: -1e9, times: [], ci: 0, mine: false },
      lamp: { worked: 0, times: [], lit: true, why: 'on the main dynamos' },
      F: {},                                                         // a frame reused each step (the wireless room's height)
      ships: SHIPS.map(s => {
        const d = s.id === 'californian' ? o.californian : s.d, ice = s.ice ? (d <= s.ice.courtNm ? s.ice.courtMins : s.ice.mins) : 0;
        // her operator's watch in T on this clock: off from offT; not listening from busy[0] to busy[1]
        const offT = s.offNY !== undefined ? tNY(ck, s.offNY) : (s.offCal !== undefined ? tCal(ck, s.offCal) : Infinity);
        const busy = s.busyNY ? [tNY(ck, s.busyNY[0]), tNY(ck, s.busyNY[1])] : null;
        return { id: s.id, name: s.name, kn: s.kn, delay: s.delay[o.clock], eye: s.eye, stopAfter: s.stopAfter || 0, offT, busy,
          iceNm: s.ice ? s.ice.nm : 0, iceMin: ice, d0: d, brg0: s.brg, from: s.from || null,
          X: 0, Y: 0, state: 'none', how: null, tHeard: -1, tGo: -1, tAlong: -1, tStop: -1, run: 0, iceRun: 0,
          seen: 0, tSeen: -1, lampRead: 0, inSight: false, tSight: -1, told: false, nm: 0, nmHeard: null };
      }),
      lines: [],
    };
    return sim.world;
  }
  // the other ships set down on the earth, from where she is now (the touch, or the first order of this reader's)
  function anchor(sim, W) {
    const m = sim.mo; if (!m || W.anchored) return;
    W.anchored = true; W.X0 = m.X; W.Y0 = m.Y;
    const wx = m.X + WRECK_1912.X, wy = m.Y + WRECK_1912.Y;
    for (const s of W.ships) {
      let x = wx, y = wy;
      if (s.from) { x += s.from.d * NM * C.cos(s.from.brg * DEG); y += s.from.d * NM * C.sin(s.from.brg * DEG); }
      s.X = x + s.d0 * NM * C.cos(s.brg0 * DEG); s.Y = y + s.d0 * NM * C.sin(s.brg0 * DEG);
    }
    for (const s of W.ships) s.nm = dist(sim, s) / NM;
  }

  // ------------------------------------------------------------------ helpers
  const tRef = (sim) => (sim.night && sim.night.tTouch >= 0 ? sim.night.tTouch : 0);
  const Tof = (sim, t) => (t - tRef(sim)) / 60;                     // minutes after the touch (before one: after the watch began)
  const tOfT = (sim, T) => tRef(sim) + 60 * T;
  function dist(sim, s) { const m = sim.mo, dx = s.X - m.X, dy = s.Y - m.Y; return Math.sqrt(dx * dx + dy * dy); }
  function bearing(sim, s) { const m = sim.mo; let b = C.atan2(s.Y - m.Y, s.X - m.X) / DEG; if (b < 0) b += 360; return b; }
  function clockText(W, t) {
    const s = ((Math.round(W.clock0 + t) % 86400) + 86400) % 86400;
    let h = Math.floor(s / 3600); const mm = Math.floor(s % 3600 / 60), ap = h >= 12 ? 'pm' : 'am';
    h = h % 12; if (h === 0) h = 12;
    return h + ':' + String(mm).padStart(2, '0') + ' ' + ap;
  }
  const miles = (nm) => (nm < 9.5 ? nm.toFixed(1) : String(Math.round(nm)));
  function side(rel) {                                               // a bearing off her bow, in words
    const a = Math.abs(rel), s = rel < 0 ? 'port' : 'starboard';
    if (a < 6) return 'right ahead'; if (a > 174) return 'right astern';
    return a < 45 ? 'on the ' + s + ' bow' : (a < 135 ? 'on the ' + s + ' beam' : 'on the ' + s + ' quarter');
  }
  function relBearing(sim, s) { let r = bearing(sim, s) - sim.mo.psi / DEG; r = ((r % 360) + 540) % 360 - 180; return r; }
  function line(sim, W, kind, text, who) { W.lines.push({ t: sim.t, T: Tof(sim, sim.t), kind, who: who || null, text }); }
  const awash = (sim, x, z) => C.worldZ(C.poseFrame(sim, sim.zO, sim.pitch, sim.roll, sim.world.F), x, 0, z) < 0;
  const bridgeDry = (sim) => !(sim.markT && sim.markT.bridge >= 0);
  // the Morse lamps (F9, NH15: docs/DESIGN_the_living_ship_v1_2026-11-23.md): joined to the emergency circuit "by
  // change-over switches", with the mast, side and stern lights, the bridge lights, the telegraph lamps and the Marconi
  // set [read: the British Report, "Electrical Installation", through the plant note]. On the main circuit while the main
  // dynamos run; when they stop and the emergency sets still run, dark until a man throws the change-over (SET.changeover,
  // the set's own bet, counted from the plant's own mainDark); then on the emergency sets while they run
  function lampState(sim) {
    const P = sim.plant;
    if (!P) return { lit: true, why: 'on the main dynamos' };
    if (P.power) return { lit: true, why: 'on the main dynamos' };
    if (!P.emergency) return { lit: false, why: P.broken ? 'no current: her steam mains have given way' : 'no current: the dynamos have stopped' };
    const t0 = P.events.mainDark;
    if (t0 === undefined || sim.t < t0 + SET.changeover * 60) return { lit: false, why: 'no current until the change-over to the emergency dynamos is thrown' };
    return { lit: true, why: 'on the emergency dynamos, by the change-over' };
  }
  const current = (sim) => lampState(sim).lit;

  // the bus voltage from the steam (the dynamos', main and emergency alike: they share the plant's stopping point)
  function voltsOf(p) {
    if (p >= SET.pFull) return SET.vBus;
    if (p <= PDYN) return 0;
    return SET.vSpark + (SET.vBus - SET.vSpark) * (p - PDYN) / (SET.pFull - PDYN);
  }
  function reachOf(v) { return v >= SET.vRange ? SET.night : (v >= SET.vSpark ? SET.night * v / SET.vRange : 0); }

  // ------------------------------------------------------------------ the set, each step
  function setStep(sim, W) {
    const S = W.set, P = sim.plant, t = sim.t;
    if (!S.room && awash(sim, SET.roomX, C.deckZ('Boat', SET.roomX))) S.room = true;   // the sea in the wireless room: for good
    let bus = 'main', v = SET.vBus;
    if (P) {
      if (P.power) { bus = 'main'; S.emSince = -1; } else if (P.emergency) { bus = 'emergency'; if (S.emSince < 0) S.emSince = t; } else { bus = 'none'; S.emSince = -1; }
      v = bus === 'none' ? 0 : voltsOf(P.p);
    }
    let supply = bus, why = bus === 'main' ? 'on the main dynamos' : 'on the emergency dynamos', reach = reachOf(v);
    if (bus === 'emergency' && t < S.emSince + SET.changeover * 60) { supply = 'none'; why = 'no current: the main dynamos have stopped and the change-over to the emergency dynamos is being thrown'; reach = 0; }
    if (supply !== 'none' && reach <= 0) { supply = 'none'; why = 'no spark: the dynamos give ' + Math.round(v) + ' V'; }
    if (supply === 'none') {
      // the operator throws in the battery when he has the call to make and finds the set dead
      if (W.call.due >= 0 && !S.room) { if (S.deadSince < 0) S.deadSince = t; if (S.battery < 0 && t >= S.deadSince + SET.changeover * 60) S.battery = t; }
      if (S.battery >= 0 && t < S.battery + SET.batteryHours * 3600) { supply = 'battery'; v = 0; reach = SET.battery; why = 'on its battery'; }
      else if (bus === 'none') why = S.battery >= 0 ? 'no current: the battery is spent' : (P && P.broken ? 'no current: her steam mains have given way' : 'no current: the dynamos have stopped for want of steam');
    } else S.deadSince = -1;
    if (S.room) { supply = 'none'; reach = 0; why = 'the sea is in the wireless room'; }
    S.supply = supply; S.volts = supply === 'battery' ? null : v; S.reach = reach; S.why = why; S.working = supply !== 'none';
    if (S.working && v > 0 && v < SET.vRange && supply !== 'battery') S.why = why + ', the voltage falling (' + Math.round(v) + ' V)';
  }

  // ------------------------------------------------------------------ the call, the messages, the bridge's own conduct
  function callStep(sim, W, T) {
    const c = W.call, S = W.set, t = sim.t, ck = W.ck;
    if (W.o.conduct && W.distress) {
      if (c.order < 0 && T >= CONDUCT.order) {
        c.order = t; c.by = 'bridge'; c.due = tOfT(sim, Math.max(CONDUCT.order, tNY(ck, NYT.cqd)));
        line(sim, W, 'order', 'The captain to the wireless room: send the call for assistance. The operators wait for the position.');
      }
    }
    if (c.due >= 0 && c.first < 0 && t >= c.due && S.working) {
      c.first = t;
      line(sim, W, 'out', 'CQD: struck a berg, her position. The operators keep calling.');
    }
    if (c.first < 0) return;
    const m = sim.mo, F = (min) => c.first + 60 * min, sent = c.sent;
    const send = (id, when, text) => { if (!sent[id] && t >= when && S.working) { sent[id] = t; line(sim, W, 'out', text); } };
    send('position', F(NYT.position - NYT.cqd), 'The corrected position is sent (Boxhall\'s).');
    if (!sent.noise && t >= F(NYT.noise - NYT.cqd) && S.working) {
      const loud = sim.plant && sim.plant.blow > 0.02;
      sent.noise = t; line(sim, W, 'out', loud ? 'Sinking; cannot hear for the noise of steam.' : 'Sinking.');
    }
    send('sos', F(NYT.sos - NYT.cqd), 'SOS: the new call goes out with the old.');
    if (sim.markT && sim.markT.ports >= 0) send('head', -1, 'Going down fast at the head; get your boats ready.');
    if (sim.plant && ENGINE_ROOM >= 0 && sim.plant.out[ENGINE_ROOM]) { if (!sent.engineDue) sent.engineDue = t; send('engine', sent.engineDue, 'Engine room flooded.'); }
    if (sent.engine) send('come', sent.engine + 60 * (NYT.come - NYT.engine), 'Come as quickly as possible: the engine room is filling up to the boilers.');
    if (!sent.release && sim.markT && sim.markT.fcastle >= 0) { sent.release = t; line(sim, W, 'order', 'The captain releases the operators; Phillips stays at the key.'); }
    void m;
  }

  // ------------------------------------------------------------------ rockets
  function fire(sim, W, by) {
    const R = W.rockets, t = sim.t;
    R.fired++; R.last = t; R.times.push(t);
    line(sim, W, 'order', 'A rocket goes up from the starboard socket, ' + R.fired + ' of ' + ROCKETS.stock + (by === 'bridge' ? '.' : ', on your order.'));
    if (!W.anchored) return;
    for (const s of W.ships) {
      const nm = dist(sim, s) / NM;
      if (nm <= Math.min(horizon(ROCKETS.burstFt, s.eye), ROCKETS.lum)) { s.seen++; if (s.tSeen < 0) s.tSeen = t; if (s.id === 'californian' && W.o.acts && s.state === 'none') act(sim, W, s, 'rocket'); }
    }
  }
  function rocketStep(sim, W, T) {
    const R = W.rockets, t = sim.t;
    if (!bridgeDry(sim)) { R.pending = 0; return; }
    if (W.o.conduct && W.distress && !R.mine && R.ci < CONDUCT.rockets.length && T >= CONDUCT.rockets[R.ci] && R.fired < ROCKETS.stock) { R.ci++; fire(sim, W, 'bridge'); }
    if (R.pending > 0 && R.fetched >= 0 && t >= R.fetched && t >= R.last + 60 * ROCKETS.reload - 1e-9 && R.fired < ROCKETS.stock) { R.pending--; fire(sim, W, 'player'); }
  }

  // ------------------------------------------------------------------ the other ships
  const onWatch = (s, T) => T < s.offT && !(s.busy && T >= s.busy[0] && T < s.busy[1]);
  function act(sim, W, s, how) {                                     // she has heard the call, or her watch acts on a signal
    s.nm = dist(sim, s) / NM; s.nmHeard = s.nm;
    s.state = 'heard'; s.how = how; s.tHeard = sim.t; s.tGo = sim.t + 60 * s.delay;
    if (how === 'wireless') {
      s.told = true;
      line(sim, W, 'in', s.name + ' answers: ' + miles(s.nm) + ' miles off.', s.id);
    }
  }
  function etaOf(s, t, d) {                                          // closed form, as if Titanic lay where she is now (d: m)
    if (s.state === 'alongside') return s.tAlong;
    if (s.state === 'none' || s.state === 'stopped') return null;
    let tt = s.state === 'heard' ? s.tGo : t, dd = d, run = s.run;
    const left = s.iceNm * NM - s.iceRun;
    if ((s.state === 'heard' || s.state === 'ice') && left > 0) { const v = s.iceNm * NM / (60 * s.iceMin); tt += left / v; dd -= left; run += left; }
    if (s.stopAfter && run + Math.max(0, dd) > s.stopAfter * NM) return null;
    return tt + Math.max(0, dd) / (s.kn * KN);
  }
  function shipsStep(sim, W, T, dt) {
    const S = W.set, t = sim.t, m = sim.mo, calling = W.call.first >= 0;
    for (const s of W.ships) {
      const d = dist(sim, s); s.nm = d / NM;
      if (s.state === 'none') {
        if (calling && S.working && s.nm <= S.reach && onWatch(s, T)) act(sim, W, s, 'wireless');
        else continue;
      }
      if (s.state === 'stopped') continue;
      if (s.state === 'alongside') { s.X = m.X; s.Y = m.Y; s.nm = 0; continue; }
      if (s.state === 'heard') {
        if (t < s.tGo) continue;
        s.state = s.iceNm > 0 ? 'ice' : 'coming';
        if (s.how === 'wireless' && S.working) {
          const eta = etaOf(s, t, d);
          line(sim, W, 'in', s.name + ': coming' + (eta === null ? '' : '; she expects to be with you at ' + clockText(W, eta)) + '.', s.id);
        }
      }
      // under way: a step toward where Titanic is now
      const v = s.state === 'ice' ? s.iceNm * NM / (60 * s.iceMin) : s.kn * KN;
      let stepM = v * dt;
      if (s.stopAfter && s.run + stepM >= s.stopAfter * NM) {      // the ice stops her (Mount Temple)
        stepM = Math.max(0, s.stopAfter * NM - s.run);
        s.X += (m.X - s.X) * stepM / d; s.Y += (m.Y - s.Y) * stepM / d; s.run += stepM;
        s.state = 'stopped'; s.tStop = t; s.nm = dist(sim, s) / NM;
        if (s.told && S.working) line(sim, W, 'in', s.name + ': stopped by the ice, ' + miles(s.nm) + ' miles off.', s.id);
        continue;
      }
      if (d <= stepM) {
        s.state = 'alongside'; s.tAlong = t - dt + d / v; s.X = m.X; s.Y = m.Y; s.nm = 0; s.run += d;
        line(sim, W, 'in', (s.told ? s.name : 'A steamer') + ' is alongside.', s.id);
        continue;
      }
      s.X += (m.X - s.X) * stepM / d; s.Y += (m.Y - s.Y) * stepM / d; s.run += stepM;
      if (s.state === 'ice') { s.iceRun += stepM; if (s.iceRun >= s.iceNm * NM) s.state = 'coming'; }
      s.nm = dist(sim, s) / NM;
    }
    // what the bridge can see: another ship's lights inside their range
    for (const s of W.ships) {
      const was = s.inSight; s.inSight = s.state !== 'alongside' && s.nm <= LIGHTS.nm;
      if (s.inSight && !was) {
        if (s.tSight < 0) s.tSight = t;
        line(sim, W, 'seen', (s.told ? s.name + '\'s lights' : 'A steamer\'s lights') + ' in sight ' + side(relBearing(sim, s)) + ', about ' + miles(s.nm) + ' miles.', s.id);
      }
    }
  }

  // ------------------------------------------------------------------ the step
  function step(sim) {
    const W = sim.world; if (!W || !sim.mo) return;
    // Z3: she is gone: the set is silent for good, no call and no rocket after; the other ships keep their courses
    if (N.over && N.over(sim)) {
      if (W.gone === undefined) { W.gone = sim.t; W.set.working = false; W.set.why = 'she has gone'; line(sim, W, 'set', 'The wireless is silent: she has gone.'); }
      if (W.anchored) shipsStep(sim, W, Tof(sim, sim.t), sim.params.dt);
      return;
    }
    const w = sim.night, dt = sim.params.dt;
    if (!W.anchored && w.tTouch >= 0) anchor(sim, W);
    if (!W.distress && w.tTouch >= 0 && sim.openings.length > 0) W.distress = true;    // the touch let the sea in
    const T = Tof(sim, sim.t);
    const was = W.set.working;
    setStep(sim, W);
    if (W.call.first >= 0 && was !== W.set.working) line(sim, W, 'set', W.set.working ? 'The wireless works again, ' + W.set.why + '.' : 'The wireless is silent: ' + W.set.why + '.');
    // the Morse lamp's state as plain data, for a view (NH15): the same rule its order obeys
    const ls = lampState(sim), dry = bridgeDry(sim);
    W.lamp.lit = ls.lit && dry; W.lamp.why = dry ? ls.why : 'the bridge is under water';
    callStep(sim, W, T);
    rocketStep(sim, W, T);
    if (W.anchored) shipsStep(sim, W, T, dt);
  }

  // ------------------------------------------------------------------ orders (core/night.js logs them and replays them)
  function ensureAnchor(sim) { const W = sim.world; if (W && !W.anchored) anchor(sim, W); }
  const ORDERS = {
    // make the call now: at once if the set works, else as soon as it does (the battery thrown in). False if already calling.
    'help:call': (sim) => {
      const W = sim.world, c = W.call; ensureAnchor(sim);
      if (c.first >= 0) return false;
      const first = c.order < 0;
      if (first) c.order = sim.t;
      c.by = 'player'; c.due = sim.t;
      line(sim, W, 'order', first ? 'Your order to the wireless room: send the distress call now.' : 'Your order to the wireless room: send it now, with the position we have.');
      return true;
    },
    // a rocket: the box is fetched from aft first; then one each time the socket is ready. False: none left, or no bridge.
    'help:rocket': (sim) => {
      const W = sim.world, R = W.rockets; ensureAnchor(sim);
      if (!bridgeDry(sim) || R.fired + R.pending >= ROCKETS.stock) return false;
      if (!R.mine) {
        R.mine = true;
        if (R.fired > 0) R.fetched = sim.t;                          // the box is on the bridge already
        else {
          // sent for now; or, on a night the bridge keeps its 1912 conduct, already on its way for the first at T 66
          const T = Tof(sim, sim.t), first = CONDUCT.rockets[0], own = sim.t + 60 * ROCKETS.fetch;
          R.fetched = W.o.conduct && W.distress && T >= first - ROCKETS.fetch ? Math.min(own, tOfT(sim, first)) : own;
          line(sim, W, 'order', 'Your order: rockets. ' + (R.fetched < own ? 'The box is on its way from aft.' : 'A quartermaster goes aft for the box.'));
        }
      }
      R.pending++;
      return true;
    },
    // the Morse lamp at the nearest ship's light: read by a watch within its range; she acts only if her watch acts
    'help:lamp': (sim) => {
      const W = sim.world; ensureAnchor(sim);
      if (!bridgeDry(sim) || !current(sim)) { line(sim, W, 'order', 'The Morse lamp: no current to it.'); return false; }
      W.lamp.worked++; W.lamp.times.push(sim.t);
      let read = null;
      for (const s of W.ships) {
        s.nm = dist(sim, s) / NM;
        if (s.nm <= LAMP.nm) { s.lampRead++; if (!read) read = s; if (s.id === 'californian' && W.o.acts && s.state === 'none') act(sim, W, s, 'lamp'); }
      }
      line(sim, W, 'order', 'The Morse lamp calls the nearest light: CQD.' + (read && read.state !== 'none' ? ' An answering light.' : ' No answer.'));
      return true;
    },
  };
  function valid(type, value, arg) {
    if (arg !== undefined && arg !== null) return false;
    if (type === 'help:call') return value === 'cqd';
    if (type === 'help:rocket') return value === 'socket';
    if (type === 'help:lamp') return value === 'cqd';
    return false;
  }
  N.reader({ name: 'world', state: 'world', attach, step, orders: ORDERS, valid });

  // ------------------------------------------------------------------ what the viewer and the tests read
  function readouts(sim) {
    const W = sim.world; if (!W) return null;
    const t = sim.t, S = W.set, R = W.rockets, c = W.call, T = (x) => (x >= 0 ? Tof(sim, x) : null);
    return {
      T: Tof(sim, t), clock: W.o.clock, clockName: W.ck.name, settings: Object.assign({}, W.o),
      set: { supply: S.supply, volts: S.volts, reach: S.reach, working: S.working, why: S.why, battery: S.battery >= 0, room: S.room },
      call: { orderedT: T(c.order), by: c.by, firstT: T(c.first), calling: c.first >= 0 && S.working, sent: Object.fromEntries(Object.entries(c.sent).filter(e => typeof e[1] === 'number' && e[0] !== 'engineDue').map(e => [e[0], Tof(sim, e[1])])) },
      rockets: { fired: R.fired, left: ROCKETS.stock - R.fired, pending: R.pending, fetchedT: T(R.fetched), times: R.times.map(x => Tof(sim, x)), mine: R.mine },
      lamp: { worked: W.lamp.worked, times: W.lamp.times.map(x => Tof(sim, x)) },
      ships: W.ships.map(s => {
        const d = W.anchored ? (s.state === 'alongside' ? 0 : dist(sim, s)) : null, eta = W.anchored ? etaOf(s, t, d) : null;
        return {
          id: s.id, name: s.name, state: s.state, how: s.how, told: s.told, nm: d === null ? null : d / NM, nmHeard: s.nmHeard,
          brg: W.anchored ? bearing(sim, s) : null, rel: W.anchored ? relBearing(sim, s) : null, kn: s.kn,
          heardT: T(s.tHeard), goT: T(s.tGo), etaT: eta === null ? null : Tof(sim, eta), alongsideT: T(s.tAlong), stoppedT: T(s.tStop),
          seen: s.seen, lampRead: s.lampRead, inSight: s.inSight, eta: eta === null ? null : clockText(W, eta),
        };
      }),
      lines: W.lines.length,
    };
  }
  const call = (sim) => N.act(sim, 'help:call', 'cqd');
  const rocket = (sim) => N.act(sim, 'help:rocket', 'socket');
  const lamp = (sim) => N.act(sim, 'help:lamp', 'cqd');

  return { CLOCKS, NYT, CONDUCT, SET, ROCKETS, LAMP, LIGHTS, SHIPS, CQD_POS, WRECK_1912, horizon, settings, attach, step, readouts, valid,
    call, rocket, lamp, etaOf, clockText, tNY, tCarp, tCal };
});

// forecast worker: the build prepends core/core.js and the modules of the ship under way (they register
// self.TitanicCore, TitanicMotion, TitanicEncounter, TitanicSystems and TitanicNight in a worker).
//   { seq, state, night }               a watch (night: TitanicNight.forecastOf, Y6): a copy of the whole watch, run on
//                                       with its plant, its pumps and the orders still to come; otherwise the core alone
//                                       from its snapshot (state, the presets): run ahead to the end, post the history back
//   { type: 'window', seq, seed, kn, times }   the same berg, another watch: one row posted per reaction time
self.onmessage = function (e) {
  var C = self.TitanicCore;
  if (!self.__ship) self.__ship = C.buildShip();
  if (e.data.type === 'window') {
    var N = self.TitanicNight, sp = N.spec(e.data.seed, { speedKn: e.data.kn, level: e.data.level }), times = e.data.times;
    for (var i = 0; i < times.length; i++) {
      self.postMessage({ type: 'window', seq: e.data.seq, row: N.missWindow(self.__ship, sp, { times: [times[i]] })[0], last: i === times.length - 1 });
    }
    return;
  }
  if (e.data.night && self.TitanicNight) {
    var f = self.TitanicNight.forecast(self.__ship, e.data.night);
    // over and overT (QC B-4): she is gone, and when; on an onset watch at the break's onset, before the flag
    self.postMessage({ seq: e.data.seq, hist: f.hist, foundered: f.foundered, founderT: f.founderT, over: f.over, overT: f.overT, final: f.final, events: f.events, endT: f.endT, by: 'watch' });
    return;
  }
  var sim = C.restore(self.__ship, e.data.state);
  var res = C.run(sim, { tMax: sim.t + 6 * 3600, every: 30, stopWhenStable: true });
  self.postMessage({ seq: e.data.seq, hist: res.hist, foundered: res.foundered, founderT: res.founderT, final: res.final, events: res.events, endT: sim.t, by: 'core' });
};
