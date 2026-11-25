/*
 * The observation ledger's operators (the calibration epoch, stage A3; the design, section 3.2; P-D1). The ledger is
 * data: core/scenarios.js RECORD_1912, one row for one thing one witness saw. This file reads a run against it.
 *
 *   start(sim)             a fresh run for this sim: { dtS, samples: [], pockets: [...], events, founderT, onsetT }
 *   sample(sim)            her state now as plain data: time, trim, list, the pose's third row, the 64 levels and
 *                          volumes, each pocket's water, the water aboard
 *   take(run, sim)         push sample(sim) onto the run (call it every 5 s of her time)
 *   close(run, sim, more)  the run's end: the core's own events (copied), the founder's time; more.onsetT, if the caller
 *                          ran core/readers/onset.js beside it
 *   evaluate(row, run)     one row's operator: { model, lo, hi, min, max, inRange, miss, reach, late, trimAtReach, note }
 *   evaluateAll(rows, run) the same for every row, in order
 *   problems(row)          what is wrong with a row's form (empty when it has the schema's fields and a known kind)
 *   series(row, run)       the row's quantity at every sample (the level kinds), for a chart or a test
 *
 * It is not a reader in the registering sense, as core/readers/girder.js is not: it keeps no state, registers nothing
 * with core/night.js, owns no orders. Nothing here writes into a sim: no event, no flag, no cache on it. So a run or a
 * watch has the same bits with it bundled, and with it sampling, as without (tools/ledger_tests.js). Its operators are
 * pure functions of a run's samples and a row; they use only the core's public functions (worldZ, deckZ, nodeIndex,
 * zoneAt, readouts, frameOf) and the state a snapshot carries (the pose, sim.level, sim.vol, the pockets' water).
 *
 * The operators, by kind. A level is in metres over the row's place, + up; `value` is the level the witness saw there.
 *   sea_at     the sea outside over the place: -worldZ(place). A witness who looked down a hatch or a stair is one of
 *              these: the trunk stood at the sea's level before the rooms beside it filled (QC E, E-12)
 *   water_in   the water inside the space the place lies in (its zone, its side, below or above E deck), over the
 *              place: sim.level of that space less worldZ(place); a dry space reads its floor (the tank top below E
 *              deck, E deck above). A place inside a holding pocket reads the pocket's own water, placed as the core
 *              places it: min(vol, cap) of its height (P-D1: place min(vol, cap), count vol)
 *   sounding   the depth of the space's own water over its floor at the place's x, on the centreline, the deeper side;
 *              0 when dry. A holding pocket's water is not the space's (boiler room 5's stokehold with the bunker of
 *              the fire holding is dry)
 *   angle      trim (+ by the bow) or list (+ to starboard), in degrees
 *   tonnage    the water aboard in tonnes, pockets counted whole (C.readouts(sim).waterM3 x 1.025)
 *   event      the time of one of the core's own events (place.mark: its id in sim.events), in minutes; or `toPort`,
 *              the last time she goes over to port past half a degree before T 150 (tools/pocket_tests.js's rule for
 *              D62's change of side), from the samples. One that never comes reads the run's end, with a note
 *   end        the founder flag's time, or the onset of the break's (run.onsetT, from core/readers/onset.js), minutes
 *
 * The verdict. The band is [value - sigma, value + sigma] (`two`; sigma null counts 0), value - sigma and up (`lower`),
 * value + sigma and down (`upper`), or sigma's own [lo, hi] (`interval`). For a level kind the model is read over the
 * row's time window, tLo to tHi: the row is in range when the model's values in the window meet the band (for a level
 * that only rises, that is "it passes the witness's level inside the window", or for a lower bound "it is there by the
 * window's end"). `model` is the value at t; `miss` how far that is outside the band (0 inside, signed); `reach` the
 * first time the quantity is at `value` and `late` how far that lies outside the window (minutes; + late, - early).
 * For an event or the end the model is a time and the band is in minutes.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../core.js'));
  else root.TitanicLedger = factory(root.TitanicCore);
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';
  if (!C) return null;
  const DEG = 180 / Math.PI, NN = C.NN, EPS = 1e-6;
  const FIELDS = ['id', 'witness', 'source', 'group', 'kind', 'place', 'value', 'unit', 't', 'tLo', 'tHi', 'sided', 'sigma', 'disc', 'role', 'tag', 'was'];
  const KINDS = ['sea_at', 'water_in', 'sounding', 'angle', 'event', 'tonnage', 'end'];
  const LEVEL_KINDS = ['sea_at', 'water_in', 'sounding', 'angle', 'tonnage'];   // read at a time; the others are times
  const SIDED = ['two', 'lower', 'upper', 'interval'];
  const ROLES = ['fit', 'held', 'report'];
  const UNITS = { sea_at: 'm', water_in: 'm', sounding: 'm', angle: 'deg', tonnage: 't', event: 'min', end: 'min' };

  // ------------------------------------------------------------------ the run: plain data taken from a sim
  function start(sim) {
    return {
      dtS: null, samples: [], events: [], founderT: null, onsetT: null, endT: null,
      pockets: (sim.pockets || []).map(k => ({ name: k.name, node: k.node, side: k.side, x0: k.x0, x1: k.x1, z0: k.z0, z1: k.z1, cap: k.cap, xc: k.xc, yc: k.yc, deck: k.deck || null })),
    };
  }
  function sample(sim) {
    const F = C.frameOf(sim);
    return {
      t: sim.t, trim: sim.pitch * DEG, list: sim.roll * DEG,
      R20: F.R20, R21: F.R21, R22: F.R22, tz: F.tz,
      level: Float64Array.from(sim.level.subarray ? sim.level.subarray(0, NN) : sim.level.slice(0, NN)),
      vol: Float64Array.from(sim.vol.subarray ? sim.vol.subarray(0, NN) : sim.vol.slice(0, NN)),
      pk: (sim.pockets || []).map(k => ({ vol: k.vol, state: k.state })),
      waterT: C.readouts(sim).waterM3 * C.RHO / 1000,
    };
  }
  function take(run, sim) { run.samples.push(sample(sim)); return run; }
  function close(run, sim, more) {
    run.events = sim.events.map(e => ({ t: e.t, id: e.id }));
    run.founderT = sim.foundered ? sim.founderT : null;
    run.endT = sim.t;
    run.onsetT = more && more.onsetT !== undefined ? more.onsetT : null;
    return run;
  }

  // ------------------------------------------------------------------ the geometry
  const worldZ = (s, x, y, z) => C.worldZ(s, x, y, z);      // a sample carries the frame's third row under the core's names
  const layerOf = (p) => (p.z < C.deckZ('E', p.x) ? 0 : 1);
  function pocketAt(run, s, p) {                          // the holding pocket the place lies in (the core's pocketOf), or -1
    if (layerOf(p) !== 0) return -1;
    const side = p.y >= 0 ? 0 : 1;
    for (let j = 0; j < run.pockets.length; j++) {
      const k = run.pockets[j];
      if (s.pk[j].state === 0 && (k.side < 0 || side === k.side) && p.x >= k.x0 && p.x <= k.x1 && p.z >= k.z0 && p.z <= (k.deck ? C.deckZ(k.deck, p.x) : k.z1)) return j;
    }
    return -1;
  }
  const seaAt = (run, s, p) => -worldZ(s, p.x, p.y, p.z);
  function waterIn(run, s, p) {
    const here = worldZ(s, p.x, p.y, p.z), j = pocketAt(run, s, p);
    if (j >= 0) {                                         // P-D1: the pocket's water placed as min(vol, cap) of its height
      const k = run.pockets[j], v = Math.min(s.pk[j].vol, k.cap);
      return worldZ(s, k.xc, k.yc, k.z0 + (k.z1 - k.z0) * (v > EPS ? v / k.cap : 0)) - here;
    }
    const layer = layerOf(p), n = C.nodeIndex(C.zoneAt(p.x), p.y >= 0 ? 0 : 1, layer);
    if (s.vol[n] > EPS) return s.level[n] - here;
    return worldZ(s, p.x, p.y, layer ? C.deckZ('E', p.x) : C.G.tankTop) - here;   // dry: its floor
  }
  function sounding(run, s, p) {
    const k = C.zoneAt(p.x), floor = worldZ(s, p.x, 0, p.z);
    let d = 0;
    for (let sd = 0; sd < 2; sd++) { const n = C.nodeIndex(k, sd, 0); if (s.vol[n] > EPS) d = Math.max(d, s.level[n] - floor); }
    return d;
  }
  function quantity(row, run, s) {
    const p = row.place;
    switch (row.kind) {
      case 'sea_at': return seaAt(run, s, p);
      case 'water_in': return waterIn(run, s, p);
      case 'sounding': return sounding(run, s, p);
      case 'angle': return p.what === 'trim' ? s.trim : s.list;
      case 'tonnage': return s.waterT;
      default: return NaN;
    }
  }
  function series(row, run) { return run.samples.map(s => quantity(row, run, s)); }

  // ------------------------------------------------------------------ reading a series
  // the value at tS seconds, between the two samples about it; past the last sample, the last
  function valueAt(run, q, tS) {
    const S = run.samples, n = S.length;
    if (!n) return NaN;
    if (tS <= S[0].t) return q[0];
    if (tS >= S[n - 1].t) return q[n - 1];
    let a = 0, b = n - 1;
    while (b - a > 1) { const m = (a + b) >> 1; if (S[m].t <= tS) a = m; else b = m; }
    const u = (tS - S[a].t) / (S[b].t - S[a].t);
    return q[a] + u * (q[b] - q[a]);
  }
  // the first time (s) the series is at or above v, between samples by a straight line; null if never
  function firstAt(run, q, v) {
    const S = run.samples;
    for (let i = 0; i < S.length; i++) {
      if (q[i] >= v) {
        if (i === 0 || q[i - 1] >= v || q[i] === q[i - 1]) return S[i].t;
        return S[i - 1].t + (S[i].t - S[i - 1].t) * (v - q[i - 1]) / (q[i] - q[i - 1]);
      }
    }
    return null;
  }
  function bandOf(row) {
    const s = row.sigma;
    if (row.sided === 'interval') return [s[0], s[1]];
    const w = typeof s === 'number' ? s : 0;
    if (row.sided === 'lower') return [row.value - w, Infinity];
    if (row.sided === 'upper') return [-Infinity, row.value + w];
    return [row.value - w, row.value + w];
  }
  const outside = (v, lo, hi) => (v < lo ? v - lo : (v > hi ? v - hi : 0));

  // D62's change of side as tools/pocket_tests.js reads it: the last time she goes over to port past half a degree,
  // before T 150 (seconds; null if she never does)
  function toPort(run) {
    let last = null, side = 0;
    for (const s of run.samples) {
      const sg = s.list > 0.5 ? 1 : (s.list < -0.5 ? -1 : 0);
      if (s.t < 150 * 60 && sg === -1 && side !== -1) last = s.t;
      if (sg !== 0) side = sg;
    }
    return last;
  }
  function timeOf(row, run) {
    const m = row.place.mark;
    if (row.kind === 'end') return m === 'onset' ? run.onsetT : run.founderT;
    if (m === 'toPort') return toPort(run);
    const e = run.events.find(e => e.id === m);
    return e ? e.t : null;
  }

  // ------------------------------------------------------------------ a row against a run
  function evaluate(row, run) {
    const band = bandOf(row), lo = band[0], hi = band[1];
    const out = { id: row.id, kind: row.kind, model: NaN, lo, hi, min: NaN, max: NaN, inRange: false, miss: NaN, reach: null, late: null, trimAtReach: null, note: '' };
    if (LEVEL_KINDS.indexOf(row.kind) >= 0) {
      const q = series(row, run), S = run.samples;
      const t0 = 60 * (row.tLo === null ? row.t : row.tLo), t1 = 60 * (row.tHi === null ? row.t : row.tHi);
      out.model = valueAt(run, q, 60 * row.t);
      let mn = Math.min(valueAt(run, q, t0), valueAt(run, q, t1)), mx = Math.max(valueAt(run, q, t0), valueAt(run, q, t1));
      for (let i = 0; i < S.length; i++) if (S[i].t > t0 && S[i].t < t1) { if (q[i] < mn) mn = q[i]; if (q[i] > mx) mx = q[i]; }
      out.min = mn; out.max = mx;
      out.inRange = mx >= lo && mn <= hi;
      out.miss = outside(out.model, lo, hi);
      if (row.kind !== 'angle') {                          // the kinds that rise: when the model is at the witness's level
        const tr = firstAt(run, q, row.value);
        if (tr !== null) {
          out.reach = tr / 60;
          out.late = outside(out.reach, t0 / 60, t1 / 60);
          if (row.kind === 'sea_at') out.trimAtReach = valueAt(run, S.map(s => s.trim), tr);
        } else out.note = 'never at the witness\'s level in the run';
      }
      if (run.founderT !== null && 60 * row.t > run.founderT) out.note = (out.note ? out.note + '; ' : '') + 'the witness\'s time is after the model\'s founder: read at the last sample';
    } else {
      const tS = timeOf(row, run);
      if (tS === null || tS === undefined) { out.model = (run.founderT !== null ? run.founderT : run.endT) / 60; out.note = 'never in the run: read as its end'; }
      else out.model = tS / 60;
      out.min = out.max = out.model;
      out.inRange = out.model >= lo && out.model <= hi;
      out.miss = outside(out.model, lo, hi);
      out.reach = tS === null || tS === undefined ? null : out.model;
      out.late = out.miss;
    }
    return out;
  }
  function evaluateAll(rows, run) { return rows.map(r => evaluate(r, run)); }

  // ------------------------------------------------------------------ a row's form
  function problems(row) {
    const bad = [];
    for (const f of FIELDS) if (!Object.prototype.hasOwnProperty.call(row, f)) bad.push('no ' + f);
    if (bad.length) return bad;
    if (KINDS.indexOf(row.kind) < 0) bad.push('kind ' + row.kind);
    if (SIDED.indexOf(row.sided) < 0) bad.push('sided ' + row.sided);
    if (ROLES.indexOf(row.role) < 0) bad.push('role ' + row.role);
    if (UNITS[row.kind] && row.unit !== UNITS[row.kind]) bad.push('unit ' + row.unit + ' for ' + row.kind);
    if (typeof row.value !== 'number' || !isFinite(row.value)) bad.push('value');
    if (typeof row.t !== 'number' || !isFinite(row.t)) bad.push('t');
    if (row.sided === 'interval' ? !(Array.isArray(row.sigma) && row.sigma.length === 2 && row.sigma[0] <= row.sigma[1]) : !(row.sigma === null || (typeof row.sigma === 'number' && row.sigma >= 0))) bad.push('sigma');
    if (row.tLo !== null && row.tHi !== null && !(row.tLo <= row.t && row.t <= row.tHi)) bad.push('tLo <= t <= tHi');
    if ((row.tLo === null) !== (row.tHi === null)) bad.push('tLo and tHi together');
    if (!row.tag || typeof row.tag.value !== 'string' || typeof row.tag.place !== 'string') bad.push('tag');
    if (!Array.isArray(row.was)) bad.push('was');
    if (!row.place || typeof row.place !== 'object') bad.push('place');
    else if (row.kind === 'sea_at' || row.kind === 'water_in' || row.kind === 'sounding') { for (const c of ['x', 'y', 'z']) if (typeof row.place[c] !== 'number' || !isFinite(row.place[c])) bad.push('place.' + c); }
    else if (row.kind === 'angle') { if (row.place.what !== 'trim' && row.place.what !== 'list') bad.push('place.what'); }
    else if (row.kind === 'event' || row.kind === 'end') { if (typeof row.place.mark !== 'string') bad.push('place.mark'); }
    for (const f of ['id', 'witness', 'source', 'group']) if (typeof row[f] !== 'string' || !row[f]) bad.push(f);
    return bad;
  }

  return { FIELDS, KINDS, LEVEL_KINDS, SIDED, ROLES, UNITS, start, sample, take, close, evaluate, evaluateAll, problems, series, bandOf, valueAt, firstAt, toPort };
});
