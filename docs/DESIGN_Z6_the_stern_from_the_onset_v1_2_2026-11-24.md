# Z6 from the onset: the stern's hang was the limiter's (v1.2)

Z1, 2026-11-24, 00:0x CST (the clock). This is v1.2 of the note of 11-23. v1 and v1.1
(`docs/DESIGN_Z6_the_stern_from_the_onset_v1_2026-11-23.md` and `..._v1_1_2026-11-23.md`, on `claude/z1-z6-onset`)
stay beside it. It corrects v1.1's conclusion. The coordinator's order (11-23, 23:44): check the finding before
anything else on the stern.

## What v1.1 said

With `K.torn` 20, member C's stern, handed over at the onset, floods forward and stands up. Then it hangs: afloat at
15 min, with zones 13 to 15 dry. v1.1 put that down to her venting, "the next physics".

## What was wrong

**The finding is theirs.** A team on Bo's other PC (11-23, 21:05 to 22:06) ran our own engine. Their parts
`01_sim_as_is` and `02_baseline_runs` are in Bo's work folder, `C:\temp\titanic-stern-work_2026-11-23_2333\work`, with
digests `STERNWORK_*` in the group's notes. They found the hang an artefact of the spaces' one-way limiter:
`core/readers/spaces.js`, `stepPiece`, e84's safeguard 1. What follows checks it, corrects their two-box rig, and
widens the cause.

**The check.** Done on main 5e12900, whose `fall.js`, `spaces.js` and `core.js` are their copy's by hash; one thread.
- The preset's stern, handed over at the flag with `K.air` 'spaces', is under at +176.25 s.
- With the free surface's floor at 1 m² (a scratch copy) it is under at +69.75 s.
- Theirs: 176.3 s and 69.8 s.

**The mechanism is wider than the floor.** The limiter is applied pair by pair. It judges each side of an opening by its
own stiffness: its free surface's (ρg/S) and its air's (p/V).
- A space the sea feeds through another opening keeps its pressure, however much it gives. The limiter still takes it
  as stiff as a sealed one:
  - a full space: its free surface has no area at its top, floored at 1e-6 m², so 1.0e10 Pa/m³;
  - a nearly full one with a bubble trapped at its top: 0.02 m³ gives p/V of 7e6 Pa/m³.
- On two rooms of 400 m³ (e119, part 1), a full room fed by the sea passes its dry neighbour 85 m³ in 10 s. The law asks
  265 m³/s at the start. A floor of 1 m² changes nothing there: the bubble does it.

**Their two-box number is their rig's.** 0.03 m³ in 10 s through 20 m² comes from a full room that is sealed and below a
dry one; its sea pressure comes only from `airP`'s stand-in. Such a room cannot give water without leaving a void, so
near nothing is about right there. Here, a sealed full room over a dry one passes 347 m³ in 10 s, by the exchange law.

## The mend: `K.limiter` 'held', the default under the spaces since D108

