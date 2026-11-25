// The bridge's words (site/parts/85_crew_words.js), step 1 of the spoken bridge, headless, in seconds.
//   node tools/crew_tests.js
// docs/DESIGN_spoken_bridge_v1_2026-11-23.md, section 6, the first list. Every row is a MUST:
//   1. the table: every row of the design's section 4, and many more spellings, each to its exact orders
//   2. not orders: questions, half sentences, a helm with no side, forty-five degrees, nonsense; each with its kind
//   3. the model accepts what the grammar gives: its names are the model's; every order it can give passes the page's own
//      check of an address (so the link of a typed night replays) and, given through Night.act on the 1912 watch after the
//      ice, is carried out or refused with a reason; none throws; the watch replays from its log to the same fingerprint
//   4. the round trip: parse(phrase(o)) is o for every order of 3, in both conventions
//   5. the night's own orders have words (the 1912 watch's log, drawn nights', every order the page's own controls give),
//      and every line is said by someone on the bridge
//   6. the library is pure: two calls, the same answer; nothing on the global object but its name; no DOM, no clock
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const C = require('../core/core.js');
const Mo = require('../core/motion.js');
const Sys = require('../core/systems.js');
const N = require('../core/night.js');
const People = require('../core/readers/people.js');
const World = require('../core/readers/world.js');
const Reports = require('../core/readers/reports.js');
const W = require('../site/parts/85_crew_words.js');
const root = path.join(__dirname, '..');
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push(ok); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(92) + ' ' + String(value).padEnd(48) + ' ' + ref); }
const show = (o) => o.type + ':' + o.value + (o.arg !== undefined ? ':' + o.arg : '');
const showAll = (r) => (r.ok ? r.orders.map(show).join(' | ') : r.kind + ' (' + r.why + ')');
const sameOrder = (a, b) => a.type === b.type && a.value === b.value && a.arg === b.arg;
const clip = (s, n) => (s.length > n ? s.slice(0, n - 3) + '...' : s);
const list = (bad, n) => bad.slice(0, n || 3).join('; ') + (bad.length > (n || 3) ? '; and ' + (bad.length - (n || 3)) + ' more' : '');
const BRIDGE = ['The quartermaster', 'The officer of the watch', 'The officer at the telegraph', 'The junior officer', 'The fourth officer'];

// the model's own indices, by the model's own names
const bh = (id) => C.BULKHEADS.findIndex(b => b.id === id);
const zone = (name) => C.ZONES.findIndex(z => z.name === name);
const broom = (name) => Sys.PLANT.rooms.findIndex(r => r.name === name);
const H = (v) => 'helm:' + v, T = (n, a) => 'telegraph:' + n + (a ? ':' + a : '');

