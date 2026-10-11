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
- **Place:** the sea off Te Rerenga Wairua (Cape Reinga), looking along the bearing to Hawai'i (31°). `cape-reinga.ts` holds the Aotearoa clock, the real sun position and the live conditions from Open-Meteo (free, no key; the credit link on the page is a licence condition). The wind always blows away from the viewer, towards Hawai'i, whatever the real wind direction: this is the owner's choice. Only its strength is live.
- **Irregular sea:** twelve wave trains with seeded random headings, lengths and phases, a drifting gust field that roughens some patches and leaves slicks between them, a slow phase warp that bends the crests, and a lull that eases the whole sea over a minute or two.
- **Storm cycle:** `storm-cycle.ts` is a 150-second story that repeats (the owner's idea): rough water, then the weather is worked up into cloud, fog, rain, lightning and giant swells, then a white-out into a still, empty void, then the rough water returns. `weave.ts` is the weave of light, in the 3D scene (the owner's reference was a channelling scene from The Wheel of Time). It is made of threads, not particles: screen-facing ribbons one or two pixels wide with hard edges, either lone needles or six-fibre plied yarn. Six elements (air, earth, fire, water, metal, akasha) share one pale colour with a light tint each; the owner does not want them strongly coloured. They come from the two open palms of one person just behind the camera (left hand air, earth, fire; right hand water, metal, akasha): fanned like fingers, each hand holding an unfinished tapestry: fifteen warp threads lying side by side (some joining part-way along) and six weft threads that cross from edge to edge only in patches, so the cloth is whole in places and loose between them. It gathers strength like a bird's call on a sound diagram: every 6.5 seconds a run of eight notes, each sooner, louder, faster and higher, travels up the threads as fronts of light with a ripple behind (`call` in the thread shader), and the threads thicken and brighten along their length. (The plaited and braided version before this is `.trash/weave.braids.ts`.) They run low over the water and sweep up (going straight they would be seen end-on) to a knot of nested figures (an earlier version gave each element its own path; it is kept in `.trash/weave.elements.ts`), drawn with the same threads, turning about different axes. The knot shapes its surroundings: spiral ripples and a mound on the sea below it (`weaveRipple` in `gerstner-waves.ts`), a twist, rings and an eye in the clouds (`sky-vortex.ts`, another shader patch that throws if Sky.js changes), and rain carried round it. `fluid.ts` is a GPU fluid simulation (Jos Stam's stable fluids, written for this site, no library) covering the screen; the fog and the streaks of air are dyes carried in its flow, pushed by the wind, the bond's vortex about the knot, the charge of the threads and the visitor's pointer. `lightning.ts` makes 3D bolts by midpoint displacement, drawn with the weave's ribbons, from the knot (or high cloud) to a point on the sea. Each flash runs leader, return stroke, one to three further strokes, then cooling; only the thin bolt flickers with the extra strokes, the whole-screen flash stays at two pulses so it never strobes. The bolt acts on the fluid as the literature says it should (sources are cited at the top of `fluid.ts`): no visible blast, but heat that boils off fog and rises, nitric oxide in the core, hydroxyl in a sheath that scales with water vapour, and the two cancelling where they mix (one signed dye channel). `ambientAir` in `cape-reinga.ts` turns air temperature, sea temperature and humidity (live, or a mild humid default) into vapour, instability and fogginess. To keep the load down the fluid rests when there is nothing in the air, a frame-rate watcher drops its pressure iterations from 16 to 10 to 6 on slow machines, and the renderer's pixel ratio is capped at 2. `storm-overlay.ts` now only draws the rain, on a 2D canvas. The weave and the storm are separate levels (`weaveLevel`, `stormLevel`); the story sets both, and the debug sliders set them by hand. The bond (`bondLevel`) is how far the channelling takes hold of the weather: at 0 the fog, air, gusts and rain follow the wind, at 1 they turn about the knot. Debug toggles switch the fog, the air streaks and the lightning ("thunder"; there is no sound) on and off; a veil div and scene fog do the mist. The giant swells are a separate wave set (`surge`) that the camera rides using `giantWaveHeight`. The "storm" debug slider scrubs through the cycle.
- **Time of day:** the sun's elevation and azimuth are the real ones at Cape Reinga for the time in Aotearoa, not the visitor's. Its angle off the view bearing is halved so sunrise and sunset stay near the view. The sky shader's brightness collapses near the horizon, so exposure is raised at dusk using a JavaScript copy of the shader's `sunIntensity()` (`skySunIntensity`). At night the sky keeps the real, set sun and is shown at `NIGHT_EXPOSURE`. The moon is a separate disc mesh (`toneMapped: false`) and is the water's specular light source.
- **Weather (0..1):** split into a sea state (wave height and wind) and a sky state (cloud and rain), both live; the debug slider overrides both. Together they drive cloud coverage and density, turbidity, Mie and Rayleigh scattering, exposure, wave steepness and wavelength, foam, and normal-map speed. It must not move the camera.
- **Camera:** height rises from 18 to 27 with the sea state, to stay above the storm crests (about 25), and in heavy seas it heaves, pitches and rolls like a ship (the owner asked for this; it replaces the earlier rule that weather must not move the camera). Live conditions are floored at 60% storm (`STORM_FLOOR`), and lightning flashes the exposure. Sway and lightning are off under `prefers-reduced-motion`. The pointer eases yaw ±20° and pitch ±6°.
- **Debug sliders:** hidden for now at the owner's request; add `?controls` to the address to show them. When shown they are inside `<ClientOnly>` because the server's clock and time zone differ from the visitor's.
- **Known issues and open work:**
  - The page text is black and can't be read at night or in a storm.
  - Daytime water could have more colour and sparkle (see the reference: a turquoise, choppy sea with white foam).
  - Storm foam is faint.
  - A bright blob can appear in the water at night where the moon disc is reflected close to the camera.
  - The night sky has a slightly brown tint from the sky shader's ambient term.
