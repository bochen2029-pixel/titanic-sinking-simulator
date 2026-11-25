// G1, her lights by circuit (core/readers/circuits.js; docs/DESIGN_the_living_ship_v1_2026-11-23.md, G1), headless.
//   node tools/circuits_tests.js        (about a minute: the 1912 watch three times to the end, and a what-if in part)
// MUST rows are invariants: the table (rooms.js's slabs, their shares, two circuits to a section); nothing fed back (the
// 1912 watch with the reader and without: every step's fingerprint and the model's state); each section's fuses blow on
// the step the sea reaches its switches by the rule, recomputed here from the core's own level, and never mend; her
// light by circuit every step, the plant's lights times the share held, and the circuits' own sum; with no sea in
// reach (no fuse can blow) the plant's lights at every step, to the last dynamo; a what-if, the dynamo flat flooded by
// hand: the emergency circuits alone, where the fuses hold; a section at its threshold, made by hand; the state plain
// data; a preset (D97: the page steps one with no readers), its circuits started and stepped by hand beside it, nothing
// fed back and each section on its step; the drawn ports keyed to their sections (Circuits.sectionOf). CHECK rows: the
// 1912 night's sections, deck by deck, and her light by circuit against the plant's.
'use strict';
const crypto = require('crypto');
const C = require('../core/core.js');
const N = require('../core/night.js');
const Sys = require('../core/systems.js');
const RM = require('../core/readers/rooms.js');
const CI = require('../core/readers/circuits.js');
const ship = C.buildShip();
const rows = []; let fails = 0;
function row(kind, what, value, ref, ok) { rows.push([kind, what, value, ref, ok]); if (kind === 'MUST' && !ok) fails++; }
const f = (x, n) => (x === null || x === undefined || Number.isNaN(x) ? 'n/a' : (+x).toFixed(n === undefined ? 1 : n));
const T = (sim, t) => (t - sim.night.tTouch) / 60;            // minutes after the touch
const fp = (h) => (h >>> 0).toString(16).padStart(8, '0');
function hashState(h, sim) {                                    // the model's whole state after a step, for the comparison
  const m = sim.mo, e = sim.enc, P = sim.plant;
  h.update(Buffer.from(new Float64Array([m.u, m.v, m.r, m.X, m.Y, m.psi, m.del, m.nP, m.nS, m.nC, sim.zO, sim.pitch, sim.roll, sim.inflow, e.berg.X, e.berg.Y, e.bow,
    P.p, P.lights, P.power ? 1 : 0, P.emergency ? 1 : 0, sim.pumped, sim.openings.length]).buffer));
  h.update(Buffer.from(sim.vol.buffer)); h.update(Buffer.from(sim.level.buffer));
}

