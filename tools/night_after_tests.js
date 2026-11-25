// Z3: the watch past the hand-over (docs/DESIGN_the_join_Z3_v1_2026-11-20.md, sections 3, 5 and 8). The fall is a reader
// of the night. Past the hand-over the night runs only the due orders, the count, the clock and the readers, so the
// watch's fingerprint holds through the fall. The readers run on: the wireless silent, the other ships on their courses,
// the boats as they were left.
//   node tools/night_after_tests.js     the table, written to out/night_after_tests.txt (tools/outdir.js); exit 1 if a MUST row fails
// Since D98 (G12's option (a), G19's switch) a watch hands over at B2's onset by default; handover 'flag' is the
// what-if, today's watch to the bit. The same rows hold both (handOver below); the replays run on the default.
// MUST rows hold the design; CHECK rows print where the pieces lie beside the wreck, which nothing is tuned to.
// G2 (NH15, docs/DESIGN_the_living_ship_v1_2026-11-23.md): her lights through the fall, piece by piece, on G1's circuits
// (core/readers/circuits.js): at the flag as the plant left her; at the onset the forward piece dark from the break and
// the stern lit until its dynamos run down by the plant's own law; nothing fed back into the fall.
// About a minute on a quiet machine.
'use strict';
const fs = require('fs');
const C = require('../core/core.js');
const N = require('../core/night.js');
const SC = require('../core/scenarios.js');
const Sys = require('../core/systems.js');
for (const r of ['girder.js', 'section.js', 'onset.js', 'people.js', 'reports.js', 'world.js', 'circuits.js']) require('../core/readers/' + r);
const CI = require('../core/readers/circuits.js');
const F = require('../core/readers/fall.js');
const outFile = require('./outdir');
const t0 = Date.now();
const rows = []; let fails = 0;
function row(kind, what, value, ref, ok) { rows.push([kind, what, value, ref, ok]); if (kind === 'MUST' && !ok) fails++; }
const f = (x, n) => (x === null || x === undefined || !isFinite(x) ? 'n/a' : x.toFixed(n === undefined ? 1 : n));
const out = [], say = (s) => out.push(s === undefined ? '' : s);
const DEG = 180 / Math.PI, ship = C.buildShip(), dt = C.DEFAULT_PARAMS.dt;
// a fall as bits: every piece's place, attitude, velocities, state and burial, and every event; with her lights (G2)
const motion = (fall) => fall.pieces.map(p => [p.r, p.q, p.v, p.om].map(a => Array.from(a).map(String).join(',')).join('|') + '|' + p.state + '|' + Array.from(p.bury).map(String).join(',')).join(';') + '#' + fall.events.map(e => e.id + e.piece + ':' + e.t).join(',');
const bits = (fall) => motion(fall) + '#' + JSON.stringify(fall.lights);
const watch = (o) => { const s = N.run(N.create(ship, N.spec(1912), Object.assign({ auto: true }, o || {}))); N.sink(s); return s; };

