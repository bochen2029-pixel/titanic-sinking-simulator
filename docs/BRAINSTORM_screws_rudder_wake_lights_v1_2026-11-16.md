# BRAINSTORM: screws, rudder, wake and lights made visible, v1

- **Written:** 2026-11-16, 16:15 to 16:35 CST, session ab71e668 (Claude Code desktop, Fable 5.2), at Bo's ask after
  P4: "titanic had reciprocating engines, and a triple screw ... do some research, then create the model/mesh,
  animation, and logic, and show the rudder so that reverse engines and hard a port all that actually shows stuff, and
  create a wake that is at least someway basic in realism show that it gives the speed and forward motion something
  more tangible ... and the ship had a green light and red light on each side ... brainstorm all this and add to
  backlog first, don't implement yet!!"
- **Status:** advice only; nothing here is a decision and nothing is implemented. No file of the simulator was
  changed (`core/`, `site/`, `web/`, `tools/`, `dist/`).
- **Lineage:** the ship under way, v1 and v1.1 (same day); P0 to P4 as built (`CHANGELOG.md`). New today:
  `docs/research/RESEARCH_stern_gear_wake_lights_v1_2026-11-16.md` (the facts, with sources), 34 certified numbers
  (`docs/research/abacus/results_stern_gear_wake_lights_2026-11-16.jsonl`), and one experiment that only asks the
  model (`docs/research/experiments/e6_stern_wash_astern.js`). The work items are in `BACKLOG.md`.
- **Tags** as before: [measured] on this machine today, [read] in a source today, [derived], [bet].

## 0. The answer in one paragraph

Everything Bo wants to see already exists as numbers. The motion model carries three shaft speeds with their signs,
the turbine in or out, the rudder's true angle as it follows the wheel, each screw's thrust, and her drift; the watch
keeps her track. So this is drawing, not new physics: three screws and a rudder built from the builder's dimensions
and turned by those numbers, a wake laid along the path her stern really took with Kelvin's wedge constructed from
that same path, and the lights the 1910 rules required, each showing over its lawful arc. Done that way, "Full astern"
is visible as two wing screws running down, a dead moment, then turning the other way while the centre screw trails,
and "hard over" is a rudder that takes ten seconds to get there and a wake that kinks where the order was given.
One thing is not drawing: the model does not steer with sternway (section 5). That is a physics item, and it comes
before any picture of her backing.

## 1. What is already there to draw from

| Number in the model | Where | What it can drive |
|---|---|---|
| Wing shaft speeds, signed, rpm (`nP`, `nS`); ordered speeds (`setP`, `setS`); the reversing dead time | `sim.mo`, `core/motion.js` | the wing screws' turning and its reversal; the engines' cranks |
| Centre shaft speed (`nC`), turbine in or out | `sim.mo` | the centre screw; the turbine rotor; the centre screw trailing when the turbine is cut out |
| Rudder angle (`del`) and the order it follows (`delCmd`) at 4 deg/s | `sim.mo` | the rudder blade; a helm indicator |
| Thrust of each screw (`TP`, `TS`, `TC`), rudder force (`Fn`) | `sim.mo` | the strength and direction of each screw's race; the wash thrown forward when backing |
| Her velocity through the water (`u`, `v`, `r`), position and heading | `sim.mo` | the wake: where the stern was, how fast, which way she was pointing |
| Trim, heel, the sea surface in her frame | the core | screws and rudder breaking the surface as she goes down by the head (the core already logs "Centre propeller breaks the surface") |
| Water in the electric engine room, her trim | the core | the lights failing |
| Orders with their step (`log`) | `sim.night` | marks on the wake where an order was given |

The rule that the viewer only reads state stays. Nothing below needs a new number from the core except M1 (section 5).

## 2. The stern gear

### 2.1 What she had

