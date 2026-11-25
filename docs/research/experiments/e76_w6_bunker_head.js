// e76 (W6): the bunker of the fire on the 1912 damage preset, minute by minute: its water, the head across its wall
// (its level down to the stokehold's water, or its own floor), boiler room 5's stokehold water and level, her list; and
// when it gives way. With `--burst H` the wall's strength is H m of head (params.bunkerBurst); `--never` holds it for good
// (a strength no head reaches), to read the head the night puts on it.
//   node docs/research/experiments/e76_w6_bunker_head.js [--burst H | --never] [--every MIN] [worktree]   (seconds)
const path = require('path');
const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
const root = argv.find(a => /[\\/]/.test(a)) || path.join(__dirname, '..', '..', '..');
const C = require(path.join(root, 'core', 'core.js'));
const SC = require(path.join(root, 'core', 'scenarios.js'));
const ship = C.buildShip(), DEG = 180 / Math.PI;
const params = {};
if (opt('--burst') !== undefined) params.bunkerBurst = +opt('--burst');
if (argv.includes('--never')) params.bunkerBurst = 1e9;
const every = +(opt('--every') || 5);
const sim = C.createSim(ship, params, SC.PRESETS.titanic.build({}));
const k = sim.pockets[0];
if (!k) { console.log('no pocket in this sim'); process.exit(1); }
console.log('the pocket: ' + k.name + '; x ' + k.x0.toFixed(2) + ' to ' + k.x1.toFixed(2) + ', z ' + k.z0.toFixed(2) + ' to ' + k.z1.toFixed(2) +
  ' m; capacity ' + k.cap.toFixed(1) + ' m3; its water\'s centre ' + k.yc.toFixed(2) + ' m to starboard of... (y); node ' + k.node + '; strength ' + sim.params.bunkerBurst + ' m');
console.log('   T    pocket m3  state  head across its wall m   stokehold m3 (its pair)   list deg   inflow into it m3/s   door m3/s');
let next = 0, maxHead = 0, maxHeadT = 0;
const n = k.node, nP = n - 2;                       // the stokehold's two halves (port, starboard), lower layer
while (!sim.foundered && sim.t < 4 * 3600) {
  C.step(sim);
  const F = C.frameOf(sim), T = sim.t / 60;
  let head = NaN;
  if (k.state === 0 && k.vol > 1e-6) {
    const lv = k.vol < k.cap ? C.worldZ(F, k.xc, k.yc, k.z0 + (k.z1 - k.z0) * k.vol / k.cap) : C.worldZ(F, k.xc, k.yc, k.z1) + (k.vol - k.cap) / k.aov;
    const hN = sim.vol[n] > 1e-6 ? sim.level[n] : -1e9, zb = C.worldZ(F, k.xd, k.yd, k.z0);
    head = lv - Math.max(hN, zb);
    if (head > maxHead) { maxHead = head; maxHeadT = T; }
  }
  let qIn = 0; const S = sim.conn; for (let c = 0; c < S.n; c++) if (S.pk[c] === 0) qIn += S.q[c];
  if (T >= next) {
    console.log(String(T.toFixed(0)).padStart(5) + '   ' + k.vol.toFixed(1).padStart(8) + '   ' + String(k.state).padStart(4) + '   ' + (isNaN(head) ? '      -' : head.toFixed(2).padStart(7)) +
      '                 ' + (sim.vol[nP] + sim.vol[n]).toFixed(1).padStart(8) + '             ' + (sim.roll * DEG).toFixed(2).padStart(6) + '     ' + qIn.toFixed(4).padStart(8) + '              ' + k.q.toFixed(4));
    next += every;
  }
}
console.log('gave way: ' + (k.state ? 'at T ' + (k.t / 60).toFixed(2) : 'never') + '; the greatest head across its wall while it held: ' + maxHead.toFixed(2) + ' m at T ' + maxHeadT.toFixed(1) + '; founders at T ' + (sim.foundered ? (sim.founderT / 60).toFixed(2) : 'no'));
