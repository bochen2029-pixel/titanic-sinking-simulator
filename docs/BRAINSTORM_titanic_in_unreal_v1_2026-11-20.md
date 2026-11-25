# Brainstorm: the Titanic Sinking Simulator in Unreal, built the way an earlier Unreal project was (v1)

Written 2026-11-20 12:15 CST. Bo's order, in short: look over the last two weeks at how harness sessions built an earlier Unreal project on this machine by driving Blender and Unreal Engine 5.8 over MCP, and Android Studio; figure out how Blender and Unreal are driven there; then brainstorm how this might help make the Titanic Sinking Simulator in Unreal, with photorealistic graphics.

**This is a brainstorm. Nothing was built, no Unreal or Blender process was started, and nothing under `C:\code\UE58` was touched.** Revisions are new files (`..._v2_...`).
Tags: [R] read (file named), [M] measured this session, [D] derived, [B] bet.

## 1. What the earlier project proves

The earlier project is a C++ Unreal 5.8 game built almost entirely by harness sessions between 5 and 15 November: Blender generators, an Unreal project, scripted proofs, Windows packages and a Quest APK [R: its card]. A second project, subsim-art, reused the same route on 12 November to build and photograph a submarine [R: `areas\subsim-art.md`]. So the route is not a one-off: it has been walked twice on this laptop, by sessions, with the lights on.

The route, as the cards record it:

