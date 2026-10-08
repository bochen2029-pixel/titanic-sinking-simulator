const C = require('../core/core.js');
const t0 = Date.now();
const ship = C.buildShip();
console.log('ship built ms', Date.now() - t0, 'cols', ship.cols.N, 'entries', ship.entCol.length);
console.log('hyd', JSON.stringify(Object.fromEntries(Object.entries(ship.hyd).map(([k,v])=>[k,+v.toFixed(3)]))));
const sim = C.createSim(ship, {}, { coalListDeg: 0 });
let r = C.readouts(sim);
console.log('intact: draftF %s draftA %s trim %s list %s ms %s t KG %s GM %s', r.draftF.toFixed(3), r.draftA.toFixed(3), r.trimDeg.toFixed(3), r.listDeg.toFixed(3), (sim.ms/1000).toFixed(0), sim.KG.toFixed(3), C.gmNow(sim).toFixed(3));
// zone capacities up to the waterline-ish
const vmax = []; for (let k=0;k<16;k++){ let lo=0, up=0; for (let s=0;s<2;s++){ lo+=ship.nodeVmax[C.nodeIndex(k,s,0)]; up+=ship.nodeVmax[C.nodeIndex(k,s,1)]; } vmax.push([C.ZONES[k].short, lo.toFixed(0), up.toFixed(0)]); }
console.log('zone Vmax lower/upper m3:', vmax.map(v=>v.join(':')).join('  '));
// run intact for 10 min: should not move
for (let i=0;i<2400;i++) C.step(sim);
r = C.readouts(sim);
console.log('after 10 min intact: trim %s list %s draftF %s water %s', r.trimDeg.toFixed(4), r.listDeg.toFixed(4), r.draftF.toFixed(4), r.waterT.toFixed(2));
// coal list
const sim2 = C.createSim(ship, {}, {});
console.log('coal list equilibrium list deg', (sim2.roll*180/Math.PI).toFixed(3));
