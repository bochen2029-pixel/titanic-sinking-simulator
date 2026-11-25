// e25: S1, the tiers above B deck, their windows and the two grand staircases in the flooding core
// (docs/DESIGN_grand_staircases_dome_flooding_v1_2026-11-19.md). What each of the model's guesses is worth on the 1912
// damage, and what S1 does to every validation case.
//   1. the 1912 damage, pumps as worked, the flow parameters in force: the model before S1 (the hull that stops at B
//      deck), S1 whole, S1 with a part left out, and S1 with one guess moved at a time across the range its research
//      note gives it;
//   2. every case of tools/validate.js before S1 and with it.
//   node docs/research/experiments/e25_grand_staircases.js [--write]
// Output: results_2026-11-19/e25_grand_staircases.txt
const fs = require('fs'), path = require('path');
const C = require('../../../core/core.js');
const SC = require('../../../core/scenarios.js');
const out = [], log = (s) => { out.push(s); console.log(s); };
const ship = C.buildShip(), hull = C.buildShip({ tiers: 0 }), P = SC.PRESETS;
const f = (x, n) => x.toFixed(n === undefined ? 2 : n);

// run a case to its end; tweak: changes made to C.STAIRS and C.WINDOWS for this run alone
function run(scen, params, tweak, sh) {
  const saved = [JSON.stringify(C.STAIRS), JSON.stringify(C.WINDOWS)];
  if (tweak) tweak(C.STAIRS, C.WINDOWS);
  const sim = C.createSim(sh || ship, params || {}, scen);
  C.STAIRS.splice(0, C.STAIRS.length, ...JSON.parse(saved[0])); C.WINDOWS.splice(0, C.WINDOWS.length, ...JSON.parse(saved[1]));
  let peak = 0, vStair = 0, vWin = 0, listBridge = NaN;
  while (!sim.foundered && sim.t < 8 * 3600) {
    C.step(sim);
    let q = 0, qw = 0;
    for (let j = 0; j < sim.stairOps.length; j++) { const o = sim.stairOps[j]; for (let i = 0; i < o.nodes.length; i++) { if (o.stair) q += sim.conn.q[o.conn + i]; else qw += sim.conn.q[o.conn + i]; } }
    vStair += q * sim.params.dt; vWin += qw * sim.params.dt; if (q > peak) peak = q;
    if (isNaN(listBridge) && sim.markT.bridge >= 0) listBridge = sim.roll * 180 / Math.PI;
  }
  const ev = (id) => { const e = sim.events.find(x => x.id === id); return e ? e.t / 60 : NaN; };
  return { founder: sim.foundered ? sim.founderT / 60 : NaN, bridge: ev('bridge'), winB: ev('winB'), domeF: ev('domeF'), domeA: ev('domeA'), peak: peak * 1.025 * 60, stairs: vStair * 1.025, wins: vWin * 1.025, listBridge };
}
const m = (x, n) => isNaN(x) || !isFinite(x) ? '-' : f(x, n);

const D = C.DEFAULT_PARAMS;
log('e25, part 1: the 1912 damage (pumps as worked; wMul ' + D.wMul + ', aDown ' + D.aDown + ', fOpen ' + D.fOpen + '). Minutes after the collision; the record: the bridge under at 155, gone at 160.');
log('  ' + 'case'.padEnd(70) + 'B windows'.padStart(10) + 'bridge'.padStart(8) + 'fwd dome'.padStart(10) + 'aft dome'.padStart(10) + 'founders'.padStart(10) + 'list at bridge'.padStart(16) + 'stairs peak t/min'.padStart(19) + 'stairs, t'.padStart(11) + 'windows, t'.padStart(12));
const CASES = [
  ['the model before S1: the hull to B deck, no staircase', { stairs: 0 }, null, hull],
  ['S1 as in force (door ' + D.hDoor + ' m, window ' + D.hWin + ' m, dome ' + D.hDome + ' m, air ' + D.hAir + ' m, Cd ' + D.CdStair + ')', {}],
  ['  the tiers with their sides whole, no staircase', { stairs: 0, windows: 0 }],
  ['  the tiers and their windows, no staircase', { stairs: 0 }],
  ['  the tiers and the staircases, the windows never breaking', { windows: 0 }],
  ['  the hull to B deck with the staircases (no tiers)', {}, null, hull],
  ['a window breaks at 0.5 m of sea', { hWin: 0.5 }],
  ['a window breaks at 1.0 m', { hWin: 1.0 }],
  ['a window breaks at 2.5 m', { hWin: 2.5 }],
  ['a window breaks at 3.5 m', { hWin: 3.5 }],
  ['the windows half the area', {}, (S, W) => { for (const w of W) w.a *= 0.5; }],
  ['the windows twice the area', {}, (S, W) => { for (const w of W) w.a *= 2; }],
  ['a wooden door gives way at 0.7 m', { hDoor: 0.7 }],
  ['a wooden door gives way at 1.5 m', { hDoor: 1.5 }],
  ['a dome\'s cover gives way at 0.2 m of sea on it', { hDome: 0.2 }],
  ['a dome\'s cover gives way at 1.2 m', { hDome: 1.2 }],
  ['no air path: a dome goes by the sea on it alone', { hAir: -1 }],
  ['the domes never give way', { hDome: 1e9, hAir: -1 }],
  ['discharge coefficient 0.5', { CdStair: 0.5 }],
  ['discharge coefficient 0.7', { CdStair: 0.7 }],
  ['the wells 24 m2 free', {}, (S) => { for (const s of S) s.well = 24; }],
  ['the wells 34 m2 free', {}, (S) => { for (const s of S) s.well = 34; }],
  ['the D-deck gangway doors leaking by a gap of a millimetre (0.002)', { leakShell: 0.002 }],
  ['the D-deck gangway doors leaking as fire doors do (0.03)', { leakShell: 0.03 }],
  ['the forward staircase alone', {}, (S) => { S.splice(1, 1); }],
  ['the after staircase alone', {}, (S) => { S.splice(0, 1); }],
];
for (const [label, params, tweak, sh] of CASES) {
  const r = run(P.titanic.build(), params, tweak, sh);
  log('  ' + label.padEnd(70) + m(r.winB).padStart(10) + m(r.bridge).padStart(8) + m(r.domeF).padStart(10) + m(r.domeA).padStart(10) + m(r.founder).padStart(10) + m(r.listBridge, 1).padStart(16) + m(r.peak, 0).padStart(19) + m(r.stairs, 0).padStart(11) + m(r.wins, 0).padStart(12));
}

