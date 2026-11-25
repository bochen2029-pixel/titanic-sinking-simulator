# Ask the bridge: what the build settled (v1.1)

2026-11-23 CST, fork 2 ("the BYOK lane"). An addendum to `DESIGN_ask_the_bridge_v1_2026-11-23.md`, which stands as
written. It records Bo's two decisions since, what the app's side became when it was built, and where v1's text is
now out of date. **Status: the app's side is built and tested in plain Node against a stand-in provider on this PC
(its self-test inside the app's window has not run yet); the page's side is built and under review; nothing has been
run on a real key, timed or priced.**

Tags as in v1: [read], [derived], [bet], [authored].

## 1. Bo's decisions

- **The bridge speaks unasked, on by default** (2026-11-23; section 8).
- **npm in the join's checkout:** "yes you can run, install and download npm etc etc sdk, etc ..." (2026-11-23, to
  the coordinator): the app's runtime packages are installed there before the gate (section 5).
- **A, the Claude adapter:** "Yes, use the SDK" (2026-11-23). Claude is reached through Anthropic's own SDK for
  JavaScript, `@anthropic-ai/sdk`. It is the app's one runtime dependency.
- **"make sure you using the latest"** (2026-11-23). Checked against live sources, not memory [read]:
  - the SDK is 1.13.0, the npm registry's `latest`, published that day; it is pinned exactly in `package.json`, with
    its integrity hash in `package-lock.json`;
  - it sends API version `2026-10-21`, the newest;
  - the default model is `claude-opus-5-5`, the current generation; the player may set another.
  A newer SDK later is a one-line change of the pin, then `node tools/minds_app_tests.js` and the app's self-test.

## 2. The app's side as built

| File | What |
|---|---|
| `app/minds.js` | The settings, the key, the one-host guard, the limits, and the seven calls |
| `app/minds_anthropic.js` | Claude, through the SDK |
| `app/minds_openai.js` | The chat-completions form, by `fetch` |
| `app/preload.js` | The window's one object, `titanicMinds` |
| `app/main.js` | The preload in the window's preferences; the seven handlers; the self-test's part; a line in About |
| `tools/minds_fake_server.js` | A provider on this PC that speaks both forms |
| `tools/minds_app_tests.js` | The app's side in plain Node, with stand-ins for Electron's `ipcMain` and `safeStorage` |
| `tools/app_test.js`, `tools/package_app.js` | The self-test's rows; what the package holds |
| `tools/app_packages.js` | The app's runtime packages: which they are, the npm command that installs them in a checkout, a digest of a package's files |

- **The seven calls** are `status`, `set`, `setKey`, `clearKey`, `test`, `ask`, `usage`. Each is answered only for
  the app's own page (the window's own contents, and a frame whose address begins with the app's scheme).
- **An answer that is not a reply has a kind.** v1's list grew: `off`, `no-key`, `no-model`, `no-adapter`, `budget`,
  `busy`, `timeout`, `network`, `auth`, `rate`, `refused`, `server`, `shape`, `guard`, `declined`. The page treats a
  kind it does not know as a plain fault.
- **The switch is the player's own.** What would make the app call out, call out elsewhere or spend more is asked of
  the player by the main process itself, in the system's own message box, which the page can neither word nor answer:
  the switch going on; the provider or its address changing while it is on; a limit of the run raised while it is on.
  The question names the provider, the one address and the limits; Cancel is its default. Off, nothing can be called,
  so nothing is asked. While a question is open no other setting moves, so nothing is changed behind it. Declined,
  nothing changes (kind `declined`). So "she connects to nothing unless you switch it on" does not rest on the page's
  own code.
- **The limits are for a run of the app** (200 questions or 300,000 tokens by default [bet]), kept in the main
  process as the backstop; the page counts a night's use itself. Two requests at once at most.
- **An answer's cap, its thinking included** [bet]: 4,000 tokens by the chat-completions form, 16,000 by Claude,
  whose current models always think. An answer cut off is an answer lost; unused tokens are not billed, and the
  run's token limit bounds the spend. Count the cut-offs when a real key is tried.
- **A key is for the address it was entered for.** The player's own server is the one provider whose address can
  change. A key entered for one address is never sent to another; it is kept, and serves again at its own.
