<script setup lang="ts">
// Self-hosted, so the site makes no request to a font service.
import "@fontsource/six-caps/latin-400.css";

// The newsletter form has nowhere to send addresses yet, so it says so instead of pretending.
const email = ref("");
const notice = ref("");
const join = () => {
	notice.value = "Not open yet";
};

// Each word is cut once across and sewn back out of line. cut is how far down the cut falls and
// shift how far the upper piece is moved, in ems. The letters are only about 0.2em wide and
// nearly all upright strokes, so more cuts or bigger shifts make one word look like several.
const links = [
	{ to: "/writing", label: "Writing", size: "writing", cut: 62, shift: 0.03 },
	{ to: "/art", label: "Recent art", size: "art", cut: 38, shift: -0.035 },
	{ to: "/contact", label: "Contact", size: "contact", cut: 71, shift: -0.025 },
];
</script>

<template>
	<header>
		<p class="mark">Nabil Sabio Azadi</p>
		<nav aria-label="Main">
			<NuxtLink v-for="(link, i) in links" :key="link.to" :to="link.to" class="line" :class="link.size">
				<span class="index">0{{ i + 1 }}</span>
				<span class="cut" :style="{ '--cut': `${link.cut}%`, '--shift': `${link.shift}em` }">
					<span class="band upper" aria-hidden="true">{{ link.label }}</span>
					<span class="band lower">{{ link.label }}</span>
				</span>
			</NuxtLink>
		</nav>
		<form class="line news" @submit.prevent="join">
			<span class="index">04</span>
			<label for="news-email" class="cut" style="--cut: 50%; --shift: 0.03em">
				<span class="band upper" aria-hidden="true">Newsletter</span>
				<span class="band lower">Newsletter</span>
			</label>
			<span class="field">
				<input id="news-email" v-model="email" type="email" required placeholder="your@address" autocomplete="email" />
				<button type="submit">Join</button>
				<span role="status">{{ notice }}</span>
			</span>
		</form>
	</header>
</template>

<style scoped>
/* One tall, narrow display face at great size, against typewriter-sized notes. White with a hard
   black offset, like a print out of register, so it reads on a pale sky and a black sea alike.
   Red only for the seams and for what is under the pointer. */
header {
	--red: #e10600;
	--note: 400 0.7rem/1 "Courier New", Courier, monospace;
	position: fixed;
	z-index: 20;
	left: clamp(1rem, 3vw, 2.5rem);
	bottom: clamp(1rem, 3vh, 2rem);
	color: #fff;
	text-transform: uppercase;
	pointer-events: none;
}
header a,
header form {
	pointer-events: auto;
}

.mark {
	position: fixed;
	top: clamp(1rem, 3vh, 2rem);
	left: clamp(1rem, 3vw, 2.5rem);
	font: var(--note);
	letter-spacing: 0.35em;
	text-shadow: 1px 1px 0 #000;
}

.line {
	position: relative;
	display: block;
	width: max-content;
	font-family: "Six Caps", "Arial Narrow", sans-serif;
	/* Lines are set tighter than the letters are tall, so each bites into the one above. */
	line-height: 0.86;
	letter-spacing: 0.01em;
}
/* Sized by the height of the screen, but never wider than a narrow one. */
.writing {
	font-size: min(30vh, 58vw);
}
.art {
	font-size: min(17vh, 40vw);
	margin-left: 0.42em;
}
.contact {
	font-size: min(23vh, 54vw);
	margin-left: -0.03em;
}
.news {
	font-size: min(13vh, 38vw);
	margin-left: 0.9em;
}

.index {
	position: absolute;
	top: 0.6rem;
	right: calc(100% + 0.35rem);
	font: var(--note);
	text-shadow: 1px 1px 0 #000;
}
.writing .index {
	right: auto;
	left: 100%;
	margin-left: 0.5rem;
}

.cut {
	position: relative;
	display: block;
	text-shadow: 0.014em 0.014em 0 #000;
}
.band {
	display: block;
	transition: transform 0.18s cubic-bezier(0.2, 0, 0, 1), color 0.18s;
}
.band.upper {
	position: absolute;
	inset: 0;
	clip-path: inset(-0.2em -1em calc(100% - var(--cut)) -1em);
	transform: translateX(var(--shift));
}
.band.lower {
	clip-path: inset(var(--cut) -1em -0.2em -1em);
}
/* A line of red stitching along the seam. */
.cut::after {
	content: "";
	position: absolute;
	left: -0.04em;
	right: -0.04em;
	top: var(--cut);
	border-top: 1px dashed var(--red);
}

/* Under the pointer the word is pulled back true and turns red. */
.line:hover .band,
.line:focus-visible .band,
.news:focus-within .band {
	transform: none;
	color: var(--red);
}
.line:focus-visible {
	outline: none;
}
@media (prefers-reduced-motion: reduce) {
	.band {
		transition: none;
	}
}

.field {
	display: flex;
	align-items: baseline;
	gap: 0.6rem;
	margin-top: 0.5rem;
	font: var(--note);
	font-size: 0.85rem;
}
.field input {
	width: min(15rem, 48vw);
	padding: 0.35rem 0;
	border-bottom: 1px solid #fff;
	color: #fff;
	text-shadow: 1px 1px 0 #000;
	box-shadow: 1px 1px 0 #000;
}
.field input::placeholder {
	color: #fffc;
	text-transform: none;
}
.field input:focus-visible {
	outline: none;
	border-color: var(--red);
}
.field button {
	padding: 0.35rem 0.7rem;
	background: #fff;
	color: #000;
	text-transform: inherit;
	letter-spacing: 0.2em;
	cursor: pointer;
}
.field button:hover,
.field button:focus-visible {
	background: var(--red);
	outline: none;
}
.field [role="status"] {
	text-shadow: 1px 1px 0 #000;
}
</style>
