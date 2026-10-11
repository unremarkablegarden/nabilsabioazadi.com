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
const readout = useState<{ time: string; waves?: string; wind?: string }>("scene-readout", () => ({ time: "" }));
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
		<!-- Decoration only: a raster of fine lines along the cut. -->
		<span class="edge" aria-hidden="true" />

		<div class="row bar">
			<button type="button" class="outline key" :aria-expanded="open" aria-controls="slab-body" @click="open = !open">
				{{ open ? "Close" : "Menu" }}
			</button>
			<!-- The name in small, for when the slab is folded to a bar and the large name is out of sight. -->
			<span v-if="!open" class="tag">Nabil Sabio Azadi</span>
		</div>

		<div v-show="open" id="slab-body" class="body">
			<div class="row lockup">
				<!-- The owner's mark, redrawn from their artwork: the ring and the four characters only.
				     The hand-drawn orbits of the original are not reproduced here. Decoration: the name is beside it. -->
				<svg class="mark" viewBox="0 0 100 100" aria-hidden="true">
					<circle cx="50" cy="50" r="45.5" />
					<text x="38" y="46">N</text>
					<text x="62" y="46">S</text>
					<text x="38" y="71">*</text>
					<text x="62" y="68">A</text>
				</svg>
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
						<dd class="reading">Te Rerenga Wairua, Cape Reinga</dd>
					</div>
					<div class="row rule">
						<dt class="key">Facing</dt>
						<dd class="reading">Hawaiʻi</dd>
					</div>
					<div v-if="readout.time" class="row rule">
						<dt class="key">Time there</dt>
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
					<a class="reading link" href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo (opens in a new tab)</a>
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
	/* The owner's colours, taken from their mark: off-white on a very dark green, about 15:1.
	   The dimmer tone, for labels and hairlines, is still about 9:1. */
	--ground: #10211a;
	--ink: #f4f1e8;
	--dim: #b4c0b3;
	/* How far the cut edge leans over the slab's full height. */
	--lean: 13.7vh;
	/* The unit all spacing is a multiple of, and the width of the narrow column. */
	--unit: 0.5rem;
	--key: 5.5rem;
	position: fixed;
	z-index: 20;
	inset: 0 auto 0 0;
	box-sizing: border-box;
	width: calc(25rem + var(--lean));
	max-width: 100vw;
	padding: calc(var(--unit) * 4) calc(var(--lean) + var(--unit) * 4) calc(var(--unit) * 4) calc(var(--unit) * 4);
	overflow-y: auto;
	background: var(--ground);
	color: var(--ink);
	clip-path: polygon(0 0, calc(100% - var(--lean)) 0, 100% 100%, 0 100%);
	font: 400 1rem/1.5 "Helvetica Neue LT", "Helvetica Neue", Helvetica, Arial, sans-serif;
}
.slab.folded {
	width: calc(9rem + var(--lean));
}
.edge {
	position: absolute;
	inset: 0 0 0 auto;
	width: calc(var(--lean) + 1.5rem);
	background: repeating-linear-gradient(to right, transparent 0 5px, var(--dim) 5px 6px);
	clip-path: polygon(calc(100% - 22px - var(--lean)) 0, calc(100% - 4px - var(--lean)) 0, calc(100% - 4px) 100%, calc(100% - 22px) 100%);
	opacity: 0.7;
}

/* The grid: a narrow column and a wide one. Every row of the slab is set on it. */
.row {
	display: grid;
	grid-template-columns: var(--key) minmax(0, 1fr);
	column-gap: calc(var(--unit) * 2);
	align-items: baseline;
}
/* Rows of information are parted by a hairline, with one unit above and below. */
.rule {
	padding: var(--unit) 0;
	border-top: 1px solid var(--dim);
}

/* Small size: what a thing is. Medium weight, a little air between the letters. */
.key {
	font-size: 0.8125rem;
	font-weight: 500;
	line-height: 1.5rem;
	letter-spacing: 0.02em;
	color: var(--dim);
}
/* Reading size, in the serif: information to be read. */
.reading {
	font: 400 1.0625rem/1.5rem "Lyon Text", Georgia, "Times New Roman", serif;
}

.bar {
	align-items: center;
	margin-bottom: calc(var(--unit) * 5);
}
.folded .bar {
	margin-bottom: 0;
}
.tag {
	display: none;
	font-weight: 700;
}

.lockup {
	align-items: start;
}
/* The mark fills the narrow column; the name stands beside it on the wide column's line. */
.mark {
	width: 100%;
	max-width: 5.5rem;
}
.mark circle {
	fill: none;
	stroke: var(--ink);
	stroke-width: 5;
}
.mark text {
	fill: var(--ink);
	font-size: 19px;
	font-weight: 700;
	text-anchor: middle;
}
/* Middle size: the name, hung on the wide column's line, set solid. */
.name {
	grid-column: 2;
	font-size: 2rem;
	font-weight: 700;
	line-height: 1;
	letter-spacing: -0.015em;
}

/* Largest size: the three things to do. */
ol {
	margin: calc(var(--unit) * 5) 0;
}
nav a {
	min-height: 3.5rem;
	padding-top: var(--unit);
	box-sizing: border-box;
	border-top: 1px solid var(--dim);
}
li:last-child a {
	border-bottom: 1px solid var(--dim);
}
.title {
	font-size: 3rem;
	font-weight: 700;
	line-height: 1;
	letter-spacing: -0.03em;
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
	margin: var(--unit) 0;
}
input {
	flex: 1;
	min-width: 0;
	min-height: 2.75rem;
	padding: 0 calc(var(--unit) * 1.5);
	border: 2px solid var(--ink);
	background: var(--ground);
	color: var(--ink);
	font: inherit;
}
button {
	min-height: 2.75rem;
	font: inherit;
	cursor: pointer;
}
.outline {
	justify-self: start;
	padding: 0 calc(var(--unit) * 2);
	border: 2px solid var(--ink);
	color: var(--ink);
}
.solid {
	padding: 0 calc(var(--unit) * 2.5);
	border: 2px solid var(--ink);
	background: var(--ink);
	color: var(--ground);
	font-weight: 700;
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
		--key: 4.75rem;
		inset: auto 0 0 0;
		width: 100%;
		max-height: 85vh;
		padding: calc(var(--unit) * 2.5) calc(var(--unit) * 3);
		clip-path: none;
		border-top: 1px solid var(--dim);
	}
	.edge {
		display: none;
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
}
</style>
