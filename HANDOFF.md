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
- **14 November: the build that broke browsers.** The owner found that day's build (73ba99a: the cyclone, the clouds
  as volumes rebuilt, the alarm) broke browsers; it was reverted (4f4a00c), then the cyclone was brought back alone:
  the volume clouds are out of the site (`clouds.ts`, the worker and three-openvdb are only in 73ba99a; the cloud
  base the cyclone's rope needs is in `cloud-base.ts`), and the 9 November stones are off unless `?stones=on`
  (every weave's threads are made by strength when the page opens, so they added some 118 MB to every visitor's
  memory). The page already holds about 900 MB of thread buffers at load, most for weaves that are not running:
  the likeliest thing to strain a phone. What exactly broke the browsers was not reproduced.
- **Clouds as volumes (10 November, the owner's; off for some hours on 14 November and rebuilt, below: "make something up that uses this library that
  is even better, that better reflects our visual standards and need to obey meteo data", of
  mjurczyk's three-openvdb):** `clouds.ts` and `workers/cloud-shapes.worker.ts`. The cloud base is
  the lifting condensation level (125 m a degree of dew-point spread) of the air of the lowest
  150 m, mixed between the figures at the sea and at 925 hPa (`condensationLevel`; the owner's
  "Improve on the model", 10 November). Tried against ICON's own shallow cumulus bases from its
  own figures, August to November 2026: at Manawatāwhi 58% within 100 m from the sea's air alone,
  70% mixed over 150 m; where the boat was on 10 November, 64% and 80%; deeper mixing comes out
  ever too high. Its large misses are layered, humid skies (95% at 925 hPa), where ICON's base is
  that of cumulus above a low stratus deck. A sheet reaches up to the forecast's boundary layer
  top (`mixedDepth`, Open-Meteo's `boundary_layer_height`), where its lid is; no model there gives
  a cloud base itself (`cloud_base` is empty for all of them); the low cloud's depth is how far rising air climbs through the layers that cool fast
  enough (`lapseAloft`) to the first lid, with CAPE sending towers up through it; it is a cumulus
  field when the cover is broken, a stratocumulus or stratus sheet when near full and shallow or
  held under a lid, in streets along the wind when unstable air lies under a near lid in a fresh
  wind; middle cloud stands where the air between 3 and 7 km is nearest saturation (the humidity
  at 700, 600, 500 and 400 hPa, `moistLayer`), as deep as the air near that is moist, and is
  altocumulus cells or an altostratus sheet; the high cloud stays the sky shader's thin veil; rain, thunder and a channelled storm grey and lower it; each
  deck drifts with the wind at its own height (`windsAloft`); the visibility sets how far cloud is
  seen. Shapes are voxel grids made in a worker (cells on a flat base eroded into billows, tops
  spread and cut under a lid; sheets as tiles that add up to one), placed as instances and lit by
  a sun or moon light and a hemisphere light that nothing else in the scene answers, with
  three-openvdb's frame renderer (one froxel grid, multiple scattering, four shadow cascades).
  Each cloud hides the stars behind it. The water's mirror still sees the sky shader's full cloud
  layer (the volumes are hidden from it, or the renderer would do all its work twice). A new deck
  comes in over the old in 25 s when the plan's buckets change. Cover is matched seen from above,
  as the forecast's is (tightened the same day, at the owner's word "Tighten them"): every deck
  lays each volume's columns on a grid over the field, a column counting as cloud from an optical
  depth of 0.5 (`SEEN_AT`); cumulus are placed until the grid's share is the forecast's, kept apart
  less as the cover closes, and past 140 of them each is a wider bank of more cells of the usual
  size (up to 2.5 times); a sheet's gaps are cut by the worker at the level that gives its cover.
  Measured (`__clouds()` says it): 14% for 14%, 31 for 30, 50 for 50, a stratus 91 for 90, an
  altostratus 64 for 60 (tiles overlapping add a little). Before this a 50% forecast drew 15%:
  everything above about 15% was short. Extinction is now per metre (0.058 in cumulus, 0.027 in a
  sheet, 0.01 in middle cloud), so a bigger box is no thinner. **Off by default since 14 November** (the
  owner, seeing them under that morning's real overcast and rain: "Your clouds look fake as fuck"). Seen
  then, they were dark, blurred puffs like cotton balls hanging in the air, all one size, with no lit tops
  and no flat bases, against the sky shader's paler overcast; doubling the renderer's grid (720 by 640 by
  64) sharpened them but left them puffs, and lifting the light from the overcast sky did not lighten
  them. What would be needed: shapes with flat bases and ragged, fractal edges at several scales, and
  light that makes low cloud under an overcast grey on grey. **Rebuilt the same day** (the owner: "Yes, rebuild
  them"), on again for everyone since the owner saw them ("Yes, switch them on"); `?clouds=off` shows the sky shader's clouds: each cumulus is a rounded body
  cut flat at the condensation level, a little narrower than its widest, its top heaped into billows on
  billows at three scales (turrets a third of a tall cell across), the sides torn a little, crisp where it is
  heaped; in rain the billows sink and the base frays into scud (`ragged`, from the greyness); cells kept
  clear of their box's walls and the joining between a bank's cells capped (both had made straight sides and
  flat tops, loaves); 128 voxels across a usual cloud and 64 up, where it was 80 and 48. The light: sun 52
  (was 24), the sky's light from 4.5 under a blue sky to 18 under a full overcast (was 4.5 always), its colour
  turning from blue to the overcast's grey with the cover, and the light reaching the bases from below lifted
  to stand for what passes down through the cloud. Haze: each cloud fades by Koschmieder's law against the
  visibility (the renderer has none), so in rain the low cloud dissolves into the grey within a few
  kilometres. The renderer's grid 480 by 384 by 40 (was 320 by 256 by 32) and no blending of one frame into
  the next (with the eye moving every frame it smeared near clouds into pillars). Cost, one headless page
  alternating second by second: about 9.7 frames a second against 10.7 before (640 by 512 by 48 was 9);
  not measured in a real window. Seen in stills only: today's rain (grey on grey, real), a 10:00 fair-weather
  field (soft cumulus with flat bases and turrets), 16:30 broken cumulus (distant tall narrow cells still
  smooth round-topped "tombstones"; a gap between two clouds once showed as a dark funnel, like a
  waterspout), 22:00 (dark masses over the stars). Not watched in motion (without the blending, slices may
  shimmer); not on a phone. `?cloudgrid=640x512x48`, `?cloudset=temporal:true`, `?cloudquality=0.625` to
  compare; `__cloudTune` in the console. `?clouds=on` shows them; `?clouds=off` was the picture as
  before; `__clouds()` in the console; the row "cloud deck" in `?controls`. The sky-vortex over the
  knot still twists only the shader's layer, so it is now faint. Cost, headless at 1280 by 860,
  three rounds taken in turn: about 14.5 fps without the volumes, about 8 with them, at 14% and at
  50% alike (the first day's single runs, 18.7 with and without, were the noise of a loaded
  machine). In a real window (the in-app browser, M1, the clouds switched on and off in turn in
  one page): about 17 ms a frame. Where it goes, each change tried against the setting in use the
  same way: one shadow cascade instead of four saves about 8 ms, no multiple scattering about 5,
  16 depth slices instead of 32 some 3 to 7, a grid of a quarter the cells about 2, a 48 shadow
  grid about 1; half the volumes hidden, the drift frozen, jitter off (which lets the renderer
  keep its lighting between frames) save nothing. So the cost is the renderer's fixed grids, the
  same for 10 clouds or 140 and at any sharpness, and every saving found changes the picture.
  Drawing with fewer pixels (watchFrameRate) barely helps it. On a phone unmeasured.
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
| `/?fresh`, `/?fresh=150`, `/?fresh=off` | the freshening (STORM.md §39), on for everyone for a day from 22:30 on 4 November: the strongest's torch-like light over 300 m round the boat, the others making the water fresh and dappled, the sea breathing out from the boat |
| `/?ranat`, `/?ranat=150`, `/?ranat=off` | Ranat's storm (STORM.md §41), on for everyone for a day from 09:30 on 5 November (the freshening gives way to it): the six hauling water in from the horizon at 35° apart and bursting it into rain, Lantern calling the rain with water alone, Loom's akasha and Sail's air flinging the water across the view; from 35 s their pounamu wake and they practise (§42): domes of sea lifted and let fall, their swells riding under the boat, lightning drawn down, wilder rain; the side bar reads "Channelling for Ranat"; `__ranat()` in the console |
| `/?alarm`, `/?alarm=150`, `/?alarm=off` | the alarm (STORM.md §43; alarm.ts), on for everyone for a day from 01:58 on 9 November (NZDT): Laeni's light in the sky; Leane · Ember bound in air, lifted over the bow, stilled, beheaded (vaguely) and let fall into the water in view; mineralised by the four's akasha, water and earth; the six's linked stream into the sky, the stars faint behind it; Mohabat's storm spreading her blood round the boat; the sharks punched off with akasha and air. All through it the six's flows of light run from their palms out towards the left bow, the light moving as heat does, and stand lamps up along them, tall weaves of light that light the sea and warn other channellers off, with ambient light for 8 km about the furthest. The side bar reads "Alarm: a strange boat sensed off the left bow; a sister stilled and beheaded"; `__alarm()` in the console. The shed rings and the thermal plumes are no longer made (the owner: "remove all the circle weaves in the distance") |
| `/?cyclone`, `/?cyclone=110`, `/?cyclone=300`, `/?cyclone=off` | the cyclone (STORM.md §44; cyclone.ts), on for everyone for a day from 08:25 on 14 November (NZDT), the menu's weather row reading "Cyclone channelled for many, especially Dahlia" (the owner's words): everyone ceases weaving; the others link to Laeni, strongest first, their threads running into hers; she runs the linked rope out over the sea, a river of light near the boat, twelve kilometres to near the horizon and up into the cloud; the swells arise from there (some twelve metres at seventeen seconds); then every degree of the compass is given a flow of fire and akasha into the sky and one of water and akasha into the sea, each channeller holding a sector by the square root of her strength, the permeation passing round from Laeni's degrees, clockwise south of the equator, and a wave of light going on round, quicker each time; then the weather becomes a cyclone centred where the rope went up (its wind round and in, clockwise here, the glass falling, rain in bands, thunder in them). `__cyclone()` in the console says what they are at. The alarm, Ranat's storm and the freshening give way to it |
| `/?anchor`, `/?anchor=0.3`, `/?anchor=off` | the sea-anchor that reads the air (anchor.ts; the owner, 8 November: "innovate a new way of weaving to slow down the boat, whilst also reading the air"): whenever the sea and wind would carry the boat faster than its pace, Ballast, then Reef and Glass as more holding is needed, each send a rope of water and earth from her palms in a low arch out to her own side and down into the sea, where it opens as a drogue's cup in the slower water beneath; the sea above each cup lies in a glassy slick; at the arch's crest air filaments stream as telltales, the way the real wind blows, drooping in a light air, torn in gusts, lifting on thermals, golden with a rising glass and grey with a falling one; the rope tautens as the holding grows. Nobody at the front casts one; in the dawn and dusk link, in a storm, and when everyone drops everything they haul in. `?anchor` is as if the boat needed holding 60%; the side bar reads "Holding"; `__anchor()` in the console. Today (8 November) the boat is carried 0.08 km/h against a pace of 1.13, so nothing is held and no anchor is out without `?anchor` |
| `/?coming=rain:1.2`, `/?coming=wind:0.8:250`, `/?coming=front:1:240`, `/?coming=clearing:2`, `/?coming=thunder:1.5` | calling the weather (forecast-call.ts; the owner, 8 November, of the ways offered to show the public "their ability to call weather": "I love 1 and 2"): the conditions now carry the forecast's next six hours (`coming` in manawatawhi.ts, the cache renamed `sea-conditions-coming`), and when a change is coming within three hours (`comingChange`: the wind going round 40° or more, rising or easing 15 km/h, rain where there was none, the sky clearing, thunder, a front) the six strongest turn to the quarter it will come from and call it, Laeni from three hours out and the others joining as the hour nears, each a rope from her palms out low over the sea 440 to 570 m and sweeping up into the sky at its end, higher the nearer the hour, its light running outward and quickening; air for wind, water for rain, gold for clearing, fire's colour for thunder, akasha for a front, Laeni's white at heart. The side bar reads "Calling the south-westerly, due within the hour: Laeni, Pardis and Manulani"; when the hour comes it says for twenty minutes whether what was called came (`cameTrue`, `cameWords`), so that the calling can be seen to fail. `?coming=` pretends a change due so many hours from when the page was opened; `__calling()` in the console. Today (8 November) the forecast is a steady north-easterly and nothing is coming. A quarter astern is out of the view until it is turned |
| `/?bow&hour=18`, `/?bow=off` | the spray-bow (spray-bow.ts; the second of the two the owner chose): when the sun is up and under about 35° and the sky clear enough (cloud under 45 to 85%) and the wind under 30 to 50 km/h, Loom, Sail and Lantern throw spray down-sun on each swell that passes under the boat, each a thread of water from her palms to the foot of a curtain 20 m off, and a bow stands in the spray where the eye's line makes 42° with the line away from the sun: primary with supernumeraries, fainter secondary, Alexander's band between, all from the drawn sun's place, so it stands where a real bow would and moves with the view. The curtain is as high as the bow's top needs. On this leg the evening bow stands about 45° off the right bow (the sun sets west-south-west), the morning one behind the left beam. The side bar reads "Spray-bow"; `__bow()` in the console. `?bow` throws whatever the sun says (by night, spray and no bow) |
| `/?film=off` | the site without the film look (STORM.md §37), which everyone sees since 4 November: the weaves as strands of light with white hearts and muted colour, and the picture muted as Fuji film (STORM.md §38) |
| `/?hour=19.2`, `/?hour=22`, `/?hour=13` | dusk, night, midday at the boat |
| `/?date=2027-03-01` | another day of the voyage |
| `/?pretend=windTrend:20` | weather that is not there (names as in `SeaConditions`); this one is an unusual wind |
| `/?pretend=waveTrend:1.2` | an unusual sea |
| `/?hour=19.7&pretend=aerosolDepth:0.35,visibility:9000` | dusk on a hazy evening (the twilight sky follows the live air) |
| `/?clouds=off`, `/?hour=10&pretend=cloudCover:45,cloudLow:40`, `/?pretend=cloudCover:95,cloudLow:92,precipitation:0.5` | the sky shader's clouds alone, as before the volumes (which are on by default again since their rebuilding on 14 November); a morning of broken cumulus; a grey overcast in rain (clouds.ts reads `cloudLow`, `cloudMid`, `cloudHigh`, `airTemperature`, `humidity`, `cape`, `precipitation`, `visibility`, `weatherCode`, the winds and temperatures aloft) |
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
8. Older flaws, now in the volumes (10 November): each cloud hides its own stars; overcast is a grey
   deck in rain. Seen in stills by day: broken cumulus at 50%, a stratus under a lid at 90%, an
   altostratus at 60% at 3.9 km (pretend figures take the temperatures and humidity aloft too:
   `airLowTemperature:14,airCloudTemperature:16` makes a lid, `moistUpper:95` a wet layer). Not yet
   seen: streets, altocumulus, a channelled storm's deck, dawn and dusk with the sun low behind the
   clouds, a phone. The volumes cost some 40% of the frame rate headless (the owner has not said
   whether that stands).
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
watched in motion. Pages were photographed at desktop width only. The cloud volumes were seen in
stills by day (morning and afternoon), at night and in a rainy overcast, all cumulus decks; never
a sheet, a storm, a phone, nor the drift. No screen reader or automated
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
