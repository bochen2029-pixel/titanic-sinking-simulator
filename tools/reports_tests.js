// Reports to the bridge (core/readers/reports.js): the night as the bridge knew it, against the model and the record.
//   node tools/reports_tests.js          (several minutes: two nights to the end, others in part)
// MUST rows are invariants: nothing fed back; a report's content is the model's state at the fact's time, in words and
// feet; for the first minutes after a touch the bridge knows of no water; a report order is logged and the watch replays
// to the same feed; with no touch, nothing but the routine. CHECK rows are the record: the 1912 feed against the bridge
// note's script (docs/research/RESEARCH_the_night_on_the_bridge_v1_2026-11-17.md, 11.1), each row within five minutes
// (the brainstorm's test, step 3) or out; then the feed of two drawn nights, printed as information.
'use strict';
const crypto = require('crypto');
const C = require('../core/core.js');
const N = require('../core/night.js');
const RP = require('../core/readers/reports.js');
const ship = C.buildShip(), dt = C.DEFAULT_PARAMS.dt, FT = C.FT;
const rows = []; let fails = 0;
function row(kind, what, value, ref, ok) { rows.push([kind, what, value, ref, ok]); if (kind === 'MUST' && !ok) fails++; }
const f = (x, n) => (x === null || x === undefined ? 'n/a' : x.toFixed(n === undefined ? 1 : n));
const T = (sim, t) => (t - sim.night.tTouch) / 60;            // minutes after the touch
const clock = (sp, t) => { const s = ((sp.clock0 + t) % 86400 + 86400) % 86400, h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return (h % 12 || 12) + ':' + String(m).padStart(2, '0') + (h >= 12 ? ' pm' : ' am'); };
const TONS = /\btons?\b|\btonnes?\b|t\/min|\d\s*t\b|cubic|m3|m²|a minute/i;  // what the bridge never learned (and "a minute": a rate)
function hashState(h, sim) {                                    // the model's whole state after a step, for the comparisons
  const m = sim.mo, e = sim.enc;
  h.update(Buffer.from(new Float64Array([m.u, m.v, m.r, m.X, m.Y, m.psi, m.del, m.nP, m.nS, m.nC, sim.zO, sim.pitch, sim.roll, sim.inflow, e.berg.X, e.berg.Y, e.bow,
    sim.plant ? sim.plant.p : 0, sim.pumped, sim.openings.length]).buffer));
  h.update(Buffer.from(sim.vol.buffer));
}
const feedJSON = (sim) => JSON.stringify(RP.feed(sim));
// orders given between steps, as the page gives them: on the step count each names (the watch logs it there)
const orderAt = (sim, list) => { for (const o of list) if (sim.night.k === o.k) o.done = N.act(sim, o.type, o.value); };

// G12's switch (D98): a watch ends at its hand-over, by default the break's onset, her flag where she founders first;
// past it only the clock and the readers step, so every loop stops on N.over
const endOf = (sim) => (sim.foundered ? sim.founderT : (sim.night.onset && sim.night.onset.found ? sim.night.onset.found.t : -1));

