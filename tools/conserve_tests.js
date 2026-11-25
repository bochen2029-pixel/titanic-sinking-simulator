// C3: the step conserves the water. A space never gives more in a step than it holds (params.conserve; GATE_PARAMS and
// the coupled trial keep it off, the step as it was). Every validation case is run to its end and the water aboard is
// held against the inflow summed, less what the pumps put back over the side, at every step (HANDOFF section 3's check).
// MUST rows fail the suite; CHECK rows print what is worth seeing.   node tools/conserve_tests.js
'use strict';
const C = require('../core/core.js');
const SC = require('../core/scenarios.js');
const rows = []; let fails = 0, checks = 0;
function row(kind, what, value, ref, ok) { rows.push([kind, what, value, ref, ok]); if (!ok) { if (kind === 'MUST') fails++; else checks++; } }
const ship = C.buildShip(), P = SC.PRESETS;

// the validation cases, as tools/validate.js builds them
const cases = [['titanic', P.titanic.build()], ['four', P.four.build()], ['five', P.five.build()], ['hawke', P.hawke.build()], ['britannic', P.britannic.build()]];
{ const s = P.britannic.build(); s.openings = s.openings.filter(o => o.kind !== 'porthole'); cases.push(['britannicClosed', s]); }
{ const s = P.titanic.build(); s.openings = s.openings.filter(o => C.zoneAt(o.x) !== 5); cases.push(['titanicNoBR5', s]); }
{ const s = P.titanic.build(); s.openings = s.openings.filter(o => C.zoneAt(o.x) <= 3); cases.push(['titanicFour', s]); }
{ const s = P.titanic.build(); s.bulkTop = { C: 'D', D: 'D', E: 'D', F: 'D', G: 'D', H: 'D', J: 'D' }; cases.push(['titanicD', s]); }
{ const s = P.titanic.build(); s.bulkTop = Object.fromEntries(C.BULKHEADS.map(b => [b.id, 'B'])); cases.push(['titanicB', s]); }
{ const s = P.titanic.build(); s.doorsOpen = C.BULKHEADS.map(b => b.id); cases.push(['titanicDoors', s]); }

// her water: the 64 spaces' and, since W6, the pockets' (the bunker of the fire holds its own)
const sumVol = (sim) => { let s = 0; for (let n = 0; n < sim.vol.length; n++) s += sim.vol[n]; for (const k of sim.pockets || []) s += k.vol; return s; };
function runCase(scen0, conserve, hours) {
  const sim = C.createSim(ship, { conserve }, JSON.parse(JSON.stringify(scen0)));
  const v0 = sumVol(sim);
  let inSum = 0, worst = 0, cutSteps = 0, k = 0;
  while (sim.t < hours * 3600 && !sim.foundered && k < 2e5) {
    C.step(sim); k++;
    inSum += sim.inflow * sim.params.dt;
    const err = sumVol(sim) - v0 - (inSum - (sim.pumped || 0));
    if (Math.abs(err) > Math.abs(worst)) worst = err;
    if (conserve) for (let n = 0; n < sim._out.length; n++) if (sim._out[n] < 1) { cutSteps++; break; }
  }
  return { sim, worst, cutSteps, k, aboard: sumVol(sim) - v0 };
}

// 1. every validation case conserves, step by step
const tol = 1e-5, res = {};
for (const [key, scen] of cases) res[key] = runCase(scen, 1, 4);
const bad = Object.entries(res).filter(([, r]) => !(Math.abs(r.worst) <= tol));
row('MUST', 'every validation case conserves its water at every step: aboard = inflow summed - pumped, within ' + tol + ' m3', bad.length ? bad.map(([k, r]) => k + ' ' + r.worst.toExponential(2)).join('; ') : cases.length + ' cases; the worst ' + Math.max(...Object.values(res).map(r => Math.abs(r.worst))).toExponential(2) + ' m3', 'HANDOFF section 3 (the check that did not hold before C3)', bad.length === 0);

// 2. the cut is the only change: a case in which no space is ever cut has the same bits with it on and off. G7 (join 7)
// took the damage to hold 3 out of this row: with the forepeak's tank, the tank's vent water reaches the forepeak's
// starboard half in the same step as the level solve passes it to the port half, so that half gives more in 5 steps
// (T 22.9 to 23.1) than it held at their start, by thousandths of a cubic metre, and the cut holds it, as it should
const neutral = ['four', 'hawke'].map(key => { const a = res[key], b = runCase(cases.find(c => c[0] === key)[1], 0, 4);
  let same = a.k === b.k && a.cutSteps === 0; for (let n = 0; same && n < a.sim.vol.length; n++) same = a.sim.vol[n] === b.sim.vol[n];
  return [key, a.cutSteps, same]; });
row('MUST', 'a case in which no space is ever cut is the same to the bit with the cut on and off (the four compartments, Hawke)', neutral.map(([k, c, s]) => k + ': ' + c + ' steps cut, ' + (s ? 'the same' : 'DIFFERENT')).join('; '), 'all the same', neutral.every(([, c, s]) => c === 0 && s));

