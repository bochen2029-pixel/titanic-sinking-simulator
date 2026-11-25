# DESIGN D112: the engineers raise the after doors on the 1912 night (the record's door schedule as an engineers' rule), v1

- **Written:** 2026-11-24 01:50 CST, by the mainline session "Titanic simulator model accuracy" (Claude Code 74cc0d65,
  Opus 5.5), at the coordinator's ruling D112 (01:36, on Bo's delegated word) after e120.
- **Status:** a design; nothing built. It lands in THE STERN's JOIN (the one after join 20), together with Z1's floats in
  the fall's spaces and the joint from the onset, never before Z1's floats.
- **Supersedes:** nothing. **Lineage:** e120 (docs/research/experiments/e120_after_doors_1912.js and its results,
  2026-11-24); the door note, docs/research/RESEARCH_tanks_counterflooding_door_schedule_v1_2026-11-17.md, section 8;
  the stern work's question 1 (the coordinator's digest STERNWORK_digest_04_05, notes folder); Bo, 2026-11-24 00:3x,
  on the physics against the witnesses (balance both, aim at the ground truth).

## The answer in one paragraph

On the 1912 night the engineers raised watertight doors by hand. The record has G, H, J and K from about T 30, on the
chief engineer's order, to reach the pumps and valves; L, M, N and O at about T 60 to 65, to fetch the 10-in suction
pipe; none shut again by hand [read: the door note, section 8, "medium"]. The model's 1912 watch keeps every door shut.
e120 showed that the record's schedule, with each door's float armed as the yard built it, is the same night to the bit
up to the hand-over. G and H fall by their floats at T+73.6 and T+116.3; J to O stand open at the break into dry rooms.
So the rule moves no calibration figure to the onset. What it changes is the doors' state at the hand-over, the stern's
question. It is an ENGINEERS' RULE in core/systems.js, beside the pumps' rules, never a bridge order: there was no door
indicator on the bridge (Olliver, the door note), so the bridge neither ordered it nor knew.

## 1. The rule

- `PLANT.doorsRaised` (core/systems.js), the 1912 night's schedule: `[{ T: 30, ids: 'GHJK', why: 'to reach the pumps and
  valves (the chief engineer\'s order)' }, { T: 62, ids: 'LMNO', why: 'to fetch the 10-in suction pipe' }]`, with the
  door note's section 8 as each one's source. O's 2 ft at T 30 to 35 is not modelled: a door here is open or shut.
- It acts on a watch whose spec carries it: N.spec(1912)'s `plant.doorsRaised`. Drawn nights do not carry it, so their
  engineers keep today's rules, and the presets never do.
- Each step after the touch, once T reaches an entry: each named door that is shut, and whose two rooms are both below
  their float's depth, is raised as `Sys.openDoor` does. That turns the bridge's switch off, as the record requires
  ("Doors cannot be operated mechanically whilst switch is on"). Its float stays ARMED. A door whose room is already wet
  stays shut: its float would drop it at once, and no engineer raises a door into water.
- An event of the plant, in sim.events: "The engineers raise the doors in bulkheads G, H, J and K by hand, to reach the
  pumps and valves". No log entry, no report to the bridge, and nothing the crew's fog reads as an order.
- The what-if (b), held open: `PLANT.doorsHeld` true disarms each raised door's float. It is a named what-if, e120's
  bracket, never the default.

## 2. What its landing must show (the coordinator's five)

1. A MUST row (tools/systems_tests.js): the default 1912 watch with the rule is the same night to the bit up to the
   hand-over: 0ae90224 at step 37,792, the onset at T+156.46, x -10.93. Beside it, the doors' state at the hand-over: G
   and H shut by their floats, J to O open with their floats armed.
2. The flag what-if's pins, rewritten and named in the commit: systems' BASE_FLAG (e120's order-run gave 0fdcf0ad at
   step 39,473, her flag at T+163.47 unmoved; the rule's own bits are measured at the build), the history match's flag
   watch, and the ensemble's member runs.
3. Every kept member's flag founder against today's, with D86's rule read on them. If a member leaves its band, or the
   match's scores move, it is an epoch's change after all, and it goes back to the coordinator.
4. The presets untouched: the 1912 preset and the others carry no schedule (systems_tests' preset rows unchanged, the
   validation table unchanged).
5. The page: the Systems tab's doors list says which doors the engineers raised, when and why, with the door note's
   source. The Bridge says nothing, since it had no indicator.
Also at the landing: the nerves table (the bridge's switch node turns off at T+30) and the export's record are
rewritten, meant; core/systems.js is in the Carpathia search's progress name and the tables' `core`.

## 3. Order of landing (with Z1)

Z1's floats in the fall's spaces come first, or in the same join: a door handed over open must be able to fall by its
float as the sea reaches it after the break, as the core's own floats do (doorsStep: water at params.floatDepth over
the floor on either side; it falls over params.doorFall). Without them the fall would read the held-open bracket as the
1912 night (Z1, 01:3x).

## Decisions needed (who decides)

- Whether drawn nights' engineers should raise doors when they lead pumps aft: the mainline, later. v1 is the 1912
  night's record only.
- Whether the 1912 damage preset carries the schedule too: the coordinator, with D86. It moves the preset's flooding
  past T 74 only if water reaches the raised doors before its flag; to be measured.

## Risks

- A one-step difference between the rule acting inside the step and e120's orders between steps. It moves no bit while
  no water passes the doors (e120: none before the hand-over); the MUST row holds it.
- The bridge's switch off from T+30 changes what the nerves view shows from then. That is the record's own consequence,
  and it is written as such.

## Sources

e120's results (read whole); the door note, section 8 (read); core/systems.js 175 to 192 (the doors' rules, Y2);
core/core.js 2184 to 2216 (setDoor, releaseDoor, doorsStep); the coordinator's D112 (01:36); Z1's 01:3x on the fall's
spaces (openingsOf takes each connection's state at the hand-over; no float drops a door in the fall today).
