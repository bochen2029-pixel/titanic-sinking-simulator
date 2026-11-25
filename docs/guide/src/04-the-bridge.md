---
contents: the instruments, the wheel and the 1912 helm orders, the telegraph and the engines, orders in words, the crew's minds, the men's voices, speaking to the bridge
---

# The Bridge: wheel and telegraph

:::lede
Two controls ran the ship in 1912: the wheel, through the steering engines, and the engine-order telegraph to the
engine room. The Bridge gives you both, with the instruments to read her answer, and on a watch you can give the
bridge's orders in words, typed or, in the desktop app, spoken, and hear the men answer aloud.
:::

## The instruments

| Instrument | What it shows |
|---|---|
| {{:Speed}} | Knots through the water, and "astern" when she goes backwards. |
| {{:Heading}} | Her course in degrees, 266 at the start of the 1912 watch. |
| {{:Rudder}} | Where the rudder is, to port or starboard. The dial under it has two needles: the broad gold one is the order, the thin one the rudder following it. |
| {{:Engines, rpm}} | Revolutions a minute of the port engine, the turbine and the starboard engine. Under them, the steam pressure, with "short" when there is not enough steam for the order. |
| {{:Lookout}} | {{:Nothing in sight}} until the bells; then the range and bearing of the ice; {{:On the ice}} while she is on it; then whether she cleared it. |

## The wheel, and the 1912 orders

In 1912 helm orders were tiller orders, the reverse of today's. "Hard-a-starboard" put the tiller to starboard, the
rudder to port, and swung her head to port. Each button says both:

| Button | The 1912 order | Her head goes |
|---|---|---|
| {{Hard to port}} | "hard-a-starboard" | to port |
| {{Hard to starboard}} | "hard-a-port" | to starboard |
| {{Midships}} | "midships" | straight on: the rudder centred |

The slider between the buttons sets any angle up to @@rudder.max@@ degrees either side. The steering engines move the
rudder at @@rudder.rate@@ degrees a second (a guess: it was never measured), so hard over from midships takes
@@rudder.hardOver@@ seconds. They need steam: without it the rudder stays where it is.

:::tip What the rudder needs
The rudder works only on water moving past it. Stopped, she will not turn however hard you put it over. Going astern,
the rudder works the other way, and weakly. The faster she goes, the faster she turns, but the further she runs while
turning. With her screws going astern, their wash creeps forward along her sides.
:::

## The engine-order telegraph

Seven positions, from {{Full}} astern on the left to {{Full}} ahead on the right. Each rings the engine room for so
many revolutions a minute:

:::gen telegraph
:::

The two reciprocating engines turn the wing screws. Their exhaust steam drives the turbine, which turns the centre
screw: ahead only, at {{Half}} or {{Full}}, and with both engines above 40 revolutions. Reversing an engine takes
time: it runs down, its valve gear is reversed, and it comes up astern.

![The Screws view at full speed](img/screws.jpg "The Screws view four seconds into the watch, at 22½ knots: the rudder, the starboard wing screw, the centre screw in its aperture before the rudder, and the shafts. The screws turn with the model's shafts."){.stage}

## Orders to the bridge, in words

On a watch the {{Run}} tab has a section {{:Orders to the bridge}}, under the watch's own. It opens by saying what it
is: you are the captain, the officer of the watch answers below and carries your order out, and the order line needs
no key and sends nothing anywhere. Type an order as you would say it in the line {{:Give an order}} and press Enter,
or {{Give}}. The words become the same order the wheel, the telegraph or a button gives: it is logged at its step,
and a link to the watch replays it.

Under the line, {{:Try}} offers three orders: {{Hard a-starboard}}, {{Stop}} and {{Close the watertight doors}}. A
chip only writes its words into the line, and nothing is given until you press Enter or {{Give}}. The chips go once she
has gone, with no one left on the bridge to take an order.

- Say it as the bridge would: "hard a-starboard", "port ten", "midships", "full astern", "port engine stop", "close
  the watertight doors", "uncover the boats", "women and children first", "send the call for assistance", "fire a
  rocket", "sound the ship", "go forward and look".
