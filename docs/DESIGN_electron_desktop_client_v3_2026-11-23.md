# A portable desktop app for Windows, and its public release: the design (v3)

Written 2026-11-23 08:46 CST by the coordinator, on Bo's word ("Yes, write v3"). It replaces
`DESIGN_electron_desktop_client_v2_2026-11-20.md`, which stays as written; v1 and the mainline's brainstorm are beside
it.

Bo's words:
- 2026-11-20, for v2: "i do want to have electron client so it can be packaged as portable for windows pc and as a zip
  etc; without needing to mess with browsers, ports, etc".
- 2026-11-23, for v3: "if I want to update my existing titanic github repo (which is public on my personal github) to
  this and add a "release" that has a zip that contains this portable self contained playable exe that doesn't require
  a browser".

**Status: a design. Nothing of the app is built, and nothing is pushed to the public repository.**

Tags: [M] measured, [R] read in a file, [D] derived, [B] bet.

## 0. What changed since v2

- **v2's engine problem is solved in the core.** In v2, Electron's sine and cosine differed from Node's on about 3.5 %
  of angles, so the app's night would not have matched the tools' (v2, section 3). Since then the core computes its
  own:
  - sine and cosine (E1);
  - ten more functions (E2a);
  - every power of `core/core.js` (the calibration epoch's B1).

  Each is fdlibm's, in plain arithmetic on doubles, and `tools/engine_tests.js` bans `Math`'s versions in `core/` [R].
  So the app, the tools and the page should compute the same night to the bit [D; section 4's test shows it].
  - v2's section 3 is done, and its open decision 7 is answered: the fix came first.
  - One loose end: `core/readers/section.js`'s four powers (the strength, outside the step) still use `Math.pow`. The
    onset's readout could therefore differ by a last bit between engines [B], until E2 takes them.
- **The goal is larger.** It is now a zip, plus the public repository updated to today, plus a GitHub release that
  carries the zip (section 5).
- **The page has grown.**
  - `dist/` is now 3.4 MB [M] (v2: 2.35 MB).
  - It still makes no `fetch`, starts its two workers from relative addresses, and keeps its security policy in
    `dist/_headers` [M].
- **The model is mid-calibration.** Stage D, the calibration epoch's one refit, lands as join 15 on 2026-11-23, and
  the first public release should carry it (section 7).
- **The browser suites can drive any Chromium deterministically.** The page has one clock (QC C-3), and a suite on it
  sees the same thing on a busy machine. So the app can be tested by the page's own suites (section 4).

## 1. The answer

- **The app is v2's in shape:**
  - Fathom's shell, copied (`C:\fathom\app\main.js`, 171 lines [M]);
  - the page inside it, unchanged;
  - a portable folder and a zip.
- **New: it is tested by the page's own browser suites,** not only by a smoke test.
- **New: the public release.**
  - A deny-list and privacy scan over the whole history.
  - The push to the public repository.
  - A tagged release with the zip, its sha256 and the User Guide's PDF.
- **Order.** After stage D, the Carpathia rerun (D5) and the guide's rebuild. Then the app, about a day [B]. Then the
  release, about half a day [B], plus Bo's sign-in.

## 2. What Bo gets

```
release/
  Titanic-win-x64/                 the portable folder: copy it anywhere, run Titanic.exe
    Titanic.exe                    Electron's runtime, renamed
    resources/app/                 main.js, package.json, dist/ (the page, 3.4 MB)
    data/                          her settings, made on the first run (v2, section 6.1)
    README.txt                     unzip first; what Windows may say on the first run; how to check a night
    LICENSE, LICENSE.titanic.txt, LICENSES.chromium.html
    runtime.json                   the runtime's version and the exe's sha256
  Titanic-win-x64-<version>-<commit>.zip
  Titanic-win-x64-<version>-<commit>.zip.sha256
```

- **The zip** is about 140 MB with English only (v2's measurement on Fathom's runtime [M]). The page adds a megabyte.
- **The GitHub release** has:
  - the zip and `SHA256SUMS.txt`;
  - the User Guide's PDF, which is the offline manual;
  - notes drawn from the CHANGELOG. They say what the model is, what is sourced and what is a bet, its uncertainty in
    "k of N" words (D85), and how to run it.
- **Portable means** no installer, no administrator rights, no registry, no browser, no port and no network (as in v2).
  Windows 10 or later, x64.

## 3. The shell

This is v2's section 4, re-read against Fathom's file today [M]:
- a scheme of its own (`registerSchemesAsPrivileged`, `protocol.handle`);
- every http, https, ws and wss request cancelled (`onBeforeRequest`);
- context isolation and a sandbox;
- `--smoke` and `--profile`.

For Titanic, as in v2:
- **No `preload.js`.** The page needs nothing from the main process.
- **One instance only** (`requestSingleInstanceLock`).
- **`--open=<fragment>`.** It takes the page's own address grammar (`#night=1912&...`).
- **The page's headers.** The scheme's handler sends `dist/_headers`' policy with every answer.

New in v3:
- **An About box.** It shows the version, the commit, Electron's version, and the 1912 watch's fingerprint, so anyone
  can check that their night is the model's.
- **A window for a large monitor first** (D84), with F11 for full screen. The phone templates are irrelevant here.
- **The debugging port for the tests.** Chromium's `--remote-debugging-port` works in the app as in any Chromium.
  Nothing opens it unless it is on the command line, which is how section 4's tests drive it.

## 4. The tests

- **D3, the self-test.** v2's list is kept:
  - the package holds this build;
  - WebGL is there and Node is not;
  - the console shows no error;
  - the window makes no request;
  - the GitHub link is hidden;
  - the copied link is the fragment;
  - `--open=` works;
  - a second start does not open a second window;
  - `data/` sits beside the exe.

  It now also requires that the 1912 watch's fingerprint inside the app equals the model run alone **in Node**: the
  equality v2 could only hope for.
- **D3b, the page's own suites against the app.** `tools/cdp.js` learns to launch a named executable (the packaged
  `Titanic.exe`, with the debugging port) in place of Edge. Then:
  - `night_site`, the real-time canary, runs against the app;
  - so does `director_site`, on the virtual clock;
  - their verdicts and the watch's fingerprint must equal Edge's run of the same `dist/`.

  Later, the whole browser battery (`gate --app`).
- **D6, a clean machine.** Windows Sandbox: a feature of Windows 11 Pro, which Bo enables (it changes the system, so it
  is his step).
  - Bring the zip in by a browser download, so it carries Windows' mark of the web, and unzip it there.
  - Run it, and write down what SmartScreen shows.
  - Run the self-test there.

## 5. The public release

### 5.1 The repository

- **The public repository** (the page's footer links it) is at `30c953b`, from 2026-10-08. Main is 399 commits ahead
  [M]. Pushing it publishes all of them, every intermediate state included.
- **Before the push:**
  1. **The deny-list over the whole history.** Every commit's added lines since `30c953b` get scanned, not only
     today's tree. Each join scanned its own changes, but a file added and removed between two joins was never in
     one. A script writes each commit's added lines into a scratch folder, and the deny-list script scans it. The
     result is 0 hits, or Bo decides how the history is rewritten before it goes public.
  2. **A privacy pass,** in the tree and in the history. It looks for:
     - user paths: a user folder's name can carry a private name;
     - the names on the deny-list;
     - e-mail addresses;
     - session ids and the notes folder's paths.

     Paths under `C:\code` are harmless.
  3. **The licences:**
     - R3's room tables are facts under their licence note, and no plan's image is in the repository;
     - the KCS hull and FluidX3D's setup stay outside it (as now);
     - three.js keeps its MIT notice, and the fonts keep their licences (they are in `dist/`);
     - Electron's and Chromium's licences go in the zip.
  4. **The README's front:** what she is, the release's link, how to run her, how to build her.
- **Full history or squashed?** Full history keeps every step traceable; a squash gives a clean start. Pick: full, if
  the scans are clean (Bo's call).
- **Sign-in.** The push needs Bo's sign-in for that account: this machine's `gh` knows only the private copy's
  account. The private repository stays as the backups' remote.

### 5.2 The release

- **Gate first.** `node tools/gate.js --release` (with the guide's check) passes first, as CLAUDE.md asks before a push
  or a deploy.
- **A clean build.** The release is built from the tag's tree alone. The packager refuses a dirty tree or a stale
  `dist/`.
- **The tag** is the version in `dist/version.json` (0.2.0 today), bumped for the release (Bo's call).
- **The assets** are section 2's, and the notes come from the CHANGELOG's entries since `30c953b`, condensed. Their
  words follow D22: never "she could have been saved" on one model.
- **The live site** (Cloudflare) is a separate step, also Bo's sign-in (BACKLOG section 3).

## 6. Not now

- **An installer, signing and updates** (v1's option C). Signing removes SmartScreen's "Windows protected your PC";
  until then the README says "More info, then Run anyway".
- **Mac and Linux.**
- **A smaller host** (a WebView2 shell of about 5 MB, or Tauri). With the core's own maths it would compute the same
  nights. But its drawing and speed would follow each PC's Edge updates, and Tauri needs Rust. For a public download
  the pinned runtime is worth its 140 MB.
- **v2's "Later" list stands:**
  - the engine out of the window;
  - saving and opening a watch as a file;
  - recording to video;
  - the guide from a Help menu;
  - a second window for the bridge;
  - the Carpathia search from inside the app.

## 7. The steps, in order, each with its test

| Step | What | Done when |
|---|---|---|
| D0 | Stage D (join 15), D5 and the guide's rebuild (join 16) | landed, the gate green |
| D1 | `app/main.js` (section 3) | the app opens the page in its own window from `titanic://app/` |
| D2 | `tools/package_app.js`: Fathom's, renamed. A pinned Electron, its version and the exe's sha256 in `runtime.json`; English only; `dist/` checked current first; the README and licences | `release/Titanic-win-x64/Titanic.exe` exists; a stale `dist/` refuses to package |
| D3 | `tools/app_test.js` with `--smoke` | section 4's list, the fingerprint equal to Node's model alone |
| D3b | `tools/cdp.js` drives the app; `night_site` and `director_site` against it | the same verdicts and fingerprints as in Edge |
| D4 | `--zip` in the packager | the zip and its sha256 written; unpacked to a folder with a space in its name and run, the self-test passes |
| D5 | rows `package` and `app` in `tools/gate.js` (outside `--quick`); CLAUDE.md's rule and Commands; `.gitignore`: `release/`; the guide's quick start | `GATE: PASS` with the two rows; the guide rebuilt in that commit (the Commands block is its input) |
| D6 | the clean machine (Windows Sandbox, Bo enables it) | unzipped and run there; SmartScreen's behaviour written into the README |
| R1 | the history's deny-list and privacy pass (section 5.1) | 0 hits, or Bo's decision on the history |
| R2 | the push to the public repository (Bo's sign-in) | the public main equals the private main |
| R3 | `gate --release`; the tag; the release and its assets | the release lists the zip, `SHA256SUMS.txt` and the PDF; a fresh download unzips and runs |

## 8. Decisions

Made by Bo:
1. An Electron app, portable, for Windows, as a folder and a zip (2026-11-20).
2. The public repository updated to this, with a release carrying the zip (2026-11-23).

Made here, for Bo to overturn:
3. The app comes after stage D, D5 and the guide, so the first public zip carries the calibrated model.
4. Electron, pinned (section 6 says why not WebView2 or Tauri).
5. The page's own suites run against the app (D3b), not a smoke test alone.
6. The full history, if the scans are clean.
7. No signing in the first release; the README explains the first run's warning.

Open, Bo's:
8. The full history or a squash.
9. Signing, later or never.
10. The first public release's version number.
11. Whether the live site is updated at the same time.

## 9. Not known

- Whether v2's unknowns still hold: the fonts and the policy under the scheme, and the page's speed in Electron
  against Edge. D3 shows them.
- The history scan's result (R1).
- What SmartScreen shows for this exe on a fresh PC (D6).
- Whether `section.js`'s `Math.pow` makes the onset's readout differ between Node and the app (D3b shows it; E2
  removes it).
- Which Electron is current and stable when D2 runs. The runtime on this machine is 45.2.3, copied from another
  project's `node_modules` [M]; v2 chose not to download one.
