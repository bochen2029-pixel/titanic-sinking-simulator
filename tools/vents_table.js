// Her vents (data/vents_1912.json, for NH7: docs/DESIGN_NH7_air_in_every_space_v1_2026-11-23.md): the derived fields
// of each row, from its source fields, by the model's own functions, as tools/rooms_table.js does for R3's tables.
//   node tools/vents_table.js            print each row's derived fields and what differs from the file
//   node tools/vents_table.js --write    write them into data/vents_1912.json
// A row's source fields (written by hand, each with its source and tag):
//   space { zone, sides ['P','S'], layer }   the core's space(s) whose air it lets out (layer 0 below E deck, 1 above)
//   r3 [ids]       R3's rows it stands in or passes, the first the one at its inlet; deck  the deck it leaves the space at
//   x              its frames, when no R3 row places it (as R3 writes them: '30A', '12F')
//   top            the deck its outlet stands on; top_over_ft  the outlet's height over that deck
//   area { rule }  'r3-narrowest' (the narrowest of the R3 rows above the inlet, each clipped to the zone and the sides),
//                  'dia' (count x the circle of dia_in inches), 'rect' (count x l_ft x b_ft: a hatch's size as read),
//                  'm2' (its m2 as read or bet), with also [{ m2 }] (sections read elsewhere along the trunk, each
//                  narrowing it where narrower) and exit { m2 } where the way out is narrower than the trunk (a
//                  skylight, a cowl), and its own tag
//   closes         what closes it; gives_way [{ what, head_m, lo_m, hi_m, when, how, tag }]: what gives way and at what
//                  head of water (m), or when where a source gives a condition and no number, each tagged (nothing in
//                  the model reads them yet)
// Derived: x_m [aft, fwd], y_m [stbd, port], z_in_m, z_top_m, trunk_m2, exit_m2, area_m2 (the narrower), slab (rooms.js's
// slab the inlet stands in, -1 outside her spaces).
'use strict';
const fs = require('fs');
const path = require('path');
const C = require('../core/core.js');
const R = require('../core/readers/rooms.js');

const root = path.join(__dirname, '..');
const FILE = path.join(root, 'data', 'vents_1912.json');
const DECKS = ['orlop', 'G', 'F', 'E', 'D', 'C', 'B', 'A', 'Boat'];
const FT = 0.3048;
const rows3 = new Map();
for (const d of DECKS) for (const r of JSON.parse(fs.readFileSync(path.join(root, 'data', 'rooms', d + '_deck.json'), 'utf8')).rows) rows3.set(r.id, Object.assign({ deck: d }, r));
const E = JSON.parse(fs.readFileSync(path.join(root, 'data', 'rooms', 'E_deck.json'), 'utf8'));
// frames to metres by E deck's anchors (R3's frames are the same on every deck)
function frameM(f) {
  const A = E.frames.anchors.map(([k, v]) => [k, v]);
  const m = /^(\d+(?:\.\d+)?)([AF])$/.exec(String(f));
  if (!m) { const a = A.find((q) => q[0] === f); if (!a) throw new Error('no frame ' + f); return a[1] * FT; }
  const n = +m[1] * (m[2] === 'A' ? -1 : 1);
  const val = (k) => { const q = /^(\d+(?:\.\d+)?)([AF])$/.exec(k); return q ? +q[1] * (q[2] === 'A' ? -1 : 1) : null; };
  const pts = A.map(([k, v]) => [val(k), v]).filter((p) => p[0] !== null).sort((p, q) => p[0] - q[0]);
  for (let i = 0; i + 1 < pts.length; i++) if (n >= pts[i][0] && n <= pts[i + 1][0]) { const u = (n - pts[i][0]) / (pts[i + 1][0] - pts[i][0]); return (pts[i][1] + u * (pts[i + 1][1] - pts[i][1])) * FT; }
  throw new Error('frame ' + f + ' outside the anchors');
}
const ZB = [Infinity].concat(C.BULKHEADS.map((b) => b.x), [-Infinity]);
function clip(P, f) { const out = []; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length], fp = f(p), fq = f(q); if (fp >= 0) out.push(p); if ((fp >= 0) !== (fq >= 0)) { const u = fp / (fp - fq); out.push([p[0] + u * (q[0] - p[0]), p[1] + u * (q[1] - p[1])]); } } return out; }
function area(P) { let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a) / 2; }
// a row's outline in a zone and on the sides given
function inSpace(r, zone, sides) {
  let P = (r.poly_m || []).map((v) => [v[0], v[1]]);
  P = clip(P, (v) => ZB[zone] - v[0]); P = clip(P, (v) => v[0] - ZB[zone + 1]);
  if (sides.length === 1) P = clip(P, (v) => (sides[0] === 'P' ? v[1] : -v[1]));
  return P;
}
const r4 = (x) => Math.round(x * 1e4) / 1e4;

