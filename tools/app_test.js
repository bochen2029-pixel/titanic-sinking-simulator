// app_test.js: the desktop app, release/Titanic-win-x64/Titanic.exe, run in its own self-test (--smoke) and checked
// against design v3's section 4 list (docs/DESIGN_electron_desktop_client_v3_2026-11-23.md, step D3): the package holds
// this build; the page is served from titanic://app/ under dist/_headers' policy; WebGL is there and Node is not; the
// console shows no error; the window makes no request; the watch steps; the forecast worker answers with Node's numbers;
// the GitHub link is hidden; the copied link is the fragment; --open= opens the night it names; a second start opens
// no window and hands its --open= to the first; data\ sits beside the exe; the page fills the app's window at the
// window's own size; and the 1912 watch's fingerprint inside the app equals the model run alone in Node.
//
//   node tools/app_test.js [--exe PATH] [--shot PNG]   (package first: node tools/package_app.js)
//   node tools/app_test.js --full-screen               and F11 the player's way: the page fills the screen, and F11
//                                                      again gives the window back as it was. It fills this PC's
//                                                      screen for a few seconds, so it is asked for, never by default
//   node tools/app_test.js --zip [--keep]              step D4: the newest release/Titanic-win-x64-*.zip held to its
//                                                      .sha256, unpacked into a folder with a space in its name, and
//                                                      the same test run there (--keep leaves that folder)
//
// It opens a window, briefly (shown but not focused): take a turn first (the browser's turn file: CLAUDE.md).
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const { spawn, spawnSync } = require('child_process');
const Fake = require('./minds_fake_server.js');
const FakeDG = require('./fake_deepgram.js');
const Pk = require('./app_packages.js');

const root = path.join(__dirname, '..'), a = process.argv.slice(2);
const opt = (name) => { const i = a.indexOf(name); return i >= 0 ? a[i + 1] : null; };
const rows = []; let fails = 0, unjudged = 0;
const check = (name, ok, detail) => { if (!ok) fails++; rows.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  [' + detail + ']' : ''}`); };
// a row this run cannot judge, said so, and not failed (only where the desktop itself withholds what the row needs)
const notJudged = (name, detail) => { unjudged++; rows.push(`NOT JUDGED  ${name}  [${detail}]`); };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const files = (d, base = d) => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(path.join(d, e.name), base) : [path.relative(base, path.join(d, e.name)).replace(/\\/g, '/')]).sort();
// the last line is the verdict in the gate's form (tools/gate.js, row app)
const done = () => {
  const judged = rows.length - unjudged, and = unjudged ? ` (and ${unjudged} not judged: see NOT JUDGED above)` : '';
  console.log(rows.join('\n') + '\n' + (fails ? `FAIL: ${fails} of ${judged} rows` : `PASS: all ${judged} rows`) + and); process.exit(fails ? 1 : 0);
};
// a path as the output shows it: under the repository or %TEMP%, never the user's folder (its name is the machine's)
const show = (p) => { const r = path.resolve(p), t = path.resolve(os.tmpdir()); return r.startsWith(root + path.sep) ? path.relative(root, r) : r.startsWith(t + path.sep) ? '%TEMP%\\' + path.relative(t, r) : r; };

// the model alone in Node, as tools/systems_tests.js runs it: the 1912 watch to her foundering, and the miss window's
// row the worker is asked for
function nodeModel() {
  const C = require('../core/core.js');
  for (const f of ['motion', 'encounter', 'systems']) require('../core/' + f + '.js');
  const N = require('../core/night.js'), rd = path.join(root, 'core', 'readers');
  for (const f of fs.readdirSync(rd).filter(f => f.endsWith('.js')).sort()) require(path.join(rd, f));
  const ship = C.buildShip(), t0 = Date.now();
  const s = N.create(ship, N.spec(1912), { auto: true }); N.sink(s);
  const row = N.missWindow(ship, N.spec(1912, { speedKn: 22.5, level: 'hard' }), { times: [30] })[0];
  return { fp: N.fingerprint(s), k: s.night.k, founderT: s.founderT, t: s.t, row: { reaction: row.reaction, kind: row.kind, area: row.area, clearance: row.clearance }, s: (Date.now() - t0) / 1000 };
}

// one start of the exe: resolves with its exit code (-1: killed at the deadline)
function start(exe, args, ms) {
  const env = Object.assign({}, process.env); delete env.ELECTRON_RUN_AS_NODE;   // a shell inside an Electron app may carry it
  const child = spawn(exe, args, { stdio: 'ignore', env });
  const exit = new Promise((res) => { const kill = setTimeout(() => { child.kill(); res(-1); }, ms); child.on('exit', (c) => { clearTimeout(kill); res(c); }); child.on('error', () => { clearTimeout(kill); res(-2); }); });
  return { child, exit };
}

