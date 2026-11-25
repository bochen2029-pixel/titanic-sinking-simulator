# The living crew: bring your own key. A brainstorm, v1

2026-11-23 CST. Written by fork 2 of the coordinator's session ("the BYOK lane"), at Bo's request. It is a brainstorm:
nothing here is decided and nothing is built. This is the first version.

Tags: [read] = read in a source today; [derived] = worked out here; [bet] = a judgement to test.

## 0. The ask

Bo, 2026-11-23 (his words as typed, trimmed):

> "In this day and age what sets sims/games apart isn't JUST physics, or JUST graphics but the aliveness ...
> Language models have a unique way of doing "roleplaying" that pre LLM era couldn't match ... so with the BYOK
> concept this really now can be pushed in new paradigms"

> "there can be an AI captain, or role playing crew ... with the same one ai api key it can be made to roleplay
> several crews ... they could in theory TALK commands to the crew/ship ... so the way the ship sinks and what happens
> that night affects the actions, speech, thought of captain smith or thomas andrews ... so its dynamic and never
> scripted"

He named three kinds of key, each with a project of his that already uses it:
1. **Jev and Clef**, TypeSafe's fast typed "decision" models (text and images): his airliner's flare, his self-parking
   car, and two of his apps.
2. **Deepgram**, real-time speech to text: his ATC simulator.
3. **Any LLM API**: his Santa tracker of last Christmas, where plain language becomes allowed commands that drive the
   simulation deterministically.

What was read for this note is in section 14.

## 1. The answer in one paragraph

**The model computes, Jev judges, an LLM speaks, and Deepgram listens and gives the voice.** None of them touches the
physics. Every decision an AI officer makes becomes one of the watch's existing typed orders, given through
`TitanicApp.order`: so it is validated, logged, and replays later with no key at all. The crew know only what the
bridge was told, when it was told (`core/readers/reports.js`), so they are honest by construction: no persona can
see the flooding the way the X-ray view does. Each key unlocks one faculty (ears and voice, judgement, speech), in any
combination, and with no key the ship still answers in plain period sentences. Most of the crew's mind is already in
the model. What is missing is ears, a voice, and judgement in words.

## 2. What the simulator already has

This is the surprising part: the hard pieces exist [read: the code at main `cc96b35`].

**The typed command set.** Every order goes through `Night.act(sim, type, value, arg)`, which validates it, logs
`{k, t, type, value, arg}` and records a refusal with its reason.

| Order | Value | Arg |
|---|---|---|
| `helm` | degrees (the page clamps ±40), or 'away', 'toward', 'reverse' | |
| `telegraph` | full, half, slow or dead slow, ahead or astern; stop; or rpm | port, starboard, or both |
| `door` | a bulkhead | open or release |
| `doors` | 'bridge': the switch for the tank-top doors (needs current) | |
| `fires` | a boiler room, or all: draw the fires | |
| `pump` | a room | a pump, 'own', 'all', 'off', 'engineers' |
| `boats:uncover` | 'now' | |
| `boats:rule` | 'only', 'first' or 'fill' (who may board) | port, starboard, both |
| `boats:fill` | 0.3, 0.5, 0.75 or 1 (how full to lower) | |
| `help:call` | 'cqd' | |
| `help:rocket` | 'socket' | |
| `help:lamp` | 'cqd' | |
| `report:look` | forward, mailroom, boilers, engines, aft (send a man) | |
| `report:sound` | 'wells' (answer in 10 min) | |
| `report:ask` | 'engine room' (answer in 8 min) | |

- A refusal already comes back as a crew's sentence: "No steam for the pumps: ...".
- A watch is its seed and its orders, and replays to the bit. A shared link carries the orders.

**The crew's limited knowledge.**
- The reports reader holds what the bridge was told and when. Each entry has the time the fact was true and the
  time it reached the bridge: the mail clerk's report takes 5 minutes, the chief engineer's 10 to 20.
