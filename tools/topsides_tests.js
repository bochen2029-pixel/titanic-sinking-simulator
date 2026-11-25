// Her topsides as the viewer draws them (site/topsides.js), checked as numbers in Node.
//   node tools/topsides_tests.js          (a second)
// MUST rows: the data against the topsides note (docs/research/RESEARCH_topsides_dimensions_v1_2026-11-19.md, section 10)
// and against the model it must agree with (the people reader's boat stations, the core's staircases and tiers); the
// builders' arrays sound (no NaN, no degenerate triangle, indices in range, outward normals, port and starboard alike);
// every house on its deck and inside her hull. CHECK rows print what is worth seeing and fail only on their own line.
'use strict';
const C = require('../core/core.js');
const BP = require('../core/readers/people.js');
const TS = require('../site/topsides.js');
const V = require('../site/visuals.js');
const FT = C.FT, DEG = Math.PI / 180;
const rows = []; let fails = 0, checks = 0;
function row(kind, what, value, ref, ok) { rows.push([kind, what, value, ref, ok]); if (!ok) { if (kind === 'MUST') fails++; else checks++; } }
const f = (x, n) => (x === null || x === undefined || Number.isNaN(x) ? 'n/a' : (+x).toFixed(n === undefined ? 2 : n));
// G24 (D95): the model's hull is the default ship's, her ends restored above 11.0 m since D4 (buildShip's hullEnds), and
// the drawn shell stands on it (TS.useHull); every row below that measures against "the model's hull" measures this one
const HULL = C.buildShip().hull;
TS.useHull(HULL);
const B = TS.built(), N = TS.N;

