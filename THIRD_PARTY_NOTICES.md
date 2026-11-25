# Third-party notices

The Titanic Sinking Simulator is under the MIT licence: see [LICENSE](LICENSE). It includes, or runs on, work by
others, each under its own licence. For each one this file says what it is, the version this repository pins, its
licence, and where the text of that licence is. Its last section says under what terms two sources of data are used.

The app for Windows carries a copy of this file in its folder, beside `README.txt` and `LICENSE.titanic.txt`.

## In the page, and in the app's copy of it

The page (`dist/`, built by `node tools/build_site.js`) carries these, and the app carries the same page in
`resources\app\dist\`. The versions are the ones `package-lock.json` pins.

| Component | What it is | Version | Licence | Where its licence text is |
|---|---|---|---|---|
| three.js | The 3D library that draws the ship and the sea | r128 (npm `three` 0.128.0), as `dist/assets/three.r128.min.js` | MIT | The file's header gives its copyright line and licence; the full text is under [three.js](#threejs) below |
| Cormorant Garamond | A typeface, from `@fontsource/cormorant-garamond` | 5.3.0 | SIL Open Font License 1.1 | `dist/fonts/LICENSE-cormorant-garamond.txt` |
| IBM Plex Mono | A typeface, from `@fontsource/ibm-plex-mono` | 5.3.0 | SIL Open Font License 1.1 | `dist/fonts/LICENSE-ibm-plex-mono.txt` |
| IBM Plex Sans Condensed | A typeface, from `@fontsource/ibm-plex-sans-condensed` | 5.3.0 | SIL Open Font License 1.1 | `dist/fonts/LICENSE-ibm-plex-sans-condensed.txt` |
| fdlibm | The model's own sine, cosine, power and ten more functions in `core/core.js` are ports of fdlibm's routines, by way of FreeBSD's msun and V8, so that every JavaScript engine computes them alike | The routines as V8 and FreeBSD's msun carry them | fdlibm's notice: free to use, copy, modify and distribute, provided that the notice is preserved | In `core/core.js`, beside the routines, and under [fdlibm](#fdlibm) below |

## In the app for Windows only

| Component | What it is | Version | Licence | Where its licence text is |
|---|---|---|---|---|
| Electron | The app's runtime: `Titanic.exe` is Electron's own program, renamed | 45.2.3 (`PIN` in `tools/package_app.js`) | MIT | `LICENSE` in the app's folder |
| Chromium, and the parts that Electron and Chromium carry | The browser engine inside Electron, and its parts, among them V8, Node.js, FFmpeg, SwiftShader, the Vulkan loader and the DirectX shader compiler | As Electron 45.2.3 carries them | Each part's own | `LICENSES.chromium.html` in the app's folder, which lists them one by one |
| `@anthropic-ai/sdk`, Anthropic's SDK for JavaScript | How the app calls Claude for the crew's minds, when the player switches them on with a key of their own | 1.13.0 | Apache License 2.0 | `resources\app\node_modules\@anthropic-ai\sdk\LICENSE`. `LICENSE-MIT` beside it says that the SDK moved from the MIT licence to Apache 2.0 at its version 1.0.0, and that MIT still applies to the versions published under it and to contributions merged before the change |
| `@opentelemetry/api` | Needed by the SDK | 1.10.0 | Apache License 2.0 | `resources\app\node_modules\@opentelemetry\api\LICENSE` |
| `json-schema-to-ts` | Needed by the SDK | 3.1.1 | MIT | `resources\app\node_modules\json-schema-to-ts\LICENSE` |
| `standardwebhooks` | Needed by the SDK | 1.3.0 | MIT | The package carries no licence file; its `package.json` declares MIT. The text is under [standardwebhooks](#standardwebhooks) below |
| `@babel/runtime` | Needed by `json-schema-to-ts` | 7.29.15 | MIT | `resources\app\node_modules\@babel\runtime\LICENSE` |
| `ts-algebra` | Needed by `json-schema-to-ts` | 2.0.0 | MIT | `resources\app\node_modules\ts-algebra\LICENSE` |
| `@stablelib/base64` | Needed by `standardwebhooks` | 1.0.1 | MIT | `resources\app\node_modules\@stablelib\base64\LICENSE` |
| `fast-sha256` | Needed by `standardwebhooks` | 1.3.0 | The Unlicense, a dedication to the public domain | `resources\app\node_modules\fast-sha256\LICENSE` |

The eight packages are `package.json`'s one runtime dependency and the seven it needs, at the versions
`package-lock.json` pins. `tools/package_app.js` copies each package's folder whole, with its own licence, and refuses
any other version. They are not committed to this repository: `npm ci` puts them in `node_modules/`.

The app's adapters for the other providers of the crew's minds (OpenAI, Google Gemini, Cerebras, a model on the
player's own PC) and for Deepgram's voices are this project's own code, and use no SDK of those companies.

Playwright and wrangler (in `devDependencies`) are used to test and to deploy. They are in neither the page nor the
app.

## Licence texts that do not travel with their code

### three.js

The vendored file carries its copyright line and an SPDX identifier, not the whole licence. The text below is three.js's
own `LICENSE` at its tag r128.

```
The MIT License

