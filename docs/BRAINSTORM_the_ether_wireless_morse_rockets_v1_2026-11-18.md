# BRAINSTORM: the ether, v1: her wireless heard and worked, the range of a spark, the other ships talking back, the rockets

- **Written:** 2026-11-18, 08:35 to 09:30 CST, session bbb32357 (Claude Code desktop; Fable 5.2, finished on Opus 5.5), at Bo's word of that
  morning: "brainstorm this, adding distress rockets and morse code, and realistically simulating a range of
  transmission and perhaps getting message from other ships, see my ATC for inspiration ... basically titanic fired
  distress rockets and send out SOS CQD etc etc, can you find a way to add these elements into it as well".
- **Status:** advice only; nothing here is a decision, and nothing in it is built or started. `BACKLOG.md` gets its rows
  when Bo picks.
- **Lineage:** `BRAINSTORM_the_whole_night_v1_2026-11-17.md`, section 6 ("Help") and the rows "Rockets and the lamp",
  "After she is gone" and "Voice" of its section 7; the research note
  `docs/research/RESEARCH_wireless_rockets_ships_clock_v1_2026-11-17.md` ("the note"); what was built from them on 17
  November (`core/readers/world.js`, `site/parts/70_help.js`). Two other simulators, one of air-traffic
  control and one of an airliner's systems, were read for ideas (section 8).
- **Tags:** [read] in a source the note read, or in a page opened today and named in section 14; [search] seen today
  only in a search digest; [memory] recalled and not read today: to be read before anything is built on it;
  [derived] arithmetic shown here or run today; [measured] this model's own figure; [bet] judgement, no source.

## 0. The answer in one paragraph

Half of this exists and none of it can be heard. Since 17 November every watch has a wireless that works while the
plant gives it current, a distress call, rockets, a Morse lamp, and eight other ships that hear, turn and arrive. But
nothing is ever sent: a message is a sentence in a list, the range is one number that is the same in both directions
and for every listener, the other ships say nothing but "coming", and the player has three buttons. The proposal is
to model **the ether itself**. Every transmission of the night becomes a piece of data: who keyed it, to whom, the
words, and how long the key was down for them. A formula published the year before she sailed carries it to every
station; each station hears it through her own receiver, her own noise and whoever else is sending; an operator who
may be asleep, busy or telling the world to keep out copies it; and only then does someone carry it to a bridge. On
that data the page plays what Phillips heard: Morse in the telephones, each station on her own note, loud when she is
near and thinning as the dynamos fail. The same data gives the player a key and a message pad, gives the rockets and
the lamp their proper weight, and gives the second search (lives) the levers it lacks. It stays a reader of the watch:
with it or without it, no bit of the flooding, the motion or the plant changes, and every order is logged and
replays.

## 1. What is built, and what it leaves out

| Piece | Built on 17 November | What is missing |
|---|---|---|
| The set | works on the main dynamos, the emergency dynamos or its battery; silent when the sea reaches the room; its reach falls with the bus voltage [bet there] | one reach for every listener and both directions: a 1.5 kW ship is heard as far as a 5 kW one, and Titanic hears everyone she reaches |
| The call | the captain's order at T 25, the first call at T 47, six later messages as lines of prose, each sent when its hour comes | no text, no call signs, no length: a message costs no time on the air, so nothing can be late, cut off or talked over |
| Hearing | a ship hears if she is inside the reach and her operator is on watch | no strength, no noise, no interference; "cannot hear for noise of steam" is a sentence, not a state; Cape Race does not exist |
| Answers | "X answers: N miles off", "coming, expected at ...", "stopped by the ice" | what they said, when the key was free to say it, and whether Titanic could read it |
| Sound | the rocket's report | no Morse, no spark, no telephones |
| Rockets | 36 socket signals as orders; fetched from aft; a burst the eye sees, its light on the sea; seen by each ship inside a horizon and a luminous range | the interval the rule of the day asked for; the other signals she carried; what a watch concludes; Carpathia's own rockets; the boats' green lights |
| The lamp | an order; read inside 10 miles by a watch that acts | it does not flash anything |
| The player | three buttons: send the call, fire a rocket, work the lamp | what to send, to whom, with which position, at what moment; listening |
| Before the ice | nothing: a watch begins about a minute before the touch | the evening's ice messages, three of which reached the bridge and two of which did not |
| After she is gone | nothing: the watch ends on the card | Carpathia's rockets to the south-east, the green lights of boat No. 2, the first boat alongside |

## 2. The idea: the ether as data

### 2.1 A transmission

One record for everything that goes out on the air, from any station:

```
{ id, t0, t1, from: 'MGY', to: 'CQ' | a call sign, inReplyTo: an id | null,
  text: 'CQD CQD CQD ... DE MGY ... POSITION 41.44 N 50.24 W', wpm: 20, wave: 600, amps: 10 }
```

`t1 - t0` is not chosen: it is the Morse length of the words at the sender's speed (section 5.4), so the model knows
when the key is down. `amps` is the aerial current, which comes from the plant's voltage (section 3.5). The record is
plain data in the reader's state, like everything a watch's forecast has to copy.

### 2.2 Three places a message can be

The whole-night brainstorm's rule of truth and knowledge, applied to the air:

