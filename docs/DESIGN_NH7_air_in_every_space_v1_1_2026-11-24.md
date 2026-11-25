# NH7: air in every space (design v1.1)

Z1, 2026-11-24, 00:0x CST (the clock). This is v1.1 of the design of 11-23
(`docs/DESIGN_NH7_air_in_every_space_v1_2026-11-23.md`, on `claude/z1-z6-onset`, which stays beside it). Docs only.

What changes from v1:
- One of its two reasons fell. The stern's hang was the fall's limiter, not missing vents (Z6 v1.2).
- Bo's submarine simulator is folded in as a source, cited by file and line, as the coordinator asked (11-23, 19:36).
- The vents table has arrived, the coordinator's rulings are taken, and the limiter's lesson is carried into the port.

The model, the switch and the risks of v1 stand except where this version says otherwise.

## Why now, corrected

1. **The hand-over's air** (v1's first reason) stands. The core leaves her air at one atmosphere 10 to 100 m down at the
   flag, so most of the fall's spaces give way at the hand-over (`tools/fall_trials.js`, trial 18: 15 of 18 reports in
   its first 90 s come at the hand-over). The team on Bo's other PC found the same (their digest 01_02, §2).
2. **The stern that hangs** (v1's second) was wrong as stated. Under `K.limiter` 'held' the fall's stern goes under
   3.15 min after the onset with `K.torn` 20 and no vents at all (Z6 v1.2; e119). The hang was the limiter's, not the
   vents'.
   - But vents are a second way down. In the team's runs, with the limiter as it was, the plans' after hatches and
     stairs put her under in 98 to 180 s (57 s with failures on). The engine casings alone did not (16.5 min).
   - So the vents table earns its place in the fall too: the vents apart, and with 'held', on our engine (Z6 v1.2's
     "what follows").
3. **The core's own flooding** is now the main reason. Where a compartment's ways to the weather are small, its air
   slows its flooding. Today the core floods every space as if its air left freely. The history match will say how
   much that matters, once the vents' bets are its inputs.

## The submarine simulator as a source

Bo's "subsim" (`C:\code\_ref_subsim_zip\base_src`) is the ruled specification of the same problem for a submarine. Its
descent scenario names this simulator ("sinksim", Bo, 11-23). Its requirements, as they bear on NH7 [read]:
- **Trapped air** (`spec\SPEC-phys.md:923`, REQ-FLOOD-005): each space's gas carries its dry-air mass, its energy and its
  water vapour, with one equation of state. NH7 keeps v1's reduced form: an amount of air, isothermal [bet]. Over the
  core's minutes of flooding the air has time to come to the sea's temperature. The scout note
  (`COORD_scout_subsim_implosion_2026-11-23.md:215`) points to subsim's heat relaxation, which spans adiabatic to
  isothermal. That is the form to take if a fast event (a failure's seconds) needs it.
- **Openings by strips** (`SPEC-phys.md:924`, REQ-FLOOD-006): integrated in horizontal strips, water and air in
  counterflow through one opening. That is e84's law P with law X (`spaces.js`), which NH7 ports. One law covers venting
  and "glugging" (the scout note, line 216).
- **An oracle to add** (`SPEC-phys.md:935`, REQ-FLOOD-017): the U-tube's period between two tanks joined by a pipe,
  T = 2π·√(ℓ/(g·A·(1/A₁ + 1/A₂))). e84's law is quasi-steady, with no inertia, so it has no period. The oracle becomes
  NH7's test only if the port gives the flow inertia.
- **The descent** (`SPEC-phys.md:937`, REQ-FLOOD-019): every trapped pocket either vents and floods, or reaches its
  boundary's failure. That is the fall's own rule under `K.air` 'spaces'.
- **The hand-over** (`SPEC-phys.md:940`, REQ-FLOOD-022): the surface simulator passes each space's flooding state and its
  air pockets, each with its volume, its vents and its strength (Δp). That is NH7's hand-over, `stateOf` reading
  `sim.air`, in subsim's words.
- **The failure's trigger** (`SPEC-phys.md:1182`, REQ-COLLAPSE-014): a pocket sealed at one atmosphere fails at
  z_f = Δp_f/(ρg). That is the fall's head per boundary. Where Δp_f comes from (subsim's panel forms, REQ-STRUCT-020, or
  our stated heads) is the scout note's open question 3, for Bo. B1+B2's heads for bulkheads K to O, from the
  scantlings, are ours meanwhile.

Treated as a source, not code: nothing of it is copied.

## The vents table: delivered in stages

NH2's session owns `data/vents_1912.json` (the coordinator, 11-23), with B1+B2 for the machinery casings and skylights.
On `claude/vents-1912`:
- 0dd31ae, in join 19;
- 1cb43db, with the fidleys;
- 165845c, giving every vent what closes it and, where a source says, the head at which it gives way. Two examples: a
  hatch trunk collapses once the sea reaches its top (Wilding, BI 20391 [read]); a tarpaulin lifts from below at 0 to
  0.1 m [bet].

One row matters beyond the rest: **the central station.** The Shipbuilder (1911), p. 107 [read, NH2] describes a
separate watertight compartment, about 63 ft long and 24 ft high, adjoining the turbine room's after end at the tank top.
It holds the four dynamos, and its ventilation is not found. The table marks it "sealed [bet], no vent found", its flat
about 7.3 m over the tank top [derived]. It is a real store of air in zone 12 below E deck. The core holds that zone's
lower layer as one space a side, so it shows only once NH6's rooms split the space.

## The limiter's lesson, for the port

The fall's spaces judged each opening's two sides by their own stiffness, pair by pair. So a space the sea feeds was
taken as stiff as a sealed one, and its neighbours starved (Z6 v1.2). The core's air must not repeat it:
- each space's pressure is taken implicitly over all its openings (e84's safeguard 2, as `stepPiece` does);
- any pairwise limiter counts a space the sea holds as the sea (`heldBySea`'s rule), or limits the space's summed net
  flow, as e84's own comment asked.

`conserve_tests` holds the water either way. A test of NH7's own holds a fed neighbour's pace on two rooms: e119's
part 1, run on the core's law.

## The switch, as the coordinator set it (11-23, 19:27)

- `params.airSpaces` in `core/core.js`, **0 by default**: the core before NH7, to the bit. The seams gate,
  `conserve_tests` and `pocket_tests` must not move.
- At 1, **with every vent made wide**, the flooding must be today's **to the bit**, which is stricter than v1's "within a
  tolerance". So a space whose ways are all wide must take P_ATM exactly and skip the air's law. It is not a law driven
  to the limit.
- A stand-in vents table, each row a marked bet, until NH2's table lands. Z1 writes the port on a branch; the mainline
  reviews it before any join.
- **D106:** NH7 gets no refit of its own. Its switch lands dark, and its refit is the next epoch's one refit, with NH15's
  class C (D100) and NH6's stage 2.

## A failure's energy

The team's review (their 10_REVIEW, certified by abacus) found the fall's 'report' energy to be the sea's work on the
air (the lag times the air's volume), not the energy released. Isothermally, the release is
E = p_s·V_a·[(1 − x) + x·ln x], with x = p_air/p_sea. It is 1.48 to 8.61 times smaller on the fall's own failures.
NH7's failures in the core, and the fall's, should carry the release. `C.log` exists for it. `K.reportMin` (0.1 GJ) is
then restated against the release, which moves the reports' count (a CHECK row's).

## The order, updated

1. **The vents table:** NH2's session, in stages (above).
2. **The core's air, dark:** Z1 writes the port (spaces.js's laws into `core/core.js`, with the limiter's lesson); the
   mainline reviews.
3. **The fall:** the hand-over takes `sim.air`. Three things come first, in the fall alone: `K.limiter` 'held' (the
   default under the spaces from join 20, D108), the once-only rule's what-if and the release's energy.
4. **The epoch:** one refit with NH15's class C and NH6's stage 2 (D106).

## Decisions needed

- **Decided by Bo** (11-24, 00:2x, on Z1's recommendation to keep ours): "you can go with your own recommendation for
  that question. I don't really have a strong preference either way." So a boundary's strength stays a stated head per
  boundary, from her own scantlings as B1+B2 read them, not subsim's welded-panel forms (the scout note's question 3).
- **Decided since v1:** `K.limiter` 'held' is the default under `K.air` 'spaces' from join 20 (D108, the coordinator,
  11-24 00:11).
- **For the mainline's door schedule** (the record's doors raised by hand from T+30): the fall's spaces take each
  watertight door as the core has it at the hand-over. `rebuildConnections` sets each door's connection from
  `sim.doorOpen`, and `openingsOf` copies the connections' state. Nothing in the fall opens or shuts a door after.
