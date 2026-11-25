// The boats (core/readers/people.js): the acceptance. MUST rows are invariants of the reader; CHECK rows are the record,
// each with its reference (in: inside it; OUT: outside it, reported as it is, never tuned away).
//   node tools/people_tests.js        (a few minutes: about five whole watches)
'use strict';
const C = require('../core/core.js');
const N = require('../core/night.js');
const B = require('../core/readers/people.js');
const CAL = require('./calibrate_people.js');
const ship = C.buildShip();
const rows = []; let fails = 0;
function row(kind, what, value, ref, ok) { rows.push([kind, what, value, ref, ok]); if (kind === 'MUST' && !ok) fails++; }
const f = (x, n) => (x === null || x === undefined || Number.isNaN(x) ? 'n/a' : x.toFixed(n === undefined ? 1 : n));
const Tof = (sim, t) => (t - sim.night.tTouch) / 60;
const strip = (P) => JSON.stringify(Object.assign({}, P, { obs: undefined }));
const t0 = Date.now();

// One watch to its end (she founders, or tMax, or `until`), with checks at every step: the count of people, and the
// limits (no boat put into the falls from a station the sea has reached, none lowered above the speed limit). With a
// twin (the same night without any reader, and without the boats' orders), the fingerprints are compared at every step.
// `before(sim)` gives orders between steps, as the page does; `rec` keeps what the reader saw, for the calibration's replay.
function watch(sp, opts) {
  opts = opts || {};
  const sim = N.create(ship, sp, opts.create || { auto: true });
  const twin = opts.twin ? N.create(ship, sp, Object.assign({}, opts.twin, { readers: false })) : null;
  const P = sim.people, NB = B.BOATS.length, st = { parted: -1, steps: 0, total: [], intoFalls: [], fast: [], events: null };
  const prev = P.boats.map(b => b.state), prevLow = P.boats.map(b => b.low);
  const rec = opts.rec ? { K: 0, NB, dt: sim.params.dt, cols: { t: [], tTouch: [], trim: [], list: [], kn: [], X: [], Y: [], psi: [], damaged: [], foundered: [], light: [] }, drops: [] } : null;
  const tMax = opts.tMax || 6 * 3600;
  // G12's switch (D98): to her hand-over (by default the break's onset; her flag where she founders first), as the reader
  // ends there itself (people.js: o.foundered is N.over)
  while (!N.over(sim) && sim.t < tMax && !(opts.until && opts.until(sim))) {
    if (opts.before) opts.before(sim);
    N.step(sim); if (twin) N.step(twin);
    st.steps++;
    if (twin && st.parted < 0 && N.fingerprint(sim) !== N.fingerprint(twin)) st.parted = sim.night.k;
    const c = P.count;
    if (c.aboard + c.inBoats + c.water !== B.PEOPLE.aboard || c.aboard < 0 || c.inBoats < 0 || c.water < 0) st.total.push(sim.night.k);
    const o = P.obs;
    for (let i = 0; i < NB; i++) {
      const b = P.boats[i];
      if (b.state === 'lowering' && prev[i] !== 'lowering' && !(o.drop[i] > B.RATE.lowStation)) st.intoFalls.push(B.BOATS[i].id + '@' + sim.night.k);
      if (b.state === 'lowering' && b.low > prevLow[i] && o.kn > B.RATE.wayNone) st.fast.push(B.BOATS[i].id + '@' + sim.night.k);
      prev[i] = b.state; prevLow[i] = b.low;
    }
    if (rec) { for (const k of Object.keys(rec.cols)) rec.cols[k].push(o[k]); for (let i = 0; i < NB; i++) rec.drops.push(o.drop[i]); rec.K++; }
    if (opts.each) opts.each(sim);
  }
  if (twin) st.events = JSON.stringify(sim.events) === JSON.stringify(twin.events);
  if (rec) { for (const k of Object.keys(rec.cols)) rec[k] = Float64Array.from(rec.cols[k].map(Number)); rec.drop = Float64Array.from(rec.drops); delete rec.cols; delete rec.drops; }
  return { sim, twin, st, rec };
}
const limitsOk = (st) => !st.total.length && !st.intoFalls.length && !st.fast.length;
const limitsSay = (st) => (st.total.length ? 'count broken at steps ' + st.total.slice(0, 3).join(', ') + '; ' : '') + (st.intoFalls.length ? 'into the falls at the water: ' + st.intoFalls.slice(0, 3).join(', ') + '; ' : '') + (st.fast.length ? 'lowered above the limit: ' + st.fast.slice(0, 3).join(', ') : '');

