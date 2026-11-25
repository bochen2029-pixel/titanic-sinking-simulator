# MMG hull, rudder and propeller models for a manoeuvring liner: formulas with sources

Written 2026-11-16 by a research scout (Opus 5.5) for the lead session's brainstorm; web research only; every formula is tagged [quoted], [secondary] or [from memory, unverified].

Status: complete (v1). Tags: **[quoted]** = seen in the source opened (URL and equation/table number given); **[secondary]** = seen reproduced elsewhere (that source named); **[from memory, unverified]**; **[computed here]** = arithmetic by this scout from a tagged formula; **[my recommendation]** / **[my derivation]** = judgement, not literature. Ship numbers used throughout: L_pp 259.08 m, B 28.19 m, mean draft 10.0 m, C_b 0.68, displacement volume about 50,700 m^3.

## M1. The MMG standard method (Yasukawa and Yoshimura 2015)

Primary source opened in full (HTML with LaTeX, Tables 1 to 5): H. Yasukawa and Y. Yoshimura, "Introduction of MMG standard method for ship maneuvering predictions", J. Mar. Sci. Technol. 20:37-52 (2015), open access, CC BY 4.0. https://doi.org/10.1007/s00773-014-0293-y (read at https://link.springer.com/article/10.1007/s00773-014-0293-y and its /tables/1 to /tables/5 pages). Equation numbers below are the paper's.

### Assumptions the paper states (they matter for this ship)
**[quoted]** Section 2.1 lists: rigid body, quasi-steady forces, lateral velocity small compared with longitudinal, speed low enough to neglect wave making, and "Metacentric height GM is sufficiently large, and the roll coupling effect on maneuvering is negligible." The last assumption does NOT hold for a ship with GM 0.8 m that is flooding (see M4). The model is written for a single propeller and single rudder; the triple-screw arrangement needs the extension discussed in M7.

### Coordinate system and nondimensionalisation [quoted]
- Earth frame o0-x0y0z0 with z0 pointing vertically DOWN. Ship frame o-xyz with origin at MIDSHIP, x to the bow, y to STARBOARD, z DOWN.
- u and v_m: velocities along x and y at midship; drift angle at midship beta = atan(-v_m/u); U = sqrt(u^2 + v_m^2). So beta > 0 means the midship point slides to PORT (v_m < 0), which is the drift of a ship turning to starboard.
- r: yaw rate, positive bow-to-starboard (right-handed about z down). psi: heading.
- G at (x_G, 0, 0); lateral velocity at G: v = v_m + x_G r (Eq. 1).
- Primes: force / (0.5 rho L_pp d U^2); moment / (0.5 rho L_pp^2 d U^2); mass / (0.5 rho L_pp^2 d); moment of inertia / (0.5 rho L_pp^4 d); velocity / U; length / L_pp. Hence v'_m = v_m/U, r' = r L_pp / U.
- Rudder angle sign: the paper defines delta in its Fig. 1 (a figure I could not read as text). From Eq. 18 below, delta > 0 with F_N > 0 gives Y_R < 0 and N_R > 0 (because x_R + a_H x_H < 0), i.e. positive delta turns the bow to STARBOARD. [derived from the quoted equations, not read off the figure]

### Equations of motion [quoted, Eqs. 2-5]
Eq. 2: m(du/dt - v r) = F_x; m(dv/dt + u r) = F_y; I_zG dr/dt = M_z.
Eq. 3: F_x = -m_x du/dt + m_y v_m r + X; F_y = -m_y dv_m/dt - m_x u r + Y; M_z = -J_z dr/dt + N_m - x_G F_y. The paper notes the added-mass coupling terms in v_m and r are neglected "in view of practical purposes".
Eq. 4 (the equations actually integrated):

    (m + m_x) du/dt - (m + m_y) v_m r - x_G m r^2 = X
    (m + m_y) dv_m/dt + (m + m_x) u r + x_G m dr/dt = Y
    (I_zG + x_G^2 m + J_z) dr/dt + x_G m (dv_m/dt + u r) = N_m

Eq. 5: X = X_H + X_R + X_P; Y = Y_H + Y_R; N_m = N_H + N_R (moments about MIDSHIP). Note the propeller contributes no Y or N in the standard method (single screw on the centreline).

Implementation note: Eq. 4 couples dv_m/dt and dr/dt through x_G m; solve the 2x2 system each step (it is constant for a given mass state, so the inverse can be precomputed when mass changes). [my remark]

### Hull forces [quoted, Eqs. 6-7]
X_H = 0.5 rho L_pp d U^2 X'_H(v'_m, r'); Y_H = 0.5 rho L_pp d U^2 Y'_H; N_H = 0.5 rho L_pp^2 d U^2 N'_H, with

    X'_H = -R'_0 + X'_vv v'^2 + X'_vr v' r' + X'_rr r'^2 + X'_vvvv v'^4
    Y'_H = Y'_v v' + Y'_R r' + Y'_vvv v'^3 + Y'_vvr v'^2 r' + Y'_vrr v' r'^2 + Y'_rrr r'^3
    N'_H = N'_v v' + N'_R r' + N'_vvv v'^3 + N'_vvr v'^2 r' + N'_vrr v' r'^2 + N'_rrr r'^3

(v' = v'_m). The paper uses the symbol Y'_R / N'_R (roman R) for the linear YAW-RATE derivatives, not for rudder terms: a naming trap. The paper states the 1st-and-3rd-order form is more accurate than 1st-and-2nd-order (absolute-value) forms.

### Propeller [quoted, Eqs. 8-17]
- X_P = (1 - t_P) T (Eq. 8), t_P constant at given propeller load.
- T = rho n_P^2 D_P^4 K_T(J_P) (Eq. 9); K_T = k_2 J_P^2 + k_1 J_P + k_0 (Eq. 10); J_P = u (1 - w_P) / (n_P D_P) (Eq. 11).
- Wake in manoeuvring, the paper's own form (Eq. 16): (1 - w_P)/(1 - w_P0) = 1 + {1 - exp(-C_1 |beta_P|)} (C_2 - 1), with beta_P = beta - x'_P r' (Eq. 15). C_2 is the asymptotic value at large |beta_P|; it takes different values for beta_P > 0 and < 0 (propeller rotation asymmetry).
- Older forms the paper lists and criticises (Eqs. 12-14, from Inoue et al. 1981, Kose et al. 1981, Yoshimura 1986): w_P/w_P0 = exp(-4 beta_P^2); (1-w_P)/(1-w_P0) = 1 + C_1(beta_P + C_2 beta_P |beta_P|)^2; (1-w_P)/(1-w_P0) = 1 + (1 - cos^2 beta_P)(1 - |beta_P|). The paper says the accuracy of 12 and 14 "was not enough".
- The steering effect on thrust is NOT in X_P; it is folded into t_R (below).

