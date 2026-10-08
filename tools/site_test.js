// site_test.js: drive a build of the viewer through desktop, phone and tablet emulation with Playwright.
// Checks document mode, viewport meta, WebGL boot, the simulation advancing, the forecast arriving, layout
// overflow, and on touch devices the tap-to-hole tool. Writes screenshots and prints a table.
// Usage: node tools/site_test.js <dir to serve> [entry=index.html] [screenshot dir=docs/site] [label=v2]
// Exit code 1 when any check fails.
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium, devices } = require('playwright');
const { serve } = require('./serve');

const dir = process.argv[2] || 'dist';
const entry = process.argv[3] || 'index.html';
const outDir = path.resolve(process.argv[4] || 'docs/site');
const label = process.argv[5] || 'v2';
fs.mkdirSync(outDir, { recursive: true });

const PROFILES = [
  { name: 'desktop', opts: { viewport: { width: 1400, height: 860 }, deviceScaleFactor: 1 } },
  { name: 'iphone', device: 'iPhone 13' },
  { name: 'pixel', device: 'Pixel 7' },
  { name: 'ipad', device: 'iPad (gen 7)' },
];

(async () => {
  // SITE_URL=http://host:port/ tests an already running server (for example wrangler pages dev) instead of dist/
  const external = process.env.SITE_URL;
  const { server, port } = external ? { server: { close() {} }, port: 0 } : await serve(dir, 0);
  const url = external ? external.replace(/\/?$/, '/') + entry : `http://127.0.0.1:${port}/${entry}`;
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const rows = [];
  let failed = 0;
  for (const prof of PROFILES) {
    const opts = prof.device ? { ...devices[prof.device] } : prof.opts;
    if (prof.device && !devices[prof.device]) { rows.push([prof.name, 'device profile missing']); continue; }
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
    page.on('response', (r) => { if (r.status() >= 400) errors.push(`http ${r.status()} ${r.url().replace(url.replace(entry, ''), '')}`); });
    const checks = {};
    try {
      await page.goto(url, { waitUntil: 'load' });
      await page.waitForTimeout(2500);
      const info = await page.evaluate(() => ({
        standards: document.compatMode === 'CSS1Compat',
        viewportMeta: !!document.querySelector('meta[name="viewport"]'),
        device: document.documentElement.dataset.device || null,
        app: !!window.TitanicApp,
        t: window.TitanicApp ? window.TitanicApp.state.sim.t : -1,
        webgl: !!(window.TitanicApp && window.TitanicApp.renderer !== null),
        overflowX: document.documentElement.scrollWidth - window.innerWidth,
        inner: [window.innerWidth, window.innerHeight],
        fonts: document.fonts ? document.fonts.status : 'n/a',
      }));
      checks.standardsMode = info.standards;
      checks.viewportMeta = info.viewportMeta;
      checks.appBooted = info.app;
      checks.simAdvancing = info.t > 0;
      checks.noHorizontalOverflow = info.overflowX <= 1;
      checks.device = info.device;
      checks.inner = info.inner.join('x');
      // the forecast should arrive within a few seconds (worker or main-thread fallback)
      const fc = await page.waitForFunction(() => { const el = document.getElementById('fcLine'); return el && !/Forecasting/.test(el.textContent); }, null, { timeout: 15000 }).then(() => true).catch(() => false);
      checks.forecastArrived = fc;
      checks.forecastText = await page.evaluate(() => (document.getElementById('fcLine') || {}).textContent || '');
      await page.screenshot({ path: path.join(outDir, `${label}-${prof.name}-run.png`) });
      // the damage tool: open the Damage tab, pick Punch hole, tap the starboard side amidships below the waterline
      const touch = !!opts.hasTouch;
      const tabs = await page.$$('.tab');
      if (tabs.length >= 2) {
        // what is under the Damage tab's centre, in case a click cannot reach it
        checks.underTab = await page.evaluate(() => {
          const t = document.querySelectorAll('.tab')[1]; const b = t.getBoundingClientRect();
          const el = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
          return `${Math.round(b.left)},${Math.round(b.top)} ${Math.round(b.width)}x${Math.round(b.height)} -> ${el ? el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className ? '.' + String(el.className).split(' ')[0] : '') : 'none'}`;
        });
        await tabs[1].click({ timeout: 8000 });
        await page.waitForTimeout(300);
        const holeBtn = await page.$('#toolSeg button[data-tool="hole"]');
        if (holeBtn) await holeBtn.click();
        await page.waitForTimeout(200);
        // return to the stage on phones (the sheet may cover the canvas)
        const closer = await page.$('#sheetClose');
        if (closer && await closer.isVisible()) { await closer.click(); await page.waitForTimeout(300); }
        const pt = await page.evaluate(() => {
          const p = window.TitanicApp.project(60, -14.5, 5.0);   // starboard shell, 60 m forward of amidships, 5 m above the keel
          const r = document.getElementById('gl').getBoundingClientRect();
          return { x: p.x, y: p.y, inside: p.x > r.left && p.x < r.right && p.y > r.top && p.y < r.bottom };
        });
        const before = await page.evaluate(() => window.TitanicApp.state.sim.openings.length);
        if (pt.inside) {
          if (touch) await page.touchscreen.tap(pt.x, pt.y); else await page.mouse.click(pt.x, pt.y);
          await page.waitForTimeout(400);
        }
        const after = await page.evaluate(() => window.TitanicApp.state.sim.openings.length);
        checks.tapAddsHole = pt.inside ? after === before + 1 : 'hull point off-canvas';
        await page.screenshot({ path: path.join(outDir, `${label}-${prof.name}-damage.png`) });
        // evidence tab
        if (tabs.length >= 4) { await tabs[3].click(); await page.waitForTimeout(600); await page.screenshot({ path: path.join(outDir, `${label}-${prof.name}-evidence.png`) }); }
      }
      checks.errors = errors.length ? errors.slice(0, 3).join(' | ') : 'none';
    } catch (e) {
      checks.exception = e.message.split('\n').filter(Boolean).slice(0, 5).join(' / ');
    }
    await ctx.close();
    const bad = Object.entries(checks).filter(([k, v]) => v === false || k === 'exception' || (k === 'errors' && v !== 'none'));
    if (bad.length) failed++;
    rows.push([prof.name, JSON.stringify(checks)]);
  }
  await browser.close();
  server.close();
  console.log(`\n${label} from ${dir}/${entry}`);
  for (const r of rows) console.log(`  ${r[0].padEnd(8)} ${r[1]}`);
  console.log(failed ? `\n${failed} profile(s) with failed checks` : '\nall profiles pass');
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
