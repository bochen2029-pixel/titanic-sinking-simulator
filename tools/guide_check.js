// guide_check.js: the guard that keeps the User Guide and the simulator in step. One PASS or FAIL line per check, one
// line per fault under a failing check, and a verdict line at the end; exit code 1 on any fault.
//   node tools/guide_check.js              the checks (about ten seconds; needs headless Edge or Chrome for the fit)
//   node tools/guide_check.js --pages DIR  also save every page of the PDF as a PNG in DIR, through the browser's own
//                                          PDF viewer, to look at them
// It fails when:
//   - the HTML or the PDF is missing, or older than its sources (a source changed since the build, a chapter or a
//     picture came or went, a file the build looked for and did not find is here now, or the PDF is not the one printed
//     from this HTML). Age is judged by content, not by file times: the build records the SHA-256 of every input, the
//     files it found absent, and the SHA-256 of the PDF in the HTML;
//   - the pictures were taken from another build of the site than the dist/ that is here;
//   - a control the guide names as a chip ({{Label}}) or screen text ({{:Label}}) is not a visible label in the built
//     page (dist/index.html) nor a string of the app's own code; or a key cap ([[K]]) is not a key the page names;
//   - a picture the guide references is missing, or a file in docs/guide/img/ is unused;
//   - a figure or a table is wider or taller than the printable page (measured in headless Edge, print media emulated,
//     at the width and height of the page's printable area; a long table, which may break across pages, by its rows);
//   - the page count is outside the range in docs/guide/src/guide.json, or the contents page disagrees with the PDF;
//   - the pictures or the PDF are over their size budgets (guide.json).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const G = require('./build_guide.js');
const B = require('./cdp');

const root = path.join(__dirname, '..');
const guide = path.join(root, 'docs', 'guide');
const rel = (p) => path.relative(root, p).replace(/\\/g, '/');
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const args = process.argv.slice(2);
const pagesDir = args.indexOf('--pages') >= 0 ? path.resolve(args[args.indexOf('--pages') + 1] || 'guide-pages') : null;

const results = [];
function check(name, faults, ok) {
  results.push({ name, faults });
  console.log((faults.length ? 'FAIL ' : 'PASS ') + name + (faults.length ? '' : (ok ? ': ' + ok : '')));
  for (const f of faults) console.log('     ' + f);
}
const conf = JSON.parse(fs.readFileSync(path.join(guide, 'src', 'guide.json'), 'utf8'));
const htmlFile = path.join(guide, conf.file + '.html'), pdfFile = path.join(guide, conf.file + '.pdf');
const decode = (s) => s.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(+d)).replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&amp;/g, '&');
const norm = (s) => decode(s).replace(/\s+/g, ' ').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").trim();

