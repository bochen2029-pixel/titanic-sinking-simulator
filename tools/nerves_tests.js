// The living ship's nervous system (NH15; core/readers/nerves.js), headless: its table against the plant's own fields.
//   node tools/nerves_tests.js         (about a minute)
// MUST rows: the table's shape (every node a rule, every edge two nodes, every place on the unit square); every event the
// plant can raise (core/systems.js's own source, read) shows on a node; each rule against states made by hand on a fresh
// watch; on the 1912 watch and on a what-if with every fire drawn at the touch, each node's time is the plant's own event's
// time; and nothing fed back: a watch read by the table every step has the fingerprint of one that is not, and the
// table writes nothing into the sim; its lights node names her sections dark (G1, the circuits reader) every step, and
// every node is { state, why, t } and nothing more. CHECK:
// the 1912 watch's nodes at her end, as the view would show them.
'use strict';
const fs = require('fs');
const path = require('path');
const C = require('../core/core.js');
const N = require('../core/night.js');
const NV = require('../core/readers/nerves.js');
for (const r of ['circuits', 'people', 'reports', 'world']) require('../core/readers/' + r + '.js');   // the readers the table reads register themselves, as in the page

const rows = []; let fails = 0, checks = 0;
function row(kind, what, value, ref, ok) { rows.push([kind, what, value, ref, ok]); if (!ok) { if (kind === 'MUST') fails++; else checks++; } }
const ship = C.buildShip(), sp = N.spec(1912);
const fresh = () => N.create(ship, sp, { auto: true, handover: 'flag' });
const Tn = (sim, t) => (t === null || t === undefined ? 'n/a' : 'T ' + ((t - sim.night.tTouch) / 60).toFixed(2));

