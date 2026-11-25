# Ship wave theory on read sources: Michell's integral, the free-wave spectrum, Havelock's formula, the Kelvin far field, unsteady courses, the bow wave, and the Olympic class (v1)

- **Written:** 2026-11-19, 14:13 to 14:43 CST, by a research subagent of the coordinating session (Claude Code desktop, Opus 5.5), for `docs/BRAINSTORM_the_wake_computed_v1_2026-11-19.md` sections 3.1 and 3.4, whose formulas were written from memory.
- **Method:** web search and WebFetch only (18 searches, 33 fetches). No browser pane; nothing downloaded on purpose; no other file in the repository touched; `core/core.js` was only `require`d, read-only, by two scratch scripts. Arithmetic in Node scripts under `C:\temp\titanic-wake-scratch\r8\` (`wigley_michell.js`, `wigley_sweep.js`, `entrance_angle.js`, `hull_coeffs.js`).
- **Refused or unreadable:** every PDF came back as compressed binary or scanned images: Tuck (1989), https://cambridge.org/core/services/aop-cambridge-core/content/view/6D0B69CE2AE6BDC1D06BA675F1C4DEDD/S0334270000006329a.pdf/... (scanned pages); the ANZIAM J. article https://journal.austms.org.au/ojs/index.php/ANZIAMJ/article/view/2885/1327; the IWWWFB abstract on a circular path, https://www.carmamaths.org/meetings/iwwwfb/accepted/abstract-0071.pdf (2019); the bow-wave review https://dcwan.sjtu.edu.cn/userfiles/2013-4%20Shipbowwaves.pdf. The fetch tool kept those binaries in its own tool-results folder by itself; I did not open them and fetched no other PDF. Lazauskas's Adelaide thesis front matter (digital.library.adelaide.edu.au, 2440/53216) returned only "DSpace". MDPI (JMSE 8(6):400) refused with HTTP 403. The National Academies OpenBook of the 24th Symposium on Naval Hydrodynamics (Tuck, Scullen and Lazauskas 2002, https://www.nationalacademies.org/read/10834/chapter/4) shows page images only, no text. The Wolfram demonstration "Kelvin Ship-Wave Pattern" returned its heading only. Not attempted: Newman (1977), Wehausen and Laitone (1960), Michell (1898), Lamb.
- **Tags:** [read] = in a page I opened, asked for the explicit formula or figure; [read, OCR] = in the OCR text of a scanned book, read faithfully but with garbled symbols; [read in X] = in a page I opened that quotes or compiles the original; [search summary] = only in a search digest; [textbook] = a standard result stated from memory, the book named; [derived] = my arithmetic or algebra, shown; [bet] = my judgement; NOT FOUND.
- **Tool caveat:** WebFetch passes each page through a small model. For every constant that matters I asked for the formula exactly as printed, twice for Boucher et al., Buttle et al., Pethiyagoda et al. (2014) and Stoker; the constants were then checked against each other numerically (1.5).
- **Quotes:** at most one short phrase per source, under 15 words; formulas are not quotes and are given in full.
- **Conventions:** the model's ship frame (`CLAUDE.md`): x forward from amidships, y to port; here z is up from the **waterline** (the core's z from the keel minus the draught), the ship moves toward +x at U through still water, her waves lie at x < 0. `k0 = g / U^2` (1/m), `lambda = sec theta`, theta the direction a wave travels measured from her course, positive to port. `Y(x, z)` the half-breadth. g = 9.80665 m/s2, rho = 1025 kg/m3. Her length 850 ft = 259.08 m between perpendiculars, so 22.5 kn (11.575 m/s) is Fn 0.2296. Each source's own convention is in 1.1.
- **Read with:** `docs/BRAINSTORM_the_wake_computed_v1_2026-11-19.md` (v1 of the wake brainstorm).

## 0. Summary

- **The brainstorm's recollection is right in form and lacked two things: the factor and the sign.** In the model's frame (ship toward +x, wake at x < 0, z up from the waterline):
  - spectrum: `A(theta) = -(2 k0 / pi) sec^3 theta * integral integral Y_x(x, z) exp(k0 z sec^2 theta) exp(i k0 x sec theta) dx dz` (metres);
  - far field: `zeta(x, y) = Re integral_{-pi/2}^{pi/2} A(theta) exp(-i k0 sec^2 theta (x cos theta + y sin theta)) dtheta`;
  - Havelock: `R = (pi/2) rho U^2 integral_{-pi/2}^{pi/2} |A|^2 cos^3 theta dtheta`;
  - Michell: `R = (4 rho g^2 / (pi U^2)) integral_1^inf |P + iQ|^2 lambda^2 / sqrt(lambda^2 - 1) dlambda`, with `P + iQ = integral integral Y_x exp(k0 lambda^2 z + i k0 lambda x) dx dz`.
- **Where each constant comes from.** The 2/pi is read twice, in Buttle et al. (arXiv 2205.01870, eq 12; thin ship) and in Pethiyagoda, McCue and Moroney (JFM 2014; a point source). The 4 rho g^2 / (pi U^2) is read in Boucher et al. (arXiv 1803.10695, eqs 9-10), and Peri's independent Michell code (arXiv 2610.14027) gives the same numbers. Havelock's pi/2 I derived from the energy flux. It is the only constant under which those sources agree, and the two forms agree to six digits numerically. The minus sign is derived (a reflection of Buttle's frame) and sets only the absolute phase.
- **Check table, the Wigley hull** (L/B = 10, B/T = 1.6, wetted surface 0.14879 L^2): Michell Cw x 10^3 = 0.785, 1.064, 0.976, 1.987, 1.832, 1.285, 3.030, 4.154 at Fn 0.211, 0.25, 0.267, 0.289, 0.316, 0.354, 0.408, 0.45. My code and Peri's agree on these. The tank (Kajitani 1983, via Peri) gives 0.273, 0.598, 1.471, 2.008 and 2.027 at 0.211, 0.25, 0.289, 0.316 and 0.354. So Michell is 1.35 to 2.9 times too high below Fn 0.3. No ratio for a full merchant hull was found.
- **Humps and hollows:** `Fn = sqrt(L_w / (N pi L))`, N odd a hump, N even a hollow [derived; L_w 0.85 to 0.95 L on the Wigley hull]. At 22.5 kn she lies between the 5th hump and the 6th hollow; her own Michell curve must decide.
- **Far field** [read: DLMF 36.13, Buttle, Stoker]: the wedge is arcsin(1/3) = 19.47 deg. Heights fall as r^(-1/2) inside the wedge and as r^(-1/3) on the cusp line (Airy form across it). The cusp waves travel at 35.26 deg with wavelength (2/3) 2 pi U^2 / g: 57.2 m at 22.5 kn, against 85.8 m for the transverse waves. Kelvin's crests are `x = -a cos psi (1 + sin^2 psi)`, `y = a sin psi cos^2 psi` [derived]. Wakes narrow only above Fn of about 0.5 on hull length (Rabaud and Moisy 2013) [read], so her full wedge stands at every speed.
- **Curved and unsteady courses** [read: Pethiyagoda et al. 2021, Stoker 1957]: every wave arrives at its group velocity from where it was made. It was made with phase speed equal to the rate at which she was closing on the point where it is seen. A steady circle at constant speed gives a pattern rigid with the ship, compressed inside the circle and stretched outside. Acceleration bends the V's edges toward the track. Deceleration cuts off the divergent waves, and after a stop the wake is mostly transverse and overtakes her. Caustics follow the Airy law.
- **Bow wave:** read in the abstract of Delhommeau et al. (JFM 2009), the boundary between steady overturning and unsteady bow waves is `F_D = 4.4 tan(alpha) / cos(alpha) - 1`, with `F_D = U / sqrt(g D)`. A bow finer than about 12.5 deg half-angle makes a steady bow wave at every speed (Noblesse et al. 2008) [read]. The height `Z_b = (U^2/g)(2.2/(1 + F_D)) tan(alpha)/cos(alpha)` remains the brainstorm's recollection [bet]. It is supported by meeting the Bernoulli limit `U^2/2g` exactly on the read boundary [derived]. With the simulator's own hull (entrance half-angle about 16.6 deg at the stem [derived from `core/core.js`]) it gives 4.4 m at 22.5 kn, and 3.05 m with the brainstorm's 12 deg.
- **The Olympic class:** no published entrance angle, prismatic coefficient, effective horsepower or wave-making share was found. The simulator's hull at 34 ft 7 in has CB 0.674, CP 0.692, CWP 0.774 and CM 0.974 [derived].

## 1. Michell's integral, the free-wave spectrum and Havelock's formula, as published

### 1.1 The sources' own conventions

| Source | Frame and flow | Where the hull and the fluid are | Hull function | Tag |
|---|---|---|---|---|
| Boucher, Labbé, Clanet and Benzaquen, "Thin or bulky: optimal aspect ratios for ship hulls", arXiv 1803.10695 (2018), appendix, eqs (9)-(10) | x along the length, x = 0 amidships, hull from x = -l/2 to l/2 | z from -d (keel) to 0 (free surface) | f(x) = w f~(x/l) with max f~ = 1/2: **f is the half-breadth** | [read] |
| Buttle, Pethiyagoda, Moroney, Winship, Macfarlane, Binns and McCue, "Mathematical models and time-frequency heat maps for surface gravity waves generated by thin ships", arXiv 2205.01870v3 (revised 17 Dec 2024), eqs (1)-(3), (12)-(13), (17), (21)-(25) | lengths scaled by L, ship speed 1; F = U / sqrt(g L); radiation condition phi ~ x as x -> -inf, and the wave term carries a Heaviside H(x): **the stream runs toward +x and the wake lies at x > 0**; the bow is at x = -1/2 | fluid z < 0, free surface z = 0, hull -delta < z < 0 | Y(x, z), the offset (half-breadth); Wigley: Y = (beta/2)(1 - z^2/delta^2)(1 - 4x^2) | [read] |
| Model convention (this note, section 9) | x forward from amidships, **ship moving toward +x at U through still water**, so the wake lies at x < 0 | z up from the waterline (the core's z from the keel minus the draught) | Y(x, z) half-breadth, from `C.halfBreadth` | - |

Two traps in the sources' notation:
- Buttle and others write `k0 = sec^2(psi) / F^2`, the wavenumber **in direction psi** (dimensionless). The brainstorm and this note write `k0 = g / U^2`, the wavenumber of the transverse wave. Theirs is `k0 sec^2 theta` in ours.
- Boucher and others write the integrand with `f` (the half-breadth itself) and a factor `lambda^2 / Fr^2`; Buttle's eq (12) and the classical form use `Y_x` (the slope). The two are the same by one integration by parts in x when Y = 0 at both ends (no transom) [derived below].

### 1.2 Michell's integral (wave resistance of a thin ship)

| Quantity | Formula, as published | Source | Tag |
|---|---|---|---|
| Michell's integral (Boucher et al. eq 9) | `R_w = [4 rho U^2 / (pi l^4 Fr^4)] * integral_1^inf |I_f(lambda, Fr)|^2 / sqrt(lambda^2 - 1) dlambda` | arXiv 1803.10695, appendix; they cite Michell (1898) and Tuck (1989) | [read] |
| its kernel (eq 10) | `I_f(lambda, Fr) = (lambda^2 / Fr^2) * integral_{-d}^{0} dz integral_{-l/2}^{l/2} f(x) exp(lambda^2 z / (l Fr^2)) exp(i lambda x / (l Fr^2)) dx`, Fr = U / sqrt(g l) | same | [read] |
| the same, dimensional, with k0 = g/U^2 (note `1/(l Fr^2) = k0`, `l^4 Fr^4 = l^2 U^4 / g^2`) | `R = (4 rho g^4 / (pi U^6)) * integral_1^inf lambda^4 / sqrt(lambda^2 - 1) * | integral integral Y(x,z) exp(k0 lambda^2 z + i k0 lambda x) dx dz |^2 dlambda` | from the row above | [derived] |
| the classical slope form (integrate by parts in x: `integral Y e^{i k0 lambda x} dx = (i / (k0 lambda)) integral Y_x e^{i k0 lambda x} dx` when Y = 0 at the ends) | `R = (4 rho g^2 / (pi U^2)) * integral_1^inf (P^2 + Q^2) lambda^2 / sqrt(lambda^2 - 1) dlambda`, with `P + iQ = integral_{-L/2}^{L/2} integral_{-T}^{0} Y_x(x, z) exp(k0 lambda^2 z) exp(i k0 lambda x) dz dx`, lambda = sec(theta) | from the row above; it is also the form Buttle et al. eq (13) integrate back from | [derived], checked numerically (1.5) |
| Buttle et al.'s P and Q (eq 13), for a hull whose offset at the stern end x = 1/2 is not zero (a transom), dimensionless | `P(psi) = integral_{-1/2}^{1/2} [integral_{-delta}^{0} Y exp(z sec^2 psi / F^2) dz] cos(x sec psi / F^2) dx - F^2 cos(psi) sin(sec psi / (2F^2)) integral_{-delta}^{0} Y(1/2, z) exp(z sec^2 psi / F^2) dz`; `Q(psi) = integral [ ... ] sin(x sec psi / F^2) dx + F^2 cos(psi) cos(sec psi / (2F^2)) integral_{-delta}^{0} Y(1/2, z) exp(z sec^2 psi / F^2) dz` | arXiv 2205.01870v3 eq (13) | [read] |

The sign of `i` in the x exponent and the direction of x do not change R (only |P + iQ| enters). Neither does the side of the centreplane: Y is the half-breadth, and the factor 4 already counts both sides.

### 1.3 The free-wave spectrum (amplitude function) and the far field

| Quantity | Formula, as published | Source | Tag |
|---|---|---|---|
| far field, dimensionless, x > 0 behind (Buttle eq 1) | `zeta(x, y) ~ integral_{-pi/2}^{pi/2} A(psi) exp(-i k0 (x cos psi + y sin psi)) dpsi`, with their `k0 = sec^2 psi / F^2` (eq 2) | arXiv 2205.01870v3 | [read]. Eq (1) is printed without "Re"; their stationary-phase results (eqs 22-25) take the real part, so the elevation is the real part [read] |
| Michell amplitude (Buttle eq 12) | `A_M(psi) = (2 sec^3 psi / (pi F^2)) * integral_{-1/2}^{1/2} integral_{-delta}^{0} Y_x(x, z) exp(z sec^2 psi / F^2) exp(i x sec psi / F^2) dz dx` | same; they cite Michell (1898), Tuck (1989), Tuck et al. (2001) | [read] |
| after integration by parts (eq 13) | `A_M(psi) = -(2i / (pi F^4)) sec^4 psi (P(psi) + i Q(psi))` | same | [read] |
| Hogner amplitude (eq 16): sources on the hull, not the centreplane | `A_H = (2 sec^3 psi / (pi F^2)) integral integral Y_x exp(z sec^2 psi / F^2) exp(i x sec psi / F^2) cos(sec psi tan psi Y(x, z) / F^2) dz dx` | same | [read] |
| Michell amplitude, dimensional, **in Buttle's frame** (stream toward +x, bow at -L/2, wake x > 0); multiply A_M by L, write x, z, Y in metres, `1/F^2 = k0 L` | `A(theta) = (2 k0 / pi) sec^3 theta * integral integral Y_x exp(k0 z sec^2 theta) exp(i k0 x sec theta) dz dx` (metres), `zeta = Re integral A exp(-i k0 sec^2 theta (x cos theta + y sin theta)) dtheta` | from the rows above | [derived] |
| the same **in the model's frame** (ship toward +x, bow at +L/2, wake x < 0): reflect x -> -x (so `Y_x -> -Y_x`), rename theta -> -theta, take the complex conjugate inside Re | `A(theta) = -(2 k0 / pi) sec^3 theta * integral_{-L/2}^{L/2} integral_{-T}^{0} Y_x(x, z) exp(k0 z sec^2 theta) exp(+i k0 x sec theta) dz dx`, `zeta(x, y) ~ Re integral_{-pi/2}^{pi/2} A(theta) exp(-i k0 sec^2 theta (x cos theta + y sin theta)) dtheta` far behind | from the rows above | [derived]. The minus sign makes the bow (where Y_x < 0 in this frame) a source, as it must be: the thin-ship source density is `sigma = -2 U Y_x` in this frame [derived from the hull condition `v = -U Y_x` on y = 0+] |
| in terms of the source density | `A(theta) = (k0 / (pi U)) sec^3 theta * integral integral sigma(x, z) exp(k0 z sec^2 theta + i k0 x sec theta) dz dx`, both frames | from the rows above | [derived] |

What the spectrum says about the pattern, from the formula itself [derived]: a wave travelling at theta to her course has wavenumber `k0 sec^2 theta` and decays with depth as `exp(k0 z sec^2 theta)`, so the deep parts of the hull feed only the long transverse waves; the bow and stern, `L` apart, add with phase `exp(i k0 L sec theta)`, which is the interference of section 2.2; and at large theta `sec^3 theta` grows while `exp(k0 z sec^2 theta)` cuts it off near the surface: the Michell spectrum does not decay at theta -> 90 degrees for a hull that is wall-sided at the waterline (Buttle et al. say so and cut the depth integral to (-delta, -nu) in their section 2.2) [read].

**A second read source for the 2/pi, from a point source rather than a hull.** Pethiyagoda, McCue and Moroney, "What is the apparent angle of a Kelvin ship wave pattern?", JFM 758 (2014), arXiv 1405.2500, https://ar5iv.labs.arxiv.org/html/1405.2500 [read]: a source at depth H in a stream toward +x (waves at x > 0), `phi ~ -epsilon / (4 pi |x - x_s|)` near it, `epsilon = m / (U H^2)`, F = U / sqrt(g H), lengths in H; far field `zeta ~ a_1 cos(r g(lambda_1) + pi/4) + a_2 cos(r g(lambda_2) - pi/4)` with `a_j = sqrt(2/pi) epsilon f(lambda_j) / sqrt(r |g_lambdalambda|)`, `f(lambda) = (sqrt(lambda^2 + 1) / F^2) exp(-(lambda^2 + 1) / F^2)`, `g(lambda, theta) = (sqrt(lambda^2 + 1) / F^2)(cos theta + lambda sin theta)`, lambda = tan psi, `lambda_{1,2} = (-1 +- sqrt(1 - 8 tan^2 theta)) / (4 tan theta)`; a_1 transverse, a_2 divergent. Undoing their stationary phase (`dpsi = cos^2 psi dlambda`) gives `A(psi) = (epsilon / pi)(sec^3 psi / F^2) exp(-sec^2 psi / F^2)`, that is, dimensionally, **`A = (m k0 / (pi U)) sec^3 psi exp(-k0 H sec^2 psi)` for a source of volume flux m** [derived]; with the thin-ship source density `sigma = 2 U Y_x` (their frame) this is Buttle's eq (12) term for term. Same research group, a different paper and problem: the 2/pi stands on two read pages. The same A in Havelock's formula (1.4) gives `R = (rho k0^2 m^2 / pi) integral_0^{pi/2} sec^3 theta exp(-2 k0 H sec^2 theta) dtheta`, which is Havelock's classical submerged-source result `16 pi rho k0^2 mu^2 integral_0^{pi/2} sec^3 theta exp(-2 k0 H sec^2 theta) dtheta` with `mu = m / (4 pi)` [derived; the classical form is [textbook]: Havelock 1932 and Lamb's Hydrodynamics, from memory]. Their phases also fix the sign convention: for a real positive A (a source), the transverse wave on the track a distance d downstream is `A(0) sqrt(2 pi / (k0 d)) cos(k0 d + pi/4)` in either frame [derived].

### 1.4 Havelock's formula

| Quantity | Formula | Source | Tag |
|---|---|---|---|
| wave resistance from the free-wave spectrum, for `zeta = Re integral_{-pi/2}^{pi/2} A(theta) exp(-i k0 sec^2 theta (x cos theta + y sin theta)) dtheta` | `R = (pi / 2) rho U^2 integral_{-pi/2}^{pi/2} |A(theta)|^2 cos^3 theta dtheta` | derived here by the energy flux through a transverse plane (below); the form is the one the brainstorm recalled | [derived]; NOT FOUND in a page I could open (Newman 1977 not attempted; Tuck, Scullen and Lazauskas 2002, where I expected it, came as page images only: section 8) |
| the proof in four lines | (1) one plane wave of amplitude a at angle theta keeps station with her if `omega = U k cos theta`, so `k = k0 sec^2 theta` and its group velocity's component along her course is `(U cos^2 theta) / 2`; (2) the region behind a transverse plane moving with her grows at U per unit width and gains wave energy at the net rate `E (U - U cos^2 theta / 2)`, `E = rho g <zeta^2>` per unit area; (3) at a fixed x, Parseval in y with the transverse wavenumber `u = k0 sin theta sec^2 theta`, `du/dtheta = k0 (1 + sin^2 theta) / cos^3 theta`, gives `<integral zeta^2 dy> = pi integral |A|^2 (dtheta/du) dtheta`; (4) so `R U = rho g pi integral |A|^2 [cos^3 theta / (k0 (1 + sin^2 theta))] U (1 + sin^2 theta)/2 dtheta`, and `g / k0 = U^2` | [derived]; at theta = 0 it reduces to the two-dimensional `R = rho g a^2 / 4` per unit width [textbook: Lamb, Hydrodynamics, art. 249] |
| with Buttle's amplitude it gives Michell's integral exactly | `|A|^2 cos^3 = (4 k0^2 / pi^2) sec^3 theta |P + iQ|^2`, so `R = (2 rho g^2 / (pi U^2)) integral_{-pi/2}^{pi/2} sec^3 theta |P + iQ|^2 dtheta`; with lambda = sec theta, `sec^3 theta dtheta = lambda^2 dlambda / sqrt(lambda^2 - 1)` and the two halves of theta, this is `(4 rho g^2 / (pi U^2)) integral_1^inf |P + iQ|^2 lambda^2 / sqrt(lambda^2 - 1) dlambda`: Boucher's eq (9) | [derived]: **the two read sources (Boucher's R, Buttle's A) agree through Havelock's formula only with the constant pi/2** |
| a different normalisation met on the way | Weymouth (arXiv 2603.14945, 2026) writes a Havelock-type drag `D_W = (rho / (pi l^2)) integral_{-pi/2}^{pi/2} |K(theta)|^2 sec^3 theta dtheta`, with K a Kochin function of his source strengths and `l = U^2 / g` | arXiv 2603.14945v1, eq (10) | [read]; not comparable without his source normalisation; not used |

### 1.5 The numerical check of section 1

`C:\temp\titanic-wake-scratch\r8\wigley_michell.js` computes the Wigley hull (section 2) two ways: Michell's slope form of 1.2 (lambda = cosh t, 350,000 steps) and Havelock's formula of 1.4 with the dimensional amplitude of 1.3. **The two agree to six digits at every Froude number from 0.20 to 0.50** (ratio 1.000000), and both reproduce the Michell column of an independent code (Peri 2026, section 2.1) to the four digits printed. So the constants `4 rho g^2 / (pi U^2)`, `2 k0 / pi` and `pi / 2` are mutually consistent and match a third party's implementation [derived].

## 2. Check values: the Wigley hull, humps and hollows, thin-ship error for full hulls

### 2.1 The Wigley hull

Hull: `Y = (B/2)(1 - (2x/L)^2)(1 - (z/T)^2)`, L/B = 10, B/T = 1.6 (B/L = 0.1, T/L = 0.0625). Wetted surface at rest, `S = 2 integral integral sqrt(1 + Y_x^2 + Y_z^2) dx dz` = **0.14879 L^2** [derived, 200 x 200 Gauss points]; the thin-ship shortcut `2 L T` would be 0.125 L^2, 16 % less: always say which S a Cw is on. `Cw = R / (0.5 rho U^2 S)`.

| Fn | Michell Cw x 10^3, Peri (2026), Table 3 | Michell Cw x 10^3, this note (S = 0.14879 L^2) | Experiment Cw x 10^3, Kajitani et al. (1983), as Peri's Table 9 gives it (Cw = Ct - Cf ITTC, model fixed, L = 4 m) | Nonlinear Rankine-panel Cw x 10^3 (Peri's fine grid) |
|---|---|---|---|---|
| 0.200 | - | 0.888 | - | - |
| 0.211 | - | 0.785 | 0.273 | 0.710 |
| 0.230 | - | 1.164 | - | - |
| 0.250 | 1.064 | 1.064 | 0.598 | 1.092 |
| 0.267 | 0.976 | 0.976 | - (Ct 4.150) | 0.881 |
| 0.289 | 1.987 | 1.987 | 1.471 | 1.358 |
| 0.300 | - | 2.142 | - | - |
| 0.316 | 1.831 | 1.832 | 2.008 | 1.798 |
| 0.350 | - | 1.248 | - | - |
| 0.354 | 1.284 | 1.285 | 2.027 | 1.453 |
| 0.400 | - | 2.734 | - | - |
| 0.408 | 3.030 | 3.030 | - (Ct 6.350) | 1.791 |
| 0.450 | 4.154 | 4.154 | - (Ct 6.710) | 2.841 |
| 0.500 | - | 4.517 | - | - |

Sources: Peri, "SIREN: A nonlinear Rankine-source boundary element solver for the stationary motion of a marine vehicle in calm water", arXiv 2610.14027v1 (30 Sep 2026), Tables 2-5 and 9, https://arxiv.org/html/2610.14027 [read]; Peri does not print S, and the agreement to four digits with my S = 0.14879 L^2 says he used the exact wetted surface [derived]. Experiment: Kajitani et al. 1983, Ship Research Institute, Tokyo, as tabulated by Peri [read in Peri]; Peri also gives the total Ct x 10^3: 3.720, 3.940, 4.150, 4.730, 5.220, 5.180, 6.350, 6.710 at the eight speeds from 0.211 to 0.450 [read in Peri]. Peri's own remark: Michell and the experiment "are not always on the same side of each other" [read]. My column: `wigley_michell.js` [derived].

What the table shows: at Fn 0.21 to 0.29, Michell's integral is 1.35 to 2.9 times the measured wave resistance of this slender, bow-stern-symmetric hull; at 0.32 to 0.35 it is close or low. The tank values here are Ct - Cf, which carries the form drag too; Peri warns the difference is not by itself an error of either.

### 2.2 Where humps and hollows fall

| Quantity | Formula or value | Source | Tag |
|---|---|---|---|
| interference of a bow source and a stern sink, `L_w` apart, on the transverse waves | `R ~ |1 - exp(i k0 L_w)|^2 = 4 sin^2(k0 L_w / 2)`, k0 = g / U^2: humps where `k0 L_w = (2n - 1) pi`, hollows where `k0 L_w = 2 n pi` | from the phase factor of 1.3 | [derived] |
| the rule | **`Fn = sqrt(L_w / (N pi L))`, N odd: hump, N even: hollow**; with `L_w = L`: N = 1 0.564, 2 0.399, 3 0.326, 4 0.282, 5 0.252, 6 0.230, 7 0.213 | from the row above | [derived]; the usual names, "main hump" near Fn 0.5 and "prismatic hump" near 0.3 [textbook: e.g. Molland, Turnock and Hudson, Ship Resistance and Propulsion, ch. 3; from memory] |
| Wigley, Michell, extremes found by a sweep at steps of 0.0025 | humps at Fn 0.2050, 0.2375, 0.3000, 0.5000; hollows at 0.2175, 0.2600, 0.3450; the implied `L_w / L` is 0.85 to 0.94 below Fn 0.3 and 0.75 to 0.85 above | `C:\temp\titanic-wake-scratch\r8\wigley_sweep.js` | [derived] |
| Titanic at 22.5 kn | Fn = 0.2296; transverse wavelength `2 pi U^2 / g` = 85.84 m, 3.02 to her length; `N = L_w / (pi L Fn^2)` = 6.04 with L_w = L (a hollow) and 5.13 with L_w = 0.85 L (a hump) | `wigley_sweep.js` | [derived]: **she sits between the fifth hump and the sixth hollow, and which one depends on her own wave-making length; only her own Michell curve can say** [bet] |

### 2.3 Thin-ship theory against tank tests for full hulls

| Statement | Source | Tag |
|---|---|---|
| On the slender Wigley hull, Michell's Cw is 2.9, 1.8 and 1.35 times the measured Cw at Fn 0.211, 0.250 and 0.289, and 0.91 and 0.63 times it at 0.316 and 0.354 (table above): **high below Fn 0.3, and its hollow near 0.345 is deeper than anything measured**; the measured curve is smoother than Michell's | Peri (2026) Tables 3 and 9; ratios [derived] | [read], [derived] |
| Tuck's review: the lack of a routine algorithm for Michell's integral inhibited its use; its poor reputation comes partly from unfair comparisons with model experiments; viscosity is neglected, as Froude's separation of wave and viscous drag justifies | Tuck, J. Austral. Math. Soc. B 30 (1989) 365-377 | [search summary]; the paper is a scan the fetch tool could not read |
| A modified integral that adds viscosity to the free-surface condition (Lazauskas: `b = 4 n g / U^3`, n a turbulent eddy viscosity, `a = b Fr^3 = 4 n / (L sqrt(g L))`, a = 0.001 to 0.005 in his examples) damps the short waves and the humps and hollows | Lazauskas, boatdesign.net thread, 14 Feb 2010, https://www.boatdesign.net/posts/344795/ | [read] |
| Lazauskas: Michlet's predictions at low Fr can be poor where a bulbous bow breaks the thin-ship assumption | boatdesign.net | [search summary] |
| A recent paper (MDPI JMSE 8(6):400) argues that the traditional Michell curve shows humps and hollows the experiments do not, and uses a modified integral | https://mdpi.com/2077-1312/8/6/400 | [search summary]; the page refused (HTTP 403) |
| For a parabolic-waterline, rectangular-frame model, Michell's theory agreed fairly with experiment over Fn 0.2 to 1.0 except for a phase error of the free waves that grows as Fn falls | TRID record "Some results concerning the wavemaking of a thin ship" | [search summary] |
| **For a full merchant hull (CB 0.60 to 0.70) at Fn 0.20 to 0.25 no published ratio of Michell to measured wave resistance was found** (the Series 60 CB 0.60 comparisons, Kim and Jenkins, DTNSRDC, are a scanned DTIC report) | - | NOT FOUND |
| My expectation for her: Michell's integral on her own hull will be higher than her true wave resistance by a factor of 1.5 to 3 at 22.5 kn, will swing more than the truth between her humps and hollows, and its stern system is too strong (no boundary layer, no wake); the usual engineering remedy is to scale the stern sources down by a factor of about 0.6 to 0.8 or to add the viscous damping above | from the Wigley ratios and the remarks above | [bet] |

## 3. The far field: stationary phase, the wedge, the cusp, Kelvin's crests, the apparent angle

| Quantity | Formula or value | Source | Tag |
|---|---|---|---|
| deep-water dispersion; a wave keeps station with her when its frequency is Doppler-cancelled | `omega(k) = sqrt(g k) + V . k` (DLMF's Hamiltonian for the pattern, 36.13.6; the fetch rendered the root badly); equivalently `U cos theta = c_phase(k) = sqrt(g / k)` | DLMF 36.13.6, https://dlmf.nist.gov/36.13; Rabaud and Moisy 2013 (arXiv 1304.2653), their stationarity condition | [read] |
| wavenumber of the wave at theta to her course | `k = k0 sec^2 theta`, k0 = g / U^2 (Rabaud and Moisy write `k_g = g / U^2`) | Buttle et al. eq (2); Rabaud and Moisy | [read] |
| the model pattern (a point disturbance with a flat spectrum) | `z(phi, rho) = integral_{-pi/2}^{pi/2} cos(rho cos(theta + phi) / cos^2 theta) dtheta`, `rho = g r / V^2`, phase `f(theta, phi) = -cos(theta + phi) / cos^2 theta` | DLMF 36.13.1-36.13.3 | [read] |
| the two waves that reach a point at polar angle phi off the track (stationary points) | `theta_+(phi) = (1/2)(arcsin(3 sin phi) - phi)`, `theta_-(phi) = (1/2)(pi - phi - arcsin(3 sin phi))` | DLMF 36.13.4; the same pair in Darmon, Benzaquen and Raphael (arXiv 1309.6751) | [read] |
| the same, as Buttle et al. write them | `psi_{1,2} = arctan((1 +- sqrt(1 - 8 tan^2 theta)) / (4 tan theta))`, theta the field angle | arXiv 2205.01870v3 eq (21) | [read] |
| half-angle of the wedge | `arcsin(1/3) = arctan(1/sqrt 8) = 19.47122 deg` | DLMF 36.13.5; Buttle eq (22); Rabaud and Moisy (3a) | [read] |
| direction of the cusp waves | where the two stationary points meet: `tan^2 psi_c = 1/2`, **psi_c = 35.264 deg** (at phi = 19.47 deg, `theta_+ = theta_- = (90 - 19.47)/2`) | from the rows above | [derived] |
| their wavelength | `2 pi / (k0 sec^2 psi_c) = (2/3)(2 pi U^2 / g)`: at 22.5 kn 57.23 m against the transverse 85.84 m | from the rows above; Rabaud and Moisy note a divergent wave of wavelength `2 lambda_g / 3` beside the transverse `lambda_g` | [derived]; [read] for the 2/3 |
| height inside the wedge | `zeta(r, theta) ~ Re{ (sqrt(2 pi) / r^(1/2)) ( A(psi_1) / sqrt(-g''(psi_1)) exp(i(r g(psi_1) - pi/4)) + A(psi_2) / sqrt(g''(psi_2)) exp(i(r g(psi_2) + pi/4)) ) }`, `g(psi; theta) = k0 cos(psi + theta)` with Buttle's `k0 = sec^2 psi / F^2`: **falls as r^(-1/2)** | Buttle eq (22); Stoker (1957) eq (8.2.36): amplitudes die out as the inverse square root of the distance; the two systems differ in phase by pi/2 where they meet | [read]; Stoker [read, OCR] |
| on the cusp line | `zeta ~ Re{ Gamma(1/3) / (sqrt 3 r^(1/3)) (6 / g'''(psi_c))^(1/3) A(psi_c) exp(i r g(psi_c)) }`: **falls as r^(-1/3)** | Buttle eq after (25); DLMF 36.13.8 (the leading term carries rho^(-1/3)); Stoker eq (8.2.40) (decay as a^(-1/3), phase shifted by pi/4 from the interior) | [read] |
| uniform (Airy) form across the cusp line | `zeta ~ Re{ (sqrt 2 pi Delta^(1/4) / r^(1/3)) (A_1 / sqrt(-g''_1) + A_2 / sqrt(g''_2)) exp(i r g~) Ai(-r^(2/3) Delta) + i (sqrt 2 pi / (r^(2/3) Delta^(1/4))) (A_1 / sqrt(-g''_1) - A_2 / sqrt(g''_2)) exp(i r g~) Ai'(-r^(2/3) Delta) }`, `g~ = (g_1 + g_2)/2`, `Delta = ((3/4)(g_1 - g_2))^(2/3)` | Buttle eqs (24)-(25); DLMF 36.13.7-36.13.8 (the same structure) | [read] |
| Kelvin's crests (lines of constant phase where the phase is stationary), model frame, n-th crest, wave direction psi from -90 to 90 deg | `x = -a cos psi (1 + sin^2 psi) = -(a/4)(5 cos psi - cos 3 psi)`, `y = a sin psi cos^2 psi = (a/4)(sin psi + sin 3 psi)`, with `a = n (2 pi U^2 / g)` plus a constant set by the phase of A and the -pi/4 of stationary phase; the transverse crest is `|psi| < 35.26 deg`, the divergent `35.26 < |psi| < 90 deg`; the cusp is at `(x, y) = (-1.0887 a, +-0.3849 a)`, on the line of 19.47 deg | from the stationarity of `k0 sec^2 psi (x cos psi + y sin psi)` in psi, which is DLMF's phase | [derived]; the crest shape itself I did not find printed in a page I opened (Stoker's Fig. 8.2.9 draws it) |
| apparent angle against Froude number, measured on real wakes (Google Earth), Fr on hull length | plateau `18.6 +- 1.8 deg` up to `Fr = 0.5 +- 0.1`; their model: `alpha = arctan(1/sqrt 8)` for `Fr <= Fr_c = sqrt(3/(4 pi)) = 0.49`, `alpha = arctan( sqrt(2 pi Fr^2 - 1) / (4 pi Fr^2 - 1) )` above; for large Fr `alpha ~ 1/(2 sqrt(2 pi) Fr)`; the premise: a ship of length L cannot make waves much longer than L | Rabaud and Moisy, "Ship wakes: Kelvin or Mach angle?", PRL 110, 214503 (2013), https://ar5iv.labs.arxiv.org/html/1304.2653 | [read] |
| the same question for a moving pressure of size b, Fr_b = V / sqrt(g b) | the outer edge of the wake stays at the Kelvin angle; the angle of the **largest waves** is on the centreline for `Fr_b <= 0.3`, jumps to the Kelvin angle at about 0.31, stays there to about 0.7, then falls as `1/Fr_b` (`0.224 / Fr_b` for a Gaussian) | Darmon, Benzaquen and Raphael, JFM 738 R3 (2014), https://ar5iv.labs.arxiv.org/html/1309.6751 | [read] |
| a submerged source or doublet, F on its depth H (`F = U / sqrt(g H)`), apparent angle = the line through each wavelength's highest peak | three linear regimes: (I) small F, the divergent waves too small to measure an angle; (II) the highest peaks on the outermost divergent waves, apparent angle near Kelvin's (about 18.5 deg for a source at roughly 0.8 < F < 3); (III) large F, the peaks inside the wedge, `theta_app ~ 1/(sqrt 3 F)` for a source and `1/(sqrt 5 F)` for a doublet; **nonlinearity widens the apparent angle**, beyond Kelvin's in strongly nonlinear cases | Pethiyagoda, McCue and Moroney, JFM 758 (2014), https://ar5iv.labs.arxiv.org/html/1405.2500 | [read]; their F is on depth, not on length, so it does not map onto her Fn; Noblesse et al. 2014 (Eur. J. Mech. B 46) not opened |

For her: Fr = 0.23 on her length is far below 0.49, so **the full 19.47 degree wedge stands at every speed she can make** [derived from Rabaud and Moisy]. Darmon's result is for a smooth axisymmetric pressure, not a hull: it warns that at low Froude number the transverse waves can carry the largest heights on the centreline, which is the opposite of the brainstorm's remark that the divergent waves dominate what is seen at low Froude number. Her own `|A(theta)|` decides it [bet].

## 4. Ships not on a straight steady course: circles, acceleration, stopping

| Quantity | Formula or statement | Source | Tag |
|---|---|---|---|
| the field of a disturbance on any path | `zeta(x, t) = integral_0^t zeta_p( r(x, tau), theta(x, tau), t - tau ) dtau`: the sum of the responses to pressure pulses laid down along the path, with `zeta_p(r, theta, t) = -(1/(4 pi^2)) integral_0^inf integral_{-pi}^{pi} (k^2 / Omega(k)) p~(k, psi) sin(Omega(k) t) exp(i k r cos(theta - psi)) dpsi dk`, `Omega(k) = sqrt k` (deep water, scaled) | Pethiyagoda, Moroney, Macfarlane and McCue, "Spectrogram analysis of surface elevation signals due to accelerating ships", arXiv 2107.09195 (2021), eqs (3)-(4), https://ar5iv.labs.arxiv.org/html/2107.09195 | [read] |
| which waves reach a point (stationary phase in the time of emission tau) | the wave travels along the line from where it was made (`psi = theta(tau)`); **it arrives at its group velocity, `c_g = r(tau) / (t - tau)`, and its phase speed equals the rate at which the ship was closing on the point when she made it, `c_p = -r'(tau)`** (eqs 9-11) | same | [read] |
| Stoker's version of the same rule | each course point Q has an "influence circle": the points P that Q's waves reach lie on a circle with a diameter along the tangent to the course at Q, Q at one end, the circle lying ahead of Q; `dr/dt = c cos theta` (8.2.13), `c t = a cos theta`, `r = (1/2) a cos^2 theta` (8.2.16-17), theta the angle between QP and the course; the disturbed region is bounded by the envelope of the circles; for a straight course it is the sector of half-angle 19 deg 28 min, independent of speed | J. J. Stoker, Water Waves (1957), section 8.2, pp. 219-243, archive.org text `waterwavesthemat033435mbp` | [read, OCR]; the printed (8.2.14) is illegible, and the OCR gives (8.2.15) as `a = 2c^2/g`, which cannot be the whole of it: from the point-impulse phase `g t^2 / (4 r)` = phi on a crest, `a = 2 c^2 phi / g`, and the circle's diameter is `c t / 2`, half the distance she has run since Q (the group speed is half the phase speed `c cos theta`) [derived] |
| what keeps a pattern rigid with the ship | only a straight course (R infinite) or a **circular course at constant speed** (R constant) gives a wave pattern that follows the ship like a rigid body; any other course (or speed change) gives a region of disturbance bounded by curved lines that changes with time | Stoker, around (8.2.32) | [read, OCR] |
| the circular course | Stoker computes the disturbed region (Fig. 8.2.3a) and the crests (Fig. 8.2.8, crests 2 pi apart in phase, both systems present) and prints photographs of ships on circular and curved courses (Fig. 8.2.5); the OCR did not carry the figure's shape | Stoker 8.2 | [read, OCR] |
| the circular course, modern | **"the wake is compressed within the circle and stretched outside it"**; transverse waves appear to fan out from the centre; outside the circle the lowest frequency reaching a fixed point is `omega = 1` (scaled), when the ship heads straight at it | Pethiyagoda et al. 2021 | [read] |
| caustics | a point can lie outside, on or inside a caustic: zero, one or two stationary solutions; near a caustic the Airy representation (Chester, Friedman and Ursell 1957) replaces stationary phase; low-frequency energy shows outside the caustic ("precursors", after Torsvik et al.) | Pethiyagoda et al. 2021 | [read] |
| accelerating along a straight line | both systems remain; the waves farther astern (made at lower speed) are shorter; **acceleration bends the edges of the V toward the track**; the line between transverse and divergent waves is less clear | Pethiyagoda et al. 2021 | [read] |
| decelerating and stopping | **the divergent waves are cut off or diminished; after she stops the wake is mostly transverse** | Pethiyagoda et al. 2021 | [read] |
| what a stopped ship sees | waves made at speed U along her track have phase speed U and group speed U/2 (transverse, theta = 0); after a sudden stop at S the energy of the waves made a distance d astern of S reaches S at `t = d / U` after the stop, so for minutes a train of transverse waves of period `2 pi U / g` (at 22.5 kn: 7.4 s, 85.8 m) overtakes her from astern and runs on ahead; crests pass her at U, the train's energy at U/2 | from the rows above | [derived] |
| a turning ship and an accelerating ship can look alike to a fixed sensor | an accelerating ship on a straight line and a turning ship can share the same dispersion curve; a turn mistaken for acceleration overestimates the speed seen from outside the circle and underestimates it from inside | Pethiyagoda et al. 2021 | [read] |

What this does not give: Stoker's printed figure for the circle (not legible in the OCR), Wehausen's unsteady thin-ship theory, Li and Ellingsen's ring waves, and any published height (not geometry) for a turning hull with drift. The page's sample method (each wave placed from where and how fast she was when she made it, moving at its group velocity) is the rule of the second row; Stoker's influence circle is the same rule drawn as geometry.

## 5. The bow wave and the wave profile along the hull

Symbols: U her speed, D her draught, `F_D = U / sqrt(g D)` the Froude number on draught, `alpha_E` the waterline entrance **half**-angle (the papers write the full angle as `2 alpha_E`).

| Quantity | Formula or statement | Source | Tag |
|---|---|---|---|
| what the 2008 paper gives | simple expressions, from speed, draught and `alpha_E` alone, for the bow wave's height, the distance from the stem to its crest, the rise of water at the stem and the bow wave's profile; a criterion for when a ship in steady motion cannot make a steady bow wave; a simple expression for the height of an unsteady bow wave; validated on several **non-bulbous, wedge-shaped bows with small flare** and on a yawed towed flat plate | Noblesse, Delhommeau, Guilbaud, Hendrix and Yang, "Simple analytical relations for ship bow waves", JFM 600 (2008) 105-132, doi 10.1017/S0022112008000220, abstract at https://www.cambridge.org/core/journals/journal-of-fluid-mechanics/article/simple-analytical-relations-for-ship-bow-waves/AD9636CDD23B883D138A7936F618B244 | [read] (abstract) |
| the fine-bow rule | a ship with `2 alpha_E` below about 25 degrees may make a steady bow wave at any speed; a fuller one only above a critical speed set by `alpha_E` | same abstract | [read] |
| **the boundary between the unsteady and the (steady) overturning bow-wave regimes** | **`U / sqrt(g D) = 4.4 tan(alpha) / cos(alpha) - 1`**: steady overturning above it (faster, or finer), unsteady below; tested with a flat plate at D = 0.2 m, U = 1.75 m/s, 10 degrees of heel, yaw 10 to 90 degrees: unsteadiness much larger at 30 to 90 degrees than at 10 to 20 | Delhommeau, Guilbaud, David, Yang and Noblesse, "Boundary between unsteady and overturning ship bow wave regimes", JFM 620 (2009) 167-175, doi 10.1017/S002211200800462X, abstract at https://www.cambridge.org/core/journals/journal-of-fluid-mechanics/article/boundary-between-unsteady-and-overturning-ship-bow-wave-regimes/B559E643ED6374D91802AF2F4370E02F | [read] (abstract, from the image's alt text); at `alpha = 12.5 deg` the right side is 0.999 - 1 = 0: the 25-degree rule of 2008 [derived] |
| the bow wave's height | `Z_b = (U^2 / g) * (2.2 / (1 + F_D)) * tan(alpha_E) / cos(alpha_E)` | the brainstorm's recollection; **not read**: the 2008 paper, the 2013 review ("Ship bow waves", J. Hydrodynamics 25) and the Nantes conference paper are PDFs the fetch tool could not read | [bet] |
| why the recalled height is probably right | put the boundary's `1 + F_D = 4.4 tan/cos` into the recalled formula: `Z_b = (U^2 / g)(2.2 / 4.4) = U^2 / (2 g)`, **the stagnation height**. So the read boundary is exactly where the recalled bow wave would reach the Bernoulli limit; a search summary of the 2013 review says the boundary follows from "an elementary consideration of the Bernoulli relation" | [derived]; the review's sentence [search summary] |
| distance from the stem to the crest, rise at the stem, profile | NOT FOUND (not in the abstracts; the papers unreadable here) | - | NOT FOUND |
| the slender-bow structure | to first order in slenderness the flow near a slender bow is two-dimensional in each transverse plane (the "2D+t" picture), with a three-dimensional correction needed ahead of the stem | Fontaine, Faltinsen and Cointe, "New insight into the generation of ship bow waves", JFM 421 (2000) 15-38, abstract | [read] |
| the wave profile along a hull, Wigley's five parts | a symmetrical (Bernoulli) disturbance, high at bow and stern and low amidships, which travels with the hull and makes no waves; a **bow system starting with a crest**; a **forward shoulder system starting with a trough**; an after shoulder system; a stern system | a US patent citing "Wigley's calculations in Todd" (lists the five: Bernoulli, bow, forward curvature, aft curvature, stern), and a bulbous-bow patent (bow system starts with a crest, forward shoulder with a trough) | [search summary]; Wigley's paper (Trans. INA, 1930s) and Todd not opened; the after-shoulder and stern systems' starting phase NOT FOUND |
| where the crests stand along her side at 22.5 kn | the bow crest a little aft of the stem, then crests every 85.8 m (3.02 to her length): about three crests and three troughs along her side, the last near the quarter or the stern depending on the interference of 2.2 | from 2.2 and the transverse wavelength | [derived] |

Her numbers (the recalled height formula is a [bet]; the boundary is [read]): with the model hull's waterline half-angle of about 16.6 degrees at the stem (section 6), D = 10.5 m:

| Speed | F_D | Z_b (recalled) | U^2 / 2g | Boundary F_D for 16.6 deg | Regime |
|---|---|---|---|---|---|
| 22.5 kn | 1.141 | 4.4 m | 6.8 m | 0.369 | steady overturning |
| 18 kn | 0.913 | 3.1 m | 4.4 m | 0.369 | steady overturning |
| 10 kn | 0.507 | 1.2 m | 1.35 m | 0.369 | steady overturning |
| 7.3 kn and below | 0.369 and below | | | 0.369 | unsteady side |

[derived: `entrance_angle.js` and the formulas above; with the brainstorm's 12 degrees the 22.5-knot height is 3.05 m, and at 10, 15 and 20 degrees 2.5, 3.9 and 5.4 m.] The steady "overturning" regime is the one in which the bow wave plunges into a steady breaker along her bow: the "bone in her teeth" is expected at speed, not as a painted strip [bet, from the regime's name and the brainstorm's 3.4].

## 6. The Olympic class

| Quantity | Value | Source | Tag |
|---|---|---|---|
| waterline entrance half-angle of Olympic or Titanic from a lines plan or a study | NOT FOUND (one search; The Shipbuilder 1911 and Hackett and Bedford 1996 not online as text) | - | NOT FOUND |
| the same from the simulator's own hull (`C.halfBreadth`, a fitted form whose ends are power laws, not the lines plan) | tangent half-angle at the stem 16.5 to 16.7 deg at draughts 9.37 to 10.54 m; chord half-angle over the first 2, 5 and 10 % of her length 16.3, 15.6 and 14.4 deg at 10.54 m | `C:\temp\titanic-wake-scratch\r8\entrance_angle.js`, reading `core/core.js` | [derived] |
| form coefficients of the simulator's hull at 34 ft 7 in (10.54 m) | V = 51,862 m3 (53,158 t at 1.025), CB 0.674, CM 0.974, CP 0.692, CWP 0.774, LCB 1.75 m aft of amidships; at the night's mean draught 9.83 m: CB 0.666, CM 0.972, CP 0.686, CWP 0.773 | `C:\temp\titanic-wake-scratch\r8\hull_coeffs.js` (L = 259.08 m, B = 28.19 m) | [derived]; 53,158 t is 52,318 long tons, against the 52,310 tons usually quoted for 34 ft 7 in [textbook: the figure as Wikipedia gives it, from memory] |
| prismatic and waterplane coefficients from a published source | NOT FOUND | - | NOT FOUND |
| a contemporary remark or a photograph-based estimate of her bow wave or wake at 21 to 22 kn | NOT FOUND (no search left in the budget for it) | - | NOT FOUND |
| her effective horsepower, or the share of wave-making in her resistance | NOT FOUND | - | NOT FOUND |
| what to expect at Fn 0.23 and CB 0.67 | wave-making is a minor share of the total, perhaps a fifth to a third, the rest friction and form drag; the motion model's own split (Holtrop, `SHIP.resist`) is the number to compare with | - | [bet] |

## 7. Conflicts

None of the read sources disagree on a constant once their conventions are aligned. What differs is convention, and one transcription:

| Where | What | Resolution | Tag |
|---|---|---|---|
| Buttle et al. against this note (and the brainstorm) | their `k0 = sec^2 psi / F^2` is the dimensionless wavenumber in direction psi; ours is `k0 = g / U^2`, dimensional | theirs = ours x `L sec^2 psi` | [read], [derived] |
| Buttle (stream toward +x, bow at -L/2, wake at x > 0) against the model (ship toward +x, bow at +L/2, wake at x < 0) | the amplitude changes sign: `A = +(2 k0/pi) sec^3 ... Y_x ...` in theirs, `-(2 k0/pi) sec^3 ... Y_x ...` in ours, with the same exponents and the same far-field formula; written with the source density sigma, both read `(k0 / (pi U)) sec^3 integral sigma ...` | a reflection plus a complex conjugate inside Re (1.3) | [derived] |
| Boucher et al. (integrand f, factor lambda^2 / Fr^2) against the classical slope form (Y_x, factor lambda^2 / sqrt(lambda^2 - 1) outside) | identical when Y = 0 at bow and stern; a transom needs Buttle's end terms (eq 13) | integration by parts (1.2) | [derived] |
| Buttle eq (1) is printed `exp(-i ...)` and without "Re"; eq (22), as the fetch transcribed it, has `exp(+i(r g - pi/4))` | for a real A it makes no difference; for a hull's complex A it is a conjugate, which flips the sign of a bow-stern-symmetric hull's pattern (its A is purely imaginary) | take eq (1) with Re as the definition and do the stationary phase (or the theta integral) yourself; Pethiyagoda 2014's `cos(r g +- pi/4)` agrees with eq (1) | [read], [derived] |
| Rabaud and Moisy (Fr on hull length; the wake narrows above 0.49) against Darmon et al. (Fr on the pressure's size b; the largest waves leave the Kelvin angle above about 0.7) | different lengths and different measures (the edge of the wedge, against the angle of the largest waves); both put her at the full Kelvin wedge | - | [read] |
| Wigley's Cw on the exact S (0.14879 L^2) against Cw on `2 L T` (0.125 L^2) | 16 % apart; Peri's Michell values match the exact S | state S with every Cw | [derived] |
| Stoker's OCR gives `a = 2 c^2 / g` | with the impulse phase `g t^2 / (4 r)` the crest of phase phi has `a = 2 c^2 phi / g`; the influence circle's diameter is `c t / 2` | the OCR dropped a symbol, or I misread its role [bet] | [read, OCR], [derived] |
| DLMF 36.13.6 as fetched: `omega(k) = g k + V . k` | the deep-water law is `sqrt(g k)`; the fetch dropped the root | - | [read], [textbook] |
| the brainstorm against this note | its far field and the shape of its spectrum are confirmed; it lacked the factor `2 k0 / pi` and the sign; its bow half-angle of 12 degrees is a guess, and the simulator's own hull has about 16.6 degrees at the stem; its remark that divergent waves dominate at low Froude number is unproven for her (section 3) | - | [derived] |

## 8. NOT FOUND

- Michell's integral and Havelock's formula **as printed in** Newman (1977), Wehausen and Laitone (1960), Tuck (1989, a scan), Michell (1898), the Tuck-Scullen-Lazauskas reports or Lazauskas's thesis: none opened as text. Michell's constant rests on Boucher et al. and on Peri's numbers; the 2/pi on Buttle et al. and Pethiyagoda et al.; Havelock's pi/2 on my derivation and the agreement of those four.
- Published Michell-against-tank ratios for a full merchant hull (Series 60, CB 0.60 to 0.70) near Fn 0.20 to 0.25. Gotman (2002) and Insel and Molland not found as readable text.
- Noblesse et al. (2008): the formulas for the bow wave's height, the stem-to-crest distance, the rise at the stem and the profile (the height formula here is the brainstorm's recollection, [bet]).
- Wigley's own five-part decomposition (only patents' summaries), and the starting phase of the after-shoulder and stern systems.
- Kelvin's crest equations printed in a page I opened (derived here; Stoker's Fig. 8.2.9 draws them).
- Stoker's figure of the circular course as a shape (OCR only); Wehausen's unsteady thin-ship theory; Li and Ellingsen's ring waves; Noblesse et al. (2014) on wake angles.
- For the Olympic class: the waterline entrance half-angle, the prismatic and waterplane coefficients, effective horsepower, the wave-making share of resistance, and any contemporary remark or photograph-based estimate of her bow wave or wake at 21 to 22 knots.

## 9. For the model

### 9.1 One convention

Ship frame: x forward from amidships, y to port, z up from the **waterline** (`z = z_keel - T`), the ship moving toward +x at speed U through still water, so her waves lie at x < 0 behind the stern. `Y(x, z) >= 0` the half-breadth (`C.halfBreadth(x, z + T)`), zero outside the hull. `rho = 1025 kg/m3`, `g = 9.80665 m/s2`, `k0 = g / U^2` (1/m), `lambda = sec theta`. theta is the direction a wave travels, measured from her course (+x), positive toward port.

### 9.2 The spectrum, the far field, the resistance (type these in)

```
k0 = g / U^2
F(theta)   = integral_{-T}^{0} dz  integral_{x_aft}^{x_fwd} dx  Y_x(x, z) * exp(k0 z sec^2 theta) * exp(i k0 x sec theta)      [m^2, complex]
           = -i k0 sec(theta) * integral integral Y(x, z) exp(k0 z sec^2 theta) exp(i k0 x sec theta) dx dz                  (only if Y = 0 at both ends of every waterline)
A(theta)   = -(2 k0 / pi) * sec^3(theta) * F(theta)                                                                          [m, complex]
zeta(x, y) = Re  integral_{-pi/2}^{pi/2}  A(theta) * exp(-i k0 sec^2(theta) (x cos theta + y sin theta)) dtheta             [m], far behind (x << x_aft)
R          = (pi / 2) rho U^2  integral_{-pi/2}^{pi/2} |A(theta)|^2 cos^3(theta) dtheta                                       [N]
           = (4 rho g^2 / (pi U^2))  integral_1^inf |F(arcsec lambda)|^2  lambda^2 / sqrt(lambda^2 - 1)  dlambda              (Michell)
```

- Where each constant was read: `4 rho g^2 / (pi U^2)`: Boucher et al. (2018) eqs (9)-(10), after the change of variables of 1.2, and reproduced to four digits by Peri's (2026) independent Michell code (2.1). `2 / pi` (as `2 sec^3 psi / (pi F^2)` dimensionless): Buttle et al. (2024) eq (12), and the point source of Pethiyagoda et al. (2014). `pi / 2`: derived in 1.4; it is the only constant under which Buttle's A and Boucher's R agree. The minus sign of A: derived for this frame (1.3); it only sets the absolute phase.
- A port-starboard symmetric hull gives `A(-theta) = A(theta)`: compute 0 to 90 degrees.
- Numerics: in Michell's form put `lambda = cosh t` (removes the end singularity: the integrand becomes `|F|^2 cosh^2 t dt`); in Havelock's form put `theta = atan(sinh u)`, `dtheta = du / cosh u`. With `dt = 2e-5` up to t = 7 the two forms agree to six digits and reproduce Peri's printed Wigley values (`wigley_michell.js`, about a second per speed in Node). The x-integral oscillates with wavelength `2 pi / (k0 sec theta)`: at 22.5 kn and theta = 85 degrees that is 7.5 m, so `dx` of 1 m or less.
- The spectrum of a hull wall-sided at the waterline does not decay as theta -> 90 degrees (only `exp(k0 z sec^2 theta)` cuts it, and not at z = 0). Cut theta where the wavelength `2 pi cos^2 theta / k0` is below what the page can draw (at 22.5 kn: 85.8 m x cos^2 theta: 3.0 m at 79 deg, 0.65 m at 85 deg), or start the depth integral a little below the surface as Buttle et al. do [bet on the value].
- Units check: F in m^2, A in m, `rho U^2 |A|^2` in N per radian. The test of the code is the Wigley table of 9.4, not her own hull.

### 9.3 The far field and Kelvin's crests

- Stationary waves for a point `(x, y) = (-r cos phi, r sin phi)` behind her, `|phi| < 19.47 deg` (phi positive to port): the phase is `r Phi(theta)` with `Phi(theta) = k0 sec^2 theta cos(theta + phi)` (DLMF's f with the sign changed), stationary where `2 tan theta = tan(theta + phi)`, at `theta_+ = (arcsin(3 sin phi) - phi)/2` (transverse, about phi near the track) and `theta_- = (pi - phi - arcsin(3 sin phi))/2` (divergent) (DLMF 36.13.4); each contributes `sqrt(2 pi / (r |Phi''(theta_j)|)) |A(theta_j)|` with the phase `+- pi/4` by the sign of `Phi''` (Buttle eq 22; Pethiyagoda 2014): **height ~ r^(-1/2)** [read; the check `tan((beta + phi)/2) / tan((beta - phi)/2) = (sin beta + sin phi)/(sin beta - sin phi) = 2` with `sin beta = 3 sin phi` is derived].
- On the cusp line (`phi = 19.47 deg`, waves at `theta = 35.26 deg`, wavelength `(2/3) 2 pi U^2 / g`): `Gamma(1/3) / (sqrt 3 r^(1/3)) (6 / |Phi'''|)^(1/3) |A(35.26 deg)|`: **height ~ r^(-1/3)**; near it use the Airy form of 3 (Buttle eqs 24-25, DLMF 36.13.8). Outside the wedge the height falls off exponentially, as `Ai` of a positive argument does [derived from the Airy form].
- Crest n (model frame): `x = -a cos psi (1 + sin^2 psi)`, `y = a sin psi cos^2 psi`, `a = n 2 pi U^2 / g + a_0`, psi from -90 to 90 degrees; transverse `|psi| < 35.26`, divergent beyond; cusp at `(-1.0887 a, +-0.3849 a)`. `a_0` is set by the phase of `A` and the `-+ pi/4`.
- Her numbers at 22.5 kn: transverse wavelength 85.84 m, cusp wavelength 57.23 m, wedge 19.47 degrees at every speed she can make (Fn 0.23 is far below the 0.49 where wakes start to narrow).
- Viscosity does not damp these waves in any time that matters; spreading does the fading [textbook: Lamb's viscous decay of a wave's amplitude, `exp(-2 nu k^2 t)`, from memory; with `nu = 1.8 x 10^-6 m2/s` (sea water near 0 C) the e-folding time is 5 x 10^7 s for the 86 m transverse wave and 2 x 10^7 s for the 57 m cusp wave: years; derived].

### 9.4 Check values (Wigley, L/B = 10, B/T = 1.6, S = 0.14879 L^2, Cw = R / (0.5 rho U^2 S))

| Fn | 0.20 | 0.211 | 0.23 | 0.25 | 0.267 | 0.289 | 0.30 | 0.316 | 0.35 | 0.354 | 0.40 | 0.408 | 0.45 | 0.50 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Michell Cw x 10^3 | 0.888 | 0.785 | 1.164 | 1.064 | 0.976 | 1.987 | 2.142 | 1.832 | 1.248 | 1.285 | 2.734 | 3.030 | 4.154 | 4.517 |

Peri (2026) prints the 0.25 to 0.45 values to three decimals and they agree; Kajitani et al. (1983) measured 0.273, 0.598, 1.471, 2.008, 2.027 at 0.211, 0.250, 0.289, 0.316, 0.354 (Cw = Ct - Cf ITTC, as Peri gives them).

### 9.5 Humps and hollows

`Fn = sqrt(L_w / (N pi L))`, N odd a hump, N even a hollow, `L_w` the distance between the bow and stern wave systems (0.85 to 0.95 L on the Wigley hull below Fn 0.3). At 22.5 kn she has N = 6.0 with `L_w = L` (a hollow) and 5.1 with `L_w = 0.85 L` (a hump): her own Michell curve decides; compute it from 15 to 23 kn in steps of 0.25 kn and print its extremes.

### 9.6 The bow wave

- `F_D = U / sqrt(g D)`; at 22.5 kn and D = 10.5 m, 1.141.
- Steady (overturning) bow wave when `F_D > 4.4 tan(alpha_E) / cos(alpha_E) - 1`, unsteady below (Delhommeau et al. 2009) [read]. A bow finer than about 12.5 degrees half-angle is steady at every speed (Noblesse et al. 2008) [read].
- Height `Z_b = (U^2 / g)(2.2 / (1 + F_D)) tan(alpha_E) / cos(alpha_E)` [bet: recalled; it meets `U^2 / 2g` exactly on the read boundary]. Validity: non-bulbous wedge-shaped bows with little rake and flare (the papers' own range) [read]; her plumb, unflared stem is inside it [bet].
- With the simulator's hull (alpha_E about 16.6 degrees at the stem): 4.4 m at 22.5 kn, 3.1 m at 18, 1.2 m at 10, steady above about 7.3 kn. With 12 degrees: 3.05 m at 22.5 kn.
- The stem-to-crest distance and the profile: NOT FOUND; until found, put the crest about `0.1 to 0.2` of the transverse wavelength aft of the stem [bet].

### 9.7 Curved and unsteady courses

1. Every wave travels from where she made it at its **group velocity** (half its phase speed in deep water), and it was made with the phase speed equal to the rate at which she was closing on the point where it is now seen (`c_g = r / (t - tau)`, `c_p = -dr/dtau`, Pethiyagoda et al. 2021). The page's sample method is this rule; keep it, and give each sample its own speed's spectrum `A_U(theta)` (the spectrum is per speed, so a turn or a speed change carries its history).
2. A steady circle at constant speed gives a pattern rigid with the ship (Stoker): compressed inside the circle, stretched outside (Pethiyagoda et al. 2021). Any other course gives a time-varying pattern.
3. Where two emission times merge there is a caustic (the cusp line is one): replace `r^(-1/2)` by the Airy form there; a turn moves and bends the caustics, and they can lie inside the turn.
4. Accelerating: the V's edges bend toward the track; the waves far astern (made slower) are shorter. Decelerating: the divergent waves are cut off; after a stop the wake is mostly transverse, and for minutes waves of period `2 pi U_0 / g` (7.4 s from 22.5 kn) overtake her from astern at their phase speed, their energy following at half of it.
5. The drift of a turning hull (sideways flow along her) changes the amplitudes: no published heights were found; the brainstorm's cross-flow sources are a [bet] to be checked against the FluidX3D runs.

### 9.8 The bets that remain

| # | Bet | How to settle it |
|---|---|---|
| B1 | the minus sign of A in the model frame (an absolute phase of pi); weak: both read sources make A proportional to the source density with a positive constant, and the minus sign is only `sigma = -2 U Y_x` in this frame | compare the far field's phase on the track with a direct numerical integral of the steady Kelvin source at moderate distance, or with Buttle's own figures |
| B2 | the bow-wave height formula (2.2, `1 + F_D`, `tan / cos`) | read Noblesse et al. 2008 or the 2013 review in a library copy |
| B3 | her real entrance half-angle (between 12 and 17 degrees) | a lines plan of Olympic or Titanic |
| B4 | thin-ship theory overstates her wave resistance by 1.5 to 3 at 22.5 kn | compare with the motion model's Holtrop wave term; then with the FluidX3D tank |
| B5 | wave-making is a fifth to a third of her resistance at 22.5 kn | the same comparison |
| B6 | whether she sits on a hump or a hollow at 22.5 kn | her own Michell curve (9.5) |
| B7 | whether the divergent or the transverse waves carry the visible heights at Fn 0.23 | her own `|A(theta)|` and the stationary-phase heights at, say, 1 km |
| B8 | the cut-off of the spectrum at large theta | the page's resolution |
| B9 | where the bow-wave crest stands aft of the stem | Noblesse et al. 2008 |
| B10 | the amplitudes of a turning, drifting hull | FluidX3D runs, or a published turning-ship wave cut |

## 10. Sources

Read (opened):
- Boucher, Labbé, Clanet and Benzaquen, "Thin or bulky: optimal aspect ratios for ship hulls", arXiv 1803.10695 (2018), appendix eqs (9)-(10): https://ar5iv.labs.arxiv.org/html/1803.10695
- Buttle, Pethiyagoda, Moroney, Winship, Macfarlane, Binns and McCue, "Mathematical models and time-frequency heat maps for surface gravity waves generated by thin ships", arXiv 2205.01870v3 (17 Dec 2024), eqs (1)-(3), (12)-(13), (16)-(17), (21)-(25): https://arxiv.org/html/2205.01870v3
- Pethiyagoda, McCue and Moroney, "What is the apparent angle of a Kelvin ship wave pattern?", JFM 758 (2014), arXiv 1405.2500: https://ar5iv.labs.arxiv.org/html/1405.2500
- Peri, "SIREN: A nonlinear Rankine-source boundary element solver for the stationary motion of a marine vehicle in calm water", arXiv 2610.14027v1 (30 Sep 2026), Tables 2-5, 9: https://arxiv.org/html/2610.14027
- Weymouth, "Linear Kelvin Wave Predictions in the z -> 0 Limit", arXiv 2603.14945v1 (2026), eq (10): https://arxiv.org/html/2603.14945v1
- NIST Digital Library of Mathematical Functions, section 36.13, "Kelvin's Ship-Wave Pattern": https://dlmf.nist.gov/36.13
- Rabaud and Moisy, "Ship wakes: Kelvin or Mach angle?", PRL 110, 214503 (2013), arXiv 1304.2653: https://ar5iv.labs.arxiv.org/html/1304.2653
- Darmon, Benzaquen and Raphaël, "Kelvin wake pattern at large Froude numbers", JFM 738, R3 (2014), arXiv 1309.6751: https://ar5iv.labs.arxiv.org/html/1309.6751
- Pethiyagoda, Moroney, Macfarlane and McCue, "Spectrogram analysis of surface elevation signals due to accelerating ships", arXiv 2107.09195 (2021): https://ar5iv.labs.arxiv.org/html/2107.09195
- Stoker, "Water Waves: The Mathematical Theory with Applications" (Interscience, 1957), chapter 8, pp. 219-243 (OCR text): https://archive.org/stream/waterwavesthemat033435mbp/waterwavesthemat033435mbp_djvu.txt
- Noblesse, Delhommeau, Guilbaud, Hendrix and Yang, "Simple analytical relations for ship bow waves", JFM 600 (2008) 105-132, abstract: https://www.cambridge.org/core/journals/journal-of-fluid-mechanics/article/simple-analytical-relations-for-ship-bow-waves/AD9636CDD23B883D138A7936F618B244
- Delhommeau, Guilbaud, David, Yang and Noblesse, "Boundary between unsteady and overturning ship bow wave regimes", JFM 620 (2009) 167-175, abstract: https://www.cambridge.org/core/journals/journal-of-fluid-mechanics/article/boundary-between-unsteady-and-overturning-ship-bow-wave-regimes/B559E643ED6374D91802AF2F4370E02F
- Fontaine, Faltinsen and Cointe, "New insight into the generation of ship bow waves", JFM 421 (2000) 15-38, abstract: https://www.cambridge.org/core/journals/journal-of-fluid-mechanics/article/new-insight-into-the-generation-of-ship-bow-waves/1B4BA2B5540F490803A278BCADDF844B
- Lazauskas, boatdesign.net thread on the Michell-Lamb integral (14 Feb 2010): https://www.boatdesign.net/posts/344795/
- Wikipedia, "Kelvin wake pattern", "Wave-making resistance", "Bow wave", "Froude number" (opened; little used): https://en.wikipedia.org/wiki/Kelvin_wake_pattern

Search summaries only: Tuck (1989), J. Austral. Math. Soc. Ser. B 30, doi 10.1017/S0334270000006329; MDPI JMSE 8(6):400 (https://mdpi.com/2077-1312/8/6/400); the TRID record "Some results concerning the wavemaking of a thin ship"; patents citing Wigley's five components (via Todd); the 2013 review "Ship bow waves" (https://dcwan.sjtu.edu.cn/userfiles/2013-4%20Shipbowwaves.pdf).

This repository: `core/core.js` (`halfBreadth`, read through `require`, nothing changed); `docs/BRAINSTORM_the_wake_computed_v1_2026-11-19.md`.

Scripts (scratch, not in the repository): `C:\temp\titanic-wake-scratch\r8\wigley_michell.js`, `wigley_sweep.js`, `entrance_angle.js`, `hull_coeffs.js`.
