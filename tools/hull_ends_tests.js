// C3 acceptance (the calibration epoch, D80): her hull's ends above the waterline as the deck plans draw them
// (core/core.js: ENDS_READ, ENDS_BET, endsSide; buildShip's `hullEnds`), built dark, and C3's fix to C4 (the openings
// in her side are the Titanic's alone). The readings: data/rooms/{E,D,C,B}_deck.json's side.at
// (docs/research/RESEARCH_rooms_hull_ends_v1_1_2026-11-21.md).
//   node tools/hull_ends_tests.js           the table (about half a minute); in the gate as `hull_ends`
//   node tools/hull_ends_tests.js --print   the references of section 1 from the core as it stands (to freeze them: only
//                                           from a core in which hullEnds 0 is known to be the ship before C3)
// MUST rows hold whatever the readings and the bets are; the CHECK rows say what they give (the rung) and move with them.
'use strict';
const crypto = require('crypto');
const C = require('../core/core.js');
const SC = require('../core/scenarios.js');
const N = require('../core/night.js');

const rows = []; let fails = 0;
function row(kind, what, value, ref, ok) { rows.push([kind, what, value, ref, ok]); if (kind === 'MUST' && !ok) fails++; }
const f = (x, n) => x.toFixed(n === undefined ? 3 : n);
const sha = (parts) => { const h = crypto.createHash('sha256'); for (const p of parts) h.update(Buffer.from(p.buffer, p.byteOffset, p.byteLength)); return h.digest('hex').slice(0, 16); };
const FT = C.FT, KEYS = Object.keys(SC.PRESETS);

// ---- what is digested
const shipHash = (s) => sha([s.cols.x, s.cols.y, s.cols.dxdy, s.cols.zlo, s.cols.zhi, s.cols.zhiH, s.entCol, s.entA, s.entE, s.nodeVmax, s.nodeVtol, s.nodeAmin, s.nodeAov,
  Float64Array.from([s.hyd.V, s.hyd.LCB, s.hyd.KB, s.hyd.Awp, s.hyd.LCF, s.hyd.BM, s.hyd.BML, s.hyd.It])]);
// the half-breadth as every caller without a hull has it: every half metre along her, every quarter metre of height
const GX = [], GZ = []; for (let x = -139.5; x <= 131; x += 0.5) GX.push(x); for (let z = 0; z <= 28; z += 0.25) GZ.push(z);
const hbGrid = (P) => { const a = new Float64Array(GX.length * GZ.length); let k = 0; for (const x of GX) for (const z of GZ) a[k++] = C.halfBreadth(x, z, P); return a; };
const state71 = (sim, buf) => { buf.set(sim.vol, 0); buf[64] = sim.zO; buf[65] = sim.pitch; buf[66] = sim.roll; buf[67] = sim.vz; buf[68] = sim.wth; buf[69] = sim.wph; buf[70] = sim.inflow; return buf; };
const run = (ship, key, params, scen) => {      // a preset to her foundering or six hours: every step's 71 numbers, digested (tools/stairs_tests.js's digest)
  const s = C.createSim(ship, params || {}, scen || SC.PRESETS[key].build({})), h = crypto.createHash('sha256'), b = new Float64Array(71);
  const first = { ms: s.ms, g0: s.g0.slice(), zO: s.zO, pitch: s.pitch, roll: s.roll };
  while (!s.foundered && s.t < 6 * 3600) { C.step(s); h.update(Buffer.from(state71(s, b).buffer)); }
  return { s, first, d: h.digest('hex').slice(0, 16) };
};
const watch = (ship) => { const s = N.run(N.create(ship, N.spec(1912), { auto: true })); return N.fingerprint(s) + ' at step ' + s.night.k + ', ' + f(s.openings.reduce((a, o) => a + o.area, 0), 6) + ' m2 open'; };
const min = (r) => (r.s.foundered ? f(r.s.founderT / 60, 2) : 'afloat');

// Section 1's references: the ship before C3, from the core at adc1275 (C4's commit, the one before C3), by --print
// there. Update one only with a change that is meant to move it, and say so, as with the systems suite's fingerprint.
// The calibration epoch's B1 (the model's own pow) moved four: --print at adc1275 with C.pow preloaded over its Math.pow
// (node -r tools/pow_preload.js; without the preload it prints those before: hb 9ef13ff3f42a779d, titanic
// 47a354e65ea6df35, britannic f144932739ded42c, watch 85c9bcc0 at step 389). Her ship's tables did not move.
const REF = {
  ship: '83e790f1ec73a81e', hb: 'facabdaf7769002f',
  titanic: '1e94ca5a17c07221', britannic: '97d4f57b83e4ebef',      // tools/stairs_tests.js holds the same two (C4_BEFORE)
  watch: '709e83b3 at step 389, 0.819600 m2 open',
};