// ------------------------------------------------------------------ 1. the table
// [text, the orders, the helm now ordered (for "ease")]
const HELM_1912 = [
  ['hard a-starboard', H(-40)], ['hard a starboard', H(-40)], ['hard astarboard', H(-40)], ['hard a-port', H(40)], ['hard aport', H(40)],
  ['starboard ten', H(-10)], ['starboard 10', H(-10)], ['ten degrees starboard', H(-10)], ['starboard your helm ten', H(-10)], ['port twenty', H(20)],
  ['hard to starboard', H(-40)], ['hard over to port', H(40)], ['midships', H(0)], ['amidships', H(0)], ['helm amidships', H(0)],
  ['steady', H(0)], ['steady as she goes', H(0)], ['ease to ten', H(-10), -40], ['ease her to five', H(5), 20],
  ['shift your helm', H('reverse')], ['reverse the helm', H('reverse')], ['away from the ice', H('away')], ['clear the ice', H('away')],
];
const HELM_MODERN = [
  ['hard a-starboard', H(40)], ['hard a starboard', H(40)], ['hard astarboard', H(40)], ['hard a-port', H(-40)], ['hard aport', H(-40)],
  ['starboard ten', H(10)], ['starboard 10', H(10)], ['ten degrees starboard', H(10)], ['starboard your helm ten', H(10)], ['port twenty', H(-20)],
  ['hard to starboard', H(40)], ['hard over to port', H(-40)], ['midships', H(0)], ['amidships', H(0)], ['helm amidships', H(0)],
  ['steady', H(0)], ['steady as she goes', H(0)], ['ease to ten', H(10), 40], ['ease her to five', H(-5), -20],
  ['shift your helm', H('reverse')], ['reverse the helm', H('reverse')], ['away from the ice', H('away')], ['clear the ice', H('away')],
];
const ENGINES = [
  ['full ahead', T('full ahead')], ['full speed ahead', T('full ahead')], ['full ahead both', T('full ahead')], ['both engines full ahead', T('full ahead')],
  ['half ahead', T('half ahead')], ['half speed ahead', T('half ahead')], ['slow ahead', T('slow ahead')], ['dead slow ahead', T('dead slow ahead')],
  ['stop', T('stop')], ['stop engines', T('stop')], ['stop her', T('stop')], ['all stop', T('stop')], ['stop both', T('stop')],
  ['full astern', T('full astern')], ['full speed astern', T('full astern')], ['back her full', T('full astern')], ['half astern', T('half astern')],
  ['slow astern', T('slow astern')], ['dead slow astern', T('dead slow astern')], ['port engine full astern', T('full astern', 'port')],
  ['full astern port', T('full astern', 'port')], ['starboard engine stop', T('stop', 'starboard')], ['seventy revolutions', T(70)], ['make seventy turns', T(70)],
];
const DOORS_FIRES_PUMPS = [
  ['close the watertight doors', 'doors:bridge'], ['shut the doors', 'doors:bridge'], ['close the doors', 'doors:bridge'],
  ['open the door in bulkhead E', 'door:' + bh('E') + ':true'], ['close the door in bulkhead K', 'door:' + bh('K') + ':false'],
  ['draw the fires in boiler room six', 'fires:' + broom('Boiler room 6')], ['draw fires in number five', 'fires:' + broom('Boiler room 5')],
  ['draw all fires', 'fires:-1'], ['draw the fires', 'fires:-1'],
  ['start the pumps in boiler room five', 'pump:' + zone('Boiler room 5') + ':own'], ['pumps on boiler room 6', 'pump:' + zone('Boiler room 6') + ':own'],
  ['all pumps on boiler room five', 'pump:' + zone('Boiler room 5') + ':all'], ['put every pump on number 5', 'pump:' + zone('Boiler room 5') + ':all'],
  ['stop the pumps in boiler room five', 'pump:' + zone('Boiler room 5') + ':off'], ['leave the pumps to the engineers', 'pump:-1:engineers'],
];
const BOATS_CALLS_ERRANDS = [
  ['uncover the boats', 'boats:uncover:now'], ['clear away the boats', 'boats:uncover:now'], ['swing out the boats', 'boats:uncover:now'],
  ['women and children first', 'boats:rule:first:both'], ['women and children first on the port side', 'boats:rule:first:port'],
  ['women and children first on the starboard side', 'boats:rule:first:starboard'], ['women and children only', 'boats:rule:only:both'],
  ['women and children only on the port side', 'boats:rule:only:port'], ['fill the boats with anyone', 'boats:rule:fill:both'], ['anyone who will go', 'boats:rule:fill:both'],
  ['lower them full', 'boats:fill:1'], ['fill every boat', 'boats:fill:1'], ['three quarters full', 'boats:fill:0.75'], ['half full', 'boats:fill:0.5'],
  ['lower them as they are', 'boats:fill:0.3'], ['send the call for assistance', 'help:call:cqd'], ['send a distress call', 'help:call:cqd'],
  ['call for help', 'help:call:cqd'], ['send CQD', 'help:call:cqd'], ['send SOS', 'help:call:cqd'], ['fire a rocket', 'help:rocket:socket'],
  ['send up a rocket', 'help:rocket:socket'], ['fire the distress signals', 'help:rocket:socket'], ['try the Morse lamp', 'help:lamp:cqd'],
  ['call her up with the lamp', 'help:lamp:cqd'], ['go forward and look', 'report:look:forward'], ['send someone forward', 'report:look:forward'],
  ['Mr Boxhall, inspect forward', 'report:look:forward'], ['look at the mail room', 'report:look:mailroom'], ['look at the boiler rooms', 'report:look:boilers'],
  ['look at the engine rooms', 'report:look:engines'], ['look aft', 'report:look:aft'], ['sound the ship', 'report:sound:wells'], ['sound the wells', 'report:sound:wells'],
  ['send the carpenter to sound her', 'report:sound:wells'], ['ask the engine room', 'report:ask:engine room'], ['ring the engine room', 'report:ask:engine room'],
  ['what does the engine room say', 'report:ask:engine room'],
];
// more spellings: case, punctuation, fillers, names and ranks, numbers in words, the model's own words
const RSQ = String.fromCharCode(0x2019);   // a typographic apostrophe, as a phone types it
const MORE = [
  ['HARD A-STARBOARD!', H(-40)], ['Hard a-starboard, sir!', H(-40)], ['hard-a-starboard', H(-40)], ['Hard a' + RSQ + 'starboard', H(-40)],
  ['Mr. Murdoch: hard a-port.', H(40)], ['Mr Murdoch, hard a-starboard', H(-40)], ['Quartermaster, starboard one five', H(-15)],
  ['starboard fifteen degrees', H(-15)], ['Port 5', H(5)], ['port your helm thirty', H(30)], ['helm hard a starboard', H(-40)],
  ['put the helm hard a-port', H(40)], ['hard starboard', H(-40)], ['Midships, please.', H(0)], ['a-midships', H(0)], ['steady so', H(0)],
  ['ease the helm to midships', H(0), 20], ['ease to twenty', H(-20), -40], ['shift the helm', H('reverse')], ['helm away from the berg', H('away')],
  ['steer clear of the iceberg', H('away')], ['starboard thirty-five', H(-35)], ['Starboard 10 degrees', H(-10)], ['starboard 10deg', H(-10)], ['helm port 25', H(25)],
  ['hard a-starboard sir', H(-40)], ['Quartermaster: midships', H(0)], ['starboard', H(-15)], ['port', H(15)],
  ['full ahead both engines', T('full ahead')], ['Engines full astern', T('full astern')], ['ring down full astern', T('full astern')],
  ['go half astern', T('half astern')], ['Stop her!', T('stop')], ['stop all engines', T('stop')], ['stop the port engine', T('stop', 'port')],
  ['port engine stop', T('stop', 'port')], ['starboard engine half astern', T('half astern', 'starboard')], ['slow ahead starboard engine', T('slow ahead', 'starboard')],
  ['please, all stop', T('stop')], ['Make it eighty revolutions', T(80)], ['seventy five revolutions astern', T(-75)], ['port engine sixty revolutions', T(60, 'port')],
  ['twenty revs', T(20)], ['70 rpm', T(70)], ['Close all watertight doors.', 'doors:bridge'], ['close the watertight doors from the bridge', 'doors:bridge'],
  ['throw the switch', 'doors:bridge'], ['Close the doors at once!', 'doors:bridge'], ['shut the doors in bulkhead D', 'door:' + bh('D') + ':false'],
  ['raise the doors in bulkhead F', 'door:' + bh('F') + ':true'], ['open bulkhead K door', 'door:' + bh('K') + ':true'],
  ['draw the fires in No. 5 boiler room', 'fires:' + broom('Boiler room 5')], ['draw boiler room 4 fires', 'fires:' + broom('Boiler room 4')], ['draw every fire', 'fires:-1'],
  ['pump out boiler room four', 'pump:' + zone('Boiler room 4') + ':own'], ['start the pumps in number one hold', 'pump:' + zone('No. 1 hold') + ':own'],
  ['pumps on the forepeak', 'pump:' + zone('Forepeak') + ':own'], ['all pumps on the reciprocating engine room', 'pump:' + zone('Reciprocating engine room') + ':all'],
  ['every pump that can reach boiler room 4', 'pump:' + zone('Boiler room 4') + ':all'], ['take the pumps off boiler room 6', 'pump:' + zone('Boiler room 6') + ':off'],
  ['hand the pumps back to the engineers', 'pump:-1:engineers'], ['Uncover the lifeboats!', 'boats:uncover:now'], ['get the boats out', 'boats:uncover:now'],
  ['Women and children first, starboard side', 'boats:rule:first:starboard'], ['port side, women and children only', 'boats:rule:only:port'],
  ['women and children first on both sides', 'boats:rule:first:both'], ['let the men in', 'boats:rule:fill:both'], ['anyone who will go on the port side', 'boats:rule:fill:port'],
  ['lower them three quarters full', 'boats:fill:0.75'], ['lower them half full', 'boats:fill:0.5'], ['lower the boats as they are', 'boats:fill:0.3'],
  ['send the distress call', 'help:call:cqd'], ['Mr Phillips, send CQD at once', 'help:call:cqd'], ['send out a distress call', 'help:call:cqd'], ['send C.Q.D.', 'help:call:cqd'],
  ['fire another rocket', 'help:rocket:socket'], ['set off a distress rocket', 'help:rocket:socket'], ['signal her with the Morse lamp', 'help:lamp:cqd'],
  ['Mr Boxhall, go to the mail room and look', 'report:look:mailroom'], ['go down to the boiler rooms', 'report:look:boilers'], ['have a look at the engine rooms', 'report:look:engines'],
  ['go aft and look', 'report:look:aft'], ['take soundings', 'report:sound:wells'], ['send for the carpenter', 'report:sound:wells'],
  ['have the carpenter sound the wells', 'report:sound:wells'], ['ask the chief engineer', 'report:ask:engine room'], ['send a note to the chief engineer', 'report:ask:engine room'],
  ['what does the chief say?', 'report:ask:engine room'],
];
// sentences of two and three orders, in the order spoken
const SEVERAL = [
  ['Hard a-starboard and full astern', H(-40) + ' | ' + T('full astern')], ['Hard a-starboard; stop engines', H(-40) + ' | ' + T('stop')],
  ['stop her, then full astern', T('stop') + ' | ' + T('full astern')], ['full astern and hard a-port', T('full astern') + ' | ' + H(40)],
  ['hard a-starboard full astern', H(-40) + ' | ' + T('full astern')],
  ['Hard a-starboard, full astern and close the watertight doors.', H(-40) + ' | ' + T('full astern') + ' | doors:bridge'],
  ['Stop. Full astern. Hard a-port.', T('stop') + ' | ' + T('full astern') + ' | ' + H(40)],
  ['uncover the boats, women and children first and send the call for assistance', 'boats:uncover:now | boats:rule:first:both | help:call:cqd'],
  ['Mr Murdoch, stop the engines and close the doors, then send someone forward', T('stop') + ' | doors:bridge | report:look:forward'],
  ['starboard engine full ahead port engine full astern', T('full ahead', 'starboard') + ' | ' + T('full astern', 'port')],
];
const MORE_MODERN = [
  ['Hard to starboard and full astern', H(40) + ' | ' + T('full astern')], ['port ten', H(-10)], ['ease her to fifteen', H(15), 40], ['hard over to starboard', H(40)],
];
// Sentences that gave a WRONG order before the independent review of 2026-11-23, and their neighbours: each to its right
// orders, or to none ("none: unclear": understood as an order with something missing or wrong, and asked about;
// "none: unknown": not understood)
const GUARD = [
  // a side and nothing more is the helm's word only as the whole line
  ['port', H(15)], ['Port.', H(15)], ['port, Mr Hichens', H(15)], ['Quartermaster, starboard', H(-15)], ['starboard, sir', H(-15)],
  ['port and starboard engines full astern', T('full astern')], ['women and children first, port and starboard', 'boats:rule:first:both'],
  ['both engines full astern, port and starboard', 'none: unclear'], ['uncover the boats, starboard', 'none: unclear'], ['close the doors, port', 'none: unclear'],
  ['full ahead, port', 'none: unclear'], ['port and starboard', 'none: unclear'],
  // an engine named before its order needs the word "engine"; after its order the side will do
  ['starboard full astern', 'none: unclear'], ['port stop', 'none: unclear'], ['port 20 turns', 'none: unclear'], ['full astern port', T('full astern', 'port')],
  ['stop the port engine', T('stop', 'port')],
  // the rudder, the wheel, and where her head is to go are not helm orders
  ['put the rudder hard to port', 'none: unclear'], ['rudder hard over to starboard', 'none: unclear'], ['turn her hard to port', 'none: unclear'],
  ['10 degrees port rudder', 'none: unclear'], ['starboard wheel', 'none: unclear'], ['ten degrees to port', 'none: unclear'], ['turn to starboard', 'none: unclear'],
  ['come to port', 'none: unclear'], ['put her hard to port', 'none: unclear'], ['put her hard a-port', H(40)], ['ten degrees of port helm', H(10)],
  // a direction said first stays with its revolutions
  ['full astern seventy revolutions', T(-70)], ['half astern, make it fifty revolutions', T(-50)], ['astern fifty revolutions', T(-50)],
  ['seventy revolutions ahead', T(70)], ['full astern. seventy revolutions', 'none: unclear'], ['stop. seventy revolutions', T('stop') + ' | ' + T(70)],
  // "ease" eases the helm as the line leaves it, and only eases
  ['hard a-port and ease to ten', H(40) + ' | ' + H(10), -40], ['shift the helm and ease to ten', H('reverse') + ' | ' + H(10), -40],
  ['ease to 30', 'none: unclear', -20], ['ease to 20', H(-20), -20], ['away from the ice and ease to ten', 'none: unclear', -40],
  // "number two" in a pump order: she has a No. 2 hold and a boiler room 2
  ['start the pumps in number two', 'none: unclear'], ['all pumps on number one', 'none: unclear'], ['pumps on number six', 'pump:' + zone('Boiler room 6') + ':own'],
  // too loose before: not the call for assistance, not a rule for the boats, not how full to lower them
  ['send a message', 'none: unknown'], ['make a signal', 'none: unknown'], ['put men', 'none: unknown'], ['lower away', 'none: unclear'], ['send the call', 'help:call:cqd'],
];
const given = [];                                  // every order the table's rows gave (3 holds them to the domain)
function table(name, cases, conv, ref) {
  const bad = [];
  for (const [text, want, helm] of cases) {
    const r = W.parse(text, { convention: conv, helm: helm === undefined ? 0 : helm });
    const got = r.ok ? r.orders.map(show).join(' | ') : 'none: ' + r.kind;
    if (got !== want) bad.push('"' + text + '" gave ' + got + ', not ' + want);
    if (r.ok) for (const o of r.orders) given.push(o);
  }
  row(name, bad.length ? clip(list(bad, 2), 160) : cases.length + ' of ' + cases.length, ref, bad.length === 0);
  return cases.length;
}
console.log('1. the table (section 4 of the design), each sentence to its exact orders');
table('4.2 the helm, the 1912 convention (the default): every row', HELM_1912, '1912', '"hard a-starboard" helm -40, her head to port');
table('4.2 the helm, the modern convention: every row', HELM_MODERN, 'modern', '"hard a-starboard" helm +40');
table('4.3 the engines: every row (the model\'s names, an engine by its side, revolutions)', ENGINES, '1912', 'core/motion.js TELEGRAPH');
table('4.4 the doors, the fires, the pumps: every row', DOORS_FIRES_PUMPS, '1912', 'the model\'s bulkheads, boiler rooms and zones');
table('4.5 the boats, the calls, the errands: every row', BOATS_CALLS_ERRANDS, '1912', 'the readers\' orders');
const nMore = table('more spellings: case, punctuation, fillers, names, numbers in words, the model\'s own words', MORE, '1912', 'at least sixty');
const nSev = table('sentences of two and three orders, in the order spoken', SEVERAL, '1912', 'split on and, then, a stop, a semicolon, a comma');
const nMod = table('more in the modern convention', MORE_MODERN, 'modern', 'the rudder\'s side');
table('no wrong order: a stray side, the rudder or her head\'s way, a direction before revolutions, "ease", "number two"', GUARD, '1912', 'the review\'s sentences: the right orders, or none');
row('  more spellings than the design\'s rows', (nMore + nSev + nMod) + ' sentences', 'at least sixty', nMore + nSev + nMod >= 60);
{
  const r = W.parse('Mr Murdoch, hard a-starboard and full astern, please', {});
  row('  what was heard: lower case, no punctuation, fillers gone; each order with its own words', '"' + r.heard + '"; ' + r.orders.map(o => '"' + o.said + '"').join(', '),
    '"murdoch hard a starboard and full astern"; "hard a starboard", "full astern"', r.heard === 'murdoch hard a starboard and full astern' && r.orders[0].said === 'hard a starboard' && r.orders[1].said === 'full astern');
  const n = W.parse('one five starboard, twenty five port', {}).heard;
  row('  spoken numbers as digits ("one five" is 15, "twenty five" 25)', '"' + n + '"', '"15 starboard 25 port"', n === '15 starboard 25 port');
}