// ================================================================ one watch handed over, whichever its rule
// D98 (Bo, 2026-11-23; G19's switch, the mainline's step 2): a watch hands over at B2's onset by default, the night's own
// check (sim.night.onset, D76 b); handover 'flag' is the what-if, today's watch to the bit. The same rows hold either way:
// the fall begun on the first step past the hand-over, its clock the watch's, the fingerprint the hand-over's, the readers
// as they were left, the core never stepped again; and her lights (G2): at the onset handed over lit, the forward piece
// dark from the break and the stern lit until its dynamos run down; at the flag as the plant left her
function handOver(o, name) {
  const sim = watch(o), onset = sim.night.handover === 'onset', fd = onset ? sim.night.onset && sim.night.onset.found : null;
  const tH = onset ? (fd ? fd.t : NaN) : sim.founderT, kH = sim.night.k, fp0 = N.fingerprint(sim), at = onset ? 'the onset' : 'the flag';
  const pose = [sim.zO, sim.pitch, sim.roll].map(String).join(',');
  say(name + ': handed over at ' + at + ' at step ' + kH + ', ' + f(tH / 60, 2) + ' min into the watch' + (fd ? ' (x ' + f(fd.x, 2) + ', ' + fd.where + ', trim ' + f(fd.trimDeg, 1) + ', list ' + f(-fd.listDeg, 1) + ')' : '') + ', fingerprint ' + fp0);
  row('MUST', name + ': its hand-over', (sim.night.handover || 'no hand-over field') + (sim.foundered ? ', foundered' : ', not foundered'), onset ? 'the onset, the night\'s own check found; she never founders (D98)' : 'no hand-over field, the core\'s flag: today\'s watch (the what-if)',
    onset ? !!fd && !sim.foundered : sim.night.handover === undefined && sim.foundered);
  row('MUST', name + ': no sim.fall on the hand-over\'s own step', sim.fall ? 'begun' : 'none', 'the reader begins lazily, on the first step past (Z3\'s design, 3)', !sim.fall);
  const circ0 = JSON.parse(JSON.stringify(sim.circuits)), P0p = sim.plant.p, P0l = sim.plant.lights;
  const W = sim.world, B0 = JSON.stringify(sim.people.boats), rk0 = W.rockets ? JSON.stringify(W.rockets.fired) : '';
  const carp = () => { const s = (W.ships || []).find(x => x.id === 'carpathia'); return s ? s.nm : NaN; };
  const nm0 = carp(), trace = [];
  const look = () => { const L = sim.fall && sim.fall.lights; if (L && !sim.fall.done) trace.push([sim.fall.t, L.level.slice(), L.lit ? L.lit.slice() : null]); };
  N.step(sim); look();
  row('MUST', name + ': the first step past the hand-over', 't0 ' + f(sim.fall ? sim.fall.t0 : NaN, 2) + ' s, fall.t ' + f(sim.fall ? sim.fall.t : NaN, 2) + ', sim.t ' + f(sim.t, 2), 'begun, t0 the hand-over\'s time, sim.fall.t = sim.t = t0 + dt', !!sim.fall && sim.fall.t0 === tH && sim.fall.t === sim.t && sim.t === tH + dt);
  let clockOk = true, fpOk = true, tDone = null, frozen = true;
  for (let k = 1; k < 2400; k++) {
    N.step(sim); look();
    if (!sim.fall.done) { if (sim.fall.t !== sim.t) clockOk = false; } else if (tDone === null) tDone = sim.fall.t; else if (sim.fall.t !== tDone) frozen = false;
    if (N.fingerprint(sim) !== fp0) fpOk = false;
  }
  row('MUST', name + ': ten minutes past, the fall\'s clock', clockOk ? 'the watch\'s at every step until done (+' + f((tDone - tH) / 60, 2) + ' min), then still' : 'it left the watch\'s', 'sim.fall.t = sim.t until the fall is done, then stays (Z3\'s design, 3)', clockOk && frozen);
  row('MUST', name + ': ten minutes past, the fingerprint', N.fingerprint(sim) + (fpOk ? ' at every step' : ' (it moved)'), 'the hand-over\'s: the model, the plant, the ice and the hash untouched', fpOk && N.fingerprint(sim) === fp0);
  row('MUST', name + ': ten minutes past, the clock', 'k +' + (sim.night.k - kH) + ', t +' + f(sim.t - tH, 2) + ' s', '2,400 steps of dt', sim.night.k === kH + 2400 && sim.t === tH + 2400 * dt);
  row('MUST', name + ': the wireless past the hand-over', 'silent from ' + (W.gone === tH ? 'the hand-over\'s own step' : f(W.gone, 2) + ' s') + ' (' + W.set.why + '); rockets ' + ((W.rockets ? JSON.stringify(W.rockets.fired) : '') === rk0 ? 'none after' : 'FIRED'), 'silent from the hand-over (the readers step after the model on it); no rocket after', W.gone === tH && W.set.working === false && (W.rockets ? JSON.stringify(W.rockets.fired) : '') === rk0);
  row('MUST', name + ': Carpathia past the hand-over', f(nm0, 2) + ' to ' + f(carp(), 2) + ' nm in ten minutes', 'on her way: the other ships keep their courses', carp() < nm0);
  row('MUST', name + ': the boats and the reports past the hand-over', (JSON.stringify(sim.people.boats) === B0 ? 'the boats as they were left' : 'the boats CHANGED') + '; the reports ' + (sim.reports.done ? 'done' : 'running'), 'as left at the hand-over (their hours after are W17); the reports done there', JSON.stringify(sim.people.boats) === B0 && sim.reports.done === true);
  while (!sim.fall.done && sim.night.k < kH + 40 * 240) { N.step(sim); look(); }
  row('MUST', name + ': to the bed', 'done at step ' + sim.night.k + ', the fingerprint ' + N.fingerprint(sim), 'both pieces at rest; the fingerprint the hand-over\'s', sim.fall.done && N.fingerprint(sim) === fp0);
  row('MUST', name + ': the core after the hand-over', [sim.zO, sim.pitch, sim.roll].map(String).join(',') === pose ? 'never stepped' : 'MOVED', 'the hand-over stops the core (Z3\'s design, 1)', [sim.zO, sim.pitch, sim.roll].map(String).join(',') === pose && sim.foundered === !onset);
  const airs = sim.fall.eng.bodies.map(b => b.K.airAt).join(', '), bow = sim.fall.pieces.find(p => p.id === 'bow');
  row('MUST', name + ': the fall', 'rule ' + sim.fall.rule + ', t0 ' + f(sim.fall.t0, 2) + ' s, cut at ' + f(bow.x0, 2) + '; the air ' + airs,
    onset ? 'rule break, t0 the onset\'s time, cut at its station; the air where it lay (K0.airAtBreak \'' + F.K0.airAtBreak + '\', D98)' : 'rule flag, cut at the girder\'s X_BREAK; the air K0.airAt \'' + F.K0.airAt + '\'',
    onset ? sim.fall.rule === 'break' && sim.fall.t0 === tH && Math.abs(bow.x0 - fd.x) < 1e-9 && sim.fall.eng.bodies.every(b => b.K.airAt === F.K0.airAtBreak) : sim.fall.rule === 'flag' && sim.fall.eng.bodies.every(b => b.K.airAt === F.K0.airAt));
  const ba = sim.fall.breakAt;
  for (const p of sim.fall.pieces) {
    const i = sim.fall.pieces.indexOf(p), w = F.worldOf(sim.fall, i, [0.5 * (p.x0 + p.x1), 0, 10]), R = F.quatR(p.q, new Float64Array(9)), roll = Math.atan2(R[7], R[8]) * DEG;
    const un = sim.fall.events.find(e => e.id === 'under' && e.piece === p.id), re = sim.fall.events.find(e => e.id === 'rest' && e.piece === p.id);
    row('CHECK', name + ': the ' + p.id + ' on the bed', 'under +' + f(un ? un.t - tH : NaN, 1) + ' s; at rest +' + f(re ? (re.t - tH) / 60 : NaN, 2) + ' min, roll ' + f(roll, 1) + ', ' + f(Math.hypot(w[0] - ba[0], w[1] - ba[1]), 0) + ' m from breakAt', 'the wreck: upright; the bow 772 m and the stern 148 m from the point under the break (R5 10a)', Math.abs(roll) < 30);
  }
  return { sim, onset, fd, tH, kH, fp0, circ0, P0p, P0l, trace };
}

