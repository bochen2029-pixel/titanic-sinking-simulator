# The spoken bridge, step 2: the voice (v1)

2026-11-23, fork 2 (the bring-your-own-key lane). Step 1 was the order line (`docs/DESIGN_spoken_bridge_v1_2026-11-23.md`,
on main since join 17); its section 7 sketched this step. The facts here are from the research note of the same day
(Deepgram's own documentation and price list as read on 2026-11-23, Electron's documentation, and two earlier desktop
apps of Bo's that do push-to-talk); each is marked [read], [derived] or [bet]. Nothing has been run on a real key.

**In one paragraph.** The bridge gets a voice and ears, each a switch of its own, each off by default. The voice
speaks every line a man says in the talk; ears let the player hold a key and say an order or a question. Each has a
floor that needs no key and no network where one exists, and a better form on the player's own Deepgram key. No model
decides anything in this step: speech becomes the same words a keyboard would have typed, and words become sound.

## 1. What the player gets

| | With no key | With the player's Deepgram key |
|---|---|---|
| **A voice** (speech out) | Each man's line spoken by this PC's own voices: the browser's speech, local voices only. One voice and one pitch a man. Works in the app and on the public page | Each man's line in a voice of his own: seven British men's voices, one for each of the seven men who can speak on the bridge |
| **Ears** (speech in) | None [read: the browser's own speech recognition is a network service of the browser's maker, and Electron ships without it] | Hold a key or the microphone button and speak; the words appear in the order line as they are heard, and go through the same grammar as typed words |

The caption in the talk always stands: the voice is beside it, never in its place. A notice is nobody's line and is
never spoken. The captain's own lines are never spoken (the player said them).

## 2. Jev and Clef are not part of this step

The brainstorm (`docs/BRAINSTORM_byok_living_crew_v1_4_2026-11-23.md`) gives each faculty one job: the model computes,
a decision model judges, a language model speaks, and Deepgram listens and gives the voice. Jev and Clef are decision
models (small, fast, typed choices from text or a picture). They neither hear nor speak, so they are not providers of
this step. Their place is later: free speech into the right order ("bring her round to port a bit" when the grammar
reads no order), and the watch of minds. Their design is its own document, after this one.

## 3. The rules it keeps (the crew's minds' guardrails, applied again)

| Rule | Here |
|---|---|
| Off by default | Two switches, both off. With both off the app and the page are today's, to the request |
| The key is the player's own | One Deepgram key for both directions. It lives only in the main process, kept encrypted by the system's key store with her settings, given back by no call, struck out of every error. Typed by the player into its own field, never into the order line (the order line's guard refuses a line that looks like a key) |
| One host | The main process calls `api.deepgram.com` and nothing else for this, behind the same one-origin guard as the crew's minds (no redirect followed). The window still makes no request of any kind |
| The player's own word | The app asks in the system's own message box before a voice switch goes on (it says who is called, and the run's limit), as it does for the crew's minds. Every run of the app starts with both off |
| A limit a run | Characters spoken and minutes heard, each with a limit the player sets; at the limit nothing more is sent and the floor takes over |
| A fake for the gate | A stand-in for Deepgram on this PC (`tools/fake_deepgram.js`) answers every test; no test needs a key or the network |
| Nothing speaks as the ship | Only a named man's line is voiced. The voice's choice is fixed in the main process from the man's name: the page can choose neither an address nor a model |
| The night is its orders | Neither sound nor transcript goes into the watch's log. A spoken order is logged as the typed order it became, so a spoken night has the fingerprint of the same night typed, and its link replays with no microphone |
| One clock | The page keeps no timer of its own for any of it: every network deadline is the main process's; the speaking and the microphone are the browser's |
| It can fail quietly | A line that cannot be spoken by Deepgram (no key, the limit, a fault) is spoken by the floor, once, or not at all; the caption is there either way. A transmission that fails leaves the order line as it was, with a notice |

## 4. Speech out

- **The floor (built: `site/parts/89_voice.js`, branch `claude/byok-voice`).** The browser's own speech, with only the
  voices the system says are local (a browser also lists voices made by a service on the network: those are never
  chosen, so no line leaves the PC). British voices first, then other English ones; a voice with a woman's name is
  passed over while another is there; each man keeps one voice and one pitch, chosen by his name. Nothing above four
  times her pace; three lines wait at most; a new run and her foundering hush it. Every voice and pitch is
  [appearance]: this PC's, not the men's. This laptop has three American voices and no British one, and the note in
  the section says so.
- **Deepgram's voices (being built on the same branch; not for a join until the coordinator says).** One request a
  line from the main process: `POST https://api.deepgram.com/v2/speak?model=<voice>&encoding=linear16&container=wav
  &sample_rate=24000`, the key in the `Authorization` header, the body `{"text": "..."}` [read]. The page is handed
  the sound and plays it, one line at a time. A line of more than 600 characters is not sent [bet: no limit is
  published for this family; the older one's is 2,000].
- **The men's voices** [derived casting from the persona research, to be judged by ear with a real key]:

  | Man | Voice | Note |
  |---|---|---|
  | Captain Smith | `flux-sean-en` | British, mature, calm |
  | First Officer Murdoch | `flux-conor-en` | British, mature, deep. He was a Scot; no Scottish voice exists in any Deepgram list |
  | Fourth Officer Boxhall | `flux-jack-en` | British adult |
  | Sixth Officer Moody | `flux-kit-en` | the only young British man's voice |
  | Quartermaster Hichens | `flux-rufus-en` | British adult. He was a Cornishman; no Cornish voice exists |
  | Thomas Andrews | `flux-colin-en` | British adult. He was an Ulsterman; the one Irish man's voice is of an older family, on another address |
  | Chief Engineer Bell | `flux-tanner-en` | British adult |

  No accent is claimed that the list does not have, and no wording of a line changes a voice's accent [read].

## 5. Speech in

(As designed. It was built differently in three ways: no worklet and no change to the build, the words heard shown
under the line, and punctuation asked for. Section 9d is push to talk as built.)

- **Push to talk.** Hold a key on an empty order line, or the microphone button beside it. While it is held the words
  heard so far show in the order line, greyed; on release the final words stand there exactly as if typed, and go
  through `TitanicCrewWords` as typed words do. A question goes on to the crew's minds if they are on. Nothing is
  acted on that the grammar does not read.
- **How.** The page turns the microphone into 16 kHz frames (an audio worklet) and hands them to the main process,
  which holds one socket a transmission to `wss://api.deepgram.com/v1/listen` (the model `nova-3`, punctuation and
  formatting off: the grammar wants plain words; some twenty of the grammar's unusual words and the men's names as
  key terms). At release it closes the stream and answers with what was heard, within 3.5 seconds [read, and the two
  earlier apps].
- **What it needs from the shell and the build**, each a change outside this lane's own files, so each is agreed
  before it is made: (1) `dist/_headers` sends `Permissions-Policy` with `microphone=()`; the app must send
  `microphone=(self)` on its own answers; (2) the shell's permission handlers allow only the clipboard; audio must be
  granted to the app's own window and origin, and to nothing else; (3) the worklet must ship as a file of its own in
  `dist/`, which the build writes.
- **No floor.** Without a key there are no ears: the order line is typed, as today.

## 6. What it costs the player

Deepgram's pay-as-you-go prices as read on 2026-11-23 (its price list marks speech to text as a promotion with no end
date); a new account is given 200 dollars of credit [read]. The night's figures are [derived] and rough.

| | Price | A night |
|---|---|---|
| The system's own voices | nothing | nothing |
| Deepgram's voices (the family used here) | 0.045 dollars per 1,000 characters | about 100 spoken lines of 80 characters: 36 cents |
| Deepgram's ears (streaming, with key terms) | 0.0061 dollars per minute of held key | 100 transmissions of 3 seconds: 3 cents |
| A run's default limits | 40,000 characters spoken; 30 minutes heard | at most 1.80 dollars and 18 cents a run |
| For comparison, the crew's minds | the language model's own price | see `docs/DESIGN_ask_the_bridge_v1_1_2026-11-23.md` |

## 7. The pieces

- **The main process, `app/voice.js`**, beside `app/minds.js` and shaped like it: the key (the key store's asynchronous
  calls: the synchronous ones are deprecated in Electron 45 and removed in 46 [read], and `app/minds.js` must follow),
  the one-host guard, the voice table, the limits, every deadline, the player's own word. No new package: the
  provider's own library would add a dependency and reads a key from the environment [read].
- **The window's calls**: a second frozen object, `titanicVoice`, beside `titanicMinds`: `status`, `set`, `setKey`,
  `clearKey`, `test`, `speak` for the voice; `open`, `audio`, `finish`, `cancel` and one message back (`heard`) for
  ears. Each is refused unless it comes from the app's own page, and each argument's shape is checked.
- **The page, `site/parts/89_voice.js`**: the two switches and the key's field in the order line's section; the queue
  and the playing; the push-to-talk control. With no `titanicVoice` (the public page) only the floor shows.
- **Tests**: `tools/voice_part_tests.js` (the part on a stand-in for the page, built) and `tools/voice_app_tests.js`
  (the main process against the stand-in for Deepgram) as quick rows of the gate; rows in the app's self-test (off
  as she starts; the key never in the window or a file in the clear; one host; the player's question asked); a
  browser suite for the part.

## 8. What only a real key settles (Bo's own, typed by him into the app)

1. How the seven voices sound, and which man each suits; how long a line takes to come back.
2. That Deepgram takes the key as this main process sends it for a socket; the time from release to the words.
3. The words themselves: "hard a-starboard", "Mr Boxhall", with and without the key terms; clipped first words.
4. What a night costs.

## 9. The order of building, and whose word each step needs

1. The floor: built, on its own branch, its part's suite passing. It touches no file of another lane's.
2. Deepgram's voices: being built on that branch. It adds lines to `app/main.js`, `tools/app_test.js` and
   `tools/package_app.js` (the app lane's files: its owner is told before they change on a branch meant for a join).
3. Ears: after the three changes of section 5 are agreed with the app lane and the coordinator.
4. Then: a browser slot for the suites, the papers' text, the guide's passage.

## 9b. Speech out as built, and what its independent review changed (added the same night)

Built as section 4 says: `app/voice.js` (six window calls: status, set, setKey, clearKey, test, speak), a second
frozen preload object `titanicVoice`, the fold "Deepgram's voices (your own key)" in `site/parts/89_voice.js`, and a
stand-in for Deepgram on this PC (`tools/fake_deepgram.js`). An independent reviewer then went through it with the
rules of section 3 as its list. It found no way round the one host, the player's own word, the limit or the checks on
who may call. What it found, and what was done:

| Found | Done |
|---|---|
| Part of the key could reach the page in an error's text: Deepgram's words were cut short before the key was struck out, only the whole key was ever struck, and an answer's content type was repeated to the page | The key is struck out first and the text cut after; any run of eight or more of the key's characters is struck; a content type is never repeated |
| The switch was kept in the settings file: a later run started on with no question | Every run starts off; the switch is neither read from the file nor written to it |
| Save, then Forget at once, kept the key (sealing takes time) | Each word about the key is numbered as it is given; the later word stands |
| The page asked Deepgram for every line as it came, and a line asked for is billed whether or not it is heard; nothing bounded how long a line's sound could play | One line ahead and no more; room in the queue is made by a line not yet asked for; a sound has a bound of its own (15 s and a quarter of a second a character), past which it is stopped and the line is over |
| The page kept the decoded sound of the last forty lines | A sound's handle is let go as its line ends |
| The main process voiced any name it was given, the captain's own "You" among them | A name that is not in the table has no voice: nothing is sent for it |
| A line Deepgram refused still counted against the run's limit | Its characters are given back |
| After a new run a third request could go out while two older ones were still out | A request of an older run is counted until it comes back |
| With "Hear the bridge" off and Deepgram's voices on, nothing outside the shut fold showed that lines were being sent | The note outside the fold says so, and the fold's own title says ON |
| A sealed key was not tied to its purpose: another provider's sealed key, copied into the voice's file by hand, would have been sent to Deepgram | What is sealed begins "deepgram:", and anything else is no key of this file's |
| "Nobody else" was said in three places that are untrue once both the crew's minds and the voices are on | Each now says for what it calls nobody else |

Also decided while building: a WAV is known by its bytes (Deepgram's reference names no content type for its answer);
the fold has a field for the run's limit; the voices have their own switches and are not under the ship's sound
switch or its volume. Left as it is, knowingly: the key store is opened at the start of every run even with the
switch off (no request is made by that).

Headless: `tools/voice_app_tests.js` 49 rows, `tools/voice_part_tests.js` 42. Not yet run: the app itself (its
self-test's rows for the voices), a browser suite for the part, and anything on a real key.

### 9c. For join 20: the coordinator's conditions, and what was done for each (2026-11-24)

Speech out was accepted for a join on four conditions. Push to talk (section 5) is a later join, with conditions of
its own.

1. **The app lane's word on its four files** (`app/main.js`, `app/preload.js`, `tools/app_test.js`,
   `tools/package_app.js`): asked with the diff's sha.
2. **Her end is read as the page reads it.** The part hushed on the `foundered` event alone. Since join 19 a default
   watch ends where she breaks, and that event never comes then. The part now asks the page's own word for it,
   `TitanicApp.gone(sim)` (the founder flag, or the hand-over where she breaks), on each step and before each line:
   once it is true the voices are hushed and nothing more is spoken or asked for, until a new run. The event still
   hushes. `tools/voice_part_tests.js` holds it with a row that fails with any of its three lines taken out (43 rows).
3. **The sound reaches the page as bytes.** A line's WAV comes from the main process as an ArrayBuffer by the
   window's own call, and is decoded and played by Web Audio (`decodeAudioData`, a buffer source). The page makes no
   `blob:` or `data:` address, no object URL and no audio element for it, so nothing in `dist/_headers` moves: the
   public page's policy and the app's are the ones they were. The part's browser suite holds it in a real page.
4. **The suites, in a slot of the coordinator's**: `voice_part` and `voice_app` are quick rows of the gate; the app's
   self-test has the voices' rows; the part has a browser suite, `tools/voice_site_test.js` (the gate's row
   `voice_site`, on the page's virtual clock). Nothing of the part stands on the stage, so the layout's suite is not
   moved by it.

The keys of the crew's minds moved to the key store's asynchronous calls in two commits of their own under this one
(`app/keystore.js`; the ask-the-bridge note v1.1, section 12). `app/voice.js` was written on those calls from the
start and keeps its own copy of the helpers for this join; it moves onto `app/keystore.js` with push to talk, which
rewrites much of the file. Known and left for then: its striking of a key from a text takes time with the square of
the text's length (its texts are at most 64 kB, so it is slow at worst), and a key can be saved while the app's own
question is open (the host is fixed, so nothing can be sent elsewhere by it).

### 9d. Push to talk as built, and what its independent review changed (2026-11-24)

**The page** (`site/parts/89_voice.js`). The captain holds Space on an empty order line, or holds the microphone's
button beside it (shown only while speaking to the bridge is on and a key is kept). While it is held the browser's own
recorder (MediaRecorder, WebM with Opus) gives a slice of sound every 100 ms, and each goes to the main process as
bytes. The words heard so far show greyed UNDER the line. On release the final words are given through the order
line exactly as typed words are, so a spoken night is the typed night: its orders in the watch's log, no word and no
sound in it, one fingerprint. Words of more than 160 characters (the order line's own limit) are not given. The men's
voices wait while the key is held, so that the microphone does not hear them. The microphone is kept open for twenty
seconds after a transmission and then closed; a new run, her end and the switch going off close it at once. There is
no worklet and no file of its own in `dist/`: the build did not change.

**The main process** (`app/voice.js`). The window's object `titanicVoice` gained four calls and one message back:
`open`, `audio`, `finish`, `cancel`, and the words heard (`onHeard`). One socket a transmission, by Node's own
WebSocket (Electron's own would pass through the window's session, which cancels every such request):
`wss://api.deepgram.com/v1/listen`, the model `nova-3`, interim results, punctuation on and formatting off, 24 key
terms from the order line's own words and the men's names, `mip_opt_out=true`, and the key as the socket's
subprotocol, never in the address. The speech-out request carries no opt-out: its text is the app's, not the
player's voice. Sound is taken only inside a transmission this process opened. Its bounds: 3 seconds for the socket
to open; 30 seconds a transmission, from the press; the run's limit of time heard (30 minutes unless the player
changes it); 3.5 seconds for the last words, from the moment the stream is closed; 2 MB of sound; 64 kB a message.
Nothing heard is written to a file or a log.

**The shell** (`app/main.js`, the app lane's file). Its two permission handlers give the microphone only for audio
alone, only to the app's own window at its own origin, and only while the ears' switch is on, read at the moment the
permission is asked. The app's own answers send `microphone=(self)`; `dist/_headers`, and so the public page, keeps
`microphone=()`. The camera stays refused by that policy. Chromium's fake microphone is switched in only by the
self-test's own flags.

**The player's own word.** Speaking to the bridge has a switch and a question of its own, in the system's message
box: what is said while the key is held is sent to Deepgram, as sound, to be turned into words; nothing is sent while
it is not held; the app asks Deepgram to leave it out of its programme for improving its models. Raising the run's
limit while it is on asks again. Every run starts with it off.

**Its independent review** found the microphone's gate and the key's handling sound, and five faults, none high:

| Found | Mended |
|---|---|
| Words that were not final became an order: "full astern then stop" could be given as "full astern" when the final words came late | Only FINAL words are given. Words still interim when the wait ends are shown greyed with a note, and nothing is given. The wait counts from the moment the stream is closed. A transmission the app ends itself, at its 30 seconds or the run's limit, gives nothing |
| A spoken question became an order: no punctuation was asked for, so "Fire the rockets?" came back with no question mark | Punctuation is asked for. A line that ends in "?" is a question to the order line, as typed |
| A recorder the browser stops by itself while the key is held (a microphone unplugged) gave the words heard so far | It cancels the transmission and says why. The app is asked to finish only once the key is let go |
| A socket given up while it was connecting stayed open | It is closed by its own opening, with a close frame |
| When the settings could not be written, the switch went off and the transmission stayed open | The transmission is given up before anything is written |

Six rows were added for changes to the code that the first suite did not catch.

**A second independent review** then went through the mends, the move of the key onto the shared key store and
"busy". Four of the five mends held; the key store's move and "busy" were sound; 54 transcripts punctuated as
Deepgram punctuates read the same typed and spoken. Nothing high. What it found, and what was done:

| Found | Done |
|---|---|
| The mend for a socket given up while connecting had made things worse: such a socket was no longer closed, and a handshake never answered held its connection for some 300 seconds | A connecting socket is closed again, which lets its handshake go at once; one that opens all the same with no owner is closed then, with a close frame |
| Deepgram's commas lost orders: "Half astern, both engines." was not understood, though the same words with no comma are an order | The words are tried as they came. Only where the order line does not read them as an order, and they hold no "?", are they tried once more with their commas taken out; if that reads as an order, the text without commas is what is given and shown. The grammar is not touched: the order line's own reading decides (`TitanicApp.crew.reads`, which gives nothing) |
| Words left greyed under the line stayed there after a new run, her end or the switch going off | They are cleared at each |
| The microphone lost while the key was held, and the key let go before the recorder's own stop: the words were given | A release with no live track is the microphone lost: nothing is given |
| Forget with the settings unwritable cleared the key from memory and left it in the file | The answer says so plainly, and the page shows it |
| A store that said it could protect a key and then would not seal one was still reported as protecting | It is reported as it is: the key is kept for the run only |

Four more rows hold what four further changes to the code had not been caught by: the stream closed with no final
word and no Metadata; a Forget during the opening of the kept key as the app starts; the transmission's own bound
while its last words are awaited; the store asked again when a key is saved.

**Shown inside Electron 45.2.3 by the app's self-test** (`tools/app_test.js`, with a stand-in for Deepgram on this
PC): Node's own WebSocket works in the main process; the fake microphone gives sound without Chromium's fake
permission UI, so the shell's own handlers are what is asked; the microphone is refused with the switch off, given
with it on and refused again off; the page is a secure context under `titanic:`.

**Not known without a real key and a real microphone:** that Deepgram takes the key as a socket's subprotocol; that
it reads WebM with Opus in slices of 100 ms with no encoding named; how long the last words take; whether it marks a
question that is spoken without a question word; whether a recorder really stops when its microphone is lost.

## 10. Decisions made here, for Bo to overturn

1. Deepgram is the one provider of this step, for both directions, on one key. A second provider is another row of a
   table in the main process, as with the crew's minds.
2. The floor's voices are local ones only, even where a browser offers better ones made on the network.
3. Every run starts with both switches off.
4. The men are given British voices and no accent is claimed.
