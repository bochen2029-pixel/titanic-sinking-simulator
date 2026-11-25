// Her strength along her length, and the onset of the break (core/readers/section.js and core/readers/onset.js: stages
// B1 and B2 of docs/DESIGN_the_break_and_two_bodies_v1_2026-11-19.md).
//   node tools/strength_tests.js        (about four minutes on a quiet machine)
// MUST rows: the section's elastic properties amidships are the Marine Forensics Panel's; its ultimate hogging moment
// amidships lies in the studies' range, 4.0 to 5.4 GN m, untuned (if it does not, that is the finding: the row fails and
// nothing is adjusted to pass it); a stronger hull is never weaker; the onset breaks nothing (a run and a watch are the
// same bits with it and without); a hull stronger than any load has no onset; the four-compartment case has none; a
// stronger hull never breaks sooner; the reader's schedule finds the step looking every step finds.
// CHECK rows: the record, each with its reference; a miss is information, not a failure.
// The tables come first: the section amidships, element by element; Smith's curve there; her strength every 10 m with
// the demand at the onset beside it; the onset on the 1912 damage preset, free and with her list held (a what-if: the
// model's roll to 80 degrees in her last minutes is a known fault, docs/BRAINSTORM_the_descent_to_the_bed_v2, 1.3).
// Lines that start with "~ " are timings: tools/gate.js passes over them when it compares this output with the table.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const C = require('../core/core.js');
const SC = require('../core/scenarios.js');
const N = require('../core/night.js');
const G = require('../core/readers/girder.js');
const S = require('../core/readers/section.js');
const O = require('../core/readers/onset.js');
const ship = C.buildShip(), GN = 1e9, IN = 0.0254;
const rows = []; let fails = 0;
function row(kind, what, value, ref, ok) { rows.push([kind, what, value, ref, ok]); if (kind === 'MUST' && !ok) fails++; }
const f = (x, n) => (x === null || x === undefined || !isFinite(x) ? 'n/a' : x.toFixed(n === undefined ? 2 : n));
const gn = (x) => f(x / GN, 3);
const clock = (Tmin) => { let s = Math.round((23 * 60 + 40 + Tmin) * 60) % 86400; const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); s %= 60; return (h % 12 || 12) + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + (h < 12 ? ' am' : ' pm'); };
const out = [];
const say = (s) => out.push(s === undefined ? '' : s);
const t0 = Date.now();
// the Marine Forensics Panel's midship section (Mengot and Woytowich 2010): neutral axis 398 in, moduli 1.86e6 in3 at B
// deck and 2.23e6 in3 at the keel [search summary, in the girder note, section 3]
const PANEL = { zNA: 398 * IN, Zdeck: 1.86e6 * Math.pow(IN, 3), Zkeel: 2.23e6 * Math.pow(IN, 3) };
const RANGE = [G.CAP.low, G.CAP.high];          // the studies' range of what her hull could bear, 4.0 to 5.4 GN m
// the design's test 6 [the girder note, 9c and 9d]. T is the witnesses' band, the mainline's ruling of 2026-11-24 (2:15
// to 2:19:40): in place of T 157 to 158.6, whose ends were the model's own event list and a computed collapse
const RECORD = { x: [-27, -16], T: [155, 159.7], trim: [10, 17] };

// ---------------------------------------------------------------- 1. the section amidships
const X0 = 0;
const els0 = S.elements(ship, X0), el0 = S.elastic(els0);
{
  say('THE SECTION AMIDSHIPS (x 0, ' + S.where(X0) + '; core/readers/section.js): elements by kind, port and starboard together');
  say('  kind        n   area m2  centroid m  t in      tension MPa  compression MPa (law)   source');
  const kinds = [];
  for (const e of els0) { let k = kinds.find(q => q.kind === e.kind && q.name.replace(/ \d+$/, '') === e.name.replace(/ \d+$/, '') && q.sT === e.sT && q.sC === e.sC); if (!k) { k = { kind: e.kind, name: e.name.replace(/ \d+$/, ''), n: 0, A: 0, Az: 0, t: e.t, sT: e.sT, sC: e.sC, cLaw: e.cLaw }; kinds.push(k); } k.n++; k.A += e.A; k.Az += e.A * e.z; }
  const tagOf = (k) => {
    const T = S.SCANT;
    if (k.name === 'keel bar') return T.keelBar.tag;
    if (k.name === 'keel plate') return T.keelPlate.tag + '; lapped butts limit it in compression (the panel) [read]';
    if (k.kind === 'tanktop') return T.tankTop.tag + '; ' + T.db.tag + '; triple-riveted butts (the panel) [search summary]';
    if (/centre/.test(k.name)) return T.centreGirder.tag;
    if (/margin/.test(k.name)) return T.margin.tag;
    if (k.kind === 'girder') return T.sideGirders.tag;
    if (k.kind === 'sheer') return T.sheerDouble.tag;
    if (/bilge strake/.test(k.name)) return T.bilgeDouble.tag;
    if (k.kind === 'bottom' || k.kind === 'bilge') return 'bottom 1 in amidships (Mengot) [read]; lapped quadruple-riveted butts limit it in compression [search summary; the panel\'s argument]; frames 36 in [read]';
    if (k.kind === 'side') return 'side 1 in amidships (Wilding) [read]; double-strapped butts [search summary]; frames 36 in [read]; a deck\'s height between supports [derived]';
    if (/angle/.test(k.name)) return T.sheerDouble.tag;
    if (/^[BC] deck/.test(k.name)) return T.strong.tag + (/^C/.test(k.name) ? ' (C x ' + S.FIT.cDeck + ')' : '') + '; beams on every frame, four lines of girders (Walker) [read]';
    return '';
  };
  for (const k of kinds) say('  ' + k.name.padEnd(24) + String(k.n).padStart(3) + f(k.A, 4).padStart(10) + f(k.Az / k.A, 2).padStart(11) + f(k.t / IN, 3).padStart(8) + f(k.sT / 1e6, 0).padStart(13) + (f(k.sC / 1e6, 0) + ' (' + k.cLaw + ')').padStart(18) + '   ' + tagOf(k));
  say('  joints in tension (on the gross area): quadruple-riveted or double-strapped ' + f(S.JOINT.quad * S.MAT.base / 1e6, 1) + ' MPa (Paik et al.\'s 0.626 x 245) [read]; triple ' + f(S.JOINT.triple * S.MAT.base / 1e6, 1) + ' MPa and double ' + f(S.JOINT.double * S.MAT.base / 1e6, 1) + ' MPa (the panel\'s 42 and 28 %) [search summary]; yield ' + f(S.MAT.sY / 1e6, 0) + ' MPa [read: NIST, the lower]');
  say('  deck openings across her: ' + S.OPENINGS.map(o => o.name + ' ' + f(o.w, 2) + ' m over x ' + f(o.x0, 1) + ' to ' + f(o.x1, 1) + ' (' + o.decks.join('') + ') ' + o.tag).join('; '));
  say('  out of the section: ' + S.SCANT.lower.tag + '; the superstructure above B deck (1/4 in on light studs, two expansion joints) [read]');
  say();
  // the section as the sources and the bets give it (C deck as B), against the panel; then the one figure fitted to it
  const P3 = (el) => [el.zNA / PANEL.zNA - 1, el.Zdeck / PANEL.Zdeck - 1, el.Zkeel / PANEL.Zkeel - 1];
  const ss = (c) => { const e = P3(S.elastic(S.elements(ship, X0, { fit: { cDeck: c } }))); return e[0] * e[0] + e[1] * e[1] + e[2] * e[2]; };
  let lo = 0.5, hi = 1.5; { const g = (Math.sqrt(5) - 1) / 2; let x1 = hi - g * (hi - lo), x2 = lo + g * (hi - lo), f1 = ss(x1), f2 = ss(x2);
    for (let i = 0; i < 60; i++) { if (f1 < f2) { hi = x2; x2 = x1; f2 = f1; x1 = hi - g * (hi - lo); f1 = ss(x1); } else { lo = x1; x1 = x2; f1 = f2; x2 = lo + g * (hi - lo); f2 = ss(x2); } } }
  const refit = 0.5 * (lo + hi), found = S.elastic(S.elements(ship, X0, { fit: { cDeck: 1 } }));
  const line = (name, el) => '  ' + name.padEnd(34) + 'area ' + f(el.A, 3) + ' m2; neutral axis ' + f(el.zNA, 3) + ' m (' + (el.zNA >= PANEL.zNA ? '+' : '') + f(el.zNA - PANEL.zNA, 2) + '); I ' + f(el.I, 1) + ' m4; Z ' + f(el.Zdeck, 2) + ' m3 at the strength deck (' + f(el.zDeck, 2) + ' m; ' + (el.Zdeck >= PANEL.Zdeck ? '+' : '') + f(100 * (el.Zdeck / PANEL.Zdeck - 1), 1) + ' %); Z ' + f(el.Zkeel, 2) + ' m3 at the keel (' + (el.Zkeel >= PANEL.Zkeel ? '+' : '') + f(100 * (el.Zkeel / PANEL.Zkeel - 1), 1) + ' %)';
  say('THE ELASTIC SECTION AMIDSHIPS against the Marine Forensics Panel\'s: neutral axis ' + f(PANEL.zNA, 3) + ' m (398 in); Z ' + f(PANEL.Zdeck, 2) + ' m3 at B deck; Z ' + f(PANEL.Zkeel, 2) + ' m3 at the keel; I ' + f(PANEL.Zkeel * PANEL.zNA, 1) + ' m4; its deck ' + f(PANEL.zNA + PANEL.Zkeel * PANEL.zNA / PANEL.Zdeck, 2) + ' m up [search summary; SI derived]');
  say(line('as found (C deck as B):', found));
  say(line('fitted (C deck x ' + f(S.FIT.cDeck, 3) + '):', el0));
  say('  the fit: C deck\'s plating as a share of B\'s, least squares on the three relative errors, bounds 0.5 to 1.5 set beforehand: ' + f(refit, 4) + ' (the library: ' + S.FIT.cDeck + '); it makes these three rows a fit with one parameter, two figures left to check');
  say();
  const dD = el0.Zdeck / PANEL.Zdeck - 1, dK = el0.Zkeel / PANEL.Zkeel - 1, dN = el0.zNA - PANEL.zNA;
  row('MUST', 'the section amidships (C deck fitted): its elastic modulus at B deck is the panel\'s', f(el0.Zdeck, 2) + ' m3 (' + (dD >= 0 ? '+' : '') + f(100 * dD, 1) + ' %); as found ' + f(found.Zdeck, 2), '30.5 m3 (1.86e6 in3), within 5 %', Math.abs(dD) <= 0.05);
  row('MUST', '  ... and at the keel', f(el0.Zkeel, 2) + ' m3 (' + (dK >= 0 ? '+' : '') + f(100 * dK, 1) + ' %); as found ' + f(found.Zkeel, 2), '36.5 m3 (2.23e6 in3), within 5 %', Math.abs(dK) <= 0.05);
  row('MUST', '  ... and its neutral axis', f(el0.zNA, 3) + ' m above the keel (' + (dN >= 0 ? '+' : '') + f(dN, 2) + ' m); as found ' + f(found.zNA, 3), '10.11 m (398 in), within 0.3 m', Math.abs(dN) <= 0.3);
  row('MUST', '  ... and the library\'s fitted figure is this refit\'s', 'C deck x ' + f(refit, 4) + ', inside its bounds', 'FIT.cDeck ' + S.FIT.cDeck + ', to 0.001; bounds 0.5 to 1.5', Math.abs(refit - S.FIT.cDeck) <= 0.001 && refit > 0.5 + 1e-3 && refit < 1.5 - 1e-3);
}

