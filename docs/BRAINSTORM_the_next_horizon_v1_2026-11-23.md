# The next horizon: a brainstorm, v1

2026-11-23 CST. The coordinator ("Titanic simulator model accuracy (fork)") wrote this at Bo's request. It is a
brainstorm, so nothing here starts until Bo picks it. He asked for the sweet spots to go on the roadmap: they are
BACKLOG section 2k's NH items, numbered as here. This is the first version, with no earlier one.

## 0. The ask

As a boy, Bo played *Titanic: Adventure Out of Time* (CyberFlix, 1996) and dreamed of a sinking that was physically
accurate. Thirty years on, his own words: "the full CFD level sinking is still beyond reach even today .... (for real
time and for on a single desktop etc)". He asked three things:
- what the simulator is now;
- how to improve it;
- what belongs on its wishlist.

## 1. Why not CFD, and what the simulator is instead

A rough count, orders of magnitude only [bet]:
- **Her volume.** Her registered 46,328 gross tons, at 100 cubic feet a ton, enclose about 131,000 m3.
- **Cells.** At 10 cm, about 1.3 × 10^8 inside her, and as many again for the sea around her.
- **Steps.** Water crosses her openings at a few metres a second, so a free-surface solver steps about every
  millisecond. Her 2 h 40 min (9,600 s) is then about 10^7 steps, or about 10^15 cell updates a run.
- **Time.** One desktop GPU's lattice-Boltzmann solver does on the order of 10^10 updates a second at best [bet: the
  class FluidX3D publishes]. That is a day to several days for one run.
- **Resolution.** 10 cm still cannot see the damage. Her openings were slits along her seams, a few centimetres wide.
- **Scale.** The calibration needs thousands of runs: stage D's history match runs about 4,000.

