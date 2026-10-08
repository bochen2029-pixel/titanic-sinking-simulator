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

  // Moulded half-breadth at (x, z). Zero outside the profile.
  function halfBreadth(x, z, P) {
    P = P || HULL;
    if (z < 0) return 0;
    let W;
    const sb = z >= P.T0 ? 1 : (z / P.T0) * (z / P.T0) * (3 - 2 * z / P.T0);
    const xPF = P.xPF0 + (P.xPF1 - P.xPF0) * sb;
    const xPA = P.xPA0 + (P.xPA1 - P.xPA0) * sb;
    if (x > xPF) {
      const xe = xFwd(z); if (x >= xe) return 0;
      const u = (x - xPF) / (xe - xPF);
      W = 1 - Math.pow(u, nBlend(z, P.nF0, P.nF1, P.nF2, P.T0, 26));
    } else if (x < xPA) {
      const xe = xAft(z); if (x <= xe) return 0;
      const u = (xPA - x) / (xPA - xe);
      W = 1 - Math.pow(u, nBlend(z, P.nA0, P.nA1, P.nA2, P.T0, 24));
    } else W = 1;
    const Bh = G.B / 2;
    let S = 1;
    if (z < P.rb) { const d = P.rb - z; S = (Bh - P.rb + Math.sqrt(P.rb * P.rb - d * d)) / Bh; }
    let TH = 1;
    if (z > G.thZ) { const s = (z - G.thZ) / (G.deck.Boat - G.thZ); TH = 1 - (G.thAmount / Bh) * s * s; }
    return Bh * W * S * TH;
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
    const out = { x: [], y: [], dxdy: [], zlo: [], zhi: [], zone: [], side: [], dx: [], dy };
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
          for (let sd = 0; sd < 2; sd++) {     // 0 = port (+y), 1 = starboard (-y)
            out.x.push(xc); out.y.push(sd === 0 ? yc : -yc);
            out.dxdy.push(dx * dy); out.dx.push(dx);
            out.zlo.push(iv[0]); out.zhi.push(iv[1]);
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
      zlo: Float64Array.from(out.zlo), zhi: Float64Array.from(out.zhi),
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
    CdBreach: 0.60,       // discharge coefficient of hull openings
    CdDoor: 0.60,
    Cweir: 0.60,
    wPort: 3.0,           // E-deck overflow path widths, m (Scotland Road / 1st-class alleyway)
    wStbd: 2.0,
    wMul: 1.182,          // calibrated (tools/calibrate.js)
    aDown: 0.277,         // m2 per side: stairways and hatches through E deck (calibrated)
    axHold: 0.05,         // m2: cross-flow beneath the firemen's tunnel (holds 2-3)
    axOpen: 6.0,          // m2: cross-flow in open compartments
    zMergeHold: 4.6,      // m: top of the firemen's tunnel
    upperSplit: 0,        // 1: above E deck, port and starboard exchange water through cross passages only
    axUp: 1.0,            // m2 per compartment: cross passages above E deck
    fOpen: 0.0101,        // share of the top deck open to the sea once submerged (calibrated)
    doorLowA: 1.5, doorA: 1.67,
    zetaHeave: 0.6, zetaPitch: 0.6, zetaRoll: 0.12,
    addedHeave: 1.0, addedPitch: 1.0, addedRoll: 0.2,
    kRoll: 0.38, kPitch: 0.25,
    coalListDeg: 2.0,     // list to port before the collision (Beesley; Halpern)
    GM0: 2.625 * FT,      // Hackett & Bedford
    draftF: (30 + 9 / 12) * FT, draftA: (33 + 9 / 12) * FT,   // Wilding, night of 14 April
  };

  // group kinds for connections
  const K_DOOR = 0, K_OVER = 1, K_DOWN = 2, K_XLOW = 3, K_XMERGE = 4, K_XUP = 5, K_TOP = 6, K_BREACH = 7, K_OPEN = 8;

  function buildShip(opts) {
    opts = opts || {};
    const P = opts.hull || HULL;
    const cols = buildColumns(P, { dx: opts.dx || 3.0, dy: opts.dy || 0.5 });
    const bx = zoneBounds();
    const zones = ZONES.map((z, k) => Object.assign({}, z, {
      k, xf: bx[k], xa: bx[k + 1], xm: 0.5 * (bx[k] + bx[k + 1]), len: bx[k] - bx[k + 1],
      floor: z.peak ? 0 : G.tankTop,
    }));
    const lists = Array.from({ length: NN }, () => []);
    for (let i = 0; i < cols.N; i++) {
      const k = cols.zone[i], sd = cols.side[i];
      const zE = deckZ('E', cols.x[i]);
      const a0 = Math.max(cols.zlo[i], zones[k].floor), e0 = Math.min(cols.zhi[i], zE);
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
    for (let n = 0; n < NN; n++) {
      const layer = n & 1, k = n >> 2;
      nodeMu[n] = layer ? MU_UP : zones[k].mu;
      let vm = 0, fp = 0;
      for (let j = nodeStart[n]; j < nodeStart[n] + nodeCount[n]; j++) {
        const i = entCol[j]; vm += cols.dxdy[i] * (entE[j] - entA[j]); fp += cols.dxdy[i];
      }
      nodeVmax[n] = nodeMu[n] * vm;
      nodeAmin[n] = Math.max(4, 0.15 * nodeMu[n] * fp);
      nodeAov[n] = Math.max(1, 0.03 * fp);     // a full space is "pressed up": stiff virtual head
    }
    // intact hydrostatics at the mean draft of the night (for damping and GM)
    const hyd = evenKeel(cols, 0.5 * (DEFAULT_PARAMS.draftF + DEFAULT_PARAMS.draftA));
    return { cols, zones, nodeStart, nodeCount, entCol, entA, entE, nodeMu, nodeVmax, nodeAmin, nodeAov, hyd, hull: P };
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
    };
  }
  function pushConn(S, a, b, type, x, y, z, area, coef, kind, idx, en) {
    if (S.n >= S.cap) throw new Error('connection store full');
    const i = S.n++;
    S.a[i] = a; S.b[i] = b; S.type[i] = type; S.x[i] = x; S.y[i] = y; S.z[i] = z;
    S.area[i] = area; S.coef[i] = coef; S.kind[i] = kind; S.idx[i] = idx; S.en[i] = en ? 1 : 0; S.q[i] = 0; S.tOn[i] = 0;
    return i;
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
        // port path (Scotland Road), starboard path (alleyway), plus a centre stair share
        pushConn(S, nodeIndex(kF, 0, 1), nodeIndex(kA, 0, 1), 1, x, 8.0, crest, p.wPort * p.wMul, p.Cweir, K_OVER, b, true);
        pushConn(S, nodeIndex(kF, 1, 1), nodeIndex(kA, 1, 1), 1, x, -8.0, crest, p.wStbd * p.wMul, p.Cweir, K_OVER, b, true);
        pushConn(S, nodeIndex(kF, 0, 1), nodeIndex(kA, 0, 1), 1, x, 1.5, crest, 0.5 * p.wMul, p.Cweir, K_OVER, b, true);
        pushConn(S, nodeIndex(kF, 1, 1), nodeIndex(kA, 1, 1), 1, x, -1.5, crest, 0.5 * p.wMul, p.Cweir, K_OVER, b, true);
      }
    }
    // within each compartment
    for (const Z of zones) {
      const k = Z.k;
      // through E deck (two openings per side)
      for (const f of [0.25, 0.75]) {
        const x = Z.xa + f * Z.len, zE = deckZ('E', x);
        const yb = Math.max(1, 0.45 * halfBreadth(x, zE));
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
        const x = Z.xa + f * Z.len, zt = zTopAt(x);
        if (halfBreadth(x, zt - 0.05) < 0.3) continue;
        for (let sd = 0; sd < 2; sd++) pushConn(S, -1, nodeIndex(k, sd, 1), 1, x, 0, zt, 0.5 * p.fOpen * Z.len / 3, p.Cweir, K_TOP, k, true);
      }
    }
    // user openings: hull breaches and portholes
    for (const o of sim.openings) {
      if (!o.active) continue;
      o.conn = pushConn(S, -1, o.node, 0, o.x, o.y, o.z, o.area, p.CdBreach, o.kind === 'breach' ? K_BREACH : K_OPEN, o.id, true);
      S.tOn[o.conn] = o.tOpen || 0;
    }
    sim.conn = S;
  }

  // ------------------------------------------------------------ the step
  function poseFrame(sim, zO, th, ph, F) {
    const cth = Math.cos(th), sth = Math.sin(th), cph = Math.cos(ph), sph = Math.sin(ph);
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
    const tol = full ? 1e-6 * Vmax + 1e-3 : Math.max(1e-3 * Vmax, 0.5);
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
      sim.vol[nP] = 0; sim.vol[nS] = 0;
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
    const tol = full ? 1e-6 * Vmax + 1e-3 : Math.max(1e-3 * Vmax, 0.5);
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
      const V = sim.vol[n]; if (V <= 0) continue;
      const x = sim.cx[n], y = sim.cy[n], z = sim.cz[n];
      const wx = F.R00 * x + F.R01 * y + F.R02 * z + F.tx - sim.XO;
      const wy = F.R10 * x + F.R11 * y + F.R12 * z + F.ty - sim.YO;
      const wz = F.R20 * x + F.R21 * y + F.R22 * z + F.tz - sim.zO;
      const f = -W * V;
      tauX += wy * f; tauY -= wx * f; Fz += f;
      const m = RHO * V; mw += m; Iw_p += m * (wx * wx + wz * wz); Iw_r += m * (wy * wy + wz * wz);
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
    const acc = sim._acc; acc.fill(0);
    // how many openings act on each space this step (shares the stability limit between them)
    const deg = sim._deg; deg.fill(0);
    for (let c = 0; c < S.n; c++) {
      if (!S.en[c]) continue;
      const a = S.a[c], b = S.b[c];
      if (a >= 0 && hEff[a] < -1e8 && hEff[b] < -1e8) continue;
      if (a >= 0) deg[a]++; deg[b]++;
    }
    let seaIn = 0;
    for (let c = 0; c < S.n; c++) {
      if (!S.en[c] || S.tOn[c] > sim.t) { S.q[c] = 0; continue; }
      const kd = S.kind[c];
      if ((kd === K_XLOW || kd === K_XMERGE) && sim.merged[S.idx[c] * 2] === 1) { S.q[c] = 0; continue; }
      const a = S.a[c], b = S.b[c];
      const zo = F.R20 * S.x[c] + F.R21 * S.y[c] + F.R22 * S.z[c] + F.tz;
      const ha = a < 0 ? 0 : hEff[a], hbv = hEff[b];
      const Ha = ha > zo ? ha - zo : 0, Hb = hbv > zo ? hbv - zo : 0;
      let q = 0;
      if (S.type[c] === 0) {
        const d = Ha - Hb;
        if (d !== 0) q = S.coef[c] * S.area[c] * SQ2G * d / Math.sqrt(Math.max(Math.abs(d), 0.01));
      } else {
        const H1 = Ha > Hb ? Ha : Hb;
        if (H1 > 0) {
          const H2 = Ha > Hb ? Hb : Ha;
          let f = 1;
          if (H2 > 0) { const r = H2 / H1; f = Math.pow(Math.max(0, 1 - Math.pow(r, 1.5)), 0.385); }
          q = S.coef[c] * S.area[c] * (2 / 3) * SQ2G * H1 * Math.sqrt(H1) * f * (Ha >= Hb ? 1 : -1);
        }
      }
      if (q === 0) { S.q[c] = 0; continue; }
      let dV = q * dt;
      // stability limit: never move more than half of what would level the two sides
      const src = dV > 0 ? a : b, dst = dV > 0 ? b : a;
      const hs = src < 0 ? 0 : hEff[src];
      const hd = dst < 0 ? 0 : hEff[dst];
      const inv = (src < 0 ? 0 : 1 / Aeff[src]) + (dst < 0 ? 0 : 1 / Aeff[dst]);
      const share = 0.5 / Math.max(1, src < 0 ? deg[dst] : (dst < 0 ? deg[src] : Math.max(deg[src], deg[dst])));
      let lim = inv > 0 ? share * (hs - Math.max(hd, zo)) / inv : Math.abs(dV);
      if (lim < 0) lim = 0;
      if (Math.abs(dV) > lim) dV = dV > 0 ? lim : -lim;
      S.q[c] = dV / dt;
      if (a >= 0) acc[a] -= dV; else seaIn += dV;
      acc[b] += dV;
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
    sim.inflow = seaIn / dt;  // m3/s entering the hull (all openings)

    // rigid body: heave, pitch, roll
    const L = loads(sim, F, hb, sim._ld);
    const mh = sim.mh0 + L.mw;
    const Ith = sim.Ith0 + L.Iw_p, Iph = sim.Iph0 + L.Iw_r;
    const az = (L.Fz - sim.cDz * sim.vz - sim.qz * Math.abs(sim.vz) * sim.vz) / mh;
    const ath = (L.Mth - sim.cDth * sim.wth - sim.qth * Math.abs(sim.wth) * sim.wth) / Ith;
    const aph = (L.Mph - sim.cDph * sim.wph - sim.qph * Math.abs(sim.wph) * sim.wph) / Iph;
    sim.vz += az * dt; sim.wth += ath * dt; sim.wph += aph * dt;
    sim.zO += sim.vz * dt; sim.pitch += sim.wth * dt; sim.roll += sim.wph * dt;
    if (sim.pitch > 1.35) { sim.pitch = 1.35; sim.wth = 0; }
    if (sim.pitch < -1.35) { sim.pitch = -1.35; sim.wth = 0; }
    if (sim.roll > 1.4) { sim.roll = 1.4; sim.wph = 0; }       // on her beam ends: stop there
    if (sim.roll < -1.4) { sim.roll = -1.4; sim.wph = 0; }
    sim.t += dt;
    sim.Vb = hb.V; sim.hullTop = hb.top; sim.mw = L.mw;
    trackEvents(sim, F);
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
      _F: {}, _hb: {}, _ld: {}, _sc: {}, _sc2: {}, _over: new Float64Array(BULKHEADS.length),
      merged: new Uint8Array(32), mergeAlways: new Uint8Array(32).fill(1), zMerge: new Float64Array(16), _deg: new Int32Array(NN),
      doorOpen: new Uint8Array(BULKHEADS.length),
      bulkTop: BULKHEADS.map(b => b.top),
      overflow: new Float64Array(BULKHEADS.length), overT: new Float64Array(BULKHEADS.length).fill(-1),
      markT: {}, events: [], openings: [], nextId: 1,
      foundered: false, founderT: -1, inflow: 0,
      vz: 0, wth: 0, wph: 0,
    };
    for (const m of MARKS) sim.markT[m.id] = -1;
    // holds 2 and 3: the firemen's tunnel splits the lower hold into port and starboard
    for (const k of [2, 3]) { sim.mergeAlways[k * 2] = 0; sim.zMerge[k] = p.zMergeHold; }
    if (p.upperSplit) for (let k = 0; k < 16; k++) sim.mergeAlways[k * 2 + 1] = 0;
    if (scen.bulkTop) for (const k in scen.bulkTop) { const b = BULKHEADS.findIndex(x => x.id === k); if (b >= 0) sim.bulkTop[b] = scen.bulkTop[k]; }
    if (scen.doorsOpen) for (const id of scen.doorsOpen) { const b = BULKHEADS.findIndex(x => x.id === id); if (b >= 0) sim.doorOpen[b] = 1; }
    if (scen.coalListDeg !== undefined) p.coalListDeg = scen.coalListDeg;

    // mass properties from the night's drafts (Wilding): 30'9" fwd, 33'9" aft
    const th0 = Math.asin((p.draftF - p.draftA) / G.LBP);
    const tz0 = -0.5 * (p.draftF + p.draftA);
    sim.g0 = [0, 0, 0]; sim.XO = 0; sim.YO = 0;
    const F0 = { };
    {
      const c = Math.cos(th0), s = Math.sin(th0);
      Object.assign(F0, { R00: c, R01: 0, R02: s, R10: 0, R11: 1, R12: 0, R20: -s, R21: 0, R22: c, tx: 0, ty: 0, tz: tz0, cth: c });
    }
    const hb0 = hydroPass(sim, F0, {});
    sim.ms = RHO * hb0.V;
    const KM = ship.hyd.KB + ship.hyd.BM;
    const KG = KM - p.GM0;
    const xBw = F0.R00 * hb0.x + F0.R02 * hb0.z;          // world X of buoyancy centre
    const xG = (xBw - Math.sin(th0) * KG) / Math.cos(th0);
    const yG = p.GM0 * Math.tan(p.coalListDeg * Math.PI / 180);  // + = port
    sim.g0 = [xG, yG, KG];
    sim.XO = Math.cos(th0) * xG + Math.sin(th0) * KG;
    sim.YO = 0;
    sim.zO = -Math.sin(th0) * xG + Math.cos(th0) * KG + tz0;
    sim.pitch = th0; sim.roll = 0;
    sim.KG = KG;

    // inertia and damping
    const B = G.B, Lp = G.LBP;
    sim.mh0 = sim.ms * (1 + p.addedHeave);
    sim.Ith0 = sim.ms * (p.kPitch * Lp) ** 2 * (1 + p.addedPitch);
    sim.Iph0 = sim.ms * (p.kRoll * B) ** 2 * (1 + p.addedRoll);
    const Kz = RHO * GRAV * ship.hyd.Awp;
    const Kth = RHO * GRAV * ship.hyd.V * ship.hyd.BML;
    const Kph = RHO * GRAV * ship.hyd.V * p.GM0;
    sim.cDz = 2 * p.zetaHeave * Math.sqrt(Kz * sim.mh0);
    sim.cDth = 2 * p.zetaPitch * Math.sqrt(Kth * sim.Ith0);
    sim.cDph = 2 * p.zetaRoll * Math.sqrt(Kph * sim.Iph0);
    sim.qz = 0.5 * RHO * 1.0 * Lp * B * 0.8;
    sim.qth = 0.25 * RHO * 1.0 * B * Math.pow(Lp / 2, 4);
    sim.qph = 0.25 * RHO * 1.0 * Lp * Math.pow(B / 2, 4);

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
    const S = sim.conn;
    for (let c = 0; c < S.n; c++) if (S.kind[c] === K_DOOR && S.idx[c] === b) S.en[c] = open ? 1 : 0;
  }
  function setBulkheadTop(sim, b, deck) { sim.bulkTop[b] = deck; rebuildConnections(sim); }

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
    for (let k = 0; k < 16; k++) {
      let vm = 0; for (let s = 0; s < 4; s++) vm += sim.ship.nodeVmax[k * 4 + s];
      zoneFill[k] = zoneVol[k] / vm;
    }
    let breachIn = 0;
    const S = sim.conn;
    for (let c = 0; c < S.n; c++) if (S.kind[c] === K_BREACH || S.kind[c] === K_OPEN) breachIn += S.q[c];
    return {
      t: sim.t, trimDeg: sim.pitch * 180 / Math.PI, listDeg: sim.roll * 180 / Math.PI,
      draftF, draftA, waterT: water * RHO / 1000, waterM3: water,
      inflowTpm: sim.inflow * RHO / 1000 * 60,
      holeTpm: breachIn * RHO / 1000 * 60,
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
      openings: sim.openings.map(o => ({ x: o.x, y: o.y, z: o.z, area: o.area, kind: o.kind, tOpen: o.tOpen, label: o.label })),
      params: Object.assign({}, sim.params),
      overT: Array.from(sim.overT), markT: Object.assign({}, sim.markT), events: sim.events.slice(),
      foundered: sim.foundered, founderT: sim.founderT,
    };
  }
  function restore(ship, d) {
    const bulkTop = {}; BULKHEADS.forEach((b, i) => { bulkTop[b.id] = d.bulkTop[i]; });
    const doorsOpen = BULKHEADS.filter((b, i) => d.doorOpen[i]).map(b => b.id);
    const sim = createSim(ship, d.params, { bulkTop, doorsOpen, coalListDeg: d.params.coalListDeg });
    for (const o of d.openings) addOpening(sim, o);
    sim.t = d.t; sim.zO = d.zO; sim.pitch = d.pitch; sim.roll = d.roll; sim.vz = d.vz; sim.wth = d.wth; sim.wph = d.wph;
    sim.vol.set(d.vol); sim.level.set(d.level);
    sim.overT.set(d.overT); Object.assign(sim.markT, d.markT); sim.events = d.events.slice();
    sim.foundered = d.foundered; sim.founderT = d.founderT;
    const F = poseFrame(sim, sim.zO, sim.pitch, sim.roll, sim._F);
    solveLevels(sim, F, true);
    return sim;
  }

  return {
    serialize, restore,
    FT, RHO, GRAV, LT, G, HULL, BULKHEADS, ZONES, MU_UP, NN, DEFAULT_PARAMS, MARKS,
    K: { DOOR: K_DOOR, OVER: K_OVER, DOWN: K_DOWN, XLOW: K_XLOW, XMERGE: K_XMERGE, XUP: K_XUP, TOP: K_TOP, BREACH: K_BREACH, OPEN: K_OPEN },
    sheer, deckZ, inWell, zTopAt, xFwd, xAft, halfBreadth, nodeIndex, zoneAt,
    zoneBounds, buildColumns, evenKeel,
    buildShip, createSim, step, run, readouts, gmNow, frameOf, worldZ, poseFrame, hydroPass,
    addOpening, removeOpening, setOpeningArea, setDoor, setBulkheadTop, equilibrate,
  };
});
