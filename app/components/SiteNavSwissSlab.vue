<script setup lang="ts">
// The dark slab again, built to meet WCAG 2.2 AA, with its type set by the logic of Swiss
// (International Style) typography and in the owner's own typefaces.
//
//   One grid. Everything hangs from two vertical lines: a narrow column for what a thing is
//   (its number or its label) and a wide column for the thing itself. Nothing is centred,
//   nothing is justified, nothing leans: flush left, ragged right.
//
//   One sans, few sizes. Helvetica Neue in three weights and three sizes. Rank is shown by size
//   and weight alone, never by capitals, spacing-out, colour or ornament. Large type is set
//   tight and solid; small type is given air.
//
//   A second voice for reading. Lyon, a serif, is used only for running information: the
//   things you read, as against the things you act on.
//
//   A common unit. Every space is a multiple of half the text size, so the lines of the two
//   columns keep step down the slab.
//
// Second pass, at the owner's direction: more spacious, and "Neptune trine Moon", the aspect of
// ease between the planet of the sea and dreams and the Moon. So:
//   - light weights instead of bold, open letter-spacing, long leading, and wider margins;
//   - the links in Lyon Display Light, a serif with a soft, drawn-out line, in place of bold sans;
//   - the slab's outer edge is no longer cut straight: it is the curved limb of a moon;
//   - the ground deepens from the owner's dark green at the foot to sea-blue at the head, and
//     the ink is the off-white of the mark, like pearl;
//   - behind the text, very faint, a circle with a triangle in it: the trine, three points a
//     third of the circle apart, which is also the three links.
//
// The typeface files are licensed to the owner and are kept out of this public repository
// (public/fonts/licensed/ is git-ignored). Where they are missing, the system's own Helvetica
// Neue, Helvetica or Arial, and Georgia, stand in.
//
// Accessibility is as in the earlier slabs: all text is on an opaque ground (about 16:1),
// nothing moves, controls are at least 44px tall with a white focus ring, the form is labelled
// and speaks its status, there is a skip link, the ocean can be paused, and the slab folds away.

// Shared with OceanBackground, which stops drawing while this is true.
const paused = useState("motion-paused", () => false);
// Filled in by OceanBackground. This slab shows it, so the floating caption is turned off.
const readout = useState<{ place?: string; time: string; waves?: string; wind?: string }>("scene-readout", () => ({ time: "" }));
const captionInNavigation = useState("caption-in-navigation", () => false);
captionInNavigation.value = true;
onBeforeUnmount(() => (captionInNavigation.value = false));

const open = ref(true);
onMounted(() => {
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) paused.value = true;
	// On a small screen the open slab would cover most of the picture.
	if (window.matchMedia("(max-width: 720px)").matches) open.value = false;
});

// The newsletter form has nowhere to send addresses yet, so it says so instead of pretending.
const email = ref("");
const notice = ref("");
const join = () => {
	notice.value = "Sign-up is not open yet. Your address was not sent anywhere.";
};

const links = [
	{ to: "/writing", label: "Writing" },
	{ to: "/art", label: "Art" },
	{ to: "/contact", label: "Contact" },
];
</script>

