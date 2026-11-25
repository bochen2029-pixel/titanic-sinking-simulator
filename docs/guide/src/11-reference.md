---
contents: running it yourself, the commands, a glossary, the sources, this guide
---

# Reference

## Running it yourself

The simulator is played on the web at [https://bochen.xyz/titanic/](https://bochen.xyz/titanic/), and comes as an app
for Windows from the latest release in its repository on GitHub (chapter @@ch.quick-start@@). To run the page from the
repository instead: the website is built into its `dist/` folder. Serve that folder with any static web server, for
example `node tools/serve.js dist 8080`, and open it in a current browser: Edge, Chrome, Firefox or Safari. The model
runs in the page itself. The same models run without a browser, in Node 18 or later with nothing to install (the browser tests
need Node 22 or later, and Edge or Chrome). The page keeps one clock of its own, the time of its frames, which runs on
while a watch is paused and to which its timers and notices keep; a browser test can run it frame by frame, so that the
test does not depend on how busy the machine is. The repository lists its commands in CLAUDE.md:

:::gen commands
:::

## Glossary

| Word | Meaning |
|---|---|
| Trim | Her tilt fore and aft. By the head is bow down, and counts as positive. |
| List | Her tilt to one side, port or starboard. |
| Bulkhead | A watertight wall across the hull. Fifteen, lettered A at the bow to P at the stern, without I. |
| Compartment | The space between two bulkheads: the forepeak FP, the holds H1 to H3, boiler rooms BR6 to BR1, the engine rooms RE, TE and EL, the shaft tunnels T1 and T2, the after peak AP. |
| Decks | Lettered downward from A: B, C, D and E deck are named in this guide. A bulkhead's top reaches B, D or E. |
| Way | Her motion through the water. A rudder needs it. |
| Telegraph | The bridge's dial for engine orders, rung to the engine room. |
| Wing screws | The two outer propellers, turned by the reciprocating engines. The centre screw is the turbine's. |
| Seams | The joints between her plates, riveted. Opened by the ice, they let the sea in along her side. |
| Stem | The foremost edge of her bow. |
| Seed | The number a drawn night is made from. The same seed gives the same night. |
| Fingerprint | Eight characters made from her state at every step of a watch: equal fingerprints, equal watches. |
| Bet | The code's word for a number that had to be guessed, with its reasoning beside it. |
| Reader | A part of the model that follows a watch and keeps an account of its own (the boats, the reports, help, the hull gauge and its onset) without changing the night. |
| Commutator | The bridge's instrument for her list: a pendulum against a scale. |
| Davits, falls | The arms that swing a boat out over the side, and the ropes she is lowered by. |
| CQD, SOS | The distress calls of the wireless: the old one, and the new one she sent beside it. |
| Bending moment | How hard her hull is being bent, here in GN m (a billion newton metres): the weight of her flooded bow and her rising stern against the buoyancy along her length. |
| Hogging, sagging | Her hull bent with its middle up and its ends down, as when her bow and her stern hang on her middle; or the other way. |
| Onset | The first moment her bending and shear somewhere along her reach what her hull could bear there: where and when she would break. On a watch she breaks there: the watch ends and her fall begins. On a damage preset it is a mark, and nothing breaks. |
| Kelvin's wedge | The V of waves a ship leaves on deep water, about 19½° either side of her track. |
| Survey | The wreck as found and mapped on the bed, 3,790 m down: the bow, the stern, and the field of boilers and wreckage where she broke. |
| Point under the break | Where she broke, on the sea above the bed, as her fall takes it: the cut between her two pieces when her fall began (on a damage preset, when she foundered). |

## Sources

The British and American inquiries of 1912. Halpern's eyewitness reconstruction of her trim and list (2023) and his
study of her stability. Hackett and Bedford, *The Sinking of S.S. Titanic, Investigated by Modern Techniques* (RINA,
1996). The trial record of Olympic, Titanic and Britannic. *The Shipbuilder* of 1911, and *Engineering* of 1910 and 1914. The Wageningen
B-series of screws. For her strength, her scantlings from Mengot, Walker (1912) and the Marine Forensics Panel, and
Smith's method of progressive collapse; for her fall, the survey of the wreck, Lamb's hydrodynamics and UNESCO's
equation of state of sea water (1983), and for her speed at the bed Best and others (2000); for her wake, Michell's
thin-ship theory, Holtrop's resistance method and Noblesse and others' bow wave (2008), tried against the tanks' records
of the KCS (Kim, Van and Kim, 2001), the Series 60 (Kim and Jenkins, 1981) and Wigley's hull (Kajitani and others,
1983); for the damage's share by compartment, Felkins, Leighly and Jankovic's table of Hackett and Bedford's openings
(JOM, 1998); for her rooms, Bruce Beveridge's deck plans, drawn for *Titanic: The Ship Magnificent* (2008), as
Encyclopedia Titanica publishes them free, checked against *The Shipbuilder*'s plates, and
for who was booked into the first-class staterooms, the Cave list of 1912, read from the Nova Scotia Archives' scan
of the original. Each number in the model is meant to name its source, or to say that it is a guess, in the
repository's research notes; one that does neither is a fault worth reporting.
The repository's SOURCES.md lists the sources, with what the simulator takes from each.

## This guide

This is edition @@edition@@, built from the repository at commit @@repo.commit@@ for the website build
@@site.version@@ (app @@site.app@@). Its chapters are Markdown files in `docs/guide/src/`, built by
`node tools/build_guide.js` and held to the simulator by `node tools/guide_check.js`; `node tools/guide_shots.js` takes
its pictures through the page's own controls. Its tables of results, the cards, the {{Systems}} tab's links, the
plant's numbers, the readers' rules, the commands, and the sentences and counts it quotes from the page are pulled from
the repository at build time.

The simulator is in early access, and this guide follows it edition by edition. The page's footer links to the guide
(User Guide), and a fault, in the page or in this guide, can be reported in the repository's Issues on GitHub (Report a
fault).
