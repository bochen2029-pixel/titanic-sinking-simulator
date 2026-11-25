/*
 * Ask the bridge: the crew's own words, the page's library (docs/DESIGN_ask_the_bridge_v1_2026-11-23.md, sections 2 to 8,
 * 12 and 13; stage A). The player, as captain, types to the people on the bridge; each answers in character, from what
 * he knows. A language model writes the words (the desktop app's main process calls it, with the player's own key); this
 * file builds what is asked of it and reads what comes back. A library: no DOM, no state, no clock, no network. The same
 * file runs in Node (tools/minds_tests.js) and in the page, where site/parts/88_minds.js uses it.
 *
 *   CAST                  the people who can be spoken to, each with his card (sourced facts only), his seat and remit
 *   gather(sim)           THE ONE FUNCTION THAT READS THE STATE, and only the paths on WHITELIST: the bridge's view, as
 *                         plain data. Everything below works on that view, never on the state
 *   reach(view or sim)    who is in reach now, and for the others where they are (design section 4)
 *   facts(view, seat, ctx)    THE FACTS as text, in a fixed order, every time by the ship's clock (design section 5)
 *   stable(seat, ctx)     the part of a request that never changes during a night (the provider may cache it)
 *   request(seat, view, talk, words, ctx)   { seat, stable, changing }: exactly what the window sends (design 6.1)
 *   retry(request, faults)    the same request once more, with the fault named
 *   SCHEMA                the one fixed form of a turn (app/minds.js TURN_SCHEMA is the same, held so by both suites)
 *   readTurn(text)        a reply's text to { ok, say, order }, or { ok: false, fault, why }; it never throws
 *   check(say, facts, card, ctx)   the checks on the words by code (design 6.3): { ok, faults: [{ kind, what, why }] }
 *   readOrder(order, seat, ctx)    a restated order read by step 1's grammar (TitanicCrewWords.parse) in the convention
 *                         in force: exactly one order, and in the seat's remit, or it is dropped with the reason
 *   addressee(text), offerAnswer(text)   who a line is spoken to; "yes" or "no" to an offered order, with no model
 *   FLOOR, lineOf, notice     the authored lines: the floor when no good answer comes, a man's line, a notice
 *   fakeReply(request, table) the fake provider: an answer chosen by a hash of the request, from a table
 *   ctx: { convention: '1912' (the default) | 'modern', helm: the rudder now ordered (degrees, + to starboard) }
 *
 * The rules it keeps (design section 2): nothing speaks as the ship; a man's facts are the bridge's (the fog of the bridge:
 * never the model's truth, the forecast, the X-ray or the plant); a man answers only when he is in reach; words change
 * beliefs, never the world (a reply is shown as text and may name ONE order, which the grammar must read and the page
 * gives through TitanicApp.order); every generated line is marked as imagined. These were real men, and most of them died
 * that night: a card holds sourced facts only, and no man is made to speak of his end or of the legends told afterwards.
 *
 * Sources of the cards: docs/research/RESEARCH_the_bridge_personas_v1_2026-11-23.md ("personas", by section and item,
 * lines tagged [read] or [derived] only) and docs/research/RESEARCH_the_night_on_the_bridge_v1_2026-11-17.md ("the bridge
 * note", "NB L" and its line). Tags: [read], [derived], [bet], [authored] as in the design.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./85_crew_words.js'));
  else root.TitanicMindsWords = factory(root.TitanicCrewWords);
})(typeof self !== 'undefined' ? self : this, function (CW) {
  'use strict';
  if (!CW || !CW.parse) return null;
  const freeze = (o) => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const k of Object.keys(o)) freeze(o[k]); } return o; };
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const low = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
  const unstop = (s) => String(s).replace(/[.!?]+$/, '');
  const one = (s) => String(s === undefined || s === null ? '' : s).replace(/\s+/g, ' ').trim();
  const convOf = (ctx) => (ctx && ctx.convention === 'modern' ? 'modern' : '1912');
  // typographic marks built from their code points, so that this source stays ASCII
  const BOM = String.fromCharCode(0xFEFF);
  const RE_APOS = new RegExp('[' + [0x2018, 0x2019, 0x201B, 0x2032, 0x60, 0xB4].map(c => String.fromCharCode(c)).join('') + ']', 'g');

  // ------------------------------------------------------------------ the model's names (copied; tools/minds_tests.js
  // holds each to the code it names)
  const TABLES = freeze({
    // core/readers/reports.js NAMES: the spaces as the men named them, zone by zone from the bow
    NAMES: ['the forepeak', 'No. 1 hold', 'No. 2 hold', 'No. 3 hold', 'boiler room 6', 'boiler room 5', 'boiler room 4', 'boiler room 3',
      'boiler room 2', 'boiler room 1', 'the engine room', 'the turbine room', 'the electric engine room', 'the refrigerated hold', 'the after hold', 'the after peak'],
    // core/readers/reports.js TRIM[0]: her trim by eye before anything has been seen
    TRIM0: 'on an even keel',
    // core/motion.js TELEGRAPH: each order's revolutions
    TELEGRAPH: { 'full ahead': 75, 'half ahead': 50, 'slow ahead': 30, 'dead slow ahead': 20, 'stop': 0, 'dead slow astern': -20, 'slow astern': -30, 'half astern': -50, 'full astern': -75 },
    // core/readers/people.js RULE_WORDS: the boats' rules in words
    RULE_WORDS: { only: 'women and children only', first: 'women and children first', fill: 'fill her' },
    // core/readers/reports.js: who the reader names, as the men are named here
    WHO: { 'The Fourth Officer': 'Mr Boxhall', 'The builder\'s man': 'Mr Andrews' },
    // the routine's line that relieves the wheel (core/readers/reports.js routine)
    RELIEF: 'The lookouts and the wheel are relieved.',
    // core/readers/people.js BOATS, by id, in its order: sim.people.boats[i] is the boat BOATS[i]
    BOATS: ['7', '5', '3', '1', '9', '11', '13', '15', '8', '6', '4', '2', '16', '14', '12', '10', 'C', 'D', 'A', 'B'],
  });
  // The men of the cast who went away in a boat, each in charge of her [read: docs/research/RESEARCH_lifeboats_launch_
  // sequence_v1_2026-11-17.md, its table of the boats (No. 2: Fourth Officer Boxhall, about 1:45; No. 6: QM Hichens, 12:55
  // to 1:10) and its officers' row]. Once the model's own people reader lowers that boat (her state 'lowering', then
  // 'away'), the man is gone from the bridge, and the reason is this authored line, never a generated one (the red team's
  // row 18 of release candidate 1: the bridge kept Mr Boxhall to the end). Of the cast, the others stayed with her.
  const WENT = freeze({
    boxhall: freeze({ boat: '2', words: 'Mr Boxhall went away in boat No. 2, in charge of her.' }),
    hichens: freeze({ boat: '6', words: 'Quartermaster Hichens went away in boat No. 6, in charge of her.' }),
  });
  const DEG = Math.PI / 180;                                    // core/motion.js DEG
  const LOOK_TO = { forward: 'forward', mailroom: 'to the mail room', boilers: 'to the boiler rooms', engines: 'to the engine rooms', aft: 'aft' };
  const ANDREWS_STAY = 600;   // s: Mr Andrews with the captain on the bridge from his estimate, for ten minutes [bet: design section 4]
  const ENGINE_ROOM_LINE = false;   // the chief engineer by the engine room's telephone: the second stage, once his own view is built
  const ESTIMATE_LINE = 'Mr Andrews\'s estimate';   // how THE FACTS name it; the checks read it there (what the bridge has been told of her end)
  const KNOWN_SHIPS = ['Olympic'];  // her sister: every man aboard knew her, told or not
  const KEEP = { talk: 12, reports: 12, orders: 10, wireless: 8 };   // lines of each kind in a request [bet: design section 5]
  const SAY_MAX = 400, ORDER_MAX = 80, WORDS_MAX = 400;          // characters (design 6.2)

  // ------------------------------------------------------------------ the cast (design section 4) and their cards (6.4)
  // id: the seat's name sent to the app; name: as the talk and the row name him; seat: his post; remit: the order types he
  // may carry out himself (design 6.2), read from a reply only through step 1's grammar; bridge: true where he shares the
  // bridge's view. card: plain facts, each from personas or the bridge note; voice: one or two of his recorded words, from
  // before the night's touch or timeless, to show how he speaks (never to replay); never: personas (f) and (g), the only
  // place a contested story may stand on a card.
  const BRIDGE_FACTS = [
    'Nothing on the bridge measures water: word of flooding comes only by a man sent below, or by telephone.',        // NB L15, L66 [read; derived]
    'One switch on the bridge closes the twelve watertight doors at the tank top.',   // NB L53 [read] (whether a lamp showed them shut: NB L54, a [bet], kept off)
    'The commutator, a pendulum in the wheelhouse, shows her list.',                                                    // NB L55 [read]
  ];
  const CAST = [
    {
      id: 'murdoch', name: 'Mr Murdoch', short: 'Mr Murdoch', full: 'William Murdoch', rank: 'First Officer', of: 'of', seat: 'oow', bridge: true,
      where: 'the officer of the watch, on the open bridge in front of the wheelhouse', captain: 'your captain', register: 'a British merchant officer', to: 'his captain',
      remit: ['helm', 'telegraph', 'doors', 'boats:uncover', 'boats:rule', 'boats:fill', 'report:look'],
      remitWords: 'the helm, the engine telegraphs, the switch for the watertight doors, the boats\' orders, and sending an officer to look',
      samples: [['helm', -40], ['helm', 40], ['helm', -10], ['helm', 0], ['telegraph', 'full astern'], ['telegraph', 'stop'], ['doors', 'bridge'], ['boats:uncover', 'now'], ['boats:rule', 'first', 'both'], ['report:look', 'forward']],
      address: [['murdoch'], ['first', 'officer'], ['officer', 'of', 'the', 'watch'], ['officer', 'of', 'watch']],
      card: [
        'You were born in 1873 at Dalbeattie, Kirkcudbrightshire, in Scotland, the fourth son of a master mariner; your father and grandfather were sea captains. You are thirty-nine.', // personas 2(a) [read; derived]
        'You were apprenticed in 1888 in the barque Charles Cotesworth, and passed for second mate, first mate and extra master, each at the first attempt.', // personas 2(c) [read]
        'With the White Star Line you have served in the Medic, Runic, Celtic, Oceanic, Cedric, Adriatic and Olympic. You are a lieutenant in the Royal Naval Reserve.', // personas 2(c) [read]
        'You signed on in her at Belfast as chief officer, and stepped down to first officer, at lower pay, when Mr Wilde joined at Southampton.', // personas 2(c) [read]
        'You are the First Officer, the senior officer of the ten-to-two watch, and you keep it on the open bridge in front of the wheelhouse.', // personas 2(b); NB L27, L45 [read]
        'At ten you relieved Mr Lightoller. He gave you the course, the temperature, word that she was within the region where ice had been reported, and the captain\'s instruction to call him if it became at all doubtful; nothing was said of speed.', // personas 2(b); NB L31, L32 [read]
        'At about a quarter past seven you had the forescuttle hatch closed, to keep the forecastle\'s light off the bridge.', // personas 2(b); NB L172, L187 [read]
        'A captain you served under is said to have praised you as cool, capable and alert.', // personas 2(d) [read, a later author's retelling]
      ].concat(BRIDGE_FACTS),
      voice: ['"It is pretty cold." (to Mr Lightoller at ten)', '"I want everything dark before the bridge." (about the forescuttle hatch, this evening)'],   // personas 2(e): BI 13707, BI 17707
      never: ['your own end, or the stories told of it', 'the inquiries', 'rumours of shooting at the boats', 'any tale of a bribe for a seat in a boat', 'warning shots at a collapsible',
        'a near-miss in another ship in 1903', 'any account of the last seconds before she struck beyond the orders in THE FACTS'],   // personas 2(f), 2(g)
    },
    {
      id: 'moody', name: 'Mr Moody', short: 'Mr Moody', full: 'James Moody', rank: 'Sixth Officer', of: 'of', seat: 'junior', bridge: true,
      where: 'in the wheelhouse, the junior officer of the watch', captain: 'your captain', register: 'a British merchant officer', to: 'his captain',
      remit: ['telegraph', 'report:ask', 'report:sound'],
      remitWords: 'the engine telegraphs, a note to the engine room, and the carpenter sent to sound the wells',
      samples: [['telegraph', 'full astern'], ['telegraph', 'half ahead'], ['telegraph', 'stop'], ['report:ask', 'engine room'], ['report:sound', 'wells']],
      address: [['moody'], ['sixth', 'officer'], ['junior', 'officer']],
      card: [
        'You were born in 1887 at Scarborough, in Yorkshire, the youngest of four; your father is a solicitor. You are twenty-four.', // personas 4(a) [read; derived]
        'You were a cadet in the school ship Conway, then served about four years in the sailing ship Boadicea, round Cape Horn.', // personas 4(a), 4(c) [read]
        'You passed for second mate in 1907, first mate in 1909 and master in April 1911.', // personas 4(c) [read]
        'You joined the White Star Line in August 1911, in the Oceanic, and were posted to her as sixth officer in March.', // personas 4(c) [read]
        'You are the Sixth Officer, on the eight-to-twelve watch with Mr Boxhall, and you keep it in the wheelhouse.', // personas 4(b); NB L27, L33 [read]
        'In the wheelhouse you answer the crow\'s nest\'s telephone and pass its reports to Mr Murdoch, and you watch the helm orders carried out and report them to him.', // NB L33; personas 4(b) [read]
        'This evening Mr Lightoller had you work out when she would reach the ice, and you made it about eleven o\'clock.', // personas 4(b): BI 13708 [read]
        'At about half past nine you telephoned the crow\'s nest to keep a sharp look-out for small ice and growlers until daylight.', // personas 4(b); NB L187 [read]
        'The junior officer takes the engine room\'s revolutions by telephone.', // personas 4(b); NB L190 [read]
        'You are studious and well groomed, and your words are brief and polite.', // personas 4(d) [read, researchers' paraphrase; derived]
      ].concat(BRIDGE_FACTS),
      voice: ['"What do you see?" and "Thank you." (your form on the crow\'s nest telephone)'],   // personas 4(e): BI 17286; section 9
      never: ['your own end', 'the collapsibles\' fate', 'the story of late crewmen turned away at the gangway at Southampton', 'any line from a film or a novel'],   // personas 4(f), 4(g)
    },
    {
      id: 'boxhall', name: 'Mr Boxhall', short: 'Mr Boxhall', full: 'Joseph Boxhall', rank: 'Fourth Officer', of: 'of', seat: 'fourth', bridge: true,
      where: 'on the bridge', captain: 'your captain', register: 'a British merchant officer', to: 'his captain',
      remit: ['report:look', 'help:rocket', 'help:lamp'],
      goes: ['report:look'],                  // the orders he carries out by going himself: while that errand is out he is away (reach)
      remitWords: 'going yourself to look, the rockets, and the Morse lamp',
      samples: [['report:look', 'forward'], ['report:look', 'mailroom'], ['help:rocket', 'socket'], ['help:lamp', 'cqd']],
      address: [['boxhall'], ['fourth', 'officer']],
      card: [
        'You were born in 1884 at Hull, in Yorkshire, the only son of a master of the Wilson Line; you are twenty-eight.', // personas 3(a) [read]
        'You were apprenticed in 1899 in a barque of the William Thomas Line of Liverpool, then served in the Wilson Line of Hull.', // personas 3(c) [read]
        'You have been an extra master since September 1907, and joined the White Star Line that November: the Celtic, Oceanic, Runic, Cedric, Megantic and Arabic. You are a sub-lieutenant in the Royal Naval Reserve, with thirteen years at sea.', // personas 3(c) [read]
        'You are the Fourth Officer, on the eight-to-twelve watch with Mr Moody; your duty is to assist the senior officer of the watch in all cases.', // personas 3(b) [read]
        'From eight o\'clock you were in the chart room working up the evening\'s star sights, which Mr Lightoller took at about half past seven.', // personas 3(b); NB L34, L191 [read]
        'From about ten you used that position to check the compass by the stars, and you plotted the day\'s ice reports on the captain\'s chart.', // NB L188, L191 [read]
        'The socket rockets are kept aft; the Morse lamps are on the bridge.', // NB L60, L61 [read]
      ].concat(BRIDGE_FACTS),
      voice: ['"To generally assist the senior officer of the watch in all cases." (your own account of your duty)'],   // personas 3(b): US Day 3 p.1
      never: ['the boats\' fate', 'the rescue', 'the inquiries', 'any later knowledge that your position was in error', 'which steamer showed her lights',
        'tea in your cabin', 'the story that the captain sent you below the first time'],   // personas 3(f), 3(g)
    },
    {
      id: 'hichens', name: 'Quartermaster Hichens', short: 'Hichens', full: 'Robert Hichens', rank: 'Quartermaster', of: 'of', seat: 'quartermaster', bridge: true,
      where: 'at the wheel, in the enclosed wheelhouse', captain: 'your captain', register: 'a quartermaster', to: 'his captain',
      remit: ['helm'],
      remitWords: 'the helm',
      samples: [['helm', -40], ['helm', 40], ['helm', -10], ['helm', 10], ['helm', 0], ['helm', 'reverse']],
      address: [['hichens'], ['quartermaster'], ['helmsman']],
      card: [
        'You were born in 1882 at Newlyn, in Cornwall, the eldest of eight; your father is a fisherman. You live in Southampton.', // personas 5(a) [read]
        'You have been a quartermaster for the last seven or eight years, in mail boats and liners; your last ship before her was the troopship Dongola.', // personas 5(c) [read]
        'You are a quartermaster: you took the wheel from Quartermaster Olliver at ten o\'clock, for a two-hour trick, which ends at twelve o\'clock.', // personas 5(b); NB L35, L185 [read; its end at twelve is ten and two hours]
        'The wheel is in the enclosed wheelhouse, the blinds drawn: you see only your compass, nothing ahead.', // personas 5(b); NB L35, L45, L51 [read]
        'You steer north 71 west by the steering compass.', // NB L62, L189 [read]
        'The wheel works the steering engines by the telemotor; its helm indicator goes to forty degrees.', // NB L51 [read]
        'Until ten you stood by on the bridge: at a quarter to ten you called Mr Murdoch at one bell, and took the readings. The quartermaster standing by strikes the bell on the half hour: since ten that is Olliver.', // NB L36, L179, L180, L183, L185 [read; that he stood by from eight is derived from Olliver's trick at the wheel]
        'It has been bitterly cold since eight o\'clock.', // NB L205 [read]
      ],
      voice: ['"For the last seven or eight years, sir." (asked how long you had been a quartermaster)'],   // personas 5(c): US Day 5
      never: ['boat 6', 'the inquiries', 'your later life', 'the story that the wheel was turned the wrong way', 'the quarrels told of later'],   // personas 5(f), 5(g)
    },
    {
      id: 'andrews', name: 'Mr Andrews', short: 'Mr Andrews', full: 'Thomas Andrews', rank: 'a managing director of the firm that built her', of: 'aboard', seat: 'builder', bridge: true,
      where: 'on the bridge, with the captain', captain: 'the ship\'s captain', register: 'her builder', to: 'her captain',
      remit: [],
      remitWords: '',
      samples: [],
      address: [['andrews']],
      card: [
        'You were born in 1873 at Ardara House, Comber, in County Down, Ireland; you are thirty-nine.', // personas 6(a) [read]
        'You married in 1908; your daughter was born in November 1910.', // personas 6(a) [read]
        'You entered the shipyard at Belfast as a premium apprentice on 1 May 1889, aged sixteen: five years through the trades, and in the drawing office from 1892.', // personas 6(c) [read]
        'You were manager of construction for the Celtic, then head of the designing department, and you are now a managing director of the firm that built her; you oversaw the plans of her and her sister, the Olympic.', // personas 6(c), 6(b) [read]
        'You are aboard leading the builders\' guarantee group, noting improvements: a passenger, not one of her crew.', // personas 6(b) [read]
        'Shipwrights call you straight as a die; you correct a fault sharply, but in private.', // personas 6(d) [read]
        'On this voyage you have been working all the time.', // personas 6(d): Etches, US Day 9 [read]
      ],
      voice: [],
      never: ['the end', 'what became of the ship you designed', 'tales of where you were at the last', 'deck chairs thrown to people in the water', 'the engine room with Mr Bell',
        'jumping from the bridge with the captain', 'your talk with a stewardess, or words to passengers told in later accounts', 'any word that she is unsinkable, or of faults in her design'],   // personas 6(f), 6(g)
    },
    {
      id: 'bell', name: 'Mr Bell', short: 'Mr Bell', full: 'Joseph Bell', rank: 'Chief Engineer', of: 'of', seat: 'engineer', bridge: false,
      where: 'in the engine room, at its telephone to the bridge', captain: 'your captain', register: 'a chief engineer', to: 'his captain',
      remit: ['fires', 'pump'],
      remitWords: 'the fires and the pumps',
      samples: [['fires', 0], ['pump', 5, 'own'], ['pump', -1, 'engineers']],
      address: [['bell'], ['chief', 'engineer']],
      card: [
        'You were born in 1861 at Farlam, near Carlisle, in Cumberland, of a farming family.', // personas 7(a) [read]
        'You were apprenticed as an engine fitter in Newcastle from 1876; you married in 1892 and have four children.', // personas 7(a) [read]
        'You have served the White Star Line since 1885: third engineer of the Teutonic, second of the Majestic, chief of the Coptic; you saw the engines of the Laurentic and Megantic installed, and were chief engineer of the Olympic on her maiden voyage.', // personas 7(c) [read]
        'You are the Chief Engineer, head of an engineering department of over 300 men; you signed on in her on 2 April 1912.', // personas 7(b) [read]
        'You are one of the line\'s most trusted engineers: you stayed at Belfast while the Olympic was building, to suggest improvements.', // personas 7(d) [read]
        'The telephones run from your cabin to the engine room and from the engine room to each stokehold; the bridge\'s engine orders come by the telegraph, and the engine room answers on its dial.', // NB L56; personas section 9 [read]
      ],
      voice: [],
      never: ['the end below', 'the engineers\' fate', 'tales of the engineers at the end', 'tales of Mr Andrews in the engine room at the end'],   // personas 7(f), 7(g)
    },
  ];
  const BY = {}; for (const c of CAST) BY[c.id] = c;
  const SEATS = CAST.map(c => c.id);
  // a line to anyone not in the cast who is named at the start of a line: a notice, nobody's words (the wireless room had
  // no line to the bridge: NB L64; the others are not among those who answer here, design section 4)
  const OTHERS = [
    [['phillips'], 'Mr Phillips', 'wireless'], [['bride'], 'Mr Bride', 'wireless'], [['wireless'], 'The wireless room', 'wireless'], [['wireless', 'room'], 'The wireless room', 'wireless'],
    [['sparks'], 'The wireless room', 'wireless'], [['marconi', 'room'], 'The Marconi room', 'wireless'],
    [['lightoller'], 'Mr Lightoller'], [['second', 'officer'], 'Mr Lightoller'], [['pitman'], 'Mr Pitman'], [['third', 'officer'], 'Mr Pitman'], [['lowe'], 'Mr Lowe'],
    [['fifth', 'officer'], 'Mr Lowe'], [['wilde'], 'Mr Wilde'], [['chief', 'officer'], 'Mr Wilde'], [['olliver'], 'Olliver'], [['rowe'], 'Rowe'], [['fleet'], 'Fleet'],
    [['carpenter'], 'The carpenter'], [['bosun'], 'The boatswain'], [['boatswain'], 'The boatswain'], [['lookout'], 'The lookout'], [['ismay'], 'Mr Ismay'],
  ];

  // ------------------------------------------------------------------ the whitelist: every path of the state gather reads
  // (a[] is each element of the array a; o{} the keys of the object o). tools/minds_tests.js runs gather on a sim that
  // records every read and holds each to this list. Never on it: the water (sim.vol, sim.level), the plant (sim.plant),
  // the true pose but the commutator's list, the forecast and the estimate's own forecast, a report's data, quantity and
  // time of the fact, the other ships, the people in the boats, the fall and the onset (design section 5).
  const WHITELIST = freeze([
    'sim.t',                                   // the ship's time (the watch's own clock)
    'sim.roll',                                // her list, to a degree: the commutator in the wheelhouse (Reports.knowledge().list) [read: NB L55]
    'sim.night.k', 'sim.night.spec.clock0', 'sim.night.tBells', 'sim.night.tTouch',
    'sim.night.spec.speedKn', 'sim.night.spec.heading',   // the course and the speed set for the watch: the bridge's own (the course ordered, the speed by the revolutions) [derived]
    'sim.night.log[].k', 'sim.night.log[].t', 'sim.night.log[].type', 'sim.night.log[].value', 'sim.night.log[].arg', 'sim.night.log[].refused',
    'sim.mo.delCmd', 'sim.mo.setP', 'sim.mo.setS',   // the helm and the telegraphs as ordered
    'sim.reports.zones[].state', 'sim.reports.zones[].words', 'sim.reports.zones[].tKnown', 'sim.reports.zones[].who',
    'sim.reports.feed[].t', 'sim.reports.feed[].ch', 'sim.reports.feed[].who', 'sim.reports.feed[].by', 'sim.reports.feed[].words', 'sim.reports.feed[].kind', 'sim.reports.feed[].rule',
    'sim.reports.estimate.words', 'sim.reports.estimate.tKnown',
    'sim.reports.errands{}',                   // which errands are out (their keys only)
    'sim.reports.tasks[].type', 'sim.reports.tasks[].who', 'sim.reports.tasks[].part',   // who is out on an errand, and where
    'sim.reports.queue[].who', 'sim.reports.queue[].errand', 'sim.reports.queue[].rule',   // who is on his way back (never a line's words)
    'sim.reports.phone.current',               // the telephones' current (join 16; absent on this branch)
    'sim.people.uncoverT', 'sim.people.callT', 'sim.people.rule.P', 'sim.people.rule.S', 'sim.people.fill', 'sim.people.boats[].state',
    'sim.world.lines[].t', 'sim.world.lines[].kind', 'sim.world.lines[].text',
  ]);
  // what must never be read (the tests hold the whitelist and every read to it)
  const FORBIDDEN = freeze(['sim.vol', 'sim.level', 'sim.plant', 'sim.reports.estimate.forecast', 'sim.reports.estimate.biased', 'sim.reports.shadow',
    'sim.reports.feed[].data', 'sim.reports.feed[].qty', 'sim.reports.feed[].tFact', 'sim.reports.queue[].words', 'sim.reports.queue[].data', 'sim.reports.tasks[].data',
    'sim.world.ships', 'sim.people.count', 'sim.people.boats[].n', 'sim.people.groups', 'sim.fall', 'sim.onset', 'sim.events', 'sim.pitch', 'sim.zO', 'sim.openings']);

  // ------------------------------------------------------------------ gather: the one function that reads the state
  const num = (x) => (typeof x === 'number' && isFinite(x) ? x : -1);
  const str = (x) => (typeof x === 'string' ? x : '');
  const prim = (x) => (x === null || x === undefined || typeof x === 'number' || typeof x === 'string' || typeof x === 'boolean' ? x : String(x));
  function gather(sim) {
    const v = { isView: true, ok: false, t: 0, k: 0, clock0: 0, speedKn: -1, heading: -1, tBells: -1, tTouch: -1, listDeg: 0, helm: 0, setP: 0, setS: 0, log: [], reports: null, people: null, world: null };
    if (!sim || !sim.night) return v;
    const w = sim.night;
    v.ok = true; v.t = num(sim.t); v.k = num(w.k);
    v.clock0 = w.spec ? num(w.spec.clock0) : 0; if (v.clock0 < 0) v.clock0 = 0;
    if (w.spec) { v.speedKn = num(w.spec.speedKn); v.heading = num(w.spec.heading); }
    v.tBells = num(w.tBells); v.tTouch = num(w.tTouch);
    const roll = sim.roll; v.listDeg = typeof roll === 'number' && isFinite(roll) ? Math.round(roll / DEG) : 0;
    const L = w.log;
    if (L) for (let i = 0; i < L.length; i++) { const e = L[i]; v.log.push({ k: num(e.k), t: num(e.t), type: str(e.type), value: prim(e.value), arg: prim(e.arg), refused: e.refused ? String(e.refused) : null }); }
    const m = sim.mo;
    if (m) { v.helm = Math.round(num(m.delCmd) / DEG * 1e6) / 1e6; v.setP = num(m.setP); v.setS = num(m.setS); }
    const R = sim.reports;
    if (R) {
      const r = { zones: [], feed: [], estimate: null, errands: [], carriers: [], below: false, phone: null };
      const Z = R.zones;
      if (Z) for (let k = 0; k < Z.length; k++) { const z = Z[k]; r.zones.push({ k, state: str(z.state), words: str(z.words), tKnown: num(z.tKnown), who: str(z.who) }); }
      const F = R.feed;
      if (F) for (let i = 0; i < F.length; i++) { const e = F[i]; r.feed.push({ t: num(e.t), ch: str(e.ch), who: str(e.who), by: str(e.by), words: str(e.words), kind: str(e.kind), rule: str(e.rule) }); }
      const E = R.estimate;
      if (E) r.estimate = { words: str(E.words), tKnown: num(E.tKnown) };
      if (R.errands) r.errands = Object.keys(R.errands).sort();
      const T = R.tasks;
      if (T) for (let i = 0; i < T.length; i++) { const x = T[i]; if (x.type === 'visit') r.carriers.push({ part: str(x.part), who: str(x.who) }); }
      const Q = R.queue;
      if (Q) for (let i = 0; i < Q.length; i++) {
        const q = Q[i], errand = str(q.errand);
        if (errand.indexOf('look:') === 0) r.carriers.push({ part: errand.slice(5), who: str(q.who) });
        if (q.rule === 'designer') r.below = true;
      }
      const ph = R.phone;
      if (ph) r.phone = { current: !!ph.current };
      v.reports = r;
    }
    const P = sim.people;
    if (P) {
      // (lowered: the boats lowered or away, by id, for who is still on the bridge: reach, WENT)
      const B = P.boats, lowered = []; let away = 0, n = 0;
      if (B) {
        n = B.length;
        for (let i = 0; i < n; i++) {
          const s = B[i].state;
          if (s === 'away') away++;
          if ((s === 'lowering' || s === 'away') && i < TABLES.BOATS.length) lowered.push(TABLES.BOATS[i]);
        }
      }
      const rule = P.rule || {};
      v.people = { uncoverT: num(P.uncoverT), callT: num(P.callT), ruleP: str(rule.P), ruleS: str(rule.S), fill: num(P.fill), boats: n, away, lowered };
    }
    const Wd = sim.world;
    if (Wd) {
      const lines = [], Ls = Wd.lines;
      if (Ls) for (let i = 0; i < Ls.length; i++) { const l = Ls[i], kind = str(l.kind); if (WORLD_KINDS[kind] === 1) lines.push({ t: num(l.t), kind, text: str(l.text) }); }
      v.world = { lines };
    }
    return v;
  }
  // sim.world.lines is the wireless room's log and the signals' (core/readers/world.js), which the page shows the player.
  // It is not the bridge's knowledge: the wireless room had no line to the bridge (NB L64). Of it the bridge has only
  //   'order'  its own acts, and what is seen from it: the call ordered, the operators released, a rocket, the Morse lamp;
  //   'seen'   a light in sight from the bridge;
  //   'in'     a ship's answer, as the junior operator brought it forward to the bridge, a few yards from his room
  //            [bet: at once; the presence reader will give him his walk].
  // Never 'out', what the operators keyed (some of it is the plant's hidden state: "Engine room flooded", "cannot hear
  // for the noise of steam"), nor 'set', the set's supply with its causes and its volts (the plant's own). The review
  // of stage A found both in THE FACTS; tools/minds_tests.js steps a hidden change of the plant and holds them out.
  const WORLD_KINDS = freeze({ order: 1, in: 1, seen: 1 });
  const viewOf = (x) => (x && x.isView === true ? x : gather(x));

  // ------------------------------------------------------------------ the ship's clock (as site/app.js clockOf shows it)
  function clockText(clock0, t) {
    const s = (((clock0 + t) % 86400) + 86400) % 86400;
    let h = Math.floor(s / 3600);
    const m = Math.floor(s % 3600 / 60), ap = h >= 12 ? 'pm' : 'am';
    h = h % 12; if (h === 0) h = 12;
    return h + ':' + (m < 10 ? '0' : '') + m + ' ' + ap;
  }
  const minutes = (s) => { const m = Math.floor(Math.max(0, s) / 60); return m < 1 ? 'less than a minute' : (m === 1 ? '1 minute' : m + ' minutes'); };

  // ------------------------------------------------------------------ reach: who is in reach (design section 4)
  // A pure function of the view. A rule keyed to the record's clock is a [bet] until the presence reader replaces it.
  // sent: { seat: [errand keys] }, the errands a man of the cast went on himself, by an order from his own answer (the
  // page's part keeps it: the reports reader says only "an officer"). While such an errand is out he is away on it: he
  // cannot have gone forward to look and be on the bridge to answer (design 2, rule 3; the review of stage A)
  function reachOne(c, v, sent) {
    const no = (where) => ({ in: false, where });
    const yes = (where) => ({ in: true, where });
    if (!v.ok) return no(c.name + ' cannot be spoken to: there is no watch.');
    const R = v.reports, P = v.people;
    // a man who went away in a boat is gone once the model has lowered her, whatever else holds (WENT)
    const went = WENT[c.id];
    if (went && P && Array.isArray(P.lowered) && P.lowered.indexOf(went.boat) >= 0) return no(went.words);
    const mine = sent && Array.isArray(sent[c.id]) && R ? R.errands.find(k => sent[c.id].indexOf(k) >= 0) : null;
    if (mine) return no(c.name + ' has gone ' + (mine.indexOf('look:') === 0 ? (LOOK_TO[mine.slice(5)] || 'below') + ' to look' : 'on an errand') + '.');
    if (c.id === 'murdoch' || c.id === 'moody') {
      // until the boats are called (core/readers/people.js callT) [derived: he worked the boats; personas 2(b), 4(b)]
      if (P && P.callT >= 0 && v.t >= P.callT) return no(c.name + ' has gone to the boats.');
      return yes(c.id === 'murdoch' ? 'on the bridge, the officer of the watch' : 'in the wheelhouse');
    }
    if (c.id === 'boxhall') {
      // on the bridge until he went away in boat No. 2 (above), and not out on an errand: no errand of the reports reader
      // carries the Fourth Officer (an officer sent by the player is "an officer": the reader does not name him)
      const on = R ? R.carriers.find(x => x.who === 'The Fourth Officer') : null;
      if (on) return no(c.name + ' has gone ' + (LOOK_TO[on.part] || 'below') + ' to look.');
      return yes('on the bridge');
    }
    if (c.id === 'hichens') {
      // until the wheel is relieved (the routine's line, core/readers/reports.js ROUTINE)
      if (R && R.feed.some(e => e.kind === 'routine' && e.words.indexOf(TABLES.RELIEF) >= 0)) return no('Quartermaster Hichens has been relieved at the wheel.');
      return yes('at the wheel');
    }
    if (c.id === 'andrews') {
      const E = R && R.estimate;
      if (E && E.tKnown >= 0 && v.t >= E.tKnown && v.t < E.tKnown + ANDREWS_STAY) return yes('on the bridge, with the captain');
      if (E && E.tKnown >= 0 && v.t >= E.tKnown + ANDREWS_STAY) return no(c.name + ' has left the bridge.');
      if (R && R.below) return no(c.name + ' is below, seeing the damage.');
      return no(c.name + ' is not on the bridge.');
    }
    if (c.id === 'bell') {
      // The engine room's telephone is the second stage (design section 4). His own view of the engine room (the steam,
      // the fires, the pumps, the water as his men see it) is not built yet, and a man with nothing to go on is not asked:
      // until ENGINE_ROOM_LINE is true he is out of reach, whatever the telephones' state. Then the rule below serves:
      // in reach while the reports reader says the telephones have current (sim.reports.phone.current, join 16)
      if (!ENGINE_ROOM_LINE) return no(c.name + ' is in the engine room: speaking to him by its telephone is not built yet.');
      if (!R || !R.phone) return no(c.name + ' is in the engine room: its telephone to the bridge is not in this model yet.');
      if (!R.phone.current) return no(c.name + ' cannot be reached: the telephones have no current.');
      return yes('on the engine room\'s telephone');
    }
    return no(c.name + ' cannot be spoken to.');
  }
  function reach(x, sent) { const v = viewOf(x), out = {}; for (const c of CAST) out[c.id] = reachOne(c, v, sent); return out; }
  // The errand an order sends the man of `seat` on, as the reports reader keys it (core/readers/reports.js); null when he
  // does not go himself. Only a man whose card says so goes (goes: Mr Boxhall, to look): the officer of the watch who
  // has an officer sent forward stays on the bridge.
  function errandOf(order, seat) {
    const c = BY[seat];
    if (!c || !order || !Array.isArray(c.goes) || c.goes.indexOf(order.type) < 0) return null;
    return order.type === 'report:look' && typeof order.value === 'string' ? 'look:' + order.value : null;
  }

  // ------------------------------------------------------------------ THE FACTS (design section 5)
  const whoName = (who) => TABLES.WHO[who] || low(who);
  function helmText(deg, ctx) { return CW.phrase({ type: 'helm', value: Math.round(deg) }, ctx); }
  function telText(p, s) {
    const name = (rpm) => { for (const k of Object.keys(TABLES.TELEGRAPH)) if (TABLES.TELEGRAPH[k] === rpm) return k; return null; };
    const said = (rpm, arg) => { const n = name(rpm); return CW.phrase({ type: 'telegraph', value: n !== null ? n : Math.round(rpm), arg }); };
    if (p === s) return said(p);
    return said(p, 'port') + ', ' + low(said(s, 'starboard'));
  }
  function source(e) {
    if (e.who === 'The ship') return e.by;                       // nothing speaks as the ship: the touch was felt
    return whoName(e.who) + (e.by ? ', ' + e.by : '');
  }
  // the wheel turning gives a helm order each step: a run of helm orders each within WHEEL s of the next is its last
  const WHEEL = 5;
  function collapse(log) {
    const out = [];
    for (let i = 0; i < log.length; i++) { const e = log[i], n = log[i + 1]; if (e.type === 'helm' && n && n.type === 'helm' && n.t - e.t <= WHEEL) continue; out.push(e); }
    return out;
  }
  function orderLine(v, e, ctx) {
    let words = unstop(CW.phrase({ type: e.type, value: e.value, arg: e.arg === null ? undefined : e.arg }, ctx));
    if (e.refused) words += ' (not carried out: ' + unstop(e.refused) + ')';
    return '  - ' + clockText(v.clock0, e.t) + ': ' + words + '.';
  }
  function nowLine(v) {
    let s = '- Now: ' + clockText(v.clock0, v.t) + '.';
    if (v.tBells >= 0) s += ' The crow\'s nest rang three bells and reported ice ahead at ' + clockText(v.clock0, v.tBells) + '.';
    if (v.tTouch >= 0) s += ' She struck the ice at ' + clockText(v.clock0, v.tTouch) + ', ' + minutes(v.t - v.tTouch) + ' ago.';
    return s;
  }
  // a true course as an officer of 1912 gave it, by the quadrant: 266 degrees is "S 86 W"
  function courseText(deg) {
    const d = ((Math.round(deg) % 360) + 360) % 360;
    if (d === 0) return 'north'; if (d === 90) return 'east'; if (d === 180) return 'south'; if (d === 270) return 'west';
    return d < 90 ? 'N ' + d + ' E' : (d < 180 ? 'S ' + (180 - d) + ' E' : (d < 270 ? 'S ' + (d - 180) + ' W' : 'N ' + (360 - d) + ' W'));
  }
  // a speed in knots, with a half or a quarter as a seaman writes it, and in figures too (so that either may be said)
  function knotsText(kn) {
    const q = Math.round(kn * 4) / 4, whole = Math.floor(q), f = q - whole;
    if (f === 0) return whole + ' knots';
    return whole + ' ' + (f === 0.5 ? '1/2' : (f === 0.25 ? '1/4' : '3/4')) + ' knots (' + q + ')';
  }
  // the course and the speed set for this watch: the bridge's own knowledge (the course ordered, her speed by the
  // revolutions and the log) [derived: the night's own setting, never her speed now]
  function startLine(v) {
    if (!(v.speedKn > 0) || v.heading < 0) return null;
    return '- When this watch began she was steering ' + courseText(v.heading) + ' true and making ' + knotsText(v.speedKn) + ' by the revolutions.';
  }
  function bridgeFacts(v, ctx) {
    const L = ['THE FACTS (what has reached the bridge; every time is by the ship\'s clock)', nowLine(v)];
    const start = startLine(v); if (start) L.push(start);
    L.push('- The helm, as ordered: ' + unstop(helmText(v.helm, ctx)) + '. The engine telegraphs: ' + unstop(telText(v.setP, v.setS)) + '.');
    const R = v.reports;
    const deg = v.listDeg, list = deg === 0 ? 'upright' : Math.abs(deg) + (Math.abs(deg) === 1 ? ' degree' : ' degrees') + ' to ' + (deg > 0 ? 'starboard' : 'port');
    let trim = TABLES.TRIM0;
    if (R) for (let i = R.feed.length - 1; i >= 0; i--) if (R.feed[i].rule === 'eye') { trim = low(unstop(R.feed[i].words)) + ' (' + clockText(v.clock0, R.feed[i].t) + ')'; break; }
    L.push('- Her list by the commutator: ' + list + '. Her trim by eye: ' + trim + '.');
    let doors = null;
    for (let i = v.log.length - 1; i >= 0; i--) if (v.log[i].type === 'doors') { doors = v.log[i]; break; }
    L.push('- The watertight doors: ' + (doors ? 'the switch was thrown from the bridge at ' + clockText(v.clock0, doors.t) : 'no order has been given for them from the bridge') + '.');
    if (R) {
      const known = R.zones.filter(z => z.state && z.state !== 'unknown'), unknown = R.zones.filter(z => !z.state || z.state === 'unknown');
      if (known.length) {
        L.push('- What has been reported of each compartment:');
        for (const z of known) L.push('  - ' + cap(TABLES.NAMES[z.k] || ('compartment ' + z.k)) + ': ' + unstop(z.words) + ' (' + whoName(z.who) + ', ' + clockText(v.clock0, z.tKnown) + ').');
      }
      L.push(unknown.length === 0 ? '- Every compartment has been reported on.' : (known.length ? '- Nothing has been reported of: ' : '- Nothing has been reported of any compartment: ') + unknown.map(z => TABLES.NAMES[z.k] || ('compartment ' + z.k)).join(', ') + '.');
      if (R.estimate) L.push('- ' + ESTIMATE_LINE + ', given to the captain at ' + clockText(v.clock0, R.estimate.tKnown) + ': ' + low(unstop(R.estimate.words)) + '.');
      const away = [];
      for (const key of R.errands) {
        if (key.indexOf('look:') === 0) {
          const part = key.slice(5), c = R.carriers.find(x => x.part === part);
          away.push((c ? whoName(c.who) : 'an officer') + ', gone ' + (LOOK_TO[part] || 'below') + ' to look');
        } else if (key === 'sound') away.push('the carpenter, sent to sound the wells');
        else if (key === 'ask') away.push('a note to the chief engineer, gone down by a messenger');
      }
      if (away.length) L.push('- Away from the bridge: ' + away.join('; ') + '.');
    }
    const P = v.people;
    if (P) {
      if (P.uncoverT < 0) L.push('- The boats: still covered; no order has been given for them.');
      else {
        const rule = (r) => TABLES.RULE_WORDS[r] || r;
        L.push('- The boats: uncovered at ' + clockText(v.clock0, P.uncoverT) + (P.callT >= 0 ? '; the call to the boats went at ' + clockText(v.clock0, P.callT) : '; the passengers have not yet been called to them') + '. '
          + 'Port side: ' + rule(P.ruleP) + '; starboard side: ' + rule(P.ruleS) + '. A boat is lowered once she holds ' + Math.round(100 * P.fill) + ' per cent of her places. Away: ' + P.away + ' of ' + P.boats + '.');
      }
    }
    if (v.world) {
      const W = v.world.lines.slice(-KEEP.wireless);
      if (!W.length) L.push('- The wireless and the signals: nothing has come to the bridge.');
      else { L.push('- The wireless and the signals, as told to the bridge (newest last):'); for (const l of W) L.push('  - ' + clockText(v.clock0, l.t) + ': ' + one(l.text)); }
    }
    const O = collapse(v.log).slice(-KEEP.orders);
    if (!O.length) L.push('- No order has been given on this watch.');
    else { L.push('- The orders given on this watch (newest last):'); for (const e of O) L.push(orderLine(v, e, ctx)); }
    if (R) {
      const F = R.feed.slice(-KEEP.reports);
      if (!F.length) L.push('- No report has reached the bridge.');
      else {
        L.push('- The reports, as they reached the bridge (newest last):');
        for (const e of F) L.push('  - ' + clockText(v.clock0, e.t) + ', ' + source(e) + ': ' + (e.rule === 'designer' ? low(one(e.words)) : one(e.words)));
      }
    }
    return L.join('\n');
  }
  // the chief engineer's own view (the second stage, after the telephones' state): the time and what the bridge has
  // asked of the engine room. Nothing of the holds, the estimate or the boats unless told [design section 5]
  function engineFacts(v, ctx) {
    const L = ['THE FACTS (what has reached the engine room; every time is by the ship\'s clock)', nowLine(v)];
    L.push('- The engine telegraphs ask for: ' + unstop(telText(v.setP, v.setS)) + '.');
    const O = collapse(v.log).filter(e => e.type === 'telegraph' || e.type === 'fires' || e.type === 'pump').slice(-KEEP.orders);
    if (!O.length) L.push('- No order has come to the engine room on this watch.');
    else { L.push('- The bridge\'s orders to the engine room (newest last):'); for (const e of O) L.push(orderLine(v, e, ctx)); }
    L.push('- Nothing else has reached the engine room from the bridge.');
    return L.join('\n');
  }
  function facts(x, seat, ctx) {
    const v = viewOf(x), c = BY[seat] || BY.murdoch;
    if (!v.ok) return 'THE FACTS\n- There is no watch.';
    return c.bridge ? bridgeFacts(v, ctx) : engineFacts(v, ctx);
  }

  // ------------------------------------------------------------------ the request (design 6.1): stable and changing
  function remitWords(seat) { const c = BY[seat]; return c ? c.remitWords : ''; }
  // the bridge's words for the orders a man may carry out, as he is shown them and as readOrder reads them back: a helm
  // order that turns her names her head too (readOrder says why)
  function orderWords(seat, ctx) {
    const c = BY[seat]; if (!c) return [];
    return c.samples.map(s => { const o = { type: s[0], value: s[1], arg: s[2] }, w = CW.phrase(o, ctx); return o.type === 'helm' && typeof o.value === 'number' && o.value !== 0 ? unstop(w) + ', her head to ' + (o.value < 0 ? 'port' : 'starboard') : w; });
  }
  function conventionLines(ctx) {
    return convOf(ctx) === 'modern'
      ? ['- The captain gives helm orders by the rudder, not the tiller: "hard a-starboard" (or "hard to starboard") turns her head to starboard.', '- "Hard a-port" (or "hard to port") turns her head to port.']
      : ['- Helm orders are tiller orders, as in 1912: "hard a-starboard" turns her head to port.', '- "Hard a-port" turns her head to starboard.'];
  }
  // [authored], from the brief's text; HOW YOU SPEAK from personas sections 9 and 11
  function stable(seat, ctx) {
    const c = BY[seat]; if (!c) return '';
    const L = [];
    L.push('You are ' + c.full + ', ' + c.rank + ', ' + c.of + ' the Royal Mail Steamer Titanic of the White Star Line. It is the night of Sunday 14 April 1912, in the North Atlantic. You are ' + c.where + '. The man speaking to you is ' + c.captain + ', Captain Smith.');
    L.push('', 'WHO YOU ARE');
    for (const x of c.card) L.push('- ' + x);
    if (c.voice.length) L.push('- Words of yours on the record, to show how you speak: ' + c.voice.join('; ') + '. Do not repeat them, and never out of their moment.');
    L.push('- Never speak of: ' + c.never.join('; ') + '.');
    L.push('', 'HOW YOU SPEAK');
    L.push('- As ' + c.register + ' of 1912 would speak to ' + c.to + ': plainly and briefly, in one to three sentences.');
    L.push('- Say "sir" to the captain, and of him "the Captain"; never "Captain Smith" or "Skipper" to his face.');      // personas 9, 11
    L.push('- An officer is "Mr" and his surname; a man under you is his surname alone.');                                // personas 9
    if (c.id === 'hichens') L.push('- Repeat a helm order back with "sir", and say when the helm is over.');                // personas 9
    else L.push('- Answer the captain with "Yes, sir" or "No, sir" and the matter itself; to a report made to you, "All right" or "Thank you".');   // personas 9: "Yes, it is very cold, Sir." (BI 13615); "All right", "Thank you" (US Day 7; BI 979-980)
    L.push('- Say "she" of the ship. Give times by the twelve-hour clock or the bells, distances in feet, fathoms and miles, speed in knots.');   // personas 9, 11
    L.push('- Use the words of 1912: the wireless or the Marconi room, the distress call, lifebelts, boat stations; no word of a later day.');      // personas 10, 11
    L.push('- Give only your spoken words. No stage directions, no description, no quotation marks.');
    L.push('', 'WHAT YOU KNOW');
    L.push('- You know your trade and your ship, and what stands under THE FACTS. Nothing else has reached you.');
    L.push('- If you are asked what you do not know, say so plainly, or say who would know. Never guess a figure.');
    L.push('- Every number, time, name and report you speak of must stand in THE FACTS or above. Invent none.');
    L.push('- You do not know what the rest of the night will bring. You know nothing later than this moment.');
    L.push('- You are a man of 1912. Never speak of a simulation, a game, a model or a machine that thinks, or of being anything but yourself.');
    L.push('', 'ORDERS');
    if (c.remit.length) {
      L.push('- The captain gives the orders. If his words to you are a clear order that is yours to carry out, put that ONE order in "order" in the bridge\'s own words, and acknowledge it in "say".');
      L.push('- Yours to carry out: ' + c.remitWords + '.');
      L.push('- The bridge\'s order words: ' + orderWords(c.id, ctx).map(w => '"' + w + '"').join(', ') + '.');
      for (const x of conventionLines(ctx)) L.push(x);
      if (c.remit.indexOf('helm') >= 0) L.push('- A helm order that turns her must also say in "order" which way her head is to go, as in the words above, so that it cannot be mistaken. If you are not sure which way an order turns her, give none and ask the captain.');
      L.push('- Otherwise "order" is null. Never more than one order. Never say an order is done unless it is in "order".');
    } else {
      L.push('- The captain gives the orders. You are not one of her officers: you carry out none yourself, and "order" is always null.');
      for (const x of conventionLines(ctx)) L.push(x);
    }
    L.push('', 'YOUR ANSWER');
    L.push('A JSON object and nothing else: {"say": "...", "order": null} or {"say": "...", "order": "..."}.');
    return L.join('\n');
  }
  // talk: [{ t (the ship's time as shown), who, words }], oldest first; the captain's own lines have who 'You'
  function talkText(talk) {
    const L = ['THE TALK ON THE BRIDGE (newest last)'], T = Array.isArray(talk) ? talk.slice(-KEEP.talk) : [];
    if (!T.length) L.push('- Nothing has been said yet.');
    for (const x of T) { if (!x) continue; const who = x.who === 'You' ? 'the captain' : one(x.who); L.push('- ' + (x.t ? one(x.t) + ', ' : '') + who + ': ' + one(x.words)); }
    return L.join('\n');
  }
  function request(seat, x, talk, words, ctx) {
    const v = viewOf(x);
    const said = one(words).slice(0, WORDS_MAX);
    return { seat: String(seat), stable: stable(seat, ctx), changing: facts(v, seat, ctx) + '\n\n' + talkText(talk) + '\n\nTHE CAPTAIN SAYS TO YOU: ' + said };
  }
  function retry(req, faults) {
    const why = (faults || []).map(f => f.why || f.kind).filter(Boolean).join('; ') || 'it could not be read';
    return { seat: req.seat, stable: req.stable, changing: req.changing + '\n\nYOUR LAST ANSWER COULD NOT BE USED: ' + why + '. Answer the captain again, in the form asked.' };
  }
  // the one fixed form of a turn (design 6.2); app/minds.js TURN_SCHEMA is the same, key for key
  const SCHEMA = freeze({ type: 'object', properties: { say: { type: 'string' }, order: { anyOf: [{ type: 'string' }, { type: 'null' }] } }, required: ['say', 'order'], additionalProperties: false });

  // ------------------------------------------------------------------ reading a turn (design 6.2, 6.3 item 1)
  // the JSON objects in a text, at its top level: balanced braces outside strings
  function objectsIn(s) {
    const out = [];
    let depth = 0, start = -1, inStr = false, esc = false;
    for (let i = 0; i < s.length; i++) {
      const ch = s.charAt(i);
      if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
      if (ch === '"') { if (depth > 0) inStr = true; continue; }
      if (ch === '{') { if (depth === 0) start = i; depth++; }
      else if (ch === '}' && depth > 0) { depth--; if (depth === 0) { out.push(s.slice(start, i + 1)); start = -1; } }
    }
    return out;
  }
  // an "order" that says there is none (the second review: "None." was read as an order, and a notice then said his
  // order was not given)
  const NONE = { '': 1, 'null': 1, 'none': 1, 'no order': 1, 'no orders': 1, 'n/a': 1, 'na': 1, 'nil': 1, 'nothing': 1, 'no': 1, '-': 1, '--': 1 };
  function readTurn(text) {
    const bad = (fault, why) => ({ ok: false, fault, why });
    try {
      if (typeof text !== 'string') return bad('not text', 'your answer was not text');
      let s = text.split(BOM).join('').trim();
      // A model that thinks aloud puts its thinking in the answer itself, between <think> tags (many of those run on
      // one's own PC do). It is not his answer: it is dropped before the answer is read (never shown, never checked)
      s = s.replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, ' ').trim();
      if (!s) return bad('empty', 'your answer was empty');
      const fence = /```[a-zA-Z]*\s*([\s\S]*?)```/.exec(s);
      if (fence) s = fence[1].trim();
      let o, whole = true;
      try { o = JSON.parse(s); } catch (e) { whole = false; }
      if (!whole) {
        const objs = objectsIn(s);
        if (!objs.length) return bad('not json', 'your answer was not a JSON object');
        if (objs.length > 1) return bad('two objects', 'your answer held more than one JSON object');
        try { o = JSON.parse(objs[0]); } catch (e) { return bad('not json', 'your answer was not a JSON object'); }
      }
      if (!o || typeof o !== 'object' || Array.isArray(o)) return bad('not an object', 'your answer was JSON, but not an object');
      const extra = Object.keys(o).filter(k => k !== 'say' && k !== 'order');
      if (extra.length) return bad('extra field', 'your answer had a field "' + String(extra[0]).slice(0, 20) + '": give only "say" and "order"');
      if (!Object.prototype.hasOwnProperty.call(o, 'say')) return bad('no say', 'your answer had no "say"');
      if (!Object.prototype.hasOwnProperty.call(o, 'order')) return bad('no order', 'your answer had no "order" (null for none)');
      if (typeof o.say !== 'string') return bad('say not text', '"say" was not text');
      const say = one(o.say);
      if (!say) return bad('say empty', '"say" was empty');
      if (say.length > SAY_MAX) return bad('say too long', '"say" had ' + say.length + ' characters: at most ' + SAY_MAX);
      let order = null;
      if (o.order !== null) {
        if (typeof o.order !== 'string') return bad('order not text', '"order" was neither text nor null');
        const t = one(o.order);
        if (!NONE[t.toLowerCase().replace(/[\s.!]+$/, '')]) {
          if (t.length > ORDER_MAX) return bad('order too long', '"order" was too long: one order, in the bridge\'s words');
          order = t;
        }
      }
      return { ok: true, say, order };
    } catch (e) {
      return bad('not json', 'your answer could not be read');
    }
  }

  // ------------------------------------------------------------------ the checks on the words (design 6.3)
  // Each list is data: the word or phrase, why it fails, and where that comes from.
  // 4. Its world: words that give the frame away (design 6.3), and words a British officer of 1912 did not say
  // (personas section 11, its first column; that note's sources are named there)
  const WORLD = [
    ['\\bas an ai\\b', 'i', 'it gives the frame away: he is a man of 1912', 'design 6.3'],
    ['\\bAI\\b', '', 'it gives the frame away: he is a man of 1912', 'design 6.3'],
    ['\\bartificial intelligence\\b', 'i', 'it gives the frame away', 'design 6.3'],
    ['\\blanguage model\\b', 'i', 'it gives the frame away', 'design 6.3'],
    ['\\bsimulat(ion|ions|ed|or|ing)\\b', 'i', 'it gives the frame away', 'design 6.3'],
    ['\\b(video game|chatbot|computer|algorithm|the player|json)\\b', 'i', 'it gives the frame away', 'design 6.3'],
    // (the review of stage A: each of these passed, and would have been shown as the man's own line)
    // (the second review: "Castor in Gemini" is a star sight, "the prompt answer of the engine room" and "my instructions
    // are to call you" a man's own words, and "I'm sorry, but I cannot say, sir" his own way of not knowing: each failed.
    // So a refusal is one that names what a language model refuses, and "my instructions" one that quotes them)
    ['\\b(claude|anthropic|openai|chatgpt|gpt(-?\\d[\\w.]*)?|llm|google gemini|gemini (pro|flash|ultra|nano|\\d[\\w.]*)|cerebras)\\b', 'i', 'it names a language model or its maker: he is a man of 1912', 'design 6.3'],
    ['\\b(ai|virtual|digital|helpful|your) assistant\\b|\\bas an assistant\\b', 'i', 'it gives the frame away', 'design 6.3'],
    ['\\brole-? ?play(s|ed|ing)?\\b|\\bportray(s|ed|ing|al)?\\b|\\bfictional\\b|\\b(in|out of|break|breaking|stay|staying in) character\\b', 'i', 'it gives the frame away: he is the man, not a part played', 'design 6.3'],
    ['\\b(system|my|your) prompt\\b|\\bthe prompt (says|said|tells|told|asks|asked|instructs|instructed|given|provided|above|below|states|stated|does not|doesn\'t)\\b|\\bthe user\\b|\\ba real person\\b'
      + '|\\bmy (guidelines|training data|programming)\\b|\\bmy instructions (say|said|do not|don\'t|forbid|prevent|tell me|told me|state)\\b', 'i', 'it gives the frame away', 'design 6.3'],
    ['\\b(I(\'m| am) sorry|sorry|I apologi[sz]e|my apologies),? (but )?I (can\'?t|cannot|won\'?t|will not|am unable to|am not able to) (assist|comply|continue|provide|portray|role-?play|pretend|fulfil+|generate|engage|help with (that|this)|do that)\\b'
      + '|\\bI (can\'?t|cannot|am unable to) (comply|assist|continue)\\b|\\b(unfortunately|regrettably),? I (am unable to|am not able to|cannot|can\'?t)\\b|\\bI (do not|don\'t) have (that|this|any|enough) information\\b', 'i',
      'it refuses in a voice that is not his: say what he would say, or that he could not say', 'design 6.3'],
    ['\\b(this|only a|just a) game\\b|\\bscenario\\b|\\b(just|only|merely) a character\\b|\\binformation provided\\b|\\bbased on (the|what) (information|context|facts)\\b|\\bthe context\\b'
      + '|\\bthe facts I (was|have been) given\\b|\\bI was given (the|these) facts\\b', 'i', 'it gives the frame away', 'design 6.3'],
    ['\\bTHE FACTS\\b', '', 'it names the paper he was handed: he knows these things, he was not given a list', 'design 6.3'],
    ['\\b(asap|gonna|wanna|gotta|sounds good|no problem|lol)\\b', 'i', 'not a word of 1912', 'design 6.3'],
    ['\\b(pa system|public address|loudspeakers?|tannoy|intercom|walkie-?talkies?)\\b', 'i', 'not of 1912: the telephones, the voice pipes, a megaphone', 'design 6.3'],
    ['\\b(radar|sonar)\\b', 'i', 'not of 1912', 'design 6.3'],
    ['\\b(okay|ok)\\b', 'i', 'an American coinage, not a British officer\'s word in 1912: "all right", "very well"', 'personas 11'],
    ['\\b(roger|wilco|affirmative|negative|over and out)\\b', 'i', 'voice-radio words of a later day: "yes, sir", "all right"', 'personas 11'],
    ['\\bcopy that\\b', 'i', 'later radio jargon: "thank you", "all right"', 'personas 11'],
    ['\\bmayday\\b', 'i', 'adopted as the spoken distress call in 1927: "C.Q.D.", "the distress call"', 'personas 11'],
    ['\\bS\\.?O\\.?S\\b', '', 'the distress call was C.Q.D. that night: "the distress call", unless THE FACTS say SOS was sent', 'personas 11', 'facts'],
    ['\\bhard to (port|starboard)\\b', 'i', 'a direct rudder order: British ships gave tiller orders until 1933', 'personas 11', '1912'],
    ['\\bradio\\b', 'i', 'in 1912 "the wireless", "the Marconi room"', 'personas 11'],
    ['\\blife ?(jacket|vest)s?\\b', 'i', 'in 1912 "lifebelts", "belts"', 'personas 11'],
    ['\\babandon ship\\b', 'i', 'not an order of that night: "get all the boats out"', 'personas 11'],
    ['\\b(muster|lifeboat) stations?\\b', 'i', 'in 1912 "boat stations"', 'personas 11'],
    ['\\bbridge to engine room\\b', 'i', 'engine orders went by telegraph, not spoken', 'personas 11'],
    ['\\biceberg dead ahead\\b', 'i', 'the recorded report is "Iceberg right ahead"', 'personas 11'],
    ['\\b([01][0-9]|2[0-3])[0-5][0-9] hours\\b', 'i', 'the twelve-hour clock and the bells, not the twenty-four-hour clock', 'personas 11'],
    ['\\btwenty-?(one|two|three) (hundred|forty|thirty|twenty|fifteen|ten|oh)\\b', 'i', 'the twelve-hour clock and the bells, not the twenty-four-hour clock', 'personas 11'],
    ['\\b(kilo)?met(re|er)s?\\b|\\b(celsius|centigrade)\\b', 'i', 'feet, fathoms, miles, knots and degrees Fahrenheit', 'personas 11'],
    ['\\b(hull breach|damage control|status report|evacuat(e|ed|ing|ion))\\b', 'i', 'a later technical register: "she is making water", "get the boats out"', 'personas 11'],
    ['\\bcaptain smith\\b|\\bskipper\\b', 'i', 'the captain is "sir" to his face', 'personas 11'],
    ['\\b(guys|folks|gotten)\\b', 'i', 'Americanisms: "men", "you fellows", "got"', 'personas 11'],
  ];
  // 5. The end: nothing about how the night ends, or about any man's fate (design 6.3; personas (f) and (g))
  // The review of stage A found the first list both too wide and too narrow: it failed plain speech ("a dead calm",
  // "the telephone is dead", "her head sank", "I will make inquiry", "the wind has died away", "the fires are drowned",
  // each costing a retry and then the floor line) and missed the prophecy a model of today is most tempted to ("she will
  // founder", "nobody will be saved"). So each row now names WHOSE end it is: the ship's, or people's. A row marked
  // 'told' passes once Mr Andrews's estimate stands in THE FACTS: the man may then repeat what the bridge has been told.
  const PEOPLE = '(he|they|we|you|men|man|people|passengers|crew|women|children|souls|many|most|few|all|hundreds|thousands|everyone|everybody|someone|nobody|no one)';   // not "she": the ship
  // The second review found it still both: it failed "Mr Boxhall went down below to look", "she went down by the head",
  // "we are dead in the water", "in the dead calm", "she is coming to the rescue", and passed "She'll sink", "She's done
  // for", "She is sinking", "Mr Wilde will die at his post". So: her trim ("by the head") is not her end; "dead" before
  // calm, slow, reckoning or in the water is no man's; a rescue she is coming TO is news, not the end; the short forms
  // are read as the long ones (check(), below); and a man named with his fate is a row of its own.
  const TRIM = '(?! (?:a little |further |more |fast |slowly |deeper |well |heavily )?by the (?:head|bows?|stern))';
  const DEAD_OK = '(?! (?:in the water|calm|slow|ahead|astern|reckoning|quiet|of night|silence|still|weight|lights?|level|flat|abeam|aft|slack|stop))';
  const NOT_SHIP = '(?! (?:ship|steamer|vessel|boat))';
  const END = [
    ['\\b(she|ship|titanic|vessel|steamer|liner)\\b[^.!?]{0,24}\\b(sank|has sunk|had sunk|went down|was lost|foundered)\\b' + TRIM + '(?! to (?:sight|view))', 'i', 'how the night ends', 'design 6.3'],
    ['\\b(sank|sunk) (at|in|with|beneath|below|to the bottom|that night)\\b|\\bwent down (to the bottom|that night|with all hands)\\b', 'i', 'how the night ends', 'design 6.3'],
    ['\\b(she|ship|titanic|vessel)\\b[^.!?]{0,24}\\b(will|is going to|must|is bound to|is sure to) (sink|founder|go down|be lost)\\b|\\b(she|ship|titanic)(\'s| is) (doomed|finished|done for)\\b|\\b(she|ship|titanic) is lost\\b'
      + '|\\b(cannot|can not|will not) (float|stay afloat|live|be saved)\\b|\\b(she|ship|titanic|vessel) (will|shall) be gone\\b', 'i', 'what will become of her: you have not been told she will founder', 'design 6.3', 'told'],
    ['\\b(she|ship|titanic|vessel)\\b[^.!?]{0,24}(\\bis|\'s) (sinking' + TRIM + '|going to the bottom|going down' + TRIM + ')|\\b(she|ship|titanic|vessel)\\b[^.!?]{0,24}\\b(will not|cannot|can not) last\\b'
      + '|\\bnothing can save (her|the ship|us)\\b|\\bwe (shall|will|are going to|are bound to) lose (her|the ship)\\b'
      + '|\\b(she|ship|titanic|vessel)\\b[^.!?]{0,24}\\b(gone|under|lost|at the bottom) (by|before) (one|two|three|four|five|six|dawn|daylight|morning|sunrise|\\d)'
      + '|\\bI give her\\b[^.!?]{0,30}\\b(hours?|minutes|long)\\b|\\b(she|ship|titanic|vessel)\\b[^.!?]{0,40}\\b(hours?|minutes) (left|to live|at most|at the outside)\\b', 'i',
      'what will become of her: you have not been told she will founder', 'design 6.3', 'told'],
    ['\\b(break|breaks|breaking|broke|broken) in (two|half)\\b', 'i', 'how the night ends', 'design 6.3'],
    ['\\b' + PEOPLE + '\\b[^.!?]{0,24}\\b(drown|drowns|drowned|drowning|die|dies|died|dying|perish|perishes|perished|perishing|killed)\\b', 'i', 'a man\'s fate', 'design 6.3'],
    ['\\b(Mr|Mister|Captain|Doctor|Dr|Quartermaster) [A-Z][a-zA-Z\'-]+\\b[^.!?]{0,24}\\b(will|shall|is going to|is to|must) (die|drown|perish|be lost|be drowned|freeze|go down with|not live|not survive|not see)\\b', 'i', 'a man\'s fate', 'design 6.3'],
    ['\\b(deaths|drownings?|(their|his|certain|a watery) deaths?)\\b', 'i', 'a man\'s fate', 'design 6.3'],
    ['\\b' + PEOPLE + '\\b[^.!?]{0,24}\\b(is|are|was|were|will be|lie|lies|lay) dead\\b' + DEAD_OK + '|\\b(the|our|her) dead\\b' + DEAD_OK + '|\\bdead (men|man|bodies|body)\\b', 'i', 'a man\'s fate', 'design 6.3'],
    ['\\b(nobody|no one|none|not a soul|few|hundreds|most|all)\\b[^.!?]{0,24}\\b(will|can|could|shall) (be saved|be lost|be rescued|live|survive)\\b|\\bwe (will|shall) all be (lost|drowned)\\b', 'i', 'a man\'s fate', 'design 6.3'],
    ['\\b(surviv(e|es|ed|ing|ors?|al)|rescued)\\b|(?:^|[.!?,;:] ?)the rescue\\b' + NOT_SHIP + '|\\b(?!to )\\w+ the rescue\\b' + NOT_SHIP, 'i', 'how the night ends', 'design 6.3'],
    ['\\b(was|were) last seen\\b|\\blast seen (on|in|at|by)\\b|\\bto the (very|bitter) end\\b|\\buntil the very end\\b', 'i', 'how the night ends', 'design 6.3'],
    ['\\b(I|we) (shall|will) (not|never) see\\b[^.!?]{0,30}\\bagain\\b', 'i', 'a man\'s fate', 'design 6.3'],
    ['\\b(lives lost|lost (their|his|her) lives?|lost with all hands)\\b', 'i', 'a man\'s fate', 'design 6.3'],
    ['\\bgo(es|ing)? down with (her|the ship|his ship)\\b', 'i', 'a man\'s fate, and a legend', 'personas (f), (g)'],
    ['\\b' + PEOPLE + '\\b[^.!?]{0,24}\\b(will|shall) (freeze|not last|not live)\\b', 'i', 'a man\'s fate', 'design 6.3'],
    ['\\bunsinkable\\b|\\bgod himself\\b', 'i', 'a legend: no sourced word of anyone aboard', 'personas 6(g)'],
    ['\\bbe british\\b|\\b(pistols?|revolvers?|gunshots?)\\b|\\b(turn|turns|turned|turning|steer|steers|steered|put|puts|went) (her |it |the wheel |the helm )?the wrong way\\b', 'i', 'a contested story of later that night', 'personas 2(g)'],
    ['\\b(the|british|american|senate|official|court of|later) inquir(y|ies)\\b', 'i', 'after the night', 'personas (f)'],   // not "I will make inquiry": to ask
    ['\\bevery man for himself\\b', 'i', 'not found in the testimony: a later account', 'NB L253'],
    ['\\bnearer,? my god\\b|\\bthe band (played|plays|playing|will play|is playing|play)\\b', 'i', 'a legend of the end', 'design 2, rule 8'],
    ['\\b(suicide|shot himself|bribe|bribed)\\b', 'i', 'a contested story', 'personas 2(g)'],
  ];
  const re = (row) => new RegExp(row[0], row[1] + 'g');
  // ship names a man might speak (the other ships of core/readers/world.js; the ice warnings, NB L188; the cards' ships):
  // a ship named must be one the bridge has been told of, or one on his card
  const SHIPS = ['Carpathia', 'Californian', 'Mount Temple', 'Frankfurt', 'Birma', 'Virginian', 'Baltic', 'Olympic', 'Parisian', 'Caronia', 'Amerika', 'Mesaba',
    'Medic', 'Runic', 'Arabic', 'Celtic', 'Oceanic', 'Cedric', 'Adriatic', 'Megantic', 'Teutonic', 'Majestic', 'Coptic', 'Laurentic', 'Lusitania', 'Mauretania',
    'Dongola', 'Boadicea', 'Charles Cotesworth', 'Conway'];
  // people aboard named in the two notes (NB sections 1, 3, 4; personas sections 1 to 8): a person named must be aboard
  const ABOARD = ['Smith', 'Murdoch', 'Lightoller', 'Pitman', 'Boxhall', 'Lowe', 'Moody', 'Wilde', 'Hichens', 'Olliver', 'Rowe', 'Perkis', 'Bright', 'Fleet', 'Lee',
    'Symons', 'Jewell', 'Hogg', 'Evans', 'Phillips', 'Bride', 'Andrews', 'Bell', 'Hemming', 'Barrett', 'Hesketh', 'Hendrickson', 'Poingdestre', 'Harvey', 'Wilson',
    'Cavell', 'Dillon', 'Scott', 'Ismay', 'Beesley', 'Jones', 'Etches'];
  // named in the repository and not aboard (core/readers/world.js names them): a man on the bridge could not speak of them
  const NOT_ABOARD = ['Rostron', 'Cottam'];
  // ships whose names are also plain words: named only with their capital ("a majestic sight" names no ship)
  const SHIP_WORDS = { majestic: 1, celtic: 1, arabic: 1, baltic: 1, oceanic: 1, medic: 1, runic: 1, coptic: 1, teutonic: 1, adriatic: 1 };
  // a title and a name. Only an abbreviation takes a full stop ("Mr. Moody"): "Gladly, Captain. It is a fine night."
  // names nobody (the second review: it failed as a person "Captain. It")
  const TITLE = /\b(?:(?:Mr|Mrs|Dr|Capt)\.?|Mister|Miss|Captain|Doctor) ([A-Z][a-zA-Z'-]+)/g;
  const TIME = /\b(\d{1,2})[:.](\d{2})\b/g;
  const DIGITS = /\b\d+(?:\.\d+)?\b/g;
  const UNITS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
    fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19 };
  const TENS = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
  // numbers said in words ("twenty-five", "two hundred and fifty", "a hundred"); each run of number words is one number
  function wordNumbers(s) {
    const T = String(s).toLowerCase().split(/[^a-z]+/), out = [];
    let cur = 0, total = 0, any = false;
    const flush = () => { if (any) out.push(total + cur); cur = 0; total = 0; any = false; };
    for (let i = 0; i < T.length; i++) {
      const w = T[i];
      if (UNITS[w] !== undefined) { if (any && cur % 10 !== 0) flush(); cur += UNITS[w]; any = true; }
      else if (TENS[w] !== undefined) { if (any && cur % 100 !== 0) flush(); cur += TENS[w]; any = true; }
      else if (w === 'hundred' && any) cur = (cur || 1) * 100;
      else if (w === 'thousand' && any) { total += (cur || 1) * 1000; cur = 0; }
      else if (w === 'a' && (T[i + 1] === 'hundred' || T[i + 1] === 'thousand')) { flush(); cur = 1; any = true; }
      else if (w === 'and' && any && cur >= 100 && (UNITS[T[i + 1]] !== undefined || TENS[T[i + 1]] !== undefined)) { /* "two hundred and fifty" */ }
      else flush();
    }
    flush();
    return out;
  }
  const timeKey = (h, m) => (+h) + ':' + m;
  function cardText(card) {
    if (!card) return '';
    if (typeof card === 'string') return card;
    const c = card.id && BY[card.id] ? BY[card.id] : card;
    return [c.full, c.name, c.rank, c.where, 'Sunday 14 April 1912'].concat(c.card || [], c.voice || []).join('\n');
  }
  // the numbers and the times a text holds, for the checks. A time's hour and minutes are NOT figures he may then speak
  // (the review of stage A: with a dozen times in THE FACTS, "47 feet of water" and "12 degrees of list" passed)
  // A time written in words in what he knows is a time he knows (the second review: a man's own card says "at ten
  // o'clock", "at about half past nine", "a quarter to ten", and his repeating it failed as a time he did not know)
  function known(text) {
    const s = String(text);
    const times = new Set(), nums = new Set();
    let rest = s;
    for (const m of s.matchAll(TIME)) { times.add(timeKey(m[1], m[2])); rest = rest.split(m[0]).join(' '); }
    for (const m of rest.replace(RE_APOS, '\'').matchAll(/\b(\d{1,2}) ?(?:o'clock|a\.?m\.?|p\.?m\.?)(?![a-z])/gi)) times.add((+m[1]) + ':00');
    for (const m of rest.matchAll(DIGITS)) nums.add(+m[0]);
    for (const n of wordNumbers(rest)) nums.add(n);
    const found = new Set();
    spokenTimes(rest, times, found);
    for (const k of found) times.add(k);
    return { times, nums, text: s };
  }
  // A clock time said in words, as a man says it: "eleven forty", "twenty to twelve", "half past eleven", "a quarter past
  // twelve", "twelve o'clock"; and a time by the bells ("eight bells"). Returns the words left when each is struck out
  // (so that its hour and its minutes are not then read as figures), and those that name a time he does not know. An
  // hour "o'clock" is known when any time he knows is in that hour; the bells are his trade, and are not checked.
  // With `found` (a Set) every time it reads is put there too, as "h:mm": known() reads what a man knows with it.
  // The second review's cases, each of which failed a good line:
  //   - a watch's name is not a clock time: "the ten-to-two watch", "the twelve-to-four" (a four-hour span whose first
  //     hour nobody says as minutes; "ten to two" alone is ten minutes to two, and a watch only with the word);
  //   - a range is not a clock time: "two to three minutes", "boiler rooms two to six", "from ten to twelve";
  //   - an hour said alone after "at", "about", "since" ... is that hour when he knows a time in it ("relieved at
  //     twelve", "he made it about eleven"), not a figure; before a measure it stays a figure ("at twelve knots").
  const HOURS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
  const pad2 = (n) => (n < 10 ? '0' : '') + n;
  const WATCH_FROM = { 12: 1, 4: 1, 8: 1, 2: 1, 6: 1 };
  const MEASURE = /^(?:knots?|degrees?|points?|miles?|feet|foot|fathoms?|yards?|tons?|revolutions?|men|minutes?|hours?|seconds?|inch|inches|pounds?|cables?|bells?|hundred|thousand|times?|days?|years?|boats?|rockets?|people|hands)$/;
  const LABELLED = /^(?:rooms?|holds?|boats?|numbers?|nos?|bulkheads?|compartments?|sections?|frames?|decks?|tanks?|funnels?|hatches)$/;
  const HOUR_AFTER = { at: 1, about: 1, by: 1, since: 1, till: 1, until: 1, nearly: 1, gone: 1, before: 1, after: 1, around: 1, towards: 1, from: 1 };
  const NOT_PLURAL = { this: 1, his: 1, is: 1, was: 1, as: 1, us: 1, has: 1, its: 1, yes: 1, perhaps: 1, always: 1, unless: 1 };
  const figureNext = (x) => x !== undefined && (UNITS[x] !== undefined || TENS[x] !== undefined || MEASURE.test(x) || x === 'or' || x === 'and' || x === 'to' || x === 'of' || (/s$/.test(x) && !NOT_PLURAL[x]));
  function spokenTimes(text, times, found) {
    const w = String(text).toLowerCase().replace(RE_APOS, '\'').replace(/o'clock/g, 'oclock').split(/[^a-z]+/).filter(Boolean);
    const has = (h, m) => { if (found) found.add(h + ':' + pad2(m)); return times.has(h + ':' + pad2(m)); };
    const hourKnown = (h) => { if (found) found.add(h + ':00'); for (const k of times) if (k.indexOf(h + ':') === 0) return true; return false; };
    // minutes in words from w[i]: "five", "oh five", "forty", "forty five" -> { v, n: words taken, oh }
    const minAt = (i) => {
      const oh = w[i] === 'oh', j = oh ? i + 1 : i;
      if (UNITS[w[j]] !== undefined) return oh && UNITS[w[j]] > 9 ? null : { v: UNITS[w[j]], n: j - i + 1, oh };
      if (!oh && TENS[w[j]] !== undefined && TENS[w[j]] < 60) { const u = UNITS[w[j + 1]]; return u !== undefined && u < 10 ? { v: TENS[w[j]] + u, n: 2, oh } : { v: TENS[w[j]], n: 1, oh }; }
      return null;
    };
    const left = [], unknown = [];
    let i = 0;
    while (i < w.length) {
      let n = 0, ok = true;
      // "twenty to twelve", "ten minutes past eleven", "a quarter past twelve", "half past eleven"
      let j = i, mm = -1;
      if (w[j] === 'a' && w[j + 1] === 'quarter') { mm = 15; j += 2; } else if (w[j] === 'quarter') { mm = 15; j++; } else if (w[j] === 'half') { mm = 30; j++; }
      else { const m = minAt(j); if (m && !m.oh && m.v >= 1 && m.v <= 59) { mm = m.v; j += m.n; } }
      if (mm > 0) {
        const minutes = w[j] === 'minutes' || w[j] === 'minute';
        const bare = !minutes && j === i + 1 && HOURS[w[i]] !== undefined;      // the minutes were one hour word, and no "minutes" said
        if (minutes) j++;
        const way = w[j], h = HOURS[w[j + 1]];
        if ((way === 'past' || way === 'after' || way === 'to' || way === 'before') && h !== undefined) {
          const past = way === 'past' || way === 'after', len = j + 2 - i, first = HOURS[w[i]], next = w[i + len];
          const range = way === 'to' && bare && (w[i - 1] === 'from' || w[i - 1] === 'between' || LABELLED.test(w[i - 1] || '') || (next !== undefined && MEASURE.test(next)));
          const span = way === 'to' && bare && (first + 3) % 12 + 1 === h && (WATCH_FROM[first] || next === 'watch' || next === 'watches');
          if (range) { /* figures, read below as figures */ }
          else if (span) { n = len; ok = true; }                                              // a watch's name
          else { ok = past ? has(h, mm) : has(h === 1 ? 12 : h - 1, 60 - mm); n = len; if (w[i + n] === 'oclock') n++; }
        }
      }
      if (!n && HOURS[w[i]] !== undefined && TENS[w[i - 1]] === undefined) {                    // (not the "three" of "twenty-three forty")
        const h = HOURS[w[i]], m = minAt(i + 1);
        if (w[i + 1] === 'oclock') { n = 2; ok = hourKnown(h); }                              // "twelve o'clock"
        else if (m && m.v <= 59 && (m.v >= 10 || m.oh) && !(w[i + 1 + m.n] !== undefined && MEASURE.test(w[i + 1 + m.n]))) { n = 1 + m.n; ok = has(h, m.v); }   // "eleven forty", "twelve oh five"; not "seven fifty tons"
      }
      if (!n && UNITS[w[i]] !== undefined && UNITS[w[i]] <= 8 && (w[i + 1] === 'bells' || w[i + 1] === 'bell')) { n = 2; ok = true; }   // "eight bells"
      // an hour said alone: "relieved at twelve", "since ten". In what he knows it is a time he knows; in his own line
      // it is taken for the hour only when he knows a time in that hour (otherwise it is read as a figure, as before)
      if (!n && HOURS[w[i]] !== undefined && HOUR_AFTER[w[i - 1]] && !figureNext(w[i + 1])) {
        if (found) { found.add(HOURS[w[i]] + ':00'); n = 1; ok = true; }
        else if (hourKnown(HOURS[w[i]])) { n = 1; ok = true; }
      }
      if (n) { if (!ok) unknown.push(w.slice(i, i + n).join(' ').replace(/oclock/g, 'o\'clock')); i += n; left.push('.'); }
      else left.push(w[i++]);
    }
    return { left: left.join(' '), unknown };
  }
  // A measure said with its unit is held to that measure in what he knows. THE FACTS always name boiler rooms 1 to 6
  // and holds 1 to 3, so as bare figures 1 to 6 are always known, and "6 feet of water in boiler room 4" and "a list
  // of five degrees" passed when neither was so (the second review). Feet and degrees are the two a man is asked for
  // (the water, her list and trim): each such figure must stand with the same unit in THE FACTS or on his card. And
  // boats said to be away are held to the count THE FACTS give.
  // (The review of this check: it failed good lines. "Five of the twenty boats are away" was read as twenty away; "none
  // of the twenty boats", "not one boat" and "no boat" as a count away; "twenty degrees of helm" was not known though THE
  // FACTS said "Port twenty". And it did not read fathoms, inches, the degree sign or "deg". So: punctuation ends a
  // phrase; "N of the M boats" counts N; none, not one and no boat count nought; the helm's own degrees are known.)
  const MEASURE_UNIT = { feet: 'feet', foot: 'feet', ft: 'feet', degrees: 'degrees', degree: 'degrees', deg: 'degrees', fathoms: 'fathoms', fathom: 'fathoms', inches: 'inches', inch: 'inches' };
  const NUMBERISH = (w) => /^\d/.test(w) || UNITS[w] !== undefined || TENS[w] !== undefined || w === 'hundred' || w === 'thousand';
  const PUNCT = /^[.,;:!?]$/;
  const DEGREE_SIGN = String.fromCharCode(176);    // (this file is ASCII)
  const AWAY = { away: 1, gone: 1, lowered: 1, launched: 1 };
  const COULD = { can: 1, could: 1, will: 1, shall: 1, may: 1, might: 1, must: 1, should: 1, would: 1, to: 1 };
  function measures(text) {
    // "a forty-foot boat" is no depth ("six-foot of water" is: a seaman's way of saying six feet); the degree sign and
    // "deg." are degrees; punctuation is kept, so that a figure is never joined to the words of another phrase
    const s = String(text).toLowerCase().replace(RE_APOS, '\'').split(DEGREE_SIGN).join(' degrees ').replace(/([a-z0-9])-(foot|feet)\b(?! of\b)/g, '$1 footlong');
    const T = s.match(/\d+(?:\.\d+)?|[a-z]+|[.,;:!?]/g) || [], out = [];
    const numberBefore = (i) => {                       // the number that ends just before token i, or null
      let j = i - 1;
      if (j >= 0 && /^\d/.test(T[j])) return { n: +T[j], from: j };
      const run = [];
      while (j >= 0 && run.length < 6 && (NUMBERISH(T[j]) && !/^\d/.test(T[j]) || (T[j] === 'and' && run.length && j > 0 && NUMBERISH(T[j - 1])))) run.unshift(T[j--]);
      if (!run.length) return null;
      const n = wordNumbers(run.join(' '));
      return n.length ? { n: n[n.length - 1], from: j + 1 } : null;
    };
    for (let i = 0; i < T.length; i++) {
      const unit = MEASURE_UNIT[T[i]];
      if (unit) { const b = numberBefore(i); if (b) out.push({ n: b.n, unit, said: T.slice(b.from, i + 1).join(' ') }); continue; }
      if (T[i] === 'boats' || T[i] === 'boat') {
        // Only a count SAID to be away, gone, lowered or launched, in the same phrase (not "all twenty boats can be
        // lowered in an hour": what could be; not "of the twenty boats, five are away": another phrase)
        const after = []; for (let j = i + 1; j < T.length && after.length < 4 && !PUNCT.test(T[j]); j++) after.push(T[j]);
        const at = after.findIndex(w => AWAY[w]);
        if (at < 0 || after.slice(0, at).some(w => COULD[w])) continue;
        // whose count it is: "five boats", "five of the boats", "five of the twenty boats" (five, not twenty); "no boat",
        // "none of the boats", "not one of the twenty boats" are nought; "No. 7 boat" is a boat's name, no count
        const total = numberBefore(i);
        let k = total ? total.from - 1 : i - 1, n = null, from = i;
        if (T[k] === 'the' || T[k] === 'our' || T[k] === 'her') k--;
        if (T[k] === 'of') {
          const c = numberBefore(k);
          if (c) { n = c.n; from = c.from; if (T[c.from - 1] === 'not') { n = 0; from = c.from - 1; } }
          else if (T[k - 1] === 'none') { n = 0; from = k - 1; }
          else continue;                              // "most of the boats", "some of the boats": no count
        } else if (total) {
          const label = PUNCT.test(T[total.from - 1] || '') ? T[total.from - 2] : T[total.from - 1];
          if (label === 'no' || label === 'nos' || label === 'number' || label === 'numbers') continue;
          n = total.n; from = total.from;
          if (T[total.from - 1] === 'not') { n = 0; from = total.from - 1; }
        } else if (T[i - 1] === 'no') { n = 0; from = i - 1; }
        else continue;
        out.push({ n, unit: 'boats away', said: T.slice(from, i + 1).join(' ') + ' away' });
      }
    }
    return out;
  }
  function measuresKnown(text) {
    const K = new Set(), s = String(text), lower = s.toLowerCase();
    for (const m of measures(s)) K.add(m.n + '|' + m.unit);
    // THE FACTS' own count of the boats away; and until they give one, none is away
    let counted = false;
    for (const m of s.matchAll(/\bAway: (\d+) of (\d+)\b/g)) { K.add((+m[1]) + '|boats away'); counted = true; }
    if (!counted) K.add('0|boats away');
    // the helm's own degrees: "Port twenty" is twenty degrees of helm, and hard over is forty
    for (const m of lower.matchAll(/\b(?:port|starboard) (\d{1,2}|[a-z]+(?:[ -][a-z]+)?)/g)) {
      const n = /^\d/.test(m[1]) ? [+m[1]] : wordNumbers(m[1]);
      if (n.length && n[0] >= 1 && n[0] <= 40) K.add(n[0] + '|degrees');
    }
    if (/\bhard (?:a-|to |over)/.test(lower)) K.add('40|degrees');
    return K;
  }
  function check(say, factsText, card, ctx) {
    const faults = [], s = String(say === undefined || say === null ? '' : say);
    const allowed = known(String(factsText === undefined || factsText === null ? '' : factsText) + '\n' + cardText(card));
    const add = (kind, what, why) => { if (!faults.some(f => f.kind === kind && f.what === what)) faults.push({ kind, what, why }); };
    // 1. no stage directions (the form of the words; the JSON's shape is readTurn's)
    const stage = /\*[^*]+\*|\[[^\]]*\]|\([^)]*\)/.exec(s);
    if (stage) add('stage', stage[0], 'it had a stage direction, ' + stage[0] + ': give only your spoken words');
    // nor a speaker's label before them ("Mr Murdoch: ..."): the page says who speaks
    const label = /^\s*(?:(?:Mr|Mister|Captain|Capt)\.? [A-Z][a-zA-Z'-]+|(?:First|Second|Third|Fourth|Fifth|Sixth|Chief) (?:Officer|Engineer)(?: [A-Z][a-zA-Z'-]+)?|Quartermaster(?: [A-Z][a-zA-Z'-]+)?):\s/.exec(s);
    if (label) add('stage', one(label[0]), 'it began with a speaker\'s label, ' + one(label[0]) + ' give only your spoken words');
    // 2. its numbers: every clock time, every number in digits, every number in words from two up
    let rest = s;
    for (const m of s.matchAll(TIME)) {
      const key = timeKey(m[1], m[2]);
      if (!allowed.times.has(key) && !(m[0].indexOf('.') >= 0 && allowed.nums.has(+m[0]))) add('time', m[0], 'it gave the time ' + m[0] + ', which is not in what you know');
      rest = rest.split(m[0]).join(' ');
    }
    // an hour in figures with "o'clock", "am" or "pm" ("at 12 o'clock") is a time: known when a time he knows is in that hour
    rest = rest.replace(RE_APOS, '\'').replace(/\b(\d{1,2}) ?(o'clock|a\.?m\.?|p\.?m\.?)(?![a-z])/gi, (m0, h) => {
      let ok = false; for (const k of allowed.times) if (k.indexOf((+h) + ':') === 0) ok = true;
      if (!ok) add('time', m0, 'it gave the time ' + m0 + ', which is not in what you know');
      return ' ';
    });
    for (const m of rest.matchAll(DIGITS)) if (!allowed.nums.has(+m[0])) add('number', m[0], 'it gave the figure ' + m[0] + ', which is not in what you know');
    // a time said in words is held to the times he knows, and its hour and minutes are then not read as figures
    const spoken = spokenTimes(rest, allowed.times);
    for (const t of spoken.unknown) add('time', t, 'it gave the time "' + t + '", which is not in what you know');
    for (const n of wordNumbers(spoken.left)) if (n >= 2 && !allowed.nums.has(n)) add('number', String(n), 'it gave the figure ' + n + ' in words, which is not in what you know');
    // a measure with its unit (feet, degrees, boats away) is held to the same measure in what he knows
    const pairs = measuresKnown(allowed.text);
    for (const m of measures(s)) if (!pairs.has(m.n + '|' + m.unit)) add('number', m.said, 'it gave "' + m.said + '", and no such measure is in what you know');
    // 3. its names: a ship named is one he has been told of or one on his card; a person named is aboard
    // (in any case: "the carpathia" names her too; her sister the Olympic every man aboard knew)
    const toldOf = allowed.text.toLowerCase();
    for (const ship of SHIPS) {
      if (KNOWN_SHIPS.indexOf(ship) >= 0) continue;
      if (new RegExp('\\b' + ship + '\\b', SHIP_WORDS[ship.toLowerCase()] ? '' : 'i').test(s) && toldOf.indexOf(ship.toLowerCase()) < 0) add('ship', ship, 'it named the ' + ship + ', of whom you have not been told');
    }
    for (const m of s.matchAll(TITLE)) {
      const name = m[1].replace(/'s?$/, '');                 // "Mr Murdoch's eye" names Mr Murdoch
      if (ABOARD.indexOf(name) < 0 && allowed.text.indexOf(name) < 0) add('person', m[0], 'it named ' + m[0] + ', who is not aboard');
    }
    for (const name of NOT_ABOARD) if (new RegExp('\\b' + name + '\\b').test(s) && allowed.text.indexOf(name) < 0) add('person', name, 'it named ' + name + ', who is not aboard');
    // 4. its world, and 5. the end. The lists are written with the plain apostrophe; and for the end a short form is
    // read as its long one, so that "She'll sink" and "She can't stay afloat" are what "She will sink" is
    const plain = s.replace(RE_APOS, '\'');
    for (const row of WORLD) {
      if (row[4] === '1912' && convOf(ctx) === 'modern') continue;
      const m = re(row).exec(plain);
      if (!m) continue;
      if (row[4] === 'facts' && re(row).test(allowed.text)) continue;
      add('world', m[0], 'it said "' + m[0] + '": ' + row[2]);
    }
    const told = allowed.text.indexOf(ESTIMATE_LINE) >= 0;      // Mr Andrews's estimate has reached the bridge
    const long = plain.replace(/'ll\b/gi, ' will').replace(/\bcan't\b/gi, 'cannot').replace(/\bwon't\b/gi, 'will not').replace(/\bshan't\b/gi, 'shall not');
    for (const row of END) {
      if (row[4] === 'told' && told) continue;
      const m = re(row).exec(long);
      if (m) add('end', m[0], 'it spoke of "' + one(m[0]) + '": ' + (row[4] === 'told' ? row[2] : 'you know nothing of how the night ends, or of any man\'s fate'));
    }
    return { ok: faults.length === 0, faults };
  }

  // ------------------------------------------------------------------ a restated order (design 6.2)
  // A helm order that turns her, in a man's answer, names her head too: "Hard a-starboard, her head to port". A language
  // model of today thinks of the rudder, and the order of 1912 named the tiller: said alone, "hard to starboard" or
  // "port twenty" cannot be told from its opposite (the review of stage A: the first was read as a tiller order, her head
  // to port, and under "Act on my word" given at once). The helm words and the head must agree in the convention in
  // force, or nothing is given. (Her head as the helm would send it with headway on her, as the page's own words do.)
  // (The second review: her head had to be the very last words, in one form, so "Hard a-starboard, her head to port,
  // sir.", "(her head to port)", "head to port" and "her bow to port" were each dropped, a correct order lost. The
  // forms are wider now; her head is still held to the helm words, so no opposite turn is let through by it.)
  const HEAD_RE = /[\s,;:.(-]{0,4}\b(?:and |with )?(?:(?:her|the ship's|the|ship's) )?(?:head|bows?) (?:is |goes |going |will go |to go |swings |swinging |comes |coming )?to (port|starboard)\b\)?(?:,? sir)?[\s.!)]*$/i;
  const headOf = (v) => (v < 0 ? 'port' : 'starboard');
  const turns = (o) => o.type === 'helm' && typeof o.value === 'number' && o.value !== 0;
  function readOrder(text, seat, ctx) {
    const c = BY[seat];
    if (!c) return { ok: false, why: 'no such seat' };
    if (text === null || text === undefined || !one(text)) return { ok: false, why: 'no order' };
    const helm = ctx && typeof ctx.helm === 'number' && isFinite(ctx.helm) ? ctx.helm : 0;
    let said = one(text).replace(RE_APOS, '\''), head = null;
    const hm = HEAD_RE.exec(said);
    if (hm) { head = hm[1].toLowerCase(); said = said.slice(0, hm.index).trim(); }
    let r;
    try { r = CW.parse(said, { convention: convOf(ctx), helm }); } catch (e) { return { ok: false, why: 'not an order the bridge knows' }; }
    if (!r.ok) return { ok: false, why: 'not an order the bridge knows' + (r.kind === 'unclear' ? ' (' + unstop(r.why) + ')' : '') };
    if (r.orders.length !== 1) return { ok: false, why: 'more than one order' };
    const o = r.orders[0], order = { type: o.type, value: o.value, arg: o.arg };
    if (c.remit.indexOf(o.type) < 0) return { ok: false, why: 'not his to give: ' + low(unstop(CW.phrase(order, ctx))) };
    if (turns(o)) {
      if (!head) return { ok: false, why: 'a helm order must say which way her head is to go, and "' + unstop(said) + '" did not' };
      if (head !== headOf(o.value)) return { ok: false, why: 'its helm words and her head do not agree: "' + unstop(said) + '" turns her head to ' + headOf(o.value) + (convOf(ctx) === 'modern' ? '' : ', the helm orders being tiller orders') };
    } else if (head && o.type === 'helm' && typeof o.value !== 'number') return { ok: false, why: 'her head was named for an order that turns her by where the ice is: "' + unstop(said) + '" is given alone' };
    else if (head) return { ok: false, why: 'her head was named for an order that does not turn her' };
    return { ok: true, order, words: CW.phrase(order, ctx) };
  }

  // ------------------------------------------------------------------ who is spoken to; yes and no to an offer
  function tokens(text) {
    let s = String(text === undefined || text === null ? '' : text).toLowerCase();
    s = s.replace(RE_APOS, '\'').replace(/'s\b/g, '').replace(/'/g, '');
    // "Mr. Moody, ..." names Mr Moody: the full stop after a title is not the end of anything (the review of stage A: it
    // named nobody, and the question went to whoever was spoken to last)
    s = s.replace(/\b(mr|mrs|mister|messrs|dr|capt)\./g, '$1 ');
    return s;
  }
  const wordsOf = (s) => s.split(/[^a-z]+/).filter(w => w && w !== 'mr' && w !== 'mister');
  const same = (a, W) => a.length === W.length && a.every((x, i) => W[i] === x);
  function matchAddress(W) {
    for (const c of CAST) for (const a of c.address) if (same(a, W)) return { seat: c.id };
    for (const o of OTHERS) if (same(o[0], W)) return { other: o[1], line: o[2] || 'other' };
    return null;
  }
  function startAddress(W) {
    for (let n = Math.min(4, W.length); n >= 1; n--) { const m = matchAddress(W.slice(0, n)); if (m) return m; }
    return null;
  }
  // a name or rank at the start of the line ("Mr Moody, ..."), or after its last comma ("..., Mr Murdoch"). Returns
  // { seat } for a man of the cast, { other, line } for anyone else named ('wireless': the wireless room has no line to
  // the bridge), or nothing named
  function addressee(text) {
    const s = tokens(text);
    const head = startAddress(wordsOf(s.split(/[,:;.?!]/)[0] || ''));
    const parts = s.split(','), tail = parts.length > 1 ? matchAddress(wordsOf(parts[parts.length - 1].replace(/[.?!]+\s*$/, ''))) : null;
    const hit = head || tail;
    if (!hit) return { seat: null, other: null, line: null };
    if (hit.seat) return { seat: hit.seat, other: null, line: null };
    return { seat: null, other: hit.other, line: hit.line };
  }
  // (the second review: "very well", "make it so", "carry on" each went to the model as a new question, a request spent
  // and the offer still open)
  const YES = { 'yes': 1, 'aye': 1, 'aye aye': 1, 'do so': 1, 'yes do so': 1, 'aye do so': 1, 'very well': 1, 'make it so': 1, 'carry on': 1, 'go ahead': 1, 'give it': 1, 'yes give it': 1,
    'yes please': 1, 'please do': 1, 'do it': 1, 'yes do it': 1, 'yes very well': 1 };
  const NO = { 'no': 1, 'belay that': 1, 'no belay that': 1, 'belay': 1, 'no thank you': 1, 'do not': 1, 'no do not': 1 };
  // "yes" or "no" to the order a man has offered (seat: who offered it). A name in the line, at its start or its end,
  // must be his: a word to another man, or to someone who cannot be spoken to from here, answers nothing ("Mr Moody,
  // yes" does not give Mr Murdoch's order). Nor does a question ("Yes?")
  function offerAnswer(text, seat) {
    if (/\?\s*$/.test(String(text === undefined || text === null ? '' : text))) return null;
    let W = wordsOf(tokens(text)).filter(w => w !== 'sir');
    const named = [];
    for (let n = Math.min(4, W.length); n >= 1; n--) { const m = matchAddress(W.slice(0, n)); if (m) { named.push(m); W = W.slice(n); break; } }
    for (let n = Math.min(4, W.length - 1); n >= 1; n--) { const m = matchAddress(W.slice(W.length - n)); if (m) { named.push(m); W = W.slice(0, W.length - n); break; } }
    for (const m of named) if (m.other || (seat && m.seat !== seat)) return null;
    const said = W.join(' ');
    return YES[said] ? 'yes' : (NO[said] ? 'no' : null);
  }

  // ------------------------------------------------------------------ the authored lines, and notices
  // the floor: what a man says when no good answer came (design 6.3) [authored]
  const FLOOR = 'I couldn\'t say, sir.';
  // a man's line in the talk: always a named person; a generated line is marked as imagined (design 2, rule 8)
  function lineOf(seat, words, how) {
    const c = BY[seat]; if (!c) return null;
    return { who: c.name, words: one(words), imagined: how === 'generated', floor: how === 'floor' };
  }
  // the notices: lines nobody says, outside the fiction (design 6.3, 8; a fault is never a person's line)
  function notice(kind, a, b) {
    switch (kind) {
      case 'asked': return a + ' has been asked.';
      case 'waiting': return a + ' has not answered yet: one question to a man at a time.';
      case 'two': return 'Two answers are awaited already: wait for one of them.';
      case 'limit': return 'The crew\'s minds: this run\'s limit is reached (' + a + '). No question is sent.';
      case 'off': return 'The crew\'s minds are off.';
      case 'fault': return 'No answer from ' + a + ' (' + b + '). The watch was not stopped.';
      case 'gone': return a + '\'s answer came after she had gone: it is not shown.';
      case 'left': return a + '\'s answer came after he had left the bridge: it is not shown.';
      case 'lapsed': return 'Not given: ' + a + '. The offer lapsed after a minute of her time.';
      case 'declined': return 'Not given: ' + a + '.';
      case 'withdrawn': return 'Not given: ' + a + ' (' + b + ').';
      case 'dropped': return a + '\'s order is not given: ' + b + '.';
      case 'other': return a + ' cannot be spoken to from here: only the men in the row can answer.';
      case 'wireless': return a + ' has no line to the bridge: a message goes by hand.';
      default: return String(a || '');
    }
  }

  // ------------------------------------------------------------------ the fake provider (design 9: 'fake')
  // An answer chosen by a hash of the request, from a table: the first row whose seat and words match (when: a piece of the
  // captain's words, lower case). A reply is an object (sent as JSON) or a string (sent as it is). Every reply of the
  // default table passes readTurn and check on its own; its orders are in the speaker's remit and need no convention.
  const FAKE = [
    { seat: 'murdoch', when: 'clear of it', replies: [{ say: 'Yes, sir. The helm away from the ice.', order: 'away from the ice' }] },
    { seat: 'murdoch', when: 'doors', replies: [{ say: 'Yes, sir. I will throw the switch for the watertight doors.', order: 'close the watertight doors' }] },
    { seat: 'murdoch', when: 'boats', replies: [{ say: 'Yes, sir. I will have the boats uncovered.', order: 'uncover the boats' }] },
    { seat: 'murdoch', when: 'stop', replies: [{ say: 'Yes, sir. Stop her.', order: 'stop' }] },
    { seat: 'moody', when: 'sound', replies: [{ say: 'Yes, sir. I will send for the carpenter to sound the wells.', order: 'sound the wells' }] },
    { seat: 'moody', when: 'engine room', replies: [{ say: 'Yes, sir. A note to the engine room.', order: 'ask the engine room' }] },
    { seat: 'boxhall', when: 'look', replies: [{ say: 'Yes, sir. I will go forward and look.', order: 'go forward and look' }] },
    { seat: 'boxhall', when: 'rocket', replies: [{ say: 'Yes, sir. A rocket.', order: 'fire a rocket' }] },
    { seat: 'hichens', when: 'midships', replies: [{ say: 'Midships, sir.', order: 'midships' }] },
    { seat: 'murdoch', replies: [{ say: 'I have nothing more than you have heard, sir.', order: null }, { say: 'All right, sir. I will keep a sharp look-out.', order: null }] },
    { seat: 'moody', replies: [{ say: 'Nothing more has come to the wheelhouse, sir.', order: null }, { say: 'All right, sir.', order: null }] },
    { seat: 'boxhall', replies: [{ say: 'I have nothing to add, sir.', order: null }] },
    { seat: 'hichens', replies: [{ say: 'She is answering her helm, sir.', order: null }] },
    { seat: 'andrews', replies: [{ say: 'I would want to see more of her before I say more, sir.', order: null }] },
    { seat: 'bell', replies: [{ say: 'The engine room is standing by, sir.', order: null }] },
    { replies: [{ say: FLOOR, order: null }] },
  ];
  function hash(s) {
    let h = 2166136261 >>> 0; s = String(s);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return ('0000000' + h.toString(16)).slice(-8);
  }
  function fakeReply(req, table) {
    const T = Array.isArray(table) && table.length ? table : FAKE;
    const seat = req && typeof req.seat === 'string' ? req.seat : '', ch = String(req && req.changing !== undefined ? req.changing : '');
    // a report to be given (stage C): the cue's own words stand in for the captain's, and with no row of the table for
    // them the fake gives the report back as it came, which every check passes (its figures stand in THE FACTS)
    const rep = /\n(?:YOU HAVE JUST SEEN THIS YOURSELF|YOU HAVE JUST COME TO THE CAPTAIN WITH THIS|THIS REPORT HAS JUST REACHED YOU ON THE BRIDGE(?: \([^\n)]*\))?): ([^\n]*)/.exec(ch);
    const m = rep || /THE CAPTAIN SAYS TO YOU: ([^\n]*)/.exec(ch), said = (m ? m[1] : '').toLowerCase();
    const h = parseInt(hash(String(req && req.stable !== undefined ? req.stable : '') + '\n' + ch), 16);
    for (const row of T) {
      // (a row marked report: true answers a report to be given, and only that; the others answer the captain's words)
      if (!row || !!row.report !== !!rep || (row.seat && row.seat !== seat) || (row.when && said.indexOf(String(row.when).toLowerCase()) < 0)) continue;
      const R = Array.isArray(row.replies) && row.replies.length ? row.replies : [{ say: FLOOR, order: null }];
      const r = R[h % R.length];
      return typeof r === 'string' ? r : JSON.stringify({ say: r.say, order: r.order === undefined ? null : r.order });
    }
    if (rep) return JSON.stringify({ say: unstop(one(rep[1])) + ', sir.', order: null });
    return JSON.stringify({ say: FLOOR, order: null });
  }

  // ------------------------------------------------------------------ the bridge speaks (design 14, stage C)
  // A report that reaches the bridge by a man is given to the captain in a man's own words: his own, when he saw it or
  // brought it himself; else the officer's who received it on the bridge. Who that is, for a line of the reports
  // reader's feed (view.reports.feed[i]): { seat, how }, or null for a line nobody of the cast gives (the commutator's
  // readings, the routine's bells, the touch all of them felt).
  //   how 'own'    he saw it himself (the officer of the watch, by eye)
  //       'back'   he has come to the captain with it (Mr Boxhall back from a look; Mr Andrews with his estimate)
  //       'relay'  a man who is not of the cast brought it, or the telephone did: the officer who received it
  // The receiving officer is the officer of the watch while he is on the bridge, then the junior officer, then the
  // fourth [bet: the record does not say who took each report].
  const RELAY_ORDER = ['murdoch', 'moody', 'boxhall'];
  function speaker(x, e, sent) {
    const v = viewOf(x);
    if (!v.ok || !e || e.kind !== 'report') return null;
    const R = reach(v, sent), there = (s) => !!(R[s] && R[s].in);
    if (e.ch === 'instrument') return e.rule === 'eye' && there('murdoch') ? { seat: 'murdoch', how: 'own' } : null;
    if (e.ch === 'voice') return e.who === 'The builder\'s man' && there('andrews') ? { seat: 'andrews', how: 'back' } : null;
    if (e.ch === 'runner' && e.who === 'The Fourth Officer') return there('boxhall') ? { seat: 'boxhall', how: 'back' } : null;
    if (e.ch === 'runner' || e.ch === 'phone') { const seat = RELAY_ORDER.find(there); return seat ? { seat, how: 'relay' } : null; }
    return null;
  }
  // the last paragraph of such a request. The stable part is a question's own (it is the man's, and the provider may
  // have it cached); only this cue differs from "THE CAPTAIN SAYS TO YOU"
  const CUES = { own: 'YOU HAVE JUST SEEN THIS YOURSELF', back: 'YOU HAVE JUST COME TO THE CAPTAIN WITH THIS', relay: 'THIS REPORT HAS JUST REACHED YOU ON THE BRIDGE' };
  function reportCue(e, how) {
    const from = how === 'relay' ? ' (' + source(e) + ')' : '';
    return (CUES[how] || CUES.relay) + from + ': ' + one(e.words)
      + '\nGive it to the captain now in your own words, in one or two sentences. Add nothing that is not in it or in THE FACTS. "order" is null.';
  }
  function requestReport(seat, x, talk, e, how, ctx) {
    const v = viewOf(x);
    return { seat: String(seat), stable: stable(seat, ctx), changing: facts(v, seat, ctx) + '\n\n' + talkText(talk) + '\n\n' + reportCue(e, how) };
  }

  // nothing here changes once built: every table frozen, so that no call can leave a trace for the next
  for (const t of [CAST, BY, SEATS, OTHERS, BRIDGE_FACTS, LOOK_TO, KEEP, WORLD, END, SHIPS, KNOWN_SHIPS, ABOARD, NOT_ABOARD, UNITS, TENS, HOURS, NONE, YES, NO, FAKE]) freeze(t);
  return freeze({
    TABLES, CAST, BY, SEATS, WHITELIST, FORBIDDEN, WORLD_KINDS, SCHEMA, FLOOR, WORLD, END, SHIPS, KNOWN_SHIPS, ABOARD, NOT_ABOARD, FAKE, KEEP, ANDREWS_STAY, SAY_MAX, ORDER_MAX, WENT,
    gather, reach, errandOf, facts, stable, request, retry, readTurn, check, readOrder, addressee, offerAnswer, lineOf, notice, fakeReply, hash, clockText,
    remitWords, orderWords, wordNumbers, spokenTimes, speaker, reportCue, requestReport, RELAY_ORDER,
  });
});