// ------------------------------------------------------------------ 1. the 1912 watch, with the reader and without
const sp = N.spec(1912);
const A = N.create(ship, sp, { auto: true }), B = N.create(ship, sp, { auto: true, readers: false });
const hA = crypto.createHash('sha256'), hB = crypto.createHash('sha256');
const MAXK = 4 * 14400, sound = new Float64Array(MAXK * 16), toG = new Float64Array(MAXK), fpB = new Uint32Array(MAXK);
const knowAt = [], F0 = {};
let parted = -1, water9 = null, fc80 = null, Acopy = null, copyAt = -1, copyFp = null;
const t0 = Date.now();
while (!N.over(A) && A.night.k < MAXK - 1) {
  N.step(A); N.step(B);
  hashState(hA, A); hashState(hB, B);
  const k = A.night.k;
  fpB[k] = B.night.hash >>> 0;
  if (parted < 0 && (A.night.hash !== B.night.hash || N.over(A) !== N.over(B))) parted = k;
  for (let z = 0; z < 16; z++) { let d = 0; for (let sd = 0; sd < 2; sd++) { const n = C.nodeIndex(z, sd, 0); if (A.vol[n] > 1e-6) d = Math.max(d, A.level[n] - A.zmin[n]); } sound[k * 16 + z] = d / FT; }
  C.poseFrame(A, A.zO, A.pitch, A.roll, F0);
  { let h = -Infinity; for (let sd = 0; sd < 2; sd++) { const n = C.nodeIndex(3, sd, 0); if (A.vol[n] > 1e-6 && A.level[n] > h) h = A.level[n]; } const x = ship.zones[3].xm; toG[k] = (C.worldZ(F0, x, 0, C.deckZ('G', x)) - h) / FT; }
  if (A.night.tTouch >= 0) {
    const m = T(A, A.t);
    if (knowAt.length < 12 && m >= knowAt.length) knowAt.push({ m, K: RP.knowledge(A), water: C.readouts(A).waterT });
    if (water9 === null && m >= 9) water9 = C.readouts(A).waterT;
    if (fc80 === null && m >= 80) fc80 = C.worldZ(F0, 126, 0, C.zTopAt(126)) / FT;     // the forecastle head (the core's mark)
    // a copy of the whole watch made with structuredClone while the builder's man's forecast runs (T 15): its state is
    // plain data, so the copy steps on as the watch does (the pumps lane's forecast copies a watch this way)
    if (!Acopy && m >= 15) { Acopy = structuredClone(A); copyAt = A.night.k; }
    else if (Acopy && !copyFp) { N.step(Acopy); if (m >= 30) copyFp = { fp: N.fingerprint(Acopy), same: N.fingerprint(Acopy) === N.fingerprint(A) && feedJSON(Acopy) === feedJSON(A), k: A.night.k, n: Acopy.reports.feed.length, shadow: !!Acopy.reports.estimate }; }
  }
}
const msA = Date.now() - t0, dA = hA.digest('hex'), dB = hB.digest('hex');
const evSame = A.events.length === B.events.length && A.events.every((e, i) => e.label === B.events[i].label && e.t === B.events[i].t);
row('MUST', 'nothing fed back: the 1912 watch on its reconstructed orders, with the reader and without, to the end', 'step ' + A.night.k + ': ' + N.fingerprint(A) + ' / ' + N.fingerprint(B) + '; parted ' + (parted < 0 ? 'never' : 'at step ' + parted) + '; state ' + dA.slice(0, 12) + ' / ' + dB.slice(0, 12),
  'the same fingerprint every step, the same state hash; her end (the hand-over) ' + f(T(A, endOf(A)), 2) + ' min after the touch', parted < 0 && dA === dB && N.over(A) && N.over(B) && endOf(A) === endOf(B));
row('MUST', '  ... and it pushed nothing into sim.events; its feed is its own', A.events.length + ' events / ' + B.events.length + '; feed ' + A.reports.feed.length + ' lines', 'the same events, label for label and time for time', evSame && A.reports.feed.length > 10);
row('MUST', 'sim.reports is plain data: the watch copied with structuredClone at T 15 (the forecast running) steps on to the same feed and fingerprint', copyFp ? 'copied at step ' + copyAt + '; at step ' + copyFp.k + ': ' + copyFp.fp + ', ' + copyFp.n + ' lines, the estimate ' + (copyFp.shadow ? 'given' : 'not given') + ': ' + (copyFp.same ? 'the same' : 'DIFFERENT') : 'no copy', 'the same as the watch itself at T 30', !!copyFp && copyFp.same && copyFp.shadow);

