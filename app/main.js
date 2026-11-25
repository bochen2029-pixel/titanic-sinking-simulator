// Titanic, the desktop app: the page (dist/) in its own window, with no browser, no port and, as she starts, no network.
// Electron's main process. After Fathom's shell, less its voice
// (docs/DESIGN_electron_desktop_client_v3_2026-11-23.md, section 3; v2, section 4).
//
// The window has two channels to this process. The first: the crew's minds (docs/DESIGN_ask_the_bridge_v1_2026-11-23.md,
// sections 9 to 11). preload.js gives the page one object, titanicMinds, with seven calls; minds.js answers them here. With no key
// kept and the switch off, which is how she starts, nothing is asked and no request leaves the PC. The window itself
// never makes a request: only this process calls out, only to the one provider the player has set. Before the switch
// goes on, and before she would call elsewhere or spend more, this process asks him itself (mindsConfirm).
// A second, the same way: the men's voices by Deepgram (docs/DESIGN_spoken_bridge_v1_2026-11-23.md, section 7).
// preload.js gives the page titanicVoice, with six calls; voice.js answers them here, calls Deepgram alone and only while
// its own switch is on, and has this process ask the player before it goes on (voiceConfirm).
// The ears (docs/DESIGN_spoken_bridge_voice_v1_2026-11-23.md, section 5): four calls more and one message back on the
// same object, a switch and a question of their own; the microphone for this window's own page, audio alone.
//
//   Titanic.exe                              the simulator
//   Titanic.exe "--open=#night=1912&kn=18"   open the page at that address: the page's own grammar (#night=, #scenario=,
//                                            &log=, ...), the part of a link after its '#', with or without the '#'
//   --profile=DIR                            where her settings go. Default: data\ beside Titanic.exe when that folder
//                                            can be written, else the system's place for the app (the title says so)
//   F11 full screen; F1 About (the version, the commit, the runtime, the 1912 watch's fingerprint); F12 developer tools
//   --inactive                               the window shown without taking the focus (the suites driving the app over
//                                            DevTools, with --remote-debugging-port: tools/cdp.js, TITANIC_APP)
//   --smoke --smoke-out=F                    the self-test (tools/app_test.js): the page plays its checks, F, then quit;
//                                            --smoke-ready=F2 --smoke-second: write F2 when ready and wait for a second
//                                            start; --smoke-quick: only where the settings went; --smoke-shot=PNG;
//                                            --smoke-minds=ADDRESS (and --smoke-minds-slow=): a stand-in provider on
//                                            this PC (tools/minds_fake_server.js) for the crew's minds' rows;
//                                            --smoke-voice=ADDRESS: a stand-in for Deepgram on this PC
//                                            (tools/fake_deepgram.js) for the men's voices' rows, and the ears'
//                                            (with Chromium's fake microphone device, under these flags only)
//                                            --smoke-fit: the window at its own size, not the fixed 1400 x 860, and the
//                                            page measured against it first (--smoke-full-screen: then through F11, the
//                                            player's key, and back)
//
// One instance only: a second start hands its --open= to the first window and quits. The page is served from this
// folder's dist/ under a scheme of its own (titanic://app/), with dist/_headers' policy on every answer, and every
// http, https, ws and wss request is cancelled.
'use strict';
const { app, BrowserWindow, Menu, dialog, ipcMain, protocol, safeStorage, screen, session } = require('electron');
const path = require('path'), fs = require('fs');

const arg = (name) => { const a = process.argv.find(x => x.startsWith('--' + name + '=')); return a ? a.slice(name.length + 3) : null; };
const SMOKE = process.argv.includes('--smoke');
const FIT = SMOKE && process.argv.includes('--smoke-fit');   // the self-test at the window's own size (app_test's fit rows)
const DIST = path.join(__dirname, 'dist'), ORIGIN = 'titanic://app/';
const readJSON = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return null; } };

// ---------------------------------------------------------------- where her settings go (v2, section 6.1)
// data\ beside the exe when the folder can be written (delete the folder and nothing of her is left on the PC); only a
// packaged app (Titanic.exe, not a runtime run on these sources) does that. --profile overrides both.
const profile = (() => {
  if (arg('profile')) return { dir: path.resolve(arg('profile')), how: 'profile' };
  if (app.isPackaged) {
    const dir = path.join(path.dirname(process.execPath), 'data');
    try {
      fs.mkdirSync(dir, { recursive: true });
      const probe = path.join(dir, '.write-probe-' + process.pid); fs.writeFileSync(probe, ''); fs.rmSync(probe);
      return { dir, how: 'beside' };
    } catch (e) { return { dir: null, how: 'system' }; }
  }
  return { dir: null, how: 'system' };
})();
if (profile.dir) { app.setPath('userData', profile.dir); app.setPath('crashDumps', path.join(profile.dir, 'Crashpad')); }
if (!profile.dir) profile.dir = app.getPath('userData');

// ---------------------------------------------------------------- one instance: a second start hands over its address
// (the lock is the profile's, so two copies of the folder are two apps, each with its own data\)
const fragmentOf = (s) => {
  if (typeof s !== 'string' || !s) return null;
  const i = s.indexOf('#'), f = i >= 0 ? s.slice(i + 1) : s;
  return /^[A-Za-z0-9_.~=&%+-]{1,65536}$/.test(f) ? '#' + f : null;    // the page checks what it reads; this keeps it a fragment
};
if (!app.requestSingleInstanceLock({ open: arg('open') })) { app.quit(); return; }

