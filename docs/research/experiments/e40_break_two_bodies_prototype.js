// e40 (2026-11-19): can the existing core carry two bodies after a break that the gauge itself calls? A scratch prototype
// for docs/DESIGN_the_break_and_two_bodies_v1_2026-11-19.md, not the module. It writes nothing and changes nothing: it reads
// core/core.js and core/readers/girder.js of the tree named by TITANIC_ROOT (default: this repository). Output of 2026-11-19
// on a clean worktree of a97a6bd: results_2026-11-19/e40_break_two_bodies_prototype.txt
//
//   node e_break_proto.js <capGNm> <held|free> [xb] [openK]
//
// 1. the 1912 damage preset runs until the gauge's moment at its governing station reaches the capacity given;
// 2. the hull is cut at the slice edge nearest xb (default: the governing station) into two fragment "ships" made of the
//    parent's own columns; each gets its mass, centre and inertia from the gauge's weight curve, the parent's water, the
//    parent's pose and rates at that instant, and an open end (stacked 1 m orifices over the cut section);
// 3. each fragment is then stepped by the core's own C.step, alone. No hinge, no contact between them.
const path = require('path');
// the checkout whose core is read: TITANIC_ROOT, else the repository this file sits in (docs/research/experiments/), else main
const fs = require('fs');
const ROOT = process.env.TITANIC_ROOT || (fs.existsSync(path.join(__dirname, '../../../core/core.js')) ? path.join(__dirname, '../../..') : 'C:/code/titanic-sinking-simulator-main');
console.log('core read from ' + ROOT.replace(/\\/g, '/') + ', core.js sha256 ' + require('crypto').createHash('sha256').update(fs.readFileSync(path.join(ROOT, 'core/core.js'))).digest('hex').slice(0, 12));
const C = require(path.join(ROOT, 'core/core.js'));
const SC = require(path.join(ROOT, 'core/scenarios.js'));
const GI = require(path.join(ROOT, 'core/readers/girder.js'));
const CAP = (+process.argv[2] || 5.0) * 1e9, HELD = process.argv[3] === 'held', XB_ARG = process.argv[4] !== undefined && process.argv[4] !== 'gov' ? +process.argv[4] : null, OPENK = process.argv[5] === 'openK';
const D2R = Math.PI / 180, RHO = C.RHO, GRAV = C.GRAV, NN = C.NN;

const ship = C.buildShip();
const sim = C.createSim(ship, {}, SC.PRESETS.titanic.build({}));
if (HELD) sim.Iph0 = 1e30;                      // what-if: her list held where it is (the model's roll to 80 degrees is a known fault)

// ---- 1. to the break
let res = null, peakM = 0, peakT = 0, peakTrim = 0;
while (!sim.foundered && sim.t < 4 * 3600) {
  C.step(sim);
  if (sim.t < 140 * 60) continue;
  res = GI.moment(sim);
  if (res.gov.M > peakM) { peakM = res.gov.M; peakT = sim.t; peakTrim = sim.pitch / D2R; }
  if (res.gov.M >= CAP) break;
}
const f1 = (v, d) => (+v).toFixed(d === undefined ? 2 : d);
console.log(`cap ${f1(CAP / 1e9)} GN m, list ${HELD ? 'held' : 'free'}: ` + (res.gov.M >= CAP
  ? `BREAK at T ${f1(sim.t / 60)} min, trim ${f1(sim.pitch / D2R)} deg, list ${f1(sim.roll / D2R, 1)} deg; governing station x ${f1(res.gov.x)} (${res.gov.where}), M ${f1(res.gov.M / 1e9, 3)}; hull peak ${f1(res.peak.M / 1e9, 3)} at x ${f1(res.peak.x, 1)}; shear there ${f1(res.band.V[res.gov.i] / 1e6, 0)} MN`
  : `NO BREAK: foundered at T ${f1(sim.founderT / 60)}; peak ${f1(peakM / 1e9, 3)} GN m at T ${f1(peakT / 60)}, trim ${f1(peakTrim)}`));
