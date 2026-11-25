# The ether, read: the range law of 1911, the night's traffic word for word, the stations, the operators' code, the rockets (v1)

- **Written:** 2026-11-18, 09:36 to 10:30 CST (research to 10:18, writing and checking after), by a research subagent (Claude Code desktop, Opus 5.5), step R4 of `docs/BRAINSTORM_the_ether_wireless_morse_rockets_v1_2026-11-18.md` ("the brainstorm"), section 10.
- **Method:** web search (about 20 queries), WebFetch (about 15 fetches), and in-memory reads of public HTML pages and archive.org OCR texts by small PowerShell scripts in `C:\Temp\titanic-briefs\research\` (`pagetext.ps1`, `pagegrep.ps1`, `textgrep.ps1`, `textrange.ps1`: the page is fetched into memory, its tags stripped, its lines printed; nothing saved, no file downloaded). The scripts were needed because WebFetch's summariser refused to reproduce the Olympic's and the Baltic's logs word for word; the page text then came straight from the Titanic Inquiry Project. Arithmetic by two Node scripts in the same folder (`ether_rerun.js`, `morse_len.js`); their output is quoted in section 10. No PDF opened; nothing written in any repository except this note.
- **Refused or unreadable:** PDFs not opened: L. W. Austin, "Some quantitative experiments in long-distance radiotelegraphy", NIST's scan of the Bulletin (nvlpubs.nist.gov, volume 7; read instead in the archive.org OCR text of reprint 159, below); L. W. Austin, "Quantitative experiments in radiotelegraphic transmission" (the Arlington-Salem tests of 1913), https://nvlpubs.nist.gov/nistpubs/bulletin/11/nbsbulletinv11n1p69_A2b.pdf; the PDF of Austin's 1913 Proceedings of the American Philosophical Society paper, https://archive.org/download/biostor-204040/biostor-204040.pdf (its OCR text read instead); Bureau of Standards Circular 74 (nvlpubs.nist.gov; its 1918 text read at distantreader.org, it has no transmission formula); a hobbyist's "TitanicRadio1.pdf" (naturewind846.github.io, seen only in a search digest: 420 Hz alternator, 16 studs, 840 note); B. Lee, "Titanic Lessons for Emergency Radio" (californiahistoricalradio.com, PDF); "Hersey radio comms history" (media.defense.gov, PDF); and those listed in the wireless note. Refused: encyclopedia-titanica.org (HTTP 403) on its "distress signals" page and, as before, on P. Stephenson's article on the Marconi installation; the archive-it copy of the Nova Scotia Cape Race page answered the script with a "Session Verification" page (read instead in the Wayback Machine's copy of the same page). Not found as text: the Marconi Company's reconstituted record of the night printed for the British inquiry (BI 17062, 17174); it is read only in a 2013 blog's copy (section 2.3).
- **Tags:** [read] in a page or OCR text I opened (a 1912 record read in its Titanic Inquiry Project transcription counts as read); [read: copy] a 1912 record read only in a modern copy; [search summary] only in a search digest; [derived] my arithmetic, shown or in the scripts; [bet] judgement, no source; NOT FOUND.
- **Tool caveat:** OCR texts garble formulas and some figures. The formula was read twice (Austin 1911's OCR and Eccles 1918's OCR) and checked by recomputing Austin's own worked example (36.9 against his 37.0 microamperes). Inquiry pages were read as page text, not through a summariser, so the transcriptions in 10.4 and 10.5 are the TIP's text; punctuation and the TIP's own slips (for example "Titanic505 miles") are kept.
- **Quotes:** the 1912 records (logs, testimony, the reports, the 1906 convention) are public domain and their messages are transcribed word for word. Period technical texts (Austin 1911, a US government bulletin; the Marconigraph 1912; W. H. Marchant 1912 and 1914; W. H. Eccles 1918) are quoted in short phrases only. Modern authors: at most one phrase under 15 words per source, else paraphrase.
- **Conventions:** as the wireless note. NY = New York time (EST), the time of every log except where stated. T = minutes after the collision at 11:40 pm by her clock, on the **2 h 02 min** reading: **T = NY minus 9:38 pm** (10:25 pm NY is T 47; 12:27 am NY is T 169). The British Report's times are on 1 h 50 min (its T is 12 less). The Marconi composite of section 2.3 is "by the ship's clock", which there means NY + 1 h 50 min. Mount Temple's clock was NY + 1 h 46 min (Durrant, BI 9436). Miles are nautical. "BI nnnn" = British inquiry question; "US" = Senate inquiry, witness and day; "PV" = procès-verbal (a ship's wireless log).
- **Read with:** `docs/research/RESEARCH_wireless_rockets_ships_clock_v1_2026-11-17.md` ("the wireless note": its tables are not repeated here; this note cites it); the brainstorm; `core/readers/world.js` (the ships, clocks, set supply and rockets as built on 17 November).

## 0. Summary

- **The formula is as the brainstorm remembered it, exactly.** Austin (Bulletin of the Bureau of Standards 7, 1911): received current through 25 ohms I_r = 4.25 I_s h1 h2 / (λ d) × exp(−0.0015 d / √λ), currents in amperes and **all lengths in kilometres** (heights too), day only, over salt water, tested for sending currents 7 to 30 A, heights 37 to 130 ft, waves 300 to 3,750 m, distances to 1,000 nm [read]. The √λ was Cohen's suggestion, hence "Austin-Cohen" [read: Eccles 1918]. Austin's own worked example (600 m, 500 miles, 12 A, 200 and 130 ft: 37.0 µA) is reproduced at 36.9 µA [derived].
- **The thresholds are Austin's.** 10 µA through 25 ohms "for audible signals" (1910, electrolytic detector) and **40 µA "for good communication"** [read: Austin 1911]; the 1913 apparatus reached audibility at 5 µA (Eccles) or 7 µA (Austin 1913) [read]. The brainstorm's fitted 40 µA is therefore Austin's published working level, not a detector's least current. For the magnetic detector: about 0.0025 erg per audible dot [read: Eccles], which is **11 to 14 µA** through 25 ohms at 15 to 25 wpm [derived], about the 1910 electrolytic's figure.
- **Aerial current:** Austin: 10 A is "a moderately efficient 2-kilowatt set"; his cruisers' 10 kW sets put 27 to 33 A into the aerial [read]. Titanic's current fitted to Bride's 400 miles by day at 40 µA: **11.1 A** [derived]; on Austin's anchor a 5 kW set gives 15.8 A; the TRMA's 500 W in her aerial into a ship aerial's 15 to 18 ohms (Austin 1913) gives 5.3 to 5.8 A [derived]. The small sets: Carpathia 0.5 to 0.75 kW on 95 V mains (Cottam) and the Californian "a little over half the power" (Evans) give 5 to 7 A [read, derived].
- **The rerun** (section 10.2): with 11.1 A, 8.7 A for a 1.5 kW ship, 170 and 100 ft, 40 µA: by day Titanic is heard by a small set to 400 nm (Bride: 400), a small set by another to 281 (Cottam and Evans: 250), Titanic and Olympic each way to 491 (worked at 505 at night); by night with no absorption 1,679, 769 and 2,854 [derived]. The night bound fits the Marconigraph's "often ... about 2,000 miles" for Titanic but overstates the small sets (Durrant: "something over 200 at night"); a night absorption of a quarter to a half of the day value fits Turnbull's "two to three times" and Durrant [derived].
- **Night, as read:** Austin: "The absorption at night is entirely irregular varying from zero to the day value", night signals often no stronger than by day, a very few above the zero-absorption value [read]. That is the night law: absorption φ × the day value, φ drawn in [0, 1], rare freaks above φ = 0. At short range it changes nothing (night bound over day law: 1.07 at 18 nm, 1.24 at 61 nm) [derived], which is why the Mount Temple's signals "never got weak at all".
- **Traffic transcribed:** about 160 logged items word for word: the Mount Temple's log (all 40 entries), the Olympic's (all 11 entries of the night and 7 of the morning), the Baltic's (its 14 entries of the night and all 7 copied messages), Cape Race's (all 13 entries), the Virginian's 12.27 entry, the operators' accounts of the exchanges they made (Cottam, Bride, Evans, Balfour, Durrant), and the six ice messages with their replies as the Marconi Company produced them at the British inquiry (Turnbull, BI 16056-16230). A seventh source, the Marconi composite (Ypiranga, Celtic, Asian, Caronia, La Provence, Cincinnati, Virginian), is read only in a modern copy and kept apart (section 2.3).
- **The 9:05 pm exchange, as each said it:** US: "Say, old man, we are stopped and surrounded by ice." — "Shut up, shut up, I am busy; I am working Cape Race" (Evans, US Day 8); BI: "We are stopped, and surrounded by ice." — "Keep out." (Evans, read out at BI 16255); then Phillips to Cape Race: "Sorry, please repeat, jammed." [read].
- **Distance by strength, read:** Bride: Phillips judged the Frankfurt nearer "by the strength of the signals"; Cottam, asked whether an operator can tell proximity by strength: "Not after dark, sir." By day, "to a certain extent", if he knows the system and power; Evans: "you can not tell by the strength of the signals where anybody is" [read].
- **Titanic's set, read in the Marconigraph (May 1912):** 5 kW motor-generator fed at 110 V DC from the lighting circuit, alternator **300 V, 60 cycles**; "the ordinary Marconi rotary disc discharger", "driven off the shaft of the motor-generator"; aerial twin T, mean height 170 ft; magnetic detector with the multiple tuner (100 to 2,500 m) and a tuned / untuned stand-by switch; the magnetic detector "permanently connected to the transmitting aerial", so **no mechanical change-over switch** [read]. The 840 note is secondary (J. Proc) and conflicts with 60 cycles; 560 was not found (Conflicts 1).
- **Morse of 1912:** International (Continental) Morse; a dash three dots, one dot within a letter, three between letters, and **five between words** (not seven) [read: Marchant 1912, the International Telegraph Regulations' rule]; speeds counted at five letters a word; a station sends at not less than 12 words a minute and an operator's certificate asks transmission and sound-reading at 20 [read: the 1906 Berlin service regulations] (first and second classes, 20 and 12, came with the London convention of 1912). Procedure signals from the 1906 regulations (call, answer, end, distress `...---...` "repeated at short intervals", listen before calling) and Marconi usage from the testimony (CQ, CQD, DDD the silent signal, MSG, TR, RD, BI, OM, "keep out", "stand by") are in 10.6.
- **Rockets:** the rule's wording as the Senate printed it (night: a gun at about a minute, flames, "Rockets or shells, throwing stars of any color or description, fired one at a time at short intervals", a fog signal continuously) [read]; the socket signal as Lightoller described it (a 12-pounder's charge, a gunmetal socket, a time shell bursting "several hundred feet" up) [read]; what she carried (36 socket signals, 12 rockets, 2 deck flares, 12 blue lights, 6 lifebuoy lights) is still second-hand; the maker NOT FOUND; Carpathia's "company's rockets" every quarter hour from 2:45 and the White Star green "night signal" that Rostron saw [read].
- **What the brainstorm got wrong** (details in the sections): the word space (5, not 7); the change-over switch (none on her set; break-in was possible on Marconi sets); the meaning of 40 µA; 10 A from "500 W into 5 ohms" (5 ohms is too low; the figure survives as a fit); Cape Race "a set like her own" (the record says Cape Race was weak: "just audible" at 350 by day to the Olympic, and Evans "could not hear Cape Race that night"; fitted 1.5 A); Titanic's own spark heard from the silent room (Bride: "We could not hear at any time whether it was sparking"); the alternator's 420 cycles (the Marconigraph says 60). Its arithmetic of section 3.2 reproduces within 4 % with its own inputs.

## 1. The range law as published

| Figure | Value | Source (URL) | Short quote | Tag; confidence |
|---|---|---|---|---|
| Paper | L. W. Austin, "Some quantitative experiments in long-distance radiotelegraphy", Bulletin of the Bureau of Standards, vol. 7, no. 3, p. 315 (1911), dated Washington, 1 February 1911; reprint 159 | archive.org OCR text, https://archive.org/stream/some73153631911159159unse/some73153631911159159unse_djvu.txt | (title) | [read]; high |
| The formula | I_r = 4.25 I_s h1 h2 / (λ d) × e^(−α d / √λ), "where Ir represents the current received through 25 ohms resistance, Is the sending current, h1 the height of one antenna, h2 that of the other, d the distance between the stations, and λ the wave length" | Austin 1911, as above; the same formula in W. H. Eccles, *Wireless Telegraphy and Telephony: a handbook of formulae, data and information* (1918), p. 149, https://archive.org/download/wirelesstelegrap00eccl/wirelesstelegrap00eccl_djvu.txt | "where all the lengths are taken in kilometers and the currents in amperes" (Austin) | [read]; high (two texts and Austin's worked example) |
| Constant | 4.25; it "applies strictly only to ship" antennas with the cruisers' losses; other ships might differ by up to about 30 % (paraphrase of the paragraph) | Austin 1911 | "the constant 4.25 applies strictly only to ship" | [read]; high |
| Absorption | α = 0.0015, with d and λ in km; in metres the same is 0.0474 d_km / √λ_m (Eccles) | Austin 1911; Eccles 1918 p. 153 | "a is the absorption coefficient and in these experiments equals 0.0015" | [read]; high |
| Units | currents in amperes; heights, wave and distance all in kilometres; received current through 25 ohms | Austin 1911; Eccles | (above) | [read]; high |
| Receiving resistance | 25 ohms, the resistance of the Brant Rock thermoelement circuit and "approximately the effective resistance of a properly coupled ship's antenna of moderate size" (Austin 1911); "arbitrarily taken as 25 ohms" (Austin 1913); for ships 15 to 18 ohms at 1,000 m and about 35 at 3,750 m (Austin 1913) | Austin 1911; Austin, "Radiated and received energy in radiotelegraphy", Proc. American Philosophical Society 52 (read 19 April 1913), pp. 407-419, https://archive.org/stream/biostor-204040/biostor-204040_djvu.txt | "arbitrarily taken as 25 ohms" (1913) | [read]; high |
| Conditions | normal day received current over salt water, flat-top antennas, sending station coupled to give one wave; tested for sending currents 7 to 30 A, antenna heights 37 to 130 ft, waves 300 to 3,750 m, distances up to 1,000 nautical miles | Austin 1911; Eccles p. 149 (gives heights 30 to 130 ft) | "This is true in general for day transmission." | [read]; high |
| Where it came from | Brant Rock (a 420 ft steel tower, umbrella aerial; 100 kW, 500 cycles, synchronous rotary gap, 1,000 sparks a second, run at 50 to 60 kW) and the scout cruisers Birmingham and Salem (flat tops 112 ft high, then 130 ft; 500-cycle motor generators "rated at 10 kilowatts", the same kind of gap); December 1909 to May 1910; the inverse-distance law held to 100 to 200 miles from Brant Rock, then fell faster | Austin 1911; Eccles pp. 148-149 | (paraphrase) | [read]; high |
| Cohen | the √λ in the exponent was suggested by L. Cohen (so "Austin-Cohen") | Eccles p. 149 | "The term √λ in the index was suggested by L. Cohen." | [read]; high |
| Thresholds | "For good communication. Ir = 40 × 10⁻⁶ amperes through 25 ohms = 4 × 10⁻⁸ watts. For audible signals. Ir = 10 × 10⁻⁶ amperes through 25 ohms = 2.5 × 10⁻⁹ watts." Audibility = "that strength of signal which permits a clear differentiation of the dots and dashes". 40 µA is 16 times audibility in power (Eccles) | Austin 1911 (Table key); Eccles p. 152 | "For good communication" | [read]; high |
| Detector of those figures | "free wire electrolytic" detectors with 600-ohm telephones, shunted-telephone method; perikon detectors on the torpedo boats, about as sensitive (ratio 1.12) | Austin 1911 | (paraphrase) | [read]; high |
| Better detectors | with the 1913 apparatus unit audibility at 5 µA (Eccles, of the Arlington-Salem tests); Austin 1913: "the least audible antenna current was taken as seven microamperes instead of ten" | Eccles p. 152; Austin 1913 | "seven microamperes instead of ten" | [read]; high |
| Magnetic detector | energy for an audible dot with a good magnetic detector and telephone estimated at 0.0025 erg; liable to prove insensitive with musical spark signals (the first sparks use up the iron available, and the band brings fresh iron slowly); a heavy stray can nearly wipe out signals until fresh iron comes; band about 4 ft a minute; telephone coil about 70 ohms | Eccles pp. 284-285 | "0.0025 erg" | [read]; medium (one estimate, unsourced there) |
| Magnetic, in Austin's terms | a dot lasts 1.2/wpm s; 0.0025 erg in 0.06 s (20 wpm) is 4.2 × 10⁻⁹ W, i.e. 12.9 µA through 25 ohms; 11.2 at 15 wpm, 14.4 at 25 | `ether_rerun.js` | - | [derived]; medium |
| Fleming valve, tikker | no figure found for either | - | - | NOT FOUND |
| Aerial current and power | "even with 10 amperes, corresponding to a moderately efficient 2-kilowatt set, 345 miles is easily reached" (good daylight communication, 130 ft heights); doubling 30 to 60 A takes good range only from 565 to about 725 miles; cruisers 33 and 27 A (mean 30) at 1,000 m with 10 kW sets | Austin 1911 | "a moderately efficient 2-kilowatt set" | [read]; high |
| Other measured aerial currents | H.M. telegraph ship Monarch (1905, Duddell and Taylor): 2 to 3 A in a 110 ft aerial, about 100 µA received at 40 miles, 35 at 60, wave about 200 m; Arlington 100 to 120 A (spark), 48 to 53 A (arc); Telefunken I.T.K. ship set "about 1 kilowatt" in the aerial, efficiency 75 to 80 % claimed for larger quenched sets | Eccles p. 147; Austin 1913; Marchant 1914 (below) | (paraphrase) | [read]; medium |
| Marconi ship sets | no measured aerial current for a Marconi 1.5 or 5 kW ship set found | - | - | NOT FOUND |
| Night (1911) | "The absorption at night is entirely irregular varying from zero to the day value", on average much less in winter than summer; night signals at times "practically of the same strength as the day readings"; in a very few cases above the zero-absorption value; "The great variations in night absorption make useless all attempts to judge the quality of wireless apparatus from night distances" | Austin 1911 | "entirely irregular varying from zero to the day value" | [read]; high |
| Night (1913) | night signals generally stronger than by day but "freakish and irregular and unfitted for quantitative comparisons"; Arlington's night signals heard all the way to Gibraltar (6,400 km), about 200 times audibility | Austin 1913; Eccles p. 152 | "freakish and irregular" | [read]; high |
| Night distances (1910) | Brant Rock's short wave received on the Birmingham at 2,550 miles at night; night signals from Brant Rock first received at 2,776 miles; faint day signals at 1,325, 1,720 and 2,090 miles on abnormal days | Austin 1911 | (paraphrase) | [read]; high |
| Proceedings of the IRE, 1913 | the one Austin paper found in volume 1 is on condenser resistance, not transmission; the transmission results of 1913 are in the Bulletin vol. 11 (PDF, not opened) and Proc. Am. Phil. Soc. (read) | search digest | - | [search summary]; NOT FOUND as a transmission paper |

## 2. The night's traffic: sources and clocks

The full word-for-word timetable is 10.4 (so the builder has one table). The sources:

| Source | What it holds | Clock | URL | Tag |
|---|---|---|---|---|
| Mount Temple PV (Durrant), submitted by Capt. Moore, US Day 10 | 40 entries, 9.55 pm to 7.40 am, with a key of call signs (MGY Titanic, MWL Californian, MKC Olympic, MPA Carpathia, MBC Baltic, DFT Frankfurt, MGN Virginian, SBA Birma) | NY | https://www.titanicinquiry.org/USInq/AmInq10PVMT01.php | [read] |
| Olympic PV (E. J. Moore), US Day 18 | 37 entries, 10.15 pm to 1.40 pm, with copied messages | "Sunday, April 14, 1912 - New York Time" | https://www.titanicinquiry.org/USInq/AmInq18PVOlympic01.php | [read] |
| Baltic PV (Gilbert W. Balfour, "Officer in charge, Marconi Telegraphs"), US Day 14 | 22 log entries, 10.45 pm to 1.00 pm, and "Copies of messages sent and received with reference to the Titanic" (7) | NY; Balfour: "we subsequently found that my clock is fast" (a few minutes) | https://www.titanicinquiry.org/USInq/AmInq14PVBaltic01.php; Balfour's evidence https://www.titanicinquiry.org/USInq/AmInq14Balfour01.php | [read] |
| Cape Race log, "The Titanic Disaster as Viewed from Cape Race" (R. Hunston), transcribed by the Nova Scotia archives | 13 entries, 10:25 pm to 2:05 am and after daylight | EST | Wayback copy, https://web.archive.org/web/2006id_/http://titanic.gov.ns.ca/wireless.html | [read: copy] |
| Virginian PV, 12.27 entry, read out by the Attorney-General | the last signals | NY | BI after 17215, https://www.titanicinquiry.org/BOTInq/BOTInq15Cottam02.php | [read] |
| Carpathia: Cottam's accounts (his PV stopped when the call came; the later "PV" was reconstituted by the company) | the exchanges with Titanic | NY ("New York time right throughout", BI 17182) | US Day 1 pp. 1-3, https://www.titanicinquiry.org/USInq/AmInq01Cottam02.php, https://www.titanicinquiry.org/USInq/AmInq01Cottam03.php; US Day 6, https://www.titanicinquiry.org/USInq/AmInq06Cottam01.php; BI Day 15, https://www.titanicinquiry.org/BOTInq/BOTInq15Cottam01.php | [read] |
| Bride's accounts | the call's form, the Frankfurt | ship's | US Day 2, https://www.titanicinquiry.org/USInq/AmInq02Bride02.php to Bride04 | [read] |
| Evans (Californian) | 9:05 pm, 3:25-3:40 am | NY and his ship's | US Day 8, https://www.titanicinquiry.org/USInq/AmInq08EvansCF01.php, https://www.titanicinquiry.org/USInq/AmInq08EvansCF02.php; BI as read at 16255 | [read] |
| Durrant (Mount Temple) | his log read at the inquiry, ship's time = NY + 1 h 46 min | both | BI Day 8, https://www.titanicinquiry.org/BOTInq/BOTInq08Durrant01.php | [read] |
| Turnbull (Marconi deputy manager), the company's originals | the ice messages as sent, with their PV entries; the time rule: "When the ships are west of 40º New York time is kept; when they are east of 40º Greenwich time is kept" (BI 16066) | NY or GMT by longitude | BI Day 13, https://www.titanicinquiry.org/BOTInq/BOTInq13Turnbull01.php; Day 14, https://www.titanicinquiry.org/BOTInq/BOTInq14Turnbull01.php, ...02.php, ...03.php | [read] |
| Titanic's own PV | lost with her; the company "endeavoured to reconstitute the record" (BI 16054) | - | Turnbull, BI 16054 | NOT FOUND (lost) |

### 2.1 The messages that describe her state, as logged (NY, T)

Struck berg, position (10.25, T 47); corrected position (10.35, T 57); sinking, cannot hear for noise of steam (British Report's 12.26, T 58 on this reading); SOS (10.55, T 77); "Captain says get your boats ready. Going down fast at the head." (11.20, T 102); putting the women off in the boats (11.35-11.40, T 117-122); engine room flooded / getting flooded (11.41-11.45, T 123-127); "sea calm", "clear and calm" (11.43-11.45, T 125-127); last acknowledgement, "Rd" to the Olympic (11.47, T 129); to Carpathia, engine room "filling up to the boilers" (11.55, T 137); SOS last heard by the Asian (11.58, T 140); calling CQ, blurred, abrupt, heard by the Virginian (12.27 am, T 169, after she sank at T 160 on this reading: the wireless note's Conflicts 9) [read; T derived].

### 2.2 What the operators said about strength and range that night

| Who | What | Source | Tag |
|---|---|---|---|
| Baltic, 243 miles | "Jamming bad, but hear Titanic very faint, calling Olympic - latter strong; freaky." Titanic "appears to be tuned to Olympic and cuts me out." | Baltic PV 11.10 pm | [read] |
| Asian, about 300 miles W | heard Titanic signalling Cape Race "on and off from 8 to 10 p. m., local time ... Messages too faint to read"; earlier "very faint" | Olympic PV 5.40 and 8.30 am | [read] |
| Olympic, 505 miles | at 10.50 pm "Am interfered by atmospherics and many stations working." | Olympic PV | [read] |
| Carpathia, 10 pm NY | "Good night to the 'Mount Temple'; his signals very weak." (about 79 nm apart then [derived from the positions in the wireless note]) | Cottam, BI 17082 | [read] |
| Mount Temple | Titanic's signals "never got weak at all" allowing for his approach | Durrant, BI 9549 | [read] (wireless note) |
| Virginian, 170 miles | at 12.27 am: "unable make out his signal; ended very abruptly, as if power suddenly switched off - his spark rather blurred or ragged." | Virginian PV | [read] |
| Titanic | could not read the Mount Temple at 10.25 ("Can not read you, old man"); could not read the Olympic "because the rush of air and the escape of steam"; Cottam: "it would not be the noise only; it would be the trembling of the ship" | MT PV; Cottam US Day 1; BI 17123 | [read] |
| Bride | judged the Baltic "from the strength of her signals ... too far away to do any good" | US Day 2 p. 4 | [read] |
| Olympic, by day | Cape Race at 350 miles "just audible" (10.55 am); "his sigs dead week" (1.25 pm); Cape Race heard the Olympic: "Your signals good here" (7.40 am) while the Olympic "Called Cape Race several times, but unable to hear him" | Olympic PV | [read] |
| Evans | "Cape Race will only be a whisper and mine would come in with a bang"; "myself, I could not hear Cape Race that night" | US Day 8 p. 2 | [read] |

### 2.3 The Marconi composite, read only in a copy

The company's reconstitution of the night from the PVs of the ships in the vicinity (BI 17174, "prepared by our company from the procès-verbals of the various ships") was printed for the British inquiry; it is not in the TIP's text. A copy (2013, Newark News Radio Club blog, https://newarknewsradioclub.blogspot.com/, post of 21 May 2013) gives it "by the ship's clock" (its 12-15 a.m. is Cape Race's 10:25 pm NY, so its clock is NY + 1:50). The blog adds glosses in brackets (one of them, about engineers releasing steam, is the blogger's, not the log's); some entries are garbled (its "DKF ... gives position at 12 a.m. 39.47 N. 50.10 W." mixes the Prinz Friedrich Wilhelm's call with the Frankfurt's position), and some times disagree with the Mount Temple's log (Carpathia's "If you are there we are firing rockets": MT 1.25 am NY, copy 2-35 a.m. = 12.45 NY). The entries that no 1912 page I opened holds are these, transcribed from the copy without the blogger's glosses [read: copy; medium-low]:

| Copy's time | NY | T | Entry as in the copy |
|---|---|---|---|
| 12-15 a.m. | 10.25 | 47 | CQD (6 times) DE MGY (6 times) position 41.44 N. 50.24 W. La Provence and Frankfurt receive Titanic's first distress signals. Titanic sends position to Frankfurt. Frankfurt says "OK: stand by" |
| 12-18 a.m. | 10.28 | 50 | Ypiranga hears CQD from Titanic. Titanic gives CQD here (sic). Position 41.44 N. 50.24 W. Require assistance (calls about 10 times). |
| 12-25 a.m. | 10.35 | 57 | Titanic says "Come at once. We have struck a berg. It's a CQD OM ... Position 41.46 N. 50.14 W." Carpathia says "Shall I tell my Captain? Do you require assistance?" Titanic says "yes, come quick" |
| 12-25 a.m. | 10.35 | 57 | MGY says CQD, Here corrected position 41.46 N. 50.14 W. Require immediate assistance. We have collision with iceberg. Sinking. Can hear nothing for noise of steam. Sent about 15 to 20 times to Ypiranga. |
| 12-27 a.m. | 10.37 | 59 | Titanic sends following: "I require assistance immediately. Struck by iceberg in 41.46 N. 50.14 W." |
| 12-30 a.m. | 10.40 | 62 | Caronia sent CQ message to MBC Baltic and CQD: MGY struck iceberg, require immediate assistance |
| 12-45 a.m. | 10.55 | 77 | Titanic calls Olympic SOS. |
| 12-50 a.m. | 11.00 | 82 | Titanic calls CQD and says, "I require immediate assistance. Position 41.46 N. 50.14 W." Received by Celtic. |
| 12-53 a.m. | 11.03 | 85 | Caronia to MBC (Baltic) and SOS, "MGY CQD in 41.46 N. 40.14 W. Wants immediate assistance." |
| 1-0 a.m. | 11.10 | 92 | MGY gives distress signal. DDC (Cincinnati) replies. MGY's position 41.46 N. 50.14 W. Assistance from DDC not necessary as MKC shortly afterwards answers distress call. |
| 1-2 a.m. | 11.12 | 94 | Titanic calls Asian and said, "Want immediate assistance" Asian answered at once and received Titanic's position as 41.46 N. 50.14 W., which he immediately takes to the bridge. Captain instructs operator to have Titanic's position repeated. |
| 1-2 a.m. | 11.12 | 94 | Virginian calls Titanic but gets no response. Cape Race tells Virginian to report to his Captain the Titanic has struck iceberg and requires immediate assistance. |
| 1-10 a.m. | 11.20 | 102 | Titanic to MKC (Olympic), "We are in collision with berg. Sinking Head down. 41.46 N. 50.14 W. Come soon as possible." |
| 1-15 a.m. | 11.25 | 107 | Baltic to Caronia, "Please tell Titanic we are making towards her." |
| 1-20 a.m. | 11.30 | 112 | Virginian hears MCE (Cape Race) inform MGY "that we are going to his assistance. Our position 170 miles N. of Titanic." |
| 1-25 a.m. | 11.35 | 117 | Caronia tells Titanic, "Baltic coming to your assistance" |
| 1-30 a.m. | 11.40 | 122 | Titanic tells Olympic, "We are putting passengers off in small boats." "Women and Children in boats, can not last much longer" |
| 1-37 a.m. | 11.47 | 129 | Baltic tells Titanic, "We are rushing to you." |
| 1-40 a.m. | 11.50 | 132 | Cape Race says to Virginia: "Please tell your Captain this: The Olympic is making all speed for Titanic, but his position is 40.32 N. 61.18 W. You are much nearer to Titanic. The Titanic is already putting women off in the boats, and he says the weather there is calm and clear. The Olympic is the only ship we have heard say, Going to the assistance of Titanic. The others must be a long way from Titanic" |
| 1-47 a.m. | 11.57 | 139 | Caronia hears Titanic though signals unreadable still. Virginia hears Titanic calling very faintly, his power being greatly reduced. |
| 1-48 a.m. | 11.58 | 140 | Asian heard Titanic call SOS Asian answers Titanic but receives no answer. DFT (Frankfurt) calls Titanic and says, "What is the matter with u?" |
| 1-50 a.m. | 12.00 | 142 | Titanic says to Frankfurt "You fool, stdbi and keep out". Caronia hears Frankfurt working to Titanic. Frankfurt according to position 172 miles from MGY at time first SOS sent out. |
| 1-55 a.m. | 12.05 | 147 | Cape Race says to Virginian "we have not heard Titanic for about half an hour. His power may be gone." |
| 2-10 a.m. | 12.20 | 162 | Virginian hears 2 v's signalled faintly in spark similar to Titanic's. |
| 3-28 a.m. | 1.38 | 240 | La Provence to Celtic, "Nobody has heard the Titanic for about 2 hours." |
| 4-24 a.m. | 2.34 | 276 | SBA (Birma) says "we are 30 miles S.W. off Titanic". |

The "2 v's ... in spark similar to Titanic's" is the one place in the record where a station is known by its spark, before she signs [read: copy].

## 3. The ice messages of 14 April

The texts as the Marconi Company produced them at the British inquiry, with each PV's entry and NY time, are in 10.5. In the British Report (read in the brainstorm) the times are Titanic's on the 1 h 50 min reading (9 am, 1.42 pm, about 1.45 pm, 7.30 pm, 9.40 pm); on the 2 h 02 min reading they are 9:12 am, 1:54 pm, 1:47 pm, 7:37 pm and 9:52 pm [derived]. Two points the Report does not make: the Caronia's original form ends "April 12", which Captain Barr's version omitted (BI 16109); and the Mesaba's form carries the operator's own note "Reply received, thanks. Sent this to about ten other ships as well; names in P.V.", with nothing on it to show that the reply came from Titanic rather than another ship (BI 16223-16236) [read].

| Figure | Value | Source | Tag |
|---|---|---|---|
| "MSG" | "Master service message, a message which is transmitted on the subject of the navigation of the ship" | Turnbull, BI 16059 | [read] |
| Trs, "time rushes" | exchanged on first contact "to inform each other of the telegrams which one has for the other, and to check their times"; communication is established when they are exchanged | Turnbull, BI 16193, 16215, 16247-16255 | [read] |
| Relays | a ship out of range of the coast passes a message through a nearer ship: "Very common" (BI 16133); the relaying operator must write it down, "We do not allow them to trust to memory" (16159) | Turnbull | [read] |
| A dozen words | "He would receive that in about a minute." | Turnbull, BI 16157 | [read] |
| Receive and send | "he does not receive and send at the same time" | Turnbull, BI 16155 | [read] |
| The 9:05 exchange | as Evans gave it at each inquiry (10.4, 10.5); Turnbull on "keep out": an operator jammed "is simply told to stop it ... as if anyone interrupts you when you telephone" | BI 16258 | [read] |

## 4. The stations

### 4.1 Titanic, MGY

| Figure | Value | Source | Short quote | Tag; confidence |
|---|---|---|---|---|
| Call sign | MGY ("the call letters for the 'Titanic'") | Turnbull BI 16057; MT PV key; Bride US Day 2 | "M.G.Y. is the code call of the Titanic" (Bride) | [read]; high |
| Set | "the most powerful possessed by any vessel of the mercantile marine, and only equalled by that of the 'Olympic'"; 5 kW motor-generator yielding 300 V, 60 cycles; motor fed at 110 V DC from the ship's lighting circuit (OCR "119"; TRMA's quotation of the same text reads 110) | "Wireless Equipment of the 'Titanic'", The Marconigraph, May 1912, p. 100, archive.org OCR, https://archive.org/download/the-marconigraph-vol-2/The%20Marconigraph%20vol%202_djvu.txt (lines 5801-5880) | "yielding current at 300 volts 60 cycles" | [read]; high as the company's statement |
| Discharger | "the ordinary Marconi rotary disc discharger was used. This is driven off the shaft of the motor-generator." Air-core transformer; condenser of oil-immersed glass plates | Marconigraph, as above | "driven off the shaft of the motor-generator" | [read]; high |
| Synchronous? | a synchronous disc has studs "equal in number to the poles of the alternator", one discharge each half-cycle (Marchant 1914, of Marconi practice); on a 60-cycle alternator that is 120 sparks a second. A plain studded disc gives studs × revolutions a second, any number. Which hers was is not stated in anything read | W. H. Marchant, *Wireless Telegraphy: a handbook for operators* (1914), https://archive.org/download/cu31924031236221/cu31924031236221_djvu.txt | "one discharge takes place for each half-cycle" | [read], [derived]; low on her kind |
| Note | 840 (J. Proc's equipment table: "a CW note of 840 Hz"); 420 Hz alternator, 16 studs, 840 note (a hobbyist PDF, search digest only); 560: not in any page found. With the Marconigraph's 60 cycles, 840 needs a non-synchronous disc of 14 studs at 3,600 rpm or 28 at 1,800 [derived] | J. Proc, "Wireless aboard the Titanic", https://jproc.ca/radiostor/titanic.html | "This set produces a CW note of 840 Hz." | [read] secondary, [search summary]; low (Conflicts 1) |
| Pitch with speed | the disc turns with the motor, so the note falls as the motor slows on a failing supply (either kind of disc) | follows from "driven off the shaft" | - | [derived]; high |
| Telephones | most sensitive between 600 and 1,000 vibrations a second (natural period of the diaphragm) | Marchant 1914 | "between 600 and 1000 per second" | [read]; medium |
| Aerial | twin T, two masts 200 ft high, 600 ft apart, mean height 170 ft, used for sending and receiving; earth by insulated cable to the hull | Marconigraph | "had a mean height of 170 ft" | [read]; high |
| Receiver | "the Marconi standard magnetic travelling band detector used in conjunction with their multiple tuner", waves 100 to 2,500 m; the tuner "calibrated to permit of the instrument being set to any prearranged wave-length", with "a change switch" from "a highly-syntonised tuned condition to an untuned condition (for stand-by)"; also a valve receiver (Bride) | Marconigraph; Bride US Day 2 p. 1 | "an untuned condition (for stand-by)" | [read]; high |
| Change-over | none: "By reason of its robust nature the magnetic detector could be employed permanently connected to the transmitting aerial, thus dispensing with all mechanical change over switching arrangements." On Marconi's 1.5 kW sets the receiver sits across the earth-arrester gap, shorted by the sparks while the key is down, so "the receiving operator" can "interrupt the sending operator during the course of transmission" (break-in) | Marconigraph; Marchant 1914 | "dispensing with all mechanical change over switching arrangements" | [read]; high |
| Magnetic detector | an endless band of fine iron wires over two pulleys "slowly rotated by means of a clockwork motor"; "sensitive and extremely reliable"; needs only "occasional winding of the clockwork motor"; a key to wind it and a key to start or stop it | Marchant, *The radio-telegraphist's guide and log-book* (1912), https://archive.org/download/02-000463402/02-000463402_djvu.txt; Marchant 1914 | "occasional winding of the clockwork motor" | [read]; high. The clockwork's run time: NOT FOUND |
| Wave | 600 m (Evans: "That is the wave length prescribed for ship's stations"; Cottam: "Six hundred meters; the standard"); the 1906 Berlin regulations made 300 m the normal ship wave and allowed up to 600 | Evans US Day 8 p. 2; Cottam US Day 10; Berlin regulations art. II and III | (paraphrase) | [read]; high |
| Range | guaranteed 250 miles "under any atmospheric conditions", about 400 by day, at night "often increased up to about 2,000 miles" (Marconigraph); guaranteed 350, "would do 500 miles", "could receive up to 1,500 miles from high power stations", at night "anything from two to three times as much" (Turnbull) | Marconigraph; Turnbull BI 16026-16037 | "anything from two to three times as much" (Turnbull) | [read]; medium (two figures) |
| Supply | ship's lighting circuit "normally supplied from steam-driven sets"; "in addition, an independent oil-engine set installed on the top deck, and a battery of accumulators was also provided as a stand-by" (Marconigraph); the TRMA and the plant note give the two 30 kW engine-dynamo sets and a separate battery-and-coil set | Marconigraph; L. Jibson, "Titanic's Aerial", TRMA, https://trmaarchive.com/marconi/article.shtml | "an independent oil-engine set installed on the top deck" | [read]; conflict (Conflicts 2) |
| Emergency set | Marconi practice: "an emergency set which is quite independent of the ship's machinery": a 10-inch induction coil, 8 accumulator cells and a charging switchboard (Marchant 1914); Titanic's: a 1.5 kW plain spark set on a 10-inch coil from batteries, about 40 miles by day (J. Proc); with its own receiver and an emergency aerial stored below (TRMA). Night range NOT FOUND. The Virginian at 12.27 "suggested he should try emergency set" | Marchant 1914; J. Proc; TRMA; Virginian PV | "quite independent of the ship's machinery" (Marchant) | [read]; medium on the kind, low on the range |
| Operators | Phillips 8 pm to 2 am, Bride 2 to 8 am, a constant watch | the wireless note §1 | - | [read]; high |
| The silent room | the spark "was in an enclosed room. We could not hear at any time whether it was sparking." | Bride, US Day 2 p. 4 | "We could not hear at any time whether it was sparking." | [read]; high |
| Speed | NOT FOUND for Phillips or Bride. The first CQD "was sent slowly and carefully by Mr. Phillips" (Bride) | Bride US Day 2 p. 4 | "sent slowly and carefully" | [read]; speed NOT FOUND |

### 4.2 The others

Positions from the wreck are the wireless note's (§3) unless stated. "Set" is what the record says; [bet] marks what is assumed.

| Station | Call sign | Set | Aerial | Operators and hours that night | Range stated | Position from the wreck | Tags |
|---|---|---|---|---|---|---|---|
| Carpathia | MPA [read: MT key] | "A one and a half watt set" as printed (US Day 1; kilowatt meant [bet]), "an older type"; power "varied according to the ship's mains. The ship's mains ran about 95 volts ... about one-half to three-quarters of a kilowatt"; 600 m but "unattuned - plain serial [aerial]" most of the time; storage battery switched out for the night | NOT FOUND | Cottam alone; daytime watch, retires "about midnight" at sea; at 10.35 NY "about to retire", would have turned in "in about 10 minutes or a quarter of an hour" (BI 17092); had been taking Cape Cod's news, waiting for the Parisian | 250 by day; "best results ... In the night" | 46.5 nm, 136° | [read] |
| Californian | MWL [read: MT key, Bride, Sammis] ("M.W.H." as printed in Evans's US evidence) | Marconi set "made for 100-volt dynamos" on "60-volt dynamos ... I get a little over half the power I should get"; 600 m, fitted for 300 | NOT FOUND | Evans alone; on from 7 am with meal breaks; phones down 11.35 her time (US), 11.30 (BI); woken 3.30 NY | 250; 200 on batteries (wireless note) | 18 nm (MAIB), 9 (Court), 22.8 (Lord's DR); 341° | [read] |
| Mount Temple | MLQ [read: TIP ship page (J. P. Eaton)] | Marconi (Durrant was the company's man); power NOT FOUND; storage batteries in the room, change "in a minute", signal "Much weaker" | NOT FOUND | Durrant alone; starts 7.30 am, sleeps about three hours after the midday meal, "never turn in before 1 a.m." | "about 150 miles in the daytime, and something over 200 at night" | 60.6 nm (49.5 from the CQD position), 245° from it | [read] |
| Frankfurt | DFT [read: MT key, Evans] | "equipped by a German company, called the Debed Co." (Marconi), i.e. DEBEG, associated with Marconi; Telefunken quenched spark, note near 1,000 [bet] | NOT FOUND | NOT FOUND | NOT FOUND | 154 nm, 216° | [read], [bet] |
| Birma | SBA [read: MT key] | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | 100 nm SSW (70 to 107) | [read] |
| Virginian | MGN [read: MT key] ("M.G.M." as printed in Evans) | NOT FOUND | NOT FOUND | NOT FOUND (kept her PV through the night) | NOT FOUND | about 170 nm N (178, Eaton) | [read] |
| Baltic | MBC [read: MT key] | NOT FOUND | NOT FOUND | Balfour (Marconi inspector, "Officer in charge"); clock fast | NOT FOUND | 243 nm E (her log; her message to Titanic) or SE (Balfour, US Day 14; US Report) | [read] |
| Olympic | MKC [read: MT key, 1912]; MKG [read: TIP ship page] | as Titanic's (Marconigraph) | as Titanic's [bet] | E. J. Moore (and a second operator [bet]) | as Titanic's | 505 nm W by S at 11.10 NY; "4.24 a. m. G.M.T. 40.52 N., 61.18 W." in her own message | [read] |
| Caronia | MRA [read: TIP ship page] | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | about 800 nm E (US Report); "perhaps 600 miles farther east" than the Baltic (Balfour) | [read] |
| Asian | MKL [read: TIP ship page] | NOT FOUND; towing the oil tanker Deutschland at 5 knots | NOT FOUND | NOT FOUND | NOT FOUND | "300 miles west of Titanic" (her own service message) | [read] |
| Cape Race | MCE [read: copy (composite), TIP]; "CE until 1912" [search summary] | Marconi coast station opened 1904 [search summary]; power NOT FOUND; weak in the record (2.2) | NOT FOUND | Walter Gray, Jack Goodwin, Robert Hunston (Goodwin on watch at 10:25, Gray at 10:40, Hunston "RH" at 10:45) | NOT FOUND | about 380 nm SSE of Cape Race, so Cape Race NNW of her | [read: copy] |
| Cape Cod | MCC (wireless note) | long-distance press station; wave "about 1,600" (Cottam's guess); news sent twice; first round of press finished at 10.30 NY | NOT FOUND | - | - | far W | [read] |
| Parisian | MZN [read: TIP] | NOT FOUND | NOT FOUND | operator turned in "at 11.15, ship's time" | NOT FOUND | about 50 miles ahead (west) of the Californian (her operator) | [read] |
| Mesaba | MMV [read: TIP] | NOT FOUND | NOT FOUND | S. H. Adams ("S.H.A.") | NOT FOUND | NOT FOUND (west-bound, ahead of Titanic) | [read] |
| Amerika | DDR [read: TIP] | NOT FOUND | NOT FOUND | NOT FOUND | out of reach of the coast; "just about 40º West" at 11.45 am NY (Turnbull) | NOT FOUND at night | [read] |
| Antillian | MJL [read: Turnbull BI 16188] | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | about 60 miles astern of the Asian (Asian's message) | [read] |
| Ypiranga, La Provence, Celtic, Prinz Friedrich Wilhelm, Cincinnati | DYA, MLP, MLC [read: TIP]; DKF, DDC [read: copy] | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | - |
| Others named in the logs | Helig Olav DHO, Scandinavian MNC, Minnewaska MMW, Athinai MTI (about 160 SW by her captain's later estimate), La Touraine MLT, Noordam MHA [read: TIP]; Sable Island; Eastport, Me., "W. Q." (Balfour); Monmouth MGV (Turnbull BI 16264) | - | - | - | - | - | [read] |

## 5. How a 1912 Marconi operator worked

| Figure | Value | Source | Short quote | Tag; confidence |
|---|---|---|---|---|
| The code | International (Continental) Morse at sea: the 1906 regulations' art. XV, "The signals used are those of the International Morse Code."; American Morse is a separate table in Marchant 1912 (land lines); the US licences of 1912 on tested "Continental Morse" | International Radiotelegraphic Convention, Berlin 1906, service regulations, text in Am. J. Int. Law Supplement (1909), https://archive.org/download/jstor-2212647/2212647_djvu.txt; Marchant 1912 App. IV; FCC reprint of the radio laws (1919), https://archive.org/download/fcc_DOC-328535A1/DOC-328535A1_djvu.txt | "those of the International Morse Code" | [read]; high |
| Timing | "1. A bar is equal to 3 dots. 2. The space between the signals which form the same letter is equal to 1 dot. 3. The space between two letters is equal to 3 dots. 4. The space between two words is equal to 5 dots." The ITU still said five dots in 1938 (Wikipedia's citation of the Cairo telegraph regulations); seven is the modern rule | Marchant 1912, App. II; Wikipedia, "Morse code", https://en.wikipedia.org/wiki/Morse_code | "The space between two words is equal to 5 dots." | [read]; high |
| Speed counting | "five letters being counted as one word" | Berlin regulations art. VI.2(b) | "five letters being counted as one word" | [read]; high |
| Speeds required | a station's transmission "must, in normal circumstances, not be less than 12 words a minute, five letters being counted as one word" (British version: "not less than twelve words per minute"); the operator's certificate: "Transmission and sound-reading at a speed which must not fall short of 20 words a minute". The London convention of July 1912 (in force 1913) made two classes, 20 and 12 to 19 | Berlin regulations art. VI.2(b), VI.3(b); Marchant 1912 ch. "Regulations"; FCC 1919 reprint | "not fall short of 20 words a minute" | [read]; high |
| Power, system | a ship station's system "must be a syntonised system"; "The power imparted to the radiotelegraphic apparatus must not, in normal circumstances, exceed one kilowatt", more allowed beyond 300 km from the nearest coast station or past obstacles (British version: "over 165 nautical miles"); all stations to use the least power that gives effective communication (art. XXVIII) | Berlin regulations art. VI.2(a), (c); Marchant 1912 | "must not, in normal circumstances, exceed one kilowatt" | [read]; high |
| Operators' speeds that night | NOT FOUND for Phillips, Bride, Cottam, Evans, Durrant. A dozen words "in about a minute" (Turnbull, of a relay) | BI 16157 | - | NOT FOUND |
| Listen before calling | "Before beginning to call, the ship station must adjust its receiving apparatus to the highest possible degree of sensitiveness and make sure that the coast station which it wishes to call is not engaged in communication. If it finds that transmission is taking place it awaits the first break." | Berlin regulations art. XIX.3 | (as quoted) | [read]; high |
| Calling | "The call comprises the signal — • — • —, the call-signal of the coast station thrice repeated, the word 'de' followed by the call-signal of the transmitting station thrice repeated." The answer: the same signal, the caller's call thrice, "de", its own call, and — • — | art. XX | (as quoted) | [read]; high |
| No answer | after a call "thrice repeated at intervals of two minutes", the call can only be renewed after half an hour (not in distress: Marchant 1912) | art. XXI; Marchant 1912 | - | [read]; high |
| A message | preceded by — • — • — and ended by • — • — • followed by the sender's call; after each series of about 20 words a ".. — — .." and the last word repeated back; at most three repetitions, then cancelled; "reception doubtful" noted; end of work • • • — • — and own call | arts. XXIV-XXIX | (paraphrase) | [read]; high |
| Distress | "Ships in distress make use of the following signal: • • • — — — • • • repeated at short intervals. As soon as a station perceives the signal of distress it must suspend all correspondence ... When a ship in distress adds, after a series of signals of distress, the call-signal of a particular station, the duty of answering the call rests with that station only." | art. XVI | (as quoted) | [read]; high |
| CQ, CQD, SOS | "C.Q. is the call for all stations ... 'All other stations stand at attention and reply.'" CQD "was introduced originally by my company"; SOS is the Berlin convention's, "really less known than the Marconi Co.'s signal" (Marconi). "C.Q. means all stations, some one answer" (Evans). CQ "so easily confused with 'C.Q.D.'" was a reason the call was altered (Durrant BI 9582-9583) | Marconi and Bride, US Day 2; Evans US Day 8; Durrant BI | "C.Q. is the call for all stations." | [read]; high |
| The first call | "C.Q.D. about half a dozen times; M.G.Y. half a dozen times." with the position | Bride, US Day 2 p. 2 | (as quoted) | [read]; high |
| DDD | the silent signal: "Yes, sir; that means 'shut up.'" | Marconi, US Day 2 p. 3 | "that means 'shut up.'" | [read]; high |
| Marconi words | MSG, the master's service prefix; TR / time rush, the first exchange; RD, "the usual acknowledgement of receipt ... the Marconi signal" (Bride); "T. I. S." the "usual finishing signal" (Bride, as printed); "Bi", "It means to say 'enough,' 'finished.'" (Evans; the Olympic's log: "Scandinavian gives 'BI' for lunch"); "old man" (OM); "Good night" (Cottam); "Stand by" (the Frankfurt; Bride: "To wait for his position"); "stand by on phones and not call" (Balfour); "Keep out" (Evans; Turnbull 16258); "jammed", "jamming": "when somebody is sending a message to somebody else and you start to send at the same time, you jam him" (Evans) | as cited | "It means to say 'enough,' 'finished.'" (Evans) | [read]; high |
| Prefix | private messages known "by the prefix, the sound that is sent first of all" | Evans, read at BI 16255 | "You can tell by the prefix." | [read]; high |
| British abbreviations of 1912 | two-letter codes for station work, repeated three times: "RA What station is corresponding?", "SD You can transmit faster", "SE I am occupied with another station", and meanings including "At what distance are you from my station?", "What is your wave length in metres?", "I am being interfered with", "Atmospherics are very strong", "Transmit more slowly", "Increase your power", "Stop transmitting", "General call to all stations", "Wait. I will call you as soon as I have finished." (most codes lost in the scan); only between British coast stations and ships licensed by the Postmaster-General | Marchant 1912, App. III | (as quoted) | [read]; medium (OCR) |
| One thing at a time | "a Marconi operator, like other people, can only clearly hear one thing at a time? - Yes." | Evans, read at BI 16255 | (as quoted) | [read]; high |
| Waves exclude each other | "You can not receive a message with the 600-meter wave length and another with the 1,600 meter wave length at the same time." | Cottam, US Day 10 | (as quoted) | [read]; high |
| Distance by strength | Bride: at close range "You can read the signals through one telephone ... When a ship gets 100 miles off, you have to have both telephones on and devote your attention to it"; Phillips judged the Frankfurt nearer "by the strength of the signals". Cottam: by day "to a certain extent", "Provided I know what system he is fitted with and what power his plant is, and the time of day, I can tell roughly how far he is off - 150 or 200 or up to 300 miles off"; after dark, "Not after dark, sir." Evans: boats alongside sending as weakly as at 200 miles, others "with such a bang you would have to take the telephones away from your ears"; "it depends on how a boat is being tuned" | Bride US Day 2 pp. 3-4; Cottam US Day 6; Evans US Day 8 p. 2 | "Not after dark, sir." (Cottam) | [read]; high |
| Recognising a station | by her call sign; once, by her spark: the Virginian heard "2 v's signalled faintly in spark similar to Titanic's" | composite (2.3) | - | [read: copy]; low |
| Practice at night | Cottam: at night only the captain's business; operators sleep about eight hours, "for one-third of the time there is, so to speak, no operator on the ship" (Commissioner, BI 17090); Cape Cod sends one hour in four (Senator Bourne's question) | Cottam US Day 1; BI 17085-17097; US Day 10 | (paraphrase) | [read]; medium |
| British ships to ships | "British ships at present are not bound to exchange messages with other ships ... except in cases of distress" | Marchant 1912 | (as quoted) | [read]; high |

## 6. The rockets and the other signals

| Figure | Value | Source | Short quote | Tag; confidence |
|---|---|---|---|---|
| The rule in April 1912 | "SIGNALS OF DISTRESS. When a vessel is in distress and requires assistance from other vessels or from the shore, the following shall be the signals to be used or displayed by her, either together or separately: ... AT NIGHT. (1.) A gun or other explosive signal fired at intervals of about a minute. (2.) Flames on the vessel (as from a burning tar barrel, oil barrel, etc.). (3.) Rockets or shells, throwing stars of any color or description, fired one at a time at short intervals. (4.) A continuous sounding with any fog-signal apparatus." By day: the gun at about a minute; NC; the square flag and ball; the cone and ball; the fog signal | US Senate Report, "International signals of distress at sea", https://www.titanicinquiry.org/USInq/USReport/AmInqRep06.php; the British Commissioner read the same rockets clause at BI 8006 (wireless note §5) | (as quoted) | [read]; high |
| The law behind it | Merchant Shipping Act 1894: s. 434, rules by Order in Council on what signals are distress signals, and a master who shows one without distress pays compensation as for salvage; s. 435, a sea-going passenger steamer must carry "means for making the said signals of distress at night, including means of making flames on the ship which are inextinguishable in water"; s. 733, private (company) signals registered with the Board of Trade, which publishes them so they are not mistaken for distress signals | Irish Statute Book (the Act as enacted), https://www.irishstatutebook.ie/1894/en/act/pub/0060/sec0434.html, ...sec0435.html, ...sec0733.html | "inextinguishable in water" | [read]; high |
| The number required | the Board of Trade's rule fixing how many signals a ship of her class carried | - | - | NOT FOUND |
| What she carried | 36 socket signals, 12 ordinary rockets, 2 Manwell Holmes deck flares, 12 blue lights, 6 lifebuoy lights (a 1998 newsgroup post, no source given); 36 per the British inquiry's record (THS, wireless note) | alt.history.ocean-liners.titanic, https://groups.google.com/g/alt.history.ocean-liners.titanic/c/It3Rssh-Woo | (paraphrase) | [read] secondary; medium-low |
| The socket signal | "they are termed rockets, but they are actually distress signals; they do not leave a trail of fire"; "A shell bursts at a great height in the air, throwing out a great number of stars"; "Principally white, almost white"; "the charge is no more and no less than what you would use in a 12-pounder or something like that. In the rail is a gunmetal socket. In the base of this cartridge ... is a black powder charge ... a brass detonator ... There is a wire running through this detonator, and the pulling of this wire fires that ... That, exploding, throws the shell to a height of several hundred feet, which is nothing more or less than a time shell and explodes by time in the air." | Lightoller, BI 14150-14155, https://www.titanicinquiry.org/BOTInq/BOTInq12Lightoller03.php | "a time shell and explodes by time in the air" | [read]; high |
| Firing | "You see a luminous tail behind them and then they explode in the air and burst into stars"; at intervals of "probably five minutes; I did not take any times"; "Every time I fired a signal I had to clear everybody away from the vicinity of this socket" | Boxhall, BI 15397-15399, 15434, https://www.titanicinquiry.org/BOTInq/BOTInq13Boxhall01.php | (as quoted) | [read]; high |
| Maker; figures | the maker, the burst height in feet, the number of stars, their duration, the weight of the report | - | - | NOT FOUND |
| Rockets at sea | "there is no ship allowed on the high seas to fire a rocket or anything resembling a rocket unless she requires assistance" | Lightoller BI 14169 | (as quoted) | [read]; high |
| Carpathia's | "Ordered company's rockets to be fired at 2:45 a. m. and every quarter of an hour after to reassure Titanic"; "I had been firing rockets and the Company's signals every time we saw this green light again" | Rostron, US Day 1, https://www.titanicinquiry.org/USInq/AmInq01Rostron01.php; BI 25401, https://www.titanicinquiry.org/BOTInq/BOTInq28Rostron01.php | (as quoted) | [read]; high |
| The green light | "At 20 minutes to 3 I saw the green flare, which is the White Star Company's night signal, and naturally, knowing I must be at least 20 miles away, I thought it was the ship herself" | Rostron BI 25394 | "the White Star Company's night signal" | [read]; high |
| Company night signals | White Star: green pyrotechnic lights and a rocket throwing two green stars; Cunard: "A blue light and two rockets bursting into golden stars", or a blue light and two Roman candles each throwing six blue balls to a height not over 150 ft (the newsgroup post, after L. Reade); Titanic's identification "two green Roman candles" (another post) | the newsgroup thread above | (paraphrase) | [read] secondary; low |
| What a watch made of them | (the wireless note §4-5: Californian's eight, "company's signals?") | wireless note | - | [read] |

## 7. Night: day and night ratios, fading, the night range

| Figure | Value | Source | Tag; confidence |
|---|---|---|---|
| Law | night absorption between zero and the day value; on average much less in winter; useless to judge apparatus by night distances | Austin 1911 | [read]; high |
| Near the sender | Duddell and Taylor (1905), 40 to 60 miles over the sea: day and night differed by less than 1 % | Eccles p. 147 | [read]; high |
| Ratios measured | at about 248 miles on 1,650 m, average night intensity more than twice the day's in spring and autumn, not much greater in summer; K. E. F. Schmidt, Norddeich at 400 km: day to night ratio 0.56 to 2.37 (shunted telephone); Clifden at Brant Rock: about 35 µA by day (to 55), at night often over 100; in summer day signals 7 to 12 µA and night "much louder" | Eccles pp. 153-154 | [read]; medium |
| Range ratios stated | Titanic: night "anything from two to three times" the day range (Turnbull); "at night the range of her instruments would be doubled or trebled" (The Times, 16 April 1912, quoted in the Marconigraph); Mount Temple 150 by day, over 200 at night (Durrant: "They say it is the sun's rays cause refraction."); Titanic often to about 2,000 at night (Marconigraph) | as cited | [read]; medium |
| Freaks | signals far beyond the normal now and then, often from one direction while another is weaker than normal (Eccles); the Baltic's "freaky" Olympic | Eccles p. 148; Baltic PV | [read]; medium |
| Atmospherics | heavy most of the time in Austin's tests, "especially at night and at the longer wave length"; strays more frequent at night in temperate latitudes; in mid-ocean "as a rule few and feeble" (Ricci); diurnal swing 0.3 to 3 in temperate latitudes; the Olympic "interfered by atmospherics" at 10.50 pm | Austin 1911; Eccles pp. 178-179; Olympic PV | [read]; medium |
| Sunset | the change from day to night conditions "generally more abrupt at sea than on land"; it lags sunset | Eccles p. 179 | [read]; medium |

## 8. Conflicts

1. **Titanic's alternator and note:** 300 V, 60 cycles (Marconigraph, May 1912; TRMA quoting it) against a 420-cycle alternator with a 16-stud synchronous disc and an 840 note (a hobbyist PDF, search digest) and "a CW note of 840 Hz" (J. Proc). A synchronous disc on 60 cycles gives 120 sparks a second; 840 needs a non-synchronous studded disc on the 60-cycle set or the 420-cycle machine. 560 was not found anywhere. Use 840 as the default note, keep 120 as a what-if, and let the note scale with motor speed in both.
2. **The stand-by supply:** "an independent oil-engine set installed on the top deck" (Marconigraph) against the two 30 kW engine-dynamo sets in the turbine casing and a separate battery and coil (TRMA; the plant note §5). The plant note's reading stands for the model; the oil engine is reported, not modelled.
3. **Change-over:** none on her set (Marconigraph); Marconi's 1.5 kW sets allowed break-in (Marchant 1914); the brainstorm has a send/listen change-over. The only switch is the tuner's tuned / stand-by change.
4. **Olympic's call:** MKC (Mount Temple's key, 1912; the composite) against MKG (TIP ship page). Use MKC.
5. **Californian's and Virginian's calls in Evans's US transcript:** "M.W.H." and "M.G.M." as printed, against MWL and MGN in the Mount Temple's key and Bride's evidence. Printing slips.
6. **Who asked "Are there any boats around you already?":** "D. K. F." in the Mount Temple's log (DKF is the Prinz Friedrich Wilhelm in the composite), the Frankfurt in Durrant's reading (BI 9535).
7. **The Frankfurt's "What is the matter":** 10.48 NY in the Mount Temple's log; "considerably over 20 minutes" after the first exchange (Bride); about 20 minutes (Cottam); 1-48/1-50 ship's time (11.58-12.00 NY) in the composite. The log is the better record.
8. **The 9:05 reply:** "Keep out" (BI) against "Shut up, shut up, I am busy; I am working Cape Race" (US); "D-D-D" (J. Proc) is in neither transcript read.
9. **The Californian's afternoon message:** Titanic said "It's all right, old man ... I heard you send to the Antillian. ... Bi." (Evans) against Bride's account of receiving it, giving "R. D." and getting "the usual finishing signal" (Bride, US Day 2). Both may be true.
10. **Carpathia's set:** "A one and a half watt set" as printed (US Day 1) against "one-half to three-quarters of a kilowatt" on 95 V mains (US Day 10): the first is the set's rating misprinted [bet], the second what it gave.
11. **The Caronia message:** "April 12" at the end in the original form, absent from Barr's version (BI 16109); its reply "Time received 1.26 p.m." with no zone.
12. **Amerika:** 11.45 am NY on the form, 11.47 am in her PV; "M.G.V." printed in the transcript and corrected to MGY (BI 16261-16267); Cape Race's cable reads "5 deg. 8 min. W." for 50°8'W (BI 16146).
13. **Baltic:** 11.52 am on the form, 11.55 in the PV; her clock fast (Balfour); "243 miles east" (log, message) against "243 miles southeast" (Balfour's evidence, US Report).
14. **Mount Temple's clock:** NY + 1 h 46 min (Durrant, BI 9436) against "1 hour 55 minutes" in the Solicitor-General's recollection (BI 17084). Durrant's figure.
15. **The first position:** 41.46 N 50.14 W already in the Mount Temple's 10.25 entry, 41.44 N 50.24 W in Cape Race's 10:25 (wireless note, Conflicts 2). Eaton: the first position was sent ten times before being corrected [read: TIP Frankfurt page].
16. **Olympic's position:** 40.52 N 61.18 W at 4.24 am GMT (her own message, 11.35 pm NY), 40.32 N 61.18 W (Cape Race's press report), 40°22'N 61°18'W at 12.14 NY (US Report).
17. **Titanic's range:** guaranteed 250 (Marconigraph) or 350 (Turnbull, Marconi); 400 by day (Marconigraph, Bride) or 500 (Turnbull); at night often 2,000 (Marconigraph), two to three times the day (Turnbull, The Times).
18. **The magnetic detector:** "sensitive and extremely reliable" (Marchant 1912) against "liable to prove insensitive with musical spark signals" (Eccles 1918).
19. **Cape Race's strength:** the brainstorm's "a set like her own" against the record (Olympic: "just audible" at 350 by day; "dead week"; unable to hear it at 7.45 am while Cape Race heard the Olympic "good"; Evans: could not hear it that night).
20. **The composite's times** disagree with the Mount Temple's log in places (2.3); the logs are preferred.
21. **Word space:** five dots in 1912 (Marchant; the telegraph regulations to 1938) against seven (modern; the brainstorm's 5.4).

## 9. NOT FOUND

- Austin's 1913 transmission paper in the Proceedings of the IRE (the one volume-1 paper found is on condensers); the 1914 Bulletin paper (Arlington-Salem) is a PDF, not opened.
- A measured aerial current, or aerial resistance, for any Marconi 1.5 or 5 kW ship set; Titanic's.
- A least audible current for the Fleming valve or the tikker; a measured figure for the magnetic detector other than Eccles's 0.0025 erg.
- The stud count, rotation speed and spark rate of Titanic's disc; any source for 560.
- The aerial heights of every other ship of the night.
- The sets (power, discharger, note) of the Frankfurt, Birma, Virginian, Baltic, Caronia, Asian and Cape Race.
- The operators of the Virginian, Birma, Frankfurt, Caronia and Asian; any operator's sending speed that night.
- The positions at the time of La Provence, Ypiranga, Celtic, Mesaba, Amerika, Prinz Friedrich Wilhelm and Cincinnati.
- The socket signal's maker, burst height in figures, number and duration of stars, report; the Board of Trade's rule on the number carried; a primary for the 36 / 12 / 2 / 12 / 6 list; Cunard's night signal in a primary.
- The Noordam's ice message (not looked for beyond the British Report's five); Titanic's own PV (lost); the Carpathia's reconstituted PV in text.
- The magnetic detector's clockwork run time; Titanic's emergency set's range at night.

## 10. For the model

### 10.1 The range law

| Item | Value | Units | How got | Tag |
|---|---|---|---|---|
| Received current | I_r = 4.25 × I_s × h1 × h2 / (λ × d) × exp(−α × d / √λ) | A through 25 ohms; I_s in A; h1, h2, λ, d in km | Austin 1911; Eccles 1918 | [read] |
| C | 4.25 (± 30 % ship to ship, Austin) | - | Austin 1911 | [read] |
| α (day) | 0.0015 | per √km (d and λ in km) | Austin 1911 | [read] |
| λ | 0.6 | km (600 m) | Marconigraph; Evans; Cottam | [read] |
| Check row | h1 = 200 ft, h2 = 130 ft, λ = 600 m, d = 500 nm, I_s = 12 A → 37.0 µA (Austin); the code must give 36.9 to 37.0 | µA | Austin 1911, the footnote example to his Table XVI; `ether_rerun.js` | [read], [derived] |
| Night | α_night = φ × α, φ in [0, 1], drawn per path and varying slowly; typical φ 0.25 to 0.5 (fits Turnbull's 2-3× and Durrant's 150 → 200+); φ = 0 sometimes (Marconigraph's 2,000; Austin's 2,550-2,776 miles); rare freaks above φ = 0 by up to about 2 to 3 (Austin "a very few cases"; Schmidt 2.37; Clifden about 3) | - | Austin 1911; Eccles; `ether_rerun.js` §9 | [read] law, [derived] fit, [bet] distribution |
| Short range | the night bound over the day law is exp(α d / √λ): 1.07 at 18 nm, 1.18 at 46.5, 1.24 at 60.6, 1.43 at 100, 1.74 at 154, 2.39 at 243, 6.12 at 505 | - | `ether_rerun.js` | [derived] |
| Threshold, audible (magnetic) | 12.9 µA at 20 wpm (11.2 at 15, 14.4 at 25): I = √(0.0025 erg / (1.2/wpm s) / 25 Ω) | µA | Eccles's 0.0025 erg per dot | [derived] |
| Threshold, audible (electrolytic, perikon, 1910) | 10 | µA | Austin 1911 | [read] |
| Threshold, audible (crystal, 1913) | 5 (Eccles) to 7 (Austin 1913) | µA | as cited | [read] |
| Good copy | 40 (16 × audibility in power); a message is copied whole above it, with gaps between audibility and it [bet on the gaps] | µA | Austin 1911 | [read], [bet] |
| Musical-spark penalty, magnetic detector | raise the magnetic threshold for high spark rates by 1 to 2 [bet] | × | Eccles (qualitative) | [bet] |
| Steam noise at Titanic | multiply her threshold by a factor N_steam while the plant blows off: N in 25 to 45 fits the record (she could not read the Mount Temple at 18-22 × threshold or the Olympic at 3-17 ×, and read the Carpathia at 48-56 ×) | × | `ether_rerun.js` §5 on the fitted currents | [derived]; low (rests on the fitted Mount Temple current) |
| Interference | a signal is copied only if it exceeds the strongest other signal at that moment by a ratio R; R = 3 [bet, range 2 to 10]; on the tuner's stand-by position, all waves count; on the tuned position, stations on another wave (Cape Cod's 1,600 m) do not | - | Cottam (waves); Evans ("my signals were the loudest"); Baltic ("tuned to Olympic and cuts me out") | [bet] |
| Loudness | in multiples m of the audible threshold: m about 30 to 40 is Bride's "both telephones on" at 100 miles [derived: the Birma row, 10.2]; well above that, one telephone; Evans's "take the telephones away from your ears" alongside (hundreds) | × | Bride; Evans; `ether_rerun.js` | [derived], [bet] |

Aerial currents (I_s), each with how it was got:

| Station | I_s (A) | Range to allow | How got | Tag |
|---|---|---|---|---|
| Titanic, full supply | 11.1 | 5.3 to 15.8 | fitted to Bride's 400 nm by day at 40 µA to a 100 ft receiver; 15.8 on Austin's anchor (10 A ≈ "a moderately efficient 2-kilowatt set", I ∝ √P); 5.3 to 5.8 from the TRMA's 500 W into 15 to 18 ohms (Austin 1913); 8.1 if fitted to Turnbull's guaranteed 350 instead | [derived] |
| Olympic | as Titanic | - | "only equalled by that of the 'Olympic'" (Marconigraph) | [read], [derived] |
| A standard Marconi 1.5 kW ship set | 8.7 | 5 to 9 | Austin's anchor | [derived] |
| Carpathia | 5.6 | 5.0 to 6.1 | 0.5 to 0.75 kW (Cottam) on the anchor; 6.9 if fitted to her 250 nm by day | [read], [derived] |
| Californian | 6.5 | 6.3 to 6.9 | "a little over half" of 1.5 kW (Evans) on the anchor; 6.9 fitted to her 250 nm | [read], [derived] |
| Mount Temple | 2.9 | 2.9 to 8.7 | fitted to Durrant's 150 nm by day; 8.7 if a standard set | [derived] |
| Cape Race | 1.5 | 1.5 to 4 | fitted to "just audible" (12.9 µA) at the Olympic, 350 nm by day, 170 ft both [bet on the heights] | [derived] |
| Frankfurt, Birma, Virginian, Baltic, Caronia, Asian | 8.7 | 5 to 16 | a standard set [bet]; the Frankfurt needs more, or a freak, to be louder than the Carpathia (10.2) | [bet] |
| Coupling to the plant | I_s ∝ the alternator's voltage ∝ the motor's speed ∝ the bus voltage, so received currents fall in proportion; the note (spark rate) ∝ the motor's speed | - | the disc "driven off the shaft" (Marconigraph); proportionality [bet] | [read], [bet] |
| Emergency coil set | 0.5 | 0.3 to 2 | J. Proc's "about 40 miles" by day is 0.31 A on the law at 40 µA from her 170 ft aerial to a 100 ft ship (0.52 A from 100 ft); 0.5 A then reaches 61 nm by day and 76 nm at night at 40 µA, 141 and 234 nm at the magnetic threshold; Duddell's 1905 telegraph ship had 2 to 3 A [derived]. The reader's 150 nm at night (world.js) needs about 1 A at 40 µA | [derived], [bet] |

### 10.2 The brainstorm's section 3.2, rerun on what was read

Inputs: λ 600 m; C 4.25; α 0.0015; Titanic I_s 11.1 A (fit), aerial 170 ft; small ship 8.7 A (1.5 kW, anchor), 100 ft [bet]; thresholds 40 µA (good), 10 µA (audible, 1910), 12.9 µA (magnetic, derived). Output of `ether_rerun.js` (run 2026-11-18), ranges in nm:

```
link                          | day good 40 | day audible 10 | day magnetic 12.9 | night good 40 | night audible 10 | night magnetic
Titanic heard by a small set  | 400 | 651 | 602 | 1679 | 6716 | 5203
a small set heard by Titanic  | 360 | 603 | 555 | 1308 | 5231 | 4052
a small set heard by another  | 281 | 504 | 459 |  769 | 3077 | 2384
Titanic and Olympic, each way | 491 | 757 | 705 | 2854 | 11418 | 8844
night with phi x day absorption, good 40:  phi 0.5: 587 / 517 / 385 / 747   phi 0.25: 811 / 699 / 494 / 1082   phi 0.1: 1123 / 935 / 617 / 1605
sensitivity, small to small by day (good): 5 A 210, 6 A 232, 8.7 A 282; 80 ft 223, 130 ft 360. Titanic to a small set by day: 5.5 A 292, 10 A 383, 15.8 A 459
the brainstorm's own inputs (10 A, 5.5 A, 40 uA): 383 | 1510 ; 292 | 831 ; 221 | 489 ; 472 | 2567   (its table: 380 | 1486 ; 289 | 814 ; 217 | 471 ; 472 | 2566)
```

**Against the record:** by day at 40 µA the law gives Bride's 400 (fitted), the small sets' 250 (281; 232 at Carpathia's 6 A), and 491 nm between the sisters (they worked at 505 at night). Audibility (10 to 13 µA) runs 1.5 to 1.8 times further: the operators' "range" is Austin's good communication, not audibility [derived]. At night with zero absorption the law gives 1,679 nm for Titanic to a small ship (the record: 1,500 to 2,000, "often ... about 2,000"); it overstates the small sets (769 against Durrant's "something over 200") and Turnbull's 2-3 × (700 to 1,050). With φ = 0.25 to 0.5 every figure falls inside the record. **Misfit to state:** the Asian at about 300 nm found Titanic "too faint to read" from 8 to 10 pm, where the law gives her 6 × (day) to 17 × (night bound) her threshold; the Baltic at 243 heard her "very faint" (law: 9 × by day, 21 × at the night bound) while the Olympic at about 745 nm was "strong" (law: 0.5 to 0.8 × by day, 7 to 12 × at the night bound, for a Baltic aerial of 100 to 170 ft); Carpathia found the Mount Temple's signals "very weak" at about 79 nm (law: 8 to 10 × on the fitted 2.9 A, 23 to 30 × on a standard 8.7 A). The record's night is much less orderly than any φ in [0, 1] for all paths at once: per-path φ and the freak multiplier are needed, and the receivers' state (tuned, stand-by, wave) matters.

Each ship of the night, at her distance, as a multiple of the magnetic threshold 12.9 µA; "day" is the law, "night" the zero-absorption bound (Titanic 11.1 A, 170 ft; each ship's own current from 10.1, 100 ft unless stated):

| Station | nm | her I_s | she hears Titanic, day | night | Titanic hears her, day | night |
|---|---|---|---|---|---|---|
| Californian (Court) | 9 | 6.5 | 560 | 578 | 328 | 339 |
| Californian (MAIB) | 18 | 6.5 | 271 | 289 | 159 | 170 |
| Carpathia | 46.5 | 5.6 | 95 | 112 | 48 | 56 |
| Mount Temple (fitted) | 60.6 | 2.9 | 69 | 86 | 18 | 22 |
| Birma | 100 | 8.7 | 36 | 52 | 28 | 41 |
| Frankfurt | 154 | 8.7 | 19 | 34 | 15 | 26 |
| Virginian | 170 | 8.7 | 17 | 31 | 13 | 24 |
| Baltic | 243 | 8.7 | 9 | 21 | 7 | 17 |
| Asian | 300 | 8.7 | 6 | 17 | 5 | 14 |
| Cape Race (fitted 1.5 A, 170 ft) | 380 | 1.5 | 6 | 23 | 0.8 | 3.2 |
| Olympic (170 ft) | 505 | 11.1 | 2.9 | 17.5 | 2.9 | 17.5 |
| Caronia | 800 | 8.7 | 0.4 | 6.5 | 0.3 | 5.1 |

Checks against the record [derived]:
- **9:05 pm, the Californian against Cape Race at Titanic's receiver:** with the Californian 20 to 25 nm off and a Cape Race like her own at 370 to 400 nm, the ratio is 5 to 7 (night bound) or 19 to 29 (day absorption on the long path); with the fitted Cape Race (1.5 A) it is **38 to 47**. Evans's "a whisper" against "a bang" is the second case. Cape Race fitted is also inaudible to the Californian by day (6.3 µA) and marginal at night (24.5 µA, about 2 × threshold): "I could not hear Cape Race that night". And Titanic could work the fitted Cape Race only at night (0.8 × by day, 3.2 × at the night bound), which fits the British Report's reading that the Amerika's message waited until she "would be within call of Cape Race (at about 8 or 8.30 p.m.)".
- **The Frankfurt louder than the Carpathia** at Titanic needs the Frankfurt's current to exceed the Carpathia's by 3.3 times (night bound) or 4.9 times (day law): with the Carpathia at 5.6 A, 18.5 A (a 7 kW set on the anchor) or 27 A. A standard 8.7 A Frankfurt needs a freak of about 2.1 (over the zero-absorption value) or 3.2 (over the day law) on her path at T 70. The brainstorm's plan, to fit the 1912 night's fading to this one fact, stands; the fit asks for a freak factor of 2 to 3, inside what Austin, Schmidt and the Clifden figures allow.
- **The Mount Temple steady:** at 60.6 nm the night can add at most 24 % to the day value (no freak), so a steady signal falls out [derived].
- **The Virginian's last copy:** at full current she had 17 (day) to 31 (night) times her threshold; it falls to the threshold only at 3 to 6 % of the aerial current. A failing supply alone makes her copy fade only near the very end; her "blurred or ragged" spark (the note's quality) is the cue to model alongside the amplitude [derived, bet].

### 10.3 The stations

| Station | Call | Set (model) | I_s (A) | Aerial (ft) | Note (sparks/s) | Operators, hours (NY unless said) | Speed (wpm) | From the wreck (bearing, nm) |
|---|---|---|---|---|---|---|---|---|
| Titanic | MGY | 5 kW Marconi, disc on the motor-generator shaft, magnetic detector, multiple tuner (tuned / stand-by), valve receiver, emergency coil set | 11.1 (5.3-15.8) | 170 | 840 [read secondary] (120 as a what-if), ∝ motor speed | Phillips 8 pm to 2 am ship's time, Bride 2 to 8 am; both at the key after T 15 (wireless note) | 20-25 [bet] | - |
| Carpathia | MPA | 1.5 kW Marconi, "older type", 0.5-0.75 kW on 95 V mains, plain (untuned) aerial much of the time | 5.6 | 100 [bet] | 100 [bet: 50-cycle plain gap] | Cottam alone; on watch until he turns in; at 10.35 NY "about to retire", in bed by about 10.45-10.50 NY [bet] | 15-20 [bet] | 136°, 46.5 |
| Californian | MWL | Marconi 1.5 kW set on 60 V dynamos (half power) | 6.5 | 100 [bet] | 100 [bet] | Evans alone; phones down 11.35 her time (T 2-7) | 15-20 [bet] | 341°, 18 (9; 22.8) |
| Mount Temple | MLQ | Marconi, power unknown | 2.9 (to 8.7) | 100 [bet] | 100 [bet] | Durrant alone, never off before 1 am her time | 15-20 [bet] | 245° from the CQD position, 49.5 (60.6 from the wreck) |
| Frankfurt | DFT | DEBEG (Telefunken quenched spark [bet]) | 8.7 [bet] | 100 [bet] | 1,000 [bet] | NOT FOUND; "got up apparently" for 20 minutes after the first exchange (Cottam BI 17129) | 15-20 [bet] | 216°, 154 |
| Birma | SBA | unknown | 8.7 [bet] | 100 [bet] | 100-1,000 [bet] | NOT FOUND | [bet] | 202.5°, 100 (70-107) |
| Virginian | MGN | Marconi [bet] | 8.7 [bet] | 100 [bet] | 100 [bet] | listening all night (her PV runs through) | [bet] | 0°, 170 |
| Baltic | MBC | Marconi, Balfour in charge | 8.7 [bet] | 100 [bet] | 100 [bet] | Balfour on watch from at least 10.45 pm | [bet] | 90° (or SE), 243 |
| Olympic | MKC | as Titanic | 11.1 | 170 | as Titanic's [bet]; a plain gap per J. Proc | E. J. Moore on watch; standing by for Cape Cod at 10.15 | [bet] | 258.75°, 505 |
| Caronia | MRA | unknown | 8.7 [bet] | 100 [bet] | [bet] | listening | [bet] | 90°, 800 |
| Asian | MKL | unknown | 8.7 [bet] | 100 [bet] | [bet] | listening; heard her faintly 8 to 10 pm local | [bet] | 270°, 300 |
| Cape Race | MCE | Marconi coast station | 1.5 (fit) | 170 [bet] | [bet] | Goodwin, Gray, Hunston: one on watch at a time, all night | [bet] | about 340°, 380 |
| Cape Cod | MCC | long-wave press station, 1,600 m [read: Cottam's guess] | - | - | - | press rounds sent twice; first round over at 10.30 NY | - | far W |
| Parisian | MZN | unknown | 8.7 [bet] | 100 [bet] | [bet] | operator off at 11.15 her time | [bet] | about 290-300°, 50-70 [bet: 50 miles ahead of the Californian] |

### 10.4 The night's traffic, word for word

NY as logged; T on 2 h 02 min (T = NY − 9:38 pm); text as printed in the source (the logs' own words, which often describe a message rather than quote it). MT = Mount Temple PV (Durrant); OL = Olympic PV (E. J. Moore); BA = Baltic PV (Balfour), BA-c its "Copies of messages"; CR = Cape Race log (Hunston), read in the Nova Scotia archives' copy; VI = Virginian PV; CO = Cottam (US Day 1, BI Day 15); BR = Bride (US Day 2); EV = Evans (US Day 8; BI as read at BI 16255). URLs in section 2.

| NY | T | From → to | Text as logged | Logged by | Source |
|---|---|---|---|---|---|
| 9.05 pm | −33 | Californian → Titanic | (after "M.G.Y." three times and his own call once) "Say, old man, we are stopped and surrounded by ice." | Evans | EV US |
| 9.05 pm | −33 | Titanic → Californian | "Shut up, shut up, I am busy; I am working Cape Race" | Evans | EV US |
| 9.05 pm | −33 | Californian → Titanic; reply | "We are stopped, and surrounded by ice." — "Keep out." | Evans | EV BI 8990s, read at BI 16255 |
| 9.05 pm | −33 | Titanic → Cape Race | "Sorry, please repeat, jammed." | Evans (overheard, "a few seconds after") | EV BI, read at BI 16255 |
| 9.05 to 9.45 pm | −33 to 7 | Titanic ↔ Cape Race | passengers' messages; "all private messages. You can tell by the prefix." Heard until Evans "put the phones down" at 11.35 his time | Evans | EV US, BI |
| 9.55 pm | 17 | Mount Temple ↔ Carpathia | "Sigs. With M.P.A. Nil." | Durrant | MT |
| 10.00 pm | 22 | Mount Temple → Carpathia | "Good night to the 'Mount Temple'; his signals very weak." | Cottam (his PV) | CO BI 17082 |
| 10.15 pm | 37 | Olympic | "Standing by for Cape Cod." | Moore | OL |
| 10.25 pm | 47 | Titanic → all; Mount Temple | "Titanic sending C.Q.D. Answer him, but he replies: "Can not read you, old man, but here my position, 41.46 N., 50.14 W. Come at once. Have struck berg." Informed captain." | Durrant | MT |
| 10.25 pm | 47 | Titanic → all | "J.C.R. Goodwin on watch hears Titanic calling C.Q.D. giving position 41.44 N 50.24 W about 380 miles SSE of Cape Race." | Hunston | CR |
| 10.25 pm | 47 | Titanic → all | the call: "C.Q.D. about half a dozen times; M.G.Y. half a dozen times." "sent slowly and carefully by Mr. Phillips" | Bride | BR |
| about 10.27 | about 49 | Frankfurt ↔ Titanic | "Within two or three minutes a reply was received from the Frankfurt." Phillips "gave the Frankfurt our position. He said, "Come at once." The Frankfurt said, "Stand by."" | US Report; Bride | US Report; BR |
| 10.35 pm | 57 | Carpathia → Titanic | Cottam "asked him if he was aware that Cape Cod was sending a batch of messages for him" | Cottam | CO US |
| 10.35 pm | 57 | Titanic → Carpathia | "Come at once. It is a distress message; C. Q. D." (US Day 1); "Come at once. We have struck a berg. It is a C.Q.D." (US Day 6); "Struck a berg; come at once." (BI 17102); "Come at once; we have struck a berg," and sent his position, "and then he sent C.Q.D." (BI 17103) | Cottam | CO |
| 10.35 pm | 57 | Carpathia → Titanic → Carpathia | Cottam confirmed "by asking him if I was to report it to the captain" — "Yes." | Cottam | CO US |
| 10.35 pm | 57 | Titanic ↔ Carpathia (overheard) | "Carpathia answers M.G.Y. M.G.Y. says: "Struck iceberg; come to our assistance at once." Sends position." | Durrant | MT |
| 10.35 pm | 57 | Titanic → all | "Titanic gives corrected position as 41.46N 50.14W. A matter of 5 or six miles difference. He says "have struck iceberg"." | Hunston | CR |
| about 10.37 | about 59 | Carpathia → Titanic → Carpathia | Carpathia's position from the captain's slip — "Received." Four minutes later Cottam "Confirmed both positions" — "All right." | Cottam | CO US |
| 10.36 (British Report's 12.26) | 58 | Titanic → all | "Sinking; cannot hear for noise of steam." | British Report | "Means taken to procure assistance" |
| 10.40 pm | 62 | Mount Temple | "M.G.Y. still calling C.Q.D. Our captain reverses ship and steams for M.G.Y. We are about 50 miles off." | Durrant | MT |
| 10.40 pm | 62 | Titanic → Carpathia | "Titanic calls Carpathia and says "We require immediate assistance". Gray on duty." | Hunston | CR |
| 10.43 pm | 65 | Titanic → Californian | "Titanic gives same information to Californian, giving Titanic's position." (her operator had turned in) | Hunston | CR |
| 10.45 pm | 67 | Cape Cod → Olympic | "Received four messages from Cape Cod." | Moore | OL |
| 10.45 pm | 67 | Baltic → Titanic | "Calling Titanic; no response." | Balfour | BA |
| 10.45 pm | 67 | Caronia → Baltic and all | "Caronia circulates same information broadcast to Baltic and all ships who can hear him RH on duty." | Hunston | CR |
| 10.48 pm | 70 | Titanic ↔ Frankfurt | "Frankfurt answers M.G.Y. M.G.Y. gives him his position and asks "Are you coming to our assistance?" D.F.T. asks: "What is the matter with you?" M.G.Y. replies: "We have struck iceberg and sinking; please tell captain to come." "O.K.; will tell the bridge right away." "O.K.; yes; quick."" | Durrant | MT |
| (Bride: over 20 min after the first) | about 70 | Frankfurt → Titanic → Frankfurt | "What was the matter with you?" — "We told him he was a fool, sir." — "We told him to keep out and not interfere with our communication." (the senator's summary, "You are a fool. Keep out and do not interfere with our communication.", agreed); "He told him to stand by, sir - finish." | Bride | BR |
| 10.50 pm | 72 | Olympic | "Hear Titanic signaling to some ship about striking an iceberg. Am not sure it is the Titanic who has struck an iceberg. Am interfered by atmospherics and many stations working." | Moore | OL |
| 10.55 pm | 77 | Titanic → all | "M.G.Y. calling S.O.S." | Durrant | MT |
| 10.55 pm | 77 | Titanic → Frankfurt | "Titanic tells German steamer "Have struck iceberg and sinking"." | Hunston | CR |
| 10.57 pm | 79 | Titanic → Olympic | "M.G.Y. calling M.K.C." | Durrant | MT |
| about 10.57 | about 79 | Carpathia ↔ Titanic | the Olympic "calling him and offering a service message"; Cottam "asked the Titanic if he was aware that the Olympic was calling him" — "He said he was not." — "He told me he could not read him because the rush of air and the escape of steam"; Cottam: "Go ahead and call" (BI 17138); then "I told the Titanic to call the Baltic." — "The communication was apparently unsatisfactory." | Cottam | CO |
| 10.59 pm | 81 | Titanic ↔ Carpathia | "M.G.Y. working M.P.A" | Durrant | MT |
| 11.00 pm | 82 | Titanic → Virginian, all | "M.G.Y. calling M.G.N. and C.Q.D." | Durrant | MT |
| 11.00 pm | 82 | Titanic ↔ Olympic | "Hear Titanic sending out signals of distress, and I answered his calls immediately." | Moore | OL |
| 11.00 pm | 82 | Titanic → all | "Titanic continues calling for assistance and giving position." | Hunston | CR |
| about 11.00 | about 82 | Titanic → all; Baltic | the call "giving his position, just saying "Struck an iceberg," giving his present position, and saying that he required immediate assistance" | Balfour | Balfour, US Day 14 |
| 11.05 pm | 87 | Frankfurt | "(he was jambing me at 11.05 p.m.)" | Balfour | BA (3.05 am entry) |
| 11.10 pm | 92 | Titanic → all | "M.G.Y. calling C.Q.D." | Durrant | MT |
| 11.10 pm | 92 | Titanic → Olympic | "Titanic replies and gives me his position, 41.46 N., 50.14 W., and says, "We have struck an iceberg." Reported this information to bridge immediately. Our distance from the Titanic505 miles." | Moore | OL |
| 11.10 pm | 92 | Baltic | "Jamming bad, but hear Titanic very faint, calling Olympic - latter strong; freaky. Hear Caronia calling. He tells me Titanic requires immediate assistance, gives position. 41.46 N, 50.14 W. - I advise bridge and call Titanic but unable to gain his attention. He appears to be tuned to Olympic and cuts me out." | Balfour | BA |
| 11.10 pm | 92 | Baltic → bridge | "Urgent message sent to bridge, "Titanic struck berg - position 41.46 N. 50.14. Wants immediate assistance."" | Balfour | BA-c |
| 11.10 pm | 92 | Titanic → CQ | "At 11.10 we heard a C. Q. message coming from the Titanic - that is, a message sent to all stations - saying "Capt. Smith says 'Get all your boats ready. Sinking.'"" | Balfour | Balfour, US Day 14 |
| 11.20 pm | 102 | Titanic → Olympic | "M.G.Y. gets M.K.C. and says "Captain says get your boats ready. Going down fast at the head."" | Durrant | MT |
| 11.20 pm | 102 | Titanic → Olympic | "Signals with the Titanic. He says, "Tell captain get your boats ready and what is your position?"" | Moore | OL |
| 11.20 pm | 102 | Baltic → bridge | "Sent to bridge. "Capt. Smith saying 'Get all your boats ready, sinking.'" (Received direct from Titanic)" | Balfour | BA-c |
| 11.25 pm | 107 | Frankfurt → Titanic | "D.F.T. says "Our captain will go for you."" | Durrant | MT |
| 11.25 pm | 107 | Cape Race → Virginian | "Establish communication with Virginian here and give him all information re: Titanic, telling him to inform captain immediately. OK." | Hunston | CR |
| 11.27 pm | 109 | Titanic → all, Baltic | "M.G.Y. calling C.Q.D. and M.B.C." | Durrant | MT |
| 11.30 pm | 112 | Titanic → all | "M.G.Y. calling C.Q.D." | Durrant | MT |
| 11.35 pm | 117 | Olympic → Titanic → Olympic | "M.K.C. sends M.S.G. to M.G.Y. M.G.Y. replies "We are putting the women off in the boats."" | Durrant | MT |
| 11.35 pm | 117 | Olympic → Titanic | "Sent message to Titanic: "Commander, Titanic, 4.24 a. m. G.M.T. 40.52 N., 61.18 W. Are you steering southerly to meet us? Haddock."" | Moore | OL |
| 11.35 pm | 117 | Titanic → Olympic; Baltic → Titanic | "Titanic tells Olympic, "We are getting the women off in small boats." Tells Titanic, "Baltic coming to assistance." Caronia, I don't appear to reach him" | Balfour | BA |
| 11.35 pm | 117 | Titanic → CQ | "Titanic sends C.Q.: "We are getting the women off in small boats."" | Balfour | BA-c |
| 11.36 pm | 118 | Olympic → Titanic → Olympic | "Olympic asks Titanic which way latter steering. Titanic replies "We are putting women off in boats"." | Hunston | CR |
| 11.40 pm | 122 | Titanic → Olympic | "Titanic says, "Tell captain we are putting the passengers off in small boats."" | Moore | OL |
| 11.41 pm | 123 | Titanic → all | "M.G.Y. says C.Q.D. engine room flooded." | Durrant | MT |
| 11.43 pm | 125 | Titanic → Olympic | "M.G.Y. tells M.K.C. sea calm." | Durrant | MT |
| 11.45 pm | 127 | DKF (Frankfurt, Durrant) → Titanic | "D. K. F. asks: "Are there any boats around you already?" No reply." | Durrant | MT |
| 11.45 pm | 127 | Olympic → Titanic → Olympic | "Asked Titanic what weather he had had. He says, "clear and calm."" | Moore | OL |
| 11.45 pm | 127 | Titanic → all | "Titanic says, "Engine room getting flooded."" | Balfour | BA |
| 11.45 pm | 127 | Titanic → CQ | "Titanic sends C.Q.: "Engine room getting flooded."" | Balfour | BA-c |
| 11.47 pm | 129 | Olympic → Titanic | "M.K.C. sends M.S.G. to M.G.Y. M.G.Y. acknowledges it and sends Rd." | Durrant | MT |
| 11.50 pm | 132 | Olympic → Titanic | "Message to Titanic: "Commander, Titanic. Am lighting up all possible boilers as fast as can, Haddock."" | Moore | OL |
| 11.50 pm | 132 | Baltic → Titanic | "From Baltic to Titanic: "Capt. Smith, Titanic - Baltic coming; we are 243 miles east."" | Balfour | BA-c |
| 11.55 pm | 137 | Titanic → Carpathia | "Come quick; our engine room is filling up to the boilers." (US Day 1); "Come as quickly as possible, old man, the engine room is filling up to the boilers." (BI 17141); "11.55 New York time ... By the clock" (BI 17145, 17193-17194) | Cottam | CO |
| 11.55 pm | 137 | Carpathia → Titanic | (no acknowledgement) "The captain told me to tell the Titanic that all our boats were ready and we were coming as hard as we could come, with a double watch on in the engine room, and to be prepared, when we got there, with lifeboats." | Cottam | CO US |
| 11.55 pm | 137 | Frankfurt, Birma → Titanic | "D.F.T. and S.B.A. (Russian liner Birma) calling M.G.Y. No reply." | Durrant | MT |
| 11.55 pm | 137 | Olympic | "Sable Island calling me with traffic. Told him to stand by for a while, as having urgent communication with Titanic." | Moore | OL |
| 11.55 pm | 137 | Virginian; Titanic | "Virginian says he is now going to assistance Titanic. Titanic meanwhile continues circulating position calling for help. He says weather is calm and clear." | Hunston | CR |
| 11.58 pm | 140 | Titanic → all (Asian) | "I last heard him at 11.58 p. m. calling "S. O. S." Had heard him previous to that, very faint, working to Cape Race." | Asian, to the Olympic at 5.40 am | OL |
| midnight | 142 | Titanic (Asian) | "Finished calling S. O. S. midnight." | Asian's service, 8.30 am | OL |
| after midnight (no time) | about 142-152 | Baltic's bridge → operator | "Message from bridge gives our position 243 miles east of Titanic." | Balfour | BA |
| 12.10 am | 152 | Olympic, Frankfurt, Baltic → Titanic | "M.K.C., D. F. T and M.B.C. calling M.G.Y. No reply." | Durrant | MT |
| 12.10 am | 152 | Baltic | "Signals Amerika and Prinz Friedrich Wilhelm" | Balfour | BA |
| 12.25 am | 167 | Birma → Frankfurt | "S.B.A. tells D.F.T. he is 70 miles from M.G.Y." | Durrant | MT |
| 12.27 am | 169 | Titanic → CQ; Virginian | "12.27 M.G.Y. calls C.Q.; unable make out his signal; ended very abruptly, as if power suddenly switched off - his spark rather blurred or ragged. Called M.G.Y., and suggested he should try emergency set, but heard no response." | Virginian's operator | VI (read at BI after 17215) |
| 12.30 am | 172 | Olympic | "Signals with the S. S. Helig Olav. His signals strong. Asked if he knows anything of Titanic. He says, "No." Keeping strict watch, but hear nothing more from Titanic. Calling Sable Island at intervals. No reply from him." | Moore | OL |
| 12.50 am | 192 | Mount Temple | "All quiet now. M.G.Y. hasn't spoken since 11.47 p.m." | Durrant | MT |
| 12.50 am | 192 | Virginian → Cape Race | "April 15th 12:50 am Virginian says last he heard of Titanic was at 12:27 am when latters signals were blurred and ended abruptly. From now on boats working amongst themselves relative to Titanic disaster. Nothing more heard from Titanic." | Hunston | CR |
| 1.05 am | 207 | Virginian → Titanic, Olympic | "Virginian now calling Titanic and Olympic." | Balfour | BA |
| 1.25 am | 227 | Carpathia → Titanic | "M.P.A. sends: "If you are there, we are firing rockets."" | Durrant | MT |
| 1.40 am | 242 | Carpathia → Titanic | "M.P.A. calling M.G.Y." | Durrant | MT |
| 1.58 am | 260 | Birma → Titanic | "S.B.A. thinks he hears M.G.Y., so sends "Steaming full speed to you; shall arrive you 6 in the morning. Hope you are safe. We are only 50 miles now."" | Durrant | MT |
| 2.00 am | 262 | Carpathia → Titanic | "M.P.A. calls M.G.Y." | Durrant | MT |
| 2.05 am | 267 | New York → Cape Race | "2:05 am First message from New York asking for details. This is followed by about 300 more, chiefly from newspapers to many ships asking for news." | Hunston | CR |
| 2.10 am | 272 | Prinz Friedrich Wilhelm; Baltic | "Prinz Friedrich Wilhelm calls C.Q. I tell him standby on phones and not call." | Balfour | BA |
| 3.00 am | 322 | Mount Temple | "All quiet; we're stopped amongst pack ice." | Durrant | MT |
| 3.05 am | 327 | Birma, Frankfurt | "S.B.A. and D.F.T. working." | Durrant | MT |
| 3.05 am | 327 | Eastport → Frankfurt | "Eastport. Me. (station on Bay of Fundy) asks Frankfurt re C.Q.D. calls (he was jambing me at 11.05 p.m.)." | Balfour | BA |
| 3.20 am | 342 | Birma, Frankfurt | "S.B.A. and D.F.T. working. We back out of ice and cruise around. Large bergs about." | Durrant | MT |
| 3.25 am | 347 | Californian → CQ; Mount Temple | "M.W.L. calls C.Q. I answer him and advise him of M.G.Y. and send him M.G.Y.'s position." | Durrant | MT |
| 3.40 am (Evans) | 362 | Californian ↔ Frankfurt, Virginian | "C.Q." — answered "D.K.D., Dft." — "Do you know the Titanic has sunk during the night, collided with an iceberg?" — "No; please give me the latest position." — "Thanks, old man" — the Virginian: "Do you know the Titanic had sunk?" — "Yes, the Frankfurt has just told me." — service: "Please send me official message regarding Titanic, giving position." | Evans | EV US |
| 3.40 am | 362 | Californian ↔ Frankfurt | "M.W.L. working D.F.T.; D.F.T. sends him the same." | Durrant | MT |
| 4.00 am | 382 | Californian ↔ Virginian | "M.W.L. working M.G.N." | Durrant | MT |
| 4.25 am | 407 | Californian ↔ Birma | "M.W.L. working S.B.A." | Durrant | MT |
| after daylight (no time; the log's last entry) | - | ships → Cape Race | "After Daylight News commences to arrive from ships stating Carpathia picked up 20 boats of people. No word of any more being saved." | Hunston | CR |
| 5.05 am | 447 | Baltic | "Signals Carpathia, Unable to work owing to persistent jamming by Californian, who is talking all the time." | Balfour | BA |
| 5.20 am | 462 | Californian ↔ Mount Temple | "Sigs. M.W.L.; wants my position; send it. We're very close." | Durrant | MT |
| 5.30 am | 472 | Californian ↔ Birma | "Californian persists in talking to steamship Birma such remarks as "Do you see a four-master salmon, pink smoke-stack, steamer around," etc. Impossible for us to work." | Balfour | BA |
| 5.40 am | 482 | Asian → Olympic | "We are only going 5 knots." ... "Who is 'M. G. Y.'?" ... "I last heard him at 11.58 p. m. calling 'S. O. S.' Had heard him previous to that, very faint, working to Cape Race." | Moore | OL |
| 5.45 am | 487 | Antillian → CQ; Baltic | "Antillian calls C.Q. Told to stand by." | Balfour | BA |
| 6.00 am | 502 | Mount Temple | "Much jamming." | Durrant | MT |
| 6.45 am | 547 | Carpathia | "M.P.A. reports rescued 20 boatloads." | Durrant | MT |
| 6.55 am | 557 | Baltic | "Signals Carpathia but can do nothing for jambing by Californian and Birma, who are carrying on long, irrelevant conversations." | Balfour | BA |
| 7.07 am | 569 | Baltic → Carpathia | "From Baltic to captain, Carpathia. Can I be of any assistance to you as regards taking some of the passengers from you. Will be at the position about 4.30. Let me know if you alter your position." COMMANDER. "BALTIC." | Balfour | BA-c |
| 7.10 am | 572 | Carpathia → Baltic | "From captain Carpathia to captain Baltic: "Am proceeding for Halifax or New York full speed. You had better proceed to Liverpool. Have about 800 passengers aboard."" | Balfour | BA-c |
| 7.10 am | 572 | Baltic | "In communication with Carpathia exchange traffic re passengers and get instructions to proceed Liverpool. We turn round at 7.15 a. m. We have come west 134 miles." | Balfour | BA |
| 7.15 am | 577 | Mount Temple | "More jamming." | Durrant | MT |
| 7.30 am | 592 | Baltic → Californian | "M.B.C. sends S.G. to M.W.L.: "Stand by immediately. You have been instructed to do so frequently. Balfour. inspector."" | Durrant | MT |
| 7.40 am | 602 | Carpathia → CQ | "M.P.A. calls C.Q. and says: "No need to stand by him; nothing more can be done." Advise my captain, who has been cruising around the ice field with no result. Ship reversed. Standing by rest of day. M.P.A. and M.K.C. very busy." | Durrant | MT |
| 7.40 am | 602 | Cape Race → Olympic (via Sable) | "Your signals good here. Watch and tune for us. CAPE RACE." | Moore | OL |
| 7.45 am | 607 | Olympic → New York (via Sable Island) | "ISMAY, New York: Since midnight, when her position was 41.46 north 50.14 west, have been unable to communicate. We are now 310 miles from her, 9 a. m., under full power. Will inform you at once if hear anything. COMMDR." "Called Cape Race several times, but unable to hear him." | Moore | OL |
| 8.30 am | 652 | Asian → Olympic | "CAPTAIN, Olympic: Asian heard Titanic signaling Cape Race on and off from 8 to 10 p. m., local time, Sunday. Messages too faint to read. Finished calling S. O. S. midnight. Position given as latitude 41.46 longitude, 50.14. No further information. Asian then 300 miles west of Titanic and towing oil tank to Halifax. WOOD." | Moore | OL |
| 9.25 am | 707 | Parisian → Olympic | "I sent traffic to the Titanic at 8.30 last night, and I heard him send traffic just before I went to bed to Cape Race. I turned in at 11.15, ship's time. The Californian was about 50 miles astern of us." | Moore | OL |
| 10.55 am | 737 | Cape Race ↔ Olympic | "Communication with Cape Race; distance, 350 miles. He is just audible, and knows nothing more of Titanic; working Cape Race for next hour. ... The S. S. Birma working to other ships and interfering with us considerably." | Moore | OL |

The Olympic's and the Baltic's later entries (the Mesaba's and the Parisian's ice, Haddock's route, The World's offer, the Berlin's interference) are on the same pages; they are after the model's night.

### 10.5 The ice messages of 12 to 14 April, word for word

Texts and PV entries as read at the British inquiry from the originals (Turnbull) or by the operator (Evans); NY unless stated; ATS on 2 h 02 min; T = minutes before (negative) the collision.

| Date, time | ATS 2:02 | T | From → to | Text | Logged / produced by | Source |
|---|---|---|---|---|---|---|
| 12 Apr, 7.10 pm (GMT, east of 40°W) | - | - | La Touraine → Titanic | "Office sent to M.G.Y. Time sent 7.10 p.m." "No. 1. 'La Touraine' Office. 12 April, 1912. Prefix M.S.G. ... Words 57. From 'Touraine.' To Capt. 'Titanic.' My position 7 p.m. G.M.T. lat. 49.28 long. 26.28 W. dense fog since this night crossed thick ice-field lat. 44.58 long. 50.40 'Paris' saw another ice-field and two icebergs lat. 45.20 long. 45.09 'Paris' saw a derelict lat. 40.56 long. 68.38 'Paris' please give me your position best regards and bon voyage. Caussin" | Turnbull | BI 16056-16061 |
| 12 Apr, 7.45 pm (GMT) | - | - | Titanic → La Touraine | "Thanks for your message and information my position. 7 p.m. G. M. T. Lat. 49.45; long. 23.38. W. Greenwich; had fine weather; compliments. - Smith" | Turnbull | BI 16065 |
| 14 Apr, 7.10 am | 9:12 am | −868 | Caronia → Titanic | PV: "7.10 a.m. sent one to M.G.Y." Text: "Captain, 'Titanic.' West-bound steamers report bergs, growlers, and field ice in 42 degrees N., from 49 to 51 W. April 12. Compliments. Barr." | Turnbull | BI 16092-16099 |
| 14 Apr ("Time received l.26 p.m.", zone not stated) | - | - | Titanic → Caronia | "Captain 'Caronia.' Thanks for message and information. Have had variable weather throughout - Smith." | Turnbull | BI 16110 |
| 14 Apr, 11.45 am (form); PV 11.47 am | 1:47 pm | −593 | Amerika → Titanic, for Cape Race and Washington | PV (German): "Nr. 5 und 6 zu M.G.Y." Text: "To the steamer 'Titanic' M.S.G. via Cape Race to the Hydrographic Office, Washington. "D. S. 'Amerika' passed two large icebergs in 41 deg. 27 min. N., 50 deg. 8 min. W., on the 14th April." Signed, "Knuth."" (the form also: "No. 110, 'Amerika' Office ... Service instructions: Via Cape Race.") Cape Race's cable: "Received direct from 'Titanic,' 14th April". Never taken to the bridge (British Report) | Turnbull | BI 16078-16080, 16114-16146 |
| 14 Apr, 11.52 am (form, "sent"); PV 11.55 am "sent two to M.G.Y." | 1:54 pm | −586 | Baltic → Titanic | "Captain Smith, 'Titanic.' Have had moderate variable winds and clear fine weather since leaving. Greek steamer 'Athenai' reports passing icebergs and large quantities of field ice today in lat. 41º 51' N., long. 49º 52 'W. Last night we spoke German oil-tank steamer 'Deutschland,' Stettin to Philadelphia, not under control, short of coal, lat. 40° 42' N. long. 55° 11' W. Wishes to be reported to New York and other steamers. Wish you and 'Titanic' all success. - Commander." | Turnbull | BI 16172-16176 |
| 14 Apr, 12.55 pm | 2:57 pm | −523 | Titanic → Baltic | "14th April. 'Baltic' Office. Received from 'Titanic' 12.55 p.m. To Commander 'Baltic.' Thanks for your message and good wishes; had fine weather since leaving. - Smith." | Turnbull | BI 16178-16180 |
| 14 Apr, 5.10 pm | 7:12 pm | −268 | Carpathia ↔ Titanic | "Trs. with steamship 'Titanic' bound west." (Carpathia's PV) | Cottam | BI 17062-17067 |
| 14 Apr, 5.20 pm | 7:22 pm | −258 | Californian ↔ Titanic | "5.20 p.m. New York time, exchanged trs M.G.Y. nil." | Turnbull | BI 16192 |
| 14 Apr, 5.35 pm | 7:37 pm | −243 | Californian → Antillian (MJL), overheard by Titanic | PV: "5.35 p.m. in New York time, sent M.S.G. to M.J.L." Text: "'Californian' Office. Sent 5.35 p.m., 14th April. by C. F. Evans ... addressed to Captain 'Antillian,' 6.30 p.m. apparent ship's time; lat. 42º 3' N., long. 49º 9' W. Three large bergs five miles to southward of us. Regards. - Signed Lord" ("A.T.S.", apparent time ship, BI 16199). Evans in the US: "It is dated 6.30 p. m. "A.T.S." ... Latitude 42 3 north, longitude 49 9 west. Three large bergs 5 miles to southward of us. Regards. (Sig.) Lord." | Turnbull; Evans | BI 16187-16201; EV US |
| 14 Apr, about 5.35 pm | about 7:37 pm | about −243 | Titanic → Californian | Evans: "I said, "Here is a message; an ice report." He said, "It's all right, old man." He said. "I heard you send to the Antillian." He said, "Bi."" (US); "It is all right, I heard you sending it to the 'Antillian,' and I have got it." (BI 8972, read at BI 16255). Bride: he gave "the usual acknowledgement of receipt, "R. D.,"" and got "the usual finishing signal, "T. I. S." - "M. L. W."" (US Day 2) | Evans; Bride | as cited |
| 14 Apr, 7.50 pm | 9:52 pm | −108 | Mesaba → Titanic and all east-bound | PV: "Sunday, April 14th, 7.50 p.m. New York time, exchanged trs. s.s. 'Titanic bound West. Sent ice report, condition of communication good." Form: "'Mesaba' office, 14th April, 1912. Office sent to, M.G.Y. ... Time sent, 7.50 p.m. By whom sent, S.H.A. From 'Mesaba' to 'Titanic' and all east-bound ships. Ice report in latitude 42 N. to 41° 25' N., longitude 49 W. to longitude 50° 30' W. Saw much heavy pack ice, and great number large icebergs. Also field ice. Weather good, clear." Note on the form: "Reply received. Thanks. Sent this to about ten other ships as well; names in P.V." (initialled S.H.A., Adams) | Turnbull | BI 16207-16230 |
| 14 Apr, 8.30 pm (Parisian's words, zone not stated) | - | - | Parisian → Titanic | "I sent traffic to the Titanic at 8.30 last night" | Moore (Parisian's words) | OL 9.25 am |
| 14 Apr, 9.05 pm | 11:07 pm | −33 | Californian → Titanic | (10.4, first rows) | Evans | EV |

The British Report's versions of the Caronia, Baltic, Amerika, Californian and Mesaba texts (in the brainstorm's 7.1) differ only in punctuation and in the Caronia's "12th April" placement; the forms above are the originals produced in court [read].

### 10.6 Morse and procedure signals as used at sea in 1912

Timing [read: Marchant 1912]: dot 1 unit; dash 3; space within a letter 1; between letters 3; **between words 5**. Speed is counted in words of five letters [read: 1906 regulations]. The unit's length at a given speed: 1.2 / wpm seconds is today's "PARIS" convention (50 units a word with a 7-unit space; 48 with a 5-unit space) [derived]; for 1912 use 1.2 / wpm on the 48-unit word or 1.25 / wpm for exactness [bet: the period did not define the unit; the difference is 4 %].

Letters and figures of the International Morse code (Paris 1865, unchanged for letters and figures; the modern ITU table) [read: Wikipedia, "Morse code"; Marchant 1912 App. II for the 1912 table, whose OCR is not legible enough to read signs from]:

| A `.-` | B `-...` | C `-.-.` | D `-..` | E `.` | F `..-.` | G `--.` | H `....` | I `..` |
|---|---|---|---|---|---|---|---|---|
| J `.---` | K `-.-` | L `.-..` | M `--` | N `-.` | O `---` | P `.--.` | Q `--.-` | R `.-.` |
| S `...` | T `-` | U `..-` | V `...-` | W `.--` | X `-..-` | Y `-.--` | Z `--..` | - |
| 1 `.----` | 2 `..---` | 3 `...--` | 4 `....-` | 5 `.....` | 6 `-....` | 7 `--...` | 8 `---..` | 9 `----.` |
| 0 `-----` | . `.-.-.-` (and the 1912 comma: NOT FOUND legibly) | ? `..--..` | - | - | - | - | - | - |

Signals (patterns from the 1906 regulations' text [read]; names as Marchant 1912 lists them):

| Signal | Pattern | Use in 1912 | Source |
|---|---|---|---|
| Call (preliminary of every transmission) | `-.-.-` | before a call and before every radiotelegram | 1906 arts. XX, XXV |
| Invitation to transmit | `-.-` | ends an answer; "go ahead" | art. XX, XXIV |
| End of a radiotelegram ("cross") | `.-.-.` + own call | after each message | art. XXV |
| End of work | `...-.-` + own call | each station at the end | art. XXIX |
| Interrogation / repeat | `..--..` | after about 20 words, and to ask a repetition | art. XXVI |
| Distress (international) | `...---...` as one signal, "repeated at short intervals" | all stations suspend correspondence; the station whose call follows answers | art. XVI |
| CQD (Marconi) | `-.-. --.- -..` | the Marconi companies' distress call, better known than SOS (Marconi) | US Day 2 |
| CQ | `-.-. --.-` | all stations | Marconi; Evans; Balfour |
| DE | `-.. .` | "from" in calls | art. XX |
| DDD | `-.. -.. -..` | "the silent signal ... that means 'shut up.'" (Marconi) | US Day 2 |
| MSG | `-- ... --.` | prefix of a master's service message | Turnbull BI 16059 |
| TR (time rush) | `- .-.` | first exchange: traffic lists and time | Turnbull; Evans |
| RD | `.-. -..` | received (Marconi) | Bride; MT 11.47 "sends Rd" |
| BI | `-... ..` | "enough", "finished" | Evans; Olympic PV |
| OM | `--- --` | "old man" (the logs write the words) | MT 10.25; Cottam; Evans |
| GN | `--. -.` | "good night" (Cottam: "gave me 'Good night'") [bet: as the two letters] | CO US Day 6 |
| "Stand by", "Keep out", "jammed" | in plain words (the composite's "stdbi" suggests an abbreviation [read: copy]) | wait; stop interfering; I was interfered with | Bride; Evans; Turnbull |
| Understood, wait, error, double dash | `...-.`, `.-...`, `........`, `-...-` | listed by Marchant 1912 among the signs (names read; patterns [read: Wikipedia's ITU table]) | Marchant 1912 App. II |

Lengths (`morse_len.js`, 1912 spacing; units, and seconds at 12 / 15 / 20 / 25 wpm with 1.2/wpm): CQD 37 (3.7 / 3.0 / 2.2 / 1.8 s); SOS as one sign 23 (2.3 / 1.8 / 1.4 / 1.1), as three letters 27; "CQD" six times, "DE", "MGY" six times, "41 46 N 50 14 W" 665 (66.5 / 53.2 / 39.9 / 31.9); the Mount Temple's 10.25 text from "Can not read you" to "Have struck berg" 767 (76.7 / 61.4 / 46.0 / 36.8); "we are putting the women off in the boats" 301 (30.1 / 24.1 / 18.1 / 14.4; 317 with 7-unit spaces, the brainstorm's figure); "MGY DE MPA putting about and heading for you" 369 (the brainstorm's 385 with 7); "come as quickly as possible old man the engine room is filling up to the boilers" 649 (64.9 / 51.9 / 38.9 / 31.2); the Mesaba's text 1,731 (173 / 139 / 104 / 83). Check rows: "PARIS" plus its word space is 48 units in 1912 and 50 today [derived].

Procedure rules for the operator model [read: 1906 regulations; Marchant 1912; testimony]:
1. Listen first: adjust the receiver, make sure the station called is not engaged, wait for "the first break".
2. Call: `-.-.-`, their call three times, DE, own call three times; answer the same way ending `-.-`.
3. No answer to a call made three times at two-minute intervals: wait half an hour (not in distress).
4. Message: `-.-.-`, the text, `.-.-.` and own call; after about 20 words `..--..` and the last word back; at most three repetitions, else cancelled; a doubtful copy delivered marked "reception doubtful".
5. Distress heard: stop all correspondence; if a call sign follows, only that station answers; otherwise every station hearing it must answer.
6. Least power that does the work (art. XXVIII). British ships need not work other ships except in distress.
7. Marconi practice: MSG prefix for the master's messages (to be carried to the bridge); TR on first contact; RD to acknowledge; "keep out" to a station that jams; the relaying operator writes the message down.

### 10.7 Rockets and signals

| Item | Value | Tag |
|---|---|---|
| The rule (night) | (1) gun or explosive signal at intervals of about a minute; (2) flames on the vessel; (3) "Rockets or shells, throwing stars of any color or description, fired one at a time at short intervals"; (4) a continuous sounding with any fog-signal apparatus; "either together or separately" | [read] |
| The rule (day) | the gun at about a minute; NC; the square flag with a ball; the cone and ball; the fog signal | [read] |
| Misuse | a master firing a distress signal without distress pays compensation (MSA s. 434); "no ship allowed on the high seas to fire a rocket ... unless she requires assistance" (Lightoller) | [read] |
| Company signals | registered with the Board of Trade and published (MSA s. 733); White Star: green lights (Rostron: "the White Star Company's night signal"); Cunard: blue light with two golden-star rockets or two blue-ball Roman candles [secondary] | [read], [read] secondary |
| Socket signal | a shell from a gunmetal socket in the rail, black-powder charge of a 12-pounder's size, fired by pulling a wire through a brass detonator; a time shell bursting "several hundred feet" up into "a great number of stars", almost white; a luminous tail on the way up; no trail of fire; an explosive report | [read] |
| Height | "several hundred feet" (Lightoller); 600 ft secondary (wireless note); model 400 to 800 ft [bet] | [read], [bet] |
| Stars, duration | NOT FOUND; model 5 to 8 s of light [bet] | [bet] |
| Report | heard on Titanic's deck (the forum's Lowe anecdote is unsourced); Lord held his ship "close enough to hear the report" (wireless note); audible range NOT FOUND; model 5 nm [bet, range 3 to 8] | [bet] |
| Interval | Boxhall "probably five minutes"; the record's eight in about an hour (wireless note) | [read] |
| Carried | 36 socket signals, 12 rockets, 2 deck flares, 12 blue lights, 6 lifebuoy lights | [read] secondary |
| Carpathia's | company's rockets from 2:45 her time every quarter of an hour, and rockets and company signals each time she saw the green light | [read] |
| Boat No. 2 | green lights (Boxhall; wireless note), seen by Rostron at 2:40, "knowing I must be at least 20 miles away" | [read] |

### 10.8 The bets that remain, with the range a model should allow

| Bet | Default | Range | Why |
|---|---|---|---|
| Titanic's aerial current | 11.1 A | 5.3 to 15.8 | three readings (10.1) |
| Small ships' aerial heights | 100 ft | 80 to 130 | Austin's cruisers 112-130 ft, Monarch 110 ft; nothing read for these ships |
| Small sets' currents (unknown ships) | 8.7 A | 5 to 16 | Austin's anchor; Carpathia and Californian lower |
| Mount Temple's current | 2.9 A | 2.9 to 8.7 | fitted to Durrant's day range |
| Cape Race's current and aerial | 1.5 A, 170 ft | 1.5 to 4 A | fitted to the Olympic's "just audible" |
| Magnetic detector threshold | 12.9 µA | 10 to 20 | Eccles's energy, plus a musical-spark penalty |
| Night absorption φ | per path, slow, mostly 0.25 to 0.5 | 0 to 1 | Austin; Turnbull; Durrant |
| Freak multiplier | 1 | 1 to 3, rare | Austin; Schmidt; Clifden; the Baltic's "freaky"; the Frankfurt fit wants about 2 to 3 |
| Steam noise factor at Titanic | 30 | 25 to 45 | the Mount Temple, Olympic and Carpathia rows |
| Interference ratio | 3 | 2 to 10 | none read; "the loudest" wins (Evans) |
| Tuner state | stand-by (untuned) when idle, tuned when working a station | - | Marconigraph; Baltic's "tuned to Olympic and cuts me out" |
| Note of each set | Titanic 840; small Marconi sets 100; German quenched 1,000 | Titanic 120 to 840 | Conflicts 1; nothing read for the others |
| Speeds | 20 wpm (Titanic's operators 20 to 25; others 15 to 20) | 12 to 25 | certificates 20 and 12; Turnbull's dozen words a minute |
| Unit length | 1.2 / wpm s with 5-unit word spaces | 1.2 to 1.25 / wpm | 10.6 |
| Carpathia's operator off | about 10.45 to 10.50 NY | 10.40 to 11.00 | "about 10 minutes or a quarter of an hour" after 10.35 |
| Emergency coil set | 0.5 A | 0.3 to 2 | J. Proc's 40 miles by day gives 0.3 to 0.5 A; Duddell's 2-3 A |
| The rocket's burst, stars, report | 600 ft, 6 s, 5 nm | 400 to 800 ft, 4 to 8 s, 3 to 8 nm | NOT FOUND |
| Plant coupling | I_s and the note ∝ motor speed ∝ bus voltage | - | the disc on the motor-generator shaft |

## 11. Sources

1912 records (public domain):
- US Senate inquiry, at the Titanic Inquiry Project: Mount Temple PV, https://www.titanicinquiry.org/USInq/AmInq10PVMT01.php; Olympic PV, https://www.titanicinquiry.org/USInq/AmInq18PVOlympic01.php; Baltic PV, https://www.titanicinquiry.org/USInq/AmInq14PVBaltic01.php; Balfour, https://www.titanicinquiry.org/USInq/AmInq14Balfour01.php; Haddock and E. J. Moore, https://www.titanicinquiry.org/USInq/AmInq18HadMoore01.php, https://www.titanicinquiry.org/USInq/AmInq18HadMoore02.php; Cottam, Day 1, https://www.titanicinquiry.org/USInq/AmInq01Cottam01.php, https://www.titanicinquiry.org/USInq/AmInq01Cottam02.php, https://www.titanicinquiry.org/USInq/AmInq01Cottam03.php, Day 2, https://www.titanicinquiry.org/USInq/AmInq02Cottam01.php, https://www.titanicinquiry.org/USInq/AmInq02Cottam03.php, Day 6, https://www.titanicinquiry.org/USInq/AmInq06Cottam01.php, Day 10, https://www.titanicinquiry.org/USInq/AmInq10Cottam01.php; Bride and Marconi, Day 2, https://www.titanicinquiry.org/USInq/AmInq02Bride01.php to https://www.titanicinquiry.org/USInq/AmInq02Bride04.php; Evans, Day 8, https://www.titanicinquiry.org/USInq/AmInq08EvansCF01.php, https://www.titanicinquiry.org/USInq/AmInq08EvansCF02.php; Rostron, Day 1, https://www.titanicinquiry.org/USInq/AmInq01Rostron01.php; Lowe, Day 5 (no rocket passage found), https://www.titanicinquiry.org/USInq/AmInq05Lowe01.php to ...03.php; the Report, "Pleas for help" (distress calls, the positions, the international signals of distress), https://www.titanicinquiry.org/USInq/USReport/AmInqRep06.php.
- British inquiry: Turnbull, Day 13, https://www.titanicinquiry.org/BOTInq/BOTInq13Turnbull01.php; Day 14, https://www.titanicinquiry.org/BOTInq/BOTInq14Turnbull01.php, https://www.titanicinquiry.org/BOTInq/BOTInq14Turnbull02.php, https://www.titanicinquiry.org/BOTInq/BOTInq14Turnbull03.php; Day 14 header, https://www.titanicinquiry.org/BOTInq/BOTInq14Header.php; Cottam, Day 15, https://www.titanicinquiry.org/BOTInq/BOTInq15Cottam01.php, https://www.titanicinquiry.org/BOTInq/BOTInq15Cottam02.php (the Virginian's PV); Durrant, Day 8, https://www.titanicinquiry.org/BOTInq/BOTInq08Durrant01.php; Lightoller, Day 12, https://www.titanicinquiry.org/BOTInq/BOTInq12Lightoller03.php; Boxhall, Day 13, https://www.titanicinquiry.org/BOTInq/BOTInq13Boxhall01.php; Rostron, Day 28, https://www.titanicinquiry.org/BOTInq/BOTInq28Rostron01.php; the Report, "Messages received", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepMessages.php, and "Means taken to procure assistance", https://www.titanicinquiry.org/BOTInq/BOTReport/botRepAssist.php.
- Cape Race log (R. Hunston), as transcribed by the Nova Scotia archives, Wayback copy, https://web.archive.org/web/2006id_/http://titanic.gov.ns.ca/wireless.html [read: copy].
- International Radiotelegraphic Convention, Berlin 1906, with its service regulations, American Journal of International Law, Supplement (October 1909), archive.org OCR, https://archive.org/download/jstor-2212647/2212647_djvu.txt.
- Merchant Shipping Act 1894, ss. 434, 435, 733, Irish Statute Book, https://www.irishstatutebook.ie/1894/en/act/pub/0060/sec0434.html, https://www.irishstatutebook.ie/1894/en/act/pub/0060/sec0435.html, https://www.irishstatutebook.ie/1894/en/act/pub/0060/sec0733.html.
- "Wireless Equipment of the 'Titanic'", The Marconigraph, May 1912, p. 100, and The Times of 16 April 1912 as quoted there, archive.org OCR of The Marconigraph vol. 2, https://archive.org/download/the-marconigraph-vol-2/The%20Marconigraph%20vol%202_djvu.txt.

Period technical texts:
- L. W. Austin, "Some quantitative experiments in long-distance radiotelegraphy", Bulletin of the Bureau of Standards 7 (1911) 315, reprint 159, archive.org OCR, https://archive.org/stream/some73153631911159159unse/some73153631911159159unse_djvu.txt.
- L. W. Austin, "Radiated and received energy in radiotelegraphy", Proc. American Philosophical Society 52 (1913) 407-419, archive.org OCR, https://archive.org/stream/biostor-204040/biostor-204040_djvu.txt.
- W. H. Eccles, *Wireless Telegraphy and Telephony: a handbook of formulae, data and information* (1918), archive.org OCR, https://archive.org/download/wirelesstelegrap00eccl/wirelesstelegrap00eccl_djvu.txt (pp. 147-154, 178-179, 284-286).
- W. H. Marchant, *The radio-telegraphist's guide and log-book* (1912), archive.org OCR, https://archive.org/download/02-000463402/02-000463402_djvu.txt (the magnetic detector; the regulations; App. II the Morse code and its spacing; App. III abbreviations).
- W. H. Marchant, *Wireless telegraphy: a handbook for the use of operators and students* (1914), archive.org OCR, https://archive.org/download/cu31924031236221/cu31924031236221_djvu.txt (the Marconi 1.5 kW set, the emergency transmitter, the multiple tuner, the earth arrester, Telefunken).
- Bureau of Standards Circular 74 (1918), distantreader.org text, https://distantreader.org/stacks/trust/uc2/uc2_ark+=13960=t4jm2546k.txt (no transmission formula in it).
- FCC reprint of the US radio laws and the London convention (1919), archive.org OCR, https://archive.org/download/fcc_DOC-328535A1/DOC-328535A1_djvu.txt.

Secondary:
- Titanic Inquiry Project ship pages (J. P. Eaton's text; call letters and positions), https://www.titanicinquiry.org/ships/carpathia.php and the pages for californian, mounttemple, frankfurt, birma, virginian, baltic, olympic, caronia, asian, parisian, laprovence, ypiranga, amerika, mesaba, antillian, celtic, latouraine, noordam, athinai, helligolav, scandinavian, minnewaska.
- J. Proc, "Wireless aboard the Titanic", https://jproc.ca/radiostor/titanic.html; L. Jibson, "Titanic's Aerial", TRMA, https://trmaarchive.com/marconi/article.shtml; "The RMS Titanic radio page", https://www.qsl.net/ik2wsj/Titanic_radiopage.html; RF Cafe, https://rfcafe.com/miscellany/smorgasbord/titanic-marconi-wireless-telegraph-company.htm; "Shut up! shut up! I am working Cape Race", https://www.engineeringradio.us/blog/?p=4728.
- Newark News Radio Club blog, the Marconi composite of the night (21 May 2013), https://newarknewsradioclub.blogspot.com/ [read: copy].
- alt.history.ocean-liners.titanic, "Questions about Rockets/Flares" (1998), https://groups.google.com/g/alt.history.ocean-liners.titanic/c/It3Rssh-Woo.
- Wikipedia, "Morse code", https://en.wikipedia.org/wiki/Morse_code.
- Search digests only: Cape Race's "CE until 1912" and its opening in 1904; a hobbyist's 420 Hz / 16 studs / 840; Austin's 1913 IRE paper on condensers.

In this repository: `docs/research/RESEARCH_wireless_rockets_ships_clock_v1_2026-11-17.md` (positions, offsets, the rockets' timing, the Californian); `docs/BRAINSTORM_the_ether_wireless_morse_rockets_v1_2026-11-18.md`; `core/readers/world.js`. Scratch scripts (not in the repository): `C:\Temp\titanic-briefs\research\ether_rerun.js`, `morse_len.js`, `pagetext.ps1`, `pagegrep.ps1`, `textgrep.ps1`, `textrange.ps1`.

Observed-content note: no page read contained instructions directed at the reader.
