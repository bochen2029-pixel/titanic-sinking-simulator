# Z6 inside B4: the joint's hinge elastic-plastic, proved on rigs (v1.2)

- **Written:** 2026-11-20, 16:05 CST, by the Z1 session (Claude Code 7fe8d708, Opus 5.5).
- **For:** the coordinator (local_5ca1b235) and B1+B2 (local_7038249f), at Bo's "keep going, coordinate with the others".
- **Status:** design only. Nothing is built in core; the rigs run standalone.
- **Read with:**
  - v1, `DESIGN_free_body_air_by_space_v1_2026-11-20.md` (the air by space);
  - v1.1, `DESIGN_free_body_air_by_space_v1_1_2026-11-20.md` (the joint and the tear).

  This note changes v1.1 where it says so; the rest of v1.1 stands.
- **Evidence:** `docs/research/experiments/e68_z6_joint_rigs.js`, with its table `results_2026-11-20/e68_z6_joint_rigs.txt` (commit `cee28cc`).

**What changed since v1.1:**
1. **Unloading is not rigid.** B1+B2, 2026-11-20 15:5x CST: "unloading is probably not rigid". Past the tear's top, the double bottom carries the residual moment, about 0.13 GN m at x −10.93, bending about its own axis near its own plastic moment. When the demand falls, it springs back elastically by about (M(θ) − M′) Lh / (E I) [B1+B2]. That is of the order of a degree at Lh 20 m, about the size of the tear's top (0.83 degrees), and seven times less at 9 ft. "The torn part does not mend; that part of your bet stands."
2. **The hinge is an explicit elastic-plastic law,** no longer a clamped constraint row (section 1 below). Only the five locked freedoms stay an exact constraint.
3. **e68 proves the joint on plain rigid bodies against closed forms,** in both modes; every MUST row passes (section 2).
4. **A label in v1.1 section 4 was wrong,** per B1+B2: the row "Halpern's five side girders a side" (23.78 MN) is a model variant, not Halpern's layout. See section 3.

## 1. The hinge's law (replaces v1.1 section 1's "The hinge's law" and its "never decreases")

