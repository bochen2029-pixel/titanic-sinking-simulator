// The seams gate: with every seam at its neutral value, the core must give the same bits as before the seams existed.
//
// It runs three scenarios step by step and hashes the full state after EVERY step (64 volumes, pose, rates, inflow,
// the founder flag). The digests are compared with out/seams_reference.json, which was frozen from the core BEFORE
// the seams were added (git ef60334). A second pass sets the seams to non-neutral values and checks that the run moves,
// so the gate also proves the seams are wired.
//
//   node tools/seams.js            check against out/seams_reference.json (exit 1 on any difference)
//   node tools/seams.js --freeze   write out/seams_reference.json from the core as it is now
//
// The reference can be machine-specific: engines may differ in the last bit of their transcendental functions, and
// this core turns one ulp into event times that differ after about an hour of simulated time (README, "The port, and
// the oracle"). Measured 2026-11-20 (docs/research/experiments/e70_engine_math_probe.js): between Node v26 and
// Electron 45's V8 on this laptop Math.sin and Math.cos differ on about 3.5 % of angles while Math.pow agreed on
// 800,000 inputs (the earlier remark blamed Math.pow, from the C runtime Node was built against; that is not shown for
// these engines, and may hold for others). Since E1 the model's sine and cosine are its own (C.sin, C.cos), equal to
// Node's, so this reference no longer leans on an engine's for them; since E2a its other such functions, and since the
// calibration epoch's B1 its pow (C.pow, fdlibm's), which Node's Math.pow is not: the one refreeze, a change of
// arithmetic, not of physics (docs/research/experiments/e107). Since B1 the reference is ef60334 run with the model's pow:
// on a new machine, check out ef60334, put 2da3c47's tools/seams.js in it, run it there as
//   node -r <this tree>/tools/pow_preload.js tools/seams.js --freeze
// and copy its out/seams_reference.json here (naming the routine, as the reference's own "routine" says). --freeze in this
// tree writes the core as it is now, which is never the reference.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const C = require('../core/core.js');
const SC = require('../core/scenarios.js');
const REF = path.join(__dirname, '..', 'out', 'seams_reference.json');
const SCEN = [['titanic', 4 * 3600], ['britannic', 4 * 3600], ['hawke', 4 * 3600]];
// The gate proves the core neutral with its later inputs switched off, so it runs the scenarios as they were when the
// reference was frozen: the flow parameters of that calibration, and the 1912 damage without the pumps (Y3 put them in
// the preset and refitted the flow parameters with them; tools/pumps_tests.js checks the pumps themselves), and without
// the grand staircases and the tiers above B deck (S1 put them in the ship; tools/stairs_tests.js checks them, and that a
// run the sea never brings to them has the same bits with them as without): the hull that stops at B deck (GATE_SHIP).
// Nor the bunker of the fire (W6: bunker 0; tools/pocket_tests.js checks it), nor C3's conserving cut (conserve 0).
// And the 1912 damage's split and area as they were (G6b moved the calibration's to Hackett and Bedford's split and a
// refitted area: core/scenarios.js keeps the old ones as TITANIC_SPLIT_GATE and GATE_AREA).
// The calibration epoch's landing (D4) moved defaults this run reads (GM0, zMergeHold, weighOverfill, the coal list, the
// bunker's own opening): core/scenarios.js's PRE_D4 gives them back as they were, under the gate's own numbers.
const GATE_PARAMS = Object.assign({}, SC.PRE_D4.params, { wMul: 1.182, aDown: 0.277, fOpen: 0.0101, stairs: 0, conserve: 0, bunker: 0, g11: 0, g11Doors: 1, sideOpenings: 0 });   // G11: the paths' old widths; C4: every door, no opening in her side
const GATE_SHIP = { tiers: 0, peakTank: 0, hullEnds: 0 };   // G7: and the forepeak as one space, before its tank was a pocket; C3: her ends as fitted, not as the deck plans draw them
const gateBuild = (key) => (key === 'titanic' ? Object.assign(SC.PRESETS.titanic.build({ noPumps: true, split: SC.TITANIC_SPLIT_GATE, areaTitanic: SC.GATE_AREA, bunkerOpen: null }), SC.PRE_D4.scen) : SC.PRESETS[key].build({ noPumps: true }));

function digest(key, tMax, active) {
  const ship = C.buildShip(GATE_SHIP);
  const sim = C.createSim(ship, GATE_PARAMS, gateBuild(key));
  const h = crypto.createHash('sha256');
  const buf = new Float64Array(64 + 7);
  let steps = 0;
  while (!sim.foundered && sim.t < tMax) {
    if (active) {                       // only reached when the seams exist (after P0)
      const S = sim.conn;
      for (let c = 0; c < S.n; c++) if (S.a[c] < 0) { S.hx[c] = 0.5; S.cm[c] = 0.9; }
      sim.xMph = 1e8;
    }
    C.step(sim); steps++;
    buf.set(sim.vol, 0);
    buf[64] = sim.zO; buf[65] = sim.pitch; buf[66] = sim.roll; buf[67] = sim.vz; buf[68] = sim.wth; buf[69] = sim.wph; buf[70] = sim.inflow;
    h.update(Buffer.from(buf.buffer)); h.update(sim.foundered ? 'F' : 'a');
  }
  return { steps, t: sim.t, foundered: sim.foundered, founderT: sim.founderT, sha256: h.digest('hex') };
}

const freeze = process.argv.includes('--freeze');
const out = {};
for (const [key, tMax] of SCEN) out[key] = digest(key, tMax, false);
if (freeze) {
  const rec = { made: new Date().toISOString(), node: process.version, platform: process.platform + '-' + process.arch, scenarios: out };
  fs.writeFileSync(REF, JSON.stringify(rec, null, 1) + '\n');
  for (const k in out) console.log('froze', k.padEnd(10), out[k].steps, 'steps', out[k].sha256);
  process.exit(0);
}
const ref = JSON.parse(fs.readFileSync(REF, 'utf8'));
let bad = 0;
console.log('reference made', ref.made, 'with node', ref.node, ref.platform, '; this run node', process.version);
for (const k in out) {
  const a = out[k], b = ref.scenarios[k], same = a.sha256 === b.sha256 && a.steps === b.steps;
  if (!same) bad++;
  console.log((same ? 'SAME ' : 'DIFF ') + k.padEnd(10), String(a.steps).padStart(6), 'steps', a.sha256.slice(0, 16), same ? '' : '(reference ' + b.sha256.slice(0, 16) + ', ' + b.steps + ' steps)');
}
const sim0 = C.createSim(C.buildShip(GATE_SHIP), GATE_PARAMS, gateBuild('titanic'));
if (!sim0.conn.hx) { console.log('seams not present in core/core.js: only the reference check was run'); }
else {
  const moved = digest('titanic', 3600, true);
  const wired = moved.sha256 !== digest('titanic', 3600, false).sha256;
  if (!wired) bad++;
  console.log((wired ? 'WIRED' : 'DEAD ') + ' non-neutral seams change the 1912 run:', wired);
}
console.log(bad ? 'FAIL: ' + bad + ' check(s)' : 'PASS: the seams are neutral at rest and live when set');
process.exit(bad ? 1 : 0);