// ------------------------------------------------------------------ 2. not orders
console.log('\n2. not orders: nothing is ordered, and the bridge says why');
const NOT = [
  ['how long has she got', 'question'], ['Where is the water?', 'question'], ['has anyone answered', 'question'], ['Is she sinking?', 'question'],
  ['can you stop the engines', 'question'], ['Full astern?', 'question'], ['what is our speed', 'question'], ['Mr Murdoch, are we clear?', 'question'],
  ['hard over', 'unclear'], ['hard over and full astern', 'unclear'], ['starboard forty five', 'unclear'], ['forty five degrees to port', 'unclear'],
  ['ease her', 'unclear'], ['ease to ten', 'unclear'], ['open the doors', 'unclear'], ['open the door in bulkhead B', 'unclear'],
  ['draw the fires in boiler room seven', 'unclear'], ['pumps on number four hold', 'unclear'], ['ninety revolutions', 'unclear'], ['full', 'unclear'],
  ['stop the', 'unclear'], ['full astern and', 'unclear'], ['Mr Murdoch', 'unclear'], ['starboard 10.5', 'unclear'],
  ['the quick brown fox', 'unknown'], ['hard a-starboard and fly to the moon', 'unknown'], ['make tea', 'unknown'], ['', 'unknown'],
];
{
  const bad = [], kinds = {};
  for (const [text, kind] of NOT) {
    const r = W.parse(text, { convention: '1912', helm: 0 });
    kinds[kind] = (kinds[kind] || 0) + 1;
    if (r.ok || r.orders || r.kind !== kind || !r.why || BRIDGE.indexOf(r.who) < 0 || typeof r.heard !== 'string') bad.push('"' + text + '": ' + showAll(r) + (r.ok ? '' : ', ' + r.who));
  }
  row('each orders nothing, with its kind, and the reason said by someone on the bridge', bad.length ? clip(list(bad, 2), 160) : NOT.length + ' sentences: ' + Object.entries(kinds).map(e => e[1] + ' ' + e[0]).join(', '), 'at least twenty', bad.length === 0 && NOT.length >= 20);
  const said = (t, h) => W.parse(t, { helm: h || 0 }).why;
  row('  the reasons: "hard over", forty-five degrees, ease when amidships, a bulkhead with no door', [said('hard over'), said('starboard 45'), said('ease to ten'), said('open the door in bulkhead A')].join(' / '),
    'Which way, sir? / forty degrees of helm / the helm is amidships / no watertight door', said('hard over') === 'Which way, sir?' && /forty degrees of helm/.test(said('starboard 45')) && /amidships/.test(said('ease to ten')) && /has no watertight door/.test(said('open the door in bulkhead A')));
  const q = (t, c) => W.parse(t, { convention: c, helm: 0 }).why;
  row('  where her head is to go is answered with the helm order for it, in the convention in force; nothing is ordered', [q('turn her hard to port', '1912'), q('ten degrees to port', 'modern')].join(' / '),
    '"Hard a-starboard", "Starboard ten" (1912); "Port ten" (modern)', /"Hard a-starboard"\.$/.test(q('turn her hard to port', '1912')) && /"Starboard ten"\.$/.test(q('ten degrees to port', '1912')) && /"Port ten"\.$/.test(q('ten degrees to port', 'modern')));
  row('  a stray side, revolutions after an astern order, and "number two" are asked about', [said('close the doors, port'), said('full astern. seventy revolutions'), said('start the pumps in number two')].join(' / '),
    'Port what, sir? / ahead or astern / hold or boiler room', said('close the doors, port') === 'Port what, sir?' && /ahead or astern, sir\?$/.test(said('full astern. seventy revolutions')) && /hold or boiler room two, sir\?$/.test(said('start the pumps in number two')));
  const u = W.parse('hard a-starboard and fly to the moon', {});
  row('  a sentence half understood names the words not understood, and orders nothing', u.why, 'Beg pardon, sir: "fly to the moon"?', u.why === 'Beg pardon, sir: "fly to the moon"?');
}
{
  const odd = [null, undefined, 42, {}, [], 'x'.repeat(2000), 'and and and', '?', '...', 'full astern and '.repeat(40), String.fromCharCode(0x41f, 0x43e, 0x43b, 0x43d, 0x44b, 0x439)];
  let threw = 0, shape = 0;
  for (const t of odd) { try { const r = W.parse(t, { convention: 'modern' }); if (typeof r.ok !== 'boolean' || typeof r.heard !== 'string') shape++; } catch (e) { threw++; } }
  row('  it never throws, whatever it is given (null, numbers, objects, long text, other scripts)', threw + ' threw, ' + shape + ' wrong shapes of ' + odd.length, 'none', threw === 0 && shape === 0);
}

