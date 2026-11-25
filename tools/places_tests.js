// G26: her named places and the walks between them (core/readers/places.js;
// docs/DESIGN_G26_her_named_places_and_walks_v1_2026-11-24.md), held to the tool that bakes them (tools/places_table.js)
// and to the model.
//   node tools/places_tests.js     (seconds; writes out/places_1912.txt through tools/outdir.js)
// MUST rows:
// - the library's two baked blocks are the tool's (node tools/places_table.js --write);
// - every place has its fields and one tag, and stands where it says: on its deck (z the deck's height there, or its
//   room's floor where the deck is no floor; the nest on the foremast), in the R3 row it names;
// - a walk between every two places, the same both ways, never shorter than the straight line between them, and
//   climbing at least the height between them;
// - a library: no state, no sim read, no Math transcendental (tools/engine_tests.js's rule for core/), and the same
//   answers on a second load.
// CHECK rows: the numbers elsewhere that disagree with the table (the bridge's front, the wireless room, the rocket
// socket); the walks that wait on R3's ladders and escapes (the bridge to the nest and to a stokehold, against a
// route on the open decks' ladders).
'use strict';
const fs = require('fs');
const path = require('path');
const C = require('../core/core.js');
const PL = require('../core/readers/places.js');
const PT = require('./places_table');
const outFile = require('./outdir');

const root = path.join(__dirname, '..');
const lines = [], say = (s) => { lines.push(s === undefined ? '' : s); console.log(s === undefined ? '' : s); };
const musts = [], checks = []; let fails = 0;
function must(what, value, ref, ok) { musts.push([what, value, ref, ok]); if (!ok) fails++; }
function check(what, value, ref, ok) { checks.push([what, value, ref, ok]); }
const TAGS = ['read', 'scaled', 'derived', 'bet'];

const D = PT.derive();

