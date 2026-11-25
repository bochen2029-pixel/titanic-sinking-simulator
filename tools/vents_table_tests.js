// Her vents (data/vents_1912.json, NH7's table in R3's form): the table against the model.
//   node tools/vents_table_tests.js      (seconds; writes out/vents_table_tests.txt through tools/outdir.js)
// MUST rows: every row has the schema's fields, a known kind and one tag, and every bet its reason; its derived fields
// are the model's own (tools/vents_table.js); every row inside its space by the model's own functions (its inlet in
// rooms.js's slab of the space it names: its zone, side and layer); no vent below its deck (its inlet on its deck, its
// top above its inlet, a layer 0 vent leaving its space at or below E deck and a layer 1 vent above it); every area
// positive; the after body complete (zones 10 to 15: every space with a vent, or named in spaces_without with a reason).
// CHECK rows: the rows by tag, kind and zone; each space's vents and their area (the table).
'use strict';
const fs = require('fs');
const path = require('path');
const C = require('../core/core.js');
const R = require('../core/readers/rooms.js');
const VT = require('./vents_table');
const outFile = require('./outdir');

const lines = [], say = (s) => { lines.push(s === undefined ? '' : s); console.log(s === undefined ? '' : s); };
const musts = []; let fails = 0;
function must(what, value, ref, ok) { musts.push([what, value, ref, ok]); if (!ok) fails++; }
const V = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'vents_1912.json'), 'utf8'));
const ship = C.buildShip(), T = R.table(ship);
const KINDS = ['casing', 'skylight', 'hatch', 'fan', 'trunk', 'vent', 'fidley', 'funnel', 'cowl', 'air pipe', 'dome'];
const TAGS = ['read', 'derived', 'bet'];
const FIELDS = ['id', 'kind', 'name', 'space', 'deck', 'top', 'area', 'leads', 'source', 'check', 'tag', 'closes'];
// a head or range of heads (m) at which what closes a vent gives way: each entry its what, how and tag, numbers in order
function wayBad(v) {
  if (v.gives_way === undefined) return [];
  if (!Array.isArray(v.gives_way)) return [v.id + ' gives_way not a list'];
  const bad = [];
  v.gives_way.forEach((g, i) => {
    const at = v.id + ' gives_way[' + i + ']';
    if (!(g.what && g.how && g.how.length > 20)) bad.push(at + ' without its what or how');
    if (TAGS.indexOf(g.tag) < 0) bad.push(at + ' tag ' + g.tag);
    for (const k of ['head_m', 'lo_m', 'hi_m']) if (g[k] != null && !(typeof g[k] === 'number' && g[k] >= 0)) bad.push(at + ' ' + k);
    if (g.lo_m != null && g.hi_m != null && g.lo_m > g.hi_m) bad.push(at + ' lo over hi');
  });
  return bad;
}
const wayAt = (g) => {
  const at = (g.head_m != null ? g.head_m.toFixed(2) + ' m' : '') + (g.lo_m != null || g.hi_m != null ? (g.head_m != null ? ', ' : '') + (g.lo_m == null ? '?' : g.lo_m.toFixed(2)) + '..' + (g.hi_m == null ? '?' : g.hi_m.toFixed(2)) + ' m' : '');
  return at ? 'at ' + at : g.when ? 'when ' + g.when : 'at no head read';
};
const key = (v, s) => v.space.zone + ':' + s + ':' + v.space.layer;