// ------------------------------------------------------------------ what the chapters name
function chapterNames() {
  const out = { chips: [], keys: [], images: [] };
  for (const f of G.chapterFiles()) {
    const lines = fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n').split('\n');
    let inComment = false;
    lines.forEach((raw, i) => {
      let l = raw;
      if (inComment) { const e = l.indexOf('-->'); if (e < 0) return; l = l.slice(e + 3); inComment = false; }
      l = l.replace(/<!--[\s\S]*?-->/g, '');
      const s = l.indexOf('<!--'); if (s >= 0) { l = l.slice(0, s); inComment = true; }
      l = l.replace(/`[^`]*`/g, '');                      // code is not a control
      const at = `${f}:${i + 1}`;
      for (const m of l.matchAll(/\{\{(:?)([^}]+)\}\}/g)) out.chips.push({ text: m[2].trim(), ui: !!m[1], at });
      for (const m of l.matchAll(/\[\[([^\]]+)\]\]/g)) out.keys.push({ text: m[1].trim(), at });
      for (const m of l.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)) out.images.push({ src: m[1], at });
    });
  }
  return out;
}

// ------------------------------------------------------------------ what the page shows and the app says
function pageLabels() {
  const v = JSON.parse(fs.readFileSync(path.join(root, 'dist', 'version.json'), 'utf8'));
  const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
  const body = html.replace(/<head>[\s\S]*?<\/head>/i, '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript>[\s\S]*?<\/noscript>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
  const labels = new Set(), hints = [];
  for (const piece of body.split(/<[^>]+>/)) {
    const t = norm(piece); if (!t) continue;
    labels.add(t);
    // a long label is named by its leading words: "Sound: the lookout's bell, ..." is the box "Sound"
    const lead = t.split(/:\s| \(/)[0].trim(); if (lead && lead !== t) labels.add(lead);
  }
  for (const m of body.matchAll(/class="[^"]*kbd-hint[^"]*"[^>]*>([^<]*)</g)) hints.push(norm(m[1]));
  // the app's own strings: the literals of its code, whole (template literals by their fixed parts)
  const app = fs.readFileSync(path.join(root, 'dist', 'assets', v.app), 'utf8');
  const strings = new Set();
  // (a long label is named by its leading words here too: "As the bridge knew it: cover what ..." is the box "As the
  // bridge knew it")
  const addString = (raw) => { const s = norm(raw); if (!/[A-Za-z]/.test(s)) return; strings.add(s); const lead = s.split(/:\s| \(/)[0].trim(); if (lead && lead !== s) strings.add(lead); };
  // (an empty literal is matched too, so that '' does not throw the reading of the quotes after it out of step)
  for (const m of app.matchAll(/'((?:[^'\\\n]|\\.){0,240})'|"((?:[^"\\\n]|\\.){0,240})"/g)) addString((m[1] !== undefined ? m[1] : m[2]).replace(/\\(['"\\])/g, '$1'));
  for (const m of app.matchAll(/`((?:[^`\\]|\\.){1,240})`/g)) for (const part of m[1].split(/\$\{[^}]*\}/)) addString(part);
  // the keys the page names in its hints, and the keys its code listens for
  const keyTokens = new Set(hints.join(' ').split(/[\s,.;:]+/).filter(Boolean));
  const keyCodes = new Set([...app.matchAll(/(?:e\.key|e\.code|\bk)\s*===\s*'([^']+)'/g)].map(m => m[1]));
  return { labels, strings, keyTokens, keyCodes, version: v };
}

// ------------------------------------------------------------------ the checks
(async () => {
  // 1. the outputs are there
  const missing = [htmlFile, pdfFile].filter(f => !fs.existsSync(f)).map(f => `${rel(f)} is missing: run node tools/build_guide.js`);
  check('the HTML and the PDF are there', missing, `${rel(htmlFile)}, ${rel(pdfFile)}`);

  // 2. they are as new as their sources, judged by content
  let rec = null;
  {
    const faults = [];
    if (!missing.length) {
      const html = fs.readFileSync(htmlFile, 'utf8');
      const m = /<script type="application\/json" id="guide-build">([\s\S]*?)<\/script>/.exec(html);
      if (!m) faults.push(`${rel(htmlFile)} carries no build record: rebuild it with node tools/build_guide.js`);
      else {
        rec = JSON.parse(m[1]);
        for (const [f, h] of Object.entries(rec.inputs)) {
          if (!fs.existsSync(path.join(root, f))) faults.push(`${f} is gone since the build: rebuild the guide`);
          else if (sha(fs.readFileSync(path.join(root, f))) !== h) faults.push(`${f} changed since the guide was built: run node tools/build_guide.js`);
        }
        // an input the build looked for and did not find (the search's result, before it is merged) makes the guide stale
        // once it is there
        for (const f of rec.absent || []) if (fs.existsSync(path.join(root, f))) faults.push(`${f} is here now, and was not when the guide was built: run node tools/build_guide.js`);
        const now = G.chapterFiles().concat(['docs/guide/src/guide.json']);
        for (const f of now) if (!rec.inputs[f]) faults.push(`${f} is newer than the guide (not in its build): run node tools/build_guide.js`);
        if (!rec.pdf) faults.push(`${rel(htmlFile)} was built without its PDF (--html): run node tools/build_guide.js`);
        else if (fs.existsSync(pdfFile) && sha(fs.readFileSync(pdfFile)) !== rec.pdf) faults.push(`${rel(pdfFile)} is not the PDF printed from this HTML: run node tools/build_guide.js`);
      }
    }
    check('the guide is as new as its sources (content hashes)', faults, rec ? `${Object.keys(rec.inputs).length} inputs unchanged${(rec.absent || []).length ? `, ${rec.absent.length} still absent (${rec.absent.join(', ')})` : ''}, the PDF is the one printed from the HTML` : '');
  }

  // 3. the pictures come from the dist/ that is here
  const P = pageLabels();
  {
    const faults = [], shots = path.join(guide, 'shots.json');
    if (!fs.existsSync(shots)) faults.push('docs/guide/shots.json is missing: run node tools/guide_shots.js');
    else {
      const s = JSON.parse(fs.readFileSync(shots, 'utf8'));
      if (s.site.app !== P.version.app) faults.push(`the pictures were taken from ${s.site.app}, but dist/ now holds ${P.version.app}: run node tools/guide_shots.js, then node tools/build_guide.js`);
      for (const [f, im] of Object.entries(s.images || {})) {
        const p = path.join(guide, 'img', f);
        if (fs.existsSync(p) && sha(fs.readFileSync(p)) !== im.sha256) faults.push(`docs/guide/img/${f} is not the picture tools/guide_shots.js took: retake the pictures`);
      }
    }
    check('the pictures were taken from this build of the site', faults, `${P.version.app} (site ${P.version.version})`);
  }

  // 4. every control and screen text the guide names is on the screen or in the app's strings
  const N = chapterNames();
  {
    const faults = [];
    for (const c of N.chips) if (!P.labels.has(norm(c.text)) && !P.strings.has(norm(c.text))) faults.push(`${c.at}: "${c.text}" is not a label in dist/index.html nor a string of ${P.version.app}`);
    const n = new Set(N.chips.map(c => c.text)).size;
    check('the controls the guide names are on the screen', faults, `${N.chips.length} names, ${n} different, all found`);
  }
  {
    const arrows = { '←': 'ArrowLeft', '→': 'ArrowRight', '↑': 'ArrowUp', '↓': 'ArrowDown' };
    const faults = [];
    for (const k of N.keys) {
      const c = [k.text, k.text.toLowerCase(), arrows[k.text]].filter(Boolean);
      if (!c.some(x => P.keyTokens.has(x) || P.keyCodes.has(x))) faults.push(`${k.at}: the key [[${k.text}]] is neither in the page's key hints nor one its code listens for`);
    }
    check('the keys the guide names are the page\'s keys', faults, `${N.keys.length} key caps, ${new Set(N.keys.map(k => k.text)).size} keys`);
  }

  // 5. pictures: none missing, none unused
  {
    const faults = [], dir = path.join(guide, 'img');
    const used = new Set(N.images.map(i => path.normalize(i.src)));
    for (const i of N.images) if (!fs.existsSync(path.join(guide, i.src))) faults.push(`${i.at}: the picture ${i.src} is missing`);
    const files = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
    for (const f of files) if (!used.has(path.normalize('img/' + f))) faults.push(`docs/guide/img/${f} is not used by any chapter: remove it, or show it`);
    check('every picture referenced is there, and every picture there is used', faults, `${used.size} pictures`);
  }

  // 6. the facts are all filled in
  if (!missing.length) {
    const html = fs.readFileSync(htmlFile, 'utf8').replace(/<script type="application\/json"[\s\S]*?<\/script>/, '').replace(/<style>[\s\S]*?<\/style>/, '');
    const faults = [];
    for (const m of html.matchAll(/@@[A-Za-z0-9_.-]+@@|\{\{[^}]*\}\}|\[\[[^\]]*\]\]/g)) faults.push(`left in the HTML as written: ${m[0]}`);
    check('no fact, chip or key cap left unconverted', faults.slice(0, 20), 'none');
  }

  // 7. every figure and table fits the printable page, measured in the browser with print media
  let browserOk = true;
  if (!missing.length) {
    const css = fs.readFileSync(path.join(guide, 'template', 'guide.css'), 'utf8');
    const pm = /@page\s*\{[^}]*?margin:\s*([\d.]+)in\s+([\d.]+)in\s+([\d.]+)in\s+([\d.]+)in/.exec(css);
    const [mt, mr, mb, ml] = pm ? pm.slice(1).map(Number) : [0.75, 0.8, 0.8, 0.8];
    const pw = (8.5 - ml - mr) * 96, ph = (11 - mt - mb) * 96;
    const faults = [];
    let n = 0, widest = 0;
    try {
      const r = await measure(htmlFile, pw, ph);
      n = r.items.length; widest = r.docWidth;
      for (const it of r.items) {
        if (!it.loaded) faults.push(`${it.name}: the picture did not load`);
        if (it.w > pw + 1) faults.push(`${it.name} is ${(it.w / 96).toFixed(2)} in wide; the page has ${(pw / 96).toFixed(2)} in`);
        if (it.h > ph + 1) faults.push(`${it.name} is ${(it.h / 96).toFixed(2)} in tall; the page has ${(ph / 96).toFixed(2)} in`);
        if (it.overflow > 1) faults.push(`${it.name}: its content runs ${(it.overflow / 96).toFixed(2)} in past its own edge`);
      }
      if (r.docWidth > pw + 1) faults.push(`something on the page is ${(r.docWidth / 96).toFixed(2)} in wide (${r.widest}); the page has ${(pw / 96).toFixed(2)} in`);
    } catch (e) { browserOk = false; faults.push('could not measure in the browser: ' + e.message); }
    check('every figure and table fits the printable page (print media, ' + (pw / 96).toFixed(2) + ' x ' + (ph / 96).toFixed(2) + ' in)', faults, `${n} figures and tables measured; the widest thing ${(widest / 96).toFixed(2)} in`);
  }

  // 8. the page count, and the contents page against the PDF
  let info = null;
  if (fs.existsSync(pdfFile)) {
    const faults = [];
    try {
      info = G.pdfInfo(fs.readFileSync(pdfFile));
      const [lo, hi] = conf.pages || [8, 80];
      if (info.pages < lo || info.pages > hi) faults.push(`the PDF has ${info.pages} pages; guide.json expects ${lo} to ${hi}`);
      if (rec) for (const c of rec.chapters) if (info.dests[c.id] !== c.page) faults.push(`the contents page gives chapter ${c.id.slice(2)} page ${c.page}; in the PDF it starts on page ${info.dests[c.id]}`);
    } catch (e) { faults.push('the PDF could not be read: ' + e.message); }
    check('the page count is in range, and the contents page agrees with the PDF', faults, info ? `${info.pages} pages (${(conf.pages || []).join(' to ')})` : '');
  }

  // 9. size budgets
  {
    const faults = [], dir = path.join(guide, 'img');
    const imgBytes = fs.existsSync(dir) ? fs.readdirSync(dir).reduce((a, f) => a + fs.statSync(path.join(dir, f)).size, 0) : 0;
    const pdfBytes = fs.existsSync(pdfFile) ? fs.statSync(pdfFile).size : 0;
    const MB = 1024 * 1024;
    if (imgBytes > (conf.budgetImgMB || 4) * MB) faults.push(`docs/guide/img/ holds ${(imgBytes / MB).toFixed(2)} MB; the budget is ${conf.budgetImgMB || 4} MB`);
    if (pdfBytes > (conf.budgetPdfMB || 6) * MB) faults.push(`the PDF is ${(pdfBytes / MB).toFixed(2)} MB; the budget is ${conf.budgetPdfMB || 6} MB`);
    check('the pictures and the PDF are within their size budgets', faults, `pictures ${(imgBytes / MB).toFixed(2)} MB of ${conf.budgetImgMB || 4}, PDF ${(pdfBytes / MB).toFixed(2)} MB of ${conf.budgetPdfMB || 6}`);
  }

  if (pagesDir && fs.existsSync(pdfFile) && info) {
    try { await savePages(pdfFile, info.pages, pagesDir); console.log(`     (every page saved as a PNG in ${pagesDir})`); } catch (e) { console.log('     (the pages could not be saved: ' + e.message + ')'); }
  }

  const bad = results.filter(r => r.faults.length), faults = bad.reduce((a, r) => a + r.faults.length, 0);
  console.log(bad.length ? `FAIL: ${faults} fault(s) in ${bad.length} of ${results.length} checks` : `PASS: all ${results.length} checks`);
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.log('FAIL the check could not finish: ' + (e.stack || e.message)); process.exit(1); });

// ------------------------------------------------------------------ the browser
async function browser(width, height) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'guide-check-'));
  // the browser chooses its own debugging port (tools/cdp.js's openBrowser; BACKLOG G8)
  const { child, dbg } = await B.openBrowser(['--headless=new', '--no-first-run', '--no-default-browser-check', '--window-size=' + width + ',' + height, 'about:blank'], profile);
  let target = null;
  for (let i = 0; i < 100 && !target && dbg; i++) {
    await B.sleep(150);
    try { const list = await (await fetch(`http://127.0.0.1:${dbg}/json/list`)).json(); target = list.find(t => t.type === 'page'); } catch (e) { /* not up yet */ }
  }
  if (!target) { await B.closeBrowser(child, profile); throw new Error('the browser did not open its debugging port'); }
  const page = await B.cdp(target.webSocketDebuggerUrl);
  await B.logVersion(dbg);   // on stderr (G16)
  await page.send('Page.enable'); await page.send('Runtime.enable');
  const ev = async (expression) => { const r = await page.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text); return r.result.value; };
  // the browser waited for, then its profile removed with retries (G16: 14 guide-check-* profiles were left behind)
  const close = async () => { try { page.close(); } catch (e) { /* closing */ } await B.closeBrowser(child, profile); };
  return { page, ev, close };
}
// the guide laid out for print at the printable width: each figure's and table's box
async function measure(file, pw, ph) {
  for (let attempt = 1; ; attempt++) {
    const b = await browser(Math.ceil(pw), Math.ceil(ph));
    try {
      await b.page.send('Emulation.setDeviceMetricsOverride', { width: Math.floor(pw), height: Math.ceil(ph), deviceScaleFactor: 1, mobile: false });
      await b.page.send('Emulation.setEmulatedMedia', { media: 'print' });
      await b.page.send('Page.navigate', { url: 'file:///' + file.replace(/\\/g, '/') });
      const t0 = Date.now();
      while (!(await b.ev(`document.readyState === 'complete' && [...document.images].every(i => i.complete)`))) { if (Date.now() - t0 > 30000) throw new Error('the guide did not load'); await B.sleep(200); }
      return await b.ev(`(() => {
        const name = (el) => {
          const img = el.querySelector('img'); if (img) return 'the figure ' + img.getAttribute('src');
          const g = el.closest('.gen'); let h = el; while (h && !/^H[2-4]$/.test(h.tagName)) h = h.previousElementSibling || h.parentElement;
          return (g ? 'the generated table "' + g.dataset.gen + '"' : 'the table "' + [...el.querySelectorAll('th')].map(t => t.textContent).join(' | ').slice(0, 50) + '"') + (h ? ' under "' + h.textContent.trim().slice(0, 40) + '"' : '');
        };
        // a long table may break across pages (its header repeats), so only its rows must fit a page, not the whole
        const items = [...document.querySelectorAll('.chapter figure, .chapter .tw')].map(el => { const r = el.getBoundingClientRect(); const t = el.querySelector('table');
          const h = el.classList.contains('long') ? Math.max(0, ...[...el.querySelectorAll('tr')].map(tr => tr.getBoundingClientRect().height)) : r.height;
          return { name: name(el), w: r.width, h, overflow: t ? t.scrollWidth - el.clientWidth : 0, loaded: [...el.querySelectorAll('img')].every(i => i.naturalWidth > 0) }; });
        let widest = '', docWidth = 0;
        for (const el of document.querySelectorAll('.chapter *, .contents *')) { const r = el.getBoundingClientRect(); if (r.right > docWidth) { docWidth = r.right; widest = el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : '') + ' "' + (el.textContent || el.getAttribute('src') || '').trim().slice(0, 40) + '"'; } }
        return { items, docWidth, widest };
      })()`);
    } catch (e) {
      if (attempt >= 2) throw e;                     // the machine is shared: one retry before concluding anything
    } finally { await b.close(); }
  }
}
// every page of the PDF as a PNG, through the browser's own PDF viewer. The viewer now and then opens on the first page
// whatever the address asks: a later page that comes out as the first is taken again
async function savePages(pdf, n, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const b = await browser(1000, 1330);
  try {
    const url = 'file:///' + pdf.replace(/\\/g, '/');
    let first = null;
    for (let k = 1; k <= n; k++) {
      let png = null;
      for (let attempt = 1; attempt <= 4; attempt++) {
        await b.page.send('Page.navigate', { url: 'about:blank' });
        await b.page.send('Page.navigate', { url: url + '#page=' + k + '&view=Fit&toolbar=0' });
        await B.sleep((k === 1 ? 3500 : 2200) + 1500 * (attempt - 1));
        png = Buffer.from((await b.page.send('Page.captureScreenshot', { format: 'png' })).data, 'base64');
        if (k === 1 || !first || !png.equals(first)) break;
      }
      if (k === 1) first = png;
      fs.writeFileSync(path.join(dir, 'page-' + String(k).padStart(2, '0') + '.png'), png);
    }
  } finally { await b.close(); }
}
