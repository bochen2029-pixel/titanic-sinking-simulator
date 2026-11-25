/*
 * Reports to the bridge: the night as the bridge knew it (step 3 of docs/BRAINSTORM_the_whole_night_v1_2026-11-17.md,
 * sections 2.3, 2.4 and 7). A reader of the watch (core/night.js, "readers"): attached to every watch, stepped after
 * the model's own step, its state in sim.reports. It reads the model and never writes into the flooding, the motion,
 * the ice or the plant, and it pushes nothing into sim.events: the feed is its own.
 *
 * Nothing on the bridge measured water: every word about flooding came by a man on foot or a telephone, and for the
 * first ten minutes of 1912 none came at all. A report here is a fact of the model (water over the orlop deck in the
 * mail room, water over the plates in a boiler room), noticed by someone placed to notice it, carried to the bridge in
 * the time that took, in the words of the day. Its content is the model's state when the fact was so, never when it
 * arrives. The bridge learns words and feet, never tons or tons a minute.
 *
 *   RULES     the bridge note's 11.2 as one table: who notices water in which space and when, the route, the delay, the
 *             words. A probability is drawn from the night's seed, one keyed draw per decision, so a night replays.
 *   UNASKED   what the bridge did by itself after the touch on the night: an officer below, the carpenter sent for, the
 *             commutator read, a note to the chief engineer; then an officer to a space a man has reported, and the
 *             builder's man below once water is reported. They run on any night with a touch, as the pump rules do.
 *   PARTS, SOUND, ASK   the orders the player can give (and the bridge gives itself): an officer to look at a part of
 *             the ship, the carpenter to sound the wells, a note to the engine room; each logged ('report:look',
 *             'report:sound', 'report:ask') like the helm's, and replayed with it.
 *   DESIGNER  the builder's man's estimate: the model's own forecast from the moment his view is formed, with the bias
 *             of the night in one constant (a bet fitted to one night).
 *   ROUTINE   the bells on the half hour, the reliefs, and how they lapse once the boats are ordered (one switch).
 *   knowledge(sim)   what the bridge knows now: each compartment unknown, reported dry, water reported, or lost; her
 *             list from the commutator; her trim in words.        feed(sim)   the reports so far, as they arrived.
 *
 * Sources: docs/research/RESEARCH_the_night_on_the_bridge_v1_2026-11-17.md (the bridge note, cited "note"): section 11
 * is the specification. Tags: [read] where the note reads it in a source, [derived] where it is worked from the note's
 * script, [bet] where nothing gives it. Times: T = minutes after the touch; the note's 11.1 rows are cited by their t.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../core.js'), require('../night.js'));
  else root.TitanicReports = factory(root.TitanicCore, root.TitanicNight);
})(typeof self !== 'undefined' ? self : this, function (C, N) {
  'use strict';
  if (!C || !N || !N.reader) return null;
  const FT = C.FT, MIN = 60, EPS = 1e-9, DEG = Math.PI / 180;
  const ft = (m) => m / FT;
  const r5 = (x) => 5 * Math.round(x / 5);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const list = (a) => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];

  // the spaces as the men named them (the core's zones, core/core.js ZONES); the mail room is in No. 3 hold [read: the
  // note's 11.1 key, "the mail room is in zone 3"]
  const NAMES = ['the forepeak', 'No. 1 hold', 'No. 2 hold', 'No. 3 hold', 'boiler room 6', 'boiler room 5', 'boiler room 4',
    'boiler room 3', 'boiler room 2', 'boiler room 1', 'the engine room', 'the turbine room', 'the electric engine room',
    'the refrigerated hold', 'the after hold', 'the after peak'];
  const VOL = 1;            // m3 in a space before anyone there notices it [bet: the plant's "water first seen" (core/systems.js)]
  const AREAS = { forward: [1, 2, 3], amidships: [4, 5, 6, 7, 8, 9, 10, 11, 12], aft: [13, 14, 15] };

  // ------------------------------------------------------------------ the model, as a man would see it
  function level(sim, k) {                   // the highest free surface below E deck in zone k (world, m); -Infinity dry
    let h = -Infinity;
    for (let sd = 0; sd < 2; sd++) { const n = C.nodeIndex(k, sd, 0); if (sim.vol[n] > 1e-6 && sim.level[n] > h) h = sim.level[n]; }
    return h;
  }
  function sounding(sim, k) {                // the deepest water there, m: what a rod finds in the well (level less its lowest point)
    let d = 0;
    for (let sd = 0; sd < 2; sd++) { const n = C.nodeIndex(k, sd, 0); if (sim.vol[n] > 1e-6) d = Math.max(d, sim.level[n] - sim.zmin[n]); }
    return d;
  }
  function water(sim, k) { let v = 0; for (let s = 0; s < 4; s++) v += sim.vol[k * 4 + s]; return v; }
  const upper = (sim, k) => sim.vol[C.nodeIndex(k, 0, 1)] + sim.vol[C.nodeIndex(k, 1, 1)] >= VOL;      // water above E deck
  function deckAt(sim, F, k, deck) { const x = sim.ship.zones[k].xm; return C.worldZ(F, x, 0, C.deckZ(deck, x)); }
  // the forecastle head (the core's own mark, core/core.js MARKS 'fcastle'): its height above the sea, m
  const FC = [126, 0, C.zTopAt(126)];
  const freeboard = (F) => C.worldZ(F, FC[0], FC[1], FC[2]);

  // ------------------------------------------------------------------ the words
  const feet = (x) => Math.max(1, Math.round(x)) + ' ft';
  const feetN = (x) => { const n = Math.max(1, Math.round(x)); return n === 1 ? 'a foot' : n + ' feet'; };
  const rising = (rate) => rate >= 0.5 ? ', rising fast' : (rate >= 0.1 ? ', rising' : '');   // ft a minute [bet: what a man calls fast]
  // a room as the engineers or an officer report it: flooded and left, so many feet over the plates, or dry
  function roomWords(rooms, pumps) {
    const wet = rooms.filter(r => r.ft >= 0.5);
    if (!wet.length) return null;
    return wet.map(r => r.left ? cap(NAMES[r.k]) + ' flooded; its men have left' : cap(NAMES[r.k]) + ': ' + feet(r.ft) + ' of water' + (pumps && r.pumps ? ', its pumps on it' : '')).join('. ') + '.';
  }
  const WORDS = {
    look: {
      forward: (d) => {
        const F = d.zones.filter(z => z.overF !== null), E = d.zones.filter(z => z.onE);
        if (!F.length && !E.length) return 'No damage seen forward, down to F deck.';
        return [F.length ? 'Water on F deck over ' + list(F.map(z => NAMES[z.k])) : '', E.length ? 'water on E deck forward' : ''].filter(Boolean).map((s, i) => i ? s : cap(s)).join('; ') + '.';
      },
      mailroom: (d) => {
        if (!d.overOrlop) return 'The mail room is dry.';
        if (d.toG > 0) return 'Water in the mail room within ' + feetN(d.toG) + ' of G deck' + rising(d.rate) + '.';
        return 'Water ' + feetN(-d.toG) + ' over G deck at the mail room' + rising(d.rate) + '.';
      },
      boilers: (d) => roomWords(d.rooms, false) || 'The boiler rooms are dry.',
      engines: (d) => roomWords(d.rooms, false) || 'The engine rooms are dry.',
      aft: (d) => {
        const wet = d.rooms.filter(r => r.ft >= 0.5);
        return wet.length ? 'Water aft: ' + wet.map(r => NAMES[r.k] + ' ' + feet(r.ft)).join(', ') + '.' : 'Dry aft: no water in the shaft tunnel.';
      },
    },
    sound: (d) => {
      const wet = d.wells.filter(w => w.ft >= 0.5);
      if (!wet.length) return 'The wells are dry.';
      return (wet.some(w => w.ft >= 2) ? 'Making water fast: ' : 'Making water: ') + wet.map(w => feet(w.ft) + ' in ' + NAMES[w.k]).join(', ') + '.';
    },
    ask: (d) => roomWords(d.rooms, true) || 'The engine and boiler rooms are dry.',
    forepeak: (d) => d.store ? 'Water in the forepeak storerooms.' : 'Air hissing out of the forepeak tank: she is making water there. The storerooms are dry.',
    mail: (d) => 'The mail room is filling' + (d.rate >= 0.5 ? ' rapidly' : '') + '.',
    steward: (d) => 'Water on ' + d.deck + ' deck ' + d.area + '.',
    commutator: (d) => d.deg === 0 ? 'The commutator shows her upright.' : 'The commutator shows ' + Math.abs(d.deg) + (Math.abs(d.deg) === 1 ? ' degree' : ' degrees') + ' to ' + (d.deg > 0 ? 'starboard' : 'port') + '.',
    eye: (d) => cap(TRIM[d.cat]) + ': the forecastle head about ' + d.ft + ' ft above the water.',
  };
  const TRIM = ['on an even keel', 'a little down by the head', 'down by the head', 'well down by the head'];

  // ------------------------------------------------------------------ RULES: the bridge note's 11.2, one row a space
  // space, who notices and when, the route to the bridge and its delay (min), the words (WORDS), the tag.
  const RULES = {
    engineer: { space: 'boiler and engine rooms (zones 4 to 12)', who: 'The chief engineer', by: 'by telephone', ch: 'phone', words: 'ask',
      notices: 'the watch below, at once, water through the side or over the plates', pass: 0.5, judge: [10, 20], phone: 1,
      tag: '[bet] unasked only when the chief engineer judges it: with probability 0.5, 10 to 20 min after the water, by telephone (1 min) (note 11.2; in 1912 no unasked report is recorded); not when a note from the bridge has reached him since the water was seen: he has answered that [bet]; asked: ASK' },
    forepeak: { space: 'the forepeak (zone 0)', who: 'The chief officer, from the lamp trimmer', by: 'in person', ch: 'runner', words: 'forepeak',
      notices: 'anyone berthed forward hears the air forced out of the tank\'s air pipe', notice: [1, 5], relay: 5, pass: 0.5, then: [0, 5],
      tag: '[read] Hemming heard it and told Wilde, T 3 to 8 (BI 17711-17733; note 11.1); 1 to 5 min [read]; to the nearest officer about 5 min, and on to the bridge with probability 0.5 within 5 more [bet] (note 11.2)' },
    holds: { space: 'the holds (zones 1 to 3; the peaks and the after holds 13 to 15 [bet])', who: 'The carpenter', by: 'in person', ch: 'runner', words: 'sound',
      notices: 'his soundings, once ordered', tag: '[read] for 1912; the timing [derived] (note 11.2): see SOUND' },
    mail: { space: 'the mail room (zone 3: the orlop deck of No. 3 hold, the sorting room on G deck above it)', who: 'A mail clerk', by: 'in person', ch: 'runner', words: 'mail',
      notices: 'the clerks on duty, as soon as water covers the orlop deck, the mail room\'s floor', delay: 5,
      tag: '[read] the clerks found the mail room filling and one went on to the captain, about 5 min (Boxhall BI 15371; note 11.1 row t 13, 11.2)' },
    crew: { space: 'the crew\'s quarters forward (above zones 0 to 2)', who: 'the men in them', by: null, ch: null, words: null,
      notices: 'water on their deck', tag: '[read] it happened (Poingdestre BI 2844-2872); it reached the bridge only as "all hands to the boats" went the other way: no report here (note 11.2)' },
    steward: { space: 'passenger spaces on F and E decks: forward (1 to 3) [bet: and amidships 4 to 12 and aft 13 to 15]', who: 'The purser, from a steward', by: 'in person', ch: 'runner', words: 'steward',
      notices: 'stewards and passengers, when water reaches the deck', delay: [10, 20],
      tag: '[bet] steward -> chief steward or purser -> bridge, 10 to 20 min (note 11.2)' },
    officer: { space: 'the decks he walks', who: 'an officer', by: 'back from below', ch: 'runner', words: 'look',
      notices: 'what the model\'s levels were on the decks and at the times of his visit, so an early visit finds nothing',
      tag: '[derived] from Boxhall\'s two trips (note 11.2): see PARTS' },
    commutator: { space: 'her list', who: 'The commutator', by: 'on the bridge', ch: 'instrument', words: 'commutator', step: 2, gap: 5,
      notices: 'read at once, to about a degree', tag: '[read] the list indicator in the wheelhouse, read to about 1 degree, instantly (note 2, 11.2); a line when it has moved 2 degrees since the last, at most one in 5 min [bet]' },
    eye: { space: 'her trim', who: 'The officer of the watch', by: 'by eye', ch: 'instrument', words: 'eye', steps: [5, 15, 30],
      notices: 'the forecastle head\'s height above the water, judged to 5 ft',
      tag: '[read] by eye: the forecastle\'s freeboard and the forward well deck awash (note 11.2); the words change when the forecastle head stands 5, 15 and 30 ft lower than at the touch [bet: Olliver\'s "down 15 to 20 ft at the bows" at T 80 is the second step]' },
    phone: { space: 'a telephone to the bridge', unanswered: 0.3,
      tag: '[read] Hogg\'s call from the nest went unanswered, Rowe\'s from the poop did not (note 11.2); a probability 0.3 of no answer once the boats are ordered [bet]' },
    noise: { space: 'the boat deck while the steam blows off', add: 1, applied: false,
      tag: '[read] that it happened; add 1 min to a voice report on deck [bet] (note 11.2). Not applied here: the 1912 delays every rule above is worked from already carry the roar, which lasts from about T 1 to T 27 in the model (core/systems.js, Y1)' },
  };

  // ------------------------------------------------------------------ the orders, and their trips (min after the order)
  // An officer sent to look: where he goes, which spaces he sees, when he sees them (visit) and when he is back (back).
  const PARTS = {
    forward: { name: 'forward', zones: [1, 2, 3], visit: 4, back: 8,
      tag: '[derived] Boxhall went below on his own about a minute after the touch, down to F deck forward and up by the well deck, and was back at T 9 having seen no damage: there at about T 5, back 8 min after leaving (note 11.1 row t 9, fact 5; BI 15358-15367; the 6 to 9 min of 11.2)' },
    mailroom: { name: 'the mail room', zones: [3], visit: 3.5, back: 7,
      tag: '[derived] Boxhall went to the mail room on the clerk\'s report (T 13), saw it at about T 17 and reported at T 20 (note 11.1 row t 20; BI 15372-15377)' },
    boilers: { name: 'the boiler rooms', zones: [4, 5, 6, 7, 8, 9], visit: 5, back: 10, tag: '[bet] down an escape trunk to the stokeholds and back' },
    engines: { name: 'the engine rooms', zones: [10, 11, 12], visit: 6, back: 12, tag: '[bet] aft along the working alleyway and down' },
    aft: { name: 'aft', zones: [13, 14, 15], visit: 7, back: 14, tag: '[bet] the shaft tunnel and the after holds, the length of her' },
  };
  // The carpenter sent to sound: the wells he sounds, when, and when he reaches the bridge.
  const SOUND = { zones: [0, 1, 2, 3, 13, 14, 15], at: 6, back: 10,
    tag: '[derived] sent for at T 2 to 5, he had sounded the forward wells by about T 8 and reached the captain at T 12 (note 11.1 rows t 12, fact 8; Olliver US Day 7; Boxhall BI 15369); "10 to 13 min after the order" (11.2): the earliest. The after wells and the peaks [bet]' };
  // A note to the chief engineer: the runner there, the answer back.
  const ASK = { zones: [4, 5, 6, 7, 8, 9, 10, 11, 12], at: 4, back: 8,
    tag: '[derived] Olliver took the captain\'s note to the chief engineer, waited 2 or 3 min and came back: about 8 min (note 2, 11.1 row t 16: fact 12, delay 4; US Day 7 p.2)' };

  // What the bridge did unasked after the touch on the night (min after the touch).
  const UNASKED = [
    { after: 1, order: 'look', value: 'forward', who: 'The Fourth Officer',
      tag: '[read] Boxhall went below on his own about a minute after the touch (BI 15358; the note\'s conflict 12: his own account)' },
    { after: 2, order: 'sound', tag: '[read] the captain sent for the carpenter to sound the ship, T 2 to 5 (Olliver, US Day 7 p.2) [derived: the earliest]' },
    { after: 7, order: 'commutator', tag: '[read] the captain read the commutator 5 to 10 min after the touch (Hichens, US Day 5; the note\'s conflict 3)' },
    { after: 8, order: 'ask', tag: '[read] the captain\'s note to the chief engineer, carried by Olliver, T 10 to 18 (note 11.1 row t 16, fact 12)' },
  ];
  // ... and on the reports: an officer to see a space a man (not an officer) has reported, unless one is on his way there
  // or has looked in the last FOLLOW.recent min; and the builder's man below once water is reported (DESIGNER).
  const FOLLOW = { mail: 'mailroom', 'steward:forward': 'forward', 'steward:aft': 'aft', recent: 15,
    tag: '[derived] on the mail clerk\'s report the captain sent Boxhall to the mail room (BI 15372; note 11.1 rows t 13 and t 20); extended to the stewards\' reports forward and aft [bet]; 15 min [bet]' };

  // The builder's man's estimate. On the night he gave her "from an hour to an hour and a half" (BI 15610, passed on by
  // the captain), and she lasted two hours and forty minutes. The rule: he goes below with the captain when the first
  // report of water reaches the bridge, and his estimate is the model's own forecast from that moment (the core run
  // ahead from that state, as the page's forecast is run), the time left from when he speaks times `bias`, said in the
  // half hours either side of it. The forecast runs `pace` steps of the core a step of the watch, so that it looks
  // `horizon` min ahead in the `delay` min before he speaks (spread so, it costs the page a little a step instead of a
  // stall); past that he says "more than", and a forecast that lies steady (the page's rule: core/core.js run,
  // stopWhenStable) is "she will float".
  const DESIGNER = {
    who: 'The builder\'s man', by: 'to the captain', ch: 'voice',
    delay: 13,      // min from the first report of water reaching the bridge to his words to the captain [derived: the carpenter's
                    // report at T 12, the estimate at about T 25 (note 11.1 rows t 12 and t 25; Andrews had been below with
                    // the captain, the note's section 3 after Butler 1998); the note's own "fact 20, delay 5" is low confidence]
    bias: 0.57,     // [bet fitted to one night] the middle of what he said (75 min) over the time the model's forecast leaves
                    // her when he speaks on the 1912 watch (tools/reports_tests.js prints both): a little over half
    horizon: 180,   // min ahead the forecast can look before he speaks [a design figure: pace = horizon / delay]
    tag: '[read] the words (Boxhall BI 15610); [bet] the rule and its one constant, bias, fitted to the 1912 watch',
  };
  DESIGNER.pace = Math.round(DESIGNER.horizon / DESIGNER.delay);
  function halfHours(m) {                    // "an hour and a half" ...
    const h = Math.round(m / 30) / 2, whole = Math.floor(h), half = h - whole > 0;
    if (whole === 0) return 'half an hour';
    const n = ['', 'an hour', 'two hours', 'three hours', 'four hours', 'five hours', 'six hours', 'seven hours', 'eight hours'][whole] || whole + ' hours';
    return half ? (whole === 1 ? 'an hour and a half' : n.replace(' hours', ' and a half hours')) : n;
  }
  function estimateWords(e) {
    if (e.floats) return 'He says she will float.';
    if (e.beyond) return 'He gives her more than ' + halfHours(e.lo) + '.';
    if (e.lo <= 0) return 'He gives her less than half an hour.';
    return 'He gives her from ' + halfHours(e.lo) + ' to ' + halfHours(e.hi) + '.';
  }

  // The routine of a watch (note 11.3), and its lapse once the boats are ordered. This reader cannot see the boats
  // (another reader's): it takes them as ordered when the bridge learns she will founder, from the builder's man (on the
  // night the boat order came at T 20 to 25 and his estimate at about T 25: note 11.1, conflicts 6 and 7) [bet].
  const ROUTINE = {
    bell: 30,       // min: the bell on the half hour, struck by the quartermaster and answered from the nest [read: Hichens US
                    // Day 5; Boxhall US Day 3] (note 11.3); seven bells at 11:30 on the night [read: Lee BI 2420]
    relief: 120,    // min: the lookouts and the wheel relieved at the even hours [read: Lee BI 2393-2396; Fleet BI 17319;
                    // Hichens BI 935] (11.3); after the touch on the night the lookouts on time, the wheel 23 min late [read]
    call: 15,       // min before a relief: one bell, the next watch called [read: Hichens US Day 5, at 9:45 pm] (11.3, M)
    lapse: true,    // [bet] the note's proposal (11.3): after the boats are ordered the bells lapse when no quartermaster
                    // stands by (from the next half hour), the nest and the wheel at their next relief. false: never
    tag: '[read] the routine; [bet] its lapse (no bell is recorded after midnight on the night; note 11.3)',
  };
  const BELLS = ['Eight bells', 'One bell', 'Two bells', 'Three bells', 'Four bells', 'Five bells', 'Six bells', 'Seven bells'];
  // in seconds of the ship's clock: the bell, the relief, and the call before it (21:45, 23:45, 1:45 ...)
  const BELL = ROUTINE.bell * MIN, RELIEF = ROUTINE.relief * MIN, CALL = RELIEF - ROUTINE.call * MIN;

  // ------------------------------------------------------------------ the seed's draws
  // one number in [0, 1) for each decision, keyed by what it decides: from the night's seed through core/night.js's rng
  function draw(R, key) {
    let h = (2166136261 ^ R.seed) >>> 0;
    for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
    const u = N.rng(h >>> 0)();
    R.draws.push({ key, u });
    return u;
  }
  const within = (R, key, ab) => ab[0] + (ab[1] - ab[0]) * draw(R, key);

  // ------------------------------------------------------------------ state
  function attach(sim, sp) {
    const clock0 = (sp && sp.clock0) || 0, s0 = clock0 + sim.t;
    let call = Math.floor((s0 - CALL) / RELIEF) * RELIEF + CALL; while (call <= s0) call += RELIEF;
    const F = C.poseFrame(sim, sim.zO, sim.pitch, sim.roll, {});
    sim.reports = {
      seed: ((sp && sp.seed) || 0) >>> 0, clock0,
      feed: [], queue: [], tasks: [], seq: 0, draws: [], calls: 0, unanswered: [], phone: { current: true, why: 'on the lighting circuit' },
      zones: C.ZONES.map(() => ({ state: 'unknown', words: '', t: -1, tKnown: -1, who: '' })),
      tTouch: -1, stem: false, done: false, estimate: null, sinking: -1, water: -1, shadow: null,
      seen: new Float64Array(16).fill(-1), deckF: new Float64Array(16).fill(-1), deckE: new Float64Array(16).fill(-1),
      mail: -1, area: {}, engineer: false, askAt: -1, errands: {}, looked: {},
      bellT: (Math.floor(s0 / BELL) + 1) * BELL - clock0, callT: call - clock0, lapsedBells: false, lapsedReliefs: false,
      list: { read: false, said: 0, t: -1 }, trim: { fb0: freeboard(F), cat: 0, well: false, fcastle: false },
      samples: [{ t: -1, d: new Float64Array(16) }, { t: -1, d: new Float64Array(16) }],
      final: null, F: {},
    };
  }

  // a line to the bridge, delivered when its time comes (in order of time, then of saying)
  function say(R, q) {
    q.seq = R.seq++;
    let i = R.queue.length;
    while (i > 0 && R.queue[i - 1].t > q.t) i--;
    R.queue.splice(i, 0, q);
    return q;
  }
  function task(R, due, type, data) {
    const x = Object.assign({ due, type, seq: R.seq++ }, data || {});
    let i = R.tasks.length;
    while (i > 0 && R.tasks[i - 1].due > due) i--;
    R.tasks.splice(i, 0, x);
    return x;
  }
  // what the bridge knows of a space: lost > water > dry > unknown; a newer report of the same weight replaces the words
  const RANK = { unknown: 0, dry: 1, water: 2, lost: 3 };
  function know(R, k, state, words, tFact, tKnown, who) {
    const z = R.zones[k];
    if (RANK[state] < RANK[z.state]) return;
    z.state = state; z.words = words; z.t = tFact; z.tKnown = tKnown; z.who = who;
  }

  // ------------------------------------------------------------------ what a man sees, at the moment he sees it
  function riseRate(R, sim, k) {            // ft a minute in the deepest part of zone k, over the last 30 to 60 s
    const s = R.samples[0];
    if (s.t < 0 || sim.t - s.t < 1) return 0;
    return ft(sounding(sim, k) - s.d[k]) / ((sim.t - s.t) / MIN);
  }
  function rooms(sim, zones) {
    const P = sim.plant, out = [];
    for (const k of zones) {
      const d = sounding(sim, k);
      // its men leave when the water stands the core's own pumpAbandon over its lowest point (core/core.js params) [bet there]
      out.push({ k, ft: ft(d), left: d > sim.params.pumpAbandon, pumps: !!(P && P.pumpT && P.pumpT[k] >= 0) });
    }
    return out;
  }
  function roomsKnown(rs) {
    return rs.map(r => ({ k: r.k, state: r.ft < 0.5 ? 'dry' : (r.left ? 'lost' : 'water'), words: r.ft < 0.5 ? 'dry' : (r.left ? 'flooded, its men have left' : feet(r.ft) + ' of water') }));
  }
  function look(sim, R, part, F) {
    const P = PARTS[part];
    if (part === 'forward') {
      const zones = P.zones.map(k => { const h = level(sim, k), f = h - deckAt(sim, F, k, 'F'); return { k, overF: h > -Infinity && f > 0 ? ft(f) : null, onE: upper(sim, k) }; });
      return { data: { zones }, zones: zones.map(z => ({ k: z.k, state: z.onE ? 'lost' : (z.overF !== null ? 'water' : 'dry'), words: z.onE ? 'water on E deck' : (z.overF !== null ? 'water on F deck' : 'no water seen on F deck') })) };
    }
    if (part === 'mailroom') {
      const h = level(sim, 3), o = h - deckAt(sim, F, 3, 'orlop'), g = deckAt(sim, F, 3, 'G') - h, rate = riseRate(R, sim, 3);
      const d = { overOrlop: h > -Infinity && o > 0, toG: ft(g), rate };
      const words = !d.overOrlop ? 'the mail room dry' : (d.toG > 0 ? 'water within ' + feetN(d.toG) + ' of G deck' : 'water ' + feetN(-d.toG) + ' over G deck');
      return { data: d, zones: [{ k: 3, state: !d.overOrlop ? 'dry' : (upper(sim, 3) ? 'lost' : 'water'), words }] };
    }
    const rs = rooms(sim, P.zones);
    return { data: { rooms: rs }, zones: roomsKnown(rs) };
  }

  // ------------------------------------------------------------------ the orders (the player's, and the bridge's own)
  function startLook(sim, R, part, who) {
    const key = 'look:' + part;
    if (R.done || R.errands[key]) return false;          // an officer is already on his way there
    R.errands[key] = true;
    task(R, sim.t + PARTS[part].visit * MIN, 'visit', { part, who, t0: sim.t });
    return true;
  }
  function startSound(sim, R) {
    if (R.done || R.errands.sound) return false;
    R.errands.sound = true;
    task(R, sim.t + SOUND.at * MIN, 'sounding', { t0: sim.t });
    return true;
  }
  function startAsk(sim, R) {
    if (R.done || R.errands.ask) return false;
    R.errands.ask = true;
    task(R, sim.t + ASK.at * MIN, 'engine', { t0: sim.t });
    return true;
  }
  function orderLook(sim, value) { const R = sim.reports; return !!R && Object.prototype.hasOwnProperty.call(PARTS, value) && startLook(sim, R, value, 'An officer'); }
  function orderSound(sim, value) { const R = sim.reports; return !!R && value === 'wells' && startSound(sim, R); }
  function orderAsk(sim, value) { const R = sim.reports; return !!R && value === 'engine room' && startAsk(sim, R); }
  // which of its orders, read from an address, this reader would accept (site/parts/40_night_end.js asks it)
  function valid(type, value, arg) {
    if (arg !== undefined) return false;
    if (type === 'report:look') return typeof value === 'string' && Object.prototype.hasOwnProperty.call(PARTS, value);
    if (type === 'report:sound') return value === 'wells';
    if (type === 'report:ask') return value === 'engine room';
    return false;
  }

  // ------------------------------------------------------------------ the tasks
  function runTask(sim, R, x) {
    const F = C.poseFrame(sim, sim.zO, sim.pitch, sim.roll, R.F), t = sim.t;
    if (x.type === 'look') { startLook(sim, R, x.value, x.who); return; }
    if (x.type === 'sound') { startSound(sim, R); return; }
    if (x.type === 'ask') { startAsk(sim, R); return; }
    if (x.type === 'visit') {                                  // he looks: what is there now, said when he is back
      R.looked[x.part] = t;
      const o = look(sim, R, x.part, F), P = PARTS[x.part];
      say(R, { t: x.t0 + P.back * MIN, tFact: t, ch: 'runner', who: x.who, by: 'back from ' + P.name, rule: 'officer', part: x.part,
        words: WORDS.look[x.part](o.data), data: o.data, zones: o.zones, errand: 'look:' + x.part, qty: 'the levels at ' + P.name + ' (zones ' + P.zones.join(', ') + ') against its decks' });
      return;
    }
    if (x.type === 'sounding') {                               // the carpenter's rod in each well
      const wells = SOUND.zones.map(k => ({ k, ft: ft(sounding(sim, k)) }));
      say(R, { t: x.t0 + SOUND.back * MIN, tFact: t, ch: 'runner', who: 'The carpenter', by: 'in person', rule: 'holds', words: WORDS.sound({ wells }), data: { wells },
        zones: wells.map(w => ({ k: w.k, state: w.ft < 0.5 ? 'dry' : 'water', words: w.ft < 0.5 ? 'dry in the well' : feet(w.ft) + ' in the well' })), errand: 'sound', qty: 'the soundings of zones ' + SOUND.zones.join(', ') });
      return;
    }
    if (x.type === 'engine') {                                 // the chief engineer answers the note
      R.askAt = t;
      const rs = rooms(sim, ASK.zones);
      say(R, { t: x.t0 + ASK.back * MIN, tFact: t, ch: 'runner', who: 'The chief engineer', by: 'by a messenger', rule: 'engineer', words: WORDS.ask({ rooms: rs }), data: { rooms: rs },
        zones: roomsKnown(rs), errand: 'ask', qty: 'the water in zones 4 to 12' });
      return;
    }
    if (x.type === 'commutator') {                             // the captain reads the list indicator
      const deg = Math.round(sim.roll / DEG);
      R.list = { read: true, said: deg, t };
      say(R, { t, tFact: t, ch: 'instrument', who: 'The commutator', by: 'read by the captain', rule: 'commutator', words: WORDS.commutator({ deg }), data: { deg, roll: sim.roll / DEG }, qty: 'her roll' });
      return;
    }
    if (x.type === 'call') {                                   // the chief engineer telephones, unasked
      R.engineer = false;
      if (R.askAt >= x.since) return;                          // a note from the bridge reached him since: he has answered it
      const rs = rooms(sim, ASK.zones);
      say(R, { t: t + RULES.engineer.phone * MIN, tFact: t, ch: 'phone', who: RULES.engineer.who, by: RULES.engineer.by, rule: 'engineer', words: WORDS.ask({ rooms: rs }), data: { rooms: rs },
        zones: roomsKnown(rs), qty: 'the water in zones 4 to 12' });
      return;
    }
    if (x.type === 'peak') {                                   // the lamp trimmer hears the air: tells the chief officer
      const h = level(sim, 0), store = h > deckAt(sim, F, 0, 'orlop');
      task(R, t + RULES.forepeak.relay * MIN, 'relay', { tFact: t, data: { store, ft: ft(sounding(sim, 0)) } });
      return;
    }
    if (x.type === 'relay') {                                  // the chief officer takes it to the bridge, or does not
      const u = draw(R, 'forepeak:pass');
      if (u >= RULES.forepeak.pass) return;
      say(R, { t: t + within(R, 'forepeak:then', RULES.forepeak.then) * MIN, tFact: x.tFact, ch: 'runner', who: RULES.forepeak.who, by: RULES.forepeak.by, rule: 'forepeak',
        words: WORDS.forepeak(x.data), data: x.data, zones: [{ k: 0, state: 'water', words: x.data.store ? 'water in the storerooms' : 'making water in the tank' }], qty: 'water in zone 0' });
      return;
    }
    if (x.type === 'designer') {                               // he goes below: the model's own forecast from here
      R.shadow = { sim: C.restore(sim.ship, C.serialize(sim)), t0: t, done: false, founderT: -1, calm: 0, stable: false, horizon: t + DESIGNER.horizon * MIN };
      say(R, { t: t + DESIGNER.delay * MIN, tFact: t, ch: DESIGNER.ch, who: DESIGNER.who, by: DESIGNER.by, rule: 'designer', words: '', build: true, qty: 'the model\'s own forecast from the state when he went below, with the bias' });
    }
  }
  function shadowStep(sh) {                  // the forecast, `pace` steps of the core a step of the watch
    const s = sh.sim;
    for (let i = 0; i < DESIGNER.pace && !sh.done; i++) {
      C.step(s);
      if (s.foundered) { sh.done = true; sh.founderT = s.founderT; break; }
      if (s.t > 1800) {                       // as the page's forecast lies steady (core/core.js run, stopWhenStable)
        sh.calm = Math.abs(s.inflow) < 0.02 && Math.abs(s.wth) < 1e-5 && Math.abs(s.vz) < 1e-3 ? sh.calm + s.params.dt : 0;
        if (sh.calm > 1200) { sh.done = true; sh.stable = true; }
      }
      if (s.t >= sh.horizon) sh.done = true;
    }
  }
  function estimate(R, q) {
    const sh = R.shadow, e = { tFact: q.tFact, tKnown: q.t, floats: false, beyond: false, forecast: null, biased: null, lo: 0, hi: 0 };
    if (sh && sh.founderT >= 0) {                              // the time the forecast leaves her from when he speaks
      e.forecast = (sh.founderT - q.t) / MIN; e.biased = DESIGNER.bias * Math.max(0, e.forecast);
      e.lo = 30 * Math.floor(e.biased / 30); e.hi = e.lo + 30;
    } else if (sh && sh.stable) e.floats = true;
    else { e.beyond = true; e.lo = 30 * Math.floor(DESIGNER.bias * DESIGNER.horizon / 30); }
    e.words = estimateWords(e);
    R.shadow = null;
    return e;
  }

  // ------------------------------------------------------------------ noticing (once a second of her time, after a touch)
  function firstWater(sim, R, k, t) {
    if (k === 0) { task(R, t + within(R, 'forepeak:notice', RULES.forepeak.notice) * MIN, 'peak', {}); return; }
    if (k >= 4 && k <= 12 && !R.engineer) {
      if (draw(R, 'engineer:' + k) >= RULES.engineer.pass) return;
      R.engineer = true;
      task(R, t + within(R, 'engineer:' + k + ':judge', RULES.engineer.judge) * MIN, 'call', { since: t });
    }
  }
  function notice(sim, R) {
    const F = C.poseFrame(sim, sim.zO, sim.pitch, sim.roll, R.F), t = sim.t;
    for (let k = 0; k < 16; k++) if (R.seen[k] < 0 && water(sim, k) >= VOL) { R.seen[k] = t; firstWater(sim, R, k, t); }
    // the mail clerks: water over the orlop deck in No. 3 hold
    if (R.mail < 0 && level(sim, 3) > deckAt(sim, F, 3, 'orlop')) {
      R.mail = t;
      const d = { rate: riseRate(R, sim, 3) };
      say(R, { t: t + RULES.mail.delay * MIN, tFact: t, ch: 'runner', who: RULES.mail.who, by: RULES.mail.by, rule: 'mail', words: WORDS.mail(d), data: d,
        zones: [{ k: 3, state: 'water', words: 'the mail room filling' }], follow: FOLLOW.mail, qty: 'zone 3 water reaching the orlop deck' });
    }
    // the stewards: water on F deck or E deck, by area (the crew's spaces over the forepeak excepted: RULES.crew)
    for (const area in AREAS) for (const deck of ['F', 'E']) {
      const key = area + ':' + deck; if (R.area[key]) continue;
      const wet = AREAS[area].filter(k => deck === 'F' ? level(sim, k) > deckAt(sim, F, k, 'F') : (upper(sim, k) || level(sim, k) > deckAt(sim, F, k, 'E')));
      if (!wet.length) continue;
      R.area[key] = t;
      const d = { deck, area, zones: wet.slice() };
      say(R, { t: t + within(R, 'steward:' + key, RULES.steward.delay) * MIN, tFact: t, ch: 'runner', who: RULES.steward.who, by: RULES.steward.by, rule: 'steward', words: WORDS.steward(d), data: d,
        zones: wet.map(k => ({ k, state: deck === 'E' ? 'lost' : 'water', words: 'water on ' + deck + ' deck' })), follow: FOLLOW['steward:' + area], qty: 'water at ' + deck + ' deck in zones ' + wet.join(', ') });
    }
    // the commutator, once the captain has read it: a line when it has moved
    if (R.list.read) {
      const deg = Math.round(sim.roll / DEG);
      if (Math.abs(deg - R.list.said) >= RULES.commutator.step && t - R.list.t >= RULES.commutator.gap * MIN) {
        R.list = { read: true, said: deg, t };
        say(R, { t, tFact: t, ch: 'instrument', who: RULES.commutator.who, by: RULES.commutator.by, rule: 'commutator', words: WORDS.commutator({ deg }), data: { deg, roll: sim.roll / DEG }, qty: 'her roll' });
      }
    }
    // her trim by eye: the forecastle head against where it stood at the touch; and the model's own marks
    const fb = freeboard(F), drop = ft(R.trim.fb0 - fb), S = RULES.eye.steps;
    const cat = drop >= S[2] ? 3 : (drop >= S[1] ? 2 : (drop >= S[0] ? 1 : 0));
    if (cat > R.trim.cat) {
      R.trim.cat = cat;
      const d = { cat, ft: Math.max(0, r5(ft(fb))), drop };
      say(R, { t, tFact: t, ch: 'instrument', who: RULES.eye.who, by: RULES.eye.by, rule: 'eye', words: WORDS.eye(d), data: d, qty: 'the forecastle head\'s height (her trim)' });
    }
    for (const [id, words] of [['well', 'The forward well deck is awash.'], ['fcastle', 'The forecastle head goes under.']]) {
      if (!R.trim[id] && sim.markT[id] >= 0) {
        R.trim[id] = true;
        say(R, { t: sim.markT[id], tFact: sim.markT[id], ch: 'instrument', who: RULES.eye.who, by: RULES.eye.by, rule: 'eye', words, data: { mark: id }, qty: 'the core\'s mark "' + id + '"' });
      }
    }
  }

  // ------------------------------------------------------------------ the routine
  function routine(sim, R) {
    const t = sim.t, lapse = ROUTINE.lapse && R.sinking >= 0;
    if (t >= R.callT - EPS) {
      if (!(lapse && R.callT > R.sinking)) say(R, { t: R.callT, tFact: R.callT, ch: 'routine', who: 'The quartermaster', by: 'on the bridge', rule: 'routine', kind: 'routine', words: 'One bell: the next watch is called.' });
      R.callT += RELIEF;
    }
    if (t >= R.bellT - EPS) {
      const s = R.clock0 + R.bellT, k = Math.round(s / BELL), n = ((k % 8) + 8) % 8, relief = (((Math.round(s) % RELIEF) + RELIEF) % RELIEF) === 0;
      if (lapse && R.bellT > R.sinking) {
        if (!R.lapsedBells) { R.lapsedBells = true; say(R, { t: R.bellT, tFact: R.bellT, ch: 'routine', who: 'The quartermasters', by: 'at the boats', rule: 'routine', kind: 'routine', words: 'No bell is struck: the quartermasters are at the boats.' }); }
        if (relief && !R.lapsedReliefs) { R.lapsedReliefs = true; say(R, { t: R.bellT, tFact: R.bellT, ch: 'routine', who: 'The watch', by: 'at the boats', rule: 'routine', kind: 'routine', words: 'No relief for the crow\'s nest or the wheel.' }); }
      } else {
        say(R, { t: R.bellT, tFact: R.bellT, ch: 'routine', who: 'The quartermaster', by: 'on the bridge', rule: 'routine', kind: 'routine',
          words: BELLS[n] + (relief ? '. The lookouts and the wheel are relieved.' : ', answered from the nest.') });
      }
      R.bellT += BELL;
    }
  }

  // ------------------------------------------------------------------ the step
  // the telephones (G7, NH15: docs/DESIGN_the_living_ship_v1_2026-11-23.md): "worked from the lighting circuit through a
  // motor generator, with a stand-by battery that switched in by itself" [read: the British Report, "Electrical
  // Installation", through note 11.2's table]. A call has current on the main dynamos, or on that battery from the moment
  // they stop (the plant's own mainDark or dark) for PHONE.batteryHours [bet: its life NOT FOUND; the wireless's
  // battery-and-coil set's "at least 6 h", the plant note]
  const PHONE = { batteryHours: 6 };
  function phoneState(sim) {
    const P = sim.plant;
    if (!P || P.power) return { current: true, why: 'on the lighting circuit' };
    const ev = P.events, t0 = Math.min(ev.mainDark === undefined ? Infinity : ev.mainDark, ev.dark === undefined ? Infinity : ev.dark);
    if (t0 < Infinity && sim.t < t0 + PHONE.batteryHours * 3600) return { current: true, why: 'on its stand-by battery' };
    return { current: false, why: 'no current: its stand-by battery is spent' };
  }
  function arrive(sim, R, q) {
    if (R.done) return;
    // the bridge knows she will founder (and the boats are ordered: ROUTINE) only when he gives her a time
    if (q.build) { const e = estimate(R, q); q.words = e.words; q.data = e; R.estimate = e; if (!e.floats && !e.beyond) R.sinking = q.t; }
    if (q.ch === 'phone' && R.sinking >= 0) {                 // once the boats are ordered a call can go unanswered
      if (draw(R, 'phone:' + (R.calls++)) < RULES.phone.unanswered) { R.unanswered.push({ t: q.t, who: q.who, words: q.words }); return; }
    }
    // G7 (NH15): a telephone with no current goes unanswered, after the draw above so that every draw keeps its place
    if (q.ch === 'phone') { const ph = phoneState(sim); if (!ph.current) { R.unanswered.push({ t: q.t, who: q.who, words: q.words, why: ph.why }); return; } }
    if (q.errand) delete R.errands[q.errand];
    const e = { n: R.feed.length + 1, t: q.t, tFact: q.tFact, ch: q.ch, who: q.who, by: q.by, words: q.words, kind: q.kind || 'report', rule: q.rule, qty: q.qty || '', data: q.data || null };
    R.feed.push(e);
    let wet = false;
    if (q.zones) for (const z of q.zones) { know(R, z.k, z.state, z.words, q.tFact, q.t, q.who); if (z.state === 'water' || z.state === 'lost') wet = true; }
    if (wet && R.water < 0) { R.water = q.t; task(R, q.t, 'designer', {}); }
    if (q.follow) {                                            // an officer to see what a man has reported
      const part = q.follow;
      if (!R.errands['look:' + part] && !(R.looked[part] >= 0 && q.t - R.looked[part] < FOLLOW.recent * MIN)) startLook(sim, R, part, 'The Fourth Officer');
    }
    if (q.end) { R.done = true; R.final = { list: listNow(sim), trim: trimNow(sim, R) }; }
  }
  function step(sim) {
    const R = sim.reports, w = sim.night;
    if (!R || R.done) return;
    const t = sim.t;
    R.phone = phoneState(sim);                                 // the telephones' current, as plain data for a view (G7)
    if (R.tTouch < 0 && w.tTouch >= 0) {                      // the touch, felt on the bridge; then the bridge's own routine
      R.tTouch = w.tTouch;
      R.trim.fb0 = freeboard(C.poseFrame(sim, sim.zO, sim.pitch, sim.roll, R.F));
      say(R, { t: w.tTouch, tFact: w.tTouch, ch: 'felt', who: 'The ship', by: 'felt on the bridge', rule: 'touch', words: 'A tremble and a grinding along her ' + (w.abeam >= 0 ? 'starboard' : 'port') + ' side.', qty: 'the touch (core/night.js)' });
      for (const u of UNASKED) task(R, R.tTouch + u.after * MIN, u.order, { value: u.value, who: u.who });
    } else if (R.tTouch < 0 && w.k % 4 === 0) {
      // G27 (docs/DESIGN_G27_the_brush_on_a_watch_v1_2026-11-24.md, section 4): a night holed by hand before any touch
      // (the brush on a watch). The bridge's routine starts at the first water a man finds, by this reader's own
      // first-water rule (a room's water at VOL, as notice has it), on that second; the room's own report comes by its
      // route in the same step's notice. Its two fields are set on this path alone, so a night that meets the ice first
      // keeps its state to the bit
      for (let k = 0; k < 16; k++) if (water(sim, k) >= VOL) {
        R.tTouch = t; R.byWater = k;
        R.trim.fb0 = freeboard(C.poseFrame(sim, sim.zO, sim.pitch, sim.roll, R.F));
        for (const u of UNASKED) task(R, R.tTouch + u.after * MIN, u.order, { value: u.value, who: u.who });
        break;
      }
    }
    if (R.byWater !== undefined && !R.felt && w.tTouch >= 0) {  // G27: a touch after the water is felt, and restarts nothing
      R.felt = true;
      say(R, { t: w.tTouch, tFact: w.tTouch, ch: 'felt', who: 'The ship', by: 'felt on the bridge', rule: 'touch', words: 'A tremble and a grinding along her ' + (w.abeam >= 0 ? 'starboard' : 'port') + ' side.', qty: 'the touch (core/night.js)' });
    }
    if (R.tTouch >= 0 && !R.stem && sim.enc && sim.enc.bow > sim.enc.P.bowMin) {
      R.stem = true;
      say(R, { t, tFact: t, ch: 'felt', who: 'The ship', by: 'felt on the bridge', rule: 'touch', words: 'A heavy blow at the stem.', qty: 'the bow crushed (core/encounter.js)' });
    }
    if (t >= R.callT - EPS || t >= R.bellT - EPS) routine(sim, R);
    if (R.tTouch >= 0) {
      if (w.k % 120 === 0) {                                   // every 30 s: the depths, for "rising" [a design figure]
        const a = R.samples[0], b = R.samples[1];
        R.samples[0] = b; R.samples[1] = a; a.t = t; for (let k = 0; k < 16; k++) a.d[k] = sounding(sim, k);
      }
      if (w.k % 4 === 0) notice(sim, R);                       // once a second: a fact is timed to the second [a design figure]
    }
    while (R.tasks.length && R.tasks[0].due <= t + EPS) runTask(sim, R, R.tasks.shift());
    if (R.shadow && !R.shadow.done) shadowStep(R.shadow);
    if (sim.markT.bridge >= 0 && !R.ended) {                  // the water over the bridge: the end of the bridge's night
      R.ended = true;
      say(R, { t: sim.markT.bridge, tFact: sim.markT.bridge, ch: 'instrument', who: RULES.eye.who, by: RULES.eye.by, rule: 'eye', words: 'Water comes over the bridge.', end: true, qty: 'the core\'s mark "bridge"' });
    }
    while (R.queue.length && R.queue[0].t <= t + EPS) arrive(sim, R, R.queue.shift());
    if (!R.done && (N.over ? N.over(sim) : sim.foundered)) { R.done = true; R.final = { list: listNow(sim), trim: trimNow(sim, R) }; }
  }

  // ------------------------------------------------------------------ what the bridge knows now
  function listNow(sim) {
    const deg = Math.round(sim.roll / DEG);
    return { deg, words: deg === 0 ? 'upright' : Math.abs(deg) + '° ' + (deg > 0 ? 'starboard' : 'port') };
  }
  function trimNow(sim, R) {
    if (R.ended && R.final) return R.final.trim;
    const F = C.poseFrame(sim, sim.zO, sim.pitch, sim.roll, {}), fb = freeboard(F), drop = ft(R.trim.fb0 - fb), S = RULES.eye.steps;
    const cat = R.tTouch < 0 ? 0 : (drop >= S[2] ? 3 : (drop >= S[1] ? 2 : (drop >= S[0] ? 1 : 0)));
    const mark = sim.markT.bridge >= 0 ? 'water over the bridge' : (sim.markT.fcastle >= 0 ? 'the forecastle head under' : (sim.markT.well >= 0 ? 'the forward well deck awash' : null));
    return { cat, words: mark || TRIM[cat], ft: Math.max(0, r5(ft(fb))) };
  }
  function knowledge(sim) {
    const R = sim && sim.reports;
    if (!R) return null;
    const fin = R.done && R.final;
    return {
      t: sim.t, done: R.done,
      zones: R.zones.map((z, k) => ({ k, short: C.ZONES[k].short, name: NAMES[k], state: z.state, words: z.words, t: z.t, tKnown: z.tKnown, who: z.who })),
      list: fin ? R.final.list : listNow(sim),
      trim: fin ? R.final.trim : trimNow(sim, R),
      estimate: R.estimate ? { words: R.estimate.words, tFact: R.estimate.tFact, tKnown: R.estimate.tKnown, floats: R.estimate.floats, beyond: R.estimate.beyond } : null,
      sinking: R.sinking,
      errands: Object.keys(R.errands),
    };
  }
  function feed(sim) { return sim && sim.reports ? sim.reports.feed.slice() : []; }

  N.reader({ name: 'reports', state: 'reports', attach, step, valid, orders: { 'report:look': orderLook, 'report:sound': orderSound, 'report:ask': orderAsk } });
  return { RULES, UNASKED, FOLLOW, PARTS, SOUND, ASK, DESIGNER, ROUTINE, NAMES, TRIM, knowledge, feed, valid, estimateWords, halfHours, PHONE, phoneState };
});