1. **On the air:** the transmission exists for every station at once, at a strength that depends on the two sets and
   the sea between them.
2. **In the telephones:** a station copies it if someone is listening, if it stands clear of her noise and of whoever
   else is sending, and at the speed it was keyed. What is copied may have holes: a missing figure in a position.
3. **On the bridge:** the operator, or the junior, carries it there. That takes minutes, and on the afternoon of 14
   April it did not always happen [read: section 7.1].

Each step can lose it. The instrument's view shows all three; the bridge's view (D17) shows only the third.

### 2.3 The rules it keeps

- **A reader.** It writes nothing into the flooding, the motion, the ice or the plant, pushes nothing into the
  model's events, and a watch has the same fingerprint with it and without it.
- **Orders are logged** with the helm's and replay with them. The three orders of 17 November (`help:call`,
  `help:rocket`, `help:lamp`) keep their names and their meaning for good, so that every log and link made since
  then replays to the same night.
- **What is drawn at random is drawn from the night's seed** (the fading of section 3.3, a garbled letter).
- **The sound is appearance resting on numbers.** The page renders Morse from the transmission's data; the model
  never holds a dot. Each sound's level is a stated function of a number in the model, as in `site/parts/30_sound.js`.
- **The record first.** On a night that follows its 1912 conduct the messages are the logged ones, at their logged
  minutes. A message nobody sent that night is marked as composed wherever it is shown.

## 3. The range of a spark

### 3.1 The formula of 1911

Austin and Cohen's empirical formula, from the US Navy's tests of 1909 and 1910 between two cruisers steaming south
and the station at Brant Rock, almost wholly over sea [read: section 14], gives the current a sending aerial puts
into a receiving one:

```
I_r = 4.25 I_s h1 h2 / (wave d) x exp(-0.0015 d / sqrt(wave))        amperes; heights, wave and distance in km [memory]
```

It is the right tool for three reasons. It is the physics of the day, built on ships' spark sets on long waves over
salt water. It has two sets in it, so a strong station and a weak one stop being equals. And it gives a current, not
a yes or no: a strength to hear, to compare with a threshold, and to lose under a louder station.

### 3.2 The check against the record

Run today [derived], with these inputs: the 600 m wave [read]; Titanic's aerial 170 ft mean height [read] and 10 A
in it (the 500 W that reached her aerial [read] into 5 ohms [bet]); a ship with a 1.5 kW set, 100 ft of aerial [bet]
and the current that goes with her power (5.5 A, as the square root [derived]); by night the exponential taken away,
which is the order of what section 3.3's night law gives far from the sender [bet]. One number is fitted: the least current her kind of receiver could read, **40 microamperes**
[bet, fitted to Bride's 400 miles by day; Austin's own figure for the best detectors of 1913 was about 5 [search],
and the magnetic detector was the robust one, not the sensitive one [memory]].

| Link | By day | By night | The record |
|---|---|---|---|
| Titanic heard by a ship with a small set | 380 nm | 1,486 nm | about 400 miles by day (Bride); 1,500 to 2,000 at night; guaranteed 250 to 350 [read] |
| a small set heard by Titanic | 289 nm | 814 nm | - |
| a small set heard by another | 217 nm | 471 nm | Carpathia's set: 250 miles, best at night (Cottam); Californian's furthest: 250 (Evans) [read] |
| Titanic and Olympic, each way | 472 nm | 2,566 nm | they worked each other at 505 nm that night [read] |

The fitted number was aimed at one figure, the 400 miles by day. The night range of 1,500, the small sets' 250 and
the Olympic's 505 were not aimed at, and they come out. That is the check a new module owes before it is built on.

Each ship of the night, at her distance in the note, by night, as a multiple of the 40 microamperes:

| Station | Distance (nm) | She hears Titanic | Titanic hears her |
|---|---|---|---|
| Californian, on the Court's distance | 9 | 165 times | 90 times |
| Californian, on the 1992 reappraisal's | 18 | 83 | 45 |
| Carpathia | 46.5 | 32 | 17.5 |
| Mount Temple | 60.6 | 25 | 13 |
| Birma | 100 | 15 | 8 |
| Frankfurt | 154 | 10 | 5.3 |
| Virginian | 170 | 9 | 4.8 |
| Baltic | 243 | 6 | 3.3 |
| Cape Race, taken as a set like her own [bet] | 380 | 6.8 | 6.8 |
| Olympic | 505 | 5.1 | 5.1 |
| Caronia | 800 | 1.9 | 1.0 |

Two things the single reach of 17 November cannot say fall out of the table. **It is not the same both ways:**
Caronia, 800 miles east, reads Titanic's call and relays it [read], while her own answer would arrive at the edge of
what Titanic could read. **And strength is not distance:** section 3.3.

### 3.3 Night, and why the strength of a signal lied to Phillips

By day the long waves are absorbed as the formula says. By night much of that absorption goes, signals carry several
times as far, and they stop being steady: Austin called night signals stronger but freakish and unfit for
measurement [search]. The model's night law [bet]: the steady wave along the sea as by day, plus a wave returned
from the sky that is absent near the sender and, beyond about a hundred kilometres, of the order of the unabsorbed
figure, multiplied by a slow fading drawn from the night's seed.

