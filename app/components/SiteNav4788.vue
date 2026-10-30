<script setup lang="ts">
// 4788 AD, every human in service to Uranus, and built to meet WCAG 2.2 AA. Third pass, in which
// the typography carries the idea.
//
//   Equal measure. Every word of the name and every link is set to exactly the same width, by
//   widening or narrowing its letters (FitWord). "Art" is forced as wide as "Contact". Nothing is
//   allowed its natural length.
//
//   Retrograde. Uranus turns backwards, and lies 7.8 degrees past flat. The display type leans
//   backwards by 7.8 degrees, the opposite of an italic, and the slab's edge is cut at the same angle.
//
//   Two weights of being. The name is drawn as thin as the typeface goes; the duties (the links)
//   as heavy as it goes.
//
//   One cold colour, and small spaced-out capitals in a plain monospace for everything that is
//   only information.
//
// Accessibility is unchanged from the earlier slabs: all text is level enough to read and sits
// on an opaque ground (about 16:1), nothing moves, controls are at least 44px tall with a white
// focus ring, the form is labelled and speaks its status, there is a skip link, the ocean can be
// paused, and the slab folds away. Text is real text throughout: it scales and reflows.

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
		<!-- Decoration only: rings seen edge-on along the cut. -->
		<span class="edge" aria-hidden="true" />

		<div class="bar">
			<button type="button" class="fold small" :aria-expanded="open" aria-controls="slab-body" @click="open = !open">
				{{ open ? "Close" : "Menu" }}
			</button>
			<!-- The name in small, for when the slab is folded to a bar and the large name is out of sight. -->
			<span v-if="!open" class="small tag">Nabil Sabio Azadi</span>
		</div>

		<div v-show="open" id="slab-body" class="body">
			<!-- One paragraph for screen readers; three equal lines for the eye. -->
			<p class="name retrograde" aria-label="Nabil Sabio Azadi">
				<FitWord v-for="part in ['Nabil', 'Sabio', 'Azadi']" :key="part" :text="part" aria-hidden="true" />
			</p>

			<nav aria-label="Main">
				<ol class="retrograde">
					<li v-for="(link, i) in links" :key="link.to">
						<NuxtLink :to="link.to" :aria-label="link.label">
							<span class="small index" aria-hidden="true">0{{ i + 1 }}</span>
							<FitWord :text="link.label" aria-hidden="true" />
						</NuxtLink>
					</li>
				</ol>
			</nav>

			<form @submit.prevent="join">
				<label for="news-email" class="small">Newsletter: your email address</label>
				<div class="field">
					<input id="news-email" v-model="email" type="email" required autocomplete="email" aria-describedby="news-status" />
					<button type="submit" class="small">Join</button>
				</div>
				<p id="news-status" role="status">{{ notice }}</p>
			</form>

			<div class="foot">
				<dl class="small">
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
				<p class="credit small"><a href="https://open-meteo.com/">Weather data by Open-Meteo</a></p>
				<p class="credit small"><a href="https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM">Elevation: Copernicus DEM (© DLR, Airbus)</a>, <a href="https://www.gebco.net/">seabed: GEBCO</a></p>
				<button type="button" class="quiet small" :aria-pressed="paused" @click="paused = !paused">
					{{ paused ? "Play the moving background" : "Pause the moving background" }}
				</button>
			</div>
		</div>
	</header>
</template>

<style scoped>
.slab {
	/* Pale cyan on near-black: about 16:1. The dimmer cyan is still about 11:1. */
	--ground: #041318;
	--uranus: #c9f6f3;
	--dim: #8fd6d4;
	/* How far the cut edge leans over the slab's full height: tan(7.8deg) of it. */
	--lean: 13.7vh;
	position: fixed;
	z-index: 20;
	inset: 0 auto 0 0;
	box-sizing: border-box;
	width: calc(23rem + var(--lean));
	max-width: 100vw;
	padding: 1.5rem calc(var(--lean) + 1.75rem) 1.5rem 1.75rem;
	overflow-y: auto;
	background: var(--ground);
	color: var(--uranus);
	/* Cut so the edge leans backwards, like the type: narrower at the top. */
	clip-path: polygon(0 0, calc(100% - var(--lean)) 0, 100% 100%, 0 100%);
	font: 400 1rem/1.5 ui-monospace, "SF Mono", Menlo, Consolas, monospace;
}
.slab.folded {
	width: calc(6.5rem + var(--lean));
	padding-left: 1rem;
}
.edge {
	position: absolute;
	inset: 0 0 0 auto;
	width: calc(var(--lean) + 1.5rem);
	background: repeating-linear-gradient(to right, transparent 0 5px, var(--dim) 5px 6px);
	clip-path: polygon(calc(100% - 22px - var(--lean)) 0, calc(100% - 4px - var(--lean)) 0, calc(100% - 4px) 100%, calc(100% - 22px) 100%);
	opacity: 0.7;
}

