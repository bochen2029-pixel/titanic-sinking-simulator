// forecast worker: the build prepends core/core.js and the modules of the ship under way (they register
// self.TitanicCore, TitanicMotion, TitanicEncounter, TitanicSystems and TitanicNight in a worker).
//   { seq, state, night }               a watch (night: TitanicNight.forecastOf, Y6): a copy of the whole watch, run on
//                                       with its plant, its pumps and the orders still to come; otherwise the core alone
//                                       from its snapshot (state, the presets): run ahead to the end, post the history back
//   { type: 'window', seq, seed, kn, times }   the same berg, another watch: one row posted per reaction time
self.onmessage = function (e) {
  var C = self.TitanicCore;
  if (!self.__ship) self.__ship = C.buildShip();
  if (e.data.type === 'window') {
    var N = self.TitanicNight, sp = N.spec(e.data.seed, { speedKn: e.data.kn, level: e.data.level }), times = e.data.times;
    for (var i = 0; i < times.length; i++) {
      self.postMessage({ type: 'window', seq: e.data.seq, row: N.missWindow(self.__ship, sp, { times: [times[i]] })[0], last: i === times.length - 1 });
    }
    return;
  }
  if (e.data.night && self.TitanicNight) {
    var f = self.TitanicNight.forecast(self.__ship, e.data.night);
    // over and overT (QC B-4): she is gone, and when; on an onset watch at the break's onset, before the flag
    self.postMessage({ seq: e.data.seq, hist: f.hist, foundered: f.foundered, founderT: f.founderT, over: f.over, overT: f.overT, final: f.final, events: f.events, endT: f.endT, by: 'watch' });
    return;
  }
  var sim = C.restore(self.__ship, e.data.state);
  var res = C.run(sim, { tMax: sim.t + 6 * 3600, every: 30, stopWhenStable: true });
  self.postMessage({ seq: e.data.seq, hist: res.hist, foundered: res.foundered, founderT: res.founderT, final: res.final, events: res.events, endT: sim.t, by: 'core' });
};