// ------------------------------------------------------------------ 2. content at the fact's time; words and feet only
const feedA = A.reports.feed, tT = A.night.tTouch;
const kOf = (t) => Math.round(t / dt);
const carp = feedA.find(e => e.rule === 'holds'), mailLook = feedA.find(e => e.rule === 'officer' && e.data && 'toG' in e.data), eng = feedA.find(e => e.rule === 'engineer' && e.ch === 'runner');
const checks = [];
if (carp) { const kf = kOf(carp.tFact), ka = kOf(carp.t); checks.push(['the carpenter\'s soundings (' + carp.data.wells.map(w => C.ZONES[w.k].short).join(' ') + ')', carp.data.wells.every(w => Math.abs(w.ft - sound[kf * 16 + w.k]) < 1e-9), 'No. 1 hold ' + f(carp.data.wells[1].ft, 2) + ' ft at the fact (T ' + f(T(A, carp.tFact), 1) + '), ' + f(sound[ka * 16 + 1], 2) + ' ft when he arrives (T ' + f(T(A, carp.t), 1) + ')']); }
if (mailLook) { const kf = kOf(mailLook.tFact), ka = kOf(mailLook.t); checks.push(['the officer\'s look at the mail room (feet below G deck)', Math.abs(mailLook.data.toG - toG[kf]) < 1e-9, f(mailLook.data.toG, 2) + ' ft below G deck when he saw it (T ' + f(T(A, mailLook.tFact), 1) + '), ' + f(toG[ka], 2) + ' when he reports (T ' + f(T(A, mailLook.t), 1) + ')']); }
if (eng) { const kf = kOf(eng.tFact), ka = kOf(eng.t); checks.push(['the chief engineer\'s answer (boiler rooms 6 and 5)', eng.data.rooms.every(r => Math.abs(r.ft - sound[kf * 16 + r.k]) < 1e-9), 'boiler room 5 ' + f(eng.data.rooms[1].ft, 2) + ' ft at the fact (T ' + f(T(A, eng.tFact), 1) + '), ' + f(sound[ka * 16 + 5], 2) + ' ft at the answer (T ' + f(T(A, eng.t), 1) + ')']); }
row('MUST', 'a report\'s content is the model\'s state at the fact\'s time, not the arrival\'s: three reports against the state recorded at their steps', checks.map(c => c[0] + ': ' + (c[1] ? 'equal' : 'DIFFERENT')).join('; '), checks.map(c => c[2]).join('; '), checks.length === 3 && checks.every(c => c[1]));

// ------------------------------------------------------------------ 3. the first minutes; an early look finds nothing
{
  const before = knowAt.filter(s => s.m < 10), known = before.map(s => s.K.zones.filter(z => z.state === 'water' || z.state === 'lost').length);
  const wetLine = (e) => (e.rule === 'holds' && /^Making water/.test(e.words)) || e.rule === 'mail' || e.rule === 'steward' || e.rule === 'forepeak' || (e.rule === 'engineer' && !/dry\.$/.test(e.words)) || (e.rule === 'officer' && /^Water/.test(e.words));
  const firstWater = feedA.find(wetLine);
  row('MUST', 'for the first ten minutes after the touch the bridge knows of no water (the rule the 1912 night shows)', 'compartments known wet at T 0 to 9: ' + known.join(' ') + '; the first report of water at T ' + f(firstWater ? T(A, firstWater.t) : null, 1) + ' (' + (firstWater ? firstWater.who.toLowerCase() : 'none') + '); the model had ' + Math.round(water9).toLocaleString('en-US') + ' t aboard at T 9',
    'none known before T 10 (note 11.1: "no report of water for the first ten minutes")', known.length >= 10 && known.every(n => n === 0) && firstWater && T(A, firstWater.t) >= 10);
  const look = feedA.find(e => e.rule === 'officer'), kf = look ? kOf(look.tFact) : 0;
  row('MUST', '  ... and the officer below at once (his own, as Boxhall) reports no damage: the water was under the decks he walked', look ? 'T ' + f(T(A, look.t), 1) + ': "' + look.words + '"; at his visit (T ' + f(T(A, look.tFact), 1) + ') the holds had ' + [1, 2, 3].map(z => f(sound[kf * 16 + z], 0)).join(', ') + ' ft below F deck' : 'no look',
    'no damage, while water stood in holds 1 to 3 below F deck', !!look && /^No damage/.test(look.words) && [1, 2, 3].some(z => sound[kf * 16 + z] > 3));
}

