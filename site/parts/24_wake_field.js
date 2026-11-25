/*
 * Her wake as a wave field: the library. No DOM and no three.js: the same file runs in Node (tools/wake_tests.js,
 * tools/wake_spectrum.js) and in the page, where site/parts/25_wake.js feeds it her motion and draws what it makes.
 * Design, sources and what was measured: docs/BRAINSTORM_the_wake_computed_v2_2026-11-19.md.
 *
 * THE WAVES. Linear waves on deep, still water, forced by her hull as it moves. For each Fourier mode of the surface
 *   dh/dt = |k| phi + w0,   dphi/dt = -g h
 * (h the height, phi the potential at the surface). Every mode is turned by its own exact frequency, omega^2 = g |k|
 * (the step of Tessendorf's eWave), so no wave the grid holds is carried at a wrong speed, whatever the step.
 * w0 is what her hull does to the surface, three fixed pictures in her own frame (MMG's: x forward, y to starboard):
 *   surge u   Michell's thin-ship sources on her centre plane, -2 u dY/dx, each felt at the surface through exp(-|k| depth):
 *             S_u(k') = -2 i kx' P(kx', |k|),  P = the integral of Y exp(|k| zeta - i kx' x) over the centre plane
 *   sway v and yaw r   the water meets station x across her at v + r x; each section pushes it aside as a dipole of moment
 *             (its area + its sway added area) a metre [bet: the added area 0.9 of a half circle on her draught]:
 *             S_v(k') = -i ky' Q(kx', |k|),  S_r the same with x in it
 * A step's forcing is gain (u S_u + v S_v + r S_r), turned to her heading and moved to her place. Nothing here knows of
 * Kelvin's wedge or of a wavelength: tools/wake_tests.js measures them on what comes out.
 * gain is scale(u): thin-ship theory makes her waves too high (three times too much wave resistance at 22.5 kn), so the
 * heights are scaled until the energy all her waves carry off is what Holtrop's method spends on waves, the method whose
 * shape the motion model's resistance takes (SHIP.resist): SCALE below, made by tools/wake_spectrum.js --bake.
 *
 * A WINDOW is a square of sea, n x n cells of dx metres, periodic in itself: it follows her by whole cells (an exact
 * shift in Fourier space) and its edges are tapered in real space, so that what leaves does not come back in the other
 * side. A window carries only the waves between two lengths (kLo, kHi). The wake has two: a wide one for the long waves
 * and a fine one for the short ones; their sum is the sea.
 *
 * THE WHITE WATER: made where the surface is steeper than it can stand (b: breaking), in a sheet off each bow (b), and
 * in the three screws' races (w); left on the water where it was made; dying by its own clock; the races' spreading.
 * Its places follow from the waves and her motion; every strength and lifetime is a bet, in CFG.
 *
 * HER HULL IN THE PICTURE. Thin-ship theory lays its sources on her centre plane: the field has no hull in it, and its
 * values on her centre line are the theory's values at her plating. To draw the sea round her, a place (x, y) of her
 * frame outside her waterline's half-breadth b(x) is read in the field at (x, y0), y0^2 = y^2 - b^2: the surface water is
 * taken as pushed out from her centre line as by a body of round section, and it closes in again astern [bet]. So white
 * water made at her stem runs along her sides and into her wake with nothing carrying it: fieldY, seaY.
 *
 * Earth frame as core/motion.js: X north, Y east, psi clockwise from north. A window's cell (a, b) is at
 * (X0 + a dx, Y0 + b dx).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../../core/core.js'), require('../../core/motion.js'));
  else root.TitanicWakeField = factory(root.TitanicCore, root.TitanicMotion);
})(typeof self !== 'undefined' ? self : this, function (C, Mo) {
  'use strict';
  const G = C.GRAV, RHO = C.RHO, KN = 1852 / 3600, TAU = 2 * Math.PI;
  const now = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());

  const CFG = {
    // the two windows
    n: 256, dxNear: 4, dxFar: 12,
    split: 30,                 // m: waves longer than this live in the wide window, shorter in the fine one
    // she lies this share of a window's size ahead of its centre, along her own track. The fine window's leaves 69 m of
    // untapered water ahead of her stem: a taper nearer her bow cuts into the water her bow is lifting, and what it cuts
    // comes down her side as waves that are not hers (tools/wake_tests.js, row 8)
    leadNear: 0.20, leadFar: 0.30,
    dead: 6, ramp: 22,         // a window's edge: the outer `dead` cells hold nothing, the taper rises to 1 over `ramp` more
    shiftAt: 8,                // cells she must gain on a window before it is moved after her
    spongeNear: 2.5, spongeFar: 6,   // s: the edges are tapered at least this often (a window that is not moving has waves leaving it too)
    hullDx: 0.5, hullNz: 21,
    // Her sources are brought in gently at the start of a record, so that it makes no splash: over rampIn seconds in the
    // fine window, and smoothly over rampFar in the wide one. The wide one's is long because a ship that starts suddenly
    // leaves a slow swing in her long waves that keeps her company for minutes (the waves whose energy travels at her own
    // speed: a period of 8 pi U / g, 30 s at 22.5 kn), and she is taken to have been steaming for hours
    rampIn: 20, rampFar: 90,
    // a record played to make the wake she already has (the start of a watch, or after time ran too fast to follow)
    span: 420, spanNear: 135, spanBreak: 30, tick: 1,   // s of her past: the wide window, the fine one and the races, the breaking; the white water's step
    coarse: 4,                 // the wide window takes every 4th sample (1 s) while far behind: its shortest wave is 30 m
    lead: 420,                 // s: before a run's first sample she is taken to have held her course and speed this long [appearance]
    stale: 240, keep: 2400,    // samples: more unplayed than `stale` and the field is let go; the record keeps `keep`
    calmNear: 240, calmFar: 600,   // s without her making waves after which a window is flat and left alone
    // the white water [bets, to be set by looking at liners' wakes and by the tank: the note, sections 5 and 7]
    slopeBreak: 0.10,          // the slope of the scaled linear field past which the surface is taken to break
    kBreak: 6.0,               // foam a second for each unit of slope past it
    kBow: 0.8,                 // foam a second in the sheet off each bow at 22.5 kn
    bowFrom: 4, bowTo: 42, bowOut: 3.5,   // m abaft the stem where that sheet is thrown, and its e-folding off her plating
    // Her bow wave against her plating (alongside) is a law, not a factor: Noblesse, Delhommeau, Guilbaud, Hendrix and
    // Yang (2008), "Simple analytical relations for ship bow waves", J. Fluid Mech. 600, 105-132, eq. (4.1) capped at
    // U^2/2g by eq. (6.2): the crest Z_b = (u^2/g) min(2.2 tan a / cos a / (1 + u / sqrt(g T)), 1/2). alongside piles the
    // field's crests about her stem, dying away over bowReach, by the factor that brings the highest to Z_b (bowCrest).
    // K6 checked the relation on the Series 60 and Wigley's hull, within about a sixth, and showed that no one factor can:
    // those hulls want 3.7 and 2.8, her blunter stem about 7 (docs/research/RESULT_k6_wigley_benchmark_v1_1_2026-11-20.md
    // and RESULT_k6_bow_law_v1_2026-11-20.md; tools/s60_compare.js, tools/wigley_compare.js). a: her waterline's half-angle
    // at the stem, 21 degrees [measured: the lower bound read on Bob Read's plans of Olympic, against the model hull's
    // 16.6]. At 22.5 kn her crest is 5.7 m. bowPileMax caps the factor while her field is still too small to carry it
    bowAngle: 21, bowPileMax: 12,
    // the white water's own factor about her stem: the sea there breaks as if it were this much steeper, dying away over
    // bowReach metres from the stem [bet, set by eye; until the law above it was also the waterline's]. It is this that
    // peels white water off her bows
    bowFoam: 3.5, bowReach: 22,
    sideOff: 3,                // m either side of her centre line where the field is read for the sea against her plating (alongside)
    kRace: 0.7,                // foam a second in a screw's race at its thrust at Full ahead
    raceFrom: 122, raceTo: 150, raceSigma: 4.5,   // m abaft amidships where the races come up, and each one's half-spread
    tFull: [0.659e6, 0.659e6, 0.703e6],   // N: port, starboard, centre at Full ahead (the model's: site/app.js, the wake's T_FULL)
    kDrag: 0.2,                // of kRace: what her hull's own turbulent wake whitens at 22.5 kn with no thrust (R9, 8.1)
    raceTurn: 0.6, raceTurnMax: 25,   // the centre screw's race is turned by her rudder: this share of the rudder's angle, at most so many degrees (R9, 8.2)
    tauBreak: 14, tauRace: 40, // s: a breaker's foam and the aerated race die to 1/e (the races: 20 to 90 s, research note R9, 8.1)
    spread: 0.08,              // m: the races' foam spreads with a diffusivity of this times her speed (the width law of R9, 1.9 B^0.8 x^0.2, between her stern and a kilometre)
    foamMax: 1.5,
    slopeFull: 0.5,            // the slope at a texture's full scale
  };

  // ---------------------------------------------------------------- a transform (radix 2, in place)
  function fft1(re, im, n, inv) {
    for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = (inv ? TAU : -TAU) / len, wr = Math.cos(ang), wi = Math.sin(ang);
      for (let i = 0; i < n; i += len) {
        let cr = 1, ci = 0;
        for (let k = 0; k < len / 2; k++) {
          const a = i + k, b = a + len / 2, xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
          re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
          const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
        }
      }
    }
  }
  function fft2(re, im, n, inv, tr, ti) {
    tr = tr || new Float64Array(n); ti = ti || new Float64Array(n);
    for (let r = 0; r < n; r++) { const o = r * n; fft1(re.subarray(o, o + n), im.subarray(o, o + n), n, inv); }
    for (let c = 0; c < n; c++) {
      for (let r = 0; r < n; r++) { tr[r] = re[r * n + c]; ti[r] = im[r * n + c]; }
      fft1(tr, ti, n, inv);
      for (let r = 0; r < n; r++) { re[r * n + c] = tr[r]; im[r * n + c] = ti[r]; }
    }
    if (inv) { const s = 1 / (n * n); for (let i = 0; i < n * n; i++) { re[i] *= s; im[i] *= s; } }
  }

  // ---------------------------------------------------------------- a hull on its centre plane
  // Yf(x, zeta): half-breadth, zeta up from the waterline (<= 0 in the water). The grid is piecewise linear in both.
  function hullGrid(Yf, x0, x1, T, dx, nz) {
    const nx = Math.round((x1 - x0) / dx) + 1, dz = T / (nz - 1), Y = new Float64Array(nx * nz), S = new Float64Array(nx), dC = new Float64Array(nx), Yw = new Float64Array(nx);
    for (let i = 0; i < nx; i++) {
      let area = 0, mom = 0, deep = 0;
      for (let j = 0; j < nz; j++) {
        const zeta = -T + j * dz, y = Yf(x0 + i * dx, zeta); Y[i * nz + j] = y;
        const w = (j === 0 || j === nz - 1 ? 0.5 : 1) * dz; area += 2 * y * w; mom += 2 * y * w * (-zeta); if (y > 0.05 && -zeta > deep) deep = -zeta;
      }
      S[i] = area + 0.9 * 0.5 * Math.PI * deep * deep * (area > 1 ? 1 : area);   // its area and its sway added area [bet]
      dC[i] = area > 1e-6 ? mom / area : 0.5 * T; Yw[i] = Y[i * nz + nz - 1];
    }
    return { x0, x1: x0 + (nx - 1) * dx, dx, nx, nz, dz, T, Y, S, dC, Yw, ez: new Float64Array(nz) };
  }
  const hulls = new Map();
  function herHull(T, dx, nz) {                        // her own, level at draught T (the night's mean by default)
    T = T || Mo.SHIP.d; dx = dx || CFG.hullDx; nz = nz || CFG.hullNz;
    const key = T + '|' + dx + '|' + nz; let h = hulls.get(key);
    if (!h) { h = hullGrid((x, zeta) => C.halfBreadth(x, zeta + T), C.G.xAP - 0.5, C.xFwd(T) + 0.5, T, dx, nz); h.xStem = C.xFwd(T); hulls.set(key, h); }
    return h;
  }
  // her waterline's half-breadth at station x (nought beyond her ends)
  const waterline = (h, x) => { const f = (x - h.x0) / h.dx; if (!(f > 0 && f < h.nx - 1)) return 0; const i = Math.floor(f); return h.Yw[i] + (h.Yw[i + 1] - h.Yw[i]) * (f - i); };
  // the place in the field for a place on the sea beside her, and back (the file's head, "her hull in the picture")
  const fieldY = (h, x, y) => { const b = waterline(h, x), q = y * y - b * b; return q > 0 ? (y < 0 ? -Math.sqrt(q) : Math.sqrt(q)) : 0; };
  const seaY = (h, x, y0) => { const b = waterline(h, x), r = Math.sqrt(y0 * y0 + b * b); return y0 < 0 ? -r : r; };
  // P(kx, K) = the double integral of Y exp(K zeta) exp(-i kx x): each interval integrated exactly (Filon's way), so that
  // waves shorter than the grid's spacing are not aliased. out: [re, im]
  function Pof(h, kx, K, out) {
    const { Y, nx, nz, dx, dz, T, ez } = h, ah = K * dz; let w0, w1;
    if (ah < 1e-4) { w0 = dz * (0.5 + ah / 6); w1 = dz * (0.5 + ah / 3); } else { const e = Math.exp(ah), q = (e * (ah - 1) + 1) / (ah * ah); w1 = dz * q; w0 = dz * ((e - 1) / ah - q); }
    const th = kx * dx; let e1r, e1i, sr, si;
    if (th < 1e-3) { e1r = dx * (1 - th * th / 6); e1i = dx * th / 2; sr = dx * dx * (0.5 - th * th / 8); si = dx * dx * th / 3; }
    else { const c = Math.cos(th), s = Math.sin(th); e1r = s / kx; e1i = (1 - c) / kx; sr = -(-c - th * s + 1) / (kx * kx); si = -(th * c - s) / (kx * kx); }
    for (let j = 0; j < nz; j++) ez[j] = Math.exp(K * (-T + j * dz));
    let re = 0, im = 0, Fp = 0;
    for (let i = 0; i < nx; i++) {
      let F = 0; const o = i * nz; for (let j = 0; j < nz - 1; j++) F += ez[j] * (Y[o + j] * w0 + Y[o + j + 1] * w1);
      if (i > 0) { const ph = kx * (h.x0 + (i - 1) * dx), c = Math.cos(ph), s = Math.sin(ph), d = (F - Fp) / dx, tr = Fp * e1r + d * sr, ti = Fp * e1i + d * si; re += c * tr - s * ti; im += c * ti + s * tr; }
      Fp = F;
    }
    out[0] = re; out[1] = -im; return out;
  }
  function Qof(h, kx, K, pow, out) {                   // the integral of S exp(-K dC) x^pow exp(-i kx x) dx
    let re = 0, im = 0;
    for (let i = 0; i < h.nx; i++) { const x = h.x0 + i * h.dx, a = h.S[i] * Math.exp(-K * h.dC[i]) * (pow ? x : 1) * h.dx * (i === 0 || i === h.nx - 1 ? 0.5 : 1); re += a * Math.cos(kx * x); im -= a * Math.sin(kx * x); }
    out[0] = re; out[1] = im; return out;
  }
  // a window's band: 1 inside it, falling to nought over 4 % at each end, so that two windows sharing an end add to 1
  function bandOf(K, kLo, kHi) {
    let b = 1;
    if (kLo > 0) { if (K <= kLo * 0.98) return 0; if (K < kLo * 1.02) b = (K - kLo * 0.98) / (kLo * 0.04); }
    if (kHi < Infinity) { if (K >= kHi * 1.02) return 0; if (K > kHi * 0.98) b = Math.min(b, (kHi * 1.02 - K) / (kHi * 0.04)); }
    return b;
  }
  // Michell's integral (1898) for a hull at U, and the amplitude of the wave straight astern:
  //   Rw = (4 rho g^4 / (pi U^6)) x the integral over 0..90 deg of |P|^2 sec^5(theta);   |A| = (2 / pi) k0^2 sec^4 |P|
  // (the constants as read in docs/research/RESEARCH_ship_wave_theory_v1_2026-11-19.md; tools/wake_tests.js checks them
  // against the published figures for Wigley's hull). o: { kLo, kHi: only the waves between these wavenumbers; soft: with a
  // window's soft ends; kMax: 12 by default, beyond which nothing is left; L: the length that sets the step; step }
  function michell(h, U, o) {
    o = o || {};
    const k0 = G / (U * U), L = o.L || (h.x1 - h.x0), kLo = o.kLo || 0, kHi = o.kHi || Infinity, soft = !!o.soft;
    const kTop = Math.min(soft ? kHi * 1.02 : kHi, o.kMax || 12), kBot = soft ? kLo * 0.98 : kLo, P = [0, 0];
    const s0 = Math.sqrt(Math.max(0, kBot / k0 - 1)), s1 = Math.sqrt(Math.max(0, kTop / k0 - 1)); let sum = 0;
    if (s1 > s0) {
      const n = Math.max(16, Math.ceil((s1 - s0) / ((o.step || 0.08) / (k0 * L))));
      for (let i = 0; i <= n; i++) {
        const s = s0 + (s1 - s0) * i / n, sec2 = 1 + s * s, sec = Math.sqrt(sec2), K = k0 * sec2, b = soft ? bandOf(K, kLo, kHi) : 1; Pof(h, k0 * sec, K, P);
        sum += (i === 0 || i === n ? 0.5 : 1) * (s1 - s0) / n * b * b * (P[0] * P[0] + P[1] * P[1]) * sec2 * sec;
      }
    }
    Pof(h, k0, k0, P);
    return { Rw: 4 * RHO * Math.pow(G, 4) / (Math.PI * Math.pow(U, 6)) * sum, A0: 2 / Math.PI * k0 * k0 * Math.sqrt(P[0] * P[0] + P[1] * P[1]), k0 };
  }

  // ---------------------------------------------------------------- the energy scale
  // SCALE.c[i] at kn0 + i dkn knots: sqrt(Holtrop's wave resistance / Michell's for all her waves), made by
  // `node tools/wake_spectrum.js --bake` and checked by tools/wake_tests.js. Below kn0 she makes no waves worth the name.
  const SCALE = { kn0: 6, dkn: 0.25, c: [0.0121353, 0.0142427, 0.0182136, 0.024305, 0.0275967, 0.0317999, 0.0386988, 0.0492622, 0.0494274, 0.0649329, 0.0667946, 0.0707384, 0.0792828, 0.0870908, 0.0951441, 0.10746, 0.129537, 0.140669, 0.130953, 0.157942, 0.166606, 0.165476, 0.195085, 0.184818, 0.209575, 0.22096, 0.213692, 0.267682, 0.233247, 0.248989, 0.302273, 0.269101, 0.267673, 0.325652, 0.341039, 0.303208, 0.308816, 0.363521, 0.402492, 0.368176, 0.337912, 0.347183, 0.393981, 0.451396, 0.461432, 0.427831, 0.401622, 0.402198, 0.430854, 0.481924, 0.534036, 0.550536, 0.523614, 0.483697, 0.454257, 0.441929, 0.446752, 0.467524, 0.502489, 0.547771, 0.594916, 0.630827, 0.644464, 0.635766, 0.614477, 0.591328, 0.573043, 0.562609, 0.560979, 0.568259, 0.584252, 0.608547, 0.640335, 0.678013, 0.718682, 0.757856, 0.78989] };   // @@SCALE@@ (tools/wake_spectrum.js --bake writes this line)
  function scale(u) {
    const kn = Math.abs(u) / KN, f = (kn - SCALE.kn0) / SCALE.dkn, c = SCALE.c;
    if (!(f > 0)) return f > -4 ? c[0] * (1 + f / 4) : 0;       // the table's first value, brought down to nought over the knot below it
    if (f >= c.length - 1) return c[c.length - 1];
    const i = Math.floor(f); return c[i] + (c[i + 1] - c[i]) * (f - i);
  }

  // ---------------------------------------------------------------- a window
  // o: { n, dx, kLo, kHi, edge: false for a plain periodic box (the tests'), spongeEvery }
  function createWindow(o) {
    const n = o.n, dx = o.dx, n2 = n * n, dk = TAU / (n * dx), NL = n + 1;
    const w = {
      n, dx, dk, kLo: o.kLo || 0, kHi: Math.min(o.kHi || Infinity, 0.85 * Math.PI / dx), edge: o.edge !== false, spongeEvery: o.spongeEvery || 4,
      X0: 0, Y0: 0, placed: false, t: 0, steps: 0, lastSponge: -1e9, lastForced: -1e9, flat: true, meter: false, work: 0, half: 0, due: null,
      hr: new Float64Array(n2), hi: new Float64Array(n2), pr: new Float64Array(n2), pi: new Float64Array(n2),
      K: new Float64Array(n2), tabs: new Map(), ready: false, prepAt: 0,
      S: [0, 1, 2, 3, 4, 5].map(() => new Float64Array(NL * NL)),          // S_u, S_v, S_r: real and imaginary parts, her frame
      kk: new Float64Array(n), cX: new Float64Array(n), sX: new Float64Array(n), cY: new Float64Array(n), sY: new Float64Array(n),
      tr: new Float64Array(n), ti: new Float64Array(n), wr: new Float64Array(n2), wi: new Float64Array(n2), taper: new Float64Array(n),
    };
    for (let a = 0; a < n; a++) w.kk[a] = dk * (a < n / 2 ? a : a - n);
    for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) w.K[a * n + b] = Math.sqrt(w.kk[a] * w.kk[a] + w.kk[b] * w.kk[b]);
    for (let a = 0; a < n; a++) { const d = Math.min(a, n - 1 - a), s = (d - CFG.dead) / CFG.ramp; w.taper[a] = !w.edge ? 1 : (s <= 0 ? 0 : (s >= 1 ? 1 : s * s * (3 - 2 * s))); }
    return w;
  }
  // her footprints on the window's lattice, a few rows at a time: true when done (budgetMs 0: all at once). Windows of
  // the same size, band and hull share them (they are only read)
  const prints = new Map();
  function prepare(w, h, budgetMs) {
    if (w.ready) return true;
    const key = [w.n, w.dx, w.kLo, w.kHi, h.T, h.dx, h.nz, h.nx].join('|'), have = prints.get(key);
    if (have) { w.S = have; w.ready = true; return true; }
    const n = w.n, H = n / 2, NL = n + 1, t0 = now(), P = [0, 0], Q = [0, 0], Q1 = [0, 0], S = w.S;
    while (w.prepAt <= H) {
      const ix = w.prepAt++, kx = ix * w.dk;
      for (let iy = 0; iy <= H; iy++) {
        const ky = iy * w.dk, K = Math.sqrt(kx * kx + ky * ky), band = bandOf(K, w.kLo, w.kHi); if (band === 0) continue;
        Pof(h, kx, K, P); Qof(h, kx, K, 0, Q); Qof(h, kx, K, 1, Q1);
        for (let sx = 1; sx >= -1; sx -= 2) for (let sy = 1; sy >= -1; sy -= 2) {
          if ((sx < 0 && ix === 0) || (sy < 0 && iy === 0)) continue;
          // P and Q are conjugated for kx < 0, Q1 is odd in kx
          const o = (sx * ix + H) * NL + (sy * iy + H), pr = P[0], pi = sx * P[1], qr = Q[0], qi = sx * Q[1], q1r = sx * Q1[0], q1i = Q1[1];
          S[0][o] = band * 2 * sx * kx * pi; S[1][o] = band * -2 * sx * kx * pr;       // S_u = -2 i kx P
          S[2][o] = band * sy * ky * qi; S[3][o] = band * -sy * ky * qr;              // S_v = -i ky Q
          S[4][o] = band * sy * ky * q1i; S[5][o] = band * -sy * ky * q1r;            // S_r = -i ky Q1
        }
      }
      if (budgetMs && now() - t0 > budgetMs) break;
    }
    if (w.prepAt > H) { w.ready = true; prints.set(key, S); }
    return w.ready;
  }
  function tables(w, dt) {
    let t = w.tabs.get(dt); if (t) return t;
    const n2 = w.n * w.n; t = { c: new Float64Array(n2), s: new Float64Array(n2), a: new Float64Array(n2), b: new Float64Array(n2) };
    for (let o = 0; o < n2; o++) { const k = w.K[o], om = Math.sqrt(G * k); t.c[o] = Math.cos(om * dt); t.s[o] = Math.sin(om * dt); t.a[o] = k > 0 ? k / om : 0; t.b[o] = k > 0 ? G / om : 0; }
    if (w.tabs.size > 6) w.tabs.clear();
    w.tabs.set(dt, t); return t;
  }
  function flatten(w) { w.hr.fill(0); w.hi.fill(0); w.pr.fill(0); w.pi.fill(0); w.flat = true; w.half = 0; }
  function clear(w) { flatten(w); w.placed = false; w.steps = 0; w.lastSponge = -1e9; w.lastForced = -1e9; w.work = 0; }
  // One step of dt ending with her at st: { X, Y, psi, u, v, r }; gain: scale(u). Her hull's push over the step is laid
  // in one piece at the step's middle, where she was half a step ago (a midpoint rule: the sea under her is then right to
  // second order in the step, and steps of different lengths can follow each other without a splash). So the arrays hold
  // the sea half a step back (w.half), every mode having been turned by its own frequency from the last push to this one;
  // heights() carries a copy on to now. With w.meter the work her hull does on the waves is summed in w.work (J): over
  // her speed it is her wave resistance.
  function step(w, st, dt, gain, noSide) {
    const n = w.n, { hr, hi, pr, pi, K, kk, cX, sX, cY, sY } = w, T = tables(w, w.half + 0.5 * dt), H = n / 2, NL = n + 1, S = w.S, idk = 1 / w.dk;
    const psi = st.psi - 0.5 * dt * st.r, cp = Math.cos(psi), sp = Math.sin(psi), u = gain * st.u, v = noSide ? 0 : gain * st.v, r = noSide ? 0 : gain * st.r, sc = dt / (w.dx * w.dx);
    const X = st.X - 0.5 * dt * (st.u * cp - st.v * sp) - w.X0, Y = st.Y - 0.5 * dt * (st.u * sp + st.v * cp) - w.Y0, kLo = w.kLo * 0.98, kHi = w.kHi * 1.02, on = gain !== 0 && w.ready, meter = w.meter;
    w.half = 0.5 * dt;
    const S0 = S[0], S1 = S[1], S2 = S[2], S3 = S[3], S4 = S[4], S5 = S[5], side = v !== 0 || r !== 0; let work = 0;
    if (on) { for (let a = 0; a < n; a++) { const k = kk[a]; cX[a] = Math.cos(k * X); sX[a] = Math.sin(k * X); cY[a] = Math.cos(k * Y); sY[a] = Math.sin(k * Y); } w.flat = false; }
    for (let a = 0; a < n; a++) {
      const kX = kk[a], ro = a * n;
      for (let b = 0; b < n; b++) {
        const o = ro + b, k = K[o]; if (k === 0) continue;
        const c = T.c[o], s = T.s[o], h0 = hr[o], h1 = hi[o], p0 = pr[o], p1 = pi[o];
        let nh0 = h0 * c + p0 * T.a[o] * s, nh1 = h1 * c + p1 * T.a[o] * s; pr[o] = p0 * c - h0 * T.b[o] * s; pi[o] = p1 * c - h1 * T.b[o] * s;
        if (on && k <= kHi && k >= kLo) {
          const kY = kk[b], fxp = (kX * cp + kY * sp) * idk + H, fyp = (-kX * sp + kY * cp) * idk + H, i0 = Math.floor(fxp), j0 = Math.floor(fyp);
          if (i0 >= 0 && j0 >= 0 && i0 < n && j0 < n) {
            const fx = fxp - i0, fy = fyp - j0, o00 = i0 * NL + j0, o10 = o00 + NL, w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
            let sr = u * (S0[o00] * w00 + S0[o10] * w10 + S0[o00 + 1] * w01 + S0[o10 + 1] * w11), si = u * (S1[o00] * w00 + S1[o10] * w10 + S1[o00 + 1] * w01 + S1[o10 + 1] * w11);
            if (side) {
              sr += v * (S2[o00] * w00 + S2[o10] * w10 + S2[o00 + 1] * w01 + S2[o10 + 1] * w11) + r * (S4[o00] * w00 + S4[o10] * w10 + S4[o00 + 1] * w01 + S4[o10 + 1] * w11);
              si += v * (S3[o00] * w00 + S3[o10] * w10 + S3[o00 + 1] * w01 + S3[o10 + 1] * w11) + r * (S5[o00] * w00 + S5[o10] * w10 + S5[o00 + 1] * w01 + S5[o10 + 1] * w11);
            }
            const er = cX[a] * cY[b] - sX[a] * sY[b], ei = -(sX[a] * cY[b] + cX[a] * sY[b]);     // exp(-i (kX X + kY Y))
            const dr = sc * (sr * er - si * ei), di = sc * (sr * ei + si * er);
            if (meter) work += 2 * (nh0 * dr + nh1 * di) + dr * dr + di * di;
            nh0 += dr; nh1 += di;
          }
        }
        hr[o] = nh0; hi[o] = nh1;
      }
    }
    if (meter) w.work += 0.5 * RHO * G * w.dx * w.dx / (n * n) * work;
    w.t += dt; w.steps++;
  }
  // The window follows a centre (cX, cY) by whole cells: an exact shift, then the edges tapered in real space and the
  // cells that wrapped round emptied. Returns [cells north, cells east] when it moved (the white water's grids move with
  // it), else null. A window that has not moved for spongeEvery seconds has its edges tapered where it lies.
  // With `later` the tapering (four transforms) is left to the caller, who does it before the window's next step:
  // w.due = [da, db], then spongeHalf(w, 0, da, db) and spongeHalf(w, 1, da, db), which the page takes in two frames.
  function follow(w, cX, cY, t, later) {
    const n = w.n, dx = w.dx, half = 0.5 * n * dx, wantX = cX - half, wantY = cY - half;
    if (!w.placed) { w.X0 = Math.round(wantX / dx) * dx; w.Y0 = Math.round(wantY / dx) * dx; w.placed = true; w.lastSponge = t; return null; }
    const da = Math.round((wantX - w.X0) / dx), db = Math.round((wantY - w.Y0) / dx);
    if (Math.abs(da) < CFG.shiftAt && Math.abs(db) < CFG.shiftAt) {
      if (w.edge && !w.flat && t - w.lastSponge >= w.spongeEvery) { w.lastSponge = t; if (later) w.due = [0, 0]; else sponge(w, 0, 0); }
      return null;
    }
    w.lastSponge = t;
    if (Math.abs(da) >= n / 2 || Math.abs(db) >= n / 2) { flatten(w); w.X0 = Math.round(wantX / dx) * dx; w.Y0 = Math.round(wantY / dx) * dx; return [da, db]; }
    w.X0 += da * dx; w.Y0 += db * dx;
    if (w.flat) return [da, db];
    const { hr, hi, pr, pi, kk, cY: cb, sY: sb } = w;
    for (let b = 0; b < n; b++) { cb[b] = Math.cos(kk[b] * db * dx); sb[b] = Math.sin(kk[b] * db * dx); }
    for (let a = 0; a < n; a++) {
      const ca = Math.cos(kk[a] * da * dx), sa = Math.sin(kk[a] * da * dx);
      for (let b = 0; b < n; b++) {
        const c = ca * cb[b] - sa * sb[b], s = sa * cb[b] + ca * sb[b], o = a * n + b;     // exp(+i k . shift)
        let q = hr[o] * c - hi[o] * s; hi[o] = hr[o] * s + hi[o] * c; hr[o] = q; q = pr[o] * c - pi[o] * s; pi[o] = pr[o] * s + pi[o] * c; pr[o] = q;
      }
    }
    if (w.edge) { if (later) w.due = [da, db]; else sponge(w, da, db); }
    return [da, db];
  }
  // the edges tapered, and the cells that wrapped round in a move of (da, db) emptied: the heights (which 0) or the
  // potential (1). Both must be done between two steps
  function spongeHalf(w, which, da, db) {
    const n = w.n, tp = w.taper, re = which ? w.pr : w.hr, im = which ? w.pi : w.hi;
    fft2(re, im, n, true, w.tr, w.ti);
    for (let a = 0; a < n; a++) {
      const wrapA = da > 0 ? a >= n - da : (da < 0 ? a < -da : false), ta = wrapA ? 0 : tp[a];
      for (let b = 0; b < n; b++) { const wrapB = db > 0 ? b >= n - db : (db < 0 ? b < -db : false), o = a * n + b; re[o] *= wrapB ? 0 : ta * tp[b]; im[o] = 0; }
    }
    fft2(re, im, n, false, w.tr, w.ti);
  }
  function sponge(w, da, db) { spongeHalf(w, 0, da, db); spongeHalf(w, 1, da, db); }
  function heights(w, out) {                           // the surface now, metres, out[a * n + b]
    const n = w.n, n2 = n * n; out = out || new Float32Array(n2);
    if (w.flat) { out.fill(0); return out; }
    const re = w.wr, im = w.wi;
    if (w.half > 0) { const T = tables(w, w.half), { hr, hi, pr, pi } = w; for (let o = 0; o < n2; o++) { const c = T.c[o], q = T.a[o] * T.s[o]; re[o] = hr[o] * c + pr[o] * q; im[o] = hi[o] * c + pi[o] * q; } }   // carried on from the last push to now
    else { re.set(w.hr); im.set(w.hi); }
    fft2(re, im, n, true, w.tr, w.ti);
    for (let o = 0; o < n2; o++) out[o] = re[o]; return out;
  }
  function energy(w) { let e = 0; const { hr, hi, pr, pi, K, n } = w; for (let o = 0; o < n * n; o++) e += G * (hr[o] * hr[o] + hi[o] * hi[o]) + K[o] * (pr[o] * pr[o] + pi[o] * pi[o]); return 0.5 * RHO * w.dx * w.dx / (n * n) * e; }
  // the value at a place of an array laid on a window's cells (bilinear; 0 outside). X0, Y0: where the window's corner
  // stood when the array was made, if not where it stands now (a refresh's heights, read after the window has moved on)
  function at(w, h, X, Y, X0, Y0) {
    const x0 = X0 === undefined ? w.X0 : X0, y0 = Y0 === undefined ? w.Y0 : Y0;
    const a = (X - x0) / w.dx, b = (Y - y0) / w.dx, n = w.n; if (!(a >= 0 && b >= 0 && a < n - 1 && b < n - 1)) return 0;
    const a0 = Math.floor(a), b0 = Math.floor(b), fa = a - a0, fb = b - b0, o = a0 * n + b0;
    return h[o] * (1 - fa) * (1 - fb) + h[o + n] * fa * (1 - fb) + h[o + 1] * (1 - fa) * fb + h[o + n + 1] * fa * fb;
  }

  // ---------------------------------------------------------------- the white water's pieces
  function shiftGrid(A, T, n, da, db) {                // a grid's content moved as its window moved; what comes in is empty
    T.fill(0);
    if (Math.abs(da) < n && Math.abs(db) < n) for (let a = 0; a < n; a++) { const sa = a + da; if (sa < 0 || sa >= n) continue; for (let b = 0; b < n; b++) { const sb = b + db; if (sb >= 0 && sb < n) T[a * n + b] = A[sa * n + sb]; } }
    A.set(T);
  }
  // how hard the bow's sheet is thrown: the bow-wave relation's height over its height at 22.5 kn, nought below the speed
  // at which her bow wave stops overturning steadily (Delhommeau and others 2009: U / sqrt(g T) = 4.4 tan(a) / cos(a) - 1,
  // read: research note R8, section 5) [the height's own relation is recalled, not read; a: her waterline's half-angle
  // over the first 10 m]
  function bowShare(h, u) {
    if (!(u > 0)) return 0;
    const a = Math.atan(waterline(h, h.xStem - 10) / 10), rT = Math.sqrt(G * h.T), lim = 4.4 * Math.tan(a) / Math.cos(a) - 1; if (u / rT <= lim) return 0;
    const u0 = 22.5 * KN, z = (q) => q * q / (1 + q / rT); return z(u) / z(u0);
  }
  // a screw's race for its thrust T (N; negative: going astern) of its thrust at Full ahead
  const raceShare = (T, full) => Math.min(1.3, Math.abs(T || 0) / full);
  function spreadGrid(A, T, n, c) {                    // one explicit step of diffusion, c = D dt / dx^2 (kept under 0.2)
    if (!(c > 0)) return; if (c > 0.2) c = 0.2;
    for (let a = 1; a < n - 1; a++) for (let b = 1; b < n - 1; b++) { const o = a * n + b; T[o] = A[o] + c * (A[o - 1] + A[o + 1] + A[o - n] + A[o + n] - 4 * A[o]); }
    for (let a = 1; a < n - 1; a++) { const o = a * n; A.set(T.subarray(o + 1, o + n - 1), o + 1); }
  }

  // ---------------------------------------------------------------- her wake: the record of her motion, two windows, the white water
  // A sample of her: { t, X, Y, psi, u, v, r, TP, TS, TC, nP, nS, nC, del } (core/motion.js's names: thrusts in N and
  // shaft revolutions, port, starboard, centre; her rudder's angle).
  // Another hull, for a benchmark (K6): o.hull, a hullGrid with its xStem set; o.scale(u), its gain in place of hers
  // (scale: Holtrop's wave resistance over Michell's, baked for her hull); o.bowAngle, its waterline's half-angle at the
  // stem in degrees, for the bow wave's law (another hull without one has no bow wave piled up). None given: hers.
  function createWake(o) {
    o = o || {};
    const n = o.n || CFG.n, n2 = n * n, kS = TAU / (o.split || CFG.split);
    const W = {
      n, hull: o.hull || herHull(o.draught), scale: o.scale || scale,
      bowAngle: o.bowAngle !== undefined ? o.bowAngle : (o.hull ? null : CFG.bowAngle),
      far: createWindow({ n, dx: o.dxFar || CFG.dxFar, kHi: kS, spongeEvery: CFG.spongeFar }),
      near: createWindow({ n, dx: o.dxNear || CFG.dxNear, kLo: kS, spongeEvery: CFG.spongeNear }),
      rec: [], cur: 0, t: null, st: null, tStart: 0, tNear: null, farDt: 0, farN: 0,
      ready: false, live: false, caught: false, stale: false, empty: true, sumB: 0, sumW: 0, mid: false,
      fb: new Float32Array(n2), fw: new Float32Array(n2), fwFar: new Float32Array(n2), tmp: new Float32Array(n2),   // breaking and races on the fine grid; races on the wide one
      hNear: new Float32Array(n2), hFar: new Float32Array(n2), hSum: new Float32Array(n2), foamT: null, tickT: -1e9,
      texNear: new Uint8Array(n2 * 4), texRace: new Uint8Array(n2), texFar: new Uint8Array(n2 * 4),   // (slope north, slope east, height, breaking), races; (slopes, height, races)
      shown: null, made: { breaking: 0, bow: 0, race: 0 }, gen: null, fresh: true, auto: null,
      // what it has cost (ms): calls of work() that did something, their time and the longest; samples played; refreshes and their time
      cost: { calls: 0, ms: 0, maxMs: 0, samples: 0, refreshes: 0, refreshMs: 0, prepMs: 0 },
    };
    return W;
  }
  function wipe(W) {                                   // the sea flat and clean; the record stays
    clear(W.near); clear(W.far); W.near.due = W.far.due = null; W.fb.fill(0); W.fw.fill(0); W.fwFar.fill(0); W.gen = null; W.mid = false; W.fresh = true;
    W.t = null; W.st = null; W.tNear = null; W.farDt = 0; W.farN = 0; W.foamT = null; W.tickT = -1e9; W.live = false; W.caught = false; W.empty = true; W.shown = null; W.sumB = 0; W.sumW = 0;
    W.made.breaking = 0; W.made.bow = 0; W.made.race = 0;
  }
  function reset(W) { wipe(W); W.rec.length = 0; W.cur = 0; W.stale = false; }
  // A sample of her motion, in order. The first of a run (or one that does not follow from the last: another run, a jump
  // in time) starts the record again, with the lead-in she is taken to have steamed before it.
  function push(W, s) {
    const R = W.rec, p = R.length ? R[R.length - 1] : null;
    if (p) { const dX = s.X - p.X, dY = s.Y - p.Y, dt = s.t - p.t; if (!(dt > 0 && dt < 2) || dX * dX + dY * dY > 1600) reset(W); }
    if (!R.length && Math.abs(s.u) > 0.5) {
      const c = Math.cos(s.psi), sn = Math.sin(s.psi), dt = 0.25, m = Math.round(CFG.lead / dt);
      for (let i = m; i >= 1; i--) R.push({ t: s.t - i * dt, X: s.X - s.u * i * dt * c, Y: s.Y - s.u * i * dt * sn, psi: s.psi, u: s.u, v: 0, r: 0, TP: s.TP, TS: s.TS, TC: s.TC, nP: s.nP, nS: s.nS, nC: s.nC, lead: true });
    }
    R.push(s);
    // the record cut back to its last `keep` samples, never while the player is part way through one: it holds that
    // sample's place in the record across its pauses (2026-11-20: a cut there left it reading a sample that was gone,
    // and the page dropped the part; tools/wake_tests.js, row 10)
    // (Were the player ever left part way through a sample with nobody to run it, the record is bounded all the same:
    // past three times `keep` it is cut, and the player let go and started again where the record then says.)
    if (R.length > 2 * CFG.keep && (!W.mid || R.length > 3 * CFG.keep)) {
      if (W.mid) { W.gen = null; W.mid = false; }
      const cut = R.length - CFG.keep; R.splice(0, cut); W.cur = Math.max(0, W.cur - cut);
    }
    if (!W.stale && W.caught && R.length - W.cur > CFG.stale) { W.stale = true; wipe(W); }   // the field was up with her and has fallen this far behind: it is let go
  }
  // where a window's centre should lie: behind her along her own track, so that a turn's wake stays in it
  const cen = [0, 0];
  function centreOf(W, i, back) {
    const R = W.rec, s = R[i]; let j = i, d = 0;
    while (j > 0 && d < 2 * back) { const k = j > 4 ? j - 4 : 0, a = R[j], b = R[k]; d += Math.sqrt((a.X - b.X) * (a.X - b.X) + (a.Y - b.Y) * (a.Y - b.Y)); j = k; }
    let ex = s.X - R[j].X, ey = s.Y - R[j].Y; const L = Math.sqrt(ex * ex + ey * ey);
    if (L > 30) { ex /= L; ey /= L; } else { ex = Math.cos(s.psi); ey = Math.sin(s.psi); }
    cen[0] = s.X - back * ex; cen[1] = s.Y - back * ey; return cen;
  }
  // The record played into the fields, a piece at a time: a generator, so that whoever runs it can stop between pieces (a
  // step of a window, half of an edge's tapering, a transform) and no drawn frame has to wait for all of them. It yields 2
  // after each sample, 1 after a piece within one, 0 when there is nothing to do.
  function* player(W) {
    const R = W.rec, near = W.near, far = W.far, n = W.n;
    for (;;) {
      if (W.cur >= R.length) {
        // up with her: the sea refreshed for whoever draws it, at most every W.auto of her seconds (null: only when asked)
        if (W.auto !== null && W.st && near.placed && (W.shown === null || W.st.t - W.shown.t >= W.auto - 1e-9)) yield* refresher(W, false);
        yield 0; continue;
      }
      let i = W.cur; const s = R[i], age = R[R.length - 1].t - s.t, behind = R.length - 1 - i, dt = W.t === null ? 0.25 : s.t - W.t, g0 = W.scale(s.u);
      W.mid = true;                                    // part way through sample i: push() leaves the record's length alone until it is done
      if (W.t === null) W.tStart = s.t;
      // the wide window: every sample when she is nearly caught up with, every `coarse`-th while far behind
      W.farDt += dt; W.farN++;
      if (behind < 10 * CFG.coarse || W.farN >= CFG.coarse) {
        const c = centreOf(W, i, CFG.leadFar * n * far.dx), moved = follow(far, c[0], c[1], s.t, true);
        if (moved) shiftGrid(W.fwFar, W.tmp, n, moved[0], moved[1]);
        if (far.due) { const d = far.due; far.due = null; yield 1; spongeHalf(far, 0, d[0], d[1]); yield 1; spongeHalf(far, 1, d[0], d[1]); yield 1; }
        const q = Math.min(1, (s.t - W.tStart) / CFG.rampFar), g = g0 * q * q * (3 - 2 * q);
        if (g !== 0) far.lastForced = s.t;
        if (g === 0 && s.t - far.lastForced > CFG.calmFar) { if (!far.flat) flatten(far); }
        else { step(far, s, W.farDt, g); yield 1; }
        W.farDt = 0; W.farN = 0;
      }
      // after a pause the sample is looked for again where it was (and, were the record ever cut under it after all,
      // wherever it went; gone, the rest of it is let go and play goes on from where the record now says)
      if (R[i] !== s) { i = R.lastIndexOf(s); if (i < 0) { W.t = s.t; W.st = s; W.mid = false; W.farDt = 0; W.farN = 0; continue; } }
      // the fine window, and the white water's grids with it: only the record's last spanNear seconds
      if (age <= CFG.spanNear) {
        if (W.tNear === null) W.tNear = s.t;
        const c = centreOf(W, i, CFG.leadNear * n * near.dx), moved = follow(near, c[0], c[1], s.t, true);
        if (moved) shiftFoam(W, moved[0], moved[1]);
        if (near.due) { const d = near.due; near.due = null; yield 1; spongeHalf(near, 0, d[0], d[1]); yield 1; spongeHalf(near, 1, d[0], d[1]); yield 1; }
        const g = g0 * Math.min(1, (s.t - W.tNear) / CFG.rampIn, (s.t - W.tStart) / CFG.rampIn);
        if (g !== 0) near.lastForced = s.t;
        if (g === 0 && s.t - near.lastForced > CFG.calmNear) { if (!near.flat) flatten(near); }
        else step(near, s, dt, g);
      }
      W.t = s.t; W.st = s; W.cur = i + 1; W.mid = false;
      // while a record is being played, the white water at its own step: the races from spanNear back, the breaking from spanBreak
      if (behind > 0 && age <= CFG.spanNear && s.t - W.tickT >= CFG.tick) { W.tickT = s.t; if (age <= CFG.spanBreak) yield* refresher(W, true); else foamTick(W, s, false); }
      yield 2;
    }
  }
  // the fine grid moved after her: what comes in at its edges is the wide grid's (races laid earlier; breakers do not last)
  function shiftFoam(W, da, db) {
    const n = W.n, near = W.near, far = W.far, dx = near.dx;
    shiftGrid(W.fb, W.tmp, n, da, db); shiftGrid(W.fw, W.tmp, n, da, db);
    if (!far.placed) return;
    for (let a = 0; a < n; a++) { const inA = a + da < 0 || a + da >= n; for (let b = 0; b < n; b++) if (inA || b + db < 0 || b + db >= n) W.fw[a * n + b] = at(far, W.fwFar, near.X0 + a * dx, near.Y0 + b * dx); }
  }
  // The white water over dt: dying, the bow's sheets and the three races made where she is now (in the field's own places:
  // the file's head), the races spreading, and the wide grid taking the fine grid's races where the two overlap. With
  // `breaking`, hSum holds the sea on the fine grid and foam is made where it is too steep.
  function foamTick(W, s, breaking) {
    const n = W.n, near = W.near, far = W.far, dx = near.dx, fb = W.fb, fw = W.fw, h = W.hull, hS = W.hSum, tp = near.taper, made = W.made;
    const dt = W.foamT === null ? 0 : Math.max(0, Math.min(5, s.t - W.foamT)); W.foamT = s.t;
    if (!(dt > 0) || !near.placed) return;
    const dB = Math.exp(-dt / CFG.tauBreak), dW = Math.exp(-dt / CFG.tauRace), i2 = 1 / (2 * dx), lim = CFG.slopeBreak, kB = CFG.kBreak * dt, fMax = CFG.foamMax;
    let sumB = 0, sumW = 0;
    for (let a = 1; a < n - 1; a++) for (let b = 1; b < n - 1; b++) {
      const o = a * n + b; let v = fb[o] * dB;
      if (breaking) { const gx = (hS[o + n] - hS[o - n]) * i2, gy = (hS[o + 1] - hS[o - 1]) * i2, g2 = gx * gx + gy * gy; if (g2 > lim * lim) { const add = kB * (Math.sqrt(g2) - lim) * tp[a] * tp[b]; v += add; made.breaking += add; } }
      fb[o] = v > fMax ? fMax : v; sumB += fb[o]; fw[o] *= dW; sumW += fw[o];
    }
    // round her: the sheets off her bows and the races, each cell's place taken in her own frame (x forward, y to starboard)
    const cp = Math.cos(s.psi), sp = Math.sin(s.psi), bow = CFG.kBow * bowShare(h, s.u) * dt, sq = s.u / (22.5 * KN), drag = CFG.kDrag * Math.min(1.2, sq * sq);
    // a shaft's race goes the way the shaft turns (its revolutions' sign; its thrust's where a sample has none): a screw
    // held or trailing makes none, whatever it drags
    const way = (nn, T) => { const q = nn === undefined ? T : nn; return q > 0 ? 1 : (q < 0 ? -1 : 0); }, dP = way(s.nP, s.TP), dS = way(s.nS, s.TS), dC = way(s.nC, s.TC);
    const rP = dP ? raceShare(s.TP, CFG.tFull[0]) : 0, rS = dS ? raceShare(s.TS, CFG.tFull[1]) : 0, rC = dC ? raceShare(s.TC, CFG.tFull[2]) : 0, yS = Mo.SHIP.wing.y, sg = CFG.raceSigma, i2s = 0.5 / (sg * sg);
    const pile = breaking && bow > 0 ? CFG.bowFoam : 1, reach2 = 16 * CFG.bowReach * CFG.bowReach;
    const lim2 = CFG.raceTurnMax * Math.PI / 180, turn = Math.tan(Math.max(-lim2, Math.min(lim2, CFG.raceTurn * (s.del || 0))));   // + : to starboard, as her rudder (core/motion.js)
    if (bow > 0 || rP > 0 || rS > 0 || rC > 0 || drag > 0) {
      const R = 170, a0 = Math.max(1, Math.floor((s.X - R - near.X0) / dx)), a1 = Math.min(n - 2, Math.ceil((s.X + R - near.X0) / dx)), b0 = Math.max(1, Math.floor((s.Y - R - near.Y0) / dx)), b1 = Math.min(n - 2, Math.ceil((s.Y + R - near.Y0) / dx));
      const xb1 = h.xStem - CFG.bowFrom, xb0 = h.xStem - CFG.bowTo, kR = CFG.kRace * dt;
      for (let a = a0; a <= a1; a++) for (let b = b0; b <= b1; b++) {
        const X = near.X0 + a * dx - s.X, Y = near.Y0 + b * dx - s.Y, x = X * cp + Y * sp, y = -X * sp + Y * cp, o = a * n + b;
        if (bow > 0 && x < xb1 && x > xb0) {
          const bw = waterline(h, x), out = Math.sqrt(y * y + bw * bw) - bw;               // how far off her plating this water lies
          if (out < 5 * CFG.bowOut) { const add = bow * Math.exp(-out / CFG.bowOut) * Math.min(1, (xb1 - x) / 10) * Math.min(1, (x - xb0) / 14); fb[o] = Math.min(fMax, fb[o] + add); made.bow += add; }
        }
        if (pile > 1) {                                                                    // her bow wave piled up: the sea about her stem breaks as if it were that much steeper
          const xs = x - h.xStem, r2 = xs * xs + y * y;
          if (r2 < reach2) {
            const gx = (hS[o + n] - hS[o - n]) * i2, gy = (hS[o + 1] - hS[o - 1]) * i2, g = Math.sqrt(gx * gx + gy * gy), ga = g * (1 + (pile - 1) * Math.exp(-Math.sqrt(r2) / CFG.bowReach));
            if (ga > lim) { const add = kB * (ga - (g > lim ? g : lim)) * tp[a] * tp[b]; fb[o] = Math.min(fMax, fb[o] + add); made.bow += add; }
          }
        }
        let add = 0;
        if (x < -CFG.raceFrom && x > -CFG.raceTo) {                                        // astern of her screws: each race thrown aft, and her hull's own wake
          const yp = y + yS, ys = y - yS, yc = y - (-CFG.raceFrom - x) * turn;             // the centre race, turned by her rudder as it goes aft
          add = kR * ((dP > 0 ? rP * Math.exp(-yp * yp * i2s) : 0) + (dS > 0 ? rS * Math.exp(-ys * ys * i2s) : 0) + (dC > 0 ? rC * Math.exp(-yc * yc * i2s) : 0) + drag * Math.exp(-y * y * i2s / 3));
        } else if (x <= -70 && x > -CFG.raceFrom && (dP < 0 || dS < 0)) {                  // a wing screw going astern throws its race forward along her quarter
          const bw = waterline(h, x), out = Math.sqrt(y * y + bw * bw) - bw;
          if (out < 12) add = 0.7 * kR * Math.exp(-out / 3) * ((dP < 0 && y < 0 ? rP : 0) + (dS < 0 && y > 0 ? rS : 0));
        }
        if (add > 0) { fw[o] = Math.min(fMax, fw[o] + add); made.race += add; }
      }
    }
    const D = CFG.spread * Math.abs(s.u) * dt;
    spreadGrid(fw, W.tmp, n, D / (dx * dx));
    // the wide grid: where the fine one covers it, its races are the fine one's; elsewhere they die and spread
    if (far.placed) {
      const fF = W.fwFar, r = Math.round(far.dx / dx), m = n - 4, ir = 1 / (r * r), offA = (far.X0 - near.X0) / dx - r / 2, offB = (far.Y0 - near.Y0) / dx - r / 2;
      spreadGrid(fF, W.tmp, n, D / (far.dx * far.dx));
      for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
        const o = a * n + b, na = Math.round(offA + a * r), nb = Math.round(offB + b * r);
        if (na >= 4 && nb >= 4 && na + r < m && nb + r < m) { let q = 0; for (let i = 0; i < r; i++) for (let j = 0; j < r; j++) q += fw[(na + i) * n + nb + j]; fF[o] = q * ir; } else fF[o] *= dW;
        sumW += fF[o];
      }
    }
    W.sumB = sumB; W.sumW = sumW;
  }
  // The sea as it stands, for whoever draws it: the two windows' heights, the white water brought up to now, and the
  // textures (bytes) filled. inPlay: called while a record is being played (the textures are left alone).
  // It is done in four pieces (a transform, a transform, the white water, the bytes), with a yield between them.
  function* refresher(W, inPlay) {
    const n = W.n, n2 = n * n, near = W.near, far = W.far, s = W.st, cost = W.cost; let t0 = now();
    const lap = () => { cost.refreshMs += now() - t0; };
    const hN = heights(near, W.hNear), dxN = near.dx, dxF = far.dx; lap(); yield 1; t0 = now();
    const hF = far.placed ? heights(far, W.hFar) : W.hFar, hS = W.hSum; lap(); yield 1; t0 = now();
    if (far.placed && !far.flat) for (let a = 0; a < n; a++) { const X = near.X0 + a * dxN, ro = a * n; for (let b = 0; b < n; b++) hS[ro + b] = hN[ro + b] + at(far, hF, X, near.Y0 + b * dxN); }
    else hS.set(hN);
    foamTick(W, s, true);
    W.empty = near.flat && far.flat && !(W.sumB + W.sumW > 0.5);
    lap(); if (inPlay) return;
    yield 1; t0 = now();
    let mN = 0.05, mF = 0.05;
    for (let o = 0; o < n2; o++) { const a = hN[o] < 0 ? -hN[o] : hN[o], b = hF[o] < 0 ? -hF[o] : hF[o]; if (a > mN) mN = a; if (b > mF) mF = b; }
    const SL = 127 / CFG.slopeFull, FQ = 255 / CFG.foamMax, fw = W.fw, tR = W.texRace;
    const fill = (h, tex, dx, hm, foam) => {
      const i2 = SL / (2 * dx), HQ = 127 / hm;
      for (let a = 0; a < n; a++) {
        const am = a > 0 ? a - 1 : a, ap = a < n - 1 ? a + 1 : a;
        for (let b = 0; b < n; b++) {
          const o = a * n + b, bm = b > 0 ? b - 1 : b, bp = b < n - 1 ? b + 1 : b, q = o * 4;
          // a byte of 128 is nought; a slope of slopeFull or a height of hm is 127 from it
          const sx = 128.5 + (h[ap * n + b] - h[am * n + b]) * i2, sy = 128.5 + (h[a * n + bp] - h[a * n + bm]) * i2;
          tex[q] = sx < 1 ? 1 : (sx > 255 ? 255 : sx); tex[q + 1] = sy < 1 ? 1 : (sy > 255 ? 255 : sy); tex[q + 2] = 128.5 + h[o] * HQ; tex[q + 3] = foam[o] * FQ;
        }
      }
    };
    fill(hN, W.texNear, dxN, mN, W.fb); fill(hF, W.texFar, dxF, mF, W.fwFar);
    for (let o = 0; o < n2; o++) tR[o] = fw[o] * FQ;
    W.shown = { t: s.t, X: s.X, Y: s.Y, psi: s.psi, u: s.u, nearX0: near.X0, nearY0: near.Y0, farX0: far.X0, farY0: far.Y0, farOn: far.placed, hNear: mN, hFar: mF, seq: (W.shown ? W.shown.seq : 0) + 1 };
    cost.refreshes++; lap();
  }
  function refresh(W, inPlay) {                        // all of it at once (the tests; the page lets work() do it in pieces: W.auto)
    if (!W.st || !W.near.placed) return false;
    const g = refresher(W, !!inPlay); while (!g.next().done);
    return true;
  }
  // Work for up to budgetMs (0: until there is nothing to do): her footprints first (once), then the record played into
  // the fields a piece at a time, and with W.auto set the sea refreshed when the fields are up with her. paceOk false: time
  // is running too fast to follow (the caller's judgement), and the field is let go until it is not; it is then made again
  // from the record's last minutes. Returns the number of samples played. W.live: the fields are at the record's end.
  function work(W, budgetMs, paceOk) {
    const t0 = now(), R = W.rec, cost = W.cost;
    if (!W.ready) { if (prepare(W.far, W.hull, budgetMs) && prepare(W.near, W.hull, budgetMs ? Math.max(1, budgetMs - (now() - t0)) : 0)) W.ready = true; cost.prepMs += now() - t0; if (!W.ready) return 0; }
    if (paceOk === false) { if (!W.stale) { W.stale = true; wipe(W); } return 0; }
    if (W.stale) { if (!R.length) return 0; W.stale = false; wipe(W); }
    if (W.fresh && R.length) { W.fresh = false; W.cur = Math.max(0, R.length - 1 - Math.round(CFG.span / 0.25)); }   // a fresh field: the record's last `span` seconds are played into it
    if (!W.gen) W.gen = player(W);
    let did = 0, pieces = 0;
    for (;;) { const v = W.gen.next().value; if (v === 0) break; pieces++; if (v === 2) did++; if (budgetMs && now() - t0 > budgetMs) break; }
    W.live = W.cur >= R.length && R.length > 0; if (W.live) W.caught = true;
    if (pieces) { const ms = now() - t0; cost.calls++; cost.samples += did; cost.ms += ms; if (ms > cost.maxMs) cost.maxMs = ms; }
    return did;
  }

  // ---------------------------------------------------------------- the sea along her sides (K4: her drawn waterline)
  // The sea's height against her plating at n stations from her stern to her stem, port and starboard, as it stood at the
  // last refresh: out[2 i] port, out[2 i + 1] starboard (m above the still water). The water at her plating is the
  // field's near her centre line (the file's head: her hull in the picture), read CFG.sideOff metres either side of it so
  // that the two sides differ as the field does. Her bow wave is the law's (CFG.bowAngle's comment): the field's crests
  // about her stem are piled up, the factor dying away over CFG.bowReach from the stem, by the factor that brings the
  // highest of them within three reaches of the stem, on either side, to bowCrest's height (found by halving, to 0.1 %;
  // at most CFG.bowPileMax; none if the field's crest is already that high). Only the crests are piled up [bet: the
  // factor's shape along her]. Between refreshes the pattern rides with her, so the heights are hers to carry.
  // o.linear: the field alone; o.pile: a fixed factor instead of the law (K6's tools compare with both).
  function alongside(W, n, out, o) {
    out = out || new Float32Array(2 * n);
    const s = W.shown || W.st, near = W.near, far = W.far, h = W.hull;   // her place when the heights were made (the player may be a sample on)
    if (!s || !near.placed || W.empty) { out.fill(0); return out; }
    const c = Math.cos(s.psi), sn = Math.sin(s.psi), off = CFG.sideOff, reach = CFG.bowReach;
    // the heights are the last refresh's, laid on each window where it stood then: between refreshes the player may move
    // a window on after her (follow), and read at the window's new corner they would be read in the wrong place (the
    // join 6 gate's 1.2 m, 2026-11-20). With no refresh yet, the windows as they stand
    const snap = s === W.shown, nX0 = snap ? s.nearX0 : near.X0, nY0 = snap ? s.nearY0 : near.Y0, fX0 = snap ? s.farX0 : far.X0, fY0 = snap ? s.farY0 : far.Y0;
    const farOn = snap ? !!s.farOn : far.placed;
    for (let i = 0; i < n; i++) {
      const x = h.x0 + (h.x1 - h.x0) * (i + 0.5) / n;
      for (let side = 0; side < 2; side++) {
        const y = side ? off : -off, X = s.X + x * c - y * sn, Y = s.Y + x * sn + y * c;
        out[2 * i + side] = at(near, W.hNear, X, Y, nX0, nY0) + (farOn ? at(far, W.hFar, X, Y, fX0, fY0) : 0);
      }
    }
    o = o || {};
    if (o.linear) return out;
    const fromStem = (i) => h.xStem - (h.x0 + (h.x1 - h.x0) * (i + 0.5) / n);
    const up = (i, P) => { const d = fromStem(i); return d > 0 ? 1 + (P - 1) * Math.exp(-d / reach) : 1; };
    // the highest crest of her bow wave: within three reaches abaft her stem, so that her stern's rise does not count
    const top = (P) => { let m = 0; for (let i = 0; i < n; i++) { const d = fromStem(i); if (!(d > 0 && d < 3 * reach)) continue; const u = up(i, P); for (let side = 0; side < 2; side++) { const z = out[2 * i + side]; if (z > 0 && z * u > m) m = z * u; } } return m; };
    let P = o.pile || 1;
    if (!o.pile) {
      const Z = bowCrest(W, s.u), t1 = top(1);
      if (Z > 0 && t1 > 1e-6 && t1 < Z) {
        let lo = 1, hi = CFG.bowPileMax;
        if (top(hi) <= Z) P = hi; else { for (let k = 0; k < 40 && hi - lo > 1e-3 * lo; k++) { const mid = 0.5 * (lo + hi); if (top(mid) < Z) lo = mid; else hi = mid; } P = 0.5 * (lo + hi); }
      }
    }
    W.bowPileNow = P;
    if (P !== 1) for (let i = 0; i < n; i++) { const u = up(i, P); for (let side = 0; side < 2; side++) if (out[2 * i + side] > 0) out[2 * i + side] *= u; }
    return out;
  }
  // the bow wave's crest against her plating at speed u (m/s through the water), by Noblesse and others' relation for the
  // wake's hull (CFG.bowAngle's comment): its draught, and its waterline's half-angle at the stem (W.bowAngle, degrees).
  // Nought going astern, stopped, or for a hull with no angle given
  function bowCrest(W, u) {
    const a = W.bowAngle, h = W.hull;
    if (a === null || a === undefined || !(u > 0)) return 0;
    const r = a * Math.PI / 180, FD = u / Math.sqrt(G * h.T);
    return (u * u / G) * Math.min(2.2 * Math.tan(r) / Math.cos(r) / (1 + FD), 0.5);
  }

  return {
    CFG, SCALE, KN, fft2, hullGrid, herHull, waterline, fieldY, seaY, Pof, Qof, bandOf, michell, scale, bowShare,
    createWindow, prepare, flatten, clear, step, follow, sponge, spongeHalf, heights, energy, at,
    createWake, reset, push, work, refresh, foamTick, alongside, bowCrest,
  };
});
