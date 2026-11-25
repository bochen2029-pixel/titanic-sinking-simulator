// Drive a headless Chromium (Edge or Chrome) over the DevTools protocol, with nothing but Node 22+ (its global
// WebSocket and fetch). Used by tools/night_site_test.js and tools/visuals_site_test.js.
//   const B = await require('./cdp').launch({ dist, width, height });  ... await B.close();
// D3b (docs/DESIGN_electron_desktop_client_v3_2026-11-23.md, section 4): with TITANIC_APP naming the packaged desktop
// app (release\Titanic-win-x64\Titanic.exe, tools/package_app.js), a suite drives the app in place of the browser. It is
// started with its debugging port (the app opens one only when its command line asks), on a profile of its own, its
// window shown without taking the focus, and its page is the app's own: titanic://app/, from the app's dist/, which
// must be the suite's dist/, file for file (checkApp). Nothing else in a suite changes.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const net = require('net');
const { spawn } = require('child_process');
const { serve } = require('./serve');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const APP = process.env.TITANIC_APP ? path.resolve(process.env.TITANIC_APP) : null;
// the suite's dist/ must be the one inside the app, file for file: otherwise the app and Edge would not be shown the
// same page (node tools/package_app.js packages the current dist/)
function checkApp(dist) {
  if (!APP) return;
  if (!fs.existsSync(APP)) throw new Error('TITANIC_APP: there is no ' + APP + ' (node tools/package_app.js)');
  const inApp = path.join(path.dirname(APP), 'resources', 'app', 'dist'), mine = path.resolve(dist || path.join(__dirname, '..', 'dist'));
  const list = (d, b = d) => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? list(path.join(d, e.name), b) : [path.relative(b, path.join(d, e.name))]).sort();
  const a = list(mine), b = fs.existsSync(inApp) ? list(inApp) : [];
  const differ = a.filter(f => !b.includes(f) || !fs.readFileSync(path.join(mine, f)).equals(fs.readFileSync(path.join(inApp, f)))).concat(b.filter(f => !a.includes(f)));
  if (differ.length) throw new Error('TITANIC_APP: the app\'s dist/ is not ' + mine + ' (' + differ.slice(0, 3).join(', ') + '): node tools/package_app.js');
}
// the page's address: served on this machine to the browser, or the app's own
const pageURL = (port, hash) => (APP ? 'titanic://app/index.html' : `http://127.0.0.1:${port}/index.html`) + (hash || '');
function findBrowser() {
  const c = [process.env.BROWSER,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
  for (const p of c) if (p && fs.existsSync(p)) return p;
  throw new Error('no Chromium browser found: set BROWSER to the path of Edge or Chrome');
}
// a free port for a server of this process's own (it is free only until someone else takes it: never hand it to a
// browser; see openBrowser)
const freePort = () => new Promise((res, rej) => { const s = net.createServer(); s.on('error', rej); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
// The browser started on its own profile, choosing its own debugging port (--remote-debugging-port=0), which it writes
// on the first line of <profile>/DevToolsActivePort. Nothing is picked here and freed for another to take: before
// (BACKLOG G8) a port was found free, let go and handed to the browser, so two suites launched at the same instant could
// get the same one and one suite drive the other's browser. Returns { child, dbg } once the port is known (null on
// timeout: the caller kills the child).
async function openBrowser(args, profile, ms) {
  // the app (D3b): the browser's own arguments are not its; it takes the port, its profile and --inactive, and says the
  // port it chose on stderr (Chromium's "DevTools listening on ws://127.0.0.1:<port>/...") as well as in the profile
  let said = 0;
  const env = Object.assign({}, process.env); delete env.ELECTRON_RUN_AS_NODE;   // a shell inside an Electron app may carry it
  const child = APP ? spawn(APP, ['--remote-debugging-port=0', '--profile=' + profile, '--inactive'], { stdio: ['ignore', 'ignore', 'pipe'], env })
    : spawn(findBrowser(), ['--remote-debugging-port=0', '--user-data-dir=' + profile].concat(args), { stdio: 'ignore' });
  if (APP) { let buf = ''; child.stderr.on('data', (d) => { if (said) return; buf = (buf + d).slice(-4096); const m = /DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//.exec(buf); if (m) said = +m[1]; }); }
  const file = path.join(profile, 'DevToolsActivePort'), t0 = Date.now();
  for (;;) {
    try { const p = parseInt(fs.readFileSync(file, 'utf8').split('\n')[0], 10); if (p > 0) return { child, dbg: p }; } catch (e) { /* not written yet */ }
    if (said > 0) return { child, dbg: said };
    if (Date.now() - t0 > (ms || 15000)) return { child, dbg: null };
    await sleep(100);
  }
}
// a browser that openBrowser started, ended: killed, waited for (up to 5 s: its profile is its own until it has exited),
// then its profile removed, with retries (G16: 227 profiles were left behind by removing it once, too soon). Every launch
// site ends its browser through this. Returns whether the profile is gone.
async function closeBrowser(child, profile) {
  const gone = new Promise((r) => { if (child.exitCode !== null || child.signalCode !== null) r(); else child.once('exit', r); });
  // the app (D3b) with its whole process tree: its page's and GPU's processes hold the profile until they are gone
  if (APP && process.platform === 'win32' && child.exitCode === null) { try { spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' }); } catch (e) { /* gone */ } }
  else { try { child.kill(); } catch (e) { /* gone */ } }
  await Promise.race([gone, sleep(5000)]);
  for (let k = 0; k < (APP ? 25 : 5); k++) {
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { /* still held */ }
    if (!fs.existsSync(profile)) return true;
    await sleep(200);
  }
  return false;
}
// the browser's version, once a launch, on stderr (G16: an update staged beside the running Edge could move every page
// table at once; stderr, so that no suite's printed table changes with it)
async function logVersion(dbg) {
  try { const v = await (await fetch(`http://127.0.0.1:${dbg}/json/version`)).json(); process.stderr.write('browser: ' + v.Browser + '\n'); } catch (e) { /* not reported */ }
}
// a page's DevTools connection. Every call has a deadline (BACKLOG G16): a page that never answers fails in bounded
// time instead of holding its suite, and the queue, for good. callMs: the default (60 s); send's third argument: one call's
async function cdp(wsUrl, callMs) {
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('cannot reach the browser')); });
  let id = 0; const pending = new Map(), listeners = [];
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id) { const p = pending.get(m.id); if (!p) return; pending.delete(m.id); clearTimeout(p.timer); if (m.error) p.rej(new Error(m.error.message)); else p.res(m.result); } else for (const l of listeners) l(m);
  };
  const send = (method, params, ms) => new Promise((res, rej) => {
    const i = ++id, limit = ms || callMs || 60000;
    const timer = setTimeout(() => { if (pending.delete(i)) rej(new Error('the page did not answer ' + method + ' in ' + Math.round(limit / 1000) + ' s')); }, limit);
    pending.set(i, { res, rej, timer }); ws.send(JSON.stringify({ id: i, method, params: params || {} }));
  });
  return { send, on: (f) => listeners.push(f), close: () => ws.close() };
}

// a page on dist/ with helpers: ev (evaluate), waitFor, open (navigate), click (a real mouse click), key, shot
async function launch(opts) {
  opts = opts || {};
  const dist = path.resolve(opts.dist || path.join(__dirname, '..', 'dist')), width = opts.width || 1400, height = opts.height || 860;
  checkApp(dist);
  const { server, port } = APP ? { server: { close() {} }, port: null } : await serve(dist, 0);   // the app serves its own
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'titanic-cdp-'));
  const { child, dbg } = await openBrowser(['--headless=new', '--no-first-run', '--no-default-browser-check',
    '--window-size=' + width + ',' + height, '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', 'about:blank'], profile);
  const errors = [];
  let target = null;
  for (let i = 0; i < 100 && !target && dbg; i++) {
    try { const list = await (await fetch(`http://127.0.0.1:${dbg}/json/list`)).json(); target = list.find(t => t.type === 'page'); } catch (e) { /* not up yet */ }
    if (!target) await sleep(150);
  }
  if (!target) { server.close(); await closeBrowser(child, profile); throw new Error('the browser did not open its debugging port'); }
  const page = await cdp(target.webSocketDebuggerUrl);
  await logVersion(dbg);
  page.on((m) => {
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception ? m.params.exceptionDetails.exception.description : m.params.exceptionDetails.text);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value || a.description).join(' '));
  });
  await page.send('Page.enable'); await page.send('Runtime.enable');
  await page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  const ev = async (expression, ms) => {   // ms: this evaluation's deadline (default 120 s: an awaited promise may take a while)
    const r = await page.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, ms || 120000);
    if (r.exceptionDetails) throw new Error('in the page: ' + (r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text));
    return r.result.value;
  };
  const waitFor = async (expression, ms, what) => { const t0 = Date.now(); for (;;) { if (await ev(expression)) return; if (Date.now() - t0 > ms) throw new Error('timed out waiting for ' + (what || expression)); await sleep(100); } };
  // the page at an address (hash: '#night=1912' and the like). { virtual: true }: its clock virtual from its first frame
  // (QC C-3: clock=test in the address), so that no real frame steps it; then only vrun and vframes move it
  const open = async (hash, o) => {
    const h = (o && o.virtual) ? (hash ? hash + '&' : '#') + 'clock=test' : (hash || '');
    await page.send('Page.navigate', { url: 'about:blank' });
    await page.send('Page.navigate', { url: pageURL(port, h) });
    await waitFor('!!(window.TitanicApp && TitanicApp.state.sim)', 20000, 'the page');
  };
  // QC C-3, the page's clock virtual (docs/DESIGN_virtual_clock_v1_1_2026-11-21.md):
  //   virtual(on)              the clock virtual or real (TitanicApp.test.virtual)
  //   vframes(n, { frameMs, render })   n passes of the frame loop, frameMs each (1000/60 unless given)
  //   vrun(stopExpr, { frameMs, maxMs, render, held, what, ms })   passes until the page expression stopExpr holds, or (held,
  //                            the default) the page's clock is stopped (a step hook set playing false), or maxMs of the
  //                            page's time pass. With what, running out of the page's time throws, naming it. ms is this
  //                            call's deadline on the wall clock (G16: only a hang's catch; 300 s unless given)
  const virtual = (on) => ev(`TitanicApp.test.virtual(${!!on})`);
  const vframes = (n, o) => ev(`(() => { const T = TitanicApp.test; for (let i = 0; i < ${Math.max(0, n | 0)}; i++) T.frame(${+(o && o.frameMs) || 1000 / 60}, { render: ${!!(o && o.render)} }); return TitanicApp.now(); })()`);
  const vrun = async (stopExpr, o) => {
    o = o || {};
    const opts = `{ stop: ${stopExpr ? '() => (' + stopExpr + ')' : 'null'}, frameMs: ${+o.frameMs || 'undefined'}, maxMs: ${+o.maxMs || 'undefined'}, render: ${!!o.render}, held: ${o.held !== false} }`;
    const r = await ev(`TitanicApp.test.run(${opts})`, o.ms || 300000);
    if (!r.done && o.what) throw new Error('the page\'s time ran out (' + Math.round(r.ms / 1000) + ' s) waiting for ' + o.what);
    return r;
  };
  // a real click on an element by id, or by CSS selector (clickSel)
  const clickSel = async (sel) => {
    const b = await ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return { w: 0 }; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }; })()`);
    if (!b.w) throw new Error(sel + ' is not on the page');
    for (const type of ['mousePressed', 'mouseReleased']) await page.send('Input.dispatchMouseEvent', { type, x: b.x, y: b.y, button: 'left', clickCount: 1 });
  };
  const click = (id) => clickSel('#' + id);
  const key = async (k, code, vk) => { for (const type of ['keyDown', 'keyUp']) await page.send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: vk }); };
  const shot = async (file) => { if (!file) return; fs.mkdirSync(path.dirname(file), { recursive: true }); const r = await page.send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(file, Buffer.from(r.data, 'base64')); };
  const close = async () => {
    try { page.close(); } catch (e) { /* closing */ }
    server.close();
    await closeBrowser(child, profile);
  };
  return { page, ev, waitFor, open, click, clickSel, key, shot, close, errors, port, sleep, dbg, pid: child.pid, profile, virtual, vframes, vrun };
}

module.exports = { findBrowser, freePort, openBrowser, closeBrowser, logVersion, cdp, launch, sleep, APP, checkApp, pageURL };
