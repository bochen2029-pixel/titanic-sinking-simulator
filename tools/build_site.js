// build_site.js: assemble the deployable static site (version 2 of the viewer) into dist/.
//
//   dist/index.html                 the page, from site/index.template.html
//   dist/assets/app.<hash>.js       validation data + core/core.js + core/scenarios.js + site/app.js
//   dist/assets/forecast-worker.<hash>.js   core/core.js + site/worker-glue.js
//   dist/assets/styles.<hash>.css   site/styles.css
//   dist/assets/three.r128.min.js   three.js r128 from node_modules (MIT)
//   dist/fonts/*.woff2              the three font families from @fontsource (OFL)
//   dist/icons/*, og.png, manifest.webmanifest, robots.txt, 404.html, _headers, version.json
//
// The physics is untouched: core/core.js and core/scenarios.js are concatenated as they are.
// Usage: node tools/build_site.js            (SITE_ORIGIN=https://example.com for absolute social-image URLs)
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const site = path.join(root, 'site');
const dist = path.join(root, 'dist');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const hash = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 10);
const guard = (s, name) => { if (/<\/script/i.test(s)) throw new Error(name + ' contains </script'); return s; };

const pkg = JSON.parse(read('package.json'));
let commit = 'nogit';
try { commit = execSync('git rev-parse --short HEAD', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { /* no git */ }
const built = new Date().toISOString();
const version = `${pkg.version} (${built.slice(0, 10)})`;
const origin = (process.env.SITE_ORIGIN || '').replace(/\/?$/, (m) => (process.env.SITE_ORIGIN ? '/' : ''));

// clean dist/ (only ever the build output)
fs.rmSync(dist, { recursive: true, force: true });
for (const d of ['assets', 'fonts', 'icons']) fs.mkdirSync(path.join(dist, d), { recursive: true });

// bundles
const core = guard(read('core/core.js'), 'core');
const scen = guard(read('core/scenarios.js'), 'scenarios');
const app = guard(read('site/app.js'), 'app');
const val = JSON.stringify(JSON.parse(read('out/validation.json')));
const workerSrc = core + '\n' + read('site/worker-glue.js');
const workerName = `forecast-worker.${hash(workerSrc)}.js`;
const appSrc = `window.TitanicValidation = ${val};\nwindow.TitanicWorkerURL = 'assets/${workerName}';\nwindow.TitanicSiteVersion = ${JSON.stringify(version)};\n` + core + '\n' + scen + '\n' + app;
const appName = `app.${hash(appSrc)}.js`;
const css = read('site/styles.css');
const cssName = `styles.${hash(css)}.css`;
fs.writeFileSync(path.join(dist, 'assets', workerName), workerSrc);
fs.writeFileSync(path.join(dist, 'assets', appName), appSrc);
fs.writeFileSync(path.join(dist, 'assets', cssName), css);
fs.copyFileSync(path.join(root, 'node_modules', 'three', 'build', 'three.min.js'), path.join(dist, 'assets', 'three.r128.min.js'));

// fonts (latin subsets only)
const fonts = [
  ['ibm-plex-sans-condensed', ['latin-400-normal', 'latin-500-normal', 'latin-600-normal']],
  ['ibm-plex-mono', ['latin-400-normal', 'latin-500-normal']],
  ['cormorant-garamond', ['latin-600-italic']],
];
for (const [fam, variants] of fonts) {
  for (const v of variants) {
    const f = `${fam}-${v}.woff2`;
    fs.copyFileSync(path.join(root, 'node_modules', '@fontsource', fam, 'files', f), path.join(dist, 'fonts', f));
  }
  fs.copyFileSync(path.join(root, 'node_modules', '@fontsource', fam, 'LICENSE'), path.join(dist, 'fonts', `LICENSE-${fam}.txt`));
}

// static files
for (const f of fs.readdirSync(path.join(site, 'icons'))) fs.copyFileSync(path.join(site, 'icons', f), path.join(dist, 'icons', f));
for (const f of ['og.png', 'manifest.webmanifest', 'robots.txt', '404.html', '_headers']) fs.copyFileSync(path.join(site, f), path.join(dist, f));

// the page
let html = read('site/index.template.html');
html = html.replace(/@@APP@@/g, 'assets/' + appName).replace(/@@WORKER@@/g, 'assets/' + workerName)
  .replace(/@@STYLES@@/g, 'assets/' + cssName).replace(/@@THREE@@/g, 'assets/three.r128.min.js')
  .replace(/@@VERSION@@/g, version).replace(/@@ORIGIN@@/g, origin);
fs.writeFileSync(path.join(dist, 'index.html'), html);
fs.writeFileSync(path.join(dist, 'version.json'), JSON.stringify({ version: pkg.version, built, builtFromCommit: commit, app: appName, worker: workerName, styles: cssName }, null, 2) + '\n');

const total = (() => { let n = 0; const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); const st = fs.statSync(p); if (st.isDirectory()) walk(p); else n += st.size; } }; walk(dist); return n; })();
console.log(`built dist/ for ${version}: ${appName} (${(appSrc.length / 1024).toFixed(0)} KB), ${workerName}, ${cssName}; ${(total / 1024).toFixed(0)} KB in total`);