// ------------------------------------------------------------------ 4. orders: logged, refused when an officer is out, replayed
const Cw = N.create(ship, sp, { auto: true });                   // the same 1912 watch, with report orders (B has its touch)
const ORD = [{ min: 2, type: 'report:look', value: 'mailroom' }, { min: 2.5, type: 'report:look', value: 'mailroom' }, { min: 30, type: 'report:sound', value: 'wells' }, { min: 40, type: 'report:ask', value: 'engine room' }];
for (const o of ORD) o.k = Math.round((B.night.tTouch + o.min * 60) / dt);
const kEnd = Math.round((B.night.tTouch + 60 * 60) / dt);
let partedC = -1;
while (Cw.night.k < kEnd) { orderAt(Cw, ORD); N.step(Cw); if (partedC < 0 && (Cw.night.hash >>> 0) !== fpB[Cw.night.k]) partedC = Cw.night.k; }
const logR = Cw.night.log.filter(o => /^report:/.test(o.type));
row('MUST', 'report orders go into the watch\'s log at their steps (the second look while the first is out is refused, and logged)', logR.map(o => o.type.slice(7) + ':' + o.value + '@' + o.k).join(' ') + '; done ' + ORD.map(o => o.done).join(','), ORD.map(o => o.type.slice(7) + '@' + o.k).join(' ') + '; true,false,true,true',
  logR.length === 4 && logR.every((o, i) => o.k === ORD[i].k && o.type === ORD[i].type && o.value === ORD[i].value) && ORD.map(o => o.done).join(',') === 'true,false,true,true');
row('MUST', '  ... and they change nothing in the model: the watch with them has the fingerprint of the watch without the reader, step for step', 'to step ' + Cw.night.k + ': ' + N.fingerprint(Cw) + '; parted ' + (partedC < 0 ? 'never' : 'at ' + partedC), (fpB[Cw.night.k] >>> 0).toString(16).padStart(8, '0') + ' (the 1912 watch, no reader)', partedC < 0);
const early = Cw.reports.feed.find(e => e.rule === 'officer' && e.data && 'toG' in e.data);
row('MUST', '  ... and an officer sent to the mail room at T 2, before the water reached it, finds it dry', early ? 'T ' + f(T(Cw, early.t), 1) + ': "' + early.words + '"; No. 3 hold had ' + f(sound[kOf(early.tFact) * 16 + 3], 1) + ' ft in its well, ' + f(toG[kOf(early.tFact)] - (C.G.deck.G - C.G.deck.orlop) / FT, 1) + ' ft below the orlop deck' : 'none',
  '"The mail room is dry." (PARTS.mailroom: there at +3.5 min, back at +7)', !!early && early.words === 'The mail room is dry.' && Math.abs(early.t - (ORD[0].k * dt + 7 * 60)) < 1e-6);
const Dw = N.replay(ship, sp, Cw.night.log, Cw.night.k);
const sameFeed = feedJSON(Cw) === feedJSON(Dw), sameDraws = JSON.stringify(Cw.reports.draws) === JSON.stringify(Dw.reports.draws), sameKnow = JSON.stringify(RP.knowledge(Cw)) === JSON.stringify(RP.knowledge(Dw));
row('MUST', 'the watch replays from its log to the same feed, word for word, and the same fingerprint (with its draws: probabilities in the rules)', Dw.reports.feed.length + ' lines ' + (sameFeed ? 'equal' : 'DIFFERENT') + '; ' + Cw.reports.draws.length + ' draws ' + (sameDraws ? 'equal' : 'DIFFERENT') + '; knowledge ' + (sameKnow ? 'equal' : 'DIFFERENT') + '; ' + N.fingerprint(Dw) + ' / ' + N.fingerprint(Cw),
  'equal; the 1912 night\'s draws include the forepeak\'s relay (p 0.5) and the chief engineer\'s calls (p 0.5)', sameFeed && sameDraws && sameKnow && N.fingerprint(Dw) === N.fingerprint(Cw) && Cw.reports.draws.length >= 3);
const okValid = RP.valid('report:look', 'forward') && RP.valid('report:look', 'aft') && RP.valid('report:sound', 'wells') && RP.valid('report:ask', 'engine room')
  && !RP.valid('report:look', 'bridge') && !RP.valid('report:look', 'toString') && !RP.valid('report:sound', 1) && !RP.valid('report:ask', 'engine room', true) && !RP.valid('helm', 0) && !RP.valid('report:fire', 'all');
const owner = N.READERS.find(r => r.orders && r.orders['report:look']);
row('MUST', 'valid(type, value, arg) vouches for its own orders with their values, and for nothing else', okValid ? 'look forward/aft, sound wells, ask engine room: yes; a part not on board, a number, an arg, helm, an unknown type: no' : 'WRONG', 'plain checks (site/parts/40_night_end.js refuses a log nobody vouches for)', okValid && !!owner && owner.valid === RP.valid);