if (!(res.gov.M >= CAP)) process.exit(0);
// where it would break along the whole hull with one capacity, and with the joint's 10 % knock-down
{
  const h = res.hull; let bi = 0, bj = 0, rj = 0;
  for (let j = 0; j < h.x.length; j++) { if (h.M[j] > h.M[bi]) bi = j; const r = h.M[j] / GI.capacity(h.x[j], CAP, 'hog', true); if (r > rj) { rj = r; bj = j; } }
  console.log(`  along the hull: largest moment at x ${f1(h.x[bi], 1)} (${f1(h.M[bi] / 1e9, 3)}); largest moment/capacity with the aft joint 10 % weaker at x ${f1(h.x[bj], 1)} (ratio ${f1(rj, 3)})`);
  const row = []; for (let j = 0; j < h.x.length; j += 6) row.push(f1(h.x[j], 0) + ':' + f1(h.M[j] / 1e9, 2)); console.log('  M(x) GN m: ' + row.join('  '));
}

// ---- 2. the cut
const cols = ship.cols, sl = cols.slices.slice().sort((a, b) => a.xc - b.xc);
const edges = sl.map(s => s.xc - 0.5 * s.dx).concat([sl[sl.length - 1].xc + 0.5 * sl[sl.length - 1].dx]);
const want = XB_ARG === null ? res.gov.x : XB_ARG;
let xb = edges[0]; for (const e of edges) if (Math.abs(e - want) < Math.abs(xb - want)) xb = e;
console.log(`  cut at the slice edge x ${f1(xb)} (asked ${f1(want)})` + (OPENK ? '; bulkhead K torn out (doors and top opened)' : ''));

