/*
 * NH6, stage 1: her rooms as the flooding network, at level 0. The design and every choice below:
 * docs/DESIGN_her_rooms_as_the_flooding_network_v1_2026-11-23.md.
 *
 * Inside each of the core's 64 spaces it shares the space's water among the space's rooms: R3's rows, read from the
 * deck plans (data/rooms, through core/readers/cabins.js's index), each cut into its pieces by the model's zones, sides
 * and decks, and each slab's rest (what no row covers). The rooms are joined by the openings the plans give: the doors
 * a row names, and the stairs, hatches, lifts, trunks and casings that pass a deck; where the plans give none, by
 * stand-ins, each named below and in the design. The law is hydrostatic and history-free (the design, section 6): the
 * space's own water (sim.vol) fills its rooms from the lowest up, each room joining the water when its level reaches
 * the lowest opening by which the water can reach it. The water is shared exactly; the pockets' water (W6's bunker,
 * G7's tank) is kept apart, as rooms.js keeps it.
 *
 *   graph(I, ship, opt)      the rooms and openings of every space, for cabins.js's index I (cached by I, ship, opt)
 *   share(G, sim, opt)       every space's rooms now: water (m3), level (world, m; NaN while dry), each slab's sum
 *   pour(rooms, edges, V, r0)   the law on one space, the rooms given as capacity functions (the hand-worked test)
 *   ofRow(G, id)             a row's rooms (its pieces), by the row's id
 *   depthAt(G, res, k, sim)  room k's depth over its deck at its place
 *   track(G, opt), observe(tr, G, res, sim)   a run's first-wet time per room (the caller's plain data)
 *
 * Options: sill (m over the deck, a door's sill, BET.sill [bet]), coaming (a hatch's, BET.coaming [bet]), open (every
 * opening at the bottom of its rooms and every plate open: the open floor, rooms.js's own sharing, the identity test).
 *
 * The stand-ins (the design, section 4): a passage, and a row that names no door to a row of its slab, open to the
 * slab's rest at the row's deck; a set of rooms with doors only among themselves opens to the rest the same way; every
 * plate inside a space opens at its highest point (once the deck under it is pressed full the water passes it, by the
 * openings the plans do not show); a deck is no floor in a zone where all its rows there are casings, bunkers or
 * machinery (R3: G deck is no floor between bulkheads E and K, the orlop none between D and M), and its plate is open.
 *
 * A library, as rooms.js and cabins.js are: no state, no reader registered, nothing written into a sim or the tables;
 * its caches are keyed by the index and the ship, outside the sim; a track is the caller's plain data. So no fingerprint
 * can move and the forecast never meets it (tools/roomnet_tests.js). It reads rooms.js's table (the column pieces of
 * every slab) and mirrors its column cut; a change to that cut needs the same change here, and the suite's identity row
 * catches one. rooms.js is found when first wanted: the build bundles core/readers/ in name order, this file before it.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../core.js'), function () { return require('./rooms.js'); });
  else root.TitanicRoomNet = factory(root.TitanicCore, function () { return root.TitanicRooms; });
})(typeof self !== 'undefined' ? self : this, function (C, roomsLib) {
  'use strict';
  if (!C) return null;
  const R = () => roomsLib();
  const DECKS = ['orlop', 'G', 'F', 'E', 'D', 'C', 'B', 'A', 'Boat'];   // keel up, as R3's tables
  const VERTICAL = ['stair', 'hatch', 'lift', 'trunk', 'casing'];      // rows that pass a deck
  const NOFLOOR = ['casing', 'bunker', 'machinery'];                   // a deck of only these in a zone is no floor there
  const BET = {
    sill: 0,          // m over the deck: a door's sill [bet: no source read gives one; R3 reads none but two stairs' 6 in]
    coaming: 0,       // m over the deck: a hatch's coaming [bet: none read]
    minOverlap: 0.5,  // m2: rows on two decks overlapping less than this in plan are not joined by a vertical row [bet]
    minPiece: 0.5,    // m2: a row's piece smaller than this in a slab is left to the slab's rest [bet]
  };
  const WET = 0.01;   // m [bet], as cabins.js's: a room is wet once its water would stand this deep over its floor
  const GRID = 0.25;  // m: the plan grid on which rows on two decks are overlapped
  const ZB = [Infinity].concat(C.BULKHEADS.map((b) => b.x), [-Infinity]);
  const gcache = new WeakMap(), ocache = new WeakMap();

  // ------------------------------------------------------------ plane geometry
  function clip(P, f) {
    const out = [];
    for (let i = 0; i < P.length; i++) {
      const p = P[i], q = P[(i + 1) % P.length], fp = f(p), fq = f(q);
      if (fp >= 0) out.push(p);
      if ((fp >= 0) !== (fq >= 0)) { const u = fp / (fp - fq); out.push([p[0] + u * (q[0] - p[0]), p[1] + u * (q[1] - p[1])]); }
    }
    return out;
  }
  function area(P) { let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a) / 2; }
  function centroid(P) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length], c = p[0] * q[1] - q[0] * p[1]; a += c; cx += (p[0] + q[0]) * c; cy += (p[1] + q[1]) * c; }
    return Math.abs(a) > 1e-9 ? [cx / (3 * a), cy / (3 * a)] : null;
  }
  function rectArea(P, x0, x1, y0, y1) {
    let Q = clip(P, (v) => v[0] - x0);
    Q = clip(Q, (v) => x1 - v[0]); Q = clip(Q, (v) => v[1] - y0); Q = clip(Q, (v) => y1 - v[1]);
    return Q.length >= 3 ? area(Q) : 0;
  }
  const polyOf = (e) => (e.src && e.src.poly_m ? e.src.poly_m.map((v) => [v[0], v[1]]) : []);
  // the rows of two neighbouring decks that overlap in plan, where one of them passes the deck: on a grid of GRID m,
  // each overlap's cells grouped by the model's zone and side (one opening a group), for one index
  function overlaps(I) {
    let O = ocache.get(I);
    if (O) return O;
    const cells = new Map();
    for (const e of I.rows) {
      const P = polyOf(e), S = new Map();
      if (P.length >= 3) {
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
        for (const [x, y] of P) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        for (let i = Math.floor(x0 / GRID); i <= Math.ceil(x1 / GRID); i++) for (let j = Math.floor(y0 / GRID); j <= Math.ceil(y1 / GRID); j++) {
          const px = (i + 0.5) * GRID, py = (j + 0.5) * GRID;
          let inside = false;
          for (let a = 0, b = P.length - 1; a < P.length; b = a++) { const A = P[a], B = P[b]; if ((A[1] > py) !== (B[1] > py) && px < (B[0] - A[0]) * (py - A[1]) / (B[1] - A[1]) + A[0]) inside = !inside; }
          if (inside) S.set(i + ',' + j, [px, py]);
        }
      }
      cells.set(e, S);
    }
    O = [];
    for (let d = 1; d < DECKS.length; d++) {
      const up = I.rows.filter((e) => e.deck === DECKS[d]), dn = I.rows.filter((e) => e.deck === DECKS[d - 1]);
      for (const a of up) for (const b of dn) {
        if (VERTICAL.indexOf(a.kind) < 0 && VERTICAL.indexOf(b.kind) < 0) continue;
        const A = cells.get(a), B = cells.get(b);
        if (!A.size || !B.size) continue;
        const groups = new Map();
        for (const [key, p] of A) {
          if (!B.has(key)) continue;
          const g = C.zoneAt(p[0]) + ':' + (p[1] >= 0 ? 0 : 1);
          const s = groups.get(g) || { n: 0, x: 0, y: 0 };
          s.n++; s.x += p[0]; s.y += p[1];
          groups.set(g, s);
        }
        for (const [g, s] of groups) if (s.n * GRID * GRID >= BET.minOverlap) {
          const [zone, side] = g.split(':').map(Number);
          O.push({ up: a, down: b, zone, side, x: s.x / s.n, y: s.y / s.n, area: s.n * GRID * GRID, kind: VERTICAL.indexOf(a.kind) >= 0 ? a.kind : b.kind });
        }
      }
    }
    ocache.set(I, O);
    return O;
  }

  // ------------------------------------------------------------ the graph
  // A room is a list of sub-pieces: a column piece q of rooms.js's table (in the room's slab), the share f of the
  // column's plan the room covers, and the band [lo, hi] of the column it holds (its slab's, or from the orlop deck up
  // for an orlop row where the orlop is a floor). Every column piece's shares, its rooms' and its rest's, add up to the
  // whole piece: so a slab's rooms hold exactly the slab's columns, and a space's its columns.
  function graph(I, ship, opt) {
    opt = Object.assign({}, BET, opt || {});
    const key = JSON.stringify([opt.sill, opt.coaming, opt.minOverlap, opt.minPiece, !!opt.open]);
    let byShip = gcache.get(I);
    if (!byShip) { byShip = new WeakMap(); gcache.set(I, byShip); }
    let byKey = byShip.get(ship);
    if (!byKey) { byKey = new Map(); byShip.set(ship, byKey); }
    if (byKey.has(key)) return byKey.get(key);
    const T = R().table(ship), c = ship.cols, NS = T.list.length, NQ = T.col.length;
    const Q = T.list.map(() => []);
    for (let q = 0; q < NQ; q++) Q[T.slab[q]].push(q);
    // which decks are no floor in which zone
    const kinds = new Map();
    for (const e of I.rows) for (const p of e.pieces) {
      if (p.slab < 0) continue;
      const k = e.deck + ':' + p.zone;
      if (!kinds.has(k)) kinds.set(k, new Set());
      kinds.get(k).add(e.kind);
    }
    const noFloor = (deck, zone) => { const s = kinds.get(deck + ':' + zone); return !!s && [...s].every((k) => NOFLOOR.indexOf(k) >= 0); };
    // each row's shares of the column pieces of its deck's slabs, its 'minus' rows taken out
    const shares = new Map();
    for (const e of I.rows) {
      const P = polyOf(e), m = new Map();
      shares.set(e, m);
      if (P.length < 3 || area(P) < 1e-9) continue;
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const [x, y] of P) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      for (const s of T.list) {
        if (s.floor !== e.floor) continue;
        for (const q of Q[s.id]) {
          const i = T.col[q], hx = 0.5 * c.dx[i], hy = 0.5 * c.dy;
          if (c.x[i] + hx < x0 || c.x[i] - hx > x1 || c.y[i] + hy < y0 || c.y[i] - hy > y1) continue;
          const a = rectArea(P, c.x[i] - hx, c.x[i] + hx, c.y[i] - hy, c.y[i] + hy);
          if (a > 1e-9) m.set(q, a / (c.dx[i] * c.dy));
        }
      }
    }
    for (const e of I.rows) for (const id of (e.src && e.src.minus) || []) {
      const b = I.byId.get(id), m = shares.get(e);
      if (!b || !shares.get(b)) continue;
      for (const [q, f] of shares.get(b)) if (m.has(q)) m.set(q, Math.max(0, m.get(q) - f));
    }
    // where R3's rows cover a column piece past its plan (rows overlapping beyond 'minus'), each row's share is scaled
    // down to fit [stand-in]
    const sum = new Float64Array(NQ);
    for (const [, m] of shares) for (const [q, f] of m) sum[q] += f;
    let overlapping = 0;
    for (let q = 0; q < NQ; q++) if (sum[q] > 1 + 1e-9) overlapping++;
    const fit = (q, f) => (sum[q] > 1 ? f / sum[q] : f);
    const bandOf = (e, q) => (e.deck === 'orlop' && !noFloor('orlop', T.list[T.slab[q]].zone)) ? [Math.max(T.lo[q], C.deckZ('orlop', c.x[T.col[q]])), T.hi[q]] : [T.lo[q], T.hi[q]];
    const restSub = Array.from({ length: NS }, () => ({ q: [], f: [], lo: [], hi: [] }));
    const toRest = (q, f, lo, hi) => { if (f > 1e-15 && hi > lo + 1e-12) { const r = restSub[T.slab[q]]; r.q.push(q); r.f.push(f); r.lo.push(lo); r.hi.push(hi); } };
    // each column piece's plan that no row covers
    for (let q = 0; q < NQ; q++) toRest(q, 1 - Math.min(1, sum[q]), T.lo[q], T.hi[q]);
    // each row's pieces by slab; a piece under minPiece m2 goes to its slab's rest, and so does the hold under an
    // orlop row's floor
    const rowRooms = [];
    for (const e of I.rows) {
      const bySlab = new Map();
      for (const [q, f0] of shares.get(e)) {
        const f = fit(q, f0);
        if (!(f > 0)) continue;
        if (!bySlab.has(T.slab[q])) bySlab.set(T.slab[q], []);
        bySlab.get(T.slab[q]).push([q, f]);
      }
      for (const [s, list] of bySlab) {
        let a = 0;
        for (const [q, f] of list) a += f * c.dxdy[T.col[q]];
        const sub = { q: [], f: [], lo: [], hi: [] };
        for (const [q, f] of list) {
          const [lo, hi] = bandOf(e, q);
          toRest(q, f, T.lo[q], Math.min(lo, T.hi[q]));
          if (a < opt.minPiece) toRest(q, f, lo, hi);
          else if (hi > lo + 1e-12) { sub.q.push(q); sub.f.push(f); sub.lo.push(lo); sub.hi.push(hi); }
        }
        if (a >= opt.minPiece && sub.q.length) rowRooms.push({ e, s, sub });
      }
    }
    // the rooms
    const rooms = [], bySpace = Array.from({ length: C.NN }, () => []), restOf = new Int32Array(NS).fill(-1), ofRowMap = new Map();
    const lowestLo = (sub) => { let z = Infinity; for (const v of sub.lo) if (v < z) z = v; return z === Infinity ? 0 : z; };
    const mkRoom = (kind, e, s, sub) => {
      const k = rooms.length, sl = T.list[s];
      const room = {
        k, kind, row: e || null, id: (e ? e.id : 'rest') + '@' + sl.key, n: sl.n, slab: s, zone: sl.zone, side: sl.side, deck: e ? e.deck : sl.floor,
        q: Int32Array.from(sub.q), f: Float64Array.from(sub.f), lo: Float64Array.from(sub.lo), hi: Float64Array.from(sub.hi), plan: 0, x: 0, y: 0, zDeck: 0,
      };
      let a = 0, mx = 0, my = 0;
      for (let j = 0; j < room.q.length; j++) { const i = T.col[room.q[j]], w = room.f[j] * c.dxdy[i]; a += w; mx += w * c.x[i]; my += w * c.y[i]; }
      room.plan = a;
      let xy = a > 0 ? [mx / a, my / a] : [0, 0];
      if (e) {   // a row's place: the centroid of its outline in this zone and on this side, as cabins.js's
        let P = polyOf(e);
        P = clip(P, (v) => ZB[sl.zone] - v[0]); P = clip(P, (v) => v[0] - ZB[sl.zone + 1]); P = clip(P, (v) => (sl.side === 0 ? v[1] : -v[1]));
        const cc = P.length >= 3 ? centroid(P) : null;
        if (cc) xy = cc;
      }
      room.x = xy[0]; room.y = xy[1];
      const floorDeck = e ? e.deck : sl.floor;
      room.zDeck = floorDeck === 'below G' || (floorDeck === 'orlop' && noFloor('orlop', sl.zone)) ? lowestLo(sub) : C.deckZ(floorDeck, xy[0]);
      rooms.push(room); bySpace[sl.n].push(k);
      if (e) { if (!ofRowMap.has(e.id)) ofRowMap.set(e.id, []); ofRowMap.get(e.id).push(k); }
      return k;
    };
    for (const { e, s, sub } of rowRooms) mkRoom('row', e, s, sub);
    for (let s = 0; s < NS; s++) restOf[s] = mkRoom('rest', null, s, restSub[s]);
    // ---- the openings, each { a, b, kind, x, y, z }: z its sill in the ship frame (-Infinity: always open), or pts
    // for a plate (its sill the plate's highest point at the pose)
    const edges = [], seen = new Set();
    const addEdge = (a, b, kind, x, y, z, more) => {
      if (a === b || a === undefined || b === undefined) return;
      const id = Math.min(a, b) + ':' + Math.max(a, b) + ':' + kind;
      if (seen.has(id)) return;
      seen.add(id);
      edges.push(Object.assign({ a, b, kind, x, y, z }, more || {}));
    };
    const roomOf = (e, s) => (ofRowMap.get(e.id) || []).find((k) => rooms[k].slab === s);
    const doored = new Set();
    // the doors a row names to a row of its own deck, in each slab the two share (R3 writes each door once, so both
    // directions come from either row's list)
    for (const e of I.rows) for (const d of (e.src && e.src.doors) || []) {
      const t = I.byId.get(d.to);
      if (!t || t === e || t.deck !== e.deck) continue;
      for (const k of ofRowMap.get(e.id) || []) {
        const kt = roomOf(t, rooms[k].slab);
        if (kt === undefined) continue;
        const x = 0.5 * (rooms[k].x + rooms[kt].x), y = 0.5 * (rooms[k].y + rooms[kt].y);
        addEdge(k, kt, 'door', x, y, (e.deck === 'orlop' && noFloor('orlop', rooms[k].zone) ? rooms[k].zDeck : C.deckZ(e.deck, x)) + opt.sill, { door: d.kind || 'door', atLow: true, sill: opt.sill });
        doored.add(k); doored.add(kt);
      }
    }
    // a row that passes a deck, where it overlaps a row of the deck below in one space: an opening in the upper deck
    const slabOf = new Map(T.list.map((s) => [s.zone + ':' + s.side + ':' + s.floor, s]));
    for (const o of overlaps(I)) {
      const sUp = slabOf.get(o.zone + ':' + o.side + ':' + o.up.floor), sDn = slabOf.get(o.zone + ':' + o.side + ':' + o.down.floor);
      if (!sUp || !sDn || sUp.n !== sDn.n || sUp.id === sDn.id) continue;   // across E deck: two spaces, the core's own
      addEdge(roomOf(o.up, sUp.id), roomOf(o.down, sDn.id), o.kind, o.x, o.y, C.deckZ(o.up.deck, o.x) + (o.kind === 'hatch' ? opt.coaming : 0), { area: o.area });
    }
    // the orlop's own vertical rows open to the hold under it (its slab's rest)
    for (const e of I.rows) if (e.deck === 'orlop' && VERTICAL.indexOf(e.kind) >= 0) for (const k of ofRowMap.get(e.id) || []) addEdge(k, restOf[rooms[k].slab], e.kind, rooms[k].x, rooms[k].y, rooms[k].zDeck + (e.kind === 'hatch' ? opt.coaming : 0));
    // stand-ins: a passage, and a row with no door to a row of its slab, open to the rest at its deck; a row on a deck
    // that is no floor there is the space's own volume (always open)
    for (const r of rooms) {
      if (r.kind !== 'row') continue;
      const nf = noFloor(r.deck, r.zone);
      if (nf || r.row.kind === 'passage' || !doored.has(r.k)) addEdge(r.k, restOf[r.slab], nf ? 'nofloor' : 'rest', r.x, r.y, nf ? -Infinity : r.zDeck, { standIn: true, atLow: true, sill: 0 });
    }
    // the plates inside a space: open where the deck over them is no floor; else open at their highest point
    for (let n = 0; n < C.NN; n++) {
      const ids = T.byNode[n];
      for (let j = 0; j + 1 < ids.length; j++) {
        const lower = ids[j], upper = ids[j + 1], su = T.list[upper];
        if ((su.floor === 'G' || su.floor === 'F') && noFloor(su.floor, su.zone)) { addEdge(restOf[lower], restOf[upper], 'nofloor', 0, 0, -Infinity, { standIn: true }); continue; }
        const pts = [];
        for (const q of Q[upper]) { const i = T.col[q]; pts.push(c.x[i], c.y[i], T.lo[q]); }
        addEdge(restOf[lower], restOf[upper], 'plate', 0, 0, NaN, { standIn: true, pts: Float64Array.from(pts) });
      }
    }
    // a set of rooms joined only among themselves on their deck (doors to each other, none to a passage or the rest,
    // whatever stairs lead from them) opens to its slab's rest at its own lowest point [stand-in]: within a slab, every
    // room reaches the rest by the slab's own openings
    const bySlab = Array.from({ length: NS }, () => []);
    for (const r of rooms) bySlab[r.slab].push(r.k);
    for (let s = 0; s < NS; s++) {
      const adj = new Map(bySlab[s].map((k) => [k, []]));
      for (const ed of edges) if (rooms[ed.a].slab === s && rooms[ed.b].slab === s) { adj.get(ed.a).push(ed.b); adj.get(ed.b).push(ed.a); }
      const seenK = new Set([restOf[s]]), stack = [restOf[s]];
      while (stack.length) { const u = stack.pop(); for (const v of adj.get(u)) if (!seenK.has(v)) { seenK.add(v); stack.push(v); } }
      for (const k of bySlab[s]) if (!seenK.has(k)) addEdge(k, restOf[s], 'rest', rooms[k].x, rooms[k].y, rooms[k].zDeck, { standIn: true, closed: true, atLow: true, sill: 0 });
    }
    const edgesBySpace = Array.from({ length: C.NN }, () => []);
    edges.forEach((ed, j) => edgesBySpace[rooms[ed.a].n].push(j));
    const G = { I, ship, opt, T, rooms, bySpace, restOf, edges, edgesBySpace, ofRow: ofRowMap, overlapping, noFloor };
    byKey.set(key, G);
    return G;
  }

  // ------------------------------------------------------------ the law on one space
  // rooms: [{ cap(h) -> [v, dv/dh], low, top }] in world heights; edges: [{ a, b, sill }] (world; -Infinity: open);
  // V: the space's water (m3); r0: the room the water starts in (the lowest). Each room joins the water at its joining
  // level: over the paths from r0, the lowest of the highest sill on the path (a minimax path; r0's is its own lowest
  // point). The rooms that have joined stand at one level. When the water stands exactly at a joining level, the rooms
  // joining there take what is left as one pool at a common level under it. Returns per room its level (NaN while dry)
  // and water, the pool's level, and how many rooms have joined.
  function pour(rooms, edges, V, r0, rTop) {
    const N = rooms.length, lam = new Float64Array(N).fill(Infinity), done = new Uint8Array(N);
    const water = new Float64Array(N), level = new Float64Array(N).fill(NaN);
    if (!(V > 0) || !N) return { level, water, pool: NaN, joined: 0, lam };
    const adj = Array.from({ length: N }, () => []);
    for (const e of edges) { adj[e.a].push([e.b, e.sill]); adj[e.b].push([e.a, e.sill]); }
    lam[r0] = rooms[r0].low;
    for (;;) {
      let u = -1;
      for (let i = 0; i < N; i++) if (!done[i] && lam[i] < Infinity && (u < 0 || lam[i] < lam[u])) u = i;
      if (u < 0) break;
      done[u] = 1;
      for (const [v, s] of adj[u]) { const l = s > lam[u] ? s : lam[u]; if (l < lam[v]) lam[v] = l; }
    }
    const order = [];
    for (let i = 0; i < N; i++) if (lam[i] < Infinity) order.push(i);
    order.sort((a, b) => lam[a] - lam[b] || a - b);
    const capOf = (set, h) => { let v = 0, a = 0; for (const i of set) { const r = rooms[i].cap(h); v += r[0]; a += r[1]; } return [v, a]; };
    const lowOf = (set) => { let z = Infinity; for (const i of set) if (rooms[i].low < z) z = rooms[i].low; return z; };
    const topOf = (set) => { let z = -Infinity; for (const i of set) if (rooms[i].top > z) z = rooms[i].top; return z; };
    const solve = (set, target, lo, hi) => {   // the level in [lo, hi] at which the set holds target (it holds less at lo)
      let L = lo + 0.5 * (hi - lo);
      for (let it = 0; it < 200; it++) {
        const [v, a] = capOf(set, L), d = target - v;
        if (Math.abs(d) <= 1e-12 * Math.max(1, target) || hi - lo <= 1e-12) break;
        if (d > 0) lo = L; else hi = L;
        const Ln = a > 0 ? L + d / a : NaN;
        L = Ln > lo && Ln < hi ? Ln : 0.5 * (lo + hi);
      }
      return L;
    };
    const fill = (set, h) => { for (const k of set) { water[k] = rooms[k].cap(h)[0]; level[k] = h; } };
    let pool = [], i = 0;
    while (i < order.length) {
      const lk = lam[order[i]], group = [];
      while (i < order.length && lam[order[i]] === lk) group.push(order[i++]);
      if (pool.length) {
        const before = capOf(pool, lk)[0];
        if (V < before) { i -= group.length; break; }          // the water stands under this joining level
        const after = before + capOf(group, lk)[0];
        if (V < after) {                                       // it stands at it: the joining rooms share what is left
          fill(pool, lk);
          const h = solve(group, V - before, Math.min(lowOf(group), lk), lk);
          fill(group, h);
          return finish(water, level, V, lk, pool.length + group.length, lam);
        }
      }
      pool = pool.concat(group);
    }
    const next = i < order.length ? lam[order[i]] : Infinity, top = topOf(pool), hi = Math.min(next, top);
    if (next === Infinity && V >= capOf(pool, top)[0]) {     // every room full: what is over goes on rTop, or the highest
      fill(pool, top);
      let tk = pool[0];
      for (const k of pool) if (rooms[k].top > rooms[tk].top) tk = k;
      if (rTop !== undefined && rTop >= 0) tk = rTop;
      let got = 0;
      for (const k of pool) got += water[k];
      water[tk] += V - got;
      return { level, water, pool: top, joined: pool.length, lam };
    }
    const h = solve(pool, V, lowOf(pool), hi);
    fill(pool, h);
    return finish(water, level, V, h, pool.length, lam);
  }
  // the last trace of difference to the room the surface stands in (never more than rounding), as rooms.js does
  function finish(water, level, V, h, joined, lam) {
    let got = 0, s = -1;
    for (let k = 0; k < water.length; k++) { got += water[k]; if (water[k] > 0) s = k; }
    if (s >= 0 && got !== V) water[s] += V - got;
    return { level, water, pool: h, joined, lam };
  }

  // ------------------------------------------------------------ every space now
  // room's water below the world level h at the pose F: rooms.js's column cut on the room's sub-pieces
  function capFn(T, c, mu, room, F) {
    const nq = room.q.length, b = new Float64Array(nq), w = new Float64Array(nq);
    let low = Infinity, top = -Infinity;
    for (let j = 0; j < nq; j++) {
      const i = T.col[room.q[j]];
      b[j] = F.R20 * c.x[i] + F.R21 * c.y[i] + F.tz;
      w[j] = room.f[j] * mu * c.dxdy[i];
      const z0 = b[j] + F.R22 * room.lo[j], z1 = b[j] + F.R22 * room.hi[j];
      if (z0 < low) low = z0;
      if (z1 > top) top = z1;
    }
    return {
      low, top,
      cap(h) {
        let v = 0, a = 0;
        for (let j = 0; j < nq; j++) {
          const zc = (h - b[j]) / F.R22;
          if (zc <= room.lo[j]) continue;
          if (zc < room.hi[j]) { v += w[j] * (zc - room.lo[j]); a += w[j] / F.R22; } else v += w[j] * (room.hi[j] - room.lo[j]);
        }
        return [v, a];
      },
    };
  }
  function share(G, sim, opt) {
    opt = opt || {};
    const T = G.T, c = sim.ship.cols, F = sim._F || C.frameOf(sim);
    const water = new Float64Array(G.rooms.length), level = new Float64Array(G.rooms.length).fill(NaN);
    const spaces = new Array(C.NN), only = opt.spaces ? new Set(opt.spaces) : null;
    for (let n = 0; n < C.NN; n++) {
      if (only && !only.has(n)) continue;
      const ks = G.bySpace[n], loc = new Map(ks.map((k, j) => [k, j]));
      const caps = ks.map((k) => capFn(T, c, sim.ship.nodeMu[n], G.rooms[k], F));
      const E = [];
      for (const j of G.edgesBySpace[n]) {
        const e = G.edges[j];
        let sill;
        if (G.opt.open || e.z === -Infinity) sill = -Infinity;
        else if (e.kind === 'plate') { sill = -Infinity; for (let p = 0; p < e.pts.length; p += 3) { const z = F.R20 * e.pts[p] + F.R21 * e.pts[p + 1] + F.R22 * e.pts[p + 2] + F.tz; if (z > sill) sill = z; } }
        else if (e.atLow) {
          // on one deck, where the plans give no place: a door at the higher of its two rooms' lowest floor points; an
          // opening to the slab's rest (gaps all over the deck) beside its row, at the row's own lowest point
          const la = caps[loc.get(e.a)].low, lb = e.kind === 'rest' ? -Infinity : caps[loc.get(e.b)].low;
          sill = Math.max(la === Infinity ? -Infinity : la, lb === Infinity ? -Infinity : lb) + e.sill * F.R22;
        } else sill = F.R20 * e.x + F.R21 * e.y + F.R22 * e.z + F.tz;
        E.push({ a: loc.get(e.a), b: loc.get(e.b), sill });
      }
      let r0 = 0;
      for (let j = 1; j < caps.length; j++) if (caps[j].low < caps[r0].low) r0 = j;
      const V = sim.vol[n] > 0 ? sim.vol[n] : 0, top = loc.get(G.restOf[T.byNode[n][T.byNode[n].length - 1]]);
      let res;
      if (V >= sim.ship.nodeVmax[n]) {
        // full or pressed up, as rooms.js has it: every room full, and what is over on the space's top slab (its rest)
        res = { water: new Float64Array(ks.length), level: new Float64Array(ks.length), pool: NaN, joined: ks.length };
        let got = 0;
        caps.forEach((cp, j) => { res.water[j] = cp.cap(cp.top)[0]; res.level[j] = cp.top; got += res.water[j]; });
        res.water[top] += V - got;
      } else res = pour(caps, E, V, r0, top);
      ks.forEach((k, j) => { water[k] = res.water[j]; level[k] = res.level[j]; });
      spaces[n] = { n, V, pool: res.pool, joined: res.joined, rooms: ks.length };
    }
    // each slab's sum, with its space's pockets' water as far as each holds in the space's lowest slab (as rooms.js)
    const slabs = new Float64Array(T.list.length);
    G.rooms.forEach((r, k) => { slabs[r.slab] += water[k]; });
    for (const p of sim.pockets || []) {
      const held = Math.min(p.vol, p.cap);
      if (!(held > 0)) continue;
      const put = (n, v) => { const ids = T.byNode[n]; if (ids && ids.length) slabs[ids[0]] += v; };
      if (p.side < 0) { put(p.node, 0.5 * held); put(p.node - 2, 0.5 * held); } else put(p.node, held);
    }
    return { water, level, spaces, slabs, F };
  }

  // ------------------------------------------------------------ reading a room
  function ofRow(G, id) { return G.ofRow.get(id) || []; }
  function depthAt(G, res, k, sim) {
    const r = G.rooms[k], F = res.F, L = res.level[k], T = G.T, c = sim.ship.cols;
    let best = -1, d2 = Infinity;
    for (let j = 0; j < r.q.length; j++) { const i = T.col[r.q[j]], dx = c.x[i] - r.x, dy = c.y[i] - r.y, d = dx * dx + dy * dy; if (d < d2) { d2 = d; best = j; } }
    const head = best >= 0 ? r.hi[best] - r.zDeck : 0;
    if (!(L === L)) return { depth: 0, dry: true, full: false, head };
    const zw = (L - (F.R20 * r.x + F.R21 * r.y + F.tz)) / F.R22, d = Math.min(Math.max(zw - r.zDeck, 0), head);
    return { depth: d, dry: false, full: d >= head - 1e-9, head };
  }
  function track(G, opt) {
    const wet = opt && opt.wet != null ? opt.wet : WET, n = G.rooms.length, thr = new Array(n), t = new Array(n), step = new Array(n);
    for (let k = 0; k < n; k++) { thr[k] = wet * G.rooms[k].plan * G.ship.nodeMu[G.rooms[k].n]; t[k] = null; step[k] = null; }
    return { v: 1, wet, rooms: n, thr, t, step, calls: 0 };
  }
  function observe(tr, G, res, sim) {
    const k0 = sim.night ? sim.night.k : Math.round(sim.t / sim.params.dt);
    for (let k = 0; k < tr.rooms; k++) if (tr.t[k] === null && tr.thr[k] > 0 && res.water[k] >= tr.thr[k]) { tr.t[k] = sim.t; tr.step[k] = k0; }
    tr.calls++;
    return tr;
  }

  return { DECKS, VERTICAL, NOFLOOR, BET, WET, graph, pour, share, ofRow, depthAt, track, observe, overlaps };
});
