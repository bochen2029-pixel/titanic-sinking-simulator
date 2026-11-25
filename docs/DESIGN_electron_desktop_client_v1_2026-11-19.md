# A desktop app like Fathom's: what it takes (investigation, v1)

Written 2026-11-19 14:57 CST. Bo's order: "do not touch the disk, but scan the repo to investigate the best way to make this a full Electron client, like my submarine sim, `C:\fathom`", then: "write this down as markdown inside the repo".

**Status: investigation. Nothing was built, and the scan wrote nothing.** This file is the only thing added. Revisions are new files (`..._v2_...`).
Tags: [M] measured this session, [R] read (file and line), [D] derived, [B] bet.

A caution about the tree: at the time of writing, 21 tracked files in this checkout are modified and uncommitted by another session (the staircase work: `core/core.js`, `site/app.js`, the tools, the papers). The page's files were read as they stand; the one test (section 3) was run on a clean worktree of the committed tree, `a97a6bd`.

## 1. The answer

Copy Fathom's shell almost unchanged. The Titanic page already fits it: it makes no network calls, and every script, font and worker comes from its own folder. About a day of work [B], most of it the app's self-test.

The one finding that needs a decision before anything is built: **the app's engine does not give the same bits as the tools' engine** (section 3).

## 2. How Fathom does it

| Piece | Where | What it does |
|---|---|---|
| Main process | `C:\fathom\app\main.js` (171 lines) | serves `dist/` to one window under a scheme of its own, `fathom://app/`, registered as standard and secure (`:22`), so the page is a secure origin with its own storage and can load its own workers, which a `file:` page cannot; cancels every http, https, ws and wss request from the window (`:117`); the window is sandboxed, context-isolated, with no Node in it (`:122`); new windows are denied and navigation off the origin is stopped (`:124-125`); F11 full screen, F12 developer tools; `--patrol=N` opens a given patrol (`:131`); `--smoke` makes the app exercise itself and write a report (`:138-168`) |
| Bridge | `C:\fathom\app\preload.js` (22 lines) | the only things the page may ask of the main process (for Fathom: keeping a voice key, speech in and out) |
| Packaging | `C:\fathom\tools\package_app.js` (43 lines) | Electron's "manual packaging": copies a runtime already on this machine, renames `electron.exe`, deletes the default app, writes `resources/app` (a small `package.json`, `main.js`, `preload.js`, `dist/`). Nothing is downloaded or installed. It stamps the runtime's version in `runtime.json` and copies the runtime only when the version changes |
| Test | `C:\fathom\tools\app_test.js` | checks the package holds this build, launches the exe with `--smoke`, reads the report |
| Gate | `C:\fathom\tools\gate.js` | two rows, `package` and `app`, left out of `--quick` |

On this machine [M]: the runtime is Electron 45.2.3, copied from `C:\code\ATC\apps\desktop\node_modules\electron\dist` (still there). The packaged folder is 358 MB; the exe alone 238 MB. No installer, no code signing, no update mechanism, Windows x64 only.

About half of Fathom's main process is voice (the Deepgram key and sockets). The Titanic has no voice, so its main process is about 80 lines [B].

## 3. Measured: the app's engine gives different bits

`tools/seams.js` on the committed tree, the same files, two engines [M]:

| Engine | titanic | britannic | hawke | Verdict |
|---|---|---|---|---|
| system Node v26.13.0 (the engine the references were frozen on) | SAME, 37,762 steps | SAME | SAME | PASS |
| Fathom's Electron 45.2.3 runtime run as Node (it reports Node v24.22.2) | DIFF, 37,761 steps | DIFF | DIFF | FAIL: 3 checks |

The 1912 run founders one step earlier in the app's engine. Inside Electron the window and the main process share one V8, so the page in the app will run on the engine of the second row.

What follows:
- Every fingerprint frozen under system Node will not match inside the app: the seams and headway references, the 1912 watch's fingerprint in `tools/systems_tests.js`, the Carpathia baseline.
- A watch replayed in the app will not match the same watch in Edge or in the tools to the bit. A shared link still opens the same night with the same orders; its last digits differ, and near the end that can be a step.
- This is the open backlog item X1 ("the same bits in every engine"; `tools/seams.js:11-13` already says the reference is engine-specific because of `Math.pow`).

Two ways to live with it:

| | What | Cost |
|---|---|---|
| a | **The app is a second engine, checked only against itself.** Its self-test compares the page's watch with the model run alone, inside the app, as the browser suites already do in Edge | none beyond the test |
| b | **The app's runtime becomes the reference engine.** The gate is run under the packaged exe as Node, and every reference is refrozen there. Then the page, the forecast worker and the tools share one pinned engine, which no browser can promise | a refreeze of every reference, said in the commit; the web page then differs from the reference instead |

My pick is (a) now. (b) is worth it only once the desktop app is the main way the simulator is used.

## 4. What the Titanic page needs