- Several orders in one line are given in the order said: "hard a-starboard and full astern".
- A line that is not understood whole gives no order at all, and the bridge says what it did not understand.
- {{:The bridge's talk}}, under the line, keeps the last lines said: yours, the answer of the man who took the order,
  and the orders the night's own script gives. The newest line shows itself for a moment as it comes. Until anything
  has been said, the talk reads "Nothing has been said yet." and says that your orders and the officers' answers come
  there.

The switch {{Helm orders}} has two positions, {{1912 helm orders}} (the default) and {{Modern}}. In 1912 a helm order
named the side the tiller went to, as the wheel's buttons show: "hard a-starboard" turns her head to port. The modern
way names the side the rudder goes to. The line under the switch says which is in force, and the quartermaster's
answer says which way her head goes. An order that names the rudder, the wheel or where her head should go ("turn to
port") gives no order: the quartermaster answers with the helm order that would do it.

The line is the page's own: it needs no language model, no key and no network. A typed order takes the watch over, as
the wheel does: after it the night's own orders are no longer followed, and the talk says so. In the desktop app you
can also say an order aloud (below).

## Ask the bridge: the crew's minds (the desktop app)

![The crew's minds on the Run tab](img/minds.png "The crew's minds open under the order line, as the desktop app shows them on its first start: what to know before any key goes in, then the switch off, no key kept, Claude chosen. The picture is taken in a browser, with the app's own first answer given to the page's fold."){.side}

In the desktop app you can speak to the men on her bridge in your own words, and each answers in character: the
officer of the watch Mr Murdoch, Mr Moody, Mr Boxhall, Quartermaster Hichens, and Mr Andrews while he is on the
bridge. The words are a language model's, and every such line is marked {{:imagined}}. Each man knows only what has
reached the bridge, by a report, an order or his own eyes: never the water you can see in X-ray, and nothing of how
the night ends.

Open {{The crew's minds}} under the order line. Its first paragraph says, before any key goes in, that it is optional
and off each time the app starts, where your key goes and who bills you. Choose a {{:Provider}} (Claude, OpenAI,
Google Gemini, Cerebras, or a model running on this PC with LM Studio or Ollama), type your {{:Key}} once and press
{{Save}}, then tick
{{The men on the bridge answer (written by a language model, from what each man knows)}}. The app itself asks you to confirm, in a message box of its own
that the page cannot answer, naming the provider, its address and the run's limits. {{Try it}} asks one small
question to test the key. Each time the app starts the crew's minds are off: your key and your settings are kept, the
switch is not, so that no run begins spending because an earlier one did.

Then type a question on the order line: *Mr Murdoch, what did you see?* A name at the start says who is spoken to;
or press a name under {{:Speak to}}. A man who is not there is not asked, and the line says where he is. While an
answer is awaited, at most 45 seconds, the watch runs on at her own pace. If his answer holds an order that is his to
carry out, it is offered: press {{Give it}} or {{No}}, or type *yes* or *no*. *Very well*, *make it so*, *carry on*
and *go ahead* are yes to an offer too, and a bare *yes* answers the man you are speaking with. It lapses after a
minute of her time.
With {{Act on my word}} chosen in place of {{Ask before acting}}, it is given at once. Either way it is an order like
any other: it stands in the watch's log, and a link to the night replays it with no key.

With {{They speak up unasked}} ticked, as it is unless you clear it, the bridge is not silent until spoken to: when a
report reaches it by a man, he gives it in his own words. Each such line is one more question to the provider. They
are kept few: one in half a minute of her time at most, none while the watch runs faster than four times her pace,
and twelve in all on the night of 1912. The watch never waits for them.

Your key stays in the app, encrypted by Windows for your user account, and goes only to the provider you chose. The
provider bills your key: {{:Limit}} bounds a run of the app (200 questions or 300,000 tokens unless you change it).
F1 (About) says whether the crew's minds are on. On the public page the same fold says that they are optional and only
in the desktop app, and the officer of the watch answers in the bridge's own set words.

:::note What the crew's minds do not do yet
Mr Bell, the chief engineer, is in the row of names but cannot be spoken to yet. Once the boats are called, Mr
Murdoch and Mr Moody have gone to them. Mr Boxhall stays on the bridge until he goes away in boat No. 2, in charge of
her, and Quartermaster Hichens at the wheel until he is relieved there or goes away in boat No. 6: each leaves when the
model lowers his boat, which it does earlier in the night than the record has it, and the line then says where he has
gone. An
answer that names a figure, a time, a ship or a person the bridge has not been told of is not shown: the man is asked
once more, and then says "I couldn't say, sir." How long an answer takes and what it costs have not yet been
measured on a real key.
:::

## Hear the bridge: the men's voices

On a watch, tick {{Hear the bridge}} under the order line, and each line a man says on the bridge is spoken aloud as
well as written: the answer of the man who took an order, the officer of the watch's orders on the night's own script,
and, where the crew's minds are on, the men's own words. Your own lines as the captain are never spoken, and neither
are the page's notices. The voices are this PC's own (on Windows: Settings, Time and language, Speech), so nothing is
sent anywhere and no key is needed. Each man keeps one voice through the night, a British one where this PC has one,
and the note under the switch names the voices in use; with no English voice on this PC, nothing is spoken and the
note says so. Above four times her pace nothing is spoken: the lines then come faster than they can be said. When she
is gone, the bridge falls silent. The voices have a switch of their own: {{Sound}} and {{The ship at sea: volume}} do
not reach them. The switch is off until you tick it, and the page keeps it as you leave it.

In the desktop app, a fold under the switch, {{Deepgram's voices (your own key)}}, gives each man a voice of his own
from Deepgram, with a Deepgram key of your own. Open it: its first paragraph says, before any key goes in, that it is
optional and off each time the app starts, where your key goes, who bills you, and that what you say is sent only
while you hold the key to speak. Type your {{:Key}} once and press {{Save}}, then tick the switch in the fold. The app
itself asks you to confirm, in a message box of its own. {{Try it}} tests the key. While
it is on, the app sends each line a man says, as text, to Deepgram (api.deepgram.com) and to nobody else, and Deepgram
bills your key for every character. A run of the app sends at most 40,000 characters: {{:Limit}} changes that, and
while the voices are on the app asks before it is raised. A line in the fold shows what this run has sent. The fold's
title ends in "off", "ON" or "on, standing down", so that its state shows with the fold shut.

Deepgram's voices are off each time the app starts, until you switch them on. The key is kept encrypted by Windows
with her settings, as the crew's minds' key is, and {{Forget}} removes it. A line Deepgram cannot give is spoken by
this PC's own voice if {{Hear the bridge}} is ticked, and not at all if it is not. A key Deepgram refuses is not sent
again until you change something in the fold. F1 (About) says whether the voices are on. On the public page the fold
is not shown, and this PC's own voices speak as above.

:::note What the men's voices do not do yet
Nothing of Deepgram's voices has yet run on a real key: how long a line takes, what a night costs and how the voices
sound have not been measured. The voices have no volume of their own yet. Every voice is appearance: this PC's voices
are not the men's, and none of Deepgram's claims a man's own accent.
:::

## Speak to the bridge: push to talk (the desktop app)

In the desktop app you can say an order or a question aloud instead of typing it, with the same Deepgram key as the
men's voices. Open the fold {{Deepgram's voices (your own key)}}, save your {{:Key}} there if none is kept yet, and
tick {{Speak to the bridge}}, a switch of its own: the men's voices need not be on. The app itself asks you to
confirm, in a message box of its own that names Deepgram's address and the run's limit. Windows must also let desktop
apps use the microphone (Settings, Privacy and security, Microphone). With the switch on and a key kept, a button
{{Hold to speak}} stands beside the order line, and the fold's title ends in "speaking to the bridge: ON".

Then hold [[Space]] in the empty order line, or hold {{Hold to speak}}, say it, and let go:
*Hard a-starboard and full astern*, or *Mr Boxhall, what did you see?*

- **While you hold it** the button reads {{Listening...}}, and the words heard so far show greyed under the line. They
  are never put into the line. The men wait to speak, so that the microphone does not hear them, and go on when you
  let go.
- **When you let go** the button reads {{Hearing...}} until the last words come back. The final words are then given
  exactly as if you had typed them: the same order, logged as one, and a link to the watch replays it with no
  microphone. A spoken question goes where a typed one goes. No sound of yours is in the log.
- **Nothing is given** when you press [[Escape]] while you hold the key, when the end of what you said did not come
  through, or when you hold the key past 30 seconds, where the app cuts it off. A note under the line says why, and
  words cut off or not caught whole stay greyed above it: say it again.

While the switch is on, and only while you hold the key, the app sends the sound of what you say to Deepgram
(wss://api.deepgram.com) to be turned into words, and to nobody else. Nothing is sent while you do not hold it, and
neither the sound nor the words are kept on this PC. The app asks Deepgram to leave what you say out of its programme
for improving its models (Deepgram may charge more for that). Deepgram bills your key for each minute it hears: a run
of the app sends at most 30 minutes, and the fold's second {{:Limit}}, in {{:minutes heard a run}}, changes that
(while the switch is on, the app asks before it is raised). A line under it shows what this run has sent.

The app gives the microphone to its own page alone, for sound alone, and only while the switch is on. The page opens
it when you first hold the key, keeps it open for about twenty seconds after you let go, so that the next hold is
quick, and closes it then, when the switch goes off, at a new run and once she is gone. Speaking to the bridge is off
each time the app starts, until you switch it on, and F1 (About) says whether it is on. The public page has none of
it: no switch, no button and no microphone.

:::note What speaking to the bridge does not do yet
Nothing of it has yet run on a real Deepgram key or a real microphone. The app's own self-test holds a real Space in
the order line, with Chromium's built-in stand-in for a microphone and a stand-in for Deepgram, and sees the order
given. How quickly the words come back, how well an order is heard and what a night costs have not been measured. A
question asked without a question word, such as "Full astern?", is told from the order only by the question mark
Deepgram puts on it, and whether it does is not yet known.
:::

## Keys

| Key | On a watch |
|---|---|
| [[A]] · [[D]] | {{Hard to port}} · {{Hard to starboard}} |
| [[S]] | {{Midships}} |
| [[←]] · [[→]] | The wheel five degrees to port · to starboard |
| [[↑]] · [[↓]] | The telegraph one step ahead · one step astern |
| [[Space]] · [[R]] | Pause or play · restart (these work on every run) |
| [[,]] · the full stop (.) | Back a minute · on a minute, along the minutes kept; with Shift, ten (these work on every run: chapter @@ch.scenarios-and-what-ifs@@) |

The keys of the watch work wherever the focus was left, except in a text box, a slider or a tick box. [[Space]] and
[[R]] work when no button has the focus; with a button focused, [[Space]] presses it. In the desktop app, with
speaking to the bridge on, [[Space]] held in the empty order line speaks to the bridge, and [[Escape]] gives up what
was said (above); a space typed among words is only a space.
