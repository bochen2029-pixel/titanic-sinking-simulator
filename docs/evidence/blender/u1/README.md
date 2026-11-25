# U1: the first four stills by day (2026-11-20)

These are the hull and topsides that `tools/blender/build_ship.py` builds from `tools/export_ship.js`'s `titanic_ship.json`. `tools/blender/stills.py` poses them as the recorded night has her at step 0 (`tools/record_night.js`, the 1912 watch, the auto orders) and renders them in Blender 5.2.3 LTS with EEVEE, 1440 x 810.

**When and where:** rendered 14:40:43 to 14:41:05 CST, 22 s for all four, on this laptop's Arc 140V. That was the U0 lane's turn in `C:\temp\titanic-browser-turn.txt`, between Z1's browser rows and join 2's gate.

**Made from:**
- the lane's tools at `9fe89a4`;
- `titanic_ship.json` 642,092 bytes, sha256 `73b892ca6f31a179c1cd64aac31543c243f76dad3524ae379f66ba6effad04a6`;
- `titanic_night_1912.json` 19,516,979 bytes, sha256 `907296ff6c17d92a8f26a1614cb880dbd1c9cac23b7a94c5c55adeff7eb09e4e`;
- `titanic_ship.glb` 6,273,664 bytes, sha256 `61ac8fc137e7b193bb9d195d89ac487aa1a958de941cc2d0fce6677853888bc2`.

| File | The view [appearance] |
|---|---|
| `still_broadside.png` | from her starboard side, 430 m off, bow to the right |
| `still_bow_quarter.png` | from her starboard bow, ahead and to starboard |
| `still_plan.png` | from 700 m above, orthographic |
| `still_stern_quarter.png` | from her starboard quarter |

**What they show:**
- Her pose is the model's: zO 0.956 m, pitch -0.0035 rad (0.2 degrees by the stern, Wilding's drafts) and roll -0.0348 rad (2.0 degrees to port, the coal), on a calm sea at the core's Z = 0.
- The four funnels are raked aft, with the steam pipes on their forward faces.
- The masts are raked, and the derrick is stowed up and aft.
- The houses, the domes and the boats stand on the Boat deck.
- The counter overhangs at her round stern.

**What is off in this first render** (appearance, not geometry; `tools/blender_tests.js` checks the geometry against the export):
1. Her side is one black from the keel to the Boat deck. The ship was white above the sheer line (B deck less the 2.1 m white strake, `topsides.derived.sheerLine`), and the deck tops are wood, not black.
2. The two quarter views cut her near end off: the 50 mm lens is too long for that distance.
3. The plan view has her bow to the left.
4. The counter's knuckle shows a stair-step. The knuckle is a diagonal crease (`TS.knuckleZ`), sampled on 1 m stations and the 0.25 m height grid. The viewer's mesh samples it the same way.

The next render fixes 1 to 3 in the code. It takes a GPU slot here, or runs on the RTX machine with U2.

## The second render, with the fixes (`still_<view>_v2.png`)

**When:** rendered 15:41:04 to 15:41:18 CST, 14 s for all four, in the U0 lane's turn between join 2's gate and the wake's FluidX3D smoke. The first stills stay beside these as the record of where U1 started.

**Made from:**
- the lane's tools at `463a8f7`. The fixes are `b42809e` (colours, framing, plan) and `01b3f84` (the export samples the drawn shell every 0.25 m along the counter's knuckle).
- `titanic_ship.glb` 7,666,216 bytes, sha256 `2aae82973872c878cd47304447b1a43b5599fbc0f66b578ec585876e8d647d37`. It has 208 objects, the four markers of U2 included; they are inside the hull and unseen.
- The same pose at step 0.

**What changed:**
1. Her side is black up to the yellow sheer line's foot and white above it, and her decks are wood.
2. Both quarter views show her whole, with a 35 mm lens.
3. The plan view has her bow to the right and port up.
4. The counter's knuckle is a clean line, not a stair.

**Still not drawn:** the cranes and the anchor crane, the compass platform, rails, rigging, windows and the boot topping (`tools/blender/build_ship.py` lists them).
