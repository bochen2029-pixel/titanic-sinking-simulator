// Her rooms for NH2's cabin view (site/parts/79_cabins.js), as tools/build_site.js writes them into
// dist/assets/rooms.<hash>.json: R3's deck tables (data/rooms/<deck>_deck.json) as one slim asset of what
// core/readers/cabins.js reads (index, lookup, depth): each deck's deck, title and reference, and each row's id, kind,
// name, plan, x_m, y_m, its outline to 0.1 m (poly_m: a place moves 5 cm at most), its pieces and its 'beyond the model'
// tag. After the decks, each list of the people in her staterooms (data/rooms/occupants_*.json, NH2: the Cave list's
// first class): its table, title and source, and each line's n, cabin, labels and names, which cabins.js's index puts on
// the rows. With no such list the asset is the decks' alone, as before the lists. It is here, out of the build, so that
// tools/occupants_tests.js can hold the page's own copy to the files without building dist/.
'use strict';
const fs = require('fs');
const path = require('path');

function roomsAsset(root) {
  const d = path.join(root, 'data', 'rooms');
  const files = fs.existsSync(d) ? fs.readdirSync(d).filter(f => /_deck\.json$/.test(f)).sort() : [];
  const lists = fs.existsSync(d) ? fs.readdirSync(d).filter(f => /^occupants_.*\.json$/.test(f)).sort() : [];
  const r1 = (v) => Math.round(v * 10) / 10;
  const people = lists.map(f => {
    const T = JSON.parse(fs.readFileSync(path.join(d, f), 'utf8'));
    return { table: T.table, title: T.title || null,
      source: T.source ? { title: T.source.title || null, what: T.source.what || null, urls: T.source.urls || [] } : null,
      rows: (T.rows || []).map(r => ({ n: r.n, cabin: r.cabin, labels: r.labels, names: r.names })) };
  });
  return JSON.stringify(files.map(f => {
    const T = JSON.parse(fs.readFileSync(path.join(d, f), 'utf8'));
    return { deck: T.deck, title: T.title || null, reference: T.reference || null, rows: (T.rows || []).map(r => ({
      id: r.id, kind: r.kind, name: r.name, plan: r.plan, x_m: r.x_m, y_m: r.y_m,
      poly_m: Array.isArray(r.poly_m) ? r.poly_m.map(p => [r1(p[0]), r1(p[1])]) : null,
      pieces: (r.pieces || []).map(p => ({ zone: p.zone, side: p.side, slab: p.slab, area: p.area, key: p.key })),
      tags: (r.tags || []).filter(t => t === 'beyond the model') })) };
  }).concat(people));
}

module.exports = { roomsAsset };
