# Her after watertight bulkheads: the head each bears, from its scantlings (v1.1)

2026-11-23, by the B1+B2 lane, at Z1's ask for G12's way up. v1 (`065108f`) is beside this.

v1.1 adds, at the coordinator's word of 19:36:
- section 6, the bands set against Bo's submarine spec's flat-panel capacities;
- the closed-form numbers certified by abacus, with their receipts.

The figures are e118's (`docs/research/experiments/e118_after_bulkheads_heads.js`, results in `results_2026-11-23/`).

## Why

From the break's onset the fall's stern floods compartment by compartment and then hangs (Z1, e117 with the spaces).
Zones 13 to 15 stay sealed and dry, and at 15 min she is still afloat; the record has her under in 1.5 to 3 min. The
fall takes one head for every bulkhead today, K.headBulkhead 15 m [8 to 30]. This note gives each of K, L, M, N and O
its own band.

Bo's spec makes the division of labour plain: a shallow ship's pocket failing at about 0.5 bar is arrested gently by
its own air. So these heads set WHEN a sealed after compartment gives way, and Z1's air sets how hard.

## 1. What the sources give

- Wilding, the British Inquiry, Day 19 (https://www.titanicinquiry.org/BOTInq/BOTInq19Wilding05.php) [read]:
  - the bulkheads were "carried up to D deck" aft (BI 20623);
  - bulkhead D is 44 ft from the tank top (BI 20627-20629);
  - its plating is 0.56 in on the tank top (BI 20636) and 0.30 in between E and F decks (BI 20639);
  - its stiffeners are "about 29 7/8" in apart (BI 20640-20643);
  - the plating is 10 to 20 % over Lloyd's for a 44 ft bulkhead (BI 20661-20662), and Lloyd's had no published rules
    past about 650 ft (BI 20660-20661).
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

## 7. What would sharpen it

- **The yard's scantling drawings** of the bulkheads (National Museums NI's Olympic and Titanic plans, not online), for
  the stiffeners' sections, face and brackets.
- **Lloyd's "new rules"** of 1913-14, which tabulate deeper bulkheads. Wilding's 75 to 100 % is against them.
- **A riveted seam's and a bracket's strength** under the membrane pull, for the opening above the mechanism.