const ship0 = C.buildShip({ hullEnds: 0 });      // since the epoch's landing (D4) a ship with no word of it has her ends
if (process.argv.includes('--print')) {
  console.log(JSON.stringify({ ship: shipHash(ship0), hb: sha([hbGrid()]), titanic: run(ship0, 'titanic').d, britannic: run(ship0, 'britannic').d, watch: watch(ship0) }, null, 1));
  process.exit(0);
}
const shipX = C.buildShip({ hullEnds: 0 }), ship1 = C.buildShip({ hullEnds: 1 }), P1 = ship1.hull, z0 = C.ENDS_BET.z0;

// ---------------------------------------------------------------- 1. hullEnds 0: the ship before C3, to the bit
// Since the epoch's landing (D4) the defaults are the landing's: section 1 runs the configuration before it (SC.PRE_D4:
// its numbers, the 1912 damage as it was, the encounter's constant and the modules' switches) with D89's trace zeroed,
// as at adc1275
const PRE = Object.assign({}, SC.PRE_D4.params, { keepTrace: 0 });
const preScen = (key) => (key === 'titanic' ? Object.assign(SC.PRESETS.titanic.build(SC.PRE_D4.build), SC.PRE_D4.scen) : SC.PRESETS[key].build({}));
const watchPre = (ship) => {
  const E = require('../core/encounter.js'), Mo = require('../core/motion.js'), Sys = require('../core/systems.js');
  const keep = [E.ICE.alpha, E.ICE.bunkerOpen, Mo.SHIP.massPockets, Sys.PLANT.leadRule];
  E.ICE.alpha = SC.PRE_D4.ice.alpha; E.ICE.bunkerOpen = SC.PRE_D4.ice.bunkerOpen; Mo.SHIP.massPockets = SC.PRE_D4.modules.massPockets; Sys.PLANT.leadRule = SC.PRE_D4.modules.leadRule;
  try {
    const sp = N.spec(1912); sp.coalListDeg = SC.PRE_D4.scen.coalListDeg;
    const s = N.run(N.create(ship, sp, { auto: true, params: PRE }));
    return N.fingerprint(s) + ' at step ' + s.night.k + ', ' + f(s.openings.reduce((a, o) => a + o.area, 0), 6) + ' m2 open';
  } finally { E.ICE.alpha = keep[0]; E.ICE.bunkerOpen = keep[1]; Mo.SHIP.massPockets = keep[2]; Sys.PLANT.leadRule = keep[3]; }
};
const t0 = run(ship0, 'titanic', PRE, preScen('titanic')), b0 = run(ship0, 'britannic', PRE, preScen('britannic'));
const tD = run(ship0, 'titanic'), bD = run(ship0, 'britannic');   // without her ends at today's numbers: what sections 2 and 4 set her ends against
{
  const hs = shipHash(ship0), hx = shipHash(shipX), hb = sha([hbGrid()]), hbP = sha([hbGrid(ship0.hull)]);
  row('MUST', 'hullEnds 0 named (since D4 no word of it is 1): the ship\'s tables (her columns, every space\'s ends and capacity, her hydrostatics) are those before C3', hs + ' and ' + hx + '; her hull is the fitted form itself: ' + (ship0.hull === C.HULL && shipX.hull === C.HULL && !C.HULL.ends), REF.ship + '; true', hs === REF.ship && hx === REF.ship && ship0.hull === C.HULL && shipX.hull === C.HULL && !C.HULL.ends);
  row('MUST', 'the half-breadth without a hull named, and with this ship\'s: ' + GX.length * GZ.length + ' points along and up her', hb + ' and ' + hbP, REF.hb, hb === REF.hb && hbP === REF.hb);
  row('MUST', 'the 1912 damage and Britannic, every step\'s 71 numbers to her foundering', t0.d + ' (' + min(t0) + ' min) and ' + b0.d, REF.titanic + ' and ' + REF.britannic, t0.d === REF.titanic && b0.d === REF.britannic);
  const w = watchPre(ship0);
  row('MUST', 'the encounter: the 1912 watch through the ice, its fingerprint and what the ice opened (as before D4)', w, REF.watch, w === REF.watch);
}

