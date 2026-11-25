# Changelog

## 0.3.0 (early access), 2026-11-24

Everything since 0.2.0, the website build of 8 October 2026, released together as early access: playable in its core
loop, unfinished, and still changing. What someone meets:

- **The watch of 14 April 1912.** You stand on her bridge from the lookout's bells, with the wheel, the telegraph, or
  an order typed in words. The ice is a body she can miss, graze or strike, and the contact makes the damage.
- **A night that ends where she breaks.** The flooding model is calibrated against the record of 1912, with a kept
  set of thirty versions that the record allows. It carries her to the moment her hull's loads reach its strength and
  hands her to her fall there: on the recorded orders at about 2:16 am, at about 7 degrees of trim, over boiler room
  2. That is the model's break, not the record's. Accounts of the night and later reconstructions have her break at a
  steeper angle, and the wreck shows that she parted further aft, over boiler room 1, which begins about 5 metres
  from the model's break. The page gives the record's times beside the model's.
- **Her fall to the bed, as a first model.** Her two pieces fall as free bodies, with nothing fitted to the wreck's
  places: the bow comes to rest about 1.6 km from the point under the break, where the wreck's lies 772 m from it.
  The stern does not yet behave as the witnesses saw it: on the page it settles back and is under within a minute of
  the break, nearly level, where they saw it rise and stay afloat for some minutes.
- **Going back.** The page keeps the night as it plays, so you can go back to any minute already played and try
  another way. The gallery sets what-ifs against the recorded night across the kept set.
- **The ship around you.** Her plant (coal, steam, the engines, the dynamos and her lights by circuit, the watertight
  doors, the pumps); the reports that reach the bridge, the boats, the wireless and the other ships; her rooms by
  name, read from Bruce Beveridge's deck plans (see `SOURCES.md`), and who was booked into a first-class stateroom by
  the list of 1912.
- **A crew, if you bring a key (the Windows app only).** The men on the bridge answer in words that a language model
  writes for them, in character, each line marked "imagined"; they are never the men's recorded words. They know only
  what has reached the bridge, and their orders go through the same log as yours, so the physics decides what
  happens. They can be heard, by your PC's own voices or by Deepgram's, and you can speak an order while you hold a
  key. Deepgram's service has been checked with a real key from a test script (every voice answered, and spoken
  orders were heard and read). Inside the app, a real microphone and a real language-model key have not yet been
  tried.
- **The Windows app and the User Guide.** A portable app that calls nobody unless you switch the crew's minds or
  voices on, and a guide of about 80 pages built from the page itself.
- **What it is not.** It is not a record of the night, and it is not finished. The Evidence tab's first section says
  what is computed, what is left out, and where the model and the record differ.

The entries below are the record of how it was built, join by join, newest first.

### After the release (text only: two counts left from October put right), 2026-11-24

The README, the page's head and its Evidence tab, the guide's chapters 1 and 10 and the social image still gave
October's counts: 4,408 columns (the tab said 4,400) and 290 water paths. By `C.buildShip()` and the 1912 preset they
are 4,852 columns, and 485 paths on the 1912 damage: 469 in the undamaged ship, and its sixteen holes. 199 of them are
her windows, her side's openings and the grand staircases' doors and domes, which the sentences now name.

- No code of the model, the page or the app changes. The page's bundles keep their names and their bytes, so the
  program in the released zip is still this repository's. The zip's own copy of the page keeps the old figures in its
  head and its Evidence tab until the next package.
- The social image (`og.png`) is made from the guide's current capture of 2:09 am, with the counts put right. It was
  October's viewer, whose card still said "about 8 sq ft in all".
- User Guide 1.14.1 is edition 1.14 with the two counts put right. No picture was retaken: the page they were taken
  from is the same build.
- The README says that five men answer the captain. It had counted Mr Bell, who cannot be spoken to yet: the engine
  room's telephone is not in the model. It also says where boiler room 1 begins and where the research note centres her
  break, in place of "about 5 metres farther aft". Both were found by a fact check of the public page.
- BACKLOG: NH13's R2 and R3, and section 3, say what was published.
- Left for the next build:
  - the guide's reports table prints "11:60 pm" (`clockAt` in `tools/build_guide.js` rounds the minutes after it has
    taken the hour; the one in `site/app.js` does the same);
  - the boats section's "Still aboard" leaves out the people sitting in boats not yet lowered, 120 of them at 1:05 am on
    the 1912 orders, so its figures sum to 2,081 of her 2,201;
  - a comment in `site/parts/55_girder.js` still says 4,408 columns.

### Join 24 (candidate 2 of 0.3.0: the public words checked, a newcomer's first ten minutes, the bridge's fixes), 2026-11-24

Joined on one branch from main `1d3bf1c` and tested by one full gate, on Bo's standing word: 13:21 to 14:19 CST, 81
of 81 good in 58 min, no table stale and nothing to mend. Before it the kept set's three tables were rerun (strings
and a new field of data under `core/` moved their hash; the gallery took its cards' new words), and the gallery tests'
table was written on purpose, since it prints the cards' words. No default of the model changes.

- **The public words, checked.** An independent reader went through the README, the page's words, the gallery and
  the guide as a sceptical historian of the night would, and listed 38 points: 6 wrong, 13 overstated, 11 unclear, 4
  unsourced and 4 defensible. None needed the physics changed. Each is mended or answered in this candidate.
  - The page and the gallery (the mainline): the Californian card's figures with their sources, and the British
    Court's own words, "not more than eight to ten miles"; the count in the boats with the record beside it; the
    bulkheads-to-B-deck what-if said one way; "by the witnesses' accounts she broke at", where the page had said that
    the witnesses put her break there; the 1912 orders as this model reconstructs them; every row of the observation
    ledger with its source in plain words.
  - `SOURCES.md` checked row by row against the research notes: three wrong attributions mended (Pitman's "2.20
    exactly" is the US inquiry's, Day 4) and a dozen sources added.
  - The bridge (fork 2): lines written by a language model are called so, never the men's "own words". Mr Boxhall and
    Quartermaster Hichens leave the bridge when the model lowers their boats (No. 2 and No. 6), and a question to
    either is answered by a set line saying where he has gone.
  - The README (NH13 and B1+B2): its top says what the simulator is for (the physics and the people of the night,
    each holding the other in check) and what is built and what is not. Its developer half is rewritten short, each
    figure from a tracked table; the old text is kept unchanged as a dated record under `docs/history/`.
  - The model's break is stated where a reader meets it: at about 7 degrees of trim, over boiler room 2, a few metres
    forward of where the wreck parted. Accounts of the night and later reconstructions have her break steeper.
- **Her rooms and the deck plans (D130).** The room tables were read from the deck plans drawn by Bruce Beveridge for
  *Titanic: The Ship Magnificent* (The History Press, 2008), as Encyclopedia Titanica publishes them. Bo ruled that the
  tables stay, with exact credit: under "Her rooms" on the page, in the README, in `SOURCES.md` and in
  `THIRD_PARTY_NOTICES.md`. The site's terms were read on 2026-11-24, and its editor was asked for permission the same
  day; no answer had come when this was written. If the answer is no, the tables come out and that part is rebuilt
  from 1911 and 1912 originals.
- **A newcomer's first ten minutes (Z2), played cold on a desktop and on a phone.** The five worst places a stranger
  was lost are mended: a phone's first screen says "Start"; picking a room brings its card into view; the ice's notice
  gives her opening first, then where to run the clock faster; the walk on a phone names its pad's buttons; the
  gallery's counts use the table's own words ("Breaks in 30 of 30").
- **The page (Z2).** The encounter's verdict is kept from the ice's end, so the end card, the line under the readouts
  and the Run tab agree when she passes the berg again. The end card sets the wreck's places beside the model's only
  on the recorded night. "Restart" on the 1912 damage preset starts from the preset as built, so it keeps her pumps
  and her calibrated list, both of which it lost before.
- **Speaking to the bridge (fork 2).** Bo tried Deepgram on his own key from a test script: the key check, the seven
  voices and the listening passed. One fault was found and mended: a spoken "Hard a-starboard." came back as "Hard. A
  starboard." and gave no order, so heard words are now tried again without the full stops Deepgram puts between
  them. Not yet shown: a real microphone inside the app, the voices played in the app, the crew's minds on a real
  language-model key.
- **The app's self-test** reports its one row that holds a real key in the app's window as "not judged" when the window
  cannot take the keyboard (a locked or busy desktop), instead of failing. With the keyboard it is the check it was;
  in this gate it was judged, and passed. About (F1) says of the 1912 watch that "her watch ends where she breaks".
- **The strength gauge's hover (B1+B2)** says that the 11 to 17 degrees are the published analyses', since no witness
  gave an angle.
- **Corrected from join 22's entry.** In the air-by-space run the stern's least angle comes about 7 seconds after the
  parting (8 after the break), not 9, and the bow is under in about 36 seconds, not 33. Seven figures of the fall and
  her strength in the developer notes (`CLAUDE.md`) were stale as well, and are mended (Z1b's audit against the
  tracked tables).
- **Known, and for after the release** (BACKLOG M8, G34, G35). Her resistance stays the intact ship's while her mass
  takes on the water, so a flooded ship under power is somewhat too fast, and a crushed bow changes neither her
  resistance nor her handling. The model lowers some boats well before the record has them (boat 4 by 47 minutes,
  boat 2 by 39). On the page the stern is under 44 seconds after the break, nearly level, where the witnesses saw it
  rise again and stay afloat for some minutes.
- **User Guide 1.14 (NH13).** It carries this candidate's page: the switch for the crew's minds in its new words, who
  is left on the bridge as the model lowers the boats, the Evidence tab's new strings and plain citations, the wreck's
  places beside the model's on the recorded night only, and the first ten minutes' mends. 85 pages, 49 figures; all 46
  pictures taken from the page were retaken, and 18 changed; the PDF is 6.59 MB of its 8 MB budget; `guide_check`
  passes all 10 checks.
- **Tests.** In the gate: `firstrun_site` 10 rows, `cabins_site` 10, `scrub_site` 19, `gallery_site` 8, `deep_site`
  44, `walk_site` 19, `crew_site` 19, `minds_site` 28, `voice_site` 18, `night_end_site` 17, `evidence_site` 8,
  `girder_site` 22, and the app's self-test 38; headless, `crew_tests` 42, `minds_tests` 77, `minds_part_tests` 70,
  `voice_part_tests` 80 and `ledger_tests` 5 MUST.

### Join 23 (release candidate 1 of 0.3.0, the public early-access release), 2026-11-24

Joined on one branch from main `4274661` and tested by one full gate, on Bo's standing word: 10:26 to 11:27 CST, 81
of 81 good in 61 min, no table stale and nothing to mend. No default of the model changes in this join: the physics
has been frozen since join 22. Before the gate the kept set's three tables were rerun: they carry a hash of every file
of the model, and two things in those files were reworded, two comment lines of the fall's code and the 1912 card's
text. Only that hash moved in them, and the Californian card's words. A first run of the gate was cut short at 09:02,
when the app that had started it was restarted: 51 of its 81 suites had passed, and no suite after that could start.
That run is void; the gate was run again in full on the same tree.

After the guide's merge the settling run found the build, the package and the guide's check good. The app's self-test
passed 37 of its 38 rows. The one that holds a real key in the app's window could not be judged: the laptop was
soft-locked while its owner was away, so the app's window could not take the keyboard, and the page lets the key go
when its window loses the focus, as designed. That row passed in the full gate, on the same build, with the desktop
unlocked. The next candidate makes the row say "not judged" on a locked desktop instead of failing.

- **The version is 0.3.0 (D119).** The public repository has stood at 0.2.0, the website build of 8 October 2026;
  everything since is released together as 0.3.0, early access. The app's About, the zip's name and the release's
  tag agree. This changelog now has one heading for 0.3.0 with a short summary, and the entries of the joins stand
  under it as the record, their text unchanged.
- **A newcomer's first minute (Z2).** The page was played cold, as someone who followed a link would, on a desktop
  (1366 by 768) and on a phone upright (390 by 844). The five worst places a stranger was lost are mended.
  - "Start here" heads the Run tab while no watch is open: "Take the watch", "Watch the 1912 orders", and the Evidence
    tab for what this is and is not.
  - Time (the pace, Pause, Restart and the bar that goes back) now stands above the watch, in the panel's first
    screenful. Before, it was at the bottom of a long tab, so after the ice nothing within reach said how to see her
    end.
  - When she is holed and the clock is still at her own pace, the ice's notice says to run the clock faster.
  - Going back no longer says an old report to the bridge again as news.
  - The footer carries the mark "Early access, a work in progress", with the User Guide, "Report a fault" and the
    source.
  - Played from the bells to her end and through her fall there was no console error on either size, and about 60
    frames a second with a software renderer (51 to 53 for two seconds as she breaks). A real laptop's graphics will
    differ.
- **The words, read as a historian would (the mainline).**
  - On the 1912 watch the "She broke" card now says that its time is the model's, and gives the record's beside it:
    the witnesses put her break between about 2:15 and 2:19 am, and she was gone at 2:20 am.
  - The Evidence tab opens with "What this is, and what it is not": early access; what is computed and set against the
    record; not a record of the night; the crew's words written by a language model, in character, and not their
    words; the break modelled as the moment her strength is reached, not the tearing; not affiliated with any other
    Titanic project.
  - "How it works" and "What it leaves out" are brought up to date. The model is calibrated by a history match, so
    its timeline table is not a blind prediction, and the tab says which rows helped fit it. What is still left out:
    the tearing itself, air trapped while she floats, and the cause of the late list to port.
  - `SOURCES.md`, new, lists every source with what was taken from it.
  - The Californian card names its distance's source: 18 nautical miles is the 1992 reappraisal's; the British Court
    of 1912 found about 9.
- **The public README, the notices and the address (NH13).**
  - The README opens for a stranger: what it is, that it is early access, where to play, the Windows app and how to
    run it unsigned, the first minute, the crew's minds and voices with your own key, what is modelled and what is
    not, sources, licence, where to report a fault, and that it is not affiliated. The developer's record follows.
  - `THIRD_PARTY_NOTICES.md`, new: three.js, the fonts and fdlibm in the page; Electron, Chromium and the SDK's
    packages in the app; the terms of the deck plans' tables and of the 1912 first-class list. It travels in the zip.
  - The public page's address is named in one place, `package.json`'s `homepage` (https://bochen.xyz/titanic/). The
    build writes it into the page's head, so a link's preview shows the picture and the address. The headers file
    carries each rule at a domain's root and under `/titanic/`.
  - No folder of this laptop is named in anything that ships or instructs (D123). The tools that need one take it
    from an environment variable or from a file of the machine's own that git ignores.
- **The bridge's first words (fork 2).** The order line opens with one sentence saying what it is and that it needs
  no key and sends nothing, with three orders to try under it; a click writes one into the line and gives nothing.
  The folds for the crew's minds and for Deepgram's voices begin with what a stranger must know before any key goes
  in: optional, off at each start, the key his own and kept on his PC, who is called, and that they bill him.
- **Three stale claims on the page, mended (found by NH13 while preparing the guide).**
  - The 1912 damage card said the opening was "about 8.8 sq ft in all", the figure from before the calibration. It now
    takes the figure from the model: about 10.5 sq ft (0.977 m2).
  - The Evidence tab's section "Cases the fit never saw" claimed too much: since the calibration, each kept version
    of the model had to give the record's outcome in seven of those cases. It is now "Other cases: her sisters, and
    Wilding's what-ifs", and a note under its table says which rows bound the fit and which two did not.
  - "How it works" names the table that is not a blind prediction: the timeline's.
- **The second viewer's tools (U0).** The Blender and Unreal tools call the record's end "the hand-over", not "the
  flag", since a default night now ends where she breaks. Words only.
- **Corrected from join 22's entry.**
  - It said that 6 of the guide's pictures were retaken for edition 1.12. All 46 of the pictures taken from the page
    were retaken, and 6 of them changed.
  - Its line that the stern "settles back toward level ... and then floats" describes the air-by-space model, which
    no run on the page uses. On the page the stern settles back and is under 44 seconds after the break, nearly
    level, and it never stands on end. Neither run shows what the witnesses then saw: the stern rising again and
    staying afloat for some minutes.
- **Known in this candidate, and mended in the next.**
  - "Restart" on the 1912 damage preset rebuilt her without her pumps and with a list of 2 degrees, so a restarted
    preset was not the calibrated run. It has been so since the pumps were added (found by NH13 and Z2 today).
  - An independent reading of the public words, as a sceptical historian of the night would read them, found 38
    points, five of which would draw a correction. Their mends are in the next candidate, with the README's older
    developer half, which still described the model as it was before the break was built.
  - Her rooms were read from Bruce Beveridge's deck plans as Encyclopedia Titanica publishes them. The credit is made
    exact in the next candidate, and Bo is asking the site's editor (BACKLOG G35).
- **User Guide 1.13 (NH13).** It carries this candidate's first minute ("Start here", Time above the watch, the ice's
  notice, the footer's mark, the Evidence tab's new first section, the end card's second line, the order line's first
  sentence and its three orders to try), the version 0.3.0, the public address, and "early access" on its first page.
  - It now describes the calibration as it is: a history match whose kept versions pass the record's tests and sample
    what the record allows. Before, it still said that four numbers were fitted and nothing else was tuned.
  - Mended in it: the other cases' table has the page's ten rows; the coal list is about 1.6 degrees as calibrated,
    not 2; Britannic's preset has no fall to the bed; the break's angle is set against published analyses, not "the
    record"; the deck plans are named by their author.
  - 84 pages, 49 figures; all 46 pictures taken from the page were retaken, and 15 changed; the PDF is 6.45 MB of its
    8 MB budget; `guide_check` passes all 10 checks.
- **Tests.** A new browser suite, `firstrun_site` (7 rows). Its phone row waits for the sheet to stand open before it
  taps: in a pre-check it had tapped into a sheet still sliding open, and missed. `scrub_site` 18 rows, `crew_site`
  19, `minds_part_tests` 69, `voice_part_tests` 78; `night_end_site` 17, `evidence_site` 8, `gallery_site` 7,
  `layout_site` 60 states at six sizes, and the app's self-test 38 rows.

### Join 22 (she parts at the break: the hand-over made consistent; and push to talk), 2026-11-24

Joined on one branch from main `3e2cf1b` and tested by one full gate, on Bo's standing word: 06:55 to 07:46 CST,
80 of 80 good in 51 min, no table stale and nothing to mend. Before it the kept set's three tables were rerun on the
joined code. This is the last change to the model's physics before the public early-access release: from here until
that release only the page, the app and the words change.

- **Corrected from join 21's entry.** It said that in the air-by-space model she parts at the surface in 0 of 30 kept
  members, and called that a finding against the model. The count was taken before the hand-over from the flooding
  model to the fall was made consistent. It was a finding against that hand-over, not against her strength: with the
  four consistencies below as defaults she parts in 30 of 30. The entry's later counts (27 and 28 of 30) were taken
  with some of the four; 30 of 30 is with all of them.
- **The hand-over is now the break's own (D114 to D116; Z1 with B1+B2).** When the watch hands her to the fall at the
  break's onset, the fall now weighs and judges her as the flooding model and the break's check did a moment before.
  Four consistencies are the defaults. Each is the flooding model's or the break check's own load or rule, and none is
  tuned to a result.
  - The joint yields on the break's own two-axis check: the resultant of its bending about both axes, with shear
    (`hinge.yieldOn` 'resultant'). Before, it yielded on bending alone and so started 1.25 % under its own yield.
  - The water in the forepeak tank is weighed (`K.peakTank` 'weighed'): 331 tonnes at her stem, which the flooding
    model and the strength gauge always weighed and the fall did not.
  - Each slice of her hull has its full outline (`K.section` 'full'). The simplified outline, about twelve points a
    side, had put the bow's centre of buoyancy 0.62 m too far forward.
  - In the air-by-space model the windows, doors and side openings still intact at the break give way at their own
    strengths, as they do in the flooding model (`K.weather` 'core').
  - Named at their old values the four give the fall as it was, to the bit. With them the fall's moment at the joint
    is within 0.25 % of the gauge's. Two differences remain and are named, not closed: the fall's added mass by slice
    against the gauge's rigid body, and the fall's sea density by depth against the flooding model's uniform one.
- **What it gives: she parts at the break, in every kept member.**
  - In the air-by-space model 30 of 30 part at the surface, 1.25 to 4.69 seconds after the onset (median 2.06), all by
    shear. In the lumped-air model 30 of 30 part too, at both placements of the air.
  - The margin is thin: every member starts only 0.17 to 0.30 % past its yield. So the model now says the onset is the
    break, and nobody should lean on the seconds.
  - On the landed member the alternative strengths split: as built she parts at +1.34 s; with Britannic's 3/4 inch
    girders at +1.88 s; with Halpern's girders or Stoney's joints she holds (her load peaking at 0.985 and 0.814 of
    her strength). With the parting strains of the riveted joints doubled she holds; halved, she parts at +0.78 s.
  - The bow in the air-by-space model: 110 of its openings give way in the first 40 seconds, it is under 33 seconds
    after the break, and it comes to rest level on the bed.
  - **The stern is open.** After the parting it settles back toward level, as ten witnesses have it (its least angle
    -10 degrees, 9 seconds after), and then floats with its open end at the surface. The record has it under within
    minutes. How it goes down is the next work on the model, after the release (D117): the port and starboard halves
    of the fall's spaces joined as the flooding model joins them, her real ways for air and water, and the bulkheads
    giving way deck by deck at their own strengths.
- **What a player sees: the page's fall is unfitted, on Bo's word.** The fall the page shows is still the two pieces
  cut at the break with lumped air, no joint and nothing fitted. Of the four, the tank and the outline act there.
  - The bow now comes to rest 1,631 m from the point under the break (1,208 m before), because the fall now weighs the
    331 tonnes at her stem. The wreck's bow lies 772 m from that point. The stern rests 51 m from it (44 m before;
    the wreck's stern, 148 m).
  - Bo, 2026-11-24: "Keep it unfitted (my recommendation). The page shows what the model computes." So the distance
    is shown as the model gives it and said to be unfitted; the fit to the surveyed places stays a trial in the
    tests, where its two fitted levers did not move.
  - On the founder-flag what-if the end card's line now reads "3,787 m down, 1.9 km from where she broke" (1.6 km
    before).
- **Push to talk: speaking to the bridge (fork 2; the desktop app alone).** The captain holds Space in the empty
  order line, or the "Hold to speak" button beside it, says an order or a question, and lets go.
  - The sound goes to Deepgram's live listening on the player's own key, the same key as the men's voices. Only
    final words are given, and only through the order line, exactly as typed words are: a spoken night has the typed
    night's log and fingerprint, and no sound and no word is kept anywhere else.
  - It has a switch and a question of its own and is off at every start. The app's shell gives the microphone only
    to its own window and only while that switch is on; the public page never asks for it.
  - Two independent reviews; every finding is mended with a test that fails without the mend.
  - **Nothing of it has run on a real key or a real microphone.** The tests use Chromium's fake microphone and a
    stand-in for Deepgram. Bo tries it with his own key before it is called working.
- **User Guide 1.12 (NH13).** It adds push to talk (chapter 4), with what has not run yet, and her fall with the new
  defaults (chapters 6 and 10): on the 1912 orders the bow rests about 1.6 km from the point under the break and the
  stern about 50 m, against the survey's 772 m and 148 m, and the fall is said to be unfitted. It mends a sign error
  that 1.10 and 1.11 printed: the trial bows land 64 to 176 m beyond the survey's bow, not short of it. 49 figures, 6
  pictures retaken; the PDF is 6.30 MB of its 8 MB budget; `guide_check` passes all 10 checks.
- **Tests.** `fall_trials` 81 MUST, `night_after_tests` 40, `strength_tests` 30, `systems_tests` 44, `export_tests`
  39, `girder_tests` 13, `voice_app_tests` 104 rows, `voice_part_tests` 77, `minds_part_tests` 66. In a browser:
  `deep_site` 43 rows, `night_end_site` 17, `onset_site` 11, `voice_site` 18, `minds_site` 28, `scrub_site` 17, `crew_site` 17, and the
  app's self-test 38 rows.

### Join 21 (the stern's join: what parts her, and the engineers' doors), 2026-11-24

Joined on one branch from main `9ec05af` and tested by one full gate, on Bo's standing word: 04:58 to 05:52 CST, 80
of 80 good in 54 min, no table stale and nothing to mend. Before it the fall's table was regenerated on the merged
code (two branches had each written it), the kept set's three tables were rerun, and three tables that print the
founder-flag what-if's fingerprint were written: the engineers' doors move its last minutes.

- **Corrected from join 20's entry.** It said that across the kept set she parts at the surface in 23 of 30, and that
  every release is by shear. Neither stands as written.
  - The 23 of 30 was a placeholder's doing. In the fall's lumped-air model each piece's air drains through a stand-in
    vent from the moment of the break, and that loss of buoyancy is what swung her to her strength about 23 seconds
    later. With the vent shut she does not part (Z1's e122).
  - So the joint is now judged in the air-by-space model across the kept set (D113). There she parts at the surface
    in 0 of 30: the load at the joint peaks at 0.953 to 0.975 of her strength (B1+B2). The record has her parting at
    the surface, so this is a finding against the model, and it is not tuned away.
  - "Every release is by shear" holds only in the lumped-air model. In the air-by-space model one alternative
    strength, Britannic's 3/4 inch girders, parts her by tension.
- **Why she holds: two inconsistencies at the hand-over, both found and both mended as what-ifs (D114, Z1).**
  - The break's onset is declared on moment and shear together, which fires at 0.9875 of her bending strength; the
    joint's hinge yielded on bending alone, so it started 1.25 % under its own yield. `hinge.yieldOn` 'circle' makes
    it yield on the onset's own rule.
  - The fall did not weigh the water in the forepeak tank: 331 tonnes at the very bow, 131 m forward of the break,
    which the flooding model and the strength gauge both weigh. `K.peakTank` 'weighed' weighs it. That was 2.1 % of
    the joint's bending moment.
  - With both, the landed member parts within seconds of the onset in the air-by-space model. The margin is thin
    (0.33 % of the yield at the hand-over) and a residual of 0.35 % is not yet located, so nobody leans on the time.
    Both switches are off by default in this join and become defaults together in the next, with the fall's fitted
    levers refitted and the kept set counted again.
  - Found while this join was in its gate, for the next one: with both on, 27 of 30 kept members part within 7.5
    seconds. The last 0.35 % was the fall's hull outline, simplified to about 12 points a side; at full resolution
    the fall's bending moment at the hand-over matches the gauge to 0.014 %, and 28 of 30 part. And with the fall
    opening the windows and doors still intact at the break, as the flooding model does before it, the bow is under in
    33 seconds and comes to rest level on the bed, where today it hangs at 48 m. The break's own check stays as it is:
    it is already the two-axis check, with her sideways strength taken as her vertical (B1+B2's e124).
- **The joint from the break's onset, as a what-if (B4's gates 1, 2 and 5; Z1 with B1+B2).** The pieces can be joined
  at the onset's own station (`K0.jointOnset`, off by default). The hinge's time step is mended: its moment was frozen
  at the start of each sub-step, which pumped an elastic mode and released the joint 8 seconds early; the release now
  converges as the step is refined. No default run uses the joint, so no watch, page or fingerprint moves.
- **The engineers raise the after doors (D112, the mainline).** On the 1912 night the record has the engineers raising
  eight watertight doors by hand: four from 30 minutes after the collision, to reach the pumps and valves, and four
  more at about 62 minutes, to fetch a suction pipe. The model now does the same, as the engineers' own rule and not a
  bridge order. The night is the same to the bit up to the break, because the doors are raised into dry rooms; at the
  break six stand open, each with its float armed. The Systems tab says so, with the record's source. Only the
  founder-flag what-if moves, in its last minutes; every kept member's founder time is the same.
- **The scrubber on a preset (G32, Z2).** A change made by hand after going back (a hole, an opening closed, a door,
  the fires) now drops the later kept minutes, once, and says so. Going back across the loss of the main dynamos no
  longer announces it again.
- **Names on the room's card (Z2, on NH2's list).** A room's card shows who was booked there in the first-class list
  of 1912, as the list prints them, with its caveat: booked before she sailed, never who was there that night. Typing
  a name finds the room.
- **The other ships' places (the mainline, on G26's table).** The wireless room and the rocket socket stand where the
  places table puts them; no figure of the 1912 night moves.
- **User Guide 1.11 (NH13).** It adds the engineers' doors (chapter 8), the scrubber on a preset and the list of who
  was booked in a room (chapter 7), and mends a sentence of 1.10: a hole made after going back drops only the minutes
  kept after it. The joint between the pieces is described as a what-if no default run uses, with no time given for
  her parting. 49 figures, 10 pictures retaken; the PDF is 6.28 MB of its 8 MB budget; `guide_check` passes all 10
  checks. Its page range rises to 24 to 96.
- **Tests.** `fall_trials` 74 MUST, `night_after_tests` 40, `strength_tests` 30, `girder_tests` 13, `systems_tests`
  44, `world_tests` 22, `carpathia_tests` 16, `gallery_tests` 15, `export_tests` 39. In a browser: `scrub_site` 17
  rows, `cabins_site` 8, the brush's suite 7, `systems_site` 20, `night_site` 19, and the app's self-test 31 rows.

### Join 20 (scrub the night, hear the bridge, punch a hole on a watch), 2026-11-24

Joined on one branch from main `9db7fe3` and tested by one full gate, on Bo's standing word: 02:18 to 03:07 CST, 80
of 80 good in 50 min, no table stale and nothing to mend. NH13, checking the guide against that build, then found
three faults where the scrubber and the hole brush meet: on a watch a hole's x closed it without logging; a watch
with a hole still showed the kept set's bands; a hole made after scrubbing back kept the later minutes. All three
were mended, `dist/` was built once more and the 15 suites the mends touch were rerun: 14 passed, and one row of the
scrubber's suite failed once and passed when run again alone. That row compared notices whose timing is not the
model's (an older part's wall-clock throttle); it now holds only what is the model's.

- **Scrub the night (NH4, Z2).** The page keeps the whole run every minute of her time and can go back to any kept
  minute. The Run tab's Time section has a bar under the pace: drag it, or press "," and "." (a minute; with Shift,
  ten). The night is paused there. Play on and it runs exactly as it did: the same fingerprint, the director's cuts
  step for step, the same notices. Give an order and it goes your new way; the later orders and the minutes kept
  after it are dropped, and the page says so once. On a phone it keeps every fifth minute. Her fall is not kept.
  Keeping a whole night costs about 50 MB of memory.
