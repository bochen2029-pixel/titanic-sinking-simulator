// Z1: the free body (core/readers/fall.js) against its twelve trials (docs/BRAINSTORM_the_descent_to_the_bed_v2_2026-11-19.md,
// section 6, "Z1's trials"), with the invariants the engine rests on.
//   node tools/fall_trials.js                    the table, written to out/fall_trials.txt (tools/outdir.js); exit 1 if a MUST row fails
//   node tools/fall_trials.js --abacus-requests  write trial 1's closed forms for Abacus (then: abacus batch, the line it prints;
//                                                Abacus's exe: ABACUS_EXE, else "abacusExe" in tools/local_paths.json)
// MUST rows hold the engine to a band with its source; CHECK rows report what the record or the plan expects beside what
// the model gives, and a miss there is information. Tests set causes, never conclusions: no band here was moved to fit
// the model, and a MUST row that fails is reported as failing, with what it says about the model.
// About a minute and a half on a quiet machine.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const C = require('../core/core.js');
const SC = require('../core/scenarios.js');
const GI = require('../core/readers/girder.js');
const F = require('../core/readers/fall.js');
const N = require('../core/night.js');
const S = require('../core/readers/section.js');
require('../core/readers/onset.js');                                 // B2's onset, a reader of the watch: trial 13's hand-over
const outFile = require('./outdir');
const AB = path.join(__dirname, '..', 'docs', 'research', 'abacus');
const ABREQ = path.join(AB, 'requests_fall_trials_2026-11-19.jsonl'), ABRES = path.join(AB, 'results_fall_trials_2026-11-19.jsonl');
const DEG = Math.PI / 180, G = C.GRAV;
const t0 = Date.now();

const rows = []; let fails = 0;
function row(kind, what, value, ref, ok) { rows.push([kind, what, value, ref, ok]); if (kind === 'MUST' && !ok) fails++; }
const f = (x, n) => (x === null || x === undefined || !isFinite(x) ? 'n/a' : x.toFixed(n === undefined ? 1 : n));
const out = [];
const say = (s) => out.push(s === undefined ? '' : s);

// ================================================================ trial 1's bodies: a sphere and a flat plate
// R6's own cases (its 10.9, T2, and its section 7): a steel sphere of 20 mm, Cd 0.47; a steel plate 2 m x 1 m x 25 mm,
// falling flat, Cd 1.17. Steel 7,850 kg/m3 [textbook]. In a column of one density, 1,025 kg/m3, so that the closed form is
// one number: v = sqrt(2 (m - rho V) g / (rho Cd A)), A the area the engine's strips present to the fall.
const RHO1 = 1025, STEEL = 7850;
function sphere() {
  const R = 0.01, n = 40, dx = 2 * R / n, sl = [];
  for (let i = 0; i < n; i++) {
    const x = -R + (i + 0.5) * dx, r = Math.sqrt(R * R - x * x), V = Math.PI * r * r * dx, py = [], pz = [];
    for (let k = 0; k < 24; k++) { const a = 2 * Math.PI * k / 24; py.push(r * Math.cos(a)); pz.push(R + r * Math.sin(a)); }
    sl.push({ x, dx, B: 2 * r, H: 2 * r, Venv: V, ey: 0, ez: R, Vf: 0, ms: STEEL * V, gx: x, gy: 0, gz: R, poly: { y: py, z: pz }, shape: 'circle' });
  }
  return { id: 'sphere', kind: 'body', slices: sl, ends: { aft: 'none', fwd: 'none' }, K: { cdBeam: 0.47, cdKeel: 0.47, cdDeck: 0.47, lift: 0, turn: 0, rhoRef: RHO1 } };
}
function plate() {
  const L = 2, B = 1, H = 0.025, n = 8, dx = L / n, sl = [];
  for (let i = 0; i < n; i++) {
    const x = -0.5 * L + (i + 0.5) * dx, V = B * H * dx;
    sl.push({ x, dx, B, H, Venv: V, ey: 0, ez: 0.5 * H, Vf: 0, ms: STEEL * V, gx: x, gy: 0, gz: 0.5 * H, poly: { y: [-0.5 * B, 0.5 * B, 0.5 * B, -0.5 * B], z: [0, 0, H, H] }, shape: 'rect' });
  }
  return { id: 'plate', kind: 'body', slices: sl, ends: { aft: 'none', fwd: 'none' }, K: { cdBeam: 1.17, cdKeel: 1.17, cdDeck: 1.17, lift: 0, turn: 0, rhoRef: RHO1 } };
}
function closed(spec) {
  let m = 0, V = 0, A = 0; for (const s of spec.slices) { m += s.ms; V += s.Venv; A += s.B * s.dx; }
  const Cd = spec.K.cdKeel;
  return { m, V, A, Cd, v: Math.sqrt(2 * (m - RHO1 * V) * G / (RHO1 * Cd * A)) };
}
if (process.argv.includes('--abacus-requests')) {
  const lines = [sphere(), plate()].map((s) => { const c = closed(s); return JSON.stringify({ cmd: 'num.eval', args: { expr: 'sqrt(2*(m - rho*V)*g/(rho*Cd*A))', vars: { m: String(c.m), rho: String(RHO1), V: String(c.V), g: String(G), Cd: String(c.Cd), A: String(c.A) }, digits: 17 } }); });
  fs.writeFileSync(ABREQ, lines.join('\n') + '\n');
  // Abacus's exe is this machine's own: ABACUS_EXE, else "abacusExe" in tools/local_paths.json (untracked)
  const abacus = process.env.ABACUS_EXE || (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'local_paths.json'), 'utf8')).abacusExe; } catch (e) { return null; } })();
  console.log('wrote', ABREQ, '\nnow:', abacus || '<abacus.exe: set ABACUS_EXE, or "abacusExe" in tools/local_paths.json>', 'batch --in', ABREQ, '--out', ABRES);
  process.exit(0);
}

// ================================================================ the ship, her sea, and letting a piece go
const ship = C.buildShip(), T = F.shipTables(ship), XB = GI.X_BREAK, XS = T.e[0], XF = T.e[T.nS];
const sim0 = C.createSim(ship, {}, SC.PRESETS.titanic.build());      // her weights (the girder's curve) and parameters
const SEA = F.sea({});                                               // 1912: 3,790 m, half a degree down a bearing from seed 1912
const cutOf = (id) => (id === 'bow' ? [XB, XF] : (id === 'stern' ? [XS, XB] : [XS, XF]));
function specOf(id, o) { const c = cutOf(id); return F.piece(ship, sim0, c[0], c[1], Object.assign({ id, kind: id, air: 0 }, o || {})); }
const attitude = (q) => { const R = F.quatR(q, new Float64Array(9)); return { pitch: Math.atan2(-R[6], Math.sqrt(R[7] * R[7] + R[8] * R[8])) / DEG, roll: Math.atan2(R[7], R[8]) / DEG }; };
// let piece `id` go at rest, `trim` deg by the head and `list` deg to port, wholly under (its highest point `top` m), and
// follow it to rest. Where it lands: its centre (the middle of its length, on the girder's neutral axis) against the
// point under the break (the cut station, x -23, on the same axis, where it was let go), along her heading (X) and across
function letGo(id, pose, o) {
  o = o || {};
  const fall = F.make(o.sea || SEA, [specOf(id, { lever: o.lever || 0, K: o.K, air: o.air === undefined ? 0 : o.air, vent: o.vent })], { dt: C.DEFAULT_PARAMS.dt });
  F.place(fall, 0, { pitch: pose.trim * DEG, roll: -(pose.list || 0) * DEG, top: pose.top === undefined ? -1 : pose.top });
  const p = fall.pieces[0], b = fall.eng.bodies[0], mid = 0.5 * (p.x0 + p.x1);
  const brk = F.worldOf(fall, 0, [XB, 0, GI.Z_NA]);
  const where = () => { const w = F.worldOf(fall, 0, [mid, 0, GI.Z_NA]); return [w[0] - brk[0], w[1] - brk[1]]; };
  const res = { id, pose, lever: o.lever || 0, pitches: [], broadside: null, x90: null };
  const tMax = (o.minutes || 20) * 240;
  for (let k = 0; k < tMax && !fall.done; k++) {
    F.advance(fall);
    const a = attitude(p.q);
    if (o.trace) res.pitches.push([fall.t, a.pitch, a.roll, p.depth]);
    if (res.broadside === null && Math.abs(a.pitch) < 10) res.broadside = fall.t;
    if (res.x90 === null && fall.t >= 90 - 1e-9) res.x90 = where();
    if (o.each) o.each(fall);
  }
  const st = fall.events.find(e => e.id === 'strike'), rest = fall.events.find(e => e.id === 'rest');
  const w = where(), a = attitude(p.q);
  Object.assign(res, { fall, b, done: fall.done, tBed: st ? st.t : NaN, speed: st ? st.speed : NaN, energy: st ? st.energy : NaN, tRest: rest ? rest.t : NaN,
    along: w[0], across: w[1], dist: Math.sqrt(w[0] * w[0] + w[1] * w[1]), pitch: a.pitch, roll: a.roll, bury: Math.max(...p.bury), stem: p.bury[p.bury.length - 1], tail: p.bury[0], lev: F.leverOf(b).lever });
  return res;
}
const where1 = (r) => f(r.dist, 0) + ' m (along ' + f(r.along, 0) + ', across ' + f(r.across, 0) + ')';

// ================================================================ the invariants
{
  // the column against R6's table (5.2), EOS-80 against UNESCO's check values (and R6's), Lamb against R6's table (1.3)
  const R6 = [[0, 0.0, 1026.33], [10, 10.1, 1026.41], [50, 50.3, 1026.73], [100, 100.7, 1027.40], [200, 201.4, 1028.30], [500, 504.1, 1030.02], [1000, 1009.7, 1032.41], [2000, 2024.6, 1037.09], [3000, 3044.3, 1041.71], [3784, 3847.2, 1045.28]];
  let wr = 0, wp = 0; for (const [z, pd, r] of R6) { wr = Math.max(wr, Math.abs(F.rhoAt(SEA, z) - r)); wp = Math.max(wp, Math.abs((F.pAt(SEA, z) - F.P_ATM) / 1e4 - pd)); }
  say('THE SEA (core/readers/fall.js): R6 5.2\'s April column (its temperatures and salinities a bet), in-situ density by EOS-80, pressure integrated');
  say('  z m        T C     S     rho kg/m3   p dbar   sound m/s');
  for (const [z] of R6) { const i = Math.round(z / SEA.dz); say('  ' + f(z, 0).padStart(5) + f(F.tempAt(SEA, z), 2).padStart(9) + f(SEA.S[Math.min(i, SEA.n - 1)], 2).padStart(7) + f(F.rhoAt(SEA, z), 2).padStart(12) + f((F.pAt(SEA, z) - F.P_ATM) / 1e4, 1).padStart(9) + f(SEA.c[Math.min(i, SEA.n - 1)], 1).padStart(11)); }
  say('  the bed: ' + f(SEA.depth, 0) + ' m at the frame\'s origin, ' + f(SEA.bed.slope / DEG, 2) + ' degree down a bearing of ' + f(SEA.bed.bearing / DEG, 0) + ' (drawn from seed 1912); s_u = ' + f(SEA.bed.su0 / 1000, 1) + ' + ' + f(SEA.bed.suK / 1000, 1) + ' z kPa, N_c ' + SEA.bed.Nc + ', mud ' + SEA.bed.rho + ' kg/m3');
  say();
  row('MUST', 'the column: in-situ density and pressure at R6\'s ten depths', 'within ' + f(wr, 3) + ' kg/m3 and ' + f(wp, 2) + ' dbar', 'R6 5.2\'s table to its last digit (0.005 kg/m3, 0.05 dbar)', wr <= 0.005 + 1e-9 && wp <= 0.05 + 1e-9);
  const UN = [[0, 5, 0, 999.96675], [0, 5, 10000, 1044.12802], [0, 25, 0, 997.04796], [0, 25, 10000, 1037.90204], [35, 5, 0, 1027.67547], [35, 5, 10000, 1069.48914], [35, 25, 0, 1023.34306], [35, 25, 10000, 1062.53817]];
  let we = 0; for (const [S, t, p, r] of UN) we = Math.max(we, Math.abs(F.rhoEOS(S, t, p / 10) - r));
  const r6 = F.rhoEOS(35, 0, 1000);
  row('MUST', 'EOS-80: UNESCO\'s eight check values, and R6\'s at (35, 0 C, 10,000 dbar)', 'within ' + we.toExponential(1) + ' kg/m3; ' + f(r6, 8), 'to the five decimals they are printed with; 1,070.95838408 (R6 5.1)', we < 5e-6 && Math.abs(r6 - 1070.95838408) < 5e-9);
  const L5 = F.lamb(5), L10 = F.lamb(10);
  const lok = Math.abs(L5.k1 - 0.059) < 6e-4 && Math.abs(L5.k2 - 0.894) < 6e-4 && Math.abs(L5.kr - 0.700) < 6e-4 && Math.abs(L10.k1 - 0.021) < 6e-4 && Math.abs(L10.k2 - 0.960) < 6e-4 && Math.abs(L10.kr - 0.884) < 6e-4;
  row('MUST', 'Lamb\'s spheroid coefficients (k1, k2, k\') at L/D 5 and 10', [L5, L10].map(L => f(L.k1, 3) + ' / ' + f(L.k2, 3) + ' / ' + f(L.kr, 3)).join(' and '), '0.059 / 0.894 / 0.700 and 0.021 / 0.960 / 0.884 (R6 1.3), to its three decimals', lok);
}
const bodies = {};
{
  // the pieces, from the model: her weights by the girder's curve, her solids by her permeabilities
  say('THE PIECES, wholly flooded (core/readers/fall.js, piece(): the model\'s slices cut at x ' + XB + ', the girder\'s weight curve, the solids by the permeabilities)');
  say('  piece  from       to   slices  envelope m3  floodable m3  structure t  with her water t  in water t  added mass t (along / across / down)  weight in water at x  plan\'s middle  lever m');
  for (const id of ['whole', 'bow', 'stern']) {
    const b = F.body(specOf(id), SEA), L = F.leverOf(b);
    bodies[id] = b;
    let ms = 0, vf = 0; for (let i = 0; i < b.n; i++) { ms += b.ms[i]; vf += b.Vf[i]; }
    say('  ' + id.padEnd(6) + f(b.x0, 2).padStart(8) + f(b.x1, 2).padStart(9) + String(b.n).padStart(7) + f(b.V, 0).padStart(13) + f(vf, 0).padStart(14) + f(ms / 1000, 0).padStart(13) + f(b.mass / 1000, 0).padStart(18) + f(L.wIn / 1000, 0).padStart(12)
      + ('  ' + f(b.MA[0] / 1000, 0) + ' / ' + f(b.MA[7] / 1000, 0) + ' / ' + f(b.MA[14] / 1000, 0)).padEnd(38) + f(L.xw, 2).padStart(9) + f(L.xplan, 2).padStart(15) + f(L.lever, 2).padStart(9));
  }
  say('  (the prototype, e33: 159,845 / 94,181 / 65,664 t with her water; 31,076 / 18,239 / 12,837 t in water at 1,036 kg/m3; levers 3.7 / 1.4 / 2.1 m;');
  say('   her inertia here is taken at the column\'s mean density, ' + f(bodies.whole.rhoRef, 1) + ' kg/m3)');
  // her weight in water acts where, against the buoyancy of her solids: what decides whether a flooded piece is top-heavy
  for (const id of ['whole', 'bow', 'stern']) {
    const b = bodies[id]; let ms = 0, mz = 0, vs = 0, vz = 0;
    for (let i = 0; i < b.n; i++) { ms += b.ms[i]; mz += b.ms[i] * b.gz[i]; const v = b.Venv[i] - b.Vf[i]; vs += v; vz += b.Venv[i] * b.ez[i] - b.Vf[i] * b.fz[i]; }
    let cz = 0; for (let i = 0; i < b.n; i++) cz += b.Venv[i] * b.ez[i];
    // falling flat, each slice's drag goes as its keel width (B dx) and acts at its drag height (ezd: the hull's own
    // section since D52): their mean is where the flow holds her
    let bd = 0, bz = 0; for (let i = 0; i < b.n; i++) { bd += b.B[i] * b.dx[i]; bz += b.B[i] * b.dx[i] * b.ezd[i]; }
    bodies[id].zs = { G: mz / ms, B: vz / vs, W: (mz - b.rhoRef * vz) / (ms - b.rhoRef * vs), C: cz / b.V, M: F.massOf(b).g[2], D: bz / bd };
  }
  const zl = (k) => ['whole', 'bow', 'stern'].map(id => f(bodies[id].zs[k], 2)).join(' / ');
  const zd = (k) => ['whole', 'bow', 'stern'].map(id => { const d = bodies[id].zs[k] - bodies[id].zs.C; return (d >= 0 ? '+' : '') + f(d, 2); }).join(' / ');
  const lever = ['whole', 'bow', 'stern'].map(id => { const d = bodies[id].zs.D - bodies[id].zs.W; return (d >= 0 ? '+' : '') + f(d, 2); }).join(' / ');
  say('  flooded, her structure\'s weight acts at z ' + zl('G') + ' m, the buoyancy of her solids at ' + zl('B') + ' m: her weight in water at ' + zl('W') + ' m; her centre of mass with her water at ' + zl('M') + ' m; her envelope\'s centre at ' + zl('C') + ' m');
  say('  falling flat, the drag acts at z ' + zl('D') + ' m (each slice\'s drag height, weighted by its keel width): the lever that holds a piece keel down, the drag\'s height less her weight in water\'s, is ' + lever + ' m (+ keel down; QC B, B-6: about 0 since D52, so after her first seconds nothing in the engine prefers keel down to keel up)');
  say('  her centre of mass against her envelope\'s centre: ' + zd('M') + ' m (held still, or end on)');
  say('  the tiers\' share of the section the water acts on (D52\'s one share, split by D76\'s D(G12-e)): in her added mass and the torn end\'s lift K.tiersAdded ' + F.K0.tiersAdded + ', in her cross-flow and turning drag K.tiersSide ' + F.K0.tiersSide + (T.Vh.every((v, j) => !(T.Venv[j] - v > 1e-9)) ? ' (this ship has no tiers above her hull: it changes nothing)' : ''));
  say();
  // the pieces of the cut ship sum to the whole: mass, centre, inertia (about the whole's centre)
  const sum = { m: 0, c: [0, 0, 0] }, I = [0, 0, 0, 0, 0, 0];
  const MW = F.massOf(bodies.whole);
  for (const id of ['bow', 'stern']) { const M = F.massOf(bodies[id]); sum.m += M.m; for (let k = 0; k < 3; k++) sum.c[k] += M.m * M.g[k]; }
  for (let k = 0; k < 3; k++) sum.c[k] /= sum.m;
  for (const id of ['bow', 'stern']) {
    const M = F.massOf(bodies[id]), r = [M.g[0] - MW.g[0], M.g[1] - MW.g[1], M.g[2] - MW.g[2]], m = M.m;
    I[0] += M.I[0] + m * (r[1] * r[1] + r[2] * r[2]); I[1] += M.I[1] + m * (r[0] * r[0] + r[2] * r[2]); I[2] += M.I[2] + m * (r[0] * r[0] + r[1] * r[1]);
    I[3] += M.I[3] - m * r[0] * r[1]; I[4] += M.I[4] - m * r[0] * r[2]; I[5] += M.I[5] - m * r[1] * r[2];
  }
  const dm = Math.abs(sum.m - MW.m) / MW.m, dc = Math.max(...sum.c.map((v, k) => Math.abs(v - MW.g[k]))), dI = Math.max(...I.map((v, k) => Math.abs(v - MW.I[k]))) / MW.I[1];
  row('MUST', 'the bow and the stern of the cut ship sum to the whole: mass, centre, inertia about the whole\'s centre', 'mass ' + dm.toExponential(1) + ', centre ' + dc.toExponential(1) + ' m, inertia ' + dI.toExponential(1) + ' of the largest', 'to rounding: 1e-12 of the mass and the inertia, 1e-9 m (the brief)', dm < 1e-12 && dc < 1e-9 && dI < 1e-12);
  let ms = 0, mx = 0, mz = 0; const bw = bodies.whole; for (let i = 0; i < bw.n; i++) { ms += bw.ms[i]; mx += bw.ms[i] * bw.gx[i]; mz += bw.ms[i] * bw.gz[i]; }
  row('MUST', 'the whole piece\'s structure is the model\'s own mass at the model\'s own centre', f(ms / 1000, 4) + ' t at x ' + f(mx / ms, 6) + ', z ' + f(mz / ms, 6), 'sim.ms ' + f(sim0.ms / 1000, 4) + ' t at x ' + f(sim0.g0[0], 6) + ', KG ' + f(sim0.g0[2], 6) + ' (the girder\'s curve closes to them)', Math.abs(ms - sim0.ms) / sim0.ms < 1e-12 && Math.abs(mx / ms - sim0.g0[0]) < 1e-9 && Math.abs(mz / ms - sim0.g0[2]) < 1e-9);
}

