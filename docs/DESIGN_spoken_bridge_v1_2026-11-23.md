# The spoken bridge: the design (v1)

2026-11-23 CST, fork 2 ("the BYOK lane"). Bo's pick, asked which of the living crew's steps to build first: "Spoken
bridge first". It designs steps 1 and 2 of `BRAINSTORM_byok_living_crew_v1_2026-11-23.md` (section 11; v1.1 beside
it). **Status: a design. Step 1 is being built on this branch; step 2 waits for the app's shell (NH13) on main.**

Tags: [read] = read in the code today; [bet] = a judgement to test; [authored] = written here in a period register,
not the record's words.

## 1. What it is

- **Step 1, the order line (no key, no network).** On a watch, the player types an order in words: "hard
  a-starboard", "stop", "close the watertight doors", "uncover the boats". A grammar turns the words into the watch's
  own typed orders and gives them through `TitanicApp.order`. The crew read the order back in a caption. The orders
  the night's own script gives are captioned in the same words. It works on the public page as it is.
- **Step 2, the voice (a Deepgram key, in the app).** Hold a key and say the order. The transcript goes to the same
  grammar as typed text. The readback is spoken. The key stays in the app's main process.

Nothing in `core/` changes. No fingerprint moves. An order typed is the same order clicked.

## 2. The rules it keeps

