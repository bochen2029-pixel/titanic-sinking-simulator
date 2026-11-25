// R3 of docs/BRAINSTORM_rooms_and_a_walk_through_her_v1_2026-11-20.md: her rooms read from the deck plans into a sourced
// table (data/rooms/<deck>_deck.json, under docs/research/RESEARCH_rooms_plans_licence_v1_1_2026-11-20.md), and what the
// model makes of them. A row's own fields (its frames, its feet from the centreline, its doors, its source and check) are
// read off the plans; the derived fields (the outline in metres, the area, the model's zone and slab, the plan's own
// compartment) are written here from the model's functions, and tools/rooms_table_tests.js checks they are current.
//   node tools/rooms_table.js --write data/rooms/E_deck.json        # fill the derived fields in place
//   node tools/rooms_table.js --png docs/evidence/rooms/E_deck_outlines.png data/rooms/E_deck.json   # the picture
//   node tools/rooms_table.js --write data/rooms/openings.json      # her openings: x in metres, zones, clear areas
// The picture draws the table's numbers on the model's own hull and bulkheads; it copies no plan (the coordinator,
// 2026-11-20: "It is ours, drawn over the model's own outline from facts in our table"). Look at it before committing.
// One table a deck; its "deck" names the floor (E, F, G ...), and the model's side and slab are taken on that deck.
'use strict';
const fs = require('fs');
const zlib = require('zlib');
const C = require('../core/core.js');
const R = require('../core/readers/rooms.js');
const FT = 0.3048;
const DERIVED = ['x_m', 'y_m', 'poly_m', 'area_m2', 'pieces', 'zone', 'slab', 'plan_compartment', 'zone_note'];

// ---- her frames, as the table's anchors give them (feet forward of amidships), and the model's metres
function frameIndex(s) {   // '110F' -> 110, '19A' -> -19; null for 'stem', 'stern' or a number
  const m = /^(\d+(?:\.\d+)?)([AF])$/.exec(String(s).trim());
  return m ? (m[2] === 'F' ? 1 : -1) * parseFloat(m[1]) : null;
}
const unit = (i) => (i > 0 ? i - 0.5 : i + 0.5);   // no frame 0: 1A and 1F are one frame apart about the midship section
function frameFt(T, f) {
  if (typeof f === 'number') return f;
  const exact = T.frames.anchors.find((a) => a[0] === f);
  if (exact) return exact[1];
  const i = frameIndex(f);
  if (i === null) throw new Error('not a frame: ' + f);
  const pts = T.frames.anchors.filter((a) => frameIndex(a[0]) !== null).map((a) => [unit(frameIndex(a[0])), a[1]]).sort((p, q) => p[0] - q[0]);
  const u = unit(i);
  let k = 0;
  while (k < pts.length - 2 && u > pts[k + 1][0]) k++;   // the segment holding u (the end segments extend outward)
  const [u0, x0] = pts[k], [u1, x1] = pts[k + 1];
  return x0 + (x1 - x0) * (u - u0) / (u1 - u0);
}
const frameM = (T, f) => frameFt(T, f) * FT;

// the model's side on a deck: its half-breadth halfway between that deck and the one above (m); the Boat deck has no
// deck over it, so its side is taken 1.2 m over it (about half the height of its houses)
const ABOVE = { orlop: 'G', G: 'F', F: 'E', E: 'D', D: 'C', C: 'B', B: 'A', A: 'Boat' };
function shellAt(x, deck = 'E') {
  const z = deck === 'Boat' ? C.deckZ('Boat', x) + 1.2 : 0.5 * (C.deckZ(deck, x) + C.deckZ(ABOVE[deck], x));
  return C.halfBreadth(x, z);
}
// whether the model has a space standing on this deck at (x, y): the top of what it shuts in there (its hull to B deck,
// C deck in the wells, and its tiers and houses above B: C.tierTop) is more than 0.3 m over the deck. Under C deck it
// always has; on C deck not in the wells; on B, A and the Boat deck only where its tiers and houses stand.
const spaceAt = (x, y, deck) => C.tierTop(x, Math.abs(y)) > C.deckZ(deck, x) + 0.3;