- **Navigation:** six versions are kept, chosen in `app.vue`, all with Writing (`/writing`), Art (`/art`), Contact (`/contact`) and a newsletter form. The three pages do not exist in Prismic yet, and the form is not connected to a mailing service; it only says it is not open. The homepage no longer shows its Prismic title and body.
  - **Menu access (current default):** at the owner's request the Swiss navigation is reached as on the Rick Owens site: a thin bar across the head of the page (Menu and Contact on the left, the signed mark in the middle leading home, Newsletter and Pause on the right; on narrow screens only Menu, mark and Pause), with the slab opening below it as a drawer and the page otherwise left to the picture. The drawer starts shut, sits directly after its button in the page so the keyboard passes into it, shuts on Escape (returning focus to the button) and on following a link. Unlike that site's bar, this one is opaque, to keep text contrast over the moving picture. The slab as it was before the bar is `SiteNavSwissSlab.vue`, shown with `?type=slab`.
  - **Swiss (default), `SiteNavSwiss.vue`:** the owner asked for the dark WCAG slab with the typographic logic of Swiss design, in their own typefaces. One two-column grid (a narrow column for numbers and labels, a wide one for the thing itself), flush left; Helvetica Neue in three weights and three sizes, rank by size and weight only; Lyon Text for information to be read; all spacing in multiples of half the text size. **The typeface files are licensed to the owner and must not be committed: they live in `public/fonts/licensed/`, which is git-ignored, and were copied from the owner's Dropbox brand folder.** Without them the system's Helvetica Neue, Helvetica or Arial, and Georgia, stand in. A second pass, at the owner's request for more space and "Neptune trine Moon", made it airier: light weights (Helvetica Neue Light, and Lyon Display Light for the links), open letter-spacing, long leading, wide margins, the slab cut as part of a great disc so its outer edge is a true arc (and, folded on a wide screen, a small full moon in the corner that is itself the Menu button), a ground running from sea-blue to the owner's green, and a very faint triangle in a circle (the trine) behind the text. The first, bolder pass is in `.trash/SiteNavSwiss.first.vue`. Its colours (off-white on very dark green) come from the owner's NSA* logo; the mark above the name is the owner's signed logo, `public/brand/nsa-signed.png`: a white image with transparency, made from their `Logo Signé/Version 2.psd` (the pen lines over the ring are their signature) and tinted with the ink colour through a CSS mask. Publishing them on the live site needs web-font licences. The owner also pointed at their Morisawa folder; it is not used, as those are Japanese typefaces of 3 to 6 MB each and the site has no Japanese text.
  - **Neptune (`?type=neptune`), `SiteNavNeptune.vue`:** the owner's brief was Neptune, Céline under Phoebe Philo, and Kandinsky's 1930s minimalism, WCAG compliant. An unbleached panel with everything in one deep blue (about 11:1); Jost (self-hosted via `@fontsource-variable/jost`) in small, widely spaced capitals; the three links marked with Kandinsky's circle, triangle and square; and a decorative composition (the planet as a blue circle half off the panel's edge, its broken ring arcs, a line, a camel triangle) that is shown only when the panel has room to spare, so text never runs over it. Same skip link, labelled form, pause button, readout and folding as the Uranus slab.
  - **4788 AD (`?type=4788`), `SiteNav4788.vue`:** the owner's brief was "all humans are slaves to the energy of Uranus", and it must meet WCAG. A near-black slab at the left edge (a band along the bottom on narrow screens), its outer edge cut at Uranus's 7.8 degrees with the rings drawn along the cut; the theme is in the shape, the text is plain, level, large and still, pale cyan on an opaque ground (about 15:1). It holds a skip link, the numbered links, a labelled newsletter form with a worded button and spoken status, and a button that pauses the ocean (`motion-paused` state, read by `OceanBackground.vue`; on from the start under `prefers-reduced-motion`). A first version with the words orbiting a planet was rejected (kept in `.trash/SiteNav4788.orbits.vue`). A second pass that only added features was called typographically lame (kept in `.trash/SiteNav4788.second.vue`). The third pass makes the type carry the idea: every word of the name and every link is set to the same width by `FitWord.vue`, which moves the width axis of the Anybody variable typeface (self-hosted via `@fontsource-variable/anybody`) and adds letter-spacing only if the widest letters fall short; display type leans backwards 7.8 degrees (Uranus turns retrograde), as does the slab's cut; the name is weight 100 and the links weight 900; information is small spaced capitals in the system monospace. It keeps what the second pass added: folding to a rail or bar with a Menu/Close button and Escape (starts folded on narrow screens); the place, time and conditions as a list on the slab (`scene-readout` state from `OceanBackground.vue`, which then leaves out its own caption); larger name and links; a mark for the current page. The first slab, which the owner loved, is kept untouched as `SiteNav4788First.vue` and shown with `?type=4788a`.
  - **6500 AD (`?type=6500`), `SiteNav6500.vue`:** the owner liked this and wants it kept. No typeface: letters redrawn as hair-thin strokes (`GlyphWord.vue`, an SVG glyph set covering only the letters in use; add a glyph before using a new letter), standing on the horizon and moving with it (`--horizon` and `--roll`, set each frame by `OceanBackground.vue`).
  - Rejected earlier: stretched Helvetica, and a stack in Six Caps cut and resewn (kept in `.trash/SiteNav.six-caps.vue`).