// ------------------------------------------------------------------ 3. the model accepts what the grammar gives
console.log('\n3. the model accepts what the grammar gives');
const TB = W.TABLES, D = W.domain();
{
  const tel = Object.keys(Mo.TELEGRAPH);
  row('its telegraph names are the model\'s (core/motion.js TELEGRAPH), and its helm\'s stops', TB.TELEGRAPH.length + ' names; ' + TB.HELM_MAX + ' degrees', tel.length + ' names; SHIP.rudder.max ' + Mo.SHIP.rudder.max,
    JSON.stringify(TB.TELEGRAPH) === JSON.stringify(tel) && TB.HELM_MAX === Mo.SHIP.rudder.max);
  // (helm1912 keeps the angle in radians: back in degrees, to a nanodegree)
  const h1912 = Object.keys(TB.HELM_1912).map(k => { const m = {}; Mo.helm1912(m, k); return [k, Math.round(m.delCmd / Mo.DEG * 1e9) / 1e9]; });
  const said = h1912.map(([k]) => W.parse(k, { convention: '1912' })).map(r => (r.ok ? r.orders[0].value : null));
  row('  the 1912 convention is the model\'s own table (core/motion.js helm1912) and the night\'s recorded order', h1912.map(([k, v], i) => k + ' ' + said[i]).join(', '),
    'helm1912: ' + h1912.map(([k, v]) => v).join(', ') + '; Night.spec(1912).orders.turn ' + N.spec(1912).orders.turn,
    h1912.every(([k, v], i) => TB.HELM_1912[k] === v && said[i] === v) && W.parse('hard a-starboard', {}).orders[0].value === N.spec(1912).orders.turn);
  const bhOk = TB.BULKHEADS.length === C.BULKHEADS.length && TB.BULKHEADS.every((b, i) => b[0] === C.BULKHEADS[i].id && b[1] === (C.BULKHEADS[i].doors.length > 0 ? 1 : 0));
  row('  its bulkheads are the model\'s (core/core.js BULKHEADS): the letters, and which have doors', TB.BULKHEADS.map(b => b[0] + (b[1] ? '' : '-')).join(' '), C.BULKHEADS.map(b => b.id + (b.doors.length ? '' : '-')).join(' ') + ' (- no door)', bhOk);
  const zOk = JSON.stringify(TB.ZONES) === JSON.stringify(C.ZONES.map(z => z.name));
  const rOk = JSON.stringify(TB.BOILER_ROOMS) === JSON.stringify(Sys.PLANT.rooms.map(r => r.name)) && TB.BOILER_ROOMS.every((n, j) => C.ZONES[Sys.PLANT.rooms[j].zone].name === n);
  const pOk = JSON.stringify(TB.PUMPS) === JSON.stringify(Sys.PLANT.pumps.map(p => p.name));
  row('  its rooms are the model\'s: the zones (pumps), the boiler rooms (fires), the pumps by number', TB.ZONES.length + ' zones, ' + TB.BOILER_ROOMS.length + ' boiler rooms, ' + TB.PUMPS.length + ' pumps',
    'core/core.js ZONES; core/systems.js PLANT.rooms, PLANT.pumps', zOk && rOk && pOk);
  const bOk = JSON.stringify(TB.BOAT_RULES) === JSON.stringify(People.RULES) && JSON.stringify(TB.BOAT_FILLS) === JSON.stringify(People.FILLS) && TB.BOAT_SIDES.every(s => People.valid('boats:rule', 'first', s));
  const lOk = JSON.stringify(TB.LOOK) === JSON.stringify(Object.keys(Reports.PARTS));
  const hOk = World.valid('help:call', 'cqd') && World.valid('help:rocket', 'socket') && World.valid('help:lamp', 'cqd');
  row('  the readers\' orders: the boats\' rules, fills and sides, the parts an officer is sent to, the calls', TB.BOAT_RULES.join('/') + '; ' + TB.BOAT_FILLS.join('/') + '; ' + TB.BOAT_SIDES.join('/') + '; ' + TB.LOOK.join('/'),
    'core/readers/people.js, reports.js, world.js', bOk && lOk && hOk);
}
// the page's own check of an address (site/parts/40_night_end.js validOrder), read from the page's file and run here: an
// order it would refuse could not be replayed from the link of a typed night
let validOrder = null, rpmBound = null;
{
  const src = fs.readFileSync(path.join(root, 'site', 'parts', '40_night_end.js'), 'utf8');
  const m = /function validOrder\(o\) \{[\s\S]*?\n {2}\}\r?\n/.exec(src);
  if (m) {
    validOrder = new Function('C', 'Mo', 'NT', 'ROOMS', m[0] + '\nreturn validOrder;')(C, Mo, N, Sys.PLANT.rooms.length);
    const t = /type === 'telegraph'\) return \(\(typeof v === 'number' && isFinite\(v\) && Math\.abs\(v\) <= (\d+)\)/.exec(m[0]); rpmBound = t ? +t[1] : null;
  }
  const bad = validOrder ? D.filter(o => validOrder([0, o.type, o.value, o.arg]) !== true).map(show) : ['validOrder not found in site/parts/40_night_end.js'];
  row('every order it can give passes the page\'s own check of an address (so a typed night\'s link replays)', bad.length ? clip(list(bad), 120) : D.length + ' orders, all pass', 'site/parts/40_night_end.js validOrder', bad.length === 0);
  row('  its most revolutions is the address\'s bound, at least what her engines turn at full pressure', 'RPM_MAX ' + TB.RPM_MAX, 'validOrder ' + rpmBound + '; core/systems.js PLANT.nMax ' + Sys.PLANT.nMax, TB.RPM_MAX === rpmBound && TB.RPM_MAX >= Sys.PLANT.nMax);
}
{
  const inDomain = (o) => D.some(d => sameOrder(d, o));
  const out = given.filter(o => !inDomain(o)).map(show);
  row('  every order the table gave is one of them', out.length ? clip(list(out), 120) : given.length + ' orders given, all in the domain of ' + D.length, 'domain()', out.length === 0);
}
const ship = C.buildShip(), spec = N.spec(1912);
{
  // the 1912 watch, on its own orders, three minutes after the touch
  const sim = N.create(ship, spec, { auto: true });
  while (sim.night.tTouch < 0 || sim.t < sim.night.tTouch + 180) N.step(sim);
  const kAt = sim.night.k, threw = [], refused = [], silent = [];
  let carried = 0;
  for (const o of D) {
    let done;
    try { done = N.act(sim, o.type, o.value, o.arg); } catch (e) { threw.push(show(o) + ': ' + e.message); continue; }
    const no = done === false || (done && typeof done === 'object' && done.ok === false);
    if (!no) { carried++; continue; }
    refused.push(show(o));
    const rb = W.readback(o, done, { convention: '1912' });
    if (!rb.refused || !rb.words || BRIDGE.indexOf(rb.who) < 0) silent.push(show(o));
  }
  const pumpNo = sim.night.log.filter(e => e.type === 'pump' && e.refused).length;
  row('given through Night.act on the 1912 watch three minutes after the touch: carried out or refused, none throws', threw.length ? clip(list(threw), 120) : carried + ' carried out, ' + refused.length + ' refused (' + pumpNo + ' pump orders with the model\'s reason in the log)',
    'none throws; each refusal answered with a reason, on the bridge', threw.length === 0 && silent.length === 0 && carried > 0);
  let stepThrew = null;
  try { for (let i = 0; i < 40; i++) N.step(sim); } catch (e) { stepThrew = e.message; }
  const log = sim.night.log.map(e => ({ k: e.k, type: e.type, value: e.value, arg: e.arg }));
  const again = N.replay(ship, spec, log, sim.night.k);
  row('  the watch steps on after them, and replays from its log to the same fingerprint', stepThrew ? 'the step threw: ' + stepThrew : N.fingerprint(sim) + ' at step ' + sim.night.k + ' (' + log.length + ' orders, ' + (log.length - 4) + ' given at step ' + kAt + ')',
    'replayed: ' + N.fingerprint(again) + ' at step ' + again.night.k, !stepThrew && N.fingerprint(sim) === N.fingerprint(again) && sim.night.k === again.night.k);
}