app.commandLine.appendSwitch('lang', 'en-US');     // the runtime carries English only (tools/package_app.js)
// the ears (docs/DESIGN_spoken_bridge_voice_v1_2026-11-23.md, section 5): Chromium's fake microphone for the self-test's own run alone (not its fake
// permission UI, which would answer the page itself and pass by the permission handlers below that the self-test holds)
if (SMOKE && arg('smoke-voice')) app.commandLine.appendSwitch('use-fake-device-for-media-stream');
app.disableDomainBlockingFor3DAPIs();              // a GPU reset must not leave her without WebGL for the rest of the run
protocol.registerSchemesAsPrivileged([{ scheme: 'titanic', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }]);

// ---------------------------------------------------------------- the page's files, with its headers
// dist/_headers is Cloudflare's: a path pattern, then its headers indented under it. Every answer carries the headers of
// every pattern its path matches, so the page runs under the same policy here as on the web.
const RULES = (() => {
  const rules = []; let cur = null, text = '';
  try { text = fs.readFileSync(path.join(DIST, '_headers'), 'utf8'); } catch (e) { return rules; }
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) { cur = { pattern: line.trim(), headers: [] }; rules.push(cur); continue; }
    const m = /^\s+([A-Za-z0-9-]+):\s*(.*)$/.exec(line); if (m && cur) cur.headers.push([m[1], m[2].trim()]);
  }
  return rules;
})();
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
const served = [], blocked = [];                   // for the self-test: what the scheme answered, and what was refused
async function answer(req) {
  const u = new URL(req.url), p = decodeURIComponent(u.pathname);
  const file = path.normalize(path.join(DIST, p.endsWith('/') ? p + 'index.html' : p));
  let body = null;
  if (u.host === 'app' && file.startsWith(DIST + path.sep) && !path.basename(file).startsWith('_') && !p.includes('\0')) {
    try { body = await fs.promises.readFile(file); } catch (e) { body = null; }
  }
  const headers = new Headers();
  for (const r of RULES) if (r.pattern.endsWith('*') ? p.startsWith(r.pattern.slice(0, -1)) : p === r.pattern) for (const [k, v] of r.headers) headers.set(k, v);
  // the ears (docs/DESIGN_spoken_bridge_voice_v1_2026-11-23.md, section 5): on the app's own answers the page may ask for the microphone; dist/_headers and the public page keep microphone=()
  if (headers.has('Permissions-Policy')) headers.set('Permissions-Policy', headers.get('Permissions-Policy').replace(/(^|,\s*)microphone=\(\)/, '$1microphone=(self)'));
  headers.set('Content-Type', body ? TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' : 'text/plain; charset=utf-8');
  if (served.length < 500) served.push({ path: p, status: body ? 200 : 404, csp: headers.has('Content-Security-Policy') });
  return body ? new Response(body, { status: 200, headers }) : new Response('not found', { status: 404, headers });
}

// ---------------------------------------------------------------- the window
let win = null, minds = null, voice = null;
const smokeAsked = [], smokeSay = [];             // the self-test: what this process asked the player, and its answers in turn (none left: yes)
const voiceAsked = [], voiceSay = [];             // the same for the men's voices
const titleNote = profile.how === 'system' && app.isPackaged ? ' (her settings are kept in ' + profile.dir + ': this folder cannot be written)' : '';
function createWindow() {
  Menu.setApplicationMenu(null);
  protocol.handle('titanic', answer);
  // the window has no network of its own: its page is the app's own files
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'] }, (d, cb) => { if (blocked.length < 100) blocked.push(d.url); cb({ cancel: true }); });
  // no permission but the clipboard's (the end card's "Copy a link to this watch")
  const allowed = (permission) => permission === 'clipboard-sanitized-write';
  // and the microphone, for the ears (docs/DESIGN_spoken_bridge_voice_v1_2026-11-23.md, section 5): audio alone, asked by this window's own page at titanic://app/, and only while the ears are on as the handler is asked, by voice.js's one rule for both handlers
  const mic = (wc, permission, origins, types) => require('./voice.js').microphoneAllowed(permission, !!win && wc === win.webContents, origins, types, ORIGIN, !!voice && voice.earsOn());
  session.defaultSession.setPermissionRequestHandler((wc, permission, cb, d) => cb(allowed(permission) || mic(wc, permission, [d && d.requestingUrl, d && d.securityOrigin], d && d.mediaTypes)));
  session.defaultSession.setPermissionCheckHandler((wc, permission, origin, d) => allowed(permission) || mic(wc, permission, [origin, d && d.requestingUrl, d && d.securityOrigin], d ? [d.mediaType] : null));
  // a large monitor first (D84): most of the screen, centred; full screen with F11
  const wa = screen.getPrimaryDisplay().workAreaSize;
  const size = SMOKE && !FIT ? { width: 1400, height: 860 } : { width: Math.max(Math.min(1024, wa.width), Math.round(wa.width * 0.9)), height: Math.max(Math.min(700, wa.height), Math.round(wa.height * 0.9)) };
  asked = [size.width, size.height];
  win = new BrowserWindow(Object.assign(size, {
    minWidth: 800, minHeight: 560, backgroundColor: '#05090f', title: 'Titanic', show: false, icon: path.join(DIST, 'icons', 'icon-512.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false, spellcheck: false, preload: path.join(__dirname, 'preload.js') },
  }));
  // the crew's minds: the window's one channel to this process (preload.js names it titanicMinds). Each of its seven
  // calls is answered only for this window's own page. Claude's adapter is there when Anthropic's SDK is in the package.
  // This process calls out with its own fetch, which is not the window's session: the rule above cancels nothing of it.
  // The switch is the player's own: before it goes on, before the provider or its address changes while it is on, and
  // before a limit is raised, minds.js has this process ask him (mindsConfirm, below), and the page cannot answer
  const claude = (() => { try { return require('./minds_anthropic.js'); } catch (e) { return null; } })();
  minds = require('./minds.js').create({ ipcMain, safeStorage, dir: profile.dir, anthropic: claude, confirm: mindsConfirm,
    isOwn: (e) => !!win && !!e && e.sender === win.webContents && !!e.senderFrame && String(e.senderFrame.url).startsWith(ORIGIN) });
  minds.attach();
  // the men's voices by Deepgram: the window's second channel (preload.js names it titanicVoice), answered the same way
  // for this window's own page only. Deepgram's address is voice.js's own; the self-test alone may name a stand-in on
  // this PC (--smoke-voice=, which voice.js refuses unless it is on this PC). Made here, after the app is ready, as the
  // system's asynchronous key store asks
  voice = require('./voice.js').create({ ipcMain, safeStorage, dir: profile.dir, confirm: voiceConfirm, base: SMOKE && arg('smoke-voice') ? arg('smoke-voice') : undefined,
    send: (ch, ...a) => { if (win && !win.isDestroyed() && String(win.webContents.getURL()).startsWith(ORIGIN)) win.webContents.send(ch, ...a); },   // the ears' words heard, to this window's own page alone (docs/DESIGN_spoken_bridge_voice_v1_2026-11-23.md, section 5)
    isOwn: (e) => !!win && !!e && e.sender === win.webContents && !!e.senderFrame && String(e.senderFrame.url).startsWith(ORIGIN) });
  voice.attach();
  for (const ev of ['did-start-loading', 'render-process-gone', 'destroyed']) win.webContents.on(ev, () => voice.pageGone());   // the ears: a transmission open is closed when the page goes away (the same design, section 5)
  win.once('ready-to-show', () => { if (SMOKE || process.argv.includes('--inactive')) win.showInactive(); else win.show(); });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith(ORIGIN)) e.preventDefault(); });
  win.on('page-title-updated', (e, title) => { if (titleNote) { e.preventDefault(); win.setTitle(title + titleNote); } });
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    else if (input.key === 'F12') { win.webContents.toggleDevTools(); e.preventDefault(); }
    else if (input.key === 'F1') { about(); e.preventDefault(); }
  });
  win.webContents.on('render-process-gone', (e, d) => { if (SMOKE) finish({ ok: false, error: 'the page\'s process ended: ' + d.reason }); else if (d.reason !== 'clean-exit') win.webContents.reload(); });
  win.loadURL(ORIGIN + 'index.html' + (fragmentOf(arg('open')) || ''));
  if (SMOKE) smoke().then((r) => finish(r), (err) => finish({ ok: false, error: String(err && err.stack || err) }));
}
// open the page at another address. It reads its address when it starts, so it starts again there (a new fragment
// alone would not reload it)
async function openFragment(frag) {
  const url = ORIGIN + 'index.html' + frag;
  try { await win.webContents.executeJavaScript(`history.replaceState(null, '', ${JSON.stringify(url)}); 1`); win.webContents.reload(); } catch (e) { win.loadURL(url); }
}
let onSecond = null;                               // the self-test's ear for a second start
app.on('second-instance', (e, argv, cwd, extra) => {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  if (!SMOKE) { win.show(); win.focus(); }
  const frag = fragmentOf(extra && extra.open);
  if (frag) openFragment(frag);
  if (onSecond) onSecond({ open: extra ? extra.open : undefined, frag });
});