// ---- 1. the arrays are sound
{
  let nan = 0, badIdx = 0, deg = 0, tris = 0;
  const meshes = Object.entries(B.faces).concat([['glass', B.glass], ['arm', TS.davitArm()]]);
  for (const [, m] of meshes) {
    const p = m.pos, I = m.idx, nv = p.length / 3;
    for (const v of p) if (!Number.isFinite(v)) nan++;
    for (const i of I) if (!(i >= 0 && i < nv)) badIdx++;
    for (let t = 0; t < I.length; t += 3) {
      const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
      const ux = p[b] - p[a], uy = p[b + 1] - p[a + 1], uz = p[b + 2] - p[a + 2], vx = p[c] - p[a], vy = p[c + 1] - p[a + 1], vz = p[c + 2] - p[a + 2];
      if (Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) < 1e-8) deg++;
    }
    tris += I.length / 3;
  }
  for (const L of [B.edges, B.rails, B.rigging, B.windows]) for (const v of L) if (!Number.isFinite(v)) nan++;
  row('MUST', 'every array finite, every index in range, no degenerate triangle', nan + ' NaN, ' + badIdx + ' bad indices, ' + deg + ' degenerate of ' + tris + ' triangles', '0, 0, 0', nan === 0 && badIdx === 0 && deg === 0);
  row('CHECK', 'what is drawn', Object.entries(B.faces).map(([k, m]) => k + ' ' + m.idx.length / 3).join(', ') + '; glass ' + B.glass.idx.length / 3 + '; ' + B.edges.length / 6 + ' edges, ' + B.rails.length / 6 + ' rail and ' + B.rigging.length / 6 + ' rigging segments, ' + B.windows.length / 7 + ' windows', 'triangles by colour; a few draw calls', true);
}
// ---- 2. normals outward on every solid the builders record
{
  const bad = [], P = (b, i) => [B.faces[b].pos[i * 3], B.faces[b].pos[i * 3 + 1], B.faces[b].pos[i * 3 + 2]];
  for (const s of B.solids) {
    if (s.open) continue;
    let nBad = 0;
    for (let t = s.t0; t < s.t1; t++) {
      const I = B.faces[s.b].idx, a = P(s.b, I[t * 3]), b = P(s.b, I[t * 3 + 1]), c = P(s.b, I[t * 3 + 2]);
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], g = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
      let ok = true;
      if (s.inside) ok = (g[0] - s.inside[0]) * n[0] + (g[1] - s.inside[1]) * n[1] + (g[2] - s.inside[2]) * n[2] > 0;
      else if (s.up) ok = n[2] > 0;
      else if (s.side) ok = s.side * n[1] > 0;
      else if (s.facing) ok = s.facing * n[0] > 0;
      else if (s.axis) {
        const [A, Bq] = s.axis, d = [Bq[0] - A[0], Bq[1] - A[1], Bq[2] - A[2]], L2 = d[0] * d[0] + d[1] * d[1] + d[2] * d[2];
        const k = ((g[0] - A[0]) * d[0] + (g[1] - A[1]) * d[1] + (g[2] - A[2]) * d[2]) / L2, r = [g[0] - A[0] - k * d[0], g[1] - A[1] - k * d[1], g[2] - A[2] - k * d[2]];
        const dot = r[0] * n[0] + r[1] * n[1] + r[2] * n[2]; ok = s.inward ? dot < 0 : dot > 0;
      }
      if (!ok) nBad++;
    }
    if (nBad) bad.push(s.name + ' (' + nBad + ')');
  }
  row('MUST', 'every closed solid\'s triangles face outward (houses, boxes, decks up, side plates outboard, funnels, masts)', bad.length ? bad.slice(0, 6).join('; ') : B.solids.filter(s => !s.open).length + ' solids, all outward', 'none inward', bad.length === 0);
}
// ---- 3. port and starboard alike where they should be: each set mirrored onto itself, within 0.1 m
{
  const mirrored = (pos, tol) => {
    const key = (x, y, z) => Math.round(x / tol) + ',' + Math.round(y / tol) + ',' + Math.round(z / tol), set = new Set();
    for (let i = 0; i < pos.length; i += 3) for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1]) for (const dz of [-1, 0, 1]) set.add(key(pos[i] + dx * tol, pos[i + 1] + dy * tol, pos[i + 2] + dz * tol));
    let miss = 0; for (let i = 0; i < pos.length; i += 3) if (!set.has(key(pos[i], -pos[i + 1], pos[i + 2]))) miss++;
    return miss;
  };
  const out = [];
  for (const k of ['deck', 'grey', 'dark', 'black', 'buff', 'cap', 'mast']) out.push([k, mirrored(B.faces[k].pos, 0.1)]);
  out.push(['rails', mirrored(B.rails, 0.1)], ['rigging', mirrored(B.rigging, 0.1)], ['glass', mirrored(B.glass.pos, 0.1)]);
  const dv = B.davits, davOk = TS.DAVIT_X.every(x => dv.some(d => d.x === x && d.side > 0) && dv.some(d => d.x === x && d.side < 0) && Math.abs(dv.find(d => d.x === x && d.side > 0).pivot[1] + dv.find(d => d.x === x && d.side < 0).pivot[1]) < 1e-9);
  row('MUST', 'port and starboard alike: decks, roofs, coamings, funnels, masts, rails, rigging, the domes\' glass, the davits', out.filter(([, m]) => m).map(([k, m]) => k + ' ' + m + ' unmatched').join(', ') || 'every vertex has its mirror within 0.1 m; davits ' + (davOk ? 'paired' : 'NOT paired'), 'all mirrored (the white houses are not: the gymnasium and the reading room stand to one side)', out.every(([, m]) => m === 0) && davOk);
}
// ---- 4. the Boat deck and its houses: on the deck, inside her
{
  const bd = N.boatDeck, edgeOk = [-70, -40, 0, 30, 60].every(x => Math.abs(TS.deckEdge(x) - C.halfBreadth(x, C.deckZ('Boat', x), HULL)) < 1e-12);
  row('MUST', 'the Boat deck: x ' + bd.x0 + ' to ' + bd.xFront + ' on the centreline, its edge the model\'s hull (C.halfBreadth), 9.8 m a side at its after edge', 'aft edge ' + f(TS.deckEdge(bd.x0)) + ' m a side, full by ' + bd.fullFrom + '; front ' + f(TS.frontX(0)) + ' to ' + f(TS.frontX(TS.deckEdge(bd.xFrontSide))) + ' at the sides', 'the note 1.1: -77.8 to +72.5, +69.6 at the sides; 9.8 m', edgeOk && bd.x0 === -77.8 && bd.xFront === 72.5 && Math.abs(TS.frontX(TS.deckEdge(bd.xFrontSide)) - 69.6) < 1e-9 && Math.abs(TS.deckEdge(bd.x0) - 9.8) < 1e-9);
  const out = [];
  for (const H of N.houses) for (const [x0, x1, yS, yP] of H.secs) for (const x of [x0, x1]) for (const y of [yS, yP]) {
    const z0 = C.deckZ('Boat', x), z1 = z0 + H.h;
    if (Math.abs(y) > TS.deckEdge(x) + 1e-9 || Math.abs(y) > C.halfBreadth(x, z1, HULL) + 1e-9 || Math.abs(y) > C.halfBreadth(x, z0, HULL) + 1e-9) out.push(H.id + ' at ' + x + ', ' + y);
    if (x < bd.x0 || x > TS.frontX(y)) out.push(H.id + ' off the deck at ' + x);
  }
  row('MUST', 'every house on the Boat deck inside its outline and inside her hull\'s half-breadth at its foot and its roof', out.length ? out.slice(0, 5).join('; ') : N.houses.length + ' houses, every corner inside', 'none outside', out.length === 0);
  const cb = N.cabs, xc = (cb.x0 + cb.x1) / 2, over = TS.deckEdge(xc) + cb.out - TS.deckEdge(xc);
  row('MUST', 'the wing cabs alone stand out over her side: by the note\'s 0.4 m', f(over) + ' m beyond the deck\'s edge at x ' + f(xc, 1) + ', ' + cb.w + ' m wide, x ' + cb.x0 + ' to ' + cb.x1, 'the note 1.2: +67.6 to +69.6, 0.4 m out', Math.abs(over - 0.4) < 1e-9 && cb.x0 === 67.6 && cb.x1 === 69.6);
  // the note's section 10 BOAT_HOUSES, read back
  const NOTE = { wheelhouse: [64.8, 67.8, -2.95, 2.95, 2.4], officersHouse: [36.0, 64.8, -6.9, 6.9, 2.4], fwdEntrance: [26.3, 35.9, -8.6, 8.6, 3.9], funnel2House: [11.9, 26.1, -3.0, 3.05, 2.7], gymnasium: [11.9, 26.1, -8.54, -3.0, 3.0],
    readingRoof: [5.1, 17.0, 3.1, 8.9, 1.0], loungeRoof: [-14.1, 5.1, -8.9, 8.9, 1.0], funnel3Casing: [-23.0, -9.0, -3.0, 3.0, 2.9], engineCasingHouse: [-35.0, -26.6, -6.9, 6.9, 2.7], smokeRoomRoof: [-64.3, -43.9, -8.5, 8.7, 1.0],
    funnel4Casing: [-56.0, -49.0, -3.0, 3.0, 2.4], kennels: [-62.0, -57.0, -2.0, 2.0, 2.0], secondEntrance: [-72.2, -65.3, -2.8, 2.8, 2.3], liftMachinery: [-71.0, -67.0, -2.0, 2.0, 4.6] };
  const diffs = Object.entries(NOTE).filter(([id, v]) => { const H = N.houses.find(h => h.id === id); if (!H) return true; const s = H.secs[0]; return s[0] !== v[0] || s[1] !== v[1] || s[2] !== v[2] || s[3] !== v[3] || H.h !== v[4]; }).map(([id]) => id);
  row('MUST', 'the Boat deck\'s houses are the note\'s (section 10): x, y and height of each', diffs.length ? 'differ: ' + diffs.join(', ') : Object.keys(NOTE).length + ' houses as the note has them; the lounge\'s bays at -10.0 to -6.2 and -3.6 to 0.0 out to 10.0 m', 'the note 1.2, 10', diffs.length === 0);
}
// ---- 5. the funnels
{
  const F = N.funnel, NOTE = [[54.9, 49.89], [19.3, 50.34], [-16.3, 50.34], [-52.3, 49.89]];
  const geo = N.funnels.map(TS.funnelGeom);
  row('MUST', 'four funnels at the note\'s bases, 24 ft 6 in by 19 ft, raked 2 in in 12, the black band 18 ft 6 in', geo.map(g => f(g.f.x, 1)).join(', ') + ' m; ' + f(2 * F.a, 3) + ' x ' + f(2 * F.b, 3) + ' m; ' + f(F.rake / DEG, 3) + ' deg; ' + f(geo[0].sTop - geo[0].sBlack, 3) + ' m',
    '+54.9, +19.3, -16.3, -52.3; 7.468 x 5.791; 9.462 deg; 5.639 m', NOTE.every(([x], i) => geo[i].f.x === x) && Math.abs(2 * F.a - 7.4676) < 1e-9 && Math.abs(2 * F.b - 5.7912) < 1e-9 && Math.abs(Math.tan(F.rake) - 2 / 12) < 1e-12 && geo.every(g => Math.abs(g.sTop - g.sBlack - 18.5 * FT) < 1e-9));
  const top = geo.map((g, i) => ({ fwd: g.at(g.sTop, 0), rise: g.zTopFwd - C.deckZ('Boat', g.f.x), src: NOTE[i][1] - TS.srcDeckZ('Boat', g.f.x), abs: g.zTopFwd - NOTE[i][1] }));
  row('MUST', 'their tops\' forward high points: the sources\' height over the deck put on the model\'s deck (163 ft 8 in, 165 ft 2 in)', top.map(t => f(t.fwd[2], 2)).join(', ') + ' m; over the deck ' + top.map(t => f(t.rise, 3)).join(', '), 'Read: 49.89, 50.34, 50.34, 49.89 above the keel; the same over the source\'s deck, to 1 mm', top.every((t, i) => Math.abs(t.fwd[2] - geo[i].zTopFwd) < 1e-9 && Math.abs(t.rise - t.src) < 1e-3));
  row('CHECK', '  ... and against the keel: the model\'s sheer moves them by', top.map(t => (t.abs >= 0 ? '+' : '') + f(t.abs, 2)).join(', ') + ' m', 'under 0.5 m (the note 4.1: the core\'s sheer departs from Read\'s)', top.every(t => Math.abs(t.abs) < 0.5));
  const seat = N.funnels.map(fu => { const h = TS.roofUnder(fu.x, 0); return [fu.id, fu.seat, h.id, h.z - C.deckZ('Boat', fu.x)]; });
  row('MUST', 'each funnel seated on its casing\'s top (or just under its house\'s roof)', seat.map(s => 'No. ' + s[0] + ' at ' + s[1] + ' on ' + s[2] + ' (' + f(s[3], 2) + ')').join('; '), 'the seat within 0.06 m under the roof of the house it stands in', seat.every(s => s[2] && s[3] - s[1] >= -1e-9 && s[3] - s[1] <= 0.06));
  const sm = B.smoke, st = B.steam, smOk = sm.length === 3 && sm.every((s, i) => s.x === geo[i].top[0] && s.z === geo[i].top[2]) && st.length === 3 && st.every((s, i) => s.x === B.funnels[i].pipe.x && s.z === B.funnels[i].pipe.z);
  row('MUST', 'the smoke rises from the three working funnels\' top centres, the steam from their escape pipes\' mouths (one table)', sm.map(s => '(' + f(s.x, 1) + ', ' + f(s.z, 1) + ')').join(' ') + ' smoke; ' + st.map(s => '(' + f(s.x, 1) + ', ' + f(s.z, 1) + ')').join(' ') + ' steam', 'the note 2.1\'s top centres (+51.9, +16.1, -19.5; 49.3 to 49.7 m) and pipes; none from No. 4', smOk && !N.funnels[3].smoke);
}
// ---- 6. the masts, the crow's nest, the lights on them
{
  const [fo, mn] = B.masts, rk = [fo, mn].map(m => m.rake / DEG);
  row('MUST', 'the masts raked aft about 9.5 to 10 degrees, the foremast\'s foot on the forecastle deck at +95.0, the mainmast through A deck at -87.4', 'fore ' + f(rk[0], 2) + ' deg, foot (' + f(fo.foot[0], 2) + ', ' + f(fo.foot[2], 2) + '); main ' + f(rk[1], 2) + ' deg, at A deck (' + f(mn.foot[0], 2) + ', ' + f(mn.foot[2], 2) + ')',
    'the note 2.2: the profile 9.8-10.0; 95.0 +/- 0.7; -87.4 +/- 1.0', rk.every(r => r > 9.3 && r < 10.2) && Math.abs(fo.foot[0] - 95.0) < 0.7 && Math.abs(fo.foot[2] + 0.1 - C.deckZ('B', fo.foot[0])) < 0.05 && Math.abs(mn.foot[0] + 87.4) < 1.0 && Math.abs(mn.foot[2] + 0.1 - C.deckZ('A', mn.foot[0])) < 0.05);
  row('CHECK', '  ... their tops', 'fore (' + f(fo.top[0], 1) + ', ' + f(fo.top[2], 2) + '), main (' + f(mn.top[0], 1) + ', ' + f(mn.top[2], 2) + ')', 'The Shipbuilder\'s 205 ft over a 30-ft line, 71.6 m [bet]; the profile 69.1; within 0.6 m once re-based', Math.abs(fo.top[2] - 71.6) < 0.6 && Math.abs(mn.top[2] - 71.6) < 0.6);
  const n = B.nest, P = C.DEFAULT_PARAMS, zWL = P.draftA + (P.draftF - P.draftA) * (n.x - C.G.xAP) / (C.G.xFP - C.G.xAP), fore = TS.mastAxis(N.masts[0]);
  row('MUST', 'the crow\'s nest: the lookouts\' eye 29.0 m over the night\'s waterline, in the cage, 1 m forward of the foremast\'s axis', 'eye (' + f(n.eye.x, 2) + ', ' + f(n.eye.z, 2) + '), ' + f(n.eye.z - zWL, 3) + ' m over the water; cage ' + f(n.floor, 2) + ' to ' + f(n.rim, 2) + '; mast at ' + f(fore.xAt(n.eye.z), 2),
    'BWC "about 95 ft." (the note 7: keep it); x within 1.5 m of the old 93.5', Math.abs(n.eye.z - zWL - 29.0) < 1e-6 && n.eye.z > n.floor && n.eye.z < n.rim + 0.5 && Math.abs(n.eye.x - fore.xAt(n.eye.z) - 1.0) < 1e-6 && Math.abs(n.eye.x - 93.5) < 1.5);
  const L = Object.fromEntries(V.LIGHTS.map(l => [l.id, l.at])), cb = N.cabs, out = TS.deckEdge((cb.x0 + cb.x1) / 2) + cb.out;
  row('MUST', 'the masthead light on the drawn foremast; the side lights at the wing cabs\' outer faces', 'masthead (' + f(L.masthead[0], 2) + ', ' + f(L.masthead[2], 2) + ') on a mast at ' + f(fore.xAt(L.masthead[2]), 2) + '; side lights (' + f(L.port[0], 2) + ', +/-' + f(L.port[1], 2) + ')',
    'the note 6: x +90.0 at its height; x +68.6, the cabs\' outer faces', Math.abs(L.masthead[0] - fore.xAt(L.masthead[2])) < 1e-9 && Math.abs(L.masthead[0] - 90.0) < 0.5 && L.port[0] >= cb.x0 && L.port[0] <= cb.x1 && Math.abs(L.port[1] - (out + 0.12)) < 1e-9 && Math.abs(L.starboard[1] + L.port[1]) < 1e-12);
}
// ---- 7. the davits and the boats: one convention with the people reader
{
  const NOTE_ALT = [66.18, 56.16, 45.85, 35.53, 25.45, -31.85, -42.19, -52.29, -62.35, -72.58];   // the note 3.1, "a frame at amidships"
  const conv = TS.FRAME0 ? NOTE_ALT : [65.72, 55.70, 45.39, 35.07, 24.99, -31.39, -41.74, -51.84, -61.89, -72.13];
  row('MUST', 'the ten davit stations at Read\'s frames and shifts, both sides (' + (TS.FRAME0 ? 'a frame at amidships, the people reader\'s convention' : 'no frame 0, the note\'s') + ')', TS.DAVIT_X.map(x => f(x, 2)).join(', '), 'the note 3.1: ' + conv.join(', '), TS.DAVIT_X.every((x, i) => Math.abs(x - conv[i]) < 0.006) && B.davits.length === 20);
  const off = [];
  BP.BOATS.forEach((b, i) => {
    const st = BP.STATION[i];
    if (b.type === 'lifeboat' || b.type === 'cutter') { const d = TS.davitsOf(st.x); if (!d || d.err > 0.01) off.push(b.id + ' ' + (d ? f(d.err, 3) : 'none')); }
    else if (b.type === 'collapsible') { if (Math.abs(st.x - BP.STATION[BP.IDX[b.davits]].x) > 1e-9) off.push(b.id); }
  });
  const under = BP.BOATS.filter(b => b.type === 'lifeboat' || b.type === 'cutter').length;
  row('MUST', 'every boat under davits stands midway between two drawn davits (the people reader\'s stations); C and D at the cutters\'', off.length ? 'off: ' + off.join(', ') : under + ' boats, each within 0.01 m of her davits\' middle; ' + (2 * under) + ' arms', '16 boats, 32 arms; the reader\'s x (core/readers/people.js)', off.length === 0 && under === 16);
  // the boats stowed as they lay at 11:40 pm (drawn on a damage preset, where the boats part draws none)
  {
    const S = TS.stowedBoats(BP), bad = [], OH = N.houses.find(h => h.id === 'officersHouse'), [ox0, ox1, , oyP] = OH.secs[0];
    S.forEach((s, i) => {
      const d = BP.BOATS[i], st = BP.STATION[i], e = TS.deckEdge(s.x), half = s.B / 2, [L, Bm, D] = TS.BOAT_DIM[d.type];
      if (s.L !== L || s.B !== Bm || s.D !== D) bad.push(s.id + ' size');
      if (d.type === 'roof') { if (s.x !== d.stow.x || s.x < ox0 || s.x > ox1 || Math.abs(s.y) + half > oyP || Math.abs(s.z - (C.deckZ('Boat', s.x) + OH.h)) > 1e-9) bad.push(s.id + ' not on the officers\' roof'); }
      else {
        if (s.x !== st.x) bad.push(s.id + ' x');
        if (d.type === 'cutter') { if (!(Math.abs(s.y) - half > e)) bad.push(s.id + ' not swung out'); }
        else if (Math.abs(s.y) + half > e) bad.push(s.id + ' over the edge');
        if (Math.sign(s.y) !== (d.side === 'P' ? 1 : -1)) bad.push(s.id + ' side');
      }
    });
    const types = S.reduce((o, s) => (o[s.type] = (o[s.type] || 0) + 1, o), {});
    row('MUST', 'her twenty boats stowed as at 11:40 pm: lifeboats on their chocks inside the edge, the cutters swung out, C and D on deck, A and B on the officers\' roof', bad.length ? bad.join('; ') : S.length + ' boats (' + Object.entries(types).map(([k, v]) => v + ' ' + k).join(', ') + '), at the people reader\'s stations and the boats part\'s sizes', '20; as said', bad.length === 0 && S.length === 20 && types.lifeboat === 14 && types.cutter === 2 && types.collapsible === 2 && types.roof === 2);
  }
  const roof = BP.BOATS.filter(b => b.type === 'roof'), H = N.houses.find(h => h.id === 'officersHouse'), [x0, x1, , yP] = H.secs[0];
  const onRoof = roof.every(b => b.stow.x >= x0 && b.stow.x <= x1);
  row('CHECK', 'collapsibles A and B where the boats part puts them, on the drawn officers\' house\'s roof', roof.map(b => b.id + ' at x ' + b.stow.x).join(', ') + '; the house ' + x0 + ' to ' + x1 + ', +/-' + yP, 'on the roof; the note 3.2 puts them about +55, +/-5.3 (site/parts/50_boats.js has +64, +/-3.0)', onRoof);
  const arm = TS.ARM, e = TS.deckEdge(BP.STATION[BP.IDX['3']].x), pivotY = e - 0.9;
  const headIn = pivotY - arm.L * Math.sin(-arm.inDeg * DEG), headOut = pivotY + arm.L * Math.sin(arm.outDeg * DEG);
  row('CHECK', 'the arms\' heads over the boat stowed (edge - 1.6, site/parts/50_boats.js) and swung out (edge + 1.5)', 'in ' + f(headIn - e, 2) + ' m, out ' + f(headOut - e, 2) + ' m from the deck\'s edge', 'within 0.3 m [appearance]', Math.abs(headIn - e + 1.6) < 0.3 && Math.abs(headOut - e - 1.5) < 0.3);
}
// ---- 8. the dome covers: where the core puts the staircases (one source of truth)
{
  const out = [];
  for (const s of C.STAIRS) {
    if (!s.dome) continue;
    const d = B.domes.find(q => q.stair === s.id);
    if (!d) { out.push(s.id + ' not drawn'); continue; }
    const zg = C.deckZ(s.dome.deck, s.x) + s.dome.up;
    if (d.x !== s.x || Math.abs(d.zGlass - zg) > 1e-9 || Math.abs(d.a - s.dome.l / 2) > 1e-12 || Math.abs(d.b - s.dome.b / 2) > 1e-12) out.push(s.id + ' at ' + d.x + ', glass ' + f(d.zGlass, 3));
  }
  row('MUST', 'a dome cover over each staircase where core/core.js has it (C.STAIRS: x, glass up over its deck, l by b)', out.length ? out.join('; ') : B.domes.map(d => d.id + ' x ' + d.x + ', glass ' + f(d.zGlass, 2) + ' m, ' + f(2 * d.a, 1) + ' x ' + f(2 * d.b, 1) + ', on ' + (d.under || 'the deck')).join('; '), 'the same numbers, read at run time', out.length === 0 && B.domes.length === C.STAIRS.filter(s => s.dome).length);
  const fwd = B.domes.find(d => d.stair === 'F'), H = N.houses.find(h => h.id === 'fwdEntrance'), [x0, x1, yS, yP] = H.secs[0];
  row('CHECK', '  ... the forward one on the forward entrance\'s roof, inside its outline', fwd ? 'x ' + f(fwd.x - fwd.a, 2) + ' to ' + f(fwd.x + fwd.a, 2) + ', +/-' + f(fwd.b, 2) + ' on ' + fwd.under + ' (' + x0 + ' to ' + x1 + ', +/-' + yP + ')' : 'none', 'inside', !!fwd && fwd.under === 'fwdEntrance' && fwd.x - fwd.a >= x0 && fwd.x + fwd.a <= x1 && fwd.b <= yP && -fwd.b >= yS);
}
// ---- 9. the core's tiers (the superstructure the flooding model carries) lie on the drawn houses
{
  const T = C.TIER;
  if (!T) row('CHECK', 'the core\'s tiers (C.TIER)', 'none in this core', 'nothing to compare', true);
  else {
    const out = [], drawn = N.houses.filter(h => !/^loungeBay/.test(h.id)), stated = [];
    for (const h of T.houses) {
      // the drawn houses with its ends (within 1 m), taken together: their extent, their outermost wall, their plan area
      const over = drawn.filter(H => Math.abs(H.secs[0][0] - h.x0) <= 1 && Math.abs(H.secs[H.secs.length - 1][1] - h.x1) <= 1);
      if (!over.length) { out.push('none at ' + h.x0 + ' to ' + h.x1); continue; }
      const X0 = Math.min(...over.map(H => H.secs[0][0])), X1 = Math.max(...over.map(H => H.secs[H.secs.length - 1][1]));
      const HW = Math.max(...over.flatMap(H => H.secs.map(s => Math.max(-s[2], s[3])))), sym = over.every(H => H.secs.every(s => Math.abs(s[2] + s[3]) < 0.1));
      const area = over.reduce((A, H) => A + H.secs.reduce((a, s) => a + (s[1] - s[0]) * (s[3] - s[2]), 0), 0), hs = over.map(H => H.h);
      const okX = Math.abs(X0 - h.x0) <= 1 && Math.abs(X1 - h.x1) <= 1, okH = h.h >= Math.min(...hs) - 1 && h.h <= Math.max(...hs) + 1;
      // the stated exception: the core builds its columns in port and starboard pairs, so a house the drawing has to one
      // side (funnel 2's with the gymnasium to starboard) is symmetric there with the same plan area (C.TIER's comment)
      const ratio = area / ((h.x1 - h.x0) * 2 * h.hw), okW = Math.abs(HW - h.hw) <= 1 || (!sym && Math.abs(ratio - 1) < 0.15);
      if (okW && Math.abs(HW - h.hw) > 1) stated.push(h.x0 + '..' + h.x1 + ': the core +/-' + h.hw + ' symmetric, the drawing ' + f(Math.min(...over.flatMap(H => H.secs.map(s => s[2]))), 2) + ' to +' + f(Math.max(...over.flatMap(H => H.secs.map(s => s[3]))), 2) + ', plan area ' + f(100 * (ratio - 1), 1) + ' %');
      if (!(okX && okW && okH)) out.push(h.x0 + '..' + h.x1 + ' +/-' + h.hw + ' h ' + h.h + ' against ' + f(X0, 1) + '..' + f(X1, 1) + ' +/-' + f(HW, 2) + ' h ' + hs.join('/'));
    }
    row('MUST', 'every house of the core\'s tiers (C.TIER.houses) lies within 1 m of a drawn house or raised roof, but the stated exception', out.length ? out.join('; ') : T.houses.length + ' core houses within 1 m (x, half-breadth, height); stated exception: ' + (stated.join('; ') || 'none'), 'the flooding\'s tiers and the drawing never drift apart; the core\'s paired columns make an asymmetric house symmetric (same area)', out.length === 0);
    const aw = N.aHouse.map(s => s[2]), bx = [C.G.wellAft[1], C.G.wellFwd[0]];
    const narrow = N.aHouse.find(s => s[2] < T.houseA - 1), vol = narrow ? 2 * (T.houseA - narrow[2]) * (narrow[1] - narrow[0]) * (C.G.deck.Boat - C.G.deck.A) : 0;
    row('CHECK', '  ... and the decks: B deck\'s house well to well, A deck and its screen; the stated exception: A deck\'s house', 'core B ' + T.B.join(' to ') + ', drawn ' + bx.map(x => f(x, 1)).join(' to ') + '; core A ' + T.A.join(' to ') + ', drawn ' + N.aDeck.x0 + ' to ' + N.aDeck.x1 + '; screen from ' + T.screen + ' (drawn ' + N.screen.x0 + '); A house +/-' + T.houseA + ' all along (drawn ' + aw.join(', ') + (narrow ? '; abreast the casings ' + narrow[0] + ' to ' + narrow[1] + ' the core shuts in about ' + f(vol, 0) + ' m3 the drawing has open: backlog' : '') + ')',
      'within 1 m; C.TIER kept simpler on purpose (the coordinator)', Math.abs(T.B[0] - bx[0]) <= 1 && Math.abs(T.B[1] - bx[1]) <= 1 && Math.abs(T.A[0] - N.aDeck.x0) <= 1 && Math.abs(T.A[1] - N.aDeck.x1) <= 1 && Math.abs(T.screen - N.screen.x0) <= 1);
  }
}
// ---- 10. her paint and her windows
{
  const xs = [-100, -50, 0, 50, 100], sl = xs.map(x => TS.sheerLineZ(x) - C.deckZ('B', x));
  const scut = [], W = B.windows;
  for (let i = 0; i < W.length; i += 7) if (W[i + 5] < 0.4 && W[i + 6] < 0.4) scut.push([W[i], W[i + 2]]);
  const inWhite = scut.filter(([x, z]) => z - 0.17 > TS.sheerLineZ(x) + N.sheerLine / 2).length;
  row('MUST', 'the yellow sheer line under her white top strake, 2.1 m below B deck\'s sheer [bet]; C deck\'s scuttles in the white', sl.map(v => f(v, 2)).join(', ') + ' m; ' + inWhite + ' of ' + scut.length + ' scuttles wholly above the line', 'the photographs at the quay and leaving Belfast (the note 5 puts the black up to B deck: reported)', sl.every(v => Math.abs(v + N.strake) < 1e-9) && inWhite === scut.length && scut.length > 100);
  let offFace = 0;
  for (let i = 0; i < W.length; i += 7) {
    const x = W[i], y = W[i + 1], z = W[i + 2], ny = W[i + 4], hb = TS.hullDraw(x, z);
    if (Math.abs(ny) > 0.9 && Math.abs(Math.abs(y) - hb - 0.03) > 1e-6) {          // at her side, or on a house's wall
      const onHouse = N.houses.some(H => H.secs.some(([a, b, yS, yP]) => x >= a && x <= b && (Math.abs(y - yP - 0.03) < 1e-6 || Math.abs(y - yS + 0.03) < 1e-6))) || Math.abs(Math.abs(y) - TS.aHouseHw(x) - 0.03) < 1e-6 || Math.abs(Math.abs(y) - TS.deckEdge((N.cabs.x0 + N.cabs.x1) / 2) - N.cabs.out - 0.03) < 1e-6;
      if (!onHouse) offFace++;
    }
  }
  row('MUST', 'every window on a drawn face: her side, a house\'s wall, a front', offFace + ' of ' + W.length / 7 + ' off any face', '0 (laid 3 cm proud of the face)', offFace === 0);
  // G24: a MUST since the drawn shell stands on her hull with its ends (before, 215 of 620 lay up to 2.55 m inside it)
  const lit = V.portholes(), litB = B.lit.length, inside = lit.filter(p => Math.abs(p[1]) < C.halfBreadth(p[0], p[2], HULL) - 0.01).length;
  row('MUST', 'the lit ports and windows (site/visuals.js) on her side, B deck\'s and the screen\'s from these; none inside the model\'s hull with her ends', lit.length + ' lit, of ' + litB + ' windows offered from the topsides; ' + inside + ' inside her side', 'none inside (G24)', inside === 0);
}