// ---------------------------------------------------------------- 1. the 1912 watch, with the reader and without
const sp1912 = N.spec(1912);
const at = { 60: null, 105: null, 145: null };
const A = watch(sp1912, {
  twin: { auto: true }, rec: true,
  each: (sim) => {
    if (sim.night.tTouch < 0) return;
    const T = Tof(sim, sim.t), o = sim.people.obs;
    for (const k of Object.keys(at)) if (at[k] === null && T >= +k) at[k] = { T, drop: Float64Array.from(o.drop), list: o.list, trim: o.trim, kn: o.kn };
  },
});
const sim1912 = A.sim, P1912 = sim1912.people, tT = sim1912.night.tTouch;
row('MUST', 'nothing fed back: the 1912 watch on its orders, with the boats and without any reader, step for step', A.st.parted < 0 ? 'one fingerprint at all ' + A.st.steps + ' steps (' + N.fingerprint(sim1912) + '); events ' + (A.st.events ? 'the same' : 'DIFFER') : 'parted at step ' + A.st.parted,
  'the same fingerprint at every step, the same events', A.st.parted < 0 && A.st.events && N.fingerprint(sim1912) === N.fingerprint(A.twin));
row('MUST', 'every person is somewhere on the 1912 watch: aboard, in a boat or in the water, summing to ' + B.PEOPLE.aboard + ' at every step', A.st.total.length ? 'broken at ' + A.st.total.length + ' steps' : 'at all ' + A.st.steps + ' steps; at the end ' + P1912.count.aboard + ' aboard, ' + P1912.count.inBoats + ' in boats, ' + P1912.count.water + ' in the water',
  B.PEOPLE.aboard + ' [read: the Court\'s count]', !A.st.total.length);

// the record of what the reader saw replays it exactly (the calibration's premise)
const live1912 = strip(P1912), again1912 = strip(CAL.replay(A.rec, B.FIT));
row('MUST', 'what the reader saw, replayed through the reader alone (tools/calibrate_people.js), gives its state again', live1912 === again1912 ? 'the same state, to the bit' : 'DIFFERENT', 'equal: the fit is made on this replay', live1912 === again1912);

// ---------------------------------------------------------------- 2. a drawn night, with the reader and without
const sp11 = N.spec(11);
const D11 = watch(sp11, { twin: { auto: true }, until: (sim) => sim.night.tTouch >= 0 && Tof(sim, sim.t) >= 100 });
const r11 = B.readouts(D11.sim), s11 = N.summary(D11.sim);
row('MUST', 'nothing fed back on a drawn night (seed 11, the night\'s drill: ' + N.verdict(D11.sim).slice(0, 48) + '...), to ' + (N.over(D11.sim) ? 'her hand-over' : '100 min after the touch'), D11.st.parted < 0 ? 'one fingerprint at all ' + D11.st.steps + ' steps; ' + r11.boatsAway + ' boats away with ' + r11.inBoatsAway : 'parted at step ' + D11.st.parted,
  'the same fingerprint at every step, the same events', D11.st.parted < 0 && D11.st.events && s11.area > 0 && r11.boatsAway > 0);
row('MUST', '  ... and the count and the limits hold there', limitsOk(D11.st) ? 'at all ' + D11.st.steps + ' steps' : limitsSay(D11.st), 'no step broken', limitsOk(D11.st));