// ================================================================ the default (D98): the hand-over at the break's onset
const D = handOver({}, 'THE DEFAULT (the onset)');
const sim = D.sim, fd = D.fd, fp0 = D.fp0, kF = D.kH, B1 = bits(sim.fall), kBed = sim.night.k;
{
  // G2 at the onset: handed over before the plant's own break (its 20 deg rule), so lit; the forward piece is cut from
  // her dynamos at the break, and the stern burns while they run down by the plant's own law for broken mains
  const circ0 = D.circ0, trace = D.trace, p0 = D.P0p, lights0 = D.P0l;
  const Lf = sim.fall.lights, eng = sim.fall.eng.lights, t0O = sim.fall.t0, PL = Sys.PLANT;
  const ib = sim.fall.pieces.findIndex(p => p.id === 'bow'), is = sim.fall.pieces.findIndex(p => p.id === 'stern');
  const G = CI.table(ship), nS = circ0.sections.length;
  let place = true, nb = 0, ns = 0, hb = 0, hs = 0;
  const blown = [];
  for (let j = 0; j < nS; j++) {
    const want = G.x[j] >= fd.x ? ib : is, o0 = circ0.sections[j].out, o = Lf.sections.out[j];
    if (Lf.sections.piece[j] !== want) place = false;
    if (want === ib) nb++; else ns++;
    if (o0 >= 0 ? o !== o0 : (o >= 0 && !(o > t0O))) place = false;
    if (o0 < 0) { if (want === ib) hb += circ0.sections[j].share; else hs += circ0.sections[j].share; }
    if (o0 < 0 && o >= 0) blown.push(j);
  }
  say('G2 AT THE ONSET: handed over lit (the plant\'s lights ' + lights0 + ', its steam ' + f(p0, 4) + ' of working pressure; the circuits holding ' + f(circ0.held, 4) + ' of her light, ' + circ0.out + ' of ' + nS + ' sections\' fuses blown): the bow ' + nb + ' sections (' + f(hb, 4) + ' of her light), the stern ' + ns + ' (' + f(hs, 4) + ')');
  row('MUST', 'G2 at the onset: each section on the piece its middle lies in, its fuses as the circuits had them', place ? nb + ' on the bow, ' + ns + ' on the stern; ' + circ0.out + ' out at the hand-over, as G1 left them' : 'NOT', 'by its middle against the cut (x ' + f(fd.x, 2) + '); a fuse blown before the hand-over keeps its time, one blown in the fall comes after t0', place);
  row('MUST', 'G2 at the onset: her light across the cut', 'held at the hand-over: the bow ' + f(hb, 4) + ' + the stern ' + f(hs, 4) + ' = ' + f(hb + hs, 4) + ' (the circuits\' ' + f(circ0.held, 4) + '); at the first step the bow lit ' + f(trace[0][2][ib], 4) + ', the stern ' + f(trace[0][2][is], 4),
    'the two pieces\' sections hold what the circuits held, to 1e-12 (summed in the table\'s order); the bow\'s none of it from the break', Math.abs(hb + hs - circ0.held) < 1e-12 && trace[0][2][ib] === 0 && trace[0][2][is] > 0 && trace[0][2][is] <= hs + 1e-15);
  const bowDark = Lf.dark[ib] === t0O && trace.every(r => r[1][ib] === 0 && r[2][ib] === 0);
  row('MUST', 'G2 at the onset: the forward piece dark from the break', bowDark ? 'dark at t0 and at every step after (its level 0, its light 0)' : 'NOT', 'its leads cut at the break: both dynamo sets stand aft of it (zones ' + PL.rooms2.el + ' and ' + PL.emergency.zone + ')', bowDark && eng.main === is && eng.em === is);
  const tAn = (p0 - PL.pDynamo) * PL.breakTau, kD = trace.findIndex(r => Math.max(0, p0 - (r[0] - t0O) / PL.breakTau) <= PL.pDynamo), tWant = kD >= 0 ? trace[kD][0] : NaN;
  const flooded = eng.el || eng.emWet, sternLit = trace.every(r => r[0] < Lf.dark[is] ? r[1][is] === 1 : r[1][is] === 0);
  const sternOk = sternLit && (Lf.dark[is] === tWant || (eng.el && eng.emWet && Lf.dark[is] < tWant)) && tWant - t0O >= tAn && tWant - t0O < tAn + dt + 1e-9;
  row('MUST', 'G2 at the onset: the stern lit until its dynamos run down', 'all her light on it until +' + f(Lf.dark[is] - t0O, 2) + ' s after the break, then dark' + (flooded ? ' (its dynamos flooded: main ' + eng.el + ', emergency ' + eng.emWet + ')' : '; its dynamos dry'),
    'the plant\'s law for broken mains: dark on the first step its steam is at pDynamo or under, (' + f(p0, 4) + ' - ' + PL.pDynamo + ') x ' + PL.breakTau + ' = ' + f(tAn, 2) + ' s (or sooner, if the sea floods both sets)', sternOk);
  const fuseOk = blown.every(j => Lf.sections.piece[j] === is && Lf.sections.out[j] > t0O && Lf.sections.out[j] < Lf.dark[is] && eng.air[j]);
  const bt = blown.map(j => Lf.sections.out[j] - t0O);
  row('MUST', 'G2 at the onset: a fuse blows in the fall only where the sea reaches switches in the air, with current', blown.length + ' blown, all on the stern' + (blown.length ? ', from +' + f(Math.min(...bt), 2) + ' to +' + f(Math.max(...bt), 2) + ' s' : ''),
    'on the piece with current, before it went dark, where the switches stood in the air at the hand-over (G1\'s fuse, the sea outside her in the fall)', fuseOk);
  // nothing fed back: the same hand-over begun with no plant and no circuits carries no lights and falls to the same bits
  const bare = Object.create(sim); bare.plant = undefined; bare.circuits = undefined; bare.fall = undefined;
  const fb = F.begin(bare, { any: true, cut: fd.x, rule: 'break', t0: fd.t });
  while (!fb.done && fb.k < sim.fall.k) F.advance(fb);
  row('MUST', 'G2: her lights feed nothing back', (motion(fb) === motion(sim.fall) ? 'the same bits' : 'DIFFERENT') + ' to the bed with her lights and without (lights ' + (fb.lights === null ? 'null' : 'SET') + ' with no plant)', 'the pieces\' places, attitudes, velocities, burial and events to the bit (the design: class A)', motion(fb) === motion(sim.fall) && fb.lights === null);
  const unS = sim.fall.events.find(e => e.id === 'under' && e.piece === 'stern');
  row('CHECK', 'G2 at the onset: the stern\'s lights against the witnesses', 'the bow dark at the break; the stern dark +' + f(Lf.dark[is] - t0O, 2) + ' s after it, under +' + f(unS ? unS.t - t0O : NaN, 1) + ' s',
    'the stern dark after the bow and no later than it goes under (Ranger: they burned until it went under; Beesley: one flash; Crawford: forward first)', Lf.dark[is] > Lf.dark[ib] && !!unS && Lf.dark[is] <= unS.t);
}