// ---------------------------------------------------------------- About (F1), and the 1912 watch run in this window
// The packager runs the 1912 watch in Node and keeps its fingerprint in stamp.json; "Check this PC" runs the same watch
// in the page, in this runtime, so anyone can see that their night is the model's, to the bit. Since G12's cascade
// (join 19) a default watch ends where she breaks and never founders (founderT -1): t is the watch's clock at its end.
const WATCH_1912 = `(() => { const N = window.TitanicNight, C = window.TitanicCore; if (!N || !C) return null;
  const t0 = performance.now(), s = N.create(C.buildShip(), N.spec(1912), { auto: true }); N.sink(s);
  return { fp: N.fingerprint(s), k: s.night.k, founderT: s.founderT, t: s.t, ms: Math.round(performance.now() - t0) }; })()`;
const watch1912 = () => win.webContents.executeJavaScript(WATCH_1912, true);
let checked = null, aboutOpen = false;
// whether this app can talk to the network just now: only with the crew's minds switched on, and then to one provider
function mindsLine() {
  let s = null; try { s = minds ? minds.status() : null; } catch (e) { s = null; }
  if (!s || !s.on) return 'The crew\'s minds: off.' + (voiceOn() ? '' : ' The app connects to nothing.');   // (the men's voices, when on, say where they connect)
  const p = (s.providers || []).find(x => x.id === s.provider);
  return 'The crew\'s minds: ON, for ' + (p ? p.label : s.provider) + (s.provider === 'custom' && s.base ? ' at ' + s.base : '') + '. The app calls that provider when you ask the bridge' + (voiceOn() ? '.' : ', and nobody else.');   // (with the men's voices on there is a second: their own line says who)
}
// The player's own word for the crew's minds: the question is minds.js's (its words say the provider, the one address
// and the run's limits), put in the system's own message box over the window, with Cancel the default. The self-test
// answers for itself from a list, and says what was asked.
async function mindsConfirm(q) {
  if (SMOKE) { smokeAsked.push(q.kind); return smokeSay.length ? smokeSay.shift() : true; }
  if (!win) return false;
  const r = await dialog.showMessageBox(win, { type: 'question', title: q.title, message: q.message, detail: q.detail, buttons: [q.yes, q.no], defaultId: 1, cancelId: 1, noLink: true });
  return r.response === 0;
}
// The men's voices by Deepgram, the same two ways: whether they are sent to Deepgram just now (only with their switch
// on, and then to Deepgram alone), and the player's own word before the switch goes on or the run's limit is raised
// (voice.js's question, in the system's own message box, Cancel the default; the self-test answers from its own list)
function voiceOn() { try { const s = voice && voice.status(); return !!(s && (s.on || s.ears)); } catch (e) { return false; } }   // (the voices or the ears: docs/DESIGN_spoken_bridge_voice_v1_2026-11-23.md, section 5)
function voiceLine() {
  let s = null; try { s = voice ? voice.status() : null; } catch (e) { s = null; }
  if (!s || !s.on) return 'The men\'s voices by Deepgram: off.' + (s && s.ears ? '' : ' Nothing is sent to Deepgram.');   // (the ears say their own: below)
  return 'The men\'s voices by Deepgram: ON, at ' + s.origin + '. The app sends Deepgram each line a man says, as text, to be spoken, and nothing else.';
}
// the ears, the second path to Deepgram, with a switch of their own (docs/DESIGN_spoken_bridge_voice_v1_2026-11-23.md, section 5)
function earsLine() {
  let s = null; try { s = voice ? voice.status() : null; } catch (e) { s = null; }
  if (!s || !s.ears) return 'Speaking to the bridge by Deepgram: off. Nothing you say is sent anywhere.';
  return 'Speaking to the bridge by Deepgram: ON, at ' + s.earsOrigin + '. While you hold the key the app sends what you say to Deepgram, as sound, to be turned into words, and nothing else.';
}
async function voiceConfirm(q) {
  if (SMOKE) { voiceAsked.push(q.kind); return voiceSay.length ? voiceSay.shift() : true; }
  if (!win) return false;
  const r = await dialog.showMessageBox(win, { type: 'question', title: q.title, message: q.message, detail: q.detail, buttons: [q.yes, q.no], defaultId: 1, cancelId: 1, noLink: true });
  return r.response === 0;
}
function aboutText() {
  const v = readJSON(path.join(DIST, 'version.json')) || {}, s = readJSON(path.join(__dirname, 'stamp.json')) || {}, f = s.fingerprint1912;
  const utc = (iso) => (iso || '?').slice(0, 16).replace('T', ' ') + ' UTC';
  // where the watch ends, in words: a default watch where she breaks (G12's cascade), a flag watch where she founders
  const endOf = (x) => x.founderT >= 0 ? `She founders at step ${x.k} (${x.founderT} s)` : `Her watch ends where she breaks, at step ${x.k} (${x.t} s)`;
  const lines = [
    'Early access, a work in progress.',
    `The page: built ${utc(v.built)} from commit ${v.builtFromCommit || '?'}${v.sourcesCommitted === false ? ', with changes not then committed' : ''}.`,
    s.commit ? `The app: packaged ${utc(s.packaged)} from commit ${s.commit}${s.dirty ? ', with changes not then committed' : ''}.` : 'The app: run from its sources, not packaged.',
    `The runtime: Electron ${process.versions.electron} (Chromium ${process.versions.chrome}, V8 ${process.versions.v8}).`,
    mindsLine(),
    voiceLine(),
    earsLine(),                                    // the ears (docs/DESIGN_spoken_bridge_voice_v1_2026-11-23.md, section 5)
    '',
    f ? `The 1912 watch's fingerprint: ${f.fp}. ${endOf(f)}: the model run alone in Node ${f.node}, when the app was packaged.` :'The 1912 watch\'s fingerprint: not stamped (the app is not packaged).',
  ];
  if (checked) lines.push(checked.fp ? `This PC, in this app: ${checked.fp} at step ${checked.k} (${checked.founderT >= 0 ? checked.founderT : checked.t} s), in ${(checked.ms / 1000).toFixed(1)} s. ` + (f ? (checked.fp === f.fp && checked.k === f.k && checked.founderT === f.founderT && checked.t === f.t ?'The same night, to the bit.' : 'NOT the same night as the model\'s.') : '') : 'This PC: the watch could not be run (' + checked.error + ').');
  else lines.push('"Check this PC" runs the same watch in this window, in this runtime, and compares: about 15 seconds, while the window waits.');
  // the page on the web (its address as the build wrote it, dist/version.json's "home"), where to read more and where
  // to report a fault, as plain text: the app's window opens no links
  const repo = 'https://github.com/bochen2029-pixel/titanic-sinking-simulator';
  lines.push('');
  if (v.home) lines.push('The page on the web: ' + v.home);
  lines.push('The User Guide: ' + repo + '/tree/main/docs/guide', 'Report a fault: ' + repo + '/issues');
  return { title: 'Titanic ' + (v.version || ''), detail: lines.join('\n') };
}
async function about() {
  if (aboutOpen || !win) return; aboutOpen = true;
  try {
    for (;;) {
      const t = aboutText();
      const r = await dialog.showMessageBox(win, { type: 'info', title: 'About Titanic', message: t.title, detail: t.detail, buttons: checked ? ['Close'] : ['Close', 'Check this PC'], defaultId: 0, cancelId: 0, noLink: true });
      if (r.response !== 1) break;
      const title = win.getTitle(); win.setTitle(title + ': running the 1912 watch to compare'); win.setProgressBar(2);   // the taskbar's "busy"
      try { checked = (await watch1912()) || { error: 'the page is not loaded' }; } catch (e) { checked = { error: String(e && e.message || e).slice(0, 200) }; }
      win.setProgressBar(-1); win.setTitle(title);
    }
  } finally { aboutOpen = false; }
}

