<script setup lang="ts">
// Neptune, Céline under Phoebe Philo, and Kandinsky's spare work of the 1930s. Built to meet WCAG 2.2 AA.
//
//   Philo's Céline: almost nothing on the page, and what is there is exact. An unbleached ground,
//   a geometric sans in small capitals set wide apart, large margins, no ornament in the type.
//
//   Kandinsky: a few plain figures placed in balance on a flat ground: a circle, an arc, a line,
//   a triangle. And his three basic forms, circle, triangle and square, which here mark the three links.
//
//   Neptune: one deep blue for everything that is ink. The circle is the planet, sitting half off
//   the edge of the panel over the sea; the broken arcs round it are its rings, which really are
//   incomplete arcs; the small dot is Triton.
//
// Accessibility: all text is on the opaque ground (deep blue on unbleached white, about 11:1),
// nothing moves, controls are at least 44px tall with a visible focus ring, the links are told
// apart by shape and words and never by colour, the form is labelled and speaks its status,
// there is a skip link, the ocean can be paused, and the panel folds away.
import "@fontsource-variable/jost/wght.css";

// Shared with OceanBackground, which stops drawing while this is true.
const paused = useState("motion-paused", () => false);
// Filled in by OceanBackground. This panel shows it, so the floating caption is turned off.
const readout = useState<{ place?: string; time: string; waves?: string; wind?: string }>("scene-readout", () => ({ time: "" }));
const captionInNavigation = useState("caption-in-navigation", () => false);
captionInNavigation.value = true;
onBeforeUnmount(() => (captionInNavigation.value = false));

const open = ref(true);
onMounted(() => {
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) paused.value = true;
	// On a small screen the open panel would cover most of the picture.
	if (window.matchMedia("(max-width: 720px)").matches) open.value = false;
});

// The newsletter form has nowhere to send addresses yet, so it says so instead of pretending.
const email = ref("");
const notice = ref("");
const join = () => {
	notice.value = "Sign-up is not open yet. Your address was not sent anywhere.";
};

// The composition is only shown when the panel has room to spare for it. If the text needs the
// space (a short window, or enlarged text), it is left out, so text never runs over the figures.
const scroller = ref<HTMLElement>();
const spacer = ref<HTMLElement>();
const roomy = ref(true);
const place = ref({ top: "0px", height: "0px" });
const measure = async () => {
	if (!scroller.value || !spacer.value) return;
	const least = 13 * parseFloat(getComputedStyle(document.documentElement).fontSize);
	// Where the last thing in the panel ends, as if the empty stretch were at its least.
	const last = scroller.value.querySelector<HTMLElement>(".foot")!;
	const padding = parseFloat(getComputedStyle(scroller.value).paddingBottom);
	const needed = last.offsetTop + last.offsetHeight + padding - spacer.value.offsetHeight + least;
	roomy.value = open.value && needed <= scroller.value.clientHeight && window.matchMedia("(min-width: 721px)").matches;
	await nextTick();
	place.value = { top: `${spacer.value.offsetTop}px`, height: `${spacer.value.offsetHeight}px` };
};
let observer: ResizeObserver | undefined;
onMounted(() => {
	observer = new ResizeObserver(measure);
	observer.observe(scroller.value!);
	document.fonts.ready.then(measure);
});
onBeforeUnmount(() => observer?.disconnect());
watch(open, () => nextTick(measure));

const links = [
	{ to: "/writing", label: "Writing", form: "circle" },
	{ to: "/art", label: "Art", form: "triangle" },
	{ to: "/contact", label: "Contact", form: "square" },
];
</script>

