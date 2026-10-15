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