// ================================================================ the 1912 preset at its flag, and the hand-over (H1)
const simF = C.createSim(ship, {}, SC.PRESETS.titanic.build());
while (!simF.foundered) C.step(simF);
const coreHash = (s) => { const h = crypto.createHash('sha256'); for (const a of [s.vol, s.level, s.cx, s.cy, s.cz, s.area, s.zmin, s.zmax]) h.update(Buffer.from(a.buffer, a.byteOffset, a.byteLength)); h.update(Buffer.from(new Float64Array([s.t, s.zO, s.pitch, s.roll, s.vz, s.wth, s.wph, s.events.length]).buffer)); return h.digest('hex'); };
const hash0 = coreHash(simF);
let H1 = null;
{
  const fall = F.begin(simF);
  // continuity: every piece where the core has her, moving as the core has her
  const Fr = C.frameOf(simF), Rc = [Fr.R00, Fr.R01, Fr.R02, Fr.R10, Fr.R11, Fr.R12, Fr.R20, Fr.R21, Fr.R22];
  const wC = [simF.wph * Math.cos(simF.pitch), simF.wth, -simF.wph * Math.sin(simF.pitch)], g0 = simF.g0;
  const gW = [0, 1, 2].map(r => Rc[r * 3] * g0[0] + Rc[r * 3 + 1] * g0[1] + Rc[r * 3 + 2] * g0[2] + [Fr.tx, Fr.ty, Fr.tz][r]);
  let dp = 0, dv = 0;
  for (let i = 0; i < fall.pieces.length; i++) {
    const pc = fall.pieces[i], Rq = F.quatR(pc.q, new Float64Array(9));
    for (const pt of [[pc.x0 + 1, 3, 2], [pc.x1 - 1, -5, 18], [0.5 * (pc.x0 + pc.x1), 0, 10]]) {
      const w = F.worldOf(fall, i, pt), c = [0, 1, 2].map(r => Rc[r * 3] * pt[0] + Rc[r * 3 + 1] * pt[1] + Rc[r * 3 + 2] * pt[2] + [Fr.tx, Fr.ty, Fr.tz][r]);
      for (let k = 0; k < 3; k++) dp = Math.max(dp, Math.abs(w[k] - c[k]));
      // the point's velocity: the engine's (v of the origin + om x p, into the world) against the core's (G's heave, turning about G)
      const om = pc.om, lv = [pc.v[0] + om[1] * pt[2] - om[2] * pt[1], pc.v[1] + om[2] * pt[0] - om[0] * pt[2], pc.v[2] + om[0] * pt[1] - om[1] * pt[0]];
      const ve = [0, 1, 2].map(r => Rq[r * 3] * lv[0] + Rq[r * 3 + 1] * lv[1] + Rq[r * 3 + 2] * lv[2]);
      const rr = [c[0] - gW[0], c[1] - gW[1], c[2] - gW[2]], vc = [wC[1] * rr[2] - wC[2] * rr[1], wC[2] * rr[0] - wC[0] * rr[2], simF.vz + wC[0] * rr[1] - wC[1] * rr[0]];
      for (let k = 0; k < 3; k++) dv = Math.max(dv, Math.abs(ve[k] - vc[k]));
    }
  }
  row('MUST', 'the hand-over at the flag (H1): each piece\'s points where the core has them, moving as the core has them', 'within ' + dp.toExponential(1) + ' m and ' + dv.toExponential(1) + ' m/s', 'to rounding (1e-9): she does not jump at the flag', dp < 1e-9 && dv < 1e-9);
  // the water capped at what each space holds: the core's pressed-over water dropped, the rest of her spaces counted as air
  let vmax = 0, fit = 0, over = 0;
  for (let n = 0; n < ship.nodeVmax.length; n++) { vmax += ship.nodeVmax[n]; const v = Math.min(simF.vol[n], ship.nodeVmax[n]); fit += v; over += simF.vol[n] - v; }
  const airAll = fall.eng.bodies.reduce((s, b) => s + (b.air ? b.air.V0 : 0), 0);
  row('MUST', 'her air at the hand-over: her spaces less the water that fits in them (the pressed-over water dropped)', f(airAll, 1) + ' m3 in her pieces (' + fall.eng.bodies.map(b => b.id + ' ' + f(b.air ? b.air.V0 : 0, 0)).join(', ') + '); dropped ' + f(over, 0) + ' m3 (' + f(over * C.RHO / 1000, 0) + ' t)',
    'the core\'s floodable ' + f(vmax, 0) + ' less ' + f(fit, 0) + ' m3 = ' + f(vmax - fit, 1) + ', to 0.5 m3 (the spread\'s own tolerance); the plan: 53,113 m3 and 13,634 t', Math.abs(airAll - (vmax - fit)) < 0.5);
  H1 = fall;
}
// C5 (the calibration epoch, built dark): with params.weighOverfill 0 a full space or pocket weighs its capacity, the
// excess being the sea's head's stand-in, not water. The fall's hand-over water then holds to the core's weighed water
// (C.weighedWater), as every mirror that weighs her water must. With 1 (today) the core weighs the over-fill and the fall
// drops it, as it has since the hand-over was built: the difference is printed
{
  const handWater = (s) => { const wb = F.waterBySlice(s, C.frameOf(s), T); let v = 0; for (let j = 0; j < T.nS; j++) v += wb.W[j]; return v; };
  const s0 = C.createSim(ship, { weighOverfill: 0 }, SC.PRESETS.titanic.build());
  while (!s0.foundered) C.step(s0);
  const w0 = handWater(s0), c0 = C.weighedWater(s0), w1 = handWater(simF), c1 = C.weighedWater(simF);
  say('C5 (dark): at the flag the fall\'s hand-over water against the core\'s weighed water: with weighOverfill 1 (today) ' + f(w1, 1) + ' against ' + f(c1, 1) + ' m3 (the over-fill the fall drops: ' + f(c1 - w1, 1) + ' m3); with 0, ' + f(w0, 3) + ' against ' + f(c0, 3) + ' m3 (her flag at T ' + f(s0.founderT / 60, 2) + ' min)');
  row('MUST', 'C5 (dark): with weighOverfill 0 the fall\'s hand-over water is the core\'s weighed water at the flag (C.weighedWater: every space and pocket cut at its capacity)', f(w0, 3) + ' against ' + f(c0, 3) + ' m3 (' + (w0 - c0 >= 0 ? '+' : '') + (w0 - c0).toExponential(1) + ')', 'to 1e-6 m3: the same water, cut the same way (a merged pair cut side by side, not as a pair)', Math.abs(w0 - c0) < 1e-6);
}
// a pocket of the core (W6: the bunker of the fire holds its own water, outside sim.vol, until it gives way) is water in
// her, not air (QC B, B-3): a hand-over taken while the 1912 bunker holds (the preset, the first step its pockets hold
// 100 m3, opts.any). At the flag it has given way, so the hand-over above has none
{
  const sp = C.createSim(ship, {}, SC.PRESETS.titanic.build());
  const held = (s) => (s.pockets || []).reduce((a, k) => a + (k.state === 0 && k.vol > 0 ? k.vol : 0), 0);
  while (held(sp) < 100 && sp.t < 3600) C.step(sp);
  const pk = held(sp), fall = F.begin(sp, { any: true });
  let vmax = 0, fit = 0;
  for (let n = 0; n < ship.nodeVmax.length; n++) { vmax += ship.nodeVmax[n]; fit += Math.min(sp.vol[n], ship.nodeVmax[n]); }
  const airAll = fall.eng.bodies.reduce((s, b) => s + (b.air ? b.air.V0 : 0), 0);
  row('MUST', 'her air at a hand-over while a pocket of the core holds its water (the 1912 preset\'s bunker, T ' + f(sp.t / 60, 2) + ' min): her spaces less their water less the pockets\'', f(airAll, 1) + ' m3; the pockets hold ' + f(pk, 1) + ' m3',
    'the core\'s floodable ' + f(vmax, 0) + ' less ' + f(fit, 0) + ' less ' + f(pk, 1) + ' m3 = ' + f(vmax - fit - pk, 1) + ', to 0.5 m3: the pocket is water in her (QC B, B-3)', pk >= 100 && Math.abs(airAll - (vmax - fit - pk)) < 0.5);
}

// ================================================================ trial 1: terminal speeds against the closed form
{
  const sea1 = F.sea({ uniform: RHO1, depth: 3000 });
  const res = [];
  for (const mk of [sphere, plate]) {
    const s = mk(), c = closed(s), fall = F.make(sea1, [s], { dt: C.DEFAULT_PARAMS.dt });
    F.place(fall, 0, { pitch: 0, roll: 0, top: -10 });
    for (let k = 0; k < 240; k++) F.advance(fall);          // a minute: hundreds of its time constants
    res.push({ id: s.id, c, v: fall.pieces[0].speed, depth: fall.pieces[0].depth });
  }
  let cert = null;
  if (fs.existsSync(ABRES)) { const r = fs.readFileSync(ABRES, 'utf8').trim().split('\n').map(l => JSON.parse(l)); cert = r.map(a => ({ v: a.result && a.result.value !== undefined ? Number(a.result.value) : NaN, id: a.receipt && a.receipt.id, grade: a.grade })); }
  for (let i = 0; i < res.length; i++) {
    const r = res[i], c = r.c, e = (r.v - c.v) / c.v, a = cert && cert[i];
    const certOk = !!a && (a.grade === 'enclosed' || a.grade === 'exact') && Math.abs(a.v - c.v) / c.v < 1e-14;
    row('MUST', 'trial 1: ' + (r.id === 'sphere' ? 'a steel sphere of 20 mm, Cd 0.47 (R6 10.9, T2)' : 'a steel plate 2 x 1 m x 25 mm falling flat, Cd 1.17 (R6 7)') + ', let go: its steady speed', f(r.v, 6) + ' m/s after a minute (' + (e >= 0 ? '+' : '') + e.toExponential(1) + ')',
      'the closed form sqrt(2 W\' / (rho Cd A)) = ' + f(c.v, 6) + ' within 1 %; certified: ' + (a ? a.id + ' ' + (a.grade || '') + ' ' + f(a.v, 12) : 'no results file: run --abacus-requests, then abacus batch'), Math.abs(e) < 0.01 && certOk);
  }
  say('TRIAL 1: in a column of one density (1,025 kg/m3). The sphere\'s strips present ' + f(res[0].c.A * 1e4, 4) + ' cm2 (a true sphere: ' + f(Math.PI, 4) + '); its closed form on the true sphere ' + f(Math.sqrt(2 * (STEEL - RHO1) * (4 / 3) * Math.PI * 1e-6 * G / (RHO1 * 0.47 * Math.PI * 1e-4)), 3) + ' m/s (R6: 1.91 at 1,035 kg/m3); the plate\'s ' + f(res[1].c.v, 3) + ' m/s (R6: 1.66)');
  say();
}

// ================================================================ trial 2: her energy closes
{
  const lines = [];
  for (const [id, trim, K, label] of [['bow', 17, undefined, 'the bow, 17 deg by the head'], ['bow', 17, { strikeAdded: 1 }, 'the same, the water she drags carried into the mud'], ['stern', 65, undefined, 'the stern, its broken end 65 deg down']]) {
    const fall = F.make(SEA, [specOf(id, { K })], { dt: C.DEFAULT_PARAMS.dt });
    F.place(fall, 0, { pitch: trim * DEG, roll: 0, top: -1 });
    const E0 = F.energy(fall, 0);
    while (!fall.done && fall.k < 4 * 60 * 20) F.advance(fall);
    const E1 = F.energy(fall, 0), W = fall.eng.bodies[0].W, lost = E0.U - E1.U - E1.KE, diss = -(W.drag + W.mud + W.shed), e = (diss - lost) / lost;
    lines.push([label, E0.U - E1.U, E1.KE, -W.drag, -W.mud, -W.shed, e, fall.done]);
    row('MUST', 'trial 2: ' + label + ', no air, let go from rest to rest on the bed: drag\'s work plus the mud\'s' + (K ? '' : ' (and the following water\'s, shed at the strike)') + ' against the potential lost less the kinetic kept', (e >= 0 ? '+' : '') + e.toExponential(2) + ' of ' + f(lost / 1e9, 2) + ' GJ' + (fall.done ? '' : ' (NOT AT REST)'), 'to 1e-6 (the plan, section 6)', Math.abs(e) < 1e-6 && fall.done);
  }
  say('TRIAL 2, her energy from release to rest (GJ): potential lost, kinetic kept, the drag\'s work, the mud\'s, the following water\'s; the residual');
  for (const l of lines) say('  ' + l[0].padEnd(54) + l.slice(1, 6).map(v => f(v / 1e9, 3).padStart(10)).join('') + '   ' + (l[6] >= 0 ? '+' : '') + l[6].toExponential(2));
  say();
}

// ================================================================ trial 3: Boyle at 100 m
{
  const fall = F.make(SEA, [specOf('bow', { air: 1000, vent: 0 })], { dt: C.DEFAULT_PARAMS.dt });
  F.place(fall, 0, { pitch: 17 * DEG, roll: 0, top: -1 });
  const b = fall.eng.bodies[0], a = b.air.a, v100 = F.airVolume(b, SEA, 100), want = F.P_ATM / F.pAt(SEA, 100);
  // and in the fall: the first step her pocket is below 100 m, her `air` against the law at the pocket's depth
  let seen = null;
  for (let k = 0; k < 400 && !seen; k++) {
    F.advance(fall);
    const pw = F.worldOf(fall, 0, b.air.p), d = -pw[2];
    if (d >= 100) seen = { d, air: fall.pieces[0].air, law: a * F.P_ATM / F.pAt(SEA, d) };
  }
  row('MUST', 'trial 3: a space open below, taken to 100 m: the air\'s volume against its volume at the surface', f(100 * v100 / a, 3) + ' % (the column: ' + f(F.pAt(SEA, 100) / 1000, 1) + ' kPa); in the fall, at ' + f(seen.d, 1) + ' m, ' + f(seen.air, 2) + ' m3 against ' + f(seen.law, 2),
    '9.1 % (the plan\'s 4.3, derived), to its precision: 9.05 to 9.15 %; Boyle on the column\'s own pressure to 1e-12', Math.abs(v100 / a - want) < 1e-12 && v100 / a >= 0.0905 && v100 / a < 0.0915 && Math.abs(seen.air - seen.law) < 1e-9 * a);
}

// ================================================================ trial 4: the stern on its air, and without it
// D91 (2026-11-23, at stage D's landing): judged by its physics. Kept with all its air and no vent, none of its air is lost
// (its amount at one atmosphere stays). Whether it floats is Boyle's: the lumped pocket bears her weight in water down to
// the depth d* where the air has shrunk to her weight in water's volume, so she floats while her first plunge keeps the
// pocket above d* and sinks once it carries it below (a CHECK within 20 % of d*, where her momentum and her turning
// decide). On stage D's withdrawn member #1, let go from her beam ends (pitch 69, roll -80), the stern carried its pocket
// to 22.6 m against a d* of 22.8 and sank with all its air, three times her weight in water at the surface
{
  const kept = F.begin(simF, { vent: { stern: 0 } }), si = kept.pieces.findIndex(p => p.id === 'stern'), b4 = kept.eng.bodies[si];
  let alwaysUp = true, minTop = Infinity, tMin = 0, under = 0, zG9 = null, dPeak = -Infinity, tPeak = 0;
  const Gk = F.massOf(b4).g, a0 = b4.air.a, wIn = F.leverOf(b4).wIn, rho0 = b4.rhoRef, R4 = new Float64Array(9);
  // d*: where the pocket's air, a P_ATM / p, bears just her weight in water at the column's density
  const pStar = rho0 * a0 * F.P_ATM / wIn, dStar = (pStar - F.P_ATM) / (rho0 * G);
  const depthOf = () => { F.quatR(b4.q, R4); const p = b4.air.p; return -(b4.X[2] + R4[6] * (p[0] - b4.C[0]) + R4[7] * (p[1] - b4.C[1]) + R4[8] * (p[2] - b4.C[2])); };
  for (let k = 0; k < 10 * 240; k++) {
    F.advance(kept);
    if (b4.top < minTop) { minTop = b4.top; tMin = kept.t - kept.t0; }
    if (!(b4.top > 0)) { alwaysUp = false; under += 0.25; }
    if (k === 9 * 240 - 1) zG9 = F.worldOf(kept, si, Gk)[2];
    const d = depthOf(); if (d > dPeak) { dPeak = d; tPeak = kept.t - kept.t0; }
  }
  const ak = attitude(kept.pieces[si].q), zG10 = F.worldOf(kept, si, Gk)[2];
  // afloat at the end of ten minutes: some of her above the sea and her centre of mass within 20 m of it [mine]
  const floats = b4.top > 0 && zG10 > -20, lost = Math.abs(b4.air.a - a0) / a0;
  row('MUST', 'trial 4: the stern at the flag with all its air kept and no vent: none of its air is lost', f(a0, 0) + ' m3 at one atmosphere at the flag, ' + f(b4.air.a, 0) + ' after ten minutes (' + lost.toExponential(1) + ' apart)', 'the same to 1e-9: with no vent the pocket gives up no air (D91)', lost <= 1e-9);
  const nearStar = dPeak > 0.8 * dStar && dPeak < 1.25 * dStar, agrees = floats ? dPeak < dStar : dPeak > dStar;
  row(nearStar ? 'CHECK' : 'MUST', '  ... and its fate is Boyle\'s: it floats while its pocket stays above d*, and sinks once its plunge carries it below', (floats ? 'floats' : 'sinks') + ' (at 10 min its highest point ' + f(b4.top, 1) + ' m, its centre of mass ' + f(zG10, 1) + ' m); its pocket at most ' + f(dPeak, 1) + ' m down (+' + f(tPeak, 0) + ' s); d* ' + f(dStar, 1) + ' m (its air ' + f(rho0 * a0 / wIn, 2) + ' times her weight in water at the surface)',
    'the same side of d* (D91: judged by its physics); a CHECK within 20 % of d*, where her momentum and her turning decide' + (nearStar ? ' (here)' : ''), agrees);
  row('CHECK', '  ... and it floats (the plan, section 6), its centre within 20 m of the sea at ten minutes', (floats ? 'floats' : 'DOES NOT FLOAT') + ': its highest point ' + f(b4.top, 1) + ' m up, its centre of mass ' + f(Math.abs(zG10), 1) + ' m ' + (zG10 >= 0 ? 'above' : 'below') + ' the sea (' + (zG10 - zG9 >= 0 ? '+' : '') + f(zG10 - zG9, 2) + ' m on a minute before); pitch ' + f(ak.pitch, 0) + ', roll ' + f(ak.roll, 0) + ', ' + f(kept.pieces[si].air, 0) + ' m3 of air',
    'floats: its air bears more than her weight in water at the surface. A MUST until stage D\'s landing (D91): let go from her beam ends, her first plunge can carry the pocket past d* and she sinks with all her air', floats);
  row('CHECK', '  ... and it never goes wholly under', alwaysUp ? 'never: its highest point ' + f(minTop, 1) + ' m up at the least' : 'wholly under for ' + f(under, 2) + ' s in all; its highest point ' + f(minTop, 1) + ' m at the lowest, ' + f(tMin, 1) + ' s after the flag, before it rose again',
    'a floating stern rides it out; the lumped pocket, one point squeezed as a whole wherever her rolling takes it, is Z1\'s stand-in for Z6\'s spaces', alwaysUp);
  const none = F.begin(simF, { air: { stern: 0 } }), ni = none.pieces.findIndex(p => p.id === 'stern');
  const bn = none.eng.bodies[ni], Gs = F.massOf(bn).g;
  let tUnder = null, rose = false, cameUp = false, low = Infinity, maxRise = 0;
  for (let k = 0; k < 20 * 240 && !none.done; k++) {
    F.advance(none);
    const z = F.worldOf(none, ni, Gs)[2];
    if (tUnder === null && !(bn.top > 0)) tUnder = none.t - none.t0;
    if (tUnder !== null) { if (bn.top > 0) cameUp = true; if (z < low) low = z; if (z - low > maxRise) maxRise = z - low; }
  }
  rose = maxRise > 1;
  row('MUST', '  ... and with none: it leaves the surface at once and never rises', 'wholly under ' + f(tUnder, 2) + ' s after the flag; afterwards ' + (cameUp ? 'CAME BACK ABOVE THE SEA' : 'never above the sea again') + ', its centre of mass rising at most ' + f(maxRise, 2) + ' m above its lowest so far',
    'under within a minute ("at once") and never above the sea again; its centre never more than 1 m above its lowest [the bands: mine, set before the run]', tUnder !== null && tUnder <= 60 && !cameUp && !rose);
}