// ------------------------------------------------------------------ 1. the table
// the sections' places again, here, from rooms.js's table (not the reader's): each one's columns' centroid by their
// footprints, the mean of its columns' bottoms, its mean height, its share of her floors
const RT = RM.table(ship), cols = ship.cols, NS = RT.list.length;
const mine = RT.list.map(() => ({ a: 0, x: 0, y: 0, z: 0, v: 0 }));
for (let q = 0; q < RT.col.length; q++) { const i = RT.col[q], m = mine[RT.slab[q]], w = cols.dxdy[i]; m.a += w; m.x += w * cols.x[i]; m.y += w * cols.y[i]; m.z += w * RT.lo[q]; m.v += w * (RT.hi[q] - RT.lo[q]); }
const area = mine.reduce((s, m) => s + m.a, 0);
const SEC = mine.map((m, j) => ({ n: RT.list[j].n, x: m.x / m.a, y: m.y / m.a, z: m.z / m.a, h: m.v / m.a, share: m.a / area }));
const G = CI.table(ship);
let sumShare = 0; for (let j = 0; j < NS; j++) sumShare += G.share[j];
const sameTable = G.list.length === NS && G.list.every((s, j) => s.key === RT.list[j].key && G.n[j] === SEC[j].n && Math.abs(G.x[j] - SEC[j].x) < 1e-9 && Math.abs(G.y[j] - SEC[j].y) < 1e-9 && Math.abs(G.z[j] - SEC[j].z) < 1e-9 && Math.abs(G.h[j] - SEC[j].h) < 1e-9 && Math.abs(G.share[j] - SEC[j].share) < 1e-15 && G.share[j] > 0);
row('MUST', 'the table: a section for each of rooms.js\'s slabs, in its order; each one\'s middle, height and share of her floors as its columns give them', NS + ' sections; shares sum to ' + f(sumShare, 15), 'rooms.js\'s ' + NS + ' slabs; 1 within 1e-12', sameTable && Math.abs(sumShare - 1) < 1e-12);
// each section's middle, half its height over its floor, lies in that section (rooms.js's slabAt)
const misplaced = SEC.map((s, j) => [j, RM.slabAt(ship, s.x, s.y, s.z + 0.5 * s.h)]).filter(([j, at]) => at !== j);
row('MUST', '  ... each section\'s middle, half its height over its floor, lies in that section (rooms.js\'s slabAt)', misplaced.length + ' elsewhere' + (misplaced.length ? ': ' + misplaced.slice(0, 4).map(([j, at]) => RT.list[j].key + ' in ' + (at < 0 ? 'none' : RT.list[at].key)).join(', ') : ''), 'none', misplaced.length === 0);
const hs = SEC.map(s => s.h).sort((a, b) => a - b), thin = SEC.filter(s => s.h < CI.SET.short).length;
row('CHECK', '  ... the sections\' heights (m): those under the bet\'s 1.2 m blow when the sea reaches their deckhead', 'least ' + f(hs[0], 2) + ', median ' + f(hs[NS >> 1], 2) + ', most ' + f(hs[NS - 1], 2) + '; ' + thin + ' under 1.2 m', 'rooms.js\'s', true);

