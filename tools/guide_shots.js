// guide_shots.js: the User Guide's pictures, taken from the built site (dist/) in headless Edge or Chrome, through the
// page's own controls (real mouse clicks, the address bar's #night= and #scenario=), with nothing beyond Node 22+.
//   node tools/guide_shots.js                 take every picture into docs/guide/img/ and write docs/guide/shots.json
//   node tools/guide_shots.js --only a,b      only the scenes named: watch, pumps, stem, preset, damage, phone
//   node tools/guide_shots.js --verify        take them again into a scratch folder and compare, byte for byte
// Deterministic: before the page loads, its clock (performance.now, Date.now), its timers, requestAnimationFrame and
// Math.random are replaced by a fake clock that only this script advances, frame by frame. The model steps by the
// frame, so a scene is reached on the same step every time, and the same build gives the same pictures on one machine
// and one browser. A moment is held exactly by a hook on the model's step (TitanicApp.on('step')) that stops the page's
// clock on that step, as the browser suites do. The forecast workers run in real time; the script waits for them with
// the page's clock stopped.
// shots.json records the site build the pictures come from (dist/version.json), each picture's SHA-256, and what the
// page said and showed while it was there: its sentences, the readers' counts at the end of the 1912 watch, the hull
// gauge's curve on the 1912 damage (tools/build_guide.js quotes and tabulates them; tools/guide_check.js checks that the
// pictures were taken from the dist/ that is there now).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const B = require('./cdp');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const args = process.argv.slice(2);
const verify = args.includes('--verify');
const onlyArg = args.indexOf('--only') >= 0 ? args[args.indexOf('--only') + 1] : null;
const only = onlyArg ? new Set(onlyArg.split(',')) : null;
const imgDir = verify ? fs.mkdtempSync(path.join(os.tmpdir(), 'guide-shots-')) : path.join(root, 'docs', 'guide', 'img');
const factsFile = path.join(root, 'docs', 'guide', 'shots.json');
const W = 1400, H = 860, FRAME = 1000 / 30;     // the desktop window, and one frame of the fake clock (ms)
const JPEG = 84;                                // quality of the 3D pictures; the panels are PNG

// the fake clock, installed in every document before its scripts run
const CLOCK = `(() => {
  if (window.__guideClock) return;
  let now = 0, tid = 0, rid = 0, seed = 1912;
  const timers = new Map(), rafs = new Map();
  try { Object.defineProperty(performance, 'now', { value: () => now, configurable: true }); } catch (e) { performance.now = () => now; }
  const D0 = Date.UTC(2026, 0, 1);
  Date.now = () => D0 + Math.floor(now);
  window.requestAnimationFrame = (cb) => { rafs.set(++rid, cb); return rid; };
  window.cancelAnimationFrame = (id) => { rafs.delete(id); };
  window.setTimeout = (cb, ms, ...a) => { timers.set(++tid, { at: now + Math.max(0, +ms || 0), cb, a, every: 0 }); return tid; };
  window.setInterval = (cb, ms, ...a) => { const e = Math.max(1, +ms || 0); timers.set(++tid, { at: now + e, cb, a, every: e }); return tid; };
  window.clearTimeout = window.clearInterval = (id) => { timers.delete(id); };
  Math.random = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
  function due() {
    for (;;) {
      let best = 0, bt = Infinity;
      for (const [id, t] of timers) if (t.at <= now && (t.at < bt || (t.at === bt && id < best))) { best = id; bt = t.at; }
      if (!best) return;
      const t = timers.get(best);
      if (t.every) t.at += t.every; else timers.delete(best);
      if (typeof t.cb === 'function') { try { t.cb(...t.a); } catch (e) { console.error(e); } }
    }
  }
  window.__guideClock = {
    tick(n, ms) { for (let i = 0; i < n; i++) { now += ms; due(); const q = [...rafs.values()]; rafs.clear(); for (const cb of q) cb(now); } return now; },
    now: () => now,
  };
})();`;

const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const rows = []; let fails = 0;
function row(ok, what, value) { rows.push(ok); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(64) + ' ' + value); }

