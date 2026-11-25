// The bunker of the fire against the record: Barrett's three rows of W6 (tools/pocket_tests.js's section 2), read on
// the 1912 preset run, with their numbers here and nowhere else. D87 (2026-11-21): they bind any landed member, so the
// history match's wave 1 holds them as hard filters (tools/history_match.js), and the pocket suite reads them from here.
//   const W6 = require('./w6_record.js'); const b = W6.tracker(sim); ... after every C.step(sim): b.step(); ...
//   const r = b.result(); W6.verdict(r) -> { fills, workable, burst, ok }
// - it fills to its capacity from the hull's openings inside it within 30 minutes;
// - while it holds, the stokehold (boiler room 5's lower spaces, both sides) has under 20 m3: Barrett, the pumps kept
//   boiler room 5 workable;
// - it gives way within T 50 to 75 (the pumps note: "the bunker door burst at about 12:40 (T 60)"; the Report: "about
//   an hour"; the head peaks at T 73, e76), and the stokehold then holds its water (over 200 m3 at once).
// Times are the run's own (seconds from the touch on the preset). A run with no bunker (bunker 0, or no coal list)
// fails every row.
'use strict';
const LIMITS = { fullBy: 30 * 60, stokeholdMax: 20, burst: [50 * 60, 75 * 60], afterMin: 200 };

function bunkerOf(sim) { return (sim.pockets || []).find((q) => typeof q.name === 'string' && q.name.indexOf('bunker') >= 0) || null; }

function tracker(sim) {
  const k = bunkerOf(sim), s = { full: null, dryMax: 0, after: null };
  const stokehold = () => sim.vol[k.node] + sim.vol[k.node - 2];   // the bunker's zone, layer 0, both sides
  return {
    step() {
      if (!k) return;
      if (s.full === null && k.vol >= k.cap) s.full = sim.t;
      if (k.state === 0) { const w = stokehold(); if (w > s.dryMax) s.dryMax = w; }
      if (s.after === null && k.state === 1) s.after = stokehold();
    },
    // plain numbers, so that a caller can keep them and judge them later (the history match's progress)
    result() { return k ? { full: s.full, dryMax: s.dryMax, burst: k.state === 1 ? k.t : null, after: s.after, cap: k.cap } : { full: null, dryMax: Infinity, burst: null, after: null, cap: 0 }; },
  };
}

function verdict(r) {
  const fills = r.full !== null && r.full < LIMITS.fullBy;
  const workable = r.dryMax < LIMITS.stokeholdMax;
  const burst = r.burst !== null && r.burst >= LIMITS.burst[0] && r.burst <= LIMITS.burst[1] && r.after !== null && r.after > LIMITS.afterMin;
  return { fills, workable, burst, ok: fills && workable && burst };
}

module.exports = { LIMITS, bunkerOf, tracker, verdict };
