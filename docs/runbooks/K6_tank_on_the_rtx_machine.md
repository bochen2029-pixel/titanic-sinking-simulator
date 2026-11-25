# K6: her hull in a towing tank, on the RTX machine (retired)

**Retired 2026-11-20, 17:42 CST. Do not run.**

This was the run sheet for K6: her hull in a free-surface towing tank, built in FluidX3D, to run on Bo's machine with the RTX 4070 Ti Super. The old sheet is in this file's history, at commit `6d15681`.

## Why it was retired

Short tests on the laptop's GPU found two faults.

- **The tank's first ends drained it.** Its inflow and outflow boundaries let the water run out.
- **The fix still couldn't carry her waves.** The fix was a periodic tank whose water is brought up to her speed. Even so, at the cell sizes the RTX card can afford, the free surface couldn't hold her waves.
  - Away from her hull her waves are under a metre high, and the surface snapped to whole cells.
  - Halving the cell size didn't help.

The tests' numbers stay outside this repository, with the tank. They are results of an altered FluidX3D, and FluidX3D's licence ties publishing such results to publishing the altered source (clause 5). That is Bo's decision.

## What replaces it

K6 now compares the wave field's method with published towing-tank measurements of a benchmark hull: the KCS container ship at Froude 0.26 (hers at 22.5 kn is 0.23).

- Bo decided this on 2026-11-20: "Yes, switch then".
- It needs no GPU, and FluidX3D's licence doesn't apply to it.
- The measurements are KRISO's: Kim, Van and Kim (2001), "Measurement of flows around modern commercial ship models", *Experiments in Fluids* 31, 567-578.
- The KCS geometry, and anything derived from it, stays outside this repository.

## What stays

- **`tools/hull_stl.js`:** her hull as a closed STL, for any tank or mesher.
- **`tools/tank_compare.js`:** compares any free surface written on a grid in the same way with the wave field, place by place.
- **The tank itself** stays outside this repository, in `C:\code\fluidx3d-titanic` on the laptop, on the branch `k6-tank`.
