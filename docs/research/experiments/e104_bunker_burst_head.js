// e104 (W6, the calibration epoch's history match): the bunker of the fire's burst head, first order. W6's pocket (the
// empty starboard half of boiler room 5's forward bunker, against bulkhead E, from the tank top to G deck) gives way when
// the head of its own water over its floor reaches params.bunkerBurst, 13.0 m [bet: set to the head the 1912 damage puts
// on it at T 60]. e103 (the mainline's Morris screen) found it second only to the opening: across 9 to 17 m it moves the
// founder by 35 min. Here:
//   A. the model's own bunker on the 1912 preset and the 1912 watch: how fast it fills, the head on it, when it bursts;
//   B. the bunker filled as the record describes its leak (the Report: "a stream about the size of a deck hose"; Barrett,
//      BI 2255: "an ordinary fire hose"), against the model's own sea at the hole along the preset's path, into the
//      pocket's half bunker and into a whole cross bunker (no fore-and-aft division: NOT FOUND either way), with and
//      without the model's door leak; once full, its head is the sea's over its floor;
//   C. what its door and its wall can bear, as a head of water over the bunker's floor: the coal door (a plate between
//      its guides, in plastic bending), the wall's plating between stiffeners, and its stiffeners (plastic collapse, the
//      scantling sets below; simply supported or bracketed);
//   D. for each such head, when the bunker would burst: with the model's fill (A) and with the record's (B).
// Headless; changes nothing. Numbers' tags as the repository's: [read], [derived], [bet].
//   node docs/research/experiments/e104_bunker_burst_head.js [<worktree>]
'use strict';
const path = require('path');
const cp = require('child_process');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', '..'));
const C = require(path.join(root, 'core', 'core.js'));
const SC = require(path.join(root, 'core', 'scenarios.js'));
const N = require(path.join(root, 'core', 'night.js'));
const t0 = Date.now(), ship = C.buildShip(), RHO = C.RHO, GRAV = C.GRAV, IN = 0.0254, FT = C.FT, RG = RHO * GRAV;
let head = '?'; try { head = cp.execSync('git -C "' + root + '" rev-parse --short HEAD').toString().trim(); } catch (e) { /* not a repository */ }
const say = (s) => console.log(s === undefined ? '' : s);
const f = (v, d) => (v === null || v === undefined || !Number.isFinite(v)) ? 'n/a' : v.toFixed(d === undefined ? 2 : d);

say('e104 (W6, the epoch) on ' + root + ' at ' + head + ': the bunker of the fire, its fill and its burst head, first order');
say();