// 1. the schema
{
  const bad = [];
  const ids = new Set();
  for (const v of V.rows) {
    const miss = FIELDS.filter((k) => v[k] === undefined || v[k] === null || v[k] === '');
    if (miss.length) bad.push(v.id + ' lacks ' + miss.join(','));
    if (ids.has(v.id)) bad.push(v.id + ' twice');
    ids.add(v.id);
    if (KINDS.indexOf(v.kind) < 0) bad.push(v.id + ' kind ' + v.kind);
    if (TAGS.indexOf(v.tag) < 0) bad.push(v.id + ' tag ' + v.tag);
    if (v.tag === 'bet' && !(v.why && v.why.length > 20)) bad.push(v.id + ' a bet without its reason');
    if (!(v.r3 && v.r3.length) && !v.x) bad.push(v.id + ' placed by neither R3 nor frames');
    if (!Array.isArray(v.space.sides) || !v.space.sides.length || v.space.sides.some((s) => s !== 'P' && s !== 'S')) bad.push(v.id + ' sides');
    bad.push(...wayBad(v));
  }
  must('the schema: every row has its id, kind, name, space (zone, sides, layer), deck, top, area, leads, source, check, what closes it and one tag ([read], [derived] or [bet]); every bet its reason; each placed by R3\'s rows or its frames; each way it gives way its what, how and tag, its heads in order',
    V.rows.length + ' rows; ' + (bad.length ? bad.slice(0, 6).join('; ') : 'none wrong'), 'none wrong', !bad.length && V.rows.length > 0);
}

// 2. the derived fields are the model's own
{
  const off = [];
  for (const v of V.rows) { const d = VT.derive(v, ship); for (const k of VT.DERIVED) if (JSON.stringify(v[k]) !== JSON.stringify(d[k])) off.push(v.id + '.' + k); }
  must('the derived fields (place, heights, areas, slab) are the model\'s own: node tools/vents_table.js --write writes them', off.length ? off.slice(0, 8).join(', ') : 'all ' + V.rows.length + ' rows', 'every field', !off.length);
}

// 3. inside its space, by the model's own functions
{
  const out = [];
  for (const v of V.rows) {
    const s = T.list[v.slab];
    const want = v.space.sides.map((sd) => C.nodeIndex(v.space.zone, sd === 'P' ? 0 : 1, v.space.layer));
    if (!s || want.indexOf(s.n) < 0) out.push(v.id + ' (slab ' + (s ? s.key : 'none') + ')');
    const xc = 0.5 * (v.x_m[0] + v.x_m[1]);
    if (C.zoneAt(xc) !== v.space.zone) out.push(v.id + ' (zone ' + C.zoneAt(xc) + ')');
  }
  must('every row inside its space by the model\'s own functions: its inlet (its place\'s middle, 0.3 m under its deck where it leaves its space through the space\'s top, 0.3 m over it otherwise) in rooms.js\'s slab of a space it names, and its middle in its zone (C.zoneAt)', out.length ? out.join(', ') : 'all ' + V.rows.length, 'all', !out.length);
}

// 4. no vent below its deck; tops above inlets; layers
{
  const bad = [];
  for (const v of V.rows) {
    const xc = 0.5 * (v.x_m[0] + v.x_m[1]), zDeck = C.deckZ(v.deck, xc), zE = C.deckZ('E', xc);
    // within 1 mm: the table keeps its heights to 0.1 mm, taken at the middle of its place before that is rounded
    if (v.z_in_m < zDeck - 1e-3) bad.push(v.id + ' under its deck');
    if (!(v.z_top_m > v.z_in_m)) bad.push(v.id + ' top not above its inlet');
    if (v.space.layer === 0 && v.z_in_m > zE + 1e-3) bad.push(v.id + ' a layer 0 vent above E deck');
    if (v.space.layer === 1 && v.z_in_m < zE - 1e-3) bad.push(v.id + ' a layer 1 vent under E deck');
  }
  must('no vent below its deck: its inlet on its deck, its top above its inlet; a layer 0 vent leaves its space at or under E deck, a layer 1 vent at or over it', bad.length ? bad.join(', ') : 'all ' + V.rows.length, 'all', !bad.length);
}

// 5. areas positive
{
  const bad = V.rows.filter((v) => !(v.area_m2 > 0)).map((v) => v.id);
  must('every area positive (the narrower of its trunk and its way out)', bad.length ? bad.join(', ') : 'all ' + V.rows.length, 'all', !bad.length);
}