// ---------------------------------------------------------------- 2. Smith's curve amidships
const hog0 = S.curve(ship, X0, 'hog'), sag0 = S.curve(ship, X0, 'sag');
{
  say('SMITH\'S CURVE AMIDSHIPS: the moment against curvature (in yield curvatures, ky = ' + hog0.ky.toExponential(3) + ' 1/m), and the elements gone (past their peak) at each');
  for (const [name, c] of [['hogging', hog0], ['sagging', sag0]]) {
    say('  ' + name + ':   k/ky   M GN m   neutral axis m   gone');
    const els = S.elements(ship, X0), sg = c.sense === 'sag' ? -1 : 1;
    let lastGone = '';
    for (let i = 0; i < c.k.length; i += (c.k[i] / c.ky < 2.5 ? 6 : 18)) {
      const gone = els.filter(e => { const eps = sg * c.k[i] * (e.z - c.zNA[i]); return eps >= 0 ? eps > e.sT / S.MAT.E + S.EPS_SLIP : (-eps > e.sC / S.MAT.E && e.cLaw !== 'yield'); }).map(e => e.name);
      const names = [...new Set(gone)].join(', '), shown = names === lastGone ? '"' : names; lastGone = names;
      say('  ' + f(c.k[i] / c.ky, 2).padStart(16) + gn(c.M[i]).padStart(9) + f(c.zNA[i], 2).padStart(16) + '   ' + shown);
    }
    say('  ' + name + ': Mu ' + gn(c.Mu) + ' GN m at k/ky ' + f(c.kU / c.ky, 3) + ', the neutral axis then at ' + f(c.zU, 2) + ' m; the first to fail: ' + (c.first ? c.first.name + ' (' + (c.first.tension ? 'in tension' : 'in compression') + ', at ' + f(c.first.z, 2) + ' m)' : 'none') + '; gone at the peak: ' + [...new Set(c.gone)].join(', '));
  }
  // which side of the neutral axis the first element to fail lies on, and how it failed
  const side = (c) => c.first ? (c.first.z > c.el.zNA ? 'the deck side' : 'the bottom side') + ' (' + c.first.name + ', in ' + (c.first.tension ? 'tension' : 'compression') + ')' : 'none';
  say('  which side fails first amidships: hogging ' + side(hog0) + '; sagging ' + side(sag0));
  say();
  row('MUST', 'THE FINDING: the ultimate hogging moment amidships, untuned, lies in the studies\' range', gn(hog0.Mu) + ' GN m (sagging ' + gn(sag0.Mu) + '); the first to fail: ' + (hog0.first ? hog0.first.name : 'none'),
    '4.0 to 5.4 GN m (the girder note, 9b); nothing in the section was set to land in it', hog0.Mu >= RANGE[0] && hog0.Mu <= RANGE[1]);
  const kEnd = hog0.k.length - 1;
  row('MUST', '  ... and the curve falls past its peak (the falling branch, kept for the hinge of stage B4)', 'at ' + f(hog0.k[kEnd] / hog0.ky, 1) + ' ky: ' + gn(hog0.M[kEnd]) + ' GN m hogging, ' + gn(sag0.M[sag0.k.length - 1]) + ' sagging', 'below the peak in both senses', hog0.M[kEnd] < hog0.Mu && sag0.M[sag0.k.length - 1] < sag0.Mu);
}

// ---------------------------------------------------------------- 3. a stronger hull is never weaker
{
  const scales = [1, 1.05, 1.1, 1.25, 1.5, 2], xs = [0, -16.15, -22.4, -25.1, -30, -60, 60];
  let worst = null, ok = true;
  for (const x of xs) {
    let prev = null;
    for (const s of scales) {
      const a = S.at(ship, x, { scale: s });
      if (prev) for (const sense of ['hog', 'sag']) { const d = a[sense].Mu - prev[sense].Mu; if (d < 0) { ok = false; if (!worst || d < worst.d) worst = { x, s, sense, d }; } }
      prev = a;
    }
  }
  // and each strength alone: the yield, the joints, the plates' buckling, one at a time
  const one = [['the yield 280 MPa', { sY: 280e6 }], ['the joints at Stoney\'s period strengths (quadruple 75 % of 430 MPa, double 60 %)', { eta: { quad: 0.75 * 430 / 245, double: 0.60 * 430 / 245 } }], ['the plates\' edges held from turning (k x 4)', { buckle: 'clamped' }]];
  const base = S.at(ship, 0);
  const lines = one.map(([n, o]) => { const a = S.at(ship, 0, o); if (a.hog.Mu < base.hog.Mu - 1 || a.sag.Mu < base.sag.Mu - 1) ok = false; return n + ': hog ' + gn(a.hog.Mu) + ', sag ' + gn(a.sag.Mu) + ' (first ' + (a.hog.first ? a.hog.first.name : '-') + ')'; });
  say('WHAT THE CHOICES DO TO THE ULTIMATE MOMENT AMIDSHIPS (what-ifs; none is used): the library hog ' + gn(base.hog.Mu) + ', sag ' + gn(base.sag.Mu) + ' GN m');
  say('  each stronger (the monotonicity row below uses these):');
  for (const l of lines) say('    ' + l);
  const other = [['the section as found, C deck as B (not fitted)', { fit: { cDeck: 1 } }], ['D, E and F decks in at 1/2 in, double-riveted', { lowerDecks: true }], ['the tank top 1/2 in (Mengot: about half the shell)', { tankTop: 0.5 }], ['her yield 245 MPa (Paik et al.\'s base)', { sY: 245e6 }]];
  say('  and others:');
  for (const [n, o] of other) { const a = S.at(ship, 0, o); say('    ' + n + ': hog ' + gn(a.hog.Mu) + ', sag ' + gn(a.sag.Mu) + ' (first ' + (a.hog.first ? a.hog.first.name : '-') + '); neutral axis ' + f(a.el.zNA, 2) + ' m, Z ' + f(a.el.Zdeck, 1) + ' and ' + f(a.el.Zkeel, 1) + ' m3'); }
  say();
  row('MUST', 'raising every element\'s strength never lowers the ultimate moment (x 1 to 2, seven stations, both senses; and each strength alone)', ok ? 'never lower' : 'LOWER at x ' + f(worst.x, 1) + ', scale ' + worst.s + ', ' + worst.sense + ' by ' + gn(worst.d) + ' GN m', 'never lower', ok);
}