<template>
	<header class="panel" :class="{ folded: !open }" @keydown.esc="open = false">
		<a class="skip" href="#main">Skip to content</a>

		<!-- Decoration only: the composition. It runs out past the panel's edge, over the sea. -->
		<svg v-if="roomy" class="composition" :style="place" viewBox="0 0 400 300" preserveAspectRatio="xMinYMid meet" aria-hidden="true">
			<circle class="ink" cx="300" cy="150" r="92" />
			<path class="line" d="M300 20 A130 130 0 0 1 418 95" />
			<path class="line" d="M428 175 A130 130 0 0 1 380 252" />
			<path class="line" d="M252 271 A130 130 0 0 1 176 188" />
			<path class="line" d="M214 12 A162 162 0 0 1 262 -7" />
			<circle class="ink" cx="150" cy="56" r="7" />
			<path class="line" d="M24 278 L388 52" />
			<path class="camel" d="M92 210 L128 272 H56 Z" />
			<path class="line" d="M40 110 H96 M40 120 H96 M40 130 H96 M40 140 H96" />
		</svg>

		<div ref="scroller" class="scroll">
		<div class="bar">
			<p class="name">Nabil Sabio Azadi</p>
			<button type="button" class="plain" :aria-expanded="open" aria-controls="panel-body" @click="open = !open">
				{{ open ? "Close" : "Menu" }}
			</button>
		</div>

		<div v-show="open" id="panel-body" class="body">
			<nav aria-label="Main">
				<ul>
					<li v-for="link in links" :key="link.to">
						<NuxtLink :to="link.to">
							<svg class="form" viewBox="0 0 20 20" aria-hidden="true">
								<circle v-if="link.form === 'circle'" cx="10" cy="10" r="8" />
								<path v-else-if="link.form === 'triangle'" d="M10 2 L18.5 17.5 H1.5 Z" />
								<rect v-else x="2.5" y="2.5" width="15" height="15" />
							</svg>
							{{ link.label }}
						</NuxtLink>
					</li>
				</ul>
			</nav>

			<div ref="spacer" class="spacer" :class="{ none: !roomy }" />

			<form @submit.prevent="join">
				<label for="news-email">Newsletter: your email address</label>
				<div class="field">
					<input id="news-email" v-model="email" type="email" required autocomplete="email" aria-describedby="news-status" />
					<button type="submit" class="solid">Join</button>
				</div>
				<p id="news-status" role="status">{{ notice }}</p>
			</form>

			<div class="foot">
				<dl>
					<div>
						<dt>Place</dt>
						<dd>{{ readout.place }}</dd>
					</div>
					<div v-if="readout.time">
						<dt>Human time</dt>
						<dd>{{ readout.time }}</dd>
					</div>
					<div v-if="readout.waves">
						<dt>Waves</dt>
						<dd>{{ readout.waves }}</dd>
					</div>
					<div v-if="readout.wind">
						<dt>Wind</dt>
						<dd>{{ readout.wind }}</dd>
					</div>
				</dl>
				<p><a class="credit" href="https://open-meteo.com/">Weather: Open-Meteo</a></p>
				<p><a class="credit" href="https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM">Elevation: Copernicus DEM (© DLR, Airbus)</a>, <a class="credit" href="https://www.gebco.net/">seabed: GEBCO</a></p>
				<button type="button" class="plain" :aria-pressed="paused" @click="paused = !paused">
					{{ paused ? "Play the moving background" : "Pause the moving background" }}
				</button>
			</div>
		</div>
		</div>
	</header>
</template>

<style scoped>
.panel {
	/* Neptune's blue on unbleached white: about 11:1. */
	--ground: #f4f0e6;
	--ink: #14296b;
	--camel: #b98b5e;
	position: fixed;
	z-index: 20;
	inset: 0 auto 0 0;
	box-sizing: border-box;
	width: 21rem;
	max-width: 100vw;
	background: var(--ground);
	color: var(--ink);
	/* Small capitals, wide apart: the one voice everything speaks in. */
	font: 500 0.8125rem/1.6 "Jost Variable", Futura, "Century Gothic", sans-serif;
	text-transform: uppercase;
	letter-spacing: 0.22em;
}
.panel.folded {
	inset: 0 auto auto 0;
	width: auto;
}
/* The text scrolls inside the panel if it must; the panel itself does not clip, so the
   composition can run out past its edge. */
.scroll {
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	height: 100%;
	padding: 2.25rem 2.25rem 1.75rem;
	overflow-y: auto;
}
.folded .scroll {
	padding: 1.25rem 1.5rem;
}

/* Close sits alone above the name, so the name keeps one unbroken line. */
.bar {
	display: flex;
	flex-direction: column-reverse;
	align-items: flex-start;
	gap: 1.25rem;
}
.folded .bar {
	flex-direction: row;
	align-items: center;
	gap: 2rem;
}
/* Set like a house's name on its label: heavier, wider, and nothing else. */
.name {
	font-size: 0.9375rem;
	font-weight: 700;
	letter-spacing: 0.3em;
	line-height: 1.7;
	white-space: nowrap;
}
.body {
	display: flex;
	flex: 1;
	flex-direction: column;
	min-height: 0;
}