// ---- a row's outline in metres: a rectangle, or a strip against her side sampled along x
function outline(T, row) {
  const xa = frameM(T, row.x[0]), xb = frameM(T, row.x[1]);
  const x0 = Math.min(xa, xb), x1 = Math.max(xa, xb);
  const yv = (v, x) => (v === 'shell+' ? shellAt(x, T.deck) : v === 'shell-' ? -shellAt(x, T.deck) : v * FT);
  const n = Math.max(1, Math.ceil((x1 - x0) / 1.0));   // her side sampled every metre or less
  const xs = Array.from({ length: n + 1 }, (_, i) => x0 + (x1 - x0) * i / n);
  const shellLo = typeof row.y[0] === 'string', shellHi = typeof row.y[1] === 'string';
  const lo = xs.map((x) => yv(row.y[0], x)), hi = xs.map((x) => yv(row.y[1], x));
  // where her side (in the model) comes inside the other wall, the room has no width there
  for (let i = 0; i <= n; i++) if (hi[i] < lo[i]) { if (shellHi) hi[i] = lo[i]; else lo[i] = hi[i]; }
  let poly;
  if (!shellLo && !shellHi) poly = [[x0, lo[0]], [x1, lo[0]], [x1, hi[0]], [x0, hi[0]]];
  else poly = xs.map((x, i) => [x, lo[i]]).concat(xs.map((x, i) => [x, hi[i]]).reverse());
  // drop repeated points (a straight edge sampled along x)
  const out = [];
  for (const p of poly) { const q = out[out.length - 1]; if (!q || Math.abs(q[0] - p[0]) > 1e-9 || Math.abs(q[1] - p[1]) > 1e-9) out.push(p); }
  return { x0, x1, poly: out, outside: lo.some((v, i) => hi[i] - v < 1e-9) && (shellLo || shellHi) };
}
function area(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i++) { const [x0, y0] = poly[i], [x1, y1] = poly[(i + 1) % poly.length]; a += x0 * y1 - x1 * y0; }
  return Math.abs(a) / 2;
}
function centroid(poly) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < poly.length; i++) { const [x0, y0] = poly[i], [x1, y1] = poly[(i + 1) % poly.length]; const c = x0 * y1 - x1 * y0; a += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c; }
  return a ? [cx / (3 * a), cy / (3 * a)] : poly[0];
}
// Sutherland-Hodgman against the half-plane keep(p) >= 0, with the edge's crossing found by its linear value
function clip(poly, f) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length], fp = f(p), fq = f(q);
    if (fp >= 0) out.push(p);
    if ((fp >= 0) !== (fq >= 0)) { const t = fp / (fp - fq); out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]); }
  }
  return out;
}

// ---- the model's zones: its bulkheads' x, bow first
const ZB = (() => { const b = C.BULKHEADS.map((h) => h.x); return [Infinity].concat(b, [-Infinity]); })();
// the plan's own compartment by its bulkheads on this deck (letters -> frames); C to J are not on E deck
function planCompartment(T, x) {
  const L = Object.keys(T.bulkheads).filter((k) => k.length === 1).map((k) => [k, frameM(T, T.bulkheads[k])]).sort((a, b) => b[1] - a[1]);
  let fwd = 'stem';
  for (const [k, bx] of L) { if (x > bx) return fwd + '-' + k; fwd = k; }
  return fwd + '-stern';
}