// ================================================================ B4's gate 1 (join 20's plan): the joint at the onset
// With the fall's own switch K0.jointOnset at 1 (0 until join 20) the reader joins the pieces at the onset's station in
// its sense; the watch's fingerprint holds through the joined fall to the bed (gate 6)
{
  const keep = F.K0.jointOnset;
  F.K0.jointOnset = 1;
  try {
    const sj = watch(), fj = sj.onset.found, fpj = N.fingerprint(sj), want = fj.sense === 'sagging' ? -1 : 1;
    N.step(sj);
    const J = sj.fall && sj.fall.eng.joint;
    row('MUST', 'gate 1: the joint at the onset (K0.jointOnset 1)', J ? 'joined at x ' + f(J.xb, 2) + ', ' + (J.sense < 0 ? 'sag' : 'hog') : 'NO JOINT', 'at the onset\'s own station and in its sense (' + fj.sense + ' at x ' + f(fj.x, 2) + ')', !!J && J.xb === fj.x && J.sense === want);
    let fpOk = true;
    while (!sj.fall.done && sj.night.k < fj.k + 40 * 240) { N.step(sj); if (N.fingerprint(sj) !== fpj) fpOk = false; }
    row('MUST', 'gate 1: the joined fall to the bed, the fingerprint', (fpOk ? 'the onset\'s at every step' : 'MOVED') + '; ' + (J && J.released ? 'let go at +' + f(J.release.t - sj.fall.t0, 1) + ' s by ' + J.release.by : 'held to the bed'), 'nothing fed back (gate 6): the model stands still past the hand-over', fpOk && sj.fall.done && N.fingerprint(sj) === fpj);
  } finally { F.K0.jointOnset = keep; }
}