// ---------------------------------------------------------------- A. the model's own bunker
function runModel(kind, holdForGood) {
  const sim = kind === 'watch' ? N.create(ship, N.spec(1912), { auto: true }) : C.createSim(ship, {}, SC.PRESETS.titanic.build());
  if (holdForGood) sim.params.bunkerBurst = 1e9;     // the bunker held for good (W6's e76, again on this tree)
  const step = kind === 'watch' ? () => N.step(sim) : () => C.step(sim);
  const Tof = () => kind === 'watch' ? (sim.night.tTouch >= 0 ? (sim.t - sim.night.tTouch) / 60 : -1) : sim.t / 60;
  const pk = sim.pockets[0];
  const rows = [], trace = [];
  let next = 0, full = null, burst = null, lastV = 0, lastT = 0, area = null;
  const xE = C.BULKHEADS.find(b => b.id === 'E').x;
  const hole = { x: xE - 2 * FT, z: pk.z0 + 4 * FT };      // Barrett's hole: 2 ft abaft E, 2 ft over the plates, the plates 2 ft over the bunker's bottom [read: BI 2096, 2105]
  hole.y = -C.halfBreadth(hole.x, hole.z, ship.hull);
  const tEnd = holdForGood ? 1e9 : 100;
  while (Tof() < tEnd && !sim.foundered && sim.t < 4 * 3600) {
    step();
    const T = Tof(); if (T < 0) continue;
    const F = C.frameOf(sim), floorW = C.worldZ(F, pk.xd, pk.yd, pk.z0);
    const seaFloor = -floorW, seaHole = -C.worldZ(F, hole.x, hole.y, hole.z);
    const headIn = pk.state === 0 && pk.vol > 1e-6 ? sim._hEff[C.NN] - floorW : null;
    // the hull openings inside it: the most they reach (the watch's are opened by the contact over its first seconds)
    { let a = 0; for (const o of sim.openings) if (o.x >= pk.x0 && o.x <= pk.x1 && o.side === pk.side && o.layer === 0 && o.z >= pk.z0 && o.z <= pk.z1) a += o.area; if (area === null || a > area) area = a; }
    trace.push({ T, seaFloor, seaHole, headIn });
    if (!full && pk.vol >= pk.cap) full = { T, seaFloor };
    if (!burst && pk.state === 1) burst = { T: pk.t / 60 - (kind === 'watch' ? sim.night.tTouch / 60 : 0), seaFloor };
    if (T >= next) {
      const q = T > lastT ? (pk.vol - lastV) / ((T - lastT) * 60) : 0;
      rows.push({ T, vol: pk.vol, frac: pk.vol / pk.cap, headIn, seaFloor, seaHole, q, state: pk.state });
      lastV = pk.vol; lastT = T; next += T < 20 ? 2 : 10;
    }
  }
  return { kind, pk, rows, trace, full, burst, area, hole, founderT: sim.foundered ? (kind === 'watch' ? (sim.founderT - sim.night.tTouch) / 60 : sim.founderT / 60) : null };
}
const A = { preset: runModel('preset'), watch: runModel('watch') };
const PK = A.preset.pk;
say('A. THE MODEL\'S BUNKER (W6\'s pocket: from bulkhead E aft ' + f(PK.x1 - PK.x0, 2) + ' m, from its floor at ' + f(PK.z0, 2) + ' m to G deck at ' + f(PK.z1, 2) + ' m, the centreline to the shell)');
say('   its capacity ' + f(PK.cap, 1) + ' m3 (' + f(PK.z1 - PK.z0, 2) + ' m tall); once full its head rises by 1 m a m3 (bunkerAov ' + C.DEFAULT_PARAMS.bunkerAov + ' m2); it bursts at a head of ' + C.DEFAULT_PARAMS.bunkerBurst + ' m over its floor');
for (const k of ['preset', 'watch']) {
  const r = A[k];
  say('  ' + k + ': the hull openings inside it ' + f(r.area, 4) + ' m2; full at T ' + f(r.full && r.full.T, 1) + '; bursts at T ' + f(r.burst && r.burst.T, 2) + ' (the sea then ' + f(r.burst && r.burst.seaFloor, 2) + ' m over its floor)');
  say('      T   water m3  full   head in it   the sea over its floor   over Barrett\'s hole   inflow m3/s');
  for (const w of r.rows) if (w.T <= 96) say('    ' + f(w.T, 0).padStart(4) + f(w.vol, 1).padStart(10) + (f(100 * w.frac, 0) + ' %').padStart(7) + (w.headIn === null ? (w.state ? 'burst' : '-') : f(w.headIn, 2)).padStart(12) + f(w.seaFloor, 2).padStart(16) + f(w.seaHole, 2).padStart(22) + f(w.q, 3).padStart(16));
}
// held for good: the most head the sea puts on it, and when (above it the bunker never bursts)
const HELD = { preset: runModel('preset', true), watch: runModel('watch', true) };
for (const k of ['preset', 'watch']) {
  const H0 = HELD[k];
  let hin = null; for (const w of H0.trace) if (w.headIn !== null && (hin === null || w.headIn > hin.headIn)) hin = w;
  H0.peak = hin;
  const at10 = [60, 73, 90, 100, 120, 140].map(T => { const w = H0.trace.find(v => v.T >= T); return w && w.headIn !== null ? 'T ' + T + ' ' + f(w.headIn, 2) : 'T ' + T + ' -'; }).join(', ');
  say('  held for good, ' + k + ': the head in it ' + at10 + '; its peak ' + f(hin && hin.headIn, 2) + ' m at T ' + f(hin && hin.T, 1) + '; founders at T ' + f(H0.founderT, 2));
}
say();