function derive(T, ship) {
  ship = ship || C.buildShip();
  const tab = R.table(ship);
  const byId = new Map(T.rows.map((r) => [r.id, r]));
  const out = new Map();
  for (const row of T.rows) {
    const o = outline(T, row);
    const pieces = [];
    for (let k = 0; k < 16; k++) {
      let p = clip(o.poly, (q) => ZB[k] - q[0]);           // aft of the zone's forward bulkhead
      p = clip(p, (q) => q[0] - ZB[k + 1]);                // forward of its after bulkhead
      for (const side of [0, 1]) {
        const s = clip(p, (q) => (side === 0 ? q[1] : -q[1]));
        const a = s.length >= 3 ? area(s) : 0;
        if (a < 0.01) continue;
        const [cx, cy] = centroid(s);
        const xs = s.map((q) => q[0]);
        const slab = R.slabAt(ship, cx, cy, C.deckZ(T.deck, cx) + 1.0);
        pieces.push({ zone: k, side, slab, area: a, key: slab >= 0 ? tab.list[slab].key : null, dx: Math.max(...xs) - Math.min(...xs) });
      }
    }
    // A piece under SNAP m long, at a model bulkhead, is a sliver of a wall the plan stands on the same bulkhead a few
    // tenths of a metre away (at K to O the two agree within 0.15 m): it joins the piece beside it on the same side.
    const SNAP = 0.35;
    for (const p of pieces.filter((q) => q.dx < SNAP)) {
      const near = pieces.filter((q) => q !== p && q.side === p.side && Math.abs(q.zone - p.zone) === 1 && q.dx >= SNAP).sort((u, v) => v.area - u.area)[0];
      if (near) { near.area += p.area; p.area = 0; }
    }
    for (let i = pieces.length - 1; i >= 0; i--) { if (pieces[i].area === 0) pieces.splice(i, 1); else { pieces[i].area = +pieces[i].area.toFixed(3); delete pieces[i].dx; } }
    let a = area(o.poly);
    for (const id of row.minus || []) { const m = byId.get(id); if (m) a -= area(outline(T, m).poly); }
    const zones = [...new Set(pieces.map((p) => p.zone))];
    const mid = 0.5 * (o.x0 + o.x1);
    const plan = planCompartment(T, mid);
    // The plan's compartment against the model's zone, where the plan marks both of the compartment's bulkheads on this
    // deck (C to J stop under E deck, so between B and K the plan names no compartment). A passage that the plan runs
    // through a watertight door is in two zones by design: it is only asked to be in the plan's one as well.
    const letters = C.BULKHEADS.map((b) => b.id), kOf = (L) => letters.indexOf(L);
    const [f, a2] = plan.split('-');
    let kPlan = null;
    if (f === 'stem' && a2 === 'A') kPlan = 0;
    else if (f === 'P' && a2 === 'stern') kPlan = 15;
    else if (kOf(f) >= 0 && kOf(a2) === kOf(f) + 1) kPlan = kOf(f) + 1;
    let note = null;
    const through = row.kind === 'passage' && (row.doors || []).some((d) => d.kind === 'watertight door');
    if (kPlan !== null && (through ? !zones.includes(kPlan) : !(zones.length === 1 && zones[0] === kPlan))) {
      note = `the plan puts it in zone ${kPlan} (between ${f} and ${a2}); the model, in zone ${zones.join(' and ')}`;
    }
    const yv = (v) => (typeof v === 'number' ? +(v * FT).toFixed(3) : v === 'shell+' ? +shellAt(mid, T.deck).toFixed(3) : +(-shellAt(mid, T.deck)).toFixed(3));
    out.set(row.id, {
      x_m: [+o.x0.toFixed(3), +o.x1.toFixed(3)],
      y_m: [yv(row.y[0]), yv(row.y[1])],
      poly_m: o.poly.map((p) => [+p[0].toFixed(2), +p[1].toFixed(2)]),
      area_m2: +a.toFixed(2),
      pieces,
      zone: zones,
      slab: [...new Set(pieces.map((p) => p.slab))],
      plan_compartment: plan,
      zone_note: note,
    });
  }
  return out;
}

