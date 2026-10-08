// mount.js: install the built site (dist/) under a sub-path of another static site, for example as
// one page of a larger site, where the page is reached at <prefix>/<dir>/ (trailing slash).
//
// Copies dist/ except the root-only files (_headers, robots.txt, 404.html), which only mean something
// at a site root; every URL in the page and the stylesheet is relative, so nothing else needs
// rewriting. Optionally appends a home link to the page footer and sets the page title.
// Refuses to replace a target directory it did not create itself (it marks its own with
// "mounted" in version.json).
//
// Usage: node tools/mount.js --into <dir> [--home-href /games/ --home-text "All the games"] [--title "..."]
'use strict';
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const into = opt('--into');
if (!into) { console.error('usage: node tools/mount.js --into <dir> [--home-href URL --home-text TEXT] [--title TITLE]'); process.exit(2); }
const homeHref = opt('--home-href'), homeText = opt('--home-text', 'Home'), title = opt('--title');
const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
if (!fs.existsSync(path.join(dist, 'index.html'))) { console.error('dist/index.html missing: run node tools/build_site.js first'); process.exit(2); }

const target = path.resolve(into);
if (fs.existsSync(target)) {
  let mine = false;
  try { mine = JSON.parse(fs.readFileSync(path.join(target, 'version.json'), 'utf8')).mounted === true; } catch (e) { /* not ours */ }
  if (!mine) { console.error(`${target} exists and was not created by mount.js; refusing to replace it`); process.exit(1); }
  fs.rmSync(target, { recursive: true, force: true });
}
const SKIP = new Set(['_headers', 'robots.txt', '404.html']);
let files = 0, bytes = 0;
function copy(src, dst) {
  for (const f of fs.readdirSync(src)) {
    if (SKIP.has(f)) continue;
    const s = path.join(src, f), d = path.join(dst, f), st = fs.statSync(s);
    if (st.isDirectory()) { fs.mkdirSync(d, { recursive: true }); copy(s, d); }
    else { fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(s, d); files++; bytes += st.size; }
  }
}
copy(dist, target);

let html = fs.readFileSync(path.join(target, 'index.html'), 'utf8');
if (title) html = html.replace(/<title>[^<]*<\/title>/, `<title>${title.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</title>`);
if (homeHref) {
  const link = ` · <a href="${homeHref}">${homeText.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</a>`;
  const marker = '· MIT</div>';
  if (!html.includes(marker)) { console.error('footer marker not found in index.html; the template changed'); process.exit(1); }
  html = html.replace(marker, '· MIT' + link + '</div>');
}
fs.writeFileSync(path.join(target, 'index.html'), html);
const v = JSON.parse(fs.readFileSync(path.join(target, 'version.json'), 'utf8'));
v.mounted = true; v.mountedAt = new Date().toISOString();
fs.writeFileSync(path.join(target, 'version.json'), JSON.stringify(v, null, 2) + '\n');
console.log(`mounted dist/ at ${target}: ${files} files, ${(bytes / 1024).toFixed(0)} KB${homeHref ? `, home link to ${homeHref}` : ''}`);
