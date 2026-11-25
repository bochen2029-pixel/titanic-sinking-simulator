// cdp_tests.js: tools/cdp.js's launch, two at once (BACKLOG G8). A browser suite's browser now chooses its own debugging
// port (openBrowser: --remote-debugging-port=0, read back from its profile's DevToolsActivePort). Before, a port was
// found free, let go and handed to the browser, so two suites launched at the same instant could collide and one drive
// the other's browser. A browser suite: run it in the browser's turn (the turn file: CLAUDE.md).
//   node tools/cdp_tests.js [dist]
'use strict';
const fs = require('fs');
const path = require('path');
const { launch } = require('./cdp');
const dist = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist'));
let fails = 0; const row = (what, got, want, ok) => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${what}: ${got} (${want})`); };
(async () => {
  for (let round = 1; round <= 3; round++) {
    const [A, B] = await Promise.all([launch({ dist }), launch({ dist })]);
    try {
      await A.ev('window.__who = "A"'); await B.ev('window.__who = "B"');
      const a = await A.ev('window.__who'), b = await B.ev('window.__who');
      row(`round ${round}: two launched at the same instant`, `ports ${A.dbg} and ${B.dbg}, browsers ${A.pid} and ${B.pid}; each page reads its own mark: ${a}, ${b}`, 'two ports, two browsers, each suite driving its own', A.dbg && B.dbg && A.dbg !== B.dbg && A.pid !== B.pid && a === 'A' && b === 'B');
    } finally { await Promise.all([A.close(), B.close()]); }
  }
  // G16: a page that never answers fails in bounded time, and the browser's profile is gone after close
  const H = await launch({ dist }); const t0 = Date.now(); let said = 'it answered';
  try { await H.ev('new Promise(() => {})', 2000); } catch (e) { said = e.message; }
  const ms = Date.now() - t0, prof = H.profile; await H.close();
  row('a page that never answers (an evaluation with a deadline of 2 s)', `failed after ${(ms / 1000).toFixed(1)} s: "${said}"`, 'within 3 s, saying it did not answer', ms < 3000 && /did not answer/.test(said));
  row('the browser\'s profile after close', fs.existsSync(prof) ? 'still there: ' + prof : 'removed', 'removed (227 were left behind before G16)', !fs.existsSync(prof));
  console.log(fails ? `FAIL: ${fails} of 5` : 'PASS: all 5 rows');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.log('FAIL: ' + e.message); process.exit(1); });