// ---------------------------------------------------------------- 4. the 1912 damage preset: the onset, every step and on the schedule
const golden = path.join(__dirname, '..', 'out', 'golden_titanic.json');
function run1912(o) {
  o = o || {};
  const sim = C.createSim(ship, {}, SC.PRESETS.titanic.build());
  if (o.held) sim.Iph0 = 1e30;                    // what-if: her list held where it starts (as e40 held it)
  const rec = [], h = crypto.createHash('sha256');
  const sample = () => rec.push({ t: sim.t, zO: sim.zO, pitch: sim.pitch, roll: sim.roll, vz: sim.vz, wth: sim.wth, wph: sim.wph, inflow: sim.inflow, Vb: sim.Vb, vol: Array.from(sim.vol) });
  const state = () => { for (const a of [sim.vol, sim.level, sim.cx, sim.cy, sim.cz, sim.area, sim.zmin, sim.zmax, sim.merged, sim.pump]) h.update(Buffer.from(a.buffer, a.byteOffset, a.byteLength)); h.update(Buffer.from(new Float64Array([sim.t, sim.zO, sim.pitch, sim.roll, sim.vz, sim.wth, sim.wph, sim.inflow, sim.Vb, sim.mw, sim.hullTop, sim.pumped, sim.events.length]).buffer)); };
  const every = o.look ? O.start({ every: true, section: o.section }) : null, sched = o.look ? O.start({ section: o.section }) : null;
  let prevU = null, du = { before: 0, after: 0 }, onsetRes = null;
  // the growth of u in each step, counted "up to the onset" for every step until the onset's own, the step that carries
  // u past 1 included (all a look's schedule relies on: once the onset is found the reader looks no more), and "after"
  // for the steps past it
  const look = () => {
    if (!o.look) return;
    const wasFound = !!every.found;
    O.look(sim, sched);
    if (!every.found) { O.look(sim, every); if (every.found) onsetRes = O.check(sim, { section: o.section, all: true }); }
    if (o.growth) { const u = O.check(sim, { section: o.section }).best.u; if (prevU !== null) { const d = u - prevU; if (wasFound) du.after = Math.max(du.after, d); else du.before = Math.max(du.before, d); } prevU = u; }
  };
  sample(); let next = 60;
  look();
  while (!sim.foundered && sim.t < 5 * 3600) {
    C.step(sim);
    look();
    state();
    if (sim.t >= next - 1e-9) { sample(); next += 60; }
  }
  const g = { params: sim.params, openings: sim.openings.map(q => ({ x: q.x, y: q.y, z: q.z, area: q.area, kind: q.kind })),
    dt: sim.params.dt, columns: ship.cols.N, entries: ship.entCol.length, connections: sim.conn.n,
    ms: sim.ms, KG: sim.KG, foundered: sim.foundered, founderT: sim.founderT, events: sim.events, trace: rec };
  return { sim, json: JSON.stringify(g), digest: h.digest('hex'), every, sched, du, onsetRes };
}
const bare = run1912({}), free = run1912({ look: true, growth: true }), held = run1912({ look: true, held: true, growth: true });
const strong = run1912({ look: true, section: { scale: 10 } });
const tracked = fs.existsSync(golden) ? fs.readFileSync(golden, 'utf8') : null;
const fd = (st) => st.found;
{
  const F = fd(free.every), H = fd(held.every);
  const line = (label, r) => { const q = r.every.found; return q ? '  ' + label.padEnd(30) + 'T ' + f(q.T, 2) + ' min (' + clock(q.T) + '), step ' + q.k + '; x ' + f(q.x, 2) + ' m, ' + q.where + '; ' + q.sense + ' ' + gn(q.M) + ' of ' + gn(q.Mu) + ' GN m; shear ' + f(q.V / 1e6, 1) + ' of ' + f(q.Vu / 1e6, 0) + ' MN; (M/Mu)^2 + (V/Vu)^2 = ' + f(q.r, 4) + '; trim ' + f(q.trimDeg, 2) + ' deg, list ' + f(Math.abs(q.listDeg), 1) + ' deg to ' + (q.listDeg < 0 ? 'port' : 'starboard') : '  ' + label.padEnd(30) + 'no onset: founders at T ' + f(r.sim.founderT / 60, 2) + '; closest (M/Mu)^2 + (V/Vu)^2 ' + f(r.sched.peak.r, 3) + ' at x ' + f(r.sched.peak.x, 1); };
  say('THE ONSET ON THE 1912 DAMAGE PRESET (core/scenarios.js "titanic"): the first step where (M/Mu)^2 + (V/Vu)^2 reaches 1 somewhere along her');
  say(line('as the model is (list free):', free));
  say(line('what-if, her list held:', held));
  say('  the record: the break at x -16 to -27 m (boiler room 1, between the third and fourth funnels), T 155 to 159.7 min (2:15 to 2:19:40 am), trim 10 to 17 deg, list about 10 deg to port (Mengot) [the girder note, 1.3, 9c, 9d]');
  say('    its time is the witnesses\' (the mainline\'s ruling, 2026-11-24): Joughin\'s watch read 2:15 with her lights still burning (BI 6359-6363); she was gone at 2:20 (the Report; Pitman\'s own watch, US Inquiry, Day 4),');
  say('    less the stern\'s shortest stand, 20 s (Etches), with the lights going out at about 2:17 its centre. It was T 157 to 158.6: the model\'s own event list and a computed collapse, not observations');
  // her list at the onset, as the tree gives it: the record has about 10 degrees to port; far past that (here over 20) it
  // is the model's list in her last minutes, a known gap (its cause is a matter for the core, not stated here)
  if (F) say('  NOTE: as the model is, at that moment she is lying ' + f(Math.abs(F.listDeg), 1) + ' degrees over to ' + (F.listDeg < 0 ? 'port' : 'starboard') + ' (the record: about 10 to port)' +
    (Math.abs(F.listDeg) > 20 ? ': far past the record, the model\'s list in her last minutes is a known gap; the list-held line is the what-if beside it' : ''));
  say();
  const inX = (q) => q && q.x >= RECORD.x[0] && q.x <= RECORD.x[1], inT = (q) => q && q.T >= RECORD.T[0] && q.T <= RECORD.T[1], inTrim = (q) => q && q.trimDeg >= RECORD.trim[0] && q.trimDeg <= RECORD.trim[1];
  const both = (g) => 'free: ' + (F ? g(F) : 'none') + '; list held: ' + (H ? g(H) : 'none');
  row('CHECK', 'the 1912 preset\'s onset: where', both(q => 'x ' + f(q.x, 2) + ' (' + q.where + ')'), 'the record: x -16 to -27 m (the girder note, 9c)', inX(F));
  row('CHECK', '  ... when', both(q => 'T ' + f(q.T, 2) + ' (' + clock(q.T) + ')'), 'the record: T 155 to 159.7 min (the witnesses)', inT(F));
  row('CHECK', '  ... at what trim', both(q => f(q.trimDeg, 2) + ' deg, list ' + f(Math.abs(q.listDeg), 1) + ' deg'), 'the record: 10 to 17 deg by the head (list about 10 to port)', inTrim(F));
  row('CHECK', '  ... and the same three with her list held (a what-if)', H ? 'x ' + f(H.x, 2) + ', T ' + f(H.T, 2) + ', trim ' + f(H.trimDeg, 2) : 'none', 'the record\'s three bands', inX(H) && inT(H) && inTrim(H));
  row('MUST', 'the reader\'s schedule finds the step that looking every step finds (free and list held)', 'free: step ' + (F ? F.k : 'none') + ' in ' + free.sched.looks + ' looks (' + (fd(free.sched) ? 'step ' + fd(free.sched).k + ', exact ' + fd(free.sched).exact : 'none') + '); held: ' + (H ? H.k : 'none') + ' in ' + held.sched.looks + ' looks (' + (fd(held.sched) ? 'step ' + fd(held.sched).k : 'none') + ')',
    'the same step, marked exact; looking every step ' + (F ? F.k : '-') + ' and ' + (H ? H.k : '-') + ' times', !!F && !!fd(free.sched) && fd(free.sched).k === F.k && fd(free.sched).exact && !!H && !!fd(held.sched) && fd(held.sched).k === H.k && fd(held.sched).exact);
  // The schedule needs a bound only up to the onset: a look's gap is set from u and RATE, and once the onset is found the
  // reader looks no more, so growth after it can never make a look miss it. After it u may grow fast (on the model with
  // the tiers above B deck, 0.016 a step as she accelerates into the plunge): printed, not judged.
  row('MUST', '  ... because up to the onset, u = sqrt(r) never grows faster in a step than the schedule allows (RATE)', 'the fastest up to the onset: ' + f(free.du.before, 5) + ' a step free, ' + f(held.du.before, 5) + ' held; after it (not used by the schedule) ' + f(free.du.after, 5) + ' and ' + f(held.du.after, 5),
    'under RATE ' + O.RATE + ' [stated]', Math.max(free.du.before, held.du.before) < O.RATE);
  row('MUST', 'the onset breaks nothing: the 1912 preset looked at every step to its end is the same bits as without', 'state ' + free.digest.slice(0, 16) + ' (onset found at step ' + (F ? F.k : '-') + '); founders ' + f(free.sim.founderT / 60, 2) + ' min; events ' + free.sim.events.length,
    'without: ' + bare.digest.slice(0, 16) + ', ' + f(bare.sim.founderT / 60, 2) + ' min, ' + bare.sim.events.length + ' events', free.digest === bare.digest && free.sim.founderT === bare.sim.founderT && free.json === bare.json);
  row('MUST', 'a hull stronger than any load (every strength x 10) has no onset, and its run is to the bit of today\'s', (fd(strong.every) ? 'ONSET at step ' + fd(strong.every).k : 'no onset') + ' (closest ' + f(strong.sched.peak.r, 4) + '); the trace ' + (strong.json === tracked ? 'identical to' : 'DIFFERS from') + ' out/golden_titanic.json; state ' + strong.digest.slice(0, 16),
    'none; the tracked golden trace (tools/golden.js), and the bare run\'s state ' + bare.digest.slice(0, 16), !fd(strong.every) && !fd(strong.sched) && tracked !== null && strong.json === tracked && strong.digest === bare.digest);
}

