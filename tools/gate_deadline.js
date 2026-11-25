// gate_deadline.js: the gate's deadline for a suite, in minutes (BACKLOG G16; used by tools/gate.js). A hang lasts for
// ever, so a deadline need only be sure to end one, and must leave room for a busy machine (the wake suite takes 2 min
// alone and 8 beside the gate's others): three times the longest of the suite's last five PASS times, and at least 10
// minutes. The longest, so that a time from a run on an idle machine (--only) can't trap a loaded full gate. With no
// PASS kept yet, 30 minutes, or 120 for a sweep (about half an hour each, three side by side). s.deadlineMin overrides
// all of it; scale (--deadline-scale) multiplies. tools/gate_deadline_tests.js holds these numbers.
'use strict';
const FLOOR = 10, FACTOR = 3, FIRST = 30, FIRST_SWEEP = 120, KEEP = 5;
// a suite's kept PASS times in ms, oldest first: a list, or one number as join 7's gate kept it
const timesOf = (v) => Array.isArray(v) ? v.filter(t => t > 0) : (v > 0 ? [v] : []);
// s: the suite ({ name, sweep, deadlineMin }); durations: { name: its kept PASS times }; scale: a multiplier
function deadlineMin(s, durations, scale) {
  const kept = timesOf(durations ? durations[s.name] : null), longest = kept.length ? Math.max(...kept) : 0;
  return (scale || 1) * (s.deadlineMin || (longest > 0 ? Math.max(FLOOR, FACTOR * longest / 60000) : (s.sweep ? FIRST_SWEEP : FIRST)));
}
// a PASS's time added to its suite's list, which keeps the last five (durations is changed in place)
function keep(durations, name, ms) { durations[name] = timesOf(durations[name]).concat(ms).slice(-KEEP); return durations[name]; }
module.exports = { deadlineMin, keep, timesOf, FLOOR, FACTOR, FIRST, FIRST_SWEEP, KEEP };