That one law has the night's most telling detail in it. Phillips judged the Frankfurt, about 150 miles off, to be
nearer than the Carpathia at 58 "by the relative strength of the signals", and Bride gave that as his reason; Cottam,
asked whether an operator can judge distance from strength, answered: not after dark [search: Bride and Cottam, US
inquiry]. On the steady wave alone (the day's formula) the Carpathia's answer reaches Titanic at about 15
times the threshold and the Frankfurt's at 3. A sky wave on the Frankfurt's path, at a moment when it is up, can
reverse them; one secondary page says the Frankfurt had "a very strong signal" some 200 miles off [read: section 14],
which may also mean a stronger set than the Carpathia's "older type" [read]: R4 reads which. Meanwhile the Mount
Temple, 60 miles off and inside the steady wave, "never got weak at all" [read: Durrant]. So the 1912 night's fading is **fitted to one
fact**, that the Frankfurt's answer at T 70 comes in stronger than the Carpathia's at T 57, and **checked against
three it was not fitted to:** the Mount Temple's signals steady throughout, the Virginian's last copy faint and
blurred at 170 miles on a failing supply, the Asian hearing her only faintly [read: the note, sections 1 and 2.2].

The player then meets the same trap. The loudest answer in the telephones is not the nearest ship, and nothing says
which is, until a ship gives her position, which costs a minute of key time each way.

### 3.4 What a receiver needs

A transmission is copied at a station when it stands clear of three things:

- **Her threshold:** the least current her detector reads (a number for each kind of set [bet until read]).
- **Her own noise.** For Titanic that is the roar of steam blowing off, which the plant already computes
  (`plant.blow`): "cannot hear for noise of steam" becomes a state in which weak answers are lost and strong ones
  are not. The Mount Temple, answering the first call, was told that Titanic could not read her [read]. And the
  atmospherics, a level drawn from the seed [bet].
- **Whoever else is sending.** A spark is broad and a receiver of 1912 could not shut a strong neighbour out. The
  rule [bet]: the wanted signal must be so many times the strongest other signal at that moment.

The test for the last one is in the record. At 9:05 pm New York time the Californian, stopped in the ice, called
Titanic while Phillips was working Cape Race, and was told to keep out [read]. In the table above the Californian at
18 miles arrives 45 times over the threshold and Cape Race 6.8 times: wherever exactly she lay half an hour before the
collision, the nearer ship drowned the shore station **five or more to one** [derived]. Evans found Titanic's signals
stronger still when he turned in [read: the note]. Phillips's temper was arithmetic.

### 3.5 Power, from the plant

The reader of 17 November lets the reach fall in proportion to the bus voltage between 90 and 70 volts and stop below
[bet]. With currents the law has a mechanism. Her set's motor ran on the ship's mains and drove its alternator; the
rotary discharger turned with them, a spark to each half-cycle (an alternator of 420 cycles [search] and a note of 840
[read] fit that) [memory: the discharger on the motor's shaft]. As the dynamos fail the motor slows, so the
alternator gives less voltage and fewer sparks: the aerial current falls faster than the bus voltage [derived; the
power to be read or fitted in R4], every listener's strength falls by the same share, the farthest drop out first,
and, because the discharger slows with the motor, **her note falls in pitch** [derived]. The failing supply is then
heard, not told. The record's check: Cottam and Durrant, 47 and 61 miles off, heard no weakening, while the Virginian,
170 miles off, copied a last signal faint, blurred and ending abruptly [read].

The emergency set needs reading. One secondary page gives the auxiliary transmitter as a plain spark on a ten-inch
coil from batteries, good for about 40 miles by day [read: section 14]; the reader's battery reach is 150 miles at
night [bet]. On the formula a coil set is a small aerial current like any other, and its reach by day and by night
follows from that one number.

### 3.6 What stays a bet until it is read

The formula's two constants [memory]; Titanic's aerial current; the small sets' aerial heights and powers, ship by
ship; the magnetic detector's threshold against a crystal's or a valve's; the sky wave's size and the fading's
spread; the interference ratio; the note of each kind of set (section 5.1). Step R4 of section 10 is the research
note that reads them, before any code.

## 4. The stations and their operators

### 4.1 Who is on the air

| Station | Call sign | Set | Operators | Where she is in the model | New? |
|---|---|---|---|---|---|
| Titanic | MGY [search] | 5 kW, rotary discharger, magnetic detector and a valve [read] | two, a constant watch [read] | - | - |
| Cape Race, the shore station | MCE [search] | NOT READ | a station staff | about 380 nm NNW [read] | new: the station Phillips was working, and the relay to the Virginian and to New York |
| Carpathia | MPA [search] | "an older type", 250 miles [read] | one, about to turn in at T 57 [read] | built | - |
| Californian | MWL [search] | 250 miles; 200 on batteries [read] | one, off at T 2 to 7 [read] | built | - |
| Mount Temple | MLQ [memory] | NOT READ | one (Durrant), on watch [read] | built | - |
| Frankfurt | DFT [memory] | NOT READ; a German set, probably a singing spark [memory] | NOT READ | built | - |
| Birma | SBA [memory] | NOT READ | NOT READ | built | - |
| Virginian | MGN [memory] | NOT READ | NOT READ | built | - |
| Baltic | MBC [search] | NOT READ | NOT READ | built | - |
| Olympic | MKC [search] | as Titanic's [read] | two | built | - |
| Caronia, Asian, and the listeners the logs name (Ypiranga, La Provence, Parisian, Prinz Friedrich Wilhelm, Amerika, Mesaba, Antillian) | NOT READ | NOT READ | NOT READ | not placed [the note: NOT FOUND or NOT CHECKED] | new, as far as positions can be found: they are the crowd on the air, and three of them sent the ice messages |
| Cape Cod | MCC [read] | the press station | - | far to the west | perhaps: what Cottam was copying before he heard her |

### 4.2 What an operator is

A small state machine beside each set, all of it plain data: on watch or turned in (the hours the note gives); busy
with traffic of his own (Cottam taking Cape Cod's news; Phillips clearing passengers' telegrams through Cape Race);
a speed at the key; and five rules.

1. **Listen before sending.** He keys when the air, as he hears it, has been clear for a few seconds. Two stations
   that cannot hear each other will therefore both send, and a third between them copies neither: the jam nobody
   meant.
2. **Distress silences the routine**, for those who copied it. Those who did not carry on, and get the answers
   history records.
3. **A copied call is carried to the bridge**, which takes time, and the captain's rule (built on 17 November: the
   delay, the turn, the speed, the ice) answers it. What the ship then says is keyed when the air is free.
4. **Relays.** A station that copied the call repeats it for those beyond Titanic's own reach: Cape Race passed
   everything to the Virginian at 11:25 pm New York time [read].
5. **He says what his log says.** On a night that follows history the words are the logged ones [read, to be
   transcribed in step R4]; where the night departs from it they are built from a few period forms (the call, a
   position, "coming", an hour of arrival, a question) and marked as composed.

Nothing here is a character. An operator is hours, a speed and a queue, and the model says nothing of him that a log
or a transcript does not.

## 5. Morse: heard, read, keyed

### 5.1 Heard

The page renders every transmission that is above her threshold at that moment as keyed tone in the telephones.

- **Loudness** is a stated function of the received current over the threshold (decibels, clipped), so the
  Californian is painful and the Olympic is a thread. The failing dynamos are heard as the model computes them.
- **The note is the sender's.** A spark set sounded at the rate of its sparks. Titanic's rotary discharger sang at
  about 840 a second [read: one secondary page; another reading gives 560 [search]]; a plain gap on a small set
  rasped low; the German quenched sets were built to sing, near a thousand [memory]. An operator knew a station by
  her note before she signed. The rate is a number to be read for each set; the timbre around it is [appearance].
- **The room is in it.** The steam's roar is the sound the page already makes for the blow-off, and now it is in
  the way of something. Her own spark, when she sends, is the crash from the silent room next door [appearance].
- **Pace.** Morse is played only while the page runs near her own pace, as the engine's beat is; faster, the log
  fills and the telephones are silent. The camera director (a lane of this morning) can hold her own pace for the
  messages that matter.

### 5.2 Read

The operator's log, the procès-verbal, as a panel: New York time and ship's time side by side, as on the two clocks
of her wireless room [read]; who to whom; the words as copied, with a gap where a letter was lost; the strength. A
line appears when the message ends, not when it begins: copying takes as long as sending. Beside it, **one strip for
each station heard**: her call sign, her name once known, when last heard and how strong, the position and distance
she has given, what she has said she will do. That strip board is where the night's knowledge collects, and it is
the thing to borrow from an air-traffic simulator (section 8).

Two settings for the reader's eye. Decoded: the words appear as Phillips would have written them, the default. By
ear: the log shows only dots and dashes as they arrive, with a table of the code beside it, for anyone who wants to
find out what it took.

### 5.3 Keyed

Two ways to send, both ending in one logged order whose value is the text.

- **The pad.** Period forms with blanks: the distress call with a position; a question to one station ("what is
  your position"); an answer; a state of the ship ("putting the women off in the boats"). The operator keys it at
  his own speed. This is the bridge's way of giving an order and the default.
- **The key.** The space bar, a mouse button or a finger is a straight key; the page reads the player's fist, shows
  what it made of it, and what was keyed is what goes out, mistakes included. The order carries the text and the
  speed achieved, never the raw key times, so a replay sends the same message.

The Morse lamp gets the same data: worked from the bridge wing it flashes the letters, slowly, where the night look
can see them, and a watch that is reading it needs the time the letters take.

### 5.4 What a message costs

Lengths run today [derived], by the usual measure (a dot one unit, a dash three, one between the parts of a letter,
three between letters, seven between words; a unit is 1.2 seconds divided by the words a minute):

| Message | Units | At 15 | At 20 | At 25 words a minute |
|---|---|---|---|---|
| CQD | 37 | 3.0 s | 2.2 s | 1.8 s |
| SOS | 27 | 2.2 s | 1.6 s | 1.3 s |
| the call six times, "de MGY" six times, the position | 811 | 65 s | 49 s | 39 s |
| "come at once we have struck a berg ..." with the position | 671 | 54 s | 40 s | 32 s |
| "we are putting the women off in the boats" | 317 | 25 s | 19 s | 15 s |
| an answer: "MGY de MPA putting about and heading for you" | 385 | 31 s | 23 s | 18 s |

A full call is most of a minute during which nobody can usefully answer; a question and its answer, with the
positions repeated, is three or four. Ten ships answering one key is the crowding the logs show, and it comes from
the lengths, not from a script. The speeds are a number for each operator [bet: 20 to 25; the first-class
certificate of the day asked 20 [memory]].

## 6. The rockets, further

Built: the 36 socket signals as orders, the box fetched from aft, the burst at the height the note gives, its light
and its report, and each ship's sight of it by horizon and luminous range. What is worth adding:

- **A standing order with an interval.** "One every minute until I say stop" is one logged order, not thirty-six.
  It matters because the rule of the day read: rockets or shells throwing stars, fired one at a time at short
  intervals [read], with a gun or explosive signal at about a minute [read]. Titanic fired eight in an hour.
- **What a watch concludes.** Seeing is not answering: the Californian's watch saw all eight and asked whether they
  were company's signals [read]. Today that is one switch (D21: her watch acts, or does not). The switch stays. What
  is added is a readout, in the instrument's view, of what each ship's watch has seen: how many, at what intervals,
  whether the lamp was read. A rule that turns seeing into acting would be a guess about three men on one bridge,
  and belongs, if anywhere, in a what-if with its own label (D32).
- **The other signals she carried** [search: an equipment list quoted second-hand]: 12 ordinary rockets, 2 deck
  flares, 12 blue lights, 6 lifebuoy lights. And the rule's fourth signal, any fog apparatus sounded continuously
  [memory]: her whistles, while there is steam, heard a few miles [bet].
- **Seen from elsewhere.** An eye on the Californian's bridge, on the distance chosen: Titanic's lights low on the
  horizon and each burst about ten times as high above it as her masthead light (4.4 against 0.42 thousandths of a
  radian at 19 miles [derived there]), where her second officer saw them at half its height [read there]. It is the
  view the whole dispute is about, and the model has every number it needs. Drawn; the geometry [derived], the look
  [appearance].
- **The report's delay.** From the boat's eye, 300 m off, the burst is about 350 m away and its bang comes a second
  after the flash [derived]; from the Californian's distance it does not come at all, which her master made much of
  [read].
- **The hours after** (section 7.2): Carpathia's own rockets and the green lights burned in boat No. 2.

## 7. Before, and after

### 7.1 The evening: five messages about ice

Read today in the British Report [read: section 14], all on 14 April, Titanic's time unless said:

| Time | From | What it said | What became of it |
|---|---|---|---|
| 9:00 am | Caronia | bergs, growlers and field ice in 42° N from 49° to 51° W, seen on the 12th | acknowledged by the captain; shown to Lightoller at about 12:45 |
| 1:42 pm | Baltic | a steamer's report of icebergs and field ice in 41° 51' N, 49° 52' W | acknowledged by the captain; handed to Ismay, who kept it until 7:15 pm; then posted in the chart room |
| about 1:45 pm | Amerika, for the Hydrographic Office | two large icebergs in 41° 27' N, 50° 8' W | never reached the bridge: probably set aside until Cape Race was in range |
| 7:30 pm | Californian to Antillian, overheard | three large bergs five miles to the southward of her, 42° 3' N, 49° 9' W | Bride says he took it to the bridge |
| 9:40 pm | Mesaba | heavy pack ice, a great number of large bergs and field ice from 42° N to 41° 25' N, 49° to 50° 30' W | not delivered: the operator had been busy since about 8 with passengers' messages through Cape Race |

And at 9:05 pm New York time, about 11:07 by her clock, half an hour before the ice: the Californian, stopped and
surrounded, told to keep out [read: the note].

The Mesaba's rectangle lay across her track. This is the wireless as part of the cause, and it is the same three
places of section 2.2: on the air, in the room, on the bridge. As a piece of the game it is a **prologue**, not a
longer watch: the evening runs as traffic, a chart on which the bridge pencils only what it was handed, and a
decision the model already has a place for, the speed she keeps (the watch's 22.5, 18, 15 or 10 knots). History is
the default: three messages on the bridge, two in the wireless room. A switch gives the bridge all five. Nothing in
the model's start changes, so the 1912 night and every seeded night keep their bits.

### 7.2 The hours after

The whole-night brainstorm's section 6.4, with the ether added. From the boat's eye after she has gone: Carpathia's
rockets every quarter of an hour from 2:45 by her clock [read], low to the south-east; the green lights Boxhall burned
in boat No. 2, which Carpathia steered for [read]; the first boat alongside at 4:10 [read]. And the air after: who
was told what, and when the shore learned. Dawn belongs here too: with daylight the ranges of section 3.2 fall back
from the night column to the day column, and Carpathia's small set could not reach the land [bet: to be read].

## 8. What two other simulators teach

Two other simulators were read for this by read-only scouts on the same morning: one of approach control (a player
who talks to aircraft by radio; seeded, deterministic, replayed from its logged inputs) and one of an airliner's
systems (an overhead panel, the systems behind it, graded drills, and a judge of hand-flown approaches). Neither has
a radio channel to copy. The first keeps every call as an instant line, with no duration and no range, and plans one
speaker at a time in its audio layer; the second has no radio at all. What they lend is structure. No code of theirs
is taken.

### 8.1 From the approach-control simulator

| Its idea | Where it lands here |
|---|---|
| Every call is a record: an id, a tick, who spoke, the text as shown, a second text derived from it for the voice, and the id of the call it answers. The derived form is a pure function pinned by frozen rows | section 2.1 (`inReplyTo`); the Morse of a text and its length are a pure function with frozen rows in W11's suite |
| Calls have no duration there, the plan arbitrates in the audio layer, and where a call that steps on another is decided is still open | decided here: in the model. Who copied what is state that rescues hang on; the page only plays it (section 2.3) |
| An instruction is checked when given, applied after a timer, and checked again when it lands; an action landing on a world that has moved on is a known hazard there | a slip carried to the bridge is an input of its own kind, with its own delay, checked again on arrival: a bridge under water, an operator released, a ship already alongside (section 2.2) |
| One shared random stream let any call reshuffle all later traffic; the fix is streams keyed by name and id, with a test that a session with one more call has the same traffic | the ether draws from streams keyed by the message (W11); the night's own draws are untouched, as every reader's are |
| One pure function gives the first reason a radar target is not seen, in a fixed order, and a target coasts before it is lost | `unheard(station, transmission, t)`: off watch, below her threshold, drowned by another, lost in her noise; the log can say why a station did not answer (W11) |
| A crew is given a perception, never the truth; a perception with a field the crew could not know is a failing test | each ship acts on what her operator copied and her bridge was handed (W13) |
| The other side's moves come from a menu the world computes; a language model may word a turn, but only a turn that passes a validator is logged, and the scripted turn is always there to fall back on | the operators' five rules (section 4.2) are the menu; composed words are marked (D30); a model may one day word them, never move a ship (D34) |
| The frequency log writes a pilot's line out as it is spoken; times come from the tick; a strip's colour says who is on the frequency | the operator's log written at the sender's speed, with the groups under each line; the strips of section 5.2 |
| The radio log of twenty recorded sessions is kept as a digest a minute at a time and shown to bite: a readback 0.01 s later fails 18 of the 20 | the 1912 night's ether as a digest a minute at a time in `out/`, with its own proof that it bites (W11) |
| A pilot's voice as a pure function of the seed and the call sign, mending a prototype that gave him a new voice every line | on a drawn night an operator's speed and fist come from the seed and his call sign; on the 1912 night from what R4 reads, else a stated bet |
| Time compression drops to real time while a call is pending (an open decision there) | Morse is played only near her own pace, and the director holds it there for the messages that matter (section 5.1) |

### 8.2 From the airliner systems trainer

| Its idea | Where it lands here |
|---|---|
| Every control is a row of data writing one declared variable: a selector with a table of detents, a guarded switch that takes two deliberate clicks, a button its own system clears; a row that binds anything undeclared is refused when the page loads | the wireless room's controls as rows: the change-over between sending and listening, the tuner's waves, the emergency set's switch (guarded), the magnetic detector's clockwork, which had to be wound [memory]; a station with no call sign refused at load |
| The player works the controls and the systems compute; a drill reads the systems' state, never the button | the key writes only key-down; what went out is judged by what the other stations decoded (W14) |
| Mistakes are consequences, not refusals: an early master lever gives a hot start | keying with the change-over at "listen" sends nothing; a receiver off the wave hears less [bet]; nothing is greyed out for being wrong |
| A test for every dependency the text claims: the scout found an explanation there that names a power supply the model never draws | every claim of sections 3 and 4 that the set needs current, a man and a dry room has its test, as the plant's dependencies do |
| A drill is an ordered list of steps, each with a predicate on state, a window that opens on an event, a reason it matters and an aim with a band; graded in order; the reason should be shown (that page drops it); the model must never complete a graded step by itself | **a first lesson**: the call. It opens at the captain's order: the change-over to send, the call with the position, the change-over to listen, the answering station named by her call sign, the answer taken to the bridge; each step with its reason, shown (D35) |
| The scripted crew passes every band from varied starts before any player is graded; a log says who flew it; a run nobody touches must fail and name what it broke | the scripted operator passes the lesson first; a watch where nobody touches the key fails it (W14) |
| A wizard learns the player's controls one question at a time and keeps them in the browser | the player keys a few E's and T's and the page learns the fist's dot, dash and gaps, kept in the browser as a convenience of that viewer, never state of the night |
| A failed instrument shows a flag, never a number | a station that copied fragments shows gaps, never guessed letters |
| A judge of bands, each with its source or "ours", reporting its worst value and when | for the lesson only; the night keeps the measures it has (minutes, and lives: D16) |
| The flight's moments as a log beside a timeline that can be scrubbed | the operator's log beside the watch's events on the end card; going back in time is a replay, which a watch already is |
| A station's identifier is pinned to real time when the simulation runs faster | the same for Morse (section 5.1) |
| A light is a point that stays sharp at any range, seen from each observer's eye through haze and the earth's curve | the rockets are already drawn so (`site/parts/70_help.js`); the eye on another ship's bridge (section 6) uses the same rule |

### 8.3 What not to borrow

- The radar horizon, 1.23 (√h1 + √h2) miles: the right shape for a light, the wrong law for a spark on 600 m, which
  the sea and the night's sky carry far past any horizon (section 3).
- A speech service in the loop: this page is a static site and must work offline (D23).
- Code: ideas only.

## 9. What it does to the game

- **Not knowing.** Who is nearest? The strongest answer is not (section 3.3). A ship is a call sign and a strength
  until she spends key time on her position. The position Titanic herself sends is 13 miles from where she lies
  [derived: the note]; the model can let the player send the captain's, Boxhall's or (as a what-if) the true one, and
  have each rescuer steer for what she was sent until she sees a rocket or a light, as the note's rule for the ships
  already says.
- **Choices that were real.** When to call: the note's arithmetic says 42 minutes sooner brings Carpathia 52 minutes
  sooner. Which answer to take when three ships call at once. Whether to spend a minute asking a position. Rockets
  early and close together, or eight in an hour. Steaming toward a ship that the bridge knows of only through the
  telephones.
- **A place to be.** The wireless room as a seat beside the bridge's: the telephones, the log, the strips, the key.
  Unattended, the operators do as they did in 1912.
- **A way in.** A first lesson, the call, for anyone who has never touched a key (section 8.2).
- **The second search.** W10 (lives) has had nothing to search over on this side but the call's minute. Every item
  above is an order it can try.
- **The director.** Its cut list gains the first call, the first answer, the last message.

## 10. Build order, each step with its test

Each step is a lane of the usual kind: a brief, a worktree, an acceptance suite, one gate at the merge. None touches
`core/core.js`, `core/motion.js`, `core/encounter.js` or `core/systems.js`.

| Step | What | Size | Done when |
|---|---|---|---|
| R4 | A research note: the logs' messages word for word with their minutes; the call signs; each station's set, aerial and operators; Austin's formula read in its paper; the detectors' thresholds; the notes of the sets; operators' speeds; the socket signal's maker and figures; the rule on distress signals in full | S | every [memory] and NOT READ of this note is [read], [search] or NOT FOUND; section 3.2's table rerun on what was read |
| W11 | The ether: transmissions as data with their Morse lengths; stations with sets and aerials; the formula by day and night with the seeded fading; threshold, noise and interference; aerial current from the plant's voltage. The reader of 17 November asks it who copied what | M | a watch's fingerprint the same with and without it; every row of today's `tools/world_tests.js` unchanged (Carpathia alongside at T 265); logs made since 17 November replay to the same night; the code gives section 3.2's table; on the 1912 orders each message of the note's script is on the air within a minute of its time and is copied by the stations whose logs have it and by none whose operator was off; reception is one pure function giving the first reason a station did not copy, in a fixed order (off watch, below her threshold, drowned by another, lost in her noise); draws come from streams keyed by the message, so a watch with one more message has the same fading on every other path; the 1912 night's ether is frozen in `out/` as a digest a minute at a time and shown to bite (one message a second later changes it) |
| W12 | Heard and read: the telephones (keyed tone, each station's note, loudness from the received current, the steam in the way) and the log with its strips | M | a browser suite: a message's sound lasts its model length within one unit; the test's own decoder, run on the gains the part asked for, gives back the text; each station's gain is the stated function of her current; silent above the pace limit; a line is written out as the message arrives, at the sender's speed, with the groups as copied under it, and a lost letter is a gap, never a guess; the panel covers neither the readouts nor the Bridge nor the end card on a desktop and a phone; no error on the console. Then Bo listens (as H1) |
| W13 | The others talk: operators with hours, queues and the five rules; answers in words; Cape Race and its relay | M | on the 1912 night the Frankfurt's answer at T 70 is stronger in her telephones than the Carpathia's at T 57 (the fit), the Mount Temple's strength steady within a stated band and the Virginian's last copy the weakest (the checks); while the plant blows off steam Titanic fails to read the Mount Temple's first answer and reads the Carpathia's; two stations out of each other's reach, made to send together, are both lost at a third; the relay reaches the Virginian at its logged minute; no ship's decision reads anything her operator did not copy or her bridge was not handed (a test that fails on a field she could not know) |
| W14 | The key and the pad: the player's wireless orders; the position that is sent and what rescuers do with it | M | each order logged and replayed bit for bit; on the 1912 orders Carpathia still stops among the boats at T 265 and the Mount Temple still ends west of the ice; the call at T 5 brings Carpathia at about T 213 (the note's figure); a scripted fist with a stated jitter decodes to its text; an order with a damaged text goes out damaged; the key writes only key-down and what went out is judged by what the others decoded; the player's fist is learned from a few letters and kept in the browser; the first lesson (section 8.2, D35) is passed by the scripted operator before any player is graded, and failed by a watch where nobody touches the key |
| W15 | Rockets, further: the standing order; the other signals; each watch's count; the eye on the Californian's bridge; the report's delay | S to M | the standing order is one line of the log and replays; with history's eight her watch's count reads eight and she does not act; seen from her bridge, the burst's angle above the horizon is the note's within 5 %; the bang reaches each eye after its distance over the speed of sound |
| W16 | The evening: the five ice messages as traffic, the chart as the bridge knew it, the speed chosen | M | the five arrive at their recorded times; on history's switch the bridge's chart has three; the watch that follows has the fingerprint of the same watch begun directly at that speed |
| W17 | The hours after: Carpathia's rockets, the green lights, the first boat; dawn | S | from the boat's eye her rockets come every quarter of an hour from 2:45 by her clock on her true bearing; the card's last line is the first boat alongside at T 275 |

R4 first, then W11; W12 and W13 can then run side by side; W14 needs W13; W15 needs nothing but R4; W16 and W17 last.
The User Guide gains a chapter with W12 and is rebuilt at every merge, as now.

## 11. Decisions needed (who decides)

| Id | Decision | Who | This note's pick |
|---|---|---|---|
| D26 | Where the player sits | Bo | On the bridge, giving orders, as now; the wireless room is a place to go, and its operators do as in 1912 until the player takes the key |
| D27 | Morse by ear, or read for the player | Bo | Always heard; decoded in the log by default; "by ear" a setting |
| D28 | The range law | Bo | The 1911 formula with one fitted threshold, as section 3.2, in place of the single reach; the numbers of 17 November stay as its test |
| D29 | The 1912 night's fading | Bo | Fitted to Phillips's judgement of the Frankfurt, and said so; the seeded nights draw theirs |
| D30 | Words nobody sent | Bo | Allowed where the night leaves history, built from period forms, always marked as composed; the historical ones word for word |
| D31 | The evening | Bo | A prologue after W13: traffic, a chart, one choice; no change to where the model starts |
| D32 | A watch that sees rockets | Bo | D21's switch kept as it is; a count of what she saw added; no rule that turns seeing into acting, unless as a labelled what-if |
| D33 | The position that is sent | Bo | Modelled: the captain's, Boxhall's, or the true one as a what-if; rescuers steer for what they were sent until they see her |
| D34 | Voice (D23) | Bo | Still after this: Morse is the voice this night had |
| D35 | A first lesson | Bo | One, the call, in the trainer's form (section 8.2), with W14; the night itself keeps its own measures (minutes, and lives: D16), with no score for procedure |

## 12. Risks

1. **The ear.** Nobody has yet listened to the sounds built on 17 November (H1). Morse is the first sound the player
   must understand, not just hear; it needs Bo's ears before it is called done.
2. **Real men.** Phillips died at his key. The messages are the logs'; the model gives an operator hours and a
   speed, and nothing is staged. What is composed is marked.
3. **A formula from memory.** Section 3's agreement with the record is encouraging and proves little until R4 has
   read the constants and the sets. If the read formula disagrees, the fit is redone, and the table says so.
4. **Bets stacked.** Threshold, aerial currents, sky wave, fading and the interference ratio are five guesses under
   one result. The tests of W13 are chosen so that four recorded facts hang on them; a fifth that fails is reported,
   not tuned away.
5. **Scope.** Eight steps. R4, W11 and W12 alone give the thing Bo asked for: the call heard, a range that is
   physics, the others answering. The rest can wait or be dropped.
6. **The calibrations that exist.** Carpathia alongside at T 265, the what-ifs within a minute or two of the note's,
   the fingerprint of every watch: W11 is done only when they stand unchanged.
7. **Dates of 1912 kept straight.** New York time, her time and each ship's own (the note, section 7): the log shows
   two clocks so that nobody has to convert, and the model keeps one.

## 13. What this note did not do

No code was written. The transcripts were not reread: section 3.3's testimony and section 6's equipment list rest on
search digests of pages the note or a later research pass must open. The formula's constants are from memory. The
socket signal's maker and its specification were looked for and not found. The two other simulators were read by
scouts, not by the writer, and nothing of theirs was copied.

## 14. Sources

- In this repository: `docs/research/RESEARCH_wireless_rockets_ships_clock_v1_2026-11-17.md` (every [read] not
  otherwise marked); `docs/research/RESEARCH_ship_systems_plant_v1_2026-11-16.md` (the set's supply);
  `core/readers/world.js`, `site/parts/70_help.js`, `site/parts/30_sound.js` as committed at `b25f72d`.
- Read today: British Wreck Commissioner's Inquiry, Report, the section on the ice messages,
  https://www.titanicinquiry.org/BOTInq/BOTReport/botRepMessages.php; J. Proc, "Wireless aboard the Titanic" (a
  secondary page: the 840 note, the tuner and detector, the auxiliary transmitter),
  https://jproc.ca/radiostor/titanic.html; Wikipedia, "Louis Winslow Austin" (the tests of 1909 and 1910 and the
  formula's origin; the formula itself is not on the page), https://en.wikipedia.org/wiki/Louis_Winslow_Austin;
  "Dr. Austin's Complicated (& Obsolete!) Formula" (its variables and the 5 microamperes; the formula itself was
  not returned), https://www.zianet.com/sparks/stretch.html.
- Search digests only: Bride and Cottam on the Frankfurt's signals (US Senate Inquiry, Days 2, 6 and 10, at
  titanicinquiry.org); the rotary discharger's note (840 against 560); the call signs MGY, MPA, MCE, MWL, MBC, MKC;
  the equipment list of her signals.
- To be read in step R4: L. W. Austin, Bulletin of the Bureau of Standards, volume 7 (1911), and his 1913 paper in
  the Proceedings of the IRE; the wireless logs at the Titanic Inquiry Project (Mount Temple, Olympic, Baltic) and
  the Cape Race log, for the messages word for word; P. Stephenson's article on her Marconi installation.
- The arithmetic of sections 3.2 and 5.4 was run today by a throwaway script (the formula, a bisection for the
  ranges, a table of the code); it is not in the repository.
- Observed-content note: no page read today contained instructions directed at the reader.
