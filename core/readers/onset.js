/*
 * The onset of the break (stage B2 of docs/DESIGN_the_break_and_two_bodies_v1_2026-11-19.md, section 4.3, step 1): the
 * first step at which, somewhere along her, the hull girder gauge's bending moment and shear (core/readers/girder.js,
 * moment(sim): relieved by her inertia, its defaults) reach what her hull could bear there (core/readers/section.js: the
 * ultimate moment in the sense the moment acts, hogging or sagging, and the shear capacity):
 *
 *     (M / Mu)^2 + (V / Vu)^2 >= 1
 *
 * That step, its time, the station, the moment and the capacity there, the sense, her trim and her list are recorded
 * once. It is an event that breaks nothing: it writes nothing into the model and pushes nothing into sim.events. A watch
 * has the same fingerprint with it as without (tools/strength_tests.js). Splitting her there is stages B3 and B4.
 *
 *   start(opts)            a fresh state for a run: { k, next, found, peak, looks, ... }
 *   look(sim, st)          after each step: compares when due (below); records the onset once; returns st.found
 *   check(sim, opts)       the comparison now, at every station: the worst station's { r, u, x, M, Mu, V, Vu, sense, ... };
 *                          with { all: true } every station's too; `over`, the stations at or past 1 (found.over keeps
 *                          them for the onset's step: the torn zone of stage B4 starts there)
 *   run(sim, opts)         a damage preset run to its end with look() after every step (headless): the state
 *   describe(found)        "she would break at x -24.4 m (boiler room 1), hogging, 4.9 of 5.0 GN m"
 *   the reader             registered with core/night.js as 'onset': its state is sim.onset, stepped after every step
 *   the night's own check  on a watch handed over at the onset (handover 'onset'), core/night.js carries the check
 *                          itself (D76 b): sim.night.onset is start()'s state, looked at by the night's step before the
 *                          readers, so that the watch's copies, its forecast and a watch with no readers meet the same
 *                          onset; the reader then only mirrors it (sim.onset is the same object). The night finds the two
 *                          functions in the reader's registration (check: { start, look }).
 *
 * The plain functions serve a damage preset the same way (the page's girder part keeps the state itself there, outside
 * the sim): st = start(); after every C.step(sim): look(sim, st).
 *
 * The stations. The gauge's own: every slice edge of her columns (along the whole hull) and every station of its break
 * band (bulkhead K to J, every half metre and the named points). A station where the section has no hull worth the name
 * (the stem's and the stern's tips) is passed over.
 *
 * When it looks. Comparing costs one moment(sim) (about a tenth of a millisecond to half of one); every step of a page
 * at 900 times her pace that would cost more than the model. So it looks every step only near the onset: after a look
 * with the worst station at u = sqrt(r), the next is due min(MAX_GAP, max(1, floor((1 - u) / RATE))) steps later. RATE
 * is a bound on how fast u can grow in one step [stated, not physics: tools/strength_tests.js measures the 1912 night's
 * fastest and prints it beside RATE]; if a look ever finds the onset more than one step after the one before it, the
 * record says so (exact: false, and the steps it lies between), so a broken bound shows instead of hiding. opts.every
 * looks every step (the tests prove the two give the same step).
 *
 * Time. T is minutes after the touch on a watch, after the damage (t = 0) on a preset; the clock is the page's.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../core.js'), require('../night.js'), require('./girder.js'), function () { return require('./section.js'); });
  // the page bundles core/readers/*.js in name order, so section.js comes after this file: it is found when first used
  else root.TitanicOnset = factory(root.TitanicCore, root.TitanicNight, root.TitanicGirder, function () { return root.TitanicSection; });
})(typeof self !== 'undefined' ? self : this, function (C, N, G, sectionLib) {
  'use strict';
  if (!C || !G) return null;
  const RATE = 0.01;       // the most u may grow in one step between looks [stated: a schedule, tested, not a property of her]
  const MAX_GAP = 120;     // never more than 30 s between looks
  const DEG = 180 / Math.PI;

  // the stations: the gauge's slice edges and its band, as one list (cached by ship), and the capacities there
  const STATIONS = new WeakMap();
  function stationsOf(sim, res, sopts) {
    const S = sectionLib(), ship = sim.ship, key = JSON.stringify(sopts || {});
    let byShip = STATIONS.get(ship); if (!byShip) { byShip = new Map(); STATIONS.set(ship, byShip); }
    let st = byShip.get(key); if (st) return st;
    const nH = res.hull.x.length, nB = res.band.x.length, list = [];
    for (let j = 0; j < nH; j++) list.push({ src: 'hull', i: j, x: res.hull.x[j] });
    for (let i = 0; i < nB; i++) list.push({ src: 'band', i, x: res.band.x[i] });
    const keep = [];
    for (const s of list) { const a = S.at(ship, s.x, sopts); if (a.none || !(a.hog.Mu > 0) || !(a.sag.Mu > 0) || !(a.Vu > 0)) continue; s.hog = a.hog.Mu; s.sag = a.sag.Mu; s.Vu = a.Vu; s.where = a.where; keep.push(s); }
    st = { list: keep, nHull: nH, nBand: nB };
    byShip.set(key, st);
    return st;
  }

  // The comparison now. opts: { section: options for core/readers/section.js (a what-if: { scale } and so on), all:
  // true for every station's ratio as well (the torn zone of stage B4: the stations past 1) }. `over` always lists the
  // stations at or past 1, worst first.
  function check(sim, opts) {
    opts = opts || {};
    const res = G.moment(sim);
    const st = stationsOf(sim, res, opts.section);
    let best = null;
    const all = opts.all ? [] : null, over = [];
    for (const s of st.list) {
      const H = s.src === 'hull' ? res.hull : res.band;
      const M = H.M[s.i], V = H.V[s.i], Mu = M >= 0 ? s.hog : s.sag;
      const m = M / Mu, v = V / s.Vu, r = m * m + v * v, sense = M >= 0 ? 'hogging' : 'sagging';
      if (all) all.push({ x: s.x, where: s.where, r, M, Mu, V, Vu: s.Vu, sense, src: s.src });
      if (r >= 1) over.push({ x: s.x, r });
      if (!best || r > best.r) best = { r, x: s.x, where: s.where, M, Mu, V, Vu: s.Vu, sense, src: s.src };
    }
    if (best) best.u = Math.sqrt(best.r);
    over.sort((a, b) => b.r - a.r || a.x - b.x);
    return { best, all, over, res, t: sim.t, trimDeg: sim.pitch * DEG, listDeg: sim.roll * DEG };
  }

  function start(opts) {
    return { k: 0, next: 0, last: -1, found: null, peak: null, looks: 0, opts: opts || {} };
  }
  // T: minutes after the touch on a watch (null before it), after t = 0 on a preset
  function Tof(sim) { const w = sim.night; return w ? (w.tTouch >= 0 ? (sim.t - w.tTouch) / 60 : null) : sim.t / 60; }
  // the step: the watch's own count; on a preset the steps taken since t = 0 (t is a whole number of steps of dt)
  function stepOf(sim) { return sim.night ? sim.night.k : Math.round(sim.t / sim.params.dt); }
  function look(sim, st) {
    const k = stepOf(sim);
    st.k = k;
    if (st.found || k < st.next) return st.found;
    const c = check(sim, st.opts), b = c.best;
    st.looks++;
    if (!b) { st.next = k + MAX_GAP; st.last = k; return null; }
    if (!st.peak || b.r > st.peak.r) st.peak = { r: b.r, u: b.u, k, t: sim.t, x: b.x, where: b.where, M: b.M, Mu: b.Mu, V: b.V, Vu: b.Vu, sense: b.sense, trimDeg: c.trimDeg, listDeg: c.listDeg };
    if (b.r >= 1) {
      const T = Tof(sim);
      // exact: the step before was looked at too (or this is her first step), so this is the first step past it; a state
      // started late in a run, or a schedule outrun, says so instead
      st.found = { k, t: sim.t, T, x: b.x, where: b.where, sense: b.sense, M: b.M, Mu: b.Mu, V: b.V, Vu: b.Vu, r: b.r,
        trimDeg: c.trimDeg, listDeg: c.listDeg, exact: st.last >= 0 ? k - st.last <= 1 : k <= 1, after: st.last,
        over: c.over.map(o => o.x) };                              // every station at or past 1 on that step, worst first
      return st.found;
    }
    const gap = st.opts.every ? 1 : Math.min(MAX_GAP, Math.max(1, Math.floor((1 - b.u) / RATE)));
    st.last = k; st.next = k + gap;
    return null;
  }
  // a damage preset (or any sim without a watch) to its end, looking after every step: the state, with found or not
  function run(sim, opts) {
    opts = opts || {};
    const st = start(opts), tMax = opts.tMax || 5 * 3600;
    look(sim, st);
    while (!sim.foundered && sim.t < tMax) {
      C.step(sim);
      look(sim, st);
      if (opts.stopAtOnset && st.found) break;
      if (opts.stopWhenStable && sim.t > 3600 && Math.abs(sim.inflow) < 0.02 && Math.abs(sim.wth) < 1e-5 && Math.abs(sim.vz) < 1e-3) break;
    }
    return st;
  }
  const f1 = (v) => (Math.round(v * 10) / 10).toFixed(1);
  function describe(found) {
    if (!found) return 'no onset';
    return 'she would break at x ' + f1(found.x) + ' m (' + found.where + '), ' + found.sense + ', ' + f1(Math.abs(found.M) / 1e9) + ' of ' + f1(found.Mu / 1e9) + ' GN m';
  }

  // the reader: attached to every watch; stepped after each step; owns no orders; draws nothing at random. On a watch
  // whose night carries the check (an onset watch, D76 b) it mirrors the night's state and does not look itself
  if (N && N.reader) N.reader({
    name: 'onset', state: 'onset',
    check: { start, look: (sim, st) => (sectionLib() ? look(sim, st) : null) },
    attach(sim) { sim.onset = sim.night && sim.night.onset ? sim.night.onset : start(); },
    step(sim) {
      if (sim.night && sim.night.onset) { sim.onset = sim.night.onset; return; }
      if (sim.onset && sectionLib()) look(sim, sim.onset);
    },
  });

  return { RATE, MAX_GAP, start, look, check, run, describe, stationsOf, Tof, stepOf };
});