- `knowledge(sim)` is the bridge's picture: each compartment's state in words, the list, the trim, the estimate.
- Andrews's estimate is already there: 13 minutes after the first water report, drawn from the model's own forecast.
- The page has an "As the bridge knew it" switch. An AI crew simply lives behind it, always.

**The people and the ether.**
- The boats' rule is already per side: starboard "women and children first", port "women and children only". That
  is Murdoch and Lightoller, as a setting.
- The wireless has its own feed of lines, and eight ships that hear or don't: Carpathia, Californian, Mount Temple,
  Frankfurt, Birma, Virginian, Baltic, Olympic.

**The drama's beats.** The director's cut list is data: the bells, the touch, the first report, the designer's
estimate, the first boat, the first rocket, water over a bulkhead, the forecastle under, the bridge, the dark.

**Coming in join 16:** the nervous-system graph (each system green, amber or red, with its reason and time), her
lights by circuit, the kept set's bands ("30 of 30"), and the counterfactual gallery.

## 3. Three keys, three faculties

| Key | Faculty | What it adds | Cost and speed |
|---|---|---|---|
| none | the floor | Standard orders typed or clicked; a grammar reads typed orders; replies in authored period sentences; captions. Optional: the browser's own speech | free |
| Deepgram | ears and voice | Push-to-talk orders (speech to text, with her vocabulary boosted). The crew's replies aloud (Deepgram's Aura voices, the same key) | per minute of speech [to price] |
| Jev or Clef | judgement | Free speech becomes the right order. AI officers decide. A lookout with eyes. The fitting line picked from authored ones | about $0.042 per million tokens in, output free; 0.15 to 0.5 s quoted [read] |
| an LLM | speech and thought | The personas' own words: conversation, the conference on the bridge, the wireless's wording, the inquiry, the docent | by provider; a few calls a minute at most |

- The faculties stack. Deepgram alone gives a voice-commanded bridge. Jev alone gives an AI watch that picks its
  lines from authored ones. An LLM alone gives officers to question by typing. All three give the whole crew.
