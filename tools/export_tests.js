// U0's suite (docs/BRAINSTORM_titanic_in_unreal_v1_2026-11-20.md, section 7): the ship's export (tools/export_ship.js) and
// the recorded night (tools/record_night.js), headless.
//   node tools/export_tests.js          (about a minute: each file is made twice, each time in a process of its own)
// MUST rows: each file the same bytes from two runs; the recorded night's fingerprint the model's own, run alone (no
// readers, no record; core/night.js's run and sink, as tools/night_run.js runs it), at the end of the encounter and at
// the flag; the values against the model: the ship's sampled tables against the functions they sample, its openings,
// spaces, funnels and boats against the model's; the night's pose, place, speed, water, plant and her waterline at ten
// stations (from the record's pose by the file's own frames, not the core's code) against a run of the model at chosen
// steps; her lights by circuit (G1: the sections, the step each one's fuses blew, her light) against the circuits reader
// on that run; the fall's place, filled (--fall), leaves the watch's record as it was and hands over at the core's pose.
// CHECK rows print what is worth seeing: what thinning the record would miss (why it keeps every step); the fall.
// The table this prints is the manifest of the files, which are not tracked; tools/gate.js compares it with
// out/export_tests.txt. Lines that begin "~ " are volatile there (the coordinator's decision of 2026-11-20): each file's
// size and sha256 and the git blob ids of its sources, which move with any edit to a source, a comment too. What is
// pinned moves only when the exported numbers move: each file's data without its provenance (`made`, and the ship's
// `notes`: the sources' comments and their line numbers), its size and digest; the fingerprints and steps; the spot
// checks' values. Two runs giving the same bytes is a MUST row. When the pin moves the gate says STALE: look, and run
// it again with --write if the move is meant. Nothing is written: the runs go to a temporary folder, deleted after.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const C = require('../core/core.js');
const N = require('../core/night.js');
const Sys = require('../core/systems.js');
const TS = require('../site/topsides.js');
const BP = require('../core/readers/people.js');
const CIR = require('../core/readers/circuits.js');
const J = require('./export_json.js');
const XS = require('./export_ship.js');
const RN = require('./record_night.js');

const root = path.join(__dirname, '..');
const rows = []; let fails = 0, checks = 0;
function row(kind, what, value, ref, ok) { rows.push([kind, what, value, ref, ok]); if (!ok) { if (kind === 'MUST') fails++; else checks++; } }
const f = (x, n) => (x === null || x === undefined || Number.isNaN(x) ? 'n/a' : (+x).toFixed(n === undefined ? 2 : n));
const half = (d) => 0.5 * Math.pow(10, -d) + 1e-9;           // what writing at d decimals may move a number by