It lives in `core/readers/spaces.js` (`heldBySea`, `stepPiece`'s limiter argument) and `fall.js` (`K.limiter`). It went
in as a what-if (55cf28a, 'pair' the default, to the bit). D108 (the coordinator, 11-24 00:11) made 'held' the default
under `K.air` 'spaces' from join 20. 'pair', the limiter before, stays as a named what-if, to the bit.
- A space is **held** when its water stands over the bottom of an open opening to the sea below the sea's surface. It is
  also held when its water stands over an open opening to a held space whose water stands over it too.
- A held space's water is one body with the sea's. So its own stiffness leaves the pair's limiter, as the sea's is 0.
- A space with no such way keeps its own. A sealed full space cannot give water without a void.
- No free number. A dry room's first sub-step against the floor is kept.
- **Its limit:** the rule is all or nothing. A held space's way to the sea may be small, such as a hatch's 0.2 m²; the
  rule then overstates the sea's hold on it, and the space's own pressure solve corrects it at its next step. The
  weighted form, its ways' area against the pair's opening, is the next refinement if a run shows it matters.

## Its result (e119; `docs/research/experiments/results_2026-11-24/e119_z6_limiter_hang.txt`)

| | 'pair' (before D108) | 'held' |
|---|---|---|
| Two rooms, the full one fed by the sea: the dry one's water at 2 s, at 10 s | 62, 85 m³ | 332, 396 m³ |
| Two rooms, the full one sealed | 199, 200 m³ | the same bits |
| The 1912 preset at its flag: the stern under | +176.25 s | +77.25 s |
| Member C from the onset, `K.torn` 20: the stern under | not in 15 min | +188.75 s (3.15 min) |

**From the onset under 'held', with `K.torn` 20:**
- her pitch is 15° at 30 s, 35° at 60 s, 49° at 90 s and 87° at 120 s;
- she stays near vertical until she is under, at +188.75 s;
- 12 reports; 31 of her 32 spaces have given way by then.

Under 'pair' the same run stands up more slowly: 17° at 60 s, 37° at 4 min, 67° at 5 min, 86° at 10 min. It is still
afloat at 15 min, 98 m down at 86°, with 5 reports and 23 of 32 spaces given way.

**Against the record:** D107 (the coordinator, 11-23 23:52) judges the stern's time afloat after the parting on the
witnesses (R5's table: Etches 20 s; Evans and Buley about 5 min; Pitman gone at 2:20):
- IN at 20 s to 5 min;
- 1 to 3 min is a derived centre, printed beside, never a fit target;
- OUT below 15 s or above 6 min.

At 3.15 min she is IN, just past the centre, with every strength at its bet and no vents. v1.1 and the notes before it
took 1.5 to 3 min as the witnesses' own figure; it is not (B1+B2, 11-24).

## What changes in v1.1's list

1. **Her venting** (v1.1's item 1) was not the cause of the hang. v1.1's conclusion was wrong as stated: the hang was
   the pairwise limiter starving the spaces the sea fed. But vents are a second way down, not only a refinement.
   - In the team's own runs, with the limiter as it was, the plans' after hatches and stairs put her under in 98 to
     180 s with nothing failing, and in 57 s with failures on. The engine casings alone did not (16.5 min). With no
     vents she took 8 to 16 min, or never sank (digest `STERNWORK_digest_07_08_09`, the coordinator's summary).
   - So the two are to be measured apart on our engine: the limiter mended with no vents (done: 3.15 min); vents with
     'pair'; and both. That needs the fall's vents (NH7's table), as a what-if. NH7's v1.1 says so.
2. **The joint's pull** (gate 2): unchanged. The tear, not `K.torn`, is the break's own way in. `K.torn` stays a what-if.
3. **The heads at the vertical:** under 'held' her after bulkheads give way (31 of 32 spaces). The heads' band is a
   sensitivity again, not the key.

## What else the team found, triaged

- **A space gives way once, then holds at any load.** `failBoundaries` skips a failed space for good. Confirmed by
  reading; the next what-if (each boundary once).
- **The 'report' event carries no node and no volume** (contract v: 3). That is a v: 4 question, with Z2 and the page.
- **The report's energy is the sea's work** (load × the air's volume), not the energy released. The release is
  E = p_s·V_a·[(1 − x) + x·ln x], with x = p_air/p_sea (their 10_REVIEW, certified by abacus). Its own form needs
  `C.log`, so it belongs in `fall.js`, not `spaces.js`.
- **`K.air` 'spaces' cannot be reached from the watch or the page.** That is by design: it is a what-if.
- **Port and starboard are sealed from each other** in the fall's spaces, and **the weather openings shut at the
  hand-over never open in the fall.** Both are true and both are refinements (NH6's rooms, NH7's vents).
- **Their second sighting of the limiter:** a full space passes nothing to a dry neighbour, and their patched floor
  fixes the full case but not a space at 98 % fill. That is the trapped bubble above, and 'held' covers a space the sea
  feeds at any fill. A sealed space at 98 % keeps its pocket's stiffness, which is right for it.
- **The hand-over's failures** (5.5 to 5.9 GJ, with the core's air at one atmosphere 16 to 60 m down) and their rule
  that dates them earlier (0.87 to 2.30 GJ): to compare with trial 18's 15 reports at the hand-over. NH7's hand-over
  of each space's air is the cure in the core.
- **Code to take after review** (their `07_transient\transient_ref.js`, `03_from_subsim\port_check\collapse_port.js`):
  read, not run from that folder; anything taken is re-tested here and cited. That is for the failure's energy and its
  transient, after the once-only rule.

## What follows

- `K.limiter` 'held' is the mend, the default under `K.air` 'spaces' from join 20 (D108). 'spaces' is itself a what-if,
  so nothing moves the watch or the page.
- Next, in order (the coordinator, 11-23 23:58):
  - the once-only rule's what-if;
  - gate 5, the joint's release converged with the sub-step, before anything of the joint can be a default;
  - gates 1 and 2: the tear in place of `K.torn`, with the joint;
  - the vents apart and together (item 1 above);
  - the hang's statics, which the team's two helpers read differently. One finds her heave stiffness negative from
    +180 s, held up by restricted flow; the other a stable equilibrium in heave. To settle on our engine: her net
    vertical force and its slope about the hanging pose under 'pair', her spaces' contents held, at +300, +600 and
    +900 s;
  - the reduced spaces count (ten members), which the design gives a slot if the stern goes under in the record's band.
    Under D107 she is in it, so the count has earned its slot; the coordinator schedules it.
