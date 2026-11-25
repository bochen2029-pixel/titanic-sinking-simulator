# Ask the bridge: the crew's own words, with the player's own key. The design (v1)

2026-11-23 CST, fork 2 ("the BYOK lane"). It designs the living crew's persona step
(`BRAINSTORM_byok_living_crew_v1_2026-11-23.md`, step 4, with its v1.2 to v1.4) and follows
`DESIGN_spoken_bridge_v1_2026-11-23.md`, whose step 1 (the order line) is built on this branch.
**Status: a design. Nothing of it is built. Nothing here has been timed or priced on a real key.**

Bo's word, 2026-11-23, on what he wants by the end of the week: "if possible, an integrated BYOK for at least the role
playing persona aspects of this all even if not JEV/CLEF or deepgram yet". So this step comes before the voice and
before Jev.

Tags: [read] = read today in the code, a repository note or a provider's own reference; [derived]; [bet] = a
judgement to test or a figure to measure; [authored] = written here, not the record's words.

## 1. What it is

On a watch the player is the captain, on the bridge. He types to the people who are there, in his own words, and each
answers in character, as that man, from what that man knows. The words are a language model's. The facts are the
simulator's. The player brings his own key (BYOK) and it stays in the desktop app.

- "Mr Murdoch, what did you see?" "Mr Andrews, how long has she got?" "Mr Boxhall, what is it like forward?"
- An order in order words is still an order with no model: the grammar of step 1 reads it first, at once, for nothing.
- A command in free words ("get her stern clear of it, Mr Murdoch") goes to the man. He may answer with an order. By
  default he offers it and the captain confirms it; it is then given through `TitanicApp.order` like any other.
- With no key, or with the switch off, the page is step 1's page and the app is today's app.

## 2. The rules it keeps

