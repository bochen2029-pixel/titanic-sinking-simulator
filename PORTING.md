# Porting the core to C++/CUDA

The JS core was written to map directly onto a GPU. This file lists what to keep identical, how the arrays map to threads, and how to batch it for MCTS rollouts.

## Data (all flat arrays, as in `core/core.js`)

| Array | Size | Content |
|---|---|---|
| Columns | N = 4,408 | `x, y, dxdy, zlo, zhi` (read-only, shared by every simulation) |
| Node entries (CSR) | 8,706 | `entCol, entA, entE`, plus `nodeStart, nodeCount` for 64 nodes |
| Per node | 64 | `mu, Vmax, Amin, Aov` (read-only) |
| Connections | 290 + openings | `a, b, type, x, y, z, area, coef, enabled, tOn` |
| State per sim | 64 + 64 + 6 | `vol[64], level[64]`, pose `zO, pitch, roll`, rates `vz, wth, wph` |

Node index: `(zone*2 + side)*2 + layer`, with side 0 = port and layer 0 = below E deck.

## One step (dt = 0.25 s), in order

1. **Pose:** build R = Ry(pitch)·Rx(roll) and the translation t. One thread.
2. **Buoyancy:** reduce over the columns into V and the moments (x, y, z). The plane height is `zp = -(R20·x + R21·y + tz)/R22`, and the submerged length is `clamp(zp - zlo, 0, zhi - zlo)`. Use one block-wide reduction.
3. **Free-surface levels:** for each node, reduce over its CSR entries at the current level, then do 1–6 safeguarded Newton updates. Port/starboard pairs of open spaces are solved as one surface (`solvePair`). Holds 2–3 below the firemen's tunnel stay split until both sides pass `zMergeHold`. A warp per node pair fits.
4. **Flows:** one thread per connection. Count each node's active connections first (`deg`); the stability limit is shared by that count. Accumulate per node with `atomicAdd`, or use a fixed-order segmented sum if you need bit-for-bit determinism.
5. **Update volumes:** apply the sums, then cap the "pressed up" virtual head at sea level.
6. **Rigid body:** loads from buoyancy and each node's water centroid, then semi-implicit Euler for heave, pitch and roll. One thread.

Keep these exactly or the calibration no longer holds: the step size, the empty-space rule (head = −∞), the overfill area (3% of footprint), the degree-shared limit (0.5/deg), and the Villemonte exponent (0.385).

## Batching for rollouts and MCTS

- **Layout:** one CUDA block per simulation. Columns and CSR entries live in global/constant memory and are shared across all sims. Per-sim state (about 1.2 KB) and the connection flows (about 300 floats) fit in shared memory.
- **Cost:** about 15k column-operations per step. An RTX-class GPU running thousands of blocks should handle on the order of 10⁴–10⁵ full sinkings per minute; measure it, but the arithmetic intensity is high and there is no divergence beyond the clamps.
- **Interface:** `serialize(sim)` / `restore(ship, state)` already define the state boundary. A rollout is restore → apply an action (close a door, open an opening, change pump rate) → run N steps → score. Actions only toggle `enabled` or `area` on connections, so they never change array shapes.
- **Precision:** float32 is fine for the column geometry. Keep float64 (or Kahan sums) for node volumes and the buoyancy reduction, since the forward spaces sit near full for an hour and small residuals drive the trim.

## Golden tests

Run `node tools/validate.js` and keep `out/validation.json`. The port should reproduce, within the tolerances listed:

- Titanic foundering at 157 ± 1 min, and bulkhead F overtopped at 76 ± 1 min.
- The four-compartment case floats at 2.04° ± 0.05°.
- Olympic–Hawke floats at −0.74° ± 0.05°.
- The trim at 30, 75, 100 and 155 min within 0.05° of the JS run.

The JS core is deterministic: a run restored from a snapshot tracks the original to about 0.01°.
