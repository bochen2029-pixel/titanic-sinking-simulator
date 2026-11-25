// The watch, through the page: P4's acceptance in a real browser, with no dependency beyond Node 22+.
//   node tools/night_site_test.js [dist] [screenshot dir]
// It serves dist/, starts headless Edge or Chrome, and drives the page over the DevTools protocol: the wheel is
// put over with real mouse clicks at chosen moments after the bells, and each night's outcome in the page is compared
// with core/night.js replaying the page's own order log in Node. Set BROWSER to another Chromium's path if needed, or
// TITANIC_APP to the packaged desktop app's Titanic.exe to run it against the app in place of the browser (tools/cdp.js).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const net = require('net');
const { spawn } = require('child_process');
const { serve } = require('./serve');
const C = require('../core/core.js');
const N = require('../core/night.js');

const dist = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist'));
const shots = process.argv[3] ? path.resolve(process.argv[3]) : null;
const WARP = 6;                                   // the watch's real time, multiplied (a test hook: TitanicApp.state.warp)
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push([what, value, ref, ok]); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(84) + ' ' + String(value).padEnd(46) + ' ' + ref); }

function findBrowser() {
  const c = [process.env.BROWSER,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
  for (const p of c) if (p && fs.existsSync(p)) return p;
  throw new Error('no Chromium browser found: set BROWSER to the path of Edge or Chrome');
}
const { cdp, closeBrowser, logVersion, checkApp, pageURL } = require('./cdp');   // the shared connection: every call has a deadline (BACKLOG G16)

(async () => {
  checkApp(dist);                                 // with TITANIC_APP: the app's dist/ must be this one (D3b)
  const { server, port } = await serve(dist, 0);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'titanic-cdp-'));
  const exe = findBrowser();
  // the browser chooses its own debugging port (tools/cdp.js's openBrowser; BACKLOG G8)
  const { child, dbg } = await require('./cdp').openBrowser(['--headless=new', '--no-first-run', '--no-default-browser-check',
    '--window-size=1400,860', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', 'about:blank'], profile);
  const errors = [];
  let page = null;
  try {
    let target = null;
    for (let i = 0; i < 100 && !target && dbg; i++) {
      await sleep(150);
      try { const list = await (await fetch(`http://127.0.0.1:${dbg}/json/list`)).json(); target = list.find(t => t.type === 'page'); } catch (e) { /* not up yet */ }
    }
    if (!target) throw new Error('the browser did not open its debugging port');
    page = await cdp(target.webSocketDebuggerUrl);
    await logVersion(dbg);   // on stderr (G16), so the printed table does not change with it
    page.on((m) => {
      if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception ? m.params.exceptionDetails.exception.description : m.params.exceptionDetails.text);
      if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value || a.description).join(' '));
    });
    await page.send('Page.enable'); await page.send('Runtime.enable');
    await page.send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 860, deviceScaleFactor: 1, mobile: false });
    const ev = async (expression) => {
      const r = await page.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error('in the page: ' + (r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text));
      return r.result.value;
    };
    const waitFor = async (expression, ms, what) => { const t0 = Date.now(); for (;;) { if (await ev(expression)) return; if (Date.now() - t0 > ms) throw new Error('timed out waiting for ' + (what || expression)); await sleep(100); } };
    const open = async (hash) => {
      await page.send('Page.navigate', { url: 'about:blank' });
      await page.send('Page.navigate', { url: pageURL(port, hash) });
      await waitFor('!!(window.TitanicApp && TitanicApp.state.sim)', 20000, 'the page');
    };
    const click = async (id) => {                 // a real mouse click at the middle of the element
      const b = await ev(`(() => { const el = document.getElementById(${JSON.stringify(id)}); el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }; })()`);
      if (!b.w) throw new Error('#' + id + ' is not on the page');
      for (const type of ['mousePressed', 'mouseReleased']) await page.send('Input.dispatchMouseEvent', { type, x: b.x, y: b.y, button: 'left', clickCount: 1 });
    };
    const shot = async (name) => { if (!shots) return; fs.mkdirSync(shots, { recursive: true }); const r = await page.send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(shots, name), Buffer.from(r.data, 'base64')); };
    // the page's watch as plain data, and the same watch replayed in Node from the page's order log
    const watchOf = () => ev(`(() => { const s = TitanicApp.state.sim, w = s.night, u = TitanicNight.summary(s); return { k: w.k, fp: u.fingerprint, kind: u.kind, area: u.area, clearance: u.clearance, bow: u.bow.crush, reaction: u.reaction, tBells: w.tBells, tTouch: w.tTouch, tClear: w.tClear,
      log: w.log.map(o => ({ k: o.k, type: o.type, value: o.value, arg: o.arg })), openings: s.openings.length, seed: w.spec.seed, kn: w.spec.speedKn, events: s.events.map(e => e.label) }; })()`);
    const ship = C.buildShip();
    const replayed = (w) => N.summary(N.replay(ship, N.spec(w.seed, { speedKn: w.kn }), w.log, w.k));
    // Equal to six digits, not to the bit: the hull form calls Math.pow, whose last bit differs between JavaScript
    // engines (README), so a browser's hull and Node's differ in the fifteenth digit and the damage in about the ninth.
    const same = (w, r) => w.kind === r.kind && Math.abs(w.area - r.area) < 1e-6 * Math.max(1, r.area) && Math.abs(w.bow - r.bow.crush) < 1e-6 && (w.kind !== 'miss' || Math.abs(w.clearance - r.clearance) < 1e-6);
    // Put the wheel over with a real mouse click on the step `secs` after the bells; optionally the other way on the step
    // of the touch. The click must land on that very step: at the 1912 point a quarter of a second either way is another
    // collision (on a busy machine a click that waited on a poll gave 0.67 and 0.70 m2 where the night's own orders give
    // 0.7506). So the page's clock is stopped on the step by a part's 'step' hook (site/app.js, "parts"), the click is
    // made and seen in the watch's log, and the clock goes on. The orders are still real clicks through the real controls.
    const holdWhen = async (cond, what, ms) => {
      await ev(`(() => { const A = TitanicApp; window.__held = false; const f = A.on('step', (sim) => { if (${cond}) { A.state.playing = false; window.__held = true; A.off('step', f); } }); })()`);
      await waitFor('window.__held', ms || 120000, what);
    };
    // The watch read on the step she is clear of the ice at: the clock is stopped on that step (holdWhen), the watch is
    // read, and the clock goes on. Read a frame later, the watch had stepped on and its fingerprint was another step's:
    // the table's lines then changed from run to run.
    const holdClear = (what, ms) => holdWhen('sim.night.tClear >= 0', what, ms);
    const watchAtClear = async () => { const w = await watchOf(); await ev('TitanicApp.state.playing = true'); return w; };
    // the watch's id as the Run tab gives it ("Watch <id>, step <k>."), read once the table of other watches is in: its
    // rows write the tab's sentence again as they come from the worker (G5)
    const runTabId = async (what) => {
      await waitFor(`document.querySelectorAll('#winBody tr').length === 7`, 240000, 'the table of other watches (' + what + ')');
      return ev(`(() => { const m = /Watch ([0-9a-f]{8}), step (\\d+)\\./.exec(document.getElementById('watchText').textContent); return m ? { fp: m[1], k: +m[2], k1: TitanicApp.state.sim.night.k } : null; })()`);
    };
    const order = async (id) => {
      const n0 = await ev('TitanicApp.state.sim.night.log.length');
      await click(id);
      await waitFor(`TitanicApp.state.sim.night.log.length > ${n0}`, 5000, 'the order in the watch\'s log');
      await ev('TitanicApp.state.playing = true');
    };
    let iceAtTouch = null;                         // what the Bridge's lookout box reads while the clock stands on the step of the touch
    const drive = async (secs, id, atTouch) => {
      await holdWhen(`sim.night.tBells >= 0 && sim.t - sim.night.tBells >= ${secs} - 1e-9`, 'the step of the order');
      await order(id);
      if (atTouch) {
        await holdWhen('sim.night.tTouch >= 0 || sim.night.tClear >= 0', 'the touch');
        try { await waitFor(`document.getElementById('gIce').textContent === 'On the ice'`, 8000, 'the lookout box at the touch'); } catch (e) { /* the row below says what it read */ }
        iceAtTouch = await ev(`document.getElementById('gIce').textContent`);
        await order(atTouch);
      }
      await holdClear('the end of the encounter');
    };

    // ---- 1. the page, a watch from the address, the bridge on the stage
    await open('#night=1912');
    await ev(`TitanicApp.state.warp = ${WARP}`);
    const ui = await ev(`({ bridge: !document.getElementById('bridge').hidden, watch: !document.getElementById('watchSec').hidden, sub: document.getElementById('scenSub').textContent, gl: !!TitanicApp.renderer, view: TitanicApp.state.view, locked: document.getElementById('speedSeg').classList.contains('locked'), cards: document.querySelectorAll('#scenCards .card').length })`);
    await sleep(600);
    row('#night=1912 opens the 1912 watch with the Bridge on the stage', `bridge ${ui.bridge}, panel ${ui.watch}, WebGL ${ui.gl}, view ${ui.view}`, 'bridge, panel and WebGL true; the view from astern', ui.bridge && ui.watch && ui.gl && ui.view === 'astern' && /watch/.test(ui.sub) && ui.cards === 8);
    const before = await ev(`({ ice: document.getElementById('gIce').textContent, berg: !!(TitanicApp.state.sim.night.tBells < 0), locked: document.getElementById('speedSeg').classList.contains('locked') })`);
    row('before the bells nothing is in sight, and the clock is locked to real time', `"${before.ice}", locked ${before.locked}`, '"Nothing in sight", locked', before.ice === 'Nothing in sight' && before.locked);

    // ---- 2. the wheel hard to port 6.5 s after the bells: she clears
    await drive(6.5, 'bHardPort');
    await shot('v3-watch-clear.png');
    let w = await watchAtClear(), r = replayed(w);
    row('wheel hard to port 6.5 s after the bells (a mouse click on that step): she clears the 1912 berg', `${w.kind}, ${w.clearance.toFixed(1)} m, order ${w.reaction.toFixed(2)} s after the bells`, 'a miss by 38 to 56 m, the order at 6.50 s (the headless window since P3c: 51 m at 5.5 s, 15 m at 10.5 s)', w.kind === 'miss' && w.clearance > 38 && w.clearance < 56 && Math.abs(w.reaction - 6.5) < 1e-9 && w.log.length === 1 && w.log[0].value === -40 && w.openings === 0);
    row('  the page and Node agree on that watch, replayed from the page\'s order log', `page ${w.fp}, Node ${r.fingerprint}`, 'the same outcome; the same fingerprint when the two engines\' maths agree', same(w, r));
    const fpSame1 = w.fp === r.fingerprint, mine = w;

    // ---- 3. the 1912 drill by hand: the order 20.5 s after the bells, the wheel reversed at the touch
    await click('bSameNight');
    await waitFor('TitanicApp.state.sim.night.k < 20', 10000, 'the restart');
    await ev(`TitanicApp.state.warp = ${WARP}`);
    await waitFor('TitanicApp.state.sim.night.tBells >= 0', 90000, 'the bells');
    await sleep(350);
    await shot('v3-watch-bells.png');
    await drive(20.5, 'bHardPort', 'bHardStbd');
    w = await watchAtClear(); r = replayed(w);
    const node1912 = N.summary(N.run(N.create(ship, N.spec(1912), { auto: true })));
    row('the 1912 drill by hand (the order on the step 20.5 s after the bells, the wheel reversed on the step of the touch): the night\'s own damage', `${w.kind}, ${w.area.toFixed(6)} m2, order ${w.reaction.toFixed(2)} s`, `holed, ${node1912.area.toFixed(6)} m2, as the 1912 orders give (0.7506 calibrated)`, w.kind === 'holed' && Math.abs(w.area - node1912.area) < 1e-6 && Math.abs(w.reaction - 20.5) < 1e-9 && w.bow === 0 && w.openings > 50);
    row('  the page and Node agree on that watch', `page ${w.fp}, Node ${r.fingerprint}; ${w.area.toFixed(9)} against ${r.area.toFixed(9)} m2`, 'the same outcome', same(w, r));
    row('  with the clock on the step of the touch, the Bridge\'s lookout box says so', `"${iceAtTouch}"`, '"On the ice" (it went on giving the range through the contact until 2026-11-17)', iceAtTouch === 'On the ice');
    // the forecast and the seven other watches are worked out in the page's worker: seconds on a quiet machine, and
    // more than a minute was seen on a loaded one (2026-11-17), so the wait is generous: it is not what is tested
    // since G12's cascade (D98) a watch is handed over at the break's onset by default: its forecast says when she breaks
    // (or when she founders, on a night that never reaches an onset)
    await waitFor(`/Breaks at|Founders|afloat/.test(document.getElementById('fcLine').textContent)`, 240000, 'the forecast');
    await waitFor(`document.querySelectorAll('#winBody tr').length === 7`, 240000, 'the table of other watches');
    const after = await ev(`({ fc: document.getElementById('fcLine').textContent, rows: [...document.querySelectorAll('#winBody tr')].map(t => t.textContent), locked: document.getElementById('speedSeg').classList.contains('locked'), status: document.getElementById('status').textContent, replay: !document.getElementById('bReplay').disabled })`);
    row('after the ice: the core forecasts the sinking, the clock is free, the other watches are listed', `"${after.fc.slice(0, 60)}"; ${after.rows.length} rows; locked ${after.locked}`, 'a forecast that she breaks (the default hand-over, G12\'s cascade) or founders; 7 rows; unlocked', /Breaks at|Founders/.test(after.fc) && after.rows.length === 7 && !after.locked && after.replay);
    await ev(`TitanicApp.setView('quarter')`); await sleep(1500);
    await shot('v3-watch-holed.png');
    const hand = w;

    // ---- 4. replay my watch: the same night again from the page's own log
    await click('bReplay');
    await waitFor('TitanicApp.state.sim.night.k < 20 && TitanicApp.state.night.mode === "replay"', 10000, 'the replay');
    await ev(`TitanicApp.state.warp = ${WARP}`);
    await waitFor(`TitanicApp.state.sim.night.k >= ${hand.k}`, 120000, 'the replay to finish');
    const rp = await ev(`(() => { const s = TitanicApp.state.sim; return { k: s.night.k, area: TitanicNight.summary(s).area, openings: s.openings.length }; })()`);
    row('"Replay my watch" gives the same night again', `${rp.area.toFixed(9)} m2, ${rp.openings} openings`, `${hand.area.toFixed(9)} m2, ${hand.openings} openings`, Math.abs(rp.area - hand.area) < 1e-12 && rp.openings === hand.openings);

    // ---- 5. the 1912 orders (the script), from the bridge camera
    await click('bAuto');
    await waitFor('TitanicApp.state.sim.night.k < 20 && TitanicApp.state.night.mode === "auto"', 10000, 'the 1912 orders');
    await ev(`TitanicApp.state.warp = ${WARP}; TitanicApp.setView('bridge')`);
    await waitFor('TitanicApp.state.sim.night.tBells >= 0 && TitanicApp.state.sim.t - TitanicApp.state.sim.night.tBells >= 12', 90000, 'the bells');
    await shot('v3-watch-bridge.png');
    await holdClear('the end of the encounter');
    w = await watchAtClear();
    row('"Watch the 1912 orders": the reconstructed night', `${w.kind}, ${w.area.toFixed(6)} m2, touch ${w.tTouch.toFixed(2)} s`, `holed, ${node1912.area.toFixed(6)} m2 (0.7506 calibrated), touch 60 s`, w.kind === 'holed' && Math.abs(w.area - node1912.area) < 1e-6 && Math.abs(w.tTouch - 60) < 0.5);
    // the same night by the model alone inside the page, to the same step: no viewer, no frames, no forecast worker
    const bare = await ev(`(() => { const N = TitanicNight, s = N.create(TitanicCore.buildShip(), N.spec(1912), { auto: true }); while (s.night.k < ${w.k}) N.step(s); return N.fingerprint(s); })()`);
    row('  the viewer adds nothing to the physics: its watch and the model alone, in the page, have one fingerprint', `viewer ${w.fp}, model alone ${bare}`, 'equal, bit for bit', w.fp === bare);
    const nodeAt = (() => { const s = N.create(ship, N.spec(1912), { auto: true }); while (s.night.k < w.k) N.step(s); return N.fingerprint(s); })();
    const fpSame2 = w.fp === nodeAt, fpNote = `the 1912 night to step ${w.k}: this browser ${w.fp}, this Node ${nodeAt}`;
    const idA = await runTabId('the 1912 orders at 1x after the ice');   // the clock running on since the clear

    // ---- 5b. Y8: a wheel order after the ice, on a watch begun on the 1912 orders (a fresh page: no watch of the
    // player's yet to replay). A real click on the held step 150 s into the watch (the Stop and Midships of 1912 given a
    // minute after the touch); "Replay my watch", disabled until then, is enabled; the watch is read on a later step and the
    // replay (a real click) is read on that same step
    const KY = 1200;
    await open('#night=1912');
    await click('bAuto');
    await waitFor('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 20', 10000, 'the 1912 orders, on a fresh page');
    await ev(`TitanicApp.state.warp = ${WARP}`);
    await holdClear('the end of the encounter');
    await ev('TitanicApp.state.speed = 60; TitanicApp.state.playing = true');
    await holdWhen('sim.night.k >= 600', 'step 600');
    const whose = `({ mode: TitanicApp.state.night.mode, replay: !document.getElementById('bReplay').disabled, n: TitanicApp.state.sim.night.log.length, k: TitanicApp.state.sim.night.k })`;
    const y0 = await ev(whose);
    await order('bHardPort');
    const y1 = await ev(whose), yLast = await ev('(() => { const L = TitanicApp.state.sim.night.log, o = L[L.length - 1]; return [o.k, o.type, o.value]; })()');
    await holdWhen(`sim.night.k >= ${KY}`, 'step ' + KY);
    const yW = await ev('({ k: TitanicApp.state.sim.night.k, fp: TitanicNight.fingerprint(TitanicApp.state.sim), log: TitanicApp.state.sim.night.log.map(o => [o.k, o.type, o.value]) })');
    // the watch's sentence over the button is written again as each row of the table of other watches comes from the
    // worker: the click waits for the table, so that the button stands still under it (the clock stays held)
    await waitFor(`document.querySelectorAll('#winBody tr').length === 7`, 240000, 'the table of other watches');
    const idB = await runTabId('the 1912 orders at 60x after the ice, held on step ' + KY);
    row('the Run tab\'s watch id is the one stamped on the step the encounter ended, with that step (G5): two watches of the 1912 orders, at 1x and at 60x after the ice, read once the table of other watches is in',
      `${idA ? idA.fp + ', step ' + idA.k : 'none'}; ${idB ? idB.fp + ', step ' + idB.k : 'none'} (the second read on step ${idB ? idB.k1 : '-'})`,
      `${w.fp}, step ${w.k}, both: the watch on the step it cleared the ice`,
      !!idA && !!idB && idA.fp === w.fp && idA.k === w.k && idB.fp === w.fp && idB.k === w.k && idB.k1 === KY);
    await click('bReplay');
    await waitFor('TitanicApp.state.night.mode === "replay" && TitanicApp.state.sim.night.k < 20', 10000, 'the replay');
    await ev(`TitanicApp.state.warp = ${WARP}`);
    await holdClear('the replay past the ice');
    await ev('TitanicApp.state.speed = 60; TitanicApp.state.playing = true');
    await holdWhen(`sim.night.k >= ${KY}`, 'the replay on step ' + KY);
    const yR = await ev('({ k: TitanicApp.state.sim.night.k, fp: TitanicNight.fingerprint(TitanicApp.state.sim), log: TitanicApp.state.sim.night.log.map(o => [o.k, o.type, o.value]) })');
    row('on the 1912 orders, a wheel order after the ice (a real click on step 600) enables "Replay my watch"; the replay is the same night', `mode ${y0.mode} -> ${y1.mode}, Replay ${y0.replay ? 'on' : 'off'} -> ${y1.replay ? 'on' : 'off'}; at step ${KY}: the watch ${yW.fp}, the replay ${yR.fp}`, `auto -> you, off -> on; one fingerprint at step ${KY}`,
      y0.mode === 'auto' && !y0.replay && y1.mode === 'you' && y1.replay && y1.n === y0.n + 1 && yLast[0] === y0.k && yLast[1] === 'helm' && yLast[2] === -40 && yW.k === KY && yR.k === KY && yR.fp === yW.fp && JSON.stringify(yR.log) === JSON.stringify(yW.log));
    await ev('TitanicApp.state.playing = true');

    // ---- 6. another night by its seed, no order at all; and the keyboard
    await ev(`(() => { const i = document.getElementById('seedIn'); i.value = '16'; })()`);
    await click('bSeedGo');
    await waitFor('TitanicApp.state.night && TitanicApp.state.night.seed === 16 && TitanicApp.state.sim.night.k < 20', 10000, 'night 16');
    await ev(`TitanicApp.state.warp = ${WARP}`);
    await holdClear('the end of night 16', 180000);
    w = await watchAtClear();
    const n16 = N.summary(N.run(N.create(ship, N.spec(16), {}), { tMax: 600 }));
    row('night 16 from the seed box, no order: the page and Node agree', `${w.kind}, bow ${w.bow.toFixed(2)} m, ${w.area.toFixed(4)} m2`, `${n16.kind}, bow ${n16.bow.crush.toFixed(2)} m, ${n16.area.toFixed(4)} m2`, w.kind === n16.kind && Math.abs(w.area - n16.area) < 1e-6 && Math.abs(w.bow - n16.bow.crush) < 1e-6);
    await shot('v3-watch-stem.png');
    await click('bSameNight');
    await waitFor('TitanicApp.state.sim.night.k < 20', 10000, 'the restart');
    await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'd', code: 'KeyD', windowsVirtualKeyCode: 68 });
    await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'd', code: 'KeyD', windowsVirtualKeyCode: 68 });
    await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 });
    await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 });
    const keys = await ev(`(() => { const s = TitanicApp.state.sim, m = s.mo; return { cmd: Math.round(m.delCmd * 180 / Math.PI), set: m.setP, hindsight: s.night.hindsight, n: s.night.log.length }; })()`);
    row('the keyboard: D puts the wheel hard to starboard, the down arrow rings Half ahead; before the bells it is hindsight', `rudder order ${keys.cmd}, shafts ${keys.set} rpm, hindsight ${keys.hindsight}`, '40, 50, true', keys.cmd === 40 && keys.set === 50 && keys.hindsight === true && keys.n === 2);
    // ---- 6b. G1, the level of a drawn night: "Like 1912" (a real click), then night 16 from the seed box, no order
    const clickSel = async (sel) => {
      const b = await ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }; })()`);
      if (!b.w) throw new Error(sel + ' is not on the page');
      for (const type of ['mousePressed', 'mouseReleased']) await page.send('Input.dispatchMouseEvent', { type, x: b.x, y: b.y, button: 'left', clickCount: 1 });
    };
    // A click on a control of the panel can miss: the panel's lines come and go with the watch, so the control can move
    // between the measuring and the click, and on a loaded machine that gap is long (lost on 17 November 2026 in two
    // lanes' runs and in the gate's). So: click, look, and click again if it did not take (the choice is the same choice
    // however often it is clicked).
    const clickUntil = async (sel, cond, what) => {
      for (let n = 1; ; n++) {
        await clickSel(sel);
        try { await waitFor(cond, 3000, what); return n; } catch (e) { if (n >= 6) throw e; }
      }
    };
    await clickUntil('#levelSeg button[data-level="night1912"]', 'TitanicApp.state.nightLevel === "night1912"', 'the level chosen');
    await ev(`(() => { const i = document.getElementById('seedIn'); i.value = '16'; })()`);
    // the Go button, clicked again if the night has not come within 3 s: in this suite's run (never in a replay of its
    // steps alone, 3 of 3) the click was once lost; the row says how many it took
    const lvlCond = 'TitanicApp.state.night && TitanicApp.state.night.seed === 16 && TitanicApp.state.night.level === "night1912"';
    let goClicks = 0;
    for (;;) { goClicks++; await click('bSeedGo'); try { await waitFor(lvlCond, 4000, 'night 16, like 1912'); break; } catch (e) { if (goClicks >= 5) throw e; } }
    await waitFor(lvlCond, 10000, 'night 16, like 1912 (' + JSON.stringify(await ev(`({ seed: TitanicApp.state.night && TitanicApp.state.night.seed, level: TitanicApp.state.night && TitanicApp.state.night.level, chosen: TitanicApp.state.nightLevel })`)) + ')');
    await ev(`TitanicApp.state.warp = ${WARP}`);
    await holdClear('the end of night 16, like 1912', 180000);
    w = await watchAtClear();
    const lv = await ev(`({ level: TitanicApp.state.night.spec.level, title: TitanicApp.state.night.spec.title, hash: location.hash, sighting: TitanicApp.state.night.spec.sighting })`);
    const sp16L = N.spec(16, { level: 'night1912' }), n16L = N.summary(N.run(N.create(ship, sp16L, {}), { tMax: 600 }));
    row('a drawn night\'s level (G1, real clicks): "Like 1912", then night 16: the page and Node agree; the address carries it', `${lv.title}; seen at ${lv.sighting} m; ${w.kind}, ${w.area.toFixed(4)} m2; ${lv.hash}${goClicks > 1 ? '; Go clicked ' + goClicks + ' times' : ''}`, `${sp16L.title}; seen at ${sp16L.sighting} m; ${n16L.kind}, ${n16L.area.toFixed(4)} m2; #night=16&level=night1912`,
      lv.level === 'night1912' && lv.sighting === sp16L.sighting && w.kind === n16L.kind && Math.abs(w.area - n16L.area) < 1e-6 && /level=night1912/.test(lv.hash));
    await clickUntil('#levelSeg button[data-level="hard"]', 'TitanicApp.state.nightLevel === "hard"', 'the level put back');

    // ---- 7. the old scenarios still run, and nothing was logged as an error
    await open('#scenario=titanic');
    await waitFor(`/Founders/.test(document.getElementById('fcLine').textContent)`, 60000, 'the preset\'s forecast');
    const old = await ev(`({ fc: document.getElementById('fcLine').textContent, bridge: document.getElementById('bridge').hidden, t: TitanicApp.state.sim.t, open: TitanicApp.state.sim.openings.length })`);
    row('the 1912 damage preset is as it was: no bridge, the forecast from the core', `"${old.fc}", ${old.open} openings`, 'Founders at 2:25 am, 2 h 46 min after the damage (2:18 before D4, the calibration epoch landed with member C; 2:17 before G7, the forepeak held to its tank, and its refit; 2:16 before S1, the tiers above B deck and the staircases; 2:17 before the refit with the pumps, Y3)', old.bridge && old.open > 0 && /2:25 am, 2 h 46 min after the damage/.test(old.fc));
    // ---- 8. a phone: the Bridge must fit between the readouts and the damage diagram, with every control on the screen
    await page.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 780, deviceScaleFactor: 2, mobile: true });
    await page.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await open('#night=1912');
    await ev(`TitanicApp.state.warp = ${WARP}`);
    await waitFor('TitanicApp.state.sim.night.tBells >= 0 && TitanicApp.state.sim.t - TitanicApp.state.sim.night.tBells >= 4', 90000, 'the bells on the phone');
    const ph = await ev(`(() => { const r = (id) => document.getElementById(id).getBoundingClientRect(), b = r('bridge'), ro = r('readout'), st = document.querySelector('.strip').getBoundingClientRect(), hp = r('bHardPort'), hs = r('bHardStbd'), tg = r('telegraph');
      return { device: TitanicApp.device(), w: innerWidth, h: innerHeight, bridge: [b.left, b.top, b.right, b.bottom].map(Math.round), readoutBottom: Math.round(ro.bottom), stripTop: Math.round(st.top), helm: Math.round(Math.min(hp.height, hs.height)), tel: Math.round(tg.height), inside: hp.left >= 0 && hs.right <= innerWidth && tg.left >= 0 && tg.right <= innerWidth }; })()`);
    await shot('v3-watch-phone.png');
    row('on a phone (390 x 780, touch) the Bridge sits between the readouts and the damage diagram, controls 40 px tall', `${ph.device}; bridge y ${ph.bridge[1]} to ${ph.bridge[3]}; readouts end ${ph.readoutBottom}, diagram from ${ph.stripTop}; helm ${ph.helm} px, telegraph ${ph.tel} px`,
      'phone; no overlap; at least 40 px', ph.device === 'phone' && ph.bridge[1] >= ph.readoutBottom && ph.bridge[3] <= ph.stripTop && ph.helm >= 40 && ph.tel >= 40 && ph.inside);
    row('no error in the page\'s console through all of it', errors.length ? errors.slice(0, 3).join(' | ') : 'none', 'none', errors.length === 0);
    console.log('\nacross engines: ' + fpNote + (fpSame1 && fpSame2 ? ': the same bits' : ': the outcomes agree to six digits and more, the last bits do not'));
    console.log('  (a night replays bit for bit on one engine; two JavaScript engines differ in the last bit of some library functions, as the README says of Math.pow)');
    console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${rows.length} rows`);
  } catch (e) {
    fails++; console.log('FAIL the test could not finish: ' + e.message); if (errors.length) console.log('page errors: ' + errors.slice(0, 5).join(' | '));
  } finally {
    try { if (page) page.close(); } catch (e) { /* closing */ }
    server.close();
    await closeBrowser(child, profile);   // the browser waited for, then its profile removed with retries (G16)
    process.exit(fails ? 1 : 0);
  }
})();
