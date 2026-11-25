// The app's runtime packages: package.json's "dependencies" (Anthropic's SDK, for the crew's minds) and what they need,
// as package-lock.json pins them. One place for tools/package_app.js, which copies them into the app, and
// tools/app_test.js, which holds the copies: which packages they are, whether this checkout has them installed as
// pinned, which npm command installs them here, and a digest of a package's files.
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');

const lockOf = (root) => { try { return JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8')).packages || {}; } catch (e) { return {}; } };
const jsonOf = (file) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return null; } };
const versionOf = (dir) => { const j = jsonOf(path.join(dir, 'package.json')); return (j && j.version) || null; };

// the lock's keys ("node_modules/<name>") of the packages the app needs at run time, sorted
function runtime(root) { const lock = lockOf(root); return Object.keys(lock).filter(k => k.startsWith('node_modules/') && !lock[k].dev && !lock[k].devOptional).sort(); }

// what is not as pinned in this checkout: a dependency whose pin the lock does not hold, a package not installed, or
// installed at another version. Empty: every one is there as pinned
function wrong(root) {
  const pkg = jsonOf(path.join(root, 'package.json')) || {}, lock = lockOf(root), out = [];
  for (const d of Object.keys(pkg.dependencies || {})) { const l = lock['node_modules/' + d]; if (!l || l.version !== pkg.dependencies[d]) out.push(`${d}: package.json pins ${pkg.dependencies[d]}, package-lock.json has ${l ? l.version : 'nothing'}`); }
  for (const k of runtime(root)) { const v = versionOf(path.join(root, k)); if (v !== lock[k].version) out.push(`${k}: pinned ${lock[k].version}, installed ${v || 'nothing'}`); }
  return out;
}

// The npm command that installs them in THIS checkout, with its reason. It depends on the checkout:
//   - one that has the development packages (after a plain npm install) must not be given --omit=dev, which takes them
//     off the disk: playwright among them, which tools/shot.js, site_test.js and make_assets.js need (the app lane's
//     review, A2);
//   - one kept without them (the join's and the lanes': the site's build then keeps its vendored three.js and fonts
//     from dist/) must be given it, or npm installs every development package too, and the site's build starts reading
//     three.js and the fonts from node_modules.
// Either way --ignore-scripts: no package's install script is run. npm downloads from its registry; the packager
// itself downloads nothing.
function advice(root) {
  const dev = Object.keys((jsonOf(path.join(root, 'package.json')) || {}).devDependencies || {});
  const hasDev = dev.some(d => fs.existsSync(path.join(root, 'node_modules', d, 'package.json')));
  return hasDev ? { hasDev, cmd: 'npm install --ignore-scripts', why: 'this checkout has the development packages: not --omit=dev, which would take them off the disk' }
    : { hasDev, cmd: 'npm install --omit=dev --ignore-scripts', why: 'this checkout has no development packages: only the app\'s runtime packages are added, and the site\'s build keeps its vendored files' };
}

// every file under a folder, as paths from it with forward slashes, sorted by code unit (the same order on every PC)
function filesOf(dir) {
  const out = [];
  const walk = (d, rel) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const r = rel ? rel + '/' + e.name : e.name; if (e.isDirectory()) walk(path.join(d, e.name), r); else if (e.isFile()) out.push(r); } };
  walk(dir, '');
  return out.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}
// a digest of a package's files: each file's path, its size and its bytes, in the order of the paths. null: no folder
function digest(dir) {
  if (!fs.existsSync(dir)) return null;
  const h = crypto.createHash('sha256'); let files = 0, bytes = 0;
  for (const f of filesOf(dir)) { const b = fs.readFileSync(path.join(dir, f)); h.update(f + '\0' + b.length + '\0'); h.update(b); files++; bytes += b.length; }
  return { sha256: h.digest('hex'), files, bytes };
}

module.exports = { lockOf, runtime, wrong, advice, versionOf, filesOf, digest };