// ---------------------------------------------------------------- 2. hullEnds 1: nothing at or below a first waterline
const r1 = {};
{
  // the half-breadth at and under z0, everywhere (and so under 10.29 m, the 1912 preset's sea at the stern post)
  let low = 0, nLow = 0;
  for (const x of GX) for (let j = 0; j * 0.05 < z0 + 0.05; j++) { const z = Math.min(z0, j * 0.05); nLow++; if (C.halfBreadth(x, z, P1) !== C.halfBreadth(x, z)) low++; }
  row('MUST', 'hullEnds 1: her half-breadth at and under ' + f(z0, 2) + ' m over the keel is the fitted form\'s, to the bit', low + ' of ' + nLow + ' points differ', '0', low === 0);
  // her columns: each one of the fitted hull is there, the same under z0; a new one begins at or over z0
  const key = (s, i) => s.cols.x[i] + '|' + s.cols.y[i], at = new Map(); for (let i = 0; i < ship1.cols.N; i++) at.set(key(ship1, i), i);
  let lost = 0, moved = 0, order = 0, last = -1; const old = new Set();
  for (let i = 0; i < ship0.cols.N; i++) {
    const j = at.get(key(ship0, i)); if (j === undefined) { lost++; continue; }
    old.add(j); if (j < last) order++; last = j;
    if (Math.min(ship0.cols.zlo[i], z0) !== Math.min(ship1.cols.zlo[j], z0) || Math.min(ship0.cols.zhi[i], z0) !== Math.min(ship1.cols.zhi[j], z0) || ship1.cols.zhi[j] < ship0.cols.zhi[i] || ship1.cols.zlo[j] > ship0.cols.zlo[i]) moved++;
  }
  let fresh = 0, freshLow = 0; for (let j = 0; j < ship1.cols.N; j++) if (!old.has(j)) { fresh++; if (ship1.cols.zlo[j] < z0) freshLow++; }
  row('MUST', 'the same of her columns: every column of the fitted hull is there, in its order, the same under ' + f(z0, 2) + ' m and no shorter; a new one begins over it', lost + ' lost, ' + order + ' out of order, ' + moved + ' moved; ' + fresh + ' new, ' + freshLow + ' of them under it', '0, 0, 0; 0 under it', lost === 0 && order === 0 && moved === 0 && freshLow === 0);
  // every preset's first sea against z0, at every column of the restored ship (her list and trim as the sim begins)
  let hi = -1, where = '', same = 0; const ms = [];
  for (const k of KEYS) {
    const a = k === 'titanic' ? tD : (k === 'britannic' ? bD : run(ship0, k)), b = run(ship1, k); r1[k] = b;
    if (a.first.ms === b.first.ms && a.first.zO === b.first.zO && a.first.pitch === b.first.pitch && a.first.roll === b.first.roll && a.first.g0.every((v, i) => v === b.first.g0[i])) same++;
    if (k === 'titanic') ms.push(f(b.first.ms / 1000, 3) + ' t', 'g0 ' + b.first.g0.map((v) => f(v, 4)).join(', '));
    const s = C.createSim(ship1, {}, SC.PRESETS[k].build({})), F = C.frameOf(s), c = ship1.cols;
    for (let i = 0; i < c.N; i++) {
      const zw = -(F.R20 * c.x[i] + F.R21 * (c.y[i] + (c.y[i] > 0 ? 0.25 : -0.25)) + F.tz) / F.R22;      // the sea over the column's outer edge
      if (zw > hi && zw >= c.zlo[i]) { hi = zw; where = k + ', x ' + f(c.x[i], 1) + ', y ' + f(c.y[i], 2); }
    }
  }
  row('MUST', 'every preset\'s first sea lies under ' + f(z0, 2) + ' m at every column it wets (her trim and her coal\'s list as the run begins)', 'the highest ' + f(hi, 3) + ' m (' + where + ')', 'under ' + f(z0, 2), hi < z0);
  row('MUST', 'her mass, her centre and her first pose on every preset (sim.ms, sim.g0, zO, pitch, roll) are those of the fitted hull, to the bit', same + ' of ' + KEYS.length + ' presets; the 1912 damage: ' + ms.join(', '), 'all', same === KEYS.length);
  const T = [32.25 * FT, 34 * FT + 7 * 0.0254], hy = (s) => T.map((d) => { const e = C.evenKeel(s.cols, d); return [e.V, e.LCB, e.KB, e.Awp, e.LCF, e.BM, e.BML]; });
  const h0 = hy(ship0), h1 = hy(ship1), eq = h0.every((a, i) => a.every((v, j) => v === h1[i][j])) && ['V', 'LCB', 'KB', 'Awp', 'LCF', 'BM', 'BML', 'It'].every((k) => ship0.hyd[k] === ship1.hyd[k]);
  row('MUST', 'the hydrostatic targets hold: her even-keel figures at 32 ft 3 in and 34 ft 7 in, and at the night\'s mean draught (ship.hyd), to the bit', (eq ? 'the same' : 'NOT the same') + ': ' + f(h1[0][0] * 1.025, 1) + ' and ' + f(h1[1][0] * 1.025, 1) + ' t', 'the fitted hull\'s', eq);
  row('MUST', 'her zones, her slices and the profile stand: C.zoneBounds, every slice\'s place, the stem and the stern tip', ship1.zones.every((Z, k) => Z.xf === ship0.zones[k].xf && Z.xa === ship0.zones[k].xa) && ship1.cols.slices.length === ship0.cols.slices.length && ship1.cols.slices.every((s, i) => s.xc === ship0.cols.slices[i].xc && s.dx === ship0.cols.slices[i].dx) ? 'the same' : 'NOT the same', 'the fitted hull\'s', ship1.zones.every((Z, k) => Z.xf === ship0.zones[k].xf && Z.xa === ship0.zones[k].xa) && ship1.cols.slices.every((s, i) => s.xc === ship0.cols.slices[i].xc && s.dx === ship0.cols.slices[i].dx));
}