// ------------------------------------------------------------------ 5. no touch: nothing but the routine
{
  const miss = N.create(ship, sp, { script: [{ when: 'bells', after: 6.5, type: 'helm', value: -40 }] });
  while (miss.t < 100 * 60) N.step(miss);
  const s = N.summary(miss), kinds = [...new Set(miss.reports.feed.map(e => e.kind))], K = RP.knowledge(miss);
  const d1 = N.create(ship, N.spec(1), {}); while (d1.t < 70 * 60) N.step(d1);
  const s1 = N.summary(d1), k1 = [...new Set(d1.reports.feed.map(e => e.kind))];
  row('MUST', 'a night with no touch has no reports but the routine\'s: the 1912 berg cleared (hard over 6.5 s after the bells), and night 1 with no order', s.kind + ' ' + f(s.clearance, 0) + ' m: ' + miss.reports.feed.length + ' lines, ' + kinds.join(',') + ' ("' + (miss.reports.feed[0] || {}).words + '"); night 1: ' + s1.kind + ', ' + d1.reports.feed.length + ' lines, ' + k1.join(','),
    'miss; routine lines only (bells); every compartment unknown', s.kind === 'miss' && s1.kind === 'miss' && miss.reports.feed.length >= 3 && kinds.join() === 'routine' && k1.join() === 'routine' && K.zones.every(z => z.state === 'unknown') && !miss.reports.estimate);
}

// ------------------------------------------------------------------ 6. a drawn night holed aft of the bow (9), with orders; its replay
const sp9 = N.spec(9), G = N.create(ship, sp9, {}), G0 = N.create(ship, sp9, { readers: false });
let partedG = -1;
const ORD9 = [];
while (G.night.tTouch < 0 || T(G, G.t) < 120) {
  if (G.night.tTouch >= 0 && !ORD9.length) for (const [min, type, value] of [[3, 'report:look', 'boilers'], [20, 'report:look', 'engines'], [25, 'report:sound', 'wells']]) ORD9.push({ k: Math.round((G.night.tTouch + min * 60) / dt), type, value });
  orderAt(G, ORD9);
  N.step(G); N.step(G0);
  if (partedG < 0 && G.night.hash !== G0.night.hash) partedG = G.night.k;
  if (N.over(G)) break;
}
const G2 = N.replay(ship, sp9, G.night.log, G.night.k);
row('MUST', 'so has a drawn night: night 9 (holed in boiler rooms 6 and 5) with three report orders, against no reader, step for step; and it replays to the same feed', 'step ' + G.night.k + ': ' + N.fingerprint(G) + ' / ' + N.fingerprint(G0) + ', parted ' + (partedG < 0 ? 'never' : 'at ' + partedG) + '; replay ' + (feedJSON(G) === feedJSON(G2) ? 'the same ' + G2.reports.feed.length + ' lines' : 'DIFFERENT') + ', ' + G.reports.draws.length + ' draws',
  'equal fingerprints; the same feed', partedG < 0 && feedJSON(G) === feedJSON(G2) && N.fingerprint(G2) === N.fingerprint(G) && G.night.log.filter(o => /^report:/.test(o.type)).length === 3);

// ------------------------------------------------------------------ 7. a stem strike (night 16)
const sp16 = N.spec(16), H = N.create(ship, sp16, {});
while (H.night.tTouch < 0 || T(H, H.t) < 120) { N.step(H); if (N.over(H)) break; }
const allFeeds = [A, Cw, Dw, G, G2, H].map(s => s.reports.feed).flat();
const heavy = allFeeds.filter(e => TONS.test(e.words));
row('MUST', 'no report carries tons or tons a minute: words and feet only (every line of every night here)', allFeeds.length + ' lines; ' + (heavy.length ? heavy.length + ' with tons: "' + heavy[0].words + '"' : 'none with tons, tonnes, t/min or a rate'), 'none', heavy.length === 0);

