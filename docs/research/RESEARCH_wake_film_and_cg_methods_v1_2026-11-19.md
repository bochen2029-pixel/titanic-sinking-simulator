# Ship wakes in the 1997 film and in computer graphics since: how Titanic's water was made, and the run-time wave methods with their equations (v1)

- **Written:** 2026-11-19, 14:12 to 14:45 CST, by a research subagent of session 8b9ba51f (Claude Code desktop, Opus 5.5), for the coordinating session writing the wake brainstorm's v2 after `docs/BRAINSTORM_the_wake_computed_v1_2026-11-19.md` (this note answers its sections 4, 7 and 10).
- **Method:** web search and WebFetch only: 17 searches and about 67 fetch calls (about 15 of them redirects, refusals or binary PDFs). No browser pane; nothing downloaded on purpose; no other file in the repository touched; no test suite run; no git command. Formulas were taken from source code where the papers could not be read: the authors' own code for wave packets (`jeschke/water-wave-packets`), the second author's reference code for Water Surface Wavelets, and public implementations that cite iWave and eWave. A few numbers were computed with one-line PowerShell commands (section 7, end).
- **Refused or unreadable:** Tessendorf's PDFs on jtessen.people.clemson.edu (`Interactive_Water_Surfaces.pdf`, `ewavealgorithm.pdf`, `verticalderivativesforiwave.pdf`, `waketheory.pdf`) came back as compressed binary; the fetch tool kept copies in its own tool-results folder by itself; I did not open them. The Water Wave Packets author PDF (13 MB) is over the tool's 10 MB limit; the paper's ACM full-text page (tried for Water Surface Wavelets) returned 403. vfxhq.com failed on a TLS certificate mismatch. Wikipedia has no article on Tessendorf (404). The Dispersion Kernels project page (gmrv.es, now vg-lab.es) returned 404. A guessed path to Crest's dynamic-wave shader returned 404. Tessendorf's old Clemson addresses (people.cs.clemson.edu, people.computing.clemson.edu) redirect to jtessen.people.clemson.edu, where `papers.htm` no longer exists (his list is `reports/index.html`). Not attempted, because PDFs come back binary or are too large: Yuksel's paper and dissertation, Schreck 2019 (44 MB), Jeschke 2023 (7.5 MB), the Water Surface Wavelets PDF, the Atlas and Uncharted slides, Chan's thesis (67 MB). American Cinematographer (December 1997) was not found online.
- **Tags:** [read] = in a page I opened, asked for the explicit formula or figure; [read in X] = in a page I opened that quotes or compiles the original, the original not opened; [search summary] = only in a search-result digest; [textbook] = a standard result stated from memory (said so); [derived] = my arithmetic, shown; [bet] = no source, my judgement; NOT FOUND.
- **Tool caveat:** WebFetch passes each page through a small model. No PDF could be read, so the equations that matter (iWave's kernel and step, eWave's update, the packet's contents) were asked for as exact lines of source code, which the tool quoted; the notation in this note is rebuilt from those lines in plain text, and every formula that is mine is tagged [derived].
- **Quotes:** at most one short phrase per source, under 15 words; everything else is paraphrase.
- **Conventions:** deep-water dispersion omega^2 = g k, g = 9.81 m/s^2; phase speed c = omega/k = sqrt(g/k), group speed c_g = c/2; Kelvin half-angle asin(1/3) = 19.47 degrees. A "packet" is a wave packet in Jeschke and Wojtan's sense (section 1.5). Ship frame as in the repository's `CLAUDE.md` (x forward, y to port); speeds in m/s unless knots are written. 22.5 kn = 11.575 m/s.
- **Read with:** `docs/BRAINSTORM_the_wake_computed_v1_2026-11-19.md` (this note answers its sections 4, 7 and 10), `site/visuals.js` (the wake drawn today), `core/motion.js` (the inputs a wake method can take: surge u, sway v, yaw rate r, heading, shaft speeds).

## 0. Summary

- **The film did not compute its wake.** Titanic's sea under way was computed (Areté Image Software's ocean, customised by Digital Domain for four months, rendered without geometry at 40 minutes to 4 hours a frame), but the wake and white water were texture maps photographed off the Lane Victory for the purpose, and the bow wave's shape came from a procedure in Areté's package that varied with hull and speed; plates were doubled and blended by hand (a twin-screw wake made triple), and the calm night sea was a hand-tuned RenderMan shader [read, Cinefex 72]. That Areté's ocean was Tessendorf's package (RenderWorld) is a strong bet: his biography says his oceanscape software was used "extensively in Titanic" and his gallery lists Titanic for RenderWorld [read]. His one Academy award (2008) is for Rhythm & Hues' fluid tools, not the ocean [read].
- **iWave is not deep water.** Its kernel (read in an implementation that follows the chapter) is `G = (1/G0) sum q^2 exp(-q^2) J0(q r)`, 13 x 13, `G(0,0) = 1`; its step is `h_new = ((2 - alpha dt) h - h_prev - g dt^2 (G * h)) / (1 + alpha dt)`, then sources added and the obstruction multiplied in. Computed this session, its dispersion factor S over the exact one runs from 43 to 0.24 across the grid's waves; the window's sum is 2.10, so long waves stand still; the ratio of group to phase speed, which sets Kelvin's angle, is 0.05 to 0.36 over 9 to 63 cells per wavelength instead of 0.5 [derived]. It cannot make her wedge.
- **eWave is exact.** Each Fourier mode turns by `cos(omega dt)` and `sin(omega dt)` with `omega = sqrt(g k)`: `H' = cH + (k/omega) s P`, `P' = cP - (g/omega) s H`, exact for any dt [read in a public implementation; derived]; with a moving pressure footprint (the starting point of Tessendorf's own 2000 one-pager on boat wakes in the FFT ocean [read: its description; content from a search digest]) it gives a Kelvin wake, interference along the hull, turns and stops from the equations, at the cost of FFTs; it cannot reflect off the berg without a real-space approximation.
- **Wave packets were read in the authors' own code**, not their paper (too large for the tool): a packet is a crest segment with a wavenumber band, an energy, an envelope of three wavelengths and a phase, moving at the exact capillary-gravity group speed; its amplitude follows from energy and crest length, so it spreads instead of fading; it reflects and diffracts. The released sandbox has no boat emitter; the paper's boat rule is NOT FOUND. Section 6.3 gives a rule from Kelvin's stationary-wave conditions.
- **Water Surface Wavelets** (2018) carry amplitude per direction and wavelength on a grid, advected at the group speed and reflected by a level set; cheap per wave train but, as I read it, without the phase that bow-stern interference needs [bet]. **Dispersion Kernels** (2016) fix exactly iWave's truncation defect ("pyramid kernels") and add obstacles ("shadowed convolution"). **Fundamental Solutions** (2019) give circular ripples in closed form, the building block of an exact Kelvin sum over the track. **Jeschke and Wojtan 2023** add Airy-wave dispersion to shallow-water solvers, whose own waves all move at one speed and make Mach wedges, not Kelvin's.
- **Games:** FFT or Gerstner seas with local, mostly non-dispersive simulations and foam (Sea of Thieves, Crest, Uncharted's wave particles); no shipped game's talk I could read computes a Kelvin wake. Computed Kelvin wakes in real time exist in small recent projects: eWave on a GPU (0.6-0.8 ms at 512^2) and in a 35 KB browser page, and a 2025 Liège thesis that does v1's method A (Michell's thin-ship spectrum with Stoker's influence points for curved paths) in Unreal Engine 5.
- **For the model** (section 6): a methods table, the iWave and eWave updates ready to type, the packet's contents and an emission rule. The two candidates are a Fourier wake (eWave plus her footprint: exact, simple, no berg) and packets (the berg and an open sea, more machinery); iWave and wave particles are out.

## 1. Run-time wave methods since 1997, with their equations

### 1.1 Tessendorf, "Simulating Ocean Water" (1999-2004): the FFT ocean

His reports page lists the course as "Simulating Ocean Surface": notes of 2002 and 2004, slides of 2001, 2002 and 2004, from a course given at SIGGRAPH from 1999 to 2004 [read, jtessen.people.clemson.edu/reports]. The PDFs were not opened (the tool returns his PDFs as binary).

| Item | As found | Tag |
|---|---|---|
| Surface | `h(x, t) = sum over k of h~(k, t) exp(i k . x)` on a periodic square, evaluated by FFT | [read in Algis and others, "Arc Blanc" (arXiv 2503.03326, 2025), eq. 2]; [textbook] |
| Time | `h~(k, t) = h~0(k) exp(i omega(k) t) + conj(h~0(-k)) exp(-i omega(k) t)`, `omega = sqrt(g k)`: each mode turns at its own exact frequency, so dispersion is exact and there is no time step | [read in Arc Blanc, eq. 3] |
| Initial amplitudes | `h~0(k) = (xi_r + i xi_i) sqrt(P(k) / 2)` with Gaussian draws; Phillips spectrum `P(k) = A exp(-1 / (k L)^2) / k^4 |k_hat . w_hat|^2`, `L = V^2 / g` (V = wind speed) | [textbook] |
| Choppiness | horizontal displacement `D(x, t) = sum of -i (k / |k|) h~(k, t) exp(i k . x)` | [textbook] |
| Wakes in the course | the notes and slides list wakes among the FFT surface's examples and say the boat and its V-shaped Kelvin wake can be simulated | [search summary of the 2002-2004 notes and slides] |
| **The wake note** | "Fast Wake Algorithm Derivation" (March 2000): "One pager on creating boat wakes in the FFT water surface method". It starts from the linearised equations for height and velocity potential, with a source term: the wake source's shape moving at the boat's velocity | title and description [read, reports page]; content [search summary]; the PDF itself came back as binary |
| Interaction | the FFT surface cannot respond to arbitrary objects; this is why iWave was written | [search summary of the iWave chapter] |

What the wake note's starting point gives, worked through [derived]: with `dh/dt = sqrt(-laplacian) phi` and `dphi/dt = -g h - p(x - X(t)) / rho` (p the boat's pressure footprint, X(t) its track), each Fourier mode obeys the eWave step of section 1.3 plus the source, and the footprint's transform is `p~(k) exp(-i k . X(t))`. So a wake on any track costs one inverse FFT per frame, with the per-mode state carried from frame to frame; in a frame that moves with the boat (velocity V) the source is fixed and each mode turns by `exp(+i k . V dt)` instead. A straight course at steady speed gives Kelvin's pattern, wedge included, without being told; a curved course, a change of speed or a stop give whatever the linear theory gives. What it cannot do is reflect: a Fourier square has no obstacles, only periodic edges. I could not confirm this is the note's own algorithm (NOT FOUND); it is the only algorithm its stated starting point leads to.

For her night [derived, from the v1 brainstorm's section 3.2: the sea was flat calm]: the ambient spectrum (wind, Phillips) contributes nothing; only the wake part of the FFT method matters.

### 1.2 Tessendorf, iWave ("Interactive Water Surfaces", Game Programming Gems 4, 2004)

The chapter's PDF on Tessendorf's Clemson page came back as compressed binary, so the formulas below come from a search digest of the chapter, from a public implementation whose kernel code says it follows "the paper" (`sdao/iWaveOcean`, a 3ds Max plug-in on GitHub), and from my own arithmetic on that kernel.

| Item | As found | Tag |
|---|---|---|
| Equation of motion | `d2h/dt2 + alpha dh/dt = -g sqrt(-laplacian) h`: the linearised deep-water free surface (in Fourier space `omega^2 = g k`), with an ad hoc damping `alpha` | [textbook]; the update below is its discretisation [read in sdao/iWaveOcean] |
| The operator | `sqrt(-laplacian)` (the "vertical derivative") is applied as a convolution over the height grid; time stepping is explicit | [search summary of the chapter] |
| Kernel | `G(k,l) = (1/G0) * sum over n of q_n^2 exp(-sigma q_n^2) J0(q_n r)`, `r = sqrt(k^2 + l^2)` in grid cells, `q_n = n dq`, `dq = 0.001`, `0 <= q < 10` (10,000 terms), `sigma = 1`; `G0 = sum over n of q_n^2 exp(-sigma q_n^2)`, so `G(0,0) = 1`. J0 is the Bessel function of order 0 | [read in sdao/iWaveOcean, `src/VerticalDerivativeConvolution.h`; its comment: "From the paper, we want dq = .001"] |
| Kernel size | half-width P = 6, a 13 x 13 window; P = 6 is the smallest that still looks like water | [search summary of the chapter]; "13x13" also in Tessendorf's 2004 course slides [search summary] |
| Update, per cell, per step | `h' = h * o`; `v = G * h'` (13 x 13 convolution); `h_new = ((2 - alpha dt) h' - h_prev - g dt^2 v) / (1 + alpha dt)`; then `h_new += s`; `h_new *= o`; `h_prev = h'` | [read in sdao/iWaveOcean, `src/Dynamics.cpp`: `alpha_dt_1 = 2.0 - (alpha * dt)`, `alpha_dt_2 = 1.0 / (1.0 + alpha * dt)`, `gravity(9.8 * dt * dt)`] |
| Obstacles | an obstruction map `o(x)` in [0, 1], 0 inside a body, multiplied into the height each step (the body is a hole the waves reflect from) | [read in sdao/iWaveOcean] |
| Sources | a source map `s(x)` added to the height each step; the paper's rule is `s = 1 - o` for a moving body (the implementation uses `1 - o^p` with `o` Gaussian-smoothed, "slightly stronger waves") | [read in sdao/iWaveOcean, comment "Paper suggests source = 1 - obstruction"] |
| Units | the kernel works in grid cells: the step as coded is right for a grid spacing of 1 m; for spacing `dx` the term is `(g dt^2 / dx) v` | [derived] |
| Criticism | iWave "considerably underestimates wave propagation velocity" (Canabal and others, 2016) | [search summary] |

**The kernel in closed form** [derived]: the integral `int from 0 to infinity of q^2 exp(-sigma q^2) J0(q r) dq = (sqrt(pi) / (4 sigma^1.5)) M(3/2, 1, -r^2 / (4 sigma))` (a standard Hankel-transform integral [textbook]), and `G0` is the same integral at r = 0, so `G(r) = M(3/2, 1, -r^2/(4 sigma)) = exp(-r^2/(4 sigma)) M(-1/2, 1, r^2/(4 sigma))`, M being Kummer's confluent hypergeometric function. With sigma = 1: G(0) = 1, G(1) = 0.678, G(sqrt 2) = 0.445, G(2) = 0.156, G(3) = -0.065, G(6) = -0.0150; the far tail is `-(4 sigma^1.5 / sqrt(pi)) / r^3`, which is why a truncated window leaves a net sum [derived; computed this session in PowerShell from the series of M].

**Its dispersion** [derived, computed]: a plane wave of `kappa` radians per cell along a grid axis sees the factor `S(kappa) = sum over the 13 x 13 window of G(k,l) cos(kappa k)`, and the scheme's dispersion is `omega^2 = (g / dx) S(kappa)`. Deep water needs `S = kappa`.

| kappa (rad per cell) | 0 | 0.05 | 0.1 | 0.2 | 0.3 | 0.5 | 0.75 | 1.0 | 1.25 | 1.5 | 1.75 | 2.0 | pi |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| wavelength (cells) | infinite | 126 | 63 | 31 | 21 | 12.6 | 8.4 | 6.3 | 5.0 | 4.2 | 3.6 | 3.1 | 2 |
| S, 13 x 13 | 2.098 | 2.150 | 2.304 | 2.880 | 3.706 | 5.433 | 6.271 | 5.240 | 3.569 | 2.255 | 1.274 | 0.488 | -0.087 |
| S / kappa (1 = right) | - | 43 | 23 | 14.4 | 12.4 | 10.9 | 8.4 | 5.2 | 2.9 | 1.50 | 0.73 | 0.24 | - |

What that means [derived]:
- **No scale is right.** Without truncation the kernel's symbol would be `(2 pi / G0) kappa exp(-sigma kappa^2) = 14.18 kappa exp(-kappa^2)`: the normalisation `G(0,0) = 1` makes the operator about 14 times `sqrt(-laplacian)` at long waves, and the Gaussian kills it at short ones. The ratio S/kappa runs from 43 to 0.24 across the waves the grid can hold; no choice of g, dt or dx makes it 1 over more than a narrow band (it crosses 1 near 4 cells per wavelength). Implementations tune g, dt and alpha by eye.
- **Long waves do not travel.** The 13 x 13 window's sum is 2.10, not 0, so `S ~ 2.10 + 20.9 kappa^2` at small kappa: long waves get a frequency floor `sqrt(2.10 g / dx)` and a group speed that falls to zero as they lengthen. Measured on S by finite differences, the group speed over deep water's is 0.15 at 209 cells per wavelength, 0.32 at 126, 0.84 at 63, 1.19 at 48, 1.91 at 31, 2.55 at 21, 2.18 at 12.6 and 0.28 at 9; the phase speed over deep water's is 8.4, 6.6, 4.8, 4.3, 3.8, 3.5, 3.3 and 3.0 at the same points (with the scale g/dx left as it is). This is consistent with Canabal's "underestimates" for long waves.
- **The ratio that sets the wedge is wrong.** Kelvin's angle comes from group speed over phase speed, 1/2 in deep water. Here it is 0.09 at 63 cells per wavelength, 0.36 at 21 and 0.33 at 12.6. For a constant ratio n the wedge's half-angle is `atan(n / (2 sqrt(1 - n)))`: 19.47 degrees at n = 0.5, 12.3 degrees at n = 0.35 [derived; textbook form of Havelock's construction].
- **Above about 0.75 rad per cell S falls as kappa rises:** the group velocity there points backwards. Waves shorter than about 8 cells move the wrong way relative to their crests.
- **Isotropy is good:** along the diagonal S is within 3 % of the axis value (0.972 at kappa 0.5).
- **The axis Nyquist mode has S(pi, 0) = -0.087 < 0**, an exponential growth of `sqrt(0.087 g / dx)` per second (0.92 per second at dx = 1 m) unless alpha or smoothing holds it down. I did not run the scheme; this is a property of the kernel as coded.
- **Stability limit** of the explicit step: `g dt^2 S_max / dx <= 4`, so `dt <= 2 sqrt(dx / (6.27 g)) = 0.255 sqrt(dx)` seconds (dx in metres).
- **Cost:** 169 multiply-adds per cell per step. A 512 x 512 grid is 44 million per step; a 1024 x 1024 grid 177 million.
- **For a Kelvin wake** the cusp and transverse waves must sit in the band where the ratio is 1 and the group speed half the phase speed, which this kernel nowhere provides. So the wedge an iWave boat makes depends on dx and speed and is not 19.47 degrees, except by accident.

### 1.3 Tessendorf, eWave (the exponential-integrator note)

Tessendorf, "eWave: Using an Exponential Solver on the iWave Problem" (2014, `ewavealgorithm.pdf` on his Clemson page) came back as compressed binary. Sources used: a search digest of the note; a public single-file WebGL2 ocean (`CodeWithBehnam/ocean4-live`, which cites the note and draws "eWave Kelvin wakes"), whose shader I read; and the derivation, which is short.

| Item | As found | Tag |
|---|---|---|
| The idea | iWave's system written as a linear equation for the two-component state (height, velocity potential), with a matrix holding `sqrt(-laplacian)` and gravity; the exact solution is a matrix exponential; its Taylor series split into even and odd powers gives cos and sin of `omega(k) dt`; on a grid, transform to Fourier space, multiply, transform back; a factor `g sin(omega dt) / omega` appears; inverse transforms give three real-space kernels named C, S and T | [search summary of the note] |
| Real-space window | the note refers back to iWave's smallest window, 13 x 13 | [search summary] |
| Equations | `dh/dt = sqrt(-laplacian) phi`; `dphi/dt = -g h - p / rho` (p = pressure on the surface, the source) | [textbook] |
| Exact step, each Fourier mode k | `h(t+dt) = cos(omega dt) h + (k / omega) sin(omega dt) phi`; `phi(t+dt) = cos(omega dt) phi - (g / omega) sin(omega dt) h`; `omega = sqrt(g k)` | [derived]; the same lines are in ocean4-live's `prop` shader: `Hn=c*Hk+(K/w)*s*Pk;` `Pn=c*Pk-(Gk/w)*s*Hk;` [read in ocean4-live] |
| With depth and surface tension | ocean4-live: `K = k tanh(min(k d, 20))`, `G = g (1 + cap k^2 * 7.5625e-6)` (the capillary length 2.75 mm squared), `omega = sqrt(K G)` | [read in ocean4-live] |
| A pressure source held constant over the step | add `-(p / (rho g)) (1 - cos(omega dt))` to h and `-(p / rho) sin(omega dt) / omega` to phi, mode by mode | [derived] (variation of constants; at rest the patch depresses the surface by `p / (rho g)`, as it must) |
| A current or a moving window | multiply both h and phi by `exp(-i k . U dt)`, U the water's velocity relative to the grid; ocean4-live passes `U = current - post velocity` and so moves the grid with its post ("the solver's drift-current term"); for a grid following a ship at V with no current the factor is `exp(+i k . V dt)` | [read in ocean4-live]; sign [derived] |
| Obstacles | not possible in Fourier space alone: ocean4-live applies a real-space mask after each step (the height inside the post is forced, and a thin ring outside it adds a height source each step) | [read in ocean4-live] |
| Edges | the domain is periodic; ocean4-live multiplies h and phi near the edges by `(d / L)^0.05` within L = one eighth of the domain | [read in ocean4-live] |
| Damping | none in the step; ocean4-live adds an optional `exp(-dt / tau)` | [read in ocean4-live] |
| Properties | exact dispersion for every mode the grid holds, for any dt; no numerical damping | [read in ocean4-live README]; [derived] |
| Cost | one forward and one inverse 2D FFT per step (h and phi packed as one complex field): about `2 x 5 N^2 log2(N^2)` flops, 47 million for N = 512 | [derived] |
| Kelvin wake | ocean4-live claims Kelvin's 19.47 degree pattern from a 3 m post at 6 m/s on a 512 x 512 grid of 0.39 m | [read in ocean4-live README]; not run here |

Scale for her [derived]: a 512 x 512 window at 4 m holds 2 km of sea; her transverse waves at 22.5 kn (85.8 m) get 21 cells, the cusp waves (57.2 m) 14, and the shortest wave the grid holds (8 m) is the divergent wave at 72 degrees (`85.8 cos^2(72 deg) = 8.2 m`), the same limit as the page's construction today.

### 1.4 Yuksel, House and Keyser, "Wave Particles" (2007)

The paper and Yuksel's dissertation (Texas A&M, 2010) are PDFs; neither was read. Sources: the project page, two curated lists, and memory, tagged as such.

| Item | As found | Tag |
|---|---|---|
| The claim | "a simple, fast, and unconditionally stable approach to wave simulation"; the GPU turns particles into a height field, warped horizontally for the waves' own flow; reflection off boundaries; objects feel wave forces and make waves by their motion | [read, cemyuksel.com project page] |
| Boats | three boats driven by propeller and rudder forces (one on a joystick), not scripted; 170 fps on a GeForce 7900 GTX; 1,681 boats at 4.8 fps, where rigid bodies, not waves, were the bottleneck | [read, project page captions] |
| How the height field is made | particles splatted into a texture, then filtered with a kernel that gives trochoidal crests | [read in Wave Harmonic's `water-resources` list] |
| Games | the basis of Uncharted's animated waves: wave particles add local high-frequency waves to the ocean in Uncharted 3 and were adapted for rivers in Uncharted 4 (Gonzalez-Ochoa and Holder, GDC 2012; Gonzalez-Ochoa, SIGGRAPH 2016) | [read in `water-resources`; read in the README of `ACskyline/Wave-Particles-with-Interactive-Vortices`] |
| A particle | amplitude, origin, direction, a dispersion angle (the arc it stands for), birth time; one radius and one speed shared by all; the height is a sum of cosine bumps `a_i (1/2)(1 + cos(pi |x - x_i| / R))` inside radius R; a particle splits into three, each with a third of the amplitude and of the arc, when the gap between neighbours exceeds a fraction of R; reflected particles mirror | [bet: from memory of the paper; the dissertation's contents list sections on a radial definition, subdivision and dispersion, search summary] |
| Dispersion | none: every particle travels at the same speed | [bet: from memory; consistent with the "same radius, same speed" design] |

Its wake [derived]: with one speed c for every wave, a source faster than c drags a Mach cone of half-angle `asin(c / U)`, which narrows as she speeds up, and a source slower than c leaves no wedge at all. Kelvin's wedge is fixed at 19.47 degrees because every wavelength's group speed is half its phase speed; a particle has no wavelength, so it has nothing to make that from. Wave particles carry no phase either, so there is no interference between bow and stern. Good for spray-scale ripples around a hull or a boat; wrong for her far wake.

### 1.5 Jeschke and Wojtan, "Water Wave Packets" (2017), and "Wavefront Parameter Interpolation" (2015)

The paper's PDF (13 MB) is larger than the fetch tool takes, and ACM's page refused. The project page and the authors' own sandbox code are readable: `jeschke/water-wave-packets` on GitHub, v1.0.0, archived as Zenodo record 525184 ("Sandbox binary and source code for the Siggraph 2017 paper"); `Packets.h` and `Packets.cpp` hold all of the packet logic. Everything in this table is [read] in that code unless tagged otherwise.

| Item | As found |
|---|---|
| What the method is | water surface waves as a displacement field on a 2D domain; Lagrangian particles each carry a packet of wave energy, a group of wave trains rather than one crest; unconditionally stable; real time "for moderately challenging scenarios" [read on the project page] |
| What one packet carries | three vertices (`pos1, pos2, pos3`), each with a direction and a speed and last step's values (for bounces); the third vertex is optional and marks a "sliding" point for diffraction; `midPos` and `travelDir` (for rendering); `bending` (circular-arc bending of the wave inside the envelope); `phase` (of the representative wave inside the envelope); `E` (the packet's energy, which sets the amplitude; the comment calls it "wave energy flux"); `envelope` (its size); `k` and `w0` (current wavenumber and angular frequency); `k_L, k_H, w0_L, w0_H` (the band it stands for, low and high); `d_L, d_H` (how far the band's edge waves have drifted from the reference wave); `ampOld, dAmp` (amplitude ramp so waves appear and vanish smoothly) |
| The wave it stands for | the segment `pos1`-`pos2` is a piece of crest; the packet moves perpendicular to it; its carrier is one wave of wavenumber k inside a window `envelope` long in the travel direction and as wide as the crest segment |
| Dispersion | `w0 = sqrt((g + k^2 sigma / rho) k tanh(k d))`, with `sigma = 0.074 N/m`, `rho = 998.2071`, `g = 9.81` (capillary-gravity waves, any depth; `tanh` by a rational approximation); group speed is the exact `d omega / d k` of that relation; phase speed `w0 / k` |
| Motion | each vertex: `pos += dt * speed * dir` with speed = group speed; phase: `phase += dt * (c_phase - c_group) * k`, so crests run through the envelope as real ones do (twice the envelope's speed in deep water) |
| Amplitude | `a = sqrt(E / (area * 0.5 * (rho g + sigma k^2)))`, with `area = envelope * |pos2 - pos1|`: energy conserved, so the amplitude falls as the crest stretches (spreading, not fading); capped at `a <= 0.07 * 2 pi / k` (steepness) |
| Damping | `E *= exp((-2 k^2 nu - 0.5 k sqrt(0.5 nu w0)) dt)`, viscosity `nu = 8.9e-7 m^2/s` plus a surface-film term. For her 57 m waves this is nil [derived: `2 k^2 nu = 2 (0.11)^2 8.9e-7 = 2.2e-8` per second] |
| Envelope | 3 wavelengths (`PACKET_ENVELOPE_SIZE_FACTOR 3.0`), clamped to 0.02-10 m in this sandbox (a small-scale demo; her waves would need the cap raised) |
| Splitting | by frequency, when the band's edge waves have drifted apart by more than 0.3 envelope (`d_L + d_H`); by crest, when the segment is longer than the envelope or its two ends' directions differ by more than 18 degrees (energy halved between the two); by sliding, in proportion to length |
| Obstacles | a wave reflects when it meets a boundary at more than 4.5 degrees, else it diffracts along it (sliding vertex); a reflected packet first appears as a "ghost"; a reflection can spawn shorter waves |
| Creating packets | only three creators in the sandbox: `CreateCircularWavefront(x, y, radius, lambda_L, lambda_H, E)` (a ring of segments, at most 24 degrees each), `CreateLinearWavefront(x, y, dirx, diry, crestlength, lambda_L, lambda_H, E)` and `CreateSpreadingPacket(..., spreadFactor, ...)`; `k` is the middle of the band. **There is no boat emitter in the released code** |
| Budget | a constructor argument (`Packets(int packetBudget)`); memory grows by 500,000 vertices at a time |
| Boat wakes | the authors also developed a theory of wakes behind objects moving on the surface, using physics to find which waves dominate visually so that the rest can be skipped [read, ISTA press release "Making waves"]; the paper's emission rule could not be read (NOT FOUND) |
| Rendering, counts, timings | NOT FOUND in a readable source (the paper); the sandbox renders with Direct3D 11 (`WavePackets.fx`) [read in the README] |

The 2015 paper ("Water Wave Animation via Wavefront Parameter Interpolation", ACM ToG 34(3)) is the forerunner: wavefronts as chains of particles with parameters interpolated along them. Not opened (section 5).

### 1.6 Jeschke and others, "Water Surface Wavelets" (2018)

Jeschke, Skrivan, Mueller-Fischer, Chentanez, Macklin and Wojtan, ACM ToG 37(4), article 94. The PDF at ISTA was not readable by the tool. Sources: the search digest of the abstract, and a public reference implementation by the second author (`lecopivo/WaterSurfaceWavelets`, MIT licence), whose `src/WaveGrid.cpp` I read.

| Item | As found | Tag |
|---|---|---|
| The idea | a wavelet transform: the surface is described by amplitude-like functions that vary over space, one per direction and wavenumber; their equations of motion are 2D advection and diffusion, which parallelise; this escapes the CFL limit of methods that step the height itself | [search summary of the abstract] |
| State | `A(x, y, theta, zeta)`: amplitude per cell, per direction theta (0 to 2 pi), per log-wavelength `zeta` (wavelength `2^zeta`, wavenumber `2 pi / 2^zeta`) | [read in WaveGrid.cpp] |
| Motion | semi-Lagrangian advection of each (theta, zeta) slice at the group velocity `c_g(k) (cos theta, sin theta)`, deep water `omega = sqrt(g k)`, `c_g = 0.5 sqrt(g / k)`; then diffusion in direction, `A_theta <- (1 - gamma) A_theta + (gamma / 2)(A_theta+1 + A_theta-1)` with `gamma = 2 x 0.025 c_g dt / dx` (spreading of a finite crest); the time step is limited by the fastest group speed over a cell | [read in WaveGrid.cpp] |
| Reflection | from a level set of the shore or body: position mirrored, `pos - 2 ls n`, direction mirrored, `k - 2 (k . n) n` | [read in WaveGrid.cpp] |
| Height | for each cell, sum over directions and wavenumber bins of `A x profile(k_hat . x)`, with horizontal displacement as well (Gerstner-like); the profile is a precomputed periodic 1D wave shape per wavenumber band (a "profile buffer") | [read in WaveGrid.cpp; ProfileBuffer.cpp] |
| Sources | the reference code has only a point disturbance (adds to every direction at the lowest wavenumber bin); how the paper sources a boat is NOT FOUND | [read in WaveGrid.cpp] |
| Real time | the abstract claims real-time interaction with moving obstacles over large domains, plus precomputed wave paths, two-way solid-fluid coupling and a wave-painting interface [read, history.siggraph.org]; the 2017 SIGGRAPH Real-Time Live entry "Large-scale interactive water simulation with directional waves", which v1 cites for packets, is probably this work's preview | [bet; see conflict 1] |

Why it matters here [bet]: this is the same physics as packets but on a grid of directions and wavelengths, so its cost does not grow with the number of wave trains, and reflection off the berg is a level set. But each cell's amplitude has no phase memory across directions: the interference between bow and stern systems, which section 2 of the brainstorm shows is what changes her wake between 18 and 22 knots, is not carried unless the source puts it in.

### 1.7 Schreck, Hafner and Wojtan, "Fundamental Solutions for Water Wave Animation" (2019)

ACM ToG 38(4), article 130. The open-access PDF at ISTA is 44 MB (over the tool's limit); the abstract was read on the ISTA record.

| Item | As found | Tag |
|---|---|---|
| Ripples | an analytical solution that animates circular ripples in closed form | [read, ISTA record 6442] |
| Obstacles | the method of fundamental solutions (MFS) adapted to make ambient waves interact with complex obstacles | [read] |
| Moving obstacles | a new wavelet-based discretization that beats the MFS state of the art for time-varying waves with moving obstacles | [read] |
| Checks | compared with previous work, known analytical solutions and real-world examples; large open domains | [read] |
| Equations, cost | NOT FOUND (the PDF) | |

Why it matters here [derived]: a circular ripple in closed form is the impulse response of linear deep water (the Cauchy-Poisson problem [textbook]). A ship's wake is the sum of such ripples from every point of her past track, which is exactly Kelvin's own construction and Khan's 1994 thesis (section 3). With exact ripples the sum gives the wedge, the cusp, the curved track and the stop without being told. Its cost is the sum: sources times points times history, unless the history is cut where the ripples have spread to nothing.

### 1.8 Canabal and others, "Dispersion Kernels for Water Wave Simulation" (2016)

Canabal, Miraut, Thuerey, Kim, Portilla and Otaduy, SIGGRAPH Asia 2016 (ACM ToG 35(6)). PDF at gmrv.es not opened (the project page has moved and returned 404).

| Item | As found | Tag |
|---|---|---|
| The method | wave accelerations computed by applying a dispersion kernel as a spatially variant filter, keeping real waves' scale-dependent speeds while handling obstacles efficiently | [read, history.siggraph.org abstract] |
| Pyramid kernels | compact kernels that compensate for low-frequency truncation errors | [read]: exactly the defect found in iWave's 13 x 13 window above (sum 2.10 instead of 0) [derived link] |
| Shadowed convolution | obstacles enter by modulating how the kernel is applied around them (reflecting boundaries, static and moving) | [read]; [search summary] |
| Range | capillary and gravity waves in one simulation | [read] |
| On iWave | iWave "considerably underestimates wave propagation velocity" | [search summary of the PDF] |
| Kernel formula, sizes, cost | NOT FOUND | |

### 1.9 Jeschke and Wojtan, "Generalizing Shallow Water Simulations with Dispersive Surface Waves" (2023)

ACM ToG 42(4), article 83; open-access PDF (7.5 MB) at ISTA; abstract read on the ISTA record 14240.

| Item | As found | Tag |
|---|---|---|
| Split | at the start of each step the waves are split into a bulk flow that approximately obeys the shallow water equations and surface waves that approximately obey Airy (linear) theory; each is solved by its own state-of-the-art method; the velocities are recombined at the end of the step | [read, ISTA record] |
| Claim | the first height-field model that captures deep and shallow effects together; examples include **a boat wake sloshing up onto a beach** and a dam break | [read] |
| Dispersion | the method's numerical dispersion analysed; an exact correction factor for constant depth reproduces theoretical dispersion patterns | [read] |
| Cost, real time | not stated on the record | NOT FOUND |

The point for this simulator [derived]: a pure shallow-water solver moves every wave at `sqrt(g d)`, so a boat in it makes a Mach-type wedge, not Kelvin's; that is the gap this paper closes. Her sea is deep water for every wave she makes (the v1 brainstorm's depth over transverse wavelength, 44 [A: 17], puts the bottom near 3,800 m), so the shallow half would be idle and only the Airy half matters.

### 1.10 Game practice: Sea of Thieves, Assassin's Creed IV, Crest, Uncharted and others

| Game or system | What is known | Tag |
|---|---|---|
| Sea of Thieves (Rare, SIGGRAPH 2018 talk "The Technical Art of Sea of Thieves", Ang, Catling, Cifariello Ciardi and Kozin) | an FFT ocean (after Tessendorf), stylised; a real-time GPU surface fluid simulation for incidental water | [read, history.siggraph.org abstract] |
| | the local simulation follows Mei and others (2007), a shallow-water method | [search summary] |
| | how its ship wakes are made | NOT FOUND |
| Assassin's Creed IV: Black Flag (Ubisoft, 2013) | no talk or write-up on its ocean or wakes found in two searches | NOT FOUND |
| Crest (Wave Harmonic; open source, Unity) | animated Gerstner or FFT waves plus a **multi-resolution dynamic wave simulation**: one simulation per level of detail, results "accumulated up the LOD chain"; parameters: Simulation Frequency (60 per second), Damping (0.05, "limits how far ripples will propagate"), Courant Number (0.7), Gravity Multiplier ("dynamic waves travel faster"); boats push the water through `ObjectWaterInteraction` and `SphereWaterInteraction` (a sphere's submergence; spheres combine into hulls); a separate foam simulation deposits foam where waves pinch | [read, Crest 4.11 manual] |
| | the equation each level solves and whether its wave speed follows the level's wavelength | NOT FOUND (the shader's path guessed on GitHub returned 404); [bet: a 2D wave equation per level, so dispersion only in steps between levels] |
| Uncharted 3 and 4 (Naughty Dog) | wave particles for local high-frequency ocean waves (3) and rivers (4) | [read in two lists; section 1.4] |
| Atlas (GDC 2019, "Wakes, Explosions and Lighting: Interactive Water Simulation in Atlas") | wakes and explosions as interactive features on a Tessendorf FFT ocean; the slides (gpuopen.com PDF) not opened | title [read in a blog's list]; content [search summary] |
| World of Warships (SIGGRAPH 2016 talk), War Thunder (2015), Call of Duty: WWII (2018) | listed as ocean talks; not opened | [read in `water-resources`] |
| eWave in a game engine (`som1990/eWave`, a thesis project) | Tessendorf's eWave on a 512 x 512 patch in Unreal Engine 4: 0.6 to 0.8 ms for the compute shader; on a CPU with 4 threads eWave ran above 15 fps where Surface Wavelets ran below 1 fps in the same setup; waves from moving objects (faster objects make more waves; still ones only reflect); obstacles from signed distance fields | [read, README] |
| eWave in a browser (`ocean4-live`) | an FFT sea and an eWave wake, 512 x 512, WebGL2, in one 35 KB HTML file | [read, README and source] |
| **Thin-ship wakes in a game engine (Chan, Liège, 2025)** | "Implementation of Physically Based Wake Simulation for Planing and Semi-Planing Yachts using Niagara VFX" (Unreal Engine 5): far field by semi-analytical integrals reproducing Kelvin's pattern, **Michell's thin-ship theory with the hull's geometry for a straight course, Stoker's influence-point model for an arbitrary curved path**; near field from interpolated empirical profiles; Savitsky for planing; results normalised for display; agrees with classical Kelvin patterns, the apparent angle narrowing as the Froude number rises; the singular behaviour on the cusp lines still needs work; GPU at least ten times faster than a Python version; no frame rate given | [read, thesis abstract on matheo.uliege.be; the 67 MB PDF not opened] |

What game practice shows [bet]: shipped games put an FFT or Gerstner sea under a local, usually non-dispersive height-field simulation and add foam; none of the talks I could read claims a computed Kelvin wake. The computed Kelvin wakes in real time that I found are all recent and all small projects: eWave on a GPU or in a browser (above) and Chan's thin-ship wake.

## 2. Titanic (1997): the ocean and the wake

Main source: Cinefex 72 (December 1997), read as the text layer of the archive.org scan (`cinefex-021`, file `Cinefex-072_djvu.txt`, 368,000 characters, read in four chunks). It holds Don Shay's "Back to Titanic" on Digital Domain's work and a survey of the other sixteen companies' shots. "Read" below means read in that text through the fetch tool, which paraphrases; the short quotes were asked for verbatim.

| What | Finding | Tag |
|---|---|---|
| The decision | Digital Domain used **computer-generated water for nearly all shots of the Titanic at sea**, to avoid the problems of scale that come with models photographed on real water. Legato rejected a big model in real water (as on The Abyss): slow motion would have ruined 30 to 40 second shots | [read, Cinefex 72] |
| Why it was possible | Legato: Waterworld (1995) showed CG water was "on the cusp"; a test film convinced the production | [read, Cinefex 72] |
| The software | **Areté Image Software's ocean**, the package that had made Waterworld's digital water; strong on wind-driven open sea, but with no object-water interaction, no reflections, no mattes and no controllable sky. About four months to customise; Digital Domain wrote its own front end (with Prisms) rather than build an ocean of its own | [read, Cinefex 72] |
| How Areté's ocean rendered | no geometry: no polygons or patches are made in rendering, so the waterline against the hull and the spray had to be derived from the renders; "cards" let objects such as the ship reflect, and "sky domes" set the sky and cloud reflections | [read, Cinefex 72] |
| **The wake** | texture maps of "wakes and white water coming off the bow and sides of the Titanic", **photographed for the purpose on an actual ship at sea**, laid on the CG sea | [read, Cinefex 72] |
| **The bow wave** | Areté supplied "a mechanism for producing the actual wake shape" off a ship's bow, which had to change with the hull's shape and the ship's speed | [read, Cinefex 72]; how it worked: NOT FOUND |
| The real ship | one day off Southern California aboard the **Lane Victory**, a restored Second World War merchant ship whose bow and stern wakes resembled the Titanic's, filmed from a large crane; the wake imagery was to be "mapped onto the digital ocean". No speed given | [read, Cinefex 72] |
| A plate kept whole | Pacific Title's wide high-angle day shot: Digital Domain's CG Titanic laid over the Lane Victory, "retaining the wake and water from the original plate"; smoke compressed or stretched to fit ship and wake | [read, Cinefex 72] |
| A third screw | Composite Image Systems built her **triple-screw wake by doubling the Lane Victory's twin-screw wake, offsetting it and blending in a third, central wake**; it also graded day water to night; its stern shots used Lane Victory sea shot from three angles off Catalina | [read, Cinefex 72] |
| A borrowed wake | Hammerhead replaced a battleship in a helicopter plate (from Under Siege) with a Digital Domain still of the Titanic and reshaped the warship's bow wake into a knife-edged one | [read, Cinefex 72] |
| The passes | ocean texture, "ocean radiance" (surface with ship and sky reflections), glitter, the wake and white-water maps, and bow spray from Prisms, each a separate pass for the compositors | [read, Cinefex 72] |
| Render times | about 40 minutes a frame looking straight down; 3.5 to 4 hours a frame with the horizon high in frame; a ship matte skipped the ocean behind her | [read, Cinefex 72] |
| **The night sea** | Areté's software did badly at very low wind speeds, so the calm night ocean was a **custom shader written in-house by Jim Rothrock, running in RenderMan**, tuned shot by shot rather than derived from physics | [read, Cinefex 72] |
| The model | the 44-foot, 1/20 model, the only complete ship, was surrounded with digital water for the reveal at sea and for Southampton; a separate, larger model was built for real-water scenes of the foundering | [read, Cinefex 72]; the larger model's scale not checked |
| The screws | Digital Domain animated cavitation on CG propellers with Prisms and the Areté water ("a compromise" between real cavitation and the director's wishes); Pacific Ocean Post added cavitation to plate propellers with over 100,000 Dynamation particles | [read, Cinefex 72] |
| The berg | Light Matters added CG highlights, reflections, foam and spray to Digital Domain's water at the iceberg | [read, Cinefex 72] |
| People | Rob Legato (visual effects supervisor), Judith Crow and Mark Lasoff (digital effects supervisors; Crow on the ocean, Lasoff mainly the digital people), Bill Spitzak (CG technical supervisor, placing the digital ocean) | [read, Cinefex 72] |
| Tessendorf | "In 1994 Dr. Tessendorf began the development of the first software package to generate highly realistic oceanscapes" for films; used in Waterworld, Devil's Advocate, 20,000 Leagues Under the Sea, What Dreams May Come, and "extensively in Titanic" (his SIGGRAPH biography, written while he was at Cinesite) | [read, history.siggraph.org] |
| RenderWorld | Tessendorf's own gallery page describes RenderWorld as a simulator and renderer of oceans, clouds, atmospheres and land, and lists Waterworld and Titanic among the productions that used it | [read, jtessen.people.clemson.edu/RWgallery] |
| Areté = RenderWorld = Tessendorf's package | each source names one or two of the three; none names all three | [bet, strong] |
| The Academy award | 2008 (80th Sci-Tech awards): a Technical Achievement Award to Jonathan Cohen, Jerry Tessendorf, Jeroen Molemaker and Michael Kowalski "for the development of the system of fluid dynamics tools at Rhythm & Hues". It is for Rhythm & Hues' fluids, not the ocean. In the same year Digital Domain's fluid simulation system (Doug Roble, Nafees Bin Zafar, Ryo Sakaguchi) and ILM's (Nick Rasmussen, Ron Fedkiw, Frank Losasso Petterson) won Scientific and Engineering Awards for large-scale water | [read, oscars.org] |
| American Cinematographer, December 1997 | not opened | NOT FOUND |

**So, of the film's wake** [read, with the reading marked]: the open sea in nearly every shot of the ship under way was computed (Areté's ocean, rendered without geometry; that it was Tessendorf's spectral method is the strong bet above, not a reading); the white water and the wake's texture were photographed off a real ship and mapped on; the bow wave's shape came from a procedure in Areté's package that depended on hull and speed; a third screw's wake was made by doubling and blending a twin-screw ship's; the calm night sea was a hand-tuned RenderMan shader. Nothing in the article describes a wake computed from the ship's motion, and every shot was rendered offline, shot by shot.

## 3. Other films and papers that computed a ship's wake

| Work | What was computed | Tag |
|---|---|---|
| Goss, "A real time particle system for display of ship wakes", IEEE CG&A 10(3):30-35, May 1990 | a particle system for ship wakes in real-time simulators, aimed at wakes that looked wrong in manoeuvres and speed changes; at least 10 frames a second on a Silicon Graphics 4D/60T with a compute server; it cites Walker's 1988 Scientific American column on boat wakes | [search summary]; paper not opened |
| Khan, "A Simple Model of Ship Wakes", MSc thesis, University of British Columbia, 1994 (supervisor Alain Fournier) | a kinematic wake on an arbitrary course: circular waves radiated from points along the ship's path, superposed on a height field; "resembles" Kelvin's stationary-phase construction (curves of constant phase from point impulses integrated over the course) but gives up exactness for any path; the hull is ignored; path as piecewise cubics; circles drawn by a Bresenham-style algorithm. Self-described as "ad hoc" but efficient. Not online (hardcopy, 53 pages) | [read, UBC thesis page] |
| Glassner, "Duck!" (IEEE CG&A notebook column) | NOT FOUND in one search | NOT FOUND |
| Tessendorf, "Fast Wake Algorithm Derivation", 2000 | boat wakes in the FFT ocean from the linearised equations with a moving source (section 1.1) | [read: title, date, description]; content [search summary] |
| Waterworld (1995) | Areté Image Software made the digital water; Tessendorf's package was used in it | [read, Cinefex 72; read, SIGGRAPH biography]; how its boats' wakes were made: NOT FOUND |
| Titanic (1997) | computed open sea (Areté); photographed wake and white-water textures; a procedural bow-wave shape; composited plate wakes (section 2) | [read, Cinefex 72] |
| The Perfect Storm (2000, ILM) | physics-based 3D fluid simulation on a custom system, from a random wave field with wind; 20 ocean types as "digital stock footage"; 2D height fields for rolling sea, full 3D for breaking waves and water on deck; boats driven by expression-based dynamics (buoyancy, propulsion, drag, the water's motion); **wakes were particle sprays**, each particle multiplied into hundreds; crest foam up to about 4 billion particles a wave; about 250 of 340 shots had digital water; 435 SGI processors | [read, Computer Graphics World, July 2000] |
| Poseidon (2006, ILM) | PhysBAM inside ILM's Zeno: a particle level set on a uniform grid, with spray and bubble particles where the surface cannot be resolved, vortex particles against numerical viscosity; a 150 ft wave against a ship over 1,100 ft long; no wake or bow wave mentioned | [read, fxguide] |
| Battleship (2012, ILM, with Scanline) | base sims of about 5 million cells per section of ocean with the ship's geometry colliding as it moved, a FLIP-style particle layer (up to about 20 million) for detail on the hulls, adaptive secondary grids, mist up to half a billion to a billion particles, air simulated around splashes (Plume); how the destroyers' wakes were made is not described | [read, fxguide] |
| Academy awards for film water, 2008 | Scientific and Engineering Awards to Digital Domain's fluid simulation system and to ILM's (PhysBAM in Zeno), both for large-scale water; Tessendorf's Technical Achievement Award for Rhythm & Hues' fluid tools | [read, oscars.org] |
| Skrivan and others, "Wave Curves" (Weta, 2020) | Lagrangian water waves on dynamically deforming surfaces; listed in a search, not opened | [search result title only] |
| Chan (Liège, 2025) | Michell thin-ship far field plus Stoker influence points for curved paths in Unreal Engine 5 (section 1.10) | [read, abstract] |

The pattern [bet]: film water went from a computed open sea with photographed wakes (Titanic) to particle wakes on simulated seas (The Perfect Storm) to full 3D simulation around hulls (Poseidon, Battleship), always offline and shot by shot. A wake computed live from a ship model's own motion belongs to the simulator and game line (Goss, Khan, eWave, packets, Chan), not to film.

## 4. Conflicts

1. **The v1 brainstorm's Real-Time Live citation.** v1 (section 4, row B) cites the 2017 SIGGRAPH Real-Time Live entry "Large-scale interactive water simulation with directional waves" as wave packets shown live "with a thousand boats". Its title's "directional waves" fits the amplitude-per-direction method of Water Surface Wavelets (published 2018 with NVIDIA co-authors) better than packets. I did not open that PDF. [bet: it was the wavelets work's preview; the boat count is unchecked]. The one boat count I read is Yuksel's 1,681 wave-particle boats at 4.8 fps (2007).
2. **v1 section 7 on the film.** Confirmed and refined: the Lane Victory plate kept under the CG ship was one wide day shot (Pacific Title's); the general method was Areté's CG sea plus wake and white-water textures photographed off the Lane Victory, which v1 did not have. v1's "[B: Arete's, from memory]" is now a reading.
3. **iWave's speed.** Canabal and others say it "considerably underestimates wave propagation velocity" [search summary]; my computation on the kernel as coded gives phase speeds 3 to 8 times deep water's at long wavelengths. Both hold: the group speed (how fast a disturbance spreads) is too low beyond about 50 cells per wavelength, while the phase speed is too high. Which one a reader means depends also on how g and dx are scaled, which implementations tune by eye.
4. **The course's title.** Commonly cited as "Simulating Ocean Water"; Tessendorf's own reports page lists it as "Simulating Ocean Surface". Same notes.
5. **Wave particles and dispersion.** The 2007 design (from memory) has none; the dissertation (2010) has a section titled for dispersion [search summary], so it may add some. Unresolved.
6. **The Water Surface Wavelets reference code** carries a comment on its group-speed line, "the 3 should not be here !!!" [read]: the public implementation has a fudge factor. The paper, not that code, is the authority on the method; I could not read the paper.
7. **"Exact for any time step"** (ocean4-live's README) is true of the Fourier step; the real-space mask applied each step for the post, and the edge trim, are not exact [derived].

## 5. NOT FOUND

- Water Wave Packets: the paper's boat emission rule (the press release says only that a wake theory picks the visually dominant waves), the rendering method, the packet counts and the timings. The PDF is over the tool's size limit and ACM refused.
- Water Surface Wavelets: how a boat sources amplitude; grid sizes and timings in the paper.
- iWave: the chapter's own text (examples' grid sizes, dt and alpha).
- eWave: the note's own formulas, and the definitions of its real-space kernels C, S and T.
- "Fast Wake Algorithm Derivation" (2000): its algorithm beyond its starting point.
- Areté's bow-wave mechanism: Cinefex says it existed and depended on hull and speed, not how it worked.
- The Lane Victory's speed during the wake shoot.
- American Cinematographer, December 1997; VFX HQ's Titanic page (refused).
- Wave particles: the paper's rules as written (memory only).
- Dispersion Kernels: the kernel formula, window sizes and cost.
- Fundamental Solutions: the ripple's formula, the discretisation and cost.
- Generalizing Shallow Water (2023): cost and timings.
- Crest: the equation of its dynamic waves and whether each level's speed follows dispersion.
- Sea of Thieves's ship wakes; anything on Assassin's Creed IV: Black Flag's ocean or wakes.
- Glassner's "Duck!" column.
- Whether Tessendorf's Academy award had anything to do with ocean rendering: it did not (it is for Rhythm & Hues' fluid tools); no award for Areté's ocean software was found.

## 6. For the model

### 6.1 The run-time methods against what the model needs

Inputs the model has (v1 section 3.3): position, heading, surge u, sway v, yaw rate r, rudder angle, shaft speeds; and her hull as `C.halfBreadth(x, z)`. "Yes" in the last seven columns means the method does it from its own equations. JS = the solver in plain JavaScript on a CPU (the GPU only for drawing).

| Method | Needs from the ship model | Cost per step, in its own terms | Deep-water dispersion | Kelvin wedge unprompted | Bow-stern interference | Curved track | Waves overtake her when she stops | Reflection off the berg | JS |
|---|---|---|---|---|---|---|---|---|---|
| Today's construction (`site/visuals.js`) | samples of position, heading, speed every 0.5 s | one point per crest sample | yes, by construction | yes: the placement is Kelvin's construction | no | yes | yes | no | yes (exists) |
| Sum of exact ripples from her past track (Khan 1994 made exact; the closed-form ripple of Schreck 2019) | track samples; a source strength per sample (or a line of them along the hull) | samples x surface points (600 samples x 256^2 points = 39 million ripple evaluations) [derived] | yes | yes | only with a line of sources along the hull | yes | yes | no | yes, at low resolution [bet] |
| Thin-ship spectrum on a path (v1's method A; Chan 2025: Michell plus Stoker's influence points) | the hull once per speed (a table of A(theta)); the track | a table lookup per point | yes | yes | yes (Michell's A(theta) holds both ends) | yes (influence points) [read in Chan's abstract] | partly: steady theory per point [bet] | no | yes |
| Fourier wake: eWave with a moving pressure footprint (Tessendorf's 2000 wake note, 2014 eWave) | the waterplane's footprint as a pressure at her position and heading each step (it follows her trim and sinkage); her velocity if the window follows her | per step: N^2 complex rotations and one forward FFT of her footprint (it moves and turns); per drawn frame: inverse FFTs of the height and its two slopes; one 2D FFT is about 23.6 Mflop at N = 512 [derived]; 0.6-0.8 ms on a GPU at 512^2 [read, som1990] | yes, exact for every mode on the grid, any dt | yes | yes (the footprint is the whole hull) | yes | yes | no in Fourier space; a real-space mask each step approximates it (ocean4-live) | yes [bet: a 512^2 FFT pair is tens of milliseconds in a worker] |
| iWave | obstruction footprint `o` and source `s = 1 - o` | 169 multiply-adds per cell (44 million at 512^2) | **no** (S/kappa from 43 to 0.24; section 1.2) | **no**: the angle depends on dx and speed | wavelengths wrong | yes | partly: long waves stand | yes (the mask) | yes, heavy |
| Wave particles | the hull's change of displaced volume each step | per particle, plus a splat and a filter | **no**: one speed for all [bet] | **no**: a Mach cone, `asin(c / U)` | no (no phase) | yes | yes | yes | yes |
| Wave packets (Jeschke and Wojtan 2017) | position, heading, the water's velocity past each source station (u, v + r x), and an energy per direction (from A(theta)) | per packet per step, constant work; drawing is a splat of `envelope x crest` per packet (the authors' sandbox draws them with a Direct3D shader) | yes (each packet its own k; exact group speed; capillary and finite depth in the code) | yes, from group-speed transport of the emitted waves | yes: each packet carries its phase | yes | yes | yes: specular reflection and diffraction in the sandbox | yes |
| Water Surface Wavelets (2018) | amplitude per direction and wavenumber put in at the hull | semi-Lagrangian advection of `n_x^2 x n_theta x n_zeta` cells (for example 256^2 x 16 x 8 = 8.4 million) [derived] | yes | yes [bet] | no: amplitudes, phase from position only [bet] | yes | yes | yes (level set) | possible, heavy: below 1 fps on 4 CPU threads in one test [read, som1990] |
| Dispersion kernels (2016) | obstacle mask, sources | one convolution per cell with compact "pyramid" kernels; sizes NOT FOUND | yes (built for it) | yes [bet] | yes | yes | yes | yes (shadowed convolution) | possible [bet] |
| Shallow water or a plain wave equation (game water; Crest's dynamic waves per level [bet]) | footprint forces | a 5-point stencil per cell | no | no (a Mach wedge) | no | yes | yes | yes | yes |
| CFD (FluidX3D, offline) | the hull as STL | hours a run | yes | yes | yes | yes | yes | yes | no |

Two readings [bet]:
- **The shortest road to a correct far wake is the Fourier wake**: exact dispersion, the whole hull as the source (so the interference along her length is not a separate model), turns, slowing, stopping and going astern with no special case, a fixed cost per step, and deterministic in JS (a fixed-order FFT). Its gap is the berg; its edges need an absorbing margin or an earth-fixed window larger than the scene (a 2 km window at 4 m is 512^2).
- **Packets are the road if the berg's reflection and an unbounded sea matter more than simplicity**; they need the emission rule below and a GPU splat to draw. iWave and wave particles are out for her far wake: neither has deep-water dispersion.

### 6.2 iWave and eWave, to type in

**iWave** (the kernel and step as coded in `sdao/iWaveOcean` after the chapter; the closed form and the dx are mine):

```
// kernel, once: sigma = 1, P = 6 (13 x 13), dq = 0.001
G0 = sum over q = 0, dq, 2 dq, ... < 10 of  q^2 exp(-sigma q^2)
for i, j in -P..P:
    r = sqrt(i*i + j*j)                       // in cells
    G[i][j] = (1 / G0) * sum over the same q of  q^2 exp(-sigma q^2) J0(q r)
// closed form of the same: G = exp(-r^2 / (4 sigma)) * M(-1/2, 1, r^2 / (4 sigma))   (M = Kummer's function)
// G(0) = 1, G(1) = 0.678, G(sqrt 2) = 0.445, G(2) = 0.156, G(3) = -0.065, G(6) = -0.0150   (sigma = 1)

// each step
for every cell:  h *= o                       // o = obstruction, 0 inside a body, 1 in open water
v  = convolution of h with G (13 x 13)
hn = ((2 - alpha dt) h - hprev - (g dt^2 / dx) v) / (1 + alpha dt)
hn += s                                       // s = sources; the chapter's moving body: s = 1 - o
hn *= o
hprev = h;  h = hn
// stability: g dt^2 * 6.27 / dx <= 4;  the 13 x 13 window's sum is 2.10 (long waves stand);
// the axis Nyquist mode has S = -0.087 (grows unless alpha holds it)
```

**eWave** (each Fourier mode k, |k| = k; state H(k), P(k) = transforms of height and surface potential; the two update lines are the ones in ocean4-live's shader; the source and k = 0 lines are mine):

```
w = sqrt(g k)                                 // deep water; with depth: sqrt(g k tanh(k d))
c = cos(w dt);  s = sin(w dt)
Hn = c H + (k / w) s P   - (Ps(k) / (rho g)) (1 - c)
Pn = c P - (g / w) s H   - (Ps(k) / rho) (s / w)
// Ps(k) = transform of the surface pressure p(x, y) held over the step (her footprint, below)
// k = 0:  Hn = H;  Pn = P - g dt H - (Ps(0) / rho) dt      (limits of the lines above)
// a current U through the grid: Hn *= exp(-i k.U dt);  Pn *= exp(-i k.U dt)
// a grid that follows the ship at velocity V is the same with U = -V: multiply by exp(+i k.V dt)
// height for drawing: inverse FFT of H; slopes: inverse FFT of i k H
```

The footprint [bet]: a pressure `p(x, y) = rho g T(x, y)`, T the hull's local draught over her waterplane, smoothed over a cell or two, at her position and heading each step. At rest it holds the surface down by T, as a hull does; under way it makes her waves; after the ice, her trim and sinkage change T and so her wake, with no special case.

### 6.3 A wave packet, and an emission rule for a moving ship

**What a packet is** (the authors' code, `Packets.h`/`Packets.cpp` [read]): a piece of crest between two vertices (`pos1`, `pos2`; a third for diffraction), each moving at the group speed of the packet's wavenumber along its own direction; a wavenumber band (`k_L`, `k_H`) with a representative `k` and `w0 = sqrt((g + k^2 sigma / rho) k tanh(k d))`; an energy `E`; an `envelope` length (3 wavelengths); a `phase` that advances by `(c_phase - c_group) k dt`. Its amplitude is `a = sqrt(E / (envelope |pos2 - pos1| 0.5 (rho g + sigma k^2)))`, capped at `0.07 x 2 pi / k`. It splits when its crest grows longer than its envelope, when its ends' directions differ by more than 18 degrees, or when its band has dispersed by 0.3 envelope; energy is shared in the split. The sandbox makes packets only from circular, linear and spreading wavefronts placed by hand; its envelope is capped at 10 m, which her waves would need raised to a few hundred.

**The paper's own boat rule: NOT FOUND.** The press release says a wake theory picks the waves that dominate visually and skips the rest [read, ISTA news].

**A rule from Kelvin's theory** [derived; textbook stationary-wave conditions], one way to emit packets so that her far wake comes out right and its height comes from her hull:

```
every emission interval dt_e, for each source station s (bow and stern at least; better, stations along the hull):
    W   = velocity of the water past s, in the ship's frame = -(u, v + r x_s)      // the turn enters here
    U_s = |W|;  beta = direction of -W (the way the station moves through the water)
    for each direction theta_j in a fan over (-90, 90) degrees about beta (denser near +-35.26 degrees, the cusp):
        k_j   = g / (U_s^2 cos^2 theta_j)              // stationary: phase speed = U_s cos theta_j
        w_j   = sqrt(g k_j);  c_g = U_s cos(theta_j) / 2
        emit a spreading packet at s: its two vertices leave at theta_j -+ dtheta_j / 2 from beta,
            band [k(theta_j - dtheta_j/2), k(theta_j + dtheta_j/2)], envelope ~3 x 2 pi / k_j,
            phase = arg A_s(theta_j) - w_j t + k_j (d_j . X_s)   // continuous with the last packet; A carries the bow-stern phase
            E     = P_s(theta_j) dtheta_j dt_e                   // power into the band
    with sum over s and j of P_s(theta_j) dtheta_j = R_w U        // her wave-making power: wave resistance x speed
    and P_s(theta) shaped by Havelock's |A(theta)|^2 cos^3(theta) weighting (v1 section 3.1; constants still a bet)
```

What follows from it [derived]: each packet keeps its own k and group speed after it leaves, so a change of speed changes only the new packets (the turn's history shows as a change of texture, v1 section 3.3), a stop ends the emission and the packets already out pass her, and the berg reflects them. The wedge is not put in: it is where packets moving at half their phase speed end up. The emission interval can be long, because a packet stands for a group several wavelengths long: consecutive packets of one direction overlap if `dt_e` is under about half the envelope over their speed relative to her, about 20 s for the transverse waves at 22.5 kn (envelope 257 m, falling behind her at 5.8 m/s) and about 1.4 s for the divergent waves at 70 degrees (10 m long, envelope 30 m, 11 m/s). Signs: `motion.js` works in MMG's frame (y to starboard) and the core in y to port; the rule must be written in one of them, through the mapping at the top of `motion.js`. With 16 directions, two stations and splitting by crest as they spread, a 3 km window holds thousands to tens of thousands of packets [derived, rough].

### 6.4 What the 1997 film did for its wake, in five lines

1. The sea around the ship under way was computed: Areté Image Software's ocean, customised for four months, rendered with no geometry, 40 minutes to 4 hours a frame [read, Cinefex 72].
2. The wake and the white water were not computed: texture maps photographed for the purpose from the Lane Victory (one day off Southern California, from a crane) were mapped onto that sea [read].
3. The bow wave's shape came from a procedure in Areté's package that varied with hull and speed; how it worked is NOT FOUND [read that it existed].
4. Plates were reworked by hand: a twin-screw wake doubled and blended into her triple-screw one, and one wide shot kept the Lane Victory's own wake under the CG ship [read].
5. The calm night sea was a hand-tuned RenderMan shader by Jim Rothrock; all of it offline, shot by shot. That Areté's ocean was Tessendorf's RenderWorld is a strong bet, not a reading [read; bet].

### 6.5 Every remaining bet

1. Areté Image Software's ocean was RenderWorld, Tessendorf's spectral package (each of three sources names only part of the chain).
2. Wave particles: one speed for all, no dispersion, splitting in three (memory of the 2007 paper; the dissertation may add dispersion).
3. Crest's dynamic waves are a wave equation per level of detail.
4. The 2017 Real-Time Live demonstration cited by v1 was the wavelet work, not packets.
5. The ship's footprint as a pressure `rho g T(x, y)` for the Fourier wake.
6. The constants of Michell's spectrum and Havelock's resistance integral (v1's own bet, unchanged), on which the packets' energies rest.
7. JS costs: a 512^2 FFT pair in tens of milliseconds in a worker; packets need the GPU to draw.
8. Water Surface Wavelets lose the bow-stern interference (amplitudes without phase).
9. The closed-form ripple of Schreck 2019 is the Cauchy-Poisson impulse response.
10. The dispersion-kernel method builds its kernel from the exact dispersion relation with pyramid compensation.
11. Tessendorf's 2000 wake note's algorithm is the eWave step with a moving source (section 1.1).
12. No shipped game computes a Kelvin wake (absence of evidence in what I could read).
13. iWave's negative Nyquist factor grows in practice (a property of the kernel; not run).
14. The emission rule of 6.3 (mine, from Kelvin's conditions) behaves as said: no one has run it on her.

## 7. Sources

**Opened and read** (through the fetch tool):
- Cinefex 72 (December 1997), text layer of the archive.org scan: https://archive.org/download/cinefex-021/Cinefex%20Magazine%20PDF/Cinefex-072_djvu.txt (served from dn710109.ca.archive.org), all four chunks.
- Tessendorf's SIGGRAPH biography: https://history.siggraph.org/?p=51993
- Tessendorf's pages: https://jtessen.people.clemson.edu/ ; https://jtessen.people.clemson.edu/reports/index.html ; https://jtessen.people.clemson.edu/RWgallery/index.html ; https://jtessen.people.clemson.edu/gilligan/html/00mainpage.html ; https://jtessen.people.clemson.edu/gilligan/html/04components.html
- Academy, 80th Scientific and Technical Awards: https://www.oscars.org/node/62196
- iWave implementation: https://github.com/sdao/iWaveOcean ; https://raw.githubusercontent.com/sdao/iWaveOcean/master/src/VerticalDerivativeConvolution.h ; https://raw.githubusercontent.com/sdao/iWaveOcean/master/src/Dynamics.cpp ; https://raw.githubusercontent.com/sdao/iWaveOcean/master/src/Simulator.cpp
- eWave implementations: https://github.com/CodeWithBehnam/ocean4-live and https://raw.githubusercontent.com/CodeWithBehnam/ocean4-live/main/index.html ; https://github.com/som1990/eWave
- Algis, Bramas, Darles and Aveneau, "Arc Blanc: a real time ocean simulation framework" (2025): https://arxiv.org/html/2503.03326
- Water Wave Packets: https://visualcomputing.ist.ac.at/publications/2017/WWP ; https://zenodo.org/record/525184 ; https://github.com/jeschke/water-wave-packets ; https://raw.githubusercontent.com/jeschke/water-wave-packets/master/SimpleSampleDirectXTK/Packets.h ; https://raw.githubusercontent.com/jeschke/water-wave-packets/master/SimpleSampleDirectXTK/Packets.cpp ; ISTA press release https://ista.ac.at/en/news/making-waves/
- Water Surface Wavelets: https://history.siggraph.org/?p=100753 ; https://github.com/lecopivo/WaterSurfaceWavelets ; https://raw.githubusercontent.com/lecopivo/WaterSurfaceWavelets/master/src/WaveGrid.cpp ; https://raw.githubusercontent.com/lecopivo/WaterSurfaceWavelets/master/src/ProfileBuffer.cpp
- Wave Particles: http://www.cemyuksel.com/research/waveparticles/ ; https://github.com/wave-harmonic/water-resources ; https://github.com/ACskyline/Wave-Particles-with-Interactive-Vortices ; https://github.com/alexpanter/WaveParticles (README only)
- Fundamental Solutions (2019): https://research-explorer.ista.ac.at/record/6442
- Dispersion Kernels (2016): https://history.siggraph.org/?p=210552
- Generalizing Shallow Water (2023): https://research-explorer.ista.ac.at/record/14240
- Crest 4.11 manual: https://crest.readthedocs.io/en/4.11/user/ocean-simulation.html
- Sea of Thieves talk: https://history.siggraph.org/?p=84316
- "Water in modern games" (blog with the Atlas talk's title): https://j111m.github.io/posts/Ocean
- Chan (2025), Liège thesis record: https://matheo.uliege.be/handle/2268.2/25042
- Khan (1994), UBC thesis page: https://www.cs.ubc.ca/labs/imager/th/1994/Khan1994
- fxguide on Battleship: https://www.fxguide.com/?p=32574 ; on Poseidon: https://www.fxguide.com/?p=21422
- Computer Graphics World, July 2000, "Sea Change" (The Perfect Storm): https://www.cgw.com/Publications/CGW/2000/Volume-23-Issue-7-July-2000-/Sea-Change.aspx
- This repository: `docs/BRAINSTORM_the_wake_computed_v1_2026-11-19.md` (read whole).

**Known only from search digests** (not opened, or opened as binary):
- Tessendorf, "Interactive Water Surfaces" (2004): https://jtessen.people.clemson.edu/reports/papers_files/Interactive_Water_Surfaces.pdf ; course slides 2004: https://jtessen.people.clemson.edu/reports/papers_files/course_slides2004.pdf ; course notes 2002 and 2004 (same folder, `coursenotes2002.pdf`, `coursenotes2004.pdf`)
- Tessendorf, "eWave: Using an Exponential Solver on the iWave Problem" (March 2014): https://jtessen.people.clemson.edu/reports/papers_files/ewavealgorithm.pdf
- Tessendorf, "Fast Wake Algorithm Derivation" (March 2000): https://jtessen.people.clemson.edu/reports/papers_files/waketheory.pdf
- Canabal and others (2016), PDF: https://core.ac.uk/download/80867844.pdf and https://gmrv.es/Publications/2016/CMTKPO16/main.pdf
- Yuksel, dissertation (2010): https://oaktrust.library.tamu.edu/bitstream/1969.1/ETD-TAMU-2010-08-8566/4/YUKSEL-DISSERTATION.pdf
- Goss (1990), IEEE CG&A 10(3):30-35, DOI 10.1109/38.55150 (listing at scilit.com)
- Atlas, GDC 2019: https://gpuopen.com/gdc-presentations/2019/gdc-2019-agtd6-interactive-water-simulation-in-atlas.pdf
- Water Wave Packets, author PDF (13 MB): https://pub.ista.ac.at/group_wojtan/projects/2017_Jeschke_WaterWavePackets/wavepackets_author.pdf
- Water Surface Wavelets PDF: https://pub.ista.ac.at/group_wojtan/projects/2018_Jeschke_WaterSurfaceWavelets/WaterSurfaceWavelets.pdf
- Weta, "Wave Curves" (2020): https://www.wetafx.co.nz/assets/Uploads/PDFs/2020-Wave-Curves-Simulating-Lagrangian-water-waves-on-dynamically-deforming-surfaces.pdf (title only)

**Computed this session:** the iWave kernel's values, window sum, dispersion factor S, group and phase speed ratios, anisotropy and Nyquist values, with one-line PowerShell commands (no file written), from the closed form `G = exp(-r^2/4) M(-1/2, 1, r^2/4)` summed by its series; the closed form was checked against a direct numerical sum of the coded kernel (dq = 0.01, J0 by its integral) at r = 1, 2, 3 and 6: they agree to five digits (0.67828, 0.15642, -0.06533, -0.01496).