// 3. with the cut off the step is the one before C3, which made water: on the 1912 damage until the calibration epoch's
// B1, whose arithmetic (the model's own pow) left that run's fault at -1.94e-6 m3 with the cut off. Whether a case's
// fault shows depends on its last bits, so the row reads every case the cut acts on (section 1's steps cut), with the
// cut off, and holds that the fault shows in at least one of them
const offs = cases.filter(([key]) => res[key].cutSteps > 0).map(([key, scen]) => [key, runCase(scen, 0, 4)]);
const made = offs.filter(([, r]) => Math.abs(r.worst) > 1e-3);
row('MUST', 'with the cut off (conserve 0, as the seams gate runs) a case the cut acts on makes water, as before C3', offs.map(([k, r]) => k + ' ' + r.worst.toExponential(2)).join('; ') + ' m3 made', 'over 1e-3 m3 in at least one (the fault the cut mends)', made.length > 0);

// 3b. D89 (e114, 2026-11-23): a trace of water is kept. solvePair zeroed a pair holding 1e-6 m3 or less, which lost
// the water a bunker's door trickles into a stokehold the pumps keep dry (2.8e-5 m3 over the first history match's worst
// set, on the bulkheads to D deck, its watch afloat 8 h). With params.conserve it is kept; with conserve 0 (the step
// before C3, as the seams gate runs it) it is zeroed as before. That set, the landing's switches on, and its three cases
// that the match runs for their water: within ROUNDOFF, the error of summing her water (about 1e5 m3) each step over
// 115,200 steps [derived: 1.1e-16 x 1e5 x sqrt(115200), about 4e-9 m3], 2,800 times under the leak
{
  const X = { area: 0.8985123141803761, bunkerBurst: 6.352012786044726, bunkerOpen: 0.004189881647057481, aDown: 0.3749037711014924, fOpen: 0.025125459164969926,
    split: 0.8040914026892279, GM0: 0.927357204920426, zMergeHold: 5.1683010200749155, peakVent: 0.00821322187740542, sideStrength: 0.10849358721463942, coalListDeg: 0.5303647624984928 };
  const ROUNDOFF = 1e-8, sh = C.buildShip({ hullEnds: 1 });
  const p = { weighOverfill: 0, g11Doors: 0, sideOpenings: 1 }; for (const k of ['bunkerBurst', 'aDown', 'fOpen', 'GM0', 'zMergeHold', 'peakVent', 'sideStrength']) p[k] = X[k];
  const blend = (t) => SC.TITANIC_SPLIT.map((s, i) => Object.assign({}, s, { f: (1 - t) * s.f + t * SC.TITANIC_SPLIT_GATE[i].f }));
  const ice = () => { const s = P.titanic.build({ areaTitanic: X.area, bunkerOpen: X.bunkerOpen, split: blend(X.split) }); s.coalListDeg = X.coalListDeg; return s; };
  const three = [['titanicD', (s) => { s.bulkTop = { C: 'D', D: 'D', E: 'D', F: 'D', G: 'D', H: 'D', J: 'D' }; }], ['titanicB', (s) => { s.bulkTop = Object.fromEntries(C.BULKHEADS.map(b => [b.id, 'B'])); }], ['titanicDoors', (s) => { s.doorsOpen = C.BULKHEADS.map(b => b.id); }]];
  const res3 = three.map(([id, f]) => {
    const s = ice(); f(s);
    const sim = C.createSim(sh, p, s), v0 = sumVol(sim); let inSum = 0, worst = 0;
    while (sim.t < 8 * 3600 && !sim.foundered) { C.step(sim); inSum += sim.inflow * sim.params.dt; const err = sumVol(sim) - v0 - (inSum - (sim.pumped || 0)); if (Math.abs(err) > Math.abs(worst)) worst = err; }
    return [id, worst];
  });
  row('MUST', 'D89: a trace of water is kept: the first match\'s worst set (e114), the landing\'s switches on, its bulkheads to D and B deck and its doors left open', res3.map(([id, w]) => id + ' ' + w.toExponential(2)).join('; ') + ' m3', 'within ' + ROUNDOFF + ' m3, roundoff (the leak was -2.80e-5 on the bulkheads to D)', res3.every(([, w]) => Math.abs(w) < ROUNDOFF));
}

// 4. what is cut, case by case
row('CHECK', '  ... steps in which a space was cut, case by case (conserve 1)', Object.entries(res).map(([k, r]) => k + ' ' + r.cutSteps).join(', '), 'as it comes', true);
row('CHECK', '  ... each case\'s end (founders or afloat at 4 h), conserve 1', Object.entries(res).map(([k, r]) => k + ' ' + (r.sim.foundered ? (r.sim.founderT / 60).toFixed(1) + ' min' : 'afloat')).join(', '), 'the validation table', true);

for (const [kind, what, value, ref, ok] of rows) console.log((ok ? 'PASS ' : (kind === 'MUST' ? 'FAIL ' : 'CHECK ')) + kind.padEnd(6) + what.padEnd(100) + ' ' + String(value).padEnd(60) + ' ' + ref);
console.log(fails ? '\nFAIL: ' + fails + ' MUST row(s)' + (checks ? ', ' + checks + ' CHECK row(s) off' : '') : '\nPASS: all ' + rows.filter(r => r[0] === 'MUST').length + ' MUST rows' + (checks ? '; ' + checks + ' CHECK row(s) off' : ''));
process.exit(fails ? 1 : 0);
