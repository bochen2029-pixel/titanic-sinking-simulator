// G26: her named places and the walks between them (core/readers/places.js;
// docs/DESIGN_G26_her_named_places_and_walks_v1_2026-11-24.md). SPEC holds each place's source fields by hand, each
// with its source and tag. derive() gives the rest by the model's own functions: x, y, z, zone and side, and the roomnet
// room each stands in. It also gives the walks between every two over a walking graph on roomnet's rooms.
//   node tools/places_table.js            print the places and the walks, and what differs from the baked blocks
//   node tools/places_table.js --write    bake PLACES and WALK into core/readers/places.js between their markers
// The walking graph (the design, section 3):
// - nodes: roomnet's rooms (R3's row pieces in rooms.js's slabs, and each slab's rest), at their centroids and floors;
// - edges: roomnet's own doors, stairs and rest stand-ins, and its no-floor joins inside one slab (not its hatches,
//   casings, trunks, lifts, plates, or no-floor joins between two slabs), plus what a walk needs and a space's water
//   does not:
//   - a row's own pieces joined;
//   - R3's doors between rows in different slabs;
//   - stairs across E deck;
//   - each slab's rest joined to its neighbour across her centreline, and across a bulkhead on a deck at or above
//     that bulkhead's top, or through one of its doors below it (C.BULKHEADS[i].doors: 'low' the tank top's, or a
//     deck's);
// - costs: a room crossed is the plan distance between its centroid and the opening's point [bet: straight]; a stair
//   adds its rise x STAIR. Each place is a node joined to its room; the nest by the foremast's ladder.
'use strict';
const fs = require('fs');
const path = require('path');
const C = require('../core/core.js');
const K = require('../core/readers/cabins.js');
const RN = require('../core/readers/roomnet.js');
const R = require('../core/readers/rooms.js');
const TS = require('../site/topsides.js');

const root = path.join(__dirname, '..');
const FILE = path.join(root, 'core', 'readers', 'places.js');
const STAIR = 1.6;        // a stair's walking length over its rise (a 38-degree stair) [bet]
const LADDER = 1.0;       // the foremast's ladder: its length over its rise [bet]
const WALKABLE = new Set(['door', 'stair', 'rest']);
const FLOORS = ['below G', 'G', 'F', 'E', 'D', 'C', 'B', 'A', 'Boat'];
const TOPS = 'the topsides note (docs/research/RESEARCH_topsides_dimensions_v1_2026-11-19.md)';
const RAIL = 14.1;        // m: the Boat deck's rail from her centreline (94 ft wide, +-14.3, the topsides note) [scaled]