- "System One" is the right name for the split [read: TypeSafe's term]: Jev is the crew's trained reflex and
  judgement, many small decisions a minute; the LLM is their deliberate speech, a few lines a minute.
- **What Jev is, exactly** [read: Bo's code and notes]:
  - one call, `POST /v1/systemone`, carrying a `state` and a set of `questions`;
  - four answer types and nothing else: `noul` (a yes/no probability), `choice` (one of the options given, with
    probabilities), `score` (an ordered level) and `box` (a region of an image);
  - no free text, no counting, no number read from the input;
  - images are a preview feature;
  - Clef and Clef-flash are open-weight cousins that speak the same API, so a strong desktop could run the judgement
    locally with no key [bet].

## 4. The architecture

```
 the player's voice ──► Deepgram (speech to text) ──► words
 the player's typing ─────────────────────────────►  words
                                                       │
            ┌──────────────────────────────────────────┘
            ▼
   the grammar (code, no model) ── a standard order? ──► (type, value, arg) ──┐
            │ not one                                                         │
            ▼                                                                 │
   code proposes candidates ──► Jev: choice ──► an order ─────────────────────┤
            │ a question, or talk                                             ▼
            ▼                                                        TitanicApp.order
   persona + what he knows ──► LLM ──► his words                     validated, logged,
                                                                     replayed without a key
 the model's events                                                           ▲
 (reports, systems, boats, wireless, beats)                                   │
            ▼                                                                 │
   the situation compiler ──► Jev: noul, choice, score ──► an AI officer's order
            │
            └──► a line (authored, or the LLM's) ──► caption ──► voice
```

Five rules hold it together:

1. **The order is the only door.** An AI officer, like a part of the page, acts only through `TitanicApp.order`. The
   model's own validators refuse what cannot be done. Nothing else an AI says or decides reaches the model.
2. **Code proposes, the model picks.** Numbers stay in code. The grammar reads "ten degrees"; a candidate list offers
   Jev the orders that are legal now, each written out in full, plus "none of these". This is the lesson of Bo's own
   Jev work [read].
3. **The seat.** A persona's request is built only from what he could know: the bridge's knowledge, or his own
   station's instruments. The request log then proves the AI never saw the truth (section 9).
4. **Keys live in the app's main process.** The window never reads a key and never makes a network request. This is
   the ATC simulator's pattern, unchanged (section 9).
5. **Every faculty has a floor.** No key, no network, a slow answer or a wrong one: the ship still works, on the
   grammar, the authored lines and a plain doctrine.

Where the code would live:
- **A library with no DOM**, testable in Node as `24_wake_field.js` is: the grammar, the candidate and situation
  compilers, the questions' schema, the persona cards, the answers' validation.
- **A part of the page** (`site/parts/9x_crew.js`): the order line, push-to-talk, captions, the crew's panel, the
  request log's viewer. It reads the model and gives orders only through `TitanicApp.order`, as every part must.
- **The app's main process:** the key store, and the three providers behind a narrow interface (`has`, `set`,
  `clear` for a key; `listen`, `speak`, `judge`, `say`). The page sees no key and no address.
- **Nothing in `core/`.** The model stays deterministic and offline.

## 5. The cast

Each persona is a card of sourced facts, as the rooms are a table of sourced facts: his station, what he knew and
when, what he could order, his recorded words, and how he decided.

| Persona | Station | Knows (his seat) | Can order | Faculty |
|---|---|---|---|---|
| Captain Smith | the bridge | `knowledge(sim)`: reports as they arrive | anything, through his officers | LLM for words; Jev for "is it time?" |
| First Officer Murdoch | officer of the watch; starboard boats | the lookout's bell, his own eyes | helm, telegraph, doors in the first minute; `boats:rule` starboard | Jev: the reflex |
| Second Officer Lightoller | port boats | the boats, the deck | `boats:rule` and `boats:fill`, port | Jev, with his own prior |
| Fourth Officer Boxhall | errands, rockets, the lamp | what he was sent to see | `report:look`, `help:rocket`, `help:lamp` | Jev |
| Thomas Andrews | everywhere, then the bridge | the estimate, from the model's forecast | none: he advises | LLM: he words the model's numbers |
| Chief Engineer Bell | the engine room | the systems' states and their reasons | pumps, fires | Jev; authored lines |
| Phillips and Bride | the wireless room | the set's state; who has answered | `help:call` | LLM for the traffic's wording |
| The lookouts, Fleet and Lee | the crow's nest | the frame from the nest's eye | the bells | Jev's eyes (section 6, D) |
| The quartermaster | the wheel | the order given | reads it back | authored lines |

How a persona differs from another, with the same model behind both [derived, after the submarine brainstorm]:
- **A prior.** His choice is Jev's probability weighted by his own doctrine. Lightoller's leans to "women and
  children only"; Murdoch's to "first". A cautious captain uncovers the boats early.
- **Hesitation.** A low confidence means he waits, sends a man to look, or asks again. That costs nothing extra.
- **Honest mistakes.** He is wrong when his reports are late or thin, never by a dice roll.

Care with real people:
- Generated speech is labelled as imagined, wherever it appears.
- The record's own words (the 1912 inquiries are public domain) are shown as the record, apart.
- Smith, Andrews, Murdoch, Phillips and Bell died that night. Their words come from survivors: a card says so.
- No named passenger without a sourced, public list. Stewards and passengers are composites.
- Never comic. A cheap check on every generated line can enforce the register (section 9).

## 6. What the player can do

Ordered by how much each gives for its work.

**A. Speak the orders.** You are the captain. Hold a key and say "Hard a-starboard", "Stop", "Close the watertight
doors", "Send the call for assistance", "Uncover the boats". The quartermaster reads the order back; the model does
the rest. A grammar reads standard orders with no model, as the ATC simulator's does [read]. Jev takes free speech.
- One trap, and a nice detail: in 1912 helm orders were tiller orders. "Hard a-starboard" put her head to PORT
  [read: the bridge note, and `core/night.js`, where the recorded order is rudder -40]. The grammar must speak the
  1912 convention, with a switch for the modern one, and the readback must say which way her head will go.

**B. Ask the bridge.** "Mr Andrews, how long has she got?" He answers in his own register, from the model's forecast
and nothing else: "An hour. Perhaps an hour and a half." The band is the kept set's. "Mr Bell, can you give me the
pumps on boiler room five?" The answer is the plant's own.

**C. The AI watch.** Hand any seeded night to Smith and his officers. Jev decides when to send for the carpenter,
uncover the boats, call for help, fire the rockets, and how to load the boats. Every decision is an order in the log.
Watch it with the director, or take the ship back at any moment, as the page already allows.

**D. Stand lookout.** The nest's own eye is a view already. Give Jev that frame several times a second and ask: is
there ice ahead, and where? Show "what the lookout saw" beside it, as Jev Park shows what Jev saw.
- It is the one mode that needs the model changed: the sighting is drawn from the night's seed today, so an outside
  sighting must become a logged order. That is a design of its own.
- The Night look is an appearance, not a photometric night. Until it is one, this is a demonstration, not a finding.

**E. The wireless room.** The model decides who hears, how far the set reaches and when its power sags. The LLM words
the traffic in the operators' own code, and plays the other ships' operators. The research note has the night's
traffic word for word [read: its title].

**F. The inquiry.** After the night, counsel examines you on your own log: "At 11:40 you ordered the helm hard over.
Why was the speed not reduced?" The evidence is the gallery's: "struck head-on, she is afloat at eight hours in 30 of
30". The rule holds here too: never "she could have been saved" on one model.

**G. The docent.** Ask the ship anything: "Why is she listing to port?" It answers with the model's numbers and the
ledger's witnesses, and can take you there: a view, a moment of the night, a walk to a cabin.

**H. Voices of the night.** At the moment the model reaches a ledger row, the witness's own testimony is read aloud.
Nothing is generated: the words are the inquiry's.

**I. The captain's bench.** Headless, with no page: the order set is already an agent's action space, the bridge's
knowledge its observations, and the people saved and her time afloat its score, across the kept 30 members.
- Baselines exist: the 1912 script, a plain doctrine, and the Carpathia search's best night as an upper bound.
- "Which model saves the most people on the Titanic?" is a question this simulator can answer honestly, with k of N.
- It is also the test bed for every persona before it reaches the page.

## 7. How Jev would be asked

Sketches in the System One shape [read: the request's fields; the wording is a bet].

**Speech to an order.** One call, three questions:

```
state:     { "said": "tell the engine room to stop her", "bridge": "<what the bridge knows, in a few lines>" }
questions:
  kind   (choice): an order | a question to someone | talk | none of these
  order  (choice): one entry per order that is legal now, each written out:
                   "telegraph stop, both engines" | "telegraph full astern, both engines" | ... | none of these
  to     (choice): the quartermaster | the engine room | the wireless room | Mr Andrews | ... | nobody
```

**An officer's beat.** One call every half minute of her time, or on an event:

```
state:     { "bridge": "<knowledge(sim) in words>", "since": "<the reports since the last beat>" }
questions:
  uncover (noul):   "Should the boats be uncovered now?"
  call    (noul):   "Should the call for assistance be sent now?"
  gravity (score):  no concern | caution | serious | she is lost
  next    (choice): the legal orders now, each written out | send a man to look | wait
```

**The lookout's eyes.** One frame, two questions, always paired: `ice` (noul) and `where` (box).

The rules, from Bo's own lessons with Jev [read]:
- Shuffle the options in every request, with the night's seed, and map the answer back: an early version leaned to
  the first option.
- Give every choice a way out. A choice always picks one.
- A box always comes back, so it is believed only when its yes/no passes.
- Many questions in one call: thirteen in one were about ten times cheaper and faster than thirteen calls.
- Pin the model's version. Reject a response whole if any answer is missing or of the wrong type.
- Thresholds with a margin (0.7 to act, 0.3 to drop), so a decision does not flicker.

## 8. Time, cost and the clock

- **Her clock waits for the captain** [derived, after the submarine brainstorm]. At her own pace, a third of a
  second hides inside any crew's reaction. At sixty times her pace it is twenty seconds of her night. So while a
  decision or a line is pending, the crew holds the pace (`holdPace`, as the director and the reports already do).
- **An order lands on the step it lands.** A slow answer is a slow officer, and it is in the log as such.
- **Scenes ride the director's beats.** The collision, the first report, the estimate, the first boat: each is
  already a moment the page slows for.
- **The forecast is a prompter** [bet]. The model knows what is coming, so a line can be asked for a minute before
  its moment and be ready on time.
- **Cost of a night** [derived; to be measured]:
  - Jev: one beat every half minute of her 160 minutes is about 320 calls of some 2,000 tokens: under 3 cents. <!-- leak-scan: allow-amount -->
  - An LLM: some 50 to 150 short lines, a few cents to tens of cents by provider. <!-- leak-scan: allow-amount -->
  - A meter on the page shows the night's calls and tokens, with a cap the player sets.
- **Measure before believing.** TypeSafe quotes 0.15 to 0.5 s; the first real calls from Bo's phone took 5 to 11 s
  [read]. Nobody has yet called Deepgram from the ATC simulator [read]. The first step of any build is to time all
  three from this desktop.

## 9. Safety and honesty

**Keys.**
- A key is typed once into a dialog, goes to the app's main process, and is kept encrypted by the system's key store.
  The window can ask whether a key is set, set one, or clear it. No call returns it [read: the ATC simulator].
- It is never in a link, a log, the watch's tape, an export or a picture. A test spies on every output for it.
- On Windows the key store keeps it from other users, not from the player's own programs. The dialog says so.

**The network.**
- Off by default. The window makes no request, as the app's design asks; only the main process calls out, and only
  to the providers the player has set.
- A lamp on the page shows when anything is being sent, and a page says what each provider is sent: speech to
  Deepgram; the bridge's knowledge and a frame to Jev; the same knowledge and the conversation to the LLM.
- The public page blocks the microphone and any outside call today [read: its headers]. Three ways forward:
  1. the app first, and the public page stays as it is (recommended);
  2. a relay on the page's own origin, holding a demo key with a tight quota, as Jev Park does [bet];
  3. changed headers and a key in the page: the weakest, and the Santa tracker's gap (below).

**A model's output is data.**
- It is written as text, never as markup. The Santa tracker writes replies as markup beside a key kept in the page's
  storage: a crafted reply could read the key [read]. Neither is repeated here.
- An order is carried out only if the model's validator accepts it, with a cap on orders a minute per persona.
- A number in a generated line must be one of the numbers the line was given. Code checks that; no model is needed.
- A cheap yes/no on each generated line holds the register: in period, in character, respectful.

**Honesty you can audit** [derived, after the submarine brainstorm].
- The request log shows exactly what each persona was told and asked. "What Jev was asked" is one click away.
- The tape (requests, answers, lines) is saved beside the watch, so a night replays the same performance with no
  key and no cost. The link still carries the orders alone.
- Who gave an order (the player, or which officer) is kept in the tape, so the model's log needs no change.

## 10. Tests

In the repository's own manner: each claim has a row.

- **Headless, no network:**
  - a table of utterances and the orders they must become, the 1912 helm convention included;
  - the candidate compiler never offers an order the model would refuse;
  - the seat: change what the bridge cannot know, and the request's bytes do not change;
  - a response with a missing or mistyped answer is rejected whole; a shuffled answer maps back;
  - the number check on a line.
- **Fake providers on this machine** (a fake Deepgram exists in the ATC simulator; a fake System One and a fake LLM
  are small): no request without a key set; requests only from the main process; the key in no output.
- **In a browser and in the app:**
  - a watch with the crew part and no AI order has the model's fingerprint;
  - a night the AI ran replays from its log to the same fingerprint with every provider off.
- **The bench:** doctrine against Jev against an LLM, over seeds and the kept 30, before any persona reaches the page.

## 11. A first build

Each step is useful alone, and none moves a fingerprint.

| Step | Key | What | Size |
|---|---|---|---|
| 1 | none | The crew library and the order line: type an order in words; the grammar reads it; an authored readback and a caption answer. Works on the public page as it is | S to M |
| 2 | Deepgram | Push-to-talk in, the crew's voices out, in the app: the key store, the narrow interface, the fake server's tests. Ported from the ATC simulator and Fathom | M |
| 3 | Jev | Free speech to an order; the AI watch for the night's standing decisions, with a doctrine as its floor; the request log's viewer | M |
| 4 | an LLM | Ask Andrews, Bell and Lightoller; the inquiry | M |
| 5 | | The wireless room; voices of the night; the lookout's eyes; the captain's bench as a public table | later |

- Step 0, before all of them: time the three services from this desktop, and write the numbers down.
- The app's shell arrives with join 16 (NH13). Step 2 builds on it, and returns the key store and the narrow
  interface that were taken out of Fathom's shell for it.

## 12. Decisions for Bo

1. **Where first:** the app (recommended), or the public page as well.
2. **Which step first:** 1 and 2, the spoken bridge (recommended: it is the visible one, and its parts are already
   written elsewhere), or 3, the AI watch.
3. **Helm orders:** the 1912 convention by default, with a switch (recommended), or modern only.
4. **The cast:** the officers by name, with generated speech labelled as imagined (recommended), or ranks only.
5. **The voice:** Deepgram's own voices on the one key (recommended to start), the browser's speech, or another
   service later.
6. **A local model** (Clef-flash, or LM Studio for the LLM) as a path with no key: explore it early, or later.
7. **The captain's bench:** build it as a public table, or keep it a private test.

## 13. Risks

- **Speed in practice** may be far from the quoted figures. Measure first; the floor must carry the ship regardless.
- **Images are a preview** in Jev, and their calibration is unproven. The lookout waits for that.
- **Taste.** A bad line about a real man is worse than no line. The label, the register check and authored floors
  are the guard; the first cast should be small.
- **Question design is the real work** [read: the submarine brainstorm]. A poor menu makes a dull officer.
- **Providers change.** Pin versions; keep every provider behind the one narrow interface.
- **Scope.** This must not delay the physics' next epochs. It is a part and a library, apart from the model.

## 14. Sources

Read 2026-11-23, by five read-only scouts:
- The Santa tracker (one HTML file of last Christmas): its command registry, its prompt, its providers, its gaps.
- The ATC simulator: its Deepgram voice path, its key store, its tests; and Fathom's shell beside it.
- Two of Bo's apps that call Jev, for the System One request and its lessons.
- `BRAINSTORM_jev_as_the_ai_captain_v1_2026-11-03.md`, written for his submarine simulator: "code computes, Jev
  judges", the layers, personality as a prior, the clock that waits, the tape. This note stands on it.
- This repository at main `cc96b35`: `core/night.js`, the readers, `site/parts/80_director.js`, `dist/_headers`.

Not read, or not checked:
- TypeSafe's own pages and the public pages of the flight simulator and Jev Park (a scout was still reading when this
  was written; its facts go into v1.1).
- The flight simulator's and Jev Park's sources, which are not on this machine.
- Deepgram's prices and voices; any provider's live behaviour. Nothing here was measured.
