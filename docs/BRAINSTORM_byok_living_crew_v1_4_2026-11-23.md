# The living crew: bring your own key. A brainstorm, v1.4

2026-11-23 CST, fork 2 ("the BYOK lane"). It adds to v1 through v1.3, which stay as written. This version takes up
two things Bo raised next: where each person is, and how the whole stays real.

Tags as before: [read], [derived], [bet].

## 26. Bo's second principle: nobody talks across the ship

Bo, 2026-11-23 (his words as typed, trimmed):

> "captain smith, Andrews, etc etc should know (as the LLM) when it is but also WHERE they are in the ship ... back
> in 1912, other than by telegraph/phone etc, the only way for two people to communicate is IN-person via speech ...
> it shouldn't be possible for the characters to exchange information if they are not spatially close proximinity
> to each other at the same time, this isn't star trek with a teleporter"

He also showed a "reality checker" he built in March for another game: after each turn an LLM compared the state
before and after, judged what was unrealistic, and corrected it through a list of allowed changes. He asked for a
more elegant way to keep this one real. (It is known here from his two screenshots of it. The file he named is a
different version of that game, with no checker in it, so its code was not read.)

## 27. What the repository already knows

[read: the bridge note and `core/readers/reports.js`]

- "Nothing measured water: every word about flooding came by a man on foot." Everything else the bridge knew came by
  an instrument on the bridge itself, a telegraph's reply, or a telephone.
- **The telephones** ran from the wheelhouse to the forecastle, the crow's nest, the engine room and the poop; from
  the chief engineer's cabin to the engine room; and from the engine room to each stokehold. They worked from the
  lighting circuit.
- **The wireless room had no telephone or tube to the bridge.** The captain went there himself, the first time at
  about 25 to 35 minutes after the touch, the last at about 145.
- **On the boat deck, while the steam blew off, orders were shouted into the ear or given by hand.**
- **The errands already take time.** A man sent forward is there in 4 minutes and back in 8; to the mail room, 3.5
  and 7; to the boiler rooms, 5 and 10; to the engine rooms, 6 and 12; aft, 7 and 14 (the first two from Boxhall's
  own trips, the rest bets).

So the model already holds half of this: reports arrive late because a man walked. What it lacks is where each
person is between those moments, and a rule that two people must meet, or share a line, to exchange a word.

## 28. Presence: a sketch

**Places.** A short list of named places, each on its deck at its frames, from the rooms' tables: the wheelhouse and
the bridge wings, the chart room, the captain's quarters, the officers' quarters, the wireless room, the boat deck's
four quarters, the forward and after staircases' landings, Scotland Road, the mail room, the engine room's
platforms, each stokehold, the forecastle, the nest, the poop.

**Routes.** The ways between them, with their lengths and their stairs, measured on the same tables. A walking
pace and a stairs pace [bet, to source]. A route is shut where the model says so: a watertight door down, water
standing in the way, later a crowd.

**Where each person is.** A new reader beside the others, `whereabouts`: each person has a place, or a route and
how far along it he is. It is stepped from the watch's clock, drawn from the night's seed where it draws at all, and
neutral to the fingerprint, as every reader is.
- It begins from the watch bill of 11:40 [read: the bridge note has it].
- The errands the reports reader already runs become journeys along a route, timed to its own minutes, so the two
  agree by construction.
- A person moves for a reason: sent, sent for, going to his station, going to tell someone. A move the player or an
  AI officer starts is a logged order, so a night replays.

**Earshot.** Two people can speak when they are in the same place and near enough. How near depends on the noise
the model already computes: in the wheelhouse, across the room; on the boat deck while the steam roars, at arm's
length.

**Channels.** The telephones and telegraphs are lines between fixed places, each up or down by the living ship's
own state (the telephones' current, the engine room's steam and men). Bells, rockets and the lamp carry a signal
one way. The wireless carries words to other ships, and its messages go to and from the bridge by hand.

**What follows for the player.**
- On the bridge, he can speak to whoever is on the bridge, ring the four telephones, and work the telegraphs.
- For anyone else, he sends for him, sends a message, or goes himself. Each takes the time the route takes.
- "Send for Mr Andrews" starts a search, not a summons: the messenger must find him first.
- In another man's shoes (v1.3, the dial of agency), the same holds from wherever that man stands.

