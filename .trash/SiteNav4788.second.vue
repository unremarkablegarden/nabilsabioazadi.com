<script setup lang="ts">
// 4788 AD, every human in service to Uranus, and built to meet WCAG 2.2 AA. Second pass.
// As before the idea is carried by the shape, never by the text: a near-black slab like a duty
// board, its outer edge cut at the 7.8 degrees by which Uranus's axis is past lying flat, the
// planet behind its top corner with its rings standing on end. Text is plain, level, large and
// still, pale cyan on an opaque ground (about 16:1).
//
// New in this pass:
//   - the slab folds away to a narrow rail (a bar on small screens, where it starts folded), so
//     the ocean can be seen whole; it opens with a button and closes with the button or Escape;
//   - the place, time and sea conditions are read out on the slab as a short list, so no text
//     is left out on the open sky;
//   - larger name and links, and a mark on the link for the page being viewed.

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
		<!-- Decoration only: the planet behind the corner, its rings on end, and rings along the cut edge. -->
		<span class="planet" aria-hidden="true"><i /><i /><i /></span>
		<span class="edge" aria-hidden="true" />

		<div class="top">
			<p class="name">Nabil Sabio Azadi</p>
			<button type="button" class="fold" :aria-expanded="open" aria-controls="slab-body" @click="open = !open">
				{{ open ? "Close" : "Menu" }}
			</button>
		</div>

		<div v-show="open" id="slab-body" class="body">
			<p class="era" aria-hidden="true">⛢ 4788</p>

			<nav aria-label="Main">
				<ol>
					<li v-for="link in links" :key="link.to">
						<NuxtLink :to="link.to">{{ link.label }}</NuxtLink>
					</li>
				</ol>
			</nav>

			<form @submit.prevent="join">
				<label for="news-email">Newsletter: your email address</label>
				<div class="field">
					<input id="news-email" v-model="email" type="email" required autocomplete="email" aria-describedby="news-status" />
					<button type="submit">Join</button>
				</div>
				<p id="news-status" role="status">{{ notice }}</p>
			</form>

			<div class="foot">
				<dl>
					<div>
						<dt>Place</dt>
						<dd>Te Rerenga Wairua, Cape Reinga</dd>
					</div>
					<div>
						<dt>Facing</dt>
						<dd>Hawaiʻi</dd>
					</div>
					<div v-if="readout.time">
						<dt>Time there</dt>
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
				<p class="credit"><a href="https://open-meteo.com/" target="_blank" rel="noopener">Weather data by Open-Meteo (opens in a new tab)</a></p>
				<button type="button" class="quiet" :aria-pressed="paused" @click="paused = !paused">
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
	display: flex;
	flex-direction: column;
	width: calc(21rem + var(--lean));
	max-width: 100vw;
	padding: 1.75rem calc(var(--lean) + 1.5rem) 1.5rem 1.75rem;
	overflow-y: auto;
	background: var(--ground);
	color: var(--uranus);
	clip-path: polygon(0 0, 100% 0, calc(100% - var(--lean)) 100%, 0 100%);
	font: 400 1.0625rem/1.5 ui-monospace, "SF Mono", Menlo, Consolas, monospace;
}
/* Folded: a rail just wide enough for the button, with the same cut. */
.slab.folded {
	width: calc(6.5rem + var(--lean));
	padding-right: calc(var(--lean) + 0.75rem);
	padding-left: 1rem;
}
.folded .name,
.folded .planet {
	display: none;
}

