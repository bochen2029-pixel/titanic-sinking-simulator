# Run sheet: U2's sea proof in Unreal, on Bo's RTX machine

Bo runs it himself, in a plain PowerShell 7 window. That was his word on 2026-11-20 at 14:57 CST: "Yes, I'll run it".

## For Bo: the four commands

**Before you start, have:**
- Unreal Engine 5.8, from the Epic Launcher;
- PowerShell 7, Node.js 20 or later, and Git;
- this repository pulled at main after join 2;
- no other Unreal running on that machine.

Blender 5.2 is optional. If it is not installed, first copy the laptop's folder `C:\temp\titanic-u2` to `C:\temp\titanic-u2` on this machine.

In PowerShell 7, go to the repository's folder, then paste these one at a time, in order:

```
pwsh -NoProfile -File tools\unreal\u2.ps1 setup
pwsh -NoProfile -File tools\unreal\u2.ps1 inputs
pwsh -NoProfile -File tools\unreal\u2.ps1 proof
pwsh -NoProfile -File tools\unreal\u2.ps1 check
```

| # | Takes | Success on screen ends with |
|---|---|---|
| 1 `setup` | seconds | `[u2] project ready: C:\code\titanic-unreal\TitanicSea\TitanicSea.uproject`, then `[u2] setup: done` |
| 2 `inputs` | about a minute | `[u2] inputs ready in C:\temp\titanic-u2`, then `[u2] inputs: done` |
| 3 `proof` | 2 to 10 minutes the first time (Unreal runs hidden: no window opens) | `[u2] U2_OK 6 steps, ...`, then `[u2] proof: done` |
| 4 `check` | seconds | `PASS: U2's sea proof: every step within 0.1 m (worst ... m)`, then `[u2] check: done` |

**Then bring back three files**, all from `C:\temp\titanic-u2\` on that machine:
- `u2_result.json`
- `u2_unreal.log`
- `u2_check.txt`

Put them on the laptop in `C:\temp\titanic-u2-back\`. The U0 lane scans them there with the deny-list, then reads them and reports.

**If a step fails**, its last lines say `FAILED` and name what to send back:
- `C:\temp\titanic-u2\u2_<that step>.txt`;
- for `proof`, also `C:\temp\titanic-u2\u2_unreal.log`.

Bring that file (or both) to the same laptop folder, `C:\temp\titanic-u2-back\`. Try nothing else: the fix is made on the laptop and comes back in the code.

---

## What the proof shows (for the record)

It shows that her hull, posed by the recorded 1912 night, stands in Unreal where the model says, and that its waterline is the model's waterline. The test is U2's own, from the plan (`docs/BRAINSTORM_titanic_in_unreal_v1_2026-11-20.md`, section 7): every point within 0.1 m. Section 10.4 of the plan calls the sea "the real unknown".

**The steps checked:** six of the night: the watch's start, the touch, one hour, two hours, the onset of the break, and the hand-over, the record's end (since G12's cascade the onset itself on a default record, so that step is checked twice; the founder flag on a record made with `--flag`).

**The points:** the height above the sea of her keel at ten stations and of her B-deck edges at four, both sides; and where four markers stand.

**Proof A, which must pass: the chain of frames.**
1. Unreal imports the GLB (`tools/blender/build_ship.py`).
2. It measures the importer's axis mapping itself, by four markers built into the GLB at known ship points.
3. It poses her through that mapping by the record's own pose: R = Ry(pitch) Rx(roll), t = [XO, YO, zO] - R g0.
4. Unreal's own transform says where her points are.

**Proof B, exploratory: the sea itself.** A Water plugin ocean answers where its surface is under each point (`GetWaterSurfaceInfoAtLocation`). If the ocean cannot be built headless, the result says why, and proof A still stands.

**The expectations** come from the record alone (`tools/u2_expect.js`). Its `--selftest` proves the check: the same numbers pass, and 0.2 m off fails. At the start it puts the bow's keel 9.37 m down and the stern's 10.28 m (Wilding's drafts).

## The rules that come with Unreal (the plan's section 9)

- One Unreal process at a time. `proof` refuses to start if one is running, and never stops one it did not start.
- `proof` writes its line in `C:\Temp\ue_laptop_lock.txt` and clears it after. The lock applies on this machine too.
- No harness and no sandbox: a plain PowerShell window. A sandboxed shell hangs Unreal at "Waiting for ZenServer to be ready".
- The proof runs with `-nullrhi`, so it uses no GPU. Only pictures need the RTX.
- `setup` turns the Android File Server plugin off. Before the first commit of `C:\code\titanic-unreal`, check that `Config\DefaultEngine.ini` holds no token section.
- Nothing from that machine enters this repository unscanned: the results come back to the laptop first. The deny-list never leaves the laptop.

## For the session that fixes a failure (on the laptop)

`tools/unreal/u2_sea.py` was written where Unreal does not run, and it reports the stage it stopped at: `import`, `mapping` or `steps`.

| What it reports | What to change |
|---|---|
| no static mesh | Interchange may have made a scene asset: collect the import another way |
| the markers' names not found | match the importer's names |
| the mapping not 100 cm a metre, or not square | the importer moved the pivots: import as a scene, or read the vertices |
| the ocean unavailable | build it in the editor with a water zone: the sea's own next step |

`u2.ps1` options:
- `-Out` (default `C:\temp\titanic-u2`);
- `-Project` (default `C:\code\titanic-unreal\TitanicSea`);
- `-Engine` (default `UE_ROOT`, else `C:\Program Files\Epic Games\UE_5.8`, else the laptop's `C:\code\UE58\UE_5.8`);
- `-Blender`;
- `-Water 0` (proof A alone);
- `all` runs the four steps.

## After the proof

U2 proper, on the RTX machine:
- the sea's look and the sky of that night;
- her lights from the plant (`channels.plant.lights`);
- the night played back, pose and waterline;
- its test: her waterline at ten stations within 0.1 m through the night.

U4's film of the night comes after.