// ---- the places: their source fields
const SPEC = [
  { key: 'bridge', name: 'the navigating bridge\'s front, on the centreline', deck: 'Boat', x: 72.5, y: 0, src: TOPS + ': the front +72.5 on the centreline, curving back to +69.6 at the wing cabs; BWC\'s "190 ft. from the bow" gives +72.7', tag: 'scaled' },
  { key: 'wing.port', name: 'the bridge\'s port wing cab', deck: 'Boat', x: 68.6, y: 14.7, src: TOPS + ': the wing cabs at +67.6 to +69.6, about 0.4 m beyond her side', tag: 'scaled' },
  { key: 'wing.stbd', name: 'the bridge\'s starboard wing cab', deck: 'Boat', x: 68.6, y: -14.7, src: TOPS + ': the wing cabs at +67.6 to +69.6, about 0.4 m beyond her side', tag: 'scaled' },
  { key: 'wheelhouse', name: 'the wheelhouse', deck: 'Boat', row: 'Bt-12', src: 'R3 Bt-12, its outline\'s centroid; ' + TOPS + ' gives +64.8 to +67.8', tag: 'read' },
  { key: 'chartroom', name: 'the chart room', deck: 'Boat', x: 63.0, y: 0, src: TOPS + ': "immediately abaft" the wheelhouse; one room deep [bet]', tag: 'bet' },
  { key: 'wireless', name: 'the Marconi room, with the silent room', deck: 'Boat', x: 48.0, y: 0, row: 'Bt-10', src: 'R3 Bt-10 names the silent room and the Marconi room; ' + TOPS + ' puts the Marconi rooms on the centreline abaft funnel 1\'s casing (+50.7 to +59.4). Its x is a bet: core/readers/world.js has 50 [bet], and Bride\'s "at the after end of the officers\' deckhouse" would be +36 to +40', tag: 'bet' },
  { key: 'nest', name: 'the crow\'s nest, its floor', deck: null, mast: 0, src: 'site/topsides.js\'s nestOf: the lookouts\' eye 29.0 m over her waterline at the night\'s drafts (BWC "about 95 ft." [read]), the floor 1.5 m under it, on the foremast\'s axis; reached by the mast\'s ladder from the forecastle deck [bet]', tag: 'derived' },
  { key: 'socket.stbd', name: 'the rocket socket in the starboard rail, by emergency boat No. 1', deck: 'Boat', x: 65.9, y: -RAIL, src: 'Boxhall: in the starboard rail by emergency boat No. 1 (core/readers/world.js) [read]; No. 1\'s davits at +65.72 and +66.18 (Read\'s davit article, via ' + TOPS + ') [read]; the socket between them [bet]', tag: 'bet' },
  { key: 'socket.port', name: 'a rocket socket in the port rail, by emergency boat No. 2', deck: 'Boat', x: 55.9, y: RAIL, src: 'a socket a side [bet]; No. 2\'s davits at +55.70 and +56.16 (Read\'s davit article, via ' + TOPS + ')', tag: 'bet' },
  { key: 'lamp', name: 'the Morse lamp', deck: 'Boat', x: 68.6, y: -14.7, src: 'NOT FOUND: taken at the bridge\'s starboard wing cab [bet]', tag: 'bet' },
  { key: 'platform', name: 'the reciprocating engines\' starting platform', deck: 'orlop', x: -29.0, y: 0, row: 'O-024', src: 'R3 O-024 names "its platforms"; at the engine room\'s forward end on the centreline, on its floor [bet]', tag: 'bet' },
  { key: 'stokehold.6', name: 'boiler room 6, its stokehold', deck: 'orlop', row: 'O-013', src: 'R3 O-013, its outline\'s centroid, on its floor', tag: 'read' },
  { key: 'stokehold.5', name: 'boiler room 5, its stokehold', deck: 'orlop', row: 'O-015', src: 'R3 O-015, its outline\'s centroid, on its floor', tag: 'read' },
  { key: 'stokehold.4', name: 'boiler room 4, its stokehold', deck: 'orlop', row: 'O-017', src: 'R3 O-017, its outline\'s centroid, on its floor', tag: 'read' },
  { key: 'stokehold.3', name: 'boiler room 3, its stokehold', deck: 'orlop', row: 'O-019', src: 'R3 O-019, its outline\'s centroid, on its floor', tag: 'read' },
  { key: 'stokehold.2', name: 'boiler room 2, its stokehold', deck: 'orlop', row: 'O-021', src: 'R3 O-021, its outline\'s centroid, on its floor', tag: 'read' },
  { key: 'stokehold.1', name: 'boiler room 1, its stokehold', deck: 'orlop', row: 'O-023', src: 'R3 O-023, its outline\'s centroid, on its floor', tag: 'read' },
  { key: 'postoffice', name: 'the post office (the sorting room), where the mail clerks worked', deck: 'G', row: 'G-018', src: 'R3 G-018, its outline\'s centroid', tag: 'read' },
  { key: 'mailroom', name: 'the mail room (the sorting room\'s store), under the post office', deck: 'orlop', row: 'O-010', src: 'R3 O-010, its outline\'s centroid', tag: 'read' },
];

function centroid(P) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length], w = p[0] * q[1] - q[0] * p[1]; a += w; cx += (p[0] + q[0]) * w; cy += (p[1] + q[1]) * w; }
  return Math.abs(a) < 1e-12 ? [P[0][0], P[0][1]] : [cx / (3 * a), cy / (3 * a)];
}
function inside(P, x, y) {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; }
  return c;
}
const flat = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const r2 = (v) => Math.round(v * 100) / 100, r1 = (v) => Math.round(v * 10) / 10;