// ================================================================ trial 5: end on; the spheroid; the rocking
{
  const endOn = [['bow', 85, 'the bow, its stem 85 deg down'], ['stern', 85, 'the stern, its broken end 85 deg down']].map(([id, trim, label]) => Object.assign(letGo(id, { trim }, { trace: true }), { label }));
  // "lands level" is the plan's and R6's (T5), from a prototype in the vertical plane: level along her length. Whether she
  // is upright is a separate row. (A first draft asked both of one MUST row; the bow failed it upside down.)
  for (const r of endOn) {
    row('MUST', 'trial 5: ' + r.label + ' (end on, 5 deg off: nothing is on end exactly): she turns broadside and lands level', 'within 10 deg of level ' + f(r.broadside, 1) + ' s after release; at the bed pitch ' + f(r.pitch, 1) + ' deg; ' + where1(r),
      'lands level (the plan; R6 10.9, T5: broadside in tens of seconds; 2.2: 5 to 12 s e-folding); level: her pitch within 10 deg [mine]', r.done && Math.abs(r.pitch) < 10);
    row('CHECK', '  ... and upright', 'roll ' + f(r.roll, 1) + ' deg on the bed', 'the wreck lies upright (R5 1.1). End on, what holds her roll is where her weight in water acts against her envelope\'s centre (section "THE PIECES": above it she turns over, below it she rights)', Math.abs(r.roll) < 30);
  }
  // the spheroid of L/D 5 held at 30 deg in a stream of 10 m/s, the potential flow alone
  const a = 50, bb = 10, n = 200, dx = 2 * a / n, sl = [];
  for (let i = 0; i < n; i++) { const x = -a + (i + 0.5) * dx, r = bb * Math.sqrt(1 - x * x / (a * a)), py = [], pz = []; for (let k = 0; k < 24; k++) { const t = 2 * Math.PI * k / 24; py.push(r * Math.cos(t)); pz.push(bb + r * Math.sin(t)); } sl.push({ x, dx, B: 2 * r, H: 2 * r, Venv: Math.PI * r * r * dx, ey: 0, ez: bb, Vf: 0, ms: 1000 * Math.PI * r * r * dx, gx: x, gy: 0, gz: bb, poly: { y: py, z: pz }, shape: 'circle' }); }
  const sph = F.body({ id: 'spheroid', kind: 'body', slices: sl, K: { rhoRef: RHO1, drag: 0 } }, F.sea({ uniform: RHO1, depth: 3000 }));
  const U = 10, al = 30 * DEG, V = 4 / 3 * Math.PI * a * bb * bb, Lb = F.lamb(5);
  const L = F.potentialLoads(sph, [U * Math.cos(al), 0, U * Math.sin(al), 0, 0, 0]);
  const want = (Lb.k2 - Lb.k1) * RHO1 * V * U * U * Math.sin(al) * Math.cos(al), fn = Math.sqrt(L.F[0] * L.F[0] + L.F[1] * L.F[1] + L.F[2] * L.F[2]);
  row('MUST', 'trial 5: a spheroid of L/D 5 held at 30 deg in a stream of 10 m/s, no viscous terms: Munk\'s moment and no net force', 'moment ' + f(L.T[1] / 1e6, 4) + ' MN m (' + ((L.T[1] - want) / want >= 0 ? '+' : '') + ((L.T[1] - want) / want).toExponential(1) + '), turning it broadside; net force ' + fn.toExponential(1) + ' N',
    '(k2 - k1) rho V U^2 sin a cos a = ' + f(want / 1e6, 4) + ' MN m, to 1 %; zero force (R6 10.9, T3)', Math.abs(L.T[1] - want) / want < 0.01 && fn < 1e-9 * want / a && L.T[1] > 0);
  // her rocking after she turns broadside: its period against the experiments' law
  for (const r of endOn) {
    const P = r.pitches, cross = [];
    let amp = 0;
    for (let k = 1; k < P.length; k++) { if (P[k][0] < r.broadside) continue; if ((P[k - 1][1] < 0) !== (P[k][1] < 0)) cross.push(P[k][0]); }
    for (const q of P) if (q[0] > r.broadside + 60) amp = Math.max(amp, Math.abs(q[1]));
    const b = r.b, mtot = b.mass, rhoB = mtot / b.V, rho = SEA.rho[0], fr = 0.126 * Math.sqrt((rhoB - rho) / rhoB * G / b.L), Tlaw = 1 / fr;
    const Tm = cross.length >= 3 ? 2 * (cross[cross.length - 1] - cross[0]) / (cross.length - 1) : NaN;
    row('CHECK', 'trial 5: ' + r.label + ': if she rocks, near the experiments\' frequency', cross.length >= 3 ? 'rocks at a period of ' + f(Tm, 0) + ' s (' + cross.length + ' crossings of level); the largest swing from a minute after she turned ' + f(amp, 1) + ' deg' : 'she does not rock: ' + cross.length + ' crossing(s) of level after she turned; the largest swing from a minute after she turned ' + f(amp, 1) + ' deg',
      '0.126 sqrt(drho / rho g / L) gives a period of ' + f(Tlaw, 0) + ' s (R6 2.1; Marchildon, Chow and Adams); near: within 30 % [mine]; the experiments rock 10 to 70 deg, a strip model with steady terms damps it (R6 2.2)', cross.length >= 3 && Math.abs(Tm / Tlaw - 1) <= 0.3);
  }
}

// ================================================================ trials 6, 7, 8, 9, 10: the record's attitudes, the fit, the speeds
const grid = [];
for (const trim of [11, 17, 25]) for (const list of [0, 5, 10]) grid.push(letGo('bow', { trim, list }));
const sterns = [45, 65, 85].map(trim => letGo('stern', { trim }));
{
  say('TRIALS 6 TO 10: each part let go at rest, wholly under, flooded, with the model\'s own weights (lever 0); where it lands, its centre against the point under the break');
  say('  piece   trim  list   to the bed   arrives m/s   energy GJ   lands at                       pitch  roll   in the mud: deepest  stem  torn end');
  for (const r of grid.concat(sterns)) say('  ' + r.id.padEnd(6) + f(r.pose.trim, 0).padStart(6) + f(r.pose.list || 0, 0).padStart(6) + (f(r.tBed / 60, 2) + ' min').padStart(13) + f(r.speed, 2).padStart(14) + f(r.energy / 1e9, 2).padStart(12) + ('   ' + where1(r)).padEnd(34) + f(r.pitch, 1).padStart(6) + f(r.roll, 1).padStart(6) + f(r.bury, 1).padStart(17) + f(r.id === 'bow' ? r.stem : r.tail, 1).padStart(7) + f(r.id === 'bow' ? r.tail : r.stem, 1).padStart(9));
  say();
  const tb = grid.map(r => r.tBed / 60);
  // a CHECK since D53 (Bo, 2026-11-20 10:09 CST: "trial 6 as a check"): R5 calls these times reconstructions and says to
  // check against them (its 10d, item 10); the band stays, and a miss stays printed
  row('CHECK', 'trial 6: the bow, flooded, let go at rest at 11 to 25 deg by the head, listing 0 to 10 to port: time to the bed', f(Math.min(...tb), 2) + ' to ' + f(Math.max(...tb), 2) + ' min over the nine', '4.5 to 7 min (R5 10b: the reconstructions; Uchupi, Ballard and Lange 5 to 6); a CHECK since D53 (Bo, 2026-11-20: R5 10d item 10, "check against them")', tb.every(t => t >= 4.5 && t <= 7));
  const up = grid.concat(sterns).filter(r => Math.abs(r.roll) < 30).length;
  row('CHECK', '  ... and she lands upright', up + ' of ' + (grid.length + sterns.length) + ' within 30 deg of upright; rolls from ' + f(Math.min(...grid.concat(sterns).map(r => r.roll)), 1) + ' to ' + f(Math.max(...grid.concat(sterns).map(r => r.roll)), 1) + ' deg',
    'the wreck: the bow upright, about 5 deg to port; the stern upright (R5 1.1, 10b)', up === grid.length + sterns.length);
}
// trial 7: the fit. The bow at the middle of trial 6's ranges (18 deg, 5 to port), the stern at the middle of its range (65
// deg); each lever found so that its centre lands 772 m (the bow) and 148 m (the stern) from the point under the break, on
// the survey's side: both ahead of it along her heading (R5 1.1: the bow 772 m due north of the boiler field, the stern
// 148 m north-west of it, the two 689 m apart, so on one side). The root nearest the model's own lever on that side, by
// secant steps on her place along her heading, to a metre. D91 (2026-11-23): fitted on the distance alone, the fit took
// the bow's root on the far side once C3 restored her ends (on the girder's a = 0.40: 772 m astern), and trial 10 read
// 920 m
function fitLever(id, pose, target) {
  const runs = [];
  const at = (L) => { const r = letGo(id, pose, { lever: L }); runs.push(r); return r; };
  let a = 0, ra = at(a), b = target > ra.along ? 0.5 : -0.5, rb = at(b);
  for (let k = 0; k < 14; k++) {
    if (Math.abs(rb.along - target) < 1) return { L: b, r: rb, untuned: runs[0], n: runs.length };
    const s = (rb.along - ra.along) / (b - a), step = s !== 0 ? (target - rb.along) / s : (target > rb.along ? 0.5 : -0.5);
    const c = b + Math.max(-2, Math.min(2, step));
    a = b; ra = rb; b = c; rb = at(b);
  }
  return { L: b, r: rb, untuned: runs[0], n: runs.length, miss: true };
}
const FIT = { bow: fitLever('bow', { trim: 18, list: 5 }, 772), stern: fitLever('stern', { trim: 65 }, 148) };
{
  const fb = FIT.bow, fs2 = FIT.stern;
  say('TRIAL 7, THE FIT: the one fitted number, her weight\'s lever (decision D49), moved so that the bow lands 772 m from the point under the break and the stern 148 m');
  for (const [id, ft] of [['bow', fb], ['stern', fs2]]) {
    const u = ft.untuned, r = ft.r;
    say('  ' + id.padEnd(6) + ' let go at ' + f(u.pose.trim, 0) + ' deg' + (u.pose.list ? ', ' + f(u.pose.list, 0) + ' to port' : '') + ': untuned (lever ' + f(u.lev, 2) + ' m) ' + where1(u) + '; fitted: the lever moved ' + (ft.L >= 0 ? '+' : '') + f(ft.L, 2) + ' m to ' + f(r.lev, 2) + ' m, ' + where1(r) + ' (' + ft.n + ' runs)');
    if (u.x90) say('         the first 90 s (the dive and the pull-out): ' + f(u.x90[0], 0) + ' m along untuned, ' + f(r.x90[0], 0) + ' m fitted; the creep after: ' + f(u.along - u.x90[0], 0) + ' m untuned, ' + f(r.along - r.x90[0], 0) + ' m fitted');
  }
  say();
  // D91 (2026-11-23, at stage D's landing): the MUST is the fitted lever's own size, her weight in water against the
  // middle of her plan; how far the fit moved it from the model's own is a CHECK. C3's restored ends widen her planform at
  // both ends and move its middle (the bow's +3.5 m, the stern's -6.1 m). On the girder's a = 0.40 her weight in water
  // stayed (within 0.6 m) and the fit grew to +5.12 and -5.91 m; with a refitted to C-7 at 0.660 (D92) her weight moves
  // out with her ends (the bow's +5.5 m, the stern's -5.0 m) and the fit is within 3 m again. The fitted lever did not
  // move (+2.06 and +2.26 m on both; +1.81 and +2.00 before the landing, e115): the requirement stands, and the reference
  // moves with her weights
  for (const [id, ft, tgt] of [['bow', fb, 772], ['stern', fs2, 148]]) {
    row('MUST', 'trial 7: the fitted lever, the ' + id + ': her weight in water against the middle of her plan, so that she lands ' + tgt + ' m ahead of the point under the break', (ft.r.lev >= 0 ? '+' : '') + f(ft.r.lev, 2) + ' m (the model\'s own ' + (ft.untuned.lev >= 0 ? '+' : '') + f(ft.untuned.lev, 2) + ' m, the fit ' + (ft.L >= 0 ? '+' : '') + f(ft.L, 2) + ' m)' + (ft.miss ? '; NOT FOUND within 14 runs' : ''),
      'within 3 m of the plan\'s middle (D91; the plan, section 6; D49; R5 1.1 and 10a); +1.81 m and +2.00 m before stage D\'s landing (e115)', !ft.miss && Math.abs(ft.r.lev) <= 3);
    row('CHECK', '  ... and the fit\'s size, the ' + id + ', against the model\'s own lever', (ft.L >= 0 ? '+' : '') + f(ft.L, 2) + ' m (from ' + f(ft.untuned.lev, 2) + ' m to ' + f(ft.r.lev, 2) + ' m)',
      'within 3 m (D49). Out between C3 and D92 (+5.12 and -5.91 m on a = 0.40, D91): her ends widened her planform and moved its middle while her weight stayed; a refitted to 0.660 moves her weight out with them (e115)', !ft.miss && Math.abs(ft.L) <= 3);
  }
  row('CHECK', '  ... where each lands untuned: the bow at the middle of trial 6\'s range, the stern at 65 deg', 'the bow ' + where1(fb.untuned) + '; the stern ' + where1(fs2.untuned) + '; over trial 6\'s nine ' + f(Math.min(...grid.map(r => r.dist)), 0) + ' to ' + f(Math.max(...grid.map(r => r.dist)), 0) + ' m; the stern at 45 to 85 deg ' + f(Math.min(...sterns.map(r => r.dist)), 0) + ' to ' + f(Math.max(...sterns.map(r => r.dist)), 0) + ' m',
    'the survey: 772 and 148 m (R5 10a); the prototype, untuned: 560 to 750 m and 70 to 190 m (the plan, 4.4)', fb.untuned.dist >= 560 && fb.untuned.dist <= 750 && fs2.untuned.dist >= 70 && fs2.untuned.dist <= 190);
  row('CHECK', '  ... the bow\'s dive and its creep apart', 'untuned: ' + f(fb.untuned.x90[0], 0) + ' m in the first 90 s, ' + f(fb.untuned.along - fb.untuned.x90[0], 0) + ' m of creep after; fitted: ' + f(fb.r.x90[0], 0) + ' and ' + f(fb.r.along - fb.r.x90[0], 0) + ' m',
    'the plan (4.4): 300 to 400 m of dive and pull-out at the record\'s trim, the rest a creep set by the lever', fb.untuned.x90[0] >= 300 && fb.untuned.x90[0] <= 400);
  // with the fitted levers over the record's ranges
  const spread = grid.map(g => letGo('bow', g.pose, { lever: fb.L })), sp2 = sterns.map(s => letGo('stern', s.pose, { lever: fs2.L }));
  row('CHECK', '  ... and with the fitted levers over the whole of the ranges', 'the bow at 11 to 25 deg, 0 to 10 to port: ' + f(Math.min(...spread.map(r => r.dist)), 0) + ' to ' + f(Math.max(...spread.map(r => r.dist)), 0) + ' m; the stern at 45 to 85 deg: ' + f(Math.min(...sp2.map(r => r.dist)), 0) + ' to ' + f(Math.max(...sp2.map(r => r.dist)), 0) + ' m',
    'the survey\'s 772 and 148 m; R5 10b\'s bands: the bow 540 to 950 m from the point under the break, the stern 0 to 300 m', spread.every(r => r.dist >= 540 && r.dist <= 950) && sp2.every(r => r.dist <= 300));
  // trial 8: speeds at the bed
  const all = grid.concat(sterns, [fb.r, fs2.r]), spd = all.map(r => r.speed);
  row('MUST', 'trial 8: the speed at the bed, every run of trials 6 and 7 (' + all.length + ')', f(Math.min(...spd), 2) + ' to ' + f(Math.max(...spd), 2) + ' m/s', '5 to 10 m/s (Best, Powrie, Hayward and Barton 2000, computed: R5 10b); 10 to 13.4 is the outer band (estimates)', spd.every(v => v >= 5 && v <= 10));
  // trial 9: the late release
  const late = letGo('bow', { trim: 69 }), lateFit = letGo('bow', { trim: 69 }, { lever: fb.L });
  row('CHECK', 'trial 9: a bow let go standing 69 deg by the head (as if it hung from the stern by her bottom)', 'untuned ' + where1(late) + '; with the fitted lever ' + where1(lateFit),
    'reported against 772 m: the mark of a late release (the plan 5.6, item 3: about 1,400 m); in: beyond 950 m, the far edge of R5\'s band', late.dist > 950);
  // trial 10: the pair
  const dX = fb.r.along - fs2.r.along, dY = fb.r.across - fs2.r.across, sep = Math.sqrt(dX * dX + dY * dY);
  row('MUST', 'trial 10: trial 7\'s pair, bow to stern on the bed (both fitted on the survey\'s side, D91)', f(sep, 0) + ' m (the bow ' + f(fb.r.along, 0) + ' m along, the stern ' + f(fs2.r.along, 0) + ' m along)', '550 to 800 m (R5 10b: 689 m by the positions; "some 600 m" as published)', sep >= 550 && sep <= 800);
}

// ================================================================ the step's convergence
{
  const half = { sub: 2 * F.K0.sub, subBed: 2 * F.K0.subBed };
  const pairs = [['bow', { trim: 18, list: 5 }], ['stern', { trim: 65 }]].map(([id, pose]) => [letGo(id, pose), letGo(id, pose, { K: half })]);
  const moved = pairs.map(([a, b]) => Math.sqrt((a.along - b.along) * (a.along - b.along) + (a.across - b.across) * (a.across - b.across)));
  const dt = pairs.map(([a, b]) => Math.abs(a.tBed - b.tBed)), dsp = pairs.map(([a, b]) => Math.abs(a.speed - b.speed));
  row('MUST', 'convergence: the step halved (' + half.sub + ' and ' + half.subBed + ' sub-steps in the water and at the bed, from ' + F.K0.sub + ' and ' + F.K0.subBed + ')', 'the place on the bed moves ' + moved.map(v => f(v, 3)).join(' and ') + ' m (bow, stern); the time to the bed ' + dt.map(v => f(v, 2)).join(' and ') + ' s; the speed there ' + dsp.map(v => f(v, 4)).join(' and ') + ' m/s',
    'under a metre (the brief)', moved.every(v => v < 1));
}

// ================================================================ trial 11: the same bits
{
  const fp = (fall) => { const h = crypto.createHash('sha256'); for (const p of fall.pieces) { h.update(Buffer.from(new Float64Array(p.r.concat(p.q, p.v, p.om, [p.depth, p.speed, p.air])).buffer)); h.update(Buffer.from(p.bury.buffer, p.bury.byteOffset, p.bury.byteLength)); } h.update(JSON.stringify(fall.events)); return h.digest('hex'); };
  const run = (fall, k) => { while (!fall.done && fall.k < k) F.advance(fall); return fall; };
  const a = run(F.begin(simF), 1e9), b = run(F.begin(simF), 1e9);
  const c = run(F.begin(simF), 800), saved = structuredClone(c), d = run(saved, 1e9), e2 = run(c, 1e9);
  const ha = fp(a), hb = fp(b), hd = fp(d), he = fp(e2);
  row('MUST', 'trial 11: the 1912 hand-over run twice; and saved 200 s in (a structured clone of sim.fall) and taken up again', 'the bed\'s place and time: ' + ha.slice(0, 16) + ' twice' + (ha === hb ? '' : ' (DIFFERS: ' + hb.slice(0, 16) + ')') + '; taken up: ' + hd.slice(0, 16) + ', the run it was saved from: ' + he.slice(0, 16), 'the same bits (the plan, section 6)', ha === hb && hd === ha && he === ha);
  // the fall writes nothing into the sim but sim.fall
  row('MUST', 'the fall reads the sim and writes nothing but sim.fall: the core\'s whole state before begin() and after every fall above', coreHash(simF).slice(0, 16), hash0.slice(0, 16) + ' at the flag', coreHash(simF) === hash0);
  // the contract's fields, exactly
  const want = ['v', 'rule', 't0', 'k', 't', 'done', 'sea', 'at', 'breakAt', 'pieces', 'debris', 'events', 'lights', 'eng'].sort().join(), pk = ['id', 'x0', 'x1', 'r', 'q', 'v', 'om', 'state', 'depth', 'speed', 'air', 'bury'].sort().join(), ek = ['t', 'id', 'piece', 'depth', 'energy', 'speed'].sort().join();
  const ba = a.breakAt, baOk = Array.isArray(ba) && ba.length === 2 && ba.every(isFinite);
  const ok = Object.keys(a).sort().join() === want && a.pieces.every(p => Object.keys(p).sort().join() === pk && p.bury instanceof Float64Array) && a.events.every(e => Object.keys(e).sort().join() === ek) && a.v === 3 && baOk && a.rule === 'flag' && Array.isArray(a.debris) && a.lights === null;
  row('MUST', 'sim.fall is the plan\'s contract (5.1; v: 3, which is v: 2 and lights, G2): its keys, each piece\'s and each event\'s, and nothing else but the engine\'s own key', Object.keys(a).join(', ') + '; a piece: ' + Object.keys(a.pieces[0]).join(', ') + '; breakAt ' + (baOk ? '[' + ba.map(v => f(v, 2)).join(', ') + ']' : String(ba)) + '; lights ' + (a.lights === null ? 'null' : 'set'), 'the contract\'s fields exactly, plus `eng` (the engine\'s state, which the page does not read); breakAt two numbers; lights null on a preset with no plant (night_after_tests holds them on the watch)', ok);
  H1 = a;
}