<template>
	<header class="slab" :class="{ folded: !open }" @keydown.esc="open = false">
		<a class="skip" href="#main">Skip to content</a>
		<!-- Decoration only: the trine, an equilateral triangle in a circle, very faint behind the text. -->
		<svg class="trine" viewBox="0 0 200 200" aria-hidden="true">
			<circle cx="100" cy="100" r="96" />
			<path d="M100 4 L183.1 148 L16.9 148 Z" />
		</svg>

		<div class="row bar">
			<button type="button" class="outline key" :aria-expanded="open" aria-controls="slab-body" @click="open = !open">
				{{ open ? "Close" : "Menu" }}
			</button>
			<!-- The name in small, for when the slab is folded to a bar and the large name is out of sight. -->
			<span v-if="!open" class="tag">Nabil Sabio Azadi</span>
		</div>

		<div v-show="open" id="slab-body" class="body">
			<!-- The owner's mark with their signature, made from their own artwork (Logo Signé, Version 2)
			     as a single-colour image that takes the ink colour. The name is set beside it as text,
			     so the image is hidden from screen readers. -->
			<span class="mark" aria-hidden="true" />
			<div class="row">
				<p class="name">Nabil<br />Sabio<br />Azadi</p>
			</div>

			<nav aria-label="Main">
				<ol>
					<li v-for="(link, i) in links" :key="link.to">
						<NuxtLink :to="link.to" class="row" :aria-label="link.label">
							<span class="key" aria-hidden="true">0{{ i + 1 }}</span>
							<span class="title" aria-hidden="true">{{ link.label }}</span>
						</NuxtLink>
					</li>
				</ol>
			</nav>

			<form class="row rule" @submit.prevent="join">
				<label for="news-email" class="key">Newsletter</label>
				<div>
					<p id="news-hint" class="reading">Your email address</p>
					<div class="field">
						<input id="news-email" v-model="email" type="email" required autocomplete="email" aria-describedby="news-hint news-status" />
						<button type="submit" class="solid">Join</button>
					</div>
					<p id="news-status" class="reading" role="status">{{ notice }}</p>
				</div>
			</form>

			<div class="foot">
				<dl>
					<div class="row rule">
						<dt class="key">Place</dt>
						<dd class="reading">{{ readout.place }}</dd>
					</div>
					<div v-if="readout.time" class="row rule">
						<dt class="key">Human time</dt>
						<dd class="reading">{{ readout.time }}</dd>
					</div>
					<div v-if="readout.waves" class="row rule">
						<dt class="key">Waves</dt>
						<dd class="reading">{{ readout.waves }}</dd>
					</div>
					<div v-if="readout.wind" class="row rule">
						<dt class="key">Wind</dt>
						<dd class="reading">{{ readout.wind }}</dd>
					</div>
				</dl>
				<div class="row rule">
					<span class="key">Data</span>
					<a class="reading link" href="https://open-meteo.com/">Open-Meteo</a>
				</div>
				<div class="row rule">
					<span class="key">Sky</span>
					<span class="reading">Milky Way: NASA/Goddard Space Flight Center Scientific Visualization Studio, ESA/Gaia/DPAC</span>
				</div>
				<div class="row rule">
					<span class="key">Motion</span>
					<button type="button" class="reading link" :aria-pressed="paused" @click="paused = !paused">
						{{ paused ? "Play the moving background" : "Pause the moving background" }}
					</button>
				</div>
			</div>
		</div>
	</header>
</template>

<style scoped>
@font-face {
	font-family: "Helvetica Neue LT";
	src: url("/fonts/licensed/HelveticaNeueLTCom-Roman.ttf") format("truetype");
	font-weight: 400;
	font-display: swap;
}
@font-face {
	font-family: "Helvetica Neue LT";
	src: url("/fonts/licensed/HelveticaNeueLTCom-Md.ttf") format("truetype");
	font-weight: 500;
	font-display: swap;
}
@font-face {
	font-family: "Helvetica Neue LT";
	src: url("/fonts/licensed/HelveticaNeueLTCom-Bd.ttf") format("truetype");
	font-weight: 700;
	font-display: swap;
}
@font-face {
	font-family: "Helvetica Neue LT";
	src: url("/fonts/licensed/HelveticaNeueLTCom-Lt.ttf") format("truetype");
	font-weight: 300;
	font-display: swap;
}
@font-face {
	font-family: "Lyon Display";
	src: url("/fonts/licensed/LyonDisplay-Light.otf") format("opentype");
	font-weight: 300;
	font-display: swap;
}
@font-face {
	font-family: "Lyon Display";
	src: url("/fonts/licensed/LyonDisplay-LightItalic.otf") format("opentype");
	font-weight: 300;
	font-style: italic;
	font-display: swap;
}
@font-face {
	font-family: "Lyon Text";
	src: url("/fonts/licensed/LyonText-Regular.otf") format("opentype");
	font-weight: 400;
	font-display: swap;
}
@font-face {
	font-family: "Lyon Text";
	src: url("/fonts/licensed/LyonText-RegularItalic.otf") format("opentype");
	font-weight: 400;
	font-style: italic;
	font-display: swap;
}

