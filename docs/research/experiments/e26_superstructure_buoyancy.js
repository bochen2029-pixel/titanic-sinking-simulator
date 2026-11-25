// e26: what the model leaves out above B deck, measured. The core's hull stops at B deck (core/core.js, zTopAt): the
// three tiers above it (B to A deck, A to the Boat deck, the Boat-deck houses) hold no water and give no buoyancy, as if
// the sea passed through them (README, "Known gaps": "no buoyancy from the superstructure above B deck"). In the ship
// they were weathertight boxes with windows and doors: dry, and buoyant when the sea came up round them, until their
// glazing gave way. This experiment puts that buoyancy on the core from outside, through its seams (sim.xFz, xMth,
// xMph), and lets each stretch of each tier flood through its windows by a simple law, to see what the missing
// physics is worth in her last minutes: when she founders, how she rolls, and whether the grand staircases (S1, in the
// core) then do more. NO core change; every number of the tiers is a bet, stated below.
//   node docs/research/experiments/e26_superstructure_buoyancy.js [--write]
// Output: results_2026-11-19/e26_superstructure_buoyancy.txt
// What it found on 2026-11-19, on the hull that stops at B deck with the flow parameters of Y3 (it builds that ship and
// passes those parameters, so that it can be run again): with the tiers buoyant and their windows breaking under 0.5 m
// of sea she founders at 159.8 minutes instead of 156.9 (160 on the night) and lists 11.6 degrees to port at T 155
// instead of 43; with 1.5 m, 161.4 minutes and 3.8 degrees. That is why S1 then put the tiers into the core itself, as
// real space (core/core.js, TIER). Never run it on a ship built with her tiers: they would count twice.
const fs = require('fs'), path = require('path');
const C = require('../../../core/core.js');
const SC = require('../../../core/scenarios.js');
const out = [], log = (s) => { out.push(s); console.log(s); };
const ship = C.buildShip({ tiers: 0 }), RHO = C.RHO, G = C.GRAV, SQ2G = Math.sqrt(2 * G);   // the hull to B deck: the tiers are put on from outside here
const OLD = { wMul: 2.735, aDown: 0.280, fOpen: 0.01411 };                                   // the flow parameters of Y3, in force when this was run

// The tiers [bets: the viewer's boxes of 2026-11-18 (site/app.js), the deck table of the core, the Wreck Commissioner's
// "a long house 24 to 72 ft wide" on A deck and "a steel screen 192 ft long" closing its forward promenade]:
//   x0, x1: its ends, m forward of amidships; z0, z1: the decks it stands between; hw(x): its half breadth, m (null: the
//   hull's own there); win: window and door area in its sides, m2 for each metre of its length, both sides together.
const TIERS = [
  { name: 'B to A deck', x0: -90.8, x1: 76.9, z0: 'B', z1: 'A', hw: () => null, win: 0.50 },
  { name: 'A deck to the Boat deck', x0: -78, x1: 73.5, z0: 'A', z1: 'Boat', hw: (x) => (x > 15 ? null : 10), win: 0.60 },
  { name: 'the Boat-deck houses', x0: -70, x1: 73.5, z0: 'Boat', z1: 'Boat+2.7', hw: (x) => (x > 20 ? 8 : 5.4), win: 0.30 },
];
const zOf = (name, x) => name === 'Boat+2.7' ? C.deckZ('Boat', x) + 2.7 : C.deckZ(name, x);
const DX = 3, DY = 1, SILL = 1.0;       // columns 3 m by 1 m; a window's middle 1 m over its deck [bet]

// cells: each tier cut at the bulkheads' stations (so a cell stands over one compartment), each with its columns
function buildCells() {
  const cells = [];
  for (const t of TIERS) {
    const byZone = new Map();
    for (let x = t.x0 + DX / 2; x < t.x1; x += DX) {
      const k = C.zoneAt(x), z0 = zOf(t.z0, x), z1 = zOf(t.z1, x);
      const hull = C.halfBreadth(x, z0), hw = Math.min(t.hw(x) === null ? hull : t.hw(x), hull);
      if (!(hw > 0.5)) continue;
      if (!byZone.has(k)) byZone.set(k, { tier: t.name, k, cols: [], len: 0, win: 0, vw: 0, open: false, hw: 0, xm: 0 });
      const c = byZone.get(k);
      for (let y = -hw + DY / 2; y < hw; y += DY) c.cols.push([x, y, z0, z1, DX * DY]);
      c.len += DX; c.win += t.win * DX; c.hw = Math.max(c.hw, hw); c.xm += x * DX;
      c.sides = c.sides || []; c.sides.push([x, hw, z0 + SILL], [x, -hw, z0 + SILL]);
    }
    for (const c of byZone.values()) { c.xm /= c.len; cells.push(c); }
  }
  return cells;
}