// ---------------------------------------------------------------- 5. along her: strength every 10 m, the demand at the onset beside it
{
  const F = fd(free.every), res = free.onsetRes ? free.onsetRes.res : null;
  say('HER STRENGTH ALONG HER LENGTH (every 10 m, and the break band\'s named stations), with the demand at the onset (the 1912 preset, list free, T ' + (F ? f(F.T, 2) : '-') + ')');
  say('      x m  where                           Mu hog   Mu sag   Vu MN   Z deck  Z keel   first to fail, hogging              | at the onset: M GN m   V MN   (M/Mu)^2+(V/Vu)^2');
  const xs = []; for (let x = -130; x <= 130; x += 10) xs.push(x);
  xs.push(G.BAND[0], -25.1, -22.4, G.BAND[1]); xs.sort((a, b) => a - b);
  for (const x of xs) {
    const a = S.at(ship, x);
    if (a.none) { say('  ' + f(x, 1).padStart(7) + '  ' + a.where.padEnd(30) + '  (no section)'); continue; }
    const d = res ? res.at(x) : null, Mu = d && d.M < 0 ? a.sag.Mu : a.hog.Mu, r = d ? Math.pow(d.M / Mu, 2) + Math.pow(d.V / a.Vu, 2) : null;
    const first = a.hog.first ? a.hog.first.name + (a.hog.first.z > a.el.zNA ? ' (deck side, ' : ' (bottom side, ') + (a.hog.first.tension ? 'tension)' : 'compression)') : '-';
    say('  ' + f(x, 1).padStart(7) + '  ' + a.where.padEnd(30) + gn(a.hog.Mu).padStart(7) + gn(a.sag.Mu).padStart(9) + f(a.Vu / 1e6, 0).padStart(8) + f(a.el.Zdeck, 1).padStart(9) + f(a.el.Zkeel, 1).padStart(8) + '   ' + first.padEnd(34) + '|' + (d ? gn(d.M).padStart(20) + f(d.V / 1e6, 1).padStart(8) + f(r, 3).padStart(12) : ''));
  }
  // the weakest station in hogging along the midbody, and in the band
  let wk = null, wb = null;
  for (const x of res ? Array.from(res.hull.x) : []) { const a = S.at(ship, x); if (a.none || Math.abs(x) > 60) continue; if (!wk || a.hog.Mu < wk.Mu) wk = { x, Mu: a.hog.Mu, where: a.where }; }
  for (const x of Array.from(G.shipData(ship).band)) { const a = S.at(ship, x); if (!wb || a.hog.Mu < wb.Mu) wb = { x, Mu: a.hog.Mu, where: a.where }; }
  say('  the weakest station in hogging between x -60 and +60: x ' + (wk ? f(wk.x, 2) + ' (' + wk.where + '), ' + gn(wk.Mu) : '-') + ' GN m; in the break band (K to J): x ' + (wb ? f(wb.x, 2) + ' (' + wb.where + '), ' + gn(wb.Mu) : '-') + ' GN m');
  say();
  // the torn zone's start: every station's ratio at the onset's step (check with { all: true }), and found.over
  const oR = free.onsetRes;
  if (F && oR && oR.all) {
    const top = oR.all.slice().sort((a, b) => b.r - a.r).slice(0, 5), mx = oR.all.reduce((q, s) => Math.max(q, s.r), 0);
    say('  every station at the onset\'s step (check with { all: true }): ' + oR.all.length + ' stations; the five nearest to failing: ' + top.map(s => 'x ' + f(s.x, 2) + ' ' + f(s.r, 3)).join(', ') + '; at or past 1 (found.over): ' + F.over.map(x => f(x, 2)).join(', '));
    say();
    row('MUST', 'every station\'s ratio at the onset\'s step: the worst is the onset\'s own, and found.over holds it', oR.all.length + ' stations; the largest ' + f(mx, 4) + ' at x ' + f(top[0].x, 2) + '; found.over ' + F.over.map(x => f(x, 2)).join(', '),
      'the largest = the onset\'s r (' + f(F.r, 4) + ') at its station; its station first in found.over', Math.abs(mx - F.r) <= 1e-12 * F.r && top[0].x === F.x && F.over.length >= 1 && F.over[0] === F.x && oR.over.length === F.over.length);
  }
}

