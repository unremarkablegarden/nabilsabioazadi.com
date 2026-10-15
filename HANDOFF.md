# Handoff: the October version (written 12 October 2026)

This file is for whoever picks the site up next, person or AI assistant. It says what this
version is, where it is kept, how to run it, what was last worked on, and what is unfinished.
The README's "Notes for Claude Code" section has the detail on how each part works; read the
entries on the channellers there before touching the weaving.

**For the weaving itself, read `WEAVES.md` first**: one weave at a time, what each follows, how to
see it, and the one the owner singled out on 12 October.

## Where things are kept

- `~/Development/nabilsabioazadi.com`, git branch `october`. `main` is kept identical to it.
- GitHub: `unremarkablegarden/nabilsabioazadi.com` (the friend Olle's account). Both `main` and
  `october` are pushed there; Vercel builds the live site, nabilsabioazadi.com, from `main`.
  Latest commit when this was written: `86f1d49`.
- September's version is untouched on the local-only branch `storm-weave`.
- To commit and push (the owner asks for this each time, in the words "commit and push"):

  ```bash
  git add -A && git -c user.name="Nabil Sabio Azadi" -c user.email="nsa@nabilsabioazadi.com" commit -m "…" && git branch -f main october && git push origin october main
  ```

- To see the site locally: start the dev server named `site` (port 3000; `~/.bun/bin/bun run dev`),
  then open http://localhost:3000. Node is in `~/.local/node/bin`, Bun in `~/.bun/bin`; neither is
  on the owner's PATH.

## What this version is

- **A voyage.** The viewer is on a small boat that left Manawatāwhi (the Three Kings Islands) on
  10 October 2026 and reaches Honolulu on 1 July 2027, always facing Hawaiʻi. It is a pilgrimage.
- **The sea and sky as they are**, from live forecast data for the boat's position (Open-Meteo,
  four models blended): real swells, wind, cloud, rain; real sun, moon, stars, planets, Milky Way.
- **Thirteen channellers** on the boat, weaving. Four are at the front at a time; the others rest,
  take turns, sound the water, or weave deep round the boat to slow it.
