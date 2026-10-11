<script setup lang="ts">
// The first accessible 4788 slab, which the owner loved. Kept exactly as it was; shown with ?type=4788a.
// 4788 AD, every human in service to Uranus, and built to meet WCAG 2.2 AA.
// The idea is carried by the shape of the thing, never by the text: a dark slab stands at the edge
// of the screen like a duty board, its outer edge cut at the 7.8 degrees by which Uranus's axis is
// past lying flat, with the planet's rings drawn edge-on along the cut. Everything on it is one
// cold colour and numbered. The words themselves are plain, level, large and still.
//
// What makes it accessible: all text sits on an opaque ground (pale cyan on near-black, about
// 15:1); nothing here moves; every control is at least 44px tall with a visible focus ring; the
// form has a real label, a worded button and spoken status; there is a skip link; and the moving
// ocean behind can be paused, which it is from the start for anyone who asks for reduced motion.

// Shared with OceanBackground, which stops drawing while this is true.
const paused = useState("motion-paused", () => false);
onMounted(() => {
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) paused.value = true;
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
	<header class="slab">
		<a class="skip" href="#main">Skip to content</a>
		<!-- Decoration only: the planet rising behind the slab and its rings along the cut edge. -->
		<span class="planet" aria-hidden="true" />
		<span class="rings" aria-hidden="true" />

		<p class="name">Nabil Sabio Azadi</p>
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

		<button type="button" class="motion" :aria-pressed="paused" @click="paused = !paused">
			{{ paused ? "Play the moving background" : "Pause the moving background" }}
		</button>
	</header>
</template>

<style scoped>
.slab {
	/* Pale cyan on near-black: about 15:1. The dimmer cyan is still about 9:1. */
	--ground: #041318;
	--uranus: #c9f6f3;
	--dim: #8fd6d4;
	/* How far the cut edge leans over the slab's full height: tan(7.8deg) of it. */
	--lean: 13.7vh;
	position: fixed;
	z-index: 20;
	inset: 0 auto 0 0;
	box-sizing: border-box;
	width: calc(19rem + var(--lean));
	max-width: 100vw;
	padding: 2rem calc(var(--lean) + 1.5rem) 2rem 1.75rem;
	overflow-y: auto;
	background: var(--ground);
	color: var(--uranus);
	clip-path: polygon(0 0, 100% 0, calc(100% - var(--lean)) 100%, 0 100%);
	font: 400 1.0625rem/1.5 ui-monospace, "SF Mono", Menlo, Consolas, monospace;
}

/* Three of the planet's rings, seen edge-on, running parallel to the cut. */
.rings {
	position: absolute;
	inset: 0 0 0 auto;
	width: calc(var(--lean) + 1.25rem);
	background: repeating-linear-gradient(to right, transparent 0 5px, var(--dim) 5px 6px);
	clip-path: polygon(calc(100% - 22px) 0, calc(100% - 4px) 0, calc(100% - 4px - var(--lean)) 100%, calc(100% - 22px - var(--lean)) 100%);
	opacity: 0.7;
}
.planet {
	position: absolute;
	top: -3.5rem;
	right: 2.5rem;
	width: 7rem;
	height: 7rem;
	border-radius: 50%;
	background: radial-gradient(circle at 35% 70%, #d6fbf8, #7fcfd0 55%, #2f7d8a);
	opacity: 0.9;
}

.name {
	position: relative;
	margin-top: 3.5rem;
	font-size: 1.25rem;
	font-weight: 700;
	letter-spacing: 0.04em;
}
.era {
	color: var(--dim);
	letter-spacing: 0.2em;
}

ol {
	margin: 2rem 0;
	counter-reset: duty;
	border-top: 1px solid var(--dim);
}
li {
	counter-increment: duty;
	border-bottom: 1px solid var(--dim);
}
nav a {
	display: flex;
	align-items: center;
	gap: 1rem;
	min-height: 3rem;
	text-transform: uppercase;
	letter-spacing: 0.08em;
}
nav a::before {
	content: counter(duty, decimal-leading-zero);
	color: var(--dim);
}
/* Hover and focus turn the row over: dark on cyan, the same 15:1 the other way round. */
nav a:hover,
nav a:focus-visible {
	margin: 0 -0.75rem;
	padding: 0 0.75rem;
	background: var(--uranus);
	color: var(--ground);
}
nav a:hover::before,
nav a:focus-visible::before {
	color: var(--ground);
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
.motion {
	margin-top: 1.5rem;
	background: var(--ground);
	color: var(--uranus);
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

/* Narrow screens: the slab becomes a level band along the bottom, with nothing cut off. */
@media (max-width: 720px) {
	.slab {
		inset: auto 0 0 0;
		width: 100%;
		max-height: 70vh;
		padding: 1.25rem;
		clip-path: none;
		border-top: 3px double var(--dim);
	}
	.rings,
	.planet {
		display: none;
	}
	.name {
		margin-top: 0;
	}
	ol {
		margin: 1rem 0;
	}
}
</style>
