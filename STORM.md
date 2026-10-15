# The channelled storm: handover for a new version

Written 15 October 2026, at the end of the thread that built it, for whoever makes the next
version (person or AI assistant). The owner liked what was made and wants **a new version of it
tried in a new thread**. This file is what that thread needs: what the idea is, what was built and
why, what the owner reacted to and how, what went wrong technically, and where a new version could
go. Read it with `HANDOFF.md` (the site as a whole) and `WEAVES.md` (the weaving).

## 1. The idea, in the owner's words and order

The thread began as a hypothetical ("if I should, in a moment such as this, feel like creating a
violent storm") and grew, one request at a time:

1. A storm the owner can call up **at will**, temporarily, that departs from the open (Open-Meteo)
   data, and **says so in the menu**. Final words, the owner's: **"Weather · Channelled,
   honouring spirits met across Te Moana-nui-a-Kiwa"**. Not "when it will end": "tell them we are
   trying to honour an energy we met at sea, in the fewest words".
2. As violent as possible: an extreme storm, "and they are channelling to make it" (it was then
   fine that they are not *seen* making it).
3. The twelve channellers become **versions of Moiraine, Leane and Siuan Sanche, Aes Sedai**.
4. **More realistic lightning**, with reference photos (bolts at sea, a cloud-base glow where each
   leaves the cloud, the bright point on the water). Steam plumes at the strike were judged
   "rare-ish, almost too fast": work with the strike itself.
5. The **smoke off the water** "doesn't seem correct in terms of thermodynamics".
6. **Colour-grade the weaves**: "they should still look like the elements but not in a comic book
   way. Be elegant. Choose subtlety."
7. All of it **combined into one ad-hoc thing**, switched on **for every visitor**, not just one
   address.
8. **More natural rain**; then a channeller **shielding their eyes from the rain** so they can see
   to channel; which needed **3D rain**.
9. The channellers **cut the rain off by channelling up to the sky**: "make it beautiful and make
   it fluid... the way that humans are capable of moving energy in this world (think Qi Gong
   experts)". The owner: "I adore it all."
10. "More natural, more poetic?", then **"Innovate again, we must have other options"**, then
    **"What do YOU think are the best ideas?"**, then **"What if you apply all of them at once?"**
11. The cone was "still so mathematical or geometrically perfect"; the big shape in the sky must be
    "more abstract and less geometric"; the column "more painterly". Each was done once and pushed.

## 2. What exists now (all live, branch `october` = `main`)

Git tags: `before-storms` (`0cbc93a`, before the thread) and `storms-2026-10-15` (`e5266ce`).

| Part | Where | Notes |
|---|---|---|
| The switch | `storm.json`, `app/utils/channelled-storm.ts`, `OceanBackground.vue` | `"until"` (and optional `"from"`) ISO times; ends by itself; open pages pick it up within 30 s. `/?storm` one visit, `/?storm=off` without. **On until 2026-10-16 21:00 +13:00.** |
| Storm figures | `CHANNELLED_STORM` | 220 km/h gusting 300, 18 m sea, thunder, 915 hPa falling 20 hPa in 3 h (falling so the channellers read it as *building*; a steady storm "asks for little"). |
| Menu row | `SiteNavSwiss.vue`, `CHANNELLED_WORDS` | Shown whenever the weather is not measured (switch or `?pretend=`). |
| Past hurricane force | `beyondHurricane` in `manawatawhi.ts` | Giant swells under the measured sea, more roll, faster lightning (never under ~1 s apart). |
| Aes Sedai | `AES_SEDAI` / `PILGRIMS` in `channellers.ts`, `setChannelledStorm` | Four each of Siuan (water, steady), Leane (eager), Moiraine (curious, still), each keeping the temperament of the pilgrim it replaces. Names show only in `?controls`. The strongest stays the owner. |
| Colour grade | `GRADED_COLOURS`, `uGraded`, `GRADE` in `channellers.ts` | Air dusk lavender `#8e8ac4`, water sea glass `#4f978e`, akasha old gold `#c3a574`, 72% saturation; eases in over seconds. Only during the storm. |
| Lightning | `lightning.ts` | Always on. Tortuous random-walk channel, 14 branches, core plus halo, cloud-base glow, sea attachment point, 3 to 5 strokes flickering in the bolt only (the scene flash rises once: no strobing). 60% of flashes stay in the cloud. |
| Smoke | `fluid.ts` | Always on. Wind steady in the real direction, stronger aloft; heat and gas mixed away fast in wind; no steam at strikes. |
| 3D rain | `rain.ts` | Always on. Three volumes following the boat (near 14 m, mid 60 m, far 260 m). Drop travel is *integrated per frame* (`uDrift`, `uFall`). Shelter: the channeller on the viewer's left holds Air ~2.5 m before their eyes, `parted()`. Supports hang, rise, murmur (shoals), curtain lift, canopy (dry circle). |
| Sky opening | `sky-opening.ts` (column), `sky-all.ts` (everything else) | Every 160 s in a storm; `?show=sky` starts it; `&sky=column` the column alone. Timeline in `skyAllAt`. |

The sky opening, all at once (the live version): murmuration 35 to 60 s into the cycle; the
in-breath (threads drawn off a ring on the sea into the hands) 40 to 48; the column lifted 48 to
62 and opened 62 to 72; the rain hangs 46 to 58 then rises back as mist; the kelp forest 52 to 74;
the strongest's silk ribbon 58 to 78; the curtain of rain lifted 62 to 100; a ring of calm 70 to
110; lanterns from 74; held; let go 125 to 150.

## 3. What the owner reacted to

- **Loved**: the column the first time it worked ("I adore it all, Claude. Wow"); the all-at-once
  piece enough to make it the live version.
- **Asked to change, in this order**: anything geometric (the cone, the concentric rings in the
  sky); "more natural, more poetic"; "more abstract"; "more painterly". The direction is steadily
  **away from drawn objects and towards gesture, weather and brushwork**.
- **When asked for options** they asked for more ("innovate again"), then for my own view, then
  for all of them at once. Give options with a clear recommendation and expect "all".
- **My own recommendation, not taken**: the rain returning upward as the main act, lanterns as its
  close, and dropping the drawn objects (column, kelp, ribbon) in favour of the weave being felt
  only through rain, cloud and air. That idea is still available, and fits the site's standing
  rules ("oceanic truth", "nothing bright in the sky", "strength is not brightness") best.
- Standing rules still in force (`HANDOFF.md`): channellers are healers, nothing jagged or
  electric in a weave, weaves begin and end at the boat, the strongest is "they".

## 4. Ideas offered and not yet built as their own versions

1. The rain returns upward (built only inside all-at-once).
2. Murmuration (likewise).
3. The curtain lifted (likewise).
4. A ring of calm (likewise).
5. Lanterns opening real holes in the cloud onto real stars or moon (built as glows only; the
   cloud itself is not opened: no hole is cut in the sky shader yet).
6. Kelp forest (built, faint).
7. The silk ribbon (built; hard to make read as silk: near the eye it became a grey band).
8. Make the column natural: a waterspout's spray ring at its foot instead of the bright pool;
   a hole opening in the cloud with real starlight through it; light timed to the real swell.

A new version could take any one of these alone and do it fully, or keep all-at-once and refine.

## 5. Technical lessons (each cost time)

- **The app's browser pane is often hidden, and a hidden page stops drawing** (no animation
  frames): pictures freeze or never change. Use `scripts/shoot.mjs` (headless Brave over its
  debugging port), e.g. `~/.local/node/bin/node scripts/shoot.mjs "http://localhost:3000/?hour=22&show=sky" /tmp/x 20 50`.
  Its `EVAL` variable evaluates an expression in the page at the end.