// ---------------------------------------------------------------- 3. the restored side against the plans
{
  const RT = require('./rooms_table.js'), r3 = (v) => Math.round(v * 1000) / 1000;
  let n = 0, bad = 0, worst = 0, wider = 0, worstAt = '', nB = 0;
  for (const d of ['E', 'D', 'C', 'B']) {
    const T = require('../data/rooms/' + d + '_deck.json'), mine = C.ENDS_READ[d].aft.concat(C.ENDS_READ[d].fwd);
    const at = T.side.at.map((r) => { const v = [r[1], r[2]].filter((q) => q !== null); return [r3(RT.frameFt(T, r[0])), r3(v.reduce((a, b) => a + b, 0) / v.length), r[0]]; });
    if (at.length !== mine.length) bad++;
    at.forEach((r, i) => {
      n++; if (!mine[i] || mine[i][0] !== r[0] || mine[i][1] !== r[1]) bad++;
      const x = r[0] * FT, z = C.deckZ(d, x), m = C.halfBreadth(x, z), plan = r[1] * FT, got = C.halfBreadth(x, z, P1), want = m > 0 && plan > m ? plan : m;
      if (plan > m && m > 0) wider++;
      if (m > 0) { nB++; const e = Math.abs(got - want); if (e > worst) { worst = e; worstAt = d + ' deck, ' + r[2]; } }
    });
    for (const [name, k] of [['stern', 'stern'], ['stem', 'stem']]) { const a = T.frames.anchors.find((q) => q[0] === name), mineTip = C.ENDS_READ[d][k]; if (d !== 'B' && (!a || a[1] !== mineTip)) bad++; }
  }
  row('MUST', 'the core\'s table is the deck tables\' (data/rooms/{E,D,C,B}_deck.json side.at: each frame\'s feet forward, the mean of port and starboard; where each plan ends its deck)', bad + ' of ' + n + ' readings differ', '0', bad === 0);
  row('MUST', 'hullEnds 1: at every read frame, on its deck, her side is the plan\'s reading, or the fitted form\'s where that is the wider', 'worst ' + worst.toExponential(1) + ' m (' + worstAt + ') over ' + nB + ' readings inside the profile; the plan the wider at ' + wider, 'within 0.05 m', worst < 0.05);
  // never inside the fitted form, nothing outside the profile
  const a = hbGrid(), b = hbGrid(P1); let inside = 0, out = 0, more = 0, most = 0, mostAt = '';
  for (let k = 0; k < a.length; k++) { if (b[k] < a[k]) inside++; if (a[k] === 0 && b[k] !== 0) out++; if (b[k] > a[k]) { more++; if (b[k] - a[k] > most) { most = b[k] - a[k]; mostAt = 'x ' + GX[(k / GZ.length) | 0] + ', z ' + GZ[k % GZ.length]; } } }
  row('MUST', 'hullEnds 1: her side is never inside the fitted form, and there is none where the profile has none', inside + ' points inside, ' + out + ' outside the profile, of ' + a.length + '; wider at ' + more + ', by ' + f(most, 2) + ' m at most (' + mostAt + ')', '0, 0', inside === 0 && out === 0);
  // amidships untouched; no step where the plans' side comes in
  let mid = 0; for (const x of GX) if (Math.abs(x) <= 31.5) for (const z of GZ) if (C.halfBreadth(x, z, P1) !== C.halfBreadth(x, z)) mid++;
  let step = 0, stepAt = '';
  for (let x = -125; x < 128; x += 0.1) for (const z of GZ) { if (z <= z0) continue; const d0 = C.halfBreadth(x, z, P1) - C.halfBreadth(x, z), d1 = C.halfBreadth(x + 0.1, z, P1) - C.halfBreadth(x + 0.1, z); if (C.halfBreadth(x + 0.1, z) > 0 && C.halfBreadth(x, z) > 0 && Math.abs(d1 - d0) > step) { step = Math.abs(d1 - d0); stepAt = 'x ' + f(x, 1) + ', z ' + z; } }
  row('MUST', 'hullEnds 1: within 31.5 m of amidships (inside 35 frames) she is the fitted form, to the bit', mid + ' points differ', '0', mid === 0);
  row('CHECK', 'hullEnds 1: no step along her where the plans\' side comes in: the most that what is added changes in 0.1 m of length, x -125 to 128', f(step, 3) + ' m (' + stepAt + ')', 'under 0.1', step < 0.1);
  const again = C.buildShip({ hullEnds: 1 });
  row('MUST', 'hullEnds 1: built twice, the same ship, and one hull object for both', shipHash(ship1) + ' and ' + shipHash(again) + '; ' + (again.hull === ship1.hull), 'equal; true', shipHash(ship1) === shipHash(again) && again.hull === ship1.hull);
}