// ---------------------------------------------------------------- 5b. the hinge: stage B4's law, from B1's falling branch
{
  const F = fd(free.every), DEG = 180 / Math.PI;
  const xH = F ? F.x : -16.15, sense = F && F.sense === 'sagging' ? 'sag' : 'hog';
  const h = S.hinge(ship, xH, sense), a0 = S.at(ship, xH);
  say('THE HINGE (core/readers/section.js hinge(): stage B4\'s law from B1\'s falling branch) at the onset\'s station, x ' + f(xH, 2) + ' (' + h.where + '), ' + h.sense + '; Lh ' + f(h.Lh, 1) + ' m [bet: about the girder\'s depth]');
  say('  theta: the angle between the two parts, positive as the side that failed opens, about her own y axis through (x, zNA). Release (the free body\'s): when the force across the joint passes Nt (tension) or Vs (shear)');
  say('   theta deg      M GN m   dM/dtheta GN m/rad   torn c  past c   W MJ   zNA m   Nt MN   Vs MN   open m2: port below, above, stbd below, above');
  for (const d of [0, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20]) {
    const a = h.at(d / DEG);
    say('  ' + f(d, 3).padStart(8) + gn(a.M).padStart(12) + f(a.dM / GN, 1).padStart(20) + f(a.c, 3).padStart(9) + f(a.cPast, 3).padStart(8) + f(a.W / 1e6, 2).padStart(8) + f(a.zNA, 2).padStart(8) + f(a.Nt / 1e6, 0).padStart(8) + f(a.Vs / 1e6, 0).padStart(8) + '   ' + a.open.map(v => f(v, 2)).join(', ') + (a.beyond ? '  (past the curve: the parts turning as rigid bodies)' : ''));
  }
  say('  the tear\'s top: c reaches ' + f(h.cTop, 3) + ' at theta ' + f(h.thetaTop * DEG, 3) + ' deg; past that only the ligament holds, ' + f(h.at(h.thetaTop).Nt / 1e6, 0) + ' MN in tension (' + f(h.at(h.thetaTop).Nt / 9.81e3, 0) + ' t) and ' + f(h.at(h.thetaTop).Vs / 1e6, 0) + ' MN in shear (' + f(h.at(h.thetaTop).Vs / 9.81e3, 0) + ' t); the work to there ' + f(h.at(h.thetaTop).W / 1e6, 2) + ' MJ');
  say('  after its peak the moment is ' + (h.monotone ? 'monotone' : 'monotone but for a rise of ' + f(h.rise / 1e6, 2) + ' MN m (' + f(100 * h.rise / h.Mu, 4) + ' % of Mu) in its residual tail'));
  const wh = [['a web frame\'s spacing in the boiler rooms, 9 ft', 9 * 0.3048], ['a frame\'s spacing, 36 in', 0.9144]].map(([n, Lh]) => { const q = S.hinge(ship, xH, sense, { Lh }); return n + ' (Lh ' + f(Lh, 2) + ' m): the tear\'s top at ' + f(q.thetaTop * DEG, 3) + ' deg, the work to there ' + f(q.at(q.thetaTop).W / 1e6, 2) + ' MJ'; });
  say('  what-ifs on Lh: ' + wh.join('; '));
  if (F) {
    let thV = null; for (let i = 0; i < h.n; i++) if (h.Vs[i] < Math.abs(F.V)) { thV = h.theta[i]; break; }
    say('  the joint\'s shear at the onset, from the gauge: ' + f(Math.abs(F.V) / 1e6, 1) + ' MN; the ligament\'s shear falls below it ' + (thV === null ? 'nowhere on the curve (to ' + f(h.thetaEnd * DEG, 2) + ' deg)' : 'at theta ' + f(thV * DEG, 3) + ' deg') + ' [information: the free body carries the joint\'s real force]');
  }
  // the joint's slopes (Z6's elastic-plastic joint), and the tear by height
  const tp = h.at(h.thetaTop), zEH = C.deckZ('E', xH);
  say('  the joint\'s slope: before it yields k0 = E I / Lh of the intact section, ' + f(h.k0 / GN, 0) + ' GN m/rad; on unloading ku = E I / Lh of what still holds, ' + f(tp.ku / GN, 2) + ' GN m/rad at the tear\'s top, where springing back from its ' + gn(tp.M) + ' GN m to nothing takes ' + f(tp.M / tp.ku * DEG, 3) + ' deg of the tear\'s ' + f(h.thetaTop * DEG, 3) + ' [derived; bet: unloading elastic at E]');
  say('  the tear by height (each space\'s span, m above the keel, port as starboard; E deck at ' + f(zEH, 2) + ' m): ' + [0.02, 0.1, 0.5, 1].map(d => { const a = h.at(d / DEG), s = (v) => (v ? f(v[0], 2) + ' to ' + f(v[1], 2) : 'none'); return f(d, 2) + ' deg below ' + s(a.span[0]) + ', above ' + s(a.span[1]); }).join('; '));
  say('  the tear on unloading (m2 a side, below E deck/above): ' + [0.1, h.thetaTop * DEG, 1, 10].map(d => { const tm = d / DEG, a = h.at(tm), sb = a.M / a.ku; return 'from ' + f(d, 2) + ' deg ' + f(a.open[0], 2) + '/' + f(a.open[1], 2) + ', sprung back ' + f(sb * DEG, 3) + ' deg to no load ' + h.unload(tm, tm - sb).open.slice(0, 2).map(v => f(v, 2)).join('/'); }).join('; ') + ' [derived: each torn strip\'s gap closes by its height above the centroid of what holds, ' + f(tp.zU, 2) + ' m at the tear\'s top]');
  if (h.sense === 'hog') {
    // rough, for a CHECK column: the ligament's capacity across her (her y) and in torsion, the double bottom holding
    const els = S.elements(ship, xH), tY = S.MAT.sY / Math.sqrt(3), tau = (e) => Math.min(tY, e.sT / Math.sqrt(3));
    const flat = els.filter(e => e.kind === 'bottom' || e.kind === 'tanktop'), Ly = flat.reduce((s, e) => s + e.A * tau(e), 0);
    const tt = els.find(e => e.kind === 'tanktop'), bs = els.find(e => e.name === 'bottom shell'), mp = els.find(e => e.name === 'margin plate');
    if (tt && bs && mp) {
      const cell = (tt.A / tt.t) * (tt.z - bs.z), qMin = Math.min(tt.t * tau(tt), bs.t * tau(bs), mp.t * tau(mp));
      say('  rough, for a CHECK column [derived]: across her the ligament\'s flats (keel plate, bottom shell, tank top) in their own plane, each at the least of shear yield and its joint over sqrt 3, ' + f(Ly / 1e6, 1) + ' MN (an upper bound: the bottom is past its peak in compression), against about ' + (F ? f(Math.abs(F.V) * Math.tan(Math.abs(F.listDeg) / DEG) / 1e6, 2) : '-') + ' MN of the onset\'s shear across her list; in torsion the double bottom\'s cell (Bredt: twice its ' + f(cell, 1) + ' m2 times the weakest wall\'s shear flow, ' + f(qMin / 1e6, 2) + ' MN/m) ' + f(2 * cell * qMin / 1e6, 0) + ' MN m');
    }
  }
  say();
  // its rules
  let mono = true, inUnit = true, maxM = 0;
  for (let i = 0; i < h.n; i++) {
    maxM = Math.max(maxM, h.M[i]);
    if (h.c[i] < 0 || h.c[i] > 1 || h.cPast[i] < 0 || h.cPast[i] > 1) inUnit = false;
    if (i > 0) {
      if (h.c[i] < h.c[i - 1] || h.cPast[i] < h.cPast[i - 1] || h.W[i] < h.W[i - 1] || h.Nt[i] > h.Nt[i - 1] || h.Vs[i] > h.Vs[i - 1] || !(h.theta[i] > h.theta[i - 1])) mono = false;
      for (let q = 0; q < 4; q++) if (h.open[4 * i + q] < h.open[4 * (i - 1) + q]) mono = false;
    }
  }
  let atOk = true; for (let i = 0; i < h.n; i += 7) { const a = h.at(h.theta[i]); if (Math.abs(a.M - h.M[i]) > 1e-9 * h.Mu || Math.abs(a.c - h.c[i]) > 1e-12 || Math.abs(a.W - h.W[i]) > 1e-9 * Math.max(1, h.W[h.n - 1])) atOk = false; }
  row('MUST', 'the hinge starts where the onset is: M(0) is the station\'s Mu, Vs(0) its Vu, nothing torn and nothing open', 'M(0) ' + gn(h.M[0]) + ' of Mu ' + gn(a0[sense].Mu) + '; Vs(0) ' + f(h.Vs[0] / 1e6, 2) + ' of Vu ' + f(a0.Vu / 1e6, 2) + ' MN; c(0) ' + f(h.c[0], 3) + '; open(0) ' + [0, 1, 2, 3].map(q => f(h.open[q], 3)).join('/'),
    'equal to 1e-9; c 0; open 0', Math.abs(h.M[0] - a0[sense].Mu) <= 1e-9 * a0[sense].Mu && Math.abs(h.Vs[0] - a0.Vu) <= 1e-9 * a0.Vu && h.c[0] === 0 && [0, 1, 2, 3].every(q => h.open[q] === 0));
  row('MUST', '  ... the joint never carries more than Mu; the tear, the work and the openings only grow; the ligament only shrinks', 'max M ' + gn(maxM) + '; c and past c in [0, 1] ' + inUnit + '; ordered ' + mono, 'max M = Mu; all ordered along theta', maxM <= h.Mu * (1 + 1e-12) && inUnit && mono);
  row('MUST', '  ... at(theta) gives the curve at its own points', atOk ? 'equal at every seventh point' : 'DIFFERS', 'equal', atOk);
  const h10 = S.hinge(ship, xH, sense, { Lh: h.Lh / 2 }), hs = S.hinge(ship, xH, sense, { scale: 1.25 }), hf = S.hinge(ship, xH, sense, { steps: 800 });
  row('MUST', '  ... its angle is the curvature spread over Lh: half the hinge, half the angle, the same moments', 'the tear\'s top at ' + f(h10.thetaTop * DEG, 4) + ' deg with Lh ' + f(h10.Lh, 1) + ' m against ' + f(h.thetaTop * DEG, 4) + ' with ' + f(h.Lh, 1), 'exactly half; M the same at each point', Math.abs(h10.thetaTop - h.thetaTop / 2) <= 1e-12 * h.thetaTop && h10.n === h.n && h10.M.every((v, i) => v === h.M[i]));
  row('MUST', '  ... a stronger hull tears later and takes more work', 'every strength x 1.25: Mu ' + gn(hs.Mu) + ', the tear\'s top at ' + f(hs.thetaTop * DEG, 3) + ' deg, work ' + f(hs.at(hs.thetaTop).W / 1e6, 2) + ' MJ', 'against ' + gn(h.Mu) + ', ' + f(h.thetaTop * DEG, 3) + ' deg, ' + f(h.at(h.thetaTop).W / 1e6, 2) + ' MJ: none lower', hs.Mu >= h.Mu && hs.thetaTop >= h.thetaTop && hs.at(hs.thetaTop).W >= h.at(h.thetaTop).W);
  const wA = h.at(h.thetaTop).W, wB = hf.at(h.thetaTop).W;
  row('MUST', '  ... and the work it takes is the curve\'s, not its grid\'s: twice the steps', f(wB / 1e6, 3) + ' MJ to the tear\'s top with 800 steps', f(wA / 1e6, 3) + ' MJ with 400; within 2 %', Math.abs(wB - wA) <= 0.02 * Math.max(wA, wB));
  // the joint's slopes, for Z6's elastic-plastic joint: before it yields, and on unloading from any point of the curve
  let kuMono = true; for (let i = 1; i < h.n; i++) if (h.ku[i] > h.ku[i - 1]) kuMono = false;
  const kTop = h.at(h.thetaTop).ku, k10 = h10.at(h10.thetaTop).ku, kEl = S.MAT.E * S.elastic(S.elements(ship, xH)).I / h.Lh;
  row('MUST', '  ... its slope on unloading: k0 the intact section\'s E I / Lh; ku starts there with nothing torn and only falls as the tear grows; half the hinge, twice the slope',
    'k0 ' + f(h.k0 / GN, 1) + ', ku(0) ' + f(h.ku[0] / GN, 1) + ', at the tear\'s top ' + f(kTop / GN, 2) + ' GN m/rad; never rising ' + kuMono + '; with Lh ' + f(h10.Lh, 1) + ' m ' + f(k10 / GN, 2),
    'k0 = ku(0) = E I(the elastic section) / Lh; falling; twice', Math.abs(h.k0 - kEl) <= 1e-9 * kEl && h.ku[0] === h.k0 && kuMono && kTop > 0 && kTop < h.k0 && Math.abs(k10 - 2 * kTop) <= 1e-9 * kTop);
  // the tear by height: on its space's side of E deck, only widening, and there wherever that space opens to the sea
  let spanOk = true, nSpan = 0;
  for (let i = 0; i < h.n; i++) for (let q = 0; q < 4; q++) {
    const a = 8 * i + 2 * q, lo = h.span[a], hi = h.span[a + 1], has = lo === lo, up = q % 2 === 1;
    if (has) nSpan++;
    if (h.open[4 * i + q] > 0 && !has) spanOk = false;
    if (has && (hi < lo || (up ? lo < zEH : hi > zEH))) spanOk = false;
    if (i > 0 && h.span[a - 8] === h.span[a - 8] && !(has && lo <= h.span[a - 8] && hi >= h.span[a - 7])) spanOk = false;
  }
  const s1 = h.at(1 / DEG).span;
  row('MUST', '  ... the tear by height: each space\'s span on its own side of E deck, only widening, and there wherever that space opens to the sea',
    nSpan + ' spans over ' + h.n + ' points; at 1 deg below ' + (s1[0] ? f(s1[0][0], 2) + ' to ' + f(s1[0][1], 2) : 'none') + ', above ' + (s1[1] ? f(s1[1][0], 2) + ' to ' + f(s1[1][1], 2) : 'none') + ' m',
    'ordered; E deck at ' + f(zEH, 2) + ' m between them', spanOk && nSpan > 0);
  // the joint unloading (Z6): from any furthest angle the joint goes back down its line, ku a radian, and the tear closes
  let unOk = true, rateErr = 0;
  for (const d of [0.02, 0.1, h.thetaTop * DEG, 1, 10]) {
    const tm = d / DEG, a = h.at(tm), u0 = h.unload(tm, tm), sb = a.M / a.ku, dl = 1e-7, u1 = h.unload(tm, tm - dl);
    if (u0.M !== a.M || u0.open.some((v, q) => v !== a.open[q])) unOk = false;
    let prev = a.open;
    for (const k of [0.25, 0.5, 1, 2, 3]) {
      const u = h.unload(tm, tm - k * sb);
      if (Math.abs(u.M - (a.M - a.ku * k * sb)) > 1e-9 * h.Mu || u.open.some((v, q) => v < 0 || v > prev[q] + 1e-12)) unOk = false;
      prev = u.open;
    }
    for (let q = 0; q < 4; q++) rateErr = Math.max(rateErr, Math.abs((a.open[q] - u1.open[q]) / dl - a.closeRate[q]) / Math.max(1, a.closeRate[q]));
  }
  row('MUST', '  ... unloading: at its start the line is at(theta) itself; on it the moment falls by ku a radian, the openings only close and never past contact; closeRate is their first rate',
    'equal at the start; ordered ' + unOk + '; closeRate against a finite difference within ' + rateErr.toExponential(1),
    'equal; ordered; within 1e-6', unOk && rateErr <= 1e-6);
}

