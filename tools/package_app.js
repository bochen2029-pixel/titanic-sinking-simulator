// package_app.js: the desktop app, release/Titanic-win-x64/Titanic.exe: Electron's own runtime with the app beside it
// (Electron's "manual packaging": the runtime's folder, its electron.exe renamed, the app in resources/app). Fathom's
// packager, renamed. Nothing is downloaded and nothing is installed: the runtime is
// copied from one already on this machine (docs/DESIGN_electron_desktop_client_v3_2026-11-23.md, steps D2 and D4).
//
//   node tools/package_app.js [--electron DIR] [--zip]
//     --electron DIR   an Electron dist folder (electron.exe, resources/, ...). Looked for, in order: --electron, the
//                      environment's TITANIC_ELECTRON_DIST, and "electronDist" in tools/local_paths.json, this machine's
//                      own file, which git ignores ({ "electronDist": "DIR" }: so that no path of this machine is in
//                      the repository). The folder is read and copied, never changed. With none of those, a runtime
//                      already whole in release/Titanic-win-x64 is used again as it is; only the app beside it is
//                      written afresh.
//     --zip            also release/Titanic-win-x64-<version>-<commit>.zip and its .sha256 (Windows' own tar.exe; the
//                      data\ folder a run leaves is not packed). "-dirty" follows the commit when the app's sources
//                      differ from it.
//
// It refuses a dist/ that is not the build of the sources (node tools/build_site.js --check), and an Electron other than
// PIN: a new runtime is a new engine, so moving the pin is a change of its own, with tools/app_test.js run on it. The
// runtime is copied once a version; runtime.json keeps its version and the exe's sha256, and a runtime changed under
// the same version is refused (--recopy takes it). English only: the other locales are not copied.
// Electron is MIT and ships its LICENSE and LICENSES.chromium.html in that folder; they stay in the release.
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { spawnSync, execFileSync } = require('child_process');

