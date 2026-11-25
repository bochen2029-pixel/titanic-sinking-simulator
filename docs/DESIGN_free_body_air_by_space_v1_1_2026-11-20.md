# Z6 inside B4: the joint and the tear on the free body (v1.1)

- **Written:** 2026-11-20, 15:47 CST, by the Z1 session (Claude Code 7fe8d708, Opus 5.5).
- **For:** the coordinator (local_5ca1b235). It said at 15:44: "Z6's design work, without core edits until C3 lands". Bo's word for the lane: "for everything else you can decided on my behalf ... i'm fine with either /any choices".
- **Status:** design only. Nothing is built, and no code changed for it.
- **Read with:**
  - v1, `DESIGN_free_body_air_by_space_v1_2026-11-20.md`. This note adds to it; v1's sections still stand where this one says nothing.
  - The break's design, `DESIGN_the_break_and_two_bodies_v1_2026-11-19.md`, sections 4.3 and 4.4.
  - `S.hinge` in `core/readers/section.js`: B4's law as a library, from B1+B2's `bcc6066`, on main since `d679239`.
  - B1+B2's girder research, `docs/research/RESEARCH_double_bottom_girders_v1_2026-11-20.md` (`18b4082`).
  - The plan's v2.1, D55: Z6 inside B4, after Z3, C3 and the lists.

**What changed since v1:**
- Z3 is on main. The fall is a reader of the night, and the what-if hand-over `handover: 'onset'` stops the core at B2's onset and begins the fall there, cut at the onset's station.
- B4's law is a library. Against the hinge angle θ, `S.hinge(ship, x, sense, { Lh })` gives:
  - M and dM: the joint's moment and its slope;
  - c: the share torn;
  - W: the steel's work;
  - zNA: the hinge's height;
  - Nt and Vs: the ligament's tension and shear;
  - open: the tear's opening to the sea in each of the four spaces at x.

  It also states the release rule.

**Tags:** as v1. Also:
- [S.hinge]: `core/readers/section.js`, lines 515 to 621 on `d679239`.
- [B]: the break's design.
- [B1+B2]: their messages to Z1 of 2026-11-20, 13:3x to 14:3x CST.

## 0. In one paragraph

v1 left the joint as one line: "Z6 runs inside B4's joint, both parts stepped together". This note designs that joint on the free body, with `S.hinge` as its law.

**The joint.** The bow and the stern are fall.js's two bodies, joined at a pin on the hinge's axis.
- One freedom: the hinge angle θ, about her own y axis.
- Five freedoms locked while the ligament holds.
- Solved exactly each sub-step as a constraint, with each body's added mass, not as a spring [B 4.4].

**The hinge.** It is rigid-plastic.
- It carries the moment the bodies ask of it, up to `M(θ)`.
- Past that it turns, and the falling branch makes it turn faster.
- It never closes.

**The tear.** While the hinge holds, the spaces it crosses are one space in two bodies. They are open to each other across the cut, and to the sea through the tear's own opening, `open(θ)`.

**The release.** Each sub-step the force across the joint is the constraint's own, not the gauge's. The pieces part at the first sub-step where its tension passes `Nt(θ)` or its shear passes `Vs(θ)`.

At the 1912 onset that verdict is a coin's edge: the gauge's shear is 0.964 of the as-built ligament's. So the design prints the margin and the sense at the release, and runs the as-built ligament beside the sourced alternatives as what-ifs. It never chooses by the record.

## 1. The joint

**Where it is.** At the hand-over the two bodies are cut at the onset's station `x_b`, as Z3's 'onset' cuts them today.
- The pin P is on her own y axis through `(x_b, zNA(θ))`, in each body's frame.
- θ is positive as the side that failed opens: the deck in hogging, the bottom in sagging [S.hinge].
- B2's 1912 onset hogs: the deck tears first, and the ligament is the double bottom [B1+B2].