### Rudder [quoted, Eqs. 18-25, 38-40, 46]
    X_R = -(1 - t_R) F_N sin(delta)
    Y_R = -(1 + a_H) F_N cos(delta)
    N_R = -(x_R + a_H x_H) F_N cos(delta)                                  (Eq. 18)
    F_N = 0.5 rho A_R U_R^2 f_alpha sin(alpha_R)                           (Eq. 19)
    U_R = sqrt(u_R^2 + v_R^2)                                              (Eq. 20)
    alpha_R = delta - atan(v_R/u_R)  (approx. delta - v_R/u_R)             (Eq. 21)
    v_R = U gamma_R beta_R,  beta_R = beta - l'_R r'                       (Eqs. 23-24)
    u_R = eps u (1 - w_P) sqrt( eta {1 + kappa (sqrt(1 + 8 K_T/(pi J_P^2)) - 1)}^2 + (1 - eta) )   (Eq. 25)
    eta = D_P / H_R (approx. A_RP/A_R, the rudder fraction inside the slipstream)                  (Eq. 40)
    eps = (1 - w_R)/(1 - w_P);  kappa = k_x / eps  (k_x: slipstream correction)                    (Eq. 46)
    f_alpha = 6.13 Lambda / (Lambda + 2.25)   (Fujii's formula, Lambda = rudder aspect ratio incl. horn)   (Eq. 38)

Definitions and ranges the paper gives:
- t_R: steering resistance deduction factor; also absorbs the thrust increase caused by steering.
- a_H: rudder force increase factor; "almost 0.3-0.4 in tank tests" (lateral force on the hull induced by the rudder, a flap effect).
- x_H: acting point of that induced hull force; "almost -0.45 L_pp".
- x_R: rudder position, taken as -0.5 L_pp.
- gamma_R: flow-straightening coefficient, usually below 1, different for port and starboard.
- l'_R: experimental constant; measured values are near -1.0 rather than the geometric -0.5 (the paper explains this as flow straightening in turning).
- Rudder tangential (drag) force is neglected in Eq. 18.
- The derivation of Eq. 25 (Appendix, Eqs. 39-46) is momentum theory: u_infinity = u_P sqrt(1 + 8 K_T/(pi J_P^2)), plus an area-weighted mix of slipstream and non-slipstream inflow.

### KVLCC2 worked example [quoted, Tables 1-5]
Principal particulars, full scale (Table 1): L_pp 320.0 m, B 58.0 m, d 20.8 m, displacement volume 312,600 m^3, x_G 11.2 m, C_b 0.810, D_P 9.86 m, H_R 15.80 m, A_R 112.5 m^2 (movable part of a mariner rudder). The model tested (L3) was L_pp 2.902 m; free-running comparison model L7 (7.00 m).

Coefficients used in the simulations (Table 3):

| Hull | value | Interaction / rudder / added mass | value |
|---|---|---|---|
| X'_vv | -0.040 | m'_x | 0.022 |
| X'_vr | 0.002 | m'_y | 0.223 |
| X'_rr | 0.011 | J'_z | 0.011 |
| X'_vvvv | 0.771 | t_P | 0.220 |
| Y'_v | -0.315 | t_R | 0.387 |
| Y'_R (yaw rate) | 0.083 | a_H | 0.312 |
| Y'_vvv | -1.607 | x'_H | -0.464 |
| Y'_vvr | 0.379 | C_1 | 2.0 |
| Y'_vrr | -0.391 | C_2 (beta_P > 0) | 1.6 |
| Y'_rrr | 0.008 | C_2 (beta_P < 0) | 1.1 |
| N'_v | -0.137 | gamma_R (beta_R < 0) | 0.395 |
| N'_R (yaw rate) | -0.049 | gamma_R (beta_R > 0) | 0.640 |
| N'_vvv | -0.030 | l'_R | -0.710 |
| N'_vvr | -0.294 | eps | 1.09 |
| N'_vrr | 0.055 | kappa | 0.50 |
| N'_rrr | -0.013 | f_alpha | 2.747 |

Also from Table 2 and Section 5.1 [quoted]: R'_0 = 0.022 (model scale); K_T coefficients (k_0, k_1, k_2) = (0.2931, -0.2753, -0.1385); w_P0 = 0.40 (L7 model) and 0.35 (full scale); added masses from Motora's charts; radius of gyration in yaw 0.25 L_pp; rudder rate 1.76 deg/s full scale; approach speed 15.5 kn; propeller rpm held constant (no torque limit). Table 2 gives the combined coefficients the captive tests actually measure: Y'_R - m' - m'_x = -0.233, N'_R - x'_G m' = -0.059, X'_vr + m' + m'_y = 0.518, X'_rr + x'_G m' = 0.021.

x'_P (propeller position) is NOT in Table 1 of the paper; open-source re-implementations commonly use x'_P = -0.48 for KVLCC2 [from memory, unverified; I opened no such implementation].

Validation reported (Tables 4, 5) [quoted]: L7 model turning at delta = +35 deg, advance A'_D calc 3.31 vs exp 3.25, tactical diameter D'_T 3.36 vs 3.34; at -35 deg, A'_D 3.26 vs 3.11, D'_T 3.26 vs 3.08 (the paper: turning indices "about 5.8 % larger in maximum"). Zig-zag overshoots are under-predicted: 10/10 first overshoot 5.2 vs 8.2 deg, second 15.8 vs 21.9 deg; 20/20 first 10.9 vs 13.7 deg. Full-scale simulation gives A'_D and D'_T about 10 % larger than model scale because the rudder normal force at full scale is 20-40 % smaller (lighter propeller loading).

### Validity for this ship
The structure (Eqs. 4-25) is general for a conventional displacement ship at moderate speed. The KVLCC2 numbers are for a full-bodied tanker (C_b 0.81, L/B 5.5) and must NOT be reused for the liner: they are a worked example only. The model has no roll, no twin or triple screws, no propeller side force, and no low-speed or astern regime (beta and r' blow up as U goes to 0; see M10).

## M2. Regression formulas for the hydrodynamic derivatives

Ship numbers used for every "Titanic check" below (computed here, not from any source): L = 259.08 m, B = 28.19 m, d = 10.0 m, C_b = 0.68, so B/L = 0.10881, d/B = 0.3547, B/d = 2.819, L/B = 9.19, k = 2d/L = 0.0772, C_b B/L = 0.0740, m' = 2 C_b B/L = 0.1480 (MMG L-d basis).

### M2(a) Kijima, Katsuno, Nakiri and Furukawa 1990 (J. Soc. Naval Arch. Japan 168, starting p. 141)

The original is a scanned Japanese PDF on J-STAGE (https://www.jstage.jst.go.jp/article/jjasnaoe1968/1990/168/1990_168_141/_article); I could not read its equations (no text layer reachable), so everything below is [secondary].

**Model form** [quoted from Kijima and Nakiri, MARSIM 2003, Eqs. 1-5, read as images at https://nippon.zaidan.info/seikabutsu/2003/00574/contents/0305.htm; the same form is reproduced in the two MDPI papers below]. Kijima writes the motion in drift angle and speed, origin at midship, and drops the x_G coupling:

    (m'+m'_x)(L/U)((dU/dt)/U cos(beta) - (d beta/dt) sin(beta)) + (m'+m'_y) r' sin(beta) = X'
    -(m'+m'_y)(L/U)((dU/dt)/U sin(beta) + (d beta/dt) cos(beta)) + (m'+m'_x) r' cos(beta) = Y'
    (I'_zz + i'_zz)(L/U)^2 ((dU/dt)/L r' + (U/L) dr'/dt) = N'
    m', m'_x, m'_y = (m, m_x, m_y)/(0.5 rho L^2 d);  I'_zz, i'_zz = (I_zz, i_zz)/(0.5 rho L^4 d)
    X', Y' = (X, Y)/(0.5 rho L d U^2);  N' = N/(0.5 rho L^2 d U^2);  r' = r L/U

    X'_H = X'_beta_r r' sin(beta) + X'_uu cos^2(beta)
    Y'_H = Y'_beta beta + Y'_r r' + Y'_bb beta|beta| + Y'_rr r'|r'| + (Y'_bbr beta + Y'_brr r') beta r'
    N'_H = N'_beta beta + N'_r r' + N'_bb beta|beta| + N'_rr r'|r'| + (N'_bbr beta + N'_brr r') beta r'

Note the Kijima form uses beta (positive when the ship slides to port, as in MMG) and absolute-value quadratic terms, whereas the MMG standard uses v'_m = -sin(beta) and cubic terms. So Y'_beta (Kijima) corresponds to -Y'_v (MMG) and N'_beta to -N'_v. The nonlinear coefficients of the two families are NOT interchangeable.

**The 1990 formula set** [secondary: identical reproduction in two papers by the same group: "Estimation of Maneuverability of Fishing Vessel Considering Hull-Form Characteristics", J. Mar. Sci. Eng. 2021, 9(6), 569, Eq. 7, https://www.mdpi.com/2077-1312/9/6/569; and "Estimation of Maneuverability of Trawl Fishing Vessel Using an Analytical Method", J. Mar. Sci. Eng. 2021, 9(8), 854, Eq. 7, https://www.mdpi.com/2077-1312/9/8/854; equations read from the MathML source]. k = 2d/L.

| Coefficient | Formula (Kijima 1990, as reproduced) | Titanic check |
|---|---|---|
| Y'_beta | 0.5 pi k + 1.4 C_b B/L | 0.225 |
| Y'_bb | 2.5 d(1 - C_b)/B + 0.5 | 0.784 |
| Y'_r - (m' + m'_x) | -1.5 C_b B/L | -0.111 |
| Y'_rr | 0.343 d C_b/B - 0.07 | 0.013 |
| Y'_brr | 5.95 d(1 - C_b)/B | 0.675 |
| Y'_bbr | 1.5 d C_b/B - 0.65 | -0.288 |
| N'_beta | k | 0.0772 |
| N'_bb | -0.96 d(1 - C_b)/B + 0.066 | -0.043 |
| N'_r | -0.54 k + k^2 | -0.0357 |
| N'_rr | 0.5 C_b B/L - 0.09 | -0.053 |
| N'_brr | -(0.5 d C_b/B - 0.05) | -0.071 |
| N'_bbr | -{57.5 (C_b B/L)^2 - 18.4 C_b B/L + 1.6} | -0.553 |
| 1 - t_R | 0.28 C_b + 0.55 | 0.740 |
| a_H | 2.2835 C_b^2 - 0.833 C_b | 0.489 (SUSPECT, see below) |
| x'_H | 9.72289 C_b^2 - 8.243538 C_b - 0.00498539 | -1.11 (IMPOSSIBLE, see below) |
| 1 - w_P0 | 1.05 - 0.5 C_b | 0.71 |
| eps = (1 - w_R0)/(1 - w_P0) | -156.2 (C_b B/L)^2 + 41.6 (C_b B/L) - 1.76 | 0.46 (implausible) |
| gamma | -22.2 (C_b B/L)^2 + 0.02 (C_b B/L) + 0.68 | 0.56 |

Cross-check of the linear terms against a second, independent reproduction [quoted image, MARSIM 2003 fishing-vessel paper, Eq. 11, https://nippon.zaidan.info/seikabutsu/2003/00574/contents/0441.htm, image 564_08.gif]: Y'_beta0 = 0.5 pi k + 1.4 C_b/(L/B); (Y'_r - m'_x)_0 = 0.5 C_b/(L/B); N'_beta0 = k; N'_r0 = -0.54 k + k^2. The Y'_r forms differ on their face (+0.5 vs -1.5) but AGREE, because m' = 2 C_b B/L exactly in this nondimensionalisation: (Y'_r - m'_x) - m' = 0.5 C_b B/L - 2 C_b B/L = -1.5 C_b B/L. Implementers must know which of the two forms they hold.

Three red flags in the MDPI reproduction of the interaction coefficients:
1. x'_H = 9.72289 C_b^2 - 8.243538 C_b - 0.005 gives -1.11 at C_b 0.68 and -0.30 at C_b 0.81 (computed here). An acting point more than one ship length aft of midship is physically impossible; the MMG paper reports measured values near -0.45. Do not use.
2. a_H = 2.2835 C_b^2 - 0.833 C_b gives 0.82 at C_b 0.81 (KVLCC2 measured 0.312). Do not use without the primary source.
3. eps from the C_b B/L parabola peaks at 1.01 (C_b B/L = 0.133) and falls to 0.46 at the liner's 0.074: extrapolation failure.
These may be transcription errors or local refits by the reproducing authors; I could not check the primary.

**Fitting range** [secondary, same MDPI papers, Table 1/2 of 9(8):854, "13 model merchant ships", even keel, full load]: VLCC/ULCC (C_b 0.80-0.835), cargo (0.65-0.77), container (0.566-0.572), RO/RO (0.557), car carrier (0.522), LNG (0.714); L/B 4.51-6.90; B/d 2.38-4.09 (computed here from the listed B and d); k from 0.080 to 0.146 (computed); C_b B/L from 0.082 to 0.182 (computed). The 1990 paper's own abstract (J-STAGE) adds that it covers half-loaded, ballast and trim-by-stern conditions.

**Titanic inside?** C_b 0.68 and B/d 2.82: inside. L/B 9.19: FAR OUTSIDE (max 6.90). C_b B/L 0.074: below the minimum 0.082. k 0.077: just below 0.080. Verdict: the linear terms (which are slender-body based: pi k/2, k, -0.54k + k^2) extrapolate gracefully; the C_b B/L polynomials (N'_bbr, eps, gamma) and the interaction coefficients do not.

Accuracy outside the fitted family [quoted, 9(8):854 Table 4]: applied to an 85 m stern trawler, Kijima 1990 over-predicted the sea-trial advance, transfer and tactical diameter by 43 %, 55 % and 50 %.

**Kijima and Nakiri 2003 update** [quoted images, MARSIM 2003, "On the Practical Prediction Method for Ship Manoeuvring Characteristics", K. Kijima and Y. Nakiri, Eqs. 6-7, https://nippon.zaidan.info/seikabutsu/2003/00574/contents/0305.htm and 0306.htm; database "15 kinds of ships and their 48 loading conditions"]. It adds aft-body shape parameters (Mori): e_a = (L/B)(1 - C_pa); e'_a = e_a / sqrt(1/4 + 1/(B/d)^2); sigma_a = (1 - C_wa)/(1 - C_pa); K = (1/e'_a + 1.5/(L/B) - 0.33)(0.95 sigma_a + 0.40), where C_wa and C_pa are the waterplane and prismatic coefficients of the aft body between A.P. and station 5. Then:

    Y'_beta = 0.5 pi k + 1.9257 (C_b B/L) sigma_a
    Y'_r - (m' + m'_x) = 0.25 pi k + 0.052 e'_a - 0.457
    Y'_bb = -1.199 C_b sigma_a + 1.05
    Y'_rr = 0.225 (d C_b/B) e'_a - 0.12
    Y'_brr = 7.1256 {d(1 - C_b)/B}
    Y'_bbr = 10.443 [{d(1 - C_b)/B} e'_a]^2 - 9.374 {d(1 - C_b)/B} e'_a + 1.227
    N'_beta = k [15.0668 {d(1 - C_b)/B e'_a K}^2 - 23.819 {d(1 - C_b)/B e'_a K} + 1.802]
    N'_r = -0.54 k + k^2 - 0.0477 e'_a K + 0.0368
    N'_bb = 43.857 {d(1 - C_b)/B e'_a K}^2 - 3.671 {d(1 - C_b)/B e'_a K} + 0.086
    N'_rr = 0.15 K - 0.068
    N'_brr = -0.4086 C_b + 0.27
    N'_bbr = -0.826 {d(1 - C_b)/B} e'_a - 0.026

The scan is low resolution; the subscripts of the last two lines (brr vs bbr) are hard to read and I assigned them by the order used in the 1990 listing. The rudder model of both Kijima papers [quoted, Eq. 12 of the 2003 paper] is NOT the MMG-standard one: F'_N = (A_R/(L d)) C_N U'_R^2 sin(alpha_R); C_N = 6.13 K_R/(K_R + 2.25) (K_R rudder aspect ratio); U'_R^2 = (1 - w_R)^2 {1 + C g(s)}; g(s) = eta K {2 - (2 - K) s} s/(1 - s)^2; eta = D_P/h_R; K = 0.6 (1 - w_P)/(1 - w_R); s = 1 - (1 - w_P) U cos(beta)/(n P) (P = propeller pitch); w_R = w_R0 w_P/w_P0; alpha_R = delta - gamma beta'_R; beta'_R = beta - 2 x'_R r'; x'_R about -0.5. Its propeller wake is w_P = w_P0 exp(-4.0 beta'_P^2), beta'_P = beta - x'_P r', x'_P about -0.5 [quoted, Eq. 9]. C is a port/starboard asymmetry coefficient; its value is not on the pages I read. The 2003 paper says gamma and w_R0 are treated as fitted "effective" values (gamma_E, w_R0E), not their physical meaning; their 2003 formulas were not on the pages I read.

For this ship the 2003 set needs C_wa and C_pa of the aft body, which the flooding model's hull offsets can supply at any draft and trim; but the e'_a, K polynomials were fitted on the same kind of merchant hulls (verification ships L/B 5.0-6.1), so the extrapolation risk is the same.

### M2(b) Inoue, Hirano and Kijima 1981 (Int. Shipbuilding Progress 28(321):112-125), trim corrections

Original not opened (paywalled; https://content.iospress.com/articles/international-shipbuilding-progress/isp28-321-03). [secondary: AVEVA Marine (Hydronamics) technical reference, "Effect of Trim on the Hydrodynamic Derivatives", https://docs.aveva.com/bundle/hull-and-outfitting/page/1122952.html, its Eqs. 23-26 read as images; it attributes them to "Inoue and others"]:

    Y'_v(tau) = Y'_v(0) (1 + (2/3) tau/T_M)
    N'_v(tau) = N'_v(0) (1 - (0.27/eps_beta) tau/T_M),   eps_beta = N(0)/Y(0)  [i.e. N'_v(0)/Y'_v(0), the lever]
    N'_r(tau) = N'_r(0) (1 + 0.30 tau/T_M)
    Y'_r(tau) = Y'_r(0) (1 + 0.80 tau/T_M)
    tau = T_a - T_f  (positive BY THE STERN)

AVEVA prints T_M = (T_a - T_f)/2, which must be a typo for the mean draft (T_a + T_f)/2. My memory of the Inoue paper agrees with the four constants 2/3, 0.27, 0.30, 0.80 [from memory, consistent with the secondary]. The range of tau/T_M over which Inoue fitted these is NOT verified; the experiments were on trim by the stern of the order of ballast trims.

### M2(c) Clarke, Gedling and Hine 1983 (Trans. RINA 125:45-68), linear derivatives and added masses

Original not opened. [secondary: T. I. Fossen's Marine Systems Simulator, `CRAFT/SHIP/models/clarke83.m`, https://github.com/cybergalactic/MSS, which cites Clarke et al. 1983]. Nondimensionalised on L only (added mass / (0.5 rho L^3), damping / (0.5 rho L^2 U), moments with an extra L), with S = pi (T/L)^2:

    Y'_vdot = -S (1 + 0.16 C_B B/T - 5.1 (B/L)^2)
    Y'_rdot = -S (0.67 B/L - 0.0033 (B/T)^2)
    N'_vdot = -S (1.1 B/L - 0.041 B/T)
    N'_rdot = -S (1/12 + 0.017 C_B B/T - 0.33 B/L)
    Y'_v    = -S (1 + 0.4 C_B B/T)
    Y'_r    = -S (-1/2 + 2.2 B/L - 0.08 B/T)
    N'_v    = -S (1/2 + 2.4 T/L)
    N'_r    = -S (1/4 + 0.039 B/T - 0.56 B/L)

The MSS code notes that the damping terms came from rotating-arm tests and the acceleration terms from PMM tests, and that sign is set by the brackets (Y'_r can change sign with proportions). Fossen's sign convention: y to starboard, z down, as in MMG.

Titanic check (computed here): S = 0.004680; Y'_v = -0.00827, Y'_r = +0.00228, N'_v = -0.00277, N'_r = -0.00140, Y'_vdot = -0.00583, Y'_rdot = -0.00022, N'_vdot = -0.00002, N'_rdot = -0.00037. Converted to the MMG L-d basis (multiply by L/d = 25.9): Y'_v = -0.214, N'_v = -0.0719, N'_r = -0.0363, Y'_r = +0.059. Compare Kijima 1990: Y'_v = -0.225, N'_v = -0.0772, N'_r = -0.0357. The two independent regressions agree within 5-7 % on the three terms that set course stability, which is some evidence that the linear terms are usable for this ship even outside the fitted L/B range.

Range: not verified for Clarke's own data set. The AVEVA/BMT database regression (descended from the BMT data Clarke worked with; relationship not verified) states merchant-ship limits [quoted, https://docs.aveva.com/bundle/hull-and-outfitting/page/1122967.html]: C_B 0.48-0.85, L/B 4.0-8.0, L/T 13.66-40.11, B/T 2.15-6.247, LCG/L -0.05 to 0.057, 1-4 propellers, 1-4 rudders, rudder aspect ratio 0.75-2.80. Titanic: L/B 9.19 outside; L/T 25.9, B/T 2.82, C_B 0.68 inside.

### M2(d) Yoshimura and Masumoto 2012 (MARSIM 2012) / 2011 (J. JASNAOE 14:63, doi 10.2534/jjasnaoe.14.63)

NOT FOUND. The database covers "medium high-speed merchant ships including fishing vessels" (title), which is the closest family to a fine-lined liner, but I could not reach any text of the formulas (the J-STAGE PDF returned errors, the MARSIM paper is not online in HTML, and no reproduction turned up in open HTML sources). It remains the first thing to obtain from a library: if its range includes container ships with C_b about 0.6-0.7 and L/B up to about 7-8, it is the best-fitting regression family for this ship.

### M2(e) Interaction coefficients: what is defensible

- MMG standard typical values [quoted, Yasukawa and Yoshimura 2015, Section 2.5]: a_H "almost 0.3-0.4"; x_H "almost -0.45 L_pp"; x_R = -0.5 L_pp; l'_R measured near -1.0 (KVLCC2: -0.710); gamma_R below 1, different for port and starboard (KVLCC2 0.395/0.640); eps 1.09 and kappa 0.50 for KVLCC2; t_R 0.387 for KVLCC2; a_H decreases slightly with propeller load.
- Kijima 1990 [secondary, above]: 1 - t_R = 0.28 C_b + 0.55 (t_R = 0.26 for this ship), 1 - w_P0 = 1.05 - 0.5 C_b, gamma = 0.56 for this ship; a_H, x'_H and eps as reproduced are unusable here.
- Aoki et al. 2006 and the ITTC Manoeuvring Committee summaries: not reached (PDF only).
- [my recommendation] Treat t_R, a_H, x'_H, gamma_R, l'_R, eps, kappa as a small parameter set with physically bounded defaults (t_R 0.25-0.4, a_H 0.2-0.4, x'_H -0.40 to -0.48, gamma_R 0.4-0.6, l'_R -0.7 to -1.0, eps 0.9-1.1, kappa 0.5-0.6) and tune them against the turning-circle data available for Olympic-class trials, rather than trusting any regression at L/B 9.2.

## M3. Added masses and inertia

**Surge** [secondary: MSS `LIBRARY/modeling/addedMassSurge.m`, citing H. Soding (1982), "Prediction of ship steering capabilities", Schiffstechnik, pp. 3-29]: m_x = A_11 = 2.7 rho nabla^(5/3) / L^2. Titanic check (nabla about 50,700 m^3): m_x about 2,870 t, i.e. 5.5 % of the mass (computed here). The MMG KVLCC2 value m'_x = 0.022 against m' = 0.293 is 7.5 % [computed from the quoted Table 3].

**Sway and yaw** [secondary: Clarke et al. 1983 via MSS, formulas in M2(c)]. Titanic check in the MMG L-d basis: m'_y = 0.151 (m_y/m = 1.02); J'_z = 0.0097 (J_z/(m L^2) = 0.066, i.e. an added radius of gyration about 0.26 L). Clarke's Y'_rdot and N'_vdot are small (cross terms; the MMG standard neglects them).

**Motora's charts** [quoted, MMG paper, Section 5.1]: the MMG standard estimates m'_x, m'_y and J'_z "by Motora's empirical charts" (Motora 1959-1960, J. Soc. Naval Arch. Japan 105-106, in Japanese). A closed-form regression of Motora's charts (often attributed to Zhou et al.) is widely used in Chinese and Korean MMG papers; I did NOT find it in an open HTML source, so its constants are not given here. A Japanese summary returned by search notes these regressions were built mainly for full-bodied bulk carriers and tankers.

**Strip theory alternative** [from memory, unverified]: sway added mass per unit length from Lewis-form sections, m_22(x) = C_22(H, sigma) rho pi T(x)^2 / 2, integrated over the length (and x^2 m_22 for J_z). For a slender ship the zero-frequency sway added mass is close to the displaced mass; this is consistent with Clarke's m_y/m = 1.02 above. The advantage for this project: the strip integral can be evaluated on the flooding model's instantaneous immersed sections, so it follows draft, trim and heel automatically.

**Radius of gyration in yaw** [quoted, MMG paper, Section 5.1: 0.25 L_pp for KVLCC2] and [secondary, MSS clarke83.m comment: about 0.25 L for smaller vessels, 0.27 L for tankers]. For the liner, 0.25 L is the defensible default; a mass-distribution calculation from the flooding model (which already carries the floodwater mass) is better, and floodwater concentrated forward raises I_zz about midship and moves x_G forward.

**Floodwater** [my remark]: in the MMG equations m and I_zG include the floodwater only if it moves with the ship. Free-surface water in partly flooded compartments does not follow yaw accelerations fully; a simple choice is to include it in m and I_zG, and note the error.

## M4. Roll coupling (4-DOF)

**What the 4-DOF MMG extension does** [quoted, abstract of H. Yasukawa, R. Sakuno and Y. Yoshimura, "Practical maneuvering simulation method of ships considering the roll-coupling effect", J. Mar. Sci. Technol. 24:1280-1296 (2019), https://doi.org/10.1007/s00773-019-00625-4; full text paywalled, only the abstract read]: the model extends the 3-DOF MMG model "adding the motion equation of roll"; "The roll moment acting on the hull is estimated by multiplying the hull lateral force with the vertical acting point"; the roll-related derivatives and the vertical acting point "are estimated by simple formulae constructed based on the experimental data of four ship models"; validated on a pure car carrier with varying GM. The formulae themselves (z_H as a function of draft, Y'_phi, N'_phi) are NOT in this file: paywalled. Yasukawa and Yoshimura 2014 (Ship Technology Research 61:16-32), Hirano and Takashina 1980 and Son and Nomoto 1981 were not reachable as text.

**A complete, coded 4-DOF example: the Son and Nomoto container ship** [secondary: Fossen's MSS `CRAFT/SHIP/models/container.m`, which cites K. Son and K. Nomoto, "On the coupled motion of steering and rolling of a high speed container ship", J. Soc. Naval Arch. Japan 150 (1981), reprinted in Naval Architecture and Ocean Engineering 20:73-83 (1982)]. Ship: L 175 m, B 25.40 m, d_F 8.00 m, d_A 9.00 m, nabla 21,222 m^3, GM 0.3 m, rudder area 33.04 m^2, propeller diameter 6.533 m, rudder limit 10 deg, rudder rate 5 deg/s. (C_b about 0.56 and L/B 6.9, computed here: a fine, fast, low-GM ship, the closest public analogue to a flooding liner.) Nondimensionalisation on L only (mass / (0.5 rho L^3), forces / (0.5 rho L^2 U^2), moments / (0.5 rho L^3 U^2)); y to starboard, z down, phi positive starboard down.

Structure as coded (subscripts 2 = sway v, 3 = roll p, 4 = yaw r):

    mass matrix: m22 = m + m_y;  m32 = -m_y l_y;  m42 = m_y alpha_y;  m33 = I_x + J_x;  m44 = I_z + J_z
    Y = Y_v v + Y_r r + Y_p p + Y_phi phi + Y_vvv v^3 + Y_rrr r^3 + Y_vvr v^2 r + Y_vrr v r^2
        + Y_vvphi v^2 phi + Y_vphiphi v phi^2 + Y_rrphi r^2 phi + Y_rphiphi r phi^2
        + (1 + a_H) F_N cos(delta) - (m + m_x) u r
    K = (same polynomial with K coefficients) - (1 + a_H) z_R F_N cos(delta) + m_x l_x u r - W GM phi
    N = (same polynomial with N coefficients) + (x_R + a_H x_H) F_N cos(delta)
    X = X_uu u^2 + (1 - t) T + X_vr v r + X_vv v^2 + X_rr r^2 + X_phiphi phi^2 + c_RX F_N sin(delta) + (m + m_y) v r

Selected coefficient values [secondary, same file]: Y_v -0.0116, Y_r 0.00242, Y_phi -0.000063; K_v 0.0003026, K_r -0.000063, K_p -0.0000075, K_phi -0.000021; N_v -0.0038545, N_r -0.00222, N_p 0.000213, N_phi -0.0001424; N_vvphi -0.019058, N_vphiphi -0.0053766, N_rrphi -0.0038592, N_rphiphi 0.0024195; a_H 0.237, x_H -0.48, z_R 0.033, x_R -0.5, t 0.175, w_P 0.184, x_P -0.526, gamma 0.088, epsilon 0.921, k (slipstream) 0.631, alpha_y 0.05, l_x = l_y 0.0313, m 0.00792, m_y 0.007049, I_x 0.0000176, J_x 0.0000034; open-water K_T = 0.527 - 0.455 J.

Derived checks (computed here, not in the source):
- Vertical acting point of the hull lateral force: K_v/Y_v = -0.026 L = 4.6 m below G. With KG about 10.1 m (KM 10.39 minus GM 0.3), the force acts about 5.5 m above the keel, i.e. at about 0.35 d below the waterline, not at d/2.
- Rudder force acts z_R = 0.033 L = 5.8 m below G, about mid-span of the rudder.
- Heel-induced yaw: N_phi converted to the MMG L-d basis is about -0.0029 per radian; at 10 deg heel this equals the yaw moment of a drift angle of about 0.4 deg. Small, but it is a steady bias that the helm must hold during a list. Sign: phi > 0 (starboard down) gives N < 0 (bow to port), i.e. the ship tends to turn towards the HIGH side.

**Steady heel in a turn, the classic lever** [secondary, AVEVA "Heeling Moments" page, https://docs.aveva.com/bundle/hull-and-outfitting/page/1122496.html]:
- IMO A.749(18) form: heeling lever h = 0.02 V_0^2 (KG - d/2) / L (h in m, V_0 in m/s, L waterline length). AVEVA calls V_0 the "speed of the vessel in the turn"; in the IMO code V_0 is the service speed and the 0.02 (= 0.196/g) carries an assumed speed loss and turning radius. [The derivation 0.196 = 0.7^2/2.5, i.e. 70 % speed in a turn of radius 2.5 L, is from memory, unverified.] The same moment appears in the 2008 IS Code as M_R = 0.200 (V_0^2/L_WL) Delta (KG - d/2) with a 10 deg heel limit for passenger ships [secondary, search-result summaries of the IS Code; not opened].
- UK naval standard NES 109: lever = V^2 h cos(theta)/(R g), V = speed in the turn (65 % of approach speed), h = vertical separation of G and the half-draft point, R = steady turning radius.
- Physics: centrifugal force m V^2/R acts at G, the hydrodynamic lateral force at roughly mid-draft (the Son-Nomoto numbers above say nearer 0.35 d below the waterline), so the ship heels OUTWARD in the steady turn by phi = atan(lever/GM) to first order. The rudder force acts low and on the other side, so there is a brief INWARD heel when the helm is first put over.
- Titanic check (computed here): V_0 = 11.3 m/s, KG about 10.7 m (assumed: GM 0.8 m plus a KM I did not verify), d = 10 m, L = 259 m: h = 0.02 x 127.7 x 5.7 / 259 = 0.056 m; intact GM 0.8 m gives about 4 deg steady outward heel; GM 0.3 m (flooding) gives about 11 deg. That is enough to matter, so the roll DOF (or at least a quasi-static heel from this lever) belongs in the model.

**Minimal roll treatment I would defend** [my recommendation]: one roll equation (I_x + J_x) dp/dt = K_H + K_R - Delta g GZ(phi) - K_damp(p), with K_H = -z_H Y_H (hull lateral force times its vertical lever, as Yasukawa et al. 2019 do), K_R = -z_R Y_R (rudder force times rudder lever), GZ(phi) taken from the flooding model's own hydrostatics (it already computes heel equilibrium), and z_H as a fraction of the instantaneous draft to be tuned (0.35-0.5 d below the waterline on the evidence above). Roll damping and J_x are not covered by any source I opened.

## M5. Draft, trim and heel dependence

**Nondimensionalising with the instantaneous draft.** Both MMG (Yasukawa and Yoshimura 2015) and Kijima nondimensionalise forces by 0.5 rho L d U^2 [quoted, M1 and M2]. Kijima et al. 1990 is explicitly a loading-condition model (title: "with the parameter of loading condition"; abstract: half loaded, ballast and trim by stern [secondary, J-STAGE abstract]); its inputs k = 2d/L, d/B and C_b are meant to be evaluated at the actual draft. So recomputing the derivatives from the instantaneous mean draft, C_b and B at that draft is the intended use, and the dimensional forces then scale correctly. The MARSIM 2003 fishing-vessel paper used an "effective mean draught" and tau' = trim/d_em [quoted text, nippon.zaidan.info page 0441]. Caveats: (1) the regressions were fitted on intact ships at design-like loadings, not on a ship whose bow is down by several metres; (2) C_b must be recomputed from the immersed volume, length and breadth at the new waterline, which the flooding model has.

**Trim corrections available**
- Inoue et al. 1981 (M2(b)), tau positive by the stern: Y'_v x (1 + (2/3) tau'), N'_v x (1 - (0.27/eps_beta) tau'), N'_r x (1 + 0.30 tau'), Y'_r x (1 + 0.80 tau'), tau' = tau/T_M. For trim BY THE BOW (tau' < 0) every factor moves in the destabilising direction: less side force and damping, more destabilising Munk moment.
- Kijima 1990 has its own trim correction with a C_b/(L/B) parameter [secondary: the MARSIM 2003 fishing-vessel paper states this]; its constants are NOT in this file (primary unreadable).
- The fishing-vessel refit [quoted image, nippon.zaidan.info page 0441, Eq. 10]: Y'_beta = Y'_beta0 (1 + 0.6 tau'^2); Y'_r - m'_x = (Y'_r - m'_x)_0 (0.4 + 1.8 tau'^2) as the low-resolution image reads; N'_beta = N'_beta0 (1 - 0.9 tau'); N'_r = N'_r0. Stern trawlers only. A later version of evidently the same fit (Yoshimura et al. 2009, quoted in M10) reads {1 + 0.54 (tau/d)^2}, {1 + 1.82 (tau/d)^2}, {1 - 0.51 tau/(d C_b)} and {1 + 1.79 (tau/B)^2}, so the "0.4" is probably a misprint or a misreading of "1 +". **The two reproductions disagree; the 2009 form is the self-consistent one (factor 1 at zero trim).**
- Numbers for this ship (computed here): 2 deg of trim by the head is 9 m over 259 m, tau' = -0.9 on a 10 m mean draft. Inoue's linear factors then give Y'_v x 0.40, Y'_r x 0.28, N'_r x 0.73 and N'_v x 1.7 or more: well beyond anything fitted, and the linear form changes sign at about tau' = -1.25 (Y'_r) and -1.5 (Y'_v). Ten degrees by the head is tau' of about -4.5. **No published regression covers this; the corrections must be clamped or replaced.**

**Physically based replacement (my derivation; standard slender-body reasoning, not from a source I opened):** the leading term of Kijima's Y'_beta, 0.5 pi k = pi d/L, is the slender-body (low-aspect-ratio wing) side force, dimensionally Y_v = -(pi/2) rho U T_stern^2, governed by the draft at the trailing edge (the stern); the destabilising Munk moment scales with the integral of T(x)^2 along the length. With trim by the bow the stern draft falls and the forward draft rises, so Y_v and the stern's stabilising contribution fall roughly as (T_aft/d)^2 while the Munk moment grows. Evaluating these terms by a strip sum over the instantaneous immersed sections (which the flooding model already knows, including heel), and scaling Kijima's or Clarke's even-keel values by the ratio of strip results (trimmed / even keel), gives a correction that (a) reproduces Inoue's signs at small trim, (b) goes to zero side force from the stern as the stern lifts out, and (c) never changes sign spuriously. This is a design suggestion for the brainstorm, not a validated method.

**Propeller and rudder immersion** [my remark]: the MMG rudder force is proportional to A_R; the natural immersion model is A_R(eff) = immersed rudder area and eta = D_P/H_R evaluated with the immersed span, F_N scaled by the immersed fraction, and the propeller thrust reduced when the tip emerges (ventilation). I found no open source with an immersion correction for MMG rudder or propeller forces; treat as a modelling assumption and say so.

**Heel dependence.** The 4-DOF models carry explicit phi terms (Son and Nomoto: Y_phi, K_phi, N_phi and the mixed v-phi, r-phi terms, M4). Yasukawa et al. 2019 estimate the roll-related derivatives by "simple formulae" from four ships (formulae not reached). The heel-induced yaw moment is small at small heel (M4: equivalent to about 0.4 deg drift at 10 deg heel for the container ship) but it is a persistent bias.

**Evidence on bow trim in the literature found but not read** (full texts paywalled or PDF-only): a KCS captive-model study with full-load bow trim and stern trim and CFD analysis of the course-stability change (Hiroshima University repository); free-running CFD of KCS at trims from -3 deg to +2 deg (H. Yun et al., "CFD analysis of container ship manoeuvring performance under different trim conditions", Ocean Engineering 341:122489, 2025, doi 10.1016/j.oceaneng.2025.122489; open-access manuscript on Strathprints, abstract read: no numbers in the abstract); Kijima and Kose captive tests at four trim and draught conditions (search summary only).

## M6. Resistance

The original papers (Holtrop and Mennen 1982, "An approximate power prediction method", Int. Shipbuilding Progress 29; Holtrop 1984, "A statistical re-analysis of resistance and propulsion data", ISP 31; page numbers not verified) were not opened. Two independent open implementations were read as raw source text, and they disagree in one place.

**1982 formula set** [secondary: `src/engine/holtrop.ts` of https://github.com/Playtozon/holtrop-mennen-calculator, whose tests check the 1982 worked example]. T = (T_F + T_A)/2, C_P = C_B/C_M, Fn = V/sqrt(gL), lcb in % of L forward of 0.5L.

    L_R  = L [1 - C_P + 0.06 C_P lcb/(4 C_P - 1)]
    S    = L (2T + B) sqrt(C_M) (0.453 + 0.4425 C_B - 0.2862 C_M - 0.003467 B/T + 0.3696 C_WP) + 2.38 A_BT/C_B
    1+k1 = c13 [0.93 + c12 (B/L_R)^0.92497 (0.95 - C_P)^-0.521448 (1 - C_P + 0.0225 lcb)^0.6906],  c13 = 1 + 0.003 C_stern
           c12 = (T/L)^0.2228446 if T/L > 0.05;  48.2 (T/L - 0.02)^2.078 + 0.479948 if 0.02 < T/L <= 0.05;  0.479948 otherwise
    C_F  = 0.075 / (log10(Rn) - 2)^2            (ITTC-1957),  R_F = 0.5 rho V^2 S C_F
    c7   = 0.229577 (B/L)^(1/3) if B/L < 0.11;  B/L if 0.11 <= B/L <= 0.25;  0.5 - 0.0625 L/B otherwise
    i_E  = 1 + 89 exp{-(L/B)^0.80856 (1 - C_WP)^0.30484 (1 - C_P - 0.0225 lcb)^0.6367 (L_R/B)^0.34574 (100 nabla/L^3)^0.16302}
    c1   = 2223105 c7^3.78613 (T/B)^1.07961 (90 - i_E)^-1.37565
    c3   = 0.56 A_BT^1.5 / [B T (0.31 sqrt(A_BT) + T_F - h_B)];  c2 = exp(-1.89 sqrt(c3));  c5 = 1 - 0.8 A_T/(B T C_M)
    c15  = -1.69385 if L^3/nabla < 512;  -1.69385 + (L/nabla^(1/3) - 8.0)/2.36 if 512..1727;  0 if > 1727
    c16  = 8.07981 C_P - 13.8673 C_P^2 + 6.984388 C_P^3 if C_P < 0.80;  1.73014 - 0.7067 C_P otherwise
    m1   = 0.0140407 L/T - 1.75254 nabla^(1/3)/L - 4.79323 B/L - c16
    m2   = c15 C_P^2 exp(-0.1 Fn^-2)
    lambda = 1.446 C_P - 0.03 L/B if L/B < 12;  1.446 C_P - 0.36 otherwise
    R_W  = c1 c2 c5 nabla rho g exp[m1 Fn^-0.9 + m2 cos(lambda Fn^-2)]
    C_A  = 0.006 (L + 100)^-0.16 - 0.00205 + 0.003 sqrt(L/7.5) C_B^4 c2 (0.04 - c4),  c4 = min(T_F/L, 0.04)
    R_T  = R_F (1 + k1) + R_APP + R_W + R_B + R_TR + R_A,   R_A = 0.5 rho V^2 S C_A

(bulb R_B, transom R_TR and appendage R_APP formulas are in the same file; this hull has no bulb and no transom.)

**1984 revision** [secondary: `PropulsionResistancePower.py` of https://github.com/Albert-Gil/Ship-Propulsion-Power-Simulator; agrees with my memory of Holtrop 1984]:

    1+k1 = 0.93 + 0.487118 c14 (B/L)^1.06806 (T/L)^0.46106 (L/L_R)^0.121563 (L^3/nabla)^0.36486 (1 - C_P)^-0.604247,  c14 = 1 + 0.011 C_stern
    m4   = 0.4 c15 exp(-0.034 Fn^-3.29)                 (replaces m2)
    R_W(Fn < 0.4)  = c1 c2 c5 nabla rho g exp[m1 Fn^-0.9 + m4 cos(lambda Fn^-2)]
    c17  = 6919.3 C_M^-1.3346 (nabla/L^3)^2.00977 (L/B - 2)^1.40692;  m3 = -7.2035 (B/L)^0.326869 (T/B)^0.605375
    R_W(Fn > 0.55) = c17 c2 c5 nabla rho g exp[m3 Fn^-0.9 + m4 cos(lambda Fn^-2)];  linear interpolation in between

**Disagreement between reproductions:** the Albert-Gil code selects lambda = 1.446 C_P - 0.03 L/B when L/B >= 12 and 1.446 C_P - 0.36 when L/B < 12, the reverse of the Playtozon code and of my memory of the paper. The Playtozon order is the continuous one (both branches give 1.446 C_P - 0.36 at L/B = 12), so the Albert-Gil branch is a bug. It also fixes c15 = -1.69385, valid only for L^3/nabla < 512 (true for this ship: 343).

**Validity** [secondary: "Ranges as commonly quoted from Holtrop and Mennen", `validity.ts` of the Playtozon repository]:

| Type | Fn max | C_P | L/B | B/T |
|---|---|---|---|---|
| Tankers, bulk carriers | 0.24 | 0.73-0.85 | 5.1-7.1 | 2.4-3.2 |
| Trawlers, coasters, tugs | 0.38 | 0.55-0.65 | 3.9-6.3 | 2.1-3.0 |
| Container ships, destroyers | 0.45 | 0.55-0.67 | 6.0-9.5 | 3.0-4.0 |
| Cargo liners | 0.30 | 0.56-0.75 | 5.3-8.0 | 2.4-4.0 |
| Ro-ro ships, car ferries | 0.35 | 0.55-0.67 | 5.3-8.0 | 3.2-4.0 |

Titanic: Fn 0.230 at 22.5 kn, C_P about 0.70, L/B 9.19, B/T 2.82. It sits between two classes: "cargo liner" fits C_P, B/T and Fn but not L/B (8.0 max); "container ship" fits L/B and Fn but not C_P (0.67 max) or B/T (3.0 min). Mild extrapolation either way; Fn 0.23 is comfortably inside.

**Order-of-magnitude check for this ship** (computed here with ASSUMED C_M 0.975, C_WP 0.78, lcb 0, no bulb or transom, 1984 form factor, L/B < 12 branch; not a validated prediction): S about 9,300 m^2, C_F 0.00137, 1+k1 about 1.13, R_F(1+k1) about 990 kN, R_W about 410 kN, R_A about 190 kN, total about 1,600 kN before appendages (bossings, rudder, bilge keels), i.e. P_E about 19-20 MW (26,000 ehp) at 22.5 kn. With a propulsive efficiency of 0.55-0.60 that needs roughly 33-36 MW (44,000-48,000 shp), the right order for this ship's machinery. The C_A formula is for modern welded hulls; a riveted 1911 hull would sit higher.

**Alternatives suited to a 1911 liner** [from memory, unverified]: the Taylor Standard Series as reanalysed by Gertler (1954, DTMB Report 806; bibliographic details confirmed by library catalogue records, data not opened) is built on a twin-screw cruiser parent of the same era. Its range as I remember it (C_P 0.48-0.86, B/T 2.25-3.75, displacement-length ratio about 20-250 long tons/(0.01 L_ft)^3) covers this ship (C_P 0.70, B/T 2.82, about 85). It gives residuary resistance from charts or tables, which would have to be digitised. Guldhammer-Harvald: not checked.

**Resistance with drift and yaw rate.** In the MMG standard (M1), X'_H = -R'_0 + X'_vv v'^2 + X'_vr v' r' + X'_rr r'^2 + X'_vvvv v'^4 [quoted]. For KVLCC2, X'_vv = -0.040, X'_vr + m' + m'_y = 0.518, X'_rr + x'_G m' = 0.021, X'_vvvv = 0.771, R'_0 = 0.022 [quoted, Tables 2-3]. The main speed-loss mechanism in a turn is not the drag terms but the inertial coupling (m + m_y) v_m r on the left of the surge equation (Eq. 4): with v_m < 0 and r > 0 in a starboard turn it decelerates the ship, together with the rudder drag X_R and the hull-induced X'_vr. Kijima's alternative form is X'_H = X'_beta_r r' sin(beta) + X'_uu cos^2(beta) [quoted, Kijima and Nakiri 2003, Eq. 4]. Yoshimura and Masumoto's fine-ship regression for the combined term is m'_y + X'_vr = 2.86 C_b (B/L) - 0.21 [quoted from the PDF text of Yoshimura, Nakao and Ishibashi 2009, Eq. 17; fitted mainly on fishing vessels]: 0.002 for this ship, i.e. X'_vr about -m'_y. Resistance change with trim: no formula found. The Playtozon tool merely flags |T_F - T_A|/T > 0.1 as "large trim".

## M7. Propellers

### Wageningen B-series open water (first quadrant)

[quoted: M. M. Bernitsas, D. Ray and P. Kinley, "K_T, K_Q and efficiency curves for the Wageningen B-series propellers", University of Michigan, Dept. of Naval Architecture and Marine Engineering, Report No. 237, May 1981, https://hdl.handle.net/2027.42/3557, read in its library OCR text layer (`bab2786.0001.001.txt`); Table 1 is "Reproduced from" Oosterveld and van Oossanen, "Further computer-analyzed data of the Wageningen B-screw series", IV Int. Symp. on Ship Automation, Genova, Nov. 1974.] The table below was also compared line by line with the machine-readable copy in Fossen's MSS (`LIBRARY/modeling/utiles/WageningData.txt`, used by `wageningen.m`): the two copies are IDENTICAL, 39 thrust and 47 torque terms.

    K_T = sum_i C_i^T J^s_i (P/D)^t_i (A_E/A_O)^u_i Z^v_i        K_Q = sum_i C_i^Q J^s (P/D)^t (A_E/A_O)^u Z^v      (Rn = 2e6)
    J = V_A/(n D);  T = rho n^2 D^4 K_T;  Q = rho n^2 D^5 K_Q;  eta_O = J K_T/(2 pi K_Q)

Thrust (C, s, t, u, v):

    +0.00880496 0 0 0 0 | -0.204554 1 0 0 0 | +0.166351 0 1 0 0 | +0.158114 0 2 0 0 | -0.147581 2 0 1 0
    -0.481497 1 1 1 0 | +0.415437 0 2 1 0 | +0.0144043 0 0 0 1 | -0.0530054 2 0 0 1 | +0.0143481 0 1 0 1
    +0.0606826 1 1 0 1 | -0.0125894 0 0 1 1 | +0.0109689 1 0 1 1 | -0.133698 0 3 0 0 | +0.00638407 0 6 0 0
    -0.00132718 2 6 0 0 | +0.168496 3 0 1 0 | -0.0507214 0 0 2 0 | +0.0854559 2 0 2 0 | -0.0504475 3 0 2 0
    +0.010465 1 6 2 0 | -0.00648272 2 6 2 0 | -0.00841728 0 3 0 1 | +0.0168424 1 3 0 1 | -0.00102296 3 3 0 1
    -0.0317791 0 3 1 1 | +0.018604 1 0 2 1 | -0.00410798 0 2 2 1 | -0.000606848 0 0 0 2 | -0.0049819 1 0 0 2
    +0.0025983 2 0 0 2 | -0.000560528 3 0 0 2 | -0.00163652 1 2 0 2 | -0.000328787 1 6 0 2 | +0.000116502 2 6 0 2
    +0.000690904 0 0 1 2 | +0.00421749 0 3 1 2 | +0.0000565229 3 6 1 2 | -0.00146564 0 3 2 2

Torque (C, s, t, u, v):

    +0.00379368 0 0 0 0 | +0.00886523 2 0 0 0 | -0.032241 1 1 0 0 | +0.00344778 0 2 0 0 | -0.0408811 0 1 1 0
    -0.108009 1 1 1 0 | -0.0885381 2 1 1 0 | +0.188561 0 2 1 0 | -0.00370871 1 0 0 1 | +0.00513696 0 1 0 1
    +0.0209449 1 1 0 1 | +0.00474319 2 1 0 1 | -0.00723408 2 0 1 1 | +0.00438388 1 1 1 1 | -0.0269403 0 2 1 1
    +0.0558082 3 0 1 0 | +0.0161886 0 3 1 0 | +0.00318086 1 3 1 0 | +0.015896 0 0 2 0 | +0.0471729 1 0 2 0
    +0.0196283 3 0 2 0 | -0.0502782 0 1 2 0 | -0.030055 3 1 2 0 | +0.0417122 2 2 2 0 | -0.0397722 0 3 2 0
    -0.00350024 0 6 2 0 | -0.0106854 3 0 0 1 | +0.00110903 3 3 0 1 | -0.000313912 0 6 0 1 | +0.0035985 3 0 1 1
    -0.00142121 0 6 1 1 | -0.00383637 1 0 2 1 | +0.0126803 0 2 2 1 | -0.00318278 2 3 2 1 | +0.00334268 0 6 2 1
    -0.00183491 1 1 0 2 | +0.000112451 3 2 0 2 | -0.0000297228 3 6 0 2 | +0.000269551 1 0 1 2 | +0.00083265 2 0 1 2
    +0.00155334 0 2 1 2 | +0.000302683 0 6 1 2 | -0.0001843 0 0 2 2 | -0.000425399 0 3 2 2 | +0.0000869243 3 3 2 2
    -0.0004659 0 6 2 2 | +0.0000554194 1 6 2 2

Reynolds-number correction above Rn = 2e6 [quoted from the same report's Table 2, OCR; x = log10(Rn) - 0.301; Rn at 0.75R]:

    dK_T = 0.000353485 - 0.00333758 (A_E/A_O) J^2 - 0.00478125 (A_E/A_O)(P/D) J + 0.000257792 x^2 (A_E/A_O) J^2
         + 0.0000643192 x (P/D)^6 J^2 - 0.0000110636 x^2 (P/D)^6 J^2 - 0.0000276305 x^2 Z (A_E/A_O) J^2
         + 0.0000954 x Z (A_E/A_O)(P/D) J + 0.0000032049 x Z^2 (A_E/A_O)(P/D)^3 J
    dK_Q = -0.000591412 + 0.00696898 (P/D) - 0.0000666654 Z (P/D)^6 + 0.0160818 (A_E/A_O)^2
         - 0.000938091 x (P/D) - 0.00059593 x (P/D)^2 + 0.0000782099 x^2 (P/D)^2
         + 0.0000052199 x Z (A_E/A_O) J^2 - 0.00000088528 x^2 Z (A_E/A_O)(P/D) J
         + 0.0000230171 x Z (P/D)^6 - 0.00000184341 x^2 Z (P/D)^6
         - 0.00400252 x (A_E/A_O)^2 + 0.000220915 x^2 (A_E/A_O)^2

OCR caveat: in the last dK_T term the OCR shows "(P/D) 3" and no J; the trailing J is restored from memory [from memory, unverified]. MSS's `wageningen.m` applies no Reynolds correction.

**Range** [quoted, report p. 5, Eqs. 11-13]: 2 <= Z <= 7; 0.30 <= A_E/A_O <= 1.05; 0.5 <= P/D <= 1.40; "at the extremes of the above ranges the results are not fully reliable."

**Stand-in for the 1911 propellers** [my recommendation]: Z = 3; P/D = 1.40, the upper edge of the polynomial's range, for the wing screws (the brief's 1.4-1.5 is at or beyond the edge; above 1.40, shift the curve by scaling J with (P/D)/1.40 rather than extrapolating the polynomial); A_E/A_O must come from Olympic-class drawings (built-up bronze propellers of that era were wide-bladed; I found no figure). Sanity check (computed here): wing screw at 22.5 kn, wake 0.10, n = 75 rpm, D = 7.2 m gives J = 1.16 and a nominal slip of 1 - J/(P/D) = 0.17-0.23, which is plausible.

### Four-quadrant behaviour (crash stop, astern)

Definitions [from memory, unverified; this is the standard MARIN/van Lammeren et al. 1969 form]: hydrodynamic pitch angle beta = atan2(V_A, 0.7 pi n D); C_T* = T / {0.5 rho [V_A^2 + (0.7 pi n D)^2] (pi/4) D^2}; C_Q* = Q / {0.5 rho [V_A^2 + (0.7 pi n D)^2] (pi/4) D^3}; each represented as a Fourier series C*(beta) = sum_{k=0}^{20} [A_k cos(k beta) + B_k sin(k beta)], beta covering 0-360 deg (first quadrant: ahead speed, ahead rpm; second: astern rpm, ahead speed, the crash-stop case; third and fourth: astern speed). The coefficient tables for B4-70 and the other series are NOT in this file: van Lammeren, van Manen and Oosterveld 1969 (SNAME Trans. 77) and the MARIN reports were not reachable as text. A U.S. Navy report on neural-network fits of B-series four-quadrant data (R. F. Roddy, NSWCCD-50-TR-2006/004, DTIC ADA455497) contains B4-70 four-quadrant results according to its table of contents (seen only as a search summary). This is the most important missing data set for the crash-stop scenario.

### Wake and thrust deduction for wing and centre screws

Nothing verified. [from memory, unverified]: Holtrop and Mennen give separate twin-screw regressions (wake fraction about 0.3095 C_B + 10 C_V C_B - 0.23 D/sqrt(B T); thrust deduction about 0.325 C_B - 0.1885 D/sqrt(B T)) and single-screw ones. For a triple-screw ship the wing screws (outboard, in thin boundary layer) behave like twin screws (w about 0.1 or less) and the centre screw like a single screw in the full stern wake (w about 0.25-0.35; Kijima's 1 - w_P0 = 1.05 - 0.5 C_b gives 0.29, M2). These are design choices to be stated as such.

### Propeller yaw moment and the rudder in the centre slipstream

- Wing-screw yaw moment [my derivation, sign convention as MMG, y to starboard, N positive bow to starboard]: N_P = y_P [(1 - t_w) T_port - (1 - t_w) T_stbd], y_P = half the shaft spacing (positive). Port screw ahead or starboard screw astern turns the bow to starboard. This, not the rudder, is how a triple-screw ship with a stopped centre screw can still be turned at low speed.
- The MMG rudder inflow (Eq. 25) depends on the centre screw only, through K_T/J_P^2. Rewriting it with Eqs. 39-46 of the MMG paper (momentum theory) removes the 1/n singularity [derived here from the quoted Eqs. 39-46]: with u_P = (1 - w_P) u and T the centre-screw thrust,

      u_inf = sqrt(u_P^2 + 8 T / (rho pi D_P^2))      (clamp the radicand at 0 when T < 0)
      u_R   = eps * sqrt( eta [u_P + kappa (u_inf - u_P)]^2 + (1 - eta) u_P^2 )

  This equals Eq. 25 for n > 0 and stays finite at n = 0 (u_R = eps u_P, the rudder sees only the hull wake) and at u = 0 with the screw turning (pure slipstream). With the centre turbine stopped and windmilling, T is small or negative and the rudder loses the slipstream boost entirely, so rudder force falls to roughly eps^2 (1 - w)^2 of the open-water value at the same speed. With the centre screw astern the slipstream is directed forward over the rudder's inflow and the formula has no validity; any model of that state is a guess.
- Drag of a stopped (locked) or windmilling propeller: not found in any source I could open.

## M8. Engine and shaft dynamics

**First-order shaft lag, as used in two published simulator models** [secondary, read as raw source in Fossen's MSS]:
- Son and Nomoto container ship (`container.m`): n_dot = (n_c - n)/T_m (in rpm/s with n in rpm), T_m = 5.65/n s for n > 0.3 rps and 18.83 s below; command saturated at 160 rpm. So about 2 s at full rpm and 19 s near stop: the lag grows as the shaft slows.
- Van Berlekom and Goddard's 190,000 dwt turbine tanker (`tanker.m`, citing W. B. Van Berlekom and T. A. Goddard, "Maneuvering of large tankers", Trans. SNAME 80:264-298, 1972): n_dot = (n_c - n)/T_m with T_m = 50 s, nominal 80 rpm, rudder rate 2.33 deg/s. Its thrust model works across a reversal of n, which is what a crash stop needs: thrust = T_uu u^2/L + T_un u n + L T_nn |n| n (nondimensional "bis" form, T_uu = -0.00695, T_un = -0.00063, T_nn = 0.0000354), and the effective rudder speed is c = sqrt(c_un u n + c_nn n^2) with c_un = 0.605, c_nn = 38.2. The code refuses u <= 0, so it does not cover astern speed.

**Torque balance** [from memory, unverified; standard]: 2 pi (I_engine + I_shaft + I_prop + I_entrained water) dn/dt = Q_engine(n, order) - Q_prop(n, V_A)/eta_R - Q_friction(n). For a reciprocating steam engine at fixed throttle and cut-off, Q_engine is roughly independent of rpm (steam pressure times swept volume per revolution), so the shaft settles where Q_prop matches it. That is physically better than a first-order lag when the propeller load changes sharply: during a turn, when the ship slows, or when the screw breaks the surface as the stern lifts. For a low-pressure exhaust turbine (the centre screw here), torque follows the exhaust steam flow from the reciprocating engines. When they are reversed the steam is diverted, and the turbine runs down under propeller and windage torque alone.

**Timings for 1911 machinery** (stop, reverse, reach full astern; turbine spin-down): no engineering-literature figure found. The relevant evidence is the Olympic-class trials and inquiry testimony, which the lead session holds. A defensible simulator form [my recommendation]: a rate limit on the rpm set-point (separate rates for slowing, passing through zero with a dead time for valve-gear reversal, and building up astern) feeding a torque-balance or first-order shaft model, with each parameter tagged to a historical source.

**Telegraph to rpm**: simulators map each telegraph order to an rpm set-point table (Full, Half, Slow and Dead Slow, ahead and astern). I found no generic published table worth citing; for this ship the table should come from period practice and testimony. Note that the turbine has no astern orders.

## M9. Validation practice

**IMO standard manoeuvres** [secondary: summaries of IMO A.751(18) and MSC.137(76) (https://sea-man.org/ship-manoeuvring.html and search-result extracts of MSC.137(76) copies); the IMO PDFs were not text-readable]:
- Definitions: advance is the distance along the original course until the heading has changed 90 deg; transfer is the lateral offset at 90 deg; tactical diameter is the transfer at a 180 deg change of heading.
- Turning ability (35 deg rudder, or the maximum permitted): advance <= 4.5 L, tactical diameter <= 5 L.
- Initial turning (10 deg rudder): no more than 2.5 L travelled by the time the heading has changed 10 deg.
- 10/10 zig-zag first overshoot: 10 deg if L/V < 10 s; 20 deg if L/V >= 30 s; 5 + 0.5 (L/V) deg in between. For this ship at 22.5 kn, L/V = 22.4 s, giving a 16.2 deg limit (computed here). Second overshoot: A.751(18) allows 15 deg above the first-overshoot criterion [secondary, sea-man.org]; MSC.137(76) uses 25 deg / 17.5 + 0.75 (L/V) / 40 deg [from memory, unverified].
- 20/20 zig-zag first overshoot <= 25 deg.
- Stopping (full astern from test speed): track reach <= 15 L; the Administration may extend this for large ships [from memory, unverified].
- Conditions: full load, even keel, deep unrestricted water, calm, test speed at least 90 % of the speed at 85 % MCR [secondary, sea-man.org].

**How well regression-based MMG models predict them** (evidence actually seen):
- With captive-test coefficients (KVLCC2, MMG standard) [quoted, M1]: turning advance and tactical diameter within 5.8 % of free-running model tests; 10/10 overshoots under-predicted by up to 3 deg (first) and 6 deg (second). The authors suspect hull damping is slightly too large. Full-scale prediction differs from model scale by about 10 % in turning indices because the rudder normal force is 20-40 % lower at full scale.
- With Kijima 1990 regressions outside their hull family [quoted, MDPI 9(8):854 Table 4]: +43 % advance, +55 % transfer, +50 % tactical diameter for an 85 m trawler against sea trials.
- SIMMAN 2008 / 2014 statistics (Stern et al. 2011, J. Ship Research 55): paywalled, not read. A search summary of a later 5415M study reports average system-based errors falling from 16 % to 8 % when CFD-derived coefficients replace captive-test ones (not opened, unverified).

**Which coefficients each manoeuvre is sensitive to** [my analysis, grounded in the quoted model structure]:
- Turning circle (steady part): rudder normal force (A_R, f_alpha, u_R through eps, kappa, eta and the centre-screw load), gamma_R and l'_R, and the nonlinear hull damping (Y'_vvr, Y'_vrr, N'_vvr, N'_vrr, N'_rrr). Speed loss comes from (m + m_y) v_m r and X_R.
- Zig-zag overshoots and spiral: the linear course-stability index C = Y'_v N'_r - N'_v (Y'_r - m' - m'_x) (hull plus rudder contributions) and the yaw inertia. **For this hull the hull-only index is marginal and its SIGN differs between regressions** (computed here, MMG L-d basis at d = 10 m): Kijima 1990 gives C = 0.0080 - 0.0086 = -0.0005 (unstable); Clarke 1983 gives +0.0008 (stable). Adding a rudder contribution with assumed A_R = 37 m^2, aspect ratio 2.5, u'_R 0.9, gamma_R 0.5, a_H 0.3, x'_H -0.45 and l'_R -0.9 makes both clearly stable (C about +0.0064 and +0.0074). The predicted zig-zag behaviour therefore hinges on the rudder area, gamma_R and l'_R, which must come from Olympic-class data.
- Crash stop: four-quadrant propeller data (M7), the shaft and engine reversal timing (M8), m + m_x, and R'_0 at low speed. During the stop the heading wanders, governed by the asymmetric wing-screw forces, the transverse propeller forces and the loss of rudder slipstream. Track reach is mostly an energy and thrust budget; the lateral deviation is poorly predicted by all simple models.

## M10. Numerics

**Time scales for this ship** (computed here from Clarke 1983 derivatives, M2(c), with x_G = 0, k_zz = 0.25 L and the Clarke added masses; linear sway-yaw model; nondimensional time t' = t U/L). The characteristic roots are s' = -0.099 and -2.45 for the hull alone (T'_1 = 10.1, T'_2 = 0.41), and s' = -0.49 and -2.79 with the assumed rudder contribution above (T'_1 = 2.0, T'_2 = 0.36). At 22 kn (L/U = 22.9 s): hull alone T_1 about 230 s and T_2 about 9 s; with the rudder T_1 about 46 s and T_2 about 8 s. So the Nomoto T is of order 50 s, and the fastest manoeuvring mode has T of about 8 s. The time constants scale with L/U, so they get LONGER as the ship slows. The steady-turn gain from the same linear model (Kijima hull plus the assumed rudder, MMG basis, computed here) is K' = r'/delta of about 1.4, i.e. K = K' U/L of about 0.06 s^-1 at 22 kn. These are illustrative numbers resting on the assumed rudder; they are not validated.

Other fast states: the shaft (2-19 s in the Son-Nomoto model; up to 50 s for a large turbine), the rudder (rate-limited, not stiff), and roll. The roll natural period is 2 pi k_xx / sqrt(g GM): with k_xx about 0.4 B = 11 m (assumed), 25 s at GM 0.8 m and about 50 s at GM 0.2 m, before added inertia (computed here).

**Integrator** [my analysis]: dt = 0.25 s is 1/30 or less of every manoeuvring time constant, so explicit Euler is stable for the first-order (damped) modes. It is NOT adequate for the roll oscillator: explicit Euler multiplies the amplitude of an undamped oscillator by about sqrt(1 + (omega dt)^2) per step, which compounds to about exp(pi omega dt) per period (+22 % per period at omega = 0.25 rad/s and dt = 0.25 s). Use semi-implicit (symplectic) Euler instead: update the velocities from the forces, then the positions and angles from the NEW velocities. It is equally cheap, deterministic, plain arithmetic, ports line for line to C++/CUDA, and keeps oscillator energy bounded. RK4 is the alternative, but it costs four force evaluations per step and interacts awkwardly with a flooding state that changes inside the step. In either case solve the small coupled inertia system (Eq. 4: the sway-yaw coupling through x_G m; Son-Nomoto's sway-roll-yaw couplings) explicitly each step with a fixed-order 2x2 or 3x3 solve.

**Zero and negative speed** (where beta = atan(-v/u) and r' = r L/U break down):
- Unified hull model [quoted, read from the PDF text layer of Y. Yoshimura, I. Nakao and A. Ishibashi, "Unified mathematical model for ocean and harbour manoeuvring", MARSIM 2009, author version at https://hdl.handle.net/2115/42969; absolute-value bars were lost in text extraction and are restored from the paper's own explanation of the astern case]. The paper says "(|u| v) and (r u) can be adopted for the expression of Y_H, and (v u) and (|u| r) for N_H"; I reconstructed its Eq. 9 as:

      X_H = 0.5 rho L d [ X'_0 u U + (X'_vr + m'_y) v r L ],   X'_0 = X'_0F + (X'_0A - X'_0F) |beta|/pi
      Y_H = 0.5 rho L d [ Y'_v v |u| + (Y'_r - m'_x) L r u - (C_D/L) Int_{-L/2}^{L/2} |v + C_rY r x| (v + C_rY r x) dx ]
      N_H = 0.5 rho L^2 d [ N'_v v u + N'_r L r |u| - (C_D/L^2) Int_{-L/2}^{L/2} |v + C_rN r x| (v + C_rN r x) x dx ]

  At u = v = 0 it reduces to N_H = -0.5 rho L^2 d (L r)|L r| C_D C_rN^2/32 (Eq. 10). Regression formulas (Eqs. 19-21, fitted to "several ship models including 4 ship models in this paper"): C_D = -0.0591 (L/d) + 1.848; C_rY = 0.520 (L/B) - 1.062; C_rN = 0.0742 (L/d) - 0.297. Fitted values (Table 2) for SR108 container ship, Esso Osaka VLCC, PCC and a fishery research ship: C_D 0.659 / 0.879 / 0.648 / 1.201, C_rY 2.590 / 2.058 / 1.735 / 1.355, C_rN 1.124 / 0.543 / 1.309 / 0.858 (L/B 4.8-6.9, L/d 13-22). For this ship (computed here) C_D = 0.32, C_rY = 3.72, C_rN = 1.63, all EXTRAPOLATED (L/d 25.9 and L/B 9.2 lie beyond the data). The paper also states that at low speed with drift above about 30 deg the hull-propeller-rudder interaction coefficients "can be assumed to be zero".
  The same paper gives the fine-ship linear derivatives it recommends (its Eqs. 17-18, from Yoshimura and Masumoto, "effective particularly for fine ships whose C_b is less than 0.75") [quoted; superscripts recovered from glyph positions]: Y'_v0 = -0.5 pi k - 1.4 C_b B/L; (Y'_r - m'_x)_0 = 0.5 C_b B/L; N'_v0 = -k; N'_r0 = -0.54 k + k^2 (Kijima's linear set again, "modified from the original Kijima's model", here in v-form with MMG signs: a third reproduction by different authors). For trim by the STERN tau: Y'_v = Y'_v0 {1 + 0.54 (tau/d)^2}; Y'_r - m'_x = (Y'_r - m'_x)_0 {1 + 1.82 (tau/d)^2}; N'_v = N'_v0 {1 - 0.51 tau/(d C_b)}; N'_r = N'_r0 {1 + 1.79 (tau/B)^2}; m'_y + X'_vr = 2.86 C_b (B/L) - 0.21. These quadratic stern-trim terms are even in tau and must NOT be applied to trim by the bow.
- Cross-flow drag strip model [secondary: MSS `LIBRARY/modeling/crossFlowDrag.m`, citing Fossen's Handbook, 3rd ed.]: Y_h = -0.5 rho T C_d Sum_i |v_r + x_i r| (v_r + x_i r) dx and N_h = -0.5 rho T C_d Sum_i x_i |v_r + x_i r| (v_r + x_i r) dx over 20 strips, C_d from Hoerner's 2-D curve (table not read). This is the C_rY = C_rN = 1 special case of Yoshimura's form, and it can use the instantaneous local draft T(x) per strip, which fits a flooding model.
- Rudder and propeller at low speed: use the regularised rudder inflow of M7 (no 1/n, no 1/u), and compute F_N dimensionally from U_R^2 rather than through primed quantities. MSS adds 0.001 m/s to U to avoid division by zero in its linear model [quoted, clarke83.m]; that is a guard, not a model.
- Practical rule [my recommendation]: write every force dimensionally, with velocity products (u|u|, v|u|, r u, ...) instead of primed derivatives times U^2; compute beta, r' and J only where a formula needs them, with guarded denominators; and blend the interaction coefficients to zero as |beta| goes from about 20 to 30 deg or U falls below a few knots.

## A minimal defensible model for this ship

[my recommendation, built from the sourced pieces above]

1. **Equations**: MMG standard Eq. 4 (surge, sway and yaw about MIDSHIP with the x_G coupling; the midship origin suits a ship whose G moves as she floods), plus one roll equation with K_H = -z_H Y_H, K_R = -z_R Y_R and the restoring moment from the flooding core's own GZ(phi) (M4). Write all forces dimensionally, in Yoshimura's velocity-product form (v|u|, r u, v u, r|u|), so that zero and astern speed are legal states (M10).
2. **Hull, linear**: Kijima 1990 linear set (Y'_beta = 0.5 pi k + 1.4 C_b B/L; Y'_r - m'_x = 0.5 C_b B/L; N'_beta = k; N'_r = -0.54 k + k^2). Three independent reproductions confirm it, it agrees with Clarke 1983 within 5-7 % for this ship, and its leading terms are slender-body terms that extrapolate sensibly to L/B 9.2. Evaluate it at the instantaneous mean draft, C_b and B. Apply trim and immersion as a ratio of strip sums over the actual immersed sections (M5). The fallback is Inoue's linear trim factors clamped to |tau'| <= 0.3 [my clamp; the fitted range is not verified].
3. **Hull, nonlinear**: Yoshimura 2009 cross-flow drag terms (C_D, C_rY, C_rN, strip integral with the local draft) instead of Kijima's polynomial nonlinear terms. The latter were fitted on L/B <= 6.9 and use C_b B/L polynomials that extrapolate badly here (N'_bbr, eps).
4. **Surge**: Holtrop 1984 resistance re-evaluated at the instantaneous draft (L/B < 12 branch for lambda), plus the inertial (m + m_y) v_m r coupling; X'_vr taken as about -m'_y (Yoshimura's m'_y + X'_vr is about 0 for this ship).
5. **Propellers**: three shafts. Wing screws: B-series (Z = 3, P/D capped at 1.40, A_E/A_O from drawings) in the first quadrant, and for reversal the Van Berlekom-Goddard |n| n form until B-series four-quadrant data is obtained. Centre screw: ahead only. Per-screw wake and thrust deduction (stated design choices). Yaw moment N_P = y_P (1 - t)(T_port - T_stbd).
6. **Rudder**: MMG Eqs. 18-24 with the regularised inflow of M7, f_alpha = 6.13 Lambda/(Lambda + 2.25) on the immersed geometry, and starting values t_R 0.26, a_H 0.3, x'_H -0.45, gamma_R 0.5, l'_R -0.9, eps 1.0, kappa 0.5. Tune gamma_R, l'_R and A_R-related terms to the Olympic-class turning data, because the course-stability sign depends on them (M9).
7. **Engine**: rpm set-point with rate limits and a reversal dead time, then a first-order shaft lag (or torque balance), every timing tagged to a historical source.
8. **Integrator**: semi-implicit Euler at dt = 0.25 s, fixed-order sums, explicit small linear solves for the coupled inertia.

Inputs it needs:

| Input | Source |
|---|---|
| L_pp, B, draft fore and aft, immersed volume, C_b, C_P, C_M, C_WP, lcb, sectional drafts T(x) | flooding core / hull model (instantaneous) |
| mass, x_G, KG, GZ(phi), I_zz (k_zz about 0.25 L default), I_xx | flooding core (including floodwater) |
| Rudder area (immersed), span, chord, aspect ratio incl. horn, x_R, z_R, maximum angle and rate | **Olympic-class sources** |
| Propeller D, P/D, A_E/A_O, Z, shaft spacing y_P, x_P, tip depth | **Olympic-class sources** |
| Wake and thrust deduction per screw | design choice (M7), tuned to trial speed and rpm |
| rpm per telegraph order, reversal and turbine run-down timings | **historical evidence (inquiries, trials)** |
| Turning-trial data (advance, time to 90 or 180 deg) | **Olympic-class trials, for tuning gamma_R, l'_R, a_H** |
| Added masses m_x, m_y, J_z | Soding and Clarke formulas (M3) or strip theory |
| z_H (hull lateral force lever), roll damping | assumption to be tuned (M4) |

**Sign-convention traps** (collected):
- MMG, Kijima, Fossen and Son-Nomoto all use x forward, y to STARBOARD, z DOWN; r > 0 turns the bow to starboard; phi > 0 is starboard down. This repo's frame is x forward, y to PORT, z UP (repo `CLAUDE.md`), so y, v, r, yaw moments and the sway-yaw cross terms all flip sign at the boundary. Roll "starboard down positive" happens to agree. The repo's pitch is bow-down positive; in the z-down frame a positive pitch about y is bow UP, so trim signs flip too.
- beta = atan(-v_m/u): positive drift means the ship slides to PORT. Kijima's Y'_beta and N'_beta are positive numbers and equal -Y'_v and -N'_v of the MMG form.
- MMG's Y'_R and N'_R are YAW-RATE derivatives, not rudder terms.
- The rudder angle sign is defined in the MMG paper's figure; from Eq. 18, delta > 0 turns the bow to starboard. Son-Nomoto writes alpha_R = delta + atan(v_R/u_R) with its own v_R sign; do not mix the two families' rudder formulas.
- Nondimensionalisation differs: MMG and Kijima use 0.5 rho L d U^2 (so m' = 2 C_b B/L); Clarke, Fossen and Son-Nomoto use 0.5 rho L^2 U^2 (multiply by L/d to convert).
- (Y'_r - m'_x) = 0.5 C_b B/L and Y'_r - (m' + m'_x) = -1.5 C_b B/L are the same formula.
- Trim tau is positive BY THE STERN in Inoue, Kijima and Yoshimura; this ship trims by the bow.

## Not found / paywalled / not checked

- **Kijima et al. 1990 primary** (scanned PDF, unreadable with my tools): its trim-correction constants (with C_b/(L/B)); verification of the reproduced a_H, x'_H and eps formulas, which look wrong; the value of the port/starboard coefficient C.
- **Kijima and Nakiri 2003**: the gamma_E and w_R0E formulas (not on the pages read).
- **Yoshimura and Masumoto 2011/2012** full regression set and range (only the excerpt quoted in Yoshimura et al. 2009 was read).
- **Inoue, Hirano and Kijima 1981** and **Clarke, Gedling and Hine 1983** originals (paywalled): fitted trim range, ship ranges.
- **Aoki et al. 2006**; **ITTC Manoeuvring Committee** reports and procedure 7.5-02-06-03 (PDF, not text-readable here).
- **Motora-chart regression** (Zhou et al.) for m_x, m_y, J_z: not found in open HTML.
- **Yasukawa and Yoshimura 2014; Yasukawa, Sakuno and Yoshimura 2019** (paywalled): z_H formula, Y'_phi and N'_phi formulas. **Son and Nomoto 1981** and **Hirano and Takashina 1980** originals: not reached (Son-Nomoto only through MSS).
- **Four-quadrant B-series Fourier coefficients** (van Lammeren, van Manen and Oosterveld 1969; MARIN reports; Roddy 2006): not reached.
- Drag of a locked or windmilling propeller; wake and thrust deduction for triple-screw ships (only remembered twin-screw Holtrop formulas, unverified).
- 1911 engine reversal and turbine run-down timings (not in the engineering literature I could reach; inquiry evidence is the lead's domain).
- **SIMMAN 2008/2014** error statistics (Stern et al. 2011, J. Ship Research 55): paywalled.
- **Official MSC.137(76) text**: the PDF was not text-readable; the second-overshoot formula and the stopping allowance are from memory.
- **Holtrop and Mennen 1982 / Holtrop 1984 originals**: only code reproductions read. Twin-screw propulsion factors not checked. **Taylor-Gertler data** and **Guldhammer-Harvald**: not opened.
- Hoerner 2-D cross-flow drag table; Lewis-form added-mass coefficients; roll damping and added roll inertia.
- Bow-trim manoeuvring studies (Hiroshima University KCS captive tests; Yun et al. 2025 CFD): full texts not read.
- Method note: HTML pages were read in the built-in browser (Springer and MDPI MathML/LaTeX sources, AVEVA and MARSIM-2003 equation images). The MARSIM 2009 PDF and the Michigan OCR text were read into page memory (pdf.js and fetch). GitHub sources were read as raw text. Nothing was saved to disk on purpose. The fetch tool cached some PDFs automatically in the session's tool-results folder, and those files were not opened.
