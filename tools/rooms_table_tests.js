// R3: the tables of her rooms (data/rooms/<deck>_deck.json, read off the deck plans under
// docs/research/RESEARCH_rooms_plans_licence_v1_1_2026-11-20.md) against the model they are read into, deck by deck:
// - every row has its fields: id, kind, name, frames, feet, doors (each with a width or a stated reason), source, check;
// - its derived fields are the model's own (metres from her frames, zone by C.zoneAt, slab by TitanicRooms.slabAt);
// - each slab of the deck (a compartment's side between that deck and the one above) holds no more room floor than it has;
// - the rooms stand where the model has a space of that deck (in the wells on C deck it has none; above B deck only its
//   tiers and houses), but rows tagged 'beyond the model', which are findings and are named;
// - on E deck, Scotland Road's width against the record (8 ft 6 in by the Report to 9 ft by Wilding: 2.59 to 2.74 m);
// - the plan's bulkheads K to O stand within 0.5 m of the model's (a check of the frames' scale); the others printed;
// - every door names a row of the table, or a place off it;
// - where a table carries her side as the plan draws it at her ends (C, D and E decks: T.side), the reading's port and
//   starboard agree within 1.5 ft, and the comparison with the model's half-breadth is printed (BACKLOG G14);
// - her openings (data/rooms/openings.json, for S1's WINDOWS): each row's fields, sizes positive and counts whole, each
//   opening inside its deck and its rooms, its derived fields the model's, a counted group's positions its count (G20),
//   her two sides' counts on each deck agreeing within a tenth (G20); the counts and clear areas per deck and side.
// The table it prints is out/rooms_table_tests.txt. After a change to a table: node tools/rooms_table.js --write <it>.
//   node tools/rooms_table_tests.js [data/rooms/E_deck.json ...]     (no argument: every table in data/rooms, top down)
'use strict';
const fs = require('fs');
const path = require('path');
const C = require('../core/core.js');
const R = require('../core/readers/rooms.js');
const L = require('./rooms_table.js');
const ORDER = ['Boat', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'orlop'];
const dir = path.join(__dirname, '..', 'data', 'rooms');
const args = process.argv.slice(2);
const files = args.length ? args.filter((f) => /_deck\.json$/.test(f))
  : fs.readdirSync(dir).filter((f) => /_deck\.json$/.test(f)).map((f) => path.join('data', 'rooms', f))
    .sort((a, b) => ORDER.indexOf(path.basename(a).split('_')[0]) - ORDER.indexOf(path.basename(b).split('_')[0]));
// her openings (data/rooms/openings.json): checked after the decks, when no file is named or when it is named
const openingsFile = args.length ? args.find((f) => /openings\.json$/.test(f)) : (fs.existsSync(path.join(dir, 'openings.json')) ? path.join('data', 'rooms', 'openings.json') : null);
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push(ok); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(96) + ' ' + String(value).padEnd(44) + ' ' + ref); }
const FT = 0.3048;
const ship = C.buildShip();
const tab = R.table(ship);
const ZB = [Infinity].concat(C.BULKHEADS.map((b) => b.x), [-Infinity]);

// R1 cuts the space below G deck as one slab ('below G'): rooms on the orlop decks stand in it
const SLABFLOOR = { orlop: 'below G', 'lower orlop': 'below G' };