// R3's tables, the index, the ship and roomnet's graph
function load() {
  const DIR = path.join(root, 'data', 'rooms');
  const T = fs.readdirSync(DIR).filter((f) => /_deck\.json$/.test(f)).sort().map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')));
  const I = K.index(T), ship = C.buildShip(), G = RN.graph(I, ship);
  return { I, ship, G };
}

// the room a point stands in: its slab by rooms.js, stepping in toward her centreline (then aft) while outside her;
// in that slab, the row whose outline holds the point (the place's own row first), else the slab's rest
function roomAt(G, ship, x, y, z, rowId) {
  let yy = Math.abs(y) < 0.3 ? 0.3 : y, xx = x, s = -1;
  for (let i = 0; i < 80 && s < 0; i++) {
    s = R.slabAt(ship, xx, yy, z + 0.3);
    if (s < 0) { if (Math.abs(yy) > 0.6) yy -= Math.sign(yy) * 0.25; else xx -= 0.25; }
  }
  if (s < 0) return null;
  const inSlab = G.rooms.filter((r) => r.slab === s && r.row && r.row.src && r.row.src.poly_m);
  const hit = inSlab.find((r) => r.row.id === rowId && inside(r.row.src.poly_m, xx, yy)) || inSlab.find((r) => inside(r.row.src.poly_m, xx, yy));
  return { k: hit ? hit.k : G.restOf[s], slab: s, at: [xx, yy] };
}

// ---- the places, derived
function derivePlaces(env) {
  const { I, ship, G } = env;
  return SPEC.map((sp) => {
    let x = sp.x, y = sp.y, z, deck = sp.deck, foot = null;
    if (sp.row && x === undefined) {
      const e = I.byId.get(sp.row);
      if (!e || !e.src.poly_m) throw new Error(sp.key + ': no R3 row ' + sp.row);
      [x, y] = centroid(e.src.poly_m);
    }
    if (sp.mast !== undefined) {
      const ax = TS.mastAxis(TS.N.masts[sp.mast]), ns = TS.nestOf(ax);
      x = ns.x; y = 0; z = ns.floor;
      foot = { x: ax.xAt(ax.zFoot), z: ax.zFoot };
    }
    // the room: for the nest, the one at the foremast's foot; else the one it stands in, on its deck (a deck that is no
    // floor there, as the orlop in the machinery spaces, stands on the room's own floor)
    // (the foremast's foot stands on the forecastle deck, her top there: its room is the one under that deck)
    const zStand = foot ? foot.z - 0.8 : C.deckZ(deck, x);
    const rm = roomAt(G, ship, foot ? foot.x : x, foot ? 0 : y, zStand, sp.row);
    if (!rm) throw new Error(sp.key + ': not inside her');
    const room = G.rooms[rm.k];
    if (!foot) z = G.noFloor(deck, room.zone) ? room.zDeck : C.deckZ(deck, x);
    const zone = C.zoneAt(x), side = r2(y) >= 0 ? 0 : 1;
    return { key: sp.key, name: sp.name, deck, x: r2(x), y: r2(y), z: r2(z), zone, side, row: room.row ? room.row.id : null, room: room.id, src: sp.src, tag: sp.tag, _k: rm.k, _foot: foot };
  });
}