- The order is the only door: `TitanicApp.order(type, value, arg)` and nothing else [read: CLAUDE.md's parts rule].
- The grammar is code. There is no model in step 1 or step 2: Deepgram only turns sound into words.
- A refusal is the model's own: its reason is shown as the model gives it.
- The library has no DOM and runs in Node and in the page, as `24_wake_field.js` does.
- The page part reads the page's one clock (`TitanicApp.now()`, `TitanicApp.after`), never the wall clock, so
  `clock_tests` stays green.
- No new overlay on the stage in step 1, so `layout_site` is untouched (section 5).
- Lines the crew speak are [authored] unless marked as the record's.

## 3. The files

| File | What |
|---|---|
| `site/parts/85_crew_words.js` | The library: `parse`, `phrase`, `readback`, `VOCAB`. No DOM, no state. In the page it is `TitanicCrewWords`; in Node, `require` |
| `site/parts/86_crew.js`, `86_crew.css` | The part: the order line, the bridge's talk, captions for the script's orders, the convention's switch |
| `tools/crew_tests.js` | Headless: the table, the model's acceptance, the round trip, the script's phrases |
| `tools/crew_site_test.js` | In a browser, on the page's virtual clock: the typed night against the clicked night |
| `tools/gate.js` | Two rows: `crew` (headless, in `--quick`) and `crew_site` (browser, virtual) |

## 4. The grammar

### 4.1 The contract

```
parse(text, ctx) ->
  { ok: true,  heard, orders: [ { type, value, arg, said } ... ] }      one or more orders, in the order spoken
  { ok: false, heard, kind: 'question' | 'unknown' | 'unclear', why }   nothing is ordered

ctx = { convention: '1912' | 'modern', helm: <the rudder now ordered, degrees>, }

phrase(order, ctx)   -> the order in the bridge's words ("Hard a-starboard")
readback(order, done, ctx) -> { who, words }        done is what TitanicApp.order returned
VOCAB                -> the words and names to boost in speech to text (step 2)
```

- `heard` is the text as normalized: lower case, punctuation gone, spoken numbers as digits ("ten" is 10; "one
  five" is 15; "twenty five" is 25), fillers dropped ("please", "sir", "now", "at once", "mister").
- A leading name or rank is dropped: "Mr Murdoch, ...", "Quartermaster, ...", "Mr Phillips, ...".
- Several orders in one sentence split on "and", "then", a full stop, a semicolon: "Hard a-starboard and full
  astern" is two orders.
- If any part of a sentence is not understood, nothing is ordered: half an order could be another order [read: the
  ATC simulator's lesson].
- A question is recognized as one, not guessed into an order: it begins with who, what, where, when, why, how, is,
  are, can, has, have, do, does, or ends with a question mark.

### 4.2 The helm, and the 1912 convention

In 1912 a helm order named the side the TILLER went to. "Hard a-starboard" put her head to PORT [read: the bridge
note; `core/night.js`, where the recorded order is rudder -40]. The model's `helm` value is the RUDDER's angle in
degrees, positive to starboard, and a positive rudder turns her head to starboard.

| Said | 1912 convention (the default) | Modern convention |
|---|---|---|
| "hard a-starboard", "hard a starboard", "hard astarboard" | helm -40 (head to port) | helm +40 |
| "hard a-port", "hard aport" | helm +40 (head to starboard) | helm -40 |
| "starboard ten", "starboard 10", "ten degrees starboard", "starboard your helm ten" | helm -10 | helm +10 |
| "port twenty" | helm +20 | helm -20 |
| "hard to starboard", "hard over to port" | as "hard a-..." in the convention in force | the same |
| "midships", "amidships", "helm amidships" | helm 0 | helm 0 |
| "steady", "steady as she goes" | helm 0 [bet: the model has no course to hold] | helm 0 |
| "ease to ten", "ease her to five" | the side now ordered, at that angle; refused if the helm is amidships | the same |
| "shift your helm", "reverse the helm" | helm 'reverse' | the same |
| "away from the ice", "clear the ice" | helm 'away' | the same |
| "hard over" (no side) | not an order: "Which way, sir?" | the same |

- Degrees are whole numbers, 1 to 40. "Hard" is 40. More than 40 is not an order: "She has forty degrees of helm".
- The readback names the way her head will go, so the convention is never a trap: "Hard a-starboard, sir. Her head
  goes to port."

### 4.3 The engines

The names are the model's own [read: `Mo.TELEGRAPH`]: full ahead, half ahead, slow ahead, dead slow ahead, stop,
dead slow astern, slow astern, half astern, full astern.

| Said | Order |
|---|---|
| "full ahead", "full speed ahead", "full ahead both", "both engines full ahead" | telegraph 'full ahead' |
| "half ahead", "half speed ahead" | telegraph 'half ahead' |
| "slow ahead"; "dead slow ahead" | telegraph 'slow ahead'; 'dead slow ahead' |
| "stop", "stop engines", "stop her", "all stop", "stop both" | telegraph 'stop' |
| "full astern", "full speed astern", "back her full" | telegraph 'full astern' |
| "half astern"; "slow astern"; "dead slow astern" | the same names |
| "port engine full astern", "full astern port", "starboard engine stop" | the name, with arg 'port' or 'starboard' |
| "seventy revolutions", "make seventy turns" | telegraph 70 (rpm), only within what the model accepts |

### 4.4 The doors, the fires, the pumps

| Said | Order |
|---|---|
| "close the watertight doors", "shut the doors", "close the doors" | doors 'bridge' |
| "open the door in bulkhead E", "close the door in bulkhead K" | door, that bulkhead, true or false |
| "draw the fires in boiler room six", "draw fires in number five" | fires, that room |
| "draw all fires", "draw the fires" | fires, all |
| "start the pumps in boiler room five", "pumps on boiler room 6" | pump, that room, 'own' |
| "all pumps on boiler room five", "put every pump on number 5" | pump, that room, 'all' |
| "stop the pumps in boiler room five" | pump, that room, 'off' |
| "leave the pumps to the engineers" | pump, -1, 'engineers' |

- Room and bulkhead names come from the model's own tables (the zones' names, the boiler rooms' numbers, the
  bulkheads' letters). The builder reads them from the code; the test holds every name to the model's.

### 4.5 The boats, the calls, the errands

| Said | Order |
|---|---|
| "uncover the boats", "clear away the boats", "swing out the boats" | boats:uncover 'now' |
| "women and children first" (and "... on the port side", "... starboard side") | boats:rule 'first', the side or 'both' |
| "women and children only" | boats:rule 'only', the side or 'both' |
| "fill the boats with anyone", "anyone who will go" | boats:rule 'fill', the side or 'both' |
| "lower them full", "fill every boat" | boats:fill 1 |
| "three quarters full"; "half full"; "lower them as they are" | boats:fill 0.75; 0.5; 0.3 |
| "send the call for assistance", "send a distress call", "call for help", "send CQD", "send SOS" | help:call 'cqd' |
| "fire a rocket", "send up a rocket", "fire the distress signals" | help:rocket 'socket' |
| "try the Morse lamp", "call her up with the lamp" | help:lamp 'cqd' |
| "go forward and look", "send someone forward", "Mr Boxhall, inspect forward" | report:look 'forward' |
| "look at the mail room"; "... the boiler rooms"; "... the engine rooms"; "... aft" | report:look 'mailroom'; 'boilers'; 'engines'; 'aft' |
| "sound the ship", "sound the wells", "send the carpenter to sound her" | report:sound 'wells' |
| "ask the engine room", "ring the engine room", "what does the engine room say" | report:ask 'engine room' |

### 4.6 The readbacks [authored]

One line an order, by the man who would answer it. A refusal carries the model's own reason after it.

| Order | Who | Words |
|---|---|---|
| helm | the quartermaster | the order repeated, "sir", and where her head goes |
| telegraph | the officer at the telegraph | the order repeated; "The engine room answers." |
| doors | the officer of the watch | "The watertight doors are closing, sir." |
| fires | the engine room | "Drawing the fires in boiler room six, sir." |
| pump | the engine room | the model's own sentence (it has one) |
| boats:uncover | the chief officer | "All hands to uncover the boats, sir." |
| boats:rule, boats:fill | the officer at the boats | the rule repeated |
| help:call | the wireless room | "Mr Phillips is sending the call, sir." |
| help:rocket | the fourth officer | "Rocket away, sir." (the first: "A man has gone aft for the rockets, sir.") |
| help:lamp | the fourth officer | "Calling her up with the lamp, sir." |
| report:look, sound, ask | the man sent | "Going forward now, sir." and the like |

- When `TitanicApp.order` returns a refusal, the line is the refusal: "No steam for the pumps: ...".
- The same `phrase` captions the orders the night's own script gives, so the 1912 watch speaks: "Hard
  a-starboard!" on the step the script gives helm -40.

## 5. The part on the page

- **Where.** In the side panel, where the other parts keep their order controls (the builder follows
  `60_reports.js` and `70_help.js`): one text line, "Give an order", and under it the bridge's talk, the last eight
  lines of what was said and answered. No new overlay stands on the stage. A reply is also raised as the page's own
  notice (`toast`), which the stage already places.
- **Typing.** Enter gives the order. The up arrow recalls the last ones. While the line has the focus, the page's own
  keys (the wheel's, the telegraph's, the walk's) do nothing.
- **Not on a watch** (a preset, or she has gone): the line is disabled and says why.
- **The convention.** A switch, "1912 helm orders" or "modern", kept in the page's storage as the sound's volume is.
  The line under it says what is in force: "Hard a-starboard turns her head to port."
- **The script's orders.** The part watches the watch's log grow, step by step, and captions each order it did not
  give itself, in the bridge's words, with who gave it (the script: "the officer of the watch"; the wheel or the
  telegraph: "you").
- **It feeds nothing back** but orders. With no order typed, the watch's fingerprint is the model's.

## 6. Tests

`tools/crew_tests.js` (headless, seconds, in `--quick`), every row a MUST unless marked:
1. **The table.** Every row of section 4's tables, and at least sixty more spellings (case, punctuation, fillers,
   names, numbers in words, both conventions, sentences of two and three orders), each to its exact orders.
2. **Not orders.** Twenty sentences that must order nothing: questions, half sentences, "hard over" with no side,
   forty-five degrees, nonsense. Each with its kind.
3. **The model accepts what the grammar gives.** Every order the grammar can emit, given through `Night.act` on a
   1912 watch after the ice, is accepted or refused with a reason; none throws. Every telegraph name is in
   `Mo.TELEGRAPH`; every room and bulkhead is the model's.
4. **The round trip.** `parse(phrase(o))` is `o`, for every order of row 3, in both conventions.
5. **The night's own orders have words.** Every entry of the 1912 watch's own log gets a phrase.
6. **The library is pure.** It keeps no state: two calls, the same answer; nothing on `globalThis` but its name.

`tools/crew_site_test.js` (a browser, the virtual clock):
1. The 1912 drill TYPED, each order entered on the step `night_site` clicks it, gives the night's own fingerprint,
   the page's and Node's the same.
2. A typed order is in the watch's log on that step, with the right value; the readback is shown, and names her
   head's way.
3. A refused order shows the model's reason, and the log holds the refusal.
4. With the part and nothing typed, the watch's fingerprint is the model's alone.
5. The link of a typed night replays it.
6. On a preset the line is disabled. While typing, a "d" does not move the wheel.
7. The 1912 script's helm order is captioned in the bridge's words on its step.
8. No error in the console. `clock_tests` and `layout_site` unchanged (run beside it).

## 7. Step 2, the voice (after the app's shell is on main)

Ported from the ATC simulator and Fathom [read: the scout's report; nothing measured]:

- **The key.** A "Voice" dialog; the field is read once and cleared. The main process keeps the key in a secret
  store, encrypted by the system's key store. The window gets `has`, `set`, `clear` only. Every call from the window
  is checked for its sender and its arguments' shapes.
- **Ears.** Hold Space on an empty order line, or a microphone button. An audio worklet makes 16 kHz frames of 100 ms.
  The main process opens one socket a transmission to Deepgram (nova-3), the key in the subprotocol, never the
  address. `smart_format` and `punctuate` are off: the grammar wants words. `VOCAB` goes as key terms (at most 100).
  The final transcript goes to the SAME `submit` as typed text. A dropped socket's half transcript is thrown away.
- **A voice.** The readback is spoken by Deepgram's own voices on the same key (Fathom's `speak`), with the caption
  always shown. The browser's own speech is the floor.
- **The network.** The window still makes no request. Only the main process calls out, only to Deepgram, only when a
  key is set. The microphone is granted to the app's own window alone, audio only.
- **Tests.** A fake Deepgram on this machine (the ATC simulator has one); a scripted transport under the app's
  self-test; a test that spies every output for the key; the worklet run in Node.
- **Step 0, before it:** time a real transmission from this desktop, with Bo's own key, typed by him.

## 8. Decisions made here, for Bo to overturn

1. The order line lives in the side panel in step 1; a place on the Bridge itself can follow once its layout is
   designed (desktop first).
2. "Steady" is helm amidships until the model can hold a course [bet].
3. The crew's lines are authored, short and plain. The record's own words are marked where they are used.
4. Three questions are answered with no model, from what the bridge knows: "how long has she got", "where is the
   water", "has anyone answered". They are a CHECK in step 1, and wait if they cost the step its date.

## 9. Not in this design

Jev, an LLM, the AI watch, the personas' conversation: steps 3 and 4 of the brainstorm, each with its own design.