// ---------------------------------------------------------------- 3. a night with no damage: nothing happens
{
  const sc = N.scriptOf(Object.assign({}, sp1912.orders, { delay: 6.5 }));
  const Z = watch(sp1912, { create: { script: sc }, until: (sim) => sim.night.tClear >= 0 && sim.t >= sim.night.tClear + 40 * 60 });
  // the reader's own state, without what it last saw of the model (each boat's station height, and the boat's own with it)
  const own = (P) => JSON.stringify(Object.assign({}, P, { obs: undefined, boats: P.boats.map(b => Object.assign({}, b, { drop: undefined, h: undefined })) }));
  const s = N.summary(Z.sim), rest = own(Z.sim.people) === own(B.fresh());
  row('MUST', 'a night with no damage (1912\'s berg, the wheel over 6.5 s after the bells): nothing launched, the reader at rest', s.kind + ', ' + f(s.clearance, 0) + ' m off; ' + f((Z.sim.t - Z.sim.night.tClear) / 60, 0) + ' min after the ice: ' + (rest ? 'the reader\'s state is its first state' : 'the state MOVED: ' + JSON.stringify(Z.sim.people.count)),
    'no water, no order, every boat covered: the state as attached', s.kind === 'miss' && rest);
}

// ---------------------------------------------------------------- 4. orders: logged, refused with a reason, replayed
// what-if 1: the order to uncover at the touch instead of twenty minutes later. Around it, three orders that must be
// refused: before the touch, a second time, and a rule already in force; each is logged as given, and refused again on
// the replay.
let gave = 0;
const W1 = watch(sp1912, {
  before: (sim) => {
    const w = sim.night;
    if (gave === 0 && w.k === 5) { N.act(sim, 'boats:uncover', 'now'); gave = 1; }
    else if (gave === 1 && w.tTouch >= 0) { N.act(sim, 'boats:uncover', 'now'); gave = 2; }
    else if (gave === 2) { N.act(sim, 'boats:uncover', 'now'); gave = 3; }
    else if (gave === 3 && Tof(sim, sim.t) >= 5) { N.act(sim, 'boats:rule', 'first', 'starboard'); gave = 4; }
  },
});
const Pw1 = W1.sim.people, log1 = W1.sim.night.log, boatsLog = log1.filter(o => o.type.indexOf('boats:') === 0);
row('MUST', 'a boat order is an order of the watch: logged with its step, like the helm\'s', boatsLog.map(o => o.type + ' ' + o.value + (o.arg ? ' ' + o.arg : '') + ' @' + o.k).join('; '),
  'four orders in the log, at the steps they were given', boatsLog.length === 4 && boatsLog.every(o => o.k >= 0));
const refusedWhy = Pw1.refused.map(r => r.why);
row('MUST', 'an order that cannot be carried out is refused, and says why', Pw1.refused.length + ' refused: "' + refusedWhy.join('" | "') + '"',
  'three refused, each with a reason: before the touch; already given; already the rule', Pw1.refused.length === 3 && /not touched the ice/.test(refusedWhy[0]) && /already being uncovered/.test(refusedWhy[1]) && /already the rule/.test(refusedWhy[2]) && Pw1.orders.length === 1);
const RP = N.replay(ship, sp1912, log1, W1.sim.night.k);
const sameP = strip(RP.people) === strip(Pw1), sameFp = N.fingerprint(RP) === N.fingerprint(W1.sim);
row('MUST', 'the watch replays from its log to the same boats, the same numbers and the same fingerprint', 'step ' + RP.night.k + ': boats ' + (sameP ? 'the same' : 'DIFFER') + ', ' + RP.people.count.inBoatsAway + ' in ' + RP.people.count.boatsAway + ' boats away; fingerprint ' + N.fingerprint(RP) + ' (the watch ' + N.fingerprint(W1.sim) + ')',
  'equal, to the bit', sameP && sameFp && RP.people.refused.length === 3);
row('MUST', '  ... and the count and the limits hold on that night', limitsOk(W1.st) ? 'at all ' + W1.st.steps + ' steps' : limitsSay(W1.st), 'no step broken', limitsOk(W1.st));
// an address carries orders only if the boats vouch for them (site/parts/40_night_end.js asks valid())
const vs = [['boats:uncover', 'now', undefined, true], ['boats:rule', 'fill', 'both', true], ['boats:rule', 'only', 'port', true], ['boats:fill', 0.75, undefined, true],
  ['boats:uncover', 'later', undefined, false], ['boats:rule', 'sink', 'port', false], ['boats:rule', 'fill', 'aft', false], ['boats:fill', 0.42, undefined, false], ['boats:fill', '1', undefined, false], ['boats:uncover', 'now', 'x', false]];