// ------------------------------------------------------------------ CHECK: the 1912 feed against the note's script (11.1)
const first = (fn) => feedA.find(fn) || null;
const m = (e) => e ? T(A, e.t) : null;
const SCRIPT = [
  { t: -0.5, rec: 'Fleet to Moody: three bells, "iceberg right ahead"', brain: false, model: () => ({ min: (A.night.tBells - tT) / 60, words: 'the watch\'s own bells (core/night.js): not a line of this reader' }) },
  { t: 0, rec: 'a tremble and a grinding along the starboard side', model: () => first(e => e.rule === 'touch') },
  { t: 7, rec: 'the commutator: 5 degrees list to starboard', brain: true, value: (e) => !!e && /5 degrees to starboard/.test(e.words), gap: 'her list is a known gap (README): the model\'s is to port, a degree or two', model: () => first(e => e.rule === 'commutator') },
  { t: 9, rec: 'Boxhall: no damage seen forward down to F deck', brain: true, model: () => first(e => e.rule === 'officer') },
  { t: 12, rec: 'the carpenter: making water fast (about 7 ft in the forward wells)', brain: true, model: () => first(e => e.rule === 'holds') },
  { t: 13, rec: 'the mail clerk: the mail hold is filling rapidly', brain: true, model: () => first(e => e.rule === 'mail') },
  { t: 16, rec: 'the chief engineer, through Olliver: an answer (the request unknown)', model: () => first(e => e.rule === 'engineer' && e.ch === 'runner') },
  { t: 20, rec: 'Boxhall: mail room water within two feet of G deck, rising fast', brain: true, model: () => first(e => e.rule === 'officer' && e.data && 'toG' in e.data) },
  { t: 20, rec: 'eight bells; the lookouts relieved', brain: true, model: () => first(e => e.t > tT && /^Eight bells/.test(e.words)) },
  { t: 25, rec: 'Andrews: an hour to an hour and a half', brain: true, model: () => first(e => e.rule === 'designer') },
  { t: 35, rec: 'the chief engineer, through Ismay: seriously damaged, the pumps should keep her afloat', model: () => feedA.filter(e => e.rule === 'engineer').sort((a, b) => Math.abs(m(a) - 35) - Math.abs(m(b) - 35))[0] || null },
  { t: 43, rec: 'the wheel relieved, 23 minutes late', model: () => first(e => e.t > tT && /wheel are relieved/.test(e.words)) },
  { t: 75, rec: 'Wilde: all passengers to the starboard side (a list to port)', model: () => first(e => e.rule === 'commutator' && /to port/.test(e.words)) },
  { t: 80, rec: 'Olliver: down 15 to 20 ft at the bows', brain: true, model: () => first(e => e.rule === 'eye' && e.data && e.data.cat === 2),
    note: () => 'the note reads it as the bows down 15 to 20 ft: this rule\'s second step; read as the forecastle head\'s height, the model\'s is ' + f(fc80, 0) + ' ft above the water at T 80' },
  { t: 125, rec: 'the fore deck under water by 1:45 (the Report; the row\'s t 105 is Rowe\'s last rocket)', model: () => first(e => e.rule === 'eye' && e.data && e.data.mark === 'well') },
  { t: 150, rec: 'water over the bridge; the dive', brain: true, model: () => first(e => /over the bridge/.test(e.words)) },
  { t: 160, rec: 'she disappears', model: () => ({ min: T(A, endOf(A)), words: 'the watch\'s own end: her hand-over at the break\'s onset (G12; not a line: the bridge is under)' }) },
];
const table = [];
let brainIn = 0, brainN = 0;
for (const r of SCRIPT) {
  const e = r.model(), min = e ? (e.min !== undefined ? e.min : m(e)) : null, d = min === null ? null : min - r.t;
  const inTime = d !== null && Math.abs(d) <= 5, ok = inTime && (!r.value || r.value(e));
  if (r.brain) { brainN++; if (ok) brainIn++; }
  table.push([r.t, min, d, ok, r.rec, e ? e.words : 'none', (r.gap && !ok ? r.gap : '') + (r.note ? (r.gap ? '; ' : '') + r.note() : ''), r.brain]);
  row('CHECK', '1912, T ' + r.t + ': ' + r.rec, min === null ? 'not in the feed' : 'T ' + f(min, 1) + ' (' + (d >= 0 ? '+' : '') + f(d, 1) + '): "' + (e.words || '') + '"', 'within 5 min' + (r.value ? ', and its reading' : '') + (r.gap ? '; ' + r.gap : ''), ok);
}
const est = A.reports.estimate;
row('CHECK', 'the builder\'s man\'s rule on the 1912 watch: the forecast from T ' + f(T(A, est.tFact), 1) + ' leaves her ' + f(est.forecast, 1) + ' min when he speaks; ' + RP.DESIGNER.bias + ' of it is ' + f(est.biased, 1), '"' + est.words + '"', 'the bias, fitted to this night: 75 / ' + f(est.forecast, 1) + ' = ' + f(75 / est.forecast, 3) + ' (the constant ' + RP.DESIGNER.bias + ')', /from an hour to an hour and a half/.test(est.words));

