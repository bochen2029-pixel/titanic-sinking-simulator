// The 1911-12 trials as functions of the motion model (standalone, no flooding core), shared by
// tools/calibrate_motion.js (the fit) and tools/trials.js (the acceptance table).
const M = require('../core/motion.js');
const KN = M.KN, DEG = M.DEG, DT = 0.25;

// Helm hard over from a steady straight run. Records the trial measures from the moment of the order. Each heading is
// met between two steps: the time and the place are interpolated to it (M4, 2026-11-17; before, the step after it was
// taken, so the fitted figures moved in jumps of a step and the fit sat on the edge of one)
function turn(fit, kn, deltaDeg, opt) {
  opt = opt || {};
  const m = M.create({ fit, knots: kn });
  if (opt.noTurbine) { m.noTurbine = true; m.turbine = false; m.nC = 0; }
  M.rudder(m, deltaDeg);
  const o = { t225: null, x225: null, adv: null, trans: null, tact: null, t90: null, xHelm: null };
  let steadyFrom = null;
  while (m.t < 1800) {
    const a0 = Math.abs(m.psi) / DEG, t0 = m.t, x0 = m.X, y0 = m.Y;
    M.stepAlone(m, DT);
    const a = Math.abs(m.psi) / DEG, k = (th) => (th - a0) / (a - a0);
    if (o.xHelm === null && Math.abs(Math.abs(m.del) - Math.abs(deltaDeg) * DEG) < 1e-9) o.xHelm = m.X;   // the rudder hard over
    if (o.t225 === null && a >= 22.5) { const f = k(22.5); o.t225 = t0 + f * DT; o.x225 = x0 + f * (m.X - x0); }
    if (o.adv === null && a >= 90) { const f = k(90); o.adv = x0 + f * (m.X - x0); o.trans = Math.abs(y0 + f * (m.Y - y0)); o.t90 = t0 + f * DT; }
    if (o.tact === null && a >= 180) { const f = k(180); o.tact = Math.abs(y0 + f * (m.Y - y0)); }
    if (a >= 360 && steadyFrom === null) steadyFrom = m.t;
    if (a >= 450) break;
  }
  const U = Math.sqrt(m.u * m.u + m.v * m.v);
  o.ratio = U / (kn * KN); o.rate = Math.abs(m.r) / DEG; o.drift = Math.abs(Math.atan2(-m.v, m.u)) / DEG; o.radius = U / Math.abs(m.r);
  o.uEnd = U;
  o.advHelm = o.adv === null || o.xHelm === null ? null : o.adv - o.xHelm;     // advance from the rudder hard over
  return o;
}

// Olympic's two-point test as the handling consensus reads it (docs/research/RESEARCH_handling_consensus_v1, Conflict 1):
// from a steady run at `rpm`, hard over AND both engines rung full astern at the same moment (the turbine cut out at once).
// Records the time and the distance to two points (22.5 deg) from the order.
function turnReversed(fit, rpm, deltaDeg) {
  const m = M.create({ fit, rpm });
  M.rudder(m, deltaDeg); M.telegraph(m, 'full astern');
  while (m.t < 600 && m.u > 0) {
    const a0 = Math.abs(m.psi) / DEG, t0 = m.t, x0 = m.X;
    M.stepAlone(m, DT);
    const a = Math.abs(m.psi) / DEG;
    if (a >= 22.5) { const f = (22.5 - a0) / (a - a0); return { t225: t0 + f * DT, x225: x0 + f * (m.X - x0), kn: m.u / KN }; }
  }
  return { t225: null, x225: null, kn: m.u / KN };
}

// How the engines were reversed, as overrides of SHIP.engine (M4; docs/research/RESEARCH_handling_consensus_v1_2026-11-16.md,
// sections 4 and 8.4). The model's own rates are the usual handling (Cone's upper ends: astern 17 s after the order from
// 60 rpm, backing hard 50 s later).
//   TRIAL_1912: Titanic's crash-stop trial, 2 April 1912. The engines "were reversed more slowly than usual", so the
//     distance is "probably a little on the large side" (Wilding, BI 25295): 10 s more before they turn astern [bet: the
//     consensus's 5-15 s].
//   PROMPT: Olympic's stop of 1911, her engines "rather more smartly handled" (Wilding, 1915): Cone's lower ends, astern
//     10 s after the order and backing hard 30 s later (H. I. Cone, 1912; USS Delaware's port engine backed at 10 s) [bet].
const TRIAL_1912 = { dead: M.SHIP.engine.dead + 10 };
const PROMPT = { down: 10, dead: 2.5, astern: 2.5 };

// Both engines full astern from a steady run at `rpm`, helm amidships; the turbine drops out on the reversal.
// engine: overrides of the reversing rates (TRIAL_1912, PROMPT); none for the usual handling.
function crashStop(fit, rpm, engine) {
  const m = M.create({ fit, rpm, engine });
  const u0 = m.u;
  M.telegraph(m, 'full astern');
  let tAstern = null;
  while (m.u > 0 && m.t < 900) { M.stepAlone(m, DT); if (tAstern === null && m.nP < 0) tAstern = m.t; }
  return { u0, kn0: u0 / KN, t: m.t, dist: m.X, tAstern, rpmAt: m.nP };
}

// Settle at an order from rest-free start and return the speed the time-stepper reaches (checks the integrator
// against the exact quadratic).
function settle(rpm) {
  const m = M.create({ rpm });
  const target = m.u; m.u = 0.5 * target;
  for (let i = 0; i < 40000; i++) M.stepAlone(m, DT);
  return { stepped: m.u, exact: target, turbine: m.turbine };
}

module.exports = { turn, turnReversed, crashStop, settle, TRIAL_1912, PROMPT, KN, DEG };
