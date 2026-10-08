# Titanic flooding model

Headless flooding core (`core/core.js`) with a three.js viewer (`web/`). Read `README.md`, `PORTING.md` and `HANDOFF.md` before changing physics.

## Conventions

- Ship frame: x forward from amidships, y to port, z up from the keel, metres. World: sea surface at Z = 0. three.js local = (x, z, −y).
- Pose: heave `zO`, pitch (bow down positive), roll (starboard down positive). R = Ry(pitch)·Rx(roll).
- Node index `n = (zone*2 + side)*2 + layer`; side 0 = port, layer 0 = below E deck; 16 zones from bow to stern.
- Tonnes = m³ × 1.025. Sources quote long tons; convert once, at the edge.
- dt = 0.25 s. Changing it means recalibrating.

## Rules

- The JS core is the oracle until the C++ build matches `out/golden_titanic.json`. Never port and change physics in the same change.
- After any physics change, run `node tools/calibrate.js 45` and `node tools/validate.js`, and put the validation table in the commit message.
- Keep the step deterministic: fixed-order sums, no atomics in the hot path.
- The viewer reads snapshots only (`serialize()`). Keep that boundary; it is also the MCTS state.

## Commands

```
node tools/validate.js          # validation table -> out/validation.json (about 1 min)
node tools/titanic.js           # 1912 run against eyewitness trim and list
node tools/golden.js            # golden trace -> out/golden_titanic.json
node tools/calibrate.js 45      # refit the 4 flow parameters (about 4 min)
node tools/build.js             # inline everything -> out/titanic.html
node tools/shot.js 1400 860 4000 shot.png   # screenshot the viewer
```