function checkDeck(file) {
  const T = JSON.parse(fs.readFileSync(file, 'utf8'));
  const dk = T.deck, fl = SLABFLOOR[dk] || dk;
  console.log(`\n== ${dk} deck: ${file.replace(/\\/g, '/')}, ${T.rows.length} rows ==`);
  // 1. the rows' own fields
  const ids = new Set(); const bad = [];
  for (const r of T.rows) {
    const ok = r.id && !ids.has(r.id) && r.kind && r.name && Array.isArray(r.x) && r.x.length === 2 && Array.isArray(r.y) && r.y.length === 2
      && Array.isArray(r.doors) && r.doors.every((d) => d.to && (typeof d.width_ft === 'number' || (d.width && d.width.length)))
      && typeof r.source === 'string' && r.source.length > 10 && typeof r.check === 'string' && r.check.length > 5 && Array.isArray(r.tags);
    if (!ok) bad.push(r.id);
    ids.add(r.id);
  }
  const kinds = {}; for (const r of T.rows) kinds[r.kind] = (kinds[r.kind] || 0) + 1;
  row(`${dk}: the rows: each has its id, kind, name, frames, feet, doors (a width or a reason), source, check and tags`, `${T.rows.length} rows; bad: ${bad.length ? bad.join(' ') : 'none'}`, 'every row', bad.length === 0);
  console.log('     kinds: ' + Object.keys(kinds).sort().map((k) => k + ' ' + kinds[k]).join(', '));
  const checked = T.rows.filter((r) => !/^not checked/.test(r.check)).length;
  const cabins = T.rows.filter((r) => r.kind === 'cabin').reduce((n, r) => n + (r.plan.match(/\b[A-G] \d+|#\d+/g) || []).length, 0);
  console.log(`     checked against an original: ${checked} of ${T.rows.length} rows; rows that are blocks of rooms: ${T.rows.filter((r) => r.tags.includes('block')).length}; cabin numbers named in the cabin rows: ${cabins}`);

  // 2. the derived fields are the model's own
  const D = L.derive(T, ship);
  const stale = T.rows.filter((r) => L.DERIVED.some((k) => JSON.stringify(r[k]) !== JSON.stringify(D.get(r.id)[k]))).map((r) => r.id);
  row(`${dk}: the derived fields (metres, area, zone by C.zoneAt, slab by slabAt) are the model's, as tools/rooms_table.js --write gives them`, `stale: ${stale.length ? stale.slice(0, 6).join(' ') + (stale.length > 6 ? ' ...' : '') : 'none'}`, 'none', stale.length === 0);
  // rows the plan draws where the model has no hull or tier at all are findings, tagged 'beyond the model': they are
  // kept in the table (they are facts of the plan) and named here, not failed
  const beyond = (r) => r.tags.includes('beyond the model');
  const noSlab = T.rows.filter((r) => !beyond(r) && (!D.get(r.id).slab.length || D.get(r.id).slab.some((s) => s < 0 || tab.list[s].floor !== fl))).map((r) => r.id);
  row(`${dk}:   every row stands in a slab of ${dk} deck (its pieces, cut at the model's bulkheads and the centreline)`, `outside: ${noSlab.length ? noSlab.join(' ') : 'none'}`, 'none', noSlab.length === 0);
  const bey = T.rows.filter(beyond);
  if (bey.length) console.log(`     tagged 'beyond the model' (the plan's room where the model has no space of ${dk} deck): ${bey.map((r) => `${r.id} (${r.x.join(' to ')})`).join(', ')}`);

  // 3. the fit: the union of the rooms on each slab (a 0.1 m grid) against the slab's footprint (its columns' plan area)
  const G = 0.1, X0 = -140, X1 = 132, Y0 = -16, Y1 = 16, NX = Math.round((X1 - X0) / G), NY = Math.round((Y1 - Y0) / G);
  const cover = new Uint8Array(NX * NY);
  const cellsOf = (p, fn) => {   // the grid's cells whose centres lie in the polygon p: fn(i, j)
    const ys = p.map((q) => q[1]);
    const j0 = Math.max(0, Math.floor((Math.min(...ys) - Y0) / G)), j1 = Math.min(NY - 1, Math.ceil((Math.max(...ys) - Y0) / G));
    for (let j = j0; j <= j1; j++) {
      const y = Y0 + (j + 0.5) * G; const xs = [];
      for (let i = 0; i < p.length; i++) { const [ax, ay] = p[i], [bx, by] = p[(i + 1) % p.length]; if ((ay <= y) !== (by <= y)) xs.push(ax + (y - ay) * (bx - ax) / (by - ay)); }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let i = Math.max(0, Math.ceil((xs[k] - X0) / G - 0.5)); i <= Math.min(NX - 1, Math.floor((xs[k + 1] - X0) / G - 0.5)); i++) fn(i, j);
    }
  };
  let sumArea = 0;
  for (const r of T.rows) { const p = D.get(r.id).poly_m; sumArea += L.area(p); cellsOf(p, (i, j) => { cover[j * NX + i] = 1; }); }
  // each cell of her deck: inside her side, and whether the model has a space standing on this deck there (L.spaceAt:
  // always under C deck; not in the wells on C deck; only its tiers and houses on B, A and the Boat deck)
  const sideAt = Array.from({ length: NX }, (_, i) => L.shellAt(X0 + (i + 0.5) * G, dk));
  const cellIn = (i, j) => Math.abs(Y0 + (j + 0.5) * G) <= sideAt[i] + 1e-9;
  const cellSpace = (i, j) => cellIn(i, j) && L.spaceAt(X0 + (i + 0.5) * G, Y0 + (j + 0.5) * G, dk);
  const per = new Map(), deckCells = new Map(); let outside = 0, offSpace = 0, union = 0;
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const x = X0 + (i + 0.5) * G, y = Y0 + (j + 0.5) * G;
    const inside = cellIn(i, j), space = inside && L.spaceAt(x, y, dk);
    const key = C.zoneAt(x) + ':' + (y >= 0 ? 'P' : 'S');
    if (space) deckCells.set(key, (deckCells.get(key) || 0) + G * G);
    if (!cover[j * NX + i]) continue;
    union += G * G;
    if (!inside) { outside += G * G; continue; }
    if (!space) { offSpace += G * G; continue; }
    per.set(key, (per.get(key) || 0) + G * G);
  }
  // The slab's footprint is the plan area of the model's columns (3 m by 0.5 m): it rounds her side inward by up to about
  // 1 %. The rooms' outboard edges stand on her side itself (the same half-breadth the columns are cut from), so a slab is
  // over-full only if the rooms exceed the larger of its columns' area and the model's own deck there. That deck is
  // counted on the same 0.1 m grid as the rooms, inside her side and where the model has a space of this deck (a deck the
  // rooms cover wall to wall then compares equal, whatever the grid's rounding at the zone's ends and her side); the
  // rooms' floor where the model has no space is the next check's, not this one's.
  const deckArea = (k, side) => deckCells.get(k + ':' + side) || 0;
  let worst = 0; const over = [], lines = [];
  for (const s of tab.list.filter((q) => q.floor === fl)) {
    const gross = s.foot / ship.nodeMu[s.n];   // the slab's footprint: its columns' plan area (foot is mu times it)
    const deck = deckArea(s.zone, s.side ? 'S' : 'P');
    const u = per.get(s.zone + ':' + (s.side ? 'S' : 'P')) || 0;
    if (!u) { lines.push([s.zone, s.side, s.key, gross, deck, 0, 0]); continue; }
    const f = u / gross; worst = Math.max(worst, u / Math.max(gross, deck));
    if (u > Math.max(gross, deck) * 1.005) over.push(s.key);
    lines.push([s.zone, s.side, s.key, gross, deck, u, f]);
  }
  row(`${dk}: each slab: the rooms on it (their union, a 0.1 m grid) cover no more floor than the slab has`, `worst slab ${(100 * worst).toFixed(1)} %; over: ${over.length ? over.join(' ') : 'none'}`, 'none over 100.5 %', over.length === 0);
  row(`${dk}:   no room stands outside the model's side at ${dk} deck`, `${outside.toFixed(1)} m2 outside`, 'under 1 m2', outside < 1);
  console.log(`     the rows' floor ${sumArea.toFixed(0)} m2 summed, ${union.toFixed(0)} m2 as a union: ${(sumArea - union).toFixed(0)} m2 where rows overlap (a block row drawn over a hatch or stair it lists in 'minus', or two readings of one wall)`);

  // 3b. the rooms against the model's own spaces of this deck: where the plan has a room and the model none (a well on
  // C deck; open deck beside its tiers and houses above B deck). A row mostly outside them must be tagged 'beyond the
  // model' (a finding); every row with a square metre or more outside is named.
  const offRows = [];
  for (const r of T.rows) {
    let a = 0, o = 0;
    cellsOf(D.get(r.id).poly_m, (i, j) => { if (!cellIn(i, j)) return; a++; if (!cellSpace(i, j)) o++; });
    if (o * G * G >= 1 || (a && o / a > 0.05)) offRows.push([r, o * G * G, a * G * G]);
  }
  const offBad = offRows.filter(([r, o, a]) => !beyond(r) && a > 0 && o / a > 0.5).map(([r]) => r.id);
  row(`${dk}: the rooms stand where the model has a space of ${dk} deck (its hull; above B deck its tiers and houses), but rows tagged 'beyond the model'`, `${offSpace.toFixed(1)} m2 outside it in ${offRows.length} rows; untagged and more than half outside: ${offBad.length ? offBad.join(' ') : 'none'}`, 'none untagged', offBad.length === 0);
  for (const [r, o, a] of offRows) console.log(`     ${r.id} (${r.x.join(' to ')}): ${o.toFixed(1)} of its ${a.toFixed(1)} m2 where the model has no space of ${dk} deck${beyond(r) ? ' [tagged beyond the model]' : ''}`);

  // 4. Scotland Road's width against the record (E deck)
  const sr = T.rows.find((r) => r.tags.includes('scotland-road') && r.walls_ft);
  if (sr) {
    const clear = (sr.y[1] - sr.y[0]) * FT, walls = (sr.walls_ft[0] + sr.walls_ft[1]) * FT, overWalls = clear + walls;
    row(`${dk}: Scotland Road's straight run (${sr.x.join(' to ')}): its width over its two walls, against the record's 8 ft 6 in to 9 ft`, `${overWalls.toFixed(2)} m over the walls; ${clear.toFixed(2)} m clear`, '2.59 to 2.74 m', overWalls >= 2.59 && overWalls <= 2.74);
    const runs = T.rows.filter((r) => r.tags.includes('scotland-road')).map((r) => `${r.id.slice(2)} ${((r.y[1] - r.y[0]) * FT).toFixed(2)}`);
    console.log(`     clear width by stretch (m): ${runs.join('; ')}; the model's port path: wPort 3.0 x wMul 1.036 = 3.11 m`);
    const sp = T.rows.filter((r) => /^E-SP/.test(r.id)).map((r) => `${r.id.slice(2)} ${((r.y[1] - r.y[0]) * FT).toFixed(2)}`);
    console.log(`     the starboard passage, clear width by stretch (m): ${sp.join('; ')}; the model's starboard path: wStbd 2.0 x wMul 1.036 = 2.07 m`);
  } else {
    const ps = T.rows.filter((r) => r.kind === 'passage' && typeof r.y[0] === 'number' && typeof r.y[1] === 'number').map((r) => `${r.id.replace(/^[A-Z]-/, '')} ${((r.y[1] - r.y[0]) * FT).toFixed(2)}`);
    if (ps.length) console.log(`     passages, clear width (m): ${ps.join('; ')}`);
  }

  // 5. the plan's bulkheads against the model's
  const bk = Object.entries(T.bulkheads).filter(([k]) => k.length === 1).map(([k, f]) => { const b = C.BULKHEADS.find((h) => h.id === k); return [k, f, L.frameM(T, f), b.x]; });
  const KO = bk.filter(([k]) => 'KLMNO'.includes(k));
  if (KO.length) {
    // the scale's check: K to O, the bulkheads the model's Inquiry lengths and the plans agree on. One may step between
    // decks (M stands a frame forward on G deck), so four of the five within 0.5 m pass, and the one off is printed.
    const devs = KO.map(([k, , x, m]) => [k, Math.abs(x - m)]);
    const good = devs.filter((d) => d[1] <= 0.5);
    const off = devs.filter((d) => d[1] > 0.5).map(([k, d]) => `${k} ${d.toFixed(2)} m`);
    row(`${dk}: the plan's bulkheads ${KO.map((q) => q[0]).join(', ')} on ${dk} deck, by her frames at the plan's scale, against the model's (the scale's check)`, `${good.length} of ${KO.length} within 0.5 m (worst of them ${Math.max(...good.map((d) => d[1])).toFixed(2)} m); off: ${off.length ? off.join(', ') : 'none'}`, 'four of five within 0.5 m', good.length >= Math.min(4, KO.length));
  }
  console.log('     ' + bk.map(([k, f, x, m]) => `${k} ${f}: ${x.toFixed(2)} m, the model's ${m.toFixed(2)} m (${(x - m >= 0 ? '+' : '') + (x - m).toFixed(2)})`).join('; '));

  // 6. the doors
  const dangling = [];
  for (const r of T.rows) for (const d of r.doors) if (/^[A-Z]-[\w]+$/.test(d.to) && !ids.has(d.to)) dangling.push(r.id + '->' + d.to);
  const nd = T.rows.reduce((n, r) => n + r.doors.reduce((m, d) => m + (d.n || 1), 0), 0);
  const wt = T.rows.reduce((n, r) => n + r.doors.filter((d) => d.kind === 'watertight door').length, 0);
  const written = T.rows.reduce((n, r) => n + r.doors.filter((d) => /^plan:/.test(d.width || '')).length, 0);
  row(`${dk}: every door names a row of the table or a place off it`, `${nd} doors in ${T.rows.length} rows; dangling: ${dangling.length ? dangling.join(' ') : 'none'}`, 'none dangling', dangling.length === 0);
  console.log(`     watertight doors on ${dk} deck: ${wt} entries; widths written on the plan: ${written} doors; the rest default [bet]`);

  // the zones where the plan and the model part
  const notes = T.rows.filter((r) => D.get(r.id).zone_note).map((r) => `${r.id} (${r.x.join(' to ')}): ${D.get(r.id).zone_note}`);
  console.log(`\n${dk} deck: where the plan's compartment and the model's zone part (the plan marks ${bk.map((q) => q[0]).join(', ')} on this deck):`);
  for (const n of notes) console.log('  ' + n);
  if (!notes.length) console.log('  nowhere');

  console.log(`\n${dk} deck, slab by slab: the slab's footprint (its columns), her deck there (her side), and the floor the table's rooms cover (m2)`);
  console.log('  zone side  slab            footprint     deck    rooms   cover of the footprint');
  for (const [z, s, key, gross, deck, u, f] of lines) console.log(`  ${String(z).padStart(4)} ${s ? 'S' : 'P'}     ${key.padEnd(14)} ${gross.toFixed(0).padStart(9)} ${deck.toFixed(0).padStart(8)} ${u.toFixed(0).padStart(8)} ${(100 * f).toFixed(0).padStart(6)} %`);
  // where the plan's deck ends aft against the model's side on the same deck
  if (T.frames.anchors.some((a) => a[0] === 'stern')) {
    let xm = 0; for (let x = -100; x > -150; x -= 0.05) { if (L.shellAt(x, dk) > 0) xm = x; else break; }
    console.log(`  (aft: the plan's ${dk} deck ends ${(-L.frameM(T, 'stern')).toFixed(1)} m abaft amidships; the model's side at ${dk} deck runs on to ${(-xm).toFixed(1)} m)`);
  }

  // 7. her side at her ends as the plan draws it, against the model's half-breadth (BACKLOG G14, the hull's ends).
  // The readings are the table's own (T.side, read off the page); the model's side is taken at the deck itself and
  // halfway to the deck above (where the table's 'shell' rows put it). Only the reading is checked: port against
  // starboard. The comparison is printed, a finding for the model, not a pass or fail of the table.
  if (T.side && Array.isArray(T.side.at)) {
    const at = T.side.at;
    const both = at.filter(([, p, s]) => typeof p === 'number' && typeof s === 'number');
    const worst = Math.max(...both.map(([, p, s]) => Math.abs(p - s)));
    row(`${dk}: her side as the plan draws it, read to port and to starboard, agrees within 1.5 ft at every frame read (a check of the reading)`, `${at.length} frames; worst ${worst.toFixed(2)} ft apart`, 'within 1.5 ft', worst <= 1.5);
    console.log(`\n${dk} deck: her side at her ends, the plan's against the model's (m from the centreline; the model at ${dk} deck itself, and halfway to the deck above)`);
    console.log('  frame       x     plan   model at deck   less plan   model halfway   less plan');
    for (const [f, p, s] of at) {
      const x = L.frameM(T, f), vals = [p, s].filter((v) => typeof v === 'number');
      const plan = vals.reduce((a, b) => a + b, 0) / vals.length * FT;
      const md = C.halfBreadth(x, C.deckZ(dk, x)), mm = L.shellAt(x, dk);
      console.log(`  ${f.padStart(5)} ${x.toFixed(1).padStart(7)} ${plan.toFixed(2).padStart(8)} ${md.toFixed(2).padStart(15)} ${(md - plan).toFixed(2).padStart(11)} ${mm.toFixed(2).padStart(15)} ${(mm - plan).toFixed(2).padStart(11)}`);
    }
  }
}

// her openings: the windows, sidelights and doors the plans write (for S1's WINDOWS), each on its deck and its rooms
function checkOpenings(file) {
  const O = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log(`\n== her openings: ${file.replace(/\\/g, '/')}, ${O.rows.length} rows ==`);
  const tables = {};
  for (const dk of new Set(O.rows.map((r) => r.deck))) { const p = path.join(dir, `${dk}_deck.json`); if (fs.existsSync(p)) tables[dk] = JSON.parse(fs.readFileSync(p, 'utf8')); }
  const KINDS = ['sidelight', 'window', 'door in her side', 'gangway door', 'house door', 'deck light'];
  const SIDES = ['P', 'S', 'P&S', 'front', 'aft wall', 'fwd wall', 'front and sides'];
  const INS = ['her side', 'a house wall', 'the deck'];
  // 1. the rows' own fields
  const ids = new Set(), bad = [];
  for (const r of O.rows) {
    const ok = r.id && !ids.has(r.id) && tables[r.deck] && Array.isArray(r.rooms) && r.rooms.length > 0 && KINDS.includes(r.kind) && INS.includes(r.in)
      && typeof r.plan === 'string' && r.plan.length > 2 && SIDES.includes(r.side) && Array.isArray(r.x) && r.x.length === 2
      && typeof r.count_how === 'string' && r.count_how.length > 3 && typeof r.source === 'string' && r.source.length > 10 && typeof r.check === 'string' && Array.isArray(r.tags)
      && (r.size_in === null || (Array.isArray(r.size_in) && ['round', 'rect', 'width'].includes(r.shape)));
    if (!ok) bad.push(r.id);
    ids.add(r.id);
  }
  row('openings: each row has its id, deck, rooms, kind, where it stands, the plan\'s words, size and shape, count and how it was had, side, frames, source, check and tags', `${O.rows.length} rows; bad: ${bad.length ? bad.join(' ') : 'none'}`, 'every row', bad.length === 0);
  // 2. sizes positive, counts whole
  const badSize = O.rows.filter((r) => (r.size_in && !(r.size_in.length === (r.shape === 'rect' ? 2 : 1) && r.size_in.every((v) => typeof v === 'number' && v > 0)))
    || (r.count !== null && !(Number.isInteger(r.count) && r.count > 0))).map((r) => r.id);
  row('openings:   every size is positive (one figure for a round one or a width, two for a rectangle), every count a whole number over 0 or null with its reason', `bad: ${badSize.length ? badSize.join(' ') : 'none'}; ${O.rows.filter((r) => r.size_in).length} sized, ${O.rows.filter((r) => r.count !== null).length} counted`, 'none', badSize.length === 0);
  // 3. inside its deck and its rooms
  const notIn = [];
  for (const r of O.rows) {
    const T = tables[r.deck]; if (!T) { notIn.push(r.id + ' (no deck table)'); continue; }
    const rooms = r.rooms.map((id) => T.rows.find((q) => q.id === id));
    if (rooms.some((q) => !q)) { notIn.push(r.id + ' (no such room)'); continue; }
    const spans = rooms.map((q) => [L.frameM(T, q.x[0]), L.frameM(T, q.x[1])].sort((a, b) => a - b));
    const lo = Math.min(...spans.map((s) => s[0])) - 1.0, hi = Math.max(...spans.map((s) => s[1])) + 1.0;
    if ([L.frameM(T, r.x[0]), L.frameM(T, r.x[1])].some((x) => x < lo || x > hi)) { notIn.push(r.id + ' (frames)'); continue; }
    if (r.in === 'her side' && (r.side === 'P' || r.side === 'S') && !rooms.some((q) => (r.side === 'P' ? q.y[1] === 'shell+' : q.y[0] === 'shell-'))) notIn.push(r.id + ' (not at her side)');
  }
  row('openings:   each stands inside its deck and its rooms (rows of that deck\'s table; its frames within theirs, a metre either way); one in her side on a room at her side, that side', `outside: ${notIn.length ? notIn.join(' ') : 'none'}`, 'none', notIn.length === 0);
  // 4. the derived fields are the model's
  const D = L.deriveOpenings(O, tables);
  const stale = O.rows.filter((r) => L.ODERIVED.some((k) => JSON.stringify(r[k]) !== JSON.stringify(D.get(r.id)[k]))).map((r) => r.id);
  row('openings: the derived fields (x in metres, zones by C.zoneAt, clear areas) are the model\'s, as tools/rooms_table.js --write gives them', `stale: ${stale.length ? stale.slice(0, 6).join(' ') + (stale.length > 6 ? ' ...' : '') : 'none'}`, 'none', stale.length === 0);
  // 4b. (G20) a group counted opening by opening: as many positions as its count, each one a frame inside the group's
  // own frames, none twice
  const badPos = [];
  for (const r of O.rows) {
    if (!Array.isArray(r.positions)) continue;
    const T = tables[r.deck], a = Math.min(L.frameM(T, r.x[0]), L.frameM(T, r.x[1])) - 1e-6, b = Math.max(L.frameM(T, r.x[0]), L.frameM(T, r.x[1])) + 1e-6;
    const xs = r.positions.map((f) => L.frameM(T, f));
    if (r.positions.length !== r.count || new Set(r.positions).size !== r.positions.length || xs.some((x) => !(x >= a && x <= b))) badPos.push(r.id);
  }
  row('openings:   a group counted opening by opening has as many positions as its count, each inside its frames, none twice', `${O.rows.filter((r) => Array.isArray(r.positions)).length} groups with positions; bad: ${badPos.length ? badPos.join(' ') : 'none'}`, 'none', badPos.length === 0);
  // 4c. (G20) her two sides agree: on each deck, the sidelights and windows counted in her side to port and to
  // starboard differ by no more than a tenth (or 3), a check of the counting, not of her
  const sideCount = new Map();
  for (const r of O.rows) if (r.in === 'her side' && (r.kind === 'sidelight' || r.kind === 'window') && (r.side === 'P' || r.side === 'S') && r.count) {
    const k = r.deck; if (!sideCount.has(k)) sideCount.set(k, { P: 0, S: 0 }); sideCount.get(k)[r.side] += r.count;
  }
  const lop = [...sideCount].filter(([, c]) => Math.abs(c.P - c.S) > Math.max(3, 0.1 * Math.max(c.P, c.S))).map(([k]) => k);
  row('openings:   on each deck the sidelights and windows counted in her side to port and to starboard agree within a tenth (or 3): a check of the counting', [...sideCount].map(([k, c]) => `${k} ${c.P}/${c.S}`).join(', '), 'every deck', lop.length === 0);
  // 5. the counts and clear areas per deck and side; those tagged 'inside her' open from room to room, not to the weather
  const inside = (r) => r.tags.some((t) => /^inside her/.test(t));
  console.log('\n  her openings per deck and side: groups, openings counted, their clear area (m2, where the size is known), and of them those to the weather');
  console.log('  deck   side              groups   openings   area m2   to the weather: openings, m2');
  const keys = new Map(); for (const r of O.rows) { const k = r.deck + '|' + r.side; if (!keys.has(k)) keys.set(k, []); keys.get(k).push(r); }
  const tot = { n: 0, a: 0, nw: 0, aw: 0 };
  for (const [k, rs] of keys) {
    const [dk, sd] = k.split('|'), w = rs.filter((r) => !inside(r));
    const n = rs.reduce((s, r) => s + (r.count || 0), 0), a = rs.reduce((s, r) => s + (r.area_m2 || 0), 0), nw = w.reduce((s, r) => s + (r.count || 0), 0), aw = w.reduce((s, r) => s + (r.area_m2 || 0), 0);
    tot.n += n; tot.a += a; tot.nw += nw; tot.aw += aw;
    console.log(`  ${dk.padEnd(6)} ${sd.padEnd(17)} ${String(rs.length).padStart(6)} ${String(n).padStart(10)} ${a.toFixed(2).padStart(9)}   ${String(nw).padStart(6)}, ${aw.toFixed(2)}`);
  }
  console.log(`  in all: ${tot.n} openings counted, ${tot.a.toFixed(1)} m2; to the weather ${tot.nw}, ${tot.aw.toFixed(1)} m2`);
  const byKind = new Map(); for (const r of O.rows) { const k = r.deck + ' ' + r.kind; byKind.set(k, (byKind.get(k) || 0) + (r.count || 0)); }
  console.log('  by deck and kind: ' + [...byKind].map(([k, v]) => `${k} ${v}`).join('; '));
  const unc = O.rows.filter((r) => r.count === null).map((r) => `${r.id} (${r.deck}, ${r.side})`);
  console.log(`  groups with no count (the plan gives none and does not let one count them): ${unc.length ? unc.join(', ') : 'none'}`);
}

for (const f of files) checkDeck(f);
if (openingsFile) checkOpenings(openingsFile);
console.log(fails ? `\nFAIL: ${fails} row(s)` : `\nPASS: all ${rows.length} rows`);
process.exit(fails ? 1 : 0);