.slab {
	/* Pearl on deep sea: the owner's off-white, on a ground that runs from sea-blue at the head
	   to their dark green at the foot. About 15:1 throughout; the dimmer tone about 9:1. */
	--ground: #10211a;
	--deep: #0b1f2e;
	--ink: #f4f1e8;
	--dim: #b4c0b3;
	/* The unit all spacing is a multiple of, and the width of the narrow column. */
	--unit: 0.5rem;
	--key: 6.5rem;
	position: fixed;
	z-index: 20;
	inset: 0 auto 0 0;
	box-sizing: border-box;
	width: 33rem;
	max-width: 100vw;
	/* Wide margins, and more on the right and at the foot, where the curved edge takes some of the slab away. */
	padding: calc(var(--unit) * 6) 9.5rem calc(var(--unit) * 14) calc(var(--unit) * 6);
	overflow-y: auto;
	background: linear-gradient(to bottom, var(--deep), var(--ground));
	color: var(--ink);
	/* The slab is part of a great disc: its outer edge is a true arc of a circle, the lit limb of
	   a moon, bowing out to the slab's full width at mid-height and falling well back at head and foot. */
	--radius: 78vh;
	clip-path: circle(var(--radius) at calc(100% - var(--radius)) 50%);
	font: 300 1rem/1.75 "Helvetica Neue LT", "Helvetica Neue", Helvetica, Arial, sans-serif;
	letter-spacing: 0.03em;
}
/* Folded, on a wide screen, it is a small full moon in the corner, and the whole of it is the button. */
.slab.folded {
	inset: calc(var(--unit) * 3) auto auto calc(var(--unit) * 3);
	width: 6rem;
	height: 6rem;
	padding: 0;
	overflow: hidden;
	clip-path: circle(50%);
}
.folded .bar {
	display: block;
	height: 100%;
}
.folded .outline {
	width: 100%;
	height: 100%;
	padding: 0;
	border: 0;
	border-radius: 50%;
}
/* The ring cannot sit outside a round, clipped button, so it is drawn inside it. */
.folded .outline:focus-visible {
	outline-offset: -6px;
}
/* Faint enough to make no difference to the contrast of the text over it. */
.trine {
	position: absolute;
	top: 22%;
	left: 8%;
	width: 70%;
	fill: none;
	stroke: var(--ink);
	stroke-width: 0.4;
	opacity: 0.16;
	pointer-events: none;
}
.folded .trine {
	display: none;
}
.bar,
.body {
	position: relative;
}

/* The grid: a narrow column and a wide one. Every row of the slab is set on it. */
.row {
	display: grid;
	grid-template-columns: var(--key) minmax(0, 1fr);
	column-gap: calc(var(--unit) * 3);
	align-items: baseline;
}
/* Rows of information are parted by a hairline, with one unit above and below. */
.rule {
	padding: calc(var(--unit) * 1.5) 0;
	border-top: 1px solid rgb(180 192 179 / 0.45);
}

/* Small size: what a thing is. Small capitals set wide apart, with room round them. */
.key {
	font-size: 0.75rem;
	font-weight: 400;
	line-height: 1.75rem;
	letter-spacing: 0.18em;
	text-transform: uppercase;
	color: var(--dim);
}
/* Reading size, in the serif: information to be read, on long leading. */
.reading {
	font: 400 1.0625rem/1.75rem "Lyon Text", Georgia, "Times New Roman", serif;
	letter-spacing: 0.01em;
}

.bar {
	align-items: center;
	margin-bottom: calc(var(--unit) * 7);
}
.folded .bar {
	margin-bottom: 0;
}
.tag {
	display: none;
	font-weight: 400;
	letter-spacing: 0.08em;
}

/* The mark stands alone above the name, large enough for the pen line to be seen. The loops of
   the signature reach out past the ring, so it is hung a little outside the left-hand line,
   which puts the ring itself close to that line. */
.mark {
	display: block;
	width: 13rem;
	max-width: 70%;
	aspect-ratio: 733 / 757;
	margin: calc(var(--unit) * -2) 0 calc(var(--unit) * 5) -1.75rem;
	background: var(--ink);
	-webkit-mask: url("/brand/nsa-signed.png") center / contain no-repeat;
	mask: url("/brand/nsa-signed.png") center / contain no-repeat;
}
/* Middle size: the name, hung on the wide column's line, set solid. */
.name {
	grid-column: 2;
	font-size: 1.5rem;
	font-weight: 300;
	line-height: 1.4;
	letter-spacing: 0.08em;
}