// ---- her openings (data/rooms/openings.json): the windows, sidelights and doors the plans write, each row on its deck
// and its rooms (rows of that deck's table). Derived here from the model: x in metres (her frames by the deck table's
// own anchors), the model's zones the span crosses (C.zoneAt), and the clear area of one opening and of all of them.
const ODERIVED = ['x_m', 'zone', 'area_each_m2', 'area_m2'];
function deriveOpenings(O, tables) {
  const IN = 0.0254, out = new Map();
  for (const r of O.rows) {
    const T = tables[r.deck];
    const xa = frameM(T, r.x[0]), xb = frameM(T, r.x[1]), x0 = Math.min(xa, xb), x1 = Math.max(xa, xb);
    const zones = new Set([C.zoneAt(x0), C.zoneAt(x1)]);
    for (let x = x0; x < x1; x += 0.25) zones.add(C.zoneAt(x));
    let each = null;
    if (r.size_in && r.shape === 'round') each = Math.PI / 4 * (r.size_in[0] * IN) ** 2;
    else if (r.size_in && r.shape === 'rect') each = r.size_in[0] * IN * r.size_in[1] * IN;
    out.set(r.id, { x_m: [+x0.toFixed(3), +x1.toFixed(3)], zone: [...zones].sort((p, q) => p - q), area_each_m2: each === null ? null : +each.toFixed(4), area_m2: each === null || r.count === null ? null : +(each * r.count).toFixed(3) });
  }
  return out;
}

// ---- the file, written with one row to a line or two as the hand-written file has them
function write(file, T, D, keys = DERIVED) {
  for (const row of T.rows) { const d = D.get(row.id); for (const k of keys) row[k] = d[k]; }
  const head = Object.assign({}, T); delete head.rows;
  let s = JSON.stringify(head, null, 2).replace(/\n}$/, ',\n  "rows": [\n');
  s += T.rows.map((r) => '    ' + JSON.stringify(r)).join(',\n') + '\n  ]\n}\n';
  fs.writeFileSync(file, s);
}

// ---- the picture: a PNG made here (no library), the table's outlines on the model's own deck
const FONT = { '0': [7, 5, 5, 5, 7], '1': [2, 6, 2, 2, 7], '2': [7, 1, 7, 4, 7], '3': [7, 1, 7, 1, 7], '4': [5, 5, 7, 1, 1], '5': [7, 4, 7, 1, 7], '6': [7, 4, 7, 5, 7], '7': [7, 1, 1, 1, 1], '8': [7, 5, 7, 5, 7], '9': [7, 5, 7, 1, 7],
  A: [2, 5, 7, 5, 5], B: [6, 5, 6, 5, 6], C: [3, 4, 4, 4, 3], D: [6, 5, 5, 5, 6], E: [7, 4, 6, 4, 7], F: [7, 4, 6, 4, 4], G: [3, 4, 5, 5, 3], H: [5, 5, 7, 5, 5], I: [7, 2, 2, 2, 7], J: [1, 1, 1, 5, 2], K: [5, 5, 6, 5, 5], L: [4, 4, 4, 4, 7], M: [5, 7, 7, 5, 5],
  N: [6, 5, 5, 5, 5], O: [2, 5, 5, 5, 2], P: [6, 5, 6, 4, 4], Q: [2, 5, 5, 6, 3], R: [6, 5, 6, 5, 5], S: [3, 4, 2, 1, 6], T: [7, 2, 2, 2, 2], U: [5, 5, 5, 5, 7], V: [5, 5, 5, 5, 2], W: [5, 5, 7, 7, 5], X: [5, 5, 2, 5, 5], Y: [5, 5, 2, 2, 2], Z: [7, 1, 2, 4, 7],
  '-': [0, 0, 7, 0, 0], '.': [0, 0, 0, 0, 2], ':': [0, 2, 0, 2, 0], ' ': [0, 0, 0, 0, 0], '/': [1, 1, 2, 4, 4], '(': [1, 2, 2, 2, 1], ')': [4, 2, 2, 2, 4], '=': [0, 7, 0, 7, 0], "'": [2, 2, 0, 0, 0], ',': [0, 0, 0, 2, 4] };
