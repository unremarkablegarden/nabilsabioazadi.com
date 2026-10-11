# Handoff: the October version (begun 11 October 2026)

This file is for whoever picks the site up next, person or AI assistant. It says what this
version is, where it is kept, how to run it, and what is unfinished. The README's "Notes for
Claude Code" section has the detail on how each part works; entries there marked "October" are
this version's.

## Where things are kept

- Git branch `october`, in `~/Development/nabilsabioazadi.com`. It began as a copy of `storm-weave`.
- September's version is untouched on branch `storm-weave` (tag `storm-weave-2026-10`). `main` is
  still the friend's last commit (`72b8dc9`).
- Everything is on this Mac only. Nothing has been pushed to GitHub.
- To see this version:

  ```bash
  cd ~/Development/nabilsabioazadi.com && git switch october && bun install && bun run dev
  ```

  then open http://localhost:3000.

## Three things that are not in git and must not be lost

1. **Licensed typefaces**, in `public/fonts/licensed/` (git-ignored on purpose: the repository
   is public). Eight files: Helvetica Neue LT Com (Light, Roman, Medium, Bold), Lyon Text
   (Regular, Regular Italic), Lyon Display (Light, Light Italic). They were copied from
   `Dropbox/+ Studio/NSA* Design Team Folder/Branding Design/Fonts/`. Putting them on the live
   site needs web-font licences. This is still an open question.
2. **Node.js and Bun** were installed for this project in `~/.local/node` and `~/.bun`.
3. **The Prismic article type** exists only as a file here (`customtypes/article/index.json`).

## What this version is

- **A voyage.** The viewer is on a small boat that left Manawatāwhi (the Three Kings Islands) on
  10 October 2026 and reaches Honolulu by 1 July 2027, always facing Hawaiʻi. Everything is
  worked out for where the boat is at the moment shown.
- **The sea as it is.** Live forecast figures for the boat's position (Open-Meteo; four weather
  models blended): each swell and the wind's waves at their real height, length and direction,
  real cloud, rain, mist and thunder. The eye is 5 m above the water and rides the drawn waves.
- **The sky as it is.** The sun and moon in their real places, the moon in its phase, 9,096
  catalogue stars, the five visible planets and the Milky Way.
- **Four channellers** on the boat, on nights around the new moon: tresses of fine filaments that
  join into one flow towards Hawaiʻi, feeding what the sea and wind are already doing, with a
  short timed story when the page opens. There is no ship any more.
- **The menu**: a Klein Blue top bar; a moon-edged drawer with About, Tîr Aho Studio (a link to
  tiraho.com.au) and Contact; the live sky drawn faintly behind its words; a newsletter field
  that signs up on the owner's Kit form.
- **About** (`/about`) and **Contact** (`/contact`) pages, as panels over the picture.

### Addresses worth knowing

| Address | Shows |
|---|---|
| `/?controls` | the sliders, and every live figure the picture is drawn from |
| `/?hour=22` | a time of day (here 22:00 on the boat) |
| `/?date=2027-03-01` | another day: that day's sky, and the boat where it will be |
| `/?pretend=windSpeed:65,waveHeight:6` | weather that is not there today (names as in `SeaConditions`) |
| `/?look=september` | September's fixed opening look and staged light |
| `/?shape=wave` | another cut of the menu's drawer (`moon` is chosen) |
| `/?figure=voyage` | another figure behind the menu's words (`sky` is chosen) |
| `/about?about=almanac` | another About layout (`panel` is the default) |
| `/contact?contact=signal`, `/contact?lang=fr` | another Contact design (`letter` is chosen); the letter in another language |

Earlier versions of several parts are kept in `.trash/` (the rule here is never to delete).

## Unfinished, and things only the owner can decide

- **Nothing is deployed.**
- **About**: every word and the portrait are stand-ins. The owner had not finally chosen between
  the panel and its almanac, Klein and poster variants, nor whether to keep the small sky seal
  (`?sky=seal`). The content is not read from Prismic.
- **Contact**: the form sends nothing; the owner will say where messages should go.
- **Newsletter**: the "invisible captcha" must be switched OFF on the form in Kit (the site no
  longer uses Google's script), and a real sign-up has never been tried.
- **Languages**: only the contact letter is built for them, and only its English is the owner's.
  The whole site is to gain languages later; which ones is not decided.
- **The weaving** is to be improved further. What the channellers do on dark nights at other
  phases of the moon, and by day, is not decided; the old daytime threads from September remain.
- **Known flaws in the picture**: a heavily overcast day is far too dark and brownish; twilight
  ends too early; clouds dim all stars alike; the wind's direction does not turn the clouds.
- **Web-font licences**, and the signed logo being in git (see September's notes: the owner was told).
- **Prismic**: as before, the article type is not pushed and nothing reads real content.

## Not verified

Almost all of this version was checked in still pictures taken with a headless browser, not
watched in motion: the flow of the weaving, the timed story, the swell's directions, the ride of
the boat. The pages were photographed at desktop width only; phones were not. No screen reader or
automated accessibility audit has been run; contrast was measured.

## How the owner likes to work

- British English. Plain, short code comments that say why.
- Ask before committing. Never push. Never delete: move things to `.trash/`.
- WCAG compliance matters. Keep text off the bare ocean.
- Nothing bright may be left hanging in the sky: no "false sun".
- They give direction through references and images and iterate quickly; they like being shown
  several options side by side, each at its own address, and keeping the ones not chosen reachable.
- They are not a programmer. Explain in plain words and give exact addresses to open.
