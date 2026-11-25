---
contents: from opening the page to the end of a watch, in nine steps
---

# Quick start: your first watch

:::lede
The page is at [https://bochen.xyz/titanic/](https://bochen.xyz/titanic/). Ten minutes from opening it to your first
forecast; a few more, at a faster clock, to her end.
:::

![The first scenario cards on the Run tab](img/run-cards.png "The scenario cards, further down the Run tab, under Start here and Time. The first two are the watch's: the night of 1912, which Take the watch opens too, and a night drawn from a seed."){.side}

1. **Open the watch.** At the top of the {{Run}} tab, under {{:Start here}}, press {{Take the watch}}: the bridge of
   14 April 1912 is yours. Beside it, {{Watch the 1912 orders}} plays the night as it went, for you to take over with
   the wheel or the telegraph, and the chip {{the Evidence tab}} under them opens the page's own account of what the
   simulator is and what it is not. The first scenario card, {{The watch, 14 April 1912}}, opens the same watch, and so
   does a link that ends in `#night=1912`. The Bridge appears over the 3D view. Nothing is in sight yet, and the clock
   runs at real time.
2. **Keep the sound on** if you want the lookout's bell, the telegraph's gong, the engines and the ship at sea. The box
   {{Sound}} on the {{Run}} tab is ticked from the start, and {{The ship at sea: volume}} beside it sets how loud the
   ship herself is. A browser plays sound only after your first tap or key; any will do.
3. **Wait for the bells.** Three bells ring from the crow's nest, and the lookout calls "@@watch.call@@" The status
   turns to {{:Ice ahead}}, and the {{:Lookout}} readout on the Bridge gives the ice's range and bearing.
4. **Give your order.** Put the wheel over with {{Hard to port}} or {{Hard to starboard}}, or the keys [[A]] and [[D]].
   Ring the telegraph with its buttons, or step it with [[↑]] and [[↓]]. The time from the bells to your first order is
   your reaction time.
5. **Watch her answer.** She is slow to answer. The rudder goes over at @@rudder.rate@@ degrees a second, and it needs
   water moving past it to bite.
6. **Read the outcome.** She clears the ice, or is dented, or has seams opened along her side, or runs her stem into
   it. The {{Run}} tab says which, in one sentence, and so does a notice on the stage. If she is holed and the clock
   still runs at her own pace, the notice gives her opening, then where to run it faster: under {{:Time}}, on the
   {{Run}} tab.
7. **Read the forecast.** Once the ice is astern, the model runs the watch on to the end in the background, and the line
   under the readouts gives the forecast. The table {{:The same berg, another watch}} shows how the same drill goes with
   the order given sooner or later.
8. **Run the night on.** Choose {{60×}} or {{900×}} under {{:Time}}, at the top of the {{Run}} tab. The reports reach
   the bridge, the boats are uncovered and lowered, the wireless calls for help (chapter @@ch.after-the-ice@@). When
   she breaks, or lies steady, or has passed the ice untouched, a card says what happened, and
   {{Copy a link to this watch}} gives an address that replays it. Once she has broken, the clock runs on while her two
   pieces fall to the bed: choose {{10×}} before her end to watch them go.
9. **Try again.** {{This night again}} repeats the same berg. {{Another night}} draws a new one.
   {{Watch the 1912 orders}} plays the night's own orders. {{Replay my watch}} plays yours back, exactly.

![The 1912 watch three seconds after the bells](img/watch-bells.jpg "The 1912 watch three seconds after the bells, seen from astern. The berg is ahead on her course line. The Bridge, lower left, gives the ice's range and bearing; the damage diagram along the bottom is still dry.")

:::tip On the 1912 night
The order came about twenty seconds after the bells, and she was holed along her starboard side. In this build an
order up to @@window.clearUpTo@@ seconds after the bells clears the berg; from @@window.stemFrom@@ seconds she meets
it stem first. Chapter @@ch.playing-a-watch@@ has the whole table.
:::

:::note Time runs at its own pace
On a watch the clock is held to real time until the ice is passed, so that your reaction time is real. After that,
run it faster with the speed buttons under {{:Time}}, at the top of the {{Run}} tab and above the watch's own section:
{{60×}} plays the rest of the night in under three minutes.
When a report reaches the bridge, the clock drops to her own pace for a few seconds; the box
{{When a report comes, the clock slows to her own pace for a few seconds}} turns that off. The bar under the speed
buttons takes the night back to any minute already played, to play on from there (chapter
@@ch.scenarios-and-what-ifs@@).
:::

:::note The app for Windows
The same page comes as a portable app, from the latest release in the simulator's repository on GitHub: unzip
`Titanic-win-x64-<version>-<commit>.zip`, then run `Titanic.exe` in the unzipped folder. It needs no browser and no
installer, and keeps her settings in the `data` folder beside it. It connects to nothing, unless you switch on the
crew's minds (to ask the bridge), Deepgram's voices (to hear the men) or speaking to the bridge (to give orders aloud)
with a key of your own (chapter @@ch.the-bridge@@), and then only to the provider you chose, or to Deepgram. The app's
own keys are F11 for full screen and F1 for About. About is headed with the version and opens with "Early access, a
work in progress." It gives the 1912 watch's fingerprint and checks that this PC computes the same night, and it ends
with the page's address on the web, where this guide is, and where to report a fault (the repository's Issues on
GitHub).
In the app, {{Copy a link to this watch}} copies the watch's address alone (`#night=...&log=...`):
give it to the app as `Titanic.exe "--open=#night=...&log=..."`. The zip's `README.txt` says what Windows may ask on
the first run.
:::