- **Hear the bridge (fork 2).** Each line a man says on the bridge can be spoken. Off by default.
  - With no key and no network: this PC's own voices, local English ones only, British first. It works in the app
    and on the page.
  - In the desktop app, with the player's own Deepgram key: a voice for each of the seven men who can speak on the
    bridge. One host, off at every start, a limit of characters a run, and the app asks the player before it goes on,
    as it does for the crew's minds. Nothing has run on a real Deepgram key yet.
  - Only a named man's line is spoken: never the captain's own, never a notice. The voices hush where the watch ends.
  - Push to talk (the bridge's ears) is not in this join.
  - The keys are now kept by the key store's asynchronous calls (`app/keystore.js`), each sealed with what it is for.
    Three faults on main since join 18 are mended with it: the model list shown by "Try it" could show pieces of the
    key; a key could be saved while the app's own question was open; a custom server's key was tied to its address
    only by the settings file.
- **Punch a hole on a watch (G27, the mainline; Bo's wish).** The damage brush now works on a watch. The hole is an
  order of its own type in the watch's log, so it is forecast and replays from the night's link to the bit. It is no
  man's order: it does not take the watch over, and the crew are not told of it. They learn of the water as they
  learned of the ice's, by their own reports: on a night holed in boiler room 3, the chief engineer's messenger
  brings "Boiler room 3 flooded; its men have left". "Remove all openings" works only on a preset.
- **The people in her staterooms (NH2's session; Bo's yes).** The first-class passenger list of 1912 with cabins set
  against the names (the proof found on steward Herbert Cave), transcribed from the Nova Scotia Archives' scan: 158
  lines and 223 names, 140 lines placed on the deck plans' rooms. The rooms library finds a room by a name. The list
  is a proof printed before she sailed: it gives allocations, not where anyone was that night, and it leaves out 84
  who sailed. No part of the page shows the names yet.
- **Her named places, and the walk between two (G26, NH2's session).** `core/readers/places.js`: 19 places, each
  sourced and tagged (the bridge and its wing cabs, the wheelhouse, the wireless room, the crow's nest, the
  stokeholds and others), and the distance between any two along her decks and stairs. It is for the crew: who is
  within earshot of whom, and how far a man goes to bring a report. Nothing reads it yet.
- **The stern's hang, mended (G30, Z1).** In the fall's air-by-space what-if, a flow safeguard starved the spaces the
  sea feeds. `K.limiter` 'held' is now the default under that what-if (D108), with the old rule kept by name to the
  bit. With it the stern from the break is wholly under in 3.15 minutes when the hull by the cut is opened, inside
  the witnesses' 20 seconds to 5 minutes. The fall's default engine never read the safeguard: no watch, page or
  fingerprint moves.
  - Also what-ifs under the spaces: `K.failOnce` (a space may give way again at another boundary) and `K.floats`
    (the watertight doors' floats work during the fall, as they do in the flooding model).
- **The record, re-read.**
  - The break's own time is judged on the witnesses: T 155 to 159.7 (about 2:15 to 2:19:40), on the ruling of the
    record's owner. B1+B2 states the conflict: both of the model's onsets now fall inside the band (the preset's
    159.41 moves from out to in). Only the band moved, on the sources; no calibration moves.
  - The after watertight doors (G31; e120): the record's schedule, run as logged orders with the floats as modelled,
    is the same night to the bit up to the break. At the break six doors stand open into dry rooms, each with its
    float armed. With the floats working in the fall (e121) five of them shut within 80 seconds and the stern is
    still afloat ten minutes on: the doors are not her way down; the break's damage is. The schedule becomes the
    1912 night's default, as an engineers' rule, in the join after this one (D112; its design is in this join).
- **Corrected from join 19's entry.** It said two of the ligament's what-ifs flip the joint's release to tension. That
  was the time-step fault's doing (G29). On the mended step, which is on its own branch for the next join, every
  release is by shear; at Stoney's period strengths and at doubled parting strains the joint never yields and the
  pieces reach the bed joined. Across the kept set she parts at the surface in 23 of 30 and sinks joined in 7.
- **One body from the ice to the bed (NH8): design v1 and v1.1 (docs only).** What decides whether she parts at the
  surface is the hand-over between two models, so the design carries her as one body from the collision. Its first
  stage, a measurement that moves nothing, is next.
- **User Guide 1.10 (NH13).** 80 pages and 49 figures, 10 pictures retaken. It adds the scrubber (a bar under the
  pace; "," and "."), the men's voices (this PC's own with no key; Deepgram's in the app with your own key; off at every
  start) and the damage brush on a watch (logged, replayed, reaching the crew only through their reports). The PDF is
  6.27 MB of its 8 MB budget and the pictures 5.46 MB of 6; `guide_check` passes all 10 checks. It is at the top of
  its page range (24 to 80): the next edition raises the range or cuts.
- **Tests.** `fall_trials` 66 MUST, `night_after_tests` 38, `strength_tests` 30, `systems_tests` 43, `night_tests`
  17, `reports_tests` 17, `carpathia_tests` 16, `gallery_tests` 15, `export_tests` 39, `occupants_tests` 4,
  `places_tests` 4, `minds_tests` 72 rows, `minds_part_tests` 66, `minds_app_tests` 68, `voice_part_tests` 43,
  `voice_app_tests` 49. In a browser: `scrub_site` 15 rows, the brush's suite 7, `voice_site` 18, `night_site` 19,
  `director_site` 16, `layout_site` 60 states at six sizes with no fault, and the app's self-test 31 rows.

### Join 19 (the watch ends where she breaks: G12's cascade), 2026-11-24

Joined on one branch from main `5e12900` and tested by one full gate, on Bo's standing word: 00:14 to 01:06 CST, 66
of 73 good in 52 min. Three rows failed, each a suite's own row left from the old ending and none the model's: the
export's record, the kept-set suite's reference watch and a bound in the rooms' browser suite. All three were mended.
Four tables were stale as meant. Three late pieces were then merged (the export, the girder gauge's words, fork 2's
review fix), `dist/` was built once, and the 19 suites those changes touch were rerun on it: 19 of 19.

- **The 1912 watch ends where she breaks (G12 and G19; D98, Bo: "Yes, option (a)").** A watch now hands her to the
  fall at the break's onset, the first step where her girder's moment or shear reaches her strength, in place of the
  core's founder flag. On the landed member that is T 156.46 (2:16:28 am), at x -10.9 m in boiler room 2, 7.0 minutes
  before the flag.
  - **Why.** Handed over at the flag she was still rolled 80 degrees to port, and her bow came to rest upside down,
    where the wreck's lies upright. Handed over at the onset, both pieces land upright: in 30 of 30 members of the
    kept set, five ways each, with the air where it lay at the hand-over (e117).
  - **What the player sees.** After the ice the forecast reads "Breaks at", the pill "Breaking" and the end card "She
    broke". Her fall begins on the next step, and both pieces come to rest upright on the bed (the bow 1,208 m out,
    the stern 44 m). The stern burns its lights 6.5 s longer than the bow. The director brings her last minutes in by
    the onset check's own ratio (0.8 of it [appearance], 152 s before the break on the 1912 watch) and has a cut for
    the break itself. The words about a bow lying upside down no longer show on a default watch.
  - **The flag is the named what-if.** `handover=flag` in the address, `handover: 'flag'` in `Night.create`, is the
    watch before the cascade to the bit: fingerprint 48b71712 at step 39,473, T 163.47. An old link's
    `handover=onset` gives the default, and a flag watch's share link carries `handover=flag`. A watch that finds no
    onset still ends at its flag. Presets stay on the flag.
  - **Nothing fitted moved.** The history match, the kept set and its bands name the flag hand-over (step 0, join 17),
    so the calibration, the validation and the ensemble's table stand.
  - **What moved with the watch's end** (member C): the watch's fingerprint is 0ae90224 at step 37,792; the plant has
    pumped 874.0 m3 by her end (910.2 to the flag); the wreck's place by the world reader moved 74 m; the wireless
    falls silent at the hand-over; "She disappears" comes at T 156.46 against the record's 160.
  - **The boats, refitted at the hand-over.** `core/readers/people.js`'s fit had stood off its best since stage D
    (U0's finding). It is now { kLo 0.000603, kHi 0.08, pace 8 }: 11 of the 18 boats away within ten minutes of the
    record, 677 in the eighteen against the record's 671. Collapsible A gets away; B is lost with her at the
    hand-over.
- **The Carpathia question, to the break (evaluation 4;
  `docs/research/RESULT_carpathia_search_v5_2026-11-23.md`).** A night is now scored to its hand-over. The best orders
  found keep her whole 4.8 minutes longer: she breaks at T+161.23 against T+156.46. That is 32.7 minutes short of the
  nearest target, and past no target on any of the 79 models in the kept set's band. The search's progress name now
  hashes the onset check's three files too.
- **The fall from the onset (Z1).** A hand-over at the onset takes the air where it lay (`K0.airAtBreak` 'flag'); the
  flag what-if keeps 'centre'. `fall_trials` holds the onset watch's own fall and G12's two onset rows as MUSTs, and
  `night_after_tests` runs one hand-over for either rule.
- **Her strength's suites (B1+B2).**
  - `girder_tests` and `strength_tests` open a flag watch where they read her founder, and the default watch's onset
    is the hand-over's own step.
  - Mended, a fault since stage D: `strength_tests` section 9's "ends off" onsets had read the default ship, which has
    her ends. With her ends really off the preset's onset is T 139.72 (it printed 159.41) and the watch's 136.71, at
    the same station.
  - `tools/joint_kept.js` (a sweep) runs the joint from each kept member's onset: it lets go in 30 of 30, all by
    shear. Its times and angles are NOT settled: after this join's branches were cut, Z1 found the release is not
    converged in the fall's sub-step (15.0 s at the default against about 23 s as the sub-step is refined). The count
    stands; the table is rerun when the joint's step is mended, before the joint becomes a default.
  - The side shell's parting strain is an option of the section's hinge (`opts.parting`), neutral when not asked.
    Two of the ligament's what-ifs flip the release to tension and one never lets go: the sense at release is a model
    choice inside the sources' range, and is reported as k of N, never picked.
  - Three notes on the after bulkheads' heads (v1 to v1.2, with e118): the heads at which each of bulkheads K to O
    starts to give way, from Wilding's scantlings and Lloyd's table, compared with Wood's yield-line and Greenspon's
    rupture formulas, the arithmetic certified by Abacus.
- **The page (Z2).**
  - Fixed, G28: on a large stage the end card no longer needs to scroll. The fit pass widens a scrolling overlay in
    the stack on a stage of 1280 x 900 px and up; `layout_site` holds it.
  - The strength gauge's own words follow the run. On a watch that breaks, the line under it says she is handed to the
    fall there and her pieces part at that station; on a preset it says nothing parts her now. It had said "Nothing
    breaks in this model yet" (B1+B2; found by NH13).
  - Every browser suite that waited for her founder on a watch now either reads her end as the player sees it (at the
    onset) or opens its watch with `handover=flag`, by the rule of the cascade's plan
    (`docs/DESIGN_G12_the_way_up_at_the_flag_v1_2_2026-11-23.md`): 13 suites.
- **G24's remainder (U0).** Every `C.halfBreadth` call in `core/` without the ship's hull is now held below 11.0 m by
  a test, or passes the hull (`tools/g24_callers_tests.js`, the gate's row `g24_callers`).
  - The boats' stations stand on her hull with her ends: 16 of 20 move out, by 0.369 m at most. No fingerprint moves.
  - `seaHeads`' outward normals take the ship's own hull. No watch's bits move; only a hole made by hand above
    11.0 m at her ends gets a normal 0.39 degrees different.
  - Left, by the mainline's word: Britannic's open ports (9 of 27 up to 1.04 m inside her hull). Moving them moves a
    validation case, so it waits for the next refit.
- **Her rooms as the flooding network, stage 1 (NH6).** `core/readers/roomnet.js`, a library that feeds nothing back:
  it fills each space's rooms from the bottom by the deck plans' own doors, stairs, casings and hatches (1,443 rooms,
  2,245 openings), where `rooms.js` treats each deck as open floor. Ten of the record's room-level sightings are read
  against it as CHECK rows: 6 in, and the 4 out all say the model floods the forward holds' upper decks late. Nothing
  is tuned to them and no part of the page reads it yet.
- **Her vents, as a sourced table (for NH7).** `data/vents_1912.json`: 35 rows (9 read, 13 derived, 13 bets), each
  with what closes it, and 17 with the head at which the closure gives way. The Shipbuilder of 1911 was read directly
  for the engine rooms' fans, the after hatchways and the accommodation's fans. Nothing in the model reads it yet.
- **NH7, air in every space: design v1 (docs only).** Written before the limiter finding below; its v1.1 follows.
- **Found tonight, for the next join.** The stern's long hang after the break in the air-by-space what-if was not
  missing vents. It was a flow safeguard in `core/readers/spaces.js` that starved spaces the sea feeds (the outside
  stern study's finding, confirmed and widened by Z1). With the mend the stern from the break is wholly under in 3.15
  minutes, inside the witnesses' 20 seconds to 5 minutes. The mend is a what-if on its own branch, for join 20.
- **Ask the bridge (fork 2).**
  - A measure a man says with its unit (feet of water, degrees of list, boats away) is held to that measure in what
    he was told. "There are 6 feet of water in boiler room 4", said of a dry room, no longer passes. An independent
    review of that check then found it struck out good lines too ("Five of the twenty boats are away"); that is
    fixed in this join, with the reviewer's lines as rows.
  - The order line and the crew's minds each have a keeper for the page's coming scrubber (NH4): a night taken back
    asks no language model for anything, and a line already given is shown again, never written again. Until the
    scrubber lands they do nothing.
- **Five headless suites name the flag watch.** `cabins_tests`, `rooms_tests`, `nerves_tests`, `circuits_tests` (the
  mainline) and `roomnet_tests` (found at the join) ran the 1912 watch "until she founders", which never comes past
  the hand-over. Each opens that watch with `handover: 'flag'` and tests what it tested. The gate found two more
  rows of the kind, both mended: the kept-set suite's reference watch, and a bound in the rooms' browser suite (83 of
  250 deck sections are wet at the break, 202 at the flag).
- **The export (U0).** The recorded night (`tools/record_night.js`, version 2) ends at the watch's hand-over, as the
  page's watch does, and says which it was (`end.handover`, `end.over`, `end.tOver`). `--fall` records the night's own
  fall from the break, and `--flag` the what-if handed over at the founder flag, the record before to the bit. The
  manifest moved with it: 37,793 samples to the hand-over (39,474 to the flag); 72 sections' fuses blown by then (173
  by the flag). Not run on the new record: the Blender suites, which are outside the gate.
- **User Guide 1.9 (NH13).** 77 pages and 49 figures, 33 of them retaken from this join's page. It tells the watch
  that ends where she breaks ("She broke at 2:16 am, 2 h 36 min after she touched the ice"), keeps "founders" for the
  presets and the founder hand-over as the what-if, gives the kept set's band for the break, and puts the Carpathia
  question on RESULT v5. Four older faults in its text are mended. The PDF is 6.23 MB of its 8 MB budget and the
  pictures 5.45 MB of 6; `guide_check` passes all 10 checks.
- **Tests.** `fall_trials` 57 MUST, `night_after_tests` 38, `strength_tests` 30, `girder_tests` 13, `systems_tests`
  43, `world_tests` 22, `reports_tests` 15, `people_tests` 14, `carpathia_tests` 16, `gallery_tests` 15,
  `ensemble_tests` 4, `export_tests` 39, `g24_callers` 7, `roomnet_tests` 6, `vents_table_tests` 6, `minds_tests` 72
  rows, `minds_part_tests` 66. In a browser: `night_site` 19 rows, `onset_site` 11, `deep_site` 43, `director_site`
  16, `night_end_site` 17, `systems_site` 20, `girder_site` 22, `cabins_site` 7, `layout_site` 60 states at six sizes
  with no fault, and the app's self-test 26 rows.

### Join 18 (ask the bridge: the crew's own words, with the player's own key), 2026-11-23

Joined on one branch from main `5eef014` and tested by one full gate, on Bo's standing word: 19:16 to 20:06 CST, 70 of
70 good in 50 min, no table stale and nothing to mend. Fork 2's second review then brought one more commit, and the
ten suites it touches were rerun on the merged tree: 10 of 10.

- **Ask the bridge (NH16's step 2, fork 2).** In the desktop app, on a watch, a man on the bridge answers the captain
  in his own words. The words are written by a language model that the player chooses and pays for with their own
  key.
  - **Off by default.** With no key and the switch off, the app and the page are join 17's: no request is made, and
    the 1912 watch in the app has the model's own fingerprint. Every run of the app starts with the switch off; the
    key and the settings are kept.
  - **To try it:** in `Titanic.exe`, on the Run tab's watch of 14 April 1912, open the folded line "The crew's minds"
    under the order line. Choose the provider, paste the key into its field and save it, tick the switch and confirm
    in the app's own message box. Then type a question on the order line: "Mr Murdoch, what speed are we making?"
  - **The fog of the bridge.** A man knows only what reached the bridge. One function reads the model's state, and
    only by a list of what the bridge was told or could see. Hidden changes (the water, the plant, other ships, the
    forecast, the boats' counts) reach no man's request, and a suite holds that.
  - **Orders stay the watch's own.** If a man gives or offers an order, it goes through the same order log as the
    wheel's, so a night with the crew's minds replays from its link with no key.
  - **Nothing speaks as the ship (D96).** Every generated line is a named man's and carries the visible mark
    "imagined". A man who would name a figure, a time, a ship or a person the bridge has not been told of is struck
    out, and says "I couldn't say, sir."
  - **The bridge speaks.** A report that reaches the bridge is given unasked, in the words of the man who brings it.
    On by default once the crew's minds are on (Bo); at most one line in half a minute of her time, and none above
    four times her pace.
  - **The key and the network.** The window gets one frozen object with seven calls. Only the app's main process
    calls out, only while the switch is on, and only to the provider that is set (https, or http to this PC for a
    local model; no redirect followed). The key is kept encrypted by the system's key store and given back by no
    call. Turning it on, changing the provider while on, or raising a limit asks the player in a system message box.
    A run is capped at 200 questions and 300,000 tokens unless raised.
  - **Providers.** Claude through Anthropic's own SDK (Opus 5.5 by default; Sonnet 5.5, Haiku 5.5 and Fable 5.2
    offered), OpenAI, Gemini, Cerebras, LM Studio or Ollama on this PC, or another server that speaks chat
    completions.
  - **Honest limits.** Nothing has run on a real key yet, so answer time and cost are unmeasured. Late in the night
    most officers have gone to the boats, and only Mr Boxhall is left on the bridge to answer.
  - **Reviews.** An independent review of the page's side found one leak through the fog (the plant's hidden state
    reaching the officers through the wireless room's log) and a dozen lesser faults: all fixed, each with a row.
    A second independent review found no leak through the fog and no way round the app's question; its two serious
    faults (a bare "yes" giving another man's offered order; a man's own card time failing the check) and seven
    lesser ones are fixed. On its own lines, good answers wrongly struck out fell from 23 of 337 to 2, and bad answers
    let through from 46 of 85 to 14. The coordinator checked the Claude adapter against Anthropic's API reference, and the key handling and
    the network guard, before the merge.
  - **Tests.** `minds_tests` 71 rows, `minds_part_tests` 49, `minds_app_tests` 52, `minds_site` 28, the app's
    self-test 26. A fake provider on this PC serves the gate: it needs no key and no network.
- **The app's first runtime dependency.** `@anthropic-ai/sdk` 1.13.0, pinned exactly. A checkout needs `npm install
  --omit=dev --ignore-scripts` once before packaging (eight packages, about 19 MB; Bo's word, 2026-11-23). The
  packager refuses unless they are installed as pinned, and downloads nothing itself.
- **User Guide 1.8 (NH13).** 76 pages, 49 figures; `guide_check` passes all 10 checks. New: "Ask the bridge" in the
  desktop app, and the app's note now says it connects to nothing unless the player switches that on. One new picture:
  the crew's minds' settings as the app shows them on its first start (off, no key). 5.41 MB of pictures and a 6.17
  MB PDF, inside the budgets.
- **The gate.** 70 suites. Five more browser suites run two at a time: `nerves_site`, `gallery_site`, `cabins_site`,
  `evidence_site` and `crew_site` each gave their lone output when run beside another.
- **CLAUDE.md.** The desktop app's rule (one channel to the page; who may call out), the crew's minds in the app, ask
  the bridge on the page, the commands, the npm step.

### Join 17 (User Guide 1.7; the ports on the lighting circuits; the order line; the bow's honest line), 2026-11-23

Joined on one branch from main `f3b2373` and tested by one full gate, on Bo's standing word: 16:08 to 16:59 CST, 64 of
66 good in 51 min. The two others were settled:
- `history_match`, a new row, failed on its verdict line only. Its 47 rows passed, but its last line was not in the
  gate's form. The line was mended and the row rerun: PASS.
- `layout_site` passed with no fault in 60 states at 6 sizes, and its table moved by one note: on the widest desktop
  the Foundered card now scrolls once she is at rest on a watch. D98's words make the card a line taller there.
  Meant, and written.

User Guide 1.7 was then built on the gated tree, since its build hashes every input whole. A settling run after its
merge (the build check, the packaged app, the app's self-test, the history match, the layout suite and the guide's own
check) passed 6 of 6, 18:41 to 18:53.

- **User Guide 1.7 (NH13).** 73 pages, 48 figures; `guide_check` passes all 10 checks.
  - New: orders to the bridge in words (ch. 04); the Carpathia question on v4, past no target on any of the 79 models
    in the kept set's band (ch. 06); her rooms, with E deck's rooms table drawn (ch. 07); her nervous system (ch. 08);
    the witnesses row by row and the gallery (ch. 09); her as numbers, with two Blender stills (ch. 10); the app's
    note (ch. 02).
  - 45 pictures taken from this join's page, 10 of them new: Bo's six (the wake from above, the night from the
    quarter, the wake in a turn, the wake's lines, the Column view of the deep, the dome) and four panels (her
    nervous system, her rooms, the gallery, the witnesses). Three more are made outside the page and say so.
  - 5.30 MB of pictures and a 6.06 MB PDF, inside D99's budgets.
- **Her ports follow the lighting circuits (D97, Z2), in place of join 16's interim rule.**
  - A port is lit while its section's circuit holds and her dynamos feed it. It goes dark for good when its section's
    fuses blow, when the dynamos stop, or in her fall by its piece's own supply.
  - The sea outside does not put it out. Under the sea a lit port is drawn dimmer and blue-green, and in the Night
    look it glows through the water again [appearance].
  - On the 1912 preset at 2:10 am: 59 sections out; 116 of her 620 ports out, none drawn; 420 lit above the sea; 84
    lit under it. In her fall from the onset the bow is dark from the break, and the stern's ports burn 6.5 s more.
- **The bow's honest line (D98, Z2).** Handed over at the founder, member C's bow comes to rest upside down, where the
  wreck's lies upright. Until the watch hands her over at the break's onset by default (Bo's choice, G12's option (a);
  its own cascade, next), the Foundered card says so, after the bow's line: "The bow rests upside down here: the model
  hands her to the fall on her beam ends at its flag. The wreck lies upright, and handed over where she breaks, both
  pieces land upright."
- **The order line: the spoken bridge's step 1 (NH16, fork 2).** No key and no network.
  - On a watch, the Run tab has a section "Orders to the bridge". An order typed in words ("hard a-starboard", "full
    astern", "close the watertight doors") becomes the same order the wheel, the telegraph or a button gives: logged
    with its step, and replayed by the watch's link.
  - Helm orders follow the 1912 convention by default ("hard a-starboard" turns her head to port), with a switch for
    the modern one. A line is understood whole or not at all, and a question is never guessed into an order.
  - Nothing speaks as the ship (D96): every line is said by someone on the bridge.
  - `crew_tests` 42 rows and `crew_site` 17 rows: the 1912 drill typed gives the clicked night's fingerprint.
  - Two documents came with it: the design for the crew's own words with the player's own key ("ask the bridge", the
    next step) and the sourced facts for the people on her bridge.
- **Her rooms inside the app.** The room lookup's suite now passes 7 of 7 against the packaged app. The part keeps what
  came of its one fetch, since the browser keeps no resource timing for the app's own scheme.
- **G12's step 0 (the mainline).** The harnesses that fit or measure the founder (the history match, the calibration's
  watch, the ensemble's member runs) now ask for the founder hand-over by name, so that the default can change without
  moving the calibration, the kept set or the bands. No bit moves.
- **The gate.** Three new rows: `history_match` (the history match's own tests, 47 rows, about a minute; the mainline's
  ruling now that stage D has landed), `crew` and `crew_site`. 66 suites in all.
- **CLAUDE.md.** The Commands block gains 17 lines for what joins 15 to 17 brought and corrects 4; rules for D97, D98,
  the rooms' fetch, the order line, step 0, and the suites' size pin.
- **The app's window (Bo's question).** A browser suite driven against the app shows the page in the top left of a
  larger window: the suites pin the page to 1400 x 860. It is the suites' pin, not the app. Measured without it: the
  page fills the window (1712 x 890 on a 1920 x 1080 screen), F11 gives 1920 x 1080, and F11 again gives the window
  back. The app's self-test now holds the page to the window's own size (17 rows), and F11 with `--full-screen` (18
  rows; not in the everyday gate, since it takes the whole screen).
- **The guide's size budgets (D99).** 6 MB of pictures and 8 MB of PDF, from 4 and 6, so that 1.7 keeps every picture.
- **Found, and in the BACKLOG.**
  - From the break's onset, the fall's air space by space keeps the stern afloat past 30 minutes on member C, where the
    record has it under in 1.5 to 3 (Z1). The spaces need the stern's flooding from the break before they can stand in
    for the pocket there. The count across the kept set was not run.
  - On a 1920 x 1080 stage the Foundered card scrolls at rest on the watch.

### Join 16 (the living ship; the witnesses, her rooms, the bands and the gallery on the page; the portable app; the Carpathia search on the kept set), 2026-11-23

Joined on one branch from main `29c4786` and tested by one full gate, on Bo's standing word: 14:42 to 15:30 CST, 63 of
63 good in 47 min, no table stale and nothing to mend. After it the cabin view's suite ran inside the packaged app: 6
of 7 rows pass. The view works there (the room found, marked, walked from; the times; the fingerprint), but the suite's
own check that the tables were fetched does not see a load under the app's scheme. That row is mended in join 17.

- **The Carpathia search, rerun on stage D's model and its kept set (D5).** Not on this model, nor on any of the 79
  models in the kept set's band.
  - With no order after the ice she founders 163.5 minutes after the touch. The best orders found keep her 4.6 minutes
    longer, to T+168.0.
  - Carpathia is alongside at T+265.1 as the night went, T+213.2 with the call made at once, and T+194.0 with five miles
    made good as well. The best night falls 26 minutes short of the nearest.
  - Past the target on 0 of 79 models, for each of the three. The gain itself holds on 58 of 79 and helps on 74.
  - The search now starts from the best night found before (`--warm`), so it never publishes a worse one.
  - On join 7's model the same search gained 6.0 minutes. Her restored ends and Barrett's bunker leave less to gain.
  - The note: `docs/research/RESULT_carpathia_search_v4_2026-11-23.md`.
- **Her lights go out section by section (NH15's G1, U0).** 250 sections, each with its fuses, blown when the sea
  inside reaches its switches [bet: 1.2 m].
  - On the 1912 night, 173 are dark by the time she founders.
  - The fall carries them on (G2, Z1): the bow is dark from the break, and the stern burns about 6.5 seconds more.
- **Her nervous system (NH15).** Every dependency of her plant is a node with its state, its reason and its time, in
  the Systems tab (`RULES`, U0; the view, Z2).
- **Other living-ship changes:**
  - her smoke follows each funnel's boiler rooms;
  - the end card says when her steam mains gave way;
  - the Morse lamp has its change-over, and the telephones their battery;
  - the plant's coal shares are mended (F1).
- **The witnesses, row by row (NH1, Z2).** The Evidence tab shows every row of the observation ledger against the
  page's own run.
- **Her rooms (NH2).** Type a stateroom's number or a room's name in the Damage tab. The page says when the water came
  to its deck there, marks it, and offers the walk from it.
- **One model, many histories (NH3, NH5).**
  - The forecast names the kept set: "she founders in 30 of 30, between 2:12 am and 2:37 am".
  - The charts carry its bands.
  - A gallery of eight what-ifs runs across all 30 members: head-on, the lookout sooner, the doors, the bulkheads,
    Californian, the boats.
- **The portable app (NH13).** `Titanic.exe`: the page in its own window, with no browser, no port and no network. The
  1912 night inside it equals the model's to the bit, and the page's own suites run against it.
- **The drawn ship stands on her ends (G24).** The page, the export and Blender carry the hull with her ends above E
  deck. No port lies inside the model's hull, where 215 did.
- **The living crew (NH16), documents only.** Bo picked the spoken bridge first. His principle: no ship AI; the officers
  and crew are the minds, in character.
- **The papers.**
  - CLAUDE.md: the living ship's readers, the cabins library, the page's new parts, the app, the fall's lights, G24.
    The Commands block is unchanged here: it moves with User Guide 1.7 in join 17.
  - BACKLOG: NH1, NH2, NH3, NH5, NH13, NH15, NH16 and G24.
  - tools/gate.js: the rows circuits and nerves.

### Two documents after join 15 (docs only), 2026-11-23

- `docs/BRAINSTORM_byok_living_crew_v1_2026-11-23.md` (Bo's fork of the coordinator's session; NH16): a crew given by
  keys the player brings.
  - Deepgram listens and gives the voice, Jev or Clef judges, and an LLM speaks for the officers.
  - Every AI decision is one of the watch's existing orders, so it is logged and replays with no key.
  - The crew know only what the bridge was told.
  - Five steps, the first needing no key.
- `docs/DESIGN_G12_the_way_up_at_the_flag_v1_2026-11-23.md` (Z1): the options for the bow that lands upside down when
  she is handed to the fall at the founder flag.
  - Hand her over at the break's onset, mend the last-minute roll, or keep a visible check.
  - On member C the onset is now the nearer to the record's break.
  - The choice is Bo's.

### Join 15 (the calibration epoch's stage D landed: one refit, member C of the history match), 2026-11-23

Joined on one branch from main `936195c` and tested by one full gate, on Bo's standing word: 11:57 to 12:41 CST, 48 of
52 good in 44 min.
- night_end_site failed its Carpathia row, which read the best night recorded on join 7's model. The mainline's
  re-measure (`c7c9212`) mended it.
- ledger, export and night_site were STALE as meant: D92's onset; U0's pins, taken on a = 0.40; the page's fingerprints
  and areas on C.
- After the mends, `gate --only dist,ledger,export,night_site,carpathia,night_end_site,u3_water --write` passed 7 of 7
  (12:42 to 12:51).

- **Stage D landed (D90).**
  - The history match was rerun with Barrett's account of the fire bunker as hard filters, and kept 30 parameter
    sets. Trial landings of the top three, each through every headless suite, left one: member C.
  - The preset founders at 2:25:42 am (165.70 min), and the 1912 watch 163.47 min after the touch. The kept set's 30
    founder at 2:12 to 2:37.
  - Every switch the epoch built dark is on: her ends above E deck, the pockets' weight in her motion, the engineers'
    graded pump rule, full spaces weighed at their capacity, the plans' doors and her side openings.
- **A leak mended (D89).** The step set a pair of spaces holding a millionth of a cubic metre or less to zero, and the
  bunker's trickle into a pumped-dry stokehold kept landing there. `params.keepTrace` keeps it.
- **The girder's strength refitted (D92).** Prohaska's a is now 0.660, refitted to its one outside anchor (C-7) now
  that her ends and the weighed over-fill are in.
  - The break's onset comes at 2:19:25 am on the preset (the record says about 2:18), 6.3 min before she founders.
  - The wreck's places back it: the untuned fall's levers lie within 1 m of what the survey asks.
- **The fall's trials on the landing (D91, Z1).** Trial 7 is fitted on the survey's side; trial 10's 920 m was its own
  unsigned fit; trial 4 is judged by Boyle's law. From the flag the bow now lands upside down, a knife edge, so G12 is
  reopened; handed over at the onset, both pieces land upright.
- **The Carpathia search's best night, re-measured on C.** Its orders, replayed, keep her up until T+165.99: a gain of
  2.52 min over C's own watch (on join 7's model it was 6.04). D5 reruns the search on the kept set.
- **G18 closed.** Its robustness row is a MUST: every founder within 150 to 170 minutes under the area constant's
  perturbations, and with the lead forced each way.
- **The rest:**
  - the page's words on C (Z2): "2:25 am, 2 h 46 min", and the lights' row read from one record file (2:08 to 2:28);
  - the export's pins on C (U0);
  - the level solve, measured (e116): no effect.
- **The papers.**
  - CLAUDE.md: the epoch landed and "on since D4"; the calibration is the history match; keepTrace; G18; the record
    files; a = 0.660; trial 7.
  - BACKLOG: G12, G17, G18, G19 and G22; G24 new; G25 found and closed in the join. u3_water's check had compared a
    step's level with the next step's water; the export and the core agree to the litre (U0).

### The next horizon, a brainstorm and its roadmap (docs only), 2026-11-23

- `docs/BRAINSTORM_the_next_horizon_v1_2026-11-23.md`: why the sinking is not computed by CFD and what the simulator
  is instead; where it stands; twelve wishlist items (NH1 to NH12), scored and ordered.
- BACKLOG section 2k:
  - NH1 to NH5, the sweet spots, are on the roadmap after stage D (Bo, 2026-11-23): the witness timeline, her rooms
    and when the water came, the ensemble's bands, scrubbing the night, and the counterfactual gallery. None changes
    any physics.
  - NH6 to NH12 are on the wishlist: her rooms as the flooding network, air in every space, one body from the ice to
    the bed, other sinkings, the C++ core, CFD for the discharge coefficients, the film.
- No code. dist is untouched and still current.
- Then `docs/DESIGN_electron_desktop_client_v3_2026-11-23.md`, the portable app and the public release (Bo: "Yes,
  write v3"). v2's engine problem is solved by the core's own maths. New in v3:
  - the page's own browser suites run against the app;
  - a deny-list and privacy scan over the whole history before the public push;
  - a release with the zip, its sha256 and the guide's PDF.

  It is BACKLOG's NH13, on the roadmap after stage D.
- Then `docs/BRAINSTORM_the_next_horizon_v1_1_2026-11-23.md` (Bo: "Yes, add NH14"): the simulator as a flooding
  dynamics model, a model that computes and a frontend that renders, as flight simulators split it. It covers:
  - the contract;
  - three ways into Unreal (baked, live, a director that fires the frontend's own effects);
  - the SDK (`libtitanic`, a C API, the state contract, an Unreal plugin with Bo's frontend as its first client);
  - what it needs first;
  - its risks.

  It is BACKLOG's NH14, on the wishlist after the C++ core and the rooms' first stage.
- Then `docs/DESIGN_the_living_ship_v1_2026-11-23.md` (U0, NH15), at Bo's request: "make it a living breathing ship".
  - Her systems' graph as built. Every dependency Bo named is already in the plant except the lights, which are one
    level for the whole ship.
  - The gaps and findings in three classes: A (reader or page, neutral), B (plant code, neutral to the fingerprint),
    C (the next epoch's refit).
  - A nervous-system view for the page.

### Join 14 (the fall's fuller failures and her solids by zone, both what-ifs; the page on the hull with its ends; the guide's PDF on the shared closeBrowser), 2026-11-21

Joined on one branch from main `f1361fe` and tested by one full gate, on Bo's standing word: 16:06 to 16:43 CST, 52
of 52 good in 38 min, no table stale, nothing to mend. Stage D's landing does not come with it: its member #1 was withdrawn (D87; it contradicts Barrett's account of the fire bunker),
and the history match reruns with his three rows as hard filters before a member lands (join 15).

- **The fall's spaces give way boundary by boundary (Z1's M2 4d, `K.fail` 'boundaries').** With the fall's spaces (the
  what-if `K.air` 'spaces'), each space gives way once, at its weakest boundary, into the space across it. A boundary
  is a bulkhead, joiner work, E deck or the shell, each with a head of sea water as its strength [bet].
  - It is now the spaces' default. The first form stays by name as `'simple'`, and the runs made with it name it.
  - The fall's own default (`K.air` 'pocket') is untouched, so no default fall moves.
  - With it the stern holds its air longer and goes under about 88 s after the hand-over, against 14 s.
  - Its time under turns on the shell's and the bulkheads' heads: 40 to 126 s across their bands (e111).
- **Her solids by zone from B1+B2's items, as a what-if (D(G12-e) step 3, `K.solids` 'items').** Each zone's solids
  become B1+B2's item-by-item volume, with her wood afloat or soaked. The default `'core'` gives the same bits.
  - The bow then lands 706 to 743 m from the point under the break, upright in all ten runs (the record: 772 m).
  - The stern lands 383 to 399 m out (the record: 148 m).
- **The page draws on the model's hull with its ends (Z2, stage D's member-independent page part).** Where the drawing
  must match the model (the tiers' side, the free surfaces' clip, the bulkheads, the marks, the walk, the girder's
  section) the page passes `ship.hull`. With her ends off, as until stage D lands, the drawing is the same.
- **The guide's PDF through the shared closeBrowser (U0, G16's last leftover).** A guide build leaves no browser profile
  behind. It is first used at the next guide build.
- **The papers.** CLAUDE.md: the fall's `K.solids` and a boundary's strength (Z1's own commit brings `K.fail`); C3's
  callers (the page passes `ship.hull`). BACKLOG:
  G16; G17 (stage D's first run, D87, the rerun's prerequisites); G19; G22; section 3's push line.

### Join 13 (the page says she broke; the parts' claims; the fall's spaces as a what-if), 2026-11-21

Joined on one branch from main `1c7bb22` and tested by one full gate, on Bo's standing word: 15:03 to 15:44 CST, 51
of 52 good in 41 min, no table stale. onset_site failed one row: the walk was refused as it should be, but the row read
the page's last notice, which on this tree was the wireless's. Z2 mended the row to read the walk's own refusal, and
the rerun passed 8 of 8.

- **The page knows she is gone by one `gone(sim)` (QC B-4, Z2).**
  - On a watch handed over at the break's onset (`handover=onset`, a what-if), the page says she broke, in Bo's words:
    the card "She broke", the pill "Breaking", the forecast "Breaks at".
  - On a default watch and a preset, gone is the flag, as before.
  - New browser suite: `tools/onset_site_test.js`.
- **The parts' claims (QC C-4 step 3, Z2).** What a part changes of the page's (the marks, X-ray, the columns, the hull's
  and the pieces' materials) it claims under one rule per key, never saving and giving back. A player's input over a
  claim is the later choice. Each part's holds have their owner. New browser suite: `tools/claims_site_test.js`.
- **The fall's spaces, as a what-if (Z1's M2 4b-ii to 4c).** Behind `K.air` (the default `'pocket'` gives the same
  bits), each piece's spaces exchange water and air through their openings, give way when the sea outruns their air,
  and lift the piece.
  - With them the bow's sideways drift falls from about 790 m to about 80, and the stern lands 141 m off the break
    (the record's 148).
  - The reports come too early and too many, because the core leaves her air at one atmosphere at the flag.
- **The papers.** CLAUDE.md: B-4's sentence, the claims rule, the Commands. BACKLOG: G19, G21. tools/gate.js:
  onset_site and claims_site.

### Join 12 (the model's own pow with the one seams refreeze; stage D's history match built; the gate's virtual suites two at a time), 2026-11-21

Joined on one branch from main `922f14c` and tested by one full gate, on Bo's standing word: 13:18 to 13:55 CST, 44
of 50 good in 39 min (fourteen minutes shorter than join 11's: the eight virtual suites in pairs). girder and strength
failed one MUST row each: B1+B2's two pins frozen before B1, refrozen by e107's method (each old value reproduced
without the model's pow, each new one with it) and rerun PASS. night_after, fall, export and night_site were STALE as
B1 moved them and are written; the page and Node still give the same bits through the encounter (709e83b3).

- **The model's own pow (the calibration epoch's B1, the mainline; Bo: "Yes. Go ahead.").** Every power of
  `core/core.js` is fdlibm's `C.pow`, so the step calls no engine transcendental, and the seams reference is refrozen
  once: a change of arithmetic, not of physics.
  - The proof (e107): V8's pow isn't fdlibm's on this Node (4.5 % of inputs differ by one ulp). The older code with the
    model's pow preloaded over its `Math.pow` (`tools/pow_preload.js`) gives B1's references, the 1912 watch's
    fingerprint and golden, to the bit; every pin frozen from an older commit was refrozen from its own commit that way.
  - What moved: the 1912 preset founders 1.25 s later; the watch 0.75 s sooner, on the same branch of the pumps'
    doctrine; the validation's verdicts are the same to the minute.
- **Stage D's history match, built and not yet run (the mainline; D85).** `tools/history_match.js` samples the inputs
  the ledger can't rule out, with Bo's loose fit: wide bands, the cut-offs as flags, conservation and the binding
  cases as hard filters. e103 rerun with the coal list wired: it's the second lever on her change of side. Design v1.2.
- **The gate runs the virtual-clock suites two at a time (D83, the wake).** `--pair-check` holds each paired output to
  its lone one, line for line: 14 of 14. night_end_site, sound_site, reports_site and deep_site are on the page's
  virtual clock too, so the eight virtual suites run in pairs in a few minutes.
- **The papers.** CLAUDE.md: the seams rule (B1's one refreeze and its proof), the model's own pow, the gate's browser
  phase and `--pair-check`, the converted suites, the Commands. BACKLOG: X1, G17, G23 and the log.

### Join 11 (stage C whole: her ends and her side openings, built dark; the slow browser suites on the page's clock; the page's pockets, doors and words), 2026-11-21

Joined on one branch from main `4911ab1` and tested by one full gate, on Bo's standing word: 11:19 to 12:12 CST, 48
of 50 good in 53 min (twelve minutes shorter than join 9's: the converted suites). The other two: export STALE as meant
(C4's four param keys in the record) and written; deep_site failed one row (the Stern at rest: a word outside the
picture, once Z1's M2 had moved where the stern rests), mended by Z2 in `75_deep.js` (a word with no line wholly inside
the picture is not drawn) and rerun: 42 of 42.

- **The calibration epoch's stage C is whole (the mainline; D81).** Every switch is off, and every reference holds to
  the bit.
  - C4: `params.g11Doors` takes away the three watertight doors the plans don't show. `params.sideOpenings` adds D and
    E decks' openings in her side from the plans, with plate-theory strengths [bet] that decide that switch: at 0.3 of
    them she founders at T 150.7, against 158.3.
  - C3: `C.buildShip({ hullEnds })` restores her ends above E deck from the plans' readings (G20). With it alone the
    1912 preset founders 20.4 min later: 20 of the 35 minutes of too-fast late flooding that Stage 0 found.
    `tools/hull_ends_tests.js` (19 MUST rows) is in the gate.
  - B1+B2's rows: with the ends restored, nothing moves within 31.5 m of amidships, and the onset moves with the flag
    at the same station, about 2 min before it.
- **Bo's answers (2026-11-21).**
  - E-3, the list target: option 1.
  - B1, the model's own pow and one seams refreeze: yes (the mainline's next, as its own join).
  - The end term fits the founder with the onset as a check, and loosely: "It's more about the physics and the
    dynamics and the invariants themselves".
  - levelRate: a named bet at 2 a second.
  - The public words: yes.
  - D52 refined: yes.
  - B-4's words: yes.
  - D84: the page is for a powerful desktop first, the phone second where they conflict.
- **Three slow browser suites on the page's virtual clock (QC C-3 step 5, the wake).** systems_site, help_site and
  boats_site: about 2.5 min together against 17.8. Each virtual run repeats line for line, and two at a time share the
  machine with the same output (the share trial, D83).
- **The page (Z2).**
  - The hull's X-ray tint shows each pocket's own water where it stands.
  - The walk draws only the doors the core has at its params (C4).
  - The deep's words always stand inside the picture: on the first clear line, or else where they overlap least,
    marked and excused by name. A rounding fault that let a word slip past the picture's edge is gone.
  - The pieces at rest are framed in the stage's clear band, not behind the readouts.
- **The fall's air space by space, steps 1 to 4a (Z1's M2).**
  - Each piece's lever is printed. The tiers' side drag takes their solidity from the plans (0.85), on Bo's yes to
    D52 refined; their added mass stays 0.
  - `core/readers/spaces.js` gives the core's 64 spaces as boxes, each with its level and its water's and air's
    centroids exact at any attitude.
  - On the watch both pieces lie upright, at every hand-over. The bow glides further than the record has it (1,171 m
    off, against 772), which is reported.
- **The papers.**
  - BACKLOG: G17, G19, G21, G22 and G23.
  - CLAUDE.md: C4's two switches in the weather openings' rule; C3's rule; the X-ray tint and the walk's doors; the
    converted suites in the page-clock rule; the Commands (systems_site_test's `--real`, hull_ends_tests).

### Join 10 (User Guide 1.6), 2026-11-21

User Guide 1.6 (U0), docs only, on main `4e7ab80`: `docs/guide/USER_GUIDE_v1_6_2026-11-21` (HTML and PDF, 56 pages),
its 35 pictures and the page's account of the 1912 night retaken on join 9's main, 1.5's built files retired. Its
chapters bring joins 6 to 9 in:
- one damage, the bunker, the refit, her rooms and the bow law;
- both pieces upright with no funnels;
- the peak tank;
- the Carpathia question on v3 (join 7's snapshot);
- the model's own functions and Node's fingerprint in the page;
- the ledger as checks;
- the onset what-if;
- the pockets drawn where they stand;
- the page's one clock and its one layout;
- Bo's three questions on her fall.
Checked by `node tools/gate.js --only dist,guide` on the joined tree (10:14 CST): dist is current (the page unchanged
since join 9's full gate) and the guide passes all 10 checks. README names the new edition.

### Join 9 (the page's one layout; the epoch's Stage 0 and stage C built dark; the fall on the model's own functions; her side and openings read), 2026-11-21

Joined on one branch from main `f8cc269` and tested by one full gate, on Bo's standing word: 08:26 to 09:29 CST, 48
of 49 good in 65 min (seven minutes shorter than join 8's, the director's suite now on the page's virtual clock), the
other one STALE as meant and written (export: the record's pockets and its weighed water, U0).

- **The page's one layout (QC C-4 steps 1 and 2, Z2; D78).** The stage is one grid of areas named by role, with a fit
  pass. Every part's overlay stands in its area, and every placer is gone. layout_site's rows are MUST: no fault in sixty states at six sizes (116 at step 1, 147 at step 0's baseline), after
  three rounds of mends in its browser slot.
  Choices taken on Bo's word, reversible, for his morning:
  - on a stage 780 px tall or shorter, the Bridge gives way while the end card is up and while walking;
  - the notice stands at the left on a preset;
  - the stacked template serves stages up to 900 px wide, since after the flag the readouts need the fall's lines'
    width, about 430 px.
- **The director's suite on the page's virtual clock (QC C-3 step 4, the wake).**
  - Its 15 rows run in 45 s, against 456 s on real time.
  - The cuts are the same step for step, and the fingerprint is the model's alone.
  - The page's step cost was measured: 0.192 ms a step at 900x with rendering off.
- **The calibration epoch (G17, the mainline; D81: stage C lands dark item by item, D stays one landing).**
  - Stage 0's measurements:
    - e99: the early record needs about 1.1 m2 of opening, and then she founders at T 122.9.
    - e100: with levelRate, a half step moves the founder 2.1 s.
    - e101: the virtual over-fill reaches about 14,900 m3 at the flag.
    - e103: the Morris screen, where the opening and the bunker's burst head lead.
    - A1's half-step row.
  - Stage C, every switch off and every reference to the bit:
    - C1, `SHIP.massPockets`: her mass under way counts every body of water.
    - C2, `PLANT.leadRule`, G18: each room is judged once by its inflow against its pumps. e105: today's rule steps
      the founder 1.354 min across a ±1e-4 nudge, and the new one at most 0.029.
    - C5, `params.weighOverfill`: a full space weighs its capacity. The girder's, the fall's and the record's mirrors
      each hold their weighed water to `C.weighedWater` with the switch at 0.
    - C6, `bunkerOpen`: the fire bunker's own opening, for stage D's joint sample with its burst head (D82).
- **The fall on the model's own functions (QC B-7, Z1).** fall.js calls `C.log`, `C.tan`, `C.log10` and `C.atan2`, so no
  file in `core/` calls an engine transcendental but the step's `pow`.
- **B1+B2's notes.**
  - G14's girder and section side (D80, e102).
  - The fire bunker's burst head (D82, e104). The wall that gave way was the bunker's own after wall. It bears 4.5 to
    6.0 m of head, 8.5 m if stiffened like her bulkheads [bet], so W6's 13 m lies above any bunker wall.
  - C5 on the break's onset (e106). It delays the onset 86 % as far as the flag, at the same station.
  - G20 is read:
    - her side at 40F to 75F and 40A to 75A: forward she lacks about 1,960 m3 between E and B decks, aft 2,364;
    - D deck's openings (195 a side, about 38 m2) and E deck's bow, counted.
- **U0's record** follows the pocket rule (placed `min(vol, cap)`, counted `vol`). It carries her weighed water when C5's
  switch is at 0.
- **The papers.**
  - BACKLOG: X1, G17, G18, G19, G20 done, G21 and G22.
  - CLAUDE.md: B-7, C2's lead rule, C5's weighing in the mirrors, C6's opening and the director's virtual clock.
  - PORTING.md and HANDOFF.md now say they describe the October core (QC A-5).

### Join 8 (Carpathia v3 ends the red row; the model's own transcendentals; the epoch's stage A; the page's clock and its layout check), 2026-11-21

Joined on one branch from main `5e4d3cd` and tested by one full gate, on Bo's standing word: 04:21 to 05:33 CST, 47
of 49 good in 72 min, the other two STALE as meant and written (export: the record's params gained levelRate;
night_site: the page's watches now give Node's own bits through the 1912 encounter, E2a's purpose). The
Carpathia search's rerun is the mainline's entry below. With it, night_end_site's Carpathia row expects the new best
night, so D74's red row ends and main is green again.

- **The model's own transcendental functions (E2a, U0; QC A-2, B-7, C-2).** Ten more of the model's functions are its
  own: exp, log, log10, tan, atan2, hypot, tanh, asin, acos and cbrt. Each is fdlibm's routine, proven equal to Node's
  Math on about a million inputs a function (e97, e98), so no Node bit moves. In the page, where Edge's Math differed
  from Node's, the model now computes what Node does: night_site's watches have Node's fingerprints, and its row
  across engines reads "the same bits" through the 1912 encounter. Only the step's `pow` is still the engine's, for
  the calibration epoch's stage B. `tools/engine_tests.js` bans every Math transcendental in `core/` but `pow`, with
  the fall allow-listed until Z1 switches it.
- **The calibration epoch: its design and stage A (G17, the mainline; D77).** The design (v1 and v1.1) has four stages:
  the references move exactly twice, the physics is built dark behind switches, and there is ONE refit by history
  matching over an observation ledger. Stage A moves no bit:
  - levelRate holds the step's half-levelling share per second;
  - squares become products;
  - the validation table prints the founder's noise floor and each floating case's margin (Britannic with her ports
    shut stands only 0.78 m below bulkhead F's top: an edge);
  - calibrate.js prints J by group;
  - the observation ledger is data, read CHECK-only by `core/readers/ledger.js`: 26 rows, 8 in range today.
- **The onset as the watch's own check (D76 b, B1+B2).** On a watch handed over at the break's onset (a what-if) the
  night carries B2's check itself, so a copy, its forecast and a watch without readers meet the same onset. A default
  watch is as before, to the bit.
- **The page (Z2).**
  - C-4's design: one layout authority (D78).
  - Its step 0: a layout check at six sizes in ten states, whose baseline is 147 overlaps as CHECK rows (gate row
    `layout_site`).
  - The page's side of the epoch (D79) and B-4's gone(sim), on paper.
  - The core's pockets are read in the rooms, the walk and the page: each placed up to its capacity and counted whole,
    drawn where it stands.
  - The deep at rest keeps the survey's words clear of its strip.
  - The deep's eight pictures and the walk's two are retaken.
- **The page's one clock (QC C-3, the wake, steps 1 and 3).** `TitanicApp.now()`: everything that says when something
  happens in the page reads it, virtual in a test (`clock=test`), real otherwise. Proved neutral in real mode on
  night_site, reports_site, visuals_site and director_site. `tools/clock_tests.js` holds every wall-clock read in
  `site/` to a list (gate row `clock`). The design is v1 and v1.1; step 4, the director's suite converted, follows.
- **The papers:** BACKLOG's G19 (b) done; G21 (the page's layout faults for C-4) and G22 (the model's findings for the
  epoch: the tank's over-fill, girder's C-7, Britannic's edge) added; G20 widened. CLAUDE.md: E2a and levelRate, the
  onset check, the page's clock, the pockets' rule for every mirror, the experiments' reservation file, and the
  Commands. README: the engines' line.

### The Carpathia search rerun on join 7's model (v3, join 7's snapshot), for join 8, 2026-11-21

By the mainline on wt/carpathia-v3, from main 5e4d3cd: `node tools/carpathia.js --nights 6000 --jobs 6 --variants 40`,
02:18 to 03:03 CST, 3,667 nights. The note: `docs/research/RESULT_carpathia_search_v3_2026-11-21.md` (v2 kept).
- **The best night now gains 6.0 minutes, not 13.6.** She founders at T+164.99 against the watch's own T+158.95. The
  nearest target (Carpathia alongside with the call at once and five miles made good, T+193.96) is 29.0 minutes off.
  - The engineers' own rules now pump 687 t with no order (v2: 264), since join 6 holds boiler room 5's stokehold dry
    behind its bunker. So orders have less to add.
  - The gain holds on 34 of 40 models and helps on 40. One guess moved alone breaks it (the pumps never abandoned).
  - Every door held open against its float (not an order) reaches T+175.89, past no target on any model (v2:
    T+195.28).
- **Published as join 7's snapshot (D77).** G18 makes every searched night a bit-level perturbation of the watch that
  may fall on either branch, so gains under about 1.5 min in the one-order table are not to be leaned on. The
  calibration epoch's D5 reruns the search on the kept set.
- `out/carpathia_best.json` is the new best night (fc279dec, step 39,838, 11 orders). `tools/night_end_site_test.js`'s
  Carpathia row now expects the note's T+164.99 (it held v2's 171.38: the row red by D74 since join 6, green again
  with this).
- For the guide (U0, edition 1.6), `tools/build_guide.js`'s CARPATHIA_TYPED still quotes v2: the note's figures are
  best 165.0, base 159.0 (158.95), gain 6.0, tried 3,667, models 40; the targets 265.1, 213.2, 194.0; needed 106.2,
  54.2, 35.0; short 29.0.

### Join 7 (the forepeak held to its tank; both pieces upright at rest; the falling pieces' topsides; the gate's deadlines), 2026-11-21

Joined on one branch from main `7966a23` and tested by one full gate, on Bo's standing word: `node tools/gate.js`, 01:08 to 02:08 CST, 41 of 46 good in 60 min 24 s, the first gate with every suite under a deadline (G16).
- night_end_site failed two rows. The Carpathia row is meant (D74). The four-compartment row's end card ("She floats", 2.0° by the head) came at 2 h 41 min against its bound of 90. With G7 the forepeak above its tank fills only through the tank's 4-in vent [bet], so she comes to rest at about 2 h 30 instead of 30 min (the mainline confirmed it meant). The bound is now 180 min, and the row is rerun alone: only the Carpathia row fails.
- visuals_site failed one row, and night_end_site's phone line would have: both still expected the preset at 2:17, and G7 makes it 2:18 am, 2 h 38 min. Both expectations were updated in the join to the mainline's night_site wording, and visuals_site was rerun alone: 20 of 20.
- night_after, fall and export were STALE: the tables both G7 and Z1's G12 move, merged from G7's side, then written with `--write` on the joined tree. Every piece lies upright as she is (fall_trials' LIES lines).
Its core is the mainline's G7 entry below. night_end_site's Carpathia row stays red by design (D74) until join 8 brings the search's
rerun on this model.

- **Both pieces upright at rest (G12, Z1; Bo's first question on User Guide 1.5).** The fall's lumped air pocket was
  frozen in each piece where the air lay at the founder flag, so a piece that rolled through half a turn kept it on the
  wrong side (QC B-1). It now lifts through each slice's floodable centre (`K0.airAt` 'centre'; 'flag' is the engine
  before, to the bit), an interim until Z6 milestone 2's air space by space. As she is, both pieces land upright on the
  preset and the watch, in Node and in Edge. The way up still turns on the flag's list at a threshold, 2.6 degrees above
  the core's 80.2-degree clamp, and the watch's five-way rows say so as CHECK rows. The fall's water by slice takes the
  core's pockets (QC B-3).
- **The falling pieces' topsides (G13, Z2; Bo's third question).** No funnel on either piece from the fall's first frame;
  the foremast laid back on the bow, with the crow's nest on it, and the mainmast off the stern, at the strikes (Ballard
  1987, Z1's sources note). The survey's labels keep clear at rest, the Night walk is lit, and the deep's "Keel" column
  is now "Depth". Found on the way: a preset's stowed boats rode down on the pieces.
- **Funnel 1 falls at the surface (G15, Z2)** when the model's own sea reaches its seat, at 2:15 in the page and in
  Node alike, before the flag: the record's account, nothing tuned. G9: the phone caption clears the fullest end card on
  the bed by 4 px, now guarded by a row.
- **The deep gives the gap's two parts at rest, and the marks go by claims (QC B-5, C-5, Z2).** About half the distance
  between the model's bow and the surveyed one is her heading at the flag. The Night look and "As the bridge knew it" no
  longer undo each other.
- **The gate and its browsers (the wake: the K4 race, G8, G16).**
  - `alongside` reads the refresh's own window corners: a race seen once under load as 1.2 m in wake_site's K4 row.
  - A browser picks its own debugging port.
  - Every suite has a deadline, and every DevTools call a timeout.
  - Every launch logs the browser's version, and one shared close removes each profile.
- **Her rooms from the plans, finished for now (R3).** Her ends at E, D and C decks against the model's (about 4,100 t of
  buoyancy while dry missing above E deck; BACKLOG G14), and `data/rooms/openings.json`: 921 openings, 474 m2, on C, B,
  A, the Boat deck and E. D deck's sidelights and E deck's bow counts are left (G20).
- **The break's side (B1+B2's note).** The onset as the faithful hand-over, the falling pieces' lever, and her ends
  against the onset. D76: the onset as the watch's own check is B1+B2's for join 8; the switch and Carpathia scored to the
  break wait for the calibration epoch and Bo (G19).
- **The papers:** BACKLOG's G8, G9, G12, G13, G15 and G16 done, and G18 to G20 added. CLAUDE.md: the fall's air, the
  gate's deadlines, the marks by claims, and the Commands. README: the fall's known gap.

### G7 lands (the forepeak held to its tank, G11's widths, the refit of rung 2b), for join 7, 2026-11-21

By the mainline on wt/g7, from main 7966a23, for the coordinator's join 7. The validation table is in the landing's
commit message; the ladder is `docs/research/RESULT_G7_ladder_v1_1_2026-11-21.md` (v1 kept).

- **G7: the forepeak held to its tank.**
  - The record: the Report has the peak tank flooded through the hole in its bottom, and the forepeak "not flooded
    above the Orlop deck" in the first ten minutes. Hemming (BI 17716-33) found the tank's vent blowing "with
    considerable force" and the stores above it dry.
  - The model: the tank, from the keel to the orlop's watertight flat, is a pocket of both sides that never gives way
    (`C.buildShip({ peakTank })`; `peakTank: 0` is the ship before). Its vent is a 4-inch pipe to G deck (0.008 m², a
    bet). The forepeak's own space now begins at the orlop.
  - On the landed watch the forepeak's space is dry for the first ten minutes, the tank is full at T 22.1, and water
    comes up its vent from T 22.3 (14.4 m³ by T 30).
  - `tools/pocket_tests.js` holds `peakTank: 0` (with G11's widths off) to join 6's core, to the bit, on join 6's
    numbers.
  - The research note and the design (bc91319, ebe9439) come from wt/g7-notes.
- **G11: the plans' widths on E deck.** The paths over bulkheads D to J: Scotland Road 2.24 m, the starboard alleyway
  1.49 and 1.40 m (R3's report). `params.g11` 0 gives the widths before. The seams gate and the trials' coupled run
  build the ship before both.
- **The refit, rung 2b, and G18.**
  - The numbers: the opening 0.8196 m² (8.82 sq ft; join 6: 0.7853), wMul 1.1 on its bound, aDown 0.2786, fOpen
    0.02087, J 8.23. The encounter's area constant is 0.24256786344109968.
  - Why 2b: rung 2, approved at 23:2x, put the 1912 watch at T 156.60 once landed, outside D73's band. Its refit's
    157.95 was the other branch of a knife edge, now BACKLOG G18. At pumpOwn + 30 min the engineers decide once to
    lead pumps to boiler room 4 through the main, and skip it for good if `roomLost` holds at that instant
    (`core/systems.js`). At G7's numbers the room sits on that threshold at about T 105, so a last-bit change moves
    her founder by about 1.35 min.
  - `tools/calibrate.js` now holds the watch as it is and the watch with no pumps led through the main
    (`Sys.PLANT.pumpLent` Infinity, in the tool only) to the band, with D73's term on the latter (the coordinator,
    00:0x).
  - The founders: the preset at T 158.28 (2:18 am), the watch at T 158.95 as it is, and T 157.16 with no pumps led.
    The opening is landed 0.13 % below the refit's optimum, so that the last run stands 0.16 min inside the band and
    not on its wall.
- **The validation table under D75 as refined.**
  - Every binding verdict is kept: the bulkheads to D deck founder at 2h46m (Wilding: "no help"), and the five forward
    compartments now take 2h28m (join 6: 2h14m; the tank's own).
  - The bulkheads to B deck now founder at 5h20m, where join 6 floated at 8.5 degrees. This agrees with Wilding; it is
    reported, not binding (its sources disagree). The tank itself tips it: 5h31m with the tank before the refit.
  - The doors left open: 2h50m (2h51m).
  - The README's tables say all of this.
- **One count of her water (QC B-3, A-6), no physics.** `C.spaceWater(sim, n)` is space n's water with the pockets'.
  - Over the 64 spaces it is `C.readouts(sim).waterM3` (pocket_tests section 6).
  - A reader summing `sim.vol` alone misses the pockets' water: 590.6 m³ of 7,871 at T 30. The fall's hand-over,
    rooms.js, the walk and U0's record adopt it after this join. motion.js's syncMass waits for the calibration epoch:
    with G7 it leaves the tank's 330 t out of her mass under way for good.
  - Two suites of the mainline's read it now:
    - `tools/stairs_tests.js`'s conservation row: the tank's water is never in `sim.vol`;
    - `tools/conserve_tests.js`'s no-cut row now proves itself on the four compartments and Hawke. In the damage to hold
      3 the tank's vent water meets the level solve in the forepeak's two halves in 5 steps, and the cut holds it, as
      it should.
- **G6's switch** (`ice: { tearAlong: null }` through a night's spec) runs a night without G6's tear rule. It is
  neutral when absent (encounter_tests, a MUST row).
- **Moved, as meant:**
  - the headway reference (`astern_tests --freeze`: the contact's water);
  - the 1912 watch's fingerprint, now 1a1bd179 at step 38389, founding at 9,597.25 s with 669.80 m³ pumped
    (systems_tests' BASE and carpathia_tests' copy);
  - the golden trace;
  - the girder's RECORD, now 5.125 and 5.871 GN m at 11 and 17 degrees (the page quotes it; girder_site 21 of 21);
  - night_site's line for the 1912 preset: "Founders at 2:18 am, 2 h 38 min" (19 of 19).
  - The tables of trials, rooms, stairs, validate, night, encounter, fall, strength, night_after and export.
  - The onset of the break on the preset moves to T 156.00 (2:16:00 am; join 6: 2:15:05), at the same station
    (x -10.93, boiler room 2).
  - The preset's fall: the bow lands 1,314 m from the point under the break (1,448), the stern 154 m (178). The stern
    still comes to rest upside down (QC B-2, Z1's).
- **Not here:** G18's doctrine, wMul freed (QC E-2), syncMass (A-6) and pow (A-2) are the calibration epoch's, after the
  Carpathia rerun. The rerun follows this join on its main.

### Join 6 (G6, G6b and W6 land; her rooms at level 0 and from the plans; her bow wave a law; User Guide 1.5), 2026-11-20

Joined on one branch from main `a247162` and tested by one full gate, on Bo's standing word: `node tools/gate.js`, 22:47 to 23:48 CST, 44 of 46 good in 61 min 36 s. night_end_site failed one row, the Carpathia row below (meant); rooms was STALE, its water timeline moved by the landing (meant; written with `--write`); wake_site passed 17 of 17 with the bow law. Its core is
the mainline's entry below.

- **night_end_site's Carpathia row fails, as meant (D74, the coordinator, on Bo's word "Do what you think is best").**
  The published best night (`out/carpathia_best.json`, `RESULT_carpathia_search_v2`: T+171.38) is the old model's. On
  this one its orders founder at T+166.13, the page equal to the model alone. The search is rerun once, after G7 (the
  forepeak held to its tank) lands in join 7; its note (v3), the file and the row's number move together in join 8.
  Main is red by design from this join until join 8, and is not pushed in between.
- **The refit also turns the preset's stern over at rest (QC B-2, said here because the table took it silently).**
  `out/fall_trials.txt`, rewritten by the landing's `--write`: the 1912 preset's stern comes to rest at roll -179.4
  degrees, where main's was -0.9. Its CHECK row "never goes wholly under" went from in to OUT. On the watch the bow
  already lay upside down (G12). It is the same knife-edge from the founder flag's 80 degrees of list, and the likely
  cause is the fall's lumped air pocket, frozen in the body where the air lay at the flag (QC B-1, Z1's to mend). The
  guide's pictures at rest change with it; edition 1.6 shows them as the model then has them.
- **Her rooms at level 0 (R1, Z2).** `core/readers/rooms.js`, a library: each of the core's 64 spaces cut at her decks
  into 250 slabs whose capacities sum exactly to the core's, and each space's water shared out among them by the core's
  own column cut. No fingerprint moves. On the landed 1912 watch G deck takes water from about 30 minutes after the touch, F from 50, E from 60 and D from 90 (80 before the landing). Gate row `rooms`.
- **Her rooms from the deck plans (R3).** Encyclopedia Titanica's free deck plans read on the page into sourced tables:
  all nine decks, the orlop to the Boat deck, 569 rows with their doors. Each row is placed by her frames, with its
  source, its check against a 1912 original where one could be reached (The Shipbuilder's plates), and a tag saying how
  its walls were placed. The derived fields come from the model's own functions (`tools/rooms_table.js`); the tables
  are drawn over the model's own deck outline (`docs/evidence/rooms/`). What they find against the model is BACKLOG
  G11 (the lower decks: bulkheads B and P aft of the model's, the passages narrower) and G14 (above E: the model's
  hull narrow at her ends, about 4,100 t of buoyancy while dry between E and B decks; the B tier long; the officers'
  mess house missing). Gate row `rooms_table`, 68 rows.
  Under R0 v1.1 and Bo's answer of 2026-11-20: the 1912 originals are public domain, and no modern redrawing's images
  or drawings come in.
- **Her bow wave, a law (the wake, K6).** Her drawn crest against her plating follows Noblesse and others' relation
  (2008, J. Fluid Mech. 600, eq. 4.1, capped by eq. 6.2) for her stem's half-angle, 21 degrees (`CFG.bowAngle`, a lower
  bound measured on Bob Read's plans of Olympic), solved at each refresh. It replaces the fixed factor 3.5, which drew
  her crest at 3.06 m, 11 m abaft her stem, at 22.5 kn, where the law gives 5.67 m. No one factor suited every hull:
  the Series 60 wants 3.69, Wigley's hull 2.76, her stem about 7. The white water keeps its own factor, 3.5
  (`CFG.bowFoam`). `wake_tests` 42 of 42. The model's own hull is a 16.6 degree wedge at the stem (BACKLOG G10).
- **Z6's design v1.3 (Z1).** Docs: the box rule replaces the column sets; compression rules the bow's air; the doubts
  are reordered; the runs milestone 2 must print are named.
- **User Guide 1.5 (U0's lane).** 52 pages: the joined lanes on the page (the wake, the gauge's onset, her fall to the
  bed), the night past the flag, the walk, join 5's pieces, and seven new pictures. It describes the model before this
  join's landing, as its edition note says; 1.6 follows on the new numbers, after the Carpathia rerun.
- **Bo's three questions on the guide's pictures of her fall** are answered and in the BACKLOG: the pieces upside down
  at rest are the model's physics and a knife-edge (G12); her speeds are inside the record's estimates (the bow 8.25
  m/s at the bed against Best and others' 5 to 10, 2000; 28 mph on average against Ballard's 25 to 30); the funnels and
  masts riding down whole are the page's drawing (G13, Z2, join 7).
- **The papers:** README's calibration section carries the landed fit and checks; CLAUDE.md has R1's and R3's rules,
  the bow law, the air design's v1.3 and a rule for numbering experiments (e83 and e84 each name two, told apart by
  their names); BACKLOG section 2h's table has its State column.

### Join 6's core: G6, G6b and W6 land together (the record's boiler room 5, one damage split, one refit), 2026-11-20

Built by the mainline on wt/g6b-landing from main `a247162`, on the coordinator's D70 to D73 (Bo's word: "Do what you
think is best. If you're unsure, ask and decide together with the coordinator."). The design is
`docs/DESIGN_W6_the_lists_v1_3_2026-11-20.md`; the research is
`docs/research/RESEARCH_damage_split_by_compartment_G6b_v1_2026-11-20.md` and
`docs/research/RESEARCH_room_by_room_flooding_record_v1_2026-11-20.md`.

- **Boiler room 5 as the record has it (G6 and W6).**
  - The 1912 tear ends inside the starboard forward bunker, as the Report and Barrett have it (`ICE.tearAlong`).
  - The bunker holds its water as a pocket until it gives way (W6, part A: about T 56 on the preset).
  - The stokehold's plates stay dry until then, where main flooded it through its side from T 4.
  - G6's tear rule covers boiler room 5's own side only, from bulkhead F to the bunker. Over the whole hull aft, every
    night's contacts there were dents only, since a dent never passes the ice's crushing depth (0.25 m). The 1912 night
    is the same to the bit either way. The rule rests on the 1912 record and is a bet on any other night; a what-if
    switch to run a night without it comes with G7.
- **One damage split (G6b).**
  - The 1912 preset's split, `TITANIC_SPLIT`, said "Hackett & Bedford" but carried the water each room held. It is now
    their opening areas by compartment (JOM 1998, Table I): 4.8 / 11.9 / 24.6 / 26.2 / 22.2 / 10.3 %.
  - The encounter shares the 1912 watch's opening the same way, through `ICE.openAlong` (one fitted factor per
    compartment). Its contact law opens every torn metre alike.
  - The gates keep the old split and area, as `TITANIC_SPLIT_GATE` and `GATE_AREA`.
- **One refit (D73).**
  - `node tools/calibrate.js 45` now holds the 1912 watch's founder beside the preset's timeline, both founders held to
    157 to 160 min. Its bounds are named with their reasons.
  - Its result: area 0.7853 m² (8.45 sq ft, +4.6 %), wMul 1.1, aDown 0.2647, fOpen 0.02189 (1.036, 0.2815, 0.02068
    before). The encounter's area constant is 0.23058811512419958.
  - The preset's J is 7.83 (9.39 before). The preset founders at T 157.33 and the watch at T 157.03 (157.74 before).
  - All 11 validation verdicts are unchanged, among them validate.js's bulkheads-to-B-deck what-if: afloat, a knife edge
    (e90).
- **W6's list band** (D72, amending D62): band A's rows are CHECKs in the pocket suite, printed and failing visibly,
  until D64's tunnel height is settled. The Shipbuilder (1911) gives the firemen's tunnel's extent, from boiler room 6
  to the after end of No. 1 hold, but not its height.
- **References refrozen on purpose:**
  - the headway reference: the 1912 watch and night 7, whose contact lets in other water;
  - the systems suite's fingerprint: `b63a2b3e` at step 37928, against `ede5d1eb` at 38099. The pumps lift 488.7 m3,
    against 257.3, since boiler room 5's pump works on while the bunker holds;
  - the girder's quoted break moments: 5.11 and 5.84 GN m.
  - The golden trace and the tables that follow the 1912 night are rewritten with the gate's `--write`.
- **The tests mended:**
  - the Y1b quiet band now holds the model's own time (T 77.4);
  - the encounter's total-opening row reads CALIBRATED_AREA;
  - U3's water rows take a pair's tolerance where hold 2's halves stand merged over the tunnel;
  - the Carpathia suite's second contact has new orders, since her way after the ice moved.
- **The Carpathia search** runs each night once a batch (a duplicate key was run twice). It is rerun on the new model
  after the join, in a quiet window (the coordinator's word); its published best night is the old model's until then.
- **The User Guide** (1.5 is labelled as the model before join 6) is rebuilt as 1.6 on the new numbers and the new
  Carpathia result.

### The bunker of the fire (W6, part A), built on its branch; landed with join 6, 2026-11-20

The core builds the empty starboard half of boiler room 5's forward bunker as a pocket (`sim.pockets`): the hull's
openings inside it fill it, its shut door leaks to the stokehold, and it gives way when its own water's head over its
floor reaches 13.0 m (a bet set to the pumps note's 12:40 and the Report's "about an hour"). On the 1912 damage it
fills by T 19, keeps boiler room 5's plates dry for its pump, and bursts at T 58.3; her list is level or slightly
starboard from T 15 to T 45, where it was 2 to 3 degrees to port. `bunker: 0` is the core before it, to the bit; a
new suite, `tools/pocket_tests.js`, holds that and the pocket's own rows. It lands after join 4 with its refit and its
cascade (docs/DESIGN_W6_the_lists_v1_1_2026-11-20.md, section 5); until then the tables in `out/` are the ones before
it, and this branch's gate fails where they move. Found on the way: the 1912 watch's ice tears boiler room 5 open 12 m
aft of bulkhead E, against the Report's 2 ft (section 4), so on the watch the bunker cannot hold the water off.

### Join 5 (the joint on the free body, K6 against the KCS, the record's BR5, the plans' licence), 2026-11-20

Joined on one branch from main `4bf604e` and tested by one full gate, on Bo's standing word.

- **The joint on the free body (Z6 milestone 1, Z1).** `core/readers/fall.js` can pin the bow and the stern at the
  break: both bodies in one midpoint sub-step with the constraint force at the middle (it does no work), the
  elastic-plastic hinge on `S.hinge`, the release on the joint's own tension or shear. It is built only when a
  hand-over asks for it, so every fall without it is the same to the bit. Trial 13: the energy identity holds to
  4.9e-15; at the 1912 onset, as built, the joint yields at +12 s, the bow hangs by her bottom to 49 degrees and the
  double bottom lets go in shear at +25.4 s; with a 9 ft hinge at +3.7 s; with every strength x 0.95 at once. The air is
  still the stand-in: that is milestone 2.
- **Milestone 2's groundwork (Z1, documents and experiments).** `e69` and `e83`: the part of a box below any plane in
  closed form, its volume and first moments (the water's centroid at any attitude), against integration and the
  core's own rule. `e84` and `RESEARCH_torn_end_exchange_law_v1`: air and water at a torn end. On a sinking piece the
  bow's air is compressed, not vented, in its first seconds (half its volume in 8 to 10 s at 300 m2), so the landing's
  sensitivity is the torn end's clear area times its coefficient; the abacus certified the note's unit checks and
  numbers.
- **K6, the tank, replaced by a benchmark (the wake).** The FluidX3D tank is retired: its free surface snaps to
  half-cell plateaus that do not shrink with the cells, and its waves fail. The field's own method is now compared
  with KRISO's measurements of the KCS hull (`tools/kcs_compare.js`, `tools/iges_offsets.js`, the results v1 and v1.1):
  along the hull a correlation of 0.80 (0.91 with the bow's pile), the cuts 0.83, 0.82 and 0.45 at 17, 35 and 97 m.
  createWake gains `o.hull` and `o.scale`, neutral for her (`tools/wake_tests.js`, 40 rows). Nothing moves for her.
- **Boiler room 5 in the record (the mainline's G6 note).** What the Report and Barrett say of BR5's damage: in the
  starboard forward bunker, about 2 ft from the bulkhead, BR4 undamaged.
- **The deck plans' licence (Z2's R0), and Bo's answer.** A modern seller's redrawn plans grant no right to derive or
  publish. Bo, the same evening: the 1912 originals are long in the public domain, and Encyclopedia Titanica's free
  deck plans should suffice. So the rooms' facts (which room, deck and compartment, where and how big) may come in as a
  sourced table, cross-checked against the 1912 originals where reachable; no modern redrawing's images or drawings
  ever do.
- **The join.** Join 5's full gate (19:07 to 20:07 CST) passed 42 of 43. `director_site` failed one phone row, a race
  that predates join 5: at a preset's end the fall grows the readouts, the end card moves down, and the director's caption
  was not placed again under it. Z1's `c82a6ac` places the caption again on any frame where the card or the readouts
  move; with it `dist` and `director_site` (13 rows) passed (20:47 to 20:54). After the gate, R0 v1.1 and the wake's
  Series 60 and Wigley tools and notes (which no suite reads) were merged. dist/ built once from the joined sources.

### Join 4 (her lights' failure on its step, B4's hinge for Z6, the walk inside her, U3 in Blender, the plant's steam), 2026-11-20

Joined on one branch from main `0f3f4d1` and tested by one full gate, on Bo's standing word.

- **Her lights' failure recorded on its own step (G3, B1+B2).** Under load the dark and the founder flag could fall in
  one drawn frame, and the end card said "her lights burned to the end" when they did not. `site/app.js`'s
  `lightsOut(sim)` now records the failure on the step it happens, at the plant's own time, with its reason;
  `night_end_site`'s row 4a forces the two into one frame and checks the card.
- **B4's hinge, ready for Z6 (B1+B2).** `S.hinge` gains the joint's slopes (k0 of the intact section, ku of what still
  holds), each space's tear height, rough lateral and torsion capacities [derived], and the unloading line. Past the
  tear's top the double bottom springs back elastically (0.735 of the tear's 0.833 degrees), and near the top the
  tear's opening mostly closes again (0.92 / 2.98 m2 a side close to 0.02 / 0.34); from 10 degrees 93 % stays open,
  so the tear vents the bow's after spaces only once the parts have truly turned. `tools/strength_tests.js` (25 MUST).
- **The walk inside her (W0, Z2).** `site/parts/76_walk.js`: a viewer walks inside her on the core's own water, stopped
  by walls, shut doors and her side, through open doors and from deck to deck, the water at the feet the core's; no
  walk after the flag. `tools/walk_site_test.js` (12 rows). With it, the rooms brainstorm v1 (the Review session's) and
  Z2's v1.1, and `e71`.
- **U3 in Blender (U0's lane).** Her water, lights, steam and smoke at T+30, 90 and 150 built in headless Blender from
  the export and the record, read back off the GLB (`tools/blender_u3_tests.js`, 9 MUST; it needs Blender, so it is
  not in the gate), and six stills (`docs/evidence/blender/u3/`).
- **The plant raises only the steam she uses (Y1b, the mainline).** At full speed the plant raised about 6 % more steam
  than her engines used, so the valves lifted and the page jetted steam before any order; now blow stays 0 from the
  bells to the touch, and the valves lift 9.25 s after the order to stop. Her way did not move: the 1912 watch is
  ede5d1eb at step 38099 as before.
- **The Electron documents** (the design v1 and v2, the mainline's second opinion, `e70`), as they stood.
- **The join.** Join 4's full gate (17:43 to 18:44 CST) passed 41 of 43. `boats_site` failed one row: W0's Walk button had
  widened the view bar, and at 1400 x 860 the readouts wrapped into two rows (mended in Z2's lane, `ae7129b`: the button
  ends the display row). `export` was STALE on the two night files' digests, the record's steam channels under Y1b,
  which was meant. With the fix merged, `dist`, `export` (written with `--write`), `boats_site` (15 rows) and
  `walk_site` (12) passed (18:53 to 19:00). dist/ built once from the joined sources.

### The plant raises what she uses (Y1b), 2026-11-20

U3's smoke proof found the plant blowing off steam from a watch's first step at 22.5 knots (0.058 of full steam at
76.4 rpm, measured on join 3's tip), so the page jetted steam from her escape pipes before any order. Under way at working pressure the stokers now hold the fires
to what she uses (`core/systems.js`: `P.gen` is the steam raised, the new `P.can` what the fires could raise at their
firing; `PLANT.idle`, the share of full-ahead steam below which the engines count as idle, is the 0.1 the stokers'
banking already used). The safety valves lift only once the engines are idle. The pressure, the firing and the coal are
computed as before, to the bit, so her way and her flooding do not move: the 1912 watch keeps ede5d1eb at step 38099,
founders at 9524.75 s and pumps 257.341 m3. Measured on that watch (`tools/systems_tests.js`, two new MUST rows): blow
0.0000 at every step from the bells to the touch and on to the order to stop (it was 0.058); the valves lift
9.25 s after the order to stop (the event at T 1.2); quiet at T 86.6, as before. The Systems tab's fires row reads
`can`, as it read `gen` before, so an intact ship at Full ahead still shows its fires as burning in full. The record's
`gen` and `blow` channels move with it (out/export_tests.txt).

### Join 3 (C3, E1, U3's first proofs, Z6's design), 2026-11-20

Joined on one branch from main `d679239` by the mainline, on Bo's standing word, and tested by one full gate: C3 (the
step conserves the water, two commits: the cut, then the pins and tables it moves, each with its reason), E1 (the
model's own sine and cosine, nothing moved under Node), U0's tip `fd080f7` (U3's first proofs: the water inside her,
her spaces as named volumes, her lights, her smoke and steam; three gate rows, no table; the Blender suite stays out of
the gate) and Z1's design of the free body's air by space (v1.1 and v1.2, with e68; documents only). dist/ built once.
The gate (16:11 to 17:12 CST): 40 of 42, every suite passing its rows, two tables stale and both meant, then written:
the export table's ship manifest is U0's own (the 64 spaces in the export: 617,442 to 970,899 bytes, the digest U0's
table has at `fd080f7`; the night's records keep C3's figures), and the 1912 watch's table in the page carries Edge's
own fingerprints with E1 in it (35a5652a to 7b88a72b at step 389) while Node's hold (d3b28ba7). The page and Node still
part in the last bits, from the engines' other functions (backlog X1).

### The model's own sine and cosine (E1, backlog X1), 2026-11-20

A watch in the page parted from the same watch in Node in its last bits (the 1912 watch with no order founders at
9,492.5 s in Node and 9,493.75 s in Edge). The cause, measured that day by another session's probe
(`docs/research/experiments/e70_engine_math_probe.js`, with the desktop client's design v2): two engines differ in
`Math.sin` and `Math.cos` on about 3.5 % of angles, by one unit in the last place, and the model called them every
step. `Math.pow`, which the README and backlog X1 had blamed, agreed on 800,000 inputs between those engines.

- **The port** (`core/core.js`, top): fdlibm's `sin` and `cos` in plain arithmetic of doubles, the same in every IEEE
  754 engine; beyond 2^19 pi/2 rad, or for a value that is not finite, the engine's own. Exported as `C.sin` and `C.cos`;
  all 52 calls of the model (the core, the scenarios, the motion, the encounter, the night, and the fall, people and
  world readers) go through it. The viewer keeps `Math.*`.
- **Nothing moved under Node:** the port equals Node's own on 2,000,004 angles to 800,000 rad, and every headless suite
  passed with no table moved (21 of 21, 2026-11-20 14:14 to 14:23 CST). The seams reference, the headway reference,
  the golden trace (founder 157.23 min), the validation table, the 1912 watch's fingerprint (611be326 at step 38100) and
  Carpathia's pins are bit-identical.
- **In a browser and in the desktop app** the model now gives Node's numbers for these two functions; the browser
  suites show what that moves in the page.
- **`node tools/engine_tests.js`** (in the gate, quick): no `Math.sin` or `Math.cos` in `core/`; the port's results over
  a million angles to their frozen hash; beyond its range, the engine's own.
- **The record corrected:** `tools/seams.js`'s header, the README (two places) and backlog X1 now say what was measured.

### The step conserves the water (C3), 2026-11-20

The review of 20 November: "The core makes a little water ... I would fix this conservation fault before any new
physics"; D55's order puts it first. The fault (backlog C3): a space holding a film of water could be asked, in one
step, for more than it held; it was set to nothing and its neighbours counted the rest as arrived.

- **The cut** (`params.conserve`, on by default; `step` in `core/core.js`): after the flows are found, a space whose
  outflows would take more than it holds has every one of them cut in the same proportion, and the sums are made again
  from the cut moves. Only a step that cuts anything does that second pass, so a run in which nothing is cut keeps its
  bits. The seams gate and the coupled trial keep it off (`conserve: 0` in `GATE_PARAMS` and in `tools/trials.js`):
  they are the step as it was, to the bit, and `out/seams_reference.json` is untouched.
- **What it mends:** the water aboard now equals the inflow summed less what was pumped, within 1.5e-6 m3 at every step
  of every validation case. Before it, 0.014 m3 was made on the 1912 damage, 0.25 without the BR5 seam, 0.10 for
  Britannic with her ports shut and 9.0 with five compartments open. The ends move by a tenth of a minute at most, and
  the open-doors case by about one (2 h 58 min).
- **The fit:** `node tools/calibrate.js 45` from today's parameters gives J 9.41 with C3 (9.39 without); the search
  wanders the known flat valley of `wMul` and finds about 1 % lower. The parameters are kept.
- **`node tools/conserve_tests.js`** (in the gate, quick): every validation case conserves step by step; a case with no
  cut is the same to the bit with the cut on and off; with it off the 1912 damage makes water as before.

### Join 2 (the fall joined to the night, the wake on her waterline, B4's law, the export for Unreal, the Run tab's id), 2026-11-20

Joined on one branch from main `7b1caf5` and tested by one full gate, on Bo's standing word.

- **The fall joined to the night (Z3, Z1's lane).** Past the founder flag the watch steps on: `Night.over(sim)` says
  she is gone, and from then a step runs the due orders, her clock and the readers only, while the model, the plant and
  the fingerprint stand still. Her fall is a reader of the night (`core/readers/fall.js`, state `fall`), begun on the
  first step past the hand-over, so its clock is the watch's until she rests. The wireless goes silent at the flag; the
  presets titanic, four, five and blank carry the 1912 site's sea, 3,790 m, and hawke and britannic keep the slide. On a
  watch the page steps the night on past the flag; on a preset the engine runs where it has a sea. The what-if
  `handover: 'onset'` hands her over at B2's onset, cut at its station. On the real engine she lies in the mud, not on
  it: the bow upright 10.4 m in, the stern upside down 13.0 m in. `tools/night_after_tests.js` (20 MUST rows); the two
  suites that set the engine aside since the first join run on it again.
- **The wake on her waterline and in the night's sea (K4).** `site/parts/26_wake_seams.js` puts the wake into the
  page's other pieces through two seams, each a marked default that does nothing (`/* wake: seaZ */` in the hull
  shaders, `/* wake: slope */` in the Night look's swell): her waterline follows her own waves, and the night sea and
  the reflections of the stars and her ports bend with them. With the wake off the page draws the same pixels as
  before, in all three looks. `tools/wake_tests.js` (38 rows), `wake_site_test.js` (17).
- **B4's law, as a library (B1+B2).** `section.js`'s `hinge()` gives the joint's moment, the torn share, the work and
  the ligament still holding, against the angle between the parts; `onset.js`'s `check(sim, { all: true })` every
  station's ratio. The release rule for the free body: the joint carries min(its demand, M(theta)) and lets go when the
  force across it passes Nt or Vs. The shear release lies inside the model's uncertainty: the double bottom's webs carry
  20.34 MN against 19.61 at the onset, and a 5 % weaker steel, a fifth side girder or heavier riveting each tips it.
  The tear takes megajoules, not the plan's rough 1 GJ. `tools/strength_tests.js` (22 MUST rows).
- **The ship as numbers and the 1912 night recorded, for Blender and Unreal (U0).** The first stage of
  `docs/BRAINSTORM_titanic_in_unreal_v1_2026-11-20.md` (Bo: "yes go ahead, start U0 in a new lane"):
  `tools/export_ship.js` writes her hull, decks and drawn ship as one JSON, with T1's rules and the round stern lofted;
  `tools/record_night.js` records the 1912 watch at every step (pose, place, the water in every space, the openings,
  the plant, the readers, the events; `--fall` on to the bed as the page carries her today). Two runs give the same
  bytes; the record's fingerprint is the model's alone; at eight steps her waterline and every space's level are within
  0.5 mm of the model. The files are not tracked; `out/export_tests.txt` is their manifest. `tools/export_tests.js`
  (26 MUST rows).
- **U1's CPU half: her hull and topsides built in headless Blender from the export.** `tools/blender/build_ship.py`
  (Blender's API is Python alone) lofts her hull at the export's stations under T1's rule and builds the tiers, houses,
  funnels, masts, domes and boats, geometry only, no render; the GLB and the .blend go outside the repo.
  `tools/blender_tests.js`: two runs give the same bytes; her section at all 288 stations within 0.26 mm of the export;
  her ends, funnels, masts, domes and boats where the export puts them. It needs Blender 5.2 on this machine, so it is
  not in the gate. The four stills by day (a render) come next, on a GPU turn.
- **U1's stills and U2's preparation, for Bo's RTX machine (U0's lane).** The first four stills by day, rendered in
  Blender (`docs/evidence/blender/u1/`, with their faults listed: fixed since in code, the re-render to follow); the
  export sampled every 0.25 m along the counter's knuckle. U2, the sea proof in Unreal, prepared on the CPU:
  `tools/unreal/u2.ps1` (setup, inputs, proof, check), `tools/unreal/u2_sea.py` (untested here: it needs Unreal),
  `tools/u2_expect.js` (the expectations from the record alone), and the run sheet
  `docs/runbooks/U2_unreal_on_the_rtx_machine.md`, which Bo runs himself ("Yes, I'll run it").
- **K6's run sheet, the towing tank on Bo's RTX machine (the wake).** `tools/hull_stl.js` (her hull as a closed STL)
  and `tools/tank_compare.js` (a FluidX3D tank's surface against her wave field, exact on synthetic tanks made from the
  field), and `docs/runbooks/K6_tank_on_the_rtx_machine.md`. FluidX3D's code, the tank's setup and its results stay
  outside this repository (FluidX3D's licence; Bo: "Keep it outside").
- **The double bottom's girders, researched (B1+B2).** The sources give six webs a side where the model has five; on
  their layout the shear release stays inside the model's uncertainty (17.5 to 25.4 MN against 19.6 to 20.0), so those
  layouts are B4's what-ifs and no scantling changes.
- **The Run tab's watch id, stamped once (G5, Z2).** It was the fingerprint at whatever step the tab last redrew; now
  it is stamped on the step the encounter ended, with that step ("Watch <id>, step <k>."), as the end card is.
- **The join.** Join 2's full gate (14:43 to 15:40 CST) passed 36 of 37 suites, every browser suite among them; `export`
  was STALE on three pinned lines, explained to the byte: the recorded night carries three readers' new output faithfully
  (Z3's fall reader in its list, the wireless's last line at the flag, the onset's `found.over`), +143 bytes, the
  fingerprints unchanged. With U0's last commits and K6's sheet merged after the gate (tools and documents no suite
  reads but `export`), `export` and `dist` were run again: the table written with `--write`, then PASS. dist/ built once
  from the joined sources.

### The lanes of 19 and 20 November, joined (the wake, the fall, the deep, her strength), 2026-11-20

Built in four lanes on 19 November (Bo's picks: the descent's plan v2, the break's design, the wake's K1 to K3; "Start
all three", 14:14 CST), moved onto S1 on 20 November, committed each on its own branch at Bo's word ("yes to both,
proceed at your best recommendation"), joined on one branch with T1 and tested by ONE full gate.

- **The wake computed (K1 to K3).** On a watch the sea round her is a field of waves made by her own hull as it moves
  (two windows, exact dispersion, scaled to Holtrop's wave resistance), and the white water is made by that field and
  her screws; the drawn ribbon and Kelvin lines stand in when it is off or cannot follow. `site/parts/24_wake_field.js`,
  `25_wake.js`; `tools/wake_spectrum.js`, `wake_tests.js` (32 rows), `wake_site_test.js` (12). Found by the joint
  gate's `systems_site` on long runs at 900x and mended in the lane (`af034fb`): the field's player read past its
  record when a step cut the record while the player paused inside a sample; the record is now cut only between
  samples (two rows of `wake_tests`, the first of which throws on the lane's first commit).
- **The fall to the bed (Z1, `core/readers/fall.js`).** From the founder flag she is two rigid bodies, cut at the
  girder's break station (the interim rule H1), carried to the bed 3,790 m down on physics: six degrees of freedom with a
  quaternion, Kirchhoff's equations with the added mass summed over the model's slices, cross-flow drag slice by slice,
  the slender body's lift at a torn end, buoyancy at the in-situ density of an April column, one lumped pocket of air a
  piece, the mud by R6's bearing law. The contract is `sim.fall`, v: 2. On S1:
  - the tiers made her flooded hull bottom-heavy (D50 answered), and with the water's push taken on the hull's own
    section (D52, Bo, 2026-11-20) every flooded release under water lands upright (trials 5 and 6); handed over at the
    flag on the core's 80 degrees of list, the stern still turns over on its air and lands upside down (upright from any
    moment before T 157.0: e62);
  - untuned, the bow let go at the record's trim lands 821 to 936 m from the point under the break (the survey: 772)
    and the stern 82 to 138 m (148); the lever, the one fitted number, moves -0.32 and +0.40 m (limit 3);
  - the time to the bed, 7.1 to 7.2 min against the reconstructions' 4.5 to 7.0, is a CHECK (D53);
  - from the model's own flag the bow lands about 1.4 km off: the air decides it (e63, e64), which is Z6's to mend.
  `tools/fall_trials.js`, 26 MUST rows; the day's evidence as `docs/research/experiments/e60` to `e67`.
- **The deep (Z2).** After the flag the page steps the fall engine and draws each piece of her at its own pose,
  whatever hangs under the ship cut where the piece ends. A new part, `site/parts/75_deep.js`: the views Bow, Stern,
  Bed and Column; a strip of the sea to scale; readouts of depth, speed, pressure and temperature; a lamp and darkening
  water in the Night look [appearance]; the bed's nets; the survey's outlines of the wreck at rest; the Foundered
  card's lines as each piece comes to rest. With the engine joined the page carries her to the bed; on a watch the
  night's clock, the boats and the wireless stop at the flag until Z3. `tools/deep_site_test.js` (with the test feed
  `tools/fall_stub.js`, never shipped).
- **Her strength along her length, and the onset of the break as a mark (B1, B2).** `core/readers/section.js` runs
  Smith's progressive-collapse method on her cross-section at every station, from a table of scantlings with their
  sources (`docs/research/RESEARCH_midship_scantlings_v1_2026-11-19.md`): amidships 5.31 GN m hogging, 4.52 sagging,
  inside the studies' 4.0 to 5.4 and not tuned to it; the bottom fails first. `core/readers/onset.js` marks the first
  step where her own loads reach it: on the 1912 damage, on S1, T 155.01 (2:15 am) at x -10.93, boiler room 2, trim 9.45,
  list 3.6. That is 5 m forward of the record's band and two minutes early, and nothing is tuned to move it. It breaks
  nothing; the girder's part shows "She would break here, now". `tools/strength_tests.js`.
- **The join.** The gate's new rows: `strength`, `fall`, `deep_site`, `wake_scale` (`tools/wake_spectrum.js`, named
  apart from its table, since the gate logs each suite under its own name), `wake` and `wake_site`. With the engine
  bundled the page runs on past the flag in every browser suite. Z2 read all of them: two read the page after the
  flag as it was before the fall, so until Z3 they set the engine aside once the page has loaded (`sound_site`: "she
  founders: the page stops"; `night_end_site`: the card's second line, which the deep part fills once the bow rests).
  The joint gates found two faults that no lane's own runs could:
  - on long runs at 900x, the wake's field player read past its record (`systems_site`'s console row; mended in the
    wake's lane, `af034fb`);
  - on a phone, the deep part's strip reached into the Bridge once B1+B2's onset line had made the readouts 18 px
    taller (`deep_site`; mended in Z2's lane, `5ed1d11`: the strip takes the room left).
  Two follow-ups joined with them: T1's stern post without its shading seam (`7859a78`) and, on a phone, the boats'
  count below the view buttons while the deep shows (`9f404aa`). The full gate on all of it together (joint gate 3,
  12:13 to 13:07 CST): 34 of 35 suites passed. `director_site` could not finish on a phone, twice: it read the 900x
  button's place while the sheet was still sliding up, so its click landed on the tab bar (G4, its main cause; a probe
  hit the button 0 times in 5 that way, 8 in 8 after a wait). With its test fixed (one tap on the Run tab, then a wait
  until the button stands still) it passed alone, all 13 rows (13:18 to 13:26). dist/ built once from the joined
  sources.

### The counter's knuckle where the profile draws it (T1), 2026-11-20

Bo's pick of 20 November ("then do T1 after the commits"), the last of his stern correction of the 19th ("the stern is
incorrect it is circular shaped not pointed!"). Drawing only: the flooding's hull is unchanged.

- **Measured:** the counter's underside traced row by row off Bo's inboard profile (12_53_26, 0.233 m a pixel): 17.1 m
  above the keel at the stern post (the after perpendicular, x -129.54), rising to 22.2 m at her end. The model's counter
  overhangs from 11 m at the post to 15 m at her end, and its hull steps out from her narrow run to her counter between
  11 and 12 m all along her after body; the drawn counter kept that, so its underside read deeper than in the
  photographs and hid the rudder's head.
- **Drawn** (`STERN.counter`, `TS.knuckleZ`, `TS.hullDraw` in `site/topsides.js`): abaft the post the shell is open below
  the profile's line, so the rudder's head shows under the counter; forward of the post her run keeps the lines of her
  waterline up to the knuckle, which comes down to the waterline by x -112 [bet: the profile shows the knuckle abaft the
  post only]. Above the knuckle the shell is as it was. Two hull stations at the post keep the knuckle crisp, and her
  after body (abaft x -112) takes one set of heights from the keel, so no seam shows at the post.
- **Where the sources disagree:** near her end the profile puts the counter's underside at up to 22.2 m, above the foot
  of her name (20.4 m), which the page draws under her white top strake (the strake is in Bo's quayside photograph at
  her forecastle). Drawn as the profile, the counter's opening swallowed the name; the first after pictures showed it.
  So the drawn knuckle follows the profile until it reaches the name's foot (less 0.15 m) and holds there to her end
  [bet]; a CHECK row reports the disagreement and a MUST row holds the name on the shell. A photograph of her stern
  would settle it.
- **The drawn water:** under the knuckle the drawn shell is inside the model's hull, the one place it is, so the X-ray
  water is clipped there to the narrower of the two (`hbTex` in `site/app.js`); none shows outside her.
- **Tests:** `tools/topsides_tests.js` (27 MUST rows): the shell inside the model's hull only under the knuckle; the
  counter's underside at the profile's points (held under the name near her end), open 0.1 m below it and shell 0.1 m
  above; the name across her counter on the shell; CHECK rows that the rudder's blade reaches the counter (no gap) and
  where the profile and the name disagree. `tools/topsides_site_test.js` (11 rows): no vertex of the page's hull
  abaft the post below the knuckle.

### The User Guide, edition 1.4, 2026-11-20

- Rebuilt for the page with the tiers above B deck, their windows and the grand staircases (S1), and the drawn ship: the
  28 pictures retaken from the new `dist/`. "The simulator" and "How it works" say what the tiers, their windows and the
  staircases' doors and domes do, how strong each is, and that a dome giving way is a reconstruction; the fit includes
  them. "After the ice" quotes the Carpathia search's rerun (`docs/research/RESULT_carpathia_search_v2_2026-11-20.md`:
  13.6 minutes, pumps and one door) and says where its door order is on the page. Edition 1.3's built files are taken
  out, as `docs/guide/README.md` says (they stay in the history at `a97a6bd`). The sources and pictures are committed
  first and the built HTML and PDF after, so the guide names a clean commit.

### The drawn ship, from a table of sourced numbers; the round stern, 2026-11-19

Bo's ask of 19 November: "the titanic model mesh itself can be made more accurate etc especially the boat deck and open
upper decks etc", and, of the first pictures, "the stern is incorrect it is circular shaped not pointed!". Not
committed: in the working tree for Bo's word. Built in its own lane (`wt/mesh`) by a builder agent from a research note,
`docs/research/RESEARCH_topsides_dimensions_v1_2026-11-19.md` (108 parts: 39 read in a source, 36 scaled off the plans
Bo sent, 33 bets, each tagged).

- **Before:** five boxes, four upright-looking cylinders and two sticks. The funnels stood 1 to 9 m from their places,
  raked 4.3° where the builder's rigging plan gives 2 in 12 (9.46°), and ended 3 m low; the mainmast stood 21 m too far
  aft, on the poop; the bridge was a box on a box.
- **`site/topsides.js`** (new): the drawn ship above her hull as one table and builders that use no three.js. The Boat
  deck: the wheelhouse, the bridge's shelter and wing cabs, the officers' house, the forward entrance with its dome's
  cover, the second funnel's house with the gymnasium to starboard, the raised roofs of the reading room, the lounge
  and the smoke room, the compass platform, the engine casing's house with its skylight, the after dome's cover, the
  second-class entrance; twenty davit frames at Bob Read's frames, their arms swinging out with the boats; rails, the
  two steel bulwarks, the expansion joints. The open decks: A deck's house, the steel screen and its windows, the open
  promenade aft with its stanchions; B deck's sides; the two wells with their hatches and cranes; the forecastle and
  the poop with the docking bridge. Four funnels on their casings at 54.9, 19.3, -16.3 and -52.3 m, 7.47 by 5.79 m,
  raked 9.46°, their tops at the heights Read gives, black for 5.64 m; the masts raked the same, the crow's nest, the
  shrouds and stays, the funnels' shrouds, the four-wire aerial. In the solid looks the white top strake, the yellow
  sheer line, TITANIC and LIVERPOOL across the counter.
- **One source for each thing:** the smoke and the steam rise from the drawn funnels, the crow's-nest eye and the
  masthead light sit on the drawn foremast, the side lights in the wing cabs, the davits stand at the people reader's
  stations, each dome's cover where the flooding core has its staircase (`C.STAIRS`), its glass gone once the model
  says the dome has given way. Every part stands on the model's decks (`C.deckZ`).
- **The boats on the landing page:** with no watch the twenty boats lie stowed as at 11:40 pm; on a watch the boats
  part draws them as before.
- **The round stern** (`TS.hullDraw`): the drawn shell keeps the model's half-breadth at and below the load waterline
  and forward of 75 m abaft amidships, and above the waterline goes over into the outline measured off Bo's deck plan,
  column by column: a round end and a long full taper (9.1 m of half-breadth 5.6 m from her end, where the model's
  fitted form has 2.4). The hull the flooding uses is unchanged (backlog G2), and the drawn water is still clipped to it.
- **The water in the tiers** (backlog S1b, done with it): in the X-ray look a compartment's water above B deck is
  drawn up to what is shut in over it.
- **Cost:** 12 draw calls fewer than the old superstructure in the X-ray look and the same number in the solid one
  (eight meshes by colour, instanced windows, davit arms and boats, three line sets); about 15,000 more triangles; no
  measurable loss on a phone viewport.
- **`node tools/topsides_tests.js`** (headless, in the gate, quick) and **`node tools/topsides_site_test.js`** (browser,
  desktop and phone): every number against the note, davits at the stations, smoke and steam at the funnels, domes at
  the core's staircases, the drawn shell never inside the model's hull and round at her end; a watch has the same
  fingerprint with the topsides as without. The before and after pictures: `docs/evidence/topsides/`.
- Left, in the backlog (section 1b): cowl ventilators (their stations were not found), the counter's knuckle (drawn
  where the model has it, lower than the profile's), the windows' real pattern, see-through bridge windows and the
  Bridge eye behind them, the Welin davits' lattice, the deck's camber, the social image's old funnels.

### The tiers above B deck, their windows and the two grand staircases (S1), 2026-11-19

Bo's ask of 19 November: "there are two grand staircase, if water leaks into either of them the dome busts and its rapid
entry of water via the grand staircase ... model it mathematically so that in the sim this is added". Not committed:
it stands in the working tree for Bo's word. The design, the laws and every number with its source and range:
`docs/DESIGN_grand_staircases_dome_flooding_v1_2026-11-19.md`; the facts: three research notes of the same day
(`RESEARCH_grand_staircases_domes_record`, `RESEARCH_downflooding_stairwells_glazing`, `RESEARCH_topsides_dimensions`).

- **The tiers are space.** The model's hull stopped at B deck: the three tiers above it held no water and gave no
  buoyancy, and one fitted weir a quarter of a metre wide stood for every window, door and dome. A ship is now built
  with her tiers (`TIER`, `tierTop` in `core/core.js`; about 25,500 m³): each compartment's space above E deck goes up
  through them, buoyant while dry. An experiment made first (e26, the tiers' buoyancy put on the old core through its
  seams) is why: without them a staircase has nothing dry around it to flood.
- **The openings to the weather above B deck** (`weatherOpenings`, `stairsStep`): the tiers' windows, two rows to a
  compartment on each deck and side, and the two grand staircases' own: forward (over boiler room 4, 31.1 m forward of
  amidships) the D-deck gangway doors, the Boat-deck entrance doors and the dome; aft (over the reciprocating engine
  room, 38.8 m abaft) the A-deck entrance doors and the dome. Each holds until the head of sea on it reaches its
  strength, then is open for good: a wooden door 1.0 m at its sill, a window 1.5 m at its pane's middle, a dome's
  weather cover 0.5 m, all from tests and plate theory with their ranges. A door or window runs by the pressure summed
  over its height (`lawUpright`); a dome's well by the smaller of a weir round its rim and an orifice through it
  (`lawLevel`).
- **The dome goes from below, as Bo said.** Once a door of the hall has given way and the sea has passed its lintel,
  the air shut in under the dome lifts the cover's panes off their beds (`hAir`): the physics note's finding. On the
  1912 damage the forward dome gives way 5 s after the port Boat-deck door, at T 155.8 (2:16 am), 1.2 minutes after the
  sea reaches the bridge and 1.4 before she founders; the after one at T 156.5. The two staircases carry 5,800 t in
  those minutes, at up to about 17,000 t a minute; the tiers' windows, broken from T 152, carry 44,000 t. **No witness
  saw a dome give way:** the record note read every survivor from the forward Boat deck. It is a reconstruction, and
  the model's version of it is marked so.
- **What it does to her end.** Refitted (`node tools/calibrate.js 45 "[0.7506,2.735,0.280,0.01411]" --fix-area`:
  wMul 1.036, aDown 0.2815, fOpen 0.02068; J 9.39 against 9.56 before, both as rounded; the opening held, so the
  encounter's area constant stands). The 1912 damage: the sea at the bridge at 154.7 minutes (153.9 before; the record
  155), foundered at 157.2 (156.9; 160); her list as the bridge goes under 2° to port where it was 29° (the record
  about 10°); she still rolls over in her last minute, once the windows have gone. The 1912 watch founders at T+157.75
  (157.24). Every validation verdict is kept (`out/validate.txt`): Britannic 49 min (50), her bulkheads to B deck and
  Britannic with her ports shut still afloat, at 8.5° (8.1° and 8.8°).
- **Kept exact.** With the hull that stops at B deck (`C.buildShip({ tiers: 0 })`) and `stairs: 0` the core is the core
  before S1, to the bit: the seams gate and the coupled trial build her so (`GATE_SHIP`, `GATE_PARAMS`), and the
  reference is untouched. Until the sea first stands at an opening a run has the same bits with the openings as without.
- **`node tools/stairs_tests.js`** (in the gate, quick): 18 MUST rows: the two laws against their limits and a direct
  sum; the step carrying them; what the tiers enclose; nothing lost of the hull; neutral until wet; each opening once
  and for good; saved and restored; the water accounted for.
- **Moved on purpose** (the 1912 night's last minutes): the systems suite's 1912 fingerprint (611be326 at step 38100,
  founders at 9,525 s; was 3810e155, 37979, 9,494.75) and the Carpathia acceptance's copy of it; the girder's record
  figures (5.11 and 5.87 GN m at 11° and 17° of trim; were 4.98 and 5.28: the dry tiers lift her forward part late and
  bend her more, so every capacity in the studies' range now breaks her, between 6.6° and 12.5°); in `out/` the golden
  trace, the validation table and its JSON, and the encounter's two tables (after the 1912 encounter she now founders at
  156.4 minutes, was 155.9; a what-if at 203, was 202), written by `node tools/gate.js --write`; `out/stairs_tests.txt`
  is new. Unchanged: the boats' fit, the reports' constant, the place of the wreck, the night's and the trials' tables.
  The headless gate: 15 of 16 good, `dist` alone stale until the page is rebuilt.
- **The Carpathia search, rerun on this model** (2026-11-19, two and a half hours; `tools/carpathia.js` unchanged): the
  best orders found now buy 13.6 minutes (T+171.4 against 157.7; v1 had 12.1). They are pumps and the doors in bulkhead
  F raised at T+56, whose fall lets 163 m3 through to pumps already waiting behind them. Their gain holds on 33 of 40
  models (was 29) and helps on all 40; she needed 36 to 107 minutes more. The search rewrote `out/carpathia_best.json`;
  the note is `docs/research/RESULT_carpathia_search_v2_2026-11-20.md`, which the guide's chapter 6 (with
  `CARPATHIA_TYPED`) and the end card's suite (`tools/night_end_site_test.js`, row 4b) now read.
- **The boats' stations** in `core/readers/people.js` are now the davits' own frames (the plan note, from Bob Read's
  davit article): they were placed from landmarks, 1 to 6 m off. The fit is the same (14 of 18 within ten minutes).
- **Found on the way, in the backlog:** the step makes a little water (C3); the core's older laws against the
  literature (K1); the hull's decks against the plan (G2); the D-deck gangway doors' tightness, which decides two
  what-ifs (S1d); the decks above E deck as spaces of their own (S1c).

### The User Guide, edition 1.3, 2026-11-18

- Rebuilt for the page after M7 and N5 (`eb742d1`): the 28 pictures retaken from the new `dist/` (the Director switch
  now first among the display toggles), a row for it in "The screen", and every figure the build pulls taken afresh
  (the boats' rule at 1 knot; the help reader's arrival times on her new way after "Stop"). The sources and pictures
  are committed first and the built HTML and PDF after, so the guide names a clean commit. Edition 1.2's built files
  are taken out, as `docs/guide/README.md` says (they stay in the history at `b25f72d`).

### Her way after "Stop" (M7, with the "Stop" part of M5), 2026-11-18

- **A stopped screw drags.** Until now a wing screw at rest after "Stop" gave no force at all, so her way after the
  ice was the hull's resistance alone: on the 1912 orders 5.98 knots fifteen minutes after the touch, 3.46 at half
  an hour, 1.88 at an hour, 6.83 nm run on. `SHIP.stopped` in `core/motion.js` gives a stopped wing screw (Stop rung,
  no steam, water at the engines) its drag by state, from the B-series data the repository already holds: held (the
  default: the held screw of a reversal's dead time, C_D 0.537 on its disc), trailing against the engine's friction
  (held below 6 knots [bet]), free (0.045 of held). Held, because the engine-room witnesses say the engines stood
  between the orders (Dillon, Scott) and below 4 to 10 knots no likely friction lets the water turn them. Now 3.53
  knots at T+15, 2.73 at T+20, 1.88 at T+30, 0.99 at an hour; 4.29 nm run on; she founders 2.25 s later. The note:
  `docs/research/RESEARCH_way_after_stop_v1_2026-11-18.md`.
- **What it does not do.** No stopped-screw law stops her by T 15 to 20 on the 1912 orders (Stop a minute after the
  touch): the drag stays quadratic. The note measures each witness's engine movements on the mended model: none
  stops her there either, and the best supported (Dillon's: Stop, slow astern, Stop, ahead, Stop) puts her back up to
  7.7 knots at T+15. So the 1912 night keeps its orders (Bo, 18 November).
- **The boats' lowering rule back to the boats note's 1 knot**: lowered as usual up to 1 knot of way, at half the
  pace to 5, not at all above 5 (`RATE.wayFull` in `core/readers/people.js`). The 3 knots was a bet made because of
  this fault; on the 1912 orders she is under 1 knot from T+59.6, before the first boat, so the fit stands.
- **The cascade, on purpose.** The headway reference refrozen for one run (night 7's 700 steps, whose shafts now
  stand from 139.75 s); the systems suite's 1912 fingerprint (3810e155, founders at 9,494.75 s); the world reader's
  WRECK_1912 remeasured (4.22 nm from the touch, was 6.76); the boats refitted ({ kLo 0.002, kHi 0.04, pace 8 }, 14
  of 18 as before); the Carpathia acceptance's frozen print and its night that backs onto the ice (now with the rudder
  hard to starboard at T+50); the encounter's what-if "engines stopped with
  the helm order" (0.41 -> 0.20 m2 of seams). Unchanged: the fit and the trials table, the area constant, the
  reports' constant, the sweeps. Carpathia alongside at T 265.15, 213.17 and 193.98 (was 192.50); the search's best
  night replays to 169.31 minutes against a baseline of 157.24: its answer stands.
- In the main checkout, merged with the director (18 November, 11:16 CST): `node tools/gate.js --sweeps --write`: PASS, 29 of 29 in 62 min. Written on purpose: the night suite's 700-step digests, four of the eight nights the encounter suite hashes for X2 (still equal both ways), its what-if "engines stopped with the helm order" (0.41 to 0.20 m2 of seams), and the page's replay fingerprint in `out/night_site_test.txt`. The three sweeps unchanged.

### A director for the camera, 2026-11-18

- **One switch, and the camera tells the night** (`site/parts/80_director.js`). "Director", first of the display
  toggles under the view buttons, chooses the view at each moment of a watch through `TitanicApp.setView` and holds
  the page at her own pace where the moment deserves it (`TitanicApp.holdPace`): the watch begins on the Bridge; the
  bells from the Crow's nest; the touch from the Quarter, then the Bridge; her steam blowing off and the builder's
  man's reckoning on the Profile; the first report on the Bridge; the first boat from the Boat; the first rocket from
  above, the others in turn; her forecastle going under, her last minutes (held at her own pace to the end) and her
  lights failing from a boat laid off her beam again. A damage preset gets the flooding's own list: each bulkhead
  over, the forecastle, the last minutes, the lights. The end card is left alone. A view button pressed by the player
  turns it off, with a notice. A small caption gives the ship's time, the moment and the eye.
- **The cut list is data** at the top of the file (trigger, view, hold, gap, weight, whether it survives 900x), and
  the choice rests on the model's steps and the player's inputs only: the same watch gives the same cuts at the same
  steps. It reads the model's state and gives no order: the 1912 orders watched with it on keep the model's
  fingerprint to her foundering.
- **`node tools/director_site_test.js`**: 13 rows through real clicks, the clock stopped on exact steps (about eight
  minutes: the last minutes are held at her own pace); in the gate.
- Found by its lane and left open: a part has no supported way to lay the Boat's eye again (backlog N6); on a
  phone the end card covers the view row (S5); "Restart from collision" drops the 1912 preset's pumps (S6).
- In the main checkout, merged with M7 (18 November, 11:16 CST): `node tools/gate.js --sweeps --write`: PASS, 29 of 29, the director's suite among them (13 rows, 8 min). Its lane's own gate on its branch: PASS, 25 of 25.

### The User Guide as a build product (edition 1.2), 2026-11-18

- **The guide is built, not written as a page.** Its eleven chapters are Markdown in `docs/guide/src/`;
  `node tools/build_guide.js` turns them into `docs/guide/USER_GUIDE_v1_2_2026-11-18.html` with its own small converter
  and prints the PDF with headless Edge: Letter, a cover, a contents page whose page numbers are read back from the
  PDF, running page numbers through CSS page margin boxes. 41 pages, 3.5 MB. Two builds from the same sources give
  the same bytes. The hand-written first edition stays as it was; edition 1.1 was never delivered.
- **A chapter for after the ice**: the reports to the bridge and the bridge's own view, the boats boat by boat against
  the launch record, the wireless log and the other ships, the hull girder's gauge and where the record's break falls
  on the 1912 damage, her end, and **the Carpathia question**: what the first search (W5) found, its best night's
  orders, how firm it is, and the note's answer, "Not on this model, and not by a near margin". The other chapters
  follow the page as it is now: the Night look, the two eyes, the sounds, the card at her end and its link, an
  order of any kind taking the watch over, and the pumps: Y6's what-if given from the page (every pump on boiler
  rooms 4 and 5 three minutes after the touch: 159.45 minutes in the page's engine).
- **What the repository holds is pulled at build time, not typed**: the cards, every table of results, the Systems
  tab's links, the plant's and the readers' numbers, the commands of CLAUDE.md, the search's result (when it is in the
  tree: otherwise the build says so, quotes a typed copy, and the guide counts as stale once the result arrives), and
  what the page itself showed on the 1912 night (its sentences, the boats, the wireless, the reports, the card, the
  gauge's curve, the pumps' what-if), read as the pictures are taken.
- **The pictures are taken from `dist/`** by `node tools/guide_shots.js` through the page's own controls, under a fake
  clock the tool advances frame by frame, each moment held on its exact step: 28 pictures, byte-identical on a second
  take.
- **`node tools/guide_check.js` keeps the guide and the simulator in step.** It fails when a control the guide names is
  not on the screen, a picture is missing or unused, a figure or table does not fit the page, the guide is older than
  any of its inputs (by content, including a file it looked for and did not find that has since arrived), the pictures
  come from another `dist/`, or the page count or sizes are out of range.
- **`node tools/gate.js --release`** runs the guide's check with the other suites: a release is not made with a
  guide that names a control the page no longer has. It is not in the everyday gate, since any change to the page
  makes the guide stale on purpose until it is rebuilt (the pictures retaken, the PDF printed again: megabytes each
  time).
- Found by the guide's builds on the way, and mended in the entries below: four stale sentences of the page, the
  boats' numbers drawn before the font, pumps that could not be put on a dry room, and the rule for lowering boats
  as the changelog gave it. Still open: the page cannot hold the doors open (backlog G1).
- In the main checkout, on this commit (18 November, 04:45 CST): the guide rebuilt with the search's figures pulled from
  the tree; `node tools/gate.js --only dist,guide`: PASS (the check: all ten).

### The first search for the Carpathia question (W5), 2026-11-18

`tools/carpathia.js` tries orders after the ice on the 1912 watch the way a player gives them, scores each night in
minutes afloat after the touch, and reruns the best nights on forty models with each guess moved inside its range. On
this model the best orders found keep her afloat 12.1 minutes longer (T+169.3 against 157.2), where she needed 107.9 as
the night went, 56.0 with the call made at once and 35.3 with five miles made good as well. The note:
`docs/research/RESULT_carpathia_search_v1_2026-11-18.md`; the best night: `out/carpathia_best.json`, with its address.

- **What it may order** is what the model has: a watertight door raised by hand (and dropped), the bridge's switch,
  pumps put on a room ('all', 'own', one pump) and handed back to the engineers, the engines ahead or astern for 5 to 60
  minutes, a boiler room's fires drawn. Not the tanks (not built), the boats or the wireless (a later search, W10).
- **A night forked, not replayed.** The watch is copied whole at the first step after the ice and the 1912 orders
  (step 482, T+1.0: `Night.forecastOf`) and each candidate runs on from the copy with its orders given on their steps
  through `Night.act`, as a replay's script gives them; fork and replay agree to the bit (test rows: orders of every
  kind, under way, and backed onto the ice).
- **The score** is minutes afloat after the touch, with her greatest list and when, the minutes the main dynamos
  stopped, she went dark and her engines were lost, and, for the nights shown, her list from T+5 to her last ten
  minutes (every foundering ends at the core's stop for a roll, 80.2 degrees) and her bridge. An order the model refuses
  is scored as the night it leaves and is not counted as carried out. A night in which an order backs her onto the berg
  ranks after every other: a second collision is no remedy.
- **The method, cheapest first:** one order at a time (690 nights), the handful together (a beam on a five-minute
  grid, refined to the minute), random restarts from a seed, a polish: 4,683 nights of a 6,000-night budget, about 90
  minutes on four to six threads. The same seed and budget give the same table with one thread or four; a night a line
  in `out/gate/carpathia/`, so a run cut off resumes.
- **What it found.** No single order buys more than about two minutes (the Court's "could not have prolonged her life
  appreciably", in the model's terms); pumps put on a dry room cost about one, because a bridge order takes the pumps
  from the engineers. The best night is all pumps: every pump that can reach holds 2 and 3 a minute after the touch
  (before the firemen's passage floods), boiler room 6 at 9 minutes and boiler room 5 at 26 (the engine rooms' pumps,
  which work to the end), one pump to boiler room 4 at 61: 2,545 t pumped against 269. Its gain holds on 29 of 40
  models; it falls to 5.8 if the holds' valves were lost at once and to 4.4 if the pumps ran on unattended.
- **Outside the orders.** Every door held open against its float (no order can do it) lasts to T+196.9, past the third
  target on 36 of 40 models, as a ship lying over 20 to 26 degrees for an hour and dark for her last seventy minutes,
  and short of the target with Empress of Ireland's door size. Backed onto the berg astern, the ice lets 1,600 t into
  the shaft tunnels and she lasts fourteen minutes longer: the model rewards water let in aft (D18).
- **The best night replays in the page.** Its address opens as a replay, all nine orders accepted; she founders at
  10,217 s in Edge, the model alone in the page's engine to the bit, 2.75 s from Node's (backlog X1); the card says
  2 h 49 min after the touch, the note's figure to the minute (`tools/night_end_site_test.js`, a new row).
- Tests: `tools/carpathia_tests.js` 13 MUST rows; `tools/night_end_site_test.js` 13 rows (one new). `node tools/gate.js
  --quick` and `--only night,systems`: PASS, their tables unchanged. In the main checkout, on this commit's tree (18
  November, 04:12 CST): `node tools/gate.js --only dist,night,systems,carpathia,night_end_site`: PASS, 5 of 5 (the
  search adds nothing under `core/` or `site/`: the other nineteen suites stand as at the commit before, where all
  24 passed). `tools/carpathia_tests.js` is in the gate from here on: 25 suites.

### The seams the parts worked round (S2, Y8, N2); faults of the page's layout, 2026-11-18

- **One way to give an order** (`TitanicApp.order(type, value, arg)`, `site/app.js`). The page's wheel, telegraph,
  doors, stokehold and pumps, and the parts' orders (the boats, the reports to the bridge, help), all take the watch
  over as the wheel does (`takeOver`, now on `TitanicApp` too), give the order through `Night.act` so that it is logged
  and replays, tell the parts (an `order` event: the order and what it returned) and return what it returned. The
  boats, the reports and help each had a copy, or none: a boats or report order given while the 1912 orders ran left
  them running and the watch not the player's. Now it takes the watch over; on the 1912 orders, given in the 23 s
  between the end of the encounter and the scripted Stop, it ends the Stop as the wheel would.
- **Y8: every order after the ice makes the watch replayable.** On a watch begun on the 1912 orders the wheel, the
  telegraph, a door, the stokehold, a pump or a part's order given after the ice enables "Replay my watch" (only a pump
  order did); `takeOver` does it.
- **A new forecast only after the model's own orders.** `core/night.js` exports `owns(type)`, whether an order is one
  the model carries out itself. After the ice the page asks for a new forecast at once after those, and for none after
  a reader's order (a boat, a report, a rocket), which changes nothing in the model; a takeover that drops scripted
  orders the model would still have carried out asks for one, since the last forecast ran them. A door order before the
  ice no longer asks for one: between the touch and the clear its line could tell how the night would end. The page
  counts its requests (`state.fcAsked`).
- **A pace hold for a part** (`TitanicApp.holdPace(seconds)`, `TitanicApp.pace()`): her own pace for that long, then
  the player's choice again. The reports part holds the pace this way instead of wrapping `state.speed`, which is now
  always the player's choice; the sound part reads the pace in force from `pace()`.
- **Handles for a part's view (N2).** A part's view may say `look` (a drag turns its eye: the page neither orbits, pans
  nor zooms, and Follow stays on), `fov` and `keep` (a new watch keeps it). The hull, the deckhouses, the berg, the
  smoke, the steam, her track and course and the marks of the damage are on `TitanicApp` by name, and the page's
  notices are heard as a `notice` event. The night part uses the handles in place of every search it made of the scene
  and every work-round (its suite as before, object by object); it had taken the earth's first group for the berg,
  which in a second watch could have been a boat parked on the earth. The reports part uses the marks, and no longer
  shows the openings' markers every frame over the Night look.
- **The page's layout** (1400 x 860):
  - "Draft fwd/aft" broke over two lines once the inflow had four figures, and values ran past the readouts' edge in
    the plunge. Each label and value is now one line: on a desktop the values are 13 px and the columns 10 px apart,
    and where even that does not fit (the plunge's last minutes at this size: her drafts "48.4 / -17.9 m") a value
    moves whole to a second row. A phone's readouts are as they were;
  - the boats' count is one line (it broke at 360 px), at most 480 px wide, breaking only between its parts: the people
    in the water make it two lines after she founders;
  - the end card stands below the boats' count instead of over it (on a phone, below the readouts and the count);
  - the faint red haze beside her in the Astern view is her funnel smoke, a warm dark grey laid where she was: over the
    X-ray look's blue-black it reads red-brown. Not a light: from there the port light is outside its arc and not
    drawn. Left as it is.
- **Found by the guide's pictures:** the boats' numbers were drawn before the page's font had loaded, in the font or
  its fallback from one load of the page to the next; they are drawn again once it has loaded, the same pixels on
  every load. And the Systems tab listed only rooms with water or pumps, so the page could not put pumps on a room
  before the water reached it (Y6's what-if: every pump on boiler rooms 4 and 5 three minutes after the touch, when
  boiler room 4 is still dry). On a watch it now lists every room an order can draw from, a dry one in a quieter form.
  Given from the page, that what-if founders 159.45 minutes after the touch, the model's own time in the page's engine
  to the bit; Node says 159.40 (two engines part in the last bits, backlog X1: with no order the 1912 watch founders at
  9,492.5 s in Node and 9,493.75 s in the page's engine).
- Tests: rows added to `tools/night_site_test.js` (1: a wheel order after the ice on the 1912 orders enables "Replay my
  watch", and the replay has the watch's fingerprint at step 1200), `tools/boats_site_test.js` (6: the readouts with
  four and five figures of inflow, the count and the end card, the labels on two loads, Y8 for a boats order, the
  forecast asked for after a pump order and not after a boat order or a rocket), `tools/reports_site_test.js` (1),
  `tools/help_site_test.js` (1), `tools/night_scene_site_test.js` (1: a right-drag from the crow's nest leaves Follow
  on) and `tools/systems_site_test.js` (1: the what-if from the page); the reports suite's pace row reads
  `TitanicApp.pace()` where it read `state.speed`. The gate on the lane's tree (18 November, 02:42 to 03:20 CST): all 24
  suites pass, in 37 min 20 s; one tracked table moved, as it should: `out/night_site_test.txt` gains the new row. The same gate on this commit's
  tree, in the main checkout (03:21 to 03:58 CST, a search running beside it): all 24 pass, in 37 min 13 s.

### Four readers of the night: the hull's gauge, the boats, the reports to the bridge, help, 2026-11-17

Four modules that read the watch and keep a state of their own beside it (`core/readers/`, the seam of the entry
below). None writes into the flooding, the motion, the ice or the plant: with each, the 1912 watch has the same
fingerprint at every one of its 37,970 steps as without, and the 1912 damage gives the golden trace byte for byte.
Each was built in its own lane with its own suites; each names what it guesses.

- **The hull girder's gauge** (`core/readers/girder.js`, a library; `site/parts/55_girder.js`; W7, step 7a). Her
  weight along her length in layers (boilers room by room, engines, coal, cargo, the hull as Prohaska's trapezoid),
  closing to the model's own mass and centre, and the bending moment of her hull at any instant, taken exactly about
  the section's neutral axis and relieved by her inertia when she moves.
  - The line in the readouts gives the moment in GN m and where it is greatest, on a bar that marks the range the
    studies give for what her hull could bear, 4.0 to 5.4 GN m: teal below it, amber within, red past it. Nothing
    breaks in the model yet.
  - What it says about the night: on the 1912 damage the moment rises from 0.88 GN m intact, enters the range at
    6.7 degrees of trim (2:11:45 am), reads 4.98, 5.14 and 5.28 at the record's 11, 13 and 17 degrees, and peaks at
    5.385. So the record's break falls at 5.0 to 5.3 GN m on this curve, inside the range.
  - The weight curve's end ordinate is 0.40 [fitted: it gives the one outside figure, the panel's C-7 moment of 4.64
    GN m at about 35,000 t aboard, to 0.5 %]; the research note's 0.566 put the note's 4.6 GN m at 7.6 degrees,
    before the record's 11 to 17. Britannic with her ports shut floats with 5.09 GN m, inside the range: a break at
    any capacity under that would sink a case that floats (backlog W7d).
- **The boats** (`core/readers/people.js`, `site/parts/50_boats.js`; W8): twenty boats by places and minutes, not by
  persons. Three fitted numbers (how readily people come forward below and above 3.5 degrees of trim; the minutes an
  officers' party gives a boat before lowering her). 14 of the 18 boats go within ten minutes of the record, and 664
  people are in them against the record's 671; boats 4 and 2 go 40 and 32 minutes early (the wait at A deck for its
  windows is not modelled). Orders: uncover, fill, lower, each logged and replayed; a refused order says why. No boat
  is lowered from a station within 2 m of the sea; boats are lowered at their full pace up to 3 knots, at half pace
  from 3 to 5, and not at all above 5 [bet: the note says 1; the model keeps 1 to 2 knots of way an hour after the
  touch, backlog M7]. Not fitted, reported as they are: the drop forward at T 60 is
  13.7 m against the record's 18 to 20; her list at boat 10 is 3.6 degrees against about 10 (the list gap, W6).
  What-ifs on the 1912 watch (711 in the boats as modelled): "fill her" on both sides from the first boat, 1,131.
- **Reports to the bridge** (`core/readers/reports.js`, `site/parts/60_reports.js`; W3): the night as the bridge
  knew it. A report is a fact of the model noticed by someone placed to notice it and carried to the bridge in the
  time that took; orders send a man to look, to sound, to ask. A feed of reports in the page, and a view "As the
  bridge knew it" in which no readout shows a number nobody has reported (off by default). On the 1912 orders five
  of the script's nine reports reach the bridge within five minutes of their time there; the mail room's are 17
  minutes late because No. 3 hold floods later in the model than in the record, and the commutator reads 1 degree
  where the captain read 5 (the list gap again). One fitted constant (the builder's man's "an hour to an hour and a
  half").
- **Help** (`core/readers/world.js`, `site/parts/70_help.js`; W9): the wireless, the rockets, the other ships. On
  the 1912 orders Carpathia hears at 57 minutes and is alongside at 265; Californian hears nothing; the eight
  rockets go up at the note's minutes. The set obeys the plant: a call after the dynamos stop is heard only once the
  battery is thrown in, and only within 150 miles. What-ifs against the research note: the call made at once, 213
  (note 213); five miles made good after the 1912 call, 244 (243); both, 192 (191). A rocket fired from the panel
  is logged, drawn and replayed; Carpathia's lights are drawn on her true bearing.
- With them: each reader names the key of its state in the sim, so the forecast's copy of the watch leaves it
  behind. `tools/gate.js` runs their eight suites (four headless, four in the browser).
- Tests: `tools/girder_tests.js` (9 MUST) and `tools/girder_site_test.js` (13 rows); `tools/people_tests.js` (14
  MUST) and `tools/boats_site_test.js`; `tools/reports_tests.js` (14 MUST) and `tools/reports_site_test.js` (13
  rows); `tools/world_tests.js` (21 MUST) and `tools/help_site_test.js` (11 rows). The gate (17 November, 22:03 CST):
  all 24 suites pass, on a scratch checkout whose `core/`, `site/`, `tools/` and built site are this commit's byte
  for byte (compared file by file; 37 minutes with a second gate running beside it). `tools/boats_site_test.js`,
  which its lane could not finish on the day's loaded machine, passes there, 9 of 9. In this checkout the build
  check, the four readers' headless suites and the watch's browser suite were run again; one line of
  `out/night_site_test.txt` moved: on a phone the readouts end at 152 px where they ended at 130, the hull gauge's
  line being one more.

### The pumps, the player's part (Y6), 2026-11-17

- **Orders to the pumps on a watch** (`Night.pump(sim, room, which)`, logged as `pump`; `pumpOrder` in
  `core/systems.js`). The player can put one pump, a room's own pumps, or every free pump that can reach it on a room;
  take one or all of them off; or hand the pumps back to the engineers. An order carried out takes the pumps from the
  engineers: their rules wait until the pumps are handed back, then go on from where the pumps stand.
- **Its times are the engineers' own** [bets, as in Y3]: a pump on its own room works 5 minutes after the order, one
  led through the bilge main 30 minutes after it (Wilding's "half an hour from decision to start" to couple a pump to
  boiler room 4). A pump taken off stops at once [bet].
- **What the research note says is so:**
  - steam scales every pump, and none can be ordered below 30 psi;
  - a room's suctions and the two 10-in mains limit what is drawn. A pump on its own room works at its full rate, as
    the rules have it; pumps led through the main draw what the suctions leave, at most 920 tons an hour in all;
  - the peaks have no suction;
  - the holds (113, 196 and 196 tons an hour) can be pumped by order while their valves can be worked. The valves
    stood in the firemen's passage, taken as flooded once the water in hold 2 or 3 is over its top (4.6 m) [bet]. On
    the 1912 watch that is 5.2 minutes after the touch; the Report has the passage holed in about 5;
  - a pump stops for good when the room it stands in floods, as before.
- **An order that cannot be carried out** changes nothing. It goes in the watch's log with its reason (`refused`), and
  says why in the event log and on the screen: no steam; no suction; the holds' valves lost; the pump's room flooded;
  the suctions or the mains full; no free pump.
- **With no order nothing changes, to the bit**: the 1912 watch on its orders, sunk, is `9546a25c` at step 37,970 and
  founders at 9,492.5 s, as before. A row of the systems suite holds that fingerprint.
- **The forecast after the ice runs a copy of the watch on** (`Night.forecastOf`, `Night.forecast`, in the forecast
  worker). Everything a step reads is plain data in the sim, so the watch is copied whole (about 0.9 MB, without the
  ship's geometry) and run on with no further order: its plant, the engineers' later orders, the player's orders, the
  scripted orders still to come and a hole made by hand all go with it, and its "founders at" is the watch's own, to
  the bit. Before, the worker ran the core alone from a snapshot: at the end of the 1912 encounter it said 156.25
  minutes after the touch, where the watch founders at 157.21. The readers' states stay behind (a reader names its
  key, `state`) and the copy runs without them: a forecast is of the model, which no reader changes.
- **The Systems tab** has a Pumps section: who has the pumps, and "Back to the engineers"; each room with water or
  with pumps on it (its water, what its pumps put out, each pump on it: at work, at work in N minutes, stopped);
  chips for its own pumps, every pump that can reach it, one pump, all off, one off; a room that cannot be pumped
  says why. A pump order after the ice enables "Replay my watch", for a watch begun on the 1912 orders too.
- **What they do on the 1912 watch** (Node): every pump on boiler rooms 4 and 5 three minutes after the touch: she
  founders 159.40 minutes after the touch, 2.2 minutes later than with the engineers' rules alone (157.21). Every
  pump that can reach boiler room 5 two minutes after the touch and boiler room 2's on boiler room 4, that one taken
  off at 20 minutes, the pumps handed back at 40: 158.23.
- At the merge: `pump` joined the orders the watch carries out itself beside the readers' seam; a shared address may
  carry pump orders (`site/parts/40_night_end.js` checks the room and the pump before they reach the model); the
  viewer's parts hear a pump order as an event.
- **The end-of-watch card moved clear of the readouts.** Its first picture showed it lying over the readouts' third
  line (and it would have covered the hull gauge's line to come). On a desktop it now stands at the right of the
  stage, under the view buttons; on a phone, just below the readouts, whatever lines they have.
- Tests: `tools/systems_tests.js` 33 MUST (8 new: no order gives the 1912 watch as before; the orders logged, one
  refused with its reason, the watch replayed bit for bit; the delays and the tons pumped; refusals for the holds'
  valves, no free pump and no steam, each changing nothing; the forecast equal to the watch run on after an order, at
  the end of the encounter, and with a hole made by hand). `tools/systems_site_test.js` 19 rows (4 new, real clicks:
  the order from the Pumps section in the watch's log; the tab showing it; the forecast printed after it equal to the
  watch run on; "Replay my watch" giving the same pumped night). The gate on this commit's tree (17 November, 22:05
  CST): all sixteen suites pass, in 16 minutes. One line of `out/night_site_test.txt` moved, as it should: after the
  drill by hand, whose engines are never stopped, the forecast now says 2:15 am where the core alone, which knew
  nothing of her way, said 2:16.

### The night at sea, seen and heard (two viewer parts), 2026-11-17

- **Night, a second look beside X-ray** (`site/parts/20_night_scene.js`). The grid sea gives way to a night sea: nearly
  black, a mirror of the faint sky that brightens towards the horizon, bent by a long slow swell that slides past her
  at her speed and turns with her heading. 7,000 stars reach the horizon, thinned by the air low down, and the glassy
  sea reflects them. The hull goes solid through the page's own X-ray switch, lit by starlight and by her own lights:
  a glow round her lit ports, her deck lamps abaft the bridge, her deckhouses. Her lit ports shine in the water, and
  through it where the sea has covered them; they go out with the dynamos. The berg is a dark mass a little paler than
  the sky, with no white at its foot, which is why it was seen so late; her smoke hides stars; her wake is faint. Off,
  everything is as it was, X-ray included (the suite compares all 247 objects of the scene). All of it is appearance,
  each choice marked in the file.
- **The eyes of people who were there.** Crow's nest: the lookouts' eye on the foremast, 29 m above the water at her
  draft that night [bet: about 95 ft], carried by her pose. Boat: someone in a lifeboat lying 300 m off her port beam,
  the eye 1.2 m above the sea, fixed to the earth: she moves on, or goes down, and the boat stays. Drag to look about,
  as on the Bridge; the mouse wheel or a pinch brings the boat nearer or farther. Her navigation lights keep the 1910
  arcs from both.
- **The ship heard** (`site/parts/30_sound.js`). Each sound's level is a stated function of a number in the model;
  only the timbres are the part's own [appearance], its invented numbers [bet]. Nobody has listened to it yet: every
  level is one line of `FULL` at the top of the file, to be set by ear.
  - Her own wind and the sea along her side: the square of her speed through the still air, full at 24 knots. On a
    flat calm the only wind on her bridge is her own, so when the engines stop the night goes quiet.
  - The engines: a low rumble under the beat, following the wing shafts' revolutions.
  - The ice: a grinding that follows the force of each step of the contact (read from the momentum the contact gives
    the berg, which agrees with the contact law's own impulse to 2.1e-4 on the 1912 watch): 40 MN at the first blow,
    7 to 10 along the grind. Nothing sounds before the touch or once she is clear.
  - The water coming in: a rush following the inflow in tons a minute, with a square-root knee.
  - Her structure: creaks as her trim moves, 30 for each degree, a process seeded by the night: two a minute early in
    the 1912 sinking, crowding in at the plunge.
  - The ship's bell: the half hours by the ship's clock, struck in pairs: eight bells at midnight, one at 12:30.
    Whether it was still struck after the collision is one constant [bet], true for now.
  - Where the listener is: on the Bridge and in the crow's nest the wind and the bell; below the waterline the
    engines and the water; from the boat everything faint. One volume control beside the sound switch, and a gentle
    limiter. Silent when switched off, paused, foundered or hidden; the beds fade as her time runs faster than her
    own pace and are gone by 8 times.
- **The sound wakes with the first tap or key anywhere.** A browser lets a page make sound only after one; until now
  only the watch's cards and buttons woke it, so a watch opened from its address and steered by the wheel alone was
  silent, the lookout's bell included.
- **Mended in the viewer:** a restart with X-ray off drew the bulkheads, their tops and their letters over the solid
  hull (`startSim` built them and never applied the look). Found by the night lane.
- Both parts read the model and feed nothing back: the 1912 orders watched in the Night look from the boat, and with
  the sound on, have the model's own fingerprint. Tests: `tools/night_scene_site_test.js` (13 rows: real clicks, a
  drag, a turn of the wheel; six pictures in `docs/evidence/night_scene/`) and `tools/sound_site_test.js` (19 rows:
  each level against its law and the model's own figures, the bells counted, the creaks replayed from the model
  alone). The gate on this commit's tree (17 November, 21:37 CST): all sixteen suites pass, in 19 min 13 s on a
  loaded machine.
- **The watch's browser suite reads the watch on the step she clears the ice.** It read it a frame or more later, so
  the fingerprint it printed for the drill by hand was that of whatever step the page had reached: step 389's in two
  of the day's runs (the same as the 1912 orders', as it should be: the drill by hand gives the night's own orders on
  the same steps), a later step's in a third, and the tracked table's line changed from run to run. The page's clock
  is now stopped on that step, the watch read there, and the clock goes on.

### A ship lying by the ice no longer pays for it (X2); the night takes readers, 2026-11-17

- **The contact looks only at the stations within reach** (`core/encounter.js`, `ICE.cull`; backlog X2). Near the
  ice the model takes forty sub-steps a step, and on each it went through every station of her side: 12,306 of them,
  three bands deep, both sides, each with a square root and an arctangent once it lay within 140 m of the berg's
  centre. A ship that stayed by the ice paid that for the rest of the night: after a stem strike a step cost 12 ms
  where a step in open water costs 0.12, and each run of the encounter suite that leaves her in the ice for eight
  hours took about twenty minutes of one core.
  - A station can matter only while it is nearer the berg's centre than its band's radius as the berg was made (the
    outline only ever crushes back from there) plus the smallest gap so far: farther off it neither touches the ice
    nor sets a new smallest gap. Those are now passed over, first a stretch of hull at a time (the berg's centre in
    her own axes gives the stretch that can be within reach), then station by station.
  - The outcome is the same to the last bit. A new row of the encounter suite runs eight nights both ways (the old
    loop is `ice: { cull: false }`) and hashes her motion, the smallest gap, the contact and the flooding at every
    step, and at the end every dent, every node of the ice's outline, every opening and the water in every space.
    Sixteen nights were compared the same way while it was written (stem strikes square and oblique, grazes on
    either side, slow drifts on to the ice, misses, a berg that turns, a fixed face): all the same. The area
    constant's fixed point is where it was (`node tools/calibrate_encounter.js`: 0.20701033996361745 gives
    0.750600000 m2). The tracked tables are unchanged but for their new rows: the encounter's rows and what-ifs, the
    night's rows and its table of other watches. The three 200-night sweeps were started as this was committed; their
    verdict is in `BACKLOG.md`'s log.
  - After a stem strike a step by the ice now costs 0.19 ms: the flooding's 0.11, her motion's forty sub-steps
    (kept, so that the bits are kept) and the bookkeeping of the openings. On the evening this was written the
    laptop was shared with a dozen other test runs: the old encounter suite had been given 708 s of processor in 48
    minutes and was not near its end; the new one ran in 2 min 21 s, the night's suite in 40 s where it had taken
    5 min 21 s, and the whole gate in 11 minutes.
  - One thing learned on the way: in one JavaScript engine the new path runs about four times slower once the old
    loop has run in the same thread (the engine stops optimizing a function it has seen both ways). Only a test
    does that; the suite gives each run its own thread and runs the both-ways nights last.
- **The night takes readers** (`core/night.js`, "readers"; `core/readers/*.js`). A reader is a module that reads the
  night and keeps a state of its own beside it: the boats, the reports to the bridge, the other ships, a gauge on the
  hull girder. It registers with `TitanicNight.reader({ name, attach, step, orders, valid })`, is attached to every
  watch and stepped after the model's own step, and may own order types of the watch's log, so that its orders
  replay with the helm's. It never writes into the flooding, the motion, the ice or the plant: a watch has the same
  fingerprint with every reader and with none (`create(ship, spec, { readers: false })`), and a row of the night's
  suite holds it to that with a reader made for the test. An order of a reader's given to a watch without readers
  goes in its log and does nothing else, so a log holding such orders replays there too. The build bundles the
  folder after `core/night.js`, into the page and the forecast worker. No reader ships with this entry; four are
  being built.
- **The Bridge now says "On the ice" while she is on it.** The lookout's box compared the time of the last contact
  with her clock for equality, which was never true (the contact stamps the sub-step it acted in), so the box went
  on giving the range through the whole contact. Found by the sound lane; the watch's browser suite has a row for it.
- **Sentences that had gone stale** (found by the guide's build, which reads the page): the Run tab's hint and the
  README gave the 1912 watch 159 minutes (the model has said 157 since the pumps); the Systems tab had a room's fires
  drawn "in about ten minutes [bet]" where the plant takes twenty [read]; the Evidence tab still listed the pumps
  among what the model leaves out.

### One command for every suite; the viewer takes parts; P5's browser suites, 2026-11-17

- **The gate** (`node tools/gate.js`): every suite with one command and one verdict line each. The headless suites run
  four side by side, then the browser suites alone and in turn. `--quick` is the fast ones (about half a minute),
  `--sweeps` adds the three 200-night sweeps, `--only a,b` picks, `--list` names them.
  - A suite is PASS, FAIL or STALE. Stale means it passes, but a table it prints or writes is no longer the one
    tracked in `out/`. That fails the gate too: a commit should carry the tables its code produces.
  - Nothing tracked is written unless `--write` is given. The tools that write a table now write where `TITANIC_OUT`
    says (`tools/outdir.js`), and the gate points them at `out/gate/`, which git ignores.
  - The frozen references (`out/seams_reference.json`, `out/headway_reference.json`) are never touched by it.
- **Is `dist/` current?** `node tools/build_site.js --check` writes nothing and says whether `dist/` is the build of the
  sources as they stand (the bundles are named by their content). The gate runs it before the browser suites, which
  test `dist/`. `dist/version.json` gained `sourcesCommitted`: whether the bundled sources were as the named commit has
  them when the build ran. A build made before its commit names the commit before it; P5's did, and said nothing.
- **The watch's browser suite no longer depends on the machine's load.** Its two hand-clicked drills waited on a poll
  for the moment to click, and at the 1912 point a quarter of a second is another collision. On 17 November, on a busy
  laptop, the same commit gave 0.667, 0.705 and 0.671 m2 where the night's own orders give 0.7506, and the forecast
  moved from 2:16 am to 2:51, 2:32 and so on; the row's band of 0.4 to 2.2 m2 let all of them pass.
  - The clicks are still real clicks on the real controls, but the page's clock is now stopped on the exact step
    first (a part's `step` hook, below). The drill by hand is the night's own to six digits on every run, and the row
    asks for that.
  - This is backlog item P3e seen from the page: a quarter of a second in reversing the wheel is half an hour of her
    life. The item stays open.
- **The viewer takes parts** (`site/app.js`, "parts"; `tools/build_site.js`). Any `site/parts/*.js` is bundled after
  `site/app.js` in name order, a `.css` beside it joins the styles, and it hooks the viewer through `TitanicApp.on`:
  - `reset` (a run loaded), `step` (one step of the model), `frame` (a drawn frame);
  - `event`: the bells, the touch, the ice passed, foundered, each order given, each line of the model's log, the
    camera chosen;
  - `camera`: a part may place the camera for a view of its own.

  A part reads the model's state and draws or sounds it; it never feeds anything back. One that throws is reported
  once and dropped, and the page carries on. The frame loop now stops stepping on the very step a part pauses the run.
  With no parts the viewer is as it was.
- **The end of a watch, and a watch you can hand on** (`site/parts/40_night_end.js`, the first part).
  - When she founders, lies steady with water aboard, or has passed the ice untouched, a card says what happened in
    plain words: when she went and how long after the touch, beside the record's own 2 h 40 min; what the ice did;
    when the first order came; her lights; what her pumps put over the side. Every figure is read from the model.
  - "Copy a link to this watch" puts the night's seed and the orders given into the address
    (`#night=1912&log=...`). A night is its seed and its orders, so the link replays the same watch: the same
    fingerprint at the same step on the same engine.
  - An address is something a stranger may have written, so its orders are checked before they reach the model:
    an order the model does not have, a rudder angle past the stops, a door that is not there, and the whole log is
    refused and the night opens without it.
- **Suites that share their runs among threads.** The encounter suite's two dozen runs are independent nights, and so
  are a sweep's seeds: `node tools/encounter_tests.js --jobs 4` (the default) and
  `node tools/night_sweep.js 200 1 hard --jobs 4` give tables that are the same to the letter as before, since each
  night is its seed and its orders; only the time taken differs. The encounter suite needed it: since P3c it cost
  more than twenty minutes of one core for each run that leaves her stopped on the ice (X2, the entry above, ends that).
- **P5's browser suites, left unrun at its commit, pass.** `visuals_site` 19 of 19, `systems_site` 15 of 15 and
  `night_site` 16 of 16 at `126f70a` (17 November, 15:29 CST), and again through the gate on this commit.
- Tests: `tools/visuals_site_test.js` gained a row for the parts' hooks (20 rows). The gate on this commit's tree
  (17 November, 21:12 and 21:24 CST): all fourteen suites pass. `out/night_site_test.txt` was rewritten: the drills'
  rows are reworded and the drill by hand has another fingerprint (its orders now fall on exact steps), there is the
  new row, and night 16's bow reads 19.61 m where the table said 19.62: that figure moved with P5, whose browser
  suites were not rerun at its commit (the loop over every station gives the same 19.611856961 m as this commit).
  Two faults of the browser suites themselves were found and mended on the way: a click on the panel given one try
  and five seconds, which a loaded machine lost, is now made again until it takes; and a row of the new suite read
  the watch's log after the night had been started afresh.

### Flooding at speed (P5, Tier 0), 2026-11-17

- **The sea's pressure at each hull opening while she moves** (`seaHeads` in `core/motion.js`; the brainstorm's Tier 0,
  `docs/BRAINSTORM_ship_under_way_v1_2026-11-16.md`, section 5). It acts through the core's seam `hx`, the outside
  level at an opening. Before every step of the core:
  - The outside level rises by C_p U^2 / 2g, with U the water's speed past the opening and C_p the stagnation share of
    the plating's angle to that flow. C_p is sin^2 of the angle at which the water meets the plate: 1 head-on, about
    0.02 along the 1912 damage, and 0 where the water leaves the plate (no suction in Tier 0) [bet].
  - A crushed bow faces the flow: C_p 1 ahead [bet].
  - Near the stem the bow wave adds its rise: 0.55 U^2/2g at the stem, falling to nothing 30 m aft and with depth as
    exp(-g d / U^2). That is the brainstorm's 3 to 4.5 m at 22 knots and about 1 m at 10, and 0.60 of it at 7 m deep
    at 22.5 knots [bets].
  - The discharge factor `cm` stays 1. The loss of a compact hole in a cross-flow (the brainstorm's section 5.3) waits
    for its source to be read.
- Stopped, every head is exactly 0: the seams gate passes as before, and so does the trials' coupled run.
- **What it does** (experiment e24, on the watch with the plant and its pumps):
  - the 1912 watch on its reconstructed orders founders 0.30 minutes sooner (157.11 min after the touch);
  - with the bridge taking over 30 s after the touch and holding Full ahead, 3.7 minutes sooner (Half 2.2, Slow 0.7);
  - a 0.2 m2 hole in the forepeak's side lets in 2 % more water at 10 knots, 10 % at 15 and 34 % at 22.5.
  - The 1912 damage is mostly slits along the flow, and the bow wave near the stem is most of the effect. The
    brainstorm measured the same: for the night as it happened, speed is a second-order effect.
- The water let in during the contact moves her a little, so the 1912 encounter's area constant was refitted
  (`ICE.alpha` 0.20714452400484218 to 0.20701033996361745). The headway reference was refrozen on purpose: the 1912
  watch and night 7 carry openings at speed (43b4a993, 66c95f35; they were a488fd17, 000f041d). Runs with no damage
  are unchanged.
- The three 200-night sweeps were run again. Their tallies are unchanged at every level and every reaction time; single
  cells move a little (opened areas in the second decimal, with the refitted area constant; clearances).
- Tests: `tools/trials.js` gained three P5 rows: a crushed bow takes the whole dynamic head; a slit amidships takes next
  to nothing, and exactly 0 stopped; a bow hole takes more water at speed. `tools/trials.js` 17 of 17 MUST;
  `tools/astern_tests.js` 14 of 14 after the refreeze; `tools/seams.js` passes; `tools/systems_tests.js` 25 of 25;
  `tools/visuals_tests.js` 34 of 34; `tools/encounter_tests.js` 8 of 8 (7 of 7 CHECK); `tools/night_tests.js` 14 of 14
  (2 of 3 CHECK, P3e as before). `dist/` rebuilt; the browser suites were not re-run for P5 (Bo's quota ran short).

### The pumps (Y3); the flooding refitted with them, 2026-11-17

- **Her steam bilge pumps.** They are sourced in `docs/research/RESEARCH_pumps_bilge_ballast_v1_2026-11-17.md`, from the British Report, the inquiry
  testimony and Halpern's reconstruction:
  - five ballast-and-bilge pumps of 250 tons an hour and three bilge pumps of 150, 1,700 tons an hour (0.47 m3/s) in all;
  - the ash-ejector pumps of boiler rooms 6 and 4 on the bilges as well, about 150 each (Wilding's estimate);
  - all on steam, none on the dynamos;
  - each compartment's suctions limit what can be drawn from it;
  - the holds' valves stood in the firemen's passage, holed within minutes, and the peaks had no suction.
- **The core** (`core/core.js`) has scheduled pumps, idle with nothing scheduled:
  - a pump draws from the bottom of its zone, both sides in proportion, down to its strum (0.1 m over the lowest point);
  - it stops for good when the room it stands in floods 2.3 m deep (about 1.5 m over the plates: its crew has gone)
    [bets];
  - `sim.pumpScale` is the share of its rate the steam allows;
  - readouts give tons a minute and tons pumped;
  - snapshots carry the schedule.
- **The 1912 damage preset** (`core/scenarios.js`) carries the night's own schedule: boiler room 5's 250 from 10 minutes,
  and boiler room 4's ash-ejector pump with boiler room 3's 250 through the main from 30 minutes, held to boiler room 4's
  suctions. Nothing in boiler room 6 or the holds.
- **The plant** (`core/systems.js`) runs them on steam: nothing below 30 psi, their full rate above 80 [bet]. On a ship
  under way the engineers put them to work:
  - water in a room puts its own pumps on it 5 minutes later;
  - 30 minutes later, unless the room is lost by then, pumps from rooms still dry are led to it through the main, nearest
    first, up to its suctions and what the mains carry [bets];
  - on the 1912 watch, boiler room 6's pump works from 6 to 10 minutes, boiler room 5's from 6 to 26, and boiler rooms 4
    and 3 when the water reaches them.
- **What they do** (experiment e22): on the 1912 damage, the pumps as worked put 367 t overboard and keep her afloat
  2.5 minutes longer. The note estimated 2 to 11 minutes, and the Court found they "could not have ... prolonged her
  life to any appreciable extent". Every pump able to reach the bilges, never abandoned, would buy 21 minutes.
- **The flooding refitted with them**, as Y3 asked: `tools/calibrate.js 45 --fix-area`, the opening held at 0.7506 m2 so
  that the encounter's area constant stays.
  - The three flow parameters move: `wMul` 1.182 to 2.735, `aDown` 0.277 to 0.280, `fOpen` 0.0101 to 0.01411. The
    score J falls to 9.49, from 10.41 fitted without the pumps and 12.80 for the pumps on the old values.
  - The refit's gain is the trim at 2:15 am: 10.05 degrees against the observed 10, where it was 7.1. The same refit
    without the pumps reaches only 10.34, at `wMul` 1.377.
  - `wMul` (the E-deck paths) is weakly held by the record: the score is nearly flat in it (e23).
  - The 1912 preset founders at 156.94 min, 2:17 am as before (157.34 without pumps on the old values). The 1912 watch
    founders 157.4 min after the touch (158.6). Both are in the record's 157 to 160.
  - Every validation case keeps its verdict (e23); the sinking times move 0.6 to 4.7 minutes earlier.
  - `out/validation.json` and `out/golden_titanic.json` are regenerated (golden: founders 156.94 min).
- **Gates kept honest.** The seams gate and the trials' coupled run prove the core neutral with its later inputs switched
  off. They now run the 1912 damage without its pumps, on the flow parameters their reference was frozen with:
  `tools/seams.js` passes as before. `tools/calibrate.js` gained `--fix-area` and `--no-pumps`.
- **The Systems tab** has a Pumps row: idle, being rigged, how many at work and tons a minute, or stopped (rooms
  flooded, no steam). The hint names what they need.
- Tests:
  - `tools/systems_tests.js` 25 of 25 MUST. Five new rows: the 1912 pumps against none; a leak the pumps master, held at
    the strum; no steam, no pumping; the engineers' orders under way; none on the intact ship.
  - `tools/trials.js` 15 of 15 MUST; `tools/astern_tests.js` 14 of 14 (the headway reference to the bit: the pumps start
    minutes after the touch); `tools/visuals_tests.js` all pass.
  - `tools/encounter_tests.js` 8 of 8 MUST (7 of 7 CHECK; the 1912 encounter sunk by the core alone, no pumps, 156.1
    min); `tools/night_tests.js` 14 of 14 MUST (2 of 3 CHECK, P3e as before), its fingerprints unchanged.
  - The three night sweeps are unchanged: the pumps start minutes after the touch, and the refit acts later still.
  - In the browser: `tools/systems_site_test.js` 15 of 15 (a new row: seven minutes after the touch on the 1912 watch,
    boiler rooms 6 and 5's pumps at work, and the Systems tab says so); `tools/visuals_site_test.js` 19 of 19;
    `tools/night_site_test.js` 16 of 16; `dist/` rebuilt.
  - The 1912 preset's forecast now reads 2:16 am (156.94 min, 2:16:56), 2 h 37 min after the damage; it read 2:17.

### The bow crushes at a force rising with depth (S1b), 2026-11-17

- In a stem strike the bow now crushes at F = 84 MN + 2.5 MN for each metre already crushed (`ICE.bowF`, `ICE.bowFk`
  in `core/encounter.js`), where it crushed at a constant 120 MN. The law is the bow-crushing note's option B
  (`docs/research/RESEARCH_bow_crushing_head_on_v1_2026-11-17.md`, section 6): a line through the mean of four
  section-based crushing laws applied to her own bow (static 49 + 1.5 MN a metre), times 1.7 for mild steel's
  strengthening at the strain rates of a collision. The constant matched Wilding at full speed but crushed too little
  in a slow strike.
- Experiment e21 runs head-on strikes at 6.2, 10, 15 and 22.5 knots under both laws. Against a fixed face (a berg too
  heavy to move) the model gives the note's own figures: 7.3 m at 10 knots and 29.0 m at 22.5 (the note: 7.3 and
  28.8; Wilding's "80 or perhaps 100 feet" is 24 to 30 m). At 10 knots the section laws give 5.5 to 11.5 m, and the
  one finite-element study of her 24.7 m. Against the model's 100,000-t berg, which gives way:

  | knots | constant 120 MN | 84 + 2.5 s MN |
  |---|---|---|
  | 6.2 | 1.6 m | 2.2 m |
  | 10 | 4.2 m | 5.6 m |
  | 15 | 9.9 m | 12.1 m |
  | 22.5 | 21.6 m | 23.0 m |

- **The berg's face stays rigid in a stem strike**, now decided and labelled a bet. The side law's pressure-area
  relation would let the ice yield first, up to about 400 m2 of contact, but no ice law is calibrated at a stem
  strike's 100 to 500 m2. Wilding's estimate and the finite-element study both crush the bow against an unyielding
  face. The Arizona (1879), where both bow and ice gave way, crushed 6 m.
- The 1912 encounter never meets the bow law. The area constant refits to the same bits (0.20714452400484218), and
  the headway reference, the 1912 watch and its sinking are unchanged. Stem strikes change a little:
  - the 1912 berg met dead ahead with no order crushes 22.9 m (21.6 before), and the core floats her;
  - in the 1912 night's miss window, the orders 25.5 and 30.5 s after the bells crush 13 and 20 m (11 and 19);
  - in the encounter's what-ifs, the helm 5 and 10 s late crushes 13 and 20 m (11 and 19), and straight on 22 m (20).
- The three 200-night sweeps were run again (`out/night_sweep.txt`, `_early`, `_night1912`). Their tallies are
  unchanged at every level and every reaction time: the law changes how far a bow crushes, not which nights strike
  stem-first. The 170, 88 and 166 stem strikes crush 1.5 to 1.8 m more on average (13.1 to 14.8 m on the default
  level), each 0 to 3 m more.
- Tests: `tools/encounter_tests.js` 8 of 8 MUST (7 of 7 CHECK). New rows check the force against its depth, the
  fixed-face crush at 10 and 22.5 knots against the note's figures, and a slow strike into the berg. `tools/night_tests.js`
  passes 14 of 14 MUST (2 of 3 CHECK, P3e as before); night 16, a stem strike, has a new fingerprint.
  `tools/night_site_test.js` passes 16 of 16 on the rebuilt `dist/` (night 16 from the seed box: bow 19.62 m, the page
  and Node agreeing). Also closed: Y1's viewer part (plumes at the escape pipes and the roar) was built with P3c and is
  checked by `tools/systems_site_test.js`; its backlog row had been left behind.

### The screws' stations read from a plan of 1911 (R2), 2026-11-17

- No text gives the screws' stations fore and aft, but a plan does. The side elevation of Olympic and Titanic printed in
  *Engineering* (vol. 91, 26 May 1911; Wikimedia Commons, public domain) draws her stern below the waterline in dashed
  lines: the rudder, the aperture in the stern frame with the centre screw in it, and the starboard wing screw forward
  of the frame. It was read in the browser by scanning the image's pixels against its own scale of feet, 3.97 px a
  foot (experiment e20). Its registration at the stern was checked first:
  - watertight bulkheads P, O and N fall within 0.2 m of the model's;
  - the double bottom reads 5.23 ft (63 in) and the length between perpendiculars 851.7 ft (850);
  - its rudder lies within 0.4 m of R1's trace of the castings photograph.
- What it gives, against the drawing until now:
  - the wing screws' hubs 9.72 m ahead of the rudder's stock (6.74 m, set by a clearance of 0.15 of a diameter to the
    model's hull [bet]);
  - the centre screw 3.03 m ahead of the stock (1.9 [bet]) and 3.75 m above the keel (4.82, the turbine's axis, R1);
    at 4.82 m its blades would reach 7.41 m, above the plan's arch at 7.24 m;
  - the aperture 0.77 to 4.34 m ahead of the stock and 0.94 to 7.24 m up (0.3 to 3.6 and 1.9 to 7.9 [bet]);
  - the wing hubs 3.63 m up against R1's 3.80, within the reading: kept.
- **Moved**, by R2's rule (more than a metre): both stations and the centre screw's height, and the aperture with the
  screw it holds. The centre shaft is drawn falling 1.07 m from the turbine to its screw [appearance]. The model's hull
  still clears the wing discs there, by 0.45 m. The stations now live in one table, the plant's (`core/systems.js`
  `PLANT.screws`, which says when the screws break the surface as her stern rises); `site/visuals.js` draws from it,
  and the clearance bet and the search that used it are gone. Read and not moved: the rudder's heel, 0.65 m above the
  keel on the plan against the drawing's 0.30 [bet].
- What it changes: only the screws' immersion once her stern is high, so the intact ship and every headway run keep
  their bits (`tools/systems_tests.js` 20 of 20, `tools/astern_tests.js` 14 of 14, the 1912 watch included). Sunk by
  the core, the 1912 watch founders 158.6 minutes after the touch with the same fingerprint as before (e5970f5d), and
  `tools/night_tests.js` passes 14 of 14.
- `tools/visuals_tests.js` checks the stations, the plant's discs against the drawing's, the wing discs outside the
  hull and the centre screw inside its aperture (34 rows, all pass). In the browser: `tools/visuals_site_test.js` 19
  of 19, `tools/systems_site_test.js` 14 of 14, `tools/night_site_test.js` 16 of 16; `dist/` rebuilt.

### The period resistance curve read; Holtrop's shape kept (M6), 2026-11-17

- Gertler's reanalysis of the Taylor Standard Series (DTMB Report 806, 1954), a cruiser parent of her own era, has its
  coefficients only as charts. The chart this hull needs (B/H 3.00, Cp 0.68, the low-speed range; Internet Archive
  item DTIC_AD0224171, leaf n195) was read in the browser by scanning the page image's pixels (experiment e19).
  Along a row at each speed, the chart's own gridlines and zero edge give the local scale, since the scan leans
  about 0.8 degree, and the thick curves give the residual coefficient for volumetric coefficients 1 to 7 x 10^-3.
  At this hull's 2.75 x 10^-3 that is 0.446, 0.447, 0.450 and 0.737 x 10^-3 at Froude 0.149, 0.156, 0.184 and 0.226.
- Through the period-curve note's worksheet and rule (`docs/research/RESEARCH_period_resistance_curve_v1_2026-11-17.md`,
  section 2.3), the period curve gives 60 rpm 18.19 knots (Holtrop's shape: 18.20), Half 15.16 (15.31) and Slow
  8.10 (8.25). It fails the 60-rpm rule as Holtrop does and also loses Slow ahead, so Holtrop's shape stays.
- Two independent shapes agreeing on 18.2 knots at 60 rpm put the question in the consensus's band (17.3-18.0, from
  one light-draft "about 18 knots" corrected for draft as if at constant thrust). M6 now holds only that.

### The engines' cranks (V8) and the wash's zone (R3) from sources; P3b's seams along the hull measured, not adopted, 2026-11-17

- **V8, the engines' crank angles** (`site/visuals.js`; `docs/research/RESEARCH_screws_wash_engines_v1_2026-11-17.md`).
  Samuel Halpern gives the balanced engines' sequence: HP at the top, the IP 106 degrees later, the forward LP 100
  after that, the aft LP 54 after that. His own source is not given. The drawing's offsets are now 154, 0, 254 and
  100 degrees (LP forward, HP, IP, LP aft); they were an even 0, 180, 90, 270 [bet]. With them the primary forces
  cancel when the HP and IP moving parts each weigh 1.48 times an LP's [derived in the note]. The port engine is
  now the starboard's mirror image, its offsets negated, as outward-turning twin screws were built; before, its
  pistons rose in the reverse order. The rods stay 4.5 cranks long [bet: not found; 3.5 to 5 in the period].
- **R3, the wash's zone** read in a 2024 review of the German method (Fuehrer, Pohl and Roemisch): the efflux
  1.59 n D sqrt(K_T), which the drawing already had within 0.4 %; the speed flat to 2.6 diameters, then falling as
  2.6 (x / D)^-1. The zone goes from 2.5 diameters to 2.6, and the wash reaches amidships at 217 s in the crash stop
  (`tools/visuals_tests.js`). R3 stays open for the original papers. R2, the screws' stations fore and aft, is still
  not found in any text; two photographs that could be measured are located.
- **P3b, the means: seams that open at another dent along the hull** (`ICE.tearAlong` in `core/encounter.js`: regions
  in the ship frame, each with a factor on `dTear`; each station carries its own tearing dent, which the viewer and
  the encounter suite now read). It is unset, so nothing changes: the headway reference and the area constant are as
  they were, to the bit. Experiment e18 measures it on the 1912 encounter at its committed point, the opened area
  refitted to 0.7506 m2 each time:
  - weaker seams in the forward 20 % of the hull (factor 0.75 to 0.35) move the damage forward: the split error
    becomes 45 to 61 points and she sinks in 175 to 204 minutes;
  - in the forward 30 % the split improves to 25 to 26 points (29 now), and she sinks in 165 to 169 minutes.

- **P3b, measured with the record and not adopted.** The research note
  (`docs/research/RESEARCH_hull_strength_along_length_v1_2026-11-17.md`) finds the front and rear fifths hand-riveted
  with wrought iron of a cheap grade (about 9 % slag, McCarty and Foecke), the midbody machine-riveted with steel. It
  gives a factor of about 0.7 (0.4 to 0.9) on the tearing dent there, ramped across No. 3 hold and the electric
  engine room: medium-high confidence that the ends were weaker, low confidence in the number. With that layout:
  - the 1912 encounter at today's point opens its damage forward: split error 48, sunk in 179 minutes;
  - searched again with it (e17b, `--ice`), no point founders inside the record: the best twenty sink in 169 to 225
    minutes with split errors 48 to 62 (today: 158.6 minutes, 29).

  The weaker bow moves the tear into the holds, where the calibrated 0.7506 m2 sinks her slowly. Those points do agree
  across courses better (0.3 to 2 %). The seams stay uniform, and `ICE.tearAlong` stays unset for better numbers, or
  for a calibration that fits the opened area to the timeline instead of to the hand-made damage.

### How hard a drawn night is (G1); the bow's crushing force sourced (S1); a period resistance curve sought (M6), 2026-11-17

- **G1, three levels for the drawn nights** (`LEVELS` in `core/night.js`). Each level maps the same draws to its own
  spreads, so a seed keeps its berg's size, depth, height and clock, and only where the ice lies and when it is seen
  change. "Any night" (`hard`) is the generator as it was and the default: every seed's night without a level is the
  night it always was, so the generator's version stays 1 and the headway reference's night 7 is unchanged to the
  bit. "Seen early" sights the ice from 1912's 457 m out to 1.6 times it. "Like 1912" sights it at 0.9 to 1.1 times
  457 m with the berg's centre within its radius plus 10 m of her track, so nearly every night needs an order [bets].
  - The Run tab has the choice beside her speed. The address carries it (`#night=16&level=night1912`), and Restart,
    Same night, the 1912 orders, Replay and the table of other watches keep it.
  - `node tools/night_sweep.js 200 1 <level>` writes a table per level (`out/night_sweep_early.txt`,
    `out/night_sweep_night1912.txt`; the default's stays `out/night_sweep.txt`). Of 200 nights, an order 10 s and
    20.5 s after the bells clears 76 % and 49 % on Any night; 100 % and 89 % Seen early; 97 % and 34 % Like 1912,
    where with no order no night clears (70 % put the stem into the ice).
  - Tests: a night-suite MUST row (the default equals Any night for 1,000 seeds; each level inside its spreads; a seed
    keeps its berg and clock), and a browser row: "Like 1912" and night 16 by real clicks, the page and Node agreeing.
    The browser's 1912 drill now waits for the page to take a click before the next, after a race in the test.
- **S1, the bow's crushing force against its sources** (`docs/research/RESEARCH_bow_crushing_head_on_v1_2026-11-17.md`).
  120 MN is kept, now with its citations. Wilding's estimate is 108-141 MN against a fixed face; section-based
  crushing laws on her own bow give 100-152 MN with steel's rate effects; the one FE study of her, with weakened
  riveted joints, gives about 62 MN. The what-if range is 60 to 150 MN. The force's height is raised from 5 m above
  the keel to 13, the centroid of the crushed section's steel [derived]. At 5 m it acted 5.8 m below her centre of
  gravity: an oblique stem strike heeled her 17 to 27 degrees for a moment (nights 2 and 11), where she now heels 2
  to 3. The damage hardly changes: the contact does not use her heel, only her mass, which the heel moves a little
  through the water already aboard. Nights 2 and 11 are the same to four figures, and the straight-on what-if leaves
  45 dents where it left 46 (`out/encounter_whatifs.txt`). The note also offers a force rising with
  depth for slow strikes, and points out that the stem law's rigid berg and the side law's yielding ice contradict
  each other: BACKLOG S1b.
- **M6, a resistance curve of her period, sought** (`docs/research/RESEARCH_period_resistance_curve_v1_2026-11-17.md`).
  Gertler's Taylor-series coefficients for her hull exist only as charts; they are located, and eight readings would
  settle it. On everything else checked, Holtrop's shape stays. The note also finds that the consensus corrected the
  light-draft trial as if at constant thrust: at fixed revolutions the model's screws make the trial's "about 18
  knots" about 17.8 at the night's draft, which would put the model's 18.18 within "about". M6 stays open with those
  two steps. A correction from the note: M3's cubic fits Holtrop's shape within 0.84 % as used (0.5 % was the fit
  before its renormalisation), now so stated in `core/motion.js` and e16.

### The watertight doors need the dynamos, and their floats (Y2), 2026-11-17

The plant research note (section 7) had the facts:
- twelve doors at the tank top, held open by friction clutches;
- dropped all at once from the bridge by electromagnets, which needs current;
- falling by their own weight through oil cataracts in 25 to 30 s;
- without current, a float under each room's floor drops the doors into it when water comes in, and a lever at each
  door works by hand;
- reopened by hand with a pump handle, the bridge's switch off.

Before Y2, "Close all from the bridge" worked in the dark, and a door toggled in the viewer during a watch went into
no log, so a replay lost it.

- **The core** (`core/core.js`) gains `releaseDoor`: a released door falls shut over `params.doorFall` (25 s [bet]) and
  counts as open until it lands. An armed float (`sim.doorFloat`) releases the doors into a space once water stands
  `params.floatDepth` (0.5 m [bet]) over its lowest point, on either side. Floats are unarmed unless the plant arms them,
  and with every door shut the new pass does nothing. The seams gate, the golden 1912 trace and the validation table
  are therefore unchanged. Snapshots carry the floats and the falls, so the viewer's forecast sees them too.
- **The plant** (`core/systems.js`) arms the floats of the eleven bulkheads with tank-top doors (D to O). A door a
  scenario holds open (Britannic's jammed D and E, the "doors left open" what-if) stays unarmed. `bridgeDoors`
  releases them only with current from the main dynamos, and otherwise refuses and logs it. `openDoor` raises one by
  hand and turns the bridge's switch off; `closeDoor` drops one by its lever.
- **The watch** (`core/night.js`): a door by hand and the bridge's switch are orders in the log (`door`, `doors`), so a
  watch with them replays bit for bit; `Night.doors` returns false when the switch had no current.
- **The viewer**: the Bulkheads tab's buttons go through those orders on a watch. A falling door shows "Falling", and a
  refused switch says why. The Systems tab has a tenth link, Doors: shut at the tank top, open with current on the
  bridge, or open with none.
- `tools/systems_tests.js`, 20 MUST rows (6 new):
  - with current, all eleven fall shut 25 s after the switch;
  - with the dynamo flat flooded, the switch releases nothing;
  - the floats drop M and N, the electric engine room's bulkheads, at once, while D to L stay open. O follows 2.5 min
    later, after water that got through N while it fell trips O's float;
  - a lever works without current;
  - Britannic's held doors, and the 1912 damage, give the core's own bits with the plant.

  `tools/systems_site_test.js`, 14 rows (one new): in the dark, door D raised by hand and the switch, both by real
  clicks, are logged, and D stays open.
- The 1912 runs are unchanged to the bit (their doors were shut at once): headway reference, seams, trials.

### Her speed below 60 rpm (M3) and her stopping against speed (M4), 2026-11-17

Both move the handling's fit, and the fit moves the 1912 encounter, so they were built together: one refit, one search.

- **M3, the resistance has a shape** (`SHIP.resist`, experiment e16). It was purely quadratic, so with the screws'
  linear law the speed was exactly proportional to the revolutions while the turbine was in: 0.295 knots a revolution
  everywhere. It now carries the speed shape of Holtrop's 1984 method for this hull, still equal to Biles's 165 tons at
  21 knots. The method's formulas were already in the research notes; C_M and C_WP are assumed, and the shape hardly
  moves with them. Against quadratic, R / u^2 is 13 % lower at 12 knots and 5 % higher at 22.5, where the wave
  share is 23 %. It is carried as a cubic in speed, within 0.84 % of the method as used (0.5 % was the fit before its
  renormalisation to Biles's point, as first reported), so the step has no `Math.pow`.
  - Half ahead (50 rpm) makes 15.31 knots: the consensus's 15.3, where it was 14.77.
  - Slow ahead (30 rpm, the turbine out) makes 8.25 knots, in its band 8.2-9.2, where it was 7.86, once the centre
    screw trails with the four-quadrant series' drag at zero torque (0.10 on its disc; 0.25 was a bet).
  - 60 rpm makes 18.18 knots, 0.18 over its band (17.3-18.0). That band rests on one light-draft "about 18 knots",
    corrected for draft; Halpern's own speed law gives 18.33 there. BACKLOG M6.
  - Full ahead stays 22.15 knots at 75 rpm (the calibration); 74 rpm is 21.90.
  - The steady speeds are certified again by Abacus (the balance is no longer a quadratic): new request and answer
    files, `docs/research/abacus/*_motion_m3_steady_2026-11-17.jsonl`.
- **M4, the screws astern from the record and the series** (`SHIP.astern`, experiment e15). The record wants a
  stop that depends little on the speed it starts from: Olympic, from about 22 knots, stopped in "rather less" than
  Titanic's 914 m from about 18. The model stopped from 75 rpm in 1,203 m.
  - **No astern law alone does it** (e15): the best of any shape tried gives 968 m with the trial run as before.
  - **The record says why.** Wilding, of Titanic's trial: the engines "were reversed more slowly than usual", so the
    914 m is "probably a little on the large side". Of Olympic's, in 1915: her engines were "rather more smartly
    handled". The fit now runs the trial as he described it, 10 s more before the engines turn astern (the
    consensus's 5-15 s), and Olympic's stop is checked with a prompt reversal (Cone's lower ends: astern at 10 s,
    backing hard 30 s later). `TRIAL_1912` and `PROMPT` in `tools/motion_trials.js`.
  - **The thrust astern is the B-series'.** A research note found MARIN's four-quadrant data for the Wageningen
    B-series, public in a U.S. Navy report (Roddy, Hess and Faller 2006), and evaluated them against three
    independent checks (`docs/research/RESEARCH_propeller_four_quadrant_v1_2026-11-17.md`). In the crash-back quadrant
    the pull grows about as 1 + 0.85 J^2 with the advance ratio, where the model had 1 + J / 1.48: a screw reversed
    at speed is a brake. The model now carries the measured shape of the series' nearest screw, B4-70 of pitch ratio
    1.4 (the wing screws' is 1.49), as a 19-point table. While an engine is being reversed, its screw is held and drags
    as the table says at 90 degrees, so the force runs on without a jump as it starts astern. "Stop" still leaves a
    screw trailing free, as before. Sternway is unchanged.
  - With both, the trial's crash stop fits at 914 m in 183 s (record about 195; it was 190). A stop with the usual
    reversal from 60 rpm is 864 m, inside the consensus's 820-930 m for a normal reversal at her displacement.
    Olympic's from 75 rpm is 942 m (no more than about 945). The engines turn astern 17 s after the order, as before.
  - **Out of reach:** from half speed she stops in 0.36 of the full-speed distance, where another, smaller ship gave
    0.80-0.85. No screw law tried does better than 0.37. Wilding himself agreed the example "does not throw any
    direct light". The series note's reading is that only an engine short of torque at speed could make that
    happen: BACKLOG M5.
- **The refit** (`tools/calibrate_motion.js`): uRk 1.8225, cd 2.4774, fA 0.6501, kap 0.0552 (were 1.8125, 2.4281,
  0.518, 0.0458). fA, the astern bollard pull over the ahead one at equal revolutions, sits just under the series'
  0.66-0.96 (0.81 for the B4-70 of pitch ratio 1.4, 0.71 for the note's estimate of her own screws). The trial measures are now interpolated between steps: the fitted 37 s was read at the step
  after two points, so the fit sat on the edge of a step and rounding could cross it.
- **Against the consensus** (`tools/trials.js`): 15 of 15 MUST rows, and 18 of 21 CHECK rows in range, where 16 of 20
  were. Half, Slow, Olympic's stop and the trial's time are now in; the usual stop is a new row. 60 rpm is now out
  (above). The distance run to two points with the engines reversed, 363 m, is 3 m under its band (366-402), where
  it was 367 m: the reversed screws brake harder at speed, as the series says. The stop from half speed is still out.
- **The 1912 encounter, found again** (e17, the method of e9 and e14, with BACKLOG P3e's test built into the
  choice). Under the new handling, P3c's point (256 m ahead, 46 m to port) tore from x 117 to 33, and the core sank
  her in 145 minutes. e17 searched a grid and refined it. It ran the best twenty on the courses between the
  outline's nodes and with the ice a metre away, and sank all twenty. Now:
  - the ice sits 257 m ahead of her stem at the order and reaches 47 m to port, a metre from P3c's point;
  - the tear runs on the starboard side from near the stem (x 123) into boiler room 5 (x 42), as before;
  - the split is 29 points off Hackett and Bedford's (26 before);
  - she strikes 25.9 s after the order, as before, so the bells still ring 13.75 s into the watch and she touches at
    11:40:00.2 pm; the ice is sighted at 494 m;
  - the area constant refits to 0.20714 (0.20694);
  - **the damage sinks her 158.6 minutes after the touch** (record 157 to 160).
  - P3e is no nearer. No point in the timeline agrees across the courses between the nodes within 2 %. This one
    comes within 2.6 % (P3c's point: 2.0 %), and the one steady point (1.5 %) sinks her in 194 minutes. Most
    neighbours a metre away fail the test's "starboard tear only" because of a single torn station, 0.001 m2, on
    the stem's port face, not because the stem strikes.
- The headway reference is refrozen: every run under way changes with the resistance's shape.

### The emergency dynamos (Y4), 2026-11-16

- Two 30 kW emergency dynamos sat on D deck in the turbine room's casing, about 20 ft above the waterline, on their own
  steam pipe, and fed the emergency lights and the wireless (the plant research note). The plant now keeps them apart
  from the four main sets: with the main dynamo room flooded and steam up, her emergency lights burn at 15 % of all her
  light [bet] instead of her going dark; the stokehold fans, the main sets' load, still stop. Steam lost, the mains
  broken at 2:16 am, or the sea at D deck there, and she is dark. The viewer fades her lights to the level the dynamos
  give, and the Systems tab says which sets are running. `tools/systems_tests.js` 14 MUST rows.

### P3c, a contact law that converges, and the 1912 encounter refitted on it, 2026-11-16

P3b's measurements (e10) put the encounter's fragility in its contact law, not in the ice outline. P3c replaces the law.
`core/encounter.js`:

- **The contact ramps in.** A hull station's contact now counts in proportion to its overlap with the ice, up to its
  full face at 0.1 m [bet]; before, it counted whole the moment it touched. That made the ice pressure (p0 over the
  root of the area in contact) jump as stations came and went, so the outcome followed the stations' spacing.
- **It is resolved finely enough to converge** (e11):
  - stations every 0.125 m, each carrying its share of force, contact and opening;
  - a continuous outline in the berg's own frame, 11,520 nodes, crushed back to the dented hull over each station's
    arc;
  - 40 sub-steps a step while near the ice;
  - friction smooth through zero sliding speed.

  Refined together, the opened area settles, and courses a fraction of a degree apart now give the same damage within
  1.7 % (at e11's point). With the old count it was still 10 % at the finest level, and 28 % as built. At the new 1912
  point, which grazes a stem strike, the night test's courses between the outline's nodes come within 2.0 %, while a
  0.001-degree nudge moves it 5 %: that is the edge, BACKLOG P3e. Whole-degree courses fall on the nodes and reproduce
  the point exactly, so the test now uses courses between them.
- **One opening per metre.** The torn stations of each metre of hull, band and side are gathered into one opening, so
  the flooding core sees no more openings than before.
- **The 1912 encounter, found again on it** (e12 to e14, the method of e5 and e9):
  - the side shell's resistance doubles to 24 MPa per metre of dent (a fitted bet);
  - the ice sits 256 m ahead of her stem at the order and reaches 46 m to port;
  - the tear runs on the starboard side from near the stem (x 123) into boiler room 5 (x 42), where the record ends
    it;
  - the split is 26 points off Hackett and Bedford's;
  - she strikes 25.9 s after the order;
  - **the damage sinks her 159 minutes after the touch** (147.6 before; the record 157 to 160). No damage made by
    the contact had matched the timeline before.
- **What it cost.**
  - The ice is sighted at 495 m (the Report's "about 500 yards" is 457), so the bells ring 13.75 s into the watch
    for her to touch at 11:40 pm.
  - The berg's centre now lies 6 m to port of her track, so the 1912 night gives the recorded order, hard-a-starboard
    (her head to port), rather than "away from the ice", which drawn nights keep.
  - She grazes the edge of a stem strike at that point: a metre or half a metre either way changes the damage a good
    deal (e14). That is physics, near a threshold, not the old numerical artefact, but it makes the 1912 point
    sensitive.
  - The encounter costs about eight times as much computing while near the ice.
- **The viewer** draws the berg's rings at 360 segments, each showing the least radius of the nodes it covers, and
  turns the berg with its heading (it turns only if `ICE.turns`, which stays off).

### The plant's last links: the stokehold fans (Y5) and blowing off (Y1, the plant's part), 2026-11-16

- **Y5, the stokehold fans.** The 12 fans that blew air to the stokeholds were electric (the plant research note).
  With the dynamos stopped the fires burn on natural draught and make 65 % of the steam [bet], so the dark feeds back
  into the steam. Flooding the dynamo room at Full ahead puts her in the dark at 0.5 min, every fire still lit; the
  engines settle at 67 rpm and she at 19.8 knots.
- **Y1, blowing off.** The stokers fire to what she uses. With the engines stopped and every fire lit, the surplus
  lifts the safety valves at once. After 10 minutes idle the stokers bank the fires toward a fifth over what she uses,
  over about 20 minutes [bets], and the roar is quiet at 57 minutes, inside the record's "through the first hour". The
  pressure never leaves 215 psi. While the engines work, the firing stays full and nothing changes, to the bit.
- `tools/systems_tests.js`: 13 MUST rows (two new).

### P3b measured, not adopted; the centre screw never turns astern, 2026-11-16

- **P3b, the encounter's second pass, at Bo's word.** Two of its three parts were built and measured (experiment e10,
  against a variant of `core/encounter.js` kept beside it). Neither was adopted, and `core/encounter.js` is unchanged:
  - **The smooth outline** made the course's phase matter more, not less. A continuous outline in the berg's own frame,
    crushed back to the dented hull over each station's arc, still opened 23 to 69 % more or less on courses a fraction
    of a degree apart. Finer outlines and finer hull stations brought that down only to about 25 %; the flat 2-degree
    bins give 28 %.
  - **A berg that turns** under the friction's moment turned 8 to 9 degrees during the 1912 contact and made the
    outcome more erratic: 49 %, and 35 % from a course nudged by 0.001 degree.
  - **The cause is the contact law, not the outline.** Without turning, a 0.001-degree nudge changes the area by
    0.14 %, so the contact is not chaotic. But the ice pressure follows the count of stations touching at each moment,
    and each station switches between denting and crushing, so the outcome follows the stations' spacing: 0.67 m2
    opened at 1 m, 0.27 m2 at 0.25 m. BACKLOG P3c is the law to replace it. The third part of P3b, plating and seams
    that vary along the hull, waits on its research note.
- **The centre screw never turns astern** (`tools/astern_tests.js`, a 14th MUST row): across 25,920 steps of
  reversing orders, both shafts and each alone, its revolutions never fall below 0, and the turbine is never in while
  an engine is astern. It was driven by a low-pressure steam turbine on the reciprocating engines' exhaust, with no
  astern stage, and reversing the engines cut it out (Wilding 1915; Cone 1912).

### Her handling refitted to the sisters' consensus (M2), and the plant's numbers from the record, 2026-11-16

Bo's ask the same evening: fit her turning and handling to a consensus of the three sisters' public data, the way the
sinking was fitted to 1912. The consensus is `docs/research/RESEARCH_handling_consensus_v1_2026-11-16.md`: every trial
figure for Olympic, Titanic and Britannic, each weighted. Britannic left no trial record.

- **The record, read again.** In his 1915 deposition Wilding said the Olympic test that took 37 s for two points was
  run with both engines reversed together with the helm ("And reversed both engines."). The consensus puts that at
  about two chances in three. Her circles barely changed with speed ("only by a very small amount"), the slowest at
  11-12 knots, below where the turbine ran. Both say the centre screw's race mattered little to her steering.
  - P1 had fitted the 37 s as a turn with the helm alone, and taken MMG's typical share of the race at the rudder
    (kappa 0.5). With that share no drag gives both the 37 s reversed and the trial circle (experiment e8).
  - With the 37 s and the circle held, no other hull term moves the advance off 805-824 m (e7).
- **The refit.** `tools/calibrate_motion.js` fits four numbers to four records:
  - two points in 37.0 s at 74 rpm, with the engines reversed;
  - the trial circle, 1,173.5 m at 20 knots;
  - the 11-knot circle, 1.03 times the trial circle;
  - the crash stop, 914 m from 60 rpm.

  Kappa falls to 0.046, the rudder's inflow factor rises to 1.81 and the cross-flow drag to 2.43; astern thrust is
  unchanged. With the helm alone she now turns two points in 35.5 s.
- **Against the consensus** (`tools/trials.js`, now on the consensus's bands): 15 of 15 MUST rows, and 16 of 20
  CHECK rows in range, where 9 of 15 were.
  - Now in range:
    - the advance: 782 m from the order, and 680 m from the rudder hard over, which takes in Wilding's 2,100 ft;
    - the speed held (0.68), the rate (0.68 degrees a second) and the heel (3.5 degrees);
    - two points at 11 knots (68.5 s);
    - BI 25291's three circles, nearly equal.
  - Still out, and not her handling:
    - Half and Slow ahead: the speed falls too fast below 60 rpm (BACKLOG M3);
    - the stop from 75 rpm: 1,203 m, where the record allows no more than about 945 (M4);
    - the stop from half speed: 0.34 of the full-speed stop, where another ship gave 0.82 (M4).
- **The 1912 encounter, refitted with it.** Its geometry is not a record: P3 fitted it. With the quicker turn the P3
  point tore from hold 3, not the stem. Experiment e9 searched again and put the ice 224 m ahead of her stem at the
  order, reaching 36 m to port (P3: 220 and 32). Now:
  - the tear runs on the starboard side from the stem (x 127) to boiler room 4 (x 29);
  - the split is 26 points off Hackett and Bedford's (41 before);
  - the ice is sighted at 463 m (the Report's 500 yards is 457 m);
  - she strikes 22.2 s after the order (Halpern: 20-25), at 11:39:59.9 pm, her head 11.6 degrees to port (Halpern's
    one point);
  - the area constant refits to 0.10976, because the tear is 98 m long where it was 69;
  - the reconstructed damage sinks her in 147.6 minutes (141.7 before; 160 observed).

  One check is worse: on courses off the ice outline's 2-degree facets the damage now differs by 28 %, where it
  differed by 9 % (P3b).
- **What moved, and why.**
  - The headway reference (`out/headway_reference.json`) is refrozen with `--freeze`: the seven runs with the rudder
    over changed by the refit; the crash stop with the helm amidships did not.
  - The 1912 watch's fingerprint moved, and so did the drawn nights' outcomes.
  - The geometry now lives in one place, `GEOM_1912` in `core/night.js`.
- **The plant's numbers from the record** (`docs/research/RESEARCH_ship_systems_plant_v1_2026-11-16.md`):
  - boiler room 6 had four double-ended boilers, not five;
  - the 24 double-ended boilers were lit and room 1 was cold;
  - drawing a room's fires took 15-20 men about 20 minutes;
  - about 3,000 tons of coal were aboard on the night, burned at about 700 tons a day at 22 knots.

  The same note confirms the dynamos and the steering engines on steam, the doors' electric release, steam pumps
  of 1,700 tons an hour, the boilers blowing off through the first hour, and her propellers seen clear of the water
  before the plunge. It adds one link: the stokehold fans were electric (BACKLOG Y5). Design v1.1:
  `docs/DESIGN_ship_systems_v1_1_2026-11-16.md`.

### Her systems depend on each other (the plant), 2026-11-16

Bo's ask the same evening: systems that need each other, so that a failure cascades the way it would have, without
study-level detail. `core/systems.js` (new) reads the flooding core each step and writes what the machinery can do into
`sim.mo.plant`; `core/motion.js` obeys it. With nothing failed it changes nothing, to the bit. Design, rules and the
standing of every number: `docs/DESIGN_ship_systems_v1_2026-11-16.md`.

- **The chain.** Coal feeds the fires in six boiler rooms (room 1 cold on the night [pending research]). Their steam is a
  pressure with a store (300 s of full demand [bet]): it holds while the fires make what the engines and auxiliaries use,
  and falls when they do not. Full steam is what holds her service maximum, 78 rpm [read], so the watch's 22.5 knots
  (76.2 rpm) is held for good. The two reciprocating engines turn only as fast as the steam allows (80 rpm at full
  pressure, as the cube root of the pressure above a floor [bet]); the turbine runs on their exhaust (Half or Full ahead,
  both engines above 40 rpm, as before). The steering engines move the rudder at full rate from 100 psi [read] and not
  at all below 25 % of working pressure [bet]; the dynamos stop below 30 % [bet]. As the pressure falls the main engines
  drop out first, then the dynamos, then the steering gear [bet: the engineers kept the lights to the end on the night].
- **What breaks it.** Water 1 m over a boiler room's plates puts its fires out in 45 s [bets]; at the crankshafts
  (3.80 m, measured in R1) it stops both engines, and the turbine with them; at the turbine's axis it stops the turbine;
  1 m over the dynamo flat it puts her in the dark. A screw gives thrust in proportion to its disc under water; the
  rudder's force goes with its area under water, through the outline traced in R1, once her stern has risen half a
  metre [bet]. Past 20 degrees of trim the boilers and steam mains give way [bet].
- **No way, no steering** was already the physics (the rudder's force comes from water moving past it); now tested: at
  rest, hard over for two minutes, she turns 0 degrees; hard over at Slow, Half and Full she turns 0.23, 0.51 and 0.76
  degrees a second.
- **Cascades, measured** (`tools/systems_tests.js`, 11 MUST rows): intact at 22.5 knots for an hour, the pressure never
  leaves 215 psi; boiler rooms 6 to 4 flooded at Full ahead: three rooms out, 124 psi, the engines settle at 56 rpm and
  she at 16.6 knots; the reciprocating engine room flooded: both engines and the turbine stop, she coasts, and her
  rudder still answers (the steering engines run off the boilers); every fire drawn at Half: the engines stop, she goes
  dark at 21.5 min, the steering gear stops at 27.8 min, and the wheel then moves nothing;
  the 1912 run at 157 minutes: Full ahead pushes nothing, the screws are in the air; the 1912 damage: dark at 2:16:24 am
  for want of steam as she rises (witnesses: about 2:18); four compartments open: lit after four hours. On the 1912
  watch (its own damage, which sinks her 20 minutes early) the wing screws' tips reach the surface at 12:19 am at 1.9
  degrees of trim, the discs are half out at 1:31 and clear at 1:57; each is news on the bridge.
- **Orders and options.** The stokehold's one order, draw the fires (a room or all), on the Systems tab; on a watch it is
  logged with the helm and telegraph orders and replays. Coal for 2 hours or 15 minutes of full firing (the tab; applies
  on restart and to the next watch, and a replay keeps it); with the bunkers empty a room's fires burn down in 15
  minutes [bet].
- **The viewer.** A Systems tab: each link with a state dot and what it is doing now, the boiler rooms with their fires
  and coal; the steam under the Bridge's revolutions ("188 psi · short"); the plant's losses as news on the bridge; her
  lights now go out when the dynamos stop (`site/visuals.js` no longer has a rule of its own for them).
- **Tests.** New: `tools/systems_tests.js` (11 MUST rows, 2 CHECK rows) and `tools/systems_site_test.js` (12 rows in
  headless Edge, through the page's own buttons: the tab, the drawn fires and their cascade, the dead wheel, the coal
  option, a room's Draw button, the preset dark at 1:18 am with every fire drawn). Unchanged: `tools/seams.js`,
  `tools/trials.js` 14 of 14, `tools/encounter_tests.js` 7 of 7, `tools/night_tests.js` 13 of 13,
  `tools/astern_tests.js` 13 of 13 (the 1912 watch's digest d2fcfe1c), `tools/visuals_tests.js` 32 of 32,
  `tools/night_site_test.js` 15 of 15 (the viewer's watch and the model alone still one fingerprint),
  `tools/visuals_site_test.js` 19 of 19.

### The wash, the engines, her lights going out, sound and smoke (V4 to V7), 2026-11-16

The viewer only (`site/visuals.js`, `site/app.js`); nothing in `core/` changed. Backlog section 1 is now built.

- **V4, the wash when backing.** A wing screw going astern throws its race forward along her side. Parcels leave the
  screw every half second at the efflux speed from the model's own thrust (momentum theory), keep it through the zone
  of flow establishment, 2.5 diameters (PIANC 2015 as cited), then slow as 1 / distance, a round jet's far field
  (both read only as search summaries; joining them there is a bet). Drawn as foam along each side to where the wash
  has crept. In a crash stop from 22.5 knots it first runs forward of the screws at 67 s and reaches amidships at
  239 s, 26 s after she stops, at 2.1 knots astern: the shiphandler's sign that she has lost her way (from memory).
- **V5, the engines and the turbine** in the X-ray hull: both sets on the measured centre lines (5.14 m out, 3.80 m up),
  four cylinders each in the built order with the true bores and stroke, crank webs, connecting rods, crossheads,
  piston rods and pistons at the shafts' own angles (the port set turning the other way); the turbine's rotor with the
  centre shaft. Crank angles and rod length are named bets.
- **V6, her other lights, and their failing.** 581 lit ports and windows along C to F decks and B deck's superstructure
  [appearance], dimmer under water. All her lights fail when water reaches the electric engine room's dynamo flat or
  her trim passes 20 degrees [bet: the mains torn as she rises], over three seconds. In the 1912 run that is
  2:16:17 am, on her trim (witnesses: about 2:18); with four compartments open she floats and they never fail.
- **V7, sound and smoke.** The telegraph's gong on every engine order; the engines' beat once a revolution of the
  starboard shaft while time runs near her own pace; funnel smoke from three funnels (the fourth was a ventilator),
  laid on the air where she was, so it trails her track. One sound switch for all of it.
- Tests: `tools/visuals_tests.js` 32 rows (the wash's timing in a crash stop, the 1912 lights at 2:16 am, the floating
  case, the ports, the engines' places); `tools/visuals_site_test.js` 19 rows in headless Edge (the gong on a real
  click, the wash forward of the screws, eight pistons and the turbine at their shafts' angles to 1e-9, a beat per
  revolution, smoke laid, the 1912 preset's lights out at 2:16 am); `tools/night_site_test.js` still 15 of 15.

### She steers going astern (M1), 2026-11-16

- **M1, the rudder with sternway** (`core/motion.js`). Asked directly (experiment e6), the model answered nothing to its
  rudder going astern, and made a small yaw of its own: the MMG terms are written for headway, and astern the rudder's
  inflow was a magnitude while the drift angle turned to 180 degrees. With headway (u >= 0) the arithmetic is untouched;
  with sternway the water's velocity at the rudder is taken as a signed vector, nothing straightens the flow (the rudder
  leads), the hull adds nothing to its force, and the lift slope is half [bet: `SHIP.asternLift`]. `tools/astern_tests.js`:
  13 MUST rows pass. Eight headway runs (turns, a zigzag, a crash stop to the moment she stops, the screws opposed, two
  watches) give the same bits as before M1 (`out/headway_reference.json`, frozen from the code before the change); with
  sternway the stern follows the rudder (30 degrees to starboard at 8 knots astern turns her head 6.9 degrees to port in
  four minutes, the mirror case the same to 1e-9); with the rudder amidships she no longer turns at all; the rudder's
  turning moment astern is 0.21 of ahead at the same speed; no state near zero speed gives a NaN. `tools/trials.js`
  still 14 of 14 with the same table; the encounter's what-ifs unchanged; `tools/night_tests.js` 13 of 13 (one
  fingerprint moves: the played watch that runs on into sternway). Both browser tests pass.

### What she shows (R1, V1 to V3), 2026-11-16

Design: `docs/BRAINSTORM_screws_rudder_wake_lights_v1_2026-11-16.md`; facts `docs/research/RESEARCH_stern_gear_wake_lights_v1`
and `v1_1`; the backlog's items R1, V1, V2, V3 (`BACKLOG.md`). The viewer only; nothing in `core/` changed.

- **R1, the stern measured** (17:40 CST). From The Shipbuilder's 1911 figures as reproduced at full size: the wing
  shafts 5.14 m off the centre line in the engine room (Fig. 53) and 5.38 m in the turbine room (Fig. 51), level at
  3.80 m above the keel; three scales on each drawing agree within 0.4 %. A straight shaft from the engine-room point
  to `core/motion.js`'s 6.0 m at the screws passes within 5 cm of the turbine-room point, so the physics keeps 6.0 m.
  The centre shaft is 4.82 m up, 3.3 ft above the wing shafts. The rudder's outline was traced from the photograph of
  the stern castings (Fig. 17): widest 6.5 to 8 m above its heel, not at the waterline as the earlier note said; its
  area under the night's draft is 2.8 % short of the plans' 401.63 sq ft. The screws' stations fore and aft are still
  not found: the wing screws go where their discs clear the model's hull by 0.15 of a diameter [bet].
- **`site/visuals.js`**: the shapes as plain numbers, testable in Node: screws whose blades are true helicoids of the
  builder's pitches with the builder's blade areas; the rudder from the trace; the bossings; the wake's construction;
  the lights' arcs; the engines' kinematics for later. `tools/visuals_tests.js`: 26 rows pass, among them the blades'
  angle at 0.7 of the radius (34.108 and 21.199 degrees, certified), their areas (159.8 and 120.0 sq ft against 160 and
  120), the rudder's 37.31 m2, Kelvin's 19.47 degrees within 0.26 and the crest spacings to 0.001 % at 22.5, 15 and
  10 knots, the lights at sixteen bearings.
- **V1, the stern gear drawn.** Three screws turning with the model's shafts, summed step by step (the wing screws
  outward turning, a mirror image for the port one; the centre screw only with the turbine in, right-handed [bet]);
  smooth between steps at 1x; blades that turn more than about 40 degrees a frame fade into a disc. The rudder at the
  model's own angle, so the 10 seconds it takes to go hard over show. Bossings, shafts, the aperture cut out of the drawn
  shell. A Screws view, under water off her starboard quarter. A rudder indicator on the Bridge: the order and the
  rudder as two needles.
- **V2, the wake.** Laid on the sea from samples of her own state every half second: a white ribbon from her stern (her
  bow when she goes astern), widening slowly with distance [the exponent: a field measurement, as cited], fading in a
  minute or so [appearance]; Kelvin's arms and crests constructed from her bow's path, so they bend through a turn and
  their spacing is the speed she had; a mark across the ribbon where each order was given; white water at her stem.
  Her place, the sea and the wake are now drawn between steps as well (the model steps four times a second).
- **V3, the lights.** Masthead, green and red side lights, and a stern light (switchable: photographs suggest one; the
  1910 rules did not require it), each shown only inside its arc, with a glow and a streak on the water. A Lights
  switch.
- **`tools/visuals_site_test.js`**: 14 rows pass in headless Edge, among them each screw's revolutions against its
  shaft's, outward turning, the drawn rudder at the model's angle after a real click on Hard to starboard, the wing
  screws running backwards on Full astern with the turbine cut out, the arms at Kelvin's angle in the page, the lights
  from sixteen bearings and none from her own bridge. `tools/cdp.js` is the browser driver both browser tests can share.
  `tools/night_site_test.js` still passes 15 of 15.

### The ship under way (P0 to P4), 2026-11-16

Design: `docs/BRAINSTORM_ship_under_way_v1_1_2026-11-16.md` (and v1 for the detail). P0 to P3 are headless; P4 puts
the watch into the website build (`site/`, `dist/`). Viewer version 1 (`web/`, `out/titanic.html`) is unchanged.

- **P0, the seams.** `core/core.js` gains inputs a motion model sets before each step: the outside level and a
  discharge factor per sea-side connection (`conn.hx`, `conn.cm`), and loads on heave, pitch and roll (`sim.xFz`,
  `xMth`, `xMph`). Neutral by default. `tools/seams.js` proves the core gives the same bits as before at every step of
  three scenarios (107,561 steps), and that the seams are live when set. The validation table is unchanged.
- **P1, the motion model.** `core/motion.js`: surge, sway and yaw about amidships (MMG standard method), the hull by
  Yoshimura, Nakao and Ishibashi's unified form (no division by speed), three shafts with the engine-order telegraph,
  reversing delays and the turbine rule, one rudder in the centre screw's race, the flood water's mass in the
  equations, and the turning heel passed to the core. Three numbers fitted to the 1911-12 trials
  (`tools/calibrate_motion.js`); `tools/trials.js` is the acceptance table (`out/trials.txt`).
- **P2 and P3, the iceberg encounter.** `core/encounter.js`: a berg whose underwater spur is three bands of a crushable
  outline, moving as a free body; the hull's own form at those depths, every metre, both sides; contact force the
  smaller of what the plating resists and what the ice carries before crushing (pressure falling with contact area);
  dents first, then seams and plates that open past a dent of 0.2 m, handed to the core as openings while they grow.
  The ship, the berg and the core's roll all take the contact force. `tools/encounter_run.js` runs one night;
  `tools/encounter_tests.js` is the acceptance table and the what-ifs (`out/encounter_tests.txt`,
  `out/encounter_whatifs.txt`). Fitted: plating resistance, berg mass and the 1912 geometry (search in
  `docs/research/experiments/e5`), and one area constant (a seam gap of 14 % of the excess dent) so the 1912 night
  opens the calibrated 0.7506 m². Not met: the 1912 night founders at 141 min, not 157, and the damage split differs
  from Hackett and Bedford's by 42 points (tears reach boiler room 4).
- **P4, the night and the watch** (16:06 CST). The collision is now played, not painted.
  - `core/night.js`: a night drawn from a seed (the berg's size, depth and place, how far off the lookout sees it;
    seed 1912 is the reconstructed night, fixed), the lookout's three bells, the bridge's orders through two functions
    (`helm`, `telegraph`), and a log of every order with its step. A night is its seed and its orders: `replay` and
    `snapshot`/`resume` give the same night again bit for bit. `tools/night_tests.js` is the acceptance table
    (`out/night_tests.txt`): 13 MUST rows pass. `tools/night_run.js` runs one night; `tools/night_sweep.js` measures
    how hard the drawn nights are (`out/night_sweep.txt`: of 200 nights, an order 5 s after the bells clears 85 %,
    at 20.5 s 50 %; 28 % need no order at all).
  - The website build: two new scenario cards (the 1912 watch, another night), a Bridge overlay on the stage (speed,
    heading, rudder, engine revolutions, the lookout; the wheel; the telegraph; keys A, D, S and the arrows), views
    from astern and from the bridge, the berg drawn (its visible shape from the seed, its spur the physics' own
    outline, crushed where she ground along it), her track, dents and opened seams marked on the hull, a bell. The
    ship stays at the scene's origin; the sea, the berg and the track move past her. The watch runs in real time until
    the ice is passed, then the core's forecast takes over and the panel lists the same berg under other watches.
    `#night=<seed>` in the address opens a night. `tools/build_site.js` now rebuilds without `node_modules` (it keeps
    the vendored three.js and fonts already in `dist/`).
  - `tools/night_site_test.js` plays the watch in headless Edge or Chrome through the real controls, with no
    dependency beyond Node: 15 rows pass, among them that each outcome in the page equals `core/night.js` replaying
    the page's own order log in Node, and that the viewer adds nothing to the physics (its watch and the model run
    alone in the page have one fingerprint).
  - **The encounter changed with it** (`core/encounter.js`), because a played collision reaches cases P3 never had to
    answer. (1) A stem strike: the three bands are a spur, and a ship that ran her stem into the berg knifed through
    it. Where her centreline is inside ice that faces her bow, the bow now crushes at a constant 120 MN along the
    ice's normal (Wilding's 80 to 100 feet against a fixed obstacle), every compartment the crush reaches is open,
    and the core floats her, as Wilding said. The 1912 touch is too glancing for this law and is unchanged by it.
    (2) The berg has drag in the water; before, a pushed berg coasted for ever. This moved the 1912 opening by 0.9 %,
    so the area constant was refitted (0.14326 to 0.14448; `tools/calibrate_encounter.js`). (3) The smallest gap
    between hull and ice is now measured the same on every course.
  - What P4 found and did not fix: the damage depends on where the 2-degree facets of the ice outline fall (the same
    1912 night on course 267° instead of 266° opens 9 % more); two JavaScript engines differ in the last bits (a
    browser and Node agree on an outcome to nine digits, not to the bit); with the stem law, this model makes the
    1912 timing nearly the worst possible: an order 5 s sooner or 5 s later, or none at all, leaves her afloat. That
    last result rests on the bets named in `core/encounter.js` and is a question for the finished model, not a finding.

## 0.2.0 — 2026-10-08: the website build (viewer v2)

The viewer was reviewed end to end and rebuilt as a deployable static site in `site/` and `dist/`.
Version 1, the single file `out/titanic.html` built by `tools/build.js`, is kept unchanged. The physics
(`core/core.js`, `core/scenarios.js`) is untouched; the site bundles those files as they are.

### What was wrong with version 1

Found by reading `web/template.html` and `web/app.js`, then confirmed by driving the built page through
Playwright on desktop, iPhone 13, Pixel 7 and iPad profiles (`tools/site_test.js`):

- **No document skeleton.** The page began with `<title>`: no doctype, no `<meta charset>`, no viewport
  meta tag. Browsers rendered it in quirks mode, and every phone laid it out as a 980-pixel desktop page
  and scaled it down. The phone stylesheet never applied. Measured inner widths: iPhone 980, Pixel 981,
  iPad 980. The readouts in the HUD collided with each other at that width (`docs/site/v1-iphone-run.png`).
- **Four runtime dependencies on third parties.** three.js r128 from cdnjs and three font families from
  Google Fonts, so the page needed those hosts up and leaked visits to them.
- **The forecast worker was built from an inline blob URL**, which a strict Content Security Policy
  forbids.
- **No WebGL, no page.** A browser without WebGL threw inside the renderer constructor and nothing else
  ran, although the model, the damage diagram and the evidence tab do not need the GPU.
- **Sprite labels drawn before the fonts arrived** rendered in the fallback font and stayed that way.
- **Removed hole markers leaked their materials.**

The model and the application logic were sound: the simulation advanced, the forecast arrived, and the
tap-to-hole tool worked on every profile even in the broken layout.

### What version 2 does

- A proper document: doctype, charset, viewport with `viewport-fit=cover`, description, theme colour,
  Open Graph tags, icons, a web manifest (installable on phones), and safe-area insets for notched screens.
- **Phone layout.** The app classifies the device from the pointer type and the short side of the screen
  (`html[data-device]`): on phones the stage fills the screen and the control panel becomes a bottom
  sheet, collapsed to its tab bar; a tab opens the sheet, the same tab or the chevron closes it. Tablets
  and narrow windows keep the stacked layout. Touch targets are at least 40 px tall.
- **Self-contained.** three.js r128 and the latin subsets of IBM Plex Sans Condensed, IBM Plex Mono and
  Cormorant Garamond are vendored (MIT and OFL licences shipped alongside). No third-party requests.
- **Strict headers for Cloudflare Pages** (`site/_headers`): a Content Security Policy with no inline
  scripts (the forecast worker is a real file), immutable caching for hashed assets, no-cache for the page.
- **Graceful degradation.** Without WebGL the 3D canvas is replaced by a notice and the rest of the page
  keeps working; without three.js the page says so.
- Sprite labels redraw once `document.fonts.ready` resolves; removed markers dispose their materials.
- A pixel-ratio governor lowers the render resolution one step at a time on devices that cannot hold
  25 fps, down to 1×.
- Keyboard: Space pauses, R restarts. The scenario is kept in the URL hash (`#scenario=britannic`).
- `tools/build_site.js` assembles `dist/` with content-hashed asset names and a `version.json`;
  `tools/site_test.js` is the device matrix; `tools/pages_check.js` runs the build under Cloudflare's local
  Pages runtime and prints the headers it applies; `tools/make_assets.js` draws the icons from the model's
  own hull profile and renders the social image.

### Verified

| Profile | Standards mode | Viewport | Device class | Sim and forecast | Tap adds a hole | Errors |
|---|---|---|---|---|---|---|
| Desktop 1400×860 | yes | yes | desktop | yes | yes | none |
| iPhone 13 (390×664, 3×, touch) | yes | yes | phone | yes | yes | none |
| Pixel 7 (412×839, 2.6×, touch) | yes | yes | phone | yes | yes | none |
| iPad gen 7 (810×1080, 2×, touch) | yes | yes | tablet | yes | yes | none |

Headless Chromium with SwiftShader WebGL; `npm run test:site` reproduces the table.

### Also in this release

- `tools/titanic.js` defaults to the calibrated opening area (it defaulted to an uncalibrated 1.115 m²).
- `core/core.js` exports `hydroPass`, which the C++ port's exporter needs. No behaviour change.

## 0.1.0 — 2026-10-08

Initial release: the JavaScript flooding core, the three.js viewer, tools, the frozen golden trace and the
porting notes.
