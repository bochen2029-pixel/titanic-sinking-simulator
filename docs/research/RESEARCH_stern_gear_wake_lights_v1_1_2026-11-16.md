# Stern gear, wake and lights: facts for drawing them (v1.1: R1, measured from the 1911 figures)

- **Written:** 2026-11-16, 17:40 to 17:55 CST, session ab71e668 (Claude Code desktop, Opus 5.5), at Bo's word
  "proceed at best recommendation", as backlog item R1.
- **Supersedes nothing:** `RESEARCH_stern_gear_wake_lights_v1_2026-11-16.md` stands as written; this version adds
  section 8 (the measurements) and corrects section 5's "not found" for three of its items.
- **Method:** three figures of The Shipbuilder's Olympic and Titanic number (1911), as reproduced at full size
  (1000 pixels wide) by GG Archives, opened in the browser pane and measured in their own pixels, by eye on
  magnified crops with a pixel grid and, for the photograph, by thresholding its pixels. No file was downloaded.

## 8. Measured (R1)

### 8.1 The wing shafts: two sections

| Figure | What it shows | Scale, three ways | Wing shafts from the centre line | Height above the keel |
|---|---|---|---|---|
| Fig. 53, section through the reciprocating engine room, https://www.ggarchives.com/CVimages/OT/Titanic/TheShipbuilder/1911-Midsummer/53-SectionThroughReciprocatingEngineRoom.jpg | both engines, their crankshafts, the hull and five decks | deck C to deck G 10.28 px/ft; the double bottom under the engines (6 ft 3 in) 10.24; the shell to shell (92 ft 6 in) 10.24 | crank centres at 327 and 673 px, centre line at 499.5 px: 173 px = **16.9 ft (5.14 m)** each side | 128 px = **12.5 ft (3.80 m)** |
| Fig. 51, section through the turbine room, https://www.ggarchives.com/CVimages/OT/Titanic/TheShipbuilder/1911-Midsummer/51-SectionThroughTurbineRoom.jpg | the turbine on the centre line, the wing shafts passing either side | deck C to deck E 10.41 px/ft; the shell to the turbine's axis 10.45 | shaft centres at 322 and 690 px, the turbine's axis at 506.5 px: 184 px = **17.7 ft (5.38 m)** each side | 131 px = **12.6 ft (3.83 m)** |

- **The shafts are level and diverge aft.** The same height in both rooms (12.5 and 12.6 ft); 0.24 m farther out in
  the turbine room, which lies about 19 m aft of the engine room's middle: about 0.7 degrees outward.
- **At the screws.** The model (`core/motion.js`, `SHIP.wing.y`) has had them 6.0 m out since P1, as a bet. A straight
  shaft from the engine-room point (x = -37.6 m, 5.14 m) to 6.0 m at the screws (x = -122.5 m) passes 5.34 m at the
  turbine room's middle, within 4 cm of the 5.38 m measured there. So 6.0 m stands, and nothing in the physics
  changes. Its uncertainty is the stations of the two sections, which the figures do not give: about plus or minus
  0.4 m at the screws.
- **The centre shaft is higher.** The turbine's axis in Fig. 51 is at 15.8 ft (4.82 m) above the keel, 3.3 ft above
  the wing shafts. A forum note had reported The Shipbuilder's longitudinal drawing showing the centre shaft 3 ft
  higher, and other profiles showing them level (v1, section 2); Fig. 51 agrees with the first.

### 8.2 The rudder's outline: a photograph

Fig. 17, "Arrangement of Stern Castings",
https://www.ggarchives.com/CVimages/OT/Titanic/TheShipbuilder/1911-Midsummer/22-ArrangementOfSternCastings.jpg :
a photograph of the stern frame, the two after propeller brackets and the rudder standing on the shop floor, with a
ladder. The castings are light against a dark backdrop, so the rudder's trailing edge was found row by row by
thresholding the pixels (luminance above 150).

- **Scale:** the rudder casting from its heel to the top of its stock, 770 px, is the 78 ft 8 in "length over all"
  (23.98 m, `abacus1:b2a8b94094bb`): 0.0311 m/px upright. Across, the main piece's leading edge to the trailing edge
  at the widest, 156 px, is the 15 ft 3 in "width" (4.648 m, `abacus1:b924b6303212`): 0.0298 m/px. The two differ
  by 4 %, the photograph's perspective.
- **The outline** (chord from the stock's axis, m, against height above the heel, m):

| Height | 0.22 | 0.84 | 1.77 | 3.02 | 4.26 | 5.50 | 6.75 | 8.00 | 9.24 | 10.48 | 11.72 | 12.97 | 14.21 | 15.46 | 16.70 | 17.63 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Chord | 1.10 | 1.82 | 2.89 | 3.61 | 4.05 | 4.26 | 4.32 | 4.32 | 4.14 | 3.84 | 3.31 | 2.62 | 1.82 | 1.04 | 0.54 | 0.36 |

  Widest, 4.32 m from the stock, 6.5 to 8 m above the heel; rounded at the heel; narrowing to a point 17.9 m up,
  under the counter.
- **Check:** with the heel 0.3 m above the keel [bet], the area under the night's draft aft (10.29 m) is **36.28 m2**
  by this trace (trapezoids over the table, `site/visuals.js`), against the **37.31 m2** (401.63 sq ft) Weeks computed
  from the plans by Simpson's rule: 2.8 % less. The drawing uses the traced shape with its chords scaled by 1.0284,
  so that the immersed area is the plans' figure (`tools/visuals_tests.js` checks it).
- **This corrects v1** (section 1, "Rudder form"): the blade is not "wide near the waterline, narrow at depth". At the
  night's draft it is widest about 3 m below the waterline and narrows above it into the counter.

### 8.3 Still not found

- **The screws' stations fore and aft.** Neither section gives them, and the photograph's castings are not in their
  places. The drawing puts the centre screw 1.9 m ahead of the rudder's stock (in the aperture) and the wing screws
  where their discs clear the model's hull by 0.15 of a diameter, a usual clearance: both bets, named in
  `site/visuals.js`.
- **The crank angles; the centre screw's hand; the 1910 Order in Council's own text; a primary account of the
  lights failing:** as in v1.