- **The main process calls out with its own `fetch`,** not the window's session: the shell's rule that cancels every
  request of the window does not touch it, and the window still makes none. It does not use the system's proxy
  settings [bet: to try on a network that needs one].

## 3. Claude's request, as built [read: Anthropic's reference and the SDK's own types, 2026-11-23]

- The stable part is the system prompt, marked for the cache. The changing part is the user's turn.
- The turn's fixed schema is asked for as a structured output. Effort is low by default.
- No sampling setting and no thinking setting is sent.
- A refusal is read from the stop reason before any text. The server's own fallback is asked for.
- The SDK is given the guarded `fetch`, the player's key and the address explicitly. It retries nothing and prints
  nothing.
- **Nothing is taken from the environment.** The SDK reads it for more than a key: `ANTHROPIC_CUSTOM_HEADERS` adds
  its headers to every request, whatever key is passed (found by the app lane's review; people who use a gateway
  often keep a gateway's key there). So every `ANTHROPIC_*` variable is taken out of the process's environment
  before a client is made. The app reads none of them and starts no child process. A test sets an address, a key, a
  token and two custom headers there, and shows that none reaches a request.
- A model that refuses the effort or the form is asked again without it.

## 4. The chat-completions form, as built

- The addresses were read in each provider's own reference on 2026-11-23: OpenAI, Google's compatible endpoint,
  Cerebras, and LM Studio and Ollama on this PC. A server of the player's own takes any address by `https`, or by
  `http` on this PC only.
- The schema goes as `response_format`. A server that refuses it is asked for a JSON object, then with no form at
  all: the request's own words ask for JSON, and the page checks what comes back. The output's limit goes under the
  name the server takes.
- **Why this form and not OpenAI's newer one:** every provider and local server named here speaks chat completions;
  the newer form is not as widely spoken [read: each reference]. OpenAI's own newer form can be added beside it.

## 5. The package and the shell (the app lane's six conditions, all taken)

1. The README no longer says "no network" without saying when: she connects to nothing unless the crew's minds are
   switched on with the player's own key, and then only to the provider chosen.
2. The window stays without a network. The self-test holds the hosts called to exactly the stand-ins.
3. The key at rest is encrypted for the Windows user on that PC; a folder carried elsewhere needs the key entered
   again; a PC that cannot protect a key keeps it only until the app closes; "Forget" removes the key kept for the
   provider shown.
4. The self-test holds every file of `app/` to the package, and every runtime package: by its version, and file for
   file (a digest of its paths, sizes and bytes, stamped when it is packaged and held to what the checkout has
   installed).
5. The packager refuses, as it refuses a stale `dist/`, unless the runtime packages are installed as pinned, and says
   the npm command that fits the checkout it runs in:
   - a checkout kept without the development packages (the join's and the lanes': the site's build then keeps its
     vendored three.js and fonts from `dist/`) takes `npm install --omit=dev --ignore-scripts`, which adds the eight
     runtime packages and nothing else;
   - a checkout that has the development packages takes `npm install --ignore-scripts`: `--omit=dev` there would take
     them off the disk.
6. About (F1) says whether she can reach the network: off, or on and for which provider.

The app lane then reviewed the wiring (its note of 2026-11-23 15:55). Taken from it: the environment (section 3), the
npm command (5 above), the player's own word and Claude's cap (section 2), the files of the packages (4 above), and
four sentences of the package's README (where the key is kept, a PC that cannot protect one, what "Forget" removes,
and that Anthropic may have another of its models answer what one declines, billed at that model's rate).

## 6. Where v1's text is now out of date

- **Section 4, the cast.** The chief engineer stays out of reach until his own view of the engine room is built.
  Join 16 brought the telephones' state (`sim.reports.phone`), so the rule alone would have let him answer with
  nothing to go on.
- **Section 5, the view.** Her trim is taken from the latest line "by eye" in the reports, not from the reader's
  own reckoning, which needs the model's geometry. The library reads the reports reader's state directly, by its
  whitelist, and needs no other module.
- **Section 6.3, the checks.** What a man may repeat is what stands in THE FACTS, the talk, the captain's own words
  to him, or on his card. A retry is checked against the first request, not its own text.
- **Section 9.** The kinds, the limits' scope and the answer's cap are section 2's here.
- **Section 11.** The app's change is section 5's here.
- **Section 16, decision A** is made (section 1).

## 7. What the review of the page's side changed

An independent reader went through the page's side before it was committed, with probes of its own. It found one
leak through the fog and a dozen lesser faults. Each is fixed, and each fix is a row of `tools/minds_tests.js` or
`tools/minds_site_test.js`. Where they change v1's design:

- **Section 5, the view: the wireless room's log is not the bridge's knowledge.** The first build gave the bridge
  every line of `sim.world.lines`. That log is what the page shows the player. Some of it comes from the plant's
  hidden state: with boiler room 3's fires out the operators key "Engine room flooded", and a set without current
  says why, with its volts. Of that log the bridge now has only its own acts and what is seen from it (the call
  ordered, the operators released, a rocket, the Morse lamp), a light in sight, and a ship's answer as the junior
  operator brought it forward [bet: at once; the presence reader will give him his walk]. Never what the operators
  keyed, nor the set's state. The suite's rows applied a hidden change and never stepped the watch, so they could
  not see a leak carried by a reader; one now steps it.
- **Section 6.2, the order: a helm order that turns her names her head too.** "Hard a-starboard, her head to port."
  A language model of today thinks of the rudder; the order of 1912 named the tiller. Said alone, "hard to
  starboard" or "port twenty" cannot be told from its opposite, and the first was read reversed. The helm words and
  the head must agree in the convention in force, or nothing is given and a notice says why.
- **Section 6.3, the checks.**
  - A time in THE FACTS no longer makes its hour and its minutes figures a man may speak (in the review's probe "47
    feet of water" and "12 degrees of list" passed). A time said in words ("eleven forty", "twenty to twelve",
    "eight bells") is held to the times he knows.
  - The words that give the frame away now include a model's and a maker's names, "assistant", "role-play",
    "portray", and a refusal in a voice that is not his.
  - The list about the end named too much plain speech ("a dead calm", "the telephone is dead", "I will make
    inquiry") and missed the prophecy a model is most tempted to ("she will founder"). Each row now says whose end
    it is, the ship's or people's. What will become of her may be said only once Mr Andrews's estimate has reached
    the bridge; a man's fate, never.
- **Section 3, the offer.** "Yes" or "no" answers the man who offered: a word to another man, or a question,
  answers nothing. An offer is withdrawn when an order of its kind is given first, when its man leaves the bridge,
  and when the crew's minds are switched off. An order that cannot be given is said so in a notice.
- **Section 4, reach.** A man who goes on an errand by his own answer ("I will go forward and look") is away while
  it is out. The reports reader says only "an officer"; the page's part remembers whose errand it was.
- **Section 7, time.** The page bounds its own wait for an answer (90 s of its clock), and does not rest on the
  app's bound.
- **The order line.** A line that looks like a key, pasted there by mistake, is not said, not kept and not sent.
- **Two card lines** went beyond the notes and are corrected: Mr Andrews's years in the yard, and who strikes the
  bell while Hichens is at the wheel.
- **Kept as it is:** the folded line "The crew's minds" shows on every page, the public one included, where it says
  that the crew's own words need the desktop app. So the Run tab's pictures in the guide change at that join.

## 8. Stage C as built: the bridge speaks

v1's section 14 said: "when a report reaches the bridge by a man, he gives it in his own words". Built so, as a switch
of its own in the fold ("They speak up unasked"). **It is on by default** (Bo, 2026-11-23, asked whether it should be:
"yes on by default if you can, since thats already assuming user has provided api keys etc"): v1 had it off. It does
nothing until the crew's minds themselves are switched on, which the player confirms in the app's own message box.

- **Who gives it** (the library's `speaker`): what he saw himself, he gives (the officer of the watch, by eye); what
  he brought, he gives (Mr Boxhall back from a look, Mr Andrews with his estimate); a report brought by a man who is
  not of the cast (the carpenter, a mail clerk, the chief engineer's messenger, the purser) or by telephone is given
  by the officer who received it: the officer of the watch while he is on the bridge, then the junior officer, then
  the fourth [bet: the record does not say who took each report]. The commutator's readings, the routine's bells and
  the touch are nobody's to give. On the 1912 night that is 12 of the 36 reports.
- **The request** is a question's own stable part (the man's, which the provider may have cached) with the report
  as its last word and how it came to him, asking for one or two sentences and no order.
- **Quiet rules.** No line while it is awaited and no hold of the pace: nobody asked. One such line in half a
  minute of her time at most; none above four times her pace. One attempt: words that fail the checks, come more
  than a minute and a half of her time late, or find him gone from the bridge are not shown, and nothing is said of
  it. The report itself stands where the page shows the reports. An order in such a line is never read.
- Each such line is a question to the provider and counts against the run's limits.

## 9. Still open

- A real key: how long an answer takes, what it costs, and whether the persona holds his character. Bo's own key,
  typed by him into the app.
- A network that needs a proxy.
- The stages after: the watch of minds (the bridge speaking unprompted is section 8).
- From the second review (section 10), not yet taken:
  - (Taken since, in a commit of its own: a measure said with its unit, feet or degrees, and a count of boats said
    to be away, is held to the same measure in what he knows. THE FACTS always name boiler rooms 1 to 6 and holds 1
    to 3, so as bare figures 1 to 6 are always known, and "6 feet of water in boiler room 4" and "three boats are
    away" passed when neither was so. Other units, knots and miles and tons, are still held only as bare figures.
    Its own review, 2026-11-24, found it failing good lines in plain play, and it was mended: a count of the boats
    away is the count SAID away, in its own phrase, so "five of the twenty boats are away" is five, and "none of the
    boats", "not one boat" and "no boat" are nought; the helm's own degrees are a measure he knows ("Port twenty" is
    twenty degrees of helm, hard over is forty); "a six-foot man" is no depth, "six-foot of water" is; fathoms,
    inches, the degree sign and "deg." are read.)
  - A rounded figure fails ("nearly fifty miles" for 46, "nearly twenty past twelve").
  - A man's errand is not forgotten while the minds are switched off, so a later errand of the same kind by "an
    officer" can show Mr Boxhall away.
  - The night's own orders (the wireless call, the rockets) stand in THE FACTS in the captain's name even when the
    player took the watch after them.
  - Hindsight and a wrong claim about what is hidden ("the engine room is flooded") cannot be caught by lists of
    words: by design. The mark "imagined" on every such line is the guard.

## 10. What the second review changed (2026-11-23, an independent reviewer on the whole feature)

It found no leak through the fog of the bridge (ten hidden changes stepped 240 and 1,200 steps on: every difference
in THE FACTS was news that had reached the bridge) and no way round the app's question. It wrote 337 good lines and
85 bad ones by hand and ran them through the checks as the page does. What it found, and what was done:

| Found | Done |
|---|---|
| A bare "yes" gave the order on offer, whoever the captain was speaking with: Mr Murdoch's offered helm order was given by a "yes" meant for Mr Moody's question | A bare "yes" or "no" is a word to the man the captain is speaking with, and answers the offer only when he is the man who made it. "Mr Murdoch, yes" and the offer's own buttons always do. "Very well", "make it so", "carry on", "go ahead" and "give it" are yes too, and no longer cost a question |
| A man repeating a time from his own card in words ("at ten o'clock", "at about half past nine") failed as a time he did not know: 9 of the 23 good lines that failed, all on a captain's first questions | The times written in words in what a man knows are read as times he knows. A watch's name ("the ten-to-two watch") is not a clock time; a range ("two to three minutes") is figures; an hour said alone after "at", "about" or "since" is that hour when he knows a time in it |
| "Mr Murdoch's eye" named a person not aboard; "Gladly, Captain. It is..." named a "Captain It" | The possessive is dropped from a name; only an abbreviation's title takes a full stop |
| The end's rows failed plain speech: "went down below to look", "went down by the head", "dead in the water", "the dead calm", "coming to the rescue" | Each row narrowed to what it means: her trim is not her end, "dead" before calm, slow, reckoning or in the water is no man's, a rescue she comes to is news |
| A man's own words failed as a refusal or as the frame: "I'm sorry, but I cannot say, sir", "My instructions are to call you" (his card's own fact) | A refusal is one that names what a language model refuses; "my instructions" one that quotes them |
| A correct helm order was dropped unless her head was its very last words in one form | Her head may be followed by "sir", stand in brackets, or be "head" or "bow" alone. It is still held to the helm words: no opposite turn passes |
| 46 of the 85 bad lines passed: "She'll sink", "She's done for", "She is sinking" before she has been given up, "Mr Wilde will die at his post", "This is only a game", "Sorry, I cannot provide that" | The short forms are read as the long ones; rows for her sinking said outright, for a man named with his fate, for the frame's own words, for a refusal in a model's voice, and for a speaker's label before the words |
| The switch was kept in the settings file: the next run started on with no question, and a file written by hand with the switch on and an address of its own called out at once | Every run of the app starts with the crew's minds off. The key and the other settings are kept; the switch is not read from the file or written to it. The question says "This run may ask...", and that is now so |
| A provider could hand the key back in pieces as models' names, or repeat it in its answer; its whole body was read before the one-megabyte cut; a key pasted in quotes or before a full stop was not seen as one | Each closed: names that are a piece of the key are dropped, the key is struck out of an answer's text, the body is read no further than its limit, and the guard on the order line sees a key in quotes, in brackets or before a stop |

Measured on the reviewer's own lines, before and after: good lines failing 23 of 337, then 2 (the two rounded
figures above); bad lines passing 46 of 85, then 14 (six are the small figures above, two are hindsight, the rest
legends and names no list can know). Nothing has been run on a real model.

## 11. A night taken back: the order line and the crew's minds under the scrubber (NH4, D102)

The page's scrubber (NH4, another lane's) keeps the whole run every minute and can go back to a kept minute; the
night then plays on, its later orders given again on their steps by the night's own script. Two rules were set for
these parts (D102): a scrub asks no language model for anything by itself, and a line already given, for a report or
for an order, is shown again when the night reaches it again, never written again. As built, in the two parts, and
inert where the page has no scrubber (`TitanicApp.keeper`, `TitanicApp.scrubbing`):

