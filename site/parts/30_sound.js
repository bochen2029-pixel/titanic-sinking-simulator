// The ship heard (lane "sound"): the bed of a ship at sea, each sound's LEVEL a stated function of a number the model
// already computes; only its timbre is this file's, and every timbre is marked [appearance]. A viewer part
// (site/parts/*.js, hooked through TitanicApp.on): it reads the model's state and never feeds anything back.
// Nobody has listened to it yet. The levels are modest and each sound's gain at full scale is one line in FULL below.
//
//   sound     the model's number it follows                         its law (0 to 1, times FULL, the listener, the pace)
//   wind      sim.mo.u, v: her speed through the still air (a flat   (U / 24 kn)^2, at most 1; nothing at rest
//             calm: the only wind on her bridge is her own)
//   sea       the same speed, along her side                         (U / 24 kn)^2, at most 1
//   engines   sim.mo.nP, nS: the wing shafts' revolutions            (|nP| + |nS|) / 2 / 80 rpm, at most 1
//   ice       the force of each step of the contact (core/           F / 40 MN, at most 1, in a step in which the model
//             encounter.js), from the momentum it gave the berg:     records contact (e.tLast moves); nothing before the
//             the berg feels only the contact and the water's drag   touch, and nothing once the watch has her clear
//             (added back), so its change of momentum is the         (sim.night.tClear)
//             contact's impulse (Newton's third law)
//   water     sim.inflow: the sea coming in (C.readouts' inflowTpm)  sqrt(t a minute / 1000), at most 1; nothing intact
//   creaks    sim.pitch: how fast her trim changes                   30 creaks for each degree her trim moves, at random
//                                                                    (a Poisson process in the trim, seeded by the night)
//   bells     the ship's clock (TitanicApp.clockOf)                  the half hours, struck in pairs: eight bells at
//                                                                    midnight, one at 12:30, two at 1:00 ...
// The listener: each sound has a gain for each view (MIX). The pace: a continuous bed fades out as her time runs
// faster than her own pace and is gone by 8 times; a struck sound (a creak, a bell) sounds only up to 1.6 times, the
// rule of the engines' beat in site/app.js. All of it goes through one bus, a gain (the volume control this part adds
// beside the page's sound switch) and a gentle limiter, to the context's destination. Silent when the switch is off,
// the run is paused or she has foundered. The four sounds of site/app.js (the lookout's bell, the gong, the beat, the
// roar of steam) are not on this bus and are unchanged.
// For the tests (tools/sound_site_test.js): TitanicApp.sound.levels(), master(), view() and the counters below.
(function () {
  'use strict';
  const A = window.TitanicApp;
  if (!A || typeof A.on !== 'function') return;     // no viewer (a machine without WebGL): no sound either
  const S = A.state, NT = window.TitanicNight || null, CORE = window.TitanicCore || {};
  const RHO = CORE.RHO || 1025, KN = 1852 / 3600;

  // ---- each sound's gain at full scale [bet: nobody has listened yet]. Tune by ear here, one line each.
  const FULL = {
    wind: 0.05,      // her own wind at LAW.windKn
    sea: 0.04,       // the sea along her side at LAW.seaKn
    engines: 0.03,   // the engines at LAW.rpm: under the engines' beat (site/app.js, 0.05 a revolution)
    ice: 0.10,       // the grinding at LAW.iceMN
    water: 0.06,     // the rush at LAW.waterTpm
    creaks: 0.05,    // one creak at its loudest
    bells: 0.12,     // one stroke of the ship's bell (the lookout's bell in site/app.js rings at 0.30)
  };
  // ---- where each law reaches full scale [bets]
  const LAW = {
    windKn: 24,      // knots through the still air: above her best, so that her 22.5 knots stays under it
    seaKn: 24,       // knots through the water, the same
    rpm: 80,         // the wing shafts' mean revolutions a minute (Full ahead is 75; her 22.5 knots takes 76.4)
    iceMN: 40,       // the force of a step, MN (1912: 40.5 at the first blow, 7 to 10 along the grind; a stem strike 110 to 135)
    waterTpm: 1000,  // tons a minute coming in (1912: about 300 at first, 155 at 80 minutes, over 1,000 at the plunge)
    creaksPerDeg: 30, // creaks for each degree her trim moves (1912: two a minute at first, under one at 90 minutes)
  };
  // [bet] Whether her bell was still struck for the half hours after the collision is not known to this repo. true:
  // it is, on the watch and on the damage preset; false: it falls silent at the touch (and on a damaged preset).
  const BELLS_AFTER_COLLISION = true;
  // ---- the listener: each sound's gain in each view [bets]. On the Bridge and in the crow's nest the wind and the
  // bell; below the waterline (the Below and Screws views) the engines and the water; from a lifeboat 300 m off
  // everything faint (there the roar of her steam, which is site/app.js's and not on this bus, carries). A view not
  // named here gets the default. The crow's nest and the boat are the night part's views (site/parts/20_night_scene.js:
  // "nest", "boat").
  const MIX = {
    default: { wind: 0.6, sea: 0.8, engines: 0.5, ice: 0.9, water: 0.6, creaks: 0.7, bells: 0.5 },
    bridge: { wind: 1.0, sea: 0.5, engines: 0.3, ice: 0.7, water: 0.3, creaks: 0.6, bells: 1.0 },
    nest: { wind: 1.0, sea: 0.4, engines: 0.15, ice: 0.5, water: 0.2, creaks: 0.4, bells: 1.0 },
    below: { wind: 0.1, sea: 0.7, engines: 1.0, ice: 1.0, water: 1.0, creaks: 1.0, bells: 0.15 },
    stern: { wind: 0.05, sea: 0.7, engines: 1.0, ice: 0.6, water: 1.0, creaks: 0.9, bells: 0.1 },
    boat: { wind: 0.05, sea: 0.1, engines: 0.05, ice: 0.1, water: 0.05, creaks: 0.15, bells: 0.1 },
  };
  const PACE = { struck: 1.6, gone: 8 };            // times her own pace: struck sounds up to this; beds gone at this
  // how quickly each gain follows what is asked of it, s [appearance]: the ice within a step of the model (0.25 s)
  const TAU = { wind: 0.25, sea: 0.25, engines: 0.2, ice: 0.05, water: 0.3, creaks: 0.05, bells: 0.05, master: 0.05 };
  const KEYS = ['wind', 'sea', 'engines', 'ice', 'water', 'creaks', 'bells'];
  const VOL_KEY = 'titanic.sound.volume';

  // ===================================================================== state (the viewer's, never the model's)
  const asked = { wind: 0, sea: 0, engines: 0, ice: 0, water: 0, creaks: 0, bells: 0 };   // the gains asked now
  let askedMaster = 0, vol = 0.7, G = null, dead = false;   // vol: the volume until the player moves it [bet]
  try { const v = parseFloat(window.localStorage.getItem(VOL_KEY)); if (v >= 0 && v <= 1) vol = v; } catch (e) { /* no storage */ }
  // the ice: the berg's velocity and the contact's last time at the step before, the force of the latest step
  const ice = { tLast: -1, VX: 0, VY: 0, F: 0, frameF: 0, stepped: false, level: 0, peakF: 0, peakT: -1 };
  let creak = null, creakRnd = null, creakStruck = 0, creakAt = -1;
  const bell = { half: -1, due: 0, struck: 0, log: [] };

  // ===================================================================== helpers
  // a deterministic stream from a 32-bit seed (mulberry32, as core/night.js draws its nights)
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const expo = (r) => Math.max(1e-9, -Math.log(1 - r()));   // unit-mean exponential
  function strHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }
  const seedOf = () => ((S.night ? S.night.seed : strHash(String(S.scen))) ^ 0x51ED5EED) >>> 0;
  const mixName = (v) => (Object.prototype.hasOwnProperty.call(MIX, v) ? v : 'default');   // any other view: the default
  const mixOf = (v) => MIX[mixName(v)];
  // her time's seconds per second of real time, as site/app.js's frame loop runs it: 0 when paused; her own pace while a
  // part holds it there (TitanicApp.holdPace: a report brought to the bridge)
  function pace() { return A.pace(); }
  const bedFade = (p) => (p <= 0 ? 0 : (p <= 1 ? 1 : (p >= PACE.gone ? 0 : 1 - Math.log(p) / Math.log(PACE.gone))));
  const live = () => !!(A.soundOn() && S.playing && S.sim && !A.gone(S.sim));   // QC B-4: until she has gone
  // her structure's creaks: a Poisson process in the trim. Each creak comes when the trim has moved by the next of a
  // seeded run of exponential steps (mean 1 / LAW.creaksPerDeg degrees), so the same night creaks at the same steps and
  // the count over a stretch is LAW.creaksPerDeg times the degrees her trim moved, give or take its square root.
  function creakProcess(seed, pitch0) {
    const r = rng(seed);
    let p = pitch0, acc = 0, next = expo(r), count = 0;
    return {
      step(pitch) {
        acc += Math.abs(pitch - p) * 180 / Math.PI * LAW.creaksPerDeg; p = pitch;
        let n = 0;
        while (acc >= next) { acc -= next; next = expo(r); n++; }
        count += n;
        return n;
      },
      get count() { return count; },
    };
  }
  // the force of the step on the ice, N: the change of the berg's momentum over the step with the water's drag added
  // back (core/encounter.js applies the contact's reaction and then the drag at each sub-step; the drag over a step is
  // taken at the mean velocity). In Node it matches the impulse summed inside the contact law to 2.1e-4 on the 1912
  // watch and to 2.6e-3 on five drawn nights that touched, four of them stem strikes.
  function stepForce(e, V0x, V0y, dt) {
    const Mb = e.P.mass * (1 + e.P.added), Vx = e.berg.VX, Vy = e.berg.VY;
    const mx = 0.5 * (Vx + V0x), my = 0.5 * (Vy + V0y), mV = Math.sqrt(mx * mx + my * my);
    const jx = Vx - V0x + e.dragK * mV * mx * dt, jy = Vy - V0y + e.dragK * mV * my * dt;
    return Mb * Math.sqrt(jx * jx + jy * jy) / dt;
  }
  // the half hour of the ship's day (0 at midnight, 47 at 11:30 pm) by the ship's clock; -1 where there is no clock
  function halfHour(t) {
    const c = A.clockOf ? A.clockOf(t, true) : null;
    const m = c ? /^(\d{1,2}):(\d{2}):(\d{2}) (am|pm)$/.exec(c) : null;
    if (!m) return -1;
    const h = (+m[1] % 12) + (m[4] === 'pm' ? 12 : 0);
    return Math.floor((h * 3600 + (+m[2]) * 60 + (+m[3])) / 1800);
  }
  const collided = (sim) => (sim.night ? sim.night.tTouch >= 0 : sim.openings.length > 0);

  // ===================================================================== the sound itself: timbres [appearance]
  const BED_RMS = 0.25;                             // every bed's loop is scaled to this RMS, so FULL compares across them
  function white(n, r) { const x = new Float32Array(n); for (let i = 0; i < n; i++) x[i] = 2 * r() - 1; return x; }
  function brown(n, r, leak) { const x = new Float32Array(n); let y = 0; for (let i = 0; i < n; i++) { y = leak * y + (2 * r() - 1); x[i] = y; } return x; }
  function filt(x, type, f0, Q, fs) {               // an RBJ biquad, in place: 'lp', 'hp' or 'bp' (0 dB at its peak)
    const w = 2 * Math.PI * f0 / fs, cw = Math.cos(w), al = Math.sin(w) / (2 * Q), a0 = 1 + al;
    let b0, b1, b2;
    if (type === 'lp') { b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = b0; } else if (type === 'hp') { b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = b0; } else { b0 = al; b1 = 0; b2 = -al; }
    const B0 = b0 / a0, B1 = b1 / a0, B2 = b2 / a0, A1 = -2 * cw / a0, A2 = (1 - al) / a0;
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) { const xi = x[i], y = B0 * xi + B1 * x1 + B2 * x2 - A1 * y1 - A2 * y2; x2 = x1; x1 = xi; y2 = y1; y1 = y; x[i] = y; }
    return x;
  }
  function norm(x, rms) { let s = 0; for (let i = 0; i < x.length; i++) s += x[i] * x[i]; const k = s > 0 ? rms / Math.sqrt(s / x.length) : 0; for (let i = 0; i < x.length; i++) x[i] *= k; return x; }
  function addInto(a, b, k) { for (let i = 0; i < a.length; i++) a[i] += k * b[i]; return a; }
  function seamless(x, fade) {                      // a loop with no seam: the tail crossfaded into the head (equal power)
    const n = x.length - fade, y = x.slice(0, n);
    for (let i = 0; i < fade; i++) { const w = i / fade; y[i] = x[i] * Math.sqrt(w) + x[n + i] * Math.sqrt(1 - w); }
    return y;
  }
  const BEDS = {
    // [appearance] dark rushing air across the bridge, a faint whistle in the rigging over it
    wind(fs, r) {
      const f = Math.round(0.5 * fs), N = Math.round(5.3 * fs) + f;
      const a = norm(filt(filt(white(N, r), 'lp', 650, 0.7, fs), 'hp', 90, 0.7, fs), 1), w = norm(filt(white(N, r), 'bp', 1450, 9, fs), 1);
      return norm(seamless(addInto(a, w, 0.22), f), BED_RMS);
    },
    // [appearance] a broad hiss of water past her plating, the wash of her bow wave under it
    sea(fs, r) {
      const f = Math.round(0.5 * fs), N = Math.round(4.7 * fs) + f;
      const h = norm(filt(filt(white(N, r), 'hp', 380, 0.7, fs), 'lp', 6500, 0.7, fs), 1), l = norm(filt(white(N, r), 'lp', 260, 0.7, fs), 1);
      return norm(seamless(addInto(h, l, 0.5), f), BED_RMS);
    },
    // [appearance] a low rumble; its pulses (eight a revolution, see build) are added as it plays
    engines(fs, r) {
      const f = Math.round(0.4 * fs), N = Math.round(3.9 * fs) + f;
      return norm(seamless(filt(filt(brown(N, r, 0.998), 'lp', 140, 0.8, fs), 'hp', 24, 0.7, fs), f), BED_RMS);
    },
    // [appearance] steel on ice: a crackle of short cracks, about 110 a second, over a low groan; the cracks rounded off
    // (a soft clip at twice their RMS), so that the loop peaks at about 5 times its RMS, as the other beds do, and not 17
    ice(fs, r) {
      const f = Math.round(0.3 * fs), N = Math.round(3.1 * fs) + f, c = new Float32Array(N);
      for (let i = Math.round(expo(r) * fs / 110); i < N; i += Math.max(1, Math.round(expo(r) * fs / 110))) {
        const len = Math.round((0.002 + 0.012 * r()) * fs), amp = expo(r), tau = len / 3;
        for (let j = 0; j < len && i + j < N; j++) c[i + j] += amp * Math.exp(-j / tau) * (2 * r() - 1);
      }
      norm(filt(c, 'bp', 1100, 0.8, fs), 1);
      for (let i = 0; i < N; i++) c[i] = 2 * Math.tanh(c[i] / 2);
      const g = norm(filt(filt(brown(N, r, 0.997), 'lp', 160, 0.8, fs), 'hp', 30, 0.7, fs), 1);
      return norm(seamless(addInto(c, g, 0.6), f), BED_RMS);
    },
    // [appearance] a torrent through the opened seams: broad, with a gurgle in it
    water(fs, r) {
      const f = Math.round(0.5 * fs), N = Math.round(4.3 * fs) + f;
      const x = addInto(norm(filt(filt(white(N, r), 'bp', 700, 0.6, fs), 'lp', 3200, 0.7, fs), 1), norm(filt(white(N, r), 'lp', 220, 0.7, fs), 1), 0.45);
      const e = norm(filt(white(N, r), 'lp', 7, 0.7, fs), 1);
      for (let i = 0; i < N; i++) x[i] *= 1 + 0.3 * Math.max(-1, Math.min(1, e[i]));
      return norm(seamless(x, f), BED_RMS);
    },
  };
  const BED_SEED = { wind: 11, sea: 23, engines: 37, ice: 41, water: 53 };
  // [appearance] her engines' pulses: four double-acting cylinders, eight strokes a revolution, at the shafts' rate
  const PULSES_PER_REV = 8;
  // [appearance] the ship's bell: a bell's partials on 880 Hz (the lookout's bell is 1,174), each with its decay, s;
  // struck in pairs, 0.4 s within a pair and 1.2 s from pair to pair
  const BELL = { f: 880, partials: [[0.5, 0.12, 3.2], [1, 0.33, 2.6], [1.19, 0.15, 1.8], [1.5, 0.10, 1.4], [2, 0.18, 1.6], [2.52, 0.07, 0.9], [3, 0.05, 0.7]], inPair: 0.4, pair: 1.2 };
  const CREAK_GAP = 0.18;                           // s: creaks closer than this are counted but not struck [appearance]

  function kill() {                                 // the sound failed in this browser: drop it, quietly
    if (G) { try { G.bus.disconnect(); } catch (e) { /* gone */ } }
    G = null; dead = true;
    for (const k of KEYS) asked[k] = 0;
    askedMaster = 0;
  }
  function build() {
    const ctx = A.audio();
    if (!ctx || G || dead) return !!G;
    try {
      const fs = ctx.sampleRate;
      const bus = ctx.createGain(); bus.gain.value = 0;
      const lim = ctx.createDynamicsCompressor();     // a gentle limiter [appearance]: it only acts on a surprise
      lim.threshold.value = -12; lim.knee.value = 12; lim.ratio.value = 6; lim.attack.value = 0.005; lim.release.value = 0.3;
      bus.connect(lim); lim.connect(ctx.destination);
      const gain = {}, sent = {};
      for (const k of KEYS) { gain[k] = ctx.createGain(); gain[k].gain.value = 0; gain[k].connect(bus); sent[k] = 0; }
      const loop = (k, to) => {
        const data = BEDS[k](fs, rng(BED_SEED[k])), buf = ctx.createBuffer(1, data.length, fs);
        buf.getChannelData(0).set(data);
        const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true; src.connect(to); src.start();
        return src;
      };
      const lfo = (hz, depth, param, type) => { const o = ctx.createOscillator(), d = ctx.createGain(); o.type = type || 'sine'; o.frequency.value = hz; d.gain.value = depth; o.connect(d); d.connect(param); o.start(); return o; };
      // the wind gusts a little, the sea swells a little [appearance]: slow wobbles in the timbre, not in the level
      const gust = ctx.createGain(); gust.gain.value = 1; gust.connect(gain.wind);
      lfo(0.11, 0.09, gust.gain); lfo(0.047, 0.07, gust.gain);
      const swell = ctx.createGain(); swell.gain.value = 1; swell.connect(gain.sea);
      lfo(0.083, 0.08, swell.gain);
      // the engines' rumble pulses with their strokes [appearance], at a rate the frame sets from the revolutions
      const am = ctx.createGain(); am.gain.value = 0.72; am.connect(gain.engines);
      const pulse = lfo(1, 0.28, am.gain);
      loop('wind', gust); loop('sea', swell); loop('engines', am); loop('ice', gain.ice); loop('water', gain.water);
      G = { ctx, bus, lim, gain, sent, sentMaster: 0, pulse, pulseHz: 1 };
      return true;
    } catch (e) { kill(); return false; }
  }
  const canStrike = () => { const p = pace(); return p > 0 && p <= PACE.struck && live() && build(); };

  // [appearance] a creak of her structure working: a stick-slip groan, its pitch, length and loudness drawn at random
  function strikeCreak() {
    if (!canStrike()) return;
    try {
      const ctx = G.ctx, t0 = ctx.currentTime + 0.01, r = creakRnd;
      if (creakAt >= 0 && t0 - creakAt < CREAK_GAP) return;
      creakAt = t0;
      const f0 = 50 + 45 * r(), dur = 0.35 + 0.6 * r(), peak = 0.55 + 0.45 * r(), slip = 14 + 18 * r(), ctr = f0 * (4 + 4 * r()), rise = 0.04 + 0.1 * r();
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, t0); o.frequency.linearRampToValueAtTime(f0 * 0.82, t0 + dur);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = ctr; bp.Q.value = 4;
      const am = ctx.createGain(); am.gain.value = 0.55;
      const sl = ctx.createOscillator(); sl.type = 'square'; sl.frequency.value = slip;
      const dp = ctx.createGain(); dp.gain.value = 0.45; sl.connect(dp); dp.connect(am.gain);
      const env = ctx.createGain(); env.gain.setValueAtTime(0, t0); env.gain.linearRampToValueAtTime(peak, t0 + rise); env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(bp); bp.connect(am); am.connect(env); env.connect(G.gain.creaks);
      o.start(t0); sl.start(t0); o.stop(t0 + dur + 0.05); sl.stop(t0 + dur + 0.05);
      creakStruck++;
    } catch (e) { kill(); }
  }
  // the ship's bell for the half hour h: n strokes, in pairs [appearance]
  function ringHalfHour(sim, h) {
    const n = ((h + 7) % 8) + 1, allowed = BELLS_AFTER_COLLISION || !collided(sim), go = allowed && canStrike();
    const at = []; for (let i = 0; i < n; i++) at.push(Math.floor(i / 2) * BELL.pair + (i % 2) * BELL.inPair);
    bell.due += n;
    bell.log.push({ t: sim.t, clock: A.clockOf(sim.t, true), n, struck: go, at, why: go ? '' : (allowed ? 'the sound off, or her time running faster than 1.6 times her pace' : 'after the collision (BELLS_AFTER_COLLISION is false)') });
    if (!go) return;
    try {
      const ctx = G.ctx, t0 = ctx.currentTime + 0.05;
      for (const dt of at) for (const [ratio, g, decay] of BELL.partials) {
        const o = ctx.createOscillator(), v = ctx.createGain(), t = t0 + dt;
        o.type = 'sine'; o.frequency.value = BELL.f * ratio;
        v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(g, t + 0.004); v.gain.exponentialRampToValueAtTime(0.0001, t + decay);
        o.connect(v); v.connect(G.gain.bells); o.start(t); o.stop(t + decay + 0.05);
      }
      bell.struck += n;
    } catch (e) { kill(); }
  }

  // ===================================================================== the hooks
  function reset(sim) {
    const e = sim && sim.enc;
    ice.tLast = e ? e.tLast : -1; ice.VX = e ? e.berg.VX : 0; ice.VY = e ? e.berg.VY : 0;
    ice.F = 0; ice.frameF = 0; ice.stepped = false; ice.level = 0; ice.peakF = 0; ice.peakT = -1;
    const seed = seedOf();
    creak = creakProcess(seed, sim ? sim.pitch : 0); creakRnd = rng((seed ^ 0x2545F491) >>> 0); creakStruck = 0; creakAt = -1;
    bell.half = sim ? halfHour(sim.t) : -1; bell.due = 0; bell.struck = 0; bell.log = [];
  }
  function onStep(sim) {
    // the ice: the force of this step, if the model recorded contact in it, until the watch has her clear
    const e = sim.enc;
    if (e) {
      let F = 0;
      if (e.tLast !== ice.tLast && !(sim.night && sim.night.tClear >= 0)) F = stepForce(e, ice.VX, ice.VY, sim.params.dt);
      ice.tLast = e.tLast; ice.VX = e.berg.VX; ice.VY = e.berg.VY;
      ice.F = F; ice.stepped = true;
      if (F > ice.frameF) ice.frameF = F;
      if (F > ice.peakF) { ice.peakF = F; ice.peakT = sim.t; }
    }
    // her structure: the creaks the trim's movement in this step brings
    if (creak && creak.step(sim.pitch) > 0) strikeCreak();
    // the ship's bell: a half hour of the ship's clock passed in this step
    const h = halfHour(sim.t);
    if (h >= 0 && bell.half >= 0 && h !== bell.half) ringHalfHour(sim, h);
    bell.half = h;
  }
  function onFrame() {
    const sim = S.sim, on = live() && build();
    if (ice.stepped) { ice.level = ice.frameF; ice.frameF = 0; ice.stepped = false; }   // the strongest step since the last frame
    const p = pace(), mix = mixOf(S.view), k = on ? 1 : 0;
    const fade = k * bedFade(p), struck = k * (p > 0 && p <= PACE.struck ? 1 : 0);
    const m = sim && sim.mo, U = m ? Math.sqrt(m.u * m.u + m.v * m.v) : 0, n = m ? 0.5 * (Math.abs(m.nP) + Math.abs(m.nS)) : 0;
    const tpm = sim && sim.inflow > 0 ? sim.inflow * RHO / 1000 * 60 : 0;    // C.readouts' inflowTpm; water going out is not this sound
    const law = {
      wind: Math.min(1, (U / (LAW.windKn * KN)) * (U / (LAW.windKn * KN))),
      sea: Math.min(1, (U / (LAW.seaKn * KN)) * (U / (LAW.seaKn * KN))),
      engines: Math.min(1, n / LAW.rpm),
      ice: Math.min(1, ice.level / (LAW.iceMN * 1e6)),
      water: Math.sqrt(Math.min(1, tpm / LAW.waterTpm)),
    };
    for (const key of ['wind', 'sea', 'engines', 'ice', 'water']) asked[key] = FULL[key] * mix[key] * fade * law[key];
    asked.creaks = FULL.creaks * mix.creaks * struck;
    asked.bells = sim && !BELLS_AFTER_COLLISION && collided(sim) ? 0 : FULL.bells * mix.bells * struck;
    askedMaster = k * vol;
    if (!G) return;
    try {
      const t = G.ctx.currentTime;
      for (const key of KEYS) {
        const a = asked[key];
        if (Math.abs(a - G.sent[key]) > 1e-6 || (a === 0 && G.sent[key] !== 0)) { G.sent[key] = a; G.gain[key].gain.setTargetAtTime(a, t, TAU[key]); }
      }
      if (askedMaster !== G.sentMaster) { G.sentMaster = askedMaster; G.bus.gain.setTargetAtTime(askedMaster, t, TAU.master); }
      const hz = Math.max(0.05, PULSES_PER_REV * n / 60);
      if (Math.abs(hz - G.pulseHz) > 0.01) { G.pulseHz = hz; G.pulse.frequency.setTargetAtTime(hz, t, 0.3); }
    } catch (e) { kill(); }
  }
  // a hidden page stops drawing frames, and the beds would ring on: the bus goes quiet until the frames come back
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden || !G) return;
    askedMaster = 0; G.sentMaster = 0;
    try { G.bus.gain.setTargetAtTime(0, G.ctx.currentTime, 0.03); } catch (e) { kill(); }
  });

  // ===================================================================== the control: a volume beside the sound switch
  (function control() {
    const snd = document.getElementById('snd');
    if (!snd) return;
    const anchor = (snd.closest && snd.closest('label')) || snd;
    const row = document.createElement('div'); row.className = 'kv mt6'; row.id = 'sndVolRow';
    const name = document.createElement('label'); name.htmlFor = 'sndVol'; name.textContent = 'The ship at sea: volume';
    name.title = 'Her wind, the sea along her side, the engines, the ice, the water coming in, her structure and the ship\'s bell';
    name.style.color = 'var(--ink-2)';
    const r = document.createElement('input');
    r.type = 'range'; r.className = 'slider'; r.id = 'sndVol'; r.min = '0'; r.max = '100'; r.step = '1'; r.value = String(Math.round(vol * 100));
    r.setAttribute('aria-label', 'Volume of the ship at sea: her wind, the sea, the engines, the ice, the water, her structure and her bell');
    r.style.maxWidth = '140px'; r.style.flex = 'none';
    r.addEventListener('input', () => {
      vol = Math.max(0, Math.min(1, +r.value / 100));
      try { window.localStorage.setItem(VOL_KEY, String(vol)); } catch (e) { /* no storage */ }
      A.primeAudio();                               // a hand on the volume is a gesture: the sound may start
    });
    r.addEventListener('change', () => r.blur());   // the bridge's keys work again (site/app.js does the same for the wheel)
    row.append(name, r);
    anchor.insertAdjacentElement('afterend', row);
  })();

  reset(S.sim);
  A.on('reset', reset);
  A.on('step', onStep);
  A.on('frame', onFrame);

  // for the tests (tools/sound_site_test.js) and for tuning by ear from the console
  A.sound = {
    levels: () => Object.assign({}, asked),         // the gains asked of each sound's node now; 0 when silent
    master: () => askedMaster,                      // the bus's gain asked now: the volume, or 0 when silent
    view: () => ({ name: S.view, mix: mixName(S.view), gains: Object.assign({}, mixOf(S.view)) }),
    pace,
    counts: () => ({ creaks: creak ? creak.count : 0, creaksStruck: creakStruck, strokesDue: bell.due, strokes: bell.struck }),
    ice: () => ({ F: ice.F, level: ice.level, peakF: ice.peakF, peakT: ice.peakT }),
    bells: () => bell.log.map(o => Object.assign({}, o, { at: o.at.slice() })),
    creakProcess, seed: seedOf,                     // the creaks' law as a pure function of the trim, to replay a run
    volume: () => vol,
    FULL, LAW, MIX, PACE, BELLS_AFTER_COLLISION,
  };
})();