// ================================================================ trial 12: the 1912 preset's state at the flag (H1)
{
  const fall = H1, bi = fall.pieces.findIndex(p => p.id === 'bow'), si = fall.pieces.findIndex(p => p.id === 'stern');
  const land = (i) => { const p = fall.pieces[i], w = F.worldOf(fall, i, [0.5 * (p.x0 + p.x1), 0, GI.Z_NA]), dX = w[0] - fall.breakAt[0], dY = w[1] - fall.breakAt[1]; return { along: dX, across: dY, dist: Math.sqrt(dX * dX + dY * dY), a: attitude(p.q) }; };
  const B = land(bi), S = land(si), ev = (id, pc) => fall.events.find(e => e.id === id && e.piece === pc);
  say('TRIAL 12: the 1912 damage preset at its flag (T ' + f(fall.t0 / 60, 2) + ' min), cut in two at x ' + XB + ' (the interim rule H1: the break taken at the flag; her pose there is the model\'s, not hers)');
  for (const [pc, L] of [['bow', B], ['stern', S]]) {
    const u = ev('under', pc), s = ev('strike', pc), r = ev('rest', pc);
    say('  ' + pc.padEnd(6) + 'wholly under ' + f(u ? u.t - fall.t0 : NaN, 1) + ' s after the flag; on the bed ' + f(s ? (s.t - fall.t0) / 60 : NaN, 2) + ' min after it at ' + f(s ? s.speed : NaN, 2) + ' m/s (' + f(s ? s.energy / 1e9 : NaN, 2) + ' GJ); lands ' + f(L.dist, 0) + ' m from the point under the break (along ' + f(L.along, 0) + ', across ' + f(L.across, 0) + '), pitch ' + f(L.a.pitch, 1) + ', roll ' + f(L.a.roll, 1) + '; at rest ' + f(r ? (r.t - fall.t0) / 60 : NaN, 2) + ' min');
  }
  say('  events: ' + fall.events.map(e => e.id + ' ' + e.piece + ' +' + f(e.t - fall.t0, 1) + ' s').join('; '));
  say();
  const pair = Math.sqrt((B.along - S.along) * (B.along - S.along) + (B.across - S.across) * (B.across - S.across));
  row('CHECK', 'trial 12: the 1912 preset\'s state at the flag (H1): where the bow lands', f(B.dist, 0) + ' m from the point under the break (along her heading ' + f(B.along, 0) + ', across ' + f(B.across, 0) + '); the stern ' + f(S.dist, 0) + ' m; the two ' + f(pair, 0) + ' m apart',
    'reported against the bow 772 m and the stern 148 m (R5 10a), the two 689 m apart (R5 10b); expected about 1,400 m until Z4 (the plan 5.2): she is let go from the model\'s flag, 69 deg by the head and on her beam ends, so she dives end on first; in: 1,000 to 1,800 m.'
    + ' Beside it, a knife-edge: let go afloat a minute or two before the flag, the bow stands on its nose on its air and its bearing swings by the quarter-minute; with no air it falls flat and lands 724 to 792 m off (Z1, 2026-11-20, on the mainline\'s tiers with the share at 0). Its place waits for B4 (the hinge) and Z6 (the air)', B.dist >= 1000 && B.dist <= 1800);
  row('CHECK', '  ... and how the two pieces lie', 'the bow pitch ' + f(B.a.pitch, 1) + ', roll ' + f(B.a.roll, 1) + '; the stern pitch ' + f(S.a.pitch, 1) + ', roll ' + f(S.a.roll, 1) + ' deg',
    'the wreck: both upright (R5 1.1). Handed over at the flag on the core\'s 80 deg of list (rule H1). Until G12 the one lumped pocket stood where the air lay at the flag, low in her, and which way each piece landed turned on a hair; through each slice\'s floodable centre (K.airAt) both land upright under trial 14\'s five ways', Math.abs(B.a.roll) < 30 && Math.abs(S.a.roll) < 30);
}

// ================================================================ trial 13: the joint (Z6 inside B4, milestone 1)
// docs/DESIGN_free_body_air_by_space_v1_2: the bow and the stern pinned at the break while the ligament holds, the hinge
// elastic-plastic on S.hinge (core/readers/section.js), the release on the joint's own force; the solver proved on rigid
// bodies against closed forms in docs/research/experiments/e68_z6_joint_rigs.js. Here on the engine's own bodies:
//   (a) the pair wholly under, no air, 8 deg by the head, from rest to rest: the energy identity with the tear's work;
//   (b) the 1912 watch handed over at B2's onset (the what-if 'onset', Z3), as built: the locked freedoms held, the
//       release on the first sub-step past the ligament, the hand-over's moment and shear against the gauge's;
//   (c) the ligament's what-ifs: where the pieces land, reported beside the record, never chosen by it.
// Only a hand-over that asks for a hinge builds a joint: every trial above, and the watch's own hand-over (H1), are as
// before, to the bit. Milestone 1 keeps one pocket of air a piece and its stand-in vent (Z6's spaces are milestone 2):
// the stern's minutes afloat here are the stand-in's, not physics.
{
  // (a) the energy identity with the joint
  const fa = F.make(SEA, [specOf('bow'), specOf('stern')], { dt: C.DEFAULT_PARAMS.dt });
  const Ra = F.poseR(8 * DEG, 0);
  for (let i = 0; i < 2; i++) F.place(fa, i, { R: Ra, r: [0, 0, 0] });
  const top = Math.max(fa.eng.bodies[0].top, fa.eng.bodies[1].top);
  for (let i = 0; i < 2; i++) F.place(fa, i, { R: Ra, r: [0, 0, -1 - top] });
  const JA = F.join(fa, { x: XB, sense: 'hog', Lh: 20 }, ship);
  const E0 = [0, 1].map(i => F.energy(fa, i));
  while (!fa.done && fa.k < 4 * 60 * 20) F.advance(fa);
  const E1 = [0, 1].map(i => F.energy(fa, i)), Wa = [0, 1].map(i => fa.eng.bodies[i].W);
  const lost = (E0[0].U + E0[0].KE + E0[1].U + E0[1].KE) - (E1[0].U + E1[0].KE + E1[1].U + E1[1].KE);
  const dissA = -(Wa[0].drag + Wa[0].mud + Wa[0].shed + Wa[1].drag + Wa[1].mud + Wa[1].shed), eA = (dissA + JA.W - JA.Wproj - lost) / lost;
  row('MUST', 'trial 13a: the joint, the pair wholly under, no air, 8 deg by the head, from rest to rest: the drag\'s, the mud\'s and the tear\'s work against the energy lost', (eA >= 0 ? '+' : '') + eA.toExponential(2) + ' of ' + f(lost / 1e9, 2) + ' GJ (the tear ' + f(JA.W / 1e6, 2) + ' MJ, the drift\'s move ' + f(JA.Wproj / 1e6, 4) + ' MJ; ' + (JA.released ? 'let go at +' + f(JA.release.t, 1) + ' s by ' + JA.release.by : 'held to the bed') + ')' + (fa.done ? '' : ' (NOT AT REST)'),
    'to 1e-6, as trial 2 (the constraint does no work at the middle; the hinge\'s work counted as the bodies meet it)', Math.abs(eA) < 1e-6 && fa.done);

  // (b) the 1912 watch at B2's onset, as built (Lh 20 m)
  const sw = N.create(C.buildShip(), N.spec(1912), { auto: true, handover: 'onset' });
  while (!N.over(sw)) N.step(sw);
  const fd = sw.onset.found;
  const run = (label, hg) => {
    const fall = F.begin(sw, { any: true, cut: fd.x, rule: 'break', t0: fd.t, hinge: Object.assign({ sense: fd.sense, Lh: 20, trace: true }, hg) }), J = fall.eng.joint;
    while (!fall.done && fall.k < 4 * 60 * 20) F.advance(fall);
    const land = (i) => { const p = fall.pieces[i], w = F.worldOf(fall, i, [0.5 * (p.x0 + p.x1), 0, GI.Z_NA]), dX = w[0] - fall.breakAt[0], dY = w[1] - fall.breakAt[1]; return { along: dX, across: dY, dist: Math.sqrt(dX * dX + dY * dY), a: attitude(p.q) }; };
    const ev = (id, pc) => fall.events.find(e => e.id === id && e.piece === pc);
    return { label, fall, J, B: land(0), S: land(1), uS: ev('under', 'stern'), uB: ev('under', 'bow') };
  };
  const base = run('as built, Lh 20 m', {}), J = base.J, tr = J.trace, last = tr.length - 1;
  row('MUST', 'trial 13b: the 1912 watch handed over at B2\'s onset (step ' + fd.k + ', x ' + f(fd.x, 2) + ', ' + fd.sense + '), joined: the five locked freedoms after each sub-step\'s projection', 'at most ' + J.resid.toExponential(1) + ' (m, rad) over ' + tr.length + ' joined sub-steps; the drift each removed at most ' + J.drift.toExponential(1) + ' m',
    'under 1e-9 (e68 A2: 3e-14 on rigid bodies)', J.resid < 1e-9);
  const before = tr.slice(0, J.released ? last : tr.length).every(r => r[0] <= 1 && r[1] <= 1), at = J.released ? (tr[last][0] > 1 || tr[last][1] > 1) : true;
  row('MUST', '  ... it lets go on the first sub-step whose own force passes what still holds (S.hinge: tension above Nt, shear above Vs)', J.released ? 'at +' + f(J.release.t - fd.t, 3) + ' s by ' + J.release.by + ' (N/Nt ' + f(J.release.rN, 4) + ', |V|/Vs ' + f(J.release.rV, 4) + '); every sub-step before within (largest ' + f(J.release.maxN, 4) + ', ' + f(J.release.maxV, 4) + ')' : 'held to the end',
    'the release sub-step past 1, none before it (e68 D: on the exact sub-step)', before && at);
  // B4's gate 5 (join 20's plan; Z1 with B1+B2, 2026-11-24): the release converges. With the hinge's moment at the
  // sub-step's middle (hinge.at 'mid', the default since the mend), the default sub-step (K.sub 8) lets go within a stated
  // tolerance of K.sub 64, by the same sense: 0.1 s, three of the coarse sub-steps [mine: B1+B2's sweep found 8, 16, 32 and
  // 64 within 0.07 s on member C, about 0.1 s on every kept member]. The scheme before ('start', its moment frozen at the
  // sub-step's start) let go at +15.00 s at K.sub 8, +20.83 at 16 and +22.64 at 64: its explicit step pumped the joint's
  // elastic mode (about 1 s) until it crossed the yield on a peak. Named, it is that scheme to the bit: its trace and
  // release frozen from 42e6911 (the tree before the mend)
  const joinedTo = (hg, K) => { const fc = F.begin(sw, { any: true, cut: fd.x, rule: 'break', t0: fd.t, hinge: Object.assign({ sense: fd.sense, Lh: 20 }, hg), K }), Jx = fc.eng.joint; while (!Jx.released && !fc.done && fc.k < 4 * 60 * 5) F.advance(fc); return Jx; };
  const Jc = joinedTo({}, { sub: 8 * F.K0.sub }), TOL5 = 0.1;
  const dRel = J.released && Jc.released ? Math.abs((Jc.release.t - fd.t) - (J.release.t - fd.t)) : NaN;
  row('MUST', '  ... B4\'s gate 5: the release converges: the default sub-step (K.sub ' + F.K0.sub + ') against K.sub ' + 8 * F.K0.sub, J.released && Jc.released ? 'at +' + f(J.release.t - fd.t, 4) + ' s by ' + J.release.by + ' against +' + f(Jc.release.t - fd.t, 4) + ' s by ' + Jc.release.by + ' (' + f(dRel, 4) + ' s apart); theta ' + f(J.release.theta / DEG, 3) + ' and ' + f(Jc.release.theta / DEG, 3) + ' deg' : 'NOT RELEASED',
    'within ' + TOL5 + ' s, its sense the same', J.released && Jc.released && dRel <= TOL5 && Jc.release.by === J.release.by);
  // (frozen before join 22: the four consistencies named at their values then, D116)
  const Js = joinedTo({ at: 'start', trace: true, yieldOn: 'moment' }, { peakTank: 'solid', section: 'decimated', weather: 'none' }), hs5 = crypto.createHash('sha256');
  hs5.update(Buffer.from(new Float64Array(Js.trace.flat()).buffer));
  hs5.update(Buffer.from(new Float64Array([Js.release.t - fd.t, Js.release.rN, Js.release.rV, Js.release.theta, Js.theta, Js.thMax]).buffer));
  const hS5 = hs5.digest('hex'), PRE_MEND = '6cc24fec5af04280b50e7d8e4547956711e4b0dba43a5f7f1886a38079b5495a';
  row('MUST', '  ... and hinge.at \'start\' named is the scheme before the mend, to the bit: its trace and release on member C', 'released at +' + f(Js.release.t - fd.t, 4) + ' s by ' + Js.release.by + '; ' + hS5.slice(0, 16), PRE_MEND.slice(0, 16) + ' (42e6911: +15.0000 s by shear)', hS5 === PRE_MEND);
  // hinge.yieldOn (Z1 with B1+B2, 2026-11-24, the coordinator's 3.6 % at the hand-over): 'moment' (the default) yields
  // on M = Mu alone, as before; 'circle' on the onset's own interaction (a what-if for the probes: nothing lands on it)
  const Jm = joinedTo({ yieldOn: 'resultant', trace: true }, undefined), sameM = Jm.trace.length === tr.length && Jm.trace.every((r, i) => r[0] === tr[i][0] && r[1] === tr[i][1]) && Jm.release.t === J.release.t;
  row('MUST', '  ... hinge.yieldOn \'resultant\' named is the default to the bit (D116, join 22): member C\'s trace and release', sameM ? 'the same ' + Jm.trace.length + ' sub-steps, let go at +' + f(Jm.release.t - fd.t, 4) + ' s' : 'NOT the same', 'the same bits', sameM);
  // the fall before join 22 (D116): the four consistencies named at their old values ('moment', 'solid', 'decimated',
  // 'none') are it, to the bit: member C's joint's trace and release, hashed as gate 5's are, frozen from 582d481 (the
  // tree before the defaults moved)
  const Jo = joinedTo({ yieldOn: 'moment', trace: true }, { peakTank: 'solid', section: 'decimated', weather: 'none' }), ho = crypto.createHash('sha256');
  ho.update(Buffer.from(new Float64Array(Jo.trace.flat()).buffer));
  ho.update(Buffer.from(new Float64Array([Jo.release.t - fd.t, Jo.release.rN, Jo.release.rV, Jo.release.theta, Jo.theta, Jo.thMax]).buffer));
  const hO = ho.digest('hex'), PRE_D116 = '27c27d8d93c3827aeaacfe92e6650394e1471686ac6a3d0cae8cd2a4360cc793';
  row('MUST', '  ... and the four named at their values before join 22 (\'moment\', \'solid\', \'decimated\', \'none\') are the fall before, to the bit: member C\'s trace and release', 'let go at +' + f(Jo.release.t - fd.t, 4) + ' s by ' + Jo.release.by + '; ' + hO.slice(0, 16), PRE_D116.slice(0, 16) + ' (582d481: 726 sub-steps, +22.6875 s by shear)', hO === PRE_D116);
  // hinge.yieldOn 'resultant' (B1+B2's e124, 2026-11-24, the list's axis): the hinge yields on the resultant of its own
  // bending moments on the onset's circle, its capacity about her y Mu sqrt(1 - (V/Vs)^2 - (m_z/Mu)^2), m_z the locked
  // yaw's moment. At member C's hand-over, with the tank weighed and the section full: the factor's identity, and the
  // joint's margin to that yield (the relief's model, about 0.2 %, the rest)
  const fR = F.begin(sw, { any: true, cut: fd.x, rule: 'break', t0: fd.t, hinge: { sense: fd.sense, Lh: 20, yieldOn: 'resultant' }, K: { peakTank: 'weighed', section: 'full' } }), JR = fR.eng.joint;
  const uR = F.yieldShare(JR, 0), vR = Math.abs(JR.demand0.V) / JR.H.at(0).Vs, mzR = Math.abs(JR.demand0.Mz) / JR.H.Mu, eR = Math.abs(uR * uR + vR * vR + mzR * mzR - 1);
  row('MUST', '  ... hinge.yieldOn \'resultant\' (B1+B2\'s e124): at the hand-over the hinge\'s share of Mu is sqrt(1 - (V/Vs)^2 - (m_z/Mu)^2), m_z the locked yaw\'s moment', 'share ' + f(uR, 6) + ', V/Vs ' + f(vR, 4) + ', m_z ' + f(Math.abs(JR.demand0.Mz) / 1e9, 4) + ' GN m (' + f(mzR, 4) + ' Mu); the squares\' sum less 1 ' + eR.toExponential(1), 'to 1e-12', eR <= 1e-12);
  row('CHECK', '  ... and with the tank weighed and the section full, member C\'s joint at that yield at the hand-over', 'its margin ' + f(100 * (1 - JR.M0 / (JR.H.Mu * uR)), 3) + ' % of the yield', 'within 0.5 % (the relief\'s model, about 0.2 %, named)', Math.abs(1 - JR.M0 / (JR.H.Mu * uR)) <= 5e-3);
  // K.peakTank (Z1, 2026-11-24, D114): 'solid' (the default) is the fall before; 'weighed' weighs G7's tank's water as the
  // core's loads and the gauge do (a what-if in join 21; the defaults together with hinge.yieldOn 'circle' in the join after)
  const Jt = joinedTo({ trace: true }, { peakTank: 'weighed' }), sameT = Jt.trace.length === tr.length && Jt.trace.every((r, i) => r[0] === tr[i][0] && r[1] === tr[i][1]) && Jt.release.t === J.release.t;
  row('MUST', '  ... K.peakTank \'weighed\' named is the default to the bit (D116, join 22): member C\'s trace and release', sameT ? 'the same ' + Jt.trace.length + ' sub-steps, let go at +' + f(Jt.release.t - fd.t, 4) + ' s' : 'NOT the same', 'the same bits', sameT);
  const tk = sw.pockets.find(k => k.overlap === false), fW = F.begin(sw, { any: true, cut: fd.x, rule: 'break', t0: fd.t, K: { peakTank: 'weighed' } }), fS = F.begin(sw, { any: true, cut: fd.x, rule: 'break', t0: fd.t, K: { peakTank: 'solid' } });
  const dmT = F.massOf(fW.eng.bodies[0]).m - F.massOf(fS.eng.bodies[0]).m, wT = C.RHO * Math.min(tk.vol, tk.cap);
  row('MUST', '  ... K.peakTank \'weighed\': the bow piece heavier by the tank\'s water as the core weighs it', f(dmT / 1000, 3) + ' t', f(wT / 1000, 3) + ' t (C.RHO min(vol, cap)), to 1e-6', Math.abs(dmT - wT) <= 1e-6 * wT);
  // K.section (Z1 with B1+B2, 2026-11-24, D115): 'decimated' (the default) is the fall before; 'full' takes every column
  const Jd = joinedTo({ trace: true }, { section: 'full' }), sameD = Jd.trace.length === tr.length && Jd.trace.every((r, i) => r[0] === tr[i][0] && r[1] === tr[i][1]) && Jd.release.t === J.release.t;
  row('MUST', '  ... K.section \'full\' named is the default to the bit (D116, join 22): member C\'s trace and release', sameD ? 'the same ' + Jd.trace.length + ' sub-steps, let go at +' + f(Jd.release.t - fd.t, 4) + ' s' : 'NOT the same', 'the same bits', sameD);
  // D114 and D115: the three consistencies together (the hinge on the onset's circle, the peak tank weighed, the section
  // at full resolution) make the hand-over the gauge's, so that the fall and the onset cannot drift apart. Like with like,
  // about her own y at the joint's pin (the coordinator's (3); B1+B2's girder.js gives the gauge's: Mvert, her y about
  // Z_NA, from the stern, moved to the pin by the axial part of the net force aft, S = -V/R00; relieved, (R22/R00) of the
  // relief, the inertial loads being vertical; B1+B2's MvertRel when it lands). The statics are the consistency: the
  // stern's loads about the pin, the fall's loads() against the gauge's columns (the rest the fall's in-situ density
  // against the core's 1025). The relieved moment carries the relief's model besides: the fall's Kirchhoff mass slice by
  // slice against the gauge's rigid kA with the water once (named, about 0.25 % on member C). The gauge's reading and the
  // onset's check stay about the world's horizontal axis, cos(list) from her y: that is B1+B2's (the list's axis)
  const f3 = F.begin(sw, { any: true, cut: fd.x, rule: 'break', t0: fd.t, hinge: { sense: fd.sense, Lh: 20, yieldOn: 'circle' }, K: { peakTank: 'weighed', section: 'full' } }), J3 = f3.eng.joint;
  const g3 = GI.moment(sw).at(fd.x), F3 = C.frameOf(sw), zPin = J3.H.at(0).zNA, S3 = -g3.V / F3.R00;
  const gStatic = g3.Mvert - F3.R20 * (GI.Z_NA - zPin) * S3, gRel = gStatic + (F3.R22 / F3.R00) * (g3.Mrel - g3.Mstern), gV = Math.abs(g3.V) * F3.R22 / F3.R00;
  const b3 = f3.eng.bodies[1], R3 = F.quatR(b3.q, new Float64Array(9)), o3 = [0, 0, 0, 0, 0, 0];
  F.loads(b3, f3.sea, [0, 0, 0, 0, 0, 0], b3.X, R3, b3.X, R3, b3.X, R3, b3.Vair || 0, o3, {});
  const fStatic = -(o3[4] - ((zPin - b3.C[2]) * o3[0] - (J3.xb - b3.C[0]) * o3[2]));
  const eS3 = Math.abs(fStatic - gStatic) / Math.abs(gStatic), eM3 = Math.abs(J3.M0 - gRel) / Math.abs(gRel), eV3 = Math.abs(Math.abs(J3.demand0.V) - gV) / gV;
  row('MUST', '  ... with the three consistencies (D114, D115) the hand-over is the gauge\'s about her own y at the pin: the stern\'s static moment, the fall\'s loads against the gauge\'s columns', f(fStatic / 1e9, 4) + ' against ' + f(gStatic / 1e9, 4) + ' GN m (' + f(100 * eS3, 3) + ' %)',
    'within 0.05 % (the rest the fall\'s in-situ density against the core\'s 1025)', eS3 <= 5e-4);
  row('MUST', '  ... and the joint\'s M0 and |V0| against the gauge\'s relieved moment and its shear across her', 'M0 ' + f(J3.M0 / 1e9, 4) + ' against ' + f(gRel / 1e9, 4) + ' GN m (' + f(100 * eM3, 3) + ' %); |V0| ' + f(Math.abs(J3.demand0.V) / 1e6, 3) + ' against ' + f(gV / 1e6, 3) + ' MN (' + f(100 * eV3, 3) + ' %)',
    'within 0.5 % (the relief\'s model: Kirchhoff\'s mass by slice against a rigid kA, named)', eM3 <= 5e-3 && eV3 <= 5e-3);
  const d0 = J.demand0;
  row('CHECK', '  ... at the hand-over the joint\'s own moment and shear against the gauge\'s (B2) at the same step', 'M ' + f(J.M0 / 1e9, 3) + ' GN m (' + f(J.M0 / J.H.Mu, 4) + ' Mu) against ' + f(fd.M / 1e9, 3) + '; |V| ' + f(Math.abs(d0.V) / 1e6, 2) + ' MN against ' + f(Math.abs(fd.V) / 1e6, 2) + '; N ' + f(d0.N / 1e6, 2) + ' MN, lateral ' + f(d0.L / 1e6, 2) + ' MN',
    'within the gauge\'s own error: the moment to 5 %, the shear to 3.3 MN (B1+B2: the gauge\'s shear, unrelieved by her inertia); the lateral beside V tan(list) (B1+B2: 1.22 MN)', Math.abs(J.M0 - fd.M) <= 0.05 * fd.M && Math.abs(Math.abs(d0.V) - Math.abs(fd.V)) <= 3.3e6);

  // (c) the ligament's what-ifs (S.hinge's own options; B1+B2's table in docs/DESIGN_free_body_air_by_space_v1_1, 4)
  const runs = [base, run('Lh 9 ft (a web frame\'s spacing)', { Lh: 9 * 0.3048 }), run('every strength x 0.95', { opts: { scale: 0.95 } }), run('side girders triple-riveted', { opts: { eta: { double: S.JOINT.triple } } })];
  say('TRIAL 13: the joint at the 1912 onset (step ' + fd.k + ', T ' + f(fd.T, 2) + ' after the touch, x ' + f(fd.x, 2) + ' ' + fd.where + ', ' + fd.sense + '; trim ' + f(fd.trimDeg, 2) + ', list ' + f(fd.listDeg, 2) + ' deg), milestone 1 (one pocket a piece, the stand-in vent)');
  say('  ligament                              M0/Mu    yields   let go      theta   by       N/Nt   |V|/Vs   the tear   the bow: from the break, pitch, roll       the stern      stern under');
  for (const r of runs) {
    const Jr = r.J, rl = Jr.release, ts = (t) => (t === undefined || t === null ? '     -' : '+' + f(t - fd.t, 1).padStart(5));
    say('  ' + r.label.padEnd(36) + f(Jr.M0 / Jr.H.Mu, 4).padStart(7) + '  ' + ts(Jr.tYield) + 's  ' + (rl ? ts(rl.t) + 's' : ' held  ') + '  ' + (rl ? f(rl.theta / DEG, 1).padStart(6) : '     -') + '   ' + (rl ? rl.by.padEnd(7) : '-      ') + '  ' + f(rl ? rl.rN : Jr.maxN, 3).padStart(5) + '  ' + f(rl ? rl.rV : Jr.maxV, 3).padStart(6)
      + '  ' + f(Jr.W / 1e6, 0).padStart(5) + ' MJ   ' + (f(r.B.dist, 0) + ' m (' + f(r.B.along, 0) + ', ' + f(r.B.across, 0) + '), ' + f(r.B.a.pitch, 0) + ', ' + f(r.B.a.roll, 0)).padEnd(37) + '  ' + (f(r.S.dist, 0) + ' m').padEnd(12) + '  ' + (r.uS && rl ? '+' + f(r.uS.t - rl.t, 0) + ' s after' : '-'));
  }
  say('  the record (R5): the bow 772 m dead ahead, the stern 148 m; the stern afloat 1.5 to 3 min after the break. Reported, never chosen by: each row is a ligament the sources allow');
  say();
  row('CHECK', 'trial 13c: the 1912 onset, joined, as built: where the bow lands', f(base.B.dist, 0) + ' m from the point under the break (along ' + f(base.B.along, 0) + ', across ' + f(base.B.across, 0) + '); the stern ' + f(base.S.dist, 0) + ' m',
    'reported against the bow 772 m (R5 10a; v1 test 5\'s band 540 to 950 m); milestone 1 keeps the stand-in vent, so this is the joint\'s shape, not yet its air', base.B.dist >= 540 && base.B.dist <= 950);
  row('CHECK', '  ... the stern afloat after the release', base.uS && J.released ? f((base.uS.t - J.release.t) / 60, 2) + ' min' : 'n/a', 'the record 1.5 to 3 min (R5 5.2, 10c); the stand-in vent\'s until milestone 2 (Z6\'s spaces)', !!(base.uS && J.released) && (base.uS.t - J.release.t) >= 90 && (base.uS.t - J.release.t) <= 180);
}