- **What is kept with a minute** (a keeper each, plain data). The order line: the talk's lines as they stand, each
  with its own time, its marks and its serial number, the last lines said, and how far into the watch's log it had
  read. The crew's minds: who is away on which errand, when a man last spoke up unasked, how far into the reports it
  had looked, and the furthest moment played. An awaited answer and a standing offer are never kept or put back;
  where a report's line was still awaited at the keep, the kept place in the reports is set back to that report,
  so that its line, which came just after the minute, is shown when the night passes it again.
- **Going back.** Every awaited turn ends ("the watch was moved") and a late answer shows nothing; a standing offer
  is withdrawn; nobody is asked. The tape (the record of what was asked) and this night's count of questions are
  not taken back: they are what was spent.
- **Playing on.** An order of the player's is shown again with the lines it was first shown with (his typed words
  and the answer; his own caption for an order at the page's controls; a man's imagined words and the answer when
  the order was given on that man's word), remembered by the order's place in the log and held to the order itself
  (its step, its type and its value), and a man sent on an errand by it is noted as away again. A line that already
  stands in the talk is never shown a second time (its serial number). The night's own scripted orders are
  captioned as before. A report that was given a line is shown with that line again, remembered by the report as it
  reached the bridge (its time and its words), whatever the switches say when the night is played again. A question
  the captain asked is not an order: it is not in the log, so it is gone from the talk, and asking it again is the
  player's own act.
