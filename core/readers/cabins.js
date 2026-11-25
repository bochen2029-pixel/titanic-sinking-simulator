/*
 * NH2: her rooms, and when the water came (the cabin view). The headless library of
 * docs/BRAINSTORM_the_next_horizon_v1_2026-11-23.md, section 3, NH2; the page's part follows in the page's own lane (Z2).
 *
 * It joins R3's tables of her rooms (data/rooms/<deck>_deck.json, read from the deck plans: each row a room, or a block
 * of rooms between passages, with its stateroom numbers listed in its `plan` and each of its pieces placed in the
 * model's zone, side and slab) to core/readers/rooms.js's slabs, and through them to a run's water.
 *
 *   index(tables)          the rows of the decks given (each deck's table as parsed JSON, in any order; a table that is
 *                          not a deck's, as openings.json, is passed over), by id, by stateroom number and by name.
 *                          A list of the people in her staterooms (table 'occupants', as data/rooms/occupants_1912.json:
 *                          the Cave list's first class) puts each line's names on the rows its staterooms resolve to
 *                          (each row's people: { labels, cabin, names, n, list }); I.people counts its lines and names
 *                          and keeps those not placed, with why
 *   named(I, text)         the people whose names hold every word of the text ("astor"), each with its row, its
 *                          staterooms and its line in its list, the best first
 *   labels(plan)           the stateroom numbers one row's plan list names: { label, printed, berths, how, note } each
 *   lookup(I, query)       a stateroom number as a reader types it ("C 102", "c102", "C-102", "#139", "139") or a row's
 *                          id as the tables write it ("C-021"): { query, label, row, how }, row null when none
 *   find(I, query)         lookup's row
 *   search(I, text)        the rows whose name or plan words hold every word of the text, the best first
 *   track(ship, opt)       a run's record of the first time each slab is wet: plain data that the caller keeps
 *   observe(tr, sim, w)    call after a step: a slab whose water reaches its threshold for the first time takes this
 *                          step's time and number (w: rooms.js's waterOf(sim), when the caller has it already)
 *   wetPieces(tr, row)     each of the row's pieces with its own first-wet time and step (null while dry)
 *   firstWet(tr, row)      the row's earliest wet piece { zone, side, slab, deck, floor, t, step }, or null while dry
 *   levelOf(sim, n, F)     space n's water as it stands now: its level in the world as rooms.js finds it, or that it is
 *                          dry or full; levels(sim, F) every space's at once
 *   slabCut(sim, s, L, F)  slab s's water below the world's level L (rooms.js's column cut on the slab's own pieces)
 *   depth(I, sim, row, w, lv)   in each of the row's slabs, now: its water (m3, and its share of the slab), whether it
 *                          is full, and the depth over the row's deck at the row's place
 *   compartment(zone)      the zone's bulkheads and the name of its space below E deck
 *   words(piece, when)     "water on C deck between bulkheads D and E, port side, at 1:58 am"
 *   clock(t, base)         a time of the night as the page's clockOf writes it ("1:58 am"); base: the run's start, in
 *                          seconds of the day (the 1912 preset's clock, 23:40; a watch's spec.clock0)
 *
 * Wet [bet]: a slab is wet from the first step its water (rooms.js's waterOf, m3 of sea) would stand WET = 1 cm deep
 * spread over its floor (its footprint, rooms.js's foot: the permeable plan area of its columns). Below that the water
 * is a film in its lowest corner. tools/cabins_tests.js prints what a tenth of it and ten times it would move.
 *
 * Honest words. At level 0 a room's water is its slab's: a deck's space in one of the model's 16 zones, on one side.
 * Inside a space her decks are open floor [stand-in], as they are in the core, until NH6's stage 1 shares a space's water
 * among its rooms. So this says "water on C deck between bulkheads D and E, port side, at 1:58 am", never "at this
 * cabin's door". Where the plans are dense a row is a block of rooms between passages, and a stateroom's own place inside
 * its block is not in the tables: a stateroom has its block's pieces and times.
 *
 * The depth over the room's deck. In each of a row's slabs the water stands at its space's one level (the core has one
 * level to a space), found from the space's water as rooms.js's waterOf finds it, so that the slabs' water below it is
 * rooms.js's share-out. It is measured up from the row's deck at the row's place there (the centroid of its outline in
 * that zone and on that side), to the deckhead at most (the slab's top over the place); a full slab gives the deckhead
 * and says so. The lowest slab of a space also holds its pockets' water (W6's bunker, G7's tank) in rooms.js's
 * share-out; that water is apart from the space's (the core keeps it outside sim.vol), so the level is the space's own.
 * Near a space's floor or its top a few m3 move its level far (the last of the air is a thin wedge under her deckhead):
 * there the depth follows rooms.js's share-out and may stand up to a metre from the core's own sim.level, which the core
 * solves for a merged pair to its own tolerance. A slab's water (m3) and its share are the steady numbers there.
 *
 * Stateroom numbers. The plans print a first- or second-class room's number with its deck's letter ("C 102") and a
 * third-class or crew room's as a number alone, which R3 writes "#139" (one numbering for the ship). The tables list them
 * in each row's plan, some with the berths ("E 1 2", "#20* 2"), some with the plan's own marks ("*", "**", kept as
 * printed), three as ranges ("#140* to #162* (even numbers; 2 to 6 berths)"). Where two rows name one number the
 * stronger naming holds it: a number listed with its berths, then one listed alone, then one listed "(in part)", then
 * one inside a range. Between two of equal strength, the row whose other numbers share the number's parity (a block on
 * one side of a passage is numbered all odd or all even; tools/cabins_tests.js counts how far R3's rows keep it).
 * index() keeps every such case in I.conflicts: findings for R3's tables, not corrections of them. A number it cannot
 * settle is in I.unresolved and resolves to no row.
 *
 * A library, as rooms.js and girder.js are: it keeps no state, registers no reader and writes nothing into a sim or into
 * the tables; its caches are keyed by the index and the ship, outside the sim, and a track is the caller's plain data. So
 * no fingerprint can move and the forecast never meets it (tools/cabins_tests.js). It reads the core's public functions
 * and rooms.js's table and share-out, and mirrors one piece of rooms.js for the depth: its space's level (its column cut,
 * cutAt, and its Newton's steps). A change there needs the same change here; the suite holds every slab's water below
 * the mirrored level to rooms.js's share-out. rooms.js is found when it is first wanted: the build bundles core/readers/
 * in name order, this file before it.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../core.js'), function () { return require('./rooms.js'); });
  else root.TitanicCabins = factory(root.TitanicCore, function () { return root.TitanicRooms; });
})(typeof self !== 'undefined' ? self : this, function (C, roomsLib) {
  'use strict';
  if (!C) return null;
  const DECKS = ['orlop', 'G', 'F', 'E', 'D', 'C', 'B', 'A', 'Boat'];   // keel up, as R3's tables
  const FLOOR = { orlop: 'below G' };   // the floor of the slab a deck's rooms stand in, where it is not the deck itself
  const WET = 0.01;                     // m [bet]: a slab is wet once its water would stand this deep over its floor
  const STRENGTH = { berths: 3, listed: 2, part: 1, range: 0 };
  // a plan's item that names a stateroom: "C 102", "E 1 2" (with its berths), "F 45* 2", "D 36 (3 berths, mostly)";
  // "#224** 2", "#9A** 8", "#141*"; and the ranges, "#140* to #162* (even numbers; 2 to 6 berths)"
  const ONE = /^([A-G]) (\d+)(\*{0,2})(?:\s+(\d+))?(?:\s*\((.*)\))?$/;
  const HASH = /^#(\d+[A-Z]?)(\*{0,2})(?:\s+(\d+))?(?:\s*\((.*)\))?$/;
  const RANGE = /^#(\d+)(\*{0,2}) to #(\d+)(\*{0,2})(?:\s*\((.*)\))?$/;
  const R = () => roomsLib();
  const cache = new WeakMap();          // index -> ship -> the rows' places
  const slabCache = new WeakMap();      // ship -> each slab's column pieces

  // a plan's list, split at its semicolons outside brackets ("#140* to #162* (even numbers; 2 to 6 berths)" is one item)
  function split(plan) {
    const out = [];
    let depth = 0, cur = '';
    for (const ch of String(plan == null ? '' : plan)) {
      if (ch === '(') depth++;
      else if (ch === ')' && depth > 0) depth--;
      if (ch === ';' && depth === 0) { if (cur.trim()) out.push(cur.trim()); cur = ''; } else cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  // the stateroom numbers a plan's list names, in its order; a range gives each of its numbers
  function labels(plan) {
    const out = [];
    for (const item of split(plan)) {
      let m = RANGE.exec(item);
      if (m) {
        const note = m[5] || '', even = /\beven numbers\b/.test(note), odd = /\bodd numbers\b/.test(note);
        for (let n = +m[1]; n <= +m[3]; n++) if (!(even && n % 2 === 1) && !(odd && n % 2 === 0)) out.push({ label: '#' + n, printed: item, berths: null, how: 'range', note });
        const w = /\bwith ((?:#\d+[A-Z]?(?:,\s*|\s+and\s+)?)+)/.exec(note);
        if (w) for (const x of w[1].match(/#\d+[A-Z]?/g)) out.push({ label: x, printed: item, berths: null, how: 'range', note });
        continue;
      }
      m = ONE.exec(item);
      const lettered = !!m;
      if (!m) m = HASH.exec(item);
      if (!m) continue;
      const label = lettered ? m[1] + ' ' + +m[2] : '#' + m[1].replace(/^0+(?=\d)/, '');
      const berths = lettered ? m[4] : m[3], note = (lettered ? m[5] : m[4]) || null;
      const how = note && /\bin part\b/.test(note) ? 'part' : berths ? 'berths' : 'listed';
      out.push({ label, printed: item, berths: berths ? +berths : null, how, note });
    }
    return out;
  }
  const numberOf = (label) => parseInt(label.replace(/^[A-G] |^#/, ''), 10);
  // words for searching: no accents, no case, letters and digits only
  const norm = (s) => String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9#]+/g, ' ').trim();

  // the index of the decks' rows
  function index(tables) {
    const decks = [].concat(tables || []).filter((T) => T && Array.isArray(T.rows) && DECKS.indexOf(T.deck) >= 0)
      .sort((a, b) => DECKS.indexOf(a.deck) - DECKS.indexOf(b.deck));
    const rows = [], byId = new Map(), byName = new Map(), cand = new Map(), named = new Map();
    for (const T of decks) {
      for (const r of T.rows) {
        const e = {
          id: r.id, deck: T.deck, floor: FLOOR[T.deck] || T.deck, kind: r.kind, name: r.name, plan: r.plan,
          beyond: (r.tags || []).indexOf('beyond the model') >= 0,
          pieces: (r.pieces || []).map((p) => ({ zone: p.zone, side: p.side, slab: p.slab, area: p.area, key: p.key })),
          x: r.x_m, y: r.y_m, labels: [], people: [], words: norm(r.name), planWords: norm(r.plan), src: r,
        };
        rows.push(e); byId.set(e.id, e);
        if (!byName.has(e.words)) byName.set(e.words, []);
        byName.get(e.words).push(e);
        const L = labels(r.plan);
        named.set(e, L);
        for (const l of L) {
          if (!cand.has(l.label)) cand.set(l.label, []);
          const list = cand.get(l.label), had = list.find((c) => c.row === e);
          if (!had) list.push({ row: e, how: l.how, printed: l.printed, berths: l.berths });
          else if (STRENGTH[l.how] > STRENGTH[had.how]) Object.assign(had, { how: l.how, printed: l.printed, berths: l.berths });
        }
      }
    }
    const byLabel = new Map(), conflicts = [], unresolved = [];
    for (const [label, list] of cand) {
      let keep = list, rule = [];
      if (keep.length > 1) {
        const top = Math.max.apply(null, keep.map((c) => STRENGTH[c.how]));
        const strong = keep.filter((c) => STRENGTH[c.how] === top);
        if (strong.length < keep.length) { keep = strong; rule.push('the stronger naming'); }
        if (keep.length > 1) {
          // the row whose other numbers share this one's parity (a block on one side of a passage is numbered all odd or
          // all even): the share of its other listed numbers that do
          const par = numberOf(label) % 2;
          const share = (c) => {
            const o = named.get(c.row).filter((l) => l.label !== label && l.how !== 'range');
            return o.length ? o.filter((l) => numberOf(l.label) % 2 === par).length / o.length : 0;
          };
          const best = Math.max.apply(null, keep.map(share)), same = keep.filter((c) => share(c) === best);
          if (same.length < keep.length) { keep = same; rule.push('its block\'s parity'); }
        }
        conflicts.push({ label, named: list.map((c) => ({ id: c.row.id, how: c.how, printed: c.printed })), to: keep.length === 1 ? keep[0].row.id : null, rule: rule.join(', then ') || null });
      }
      if (keep.length === 1) byLabel.set(label, keep[0].row);
      else unresolved.push(label);
    }
    for (const [e, L] of named) for (const l of L) if (byLabel.get(l.label) === e && e.labels.indexOf(l.label) < 0) e.labels.push(l.label);
    // the people a list names in her staterooms: each line's names on every row its staterooms resolve to, in the list's
    // order; a line with no stateroom, or with one her plans do not number, is kept apart with why
    const people = { lists: [], lines: 0, names: 0, placed: 0, unplaced: [] };
    const lists = [].concat(tables || []).filter((T) => T && T.table === 'occupants' && Array.isArray(T.rows))
      .sort((a, b) => (a.title < b.title ? -1 : a.title > b.title ? 1 : 0));
    for (const T of lists) {
      const list = T.title || 'a list';
      people.lists.push({ title: list, source: T.source ? T.source.title || null : null, what: T.source ? T.source.what || null : null });
      for (const r of T.rows) {
        const names = [].concat(r.names || []), ls = [].concat(r.labels || []), at = ls.map((l) => byLabel.get(l) || null);
        people.lines++; people.names += names.length;
        const missing = ls.filter((l, i) => !at[i]);
        if (!ls.length || missing.length) people.unplaced.push({ n: r.n, cabin: r.cabin == null ? null : r.cabin, names, list, why: !ls.length ? (r.cabin == null ? 'the list gives no stateroom' : 'no deck\'s letter and number to read in "' + r.cabin + '"') : 'her plans in R3\'s tables number no ' + missing.join(', ') });
        if (ls.length && !missing.length) people.placed++;
        const done = new Set();
        at.forEach((e) => {
          if (!e || done.has(e)) return;
          done.add(e);
          e.people.push({ labels: ls.filter((l, j) => at[j] === e), cabin: r.cabin == null ? null : r.cabin, names, n: r.n, list });
        });
      }
    }
    return { decks: decks.map((T) => T.deck), rows, byId, byName, byLabel, conflicts, unresolved, people };
  }

  // the people whose names hold the text as a phrase, or every one of its words, with the rows they stand in: the
  // phrase first, then by their line in their list and the row's id (a line of two staterooms in two rows gives both)
  function named(I, text, max) {
    const q = norm(text);
    if (!q || !I.people) return [];
    const words = q.split(' '), hits = [];
    for (const e of I.rows) {
      for (const p of e.people) {
        const n = norm(p.names.join(' '));
        const score = n.indexOf(q) >= 0 ? 0 : words.every((w) => n.indexOf(w) >= 0) ? 1 : -1;
        if (score >= 0) hits.push([score, { row: e, names: p.names, labels: p.labels, cabin: p.cabin, n: p.n, list: p.list }]);
      }
    }
    hits.sort((a, b) => a[0] - b[0] || (a[1].list < b[1].list ? -1 : a[1].list > b[1].list ? 1 : 0) || a[1].n - b[1].n || (a[1].row.id < b[1].row.id ? -1 : a[1].row.id > b[1].row.id ? 1 : 0));
    const out = hits.map((h) => h[1]);
    return max > 0 ? out.slice(0, max) : out;
  }

  // a stateroom number or a row's id, from what a reader types
  function lookup(I, query) {
    const q = String(query == null ? '' : query).trim();
    const id = I.byId.get(q) || I.rows.find((e) => e.id.toUpperCase() === q.toUpperCase());
    if (id) return { query, label: null, row: id, how: 'id' };
    const u = q.toUpperCase().replace(/\*/g, '');
    let label = null, m = /^([A-G])\s*-?\s*(\d+)$/.exec(u);
    if (m) label = m[1] + ' ' + +m[2];
    else if ((m = /^#?\s*(\d+)\s*([A-Z]?)$/.exec(u))) label = '#' + +m[1] + m[2];
    return { query, label, row: label ? I.byLabel.get(label) || null : null, how: label ? 'number' : null };
  }
  function find(I, query) { return lookup(I, query).row; }

  // the rows whose name or plan hold every word of the text, best first: the name is the text, begins with it, holds it
  // as a phrase, holds each of its words, or the name and the plan together do; then by id
  function search(I, text, max) {
    const q = norm(text);
    if (!q) return [];
    const words = q.split(' '), hits = [];
    for (const e of I.rows) {
      const n = e.words;
      const score = n === q ? 0 : n.indexOf(q + ' ') === 0 ? 1 : n.indexOf(q) >= 0 ? 2 : words.every((w) => n.indexOf(w) >= 0) ? 3
        : words.every((w) => n.indexOf(w) >= 0 || e.planWords.indexOf(w) >= 0) ? 4 : -1;
      if (score >= 0) hits.push([score, e]);
    }
    hits.sort((a, b) => a[0] - b[0] || (a[1].id < b[1].id ? -1 : a[1].id > b[1].id ? 1 : 0));
    const out = hits.map((h) => h[1]);
    return max > 0 ? out.slice(0, max) : out;
  }

  // ------------------------------------------------------------ a run's first-wet times, by slab
  function track(ship, opt) {
    const T = R().table(ship), wet = opt && opt.wet != null ? opt.wet : WET, n = T.list.length;
    const thr = new Array(n), t = new Array(n), step = new Array(n);
    for (let s = 0; s < n; s++) { thr[s] = wet * T.list[s].foot; t[s] = null; step[s] = null; }
    return { v: 1, wet, slabs: n, thr, t, step, calls: 0, tLast: null };
  }
  function observe(tr, sim, w) {
    w = w || R().waterOf(sim);
    const k = sim.night ? sim.night.k : Math.round(sim.t / sim.params.dt);
    for (let s = 0; s < tr.slabs; s++) if (tr.t[s] === null && w[s] >= tr.thr[s]) { tr.t[s] = sim.t; tr.step[s] = k; }
    tr.calls++;
    tr.tLast = sim.t;
    return tr;
  }
  function wetPieces(tr, row) {
    return row.pieces.map((p) => ({ zone: p.zone, side: p.side, slab: p.slab, area: p.area, deck: row.deck, floor: row.floor,
      t: p.slab >= 0 ? tr.t[p.slab] : null, step: p.slab >= 0 ? tr.step[p.slab] : null, outside: p.slab < 0 }));
  }
  function firstWet(tr, row) {
    let best = null;
    for (const p of wetPieces(tr, row)) if (p.t !== null && (!best || p.t < best.t || (p.t === best.t && p.slab < best.slab))) best = p;
    return best;
  }

  // ------------------------------------------------------------ the depth over the room's deck
  // the model's zones by x, bow first, as tools/rooms_table.js cut the rows into their pieces
  const ZB = [Infinity].concat(C.BULKHEADS.map((b) => b.x), [-Infinity]);
  function clip(poly, f) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length], fp = f(p), fq = f(q);
      if (fp >= 0) out.push(p);
      if ((fp >= 0) !== (fq >= 0)) { const u = fp / (fp - fq); out.push([p[0] + u * (q[0] - p[0]), p[1] + u * (q[1] - p[1])]); }
    }
    return out;
  }
  function centroid(poly) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length], c = p[0] * q[1] - q[0] * p[1];
      a += c; cx += (p[0] + q[0]) * c; cy += (p[1] + q[1]) * c;
    }
    return Math.abs(a) > 1e-9 ? [cx / (3 * a), cy / (3 * a)] : null;
  }
  // each slab's column pieces in rooms.js's table, for one ship
  function slabPieces(ship) {
    let S = slabCache.get(ship);
    if (S) return S;
    const T = R().table(ship), Q = T.list.map(() => []);
    for (let q = 0; q < T.col.length; q++) Q[T.slab[q]].push(q);
    S = { T, Q };
    slabCache.set(ship, S);
    return S;
  }
  // the row's place in each of its pieces, for one index and ship
  function geo(I, ship) {
    let byShip = cache.get(I);
    if (!byShip) { byShip = new WeakMap(); cache.set(I, byShip); }
    let G = byShip.get(ship);
    if (G) return G;
    const { T, Q } = slabPieces(ship), c = ship.cols;
    const place = new Map();
    for (const e of I.rows) {
      const at = [];
      for (const p of e.pieces) {
        if (p.slab < 0 || !T.list[p.slab]) { at.push(null); continue; }
        let poly = (e.src.poly_m || []).map((v) => [v[0], v[1]]);
        poly = clip(poly, (v) => ZB[p.zone] - v[0]);
        poly = clip(poly, (v) => v[0] - ZB[p.zone + 1]);
        poly = clip(poly, (v) => (p.side === 0 ? v[1] : -v[1]));
        let xy = poly.length >= 3 ? centroid(poly) : null;
        if (!xy) {   // a sliver: the middle of the row's extent, inside the zone and on the side
          const x0 = Math.max(Math.min(e.x[0], e.x[1]), ZB[p.zone + 1]), x1 = Math.min(Math.max(e.x[0], e.x[1]), ZB[p.zone]);
          const ys = p.side === 0 ? [Math.max(0, Math.min(e.y[0], e.y[1])), Math.max(0, e.y[0], e.y[1])] : [Math.min(0, e.y[0], e.y[1]), Math.min(0, Math.max(e.y[0], e.y[1]))];
          xy = [0.5 * (x0 + x1), 0.5 * (ys[0] + ys[1])];
        }
        // the slab's top over the place: its column piece nearest to it
        let best = -1, d2 = Infinity;
        for (const q of Q[p.slab]) { const i = T.col[q], dx = c.x[i] - xy[0], dy = c.y[i] - xy[1], d = dx * dx + dy * dy; if (d < d2) { d2 = d; best = q; } }
        at.push({ x: xy[0], y: xy[1], zDeck: C.deckZ(e.deck, xy[0]), zTop: T.hi[best] });
      }
      place.set(e, at);
    }
    G = { T, place };
    byShip.set(ship, G);
    return G;
  }
  // the water a space's lowest slab holds of its pockets in rooms.js's share-out (min(vol, cap); a pocket of both sides
  // half to each half)
  function pocketsIn(sim, T, s) {
    const n = T.list[s].n;
    if (T.byNode[n][0] !== s) return 0;
    let v = 0;
    for (const k of sim.pockets || []) {
      const held = Math.min(k.vol, k.cap);
      if (!(held > 0)) continue;
      if (k.side < 0) { if (k.node === n || k.node - 2 === n) v += 0.5 * held; } else if (k.node === n) v += held;
    }
    return v;
  }
  // the water of space n's pieces, or of one of its slabs (only), below the world's level L at the pose F (m3), and its
  // rate with L (m2): rooms.js's column cut (its cutAt), on the same pieces in the same order
  function cutAt(T, sim, n, F, L, only) {
    const c = sim.ship.cols, mu = sim.ship.nodeMu[n];
    let v = 0, a = 0;
    for (let q = T.start[n]; q < T.start[n + 1]; q++) {
      if (only !== undefined && T.slab[q] !== only) continue;
      const i = T.col[q], zc = (L - (F.R20 * c.x[i] + F.R21 * c.y[i] + F.tz)) / F.R22;
      if (zc <= T.lo[q]) continue;
      if (zc < T.hi[q]) { v += mu * c.dxdy[i] * (zc - T.lo[q]); a += mu * c.dxdy[i] / F.R22; }
      else v += mu * c.dxdy[i] * (T.hi[q] - T.lo[q]);
    }
    return [v, a];
  }
  // space n's water as it stands at the pose F: the world's level at which the space holds its water (sim.vol) below it,
  // found as rooms.js's waterOf finds it (its bracket, its start at the core's sim.level, its Newton's steps and its
  // tolerance), so that its slabs' water below that level is rooms.js's share-out; dry or full, no level. A slab alone
  // cannot give it: at the founder's trim a slab's columns can stand clear of each other, and a slab's water is then the
  // same over a band of levels; the space's columns, each the space's whole height, never can.
  function levelOf(sim, n, F) {
    const T = R().table(sim.ship), c = sim.ship.cols, V = sim.vol[n], Vmax = sim.ship.nodeVmax[n];
    F = F || sim._F || C.frameOf(sim);
    if (!(V > 0) || !T.byNode[n].length) return { n, dry: true, full: false, level: null, err: 0 };
    if (V >= Vmax) return { n, dry: false, full: true, level: null, err: 0 };
    let lo = Infinity, hi = -Infinity;
    for (let q = T.start[n]; q < T.start[n + 1]; q++) {
      const i = T.col[q], b = F.R20 * c.x[i] + F.R21 * c.y[i] + F.tz;
      const z0 = b + F.R22 * T.lo[q], z1 = b + F.R22 * T.hi[q];
      if (z0 < lo) lo = z0; if (z1 > hi) hi = z1;
    }
    let L = Math.min(hi, Math.max(lo, sim.level[n])), err = 0;
    for (let it = 0; it < 60; it++) {
      const [v, a] = cutAt(T, sim, n, F, L), d = V - v;
      err = Math.abs(d);
      if (Math.abs(d) <= 1e-12 * Vmax) break;
      if (d > 0) lo = L; else hi = L;
      const Ln = a > 0 ? L + d / a : NaN;
      L = Ln > lo && Ln < hi ? Ln : 0.5 * (lo + hi);   // Newton's step, or halve the bracket
    }
    return { n, dry: false, full: false, level: L, err };
  }
  // every space's level at once (for depth over many rows at one step)
  function levels(sim, F) {
    F = F || sim._F || C.frameOf(sim);
    const out = new Array(C.NN);
    for (let n = 0; n < C.NN; n++) out[n] = levelOf(sim, n, F);
    return out;
  }
  // slab s's water below the world's level L at the pose F (m3): the column cut on the slab's own pieces
  function slabCut(sim, s, L, F) {
    const T = R().table(sim.ship);
    return cutAt(T, sim, T.list[s].n, F || sim._F || C.frameOf(sim), L, s)[0];
  }
  // in each of the row's slabs now: its water (m3) and its share of the slab, whether it is full, and the depth over the
  // row's deck at the row's place there, up to the deckhead (lv: levels(sim), when the caller has them already)
  function depth(I, sim, row, w, lv) {
    const G = geo(I, sim.ship), T = G.T, at = G.place.get(row) || [];
    w = w || R().waterOf(sim);
    const F = sim._F || C.frameOf(sim);
    const out = [];
    row.pieces.forEach((p, j) => {
      const g = at[j];
      if (!g) return;
      const s = p.slab, n = T.list[s].n, L = lv ? lv[n] : levelOf(sim, n, F), head = g.zTop - g.zDeck;
      const full = L.full || w[s] - pocketsIn(sim, T, s) >= T.list[s].vmax * (1 - 1e-12);
      let d = 0;
      if (full) d = head;
      else if (!L.dry) d = Math.min(Math.max((L.level - (F.R20 * g.x + F.R21 * g.y + F.tz)) / F.R22 - g.zDeck, 0), head);
      out.push({ zone: p.zone, side: p.side, slab: s, deck: row.deck, floor: row.floor, x: g.x, y: g.y, m3: w[s], fill: w[s] / T.list[s].vmax, depth: d, head, full, level: L.level });
    });
    return out;
  }

  // ------------------------------------------------------------ words
  function compartment(zone) {
    const B = C.BULKHEADS, fwd = zone > 0 ? B[zone - 1].id : null, aft = zone < B.length ? B[zone].id : null;
    const between = fwd && aft ? 'between bulkheads ' + fwd + ' and ' + aft : fwd ? 'abaft bulkhead ' + fwd : 'forward of bulkhead ' + aft;
    return { zone, fwd, aft, between, below: C.ZONES[zone] ? C.ZONES[zone].name : null };
  }
  function deckWords(floor) { return floor === 'below G' ? 'below G deck' : floor === 'Boat' ? 'on the Boat deck' : 'on ' + floor + ' deck'; }
  function words(piece, when) {
    return 'water ' + deckWords(piece.floor) + ' ' + compartment(piece.zone).between + ', ' + (piece.side ? 'starboard' : 'port') + ' side' + (when ? ', at ' + when : '');
  }
  function clock(t, base) {
    const s = (((base + t) % 86400) + 86400) % 86400, m = Math.floor(s % 3600 / 60);
    let h = Math.floor(s / 3600);
    const ap = h >= 12 ? 'pm' : 'am';
    h %= 12;
    if (h === 0) h = 12;
    return h + ':' + String(m).padStart(2, '0') + ' ' + ap;
  }

  return { DECKS, WET, split, labels, index, lookup, find, search, named, track, observe, wetPieces, firstWet, levelOf, levels, slabCut, depth, compartment, words, clock };
});
