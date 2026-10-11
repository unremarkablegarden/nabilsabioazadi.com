# Handoff: the October version (written 12 October 2026)

This file is for whoever picks the site up next, person or AI assistant. It says what this
version is, where it is kept, how to run it, what was last worked on, and what is unfinished.
The README's "Notes for Claude Code" section has the detail on how each part works; read the
entries on the channellers there before touching the weaving.

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
- **The twelve have temperaments** (`TEMPERS`: Keel, Kite, Fathom, Ember, Loom, Listener, Gale,
  Reef, Glass, Spark, Ballast, Drift) that drive who steps forward, how soon they come in, how
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
| `/?controls` | every live figure, including rows "unusual", "strongest", "storm" |
| `/?hour=19.2`, `/?hour=22`, `/?hour=13` | dusk, night, midday at the boat |
| `/?date=2027-03-01` | another day of the voyage |
| `/?pretend=windTrend:20` | weather that is not there (names as in `SeaConditions`); this one is an unusual wind |
| `/?pretend=waveTrend:1.2` | an unusual sea |
| `/?show=soundings`, `/?show=masters` | a sounding, or the strongest's deep weaving, at once |
| `/?light=0..1` | the "light is loss" dial (default 0.5; the owner has not chosen a value) |
| `/?look=september` | September's look |

## Unfinished, in the order the owner last cared about

1. **Daytime**: only the strongest's weaves show by day, and against the near-white midday sky
   even those are faint. The owner has not said how other daytime weaving should look.
2. **Dusk**: the strongest's white weave is bold there; ask whether it is too much.
3. **The linked flow at high need is very bright**, against "strong weaves do not equal brightness".
4. **No visible drawing-in of qi** at dawn and dusk; the owner may want one.
5. **Temperaments are untested by eye**, and give no element-colour leaning nor any say in who
   weaves deep round the boat.
6. **Soundings read as wisps, not obvious plaits.**
7. **September's old threads** still show by full day outside dawn and dusk (thin wires to a point
   above the horizon). Suggested, not done: put them away except at `/?look=september`.
8. Older flaws: heavy overcast too dark and brown; clouds dim all stars alike.

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