- **Only a moment never played may ask.** The part keeps the furthest moment of the night that has been played. A
  report is asked for only past it, and never when a line for it is remembered.
- **A new order in a night taken back** drops the later orders (the page says so with an event). The orders'
  remembered lines from that place on are forgotten, with the errands noted there, and the moments after it are new
  ones. A report's remembered line is never forgotten: the same report, reaching the bridge again at the same time
  in the same words, is shown with its line and not asked for; a report that is new there is asked for as on any
  night.

`tools/minds_part_tests.js` holds this on a stand-in for the scrubber that follows NH4's own order of calls
(seventeen rows). The scrubber's own browser suite holds the pair once both are on main.

**Its own review (2026-11-24, an independent reviewer on the two commits).** With no scrubber in the page the two
parts are as before: a session of twenty steps gave the same talk, the same requests and the same orders with the
keepers and without. What it found was all on the scrub's own paths, and each is mended with a row that fails
without the mend:

| Found | Mended |
|---|---|
| After a new order in a night taken back, the remembered lines of later reports were deleted, and the same report was asked for again | Nothing is deleted from the reports' lines; a remembered line is shown for any report that has one |
| A line given just after a kept minute, for a report that arrived just before it, was never shown again | The kept place in the reports is set back to the earliest report still awaited |
| An offer standing across a kept minute showed the man's line twice | Every line of the talk has a serial number; one that stands there is skipped |
| A man sent on an errand was not noted as away when the order was given again | The errand is remembered by the order's place in the log and noted when the log reaches it |
| A remembered line could be shown for another order at the same place in the log | The memory is held to the order's step, type and value |
| A remembered line was not shown while "They speak up unasked" was off | Showing asks nobody, so it reads no switch |
| The furthest moment played was lost on going back before it | It is kept with the minute, and the larger is put back |

