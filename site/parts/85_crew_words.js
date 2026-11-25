/*
 * The bridge's words: an order in words becomes the watch's own typed orders, and an order becomes words again. Step 1
 * of the spoken bridge (docs/DESIGN_spoken_bridge_v1_2026-11-23.md, sections 3 and 4). A library: no DOM, no state, no
 * clock and no model. The same file runs in Node (tools/crew_tests.js) and in the page, where site/parts/86_crew.js gives
 * what it makes through TitanicApp.order.
 *
 *   parse(text, ctx)   -> { ok: true, heard, orders: [ { type, value, arg, said } ... ] }     in the order spoken
 *                      -> { ok: false, heard, kind: 'question' | 'unknown' | 'unclear', why, who }   nothing is ordered
 *   phrase(order, ctx) -> the order in the bridge's words ("Hard a-starboard")
 *   readback(order, done, ctx) -> { who, words, refused }: the answer on the bridge to an order given, done being what
 *                         TitanicApp.order (Night.act) returned
 *   domain()           -> every order parse can give (tools/crew_tests.js holds each one to the model)
 *   VOCAB              -> words and names for speech to text to listen for (step 2)
 *   TABLES             -> the model's own names this grammar uses, copied from the code; the tests hold each to it
 *   ctx: { convention: '1912' (the default) | 'modern', helm: the rudder now ordered, degrees, + to starboard }.
 *   readback reads ctx.helm as ordered after the order, ctx.why (the model's reason for a refusal where the order's
 *   return holds none), ctx.first (the player's first rocket), ctx.way ('ahead', the default; 'none'; 'astern': the way
 *   on her, for where the helm takes her head) and ctx.nothing (an order to draw fires that changes nothing).
 *
 * The helm. In 1912 a helm order named the side the TILLER went to: "hard a-starboard" put her head to PORT, rudder -40
 * in the model (core/night.js, the recorded order; core/motion.js, helm1912). The model's helm value is the rudder's
 * angle, + to starboard, and + turns her head to starboard. The modern convention names the rudder's side.
 *
 * The rules: an order is understood whole or not at all (half an order could be another order); a question is never
 * guessed into an order; several orders in one sentence are given in the order spoken. Every line is said by someone on
 * the bridge, or names the channel the answer came by. The lines are [authored], short and plain, except where they are
 * the model's own (a refusal's reason, the pumps' answer).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TitanicCrewWords = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const freeze = (o) => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const k of Object.keys(o)) freeze(o[k]); } return o; };

  // ------------------------------------------------------------------ the model's names (copied; held to the code)
  const TABLES = freeze({
    // core/motion.js TELEGRAPH: the engine-order telegraph
    TELEGRAPH: ['full ahead', 'half ahead', 'slow ahead', 'dead slow ahead', 'stop', 'dead slow astern', 'slow astern', 'half astern', 'full astern'],
    // core/motion.js SHIP.rudder.max: degrees of helm each way
    HELM_MAX: 40,
    // core/motion.js helm1912: the tiller orders of 1912 and the rudder each gives ("starboard" alone: 15 degrees)
    HELM_1912: { 'hard-a-starboard': -40, 'hard-a-port': 40, 'midships': 0, 'starboard': -15, 'port': 15 },
    // the revolutions an order may ask: what the page's address takes (site/parts/40_night_end.js validOrder, 83: the
    // most recorded); core/systems.js PLANT.nMax, 80, is what her engines turn at full pressure
    RPM_MAX: 83,
    // core/core.js BULKHEADS: each one's letter, and 1 where it has watertight doors
    BULKHEADS: [['A', 0], ['B', 0], ['C', 1], ['D', 1], ['E', 1], ['F', 1], ['G', 1], ['H', 1], ['J', 1], ['K', 1], ['L', 1], ['M', 1], ['N', 1], ['O', 1], ['P', 0]],
    // core/core.js ZONES: the sixteen compartments from the bow; a pump order takes this index
    ZONES: ['Forepeak', 'No. 1 hold', 'No. 2 hold', 'No. 3 hold', 'Boiler room 6', 'Boiler room 5', 'Boiler room 4', 'Boiler room 3',
      'Boiler room 2', 'Boiler room 1', 'Reciprocating engine room', 'Turbine engine room', 'Electric engine room',
      'Shaft tunnel / refrigerated cargo', 'Shaft tunnel / cargo', 'After peak'],
    // core/systems.js PLANT.rooms: the boiler rooms from forward; an order to draw the fires takes this index
    BOILER_ROOMS: ['Boiler room 6', 'Boiler room 5', 'Boiler room 4', 'Boiler room 3', 'Boiler room 2', 'Boiler room 1'],
    // core/systems.js PLANT.pumps: a pump order with a pump's own number takes this index (the Systems tab gives those)
    PUMPS: ['Boiler room 6\'s ash-ejector pump', 'Boiler room 5\'s ballast-and-bilge pump', 'Boiler room 4\'s ash-ejector pump',
      'Boiler room 3\'s ballast-and-bilge pump', 'Boiler room 2\'s ballast-and-bilge pump', 'A ballast pump in the reciprocating engine room',
      'The other ballast pump in the reciprocating engine room', 'A bilge pump in the reciprocating engine room',
      'The other bilge pump in the reciprocating engine room', 'The turbine room\'s bilge pump'],
    // core/readers/people.js RULES, FILLS and SIDES
    BOAT_RULES: ['only', 'first', 'fill'], BOAT_FILLS: [0.3, 0.5, 0.75, 1], BOAT_SIDES: ['port', 'starboard', 'both'],
    // core/readers/reports.js PARTS: where an officer may be sent to look
    LOOK: ['forward', 'mailroom', 'boilers', 'engines', 'aft'],
  });
  const MAX = TABLES.HELM_MAX, BARE = Math.abs(TABLES.HELM_1912.starboard), RPM_MAX = TABLES.RPM_MAX;

  // ------------------------------------------------------------------ who speaks (all of them on the bridge)
  const QM = 'The quartermaster', OOW = 'The officer of the watch', OT = 'The officer at the telegraph';
  const JUNIOR = 'The junior officer', FOURTH = 'The fourth officer';

  // ------------------------------------------------------------------ words: numbers, sides, rooms
  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const TEENS = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const ONE_OF = {}, TEEN_OF = {}, TEN_OF = {};
  ONES.forEach((w, i) => { ONE_OF[w] = i; }); TEENS.forEach((w, i) => { TEEN_OF[w] = 10 + i; }); TENS.forEach((w, i) => { if (w) TEN_OF[w] = 10 * i; });
  function numWords(n) {
    if (!(Number.isInteger(n) && n >= 0 && n < 100)) return String(n);
    if (n < 10) return ONES[n];
    if (n < 20) return TEENS[n - 10];
    return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
  }
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const low = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
  const stop = (s) => (/[.!?]$/.test(s) ? s : s + '.');
  const convOf = (ctx) => (ctx && ctx.convention === 'modern' ? 'modern' : '1912');
  // the rudder's sign for a side named: in 1912 the tiller's side (the rudder goes the other way); modern, the rudder's
  const sideSign = (side, ctx) => (convOf(ctx) === 'modern' ? (side === 'starboard' ? 1 : -1) : (side === 'starboard' ? -1 : 1));
  const broomOf = (n) => TABLES.BOILER_ROOMS.indexOf('Boiler room ' + n);
  const zoneOf = (name) => TABLES.ZONES.indexOf(name);
  // the compartments as the bridge says them (a phrase), each zone's by its model name
  const ZONE_SAID = {
    'Forepeak': 'the forepeak', 'Reciprocating engine room': 'the reciprocating engine room', 'Turbine engine room': 'the turbine engine room',
    'Electric engine room': 'the electric engine room', 'Shaft tunnel / refrigerated cargo': 'the refrigerated cargo hold',
    'Shaft tunnel / cargo': 'the after cargo hold', 'After peak': 'the after peak',
  };
  function zoneWords(k) {
    const name = TABLES.ZONES[k];
    if (!name) return 'compartment ' + k;
    let m = /^No\. (\d+) hold$/.exec(name); if (m) return 'number ' + numWords(+m[1]) + ' hold';
    m = /^Boiler room (\d+)$/.exec(name); if (m) return 'boiler room ' + numWords(+m[1]);
    return ZONE_SAID[name] || low(name);
  }
  function broomWords(j) { const m = /(\d+)$/.exec(TABLES.BOILER_ROOMS[j] || ''); return m ? 'boiler room ' + numWords(+m[1]) : 'boiler room ' + j; }
  const LOOK_SAID = { forward: 'Go forward and look', mailroom: 'Look at the mail room', boilers: 'Look at the boiler rooms', engines: 'Look at the engine rooms', aft: 'Go aft and look' };
  const LOOK_GOING = { forward: 'going forward', mailroom: 'going down to the mail room', boilers: 'going down to the boiler rooms', engines: 'going aft to the engine rooms', aft: 'going aft' };
  const LOOK_TO = { forward: 'forward', mailroom: 'to the mail room', boilers: 'to the boiler rooms', engines: 'to the engine rooms', aft: 'aft' };
  const RULE_SAID = { first: 'Women and children first', only: 'Women and children only', fill: 'Fill the boats with anyone' };
  const FILL_SAID = { 1: 'Lower them full', 0.75: 'Lower them three quarters full', 0.5: 'Lower them half full', 0.3: 'Lower them as they are' };

  // ------------------------------------------------------------------ the text, normalized
  // typographic marks to plain ones, by code point, so that this source stays ASCII
  const cls = (codes) => new RegExp('[' + codes.map(c => String.fromCharCode(c)).join('') + ']', 'g');
  const RE_APOS = cls([0x2018, 0x2019, 0x201B, 0x2032, 0x60, 0xB4]), RE_QUOTE = cls([0x201C, 0x201D, 0x201E, 0x22]);
  const RE_DASH = cls([0x2010, 0x2011, 0x2012, 0x2013, 0x2014, 0x2015, 0x2212]), RE_DEG = cls([0xB0, 0xBA]);
  // words written as one that the grammar reads as two, and spellings of one word
  const SPLIT = { astarboard: ['a', 'starboard'], aport: ['a', 'port'], stbd: ['starboard'], starbd: ['starboard'], midship: ['midships'],
    amidship: ['amidships'], mailroom: ['mail', 'room'], afterpeak: ['after', 'peak'], rpms: ['rpm'], deg: ['degrees'], degs: ['degrees'],
    pls: ['please'], plz: ['please'] };
  // fillers: dropped wherever they stand
  const FILL1 = { please: 1, sir: 1, now: 1, mister: 1, mr: 1, immediately: 1, quickly: 1, smartly: 1, kindly: 1 };
  const FILLN = [['at', 'once'], ['right', 'away'], ['straight', 'away'], ['if', 'you', 'please'], ['as', 'quick', 'as', 'you', 'can'], ['as', 'fast', 'as', 'you', 'can']];
  const PUNCT = { '.': 1, ',': 1, '?': 1 };
  // words no order ends on: a sentence that ends on one was cut short
  const TRAIL = { the: 1, a: 1, an: 1, and: 1, then: 1, to: 1, on: 1, of: 1, with: 1, for: 1, at: 1, from: 1, into: 1 };
  const SEP = { '.': 1, ',': 1, '?': 1, and: 1, then: 1 };
  const QWORDS = { who: 1, whos: 1, what: 1, whats: 1, where: 1, wheres: 1, when: 1, why: 1, how: 1, hows: 1, is: 1, isnt: 1, are: 1, arent: 1,
    can: 1, cant: 1, could: 1, has: 1, hasnt: 1, have: 1, havent: 1, do: 1, dont: 1, does: 1, doesnt: 1, did: 1, will: 1, would: 1,
    should: 1, shall: 1, which: 1, was: 1, were: 1 };

  // the words of the text: lower case, punctuation gone (a full stop, a comma and a question mark kept as marks), spoken
  // numbers as digits ("ten" is 10, "one five" 15, "twenty five" 25), fillers dropped
  function words(text) {
    let s = String(text === undefined || text === null ? '' : text).toLowerCase();
    s = s.replace(RE_APOS, '\'').replace(RE_QUOTE, ' ').replace(RE_DASH, '-').replace(RE_DEG, ' degrees ');
    s = s.replace(/\b(mr|mrs|messrs|no|nos|st|capt)\./g, '$1 ');                 // "Mr. Murdoch", "No. 5" are not full stops
    s = s.replace(/\bs\.o\.s\b\.?/g, ' sos ').replace(/\bc\.q\.d\b\.?/g, ' cqd ');
    s = s.replace(/\b3\s*\/\s*4\b/g, ' 3 quarters ').replace(/\b1\s*\/\s*2\b/g, ' half ');
    s = s.replace(/'s\b/g, '').replace(/'/g, '');                                 // "boiler room 6's fires", "o'clock"
    const raw = s.match(/\d+(?:\.\d+)?|[a-z]+|[.;!?,:]/g) || [];
    const w1 = [];
    for (const t of raw) {
      if (t === '.' || t === ';' || t === '!' || t === ':') w1.push('.');
      else if (SPLIT[t]) for (const x of SPLIT[t]) w1.push(x);
      else w1.push(t);
    }
    const w2 = [];                                                                 // numbers in words to digits
    for (let i = 0; i < w1.length; i++) {
      const w = w1[i];
      if (TEN_OF[w] !== undefined) {
        let v = TEN_OF[w]; const u = ONE_OF[w1[i + 1]];
        if (u !== undefined && u > 0) { v += u; i++; }
        w2.push(String(v));
      } else if (TEEN_OF[w] !== undefined) w2.push(String(TEEN_OF[w]));
      else if (ONE_OF[w] !== undefined) {
        let d = String(ONE_OF[w]);
        while (ONE_OF[w1[i + 1]] !== undefined) { d += String(ONE_OF[w1[i + 1]]); i++; }    // "one five": 15
        if (w1[i + 1] === 'hundred' && d.length === 1) { d = String(100 * +d); i++; }
        w2.push(String(+d));
      } else if (w === 'hundred') w2.push('100');
      else w2.push(w);
    }
    const out = [];                                                                // fillers dropped
    for (let i = 0; i < w2.length; i++) {
      if (FILL1[w2[i]]) continue;
      const ph = FILLN.find(p => p.every((x, j) => w2[i + j] === x));
      if (ph) { i += ph.length - 1; continue; }
      out.push(w2[i]);
    }
    return out;
  }

  // ------------------------------------------------------------------ the patterns
  // A pattern is words: "hard over? (to|a)? {side}". word? is optional; (a|b_c) is one of several, b_c two words; {kind}
  // captures what kind's matcher reads there, under the name kind ({name=kind} under another); {name:a|b} captures which of
  // the words was said. Any item may be optional. "the" is never in a pattern: it is dropped before matching.
  function compile(src) {
    return src.trim().split(/\s+/).map((tok) => {
      let opt = false;
      if (tok.length > 1 && tok.charAt(tok.length - 1) === '?') { opt = true; tok = tok.slice(0, -1); }
      if (tok.charAt(0) === '(') return { alt: tok.slice(1, -1).split('|').map(a => a.split('_')), opt };
      if (tok.charAt(0) === '{') {
        const body = tok.slice(1, -1), lit = body.indexOf(':');
        if (lit >= 0) return { name: body.slice(0, lit), alt: body.slice(lit + 1).split('|').map(a => a.split('_')), opt };
        const eq = body.indexOf('=');
        return eq >= 0 ? { name: body.slice(0, eq), cap: body.slice(eq + 1), opt } : { name: body, cap: body, opt };
      }
      return { alt: [[tok]], opt };
    });
  }
  // every way pattern `items` matches the tokens T from i: [{ end, caps }]
  function walk(items, k, T, i, caps, out) {
    if (k === items.length) { const c = {}; for (const [n, v] of caps) if (v !== null && v !== undefined) c[n] = v; out.push({ end: i, caps: c }); return; }
    const it = items[k];
    if (it.cap) {
      for (const [end, v] of CAPS[it.cap](T, i)) { caps.push([it.name, v]); walk(items, k + 1, T, end, caps, out); caps.pop(); }
    } else {
      for (const ws of it.alt) {
        let j = 0;
        while (j < ws.length && T[i + j] && T[i + j].w === ws[j]) j++;
        if (j === ws.length) {
          if (it.name) caps.push([it.name, ws.join(' ')]);
          walk(items, k + 1, T, i + j, caps, out);
          if (it.name) caps.pop();
        }
      }
    }
    if (it.opt) walk(items, k + 1, T, i, caps, out);
  }
  const matches = (pat, T, i) => { const out = []; walk(pat, 0, T, i, [], out); return out.filter(o => o.end > i); };
  // a matcher made of patterns, each with what it gives
  const by = (list) => { const L = list.map(([p, f]) => [compile(p), f]); return (T, i) => { const r = []; for (const [p, f] of L) for (const o of matches(p, T, i)) r.push([o.end, f(o.caps)]); return r; }; };
  const one = (map) => (T, i) => (T[i] && Object.prototype.hasOwnProperty.call(map, T[i].w) ? [[i + 1, map[T[i].w]]] : []);
  const CAPS = {
    side: one({ starboard: 'starboard', port: 'port' }),
    num: (T, i) => (T[i] && T[i].n !== null ? [[i + 1, T[i].n]] : []),
    letter: (T, i) => (T[i] && /^[a-z]$/.test(T[i].w) ? [[i + 1, T[i].w]] : []),
    dir: one({ ahead: 'ahead', astern: 'astern' }),
    dv: by([['(open|raise|lift)', () => true], ['(close|shut|drop|lower)', () => false]]),
  };
  CAPS.speed = by([['full', () => 'full'], ['half', () => 'half'], ['slow', () => 'slow'], ['dead slow', () => 'dead slow']]);
  // an engine named BEFORE its order needs the word ("port engine full astern"): a side alone there is the helm's word.
  // After its order the side alone will do ("full astern port": engAfter)
  const BOTH_ENG = [['both (engines|engine)?', () => 'both'], ['(engines|all_engines)', () => 'both'], ['(port_and_starboard|starboard_and_port) (engines|engine)?', () => 'both']];
  CAPS.eng = by([['{side} (engine|engines|wing_engine)', c => c.side]].concat(BOTH_ENG));
  CAPS.engAfter = by([['{side} (engine|engines|wing_engine)?', c => c.side]].concat(BOTH_ENG));
  // a boiler room said as one; for the fires a bare "number five" is a boiler room too (nothing else has fires)
  CAPS.broomSaid = by([['boiler room (number|no)? {num}', c => c.num], ['stokehold (number|no)? {num}', c => c.num],
    ['(number|no) {num} (boiler_room|stokehold)', c => c.num], ['{num} (boiler_room|stokehold)', c => c.num]]);
  CAPS.broom = by([['{broomSaid}', c => c.broomSaid], ['(number|no) {num}', c => c.num]]);
  CAPS.zone = by([
    ['(forepeak|fore_peak) (tank)?', () => ({ k: zoneOf('Forepeak') })],
    ['(number|no)? {num} hold', c => ({ hold: c.num })], ['hold (number|no)? {num}', c => ({ hold: c.num })],
    ['{broomSaid}', c => ({ broom: c.broomSaid })],
    ['(number|no) {num}', c => ({ bare: c.num })],                  // "number two": a hold or a boiler room? (pump asks)
    ['(reciprocating_engine_room|reciprocating_room|reciprocating_engines|main_engine_room|main_engines|engine_room)', () => ({ k: zoneOf('Reciprocating engine room') })],
    ['(turbine_engine_room|turbine_room)', () => ({ k: zoneOf('Turbine engine room') })],
    ['(electric_engine_room|electric_room|electrical_room|dynamo_room)', () => ({ k: zoneOf('Electric engine room') })],
    ['(refrigerated_cargo_hold|refrigerated_cargo|refrigerated_hold|shaft_tunnel_refrigerated_cargo)', () => ({ k: zoneOf('Shaft tunnel / refrigerated cargo') })],
    ['(after_cargo_hold|after_cargo|shaft_tunnel_cargo|cargo_hold_aft)', () => ({ k: zoneOf('Shaft tunnel / cargo') })],
    ['(after_peak|aft_peak) (tank)?', () => ({ k: zoneOf('After peak') })],
  ]);
  CAPS.part = by([
    ['(forward|fore_part|forward_part|forepart|forward_end|bow|bows)', () => 'forward'],
    ['(mail_room|post_office|mail_hold)', () => 'mailroom'],
    ['(boiler_rooms|stokeholds|boilers|stokehold|boiler_room)', () => 'boilers'],
    ['(engine_rooms|engines|engine_room)', () => 'engines'],
    ['(aft|after_part|stern|afterpart|after_end)', () => 'aft'],
  ]);
  CAPS.bside = by([['(on|for|at|to)? {side} (side)?', c => c.side], ['(on|for|at|to)? (both|either) (sides|side)?', () => 'both'],
    ['(on|for|at|to)? (port_and_starboard|starboard_and_port) (sides|side)?', () => 'both']]);
  const ADDRESS = [
    '(murdoch|lightoller|pitman|boxhall|lowe|moody|wilde|smith|phillips|bride|hichens|olliver|rowe|andrews|captain|quartermaster|helmsman|bosun|boatswain|sparks|carpenter|chief|officer|engineer|wireless|lookout)',
    '(first|chief|second|third|fourth|fifth|sixth|junior) officer', 'chief engineer', 'officer of watch', '(engine_room|stokehold|wireless_room)',
  ].map(compile);

  // ------------------------------------------------------------------ what a match makes
  const ord = (type, value, arg) => ({ type, value, arg });
  const err = (who, why) => ({ error: why, who });
  const helm = (v) => ({ orders: [ord('helm', v)] });
  const give = (o) => ({ orders: [o] });
  function degrees(n, sign) {
    if (!(Number.isInteger(n) && n >= 1)) return err(QM, 'How many degrees, sir?');
    if (n > MAX) return err(QM, 'She has forty degrees of helm, sir.');
    return helm(sign * n);
  }
  // "ease to ten": the side the helm is on, at a smaller angle. h is the helm as the line leaves it when "ease" is said
  // (parse works that out order by order), null where the line itself made it unknown ("away from the ice and ease ...")
  function ease(n, h) {
    if (h === null) return err(QM, 'Ease her from what, sir? Give the helm with its side.');
    const a = Math.round(Math.abs(h));
    if (a === 0) return err(QM, 'The helm is amidships, sir.');
    if (n === 0) return helm(0);
    if (!(Number.isInteger(n) && n >= 1)) return err(QM, 'Ease her to what, sir?');
    if (n > a) return err(QM, 'She has ' + numWords(a) + ' degrees of helm on, sir: that is more helm, not less.');
    return helm((h < 0 ? -1 : 1) * n);
  }
  function tel(name, eng) {
    if (TABLES.TELEGRAPH.indexOf(name) < 0) return err(OT, 'Ahead or astern, sir?');
    return give(ord('telegraph', name, eng === 'port' || eng === 'starboard' ? eng : undefined));
  }
  // revolutions: ahead unless "astern" is said with them. nodir marks revolutions said with no direction, which parse
  // refuses after an astern order in the same line ("full astern. Seventy revolutions": ahead or astern?)
  function revs(n, dir, eng) {
    if (!(Number.isInteger(n) && n >= 1)) return err(OT, 'How many revolutions, sir?');
    if (n > RPM_MAX) return err(OT, 'Her engines never made more than ' + numWords(RPM_MAX) + ' revolutions, sir.');
    return { orders: [ord('telegraph', dir === 'astern' ? -n : n, eng === 'port' || eng === 'starboard' ? eng : undefined)], nodir: dir === undefined };
  }
  // the helm order that turns her head to a side, in the convention in force, for the lines that say what an order means
  function toHead(side, n, hard, ctx) {
    const conv = convOf(ctx), s = side === 'port' ? -1 : 1;            // her head to port: the rudder to port (negative)
    if (Number.isInteger(n) && n >= 1 && n <= MAX) return '"' + helmWords(s * n, conv) + '"';
    const full = '"' + helmWords(s * MAX, conv) + '"';
    return hard ? full : '"' + cap(conv === 'modern' ? side : (side === 'port' ? 'starboard' : 'port')) + '" with its degrees, or ' + full;
  }
  function door(letter, open) {
    const id = String(letter).toUpperCase(), b = TABLES.BULKHEADS.findIndex(x => x[0] === id);
    if (b < 0) return err(OOW, 'There is no bulkhead ' + id + ', sir.');
    if (!TABLES.BULKHEADS[b][1]) return err(OOW, 'Bulkhead ' + id + ' has no watertight door, sir.');
    return give(ord('door', b, !!open));
  }
  function fires(n) {
    if (n === undefined) return give(ord('fires', -1));
    const j = broomOf(n);
    return j < 0 ? err(OOW, 'There is no boiler room ' + n + ', sir.') : give(ord('fires', j));
  }
  function pump(z, which) {
    let k = -1;
    if (z.k !== undefined) k = z.k;
    else if (z.hold !== undefined) { k = zoneOf('No. ' + z.hold + ' hold'); if (k < 0) return err(OOW, 'There is no number ' + z.hold + ' hold, sir.'); }
    else if (z.broom !== undefined) { k = zoneOf('Boiler room ' + z.broom); if (k < 0) return err(OOW, 'There is no boiler room ' + z.broom + ', sir.'); }
    else if (z.bare !== undefined) {                                           // "number two": she has a No. 2 hold and a boiler room 2
      const kh = zoneOf('No. ' + z.bare + ' hold'), kb = zoneOf('Boiler room ' + z.bare);
      if (kh >= 0 && kb >= 0) return err(OOW, 'Number ' + numWords(z.bare) + ' hold or boiler room ' + numWords(z.bare) + ', sir?');
      k = kh >= 0 ? kh : kb;
      if (k < 0) return err(OOW, 'There is no number ' + z.bare + ', sir: name the hold or the boiler room.');
    }
    return k < 0 ? err(OOW, 'Which room, sir?') : give(ord('pump', k, which));
  }

  // ------------------------------------------------------------------ the rules, in the order a tie is settled
  const RULES = [];
  const rule = (name, pats, make, more) => RULES.push(Object.assign({ name, pats: pats.map(compile), make }, more || {}));
  // the helm. A helm order names the HELM (in 1912, the tiller's side): never the rudder, the wheel, or the way her head
  // is to go. A sentence that names one of those orders nothing, and the quartermaster says what the helm order would be
  // (the rules "helm, by her head" and "helm, by the rudder or the wheel", below)
  rule('helm hard', ['put? (helm|your_helm)? hard over? (to|a)? {side} (your_helm|helm)?', 'put her hard over? a {side}'], (c, x) => helm(sideSign(c.side, x) * MAX));
  rule('helm side and degrees', ['(give_her|put_her|helm)? {side} (your_helm|helm)? {num} (degrees|degree)?',
    '(give_her|put_her|helm)? {num} (degrees|degree)? of? {side} (your_helm|helm)?'], (c, x) => degrees(c.num, sideSign(c.side, x)));
  rule('helm side', ['helm {side}', '{side} (your_helm|helm)'], (c, x) => helm(sideSign(c.side, x) * BARE));
  // a side and nothing more ("Port.") is the helm's only as the whole line: inside a longer line it could belong to the
  // order beside it ("close the doors, port"; "port and starboard engines"), so there it orders nothing
  rule('helm side, alone', ['{side}'], (c, x) => helm(sideSign(c.side, x) * BARE), { alone: (c) => err(QM, cap(c.side) + ' what, sir?') });
  rule('helm midships', ['(put|turn)? (helm|wheel|her|rudder)? a? (midships|amidships) (your_helm|helm|wheel|rudder)?', '(centre|center) (helm|wheel|rudder)',
    'ease (her|helm|your_helm|wheel)? (to)? (midships|amidships)'], () => helm(0));
  rule('helm steady', ['steady (as_she_goes|as_you_go|so|her|helm|there)?'], () => helm(0));
  rule('helm ease', ['ease (her|helm|your_helm|wheel)? (to)? {num} (degrees|degree)?'], (c) => ({ ease: c.num }));
  rule('helm reverse', ['(shift|reverse|change) (your|her)? (helm|wheel|rudder) (over)?', '(shift|reverse) (her|it) over'], () => helm('reverse'));
  rule('helm away', ['(helm|turn|steer|put_her|keep|swing|go)? (her)? (away|clear) (from|of) (ice|berg|iceberg)', '(clear|avoid|miss) (ice|berg|iceberg)'], () => helm('away'));
  // the engines
  const PRE = '(ring|ring_down|go|make_it)?';
  rule('telegraph', [PRE + ' {speed} speed? {dir} {eng=engAfter}?', PRE + ' {eng} {speed} speed? {dir}', 'back (her|engines|both|both_engines)? {speed} (astern)? {eng=engAfter}?'],
    (c) => tel(c.speed + ' ' + (c.dir || 'astern'), c.eng));
  rule('telegraph stop', ['(all)? stop (her|engines|engine|both|both_engines|all_engines|ship|everything)?', 'stop {eng=engAfter}', '{eng} stop', '(ring|ring_down) stop'],
    (c) => tel('stop', c.eng));
  // (the third: a direction said first belongs to the revolutions: "full astern, seventy revolutions" is seventy astern,
  // one order, not full astern and then seventy ahead)
  rule('telegraph revolutions', ['(make|make_it|ring_for|give_her|go)? {num} (revolutions|revolution|revs|turns|rpm) {dir}? {eng=engAfter}?',
    '{eng} (make|make_it|ring_for)? {num} (revolutions|revolution|revs|turns|rpm) {dir}?',
    PRE + ' {speed}? speed? {dir} (,)? (make|make_it|at|ring_for|give_her)? {num} (revolutions|revolution|revs|turns|rpm) {eng=engAfter}?'], (c) => revs(c.num, c.dir, c.eng));
  // the doors
  rule('doors', ['(close|shut|drop|release) (all)? (watertight)? doors (from_bridge)?', '(throw|pull|turn_on|press) (watertight_door|watertight_doors|door|doors)? (switch|lever)'],
    () => give(ord('doors', 'bridge')));
  rule('door', ['{dv} (watertight)? (door|doors) (in|of|at|on)? bulkhead {letter}', '{dv} bulkhead {letter} (watertight)? (door|doors)?'], (c) => door(c.letter, c.dv));
  // the stokehold and the pumps
  rule('fires', ['draw (all|every)? (fires|fire)', 'draw (all|every)? (fires|fire) (in|of|at|from|for)? {broom}', 'draw {broom} (fires|fire)'], (c) => fires(c.broom));
  rule('pumps own', ['(start|man|work|rig|use|put|get|try)? (pumps|pump|pumping) (in|on|at|to|for|into) {zone}', '(start_pumping|pump_out|pump) {zone}',
    '(start|man|work) {zone} (pumps|pump)'], (c) => pump(c.zone, 'own'));
  rule('pumps all', ['(put|lead|send|get)? (all|every) (pumps|pump) (that_can_reach|on|to|onto|in|at|for|into) {zone}'], (c) => pump(c.zone, 'all'));
  rule('pumps off', ['stop (pumps|pump|pumping) (in|on|at|for)? {zone}', '(take|pull) (pumps|pump) (off|out_of|from) {zone}', '(pumps|pump) off {zone}'],
    (c) => pump(c.zone, 'off'));
  rule('pumps to the engineers', ['leave (pumps|pumping) (to)? (engineers|engineer|chief|chief_engineer)', '(give|hand) (pumps|pumping) (back)? (to)? (engineers|chief|chief_engineer)',
    '(engineers|chief|chief_engineer) (have|take|keep) (pumps|pumping)'], () => give(ord('pump', -1, 'engineers')));
  // the boats
  rule('boats uncover', ['(uncover|clear_away|swing_out|ready|prepare|get_out|clear) (all)? (boats|lifeboats|boat)', 'get (all)? (boats|lifeboats) (out|ready)'],
    () => give(ord('boats:uncover', 'now')));
  // (a side after a comma belongs to the boats' order: "women and children first, starboard side")
  rule('boats rule', ['women and children {rv:first|only} (,)? {bside}?', '{bside} (,)? women and children {rv:first|only}'], (c) => give(ord('boats:rule', c.rv, c.bside || 'both')));
  rule('boats rule fill', ['(fill|load) (boats|them|lifeboats|boat) (with)? (anyone|anybody|everyone|everybody|whoever) (,)? {bside}?',
    '(anyone|anybody|whoever|everyone) (who|that)? (will|can|wants_to|would)? go (,)? {bside}?', 'let (men|anyone|anybody|everyone) (in|into_boats|in_boats|go|too) (,)? {bside}?'],
  (c) => give(ord('boats:rule', 'fill', c.bside || 'both')));
  rule('boats full', ['lower (them|boats|lifeboats|each_boat|every_boat|each|every)? full', '(fill|load) (every|each) (boat|one|1)', '(fill|load) (them|boats|lifeboats) (up|full)'],
    () => give(ord('boats:fill', 1)));
  rule('boats three quarters', ['lower (them|boats|lifeboats)? 3 (quarters|quarter) full', '3 (quarters|quarter) full'], () => give(ord('boats:fill', 0.75)));
  rule('boats half', ['lower (them|boats|lifeboats)? half full', 'half full'], () => give(ord('boats:fill', 0.5)));
  rule('boats as they are', ['lower (them|boats|lifeboats)? as (they|she) (are|is|stand|stands)'], () => give(ord('boats:fill', 0.3)));
  // the calls for help: the call for assistance is named as one (distress, CQD, SOS, "for assistance"), or is "the call";
  // "send a message" and "make a signal" alone are not it
  rule('help call', ['(send|make|transmit|start|send_out|get_off|get_out) (a|out)? (distress|cqd|sos|cqd_and_sos|sos_and_cqd) (call|message|signal)? (for_assistance|for_help)?',
    '(send|make|transmit|start|send_out|get_off|get_out) (a|out)? (call|message|signal) (for_assistance|for_help)', '(send|send_out|start|make) call',
    '(call|wireless|radio|signal) for (help|assistance)'], () => give(ord('help:call', 'cqd')));
  rule('help rocket', ['(fire|send_up|set_off|let_off|light|shoot|launch|send) (a|another|1)? (rocket|rockets|distress_rocket|distress_rockets|distress_signals|socket_signal|socket_signals|signal_rocket|signal_rockets)'],
    () => give(ord('help:rocket', 'socket')));
  rule('help lamp', ['(try|use|work|flash|man) (morse_lamp|lamp|morse_light|signal_lamp|morse)', 'call (her|them|that_ship|ship|that_steamer|steamer|that_light)? (up)? with (morse_lamp|lamp|morse_light|morse)',
    '(signal|flash|morse) (her|them|that_ship|ship|that_steamer|steamer|that_light|light) (with_morse_lamp|with_lamp|with_morse)?'], () => give(ord('help:lamp', 'cqd')));
  // the errands: an officer to look, the carpenter to sound, a note to the engine room
  rule('report look', ['(go|send_someone|send_a_man|send_an_officer|send_officer|send_somebody|send) (to|down_to|down|into|round)? {part} (and_look|and_see|and_inspect|to_look|to_see|to_inspect|and_report|and_have_a_look|and_look_around|and_look_round)?',
    '(look|inspect|check|see|have_a_look|take_a_look|look_round|look_around|go_and_look|go_and_see|go_and_inspect|go_and_check) (at|in|into|round|around|to|down_to|on)? {part}'],
  (c) => give(ord('report:look', c.part)));
  rule('report sound', ['sound (her|ship|wells|well|tanks|bilges|forward_wells)', '(take|get) (soundings|a_sounding)', 'send (for)? carpenter',
    'send (for)? carpenter (to|and) sound (her|ship|wells|well)?', '(have|get|tell) carpenter (to)? sound (her|ship|wells|well)?'], () => give(ord('report:sound', 'wells')));
  rule('report ask', ['(ask|ring|call|telephone|phone|message) (engine_room|chief_engineer|engineers|chief|engine_rooms)',
    'send (a)? (note|message|word|runner) (to|down_to) (engine_room|chief_engineer|chief|engineers)', '(get|ask_for) (a)? (word|report) from (engine_room|chief_engineer|chief)'],
  () => give(ord('report:ask', 'engine room')));
  // an order said as a question: a question mark does not make it one
  rule('report ask, as a question', ['what does (engine_room|chief_engineer|chief) say'], () => give(ord('report:ask', 'engine room')), { asks: true });
  // understood as an order, and something is missing or wrong: nothing is ordered, and the bridge says why
  // where her head is to go ("turn to port", "ten degrees to starboard"), the rudder or the wheel: not the helm's words.
  // Nothing is ordered; the quartermaster says the helm order that would do it, in the convention in force
  rule('helm, by her head', ['(turn|come|swing|bring|steer|go|head|put|alter_course) (her|her_head|ship|round)? {hard:hard}? (over)? (round)? to {side}',
    '(turn|come|swing|bring|steer|head) (her|her_head|ship)? {hard:hard}? {side}', '{num} (degrees|degree)? to {side}', '(her_head|her_bow|bow|ship) to {side}'],
  (c, x) => err(QM, 'To turn her head to ' + c.side + ', sir, the helm order is ' + toHead(c.side, c.num, !!c.hard, x) + '.'));
  rule('helm, by the rudder or the wheel', ['(put|turn|swing)? (rudder|wheel) (hard)? (over)? (to|a)? {side}', '(put|turn|swing)? (hard)? (over)? (to|a)? {side} (rudder|wheel)',
    '{num} (degrees|degree)? (of)? (to)? {side} (rudder|wheel)', '{side} (rudder|wheel) {num} (degrees|degree)?'],
  () => err(QM, 'Is that the helm, sir? Give it as a helm order: "hard a-starboard", "port ten", "midships".'));
  rule('helm, no side', ['(put|turn)? (helm|wheel|her|rudder)? hard (over|a)? (your_helm|helm|wheel)?', '(put|turn)? (helm|wheel|her|rudder) over'], () => err(QM, 'Which way, sir?'));
  rule('helm, ease to what', ['ease (her|helm|your_helm|wheel)?'], () => err(QM, 'Ease her to what, sir?'));
  rule('telegraph, no direction', [PRE + ' {speed} speed? {eng}?', '(ahead|astern) {eng}?'], () => err(OT, 'Which order, sir? Full, half or slow, ahead or astern.'));
  rule('telegraph, back how much', ['back (her|engines|both|both_engines)?'], () => err(OT, 'How much astern, sir?'));
  rule('doors, which', ['(open|raise|lift) (all|every)? (watertight)? (doors|door)'], () => err(OOW, 'Which bulkhead, sir? The doors are raised by hand, one bulkhead at a time.'));
  rule('door, which', ['(close|shut|drop|lower) (watertight)? door'], () => err(OOW, 'Which door, sir? Name its bulkhead.'));
  rule('boats, how full', ['lower (them|boats|lifeboats|away)'], () => err(OOW, 'How full, sir? Full, three quarters, half, or as they are.'));

  // ------------------------------------------------------------------ parse
  function addressEnds(T, i) { const e = []; for (const p of ADDRESS) for (const o of matches(p, T, i)) e.push(o.end); return e; }
  // the best reading of the tokens from i to the end: the fewest errors, then the fewest orders; a tie goes to the
  // earlier rule. null if the tokens cannot all be read
  function readAll(T, ctx) {
    const memo = new Array(T.length + 1);
    // head[i]: every token before i is a name, a rank or a separator; tail[i]: every token from i on is. A rule marked
    // `alone` gives its order only where both hold (it is the whole line), and its question anywhere else
    const head = new Uint8Array(T.length + 1), tail = new Uint8Array(T.length + 1);
    head[0] = 1;
    for (let i = 0; i < T.length; i++) { if (!head[i]) continue; if (SEP[T[i].w]) head[i + 1] = 1; for (const e of addressEnds(T, i)) head[e] = 1; }
    tail[T.length] = 1;
    for (let i = T.length - 1; i >= 0; i--) if ((SEP[T[i].w] && tail[i + 1]) || addressEnds(T, i).some(e => tail[e])) tail[i] = 1;
    function at(i) {
      if (memo[i] !== undefined) return memo[i];
      if (i === T.length) return (memo[i] = { items: [], errors: 0, n: 0 });
      let best = null;
      const take = (item, end) => {
        const r = at(end); if (!r) return;
        const c = item ? { items: [item].concat(r.items), errors: r.errors + (item.error ? 1 : 0), n: r.n + 1 } : r;
        if (!best || c.errors < best.errors || (c.errors === best.errors && c.n < best.n)) best = c;
      };
      if (SEP[T[i].w]) take(null, i + 1);
      for (const e of addressEnds(T, i)) take(null, e);
      for (const r of RULES) for (const p of r.pats) for (const o of matches(p, T, i)) {
        const made = r.alone && !(head[i] && tail[o.end]) ? r.alone(o.caps, ctx) : r.make(o.caps, ctx);
        take(Object.assign({ rule: r, from: i, to: o.end }, made), o.end);
      }
      return (memo[i] = best);
    }
    return at(0);
  }
  // how far the tokens can be read from the start (for the words not understood)
  function reach(T, ctx) {
    const ok = new Uint8Array(T.length + 1); ok[0] = 1;
    let far = 0;
    for (let i = 0; i < T.length; i++) {
      if (!ok[i]) continue;
      far = i;
      if (SEP[T[i].w]) ok[i + 1] = 1;
      for (const e of addressEnds(T, i)) ok[e] = 1;
      for (const r of RULES) for (const p of r.pats) for (const o of matches(p, T, i)) ok[o.end] = 1;
    }
    return ok[T.length] ? T.length : far;
  }
  function parse(text, ctx) {
    ctx = ctx || {};
    const W = words(text), heardWords = [], T = [];
    for (const w of W) {
      if (PUNCT[w]) { T.push({ w, n: null, h: -1 }); continue; }
      heardWords.push(w);
      if (w === 'the') continue;                                               // "the" is never in a pattern
      T.push({ w, n: /^\d+(\.\d+)?$/.test(w) ? +w : null, h: heardWords.length - 1 });
    }
    const heard = heardWords.join(' ');
    const said = (from, to) => { const a = T.slice(from, to).filter(t => t.h >= 0); return a.length ? heardWords.slice(a[0].h, a[a.length - 1].h + 1).join(' ') : ''; };
    const qmark = T.some(t => t.w === '?');
    let first = 0;                                                              // the first word past a name or rank
    for (;;) { if (T[first] && SEP[T[first].w]) { first++; continue; } const e = addressEnds(T, first); if (e.length) { first = Math.max.apply(null, e); continue; } break; }
    const qword = !!(T[first] && QWORDS[T[first].w]);
    const best = T.length ? readAll(T, ctx) : null;
    if (best && best.n > 0 && best.errors === 0) {
      // a sentence cut short ("stop the", "full astern and") is half an order: nothing is ordered
      const last = heardWords[heardWords.length - 1], prev = heardWords[heardWords.length - 2];
      if (TRAIL[last] && !(last === 'a' && prev === 'bulkhead')) return { ok: false, heard, kind: 'unclear', who: OOW, why: 'Sir? And then?' };
      if (!qmark || best.items.every(it => it.rule.asks)) {
        // order by order, with the helm as the line leaves it: "ease" eases the helm then on (ctx.helm before the line);
        // revolutions said with no direction after an astern order are asked about, never guessed ahead
        let h = typeof ctx.helm === 'number' && isFinite(ctx.helm) ? ctx.helm : 0, astern = false, fault = null;
        const orders = [];
        for (const it of best.items) {
          const made = it.ease !== undefined ? ease(it.ease, h) : it;
          if (made.error) { fault = made; break; }
          for (const o of made.orders) {
            if (o.type === 'helm') h = typeof o.value === 'number' ? o.value : (o.value === 'reverse' && h !== null ? (h === 0 ? 0 : -h) : null);
            else if (o.type === 'telegraph') {
              if (it.nodir && astern) { fault = err(OT, cap(numWords(Math.abs(o.value))) + ' revolutions ahead or astern, sir?'); break; }
              astern = typeof o.value === 'number' ? o.value < 0 : /astern/.test(o.value);
            }
            orders.push({ type: o.type, value: o.value, arg: o.arg, said: said(it.from, it.to) });
          }
          if (fault) break;
        }
        if (fault) return { ok: false, heard, kind: 'unclear', who: fault.who, why: fault.error };
        return { ok: true, heard, orders };
      }
    }
    if (qmark || qword) return { ok: false, heard, kind: 'question', who: OOW, why: 'I couldn\'t say, sir.' };
    if (best && best.errors > 0) { const e = best.items.find(it => it.error); return { ok: false, heard, kind: 'unclear', who: e.who, why: e.error }; }
    if (best || !T.length) return { ok: false, heard, kind: T.length ? 'unclear' : 'unknown', who: OOW, why: 'Sir?' };
    const p = reach(T, ctx);
    let q = p; while (q < T.length && !PUNCT[T[q].w]) q++;
    const part = said(p, q) || heard;
    return { ok: false, heard, kind: 'unknown', who: OOW, why: 'Beg pardon, sir: "' + part + '"?' };
  }

  // ------------------------------------------------------------------ phrase: an order in the bridge's words
  function helmWords(v, conv) {
    if (v === 'reverse') return 'Shift the helm';
    if (v === 'away') return 'Away from the ice';
    if (v === 'toward') return 'Towards the ice';
    if (typeof v !== 'number' || !isFinite(v)) return 'The helm';
    const a = Math.round(Math.abs(v));
    if (a === 0) return 'Midships';
    const side = (conv === 'modern') === (v > 0) ? 'starboard' : 'port';     // 1912: the tiller's side; modern: the rudder's
    if (a >= MAX) return conv === 'modern' ? 'Hard to ' + side : 'Hard a-' + side;
    return cap(side) + ' ' + numWords(a);
  }
  function telWords(v, arg) {
    const eng = arg === 'port' || arg === 'starboard' ? cap(arg) + ' engine ' : '';
    if (typeof v === 'number' && isFinite(v)) {
      if (v === 0) return eng ? eng + 'stop' : 'Stop';
      const a = Math.round(Math.abs(v));
      return cap(eng + numWords(a) + (a === 1 ? ' revolution' : ' revolutions') + (v < 0 ? ' astern' : ' ahead'));
    }
    return eng ? eng + String(v) : cap(String(v));
  }
  function pumpWords(k, arg) {
    if (arg === 'engineers') return 'Leave the pumps to the engineers';
    const room = zoneWords(k);
    if (arg === 'own') return 'Start the pumps in ' + room;
    if (arg === 'all') return 'All pumps on ' + room;
    if (arg === 'off') return 'Stop the pumps in ' + room;
    if (Number.isInteger(arg)) { const p = TABLES.PUMPS[arg] || 'pump ' + arg; return k === -1 ? 'Take ' + low(p) + ' off' : cap(low(p)) + ' on ' + room; }
    return 'The pumps';
  }
  function phrase(o, ctx) {
    o = o || {};
    const conv = convOf(ctx), v = o.value, a = o.arg;
    switch (o.type) {
      case 'helm': return helmWords(v, conv);
      case 'telegraph': return telWords(v, a);
      case 'doors': return 'Close the watertight doors';
      case 'door': return (a ? 'Open' : 'Close') + ' the doors in bulkhead ' + ((TABLES.BULKHEADS[v] || [String(v)])[0]);
      case 'fires': return v < 0 ? 'Draw all fires' : 'Draw the fires in ' + broomWords(v);
      case 'pump': return pumpWords(v, a);
      case 'boats:uncover': return 'Uncover the boats';
      case 'boats:rule': return (RULE_SAID[v] || 'The boats: ' + v) + (a === 'port' || a === 'starboard' ? ' on the ' + a + ' side' : '');
      case 'boats:fill': return FILL_SAID[v] || 'Lower them when they are ' + Math.round(100 * v) + ' per cent full';
      case 'help:call': return 'Send the call for assistance';
      case 'help:rocket': return 'Fire a rocket';
      case 'help:lamp': return 'Call her up with the Morse lamp';
      case 'report:look': return LOOK_SAID[v] || 'Look at ' + v;
      case 'report:sound': return 'Sound the wells';
      case 'report:ask': return 'Ask the engine room';
    }
    return cap(String(o.type) + (v === undefined ? '' : ' ' + String(v)));
  }

  // ------------------------------------------------------------------ readback: the answer on the bridge
  // Every line is said by someone on the bridge: the quartermaster at the wheel, the officer at the telegraph, the officer
  // of the watch, a junior officer, the fourth officer; or it names the channel the answer came by (the telegraph's reply;
  // the engine room on the telephone). A refusal is the model's own reason where it gives one.
  // where the helm takes her head: with headway (ctx.way 'ahead', the default). With no way on her, or sternway, the
  // quartermaster says that instead: the rudder then turns her little, or the other way
  function headWay(v, way) {
    const a = Math.round(Math.abs(v));
    if (a === 0) return ' The helm is amidships.';
    if (way === 'none') return ' She has no way on her.';
    if (way === 'astern') return ' She has sternway on her.';
    return ' Her head goes to ' + (v < 0 ? 'port' : 'starboard') + '.';
  }
  const NO_REASON = {
    'doors': 'The bridge\'s switch for the watertight doors has no current, sir',
    'pump': 'The engine room cannot carry it out, sir',
    'help:call': 'The call has gone out already, sir',
    'help:rocket': 'No rocket can go up now, sir',
    'help:lamp': 'The Morse lamp has no current, sir',
    'report:sound': 'The carpenter is already sounding, sir',
    'report:ask': 'A note is already on its way to the engine room, sir',
  };
  function refusal(o, why) {
    if (o.type === 'pump') return { who: JUNIOR, words: 'The engine room, by telephone: ' + stop(why) };
    if (o.type === 'help:call') return { who: JUNIOR, words: stop(why) };
    if (o.type === 'help:rocket' || o.type === 'help:lamp') return { who: FOURTH, words: stop(why) };
    if (o.type === 'helm') return { who: QM, words: stop(why) };
    if (o.type === 'telegraph') return { who: OT, words: stop(why) };
    return { who: OOW, words: stop(why) };
  }
  function readback(o, done, ctx) {
    o = o || {}; ctx = ctx || {};
    const conv = convOf(ctx), v = o.value, said = phrase(o, ctx);
    if (done === undefined || done === null) return { who: OOW, words: 'There is no watch on the bridge to take it, sir.', refused: true };
    if (done === false || (typeof done === 'object' && done.ok === false)) {
      let why = (typeof done === 'object' && done.why) || ctx.why;
      if (!why) {
        if (o.type === 'report:look') why = 'An officer is already on his way ' + (LOOK_TO[v] || 'there') + ', sir';
        else if (/^boats:/.test(o.type)) why = 'The boats cannot take that order now, sir';
        else why = NO_REASON[o.type] || 'It cannot be done, sir';
      }
      return Object.assign(refusal(o, why), { refused: true });
    }
    let who = OOW, words;
    switch (o.type) {
      case 'helm': {
        who = QM;
        const after = typeof v === 'number' ? v : (typeof ctx.helm === 'number' && isFinite(ctx.helm) ? ctx.helm : null);
        words = helmWords(v, conv) + ', sir.' + (after === null ? '' : (typeof v === 'number' && Math.round(Math.abs(v)) === 0 ? '' : headWay(after, ctx.way)));
        break;
      }
      case 'telegraph': who = OT; words = said + ', sir. The engine room answers.'; break;
      case 'doors': words = 'The watertight doors are closing, sir.'; break;
      case 'door': words = 'The doors in bulkhead ' + ((TABLES.BULKHEADS[v] || [String(v)])[0]) + ' are being ' + (o.arg ? 'raised' : 'closed') + ' by hand, sir.'; break;
      // (ctx.nothing: the order changes nothing in the stokeholds, their fires out or drawn already)
      case 'fires': who = JUNIOR; words = ctx.nothing ? 'The engine room, by telephone: ' + (v < 0 ? 'there are no fires left to draw, sir.' : 'there are no fires to draw in ' + broomWords(v) + ', sir.')
        : 'By telephone to the engine room, sir: ' + low(said) + '.'; break;
      case 'pump': who = JUNIOR; words = 'The engine room, by telephone: ' + stop(done && done.text ? done.text : 'aye, ' + low(said)); break;
      case 'boats:uncover': case 'boats:rule': case 'boats:fill': words = 'I\'ll pass the word to the boats, sir: ' + low(said) + '.'; break;
      case 'help:call': who = JUNIOR; words = 'I\'ll take it to the wireless room, sir: ' + low(said) + '.'; break;
      case 'help:rocket': who = FOURTH; words = ctx.first ? 'A man has gone aft for the rockets, sir.' : 'Another rocket, sir.'; break;
      case 'help:lamp': who = FOURTH; words = 'Calling her up with the Morse lamp, sir.'; break;
      case 'report:look': words = 'An officer is ' + (LOOK_GOING[v] || 'going') + ', sir.'; break;
      case 'report:sound': words = 'The carpenter is sent to sound the wells, sir.'; break;
      case 'report:ask': words = 'A note is going down to the chief engineer, sir.'; break;
      default: words = said + ', sir.';
    }
    return { who, words, refused: false };
  }

  // ------------------------------------------------------------------ every order parse can give
  function domain() {
    const out = [], T = TABLES;
    for (let v = -MAX; v <= MAX; v++) out.push(ord('helm', v === 0 ? 0 : v));
    out.push(ord('helm', 'reverse'), ord('helm', 'away'));
    for (const a of [undefined, 'port', 'starboard']) {
      for (const n of T.TELEGRAPH) out.push(ord('telegraph', n, a));
      for (let r = 1; r <= RPM_MAX; r++) out.push(ord('telegraph', r, a), ord('telegraph', -r, a));
    }
    out.push(ord('doors', 'bridge'));
    T.BULKHEADS.forEach((b, i) => { if (b[1]) out.push(ord('door', i, true), ord('door', i, false)); });
    out.push(ord('fires', -1)); for (let j = 0; j < T.BOILER_ROOMS.length; j++) out.push(ord('fires', j));
    for (let k = 0; k < T.ZONES.length; k++) for (const a of ['own', 'all', 'off']) out.push(ord('pump', k, a));
    out.push(ord('pump', -1, 'engineers'));
    out.push(ord('boats:uncover', 'now'));
    for (const r of T.BOAT_RULES) for (const s of T.BOAT_SIDES) out.push(ord('boats:rule', r, s));
    for (const f of T.BOAT_FILLS) out.push(ord('boats:fill', f));
    out.push(ord('help:call', 'cqd'), ord('help:rocket', 'socket'), ord('help:lamp', 'cqd'));
    for (const p of T.LOOK) out.push(ord('report:look', p));
    out.push(ord('report:sound', 'wells'), ord('report:ask', 'engine room'));
    return out;
  }

  // ------------------------------------------------------------------ for speech to text (step 2): at most 100
  const VOCAB = freeze(['hard a-starboard', 'hard a-port', 'starboard', 'port', 'midships', 'amidships', 'steady', 'ease her', 'shift the helm',
    'helm', 'full ahead', 'half ahead', 'slow ahead', 'dead slow', 'stop', 'full astern', 'half astern', 'slow astern', 'revolutions',
    'port engine', 'starboard engine', 'watertight doors', 'bulkhead', 'boiler room', 'stokehold', 'draw the fires', 'pumps', 'forepeak',
    'hold', 'reciprocating', 'turbine', 'electric', 'refrigerated', 'after peak', 'engineers', 'uncover the boats', 'swing out',
    'lifeboats', 'women and children', 'lower them', 'three quarters', 'CQD', 'SOS', 'distress call', 'wireless', 'rocket',
    'Morse lamp', 'mail room', 'carpenter', 'sound the wells', 'engine room', 'chief engineer', 'iceberg', 'Murdoch', 'Lightoller',
    'Boxhall', 'Pitman', 'Lowe', 'Moody', 'Wilde', 'Phillips', 'Bride', 'Hichens', 'Olliver', 'Rowe', 'Andrews', 'quartermaster']);

  // nothing here changes once built: every table frozen, so that no call can leave a trace for the next
  for (const t of [ONE_OF, TEEN_OF, TEN_OF, ZONE_SAID, LOOK_SAID, LOOK_GOING, LOOK_TO, RULE_SAID, FILL_SAID, SPLIT, FILL1, FILLN, PUNCT, TRAIL, SEP,
    QWORDS, CAPS, ADDRESS, RULES, NO_REASON]) freeze(t);
  return freeze({ TABLES, VOCAB, CONVENTIONS: ['1912', 'modern'], parse, phrase, readback, domain, words, numWords });
});
