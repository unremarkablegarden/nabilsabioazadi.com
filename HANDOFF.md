# Handoff: the storm-and-weave version (September to early October 2026)

This file is for whoever picks the site up next, person or AI assistant. It says what this
version is, where it is kept, how to run it, and what is unfinished. The README's "Notes for
Claude Code" section has the detail on how each part works.

## Where this version is kept

- Git branch `storm-weave`, tagged `storm-weave-2026-10`, in `~/Development/nabilsabioazadi.com`.
- It is saved on this Mac only. Nothing has been pushed to GitHub.
- `main` is untouched: it is still the friend's last commit (`72b8dc9`).
- To see this version again at any time:

  ```bash
  cd ~/Development/nabilsabioazadi.com && git switch storm-weave && bun install && bun run dev
  ```

  then open http://localhost:3000.

## Starting the October version

Start a new branch, so this one stays as it is:

- from this version, to keep its ocean, menu and writing pages: `git switch -c october storm-weave`
- from the friend's original, for a clean start: `git switch -c october main`

## Three things that are not in git and must not be lost

1. **Licensed typefaces**, in `public/fonts/licensed/` (git-ignored on purpose: the repository
   is public). Eight files: Helvetica Neue LT Com (Light, Roman, Medium, Bold), Lyon Text
   (Regular, Regular Italic), Lyon Display (Light, Light Italic). They were copied from
   `Dropbox/+ Studio/NSA* Design Team Folder/Branding Design/Fonts/`. If the folder is ever
   missing, copy them again from there; without them the site falls back to system fonts.
   Putting them on the live site needs web-font licences. This is still an open question.
2. **Node.js and Bun** were installed for this project in `~/.local/node` and `~/.bun`.
3. **The Prismic article type** exists only as a file here (`customtypes/article/index.json`).
   It has not been pushed to Prismic.

## What this version is

- **The ocean**: the sea off Te Rerenga Wairua (Cape Reinga) looking towards Hawaiʻi. Storm,
  fog, rain, lightning, a weave of light from two palms behind the camera, threads under the
  sea, a stream of fresh water through the salt, and a colonial ship that is burst from below
  and burns.
- **The page opens on a fixed look** the owner chose (11:03, weather 8%, weave 11%, storm 69%,
  bond 90%), not on the live clock or weather.
- **Navigation**: a thin top bar (Menu, Contact, signed mark, Newsletter, Pause) with a drawer.
  Swiss typographic logic, Helvetica Neue and Lyon, off-white on dark green, WCAG 2.2 AA.
- **Writing**: `/writing` and `/writing/<uid>`, sized for essays of about 6,000 words with
  images, quotations and endnotes. `/writing/sample` is a stand-in essay.

### Addresses worth knowing

| Address | Shows |
|---|---|
| `/?controls` | the sliders for time, weather, story, weave, storm, bond, and the fog, air and thunder switches |
| `/?type=slab` | the Swiss slab before it became a top bar |
| `/?type=neptune` | the Neptune, Céline and Kandinsky panel |
| `/?type=4788` | the Uranus slab with equal-width words |
| `/?type=4788a` | the first Uranus slab, which the owner loved |
| `/?type=6500` | hairline letters standing on the horizon |
| `/writing/sample` | the stand-in long essay |

Earlier versions of several parts are kept in `.trash/` (the rule here is never to delete).

## Unfinished, and things only the owner can decide

- **Nothing is deployed.** The live site is whatever the friend last published.
- **The Writing, Art and Contact pages have no content.** Art and Contact do not exist at all.
- **The newsletter form sends nothing.** It needs a mailing service.
- **Contact**: not decided whether it is an email link or a form. The owner's address is not on the site.
- **Prismic**: the article type needs pushing with Slice Machine (needs a Prismic login), and
  the code that reads an article from Prismic has not been tried on a real one.
- **Web-font licences** for Helvetica Neue and Lyon.
- **The signed logo** (`public/brand/nsa-signed.png`) is in git, so pushing this branch would
  publish the owner's signature on GitHub. They were told and have not objected.

## Not verified

The preview pane was hidden for much of the work, which pauses animation. These were built and
compile, but were only seen in stills or not at all:

- the ship's full sequence in motion (the burst itself, masts falling, rolling, sinking);
- the bird-call pulses in the weave;
- cloud twisting round the knot;
- the folded menu and the article page on a real phone;
- a screen reader or automated accessibility audit. Contrast and control sizes were measured.

## How the owner likes to work

- British English. Plain, short code comments that say why.
- Ask before committing. Never push. Never delete: move things to `.trash/`.
- WCAG compliance matters. Keep text off the bare ocean.
- Not over-coloured: the weave is nearly one pale colour.
- They give direction through references and images (fashion houses, painters, astrology,
  The Wheel of Time, Aotearoa and Hawaiʻi) and iterate quickly; keep each version they like
  reachable when trying the next.
- They are not a programmer. Explain in plain words and give exact addresses to open.
