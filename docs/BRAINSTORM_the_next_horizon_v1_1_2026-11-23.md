# The next horizon: a brainstorm, v1.1

2026-11-23 CST. The coordinator wrote this at Bo's request ("Yes, add NH14"). It adds to
`BRAINSTORM_the_next_horizon_v1_2026-11-23.md`, which stays as written. **v1's sections 0 to 7 stand unchanged; read
v1 for them.** This version adds two items and their place in the order:
- **NH13**, the portable app and the public release. It is written up as its own design,
  `DESIGN_electron_desktop_client_v3_2026-11-23.md`, and recorded here so that the wishlist is whole.
- **NH14**, the simulator as a flooding dynamics model for Unreal and for other projects (section 8).

## 8. The simulator as a flooding dynamics model (NH14)

### 8.1 The ask

Bo, 2026-11-23: "since I plan to eventually use UE as the grpahical frontend for this, if I can make the contacts
correct, couldn't the devs of titanic HG also leverage this as asimplier proxy to direct their own ship sinking IF
(this is the big if) they want to do dyanmic sinking of titanic that is beyond just the single static historical case?"
(his words as typed). "Contacts" is read here as the contract: the interface between the model and a frontend.

### 8.2 Titanic: Honor and Glory, as read on 2026-11-23

- **Who and what.** Vintage Digital Revival (creative director James Penca) has built it since 2012, a walkable
  recreation of the ship in Unreal Engine 5.
- **Status.** Demo 401 v2.0 (March 2023) covers about half the ship. An alpha has been shown, and its Steam page
  plans 2026 with a playtest.
- **Its sinking.** The full real-time sinking (2016) is described as an animation, authored rather than computed. The
  team has said that water should crash through hallways and flood rooms, not lie as a flat sheet.
- **Sources:**
  - <https://en.wikipedia.org/wiki/Titanic:_Honor_and_Glory>;
  - Epic's spotlight of 2019,
    <https://www.unrealengine.com/en-US/spotlights/walking-the-titanic-recreating-history-with-a-vr-experience>;
  - <https://www.pcgamesn.com/titanic-honor-and-glory/making-it-in-unreal-climbing-aboard-the-titanic-with-honor-and-glory>;
  - <https://store.steampowered.com/app/4008900/>;
  - <https://simulationdaily.com/news/titanic-honor-glory-alpha-first-look/>.

  Nothing here is from the team itself, and none of it is checked against them.

### 8.3 The idea

One authored night is a film. A dynamic night (the doors shut sooner, a head-on strike, the pumps led otherwise, a
player's choice) cannot be choreographed, because there are too many branches. It has to be computed, and a game
engine's own physics does not do progressive flooding.

Flight simulators solved the same split long ago. A flight dynamics model computes, and the game renders. JSBSim, an
open-source flight dynamics model, is plugged into FlightGear and other simulators. The simulator can be that for a
ship: **a flooding dynamics model.** It decides when, where and how much; a frontend's artists decide how it looks.

### 8.4 The contract

**In:**
- the ship's description: the hull, the rooms, the openings with their sills, areas and strengths, and the doors;
- the scenario: a damage, or the encounter with the ice;
- the orders: helm, telegraph, doors, pumps;
- time.

**Out, each step:**
- her pose (six degrees of freedom once NH8 is done; heave, pitch and roll, with the motion's position and heading,
  today);
- each room's (today each space's) water level and volume;
- each opening's state (a door shut, a window gone) and the flow through it, which says how big a frontend's
  waterfall should be;
- the lights, deck by deck, from the dynamos;
- the events: funnel 1 falls, the break's onset with its place and sense, the flag;
- after the flag, each piece's pose to the bed.

The offline form exists already: U0's export (`tools/export_json.js`'s fixed form). Its keys are in code order with
fixed decimals; a new field goes at the end of its object, and a change of meaning bumps the format's version. The live
contract is the same fields behind a C API, under the same rules.

