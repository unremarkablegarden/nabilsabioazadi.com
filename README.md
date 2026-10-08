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
- In the top right corner there are two sliders. They only appear while running locally, never on the live site:
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
- **Time of day:** the sun's elevation and azimuth come from the local hour (rises 06:00, sets 18:00, peaks 60°). The sky shader's brightness collapses near the horizon, so exposure is raised at dusk using a JavaScript copy of the shader's `sunIntensity()` (`skySunIntensity`). At night the sky keeps the real, set sun and is shown at `NIGHT_EXPOSURE`. The moon is a separate disc mesh (`toneMapped: false`) and is the water's specular light source.
- **Weather (0..1):** drives cloud coverage and density, turbidity, Mie and Rayleigh scattering, exposure, wave steepness and wavelength, foam, and normal-map speed. It must not move the camera.
- **Camera:** fixed position at height 18, which is above the highest storm crests (about 14). The pointer eases yaw ±20° and pitch ±6°.
- **Debug sliders:** shown only when `import.meta.dev` is true, inside `<ClientOnly>` because the server's clock and time zone differ from the visitor's.
- **Known issues and open work:**
  - The page text is black and can't be read at night or in a storm.
  - Daytime water could have more colour and sparkle (see the reference: a turquoise, choppy sea with white foam).
  - Storm foam is faint.
  - A bright blob can appear in the water at night where the moon disc is reflected close to the camera.
  - The night sky has a slightly brown tint from the sky shader's ambient term.
- **Owner's preferences:** British English. Plain, short code comments that explain why, not what. Ask before committing, never push, and never delete files (move them to a `.trash/` folder instead).