// ------------------------------------------------------------------ G7 (NH15): the telephones' current
// a what-if: the 1912 watch, its dynamo flat flooded by hand at T 30 (the main sets stop, the emergency sets run on); the
// telephones go on their stand-by battery at once, and die when it is spent (its life set to 1 min here, then set back)
{
  const sim = N.create(ship, N.spec(1912), { auto: true }), keep = RP.PHONE.batteryHours;
  while (sim.night.tTouch < 0 || T(sim, sim.t) < 30) N.step(sim);
  const before = Object.assign({}, sim.reports.phone);
  sim.plant.el = true;
  while (!N.over(sim) && sim.plant.events.mainDark === undefined && sim.plant.events.dark === undefined) N.step(sim);
  const t0 = sim.t; N.step(sim);
  const onBattery = Object.assign({}, sim.reports.phone);
  RP.PHONE.batteryHours = 1 / 60;
  try { while (!N.over(sim) && sim.t < t0 + 90) N.step(sim); } finally { RP.PHONE.batteryHours = keep; }
  const spent = Object.assign({}, sim.reports.phone);
  row('MUST', 'G7: the telephones on the lighting circuit; on their stand-by battery the moment the main sets stop (the dynamo flat flooded by hand at T 30); dead once it is spent (its life set to 1 min here)',
    [before, onBattery, spent].map(s => (s.current ? 'current' : 'dead') + ' (' + s.why + ')').join('; '), '[read] the British Report: "a stand-by battery that switched in by itself"; its 6 h a bet',
    before.current && /lighting circuit/.test(before.why) && onBattery.current && /battery/.test(onBattery.why) && !spent.current && /spent/.test(spent.why));
}

// G27 (docs/DESIGN_G27_the_brush_on_a_watch_v1_2026-11-24.md, section 4): a night holed by hand before any touch (the
// brush on a watch). The bridge's routine starts at the first water a man finds, the first report is that room's, and
// the touch after it is felt once and restarts nothing. (The 1912 watch above meets the ice first: its rows hold its
// state to the bit.)
let holed = null;
{
  const bx = C.zoneBounds(), K = 7, x = +(0.5 * (bx[K] + bx[K + 1])).toFixed(2);   // boiler room 3, starboard, 4 m up
  const run = (opts, until) => {
    const W = N.create(ship, sp, opts);
    let given = false;
    while (!N.over(W) && W.t < 3 * 3600 && !until(W)) {
      if (!given && W.night.k === 40) { given = true; N.hole(W, x, 4.0, -1, 0.5); }
      N.step(W);
    }
    return W;
  };
  // no ice: the helm put over 5 s after the bells clears the berg (the miss window, tools/night_tests.js section 8), so
  // the hole is the night's only damage and nothing is felt. The room's report comes by its route (the stokehold to the
  // engineers, the engineers to the bridge), minutes after the water is found
  const Q = run({ script: N.scriptOf({ delay: 5 }) }, (W) => W.t > 60 * 60);
  holed = Q;
  const RQ = Q.reports, belowQ = RQ.feed.find(e => e.ch !== 'felt'), feltQ = RQ.feed.filter(e => e.rule === 'touch'), knowQ = RP.knowledge(Q).zones[K];
  row('MUST', 'G27: a night that clears the ice, holed by hand 10 s into the watch (boiler room 3, starboard, 0.5 m2): the bridge\'s routine starts at the first water found, and the bridge learns of that room\'s water by the reports',
    'no touch (' + f(Q.night.tTouch, 0) + '); started by the water in ' + (RQ.byWater === undefined ? 'nothing' : 'room ' + RQ.byWater) + ' at ' + f(RQ.tTouch, 1) + ' s; first from below at ' + (belowQ ? f(belowQ.t / 60, 1) + ' min, "' + belowQ.who + ': ' + belowQ.words + '"' : 'none') + '; the bridge knows ' + knowQ.short + ' ' + knowQ.state + ' at ' + f(Q.t / 60, 0) + ' min; ' + RQ.feed.length + ' reports',
    'room 7; ' + knowQ.short + ' known wet; nothing felt', RQ.byWater === K && Q.night.tTouch < 0 && RQ.tTouch >= 0 && !!belowQ && belowQ.t >= RQ.tTouch && knowQ.state !== 'unknown' && knowQ.state !== 'dry' && feltQ.length === 0);
  // the 1912 night holed the same way: the touch after the water is felt once, and restarts nothing
  const W = run({ auto: true }, (W) => W.night.tTouch >= 0 && W.t > W.night.tTouch + 120);
  const R = W.reports, felt = R.feed.filter(e => e.rule === 'touch');
  row('MUST', '  ... and the touch after it is felt on the bridge once, and restarts nothing (the routine keeps the water\'s start)',
    felt.length + ' felt at ' + felt.map(e => f(e.t, 1) + ' s').join(', ') + '; the routine from ' + f(R.tTouch, 1) + ' s', 'one, at the touch; the water\'s start kept',
    felt.length === 1 && felt[0].t === W.night.tTouch && R.felt === true && R.tTouch < W.night.tTouch);
}