function fragmentShip(keep) {
  const id = []; for (let i = 0; i < cols.N; i++) if (keep(cols.x[i])) id.push(i);
  const pick = (a, T) => T.from(id.map(i => a[i]));
  const fc = { N: id.length, dy: cols.dy, x: pick(cols.x, Float64Array), y: pick(cols.y, Float64Array), dxdy: pick(cols.dxdy, Float64Array), dx: pick(cols.dx, Float64Array),
    zlo: pick(cols.zlo, Float64Array), zhi: pick(cols.zhi, Float64Array), zone: pick(cols.zone, Int32Array), side: pick(cols.side, Int32Array), slices: [] };
  const map = new Map(); id.forEach((i, j) => map.set(i, j));
  for (const s of cols.slices) if (keep(s.xc)) fc.slices.push({ xc: s.xc, dx: s.dx, zone: s.zone, first: map.get(s.first), count: s.count });
  const zones = ship.zones, lists = Array.from({ length: NN }, () => []);
  for (let i = 0; i < fc.N; i++) {
    const k = fc.zone[i], sd = fc.side[i], zE = C.deckZ('E', fc.x[i]);
    const a0 = Math.max(fc.zlo[i], zones[k].floor), e0 = Math.min(fc.zhi[i], zE); if (e0 > a0 + 1e-3) lists[C.nodeIndex(k, sd, 0)].push([i, a0, e0]);
    const a1 = Math.max(fc.zlo[i], zE), e1 = fc.zhi[i]; if (e1 > a1 + 1e-3) lists[C.nodeIndex(k, sd, 1)].push([i, a1, e1]);
  }
  const nodeStart = new Int32Array(NN), nodeCount = new Int32Array(NN), ent = [];
  for (let n = 0; n < NN; n++) { nodeStart[n] = ent.length; nodeCount[n] = lists[n].length; for (const e of lists[n]) ent.push(e); }
  const entCol = Int32Array.from(ent.map(e => e[0])), entA = Float64Array.from(ent.map(e => e[1])), entE = Float64Array.from(ent.map(e => e[2]));
  const nodeMu = new Float64Array(NN), nodeVmax = new Float64Array(NN), nodeAmin = new Float64Array(NN), nodeAov = new Float64Array(NN);
  for (let n = 0; n < NN; n++) {
    nodeMu[n] = (n & 1) ? C.MU_UP : zones[n >> 2].mu;
    let vm = 0, fp = 0; for (let j = nodeStart[n]; j < nodeStart[n] + nodeCount[n]; j++) { const i = entCol[j]; vm += fc.dxdy[i] * (entE[j] - entA[j]); fp += fc.dxdy[i]; }
    nodeVmax[n] = nodeMu[n] * vm; nodeAmin[n] = Math.max(4, 0.15 * nodeMu[n] * fp); nodeAov[n] = Math.max(1, 0.03 * fp);
  }
  const hyd = C.evenKeel(fc, 0.5 * (C.DEFAULT_PARAMS.draftF + C.DEFAULT_PARAMS.draftA));
  return { cols: fc, zones, nodeStart, nodeCount, entCol, entA, entE, nodeMu, nodeVmax, nodeAmin, nodeAov, hyd, hull: ship.hull };
}
// mass, centre and inertia of the weight curve over [lo, hi]
function massOf(lo, hi) {
  const cv = GI.weight(sim); let m = 0, mx = 0, mz = 0; const cells = [];
  for (const p of cv.pieces) {
    const a = Math.max(lo, p.x0), b = Math.min(hi, p.x1); if (!(b > a)) continue;
    const n = Math.max(1, Math.ceil((b - a) / 0.5)), h = (b - a) / n;
    for (let i = 0; i < n; i++) { const x = a + (i + 0.5) * h, w = (p.w0 + (p.w1 - p.w0) * (x - p.x0) / (p.x1 - p.x0)) * h * 1000; m += w; mx += w * x; mz += w * p.z; cells.push([w, x, p.z]); }
  }
  const xg = mx / m, zg = mz / m; let I = 0; for (const [w, x, z] of cells) I += w * ((x - xg) * (x - xg) + (z - zg) * (z - zg));
  return { m, xg, zg, I };
}
function fragmentSim(name, keep, lo, hi, endX) {
  const fs = fragmentShip(keep), p = sim.params, Fp = C.frameOf(sim);
  const f = C.createSim(fs, Object.assign({}, p), {});
  const mp = massOf(lo, hi), g = [mp.xg, sim.g0[1], mp.zg];
  const W = (F, q) => [F.R00 * q[0] + F.R01 * q[1] + F.R02 * q[2] + F.tx, F.R10 * q[0] + F.R11 * q[1] + F.R12 * q[2] + F.ty, F.R20 * q[0] + F.R21 * q[1] + F.R22 * q[2] + F.tz];
  const w0 = W(Fp, g), dt = p.dt, Fn = C.poseFrame(sim, sim.zO + sim.vz * dt, sim.pitch + sim.wth * dt, sim.roll + sim.wph * dt, {}), w1 = W(Fn, g);
  f.ms = mp.m; f.g0 = g; f.KG = mp.zg; f.XO = w0[0]; f.YO = w0[1]; f.zO = w0[2]; f.pitch = sim.pitch; f.roll = sim.roll;
  f.vz = (w1[2] - w0[2]) / dt; f.wth = sim.wth; f.wph = sim.wph; f.t = sim.t; f.foundered = false; f.founderT = -1; f.events = [];
  // inertia and damping, formed as the core forms the whole ship's, from the fragment's own waterplane at the night's draft [bets, as there]
  const fc = fs.cols, T = 0.5 * (p.draftF + p.draftA), B = C.G.B, Lf = hi - lo; let Awp = 0, Ax = 0, V = 0;
  for (let i = 0; i < fc.N; i++) { if (T > fc.zlo[i] && T < fc.zhi[i]) { Awp += fc.dxdy[i]; Ax += fc.dxdy[i] * fc.x[i]; } if (T > fc.zlo[i]) V += fc.dxdy[i] * (Math.min(T, fc.zhi[i]) - fc.zlo[i]); }
  const xf = Ax / Awp; let IL = 0; for (let i = 0; i < fc.N; i++) if (T > fc.zlo[i] && T < fc.zhi[i]) IL += fc.dxdy[i] * (fc.x[i] - xf) * (fc.x[i] - xf);
  f.mh0 = f.ms * (1 + p.addedHeave); f.Ith0 = mp.I * (1 + p.addedPitch); f.Iph0 = HELD ? 1e30 : f.ms * (p.kRoll * B) ** 2 * (1 + p.addedRoll);
  f.cDz = 2 * p.zetaHeave * Math.sqrt(RHO * GRAV * Awp * f.mh0); f.cDth = 2 * p.zetaPitch * Math.sqrt(RHO * GRAV * IL * f.Ith0); f.cDph = 2 * p.zetaRoll * Math.sqrt(RHO * GRAV * V * p.GM0 * (HELD ? 1 : f.Iph0));
  f.qz = 0.5 * RHO * Lf * B * 0.8; f.qth = 0.25 * RHO * B * Math.pow(Lf / 2, 4); f.qph = 0.25 * RHO * Lf * Math.pow(B / 2, 4);
  // the parent's water: whole in the zones she keeps whole, by share of capacity in the cut zone
  for (let n = 0; n < NN; n++) { const sh = ship.nodeVmax[n] > 0 ? fs.nodeVmax[n] / ship.nodeVmax[n] : 0; f.vol[n] = sim.vol[n] * sh; f.level[n] = sim.level[n]; }
  f.doorOpen.set(sim.doorOpen); f.bulkTop = sim.bulkTop.slice(); f.pumpSched = [];
  if (OPENK && name === 'stern') { const b = C.BULKHEADS.findIndex(x => x.id === 'K'); f.doorOpen[b] = 1; f.bulkTop[b] = 'F'; }
  for (const o of sim.openings) if (keep(o.x)) C.addOpening(f, { x: o.x, y: o.y, z: o.z, area: o.area, kind: o.kind, tOpen: 0, label: o.label });
  // the open end: the cut section in 1 m strips, port and starboard, from the keel to the hull's top there
  let Aend = 0; const zt = C.zTopAt(endX);
  for (let z = 0.5; z < zt; z += 1) { const hbw = C.halfBreadth(endX, z); if (hbw < 0.3) continue; for (const s of [1, -1]) { C.addOpening(f, { x: endX, y: s * 0.5 * hbw, z, area: hbw * 1.0, kind: 'breach', tOpen: 0, label: 'the break' }); Aend += hbw; } }
  // nothing flows to or from a space this fragment does not have
  const S = f.conn; let off = 0;
  for (let c = 0; c < S.n; c++) { const a = S.a[c], b = S.b[c]; if ((a >= 0 && fs.nodeVmax[a] <= 0) || fs.nodeVmax[b] <= 0) { if (S.en[c]) off++; S.en[c] = 0; } }
  let cap = 0, wat = 0; for (let n = 0; n < NN; n++) { cap += fs.nodeVmax[n]; wat += f.vol[n]; }
  console.log(`  ${name}: x ${f1(lo, 1)} to ${f1(hi, 1)}, ${f1(mp.m / 1e6, 0)} t, centre x ${f1(mp.xg, 1)} z ${f1(mp.zg, 1)}; floodable ${f1(cap, 0)} m3, water aboard ${f1(wat * RHO / 1000, 0)} t; open end ${f1(Aend, 0)} m2; ${off} connections shut; vz ${f1(f.vz)} m/s`);
  return f;
}
const xs = edges[0], xe = edges[edges.length - 1];
const stern = fragmentSim('stern', x => x < xb, xs, xb, xb - 0.2), bow = fragmentSim('bow', x => x > xb, xb, xe, xb + 0.2);