// ---------------------------------------------------------------- 4. the rung: what the restored ends give
{
  // the volume added, both sides, by the midpoint rule: forward and aft of amidships, in four bands of height
  const band = { low: [0, 0], EB: [0, 0], EBhull: [0, 0], over: [0, 0], round: [0, 0] }, dx = 0.25, nz = 80;
  const xLast = C.ENDS_READ.C.aft[0][0] * FT;                              // 150 frames aft: the last reading on C and D deck
  for (let i = 0; i < 1080; i++) {
    const x = -139 + (i + 0.5) * dx;
    const e = x > 0 ? 0 : 1, zE = C.deckZ('E', x), zB = C.deckZ('B', x), zT = C.zTopAt(x), zBoat = C.deckZ('Boat', x);
    const add = (za, zb) => { let v = 0; if (!(zb > za)) return 0; for (let j = 0; j < nz; j++) { const z = za + (j + 0.5) * (zb - za) / nz; v += 2 * (C.halfBreadth(x, z, P1) - C.halfBreadth(x, z)) * dx * (zb - za) / nz; } return v; };
    const eb = add(zE, zB);
    band.low[e] += add(z0, zE); band.EB[e] += eb; band.EBhull[e] += add(zE, Math.min(zB, zT)); band.over[e] += add(zB, zBoat);
    if (x < xLast) band.round[1] += eb;
  }
  const p = (a) => f(a[0], 0) + ' forward, ' + f(a[1], 0) + ' aft';
  row('CHECK', 'the rung: the volume the plans\' side adds between E and B decks (m3, moulded, both sides), wells and all, as G20 counted it', p(band.EB) + ', ' + f(band.round[1], 0) + ' of that abaft the last reading (150 aft: the round of her stern, which G20 did not count); under her own top (C deck in the wells) ' + p(band.EBhull), 'G20: about 1,960 forward and 2,364 aft, within 15 %', Math.abs(band.EB[0] / 1960 - 1) < 0.15 && Math.abs((band.EB[1] - band.round[1]) / 2364 - 1) < 0.15);
  row('CHECK', 'the rung:   ... and what the two bets of height add: from ' + f(z0, 1) + ' m up to E deck, and over B deck to the Boat deck\'s height (only her tiers stand there)', p(band.low) + '; ' + p(band.over), 'said, not judged', true);
  let dv = [0, 0, 0, 0]; for (let n = 0; n < C.NN; n++) { const k = n >> 2, d = ship1.nodeVmax[n] - ship0.nodeVmax[n]; dv[(k < 8 ? 0 : 2) + (n & 1)] += d; }
  let shrunk = 0; for (let n = 0; n < C.NN; n++) if (ship1.nodeVmax[n] < ship0.nodeVmax[n]) shrunk++;
  row('MUST', 'hullEnds 1: no space of the 64 holds less than it did', shrunk + ' hold less', '0', shrunk === 0);
  row('CHECK', 'the rung: what her 64 spaces hold more (m3 of water, at their permeabilities; columns ' + ship0.cols.N + ' to ' + ship1.cols.N + ')', 'forward of boiler room 2: ' + f(dv[0], 0) + ' under E deck, ' + f(dv[1], 0) + ' over it; from it aft: ' + f(dv[2], 0) + ' and ' + f(dv[3], 0) + '; ' + f(dv[0] + dv[1] + dv[2] + dv[3], 0) + ' in all', 'said, not judged', true);
  const a = tD, b = r1.titanic;
  row('CHECK', 'the rung: hullEnds 1 alone, the 1912 damage: she founders', min(b) + ' min (' + min(a) + ' with the fitted ends); the record: 160', '157 to 163 once the epoch lands; alone, later: the restored bow and stern are buoyant while dry', b.s.foundered);
  row('CHECK', 'the rung:   ... and the other presets', KEYS.filter((k) => k !== 'titanic').map((k) => k + ' ' + min(r1[k]) + (k === 'britannic' ? ' (' + min(bD) + ')' : '')).join(', '), 'said, not judged', true);
}