log('\ne25, part 2: the validation cases before S1 (the hull to B deck, no staircase) and with it (the same flow parameters), and with S1 and the D-deck gangway doors leaking by a millimetre\'s gap (leakShell 0.002)');
log('  ' + 'case'.padEnd(46) + 'before S1'.padEnd(34) + 'with S1'.padEnd(58) + 'with S1, the gangway doors leaking');
function cases() {
  const t5 = P.titanic.build(); t5.openings = t5.openings.filter(o => C.zoneAt(o.x) !== 5);
  const t4 = P.titanic.build(); t4.openings = t4.openings.filter(o => C.zoneAt(o.x) <= 3);
  const tD = P.titanic.build(); tD.bulkTop = { C: 'D', D: 'D', E: 'D', F: 'D', G: 'D', H: 'D', J: 'D' };
  const tB = P.titanic.build(); tB.bulkTop = Object.fromEntries(C.BULKHEADS.map(b => [b.id, 'B']));
  const tOpen = P.titanic.build(); tOpen.doorsOpen = C.BULKHEADS.map(b => b.id);
  const nb = P.britannic.build(); nb.openings = nb.openings.filter(o => o.kind !== 'porthole');
  return [['Titanic 1912, pumps as worked', P.titanic.build()], ['Titanic 1912, no pumps', P.titanic.build({ noPumps: true })],
    ['Four forward compartments (Wilding: floats)', P.four.build()], ['Five forward compartments (Wilding: sinks)', P.five.build()],
    ['Olympic-Hawke 1911 (returned to port)', P.hawke.build()], ['Britannic 1916 (sank in about 55 min)', P.britannic.build()],
    ['Britannic, portholes shut', nb], ['Titanic damage without the BR5 seam', t5], ['Titanic damage stopping at hold 3', t4],
    ['Titanic damage, bulkheads to D deck', tD], ['Titanic damage, bulkheads to B deck', tB], ['Titanic damage, doors left open', tOpen]];
}
for (const [label, scen] of cases()) {
  const r = {};
  for (const k of [0, 1, 2]) {
    const sim = C.createSim(k ? ship : hull, k === 0 ? { stairs: 0 } : (k === 2 ? { leakShell: 0.002 } : {}), JSON.parse(JSON.stringify(scen)));
    const res = C.run(sim, { tMax: 10 * 3600, every: 60, stopWhenStable: true });
    const gone = sim.stairOps.filter((o, j) => sim.stairSt[j] === 2).length;
    r[k] = (res.foundered ? 'founders ' + (res.founderT / 60).toFixed(1) + ' min' : 'afloat, trim ' + (sim.pitch * 180 / Math.PI).toFixed(1) + ' deg') + (k ? ' (' + gone + ' of ' + sim.stairOps.length + ' openings gave way)' : '');
  }
  log('  ' + label.padEnd(46) + r[0].padEnd(34) + r[1].padEnd(58) + r[2]);
}
if (process.argv.includes('--write')) {
  const dir = path.join(__dirname, 'results_2026-11-19');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'e25_grand_staircases.txt'), out.join('\n') + '\n');
}