/* Rings seen edge-on, running along the cut. */
.edge {
	position: absolute;
	inset: 0 0 0 auto;
	width: calc(var(--lean) + 1.5rem);
	background: repeating-linear-gradient(to right, transparent 0 5px, var(--dim) 5px 6px);
	clip-path: polygon(calc(100% - 22px) 0, calc(100% - 4px) 0, calc(100% - 4px - var(--lean)) 100%, calc(100% - 22px - var(--lean)) 100%);
	opacity: 0.7;
}
/* The planet, lit from below left, with three rings standing on end across it. */
.planet {
	position: absolute;
	top: -4.5rem;
	right: 1.5rem;
	width: 10rem;
	height: 10rem;
	border-radius: 50%;
	background: radial-gradient(circle at 32% 72%, #d6fbf8, #7fcfd0 50%, #256f7d 95%);
}
.planet i {
	position: absolute;
	top: -35%;
	left: 50%;
	width: 26%;
	height: 170%;
	border: 1px solid var(--dim);
	border-radius: 50%;
	transform: translateX(-50%) rotate(7.8deg);
}
.planet i:nth-child(2) {
	width: 36%;
	height: 200%;
	top: -50%;
}
.planet i:nth-child(3) {
	width: 46%;
	height: 230%;
	top: -65%;
	opacity: 0.6;
}

.top {
	position: relative;
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 1rem;
	margin-top: 4.5rem;
}
.folded .top {
	margin-top: 0;
}
.name {
	font-size: 1.5rem;
	font-weight: 700;
	line-height: 1.2;
	letter-spacing: 0.02em;
}
.body {
	display: flex;
	flex: 1;
	flex-direction: column;
}
.era {
	color: var(--dim);
	letter-spacing: 0.2em;
}

ol {
	margin: 1.75rem 0;
	counter-reset: duty;
	border-top: 1px solid var(--dim);
}
li {
	counter-increment: duty;
	border-bottom: 1px solid var(--dim);
}
nav a {
	display: flex;
	align-items: baseline;
	gap: 1rem;
	min-height: 3.5rem;
	padding-top: 0.7rem;
	box-sizing: border-box;
	font-size: 1.375rem;
	text-transform: uppercase;
	letter-spacing: 0.06em;
}
nav a::before {
	content: counter(duty, decimal-leading-zero);
	color: var(--dim);
	font-size: 1.0625rem;
}
/* Hover and focus turn the row over: dark on cyan, the same contrast the other way round. */
nav a:hover,
nav a:focus-visible {
	margin: 0 -0.75rem;
	padding-inline: 0.75rem;
	background: var(--uranus);
	color: var(--ground);
}
nav a:hover::before,
nav a:focus-visible::before {
	color: var(--ground);
}
/* The page being viewed: a bar at the row's leading edge and the words "current page" for screen readers
   come from aria-current, which NuxtLink sets. Shape as well as colour, so it does not rely on colour alone. */
nav a[aria-current="page"] {
	border-left: 0.5rem solid var(--uranus);
	padding-left: 0.75rem;
	font-weight: 700;
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
	font: inherit;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	cursor: pointer;
}
[role="status"] {
	min-height: 1.5rem;
	margin-top: 0.4rem;
	font-size: 0.9375rem;
}

/* The readout sits at the foot of the slab. */
.foot {
	margin-top: auto;
	padding-top: 1.5rem;
	font-size: 0.9375rem;
}
dl div {
	display: flex;
	gap: 0.75rem;
	padding: 0.2rem 0;
	border-top: 1px solid rgb(143 214 212 / 0.4);
}
dt {
	flex: 0 0 6.5rem;
	color: var(--dim);
}
.credit a {
	display: inline-block;
	padding: 0.6rem 0;
	text-decoration: underline;
	text-underline-offset: 0.2em;
}
.quiet,
.fold {
	background: var(--ground);
	color: var(--uranus);
}
.quiet {
	width: 100%;
	text-transform: none;
	letter-spacing: 0;
	text-align: left;
	padding-block: 0.4rem;
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
   holding the name and the Menu button. */
@media (max-width: 720px) {
	.slab,
	.slab.folded {
		inset: auto 0 0 0;
		width: 100%;
		max-height: 80vh;
		padding: 1rem 1.25rem;
		clip-path: none;
		border-top: 3px double var(--dim);
	}
	.edge,
	.planet {
		display: none;
	}
	.top,
	.folded .top {
		align-items: center;
		margin-top: 0;
	}
	.folded .name {
		display: block;
	}
	.name {
		font-size: 1.25rem;
	}
	ol {
		margin: 1rem 0;
	}
}
</style>