// ---- the walking graph on roomnet's rooms
function walkGraph(env) {
  const { I, G } = env;
  const n = G.rooms.length, adj = Array.from({ length: n }, () => []);
  // every link climbs or descends the height between its two rooms' floors (a stair's, a deck's sheer, a row's step
  // from a floored zone to a stokehold's): counted in the climb, and in metres at STAIR
  const link = (a, b, flatM, how) => {
    if (a === b || a === undefined || b === undefined || a === null || b === null) return;
    const dz = Math.abs(G.rooms[a].zDeck - G.rooms[b].zDeck), w = flatM + dz * STAIR;
    adj[a].push([b, w, dz, how]); adj[b].push([a, w, dz, how]);
  };
  const xy = (k) => [G.rooms[k].x, G.rooms[k].y];
  const through = (a, b, p) => flat(xy(a), p) + flat(p, xy(b));
  // roomnet's own walkable edges; a no-floor join inside one slab is walkable too (a row on a deck that is no floor
  // there, as a stokehold on the orlop, is its slab's own volume, at its level), one between two slabs is not
  for (const e of G.edges) {
    if (!WALKABLE.has(e.kind) && !(e.kind === 'nofloor' && G.rooms[e.a].slab === G.rooms[e.b].slab)) continue;
    link(e.a, e.b, through(e.a, e.b, [e.x, e.y]), e.kind);
  }
  // a row's own pieces
  for (const [, ks] of G.ofRow) for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) link(ks[i], ks[j], flat(xy(ks[i]), xy(ks[j])), 'row');
  // R3's doors between rows in different slabs: the nearest pair of their pieces
  for (const e of I.rows) for (const d of (e.src && e.src.doors) || []) {
    const t = I.byId.get(d.to);
    if (!t || t === e || t.deck !== e.deck) continue;
    let best = null;
    for (const a of G.ofRow.get(e.id) || []) for (const b of G.ofRow.get(t.id) || []) { const w = flat(xy(a), xy(b)); if (!best || w < best[2]) best = [a, b, w]; }
    if (best) link(best[0], best[1], best[2], 'door');
  }
  // stairs, across E deck too
  const slabOf = new Map(G.T.list.map((s, i) => [s.zone + ':' + s.side + ':' + s.floor, i]));
  const roomOf = (e, s) => (G.ofRow.get(e.id) || []).find((k) => G.rooms[k].slab === s);
  for (const o of RN.overlaps(I)) {
    if (o.kind !== 'stair') continue;
    const a = roomOf(o.up, slabOf.get(o.zone + ':' + o.side + ':' + o.up.floor)), b = roomOf(o.down, slabOf.get(o.zone + ':' + o.side + ':' + o.down.floor));
    if (a === undefined || b === undefined) continue;
    link(a, b, through(a, b, [o.x, o.y]), 'stair');
  }
  // each slab's rest: across her centreline; across a bulkhead at or above its top, or through its doors below it
  const L = G.T.list, NS = L.length;
  for (let s = 0; s < NS; s++) for (let u = s + 1; u < NS; u++) {
    const S = L[s], U = L[u];
    if (S.floor !== U.floor) continue;
    const a = G.restOf[s], b = G.restOf[u];
    if (S.zone === U.zone && S.side !== U.side) { link(a, b, flat(xy(a), xy(b)), 'across'); continue; }
    if (S.side !== U.side || Math.abs(S.zone - U.zone) !== 1) continue;
    const bh = C.BULKHEADS[Math.min(S.zone, U.zone)];
    const open = FLOORS.indexOf(S.floor) >= FLOORS.indexOf(bh.top === 'D' || bh.top === 'E' ? bh.top : 'Boat');
    const door = (bh.doors || []).some((d) => d[0] === S.floor || (d[0] === 'low' && S.floor === 'below G'));
    if (open || door) link(a, b, flat(xy(a), xy(b)), open ? 'open' : 'wt door');
  }
  return adj;
}