What already fits [R]:
- `dist/` is 26 files, 2.3 MB: one page, one app bundle, one forecast worker, one stylesheet, three.js r128, six fonts, icons.
- No `fetch` anywhere in `site/`. The validation data is inlined in the app bundle (`tools/build_site.js:85`).
- The workers are started from a relative address (`site/app.js:1401`, `:1647`), which a standard custom scheme serves.
- `localStorage` is used for two small settings (`site/parts/30_sound.js:79`, `site/parts/60_reports.js:29`), which is why the scheme must be a real origin, as Fathom's is.
- No service worker, no cookies, no IndexedDB.

What needs a change:

| # | What | Where | Fix |
|---|---|---|---|
| 1 | The content-security policy and the other headers are in `dist/_headers`, which only Cloudflare reads | `dist/_headers` | the app's scheme handler sends the same headers with every response |
| 2 | The footer's link to GitHub would do nothing: the shell denies new windows and outside navigation | `site/index.template.html:315` | an allow-listed "open in the system's browser" call through the bridge |
| 3 | "Copy a link to this watch" builds the link from the page's own address, which in the app is `titanic://...` and opens nowhere else | `site/parts/40_night_end.js:56` | emit the public web address when in the app; or register the scheme with Windows so such links open the app; or both |
| 4 | Opening a given night or scenario: the page reads `#night=`, `#kn=`, `#level=`, `#scenario=` and `#log=` from its address | `site/app.js:2638-2639`, `site/parts/40_night_end.js:60` | pass them on the command line, as Fathom's `--patrol` does |
| 5 | `dist/` is behind the sources | `dist/version.json` says built from `b25f72d`, sources not committed | `node tools/build_site.js` before packaging; the app test should refuse a stale package, as Fathom's does |

Not checked: whether the three fonts preloaded with `crossorigin` (`site/index.template.html:26-28`) load cleanly under a custom scheme. The first smoke run shows it; if not, the scheme needs the CORS privilege or the attribute goes.

Harmless leftovers in the app: `robots.txt`, `404.html`, `og.png`, the web manifest.

## 5. Three ways to build it

| | What | For | Against |
|---|---|---|---|
| A | **Fathom's shell, copied.** The page runs unchanged in one window and steps its own sim | proven on this machine; nothing downloaded; the smallest change; the web page and the app stay one `dist/` | 358 MB per app; Windows only; no installer, signing or updates |
| B | A, plus the engine moved out of the window into a worker process of the app; windows draw from snapshots | physics off the drawing thread; several windows on one night (a bridge and an outside view on two screens); the Carpathia search and the sweeps run inside the app on all cores | a real refactor: `site/app.js` steps the sim itself today. The repository's rule that the viewer reads snapshots only (`serialize()`) is the seam for it |
| C | Standard tooling (an installer, code signing, updates) | what handing it to other people needs | `npm install` and downloads; this checkout has no `node_modules` at all [M] |

**Do A now.** B is what "fully Electron" should come to mean, and the break, the descent and the computed wake (this folder's other notes of 2026-11-19) are the reason for it: each wants compute that should not share a thread with the picture. C only when it is to be given away.

An alternative outside the order, for the record: a small C++ host around Windows' own WebView2 would be well under a megabyte instead of 358 MB. Its engine is whatever Edge is that week, so section 3's problem gets worse, not better, and nothing of Fathom's carries over.

## 6. What A adds to the repository

- `app/main.js`, `app/preload.js`: Fathom's, less the voice half, with fixes 1 to 4 of section 4.
- `tools/package_app.js`: Fathom's, renamed (`release/Titanic-win-x64/Titanic.exe`).
- `tools/app_test.js`: the package is this build; the page loads with WebGL and no Node in it; a 1912 watch steps and its fingerprint equals the model run alone in the same engine; the window makes no network request; the two links behave as section 4 says.
- `tools/gate.js`: rows `package` and `app`, outside `--quick`.
- `CLAUDE.md`: one rule and two commands; `.gitignore`: `release/`.
- The User Guide: a short chapter or a paragraph in the quick start.

The page's sources change in two places only (the link and the share address), each behind a check for the bridge, so the web page behaves as before.

## 7. What a desktop app could do that the page cannot (after A)

- Save and open a watch as a file; export the log and the charts.
- Record the night as a video file from the window itself.
- Open the User Guide's PDF from a Help menu, offline.
- Full screen on a chosen monitor; a second window for the bridge.
- Run the Carpathia search (`tools/carpathia.js`, about 90 minutes on six threads) from inside the app, with its progress on screen.
- Hold one engine fixed for years, whatever browsers do (section 3, option b).

## 8. To decide

1. The engine: (a) a second engine checked against itself, or (b) the reference. Section 3.
2. The shared link: the public address, a `titanic://` link, or both. The first needs the public address to exist (the site is not deployed under a domain yet: `wrangler.toml`).
3. Whether the 358 MB runtime is copied a second time beside Fathom's, or one runtime is kept for both apps. Fathom's packaging fixes one app per runtime; sharing would need a small launcher.

## 9. Not known

- Whether the fonts load under the custom scheme (section 4).
- How the page performs in Electron 45 on this laptop's integrated GPU compared with Edge; not measured.
- Whether an unsigned exe runs on machines other than this one without a warning.
- The size of the release when zipped.
