// U3, her smoke and steam (docs/BRAINSTORM_titanic_in_unreal_v1_2026-11-20.md, section 5: "Smoke, steam, the roar from her
// escape pipes: Niagara, fed by the plant's fires and blow-off"), headless: when they come and go, from the recorded night.
//   node tools/u3_smoke.js           -> out/u3_smoke.json (not tracked), and the proof's rows (about half a minute)
// What drives them is the plant's (core/systems.js), recorded every step (channels.plant): gen, the steam raised (a
// share of full firing: coal burning, the smoke's cause); fires[i], each boiler room's (i = 0 boiler room 6, forward, to 5
// boiler room 1); blow, the steam blown off at the safety valves (the roar). The viewer [appearance] lets smoke leave
// the three working funnels' tops always (topsides.derived.smoke) and jets steam from the escape pipes'
// mouths (topsides.derived.steam) while blow > 0.02, 1 + floor(3 min(1, blow)) jets a pipe a half second.
// MUST rows: the blow-off's first rise past the plant's event threshold falls on the record's own plant:blowoff event,
// and the stokers' banking on plant:banked; no room's fires ever rise again (the plant's rule: water, the rakes or the
// coal put them out for good); a room flooded (plant:flood<i>) has its fires out within the plant's quench time after.
// CHECK rows: the timeline.
'use strict';
const fs = require('fs');
const Sys = require('../core/systems.js');
const XS = require('./export_ship.js');
const RN = require('./record_night.js');
const J = require('./export_json.js');
const outFile = require('./outdir');

const rows = []; let fails = 0;
function row(kind, what, value, ref, ok) { rows.push([kind, what, value, ref, ok]); if (!ok && kind === 'MUST') fails++; }
const f = (x, n) => (x === null || x === undefined || Number.isNaN(x) ? 'n/a' : (+x).toFixed(n === undefined ? 2 : n));
const PL = Sys.PLANT, JET = 0.02;