const COL = { passage: [250, 215, 80], cabin: [150, 190, 235], crew: [150, 210, 150], casing: [175, 175, 175], stair: [240, 150, 70], hatch: [170, 120, 80], service: [200, 170, 225], store: [215, 195, 150], lift: [235, 150, 190], trunk: [140, 140, 140], grating: [200, 200, 120] };
function png(file, W, H, px) {
  const crc = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return (b) => { let c = -1; for (const v of b) c = t[(c ^ v) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; }; })();
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const raw = Buffer.alloc((W * 3 + 1) * H);
  for (let y = 0; y < H; y++) { raw[y * (W * 3 + 1)] = 0; px.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]));
}
function picture(file, T, D) {
  const S = 14, M = 30, PW = 92, W = Math.round(PW * S) + 2 * M, PH = 30, HP = Math.round(PH * S) + 2 * M;   // under 1500 px a side
  const panels = [[132, 40], [42, -50], [-48, -140]];   // x from, x to (bow first, so each panel's right is forward)
  const H = HP * panels.length;
  const px = Buffer.alloc(W * H * 3, 255);
  const set = (x, y, c, a = 1) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 3; for (let k = 0; k < 3; k++) px[i + k] = Math.round(px[i + k] * (1 - a) + c[k] * a); };
  const line = (x0, y0, x1, y1, c, dash) => { const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))) + 1; for (let i = 0; i <= n; i++) { if (dash && Math.floor(i / dash) % 2) continue; set(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c); } };
  const text = (s, x, y, c, sc = 2) => { let cx = x; for (const ch of String(s).toUpperCase()) { const g = FONT[ch] || FONT[' ']; for (let r = 0; r < 5; r++) for (let b = 0; b < 3; b++) if (g[r] & (4 >> b)) for (let u = 0; u < sc; u++) for (let v = 0; v < sc; v++) set(cx + b * sc + u, y + r * sc + v, c); cx += 4 * sc; } };
  const fill = (pts, c, a) => {   // even-odd scanline fill of a polygon in pixels
    const ys = pts.map((p) => p[1]); const y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(H - 1, Math.ceil(Math.max(...ys)));
    for (let y = y0; y <= y1; y++) { const xs = []; for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= y + 0.5) !== (by <= y + 0.5)) xs.push(ax + (y + 0.5 - ay) * (bx - ax) / (by - ay)); } xs.sort((p, q) => p - q); for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) set(x, y, c, a); }
  };
  panels.forEach(([xa, xb], p) => {
    const top = p * HP, Y = (y) => top + M + (PH / 2 - y) * S;   // port up
    const XR = (x) => M + (x - xb) * S;                            // forward to the right, as the plans are drawn
    text(`${T.deck} DECK, X ${xa} TO ${xb} M (FORWARD RIGHT, PORT UP): THE TABLE ON THE MODEL'S OWN DECK (PALE BLUE: NO SPACE IN THE MODEL)`, M, top + 6, [40, 40, 40]);
    // where the model has no space on this deck inside her side (a well, or open deck beside its tiers and houses)
    for (let x = xb; x < xa; x += 0.25) for (let y = -PH / 2; y < PH / 2; y += 0.25) {
      const xc = x + 0.125, yc = y + 0.125;
      if (Math.abs(yc) <= shellAt(xc, T.deck) && !spaceAt(xc, yc, T.deck)) for (let u = 0; u < 4; u++) for (let v = 0; v < 4; v++) set(XR(x) + u, Y(y + 0.25) + v, [205, 225, 240]);
    }
    // the model's centreline and side at this deck
    line(XR(xb), Y(0), XR(xa), Y(0), [200, 200, 200], 6);
    for (const s of [1, -1]) { let prev = null; for (let x = xb; x <= xa; x += 0.1) { const hb = shellAt(x, T.deck); const q = [XR(x), Y(s * hb)]; if (prev && hb > 0) line(prev[0], prev[1], q[0], q[1], [30, 30, 30]); prev = hb > 0 ? q : null; } }
    // the rooms
    for (const row of T.rows) {
      const d = D.get(row.id); if (!d) continue;
      if (d.x_m[1] < xb || d.x_m[0] > xa) continue;
      const pts = d.poly_m.map(([x, y]) => [XR(Math.max(xb, Math.min(xa, x))), Y(y)]);
      const sr = (row.tags || []).includes('scotland-road');
      fill(pts, sr ? [235, 160, 0] : COL[row.kind] || [210, 210, 210], sr ? 0.85 : 0.55);
      for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; line(a[0], a[1], b[0], b[1], [70, 70, 90]); }
      const [cx, cy] = centroid(d.poly_m);
      if (cx > xb + 1 && cx < xa - 1 && d.area_m2 > 12) text(row.id.replace('E-', ''), XR(cx) - 10, Y(cy) - 4, [20, 20, 60], 1.5);
    }
    // the model's bulkheads (blue) and the plan's, where it marks them on this deck (red, dashed)
    for (const b of C.BULKHEADS) if (b.x <= xa && b.x >= xb) { line(XR(b.x), Y(PH / 2 - 1), XR(b.x), Y(-PH / 2 + 1), [40, 70, 200]); text(b.id, XR(b.x) + 3, Y(PH / 2 - 0.2), [40, 70, 200]); }
    for (const [k, f] of Object.entries(T.bulkheads)) { if (k.length !== 1) continue; const x = frameM(T, f); if (x <= xa && x >= xb) { line(XR(x), Y(PH / 2 - 2), XR(x), Y(-PH / 2 + 2), [210, 30, 30], 4); text(k + "'", XR(x) + 3, Y(-PH / 2 + 1.6), [210, 30, 30]); } }
    // frames every ten, under the hull
    for (let i = -140; i <= 150; i += 10) { if (i === 0) continue; const f = Math.abs(i) + (i > 0 ? 'F' : 'A'); const x = frameM(T, f); if (x > xa || x < xb) continue; line(XR(x), Y(-PH / 2 + 0.6), XR(x), Y(-PH / 2 + 0.2), [90, 90, 90]); text(f, XR(x) - 8, Y(-PH / 2 + 0.1) + 2, [90, 90, 90], 1.5); }
  });
  png(file, W, H, px);
  return [W, H];
}