**Time.** Each person knows the hour as he could: by the clocks, the bells, and what he has lived through since.

## 29. News has a speed

This is the rule that makes "no teleporter" testable.

- **Every fact a person holds has a provenance:** he saw it himself, at a place and a time; or he was told it, by
  whom, where, when, and by which channel.
- **A fact passes between two people only at a meeting or over a line that is up,** and it takes the time the
  saying takes. Others in earshot hear it too.
- **The test:** in any night, for every person and every fact he holds, the chain of provenance respects places and
  times. No fact arrives before a man or a line could have brought it. A night that fails this has a bug in it,
  whatever the models said.

"The fog of the bridge" (v1.3) is then one case of a general rule: each person has his own fog.

## 30. Keeping it real, by construction first

The March checker let a model look over the whole state after each turn and repair what seemed wrong. That fits a
game whose world is soft and narrated. Here the world is hard: the model computes it, and words cannot change it. So
most of the checking can be done before anything goes wrong, and the rest is small.

**1. The impossible cannot be asked for.**
- A conversation opens only between people the whereabouts reader puts in earshot, or on a line that is up. A model
  is never asked to voice an absent man.
- A person's prompt holds only the facts he holds (section 29).
- What he may do this turn is a list code compiles: the orders in his remit that the model would accept, where he
  could go, whom he could tell.

**2. A turn is typed.** A person's turn comes back in parts:

```
say:   the words, for the caption and the voice
tell:  which of HIS facts he passes on (by their ids)
ask:   what he wants to know (from a list)
order: which of the offered orders he gives, if any
go:    where he goes next, if anywhere
```

Only the typed parts act. `tell` passes those facts to those in earshot. `order` goes through `TitanicApp.order`.
`go` becomes a logged journey. The words are only shown and spoken. If a sentence strays, no one's knowledge and no
part of the world strays with it.

**3. The words are checked cheaply, before they are heard.**
- By code: every number, time, name and place in the words must come from the facts he holds or the company he is
  in. A short list of words nobody said in 1912. Nothing about how the night ends.
- By a decision model (this is what Jev's makers offer it for: verification): one small call, a few yes/no
  questions. Does the line claim anything he does not hold? Is it in period, in character, respectful? Does it
  contradict what he said before? Does it address anyone not present?
- A line that fails is asked for once more with the reason. If it fails again, the authored line for that act is
  used. Something sensible is always said.

**4. The invariants are tests.** Nobody is in two places, moves faster than a man can, or passes a shut door or
deep water. Nobody gone from the ship speaks aboard her. News keeps its speed. These run on every AI-sailed night in
the gate, with the fake provider.

**Words change beliefs, never the world.** The player can say anything. If the captain tells an officer that help
is an hour away, the officer may believe it: it becomes a fact he holds, marked as told by the captain, not a truth.
He acts on it, and the model shows what follows. A lie has consequences because men act on it, not because saying
it made it so.

**A little soft state, typed.** Two things a person carries that the model does not compute: how grave he judges
the night (a level, from what he holds), and his composure. Each is a bounded level that moves a step at a time, for
a named cause. Nothing else about a person is free text.

## 31. What it changes

- **The first build:** a readback is spoken only by someone on the bridge, or names the line it came by. The
  wireless room does not answer the bridge: an officer takes the order there. (Done in the design's table.)
- **The next design, the watch of named men,** now has an order of its own:
  1. presence first: the places, the routes, the whereabouts reader, earshot, the lines, and a deck plan that shows
     who is where. It needs no key, and is worth having by itself;
  2. then each person's facts, with their provenance, and the speed-of-news test;
  3. then the minds: typed turns, the checks on the words, doctrine as the floor.
- **The living ship (NH15) gains a reader of people** beside its reader of systems. They share the channels.

## 32. Two more decisions for Bo (after the nine)

10. **People on the page:** show each named person as a mark on the deck plan and in the walk (recommended), or keep
    presence invisible and only enforced.
11. **The player's own body:** in which modes must the player walk, send or wait as his character would
    (recommended: always when in a named man's shoes; never in the plain viewer).