// one run: hWin, the head (m) at which a cell's windows give way (Infinity: they hold and only leak); leak, the share of
// their area that leaks while they hold; superOn false: the core alone
function run(opt) {
  const sim = C.createSim(ship, Object.assign({ windows: 0 }, OLD, opt.params || {}), SC.PRESETS.titanic.build({}));
  const cells = opt.superOn ? buildCells() : [], dt = sim.params.dt;
  let peak = 0, peakT = 0, rollMax = 0, trim155 = NaN, roll155 = NaN, firstWin = -1, vTot = 0;
  while (!sim.foundered && sim.t < 5 * 3600) {
    if (cells.length) {
      const F = C.frameOf(sim);
      let Fz = 0, Mth = 0, Mph = 0;
      if (C.worldZ(F, 76, 0, C.deckZ('B', 76)) < 3 || C.worldZ(F, -90, 0, C.deckZ('B', -90)) < 3 || Math.abs(sim.roll) > 0.12) {
        const iR = 1 / F.R22; let buoy = 0;
        for (const c of cells) {
          let v = 0, mx = 0, my = 0, mz = 0;
          for (const [x, y, z0, z1, a] of c.cols) {
            const zp = -(F.R20 * x + F.R21 * y + F.tz) * iR;          // the sea's height in her frame at this column
            if (zp <= z0) continue;
            const s = zp >= z1 ? z1 - z0 : zp - z0, dv = a * s;
            v += dv; mx += dv * x; my += dv * y; mz += dv * (z0 + 0.5 * s);
          }
          if (!(v > 0)) { continue; }
          // the sea's head at the cell's windows: the deepest, and the mean over those under water
          let hMax = 0, hSum = 0, n = 0;
          for (const [x, y, z] of c.sides) { const h = -(F.R20 * x + F.R21 * y + F.R22 * z + F.tz); if (h > 0) { hSum += h; n++; if (h > hMax) hMax = h; } }
          if (!c.open && hMax >= opt.hWin) { c.open = true; if (firstWin < 0) firstWin = sim.t; }
          if (n > 0 && c.vw < v) {
            const share = n / c.sides.length, A = c.win * share * (c.open ? 1 : opt.leak);
            c.vw = Math.min(v, c.vw + 0.6 * A * SQ2G * Math.sqrt(hSum / n) * (1 - c.vw / v) * dt);
          }
          if (c.vw > v) c.vw = v;                                      // water above the sea runs back out
          const f = RHO * G * (v - c.vw), x = mx / v, y = my / v, z = mz / v;
          const X = F.R00 * x + F.R01 * y + F.R02 * z + F.tx, Y = F.R10 * x + F.R11 * y + F.R12 * z + F.ty;
          Fz += f; Mth -= (X - sim.XO) * f; Mph += (Y - sim.YO) * f * F.cth; buoy += v - c.vw;
        }
        if (buoy > peak) { peak = buoy; peakT = sim.t; }
      }
      sim.xFz = Fz; sim.xMth = Mth; sim.xMph = Mph;
    }
    C.step(sim);
    if (Math.abs(sim.roll) > rollMax) rollMax = Math.abs(sim.roll);
    if (isNaN(trim155) && sim.t >= 155 * 60) { trim155 = sim.pitch * 180 / Math.PI; roll155 = sim.roll * 180 / Math.PI; }
  }
  for (const c of cells) vTot += c.vw;
  const ev = (id) => { const e = sim.events.find(x => x.id === id); return e ? e.t / 60 : NaN; };
  return { founder: sim.founderT / 60, bridge: ev('bridge'), domeF: ev('domeF'), trim155, roll155, peak: peak * 1.025, peakT: peakT / 60, firstWin: firstWin / 60, rollMax: rollMax * 180 / Math.PI };
}
const m = (x, n) => x === undefined || isNaN(x) || !isFinite(x) || x < 0 ? '-' : x.toFixed(n === undefined ? 2 : n);

log('e26: the 1912 damage with the three tiers above B deck buoyant until their windows give way (through the seams; the core unchanged).');
log('Tiers [bets]: ' + TIERS.map(t => t.name + ' ' + t.x0 + ' to ' + t.x1 + ' m, windows ' + t.win + ' m2 a metre').join('; ') + '. Shut windows leak 0.02 of their area.');
log('  ' + 'case'.padEnd(66) + 'bridge'.padStart(8) + 'fwd dome'.padStart(10) + 'founders'.padStart(10) + 'trim, list at T 155'.padStart(22) + 'most held up, t'.padStart(18) + 'at T'.padStart(8) + 'first windows'.padStart(15));
const P = [
  ['the core alone, without the staircases', { superOn: false, params: { stairs: 0 } }],
  ['the core alone, with the staircases (S1)', { superOn: false }],
  ['tiers buoyant, windows give way at 0.5 m; no staircases', { superOn: true, hWin: 0.5, leak: 0.02, params: { stairs: 0 } }],
  ['tiers buoyant, windows give way at 0.5 m', { superOn: true, hWin: 0.5, leak: 0.02 }],
  ['tiers buoyant, windows give way at 1.5 m', { superOn: true, hWin: 1.5, leak: 0.02 }],
  ['tiers buoyant, windows give way at 3 m', { superOn: true, hWin: 3, leak: 0.02 }],
  ['tiers buoyant, windows give way at 3 m; no staircases', { superOn: true, hWin: 3, leak: 0.02, params: { stairs: 0 } }],
  ['tiers buoyant, windows give way at 6 m', { superOn: true, hWin: 6, leak: 0.02 }],
  ['tiers buoyant, windows hold and leak', { superOn: true, hWin: Infinity, leak: 0.02 }],
  ['tiers buoyant, windows hold and leak; no staircases', { superOn: true, hWin: Infinity, leak: 0.02, params: { stairs: 0 } }],
];
for (const [label, opt] of P) {
  const r = run(opt);
  log('  ' + label.padEnd(66) + m(r.bridge).padStart(8) + m(r.domeF).padStart(10) + m(r.founder).padStart(10) + (m(r.trim155, 1) + ', ' + (isNaN(r.roll155) ? '-' : r.roll155.toFixed(1))).padStart(22) + m(r.peak, 0).padStart(18) + m(r.peakT).padStart(8) + m(r.firstWin).padStart(15));
}
if (process.argv.includes('--write')) {
  const dir = path.join(__dirname, 'results_2026-11-19');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'e26_superstructure_buoyancy.txt'), out.join('\n') + '\n');
}
