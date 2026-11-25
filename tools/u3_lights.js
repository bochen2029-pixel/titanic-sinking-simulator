// U3, her lights failing (docs/BRAINSTORM_titanic_in_unreal_v1_2026-11-20.md, sections 4.3 and 5: "her lights failing deck
// by deck"), headless: when each of her lights goes dark, from the recorded night alone.
//   node tools/u3_lights.js          -> out/u3_lights.json (not tracked), and the proof's rows (about half a minute)
// A light burns at the plant's level (the record's channels.plant.lights: 1 all her light from the main dynamos, 0.15 the
// emergency lights' share, 0 none; core/systems.js) until the fuses of its section blow (G1 of NH15, core/readers/circuits.js:
// the record's readers.circuits; a section is one deck's space in one watertight compartment on one side, and its fuses
// blow for good when the sea inside it reaches its switches). Every lit port and window of the export (tools/export_ship.js:
// lights.ports, topsides.windows, each with its compartment and deck) has its section, found from the record by its
// compartment, side and deck; her navigation lights, on her masts and screens outside her spaces, have none and burn at
// the plant's level to the end. Each light keeps the step it first goes under the sea (under), at the record's pose by
// its frames.pose: the sea outside its glass does not put it out (version 1 put it out there), the sea in its section
// does. A renderer lights each by plant.lights at the step, and puts it out from its `out` step on.
// MUST rows: the plant's level changes exactly where the record's own events say the dynamos stopped (plant:mainDark,
// plant:dark), and nowhere else; every port's and window's section from the record is the slab its point lies in
// (rooms.js's slabAt on the model's ship); every section's step in the record is the circuits reader's own on the model
// run again here; every light's step under the sea, from the record's pose, is the model's own (its pose by C.frameOf),
// to the step. CHECK rows: the timeline, deck by deck.
'use strict';
const fs = require('fs');
const C = require('../core/core.js');
const N = require('../core/night.js');
const XS = require('./export_ship.js');
const RN = require('./record_night.js');
const J = require('./export_json.js');
const RM = require('../core/readers/rooms.js');
const CIR = require('../core/readers/circuits.js');
const outFile = require('./outdir');

const rows = []; let fails = 0;
function row(kind, what, value, ref, ok) { rows.push([kind, what, value, ref, ok]); if (!ok && kind === 'MUST') fails++; }
const f = (x, n) => (x === null || x === undefined || Number.isNaN(x) ? 'n/a' : (+x).toFixed(n === undefined ? 2 : n));
// the record's frames.pose, its world Z of a ship point
function zOf(K, zO, pitch, roll, p) {
  const cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll), g = K.g0;
  const R20 = -sp, R21 = cp * sr, R22 = cp * cr, tz = zO - (R20 * g[0] + R21 * g[1] + R22 * g[2]);
  return R20 * p[0] + R21 * p[1] + R22 * p[2] + tz;
}