// ---------------------------------------------------------------- 5. C3's fix to C4: the openings in her side are the Titanic's
{
  const mk = (key, p, sh) => C.createSim(sh || ship0, p, SC.PRESETS[key].build({}));
  const br0 = mk('britannic', { sideOpenings: 0 }), br1 = mk('britannic', { sideOpenings: 1 }), ti1 = mk('titanic', { sideOpenings: 1 }), ha1 = mk('hawke', { sideOpenings: 1 });
  const same = JSON.stringify(br0.stairOps) === JSON.stringify(br1.stairOps) && br1.stairSt.length === br0.stairSt.length && br1.stairT.length === br0.stairT.length;
  const d1 = run(ship0, 'britannic', { sideOpenings: 1 }).d, d0 = run(ship0, 'britannic', { sideOpenings: 0 }).d;   // 1 and 0 named (1 is the default since D4)
  row('MUST', 'the fix: with sideOpenings 1 the Britannic preset, which brings her own open ports, has the openings it has with 0, and the same run', (same ? 'the same ' : 'NOT the same ') + br1.stairOps.length + ' openings (' + br1.stairOps.filter((o) => o.side).length + ' of her side), sideOpenings ' + br1.params.sideOpenings + '; the run ' + d1, 'the same; ' + d0, same && d1 === d0 && br1.params.sideOpenings === 0);
  row('MUST', 'the fix:   ... and the 1912 damage and a preset with no ports of its own keep them', ti1.stairOps.filter((o) => o.side).length + ' and ' + ha1.stairOps.filter((o) => o.side).length + ' rows of side openings', 'both ' + C.SIDE_OPENINGS.length, ti1.stairOps.filter((o) => o.side).length === C.SIDE_OPENINGS.length && ha1.stairOps.filter((o) => o.side).length === C.SIDE_OPENINGS.length);
  // with her ends restored the openings stand on the restored side
  const e1 = mk('blank', { sideOpenings: 1 }, ship1); let off = 0, nOp = 0;
  for (const o of e1.stairOps) if (o.type === 2 && (o.side || /^win:B:/.test(o.id))) { nOp++; if (Math.abs(Math.abs(o.y) - C.halfBreadth(o.x, o.zc, P1)) > 1e-9) off++; }
  row('MUST', 'hullEnds 1: the openings in her side and B deck\'s windows stand on the restored side', off + ' of ' + nOp + ' off it', '0', off === 0 && nOp > 0);
}

for (const [kind, what, value, ref2, ok] of rows) console.log((kind === 'MUST' ? (ok ? 'PASS ' : 'FAIL ') : (ok ? 'in   ' : 'OUT  ')) + what + '\n       ' + String(value) + '\n       [' + ref2 + ']');
console.log(fails ? '\nFAIL: ' + fails + ' MUST row(s)' : '\nPASS: every MUST row (' + rows.filter(r => r[0] === 'MUST').length + '); CHECK rows in range: ' + rows.filter(r => r[0] === 'CHECK' && r[4]).length + ' of ' + rows.filter(r => r[0] === 'CHECK').length);
process.exit(fails ? 1 : 0);
