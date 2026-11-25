# U3: her scene at three times after the touch (re-rendered 2026-11-23)

These stills draw what U3 adds to her, from the recorded 1912 night, at 30, 90 and 150 minutes after the touch: the water inside her, the pockets' own water, her lights, and the steam and smoke. They are U3 of `docs/BRAINSTORM_titanic_in_unreal_v1_2026-11-20.md`, section 7.
- `tools/blender/u3_scene.py` builds the scene.
- `tools/blender_u3_tests.js` reads it back off the GLB and checks it against the record (10 MUST rows).
- They are rendered in Blender 5.2.3 LTS with EEVEE, 1440 x 810.

**Provenance, in one line:** rendered 2026-11-23, 13:57:43 to 13:58:50 CST, from the recorded 1912 night of the calibration epoch's member C (fingerprint `48b71712`), by the U0 lane's tools at `claude/u0-g24-hull-ends` `2a9f79e`: her hull and the drawn ship with her ends (G24), the lights by their sections' fuses (NH15's G1), the pockets' own water, each space's water at the level solved for it (G25).

**When and where:** 66 s for all six, on this laptop's GPU in headless Blender, beside the mainline's D5 (CPU, BelowNormal; the coordinator's word: no browser in use). They replace the stills of 13:26 the same day (`80715c9`), whose hull and drawn ship stood on the hull without her ends, and, before those, the stills of 2026-11-20 (`051268a`): the night before stage D, the lights put out by the sea outside them, no pockets, each space's water at its own sample's level.

**Made from:** the files `tools/export_ship.js`, `tools/record_night.js 1912 auto`, `tools/u3_lights.js` and `tools/u3_smoke.js` wrote at `2a9f79e`, and the hull built from that export by `tools/blender/build_ship.py`:
- `titanic_ship.json`: 1,353,534 bytes, sha256 `62a25212bccb3123f6c1d8e8afdabd01348c96886c066724c252858764c839c6`;
- `titanic_night_1912.json`: 22,229,533 bytes, sha256 `6480ae98edc6561078032ab30ef3f7f787b34f9340cc18fba8dab48e0d815603`. It is the watch of 14 April 1912 with the auto orders on member C: the encounter's fingerprint `3f8e968a`, the flag's `48b71712` at step 39473;
- `u3_lights.json` (version 2): 164,548 bytes, sha256 `c68073b8e37078af9422f0c976b13a5a0464a28f9e6ed3b6a9b8849f9f3482ff`;
- `u3_smoke.json`: 2,955 bytes, sha256 `539aafc57566e78c935532615647c4dcdb50e362158f5912cf622ebd9b8fecda`;
- `titanic_ship.glb`: 7,714,772 bytes, sha256 `123b060dd81964c1d5736e7939d0b700d9045c874617741df1c356e5e9f8a5cd`: the drawn shell on her hull with her ends (`tools/blender_tests.js`: its volume 0.30 % over the model's own, the drawn round stern over her counter).

**Each view [appearance]:**

| File | The view |
|---|---|
| `u3_section_t<min>.png` | Square to her starboard side, orthographic, 300 m across, bow to the right. The hull is drawn as a pale ghost. The sea stands behind her below Z = 0. |
| `u3_night_t<min>.png` | From a boat off her starboard bow, at 5 m, on a dark sea under a dark sky. Her own paint, and her lights. |

**What each time holds:** all from the record, each by its maker's rule (`u3_scene.glb.json` beside the GLB).

| Time | Step | Her pose | Water | The pockets' own water | Lights lit | Steam and smoke |
|---|---|---|---|---|---|---|
| T+30 | 7441 | 1.94 degrees by the head, 0.55 to starboard | 12 spaces, 8,984.1 m3 | the bunker of the fire 259.9 m3 drawn (263.8 recorded); the forepeak tank 322.7 (328.1) | 1,116: 620 ports, 492 windows, 4 navigation | steam blowing (0.314); smoke (gen 0.354) |
| T+90 | 21841 | 3.73 by the head, 5.22 to port | 28 spaces, 19,129.2 m3 | the forepeak tank 322.7 (333.7); the bunker has given way | 1,065: 569 ports, 492 windows, 4 navigation | no steam; smoke (gen 0.049) |
| T+150 | 36241 | 5.39 by the head, 10.56 to port | 33 spaces, 30,545.9 m3 | the forepeak tank 322.7 (338.9) | 994: 502 ports, 488 windows, 4 navigation | no steam; no smoke (gen 0.000) |

**What is the record's, and what is appearance:**
- **The water:** in each space the record has wet, each of the model's own columns (3 m by 0.5 m in plan) is filled from its floor to the level over its centre, at the record's pose. The level is the next sample's: the core solves its levels as a step begins, so the level that holds a sample's water at that sample's pose is the next one's (the record's `water.about`; G25). That is the core's own cut, so the stair of flat tops is the model's own resolution. The blue is appearance.
- **The pockets** (W6's bunker, G7's peak tank) hold water of their own, outside their spaces': each is drawn as the prism of its own area that the core's law places, holding min(vol, cap); the water past cap stands for the sea's head over a full pocket and is not drawn. Its paler blue and straight sides are appearance.
- **Her lights** (`u3_lights.json`, version 2): each port and window burns at the plant's level until its section's fuses blow, when the sea inside it reaches its switches (the record's `readers.circuits`, from `core/readers/circuits.js`, whose bets it states); the sea outside a light does not put it out. Her navigation lights burn at the plant's level. Their size, colour and glow are appearance.
- **The steam and the smoke:**
  - when they show is the record's: a jet of `u3_smoke.json`, and the plant's `gen` over 0.02;
  - their sources are the export's (`topsides.derived.steam` and `smoke`);
  - their cones, rising along the world's vertical, are appearance.
- **Also appearance:** the ghost hull, the cameras, the sky and the sea.

**What they show:**
- **The water** rises through her forward spaces as the record has it:
  - at T+30, low in her spaces forward of the first funnel;
  - at T+90, from the stem to about her second funnel;
  - at T+150, aft to between her second and third funnels, her forecastle down at the sea's level.
  Each space's flat-topped stair is the model's columns, each filled to its level over its centre.
- **The pockets:** the bunker of the fire, full at T+30, is gone by T+90 (it gave way into boiler room 5); the forepeak tank stays full under the orlop's flat at all three times.
- **Her hull** is the shell the web viewer draws, on the model's own hull with her ends above 11.0 m restored from the deck plans (G24); abaft x -75 it is the deck plan's round stern over her counter [appearance]. Her ends widen her above 11.0 m forward and aft, which her side's profile does not show square on.
- **Her lights** burn in rows along her length, each port on her shell. In the section views, rows forward burn on under the sea's surface where their sections are still dry inside, while those of the flooded sections forward are out: 1,116 lit at T+30, 1,065 at T+90, 994 at T+150. In the night views the sea is an opaque plane, so a light under it is hidden. The masthead light on the foremast burns at all three times.
- **The steam** shows at T+30 only: the record's blow-off runs from T+1.2 to T+67.1. It is a white cone at each escape pipe, forward of a working funnel.
- **The smoke** is a thin grey cone over each of the three working funnels at T+30 and T+90, thinner as the plant raises less steam (gen 0.354, then 0.049), and none at T+150 (gen 0.000).
- **Her trim and list** are the record's: 1.9, 3.7 and 5.4 degrees by the head; 0.6 degrees to starboard, then 5.2 and 10.6 to port.

**What is off, or not drawn** (appearance; `tools/blender_u3_tests.js` checks the numbers):
1. The section's ghost hull and the sea behind her are a diagram's look, not a view anyone had.
2. The night's sea is a flat dark plane: no swell, no reflections of her lights, and no glow of a light under it. Her black hull is only a faint silhouette against the dark sky.
3. The lights are plain points of one warm white, with no glow. The plant's level is 1 at all three times; she goes dark at T+161.7, after the last still.
4. The smoke and the steam are plain cones, standing in for Unreal's Niagara.
5. A section's fuses blow at a height of the sea inside it that no source gives (1.2 m over its floor at its middle, a bet in `core/readers/circuits.js`); the lights' rows follow that bet.