async function testApp(exe) {
  const appDir = path.join(path.dirname(exe), 'resources', 'app'), exeDir = path.dirname(exe);
  // ---- the package holds this build: dist/ current, and the package's main.js and dist/ these very files
  const chk = spawnSync(process.execPath, [path.join(root, 'tools', 'build_site.js'), '--check'], { cwd: root, encoding: 'utf8' });
  const want = files(path.join(root, 'dist')), got = fs.existsSync(path.join(appDir, 'dist')) ? files(path.join(appDir, 'dist')) : [];
  const differ = want.filter(f => !got.includes(f) || !fs.readFileSync(path.join(root, 'dist', f)).equals(fs.readFileSync(path.join(appDir, 'dist', f)))).concat(got.filter(f => !want.includes(f)));
  // (the app's own files: main.js and, since the crew's minds, the preload and minds*.js beside it)
  const appFiles = fs.readdirSync(path.join(root, 'app')).filter(f => f.endsWith('.js')).sort();
  const mainSame = appFiles.includes('main.js') && appFiles.every(f => fs.existsSync(path.join(appDir, f)) && fs.readFileSync(path.join(root, 'app', f)).equals(fs.readFileSync(path.join(appDir, f))));
  // ... and its runtime packages (Anthropic's SDK and what it needs): each one in the package at the version
  // package-lock.json pins, so that a package with a stale or missing SDK cannot pass
  const lock = Pk.lockOf(root), pins = Pk.runtime(root);
  const packed = (k) => Pk.versionOf(path.join(appDir, k));
  const stalePkgs = pins.filter(k => packed(k) !== lock[k].version), sdkPin = lock['node_modules/@anthropic-ai/sdk'];
  const stamp = (() => { try { return JSON.parse(fs.readFileSync(path.join(appDir, 'stamp.json'), 'utf8')); } catch (e) { return null; } })();
  // ... and their FILES, not only their versions (the app lane's review, B3): each copy's digest is the one stamped when
  // it was packaged, and, where this checkout has the package installed, the digest of what is installed here now
  const stamped = (stamp && stamp.packageFiles) || {}, notFiles = [];
  for (const k of pins) {
    const name = k.slice('node_modules/'.length), inApp = Pk.digest(path.join(appDir, k)), here = Pk.digest(path.join(root, k)), st0 = stamped[name];
    if (!inApp) { notFiles.push(name + ': not in the package'); continue; }
    if (!st0 || st0.sha256 !== inApp.sha256 || st0.files !== inApp.files) notFiles.push(name + ': not the files stamped when it was packaged');
    if (!here) notFiles.push(name + ': not installed in this checkout, so its copy cannot be held to it (' + Pk.advice(root).cmd + ')');
    else if (here.sha256 !== inApp.sha256) notFiles.push(name + ': not the files installed in this checkout');
  }
  const extraPkgs = fs.existsSync(path.join(appDir, 'node_modules')) ? Pk.filesOf(path.join(appDir, 'node_modules')).filter(f => !pins.some(k => ('node_modules/' + f).startsWith(k + '/'))) : [];
  const rt = (() => { try { return JSON.parse(fs.readFileSync(path.join(exeDir, 'runtime.json'), 'utf8')); } catch (e) { return null; } })();
  const ver = JSON.parse(fs.readFileSync(path.join(root, 'dist', 'version.json'), 'utf8'));
  check('the package holds this build: dist/ is the build of the sources, and the package\'s main.js (with the files beside it) and dist/ are these files', chk.status === 0 && mainSame && differ.length === 0 && want.length > 0,
    `${ver.app}; ${want.length} files; the app's: ${appFiles.join(', ')}${differ.length ? '; differ: ' + differ.slice(0, 3).join(', ') : ''}${chk.status ? '; ' + (chk.stdout || '').trim().split('\n')[0] : ''}`);
  check('  and its runtime packages are in it, each at the version package-lock.json pins (Anthropic\'s SDK and what it needs)', pins.length > 0 && !!sdkPin && stalePkgs.length === 0,
    stalePkgs.length ? 'not as pinned: ' + stalePkgs.slice(0, 3).map(k => k.slice(13) + ' ' + (packed(k) || 'missing') + ', pinned ' + lock[k].version).join('; ') : `${pins.length} packages; @anthropic-ai/sdk ${sdkPin ? sdkPin.version : '?'}`);
  check('  and file for file: each copy in the package is the one stamped when it was packaged and the one installed in this checkout, and nothing else is beside them',
    pins.length > 0 && notFiles.length === 0 && extraPkgs.length === 0,
    notFiles.length ? notFiles.slice(0, 3).join('; ') : extraPkgs.length ? 'more than the pinned packages: ' + extraPkgs.slice(0, 3).join(', ') : `${pins.length} packages, ${Object.values(stamped).reduce((n, p) => n + p.files, 0)} files, ${(Object.values(stamped).reduce((n, p) => n + p.bytes, 0) / 1048576).toFixed(1)} MB`);
  const exeSha = sha256(exe);
  check('runtime.json names the pinned runtime and this exe\'s sha256', !!rt && rt.electron === '45.2.3' && rt.exeSha256 === exeSha, rt ? `Electron ${rt.electron}, Chromium ${rt.chromium}, sha256 ${exeSha.slice(0, 16)}...` : 'no runtime.json');

  // ---- the model alone in Node
  const node = nodeModel();

  // ---- the self-test: --open= a night, then a second start while it waits
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'titanic-app-')), outFile = path.join(tmp, 'smoke.json'), readyFile = path.join(tmp, 'ready'), prof = path.join(tmp, 'profile');
  // the crew's minds: a stand-in provider on this PC, and one that never answers (tools/minds_fake_server.js). No key and
  // no network: the app is told of them by --smoke-minds= and --smoke-minds-slow=
  const fake = await Fake.start(), slow = await Fake.start(); slow.mode = 'slow';
  // the men's voices: a stand-in for Deepgram on this PC (tools/fake_deepgram.js), told to the app by --smoke-voice=
  const dg = await FakeDG.start();
  const args = ['--smoke', '--smoke-out=' + outFile, '--profile=' + prof, '--open=#night=1912&kn=18', '--smoke-second', '--smoke-ready=' + readyFile, '--smoke-minds=' + fake.base, '--smoke-minds-slow=' + slow.base,
    '--smoke-voice=' + dg.base];
  if (opt('--shot')) args.push('--smoke-shot=' + path.resolve(opt('--shot')));
  const t0 = Date.now(), first = start(exe, args, 240000);
  let firstCode = null; first.exit.then(c => { firstCode = c; });
  while (firstCode === null && !fs.existsSync(readyFile) && Date.now() - t0 < 200000) await sleep(200);
  let second = null;
  if (fs.existsSync(readyFile)) {
    const t1 = Date.now(), s2 = start(exe, ['--profile=' + prof, '--open=#night=1913'], 30000);
    second = { code: await s2.exit, s: (Date.now() - t1) / 1000 };
  }
  const code = await first.exit, secs = (Date.now() - t0) / 1000;
  let r = null; try { r = JSON.parse(fs.readFileSync(outFile, 'utf8')); } catch (e) { /* it never wrote */ }
  check('Titanic.exe starts, runs its self-test and closes by itself', code === 0 && !!r, `exit ${code} in ${secs.toFixed(0)} s` + (r && r.error ? ': ' + r.error.slice(0, 300) : ''));
  if (r && r.page) {
    const P = r.page;
    check('the page is the app\'s own files, from titanic://app/; --open= opens the night it names', P.protocol === 'titanic:' && P.href === 'titanic://app/index.html#night=1912&kn=18' && !!P.night && P.night.seed === 1912 && P.night.kn === 18,
      `${P.href}; the watch: night ${P.night ? P.night.seed + ' at ' + P.night.kn + ' kn' : 'none'}`);
    check('WebGL is there and Node is not', P.webgl && P.node === 'undefined' && P.process === 'undefined', `${P.gl}; require ${P.node}, process ${P.process}`);
    const fontErr = P.fonts.filter(f => / error$/.test(f)), fontOk = P.fonts.filter(f => / loaded$/.test(f));
    check('the console shows no error, and the page\'s fonts load under the scheme', r.errors.length === 0 && fontErr.length === 0 && fontOk.length > 0,
      `${r.errors.length} errors${r.errors.length ? ': ' + r.errors.slice(0, 2).join(' | ') : ''}; fonts ${fontOk.length} loaded, ${fontErr.length} failed of ${P.fonts.length}`);
    check('every answer carries dist/_headers\' policy, and the page runs under it (eval refused)', !!r.served && r.served.answers > 0 && r.served.withPolicy === r.served.answers && r.served.notFound.length === 0 && r.policy === 'EvalError',
      r.served ? `${r.served.withPolicy} of ${r.served.answers} answers; not found: ${r.served.notFound.join(', ') || 'none'}; eval: ${r.policy}` : '');
    check('the window makes no request: no http, https, ws or wss', Array.isArray(r.blocked) && r.blocked.length === 0, (r.blocked || []).slice(0, 3).join(' '));
    check('the watch steps in the window, on its own frames', !!r.steps && r.steps.k0 >= 0 && r.steps.k1 > r.steps.k0, r.steps ? `step ${r.steps.k0} -> ${r.steps.k1} in 2.5 s` : '');
    const w = r.worker || {};
    check('the forecast worker starts from the page\'s address and answers with Node\'s numbers', !!w.row && w.row.kind === node.row.kind && w.row.area === node.row.area && w.row.clearance === node.row.clearance,
      w.row ? `reaction ${w.row.reaction} s: ${w.row.kind}, ${w.row.area} m2 (Node ${node.row.area})` : w.error);
    check('the GitHub link is hidden', P.github.hiddenWrap && !P.github.drawn, `hidden ${P.github.hiddenWrap}, drawn ${P.github.drawn}`);
    const c = r.copied || {};
    check('"Copy a link to this watch" copies the fragment alone, which --open= takes', typeof c.text === 'string' && c.text === c.link && /^#night=1912&kn=18(&|$)/.test(c.text) && !/titanic:/.test(c.text), c.text ? c.text.slice(0, 80) : 'nothing copied; the box held ' + c.box);
    const S2 = r.second || {};
    check('a second start opens no window of its own: it hands its --open= to the first and closes', !!second && second.code === 0 && !!S2.got && S2.got.open === '#night=1913' && S2.opened === true && S2.windows === 1 && /#night=1913$/.test(S2.href || ''),
      second ? `the second closed (exit ${second.code}) in ${second.s.toFixed(1)} s; the first: ${S2.windows} window, now ${S2.href}` : 'the first never said it was ready');
    const W = r.watch1912 || {};
    check('the 1912 watch\'s fingerprint inside the app equals the model run alone in Node', W.fp === node.fp && W.k === node.k && W.founderT === node.founderT && W.t === node.t && !!stamp && stamp.fingerprint1912.fp === node.fp && stamp.fingerprint1912.t === node.t,
      `app ${W.fp} at step ${W.k}, ${W.founderT} s, ends at ${W.t} s, in ${((W.ms || 0) / 1000).toFixed(1)} s; Node ${node.fp} at step ${node.k}, ${node.founderT} s, ends at ${node.t} s; stamped ${stamp ? stamp.fingerprint1912.fp : 'none'}`);
    const ab = r.about ? r.about.detail : '';
    // since G12's cascade the 1912 watch ends where she breaks and never founders (founderT -1): About says so, never "(-1 s)"
    const endWords = node.founderT >= 0 ? 'She founders at step ' + node.k : 'Her watch ends where she breaks, at step ' + node.k;
    check('About (F1) says the version, the commit, the runtime and the fingerprint, where the watch ends, and that this PC\'s night is the model\'s', !!r.about && r.about.title === 'Titanic ' + ver.version && ab.includes(ver.builtFromCommit) && !!stamp && ab.includes(stamp.commit) && ab.includes('Electron ' + r.versions.electron) && ab.includes(node.fp) && ab.includes(endWords) && !ab.includes('(-1 s)') && ab.includes('The same night, to the bit.'),
      ab.split('\n').filter(Boolean).filter(l => l.includes(node.fp)).concat(ab.split('\n').filter(Boolean).slice(-1)).join(' | '));

    // ---- the crew's minds (docs/DESIGN_ask_the_bridge_v1_2026-11-23.md, sections 11 and 13): off as she starts, and
    // nothing asked; then one question to a stand-in provider on this PC, through the page's own titanicMinds
    const M = r.minds || {}, KEY = 'test-key-0123456789-not-a-secret', names = ['ask', 'clearKey', 'set', 'setKey', 'status', 'test', 'usage'];
    const st = M.start || {}, on = M.on || {}, end = M.end || {}, reqs = fake.seen.filter(q => q.method === 'POST'), q0 = reqs[0] || { headers: {}, body: {} };
    const claude = (st.providers || []).find(p => p.id === 'anthropic');
    check('the crew\'s minds: the window has one object with seven calls and nothing else; as she starts they are off, no key is kept, and a question is answered "off"',
      !M.missing && JSON.stringify(M.calls) === JSON.stringify(names) && M.frozen === true && st.ok === true && st.on === false && st.hasKey === false && !!M.offAsk && M.offAsk.ok === false && M.offAsk.kind === 'off',
      M.missing ? 'no titanicMinds in the window' : `${(M.calls || []).join(' ')}; on ${st.on}, key ${st.hasKey}; asked while off: ${M.offAsk && M.offAsk.kind}; Claude's adapter ${claude && claude.ready ? 'is in the package' : 'is NOT in the package (' + Pk.advice(root).cmd + ', then package again)'}`);
    check('  with a provider set (a stand-in on this PC) one question makes one request, to it alone, the key in its header and nowhere else; the answer reaches the page; the window still makes no request',
      reqs.length === 1 && q0.path === '/v1/chat/completions' && q0.headers.authorization === 'Bearer ' + KEY && !String(q0.raw).includes(KEY) && !!on.ask && on.ask.ok === true && on.ask.text === '{"say":"Aye, sir.","order":null}' && Array.isArray(r.blocked) && r.blocked.length === 0,
      `${reqs.length} request to ${q0.path || '?'}; the answer: ${on.ask ? (on.ask.ok ? on.ask.text : on.ask.kind + ': ' + on.ask.why) : 'none'}; the window's own requests: ${(r.blocked || []).length}`);
    const asked = M.asked || [];
    check('  the switch is the player\'s own: the main process itself asked before it went on (answered no once: nothing changed and nobody was called), and again before the address changed while on',
      !!on.no && on.no.ok === false && on.no.kind === 'declined' && !!on.stillOff && on.stillOff.on === false && !!on.noAsk && on.noAsk.kind === 'off' && JSON.stringify(asked) === JSON.stringify(['on', 'on', 'address']) && reqs.length === 1,
      `answered no: ${on.no ? on.no.kind : '?'}, then on ${on.stillOff ? on.stillOff.on : '?'} and a question answered "${on.noAsk ? on.noAsk.kind : '?'}"; asked: ${asked.join(', ') || 'nothing'}`);
    const said = JSON.stringify(M);
    check('  no answer of the seven calls holds the key; the settings file keeps it encrypted (or, on a PC that cannot protect one, not at all), never in the clear',
      !said.includes(KEY) && !!M.file && M.file.written === true && M.file.keyInClear === false && (M.file.keyKept === true || (!!on.key && on.key.keyKept === 'run')) && !!on.after && on.after.hasKey === true,
      `in an answer: ${said.includes(KEY) ? 'THE KEY' : 'no'}; in the file: ${M.file ? (M.file.keyInClear ? 'IN THE CLEAR' : (M.file.keyKept ? 'encrypted' : 'not written')) : '?'}; kept for: ${on.key && on.key.keyKept}`);
    const hosts = M.hosts || [], first = M.hostsFirst || [];
    check('  the hosts the main process called are exactly the stand-in after the one question, and exactly the two stand-ins at the end, each while it was the one set; an address by http on another PC is refused',
      JSON.stringify(first) === JSON.stringify([fake.origin]) && JSON.stringify(hosts) === JSON.stringify([fake.origin, slow.origin]) && !!on.far && on.far.ok === false && on.far.kind === 'shape',
      `after the question: ${first.join(', ') || 'none'}; at the end: ${hosts.join(', ') || 'none'}; http to another PC: ${on.far && on.far.ok === false ? 'refused' : 'TAKEN'}`);
    const fg = M.forgotten || {};
    check('  About (F1) says whether she can reach the network: off as she starts, ON with the provider and its address while they are on, off again; "Forget" leaves no key in the settings file',
      /The crew's minds: off\. The app connects to nothing\./.test(ab) && typeof M.aboutOn === 'string' && M.aboutOn.includes('ON, for ') && M.aboutOn.includes(fake.base) && typeof fg.aboutOff === 'string' && fg.aboutOff.includes('off') && fg.keys === 0,
      `${(ab.split('\n').find(l => l.startsWith('The crew')) || 'no line at the start')} / ${M.aboutOn || 'no line while on'} / keys left in the file: ${fg.keys}`);
    check('  a provider that never answers: "timeout" within the wait, and the key, entered for the first address, is not sent to it; switched off and the key forgotten, a question is answered "off" again',
      !!end.slow && end.slow.ok === false && end.slow.kind === 'timeout' && slow.seen.length === 1 && slow.seen[0].headers.authorization === undefined && !String(slow.seen[0].raw).includes(KEY)
      && !!end.cleared && end.cleared.hasKey === false && !!end.offAsk && end.offAsk.kind === 'off' && reqs.length === 1,
      `${end.slow ? end.slow.kind : 'not asked'}; the key to the second address: ${slow.seen[0] && slow.seen[0].headers.authorization ? 'SENT' : 'not sent'}; then ${end.offAsk && end.offAsk.kind}; the stand-ins saw ${reqs.length} and ${slow.seen.length} requests`);

    // ---- the men's voices by Deepgram (docs/DESIGN_spoken_bridge_v1_2026-11-23.md, section 7; app/voice.js): off as she
    // starts, and a line answered "off"; then one line spoken by a stand-in for Deepgram on this PC, through the page's own
    // titanicVoice (the page reads the WAV's first bytes itself)
    // (ten calls and one listener since the ears: docs/DESIGN_spoken_bridge_voice_v1_2026-11-23.md, section 5)
    const Vo = r.voice || {}, vnames = ['audio', 'cancel', 'clearKey', 'finish', 'onHeard', 'open', 'set', 'setKey', 'speak', 'status', 'test'];
    const vst = Vo.start || {}, von = Vo.on || {}, vend = Vo.end || {}, vline = von.said || {}, dreqs = dg.seen.filter(q => q.method === 'POST'), d0 = dreqs[0] || { headers: {}, query: {} };
    check('the men\'s voices: the window has a second object, titanicVoice, with ten calls and one listener (the voices\' six, the ears\' four and onHeard) and nothing else; as she starts they are off, no key is kept, and a line is answered "off"',
      !Vo.missing && JSON.stringify(Vo.calls) === JSON.stringify(vnames) && Vo.frozen === true && vst.ok === true && vst.on === false && vst.hasKey === false && !!Vo.offSpeak && Vo.offSpeak.ok === false && Vo.offSpeak.kind === 'off',
      Vo.missing ? 'no titanicVoice in the window' : `${(Vo.calls || []).join(' ')}; on ${vst.on}, key ${vst.hasKey}; a line while off: ${Vo.offSpeak && Vo.offSpeak.kind}`);
    // (the key is kept FIRST, while they are off: so that "nobody was called" after the player's no is said of an app that
    // had a key and could have called)
    check('  the switch is the player\'s own: with a key already kept, the main process itself asked before it went on (answered no once: nothing changed, a line was answered "off" and nobody was called)',
      !!von.key && von.key.hasKey === true && von.key.on === false && !!von.no && von.no.ok === false && von.no.kind === 'declined' && !!von.stillOff && von.stillOff.on === false && von.stillOff.hasKey === true
      && Array.isArray(von.stillOff.hosts) && von.stillOff.hosts.length === 0 && !!von.noSpeak && von.noSpeak.kind === 'off' && JSON.stringify(Vo.asked) === JSON.stringify(['on', 'on']) && !!von.set && von.set.on === true,
      `the key kept for: ${von.key && von.key.keyKept} (by ${von.key && von.key.store}); answered no: ${von.no ? von.no.kind : '?'}, then on ${von.stillOff ? von.stillOff.on : '?'}, hosts ${von.stillOff && von.stillOff.hosts ? von.stillOff.hosts.length : '?'}, a line answered "${von.noSpeak ? von.noSpeak.kind : '?'}"; asked: ${(Vo.asked || []).join(', ') || 'nothing'}`);
    check('  one line makes one request, to the stand-in alone: POST /v2/speak in Mr Murdoch\'s voice, linear16 in a WAV at 24 kHz, the key in its Authorization header and nowhere else; the page gets the WAV (RIFF, WAVE); the window still makes no request',
      dreqs.length === 1 && dg.seen.length === 1 && d0.path === '/v2/speak' && d0.search === '?model=flux-conor-en&encoding=linear16&container=wav&sample_rate=24000' && d0.headers.authorization === 'Token ' + KEY
      && d0.raw === '{"text":"Hard a-starboard, sir."}' && vline.ok === true && vline.riff === 'RIFF' && vline.wave === 'WAVE' && vline.bytes > 44 && vline.voice === 'flux-conor-en' && vline.chars === 22 && Array.isArray(r.blocked) && r.blocked.length === 0,
      `${dg.seen.length} request(s): ${d0.method || '?'} ${d0.path || ''}${d0.search || ''}; the answer: ${vline.ok ? vline.bytes + ' bytes, ' + vline.riff + '/' + vline.wave + ' (' + vline.wavType + '), ' + vline.voice : vline.kind + ': ' + vline.why}; the window's own requests: ${(r.blocked || []).length}`);
    const vsaid = JSON.stringify(Vo), vh = Vo.hosts || [];
    check('  the hosts the main process called for the voices are exactly the stand-in; the settings file keeps the key encrypted (or, on a PC that cannot protect one, not at all), never in the clear, nor inside what was sealed; the switch is not written to it; no answer holds the key',
      JSON.stringify(vh) === JSON.stringify([dg.origin]) && !vsaid.includes(KEY) && !!Vo.file && Vo.file.written === true && Vo.file.keyInClear === false && Vo.file.keyInSeal === false && Vo.file.on === false
      && (Vo.file.keyKept === true || (!!von.key && von.key.keyKept === 'run')),
      `hosts: ${vh.join(', ') || 'none'}; in an answer: ${vsaid.includes(KEY) ? 'THE KEY' : 'no'}; in the file: ${Vo.file ? (Vo.file.keyInClear ? 'IN THE CLEAR' : (Vo.file.keyInSeal ? 'INSIDE THE SEAL' : (Vo.file.keyKept ? 'encrypted' : 'not written'))) : '?'}, the switch ${Vo.file ? Vo.file.on : '?'}; kept for: ${von.key && von.key.keyKept}`);
    const vf = Vo.forgotten || {};
    check('  About (F1) says whether Deepgram is sent each line: off as she starts, ON at the stand-in\'s address while on, off again; switched off and the key forgotten, no key is left and a line is answered "off"',
      /The men's voices by Deepgram: off\. Nothing is sent to Deepgram\./.test(ab) && typeof Vo.aboutOn === 'string' && Vo.aboutOn.includes('ON, at ' + dg.origin) && typeof vf.aboutOff === 'string' && /: off\./.test(vf.aboutOff)
      && vf.key === 'none' && !!vend.cleared && vend.cleared.hasKey === false && !!vend.offSpeak && vend.offSpeak.kind === 'off' && dg.seen.length === 1,
      `${(ab.split('\n').find(l => l.startsWith('The men')) || 'no line at the start')} / ${Vo.aboutOn || 'no line while on'} / the key left in the file: ${vf.key}`);

    // ---- the ears (docs/DESIGN_spoken_bridge_voice_v1_2026-11-23.md, section 5; app/voice.js): off as she starts; the
    // player's own word; one transmission through the page's own titanicVoice to the stand-in's socket (tools/fake_deepgram.js,
    // /v1/listen); the microphone itself, Chromium's fake one under the self-test's flags only, and no camera; off again
    const Ea = r.ears || {}, es = Ea.start || {}, eend = Ea.end || {}, LS = dg.listens || [], l0 = LS[0] || { query: {}, protocols: [], search: '', audio: Buffer.alloc(0) };
    const wsOrigin = dg.origin.replace(/^http/, 'ws');
    check('the ears: as she starts they are off and a transmission is answered "off"; the window is a secure context with the microphone\'s interface; About (F1) says the ears are off',
      !!r.ears && es.ok === true && es.ears === false && !!Ea.offOpen && Ea.offOpen.kind === 'off' && !!Ea.page && Ea.page.secure === true && Ea.page.mediaDevices === true
      && /Speaking to the bridge by Deepgram: off\. Nothing you say is sent anywhere\./.test(ab),
      r.ears ? `ears ${es.ears}; a transmission while off: ${Ea.offOpen && Ea.offOpen.kind}; secure ${Ea.page && Ea.page.secure}, mediaDevices ${Ea.page && Ea.page.mediaDevices}; ${(ab.split('\n').find(l => l.startsWith('Speaking')) || 'no line in About')}` : 'no ears block (no --smoke-voice=)');
    check('  the ears\' switch is the player\'s own: the main process asked before they went on (answered no once: nothing changed and no socket was opened), then they were on',
      !!Ea.no && Ea.no.ok === false && Ea.no.kind === 'declined' && !!Ea.stillOff && Ea.stillOff.ears === false && JSON.stringify(Ea.asked) === JSON.stringify(['ears', 'ears']) && !!Ea.set && Ea.set.ears === true && LS.length <= 2,
      `answered no: ${Ea.no ? Ea.no.kind : '?'}, then ears ${Ea.stillOff ? Ea.stillOff.ears : '?'}; asked: ${(Ea.asked || []).join(', ') || 'nothing'}; then ${Ea.set ? 'ears ' + Ea.set.ears : '?'}`);
    // (punctuation is asked for, so that a spoken question comes back with its "?": the review of the ears; formatting is not)
    check('  one transmission opens one socket, to the stand-in alone: /v1/listen, nova-3, interim results, punctuation and no formatting, the key terms and mip_opt_out=true, no encoding or sample rate; the key as the subprotocol and nowhere in the address; its bytes reach it; the words come back, heard on the way; the window still makes no request',
      LS.length >= 1 && l0.path === '/v1/listen' && l0.query.model === 'nova-3' && l0.query.language === 'en' && l0.query.interim_results === 'true' && l0.query.punctuate === 'true' && l0.query.smart_format === 'false'
      && l0.mipOptOut === true && Array.isArray(l0.query.keyterm) && l0.query.keyterm.length >= 18 && !('encoding' in l0.query) && !('sample_rate' in l0.query) && JSON.stringify(l0.protocols) === JSON.stringify(['token', KEY])
      && !l0.search.includes(KEY) && l0.audio.length === 72 && !!Ea.open && Ea.open.ok === true && !!Ea.fin && Ea.fin.ok === true && Ea.fin.text === 'hard a starboard'
      && Array.isArray(Ea.heard) && Ea.heard.some(h => h[0] === Ea.open.id && h[1] === 'hard a') && Array.isArray(r.blocked) && r.blocked.length === 0,
      `${LS.length} socket(s): ${l0.path || '?'}, model ${l0.query.model}, opted out ${l0.mipOptOut}, ${(l0.query.keyterm || []).length} key terms, ${l0.audio.length} bytes; words ${Ea.fin ? (Ea.fin.ok ? '"' + Ea.fin.text + '"' : Ea.fin.kind + ': ' + Ea.fin.why) : 'none'}; heard ${JSON.stringify(Ea.heard || [])}; the window's own requests: ${(r.blocked || []).length}`);
    const esaid = JSON.stringify(Ea), micSaid = (p) => (p ? (p.ok ? 'OPENED (' + p.audio + ' track)' : 'refused (' + p.name + ')') : '?');
    // the coordinator's condition 1: the shell's two permission handlers give the microphone only while the ears are on
    // (Chromium's fake device stands for it; its fake permission UI is not used, so that the handlers are what is asked)
    // (the camera is refused by the page's own policy, camera=(), even while the ears are on; whatever the console says of
    // that probe is the policy's own word for it and nothing else, and is not counted among the page's errors)
    const camSaid = Array.isArray(Ea.cameraSaid) ? Ea.cameraSaid : null;
    check('  the microphone is the permission handlers\' to give: refused while the ears are off (as she starts, and once the player declined), given to this window\'s own page while they are on, refused again once they are off; the camera never, by the page\'s own policy',
      !!Ea.micBefore && Ea.micBefore.ok === false && !!Ea.micDeclined && Ea.micDeclined.ok === false && !!Ea.micOn && Ea.micOn.ok === true && Ea.micOn.audio === 1
      && !!eend.micAfter && eend.micAfter.ok === false && !!Ea.camera && Ea.camera.ok === false && !!camSaid && camSaid.length <= 1 && camSaid.every(m => /^Permissions policy violation: camera is not allowed/.test(m)),
      `ears off: ${micSaid(Ea.micBefore)}; declined: ${micSaid(Ea.micDeclined)}; on: ${micSaid(Ea.micOn)}; off again: ${micSaid(eend.micAfter)}; the camera: ${micSaid(Ea.camera)}; the console of it: ${camSaid ? (camSaid.join(' | ') || 'nothing') : '?'}`);
    // THE PAGE'S OWN HOLD: a real Space in the empty order line, held a second and let go. The part itself asks for the
    // microphone, records Chromium's fake one with the browser's own recorder and sends its slices by its own calls; this
    // test only presses the key. Its sound is the second socket's (the first is the transmission above, by the test's calls)
    const Hd = Ea.hold || {}, hb = Hd.before || {}, hdu = Hd.during || {}, ha = Hd.after || {}, l1 = LS[1] || { path: '', audio: Buffer.alloc(0), frames: 0 };
    const webm = l1.audio.length >= 4 && l1.audio[0] === 0x1A && l1.audio[1] === 0x45 && l1.audio[2] === 0xDF && l1.audio[3] === 0xA3;
    const youSaid = (ha.lines || []).filter(l => l.who === 'You').map(l => l.words).pop() || '';
    // The row needs the app's window to have the keyboard for the whole hold. On a desktop that is locked or in use
    // (Bo's softlock keeps the foreground, and Windows lets no other window take it) the window never has it, and the
    // part's own blur releases the key early, as designed: that is the desktop, not the app, so the row is then NOT
    // JUDGED, and says why, never failed. Where the window had the keyboard (main.js reads isFocused before the key
    // goes down and at the sample, and counts the blurs during the hold) it is the MUST it was. Bo's own trial on his
    // desktop is the real judgement of this path
    const holdName = '  the page\'s own hold: a real Space held a second in the empty order line and let go. The part listens while it is down and no space is typed; the browser\'s own recorder sends the fake microphone\'s sound (WebM) by the page\'s own calls on a second socket; the words that come back are given through the order line: the captain\'s line in the talk and the order in the watch\'s log';
    const holdOk = hb.part === true && hb.ears === true && hb.focused === true && hdu.listening === true && hdu.typed === 0 && Hd.settled === true && ha.listening === false && ha.typed === 0
      && LS.length === 2 && l1.path === '/v1/listen' && l1.frames >= 3 && l1.audio.length > 500 && webm && l1.mipOptOut === true
      && ha.log === hb.log + 1 && !!ha.last && ha.last.type === 'helm' && ha.last.value === -40 && /hard a.?starboard/i.test(youSaid);
    const holdSaid = Hd.error ? 'the hold could not be run: ' + Hd.error : `before: ears ${hb.ears}, the line focused ${hb.focused}; while held: listening ${hdu.listening} (${hdu.phase || 'no transmission'}), typed ${hdu.typed}; the second socket: ${l1.frames} frames, ${l1.audio.length} bytes, WebM ${webm}; after: "${youSaid}", the log ${hb.log} -> ${ha.log} (${ha.last ? ha.last.type + ' ' + ha.last.value : 'nothing'}); note "${ha.note || ''}"`
      + `; the window had the keyboard: ${Hd.keyboard === undefined ? '?' : Hd.keyboard} (focused before ${Hd.focusBefore}, at the sample ${Hd.focusDuring}; blurs ${Hd.blurs}; the page ${hdu.pageFocus})`;
    // (excused only where it would otherwise fail: a hold that passes without the keyboard is still a PASS; NH13's yes)
    if (!Hd.error && Hd.keyboard === false && !holdOk) notJudged(holdName, 'the app\'s window could not take the keyboard (the desktop is locked or in use); ' + holdSaid);
    else check(holdName, holdOk, holdSaid);
    check('  the main process called the stand-in\'s address and its socket and nothing else; no answer holds the key',
      JSON.stringify(Ea.hosts) === JSON.stringify([dg.origin, wsOrigin]) && !esaid.includes(KEY), `hosts ${JSON.stringify(Ea.hosts || [])}; the key in an answer: ${esaid.includes(KEY)}`);
    check('  About (F1) says the ears are ON at the socket\'s address while they are on, and off again; switched off and the key forgotten, a transmission is answered "off"',
      typeof Ea.aboutOn === 'string' && Ea.aboutOn.includes('ON, at ' + wsOrigin) && typeof Ea.aboutOff === 'string' && /Speaking to the bridge by Deepgram: off\./.test(Ea.aboutOff)
      && !!eend.off && eend.off.ears === false && !!eend.cleared && eend.cleared.hasKey === false && !!eend.offOpen && eend.offOpen.kind === 'off' && LS.length === 2,
      `${Ea.aboutOn || 'no line while on'} / ${Ea.aboutOff || 'no line after'}; then ${eend.offOpen ? eend.offOpen.kind : '?'}`);
  }
  await fake.close(); await slow.close(); await dg.close();

  // ---- her settings: data\ beside the exe (a start without --profile), at the window's own size (--smoke-fit)
  const full = a.includes('--full-screen');
  const data = path.join(exeDir, 'data'), had = fs.existsSync(data), qOut = path.join(tmp, 'quick.json');
  const q = start(exe, ['--smoke', '--smoke-quick', '--smoke-fit'].concat(full ? ['--smoke-full-screen'] : []).concat(['--smoke-out=' + qOut]), 120000), qCode = await q.exit;
  let qr = null; try { qr = JSON.parse(fs.readFileSync(qOut, 'utf8')); } catch (e) { /* it never wrote */ }
  check('data\\ sits beside the exe: her settings are made there', qCode === 0 && !!qr && qr.profile.how === 'beside' && path.resolve(qr.profile.dir) === path.resolve(data) && fs.existsSync(path.join(data, 'Local State')),
    qr ? `${qr.profile.how}: ${show(qr.profile.dir)}${had ? ' (it was there before)' : ''}` : `exit ${qCode}, no report (another Titanic.exe from this folder running?)`);
  // ---- the page fills the app's window: the self-test's other start pins 1400 x 860, this one takes the window's own
  // size (90 % of the work area). The page's viewport is the window's content, and its root (#app) spans it
  const F = qr && qr.fit, near = (x, y, d = 1) => Math.abs(x - y) <= d, wxh = (v) => (v ? v[0] + ' x ' + v[1] : '?');
  const fills = (s) => !!s && !!s.page && !!s.page.root && near(s.page.inner[0], s.content[0]) && near(s.page.inner[1], s.content[1])
    && s.page.root[0] === 0 && s.page.root[1] === 0 && near(s.page.root[2], s.page.inner[0]) && near(s.page.root[3], s.page.inner[1]);
  const W = F && F.window;
  check('the page fills the app\'s window at the window\'s own size: its viewport is the window\'s content, and the page\'s root spans it',
    !!W && fills(W) && !!F.asked && near(W.bounds.width, F.asked[0], 2) && near(W.bounds.height, F.asked[1], 2),
    W && W.page ? `the window ${wxh([W.bounds.width, W.bounds.height])} (asked ${wxh(F.asked)}, the work area ${wxh(F.workArea)}); its content ${wxh(W.content)}; the page ${wxh(W.page.inner)}, its root ${W.page.root ? wxh(W.page.root.slice(2)) : 'not found'}` : (F && F.error ? F.error : 'no measure'));
  if (full) {
    const S = F && F.screen, U = F && F.full, B = F && F.back;
    const same = !!B && !!W && ['x', 'y', 'width', 'height'].every(k => near(B.bounds[k], W.bounds[k]));
    check('  F11 fills the screen with the page, and F11 again gives the window back as it was (--full-screen)',
      !!U && U.entered === true && U.full === true && fills(U) && !!S && near(U.page.inner[0], S[0]) && near(U.page.inner[1], S[1]) && !!B && B.left === true && B.full === false && fills(B) && same,
      U && B ? `full screen: the page ${wxh(U.page.inner)} on a screen of ${wxh(S)}${U.entered ? '' : ' (F11 never reached the window)'}; back: the window ${wxh([B.bounds.width, B.bounds.height])} at ${B.bounds.x},${B.bounds.y}, was ${wxh([W.bounds.width, W.bounds.height])} at ${W.bounds.x},${W.bounds.y}` : 'no measure');
  }
  if (!had) fs.rmSync(data, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
  fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
  return { node, secs };
}

(async () => {
  if (a.includes('--zip')) {
    // D4: the zip, unpacked into a folder with a space in its name, and the same test run there
    const rel = path.join(root, 'release'), zips = fs.existsSync(rel) ? fs.readdirSync(rel).filter(f => /^Titanic-win-x64-.*\.zip$/.test(f)).map(f => path.join(rel, f)).sort((x, y) => fs.statSync(y).mtimeMs - fs.statSync(x).mtimeMs) : [];
    if (!zips.length) { check('a zip in release/', false, 'none: node tools/package_app.js --zip'); done(); }
    const zip = zips[0], line = fs.existsSync(zip + '.sha256') ? fs.readFileSync(zip + '.sha256', 'utf8').trim() : '', h = sha256(zip);
    check('the zip is what its .sha256 says', line === `${h}  ${path.basename(zip)}`, `${path.basename(zip)}, ${(fs.statSync(zip).size / 1048576).toFixed(1)} MB, sha256 ${h.slice(0, 16)}...`);
    const where = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'titanic-zip-')), 'Titanic app test'), t0 = Date.now();
    fs.mkdirSync(where, { recursive: true });
    const x = spawnSync(path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe'), ['-x', '-f', zip, '-C', where], { stdio: 'inherit' });
    const exe = path.join(where, 'Titanic-win-x64', 'Titanic.exe');
    check('it unpacks into a folder with a space in its name, with no data\\ in it', x.status === 0 && fs.existsSync(exe) && !fs.existsSync(path.join(where, 'Titanic-win-x64', 'data')), `${show(exe)} in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    if (fs.existsSync(exe)) await testApp(exe);
    if (!a.includes('--keep')) fs.rmSync(path.dirname(where), { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
    done();
  }
  const exe = opt('--exe') ? path.resolve(opt('--exe')) : path.join(root, 'release', 'Titanic-win-x64', 'Titanic.exe');
  if (!fs.existsSync(exe)) { check('the app is packaged', false, 'no ' + show(exe) + ': node tools/package_app.js'); done(); }
  await testApp(exe);
  done();
})();