const vBad = vs.filter(v => B.valid(v[0], v[1], v[2]) !== v[3]);
row('MUST', 'valid() vouches for the boats\' own orders and for nothing else', vBad.length ? 'wrong on ' + vBad.map(v => JSON.stringify(v)).join(' ') : vs.length + ' of ' + vs.length + ' as they should be', 'the orders the controls give, and no other', vBad.length === 0);

// ---------------------------------------------------------------- 5. the limits: the station, and way on
row('MUST', 'the model\'s limits on the 1912 watch: no boat put into the falls from a station within ' + B.RATE.lowStation + ' m of the sea, none lowered above ' + B.RATE.wayNone + ' knots', limitsOk(A.st) ? 'none, at all ' + A.st.steps + ' steps' : limitsSay(A.st), 'none', limitsOk(A.st));
{
  // the same night's observations with her speed through the water held at 6 knots, then at 4: the first lowers nothing
  // (the boats loaded wait at their davits until the sea takes them off, or she goes); the second lowers at half speed.
  // The reader alone, over the 1912 record.
  const held = (kn) => { const r = Object.assign({}, A.rec, { kn: new Float64Array(A.rec.K).fill(kn) }); return CAL.replay(r, B.FIT); };
  const p6 = held(6), p4 = held(4), away6 = p6.boats.filter(b => b.state === 'away').length;
  const heldLoaded = p6.boats.filter(b => (b.state === 'floated' || b.state === 'lost') && b.n > 0 && b.tLower < 0);
  const first = (P) => Math.min(...P.boats.filter(b => b.tAway >= 0).map(b => b.tAway));
  row('MUST', '  ... and with her speed held at 6 knots through the night (the reader alone over the 1912 record): nothing lowered', away6 + ' boats away, none ever in the falls; ' + heldLoaded.length + ' loaded and held at their davits until the sea took them off or she went (' + heldLoaded.reduce((a, b) => a + b.n, 0) + ' in them); ' + p6.water + ' in the water',
    'none away, none lowered: no lowering above ' + B.RATE.wayNone + ' knots [read: today\'s design limit]', away6 === 0 && p6.boats.every(b => b.tLower < 0) && heldLoaded.length > 0 && p6.count.total === B.PEOPLE.aboard);
  const fa = first(P1912), f4 = first(p4);
  row('CHECK', '  ... at 4 knots the boats go, lowered at half speed', 'the first away at T ' + f((f4 - tT) / 60) + ' (at the night\'s own speed T ' + f((fa - tT) / 60) + '); ' + p4.count.inBoatsAway + ' in ' + p4.count.boatsAway + ' boats away', 'later than on the night [bet: half speed from ' + B.RATE.wayFull + ' to ' + B.RATE.wayNone + ' knots]', f4 > fa);
}

// ---------------------------------------------------------------- 6. the fit: the 1912 launch record
const fit = CAL.score(A.rec, P1912), byId = {};
for (const r of fit.rows) byId[r.id] = r;
console.log('The 1912 watch, the boats against the record (Wormstedt, Fitch and Behe\'s times; Wormstedt and Fitch\'s numbers):');
console.log('  boat side  record T  model T  model-record  record n  model n');
for (const r of fit.rows) console.log('  ' + r.id.padEnd(4) + ' ' + r.side + '    ' + String(r.rec).padStart(7) + '  ' + (r.T === null ? '  never' : f(r.T).padStart(7)) + '  ' + (r.T === null ? '        -' : ((r.T >= r.rec ? '+' : '') + f(r.T - r.rec)).padStart(9)) + (r.T !== null && Math.abs(r.T - r.rec) <= 10 ? '     ' : '  OUT') + String(r.recN).padStart(9) + '  ' + String(r.n).padStart(7));
const inside = fit.rows.filter(r => r.T !== null && Math.abs(r.T - r.rec) <= 10);
row('CHECK', 'the fit, 1912: each of the eighteen boats lowered within ten minutes of the re-examined time', inside.length + ' of 18 inside' + (inside.length < 18 ? '; outside: ' + fit.rows.filter(r => !inside.includes(r)).map(r => r.id + ' ' + (r.T === null ? 'never' : (r.T >= r.rec ? '+' : '') + f(r.T - r.rec, 0) + ' min')).join(', ') : ''),
  '18 of 18 [read: the note 11.1; fitted: FIT ' + JSON.stringify(B.FIT) + ']', inside.length === 18);