// 1. the baked blocks are the tool's
{
  const src = fs.readFileSync(path.join(root, 'core', 'readers', 'places.js'), 'utf8'), baked = PT.bakedOf(src);
  const same = baked.placesText === D.placesText && baked.walkText === D.walkText;
  must('the library\'s baked blocks (PLACES and WALK) are the tool\'s: node tools/places_table.js --write writes them',
    (baked.placesText === D.placesText ? 'places the same' : 'places DIFFER') + '; ' + (baked.walkText === D.walkText ? 'walks the same' : 'walks DIFFER'), 'the same', same);
}
// 2. every place where it says
{
  const bad = [];
  for (const p of PL.PLACES) {
    const sp = PT.SPEC.find((s) => s.key === p.key), d = D.P.find((q) => q.key === p.key);
    if (!sp || !d) { bad.push(p.key + ' not in the tool'); continue; }
    if (!(p.name && p.src && p.src.length > 20 && TAGS.indexOf(p.tag) >= 0)) bad.push(p.key + ' its name, source or tag');
    if (p.zone !== C.zoneAt(p.x)) bad.push(p.key + ' its zone');
    if (p.deck) {
      const room = D.env.G.rooms[d._k], want = D.env.G.noFloor(p.deck, room.zone) ? room.zDeck : C.deckZ(p.deck, p.x);
      if (Math.abs(p.z - want) > 0.006) bad.push(p.key + ' not on its deck (' + p.z + ' against ' + want.toFixed(2) + ')');
    } else if (!(p.z > C.deckZ('Boat', p.x))) bad.push(p.key + ' not above her decks');
    if (sp.row && p.row !== sp.row) bad.push(p.key + ' in ' + p.row + ', not its row ' + sp.row);
  }
  must('every place has its name, source and one tag ([read], [scaled], [derived] or [bet]), its zone, and stands where it says: on its deck (z the deck\'s height at its x, or its room\'s floor where the deck is no floor; the nest above her decks), in the R3 row it names',
    PL.PLACES.length + ' places; ' + (bad.length ? bad.slice(0, 5).join('; ') : 'none wrong'), 'none wrong', PL.PLACES.length === PT.SPEC.length && !bad.length);
}
// 3. the walks
{
  const bad = [], keys = PL.PLACES.map((p) => p.key);
  let pairs = 0;
  for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
    pairs++;
    const a = keys[i], b = keys[j], w = PL.walk(a, b), v = PL.walk(b, a), A = PL.place(a), B = PL.place(b);
    if (!w) { bad.push(a + '>' + b + ' no walk'); continue; }
    if (!v || v.m !== w.m || v.climb !== w.climb) bad.push(a + '>' + b + ' not the same both ways');
    const straight = Math.hypot(A.x - B.x, A.y - B.y, A.z - B.z);
    if (w.m + 0.05 < straight) bad.push(a + '>' + b + ' ' + w.m + ' m, under the straight line ' + straight.toFixed(1));
    // every step of a walk counts the height it climbs or descends (a stair's, a deck's sheer): at least the height between them
    if (w.climb + 0.02 < Math.abs(A.z - B.z)) bad.push(a + '>' + b + ' climbs ' + w.climb + ' m, under the height between them (' + Math.abs(A.z - B.z).toFixed(2) + ')');
  }
  must('a walk between every two places, the same both ways, never shorter than the straight line between them, and climbing (and descending) at least the height between them',
    pairs + ' pairs; ' + (bad.length ? bad.slice(0, 4).join('; ') : 'none wrong'), 'none wrong', pairs > 0 && !bad.length);
}
// 4. a library
{
  const src = fs.readFileSync(path.join(root, 'core', 'readers', 'places.js'), 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  const trans = code.match(/Math\.(sin|cos|tan|asin|acos|atan|atan2|exp|expm1|log|log1p|log2|log10|pow|cbrt|hypot|sinh|cosh|tanh)\b/g) || [];
  const reads = code.match(/\bsim\b|\bNight\b|\bregister|\breader\(/g) || [];
  delete require.cache[require.resolve('../core/readers/places.js')];
  const again = require('../core/readers/places.js');
  const same = JSON.stringify(again.PLACES) === JSON.stringify(PL.PLACES) && JSON.stringify(again.walk('bridge', 'nest')) === JSON.stringify(PL.walk('bridge', 'nest'));
  must('a library: no state, no sim read and no reader registered, no Math transcendental (tools/engine_tests.js\'s rule for core/), the same answers on a second load',
    'transcendentals ' + (trans.length ? trans.join(',') : 'none') + '; sim or reader words ' + (reads.length ? reads.join(',') : 'none') + '; a second load ' + (same ? 'the same' : 'DIFFERENT'), 'none; none; the same', !trans.length && !reads.length && same);
}

// the CHECK rows: the numbers elsewhere, read from their files as they stand
const grab = (file, re) => { const m = re.exec(fs.readFileSync(path.join(root, file), 'utf8')); return m ? +m[1] : null; };
const ELSE = [
  ['bridge', 'x', 'site/app.js, the bridge camera (BRIDGE.x)', grab('site/app.js', /const BRIDGE = \{ x: ([\d.]+)/)],
  ['bridge', 'x', 'core/readers/world.js, the bridge\'s front in its comment ("the bridge\'s front at x 72")', grab('core/readers/world.js', /the bridge's front at x ([\d.]+)/)],
  ['wireless', 'x', 'core/readers/world.js, SET.roomX', grab('core/readers/world.js', /roomX: ([\d.]+)/)],
  ['socket.stbd', 'x', 'core/readers/world.js, ROCKETS.socketX', grab('core/readers/world.js', /socketX: ([\d.]+)/)],
];
for (const [key, f, where, v] of ELSE) {
  const p = PL.place(key);
  check('elsewhere: ' + where + ' against the table\'s ' + key, (v === null ? 'NOT FOUND in its file' : v) + ' against ' + p[f] + ' (' + (v === null ? '-' : (v - p[f] >= 0 ? '+' : '') + (v - p[f]).toFixed(1)) + ' m)', 'within 1 m', v !== null && Math.abs(v - p[f]) <= 1);
}
{
  const w = PL.walk('bridge', 'nest'), n = PL.place('nest'), b = PL.place('bridge');
  const ladders = Math.abs(b.x - n.x) + 1.6 * Math.abs(b.z - C.deckZ('C', n.x)) + Math.abs(n.z - C.deckZ('B', n.x));
  check('the bridge to the crow\'s nest against a route by the open decks\' ladders (the bridge\'s ladders down to the well deck, the forecastle\'s up, the mast\'s): R3 has no rows for those ladders, so the walk goes through her inside',
    w.m + ' m against about ' + ladders.toFixed(0) + ' m', 'within half again', w.m <= 1.5 * ladders);
  const s = PL.walk('bridge', 'stokehold.6'), k = PL.place('stokehold.6');
  const escape = Math.abs(b.x - k.x) + 1.6 * Math.abs(b.z - k.z);
  check('the bridge to boiler room 6 against the straight route down (her stairs to E deck, the firemen\'s escape to the stokehold): R3 has no row for the boiler rooms\' escapes',
    s.m + ' m against about ' + escape.toFixed(0) + ' m', 'within half again', s.m <= 1.5 * escape);
}

// the table
say('G26: HER NAMED PLACES, AND THE WALKS BETWEEN THEM (core/readers/places.js; a stair counts its rise x ' + PT.STAIR + ' [bet])');
say('');
say('  place        deck   x m      y m     z m     zone side  stands in               tag       name');
for (const p of PL.PLACES) say('  ' + p.key.padEnd(13) + String(p.deck || 'mast').padEnd(7) + p.x.toFixed(2).padStart(7) + p.y.toFixed(2).padStart(8) + p.z.toFixed(2).padStart(8) + String(p.zone).padStart(6) + (p.side ? '  S  ' : '  P  ') + String(p.room).padEnd(24) + p.tag.padEnd(10) + p.name);
say('');
say('THE WALKS FROM THE BRIDGE AND FROM THE WIRELESS ROOM (m along her decks and stairs; climb m; the rooms passed)');
for (const a of ['bridge', 'wireless']) for (const p of PL.PLACES) if (p.key !== a) {
  const w = PL.walk(a, p.key), via = D.paths[a + '>' + p.key] || (D.paths[p.key + '>' + a] || []).slice().reverse();
  say('  ' + (a + ' > ' + p.key).padEnd(28) + (w.m.toFixed(1) + ' m').padStart(9) + ('climb ' + w.climb.toFixed(2)).padStart(14) + '   ' + via.join(', '));
}
say('');
say('EVERY WALK (m / climb m), each pair once');
const keys = PL.PLACES.map((p) => p.key);
for (let i = 0; i < keys.length; i++) {
  const row = [];
  for (let j = i + 1; j < keys.length; j++) { const w = PL.walk(keys[i], keys[j]); row.push(keys[j] + ' ' + w.m.toFixed(0) + '/' + w.climb.toFixed(1)); }
  if (row.length) say('  ' + keys[i].padEnd(13) + row.join('; '));
}
say('');
say('THE CHECK ROWS');
for (const [what, value, ref, ok] of checks) say((ok ? 'in   ' : 'out  ') + 'CHECK ' + what + ' | ' + value + ' | ' + ref);
fs.writeFileSync(outFile('places_1912.txt'), lines.join('\n') + '\n');
console.log('');
for (const [what, value, ref, ok] of musts) console.log((ok ? 'PASS' : 'FAIL') + ' MUST  ' + what + ' | ' + value + ' | ' + ref);
console.log(fails ? 'FAIL: ' + fails + ' of ' + musts.length + ' MUST rows' : 'PASS: every MUST row (' + musts.length + '); CHECK rows in: ' + checks.filter((c) => c[3]).length + ' of ' + checks.length);
process.exit(fails ? 1 : 0);
