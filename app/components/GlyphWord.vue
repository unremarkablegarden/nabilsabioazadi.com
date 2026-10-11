<script setup lang="ts">
// Latin capitals as they might be remembered thousands of years on: each letter pared down to the
// fewest strokes that still tell it from the others, drawn as a single hair-thin line. A has lost
// its bar and E its stem. Every glyph sits on a grid 4 wide and 6 tall.
const GLYPHS: Record<string, { path: string; width: number }> = {
	A: { path: "M0 6 L2 0 L4 6", width: 4 },
	B: { path: "M0 6 V0 H2 A1.5 1.5 0 0 1 2 3 H0 M2 3 H2.5 A1.5 1.5 0 0 1 2.5 6 H0", width: 4 },
	C: { path: "M3.7 1.2 A2 3 0 1 0 3.7 4.8", width: 4 },
	D: { path: "M0 0 V6 H1 A3 3 0 0 0 1 0 H0", width: 4 },
	E: { path: "M0 0 H4 M0 3 H3 M0 6 H4", width: 4 },
	G: { path: "M3.7 1.2 A2 3 0 1 0 3.7 4.8 V3 H2.2", width: 4 },
	I: { path: "M0 0 V6", width: 0 },
	L: { path: "M0 0 V6 H3.6", width: 3.6 },
	N: { path: "M0 6 V0 L4 6 V0", width: 4 },
	O: { path: "M2 0 A2 3 0 1 0 2 6 A2 3 0 1 0 2 0", width: 4 },
	R: { path: "M0 6 V0 H2.2 A1.6 1.6 0 0 1 2.2 3.2 H0 M2 3.2 L4 6", width: 4 },
	S: { path: "M3.8 0.9 C3 -0.3 0 -0.2 0.2 1.6 C0.4 3.2 3.8 2.8 3.8 4.5 C3.8 6.2 0.8 6.4 0.1 5", width: 4 },
	T: { path: "M0 0 H4 M2 0 V6", width: 4 },
	W: { path: "M0 0 L1 6 L2 1.5 L3 6 L4 0", width: 4 },
	Z: { path: "M0 0 H4 L0 6 H4", width: 4 },
};
// Space between letters, and the width of a word space, in grid units. Set very wide.
const GAP = 2.4;
const SPACE = 2.6;

const props = defineProps<{ text: string }>();

const layout = computed(() => {
	let x = 0;
	const letters: { path: string; x: number }[] = [];
	for (const character of props.text.toUpperCase()) {
		const glyph = GLYPHS[character];
		if (glyph) {
			letters.push({ path: glyph.path, x });
			x += glyph.width + GAP;
		} else {
			x += SPACE;
		}
	}
	return { letters, width: Math.max(0, x - GAP) };
});
</script>

<template>
	<span class="glyph-word">
		<span class="sr-only">{{ text }}</span>
		<!-- Half a unit of room all round so the hairline is not clipped at the edges. -->
		<svg :viewBox="`-0.5 -0.5 ${layout.width + 1} 7`" aria-hidden="true">
			<path
				v-for="(letter, i) in layout.letters"
				:key="i"
				:d="letter.path"
				:transform="`translate(${letter.x} 0)`"
				:style="{ '--order': i }"
				pathLength="1"
			/>
		</svg>
	</span>
</template>

<style scoped>
.glyph-word {
	display: inline-block;
}
svg {
	display: block;
	height: 1em;
	overflow: visible;
	/* A faint dark edge, so a white hairline still shows against a white sky. */
	filter: drop-shadow(0 0 0.5px #000) drop-shadow(0 0 3px rgb(0 0 0 / 0.55));
}
path {
	fill: none;
	stroke: currentColor;
	/* In grid units (a seventh of the letter height), so the drawing-in below can measure the path. */
	stroke-width: var(--hair, 0.36);
	stroke-linejoin: miter;
	/* Each letter is drawn in, one after the other, like a thread being laid. */
	stroke-dasharray: 1;
	animation: draw 0.9s calc(var(--order) * 70ms + var(--delay, 0s)) cubic-bezier(0.3, 0, 0.1, 1) backwards;
}
@keyframes draw {
	from {
		stroke-dashoffset: 1;
	}
}
@media (prefers-reduced-motion: reduce) {
	path {
		animation: none;
	}
}
</style>
