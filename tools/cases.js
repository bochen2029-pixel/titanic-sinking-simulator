const C = require('../core/core.js');
const ship = C.buildShip();
const fmt = (t) => { const m = Math.floor(t / 60); return `${Math.floor(m/60)}h${String(m%60).padStart(2,'0')}m`; };
function caseRun(label, zonesOpen, area, opts) {
  opts = opts || {};
  const openings = [];
  for (const k of zonesOpen) {
    const Z = ship.zones[k]; const x = Z.xm; const z = opts.z || 3.0;
    openings.push({ x, y: -(C.halfBreadth(x, z) + 0.01), z, area, kind: 'breach' });
  }
  const sim = C.createSim(ship, opts.params || {}, Object.assign({ openings, coalListDeg: 0 }, opts.scen || {}));
  const t0 = Date.now();
  const res = C.run(sim, { tMax: opts.tMax || 5 * 3600, stopWhenStable: true });
  const ms = Date.now() - t0;
  const r = res.final;
  // freeboard to the lowest bulkhead crest (E deck at the bulkhead aft of the flooded group)
  const F = C.frameOf(sim);
  const last = Math.max(...zonesOpen);
  const bh = C.BULKHEADS[last]; // bulkhead aft of zone `last`
  const crest = bh ? C.worldZ(F, bh.x, 0, C.deckZ(sim.bulkTop[last], bh.x)) : NaN;
  console.log(`${label.padEnd(34)} ${res.foundered ? 'FOUNDERED at ' + fmt(res.founderT) : 'afloat'}  t=${fmt(sim.t)}  trim ${r.trimDeg.toFixed(2)}°  list ${r.listDeg.toFixed(2)}°  dF ${r.draftF.toFixed(2)} dA ${r.draftA.toFixed(2)}  water ${r.waterT.toFixed(0)} t  crest(${bh ? bh.id : '-'}) ${crest.toFixed(2)} m  [${(sim.t / 0.25 / ms * 1000).toFixed(0)} steps/s]`);
  return { sim, res };
}
const big = 1.0;
caseRun('Two adjacent: BR6+BR5', [4, 5], big);
caseRun('Two adjacent: H3+BR6', [3, 4], big);
caseRun('Three: FP+H1+H2', [0, 1, 2], big);
caseRun('Four: FP+H1+H2+H3 (Wilding: floats)', [0, 1, 2, 3], big);
caseRun('Five: FP..BR6 (Wilding: sinks)', [0, 1, 2, 3, 4], big);
caseRun('Six: FP..BR5', [0, 1, 2, 3, 4, 5], big);
caseRun('Aft two: T2+AP (Olympic-Hawke)', [14, 15], 2.0, { z: 7.5 });