- **Instanced quads were back-face culled**: the rain drew nothing until `side: THREE.DoubleSide`.
- **The storm's fog is a full-screen sheet drawn at renderOrder 5** (`fluid.ts`), up to 85%
  opaque: anything meant to be seen in front of the fog must draw after it (near rain is 6).
- **Never compute a moving thing as velocity × time when the velocity changes** (gusts): it
  jumps. Integrate per frame.
- **The water's mirror** renders layer 0 only; screen-only things go on `SCREEN_LAYER` (1).
- **Sky things right above the boat are never in view** (field of view about ±27° vertically):
  the column had to stand ~600 m ahead to show its opening.
- **Additive light at night burns out** where many threads overlap; keep each thread's alpha low
  (the column's is ~0.16 before brushwork) and expect bloom.
- **By day, light cannot be seen against the sky**: draw as laid colour (normal blending, more
  alpha), as `channellers.ts` does.
- Old console messages persist in the pane's console across reloads; log a marker first.
- Moving a file the dev server was serving left a stale "Failed to fetch" overlay; a clean reload
  cleared it.

## 6. Not verified

Watched only as stills at set seconds, never in motion. Never on a phone or a slow machine (36,000
rain drops plus the sky threads are unmeasured there). The shelter before the channeller's eyes was
never clearly photographed. Reduced motion: rain, lightning and the sky opening are skipped for
visitors who ask for it (check this stays true).

## 7. The way back

- End the storm, keep the work: `storm.json` to `{ "from": null, "until": null }`, commit, push.
- Exactly as before the thread (tested on a copy; identical to `before-storms`):
  ```bash
  git revert --no-commit before-storms..storms-2026-10-15 && git -c user.name="Nabil Sabio Azadi" -c user.email="nsa@nabilsabioazadi.com" commit -m "Back to the site as it was before the storms of 15 October" && git branch -f main october && git push origin october main
  ```
- A new version can live beside this one as another `?sky=` value (the owner likes options side by
  side at their own addresses, the unchosen kept reachable), so nothing need be undone to try it.

## 8. Working with the owner

Not a programmer. Plain words, exact addresses, pictures of the result. British English. Short code
comments that say why. Says "commit and push" for every push; never push before it. Never delete:
move to `.trash/`. Gives direction in feeling ("more poetic", "painterly"): act on it and show a
picture rather than asking for a specification. Be plain about what is still wrong.

## 9. The next versions (16 October, the thread after)

Both live beside the all-at-once version, at their own addresses; nothing earlier was changed.

- **`/?storm&sky=breath`** (`sky-breath.ts`): my earlier recommendation, built alone. Nothing is
  drawn in the sky: the rain leans in on an in-breath, hangs, and goes back up as mist in one wave
  spreading out from the boat; a real hole opens in the cloud (patched into the Sky shader, the
  stars and the fog) with the night's stars in it; a few lanterns go up into it; let go, the rain
  comes back down out of the cloud.
- **`/?sky=sacred`** (`sacred.ts`, with or without the storm): the owner asked for the channellers
  to overcommand the weather with weaves of my design, raise waves held over them, and weave all
  six elements; then to rethink it as Virginia Woolf's "big weave" with a thermodynamic logic. The
  file's header holds the whole reasoning: the six-sided flower of The Waves read as a dissipative
  structure (Bénard cells), fed by the storm's own energy, which is drawn in, never destroyed
  (`STILLED` replaces the weather figures, so lightning and rain stop because the figures say so).
  Its length depends on the storm's energy (about five minutes for the channelled storm), then it
  comes apart, the waves break and the weather returns.
  Not yet right: by day the braid is faint against the pale sky and one broad white band stays in
  the foreground; the waves read more as ridges than as water curling over; the end (petals
  opening out, waves breaking) was never photographed; nothing watched in motion or on a phone.

## 10. The great calming (16 October, 04:30 to 11:30)

The owner: the twelve (Siuan, Leane and Moiraine, four of each) calm everything in seven hours,
with weaves based on thermodynamics, linking and embroidery through the ocean and the sky; it
exhausts them; "all bets are off, trust them". Set in `storm.json` (`"calming"`), physics in
`channelled-storm.ts` (`calmedConditions`: the storm as Emanuel's heat engine, each third working
on one term of its potential intensity), drawn in `embroidery.ts`. The strongest stays out of it.
`/?storm&calm=0.4` shows it 40% through. While it lasts and for hours after, the sky openings do
not run and the twelve's ordinary weaving rests (it comes back between 2 and 10 hours after).
Not yet right: by day, in the storm's haze, the embroidery is hard to see; after it is done the
strongest's white weaving carries on (they are not tired), which may or may not be wanted.

## 11. For the next weaver project (written at the end of the 16 October thread)

What this thread learned about how the owner wants weaving made, in the order it was learned. Read
with `HANDOFF.md`, `WEAVES.md` and §1–10 above.

**Where the work is**
- The great calming: `app/utils/embroidery.ts` (drawn), `calmedConditions` and `calmingNow` in
  `app/utils/channelled-storm.ts` (the weather), `pressedCalm` in `app/utils/gerstner-waves.ts` (the
  sea pressed to glass), `storm.json` (`"calming"`). See it at any point with `/?storm&calm=0.4`.
- Also built, beside the live version: `/?storm&sky=breath` (`sky-breath.ts`, the rain going back
  up and a real hole in the cloud onto the stars) and `/?sky=sacred` (`sacred.ts`, Woolf's
  six-sided flower as a structure fed by the storm's energy, with held waves).
- Shared shader pieces in `weave.ts`: `ribbonShaderChunk` (lines of a set pixel width) and
  `tameShaderChunk` (colour taken only 13–26% of the way from the background towards its own).

**How the owner directed it, and what it taught**
1. *Ground the weave in real physics, then let feeling ride on it.* The calming works because the
   weather follows the storm as a heat engine (Emanuel's potential intensity), each third of the
   twelve on one term of it. Then: "make this look like people's emotion with thermodynamics":
   each channeller's strain as heat (agitation, sighs as expansion, heat shared between
   neighbours, equilibrium at the end). Literature welcome too: "familiarise yourself with
   Virginia Woolf... a thermodynamic logic around her big weave".
2. *Power is scale and mass, never brightness or colour.* Three thin lines for "the most
   powerful channelling ever" earned "Shame on you". Every channeller her own great rope, work
   filling sea and sky. "They can destroy a tower of stone with a single blasting braid... think
   how they would work with the ocean": they move the ocean itself (the swell pressed out of it),
   not decorate its surface.
3. *Barely coloured.* "Tamed to 13–26% of the background colours." Hue from the sea and sky;
   power from form, motion and mass. The strongest's white stays white.
4. *Nothing angular, nothing geometric.* Straight taut lines, a single convergence point, rows of
   evenly spaced braids, dashes lining up into a grid, V-shaped ties: each was called out ("too
   angular", "oblong blobs have got to stop"). Every line one continuous curve; stagger anything
   repeated; nothing in rows; edges uneven.
5. *Effort must show.* "The most effortful weaves": hauling with the breath, gusts paying lines
   back out, quiver under the real wind's load, fatigue (splaying, slack strands, slower hauls).
6. *Words are typed fast and phonetically.* "xease" was *seize*, "@6%" was *26%*, "ponde" was
   *blobs*. When a reading would change what goes live, ask once, plainly; otherwise act on the
   likeliest and show a picture.
7. *Show pictures; be plain about what is still wrong.* Night is always checked; day has
   repeatedly been the weak view (white on white): check day every time.
8. "Commit and push" for every push; never push before it. `main` is kept equal to `october`.

**Seeing it**: `~/.local/node/bin/node scripts/shoot.mjs "http://localhost:3000/?storm&hour=4.6&calm=0.5" /tmp/x 12`
(headless Brave; the app's browser pane stops drawing when hidden). `&hour=` sets the light.

## 12. The stilling (16 October, the strongest alone)

The owner: "I want myself, the strongest channeller on the boat, to stop every weather element at
will until it matches normal weather meteo conditions." The strongest is the owner ("they").

**At will.** `storm.json`: `"stilling": { "from": "2026-10-16T18:00:00+13:00" }` (an ISO time; null
is off), then commit and push. It takes whatever weather is on screen at that moment (the
channelled storm, the great calming as far as it had got, any `?pretend=`) to the measured weather
at the boat, then lets go: the storm is off, the menu row goes, the twelve come back over half an
hour, and the site follows Open-Meteo again with nothing more to push. To look without changing
anything: `/?storm&still=0.5` (half-way through), `/?still` (begins as the page opens, for that
visit), `/?still=off`. Any `&hour=` for the light. A private address that flips it from a phone
would still need a small store on Vercel, which only the owner can sign up for.

**How long.** The element furthest from the measured sets it (`stillingGap`, each measured
against the channelled storm's own figure, so the full storm is 1): the twelve took seven hours
over the storm, the strongest 1.8 times their strength takes 7 / 1.8, about 3.9 hours, for all of
it, in proportion for less, never under 15 minutes. Today's numbers: the full storm 3.9 h, what
the calming had left 2.9 h (the swell's period, 18 s against 10.7 measured, is the slowest
lever), a breeze 20 km/h too strong about 25 minutes.

**Each element by its own lever, in their own order** (`stilledConditions`, `STILLING_STAGES`
in `channelled-storm.ts`): they read it first (air, then water); draw the heat out of the rising
towers (the thunder goes first, then the downdraft gusts); the rain falls out of cloud already
made; the cloud clears low, middle, then the high anvil last; they fill the low (pressure rises,
and the wind, driven by its gradient, falls with the root of what is left; the barometer's trend
is the real rate of filling); the wind's sea dies a little behind the wind; the swell, which is
not the wind's here, is pressed out of the sea last, its height, period and direction moving
together. Where the channelled weather is weaker than the measured (after the calming the real
wind is the stronger), the same lever is let go instead. Everything ends exactly on the measured
figures. The sea keeps each wave's phase as its period changes (`phaseKept` in
`gerstner-waves.ts`), so the crests never race or jump; this also smooths the storm's natural end.

**The twelve stand back**, and say so in the code: they are spent from the calming, and this is
the strongest's own act; one channeller moving all the weather is what shows the 1.8. They let
go of the calming's link while the strongest reads, and their ordinary weaving rests until half
an hour after.

**Seen** (`stilling.ts`; white, 1,400 filaments in the sea weave, 1.8 times the twelve's hawsers
together): the reading, one long brushed rope out low, up to the cloud base and down into the
sea far ahead; then out of both hands a great loose roller of filaments along the edge of what
they have stilled, first along the cloud base, then on the sea. The stilled water opens from the
boat like a leaf whose sides leave the boat sideways and curve round to meet far ahead, slanting
across the view as it goes out and flung wide at the end; within it the sea is the stilled sea,
beyond it the old weather still, which piles against the roller and breaks white (`stillChunk` in
`gerstner-waves.ts`). They roll it out on a ten-second breath; gusts bow it back; it quivers under
the real wind. By day each thread is white over a soft sheath of the site's deep blue.

**Not yet right**: once the edge is beyond about three kilometres it is a band along the horizon,
nearly straight, and a small hump of the old sea shows where the leaf's tip is; the sky roller by
day is a broad pale band, more haze than threads; the reading still looks a little like a drawn
rope; nothing watched in motion, only stills at set points; never on a phone (2,660 more lines,
each 200 to 300 segments).

## 13. Leane cuts the rain off (16 October)

The owner: "Leane has cut the rain off using an innovative weave." Read as Leane · Kite, the most
air-minded of Leane's four, at the front just left of the viewer, alone, during the storm and the
calming. `rain-cut.ts` has the whole reasoning; `storm.json` `"rainCut": { "from": ISO }` (set to
the moment the owner said it); `/?storm&raincut=400` shows her 400 seconds in, `/?raincut` from
the page opening, `/?raincut=off` without.

- **The lever**: she leaves the cloud alone and cuts the rain's way down. Below the cloud she
  warms and dries the air, and the drops evaporate in it before they reach the sea, as virga does
  over a desert. The cost is latent heat, about 2.5 MJ a kilogram: the storm's rain asks some
  40 kW of every square metre kept dry, so her weave is a heater laid where the wind carries its
  warmth over the boat.
- **Seen**: two ropes out of her hands rise and run out upwind and across the wind; along them
  their filaments peel off one by one and stream downwind over the boat, level, some 40 m up,
  swaying like kites' tails (a canopy of warm thread, tamed air colour warming towards ember as
  she heats). The rain is drawn falling out of the cloud and thinning to nothing in the band below
  her canopy (`uCut` in `rain.ts`); the sea and the air round the boat are dry, the shelter before
  the channeller's eyes is put down.
- **The figures**: precipitation at the sea goes to nothing over three minutes; a rain code
  becomes overcast; thunder stays thunder. The rain above is still the storm's, and the drawn rain
  follows it.
- **Effort as heat**: her strain is the rain she holds off, through her eager temperament; hot,
  the threads shimmer; she sighs, the canopy billows and the rain comes a little lower for a
  moment; over the hours she tires and the cut sags lower.
- **With the stilling**: she is the one of the twelve who does not stand back. She holds the cut
  until the strongest has emptied the cloud (the rain above under about half a millimetre), then
  lets go, the cut running out along her ropes from her hands. At the storm's end likewise.

**Her act, now 88 seconds** (the owner, next: "It should take an extraordinary amount from Leane to do
this. Give her credit. Make her weaves shine like the moon, make the other flows around the water
stop because they impress the other channellers so much. She first cuts the rain and then she
begins to stop the waves. She almost burns out from all of this over 9 minutes"). It is now one
act, `leaneAct` in `rain-cut.ts`. First built as nine minutes; then the owner: "I want you to
be able to do this in 88 seconds", so `LEANE_HOLDS` = 88 s, every stage in its order and share:
- 0 to 32 s the rain is cut off, as above; from 35 s she turns to the sea as well:
  some of her threads come down off the canopy and lie out over the water, and the wind's sea
  (to a fifth) and the swell and the giant swells (to two fifths) sink round the boat, the calm
  water spreading out to 1.7 km, the storm's sea breaking white at its edge (`leaneConditions`;
  the stilling's `stillChunk` in the water, centred on the boat). The wind still blows: she stops
  the waves, not the weather.
- Her weave shines like the moon: silver light by night with a soft glow about each thread, a
  silver thread in a deepened sheath of her air colour by day; brighter the more she pours into
  it; a faint silver sheen on the water she has stilled (`stillGlow`).
- The twelve stop their own flows about the water and watch: the calming's hawsers and stitches
  hold still and dim by a third, their ordinary weaving rests, from the first minute to two
  40 seconds after she lets go.
- Her heat climbs all through towards burning out, eased a little by a sigh now and then; in the
  last twelve seconds her light gutters (slowly, never a flicker) and her threads fray and hang.
  At 88 seconds she has to let go: the storm is still there, so the rain comes back down out of
  the cloud within half a minute and the waves rise again over a minute, and she rests. (If what she did
  should hold instead, that is one line in `leaneAct`.)
- `/?storm&raincut=20` (the rain cut), `=60` (pressing the waves), `=84` (nearly burnt out),
  `=150` (let go).

Not yet right: her threads, seen from beneath, still run together into many long strokes across
the upper sky, a net more than a moonlit canopy; the ones coming down to the sea hang like
curtains; by day the sea under her is calmer but her light on it hardly shows; never watched in
motion, so the guttering and the sighs are unseen.
