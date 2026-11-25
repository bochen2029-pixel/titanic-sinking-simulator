// P2 and P3 acceptance: the iceberg encounter (core/encounter.js), and the what-ifs it makes possible.
//   node tools/encounter_tests.js [--jobs N]
// MUST rows: invariants and the fitted figures. CHECK rows: record figures that were not fitted, reported with the
// reference; a miss is information.
// Its runs are independent nights (two dozen encounters, half of them sunk afterwards, and eight run twice for X2's
// row), so they are shared among N worker threads (default 4; --jobs 1 runs them in turn in this thread). The table is
// the same to the letter either way: each run builds its own ship and its own night. Until X2 the nights that leave her
// lying in the ice cost about twenty minutes of one core each; the whole suite is now a few minutes of one core, most
// of it the old loop that X2's row runs for comparison.
const fs = require('fs');
const crypto = require('crypto');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const C = require('../core/core.js');
const Mo = require('../core/motion.js');
const E = require('../core/encounter.js');
const R = require('./encounter_run.js');
const SC = require('../core/scenarios.js');
const G1912 = Object.assign({ portAround: 0 }, require('../core/night.js').GEOM_1912);   // e5 (P3), refitted by e9 (M2)
// Hackett and Bedford's opening areas by compartment, per cent (JOM 1998, Table I; G6b: the preset's split since
// 2026-11-20, which the 1912 encounter follows through ICE.openAlong). It was 4/13/21/24/32/6, the water each room held.
const HB = [0.056, 0.139, 0.288, 0.307, 0.260, 0.121, 0].map(a => 100 * a / 1.171);
const f = (x, n) => (x === null || x === undefined ? 'n/a' : x.toFixed(n === undefined ? 1 : n));
const KN = Mo.KN;
// what-ifs: the same berg, another watch
const cases = [
  ['as reconstructed', {}],
  ['helm 5 s sooner', { ahead: G1912.ahead + 5 * 22.5 * KN }],
  ['helm 10 s sooner', { ahead: G1912.ahead + 10 * 22.5 * KN }],
  ['helm 5 s later', { ahead: G1912.ahead - 5 * 22.5 * KN }],
  ['helm 10 s later', { ahead: G1912.ahead - 10 * 22.5 * KN }],
  ['no helm order: straight on', { helm: 0 }],
  ['helm held, no port-around', { portAround: null }],
  ['engines stopped with the helm order', { stopNow: true }],
  ['turned to starboard instead', { helm: 40 }],
  ['15 knots, same distance', { knots: 15 }],
  ['10 knots, same distance', { knots: 10 }],
];
// X2: nights run both ways, with the contact's cull (ICE.cull) and with the loop over every station that it replaced
const CULLS = [
  ['the 1912 encounter', G1912],
  ['the helm 6 s sooner: a touch that dents a dozen stations and barely opens her', Object.assign({}, G1912, { ahead: G1912.ahead + 6 * 22.5 * KN, encounterSecs: 120 })],
  ['the helm 7 s sooner: a miss by five metres', Object.assign({}, G1912, { ahead: G1912.ahead + 7 * 22.5 * KN, encounterSecs: 120 })],
  ['her stem square into the ice, and a minute lying in it', { ahead: 220, port: E.ICE.R, helm: null, encounterSecs: 90 }],
  ['a stem strike off the square (the berg\'s centre 15 m to port of her track)', { ahead: 220, port: E.ICE.R + 15, helm: null, encounterSecs: 90 }],
  ['a graze down her port side with no helm', { ahead: 250, port: E.ICE.R + 49, helm: 0, encounterSecs: 120 }],
  ['on to the ice at 4 knots, and lying against it', { ahead: 60, port: 20, helm: null, knots: 4, encounterSecs: 120 }],
  ['the 1912 encounter with a berg that turns', Object.assign({}, G1912, { ice: { turns: true } })],
];

