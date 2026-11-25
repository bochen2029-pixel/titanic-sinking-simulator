# The living crew: bring your own key. A brainstorm, v1.3

2026-11-23 CST, fork 2 ("the BYOK lane"). It adds to v1, v1.1 and v1.2, which stay as written. Bo shared his
principle (v1.2, section 19) with the coordinator too and invited both sessions to refine it. This version takes the
coordinator's ten refinements into the design, with one change (section 24, the last test).

## 23. The refinements, taken

1. **The fog of the bridge, as a rule with a test.** A persona's context is built only from what reached that person
   at that station by a modelled channel: the reports feed, what the station itself shows (the bridge's clinometer
   and commutator, the telegraph's reply, the wheel's feel), and what was said to him. It is never built from the
   model's internals.
   - The context builder is a pure function with a whitelist of fields.
   - It is tested as the readers' neutrality is: the builder reads no field off its list, and a change the bridge
     cannot know leaves the context's bytes unchanged.
   - This is what "no smartship" means in code. It replaces "the seat" as the rule's name.
2. **The nervous system is the crew's medium.** The living ship (NH15) and the living crew (NH16) are one design.
   Orders and reports travel by her real channels, with their delays and their failures:
   - the engine telegraph is mechanical, but it needs men and steam to answer;
   - the telephones need the lighting circuit or their battery (`sim.reports.phone`);
   - the wireless needs the dynamos, and the Morse lamp its change-over;
   - a messenger takes time by the decks, and the walk knows the distances.

   An order that cannot be delivered gets a reply in character, with the model's own reason: "The engine room does
   not answer, sir."
3. **Two speeds of mind.**
   - Reflex, on the clock: the 37 seconds from the bells to the ice. These are typed decisions, Jev's or doctrine's,
     and never wait on a long reply.
   - Deliberation: Smith after Andrews's report, the boats, the call. These are the LLM's.
   - Doctrine is the floor. If no reply comes within a deadline of her own time, the officer does what the 1912
     orders or the engineers' rules would do, and the record says which mind acted. The page may hold its pace
     while an officer thinks, up to a cap.
4. **The few and the many.** The named officers are personas, at the order layer. The stokers, engineers and stewards
   are the model's own crew: the plant's rules today, and the crew as a state in a later epoch (NH15's class C). The
   few command the many only through the model's channels. No persona reaches into the plant.
5. **A dial of agency,** for the player:
   - you command, and they read back and carry out (the first build);
   - they advise when asked, in character, from what they know;
   - they sail her and you watch: a night that plays itself, different each time, and replays from its log with no
     key.

   And a choice of whose shoes: the captain's, the officer of the watch's, or Andrews's on his inspection, walking
   her and reporting to the bridge. Mode J of v1.2 (take a station) is the same dial turned the other way.
6. **The watch bill, by the clock.** Who is where at 11:40 and after, from the repository's research notes: the
   officer of the watch, the junior officer, the men at the wheel and on standby, the lookouts, the captain in his
   cabin; then the designer, the chief engineer, the wireless operators, the officers called to the boats. A persona
   exists only while on duty, or once sent for.
7. **Grounded in testimony, and labelled.** A survivor's persona carries his own words from the inquiries. One who
   died carries others' accounts of him. Every generated line is marked as imagined. The page says "a role-play
   of", never "what he would have done". The guide carries a note on it.
8. **A night the AI crew sails is a counterfactual,** and is labelled as one. The calibration holds the recorded
   orders and doctrine. A set of AI-sailed nights is reported as the gallery reports: "the watch put the helm over in
   17 of 20". The captain's bench (v1, mode I) is that same harness.
9. **The inquiry is the debrief.** After the night, counsel examines the player from the order log, with the
   gallery's counterfactuals as evidence. It is the one place analysis belongs inside the fiction.

## 24. Tests added

- A fake provider that is deterministic, so the gate can run every keyed path with no key and no network.
- Every AI order is valid by the readers' own `valid` and the night's owners, before it is given.
- With each AI order, the tape keeps a hash of the context it was decided from, for audit. It goes in the tape beside
  the watch, not in the model's own log: that log is `core/`'s, and stays as it is (the one change from the
  refinement as offered).
- The 1912 helm convention's table (in the first build's suite already).

## 25. What this settles, and what it leaves

- **Decision 9 (the guide) has a better answer than either offered in v1.2:** analysis inside the fiction lives in
  the inquiry, and outside it in the User Guide. No separate guide is needed. It stays Bo's to decide.
- **Steps 3 and 4 of the first build become one design,** "the watch of named men": the watch bill, the fog of the
  bridge's whitelist, the channels, the two speeds with doctrine as the floor, and the dial of agency. It follows
  the spoken bridge.
