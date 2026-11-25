# Her after watertight bulkheads: the head each bears, from its scantlings (v1.2)

2026-11-23, by the B1+B2 lane, at Z1's ask for G12's way up. v1 (`065108f`) and v1.1 (`f7bbcb1`) are beside this.

v1.2 adds, at the coordinator's word of 23:47 (the stern work's digests of 2026-11-23: 01_02, 03, 04_05 and 10, in the
group's notes folder):
- section 1: Wilding's own word that the bulkheads were designed for a head to their top, re-read on the transcript;
- section 7: the weaker boundaries, the upper decks' and the casings' strengths, each with its tag;
- section 8: the dynamic factor on a bulkhead beside a failing space, and each after bulkhead's own natural period
  (e118's new section 7);
- section 9: the record these heads answer to, the stern's time afloat, widened to the witnesses' band;
- section 10: how the fall should take these heads (strength alone does not sink her stern);
- the "Why" corrected: the record's "1.5 to 3 min" was ours, derived, not a witness's.

Sections 2 to 6 are v1.1's, unchanged; e118's sections 1 to 6 print the same lines as before, to the character.

The figures are e118's (`docs/research/experiments/e118_after_bulkheads_heads.js`, results in `results_2026-11-23/`).

## Why

From the break's onset the fall's stern floods compartment by compartment and then hangs (Z1, e117 with the spaces).
Zones 13 to 15 stay sealed and dry, and at 15 min she is still afloat. The witnesses have her stern under 20 s to about
5 min after it parted (section 9). The fall takes one head for every bulkhead today, K.headBulkhead 15 m [8 to 30]. This
note gives each of K, L, M, N and O its own band.

Bo's spec makes the division of labour plain: a shallow ship's pocket failing at about 0.5 bar is arrested gently by
its own air. So these heads set WHEN a sealed after compartment gives way, and Z1's air sets how hard. The stern work
qualifies "gently" at these heads (section 8).

## 1. What the sources give

- Wilding, the British Inquiry, Day 19 (https://www.titanicinquiry.org/BOTInq/BOTInq19Wilding05.php) [read]:
  - the bulkheads were "carried up to D deck" aft (BI 20623);
  - bulkhead D is 44 ft from the tank top (BI 20627-20629);
  - its plating is 0.56 in on the tank top (BI 20636) and 0.30 in between E and F decks (BI 20639);
  - its stiffeners are "about 29 7/8" in apart (BI 20640-20643);
  - the plating is 10 to 20 % over Lloyd's for a 44 ft bulkhead (BI 20661-20662), and Lloyd's had no published rules
    past about 650 ft (BI 20660-20661).
- **What they were designed for** (v1.2; Day 19, https://www.titanicinquiry.org/BOTInq/BOTInq19Wilding03.php) [read]:
  - asked whether the bulkheads were "strong enough to resist the pressure of water which would be upon them in the
    event of one side of them being flooded", Wilding: "They were; they were so designed" (BI 20398);
  - the pressure depends on "The height of the top of a bulkhead above its connection to the tank top" (BI 20399);
  - the design load is "a depth of water reaching to the top of the bulkhead", and above that "It is immaterial"
    (BI 20400-20401).
  - So each after bulkhead's design head is its depth, 14.6 to 16.1 m (section 2). Section 4's bands lie 1.2 to 2.7
    times above it, the low end loaded from the stiffeners' side [derived].
- The Limitation of Liability depositions (https://www.titanicinquiry.org/lol/depositions/wilding02.php and wilding03)
  [read]:
  - "very large stiffeners of specially rolled sections", "elaborately bracketed at top and bottom", for docking on a
    single line of keel blocks;
  - the bulkhead plating 10 to 20 % and the stiffening "75 to 100 percent" over Lloyd's new rules.
- All her bulkheads were "constructed on the same footing for scantlings" (BI 25328-25331) [read in the W6 note].
- Lloyd's Register's Rules 1911-12, Table 10 (https://archive.org/details/HECRAR1912, leaves 210 to 214, printed pp.
  180-184) [read from the page images at the scan's resolution]:
  - stiffeners 30 in apart, bracketed at heads and heels;
  - it tabulates bulkheads to 40 ft deep only, its largest stiffener a bulb angle 12 x 4 x .70 in for 36 to 40 ft at a
    26 to 27 ft span;
  - hers aft are 48 to 53 ft deep.
- **NOT FOUND in any open source, kept in sight:**
  - her stiffeners' own sections;
  - which face of each bulkhead they stood on;
  - the strength of the watertight doors' frames.
  The yard's scantling drawings hold them.

Certified conversions:
- 29 7/8 in = 0.758825 m (`abacus1:281d857c3ff2`);
- 44 ft = 13.4112 m (`abacus1:5d517597513b`);
- 0.56 in = 14.224 mm (`abacus1:b1f84aa46e56`).
All three are exact.

## 2. The decks that cross each bulkhead (R3's tables) and the model's geometry

| Bulkhead | x (m) | Between | Floor (m) | D deck (m) | Depth | The lowest stiffener's span |
|---|---|---|---|---|---|---|
| K | -27.13 | boiler room 1 and the reciprocating engine room | 1.98 | 16.62 | 14.64 m (48.0 ft) | 6.87 m to G deck at the wings; 9.30 m to F deck at the centre past the engine casings |
| L | -48.16 | the reciprocating engine room and the turbine room | 1.98 | 16.80 | 14.82 m (48.6 ft) | 7.04 m to G deck; 9.48 m to F deck |
| M | -65.53 | the turbine room and the provision stores (zone 12) | 1.60 | 17.02 | 15.42 m (50.6 ft) | 5.21 m to the orlop |
| N | -84.73 | zone 12 and zone 13 (the refrigerated cargo) | 1.60 | 17.35 | 15.75 m (51.7 ft) | 5.54 m to the orlop |
| O | -101.19 | zone 13 and zone 14 (the hold between O and P) | 1.60 | 17.69 | 16.09 m (52.8 ft) | 5.88 m to the orlop |

K and L have no orlop: G deck meets them at the wings and the engine casings rise at the centre, so both spans are
shown.

## 3. The method

1. **The rule's margin.** Take three of Table 10's bracketed stiffeners. Find each one's plastic collapse under a head
   over the floor (e104's laws), against the head its row was sized for:
   - 24 to 26 ft deep: 1.427;
   - 30 to 32 ft: 1.448;
   - 36 to 38 ft: 1.300.
2. **The rule-sized stiffener** for each after bulkhead's depth and span is the one whose collapse head is that margin
   times the bulkhead's depth. Hers carries 1.75 to 2.0 times its moments (Wilding's 75 to 100 %, read as strength)
   [derived].
3. **Two loadings:**
   - upright: the water's head over the floor, a triangle;
   - standing: the stern on end, the bulkhead nearly level, a uniform pressure over the span.
4. **The stiffeners' face.** Loaded from the stiffeners' side their flanges trip first, at 0.6 to 0.8 of that
   [derived in `RESEARCH_falling_hull_physics_v1_2026-11-19.md`].
5. **The plating** between stiffeners: a strip clamped at them, its bending only, a lower bound.

Mild steel at 262 MPa, as section.js takes it.

## 4. The bands

All in m of water. The lowest stiffener governs. The low end is from the stiffeners' side; the high end is from the
plating's side.

| Bulkhead | Upright, over the floor | Standing, uniform | The stiffener's moments, M_p,mid + M_p,end (kN m) |
|---|---|---|---|
| K | 17.9 to 39.0 | 15.2 to 35.8 | 1,235 to 1,607 (to G); 2,095 to 2,752 (to F) |
| L | 18.1 to 39.4 | 15.4 to 36.1 | 1,313 to 1,708 (to G); 2,198 to 2,889 (to F) |
| M | 19.9 to 42.1 | 18.4 to 39.7 | 795 to 1,027 |
| N | 20.3 to 42.9 | 18.7 to 40.3 | 912 to 1,179 |
| O | 20.7 to 43.7 | 19.0 to 41.0 | 1,045 to 1,353 |

**Certified standing heads.** The standing head is 8 (M_p,mid + M_p,end) / (rho g s L^2), certified from the printed
moments and spans:
- M's high end: 39.6846 m (`abacus1:6d2c7d28aa66`);
- K's low end, to G deck: 27.4400 m (`abacus1:53caff9d92b6`). e118's 27.5 uses the unrounded span.
The plastic moments themselves and the upright triangle's collapse are numerical (e104's integration and a
bisection), not closed forms, so abacus does not certify them.

**The plating:**
- 0.56 in on the floor bends at 36.620868 m (`abacus1:11757c174464`), never first upright.
- Standing, the whole bulkhead is under one pressure, so the 0.30 in top strakes bend first, at 10.509815 m as a strip
  (`abacus1:ab841524c704`), and 14.45 m as a finite clamped panel by Wood (section 6). Both are mechanism pressures:
  where large permanent set begins, not where the plate opens.
- That is the figure to watch as she stands.

**The doors:** their frames' strength is NOT FOUND. Take the bulkhead's band [bet: the frames and their compensating
stiffeners built to the bulkhead's strength].

## 5. Against the fall's 15 m [8 to 30]

- Every after bulkhead's stiffeners are stronger, upright and standing alike, since her stiffening ran so far over the
  rule.
- Standing, the top strakes' mechanism (10.5 to 14.5 m) sits inside the old band.
- M, N and O, the ones the stern turns on (Z1), are the strongest: their spans to the orlop are short.

## 6. Against Bo's submarine spec's flat-panel capacities

The source is Bo's spec, `C:\code\_ref_subsim_zip\base_src\spec\SPEC-phys.md`, lines 1112-1153, REQ-STRUCT-020 [read
in full for this note]. It holds three static capacities of a flat stiffened panel under uniform lateral pressure:
- (a) the plate's mechanism, Wood's yield-line pressure (Zhang 1994, clamped: q_T = 48 M0 / (b^2 xi^2));
- (b) the stiffener's three-hinge pressure, p_s = 8 (M_p,mid + M_p,end) / (s l^2);
- (c) the plate's rupture, Greenspon 1955's membrane load, P_f = (w_f/a) sU (h/a) (1 + a^2/b^2) / (16/pi^4) at
  w_f/a = 0.10.
The panel opens at min(k_s p_s, P_f), with k_s 1 to 3 the spec's bet. Its own limits: validated only at aspect ratio
1.55, on steel of sU 41.8 to 72.3 ksi with a/h 110 to 432, and on clamped (welded) edges; nothing for rivet lines or
seams. Her ultimate strength is taken at 430 MPa [bet: the period's, as strength_tests' Stoney what-if takes it].

| Her panel | Aspect | a/h | (a) Wood, clamped (m) | (c) Greenspon at set 0.10 (0.13 to 0.23) (m) | (b) the stiffener (m) |
|---|---|---|---|---|---|
| floor, 0.56 in, K and L (to G deck) | 9.0, 9.3 | 53 | 41.6, 41.5 | 494 (642 to 1,136) | section 4's standing band |
| floor, M, N and O (to the orlop) | 6.9 to 7.8 | 53 | 43.3, 42.9, 42.5 | 496 to 498 | the same |
| top strakes, 0.30 in, E to D deck | 3.6 | 100 | 14.4 | 281 (366 to 647) | (short spans: not governing) |

Certified, on M's panels:
- Wood's floor panel: 43.319386 m (`abacus1:30d72abdc232`);
- Wood's top panel: 14.450792 m (`abacus1:a3d4c4fa9d71`);
- Greenspon's top panel at 0.10: 281.48950 m (`abacus1:076ed333a164`).

**Where they agree:**
- **(b) is section 4's standing case exactly:** the same three-hinge virtual work, 8 (M_p,mid + M_p,end) / (s l^2).
  The spec derives it as this note does.
- **(a) agrees in form.** The spec's own limit for an infinitely long clamped strip is 16 M0 / b^2, which is section 5's
  strip, 4 sY t^2 / s^2. For her finite panels Wood's mechanism is 13 to 37 % above the strip, as a finite panel must
  be. So v1's plating figures were the strip's lower bound, and Wood's are the better mechanism figures. Neither
  changes which part governs:
  - upright, the stiffeners;
  - standing, the top strakes' mechanism first, then the stiffeners.

**Where a riveted bulkhead needs its own source:**
- **(c) Greenspon's rupture loads (hundreds of m) do not transfer.**
  - Her panels lie outside his validation on both counts: aspect 3.6 to 12.5 against 1.55, a/h 53 and 100 against 110
    to 432.
  - His membrane theory needs the full plate tension carried at clamped edges. In her bulkheads that tension would cross
    the plates' riveted seams and the stiffeners' bracket and heel rivets, which carry far less (e104: a 7/8 in rivet,
    116 kN in single shear [bet]).
  - So his loads say only that the plate itself does not open first.
- **The opening rule** min(k_s p_s, P_f) then reduces to k_s times the stiffener's three-hinge pressure. k_s, 1 to 3,
  is the spec's bet for an end-restrained welded stiffener's membrane reserve; the spec found no public rupture test of
  a stiffened panel. For hers the reserve would ride on the brackets' rivets ("elaborately bracketed", Wilding), so the
  same bet needs a riveted-connection source before it is taken. With 1 to 3 the standing opening runs from section 4's
  band up to about 120 m.
- **What a riveted bulkhead needs**, which neither source gives:
  - the seams' and the bracket connections' rivet strength under the membrane pull;
  - the stiffeners' face;
  - the door frames.
  Until then the mechanism figures (section 4's bands, and the top strakes' 10.5 to 14.5 m standing) are the honest
  heads at which a bulkhead starts to give way. The opening is a bet above them.

The stern work's helper on subsim reached the same three readings on its own (their 03, section 6, item 4): the finite
panel above the strip, Greenspon not for riveted panels, the stiffener formula the textbook beam. It adds that the spec
never says "welded": that reading is ours, though fair.

## 7. The weaker boundaries: the upper decks' and the casings' strengths

**The headline:** nothing read by anyone so far gives a failure pressure, or the way it opens, for a riveted bulkhead,
deck or shell, loaded from either side (the stern work's 04, section 3; their D2 searched for a test of an air-backed
panel rupturing under a head of water and found none). Section 4's bands are the only sourced strengths for K to O.
How a riveted boundary opens once it yields stays a bet. What there is, is weaker things.

### 7.1 Her builder's words on the weaker boundaries (Wilding, re-read on the transcript for v1.2) [read]

- **Hatch trunks** (Day 19, BOTInq19Wilding03.php, BI 20391): "a watertight hatch trunk - a trunk hatch as distinct
  from a watertight bulkhead - is not as a Rule capable of standing any great head of pressure. When once the water got
  up as high as the top of the trunk it would probably collapse".
- **Her decks** (BI 20392-20395): "Are any of these decks watertight? - None whatever, except the weather deck"; "the
  Orlop deck is not watertight; the G deck is not watertight". The orlop was watertight "in the forepeak" "And in the
  three after-holds, I think".
- **No bulkhead was ever pressure-tested** (Day 19, BOTInq19Wilding05.php, BI 20593-20610): "None at all"; only the
  spraying test, which finds "Whether the local caulking and riveting is good".
- **The "40 feet"** (Day 19, BOTInq19Wilding06.php, BI 20671): "The head of water behind it at most could not exceed
  the 40 feet to the top of the bulkhead". It is about the pace of the water through a door, an intact ship's geometric
  limit, not a strength [read]. (The stern work's 05 cites it as BI 20593; it is BI 20671.)
- **The funnel casings** (Day 20, https://www.titanicinquiry.org/BOTInq/BOTInq20Wilding02.php, BI 20921): "The funnels
  are carried from the casings in the way of the comparatively light upper decks - that is, the boat deck and a deck.
  When these decks became submerged and the water got inside the house, the water would rise outside much faster than
  inside, and the excessive pressure on the comparatively light casings which are not made to take a pressure of that
  kind would cause the casing to collapse".

### 7.2 From the literature, as the stern work's digest gives them

Each item carries its source's status as their 04_05 (section 3) gives it; none was re-read for this note.

| Item | Head of water | Source and its status | For her |
|---|---|---|---|
| Non-watertight doors (joiner, fire, cold room) | collapse 1.0 to 3.5 m; leak at once | Jalonen and others, abstract only, second-hand | a modern cruise ship; the fall bets joiner work at 2 m |
| Steel weathertight hatch cover, loaded from above | design 1.71 m; tightness lost by about 4 m; collapse 4.1 to 5.3 m (four estimates) | Faulkner 2001, first-hand | a 1966 Load Line cover; the nearest thing to the fall's E deck from below, 5 m |
| Ferry side windows | 6 m | Vassalos 2006, a model's assumption | none for her glass |
| Single-skin collision bulkhead's plate, three-hinge | 19.9 m (200 kPa) | Faulkner 2001, first-hand | welded; section 4's upright low ends are 17.9 to 20.7 m |
| Bow boundaries; wing and hopper tanks; double skin | about 45, 50 and 100 m | Faulkner 1998, first-hand | welded; the fall bets the shell at 40 m |
| Doors' critical heads | (not read) | IMO SLF 47/INF.6 (2004), cited by Ruponen 2009 | the data the fall's door bets should be checked against |
| No. 2 hatch's tarpaulin | lifted "like a big dome", "blown up by the air from below" | Hendrickson, BI 4912-4913 [their transcript] | a very small difference [their inference] |
| No. 5 and No. 6 hatch covers | two hatch beams, wood covers, tarpaulins, a 30 in coaming | the repo's topsides note | wood covers are their 05's [bet] |
| Glass, skylights, the domes | no figure anywhere | their 04_05 | the after staircase's dome is 18 ft 6 in across |

### 7.3 The wreck, as their 05 reads Mengot's imagery

- Her transverse bulkheads below D deck still stand.
- The upper part of bulkhead L collapsed, and at E deck it is broken toward the bow. Which side loaded it is not
  settled.
- The decks and the shell parted from each other everywhere forward of No. 6 hold, the brackets between them failed.
  The shell parted from the keel for 175 ft aft of the tear.
- The second-class entrance house caved IN; the lift machinery house's access panels are sprung OUT.
That is the only evidence on riveted joints and connections failing that either folder holds.

### 7.4 What it says of the fall's boundary kinds

The fall's strengths today (`core/readers/spaces.js`, lines 806-808): a bulkhead 15 m, joiner work 2 m, E deck 5 m
from below and 15 m from above, the shell 40 m, all [bet].
- **Bulkheads K to O:** section 4's bands, above their design head (section 1).
- **Joiner work, 2 m:** inside the doors' 1.0 to 3.5 m [abstract only]. Keep it.
- **E deck from below, 5 m:** its nearest measured analogue, a steel hatch cover, holds tight to about 4 m and collapses
  at 4.1 to 5.3 m. But her decks were not watertight (BI 20392), so E deck between two of the fall's spaces lets water
  through long before it fails [inferred]. And the trunks through it collapse once the water outside reaches their top
  (BI 20391): a head of about one deck's height, 2.4 to 3 m [inferred].
- **The casings in the light upper decks** (the funnels', the engine casing's, the fidleys'): "not made to take a
  pressure of that kind" (BI 20921). They are joiner work's kind, 1 to 3.5 m [inferred], loaded whenever the water
  rises outside faster than inside. NH7's vents table holds their openings.
- **The shell, 40 m:** below every welded figure (45 to 100 m). Nothing riveted is known. Keep it as the bet it is.
- **The orlop in the three after holds** is a watertight flat by Wilding's "I think" (BI 20395); which three is not
  said (abaft the turbine room, zones 12 to 14, is the plain reading [inferred]). The fall's spaces are not cut at the
  orlop (E deck is `spaces.js`' only deck boundary), so this matters only to a finer split, such as NH6's rooms network:
  there the hold under it is closed by a watertight deck.

## 8. The dynamic factor on a bulkhead beside a failing space

The common brief's doubt, "a mostly quasi-static cascade with a dynamic load factor of at most about 2", is REFUTED in
size (the stern work's H4 and their review, 10). It stands in kind: what loads the neighbour is the failing space's air
overshooting the static difference over seconds, not a shock.

### 8.1 The air's overshoot (their figures; the receipts are cited in their notes, not re-run here)

- **Lossless.** The load factor (p_max - Q)/(P - Q), with x = p_air/p_sea:
  - isothermal: 2.01 at x 0.99, 2.15 at 0.9, 2.36 at 0.8, 3.13 at 0.6 and 3.92 at 0.5;
  - polytropic, n 1.4: 2.01 to 3.31.
  It always exceeds 2, because the gas spring hardens (`abacus1:d262c6d34d63`, C2; `abacus1:00025f4af278`,
  `abacus1:c4d1567b0521`, `abacus1:225064274e41`, D1).
- **Through an opening** (their C2's orifice model, Cd 0.6, L_eff 0.9 sqrt(A); 1,000 m3 at 4 bar, x 0.5 to 0.95)
  [run, uncertified]:
  - 1 m2: 1.00 to 1.01;
  - 10 m2: 1.04 to 1.28;
  - 50 m2: 1.46 to 1.87;
  - 200 m2, a whole bulkhead: 2.03 to 2.91.
- **On the fall's own failures** (their review): the opening's loss takes 0.30 to 0.95 of the lossless factor, 2.69 at
  x 0.14 (the hand-over's case, BR1P0).
- **A sealed pocket at one atmosphere, its boundary gone whole, nothing throttling it** (subsim's model, ported)
  [run, an upper bound]: the air peaks at 6.8 atm at 15 m (3.9 times the static) and 41 atm at 44 m (9.2 times),
  arrested in 0.50 s and 0.30 s for 1,000 m3.
- **The neighbour is first UNLOADED**, pulled toward the failing space, and loaded after (their D1 and D2). It goes
  only if it was already near its own static limit (Kishore 2021, abstract only).

### 8.2 The steel's own factor: each after bulkhead's natural period (e118, section 7)

Nobody had these: subsim's cascade step (one degree of freedom on the load) holds a slot for each bulkhead's period
and finds no value (their 03, section 2.5). e118 now gives them.

**The model:**
- The lowest stiffener with its plating, in the bulkhead's first mode, all its stiffeners in phase (the mode a uniform
  pressure excites).
- Hers is Table 10's deepest bracketed stiffener scaled alike in every dimension until its moments are section 4's
  [bet: Wilding's "specially rolled sections" in the rule's shape].
- The plating is 0.56 in, effective over its whole spacing. E is 207 GPa and steel 7,850 kg/m3.
- Rayleigh's quotient is taken on an assumed mode, clamped (bracketed) and simply supported, as the band's ends.
- The water's added mass on a wetted face is Rayleigh's integral for the panel (span by breadth) in a rigid baffle,
  incompressible, the far water at rest [derived].
  - Its check is a square piston: 2.972873 against the exact 4 ln(1 + sqrt 2) - (4/3)(sqrt 2 - 1) = 2.97320959825
    (`abacus1:e96ca329c368`).
  - Her longest panel at n 600 against 1,200: -0.015 %.

| Bulkhead, its lowest span | Breadth (m) | Her stiffener, scaled (d x bf x t, in) | T dry (s) | T, one face wetted (s) | T, both faces (s) |
|---|---|---|---|---|---|
| K, 6.87 m to G deck | 28.2 | 14.7 x 4.9 x 0.86 to 16.2 x 5.4 x 0.94 | 0.016 to 0.041 | 0.072 to 0.207 | 0.100 to 0.290 |
| K, 9.30 m to F deck | 28.2 | 18.0 x 6.0 x 1.05 to 20.2 x 6.7 x 1.18 | 0.023 to 0.060 | 0.102 to 0.300 | 0.142 to 0.420 |
| L, 7.04 m to G deck | 27.2 | 15.0 x 5.0 x 0.87 to 16.6 x 5.5 x 0.97 | 0.016 to 0.042 | 0.073 to 0.211 | 0.102 to 0.295 |
| L, 9.48 m to F deck | 27.9 | 18.4 x 6.1 x 1.07 to 20.6 x 6.9 x 1.20 | 0.024 to 0.061 | 0.103 to 0.303 | 0.143 to 0.424 |
| M, 5.21 m to the orlop | 21.8 | 12.6 x 4.2 x 0.73 to 13.7 x 4.6 x 0.80 | 0.011 to 0.029 | 0.047 to 0.135 | 0.066 to 0.189 |
| N, 5.54 m to the orlop | 16.5 | 13.2 x 4.4 x 0.77 to 14.4 x 4.8 x 0.84 | 0.012 to 0.030 | 0.048 to 0.138 | 0.067 to 0.193 |
| O, 5.88 m to the orlop | 11.2 | 13.8 x 4.6 x 0.81 to 15.2 x 5.1 x 0.88 | 0.013 to 0.032 | 0.048 to 0.137 | 0.067 to 0.191 |

Certified: M's stiffest, dry and clamped, 0.011065137 s from the printed section (`abacus1:e3bf4d7fe979`).

**What it says:**
- **The water sets the period, not the steel.** One wetted face adds 13.7 to 24.5 times her steel's mass per metre.
- **The steel follows the air.** A load rising over t_r to a constant gives a peak at most 1 + T/(pi t_r) times the
  static one, and never more than 2.
  - Against the air's first peak through the fall's own opening, 0.3 to 3.4 s after a failure (their review, F7), the
    steel's own factor at 3.4 s is at most 1.028 (one face) and 1.040 (both).
  - Only a neighbour's boundary gone whole, its air arrested in about 0.3 s, lifts it. With one face wetted it reaches
    1.14 to 1.15 on M, N and O, 1.22 on K and L to G deck, and 1.32 on K and L to F deck. With both faces wetted those
    are 1.20, 1.31 and 1.45.
  - The review's "below 1.1 [bet]" holds for every slow rise. Under a neighbour's whole collapse it holds only at the
    band's stiff (clamped) end of the short spans.
- **The limits.** A full, closed compartment cannot take the in-phase mode's change of volume, so its first allowed mode
  is shorter. With a free surface or an air pocket in the space, as in a cascade, these periods stand. So they are the
  long end [inferred].
- The section is a bet (the yard's drawings hold hers), and the F-deck spans ask 18 to 21 in of section. That is deeper
  than the period's rolled bulb angles, so the centre's stiffeners may have had a stringer or a web between [bet].

### 8.3 For the cascade, and for B4's gate 4

- **The check is static today.** Z1's `failBoundaries` sets each boundary against the static difference across it
  (`spaces.js`, about lines 804 to 861), and the flow law is quasi-steady, with no inertia and no overshoot (their
  review, section 5). Beside a failing space that understates the load:
  - by 1.0 to 1.3 for an opening of 10 m2 or less into 1,000 m3;
  - by 2.0 to 2.9 when the failed boundary is a whole bulkhead;
  - and when it goes at once, the steel's own factor on top: up to 1.15 to 1.2 on M, N and O, and 1.3 to 1.45 on K and
    L (section 8.2).
- **The right tool** is the exchange law with the opening's inertance, or subsim's one-degree-of-freedom step on the
  load L(t) = p_air - p_n, with section 8.2's T_b and section 4's bands as its capacity. A factor on the static check
  would be a what-if only. Either is Z1's to choose.
- **For B4's gate 4** (the ligament's what-ifs) it enters once the joint runs with Z1's spaces, which it does not yet.
  Then K, the stern's first bulkhead behind the break, carries it: its head under the dynamic load sets how soon her
  engine room floods after the release.

## 9. The record these heads answer to: the stern's time afloat

**"Under in 1.5 to 3 min" is ours, and derived** (R5, `RESEARCH_the_fall_and_the_wreck_v1_2026-11-19.md`, section 5.2,
line 218, tagged [derived]). It is Pitman's 2:20 less a break at 2:17 to 2:18:36. Neither end of that break is a
witness:
- T 157 was the model's own event list;
- T 158.6 is Paik et al.'s computed collapse [search summary] (`RESEARCH_breakup_hull_girder_v1_2026-11-17.md`,
  line 177).

**The witnesses**, from R5's section 5.2 [read: Wormstedt and the transcripts]:
- Etches, the stern "seemed to stand 20 seconds" (US pp. 817-818);
- Evans, the after part lay level "About four or five minutes" (US p. 753);
- Buley, it "uprighted herself for about five minutes" (US pp. 609-610);
- Mengot, "5 minutes or less" (the girder note, 5.1).

The stern work's 05 adds:
- Symons, 2 to 3 min at most after the poop righted (BI 11512);
- Bright, "A few seconds";
- Ryerson, "several minutes";
- Beesley, about 5 min (via Gracie).

R5's own section 10c (line 381) already says "stands 20 s to about 5 min".

**The band, decided for this lane's part (Bo's word: "It doesn't have to be precise to the minute ... It's more about
the physics and the dynamics and the invariants themselves"):**
- **IN:** 20 s to 5 min from the parting (the joint's release).
- **The centre:** 1 to 3 min [derived, weak]. Print it beside; it is never a fit target.
- **Clearly OUT:** below 15 s or above 6 min.

**Where the narrow band is used:**
- the CHECK row "the stern afloat after the release" in `tools/fall_trials.js` (lines 546 and 550, 90 to 180 s; Z1's
  file);
- the descent brainstorm v2 (line 110, which calls it the witnesses', and line 163, where the vent was sized from it)
  and v2.1 (line 57);
- the free-body air designs v1 and v1.1, and the G12 way-up design v1;
- this lane's G12 break-side design v1 and v1.1, and this note's v1 and v1.1.

The break-and-two-bodies design v1 (line 122) had "1 to 5 minutes".

**The break's own band, T 157 to 158.6, has the same flaw.** It is strength_tests' `RECORD.T` and the ledger's
`break_onset` row, a report, never scored; both rest on the same two model numbers.
- The witnesses: Joughin read 2:15 with the lights still burning (BI 6359-6363), the lights went "about 2:17" (the
  Report), she was gone at 2:20 (Pitman).
- With the stern afloat 20 s to 5 min, they put the parting at about 2:15 to 2:19:40, T 155 to 159.7, centre 2:17.
- **A stated conflict:** both of this lane's onsets (the preset at T 159.41, the watch at T 156.46) lie inside that band
  and outside today's. So it is recommended, not taken: it waits for the coordinator's or the mainline's word, and if
  yes, both rows move together.

## 10. How the fall should take these heads

- **Per bulkhead**, from section 4's bands (Z1's `K.headBulkheads` by id), standing or upright by her attitude.
- **Never lowered to make the stern sink on time.** Strength alone does not sink her stern in today's fall. With the
  stern work's damage stand-in, any K.headBulkhead of 16 m or more gives no failure at all, and the stern floats level
  at a 12 m draught (to 300 s; to 1,800 s at 44 m). The default cascade starts only because 15.1 m lies against 15 m
  (their 01 and 02) [run, as their digest reports it].
- **Their diagnosis, for Z1 to judge:**
  - the one-way limiter (`spaces.js` line 614, a floor of 1e-6 m2) passes almost nothing from a full or a dry side: 0.03
    m3 in 10 s through 20 m2, where Bernoulli gives 368 m3/s. With a 1 m2 floor the flag's hang is 70 s, not 176 s, a
    sensitivity and not a mend;
  - a space gives way once and never again;
  - port and starboard are sealed from each other in 30 of 32 pairs;
  - the weather openings shut at the hand-over never open.
- If the mended fall still floats her too long, the missing piece is in the openings, the casings, the limiter and the
  once-only rule, not in the steel. The record's band is now the witnesses' 20 s to 5 min (section 9).

## 11. What would sharpen it

- **The yard's scantling drawings** of the bulkheads (National Museums NI's Olympic and Titanic plans, not online), for
  the stiffeners' sections, face and brackets, and so each one's own period in place of section 8.2's scaled section.
- **Lloyd's "new rules"** of 1913-14, which tabulate deeper bulkheads. Wilding's 75 to 100 % is against them.
- **A riveted seam's and a bracket's strength** under the membrane pull, for the opening above the mechanism.
- **IMO SLF 47/INF.6 (2004)**, the doors' critical heads, for the fall's door and joiner bets.
- **A riveted panel's rupture test** under a head of water with air behind it. None is known to anyone so far.
