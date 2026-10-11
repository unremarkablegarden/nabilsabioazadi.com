<script setup lang="ts">
// 4788 AD, every human in service to Uranus. Nothing is set on a line any more, because nothing
// answers to the Earth's horizon. The words are moons: each is held on its own ring about the
// planet, the rings stand on end as Uranus's do (it lies on its side, tilted 97.8 degrees), and
// the words are carried round backwards, the way Uranus turns. Nearer rings go round faster.
// The only thing a visitor can do is hold them still by attending to them.

// The newsletter form has nowhere to send addresses yet, so it says so instead of pretending.
const email = ref("");
const notice = ref("");
const join = () => {
	notice.value = "Not open yet";
};

// Ring radius (in a 1000-unit square with the planet at its centre), seconds to go once round,
// and where on the ring the word starts (0..1). Five rings, as Uranus has five great moons.
const rings = [
	{ label: "Nabil Sabio Azadi", radius: 150, period: 110, start: 0.06 },
	{ label: "01 Writing", to: "/writing", radius: 215, period: 160, start: 0.22 },
	{ label: "02 Art", to: "/art", radius: 280, period: 220, start: 0.02 },
	{ label: "03 Contact", to: "/contact", radius: 345, period: 290, start: 0.3 },
	{ label: "04 Newsletter", to: "#news-email", radius: 410, period: 370, start: 0.12 },
];
// The rings are seen nearly edge-on from the side: tall, narrow ellipses.
const SQUASH = 0.4;
// Twice round, so a word near the end of a lap is not cut off.
const ringPath = (radius: number) => {
	const rx = radius * SQUASH;
	const lap = `A${rx} ${radius} 0 1 1 500 ${500 + radius} A${rx} ${radius} 0 1 1 500 ${500 - radius}`;
	return `M500 ${500 - radius} ${lap} ${lap}`;
};

// How far round each word is (0..1). The first half of a lap is the near side of the ring.
const places = ref(rings.map((ring) => ring.start));
const held = ref(false);
let frame = 0;
onMounted(() => {
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
	let last = performance.now();
	const turn = (now: number) => {
		const delta = Math.min(0.1, (now - last) / 1000);
		last = now;
		// Backwards: Uranus turns the opposite way to nearly everything else.
		if (!held.value) places.value = places.value.map((place, i) => (place - delta / rings[i]!.period + 1) % 1);
		frame = requestAnimationFrame(turn);
	};
	frame = requestAnimationFrame(turn);
});
onBeforeUnmount(() => cancelAnimationFrame(frame));

// Faint while it passes behind the planet's side of the ring, full on the near side.
const nearness = (place: number) => 0.3 + 0.7 * Math.min(1, Math.max(0, 0.5 + 4 * Math.sin(place * Math.PI * 2)));
const go = (to: string) => {
	if (to.startsWith("#")) document.querySelector<HTMLElement>(to)?.focus();
	else navigateTo(to);
};
</script>

<template>
	<header @pointerenter="held = true" @pointerleave="held = false" @focusin="held = true" @focusout="held = false">
		<svg viewBox="0 0 1000 1000" role="navigation" aria-label="Main">
			<defs>
				<radialGradient id="uranus" cx="38%" cy="34%" r="75%">
					<stop offset="0" stop-color="#e2fdfa" />
					<stop offset="0.45" stop-color="#9fe3e1" />
					<stop offset="1" stop-color="#3d8b97" />
				</radialGradient>
				<path v-for="(ring, i) in rings" :id="`ring-${i}`" :key="i" :d="ringPath(ring.radius)" />
			</defs>
			<!-- The whole system leans by the 7.8 degrees that Uranus's axis is past lying flat. -->
			<g transform="rotate(7.8 500 500)">
				<ellipse v-for="ring in rings" :key="ring.radius" class="ring" cx="500" cy="500" :rx="ring.radius * SQUASH" :ry="ring.radius" />
				<circle class="planet" cx="500" cy="500" r="62" fill="url(#uranus)" />
				<template v-for="(ring, i) in rings" :key="ring.label">
					<a v-if="ring.to" :href="ring.to" :style="{ opacity: nearness(places[i]!) }" @click.prevent="go(ring.to)">
						<text><textPath :href="`#ring-${i}`" :startOffset="`${places[i]! * 50}%`">{{ ring.label }}</textPath></text>
					</a>
					<text v-else :style="{ opacity: nearness(places[i]!) }">
						<textPath :href="`#ring-${i}`" :startOffset="`${places[i]! * 50}%`">{{ ring.label }}</textPath>
					</text>
				</template>
			</g>
		</svg>
		<form @submit.prevent="join">
			<label for="news-email">Newsletter</label>
			<input id="news-email" v-model="email" type="email" required placeholder="address" autocomplete="email" />
			<button type="submit" aria-label="Join">→</button>
			<span role="status">{{ notice }}</span>
		</form>
	</header>
</template>

<style scoped>
/* One colour: the pale cyan of Uranus's methane haze. */
header {
	--uranus: #b5f1ee;
	color: var(--uranus);
	font: 400 0.75rem/1 ui-monospace, "SF Mono", Menlo, monospace;
	text-transform: uppercase;
	letter-spacing: 0.3em;
}
svg {
	position: fixed;
	z-index: 20;
	left: 50%;
	top: 46%;
	width: min(96vw, 96vh);
	height: min(96vw, 96vh);
	transform: translate(-50%, -50%);
	overflow: visible;
	pointer-events: none;
	filter: drop-shadow(0 0 6px rgb(0 40 50 / 0.7));
}
.ring {
	fill: none;
	stroke: var(--uranus);
	stroke-opacity: 0.28;
	stroke-width: 0.8;
}
.planet {
	opacity: 0.94;
}
text {
	fill: var(--uranus);
	font-size: 15px;
	letter-spacing: 5px;
}
a {
	pointer-events: auto;
	cursor: pointer;
}
a:hover text,
a:focus-visible text {
	fill: #fff;
	font-weight: 700;
}
a:focus-visible {
	outline: none;
}

form {
	position: fixed;
	z-index: 20;
	left: clamp(1rem, 3vw, 2.5rem);
	bottom: clamp(1rem, 3vh, 2rem);
	display: flex;
	align-items: baseline;
	gap: 0.6rem;
	text-shadow: 0 0 4px rgb(0 40 50 / 0.8);
}
input {
	width: 11rem;
	padding: 0.3rem 0;
	border-bottom: 1px solid currentColor;
	color: #fff;
	letter-spacing: 0.1em;
	text-transform: none;
}
input::placeholder {
	color: var(--uranus);
	opacity: 0.6;
	text-transform: uppercase;
}
input:focus-visible {
	outline: none;
	border-color: #fff;
}
button {
	padding: 0.3rem 0.4rem;
	cursor: pointer;
}
button:focus-visible {
	outline: 1px solid #fff;
}
</style>