row('CHECK', '  ... the first boat within five minutes', 'boat 7 at T ' + f(byId['7'].T) + ' (record ' + byId['7'].rec + ')', 'within 5 min', byId['7'].T !== null && Math.abs(byId['7'].T - byId['7'].rec) <= 5);
row('CHECK', '  ... the people in the eighteen', fit.n + ' (' + (fit.n >= CAL.RECORD_N ? '+' : '') + f(100 * (fit.n / CAL.RECORD_N - 1)) + ' %)', CAL.RECORD_N + ' within 10 % [read: Wormstedt and Fitch]', Math.abs(fit.n / CAL.RECORD_N - 1) <= 0.1);
{
  const ab = ['A', 'B'].map(id => { const b = P1912.boats[B.IDX[id]]; return id + ' ' + b.state + (b.tFloat >= 0 ? ' at T ' + f(Tof(sim1912, b.tFloat)) : '') + ' with ' + b.n; });
  const ok = ['A', 'B'].every(id => P1912.boats[B.IDX[id]].state === 'floated');
  row('CHECK', '  ... the two collapsibles on the roof float off as the deck goes under', ab.join('; ') + '; her end (the hand-over) at T ' + f(Tof(sim1912, sim1912.foundered ? sim1912.founderT : sim1912.night.onset.found.t)), 'both float off, at T 155 to 160 [read]', ok);
  const phase = (lo, hi) => { let n = 0, cap = 0; for (const r of fit.rows) if (r.T !== null && r.T >= lo && r.T < hi) { n += r.n; cap += B.BOATS[B.IDX[r.id]].cap; } return cap ? f(100 * n / cap, 0) + ' % (' + n + ' of ' + cap + ')' : 'none'; };
  row('CHECK', '  ... how full, by the hour (not fitted boat by boat)', 'T 60 to 95: ' + phase(55, 95) + '; T 95 to 122: ' + phase(95, 122) + '; T 122 to 150: ' + phase(122, 150), 'the record\'s 43 %, 76 %, 63 % [derived: the note 4.3]', true);
  const c = P1912.count;
  row('CHECK', '  ... the count when she founders', c.inBoatsAway + ' in ' + c.boatsAway + ' boats away, ' + c.emptyAway + ' places empty in them; ' + c.water + ' in the water; alive an hour later by the survival bet: about ' + f(B.aliveInWater(sim1912, 3600), 0),
    'about 712 saved, 1,490 lost [read: the note 1.3]; the survival constant is a bet (' + B.RATE.tauWater + ' min)', true);
}