// Dijkstra from one node: the shortest walk to every node, its climb, and the node before
function dijkstra(adj, src) {
  const n = adj.length, dist = new Float64Array(n).fill(Infinity), climb = new Float64Array(n), prev = new Int32Array(n).fill(-1), heap = [];
  const push = (d, v) => { heap.push([d, v]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  dist[src] = 0; push(0, src);
  while (heap.length) {
    const [d, u] = pop();
    if (d > dist[u]) continue;
    for (const [v, w, c] of adj[u]) { const nd = d + w; if (nd < dist[v] - 1e-9) { dist[v] = nd; climb[v] = climb[u] + c; prev[v] = u; push(nd, v); } }
  }
  return { dist, climb, prev };
}

// the places joined to the graph, and the walks between every two: WALK[a][b] = [m, climb] for a before b in SPEC
function deriveWalks(env, P) {
  const { G } = env;
  const adj = walkGraph(env).map((l) => l.slice());
  const base = adj.length;
  P.forEach((p, i) => {
    adj.push([]);
    const k = p._k, room = G.rooms[k];
    // a place to its room: the plan distance and the height between the place and the room's floor (the nest's by the
    // mast's ladder, from the floor under the forecastle deck)
    const c = Math.abs(p.z - room.zDeck);
    const w = p._foot ? flat([p._foot.x, 0], [room.x, room.y]) + c * LADDER : flat([p.x, p.y], [room.x, room.y]) + c * STAIR;
    adj[base + i].push([k, w, c, 'place']); adj[k].push([base + i, w, c, 'place']);
  });
  const WALK = {}, paths = {};
  P.forEach((p, i) => {
    const D = dijkstra(adj, base + i);
    WALK[p.key] = {};
    for (let j = i + 1; j < P.length; j++) {
      const t = base + j;
      WALK[p.key][P[j].key] = Number.isFinite(D.dist[t]) ? [r1(D.dist[t]), r2(D.climb[t])] : null;
      const via = [];
      for (let v = D.prev[t]; v >= 0 && v !== base + i; v = D.prev[v]) if (v < base) { const r = G.rooms[v], id = r.row ? r.row.id : 'rest ' + r.deck + ' z' + r.zone + (r.side ? 'S' : 'P'); if (via[via.length - 1] !== id) via.push(id); }
      paths[p.key + '>' + P[j].key] = via.reverse();
    }
  });
  return { WALK, paths };
}

// the two baked blocks as the library writes them
function blocks(P, WALK) {
  const pub = P.map((p) => { const o = Object.assign({}, p); delete o._k; delete o._foot; return o; });
  const placesText = '[\n' + pub.map((p) => '    ' + JSON.stringify(p)).join(',\n') + ',\n  ]';
  const walkText = '{\n' + Object.keys(WALK).map((a) => '    ' + JSON.stringify(a) + ': ' + JSON.stringify(WALK[a])).join(',\n') + ',\n  }';
  return { placesText, walkText };
}
const MARK = { pb: '/* PLACES BEGIN */', pe: '/* PLACES END */', wb: '/* WALK BEGIN */', we: '/* WALK END */' };
function bakedOf(src) {
  const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b); if (i < 0 || j < 0) throw new Error('no markers ' + a); return src.slice(i + a.length, j).trim(); };
  return { placesText: cut(MARK.pb, MARK.pe), walkText: cut(MARK.wb, MARK.we) };
}
function derive() {
  const env = load(), P = derivePlaces(env), W = deriveWalks(env, P);
  return Object.assign({ env, P }, W, blocks(P, W.WALK));
}

if (require.main === module) {
  const D = derive();
  for (const p of D.P) console.log(p.key.padEnd(12) + (p.deck || 'mast').padEnd(6) + ('x ' + p.x.toFixed(1)).padEnd(9) + ('y ' + p.y.toFixed(1)).padEnd(8) + ('z ' + p.z.toFixed(2)).padEnd(9) + ('zone ' + p.zone).padEnd(8) + (p.room).padEnd(22) + '[' + p.tag + ']');
  const none = [];
  for (const a of Object.keys(D.WALK)) for (const b of Object.keys(D.WALK[a])) if (!D.WALK[a][b]) none.push(a + '>' + b);
  console.log('walks: ' + Object.keys(D.paths).length + ' pairs; with no walk: ' + (none.length ? none.slice(0, 12).join(' ') + (none.length > 12 ? ' ...' : '') : 'none'));
  const src = fs.readFileSync(FILE, 'utf8'), old = bakedOf(src);
  const same = old.placesText === D.placesText && old.walkText === D.walkText;
  if (process.argv.includes('--write')) {
    const out = src.replace(MARK.pb + ' ' + old.placesText + ' ' + MARK.pe, MARK.pb + ' ' + D.placesText + ' ' + MARK.pe).replace(MARK.wb + ' ' + old.walkText + ' ' + MARK.we, MARK.wb + ' ' + D.walkText + ' ' + MARK.we);
    if (out === src && !same) throw new Error('the markers were not replaced: keep one space each side of the block');
    fs.writeFileSync(FILE, out);
    console.log('written: ' + FILE + (same ? ' (no change)' : ''));
  } else console.log('the baked blocks ' + (same ? 'are current' : 'differ (run with --write)'));
}
module.exports = { SPEC, STAIR, LADDER, derive, derivePlaces, deriveWalks, walkGraph, dijkstra, bakedOf, blocks, load, roomAt, centroid, inside };