// ---- 3. each alone
function watch(name, f, endX, farX) {
  const t0 = f.t, rows = []; let under = -1, maxTrim = -1e9, minTrim = 1e9, tMax = 0, tMin = 0, next = 0;
  const FR = () => C.frameOf(f);
  while (f.t - t0 < 20 * 60) {
    if (f.t - t0 >= next) {
      const F = FR(), r = C.readouts(f);
      rows.push(`${String(Math.round(f.t - t0)).padStart(5)} s  trim ${f1(f.pitch / D2R, 1).padStart(6)}  list ${f1(f.roll / D2R, 1).padStart(6)}  top ${f1(f.hullTop === undefined ? 0 : f.hullTop, 1).padStart(7)}  break end's deck ${f1(C.worldZ(F, endX, 0, C.zTopAt(endX)), 1).padStart(7)}  far end's deck ${f1(C.worldZ(F, farX, 0, C.zTopAt(farX)), 1).padStart(7)}  water ${f1(r.waterT, 0).padStart(6)} t  in ${f1(r.inflowTpm, 0).padStart(7)} t/min  vz ${f1(f.vz, 2).padStart(6)}`);
      next += (f.t - t0 < 240 ? 15 : 60);
    }
    C.step(f);
    const tr = f.pitch / D2R; if (tr > maxTrim) { maxTrim = tr; tMax = f.t - t0; } if (tr < minTrim) { minTrim = tr; tMin = f.t - t0; }
    if (!Number.isFinite(f.zO) || !Number.isFinite(f.pitch)) { rows.push('  NaN: the step failed'); break; }
    if (under < 0 && f.hullTop < 0) under = f.t - t0;
    if (f.hullTop < -40) break;
  }
  console.log(`\n${name} after the break: wholly under at ${under < 0 ? 'never (20 min)' : f1(under, 0) + ' s (T ' + f1((t0 + under) / 60) + ' min)'}; trim from ${f1(minTrim, 1)} (at ${f1(tMin, 0)} s) to ${f1(maxTrim, 1)} deg (at ${f1(tMax, 0)} s)`);
  for (const r of rows) console.log('  ' + r);
}
watch('BOW', bow, xb + 0.2, 120);
watch('STERN', stern, xb - 0.2, -125);