**The state.** The hinge's angle θ is measured from the bodies' attitudes each sub-step (the bow's against the stern's, about the hinge's axis). The hinge keeps four quantities:
- whether it has yielded;
- θY, the angle at which it yielded;
- θmax, its furthest angle, which never decreases;
- M0, the moment it carried at the hand-over.

**The moment it puts on the bodies, closing positive.** It is an equal and opposite pair about the hinge's axis, applied from the law at the sub-step's start.

1. **Before it yields:** `M0 + k0 θ`.
   - k0 is the intact section's slope, E I / Lh at x_b.
   - M0 is the joint's own moment at the hand-over, from one locked solve at θ 0. So the hand-over starts at rest, with no transient (e68 E1).
2. **It yields where that line reaches M(0) = Mu:** `θY = max(0, (Mu − M0) / k0)`. It yields at once when the hand-over already asks more than Mu.
3. **At its furthest** (θ ≥ θmax): the backbone `M(θ − θY)`, from `S.hinge`. θmax follows θ.
4. **Below its furthest:** the ligament's line, `M(θmax − θY) − ku (θmax − θ)`.
   - ku is the slope of unloading from that point of the backbone. That is E I of what still holds, about its own axis, over Lh, as `S.hinge` will give it [B1+B2's offer: "the unloading slope (E I / Lh, per step) in S.hinge"].
   - It reloads along the same line back to `M(θmax)`, then rides the backbone again [B1+B2].

**Why explicit.** Every slope here is soft against the sub-step.
- **On ku:** the real pieces' pitch inertia about the pin, with their added mass, gives periods of tens of seconds. On the rig e68 used, ku = the demand per degree, the period is 3.1 s against sub-steps of 1/256 to 1/1024 s.
- **On k0:** periods of seconds.
- **The steep falling branch:** just past the peak the backbone falls at about −9,300 GN m per rad at x −10.93 with Lh 20 m [B1+B2]. That is far steeper than ku, about 7 GN m per rad by B1+B2's spring-back. It is a snap-through: once the demand passes Mu, the opening runs away down the backbone to its residual. That runaway is the break's crash ("a crash, sharp reports, a roar of 15 to 20 seconds" [B 4.3]). It is physical, and the explicit law follows it at the sub-step's resolution.
- **The five locked freedoms** (the pin's translation, the relative roll and yaw) are the stiff ones. They stay the exact constraint of v1.1 section 1, with each body's 6 × 6 generalized mass. Only they are projected at the sub-step's end; θ is free.

**The torn part never mends.** θmax never decreases. θ itself may come back along the ligament's line, by about 2 (M − demand) / ku: about a degree here.

**Beyond the line.** If the demand reverses far enough to close the hinge past its permanent set, the torn faces meet, or the section reaches its capacity in the other sense. Neither is modelled: the ku line simply continues (section 4, doubt 2).

**The rigid-plastic law of v1.1** is the limit k0, ku → ∞. e68 keeps it as a mode, and the closed form of its rig B is the same as the elastic rig's furthest angle (no elastic energy is stored on the backbone).

**The release** is as v1.1, with one detail settled by e68. The sub-step whose demanded force passes Nt or Vs is the release sub-step, and its impulse is not applied: the ligament that cannot carry it parts.

## 2. What e68 proves (it replaces v1.1's tests 11 to 14 for the joint)

| Row | Rig | Result | Against |
|---|---|---|---|
| A1–A3 | Two prisms (2.0e7 and 3.0e7 kg) pinned, tumbling in empty space, the hinge held | Linear momentum to 5e-15. The five locked freedoms to 3e-14 m and 8e-17 rad. θ held to 1e-16 rad (rigid mode projects the hinge's own angle while it holds; without that it crept 1e-6 rad in a minute) | rounding; 1e-9 |
| A5 | Twenty solves with random symmetric positive 6 × 6 inverse masses (an added mass's couplings) | All six rows met to 4e-14 of the velocities | rounding |
| B | A prism hung by a rigid-plastic hinge, M constant | Held at 1.1 × the demand. At 0.6 × it stops at 1.65999 rad (1/1024 s), and at 0.9 × at 0.78668. Never back | the energy balance W′ (L/2) sin θ = M θ: 1.66003 and 0.78668 |
| C | The same, with a falling M(θ) | Held at M0 1.02 × the demand; at 0.98 × it opens, swings past the vertical, never closes | — |
| E1–E5 | The elastic-plastic hinge (ku = the demand per degree, k0 = 50 ku) | Held from the hand-over with no transient (0 rad). Its furthest angle 1.65999. It rocks on the ligament's line by 1.355 degrees. On a falling backbone it rocks by 1.973 degrees. The furthest never decreases. The energy identity, with the hinge's own work, holds throughout and falls with the sub-step | the energy balance; 2 (M − demand) / ku = 1.378 and 1.978 degrees |
| D1–D3 | A held joint pulled along her at 10 MN/s against Nt 227 MN; across her at 1 MN/s against Vs 20.34 MN | Released on sub-step 1453 by tension, and on 1302 by shear. The margins the sub-step before: 0.99945 and 0.99942 | the first sub-step with N > Nt (1453) and |V| > Vs (1302) |

**What e68 does not prove:**
- the joint between fall.js's own bodies, with Kirchhoff's added mass, the water and the air;
- fall.js's implicit midpoint, which e68 replaces with a first-order semi-implicit step.

Those are the lane's: it reruns these rigs as trials on fall.js's bodies (v1.1's tests 11 to 16).

## 3. The ligament's table (v1.1 section 4), relabelled

B1+B2: "Halpern's five side girders a side (23.78) is the model's own n = 5: five 1 in × 63 in girders evenly spaced, double-riveted. The research showed Halpern's five are the four inboard intercostals plus the wing one, so the sources' reading of it is the six-webs row (25.37 at 1 in, 19.93 at 3/4 in)."

So that row of v1.1's table reads:

| Ligament | Vs (MN) | V/Vs list free | Source |
|---|---|---|---|
| The model's own n = 5 variant: five 1 in × 63 in girders evenly spaced, double-riveted (not Halpern's layout) | 23.78 | 0.82 | B1+B2 |

The table keeps both kinds of row: the sources' layouts, and the model's variants.

B1+B2 confirm that every other figure of v1.1 section 4 is quoted correctly:
- Vs, and V/Vs list free and held;
- Nt 227 MN;
- the Lh what-ifs.

## 4. Doubts, changed from v1.1 section 6

1. **The ligament's lateral shear and torsion.** Out of B1's scope. B1+B2 will give rough capacities for a CHECK column; the lateral one is against V tan(list), about 1.2 MN at 3.6 degrees [B1+B2]. They stay locked and unchecked in the joint, and are printed.
2. **The ligament's line past its zero** (this replaces "rigid unloading"). The ku line is taken to continue both ways. Neither the torn faces' contact nor the section's capacity in the other sense is modelled.
3. **The tear's height in each space.** `S.hinge` will return the parted strips' z ranges by layer and side, with their openings [B1+B2]. Until then, v1.1 section 2's stand-in.
4. **The internal opening across the cut.** As v1.1, doubt 4.
5. **The dynamic shear decides a static coin's edge.** As v1.1, doubt 5. With the elastic hinge, the bow hanging by her bottom rocks on the ligament's line, and the joint's shear rocks with it. The margin printed is the largest over the hang, not the first.

## 5. What it asks of B1+B2 now (it replaces v1.1 section 7's asks)

1. **k0 at x:** the intact section's E I / Lh, or a word to take B1's elastic midship I.
2. **ku as the tear grows:** the slope of unloading from each point of the backbone (E I of what still holds, about its own axis, over Lh). Either as an array beside M in `S.hinge`, or the one number at the tear's top if it varies little.
3. **The parted strips' z ranges by layer and side,** with their openings, and the rough lateral and torsion capacities, as offered.

Sent at 16:05 CST. No hurry: Z6 starts after C3 and the lists (D55).

## 6. Size

Unchanged from v1.1 section 7. The explicit hinge replaces the clamped row: fewer lines, not more. The five-row constraint, the projection and the release are e68's, about 150 lines to carry into fall.js.
