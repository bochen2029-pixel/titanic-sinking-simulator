# Her after watertight bulkheads: the head each bears, from its scantlings (v1)

2026-11-23, by the B1+B2 lane, at Z1's ask for G12's way up. The figures are e118's
(`docs/research/experiments/e118_after_bulkheads_heads.js`, results in `results_2026-11-23/`).

## Why

From the break's onset the fall's stern floods compartment by compartment and then hangs (Z1, e117 with the spaces).
Zones 13 to 15 stay sealed and dry, and at 15 min she is still afloat; the record has her under in 1.5 to 3 min. What
the after bulkheads bear decides whether the stern sinks or hangs.

The fall takes one head for every bulkhead today, K.headBulkhead 15 m [8 to 30]. This note gives each of K, L, M, N and
O its own band, from its scantlings where they are read, and says where they are not.

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
  - "very large stiffeners of specially rolled sections", "elaborately bracketed at top and bottom", for the transverse
    strength docking on a single line of keel blocks asked for;
  - the bulkhead plating 10 to 20 % and the stiffening "75 to 100 percent" over Lloyd's new rules.
- All her bulkheads were "constructed on the same footing for scantlings" (BI 25328-25331) [read in the W6 note].
- Lloyd's Register's Rules 1911-12, Table 10 (https://archive.org/details/HECRAR1912, leaves 210 to 214, printed pp.
  180-184) [read from the page images at the scan's resolution]:
  - the plating and vertical stiffening of watertight bulkheads, by the bulkhead's depth and the stiffener's span from
    the lowest deck to the floors;
  - stiffeners 30 in apart, bracketed at heads and heels;
  - it tabulates bulkheads to 40 ft deep only, its largest stiffener a bulb angle 12 x 4 x .70 in (flanged plate
    16 x 6) for 36 to 40 ft at a 26 to 27 ft span;
  - her after bulkheads are 48 to 53 ft deep, past the table.
- NOT FOUND in any open source:
  - her stiffeners' own sections;
  - which face of each bulkhead they stood on;
  - the strength of the watertight doors' frames.
  The yard's scantling drawings hold them.

## 2. The decks that cross each bulkhead (R3's tables) and the model's geometry

| Bulkhead | x (m) | Between | Floor (m) | D deck (m) | Depth | The lowest stiffener's span |
|---|---|---|---|---|---|---|
| K | -27.13 | boiler room 1 and the reciprocating engine room | 1.98 | 16.62 | 14.64 m (48.0 ft) | to G deck at the wings, 6.87 m; to F deck at the centre past the engine casings, 9.30 m |
| L | -48.16 | the reciprocating engine room and the turbine room | 1.98 | 16.80 | 14.82 m (48.6 ft) | 7.04 m to G deck; 9.48 m to F deck |
| M | -65.53 | the turbine room and the provision stores (zone 12) | 1.60 | 17.02 | 15.42 m (50.6 ft) | to the orlop (stores on it aft of M), 5.21 m |
| N | -84.73 | zone 12 and zone 13 (the refrigerated cargo) | 1.60 | 17.35 | 15.75 m (51.7 ft) | to the orlop, 5.54 m |
| O | -101.19 | zone 13 and zone 14 (the hold between O and P) | 1.60 | 17.69 | 16.09 m (52.8 ft) | to the orlop, 5.88 m |

- K and L have no orlop: the engine rooms rise through it. G deck meets them at the wings (stores and workshops in R3's
  G table) while the casings rise at the centre, so both spans are shown.
- The floor is the double bottom's top, deeper under the reciprocating engines (section.js's SCANT.db).

## 3. The method

1. **The rule's margin.** Take three of Table 10's bracketed stiffeners. Find each one's plastic collapse under a head
   over the floor (e104's laws: Faulkner's effective width where the plating is in compression, hinges at the brackets
   and at mid-span), and set it against the head its row was sized for, the water to the bulkhead deck.
   - 24 to 26 ft deep: collapse at 1.427 times the design head.
   - 30 to 32 ft deep: 1.448.
   - 36 to 38 ft deep: 1.300.
2. **The rule-sized stiffener** for each after bulkhead's depth and span is the one whose collapse head is that margin
   times the bulkhead's depth. Hers carries 1.75 to 2.0 times its moments: Wilding's 75 to 100 %, read as strength
   [derived].
3. **Two loadings:**
   - upright: the water's head over the floor, a triangle;
   - standing: the stern on end, the bulkhead nearly level, a uniform pressure over the span.
4. **The stiffeners' face.** Loaded from the stiffeners' side their free flanges trip first, at 0.6 to 0.8 of that
   (`RESEARCH_falling_hull_physics_v1_2026-11-19.md`, its bulkhead row) [derived there]. Which face hers stood on is NOT
   FOUND, so the band's low end takes that side.
5. **The plating** between stiffeners: a strip clamped at them, its bending only. That is a lower bound: past it the
   plate carries the load as a membrane until its seams' rivets go (e104).

Mild steel at 262 MPa throughout, as section.js takes it.

## 4. The bands

All in m of water. The lowest stiffener governs. Each band runs from the stiffeners' side at the rule's lowest margin
and 1.75, to the plating's side at its highest margin and 2.0.

| Bulkhead | Upright, over the floor | Standing, uniform |
|---|---|---|
| K | 17.9 to 39.0 | 15.2 to 35.8 |
| L | 18.1 to 39.4 | 15.4 to 36.1 |
| M | 19.9 to 42.1 | 18.4 to 39.7 |
| N | 20.3 to 42.9 | 18.7 to 40.3 |
| O | 20.7 to 43.7 | 19.0 to 41.0 |

- **The plating.** 0.56 in on the floor bends at 36.6 m over it, never first upright. Standing, the whole bulkhead is
  under one pressure, so the thin top strakes (0.30 in between E and F decks) bend first, at 10.5 m uniform. That is a
  lower bound: their membrane reserve is not computed. It is the figure to watch as she stands.
- **The doors** (the model's: a low door in each, and doors on E, F and G decks in some):
  - their frames' strength is NOT FOUND. Take the bulkhead's band [bet: the frames and their compensating stiffeners
    built to the bulkhead's strength].
  - Wilding's account of Olympic's door in O closing against a rush of water (BI 20447) shows the mechanism worked under
    flow, not the frame's strength.
- **Against the fall's 15 m [8 to 30]:**
  - every after bulkhead's stiffeners are stronger, upright and standing alike, since her stiffening ran so far over
    the rule;
  - standing, the top strakes' bending lower bound (10.5 m) sits inside the old band.
  - M, N and O, the ones the stern turns on (Z1), are the strongest: their spans to the orlop are short.

## 5. What would sharpen it

- **The yard's scantling drawings** of the bulkheads (National Museums NI's Olympic and Titanic plans, not online), for
  the stiffeners' sections and face.
- **Lloyd's "new rules"** of 1913-14, which tabulate deeper bulkheads. Wilding's 75 to 100 % is against them.
- **The membrane capacity** of the thin top strakes, with their seams' riveting, for the standing case.