// ------------------------------------------------------------------ the report
for (const [kind, what, value, ref, ok] of rows) console.log((kind === 'MUST' ? (ok ? 'PASS ' : 'FAIL ') : (ok ? 'in   ' : 'OUT  ')) + what.padEnd(118) + ' ' + String(value).padEnd(70) + ' ' + ref);
console.log('\nTHE 1912 FEED AGAINST THE BRIDGE NOTE\'S SCRIPT (11.1): minutes after the touch; * = the brainstorm\'s test rows, ' + brainIn + ' of ' + brainN + ' within five minutes');
console.log('  script   model     diff   ' + 'the record'.padEnd(78) + 'the model\'s line');
for (const [t, min, d, ok, rec, words, note, brain] of table) console.log((brain ? '* ' : '  ') + ('T ' + t).padEnd(8) + (min === null ? '   -   ' : ('T ' + f(min, 1)).padEnd(9)) + (d === null ? '   ' : ((d >= 0 ? '+' : '') + f(d, 1)).padStart(6)) + (ok ? ' in  ' : ' OUT ') + rec.padEnd(78) + words + (note ? '   [' + note + ']' : ''));
const show = (title, sim, spx) => {
  console.log('\n' + title);
  for (const e of sim.reports.feed) console.log(('T ' + f(T(sim, e.t), 1)).padStart(9) + '  ' + clock(spx, e.t).padStart(8) + '  ' + (e.who + ', ' + e.by).padEnd(54) + e.words + (e.tFact !== e.t ? '   (seen T ' + f(T(sim, e.tFact), 1) + ')' : ''));
  const K = RP.knowledge(sim);
  console.log('  what the bridge knows at T ' + f(T(sim, sim.t), 0) + ': ' + K.zones.map(z => z.short + ' ' + z.state).join(', ') + '; the commutator ' + K.list.words + '; ' + K.trim.words + (K.estimate ? '; ' + K.estimate.words : ''));
};
show('THE FEED, 1912 (the reconstructed orders; her end, the hand-over, T ' + f(T(A, endOf(A)), 1) + ')', A, sp);
show('THE FEED, NIGHT 9: holed in boiler rooms 6 and 5, aft of the bow, no order to the ship; three report orders (' + N.verdict(G) + ')', G, sp9);
show('THE FEED, NIGHT 16: a stem strike, no order (' + N.verdict(H) + ')', H, sp16);
show('THE FEED, G27: a night that clears the ice, holed by hand in boiler room 3 at 10 s, to an hour (T counts from the start: no touch)', holed, sp);
console.log('\n(' + Math.round((Date.now() - t0) / 1000) + ' s; the 1912 pair ' + Math.round(msA / 1000) + ' s)');
console.log(fails ? '\nFAIL: ' + fails + ' MUST row(s)' : '\nPASS: every MUST row (' + rows.filter(r => r[0] === 'MUST').length + '); CHECK rows in range: ' + rows.filter(r => r[0] === 'CHECK' && r[4]).length + ' of ' + rows.filter(r => r[0] === 'CHECK').length);
process.exit(fails ? 1 : 0);