1. **Nothing speaks as the ship** (Bo's first principle, v1.2). Every line has a named person. No line is labelled
   "AI". A fault of the key, the network or the budget is a plain notice outside the fiction, never a person's line.
2. **The fog of the bridge** (v1.3). A man's facts are built from a fixed whitelist: what reached his station by a
   channel the model has. He is never given the model's truth, the forecast, the X-ray or the nervous system. Tested.
3. **Nobody talks across the ship** (Bo's second principle, v1.4). A man answers only if he is in earshot or on a
   line that is up. This design keeps that with the model's own state, before the presence reader exists (section 4).
4. **Words change beliefs, never the world.** A reply can do two things only: be shown as text, and name one order.
   An order is one the grammar can give, and it goes through `TitanicApp.order`: validated, logged, replayable with
   no key.
5. **The model stays deterministic.** The language model is outside it. A watch has the same fingerprint with this
   part as without, whatever is said.
6. **The key never reaches the window after it is typed, a log, the tape, a link or a file of the repository.** Only
   the app's main process calls out, only to the one host the player set, only while the switch is on.
7. **The page's rules for a part** [read: CLAUDE.md]: orders only through `TitanicApp.order`; the page's one clock;
   no overlay placed on the stage; out of `site/app.js`, the template and `styles.css`.
8. **Respect.** These were real men, and most of them died that night. A card holds sourced facts only. No man is
   made to speak of his own end, of anyone's conduct beyond the facts given, or of the legends told afterwards.
   Every generated line is marked as imagined.

## 3. What the player sees

In the section "Orders to the bridge" (step 1), on the Run tab:

- **Who is in reach.** A row of names: who is on the bridge, who is on a line, and for the others why not ("Mr
  Boxhall has gone forward", "Mr Andrews is not on the bridge"). A click sets who is spoken to; a name at the start of
  the line does the same ("Mr Moody, ...").
- **The line** is step 1's. What the grammar reads as an order is given, with step 1's own answer. What it does not
  read goes to the man spoken to (the officer of the watch if nobody is named), if minds are on and he is in reach.
- **The bridge's talk** shows his answer under the player's words, with his name and the ship's time, marked as
  imagined. While it is awaited the line shows that he has been asked.
- **An offered order** stands under his line as two buttons, "Give it" (with the order in the bridge's words and,
  for the helm, where her head will go) and "No". Typing "yes", "aye" or "do so" gives it. It lapses after a minute of
  her time.
- **"The crew's minds"**, folded shut under the talk: the switch (off by default), the provider, the model, the key
  (a field read once and cleared; Save, Forget), "Try it", how far the officers may act (section 7), this night's use
  (questions asked, tokens in and out) and its limit.
- **On the public page** the folded section says that the crew's own words need the desktop app, and why: a public
  page cannot keep a key or call a provider (its policy forbids both [read: `dist/_headers`]).

## 4. The cast, and who can be reached

v1 has the bridge's own people. Each is reachable by a rule on the model's state. A rule keyed to the record's clock
is a [bet] until the presence reader (`DESIGN_presence_v1_2026-11-23.md`) replaces this table.

| Person | Seat | In reach while | Tag |
|---|---|---|---|
| First Officer Murdoch | the officer of the watch | until the boats are called (`sim.people.callT` passed) | [derived: he worked the starboard boats] |
| Sixth Officer Moody | the junior officer, in the wheelhouse | until the boats are called | [bet] |
| Fourth Officer Boxhall | on the bridge | not out on an errand: no task or queued line of the reports reader carries him | [read: `reports.js`] |
| Quartermaster Hichens | at the wheel | until the wheel is relieved (the routine's line) | [read: `reports.js` ROUTINE] |
| Mr Andrews | with the captain | from his estimate reaching the bridge, for ten minutes | [bet] |
| Chief Engineer Bell | the engine room, by telephone | the telephones have current, and the engine room has not been left (second stage, after join 16's `sim.reports.phone`) | [read: the bridge note; join 16] |

- The captain is the player. Captain Smith as a persona belongs to section 14's last stage.
- The wireless room has no line to the bridge [read: the bridge note]. Talking to Phillips and Bride waits for
  presence, and for Bo's decision on the player's own body (the brainstorm's decision 11).
- The reach rule is a pure function of the state, in the library, with a test for each row. When a man is not in
  reach, no request is made: the row says where he is.

## 5. The fog of the bridge

One function gathers a seat's view from the state, and it is the only one that touches the state. Everything after it
works on that view. The bridge's seats share one view:

| What | From | Kept out |
|---|---|---|
| The ship's time; minutes since she struck, once she has | the page's clock of the watch; `sim.night.tTouch` | |
| What each compartment is known to be, by whom, since when | `Reports.knowledge(sim).zones` | the levels themselves |
| Her list by the commutator; her trim by eye | `knowledge().list`, `.trim` | her true pose |
| Mr Andrews's estimate, once given | `knowledge().estimate` (words and when) | `forecast`, `biased` |
| The reports as they arrived | `Reports.feed(sim)`: time, channel, who, how, words | each entry's `data`, `qty`, `tFact` |
| Who is out on an errand | `knowledge().errands` | |
| The orders given on this watch | `sim.night.log`, each in the bridge's words | |
| The helm and the telegraphs as ordered | `sim.mo.delCmd`, `setP`, `setS` | her speed through the water, the revolutions made |
| The boats: uncovered or not, the rule each side, how full, how many are away | the boats reader's readouts | who is in them, the counts aboard |
| The wireless and the signals, as told to the bridge | `sim.world.lines` | the other ships' true places |
| What has been said on the bridge | this part's own talk, the last twelve lines | |

- The chief engineer's view (second stage) is his own: the steam, the fires, the pumps at work and the water in the
  boiler and engine rooms as his men see it, and what the bridge has told him by the telephone. Not the holds, not
  the estimate, unless told.
- The view becomes a block of plain text, THE FACTS, in a fixed order, with every time as the ship's clock. It is
  about 400 to 900 tokens in the middle of the night [bet].
- **Tests of the fog** (section 13): the gathering function reads no path off its list; a change the bridge cannot
  know leaves the block's bytes unchanged; a report delivered changes them; no fact appears before the moment the
  reports reader delivered it.

## 6. The turn

### 6.1 What is asked

Two parts, so that the first can be cached by a provider that caches a stable prefix:

- **The stable part, one per man.** Who he is (his card, section 6.4); the year, the ship, where he stands; how he
  speaks (one to three plain sentences, the register of a 1912 British merchant officer or seaman, "sir" to the
  captain, no stage directions, no quotation marks, no narration); the rules (he knows only THE FACTS and his trade;
  where he does not know he says so, or says who would; he invents no number, name, time or report; he does not know
  what the night brings; he never speaks of a simulation, a model or anything later than April 1912); the helm's
  convention in force, as a two-line table; the bridge's order words; the form of the answer.
- **The changing part.** THE FACTS; the talk on the bridge; the captain's words to him.

### 6.2 What comes back: a typed turn

```
{ "say":   what he says, one to three sentences, at most 400 characters
  "order": null, or ONE order restated in the bridge's order words ("full astern", "starboard ten") }
```

- The form is one fixed JSON schema for every man and every turn [read: a provider compiles a new schema once and
  keeps it; a schema that changed each turn would be compiled each turn].
- **The order is read by step 1's grammar, in the convention in force.** It counts only if the grammar reads it as
  exactly one order and that order is in the man's remit (below). Anything else is dropped and noted in the tape.
  So a persona can give no order that a player could not type, and no order the grammar cannot check.

| Seat | Remit |
|---|---|
| The officer of the watch | the helm, the telegraphs, the doors' switch, the boats' orders, an officer sent to look |
| The quartermaster | the helm |
| The junior officer | the telegraphs, a note to the engine room, the carpenter to sound |
| The fourth officer | going to look himself, the rockets, the Morse lamp |
| Mr Andrews | none: he advises |
| The chief engineer | the fires, the pumps |

### 6.3 The checks on the words, by code

Before a line is shown:

1. **Its shape.** It parses, has the two fields and nothing else, and `say` is a short string of text.
2. **Its numbers.** Every number in it (in digits, or in words from two up) and every clock time is one that stands in
   THE FACTS or on his card.
3. **Its names.** A ship named is one the bridge has been told of, or one on his card. A person named is aboard.
4. **Its world.** None of a short list of words that give the frame away or were not said in 1912 ("as an AI",
   "simulation", "radar", "okay" and the like); the list is data, each word with its reason.
5. **The end.** Nothing about how the night ends, or about any man's fate.

- A line that fails is asked for once more, with the fault named. If it fails again, the man says the authored line
  for not knowing ("I couldn't say, sir."), and the tape keeps both.
- These checks are code, exact and free. They do not judge whether a line is in character or true to the facts in
  its meaning: that is a later step, with a small typed model as the judge (v1.4, section 30).
- Text from a reply is shown as text, never as markup [read: the Santa tracker's gap].

### 6.4 The cards

A card is data in the library: his name and rank, his age, where he was from, his years at sea and his ships, his
duty that night and where he stood at 11:40, his way of speaking as those who knew him gave it, and what he must
never speak of. Every line of a card cites `docs/research/RESEARCH_the_bridge_personas_v1_2026-11-23.md` (being
written beside this design) or the bridge note. A fact with no source stays off the card.

## 7. How far the officers may act

A setting, "The officers", with two positions in v1 (the dial of v1.3):

- **"Ask before acting"** (the default). An order in a reply is an offer. The captain gives it or not.
- **"Act on my word."** An order in a reply to the captain's own words is given at once.

Either way the order is given through `TitanicApp.order`, on the step it is given, by the same path as a typed order,
and step 1's answer follows it. A third position, in which the officers sail her by themselves, is section 14's last
stage.

**The tape.** Each turn is kept in the page for the night: the step, the man, the captain's words, a hash of THE
FACTS, the reply, each check's result, the order read from it, and whether it was given. The tape is the part's own.
It is not the model's log and not in a link: a link replays the orders, with no key.

## 8. Time

- The facts are those of the step on which Enter was pressed. The answer is shown when it comes, with the ship's
  time then.
- While an answer is awaited the part holds the page's pace at 1 (`TitanicApp.holdPace`, its own owner), so that a
  three-second answer does not cost minutes of her night at a fast pace.
- The wait is bounded in the main process (20 s by default). Past it the notice says that no answer came; the watch
  was never stopped.
- One question to a man at a time, and at most two awaited in all.
- An answer that comes after she has gone, or after the man has left the bridge, is dropped and noted.
- The part reads no wall clock. The fake provider answers after a set time of the page's clock
  (`TitanicApp.after`), so the browser suite runs on the virtual clock.

## 9. The provider layer (the app's main process)

One interface, three adapters:

```
ask({ seat, stable, changing }) ->
  { ok: true, text, usage: { in, out, cached }, ms, model }
  { ok: false, kind: 'off' | 'no-key' | 'budget' | 'timeout' | 'network' | 'auth' | 'rate' | 'refused' | 'server' | 'shape', why }
```

- The window sends text only. The provider, the model, the address and the key are the main process's own settings:
  the window cannot name a host or a header. Sizes are bounded (24,000 characters a part).
- **`anthropic`**: Claude, through Anthropic's own SDK for JavaScript, as Anthropic's guidance for new code asks
  [read: the Claude API reference, 2026-11-23]. The stable part is the system prompt, marked for the cache; the form
  is asked for as a structured output (`output_config.format`); no sampling setting is sent (the current models
  refuse one); effort is low for a short line; a refusal is read from the stop reason before the text; the server's
  own fallback is asked for where the model has one. The default model is `claude-opus-5-5`, by the same guidance.
  The player may set `claude-haiku-5-5`, `claude-sonnet-5-5` or `claude-fable-5-2`.
- **`openai`**: the chat-completions form that many providers and local servers speak, by plain `fetch`: a system
  message, a user message, and the same schema as `response_format` where the server takes it (if it refuses the
  schema, once more asking for a JSON object, then with the form asked for in words only). The dialog offers the
  known addresses [to verify at the build: OpenAI, Google's compatible endpoint, Cerebras, LM Studio and Ollama on
  this PC] and a custom one. The model's name is the player's to type, or to pick from the provider's own list. A
  local server needs no key.
- **`fake`**: answers chosen by a hash of the request, from a table. It is the suites' provider, and the page's when
  the address asks for it as a test hook.
- **One host.** Every request passes one guard: its address must have the origin of the provider set, `https`, or
  `http` only for this PC itself; no redirect is followed. The SDK is given the same guard as its `fetch`.
- **The budget.** Questions and tokens are counted for the night. Past the limit (200 questions or 300,000 tokens
  by default [bet]) no request is made and the notice says so.

**What it should cost** [derived from Anthropic's price table as read 2026-11-03; nothing measured]: a question is
about 1,200 tokens of stable part (cached after the first), 600 of facts, and a short answer. That is about a
fiftieth of a cent on Haiku 5.5, under half a cent on Sonnet 5.5, about a cent on Opus 5.5 and about two cents on
Fable 5.2. A night of a hundred questions: two cents to two dollars. How long an answer takes is not known: the
first thing to do with a real key is to time it.

## 10. The key

After the ATC simulator's pattern [read: the scouts' digest]:

- The dialog's field is read once and cleared. The key goes to the main process and is kept encrypted by the
  system's own key store (Electron's `safeStorage`) in the app's settings folder, beside her other settings.
  Windows keeps it from other users of the PC, not from the player's own programs; the dialog says so. A PC that
  cannot protect a key keeps it for the run only.
- The window gets one object, `titanicMinds`, with seven calls and nothing else: `status`, `set` (the provider, the
  model, the address, the switch, the limits), `setKey`, `clearKey`, `test`, `ask`, `usage`. No call returns a key.
- Every call is checked in the main process: that it comes from the app's own page, and the shape and size of each
  argument. Nothing logs an argument.
- The key is never in the page's storage, an address, the talk or the tape.

## 11. What changes in the app

The app's design (`DESIGN_electron_desktop_client_v3_2026-11-23.md`, section 3) says: "No `preload.js`. The page
needs nothing from the main process." This step adds one channel, and only this:

1. **A preload** that exposes `titanicMinds` under context isolation and the sandbox. No Node reaches the window.
2. **With no key stored and the switch off, the app is v3's app.** Every row of its self-test passes unchanged, and
   no request leaves the PC.
3. **The window still makes no request.** Its policy and the session's cancelling of every http and ws request stay
   as they are. Only the main process calls out.
4. **One host**, section 9's guard; a row of the self-test holds it.
5. **The packager** copies the new files (and Anthropic's SDK, if section 16's decision A is yes).

CLAUDE.md's rule for the app, when this lands, can point at this section.

## 12. The files

| File | What |
|---|---|
| `site/parts/87_minds_words.js` | The library, no DOM, Node and the page: the cast and their cards, who is in reach, the view and THE FACTS, the two parts of a request, reading a turn, the checks, the authored lines, the fake's table |
| `site/parts/88_minds.js`, `88_minds.css` | The part: who is in reach, the awaited line, the offer, "The crew's minds", the tape, the transport (`titanicMinds`, or the fake as a test hook) |
| `site/parts/86_crew.js` | Two small hooks for 88: a line the grammar does not read is offered to it first; it may add lines to the talk |
| `tools/minds_tests.js`, `tools/minds_site_test.js` | Headless (in `--quick`) and a browser suite on the virtual clock, with the fake |
| `app/preload.js`, `app/minds.js`, `app/minds_anthropic.js`, `app/minds_openai.js` | The app's side: the bridge, the settings and the key, the guard and the budget, the two adapters |
| `app/main.js`, `tools/app_test.js`, `tools/package_app.js` | A few lines each (the app lane's files: told first) |
| `tools/minds_fake_server.js` | A provider on this PC that speaks both forms, for the self-test and for building |

## 13. Tests

`tools/minds_tests.js` (headless, seconds), every row a MUST:
1. **The whitelist.** The gathering function's source reads only the listed paths of the state. The library reads
   no DOM, clock or network.
2. **What the bridge cannot know changes nothing.** On the 1912 watch at three moments, for each of a list of
   hidden changes (water in a space nobody has reported, the steam, a ship moved, the forecast, the estimate's own
   forecast, the counts in the boats), THE FACTS for every bridge seat keep their bytes.
3. **What the bridge learns changes it.** A report delivered, an order given, the time.
4. **News has a speed.** Through the 1912 watch, no fact stands in THE FACTS before the step the reports reader
   delivered it.
5. **Reach.** Each row of section 4's table against the state that should set it, and the 1912 night's moments.
6. **Reading a turn.** Thirty replies (clean, fenced, with prose around, wrong types, extra fields, very long, not
   JSON): each to its exact outcome. It never throws.
7. **The checks.** Forty lines, each passing or failing with its named fault.
8. **Orders.** A restated order is read by the grammar; two orders, an order outside the remit, an order not in the
   grammar's domain: each dropped. The helm's convention is the one in force.
9. **The request.** A man's stable part has the same bytes at every moment of the night. No request holds a key,
   a host or an address. The schema is the fixed one.
10. **The fake** gives the same answer to the same request.
11. **People only.** Every line's speaker is a named person; every generated line carries the mark of an imagined
    line.
12. **Neutral.** Building THE FACTS at every step of a 1912 watch leaves its fingerprint and every reader's state
    as they were.

`tools/minds_site_test.js` (a browser, the virtual clock, the fake):
1. Off by default: the page is step 1's page; the watch's fingerprint is the model's.
2. A question to a man in reach: awaited, then answered in the page's time, marked as imagined, with the facts of
   the step it was asked on.
3. An offer, given: the order is in the watch's log on that step; the link replays the night with no transport.
4. "Act on my word": given at once.
5. A reply that fails a check: asked once more, then the authored line; the tape holds both.
6. A man out of reach: no request is made, and the row says where he is.
7. The limit: past it no request is made, and the notice says so.
8. Nothing on the stage; no error in the console; `clock_tests` passes.

The app's self-test (`tools/app_test.js`), its present rows unchanged, and:
- **A.** Off: `status` says so; `ask` answers `off`; the provider on this PC sees no request.
- **B.** On, the `openai` form against the provider on this PC: one request, to it alone, with the test's key in
  the header; the answer reaches the page; no answer of the bridge holds the key; the settings file does not hold
  it in the clear; nothing written to a console holds it.
- **C.** The `anthropic` form against the same provider: the request has the SDK's headers, the system part marked
  for the cache, the form asked for; the answer is read.
- **D.** The guard: an address of another origin, a redirect, `http` to another PC: each refused.
- **E.** A provider that never answers: `timeout`, within its bound.
- **F.** A call from anywhere but the app's own page is refused (the check's own unit rows).

## 14. Building it

- **A. The page's side, with the fake** (this branch; no key, no network, the gate can run it): the library and its
  suite; the part; the browser suite at this lane's next turn.
- **B. The app's side** (after join 16 puts the app on main; main merged into this branch): the preload, the
  settings and the key, the guard, the two adapters, the self-test's rows. Then Bo's own key, typed by him into the
  app, and the first real answers: timed and priced.
- **C. The bridge speaks** (a switch of its own, off by default): when a report reaches the bridge by a man, he
  gives it in his own words, checked against the report's own; at most one such line in half a minute of her time,
  none at a fast pace.
- **D. The watch of minds** (the dial's third position; a design of its own first): the officers, and Captain Smith
  as a persona, act on what reaches them, each within his remit, each with a deadline in her time and the 1912
  doctrine as the floor when no answer comes in time. Such a night is labelled a counterfactual, and a set of them is
  reported as "k of N".

A and B are what Bo asked for by the end of the week. C is small once they stand. D is the stretch.

## 15. Decisions made here, for Bo to overturn

1. The grammar reads first: order words never cost a call, and never wait.
2. The officers ask before acting, unless the captain sets "Act on my word".
3. v1's cast is the bridge's own people; the engine room's telephone next; the wireless room with presence.
4. A persona restates an order in the bridge's words and the grammar reads it: no list of numbered choices.
5. Faults and limits are notices outside the fiction.
6. One provider at a time. Claude's default model is Opus 5.5 at low effort, by Anthropic's guidance; the dialog
   names the cheaper and the dearer ones.

## 16. Open, Bo's

- **A. Claude through Anthropic's own SDK** (their guidance for new code; one package added to the app, downloaded
  once), or through plain HTTPS with no package (only if Bo asks for that). The other providers need neither.
- **B. Whether C and D follow at once,** or the voice (the spoken bridge's step 2) comes between.
- The brainstorm's decisions 9 (a guide outside the fiction) and 11 (the player's own body) stand open.

## 17. Not in this design

The voice (Deepgram, both ways). Jev as the judge of a line and of a decision. The presence reader and the wireless
room. The inquiry after the night. The paintbrush test (a hole painted on a preset reaches no crew: the readers attach
to a watch; a change to agree with the coordinator). Web BYOK on the public page.
