# NH7: air in every space (design v1)

Z1, 2026-11-23, at the coordinator's word: "NH7's design v1 (air in every space: pressure and vents), docs only". From
the next horizon (`docs/BRAINSTORM_the_next_horizon_v1_2026-11-23.md`, NH7, with NH6).

## The answer in one paragraph

Today the core's 64 spaces have no air. A space floods as if its air left freely, and a full space is "pressed up" by a
stiff virtual head (`nodeAov`). Only the two pockets have a law of their own: W6's bunker and G7's peak tank.

The fall's spaces (Z6, `core/readers/spaces.js`) already carry each space's air at its own pressure and exchange it
through openings by e84's laws. NH7 puts that air into the core:
- each space keeps an amount of air, and its pressure follows from it (isothermal);
- water comes in only as fast as the air can leave or compress;
- the air leaves through the space's vents, whose areas come from the plans, or are named bets.

Three things follow:
- trapped air slows the flooding where the vents are small;
- the fall is handed each space's air at its own pressure;
- a space whose pressure passes its boundaries' strength gives way, and those are the reports.

It is a change of the core (class C), dark until an epoch. The brainstorm shares that epoch with NH6's stage 2.

## Why now: two findings, one missing state

1. **The hand-over's air.** The core leaves her air at one atmosphere 10 to 100 m down at the flag, so most spaces give
   way at the hand-over under the fall's spaces (`tools/fall_trials.js`, trial 18's reports, 16 at the hand-over).
2. **The stern that hangs** (Z6 from the onset, `docs/DESIGN_Z6_the_stern_from_the_onset_v1_1_2026-11-23.md`). With the
   break's torn length the stern floods forward and stands up, as the witnesses saw, then hangs on its after
   compartments' air. The core has no vents over her machinery, so that air never leaves.

Both are the same missing state: each space's air, and its way out.

## The model

- **The state** is plain data in the sim, saved by `serialize`:
  - `sim.air[n]`, space n's air as its volume at one atmosphere;
  - its pressure, p = P_ATM a / Va, with Va the space's room less its water: isothermal [bet: the brainstorm's; trial
    3 holds Boyle's law at the column's pressure in the fall].
  - The pockets keep their own laws: they are already spaces with air.
- **The water's push.** Today an opening's flow is driven by the difference of the water levels either side. With air,
  each free surface carries its space's pressure, so the head across an opening is (p_a - p_b) / (rho g) + h_a - h_b.
  The core's level solve (`solveLevels`, `hydroPass`) takes each space's air pressure as a load on its surface. The
  girder's and the fall's mirrors of that solve change with it, as CLAUDE.md requires.
- **The air's flow.** Through each vent, by e84's compressible orifice law, ported from `spaces.js` (`lawP`,
  `exchange`), driven by the pressures either side.
  - A vent carries air while it stands above its space's water.
  - Once under, it carries water, as any opening does.
- **The vents: the new data.** Each space's paths to the weather, or to a neighbour above the water:
  - the openings the core already has: doors, windows and sidelights (R3, `data/rooms/openings.json`), and S1's
    staircases;
  - the vertical paths the plans show: ventilators and trunks, hatches, skylights, the machinery casings and the
    funnels' casings.

  These go in one table, `data/vents_1912.json`, in R3's form: each row placed by her frames, its area and the height
  of its top, its source, and a [bet] where the plans are silent.
- **Failures.** A space's boundaries give way when the pressure across them passes their strength. That is the fall's
  `failBoundaries`, ported, with B1+B2's heads by bulkhead from the scantlings, which are now being read for K to O.
  These are the reports.
- **The hand-over.** The fall is handed each space's amount of air and its pressure (`stateOf` reads `sim.air`), no
  longer one atmosphere. Trial 18's failures at the hand-over then fall to those the pressures support.

## The switch and its tests

- `params.airSpaces` 0 until the epoch is the core before NH7, to the bit: the seams gate and every pin hold.
- At 1:
  - With every vent made wide (a what-if `params.ventScale` to infinity), the flooding is today's within a stated
    tolerance (MUST): air that leaves freely is today's assumption.
  - The air is conserved: each space's amount changes only by its vents' flows, step by step (MUST, in
    `conserve_tests`).
  - `pocket_tests` is unchanged: the pockets keep their own laws.
  - The fall's hand-over: trial 18's reports at the hand-over, against the record's (MUST that they are no more than
    the pressures support; CHECK against Pitman's and Scarrott's).
- **The epoch:**
  - the history match is rerun, taking the vents' bets where they matter as its inputs;
  - Carpathia, the references and the guide follow, as stage D's cascade did.

## The order and the owners (a proposal)

1. **The vents table.** R3's form, from the plans. Its owner is R3 or the mainline. B1+B2 offered the casings' and
   skylights' areas over the machinery (Z6's case).
2. **The core's air, dark.** The mainline (`core/core.js`); Z1 ports `spaces.js`'s laws and the fall's hand-over.
3. **The epoch**, with NH6's stage 2: one refit.
4. **Meanwhile, the fall's what-ifs** (`K.air` 'spaces', `K.torn`) take the vents table directly. That is Z6 from the
   onset's next build: her venting as she stands.

## Risks

- **The vents' areas.** Most are unsourced: bets the history match must sample, each named.
- **The cost.** The air per space per step means an implicit solve per space, as `spaces.js` does it. Measure it on the
  1912 watch before the core takes it.
- **The over-fill.** C5's stand-in (a full space "pressed up" over `nodeAov`) meets real air: a space is full of water
  only once its air has left. This needs its own section in v1.1, worked on G7's tank.
- **The mirrors.** The girder, the fall and U0's record all mirror the level solve. Each must take the air's load in
  the same commit.

## Decisions needed

- **Bo:** whether NH7 rides NH6's stage 2 epoch (the brainstorm's proposal) or one of its own.
- **The coordinator:** the owners of the vents table and of the core's change.