- **The site**: Klein Blue top bar, moon-edged menu, About, Contact (a letter that opens the
  visitor's own email program), newsletter (Kit form 10030693), GA4, favicon.

## The weaving: the rules now in force

All in `app/utils/channellers.ts`, `app/utils/channel-path.ts`, `app/utils/gerstner-waves.ts`,
`app/utils/manawatawhi.ts` and `app/components/OceanBackground.vue`. The README explains each.

- **They are pilgrims, and what they channel is for the well-being of the ocean and the air**
  (the owner, 12 October, on seeing lightning-like wires: "They are not trying to electrocute the
  air or water!"). Nothing in a weave may be jagged, flicker or strike. September's weave to the
  knot in the sky was what looked like lightning; it now shows only at `/?look=september`, in the
  story ("play"), or when its dev slider is moved.
- **They are always tending, moon or no moon** (the owner, 12 October), and it is to be elegant,
  "Odyssey-like": read here as unhurried, long clean lines, the four fanned like a lyre's
  strings, coming together and parting like a crew's oars. Only dawn and dusk (all thirteen
  linked) and storms are otherwise. The old night story (`tell`) is no longer reached, and the
  boat's lamps never come on now, since some weave is always out.
- **How they tend** (`tend` and `readingPoint` in `channellers.ts`; the owner, 12 October: "it
  should feel like there are individuals reading the weather", then: each act its own form, and
  each tied to what is really there). Each of the four at the front does their own reading in
  their own time, lets go (the cut runs along the form), rests a few breaths, and takes up
  another. Who reads what is in their temperament.
  - **Pressure**: a stem up into the air that opens level at its top and settles, like a held
    breath. From `pressureTrend`: steady, a flat disc; falling, lower with a drooping rim and
    greyer; rising, higher with a lifted rim and golden. 1.5 hPa in three hours counts as fast.
  - **Wind**: a stem up at a slant whose filaments stream off the way the real wind blows, long
    and flat in a strong wind, short and drooping in a light air, torn at their own lengths,
    more raggedly in gusts.
  - **Water**: out low on one side, under the surface, back on the other, loosened and in the
    colour of what it found (`thermal`: sea warmer than air rose-gold, colder violet, alike
    aquamarine); the current carries its far end.
  - **Healing**: every 12 to 22 seconds they link for 6 to 9 seconds; the one flow keeps low and
    sinks into the sea about 100 m out, and the water there turns a little bluer and glows
    faintly, spreading and fading over some minutes after they let go (`healed`, up to four
    places, `channelBalm`, `channelBalmGlow`).
  - **No corners** (the owner: "too angular... in how they heave in the early step from the boat.
    Weaves are rarely so angular"). A sky reading is cast out low and a little wide of its mark,
    runs along over the water and comes round and up in one curve, and what it opens into at the
    top has already begun to open before it arrives (`thrown`, `bend` in `formPoint`). Do not
    name a GLSL variable `cast`: it is a reserved word and the shader silently fails.
    A turn is a curve as well: a point goes from its old place to its new by way of a place low
    over the water ahead of the boat (`arced`), never straight across.
  - **Nothing runs to a clock** (the owner, 12 October: "too loopy and repetitive instead of
    responsive to actual wind, wave, air, air pressure etc data"). `sense` and `hears` in
    `channellers.ts`. Three things "call", 0..1: the wind (force, gust factor, and each gust as it
    comes), the pressure (how fast the barometer moves; 3 hPa in three hours is full), the water
    (each set of higher waves passing under the boat, measured from the drawn sea itself; the
    heat between sea and air; the current). One of them turns to whatever calls loudest for their
    temperament that nobody else has, holds it while it is loud, lets go when it is quiet. What
    nobody has read for some minutes is glanced at once. When nothing calls they sit: on a still
    day only the strongest weaves. How many weave at once follows `calling()`. A wind reading is
    sent towards where the wind comes from, a water reading towards where the swell comes from.
    They link to heal when a set of waves has passed and the water eases (or after 75 seconds
    without such a sign), and hold it until the next set, 9 to 20 seconds. The earlier "every 12
    to 22 seconds" is gone. Chance is used only for how long each thing has gone unread as a
    visit opens. Not from data: the moment each gust arrives (its size is the real gust factor).
    `/?controls` has rows "at the front" and "calling" that say who is at what and why.
  - **Turning** (the owner: "they switch a little too quickly... the intention and force needs to
    steadily move to the new focal point with the weavers applying more energy towards POV to
    redirect"). Nothing switches. Three times in four a channeller does not let go at the end of a
    reading but turns the same weave to the next one; and all four turn together between their
    readings and the healing flow. A turn takes 12 seconds (`TURNS_IN`; 6.5 was "too erratic instead of intentional", the owner; calls are also taken in over ten seconds, nobody turns before 18 seconds on one thing, and links last 20 to 34 seconds) and runs out along the
    weave from the boat, the near end in its new place first (`turned`), with more of the weave
    showing near the boat and along the bend while it lasts (`pushed`). They are now apart for
    12 to 22 seconds and linked for 8 to 11, turning included, so links begin 20 to 33 seconds
    apart, not the 12 to 22 first asked for.
  - To look at one alone: `/?show=pressure`, `/?show=wind`, `/?show=water`, `/?show=healing`,
    with `&pretend=pressureTrend:-1.4`, `windSpeed:30,windGusts:42`, `seaTemperature:22`.
- **The elements' colours** (tried 12 October with the owner's agreement, after the elements
  had lost all distinction to earlier visibility fixes; the README's older note that the owner
  did not want them strongly coloured is superseded for now). By day every weave is a pale
  thread with a deeper sheath on both sides (the owner: "white on white is ugly"), and the
  sheath and a tint of the thread carry the element: air a violet-blue (sky blue cannot be seen
  against the sky), water a sea green, akasha a bronze-gold; the strongest's alone is white,
  edged in the deep blue of the site's bar (`SHEATH_*` in `channellers.ts`). A sky reading is
  air, a water reading water; the healing flow braids all three with the strongest's white. On
  top of that a reading's thread takes the colour of what it finds. By night the same colours,
  paler, as light.
- **No two visits open alike**: who of the twelve is at the front, whether they are linked, who
  is resting, how far each weave has run, and whether a sounding or a seeking is about to begin
  are all drawn by chance as the page opens.
- **The strongest channeller is the owner.** Never write "she/her" or "he/him" of the strongest:
  say "the strongest", "they", or "you/yours" to the owner. The owner also says "master weaver".
- **The strongest is immensely stronger**: taken as 1.8 times the other twelve put together (the
  owner's words were "has their strength collectively by 1.8"; this reading is not confirmed).
- **The strongest's own weaves always become white, or a coloured white, against any colour**,
  by day as well as night. Everyone else's weaving is light added to the scene and cannot be
  seen by day.
- **Anything unusual in wind, pressure, sea or current** (`unusual()`; benchmarks lowered 40% at
  the owner's word): the strongest looks into it first with an investigative weave into the air
  or the water for 10 to 16 seconds, then channels with it, the others following. Only 84% of
  what is unusual counts (the owner had the strongest's attention reduced by 16%).
- **The twelve have temperaments** (`TEMPERS`: Keel, Kite, Fathom, Ember, Loom, Listener, Sail,
  Reef, Glass, Lantern, Ballast, Mist) that drive who steps forward, how soon they come in, how
  still their tress lies, and who sounds the water. The assistant invented them; the owner has
  not yet reviewed the names or numbers.
- **Soundings**: every two or three minutes three or four of them feel the water with fine
  plaited tresses that run shallow under the real waves and return to the boat.
- **Dawn and dusk**: all thirteen link (most qi in the air then).
- **On moonless nights** the four at the front weave towards Hawaiʻi with a short timed story.
- **Standing rules from the owner**: they only ever feed what sea and wind are already doing;
  force only when needed; strong weaves do not equal brightness; nothing bright may hang in the
  sky; keep "oceanic truth" (never paint patterns over the sea); weaves begin and end at the boat.
- **Boat lamps**: warm light on the water at night, only while no weave at all is out, eased.

## Addresses for looking at things

| Address | Shows |
|---|---|
| `/?storm` | a channelled storm, for this visit only: past hurricane force, the twelve as versions of Siuan, Leane and Moiraine, the weaves' colours graded, and the menu row "Weather · Channelled, honouring spirits met across Te Moana-nui-a-Kiwa". `/?storm=off` shows the site without it while one is on for everyone |
| `/?storm&show=sky` | in a channelled storm, the channellers opening the sky at once; otherwise it comes round every 160 seconds in a channelled storm. Every way of opening it plays together as one piece (`sky-all.ts`, the owner's choice): the rain gathered into shoals, hanging and going back up as mist, the in-breath off the sea, the silk column (`sky-opening.ts`, leaning, roped, never a cone) rising some 600 m ahead and opening into arms at the cloud base, a kelp forest of threads at the horizon, the strongest's silk ribbon, the curtain of rain lifted, a ring of calm rolling out, and lanterns. Rain is real 3D drops (`rain.ts`). `&sky=column` shows the column alone |
| `/?controls` | every live figure, including rows "unusual", "strongest", "storm" |
| `/?hour=19.2`, `/?hour=22`, `/?hour=13` | dusk, night, midday at the boat |
| `/?date=2027-03-01` | another day of the voyage |
| `/?pretend=windTrend:20` | weather that is not there (names as in `SeaConditions`); this one is an unusual wind |
| `/?pretend=waveTrend:1.2` | an unusual sea |
| `/?hour=19.7&pretend=aerosolDepth:0.35,visibility:9000` | dusk on a hazy evening (the twilight sky follows the live air) |
| `/?show=soundings`, `/?show=masters` | a sounding, or the strongest's deep weaving, at once |
| `/?colours` | a strip of four swatches at the foot of the page (air, water, akasha, the strongest's edge); a change shows at once and is kept in the address as `&air=9e7bf3&water=00b0a2&akasha=e0b065&strongest=0050cb`, so an address is a palette |
| `/?show=pressure`, `wind`, `water`, `healing` | all four at the front at that one thing |
| `/?ratio=2`, `1.5`, `1.25`, `1` | holds the picture at that many pixels to one of the page (it otherwise drops them itself when a machine cannot keep up; the row "drawing" in `/?controls` says how fast it is going and at what) |
| `/?light=0..1` | the "light is loss" dial (default 0.5; the owner has not chosen a value) |
| `/?look=september` | September's look |
| `/?through=become`, `wave`, `dissolve`, `tide` | how the menu hands over to About or Contact (14 October; the owner: the menu "jumps shut and then re-opens"). `become` (the owner's choice, 14 October, then made a little faster; the Close of About and of Contact now goes back to the menu the same way; Tîr Aho Studio opens in a new tab): the drawer turns into the page; `wave`: the page comes in over it from the left; `dissolve`: the drawer melts away; `tide`: as it was. Kept while moving about the site |

## Unfinished, in the order the owner last cared about

1. **Tending** (reworked through 12 October, see the rules above). Still wrong: all forms are
   soft and blurred against the sky, so the wind reading's tearing cannot be seen; the middle
   of a water reading is simply out of sight, not seen going under; the strongest's weave is not
   set apart by day; `/?show=wind` and `/?show=pressure` showed nothing on a moonless night
   though the ordinary night does (not understood); storm by day was toned down blind; soundings
   stand out of the water as small hoops; nothing says who is doing what; never watched in motion.
2. **Dusk**: the strongest's white weave is bold there; ask whether it is too much.
3. **The linked flow at high need is very bright**, against "strong weaves do not equal brightness".
4. **No visible drawing-in of qi** at dawn and dusk; the owner may want one.
5. **Temperaments are untested by eye**, and give no element-colour leaning nor any say in who
   weaves deep round the boat.
6. **Soundings read as wisps, not obvious plaits.**
7. **September's old threads**: put away (12 October), except at `/?look=september`, in the story
   and by the dev slider.
8. Older flaws: heavy overcast too dark and brown; clouds dim all stars alike.
9. **The new twilight sky** (`twilight-sky.ts`, see the README): not yet looked at under cloud or
   storm, and its drawing cost on a phone is unmeasured. The owner has seen none of it yet.

10. **Speed** (13 October; the README's entry "Keeping the picture moving smoothly" has what was done and what is left). Measured only on the owner's M1 laptop, in a headless browser at 2560 by 1326: never on a phone, nor on a slow machine. The owner has not yet said whether the softer picture a slow machine now gets (down to 1 pixel to 1) is acceptable, or whether sharpness should be held and smoothness given up; `/?ratio=` shows each.

## Handover: the storm thread of 15 October (read this first in the next thread)

**For a new version of the storm, read `STORM.md` first**: the idea in the owner's words, what was
built and why, what they reacted to, ideas not yet built, technical lessons, and the way back.

One long working session on 15 October built a storm the owner can call up at will, and a way
for the channellers to open the sky in it. All of it is pushed and live. Marked in git:
`before-storms` (`0cbc93a`, the site as the thread began) and `storms-2026-10-15` (`e5266ce`, the
site as it ended). The thread's seven commits run from `56331a6` to `e5266ce`.

**What is live now**
- **The channelled storm is ON for every visitor until 9 pm, 16 October 2026, Aotearoa time**
  (`storm.json`, `"until": "2026-10-16T21:00:00+13:00"`); it ends by itself then. While on: winds
  of 220 km/h gusting 300, an 18 m sea, thunder, pressure 915 hPa falling (`CHANNELLED_STORM` in
  `app/utils/channelled-storm.ts`); the twelve are versions of Siuan, Leane and Moiraine
  (`AES_SEDAI` in `channellers.ts`); the weaves' colours graded (`GRADED_COLOURS`, `uGraded`); and
  the menu row "Weather · Channelled, honouring spirits met across Te Moana-nui-a-Kiwa".
- **Past hurricane force** (`beyondHurricane` in `manawatawhi.ts`): giant swells under the
  measured sea, the deck rolling harder, lightning up to about one a second.
- **Lightning** (`lightning.ts`, always on, owner's choice): bolts from the cloud base, tortuous
  and branched, near and far, most flashes inside the cloud, a glow in the cloud base and a
  point of light where a bolt meets the sea; no steam plume.
- **Smoke** (`fluid.ts`, always on): follows the real wind, mixed away fast in a gale; the gases'
  glow beside each bolt turned almost off.
- **Rain is real 3D drops** (`rain.ts`, always on, replacing the flat rain, kept in
  `.trash/storm-overlay.flat-rain.ts`): three layers following the boat, driven by the real wind,
  in sheets; the channeller beside the viewer on the left holds a weave of Air before their eyes
  that bends the rain round it.
- **Opening the sky**, every 160 s in a channelled storm, all ways at once (`sky-all.ts`, owner's
  choice): the rain in shoals like starlings, hanging and rising back as mist; the in-breath off
  the sea; the silk column some 600 m ahead (`sky-opening.ts`), leaning with the wind, in loose
  ropes, painted in brush strokes over a soft wash, its arms spreading like smoke; a kelp forest
  of threads at the horizon; the strongest's silk ribbon; the rain's curtain lifted; a ring of
  calm; lanterns. Qi gong's "two hands hold up the sky" and silk-reeling are its model.

**Addresses**: `/?storm` (the storm for one visit), `/?storm=off` (without it), `/?show=sky` (the
sky opening at once), `&sky=column` (the column alone), `&controls` (figures and who is at front).

**Seeing it** (for an assistant): the app's browser pane is often hidden, and a hidden page stops
drawing. Use `scripts/shoot.mjs` (headless Brave), e.g.
`~/.local/node/bin/node scripts/shoot.mjs "http://localhost:3000/?hour=22&show=sky" /tmp/x 20 50`.

**Not right yet / the owner's last words on it**: they adore it, and asked for the shape in the
sky to be "more abstract and less geometric" and the column "more painterly", both done once. Not
yet done: the bright pool where the threads meet the column's foot; the arms still faintly beaded
by night; nothing watched in motion, only stills; never seen on a phone; the cost of the 3D rain
and the sky on a slow machine unmeasured; the shelter in front of the channeller never clearly
photographed; the story's rain swirl round the knot went with the flat rain.

**How the owner worked in this thread**: gives direction by feeling and pictures ("more poetic",
"innovate again", "what do YOU think"), wants options with a recommendation, then often "all of
them"; says "commit and push" for each push; British spelling; the strongest is "they".

**The way back**
1. *End the storm now, keep the work*: set `storm.json` to `{ "from": null, "until": null }`,
   then commit and push. Everyone then sees the pilgrims, the original colours and the measured
   weather; the 3D rain, lightning and smoke changes stay (they are not part of the switch).
2. *Return the live site to exactly how it was before this thread* (tested: the result is
   identical to `before-storms`). Nothing is deleted; the storm stays in history at
   `storms-2026-10-15` and can be brought back with `git revert` of this revert.
   ```bash
   git revert --no-commit before-storms..storms-2026-10-15 && git -c user.name="Nabil Sabio Azadi" -c user.email="nsa@nabilsabioazadi.com" commit -m "Back to the site as it was before the storms of 15 October" && git branch -f main october && git push origin october main
   ```
   (If later commits touch the same files, revert those first or resolve the conflicts.)

## A channelled storm, for everyone (15 October)

The owner can call one up at will. It is set in `storm.json` at the root of the site: `"until"`
an end time (and `"from"` a start, if wanted), as ISO times with their offset, e.g.
`"2026-10-15T22:00:00+13:00"`; both `null` is off. It goes live with "commit and push" and ends by
itself at `"until"`, with no further push; an open page takes it up or lets it go within half a
minute, easing over. Everything about it is in `app/utils/channelled-storm.ts` (the figures and
the menu's words), `setChannelledStorm` in `channellers.ts` (the crew, `AES_SEDAI`, and the grade,
`uGraded`, `GRADED_COLOURS`) and `OceanBackground.vue`. A private address to flip it from a
phone would need a small store on Vercel (Vercel KV or Upstash), which only the owner can sign up for.

The realer lightning and the wind-blown smoke of 15 October are not part of it: they are always
on, and show whenever there is real thunder at the boat (the owner's choice).

## Things only the owner can do

- Delete the GitHub token that was pasted into a terminal earlier (github.com/settings/tokens).
- Confirm GA Measurement ID `G-20Q8W806FV` belongs to property 365685777; decide on cookies.
- Confirm the *Asia Pacific Art Papers* link, and that a contact letter reaches studio@nabilsabioazadi.com.

## Not verified

Almost everything in the weaving was checked in still pictures from a headless browser, never
watched in motion. Pages were photographed at desktop width only. No screen reader or automated
accessibility audit has been run; contrast was measured.

## How the owner likes to work

- Not a programmer. Plain words, exact addresses to open, pictures of the result.
- British English. Short code comments that say why.
- Says "commit and push" when ready; do not commit before that. Never delete: move to `.trash/`.
- WCAG compliance matters. Keep text off the bare ocean.
- Gives direction in images and feeling ("too wiry", "more nuanced"); act on it and show a
  picture, do not ask for a specification. Be plain about what is still wrong.
- Likes options side by side, each at its own address, the unchosen ones kept reachable.

## Taking pictures (for an AI assistant)

Headless Brave driven over its debugging port; a script that loads one page and saves a picture at
given seconds. Pass each time as its own argument (zsh does not split a quoted list). Start a fresh
browser profile per run. Rendered light appears to be tone-mapped after the shaders (a test showed a
shader value of 1.0 coming out well short of screen white), so write scene light, not screen colour: see `uWhite` in `channellers.ts`.