// ================================================================ trial 14: the hand-over five ways (G12)
// QC B's B-1 (2026-11-20): the one lumped pocket's place across her decided which way a piece landed. Each hand-over at
// the flag (H1), the 1912 preset's and the 1912 watch's, is let go five ways: as she is; her heave rate at the flag x0.85
// and x1.18; her roll 3 deg either way. Two JS engines' runs of the same watch part at the flag by less (Edge against
// Node: 100,534 t aboard against 100,599, trim 68.8 against 68.9; Z1, Q1, 2026-11-20), and the flipped runs land where
// the page did. Each way with the pocket's lift through each slice's floodable centre (K.airAt 'centre') and where the
// air lay at the flag ('flag', the engine to G12). A piece's way up on the bed is a word: upright (roll within 45 deg),
// upside down (beyond 135), on her side; the LIES lines print it alone, so that a flip is named in the table's diff.
// The watch handed over at B2's onset (the what-if 'onset', no joint: under 10 deg by the head; there 'flag' is the
// default since D98, K0.airAtBreak: the air where it lay, high in her near upright) is let go the
// same five ways. One point fixed in her is right at one attitude only: 'flag' is her air where it lay at the hand-over,
// 'centre' the round section's at any attitude; Z6's spaces carry the air as she turns. The five ways are CHECK rows:
// handed over at the flag a piece's way up turns on her list there, which the core holds near its clamp (80 deg), at a
// threshold (on join 6's watch the bow turns over beyond about 83 deg of list with 'centre', 75 with 'flag'; Z1,
// 2026-11-20), and the 3 deg probe can cross it. A change of way up is named twice: its CHECK row, and its LIES line.
{
  const word = (q) => { const r = Math.abs(attitude(q).roll); return r <= 45 ? 'upright' : (r >= 135 ? 'upside down' : 'on her side'); };
  const CASES = [['as she is', null], ['heave rate x0.85', (s) => { s.vz *= 0.85; }], ['heave rate x1.18', (s) => { s.vz *= 1.18; }],
    ['roll 3 deg to port', (s) => { s.roll -= 3 * DEG; }], ['roll 3 deg to starboard', (s) => { s.roll += 3 * DEG; }]];
  const PLACES = [F.K0.airAt, F.K0.airAt === 'centre' ? 'flag' : 'centre'];
  const fp = (fall) => { const h = crypto.createHash('sha256'); for (const p of fall.pieces) h.update(Buffer.from(new Float64Array(p.r.concat(p.q, [p.depth])).buffer)); h.update(JSON.stringify(fall.events)); return h.digest('hex'); };
  // one hand-over five ways and two places: begin as the reader begins (its opts), the sim set back after each
  const fiveWays = (sim, opts) => {
    const res = {};
    for (const at of PLACES) {
      res[at] = CASES.map(([label, change]) => {
        const keep = { vz: sim.vz, roll: sim.roll };
        if (change) change(sim);
        const fall = F.begin(sim, Object.assign({}, opts, { K: { airAt: at } }));
        sim.vz = keep.vz; sim.roll = keep.roll;
        while (!fall.done && fall.k < 4 * 60 * 30) F.advance(fall);
        const land = (id) => { const i = fall.pieces.findIndex(p => p.id === id), p = fall.pieces[i], w = F.worldOf(fall, i, [0.5 * (p.x0 + p.x1), 0, GI.Z_NA]), dX = w[0] - fall.breakAt[0], dY = w[1] - fall.breakAt[1];
          const s = fall.events.find(e => e.id === 'strike' && e.piece === id); return { word: word(p.q), roll: attitude(p.q).roll, dist: Math.sqrt(dX * dX + dY * dY), bed: s ? (s.t - fall.t0) / 60 : NaN, speed: s ? s.speed : NaN }; };
        return { label, done: fall.done, bow: land('bow'), stern: land('stern'), hash: fp(fall) };
      });
    }
    return res;
  };
  // the preset at its flag, as trial 12 begins it; the watch at its flag (the what-if since D98, handover 'flag'), as its
  // reader begins it (t0 the flag's)
  const preset = fiveWays(simF, {});
  const sw = N.create(C.buildShip(), N.spec(1912), { auto: true, handover: 'flag' });
  while (!N.over(sw)) N.step(sw);
  const kFlag = sw.night.k;
  const watch = fiveWays(sw, { t0: sw.founderT });
  // the watch's own fall (its reader, stepped by the night) is the trial's 'as she is' with the default place, to the bit:
  // the trial's falls taken away first, so that the reader begins its own on the first step past the flag
  delete sw.fall;
  while (!(sw.fall && sw.fall.done) && sw.night.k < kFlag + 4 * 60 * 30) N.step(sw);
  const own = fp(sw.fall), mine = watch[PLACES[0]][0].hash;
  row('MUST', 'trial 14: the 1912 watch\'s own fall at its flag (the what-if, handover \'flag\': its reader, stepped by the night to the bed) is the trial\'s hand-over as she is', own.slice(0, 16) + (own === mine ? ' both' : ' against ' + mine.slice(0, 16)), 'the same bits: the trial lets go what the watch lets go', own === mine);
  // the watch handed over at B2's onset, cut there, as its reader begins it (no joint): the default since D98 (G19's
  // switch), named here so that the trial reads the same either side of it
  const so = N.create(C.buildShip(), N.spec(1912), { auto: true, handover: 'onset' });
  while (!N.over(so)) N.step(so);
  const fo = so.onset.found, onset = fiveWays(so, { any: true, cut: fo.x, rule: 'break', t0: fo.t });
  // each hand-over's default placement of the air: at the flag K0.airAt ('centre'), at the onset K0.airAtBreak ('flag',
  // D98: the air where it lay, high in her near upright; e117); the other is the what-if
  const DEF = (R) => (R === onset ? F.K0.airAtBreak : F.K0.airAt), ALT = (R) => (DEF(R) === 'centre' ? 'flag' : 'centre');
  // the watch's own fall at its onset (its reader, stepped by the night to the bed) is the trial's onset hand-over as she
  // is, with the onset's own air, to the bit: the trial's falls taken away first
  const kOn = so.night.k;
  delete so.fall;
  while (!(so.fall && so.fall.done) && so.night.k < kOn + 4 * 60 * 30) N.step(so);
  const ownO = fp(so.fall), mineO = onset[DEF(onset)][0].hash;
  row('MUST', 'trial 14: the 1912 watch\'s own fall at its onset (the default since D98) is the trial\'s onset hand-over as she is, with the onset\'s own air', ownO.slice(0, 16) + (ownO === mineO ? ' both' : ' against ' + mineO.slice(0, 16)), 'the same bits: the trial lets go what the watch lets go (K0.airAtBreak \'' + F.K0.airAtBreak + '\')', ownO === mineO);
  say('TRIAL 14: the hand-over five ways (G12): the way each piece lies on the bed, its distance from the point under the break, when it struck and how fast');
  for (const [name, R] of [['the 1912 preset at its flag (T ' + f(simF.founderT / 60, 2) + ')', preset], ['the 1912 watch at its flag, the what-if (handover \'flag\'; step ' + kFlag + ', fingerprint ' + N.fingerprint(sw) + ')', watch],
    ['the 1912 watch at B2\'s onset, the default since D98 (step ' + fo.k + ', x ' + f(fo.x, 2) + ', trim ' + f(fo.trimDeg, 2) + ', list ' + f(fo.listDeg, 2) + ')', onset]]) {
    for (const at of PLACES) {
      say('  ' + name + ', the pocket\'s lift ' + (at === 'centre' ? 'through each slice\'s floodable centre (\'centre\')' : 'where the air lay at the hand-over (\'flag\')') + (at === DEF(R) ? ', the default' : ', the what-if'));
      for (const c of R[at]) say('    ' + c.label.padEnd(24) + ' the bow ' + c.bow.word.padEnd(12) + f(c.bow.dist, 0).padStart(5) + ' m, ' + f(c.bow.bed, 2) + ' min, ' + f(c.bow.speed, 2) + ' m/s;   the stern ' + c.stern.word.padEnd(12) + f(c.stern.dist, 0).padStart(5) + ' m, ' + f(c.stern.bed, 2) + ' min, ' + f(c.stern.speed, 2) + ' m/s' + (c.done ? '' : ' (NOT AT REST)'));
    }
  }
  say('  the wreck: both upright (R5 1.1); the bow 772 m from the point under the break, the stern 148 m (R5 10a)');
  for (const [name, R] of [['the 1912 preset at its flag', preset], ['the 1912 watch at its flag (the what-if)', watch], ['the 1912 watch at B2\'s onset (the default)', onset]]) for (const id of ['bow', 'stern']) say('LIES  ' + name + ', as she is: the ' + id + ' ' + R[DEF(R)][0][id].word);
  say();
  const words = (cs, id) => cs.map(c => c[id].word === 'upside down' ? 'DOWN' : (c[id].word === 'upright' ? 'up' : 'SIDE')).join(' ');
  for (const [name, R] of [['the 1912 preset handed over at its flag', preset], ['the 1912 watch handed over at its flag (the what-if)', watch], ['the 1912 watch handed over at B2\'s onset (the default, D98)', onset]]) {
    // G12's done-when (D98): from the default hand-over, the onset, both pieces lie upright in all five ways (MUST);
    // the flags' rows stay CHECK rows, the knife edge of the beam ends in sight
    const cs = R[DEF(R)], same = (id) => cs.every(c => c[id].word === cs[0][id].word), kind = R === onset ? 'MUST' : 'CHECK';
    row(kind, 'trial 14: ' + name + ' five ways (as she is; heave rate x0.85, x1.18; roll 3 deg to port, to starboard): each piece lies the same way in all five', 'the bow ' + words(cs, 'bow') + '; the stern ' + words(cs, 'stern') + (cs.every(c => c.done) ? '' : ' (NOT ALL AT REST)') + '; with \'' + ALT(R) + '\': the bow ' + words(R[ALT(R)], 'bow') + ', the stern ' + words(R[ALT(R)], 'stern'),
      'one way each (QC B, B-1: a way up that turns on less than two engines part by is not a result). At the flag it turns on her list there, at a threshold the 3 deg probe can cross: the hand-over on her beam ends is H1\'s, until Z9\'s roll or the onset with Z6 and B4', same('bow') && same('stern') && cs.every(c => c.done));
    row(kind, '  ... and both upright, as the wreck lies', 'the bow ' + cs[0].bow.word + ', the stern ' + cs[0].stern.word + ' (as she is; rolls ' + f(cs[0].bow.roll, 1) + ' and ' + f(cs[0].stern.roll, 1) + ' deg)', 'the wreck: both upright (R5 1.1)', cs.every(c => c.bow.word === 'upright' && c.stern.word === 'upright'));
  }

  // ================================================================ trial 15: Z6's spaces (M2, step 4a)
  // core/readers/spaces.js: the core's 64 spaces as its own column segments (boxes), cut at the break; each space's
  // level holding its water by e83's box rule, exact at any attitude (docs/DESIGN_free_body_air_by_space_v1_3, 1).
  // At the watch's onset (nearly upright) and at its flag (69 deg by the head, 80 to port), each space's water the core's
  const SP = require('../core/readers/spaces.js');
  const all = SP.spacesOf(ship, -1e9, 1e9), bowS = SP.spacesOf(ship, XB, 1e9), sternS = SP.spacesOf(ship, -1e9, XB);
  let dRoom = 0, room = 0; for (let k = 0; k < all.n; k++) { dRoom = Math.max(dRoom, Math.abs(all.V[k] - ship.nodeVmax[all.node[k]]) / ship.nodeVmax[all.node[k]]); room += all.V[k]; }
  row('MUST', 'trial 15: the spaces, the core\'s own column segments as boxes: each space\'s room against the core\'s (nodeVmax)', all.n + ' spaces, ' + f(room, 1) + ' m3; each to ' + dRoom.toExponential(1), 'to 1e-12 (the same boxes, mu counted)', all.n === ship.nodeMu.length && dRoom < 1e-12);
  const vOf = (sp) => { const m = new Map(); for (let k = 0; k < sp.n; k++) m.set(sp.node[k], sp.V[k]); return m; }, vb = vOf(bowS), vs = vOf(sternS);
  let dCut = 0; for (let k = 0; k < all.n; k++) { const n = all.node[k]; dCut = Math.max(dCut, Math.abs((vb.get(n) || 0) + (vs.get(n) || 0) - all.V[k]) / all.V[k]); }
  row('MUST', '  ... cut at the break (x ' + XB + '): the bow\'s spaces and the stern\'s sum to the whole, space by space', bowS.n + ' and ' + sternS.n + ' spaces; to ' + dCut.toExponential(1), 'to 1e-12 (a box the cut crosses is split by length)', dCut < 1e-12);
  const at = (sim) => {
    const Fr = C.frameOf(sim), u = [Fr.R20, Fr.R21, Fr.R22], zr = Fr.tz, out = {}, B = {};
    const r = { n: 0, dv: 0, it: 0, airLow: 0, dl: 0, dlW: 0, ident: 0, nId: 0 };
    for (let k = 0; k < all.n; k++) {
      const n = all.node[k], Wk = Math.min(sim.vol[n], ship.nodeVmax[n]);
      if (!(Wk > 1e-6) || !(Wk < all.V[k] * (1 - 1e-9))) continue;
      r.n++;
      SP.water(all, k, u, zr, Wk, sim.level[n], out);
      r.it = Math.max(r.it, out.iter); r.dv = Math.max(r.dv, Math.abs(out.V - Wk) / all.V[k]);
      if (!(zr + u[0] * out.ax + u[1] * out.ay + u[2] * out.az > out.level)) r.airLow++;
      if (Math.abs(out.level - sim.level[n]) > r.dl) { r.dl = Math.abs(out.level - sim.level[n]); r.dlW = Wk; }
      // where the core's level cuts the boxes through their sides only, the box rule is the core's centre-line rule
      const h = sim.level[n], m = all.mu[k];
      let vcl = 0, faces = 0;
      for (let q = all.start[k], q1 = q + all.count[k]; q < q1; q++) {
        const zc = (h - zr - u[0] * all.bx[q] - u[1] * all.by[q]) / u[2], lo = all.bz[q] - all.wz[q], hi = all.bz[q] + all.wz[q];
        const span = (Math.abs(u[0]) * all.wx[q] + Math.abs(u[1]) * all.wy[q]) / Math.abs(u[2]);
        if (zc + span > lo && zc - span < hi && (zc - span < lo || zc + span > hi)) faces++;
        vcl += m * 4 * all.wx[q] * all.wy[q] * Math.max(0, Math.min(hi, zc) - lo);
      }
      if (faces === 0) { r.nId++; r.ident = Math.max(r.ident, Math.abs(SP.below(all, k, u, zr, h, B).V - vcl) / all.V[k]); }
    }
    return r;
  };
  const ro = at(so), rf = at(sw);
  row('MUST', '  ... the box rule is the core\'s centre-line rule where a level cuts the boxes through their sides only (the onset\'s spaces so cut)', ro.nId + ' spaces; to ' + ro.ident.toExponential(1) + ' of the room', 'to 1e-12 (a prism cut through its sides holds its area times the height at its centre: e69, e83)', ro.nId > 0 && ro.ident < 1e-12);
  row('MUST', '  ... each space part full holds its water at the level Newton finds, and its air lies above that level (the onset; the flag)', ro.n + ' and ' + rf.n + ' spaces; to ' + Math.max(ro.dv, rf.dv).toExponential(1) + ' of the room in at most ' + Math.max(ro.it, rf.it) + ' iterations; air below its level in ' + (ro.airLow + rf.airLow), 'to 1e-11, within 20 iterations; none (v1.3, 1: exact at any attitude)', Math.max(ro.dv, rf.dv) < 1e-11 && Math.max(ro.it, rf.it) <= 20 && ro.airLow + rf.airLow === 0);
  // the hand-over's state (stateOf): each piece's water by space, a space the cut crosses split by its boxes below the
  // core's level; the bow's and the stern's sum to the core's water (its over-fill dropped), space by space
  const hand = (sim) => {
    const Fr = C.frameOf(sim), sb = SP.stateOf(bowS, all, sim, Fr), ss = SP.stateOf(sternS, all, sim, Fr), sum = new Map();
    for (const [sp, st] of [[bowS, sb], [sternS, ss]]) for (let k = 0; k < sp.n; k++) sum.set(sp.node[k], (sum.get(sp.node[k]) || 0) + st.W[k]);
    let d = 0, tot = 0; for (let q = 0; q < all.n; q++) { const n = all.node[q], want = Math.min(sim.vol[n], all.V[q]); tot += want; d = Math.max(d, Math.abs((sum.get(n) || 0) - want)); }
    return { d, tot, airB: sb.a.reduce((x, y) => x + y, 0), airS: ss.a.reduce((x, y) => x + y, 0) };
  };
  const hf = hand(sw), ho = hand(so);
  row('MUST', '  ... at the hand-over (stateOf): the bow\'s and the stern\'s water sum to the core\'s, space by space (its over-fill dropped; a space the cut crosses split by its boxes below the core\'s level)', 'at the flag to ' + hf.d.toExponential(1) + ' m3 of ' + f(hf.tot, 0) + ' (air at 1 atm: the bow ' + f(hf.airB, 0) + ', the stern ' + f(hf.airS, 0) + ' m3); at the onset to ' + ho.d.toExponential(1) + ' m3 (air ' + f(ho.airB, 0) + ' and ' + f(ho.airS, 0) + ')', 'to 1e-6 m3 a space', hf.d < 1e-6 && ho.d < 1e-6);
  // the openings (openingsOf): every connection of the core lands in one piece, between its spaces or a space and the
  // sea; every open one has a clear area; the cut's openings are K.clear of the section the cut crosses
  {
    const ob = SP.openingsOf(bowS, sw, XB, 1e9, {}), os = SP.openingsOf(sternS, sw, -1e9, XB, {}), conns = new Set();
    let bad = 0, cutA = 0, sect = 0;
    for (const o of ob.concat(os)) { if (o.c >= 0) conns.add(o.c); else cutA += o.A; if (o.open && !(o.A > 0 && o.L > 0)) bad++; }
    for (let k = 0; k < bowS.n; k++) for (let q = bowS.start[k], q1 = q + bowS.count[k]; q < q1; q++) if (Math.abs(bowS.bx[q] - bowS.wx[q] - XB) < 1e-6) sect += 4 * bowS.wy[q] * bowS.wz[q];
    const nOpen = ob.concat(os).filter(o => o.open).length;
    row('MUST', '  ... the openings (openingsOf): every connection of the core lands in one piece, between its spaces or a space and the sea; each open one has a clear area; the cut\'s are K.clear of the section it crosses', conns.size + ' of ' + sw.conn.n + ' connections (' + nOpen + ' open, ' + bad + ' without an area); the cut ' + f(cutA, 1) + ' m2 of ' + f(sect, 1) + ' x 2 pieces', 'all; none; 0.6 x 2 x the section (v1.3\'s clear share [bet])', conns.size === sw.conn.n && bad === 0 && Math.abs(cutA - 2 * 0.6 * sect) < 1e-9);
  }
  row('CHECK', '  ... the box rule\'s levels beside the core\'s own (its centre-line rule, its levels one step behind her pose)', 'at most ' + f(ro.dl, 3) + ' m at the onset (a space holding ' + f(ro.dlW, 1) + ' m3: a film on its floor); ' + f(rf.dl, 2) + ' m at the flag', 'reported: at the flag the centre-line rule cuts most boxes through a top or a bottom; at the onset the levels lag the pose by about 2 cm', true);
}