function run(args, dir) {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, args, { cwd: root, env: Object.assign({}, process.env, { TITANIC_OUT: dir }), stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', (d) => { out += d; }); p.stderr.on('data', (d) => { err += d; });
    p.on('error', (e) => { err += String(e); });
    p.on('close', (code) => resolve({ code, out, err }));
  });
}
// the pose's frame from the file's own words (frames.pose): R = Ry(pitch) Rx(roll), t = [XO, YO, zO] - R g0
function frameOfRecord(K, zO, pitch, roll) {
  const cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll), g = K.g0;
  const R = [cp, sp * sr, sp * cr, 0, cr, -sr, -sp, cp * sr, cp * cr];
  const t = [K.XO - (R[0] * g[0] + R[1] * g[1] + R[2] * g[2]), K.YO - (R[3] * g[0] + R[4] * g[1] + R[5] * g[2]), zO - (R[6] * g[0] + R[7] * g[1] + R[8] * g[2])];
  return { R, t };
}
const worldZ = (Fr, p) => Fr.R[6] * p[0] + Fr.R[7] * p[1] + Fr.R[8] * p[2] + Fr.t[2];
// ten stations along her keel and her deck edges at four: the points whose height above the sea is her waterline
const STATIONS = [-130, -100, -70, -40, -10, 20, 50, 80, 110, 128];
const POINTS = STATIONS.map(x => [x, 0, 0]);
for (const x of [-100, -40, 20, 80]) { const z = C.deckZ('B', x), hb = C.halfBreadth(x, Math.min(z, C.zTopAt(x) - 0.01)); POINTS.push([x, hb, z], [x, -hb, z]); }
// a span's value at sample i (null outside it or where it has none)
const at = (sp, i) => { if (!sp) return null; const j = (i - sp.from) / sp.every; return Number.isInteger(j) && j >= 0 && j < sp.v.length ? sp.v[j] : null; };

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'titanic-u0-'));
  const dirs = ['a', 'b', 'c', 'd'].map(s => { const d = path.join(tmp, s); fs.mkdirSync(d); return d; });
  try {
    // ================================================================ 1. the same bytes from two runs, each its own process
    const nightName = RN.nameOf(1912, 'auto', false), fallName = RN.nameOf(1912, 'auto', true);
    const [s1, s2, n1, n2] = await Promise.all([run(['tools/export_ship.js'], dirs[0]), run(['tools/export_ship.js'], dirs[1]),
      run(['tools/record_night.js'], dirs[2]), run(['tools/record_night.js'], dirs[3])]);
    for (const r of [s1, s2, n1, n2]) if (r.code !== 0) throw new Error('a run failed: ' + r.err.trim().split('\n').slice(-3).join(' | '));
    const [f1, f2] = await Promise.all([run(['tools/record_night.js', '1912', 'auto', '--fall'], dirs[0]), run(['tools/record_night.js', '1912', 'auto', '--fall'], dirs[1])]);
    for (const r of [f1, f2]) if (r.code !== 0) throw new Error('a run with the fall failed: ' + r.err.trim().split('\n').slice(-3).join(' | '));
    const read = (d, n) => fs.readFileSync(path.join(d, n));
    const shipA = read(dirs[0], XS.NAME), shipB = read(dirs[1], XS.NAME), nightA = read(dirs[2], nightName), nightB = read(dirs[3], nightName);
    const fallA = read(dirs[0], fallName), fallB = read(dirs[1], fallName);
    const sha = (b) => require('crypto').createHash('sha256').update(b).digest('hex');
    for (const [name, a, b] of [[XS.NAME, shipA, shipB], [nightName, nightA, nightB], [fallName, fallA, fallB]]) {
      row('MUST', name + ': two runs, the same bytes', a.equals(b) ? 'the same bytes' : 'THEY DIFFER (' + a.length + ' and ' + b.length + ' bytes)', 'the same bytes', a.equals(b));
    }

    // ================================================================ 2. the ship against the model
    const ship = JSON.parse(shipA.toString('utf8')), H = ship.hull, B = TS.built();
    {
      // G24: the ship's own hull, her ends with it (ship.hull; the calibration epoch's C3, on since its landing, D4)
      const HULL = C.buildShip().hull, HB = (x, z) => C.halfBreadth(x, z, HULL), z0 = HULL.ends.z0;
      let e = 0, n = 0, nW = 0, wW = 0, wAt = '', below = 0;
      H.stations.x.forEach((x, i) => H.stations.z.forEach((z, j) => {
        const m = HB(x, z), o = C.halfBreadth(x, z);
        e = Math.max(e, Math.abs(H.stations.halfBreadth[i][j] - m)); n++;
        if (m !== o) { if (z <= z0) below++; else { nW++; if (m - o > wW) { wW = m - o; wAt = 'x ' + f(x, 1) + ', z ' + f(z, 2); } } }
      }));
      row('MUST', 'the hull: C.halfBreadth(x, z, ship.hull) sampled, her ends with it, every station at every height', f(e, 6) + ' m off at worst, ' + n + ' samples', '<= ' + f(half(4), 6), e <= half(4));
      row('MUST', '  ... her ends (G24): above ' + z0 + ' m the table is her hull with them, wider where the plans are read; at or below it the hull without them, to the bit',
        nW + ' samples wider, the most ' + f(wW, 3) + ' m (' + wAt + '); ' + below + ' at or below ' + z0 + ' m', 'some wider, none below', nW > 1000 && below === 0);
      let ed = 0, nd = 0;
      H.drawn.x.forEach((x, i) => H.drawn.z.forEach((z, j) => { ed = Math.max(ed, Math.abs(H.drawn.halfBreadth[i][j] - TS.hullDraw(x, z))); nd++; }));
      const fwd = H.stations.x.filter(x => x >= TS.STERN.x0).every(x => H.stations.z.every(z => TS.hullDraw(x, z) === HB(x, z)));
      row('MUST', 'the drawn shell: TS.hullDraw sampled at every station; forward of x0 the model\'s own hull with her ends (G24: TS.useHull, the ship\'s hull), the same as the stations', f(ed, 6) + ' m off at worst, ' + nd + ' samples; forward ' + (fwd ? 'the same' : 'NOT the same'), '<= ' + f(half(4), 6) + '; the same', ed <= half(4) && fwd);
      // T1's rules as the viewer rings her (site/app.js hullRing, hullStations): the round end's and the stern post's own
      // stations sampled; each station's bottom where the viewer finds it; the knuckle down to her waterline by kFwd
      const D = H.drawn, xE = C.xAft(C.zTopAt(C.G.xAP - C.G.sternOverhang));
      const want = [0.012, 0.03, 0.06, 0.1, 0.16, 0.25, 0.37, 0.52, 0.72].map(d => xE + d).concat([TS.STERN.post - 0.02, TS.STERN.post + 0.02]);
      const missing = want.filter(x => !D.x.some(v => Math.abs(v - x) <= half(6))).length;
      const pb = (fn, x) => { const zt = C.zTopAt(x); for (let z = 0; z <= zt; z += 0.05) if (fn(x, z) > 0.02) return z; return null; };
      let eb = 0;
      const cmpB = (b, want) => (want === null ? (b === null ? 0 : Infinity) : (b === null ? Infinity : Math.abs(b - want)));
      D.x.forEach((x, i) => { eb = Math.max(eb, cmpB(D.bottom[i], pb(TS.hullDraw, x))); });
      H.stations.x.forEach((x, i) => { eb = Math.max(eb, cmpB(H.stations.bottom[i], pb(HB, x))); });
      const knuckle = D.x.every((x, i) => Math.abs(D.knuckleZ[i] - TS.knuckleZ(x)) <= half(4)) && D.kFwd === TS.STERN.kFwd;
      // round, not pointed: 12 mm from her end the drawn shell is already half a metre wide, where the model's hull closes to a point
      const iE = D.x.findIndex(v => Math.abs(v - want[0]) <= half(6)), dMax = iE < 0 ? 0 : Math.max(...D.halfBreadth[iE]);
      const mMax = iE < 0 ? 0 : Math.max(...D.z.map(z => HB(D.x[iE], z))), roundEnd = dMax > 0.3 && dMax > 10 * mMax;
      row('MUST', 'T1\'s rules: the drawn shell sampled at the viewer\'s own rings (her round end\'s last 0.72 m, the stern post either side), each station\'s bottom where the viewer finds it, the knuckle down to her waterline by kFwd',
        (want.length - missing) + ' of ' + want.length + ' rings; bottoms ' + f(eb, 6) + ' m off; knuckle ' + (knuckle ? 'as drawn' : 'NOT AS DRAWN') + '; 12 mm from her end ' + f(dMax, 3) + ' m wide (the model\'s hull ' + f(mMax, 3) + ')',
        want.length + ' of ' + want.length + '; <= ' + f(half(4), 6) + '; round', missing === 0 && eb <= half(4) && knuckle && roundEnd);
      let ep = 0;
      H.stations.z.forEach((z, j) => { ep = Math.max(ep, Math.abs(H.stations.stem[j] - C.xFwd(z)), Math.abs(H.stations.stern[j] - C.xAft(z))); });
      H.stations.x.forEach((x, i) => { ep = Math.max(ep, Math.abs(H.stations.top[i] - C.zTopAt(x)), Math.abs(H.stations.weatherTop[i] - C.deckTopAt(x))); for (const d of H.decks.names) ep = Math.max(ep, Math.abs(H.decks.deckZ[d][i] - C.deckZ(d, x))); });
      row('MUST', 'her stem, stern, top, weather deck and every deck at every station', f(ep, 6) + ' m off at worst', '<= ' + f(half(4), 6), ep <= half(4));
    }
    {
      const mship = C.buildShip(), sim = C.createSim(mship, {}, { openings: [] });
      const vm = ship.subdivision.nodes.list.every(nd => Math.abs(nd.vmax - mship.nodeVmax[nd.n]) <= half(3) && nd.columns === mship.nodeCount[nd.n] && nd.mu === mship.nodeMu[nd.n]);
      const bh = ship.subdivision.bulkheads.every((b, i) => b.id === C.BULKHEADS[i].id && Math.abs(b.x - C.BULKHEADS[i].x) <= half(6));
      const zn = ship.subdivision.zones.every((z, k) => Math.abs(z.xf - mship.zones[k].xf) <= half(6) && Math.abs(z.xa - mship.zones[k].xa) <= half(6));
      row('MUST', 'her 64 spaces (what each holds), 15 bulkheads and 16 compartments, the model\'s', (vm ? 'spaces agree' : 'SPACES DIFFER') + ', ' + (bh ? 'bulkheads agree' : 'BULKHEADS DIFFER') + ', ' + (zn ? 'compartments agree' : 'COMPARTMENTS DIFFER'), 'all agree', vm && bh && zn);
      let nConn = 0; for (let c = 0; c < sim.conn.n; c++) if (sim.conn.kind[c] !== C.K.STAIR) nConn++;
      const wl = ship.openings.weather.list, wOk = wl.length === sim.stairOps.length && wl.every((o, i) => o.id === sim.stairOps[i].id && Math.abs(o.z - sim.stairOps[i].z) <= half(6) && (o.hc === null ? !Number.isFinite(sim.stairOps[i].hc) : Math.abs(o.hc - sim.stairOps[i].hc) <= half(6)));
      row('MUST', 'the flow network: every connection, and every weather opening by its id, the model\'s at the start of the night', ship.openings.connections.length + ' connections, ' + wl.length + ' weather openings' + (wOk ? '' : ' (NOT THE MODEL\'S)'), nConn + ', ' + sim.stairOps.length, ship.openings.connections.length === nConn && wOk);
    }
    {
      const fu = ship.topsides.derived.funnels.every((g, i) => Math.abs(g.top.z - B.funnels[i].top.z) <= half(6) && Math.abs(g.seatZ - B.funnels[i].seatZ) <= half(6));
      const sm = ship.topsides.derived.smoke.every((p, i) => Math.abs(p.x - B.smoke[i].x) <= half(6) && Math.abs(p.z - B.smoke[i].z) <= half(6));
      const st = ship.boats.list.every((b, i) => Math.abs(b.station.x - BP.STATION[i].x) <= half(6) && Math.abs(b.station.y - BP.STATION[i].y) <= half(6) && Math.abs(b.station.z - BP.STATION[i].z) <= half(6));
      const sc = ship.machinery.screws.every((s, i) => Math.abs(s.x - Sys.PLANT.screws[i].x) <= half(6) && Math.abs(s.R - Sys.PLANT.screws[i].R) <= half(6));
      row('MUST', 'the drawn ship\'s funnels and smoke points, the boats\' stations, the screws: TS.built(), the people reader\'s and the plant\'s', [fu, sm, st, sc].map(v => v ? 'agree' : 'DIFFER').join(', '), 'all agree', fu && sm && st && sc);
      const n = ship.topsides.N, okN = n.funnels.length === TS.N.funnels.length && n.houses.length === TS.N.houses.length && n.funnels[0].top === TS.N.funnels[0].top;
      const tagged = (nt) => { let k = 0; const walk = (o) => { if (o.tags && o.tags.length) k++; for (const v of Object.values(o.keys || {})) walk(v); for (const v of o.rows || []) walk(v); }; walk(nt); return k; };
      const nN = tagged(ship.notes['topsides.N']), bd = ship.notes['topsides.N'].keys.boatDeck, cs = ship.notes['machinery.stern'].keys.centre;
      const okT = bd.tags.includes('scaled') && bd.tags.includes('appearance') && cs.tags.includes('bet') && cs.tags.includes('appearance');
      // the count of tagged entries follows the sources' comments: it is printed on a volatile line, and only its floor is a test
      row('MUST', 'the topsides table whole, its tags carried as the source writes them (e.g. the Boat deck [scaled] and [appearance]; the centre screw\'s hand [bet])', (okN ? 'N whole' : 'N NOT WHOLE') + '; ' + (okT ? 'tags as written' : 'TAGS LOST') + (nN > 30 ? '' : '; TOO FEW TAGGED ENTRIES'), 'whole, as written', okN && okT && nN > 30);
      rows.push(['VOL', 'the topsides table\'s tagged entries (N)', nN, '', true]);
      const lw = ship.lights.ports.list.length, wn = ship.topsides.windows.list.length, keyed = ship.lights.ports.list.every(p => p.zone >= 0 && p.zone < 16 && p.deck) && ship.topsides.windows.list.every(w => w.zone >= 0 && w.zone < 16 && w.deck);
      row('MUST', 'every lit port and every window keyed to its compartment and deck, so its light can follow the plant and the sea', lw + ' ports, ' + wn + ' windows' + (keyed ? '' : ' (SOME UNKEYED)'), 'all keyed', keyed && lw > 0 && wn > 0);
    }

    // ================================================================ 3. the night's fingerprint: the model run alone
    const rec = JSON.parse(nightA.toString('utf8')), K = rec.constants, chn = rec.channels;
    const alone = N.create(C.buildShip(), N.spec(1912), { auto: true, readers: false });
    N.run(alone);
    const encAlone = { k: alone.night.k, fp: N.fingerprint(alone) };
    N.sink(alone);
    const endAlone = { k: alone.night.k, fp: N.fingerprint(alone), founderT: alone.founderT };
    row('MUST', 'the record\'s fingerprint at the end of the encounter: the model run alone\'s (N.run, no readers)', rec.end.encounter.fingerprint + ' at step ' + rec.end.encounter.k, encAlone.fp + ' at step ' + encAlone.k, rec.end.encounter.fingerprint === encAlone.fp && rec.end.encounter.k === encAlone.k);
    row('MUST', 'the record\'s fingerprint at its last step, its hand-over: the model run alone\'s (N.run then N.sink, which stops on N.over)', rec.end.fingerprint + ' at step ' + rec.end.k + ', t ' + f(rec.end.t, 2) + ' s', endAlone.fp + ' at step ' + endAlone.k + ', t ' + f(alone.t, 2) + ' s', rec.end.fingerprint === endAlone.fp && rec.end.k === endAlone.k && rec.end.founderT === endAlone.founderT);
    const onF = rec.readers.onset.found;
    row('MUST', '  ... and it is the break\'s onset (G12\'s switch, D98): the record\'s end handed over at B2\'s onset, the step the onset reader found it',
      'handover ' + rec.end.handover + ', over ' + rec.end.over + ' at step ' + rec.end.k + ' (T ' + f((rec.end.tOver - rec.end.summary.tTouch) / 60, 2) + '); the onset at step ' + (onF ? onF.k : 'none') + (onF ? ', x ' + f(onF.x, 2) : ''), 'onset, at the onset\'s step', rec.end.handover === 'onset' && rec.end.over === true && !!onF && onF.k === rec.end.k && rec.end.foundered === false);
    row('MUST', 'one sample a step, from the watch\'s start to its hand-over', rec.clock.n + ' samples, k ' + rec.clock.k0 + ' to ' + (rec.clock.k0 + rec.clock.n - 1), (endAlone.k + 1) + ' samples, k 0 to ' + endAlone.k, rec.clock.n === endAlone.k + 1 && rec.clock.k0 === 0 && chn.zO.length === rec.clock.n);
    // the what-if (handover 'flag'): today's watch before D98, to the bit: its record ends at the founder flag, the model
    // run alone's with the same option
    {
      const rf = RN.record({ handover: 'flag' }), af = N.create(C.buildShip(), N.spec(1912), { auto: true, readers: false, handover: 'flag' });
      N.run(af); N.sink(af);
      row('MUST', 'the what-if, handover \'flag\' (--flag): the record ends at the founder flag, the model run alone\'s with the same option, to the bit',
        rf.end.fingerprint + ' at step ' + rf.end.k + ', founders at t ' + f(rf.end.founderT, 2) + ' s (' + rf.name + ')', N.fingerprint(af) + ' at step ' + af.night.k + ', t ' + f(af.founderT, 2) + ' s',
        rf.end.fingerprint === N.fingerprint(af) && rf.end.k === af.night.k && rf.end.foundered === true && rf.end.handover === 'flag' && rf.end.founderT === af.founderT);
    }

    // ================================================================ 4. the night against the model, at chosen steps
    {
      const ev = (id) => rec.events.find(e => e.id === id);
      const picks = [['the start', 0], ['the bells', ev('bells').k], ['the touch', ev('touch').k], ['the encounter over', rec.end.encounter.k], ['one hour', 14400], ['two hours', 28800],
        ['the onset of the break', rec.readers.onset.found ? rec.readers.onset.found.k : 37000], ['the hand-over', rec.end.k]];
      const want = new Map(picks.map(([, k]) => [k, null]));
      const sim = N.create(C.buildShip(), N.spec(1912), { auto: true, readers: false });
      // G1: the circuits reader on the model run alone, stepped here by hand (it writes sim.circuits only), and the step
      // each section's fuses blew
      CIR.attach(sim, N.spec(1912));
      const ciK = new Int32Array(sim.circuits.sections.length).fill(-1);
      const grab = () => {
        sim.circuits.sections.forEach((s, j) => { if (ciK[j] < 0 && s.out >= 0) ciK[j] = sim.night.k; });
        if (!want.has(sim.night.k)) return;
        const Fm = C.frameOf(sim), m = sim.mo;
        want.set(sim.night.k, { zO: sim.zO, pitch: sim.pitch, roll: sim.roll, X: m.X, Y: m.Y, psi: m.psi, u: m.u, v: m.v, r: m.r, lights: sim.plant.lights, p: sim.plant.p,
          level: Float64Array.from(sim.level), vol: Float64Array.from(sim.vol), wz: POINTS.map(p => C.worldZ(Fm, p[0], p[1], p[2])),
          pk: (sim.pockets || []).map(q => q.vol), water: C.readouts(sim).waterM3, lit: sim.circuits.lit });
      };
      grab();
      while (sim.night.k < rec.end.k) { N.step(sim); CIR.step(sim); grab(); }
      for (const [name, k] of picks) {
        const M = want.get(k), i = k - rec.clock.k0;
        if (!M) { row('MUST', 'the night at ' + name + ' (step ' + k + ')', 'the model never reached that step', '', false); continue; }
        const dev = [['zO', 3], ['pitch', 6], ['roll', 6], ['X', 3], ['Y', 3], ['psi', 6], ['u', 3], ['v', 3], ['r', 6]].filter(([c, d]) => !(Math.abs(chn[c][i] - M[c]) <= half(d))).map(([c]) => c);
        let wl = 0, lv = 0, nl = 0, vo = 0;
        const Fr = frameOfRecord(K, chn.zO[i], chn.pitch[i], chn.roll[i]);
        POINTS.forEach((p, j) => { wl = Math.max(wl, Math.abs(worldZ(Fr, p) - M.wz[j])); });
        for (let n = 0; n < C.NN; n++) {
          const L = at(chn.water.level[n], i), Vv = at(chn.water.vol[n], i), wet = M.vol[n] > 1e-6;
          if (wet !== (L !== null)) { lv = Infinity; continue; }
          if (wet) { lv = Math.max(lv, Math.abs(L - M.level[n])); vo = Math.max(vo, Math.abs(Vv - M.vol[n])); nl++; }
        }
        const pl = chn.plant.lights[i] === +M.lights.toFixed(2) && Math.abs(chn.plant.p[i] - M.p) <= half(4);
        const ok = !dev.length && wl <= 1e-3 && lv <= half(3) && vo <= half(1) && pl;
        row('MUST', 'the night at ' + name + ' (step ' + k + '): pose, place, heading, speed; her waterline at ten stations from the record\'s pose by its frames; the water in each space; the plant',
          (dev.length ? 'OFF: ' + dev.join(', ') + '; ' : 'all within their decimals; ') + 'waterline ' + f(wl * 1000, 3) + ' mm; ' + nl + ' wet spaces, levels ' + f(lv * 1000, 3) + ' mm, volumes ' + f(vo, 3) + ' m3' + (pl ? '' : '; PLANT OFF'),
          'waterline <= 1 mm; levels <= 0.5 mm', ok);
      }
      // the pockets (QC B-3; CLAUDE.md, G7): the record lists the core's, gives each one's own water at the same steps,
      // and the spaces' vol with the pockets' vol is the water aboard as the core counts it (C.spaceWater summed over the
      // 64 spaces is C.readouts(sim).waterM3)
      const PR = chn.water.pockets, PS = sim.pockets || [], KEYS = ['x0', 'x1', 'z0', 'z1', 'xc', 'yc'];
      const listOk = !!PR && PR.list.length === PS.length && PS.every((q, j) => {
        const r = PR.list[j];
        return r.name === q.name && r.node === q.node && r.side === q.side && KEYS.every(c => Math.abs(r[c] - q[c]) <= half(3)) && Math.abs(r.cap - q.cap) <= half(1);
      });
      row('MUST', 'the pockets the record lists are the core\'s: name, space, side, place in her frame, capacity',
        PR ? PR.list.map(r => r.name + ', ' + f(r.cap, 1) + ' m3').join('; ') : 'none in the record', PS.length + ' in the model', listOk);
      let pv = PR ? 0 : Infinity, av = 0, aWhere = '';
      for (const [name, k] of picks) {
        const M = want.get(k), i = k - rec.clock.k0;
        if (!M || !PR) continue;
        let sum = 0;
        for (let n = 0; n < C.NN; n++) { const Vv = at(chn.water.vol[n], i); if (Vv !== null) sum += Vv; }
        PS.forEach((q, j) => {
          const Vp = at(PR.vol[j], i), m = M.pk[j] > 1e-6 ? M.pk[j] : null;
          if ((Vp === null) !== (m === null)) pv = Infinity; else if (Vp !== null) { pv = Math.max(pv, Math.abs(Vp - m)); sum += Vp; }
        });
        if (Math.abs(sum - M.water) > av) { av = Math.abs(sum - M.water); aWhere = name; }
      }
      const tolA = (C.NN + PS.length) * half(1);
      row('MUST', 'each pocket\'s own water at the same eight steps, and the water aboard counted as the core counts it: the spaces\' vol with their pockets\'',
        'pockets ' + f(pv, 3) + ' m3 at worst; aboard ' + f(av, 3) + ' m3 at worst' + (aWhere ? ' (' + aWhere + ')' : ''),
        'pockets <= 0.05 m3; aboard <= ' + f(tolA, 2) + ' m3 (the decimals)', pv <= half(1) && av <= tolA);
      // G1, her lights by circuit (core/readers/circuits.js): the record's sections are the reader's table, each one's
      // step the reader's own on the model run alone, and her light at the eight steps follows from the record by its rule
      const RC = rec.readers.circuits, G = CIR.table(sim.ship), SC = sim.circuits.sections;
      const tableOk = !!RC && RC.sections.length === SC.length && RC.short === sim.circuits.short && RC.emergency === sim.circuits.emergency && RC.sections.every((r, j) =>
        r.key === SC[j].key && r.zone === SC[j].zone && r.side === SC[j].side && r.floor === SC[j].floor && r.node === G.n[j] && Math.abs(r.share - SC[j].share) <= half(8)
        && Math.abs(r.x - G.x[j]) <= half(3) && Math.abs(r.y - G.y[j]) <= half(3) && Math.abs(r.z - G.z[j]) <= half(3) && Math.abs(r.h - G.h[j]) <= half(3));
      row('MUST', 'her lights by circuit (G1): the record\'s sections are the reader\'s, each one\'s key, space, share and middle',
        RC ? RC.sections.length + ' sections, short ' + RC.short + ' m, the emergency share ' + RC.emergency : 'none in the record', SC.length + ' in the reader', tableOk);
      const stepsOk = !!RC && RC.sections.every((r, j) => (r.out === null ? ciK[j] < 0 : r.out === ciK[j]));
      const nOut = RC ? RC.sections.filter(r => r.out !== null).length : 0;
      row('MUST', '  ... each section\'s step in the record (its fuses blown) is the reader\'s own on the model run alone, stepped by hand',
        nOut + ' blown by the hand-over' + (stepsOk ? ', each on its step' : ', NOT the reader\'s'), Array.from(ciK).filter(k => k >= 0).length + ' in the model', stepsOk && nOut > 0);
      let litWorst = RC ? 0 : Infinity;
      for (const [, k] of picks) {
        const M = want.get(k), i = k - rec.clock.k0; if (!M || !RC) continue;
        let held = 0, anyOut = false; RC.sections.forEach(r => { if (r.out === null || r.out > k) held += r.share; else anyOut = true; });
        litWorst = Math.max(litWorst, Math.abs(chn.plant.lights[i] * (anyOut ? held : 1) - M.lit));
      }
      row('MUST', '  ... and her light by circuit at the eight steps, from the record alone (the plant\'s lights times the shares of the sections still holding): the reader\'s',
        f(litWorst, 9) + ' off at worst', '<= ' + f(RC ? RC.sections.length * half(8) : 0, 9) + ' (the shares\' decimals)', RC && litWorst <= RC.sections.length * half(8));
    }

    // ================================================================ 4b. her water as loads weigh it (the epoch's C5)
    // With params.weighOverfill 0 (C5 on: the default since the epoch's D4) the record carries her weighed water each step,
    // which must be the core's C.weighedWater and follow from the record's own vol and pockets by the rule it states; with
    // 1 (C5 off) it carries none. Whichever the default is, the other is made as a what-if: the record above is the night
    // with the default's switch. These rows print words when they pass and put the measured numbers on a volatile line
    {
      const on = rec.night.params.weighOverfill === 0;
      const r1 = on ? JSON.parse(RN.record({ params: { weighOverfill: 1 } }).text) : rec, dark = r1.channels.water.weighed === undefined;
      row('MUST', 'with params.weighOverfill 1 (C5 off, ' + (on ? 'a what-if since D4' : 'the default') + ') the record carries no weighed water', dark ? 'none' : 'PRESENT', 'none', dark);
      const r0 = on ? rec : JSON.parse(RN.record({ params: { weighOverfill: 0 } }).text), c0 = r0.channels, wt = c0.water.weighed;
      const m0 = N.create(C.buildShip(), N.spec(1912), { auto: true, readers: false, params: { weighOverfill: 0 } });
      const end0 = r0.end.k, EVERY = 2400, model = new Map();
      const grabW = () => { const k = m0.night.k; if (k % EVERY === 0 || k === end0) model.set(k, C.weighedWater(m0)); };
      grabW();
      while (m0.night.k < end0) { N.step(m0); grabW(); }
      const vmax = ship.subdivision.nodes.list.map(q => q.vmax), PL = c0.water.pockets ? c0.water.pockets.list : [];
      let dT = 0, dR = 0, kT = -1, full = 0;
      for (const [k, Wm] of model) {
        const i = k - r0.clock.k0, t = wt ? at(wt.total, i) : null, tot = t === null ? 0 : t;
        let byRule = 0;
        for (let n = 0; n < C.NN; n++) { const v = at(c0.water.vol[n], i); if (v !== null) { byRule += Math.min(v, vmax[n]); if (v > vmax[n]) full++; } }
        PL.forEach((q, j) => { const v = at(c0.water.pockets.vol[j], i); if (v !== null) byRule += Math.min(v, q.cap); });
        if (Math.abs(tot - Wm) > dT) { dT = Math.abs(tot - Wm); kT = k; }
        dR = Math.max(dR, Math.abs(byRule - Wm));
      }
      const tolR = (C.NN + PL.length) * half(1), okT = !!wt && dT <= half(1), okR = !!wt && dR <= tolR, fpm = N.fingerprint(m0), okF = r0.end.fingerprint === fpm;
      row('MUST', 'with params.weighOverfill 0 (C5 on, ' + (on ? 'the default since D4' : 'a what-if') + ') the record carries her weighed water, the core\'s C.weighedWater, every ' + EVERY + ' steps and at its last',
        okT ? 'equal within its decimals' : (wt ? 'OFF by ' + f(dT, 3) + ' m3 at step ' + kT : 'MISSING'), 'within 0.05 m3', okT);
      row('MUST', '  ... and it follows from the record\'s own numbers by its rule: each space\'s vol cut at its vmax (titanic_ship.json), each pocket\'s at its cap',
        okR ? 'equal within the decimals' : 'OFF by ' + f(dR, 3) + ' m3', 'within ' + f(tolR, 2) + ' m3', okR);
      row('MUST', '  ... and that record is the model\'s: its fingerprint at its last step, the model run alone with weighOverfill 0',
        okF ? 'the same' : 'DIFFER (' + r0.end.fingerprint + ' against ' + fpm + ')', 'the same', okF);
      rows.push(['VOL', 'C5\'s night (weighOverfill 0): ' + model.size + ' steps checked; the total off ' + f(dT, 3) + ' m3 at worst, the rule off ' + f(dR, 3) + ' m3; a space over its vmax ' + full + ' times among them',
        'last step ' + end0, 'fingerprint ' + r0.end.fingerprint, true]);
    }

    // ================================================================ 5. the rate: what thinning would miss (why every step)
    {
      const n = rec.clock.n, levels = chn.water.level;
      for (const s of [2, 4]) {
        let eZ = 0, kZ = -1, eL = 0, kL = -1;
        for (let j = 0; j < n; j++) {
          const a = Math.floor(j / s) * s, b = Math.min(a + s, n - 1);
          if (a === j || b === a) continue;
          const u = (j - a) / (b - a), L = (A) => A[a] + (A[b] - A[a]) * u;
          const Ft = frameOfRecord(K, chn.zO[j], chn.pitch[j], chn.roll[j]), Fi = frameOfRecord(K, L(chn.zO), L(chn.pitch), L(chn.roll));
          for (const p of POINTS) { const d = Math.abs(worldZ(Ft, p) - worldZ(Fi, p)); if (d > eZ) { eZ = d; kZ = j; } }
          for (let q = 0; q < C.NN; q++) {
            const va = at(levels[q], a), vb = at(levels[q], b), vj = at(levels[q], j);
            if (va === null || vb === null || vj === null) continue;
            const d = Math.abs(vj - (va + (vb - va) * u)); if (d > eL) { eL = d; kL = j; }
          }
        }
        row('CHECK', 'the rate: a sample every ' + s + ' steps (' + f(s * 0.25, 2) + ' s), a straight line between, would miss', 'her waterline by ' + f(eZ * 100, 1) + ' cm (step ' + kZ + '), a level inside by ' + f(eL * 100, 1) + ' cm (step ' + kL + ')', 'U2 asks 10 cm: every step kept', true);
      }
    }

    // ================================================================ 6. the fall's place, filled (--fall)
    {
      const tP = nightA.toString('utf8'), tF = fallA.toString('utf8'), key = '\n "fall": {', iP = tP.indexOf(key), iF = tF.indexOf(key);
      row('MUST', 'the fall recorded (--fall) leaves the watch\'s record as it was: the same bytes up to `fall`', iP > 0 && iF === iP && tP.slice(0, iP) === tF.slice(0, iF) ? 'the same ' + iP + ' bytes' : 'they differ', 'the same', iP > 0 && iF === iP && tP.slice(0, iP) === tF.slice(0, iF));
      const RF = JSON.parse(tF), F = RF.fall, plainFall = rec.fall;
      row('MUST', 'without it the fall\'s place stands empty, in the same form (contract v: 2)', 'recorded ' + plainFall.recorded + ', ' + plainFall.pieces.length + ' pieces, contract ' + plainFall.contract, 'recorded false, 0 pieces, contract 2', plainFall.recorded === false && plainFall.pieces.length === 0 && plainFall.contract === 2 && Object.keys(plainFall).join() === Object.keys(F).join());
      const last = rec.clock.n - 1, Fr = frameOfRecord(K, chn.zO[last], chn.pitch[last], chn.roll[last]);
      let dr = 0, dq = 0;
      for (const p of F.pieces) {
        dr = Math.max(dr, Math.abs(p.r.X[0] - Fr.t[0]), Math.abs(p.r.Y[0] - Fr.t[1]), Math.abs(p.r.Z[0] - Fr.t[2]));
        // R(q) against the pose's R: the hand-over is seamless
        const w = p.q.w[0], x = p.q.x[0], y = p.q.y[0], z = p.q.z[0];
        const Rq = [1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y), 2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x), 2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y)];
        for (let i = 0; i < 9; i++) dq = Math.max(dq, Math.abs(Rq[i] - Fr.R[i]));
      }
      row('MUST', 'the fall hands over at the core\'s pose at the hand-over (its sample 0 against the record\'s last pose, by the file\'s frames)', 'r ' + f(dr * 1000, 3) + ' mm, R ' + f(dq, 7) + ' off', 'r <= 1 mm, R <= 1e-5', dr <= 1e-3 && dq <= 1e-5);
      // the night's own fall from the break (D98): rule 'break', begun at the onset's time and step, cut at its station
      const onF = rec.readers.onset.found;
      row('MUST', 'the fall is the night\'s own from the break (D98): rule \'break\', begun at the hand-over\'s time and step, the pieces cut at the onset\'s station',
        'rule ' + F.rule + ', t0 ' + f(F.t0, 2) + ' s, k0 ' + F.clock.k0 + '; the cut at x ' + f(F.pieces.length ? F.pieces[0].x0 : null, 2) + ' / ' + f(F.pieces.length ? F.pieces[F.pieces.length - 1].x1 : null, 2), 'break; ' + f(rec.end.tOver, 2) + ', ' + rec.end.k + '; x ' + f(onF ? onF.x : null, 2),
        F.rule === 'break' && F.t0 === rec.end.tOver && F.clock.k0 === rec.end.k && !!onF && F.pieces.some(p => Math.abs(p.x0 - onF.x) <= 1e-6 || Math.abs(p.x1 - onF.x) <= 1e-6));
      const rest = F.pieces.map(p => { const c = p.changes[p.changes.length - 1]; return p.id + ' at rest ' + (c && c.state === 'at rest' ? f(c.i * F.dt / 60, 2) + ' min after the hand-over, ' + f(p.depth[p.depth.length - 1], 0) + ' m down, ' + f(Math.hypot(p.r.X[p.r.X.length - 1] - F.breakAt[0], p.r.Y[p.r.Y.length - 1] - F.breakAt[1]), 0) + ' m from the point under the break' : 'NOT'); });
      row('CHECK', 'the fall to the bed, rule ' + F.rule + ', ' + F.clock.n + ' samples', rest.join('; '), 'done', F.done === true);
    }

    // ================================================================ the manifest
    // pinned: each file's data without its provenance (`made`; and the ship's `notes`, the sources' comments and their line
    // numbers), written again by JSON.stringify from the parsed file: it moves only when the exported numbers move
    const dataOf = (obj, drop) => { const o = Object.assign({}, obj); for (const k of drop) delete o[k]; return Buffer.from(JSON.stringify(o), 'utf8'); };
    const fallRec = JSON.parse(fallA.toString('utf8'));
    for (const [name, obj, drop] of [[XS.NAME, ship, ['made', 'notes']], [nightName, rec, ['made']], [fallName, fallRec, ['made']]]) {
      const d = dataOf(obj, drop);
      rows.push(['INFO', 'MANIFEST ' + name + ': its data without ' + drop.join(' and '), d.length + ' bytes', 'digest ' + sha(d), true]);
    }
    rows.push(['INFO', 'the night: ' + rec.night.title + ', orders ' + rec.night.orders, rec.clock.n - 1 + ' steps, fingerprint ' + rec.end.fingerprint, 'hands over (' + rec.end.handover + ') at t ' + f(rec.end.tOver, 2) + ' s', true]);
    // volatile ("~ "): each file whole, and the git blob ids of the sources the files name: they move with any edit to a
    // source, a comment too (the coordinator's decision of 2026-11-20)
    for (const [name, buf] of [[XS.NAME, shipA], [nightName, nightA], [fallName, fallA]]) rows.push(['VOL', name, buf.length + ' bytes', 'sha256 ' + sha(buf), true]);
    const srcs = Object.assign({}, ship.made.sources, rec.made.sources);
    for (const p of Object.keys(srcs).sort()) rows.push(['VOL', 'source ' + p, srcs[p], '', true]);
  } catch (e) {
    row('MUST', 'the suite ran', String(e && e.message || e), 'no error', false);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  for (const [kind, what, value, ref, ok] of rows) {
    if (kind === 'INFO') { console.log('       ' + what.padEnd(100) + ' ' + String(value).padEnd(60) + ' ' + ref); continue; }
    if (kind === 'VOL') { console.log('~      ' + what.padEnd(100) + ' ' + String(value).padEnd(60) + ' ' + ref); continue; }
    console.log((ok ? 'PASS ' : (kind === 'MUST' ? 'FAIL ' : 'CHECK ')) + kind.padEnd(6) + what.padEnd(100) + ' ' + String(value).padEnd(60) + ' ' + ref);
  }
  const musts = rows.filter(r => r[0] === 'MUST').length;
  console.log(fails ? '\nFAIL: ' + fails + ' MUST row(s)' + (checks ? ', ' + checks + ' CHECK row(s) off' : '') : '\nPASS: all ' + musts + ' MUST rows' + (checks ? '; ' + checks + ' CHECK row(s) off' : ''));
  process.exit(fails ? 1 : 0);
})();