**The freedoms.** The bodies keep their own six each (fall.js: quaternion attitude, Kirchhoff's equations with the added mass summed over the slices). The joint removes five relative freedoms:
- three of translation at P;
- the relative roll and yaw.

The sixth, θ, is the hinge's. The five are locked while the ligament holds [bet: the ligament is stiff in them. Their loads are checked against Nt and Vs only; section 5, doubt 1].

**Solved exactly, not by a spring** [B 4.4: "at dt 0.25 s a spring stiff enough to hold 30,000 t would not be stable"].
- Each sub-step the constraint's impulse is found inside fall.js's implicit-midpoint iterations (four a sub-step today).
- It is found from the bodies' 6 × 6 generalized masses, each with its added mass:
  `λ = (J_b M_b⁻¹ J_bᵀ + J_s M_s⁻¹ J_sᵀ)⁻¹ (−J ν − b)`
  - J: the joint's Jacobian at the midpoint;
  - ν: the two bodies' velocities;
  - b: the hinge's own term when it turns.
- The drift of the locked freedoms is projected out at the sub-step's end [bet: projection rather than Baumgarte; a test holds the drift to 1e-9].
- With the added mass in M_b, the pull of the water each body drags with it reaches the joint. That is why the joint's force is not the gauge's.

**The hinge's law** [S.hinge: "the joint carries the moment min(its demand, M(θ))"]. The demand is the moment about the hinge's axis that would keep θ where it is: the locked solve's sixth component.
- While `demand < M(θ)` in the opening sense, θ is locked with the other five.
- At `M(θ)`, the hinge turns:
  - the joint carries `M(θ)` as an equal and opposite pair of moments on the bodies;
  - θ's own acceleration follows from the bodies;
  - the falling branch (dM < 0) makes it run away, as B intends: "the resistance dies as the parts rotate".
- **θ never decreases** [bet]. A torn section does not mend, and unloading is rigid. If the demand turns to closing, θ holds. The faces' contact on closing belongs to the debris, which is out of scope.
- **Past the curve's end** (θ > `thetaEnd`, about 1 degree with Lh 20 m), `S.hinge`'s `at(θ)` holds M at its last value. W grows by M dθ, and the openings grow by `openRate`.

**The hinge's height.** P sits at `zNA(θ)`, which moves as the section tears.
- The anchor moves with θ in both bodies' frames, quasi-statically [bet].
- The work of that shift is counted in W [S.hinge], not again.

**The force across it.** The locked solve's impulse over the sub-step, in the joint's frame, gives:
- N: along her, tension positive;
- V: her z, the vertical shear;
- L: her y, the lateral shear.

The joint's frame is the mean of the two bodies' x axes, so it bisects θ [bet; θ is about a degree when the ligament is asked].

This is the coordinator's and B1+B2's principle for the papers: "carry the joint's own force (yours, not the gauge's)".

**The release** [S.hinge's rule; B 4.3, item 4: "no timer, no fixed angle"]. At the first sub-step where `N > Nt(θ)` or `|V| > Vs(θ)`:
- the ligament parts and c becomes 1;
- the constraint is gone, and the bodies are free as today's two pieces are;
- an event `'release'` is logged with t, θ, c, N/Nt, |V|/Vs, which one passed, and the sense.

  The fall's contract reserves event ids; `'release'` is new and joins it at v: 3, with v1's `'report'`.
- Each sub-step of the hang prints its largest N/Nt and |V|/Vs so far: the margin.

**Energy.** The tear's work W(θ) [S.hinge: the integral of M over θ] enters the fall's energy identity as the steel's work, beside the air's and the failures' [v1, section 5]. The identity must close with it to rounding, as it does today without it (1e-15).

## 2. The tear as Z6's openings

This section replaces v1 section 3's "the cut adds one opening for each space it crosses", while the hinge holds.

**The compartment the hinge crosses** has four spaces at `x_b`: port and starboard, below and above E deck, in the core's node order. As in v1 section 2, each is split by length between the two bodies.
- **While the hinge holds,** each split pair is one space in two bodies.
  - **Across the cut:** the two halves are open to each other through an internal opening, the space's own share of the section [bet: nothing in the way across a torn plane; section 5, doubt 4].
  - **To the sea:** the tear, `S.hinge.at(θ).open[q]` in m², half to each half [bet].
  - Decks that part open spaces to each other, not to the sea [S.hinge]. The torn decks become internal openings between the layers of that compartment, sized as `S.hinge` tears them.
- **The tear's height.** v1 section 4's laws need each opening's top and bottom (the two-opening space: water in low, air out high). `S.hinge` places a parted strip by its layer only (below or above E deck). Until B1+B2 export more, the tear in a space spans the parted shell strips' heights in that layer, which `hinge()` computes and does not return. This is ask 1 in section 6.
- **After the release,** as v1 section 3 and B 4.4: each body's cut face is open to the sea over its whole section, by height. The internal openings are gone.

**The torn zone** [B 4.4: "the stations that passed their ultimate moment before release are the torn zone; their columns go to neither part and become debris"]. This is a what-if beside the clean cut.
- The zone is the stations whose gauge passed Mu before the release. They come from B2's own ratio along her, not from the wreck's 18 m: the record is the judge, never the input.
- **Why it matters** (v1 section 8): at x −23 a zone of about 20 m reaching past bulkhead K opens the engine room's 13.9 thousand m³ from the first second.
- At the onset's own station, x −10.93 in boiler room 2, the same question asks which boiler rooms' spaces open. The what-if prints it.

## 3. The hand-over at the onset

**This needs a hand-over at the onset with the hinge, not a clean cut.** Z3's 'onset' what-if is that hand-over with a clean cut: `begin(sim, { any: true, cut: x, rule: 'break', t0 })`. With Z6 and B4, `begin` starts from it with the joint locked:
- θ 0;
- M(0) = Mu at x_b, in the onset's sense;
- c 0;
- each space's water and air as v1 section 2 hands them over.

**The demand at the hand-over** is then the joint's own moment at θ 0. As a CHECK it must agree with the gauge's moment at the onset station, within the gauge's own error (B1+B2: "the gauge's shear, unrelieved by her inertia, carries up to 3.3 MN of error").

**Which hand-over is the watch's own** is not Z6's choice. The flag's H1 stays the default until Bo's word: plan v2.1's pick (c), "(a) now, then the break with Z6 and B4 in ONE cascade". Z6 and B4 make the 'onset' hand-over complete. The cascade then lands once, with the air that sets its minutes.

## 4. The what-ifs: the ligament

**The principle**, agreed by the coordinator with B1+B2 for the papers at join 2:
- carry the joint's own force;
- print the margin and the sense at the release;
- run the as-built ligament and the sourced alternatives as what-ifs;
- never choose by the record.

**The static margin, from the gauge.** The ligaments at x −10.93, against the gauge's shear at the onset: 19.61 MN list free, 19.98 MN held. Riveting governs every case [B1+B2].

| Ligament | Vs (MN) | V/Vs list free | Held | Source |
|---|---|---|---|---|
| As built in the model | 20.34 | 0.964 | 0.982 | S.hinge |
| The sources' six webs a side, at the panel's 1 in | 25.37 | 0.773 | | girder research |
| Halpern's five side girders a side | 23.78 | 0.82 | | B1+B2 |
| Side girders triple-riveted (`eta: { double: S.JOINT.triple }`) | 27.23 | 0.72 | | B1+B2 |
| At Britannic's 3/4 in | 19.93 | 0.984 | 1.002 | girder research |
| Every strength × 0.95 | 19.32 | 1.015 | | B1+B2 |
| 5/8 in inboard | 18.33 | 1.070 | | girder research |
| The 30 ft member double-riveted | 17.51 | 1.120 | | girder research |

The ligament's tension Nt is 227 MN as built [B1+B2]. Whether her pull along her axis comes near it is the free body's to say: the gauge carries no axial force.

**Lh.** Lh is 20 m, with 9 ft and 36 in as what-ifs. Nt, Vs and the openings past a degree do not depend on it (the openings at 10 degrees agree within 2 % across all three) [B1+B2].

**What the free body adds.** The joint's own shear is dynamic: the bodies' inertia and their added mass relieve or load it, by up to the 3.3 MN above. On the as-built ligament that can move the verdict either way, so the as-built row is no more "the answer" than the others.

**The table Z6 and B4 print**, one row per ligament and per Lh:
- released or not;
- when, after the onset;
- θ at the release;
- by tension or by shear;
- the largest N/Nt and |V|/Vs on the way;
- the bow's distance and bearing from the point under the break;
- the stern's minutes afloat after the release.

The record (the bow 772 m dead ahead; the stern 1.5 to 3 minutes [R5]) is printed beside each row as a CHECK, never as the row's selector.

## 5. Tests, added to v1 section 7

MUST unless marked.

| # | Case | Band | Source |
|---|---|---|---|
| 11 | The joint's closure: the wrench the constraint puts on the bow is minus the stern's, and the five locked freedoms stay locked | equal to rounding; drift under 1e-9 m and 1e-9 rad over a simulated minute | B 4.4 |
| 12 | A hinge rig: two uniform prisms in still water, pinned, with a constant M | they settle at the θ where their weights' and buoyancy's moment about P equals M; θ 0 if M exceeds the demand | closed form |
| 13 | The same rig with a falling M(θ) | it holds until the demand reaches M(0); then it opens past the peak and never closes | closed form; S.hinge's monotone branch |
| 14 | The release rig: a pull along the pin that rises linearly in time | the release falls on the first sub-step where N passes Nt, to the sub-step | S.hinge's rule |
| 15 | The hand-over at the 1912 onset: the joint's own moment at θ 0 against the gauge's at x_b (CHECK) | within the gauge's error | B1+B2 |
| 16 | The energy identity with the tear's work W | closes to rounding | v1 test 3 |
| 17 | The witnesses' sequence on the as-built ligament (CHECK): she hangs by her bottom, the tear vents the bow's after spaces, the release, the stern settles back and floods at the cut, then rises end first | reported, with the ligament table of section 4 | v1 section 8; R5 5.2, 10c |

## 6. What I am least sure of, added to v1 section 9

1. **The ligament's lateral shear and torsion.** `S.hinge` gives Nt and Vs, the vertical shear. Her list at the break (3.6 degrees at the onset on S1) asks something of the double bottom sideways and in twist. Locked and unchecked is a bet: ask 2.
2. **Rigid unloading.** If the demand falls back below M(θ), θ holds; it never closes. A torn hull that swings back may close on its own faces, and that contact is out of scope.
3. **The tear's height in each space.** Until ask 1 is answered, the tear spans the parted strips of its layer. Water in low and air out high through the same tear (v1 section 4) depends on it.
4. **The internal opening across the cut while the hinge holds.** Decks, bulkhead stubs and boilers stand across the torn plane. Taking a space's whole share of the section as open is the most open case. Its band is the same as v1's first doubt (one opening, two, or many).
5. **The dynamic shear decides a static coin's edge.** On the as-built ligament the gauge says 0.964. The joint's own shear, with her inertia, can say either side of 1. Section 4's table carries that, and no row of it is the answer.

## 7. Size, and what it asks of B1+B2

**Size.** B4's joint on the free body adds about 300 to 500 lines to fall.js, beside v1's spaces module, and about 150 lines of trials (rigs 12 to 14). The lane stays L: D55's two to four days, now with the hinge's law already a library.

**The asks, sent to B1+B2 with this note:**
1. Per space at x, the tear's height range at θ, or the parted shell strips themselves (area, height, layer, side) as `hinge()` already holds them.
2. The ligament's capacity in lateral shear and in torsion, or a word that they are out of scope (locked and unchecked).
3. A word on the unloading law: θ holds when the demand falls below M(θ).

## 8. Sources

- v1 of this design, and its sources.
- The break's design: sections 4.3 (onset, hinge, tear, release) and 4.4 (two bodies, the cut zone, the open ends, the torn zone, "two bodies, one pin, a closed-form impulse").
- `S.hinge` on main `d679239`: `core/readers/section.js`, lines 515 to 621, and its header, lines 17 to 19.
- B1+B2's messages to Z1 of 2026-11-20:
  - the interface: `h.at(theta)` gives M, dM, c, cPast, W, zNA, Nt, Vs, open and beyond;
  - the release rule;
  - the shear at the 1912 onset: 19.61 MN list free, 19.98 MN held, against Vs 20.34 MN;
  - the ligament's alternatives;
  - "carry the joint's own force ... never choose by the record".
- B1+B2's girder research: `docs/research/RESEARCH_double_bottom_girders_v1_2026-11-20.md` (`18b4082`).
- The plan v2.1: D55, and item (c) of the hand-over's choice.
- Z3 on main (`d679239`): the 'onset' hand-over, `begin(sim, { any, cut, rule: 'break', t0 })`.