// ------------------------------------------------------------------ 2. the 1912 watch, with the reader and without
const sp = N.spec(1912), PL = Sys.PLANT, e = PL.emergency.lights;
const A = N.create(ship, sp, { auto: true, handover: 'flag' }), B = N.create(ship, sp, { auto: true, readers: false, handover: 'flag' });
const hA = crypto.createHash('sha256'), hB = crypto.createHash('sha256');
const outMine = new Float64Array(NS).fill(-1);
let parted = -1, ruleBad = null, litBad = null, sumBad = null, sumChecks = 0, firstOutK = -1, copy = null, copyAt = -1, copySame = null, prevLights = A.plant.lights;
const atT = {}, wantT = [30, 60, 90, 120, 150];
let tA = 0, tB = 0;
while (!A.foundered && A.night.k < 4 * 14400) {
  let t0 = process.hrtime.bigint(); N.step(A); tA += Number(process.hrtime.bigint() - t0);
  t0 = process.hrtime.bigint(); N.step(B); tB += Number(process.hrtime.bigint() - t0);
  hashState(hA, A); hashState(hB, B);
  const k = A.night.k, S = A.circuits;
  if (parted < 0 && (A.night.hash !== B.night.hash || A.foundered !== B.foundered)) parted = k;
  // the rule, here: the core's level in the section's space against its switches, at the pose of the core's last flows
  const F = A._F || C.frameOf(A);
  let changed = false;
  for (let j = 0; j < NS; j++) {
    const s = SEC[j];
    if (outMine[j] < 0 && A.vol[s.n] > 0.5 && A.level[s.n] >= C.worldZ(F, s.x, s.y, s.z + Math.min(S.short, s.h))) { outMine[j] = A.t; changed = true; }
    if (!ruleBad && S.sections[j].out !== outMine[j]) ruleBad = { k, key: RT.list[j].key, its: S.sections[j].out, mine: outMine[j] };
  }
  if (changed && firstOutK < 0) firstOutK = k;
  // her light: the plant's lights times the share held; before any fuse has blown, the plant's lights exactly
  let held = 0; for (let j = 0; j < NS; j++) if (outMine[j] < 0) held += SEC[j].share;
  if (S.out === 0) held = 1;
  if (!litBad && (S.out === 0 ? S.lit !== A.plant.lights : Math.abs(S.lit - A.plant.lights * held) > 1e-12)) litBad = { k, lit: S.lit, want: A.plant.lights * held };
  // the circuits' own sum, on every change (a fuse, the plant's lights) and every 200 steps
  if (changed || k % 200 === 0 || A.plant.lights !== prevLights) {
    sumChecks++;
    const L = CI.list(A); let sum = 0, bad = false;
    for (const c of L) { if (c.lit) sum += c.share; if (c.lit && S.sections[c.section].out >= 0) bad = true; }
    if (!sumBad && (bad || Math.abs(sum - S.lit) > 1e-12 || L.length !== 2 * NS)) sumBad = { k, sum, lit: S.lit, bad };
  }
  prevLights = A.plant.lights;
  if (A.night.tTouch >= 0) {
    const m = T(A, A.t);
    for (const w of wantT) if (!atT[w] && m >= w) atT[w] = { lit: S.lit, plant: A.plant.lights, out: S.out };
    // a copy made with structuredClone at T 60 steps on as the watch does (the forecast's copy is made so)
    if (!copy && m >= 60) { copy = structuredClone(A); copyAt = k; }
    else if (copy && copySame === null) { N.step(copy); if (m >= 90) copySame = JSON.stringify(copy.circuits) === JSON.stringify(A.circuits) && N.fingerprint(copy) === N.fingerprint(A); }
  }
}
const dA = hA.digest('hex'), dB = hB.digest('hex'), S = A.circuits;
const evSame = A.events.length === B.events.length && A.events.every((x, i) => x.label === B.events[i].label && x.t === B.events[i].t);
row('MUST', 'nothing fed back: the 1912 watch on its reconstructed orders, with the reader and without, to the end', 'step ' + A.night.k + ': ' + N.fingerprint(A) + ' / ' + N.fingerprint(B) + '; parted ' + (parted < 0 ? 'never' : 'at step ' + parted) + '; state ' + dA.slice(0, 12) + ' / ' + dB.slice(0, 12),
  'the same fingerprint every step, the same state hash', parted < 0 && dA === dB && A.foundered === B.foundered && A.founderT === B.founderT);
row('MUST', '  ... and it pushed nothing into sim.events', A.events.length + ' events / ' + B.events.length, 'the same events, label for label and time for time', evSame);
row('MUST', 'each section\'s fuses blow on the step the sea in its space reaches its switches (the core\'s own level against its floor at its middle, 1.2 m over it), recomputed here every step, and never mend',
  ruleBad ? 'step ' + ruleBad.k + ' ' + ruleBad.key + ': ' + ruleBad.its + ' against ' + ruleBad.mine : S.out + ' of ' + NS + ' sections blown by the flag, each on its step', 'every section, every step', !ruleBad && S.out > 0);
row('MUST', 'her light by circuit, every step: the plant\'s lights times the share of her sections whose fuses hold; until the first blows, the plant\'s lights exactly', litBad ? 'step ' + litBad.k + ': ' + litBad.lit + ' against ' + litBad.want : 'every step; the first fuse at step ' + firstOutK + ' (T ' + f(T(A, firstOutK * A.params.dt), 1) + ')', 'within 1e-12; equal before', !litBad);
row('MUST', '  ... and the circuits\' own sum (each lit circuit\'s share: a main circuit on the main dynamos, an emergency circuit on any, neither once its section has blown)', sumBad ? 'step ' + sumBad.k + ': ' + sumBad.sum + ' against ' + sumBad.lit + (sumBad.bad ? ', a blown section lit' : '') : sumChecks + ' steps checked (every change, every 200 steps): equal', 'within 1e-12; ' + 2 * NS + ' circuits', !sumBad);
row('MUST', 'sim.circuits is plain data: the watch copied with structuredClone at T 60 steps on to the same circuits and fingerprint', copy ? 'copied at step ' + copyAt + ': at T 90 ' + (copySame ? 'the same' : 'DIFFERENT') : 'no copy', 'the same as the watch itself at T 90', !!copy && copySame === true);
row('CHECK', 'the reader\'s cost: the 1912 watch stepped with every reader loaded here (the circuits only) and with none', f(tA / 1e6, 0) + ' ms / ' + f(tB / 1e6, 0) + ' ms over ' + A.night.k + ' steps', 'a few per cent', true);