// 6. the after body complete
{
  const have = new Set(), without = new Map();
  for (const v of V.rows) for (const s of v.space.sides) have.add(key(v, s));
  for (const w of V.spaces_without || []) for (const s of w.sides) without.set(w.zone + ':' + s + ':' + w.layer, w.why);
  const missing = [];
  for (let z = 10; z <= 15; z++) for (const s of ['P', 'S']) for (const l of [0, 1]) {
    const k = z + ':' + s + ':' + l;
    if (!have.has(k) && !(without.get(k) && without.get(k).length > 20)) missing.push(k);
  }
  must('the after body complete: every space of zones 10 to 15 (the reciprocating engine room aft) has a vent, or is named in spaces_without with its reason',
    missing.length ? 'missing ' + missing.join(' ') : '24 spaces: ' + [...have].filter((k) => +k.split(':')[0] >= 10).length + ' with vents, ' + [...without.keys()].filter((k) => +k.split(':')[0] >= 10).length + ' without, each with its reason', 'none missing', !missing.length);
}

// the table: rows by tag, kind and zone; each space's vents
const by = (f) => { const m = {}; for (const v of V.rows) { const k = f(v); m[k] = (m[k] || 0) + 1; } return Object.entries(m).map(([k, n]) => k + ' ' + n).join(', '); };
say('HER VENTS (data/vents_1912.json): ' + V.rows.length + ' rows; by tag: ' + by((v) => v.tag) + '; by kind: ' + by((v) => v.kind));
say('by zone: ' + by((v) => 'z' + v.space.zone));
say('');
say('  id      kind     space     inlet       top       z in..top m    trunk m2   exit m2   area m2  tag      name');
for (const v of V.rows) say('  ' + v.id.padEnd(8) + v.kind.padEnd(9) + (v.space.zone + ':' + v.space.sides.join('') + ':' + v.space.layer).padEnd(10) + v.deck.padEnd(12) + v.top.padEnd(10) + (v.z_in_m.toFixed(2) + '..' + v.z_top_m.toFixed(2)).padEnd(15) + (v.trunk_m2 == null ? '-' : v.trunk_m2.toFixed(2)).padStart(8) + (v.exit_m2 == null ? '-' : v.exit_m2.toFixed(2)).padStart(10) + v.area_m2.toFixed(2).padStart(10) + '  ' + v.tag.padEnd(8) + ' ' + v.name);
say('');
say('WHAT CLOSES EACH, AND AT WHAT HEAD IT GIVES WAY (rows by the ways each gives: ' + by((v) => (v.gives_way || []).length + ' ways') + '; heads by tag: ' + (() => { const m = {}; for (const v of V.rows) for (const g of v.gives_way || []) m[g.tag] = (m[g.tag] || 0) + 1; return Object.entries(m).map(([k, n]) => k + ' ' + n).join(', ') || 'none'; })() + ')');
for (const v of V.rows) {
  say('  ' + v.id.padEnd(8) + v.closes);
  for (const g of v.gives_way || []) say('  ' + ''.padEnd(8) + '  gives way: ' + g.what + ', ' + wayAt(g) + ' [' + g.tag + ']');
}
say('');
say('SPACES WITHOUT A VENT IN THE TABLE (named, with the reason)');
for (const w of V.spaces_without || []) say('  ' + (w.zone + ':' + w.sides.join('') + ':' + w.layer).padEnd(10) + w.why);
say('');
say('NOTES FOR NH7 (what the sources say of a space as a whole)');
for (const n of V.notes || []) say('  ' + ((n.zone === null ? 'all' : n.zone) + ':' + n.layer).padEnd(10) + (n.state ? '(' + n.state + ') ' : '') + n.what);
fs.writeFileSync(outFile('vents_table_tests.txt'), lines.join('\n') + '\n');
console.log('');
for (const [what, value, ref, ok] of musts) console.log((ok ? 'PASS' : 'FAIL') + ' MUST  ' + what + ' | ' + value + ' | ' + ref);
console.log(fails ? 'FAIL: ' + fails + ' of ' + musts.length + ' MUST rows' : 'PASS: every MUST row (' + musts.length + ')');
process.exit(fails ? 1 : 0);