// ---- 11. her stern as drawn: round, as the deck plan has it (Bo's correction); the model's own hull below the waterline
{
  const S = TS.STERN;
  // G24: measured against the model's hull with her ends (HULL), along her whole length, stem to stern
  let inside = 0, under = 0, moved = 0, n = 0, maxOut = 0, worst = 0, worstAt = null;
  for (let x = -139.0; x <= 139.0; x += 0.25) for (let z = 0; z <= 25; z += 0.25) {
    const m = C.halfBreadth(x, z, HULL), d = TS.hullDraw(x, z); n++;
    const knuckle = x < S.kFwd && z > S.z0 && z < TS.knuckleZ(x);      // T1: under the counter's knuckle
    if (d < m - 1e-12) { if (knuckle) under++; else { inside++; if (m - d > worst) { worst = m - d; worstAt = [x, z]; } } }
    if ((z <= S.z0 || x >= S.x0) && d !== m) moved++;
    maxOut = Math.max(maxOut, d - m);
  }
  row('MUST', 'the drawn shell inside the model\'s hull (her ends restored, D4) only under the counter\'s knuckle, stem to stern; the model\'s own at and below the load waterline (z 10.5) and forward of -75', inside + ' inside elsewhere' + (worstAt ? ' (up to ' + f(worst, 2) + ' m at x ' + f(worstAt[0], 2) + ', z ' + f(worstAt[1], 2) + ')' : '') + ', ' + moved + ' moved where it must not be, of ' + n + ' points (' + under + ' under the knuckle); at most ' + f(maxOut, 2) + ' m outside it', '0, 0 (the flooding\'s hull is not changed: core/; G24)', inside === 0 && moved === 0 && under > 50 && maxOut > 0);
  // T1: the counter's underside where the profile draws it: open just below its line abaft the post, shell just above
  const off2 = [], xEnd = S.post - S.counter[S.counter.length - 1][0], cap = TS.knuckleZ(xEnd + 0.01);
  let capped = 0;
  for (const [d, z0] of S.counter) {
    if (!(d > 0.05) || d > 9.3) continue;
    const z = Math.min(z0, cap); if (z0 > cap) capped++;   // held under the name where the profile stands higher (see below)
    const x = S.post - d, lo = TS.hullDraw(x, z - 0.1), hi = TS.hullDraw(x, z + 0.1);
    if (!(lo === 0 && hi > 0.1)) off2.push(f(d, 2) + ' m abaft the post: ' + f(lo, 2) + ' below, ' + f(hi, 2) + ' above');
  }
  // the name across her counter (site/app.js: 0.25 to 2.15 m under the sheer line at her end) stands on the drawn shell
  const zl = TS.sheerLineZ(xEnd), bare = [];
  for (let d = 0.1; d <= 13; d += 0.1) for (const z of [zl - 2.15, zl - 1.2, zl - 0.25]) if (!(TS.hullDraw(xEnd + d, z) > 0)) bare.push(f(d, 1) + ' m from her end at ' + f(z, 2));
  row('MUST', 'the name across her counter stands on the drawn shell (its band 0.25 to 2.15 m under the sheer line, 13 m round from her end)', bare.length ? bare.length + ' points off it, e.g. ' + bare.slice(0, 3).join('; ') : 'every point on it (band ' + f(zl - 2.15, 2) + ' to ' + f(zl - 0.25, 2) + ' m)', 'all on it (T1 first hid it: 2026-11-20)', bare.length === 0);
  row('CHECK', '  ... where the profile and the name disagree: the drawn knuckle held under the name', capped + ' of the profile\'s points above the name\'s foot (' + f(zl - 2.15, 2) + ' m); the knuckle held at ' + f(cap, 2) + ' m from ' + f(S.post - (S.counter.find(p => p[1] > cap) || [0])[0], 2) + ' aft; the profile has ' + f(S.counter[S.counter.length - 2][1], 2) + ' m at her end', 'reported: the profile (a modern reconstruction) against the photographs of her ends', true);
  const runAt = (x, z) => TS.hullDraw(x, z) <= C.halfBreadth(x, S.z0, HULL) + 1e-12;
  const run = [-129.0, -127.0, -124.0, -120.0].every(x => runAt(x, TS.knuckleZ(x) - 0.1));
  row('MUST', 'the counter\'s underside drawn where the ET profile has it (17.1 m at the stern post), held under the name near her end; below it open abaft the post, her run\'s lines forward of it', off2.length ? off2.join('; ') : (S.counter.length - 2) + ' points of the profile: open 0.1 m below, shell 0.1 m above; knuckle ' + f(TS.knuckleZ(S.post - 0.01), 2) + ' m at the post, ' + f(TS.knuckleZ(-138.5), 2) + ' at -138.5 (the model\'s counter from 11 m); the run at x -129 to -120 its waterline\'s ' + run, 'Bo\'s inboard profile 12_53_26 (0.233 m a pixel)', off2.length === 0 && run && Math.abs(TS.knuckleZ(S.post - 0.01) - 17.08) < 0.05);
  const RU = V.RUDDER, heel = V.STERN.rudder.heel, rTop = heel + RU[RU.length - 1][0], kPost = TS.knuckleZ(S.post - 0.01);
  const hk = kPost - heel, ik = RU.findIndex(p => p[0] >= hk), chordK = ik > 0 ? RU[ik - 1][1] + (RU[ik][1] - RU[ik - 1][1]) * (hk - RU[ik - 1][0]) / (RU[ik][0] - RU[ik - 1][0]) : NaN;
  row('CHECK', '  ... the rudder\'s head (site/visuals.js) reaches the counter\'s underside: no gap between them', 'blade to ' + f(rTop, 2) + ' m, the counter at the post ' + f(kPost, 2) + ' m; the blade ' + f(chordK, 2) + ' m wide there, its last ' + f(rTop - kPost, 2) + ' m inside the counter', 'the blade reaches it (its stock enters the counter)', rTop >= kPost);
  const xe = C.xAft(C.zTopAt(-138)), zAt = (x) => C.zTopAt(x) - 0.01, off = [];
  for (const [d, hb] of S.plan) if (d > 0) { const x = xe + d, got = TS.hullDraw(x, zAt(x)), want = Math.min(hb, C.halfBreadth(0, zAt(x), HULL)); if (Math.abs(got - want) > 1.0) off.push(d + ' m: ' + f(got) + ' against ' + f(hb)); }
  row('MUST', 'at the poop deck\'s edge it meets the stations measured off the deck plan within a metre', off.length ? off.join('; ') : S.plan.length - 1 + ' stations: ' + [2.18, 5.61, 11.35, 19.37, 34.27].map(d => f(d, 1) + ' m ' + f(TS.hullDraw(xe + d, zAt(xe + d)), 2)).join(', ') + ' m a side', 'Bo\'s deck plan 12_53_54, column by column (0.229 m a pixel)', off.length === 0);
  // round, not a point: the edge's direction at the end is athwartships (its slope dy/dx grows without bound at the end)
  const sl = [0.001, 0.004, 0.016].map(d => (TS.hullDraw(xe + 2 * d, zAt(xe)) - TS.hullDraw(xe + d, zAt(xe))) / d), ang = Math.atan(sl[0]) / DEG;
  const pointed = C.halfBreadth(xe + 0.002, zAt(xe)) / 0.002;
  row('MUST', 'the stern\'s end round: the deck edge meets it athwartships, not in a point', 'edge at ' + f(ang, 1) + ' deg to her centre line 1 mm from the end (slopes ' + sl.map(s => f(s, 1)).join(', ') + '); the fitted form\'s ' + f(Math.atan(pointed) / DEG, 1) + ' deg', 'over 85 deg; the fitted form (her hull before her ends) closes to a point', ang > 85 && sl[0] > sl[1] && sl[1] > sl[2]);
  const lit = V.portholes().filter(p => p[0] < -75), onShell = lit.filter(p => Math.abs(Math.abs(p[1]) - TS.hullDraw(p[0], p[2]) - 0.06) < 1e-9).length;
  row('MUST', 'her ports aft lit on the drawn shell, not on the model\'s narrower hull', onShell + ' of ' + lit.length + ' lights abaft -75 at the drawn side + 0.06 m', 'all', onShell === lit.length && lit.length > 20);
}

for (const [kind, what, value, ref, ok] of rows) console.log((ok ? 'PASS ' : (kind === 'MUST' ? 'FAIL ' : 'CHECK ')) + kind.padEnd(6) + what.padEnd(100) + ' ' + String(value).padEnd(60) + ' ' + ref);
console.log(fails ? '\nFAIL: ' + fails + ' MUST row(s)' + (checks ? ', ' + checks + ' CHECK row(s) off' : '') : '\nPASS: all ' + rows.filter(r => r[0] === 'MUST').length + ' MUST rows' + (checks ? '; ' + checks + ' CHECK row(s) off' : ''));
process.exit(fails ? 1 : 0);