// ------------------------------------------------------------------ 3. no sea in reach: the plant's one level, every step
const spInf = Object.assign({}, sp, { circuits: { short: Infinity } });
const D = N.create(ship, spInf, { auto: true, handover: 'flag' });
let infBad = null, darkAt = -1, mainAt = -1;
while (!D.foundered && D.night.k < 4 * 14400) {
  N.step(D);
  if (!infBad && (D.circuits.lit !== D.plant.lights || D.circuits.out !== 0)) infBad = { k: D.night.k, lit: D.circuits.lit, plant: D.plant.lights };
  if (mainAt < 0 && D.plant.events.mainDark !== undefined) mainAt = D.night.k;
  if (darkAt < 0 && D.plant.events.dark !== undefined) darkAt = D.night.k;
}
row('MUST', 'with no sea in reach (spec.circuits.short Infinity: no fuse can blow), her light by circuit is the plant\'s lights at every step, to the last dynamo', infBad ? 'step ' + infBad.k + ': ' + infBad.lit + ' against ' + infBad.plant : D.night.k + ' steps; the plant dark at step ' + darkAt + (mainAt >= 0 ? ', the main sets stopped at ' + mainAt : '') + '; ' + N.fingerprint(D),
  'equal at every step; the fingerprint the watch\'s, ' + N.fingerprint(B), !infBad && darkAt > 0 && N.fingerprint(D) === N.fingerprint(B));

// ------------------------------------------------------------------ 4. a what-if: the dynamo flat flooded by hand at T 30
const E = N.create(ship, sp, { auto: true, handover: 'flag' });
while (E.night.tTouch < 0 || T(E, E.t) < 30) N.step(E);
E.plant.el = true;                                              // the what-if's hand on the plant (this watch only)
while (E.plant.events.mainDark === undefined) N.step(E);
for (let i = 0; i < 240; i++) N.step(E);                        // a minute on the emergency dynamos
{
  const Se = E.circuits, L = CI.list(E);
  const mainLit = L.filter(c => c.kind === 'main' && c.lit).length, emLit = L.filter(c => c.kind === 'emergency' && c.lit).length, held = Se.sections.filter(s => s.out < 0).length;
  let sum = 0; for (const c of L) if (c.lit) sum += c.share;
  row('MUST', 'a what-if, the dynamo flat flooded by hand at T 30: the main circuits all dark, the emergency circuits lit where the fuses hold; her light the emergency share of the share held',
    'T ' + f(T(E, E.t), 1) + ': main ' + mainLit + ' lit, emergency ' + emLit + ' lit of ' + NS + ' (' + held + ' held); light ' + f(Se.lit, 5) + ', the sum ' + f(sum, 5) + '; the plant ' + E.plant.lights,
    'main 0; emergency ' + held + '; ' + f(e, 2) + ' x ' + f(Se.held, 5) + ' = ' + f(e * Se.held, 5), mainLit === 0 && emLit === held && held < NS && Math.abs(Se.lit - e * Se.held) < 1e-12 && Math.abs(sum - Se.lit) < 1e-12 && E.plant.lights === e);
}

