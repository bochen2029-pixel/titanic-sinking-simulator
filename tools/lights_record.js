// Her lights against the record, with its numbers here and nowhere else (D90 (a), the coordinator, 2026-11-23 10:38):
// the witnesses saw her lights go out at about 2:18 am, two minutes before she sank. The row holds the 1912 preset's
// dark (the plant's dynamos, core/systems.js) within the history match's founder band about the record, 10 min either
// way: timing, which Bo weighs loosely. So 2:08 to 2:28 am (it was 2:15 to 2:19, the old fit's window, which no
// member of the epoch's rerun met: the lights fail with the steam mains, about two minutes before the founder).
// tools/visuals_tests.js and tools/systems_tests.js read it, a MUST in both. At the next rerun of the history match it
// joins wave 1's hard filters, as Barrett's three rows did (tools/w6_record.js, B17).
//   const LR = require('./lights_record.js'); LR.read(t)  ->  { clock, ok }   (t: seconds after the damage)
'use strict';
const WITNESS = 2 * 60 + 18;            // min after midnight: about 2:18 am
const HALF = 10;                         // min either way: the match's founder band about the record
const CLOCK0 = 23 * 60 + 40;             // the collision, 11:40 pm, in min after the previous midnight
const read = (t) => { const clock = CLOCK0 + t / 60 - 24 * 60; return { clock, ok: clock >= WITNESS - HALF && clock <= WITNESS + HALF }; };
const hm = (m) => Math.floor(m / 60) + ':' + String(Math.round(m % 60)).padStart(2, '0') + ' am';
module.exports = { WITNESS, HALF, CLOCK0, read, window: [WITNESS - HALF, WITNESS + HALF], said: 'between ' + hm(WITNESS - HALF) + ' and ' + hm(WITNESS + HALF) + ' (witnesses about 2:18; the founder band\'s 10 min either way: tools/lights_record.js)' };