(async () => {
  const site = JSON.parse(fs.readFileSync(path.join(dist, 'version.json'), 'utf8'));
  const b = await B.launch({ dist, width: W, height: H });
  const { page, ev, waitFor } = b;
  const facts = {}, images = {};
  let browser = '';
  try {
    browser = (await page.send('Browser.getVersion').catch(() => ({}))).product || '';
    await page.send('Page.addScriptToEvaluateOnNewDocument', { source: CLOCK });
    // The page's parts draw some labels on canvases once, as the page loads (the boats' numbers: site/parts/50_boats.js),
    // in a web font that may or may not have arrived by then: a race that changed those labels from one run to the next.
    // The page's own script is held at the network until the fonts it draws with have loaded, then let through.
    await page.send('Fetch.enable', { patterns: [{ urlPattern: '*/assets/app.*.js', requestStage: 'Request' }] });
    page.on(async (m) => {
      if (m.method !== 'Fetch.requestPaused') return;
      try {
        await ev(`Promise.all(['600 22px "IBM Plex Sans Condensed"', '600 10px "IBM Plex Sans Condensed"', '500 10px "IBM Plex Sans Condensed"', '500 10px "IBM Plex Mono"']
          .map(f => document.fonts.load(f))).then(() => document.fonts.ready).then(() => true)`);
      } catch (e) { /* the page will draw with what it has */ }
      page.send('Fetch.continueRequest', { requestId: m.params.requestId }).catch(() => {});
    });
    // the page's own reduced-motion rule: no fades, so a picture never catches a toast or the sheet half way
    await page.send('Emulation.setEmulatedMedia', { media: '', features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });

    // ---- helpers
    const S = 'TitanicApp.state';
    const tick = (n, ms) => ev(`__guideClock.tick(${n | 0}, ${ms || FRAME})`);
    // tick frame by frame until the condition holds (checked before each frame), at most max frames
    async function until(cond, max, ms, what) {
      let done = 0;
      while (done < max) {
        const r = await ev(`(() => { for (let i = 0; i < 25; i++) { if (${cond}) return [true, i]; __guideClock.tick(1, ${ms || FRAME}); } return [${cond}, 25]; })()`);
        done += r[1];
        if (r[0]) return done;
      }
      throw new Error('the page never reached: ' + (what || cond));
    }
    // stop the page's clock on the very step the condition (of `sim`) first holds, and wait for it, or for her end: the
    // page's own (TitanicApp.gone, QC B-4), on a watch Night.over, since G12's cascade (D98) the break's onset by default,
    // and on a preset her flag (a watch handed over at the onset never reaches the flag: the model stands still there)
    async function holdAt(cond, what, max) {
      await ev(`(() => { const A = TitanicApp; if (window.__guideHold) A.off('step', window.__guideHold);
        window.__guideHold = (sim) => { if (${cond}) { A.state.playing = false; A.off('step', window.__guideHold); window.__guideHold = null; } };
        A.on('step', window.__guideHold); A.state.playing = true; })()`);
      await until(`!${S}.playing || TitanicApp.gone(${S}.sim)`, max || 12000, FRAME, what);
    }
    // the same past her hand-over (on a default watch where she breaks, D98; on a preset her flag), on the fall's own
    // steps: the page fires the event 'fallStep' after each (site/app.js, fallSteps), and on a watch the night steps on
    // beside her fall (Z3), so her end no longer ends the wait
    async function holdFall(cond, what, max) {
      await ev(`(() => { const A = TitanicApp; if (window.__guideHold) A.off('event', window.__guideHold);
        window.__guideHold = (name, sim) => { if (name === 'fallStep' && (${cond})) { A.state.playing = false; A.off('event', window.__guideHold); window.__guideHold = null; } };
        A.on('event', window.__guideHold); A.state.playing = true; })()`);
      await until(`!${S}.playing`, max || 12000, FRAME, what);
    }
    const resume = () => ev(`${S}.playing = true`);
    const freeze = () => ev(`${S}.warp = 0, ${S}.speed = 0`);           // the model holds; the frames still draw
    async function open(hash, device) {
      await b.open(hash);
      await ev('document.fonts.ready.then(() => true)');
      await tick(3);                                                     // the first frames: the scene, the readouts
      if (device) { const d = await ev('TitanicApp.device()'); if (d !== device) throw new Error('the page took itself for a ' + d + ', not a ' + device); }
    }
    // wait, with the page's clock stopped, for the forecast worker (and the other watches' table) to answer
    async function settleForecast(rowsToo) {
      await tick(12);                                                    // the forecast starts 30 to 350 ms after it is asked for
      // (on a watch the line under the readouts carries the watch until a forecast exists: wait for the forecast itself)
      await waitFor(`!${S}.sim.openings.length || (!!${S}.forecast && ${S}.forecast.seq === ${S}.fcSeq && !/Forecasting/.test(document.getElementById('fcLine').textContent))`, 180000, 'the forecast');
      if (rowsToo) await waitFor(`document.querySelectorAll('#winBody tr').length === 7`, 180000, 'the table of other watches');
      await tick(4);
    }
    async function settle(frames) {                                      // the readouts, the strip and the charts redrawn
      await tick(frames || 34);
    }
    const hideToast = () => ev(`['toast', 'rpToast'].forEach(id => { const t = document.getElementById(id); if (t) t.classList.remove('on'); })`);
    // the stage alone (the 3D view, the readouts, the Bridge, the damage diagram), without the panel; or its part above
    // the element `above` (the Bridge, for a closer look at the view)
    const stage = (above) => ev(`(() => { const p = document.getElementById('panel').getBoundingClientRect(); const h = ${above ? `document.querySelector(${JSON.stringify(above)}).getBoundingClientRect().top - 6` : 'innerHeight'}; return { x: 0, y: 0, width: Math.round(p.left), height: Math.round(h) }; })()`);
    // an element of the stage with a margin round it
    const around = (sel, pad) => ev(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(), p = ${pad || 8}; return { x: Math.max(0, Math.round(r.left - p)), y: Math.max(0, Math.round(r.top - p)), width: Math.round(r.width + 2 * p), height: Math.round(r.height + 2 * p) }; })()`);
    const want = (name) => !only || only.has(name);
    const view = async (v) => { await b.clickSel(`[data-view="${v}"]`); };
    const xray = async (on) => { if ((await ev(`${S}.xray`)) !== on) await b.click('bXray'); };
    const nightLook = async (on) => { if ((await ev(`TitanicApp.nightScene ? TitanicApp.nightScene.on : false`)) !== on) await b.click('bNight'); };
    // the looks as the page has them, and put back as they were after a picture of another look, so that the pictures
    // after it are taken as before (the X-ray look takes over from the Night look: both orders of the switches are tried)
    const looks = () => ev(`({ xray: ${S}.xray, night: TitanicApp.nightScene ? TitanicApp.nightScene.on : false })`);
    async function setLooks(w) {
      for (let k = 0; ; k++) {
        const now = await looks();
        if (now.xray === w.xray && now.night === w.night) return true;
        if (k === 2) return false;
        if (k === 0) { await nightLook(w.night); await xray(w.xray); } else { await xray(w.xray); await nightLook(w.night); }
        await tick(2);
      }
    }
    const PLAN_BACK = 'TitanicApp.ctl.goal = null; TitanicApp.ctl.r = 1500; true';   // the Plan view drawn back: her turn and the berg in it
    // a picture: the window (JPEG), or a clip of it; panels at twice the pixels (PNG) for sharp text
    async function shot(file, opts) {
      opts = opts || {};
      const png = /\.png$/.test(file);
      const clip = opts.clip ? Object.assign({ scale: 1 }, opts.clip) : null;
      let scale = opts.scale || 0;
      const m = await ev('({ w: innerWidth, h: innerHeight, dpr: devicePixelRatio, mobile: TitanicApp.device() === "phone" })');
      scale = scale || m.dpr;                       // the device's own pixels unless a scale is asked for
      // no hover and no focus left over from the last click: the mouse rests at the stage's left edge (the 3D view does
      // nothing with a mouse that is not pressed), the focus nowhere
      if (!m.mobile) await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: Math.round(m.h / 2) });
      await ev('document.activeElement && document.activeElement.blur && document.activeElement.blur()');
      if (scale !== m.dpr) await page.send('Emulation.setDeviceMetricsOverride', { width: m.w, height: m.h, deviceScaleFactor: scale, mobile: m.mobile });
      const p = { format: png ? 'png' : 'jpeg', captureBeyondViewport: false };
      if (!png) p.quality = JPEG;
      if (clip) p.clip = clip;
      const r = await page.send('Page.captureScreenshot', p);
      if (scale !== m.dpr) await page.send('Emulation.setDeviceMetricsOverride', { width: m.w, height: m.h, deviceScaleFactor: m.dpr, mobile: m.mobile });
      const buf = Buffer.from(r.data, 'base64');
      fs.mkdirSync(imgDir, { recursive: true });
      fs.writeFileSync(path.join(imgDir, file), buf);
      const dims = png ? [buf.readUInt32BE(16), buf.readUInt32BE(20)] : jpegSize(buf);
      images[file] = { sha256: sha(buf), bytes: buf.length, width: dims[0], height: dims[1], scene: opts.scene || '' };
      console.log(`  ${file.padEnd(24)} ${dims[0]} x ${dims[1]}, ${(buf.length / 1024).toFixed(0)} KB`);
    }
    // a piece of the side panel: from the top of the element `from` (the panel's own top, with its tabs, when null) down
    // to the bottom of the element `upTo`. The window is made taller for the moment (desktop), as tall as the piece
    // needs, and the panel scrolled so that the piece starts at its top; then both are put back
    async function panelShot(file, tab, from, upTo, scene) {
      await b.clickSel(`.tab[data-tab="${tab}"]`);
      // upTo: a selector, or a list of them, the first that is on the page taken
      const upJs = `(${JSON.stringify([].concat(upTo))}.map(s => document.querySelector(s)).find(Boolean))`;
      if (!(await ev(`!!${upJs}`))) throw new Error('none of ' + [].concat(upTo).join(', ') + ' is on the page for ' + file);
      const fromJs = from ? `document.querySelector(${JSON.stringify(from)}).getBoundingClientRect().top` : 'p.top';
      const need = await ev(`(() => { const el = document.getElementById('panel'); el.scrollTop = 0; const p = el.getBoundingClientRect(), f = ${fromJs}, e = ${upJs}.getBoundingClientRect().bottom; return { off: f - p.top, len: e - f }; })()`);
      const tall = Math.min(3200, Math.max(1400, Math.ceil(need.len + 160)));
      await page.send('Emulation.setDeviceMetricsOverride', { width: W, height: tall, deviceScaleFactor: 1, mobile: false });
      await settle();
      // scrolled so that the piece starts just below the tabs, which stay at the panel's top
      const r = await ev(`(() => { const el = document.getElementById('panel'); el.scrollTop = 0; const tabs = el.querySelector('.tabs').getBoundingClientRect().height; el.scrollTop = Math.max(0, ${from ? `document.querySelector(${JSON.stringify(from)}).getBoundingClientRect().top - el.getBoundingClientRect().top - tabs - 10` : 0}); const p = el.getBoundingClientRect(), e = ${upJs}.getBoundingClientRect();
        const top = ${from ? `document.querySelector(${JSON.stringify(from)}).getBoundingClientRect().top - 6` : 'p.top'};
        return [p.left, top, el.clientWidth, Math.min(p.bottom, e.bottom + 6) - top]; })()`);
      await settle(2);
      await shot(file, { clip: { x: Math.round(r[0]), y: Math.round(r[1]), width: Math.round(r[2]), height: Math.round(r[3]) }, scale: 2, scene });
      await ev(`document.getElementById('panel').scrollTop = 0`);
      await page.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
      await tick(2);
    }
    // numbered marks over the parts of the screen, for the chapter that names them; removed after the picture
    const MARKS = (list) => `(() => { const box = document.createElement('div'); box.id = 'guideMarks';
      for (const [sel, n, side, dy] of ${JSON.stringify(list)}) { const el = document.querySelector(sel); if (!el) continue; const r = el.getBoundingClientRect(); const m = document.createElement('div');
        const x = side === 'right' ? r.right - 22 : r.left - 38;     // astride the right edge, or just left of the element
        const y = dy === 'mid' ? r.top + r.height / 2 - 15 : r.top + dy;   // at a height from its top, or halfway down it
        m.textContent = n; m.style.cssText = 'position:fixed;z-index:999;left:' + x + 'px;top:' + y + 'px;width:30px;height:30px;border-radius:50%;background:#d8c29a;color:#0b1f33;font:700 17px/30px Georgia,serif;text-align:center;box-shadow:0 0 0 2px #0b1f33,0 0 0 4px #d8c29a';
        box.appendChild(m); }
      document.body.appendChild(box); })()`;
    const clearMarks = () => ev(`(() => { const m = document.getElementById('guideMarks'); if (m) m.remove(); })()`);
    const T = (min) => `sim.night.tTouch >= 0 && sim.t - sim.night.tTouch >= ${min * 60}`;   // min after the touch, for holdAt
    // the forecast's end on a watch, minutes after the touch: where it hands her over (over and overT, core/night.js's
    // forecaster), on a default watch the break's onset (D98: the line's "Breaks at"); her flag where she founders first,
    // or on a forecast that has neither
    const FC_END = `(() => { const f = ${S}.forecast; return +(((f.over ? f.overT : f.founderT) - ${S}.sim.night.tTouch) / 60).toFixed(2); })()`;
    const readouts = () => ev(`({ clock: document.getElementById('shipTime').textContent, trim: document.getElementById('sTrim').textContent, list: document.getElementById('sList').textContent, water: document.getElementById('sWater').textContent, status: document.getElementById('status').textContent, hull: (document.getElementById('girderValue') || {}).textContent || '', hullWhere: (document.getElementById('girderWhere') || {}).textContent || '' })`);

    // ================================================================ the 1912 watch, on its reconstructed orders, to the end
    if (want('watch')) {
      console.log('scene: the 1912 watch (#night=1912, then Watch the 1912 orders), to the end');
      await open('#night=1912', 'desktop');
      await b.click('bAuto');                                            // the 1912 orders on the bridge (a real click)
      await tick(2);
      const mode = await ev(`${S}.night.mode`);
      row(mode === 'auto', 'Watch the 1912 orders (a real click) puts the scripted orders on', mode);
      // the page's own setting: no slowing of the clock when a report comes, so that the clock keeps the pace chosen
      await b.click('rpSlow');
      row((await ev(`TitanicApp.reports.slow()`)) === false, 'the reports\' slowing of the clock switched off (a real click)', 'off');
      // the stern gear at full speed, before anything is seen
      await view('stern');
      await tick(120);                                                   // 4 s: the camera settles under her stern
      await hideToast();
      await settle(4);
      await shot('screws.jpg', { clip: await stage('#bridge'), scene: 'the Screws view at 22.5 knots, 4 s into the watch (the stage above the Bridge)' });
      // the bells, held 2.5 s after them: from astern, the screen's parts numbered, then the lookouts' eye at night
      await view('astern');
      await holdAt(`sim.night.tBells >= 0 && sim.t - sim.night.tBells >= 2.5`, 'the bells');
      await settle(6);
      facts.bells = await ev(`TitanicApp.state.sim.events.find(e => e.id === 'bells').label`);
      facts.bellsToast = await ev(`document.getElementById('toast').textContent`);
      await shot('watch-bells.jpg', { scene: 'the 1912 watch 2.5 s after the bells, from astern' });
      await ev(MARKS([['#readout', 1, 'right', 'mid'], ['.views', 2, 'left', 4], ['#bridge', 3, 'right', -14], ['.strip', 4, 'right', -14], ['#panel', 5, 'left', 118]]));
      await shot('screen-marked.jpg', { scene: 'the same moment, the parts of the screen numbered' });
      await clearMarks();
      // her wake from above at 22.5 knots, still straight (no order yet): the field is up with her within seconds of the
      // watch's start (tools/wake_site_test.js); the Solid look, the Plan view; then the looks put back
      const lookBells = await looks();
      await xray(false); await nightLook(false);
      await view('plan');
      await tick(75);
      await hideToast();
      await settle(2);
      await shot('wake-plan.jpg', { clip: await stage(), scene: 'her wake from above at 22.5 knots, 2.5 s after the bells and before any order: Solid look, Plan view (the stage)' });
      row(await setLooks(lookBells), 'the looks put back after the wake from above', JSON.stringify(lookBells));
      await view('nest');
      await nightLook(true);
      await settle(12);
      await hideToast();
      await settle(2);
      await shot('nest-night.jpg', { clip: await stage('#bridge'), scene: 'the same moment from the crow\'s nest, in the Night look (the stage above the Bridge)' });
      facts.eyes = await ev(`({ nestAbove: TitanicApp.nightScene.NEST.above, boatDist: TitanicApp.nightScene.BOAT.dist, boatH: TitanicApp.nightScene.BOAT.h, stars: TitanicApp.nightScene.NIGHT.stars })`);
      // from her bridge, at night, eleven seconds after the bells
      await view('bridge');
      await resume();
      await holdAt(`sim.t - sim.night.tBells >= 11`, 'eleven seconds after the bells');
      await settle(6);
      await hideToast();
      await settle(2);
      await shot('bridge-view.jpg', { clip: await stage('#bridge'), scene: 'the view from her bridge at night, 11 s after the bells (the stage above the Bridge)' });
      // the touch, from astern in the X-ray hull (the orders are scripted by the model's step: a faster clock changes nothing)
      await xray(true);
      await view('astern');
      await ev(`${S}.warp = 2`);
      await resume();
      await holdAt(T(0.05), 'the touch');
      await settle(6);
      facts.touch = await ev(`TitanicApp.state.sim.events.find(e => e.id === 'touch').label`);
      await shot('watch-touch.jpg', { clip: await stage(), scene: 'the 1912 watch 3 s after the touch (the stage)' });
      // six seconds after the touch, from her quarter in the Night look: her lights, the berg alongside, her wake
      // (tools/night_scene_site_test.js); then the looks put back
      const lookTouch = await looks();
      await resume();
      await holdAt(T(0.1), 'six seconds after the touch');
      await xray(false); await nightLook(true);
      await view('quarter');
      await tick(75);
      await hideToast();
      await settle(2);
      await shot('night-quarter.jpg', { clip: await stage(), scene: 'the 1912 orders 6 s after the touch, from her quarter in the Night look (the stage)' });
      row(await setLooks(lookTouch), 'the looks put back after the Night look on her quarter', JSON.stringify(lookTouch));
      // to the end of the encounter, faster
      await ev(`${S}.warp = 4`);
      await resume();
      await until(`${S}.sim.night.tClear >= 0`, 6000, FRAME, 'the end of the encounter');
      await freeze();
      // her wake when the encounter is over, the model held: the 1912 turn from above, the Plan view drawn back so that the
      // curve of her track and the berg are in it (the pair of wake-plan.jpg), in the Solid look; then from astern in the
      // X-ray look with its lines of equal height (tools/wake_site_test.js, section 4); the looks put back
      const lookClear = await looks();
      await xray(false); await nightLook(false);
      await view('plan');
      await tick(30);
      await ev(PLAN_BACK);
      await tick(45);
      await hideToast();
      await settle(2);
      await shot('wake-turn.jpg', { clip: await stage(), scene: 'her wake at the end of the encounter on the 1912 orders, from above, the Plan view drawn back: Solid look (the stage)' });
      await xray(true);
      await view('astern');
      await tick(75);
      await hideToast();
      await settle(2);
      await shot('wake-lines.jpg', { clip: await stage(), scene: 'the same moment from astern in the X-ray look: lines of equal height across her wake (the stage)' });
      row(await setLooks(lookClear), 'the looks put back after her wake at the end of the encounter', JSON.stringify(lookClear));
      await settleForecast(true);
      facts.verdict = await ev(`TitanicNight.verdict(TitanicApp.state.sim)`);
      facts.watchText = await ev(`document.getElementById('watchText').textContent`);
      facts.forecast = await ev(`document.getElementById('fcLine').textContent`);
      // the forecast's end (FC_END). The fact keeps its name for tools/build_guide.js (@@end.forecastMin@@): on a default
      // watch it is the break's
      facts.forecastMin = await ev(FC_END);
      facts.windowRows = await ev(`[...document.querySelectorAll('#winBody tr')].map(t => [t.cells[0].textContent, t.cells[1].textContent])`);
      await hideToast();
      await panelShot('run-watch.png', 'run', '#debrief h3', '#debrief', 'the Run tab after the encounter: the same berg, another watch');
      // the crew's minds (88_minds.js; join 18), the fold under the order line open, as the desktop app shows it on its
      // first start: switched off, no key. The page is in a browser here, so the app's own first answer (app/minds.js's
      // status for a new profile, made in Node) is given to the page's fold through its test hook (TitanicApp.minds
      // .useTransport), and taken back after the picture. Switched off, it asks nothing and gives no order
      const first = require('../app/minds.js').create({ safeStorage: { isEncryptionAvailable: () => true }, anthropic: {} }).status();
      facts.mindsFirst = { on: first.on, provider: first.provider, modelUsed: first.modelUsed, hasKey: first.hasKey, limits: first.limits };
      await ev(`(() => { const st = ${JSON.stringify(first)}, ok = (v) => Promise.resolve(JSON.parse(JSON.stringify(v))), no = { ok: false, kind: 'off', why: 'The crew\\'s minds are switched off.' };
        TitanicApp.minds.useTransport({ status: () => ok(st), set: () => ok(st), setKey: () => ok(st), clearKey: () => ok(st), test: () => ok(no), ask: () => ok(no), usage: () => ok({ ok: true, used: st.used, limits: st.limits }) });
        return true; })()`);
      await settle(6);
      await ev(`(() => { const f = document.getElementById('mindsFold'); if (f) f.open = true; return !!f; })()`);
      await settle(6);
      row(await ev(`(() => { const f = document.getElementById('mindsFold'); return !!f && f.open && /Provider/.test(f.textContent); })()`), 'the crew\'s minds open on the Run tab with the app\'s first answer: its settings drawn', facts.mindsFirst.provider + ', ' + facts.mindsFirst.modelUsed + ', key ' + facts.mindsFirst.hasKey);
      await panelShot('minds.png', 'run', '#mindsFold', '#mindsFold', 'the crew\'s minds open on the Run tab, as the desktop app shows them on its first start (its first answer given to the page)');
      await ev(`(() => { const f = document.getElementById('mindsFold'); if (f) f.open = false; TitanicApp.minds.useTransport(null); return true; })()`);
      await settle(4);
      // seven and a half minutes after the touch: the Systems tab
      await b.clickSel('#speedSeg button[data-speed="60"]');
      await holdAt(T(7.5), 'seven and a half minutes after the touch');
      await panelShot('systems.png', 'systems', null, '#sysChain', 'the Systems tab 7.5 minutes after the touch on the 1912 watch: what depends on what');
      facts.pumpsRow = await ev(`document.querySelector('#sysChain li[data-k="pumps"] span').textContent`);
      facts.pumpWho = await ev(`document.getElementById('pumpWho').textContent`);
      // forty minutes after the touch: the water forward in the X-ray hull; the reports so far; the bridge's own view
      await b.clickSel('.tab[data-tab="run"]');
      await view('quarter');
      await b.clickSel('#speedSeg button[data-speed="900"]');
      await resume();
      await holdAt(T(40), 'forty minutes after the touch');
      await tick(90);                                                    // the camera settles
      await hideToast();
      await settle(6);
      facts.at40 = await readouts();
      await shot('watch-flooding.jpg', { clip: await stage(), scene: 'the 1912 watch 40 minutes after the touch, quarter view, X-ray hull (the stage)' });
      await panelShot('reports.png', 'run', '#rpSec', ['#rpFeed li:nth-child(3)', '#rpFeed'], 'the Run tab 40 minutes after the touch: the orders, and the reports to the bridge, newest first');
      facts.reportsAt40 = await ev(`TitanicApp.reports.lines()`);
      await b.click('rpView');                                           // "As the bridge knew it" (a real click)
      await settle(12);
      await hideToast();
      await settle(2);
      facts.bridgeKnew = await ev(`({ sentence: document.getElementById('rpWatchText').textContent, line: document.getElementById('rpLine').textContent, trim: document.getElementById('rpTrim').textContent, list: document.getElementById('rpList').textContent, known: document.getElementById('rpKnown').textContent, status: document.getElementById('rpStatus').textContent, xray: ${S}.xray })`);
      await shot('bridge-knew.jpg', { clip: await stage(), scene: 'the same moment as the bridge knew it: what nobody on the bridge could read is covered (the stage)' });
      await b.click('rpView');                                           // back to the instruments' view
      await settle(6);
      await xray(true);
      // her nervous system as the bunker of the fire gives way (77_nerves.js; Z2's setting, before the first rocket):
      // boiler room 5's fires pointed at, so that the line under the graph says why they stand as they do
      await holdAt(`(sim.pockets || []).some(k => /bunker/i.test(k.name) && k.state !== 0)`, 'the bunker of the fire giving way');
      facts.nervesAt = await ev(`+((${S}.sim.t - ${S}.sim.night.tTouch) / 60).toFixed(2)`);
      await b.clickSel('.tab[data-tab="systems"]');
      await settle(4);
      await ev(`(() => { const g = document.querySelector('.nv-node[data-id="fires:1"]'); if (g) g.dispatchEvent(new MouseEvent('click', { bubbles: true })); return !!g; })()`);
      await settle(2);
      facts.nervesCap = await ev(`(document.getElementById('nvCap') || {}).textContent || ''`);
      row(/\S/.test(facts.nervesCap), 'her nervous system as the bunker gives way, boiler room 5\'s fires pointed at', facts.nervesAt + ' min: ' + facts.nervesCap.slice(0, 50));
      await panelShot('nerves.png', 'systems', '#nvSec', ['#nvCap', '#nvSec'], 'the Systems tab as the bunker of the fire gives way on the 1912 watch: her nervous system, boiler room 5\'s fires pointed at');
      // the first rocket: held as it is fired, then its burst seen from astern at night while the model stands still
      await view('astern');
      await resume();
      await holdAt(`sim.world && sim.world.rockets.fired >= 1`, 'the first rocket');
      facts.rocketAt = await ev(`+((${S}.sim.t - ${S}.sim.night.tTouch) / 60).toFixed(2)`);
      await nightLook(true);
      await tick(82);                                                    // 2.7 s of the page's own time: the rocket climbs and bursts
      await hideToast();
      await settle(2);
      await shot('rocket.jpg', { clip: await stage(), scene: 'the first rocket bursting over her, seen from astern in the Night look (the stage)' });
      await panelShot('help.png', 'run', '#helpSec', '#helpSec .help-orders', 'the Run tab as the first rocket goes up: the wireless, who has answered, the rockets');
      facts.helpAtRocket = await ev(`({ set: document.getElementById('helpSet').textContent, ships: [...document.querySelectorAll('#helpShips li')].map(li => li.textContent), rockets: document.getElementById('helpRockets').textContent })`);
      // the boats, 85 minutes after the touch: their panel, and the port boats seen from a boat off her beam at night
      await resume();
      await holdAt(T(85), 'eighty-five minutes after the touch');
      await panelShot('boats.png', 'run', '#boatsSec', '#boatsFill', 'the Run tab 85 minutes after the touch: the boats and the orders to them');
      facts.boatsAt85 = await ev(`TitanicApp.boats.stats()`);
      await view('boat');
      await settle(10);
      await hideToast();
      await settle(2);
      await shot('boats-night.jpg', { clip: await stage('#bridge'), scene: 'the same moment from a boat off her port beam, at night (the stage above the Bridge)' });
      // 2:05 am by her clock: the sinking from a boat off her beam, her lights still burning
      await resume();
      await holdAt(T(145), 'two hours and twenty-five minutes after the touch');
      await view('boat');                                                // the button again: the boat laid off her beam once more
      await settle(10);
      await hideToast();
      await settle(2);
      facts.at145 = await readouts();
      await shot('night-boat.jpg', { clip: await stage('#bridge'), scene: 'two hours and twenty-five minutes after the touch, from a boat off her port beam, at night' });
      // the same moment walked (site/parts/76_walk.js): a real click on Walk puts the eye on her E deck amidships, looking
      // forward; the whole stage, so that the line saying where is seen; the button again brings the camera back
      await b.clickSel('[data-view="walk"]');
      await settle(10);
      await hideToast();
      await settle(2);
      facts.walk = await ev(`(() => { const s = TitanicApp.walk.state(); return { on: s.on, deck: s.deck, x: +s.x.toFixed(2), y: +s.y.toFixed(2), where: s.where, depth: +s.depth.toFixed(2) }; })()`);
      row(facts.walk.on && facts.walk.deck === 'E', 'Walk (a real click) puts the eye on her E deck', facts.walk.where);
      await shot('walk.jpg', { clip: await stage(), scene: 'the same moment walked: her E deck from amidships, looking forward (the stage)' });
      await b.clickSel('[data-view="walk"]');
      await settle(4);
      row(!(await ev(`TitanicApp.walk.on()`)), 'Walk again (a real click) brings the walker out', 'out');
      // the hull's gauge inside the studies' range, in the profile view with the X-ray hull and its band
      await xray(true);
      await view('profile');
      await resume();
      // (read once a second of her time: the moment over her 4,852 columns is not free)
      await holdAt(`sim.night.tTouch >= 0 && sim.night.k % 4 === 0 && TitanicGirder.zone(TitanicGirder.moment(sim).gov.M) === 'within'`, 'the hull gauge in the range');
      await tick(110);                                                   // the camera settles; the gauge reads four times a second
      await hideToast();
      await settle(4);
      facts.gaugeIn = Object.assign(await readouts(), { min: await ev(`+((${S}.sim.t - ${S}.sim.night.tTouch) / 60).toFixed(2)`) });
      await shot('hull-gauge.jpg', { clip: await stage('#bridge'), scene: 'the 1912 watch when the hull gauge enters the studies\' range, profile view, X-ray hull (the stage above the Bridge)' });
      await shot('gauge.png', { clip: await around('#readout', 6), scale: 2, scene: 'the readouts at the same moment, the hull gauge in its line' });
      // where she would break: the first step her own loads reach her strength somewhere along her (core/readers/onset.js,
      // site/parts/55_girder.js), still in the profile view with the X-ray hull. Since G12's cascade (D98) a default watch
      // ends on that very step: the night hands her to her fall there (Night.over), the page says she broke, and the end
      // card stands on the stage. The line under the gauge and the red ring come only from that step, so the pictures are
      // taken on it, not on the step before: the readouts first (the card stands in the stack, in its own column beside
      // them, clear of their clip); then the card and the readers at her end; then the card put away (a real click) and
      // the ring taken on the stage without it. A watch handed over at the flag (handover=flag, the what-if) reaches its
      // onset minutes before its end: there the ring is taken at once, and the card at the flag, as before D98
      await resume();
      await holdAt(`!!(sim.onset && sim.onset.found)`, 'the onset of the break');
      await tick(30);
      await hideToast();
      await settle(4);
      facts.onset = Object.assign(await readouts(), { min: await ev(`+((${S}.sim.t - ${S}.sim.night.tTouch) / 60).toFixed(2)`), line: await ev(`document.getElementById('girderOnset').textContent`) });
      await shot('onset.png', { clip: await around('#readout', 6), scale: 2, scene: 'the readouts at the onset of the break on the 1912 orders, where a default watch ends: the red line under the hull gauge' });
      const CARD = `!!document.getElementById('endCard') && !document.getElementById('endCard').hidden`;
      const endsHere = await ev(`TitanicApp.gone(${S}.sim) && ${CARD}`);
      row(endsHere && (await ev(`TitanicApp.broke(${S}.sim)`)), 'the 1912 watch ends where she breaks (D98): gone on the onset\'s step, the card up', endsHere ? await ev(`document.querySelector('#endCard .endcard-title').textContent`) : 'not gone at the onset');
      const ringShot = (put) => shot('onset-xray.jpg', { clip: put, scene: 'the same moment in the profile view with the X-ray hull' + (endsHere ? ', the end card put away' : '') + ': the red ring where she would break (the stage above the Bridge)' });
      if (!endsHere) await ringShot(await stage('#bridge'));
      // to the end: the card, and what each reader of the watch holds then. With the fall's engine in the page the night
      // steps on past her hand-over (Z3), so the clock is stopped on the hand-over's own frame: the card and the readers
      // are read there, as before the fall (on a default watch the onset's step, where the clock already stands)
      if (!endsHere) {
        await resume();
        await until(`TitanicApp.gone(${S}.sim) && ${CARD}`, 8000, FRAME, 'her end');
        await ev(`${S}.playing = false`);
        await tick(30);
        await hideToast();
        await settle(4);
      }
      await shot('end-card.png', { clip: await around('#endCard', 10), scale: 2, scene: 'the card at the end of the 1912 watch' + (endsHere ? ', where she breaks' : '') });
      facts.endCard = await ev(`({ title: document.querySelector('#endCard .endcard-title').textContent, lines: TitanicApp.nightEnd.sentences() })`);
      facts.link = await ev(`TitanicApp.nightEnd.link().replace(/^[^#]*/, '')`);
      // her end, minutes after the touch, on either hand-over (TitanicApp.goneT: the onset's time, or her flag's). The fact
      // keeps its name for tools/build_guide.js (@@end.founderMin@@, @@end.founderClock@@): on a default watch it is the
      // break's
      facts.founderMin = await ev(`+((TitanicApp.goneT(${S}.sim) - ${S}.sim.night.tTouch) / 60).toFixed(2)`);
      facts.lights = await ev(`({ min: ${S}.lightsFailT > 0 ? +((${S}.lightsFailT - ${S}.sim.night.tTouch) / 60).toFixed(2) : null, why: ${S}.lightsFailWhy })`);
      facts.people = await ev(`(() => { const r = TitanicPeople.readouts(${S}.sim), t0 = r.tTouch; return { aboardAtStart: r.aboardAtStart, places: r.places, boats: r.boats, boatsAway: r.boatsAway, inBoatsAway: r.inBoatsAway, emptyAway: r.emptyAway, water: r.water, aboard: r.aboard, uncoverMin: +((r.uncoverT - t0) / 60).toFixed(2), callMin: +((r.callT - t0) / 60).toFixed(2),
        list: r.list.map(b => ({ id: b.id, side: b.side, cap: b.cap, state: b.state, n: b.n, away: b.tAway >= 0 ? +((b.tAway - t0) / 60).toFixed(2) : null, floated: b.tFloat >= 0 ? +((b.tFloat - t0) / 60).toFixed(2) : null })) }; })()`);
      facts.world = await ev(`(() => { const r = TitanicWorld.readouts(${S}.sim), W = ${S}.sim.world; return { call: { orderedT: r.call.orderedT, firstT: r.call.firstT, by: r.call.by }, rockets: { fired: r.rockets.fired, times: r.rockets.times.map(x => +x.toFixed(2)) },
        ships: r.ships.map(s => ({ id: s.id, name: s.name, state: s.state, heardT: s.heardT === null ? null : +s.heardT.toFixed(2), etaT: s.etaT === null ? null : +s.etaT.toFixed(2), eta: s.eta, nm: s.nm === null ? null : +s.nm.toFixed(1), stoppedT: s.stoppedT === null ? null : +s.stoppedT.toFixed(2) })),
        lines: W.lines.map(l => ({ T: +l.T.toFixed(2), kind: l.kind, text: l.text })) }; })()`);
      facts.reports = await ev(`(() => { const R = ${S}.sim.reports, t0 = ${S}.sim.night.tTouch; return R.feed.filter(e => e.kind !== 'routine').map(e => ({ min: +((e.t - t0) / 60).toFixed(2), who: e.who, by: e.by, words: e.words })); })()`);
      // the card put away (a real click); on a default watch the red ring then, on the stage without the card
      await b.click('endClose');
      if (endsHere) {
        await settle(4);
        await hideToast();
        await settle(2);
        await ringShot(await stage('#bridge'));
      }
      // past her hand-over (Z3; the deep, site/parts/75_deep.js): the night steps on beside her fall, which begins where
      // she broke on a default watch (sim.fall.t0 is the hand-over's time). Her fall at 60x in the X-ray look, held about
      // a hundred seconds after the hand-over; then the Bow view (its button heads the strip, which comes with the fall),
      // the camera brought to it with the clock stopped
      await b.clickSel('#speedSeg button[data-speed="60"]');
      await xray(true);
      await holdFall(`!!sim.fall && sim.fall.t - sim.fall.t0 >= 100`, 'a hundred seconds after her hand-over');
      await view('deep');
      await tick(90);
      await hideToast();
      await settle(4);
      facts.fall = await ev(`(() => { const f = ${S}.sim.fall, p = f.pieces.find(q => q.id === 'bow') || f.pieces[0]; return { after: Math.round(f.t - f.t0), bowDepth: Math.round(p.depth).toLocaleString('en-US'), bowSpeed: p.speed.toFixed(1), clock: document.getElementById('shipTime').textContent }; })()`);
      await shot('fall-xray.jpg', { clip: await stage(), scene: 'about a hundred seconds after her hand-over on the 1912 orders (where she broke), the Bow view in the X-ray look (the stage)' });
      await nightLook(true);
      await settle(12);
      await hideToast();
      await settle(2);
      await shot('fall-night.jpg', { clip: await stage(), scene: 'the same moment in the Night look: the lamp and the darkening water (the stage)' });
      // the same moment in the Column view (the deep's own button), in the X-ray look, where her pieces show: the whole
      // sea in one picture, her two pieces in it (the code below takes the X-ray look next in any case)
      await view('column');
      await xray(true);
      await tick(90);
      await hideToast();
      await settle(4);
      await shot('deep-column.jpg', { clip: await stage(), scene: 'the same moment in the Column view, in the X-ray look: the sea from the surface to the bed, her two pieces in it (the stage)' });
      // both pieces at rest, the survey's outlines laid on the bed: the page stops its own clock then ("On the bed")
      await xray(true);
      await b.clickSel('#speedSeg button[data-speed="900"]');
      await resume();
      await until(`!!${S}.sim.fall && ${S}.sim.fall.done`, 8000, FRAME, 'both pieces at rest');
      if (!(await ev(`document.getElementById('endCard').hidden`))) await b.click('endClose');   // a line came on the card as each piece came to rest
      await view('deep');
      await tick(90);
      await hideToast();
      await settle(4);
      // with each piece's speed at the bed and its mean speed from going under to the bed (its events 'under' and
      // 'strike': depth, speed, time), for the guide's answer to how fast she went down
      facts.rest = await ev(`(() => { const f = ${S}.sim.fall, p = (id) => f.pieces.find(q => q.id === id) || {}, evt = (id, piece) => f.events.find(e => e.id === id && e.piece === piece);
        const strike = (piece) => { const e = evt('strike', piece); return e ? e.speed.toFixed(2) : null; };
        const mph = (piece) => { const u = evt('under', piece), s = evt('strike', piece); return u && s && s.t > u.t ? ((s.depth - u.depth) / (s.t - u.t) * 2.23694).toFixed(0) : null; };
        const gap = (k) => { const g = TitanicApp.deep && TitanicApp.deep.gap && TitanicApp.deep.gap(); return g ? Math.round(g[k]).toLocaleString('en-US') : null; };   // the deep's label at rest (QC B-5), as it rounds
        return { bowDepth: Math.round(p('bow').depth).toLocaleString('en-US'), sternDepth: Math.round(p('stern').depth).toLocaleString('en-US'), bowStrike: strike('bow'), sternStrike: strike('stern'), bowMph: mph('bow'), sternMph: mph('stern'), bowOn: gap('along'), bowHdg: gap('hdg'), play: document.getElementById('bPlay').textContent, lines: TitanicApp.nightEnd.sentences() }; })()`);
      row(facts.rest.play === 'On the bed', 'both pieces at rest: the page stops its own clock', facts.rest.play);
      row(facts.rest.bowOn !== null && facts.rest.bowHdg !== null, 'at rest: the deep\'s gap between the bows, the model\'s bow on along her heading at the hand-over (QC B-5)', facts.rest.bowOn + ' m on, ' + facts.rest.bowHdg + ' deg');
      await shot('rest-bow.jpg', { clip: await stage(), scene: 'both pieces at rest on the 1912 orders, the Bow view: the bow and the survey\'s outline of the bow (the stage)' });
      await view('sternfall');
      await tick(90);
      await hideToast();
      await settle(4);
      await shot('rest-stern.jpg', { clip: await stage(), scene: 'the same from the Stern view: the stern and the survey\'s outline of the stern (the stage)' });
    }

    // ================================================================ orders to the pumps after the ice, on the 1912 orders
    // Y6's what-if from the page: every pump that can reach boiler room 4, then boiler room 5, three minutes after the touch,
    // as tools/systems_site_test.js gives it (boiler room 4 is still dry then: on a watch the section lists it, quieter)
    if (want('pumps')) {
      console.log('scene: the 1912 orders, then every pump that can reach boiler rooms 4 and 5, three minutes after the touch');
      await open('#night=1912', 'desktop');
      await b.click('bAuto');
      await tick(2);
      await b.click('rpSlow');
      await ev(`${S}.warp = 4`);
      await until(`${S}.sim.night.tClear >= 0`, 8000, FRAME, 'the end of the encounter');
      await freeze();
      await settleForecast(false);
      await b.clickSel('#speedSeg button[data-speed="60"]');
      await holdAt(T(3), 'three minutes after the touch');
      await b.clickSel('.tab[data-tab="systems"]');
      await settle(6);
      // the forecast's end before and after the orders (FC_END: on a default watch the break's, D98; the fields keep their
      // names for tools/build_guide.js, @@pumpOrder.before@@ and @@pumpOrder.after@@)
      const before = await ev(`({ min: ${FC_END}, line: document.getElementById('fcLine').textContent, who: document.getElementById('pumpWho').textContent })`);
      const sel = (k) => `#pumpRooms .proom[data-proom="${k}"] button[data-pwhich="all"]`;
      const br4 = await ev(`(() => { const d = document.querySelector('#pumpRooms .proom[data-proom="6"]'); return d ? { dry: d.classList.contains('dry'), head: d.querySelector('.kv').textContent, water: TitanicSystems.readouts(${S}.sim).pumps.rooms.some(r => r.k === 6) } : null; })()`);
      row(!!br4 && br4.dry && !br4.water, 'boiler room 4, still dry, is listed in the quieter form', br4 ? br4.head : 'not listed');
      for (const k of [6, 5]) {                                          // boiler room 4, then 5: real clicks on the chips
        if (!(await ev(`!!document.querySelector(${JSON.stringify(sel(k))})`))) throw new Error(`room ${k} has no "Every pump that can reach it" chip three minutes after the touch`);
        await b.clickSel(sel(k));
        await tick(2);
      }
      const toast = await ev(`document.getElementById('toast').textContent`);
      await settleForecast(false);
      const after = await ev(`({ min: ${FC_END}, line: document.getElementById('fcLine').textContent, who: document.getElementById('pumpWho').textContent, log: ${S}.sim.night.log.filter(o => o.type === 'pump').map(o => [o.value, o.arg]), replay: !document.getElementById('bReplay').disabled, mode: ${S}.night.mode })`);
      row(after.log.length === 2 && after.min !== before.min, 'the chips give two orders to the pumps, and the forecast moves', before.min + ' -> ' + after.min + ' min after the touch');
      row(after.replay && after.mode === 'you', 'the orders make the watch the player\'s and enable "Replay my watch"', after.mode);
      facts.pumpOrder = { atMin: 3, rooms: [6, 5], br4, before, after, toast };
      await hideToast();
      // from boiler room 5 (k 5) down to boiler room 3 (k 7), the first room aft of the orders and still dry: on a watch
      // the list runs from the forepeak to the shaft tunnel, too tall for the page beside the text
      await panelShot('pumps.png', 'systems', '#pumpRooms .proom[data-proom="5"]', ['#pumpRooms .proom[data-proom="7"]', '#pumpSec .prooms'], 'the Systems tab\'s Pumps section just after the orders');
    }

    // ================================================================ a stem strike: night 16, no order given
    if (want('stem')) {
      console.log('scene: night 16, no order (#night=16)');
      await open('#night=16', 'desktop');
      await ev(`${S}.warp = 6`);
      await holdAt(T(0.05), 'the touch on night 16');
      await view('quarter');
      await tick(110);                                                   // the camera settles; the model holds
      await settle(4);
      await shot('stem-strike.jpg', { clip: await stage(), scene: 'night 16 with no order, 3 s after the stem met the ice, quarter view (the stage)' });
      await resume();
      await until(`${S}.sim.night.tClear >= 0`, 6000, FRAME, 'the end of night 16');
      await freeze();
      await settleForecast(false);
      facts.stemVerdict = await ev(`TitanicNight.verdict(TitanicApp.state.sim)`);
      facts.stemForecast = await ev(`document.getElementById('fcLine').textContent`);
    }

    // ================================================================ the 1912 damage preset, with the hull gauge's curve
    if (want('preset')) {
      console.log('scene: the 1912 damage preset (#scenario=titanic)');
      await open('#scenario=titanic', 'desktop');
      // the gauge's reading through the run, read on the model's own steps: every minute, and on every step from 2:10 am, so
      // that the moments the guide quotes are the model's own on the step they happen
      await ev(`(() => { window.__gauge = []; let next = 0; TitanicApp.on('step', (sim) => { if (sim.t < next) return; next = sim.t + (sim.t >= 150 * 60 ? 0 : 60);
        const g = TitanicGirder.moment(sim).gov, r = TitanicCore.readouts(sim); window.__gauge.push([+(sim.t / 60).toFixed(3), +r.trimDeg.toFixed(3), +(g.M / 1e9).toFixed(4), g.zone]); }); })()`);
      await settleForecast(false);
      facts.presetForecast = await ev(`document.getElementById('fcLine').textContent`);
      await panelShot('run-cards.png', 'run', '#scenCards', '#scenCards .card:nth-child(4)', 'the Run tab: the first four scenario cards');
      await b.clickSel('#speedSeg button[data-speed="900"]');
      // the first of her grand staircases' domes to give way (C.stairState; the page's own notice names it), from her
      // quarter on the step it goes (tools/topsides_site_test.js, section 4), and 2:09 am: each held in the order the model
      // reaches them, so that neither moves the other
      const DOME = `(TitanicCore.stairState ? TitanicCore.stairState(sim) : []).some(o => o.dome && o.state === 2)`;
      let domeTaken = false;
      const domeShot = async () => {
        await view('quarter');
        await tick(40);
        await settle(4);
        facts.dome = await ev(`(() => { const sim = TitanicApp.state.sim; return { ids: TitanicCore.stairState(sim).filter(o => o.dome && o.state === 2).map(o => o.id), min: +(sim.t / 60).toFixed(2), clock: document.getElementById('shipTime').textContent, notice: document.getElementById('toast').textContent }; })()`);
        await shot('dome.jpg', { clip: await stage(), scene: 'the 1912 damage on the step the first grand staircase\'s dome gives way, from her quarter, the page\'s notice naming it (the stage)' });
        domeTaken = true;
      };
      // her rooms at 1:20 am, 100 minutes in (79_cabins.js; Z2's setting): the Turkish bath on F deck picked in the Damage
      // tab's "Her rooms", then cleared, so that no picture of the stage after it carries the room's mark
      await holdAt(`sim.t >= 100 * 60`, '1:20 am');
      await b.clickSel('.tab[data-tab="damage"]');
      await tick(4);                                                     // the tab shown: its frames ask for the tables
      await waitFor(`!!TitanicApp.cabins && (TitanicApp.cabins.ready() || !!TitanicApp.cabins.error())`, 30000, 'her rooms\' tables');
      facts.roomPicked = await ev(`(TitanicApp.cabins.pick('F-045'), TitanicApp.cabins.picked())`);
      await settle(6);
      row(!!facts.roomPicked, 'a room picked in Her rooms at 1:20 am on the 1912 damage', facts.roomPicked ? facts.roomPicked.label + ' (' + facts.roomPicked.deck + ')' : String((await ev('TitanicApp.cabins.error()')) || 'F-045 not found'));
      await panelShot('rooms.png', 'damage', '#cbSec', '#cbSec', 'the Damage tab at 1:20 am on the 1912 damage: Her rooms, the Turkish bath on F deck picked');
      await b.click('cbClear');
      await settle(2);
      await holdAt(`${DOME} || sim.t >= 149 * 60`, 'a dome given way, or 2:09 am');
      if (await ev(`(() => { const sim = TitanicApp.state.sim; return ${DOME}; })()`)) { await domeShot(); await resume(); await holdAt(`sim.t >= 149 * 60`, '2:09 am'); }
      await tick(60);
      await settle(6);
      facts.at0209 = await readouts();
      await shot('preset-0209.jpg', { scene: 'the 1912 damage at 2:09 am, quarter view, X-ray hull' });
      await panelShot('evidence.png', 'evidence', null, '[data-pane="evidence"] .sec:nth-of-type(4)', 'the Evidence tab at 2:09 am: its three charts');   // RC1: "What this is, and what it is not" is the tab's first section now
      // the gallery (81_gallery.js; NH5): two of its cards, the night as recorded and the bulkheads to B deck; the others
      // are hidden for the picture and shown again after it
      const glOnly = (on) => ev(`(() => { const c = [...document.querySelectorAll('#glSec .gl-card')]; c.forEach(a => { a.style.display = ${on} && a.dataset.id !== 'baseline' && a.dataset.id !== 'bulkB' ? 'none' : ''; }); return c.filter(a => a.dataset.id === 'baseline' || a.dataset.id === 'bulkB').length; })()`);
      const glTwo = await glOnly(true);
      row(glTwo === 2, 'the gallery shows its cards on the 1912 damage: the night as recorded and the bulkheads to B deck', glTwo + ' of 2');
      await panelShot('gallery.png', 'evidence', '#glSec', '#glSec', 'the Evidence tab\'s gallery at 2:09 am: two of its cards, the night as recorded and the bulkheads to B deck');
      await glOnly(false);
      await panelShot('bulkheads.png', 'doors', '[data-pane="doors"] .sec:nth-of-type(3)', '#bhBody', 'the Bulkheads tab at 2:09 am: the fifteen bulkheads');
      if (!domeTaken) { await resume(); await holdAt(`${DOME} || sim.foundered`, 'a dome given way'); if (await ev(`(() => { const sim = TitanicApp.state.sim; return ${DOME}; })()`)) await domeShot(); }
      row(domeTaken, 'a grand staircase\'s dome gives way on the 1912 damage before she founders', facts.dome ? facts.dome.ids.join(', ') + ' at ' + facts.dome.clock : 'none');
      await resume();
      await until(`${S}.sim.foundered`, 6000, FRAME, 'the end of the 1912 damage');
      // where she would break on the damage preset: the page's own line under the gauge (site/parts/55_girder.js, kept
      // from the onset on), and its clock for chapter 06 (@@presetOnset.clock@@)
      facts.presetOnset = await ev(`(() => { const t = document.getElementById('girderOnset').textContent, m = /\\d{1,2}:\\d{2}(:\\d{2})? [ap]m/.exec(t); return { line: t, clock: m ? m[0] : null }; })()`);
      row(!!facts.presetOnset.clock, 'the onset\'s line on the 1912 damage, with its clock', facts.presetOnset.line || 'none');
      facts.gaugeCurve = await ev(`window.__gauge`);
      facts.gaugeCap = await ev(`({ low: TitanicGirder.CAP.low / 1e9, high: TitanicGirder.CAP.high / 1e9 })`);
      facts.presetEnd = await ev(`({ min: +(${S}.sim.founderT / 60).toFixed(2), card: TitanicApp.nightEnd.sentences() })`);
      // the witnesses, row by row (78_ledger.js; NH1) at her foundering: the first three rows in the picture, each read
      // (a row the run has not reached yet says so: it waits)
      facts.ledgerRows = await ev(`[...document.querySelectorAll('#ldList li.ld-row')].map(li => li.dataset.state)`);
      const ledRead = facts.ledgerRows.filter(s => s !== 'wait').length;
      row(facts.ledgerRows.length >= 3 && facts.ledgerRows.slice(0, 3).every(s => s !== 'wait'), 'the witness rows in the picture read by her foundering on the 1912 damage', ledRead + ' of ' + facts.ledgerRows.length + ' rows read');
      await panelShot('witnesses.png', 'evidence', '#ldSec', ['#ldList li:nth-child(3)', '#ldList'], 'the Evidence tab at her foundering on the 1912 damage: the witnesses, row by row (the first three)');
    }

    // ================================================================ a hole punched in the undamaged hull
    if (want('damage')) {
      console.log('scene: the undamaged hull and the hole tool (#scenario=blank)');
      await open('#scenario=blank', 'desktop');
      await settleForecast(false);
      await b.clickSel('.tab[data-tab="damage"]');
      await b.clickSel('#toolSeg button[data-tool="hole"]');
      await tick(4);
      // a point on her shell below the waterline, in No. 2 hold, on the side the camera sees
      const p = await ev(`(() => { const C = TitanicCore, x = 95, z = 3.2; for (const side of [-1, 1]) { const y = side * (C.halfBreadth(x, z) + 0.05), q = TitanicApp.project(x, y, z); const el = document.elementFromPoint(q.x, q.y); if (el && el.id === 'gl') return { x: q.x, y: q.y, side }; } return null; })()`);
      if (!p) throw new Error('no point of No. 2 hold is in view');
      for (const type of ['mousePressed', 'mouseReleased']) await page.send('Input.dispatchMouseEvent', { type, x: p.x, y: p.y, button: 'left', clickCount: 1 });
      await tick(2);
      const n = await ev(`${S}.sim.openings.length`);
      row(n === 1, 'a click on her shell with Punch hole opens one hole', n + ' opening(s), ' + (p.side < 0 ? 'starboard' : 'port') + ' side');
      await settleForecast(false);
      await holdAt(`sim.t >= 600`, 'ten minutes');
      await settle(6);
      facts.damageForecast = await ev(`document.getElementById('fcLine').textContent`);
      facts.damageRow = await ev(`[...document.querySelector('#holeBody tr').cells].slice(0, 5).map(c => c.textContent)`);
      await shot('damage-hole.jpg', { scene: 'one hole of about an A4 sheet in No. 2 hold, ten minutes on' });
    }

    // ================================================================ a phone
    if (want('phone')) {
      console.log('scene: a phone (390 x 780, touch), #night=1912');
      await page.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 780, deviceScaleFactor: 2, mobile: true });
      await page.send('Emulation.setTouchEmulationEnabled', { enabled: true });
      await open('#night=1912', 'phone');
      await holdAt(`sim.night.tBells >= 0 && sim.t - sim.night.tBells >= 2.5`, 'the bells on the phone');
      await settle(6);
      await shot('phone-watch.jpg', { scene: 'the 1912 watch on a phone, 2.5 s after the bells' });
      // the panel as a bottom sheet: a tap on the Run tab
      // (the tap's click arrives from the browser a moment later: wait for it in real time, and never tap twice, since a
      // second tap on the open tab closes the sheet again)
      const t = await ev(`(() => { const r = document.querySelector('.tab[data-tab="run"]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
      for (const type of ['touchStart', 'touchEnd']) await page.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: t.x, y: t.y }] });
      await waitFor(`document.getElementById('panel').classList.contains('open')`, 5000, 'the bottom sheet to open');
      const open1 = await ev(`document.getElementById('panel').classList.contains('open')`);
      row(open1, 'a tap on the Run tab opens the bottom sheet', String(open1));
      await hideToast();
      await settle(6);
      await B.sleep(2500);                            // a phone's scroll bar shows over the sheet and fades in real time: let it go
      await settle(2);
      await shot('phone-sheet.jpg', { scene: 'the same watch on the phone with the Run tab open as a bottom sheet' });
      await page.send('Emulation.setTouchEmulationEnabled', { enabled: false });
      await page.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
    }

    row(b.errors.length === 0, 'no error in the page\'s console', b.errors.length ? b.errors.slice(0, 3).join(' | ') : 'none');
  } catch (e) {
    fails++; console.log('FAIL the pictures could not be finished: ' + e.message);
    if (b.errors.length) console.log('page errors: ' + b.errors.slice(0, 5).join(' | '));
  } finally {
    await b.close();
  }

  // ---- the record, or the comparison
  if (verify) {
    const old = fs.existsSync(factsFile) ? JSON.parse(fs.readFileSync(factsFile, 'utf8')) : { images: {} };
    for (const [f, im] of Object.entries(images)) {
      const was = old.images && old.images[f];
      row(!!was && was.sha256 === im.sha256, 'the same picture again: ' + f, was ? (was.sha256 === im.sha256 ? 'identical' : 'differs (' + im.sha256.slice(0, 12) + ' against ' + was.sha256.slice(0, 12) + ')') : 'not in shots.json');
    }
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    for (const [k, v] of Object.entries(facts)) row(!!old.facts && same(old.facts[k], v), 'the same reading again: ' + k, old.facts && same(old.facts[k], v) ? 'identical' : 'differs');
    console.log('(retaken into ' + imgDir + ')');
  } else if (!fails) {
    const old = fs.existsSync(factsFile) && only ? JSON.parse(fs.readFileSync(factsFile, 'utf8')) : { images: {}, facts: {} };
    const rec = {
      note: 'Written by tools/guide_shots.js: the site build the pictures were taken from, each picture, and what the page said and showed. Do not edit by hand.',
      site: { version: site.version, app: site.app, worker: site.worker, styles: site.styles },
      browser,
      images: Object.assign({}, old.images, images),
      facts: Object.assign({}, old.facts, facts),
    };
    const sorted = (o) => Object.fromEntries(Object.keys(o).sort().map(k => [k, o[k]]));
    rec.images = sorted(rec.images); rec.facts = sorted(rec.facts);
    fs.writeFileSync(factsFile, JSON.stringify(rec, null, 1) + '\n');
    console.log('wrote ' + path.relative(root, factsFile).replace(/\\/g, '/'));
  }
  const total = Object.values(images).reduce((a, i) => a + i.bytes, 0);
  console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: ${Object.keys(images).length} pictures, ${(total / 1024 / 1024).toFixed(2)} MB`);
  process.exit(fails ? 1 : 0);
})();

// width and height of a JPEG, from its first start-of-frame marker
function jpegSize(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xFF) { i++; continue; }
    const m = buf[i + 1], len = buf.readUInt16BE(i + 2);
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
    i += 2 + len;
  }
  return [0, 0];
}