// ------------------------------------------------------------------ 4. the round trip
console.log('\n4. the round trip: parse(phrase(o)) is o');
for (const conv of ['1912', 'modern']) {
  const bad = [];
  for (const o of D) {
    const p = W.phrase(o, { convention: conv }), r = W.parse(p, { convention: conv, helm: 0 });
    if (!(r.ok && r.orders.length === 1 && sameOrder(r.orders[0], o))) bad.push(show(o) + ' -> "' + p + '" -> ' + showAll(r));
  }
  row('every order of 3, in the ' + conv + ' convention', bad.length ? clip(list(bad, 2), 160) : D.length + ' of ' + D.length, 'the same type, value and arg', bad.length === 0);
}
{
  const p = [-40, 40, -10, 0].map(v => W.phrase({ type: 'helm', value: v }, { convention: '1912' })), q = [-40, 40, -10].map(v => W.phrase({ type: 'helm', value: v }, { convention: 'modern' }));
  row('  the helm in words: the tiller\'s side in 1912, the rudder\'s in the modern convention', p.join(', ') + ' / ' + q.join(', '), 'Hard a-starboard, Hard a-port, Starboard ten, Midships / Hard to port, Hard to starboard, Port ten',
    p.join() === 'Hard a-starboard,Hard a-port,Starboard ten,Midships' && q.join() === 'Hard to port,Hard to starboard,Port ten');
}