// ---------------------------------------------------------------- the self-test (tools/app_test.js)
let asked = null;                                  // the window's size as created: [width, height]
// the page fills the window (app_test's fit rows): at the window's own size, not the self-test's fixed one; and, with
// --smoke-full-screen, through F11 and back as the player's key does it (before-input-event), so that it fills the
// screen and then gives the window back as it was. The page's layout follows a resize a frame or two late: each look
// waits until the page's viewport is the size it should be, or 5 s
async function fitCheck(js, sleep) {
  const look = async () => {
    const page = await js(`(() => { const r = (el) => { if (!el) return null; const q = el.getBoundingClientRect(); return [Math.round(q.left), Math.round(q.top), Math.round(q.width), Math.round(q.height)]; };
      return { inner: [innerWidth, innerHeight], root: r(document.getElementById('app')), dpr: devicePixelRatio }; })()`);
    return { content: win.getContentSize(), bounds: win.getBounds(), full: win.isFullScreen(), page };
  };
  const near = (x, y) => Math.abs(x - y) <= 1;
  const settle = async (want) => { let s = null; for (let i = 0; i < 50; i++) { s = await look(); const w = want || s.content; if (near(s.page.inner[0], w[0]) && near(s.page.inner[1], w[1])) return s; await sleep(100); } return s; };
  const wa = screen.getPrimaryDisplay().workAreaSize;
  const out = { asked, workArea: [wa.width, wa.height], window: await settle() };
  if (!process.argv.includes('--smoke-full-screen')) return out;
  const when = (ev, ms) => new Promise((res) => { const t = setTimeout(() => res(false), ms); win.once(ev, () => { clearTimeout(t); res(true); }); });
  const f11 = () => { win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'F11' }); win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'F11' }); };
  const entered = when('enter-full-screen', 10000); f11(); const inFull = await entered;
  const d = screen.getDisplayMatching(win.getBounds()).bounds;
  out.screen = [d.width, d.height];
  out.full = Object.assign(await settle(out.screen), { entered: inFull });
  const left = when('leave-full-screen', 10000); f11(); const outOfFull = await left;
  out.back = Object.assign(await settle(), { left: outOfFull });
  return out;
}
function finish(r) {
  try { if (arg('smoke-out')) fs.writeFileSync(path.resolve(arg('smoke-out')), JSON.stringify(r, null, 1)); } catch (e) { /* nowhere to say it */ }
  app.exit(r && r.ok ? 0 : 1);
}
async function smoke() {
  const js = (code) => win.webContents.executeJavaScript(code, true), sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const errors = [];
  win.webContents.on('console-message', (e, level, message) => {
    const lv = e && e.level !== undefined ? e.level : level, msg = e && e.message !== undefined ? e.message : message;   // Electron 35 moved them onto the event
    if (lv === 'error' || lv === 3) errors.push(String(msg).slice(0, 300));
  });
  const ready = async (cond, ms) => { for (let i = 0; i < ms / 100; i++) { try { if (await js(cond)) return true; } catch (e) { /* loading */ } await sleep(100); } return false; };
  const out = { ok: false, errors, profile, blocked, versions: { electron: process.versions.electron, chrome: process.versions.chrome, v8: process.versions.v8, node: process.versions.node } };
  if (!(await ready('!!(window.TitanicApp && TitanicApp.state.sim)', 60000))) { out.error = 'the page did not start in 60 s'; return out; }
  if (FIT) { try { out.fit = await fitCheck(js, sleep); } catch (e) { out.fit = { error: String(e && e.message || e).slice(0, 200) }; } }
  if (arg('smoke-quick')) { out.quick = true; out.ok = errors.length === 0; return out; }
  // the page as it starts: its address, WebGL and no Node, its fonts, the night --open= named, the footer's link
  out.page = await js(`(() => { const A = TitanicApp, r = A.renderer, gl = r && r.getContext && r.getContext(), f = document.getElementById('footSource'), a = document.querySelector('.foot-meta a[href*="github"]');
    return { href: location.href, protocol: location.protocol, webgl: !!gl, gl: gl ? String(gl.getParameter(gl.VERSION)) : null, node: typeof require, process: typeof process, version: A.version,
      night: A.state.night ? { seed: A.state.night.seed, kn: A.state.night.kn, level: A.state.night.level } : null,
      fonts: [...document.fonts].map(x => x.family.replace(/"/g, '') + ' ' + x.weight + ' ' + x.status),
      github: { hiddenWrap: !!(f && f.hidden), drawn: !!a && a.getClientRects().length > 0 } }; })()`);
  // the watch steps in the window, on its own frames
  const k0 = await js('TitanicApp.state.sim.night ? TitanicApp.state.sim.night.k : -1'); await sleep(2500);
  out.steps = { k0, k1: await js('TitanicApp.state.sim.night ? TitanicApp.state.sim.night.k : -1') };
  // the forecast worker, started from the page's own address as the page starts it, answers with the model's numbers
  out.worker = await js(`new Promise((done) => { let w; const t = setTimeout(() => { try { w.terminate(); } catch (e) {} done({ error: 'no answer in 30 s' }); }, 30000);
    try { w = new Worker(window.TitanicWorkerURL); } catch (e) { clearTimeout(t); done({ error: String(e) }); return; }
    w.onerror = (e) => { clearTimeout(t); done({ error: 'worker error: ' + (e.message || 'unknown') }); };
    w.onmessage = (e) => { if (e.data.last) { clearTimeout(t); w.terminate(); done({ row: { reaction: e.data.row.reaction, kind: e.data.row.kind, area: e.data.row.area, clearance: e.data.row.clearance } }); } };
    w.postMessage({ type: 'window', seq: 1, seed: 1912, kn: 22.5, level: 'hard', times: [30] }); })`);
  // "Copy a link to this watch" copies the fragment alone, which --open= takes (the clipboard stood in for: the test
  // leaves the PC's own clipboard alone)
  out.copied = await js(`new Promise((done) => { const c = navigator.clipboard; c.writeText = (t) => { done({ text: String(t), link: TitanicApp.nightEnd.link() }); return Promise.resolve(); };
    document.getElementById('endCopy').click(); setTimeout(() => done({ text: null, link: TitanicApp.nightEnd.link(), box: document.getElementById('endLink').value }), 3000); })`);
  // the 1912 watch, run to her foundering in this window, in this runtime
  try { out.watch1912 = await watch1912(); } catch (e) { out.watch1912 = { error: String(e && e.message || e) }; }
  checked = out.watch1912; out.about = aboutText();     // what F1 then shows
  if (arg('smoke-shot')) { try { fs.writeFileSync(path.resolve(arg('smoke-shot')), (await win.webContents.capturePage()).toPNG()); } catch (e) { out.shotError = String(e); } }
  // a second start: it opens no window of its own, and its --open= reaches this one
  if (process.argv.includes('--smoke-second')) {
    const second = new Promise((res) => { onSecond = res; setTimeout(() => res(null), 45000); });
    if (arg('smoke-ready')) fs.writeFileSync(path.resolve(arg('smoke-ready')), 'ready');
    const got = await second;
    out.second = { got };
    if (got && got.frag) {
      const want = /night=(\d+)/.exec(got.frag);
      out.second.opened = await ready(`!!(window.TitanicApp && TitanicApp.state.sim && TitanicApp.state.night && TitanicApp.state.night.seed === ${want ? +want[1] : -1})`, 60000);
      out.second.href = await js('location.href');
    }
    out.second.windows = BrowserWindow.getAllWindows().length;
  }
  // the crew's minds (docs/DESIGN_ask_the_bridge_v1_2026-11-23.md, section 13): as she starts they are off and nothing is
  // asked. Then, only when the test names a stand-in provider on this PC (--smoke-minds=, and one that never answers,
  // --smoke-minds-slow=), the page's own titanicMinds sets it, keeps a key that is plainly not one, and asks
  const TEST_KEY = 'test-key-0123456789-not-a-secret';
  const Q = `{ seat: 'quartermaster', stable: 'You are the quartermaster at the wheel. Answer with a JSON object and nothing else.', changing: 'THE CAPTAIN SAYS TO YOU: How does she answer?' }`;
  out.minds = await js(`(async () => { const T = window.titanicMinds; if (!T) return { missing: true };
    return { calls: Object.keys(T).sort(), frozen: Object.isFrozen(T), start: await T.status(), offAsk: await T.ask(${Q}) }; })()`);
  if (arg('smoke-minds') && out.minds && !out.minds.missing) {
    const base = JSON.stringify(arg('smoke-minds')), slow = JSON.stringify(arg('smoke-minds-slow') || '');
    smokeSay.push(false);                           // the first question to the player is answered no, the rest yes
    out.minds.on = await js(`(async () => { const T = window.titanicMinds;
      const far = await T.set({ provider: 'custom', base: 'http://example.com/v1' });
      const no = await T.set({ provider: 'custom', base: ${base}, model: 'fake-1', on: true, timeoutMs: 5000 }), stillOff = await T.status(), noAsk = await T.ask(${Q});
      const set = await T.set({ provider: 'custom', base: ${base}, model: 'fake-1', on: true, timeoutMs: 5000 });
      const key = await T.setKey(${JSON.stringify(TEST_KEY)});
      return { far, no, stillOff, noAsk, set, key, ask: await T.ask(${Q}), after: await T.status() }; })()`);
    let kept = ''; try { kept = fs.readFileSync(path.join(profile.dir, 'minds.json'), 'utf8'); } catch (e) { kept = ''; }
    out.minds.file = { written: !!kept, keyInClear: kept.includes(TEST_KEY), keyKept: /"custom": "[A-Za-z0-9+/=]{8,}"/.test(kept) };
    out.minds.hostsFirst = minds ? minds.hosts() : null;        // after the one question: the stand-in, and it alone
    out.minds.aboutOn = mindsLine();                             // what F1 says while they are on
    out.minds.end = await js(`(async () => { const T = window.titanicMinds, r = {};
      if (${slow}) { await T.set({ base: ${slow}, timeoutMs: 1000 }); r.slow = await T.ask(${Q}); }
      r.off = await T.set({ on: false }); r.cleared = await T.clearKey(); r.offAsk = await T.ask(${Q}); return r; })()`);
    out.minds.hosts = minds ? minds.hosts() : null;
    out.minds.asked = smokeAsked.slice();           // what this process asked the player: the switch (twice), then the address
    let left = ''; try { left = fs.readFileSync(path.join(profile.dir, 'minds.json'), 'utf8'); } catch (e) { left = ''; }
    out.minds.forgotten = { keys: (() => { try { return Object.keys(JSON.parse(left).keys || {}).length; } catch (e) { return -1; } })(), aboutOff: mindsLine() };
  }
  // the men's voices by Deepgram (docs/DESIGN_spoken_bridge_v1_2026-11-23.md, section 7): as she starts they are off and
  // a line is answered "off". Then, only when the test names a stand-in for Deepgram on this PC (--smoke-voice=,
  // tools/fake_deepgram.js), the page's own titanicVoice switches them on (the first question answered no), keeps a key
  // that is plainly not one and has one line spoken; the page reads the WAV's first bytes itself and returns its size,
  // not its bytes. The page's own part speaks nothing meanwhile: it learns of the switch only by its own calls
  const LINE = `{ who: 'Mr Murdoch', text: 'Hard a-starboard, sir.' }`;
  out.voice = await js(`(async () => { const T = window.titanicVoice; if (!T) return { missing: true };
    return { calls: Object.keys(T).sort(), frozen: Object.isFrozen(T), start: await T.status(), offSpeak: await T.speak(${LINE}) }; })()`);
  if (arg('smoke-voice') && out.voice && !out.voice.missing) {
    voiceSay.push(false);                           // the first question to the player is answered no, the rest yes
    out.voice.on = await js(`(async () => { const T = window.titanicVoice;
      const key = await T.setKey(${JSON.stringify(TEST_KEY)});
      const no = await T.set({ on: true }), stillOff = await T.status(), noSpeak = await T.speak(${LINE});
      const set = await T.set({ on: true });
      const r = await T.speak(${LINE}), b = r && r.wav ? new Uint8Array(r.wav) : null;
      const said = { ok: r && r.ok, kind: r && r.kind, why: r && r.why, voice: r && r.voice, chars: r && r.chars, keys: r ? Object.keys(r).sort() : [],
        wavType: r && r.wav ? Object.prototype.toString.call(r.wav) : '', bytes: b ? b.length : 0,
        riff: b ? String.fromCharCode(b[0], b[1], b[2], b[3]) : '', wave: b ? String.fromCharCode(b[8], b[9], b[10], b[11]) : '' };
      return { no, stillOff, noSpeak, set, key, said, after: await T.status() }; })()`);
    let kept = ''; try { kept = fs.readFileSync(path.join(profile.dir, 'voice.json'), 'utf8'); } catch (e) { kept = ''; }
    // (the sealed key is opened as bytes too: a seal that merely re-wrote the key would hold it; and the switch is never the file's)
    const sealed = (() => { try { return String(JSON.parse(kept).key || ''); } catch (e) { return ''; } })();
    out.voice.file = { written: !!kept, keyInClear: kept.includes(TEST_KEY), keyKept: /"key": "[A-Za-z0-9+/=]{8,}"/.test(kept), keyInSeal: !!sealed && Buffer.from(sealed, 'base64').toString('latin1').includes(TEST_KEY),
      on: (() => { try { return JSON.parse(kept).on; } catch (e) { return null; } })() };
    out.voice.hosts = voice ? voice.hosts() : null;             // the stand-in, and it alone
    out.voice.aboutOn = voiceLine();                             // what F1 says while they are on
    out.voice.end = await js(`(async () => { const T = window.titanicVoice, r = {};
      r.off = await T.set({ on: false }); r.cleared = await T.clearKey(); r.offSpeak = await T.speak(${LINE}); return r; })()`);
    out.voice.asked = voiceAsked.slice();           // what this process asked the player: the switch, twice
    let left = ''; try { left = fs.readFileSync(path.join(profile.dir, 'voice.json'), 'utf8'); } catch (e) { left = ''; }
    out.voice.forgotten = { key: (() => { try { return JSON.parse(left).key === undefined ? 'none' : 'kept'; } catch (e) { return 'unreadable'; } })(), aboutOff: voiceLine() };
    // the ears (docs/DESIGN_spoken_bridge_voice_v1_2026-11-23.md, section 5), the same way: off as she starts (a
    // transmission answered "off"); a key that is plainly not one kept; the switch asked of the player (answered no
    // once); one transmission by the page's own titanicVoice calls with a few bytes of made-up sound, the stand-in's words
    // back (and heard on the way); the microphone itself (Chromium's fake device, under these flags only), refused by the
    // permission handlers while the ears are off (as she starts, once declined, and off again) and given while they are on,
    // and the camera refused; off again and the key forgotten. Whether this window is a secure context with the microphone's interface
    const earsAsked0 = voiceAsked.length, PROBE = `const probe = async (c) => { try { const s = await navigator.mediaDevices.getUserMedia(c); const n = s.getAudioTracks().length; s.getTracks().forEach((t) => t.stop()); return { ok: true, audio: n }; } catch (e) { return { ok: false, name: String(e && e.name) }; } };
      const MIC = { audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } };`;
    voiceSay.push(false);
    out.ears = await js(`(async () => { const T = window.titanicVoice, heard = []; ${PROBE}
      const page = { secure: window.isSecureContext === true, mediaDevices: !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') };
      const start = await T.status(), offOpen = await T.open({}), micBefore = await probe(MIC), key = await T.setKey(${JSON.stringify(TEST_KEY)});
      const no = await T.set({ ears: true }), stillOff = await T.status(), micDeclined = await probe(MIC), set = await T.set({ ears: true });
      const micOn = await probe(MIC);
      T.onHeard((id, words) => { heard.push([id, words]); });
      const open = await T.open({});
      if (open && open.ok) { T.audio(open.id, new Uint8Array([26, 69, 223, 163, 1, 2, 3, 4]).buffer); T.audio(open.id, new Uint8Array(64).fill(7).buffer); }
      await new Promise((r) => setTimeout(r, 400));
      const fin = open && open.ok ? await T.finish(open.id) : null;
      T.onHeard(null);
      return { page, start, offOpen, micBefore, key, no, stillOff, micDeclined, set, micOn, open, fin, heard, after: await T.status() }; })()`);
    // the camera, asked for while the ears are on: refused by the page's own policy (camera=()), which the console says
    // in an error of its own. That line is this probe's, kept as what the row reads, and not counted among the page's
    // errors (as the policy's refusal of eval is not, below)
    const nCam = errors.length;
    out.ears.camera = await js(`(async () => { ${PROBE} return probe({ video: true }); })()`);
    await sleep(300); out.ears.cameraSaid = errors.splice(nCam);
    // THE PAGE'S OWN HOLD, the ears still on: not this test's calls but the part itself (site/parts/89_voice.js). A real
    // Space is held in the empty order line for a second and let go (sendInputEvent: the keys the page would get from
    // the keyboard). The part asks for the microphone (Chromium's fake one), records it with the browser's own
    // recorder, sends its slices by its own titanicVoice calls, and gives the words that come back through the order
    // line. Read: that the part was listening while the key was down and nothing was typed; then the talk and the log
    try {
      const H = {};
      H.before = await js(`(async () => { const A = TitanicApp, V = A.voice, line = document.getElementById('crewLine');
        if (!V || typeof V.useTransport !== 'function' || !line) return { part: false };
        await V.useTransport(null);
        line.value = ''; line.focus();
        const night = A.state.sim && A.state.sim.night, st = V.status();
        return { part: true, ears: !!(st && st.ears === true), focused: document.activeElement === line, log: night ? night.log.length : -1, talk: A.crew.lines().length, mode: A.state.night ? A.state.night.mode : '' }; })()`);
      if (H.before && H.before.part) {
        win.webContents.focus();
        // Whether this window had the keyboard for the whole hold: on a desktop that is locked or in use another window
        // keeps the foreground, this one never has the keyboard, and the part's own blur releases the key early, as
        // designed (the coordinator's settling run, 2026-11-24). Only read: nothing here takes the foreground. app_test
        // excuses the row (NOT JUDGED) only where the window lacked the keyboard and the row would otherwise fail
        let blurs = 0;
        const onBlur = () => { blurs++; };
        win.on('blur', onBlur);
        try {
          H.focusBefore = win.isFocused();
          win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Space' });
          await sleep(1200);
          H.during = await js(`(() => { const V = TitanicApp.voice, t = V.transmission(); return { listening: V.listening(), mic: V.micOpen(), phase: t ? t.phase : '', typed: document.getElementById('crewLine').value.length, focused: document.activeElement === document.getElementById('crewLine'), pageFocus: document.hasFocus() }; })()`);
          H.focusDuring = win.isFocused();
        } finally {
          // the key is let go whatever happened while it was held (a throw in the sample must not leave it down)
          try { win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Space' }); } catch (e) { /* the window is gone */ }
          win.removeListener('blur', onBlur);
        }
        H.blurs = blurs;
        H.keyboard = H.focusBefore === true && H.focusDuring === true && blurs === 0;
        H.settled = await ready('TitanicApp.voice.transmission() === null && !TitanicApp.voice.listening()', 12000);
        await sleep(300);
        H.after = await js(`(() => { const A = TitanicApp, V = A.voice, L = A.crew.lines(), night = A.state.sim && A.state.sim.night, log = night ? night.log : [], last = log.length ? log[log.length - 1] : null;
          return { listening: V.listening(), note: V.earsNote(), heard: V.heard(), typed: document.getElementById('crewLine').value.length, log: log.length, last: last ? { type: last.type, value: last.value } : null,
            talk: L.length, lines: L.slice(-4).map(l => ({ who: l.who, words: l.words, kind: l.kind })), mode: A.state.night ? A.state.night.mode : '' }; })()`);
      }
      out.ears.hold = H;
    } catch (e) { out.ears.hold = { error: String(e && e.message || e).slice(0, 300) }; }
    out.ears.aboutOn = earsLine();                  // what F1 says while they are on
    out.ears.end = await js(`(async () => { const T = window.titanicVoice, r = {}; ${PROBE}
      r.off = await T.set({ ears: false }); r.micAfter = await probe(MIC); r.cleared = await T.clearKey(); r.offOpen = await T.open({}); return r; })()`);
    out.ears.asked = voiceAsked.slice(earsAsked0);  // what this process asked the player: the ears' switch, twice
    out.ears.hosts = voice ? voice.hosts() : null;
    out.ears.aboutOff = earsLine();
  }
  // the headers reached the page: its policy refuses eval (the console's error for it is the last, and not counted)
  const nErr = errors.length;
  out.policy = await js(`(() => { try { eval('1'); return 'eval ran'; } catch (e) { return e.name; } })()`);
  await sleep(300); errors.splice(nErr);
  out.served = { answers: served.length, withPolicy: served.filter(s => s.csp).length, notFound: served.filter(s => s.status !== 200).map(s => s.path) };
  out.ok = errors.length === 0 && blocked.length === 0 && !!out.page && out.page.webgl && out.page.node === 'undefined' && !!out.watch1912 && !!out.watch1912.fp;
  return out;
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
