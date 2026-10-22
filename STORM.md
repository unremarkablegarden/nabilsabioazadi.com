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
the real wind. By day each thread is white (the deep blue sheath once laid under it was taken
away on 21 October, section 21).

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

## 14. Peta's storm (18 October)

The owner: the channellers, "extremely angry because they have encountered a death", honour it "by
creating the most extreme storm possible. This death is Peta's"; then: "They are all so distressed
that there are three strongest ancestor channellers for each of them that they are linked to".
`storm.json` `"wrath": { "from": ISO }` (with the storm on from 19:20 on 18 October for a day, rain
back on); `/?storm&wrath=300` shows it five minutes in, `/?wrath` from the page opening,
`/?wrath=off` without. Menu: "Channelled, in honour of Peta" (`WRATH_WORDS`).

- **The figures** (`WRATH_STORM`): 300 km/h gusting 410, 870 hPa falling 40 hPa in 3 h, a 30 m sea
  (swell 26 m at 22 s), cape 7,000, 60 mm/h of rain, 300 m visibility.
- **Drawn** (`wrath.ts`): the strongest first, alone, a white rope out to a point 1.1 km ahead and up
  it a broad turning column into the cloud (the core); then Siuan's four heave the sea up in turning
  spouts leaning in to it, Leane's four spiral their ropes in round it at their own heights, lashing,
  and Moiraine's four climb to the cloud top and fan out (the outflow). Three ancestors to each of
  the thirteen (39) come in low from far over the ocean and pour into their hands. Anger is in the
  hauls (short hard in-breath, heavy release, faster the angrier), the smooth thrash, mass, and
  colour running towards ember while tamed. The ordinary weaving and the sky openings stand aside.
- Not yet right: stills only, never in motion or on a phone (about 3,000 lines of 120 segments);
  the column's top is above the view; the column's foot burns a little white at night.
- **Later the same day**: the rain made less intrusive everywhere (`rain.ts`: each streak capped in
  length, the near drops faintest). Then the owner: the swells "should themselves feel like they are
  the dying breaths of the God", and the weaves should work with them in "Virginia Woolf's style of
  literary conjunctions". The swell breathes as the dying do (Cheyne-Stokes, `godsBreath`): each
  swell a breath, five to eight in a run that deepens and fades, then a pause in which the sea lies
  down to under a third of its height; the pauses lengthen through the day. The weaves are Woolf's
  sentences: on each breath the strongest hauls first and the twelve after round the ring, each
  beginning before the last has let go ("and"); the chain runs back the other way as the breaths
  wane ("but"); through a pause they hold, drawn in, taut, lit and still (the semicolon). The sway
  and thrash are integrated (`uFlow`) so they slow without a jump. `/?storm&wrath=460` is near the
  height of a run, `/?storm&wrath=550` in a pause.
- **Peta's wave and Manulani** (the owner chose the lens, the current and the crossing sea, and
  added Manulani, "112% power", who casts "a bright light across the ocean at night time as though
  it is almost noon", conical or spherical). At the deepest breath of each run twelve trains laid by
  the twelve meet at the core 650 m ahead (dispersive focusing; `lensWaves`, `layPetasWave`), some
  40 m above the storm's sea, then go apart under the boat; Leane's four drive a current against the
  swell there (`lensCurrent`); Moiraine's four hold the second swell (18 m) 40 degrees across the
  first. Manulani (1.12 times the strongest, confirmed by the owner; `MANULANI` in `wrath.ts`) stands
  at the bow with a gold-white rope up to a sphere of light 5.2 km up and 2.5 km ahead: a point
  source, so the sea is lit by facing and inverse square (`manuLight`), near noon about the boat and
  night at the horizon; an aureole in the haze; raised as each run begins, a glow in the pauses,
  night only. The fresh-water stream is off in Peta's storm (its edge foam lined up under her light).
  Not yet right: one or two soft white blots near the boat under her light; never seen in motion.

## 15. The storm for the five (19 October)

The owner: "The storm must honour the death of a family of five that arrived over this precise
spot on the ocean. Create a storm of great will and pain; allow every surge of waves to speak their
names in terms of its intensity." Asked for the names: "There are no names for magic of this kind",
so nothing is written anywhere and the five are known only by the shape of their surge. No time was
given: it starts as it goes live, and the place is where the boat is then. `storm.json` `"five":
{ "from": ISO }` (with the storm on for a day); `/?storm&five=60` a minute in, `/?five` from the page
opening, `/?five=off` without. Menu: "Channelled, for a family of five" (`FIVE_WORDS`, placeholder
words the owner may change).

