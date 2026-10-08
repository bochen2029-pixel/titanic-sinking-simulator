# Changelog

## 0.2.0 — 2026-10-08: the website build (viewer v2)

The viewer was reviewed end to end and rebuilt as a deployable static site in `site/` and `dist/`.
Version 1, the single file `out/titanic.html` built by `tools/build.js`, is kept unchanged. The physics
(`core/core.js`, `core/scenarios.js`) is untouched; the site bundles those files as they are.

### What was wrong with version 1

Found by reading `web/template.html` and `web/app.js`, then confirmed by driving the built page through
Playwright on desktop, iPhone 13, Pixel 7 and iPad profiles (`tools/site_test.js`):

- **No document skeleton.** The page began with `<title>`: no doctype, no `<meta charset>`, no viewport
  meta tag. Browsers rendered it in quirks mode, and every phone laid it out as a 980-pixel desktop page
  and scaled it down. The phone stylesheet never applied. Measured inner widths: iPhone 980, Pixel 981,
  iPad 980. The readouts in the HUD collided with each other at that width (`docs/site/v1-iphone-run.png`).
- **Four runtime dependencies on third parties.** three.js r128 from cdnjs and three font families from
  Google Fonts, so the page needed those hosts up and leaked visits to them.
- **The forecast worker was built from an inline blob URL**, which a strict Content Security Policy
  forbids.
- **No WebGL, no page.** A browser without WebGL threw inside the renderer constructor and nothing else
  ran, although the model, the damage diagram and the evidence tab do not need the GPU.
- **Sprite labels drawn before the fonts arrived** rendered in the fallback font and stayed that way.
- **Removed hole markers leaked their materials.**

The model and the application logic were sound: the simulation advanced, the forecast arrived, and the
tap-to-hole tool worked on every profile even in the broken layout.

### What version 2 does

- A proper document: doctype, charset, viewport with `viewport-fit=cover`, description, theme colour,
  Open Graph tags, icons, a web manifest (installable on phones), and safe-area insets for notched screens.
- **Phone layout.** The app classifies the device from the pointer type and the short side of the screen
  (`html[data-device]`): on phones the stage fills the screen and the control panel becomes a bottom
  sheet, collapsed to its tab bar; a tab opens the sheet, the same tab or the chevron closes it. Tablets
  and narrow windows keep the stacked layout. Touch targets are at least 40 px tall.
- **Self-contained.** three.js r128 and the latin subsets of IBM Plex Sans Condensed, IBM Plex Mono and
  Cormorant Garamond are vendored (MIT and OFL licences shipped alongside). No third-party requests.
- **Strict headers for Cloudflare Pages** (`site/_headers`): a Content Security Policy with no inline
  scripts (the forecast worker is a real file), immutable caching for hashed assets, no-cache for the page.
- **Graceful degradation.** Without WebGL the 3D canvas is replaced by a notice and the rest of the page
  keeps working; without three.js the page says so.
- Sprite labels redraw once `document.fonts.ready` resolves; removed markers dispose their materials.
- A pixel-ratio governor lowers the render resolution one step at a time on devices that cannot hold
  25 fps, down to 1×.
- Keyboard: Space pauses, R restarts. The scenario is kept in the URL hash (`#scenario=britannic`).
- `tools/build_site.js` assembles `dist/` with content-hashed asset names and a `version.json`;
  `tools/site_test.js` is the device matrix; `tools/pages_check.js` runs the build under Cloudflare's local
  Pages runtime and prints the headers it applies; `tools/make_assets.js` draws the icons from the model's
  own hull profile and renders the social image.

### Verified

| Profile | Standards mode | Viewport | Device class | Sim and forecast | Tap adds a hole | Errors |
|---|---|---|---|---|---|---|
| Desktop 1400×860 | yes | yes | desktop | yes | yes | none |
| iPhone 13 (390×664, 3×, touch) | yes | yes | phone | yes | yes | none |
| Pixel 7 (412×839, 2.6×, touch) | yes | yes | phone | yes | yes | none |
| iPad gen 7 (810×1080, 2×, touch) | yes | yes | tablet | yes | yes | none |

Headless Chromium with SwiftShader WebGL; `npm run test:site` reproduces the table.

### Also in this release

- `tools/titanic.js` defaults to the calibrated opening area (it defaulted to an uncalibrated 1.115 m²).
- `core/core.js` exports `hydroPass`, which the C++ port's exporter needs. No behaviour change.

## 0.1.0 — 2026-10-08

Initial release: the JavaScript flooding core, the three.js viewer, tools, the frozen golden trace and the
porting notes.