module.exports = { frameFt, frameM, shellAt, spaceAt, outline, area, derive, planCompartment, write, DERIVED, deriveOpenings, ODERIVED };

if (require.main === module) {
  const args = process.argv.slice(2);
  const file = args.filter((a) => a.endsWith('.json')).pop() || 'data/rooms/E_deck.json';
  const T = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (T.openings) {   // the openings table: its derived fields from its decks' tables
    const path = require('path'), tables = {};
    for (const dk of new Set(T.rows.map((r) => r.deck))) tables[dk] = JSON.parse(fs.readFileSync(path.join(path.dirname(file), `${dk}_deck.json`), 'utf8'));
    if (args.includes('--write')) { write(file, T, deriveOpenings(T, tables), ODERIVED); console.log(`wrote the derived fields of ${T.rows.length} openings into ${file}`); }
    else console.log('usage: node tools/rooms_table.js --write data/rooms/openings.json');
    process.exit(0);
  }
  const D = derive(T);
  if (args.includes('--write')) { write(file, T, D); console.log(`wrote the derived fields of ${T.rows.length} rows into ${file}`); }
  const pi = args.indexOf('--png');
  if (pi >= 0) { const [w, h] = picture(args[pi + 1], T, D); console.log(`drew ${args[pi + 1]} (${w} x ${h} px)`); }
  if (!args.includes('--write') && pi < 0) console.log('usage: node tools/rooms_table.js --write <table.json> | --png <out.png> <table.json>');
}