// ------------------------------------------------------------------ 5. the night's own orders have words
console.log('\n5. the night\'s own orders have words, and every line is said on the bridge');
const generic = (s) => !s || /undefined|NaN|null/.test(s) || /^(Helm|Telegraph|Door|Doors|Fires|Pump|Boats|Help|Report)\b/.test(s) || s === 'The helm' || s === 'The pumps';
{
  const sim = N.run(N.create(ship, spec, { auto: true }), { tMax: 900, settle: 120 });
  const L = sim.night.log, bad = [];
  for (const e of L) for (const conv of ['1912', 'modern']) { const p = W.phrase(e, { convention: conv }); if (generic(p)) bad.push(show(e) + ' "' + p + '"'); }
  const first = W.phrase(L[0], { convention: '1912' }), rb = W.readback(L[0], true, { convention: '1912' });
  row('every entry of the 1912 watch\'s own log has the bridge\'s words', L.map(e => '"' + W.phrase(e, { convention: '1912' }) + '"').join(', '), L.length + ' entries; the first is the record\'s "Hard a-starboard"',
    L.length >= 4 && bad.length === 0 && first === 'Hard a-starboard');
  row('  read back by the quartermaster, naming where her head goes', rb.who + ': "' + rb.words + '"', 'The quartermaster: "Hard a-starboard, sir. Her head goes to port."', rb.who === 'The quartermaster' && rb.words === 'Hard a-starboard, sir. Her head goes to port.');
  const drawn = [], bad2 = [];
  for (const seed of [1, 2, 3, 4, 5]) {
    const s = N.run(N.create(ship, N.spec(seed), { auto: true }), { tMax: 600, settle: 60 });
    for (const e of s.night.log) { const p = W.phrase(e, { convention: '1912' }); drawn.push(p); if (generic(p)) bad2.push(seed + ': ' + show(e)); }
  }
  row('  and drawn nights\' (seeds 1 to 5, their scripted orders)', drawn.length + ' entries; ' + clip(Array.from(new Set(drawn)).join(', '), 70), 'each in words', drawn.length > 0 && bad2.length === 0);
}
{
  // what the page's own controls give (the wheel, the telegraph, the Bulkheads tab, the Systems tab), captioned as "you"
  const page = [];
  for (let v = -40; v <= 40; v++) page.push({ type: 'helm', value: v });
  for (const n of Object.keys(Mo.TELEGRAPH)) page.push({ type: 'telegraph', value: n });
  page.push({ type: 'doors', value: 'bridge' });
  C.BULKHEADS.forEach((b, i) => { if (b.doors.length) page.push({ type: 'door', value: i, arg: true }, { type: 'door', value: i, arg: false }); });
  for (let k = -1; k < Sys.PLANT.rooms.length; k++) page.push({ type: 'fires', value: k });
  for (let z = 0; z < C.ZONES.length; z++) { for (const a of ['own', 'all', 'off']) page.push({ type: 'pump', value: z, arg: a }); Sys.PLANT.pumps.forEach((p, i) => page.push({ type: 'pump', value: z, arg: i })); }
  Sys.PLANT.pumps.forEach((p, i) => page.push({ type: 'pump', value: -1, arg: i }));
  page.push({ type: 'pump', value: -1, arg: 'engineers' });
  const bad = page.filter(o => generic(W.phrase(o, { convention: '1912' })) || generic(W.phrase(o, { convention: 'modern' }))).map(show);
  row('every order the page\'s own controls can give has words (the wheel, the telegraph, the doors, the fires, the pumps)', bad.length ? clip(list(bad), 120) : page.length + ' orders, e.g. "' + W.phrase({ type: 'pump', value: -1, arg: 1 }) + '"', 'each in words', bad.length === 0);
}
{
  // every readback, carried out or refused, by someone on the bridge
  const dones = [true, false, { ok: false, why: 'A reason of the model\'s' }, { ok: true, text: 'On boiler room 5: its pump, at work in 5 minutes', short: 'x' }];
  const bad = [], who = {};
  for (const o of D) for (const d of dones) {
    const r = W.readback(o, d, { convention: '1912', helm: -40, first: true });
    who[r.who] = 1;
    if (BRIDGE.indexOf(r.who) < 0 || !r.words || !/[.?!]$/.test(r.words) || /\b(ship|system|computer|AI)\b/i.test(r.who)) bad.push(show(o) + ' ' + JSON.stringify(r));
  }
  row('every readback, carried out or refused, is said by someone on the bridge', bad.length ? clip(list(bad, 1), 140) : Object.keys(who).join(', '), 'never the ship, the system, a computer', bad.length === 0);
  const rb = (o, d, x) => W.readback(o, d, Object.assign({ convention: '1912' }, x || {}));
  const lines = [
    [rb({ type: 'telegraph', value: 'full astern' }, true), 'The officer at the telegraph', 'Full astern, sir. The engine room answers.'],
    [rb({ type: 'doors', value: 'bridge' }, true), 'The officer of the watch', 'The watertight doors are closing, sir.'],
    [rb({ type: 'fires', value: 0 }, true), 'The junior officer', 'By telephone to the engine room, sir: draw the fires in boiler room six.'],
    [rb({ type: 'pump', value: 5, arg: 'own' }, { ok: false, why: 'No steam for the pumps: 12.0 psi in the boilers, and they stop at 30' }), 'The junior officer', 'The engine room, by telephone: No steam for the pumps: 12.0 psi in the boilers, and they stop at 30.'],
    [rb({ type: 'boats:rule', value: 'first', arg: 'both' }, true), 'The officer of the watch', 'I\'ll pass the word to the boats, sir: women and children first.'],
    [rb({ type: 'help:call', value: 'cqd' }, true), 'The junior officer', 'I\'ll take it to the wireless room, sir: send the call for assistance.'],
    [rb({ type: 'help:rocket', value: 'socket' }, true, { first: true }), 'The fourth officer', 'A man has gone aft for the rockets, sir.'],
    [rb({ type: 'report:look', value: 'forward' }, true), 'The officer of the watch', 'An officer is going forward, sir.'],
    [rb({ type: 'boats:uncover', value: 'now' }, false, { why: 'Nothing calls for the boats yet: she has not touched the ice' }), 'The officer of the watch', 'Nothing calls for the boats yet: she has not touched the ice.'],
    // what the answer must not overstate: where the helm takes her with no way on her, or sternway; fires already out or drawn
    [rb({ type: 'helm', value: -40 }, true, { way: 'none' }), 'The quartermaster', 'Hard a-starboard, sir. She has no way on her.'],
    [rb({ type: 'helm', value: 40 }, true, { way: 'astern' }), 'The quartermaster', 'Hard a-port, sir. She has sternway on her.'],
    [rb({ type: 'fires', value: 5 }, true, { nothing: true }), 'The junior officer', 'The engine room, by telephone: there are no fires to draw in boiler room one, sir.'],
    [rb({ type: 'telegraph', value: 70 }, true), 'The officer at the telegraph', 'Seventy revolutions ahead, sir. The engine room answers.'],
  ];
  const off = lines.filter(([r, w, t]) => r.who !== w || r.words !== t).map(([r]) => r.who + ': ' + r.words);
  row('  the readbacks of section 4.6, each on the bridge; a refusal is the model\'s own reason', off.length ? clip(list(off, 1), 140) : lines.length + ' lines as written', 'the telegraph\'s reply; the engine room by telephone; the word passed', off.length === 0);
}

