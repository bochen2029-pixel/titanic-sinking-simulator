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
  return { sim, res };
}
const P = SC.PRESETS;
const t = go('titanic', 'Titanic 1912 (calibrated)', P.titanic.build(), { keepHist: true });
const h16 = t.res.hist.find(h => h.water >= SC.OBS.wilding40);
console.log('   floodwater reaches Wilding\'s 16,000 tons at', (h16.t / 60).toFixed(1), 'min (Wilding assumed 40)');
out.titanic.wildingMin = +(h16.t / 60).toFixed(1);
out.titanic.water40 = Math.round(t.res.hist.find(h => h.t >= 2400).water);
for (const e of t.res.events) console.log('   ', (e.t / 60).toFixed(1).padStart(6), 'min', e.label);
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
fs.writeFileSync(__dirname + '/../out/validation.json', JSON.stringify(out));
