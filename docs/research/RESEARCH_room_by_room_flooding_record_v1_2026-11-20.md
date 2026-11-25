# The record's room-by-room flooding times against the model (v1)

- **Written:** 2026-11-20 19:00 CST (clock), by the mainline session ("Titanic simulator model accuracy", Claude Code
  74cc0d65, Opus 5.5). It is drawn from the report of a Fable research agent (asked at 18:34 CST for D69's condition 5:
  where her last hour's water goes, room by room, in the primary sources). A second agent spot-checked four of its
  citations against the transcripts (between 18:56 and 19:00 CST by the clock).
- **Status:** research. The coordinator asked that the room-by-room finding be kept however G6, G6b and W6 land. Nothing
  here changes the model.
- **Lineage:**
  - G6's note: `docs/research/RESEARCH_br5_damage_extent_G6_v1_2026-11-20.md`, on wt/g6-notes.
  - W6's design v1.2, section 4: `docs/DESIGN_W6_the_lists_v1_2_2026-11-20.md`, on wt/g6w6-preview.
  - e85, the model's times room by room: `docs/research/experiments/e85_room_by_room.js`, on wt/g6w6-preview.
- **Conventions:** T is minutes after the touch, 11:40 p.m. ship's time. BI is a British Inquiry question number; US is
  a Senate Inquiry day. Each claim is tagged as [read] (read in the transcript by the agent), [checked] (re-read in the
  spot check) or [derived] (worked out here).

## The answer in one paragraph

The record times the water room by room well enough to test the model in four places:
- **Boiler room 6 and the holds' lower decks:** forward of boiler room 5 the model is on time where the record is firm.
  Boiler room 6 has 8 ft at about T 10 (Barrett, [checked]).
- **Boiler room 5:** main floods it 26 to 56 minutes before the record allows. Its stokehold's plates were dry until the
  rush, at T 60 or T 90. This is G6's finding; the record-following model (G6 with W6) keeps the room dry until T 77.
- **Boiler room 4:** in the record its water came up from below, through the floor at the forward end, at about T 95
  (Dillon, 1:15 [checked]). It stood about a foot over the plates when the men left (Cavell [checked]). The model fills
  the room from above, and has 0.3 m over its floor at T 105 to 108: 10 to 15 minutes late, and by another path.
- **The water's front on E deck:** aft of the holds it is late in the model by 15 to 22 minutes against the few
  witnesses who place it. Confidence is medium-low.

What the record does not give:
- any water aft of boiler room 4 after about T 100;
- any sighting of a ventilator, hatch or coal chute passing water.

## 1. Room by room

The model columns are from e85: the minutes until 0.3 m over the room's floor, until 8 ft, and until there is water in
the room's space above E deck. Main is 0f3f4d1. The preview is G6 with W6 on wt/g6w6-preview, run with the refit that
held the area (wMul 3.00, aDown 0.511, fOpen 0.0605), as e85 was run. The model's floor is the tank top.

| Space | The record | Main: 0.3 m / 8 ft / above E | Preview: the same | Against the record |
|---|---|---|---|---|
| Forepeak | T 3 to 8: air hissing from the peak tank, the store above it dry (Hemming BI 17713-33; Haines US day 7) [read]. Filled from the top about an hour after (the Report, by the agent's inference) | 0.1 / 1.2 / 51.3 | 0.1 / 1.2 / 52.9 | The tank fits. The store above the tank is wet in the model within minutes, up to an hour early (low) |
| Hold 1 | T about 10: the carpenter's sounding, 7 ft (Poingdestre BI 2821-25) [read]. About T 20: a foot of water round the G-deck hatch's coaming (Symons BI 11375-418; Lee BI 2455-80) [read] | 0.4 / 3.6 / 53.4 | 0.4 / 3.4 / 54.5 | 8 ft about 6 min early against the sounding. The G-deck sightings fit (low) |
| Hold 2 | T about 5: water rushing in at the firemen's spiral stair (Hendrickson BI 4856-66) [read]. T about 45: the seamen's quarters on E deck waist-deep (Poingdestre BI 2844-72); the Report has 3 ft above E deck at T 40 [read] | 0.3 / 4.0 / 67.3 | 0.3 / 3.8 / 67.4 | Above E deck 22 min late (medium-low) |
| Hold 3 (the mail room, the racquet court) | T about 10: the racquet court making water (Hemming BI 17736-41). T 10 to 20: water at G deck, within 2 ft of it (Wheat BI 10910-21; Boxhall BI 15374-77). T about 30: six steps below E deck (Robinson BI 13277-81) [read] | 0.3 / 5.1 / 68.3 | 0.3 / 4.8 / 68.4 | Reaches E deck about 15 to 25 min late (low) |
| Boiler room 6 | T 0: 2 ft above the plates (Barrett BI 1868-88) [read]. T about 10: 8 ft above the plates (Barrett BI 1926-37) [checked: "just on ten minutes" is from his leaving the room at the touch to his return]. Beauchamp has the water "just coming above the plates" while the fires were drawn (BI 671-80): a conflict. E deck "in about one hour" (the Report) [read] | 1.4 / 10.0 / 72.2 | 1.3 / 9.3 / 73.4 | 8 ft on time (high). E deck 12 min late (low) |
| Boiler room 5 | T 0 to 2: water in the starboard forward bunker only (Barrett BI 1917-24, 2105). The plates never covered, the pumps on (BI 1964-69, 2037, 2109). The rush through the pass at T 60 (the Report) or at 1:10, T 90 (Barrett BI 2038-41, 2349) [read] | 3.9 / 34.2 / 78.5 | 77.1 / 92.1 / 77.3 | Main is 26 to 56 min early at 8 ft. The preview is inside the record's window (high) |
| Boiler room 4 | Dry at first (Cavell BI 4245-47) [checked]. At 1:15, T 95 (Dillon BI 3812-13 [checked]; the agent had 1:20): water "seemed to be coming through the floor", from under the section's forward part, with no depth standing (BI 3819-25) [checked]. Then about a foot over the plates as the men left, coming up from below (Cavell BI 4257-65) [checked] | 108.4 / 132.0 / 86.7 (any water 91.3) | 105.1 / 138.1 / 86.9 (any water 93.6) | Over the plates 10 to 15 min late. The model fills the room from above: its space above E deck is wet first. The record has the water from below (medium-low) |
| Boiler rooms 3, 2, 1 | No water in the other sections at T 95 (Dillon BI 3827) [checked]. No later witness | any water at 130.9 / 155.5 / 156.9 | 163.0 / 166.5 / 167.7 | Consistent. Untested later |
| The engine rooms | "As dry as we are here" at about T 100 (Scott BI 5643-44) [read] | any water at 157.1 / 157.4 | 167.9 / 168.2 | Consistent. Untested later |
| E deck | See the next table | above E: boiler room 6 at 72.2, 5 at 78.5, 4 at 86.7 | 73.4, 77.3, 86.9 | |

E deck, the record:

| T | What was seen | Source |
|---|---|---|
| 15 to 20 | Boxhall crossed E deck and noted no water | BI 15372-73 [read] |
| about 65 (12:45) | Water came down a stairway from E deck to F deck, "from the starboard side", while the working alleyway was "quite dry" | Wheat BI 11004-05 [checked]. Where along her length is not in those answers; the agent placed it over boiler room 4 |
| about 70 [derived] | The forward part of E deck under water on both sides, as far as the main stairway's door | Ray, US day 9 [read] |
| 60 to 90 | "Just a little" water in the alleyway over boiler room 5 as Barrett went up | BI 2348-52 [read] |

Against the record:
- Over boiler room 5, the model's E deck fits.
- At boiler room 4 the model is late by up to 22 minutes, if Wheat's stair stood there. That placing is the agent's
  (low to medium).

## 2. The questions

1. **Over the plates.** Boiler room 5 had no water over its plates before the rush, at T 60 to 90. Boiler room 4 had
   water at about T 95, from below.
2. **Over the bulkhead tops.**
   - The agent read Wheat as saying that water from forward of bulkhead D ran aft on E deck and fell to F deck, abaft
     the F-deck doors he had shut at about T 20 (BI 10922-37, 10977-91).
   - The spot check found the stair and the starboard side in his answers. It did not find where along her length the
     water came down, nor "abaft the doors".
   - Barrett: the rush into boiler room 5 did not come over the top (BI 2056) [read].
3. **E deck aft of boiler room 6.** The water reached it on the starboard side at T 65 to 75 (Wheat, Ray), and on the
   port side at about T 90 (Barrett).
4. **From above.** The record has two cases: Wheat's stair, and the Report's forepeak. Boiler room 4's water came up from
   below (Cavell [checked]). No source was found for water through the ventilators, hatches or coal chutes.
5. **Ports and doors** [read]:
   - Barrett guessed that open ports on the lower decks fed the alleyway (BI 2351).
   - The E-deck ports were "very often" open, and no order was given to close them (Joughin BI 6313-15).
   - "All the portholes open and water washing in" near T 130 (Ryerson, US day 16).
   - The gangway doors were ordered opened at boat 6; the result is unknown (Lightoller BI 13896-914).

## 3. What it means for the model [derived]

- **Early on, forward of boiler room 5**, the model is right where it can be tested: boiler room 6, and the holds up to
  G deck. In the holds it is perhaps 5 minutes early at the tank top. The Report's 14 ft above the keel at T 10 is
  8.75 ft over the tank top, and the model passes 8 ft at T 3.6 to 5.1 (low).
- **Boiler room 5:** main is wrong, as G6 found; the record-following model is right.
- **Two things the model lacks,** and both would make her last hour faster, which is the direction the 1912 watch needs
  (T 166.5 against 157 to 160 on the preview):
  - **Boiler room 4's water from below.** The record says only that it came "through the floor", from forward. The Report
    found no damage in boiler room 4 (G6's note), so it was not a hole in the stokehold's own side. The double bottom
    flooding from the damage forward of it, or a leak low in bulkhead F, are hypotheses only; no source here says which.
  - **The pace of the water's front on E deck aft of the holds,** where the model runs 15 to 22 minutes late. The
    evidence is thin: three witnesses, one of them placed by inference.
- **Neither is evidence against G6b,** the encounter's split. A heavier boiler room 6, as Hackett and Bedford have it,
  would bring E deck's front over boiler room 6 earlier, which this record asks for.

## 4. Caveats

- **The floor.** The model's floor is the tank top. Barrett puts the stokehold's plates 2 ft above the bunker's bottom
  (BI 2096), and also "six feet above the tank tops" (BI 1883). If the plates stand higher than the model's floor,
  water over the plates comes later than the model's 0.3 m over the floor, and boiler room 4 is later still in the model.
- **Joughin's water.** Joughin's 2 to 3 inches abaft bulkhead K (BI 6217-21, 6308-42) cannot be the level of the flood.
  At 4 degrees of trim, E deck over boiler room 4 lies 3.75 m lower (the agent's abacus receipt 09665dc1d63a, enclosed,
  on the model's deck heights).
- **Not re-read** by the research agent: Wilding and Hart.
- **Boiler room 6's 8 ft and the plates' height** (e87, `docs/research/experiments/e87_forward_rooms_vs_record.js`,
  results in `results_2026-11-20/e87_forward_rooms.txt`, on main 4bf604e): the 1912 watch (the encounter's split,
  boiler room 6 at 23 % of the area) has 8 ft over the tank top at T 10.0, and 10.5 ft at T 13.2. The 1912 damage preset
  (Hackett and Bedford's split, 32 %) has them at T 6.5 and T 8.9. With the plates at the tank top the watch's split
  fits Barrett. With the plates 2.5 to 3 ft up, the preset's fits, and the watch is 3 to 4 minutes late. So Barrett's
  8 ft weighs on the split only once the plates' height is known.
- **The spot check** re-read four citations, each against its transcript on titanicinquiry.org:
  - Barrett, BI 1926-37: supports.
  - Cavell, BI 4245-66: supports.
  - Dillon, BI 3811-30: partly supports. The time was 1:15, not 1:20, and "just damp" is counsel's word, not his. Both
    are corrected above.
  - Wheat, BI 10922-11015: partly supports. The stair and the starboard side are his; where along her length is not
    in those answers. Corrected above.

  The other citations are as the research agent read them.

## Sources

- The British Inquiry and the Senate Inquiry transcripts, on titanicinquiry.org. The spot check's pages were
  `BOTInq/BOTInq03Barrett01.php`, `BOTInq05Cavell01.php`, `BOTInq05Dillon01.php` and `BOTInq09Wheat01.php`.
- The research agent's report, model output: it gave a table, the questions and the caveats, with abacus receipts for
  its unit conversions and differences (for example 8 ft = 2.4384 m, receipt a1d97be11402). It is kept in the mainline
  session's transcript, not here.
- The model's times: e85 on main 0f3f4d1 and on wt/g6w6-preview, in
  `docs/research/experiments/results_2026-11-20/e84_e85_preview.txt` on wt/g6w6-preview.