// ------------------------------------------------------------------ 6. the library is pure
console.log('\n6. the library is pure');
{
  const all = [].concat(HELM_1912, ENGINES, DOORS_FIRES_PUMPS, BOATS_CALLS_ERRANDS, MORE, SEVERAL, GUARD, NOT).map(c => c[0]);
  const first = all.map(t => JSON.stringify(W.parse(t, { convention: '1912', helm: -40 })));
  for (const t of all.slice().reverse()) W.parse(t, { convention: 'modern', helm: 25 });   // other calls between
  const second = all.map(t => JSON.stringify(W.parse(t, { convention: '1912', helm: -40 })));
  const differ = all.filter((t, i) => first[i] !== second[i]);
  const ctx = Object.freeze({ convention: 'modern', helm: 10 }), before = JSON.stringify(ctx);
  let ctxThrew = false; try { W.parse('ease to five', ctx); W.phrase({ type: 'helm', value: 5 }, ctx); W.readback({ type: 'helm', value: 'reverse' }, true, ctx); } catch (e) { ctxThrew = true; }
  row('two calls, the same answer, whatever was asked between; its context is only read', differ.length + ' of ' + all.length + ' differ; a frozen context ' + (ctxThrew ? 'threw' : 'read'), 'none differ; read', differ.length === 0 && !ctxThrew && JSON.stringify(ctx) === before);
  const deep = (o) => Object.isFrozen(o) && Object.keys(o).every(k => (o[k] && typeof o[k] === 'object' ? deep(o[k]) : true));
  row('  its tables and the library itself are frozen: it keeps no state', 'TABLES ' + deep(W.TABLES) + ', VOCAB ' + deep(W.VOCAB) + ', the library ' + Object.isFrozen(W), 'all frozen', deep(W.TABLES) && deep(W.VOCAB) && Object.isFrozen(W));
}
{
  const file = path.join(root, 'site', 'parts', '85_crew_words.js'), src = fs.readFileSync(file, 'utf8');
  const box = vm.createContext({}), keys0 = Object.getOwnPropertyNames(box);
  vm.runInContext(src, box, { filename: '85_crew_words.js' });
  const added = Object.getOwnPropertyNames(box).filter(k => keys0.indexOf(k) < 0);
  const ok = added.length === 1 && added[0] === 'TitanicCrewWords' && typeof box.TitanicCrewWords.parse === 'function' && box.TitanicCrewWords.parse('hard a-starboard', {}).orders[0].value === -40;
  row('loaded as a page loads it, it puts nothing on the global object but its name', added.join(', ') || 'nothing', 'TitanicCrewWords, which parses', ok);
  const code = src.split(/\r?\n/).filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
  const reads = code.match(/\b(document|window|localStorage|sessionStorage|performance|Date|setTimeout|setInterval|requestAnimationFrame|fetch|XMLHttpRequest|require|TitanicApp|TitanicCore|TitanicNight)\b|Math\.random/g) || [];
  row('  it reads no DOM, no clock, no chance, no model, no network', reads.length ? Array.from(new Set(reads)).join(', ') : 'none', 'none (no DOM, no state, no clock)', reads.length === 0);
  const nonAscii = /[^\x00-\x7f]/.test(src);
  const v = W.VOCAB, vOk = Array.isArray(v) && v.length <= 100 && new Set(v).size === v.length && v.every(s => typeof s === 'string' && s.length > 0 && !/[^\x20-\x7e]/.test(s));
  row('  its source is ASCII; VOCAB is at most 100 words and names for speech to text (step 2)', 'ASCII ' + !nonAscii + '; VOCAB ' + v.length + ' unique', 'ASCII; at most 100', !nonAscii && vOk);
}

console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${rows.length} rows`);
process.exit(fails ? 1 : 0);
