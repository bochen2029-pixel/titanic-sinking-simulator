# The break's onset at a list: which axis, and what it moves (v1)

2026-11-24, by the B1+B2 lane, at the coordinator's word of 05:2x. Z1's kept-set run found that the last spread between
the onset and the joint is the list. The figures are e124's (`docs/research/experiments/e124_onset_list_axis.js`; its
results are in `results_2026-11-24/`).

## The question

B2's onset (`core/readers/onset.js`) fires on (M/Mu)^2 + (V/Vu)^2 = 1. M is the gauge's moment about the horizontal axis
across her (`core/readers/girder.js`, the reading). Her capacity Mu bends about her own deck axis (y).

A list turns the vertical forces' moment in two:
- M cos(list) about her y;
- M sin(list) about her vertical axis (z).

So is the onset comparing like with like?

## The answer: today's check is the biaxial one, with her lateral capacity taken as her vertical

The vertical forces' bending moment in her cross-section, resolved onto her own axes, has M_y = M cos(list) and
M_z = M sin(list). Its resultant is M. The consistent check is biaxial:

    (M_y/Mu_y)^2 + (M_z/Mu_z)^2 + (V/Vu)^2 = 1

With Mu_z = Mu_y it is exactly today's: (M/Mu)^2 + (V/Vu)^2. So today's onset is not wrong in kind. It assumes that her
capacity about her z equals her capacity about her y.

Her y alone, (M_y/Mu)^2, would drop the lateral bending altogether. It is not a consistent check: it only delays every
listed onset.

**Her lateral capacity**, bracketed (e124) from `section.js`'s own elements at the break's station (x -10.93), since
`section.js` computes no Smith's curve about her z:
- **High: 9.50 GN m.** Her lateral fully plastic moment at the yield. Each element sits at its distance from her centre
  line [bet]: the side, bilge and sheer strakes at her half-breadth, plating and members across her breadth at half of
  it.
- **Low: 5.15 GN m.** That times the vertical's own ratio of Smith's hogging ultimate to its fully plastic moment (4.939
  against 9.11, 0.542: the joints, the buckling, the progressive collapse) [bet: the lateral's knock-down as the
  vertical's].
- Against Mu_y 4.939 that is 1.04 to 1.92 times. The low end lies within 4 % of today's isotropic assumption.

## What each check moves (e124)

All on the 1912 watch, each member to its onset. Every check fires at the same station, x -10.93, in every member.

| | Member C (list 3.80 deg) | The kept set: later than today by | In T 155 to 159.7 |
|---|---|---|---|
| (i) today | step 37,792, T 156.46 | - | 12 of 30 |
| (iii) biaxial, Mu_z low | 37,795 (+0.75 s) | 0.00 to 1.50 s | 11 of 30 |
| (iii) biaxial, Mu_z high | 37,818 (+6.50 s) | 0.25 to 15.25 s | 10 of 30 |
| (ii) her y alone (not consistent) | 37,830 (+9.50 s) | 0.50 to 23.75 s | 10 of 30 |

- **The delays grow with the list.** #24 (11.38 deg): +1.50 s low, +15.25 s high, +23.75 s her y alone. #4 (8.20 deg):
  +1.50, +10.75, +16.25 s. #18 (4.75 deg): +1.00, +9.50, +14.50 s.
- **The record's band** (T 155 to 159.7, the witnesses') loses only members sitting within 2 s of its 159.7 edge (#15,
  #25, #27, at 159.65 to 159.69 today). The band is minutes wide by its sources, so nothing turns on it.
- **The default watch's end moves under every alternative:** step 37,792 by 3 to 38 steps. With it move its fingerprint
  0ae90224, the Carpathia search's baseline and the export. Any change to the onset's check is therefore its own change,
  with its own pins.

## Judgement

1. **Keep today's onset as the default.** It is the biaxial check with an isotropic capacity, within 0.75 s of the low
   bracket's on member C. The refinement worth making is her lateral capacity by Smith's method: `section.js` places each
   element at its own y and runs the same progressive collapse, her side shells as the flanges. Until that exists, the
   bracket says the onset could move by 0 to 15 s across the kept set.
2. **The consistency to make now is on the hinge's side.** The joint (`S.hinge`, the fall's `hingeLaw`) bends about her y
   alone. So at a list it starts below its yield by about (1 - cos list), which is why the high-list members #4 and #24
   held with the other consistencies on. It should yield on the check the onset fires on: the resultant of its own
   moments about her y and her z, sqrt(m_y^2 + m_z^2). The joint's locked rows give m_z, through the relative yaw. It
   should take the same shear circle (`H.under`). Then every member starts at its yield, whatever its list. Nothing in
   the watch moves: the onset is unchanged, to the bit on member C.
3. **If the onset is later made biaxial with a computed Mu_z, the hinge takes the same interaction at its yield:**
   sqrt(1 - (V/Vs(s))^2 - (M_z/Mu_z)^2) as the factor on its capacity about her y, its backbone about her y as now.

`girder.js` now gives, as new fields with nothing before them moved:
- MvertRel and MlatRel: the relieved moments about her y and her z;
- Vz: the shear along her z.

They serve both routes, and Z1's MUST row on the joint's M0.