try {
  const ship = JSON.parse(XS.exportShip().text), rec = JSON.parse(RN.record({}).text), K = rec.constants, ch = rec.channels, n = rec.clock.n, k0 = rec.clock.k0;
  const lights = [];
  ship.lights.ports.list.forEach((p, i) => lights.push({ kind: 'port', i, zone: p.zone, deck: p.deck, p: [p.x, p.y, p.z] }));
  ship.topsides.windows.list.forEach((w, i) => lights.push({ kind: 'window', i, zone: w.zone, deck: w.deck, p: [w.x, w.y, w.z] }));
  ship.lights.navigation.forEach((L, i) => lights.push({ kind: 'navigation', i, id: L.id, zone: C.zoneAt(L.at[0]), deck: XS.deckAt(L.at[0], L.at[2]), p: L.at }));

  // ---- the plant's changes, against the record's own events
  const changes = [];
  for (let i = 0; i < n; i++) if (i === 0 || ch.plant.lights[i] !== ch.plant.lights[i - 1]) changes.push({ k: k0 + i, t: (k0 + i) * K.dt, lights: ch.plant.lights[i] });
  const ev = (id) => rec.events.find(e => e.id === id), main = ev('plant:mainDark'), dark = ev('plant:dark');
  const want = [{ k: k0, lights: 1 }].concat(main ? [{ k: main.k, lights: 0.15 }] : [], dark ? [{ k: dark.k, lights: 0 }] : []);
  const same = changes.length === want.length && changes.every((c, j) => c.k === want[j].k && c.lights === want[j].lights);
  row('MUST', 'the plant\'s light level changes where the record\'s own events say the dynamos stopped, and nowhere else', changes.map(c => c.lights + ' from step ' + c.k).join(', '), want.map(c => c.lights + ' from step ' + c.k).join(', '), same);

  // ---- G1: each port's and window's section, from the record by its compartment, side and deck (rooms.js's floors: the
  // deck it stands on; under G deck, "below G"); a navigation light has none
  const RC = rec.readers.circuits, keyAt = new Map((RC ? RC.sections : []).map((s, j) => [s.key, j]));
  const floorOf = (deck) => (deck === null || deck === undefined || deck === 'orlop' ? 'below G' : deck);
  for (const L of lights) {
    L.section = null; L.out = null;
    if (L.kind === 'navigation' || !RC) continue;
    const j = keyAt.get(L.zone + ':' + (L.p[1] >= 0 ? 'P' : 'S') + ':' + floorOf(L.deck));
    if (j !== undefined) { L.section = j; L.out = RC.sections[j].out; }
  }
  const model = C.buildShip(), RT = RM.table(model), placed = [], unplaced = [];
  for (const L of lights) {
    if (L.kind === 'navigation') continue;
    const s = RM.slabAt(model, L.p[0], L.p[1], L.p[2]), want = s >= 0 ? s : null;
    if (L.section !== want) unplaced.push(L.kind + ' ' + L.i + ' (' + (L.section === null ? 'none' : RC.sections[L.section].key) + ' against ' + (want === null ? 'none' : RT.list[want].key) + ')'); else placed.push(L);
  }
  const none = lights.filter(L => L.kind !== 'navigation' && L.section === null).length;
  row('MUST', 'every port and window keyed to its section from the record (its compartment, side and deck): the slab its point lies in, by rooms.js on the model\'s ship', placed.length + ' of ' + (placed.length + unplaced.length) + ' agree' + (none ? '; ' + none + ' in no section' : '') + (unplaced.length ? '; ' + unplaced.length + ' DO NOT: ' + unplaced.slice(0, 3).join('; ') : ''), 'every one', !!RC && unplaced.length === 0 && placed.length > 0);

  // ---- each light's step under the sea: from the record's pose, and from the model run again (with the circuits reader
  // stepped by hand on it: it writes sim.circuits only)
  for (const L of lights) { L.under = null; L.back = 0; let was = false; for (let i = 0; i < n; i++) { const u = zOf(K, ch.zO[i], ch.pitch[i], ch.roll[i], L.p) < 0; if (u && L.under === null) L.under = k0 + i; if (was && !u) L.back++; was = u; } }
  const sim = N.create(C.buildShip(), N.spec(1912), { auto: true, readers: false }), mu = lights.map(() => null);
  CIR.attach(sim, N.spec(1912));
  const ciK = new Int32Array(sim.circuits.sections.length).fill(-1);
  const pz = [], pp = [], pr = [];                          // the model's own pose, every step
  const check = () => {
    pz.push(sim.zO); pp.push(sim.pitch); pr.push(sim.roll); const F = C.frameOf(sim); lights.forEach((L, j) => { if (mu[j] === null && C.worldZ(F, L.p[0], L.p[1], L.p[2]) < 0) mu[j] = sim.night.k; });
    sim.circuits.sections.forEach((s, j) => { if (ciK[j] < 0 && s.out >= 0) ciK[j] = sim.night.k; });
  };
  check();
  while (sim.night.k < rec.end.k) { N.step(sim); CIR.step(sim); check(); }
  const secSteps = !!RC && RC.sections.length === ciK.length && RC.sections.every((s, j) => (s.out === null ? ciK[j] < 0 : s.out === ciK[j]));
  row('MUST', 'every section\'s step in the record (its fuses blown) is the circuits reader\'s own, on the model run again here', RC ? RC.sections.filter(s => s.out !== null).length + ' of ' + RC.sections.length + ' blown by the hand-over' + (secSteps ? ', each on its step' : ', NOT the reader\'s') : 'no circuits in the record', Array.from(ciK).filter(k => k >= 0).length + ' in the model', secSteps);
  // where the two disagree, the light only grazed the sea on the dip that decides it: the model's own depth at the record's
  // step, and the record's at the model's, are both within what writing the pose at fixed decimals moves (zO at 3, the
  // angles at 6: well under a millimetre at her ends). Anything else is a real difference.
  const GRAZE = 0.001;
  let agree = 0, grazed = 0, worst = 0; const real = [];
  lights.forEach((L, j) => {
    if (L.under === mu[j]) { agree++; return; }
    const ks = [L.under, mu[j]].filter(k => k !== null), m = Math.max(...ks.map(k => { const i = k - k0; return Math.max(Math.abs(zOf(K, pz[i], pp[i], pr[i], L.p)), Math.abs(zOf(K, ch.zO[i], ch.pitch[i], ch.roll[i], L.p))); }));
    const d = Math.min(...ks.map(k => { const i = k - k0; return Math.abs(zOf(K, pz[i], pp[i], pr[i], L.p)); }));
    if (d <= GRAZE) { grazed++; if (d > worst) worst = d; } else real.push(L.kind + ' ' + L.i + ' (' + L.under + ' against ' + mu[j] + ', ' + f(m * 1000, 2) + ' mm)');
  });
  row('MUST', 'every light\'s step under the sea, from the record\'s pose by its frames.pose: the model\'s own, run again here', lights.length + ' lights (' + lights.filter(L => L.kind === 'port').length + ' ports, ' + lights.filter(L => L.kind === 'window').length + ' windows, ' + lights.filter(L => L.kind === 'navigation').length + ' navigation): ' + agree + ' to the step, ' + grazed + ' grazing (within ' + f(worst * 1000, 3) + ' mm of the sea on the deciding dip)' + (real.length ? '; ' + real.length + ' REAL: ' + real.slice(0, 3).join('; ') : ''), 'to the step, or a graze within ' + GRAZE * 1000 + ' mm', real.length === 0);

  // ---- the timeline, deck by deck (what a renderer draws)
  const darkK = dark ? dark.k : null, mainK = main ? main.k : null, T = (k) => (k === null ? 'never' : 'T ' + f((k * K.dt - rec.end.summary.tTouch) / 60, 1));
  row('CHECK', 'the plant: the main dynamos stop, then the last ones (T: minutes after the touch)', (mainK === null ? 'no time on the emergency lights alone' : 'the emergency lights alone from ' + T(mainK) + ' (step ' + mainK + ')') + '; dark from ' + T(darkK) + ' (step ' + darkK + ')', 'the record\'s', true);
  const firstOf = (ks) => ks.reduce((m, k) => (k !== null && (m === null || k < m) ? k : m), null), end = darkK === null ? Infinity : darkK;
  for (const deck of ['F', 'E', 'D', 'C', 'B', 'A', 'Boat']) {
    const ls = lights.filter(L => L.deck === deck && L.kind !== 'navigation'); if (!ls.length) continue;
    const outBy = ls.filter(L => L.out !== null && L.out < end), underBy = ls.filter(L => L.under !== null && L.under < end);
    // under the sea and still burning a while: its section dry inside, the plant still lighting her
    const glow = ls.filter(L => L.under !== null && L.under < Math.min(L.out === null ? Infinity : L.out, end));
    row('CHECK', deck + ' deck: ' + ls.length + ' lights', outBy.length + ' put out by their sections\' fuses ' + (darkK === null ? 'by the hand-over, where she was still lit' : 'before she went dark') + ' (the first at ' + T(firstOf(outBy.map(L => L.out))) + '); ' + underBy.length + ' under the sea by then (the first at ' + T(firstOf(underBy.map(L => L.under))) + '), ' + glow.length + ' of them burning a while under it' + (ls.some(L => L.back) ? '; ' + ls.filter(L => L.back).length + ' rise again' : ''), 'the record\'s', true);
  }
  // ---- the file
  const obj = {
    format: 'titanic-u3-lights', version: 2,
    about: 'Each light of the export (lights.ports.list[i], topsides.windows.list[i], lights.navigation[i]) with its compartment, deck and ship point; under: the step it first goes under the sea (null: never, to the hand-over), from the record\'s pose; back: how many times it came up again; section: its section in the record (readers.circuits.sections[section]; G1, core/readers/circuits.js; null: none, as her navigation lights); out: the step its section\'s fuses blew (null: they held to the hand-over). The plant\'s level (1, 0.15, 0) from the steps in plant. A light burns at the plant\'s level until its out step [appearance: the viewer fades each change over 3 s]; the sea outside it does not put it out (version 1 did): under is for its look. Made by tools/u3_lights.js from the record alone; the model agrees to the step.',
    from: { night: rec.night.title, fingerprint: rec.end.fingerprint, sources: rec.made.sources, ship: ship.made.sources['tools/export_ship.js'] },
    dt: K.dt, plant: changes.map(c => ({ k: c.k, lights: c.lights })),
    lights: lights.map(L => ({ kind: L.kind, i: L.i, id: L.id, zone: L.zone, deck: L.deck, p: L.p, under: L.under, back: L.back, section: L.section, out: L.out })),
  };
  const text = J.text(obj);
  fs.writeFileSync(outFile('u3_lights.json'), text);
  rows.push(['INFO', 'u3_lights.json: ' + lights.length + ' lights, ' + changes.length + ' plant levels', Buffer.byteLength(text) + ' bytes', 'sha256 ' + J.sha256(text).slice(0, 16), true]);
} catch (e) {
  row('MUST', 'the tool ran', String(e && e.stack || e).split('\n').slice(0, 2).join(' '), 'no error', false);
}
for (const [kind, what, value, ref, ok] of rows) {
  if (kind === 'INFO') { console.log('       ' + what.padEnd(100) + ' ' + String(value).padEnd(60) + ' ' + ref); continue; }
  console.log((ok ? 'PASS ' : (kind === 'MUST' ? 'FAIL ' : 'CHECK ')) + kind.padEnd(6) + what.padEnd(100) + ' ' + String(value).padEnd(60) + ' ' + ref);
}
console.log(fails ? '\nFAIL: ' + fails + ' MUST row(s)' : '\nPASS: all ' + rows.filter(r => r[0] === 'MUST').length + ' MUST rows');
process.exit(fails ? 1 : 0);