// ---------------------------------------------------------------- 6. a stronger hull never breaks sooner; the case that floats
{
  const scales = [0.8, 0.9, 1.0, 1.05, 1.1, 1.2, 1.3];
  const R = scales.map(s => { const sim = C.createSim(ship, {}, SC.PRESETS.titanic.build()); const st = O.run(sim, { section: { scale: s }, stopAtOnset: true }); return { s, st, sim }; });
  say('A STRONGER HULL NEVER BREAKS SOONER (every strength scaled; the 1912 preset, list free; the reader\'s schedule)');
  say('  scale   onset T   clock         step     x m    where                       trim   list   M/Mu');
  for (const q of R) { const o = q.st.found; say('  ' + f(q.s, 2).padStart(5) + (o ? f(o.T, 2).padStart(10) + '   ' + clock(o.T).padEnd(11) + String(o.k).padStart(7) + f(o.x, 2).padStart(8) + '    ' + o.where.padEnd(26) + f(o.trimDeg, 2).padStart(6) + f(Math.abs(o.listDeg), 1).padStart(7) + f(o.M / o.Mu, 3).padStart(7) : '   none: founders at T ' + f(q.sim.founderT / 60, 2) + ', closest r ' + f(q.st.peak.r, 3))); }
  say();
  const k = (q) => (q.st.found ? q.st.found.k : Infinity);
  let mono = true; for (let i = 1; i < R.length; i++) if (k(R[i]) < k(R[i - 1])) mono = false;
  row('MUST', 'raising the capacity never makes the onset earlier (x 0.8 to 1.3)', R.map(q => q.s + ': ' + (q.st.found ? 'T ' + f(q.st.found.T, 2) : 'none')).join('; '), 'later or the same, step by step', mono);
  const sim4 = C.createSim(ship, {}, SC.PRESETS.four.build()), st4 = O.run(sim4, { tMax: 8 * 3600, stopWhenStable: true });
  const p4 = st4.peak;
  row('MUST', 'the four forward compartments open (Wilding: she floats): no onset', (st4.found ? 'ONSET at T ' + f(st4.found.T, 2) : 'none') + '; ' + (sim4.foundered ? 'FOUNDERED' : 'afloat at ' + f(sim4.t / 60, 0) + ' min') + '; closest (M/Mu)^2 + (V/Vu)^2 ' + f(p4.r, 3) + ' at x ' + f(p4.x, 1) + ' (' + p4.where + ', ' + p4.sense + ') at ' + f(p4.t / 60, 0) + ' min',
    'none, afloat', !st4.found && !sim4.foundered);
}

// ---------------------------------------------------------------- 7. the 1912 watch: the reader on a watch, and the model's own fingerprint
let WATCH_ONSET = null, WATCH_FOUNDER = null;      // kept for section 9 (the hull's ends, on against off)
{
  // the same watch on the same tree, with the reader and with none: the fingerprint is the model's alone, whatever the
  // model's own value is (tools/systems_tests.js pins that, and moves it with the physics). The watch runs to her founder,
  // the flag hand-over (the named what-if since G12's switch, D98): there the night carries no check of its own, so the
  // reader's own schedule finds the onset on the way, and WATCH_FOUNDER is the flag's. The default watch, handed over at
  // that onset, is section 7b's.
  const sp = N.spec(1912);
  const a = N.sink(N.create(ship, sp, { auto: true, handover: 'flag' })), b = N.sink(N.create(ship, sp, { auto: true, handover: 'flag', readers: false }));
  const ev = (s) => JSON.stringify(s.events.map(e => [e.t, e.id]));
  const q = a.onset && a.onset.found;
  WATCH_ONSET = q; WATCH_FOUNDER = a.foundered ? (a.founderT - a.night.tTouch) / 60 : null;
  row('MUST', 'the 1912 watch (to the flag, D98\'s what-if) with the onset reader attached: the model\'s own fingerprint, and no event of its own', 'fingerprint ' + N.fingerprint(a) + ' at step ' + a.night.k + '; ' + a.events.length + ' events; the reader ' + (a.onset ? 'attached, ' + a.onset.looks + ' looks' : 'NOT ATTACHED'),
    'the same watch without any reader: ' + N.fingerprint(b) + ' at step ' + b.night.k + ', ' + b.events.length + ' events, the same list', N.fingerprint(a) === N.fingerprint(b) && a.night.k === b.night.k && ev(a) === ev(b) && !!a.onset && !b.onset);
  const F = fd(free.every);
  say('THE 1912 WATCH (core/night.js, its reconstructed orders, to the flag; the reader\'s state sim.onset): T from the touch. The default watch (D98) hands her to the fall here');
  say('  ' + (q ? 'T ' + f(q.T, 2) + ' min (' + clock(q.T) + '), step ' + q.k + '; x ' + f(q.x, 2) + ' m, ' + q.where + '; ' + q.sense + ' ' + gn(q.M) + ' of ' + gn(q.Mu) + ' GN m; trim ' + f(q.trimDeg, 2) + ' deg, list ' + f(Math.abs(q.listDeg), 1) + ' deg; exact ' + q.exact + '; ' + a.onset.looks + ' looks in ' + a.night.k + ' steps' : 'no onset'));
  say('  ' + O.describe(q));
  say();
  row('CHECK', 'the 1912 watch\'s onset against the preset\'s', q ? 'T ' + f(q.T, 2) + ', x ' + f(q.x, 2) + ', trim ' + f(q.trimDeg, 2) : 'none', 'the preset: ' + (F ? 'T ' + f(F.T, 2) + ', x ' + f(F.x, 2) + ', trim ' + f(F.trimDeg, 2) : 'none') + '; the same station, within a minute', !!q && !!F && q.x === F.x && Math.abs(q.T - F.T) < 1);
}

// ---------------------------------------------------------------- 7b. the onset as the watch's own check (D76 b)
// On a watch handed over at the onset core/night.js carries B2's check itself (sim.night.onset), looked at by the night's
// step before the readers: a copy of the watch, its forecast and a watch with no readers meet the same onset, and the
// reader only mirrors it. Since G12's switch (D98, Bo: "Yes, option (a)") that is the DEFAULT watch: no handover, or
// null, is 'onset'. A 'flag' watch, the named what-if, carries none and no handover field, and keeps every bit of the
// watch before the switch (row 7 above runs it, with the reader and without).
{
  const sp = N.spec(1912);
  const flagW = N.create(ship, sp, { auto: true, handover: 'flag' }), dflt = N.create(ship, sp, { auto: true });
  const on = (readers) => { const s = N.create(ship, sp, { auto: true, readers }); while (!N.over(s)) N.step(s); return s; };
  const a = on(true), b = on(false), qa = a.night.onset && a.night.onset.found, qb = b.night.onset && b.night.onset.found;
  const keys = ['k', 't', 'T', 'x', 'where', 'sense', 'M', 'Mu', 'V', 'Vu', 'r', 'trimDeg', 'listDeg', 'exact'];
  const flagNone = flagW.night.onset === undefined && flagW.night.handover === undefined, dfltOnset = dflt.night.handover === 'onset' && !!dflt.night.onset;
  row('MUST', 'the onset as the watch\'s own check (D76 b), the default since D98: a \'flag\' watch carries none; the default watch is an onset watch and finds it with its readers and without, on the same step, the reader mirroring the night',
    'flag: sim.night.onset ' + (flagNone ? 'none' : 'PRESENT') + '; default: handover ' + dflt.night.handover + ', the check ' + (dflt.night.onset ? 'carried' : 'NONE') + '; readers on: over at step ' + a.night.k + ', found ' + (qa ? 'k ' + qa.k + ', x ' + f(qa.x, 2) : 'NONE') + '; readers off: over at step ' + b.night.k + ', found ' + (qb ? 'k ' + qb.k + ', x ' + f(qb.x, 2) : 'NONE') + '; the reader\'s state the night\'s: ' + (a.onset === a.night.onset),
    'none; onset, carried; the same step and every field of found; the same object', flagNone && dfltOnset && !!qa && !!qb && keys.every(k => qa[k] === qb[k]) && a.night.k === qa.k && b.night.k === qb.k && a.onset === a.night.onset && b.onset === undefined);
  // its forecast: a copy without the readers taken five minutes before the onset (as the page's worker takes one) ends on
  // the onset's step, not at the flag
  const c = N.create(ship, sp, { auto: true });
  while (!(c.night.tTouch >= 0 && c.t - c.night.tTouch >= (qa ? qa.T - 5 : 150) * 60)) N.step(c);
  const fc = N.forecast(ship, N.forecastOf(c));
  row('MUST', '  ... its forecast, a copy without the readers taken five minutes before, ends on the onset\'s step (over, at the onset\'s time), not at the flag',
    'over ' + fc.over + ' at step ' + fc.k + ', overT ' + f(fc.overT, 2) + ' s; foundered ' + fc.foundered,
    'over at step ' + (qa ? qa.k : '-') + ', overT ' + (qa ? f(qa.t, 2) : '-') + ' s; not foundered', !!qa && fc.over === true && fc.k === qa.k && fc.overT === qa.t && fc.foundered === false);
}

// ---------------------------------------------------------------- 8. what it costs
const timing = [];
{
  const sim = C.createSim(ship, {}, SC.PRESETS.titanic.build());
  for (let i = 0; i < 4 * 3600 * 2.5; i++) C.step(sim);
  const cpu = (fn, n) => { fn(); const a = process.cpuUsage(); for (let i = 0; i < n; i++) fn(); const d = process.cpuUsage(a); return (d.user + d.system) / 1000 / n; };
  const cCheck = cpu(() => O.check(sim), 50);
  const xs = Array.from(G.shipData(ship).e).concat(Array.from(G.shipData(ship).band));
  const fresh = cpu(() => { S.along({ hull: ship.hull }, xs); }, 1);    // a ship of the same form, not yet cached
  const perStep = free.sched.looks * cCheck / Math.max(1, free.sched.k);
  timing.push('~ cost: check() ' + f(cCheck, 3) + ' ms a call (CPU); on the 1912 preset the schedule looks ' + free.sched.looks + ' times in ' + free.sched.k + ' steps: about ' + f(perStep, 4) + ' ms a step; the strength along her, computed once for a ship: ' + f(fresh, 0) + ' ms');
  row('CHECK', 'what the reader costs a step on the 1912 preset (the schedule against looking every step)', free.sched.looks + ' looks in ' + free.sched.k + ' steps', 'under one look in ten steps', free.sched.looks * 10 < free.sched.k);
  // a watch over the run begun after its onset finds her past her strength at its first look, and does not call that the
  // first step (the page, or a test, that starts looking late is told so)
  const F = fd(free.every);
  if (F) {
    while (O.stepOf(sim) < F.k + 100 && !sim.foundered) C.step(sim);
    const late = O.start(); O.look(sim, late);
    row('MUST', 'a watch begun after the onset finds it at its first look and marks it not the first step (exact false)', late.found ? 'found at step ' + late.found.k + ', exact ' + late.found.exact + ', looked before at ' + late.found.after : 'NOT FOUND',
      'found at step ' + (F.k + 100) + ', exact false (the onset was at ' + F.k + ')', !!late.found && late.found.k === F.k + 100 && late.found.exact === false && late.found.after === -1);
  }
}

