// The boats' three fitted numbers (core/readers/people.js, FIT): kLo and kHi, the chance a minute that a person on the
// boat deck comes forward to a boat well below and well above the trim of the jump, and pace, the minutes a party gives
// a boat before it will lower her. Fitted so that the 1912 watch gives the recorded launch times (Wormstedt, Fitch and
// Behe: the note's table 11.1, good to about ten minutes a boat) and about 671 in the eighteen boats lowered from the
// davits (Wormstedt and Fitch). The objective is score(), below.
// The boats change nothing the model does (a reader), so one 1912 watch is run once and what the model shows the boats is
// recorded step by step; each trial replays the reader alone over that record. Deterministic: a fixed grid, then two
// finer grids around the best.
//   node tools/calibrate_people.js        prints the fit, the table, and the line to paste into core/readers/people.js
'use strict';
const C = require('../core/core.js');
const N = require('../core/night.js');
const B = require('../core/readers/people.js');

// ---- one watch, recorded: what the reader sees after every step
function record() {
  const ship = C.buildShip(), sim = N.create(ship, N.spec(1912), { auto: true }), NB = B.BOATS.length;
  const cols = { t: [], tTouch: [], trim: [], list: [], kn: [], X: [], Y: [], psi: [], damaged: [], foundered: [], light: [] }, drops = [];
  const o = B.fresh().obs;
  for (;;) {
    N.step(sim);
    B.observe(sim, o);
    for (const k of Object.keys(cols)) cols[k].push(o[k]);
    for (let i = 0; i < NB; i++) drops.push(o.drop[i]);
    // G12 (D98): the watch ends at her hand-over, the break's onset by default (the reader's own end: people.js observes
    // N.over as foundered); past it the model stands still
    if (N.over(sim) || sim.t > 6 * 3600) break;
  }
  const K = cols.t.length, rec = { K, NB, dt: sim.params.dt, drop: Float64Array.from(drops), live: sim.people, fp: N.fingerprint(sim) };
  for (const k of Object.keys(cols)) rec[k] = Float64Array.from(cols[k].map(Number));
  return rec;
}
// the reader alone over the record, with fitted numbers F (from step s0 on, from a state P0 taken there)
function replay(rec, F, P0, s0) {
  const P = P0 ? structuredClone(P0) : B.fresh(), o = P.obs;
  for (let s = s0 || 0; s < rec.K; s++) {
    o.t = rec.t[s]; o.dt = rec.dt; o.tTouch = rec.tTouch[s]; o.trim = rec.trim[s]; o.list = rec.list[s]; o.kn = rec.kn[s];
    o.X = rec.X[s]; o.Y = rec.Y[s]; o.psi = rec.psi[s]; o.damaged = rec.damaged[s] > 0; o.foundered = rec.foundered[s] > 0; o.light = rec.light[s] > 0;
    for (let i = 0; i < rec.NB; i++) o.drop[i] = rec.drop[s * rec.NB + i];
    B.tick(P, o, F);
  }
  return P;
}
// nothing before the call to the boats depends on the fitted numbers: the state just before it, and its step
function beforeCall(rec) {
  const P = B.fresh(), o = P.obs;
  for (let s = 0; s < rec.K; s++) {
    const keep = structuredClone(P);
    o.t = rec.t[s]; o.dt = rec.dt; o.tTouch = rec.tTouch[s]; o.trim = rec.trim[s]; o.list = rec.list[s]; o.kn = rec.kn[s];
    o.X = rec.X[s]; o.Y = rec.Y[s]; o.psi = rec.psi[s]; o.damaged = rec.damaged[s] > 0; o.foundered = rec.foundered[s] > 0; o.light = rec.light[s] > 0;
    for (let i = 0; i < rec.NB; i++) o.drop[i] = rec.drop[s * rec.NB + i];
    B.tick(P, o, B.FIT);
    if (P.callT >= 0) return { P: keep, s };
  }
  return { P: B.fresh(), s: 0 };
}
const DAVITS = B.BOATS.map((b, i) => i).filter(i => B.BOATS[i].rec.T !== null);     // the eighteen lowered on the night
const RECORD_N = DAVITS.reduce((a, i) => a + B.BOATS[i].rec.n, 0);                 // 671
// The objective: each boat's launch time against the record in units of ten minutes, squared, its error counted at most
// CAP minutes, so that a boat whose story the model leaves out (boat 4 hung at A deck for its windows, the note 5) cannot
// drive the fit [bet: the cap]; with the people in the eighteen against 671 in units of 10 %, squared, as one more term.
const CAP = 15;
function score(rec, P) {
  const tT = rec.tTouch[rec.K - 1];
  let sq = 0, n = 0;
  const rows = DAVITS.map(i => {
    const b = P.boats[i], d = B.BOATS[i], T = b.tAway >= 0 ? (b.tAway - tT) / 60 : null;
    sq += Math.pow(Math.min(CAP, Math.abs((T === null ? 300 : T) - d.rec.T)) / 10, 2);
    if (b.state === 'away') n += b.n;
    return { id: d.id, side: d.side, rec: d.rec.T, T, n: b.n, recN: d.rec.n, state: b.state };
  });
  const J = sq / DAVITS.length + Math.pow((n - RECORD_N) / (0.1 * RECORD_N), 2);
  return { J, n, rows };
}
// a 6 x 6 x 6 grid, then coordinate descent from its best: each number up and down by a step, the steps halved (in
// their logarithm for the two chances) when a pass finds nothing better. Deterministic; about 250 trials.
function search(rec, label, snap) {
  let best = null, n = 0;
  const seen = new Map();
  const tryF = (F) => {
    if (!(F.kHi > F.kLo) || !(F.pace > 0)) return false;
    const key = JSON.stringify(F); if (seen.has(key)) return false;
    const s = score(rec, replay(rec, F, snap.P, snap.s)); seen.set(key, s.J); n++;
    if (!best || s.J < best.s.J - 1e-12) { best = { F, s }; return true; }
    return false;
  };
  const t0 = Date.now();
  for (const a of [0.0005, 0.001, 0.002, 0.004, 0.008, 0.016]) for (const b of [0.01, 0.02, 0.04, 0.08, 0.16, 0.32]) for (const c of [5, 6.5, 8, 9.5, 11, 12.5]) tryF({ kLo: a, kHi: b, pace: c });
  let fk = 1.5, fp = 1.5;
  for (let pass = 0; pass < 12 && (fk > 1.02 || fp > 0.1); pass++) {
    let moved = false;
    for (const [key, up, down] of [['kLo', (v) => v * fk, (v) => v / fk], ['kHi', (v) => v * fk, (v) => v / fk], ['pace', (v) => v + fp, (v) => v - fp]]) {
      for (const g of [up, down]) {
        const F = Object.assign({}, best.F); F[key] = key === 'pace' ? Math.round(g(F[key]) * 100) / 100 : +g(F[key]).toPrecision(3);
        if (tryF(F)) moved = true;
      }
    }
    if (!moved) { fk = Math.sqrt(fk); fp = fp / 2; }
  }
  console.log(label + ': best J ' + best.s.J.toFixed(3) + ' at ' + JSON.stringify(best.F) + ' (' + n + ' trials, ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)');
  return best;
}
function table(rec, best) {
  const f = (v) => (v === null ? '  never' : v.toFixed(1).padStart(7));
  console.log('\n  boat side  record T   model T    model-record   record n  model n');
  for (const r of best.s.rows) console.log('  ' + r.id.padEnd(4) + ' ' + r.side + '    ' + String(r.rec).padStart(7) + '  ' + f(r.T) + '   ' + (r.T === null ? '     -' : ((r.T - r.rec >= 0 ? '+' : '') + (r.T - r.rec).toFixed(1)).padStart(7)) + (r.T !== null && Math.abs(r.T - r.rec) <= 10 ? '        ' : '  OUT   ') + String(r.recN).padStart(6) + '   ' + String(r.n).padStart(6));
  const inside = best.s.rows.filter(r => r.T !== null && Math.abs(r.T - r.rec) <= 10).length;
  console.log('  ' + inside + ' of 18 within ten minutes; in the eighteen: model ' + best.s.n + ', record ' + RECORD_N + ' (' + ((best.s.n / RECORD_N - 1) * 100).toFixed(1) + ' %)');
}