### 8.5 Three ways into a frontend

1. **Baked.** A recorded night (`tools/record_night.js`) imported as Sequencer tracks. It works today from the JS
   core, and it suits films and counterfactual cinematics (NH12).
2. **Live.** The C++ core as an Unreal plugin, stepping at 4 Hz (dt 0.25 s) on a worker thread while the frame
   interpolates. A step should cost well under a millisecond even with hundreds of rooms [bet, to measure].
   Determinism gives save and load (`serialize`), replays and lockstep multiplayer for free.
3. **Director.** The sim runs live and owns the state, and the frontend's authored effects fire on its events:
   - water reaches a corridor, and its flood effect plays there;
   - a window gives way, and its glass breaks;
   - the break comes at the model's place and sense, and its best break animation plays.

   The artists keep control of the look; only the timing and the amounts stop being scripted. For a team that has
   authored its night for years, this is the only plausible form.

### 8.6 The SDK

- **`libtitanic`:** C++17 with no dependencies, the JS core's port under the oracle rule (NH10: golden first). A C API:
  - `tsim_create(desc, scenario, seed)`;
  - `tsim_order(h, type, value, arg)`;
  - `tsim_step(h, n)`;
  - `tsim_state(h, out)`;
  - `tsim_events(h, out)`;
  - `tsim_save(h, buf)` and `tsim_load(buf)`.
- **The state contract v1:** written from U0's export, documented, and versioned by its rules.
- **The Unreal plugin:**
  - a subsystem owns the sim on a worker thread;
  - a component per room drives a water plane's height;
  - a component per opening drives its state;
  - a light group per deck follows the dynamos;
  - Blueprint events carry the model's events.
- **Bo's frontend is its first client.** It is also NH12's path to the film.
- **Its test:** the plugin's night equals the JS oracle's to the bit (the 1912 watch's fingerprint). A sample level
  drives a hull, its rooms' water and its openings from the live sim.

### 8.7 What it needs first

- **NH10, the C++ core,** matching golden. Then every platform, consoles included, gets the oracle's night.
- **NH6, the rooms.** A player walks corridors, so 64 spaces is too coarse. Stage 1, the neutral reader, is the
  minimum.
- **A ship-agnostic description** (NH9's groundwork), so that a frontend can feed its own geometry in instead of
  mapping onto R3's. Both come from the same 1912 plans and should agree.
- **A licence that allows the use.** If a project is commercial: a permissive licence or a separate agreement (Bo's
  call).
- **A demo before any outreach.** Bo's Unreal frontend shows the historical night beside a counterfactual (the doors
  shut sooner), both computed.

### 8.8 Risks

- A team that has authored its night for years would hand timing to a model. The director form keeps their look,
  but it is still retooling.
- Their night and the model's will differ somewhere. The ledger (`RECORD_1912`) is the bridge: both can be read
  against the same witness rows. The ensemble ("k of N") becomes a feature: every replay stays inside what the
  evidence allows.
- The promise is "consistent with the record", never "exactly as it was". Breaking up, the fall and her last minutes
  are approximations until NH8.

## 9. NH13 and NH14 in the scoring and the order

Added to v1's section 4:

| Id | Impact | Size | Risk to the calibration | Needs | Sweet spot |
|---|---|---|---|---|---|
| NH13 | 4 | M | none | stage D, D5, the guide | yes, after stage D |
| NH14 | 5 | L | none (the oracle rule) | NH10, NH6 stage 1 | no |

Added to v1's section 5:
- NH13 (the app and the public release) follows stage D, D5 and the guide. It goes before or beside the sweet spots,
  so that the first public zip carries the calibrated model.
- NH14 follows NH10 and NH6's stage 1, in this order:
  1. the C API and the contract v1;
  2. the Unreal plugin, with Bo's frontend as its client;
  3. a two-nights demo;
  4. outreach, on Bo's word.