// ================================================================ replays, the page's begin, the forecast, readers off
const snap = N.snapshot(sim), sim2 = N.resume(ship, snap);
row('MUST', 'a snapshot on the bed, resumed', sim2.fall && bits(sim2.fall) === B1 ? 'the same bits' : 'DIFFERENT', 'a night is its seed and its orders: the fall to the bit', !!sim2.fall && bits(sim2.fall) === B1 && N.fingerprint(sim2) === fp0);
const sim3 = N.resume(ship, { spec: snap.spec, k: kF + 600, log: snap.log });
while (!sim3.fall.done && sim3.night.k < kBed) N.step(sim3);
row('MUST', 'resumed 150 s past the hand-over, run on to the bed', bits(sim3.fall) === B1 ? 'the same bits' : 'DIFFERENT', 'to the bit', bits(sim3.fall) === B1);
const simE = watch();
F.begin(simE, { any: true, cut: fd.x, rule: 'break', t0: fd.t });
let kE = 0; while (!simE.fall.done && kE < 40 * 240) { F.step(simE); kE++; }
row('MUST', 'the page\'s eager begin (on the hand-over\'s step, then step)', (bits(simE.fall) === B1 ? 'the same bits' : 'DIFFERENT') + ' over ' + kE + ' steps', 'the reader\'s lazy fall to the bit (Z3\'s design, 3)', bits(simE.fall) === B1);
const fc = N.forecastOf(sim);
row('MUST', 'forecastOf past the hand-over', 'fall' in fc ? 'carries sim.fall' : 'leaves sim.fall behind', 'a reader\'s state stays behind by its key', !('fall' in fc));
const simOff = watch({ readers: false }); for (let k = 0; k < 40; k++) N.step(simOff);
row('MUST', 'readers off, ten seconds past the hand-over', (simOff.fall ? 'a fall' : 'no fall') + ', fingerprint ' + N.fingerprint(simOff) + (simOff.night.onset && simOff.night.onset.found ? ', its own onset found' : ''), 'no sim.fall, the same onset (the night\'s own check, D76 b), and the same fingerprint', !simOff.fall && N.fingerprint(simOff) === fp0 && simOff.night.k === kF + 40);