Two things are the scrubber's own to hold, and its lane has them: going back and giving a new order must replace
the kept script's later orders, not add to them; and a takeover played again must set who has the bridge, or "You
have the bridge" is said twice.

## 12. The key store: its asynchronous calls, and a seal that says what it is for

`app/minds.js` kept a provider's key with Electron's synchronous key-store calls. Those are deprecated in Electron 45
and removed in 46 [read 2026-11-23: Electron's safe-storage page and its breaking changes], so the app would have
lost its keys the day the pinned Electron moved. The independent review of the men's voices then found three things
in the voices' own key handling that held for this file too. All of it is now in one place, `app/keystore.js`:

| What | Before | Now |
|---|---|---|
| The store's calls | the synchronous ones | the asynchronous ones; the synchronous only where those are absent or say they cannot protect |
| When a kept key is opened | at every question | once, as the run starts; the window's calls wait for it |
| What is sealed | the bare key | a purpose and the key ("minds:openai:" and the key). A seal that opens to another purpose is no key here, so a key copied by hand into another provider's place is never sent to the wrong host |
| A key sealed by the first build | | still the key: opened, and sealed again with its purpose |
| The store asks for a key to be sealed again | not known to the synchronous calls | it is sealed again and kept |
| Save, then Forget at once | could not happen (nothing waited) | each word about a provider's key takes a number as it is given; the later word stands |
| The key in a provider's text | struck out only whole | struck out whole or in part (any run of eight of its characters), before the text is cut to length |

A key the store cannot protect is kept for the run only and never written, as before. `tools/minds_app_tests.js`,
section 2b, holds each row of the table on a stand-in for the store with both sets of calls. The app's own self-test
must show which store Windows gives Electron 45.2.3: until it has run, that is not known.

**What the independent review of this change found, and what was done** (the same night; two serious, four lesser):

| Found | Done |
|---|---|
| The new striking rebuilt the whole text at every match: a provider that meant harm could send a megabyte of key pieces and hold the main process for 50 seconds, with the wait's own bound already over | Every place is found against the text as it is, the places joined, the answer built once: 153 ms on the same megabyte |
| The provider's list of models ("Try it" with no model named) was not struck: the key in two halves, each with a letter more, reached the page as two models' names (this was so before the change, and is so in the build of join 18) | A name the striking would change is dropped whole |
| A key could be kept or forgotten while the app's question to the player was open, and so be tied to the address in force before his answer (so before the change too) | While a question is open no key is kept or forgotten and no question goes out |
| A seal with no purpose (the first build's) was taken in any place, the player's own server's among them, and then sealed again with that place's purpose | It is taken only in the place of a provider whose address is the app's own, and never when the same seal stands in two places. A key kept for the player's own server by the first build is entered again |
| The address a key was for stood in the settings file in the clear: edited, with the address, the key went there once the player had switched on (so before the change too) | For the player's own server the address is sealed with the key, and the sealed one is the one that counts |
| Where the asynchronous calls say they cannot protect (not yet, as the app starts), no kept key was opened all run, and the synchronous calls, which this Electron still has, were never asked | They are asked then |

What the striking is and is not: it stops a key echoed back by accident or carelessness, whole or in a piece of
eight characters or more. A provider that means harm can still spell a key out in shorter pieces or in another
form; it had the key already, and the page it could tell has no way out of the app. Left as they are, knowingly: every
provider's kept key is opened into memory as the app starts, even with the switch off; and no row holds a settings
file that cannot be written while a key is opened.
