// make_assets.js: the site's icons and social image, generated once and committed under site/.
// The icon is the model's own hull profile (the same half-breadth function the physics integrates),
// afloat at the drafts of 14 April 1912. Needs Playwright (dev dependency) for the PNG renders.
// Usage: node tools/make_assets.js
'use strict';
const fs = require('fs');
const path = require('path');
const C = require('../core/core.js');

const root = path.join(__dirname, '..');
const iconDir = path.join(root, 'site', 'icons');
fs.mkdirSync(iconDir, { recursive: true });

// ---- hull profile in the ship frame: top line and keel line, stern to stem
const G = C.G;
const xMin = G.xAP - G.sternOverhang - 0.5, xMax = C.xFwd(C.zTopAt(G.xFP)) + 0.5;
function bottom(x) { const zt = C.zTopAt(x); for (let z = 0; z <= zt; z += 0.05) if (C.halfBreadth(x, z) > 0.02) return z; return null; }
const top = [], keel = [];
for (let x = xMin + 0.5; x <= xMax - 0.5; x += 1) { const z = bottom(x); if (z === null) continue; top.push([x, C.zTopAt(x)]); keel.push([x, z]); }
// funnels and masts as simple strokes, positions from the viewer
const funnels = [45.5, 12.5, -20.5, -53.5], masts = [[93.5, 62], [-108, 58]];
const draft = 0.5 * (C.DEFAULT_PARAMS.draftF + C.DEFAULT_PARAMS.draftA);   // mean draft, 1912

function svg(size, pad, rounded) {
  const W = size, H = size;
  const span = xMax - xMin;
  const sx = (W - 2 * pad) / span;
  const X = (x) => W - pad - (x - xMin) * sx;            // stem to the right
  const zTop = 33, zLo = -6;
  const sz = sx * 1.0;
  const base = H * 0.60;
  const Z = (z) => base - (z - draft) * sz;
  const hull = top.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)} ${Z(p[1]).toFixed(1)}`).join(' ') +
    ' ' + keel.slice().reverse().map((p) => `L${X(p[0]).toFixed(1)} ${Z(p[1]).toFixed(1)}`).join(' ') + ' Z';
  const funnelSvg = funnels.map((x) => { const z0 = G.deck.Boat + C.sheer(x); return `<rect x="${(X(x) - 3.2 * sx).toFixed(1)}" y="${Z(z0 + 18.9).toFixed(1)}" width="${(6.4 * sx).toFixed(1)}" height="${(18.9 * sz).toFixed(1)}" fill="#c78a3d"/>`; }).join('');
  const mastSvg = masts.map(([x, t]) => `<line x1="${X(x).toFixed(1)}" y1="${Z(C.zTopAt(x)).toFixed(1)}" x2="${X(x).toFixed(1)}" y2="${Z(t).toFixed(1)}" stroke="#c9a46a" stroke-width="${Math.max(1, 0.8 * sx).toFixed(1)}"/>`).join('');
  const r = rounded ? size * 0.2 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs><clipPath id="c"><rect width="${W}" height="${H}" rx="${r}"/></clipPath>
<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d3550"/><stop offset="1" stop-color="#05121c"/></linearGradient></defs>
<g clip-path="url(#c)">
<rect width="${W}" height="${H}" fill="#08111b"/>
<rect x="0" y="${Z(0).toFixed(1)}" width="${W}" height="${(H - Z(0)).toFixed(1)}" fill="url(#sea)"/>
${funnelSvg}${mastSvg}
<path d="${hull}" fill="#dbe6ef"/>
<rect x="0" y="${Z(0).toFixed(1)}" width="${W}" height="${Math.max(2, 1.6 * sx).toFixed(1)}" fill="#3cc3ff"/>
</g></svg>`;
}

fs.writeFileSync(path.join(iconDir, 'icon.svg'), svg(512, 36, true));
fs.writeFileSync(path.join(iconDir, 'favicon.svg'), svg(64, 4, true));
console.log('wrote site/icons/icon.svg, favicon.svg');

(async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180], ['favicon-32.png', 32]]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${svg(size, Math.round(size * 0.07), name !== 'apple-touch-icon.png')}</body></html>`);
    await page.screenshot({ path: path.join(iconDir, name), omitBackground: true });
    console.log('wrote site/icons/' + name);
  }
  // social image: the 149-minute viewer capture with a title band, 1200 x 630
  const shot = fs.readFileSync(path.join(root, 'docs', 'viewer-149min.png')).toString('base64');
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(`<!doctype html><html><body style="margin:0;width:1200px;height:630px;background:#05090f url(data:image/png;base64,${shot}) center/cover no-repeat;position:relative;font-family:Georgia,serif">
    <div style="position:absolute;left:0;right:0;bottom:0;padding:26px 40px 30px;background:linear-gradient(transparent, rgba(5,9,15,0.92) 40%);color:#dbe6ef">
      <div style="font:italic 600 44px/1 'Cormorant Garamond',Georgia,serif">Titanic Sinking Simulator</div>
      <div style="font:400 20px/1.3 system-ui,sans-serif;color:#a8bbcb;margin-top:10px">A flooding model that computes the sinking instead of animating it. 4,408 hull columns, 64 spaces, 290 flow paths, calibrated to the 1912 timeline.</div>
    </div></body></html>`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(root, 'site', 'og.png') });
  console.log('wrote site/og.png');
  await browser.close();
})();