// ---------------------------------------------------------------- B. the bunker filled as the record describes its leak
// the bunker's plan area at a height y over its floor (the half bunker: the centreline to the shell), from the hull's form
const xs = (n) => Array.from({ length: n }, (_, i) => PK.x0 + (i + 0.5) * (PK.x1 - PK.x0) / n);
function planArea(y) { let a = 0; for (const x of xs(16)) a += C.halfBreadth(x, PK.z0 + y, ship.hull) * (PK.x1 - PK.x0) / 16; return a; }
const H = PK.z1 - PK.z0, NY = 200, YS = [], VS = [0];
for (let i = 0; i <= NY; i++) YS.push(H * i / NY);
for (let i = 1; i <= NY; i++) VS.push(VS[i - 1] + 0.5 * (planArea(YS[i - 1]) + planArea(YS[i])) * (H / NY));
const levelOf = (V, mult) => { const v = V / mult; if (v >= VS[NY]) return H; let i = 1; while (VS[i] < v) i++; return YS[i - 1] + (YS[i] - YS[i - 1]) * (v - VS[i - 1]) / (VS[i] - VS[i - 1]); };
const capHalf = VS[NY];
const trP = HELD.preset.trace;    // the preset's path with the bunker held (no early burst in it), as the record's bunker held
const at = (T, key) => { if (T <= trP[0].T) return trP[0][key]; for (let i = 1; i < trP.length; i++) if (trP[i].T >= T) { const a = trP[i - 1], b = trP[i]; return a[key] + (b[key] - a[key]) * (T - a.T) / (b.T - a.T); } return trP[trP.length - 1][key]; };
const yHole = 4 * FT;
// fill: stream of diameter d (m; the stream's own area, Cd 1: the record names the stream's size, not the hole's), the
// bunker `mult` halves (1: the pocket's half; 2: a whole cross bunker), its door leaking leak m2 (Cd 0.6, the model's
// CdDoor) to a pumped, dry stokehold; returns the level or head over the floor every minute and the time it is full
function fill(d, mult, leak) {
  const As = Math.PI * d * d / 4, out = [];
  let V = 0, fullT = null;
  for (let s = 0; s <= 100 * 60; s++) {
    const T = s / 60, y = levelOf(V, mult), isFull = V >= capHalf * mult;
    if (isFull && fullT === null) fullT = T;
    const sea = at(T, 'seaHole'), dIn = Math.max(0, sea - Math.max(0, y - yHole));
    const qin = As * Math.sqrt(2 * GRAV * dIn);
    const hDoor = Math.max(0, y - 2 * FT), qout = leak > 0 ? 0.6 * leak * Math.sqrt(2 * GRAV * hDoor) : 0;
    if (s % 60 === 0) out.push({ T, y, head: isFull ? at(T, 'seaFloor') : y });
    if (!isFull) V += (qin - qout);
    if (V < 0) V = 0;
  }
  return { out, fullT };
}
const CASES = [
  ['3 in stream, half bunker, no leak', 3 * IN, 1, 0], ['3 in stream, half bunker, the model\'s door leak 0.005 m2', 3 * IN, 1, 0.005],
  ['2.5 in stream, half bunker, no leak', 2.5 * IN, 1, 0], ['3 in stream, whole cross bunker, no leak', 3 * IN, 2, 0],
  ['two 3 in streams, half bunker, no leak', 3 * IN * Math.SQRT2, 1, 0],
];
say('B. THE BUNKER FILLED AS THE RECORD DESCRIBES ITS LEAK ("a stream about the size of a deck hose"), against the preset\'s own sea');
say('   the half bunker holds ' + f(capHalf, 1) + ' m3 by the hull\'s form (the pocket: ' + f(PK.cap, 1) + '); its plan area ' + f(planArea(0.5), 1) + ' m2 at 0.5 m, ' + f(planArea(H / 2), 1) + ' at half height, ' + f(planArea(H - 0.1), 1) + ' at the top');
say('   the level over its floor (m), then once full the sea\'s head over its floor; T in min after the collision');
say('   case                                                   T 30    T 45    T 60    T 75    T 90   full at T');
const FILLS = CASES.map(([name, d, mult, leak]) => { const r = fill(d, mult, leak); say('   ' + name.padEnd(54) + [30, 45, 60, 75, 90].map(T => f(r.out[T].head, 2).padStart(8)).join('') + f(r.fullT, 1).padStart(12)); return { name, r }; });
say();

