// build_site.js: assemble the deployable static site (version 2 of the viewer) into dist/.
//
//   dist/index.html                 the page, from site/index.template.html
//   dist/assets/app.<hash>.js       validation data + the kept set's tables (NH3's bands, NH5's gallery, where out/ has them)
//                                   + core/core.js + core/scenarios.js + motion, encounter, systems, night
//                                   + core/readers/*.js + site/topsides.js + site/visuals.js + site/app.js + site/parts/*.js
//                                   (the readers and the parts are optional modules, each folder in name order)
//   dist/assets/forecast-worker.<hash>.js   core/core.js + motion, encounter, systems, night + core/readers/*.js
//                                   + site/worker-glue.js
//   dist/assets/styles.<hash>.css   site/styles.css + site/parts/*.css
//   dist/assets/rooms.<hash>.json   her rooms from data/rooms/*_deck.json, slim (NH2's cabin view fetches it when it opens)
//   dist/assets/three.r128.min.js   three.js r128 from node_modules (MIT)
//   dist/fonts/*.woff2              the three font families from @fontsource (OFL)
//   dist/icons/*, og.png, manifest.webmanifest, robots.txt, 404.html, _headers, version.json
//
// The public page's address is package.json's "homepage", and only there. The build writes it into dist/version.json
// ("home") and into the page's head (@@HOME@@ in site/index.template.html: the canonical link, og:url, and the social
// image's absolute address).
// The physics is untouched: core/core.js and core/scenarios.js are concatenated as they are.
// Usage: node tools/build_site.js            (SITE_ORIGIN=https://example.com/ puts the social image at another origin
//                                             than the homepage's)
//        node tools/build_site.js --check    writes nothing: exit 0 when dist/ is the build of the sources as they stand
//                                            (tools/gate.js runs it before the browser suites, which test dist/)
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const site = path.join(root, 'site');
const dist = path.join(root, 'dist');
const CHECK = process.argv.includes('--check');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const hash = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 10);
const guard = (s, name) => { if (/<\/script/i.test(s)) throw new Error(name + ' contains </script'); return s; };

