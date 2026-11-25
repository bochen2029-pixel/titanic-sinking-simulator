// The window's two channels to the app's main process: the crew's minds (docs/DESIGN_ask_the_bridge_v1_2026-11-23.md,
// sections 10 and 11) and the men's voices and the bridge's ears by Deepgram (docs/DESIGN_spoken_bridge_voice_v1_2026-11-23.md,
// sections 5 and 7). Electron runs this file before the page, in the sandbox and with context isolation: the page gets
// two frozen objects, window.titanicMinds with seven calls and window.titanicVoice with ten calls and one listener, and
// nothing else. No Node, no ipcRenderer and no other channel reaches the page. Each call passes its plain arguments to
// its handler in app/minds.js or app/voice.js and returns a Promise of its answer, but for titanicVoice's audio and
// cancel, which are sent and not answered; the handler checks who is calling and the arguments' shape. No call returns
// a key. The one listener, onHeard, is given the words heard and the transmission's id, never Electron's event.
//
// titanicMinds:
//   status()      what is set: the provider, the model, the switch, whether a key is kept, the limits, what was used
//   set(patch)    the provider, the model, the address (a server of the player's own), the switch, the wait, the limits
//   setKey(key)   keep the key (encrypted by the system's key store);  clearKey()  forget it
//   test()        one small question, to try the key and the model
//   ask({ seat, stable, changing })    one question to a man of the crew: the answer's text, or why there is none
//   usage()       the questions and tokens of this run, and their limits
'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('titanicMinds', Object.freeze({
  status: () => ipcRenderer.invoke('minds:status'),
  set: (patch) => ipcRenderer.invoke('minds:set', patch),
  setKey: (key) => ipcRenderer.invoke('minds:setKey', key),
  clearKey: () => ipcRenderer.invoke('minds:clearKey'),
  test: () => ipcRenderer.invoke('minds:test'),
  ask: (request) => ipcRenderer.invoke('minds:ask', request),
  usage: () => ipcRenderer.invoke('minds:usage'),
}));

// titanicVoice (app/voice.js):
//   status()      the two switches, whether a key is kept, the run's limits (characters spoken, seconds heard) and use
//   set(patch)    the switches, the wait, the run's limits (the app asks the player itself before a switch goes on)
//   setKey(key)   keep the Deepgram key (encrypted by the system's key store);  clearKey()  forget it
//   test()        try the key with Deepgram
//   speak({ who, text })   one line a man says: the WAV of it in his own voice (the app's table), or why there is none
// and the ears (the player's own words, while he holds the key):
//   open({})      a transmission begun: { ok, id }, or why not
//   audio(id, bytes)   one slice of the microphone's sound (an ArrayBuffer of at most 64 kB): sent, not answered
//   finish(id)    the key let go: the words heard, { ok, text }, or why there are none, within 3.5 s
//   cancel(id)    the transmission given up: sent, not answered
//   onHeard(fn)   fn(id, words) each time the words heard so far change; one listener at a time (a second call
//                 replaces the first; onHeard(null) removes it)
let heardBy = null;
ipcRenderer.on('voice:heard', (event, id, words) => {
  const fn = heardBy;
  if (!fn || typeof id !== 'number' || typeof words !== 'string') return;
  try { fn(id, words); } catch (e) { /* the page's own listener failed: nothing of it comes back here */ }
});
contextBridge.exposeInMainWorld('titanicVoice', Object.freeze({
  status: () => ipcRenderer.invoke('voice:status'),
  set: (patch) => ipcRenderer.invoke('voice:set', patch),
  setKey: (key) => ipcRenderer.invoke('voice:setKey', key),
  clearKey: () => ipcRenderer.invoke('voice:clearKey'),
  test: () => ipcRenderer.invoke('voice:test'),
  speak: (line) => ipcRenderer.invoke('voice:speak', line),
  open: (request) => ipcRenderer.invoke('voice:open', request),
  audio: (id, bytes) => { ipcRenderer.send('voice:audio', id, bytes); },
  finish: (id) => ipcRenderer.invoke('voice:finish', id),
  cancel: (id) => { ipcRenderer.send('voice:cancel', id); },
  onHeard: (fn) => { heardBy = typeof fn === 'function' ? fn : null; },
}));