// ---------------------------------------------------------------- 7. what was not fitted: the drops, the gap, her way
{
  const ids = ['7', '5', '3', '1', '8', '6', '4', '2'].map(id => B.IDX[id]);
  const m60 = ids.reduce((a, i) => a + at[60].drop[i], 0) / ids.length, lo60 = Math.min(...ids.map(i => at[60].drop[i])), hi60 = Math.max(...ids.map(i => at[60].drop[i]));
  row('CHECK', 'not fitted: the drop at the forward stations at T 60', f(m60) + ' m (' + f(lo60) + ' to ' + f(hi60) + '); trim ' + f(at[60].trim, 2) + ' deg', '18 to 20 m (the Court\'s 65 ft) [read: the note 11.2]', m60 >= 18 && m60 <= 20);
  const d14 = at[105].drop[B.IDX['14']];
  row('CHECK', 'not fitted: the drop at boat 14\'s station (port, after) at T 105', f(d14) + ' m; trim ' + f(at[105].trim, 2) + ', list ' + f(at[105].list, 2) + ' deg', 'about 21 m (69 ft, an estimate in the dark) [read]', d14 >= 19.5 && d14 <= 22.5);
  const dD = at[145].drop[B.IDX['D']], dC = at[145].drop[B.IDX['C']];
  row('CHECK', 'not fitted: the drop at D\'s station (port, forward) at T 145', f(dD) + ' m; list ' + f(at[145].list, 2) + ' deg', '3 to 4.5 m (10 to 15 ft) [read]', dD >= 3 && dD <= 4.5);
  row('CHECK', 'not fitted: the forward deck edges at T 145, starboard and port', f(dC) + ' m and ' + f(dD) + ' m', 'about 8 m and 3 m (26 and 10 ft, a list of about 10 deg) [read]', Math.abs(dC - 8) <= 1.5 && Math.abs(dD - 3) <= 1.5);
  const b10 = P1912.boats[B.IDX['10']];
  row('CHECK', 'the known gap: boat 10 at its lowering, the model\'s own list', 'gap ' + f(b10.gap, 2) + ' m at T ' + f(Tof(sim1912, b10.tLower)) + ', the model\'s list ' + f(Math.abs(b10.list), 1) + ' deg to ' + (b10.list < 0 ? 'port' : 'starboard'),
    'the record: 0.8 m (2.5 to 3 ft), the list about 10 deg to port (5 to 10 at T 130 to 145) [read]; the model\'s list is the README\'s known gap', Math.abs(b10.gap - 0.8) <= 0.1);
  const b7 = P1912.boats[B.IDX['7']];
  row('CHECK', 'her way through the water as the first boat went down', f(b7.kn, 2) + ' knots at T ' + f(Tof(sim1912, b7.tLower)), 'none: dead in the water by T 15 to 20 [read: the note section 6]', b7.kn <= 0.5);
}

// ---------------------------------------------------------------- 8. two what-ifs, as information
const W2 = watch(sp1912, { before: (sim) => { if (sim.night.tTouch >= 0 && !sim.people.orders.length && !sim.people.refused.length) N.act(sim, 'boats:rule', 'fill', 'both'); } });
{
  const say = (P, sim) => P.count.inBoatsAway + ' in ' + P.count.boatsAway + ' boats away, ' + P.count.emptyAway + ' places empty; first away T ' + f(Tof(sim, Math.min(...P.boats.filter(b => b.tAway >= 0).map(b => b.tAway)))) + ', last T ' + f(Tof(sim, Math.max(...P.boats.filter(b => b.tAway >= 0).map(b => b.tAway)))) + '; ' + P.count.water + ' in the water';
  row('CHECK', 'what-if, information: the order to uncover at the touch, not twenty minutes later', say(Pw1, W1.sim), 'the 1912 watch as modelled: ' + say(P1912, sim1912), true);
  row('CHECK', 'what-if, information: "fill her" on both sides from the first boat', say(W2.sim.people, W2.sim), 'the 1912 watch as modelled: ' + P1912.count.inBoatsAway + ' in boats away', true);
  row('MUST', '  ... and on that night the count and the limits hold', limitsOk(W2.st) ? 'at all ' + W2.st.steps + ' steps' : limitsSay(W2.st), 'no step broken', limitsOk(W2.st));
}

for (const [kind, what, value, ref, ok] of rows) console.log((kind === 'MUST' ? (ok ? 'PASS ' : 'FAIL ') : (ok ? 'in   ' : 'OUT  ')) + what.padEnd(108) + ' ' + String(value).padEnd(80) + ' ' + ref);
console.log('(' + Math.round((Date.now() - t0) / 1000) + ' s)');
console.log(fails ? '\nFAIL: ' + fails + ' MUST row(s)' : '\nPASS: every MUST row (' + rows.filter(r => r[0] === 'MUST').length + '); CHECK rows in range: ' + rows.filter(r => r[0] === 'CHECK' && r[4]).length + ' of ' + rows.filter(r => r[0] === 'CHECK').length);
process.exit(fails ? 1 : 0);
