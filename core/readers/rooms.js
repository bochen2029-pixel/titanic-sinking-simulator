// Her rooms, level 0: R1 of docs/BRAINSTORM_rooms_and_a_walk_through_her_v1_1_2026-11-20.md, as Z2 set it on
// 2026-11-20 (the reason is below).
// Each of the core's 64 spaces is cut at her decks into slabs: a deck's space in one watertight compartment, one side.
// That makes about 250 slabs. Each slab's water is shared out from the core's own: the space's water below its level, by
// the core's own column cut, scaled so that the slabs of a space hold exactly the space's water. The core's pockets (W6's
// bunker, G7's tank, whose water it keeps apart) go to their space's lowest slab, as much as each holds; a pocket's
// over-fill (its water past its capacity, standing for the sea's head over its top) has no place and is kept apart
// (overfill). Slabs and over-fill together are the readouts' water, as C.spaceWater summed.
// A library, as girder.js is: it keeps no state, registers no reader and steps nothing; it is called when a slab's water
// is wanted. So no fingerprint can move, and the forecast never meets it.
// Why not a model of the slabs free of the core at level 0 (the brainstorm's way b): inside each of the core's spaces
// her decks are open floor (the core has one volume to a space). A free model of the slabs would either reproduce the
// core (with the decks open, nothing is learned) or need openings through her decks that no source gives yet. The free
// model waits for her rooms and their openings (the brainstorm's R3 on, read from the deck plans under
// docs/research/RESEARCH_rooms_plans_licence_v1_1_2026-11-20.md); this table is what they will replace, slab by slab.
// The slabs:
// - The cuts are her decks at each column's place (C.deckZ, with her sheer). Below E deck (the core's own cut between its
//   two layers) the cuts are G and F deck; above it D, C, B, A and the Boat deck.
// - A slab is named by the deck that is its floor, "below G" being the lowest (the tank top's or the peak's floor).
// - [stand-in] a deck is cut through the whole compartment, though in the boiler and engine rooms there is none: there,
//   such a slab is a band of the space, not a room.
// - The slabs of a space sum to the core's nodeVmax: the top slab takes the remainder, so the sum is exact.
// It reads the core's own ship (sim.ship: its columns and their entries per space) and copies none of its laws.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../core.js'));
  else root.TitanicRooms = factory(root.TitanicCore);
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';
  const FLOORS = [['below G', 'G', 'F'], ['E', 'D', 'C', 'B', 'A', 'Boat']];   // each layer's slab floors, keel up
  const CUTS = [['G', 'F'], ['D', 'C', 'B', 'A', 'Boat']];                    // the decks that cut a layer, keel up
  const cache = new WeakMap();

  // the level-0 table of a ship: each slab's space (n: zone, side, layer), floor deck, capacity and footprint, and for
  // each of its columns the interval it holds (the column's entry in the space, cut at the decks)
  function table(ship) {
    let T = cache.get(ship);
    if (T) return T;
    const c = ship.cols, list = [], byNode = [];
    const ec = [], elo = [], ehi = [], es = [];   // the slabs' column pieces: column, bottom, top, slab
    const start = new Int32Array(C.NN + 1);       // where each space's pieces begin (they are pushed space by space)
    for (let n = 0; n < C.NN; n++) {
      start[n] = ec.length;
      const k = n >> 2, side = (n >> 1) & 1, layer = n & 1, mu = ship.nodeMu[n];
      const floors = FLOORS[layer], cuts = CUTS[layer], S = floors.length;
      const vol = new Float64Array(S), foot = new Float64Array(S), pieces = Array.from({ length: S }, () => []);
      for (let j = ship.nodeStart[n]; j < ship.nodeStart[n] + ship.nodeCount[n]; j++) {
        const i = ship.entCol[j], a = ship.entA[j], e = ship.entE[j], x = c.x[i], w = c.dxdy[i];
        for (let s = 0; s < S; s++) {
          const lo = s === 0 ? a : Math.max(a, C.deckZ(cuts[s - 1], x));
          const hi = s === S - 1 ? e : Math.min(e, C.deckZ(cuts[s], x));
          if (hi > lo + 1e-9) { vol[s] += w * (hi - lo); foot[s] += w; pieces[s].push([i, lo, hi]); }
        }
      }
      const idx = [];
      let sum = 0, last = -1;
      for (let s = 0; s < S; s++) if (pieces[s].length) last = s;
      for (let s = 0; s < S; s++) {
        if (!pieces[s].length) continue;
        const vmax = s === last ? ship.nodeVmax[n] - sum : mu * vol[s];   // the top slab takes the remainder: the sum is exact
        sum += vmax;
        const id = list.length;
        list.push({ id, n, zone: k, side, layer, floor: floors[s], vmax, foot: mu * foot[s], key: k + ':' + (side ? 'S' : 'P') + ':' + floors[s] });
        for (const [i, lo, hi] of pieces[s]) { ec.push(i); elo.push(lo); ehi.push(hi); es.push(id); }
        idx.push(id);
      }
      byNode.push(idx);
    }
    start[C.NN] = ec.length;
    T = { list, byNode, col: Int32Array.from(ec), lo: Float64Array.from(elo), hi: Float64Array.from(ehi), slab: Int32Array.from(es), start };
    cache.set(ship, T);
    return T;
  }

  // the water of space n below the world's level L at the pose F (m3), and its rate with L (m2): the core's column cut
  function cutAt(T, c, mu, n, F, L) {
    let v = 0, a = 0;
    for (let q = T.start[n]; q < T.start[n + 1]; q++) {
      const i = T.col[q], zc = (L - (F.R20 * c.x[i] + F.R21 * c.y[i] + F.tz)) / F.R22;
      if (zc <= T.lo[q]) continue;
      if (zc < T.hi[q]) { v += mu * c.dxdy[i] * (zc - T.lo[q]); a += mu * c.dxdy[i] / F.R22; }
      else v += mu * c.dxdy[i] * (T.hi[q] - T.lo[q]);
    }
    return [v, a];
  }
  // each slab's water (m3 of sea, as the core's sim.vol), from the core's own. The level is the one at which the space's
  // own water lies below it, at the pose F (sim._F, the frame of the core's last flows, else her pose now), by the core's
  // column cut; it is found from the core's sim.level (solved before that step's flows) by Newton's steps, kept inside
  // a bracket. The slabs then hold exactly sim.vol, and none holds more than it can unless the space is over-full; the
  // water past the top goes to the top slab.
  function waterOf(sim, F, out) {
    const T = table(sim.ship), c = sim.ship.cols;
    F = F || sim._F || C.frameOf(sim);
    const w = out && out.length === T.list.length ? out.fill(0) : new Float64Array(T.list.length);
    for (let n = 0; n < C.NN; n++) {
      const V = sim.vol[n]; if (!(V > 0)) continue;
      const ids = T.byNode[n]; if (!ids.length) continue;
      const mu = sim.ship.nodeMu[n], Vmax = sim.ship.nodeVmax[n];
      if (V >= Vmax) {                          // full, or over-full ("pressed up", as the core lets a space be)
        for (const id of ids) w[id] = T.list[id].vmax;
        w[ids[ids.length - 1]] += V - Vmax;
        continue;
      }
      // the bracket: the space's lowest and highest points in the world at this pose
      let lo = Infinity, hi = -Infinity;
      for (let q = T.start[n]; q < T.start[n + 1]; q++) {
        const i = T.col[q], b = F.R20 * c.x[i] + F.R21 * c.y[i] + F.tz;
        const z0 = b + F.R22 * T.lo[q], z1 = b + F.R22 * T.hi[q];
        if (z0 < lo) lo = z0; if (z1 > hi) hi = z1;
      }
      let L = Math.min(hi, Math.max(lo, sim.level[n]));
      for (let it = 0; it < 60; it++) {
        const [v, a] = cutAt(T, c, mu, n, F, L), d = V - v;
        if (Math.abs(d) <= 1e-12 * Vmax) break;
        if (d > 0) lo = L; else hi = L;
        const Ln = a > 0 ? L + d / a : NaN;
        L = Ln > lo && Ln < hi ? Ln : 0.5 * (lo + hi);   // Newton's step, or halve the bracket
      }
      let got = 0;
      for (let q = T.start[n]; q < T.start[n + 1]; q++) {
        const i = T.col[q], zc = (L - (F.R20 * c.x[i] + F.R21 * c.y[i] + F.tz)) / F.R22;
        const top = zc < T.hi[q] ? zc : T.hi[q];
        if (top > T.lo[q]) { const v = mu * c.dxdy[i] * (top - T.lo[q]); w[T.slab[q]] += v; got += v; }
      }
      // the last trace of difference, to the slab the surface stands in (never more than rounding)
      if (got !== V) { let s = ids[0]; for (const id of ids) if (w[id] > 0 && w[id] < T.list[id].vmax) s = id; w[s] += V - got; }
    }
    // A pocket's own water (W6's bunker, G7's tank) is kept by the core outside sim.vol and counted in its space
    // (C.spaceWater: a pocket of both sides half to each half). As much of it as the pocket holds, min(vol, cap), goes to
    // that space's lowest slab. Both pockets lie below G deck: the bunker inside that slab's place, the tank under the
    // orlop's flat beneath it.
    // The rest, its over-fill, stands for the sea's head over its top (the core's law, as for over-full spaces: a stiff
    // virtual area, params.bunkerAov), not for water with a place. A mirror that sums water must keep it, and one that
    // places water must not place it (the mainline, 11-21). So it is kept apart (overfill, below): the slabs and the
    // over-fill together are the readouts' water, and no slab holds water above a pocket's top
    for (const k of sim.pockets || []) {
      const held = Math.min(k.vol, k.cap); if (!(held > 0)) continue;
      const put = (n, v) => { const ids = T.byNode[n]; if (ids && ids.length) w[ids[0]] += v; };
      if (k.side < 0) { put(k.node, 0.5 * held); put(k.node - 2, 0.5 * held); } else put(k.node, held);
    }
    return w;
  }
  // the pockets' over-fill (m3 of sea): each pocket's water past its capacity, which the core keeps for the sea's head
  // over its top and which has no place. With waterOf's slabs it makes the readouts' water (waterM3)
  function overfill(sim) {
    const out = [];
    (sim.pockets || []).forEach((k, j) => { if (k.vol > k.cap) out.push({ j, name: k.name, node: k.node, side: k.side, m3: k.vol - k.cap }); });
    return out;
  }

  // the water on each deck, all her compartments and sides together (m3): the slabs whose floor is that deck
  function byDeck(sim, F) {
    const T = table(sim.ship), w = waterOf(sim, F), out = {};
    for (const s of T.list) out[s.floor] = (out[s.floor] || 0) + w[s.id];
    return out;
  }

  // the slab holding a point of her frame (x, y, z): its zone, side, and the deck below z there; -1 outside her spaces
  function slabAt(ship, x, y, z) {
    const T = table(ship), k = C.zoneAt(x), side = y >= 0 ? 0 : 1, layer = z >= C.deckZ('E', x) ? 1 : 0, n = C.nodeIndex(k, side, layer);
    const floors = FLOORS[layer], cuts = CUTS[layer];
    let s = 0;
    for (let d = 0; d < cuts.length; d++) if (z >= C.deckZ(cuts[d], x)) s = d + 1;
    const want = floors[s];
    for (const id of T.byNode[n]) if (T.list[id].floor === want) return id;
    return -1;
  }

  return { FLOORS, CUTS, table, waterOf, overfill, byDeck, slabAt };
});