// ---- the runs: each takes plain arguments and gives back plain data
let shipOnce = null;
const theShip = () => shipOnce || (shipOnce = C.buildShip());
const RUNS = {
  digest(withIce) {                              // the same 10 minutes at full speed, with a berg far off or no encounter
    const sim = C.createSim(theShip(), {}, { openings: [], coalListDeg: 2 }); Mo.attach(sim, { order: 'full ahead' }); Mo.rudder(sim, 10);
    if (withIce) E.create(sim, { X: 1e6, Y: 1e6 });
    const h = crypto.createHash('sha256');
    while (sim.t < 600) { if (withIce) E.step(sim); else Mo.step(sim); h.update(Buffer.from(new Float64Array([sim.mo.u, sim.mo.v, sim.mo.r, sim.mo.X, sim.mo.Y, sim.mo.psi, sim.roll, sim.zO, sim.pitch]).buffer)); }
    return h.digest('hex');
  },
  e1912() {                                      // the 1912 encounter, then the engines stopped and the core left to sink her
    const sim = R.encounter(G1912, theShip()), s = E.summary(sim), e = sim.enc;
    let metres = 0;                              // P3c: stations every 0.125 m, their tears gathered into one opening per metre of hull, band and side
    for (const D of [e.stbd, e.port]) for (let k = 0; k < e.bands.length; k++) { const B = e.bands[k], torn = new Set(); for (let i = 0; i < B.n; i++) if (D[k].dent[i] > B.dt[i]) torn.add(B.gid[i]); metres += torn.size; }
    const openings = sim.openings.length;
    R.sinkOn(sim, 6 * 3600);
    return { s, metres, openings, foundered: sim.foundered, founderT: sim.founderT };
  },
  repeat() { return E.summary(R.encounter(G1912, theShip())).stbd.excess; },
  miss() {
    const miss = R.encounter(Object.assign({}, G1912, { ahead: G1912.ahead + 15 * 22.5 * KN }), theShip()), ms = E.summary(miss);
    let water = 0; for (let n = 0; n < C.NN; n++) water += miss.vol[n];
    return { kind: ms.kind, minGap: ms.minGap, openings: miss.openings.length, water };
  },
  square() {                                     // her stem square into the ice (the berg's centre on her track), no order given
    const sq = R.encounter({ ahead: 220, port: E.ICE.R, helm: null }, theShip()), qs = E.summary(sq);
    R.sinkOn(sq, 8 * 3600);
    return { crush: qs.bow.crush, Fmax: qs.Fmax, open: C.ZONES.filter((z, k) => qs.bow.zone[k] > 0).map(z => z.short).join(' '), foundered: sq.foundered, founderT: sq.founderT };
  },
  // S1b: slow strikes against the note's figures (fixed face: a berg too heavy to move; the note assumed 5 % added mass, the model has 4 %)
  fixed(kn) { return E.summary(R.encounter({ ahead: 200, port: E.ICE.R, helm: null, knots: kn, ice: { mass: 1e15 }, encounterSecs: 200 }, theShip())).bow.crush; },
  free10() { return E.summary(R.encounter({ ahead: 200, port: E.ICE.R, helm: null, knots: 10, encounterSecs: 200 }, theShip())).bow.crush; },
  whatif(i) {
    const [label, ch] = cases[i];
    const o = Object.assign({}, G1912, ch), w = R.encounter(o, theShip()), ws = E.summary(w), a = ws.stbd.area + ws.port.area;
    const zs = []; for (let k = 0; k < 16; k++) if (ws.stbd.zone[k] + ws.port.zone[k] + ws.bow.zone[k] > 1e-6) zs.push(C.ZONES[k].short);
    let side = ''; if (ws.bow.area > 0) side += 'bow crushed ' + f(ws.bow.crush, 0) + ' m';
    if (ws.stbd.tears) side += (side ? ', ' : '') + 'stbd x ' + ws.stbd.tearFrom + '..' + ws.stbd.tearTo; if (ws.port.tears) side += (side ? ', ' : '') + 'port x ' + ws.port.tearFrom + '..' + ws.port.tearTo;
    R.sinkOn(w, 8 * 3600);
    const fate = w.foundered ? 'founders at ' + f(w.founderT / 60, 0) + ' min' : (a + ws.bow.area > 0 ? 'afloat at 8 h' : 'no damage');
    return '  ' + label.padEnd(38) + (ws.kind + (ws.kind === 'miss' ? ' by ' + f(ws.minGap, 1) + ' m' : '')).padEnd(16) + side.padEnd(50) + (f(a, 2) + ' m2 seams').padEnd(16) + (ws.stbd.dents + ws.port.dents + ' dents').padEnd(10) + zs.join(' ').padEnd(36) + fate;
  },
  // X2: one night twice, the contact looking at every station (as it did until X2) and passing over those that cannot
  // count. Hashed: her motion, the smallest gap, the contact and the flooding at every step; at the end every dent,
  // every node of the ice's outline, every opening and the water in every space.
  cull(i) {
    const hashes = [];
    for (const cull of [false, true]) {
      const h = crypto.createHash('sha256'), put = (a) => h.update(Buffer.from(a.buffer, a.byteOffset, a.byteLength));
      const each = (sim) => { const m = sim.mo, e = sim.enc; put(new Float64Array([m.u, m.v, m.r, m.X, m.Y, m.psi, sim.roll, sim.zO, sim.pitch, sim.inflow, e.minGap, e.area, e.bow, e.crushed, e.berg.X, e.berg.Y, e.berg.PSI])); };
      const o = CULLS[i][1], sim = R.encounter(Object.assign({}, o, { ice: Object.assign({}, o.ice, { cull }), each }), theShip()), e = sim.enc;
      for (const D of [e.stbd, e.port]) for (const b of D) { put(b.dent); put(b.t0); }
      for (const r of e.rIce) put(r);
      put(Float64Array.from(sim.vol));
      h.update(JSON.stringify([sim.openings.map(p => [p.id, p.x, p.y, p.z, p.area]), e.tFirst, e.tLast, e.Fmax, e.berg.VX, e.berg.VY, e.berg.W, E.summary(sim).kind]));
      hashes.push(h.digest('hex'));
    }
    return hashes;
  },
};