// ================================================================ trial 16: the exchange through an opening (M2, 4b-ii)
// e84's laws P and X (docs/research/RESEARCH_torn_end_exchange_law_v1_2026-11-20.md), ported into core/readers/spaces.js
// (`flow`) so that they call no engine transcendental; their own closed forms (e84_z6_exchange.js's checks)
{
  const X = require('../core/readers/spaces.js').flow, g = X.G, RW = X.RHO_W, PA = X.P_ATM;
  const rel = (got, want) => Math.abs(got - want) / Math.abs(want);
  const fa = X.exchange({ A: 10, L: 2, zc: -20, nz: 0, Cd: 0.6 }, { zw: -12, pa: PA + RW * g * 10 }, { zw: 0, pa: PA }), wa = 0.6 * 10 * Math.sqrt(2 * g * 2);
  row('MUST', 'trial 16: the exchange (e84\'s laws, ported into core/readers/spaces.js): a submerged orifice under 2 m of head', f(fa.wIn, 4) + ' m3/s', 'Cd A sqrt(2 g H) = ' + f(wa, 4) + ', to 1e-9', rel(fa.wIn, wa) <= 1e-9);
  // the two-layer exchange through a vertical opening at the surface, its neutral plane found by the volumes' balance
  const H = 10, bw = 20, opc = { A: H * bw, L: H, zc: -5, nz: 0, Cd: 0.6 };
  let lo = PA, hi = PA + RW * g * 10;
  for (let i = 0; i < 60; i++) { const p = 0.5 * (lo + hi), fq = X.exchange(opc, { zw: -30, pa: p }, { zw: 0, pa: PA }); if (fq.wIn - fq.aOut > 0) lo = p; else hi = p; }
  const pc = 0.5 * (lo + hi), fc = X.exchange(opc, { zw: -30, pa: pc }, { zw: 0, pa: PA });
  const rr = Math.pow(X.rhoAir(pc) / RW, 1 / 3), frac = rr / (1 + rr), share = (pc - PA) / (RW * g) / H, wc = 0.6 * (2 / 3) * bw * Math.sqrt(2 * g) * Math.pow(H * (1 - frac), 1.5);
  row('MUST', '  ... the two-layer exchange through a vertical opening at the surface: the air\'s share of its height, and the water\'s flow', f(share, 6) + ' of the height; ' + f(fc.wIn, 2) + ' m3/s', 'r / (1 + r), r = (rho_a / rho_w)^(1/3): ' + f(frac, 6) + '; a weir over the rest: ' + f(wc, 2) + ' m3/s (e84: 0.574 Cd A sqrt(2 g H)); to 2e-3', rel(share, frac) <= 2e-3 && rel(fc.wIn, wc) <= 2e-3);
  // law X: a pair on Wallis's flooding line (a bottle's neck, 20 mm, no Kutateladze cap)
  const opd = { A: Math.PI * 0.02 * 0.02 / 4, L: 0.02, Dh: 0.02, zc: -0.1, nz: 1, kuCap: false };
  const ic = X.intercepts(opd, X.rhoAir(PA)), pr = X.floodingPair(0.3 * ic.jf0, ic.jg0, ic.jf0), res = Math.sqrt(pr.jg / ic.jg0) + Math.sqrt(pr.jf / ic.jf0);
  row('MUST', '  ... the counter-current law X: a pair on Wallis\'s flooding line', 'sqrt(jg/jg0) + sqrt(jf/jf0) = ' + f(res, 12), '1, to 1e-9', Math.abs(res - 1) <= 1e-9);
  // the one-way limiter: a sub-step levels the two sides at most (x = k q dt / dp from 0.5 to 50)
  const sa = { zw: 0, pa: PA, S: 10 }, sb = { zw: 0, pa: PA }, k = RW * g / 10, dt = 1 / 32, dp = 1000;
  const moved = [0.5, 1.9, 2, 2.1, 50].map((x) => { const q = x * dp / (k * dt), sc = X.limitOneWay({ wIn: q, wOut: 0, aIn: 0, aOut: 0, dpLo: dp, dpHi: dp }, sa, sb, dt); return sc * q * dt / (dp / k); });
  row('MUST', '  ... the one-way limiter (limitOneWay): no sub-step moves more than levels the two sides', 'at most ' + f(Math.max(...moved), 12) + ' of the levelling volume (x 0.5, 1.9, 2, 2.1, 50: ' + moved.map(v => f(v, 3)).join(', ') + ')', '1 at most, reached at x = 2 (e84: V = q dt (1 - x/4) for x < 2, dp / k beyond)', Math.max(...moved) <= 1 + 1e-12 && Math.abs(moved[2] - 1) <= 1e-12);
}

// a piece's spaces out of bounds: water outside 0 to its room, air below 0, air held in no room above the water (its
// volume gone while its amount stays: the stranding Z1 found under 4c), or anything not a number
const outOfBounds = (sp, st) => { let n = 0; for (let k = 0; k < sp.n; k++) { const W = st.W[k], a = st.a[k]; if (!(W >= -1e-9 && W <= sp.V[k] * (1 + 1e-12)) || !(a >= -1e-9) || (sp.V[k] - W <= 1e-9 * sp.V[k] && a > 1e-6)) n++; } return n; };

// ================================================================ trial 17: a piece's spaces stepped (M2, 4b-ii)
// core/readers/spaces.js stepPiece: the 1912 watch's bow at its flag, held at the flag's attitude and sunk at 5 m/s for
// 10 s in sub-steps of 1/32 s (v1: the cut can empty a space in under a second). Its spaces' water and air through all
// its open openings, the cut's at 0.6 of the section [bet]. The spaces' failures (4d) are not in yet, so a space whose
// way to the sea is small holds its air at a pressure that lags the sea's (v1.3, section 3: the lag reaches tens of
// metres, and spaces give way): the air's volume printed is without them
{
  const sw17 = N.create(C.buildShip(), N.spec(1912), { auto: true, handover: 'flag' });   // the flag is meant (D98's what-if)
  while (!sw17.foundered) N.step(sw17);
  const Fr = C.frameOf(sw17), SPc = require('../core/readers/spaces.js'), allS = SPc.spacesOf(sw17.ship, -1e9, 1e9), bowS = SPc.spacesOf(sw17.ship, XB, 1e9);
  const go = (how) => {
    const st = SPc.stateOf(bowS, allS, sw17, Fr), ops = SPc.openingsOf(bowS, sw17, XB, 1e9, { clear: 0.6 });
    const R = [Fr.R00, Fr.R01, Fr.R02, Fr.R10, Fr.R11, Fr.R12, Fr.R20, Fr.R21, Fr.R22], r = [Fr.tx, Fr.ty, Fr.tz];
    let bad = 0; const air = [];
    const vol = () => { let v = 0; for (let k = 0; k < bowS.n; k++) v += bowS.V[k] - st.W[k]; return v; };
    air.push(vol());
    for (let i = 1; i <= 320; i++) {
      r[2] -= 5 / 32; SPc.stepPiece(bowS, st, ops, R, r, 1 / 32, how);
      bad += outOfBounds(bowS, st);
      if (i % 64 === 0) air.push(vol());
    }
    const h = crypto.createHash('sha256'); h.update(Buffer.from(st.W.buffer)); h.update(Buffer.from(st.a.buffer));
    return { bad, air, hash: h.digest('hex'), aAt1: st.a.reduce((x, y) => x + y, 0), W: Float64Array.from(st.W), a: Float64Array.from(st.a) };
  };
  const g1 = go(), g2 = go();
  row('MUST', 'trial 17: a piece\'s spaces stepped (stepPiece): the 1912 watch\'s bow at its flag, held at its attitude and sunk 5 m/s for 10 s at 1/32 s: every space\'s water within its room, its air not below 0 and never held in no room, nothing NaN; run twice, the same bits', g1.bad + ' out of bounds; ' + g1.hash.slice(0, 16) + (g1.hash === g2.hash ? ' twice' : ' then ' + g2.hash.slice(0, 16)), 'none; the same bits', g1.bad === 0 && g1.hash === g2.hash);
  // its pressure solve (Illinois false position from each space's last pressure, halving where it stalls) against e84's
  // 48 geometric halvings: one step from each of the run's 320 states taken both ways, and the two runs side by side
  {
    const A = { st: SPc.stateOf(bowS, allS, sw17, Fr), ops: SPc.openingsOf(bowS, sw17, XB, 1e9, { clear: 0.6 }) }, B = { st: SPc.stateOf(bowS, allS, sw17, Fr), ops: SPc.openingsOf(bowS, sw17, XB, 1e9, { clear: 0.6 }) };
    const R = [Fr.R00, Fr.R01, Fr.R02, Fr.R10, Fr.R11, Fr.R12, Fr.R20, Fr.R21, Fr.R22], r = [Fr.tx, Fr.ty, Fr.tz];
    const cp = (st) => ({ W: Float64Array.from(st.W), a: Float64Array.from(st.a), lev: Float64Array.from(st.lev), failed: st.failed ? Uint8Array.from(st.failed) : undefined, bubbled: st.bubbled || 0, pLast: st.pLast ? Float64Array.from(st.pLast) : undefined });
    const apart = (s1, s2) => { let m = 0; for (let k = 0; k < bowS.n; k++) m = Math.max(m, Math.abs(s1.W[k] - s2.W[k]) / bowS.V[k], Math.abs(s1.a[k] - s2.a[k]) / bowS.V[k]); return m; };
    let one = 0, bad = 0;
    for (let i = 1; i <= 320; i++) {
      r[2] -= 5 / 32;
      const c = cp(A.st);
      SPc.stepPiece(bowS, c, A.ops.map(o => Object.assign({}, o)), R, r, 1 / 32, 'bisect');
      SPc.stepPiece(bowS, A.st, A.ops, R, r, 1 / 32);
      one = Math.max(one, apart(c, A.st));
      SPc.stepPiece(bowS, B.st, B.ops, R, r, 1 / 32, 'bisect');
      bad += outOfBounds(bowS, B.st);
    }
    const end = apart(A.st, B.st);
    row('MUST', '  ... its pressure solve (Illinois false position from each space\'s last pressure, halving where it stalls) against e84\'s 48 geometric halvings: one step from each of the run\'s 320 states taken both ways, and the two runs over the 10 s', 'one step: at most ' + one.toExponential(1) + ' of a room apart; the runs ' + end.toExponential(1) + ' apart at the end; by halvings ' + bad + ' out of bounds',
      'within 1e-3 of a room a step and 1e-2 over the run (Z1: mostly 1e-8 to 1e-11 a step; the runs part once, by about 1e-3, where a space reaches a threshold a step apart, and stay so)', one <= 1e-3 && end <= 1e-2 && bad === 0);
  }
  row('CHECK', '  ... her air\'s volume every 2 s without the spaces\' failures: where the way out is small the air lags the sea', g1.air.map(v => f(v, 0)).join(', ') + ' m3; ' + f(g1.aAt1, 0) + ' m3 of it at one atmosphere left', 'reported: the cut vents what lies at it within seconds (v1.3: half in 8 to 10 s through 300 m2 where the air reaches it)', true);
  // with the spaces' failures (failSpaces, 4d in its simplest form: a space lagging the sea by more than 10 m of head
  // [bet] gives way to the sea), applied at the hand-over and after every step
  const goF = () => {
    const st = SPc.stateOf(bowS, allS, sw17, Fr), ops = SPc.openingsOf(bowS, sw17, XB, 1e9, { clear: 0.6 }), ev = [];
    const R = [Fr.R00, Fr.R01, Fr.R02, Fr.R10, Fr.R11, Fr.R12, Fr.R20, Fr.R21, Fr.R22], r = [Fr.tx, Fr.ty, Fr.tz];
    const n0 = SPc.failSpaces(bowS, st, ops, R, r, {}, 0, ev);
    let bad = 0; const air = [];
    const vol = () => { let v = 0; for (let k = 0; k < bowS.n; k++) v += bowS.V[k] - st.W[k]; return v; };
    air.push(vol());
    for (let i = 1; i <= 320; i++) {
      r[2] -= 5 / 32; SPc.stepPiece(bowS, st, ops, R, r, 1 / 32); SPc.failSpaces(bowS, st, ops, R, r, {}, i / 32, ev);
      bad += outOfBounds(bowS, st);
      if (i % 64 === 0) air.push(vol());
    }
    const h = crypto.createHash('sha256'); h.update(Buffer.from(st.W.buffer)); h.update(Buffer.from(st.a.buffer)); h.update(JSON.stringify(ev));
    return { n0, ev, bad, air, hash: h.digest('hex') };
  };
  const f1 = goF(), f2 = goF();
  row('MUST', '  ... with the spaces\' failures (failSpaces: a space lagging the sea past 10 m of head [bet] gives way to the sea), at the hand-over and after each step: within bounds; run twice, the same bits', f1.n0 + ' give way at the hand-over, ' + (f1.ev.length - f1.n0) + ' after; ' + f1.bad + ' out of bounds; ' + f1.hash.slice(0, 16) + (f1.hash === f2.hash ? ' twice' : ' then ' + f2.hash.slice(0, 16)), 'none out; the same bits', f1.bad === 0 && f1.hash === f2.hash);
  row('CHECK', '  ... the reports at the hand-over, and her air\'s volume every 2 s with the failures', f1.ev.slice(0, 8).map(e => 'node ' + e.node + ' ' + f(e.depth, 0) + ' m ' + f(e.energy / 1e9, 2) + ' GJ').join('; ') + '; air ' + f1.air.map(v => f(v, 0)).join(', ') + ' m3', 'reported: the core leaves air at one atmosphere in spaces tens of metres down at the flag; past their boundaries\' heads they give way at once (v1, 5: 500 m3 at 60 m is 0.3 GJ)', true);
}

