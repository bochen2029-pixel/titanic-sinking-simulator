/*
 * Her lights by circuit: G1 of docs/DESIGN_the_living_ship_v1_2026-11-23.md (NH15), "the sea shorts a section before the
 * dynamos fail".
 *
 * A reader of the watch (core/night.js, "readers"): attached to every watch, stepped after the model's own step. Its
 * state is sim.circuits, plain data. It reads the plant's supply (sim.plant: power, lights) and the core's water (sim.vol,
 * sim.level, at the pose of the core's last flows, sim._F) and writes into none of them; it pushes nothing into
 * sim.events and draws nothing at random. The plant keeps the supply: its lights (1 all her light, PLANT.emergency.lights
 * on the emergency dynamos alone, 0 none) stay what they are, and a watch has the same fingerprint with this reader as
 * without (tools/circuits_tests.js).
 *
 * Sources: the plant note, docs/research/RESEARCH_ship_systems_plant_v1_2026-11-16.md, section 5 (tags as there: [read]
 * in a source the note read, [bet] no source):
 * - about 10,000 lamps on the main circuit [read: the British Report, "Electrical Installation"];
 * - a separate emergency circuit, fed by the two emergency dynamos on D deck: 500 lamps "in passenger and crew passages,
 *   stairways, machinery spaces and the Boat deck" [read: ibid.];
 * - her lights aft burned until her after end went under, then went out gradually; flooding blows the fuses (Greaser
 *   Ranger agreed with counsel, BI 4110-4153) [read].
 * Not found: how the mains were divided, which of the Boat deck's lamps were on the emergency circuit, and how high the
 * fittings stood over her decks. So, each a bet until a source is found:
 * - [bet] a section is one of the slabs of core/readers/rooms.js: one deck's space in one watertight compartment on one
 *   side, 250 of them, in that table's order. Each section has a main circuit and an emergency circuit (the passages,
 *   stairways and machinery spaces run through every compartment; in a cargo hold's slab, a stand-in).
 * - [bet] a section's share of her light is its floor's share of all her floors (the slabs' footprints, by the core's
 *   columns). Of each section's share, the emergency circuit's is the plant's own PLANT.emergency.lights [bet there]: a
 *   share of her light, where the lamps' count would give 500 of 10,500.
 * - [bet] SET.short: a section's fuses blow, both its circuits together and for good, once the sea in its space stands
 *   1.2 m (about 4 ft, the switches by the doors) over the section's floor at its middle: the core's own level (sim.level,
 *   with more than 0.5 m3 of water in the space) against the world height of that point at the pose of the core's last
 *   flows, as the plant asks of a room's furnaces (wet() in core/systems.js). A section lower than SET.short blows when
 *   the sea reaches its deckhead there. A short blows its own fuses and drags nothing down (the design's question: the
 *   sources point to the fuse).
 * A circuit is lit while its supply has current, as the plant's lights say (a main circuit while the main dynamos run,
 * P.power; an emergency circuit while any dynamo runs, P.lights > 0), and its section's fuses hold. So her light by
 * circuit is the plant's lights times the share of her sections whose fuses hold: with no section shorted, the plant's
 * lights exactly.
 *
 * A watch's settings (spec.circuits, so that a replay carries them; SET when absent): short, m (Infinity: no fuse ever
 * blows, the plant's one level for the whole ship).
 *
 * sim.circuits:
 *   short       the bet in force, m
 *   emergency   the emergency circuits' share of each section's light (PLANT.emergency.lights at the watch's start)
 *   held        the share of her light whose sections' fuses hold (1 at the start)
 *   lit         her light by circuit now: P.lights x held (1 all her light, 0 none)
 *   out         how many sections' fuses have blown
 *   sections    [{ key, zone, side, floor, share, out }]: rooms.js's slabs in its order (key zone:P|S:floor; side 0 port,
 *               1 starboard; floor the deck the section stands on, 'below G' the lowest); share of her light; out the
 *               watch's clock (s) when its fuses blew, -1 while they hold
 * Circuits.list(sim) gives every circuit (main and emergency of each section) with its share and whether it is lit now.
 *
 * A preset has no readers (the page steps it with C.step and the plant's step): Circuits.start(sim, spec) gives it the
 * same state as a watch's sim.circuits, kept by the stepper, and Circuits.step(sim, st) carries it on after each step
 * (D97: the page's ports by their sections). Circuits.sectionOf(ship, x, y, z) is the section a point of her frame lies
 * in (rooms.js's slabAt), an index into sections, -1 outside her spaces: a port's light is its section's, lit while the
 * plant has light and the section holds (as tools/u3_lights.js draws them, version 2).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../core.js'), require('../night.js'), require('../systems.js'), () => require('./rooms.js'));
  else root.TitanicCircuits = factory(root.TitanicCore, root.TitanicNight, root.TitanicSystems, () => root.TitanicRooms);
})(typeof self !== 'undefined' ? self : this, function (C, N, Sys, roomsOf) {
  'use strict';
  if (!C || !N || !N.reader) return null;
  const SET = { short: 1.2 };       // m over a section's floor at its middle, at which its fuses blow [bet: the switches by the doors]
  const TRACE = 0.5;                // m3: less water than this in a space is no sea in it (the plant's wet())
  const cache = new WeakMap();

  // each section's place, by rooms.js's slabs (the bundle loads this file before rooms.js, so it is asked for when a watch
  // is made): its space n; the middle of its floor (x, y: its columns' centroid by their footprints; z: the mean of its
  // columns' bottoms there, the deck or, below G deck, the space's own bottom), m in her frame; its mean height h (its
  // volume over its footprint), m; its share of all her floors
  function table(ship) {
    let G = cache.get(ship);
    if (G) return G;
    const R = roomsOf(); if (!R) return null;
    const T = R.table(ship), c = ship.cols, S = T.list.length;
    const a = new Float64Array(S), ax = new Float64Array(S), ay = new Float64Array(S), az = new Float64Array(S), av = new Float64Array(S);
    for (let q = 0; q < T.col.length; q++) {
      const i = T.col[q], j = T.slab[q], w = c.dxdy[i];
      a[j] += w; ax[j] += w * c.x[i]; ay[j] += w * c.y[i]; az[j] += w * T.lo[q]; av[j] += w * (T.hi[q] - T.lo[q]);
    }
    let A = 0;
    for (let j = 0; j < S; j++) A += a[j];
    G = { list: T.list, n: new Int32Array(S), x: new Float64Array(S), y: new Float64Array(S), z: new Float64Array(S), h: new Float64Array(S), share: new Float64Array(S) };
    for (let j = 0; j < S; j++) {
      G.n[j] = T.list[j].n; G.x[j] = ax[j] / a[j]; G.y[j] = ay[j] / a[j]; G.z[j] = az[j] / a[j]; G.h[j] = av[j] / a[j]; G.share[j] = a[j] / A;
    }
    cache.set(ship, G);
    return G;
  }

  // a fresh state of her circuits for a run: a watch's sim.circuits (attach), or the one a preset's stepper keeps itself
  // (the page steps a preset with no readers: start, then step(sim, st) after each of the model's steps, as the onset's
  // check is kept). spec.circuits.short, where given, sets the bet
  function start(sim, spec) {
    const G = table(sim.ship); if (!G) return null;
    const set = spec && spec.circuits;
    const short = set && set.short !== undefined ? set.short : SET.short;
    return {
      short, emergency: Sys ? Sys.PLANT.emergency.lights : 0.15, held: 1, lit: sim.plant ? sim.plant.lights : 1, out: 0,
      sections: G.list.map((s, j) => ({ key: s.key, zone: s.zone, side: s.side, floor: s.floor, share: G.share[j], out: -1 })),
    };
  }
  function attach(sim, spec) { const S = start(sim, spec); if (S) sim.circuits = S; }

  // the world height of section j's switches at the pose F (its floor at its middle, SET.short over it, or its deckhead)
  function switchesZ(G, j, short, F) { return C.worldZ(F, G.x[j], G.y[j], G.z[j] + Math.min(short, G.h[j])); }

  // after each of the model's steps: a watch's own state (sim.circuits, the reader's step), or a preset's st
  function step(sim, st) {
    const S = st || sim.circuits; if (!S) return;
    const L = S.sections;
    if (S.out < L.length && S.short < Infinity) {
      const G = table(sim.ship), F = sim._F || C.frameOf(sim);
      let blew = false;
      for (let j = 0; j < L.length; j++) {
        if (L[j].out >= 0) continue;
        const n = G.n[j];
        if (sim.vol[n] > TRACE && sim.level[n] >= switchesZ(G, j, S.short, F)) { L[j].out = sim.t; S.out++; blew = true; }
      }
      if (blew) {      // the share still held, summed in the table's order (0 once every section has gone)
        let h = 0;
        if (S.out < L.length) for (let j = 0; j < L.length; j++) if (L[j].out < 0) h += L[j].share;
        S.held = h;
      }
    }
    S.lit = (sim.plant ? sim.plant.lights : 1) * S.held;
  }

  // every circuit, two to a section: { section (its index), kind 'main' | 'emergency', share of her light, lit now }; st as
  // for step
  function list(sim, st) {
    const S = st || sim.circuits; if (!S) return [];
    const P = sim.plant, main = !P || P.power, any = !P || P.lights > 0, out = [];
    S.sections.forEach((s, j) => {
      out.push({ section: j, kind: 'main', share: s.share * (1 - S.emergency), lit: main && s.out < 0 });
      out.push({ section: j, kind: 'emergency', share: s.share * S.emergency, lit: any && s.out < 0 });
    });
    return out;
  }

  // the section a point of her frame lies in (rooms.js's slabAt: its compartment, its side, the deck under it), as an index
  // into sections; -1 outside her spaces. A port, a window, any lamp of the drawn ship: its light is its section's
  function sectionOf(ship, x, y, z) { const R = roomsOf(); return R ? R.slabAt(ship, x, y, z) : -1; }

  N.reader({ name: 'circuits', state: 'circuits', attach, step });
  return { SET, TRACE, table, start, attach, step, list, switchesZ, sectionOf };
});