// ------------------------------------------------------------------ 5. a section at its threshold, by hand
// a fresh watch before the ice: the water of one space set by hand (on this throwaway sim) and the reader stepped alone
{
  const H = N.create(ship, sp, { auto: true, handover: 'flag' }), j = RT.list.findIndex(s => s.key === '9:P:D'), s = SEC[j], F = H._F || C.frameOf(H);
  const zs = C.worldZ(F, s.x, s.y, s.z + Math.min(CI.SET.short, s.h));
  const blown = () => RT.byNode[s.n].filter(i => H.circuits.sections[i].out >= 0).map(i => RT.list[i].key);
  const under = (L) => RT.byNode[s.n].filter(i => C.worldZ(F, SEC[i].x, SEC[i].y, SEC[i].z + Math.min(CI.SET.short, SEC[i].h)) <= L).map(i => RT.list[i].key);
  H.vol[s.n] = 100; H.level[s.n] = zs - 0.001; CI.step(H);
  const before = blown(), wantBefore = under(zs - 0.001), others = H.circuits.out - before.length;
  H.level[s.n] = zs + 0.001; H.t += 0.25; CI.step(H);
  const after = blown(), wantAfter = under(zs + 0.001);
  H.vol[s.n] = 0.4; H.level[s.n] = zs + 10; const k2 = RT.byNode[s.n].find(i => H.circuits.sections[i].out < 0); CI.step(H);
  row('MUST', 'a section at its threshold, by hand (9:P:D, boiler room 1\'s space above E deck, port): the sea 1 mm under its switches, it holds and the sections of its space under that level blow; 1 mm over, it blows too; a trace (0.4 m3) blows none',
    'at -1 mm: ' + (before.join(', ') || 'none') + '; at +1 mm: ' + after.join(', ') + '; elsewhere ' + others + '; the trace: ' + (k2 === undefined ? 'none left' : RT.list[k2].key + (H.circuits.sections[k2].out < 0 ? ' holds' : ' BLOWN')),
    (wantBefore.join(', ') || 'none') + '; ' + wantAfter.join(', ') + '; 0', before.join() === wantBefore.join() && !before.includes('9:P:D') && after.join() === wantAfter.join() && after.includes('9:P:D') && others === 0 && (k2 === undefined || H.circuits.sections[k2].out < 0));
}

// ------------------------------------------------------------------ 5b. a preset (D97): started and stepped by hand
// The 1912 preset as the page builds and steps it (site/app.js: C.createSim with the preset's build, the plant attached;
// each step C.step, then the plant's), with its circuits started (Circuits.start) and stepped (Circuits.step(sim, st))
// beside it, kept by the stepper and not in the sim, against a twin without them
{
  const SC = require('../core/scenarios.js'), V = require('../site/visuals.js');
  const mk = () => { const s = C.createSim(ship, {}, SC.PRESETS.titanic.build({})); Sys.attach(s); return s; };
  const P1 = mk(), P2 = mk(), st = CI.start(P1), outP = new Float64Array(NS).fill(-1);
  const hP = (h, s) => { h.update(Buffer.from(new Float64Array([s.zO, s.pitch, s.roll, s.inflow, s.plant.p, s.plant.lights, s.pumped]).buffer)); h.update(Buffer.from(s.vol.buffer)); h.update(Buffer.from(s.level.buffer)); };
  const h1 = crypto.createHash('sha256'), h2 = crypto.createHash('sha256');
  let kP = 0, ruleBadP = null, litBadP = null;
  while (!P1.foundered && kP < 4 * 14400) {
    C.step(P1); Sys.step(P1); CI.step(P1, st);
    C.step(P2); Sys.step(P2);
    kP++; hP(h1, P1); hP(h2, P2);
    const F = P1._F || C.frameOf(P1);
    for (let j = 0; j < NS; j++) {
      const s = SEC[j];
      if (outMineP(j, s, F)) outP[j] = P1.t;
      if (!ruleBadP && st.sections[j].out !== outP[j]) ruleBadP = { k: kP, key: RT.list[j].key, its: st.sections[j].out, mine: outP[j] };
    }
    let held = 0; for (let j = 0; j < NS; j++) if (outP[j] < 0) held += SEC[j].share;
    if (st.out === 0) held = 1;
    if (!litBadP && Math.abs(st.lit - P1.plant.lights * held) > 1e-12) litBadP = { k: kP, lit: st.lit, want: P1.plant.lights * held };
  }
  function outMineP(j, s, F) { return outP[j] < 0 && P1.vol[s.n] > 0.5 && P1.level[s.n] >= C.worldZ(F, s.x, s.y, s.z + Math.min(st.short, s.h)); }
  const sameP = h1.digest('hex') === h2.digest('hex') && P1.foundered === P2.foundered && P1.t === P2.t;
  row('MUST', 'a preset (D97: the page steps one with no readers): the 1912 preset with its circuits started and stepped beside it by hand (Circuits.start, Circuits.step(sim, st)), against a twin without them',
    kP + ' steps to the flag; ' + (sameP ? 'the same state every step' : 'PARTED') + '; ' + st.out + ' sections blown' + (ruleBadP ? '; step ' + ruleBadP.k + ' ' + ruleBadP.key + ': ' + ruleBadP.its + ' against ' + ruleBadP.mine : ', each on its step by the rule') + (litBadP ? '; light OFF at step ' + litBadP.k : '') + (P1.circuits === undefined ? '; nothing in the sim' : '; WROTE sim.circuits'),
    'the same; each on its step; her light the plant\'s times the share held', sameP && !ruleBadP && !litBadP && st.out > 0 && P1.circuits === undefined);
  // the ports' sections (Circuits.sectionOf: rooms.js's slabAt), each port's light its section's
  const ports = V.portholes(), secs = ports.map(([x, y, z]) => CI.sectionOf(ship, x, y, z));
  const agree = ports.every(([x, y, z], i) => secs[i] === RM.slabAt(ship, x, y, z)), none = secs.filter(s => s < 0).length;
  const blownAtFlag = secs.filter(s => s >= 0 && st.sections[s].out >= 0).length;
  row('MUST', '  ... and Circuits.sectionOf keys each of the drawn ports (V.portholes) to its section, as rooms.js\'s slabAt finds it: the page\'s map for D97',
    ports.length + ' ports: ' + (ports.length - none) + ' in a section, ' + none + ' in none; ' + blownAtFlag + ' of them dark by their sections at the preset\'s flag', 'slabAt\'s, every one', agree && ports.length > 0);
}

