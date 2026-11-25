// Validation runs with the calibrated model. Writes out/validation.json.
const fs = require('fs');
const C = require('../core/core.js');
const SC = require('../core/scenarios.js');
const ship = C.buildShip();
const fmtT = t => `${Math.floor(t / 3600)}h${String(Math.floor(t / 60) % 60).padStart(2, '0')}m`;
const out = {};
function go(key, label, scen, opts) {
  opts = opts || {};
  const sim = C.createSim(ship, opts.params || {}, scen);
  const res = C.run(sim, { tMax: (opts.tMax || 8) * 3600, every: 30, stopWhenStable: true });
  const r = res.final;
  const rec = { label, foundered: res.foundered, founderMin: res.foundered ? +(res.founderT / 60).toFixed(1) : null,
    endMin: +(sim.t / 60).toFixed(1), trim: +r.trimDeg.toFixed(2), list: +r.listDeg.toFixed(2), water: Math.round(r.waterT),
    events: res.events.map(e => ({ t: +(e.t / 60).toFixed(1), label: e.label })) };
  if (opts.keepHist) rec.hist = res.hist.filter((h, i) => i % 2 === 0).map(h => [+(h.t / 60).toFixed(2), +h.trim.toFixed(3), +h.list.toFixed(3), Math.round(h.water)]);
  out[key] = rec;
  console.log(label.padEnd(44), res.foundered ? `FOUNDERS at ${fmtT(res.founderT)}` : `afloat (checked to ${fmtT(sim.t)})`, ` trim ${r.trimDeg.toFixed(2)}°  list ${r.listDeg.toFixed(2)}°  water ${Math.round(r.waterT)} t`);
  if (!res.foundered) {             // A4 (the epoch, stage A; QC E-2, E-9): a floating case's margin, so an edge is seen
    const m = margin(sim);
    if (m) { rec.margin = { bulkhead: m.id, m: +m.h.toFixed(2) }; console.log(`   its margin: bulkhead ${m.id}'s top (${sim.bulkTop[m.b]} deck), between its wet and dry sides, ${m.h.toFixed(2)} m above the sea`); }
  }
  return { sim, res };
}
// the lowest top, above the sea, of a bulkhead with water on one side and none on the other (the zones' water with the
// pockets', C.spaceWater): what stands between a floating case and the next compartment
function margin(sim) {
  const F = C.frameOf(sim), zw = (k) => { let v = 0; for (let s = 0; s < 4; s++) v += C.spaceWater(sim, k * 4 + s); return v; };
  let best = null;
  for (let b = 0; b < C.BULKHEADS.length; b++) {
    const wf = zw(b) > 10, wa = zw(b + 1) > 10;
    if (wf === wa) continue;
    const x = C.BULKHEADS[b].x, h = C.worldZ(F, x, 0, C.deckZ(sim.bulkTop[b], x));
    if (!best || h < best.h) best = { b, id: C.BULKHEADS[b].id, h };
  }
  return best;
}
// A4: one number moved by one unit in its last place, and the opening by a thousandth: the 1912 founder's noise floor
// (QC A-3 and its experiment 4: 0 to 3.5 s for a last bit, 6 to 11 s for a thousandth of the opening, on join 5)
const ulpUp = (x) => { const f = new Float64Array([x]), b = new BigInt64Array(f.buffer); b[0] += 1n; return f[0]; };
const P = SC.PRESETS;
const t = go('titanic', 'Titanic 1912 (calibrated)', P.titanic.build(), { keepHist: true });
const h16 = t.res.hist.find(h => h.water >= SC.OBS.wilding40);
console.log('   floodwater reaches Wilding\'s 16,000 tons at', (h16.t / 60).toFixed(1), 'min (Wilding assumed 40)');
out.titanic.wildingMin = +(h16.t / 60).toFixed(1);
out.titanic.water40 = Math.round(t.res.hist.find(h => h.t >= 2400).water);
for (const e of t.res.events) console.log('   ', (e.t / 60).toFixed(1).padStart(6), 'min', e.label);
{
  const D = C.DEFAULT_PARAMS, T0 = t.res.founderT, runT = (prm, scen) => C.run(C.createSim(ship, prm, scen), { tMax: 5 * 3600, every: 30 }).founderT;
  const noise = ['CdBreach', 'aDown', 'GM0'].map(k => [k + ' +1 ulp', runT({ [k]: ulpUp(D[k]) }, P.titanic.build())]);
  for (const f of [1.001, 0.999]) noise.push(['the opening x ' + f, runT({}, P.titanic.build({ areaTitanic: SC.CALIBRATED_AREA * f }))]);
  console.log('   the noise floor (A-3): ' + noise.map(([k, T]) => k + ' ' + (T - T0 >= 0 ? '+' : '') + (T - T0).toFixed(2) + ' s').join('; '));
  out.titanic.noise = noise.map(([k, T]) => [k, T - T0]);
}
go('four', 'Four forward compartments (Wilding: floats)', P.four.build());
go('five', 'Five forward compartments (Wilding: sinks)', P.five.build());
go('hawke', 'Olympic-Hawke 1911 (returned to port)', P.hawke.build());
const b = go('britannic', 'Britannic 1916, approx. (sank in ~55 min)', P.britannic.build(), { keepHist: true });
const nb = P.britannic.build(); nb.openings = nb.openings.filter(o => o.kind !== 'porthole');
go('britannicClosed', 'Britannic, same damage, portholes shut', nb);
const t5 = P.titanic.build(); t5.openings = t5.openings.filter(o => C.zoneAt(o.x) !== 5);
go('titanicNoBR5', 'Titanic damage without the BR5 seam', t5);
const t4 = P.titanic.build(); t4.openings = t4.openings.filter(o => C.zoneAt(o.x) <= 3);
go('titanicFour', 'Titanic damage stopping at hold 3', t4);
const tD = P.titanic.build(); tD.bulkTop = { C: 'D', D: 'D', E: 'D', F: 'D', G: 'D', H: 'D', J: 'D' };
go('titanicD', 'Titanic damage, all bulkheads to D deck', tD);
const tB = P.titanic.build(); tB.bulkTop = Object.fromEntries(C.BULKHEADS.map(b => [b.id, 'B']));
go('titanicB', 'Titanic damage, all bulkheads to B deck', tB);
const tOpen = P.titanic.build(); tOpen.doorsOpen = C.BULKHEADS.map(b => b.id);
go('titanicDoors', 'Titanic damage, watertight doors left open', tOpen);
fs.writeFileSync(require('./outdir')('validation.json'), JSON.stringify(out));