// ---------------------------------------------------------------- 9. her hull's ends behind their switch (C3, G14; D80 d)
// C.buildShip({ hullEnds: 1 }) restores her ends above the waterline from the deck plans (core/core.js, ENDS_READ); it
// reaches section.js only through ship.hull (C.halfBreadth's third argument), as the design asked
// (docs/DESIGN_G14_hull_ends_girder_and_section_v1_2026-11-21.md, section 3). Built dark, it is on by default since the
// epoch's landing (D4). The rows: the ship with the switch off has the sections it had when the switch came in (a hash
// frozen then: a section is her form alone, so the hash outlives the landing's refit; a change to the scantlings, to
// section.js or to the model's arithmetic moves it, as B1's pow did, and the commit that means it refreezes it and says
// so); with it on, nothing within 31.5 m of amidships moves (the fit, the panel's section, the hinge); and the decks of
// the section take the plans' side where they were read. What it does to her ends' strength and to the onset is
// printed, not judged.
{
  const L = require('./rooms_table.js'), FT = C.FT;
  const shipOff = C.buildShip({ hullEnds: 0 }), shipOn = C.buildShip({ hullEnds: 1 });
  // the stations: section 5's (every 10 m and the band's), and every frame where a deck's side was read
  const xs = []; for (let x = -130; x <= 130; x += 10) xs.push(x);
  xs.push(G.BAND[0], -25.1, -22.4, G.BAND[1], -10.93);
  const READ = {};
  for (const d of ['E', 'D', 'C', 'B']) { const T = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'rooms', d + '_deck.json'), 'utf8')); READ[d] = T.side.at.map(([fr, p, s]) => { const v = [p, s].filter(q => typeof q === 'number'); return { fr, x: L.frameM(T, fr), y: v.reduce((a, b) => a + b, 0) / v.length * FT }; }); for (const r of READ[d]) xs.push(r.x); }
  const XS = Array.from(new Set(xs.map(x => Math.round(x * 1e6) / 1e6))).sort((a, b) => a - b);
  const sec = (sh, x) => JSON.stringify(S.elements(sh, x));
  const hashOf = (sh, list) => { const h = crypto.createHash('sha256'); for (const x of list) h.update(x.toFixed(6) + ':' + sec(sh, x) + ';'); return h.digest('hex').slice(0, 16); };
  // frozen at the switch's commit (on f677ae7, the core of C3, this file's run, node v26.13.0 on this machine) as
  // 9f188fc10cbc134b; refrozen with the model's pow, B1/e107: a change of arithmetic, not of form, since f677ae7's code
  // run with C.pow preloaded over its Math.pow, node -r tools/pow_preload.js, gives this hash
  const FROZEN_OFF = '414c86ea81ca884c';
  const hOff = hashOf(shipOff, XS), hDef = hashOf(ship, XS);
  row('MUST', 'C3 (on since D4): the ship with hullEnds 0 has the sections it had when the switch came in: section.js\'s elements at ' + XS.length + ' stations (every 10 m, the band, every read frame), hashed',
    hOff + (hDef === hOff ? ' (the default ship\'s the same)' : ' (the default ship\'s ' + hDef + ')'), FROZEN_OFF + ', frozen at the switch\'s commit (refrozen with the model\'s pow, B1/e107)', hOff === FROZEN_OFF);
  // with it on: nothing within 31.5 m of amidships moves (the core's fade starts 35 frames out)
  const MID = XS.filter(x => Math.abs(x) <= 31.5);
  const moved = MID.filter(x => sec(shipOn, x) !== sec(shipOff, x));
  row('MUST', '  ... with hullEnds 1, the sections within 31.5 m of amidships are the same to the bit (' + MID.length + ' stations, the onset\'s and the fit\'s among them): the fit, the panel\'s section and the hinge stand',
    moved.length ? 'moved at ' + moved.map(x => f(x, 2)).join(' ') : 'none moved', 'none', moved.length === 0);
  // with it on: where C deck and B deck were read, the section's decks have the plans' side (the reading, or the
  // fitted form's where that is the wider)
  let worst = 0, worstAt = '-', nDeck = 0;
  for (const d of ['C', 'B']) for (const r of READ[d]) {
    const e = S.elements(shipOn, r.x).find(q => q.name === d + ' deck plating');
    if (!e) continue;
    const want = Math.max(r.y, C.halfBreadth(r.x, C.deckZ(d, r.x))), dv = Math.abs(0.5 * e.width - want);
    nDeck++; if (dv > worst) { worst = dv; worstAt = d + ' ' + r.fr; }
  }
  // (within 0.1 mm: the core's table gives each frame's place to 0.001 ft, the deck tables' frames are placed by
  // rooms_table.js, and her side is steep at the bow: 4e-5 m at C deck's 150F at the switch's commit)
  row('MUST', '  ... and its decks take the plans\' side: at every frame where C deck or B deck was read, that deck\'s plating spans the reading (or the fitted form\'s side where that is the wider)',
    nDeck + ' decks read; worst ' + worst.toExponential(1) + ' m (' + worstAt + ')', 'within 1e-4 m', nDeck > 40 && worst <= 1e-4);
  // what it gives: her ends' strength, on against off
  say('HER HULL\'S ENDS (C3, the switch on against off): her strength at her ends, as section.js finds it with the plans\' side');
  say('      x m  where                           Mu hog off / on      Mu sag off / on     Vu MN off / on');
  for (const x of [-130, -120, -110, -100, -90, -80, -70, 70, 80, 90, 100, 110, 120]) {
    const a = S.at(shipOff, x), b = S.at(shipOn, x);
    if (a.none || b.none) { say('  ' + f(x, 1).padStart(7) + '  (no section)'); continue; }
    say('  ' + f(x, 1).padStart(7) + '  ' + a.where.padEnd(30) + (gn(a.hog.Mu) + ' / ' + gn(b.hog.Mu)).padStart(18) + (gn(a.sag.Mu) + ' / ' + gn(b.sag.Mu)).padStart(21) + (f(a.Vu / 1e6, 1) + ' / ' + f(b.Vu / 1e6, 1)).padStart(20));
  }
  // and the onset, the preset's and the watch's, off against on. Since the landing (D4) the default ship has her ends
  // (hullEnds 1), so sections 4's and 7's runs are the ON figures; the OFF ones run here on hullEnds 0, the watch to the
  // flag (handover 'flag') for its founder too. (Between the landing and G12's switch this row ran on against on: it
  // printed the same figures twice.)
  const simOff = C.createSim(shipOff, {}, SC.PRESETS.titanic.build()), pOff = O.run(simOff, { every: true }), FP = fd(free.every);
  const wOff = N.sink(N.create(shipOff, N.spec(1912), { auto: true, handover: 'flag' })), qW = wOff.onset && wOff.onset.found;
  const one = (q, fT) => q ? 'T ' + f(q.T, 2) + ', x ' + f(q.x, 2) + ' (' + q.where + '), ' + gn(q.M) + ' of ' + gn(q.Mu) + ' GN m, trim ' + f(q.trimDeg, 1) + '; the flag ' + f(fT, 2) : 'none; the flag ' + f(fT, 2);
  const pFoundOff = pOff.found;
  say('  the onset on the preset: off ' + one(pFoundOff, simOff.foundered ? simOff.founderT / 60 : null) + '; on ' + one(FP, free.sim.founderT / 60));
  say('  the onset on the watch:  off ' + one(qW, wOff.foundered ? (wOff.founderT - wOff.night.tTouch) / 60 : null) + '; on ' + one(WATCH_ONSET, WATCH_FOUNDER));
  say();
  row('CHECK', '  ... what the restored ends do to the onset (said, not judged: the rung; it moves with the landing\'s refit)',
    'preset: ' + (pFoundOff ? f(pFoundOff.T, 2) : '-') + ' to ' + (FP ? f(FP.T, 2) : '-') + ' min; watch: ' + (qW ? f(qW.T, 2) : '-') + ' to ' + (WATCH_ONSET ? f(WATCH_ONSET.T, 2) : '-') + ' min; the station ' + (FP && pFoundOff && FP.x === pFoundOff.x && WATCH_ONSET && qW && WATCH_ONSET.x === qW.x ? 'the same' : 'MOVES'),
    'the G14 note, first order: at most 0.42 min later, the same station; along its own path, more', true);
}