function derive(v, ship) {
  const { zone, sides, layer } = v.space;
  let x0, x1, y0, y1;
  if (v.r3 && v.r3.length) {
    const r = rows3.get(v.r3[0]);
    if (!r) throw new Error(v.id + ': no R3 row ' + v.r3[0]);
    const P = inSpace(r, zone, sides);
    if (P.length < 3) throw new Error(v.id + ': ' + v.r3[0] + ' has no outline in zone ' + zone + ' ' + sides.join(''));
    x0 = Math.min(...P.map((p) => p[0])); x1 = Math.max(...P.map((p) => p[0])); y0 = Math.min(...P.map((p) => p[1])); y1 = Math.max(...P.map((p) => p[1]));
  } else {
    const a = frameM(v.x[0]), b = frameM(v.x[1]);
    x0 = Math.max(Math.min(a, b), ZB[zone + 1]); x1 = Math.min(Math.max(a, b), ZB[zone]);
    const yy = (v.y_ft || [0, 0]).map((q) => q * FT);
    y0 = Math.min(...yy); y1 = Math.max(...yy);
  }
  const xc = 0.5 * (x0 + x1), yc = 0.5 * (y0 + y1);
  const zIn = C.deckZ(v.deck === 'orlop' ? 'orlop' : v.deck, xc);
  // its top: a height read or scaled (top_z_m, the ship frame), or the top deck's own height there and the outlet's over it
  const zTop = v.top_z_m != null ? v.top_z_m + (v.top_over_ft || 0) * FT : C.deckZ(v.top, xc) + (v.top_over_ft || 0) * FT;
  let trunk = null;
  if (v.area.rule === 'r3-narrowest') {
    const list = (v.area.rows || v.r3.slice(1)).map((id) => { const r = rows3.get(id); const P = inSpace(r, zone, sides); return [id, P.length >= 3 ? area(P) : 0]; }).filter((q) => q[1] > 0);
    trunk = list.length ? Math.min(...list.map((q) => q[1])) : null;
  } else if (v.area.rule === 'dia') trunk = v.area.count * Math.PI * Math.pow(0.5 * v.area.dia_in * 0.0254, 2);
  else if (v.area.rule === 'rect') trunk = v.area.count * v.area.l_ft * v.area.b_ft * FT * FT;
  else if (v.area.rule === 'm2') trunk = v.area.m2;
  // sections read elsewhere along the trunk (a casing's opening 'as completed'), each narrowing it where narrower
  for (const a of v.area.also || []) trunk = trunk == null ? a.m2 : Math.min(trunk, a.m2);
  const exit = v.area.exit && v.area.exit.m2 != null ? v.area.exit.m2 : null;
  const a = exit != null && trunk != null ? Math.min(exit, trunk) : (exit != null ? exit : trunk);
  // the slab its inlet opens from: just under its deck where it leaves its space through the space's top ('up': a
  // casing or hatch leaving a space below E deck), just over it where it stands on its deck inside its space
  const yIn = sides.length === 1 ? (sides[0] === 'P' ? Math.max(yc, 0.3) : Math.min(yc, -0.3)) : (yc === 0 ? 0.3 : yc);
  const slab = R.slabAt(ship, xc, yIn, v.opens === 'up' ? zIn - 0.3 : zIn + 0.3);
  return { x_m: [r4(x0), r4(x1)], y_m: [r4(y0), r4(y1)], z_in_m: r4(zIn), z_top_m: r4(zTop), trunk_m2: trunk == null ? null : r4(trunk), exit_m2: exit == null ? null : r4(exit), area_m2: a == null ? null : r4(a), slab };
}
const DERIVED = ['x_m', 'y_m', 'z_in_m', 'z_top_m', 'trunk_m2', 'exit_m2', 'area_m2', 'slab'];

if (require.main === module) {
  const V = JSON.parse(fs.readFileSync(FILE, 'utf8')), ship = C.buildShip();
  let differ = 0;
  for (const v of V.rows) {
    const d = derive(v, ship);
    for (const k of DERIVED) if (JSON.stringify(v[k]) !== JSON.stringify(d[k])) differ++;
    Object.assign(v, d);
    console.log(v.id.padEnd(7) + (v.kind).padEnd(9) + (v.space.zone + ':' + v.space.sides.join('') + ':' + v.space.layer).padEnd(9) + 'in ' + v.deck.padEnd(6) + 'top ' + v.top.padEnd(5) + 'z ' + v.z_in_m.toFixed(2) + '..' + v.z_top_m.toFixed(2) + '  area ' + (v.area_m2 == null ? '-' : v.area_m2.toFixed(2)) + ' m2  [' + v.tag + ']  ' + v.name.slice(0, 70));
  }
  if (process.argv.includes('--write')) { fs.writeFileSync(FILE, JSON.stringify(V, null, 1) + '\n'); console.log('written: ' + V.rows.length + ' rows, ' + differ + ' derived fields changed'); }
  else console.log(V.rows.length + ' rows; derived fields that differ from the file: ' + differ + (differ ? ' (run with --write)' : ''));
}
module.exports = { derive, DERIVED, frameM, rows3 };
