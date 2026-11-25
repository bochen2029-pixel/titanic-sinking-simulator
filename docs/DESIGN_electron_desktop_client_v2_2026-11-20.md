# A portable desktop app for Windows: the design (v2)

Written 2026-11-20 10:05 CST. It replaces `DESIGN_electron_desktop_client_v1_2026-11-19.md`, which stays as written.

Bo's word of 20 November, after reading v1: "i do want to have electron client so it can be packaged as portable for windows pc and as a zip etc; without needing to mess with browsers, ports, etc".

**Status: a design. Nothing of the app is built.** This session added two files: this note and the experiment it rests on, `docs/research/experiments/e70_engine_math_probe.js`. Neither is committed.

Tags: [M] measured in this session, [R] read in a file, [D] derived, [B] bet.

## 0. What changed since v1

- **The app is wanted.** v1 asked whether; Bo has said yes, and said what for: a folder and a zip that run on a Windows PC with no browser and no port.
- **v1's finding about the engine had the wrong cause.** The two engines do differ, but in their sine and cosine, not in `Math.pow` (section 3).
- **There is a way to make them agree, and it is measured.** With the sine and cosine written in plain arithmetic, the app's engine gives the frozen reference's bits, and the tools' engine keeps its own. v1's choice between two engines falls away (section 3.3).
- **The zip is weighed:** about 151 MB, or about 140 MB without the languages nobody will read (section 2).
- **v1's cautions are out of date.** The staircase work it warned about was committed at 09:48 today (`de74ca4`); `dist/` is current; its line numbers into `site/app.js` have moved (section 5 has today's).

## 1. The answer

Build it as v1's option A: Fathom's shell, copied, with the page running in it unchanged. Then zip the folder.

- The page already fits. It makes no network call, and every script, font and worker comes from its own folder [R].
- No port is opened. The window is served from the app's own files under a scheme of its own, `titanic://app/`, not from a local web server.
- About a day of work [B], most of it the app's own test.
- The engine's difference is fixed in the core, separately, in three steps (section 3.4). The app does not have to wait for it.

## 2. What Bo gets

```
release/
  Titanic-win-x64/                 the portable folder: copy it anywhere, run Titanic.exe
    Titanic.exe                    Electron's runtime, renamed
    resources/app/                 main.js, package.json, dist/ (the page, 2.35 MB)
    data/                          her settings, made on the first run (section 6.1)
    README.txt                     "Unzip the whole folder first, then run Titanic.exe"
    LICENSE, LICENSES.chromium.html, LICENSE.titanic.txt
    runtime.json                   the runtime's version and the exe's sha256
    ...                            the runtime's other files
  Titanic-win-x64-0.2.0-<commit>.zip
  Titanic-win-x64-0.2.0-<commit>.zip.sha256
```

Sizes, measured on Fathom's packaged folder, which is the same runtime with a page of 1.2 MB in place of 2.35 MB [M]:

| | Folder | Zip |
|---|---|---|
| The runtime whole | 358 MB | 151.1 MB |
| Without the 54 languages other than English (`locales/`, 48.8 MB; `en-US.pak` is 0.56 MB) | about 310 MB | about 139.6 MB |

- The exe alone is 238 MB of the folder.
- The zip is written by Windows' own `tar.exe` (bsdtar 3.8.9 here), so nothing is installed for it. It took 49 to 152 s on this laptop [M].
- `.gitignore` already leaves `*.zip` out; `release/` joins it.
- `dxcompiler.dll` (24.6 MB) serves WebGPU, which the page does not use [B]. It can go if the app's test passes without it; otherwise it stays.

What "portable" means here:

- No installer, no administrator rights, no registry entry, no browser, no port, no network.
- The runtime is Electron 45.2.3, copied from one already on this machine (`C:\code\ATC\apps\desktop\node_modules\electron\dist`). Nothing is downloaded [M: the folder is there].
- Windows x64 only.

## 3. The engine: measured

### 3.1 The two engines differ in their trigonometry

`e70_engine_math_probe.js`, 18 functions hashed over 200,000 inputs each, in both engines [M]:

| | System Node v26.13.0 (V8 14.6) against Electron 45.2.3 (V8 15.6) |
|---|---|
| The same bits | `sqrt`; `pow` in four forms (`x^1.5`, `x^0.385`, `x^y`, the hull form's exponent between 2 and 4); `x**3`; `hypot` |
| Different bits | `sin`, `cos`, `tan`, `atan`, `atan2`, `asin`, `acos`, `exp`, `log`, `cbrt`, `tanh` |

- Electron's `sin` and `cos` differ from Node's on about 3.5 % of angles, by one unit in the last place [M].
- The flooding core calls `sin` and `cos` four times in every step, in `poseFrame` (`core/core.js:661`), for her pitch and roll [R].
- So v1's cause is wrong, and so are the three places it took it from: the header of `tools/seams.js` (lines 11 to 13), the README ("The port, and the oracle", line 328) and backlog X1. X1's first remedy, "a `Math.pow`-free hull form", would change nothing between these two engines.
- A limit on this: `pow` was the same on 800,000 inputs on this machine's two engines. That does not show it is the same in every engine, or on the machine where the README's remark was made.

### 3.2 A sine and cosine in plain arithmetic give both engines the same bits

The experiment carries a port of fdlibm's `sin` and `cos` (the routines V8 once used everywhere): additions and multiplications of doubles, nothing an engine may round its own way.

| Check | System Node | Electron as Node |
|---|---|---|
| The port's own results over 4,000,000 angles (within 1.4, 7, 1,000 and 800,000 rad) | four hashes | the same four hashes [M] |
| The port against the engine's own `Math.sin` and `Math.cos` | **0 differ** | about 33,000 to 37,000 of each million differ, by 1 in the last place |
| `tools/seams.js`'s three runs, as the engine is | 3 of 3 the reference's | 0 of 3; the 1912 run founders at 37,761 steps, not 37,762 |
| The same runs with `Math.sin` and `Math.cos` replaced by the port | **3 of 3 the reference's** | **3 of 3 the reference's** |

What that shows:

- The port is Node's own sine and cosine, to the bit, on every angle tried. Putting it into the core therefore moves nothing under Node: `out/seams_reference.json` stands, and no refreeze is needed [M for the seams gate].
- With it, the app's engine runs the three scenarios to the reference's bits, step for step, through four hours of her time [M].
- The core's other calls of this kind (`asin` and `tan`, once each when a sim is made) happened to agree on these three scenarios. That is luck, not a property; they should be ported too.

### 3.3 What follows for v1's first decision

v1 asked: is the app a second engine checked only against itself (a), or the reference everything is refrozen on (b)?

- With the functions ported, neither. The app, the tools and the page compute the same numbers, and one set of references serves all three.
- Until the port is in the core, (a) holds: the app's test compares the page's watch with the model run alone inside the app, as the browser suites do in Edge.
- (b) is dropped. It would have tied every reference to a runtime borrowed from another project's `node_modules`.

### 3.4 The fix, in three steps

This is backlog X1 with its cause corrected. It is a change to `core/`, so it waits for Bo's word like any backlog item.

| Step | What | Done when |
|---|---|---|
| E1 | A small module of the core's own mathematics (`sin`, `cos`; then `tan`, `asin`), bundled before `core/core.js`; `core/core.js` and `core/scenarios.js` call it | `node tools/seams.js` passes under Node with the reference untouched, and under the app's runtime run as Node; the whole gate green with no table moved |
| E2 | The rest: `atan2`, `atan`, `acos`, `exp`, `cbrt`, `tanh`, in `motion.js`, `encounter.js`, `night.js`, `systems.js` and the readers. 58 calls in eight files in all [M] | the 1912 watch's fingerprint in `tools/systems_tests.js` is the same under Node and under the app's runtime; `out/headway_reference.json` untouched |
| E3 | The browser | a watch's fingerprint equal in Node, in the app and in Edge, which is X1's own test |

- E2 rests on a bet: that fdlibm's other routines are Node's as its sine and cosine are [B]. Each is checked the way e70 checks these two before it goes in. One that is not Node's needs a deliberate refreeze, said in the commit.
- Edge was not measured. It is the same family of engine as Electron, so the page in Edge probably differs from Node for the same reason [B]. That would account for X1's figures (she founders at 9,492.5 s in Node and 9,493.75 s in Edge).
- The cost in speed is four calls a step in the core; not measured, expected to be nothing [B].

Why it matters more once there is a zip: a watch replayed on another PC should be the same night. With the engine's own functions that rests on a bet about a compiled runtime; with the port it rests on the arithmetic the language guarantees.

## 4. The shell

Fathom's, as it stands in `C:\fathom\app\main.js` (171 lines) [R], less everything that serves its voice:

| Kept | Where in Fathom's | What it does |
|---|---|---|
| A scheme of its own | `:22`, `:110-115` | `titanic://app/` serves `dist/` from the app's folder: a secure origin with its own storage, which can start its own workers. A `file:` page can do neither |
| No network | `:117` | every http, https, ws and wss request from the window is cancelled |
| A closed window | `:122`, `:124-125` | sandboxed, context-isolated, no Node in it; new windows denied; navigation off the origin stopped |
| Keys | `:126-130` | F11 full screen, F12 developer tools |
| A self-test | `:132-168` | `--smoke --smoke-out=F`: the app exercises itself and writes a report |
| Not throttled in the background | `:122` | the page steps the sim on its frames; a hidden window must not stop her |

Dropped: the key store, the sockets to Deepgram, the microphone's permission, and **`preload.js` whole**. Fathom's bridge exists for its voice. The Titanic page needs nothing from the main process (section 5, item 2), so the window gets no channel to it at all. The self-test drives the page from the main process, as Fathom's does.

Added:

- `app.requestSingleInstanceLock()`: a second start brings the first window forward and hands it its arguments. Two copies must not share one `data/` folder.
- `--open=<fragment>`: the same text the page reads from its address (`#night=1912&kn=22.5`, `#scenario=britannic`, `#log=...`), so there is one grammar and nothing to keep in step.
- The page's headers (section 5, item 1).

About 90 lines [B].

## 5. What the page needs

What already fits [R, on today's tree]:

- `dist/` is 26 files, 2.35 MB: the page, one app bundle, one forecast worker, one stylesheet, three.js r128, six fonts with their licences, icons [M].
- No `fetch` in `site/`. The validation data is inlined in the bundle (`tools/build_site.js:82-85`).
- The workers start from a relative address (`site/app.js:1566`, `:1584`, `:1830`).
- `localStorage` holds two small settings (`site/parts/30_sound.js:79`, `site/parts/60_reports.js:29`).
- No service worker, no cookies, no IndexedDB.
- three.js carries its MIT notice in its own file [R].

What changes:

| # | What | Where | Fix |
|---|---|---|---|
| 1 | The content-security policy and the other headers are in `dist/_headers`, which only Cloudflare reads | `dist/_headers` | the scheme's handler sends the same headers with every answer |
| 2 | The footer's link to GitHub would do nothing: the shell denies new windows | `site/index.template.html:315` | hidden when the page's address begins `titanic:`. No bridge is added for it |
| 3 | "Copy a link to this watch" builds the link from the page's own address, which in the app opens nowhere else | `site/parts/40_night_end.js:56` | in the app it copies the fragment alone (`#night=...&log=...`), which `--open=` takes; the public address once the site has one |
| 4 | Opening a given night | `site/app.js:2828-2829`, `site/parts/40_night_end.js:60` | `--open=`, section 4 |

Both changes to the page's sources sit behind a check of the address, so the web page behaves as before.

## 6. On other people's PCs

### 6.1 Where her settings go

Electron keeps a profile (the two settings, and its own caches of a few MB) under `%APPDATA%` by default. For a portable folder that is the wrong place.

- **Pick:** `data/` beside `Titanic.exe`, when the folder can be written. Delete the folder and nothing of her is left on the PC; carry it on a stick and the settings come along.
- When it cannot be written (a read-only share, `Program Files`), the system's place for the app is used, and the window's title says so.
- `--profile=DIR` overrides both, as in Fathom.

### 6.2 What is known about Windows, not measured here

Each of these is a bet from how Windows is known to behave [B]. The first two are what the README in the zip is for.

- **Run from inside the zip.** Double-clicking `Titanic.exe` in Explorer's view of the zip unpacks the exe alone to a temporary folder, and it fails for want of its files. The folder must be extracted first.
- **The warning.** A zip that came through a browser or a mail is marked as from the internet, and Explorer passes the mark to what it extracts. An unsigned exe so marked gets SmartScreen's "Windows protected your PC" on its first run; "More info", then "Run anyway", passes it. A zip copied by a stick or a share is not marked.
- **A managed PC.** A company's policy may refuse an unsigned exe outright. Unknown here.
- **The picture.** The page needs WebGL. Without a graphics card the runtime falls back to software (`vk_swiftshader.dll` is in the folder for that), and she will be slow.
- **The version of Windows.** Electron 45 needs Windows 10 or later.

Code signing removes the warning and costs a certificate. It belongs to v1's option C, with an installer and updates, when she is given away widely.

### 6.3 The same night on every PC

- The zip fixes the engine: everyone who runs it runs Electron 45.2.3's V8, whatever browser they have.
- `runtime.json` records the exe's sha256, not only its version, so a runtime changed under the same version number is caught at packaging.
- After E2 (section 3.4) the fingerprint the app's test checks is the one the tools hold. A watch's log made on one PC then replays to the same bits on another, and that can be checked by running the zip's self-test there.

## 7. The build, and each step's test

| Step | What | Done when |
|---|---|---|
| D1 | `app/main.js` (section 4) | the app opens the page in its own window from `titanic://app/` |
| D2 | `tools/package_app.js`: Fathom's, renamed; the runtime copied once a version, English only; `dist/` checked current first (`node tools/build_site.js --check`); `README.txt`, the licences, `runtime.json` with the sha256 | `release/Titanic-win-x64/Titanic.exe` exists; a stale `dist/` refuses to package |
| D3 | `tools/app_test.js`, with `--smoke` in the app | the package holds this build; the page has WebGL and no Node; the console has no error (which also shows the fonts and the headers work under the scheme); a 1912 watch steps to her foundering and its fingerprint equals the model run alone in the same engine; the forecast worker answers; the window made no network request; the GitHub link is hidden; the copied link is the fragment; `--open=` opens the night it names; a second start does not open a second window; `data/` is beside the exe |
| D4 | `--zip` in the packager | the zip and its sha256 are written; unpacked to a folder with a space in its name and run from there, the self-test passes |
| D5 | `tools/gate.js`: rows `package` and `app`, outside `--quick`; `CLAUDE.md`: one rule and the commands; `.gitignore`: `release/`; a paragraph in the User Guide's quick start | the gate ends in `GATE: PASS` with the two rows |

D5 changes the Commands block of `CLAUDE.md`, which is an input of the User Guide: the guide is rebuilt in that commit.

## 8. Later

- **The engine out of the window** (v1's option B): the sim stepped in a worker, the window drawing from snapshots. It is worth doing for the break, the descent and the computed wake, each of which wants compute off the drawing thread. It is not an Electron matter: a worker does it in a browser too, and the forecast already runs in one. Judge it as a refactor of the page.
- **What only a desktop app can do:** save and open a watch as a file; record the night to a video file; the User Guide's PDF from a Help menu, offline; a second window for the bridge; the Carpathia search run from inside with its progress on screen.
- **An installer, signing, updates** (v1's option C): when she is given to people who will not unzip a folder.

## 9. Decisions

Made by Bo:

1. There is to be an Electron app, portable, for Windows, as a folder and a zip.

Made here, for Bo to overturn:

2. The engine: neither of v1's two. Fix the functions (section 3.4); until then the app is checked against itself.
3. The shared link: the fragment alone now; the public address when the site has one. No `titanic://` link registered with Windows, since that writes to the registry and the link opens on no other PC.
4. The runtime: copied a second time beside Fathom's. A runtime shared between two apps would tie their engines together.
5. Her settings: beside the exe (section 6.1).
6. No bridge and no `preload.js`.

Open, Bo's:

7. Whether E1 to E3 (backlog X1) start, and whether before or after the app. They are independent; the app first gives a zip sooner, the fix first gives a zip whose nights match the tools'.
8. Whether the three places that blame `Math.pow` are corrected now or with E1.

## 10. Not known

- Whether the fonts preloaded with `crossorigin` (`site/index.template.html:26-28`) and the policy's `'self'` behave under the scheme. D3's first run shows it.
- How the page performs in Electron 45 against Edge on this laptop's graphics.
- Whether the page in Edge agrees with the app, before or after the fix.
- Whether fdlibm's other routines are Node's (E2's bet).
- Everything in section 6.2.
- Whether `dxcompiler.dll` can go.

## 11. To run the measurements again

```
node docs/research/experiments/e70_engine_math_probe.js --seams
```

Under the app's engine: set `ELECTRON_RUN_AS_NODE=1`, give the same arguments to the runtime's `electron.exe`, and send its output to a file (it is a windowed program and writes to no console). About half a minute under Node [M: 32 s].
