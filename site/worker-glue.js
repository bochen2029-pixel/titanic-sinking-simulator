// forecast worker: the build prepends core/core.js (which registers self.TitanicCore in a worker).
// It restores the snapshot it is sent, runs the model ahead to the end, and posts the history back.
self.onmessage = function (e) {
  var C = self.TitanicCore;
  if (!self.__ship) self.__ship = C.buildShip();
  var sim = C.restore(self.__ship, e.data.state);
  var res = C.run(sim, { tMax: sim.t + 6 * 3600, every: 30, stopWhenStable: true });
  self.postMessage({ seq: e.data.seq, hist: res.hist, foundered: res.foundered, founderT: res.founderT, final: res.final, events: res.events, endT: sim.t });
};