// ---------------------------------------------------------------- C. what the door and the wall can bear
const SY = 262e6;          // N/m2: her hull plate's lower recovered yield (NIST-IR 6118) [read in section.js]; the door's own NOT FOUND
const doorCentre = 2 * FT + 1 * FT;    // its sill at the stokehold plates (2 ft over the bunker's bottom, BI 2096) and 2 ft tall [bet]: its centre 3 ft up
say('C. WHAT THE DOOR AND THE WALL CAN BEAR, as a head of water over the bunker\'s floor (m); mild steel at ' + f(SY / 1e6, 0) + ' MPa');
say('  C1. the coal door, a plate spanning its guides, in plastic bending (p = 2 sY t^2 / b^2, simply supported), its centre ' + f(doorCentre, 2) + ' m up [bet]');
say('      span b (in) ->     18      21      24      27      30');
for (const tIn of [0.25, 0.3125, 0.375, 0.4375, 0.5]) {
  const t = tIn * IN;
  say('      t ' + (tIn + ' in').padEnd(10) + [18, 21, 24, 27, 30].map(bIn => { const b = bIn * IN, p = 2 * SY * t * t / (b * b); return f(p / RG + doorCentre, 1).padStart(8); }).join(''));
}
// the wall's plating between stiffeners at the floor (the most loaded), clamped at the stiffeners: p = 4 sY t^2 / s^2
say('  C2. the wall\'s plating between stiffeners at the floor, a strip clamped at the stiffeners (p = 4 sY t^2 / s^2; membrane action ignored, so a lower bound)');
say('      spacing s (in) ->  24      27      30      33      36');
for (const tIn of [0.25, 0.3, 0.35, 0.4, 0.5]) { const t = tIn * IN; say('      t ' + (tIn + ' in').padEnd(10) + [24, 27, 30, 33, 36].map(sIn => { const s = sIn * IN; return f(4 * SY * t * t / (s * s) / RG, 1).padStart(8); }).join('')); }
// a stiffener with its plating: plastic moment (the plastic neutral axis halves the area; the plating effective over its
// whole spacing in tension, Faulkner's width in compression)
function plasticMoment(st, tp, s, plateInCompression) {
  const beta = (s / tp) * Math.sqrt(SY / 207e9), be = plateInCompression ? Math.min(1, beta > 1 ? 2 / beta - 1 / (beta * beta) : 1) * s : s;
  const parts = [{ y0: 0, y1: tp, w: be }, { y0: tp, y1: tp + st.d, w: st.tw }];
  if (st.bf > st.tw) parts.push({ y0: tp + st.d - st.tf, y1: tp + st.d, w: st.bf - st.tw });
  const n = 4000, top = tp + st.d, dy = top / n; let Atot = 0; const a = new Float64Array(n);
  for (let i = 0; i < n; i++) { const y = (i + 0.5) * dy; let w = 0; for (const p of parts) if (y >= p.y0 && y < p.y1) w += p.w; a[i] = w * dy; Atot += a[i]; }
  let acc = 0, pna = 0; for (let i = 0; i < n; i++) { if (acc + a[i] >= Atot / 2) { pna = (i + (Atot / 2 - acc) / a[i]) * dy; break; } acc += a[i]; }
  let Z = 0; for (let i = 0; i < n; i++) Z += a[i] * Math.abs((i + 0.5) * dy - pna);
  return { Mp: SY * Z, Z, be, A: Atot };
}
// the head over the floor (m) at which a stiffener of span L (m, floor to deck), spacing s collapses, the free moment's
// peak reaching `need`: Mp at mid-span when simply supported; mid-span's Mp plus the ends' when bracketed at both ends
// (equal ends: the free moment at the inner hinge is the sum); w(z) = RG s (h - z)+
function collapseHead(L, s, need) {
  const R0of = (h) => { const n = 400, dz = L / n; let R0 = 0; for (let i = 0; i < n; i++) { const z = (i + 0.5) * dz; R0 += RG * s * Math.max(0, h - z) * (L - z) * dz; } return R0 / L; };
  const Mmax = (h) => {
    const n = 400, dz = L / n; const w = (z) => RG * s * Math.max(0, h - z);
    let best = 0, V = R0of(h), M = 0; for (let i = 0; i < n; i++) { const z = (i + 0.5) * dz; M += V * dz; V -= w(z) * dz; if (M > best) best = M; }
    return best;
  };
  let lo = 0, hi = 60; for (let it = 0; it < 60; it++) { const m = 0.5 * (lo + hi); if (Mmax(m) >= need) hi = m; else lo = m; }
  return { h: hi, R0: R0of(hi) };     // the head, and the heel's reaction then (N: what its lug's rivets carry)
}
const L = PK.z1 - PK.z0;
// The scantling sets, from Lloyd's Register's Rules of 1911-12 (archive.org HECRAR1912; the same rows in 1909-10 and
// 1913-14) [read for this note by a research agent from the page images]. The span, tank top to G deck, 7.81 m, is
// 25.6 ft: Table 10's row for a bulkhead 24 to 26 ft deep and a stiffener span of 25 to 26 ft gives a middle-line
// (watertight) bulkhead plating .34 in at the floor and bulb angles 10 1/2 x 3 1/2 x .56 in, 30 in apart, bracketed at
// heads and heels (section 19, par. 7). Section 22, par. 12 (p. 40), the one rule for "straight bunker sides or casings":
// plating not less than .30 in, stiffeners not more than two frame spaces apart (her frames 3 ft amidships: The
// Shipbuilder 1911) and one inch shallower than a middle-line bulkhead's, heels on double-riveted lugs to the inner
// bottom, heads riveted to the beams. A bulb angle is taken as a plain angle (its bulb left out, a little on the low side).
const BA = (d, b, t) => ({ d: d * IN, tw: t * IN, bf: b * IN, tf: t * IN });
const SETS = [
  // [name, stiffener, plate (in), spacing (in), ends: 'lugs' (simply supported) or 'brackets']
  ['Lloyd\'s bunker side at its widest: BA 9 1/2 x 3 1/2 x .56 at 72 in, plate .30, lugs', BA(9.5, 3.5, 0.56), 0.30, 72, 'lugs'],
  ['the same stiffeners at every frame, 36 in', BA(9.5, 3.5, 0.56), 0.30, 36, 'lugs'],
  ['Lloyd\'s middle-line bulkhead: BA 10 1/2 x 3 1/2 x .56 at 30 in, plate .34, lugs', BA(10.5, 3.5, 0.56), 0.34, 30, 'lugs'],
  ['the same, bracketed at heads and heels', BA(10.5, 3.5, 0.56), 0.34, 30, 'brackets'],
];
say('  C3. the wall\'s stiffeners, from the floor to G deck (span ' + f(L, 2) + ' m), plastic collapse, sized by Lloyd\'s rules of 1911-12 (Table 10; section 22, par. 12);');
say('      the plating\'s effective width by Faulkner where it is in compression; the heel\'s reaction at collapse, and the 7/8 in rivets in single shear it takes (116 kN each)');
say('      set                                                                                 Mp (kN m)   head (m)   heel reaction (kN)   rivets');
const RIVET = 0.25 * Math.PI * (0.875 * IN) * (0.875 * IN) * 300e6;   // N: a 7/8 in rivet in single shear at 300 MPa [bet: the rivets' shear strength]
const C3 = [];
for (const [name, st, tpIn, sIn, ends] of SETS) {
  // mid-span: the plating on the pressure side in compression [bet: which side the stiffeners stand on NOT FOUND]; the
  // bracketed ends: the plating in tension
  const s = sIn * IN, tp = tpIn * IN, mid = plasticMoment(st, tp, s, true), end = plasticMoment(st, tp, s, false);
  const r = collapseHead(L, s, ends === 'brackets' ? mid.Mp + end.Mp : mid.Mp);
  C3.push({ name, h: r.h });
  say('      ' + name.padEnd(86) + f(mid.Mp / 1e3, 0).padStart(10) + f(r.h, 1).padStart(10) + f(r.R0 / 1e3, 0).padStart(18) + f(r.R0 / RIVET, 1).padStart(12));
}
// Wilding (LoL depositions, wilding03): her watertight bulkheads' stiffening "75 to 100 percent" over Lloyd's new rules
{
  const st = BA(10.5, 3.5, 0.56), s = 30 * IN, tp = 0.34 * IN, mid = plasticMoment(st, tp, s, true), end = plasticMoment(st, tp, s, false);
  for (const k of [1.75, 2.0]) { const r = collapseHead(L, s, k * (mid.Mp + end.Mp)); say('      ' + ('her watertight bulkheads\' stiffening, Lloyd\'s bracketed set x ' + k + ' (Wilding: 75 to 100 % over)').padEnd(86) + f(k * mid.Mp / 1e3, 0).padStart(10) + f(r.h, 1).padStart(10) + f(r.R0 / 1e3, 0).padStart(18) + f(r.R0 / RIVET, 1).padStart(12)); }
  // the bunker side at every frame, had the yard stiffened it as far over the rule as Wilding says it did the bulkheads [bet]
  const sb = 36 * IN, stb = BA(9.5, 3.5, 0.56), mb = plasticMoment(stb, 0.30 * IN, sb, true);
  for (const k of [1.75, 2.0]) { const r = collapseHead(L, sb, k * mb.Mp); say('      ' + ('the bunker side at 36 in, its stiffening x ' + k + ' (as Wilding\'s bulkheads; a bet for the bunker), lugs').padEnd(86) + f(k * mb.Mp / 1e3, 0).padStart(10) + f(r.h, 1).padStart(10) + f(r.R0 / 1e3, 0).padStart(18) + f(r.R0 / RIVET, 1).padStart(12)); }
}
say();