What it is instead: a time-domain flooding model, the kind naval architects use for damage stability and casualty
work (Ruponen's 2007 thesis on progressive flooding is the usual reference; read it before NH6). It is built like this:
- her spaces are nodes: 64 today (16 zones, two sides, two layers);
- her openings are orifice flows under a sea head;
- her pose comes from hydrostatics each step;
- the plant, the motion, the ice, the readers and the fall sit on top, each with a test that it is neutral.

It is accurate at the scale that decides the sinking (how much water, where, how fast), and it runs a night in seconds.

Engineering usually closes the gap with a hybrid: CFD offline on a few openings, to calibrate the network's discharge
coefficients (NH11), and the network in real time.

## 2. Where it stands

What it does well:
- **Discipline.** Replays are bit for bit, references are frozen, and a gate of 52 suites gives each suite a deadline.
- **Honest numbers.** Every number is sourced or marked [bet] or [appearance]. CHECK rows fail visibly instead of
  being tuned away.
- **Coupling with proofs.** Each layer proves it changes nothing it should not: the plant, the motion, the ice, the
  readers, the fall and the page's parts.
- **Uncertainty done right.** The observation ledger holds one row per thing one witness saw. The history match keeps
  every parameter set the record cannot rule out, so the public words say "k of N". By D22, "she could have been
  saved" is never said on one model.

Where the error lives:
- **The late flooding above E deck.** e99 found that the early record needs about 1.1 m2 of opening, and that she then
  founders about 35 min too fast. C3's restored ends explain 20.4 of those minutes. The rest most likely sits in paths
  the 64 spaces lump together:
  - Scotland Road;
  - the stairwells;
  - the escape trunks;
  - the vents;
  - passages narrower than the model's (G11: Scotland Road 2.24 m clear against 3.11).
- **Air.** The core keeps her air at one atmosphere, so trapped air never slows the flooding. The fall is handed
  spaces 10 to 100 m down with their air uncompressed, which is why Z1's reports come too early and too many.
- **Her last minutes.** A float that is quasi-static hands over to a free body at the founder flag. The break is a
  check (the onset), not an event.
- **Identifiability.** There are many knobs against few hard observations. Growing the ledger is the cure.
- **The page shows one run.** The ensemble the calibration keeps is invisible to the reader.

## 3. The wishlist

### Group A: the sweet spots

These have high impact, are small to medium, change no physics, and build on what exists. Each of NH1 to NH5 is a
library, a tool or a page part: no fingerprint moves and nothing is recalibrated. Each has its own suite, which also
shows that the watch's fingerprint is unchanged.

**NH1. The witness timeline.**
- **What.** The Evidence tab gains the ledger. Every `RECORD_1912` row goes on her timeline with:
  - who saw it;
  - where it is in the inquiries;
  - what they saw;
  - the model's reading at that time, by the ledger's own operator.

  After stage D, the kept set's band goes beside each row.
- **Why.** It puts the evidence and the model side by side, row by row: a lesson and a validation in one view. Today
  the ledger lives only in a headless table (`out/ledger_1912.txt`).
- **How.** A page part reading `core/readers/ledger.js` (already in the build) and the run's samples, laid out for the
  desktop first (D84).
- **Test.** evidence_site:
  - every ledger row is shown;
  - each value equals ledger_tests' table to its printed digits;
  - the fingerprint is unchanged.
- **Size.** S to M.

**NH2. Her rooms, and when the water came (the cabin view).**
- **What.** Pick a room by its plan label or by name. R3's tables carry the staterooms' numbers, such as "C 102". The
  page then:
  - says when the water reached that room's deck, in its compartment and on its side;
  - marks the room on the damage diagram;
  - offers the walk from there.
- **Why.** It is the most human way into the night. The data is already in the repository (R3's nine decks), and
  nothing reads it yet.
- **How.**
  - A library with no state and no reader. It joins R3's rows to `rooms.js`'s slabs (each row carries its zone and
    slab) and to the run's water by slab.
  - A page part.
  - The tables go into the build: measure their size first.
- **Honest wording.** At level 0, a room's water is its slab's: a deck's space in one compartment on one side. Inside a
  space her decks are open floor [stand-in]. So v1 says "water on C deck in this compartment, port side, at 1:58", not
  "water at this cabin's door". NH6's stage 1 refines it to the room.
- **Names.** v1 covers rooms only. Passengers' names would need a sourced, public-domain list: Bo's call.
- **Test.**
  - cabins_tests (headless): every plan label resolves to one row, and each first-wet time equals `rooms.js`'s slab on
    the 1912 preset at the same step.
  - cabins_site: the lookup, the diagram's mark and the walk's start, with the fingerprint unchanged.
- **Size.** S to M.

**NH3. One model, many histories (the ensemble's bands).**
- **What.** After stage D, the kept set (k of N) runs through the 1912 preset and the watch. Its bands are written as a
  tracked table and shown beside the readouts and charts, for example "2:20 am (2:14 to 2:27, k of N)". The bands:
  - founder time;
  - trim;
  - list;
  - water aboard;
  - the onset.
- **Why.** The page shows one run, and the honest answer is a family of runs. This makes D85's public words visible.
- **How.**
  - A tool (`tools/ensemble.js`) writes `out/ensemble_1912.json` through `outdir.js`, so the gate says STALE when it
    moves. The table is bundled.
  - The page's watch stays the landed member's, bit for bit.
- **Test.** ensemble_tests:
  - the landed member's run equals the watch's fingerprint;
  - the bands contain it;
  - the table is the same with one thread or six.
- **Size.** S to M, after stage D.

**NH4. Scrub the night.**
- **What.** A timeline scrubber: jump to any kept minute of a watch or preset and play on from there.
- **Why.** So a reader can "go to 2:05 and walk to Scotland Road". Today the page only goes forward.
- **How.**
  - The page keeps a `C.serialize` snapshot every simulated minute, with the readers' states, which are plain data by
    rule [bet: about 100 KB each, about 16 MB a night; to measure].
  - Replays are bit for bit, so a scrub is exact.
  - The page's own states (the director's cuts, the notices, the marks, the sound) restart from the snapshot's step.
- **Test.** scrub_site: scrub to minute M, then run on to the flag. The fingerprint is the same as the unbroken run's,
  and so are the director's cuts, notices and marks from M on.
- **Size.** M.

**NH5. The counterfactual gallery.**
- **What.** The questions people ask, each run across the kept set and shown with its robustness table:
  - hit head-on (no helm);
  - the lookout 30 s sooner;
  - the watertight doors left open;
  - the bulkheads higher (to D deck or B deck: validate's what-ifs);
  - Californian answering;
  - the boats filled;
  - the Carpathia search's best night (W5).

  Later: the rivets' strength (McCarty and Foecke, 2008) as a what-if on the ice's damage.
- **Why.** Most of these exist already as options: the encounter's what-ifs, validate's what-ifs, the world and people
  readers, and the Carpathia search. Packaged, they answer what a reader wants to know.
- **How.** A tool (`tools/gallery.js`, writing `out/gallery_1912.json`) and a page part of cards. D22 governs every
  word: a result is its robustness table, never "she could have been saved" on one model.
- **Test.**
  - gallery_tests: each card's baseline equals the watch's own foundering, and each card is the same with one thread
    or six.
  - gallery_site.
- **Size.** M.

### Group B: the roadmap's three big ones

These change the physics, and each needs its own design and epoch.

**NH6. Her rooms as the flooding network.**
- **Stage 1, a reader.** It is neutral, with no refit. Inside each of the 64 spaces, it shares the space's water among
  its rooms (R3) by a small network of door sills, stairwells and passages. Each step the rooms are held to the space's
  own total, and the core is untouched. The walk and NH2 read it.
- **Stage 2, the core.** The rooms become the core's nodes (some hundreds), and the 64 spaces become their sums. This
  is an epoch with its one refit. The 64-space model is its limit and its test.
- **Why.** The late flooding is where the remaining error lives (section 2), and it is a property of exactly these
  paths.
- **First step.** A design v1, after reading Ruponen (2007) and G11's passages.
- **Size.** L (stage 1: M).

**NH7. Air in every space.**
- **What.** Each space gets its air pressure (isothermal ideal gas [bet]) and its vents (from the plans: R3's
  openings). Then:
  - trapped air slows the flooding and leaves by the vents;
  - the fall is handed the air's own pressure;
  - the reports come from pockets that burst.
- **How.** A core change, with its epoch. It shares NH6 stage 2's epoch if they land together (one refit).
- **Size.** M to L.

**NH8. One body from the ice to the bed.**
- **What.** From the collision on, the floating hull is the fall's free body (six degrees of freedom, Kirchhoff's
  added mass). The flooding drives its mass, and the break is a live event at the onset (B4's joint, built for the
  fall). There is no hand-over.
- **Why.** Her last five minutes (the bow's dive, the stern's rise and fall, the break) then emerge instead of being
  handed over.
- **First step.** A design v1 that reconciles `motion.js`'s MMG manoeuvring with the free body, keeping the headway
  reference and the seams.
- **Size.** L.

### Group C: reach and credibility (later; Bo's call)

- **NH9. Other sinkings as validation.**
  - Britannic is already a preset.
  - Estonia (the JAIC's final report, 1997) and Costa Concordia (the Italian investigation, 2013) have timelines minute
    by minute.
  - Each needs its hull and compartments as sourced tables; check the licences first.
  - A method validated on more than one ship is a method, not a fit.
- **NH10. The C++ core and WebAssembly.** The oracle rule already says how: match golden first. It gives ten times or
  more for the history match and the gallery, and NH6 stage 2 in real time on the page.
- **NH11. CFD where it matters.**
  - Offline runs of a few openings (a torn seam at speed, a doorway under a head) calibrate the network's discharge
    coefficients.
  - Keep them outside the repository where the tool's licence asks, as K6 did.
- **NH12. The film.** The export (U0 to U3) rendered in Unreal on Bo's RTX machine: the landed member's night in 4K,
  with the ensemble's spread as its epilogue.

### The parking lot (noted, not proposed)

- Passengers' names for NH2, from a sourced, public-domain list.
- The people in the water: the sea near -2 °C, and survival times [care: framed as the record frames it, never as a
  game].
- WebXR for a desktop headset.
- A generated "Sources" page, from every [bet] and sourced tag.

## 4. Scoring

Impact is on a scale of 1 to 5, in the coordinator's judgement.

| Id | Impact | Size | Risk to the calibration | Needs | Sweet spot |
|---|---|---|---|---|---|
| NH1 | 4 | S to M | none | nothing | yes |
| NH2 | 5 | S to M | none | nothing (NH6 refines it) | yes |
| NH3 | 4 | S to M | none | stage D | yes |
| NH4 | 3 | M | none | nothing | yes |
| NH5 | 5 | M | none | stage D | yes |
| NH6 | 5 | L (stage 1: M) | stage 2 is an epoch | a design | stage 1 |
| NH7 | 4 | M to L | an epoch | a design (with NH6) | no |
| NH8 | 4 | L | an epoch | a design | no |
| NH9 | 3 | L | none (new presets) | data, licences | no |
| NH10 | 3 | L | none (the oracle rule) | nothing | no |
| NH11 | 3 | M | Cd moves the fit | a GPU | no |
| NH12 | 3 | M | none | U3 | no |

## 5. The proposed order

1. **Now: stage D,** as planned at 08:16. The rerun, the trial landings, the landing, the cascade, join 15, then D5
   and the guide.
2. **Then the sweet spots, in this order:**
   - NH1 and NH3 together: the evidence and the spread, right after stage D while its numbers are fresh;
   - NH2: the most human;
   - NH5: the questions people ask;
   - NH4: the scrubber.
3. **Meanwhile, designs:** NH6 v1 (stage 1 first), then NH7, then NH8.
4. **Then NH6's stage 1,** then one epoch for NH6's stage 2 together with NH7.
5. **Later, on Bo's word:** NH9 to NH12.

Who could own what [a proposal]:
- Z2: the page parts (NH1, NH2's part, NH4).
- The mainline: the tools (NH3, NH5) and the designs of NH6 and NH7.
- R3's tables into NH2's library: Z2 or the coordinator.
- Z1 and B1+B2: NH8 (the free body and the break).
- U0: NH12 and the guide.

## 6. How the sweet spots keep the rules

- None of NH1 to NH5 writes into the flooding, the motion, the ice or the plant. Each suite shows the watch's
  fingerprint unchanged, as CLAUDE.md's rules for readers and parts ask.
- Their tables go through `tools/outdir.js`, so the gate says STALE when they move.
- Their page parts:
  - hand their overlays to the stage's one layout (QC C-4);
  - read the page's one clock (QC C-3);
  - lay out for the desktop first (D84).
- Each changes the page, so the User Guide gains a chapter or a section (U0).
- NH2 bundles R3's tables: measure the build's size first.

## 7. Questions for Bo

1. NH2: rooms only in v1, or passengers' names too (which needs a sourced list)?
2. NH5: which counterfactuals first? The coordinator's pick: head-on, the lookout 30 s sooner, the doors left open,
   and Californian answering.
3. NH6: the staged path, a reader first and the core later?
4. NH9: is it worth the data work?