if (!isMainThread) parentPort.postMessage(RUNS[workerData.run](workerData.arg));
else {
  const ji = process.argv.indexOf('--jobs'), jobs = ji >= 0 ? Math.max(1, +process.argv[ji + 1] || 1) : 4;
  // [key, run, argument], the long ones first so that the threads end together
  // (the nights run both ways come last: with --jobs 1 everything shares one thread, and the engine runs the contact
  // some four times slower once it has seen both of its paths)
  const todo = [['e1912', 'e1912'], ['square', 'square']].concat(cases.map((c, i) => ['whatif' + i, 'whatif', i]),
    [['repeat', 'repeat'], ['miss', 'miss'], ['fixed10', 'fixed', 10], ['fixed225', 'fixed', 22.5], ['free10', 'free10'], ['digestIce', 'digest', true], ['digestNone', 'digest', false]],
    CULLS.map((c, i) => ['cull' + i, 'cull', i]));
  const got = {};
  const all = jobs === 1
    ? Promise.resolve().then(() => { for (const [key, run, arg] of todo) got[key] = RUNS[run](arg); })
    : new Promise((resolve, reject) => {
      const queue = todo.slice(); let busy = 0;
      const next = () => {
        if (!queue.length && !busy) return resolve();
        while (queue.length && busy < jobs) {
          const [key, run, arg] = queue.shift(); busy++;
          const w = new Worker(__filename, { workerData: { run, arg } });
          w.on('message', (v) => { got[key] = v; });
          w.on('error', reject);
          w.on('exit', () => { busy--; next(); });
        }
      };
      next();
    });
  all.then(() => {
    const rows = []; let fails = 0;
    const row = (kind, what, value, ref, ok) => { rows.push([kind, what, value, ref, ok]); if (kind === 'MUST' && !ok) fails++; };
    row('MUST', 'far from the ice, Encounter.step is exactly Motion.step (10 min turning)', got.digestIce.slice(0, 12), got.digestNone.slice(0, 12), got.digestIce === got.digestNone);

    // the 1912 encounter
    const s = got.e1912.s, tot = s.stbd.area + s.port.area;
    const sp = [...Array(16).keys()].map(k => (tot > 0 ? 100 * s.stbd.zone[k] / tot : 0));
    row('MUST', '1912 geometry: tears begin at the stem, starboard side only', 'starboard x ' + s.stbd.tearFrom + ' to ' + s.stbd.tearTo + ', port tears ' + s.port.tears, 'forepeak (x 117-129) aft; nothing to port', s.stbd.tearFrom >= 117 && s.port.tears === 0);
    row('MUST', '1912 geometry: total opening [alpha fitted]', f(tot, 4) + ' m2', f(SC.CALIBRATED_AREA, 4) + ' m2, the core\'s calibrated area (' + f(SC.CALIBRATED_AREA * 10.7639, 2) + ' sq ft; 0.7506 before join 6)', Math.abs(tot - SC.CALIBRATED_AREA) < 1e-6);
    row('MUST', 'dents without water exist, and only torn metres of hull are openings (one each, band and side)', s.stbd.dents + ' dents, ' + s.stbd.tears + ' torn stations in ' + got.e1912.metres + ' metres, ' + got.e1912.openings + ' openings', 'openings = torn metres', s.stbd.dents > 0 && got.e1912.openings === got.e1912.metres);
    row('CHECK', '1912 geometry: tears end', 'x ' + s.stbd.tearTo + ' (' + C.ZONES[C.zoneAt(s.stbd.tearTo)].short + ')', 'boiler room 5, x 54 to 37 (Hackett and Bedford)', s.stbd.tearTo >= 30 && s.stbd.tearTo <= 60);
    const se = sp.reduce((a, v, k) => a + Math.abs(v - (k < 7 ? HB[k] : 0)), 0);
    row('CHECK', '1912 split FP/H1/H2/H3/BR6/BR5/BR4 %', sp.slice(0, 7).map(v => v.toFixed(0)).join('/'), '5/12/25/26/22/10/0 (Hackett and Bedford\'s areas, JOM 1998 Table I; G6b shares the opening so); error ' + se.toFixed(0) + ' points', se <= 30);
    row('CHECK', '1912 contact', f(s.dur, 1) + ' s, peak ' + f(s.Fmax / 1e6, 1) + ' MN', 'a grinding felt by few; about 10 s (Halpern) [soft]', s.dur >= 5 && s.dur <= 20);
    // the switch for G6's tear rule (G7's design, section 3): a night run without it is a what-if through the night's own
    // ice overrides (spec.ice); absent, or present and equal to the rule as landed, the 1912 encounter is the same to the bit
    {
      const sOff = E.summary(R.encounter(Object.assign({}, G1912, { ice: { tearAlong: null } }), theShip()));
      const sSame = E.summary(R.encounter(Object.assign({}, G1912, { ice: { tearAlong: E.ICE.tearAlong } }), theShip()));
      const same = sSame.stbd.area === s.stbd.area && sSame.stbd.tearTo === s.stbd.tearTo && sSame.stbd.tears === s.stbd.tears;
      row('MUST', 'the switch for G6\'s tear rule is neutral: the 1912 encounter with the rule given as landed is the encounter, to the bit', f(sSame.stbd.area + sSame.port.area, 9) + ' m2, tears to x ' + sSame.stbd.tearTo, 'the same: ' + f(s.stbd.area + s.port.area, 9) + ' m2, to x ' + s.stbd.tearTo, same);
      row('CHECK', '  ... and off (a what-if): the 1912 tear without G6\'s rule', 'tears x ' + sOff.stbd.tearFrom + '..' + sOff.stbd.tearTo + ', ' + f(sOff.stbd.area + sOff.port.area, 4) + ' m2', 'into boiler room 5\'s stokehold side, aft of the bunker, as before G6', sOff.stbd.tearTo < s.stbd.tearTo);
    }
    // the calibration epoch's C6 (D82b): the bunker's own opening on a night (ICE.bunkerOpen, through spec.ice). Absent, or
    // given as null, the 1912 encounter is the same to the bit; given, the torn stations along the bunker open it between
    // them and every other compartment opens as it does
    {
      const run = (ice) => { const sim = R.encounter(Object.assign({}, G1912, { ice }), theShip()), k = sim.pockets.find(p => /bunker/.test(p.name)), j = sim.pockets.indexOf(k); return { s: E.summary(sim), inPocket: sim.openings.filter(o => sim.conn.pk[o.conn] === j).reduce((a, o) => a + o.area, 0), ops: sim.openings.map(o => o.area) }; };
      const bits = (a, b) => a.stbd.area === b.stbd.area && a.stbd.excess === b.stbd.excess && a.stbd.tears === b.stbd.tears && a.stbd.tearTo === b.stbd.tearTo && a.Fmax === b.Fmax && a.minGap === b.minGap && Array.from(a.stbd.zone).every((v, k) => v === b.stbd.zone[k]);
      // since the epoch's landing (D4) "absent" is the landed opening (ICE.bunkerOpen) and null is the region's share, as
      // absent was before: absent and the landed number given are the same to the bit; null gives boiler room 5 its share
      const none = run(undefined), landed = run({ bunkerOpen: E.ICE.bunkerOpen }), nul = run({ bunkerOpen: null }), half = run({ bunkerOpen: 0.0425 }), z = SC.BUNKER_ZONE;
      const sameOps = none.ops.length === landed.ops.length && none.ops.every((a, i) => a === landed.ops[i]);
      row('MUST', 'the bunker\'s own opening (C6): absent, the 1912 encounter is the encounter, and the landed opening given (' + E.ICE.bunkerOpen + ' m2) the same to the bit, every opening; null gives boiler room 5 its region\'s share', f(landed.s.stbd.area + landed.s.port.area, 9) + ' m2, ' + landed.ops.length + ' openings, boiler room 5 ' + f(landed.s.stbd.zone[z], 9) + '; null: boiler room 5 ' + f(nul.s.stbd.zone[z], 6), 'the same: ' + f(tot, 9) + ' m2, ' + got.e1912.openings + ' openings, ' + f(s.stbd.zone[z], 9) + '; null another share', bits(none.s, s) && bits(landed.s, s) && sameOps && landed.ops.length === got.e1912.openings && (E.ICE.bunkerOpen === null || nul.s.stbd.zone[z] !== s.stbd.zone[z]));
      const others = Array.from(half.s.stbd.zone).reduce((a, v, k) => (k === z ? a : Math.max(a, Math.abs(v - s.stbd.zone[k]))), 0);
      row('MUST', '  ... and given (0.0425 m2): the torn stations along the bunker open it between them; every other compartment opens as it does', 'boiler room 5 ' + f(half.s.stbd.zone[z], 9) + ' m2 (it was ' + f(s.stbd.zone[z], 6) + '); the others moved at most ' + others.toExponential(1) + ' m2', '0.042500000 m2; the others within 1e-9 m2', Math.abs(half.s.stbd.zone[z] - 0.0425) < 1e-12 && others < 1e-9 && half.s.stbd.tears === s.stbd.tears);
      row('CHECK', '  ... of which in the bunker\'s pocket (a metre of hull is one opening: the metres at the bunker\'s ends carry part to the stokehold and to boiler room 6)', f(half.inPocket, 6) + ' of 0.0425 m2 (' + f(100 * half.inPocket / 0.0425, 0) + ' %); as landed ' + f(none.inPocket, 6) + ' of ' + f(s.stbd.zone[z], 6) + ' (' + f(100 * none.inPocket / s.stbd.zone[z], 0) + ' %)', 'the same share either way; the preset\'s holes are all in the pocket', Math.abs(half.inPocket / 0.0425 - none.inPocket / s.stbd.zone[z]) < 0.01);
    }
    row('CHECK', 'helm order before the impact', f(s.tFirst, 1) + ' s', '20-25 s from the order (Halpern\'s reconstruction); "about half a minute" from the bells (Hichens)', s.tFirst >= 15 && s.tFirst <= 30);
    row('CHECK', '1912 encounter, then sunk by the unmodified core (no pumps)', got.e1912.foundered ? f(got.e1912.founderT / 60, 1) + ' min' : 'afloat', '157.2 min with the hand-made damage and its pumps, 154.6 without (S1; 156.9 and 154.5 after Y3); 160 min observed', got.e1912.foundered && Math.abs(got.e1912.founderT / 60 - 157.2) <= 5);
    row('MUST', 'the same night twice gives the same damage, bit for bit', f(got.repeat, 12), f(s.stbd.excess, 12), got.repeat === s.stbd.excess);

    // the miss
    row('MUST', 'the helm 15 s sooner: a miss, and no water aboard', got.miss.kind + ', clearance ' + f(got.miss.minGap, 1) + ' m', 'no openings, no flood water', got.miss.kind === 'miss' && got.miss.openings === 0 && got.miss.water === 0);

    // a stem strike: her stem square into the ice (the berg's centre on her track), no order given
    const P = E.ICE, sq = got.square;
    row('MUST', 'stem square into the ice at 22.5 knots: the bow crushes, the force is the bow\'s at its depth (S1b)', 'bow crushed ' + f(sq.crush, 1) + ' m, peak ' + f(sq.Fmax / 1e6, 1) + ' MN',
      'between 15 and 28.8 m (28.8 m against a fixed face, the bow note\'s option B; this berg gives way); ' + f(P.bowF / 1e6, 0) + ' + ' + f(P.bowFk / 1e6, 1) + ' MN a metre', sq.crush > 15 && sq.crush < 28.8 && Math.abs(sq.Fmax - (P.bowF + P.bowFk * sq.crush)) < 1e6);
    row('MUST', 'stem strikes against a fixed face: 10 and 22.5 knots (S1b)', f(got.fixed10, 2) + ' m, ' + f(got.fixed225, 2) + ' m', '7.3 m and 28.8 m (the bow note, section 6, option B), within 5 %', Math.abs(got.fixed10 / 7.3 - 1) < 0.05 && Math.abs(got.fixed225 / 28.8 - 1) < 0.05);
    row('CHECK', 'a slow stem strike: 10 knots into the 100,000-t berg', 'bow crushed ' + f(got.free10, 1) + ' m', 'section-based laws with rate effects 5.5-11.5 m against a fixed face; the one FE study 24.7 m (the bow note, 3.6)', got.free10 >= 4 && got.free10 <= 11.5);
    row('CHECK', 'stem square into the ice, then the core', sq.foundered ? 'founders at ' + f(sq.founderT / 60, 0) + ' min' : 'afloat, ' + sq.open + ' open', 'afloat with the bow crushed 80 to 100 ft (Wilding, British inquiry)', !sq.foundered);

    // X2: the contact looks only at the stations within reach, and nothing changes by it
    const cu = CULLS.map((c, i) => got['cull' + i]);
    row('MUST', 'the contact passes over only stations that cannot count: ' + CULLS.length + ' nights both ways, hashed at every step (X2)', cu.map(h => h[1].slice(0, 6)).join(' '), 'with every station looked at: ' + cu.map(h => h[0].slice(0, 6)).join(' '), cu.every(h => h[0] === h[1]));

    for (const [kind, what, value, ref, ok] of rows) console.log((kind === 'MUST' ? (ok ? 'PASS ' : 'FAIL ') : (ok ? 'in   ' : 'OUT  ')) + what.padEnd(78) + ' ' + String(value).padEnd(38) + ' ' + ref);

    console.log('\nWHAT IF: the same berg and the same physics, another watch (engines stopped 60 s after the first touch; the core then sinks her or not)');
    const lines = cases.map((c, i) => got['whatif' + i]);
    for (const line of lines) console.log(line);
    fs.writeFileSync(require('./outdir')('encounter_whatifs.txt'), lines.join('\n') + '\n');
    console.log(fails ? '\nFAIL: ' + fails + ' MUST row(s)' : '\nPASS: every MUST row (' + rows.filter(r => r[0] === 'MUST').length + '); CHECK rows in range: ' + rows.filter(r => r[0] === 'CHECK' && r[4]).length + ' of ' + rows.filter(r => r[0] === 'CHECK').length);
    process.exit(fails ? 1 : 0);
  }).catch((e) => { console.log('FAIL: a run could not finish: ' + (e && e.message)); process.exit(1); });
}