.bar {
	display: flex;
	align-items: center;
	gap: 1rem;
}
/* The folded rail on a wide screen has no room for it. */
.tag {
	display: none;
}

/* Information: small capitals, spaced out, never slanted. */
.small {
	font-size: 0.8125rem;
	text-transform: uppercase;
	letter-spacing: 0.16em;
}

/* Display type leans backwards by Uranus's 7.8 degrees. */
.retrograde {
	transform: skewX(7.8deg);
	transform-origin: 0 100%;
	text-transform: uppercase;
	line-height: 0.92;
}

.body {
	display: flex;
	flex-direction: column;
	min-height: calc(100% - 3.5rem);
	/* The measure every fitted line is set to. Kept clear of the leaning edge. */
	max-width: 17rem;
}
.name {
	margin-top: 1.5rem;
	font-size: 3rem;
	font-weight: 100;
}

ol {
	margin: 1.5rem 0 2rem;
}
li + li {
	margin-top: 0.35rem;
}
nav a {
	position: relative;
	display: block;
	padding-top: 1.2rem;
	font-size: 4rem;
	font-weight: 900;
}
/* The number sits level above the leaning word, taking back the slant. */
.index {
	position: absolute;
	top: 0;
	left: 0;
	color: var(--dim);
	font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
	font-weight: 400;
	line-height: 1.2;
}
/* Hover and focus turn the row over: dark on cyan, the same contrast the other way round. */
nav a:hover,
nav a:focus-visible {
	background: var(--uranus);
	color: var(--ground);
	box-shadow: 0 0 0 0.5rem var(--uranus);
}
nav a:hover .index,
nav a:focus-visible .index {
	color: var(--ground);
}
/* The page being viewed is underlined with a solid bar: shape, not colour alone. */
nav a[aria-current="page"] {
	border-bottom: 0.5rem solid var(--uranus);
}

label {
	display: block;
	margin-bottom: 0.4rem;
}
.field {
	display: flex;
}
input {
	flex: 1;
	min-width: 0;
	min-height: 2.75rem;
	padding: 0 0.6rem;
	border: 2px solid var(--uranus);
	background: var(--ground);
	color: var(--uranus);
	font: inherit;
}
button {
	min-height: 2.75rem;
	padding: 0 1rem;
	border: 2px solid var(--uranus);
	background: var(--uranus);
	color: var(--ground);
	font-family: inherit;
	cursor: pointer;
}
[role="status"] {
	min-height: 1.5rem;
	margin-top: 0.4rem;
	font-size: 0.9375rem;
}

.foot {
	margin-top: auto;
	padding-top: 1.5rem;
}
dl div {
	display: flex;
	gap: 0.75rem;
	padding: 0.25rem 0;
	border-top: 1px solid rgb(143 214 212 / 0.4);
}
dt {
	flex: 0 0 6.5rem;
	color: var(--dim);
}
.credit a {
	display: inline-block;
	padding: 0.7rem 0;
	text-decoration: underline;
	text-underline-offset: 0.25em;
}
.quiet,
.fold {
	background: var(--ground);
	color: var(--uranus);
}
.quiet {
	width: 100%;
	text-align: left;
	padding-block: 0.5rem;
	line-height: 1.5;
}

/* One focus ring for everything: white, thick, clear of the control. */
a:focus-visible,
button:focus-visible,
input:focus-visible {
	outline: 3px solid #fff;
	outline-offset: 3px;
}

.skip {
	position: absolute;
	top: 0.5rem;
	left: 0.5rem;
	z-index: 1;
	padding: 0.6rem 0.9rem;
	background: var(--uranus);
	color: var(--ground);
	transform: translateY(-200%);
}
.skip:focus-visible {
	transform: none;
}

/* Narrow screens: a level band along the bottom with nothing cut off. Folded, it is one bar
   holding the Menu button. */
@media (max-width: 720px) {
	.slab,
	.slab.folded {
		inset: auto 0 0 0;
		width: 100%;
		max-height: 85vh;
		padding: 1rem 1.25rem;
		clip-path: none;
		border-top: 3px double var(--dim);
	}
	.edge {
		display: none;
	}
	.tag {
		display: inline;
	}
	.body {
		max-width: none;
		padding-right: 1.5rem;
	}
	.name {
		font-size: 2.25rem;
	}
	nav a {
		font-size: 3.25rem;
	}
}
</style>
