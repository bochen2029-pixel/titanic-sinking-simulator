// Screenshot and drive the viewer headlessly, so the page can be checked without a human.
// Setup once:  npm i playwright three@0.128.0 && npx playwright install chromium
// Usage:       node tools/shot.js [width] [height] [waitMs] [out.png] ['[{"click":"#bXray"},{"wait":500,"shot":"a.png"},{"eval":"TitanicApp.state.sim.t"}]']
// Actions: click (selector), mouse ([x, y]), wait (ms), eval (JS in the page; result is printed), shot (file).
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'out');
let chromium, three;
try { ({ chromium } = require('playwright')); three = fs.readFileSync(require.resolve('three/build/three.min.js'), 'utf8'); }
catch (e) { console.error('Run: npm i playwright three@0.128.0 && npx playwright install chromium'); process.exit(1); }

const page0 = fs.readFileSync(path.join(outDir, 'titanic.html'), 'utf8');
const html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>' +
  page0.replace(/<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\/[^"]+"><\/script>/, () => '<script>' + three + '</script>')
    .replace(/<link[^>]+fonts[^>]+>/g, '') + '</body></html>';
const testPath = path.join(outDir, 'titanic_local.html');
fs.writeFileSync(testPath, html);

(async () => {
  const a = process.argv.slice(2);
  const w = +(a[0] || 1400), h = +(a[1] || 860), wait = +(a[2] || 4000), out = a[3] || 'shot.png';
  const actions = a[4] ? JSON.parse(a[4]) : [];
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
  const logs = [];
  page.on('console', m => logs.push(m.type() + ': ' + m.text()));
  page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message));
  await page.goto('file://' + testPath);
  await page.waitForTimeout(wait);
  for (const act of actions) {
    if (act.click) await page.click(act.click);
    if (act.mouse) await page.mouse.click(act.mouse[0], act.mouse[1]);
    if (act.wait) await page.waitForTimeout(act.wait);
    if (act.eval) { const r = await page.evaluate(act.eval); logs.push('EVAL: ' + JSON.stringify(r)); }
    if (act.shot) await page.screenshot({ path: path.join(outDir, act.shot) });
  }
  await page.screenshot({ path: path.join(outDir, out) });
  console.log(logs.join('\n'));
  await browser.close();
})();