- **Weave under the sea:** threads of light fan out from below the knot and run under the viewer, drawn in the water's fragment shader (`weaveGlow` in `gerstner-waves.ts`), always present and brighter as the weave is worked. Until the knot has formed, lightning rises out of the sea (`rising` in `lightning.ts`) instead of coming down.
- **The ship:** `ship.ts`. Every one to three minutes a three-masted ship of Cook's era crosses the view left to right. She is no longer struck by lightning: the weave channels fire and air under the sea to a point beneath her bow, where the water glows, boils and domes for five seconds and then bursts (`burst` and `burstLight` in the water shader), throwing her bow up and setting it alight. She burns from the bow aft, driven by the wind as set out at the top of the file (drive and heel with the square of the wind and the canvas standing, fire spreading upward and the way the flames lean, masts falling to leeward when their shrouds burn through), and goes down by the head. She is four flat pictures drawn with the 2D canvas. Her light is worked out for any hour: skylight on the hull, sun or moon through the sailcloth when it is behind her, orange when low, dim under storm cloud, greyed by mist. The lightning version is `.trash/ship.lightning.ts`.
- **Two waters (the owner's idea):** Hawaiʻi and Aotearoa as places whose power is the meeting of fresh and salt water. In the sea shader a stream of fresh water runs out through the salt from behind the viewer: lighter in colour, with its own current (flow-mapped ripples), eddies on both edges and a foam line where the two meet; and slow bands of smooth water mark internal waves. The weave raises the sea before the storm does. The physics this draws on is real (fresh water floats on salt; mixing them releases about 0.7 kWh per cubic metre; both island groups shed strong internal tides; Hawaiʻi has freshwater springs under the sea); the prophecy is the owner's own framing, and no source for it was found.
- **Water surface:** on top of the waves, `gerstner-waves.ts` adds two fine layers of ripple near the viewer, a second tight highlight for glitter, green-blue light through the thin tops of waves, and the ship's wake (churn astern and Kelvin arms). The owner's reference for the look was a video of a commercial 3D scene ("Infinite Water", 3ditions); nothing from it is used.
- **Accessibility:** the page has a language (`en-GB`) and a default title in `nuxt.config.ts`, `main` landmarks with `id="main"` for the skip link, and the caption sits on an opaque ground. Keep text off the bare ocean: its colours change too much to hold a contrast ratio. The 6500 typography does not meet contrast requirements.
- **Writing:** `/writing` lists articles and `/writing/<uid>` shows one (`app/pages/writing/`, `ArticleTemplate.vue`, `app/utils/article.ts`). It is sized for long art-journal essays: the owner's reference was about 6,200 words with four authors, 29 captioned images, 12 quotations set apart and 12 endnotes, full of Hawaiian diacritics. The ocean shows at the head of the page and the article is on an opaque off-white sheet that scrolls over it (the ocean stops drawing once covered). Same two-column grid as the navigation; Lyon Text at 19px on a 36rem measure; captions beside images in the narrow column; endnotes linked both ways; a print stylesheet.
  - **In Prismic** an article is the new `article` custom type (`customtypes/article/index.json`): one long rich-text body, with labels for what rich text cannot say (`quote` and `caption` on whole paragraphs, `note` on endnote numbers, `haw` and `mi` on Hawaiian and Māori words for screen readers), and a second rich-text field for the endnotes. **The type exists only in this repository so far. It has to be pushed to Prismic with Slice Machine (which needs the owner's or their friend's Prismic login) before articles can be written, and `articleFromPrismic` has not been tried against real content.**
  - `/writing/sample` is a built-in stand-in essay of the same proportions, used to prove the layout. It is listed on `/writing` only while developing.
- **Opening look:** the page opens on fixed settings the owner picked as the reference for sharpness and colour grading (`OPENING` in `OceanBackground.vue`: 11:03, weather 8%, weave 11%, storm 69%, bond 90%), not on the live clock, live conditions or the story. Those start from the "now", "live" and "play" links in the debug panel.
- **Owner's preferences:** British English. Plain, short code comments that explain why, not what. Ask before committing, never push, and never delete files (move them to a `.trash/` folder instead).
