// The model's own pow put in the engine's place, for old code (the calibration epoch's B1: a change of arithmetic, not of
// physics). Preloaded into a run of an older checkout, it replaces Math.pow with C.pow from THIS tree's core/core.js, so
// that the old code runs with the routine the model has called since B1 and nothing else changed:
//   node -r <this tree>/tools/pow_preload.js tools/seams.js --freeze     (in a checkout of ef60334, with 2da3c47's seams.js)
// is how out/seams_reference.json is frozen since B1, and the same preload over the commit before B1 gives B1's own
// references to the bit (the headway reference, the 1912 watch's fingerprint, golden): docs/research/experiments/e107.
// C.pow is fdlibm's e_pow.c in plain doubles (U0's E2a, proved against Java's StrictMath in e97). It calls no Math.pow.
// Why not node --no-use-std-math-pow, as the epoch's design first said: on this Node (v26.13.0) V8's own pow is not
// fdlibm's; it differs from C.pow on about 4.5 % of the model's inputs, by one ulp at most (e107, part 1).
'use strict';
const pow = require('../core/core.js').pow;
if (typeof pow !== 'function') throw new Error('pow_preload: this tree\'s core has no C.pow');
Math.pow = pow;