if (require.main === module) {
  const t0 = Date.now(), rec = record();
  console.log('the 1912 watch recorded: ' + rec.K + ' steps, to her end (the hand-over) ' + ((rec.t[rec.K - 1] - rec.tTouch[rec.K - 1]) / 60).toFixed(1) + ' min after the touch, fingerprint ' + rec.fp + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)');
  // the record replays the live reader exactly (the same numbers, the same states)
  const strip = (P) => JSON.stringify({ boats: P.boats, groups: P.groups, parties: P.parties, count: P.count, water: P.water });
  const same = strip(replay(rec, B.FIT)) === strip(rec.live);
  console.log('the reader replayed over the record gives the live reader\'s state, to the bit: ' + same);
  if (!same) { console.log('FAIL: the record does not replay the reader'); process.exit(1); }
  const snap = beforeCall(rec);
  console.log('the call to the boats at step ' + snap.s + ' (T ' + ((rec.t[snap.s] - rec.tTouch[snap.s]) / 60).toFixed(1) + '); each trial replays from there');
  const follow0 = B.RATE.follow;
  const alt = follow0 === 'people' ? 'group' : 'people';
  B.RATE.follow = alt; const other = search(rec, 'parties follow "' + alt + '"', snap);
  B.RATE.follow = follow0; const best = search(rec, 'parties follow "' + follow0 + '" (the reader\'s rule)', snap);
  if (other.s.J < best.s.J) console.log('  note: the other rule ("' + alt + '") fits better, J ' + other.s.J.toFixed(3) + ' against ' + best.s.J.toFixed(3));
  table(rec, best);
  const P = replay(rec, best.F), tT = rec.tTouch[rec.K - 1];
  for (const id of ['A', 'B']) { const b = P.boats[B.IDX[id]]; console.log('  ' + id + ': ' + b.state + (b.tFloat >= 0 ? ' at T ' + ((b.tFloat - tT) / 60).toFixed(1) : '') + ' (record: floated off at T 155 to 160)'); }
  console.log('\nthe line for core/readers/people.js:\n  const FIT = { kLo: ' + best.F.kLo + ', kHi: ' + best.F.kHi + ', pace: ' + best.F.pace + ' };');
}
module.exports = { record, replay, score, DAVITS, RECORD_N };
