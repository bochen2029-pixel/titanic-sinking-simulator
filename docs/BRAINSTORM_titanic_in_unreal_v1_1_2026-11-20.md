# Brainstorm: the Titanic Sinking Simulator in Unreal (v1.1: what U0 settled)

- **Written:** 2026-11-20 13:54 CST, by the U0 lane (Claude Code, Opus 5.5), a session started by the group's coordinator after Bo's word at 13:22 CST: "yes go ahead, start U0 in a new lane".
- **Status:** U0 is built and tested on the lane's branch (`claude/u0-export-af54fe`), not yet joined. Its choices are the lane's own, under Bo's standing word for the group ("yes commit on own branch etc; for everything else you can decided on my behalf or in leui of that, have it decide on its own, i'm fine with either /any choices"). Everything after U0 is still a brainstorm: nothing here decides U1 to U6.
- **Supersedes:** `docs/BRAINSTORM_titanic_in_unreal_v1_2026-11-20.md`, which stands unchanged beside this file. It was committed as it stood at 13:53 CST.
- **Lineage:** v1 (12:15 CST, written in the brainstorm's own session) → v1.1 (this file, written by the U0 lane).

Tags as in v1: [R] read, [M] measured this session, [D] derived, [B] bet.

## Changes in v1.1

1. **U0 is done** (v1's section 7, first row). It has three parts:
   - `tools/export_ship.js` writes `titanic_ship.json`;
   - `tools/record_night.js` writes `titanic_night_1912.json`;
   - `tools/export_tests.js` is their suite.

   Both files come out byte for byte the same from two runs, each in a process of its own [M].
2. **v1's section 8 asked that "the export and the record must name the commit they came from". This changes: they name each source file by its git blob id.**
   - A file that is the same bytes every time cannot hold the commit that will contain it.
   - A commit cannot describe a tree with uncommitted changes.
   - A blob id names the exact source either way, and `git log --all --find-object=<id>` finds the commits that hold it [D].
   - The tools print the HEAD and whether their sources are committed, in their output beside the file, not inside it.
3. **v1's section 3, way 1 ("at each quarter second"): kept, now on a measurement.** I took the recorded watch and drew straight lines between samples taken further apart [M]:
   - every second step (0.5 s) misses her waterline by 4.8 cm in her last minute, and the water's level in a space by 0.9 m;
   - every fourth step (1 s) misses her waterline by 8.5 cm at the touch.

   U2 asks for 0.1 m, so the record keeps every step. That makes 19.5 MB for the 1912 watch, which is not tracked in git. The tracked file is `out/export_tests.txt`, the suite's table, which holds the files' sizes and sha256.
4. **The fall to the bed can be recorded now (v1's section 7, U4 and U6).** `tools/record_night.js --fall` records the fall engine (`core/readers/fall.js`, contract v: 2), begun at the founder flag as the page begins it today.
   - The bow comes to rest 5.1 min after the flag, 1,461 m from the point under the break [M].
   - The stern comes to rest 7.9 min after the flag, 208 m from that point [M].
   - The record labels the rule H1 as interim: the break is taken at the flag.
   - Without `--fall`, the record's `fall` stands empty, in the same form, until Z3 joins the fall to the watch.

   So U4's film could run to the bed, marked interim. U6 keeps the break itself (B3, B4), the wake and the headset.
5. **v1's section 4.5 check already runs headless, without a renderer** ("the waterline measured ... at each station must be the model's draught there"). U0's suite computes her waterline at ten stations from the record alone, using the frames the file states. At eight chosen steps, from the start to the flag, it lies within 0.5 mm of the model [M]. U2's test can read the record the same way.
6. **v1's section 9.4 axis note is the generators' business.** That note gives Unreal centimetres as `[x * 100, -y * 100, z * 100]`. The export keeps the model's own frames and states them in the file [D]:
   - the ship frame: x forward, y to port, z up from the keel;
   - the core's world;
   - the earth: X north, Y east, the heading clockwise from north.

## The answer in one paragraph

U0 gives Blender and Unreal what they need from this repository as two files.
- **The ship as numbers** (621 KB):
  - the model's own hull, sampled at every metre and every quarter metre of height;
  - the decks and tiers, the 64 spaces and every opening of the flow network;
  - the drawn ship above the hull, with each source's tags ([read], [scaled], [bet], [appearance]) carried path by path;
  - the screws, the rudder, and the lights keyed to their deck and compartment.
- **The 1912 watch, step by step** (19.5 MB; 19.8 MB with the fall).

Both are made in seconds from the sources and come out the same bytes every time. Both are checked against the model: the record's fingerprint is the model's own, run alone, at the end of the encounter (`d3b28ba7`) and at the flag (`611be326`) [M].

The stages are unchanged, with two exceptions: the fall is available early, and the files name their sources by blob id instead of by commit.

## What the files hold (for U1 to U3)

**`titanic_ship.json`**
- The frames and the units, stated in the file.
- The hull, drawn two ways:
  - `C.halfBreadth` at x -139 to 131 m (every metre) and z 0 to 32 m (every quarter metre);
  - the drawn shell (`TS.hullDraw`) aft of x -75, where it can differ.
- The stem and the stern, every deck's height at every station, the wells, and the tiers above B deck.
- The subdivision: 15 bulkheads, 16 compartments and the 64 spaces, with what each space holds.
- The flow network at the start of the night: 276 connections, and the 100 weather openings by id.
- `site/topsides.js` whole (its N table, the round stern, the davits), plus what its builders derive:
  - each funnel's seat and top, and the points the smoke and steam leave from;
  - the masts, the crow's nest and the domes.
- 491 windows and 620 lit ports, each keyed to its compartment and deck.
- The navigation lights, the screws and the rudder.
- The boats: their stations, and where each is stowed.
- `notes`: each source table's comments and tags, path by path.

**`titanic_night_1912.json`**
- One sample per step, 38,101 of them, from k 0 to the flag at k 38100.
- Her pose, place, heading and speed; the rudder; the three screws' revolutions.
- Each wet space's level and volume, and the flow from the sea into each space.
- The flow over each bulkhead's top, port and starboard.
- The plant: her lights, steam and fires (the drivers of her lights, smoke and steam).
- The berg; the ice's openings as they grew; the weather openings as they gave way; the doors.
- The model's events and the orders.
- From the readers: the boats (their states, and their heights while lowered), the rockets, the wireless and the other ships (their places every 10 s), the reports to the bridge, and the onset's mark.
- `end`: the fingerprints.
- `fall`: the contract v2's pieces (r, q, depth, speed, air, state) on their own clock.

## Decisions needed (who decides)

1. **How the gate tracks the manifest: the coordinator, at the join.**
   - What U0 proposes: the suite's table is tracked as `out/export_tests.txt`.
   - What that costs: every file each export reads is named inside it, so any change to `core/`, the readers or the drawn ship makes it STALE until `--write` (comments included).
   - The alternative: mark the hash lines as volatile, which loses the pin.
2. **Whether `--fall` becomes the default once Z3 lands: Z3's lane and the coordinator.** After Z3 the night itself carries the fall, and the record's form holds it as it is.
3. **When U1 starts: Bo.** It needs a new repository beside this one, and the Unreal laptop lock.

## Risks

- **The model moves.** Every change to `core/`, the readers or the drawn ship changes both files. A U1 build should pin the manifest's line, which is what it was made from.
- **Size.** 19.5 MB a night is fine on disk, but a naive JSON reader holds it all in memory [B: Unreal's DOM reader may want a second or two and a few hundred MB]. If that bites, the next format version is a binary file of channels beside a JSON header.
- **The fall is interim** (rule H1), and on a watch the readers stop at the flag until Z3.

## Sources

- Read: v1; this repository's `CLAUDE.md` and `README.md`; `core/*.js`, `core/readers/*.js`, `site/topsides.js`, `site/visuals.js`, and `site/app.js` (how it poses her and places the earth, its smoke and steam); the Z1, Z2 and Z3 notes in the group's notes folder.
- Measured: this session, on `main` at `7b1caf5`, with the lane's tools (`node tools/export_tests.js`: 25 of 25 MUST rows).
- Not checked: any consumer (Blender, Unreal) reading the files. That is U1's work.