/* Largest size: the three things to do. */
ol {
	margin: calc(var(--unit) * 8) 0 0;
}
/* The next hairline, above the newsletter, closes the list. */
form.rule {
	padding-top: calc(var(--unit) * 4);
	padding-bottom: calc(var(--unit) * 3);
}
nav a {
	min-height: 5rem;
	padding: calc(var(--unit) * 1.5) 0;
	box-sizing: border-box;
	border-top: 1px solid rgb(180 192 179 / 0.45);
}
/* Largest size: the serif, light, with air between the letters and above and below. */
.title {
	font: 300 3rem/1.25 "Lyon Display", "Lyon Text", Georgia, serif;
	letter-spacing: 0.015em;
}
nav a:hover .title,
nav a:focus-visible .title,
nav a[aria-current="page"] .title {
	font-style: italic;
}
/* Hover and focus turn the row over: dark on light, the same contrast the other way round. */
nav a:hover,
nav a:focus-visible {
	background: var(--ink);
	color: var(--ground);
	box-shadow: calc(var(--unit) * -1) 0 0 var(--ink), var(--unit) 0 0 var(--ink);
}
nav a:hover .key,
nav a:focus-visible .key {
	color: var(--ground);
}
/* The page being viewed is marked with a solid square in the narrow column: shape, not colour alone. */
nav a[aria-current="page"] .key::after {
	content: " ■";
	color: var(--ink);
}

.field {
	display: flex;
	gap: calc(var(--unit) * 2);
	margin: var(--unit) 0;
}
input {
	flex: 1;
	min-width: 0;
	min-height: 2.75rem;
	border-bottom: 1px solid var(--ink);
	background: transparent;
	color: var(--ink);
	font: inherit;
}
button {
	min-height: 2.75rem;
	font: inherit;
	cursor: pointer;
}
.outline,
.solid {
	justify-self: start;
	padding: 0 calc(var(--unit) * 3);
	border: 1px solid var(--ink);
	border-radius: 2rem;
	color: var(--ink);
	font-size: 0.75rem;
	font-weight: 400;
	letter-spacing: 0.18em;
	text-transform: uppercase;
}
.solid:hover,
.solid:focus-visible,
.outline:hover,
.outline:focus-visible {
	background: var(--ink);
	color: var(--ground);
}
[role="status"] {
	min-height: 1.5rem;
	font-style: italic;
}
.link {
	min-height: 2.75rem;
	padding: 0;
	text-align: left;
	text-decoration: underline;
	text-decoration-thickness: 1px;
	text-underline-offset: 0.2em;
}
a.link {
	display: inline-flex;
	align-items: center;
}
.foot .row {
	align-items: center;
}
.foot dl .row {
	align-items: baseline;
}

/* One focus ring for everything: white, thick, clear of the control. */
a:focus-visible,
button:focus-visible,
input:focus-visible {
	outline: 3px solid #fff;
	outline-offset: 3px;
}

/* Out of sight until it has the keyboard's focus. */
.skip {
	position: absolute;
	top: var(--unit);
	left: var(--unit);
	z-index: 1;
	padding: calc(var(--unit) * 1.5) calc(var(--unit) * 2);
	background: var(--ink);
	color: var(--ground);
	font-weight: 700;
}
.skip:not(:focus-visible) {
	width: 1px;
	height: 1px;
	padding: 0;
	overflow: hidden;
	clip-path: inset(50%);
	white-space: nowrap;
}

/* Narrow screens: a level band along the bottom with nothing cut off, on the same grid with a
   narrower first column. Folded, it is one bar holding the Menu button and the name. */
@media (max-width: 720px) {
	.slab,
	.slab.folded {
		--key: 5.5rem;
		inset: auto 0 0 0;
		width: 100%;
		height: auto;
		max-height: 85vh;
		overflow-y: auto;
		padding: calc(var(--unit) * 3.5) calc(var(--unit) * 3.5);
		/* The band's upper edge takes the curve instead. */
		clip-path: ellipse(120% 100% at 50% 100%);
		padding-top: calc(var(--unit) * 7);
	}
	.trine {
		display: none;
	}
	.folded .bar {
		display: grid;
		height: auto;
	}
	.folded .outline {
		width: auto;
		height: auto;
		padding: 0 calc(var(--unit) * 3);
		border: 1px solid var(--ink);
		border-radius: 2rem;
	}
	.folded .outline:focus-visible {
		outline-offset: 3px;
	}
	.bar {
		margin-bottom: calc(var(--unit) * 4);
	}
	.tag {
		display: block;
	}
	ol {
		margin: calc(var(--unit) * 4) 0;
	}
	.title {
		font-size: 2.5rem;
	}
	.folded.slab {
		padding-top: calc(var(--unit) * 4);
	}
}
</style>