| Part | Figures | Standing |
|---|---|---|
| Wing screws | 23 ft 6 in (7.163 m), three bronze blades bolted to a steel boss, pitch 35 ft (10.668 m), blades 37 % of the disc; outward turning; 75 rpm at Full ahead, tips at 28.1 m/s (`abacus1:3d7457285e0c`) | [read], Harland & Wolff's notebook |
| Centre screw | 17 ft (5.182 m), three blades, solid bronze, pitch 14 ft 6 in (4.420 m), blades 53 % of the disc; about 165 rpm, tips at 44.8 m/s (`abacus1:b4b4c4740325`); ahead only | [read]; its hand is unknown |
| Blade angles | Wing: 57.7 deg at 0.3 of the radius, 34.1 deg at 0.7, 25.4 deg at the tip. Centre: 21.2 deg at 0.7 (`abacus1:57ccccfd96ce` and its neighbours) | [derived], certified |
| Slip | Pitch times revolutions is 25.9 knots for the wing screws at 75 rpm: 13 % apparent slip at 22.5 knots; 23.6 knots and 5 % for the centre screw | [derived], certified |
| Engines | Two sets, four cylinders each in the order LP, HP, IP, LP from forward; bores 97, 54, 84, 97 in; stroke 75 in (1.905 m); mean piston speed 4.76 m/s at 75 rpm (`abacus1:a69ef341a4c3`); about 30 ft high; reversed by Stephenson link motion through a Brown's steam and hydraulic engine | [read], The Shipbuilder and TRMA |
| Turbine | Parsons low-pressure, on the centre shaft, rotor 12 ft by 12 ft 8 in, fed by the exhaust of the other two; in at Half and Full ahead only; reversing cuts it out | [read] |
| Wing shafts | Carried aft of the hull in "bossing" plated round cast boss arms; tail shafts 28.5 in | [read] |
| Centre shaft | Through the stern frame into an aperture, the rudder directly abaft it | [read] |
| Rudder | Cast steel, 101 tons, 15 ft 3 in (4.648 m) at its widest, 401.63 sq ft (37.3 m2), unbalanced, tapering downward; 40 deg hard over | [read]; outline not found |

### 2.2 Where it goes on the model's hull

Ship frame: x forward from amidships, y to port, z up from the keel.