const pkg = JSON.parse(read('package.json'));
// the public page's address, from package.json's "homepage", always ending in '/' (the page is reached there)
const home = (() => {
  const h = String(pkg.homepage || '').trim();
  if (!/^https?:\/\/[^\s"'<>&]+$/.test(h)) throw new Error('package.json\'s "homepage" must be the public page\'s address (https://...): it is ' + JSON.stringify(pkg.homepage));
  return h.endsWith('/') ? h : h + '/';
})();
let commit = 'nogit';
try { commit = execSync('git rev-parse --short HEAD', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { /* no git */ }
// the build's date is part of the page and of the app bundle (its version line), so a check uses the date dist/ was built on
let have = null;
try { have = JSON.parse(fs.readFileSync(path.join(dist, 'version.json'), 'utf8')); } catch (e) { /* no dist yet */ }
if (CHECK && !have) { console.log('STALE: dist/version.json is missing\nrun: node tools/build_site.js'); process.exit(1); }
const built = CHECK ? have.built : new Date().toISOString();
const version = `${pkg.version} (${built.slice(0, 10)})`;
const origin = process.env.SITE_ORIGIN ? process.env.SITE_ORIGIN.replace(/\/?$/, '/') : home;   // where the social image is: the homepage's, unless SITE_ORIGIN says otherwise

// Vendored files: three.js and the fonts come from node_modules after `npm install`. Without node_modules the copies
// already in dist/ (they are committed) are kept, so the site can be rebuilt on a machine with only Node.
const fonts = [
  ['ibm-plex-sans-condensed', ['latin-400-normal', 'latin-500-normal', 'latin-600-normal']],
  ['ibm-plex-mono', ['latin-400-normal', 'latin-500-normal']],
  ['cormorant-garamond', ['latin-600-italic']],
];
const vendored = [];                              // [path under dist, Buffer]
{
  const nm = path.join(root, 'node_modules');
  const want = [['assets/three.r128.min.js', path.join(nm, 'three', 'build', 'three.min.js')]];
  for (const [fam, variants] of fonts) {
    for (const v of variants) want.push([`fonts/${fam}-${v}.woff2`, path.join(nm, '@fontsource', fam, 'files', `${fam}-${v}.woff2`)]);
    want.push([`fonts/LICENSE-${fam}.txt`, path.join(nm, '@fontsource', fam, 'LICENSE')]);
  }
  let kept = 0;
  for (const [rel, src] of want) {
    const fromDist = path.join(dist, rel);
    if (fs.existsSync(src)) vendored.push([rel, fs.readFileSync(src)]);
    else if (fs.existsSync(fromDist)) { vendored.push([rel, fs.readFileSync(fromDist)]); kept++; }
    else throw new Error('missing ' + rel + ': run npm install (it is neither in node_modules nor in dist/)');
  }
  if (kept && !CHECK) console.log(`no node_modules: kept ${kept} vendored file(s) from the existing dist/`);
}

// bundles
const core = guard(read('core/core.js'), 'core');
const scen = guard(read('core/scenarios.js'), 'scenarios');
// readers: modules in core/readers/ that read the night and keep a state of their own beside it (core/night.js,
// "readers"); bundled in name order after the watch, into the page and into the forecast worker alike
const readerNames = (() => { const d = path.join(root, 'core', 'readers'); return fs.existsSync(d) ? fs.readdirSync(d).filter(f => f.endsWith('.js')).sort().map(f => 'core/readers/' + f) : []; })();
const under = ['core/motion.js', 'core/encounter.js', 'core/systems.js', 'core/night.js'].concat(readerNames).map(f => guard(read(f), f)).join('\n');   // the ship under way, the ice, her machinery, the watch, its readers
// parts: optional viewer modules in site/parts/, bundled in name order after site/app.js, which they hook through
// TitanicApp.on (see "parts" in site/app.js); a stylesheet in that folder is appended to the page's styles the same way.
// With the folder empty or absent the bundle is site/topsides.js, site/visuals.js and site/app.js alone.
const partNames = (ext) => { const d = path.join(site, 'parts'); return fs.existsSync(d) ? fs.readdirSync(d).filter(f => f.endsWith(ext)).sort() : []; };
const partsJs = partNames('.js').map(f => guard(read('site/parts/' + f), 'parts/' + f));
const partsCss = partNames('.css').map(f => read('site/parts/' + f));
// the kept set's tables, inlined as the validation table is (each about 20 KB): NH3's bands (out/ensemble_1912.json,
// tools/ensemble.js) as window.TitanicEnsemble, and NH5's gallery (out/gallery_1912.json, tools/gallery.js) as
// window.TitanicGallery without its runs member by member and its ice (the page shows the tables and their words). Where a
// table is not in out/ its name is null, and the page shows the run alone
const kept = (() => {
  const opt = (p) => (fs.existsSync(path.join(root, p)) ? JSON.parse(read(p)) : null);
  const ens = opt('out/ensemble_1912.json'), gal = opt('out/gallery_1912.json');
  if (gal) { delete gal.ice; if (gal.baseline) delete gal.baseline.runs; for (const c of gal.cards || []) delete c.runs; }
  return `window.TitanicEnsemble = ${JSON.stringify(ens)};\nwindow.TitanicGallery = ${JSON.stringify(gal)};`;
})();
const app = [kept, guard(read('site/topsides.js'), 'topsides'), guard(read('site/visuals.js'), 'visuals'), guard(read('site/app.js'), 'app')].concat(partsJs).join('\n');   // the kept set's tables, her topsides' numbers, the shapes the viewer draws, the viewer, its parts
const val = JSON.stringify(JSON.parse(read('out/validation.json')));
const workerSrc = core + '\n' + under + '\n' + read('site/worker-glue.js');
const workerName = `forecast-worker.${hash(workerSrc)}.js`;
// her rooms for NH2's cabin view (site/parts/79_cabins.js): R3's deck tables, slim, and after them the lists of the
// people in her staterooms (tools/rooms_asset.js says what it carries). Named by its content and fetched when the view
// first opens (window.TitanicRoomsURL): the first load does not carry it. No second copy is tracked: it is made here
// from the tables
const roomsSrc = require('./rooms_asset').roomsAsset(root);
const roomsName = `rooms.${hash(roomsSrc)}.json`;
const appSrc = `window.TitanicValidation = ${val};\nwindow.TitanicWorkerURL = 'assets/${workerName}';\nwindow.TitanicRoomsURL = 'assets/${roomsName}';\nwindow.TitanicSiteVersion = ${JSON.stringify(version)};\n` + core + '\n' + scen + '\n' + under + '\n' + app;
const appName = `app.${hash(appSrc)}.js`;
const css = [read('site/styles.css')].concat(partsCss).join('\n');
const cssName = `styles.${hash(css)}.css`;
const statics = fs.readdirSync(path.join(site, 'icons')).map(f => 'icons/' + f).concat(['og.png', 'manifest.webmanifest', 'robots.txt', '404.html', '_headers']);

if (CHECK) {
  // the three bundles are named by their content, so their names say whether dist/ is these sources; the page must
  // name them, and the files copied as they are must be the same bytes
  const stale = [];
  for (const [what, want, got] of [['the app', appName, have.app], ['the forecast worker', workerName, have.worker], ['the styles', cssName, have.styles]]) {
    if (want !== got) stale.push(`${what}: dist/ has ${got}, the sources give ${want}`);
    else if (!fs.existsSync(path.join(dist, 'assets', want))) stale.push(`${what}: dist/assets/${want} is missing`);
  }
  // her rooms' asset: the app names it (its name is in the app's own source, so a changed table changes the app's name too)
  { const p = path.join(dist, 'assets', roomsName); if (!fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== roomsSrc) stale.push(`her rooms: dist/assets/${roomsName} is missing or not these tables`); }
  let page = ''; try { page = fs.readFileSync(path.join(dist, 'index.html'), 'utf8'); } catch (e) { stale.push('dist/index.html is missing'); }
  if (page) for (const n of [appName, cssName, 'three.r128.min.js']) if (!page.includes('assets/' + n)) stale.push('dist/index.html does not name ' + n);
  // the public address the build wrote (version.json and the page's head are written by the same run)
  if (have.home !== home) stale.push(`the public address: dist/version.json has ${have.home || 'none'}, package.json's homepage is ${home}`);
  for (const f of statics) {
    const a = fs.readFileSync(path.join(site, f)), p = path.join(dist, f);
    if (!fs.existsSync(p) || !a.equals(fs.readFileSync(p))) stale.push('dist/' + f + ' is not site/' + f);
  }
  console.log(stale.length ? 'STALE: ' + stale.join('; ') + '\nrun: node tools/build_site.js'
    : `PASS: dist/ is the build of these sources (${appName}, ${workerName}, ${cssName}; built ${have.built.slice(0, 16).replace('T', ' ')} UTC at ${have.builtFromCommit})`);
  process.exit(stale.length ? 1 : 0);
}

// clean dist/ (only ever the build output)
fs.rmSync(dist, { recursive: true, force: true });
for (const d of ['assets', 'fonts', 'icons']) fs.mkdirSync(path.join(dist, d), { recursive: true });
for (const [rel, buf] of vendored) fs.writeFileSync(path.join(dist, rel), buf);
fs.writeFileSync(path.join(dist, 'assets', workerName), workerSrc);
fs.writeFileSync(path.join(dist, 'assets', appName), appSrc);
fs.writeFileSync(path.join(dist, 'assets', roomsName), roomsSrc);
fs.writeFileSync(path.join(dist, 'assets', cssName), css);

// static files
for (const f of statics) fs.copyFileSync(path.join(site, f), path.join(dist, f));

// the page
let html = read('site/index.template.html');
html = html.replace(/@@APP@@/g, 'assets/' + appName).replace(/@@WORKER@@/g, 'assets/' + workerName)
  .replace(/@@STYLES@@/g, 'assets/' + cssName).replace(/@@THREE@@/g, 'assets/three.r128.min.js')
  .replace(/@@VERSION@@/g, version).replace(/@@ORIGIN@@/g, origin).replace(/@@HOME@@/g, home);
fs.writeFileSync(path.join(dist, 'index.html'), html);
// builtFromCommit is the commit checked out when the build ran. A build made before its sources were committed names
// the commit before them: sourcesCommitted says whether every bundled source was as that commit has it.
let sourcesCommitted = null;
try { sourcesCommitted = execSync('git status --porcelain -- core site data/rooms out/validation.json package.json', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() === ''; } catch (e) { /* no git */ }
fs.writeFileSync(path.join(dist, 'version.json'), JSON.stringify({ version: pkg.version, built, builtFromCommit: commit, sourcesCommitted, app: appName, worker: workerName, styles: cssName, rooms: roomsName, home }, null, 2) + '\n');

const total = (() => { let n = 0; const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); const st = fs.statSync(p); if (st.isDirectory()) walk(p); else n += st.size; } }; walk(dist); return n; })();
console.log(`built dist/ for ${version}: ${appName} (${(appSrc.length / 1024).toFixed(0)} KB), ${workerName}, ${cssName}; ${(total / 1024).toFixed(0)} KB in total; the public address ${home}${process.env.SITE_ORIGIN ? ', the social image at ' + origin + ' (SITE_ORIGIN)' : ''}`);