// ---------------------------------------------------------------- 10. B4's joint from the onset across the kept set (gate 3)
// docs/DESIGN_B4_the_joint_from_the_onset_v1_1_2026-11-23.md, gate 3 (the coordinator's plan for join 20).
// tools/joint_kept.js runs the default watch of the landed member and of each kept member to its onset, then the fall
// from that onset with B4's joint as the fall reader begins it, and writes out/joint_kept_1912.json. It is a sweep (about
// 8 min with the hand-over's what-if), run by the gate's --sweeps. These rows read that table: whether it is of this
// tree's core, and how each onset ends, as k of N, never one sense or one end picked (B4's rule).
// Since gate 5's mend (Z1, cf233ac: the hinge's moment at the sub-step's middle; B1+B2 found the cause, 2026-11-24) an
// onset ends one of two ways: she parts at the surface at the fold's start, by shear, or her joint holds. The folded
// mode the table showed before (6 members letting go at 45 to 49 deg) was the step's artefact.
// Since D113 (the coordinator, 2026-11-24) the joint is judged under the spaces (K.air 'spaces': 'held', the floats),
// each member to 90 s. Under the lumped pocket she parted in 23 of 30 (13 with the pocket at 'centre'), but that was its
// stand-in vent's: it drained the joined pieces from the hand-over and drove the swing that crossed Mu (Z1's finding;
// with the vents shut, or under the spaces, member C holds). For a joint that holds without yielding, the table gives
// its demand's peak against Mu and what she lacked to part, read as the ligament's loss and as water aft of the
// station. The release in every member, once meant to become a MUST, is not the model's answer.
// Since join 22 the hand-over's consistencies are the defaults (D114 to D116: the hinge yields on the resultant of its
// moments on the onset's shear circle, H.under; G7's peak tank weighed; the section polygon at full resolution; the
// weather openings). Each joint then starts at its yield, and under the spaces she parts at the surface in every member,
// by shear, some after folding some degrees as the tear runs: the angle is printed, not judged.
{
  const file = path.join(__dirname, '..', 'out', 'joint_kept_1912.json');
  const T = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
  const here = require('./ensemble.js').codeHash();
  if (!T) row('CHECK', 'B4 gate 3: the joint from the onset across the kept set (out/joint_kept_1912.json)', 'NO TABLE', 'node tools/joint_kept.js', false);
  else {
    const c = T.counts, b = T.bands, L = T.landed && T.landed.joint, same = T.core === here;
    const yl = (j) => (j.yieldAt === null || j.yieldAt === undefined ? 'never yielded' : 'yielded ' + f(j.yieldAt, 2) + ' s after');
    const pk = (j) => (j.peak !== null && j.peak !== undefined ? '; its peak ' + f(j.peak, 4) + ' of Mu: to part, the ligament ' + f(j.loss, 2) + ' % weaker or ' + f(j.water, 0) + ' t more water ' + f(j.lever, 0) + ' m aft' : '');
    const one = (j) => !j || !j.built ? 'no joint built' : (j.released && j.surface ? 'parts at the surface ' + f(j.after, 2) + ' s after its onset, by ' + j.by + ' at ' + f(j.theta, 2) + ' deg (' + yl(j) + '; rN ' + f(j.rN, 3) + ', rV ' + f(j.rV, 3) + ')'
      : (j.released ? 'SINKS JOINED: lets go only at the bed, ' + f(j.after, 0) + ' s after (' + f(j.depth, 0) + ' m), by ' + j.by : (j.done ? 'SINKS JOINED: held to rest on the bed, ' : 'HOLDS through the window, ') + f(j.followed, 0) + ' s') + ' (' + yl(j) + '; the most while it held rV ' + f(j.maxV, 3) + pk(j) + ')');
    const win = T.tmax;
    const ends = (cc, bb) => 'parts at the surface in ' + cc.surface + ' of ' + cc.onset + (cc.surface ? ' (' + f(bb.surfaceAfter.lo, 2) + ' to ' + f(bb.surfaceAfter.hi, 2) + ' s after, median ' + f(bb.surfaceAfter.med, 2) + '; at ' + f(bb.surfaceTheta.lo, 2) + ' to ' + f(bb.surfaceTheta.hi, 2) + ' deg)' : '') +
      '; does not in ' + cc.joined + ' (' + (cc.window === undefined ? '' : 'holds through the ' + win + ' s window ' + cc.window + ', ') + (cc.released - cc.surface) + ' let go only at the bed, ' + (cc.held - (cc.window || 0)) + ' held to rest); by shear ' + cc.shear + ', by tension ' + cc.tension;
    say('B4\'S JOINT FROM THE ONSET ACROSS THE KEPT SET (gate 3: tools/joint_kept.js, out/joint_kept_1912.json; the default watch to each onset, then the fall with the joint; its air: ' + (T.air === 'spaces' ? 'the spaces, D113' : (T.air || 'the pocket')) + ', each to ' + win + ' s)');
    say('~ the table\'s core ' + T.core + ', this tree\'s ' + here);
    say('  the landed member: onset T ' + f(T.landed.onset && T.landed.onset.T, 2) + ' at x ' + f(T.landed.onset && T.landed.onset.x, 2) + '; she ' + one(L));
    say('  the kept set (' + c.N + ' members): an onset in ' + c.onset + '; she ' + ends(c, b));
    const J_ = T.members.map((m, i) => ({ i: i + 1, j: m.joint })).filter(m => m.j && m.j.built && !m.j.surface);
    if (J_.length) say('    does not part: ' + (J_.length > 12 ? J_.length + ' members' : J_.map(m => '#' + m.i).join(', ')) + '; the joint\'s M0 at the hand-over ' + f(Math.min(...J_.map(m => m.j.M0 / m.j.Mu)), 4) + ' to ' + f(Math.max(...J_.map(m => m.j.M0 / m.j.Mu)), 4) + ' of Mu');
    if (b.peak && b.peak.n) say('    the joints that never yielded (' + b.peak.n + '): the demand\'s peak ' + f(b.peak.lo, 4) + ' to ' + f(b.peak.hi, 4) + ' of Mu (median ' + f(b.peak.med, 4) + '). To part she lacks the ligament ' + f(b.loss.lo, 2) + ' to ' + f(b.loss.hi, 2) + ' % weaker (the crack running), or ' + f(b.water.lo, 0) + ' to ' + f(b.water.hi, 0) + ' t more water aft of the station at the stern piece\'s lever, ' + f(b.lever.lo, 0) + ' to ' + f(b.lever.hi, 0) + ' m (the tear\'s flooding; a stern settling back adds its own swing, not counted)');
    const C_ = T.centre;
    if (C_) say('  the hand-over\'s what-if, the onset\'s pocket at \'centre\' (D98\'s default is \'flag\'): she ' + ends(C_.counts, C_.bands) + '; the landed member ' + (C_.landed ? one(C_.landed) : '-'));
    // gate 4: the as-built ligament and the sourced alternatives on the landed member (printed, not judged: the default
    // is the as-built whatever its sense or its end; no alternative is chosen for its sense, its end or its pieces' landing)
    const W = T.whatifs || [];
    if (W.length) say('  gate 4, the ligament\'s what-ifs on the landed member (what still holds at the tear\'s top; how it ends):');
    for (const w of W) say('    ' + w.label.padEnd(46) + 'Vs ' + f(w.VsTop, 2).padStart(6) + ' MN, Nt ' + f(w.NtTop, 1).padStart(6) + ' MN, Lh ' + f(w.Lh, 2).padStart(5) + ' m: ' + one(w.joint));
    say();
    if (W.length) {
      const asBuilt = W[0].joint, alt = W.slice(1), senses = new Set(W.filter(w => w.joint && w.joint.released).map(w => w.joint.by));
      row('CHECK', 'B4 gate 4: the as-built ligament and its sourced alternatives (girders, joints, the hinge\'s length) each counted from the landed member\'s onset under the table\'s air, their senses and ends printed, none picked', 'as built: ' + (asBuilt && asBuilt.surface ? 'parts, ' + asBuilt.by + ' at ' + f(asBuilt.after, 2) + ' s' : 'holds') + '; the ' + alt.length + ' alternatives: ' + alt.filter(w => w.joint && w.joint.surface).length + ' part at the surface, ' + alt.filter(w => w.joint && w.joint.built && !w.joint.surface).length + ' hold; senses seen: ' + ([...senses].join(' and ') || 'none'),
        'every one counted (a joint built and followed)', W.every(w => w.joint && w.joint.built));
    }
    row('CHECK', 'B4 gate 3: the kept set\'s table is of this tree\'s core (when it is not, run tools/joint_kept.js again)', same ? 'this tree\'s' : 'ANOTHER TREE\'S', 'this tree\'s', same);
    // join 22 (D116 and the four consistencies as defaults): each joint starts at its yield (the margins -0.30 to -0.19 %)
    // and rotates as its tear runs before the ligament's shear lets go, so a release's angle is the tear's, not the step's.
    // The step's artefact (gate 5) is held by its own convergence row in tools/fall_trials.js; this row holds the count
    const R = T.members.filter(m => m.joint && m.joint.released && m.joint.surface);
    row('CHECK', 'B4 gate 3: every onset ends one of two ways under the spaces (D113), k of N each (no end and no sense picked): parts at the surface, its time, angle and sense printed, or holds, its margin to Mu printed',
      'at the surface ' + c.surface + ', not ' + c.joined + ' of ' + c.onset + (R.length ? '; released at ' + f(b.surfaceTheta.lo, 2) + ' to ' + f(b.surfaceTheta.hi, 2) + ' deg, +' + f(b.surfaceAfter.lo, 2) + ' to +' + f(b.surfaceAfter.hi, 2) + ' s; by shear ' + c.shear + ', by tension ' + c.tension : '') + '; the air: ' + (T.air || 'pocket') + (C_ ? '; the pocket at \'centre\': at the surface ' + C_.counts.surface : ''),
      'the two ends add up; judged under the spaces', c.onset > 0 && c.surface + c.joined === c.onset && T.air === 'spaces');
  }
}

for (const l of out) console.log(l);
for (const [kind, what, value, ref, ok] of rows) console.log((kind === 'MUST' ? (ok ? 'PASS ' : 'FAIL ') : (ok ? 'in   ' : 'OUT  ')) + what.padEnd(112) + ' ' + String(value).padEnd(80) + ' ' + ref);
for (const l of timing) console.log(l);
console.log('~ (' + f((Date.now() - t0) / 1000, 0) + ' s)');
console.log(fails ? '\nFAIL: ' + fails + ' MUST row(s)' : '\nPASS: every MUST row (' + rows.filter(r => r[0] === 'MUST').length + '); CHECK rows in range: ' + rows.filter(r => r[0] === 'CHECK' && r[4]).length + ' of ' + rows.filter(r => r[0] === 'CHECK').length);
process.exit(fails ? 1 : 0);