| Part | Proposed place | Standing |
|---|---|---|
| Wing screws | x = -122 m, y = 6.0 m to each side, shaft line 4.0 m above the keel: tips from 0.4 to 7.6 m, the upper tip 2.7 m under water at the night's draft | [bet] throughout: no text gives the shafts' offset or station; 6.0 m is what `core/motion.js` already assumes. At that station the model's hull is 1.45 m from the centre line, so the discs clear it by a metre [measured] |
| Centre screw | x = -127.5 m, on the centre line, 4.0 m above the keel (4.9 m if The Shipbuilder's drawing is right that this shaft sat 3 ft higher) | [bet] |
| Rudder | Stock on the after perpendicular, x = -129.54 m; the blade 4.65 m wide at the waterline, about 3.2 m at the heel, mean 3.93 m (`abacus1:eefdc96457f0`), under the 9.4 m of counter | width and area [read]; the outline [bet] |
| Engines | In the reciprocating engine room (x -48.2 to -27.1 m), one each side on the wing shaft lines | room [measured] from the core; engine places [bet] |
| Turbine | In the turbine room (x -65.5 to -48.2 m), on the centre line | same |

The model's hull is the fitted, smooth form the physics integrates. It has no aperture and no bossing: at x = -128 m it
is a fin 0.3 m thick where the real ship was cut away for the centre screw. The viewer should cut that window out of
the drawn shell only (the same fragment test that already cuts a crushed bow away) and add the bossings as separate
shapes. The physics hull is not touched.

Measuring the three open places from The Shipbuilder's plates of 1911 (out of copyright) settles all of them at once;
it is the first research task in the backlog (R1).

### 2.3 The screws

- **Shape.** Each blade is a true helical surface: at radius r the blade stands at the angle whose tangent is pitch over
  2 pi r. That one formula gives the certified angles above and makes the two kinds of screw look right for free: the
  wing screws coarse (pitch one and a half diameters), the centre screw fine and broad-bladed. An elliptical outline
  scaled to the builder's blade area. About 600 triangles a screw.
- **Turning.** The angle of each screw is the running sum of its shaft's revolutions; going astern the sum runs back.
  Outward turning means the top of each wing screw moves away from the hull going ahead; that is the test.
- **The centre screw with the turbine out.** The model already treats it as a trailing screw with drag. Draw it
  windmilling at the speed its own no-thrust point gives (about 44 rpm at 10 knots) [derived from the model's constant;
  whether the real rotor was left free is not found]. Today the model lets it run down over about a minute instead.
- **Fast time.** Three blades look the same every 120 degrees, so the picture lies once a screw turns more than
  60 degrees between frames. At 1x nothing does (the centre screw passes 8.25 blades a second,
  `abacus1:bc71e0c362e0`). Above about 40 degrees a frame, fade the blades into a faint disc.
- **Out of the water.** As she trims by the head the screws rise. The picture needs nothing new: the blades simply come
  through the sea surface that is already drawn.

### 2.4 The rudder

A flat tapered blade on its stock, turned by `del`, the true angle, not the order. The gap between the two is the
point: hard over takes ten seconds at the model's 4 deg/s [bet; nobody measured it], and the watch showed that
seconds decide the night. A small helm indicator on the Bridge overlay (order and angle as two needles) says the same
thing where the eye already is.

### 2.5 Shafts, bossing, aperture

Three plain cylinders from the engines to the screws, visible in the X-ray hull; two faired bossings; the aperture
cut. Cheap, and it is what makes the stern read as a triple-screw stern rather than three discs under a hull.

### 2.6 The engines and the turbine (X-ray only)

A working kinematic picture, not a detailed model: per engine a crankshaft with four cranks, four connecting rods,
four crossheads and piston rods rising and falling in cylinders of the true bores, in the true order, with the true
stroke, at the shaft's own speed and direction; the columns and bedplate as static frames; the turbine as a drum that
turns when the turbine is in. About forty moving boxes and cylinders.

Two things are unknown and would be bets: the crank angles (the engines were balanced on the Yarrow, Schlick and
Tweedy system, so the cranks were not simply at right angles) and the length of the connecting rods. Both change how
it looks, neither changes what it tells.

### 2.7 What "Full astern, hard over" will look like

From the model as it stands [measured, e6], both orders given together at 22.5 knots:

| Time | Engines and screws | Rudder | Ship |
|---|---|---|---|
| 0 s | The order. The turbine is cut out at once; the centre screw is left to run down (168 rpm, 86 at 20 s, 22 at a minute) | starts over at 4 deg/s | 22.5 kn |
| 10 s | Wing engines at 26 rpm and falling | hard over | 21.5 kn |
| 15 s | Wing engines at rest | | 20.8 kn |
| 15 to 20 s | Stopped while the valve gear goes over | | 20.1 kn at 20 s |
| 20 to 70 s | Turning the other way, building to 75 rpm astern | | 14.3 kn at 60 s |
| from about a minute | The wash the screws throw forward begins to outrun her (a crude estimate, section 3.5) | | |
| 179 s | | | stopped, 956 m along her track, her head 71 deg round |

With the helm left amidships the same stop takes 213 s and 1,229 m. With a wake drawn, that minute shows the white
ribbon thinning as the thrust goes, the kink where the rudder bit, and the churn moving up her sides.

## 3. The wake

### 3.1 What a wake is, in numbers

| Thing | Value | Standing |
|---|---|---|
| Kelvin's wedge, half-angle | 19.47 deg at every speed in deep water (`abacus1:0e75f91371c0`) | theory, certified |
| Waves across her track | 85.8 m apart at 22.5 knots, 38.2 m at 15, 17.0 m at 10 (`abacus1:85df118e3f38`, `948dca83414a`, `3984d1aba3aa`); a crest passes a fixed point every 7.4 s at 22.5 knots | theory, certified |
| Waves at the wedge's edge | 57.2 m apart at 22.5 knots; their crests lie at 54.7 deg to her course (`abacus1:8bdabaf8f6fe`, `04935666fc7e`) | theory, certified |
| Her own length in waves | 3.02 transverse wavelengths at 22.5 knots; Froude number 0.23 (`abacus1:0fb8b8d19ec8`, `9b5f70091256`) | [derived], certified |
| The white, turbulent wake | As wide as the ship at the stern, widening slowly: distance astern to the power 0.2 to 0.4 in the literature | [read], search summaries |
| Its momentum | Almost none: at Full ahead the screws' race runs at 11.2 to 11.3 m/s in her frame against her 11.39 m/s, so over the ground the water behind her is nearly still | [measured] from the model's thrust; that is why the white water stays where it was laid |

The wavelengths grow with the square of the speed. A wake drawn from them shows speed without a number on the screen:
at 10 knots the pattern is five times finer than at 22.5.

### 3.2 Laid from her own track

Draw nothing in her frame. Everything is put down on the sea where she was and left there, in the earth-fixed group
the watch already uses for her track and the berg.

- **The ribbon.** A strip laid from the point where her stern was, every few metres. Half-width
  (B / 2) (1 + s / L)^0.2 with s the distance astern [Milgram's exponent; a bet between 0.2 and 0.4]; brightness from
  the thrust she was making there, fading over a minute or so [bet]. Because it follows the stern and not amidships,
  a hard turn shows the stern skidding outside the bow's path: 2.7 m/s sideways at the stern against 0.9 at the bow
  after two minutes hard over [measured].
- **Kelvin's wedge, by construction.** Each past position sends out waves; those that keep station with the ship lie,
  s seconds later, on a circle of radius U s / 4 whose centre is U s / 4 ahead of that position. The wedge is the
  envelope of those circles. From the ship the tangent to such a circle makes the angle whose sine is
  (U s / 4) / (3 U s / 4) = 1 / 3: 19.47 deg, the certified figure, with no angle put in by hand. The same
  construction bends correctly through a turn, narrows nothing and widens nothing by decree, and dies when she stops,
  because old positions stop being fed by new ones.
- **Crests.** Short strokes along each arm, 54.7 deg to the course at that point, spaced by the edge wavelength for the
  speed she had there. Stripes across the ribbon at the transverse wavelength.
- **Marks.** A small tick on the ribbon where each order in the log was given: the kink in the wake then has its cause
  beside it.

Geometry first (strips and lines), not a shader that computes wave heights. It is cheap, the same on a phone, and it
can be tested as numbers.

### 3.3 Bow and stern

A white "bone in her teeth": two short wedges of foam at the stem whose length and brightness go with the square of
her speed. The theoretical ceiling for the water piled at the stem is U^2 / 2g, 6.8 m at 22.5 knots (v1's certified
figure); a fine liner raised a fraction of that. [bet: the fraction]

### 3.4 Sternway

With sternway the white water trails from the bow, which is then the trailing end. The ribbon's source moves to the
stem when she is going astern.

### 3.5 The screws' race, and the wash when backing

- **Ahead:** a short churn behind each turning screw, fading into the ribbon within a ship's length. It cannot be
  long: over the ground that water is nearly still.
- **Astern with headway:** the wing screws throw their wash forward. It becomes visible alongside when it is faster
  than she is. The crude estimate (all the astern thrust as momentum, no slowing with distance) puts that at 64 s into
  a crash stop with the helm amidships, with her still at 16.9 knots, and at amidships by 113 s [measured, e6]. That is too early: a real
  jet slows as it spreads. Seamen read the same thing the other way round: when the quickwater reaches amidships she
  has nearly lost her way [from memory; to be read before it is used as a test]. The law for how the wash slows is the
  one thing to read before this is built.

### 3.6 What is physics, and what is appearance

| Drawn thing | Comes from | Standing |
|---|---|---|
| Where the ribbon lies; where it kinks | the model's track | exact |
| The wedge's angle; the spacing of crests | Kelvin's theory on the model's speeds | certified arithmetic on fitted speeds |
| Which way each screw turns, and how fast | the model's shafts | fitted to the trials; the reversing times are bets |
| The rudder's angle | the model | the rate is a bet |
| Ribbon width, brightness, how long it lasts | a law with one exponent from the literature | appearance, labelled |
| Height and brightness of bow wave and crests | nothing measured | appearance |
| When the wash creeps forward | the model's thrust and a jet law | an estimate until the law is read |

## 4. The lights

### 4.1 The rule in 1912, and what she carried

| Light | Colour | Shows over | Seen at least | On Titanic | Standing |
|---|---|---|---|---|---|
| Masthead | white | 20 points: from right ahead to two points abaft the beam on each side, 225 deg (`abacus1:3c29efd45416`) | 5 miles, 9.26 km | one only, on the foremast, about 145 ft (44.2 m) above the sea | rule [read]; hers [read], Halpern |
| Starboard side light | green | 10 points: from right ahead to two points abaft the starboard beam, 112.5 deg (`abacus1:82bbf0b8c3dd`) | 2 miles, 3.70 km | in the starboard bridge wing cab | rule [read]; the place from a search summary |
| Port side light | red | the same to port | 2 miles | in the port wing cab | same |
| Screens | - | inboard of each side light, at least 3 ft forward of it, so that green is never seen across the bow from the port side | - | - | [read] |
| Second masthead light | white | as the first, at least 15 ft higher | 5 miles | not carried | [read]: it was optional |
| Astern | white | to a vessel overtaking; no fixed light required of a steamer | 1 mile | photographs suggest a fixed stern light; whether it burned is not known | rule [read]; hers low |

### 4.2 Drawing them

Each light is a point with a glow and a streak of reflection on the water, shown only when the eye is inside its
arc: take the bearing of the camera from her bow and compare it with the table. A degree or two of soft edge, since
real screens were not knife edges.

What each camera then sees is the rule itself:

| Camera | Sees |
|---|---|
| Dead ahead | red, green and the masthead light: a steamer coming straight at you |
| Off her starboard bow (the Quarter view) or abeam | green and the masthead light |
| Off her port bow or beam | red and the masthead light |
| From astern | the stern light alone; neither side light, which stop two points abaft the beam |
| From her own bridge | none of them: the screens hide her side lights from her own deck |
| Plan | all of them, as marks |

No light falls on the ice. She had no searchlight, and a lit berg would make the lookout's problem a lie.

### 4.3 The rest of her lights, and their end

She was a wall of lit ports and deck lights. That is a second, optional layer: points along the rows of ports and the
open decks, which also makes her trim readable at night as the rows go under. The lights are remembered as burning
until about two minutes before she went, and accounts differ on whether they died at once or reddened first [search
summary; no primary source read]. In the model that should be an outcome, not a clock: the main dynamos stood in the
electric engine room, which the core floods as its own compartment. The rule to fit: the lights fail when that room's
water reaches the dynamo flat or her trim passes a set angle, with the 1912 run as the one check (between 2:15 and
2:19 am).

## 5. One gap this uncovers: she does not steer going astern

Asked directly [measured, e6]: backing from rest to 7 knots of sternway, the rudder 30 degrees either way changes her
heading by nothing (rate of turn under 0.003 deg/s). A ship with sternway answers her rudder the other way round: the
stern follows the blade. The rudder law in `core/motion.js` takes its inflow as a speed without a direction and its
drift angle from formulas meant for headway, so it is silent astern. With headway and the engines backing it behaves
(she keeps turning the way the rudder lies, more weakly as the race is lost), and with the screws opposed at rest
her head goes the right way.

This matters for exactly the thing asked for. A picture of her backing, wash and all, on top of a model that cannot
be steered astern would show something false. So: M1, handling in all four quadrants (headway or sternway, screws
ahead or astern), is the one physics item in this note, and it goes before the wash (V4). The screws, the rudder,
the wake of a ship going ahead and the lights do not depend on it.

## 6. Smaller things in the same spirit

- **A stern camera.** Low on the quarter, at the waterline, looking at the screws and the rudder. Without it the new
  parts are seen only from Below.
- **Sound.** The telegraph's bell on every engine order, and the beat of the engines at shaft speed (75 rpm is a
  thump every 0.8 s). The lookout's bell is already there; these two tell the ear what the screws tell the eye.
- **Smoke.** Four funnels' smoke laid on the air the way the ribbon is laid on the water: it leans aft with her speed
  and swings in a turn. (The fourth funnel was a ventilator; it made none.)
- **Revolution counters.** The three shaft speeds on the Bridge overlay as small dials with a direction, in place of
  the present line of numbers.

## 7. Order of work, with a test for each

| Step | What | Test |
|---|---|---|
| R1 | Measure the three places (wing shaft offset, screw stations, shaft heights) and the rudder's outline from The Shipbuilder's plates | the figures in a note with the plate named; `core/motion.js`'s 6.0 m confirmed or the difference stated |
| V1 | Screws, rudder, aperture, bossing, shafts; a stern camera; the helm indicator | the top of each wing screw moves outboard going ahead and inboard going astern; each screw's angle equals the sum of its shaft's revolutions to 1 %; the mesh's blade angle at 0.7 radius is 34.1 deg (wing) and 21.2 deg (centre); the blade's angle equals the model's rudder angle at every frame; above 40 deg a frame the blades are a disc |
| V2 | The wake: ribbon from the stern, Kelvin's wedge by construction, crests, bow wave, order marks | on a straight course at 22.5, 15 and 10 knots the drawn wedge's half-angle is 19.47 deg within 0.5 and the crest spacings are the certified wavelengths within 2 %; after a full circle the ribbon lies on the circle the model's stern described; stopped, it stops growing; the same watch replayed lays the same vertices |
| V3 | Navigation lights with their arcs, glow and reflection | a table of sixteen bearings round her against which lights show, equal to the rule; nothing shows from her own bridge; each light's range limit |
| M1 | Handling in four quadrants in `core/motion.js` | with sternway the stern follows the rudder (signs for both sides); headway results unchanged to the bit (`tools/trials.js` still 14 of 14, the watch's fingerprints unchanged); nothing undefined at zero speed |
| V4 | The screws' race and the wash when backing | the law for the wash read and cited; in the crash stop the wash turns forward at a stated time and reaches amidships near the end of her way |
| V5 | Engines and turbine in the X-ray hull | stroke 1.905 m; cylinder order and bores as built; speed and direction equal the shafts'; the turbine turns only when it is in |
| V6 | Ports and deck lights; the lights failing | in the 1912 run the lights fail between 2:15 and 2:19 am; in a night where she floats they never fail |
| V7 | Sound and smoke | the telegraph bell on every logged engine order; the beat's rate equals shaft speed; both off with the existing sound switch |

V1 to V3 are the three things asked for by name and stand on what exists. Each is a good deal smaller than P4; the
wake is the largest of the three.

## 8. Decisions needed (who decides)

| # | Decision | Who | Recommendation |
|---|---|---|---|
| D16 | Build V1, V2, V3 first, in that order, then M1 before V4 | Bo | Yes |
| D17 | How far to take the engines: turning shafts only, or cranks, rods and pistons | Bo | Cranks, rods and pistons, in the X-ray hull only, after the wake and the lights |
| D18 | Unknowns that would be drawn as bets (the centre screw's hand, the crank angles, the rudder's outline, the shafts' places until R1 is done) | Bo | Draw them, each named as assumed in the docs; R1 first removes three of the six |
| D19 | Show a stern light, and light the ports | Bo | Yes to both; the stern light with a note that the 1910 rules did not require it |
| D20 | A wake of geometry now, a wave-height shader later or never | Bo | Geometry now; a shader only if the geometry proves too plain |
| D21 | M1 (steering astern) before the wash is drawn | Bo | Yes: the picture must not run ahead of the model |
| D22 | Sound beyond the lookout's bell | Bo | Yes, small: telegraph bell and engine beat, under the existing switch |

## 9. Risks

1. **A sharp picture claims more than the model knows.** A screw drawn to the millimetre at a station that is a
   guess. R1 first; until then the places are named as bets where the user can see it.
2. **Appearance mistaken for result.** The ribbon's width and life, the bow wave's height and the wash are looks with
   a law behind them, not outputs of the flooding or motion models. Section 3.6 goes into the page's notes.
3. **Fast time.** At 60x and 900x screws, engines and crests would strobe. Each has a stated rule for fading out.
4. **The stern of the drawn hull is the physics hull.** No aperture, no bossing. The fixes are drawn additions and one
   cut-out; the temptation to "correct" the hull form itself must be refused, since it is fitted to her hydrostatics.
5. **Phones.** The wake is a few thousand vertices and the lights a dozen sprites; the ports are the only heavy
   layer and are optional.
6. **It becomes a pretty game.** The rule that has held so far holds here: the viewer reads state, and what is drawn
   either comes from the model or is labelled as appearance.

## 10. Sources

- This repository: `core/motion.js` (shafts, rudder, thrust), `core/night.js` (the track and the order log),
  `site/app.js` (the earth-fixed group, the hull's fragment cut), the fact sheet
  `docs/research/RESEARCH_olympic_class_steering_propulsion_trials_v1_2026-11-16.md`.
- Today's note, `docs/research/RESEARCH_stern_gear_wake_lights_v1_2026-11-16.md`, which names every page read and
  every page known only from a search summary: The Shipbuilder (1911) as reproduced by GG Archives; the Titanic
  Research and Modeling Association's engines page; the New Zealand Gazette's 1910 text of the collision regulations;
  Samuel Halpern on the masthead light; Titanic Connections on the bridge; Wikiwaves and Rabaud and Moisy on Kelvin's
  wake; a review citing Milgram and others on the turbulent wake.
- Abacus: 34 answers in `docs/research/abacus/results_stern_gear_wake_lights_2026-11-16.jsonl`.
- Not read: The Shipbuilder's plates themselves, Beveridge's plans, the 1910 Order in Council, any text on how a
  backing screw's wash slows, any primary account of the lights failing.