// ------------------------------------------------------------------ 6. the 1912 night, deck by deck (CHECK)
const tTouch = A.night.tTouch;
for (const deck of RM.FLOORS[0].concat(RM.FLOORS[1])) {
  const js = RT.list.map((s, j) => j).filter(j => RT.list[j].floor === deck), blown = js.filter(j => S.sections[j].out >= 0).map(j => S.sections[j].out).sort((a, b) => a - b);
  const shareOut = js.filter(j => S.sections[j].out >= 0).reduce((a, j) => a + S.sections[j].share, 0), shareAll = js.reduce((a, j) => a + S.sections[j].share, 0);
  row('CHECK', deck + ' deck: ' + js.length + ' sections', blown.length + ' blown by the flag' + (blown.length ? ', the first at T ' + f((blown[0] - tTouch) / 60, 1) + ', the last at T ' + f((blown[blown.length - 1] - tTouch) / 60, 1) : '') + '; ' + f(100 * shareOut / shareAll, 0) + ' % of its floor', 'the model\'s', true);
}
row('CHECK', 'her light by circuit against the plant\'s (T minutes after the touch)', wantT.filter(w => atT[w]).map(w => 'T ' + w + ': ' + f(atT[w].lit, 3) + ' / ' + atT[w].plant + ' (' + atT[w].out + ' out)').join('; ') + '; at the flag (T ' + f(T(A, A.founderT), 2) + '): ' + f(S.lit, 3) + ' / ' + A.plant.lights + ' (' + S.out + ' out)', 'the plant\'s one level', true);

for (const [kind, what, value, ref, ok] of rows) console.log((ok ? 'PASS ' : (kind === 'MUST' ? 'FAIL ' : 'CHECK ')) + kind.padEnd(6) + what.padEnd(100) + ' ' + String(value).padEnd(60) + ' ' + ref);
console.log(fails ? '\nFAIL: ' + fails + ' MUST row(s)' : '\nPASS: all ' + rows.filter(r => r[0] === 'MUST').length + ' MUST rows');
process.exit(fails ? 1 : 0);