try {
  const ship = JSON.parse(XS.exportShip().text), rec = JSON.parse(RN.record({}).text), K = rec.constants, P = rec.channels.plant, n = rec.clock.n, k0 = rec.clock.k0;
  const ev = (id) => rec.events.find(e => e.id === id), T = (k) => (k === null || k === undefined ? 'never' : 'T ' + f((k * K.dt - rec.end.summary.tTouch) / 60, 1));
  // ---- the steam at the escape pipes: the viewer's intervals, and the plant's event
  const jets = []; let on = null, peak = 0;
  for (let i = 0; i < n; i++) {
    const b = P.blow[i];
    if (b > JET) { if (on === null) { on = i; peak = 0; } if (b > peak) peak = b; }
    else if (on !== null) { jets.push({ from: k0 + on, to: k0 + i, peak }); on = null; }
  }
  if (on !== null) jets.push({ from: k0 + on, to: null, peak });
  // a threshold crossing read off the record's channel, written at 4 decimals: it lies between the first step whose
  // written value reaches the threshold within half a unit (lo) and the first step clearly past it (hi)
  const H = 0.5e-4 + 1e-12;
  const crossing = (s, T, up) => {
    let lo = null, hi = null;
    for (let i = 0; i < n && hi === null; i++) {
      if (lo === null && (up ? s[i] >= T - H : s[i] <= T + H)) lo = k0 + i;
      if (up ? s[i] > T + H : s[i] < T - H) hi = k0 + i;
    }
    return { lo, hi };
  };
  const inBand = (c, e) => (e ? c.lo !== null && e.k >= c.lo && e.k <= (c.hi === null ? Infinity : c.hi) : c.hi === null);
  const blowEv = ev('plant:blowoff'), cb = crossing(P.blow, PL.blowEvent, true);
  row('MUST', 'the steam\'s first blow past the plant\'s threshold (' + PL.blowEvent + ') falls on the record\'s own event plant:blowoff', 'the record\'s channel crosses it between steps ' + cb.lo + ' and ' + cb.hi, blowEv ? 'the event at step ' + blowEv.k : 'no event', inBand(cb, blowEv));
  const bankEv = ev('plant:banked'), cf = crossing(P.firing, 0.5, false);
  row('MUST', 'the stokers\' banking (their firing under half) falls on the record\'s own event plant:banked', 'the record\'s channel crosses it between steps ' + cf.lo + ' and ' + cf.hi, bankEv ? 'the event at step ' + bankEv.k : 'no event', inBand(cf, bankEv));
  // ---- the fires, room by room
  const rooms = PL.rooms.map((r, i) => {
    const s = P.fires[i]; let rise = 0, out = null, first = null;
    for (let j = 1; j < s.length; j++) { if (s[j] > s[j - 1] + 1e-12) rise++; if (first === null && s[j] < s[j - 1]) first = k0 + j; if (out === null && s[j] === 0 && s[0] > 0) out = k0 + j; }
    const fl = ev('plant:flood' + i), dr = ev('plant:drawn' + i), co = ev('plant:coal' + i);
    return { i, name: r.name, lit: r.lit, rise, firstDown: first, out, flooded: fl ? fl.k : null, drawn: dr ? dr.k : null, coal: co ? co.k : null };
  });
  row('MUST', 'no room\'s fires ever rise again (water, the rakes or the coal put them out for good)', rooms.map(r => r.rise).reduce((a, b) => a + b, 0) + ' rises', '0', rooms.every(r => r.rise === 0));
  const late = rooms.filter(r => r.flooded !== null && !(r.out !== null && r.out >= r.flooded && (r.out - r.flooded) * K.dt <= PL.quench + 2 * K.dt));
  row('MUST', 'a room flooded (plant:flood<i>) has its fires out within the plant\'s quench time (' + PL.quench + ' s) after the event', rooms.filter(r => r.flooded !== null).map(r => r.name + ' flooded at step ' + r.flooded + ', out at ' + r.out).join('; ') || 'no room flooded', late.length ? 'LATE: ' + late.map(r => r.name).join(', ') : 'all within', late.length === 0);
  // ---- the timeline
  row('CHECK', 'steam at the escape pipes (blow > ' + JET + ', the viewer\'s rule)', jets.map(j => T(j.from) + ' to ' + (j.to === null ? 'the hand-over' : T(j.to)) + ' (blow up to ' + f(j.peak, 2) + ')').join('; ') || 'never', 'the record\'s', true);
  row('CHECK', 'the fires, room by room (lit rooms)', rooms.filter(r => r.lit > 0).map(r => r.name.replace('Boiler room', 'BR') + ': ' + (r.out === null ? 'burning at the hand-over' : 'out ' + T(r.out) + (r.flooded !== null ? ' (flooded)' : (r.drawn !== null ? ' (drawn)' : (r.coal !== null ? ' (no coal)' : ''))))).join('; '), 'the record\'s', true);
  const brk = ev('plant:break');
  row('CHECK', 'the steam raised (gen): at the touch, at an hour, at the hand-over', ['the touch', 'one hour', 'the hand-over'].map((nm, j) => { const k = j === 0 ? Math.round(rec.end.summary.tTouch / K.dt) : (j === 1 ? Math.round(rec.end.summary.tTouch / K.dt) + 14400 : k0 + n - 1); return nm + ' ' + f(P.gen[Math.min(n - 1, k - k0)], 3); }).join(', ') + (brk ? '; the boilers give way at ' + T(brk.k) : ''), 'the record\'s', true);
  // ---- the file
  const obj = {
    format: 'titanic-u3-smoke', version: 1,
    about: 'When her smoke and steam come and go, from the recorded night\'s plant (channels.plant, every step): jets, the intervals the viewer jets steam from the escape pipes (blow > 0.02; peak blow in each); rooms, each boiler room\'s fires (the step they first fall, the step they are out, and the plant\'s events: flooded, drawn, out of coal). Smoke leaves the funnels\' tops (topsides.derived.smoke) and steam the pipes\' mouths (topsides.derived.steam). Its strength is the renderer\'s [appearance], from gen and fires.',
    from: { night: rec.night.title, fingerprint: rec.end.fingerprint, sources: rec.made.sources },
    dt: K.dt, smoke: ship.topsides.derived.smoke, steam: ship.topsides.derived.steam,
    jets, rooms: rooms.map(r => ({ i: r.i, name: r.name, lit: r.lit, firstDown: r.firstDown, out: r.out, flooded: r.flooded, drawn: r.drawn, coal: r.coal })),
    events: { blowoff: blowEv ? blowEv.k : null, banked: bankEv ? bankEv.k : null, break: brk ? brk.k : null },
  };
  const text = J.text(obj);
  fs.writeFileSync(outFile('u3_smoke.json'), text);
  rows.push(['INFO', 'u3_smoke.json: ' + jets.length + ' steam intervals, ' + rooms.length + ' rooms', Buffer.byteLength(text) + ' bytes', 'sha256 ' + J.sha256(text).slice(0, 16), true]);
} catch (e) {
  row('MUST', 'the tool ran', String(e && e.stack || e).split('\n').slice(0, 2).join(' '), 'no error', false);
}
for (const [kind, what, value, ref, ok] of rows) {
  if (kind === 'INFO') { console.log('       ' + what.padEnd(100) + ' ' + String(value).padEnd(60) + ' ' + ref); continue; }
  console.log((ok ? 'PASS ' : (kind === 'MUST' ? 'FAIL ' : 'CHECK ')) + kind.padEnd(6) + what.padEnd(100) + ' ' + String(value).padEnd(60) + ' ' + ref);
}
console.log(fails ? '\nFAIL: ' + fails + ' MUST row(s)' : '\nPASS: all ' + rows.filter(r => r[0] === 'MUST').length + ' MUST rows');
process.exit(fails ? 1 : 0);
