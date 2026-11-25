/*
 * The living ship's nervous system (NH15: docs/DESIGN_the_living_ship_v1_2026-11-23.md, parts 1 and 5): each of her
 * systems as a node with its state, the reason in words and the model's time it took that state, read from the model's
 * own fields. A library, as rooms.js and girder.js are: it keeps no state, registers no reader and writes nothing into a
 * sim, so a watch has the same bits with it as without (tools/nerves_tests.js). The page's view (site/parts/77_nerves.js,
 * Z2's) draws from it, and its suite holds the page to this same table.
 *
 *   NV.NODES          [{ id, label, group, x, y }]: her systems, placed on a unit square left to right as the chain runs
 *                     (the view may move them: the places are appearance)
 *   NV.EDGES          [[from, to]]: what depends on what (core/systems.js and the readers, as the design's part 1 traces)
 *   NV.RULES          { id: (sim) -> { state, why, t } }: each node from the model's fields
 *   NV.EVENTS         { plant event id (its stem): node ids }: where each of the plant's events shows
 *   NV.stateOf(sim)   { id: { state, why, t } } for every node. state: 'green' (working), 'amber' (working short, or on
 *                     a stand-by), 'red' (failed), 'grey' (not here, or not in use). why: words, the plant's and the
 *                     readers' own where they keep them. t: the model's time (s, sim.t) the state began where the plant
 *                     marks it with an event (sim.plant.events: each id's first time), else null; the lights' amber
 *                     with the dynamos running, the first of her sections' fuses to blow (sim.circuits, G1: its words
 *                     name how many of her sections are dark). Every node is { state, why, t } and nothing more.
 *
 * Its thresholds are the plant's own (core/systems.js, PLANT) and the readers' own states (sim.world.set and .lamp,
 * sim.reports.phone, sim.circuits): it copies no law. Two of the plant's inline numbers are named here with their place: the steam's
 * warning at 0.8 of working pressure (its event p80) and the blow-off's 0.02 (the page's and the wireless's).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../systems.js'));
  else root.TitanicNerves = factory(root.TitanicSystems);
})(typeof self !== 'undefined' ? self : this, function (Sys) {
  'use strict';
  const PL = Sys.PLANT, ROOMS = PL.rooms, NR = ROOMS.length;
  const P80 = 0.8, BLOW = 0.02;                       // core/systems.js: the event p80 (p < 0.8); the blow-off read as steam

  // ------------------------------------------------------------------ the nodes, placed [appearance]
  const NODES = [];
  const node = (id, label, group, x, y) => NODES.push({ id, label, group, x, y });
  for (let k = 0; k < NR; k++) node('coal:' + k, ROOMS[k].name + ': coal', 'fuel', 0.04, 0.08 + 0.15 * k);
  for (let k = 0; k < NR; k++) node('fires:' + k, ROOMS[k].name + ': fires', 'fuel', 0.19, 0.08 + 0.15 * k);
  node('fans', 'Stokehold fans', 'fuel', 0.19, 0.98);
  node('steam', 'Steam', 'steam', 0.36, 0.45);
  node('engine:port', 'Port engine', 'drive', 0.53, 0.10); node('engine:starboard', 'Starboard engine', 'drive', 0.53, 0.26);
  node('turbine', 'Turbine', 'drive', 0.53, 0.42);
  node('steering', 'Steering engines', 'steer', 0.53, 0.58);
  node('pumps', 'Pumps', 'water', 0.53, 0.74);
  node('dynamos', 'Main dynamos', 'power', 0.53, 0.88); node('emergency', 'Emergency dynamos', 'power', 0.53, 1.00);
  node('screw:port', 'Port screw', 'drive', 0.72, 0.10); node('screw:starboard', 'Starboard screw', 'drive', 0.72, 0.26);
  node('screw:centre', 'Centre screw', 'drive', 0.72, 0.42);
  node('rudder', 'Rudder', 'steer', 0.72, 0.58);
  node('lights', 'Lights', 'power', 0.72, 0.80); node('doors', 'Doors\' switch', 'power', 0.72, 0.92);
  node('wireless', 'Wireless', 'signal', 0.92, 0.70); node('morse', 'Morse lamp', 'signal', 0.92, 0.82);
  node('phones', 'Telephones', 'signal', 0.92, 0.94); node('boats', 'Boats\' work', 'people', 0.92, 0.58);

  // ------------------------------------------------------------------ the edges: what each depends on
  const EDGES = [];
  for (let k = 0; k < NR; k++) EDGES.push(['coal:' + k, 'fires:' + k], ['fires:' + k, 'steam'], ['fans', 'fires:' + k]);
  EDGES.push(['steam', 'engine:port'], ['steam', 'engine:starboard'], ['engine:port', 'screw:port'], ['engine:starboard', 'screw:starboard'],
    ['engine:port', 'turbine'], ['engine:starboard', 'turbine'], ['turbine', 'screw:centre'],
    ['steam', 'steering'], ['steering', 'rudder'], ['steam', 'pumps'], ['steam', 'dynamos'], ['steam', 'emergency'],
    ['dynamos', 'fans'], ['dynamos', 'lights'], ['emergency', 'lights'], ['dynamos', 'doors'],
    ['dynamos', 'wireless'], ['emergency', 'wireless'], ['dynamos', 'morse'], ['emergency', 'morse'], ['dynamos', 'phones'], ['lights', 'boats']);

  // ------------------------------------------------------------------ the plant's events, by the node that shows them
  const EVENTS = {
    flood: ['fires:'], drawn: ['fires:'], coal: ['coal:', 'fires:'], banked: ['fires:', 'steam'], fans: ['fans', 'fires:'], blowoff: ['steam'],
    p80: ['steam'], break: ['steam', 'dynamos', 'emergency'], nosteam: ['engine:port', 'engine:starboard'], slow: ['engine:port', 'engine:starboard'],
    re: ['engine:port', 'engine:starboard'], te: ['turbine'], steer: ['steering'], screws: ['screw:'], screwsHalf: ['screw:'], screwsOut: ['screw:'],
    mainDark: ['lights', 'dynamos'], dark: ['lights', 'dynamos', 'emergency'], doorsDead: ['doors'], pumps: ['pumps'], led: ['pumps'],
    raised: ['doors'],   // D112: the engineers raise the after doors by hand (core/systems.js, raiseDoors)
  };

  // ------------------------------------------------------------------ helpers
  const S = (state, why, t) => ({ state, why, t: t === undefined ? null : t });
  const ev = (sim, id) => (sim.plant && sim.plant.events[id] !== undefined ? sim.plant.events[id] : null);
  const first = (...ts) => { let v = null; for (const t of ts) if (t !== null && (v === null || t < v)) v = t; return v; };
  const psi = (P) => Math.round(P.p * PL.psi) + ' psi';
  const pct = (x) => Math.round(100 * x) + ' %';
  const mainLost = (sim) => first(ev(sim, 'mainDark'), ev(sim, 'dark'));

  // ------------------------------------------------------------------ the rules, one a node
  const RULES = {};
  for (let k = 0; k < NR; k++) {
    RULES['coal:' + k] = (sim) => {
      const P = sim.plant; if (!P) return S('grey', 'no plant');
      if (ROOMS[k].lit <= 0) return S('grey', 'not lit on the night');
      if (P.coal[k] <= 0) return S('red', 'the bunkers are empty', ev(sim, 'coal' + k));
      return S('green', Math.round(P.coal[k]) + ' t in her bunkers');
    };
    RULES['fires:' + k] = (sim) => {
      const P = sim.plant; if (!P) return S('grey', 'no plant');
      if (ROOMS[k].lit <= 0) return S('grey', 'not lit on the night');
      if (P.out[k]) return S('red', 'flooded: its fires are out', ev(sim, 'flood' + k));
      if (P.fires[k] <= 0) return P.drawn[k] ? S('red', 'its fires drawn', ev(sim, 'drawn' + k)) : S('red', 'burnt down: the bunkers are empty', ev(sim, 'coal' + k));
      if (P.drawn[k]) return S('amber', 'its fires being drawn', ev(sim, 'drawn' + k));
      if (P.coal[k] <= 0) return S('amber', 'burning down: the bunkers are empty', ev(sim, 'coal' + k));
      if (P.broken) return S('amber', 'lit, but the steam mains have given way', ev(sim, 'break'));
      if (P.firing < 0.5) return S('amber', 'banked', ev(sim, 'banked'));
      if (!P.power) return S('amber', 'on natural draught: the fans have stopped', ev(sim, 'fans'));
      return S('green', 'lit');
    };
  }
  RULES.fans = (sim) => {
    const P = sim.plant; if (!P) return S('grey', 'no plant');
    return P.power ? S('green', 'running on the main dynamos') : S('amber', 'stopped with the dynamos: the fires on natural draught', ev(sim, 'fans'));
  };
  RULES.steam = (sim) => {
    const P = sim.plant; if (!P) return S('grey', 'no plant');
    if (P.broken) return S('red', 'the steam mains have given way', ev(sim, 'break'));
    if (P.p <= PL.pEngine) return S('red', psi(P) + ': too little for the engines', first(ev(sim, 'nosteam'), ev(sim, 'p80')));
    if (P.p < P80) return S('amber', psi(P) + ': falling', ev(sim, 'p80'));
    if (P.blow > BLOW) return S('green', psi(P) + ': blowing off at the safety valves', ev(sim, 'blowoff'));
    return S('green', psi(P));
  };
  const engine = (i, name) => (sim) => {
    const P = sim.plant, m = sim.mo; if (!P || !m || !m.plant) return S('grey', 'no engines working here');
    if (P.re) return S('red', 'the engine room flooded: both engines stop', ev(sim, 're'));
    const nMax = m.plant.nMax[i], want = Math.abs(i === 0 ? m.setP : m.setS), n = Math.abs(i === 0 ? m.nP : m.nS);
    if (nMax <= 0) return S('red', 'no steam', ev(sim, 'nosteam'));
    if (nMax < want - 0.5) return S('amber', 'steam for ' + Math.round(nMax) + ' rpm of the ' + Math.round(want) + ' ordered', ev(sim, 'slow'));
    return S('green', Math.round(n) + ' rpm' + (want ? '' : ', stopped'));
  };
  RULES['engine:port'] = engine(0, 'port'); RULES['engine:starboard'] = engine(1, 'starboard');
  RULES.turbine = (sim) => {
    const P = sim.plant, m = sim.mo; if (!P || !m || !m.plant) return S('grey', 'no engines working here');
    if (P.te) return S('red', 'the turbine room flooded', ev(sim, 'te'));
    return Math.abs(m.nC) > 1 ? S('green', 'turning: ' + Math.round(Math.abs(m.nC)) + ' rpm') : S('grey', 'out: the wing engines are below half ahead');
  };
  const screw = (j) => (sim) => {
    const m = sim.mo; if (!m || !m.plant) return S('grey', 'no engines working here');
    const a = m.plant.imm[j];
    if (a < 0.05) return S('red', 'out of the water: it pushes nothing', ev(sim, 'screwsOut'));
    if (a < 1) return S('amber', pct(a) + ' of its disc under water', first(ev(sim, 'screws'), ev(sim, 'screwsHalf')));
    return S('green', 'under water');
  };
  RULES['screw:port'] = screw(0); RULES['screw:centre'] = screw(1); RULES['screw:starboard'] = screw(2);
  RULES.steering = (sim) => {
    const m = sim.mo; if (!m || !m.plant) return S('grey', 'no steering gear working here');
    if (!m.plant.steer) return S('red', 'no steam: the rudder stays where it is', ev(sim, 'steer'));
    if (m.plant.steerRate < 1) return S('amber', 'slow: ' + pct(m.plant.steerRate) + ' of its rate');
    return S('green', 'answering the wheel');
  };
  RULES.rudder = (sim) => {
    const m = sim.mo; if (!m || !m.plant) return S('grey', 'no rudder working here');
    const a = m.plant.rudImm;
    if (a < 0.05) return S('red', 'out of the water');
    if (a < 1) return S('amber', pct(a) + ' of its area under water');
    return S('green', 'under water');
  };
  RULES.pumps = (sim) => {
    const E = sim.pumpSched || [], t = sim.t, started = E.filter(e => t >= e.t0);
    if (!started.length) return S('grey', E.length ? 'none at work yet' : 'none at work');
    const on = started.filter(e => !e.off), off = started.filter(e => e.off);
    const tOff = off.reduce((v, e) => (v === null || e.tOff > v ? e.tOff : v), null);
    if (!on.length) return S('red', 'every pump stopped: their rooms lost', tOff);
    const sc = sim.pumpScale === undefined ? 1 : sim.pumpScale;
    if (sc <= 0) return S('red', on.length + ' pumps without steam');
    if (sc < 1 || off.length) return S('amber', on.length + ' at work' + (sc < 1 ? ' at ' + pct(sc) + ' of their rate' : '') + (off.length ? '; ' + off.length + ' stopped, their rooms lost' : ''), off.length ? tOff : null);
    return S('green', on.length + ' at work');
  };
  RULES.dynamos = (sim) => {
    const P = sim.plant; if (!P) return S('grey', 'no plant');
    if (P.power) return S('green', 'running');
    if (P.el) return S('red', 'the dynamo flat flooded', mainLost(sim));
    if (P.broken) return S('red', 'stopped: the steam mains have given way', ev(sim, 'break'));
    return S('red', 'stopped: no steam for them', mainLost(sim));
  };
  RULES.emergency = (sim) => {
    const P = sim.plant; if (!P) return S('grey', 'no plant');
    if (P.emergency) return S('green', P.power ? 'running (every night after sunset)' : 'running: her emergency lights');
    if (P.emWet) return S('red', 'flooded at D deck', ev(sim, 'dark'));
    if (P.broken) return S('red', 'stopped: the steam mains have given way', ev(sim, 'break'));
    return S('red', 'stopped: no steam for them', ev(sim, 'dark'));
  };
  // her lights by circuit (G1, core/readers/circuits.js), where the watch has them: how many of her sections the sea has
  // put out, in the words; amber while the dynamos run and some are out, its time the first section's fuses (the
  // reader's own, sim.circuits). Every node keeps { state, why, t } and nothing more: the view reads them as they are
  const darkOf = (sim) => { const Ci = sim.circuits; return Ci && Ci.sections && Ci.out > 0 ? Ci.out + ' of ' + Ci.sections.length + ' sections dark' : ''; };
  const firstOut = (sim) => { let t = null; for (const s of sim.circuits.sections) if (s.out >= 0 && (t === null || s.out < t)) t = s.out; return t; };
  RULES.lights = (sim) => {
    const P = sim.plant; if (!P) return S('grey', 'no plant');
    const dark = darkOf(sim);
    if (P.lights >= 1) return dark ? S('amber', dark + ': the sea in them has blown their fuses', firstOut(sim)) : S('green', 'all her lights');
    if (P.lights > 0) return S('amber', 'the emergency lights only' + (dark ? '; ' + dark : ''), ev(sim, 'mainDark'));
    return S('red', 'dark', ev(sim, 'dark'));
  };
  RULES.doors = (sim) => {
    const P = sim.plant; if (!P) return S('grey', 'no plant');
    if (!P.power) return S('red', 'the bridge\'s switch is dead: the floats alone shut the doors', mainLost(sim));
    return S('green', P.doorSwitch ? 'the bridge\'s switch thrown: the doors released' : 'the bridge\'s switch has current');
  };
  RULES.wireless = (sim) => {
    const W = sim.world; if (!W || !W.set) return S('grey', 'no wireless here');
    const s = W.set;
    if (!s.working) return S('red', s.why);
    const reach = s.reach ? ': ' + Math.round(s.reach) + ' nm' : '';
    return s.supply === 'main' ? S('green', s.why + reach) : S('amber', s.why + reach);
  };
  RULES.morse = (sim) => {
    const W = sim.world; if (!W || !W.lamp || W.lamp.lit === undefined) return S('grey', 'no Morse lamp here');
    return W.lamp.lit ? S(/emergency/.test(W.lamp.why) ? 'amber' : 'green', W.lamp.why) : S('red', W.lamp.why);
  };
  RULES.phones = (sim) => {
    const R = sim.reports; if (!R || !R.phone) return S('grey', 'no telephones here');
    if (!R.phone.current) return S('red', R.phone.why);
    return /battery/.test(R.phone.why) ? S('amber', R.phone.why, mainLost(sim)) : S('green', R.phone.why);
  };
  RULES.boats = (sim) => {
    const P = sim.plant; if (!sim.people) return S('grey', 'no boats\' work here');
    if (P && P.lights <= 0) return S('amber', 'in the dark: the boats\' work at half its pace', ev(sim, 'dark'));
    return S('green', P && P.lights < 1 ? 'by the emergency lights' : 'lit');
  };

  function stateOf(sim) {
    const out = {};
    for (const n of NODES) out[n.id] = RULES[n.id](sim);
    return out;
  }

  return { NODES, EDGES, EVENTS, RULES, stateOf, P80, BLOW };
});
