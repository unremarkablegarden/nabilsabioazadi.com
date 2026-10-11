# nabilsabioazadi.com

A personal website built with [Nuxt](https://nuxt.com) (a Vue framework). Content comes from [Prismic](https://prismic.io) (a website content editor). The background is an animated 3D ocean made with [three.js](https://threejs.org). It follows the visitor's local time (morning, day, sunset, night with a moon) and has adjustable weather, from a calm sea to a storm.

This guide takes you from an empty computer to the site running on your machine, and then to Claude Code working on it with you. Follow the steps in order. Each step tells you how to check that it worked before you go on.

## Contents

1. [What you need](#1-what-you-need)
2. [Open a terminal](#2-open-a-terminal)
3. [Install Git](#3-install-git)
4. [Install Node.js](#4-install-nodejs)
5. [Install Bun](#5-install-bun)
6. [Download the project](#6-download-the-project)
7. [Install the project's packages](#7-install-the-projects-packages)
8. [Run the site](#8-run-the-site)
9. [Hand it over to Claude Code](#9-hand-it-over-to-claude-code)
10. [Where things are](#10-where-things-are)
11. [Troubleshooting](#11-troubleshooting)

## 1. What you need

- A Mac or a Windows PC with an internet connection.
- A recent Chrome, Edge, Brave, Firefox or Safari. The ocean uses WebGL, which all of these support.
- Optional: a free GitHub account (sign up at https://github.com/signup). You don't need one to download the project. You only need one if you want to send your changes back (see step 9.4).
- A Claude subscription (Pro or Max) or an Anthropic Console account, for Claude Code in step 9.

## 2. Open a terminal

A terminal is a window where you type commands. Every command in this guide goes there. Type or paste a command, press Enter, and wait for it to finish (you get a new empty line to type on).

- **Mac:** press Cmd + Space, type `Terminal`, press Enter.
- **Windows:** press the Windows key, type `PowerShell`, press Enter.

Keep this window open for the whole guide. If you close it, open a new one the same way.

When a step tells you to "close and reopen the terminal", do exactly that: newly installed programs are only found by terminal windows opened after the installation.

## 3. Install Git

Git downloads the project and keeps track of changes to it.

**Mac:** run:

```bash
xcode-select --install
```

A window appears. Click **Install** and wait until it finishes (this can take a while). If the terminal says the tools are already installed, you already have Git.

**Windows:** download the installer from https://git-scm.com/download/win, open it, and click **Next** on every screen. The default choices are fine.

**Check:** close and reopen the terminal, then run:

```bash
git --version
```

You should see something like `git version 2.x.x`.

## 4. Install Node.js

Node.js runs JavaScript outside the browser. The project's tools need it.

1. Go to https://nodejs.org.
2. Download the version marked **LTS** (long-term support).
3. Open the downloaded file and click through the installer with the default choices.

**Check:** close and reopen the terminal, then run:

```bash
node --version
```

You should see something like `v24.x.x`.

## 5. Install Bun

Bun installs the project's packages and runs the site. It is faster than the npm tool that comes with Node.js, and this project is set up for it.

**Mac:** run:

```bash
curl -fsSL https://bun.sh/install | bash
```

**Windows:** run:

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

**Check:** close and reopen the terminal, then run:

```bash
bun --version
```

You should see a version number such as `1.3.x`.

## 6. Download the project

This step puts a copy of the project in a folder on your computer. Downloading a GitHub repository is called "cloning".

### 6.1 Choose a folder

The commands below create a folder called `Development` in your home folder and go into it. You can pick another place, but then you have to adjust the paths in this guide yourself.

**Mac:**

```bash
mkdir -p ~/Development
cd ~/Development
```

**Windows:**

```powershell
mkdir $HOME\Development -Force
cd $HOME\Development
```

`cd` means "change directory": it moves the terminal into that folder. Every command after it runs inside that folder.

### 6.2 Clone the repository

Run:

```bash
git clone https://github.com/unremarkablegarden/nabilsabioazadi.com.git
```

It prints a few lines ending in `done.` and creates a folder called `nabilsabioazadi.com`.

### 6.3 Go into the project folder

```bash
cd nabilsabioazadi.com
```

**Check:** run `git status`. It should say `On branch main`.

From now on, every command in this guide must be run inside this folder. If you open a new terminal, go back first:

- **Mac:** `cd ~/Development/nabilsabioazadi.com`
- **Windows:** `cd $HOME\Development\nabilsabioazadi.com`

## 7. Install the project's packages

The project uses code written by other people (Nuxt, three.js and so on). These are called packages. The list is in `package.json`. Download them with:

```bash
bun install
```

This creates a `node_modules` folder. It is large, and you never edit it.

**Check:** the last lines should say something like `xx packages installed` and show no red error messages.

## 8. Run the site

Start the development server:

```bash
bun run dev
```

After a few seconds it prints `Local: http://localhost:3000/`. Open http://localhost:3000 in your browser. You should see the ocean with the title in the middle.

What to know while it runs:

- The terminal is now busy running the site. Leave it open. To stop the site, click in the terminal and press **Ctrl + C**.
- When you (or Claude) save a change to a file, the browser updates by itself within a second or two. If it does not, reload the page.
- Move the mouse to look around: the camera follows the pointer.
- In the top right corner there are two sliders, shown both locally and on the live site:
  - **time** sets the time of day. Click **now** to go back to the real clock.
  - **weather** goes from a calm sea (0%) to a storm (100%).

To run commands while the site is running (for example Claude Code in the next step), open a second terminal window and `cd` into the project folder again (see the end of step 6).

## 9. Hand it over to Claude Code

Claude Code is an AI assistant that runs in the terminal. It reads the project's files, makes changes, and runs commands, and asks you before it does anything important.

### 9.1 Install Claude Code

**Mac:** run:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

**Windows:** run:

```powershell
irm https://claude.ai/install.ps1 | iex
```

If either of these fails, use the installation guide at https://docs.anthropic.com/en/docs/claude-code/setup.

**Check:** close and reopen the terminal, then run `claude --version`.

### 9.2 Start Claude Code in the project

Open a second terminal (the first one is running the site), go into the project folder, and start Claude:

```bash
cd ~/Development/nabilsabioazadi.com
claude
```

(On Windows, the first line is `cd $HOME\Development\nabilsabioazadi.com`.)

The first time, it asks you to sign in in the browser. Use your Claude account. It may also ask whether you trust the files in this folder: answer yes.

### 9.3 Give it a first message

Paste this as your first message so Claude knows the project:

> Read README.md, especially the section "Notes for Claude Code". Then read app/components/OceanBackground.vue and app/utils/gerstner-waves.ts and tell me in a few sentences how the ocean works. Don't change anything yet. The dev server is already running on http://localhost:3000.

After that, describe what you want in plain words, for example:

- "At night the title text is black on a black sky and can't be read. Make it readable at every time of day."
- "The daytime water should look more like turquoise tropical water."
- "Make the storm foam on the wave crests more visible."

Tips:

- Ask for one change at a time and look at the result in the browser before you ask for the next.
- Claude asks for permission before it edits files or runs commands. Read what it wants to do, then approve or say no.
- If you don't like a change, say "undo that".
- Type `/help` inside Claude Code to see what else it can do. Type `/exit` or press Ctrl + C twice to quit.

### 9.4 Saving and sharing your changes

Git records versions of the project. A saved version is called a "commit". You can ask Claude: "commit these changes with a short description". To send your commits back to GitHub, the owner has to give your GitHub account write access to the repository. Then sign in when GitHub asks, and run `git push`. If you don't have write access, send the owner a message and they can take it from there.

## 10. Where things are

| Path | What it is |
| --- | --- |
| `app/app.vue` | The outer layout. It puts the ocean behind every page. |
| `app/components/OceanBackground.vue` | The ocean: camera, sky, sun and moon, time of day, weather, and the debug sliders. |
| `app/utils/gerstner-waves.ts` | The 3D wave shapes and storm foam. |
| `app/components/PageTemplate.vue` | How a page's content is laid out (title, text, gallery). |
| `app/pages/index.vue` | The home page. It loads the Prismic page with the ID `homepage`. |
| `app/pages/[uid].vue` | All other pages, for example `/about` loads the Prismic page `about`. |
| `app/assets/css/main.css` | Loads Tailwind CSS (styling classes such as `font-bold`). |
| `public/textures/waternormals.jpg` | The small-ripple texture on the water. |
| `customtypes/`, `prismic.config.json` | The Prismic content structure. |
| `nuxt.config.ts` | Nuxt settings. |

The text on the site comes from Prismic, not from these files. To change the words, edit them in Prismic at https://nabilsabioazadicom.prismic.io (you need an invitation from the owner for that too).

## 11. Troubleshooting

**`command not found` (Mac) or `is not recognized` (Windows)**
The program is not installed, or the terminal was opened before it was installed. Close and reopen the terminal and try again. If it still fails, repeat the install step for that program.

**`Port 3000 is already in use`**
The site is already running in another terminal window. Use that one, or stop it there with Ctrl + C. Nuxt may also start on another port by itself, such as 3001. Use the address it prints.

**The page is white or the ocean does not appear**
Open the browser's developer console (Cmd + Option + J on Mac, Ctrl + Shift + J on Windows) and look for red errors. Copy them into Claude Code and ask it to fix them.

**Something broke after `git pull` or a package change**
Run `bun install` again, then restart the site (Ctrl + C, then `bun run dev`).

**You want to start completely fresh**
Ask Claude Code to "discard all my uncommitted changes". It shows you what it will throw away and asks first.

## Notes for Claude Code

Context for an AI assistant working on this repository.

- **Stack:** Nuxt 4 (`app/` is the source directory), Vue 3, Tailwind CSS 4 through `@tailwindcss/vite`, `@nuxtjs/prismic`, three.js r186 (WebGL renderer). The package manager is Bun (`bun install`, `bun run dev`). There are no tests and no `.env` file. The Prismic repository is public, so no API token is needed.
- **Ocean:** `OceanBackground.vue` is based on the three.js example `webgl_shaders_ocean` (the `Water` and `Sky` add-ons from `three/addons/objects/`). `gerstner-waves.ts` patches the `Water` shader source with string replacements to add Gerstner wave displacement, whiteout-blended wave normals and crest foam. It throws if the three.js shader text changes, so check it after upgrading three.js. The water mesh is one plane with vertices concentrated near the camera (`createFocusedPlane`). Short waves fade out with distance where the grid is too coarse for them.
- **The voyage (October, the owner's):** the viewer's small boat is on its way from Manawatāwhi to Hawai'i, to arrive by 1 July 2027. `VOYAGE` and `boatAt` in `manawatawhi.ts`: one speed along the great circle (6,937 km, about 27 km a day). It left on 10 October 2026 and lands at Honolulu (both the owner's). `PLACE` is now where the boat is for the moment shown (`sailTo`, called every frame), with the bearing from there to Hawai'i, which the view always faces. Everything follows the boat: the sun, moon, stars, planets and Milky Way for its position, the live conditions fetched for it, the true directions of wind and waves against its bearing, and the place line in the menu and caption (`placeLabel`: position, kilometres out and kilometres to go). The boat's clock (`boatHour`) is Aotearoa's within 370 km of leaving, Hawai'i's within 370 km of landing, and the sea's time zones between (an hour per 15° of longitude). The route passes close to several islands and reefs (south of Fiji, Tonga's northern waters, Tokelau, the Phoenix Islands); nothing checks for land, and where the wave model has no sea under the boat its figures read as 0. What follows describes the starting place.
- **Place (October):** the sea at Manawatāwhi (the Three Kings Islands), about 55 km north-west of Te Rerenga Wairua (Cape Reinga), looking along the bearing to Hawai'i (32°). September's version stood at the Cape itself. `manawatawhi.ts` (it was `cape-reinga.ts`) holds the Aotearoa clock, the real sun position and the live conditions from Open-Meteo (free, no key; the credit link on the page is a licence condition). These are forecast-model figures for the grid cell at the islands, refreshed every 15 minutes; there is no weather station or wave buoy there. It reads wave, swell and wind-sea height, direction and period, the surface current, the tide, wind speed, gusts and direction, cloud in three layers, rain, visibility, the weather code, CAPE, pressure, air and sea temperature and humidity. What the picture uses: `skyState` (low cloud counts fully, middle cloud less, high cloud little), `rainAmount`, `mistAmount` (visibility), `thunderAmount` (lightning only when there is thunder there), `stormFury` (thunder, gale gusts or a cloudburst), and the measured sea below. Wind, gusts, cloud and rain are the middle answer of four weather models (ECMWF, GFS, ICON, UKMO), because the models differ and nobody measures there; the lowest and highest answers are kept in `doubt`. The waves come from one model (Météo-France MFWAM, about 8 km), as the wave models split swell from wind sea in different ways. **Not used yet:** the current and the tide.
- **Measured sea (October):** while the picture follows the live conditions, `useMeasuredSea` in `gerstner-waves.ts` lays 32 wave trains out as the real sea: the swell (10 trains), a second swell crossing it (8) and the wind's waves (14), at their real significant height and true direction against the view, which always faces Hawai'i. The model gives only three figures for each system (height, mean period, direction), not its spectrum, so each is filled out with the standard shapes: JONSWAP over frequency, cos^2s over direction (`spectrum`), in equal-energy trains; the peak period is worked back from the mean period through the same shape. The scene is in metres. The viewer is on a small boat, eyes 5 m above the water (`EYE_HEIGHT`), carried by the drawn waves (`measuredSeaHeight`; the crest warp is off on a measured sea so that this can be computed). The wind's true direction turns the gust patches, foam streaks, fine ripples, the lean of the rain and the drift of the fog; foam follows the whitecap law of Monahan and O'Muircheartaigh and fine roughness the slopes of Cox and Munk, both from wind speed. The giant swells and the slow "lull" belong to the story and are left out. The weather dial and the story still use September's sea (`useDialSea`). `?pretend=waveHeight:6,windSpeed:70` (names as in `SeaConditions`) replaces live figures, for seeing weather that is not there today. `?date=2026-10-26` shows the sun and moon of another day. Still invented in the live picture: the pitch and roll of the view, the stream of fresh water and its foam line, the shapes and drift of the clouds, and the weave.
- **The four channellers (October, the owner's idea):** in the phase when the moon's light is weakest (fully while less than a tenth of its face is lit, about three days either side of new; not at all past a quarter: `darkness` in `OceanBackground.vue`), at night, four linked channellers sit side by side in the small boat just behind the viewer and weave towards Hawai'i. `channellers.ts` draws them: each sends out a tress of 64 hair-fine filaments, loosely plaited in three strands (the look follows the owner's reference video of the women channelling together in The Wheel of Time: many fine filaments streaming like silk, lit in stretches that travel outward, mostly pale blue-white with a few looser, brighter gold ones; a few drawn lines looked like wire and were rejected) The filaments leave each channeller's two open hands as loose wisps and are drawn into a tress a little way out; each tress also has six broad, soft, very faint "veils", the glow that hangs between its filaments; where the four have joined, each filament is drawn fainter so the middle of the flow keeps its colour, and the strays are calmed as the flow goes down to the horizon. **Thermodynamics, and breaking free of it (the owner's direction):** a filament is energy sent along a line and loses it as energy does (`spent`: with distance it trembles more, dims and cools from white towards blue), and yet along every tress run stretches where the filaments draw together, stop trembling and burn whiter and brighter than they left the hand, stronger the further out they travel (`gathered`): they are taking in energy that was not theirs. The energy they take is shown: the air beside the flow is drawn in towards it and carried along with it (`uFlow`, `uFlowPull` in `fluid.ts`, the air and fog simulation), and shows more near it, as a blur about the filaments; and each tress has soft "halos", doubles of some filaments lying almost on them. The four are not equals (`channelStrength`: each has a strength of their own and a swell and ebb of effort in their own time; a weaker one has fewer filaments alight, fainter, in a thinner tress). Within 3 to 7 metres of the boat, changing second to second (`channelJoin`; the owner's figure, read here as the distance ahead at which they join), the four tresses have run together into a single great flow. It goes out low over the drawn waves, wanders like a river, is carried a little by the real wind across the view (`channelWind`, swaying with the gusts), mounts a few degrees above the horizon and dives into it, fading to nothing. **Holding the boat back (the owner's; the voyage is a sacred pilgrimage and is to take until 1 July 2027):** `carried` in `manawatawhi.ts` works out how fast the surface current and the wind would carry the boat towards Hawai'i by themselves, and `holdingBack` compares it with the pilgrimage's pace (`PACE`, about 1.1 km/h). When they would carry it faster, the four slow the boat, at any hour and whatever the moon, and do not channel towards Hawai'i: each lays their tress out on the water to their own side, spread like the lines of a sea anchor, wide and thin, in the sea's deeper blue, drawn the way the current runs, spent within a few hundred metres, with the light in them travelling slowly back towards the boat (`channelHold`, `channelCurrent`, `channelBack`). It is steady work, not part of the timed story, by as many of them as it takes. `?controls` shows the figures (row "pace"); `?pretend=currentSpeed:3.5,currentDirection:60` shows a current that would carry them too fast. **In stormy weather they link, at any hour (the owner's):** `stormy` (a real storm by the weather data, or a very heavy sea) brings all four in, linked, for as long as it lasts, and takes precedence over holding back. They are seen channelling into the waves to keep them in hand (`channelControl`): the linked flow thrown wide and low over the sea ahead, its filaments riding over each crest and going down into each trough, brightest on the crests. The waves go on doing exactly what the weather data says: the weaving does not alter them. `?pretend=waveHeight:6.5,swellHeight:5,windSpeed:65,windGusts:95` shows it. **They always work with the sea and the wind (the owner's rule), feeding whatever those are already doing by the weather data, never making weather of their own:** the flow is fuller and faster the more is going on (`channelSea`), the wind takes its loose filaments with it, its light rises and falls with each real wave passing under it, and along it the waves stand up to a third steeper and the gusts bite harder (`fed` in the water's vertex shader; not within 30 m of the boat, which rides the sea as measured). **Force and linking only when needed (the owner's rule):** `calling` in `manawatawhi.ts` gives 0..1 how much the sea and wind call for, mostly from whether the weather is building (`building`: the forecast change over the next three hours in wind, wave height and pressure, fetched with the current conditions as `windTrend`, `waveTrend`, `pressureTrend`), with a little from how rough it already is. Under 20% the strongest works alone and lightly; under 40% and 60% one and two more work beside her, each for themselves; from 60% all four link and drive the flow at full force. The flow's light, its light on the water and its feeding of the sea all scale with it. `?controls` shows the figures ("next 3 h", "channellers"); `?pretend=windTrend:18` shows a building wind. The story below is therefore usually quieter than its full form. **How a weave begins and ends (the owner's rules):** a weave runs out from its source, the boat. When it ends, however many are channelling and for whatever reason (the story's pause, the end of a storm or of holding back, daybreak), it is cut off at the source, and it is not wiped away: it has power enough to go on by itself. What has been cut loose keeps travelling out at the pace of what streams along it, the cut end following (a soft, thinning end, not an edge); far out it lingers low on the horizon for about half a minute, its filaments run together into one broad, soft, blurred form, and fades there slowly (`channelHead`, `channelTail`, `channelLinger`, `channelPresence`). A new weave can run out beneath one still lingering, and takes it up if it reaches it. The first version, a quick wipe from the boat to the horizon, was rejected by the owner as awkward and jolting. **Their story (the owner's; `tell` in `channellers.ts`):** they are channelling as the page opens; after 3 to 5 seconds it stops, for 4 to 9 seconds; then the strongest, who always sits second from the right, begins again alone with strength, and the other three link with her one by one within 2 to 5 seconds; once all are linked they drive the flow hard along the surface of the sea (it no longer climbs), faster, wider, in every element's own colour (akasha whiter, air bluer, earth green, fire yellow to red, water a deeper blue, metal grey and half seen through), lighting the water more, for 20 to 25 seconds; then it stops and the sea stays dark for the rest of the visit (the owner's decision). The element colours are graded at the owner's direction: not six paints but leanings of the flow's one pale silver-blue tone (`BASE` and `ELEMENTS`), each going only part of the way to its own colour, by an amount that shifts along the filament and from moment to moment. (The few seconds of ordinary channelling at the start are Claude's reading, not the owner's words.) Whenever there is no channelling at night, on their nights or any other, the boat's electric lamps put a little warm light on the water close round it (`boatLamp`). `channel-path.ts` holds where the braids run, as shader source shared with the water, which they light (`channelLight` in `gerstner-waves.ts`): a bright band under each braid, a faint pool about it, lit from the side so the wave faces show. **The owner's rule: nothing bright may be left hanging in the sky, no "false sun".** While the four work, the weave to the knot is put away. What happens on dark nights at other phases of the moon has not been decided.
- **Night sky (October):** `stars.ts` draws, where they really stand over Manawatāwhi at the time shown: the Yale Bright Star Catalogue (public domain; `public/stars.json`, 9,096 stars as right ascension, declination, magnitude and temperature, converted from github.com/brettonw/YaleBrightStarCatalog); the five naked-eye planets (`planetPositions` in `manawatawhi.ts`, from JPL's approximate orbital elements, with brightness after Meeus); and the Milky Way (`public/milky-way.jpg`, NASA's Deep Star Maps 2020 picture made from the Gaia survey, svs.gsfc.nasa.gov/4851; **it needs the credit shown on the page: NASA/Goddard Space Flight Center Scientific Visualization Studio, ESA/Gaia/DPAC**). All are dimmed near the horizon and mirrored in the sea; the stars' range of brightness is squeezed, as the eye does. They come out as the sky darkens and are dimmed by a bright moon and by cloud (all alike: single clouds do not yet hide what is behind them). Not drawn: shooting stars. `?hour=22` shows a time of day without the panel.
- **True light (October):** the sun is at its real compass direction (no longer halved towards the view), so it is often out of the picture; the exposure opens up as the view turns away from it. `moonPosition` in `manawatawhi.ts` gives the moon's real place and lit share; it is drawn at its true size with its phase, turned to face the sun, shows by day, and lights the sea only when it is up (moonlight goes with the lit share to the power 3.5). With no moon the night is nearly black: the owner knows and has an idea for it. `?look=september` keeps the staged light (`stagedLight`). Known to be wrong still: a heavily overcast day comes out far too dark and brownish, there are no stars, and the sky's colour is not tied to measured haze.
  `?controls` lists every live figure under the sliders.
- **Irregular sea:** twelve wave trains with seeded random headings, lengths and phases, a drifting gust field that roughens some patches and leaves slicks between them, a slow phase warp that bends the crests, and a lull that eases the whole sea over a minute or two.
- **Storm cycle:** `storm-cycle.ts` is a 150-second story that repeats (the owner's idea): rough water, then the weather is worked up into cloud, fog, rain, lightning and giant swells, then a white-out into a still, empty void, then the rough water returns. `weave.ts` is the weave of light, in the 3D scene (the owner's reference was a channelling scene from The Wheel of Time). It is made of threads, not particles: screen-facing ribbons one or two pixels wide with hard edges, either lone needles or six-fibre plied yarn. Six elements (air, earth, fire, water, metal, akasha) share one pale colour with a light tint each; the owner does not want them strongly coloured. They come from the two open palms of one person just behind the camera (left hand air, earth, fire; right hand water, metal, akasha): fanned like fingers, each hand holding an unfinished tapestry: fifteen warp threads lying side by side (some joining part-way along) and six weft threads that cross from edge to edge only in patches, so the cloth is whole in places and loose between them. It gathers strength like a bird's call on a sound diagram: every 6.5 seconds a run of eight notes, each sooner, louder, faster and higher, travels up the threads as fronts of light with a ripple behind (`call` in the thread shader), and the threads thicken and brighten along their length. (The plaited and braided version before this is `.trash/weave.braids.ts`.) They run low over the water and sweep up (going straight they would be seen end-on) to a knot of nested figures (an earlier version gave each element its own path; it is kept in `.trash/weave.elements.ts`), drawn with the same threads, turning about different axes. The knot shapes its surroundings: spiral ripples and a mound on the sea below it (`weaveRipple` in `gerstner-waves.ts`), a twist, rings and an eye in the clouds (`sky-vortex.ts`, another shader patch that throws if Sky.js changes), and rain carried round it. `fluid.ts` is a GPU fluid simulation (Jos Stam's stable fluids, written for this site, no library) covering the screen; the fog and the streaks of air are dyes carried in its flow, pushed by the wind, the bond's vortex about the knot, the charge of the threads and the visitor's pointer. `lightning.ts` makes 3D bolts by midpoint displacement, drawn with the weave's ribbons, from the knot (or high cloud) to a point on the sea. Each flash runs leader, return stroke, one to three further strokes, then cooling; only the thin bolt flickers with the extra strokes, the whole-screen flash stays at two pulses so it never strobes. The bolt acts on the fluid as the literature says it should (sources are cited at the top of `fluid.ts`): no visible blast, but heat that boils off fog and rises, nitric oxide in the core, hydroxyl in a sheath that scales with water vapour, and the two cancelling where they mix (one signed dye channel). `ambientAir` in `cape-reinga.ts` turns air temperature, sea temperature and humidity (live, or a mild humid default) into vapour, instability and fogginess. To keep the load down the fluid rests when there is nothing in the air, a frame-rate watcher drops its pressure iterations from 16 to 10 to 6 on slow machines, and the renderer's pixel ratio is capped at 2. `storm-overlay.ts` now only draws the rain, on a 2D canvas. The weave and the storm are separate levels (`weaveLevel`, `stormLevel`); the story sets both, and the debug sliders set them by hand. The bond (`bondLevel`) is how far the channelling takes hold of the weather: at 0 the fog, air, gusts and rain follow the wind, at 1 they turn about the knot. Debug toggles switch the fog, the air streaks and the lightning ("thunder"; there is no sound) on and off; a veil div and scene fog do the mist. The giant swells are a separate wave set (`surge`) that the camera rides using `giantWaveHeight`. The "storm" debug slider scrubs through the cycle.
- **Time of day:** the sun's elevation and azimuth are the real ones at Cape Reinga for the time in Aotearoa, not the visitor's. Its angle off the view bearing is halved so sunrise and sunset stay near the view. The sky shader's brightness collapses near the horizon, so exposure is raised at dusk using a JavaScript copy of the shader's `sunIntensity()` (`skySunIntensity`). At night the sky keeps the real, set sun and is shown at `NIGHT_EXPOSURE`. The moon is a separate disc mesh (`toneMapped: false`) and is the water's specular light source.
- **Weather (0..1):** split into a sea state (wave height and wind) and a sky state (cloud and rain), both live; the debug slider overrides both. Together they drive cloud coverage and density, turbidity, Mie and Rayleigh scattering, exposure, wave steepness and wavelength, foam, and normal-map speed. It must not move the camera.
- **Camera:** height rises from 18 to 27 with the sea state, to stay above the storm crests (about 25), and in heavy seas it heaves, pitches and rolls like a ship (the owner asked for this; it replaces the earlier rule that weather must not move the camera). Live conditions are no longer floored at 60% storm (October: the sea is shown as calm or as rough as it is). Lightning flashes the exposure. Sway and lightning are off under `prefers-reduced-motion`. The pointer eases yaw ±20° and pitch ±6°.
- **Debug sliders:** hidden for now at the owner's request; add `?controls` to the address to show them. When shown they are inside `<ClientOnly>` because the server's clock and time zone differ from the visitor's.
- **Known issues and open work:**
  - The page text is black and can't be read at night or in a storm.
  - Daytime water could have more colour and sparkle (see the reference: a turquoise, choppy sea with white foam).
  - Storm foam is faint.
  - A bright blob can appear in the water at night where the moon disc is reflected close to the camera.
  - The night sky has a slightly brown tint from the sky shader's ambient term.
- **Navigation:** six versions are kept, chosen in `app.vue`, all with Writing (`/writing`), Art (`/art`), Contact (`/contact`) and a newsletter form. The three pages do not exist in Prismic yet, and the form is not connected to a mailing service; it only says it is not open. The homepage no longer shows its Prismic title and body.
  - **October changes to the default menu (the owner's):** the bar's ground is International Klein Blue (`--klein`, #002fa7), opaque, so its text is WCAG 2.2 AA whatever the picture does (off-white ink 9.5:1, dim tone 5.7:1, white focus ring 10.7:1); the same blue is the ink to use if a light ground is ever wanted (10.7:1 on white). The drawer hangs from the bar in that blue and deepens to the dark green. The items are About (`/about`), Tîr Aho Studio (a link to https://www.tiraho.com.au) and Contact (`/contact`); Writing and Art are out of the menu until there is work to show, though their pages remain. `[uid].vue` shows a page's name and "This page is being written." until it exists in Prismic. The newsletter field has the slab's full width and a line of its own; in the default menu it signs the address up on the owner's Kit form (`newsletter.ts`: Kit form 10029826, posted to as Kit's own embed does; the success line is the owner's, set on the form in Kit). **Google's script is not used (the owner's choice): `NEWSLETTER_CAPTCHA` is false, so the "invisible captcha" must be switched off on the form in Kit, or Kit refuses every address.** Programs are kept out by a hidden trap field and a three-second wait in the form, and by Kit's confirmation email. The code for the captcha (Google reCAPTCHA v3, fetched only when a visitor comes to the field, badge hidden, notice in words) is kept behind that switch. **It has not been tried with a real address: that adds a subscriber to the owner's list, so it is for the owner to do.** The older menus' forms still send nothing. In every menu: "Time there" is "Human time" and carries its time zone ("18:16 (UTC+13, Aotearoa time)", `boatTimeZone`), the "Facing" line is gone, and the Open-Meteo link opens in the same tab without "(opens in a new tab)".
  - The owner chose the moon shape (the default) on 11 October 2026; the others stay reachable.
  - **About page (October):** `app/pages/about.vue` and `AboutPage.vue`: a statement, a picture of the owner, a paragraph or two and links. The owner chose the `panel` layout (11 October 2026), now the default: Klein Blue deepening to green with the moon's edge and the faint trine, as the menu, and the picture as a disc sitting across that edge. `?about=` tries the rest: three more in the panel's family, each from a line of design the site draws on (`almanac`, a ruled page of a nautical almanac headed by the boat's position and time; `klein`, one flat field of Klein's blue; `poster`, the Swiss poster, with the blue as ink on off-white), and the first round's `sheet`, `portrait` and `band`. The picture is the owner's portrait by Amelia J Dowd (`public/about/portrait-square.jpg` and `portrait-tall.jpg`, cropped from the owner's file; it is in git, so pushing would publish it). The statement, the two paragraphs of biography and the three links are the owner's own (given 11 October 2026) and are written into `AboutPage.vue`, not read from Prismic. The address used for Asia Pacific Art Papers (apap.qagoma.qld.gov.au) could not be opened to check and is for the owner to confirm. On narrow screens every layout is one column.
  - **The figure behind the menu's words:** the owner finds the trine (triangle in a circle) too weak. `MenuFigure.vue` draws it and four others to choose from with `?figure=`, each made from the site's real figures for the boat's place and the moment shown: `sky` (the sky over the boat as a round chart, every star that is up, planets, moon in phase, sun, the boat's heading at the top), `voyage` (the track to Hawaiʻi over a grid of latitude and longitude, the part sailed solid, the boat marked), `rose` (a compass rose with each swell and the wind drawn from the side it comes from), `moon` (tonight's moon large, lit part and dark part), and `none`. **The owner chose `sky` (11 October 2026); it is the default in the menu.** Behind the About panel's words it looked untidy and was taken out (the owner's call); `/about?sky=seal` sets it small above the picture, clear of the words, and `?sky=behind` shows it as it was. `OceanBackground` shares the moment shown and the live conditions for it (`scene-moment`, `sea-conditions`).
  - **Contact page (October):** `app/pages/contact.vue` and `ContactPage.vue`: a form with a name, an address to answer to and a message. The owner chose the `letter` (11 October 2026), now the default: a letter with blanks to fill in, Klein's blue on off-white. **It is to work in several languages (the owner's requirement):** all its words come from `letter-words.ts`, one set per language, with the sentence written whole and `{name}` and `{email}` standing where that language puts the blanks; each set carries its language code and writing direction. `?lang=fr` or `?lang=ja` tries one. **Only the English is the owner's; the French and Japanese are Claude's unchecked drafts, there to prove the mechanism. Which languages the site will speak is not yet decided, and the rest of the site is English only.** `?contact=` shows the other designs (`panel`, `signal`, `klein`; English only). Like the About page it is a panel over the picture: it has its own Close and steps aside for the menu. **The form sends nothing yet and says so; the owner will say where messages go.** `[uid].vue` no longer has stand-in pages.
  - **Close on the About page (the owner's expectation):** the About panel has a Close link at its head that leads to the main screen. While the menu is open the About page steps aside (`menu-open`), and pressing Close (or Escape) in the menu there also leads to the main screen, not back to the About panel (`page-is-panel`). On other pages Close only shuts the drawer.
  - **The sky chart and the menu's words (being chosen, 11 October 2026):** with the chart's circle behind the links, the links' hairlines ran across it; the owner called the crossing lines truly awful. `?menu=` tries four ways out: `field` (no circle, the stars alone spread behind the whole drawer), `clear` (the circle stays, the links lose their hairlines), `seal` (the chart small beside the name, nothing over it), `within` (the links set inside the circle, no hairlines); `lines` is how it was. **The owner chose plain `within` (11 October 2026), the default:** `within` (serif links centred in a roomier circle), `within-caps` (small spaced capitals in the sans), `within-left` (a far larger circle running off the edge, links flush left with their numbers), `within-name` (the name inside too, small at the head of the circle).
  - **The signed mark's sharpness:** the bar shows the mark 72px tall from `public/brand/nsa-signed-72.png`, `-144.png` and `-216.png` (one per screen density, chosen with `image-set`), which are the full-size `nsa-signed.png` shrunk smoothly with its faint pen lines lifted so they stay whole. Shrunk by the browser from the full-size image the lines broke into steps (the owner saw it as shearing and pixellation). If the mark's size in the bar changes, make new copies at the new height and its double and triple.
  - **Pause button (the owner's):** in the bar, Pause is the two-bar pause sign alone (a triangle once paused), the size and weight of the bar's capitals, with no ring (a ring was too heavy for so thin a bar), in a 44px button, named for screen readers by the one word "Pause" or "Play". The drawer's "Motion" row still says it in full.
  - **Drawer shapes:** `?shape=` tries other cuts of the drawer's outer edge: `moon` (the default, part of a great disc), `straight`, `wave`, `sail`, `corner`, `full`. On narrow screens it is always a plain sheet. The signed mark and its disc now stay above the open drawer, which used to cut across them.
  - **Menu access (current default):** at the owner's request the Swiss navigation is reached as on the Rick Owens site: a thin bar across the head of the page (Menu and Contact on the left, the signed mark in the middle leading home, Newsletter and Pause on the right; on narrow screens only Menu, mark and Pause), with the slab opening below it as a drawer and the page otherwise left to the picture. The drawer starts shut, sits directly after its button in the page so the keyboard passes into it, shuts on Escape (returning focus to the button) and on following a link. Unlike that site's bar, this one is opaque, to keep text contrast over the moving picture. The slab as it was before the bar is `SiteNavSwissSlab.vue`, shown with `?type=slab`.
  - **Swiss (default), `SiteNavSwiss.vue`:** the owner asked for the dark WCAG slab with the typographic logic of Swiss design, in their own typefaces. One two-column grid (a narrow column for numbers and labels, a wide one for the thing itself), flush left; Helvetica Neue in three weights and three sizes, rank by size and weight only; Lyon Text for information to be read; all spacing in multiples of half the text size. **The typeface files are licensed to the owner and must not be committed: they live in `public/fonts/licensed/`, which is git-ignored, and were copied from the owner's Dropbox brand folder.** Without them the system's Helvetica Neue, Helvetica or Arial, and Georgia, stand in. A second pass, at the owner's request for more space and "Neptune trine Moon", made it airier: light weights (Helvetica Neue Light, and Lyon Display Light for the links), open letter-spacing, long leading, wide margins, the slab cut as part of a great disc so its outer edge is a true arc (and, folded on a wide screen, a small full moon in the corner that is itself the Menu button), a ground running from sea-blue to the owner's green, and a very faint triangle in a circle (the trine) behind the text. The first, bolder pass is in `.trash/SiteNavSwiss.first.vue`. Its colours (off-white on very dark green) come from the owner's NSA* logo; the mark above the name is the owner's signed logo, `public/brand/nsa-signed.png`: a white image with transparency, made from their `Logo Signé/Version 2.psd` (the pen lines over the ring are their signature) and tinted with the ink colour through a CSS mask. Publishing them on the live site needs web-font licences. The owner also pointed at their Morisawa folder; it is not used, as those are Japanese typefaces of 3 to 6 MB each and the site has no Japanese text.
  - **Neptune (`?type=neptune`), `SiteNavNeptune.vue`:** the owner's brief was Neptune, Céline under Phoebe Philo, and Kandinsky's 1930s minimalism, WCAG compliant. An unbleached panel with everything in one deep blue (about 11:1); Jost (self-hosted via `@fontsource-variable/jost`) in small, widely spaced capitals; the three links marked with Kandinsky's circle, triangle and square; and a decorative composition (the planet as a blue circle half off the panel's edge, its broken ring arcs, a line, a camel triangle) that is shown only when the panel has room to spare, so text never runs over it. Same skip link, labelled form, pause button, readout and folding as the Uranus slab.
  - **4788 AD (`?type=4788`), `SiteNav4788.vue`:** the owner's brief was "all humans are slaves to the energy of Uranus", and it must meet WCAG. A near-black slab at the left edge (a band along the bottom on narrow screens), its outer edge cut at Uranus's 7.8 degrees with the rings drawn along the cut; the theme is in the shape, the text is plain, level, large and still, pale cyan on an opaque ground (about 15:1). It holds a skip link, the numbered links, a labelled newsletter form with a worded button and spoken status, and a button that pauses the ocean (`motion-paused` state, read by `OceanBackground.vue`; on from the start under `prefers-reduced-motion`). A first version with the words orbiting a planet was rejected (kept in `.trash/SiteNav4788.orbits.vue`). A second pass that only added features was called typographically lame (kept in `.trash/SiteNav4788.second.vue`). The third pass makes the type carry the idea: every word of the name and every link is set to the same width by `FitWord.vue`, which moves the width axis of the Anybody variable typeface (self-hosted via `@fontsource-variable/anybody`) and adds letter-spacing only if the widest letters fall short; display type leans backwards 7.8 degrees (Uranus turns retrograde), as does the slab's cut; the name is weight 100 and the links weight 900; information is small spaced capitals in the system monospace. It keeps what the second pass added: folding to a rail or bar with a Menu/Close button and Escape (starts folded on narrow screens); the place, time and conditions as a list on the slab (`scene-readout` state from `OceanBackground.vue`, which then leaves out its own caption); larger name and links; a mark for the current page. The first slab, which the owner loved, is kept untouched as `SiteNav4788First.vue` and shown with `?type=4788a`.
  - **6500 AD (`?type=6500`), `SiteNav6500.vue`:** the owner liked this and wants it kept. No typeface: letters redrawn as hair-thin strokes (`GlyphWord.vue`, an SVG glyph set covering only the letters in use; add a glyph before using a new letter), standing on the horizon and moving with it (`--horizon` and `--roll`, set each frame by `OceanBackground.vue`).
  - Rejected earlier: stretched Helvetica, and a stack in Six Caps cut and resewn (kept in `.trash/SiteNav.six-caps.vue`).
- **Weave under the sea:** threads of light fan out from below the knot and run under the viewer, drawn in the water's fragment shader (`weaveGlow` in `gerstner-waves.ts`), always present and brighter as the weave is worked. Until the knot has formed, lightning rises out of the sea (`rising` in `lightning.ts`) instead of coming down.
- **The ship:** removed in October at the owner's request. `.trash/ship.ts` is the ship as it was (burst from below by the weave, burning, sinking), and `.trash/ship.lightning.ts` the version before that. Its wake, the burst in the water shader and its smoke in the fluid went with it; all of it is intact on the `storm-weave` branch.
- **Two waters (the owner's idea):** Hawaiʻi and Aotearoa as places whose power is the meeting of fresh and salt water. In the sea shader a stream of fresh water runs out through the salt from behind the viewer: lighter in colour, with its own current (flow-mapped ripples), eddies on both edges and a foam line where the two meet; and slow bands of smooth water mark internal waves. The weave raises the sea before the storm does. The physics this draws on is real (fresh water floats on salt; mixing them releases about 0.7 kWh per cubic metre; both island groups shed strong internal tides; Hawaiʻi has freshwater springs under the sea); the prophecy is the owner's own framing, and no source for it was found.
- **Water surface:** on top of the waves, `gerstner-waves.ts` adds two fine layers of ripple near the viewer, a second tight highlight for glitter, green-blue light through the thin tops of waves. The owner's reference for the look was a video of a commercial 3D scene ("Infinite Water", 3ditions); nothing from it is used.
- **Accessibility:** the page has a language (`en-GB`) and a default title in `nuxt.config.ts`, `main` landmarks with `id="main"` for the skip link, and the caption sits on an opaque ground. Keep text off the bare ocean: its colours change too much to hold a contrast ratio. The 6500 typography does not meet contrast requirements.
- **Writing:** `/writing` lists articles and `/writing/<uid>` shows one (`app/pages/writing/`, `ArticleTemplate.vue`, `app/utils/article.ts`). It is sized for long art-journal essays: the owner's reference was about 6,200 words with four authors, 29 captioned images, 12 quotations set apart and 12 endnotes, full of Hawaiian diacritics. The ocean shows at the head of the page and the article is on an opaque off-white sheet that scrolls over it (the ocean stops drawing once covered). Same two-column grid as the navigation; Lyon Text at 19px on a 36rem measure; captions beside images in the narrow column; endnotes linked both ways; a print stylesheet.
  - **In Prismic** an article is the new `article` custom type (`customtypes/article/index.json`): one long rich-text body, with labels for what rich text cannot say (`quote` and `caption` on whole paragraphs, `note` on endnote numbers, `haw` and `mi` on Hawaiian and Māori words for screen readers), and a second rich-text field for the endnotes. **The type exists only in this repository so far. It has to be pushed to Prismic with Slice Machine (which needs the owner's or their friend's Prismic login) before articles can be written, and `articleFromPrismic` has not been tried against real content.**
  - `/writing/sample` is a built-in stand-in essay of the same proportions, used to prove the layout. It is listed on `/writing` only while developing.
- **How the page opens (no waiting, no jump; the owner's requirement):** the eye starts at the boat's height, and the picture comes up within half a second from the best figures to hand. In order: the real conditions, which the site's own server fetches and sends out already in the page (`server/api/conditions.get.ts`, one copy kept ten minutes for all visitors; `useFetch` in `OceanBackground.vue`); else the figures this browser saw last, if under six hours old (kept in `localStorage`); else `typicalConditions`, a guess at what the sea is usually like at the boat's latitude (westerlies, trades or doldrums). Whenever real figures arrive, what the picture is drawn from moves over to them over a few seconds (`towardsConditions`), every figure in step, so nothing snaps. Before this the page opened on a stand-in sea seen from September's 18 m and visibly sank to the boat in the first second (the owner noticed the view "ducking"). On a host with no server (a static build) the server route does not exist and the page asks Open-Meteo itself, as before.
- **Opening look (October):** the page opens on the clock in Aotearoa and the live conditions at Manawatāwhi; the weave is still set by hand (11%). Moving the time, weather or storm slider stops it following; the "now" and "live" links resume. September's fixed look, which the owner picked as the reference for sharpness and colour grading (`SEPTEMBER` in `OceanBackground.vue`: 11:03, weather 8%, weave 11%, storm 69%, bond 90%), is at `?look=september`.
- **Owner's preferences:** British English. Plain, short code comments that explain why, not what. Ask before committing, never push, and never delete files (move them to a `.trash/` folder instead).