Copyright © 2010-2021 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### standardwebhooks

`standardwebhooks` 1.3.0 is published without a licence file, and its `package.json` declares MIT. Its repository,
github.com/standard-webhooks/standard-webhooks, has the Apache License 2.0 at its root and the MIT licence below in its
`libraries/` folder, which holds the JavaScript library (read on 2026-11-24).

```
The MIT License

Copyright (c) 2023 Svix (https://www.svix.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### fdlibm

As `core/core.js` carries it. Chromium's list of licences gives V8's own fork of fdlibm the same notice, dated
1993-2004.

```
Copyright (C) 1993 by Sun Microsystems, Inc. All rights reserved.
Developed at SunSoft, a Sun Microsystems, Inc. business.
Permission to use, copy, modify, and distribute this software is freely granted,
provided that this notice is preserved.
```

## Data: the terms the repository works under

### Her rooms, read from the deck plans

`data/rooms/` holds her rooms on nine decks, the orlop to the Boat deck, and their openings, as sourced tables of
facts. The terms are in `docs/research/RESEARCH_rooms_plans_licence_v1_1_2026-11-20.md`, decided on 2026-11-20; the
note says that it is not legal advice. In short:

1. The rooms' facts go into the repository as a sourced table: which room, on which deck, in which watertight
   compartment, where, and how big. The project's author holds that the 1912 originals are in the public domain, and
   that facts belong to no one.
2. No image or drawing from a modern redrawing of the plans goes into the repository or onto its site, whether the
   redrawing is free or sold.
3. Encyclopedia Titanica's free deck plans were the reading reference: read on the page, not downloaded, and the
   numbers written down. Each table names the plan it read, who drew it and the book it was drawn for.
4. Each row cites its source: the reference read, and the 1912 original it was checked against where one could be
   reached (such as the inquiries' exhibits, scans of the builder's general arrangement, or *The Shipbuilder*'s
   plates of 1911), or "not checked against an original". Where a redrawing and an original differ, the row says so,
   and the original wins.

The plans read are those drawn by Bruce Beveridge for *Titanic: The Ship Magnificent* (The History Press, 2008), as
published by Encyclopedia Titanica. Encyclopedia Titanica's terms were read on 2026-11-24: they allow personal,
private and academic use, ask that the site and each page's contributors be credited, and ask for the editor's
written permission for any other use. The site's editor was asked on 2026-11-24 for permission to publish the tables
of positions and names read from Bruce Beveridge's deck plans, with the credit as given below; no answer had come
when this was written. If the answer is no, the tables are taken out, and that part is rebuilt from 1911 and 1912
originals. The credit is given in the README, in SOURCES.md and under "Her rooms" on the
page: "Her rooms' positions and names were read from the deck plans drawn by Bruce Beveridge for Titanic: The Ship
Magnificent (The History Press, 2008), as published by Encyclopedia Titanica. No drawing is reproduced, and any error
in the tables is ours." 28 of the 572 rows were checked against a 1912 original; the others rest on the plans alone.
The pictures in `docs/evidence/rooms/` are the tables drawn over the model's own deck outline, not copies of a plan.

### The Cave list of 1912 (first class)

`data/rooms/occupants_1912.json`, with its printed table `out/occupants_1912.txt`, is the White Star Line's printed
first-class passenger list for the maiden voyage: a proof with the cabins set against the names, found on the body of
saloon steward Herbert Cave. The original is held by the Nova Scotia Archives (Medical Examiner, City of Halifax, RG
41 vol. 76 no. 218). The list was transcribed by hand from the Archives' digitised scan of it, read on 2026-11-24; the
repository keeps its names and cabins as text, and no image of the scan. A public data set, titanic3 (hbiostat.org,
compiled from Encyclopedia Titanica), was used to check the reading, and where it differs the row says so.

What the repository found about its terms: nothing. The table records its source, how and when it was read, and what
the list leaves out. It records no terms of use for the Archives' scan, and no statement about the list's copyright.

### Bob Read's plans of Olympic

Bob Read's plan sheets of Olympic (2010) are licensed CC BY-NC-ND 4.0. Two kinds of number were read from them, and
each is cited where it is used: her waterline's half-angle at the stem, 21 degrees, which sets her bow wave
(`site/parts/24_wake_field.js`), and her frame spacing forward, which a comment in `core/encounter.js` uses to explain
a fitted factor. No drawing, and no part of one, is copied or traced into the repository or onto its site. As with
the rooms, the project's author holds that a measured number belongs to no one. SOURCES.md lists the sheets.