try {
  // ---- 1. the table's shape
  {
    const ids = NV.NODES.map(n => n.id), unique = new Set(ids).size === ids.length;
    const noRule = ids.filter(id => typeof NV.RULES[id] !== 'function'), extra = Object.keys(NV.RULES).filter(id => !ids.includes(id));
    const badEdge = NV.EDGES.filter(([a, b]) => !ids.includes(a) || !ids.includes(b)), off = NV.NODES.filter(n => !(n.x >= 0 && n.x <= 1 && n.y >= 0 && n.y <= 1));
    row('MUST', 'the table: every node one rule and one place on the unit square, every edge between two nodes',
      ids.length + ' nodes, ' + NV.EDGES.length + ' edges' + (noRule.length ? '; no rule: ' + noRule.join(', ') : '') + (extra.length ? '; rules with no node: ' + extra.join(', ') : '') + (badEdge.length ? '; ' + badEdge.length + ' edges astray' : '') + (off.length ? '; ' + off.length + ' off the square' : ''),
      'all', unique && !noRule.length && !extra.length && !badEdge.length && !off.length);
  }
  // ---- 2. every event the plant can raise shows on a node (read from core/systems.js itself)
  {
    const src = fs.readFileSync(path.join(__dirname, '..', 'core', 'systems.js'), 'utf8');
    const stems = [...new Set([...src.matchAll(/event\(sim, '([A-Za-z0-9]+)/g)].map(m => m[1]))];   // 'flood' + k and 'doorsDead@' + t give their stems
    const uncovered = stems.filter(s => !NV.EVENTS[s]);
    const astray = Object.entries(NV.EVENTS).filter(([, ns]) => ns.some(p => !NV.NODES.some(n => n.id === p || (p.endsWith(':') && n.id.startsWith(p))))).map(([s]) => s);
    row('MUST', 'every event the plant can raise (core/systems.js, read) shows on a node', stems.length + ' events: ' + stems.join(' ') + (uncovered.length ? '; NOT SHOWN: ' + uncovered.join(', ') : '') + (astray.length ? '; pointing at no node: ' + astray.join(', ') : ''),
      'all of them', stems.length > 15 && !uncovered.length && !astray.length);
  }
  // ---- 3. each rule against states made by hand (a fresh 1912 watch, its fields set, then read; never stepped after)
  {
    const P = (sim) => sim.plant, M = (sim) => sim.mo;
    const CASES = [
      ['a fresh watch: every node green or grey', null, null, null, null],
      ['boiler room 5 flooded at its furnaces', (s) => { P(s).out[1] = 1; P(s).events.flood1 = 600; }, 'fires:1', 'red', /flooded/, 600],
      ['boiler room 4\'s fires being drawn', (s) => { P(s).drawn[2] = 1; P(s).fires[2] = 0.5; P(s).events.drawn2 = 700; }, 'fires:2', 'amber', /being drawn/, 700],
      ['  ... and drawn', (s) => { P(s).drawn[2] = 1; P(s).fires[2] = 0; P(s).events.drawn2 = 700; }, 'fires:2', 'red', /drawn/, 700],
      ['boiler room 3\'s bunkers empty, its fires still in', (s) => { P(s).coal[3] = 0; P(s).events.coal3 = 800; }, 'fires:3', 'amber', /burning down/, 800],
      ['  ... and its coal', (s) => { P(s).coal[3] = 0; P(s).events.coal3 = 800; }, 'coal:3', 'red', /empty/, 800],
      ['boiler room 1, never lit', null, 'fires:5', 'grey', /not lit/],
      ['the fires banked', (s) => { P(s).firing = 0.3; P(s).events.banked = 900; }, 'fires:0', 'amber', /banked/, 900],
      ['the main dynamos stopped: the fans', (s) => { P(s).power = false; P(s).events.fans = 950; }, 'fans', 'amber', /natural draught/, 950],
      ['  ... the fires on natural draught', (s) => { P(s).power = false; P(s).events.fans = 950; }, 'fires:0', 'amber', /natural draught/, 950],
      ['  ... the doors\' switch', (s) => { P(s).power = false; P(s).events.mainDark = 960; }, 'doors', 'red', /dead/, 960],
      ['  ... the dynamos, the flat flooded', (s) => { P(s).power = false; P(s).el = true; P(s).events.mainDark = 960; }, 'dynamos', 'red', /flat flooded/, 960],
      ['the steam at 129 psi', (s) => { P(s).p = 0.6; P(s).events.p80 = 1000; }, 'steam', 'amber', /falling/, 1000],
      ['  ... at 64 psi', (s) => { P(s).p = 0.3; }, 'steam', 'red', /too little/],
      ['  ... the steam mains given way', (s) => { P(s).broken = true; P(s).events.break = 1100; }, 'steam', 'red', /given way/, 1100],
      ['the engine room flooded', (s) => { P(s).re = true; P(s).events.re = 1200; }, 'engine:port', 'red', /engine room flooded/, 1200],
      ['the engines without steam', (s) => { M(s).plant.nMax[1] = 0; P(s).events.nosteam = 1300; }, 'engine:starboard', 'red', /no steam/, 1300],
      ['the engines short of steam for the order', (s) => { M(s).setP = 70; M(s).plant.nMax[0] = 40; P(s).events.slow = 1350; }, 'engine:port', 'amber', /40 rpm of the 70/, 1350],
      ['the turbine room flooded', (s) => { P(s).te = true; P(s).events.te = 1400; }, 'turbine', 'red', /turbine room flooded/, 1400],
      ['the turbine out, the wings below half ahead', (s) => { M(s).nC = 0; }, 'turbine', 'grey', /out/],
      ['the centre screw half out of the water', (s) => { M(s).plant.imm[1] = 0.5; P(s).events.screws = 1500; }, 'screw:centre', 'amber', /50 %/, 1500],
      ['  ... and out', (s) => { M(s).plant.imm[1] = 0; P(s).events.screwsOut = 1600; }, 'screw:centre', 'red', /out of the water/, 1600],
      ['the steering engines slow', (s) => { M(s).plant.steerRate = 0.5; }, 'steering', 'amber', /50 %/],
      ['  ... and without steam', (s) => { M(s).plant.steer = false; M(s).plant.steerRate = 0; P(s).events.steer = 1700; }, 'steering', 'red', /no steam/, 1700],
      ['the rudder half out', (s) => { M(s).plant.rudImm = 0.5; }, 'rudder', 'amber', /50 %/],
      ['three of her sections dark (G1), the dynamos running', (s) => { [5, 9, 40].forEach((j, i) => { s.circuits.sections[j].out = 1950 + 10 * i; }); s.circuits.out = 3; }, 'lights', 'amber', /^3 of \d+ sections dark: the sea/, 1950],
      ['the emergency lights only', (s) => { P(s).lights = 0.15; P(s).events.mainDark = 1800; }, 'lights', 'amber', /emergency/, 1800],
      ['  ... with two sections dark', (s) => { [5, 9].forEach((j) => { s.circuits.sections[j].out = 1700; }); s.circuits.out = 2; P(s).lights = 0.15; P(s).events.mainDark = 1800; }, 'lights', 'amber', /emergency lights only; 2 of \d+ sections dark/, 1800],
      ['  ... dark', (s) => { P(s).lights = 0; P(s).events.dark = 1900; }, 'lights', 'red', /dark/, 1900],
      ['the emergency sets flooded at D deck', (s) => { P(s).emergency = false; P(s).emWet = true; P(s).events.dark = 1900; }, 'emergency', 'red', /D deck/, 1900],
      ['the pumps short of steam', (s) => { s.pumpSched = [{ zone: 5, room: 5, q: 0.07, t0: 0, off: false, tOff: -1 }]; s.pumpScale = 0.5; }, 'pumps', 'amber', /50 %/],
      ['  ... every pump stopped, its room lost', (s) => { s.pumpSched = [{ zone: 5, room: 5, q: 0.07, t0: 0, off: true, tOff: 2000 }]; }, 'pumps', 'red', /rooms lost/, 2000],
      ['the wireless on its battery', (s) => { s.world.set.supply = 'battery'; s.world.set.why = 'on its battery'; }, 'wireless', 'amber', /battery/],
      ['  ... silent', (s) => { s.world.set.working = false; s.world.set.why = 'no current: the battery is spent'; }, 'wireless', 'red', /spent/],
      ['the Morse lamp dark until the change-over', (s) => { s.world.lamp.lit = false; s.world.lamp.why = 'no current until the change-over to the emergency dynamos is thrown'; }, 'morse', 'red', /change-over/],
      ['  ... on the emergency sets', (s) => { s.world.lamp.why = 'on the emergency dynamos, by the change-over'; }, 'morse', 'amber', /emergency/],
      ['the telephones on their battery', (s) => { s.reports.phone = { current: true, why: 'on its stand-by battery' }; P(s).power = false; P(s).events.mainDark = 2100; }, 'phones', 'amber', /battery/, 2100],
      ['  ... dead', (s) => { s.reports.phone = { current: false, why: 'no current: its stand-by battery is spent' }; }, 'phones', 'red', /spent/],
      ['the boats\' work in the dark', (s) => { P(s).lights = 0; P(s).events.dark = 2200; }, 'boats', 'amber', /half/, 2200],
    ];
    let bad = [], n = 0;
    for (const [name, set, id, want, re, t] of CASES) {
      const sim = fresh();
      if (set) set(sim);
      const st = NV.stateOf(sim);
      n++;
      if (!id) { const off = Object.entries(st).filter(([, v]) => v.state !== 'green' && v.state !== 'grey'); if (off.length) bad.push(name + ': ' + off.map(([k, v]) => k + ' ' + v.state).join(', ')); continue; }
      const v = st[id], okT = t === undefined || v.t === t;
      if (v.state !== want || !re.test(v.why) || !okT) bad.push(name + ': ' + id + ' ' + v.state + ' "' + v.why + '" t ' + v.t);
    }
    row('MUST', 'each rule against states made by hand on a fresh 1912 watch: its colour, its words and its time (the plant\'s event\'s)', n + ' cases' + (bad.length ? '; WRONG: ' + bad.join('; ') : '; all as stated'), 'all', bad.length === 0);
  }
  // ---- 4. on the 1912 watch: each node's time is the plant's own; nothing fed back
  {
    const a = fresh(), b = fresh(), before = [];
    const look = () => JSON.stringify({ p: a.plant, m: a.mo.plant, w: a.world && a.world.set, l: a.world && a.world.lamp, r: a.reports && a.reports.phone, c: a.circuits });
    let differ = -1, wrote = false, secBad = null, firstAmber = -1, firstAmberT = null, firstAmberNow = null;
    while (!a.foundered && !b.foundered) {
      let s0;
      if (a.night.k % 600 === 0) { const snap = look(); s0 = NV.stateOf(a); if (look() !== snap) wrote = true; } else s0 = NV.stateOf(a);
      // the lights node against the circuits reader's own state (G1), every step: its colour, the count in its words, and
      // every node { state, why, t } and nothing more (the view reads them as they are)
      const L = s0.lights, Ci = a.circuits, Pa = a.plant, tag = Ci.out + ' of ' + Ci.sections.length + ' sections dark';
      const okL = Pa.lights >= 1 ? (Ci.out > 0 ? L.state === 'amber' && L.why.startsWith(tag + ':') : L.state === 'green')
        : (Pa.lights > 0 ? L.state === 'amber' && (Ci.out > 0 ? L.why.endsWith('; ' + tag) : !/sections dark/.test(L.why)) : L.state === 'red');
      const shapeOk = a.night.k % 600 !== 0 || Object.values(s0).every(v => Object.keys(v).join() === 'state,why,t');
      if (!secBad && (!okL || !shapeOk)) secBad = a.night.k + ': ' + L.state + ' "' + L.why + '"' + (shapeOk ? '' : ' (a node not { state, why, t })');
      if (firstAmber < 0 && Pa.lights >= 1 && Ci.out > 0) { firstAmber = a.night.k; firstAmberT = L.t; firstAmberNow = a.t; }
      N.step(a); N.step(b);
      if (differ < 0 && a.night.k % 400 === 0 && N.fingerprint(a) !== N.fingerprint(b)) differ = a.night.k;
    }
    const same = differ < 0 && a.night.k === b.night.k && N.fingerprint(a) === N.fingerprint(b);
    row('MUST', 'nothing fed back: the 1912 watch read by the table every step, against the watch alone; and the table writes nothing into the sim',
      a.night.k + ' steps; ' + (same ? 'the same fingerprint every 400 steps and at the end, ' + N.fingerprint(a) : 'PARTED at step ' + differ) + (wrote ? '; THE TABLE WROTE' : '; nothing written'), 'the same; nothing written', same && !wrote);
    row('MUST', '  ... and its lights node names her sections dark every step ("k of 250 sections dark", k the circuits reader\'s own), amber from the first section\'s fuses while the dynamos run, its time theirs; every node { state, why, t } and nothing more',
      secBad ? 'OFF at step ' + secBad : 'every step; amber from step ' + firstAmber + ' (' + Tn(a, firstAmberT) + ')', 'as sim.circuits', !secBad && firstAmber > 0 && firstAmberT !== null && firstAmberT === firstAmberNow);
    const st = NV.stateOf(a), P = a.plant, E = P.events, bad = [];
    for (let k = 0; k < 6; k++) if (P.out[k] && st['fires:' + k].t !== E['flood' + k]) bad.push('fires:' + k);
    if (P.lights === 0 && st.lights.t !== E.dark) bad.push('lights');
    if (P.broken && st.steam.t !== E.break) bad.push('steam');
    if (P.re && st['engine:port'].t !== E.re) bad.push('engine:port');
    const shown = NV.NODES.filter(n => st[n.id].state !== 'green').map(n => n.id + ' ' + st[n.id].state + (st[n.id].t !== null ? ' ' + Tn(a, st[n.id].t) : '') + ' (' + st[n.id].why + ')');
    row('MUST', '  ... and at her end each node\'s time is the plant\'s own event\'s', bad.length ? 'OFF: ' + bad.join(', ') : 'the flooded rooms, the lights, the steam and the engines on their events', 'all', bad.length === 0);
    row('CHECK', 'the 1912 watch at her end (step ' + a.night.k + '), every node not green, as the view would show it', shown.join('; '), 'the model\'s, shown as it is', true);
  }
  // ---- 5. a what-if: every fire drawn at the touch; the chain runs down in order, each node on its event
  {
    const sim = fresh();
    while (sim.night.tTouch < 0) N.step(sim);
    N.fires(sim, -1);
    while (!sim.foundered && sim.plant.lights > 0) N.step(sim);
    for (let i = 0; i < 240 && !sim.foundered; i++) N.step(sim);
    // boiler room 2 (fires:4): dry until long after (boiler room 6 floods at its furnaces first, so it reads "flooded")
    const st = NV.stateOf(sim), E = sim.plant.events, want = [['fires:4', 'red', E.drawn4], ['steam', 'red', null], ['engine:port', 'red', E.nosteam], ['dynamos', 'red', E.dark], ['lights', 'red', E.dark], ['morse', 'red', null], ['phones', 'amber', E.dark]];
    const bad = want.filter(([id, s, t]) => st[id].state !== s || (t !== null && t !== undefined && st[id].t !== t));
    const order = E.drawn4 <= E.nosteam && E.nosteam <= E.dark;
    row('MUST', 'a what-if: every fire drawn at the touch; the fires drawn, then the steam, the engines, the dynamos and the lights out, each node on the plant\'s own event; the Morse lamp dark; the telephones on their battery',
      want.map(([id]) => id + ' ' + st[id].state + (st[id].t !== null ? ' ' + Tn(sim, st[id].t) : '')).join('; ') + (order ? '' : '; OUT OF ORDER'), 'in that order, each on its event', !bad.length && order);
  }
} catch (e) {
  row('MUST', 'the suite ran', String(e && e.stack || e), 'no error', false);
}
for (const [kind, what, value, ref, ok] of rows) console.log((ok ? 'PASS ' : (kind === 'MUST' ? 'FAIL ' : 'CHECK ')) + kind.padEnd(6) + what.padEnd(100) + ' ' + String(value) + '   [' + ref + ']');
const musts = rows.filter(r => r[0] === 'MUST').length;
console.log(fails ? '\nFAIL: ' + fails + ' MUST row(s)' : '\nPASS: all ' + musts + ' MUST rows' + (checks ? '; ' + checks + ' CHECK row(s) off' : ''));
process.exit(fails ? 1 : 0);