| Step | How it is done here | Source |
|---|---|---|
| The engine | Unreal Engine 5.8.4 at `C:\code\UE58\UE_5.8` (about 30 GB; the Android target was added 11 November) | [R: `areas\ue58.md`] |
| The editor, driven live | `pwsh -NoProfile -File C:\code\UE58\McpLab\tools\uemcp.ps1 launch -Project <uproject>`, then `wait`; Epic's own Unreal MCP plugin listens on `127.0.0.1:8000/mcp`, unauthenticated; the client's verbs are `toolsets`, `describe <toolset>`, `call <toolset> <tool> -ArgsFile <json>`, `status`; `-NoGpu` authors blind | [R: `areas\ue58.md`] |
| Blender | Blender 5.2 run **headless** by scripts: `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`. The models are written by generators (Python) from design files that hold every number; a check runs each generator twice and compares the bytes | [R: both cards] |
| Blender to Unreal | GLB out of Blender; an import **commandlet** inside the Unreal project brings the meshes in and builds the maps, with no editor window | [R: `areas\subsim-art.md`] |
| Seeing the result | a shot runner plays each map and photographs every camera named `Shot_*`; over MCP, `find_actors` and `CaptureViewport` | [R: `areas\subsim-art.md`] |
| One driver | one PowerShell script with verbs: the earlier project's `gen | eval | cpp | assets | all | run | proofs`; subsim-art's `gen | build | import | shots | sheet | all` | [R: both cards] |
| Proofs | scripted game runs (`tools\proofs\<name>.json`), a suite, one result file (`Saved\<project>\logs\proofs.json`) | [R: the earlier project's card] |
| Packages | Windows (`package_win64.ps1`, then a smoke test of the package) and Quest (`package_quest.ps1`, Gradle with a JDK 21); the APK exists | [R: the earlier project's card] |

Two things about this are worth more than the tooling:

- **Most of the work was not "driving the editor by hand over MCP".** It was generators, commandlets and scripted proofs, which rerun unattended and give the same bytes. MCP was the way to look and to poke. That is the same discipline this repository already has (tables of sourced numbers, a gate, tests that set causes).
- **The numbers come from design files, not from an artist's hand.** That is exactly what the Titanic's drawn ship has just become: `site/topsides.js` is one table of sourced numbers, and the hull is a function, `C.halfBreadth(x, z)` [R: this repository's `CLAUDE.md`].

The machine's limits, from the same cards: one Unreal process at a time on this laptop; the GPU is an integrated Intel Arc 140V that lost its device once on 3 November; the earlier project was to read right without Lumen; the standing rule since 6 November is "Unreal runs on this laptop: never ask whether it can". Nothing Unreal or Blender was running at 12:05 today [M].

Section 9 holds the tool-level detail a scout brought back from the earlier project's own files and the session record. It corrects the order's premise in two places: **Blender was never driven over MCP here, and Android Studio's window was never driven at all.**

## 2. The idea in one line

**Unreal becomes a second viewer of the same model.** The flooding, the motion, the ice, the plant and the night stay where they are, tested as they are. Unreal draws what the model says: her pose, the water in each of her 64 spaces, her lights from her dynamos, her wake from her speed.

This is the repository's own rule, not a new one: "The viewer reads snapshots only (`serialize()`). Keep that boundary" [R: `CLAUDE.md`]. A photoreal viewer that obeys it inherits every result the model has; one that reimplements the sinking inside Unreal's physics throws them away and becomes an animation again.

## 3. How the model reaches Unreal: four ways

| | Way | What it is | For | Against |
|---|---|---|---|---|
| 1 | **A recorded night** | Node writes one night to a file: at each quarter second the pose, the 64 levels, the events, the plant's outputs. Unreal plays it back on a timeline | no integration at all; a film of the 1912 night is possible in the first week; any frame can be rendered offline at film quality | not interactive: no helm, no what-ifs |
| 2 | **A sidecar** | The JS core runs beside Unreal (Node, or the Electron runtime of `docs/DESIGN_electron_desktop_client_v1_2026-11-19.md`), sends a frame a step over a local socket and takes orders back. Fathom already has this shape: its "seat port", frames out and orders in | the model is the tested one, to the bit; interactive; the web page and Unreal can show the same night at once | two processes to ship; no Quest standalone |
| 3 | **The C++ port** | `PORTING.md` already plans it, with `out/golden_titanic.json` as its acceptance; in Unreal it is a module | one process; packages for Windows and a headset | the largest job, and the rule stands: never port and change physics in the same change. While the model is still growing (staircases, the break, the fall) the port chases a moving target |
| 4 | **JavaScript inside Unreal** | a small JS engine embedded in the game runs `core/*.js` unchanged | one process, no port | a third engine with its own last bits (the app's Electron already differs from Node: the Electron note, section 3); plugin upkeep |

**My order: 1, then 2; 3 only when the model has settled; 4 not at all.** Way 1 is also the right first proof for a session: it tests the art pipeline and the look without touching the model.

## 4. Building her: the Titanic's kit

The pattern is the earlier project's and subsim-art's, with this repository as the design file.

1. **Export the ship as numbers.** A new tool here (`tools/export_ship.js`) writes one JSON: the hull's sections from `C.halfBreadth` at every station, the decks' heights and sheer, the bulkheads, and everything in `site/topsides.js` (houses, funnels, masts, davits, boats, the domes at `C.STAIRS`). The web viewer and Unreal are then built from the same table, and a change to a sourced number moves both.
2. **Generators in headless Blender** read that JSON and build the meshes: the shell with its plating laps and strakes, the decks' planking, the houses with their windows, the funnels with their stays, the boats under their davits. Detail that is not in the table is the generator's and is marked as appearance, as the web viewer marks it.
3. **Parts keyed to the model.** Every porthole and window carries which deck and compartment it is in, so its light can go out when the dynamos stop or when it goes under; every watertight space is a named volume, so its water can be drawn at the model's level. This is what lets the picture follow the model without a person placing anything.
4. **Import by commandlet, photograph by shot runner,** as subsim-art does.
5. **A check that is not taste:** the same snapshot drawn by the web viewer and by Unreal from the same camera must give the same silhouette, and the waterline measured on the Unreal hull at each station must be the model's draught there.

What this does not give is interiors. A grand staircase, a boiler room or a Marconi room at film quality is art work of another order; the plan should name the two or three that matter and leave the rest dark.

## 5. What Unreal buys

| Want | Unreal's means | Fed by |
|---|---|---|
| The sea on a flat calm night, the stars in it | the Water plugin's ocean or a custom surface; sky atmosphere and a star catalogue | the night's date and place (backlog N1) |
| Her wake | a height and foam field written each frame into a render target | the computed wake (`docs/BRAINSTORM_the_wake_computed_v1_2026-11-19.md`): the wave packets become a texture |
| Smoke, steam, the roar from her escape pipes | Niagara | the plant's fires and blow-off |
| A hull with every rivet | Nanite | the generators |
| Her lights failing deck by deck, their reflection on the water | emissive windows keyed as in 4.3; Lumen where the machine allows | the dynamos and the levels |
| Water rising inside her | a surface in each named volume, with the hull as its boundary | the 64 levels |
| The break and the fall | two parts under two poses; Chaos only for loose debris | `docs/DESIGN_the_break_and_two_bodies_v1_2026-11-19.md`, `docs/BRAINSTORM_the_descent_to_the_bed_v1_2026-11-19.md` |
| A film | Sequencer and the Movie Render Queue, offline, at any quality | a recorded night (way 1) and the director's cut list |
| Being there | a headset: the boat deck, a lifeboat, the crow's nest | the earlier project already packages for a Quest |
| What she sounded like | MetaSounds | the sound part's laws (`site/parts/30_sound.js`) |

Two cautions. Unreal's own buoyancy and Chaos destruction must not move her: the moment they do, the picture stops being the model. And "photorealistic" on this laptop means offline renders and a modest real-time view; real-time film quality needs a discrete GPU.

## 6. How a session would drive it

1. A new repository of its own, beside this one (for instance `C:\code\titanic-unreal`), with the engine used where it is. subsim-art keeps its project out of `C:\code\UE58` on purpose, and the earlier project is kept apart from this one [R: `areas\ue58.md`].
2. One driver script with the same verbs: `export` (the JSON from this repository), `gen` (Blender), `build` (the editor target), `import` (the commandlet), `shots`, `proofs`, `all`.
3. Look before starting anything: `Get-Process UnrealEditor*, blender`. One Unreal at a time; the earlier project's lane may be live.
4. Reuse `C:\code\UE58\McpLab\tools\uemcp.ps1` for live looks; keep one writer session per editor, since the MCP server has no authentication.
5. Every proof is a scripted run with a result file, and the suite is a gate, as here.
6. The first commandlet run of a new project writes an Android File Server token into its `Config\DefaultEngine.ini`; turn that plugin off and remove the section before the first commit [R: `areas\ue58.md`, `areas\subsim-art.md`].

## 7. A first month, in stages

| Stage | What | Done when |
|---|---|---|
| U0 | `tools/export_ship.js` here, and a recorded 1912 night as a file | both are byte-stable across two runs |
| U1 | The hull and topsides generated in Blender from the export; imported; four stills (broadside, bow quarter, plan, stern quarter) by day | the silhouette check of 4.5 against the web viewer |
| U2 | The sea, the sky of that night, her lights; the recorded night played back: pose and waterline only | waterline at ten stations within 0.1 m of the model through the night |
| U3 | The water inside her, the lights failing, smoke and steam | each driven by its number in the record, shown by a proof |
| U4 | A film of the night from the director's cuts, rendered offline | Bo watches it |
| U5 | The sidecar: the live model, the helm and telegraph | a watch played in Unreal has the fingerprint of the model run alone |
| U6 | The wake, the break, the fall, a headset | as their own notes land |

U0 to U2 need nothing from the model's open work and can run beside it.

## 8. What stands in the way

- **Scope.** Art is bottomless. The stages above are bounded by what the model can drive; anything else waits for Bo's word.
- **Two viewers.** The export is what keeps them one ship. Without it they drift within a week.
- **The machine.** One Unreal at a time, an integrated GPU, 30 GB of engine. Long runs belong to quiet hours.
- **Licences.** Unreal is free to use and takes a royalty on commercial revenue above a threshold [B: from memory; read the current EULA before any release]. No models or textures taken from other Titanic projects or the film: everything generated here from sourced numbers.
- **The boundary with the earlier project.** Its files, agents and proofs are not to be touched or resumed by a Titanic session.
- **The model is moving.** At this writing the checkout has another session's uncommitted work in `core/`. The export and the record must name the commit they came from.

## 9. Tool-level detail from the earlier project's own files and the session record

Everything in this section is tagged [S]: read or measured by a read-only scout (an Opus 5.5 subagent of this session) on 2026-11-20 between 12:00 and 12:14 CST, from the earlier project's files, McpLab's files and `everywhen` over 336 hours. I did not re-verify it line by line. Paths: OW = the earlier project's folder, ML = `C:\code\UE58\McpLab`.

### 9.1 Corrections to the order's premise
- **No Blender MCP exists on this machine.** No add-on is installed (there is no Blender user profile folder at all), and the session record has no hit for its tool names in two weeks. The earlier project's lead session said on 12 November: "Blender 5.2: yes, headless through Python scripts ... No Blender MCP add-on is installed, and I don't need one."
- **Android Studio's window was never driven.** The scripts used only its SDK (`adb`, `aapt2`, `sdkmanager`). Bo added the engine's Android target in the Epic Launcher himself.
- **No session has an Unreal or Blender MCP server registered.** The only registration is `ML\.mcp.json` (`unreal-mcp`, http), which applies to sessions started in McpLab. Everything else went through the PowerShell client.
- **The earlier project is idle and committed**, not live. (Section 1's cards are from 11-13.)

### 9.2 Blender, exactly
```
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --factory-startup --python-exit-code 1 --python <gen.py> -- --root <project> [--preview]
```
- Nothing needs to be running; each generator is its own process, 15 to 30 seconds. Success is exit 0 and a printed `GEN_OK <name>`.
- A generator builds from a small kit of primitives (`OW\blender\owkit.py`: box, rounded box, cylinder, tube, loft, surface, revolve, extrude, sphere, mirror), then finishes, joins, bakes occlusion and exports.
- The contract (`OW\blender\README.md`): one GLB per thing; material slots from one fixed list; vertex colour carries tint and baked occlusion; UVs in metres; a small JSON beside each mesh; the same bytes on every run.
- Known faults: touching solids bevel badly, lofts can come out inside-out.

### 9.3 Unreal, exactly
| Job | Command | Note |
|---|---|---|
| Compile C++ | `Build.bat <Target>Editor Win64 Development -Project=<uproject> -WaitMutex -NoHotReload` | the first module took 113 s |
| Import and build assets | `UnrealEditor-Cmd.exe <uproject> -run=<YourBuild> -nullrhi -unattended -nosplash -nop4 -stdout -FullStdOutLogOutput` | a C++ commandlet in an editor module: imports GLB through Interchange, makes materials, LODs and collision in code; 116 meshes in 16 min |
| Run the game | `UnrealEditor.exe <uproject> /Engine/Maps/Entry -game -log -nosplash -windowed -ResX=1536 -ResY=864 -nohmd` | not play-in-editor |
| A proof | the same plus `-Script=tools/proofs/<name>.json -nosound -RenderOffScreen` | started with `Start-Process -Wait`; the log's marker lines are then read |
| A screenshot | a step `{"shot":"<name>"}` in the proof | the game requests it; a PNG lands in `Saved\...\shots\` |
| Package | `RunUAT.bat BuildCookRun -project=<uproject> -noP4 -platform=Win64 -clientconfig=Development -build -cook -iterate -stage -pak -archive -archivedirectory=<dist> -prereqs -unattended -utf8output -nocompileeditor` | the whole chain to an APK took 33.7 min |

The earlier project has no saved level and no Blueprint logic: the game opens the engine's empty map and builds its world from JSON files. That is why a session could make all of it as text.

**The MCP route (secondary).** Epic's experimental plugin `ModelContextProtocol`, with `EditorToolset`, serves `http://127.0.0.1:8000/mcp`. It starts with the editor when the project's `Config\DefaultEditorPerProjectUserSettings.ini` says `bAutoStartServer=True`. It offers three meta-tools (`list_toolsets`, `describe_toolset`, `call_tool`) over 19 toolsets, among them scene, actor, asset, static mesh, material, Blueprint and editor-app tools (`find_actors`, `set_actor_transform`, `import_file`, `CaptureViewport`, `SetCameraTransform`, `StartPIE`). A real call:
```
pwsh -NoProfile -File C:\code\UE58\McpLab\tools\uemcp.ps1 call editor_toolset.toolsets.static_mesh.StaticMeshTools import_file -ArgsFile tools\examples\<import>.json
```
Its limits: `import_file` reads FBX only and will not overwrite; a viewport capture is too large for a native MCP result, so captures go through the client, which saves them as files; an unfocused editor answers at about three frames a second.

### 9.4 Blender to Unreal
- GLB, Y up, with vertex colour. Modelled in metres, at the origin, facing +X. One conversion, measured with a test cube: Unreal centimetres = `[x * 100, -y * 100, z * 100]`.
- LODs by reduction to 100, 36, 12 and 4.5 per cent of the triangles; collision by rule per kind of object.
- Rendering differs by project. The earlier project (headset first) renders forward with Lumen, reflections and virtual shadows off, and Nanite off at import. subsim-art (a desk picture) kept Lumen at about 35 frames a second on this GPU. The Titanic is the second kind.

### 9.5 Pitfalls that would bite a Titanic session
- **A sandboxed shell hangs Unreal** at "Waiting for ZenServer to be ready". Unreal must be run with the harness's sandbox off.
- **The lock.** One Unreal on the laptop at a time: `C:\Temp\ue_laptop_lock.txt`, one line `<session> <what> <HH:mm> <minutes>`, kept by `OW\tools\laptop_lock.ps1`. subsim-art and jet-art use the same lock. Never compile while a game, a commandlet or a packager runs.
- **Low-priority jobs stall** on the four efficiency cores (one mesh took seven minutes); `OW\tools\fullspeed.ps1` is the cure.
- **The GPU dropped its device once** in the editor (3 November). Author with `-nullrhi`; only captures need the GPU.
- **A new project's first commandlet run writes an Android File Server token** into `Config\DefaultEngine.ini`: turn that plugin off in the `.uproject` and delete the section.
- **PowerShell:** `& UnrealEditor.exe` does not wait; a list after `-File` breaks; a local variable can overwrite a parameter of the same name in another case.
- **Human-only steps:** the Launcher's target platforms; any download or install (Bo's word each time); a headset's developer mode and the headset test.

### 9.6 What is reusable as it stands
- The engine with its Android target, the SDK, NDK 27.2, a JDK 21, Visual Studio 2026.
- `uemcp.ps1 -Project <any uproject>`, the lock, and the pattern: headless generators, a C++ import commandlet, a world from JSON, scripted shot proofs, packaging scripts.
- **The closest template for a ship is subsim-art** (`C:\code\subsim-art`, `tools\art.ps1 gen|build|import|shots|sheet|all`): a build commandlet, a shot runner, Lumen at a desk.
- To set up afresh: a `.uproject` with the two MCP plugins on and Android File Server off; the two ini blocks; an editor module for the commandlet; a slot-to-material map.
- **Nothing for water was found**: no ocean, no buoyancy tooling in any of the three projects [S: a bet, by its own word]. The sea is new ground.

### 9.7 The machine
Dell 16 Plus, Intel Core Ultra 9 288V (8 cores), 31.6 GB of memory, an integrated Intel Arc 140V as the only GPU, 1,076 GB free on C:. Unreal 5.8.4 (the only install), Blender 5.2, Visual Studio 2026.

### 9.8 What the scout could not find
- The full names of all 19 toolsets, and the exact arguments of the live MCP calls of 12 November: `everywhen` cuts tool text at about 200 characters.
- It did not open the engine's plugin sources, the saved logs, or most of the earlier project's game code.

## 10. What section 9 changes in the brainstorm

1. **Drop the idea of "driving Blender over MCP".** The Titanic's generators should be headless scripts from the first day, as section 4 already assumes. Nothing needs installing.
2. **The session's shell must be unsandboxed for Unreal**, and it must take the laptop lock. Both go in the new repository's rules.
3. **Start from subsim-art's tree, not the earlier project's.** It is a ship, at a desk, with Lumen, and it is Bo's own.
4. **The sea is the real unknown.** Hull, houses and lights follow a walked path. The ocean, the wake on it and the water inside her do not; stage U2 should be split so the sea gets its own proof before anything depends on it.
5. **A world from JSON suits the model exactly.** The earlier project builds its world from files at start-up; the Titanic's Unreal viewer can build the ship from the export and move it from the record the same way, with no saved level to drift.