// ================================================================ each preset's sea (Z3's design, 8)
const seaOf = (k) => (SC.PRESETS[k] && SC.PRESETS[k].sea) || null;
const seas = Object.keys(SC.PRESETS).map(k => k + ' ' + (seaOf(k) ? f(seaOf(k).depth, 0) + ' m' : 'none')).join(', ');
row('MUST', 'each preset\'s sea', seas, 'the 1912 site\'s 3,790 m where her fall can run; none for hawke and britannic (Z8)', ['titanic', 'four', 'five', 'blank'].every(k => seaOf(k) && seaOf(k).depth === 3790) && !seaOf('hawke') && !seaOf('britannic'));
const pa = C.createSim(ship, {}, SC.PRESETS.titanic.build()); while (!pa.foundered) C.step(pa);
const pb = C.createSim(ship, {}, SC.PRESETS.titanic.build()); while (!pb.foundered) C.step(pb);
F.begin(pa); F.begin(pb, { sea: seaOf('titanic') });
let kp = 0; while ((!pa.fall.done || !pb.fall.done) && kp < 40 * 240) { F.step(pa); F.step(pb); kp++; }
row('MUST', 'the titanic preset\'s sea, given to begin', bits(pa.fall) === bits(pb.fall) ? 'the same bits as the default sea' : 'DIFFERENT', 'its sea is the 1912 sea', bits(pa.fall) === bits(pb.fall));

// ================================================================ the what-if 'flag': today's watch, to the bit
const Fl = handOver({ handover: 'flag' }, 'THE WHAT-IF \'flag\'');
{
  // G2 at the flag: the plant's 20 deg rule broke her mains before the flag, so she is handed over dark
  const s = Fl.sim, L = s.fall.lights, P = s.plant, Sc = s.circuits, dk = P.events.dark;
  const ok = !!L && P.lights === 0 && L.level.every(v => v === 0) && L.dark.every(v => v === dk) && !!L.lit && L.lit.every(v => v === 0) && !!L.sections && L.sections.out.every((o, j) => o === Sc.sections[j].out);
  row('MUST', 'G2 at the flag: her lights as the plant left her', (ok ? 'both pieces dark from the hand-over' : 'NOT AS LEFT') + ', since ' + f(dk / 60, 2) + ' min (the mains broken at ' + f(P.events.break / 60, 2) + '); ' + Sc.out + ' of ' + Sc.sections.length + ' sections\' fuses blown as the circuits had them',
    'dark before the flag (the plant\'s 20 deg rule): each piece\'s level 0, its dark the plant\'s own time; the sections as G1 left them', ok);
}

const lines = out.slice();
lines.push('');
for (const [kind, what, value, ref, ok] of rows) lines.push((kind === 'MUST' ? (ok ? 'PASS ' : 'FAIL ') : (ok ? 'in   ' : 'OUT  ')) + what.padEnd(64) + ' ' + String(value).padEnd(80) + ' ' + ref);
const verdict = fails ? 'FAIL: ' + fails + ' MUST row(s)' : 'PASS: every MUST row (' + rows.filter(r => r[0] === 'MUST').length + '); CHECK rows in range: ' + rows.filter(r => r[0] === 'CHECK' && r[4]).length + ' of ' + rows.filter(r => r[0] === 'CHECK').length;
lines.push('', verdict);
fs.writeFileSync(outFile('night_after_tests.txt'), lines.join('\n') + '\n');
for (const l of lines) console.log(l);
console.log('(' + f((Date.now() - t0) / 1000, 0) + ' s)');
process.exit(fails ? 1 : 0);