// ================================================================ trial 18: the spaces in the fall (M2, 4c)
// The what-if K.air 'spaces' (the default, 'pocket', is the engine as before, to the bit: every row above runs it): each
// piece's share of the core's spaces at the hand-over (stateOf) and its openings (openingsOf), the spaces whose air lags
// the sea past their heads giving way at once (failSpaces); then each sub-step the spaces are stepped at her pose and
// their air is the pocket, its whole volume through its volume-weighted centroid. The 1912 preset at its flag, 90 s of
// the fall, with the pocket's fall beside it; run twice to 30 s for the bits
{
  const SECS = 90, HALF = 30, MARKS = [0, 1, 2, 5, 10, 20, 30, 60, 90];
  const hashOf = (fall) => { const h = crypto.createHash('sha256'); for (const p of fall.pieces) h.update(Buffer.from(new Float64Array(p.r.concat(p.q, [p.depth, p.air])).buffer)); h.update(JSON.stringify(fall.events)); for (const b of fall.eng.bodies) if (b.spc) { h.update(Buffer.from(b.spc.st.W.buffer)); h.update(Buffer.from(b.spc.st.a.buffer)); } return h.digest('hex'); };
  const run = (mode, secs) => {
    const fall = F.begin(simF, { K: mode === 'spaces' ? { air: 'spaces', fail: 'simple' } : { air: mode } });   // the first form, by name since 'boundaries' became the default
    const r = { fall, bad: 0, clock: 0, h30: null, trace: fall.pieces.map(() => []), at0: fall.eng.bodies.map((b, i) => ({ air: fall.pieces[i].air, V: b.spc ? b.spc.V : NaN, pocket: b.air ? b.air.V0 : 0, room: b.spc ? b.spc.sp.V.reduce((x, y) => x + y, 0) : NaN, cap: b.airMax })) };
    let m = 0;
    const mark = () => { const tt = fall.t - fall.t0; while (m < MARKS.length && tt >= MARKS[m] - 1e-9) { fall.pieces.forEach((p, i) => r.trace[i].push(f(p.air, 0))); m++; } };
    mark();
    while (fall.t - fall.t0 < secs - 1e-9 && !fall.done) {
      F.advance(fall);
      for (const b of fall.eng.bodies) if (b.spc) {
        const S = b.spc;
        r.bad += outOfBounds(S.sp, S.st);
        if (b.state !== 'at rest') r.clock = Math.max(r.clock, Math.abs(S.t - fall.t));
      }
      if (r.h30 === null && fall.t - fall.t0 >= HALF - 1e-9) r.h30 = hashOf(fall);
      mark();
    }
    return r;
  };
  const sp = run('spaces', SECS), sp2 = run('spaces', HALF), pk = run('pocket', SECS);
  const ids = sp.fall.pieces.map(p => p.id);
  // at the hand-over: the spaces' room above her water against the pocket's (the core's water read slice by slice), and
  // the spaces' room against the body's floodable volume (her air's cap in airVolume)
  const dAir = Math.max(...sp.at0.map((a, i) => Math.abs(a.V - pk.at0[i].pocket) / pk.at0[i].pocket));
  const dRoom = Math.max(...sp.at0.map(a => Math.abs(a.room - a.cap) / a.cap)), dSet = Math.max(...sp.at0.map(a => Math.abs(a.air - a.V) / a.V));
  row('MUST', 'trial 18: the spaces in the fall (K.air \'spaces\', a what-if), the 1912 preset at its flag: at the hand-over each piece\'s spaces\' room above her water against the pocket\'s (the core\'s water read slice by slice), and her air there the spaces\' own', ids.map((id, i) => id + ' ' + f(sp.at0[i].V, 1) + ' against ' + f(pk.at0[i].pocket, 1) + ' m3').join(', ') + '; at most ' + f(100 * dAir, 4) + ' % apart; her air the spaces\' to ' + dSet.toExponential(1),
    'within 0.1 %: two readings of the core\'s one state; the same to 1e-9', dAir <= 1e-3 && dSet <= 1e-9);
  row('MUST', '  ... and each piece\'s spaces hold the body\'s floodable volume (the cap on her air\'s volume)', ids.map((id, i) => id + ' ' + f(sp.at0[i].room, 1) + ' against ' + f(sp.at0[i].cap, 1) + ' m3').join(', ') + '; at most ' + dRoom.toExponential(1) + ' apart', 'the same to 1e-9 (both are the core\'s columns)', dRoom <= 1e-9);
  row('MUST', '  ... over ' + SECS + ' s of the fall: every space\'s water within its room, its air not below 0 and never held in no room, nothing NaN, after every step; the spaces\' clock the fall\'s; run twice, the same bits at ' + HALF + ' s', sp.bad + ' out of bounds; the clocks ' + sp.clock.toExponential(1) + ' s apart; ' + sp.h30.slice(0, 16) + (sp.h30 === sp2.h30 ? ' twice' : ' then ' + sp2.h30.slice(0, 16)), 'none; 0; the same bits', sp.bad === 0 && sp.clock === 0 && sp.h30 === sp2.h30);
  const throws = (fn) => { try { fn(); return false; } catch (e) { return true; } };
  // with the joint it is built since B4's gate 2: taken, the cut's faces shut and the tear's openings in their place
  let fJ = null; try { fJ = F.begin(simF, { K: { air: 'spaces' }, hinge: { sense: 'hog' } }); } catch (e) { fJ = null; }
  const nTear = fJ ? fJ.eng.bodies.reduce((s, b) => s + (b.spc && b.spc.tear ? b.spc.tear.tear.length : 0), 0) : 0;
  const gJ = !!fJ && fJ.eng.bodies.every(b => b.spc && b.spc.tear && b.spc.tear.tear.length > 0 && b.spc.tear.cut.every(i => b.spc.ops[i].open === false));
  const gK = throws(() => F.begin(simF, { K: { air: 'bubbles' } }));
  const gP = throws(() => { const fl = F.make(SEA, [specOf('bow', { K: { air: 'spaces' } })], { dt: C.DEFAULT_PARAMS.dt }); F.place(fl, 0, { pitch: 0, roll: 0 }); });
  row('MUST', '  ... with the joint, built (B4\'s gate 2); refused where it is not: a piece placed by hand, an unknown K.air', 'the joint ' + (gJ ? 'taken: the cut\'s faces shut, ' + nTear + ' tear openings in their place' : 'NOT AS BUILT') + ', placed by hand ' + (gP ? 'refused' : 'taken') + ', \'bubbles\' ' + (gK ? 'refused' : 'taken'), 'the joint through the tear (gate 2); the others refused (an error), never run as the pocket unasked', gJ && gP && gK);
  say('TRIAL 18: the spaces in the fall (M2, 4c; K.air \'spaces\', a what-if), the 1912 preset at its flag (T ' + f(simF.founderT / 60, 2) + ' min), ' + SECS + ' s of the fall: her air (m3, at its own pressure) at +' + MARKS.join(', +') + ' s');
  for (const [name, R] of [['spaces', sp], ['pocket', pk]]) {
    R.fall.pieces.forEach((p, i) => say('  ' + name.padEnd(7) + p.id.padEnd(6) + R.trace[i].join(', ') + '; at +' + f(R.fall.t - R.fall.t0, 0) + ' s ' + f(p.depth, 0) + ' m down, ' + p.state + ', pitch ' + f(attitude(p.q).pitch, 1) + ', roll ' + f(attitude(p.q).roll, 1)));
  }
  const evS = sp.fall.events, rep = evS.filter(e => e.id === 'report'), t0s = sp.fall.t0;
  const underS = evS.find(e => e.id === 'under' && e.piece === 'stern'), last = underS ? underS.t : Infinity;
  const atOnce = rep.filter(e => e.t <= t0s + 1e-9).length, after = rep.filter(e => e.t >= last), first = after.length ? after[0].t - last : NaN;
  for (const b of sp.fall.eng.bodies) say('  the ' + sp.fall.pieces[sp.fall.eng.bodies.indexOf(b)].id + '\'s failures (' + b.spc.ev.length + ', a report past ' + f(b.K.reportMin / 1e9, 1) + ' GJ, starred): ' + b.spc.ev.map(e => (e.energy >= b.K.reportMin ? '*' : '') + '+' + f(e.t - t0s, 1) + ' s node ' + e.node + ' ' + f(e.depth, 0) + ' m ' + f(e.energy / 1e9, 2) + ' GJ').join('; ') + '; air bubbled out of filled spaces ' + f(b.spc.st.bubbled || 0, 3) + ' m3 at one atmosphere');
  say();
  row('CHECK', '  ... the reports (a space giving way past ' + f(F.K0.reportMin / 1e9, 1) + ' GJ [bet]): how many, and when after the stern is under (the last of her)', rep.length + ' in ' + SECS + ' s: ' + atOnce + ' at the hand-over; the stern under at +' + f(last - t0s, 1) + ' s; ' + after.length + ' at or after it' + (after.length ? ', the first +' + f(first, 1) + ' s after' : ''),
    'the record (R5 10b, Pitman and Scarrott; the design v1\'s row 8): about four, the first 0 to 60 s after she is under; in: 2 to 6 after the stern is under, the first within 60 s. The core leaves her air at one atmosphere 10 to 100 m down at the flag, so most give way at the hand-over', after.length >= 2 && after.length <= 6 && first <= 60);

  // section 5's fuller form (K.fail 'boundaries', M2 4d): each space's boundaries from the faces its boxes share with its
  // neighbours' (boundariesOf), each bulkhead, joiner work and E deck at its own head into the space across it, the shell
  // at its own to the sea, a space giving way once at its weakest link
  const SPc = require('../core/readers/spaces.js'), walls = C.BULKHEADS.map(w => ({ x: w.x, top: C.deckZ(w.top, w.x) }));
  let mirror = 0, onWall = 0, joinerLow = 0, nb = 0;
  const kinds = {};
  for (const [lo, hi] of [[XB, 1e9], [-1e9, XB]]) {
    const spB = SPc.spacesOf(simF.ship, lo, hi), Bs = SPc.boundariesOf(spB, walls);
    nb += Bs.length;
    for (const b of Bs) {
      kinds[b.kind] = (kinds[b.kind] || 0) + b.A;
      const na = spB.node[b.a], side = (na >> 1) & 1;
      if (side === 0) {
        // its starboard twin: the same kind between the mirrored nodes, the same area, its centroid's y mirrored
        const ta = spB.node.indexOf(na + 2), tb = spB.node.indexOf(spB.node[b.b] + 2), tw = Bs.find(x => x.kind === b.kind && x.a === ta && x.b === tb);
        if (!tw || Math.abs(tw.A - b.A) > 1e-9 * b.A || Math.abs(tw.py + b.py) > 1e-9 || Math.abs(tw.px - b.px) > 1e-9 || Math.abs(tw.pz - b.pz) > 1e-9) mirror++;
      }
      if (b.kind !== 'deck') {
        const wl = walls[spB.node[b.a] >> 2];
        if (!wl || Math.abs(b.px - wl.x) > 1e-6 || b.hx > 1e-9) onWall++;
        if (b.kind === 'joiner' && b.qz - b.hz < wl.top - 1e-9) joinerLow++;
        if (b.kind === 'bulkhead' && b.qz + b.hz > wl.top + 1e-9) joinerLow++;
      }
    }
  }
  row('MUST', '  ... section 5\'s boundaries (boundariesOf), from the faces the spaces\' boxes share, on the preset\'s two pieces: port and starboard mirror each other; every bulkhead and joiner face on its wall\'s plane; watertight below its wall\'s top deck, joiner work above it', nb + ' boundaries (' + Object.entries(kinds).map(([k, a]) => k + ' ' + f(a, 0) + ' m2').join(', ') + '); ' + mirror + ' without their twin, ' + onWall + ' off their wall, ' + joinerLow + ' on the wrong side of the top deck',
    'none of either', mirror === 0 && onWall === 0 && joinerLow === 0);
  const runB = (secs, lim, hashAt, more) => {
    const fall = F.begin(simF, { K: Object.assign({ air: 'spaces', fail: 'boundaries' }, lim ? { limiter: lim } : {}, more || {}) });
    let bad = 0, hAt = null;
    while (fall.t - fall.t0 < secs - 1e-9 && !fall.done) {
      F.advance(fall); for (const b of fall.eng.bodies) bad += outOfBounds(b.spc.sp, b.spc.st);
      if (hashAt && hAt === null && fall.t - fall.t0 >= hashAt - 1e-9) hAt = hashOf(fall);   // the state a run to hashAt ends on
    }
    let twice = 0;
    for (const b of fall.eng.bodies) { const seen = new Set(); for (const e of b.spc.ev) { if (seen.has(e.node)) twice++; seen.add(e.node); } }
    return { fall, bad, twice, hash: hashOf(fall), hAt };
  };
  const fb = runB(SECS), fb2 = runB(HALF), fbH = runB(HALF);
  row('MUST', '  ... the fall with them (K.fail \'boundaries\', a what-if beside the first form) over ' + SECS + ' s: within bounds after every step; each space giving way once at most; run twice, the same bits at ' + HALF + ' s', fb.bad + ' out of bounds; ' + fb.twice + ' spaces given way twice; ' + fb2.hash.slice(0, 16) + (fb2.hash === fbH.hash ? ' twice' : ' then ' + fbH.hash.slice(0, 16)), 'none; none; the same bits', fb.bad === 0 && fb.twice === 0 && fb2.hash === fbH.hash);
  {
    const ev2 = fb.fall.events, rep2 = ev2.filter(e => e.id === 'report'), us2 = ev2.find(e => e.id === 'under' && e.piece === 'stern'), t02 = fb.fall.t0;
    const at2 = rep2.filter(e => e.t <= t02 + 1e-9).length, aft2 = us2 ? rep2.filter(e => e.t >= us2.t) : [];
    for (const b of fb.fall.eng.bodies) say('  the boundaries\' ' + fb.fall.pieces[fb.fall.eng.bodies.indexOf(b)].id + ': its failures (' + b.spc.ev.length + ', a report starred): ' + b.spc.ev.filter(e => e.energy > 1e6).map(e => (e.energy >= b.K.reportMin ? '*' : '') + '+' + f(e.t - t02, 1) + ' s node ' + e.node + ' ' + e.boundary + ' ' + f(e.depth, 0) + ' m ' + f(e.energy / 1e9, 2) + ' GJ').join('; ') + ' (and ' + b.spc.ev.filter(e => !(e.energy > 1e6)).length + ' of spaces with no air)');
    say();
    row('CHECK', '  ... the reports with them: how many, and when after the stern is under', rep2.length + ' in ' + SECS + ' s: ' + at2 + ' at the hand-over; the stern under at ' + (us2 ? '+' + f(us2.t - t02, 1) + ' s' : 'not yet') + '; ' + aft2.length + ' at or after it' + (aft2.length ? ', the first +' + f(aft2[0].t - us2.t, 1) + ' s after' : ''),
      'the record as above; in: 2 to 6 after the stern is under, the first within 60 s', aft2.length >= 2 && aft2.length <= 6 && (aft2[0].t - us2.t) <= 60);
  }
  // K.limiter (Z1, 2026-11-23, on the stern-work team's finding): the spaces' one-way limiter with a space the sea holds
  // counted as stiff as the sea is ('held', the default since D108, join 20), or judged pair by pair ('pair', the limiter
  // before D108, a what-if: every row of this trial above ran it until then). The
  // engine's own stepPiece on two rooms of 400 m3 (10 x 4 x 10 m, 20 to 30 m down, her frame the world's, the spaces'
  // step of 1/32 s) side by side, the bulkhead between them given way over half its face (20 m2, as failBoundaries opens
  // it), the forward room full and the after one dry at one atmosphere: (a) the full room fed by the sea through its
  // shell given way (shellOpening's form: half its mean section, 20 m2, as high as the room); (b) the full room sealed.
  // Fed, the law asks 265 m3/s at the start: the after room fills from the sea through its neighbour, its air standing
  // at the sea's pressure at the opening's top (P_ATM + rho g 20 m, where it meets the opening) and leaving the same way,
  // in seconds. Sealed, the full room can give water only as air comes to it: 'held' must not touch it
  {
    const box = [[5, 0, -25, 5, 2, 5], [-5, 0, -25, 5, 2, 5]], Af = (fn) => Float64Array.from(box.map(fn));
    const rigSp = { n: 2, node: Int32Array.from([0, 1]), start: Int32Array.from([0, 1]), count: Int32Array.from([1, 1]), mu: Af(() => 1), V: Af(b => 8 * b[3] * b[4] * b[5]),
      cx: Af(b => b[0]), cy: Af(b => b[1]), cz: Af(b => b[2]), bx: Af(b => b[0]), by: Af(b => b[1]), bz: Af(b => b[2]), wx: Af(b => b[3]), wy: Af(b => b[4]), wz: Af(b => b[5]) };
    const RI = [1, 0, 0, 0, 1, 0, 0, 0, 1], r0 = [0, 0, 0], DTs = 1 / 32, P0 = SPc.flow.P_ATM, pTop = P0 + SPc.flow.RHO_W * SPc.flow.G * 20;
    const rigRun = (fed, lim, secs) => {
      const ops = [{ c: -1, kind: 'failed bulkhead', a: 0, b: 1, px: 0, py: 0, pz: -25, nx: -1, ny: 0, nz: 0, A: 20, L: 10, Cd: 0.6, open: true }];
      if (fed) ops.push({ c: -1, kind: 'failed', a: 0, b: -1, px: 5, py: 2, pz: -25, nx: 0, ny: 1, nz: 0, A: 20, L: 10, Cd: 0.6, open: true });
      const st = { W: Float64Array.from([400, 0]), a: Float64Array.from([0, 400]), lev: new Float64Array(2) };
      let w2 = NaN;
      for (let i = 1; i <= Math.round(secs / DTs); i++) { SPc.stepPiece(rigSp, st, ops, RI, r0, DTs, undefined, lim); if (i === Math.round(2 / DTs)) w2 = st.W[1]; }
      const Va = rigSp.V[1] - st.W[1];
      return { W: st.W[1], w2, pa: Va > 1e-9 * rigSp.V[1] ? P0 * st.a[1] / Va : NaN, bits: Buffer.from(new Float64Array([st.W[0], st.W[1], st.a[0], st.a[1]]).buffer).toString('hex') };
    };
    const fP = rigRun(true, 'pair', 10), fH = rigRun(true, 'held', 10), sP = rigRun(false, 'pair', 10), sH = rigRun(false, 'held', 10), sD = rigRun(false, undefined, 10);
    row('MUST', 'K.limiter \'held\' (the default since D108; the stern-work team\'s finding, 2026-11-23): the engine\'s own stepPiece on two rooms of 400 m3 side by side, 20 to 30 m down, the bulkhead between them given way over 20 m2, the forward room full: fed by the sea (its shell given way), the after room fills in seconds; sealed, \'held\' the same bits as \'pair\' and as none',
      'fed: ' + f(fH.w2, 1) + ' m3 at 2 s, ' + f(fH.W, 1) + ' at 10 s, its air ' + (isFinite(fH.pa) ? f(fH.pa / 1000, 1) + ' kPa' : 'gone') + '; sealed: ' + (sH.bits === sP.bits && sP.bits === sD.bits ? 'the same bits' : 'NOT the same bits') + ' (' + f(sP.W, 1) + ' m3 at 10 s)',
      'fed: over 75 % of the room by 2 s, over 95 % by 10 s, any air left within 3 % of the sea\'s pressure at the opening\'s top (' + f(pTop / 1000, 1) + ' kPa); the law asks 265 m3/s at the start; sealed: the same bits',
      fH.w2 > 300 && fH.W > 380 && (!isFinite(fH.pa) || Math.abs(fH.pa - pTop) <= 0.03 * pTop) && sH.bits === sP.bits && sP.bits === sD.bits);
    row('CHECK', '  ... and \'pair\', the limiter before D108 (e84\'s safeguard 1, pair by pair; a what-if): the full room fed by the sea taken as stiff as a sealed one (its free surface\'s area floored at 1e-6 m2, or a bubble trapped at its top by its own p/V)', 'fed: ' + f(fP.w2, 1) + ' m3 at 2 s, ' + f(fP.W, 1) + ' at 10 s, its air ' + f(fP.pa / 1000, 1) + ' kPa',
      'in: within 10 % of \'held\' at 10 s (out by design: it starves a space the sea feeds, and the stern hangs on it, below)', Math.abs(fP.W - fH.W) <= 0.1 * fH.W);
    // the preset's flag under each: 'held' named is the default to the bit; 'pair' named is the limiter before D108 to the
    // bit (its boundaries' fall to 30 s has the hash the default had then: 55cf28a's table) and in bounds over SECS
    // (PRE_D108 was frozen before join 22: its run names the four consistencies at their values then, D116)
    const PRE_D108 = '1bf3ec633cfb610d', fbHn = runB(HALF, 'held'), fbP = runB(SECS, 'pair', HALF, { peakTank: 'solid', section: 'decimated', weather: 'none' });
    row('MUST', '  ... K.limiter \'held\' named is the default to the bit (D108): the boundaries\' fall to ' + HALF + ' s', fbHn.hash.slice(0, 16) + (fbHn.hash === fb2.hash ? ' = the default\'s' : ' against the default\'s ' + fb2.hash.slice(0, 16)), 'the same bits', fbHn.hash === fb2.hash);
    row('MUST', '  ... and \'pair\' is the limiter before D108 to the bit: the boundaries\' fall to ' + HALF + ' s under it', (fbP.hAt || 'none').slice(0, 16), PRE_D108 + ' (the default before D108: 55cf28a\'s table)', !!fbP.hAt && fbP.hAt.slice(0, 16) === PRE_D108);
    // D108 touches only K.air 'spaces': the default engine (the pocket) the same bits under either limiter
    const pocketAt = (lim) => { const fl = F.begin(simF, { K: lim ? { air: 'pocket', limiter: lim } : { air: 'pocket' } }); while (fl.t - fl.t0 < HALF - 1e-9 && !fl.done) F.advance(fl); return hashOf(fl); };
    const hPd = pocketAt(null), hPp = pocketAt('pair');
    row('MUST', '  ... K.limiter acts only under K.air \'spaces\': the default engine\'s fall (the pocket) to ' + HALF + ' s the same bits under \'held\' (D108\'s default) and \'pair\', so no watch, page or fingerprint moves', hPd.slice(0, 16) + (hPd === hPp ? ' under both' : ' against ' + hPp.slice(0, 16)), 'the same bits', hPd === hPp);
    const usH = fb.fall.events.find(e => e.id === 'under' && e.piece === 'stern'), usP = fbP.fall.events.find(e => e.id === 'under' && e.piece === 'stern');
    row('MUST', '  ... the fall under \'pair\' (the preset at its flag, K.fail \'boundaries\') over ' + SECS + ' s: within bounds after every step; each space giving way once at most', fbP.bad + ' out of bounds; ' + fbP.twice + ' spaces given way twice', 'none; none', fbP.bad === 0 && fbP.twice === 0);
    say('  K.limiter, the preset handed over at its flag (H1, past the parting): the stern under at ' + (usH ? '+' + f(usH.t - fb.fall.t0, 2) + ' s' : 'not within ' + SECS + ' s') + ' under \'held\' (the default), ' + (usP ? '+' + f(usP.t - fbP.fall.t0, 2) + ' s' : 'not within ' + SECS + ' s') + ' under \'pair\'; reports ' + fb.fall.events.filter(e => e.id === 'report').length + ' under \'held\', ' + fbP.fall.events.filter(e => e.id === 'report').length + ' under \'pair\'');
    say();
    // K.failOnce (Z1, 2026-11-24, the stern-work team's finding): 'space' (the default, as before) or 'boundary' (each
    // boundary and each space's shell give way once, a space again at another link). 'space' named is the default to the
    // bit; under 'boundary', 90 s of the preset's flag within bounds, no boundary and no shell opened twice
    const onceEach = (fall) => { let dup = 0; for (const b of fall.eng.bodies) { const seen = new Set(); for (const o of b.spc.ops) { if (o.c !== -1 || !String(o.kind).startsWith('failed')) continue; const key = o.kind + ':' + o.a + ':' + o.b; if (seen.has(key)) dup++; seen.add(key); } } return dup; };
    const fbS = runB(HALF, null, null, { failOnce: 'space' }), fbE = runB(SECS, null, null, { failOnce: 'boundary' });
    row('MUST', '  ... K.failOnce \'space\' named is the default to the bit: the boundaries\' fall to ' + HALF + ' s', fbS.hash.slice(0, 16) + (fbS.hash === fb2.hash ? ' = the default\'s' : ' against the default\'s ' + fb2.hash.slice(0, 16)), 'the same bits', fbS.hash === fb2.hash);
    const dupE = onceEach(fbE.fall), againE = fbE.twice, usE = fbE.fall.events.find(e => e.id === 'under' && e.piece === 'stern');
    row('MUST', '  ... under K.failOnce \'boundary\' (a what-if) over ' + SECS + ' s: within bounds after every step; no boundary and no shell opened twice (a space may give way again)', fbE.bad + ' out of bounds; ' + dupE + ' opened twice; ' + againE + ' spaces given way more than once', 'none; none', fbE.bad === 0 && dupE === 0);
    // K.floats (Z1, 2026-11-24, with the mainline's e120): the watertight doors' floats in the fall, the core's doorsStep
    // mirrored. Two rooms of 400 m3 side by side, 20 to 30 m down (her frame the world's), the core's nodes of zones 9 and
    // 10 below E deck (bulkhead K between them); a door of 1.5 m2 in K at the floor, open, its float armed; the forward
    // room open to the sea through its shell given way. Under 'core' the float releases the door once the water stands
    // params.floatDepth over a room's lowest point and it shuts params.doorFall later, the after room's water then still;
    // under 'none' it stays open. With every door shut at the hand-over (the model's own 1912 night) 'none' is the default
    {
      const bK = 9, box2 = [[5, 0, -25, 5, 2, 5], [-5, 0, -25, 5, 2, 5]], A2 = (fn) => Float64Array.from(box2.map(fn));
      const sp2 = { n: 2, node: Int32Array.from([(bK * 2) * 2, ((bK + 1) * 2) * 2]), start: Int32Array.from([0, 1]), count: Int32Array.from([1, 1]), mu: A2(() => 1), V: A2(b => 8 * b[3] * b[4] * b[5]),
        cx: A2(b => b[0]), cy: A2(b => b[1]), cz: A2(b => b[2]), bx: A2(b => b[0]), by: A2(b => b[1]), bz: A2(b => b[2]), wx: A2(b => b[3]), wy: A2(b => b[4]), wz: A2(b => b[5]) };
      const RI2 = [1, 0, 0, 0, 1, 0, 0, 0, 1], r02 = [0, 0, 0], DT2 = 1 / 32, P2 = { floatDepth: C.DEFAULT_PARAMS.floatDepth, doorFall: C.DEFAULT_PARAMS.doorFall };
      const doorRun = (floats) => {
        const ops = [{ c: 0, kind: 0, door: bK, a: 0, b: 1, px: 0, py: 0, pz: -29.15, nx: -1, ny: 0, nz: 0, A: 1.5, L: Math.sqrt(1.5), Cd: 0.6, open: true },
          { c: -1, kind: 'failed', a: 0, b: -1, px: 5, py: 2, pz: -25, nx: 0, ny: 1, nz: 0, A: 20, L: 10, Cd: 0.6, open: true }];
        const st = { W: Float64Array.from([0, 0]), a: Float64Array.from([400, 400]), lev: new Float64Array(2) };
        const sim2 = { doorFall: new Float64Array(C.BULKHEADS.length).fill(-1), doorFloat: new Uint8Array(C.BULKHEADS.length).fill(1) };
        const D = floats === 'core' ? SPc.doorsOf(sim2, sp2, ops) : [];
        let firstWet = null, wAtShut = null;
        for (let i = 1; i <= 60 * 32; i++) {
          const t = i * DT2;
          SPc.stepPiece(sp2, st, ops, RI2, r02, DT2, undefined, 'held');
          if (D.length) SPc.doorsStep(sp2, st, D, ops, RI2, r02, DT2, P2, t);
          if (firstWet === null && st.W[0] > 1e-6 && st.lev[0] - (-30) > P2.floatDepth) firstWet = t;
          if (wAtShut === null && st.doorsShut) wAtShut = st.W[1];
        }
        return { rel: st.doorsReleased ? st.doorsReleased[0].t : null, shut: st.doorsShut ? st.doorsShut[0].t : null, firstWet, open: ops[0].open, W1: st.W[1], wAtShut };
      };
      const dC = doorRun('core'), dN = doorRun('none');
      row('MUST', '  ... K.floats \'core\' (the default; the core\'s doorsStep mirrored): two rooms, a door in bulkhead K open with its float armed, the forward room fed by the sea: released when the water stands ' + P2.floatDepth + ' m over a floor, shut ' + P2.doorFall + ' s later, the after room\'s water then still; under \'none\' it stays open',
        '\'core\': released at +' + f(dC.rel, 3) + ' s (the water past ' + P2.floatDepth + ' m at +' + f(dC.firstWet, 3) + ' s), shut at +' + f(dC.shut, 3) + ' s; the after room ' + f(dC.wAtShut, 2) + ' m3 at the shut, ' + f(dC.W1, 2) + ' at 60 s; \'none\': ' + (dN.open ? 'open' : 'SHUT') + ', ' + f(dN.W1, 1) + ' m3 at 60 s',
        'the release on the step the water passes the float; the shut ' + P2.doorFall + ' s after; nothing more through it; \'none\' open', dC.rel !== null && dC.rel === dC.firstWet && dC.shut !== null && Math.abs(dC.shut - dC.rel - P2.doorFall) <= DT2 + 1e-9 && !dC.open && dC.W1 === dC.wAtShut && dN.open && dN.W1 > dC.W1);
      const fbN = runB(HALF, null, null, { floats: 'none' });
      row('MUST', '  ... and with every door shut at the hand-over (the preset at its flag) \'none\' named is the default to the bit: the boundaries\' fall to ' + HALF + ' s', fbN.hash.slice(0, 16) + (fbN.hash === fb2.hash ? ' = the default\'s' : ' against the default\'s ' + fb2.hash.slice(0, 16)), 'the same bits', fbN.hash === fb2.hash);
    }
    // K.weather (Z1, 2026-11-24, the coordinator's (3)): the openings to the weather in the fall, the core's stairsStep
    // mirrored. One dry room of 400 m3 (her frame the world's) sunk at 0.5 m/s from 2 m clear of the sea; in her side a
    // window 2 m wide and 1 m high (an upright opening, type 2) whose centre is the room's middle, its strength 3 m. Under
    // 'core' it holds until the sea stands 3 m over its centre (the room dry: nothing behind it), gives way on that step
    // for good, and the room takes the sea; under 'none' (the default) it never opens
    {
      const bx = [0, 0, 0, 5, 2, 5], A1 = (v) => Float64Array.from([v]);
      const sp1 = { n: 1, node: Int32Array.from([0]), start: Int32Array.from([0]), count: Int32Array.from([1]), mu: A1(1), V: A1(8 * bx[3] * bx[4] * bx[5]),
        cx: A1(bx[0]), cy: A1(bx[1]), cz: A1(bx[2]), bx: A1(bx[0]), by: A1(bx[1]), bz: A1(bx[2]), wx: A1(bx[3]), wy: A1(bx[4]), wz: A1(bx[5]) };
      const ow = { id: 'the rig\'s window', type: 2, x: 0, y: 2, z: -0.5, zc: 0, size: 2, dim: 1, leak: 0, hc: 3, nodes: [0], conn: 0 };
      const simW = { conn: { type: Int8Array.from([2]), kind: Int8Array.from([9]), dim: Float64Array.from([1]) }, stairOps: [ow], stairSt: Uint8Array.from([0]) };
      const RW = [1, 0, 0, 0, 1, 0, 0, 0, 1], DTW = 1 / 32, PW = { hAir: -1 };
      const runW = (weather) => {
        const ops = [{ c: 0, kind: 9, a: 0, b: -1, px: 0, py: 2, pz: 0, nx: 0, ny: 1, nz: 0, A: 0, L: 1, Cd: 0.6, open: false }];
        const st = { W: Float64Array.from([0]), a: Float64Array.from([sp1.V[0]]), lev: new Float64Array(1) };
        const Wt = weather === 'core' ? SPc.weatherOf(simW, sp1, ops, {}) : null;
        let tGo = null, hGo = null, hPrev = null, again = 0;
        for (let i = 1; i <= 40 * 32; i++) {
          const t = i * DTW, r = [0, 0, 7 - 0.5 * t];                     // the room's middle (and the window's centre) in the world
          SPc.stepPiece(sp1, st, ops, RW, r, DTW, undefined, 'held');
          if (Wt) {
            const n = SPc.weatherStep(sp1, st, Wt, ops, RW, r, t, PW);
            if (n && tGo !== null) again++;
            if (n && tGo === null) { tGo = t; hGo = -r[2]; hPrev = -(7 - 0.5 * (t - DTW)); }
          }
        }
        return { tGo, hGo, hPrev, again, open: ops[0].open, A: ops[0].A, W: st.W[0], opened: st.weatherOpened ? st.weatherOpened.length : 0 };
      };
      const wC = runW('core'), wN = runW('none');
      row('MUST', '  ... K.weather \'core\' (the core\'s stairsStep mirrored): a window of strength 3 m in the side of a dry room sunk at 0.5 m/s gives way on the step the sea stands 3 m over its centre, for good, with its full size, and the room takes the sea; under \'none\' (the default) it never opens',
        '\'core\': gives way at +' + f(wC.tGo, 4) + ' s, the head over its centre ' + f(wC.hGo, 4) + ' m (' + f(wC.hPrev, 4) + ' the step before); its area ' + f(wC.A, 2) + ' m2; again ' + wC.again + '; the room ' + f(wC.W, 1) + ' m3 at 40 s; \'none\': ' + (wN.open ? 'OPEN' : 'shut') + ', ' + f(wN.W, 2) + ' m3',
        'at +20.0000 s (3 m; under 3 the step before); 2 m2; none again; the room wet; \'none\' shut and dry',
        wC.tGo !== null && Math.abs(wC.tGo - 20) <= 1e-9 && wC.hGo >= 3 && wC.hPrev < 3 && wC.again === 0 && wC.opened === 1 && Math.abs(wC.A - 2) <= 1e-12 && wC.W > 1 && !wN.open && wN.W === 0);
      const fbW = runB(HALF, null, null, { weather: 'core' });
      row('MUST', '  ... and K.weather \'core\' named is the default to the bit (D116, join 22): the boundaries\' fall to ' + HALF + ' s', fbW.hash.slice(0, 16) + (fbW.hash === fb2.hash ? ' = the default\'s' : ' against the default\'s ' + fb2.hash.slice(0, 16)), 'the same bits', fbW.hash === fb2.hash);
    }
    say('  K.failOnce, the same preset at its flag: the stern under at ' + (usE ? '+' + f(usE.t - fbE.fall.t0, 2) + ' s' : 'not within ' + SECS + ' s') + ' under \'boundary\', ' + (usH ? '+' + f(usH.t - fb.fall.t0, 2) + ' s' : 'not within ' + SECS + ' s') + ' under \'space\' (the default); failures ' + fbE.fall.eng.bodies.map(b => b.spc.ev.length).join(' and ') + ' (bow and stern) under \'boundary\', ' + fb.fall.eng.bodies.map(b => b.spc.ev.length).join(' and ') + ' under \'space\'; reports ' + fbE.fall.events.filter(e => e.id === 'report').length + ' and ' + fb.fall.events.filter(e => e.id === 'report').length);
    say();
  }
}