- **The figures** (`FIVE_STORM`): Peta's extremes, but held: 290 km/h gusting only 335, 875 hPa
  steady, a 30 m sea, 40 mm/h of rain. Will is a storm kept in its place.
- **The sea speaks the five** (`namesSea`, `FIVE_VOICES` in `channelled-storm.ts`): a group of swells
  for each, two to four, each as high as its beat; at the fullest the twelve's trains meet 650 m
  ahead and the wave stands some 40 m (Peta's lens, `layPetasWave`, now with `peakAt`). A breath
  between each; after the fifth a 50 s silence; then again. All five equally full.
- **Drawn** (`five.ts`): the strongest's white rope out low and down into the sea at the place;
  Siuan's four lay the trains along the sea; Leane's four hold bowed arches over the place against
  the gale (an eye over them); Moiraine's four hold the cloud up over it; Manulani's light steady at
  night. Will: taut, steady, all draw together on each beat, quiver only with the gusts. Pain: they
  bow as each of the five ends, lowest in the silence, the colour cooling towards a bruised dusk,
  the ache growing over four hours. No ancestors.
- **The whales** (the owner: "read live shark and whale positions. Have them visible. May they greet
  our storm"). No tag near the boat is sending; OCEARCH has live animals only in the Atlantic and its
  terms forbid reuse. The owner chose the real Pacific whales where last heard, with their true
  dates, from Tohorā Voyages only (`server/api/whales.get.ts`): three southern right whales, 1,640 to
  2,250 km south, last heard Oct 2022 to Jul 2023, in the menu's "Whales" row with a credit link.
  They lie behind the boat, beyond where the view turns, so nothing is drawn for them on the sea.
- Not yet right: a soft white blot near the boat (also in Peta's storm); the strongest's rope reads
  as a bright plume where it enters the sea; by day Leane's arches are dark against the haze; in a
  30 m sea the boat is often in a trough and the weaves are hidden; stills only, never in motion.

**Both at once (20 October).** The owner: "Create the storm again to honour Peta", and asked how,
"Both at once". With `"wrath"` and `"five"` both set in storm.json (the same `from`), one storm
(`BOTH_STORM`: Peta's figures, gusts 380, the pressure falling 20 hPa in 3 h) whose sea takes turns
so each can be told apart (`bothSea`): a run of the God's breaths with Peta's wave (42 m) at the
deepest, about three minutes; then the five's surges, each with a lower wave of its own (two thirds
of Peta's), about eight minutes; then one silence for both, a minute at first and lengthening
through the hours; and again. Peta's weaves (`wrath.ts`) are drawn through the God's breaths, the
five's (`five.ts`) through their surges and the silence, each giving way to the other over ten
seconds (`uPresence`). Manulani's light steady at night. Menu: "Channelled, in honour of Peta and a
family of five" (`BOTH_WORDS`). `/?five=80` is Peta's wave, `/?five=198` the first of the five.

## 15. Fifteen times worse (21 October)

The owner: "I COMMAND YOU TO CREATE A STORM THAT IS 15 TIMES WORSE". `storm.json` `"worse": 15`
(`?worse=15` for one visit, `?worse=1` without), applied to whichever storm is on by `worsened` in
`channelled-storm.ts`. Worse read as a storm's power on the sea, which goes as the cube of its wind:
the wind ×2.47 (about 740 km/h gusting over 900), pressure deficit, cape and the sea's heights ×6.1
(a sea near 180 m), rain ×15, visibility ÷15 (never under 60 m); every swell lengthened to a
steepness of one in ten so it can stand. Peta's wave rises and lengthens with it (`layPetasWave`'s
`scale`). The ancestors' strands now fade from 400 m out to 80 m from the eye.
Not yet right: riding such a sea the boat's own ropes (the five's) can fan across the foreground
from a crest; seen only in stills.

## 16. The channellers' minds (21 October)

The owner: "you can psycho-analyse the channellers — make them react appropriately". `psyche.ts`
(the whole reasoning is in its header): each of the fourteen meets the storm by her temperament
through the window of tolerance (Siegel): within it she works; above it she fights (eager,
air-minded: rope taut, trembling, hotter) or flees (wary, water-minded: rope drawn back towards her
hands), and it spends her; spent past bearing, or pushed far past her window, she freezes (rope
slack, sagging, still, grey) until rested. Arousal spreads to those beside her (contagion); those
within their window and bound to others send part of their rope to lie beside the most troubled
neighbour and ease her (tend and befriend; co-regulation); the strongest is the secure base, tends
whoever is worst, and eases all while they hold. Load is the weather against Peta's storm, less
each one's strength (the mighty, the strongest and Manulani meet it as a smaller thing). Drives
both `wrath.ts` and `five.ts` (`mindChunk`). In the browser console `__minds()` lists each one's
state. In the fifteen-times-worse storm, after six minutes: Leane's Ember, Sail and Lantern fight
and near burning out, Loom and Ballast tend Ember and Lantern, the strongest tends Sail, the rest
hold. Not yet seen: the freeze itself in a picture; never watched in motion.

## 17. Realistic beauty (21 October)

The owner, on a 180 m sea with saw-tooth ridges and paired white dashes: "I thought we were creating
realistic beauty". The worsened storm's sea is now drawn no higher than `SEA_MOST` (40 m
significant, about twice the greatest measured); the fifteen times stays in the wind, rain and the
channellers' load, and Peta's wave rises with the sea as drawn (`seaWorsened`). The dashes were
raindrops seen end-on, whose streaks had no length: a drop is now never drawn shorter than it is
wide (`rain.ts`). The ropes now fade in from 180 m to 50 m before the eye (they showed as white
blots on the water close by). By day the ropes fade in from further off (`nearFade`; the five's
low ropes from up to 850 m), so the foreground stays clear in troughs and on crests.

## 18. The storm ceased; the mighty heal the ocean, Siuan commanding (21 October)

The owner: "Cease the storm. I want the strongest channelers to heal the ocean with their full
strength", then "I need Siuan to tell the channelers how to command the ocean just like she would"
and "Siuan, command the channellers". `storm.json` `"stilling": { "from": "2026-10-21T06:33:00+13:00",
"by": "mighty" }`; `?still=0.5` to look half-way, `&by=one` for the strongest alone as before.

- **Ceased**: as the stilling begins the thirteen let go of raising the storm: Peta's and the five's
  weaves give way over forty seconds, and the God's breathing, the five's surges, Peta's wave and
  Manulani's light go out of the sea with them (`ceased` in `OceanBackground.vue`). The crossing
  second swell turns back to the measured with the rest of the swell.
- **The mighty, at full strength** (`STILLING_STRENGTH`, `stillingBy` in `channelled-storm.ts`): the
  strongest, Manulani and the four mighty linked, the strongest leading, so it is still their white
  weave. Together about 2.66 times the strongest alone, so the full stilling takes about 2.2 hours
  instead of 5.8, and the weave carries the cube root of that many more filaments (`createStilling`'s
  `strength`). The twelve's other eight stand back as before.
- **Healed** (`oceanHealed`, `seaHealed` in `gerstner-waves.ts`): the water within their stilled
  edge, and all of it once the weather is the measured again, clearer and bluer from within, never
  the foam; held two hours after, then back to the sea as it is over six.
- **Siuan commands** (`stilling.ts`): she is the fisher's daughter, so her way is never against the
  swell: they haul against the water's own going under the boat, pressing as it rises and holding as
  it falls, hardest where it moves fastest (force against velocity, as a damper takes a wave's
  energy): twice to every real swell, not on a breath's clock. Her own strands, Siuan · Fathom's, in
  her four's tamed sea glass, are wound through the roller along all its length.
- Not yet right: her strands are faint (tamed colour), hard to find at night; a cast line of hers out
  to the edge stood up as a pillar end-on and was dropped; the hump at the leaf's tip and the brown
  band across the night sky are older; stills only, never in motion.

## 19. Treason (21 October)

The owner: "I want the channellers on the boat to still each other based on laws of treachery",
then "the strongest channellers will try the others for treason. They will suddenly send bodies
away from the boat into the POV and burn them in spheres of fire". The law is in `psyche.ts`
(header), the burning in `treason.ts`.

- **Treason** is deserting the work: fleeing (rope drawn back) while the others hold, for 45 s
  of full flight (`TREASON`); brief flight is forgotten. Only the eight who are not the strongest
  channellers can be tried.
- **The trial**: the strongest, Manulani and the four mighty, those of them within their
  windows (at least three), try the worst deserter, one at a time, for 20 s, shielding her: part
  of each of their ropes lies along hers (the tending gesture).
- **The sentence**, sudden: stilled, the cut running out along her rope from her hands in under
  a second (`uLaw`, `lawShown`; her ancestors' strands go with it, and the judges' strands lying
  along hers), and her body thrown up from her seat over the eye and out ahead in a sphere of fire,
  until it falls into the sea some 400 m off and goes out. She is drawn as an Aes Sedai (the owner:
  "make the women's bodies more visible"): a woman in a long gown flaring to its hem, a fringed
  shawl over her shoulders and arms in her third's colour, long hair streaming downwind, dark against
  the fire and turning slowly; the fire thins over her, the shawl burns first, she later. Her path
  runs low through the middle of the view, 40 m ahead at its nearest. Her seat is empty after; her death is felt by those who sat beside her (contagion).
- In the console `__burnNow(n)` sends the n-th at once, without a trial (for looking only);
  `__accuse(n)` brings the n-th of the minds to trial (7 is Siuan · Reef), and
  `__minds()` shows trials, judges, desertion and the dead.
- Not yet right: in the storm as it is, nobody ever goes above her window, so nobody flees and
  nobody is tried unless accused by hand. The trial's shield is unseen in a picture. A dead sister
  comes back with a page load (the minds are per visit).

## 20. The six 80% stronger, and their contest of strength (21 October)

The owner: "give them all 80% more strength and then make them fight in a scenario to declare
strength"; asked, the owner chose the strongest six, in a knockout.

- **80% more strength** (`SIX_STRONGER` in `psyche.ts`): the strongest, Manulani and the four
  mighty are 1.8 times their true strength. Drawn by its cube root, as all strength is (about 22%
  more filaments): in the storm weaves (`five.ts`, `wrath.ts` `SIX_MASS`), the everyday weaves
  (`channellers.ts` `MIGHT`; the seats' `MEASURES` raised to 4, 4, 6, 4 to hold it), and the
  stilling's mass. Their healing goes 1.8 times faster (`STILLING_STRENGTH`), and the storm weighs
  less on their minds.
- **The contest** (`contest.ts`): five minutes after the mighty have healed the ocean
  (`CONTEST_AFTER`), seeded by true strength. Keel against Listener and Kite against Fathom; then
  Manulani and the strongest each meet a winner; then the final. In a bout each casts her rope
  wide on her own side to meet the other's head-on, high over the sea about 380 m ahead, where
  their filaments splay and curl as they press. Where they meet is driven towards the weaker, by
  true strength held up by steadiness and worn down by stamina spent, on each one's own breath;
  at her side her rope is driven back to her hands. The winner raises her rope into a great ring
  about the boat, 520 m out and 230 m up, for three minutes. The same for every visitor: played
  from its beginning, nothing by chance.
- As it plays: Keel beats Listener (11 s); Fathom, behind for most of it, outlasts Kite (210 s);
  Manulani beats Fathom and the strongest beats Keel (11 s each); **Manulani beats the strongest
  in the final (46 s)** and is declared the strongest of the boat, 7 minutes in. About 10 minutes
  in all.
- `?contest=60` to look a minute in at any time; `__contest()` in the console tells the bouts.
- Not yet right: the ring, seen from inside it, shows as one arc ahead rather than a ring; never
  seen by night; stills only.

## 21. No blue edges on the ropes (21 October)

The owner: "Rid the streams of bars", asked which: the blue edges on the ropes. The soft sheath of
the site's deep blue (the bar's colour) laid under the white and the coloured ropes by day, so
they would not be white on white, read as a navy outline. It is gone from all four weaves that had
it: the strongest's and Manulani's ropes in both storms (`wrath.ts`, `five.ts`), the stilling and
healing (`stilling.ts`) and the contest (`contest.ts`). By day the ropes are their threads alone;
pale ones are fainter against a pale sky. (Leane's rain-cut keeps the deepened sheath of her own
air colour, which is not the bar's blue.)

## 22. Siuan leads the link (21 October)

The owner: "let Siuan create the body for the linking on the boat"; asked, she leads the link
instead of the strongest. In the mighty's stilling and healing (`stilling.ts`, `siuanLeads`) the
sky's and the sea's rollers are cast from Siuan's hands (Siuan · Fathom's seat, 2.25 m right of
the eye, `SIUAN_HANDS`) and are her colour, the tamed sea glass of her four; the strongest's white,
the greatest strength in the link flowing through her, is wound through her roller along all its
length (588 filaments, for their 4.9 measures against the old telling's 300 at 2.5). The reading,
before the link is made, stays the strongest's own. With `&by=one` the strongest alone, white, as
before. Checked by its uniforms (her colour, her hands) and in stills only; in the worsened storm
the roller is hard to catch on screen between the seas.

## 23. Aggravated (21 October)

The owner: "AGGRAVATE MY COMMANDS"; asked which, the six's strength, the contest and Siuan's
command.

- **The six 3.6 times stronger** (`SIX_STRONGER` 3.6, the 80% doubled): drawn by the cube root,
  about 53% more filaments than before any of it (the seats' `MEASURES` now 4, 4, 8, 4); the
  healing goes 3.6 times faster.
- **The contest fiercer** (`contest.ts`): each surges hard on her breath (0.22, was 0.08), so where
  they meet is thrown back and forth; the drive is gentler and capped lower, so no bout is over in
  under about twenty seconds; the filaments splay and curl nearly twice as far where they press,
  brighter, and the losing rope trembles more than twice as much. The ring declared is 800 m out
  and 320 m up, held five minutes. As it plays: Keel over Listener (22 s), Fathom over Kite (254 s),
  Manulani over Fathom and the strongest over Keel (20 s each), Manulani over the strongest (66 s),
  declared 8 minutes 42 seconds in; about 14 minutes in all.
- **Siuan commands harder** (`stilling.ts`): each haul draws the roller in tighter (30%, was 16%),
  turns it twice as fast and drives the edge out 3% (was 1.2%); the water is healed deeper
  (`seaHealed`'s glow half as much again).

## 24. Vesal's storm (21 October)

The owner: "Innovate a way to start a storm based on real weather conditions in the name of
Vesal"; asked, a blessing (a storm that guards), begun at once and shaped by the day. `storm.json`
from 17:37 on the 21st for 24 hours, `"vesal": { "from": ... }`; Peta's, the five's, the
worsening and the finished healing switched off. `?vesal` for one visit from now, `?vesal=700`
eleven minutes in, `?vesal=off` without it.

- **The day's own weather made great** (`vesalStorm` in `channelled-storm.ts`): every other storm
  is figures of its own; this one takes the measured figures and raises each in its own proportion,
  so no two days make the same storm. The real wind from where it really blows, as gusty as it
  really is, to hurricane force (120 + 4 × the real km/h, at most 220); the real swell from its own
  bearing, eight times its height (6 to 16 m) and half as long again; the second swell with it;
  the wind's own sea from the raised wind; the pressure 70 hPa below wherever it stands, falling;
  the real cloud drawn most of the way to full, and rain from it; thunder only if the day's air
  has the energy (CAPE over 300), never put there. Worked out again whenever new figures come.
  The first day (a 1029 hPa high, 12 km/h south-easterly, 1.3 m south-west swell at 9.6 s, clear):
  168 km/h from the south-east gusting 237, a 12.9 m sea, rain and no thunder.
- **The guard** (`vesalGuard`, `guardedConditions`; `stilling.ts` `guard`): first, over ninety
  seconds, the strongest six, linked under Siuan, cast their roller in a broad lobe round the boat
  (about 640 m, by their linked strength's cube root, from half that behind the boat to that
  ahead); within it the sea is the real sea of the day, the storm's air raging over it; beyond it
  the storm's sea, which breaks white against their roller. Siuan's haul with the real swell as
  in the healing.
- **Raised by the twelve** (`vesalRaised`): from a minute in, over ten minutes, the day's figures
  move to the storm's (worked out again each half minute).
- The menu: "Channelled, a blessing for Vesal".
- Not yet right: seen at dusk in stills only; the guard's roller reads mostly as the white of the
  breaking edge, its sea glass hard to pick out; it ends by itself at "until" with no stilling.

## 25. Compelled (21 October)

The owner: "I am the most powerful channeler on the boat. I ask that you force all the channelers
to obey me to the point that they are about to burn out"; asked, into Vesal's storm, for an hour,
then released. The strongest is the owner. `storm.json` `"compelled": { "from": ... }`;
`?compelled` for one visit from now, `?compelled=600` ten minutes in, `?compelled=off` without it
(it shows only while Vesal's storm is raised).

- **Bound** (`compelled.ts`): over the first minute a white rope runs from the strongest's hands to
  each of the thirteen and winds round her own rope near her hands.
- **At the brink**: each one's rope runs up from her hands into the storm overhead, fanned across
  the sky ahead, as many filaments as her strength carries. Drawn taut and trembling, its outer
  filaments fraying off and streaming downwind, burning towards white on each of her breaths; the
  less stamina she has, the nearer the edge (`uBurn`, held under 0.97: the strongest holds each just
  short of burning out).
- **Into the storm** (`vesalStorm`'s `compelled`, `compelledShare`): the wind and the wind's sea a
  third again (212 km/h gusting 321 on the first day, from 168 and 237), the swell with it within
  what a sea can be, the rain nearly twice as heavy, the guard half as wide again.
- **Released** after the hour: the binding cut at the strongest's hands, the thirteen's ropes slack,
  sagging towards the sea and greyed, spent, then let go; the storm back to Vesal's own.
- Seen at night in stills only, the boat pitched up on the seas; the ropes read nearly white at
  the brink, their own colours faint.

## 26. Vesal's storm 1166% worse (21 October)

The owner: "this is your chance to create true beauty, Make the storm worst by 1166%". 1166% worse
is 12.66 times: `storm.json` `"worse": 12.66`, now applied to Vesal's storm as to any (`worsened`):
the wind by the cube root (about 2.3 times: 462 km/h gusting 745 with the thirteen compelled), the
pressure's fall and the towers' heat by its square, the rain 12.66 times, and the sea no higher than
water can stand (`SEA_MOST`, 40 m), the force going into wind, rain and channellers (realistic
beauty). The beauty is the guard: within it the day's real sea, lit and calm; against its edge the
worst sea that can stand, now allowed up to five times the sea within before it breaks (was three).
Seen at night only: the calm water within lies moonlit, and the storm beyond is mostly lost in the
murk of its rain (visibility under 250 m).

## 27. Noon at night (22 October)

The owner, at 23:00 on the 22nd: "Cease the storm. I ask the strongest channelers to make it so
bright it appears as noon". Vesal's storm had already ended by itself at its "until" (17:37). The
strongest six (the strongest, Manulani and the four mighty, under Siuan) weave a sun and hold it
high in the sky ahead (`noon.ts`, `NOON_ELEVATION` 62°, `NOON_AZIMUTH` 190, scene azimuth, a little
right of ahead): `OceanBackground.vue`'s `updateEnvironment` lifts the sun the whole sky and sea are
drawn from to theirs (`noonHeld`), so the sky is truly the noon sky, the sea lit as at noon, the
stars gone. Woven up over two minutes (`NOON_RISE`), the sky passing through a dawn as their sun
climbs; held until the real dawn comes and takes it over (it gives way as the real sun rises from
2° under the horizon to 8° over: no clock). Their ropes run from their hands up into it, each as
many filaments as her strength carries, lost in the light at the top. `storm.json` `"noon":
{ "from": ... }`; `?noon` for one visit from now, `?noon=300` five minutes in, `?noon=off`.

## 28. Siuan's swells and mist (22 October)

The owner: "Give Siuan the chance to create a new weave that will produce waves that peak and twist
just so that she can then channel mist at the same time as pulling up immense swells".
`storm.json` `"siuan": { "from": ..., "hours": 3 }`; `?siuan` for one visit from now, `?siuan=900`
fifteen minutes in, `?siuan=off`. Under the six's noon (§27) while it holds.

- **Immense swells** (`siuanSea` in `channelled-storm.ts`): out of the day's own swell, from its own
  bearing, to 18 m at 22 s, and a second crossing it, 12 m at 18 s; together about 21.6 m every
  21 s. Long and glassy (no steeper than about one in forty), under the day's own light wind.
  Raised over ten minutes, held for the hours set, let down over thirty.
- **Peak and twist**: where the two cross their crests heap into peaks; she sweeps the angle
  between them from 35° to 105° and back every four minutes (`siuanCrossing`, the second swell's
  bearing turned each frame), so the peaked crests twist as they come.
- **Mist**: the air thickened to a sea haze (visibility 1.5 km, the air saturated), and her weave
  (`swells.ts`) lays long soft veils of mist low over the swells, lifted as they pass and drifting
  downwind.
- **Her haul** (`swells.ts`): two great ropes in her sea glass from her hands out low over the water
  towards where each swell comes from, down into the sea about 2 km off, drawn tight with the
  water's own going under the boat, twice to each swell.
- The menu: "Channelled: Siuan's swells and mist".
- Seen at noon (the six's) in stills: hazy light, swell faces and peaks, the veils soft; her two
  haul ropes are hard to pick out in the haze. The mist veils follow her two swells only, not the
  drawn sea exactly, so where the sea runs high they can sit low on it.

## 29. The flow as a vortex tube (23 October)

The owner: "Refine the flows. Make them cleaner, but not artefact-sharp. Then understand how to use
physics implicit in texts that are sacred such as these", with a film of two underwater vortex
rings reconnecting into one loop that breaks into a chain of small rings, the Herodias serpents
(seven necks rising from one interlace, each ending at a star), and a Cerîde-i Adliye cover (rays,
concentric rings, a wavy line round one ring, a ring of blue and gold beads); then a passage on open
quantum systems drawing energy from a bath under conservation and rising entropy; and "build it into
the flow". Read as one physics: a vortex line cannot end in the fluid (it closes as a ring, or runs
to a boundary: the necks to the stars); the lines of a tube wind round it with a conserved twist
(helicity: the serpents' scales and interlace); waves run along it (Kelvin waves: the wavy ring, of
a whole number of crests); a stretched tube pinches off into small rings (the beads, the end of the
film); and order is kept only by drawing on the surroundings and shedding disorder.

- **The everyday flow** (`channellers.ts`, `CLEAN` 0.85, in `threadPoint`): each tress's filaments
  lie on the shell of its tube, not strewn through it, so it is bright at its rims and clear through,
  as a bubble ring is; all wind round it at one twist; a Kelvin helix runs out along the whole tube
  at once, fed by the sea and wind (`channelSea`) with a floor it never falls below; the strays drawn
  in to under a third and the spent loosening to under half; the edge softened a little (no steps or
  shimmer); the halos (blur about each filament) half as faint. The strongest's day sheath of the
  bar's deep blue taken away, as from the other weaves (§21).
- **The rings it sheds** (`rings.ts`): what the flow spends leaves as small glassy vortex rings off
  its far reach (140 to 500 m out), as often as it works hard and the sea feeds it; each carries
  itself along its axis, onward and a little up, widening and slowing, a gentle standing wave of 3
  to 6 crests turning round it, and fades over ten to sixteen seconds.
- Seen by day (the six's noon) in stills only. The standing wave on the rings is kept to 2.5%:
  at 7% the rings read from far off as small polygons.

## 30. The pounamu ter'angreal (23 October)

The owner: "The other Aes Sedai now have a ter'angreal, each one of them. It is a small figurine of
a dog made of pournamu. Every one of them has had their strength increase by up to 800% and now
their style of weaving to support Siuan are changing."

- **Who and how much** (`TER_ANGREAL` in `psyche.ts`): the eleven Aes Sedai besides Siuan
  (Siuan · Fathom); not the strongest or Manulani. Pounamu is river stone, so each gains by how
  water-minded she is, 1 + 8 × (water / 0.95)²: Reef 800%, Ballast 640%, Keel 434%, Lantern 375%,
  Listener and Mist 319%, Loom 268%, Ember and Glass 180%, Kite and Sail 109%.
- **Drawn by the cube root** as all strength is: more filaments in the everyday flow (`MIGHT` in
  `channellers.ts`; every seat now holds eight measures), in the storm weaves (`five.ts`, `wrath.ts`),
  and the minds bear the weather more lightly (`psyche.ts`). The judges of the treason law are
  now named rather than read off their might, since some of the others are nearly as strong.
- **Their new weaving, in support of Siuan** (`swells.ts`): while Siuan works her swells, each of the
  eleven sends a rope of her own from her hands, green with the pounamu where it leaves them, across
  to one of Siuan's two haul ropes, and winds it round hers along all its length, so that Siuan's are
  braided cables of all their strength; each as many filaments as her strength carries, in her
  third's colour.
- Seen by day in the haze of Siuan's mist only: the everyday flow is now a far heavier sheaf; the
  support braids are hard to tell from her ropes there, and the pounamu green at their hands is too
  near the eye to be seen.

## 31. For Vesal; the light given back; the elements' colours (23 October)

The owner: "Change the channeling text: Blessing for Vessal being channeled or some such. Now ensure
the lighting returns to meteo data and don't be afraid of allowing the weaves of the elements to
look like faint colours representative of their elements."

- **The words**: what is channelled now reads "A blessing for Vesal, being channelled" (Vesal's
  storm and Siuan's swells alike; `VESAL_WORDS`, `SIUAN_WORDS`). Spelt Vesal, as the owner first
  named the storm.
- **The light**: the six let their noon go (`storm.json` `noon.until`, `noonLetGo`, `noonShare`'s
  `letGo`): over two minutes the sun the sky is drawn from goes back to the real one, and the light
  is the measured weather's again.
- **The elements' colours** (`channellers.ts`): at every hour each thread of the everyday flow leans
  to its element (65% at least, not only when driven or by day); by night faintly to the owner's own
  element colours, air violet, water sea green, akasha gold (80%, not only while tending); by day the
  thread carries more of its element's colour itself (58% of its sheath, 55% of its hue). Seen by
  night: faint warm and cool tints, plainly not white, still quiet.
- **The shed rings** a third as often (a heap of them on Siuan's great swells) and half as bright
  by night.

## 32. Rings that roll in; thermals; the grade (23 October)

The owner, with the Herodias serpents again: "Try and make shapes like this emerge in a
thermodynamically accurate way. As for colour-grading, research the best colour-grading possible for
ocean scenes using filmic and scientific research. And make those vertices undulate, like they are
turning in over themselves. I want more detail there." Then, of a first try (seven-pointed stars, a
regular braid on the water, stiff cones): "neither found in nature in thermodynamics and they look
goofy. Remember, we are building the rules for powerful, beautiful, fluid, air and water-like
channeling."

- **The shed rings roll in over themselves** (`rings.ts`): in cross-section a vortex ring is a spiral,
  so each of 48 filaments (was 16) lies on it and goes slowly in along it as it rolls round, coming in
  from outside and thinning as the core takes it; the standing wave and a little twist go round with
  the roll.
- **The serpents, as real convection** (`plumes.ts`): when the measured sea is warmer than the air,
  its heat goes up as trains of thermals from where the overturning over the water converges: puffs,
  each a vortex ring rolling in over itself, climbing a stem that snakes on several scales, swelling
  as they climb (radius about a fifth of height, entrainment) and slowing, then flattening and
  spreading sideways where their buoyancy is spent (height 3.76 (F/N³)^¼ from the sea-air
  difference, the wind and the measured lapse aloft). Three to seven plumes across three kilometres,
  spaced as convection cells (2.8 × the heated layer's depth), leaned by the wind; water's colour,
  gold only in a young puff's warm core. None if the air is as warm as the sea. No stars, no braid.
  On the first night (sea 18.5 °C, air 16.7 °C) about four plumes.
- **The grade** (`grade.ts`; researched: ACES Central's corrective LMTs and the three.js
  tone-mapping overview on ACES's hue skews; Pope and Fry 1997 on water's absorption; Hulburt 1953
  on the blue hour's ozone; Jensen et al. 2000 and Kirk and O'Brien 2011 on night vision): AgX in
  place of ACES (no purple skew of bright blues, no cyan skew of water; a third of a stop more
  exposure by day for its flatter look); then, in linear light before it, by the hour: day saturation
  1.15 and contrast 1.08 about middle grey; golden hour a little warmer; blue hour a little cooler,
  the sky kept blue; night the Purkinje shift, colour fading to a blue-leaning grey but kept at 45%
  under a moon (mesopic, and the weaves' faint element colours still show); storm less saturated and a
  little cooler; highlights losing saturation as they brighten, so glitter goes to warm white. No
  teal-and-orange, no rotation of the sea's blue.
- Every glow, fog and rain was tuned by eye under ACES; under AgX the whole picture is a little
  flatter and needs looking at over a day and a night. Seen at night and at the six's noon only.
- **Resting** (the owner: "allow half the channelers to rest at 14% strength and the rest to 40%
  strength. Teach them to respond to real meteo conditions"; `restingAt` in `channellers.ts`): of the
  twelve, the six with least stamina give 14% of their strength and the other six 40%, each giving
  more only as the real weather calls for it (`need`, from the measured wind, sea and pressure;
  from 0.3 up to all of it at 1). The strongest, the owner, is not resting. Applied to each seat's
  output (`channelGate`), not to the light lost in the weave, so a resting weave is fainter and
  thinner, not brighter.