const PIN = '45.2.3';                               // the runtime this app is tested on (design v3, section 9)
const root = path.join(__dirname, '..'), a = process.argv.slice(2);
const opt = (name) => { const i = a.indexOf(name); return i >= 0 ? a[i + 1] : null; };
const ZIP = a.includes('--zip'), RECOPY = a.includes('--recopy');
const fail = (msg) => { console.log('FAIL: refused: ' + msg); process.exit(2); };   // the gate's form (tools/gate.js, row package)
const sha256 = (file) => { const h = crypto.createHash('sha256'), fd = fs.openSync(file, 'r'), buf = Buffer.alloc(1 << 20); let n; while ((n = fs.readSync(fd, buf, 0, buf.length, null)) > 0) h.update(buf.subarray(0, n)); fs.closeSync(fd); return h.digest('hex'); };
const git = (args) => { try { return execFileSync('git', args, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { return null; } };

// ---------------------------------------------------------------- the page must be the build of these sources
const chk = spawnSync(process.execPath, [path.join(root, 'tools', 'build_site.js'), '--check'], { cwd: root, encoding: 'utf8' });
if (chk.status !== 0) fail('dist/ is not the build of the sources as they stand:\n' + (chk.stdout || '') + (chk.stderr || ''));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const page = JSON.parse(fs.readFileSync(path.join(root, 'dist', 'version.json'), 'utf8'));
const commit = git(['rev-parse', '--short', 'HEAD']) || 'nogit';
// what goes into the package, against the commit: the app, the page's sources, this packager, the runtime packages' pins
const changed = git(['status', '--porcelain', '--', 'app', 'core', 'site', 'out/validation.json', 'package.json', 'package-lock.json', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'tools/package_app.js', 'tools/app_packages.js']);
const dirty = changed === null ? null : changed !== '';

// ---------------------------------------------------------------- the app's runtime packages must be the pinned ones
// package.json's "dependencies" (Anthropic's SDK, for the crew's minds) and what they need, as package-lock.json pins
// them (tools/app_packages.js). Nothing is downloaded here: they are copied from node_modules, so they must be
// installed there, each at its pinned version. It refuses anything else, as it refuses a stale dist/: a package that
// could not speak to Claude, or that carried another SDK than the one tested, must not pass for this build. The
// refusal names the npm command that fits this checkout (one with the development packages, or one kept without)
const Pk = require('./app_packages.js');
const lock = Pk.lockOf(root), runtimePkgs = Pk.runtime(root);
{
  const wrong = Pk.wrong(root), how = Pk.advice(root);
  if (wrong.length) fail('the app\'s runtime packages are not installed as they are pinned:\n  ' + wrong.join('\n  ') + '\nRun in this folder:  ' + how.cmd + '   (' + how.why + ')');
}

// ---------------------------------------------------------------- the runtime
const out = path.join(root, 'release', 'Titanic-win-x64'), exe = path.join(out, 'Titanic.exe'), stampFile = path.join(out, 'runtime.json');
// this machine's own paths stay out of the repository: tools/local_paths.json (ignored by git), read when it is there
const localFile = path.join(__dirname, 'local_paths.json');
const local = (() => {
  if (!fs.existsSync(localFile)) return {};
  let j; try { j = JSON.parse(fs.readFileSync(localFile, 'utf8')); } catch (e) { fail('tools/local_paths.json is not JSON: ' + e.message); }
  return j && typeof j === 'object' ? j : {};
})();
const candidates = [opt('--electron'), process.env.TITANIC_ELECTRON_DIST, local.electronDist].filter(Boolean);
// which of the three gave the runtime: runtime.json, which goes into the zip, names that, never the folder's path
const givenBy = (d) => (d === opt('--electron') ? '--electron' : d === process.env.TITANIC_ELECTRON_DIST ? 'TITANIC_ELECTRON_DIST' : 'tools/local_paths.json');
const src = candidates.find(d => fs.existsSync(path.join(d, 'electron.exe')));
let have = null; try { have = JSON.parse(fs.readFileSync(stampFile, 'utf8')); } catch (e) { /* none yet */ }
const whole = () => { try { return !!have && fs.existsSync(exe) && fs.readFileSync(path.join(out, 'version'), 'utf8').trim() === have.electron && sha256(exe) === have.exeSha256; } catch (e) { return false; } };
let how;
if (src) {
  const version = fs.readFileSync(path.join(src, 'version'), 'utf8').trim();
  if (version !== PIN) fail(`the runtime in ${src} is Electron ${version}; this app is pinned to ${PIN} (PIN in tools/package_app.js)`);
  const srcSha = sha256(path.join(src, 'electron.exe'));
  if (have && have.electron === version && have.exeSha256 && have.exeSha256 !== srcSha && !RECOPY) fail(`${src}'s electron.exe is not the Electron ${version} this release was copied from (sha256 ${srcSha.slice(0, 16)}..., runtime.json has ${have.exeSha256.slice(0, 16)}...): a runtime changed under the same version. --recopy takes it`);
  if (!whole() || RECOPY) {
    fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
    fs.cpSync(src, out, { recursive: true, filter: (f) => path.dirname(f) !== path.join(src, 'locales') || path.basename(f) === 'en-US.pak' });   // English only
    fs.renameSync(path.join(out, 'electron.exe'), exe);
    fs.rmSync(path.join(out, 'resources', 'default_app.asar'), { force: true });
    // the runtime's own versions, asked of the exe itself run as Node (no window)
    let versions = null;
    try { versions = JSON.parse(execFileSync(exe, ['-e', 'process.stdout.write(JSON.stringify(process.versions))'], { env: Object.assign({}, process.env, { ELECTRON_RUN_AS_NODE: '1' }), stdio: ['ignore', 'pipe', 'ignore'], timeout: 60000 }).toString()); } catch (e) { /* the stamp goes without them */ }
    have = { electron: version, chromium: versions ? versions.chrome : null, v8: versions ? versions.v8 : null, node: versions ? versions.node : null,
      exe: 'Titanic.exe', exeSha256: sha256(exe), locales: ['en-US'], from: givenBy(src), copied: new Date().toISOString() };
    if (have.exeSha256 !== srcSha) fail('the copied exe is not the source\'s');
    fs.writeFileSync(stampFile, JSON.stringify(have, null, 1) + '\n');
    how = 'the runtime copied from ' + src;
  } else how = 'the runtime from ' + src + ' already in place';
} else if (whole()) {
  if (have.electron !== PIN) fail(`the runtime in ${out} is Electron ${have.electron}; this app is pinned to ${PIN}`);
  how = 'no Electron dist on this machine: the runtime already in release/ used again (Electron ' + have.electron + ', sha256 as stamped)';
} else fail('no Electron runtime found, and none whole in release/Titanic-win-x64.' + (candidates.length ? ' None of these holds electron.exe:\n  ' + candidates.join('\n  ') : '') +
  '\nGive the folder that holds electron.exe (Electron ' + PIN + ') in one of three ways: --electron DIR; the environment\'s TITANIC_ELECTRON_DIST;' +
  ' or "electronDist" in tools/local_paths.json, this machine\'s own file, which git ignores: { "electronDist": "DIR" }.');
// a runtime.json written before the path left the repository named the folder it was copied from: it goes into the
// zip, so it names only the way it was given
if (have && typeof have.from === 'string' && path.isAbsolute(have.from)) { have.from = 'a folder on the machine that packaged it'; fs.writeFileSync(stampFile, JSON.stringify(have, null, 1) + '\n'); }

// ---------------------------------------------------------------- the 1912 watch in Node: the fingerprint About shows
// (the model run alone, as tools/systems_tests.js runs it; the page bundles these same files, build_site --check above)
const fp = (() => {
  const C = require('../core/core.js');
  for (const f of ['motion', 'encounter', 'systems']) require('../core/' + f + '.js');
  const N = require('../core/night.js'), rd = path.join(root, 'core', 'readers');
  for (const f of fs.readdirSync(rd).filter(f => f.endsWith('.js')).sort()) require(path.join(rd, f));
  const s = N.create(C.buildShip(), N.spec(1912), { auto: true }); N.sink(s);
  return { fp: N.fingerprint(s), k: s.night.k, founderT: s.founderT, t: s.t, node: process.version };   // t: the watch's end (it ends where she breaks: founderT -1)
})();

// ---------------------------------------------------------------- the app beside it
const appDir = path.join(out, 'resources', 'app');
fs.rmSync(appDir, { recursive: true, force: true }); fs.mkdirSync(appDir, { recursive: true });
fs.writeFileSync(path.join(appDir, 'package.json'), JSON.stringify({ name: 'titanic', productName: 'Titanic', version: pkg.version, description: pkg.description, license: pkg.license, private: true, main: 'main.js' }, null, 1) + '\n');
// the app's own files: main.js and, since the crew's minds, the preload and minds*.js beside it
for (const f of fs.readdirSync(path.join(root, 'app')).filter(f => f.endsWith('.js'))) fs.copyFileSync(path.join(root, 'app', f), path.join(appDir, f));
fs.cpSync(path.join(root, 'dist'), path.join(appDir, 'dist'), { recursive: true });
// the app's runtime packages (checked above against their pins), each folder with its own licence. Each copy is held
// to its source file for file, and its digest is stamped, so that the self-test can hold the package's copies to what
// was installed here when it was packaged (the app lane's review, B3: a version alone says nothing of the files)
const packageFiles = {};
for (const k of runtimePkgs) {
  fs.cpSync(path.join(root, k), path.join(appDir, k), { recursive: true });
  const from = Pk.digest(path.join(root, k)), to = Pk.digest(path.join(appDir, k));
  if (!from || !to || from.sha256 !== to.sha256) fail('the copy of ' + k + ' is not its source, file for file');
  packageFiles[k.slice('node_modules/'.length)] = { version: lock[k].version, sha256: to.sha256, files: to.files, bytes: to.bytes };
}
const stamp = { version: pkg.version, commit, dirty, packaged: new Date().toISOString(), page: { built: page.built, builtFromCommit: page.builtFromCommit, sourcesCommitted: page.sourcesCommitted, app: page.app }, electron: have.electron, fingerprint1912: fp,
  packages: runtimePkgs.map(k => k.slice('node_modules/'.length) + '@' + lock[k].version), packageFiles };
fs.writeFileSync(path.join(appDir, 'stamp.json'), JSON.stringify(stamp, null, 1) + '\n');
fs.copyFileSync(path.join(root, 'LICENSE'), path.join(out, 'LICENSE.titanic.txt'));
fs.copyFileSync(path.join(root, 'THIRD_PARTY_NOTICES.md'), path.join(out, 'THIRD_PARTY_NOTICES.md'));
const name = `Titanic-win-x64-${pkg.version}-${commit}${dirty ? '-dirty' : ''}`;
fs.writeFileSync(path.join(out, 'README.txt'), readme(name).join('\r\n') + '\r\n');

let bytes = 0; const walk = (d) => { for (const f of fs.readdirSync(d)) { if (d === out && f === 'data') continue; const p = path.join(d, f), st = fs.statSync(p); if (st.isDirectory()) walk(p); else bytes += st.size; } }; walk(out);
console.log(`packaged ${path.relative(root, exe)}  (Titanic ${pkg.version} at ${commit}${dirty ? ' with uncommitted changes' : ''} on Electron ${have.electron}, ${(bytes / 1048576).toFixed(0)} MB; ${how})`);
console.log(`the 1912 watch in Node ${fp.node}: ${fp.fp} at step ${fp.k}, ${fp.founderT >= 0 ? 'founders at ' + fp.founderT : 'ends where she breaks at ' + fp.t} s (stamped for About)`);
console.log(`the crew's minds: ${stamp.packages.length} runtime packages copied, each as pinned and file for file (${stamp.packages[0] || 'none'} and what it needs; ${Object.values(packageFiles).reduce((n, p) => n + p.files, 0)} files, ${(Object.values(packageFiles).reduce((n, p) => n + p.bytes, 0) / 1048576).toFixed(1)} MB)`);

// ---------------------------------------------------------------- the zip (D4)
if (ZIP) {
  const zip = path.join(root, 'release', name + '.zip'), tar = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe');
  if (!fs.existsSync(tar)) fail('no ' + tar + ' (Windows 10 1803 or later has it)');
  fs.rmSync(zip, { force: true }); fs.rmSync(zip + '.sha256', { force: true });
  const t0 = Date.now();
  const r = spawnSync(tar, ['-a', '-c', '-f', zip, '--exclude', 'Titanic-win-x64/data', '-C', path.join(root, 'release'), 'Titanic-win-x64'], { stdio: 'inherit' });
  if (r.status !== 0 || !fs.existsSync(zip)) fail('tar.exe could not write ' + zip);
  const h = sha256(zip);
  fs.writeFileSync(zip + '.sha256', `${h}  ${path.basename(zip)}\n`);
  console.log(`zipped ${path.relative(root, zip)}  (${(fs.statSync(zip).size / 1048576).toFixed(1)} MB in ${((Date.now() - t0) / 1000).toFixed(0)} s)\nsha256 ${h}  -> ${path.relative(root, zip)}.sha256`);
}
console.log(`PASS: ${path.relative(root, exe)}, Titanic ${pkg.version} at ${commit}${dirty ? ' (uncommitted changes)' : ''} on Electron ${have.electron}${ZIP ? ', zipped' : ''}`);

function readme(name) {
  return [
    'TITANIC: THE FLOODING AND SINKING SIMULATOR, AS AN APP FOR WINDOWS',
    `${name}: version ${pkg.version}, commit ${commit}${dirty ? ' with changes not then committed' : ''}, on Electron ${have.electron}.`,
    ...(pkg.homepage ? [`The same simulator on the web: ${pkg.homepage}`] : []),
    '',
    'TO RUN IT',
    '1. Unzip the whole folder first (in Explorer: right-click the zip, then "Extract All..."). Titanic.exe cannot run',
    '   from inside the zip: it needs the files beside it.',
    '2. Run Titanic.exe in the unzipped folder.',
    'Nothing is installed: no administrator rights, no registry, no browser and no port. She connects to nothing, unless',
    'you switch on the crew\'s minds (to ask the bridge), Deepgram\'s voices (to hear the men) or speaking to the bridge',
    '(to give orders aloud) with a key of your own; then only to the provider you chose, or to Deepgram (THE CREW\'S',
    'MINDS and THE VOICE, below). The folder can be copied anywhere (another disk, a USB stick, another PC) and run there.',
    'To remove her, delete the folder.',
    '',
    'THE CREW\'S MINDS',
    'On a watch you can speak to the people on her bridge in your own words, and each answers in character. The words',
    'are a language model\'s. It needs a key of your own (Anthropic, OpenAI, Google, Cerebras) or a model running on',
    'this PC (LM Studio, Ollama). It is off each time the app starts, until you switch it on, in "The crew\'s minds" on',
    'the Run tab (your key and your other settings are kept; the switch is not, so that no run begins spending because an',
    'earlier one did). F1 (About) says whether it is on, and for which provider. While it is on, the app calls that one',
    'provider for it and nobody else (the men\'s voices, in THE VOICE below, have a provider and a switch of their own);',
    'what it sends is your question and what the bridge has been told. The provider bills your key for it.',
    'The app itself asks you, in a message box of its own, before the switch goes on, before it would call another',
    'provider or address while on, and before a limit of the run is raised. Nothing in the page can answer for you.',
    'While it is on, the men also give a report in their own words as it reaches the bridge, unasked ("They speak up',
    'unasked", which you can clear in the same place). Each such line is one more question to the provider: on the',
    'night of 1912 there are twelve, and none while the watch runs faster than four times her pace.',
    'Your key is kept with her settings (the data folder, or where the window\'s title says when that folder cannot be',
    'written), encrypted by Windows for your user account on this PC, and the app never shows it again. In a folder',
    'carried to another PC, or opened by another user, it cannot be read: enter your key again there. On a PC that',
    'cannot protect a key, it is kept only until the app closes. "Forget" removes the key kept for the provider shown.',
    'With Claude, Anthropic may have another of its models answer a question that one model declines; that answer is',
    'billed at that model\'s rate.',
    '',
    'THE VOICE',
    'Each line a man says on the bridge can be spoken aloud ("Hear the bridge", under "Orders to the bridge" on the Run',
    'tab). By default the voices are this PC\'s own: nothing is sent anywhere, and no key is needed. With a Deepgram key',
    'of your own, each man can speak in a voice of Deepgram\'s instead, a different one for each man ("Deepgram\'s voices",',
    'folded under that switch). It is off each time the app starts, until you switch it on, and the app itself asks you,',
    'in a message box of its own, before it goes on. While it is on, the app sends each line a man says, as text, to',
    'Deepgram (api.deepgram.com) and to nobody else; your own lines as the captain are never sent. Deepgram bills your',
    'key per character: a run of the app sends at most 40,000 characters, a limit you can change in the same place (the',
    'app asks before it is raised). F1 (About) says whether it is on. A line',
    'Deepgram cannot give is spoken by this PC\'s own voice when "Hear the bridge" is on, and not at all when it is off.',
    'The key is kept as the crew\'s minds\' key is (above), and "Forget" removes it. With it off, the PC\'s own voices',
    'still speak when "Hear the bridge" is on, and nothing is sent.',
    'With the same key you can also speak to the bridge ("Speak to the bridge", in the same place, a switch of its own):',
    'hold Space in the empty order line, or the "Hold to speak" button beside it, say an order or a question, and let go;',
    'the words are given exactly as if you had typed them (Escape gives them up). It is off each time the app starts,',
    'and the app asks you, in a message box of its own, before it goes on. While it is on, and only while you hold the',
    'key, the app sends what you say, as sound, to Deepgram (wss://api.deepgram.com) to be turned into words, and to',
    'nobody else; nothing is sent while you do not hold it, and neither the sound nor the words are kept on this PC.',
    'The app asks Deepgram to leave what you say out of its programme for improving its models; Deepgram may charge more',
    'for that. Deepgram bills your key per minute heard: a run of the app sends at most 30 minutes, a limit you can change',
    'in the same place (the app asks before it is raised). F1 (About) says whether it is on. Windows\' own setting must',
    'let desktop apps use the microphone (Settings, Privacy and security, Microphone, "Let desktop apps access your',
    'microphone").',
    '',
    'THE FIRST RUN',
    'The app is not signed. When the zip came through a browser or an e-mail, Windows may stop its first run with',
    '"Windows protected your PC". Choose "More info", then "Run anyway". A PC that a company manages may refuse an',
    'unsigned program outright: that is its administrator\'s choice.',
    '',
    'KEYS',
    'F11  full screen, and back',
    'F1   About: the version, the commit, the runtime, and the 1912 watch\'s fingerprint',
    'F12  the developer tools',
    'The page\'s own keys are the web page\'s: Space pauses, R starts again; on a watch, A, S and D and the arrow keys',
    'are the wheel and the telegraph.',
    '',
    'A WATCH FROM AN ADDRESS',
    'At the end of a watch, "Copy a link to this watch" copies its address: #night=...&log=..., the night\'s seed and the',
    'orders given. Open it with',
    '    Titanic.exe "--open=#night=1912&log=..."',
    '(the quotes keep the & in it). A link to the web page works too: --open= takes what follows its #. When Titanic is',
    'already open, the watch opens in its window.',
    '',
    'WHERE HER SETTINGS GO',
    'In the data folder beside Titanic.exe, made on the first run. When the folder cannot be written (a read-only share,',
    'Program Files), Windows\' place for an app\'s settings is used (%APPDATA%\\Titanic), and the window\'s title says so.',
    '--profile=DIR puts them in DIR.',
    '',
    'CHECKING A NIGHT',
    'A night is its seed and its orders, and the model computes it in its own arithmetic. F1 shows the 1912 watch\'s',
    'fingerprint as the model gave it in Node when this app was packaged. "Check this PC" runs the same night in this',
    'app, on this PC, and compares (about 15 seconds): the same fingerprint means this PC\'s night is the model\'s, to the',
    'bit. runtime.json names the runtime and gives the sha256 of Titanic.exe. The zip\'s sha256 is in the .sha256 file',
    'beside it (certutil -hashfile <the zip> SHA256 prints it).',
    '',
    'NEEDS',
    'Windows 10 or later, 64-bit, and a graphics card with WebGL. Without one the picture falls back to software, and',
    'she is slow.',
    '',
    'THE FOLDER',
    'Titanic.exe              Electron\'s runtime, renamed',
    'resources\\app\\           the app: main.js and the files beside it, package.json, stamp.json, dist\\ (the page),',
    '                         and node_modules\\ (Anthropic\'s SDK and what it needs, each with its own licence)',
    'data\\                    her settings, made on the first run',
    'README.txt               this file',
    'LICENSE.titanic.txt      the simulator\'s licence (MIT)',
    'THIRD_PARTY_NOTICES.md   what the app includes from others, each with its version, its licence and where that is',
    'LICENSE                  Electron\'s licence (MIT)',
    'LICENSES.chromium.html   the licences of Chromium and its parts',
    'runtime.json             the runtime\'s version and the exe\'s sha256',
    'The fonts\' licences are in resources\\app\\dist\\fonts; three.js carries its MIT notice in its own file.',
    '',
    'THE SOURCE',
    pkg.repository && pkg.repository.url ? pkg.repository.url.replace(/^git\+/, '').replace(/\.git$/, '') : '',
  ];
}
