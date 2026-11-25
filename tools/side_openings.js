// C4 (the calibration epoch): the openings in her side on D and E deck, from R3's table of the deck plans
// (data/rooms/openings.json; docs/research/RESEARCH_rooms_openings_v1_1_2026-11-21.md), as the rows of the core's
// SIDE_OPENINGS (core/core.js). The core cannot read a file (it is bundled into the page and the forecast's worker), so
// it carries the table as numbers; this tool is how they were had, and tools/stairs_tests.js holds the two equal.
//   node tools/side_openings.js       print the table as the core writes it (paste it over SIDE_OPENINGS after a change
//                                     to the data's D or E deck rows)
// A row: [deck, kind, a, b, side, zone, count, x]: a and b the plan's size in inches (b 0 for a round light), side 0 to
// port and 1 to starboard, zone the model's compartment (C.zoneAt of each opening's own frame), x the mean of those
// openings' places, m forward of amidships. One row for the like openings of one side in one compartment.
// kind: light (a round sidelight), pivot (Utley's pivoting sidelight, a rectangle), top and bottom (the first-class
// saloon's pairs: the top light that opens, the bottom light that does not), door (a door in her side), doorwin (the
// sliding windows in a door's leaf: the plan prints two to a door).
'use strict';
const fs = require('fs');
const path = require('path');
const C = require('../core/core.js');
const RT = require('./rooms_table.js');

const DECKS = ['D', 'E'];
function kindOf(r) {
  if (r.kind === 'door in her side') return 'door';
  if (r.kind === 'window') return 'doorwin';
  if (r.kind !== 'sidelight') return null;
  if (r.shape === 'rect') return 'pivot';
  if (/^TOP LIGHTS/.test(r.plan)) return 'top';
  if (/^BOTTOM LIGHTS/.test(r.plan)) return 'bottom';
  return 'light';
}
// the table, and what the data says of each deck and side: openings counted and their clear area (the rows' own area_m2)
function derive(root) {
  root = root || path.join(__dirname, '..');
  const read = (f) => JSON.parse(fs.readFileSync(path.join(root, 'data', 'rooms', f), 'utf8'));
  const O = read('openings.json'), tables = {}, groups = new Map(), totals = {}, unused = [];
  for (const d of DECKS) tables[d] = read(d + '_deck.json');
  for (const r of O.rows) {
    if (!DECKS.includes(r.deck)) continue;
    const kind = kindOf(r), side = r.side === 'P' ? 0 : r.side === 'S' ? 1 : -1;
    if (!kind || side < 0 || r.in !== 'her side' || !r.count || !r.size_in) { unused.push(r.id); continue; }
    const t = totals[r.deck + side] || (totals[r.deck + side] = { deck: r.deck, side, count: 0, area: 0 });
    t.count += r.count; t.area += r.area_m2;
    // each opening at its own frame; a door's windows stand at their door (the plan gives them no frames of their own)
    const at = Array.isArray(r.positions) && r.positions.length === r.count ? r.positions : Array.from({ length: r.count }, () => r.x[0]);
    for (const f of at) {
      const x = RT.frameM(tables[r.deck], f), zone = C.zoneAt(x);
      const a = r.size_in[0], b = r.shape === 'round' ? 0 : r.size_in[1];
      const key = [r.deck, kind, a, b, side, zone].join('|');
      const g = groups.get(key) || { deck: r.deck, kind, a, b, side, zone, n: 0, sx: 0 };
      g.n++; g.sx += x; groups.set(key, g);
    }
  }
  const rows = [...groups.values()].map((g) => [g.deck, g.kind, g.a, g.b, g.side, g.zone, g.n, +(g.sx / g.n).toFixed(2)]);
  rows.sort((p, q) => (p[0] < q[0] ? -1 : p[0] > q[0] ? 1 : 0) || p[4] - q[4] || q[7] - p[7] || (p[1] < q[1] ? -1 : p[1] > q[1] ? 1 : 0));
  return { rows, totals: Object.values(totals), unused };
}
const line = (r) => `['${r[0]}', '${r[1]}', ${r[2]}, ${r[3]}, ${r[4]}, ${r[5]}, ${r[6]}, ${r[7]}]`;
function literal(rows) {
  const out = [];
  for (let i = 0; i < rows.length; i += 3) out.push('    ' + rows.slice(i, i + 3).map(line).join(', ') + ',');
  return out.join('\n');
}

module.exports = { derive, literal, line, DECKS };
if (require.main === module) {
  const T = derive();
  console.log(literal(T.rows));
  for (const t of T.totals) console.error(`${t.deck} deck, ${t.side ? 'starboard' : 'port'}: ${t.count} openings, ${t.area.toFixed(3)} m2`);
  console.error(T.rows.length + ' rows; rows of the data not used: ' + (T.unused.length ? T.unused.join(' ') : 'none'));
}