// ================================================================ trial 19: her solids by zone (D(G12-e), step 3)
// K.solids 'items' (a what-if; 'core', the default, is the engine as before: every row above): each zone's solids, the
// envelope less the floodable volume, made B1+B2's item-by-item volume (F.SOLIDS_ITEMS, the wood afloat or soaked), the
// zone's floodable volume and the hand-over's water in it scaled together (solidsScale), the core's own permeabilities
// untouched. The fall's own solids by zone are B1+B2's "model" column but at the forepeak, where G7's peak tank (a
// pocket, outside the core's spaces) counts as solid in the fall: under 'items' its room, full of water, is floodable
{
  const TT = F.shipTables(ship), zS = (g) => { const S = new Float64Array(16); for (let j = 0; j < TT.nS; j++) S[TT.zone[j]] += TT.Venv[j] - TT.Vf[j] * (g ? g[TT.zone[j]] : 1); return S; };
  let worst = 0;
  for (const wood of ['afloat', 'soaked']) { const S = zS(F.solidsScale(TT, wood)); for (let z = 0; z < 16; z++) worst = Math.max(worst, Math.abs(S[z] - F.SOLIDS_ITEMS[wood][z]) / F.SOLIDS_ITEMS[wood][z]); }
  const S0 = zS(null);
  // each slice's fill at the hand-over (the preset at its flag): its water over its floodable volume, either way
  const pc = (K) => F.piece(ship, simF, XB, XF, { id: 'bow', kind: 'bow', K }), pa = pc({}), pb = pc({ solids: 'items' });
  const Wb = F.waterBySlice(simF, C.frameOf(simF), TT);
  let fillOff = 0, jj = 0;
  for (let j = 0; j < TT.nS && jj < pa.slices.length; j++) {
    if (!(Math.min(XF, TT.e[j + 1]) - Math.max(XB, TT.e[j]) > 1e-9)) continue;
    const a = pa.slices[jj], b = pb.slices[jj]; jj++;
    if (!(a.Vf > 0)) continue;
    const fa = Wb.W[j] * (a.dx / TT.dx[j]) / a.Vf, fb = Wb.W[j] * (a.dx / TT.dx[j]) * (b.Vf / a.Vf) / b.Vf;
    fillOff = Math.max(fillOff, Math.abs(fa - fb));
  }
  row('MUST', 'trial 19: her solids by zone (K.solids \'items\', a what-if): each zone\'s solids, the envelope less the floodable volume, are B1+B2\'s items, the wood afloat or soaked; each slice\'s fill at the hand-over kept', 'at most ' + worst.toExponential(1) + ' off the items; the fill ' + fillOff.toExponential(1) + ' off; the fall\'s own solids ' + f(S0.reduce((x, y) => x + y, 0), 0) + ' m3 (the forepeak\'s ' + f(S0[0], 0) + ', G7\'s tank in it), the items\' ' + F.SOLIDS_ITEMS.afloat.reduce((x, y) => x + y, 0) + ' or ' + F.SOLIDS_ITEMS.soaked.reduce((x, y) => x + y, 0),
    'to 1e-9 each', worst <= 1e-9 && fillOff <= 1e-9);
  // with Z6's spaces too (K.air 'spaces'): each space's room, permeability, water and air by its zone's factor, so each
  // piece's spaces still hold the body's floodable volume (trial 18's row, under the items' solids), and keep their fill
  {
    const fs = F.begin(simF, { K: { air: 'spaces', solids: 'items' } }), f0 = F.begin(simF, { K: { air: 'spaces' } });
    let dRoom = 0, dFill = 0;
    fs.eng.bodies.forEach((b, i) => {
      const S = b.spc, S0b = f0.eng.bodies[i].spc;
      dRoom = Math.max(dRoom, Math.abs(S.sp.V.reduce((x, y) => x + y, 0) - b.airMax) / b.airMax);
      for (let k = 0; k < S.sp.n; k++) dFill = Math.max(dFill, Math.abs(S.st.W[k] / S.sp.V[k] - S0b.st.W[k] / S0b.sp.V[k]));
    });
    row('MUST', '  ... and with the spaces (K.air \'spaces\'): each space\'s room, water and air by its zone\'s factor, so that each piece\'s spaces hold its body\'s floodable volume, and each space keeps its fill', 'rooms against the body ' + dRoom.toExponential(1) + ' apart; the fills ' + dFill.toExponential(1) + ' apart', 'to 1e-9 each', dRoom <= 1e-9 && dFill <= 1e-9);
  }
  const word = (q) => { const r = Math.abs(attitude(q).roll); return r <= 45 ? 'upright' : (r >= 135 ? 'upside down' : 'on her side'); };
  const res = [['core', {}], ['items, wood afloat', { solids: 'items', wood: 'afloat' }], ['items, wood soaked', { solids: 'items', wood: 'soaked' }]].map(([label, K]) => {
    const fall = F.begin(simF, { K });
    const lev = fall.eng.bodies.map(b => F.leverOf(b));
    while (!fall.done && fall.k < 4 * 60 * 30) F.advance(fall);
    const land = fall.pieces.map((p, i) => { const w = F.worldOf(fall, i, [0.5 * (p.x0 + p.x1), 0, GI.Z_NA]), dX = w[0] - fall.breakAt[0], dY = w[1] - fall.breakAt[1]; return { id: p.id, dist: Math.sqrt(dX * dX + dY * dY), word: word(p.q) }; });
    return { label, lev, land, done: fall.done };
  });
  say('TRIAL 19: her solids by zone (D(G12-e) step 3), the 1912 preset at its flag: each piece\'s lever (its weight in water against the middle of her plan, + forward) and weight in water, and where it lands');
  for (const r of res) say('  ' + r.label.padEnd(20) + r.lev.map((L, i) => r.land[i].id + ' lever ' + f(L.lever, 2) + ' m, ' + f(L.wIn / 1000, 0) + ' t in water, lands ' + f(r.land[i].dist, 0) + ' m, ' + r.land[i].word).join('; ') + (r.done ? '' : ' (not done)'));
  say();
  const it = res[1];
  row('CHECK', '  ... where the pieces land with the items (the wood afloat), and which way up', it.land.map(l => l.id + ' ' + f(l.dist, 0) + ' m, ' + l.word).join('; ') + ' (core: ' + res[0].land.map(l => l.id + ' ' + f(l.dist, 0)).join(', ') + '; soaked: ' + res[2].land.map(l => l.id + ' ' + f(l.dist, 0) + ' ' + l.word).join(', ') + ')',
    'reported against the bow 772 m and the stern 148 m from the point under the break (R5 10a), both upright (R5 1.1); in: each within 30 % and both upright', it.land.every(l => l.word === 'upright') && Math.abs(it.land[0].dist - 772) <= 0.3 * 772 && Math.abs(it.land[1].dist - 148) <= 0.3 * 148);
}

// ================================================================ trial 20: B4's gate 2, the spaces with the joint
// docs/DESIGN_B4_Z6_the_break_from_the_onset_gates_1_2_v1: the 1912 watch at B2's onset, joined (S.hinge at the onset's
// station and sense, Lh 20 m) with her air space by space (K.air 'spaces'). While the joint holds, the broken spaces open
// to the sea only through the tear, S.hinge's openings at the hinge's own angle (F.tearAt), each piece's half by its
// share of the space's room; at the release the cut's faces open and the tear's last openings stand. Held over 90 s (past
// the release, not to the bed: the spaces' cost): every space within bounds, the tear's openings S.hinge's at every
// step, the faces shut while joined and open after, the release in it, the same bits twice
{
  const s20 = N.create(C.buildShip(), N.spec(1912), { auto: true, handover: 'onset' });
  while (!N.over(s20)) N.step(s20);
  const f20 = s20.onset.found, sense20 = f20.sense === 'sagging' ? 'sag' : 'hog', SECS20 = 90;
  const go = (hg) => {
    const fall = F.begin(s20, { any: true, cut: f20.x, rule: 'break', t0: f20.t, K: { air: 'spaces' }, hinge: Object.assign({ sense: sense20, Lh: 20 }, hg || {}) }), J = fall.eng.joint;
    let bad = 0, tearErr = 0, faces = true, maxA = 0, steps = 0;
    while (!fall.done && fall.t - fall.t0 < SECS20) {
      F.advance(fall); steps++;
      const at = F.tearAt(J);
      for (const b of fall.eng.bodies) {
        const S = b.spc, T = S.tear;
        bad += outOfBounds(S.sp, S.st);
        if (!T.released) {
          if (!T.cut.every(i => S.ops[i].open === false)) faces = false;
          for (const t of T.tear) { const want = (at.open[t.q] || 0) * t.share, A = S.ops[t.i].A; if (Math.abs(A - want) > 1e-12 * Math.max(1, want)) tearErr++; if (A > maxA) maxA = A; }
        } else if (!T.cut.every(i => S.ops[i].open === true)) faces = false;
      }
    }
    const h = crypto.createHash('sha256');
    for (let i = 0; i < fall.pieces.length; i++) { const p = fall.pieces[i]; h.update(Buffer.from(new Float64Array(p.r.concat(p.q)).buffer)); h.update(Buffer.from(fall.eng.bodies[i].spc.st.W.buffer)); }
    return { fall, J, bad, tearErr, faces, maxA, steps, hash: h.digest('hex') };
  };
  // the default (the mended step, gate 5): member C holds the 90 s here; the scheme before (hinge.at 'start') lets go at
  // +32 s, the vehicle that shows the faces opening at a release inside the trial's 90 s (the mechanics, not a claim)
  const g1 = go(), g2 = go(), gS = go({ at: 'start' }), J20 = g1.J, rel = J20.released ? J20.release.t - g1.fall.t0 : NaN, relS = gS.J.released ? gS.J.release.t - gS.fall.t0 : NaN;
  const sw20 = g1.fall.eng.bodies.map(b => b.spc.st.W), wIn = (i) => { let s = 0; for (const W of [sw20[i]]) for (let k = 0; k < W.length; k++) s += W[k]; return s; };
  say('TRIAL 20: B4\'s gate 2, the 1912 watch at B2\'s onset joined (x ' + f(f20.x, 2) + ', ' + sense20 + ') with the spaces: ' + (J20.released ? 'let go at +' + f(rel, 2) + ' s by ' + J20.release.by : 'held the ' + SECS20 + ' s (yielded ' + J20.yielded + ', theta at most ' + f(J20.thMax / DEG, 4) + ' deg, |V|/Vs at most ' + f(J20.maxV, 3) + ')') + '; the tear\'s largest opening a half took ' + f(g1.maxA, 2) + ' m2; at +' + SECS20 + ' s the bow holds ' + f(wIn(0), 0) + ' m3 of water, the stern ' + f(wIn(1), 0) + '. The scheme before the mend (hinge.at \'start\') let go at +' + f(relS, 2) + ' s');
  row('MUST', 'trial 20: B4\'s gate 2, the spaces with the joint from the onset (the mended step): every space within bounds, the tear\'s openings S.hinge\'s at the joint\'s angle, the cut\'s faces shut while joined', g1.bad + ' out of bounds; ' + g1.tearErr + ' tear openings off S.hinge\'s; the faces ' + (g1.faces ? 'as the joint says' : 'NOT') + (J20.released ? '; let go at +' + f(rel, 2) + ' s' : '; held the ' + SECS20 + ' s'),
    'none; to 1e-12; shut while joined (open after, if it lets go)', g1.bad === 0 && g1.tearErr === 0 && g1.faces);
  row('MUST', '  ... at a release the cut\'s faces open and the tear\'s last openings stand: on the scheme before the mend (hinge.at \'start\'), which lets go inside the ' + SECS20 + ' s', gS.bad + ' out of bounds; the faces ' + (gS.faces ? 'shut then open' : 'NOT') + '; let go at +' + f(relS, 2) + ' s',
    'none; shut then open; the release in the ' + SECS20 + ' s', gS.bad === 0 && gS.faces && gS.J.released);
  row('CHECK', '  ... and on the mended step, does member C let go with the spaces? (the record: she broke at the surface, R5; with the pocket she lets go at +22.69 s, its first peak 1.75 % past Mu: the coin\'s edge, the hand-over\'s own, swing probe 11-24)', J20.released ? 'let go at +' + f(rel, 2) + ' s by ' + J20.release.by : 'held the ' + SECS20 + ' s; yielded ' + J20.yielded,
    'in: lets go in the ' + SECS20 + ' s; reported, never tuned (B1+B2: the record is no reason to push a member over)', J20.released);
  row('MUST', '  ... run twice, the same bits', g1.hash.slice(0, 16) + (g1.hash === g2.hash ? ' twice' : ' then ' + g2.hash.slice(0, 16)), 'the same bits', g1.hash === g2.hash);
}

const secs = (Date.now() - t0) / 1000;
const lines = out.slice();
for (const [kind, what, value, ref, ok] of rows) lines.push((kind === 'MUST' ? (ok ? 'PASS ' : 'FAIL ') : (ok ? 'in   ' : 'OUT  ')) + what.padEnd(112) + ' ' + String(value).padEnd(80) + ' ' + ref);
const verdict = fails ? 'FAIL: ' + fails + ' MUST row(s)' : 'PASS: every MUST row (' + rows.filter(r => r[0] === 'MUST').length + '); CHECK rows in range: ' + rows.filter(r => r[0] === 'CHECK' && r[4]).length + ' of ' + rows.filter(r => r[0] === 'CHECK').length;
lines.push('', verdict);
fs.writeFileSync(outFile('fall_trials.txt'), lines.join('\n') + '\n');
for (const l of lines.slice(0, -2)) console.log(l);
console.log('(the trials took ' + f(secs, 0) + ' s)');
console.log('\n' + verdict);
process.exit(fails ? 1 : 0);