ul {
	margin-top: 2.5rem;
}
nav a {
	display: flex;
	align-items: center;
	gap: 1.1rem;
	min-height: 3rem;
	font-size: 1.0625rem;
	letter-spacing: 0.26em;
}
/* Circle, triangle, square: drawn in outline, filled for the link under the pointer or the page being viewed. */
.form {
	flex: none;
	width: 1.1rem;
	height: 1.1rem;
	fill: none;
	stroke: var(--ink);
	stroke-width: 1.4;
}
nav a:hover .form,
nav a:focus-visible .form,
nav a[aria-current="page"] .form {
	fill: var(--ink);
}
nav a:hover,
nav a:focus-visible,
nav a[aria-current="page"] {
	text-decoration: underline;
	text-decoration-thickness: 1px;
	text-underline-offset: 0.5em;
}
nav a[aria-current="page"] {
	font-weight: 700;
}

/* The empty stretch the composition is laid over. It takes whatever room is left. */
.spacer {
	flex: 1;
	min-height: 13rem;
}
.spacer.none {
	flex: none;
	min-height: 1.5rem;
}
.composition {
	position: absolute;
	left: 1.25rem;
	width: 27rem;
	max-width: none;
	overflow: visible;
	pointer-events: none;
}
.ink {
	fill: var(--ink);
}
.line {
	fill: none;
	stroke: var(--ink);
	stroke-width: 1.2;
}
.camel {
	fill: var(--camel);
}

label {
	display: block;
	margin-bottom: 0.3rem;
}
.field {
	display: flex;
	align-items: stretch;
	gap: 0.75rem;
}
input {
	flex: 1;
	min-width: 0;
	min-height: 2.75rem;
	border-bottom: 1.5px solid var(--ink);
	background: transparent;
	color: var(--ink);
	font: 400 1rem/1 "Jost Variable", Futura, sans-serif;
	letter-spacing: 0.02em;
	text-transform: none;
}
button {
	min-height: 2.75rem;
	font: inherit;
	letter-spacing: inherit;
	text-transform: inherit;
	cursor: pointer;
}
.solid {
	padding: 0 1.25rem;
	background: var(--ink);
	color: var(--ground);
}
.plain {
	padding: 0;
	text-align: left;
	text-decoration: underline;
	text-decoration-thickness: 1px;
	text-underline-offset: 0.5em;
}
[role="status"] {
	min-height: 1.4rem;
	margin-top: 0.4rem;
	letter-spacing: 0.06em;
	text-transform: none;
	font-size: 0.875rem;
}

.foot {
	margin-top: 1.25rem;
	font-size: 0.75rem;
	letter-spacing: 0.14em;
}
dl div {
	display: flex;
	gap: 0.75rem;
	padding: 0.3rem 0;
	border-top: 1px solid rgb(20 41 107 / 0.35);
}
dt {
	flex: 0 0 5.75rem;
}
dd {
	font-weight: 400;
}
.credit {
	display: inline-block;
	padding: 0.8rem 0 0.3rem;
	text-decoration: underline;
	text-decoration-thickness: 1px;
	text-underline-offset: 0.4em;
}

/* One focus ring for everything, in the ink, clear of the control. */
a:focus-visible,
button:focus-visible,
input:focus-visible {
	outline: 3px solid var(--ink);
	outline-offset: 4px;
}

/* Out of sight until it has the keyboard's focus. */
.skip {
	position: absolute;
	top: 0.5rem;
	left: 0.5rem;
	z-index: 1;
	padding: 0.8rem 1rem;
	background: var(--ink);
	color: var(--ground);
}
.skip:not(:focus-visible) {
	width: 1px;
	height: 1px;
	padding: 0;
	overflow: hidden;
	clip-path: inset(50%);
	white-space: nowrap;
}
.skip:focus-visible {
	outline-color: var(--camel);
	box-shadow: 0 0 0 3px var(--ground);
}

/* Narrow screens: a band along the bottom. The composition is left out; there is no room for air. */
@media (max-width: 720px) {
	.panel,
	.panel.folded {
		inset: auto 0 0 0;
		width: 100%;
	}
	.scroll,
	.folded .scroll {
		max-height: 85vh;
		padding: 1.25rem 1.5rem;
	}
	.bar {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
	}
	ul {
		margin-top: 1.5rem;
	}
	form {
		margin-top: 1.5rem;
	}
}
</style>