// ---------------------------------------------------------------- D. when the bunker would burst, for each head
const burstT = (seq) => (h) => { for (const r of seq) if (r.head >= h) return r.T; return null; };
// the model's fill: read off the runs held for good, which are the same as any run up to the moment it bursts
const heldHead = (k) => HELD[k].trace.filter(w => w.headIn !== null).map(w => ({ T: w.T, head: w.headIn }));
const mP = burstT(heldHead('preset')), mW = burstT(heldHead('watch'));
say('D. WHEN THE BUNKER WOULD BURST for a given head over its floor (T, min after the collision; "never": not by T 100 for the record\'s fill, not before she founders for the model\'s)');
say('   head (m)   the model\'s fill: preset, watch      the record\'s fill: ' + FILLS.slice(0, 4).map((x, i) => 'case ' + (i + 1)).join(', '));
for (const h of [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12.5, 13, 13.5, 14, 14.5, 15, 16, 17]) {
  const recs = FILLS.slice(0, 4).map(x => burstT(x.r.out)(h));
  say('   ' + f(h, 1).padStart(6) + (mP(h) === null ? 'never' : f(mP(h), 1)).padStart(14) + (mW(h) === null ? 'never' : f(mW(h), 1)).padStart(9) + '               ' + recs.map(v => (v === null ? 'never' : f(v, 1)).padStart(8)).join(''));
}
say('   Cases: ' + FILLS.slice(0, 4).map((x, i) => (i + 1) + ' ' + x.name).join('; '));
say();
say('(e104 took ' + f((Date.now() - t0) / 1000, 0) + ' s)');
