<script setup lang="ts">
// The About page: a statement, a picture of the owner, a paragraph or two, and links.
// Built to meet WCAG 2.2 AA: every word is on an opaque ground (the figures are beside each
// ground below), the order in the page is the order it is read in, the picture has a text
// alternative, and links are marked by an underline, not by colour alone.
//
// It is set in the navigation's manner: Helvetica Neue for what a thing is, Lyon for what is
// read, a narrow column of labels beside a wide column of matter, and spaces in multiples of
// half the text size.
defineProps<{ layout: string }>();
// The menu's drawer opens where this page's panel is. While it is open the page steps aside,
// or the two would lie over each other with this page's words and picture showing round the drawer.
const menuOpen = useState("menu-open", () => false);
// And until the drawer has come to rest: this page is never to appear while the drawer is moving.
const menuMoving = useState("menu-moving", () => false);
// And once the menu's Close has put it away, for the moment it lingers before it is gone.
const putAway = useState("panel-put-away", () => false);
// How the menu's drawer is handing over to this page (see "through" in SiteNavSwiss). Coming in
// over the drawer, or found beneath it as it melts, the page is there at once, not waiting for
// the drawer to be gone.
const becoming = useState("menu-becoming", () => "");
const aside = computed(() => menuOpen.value || putAway.value || (menuMoving.value && !["wave", "dissolve"].includes(becoming.value)));
// Tells the menu that this page is a panel over the picture, so that its Close leads back to
// the main screen (see SiteNavSwiss).
const pageIsPanel = useState("page-is-panel", () => false);
// Close goes back to the menu (the owner, 14 October), not to the bare picture: the panel turns
// back into the drawer, and once the drawer is at rest the address goes home beneath it. The
// keyboard goes to the menu's own button. (Without JavaScript it is a plain link home.)
const backToMenu = useState("menu-back", () => false);
const closeToMenu = () => {
	menuOpen.value = true;
	(document.querySelector("button[aria-controls=menu]") as HTMLElement | null)?.focus();
	const stop = watch(menuMoving, (moving) => {
		if (moving) return;
		stop();
		// Shut again before it came to rest: nothing more to do.
		if (!menuOpen.value) return;
		backToMenu.value = true;
		navigateTo("/");
	});
};
pageIsPanel.value = true;
onBeforeUnmount(() => (pageIsPanel.value = false));
onUnmounted(() => (putAway.value = false));
// The sky chart that lies behind the menu's words made this page untidy: here the words are
// many and the chart ran through them. So by default the page has none. ?sky=seal sets it
// small and clear of all the words, above the picture, like a seal on a document; ?sky=behind
// shows it behind the words as it was.
const sky = computed(() => useRoute().query.sky as string | undefined);
// Where the boat is and what time it keeps, for the almanac's page heading.
const readout = useState<{ place?: string; time: string }>("scene-readout", () => ({ time: "" }));

// The owner's own words (11 October 2026; human rights law added 23 October). The paragraphs carry a little HTML, for the titles of
// works, which are set in italics.
const statement = "Nabil Sabio Azadi is an artist, anthropologist, editor, poet and human rights law researcher.";
const paragraphs = [
	"Nabil was born and raised in Tāmaki Makaurau, Aotearoa. He is a Persian-New Zealand artist and is Tangata Tiriti. He comes from Persian healing lineages in Yazd and Shiraz, Iran. His work moves between painting, poetry, artist books, essays and curatorial practices, with a focus on accessibility, movement and chanting.",
	"He was Acting Editor at the Queensland Art Gallery | Gallery of Modern Art. His artist book <cite>For You The Traveller</cite> (2012) is held in Special Collections at UC Santa Cruz. From 2025–26, he was Editor of <cite>Asia Pacific Art Papers</cite>. He co-directs Tîr Aho Studio, a creative studio with a focus on accessibility, inclusion and equity.",
];
// `title` marks a label that is the title of a work, set in italics; `after` is plain words
// that follow it in the same entry.
// The Asia Pacific Art Papers address is Claude's best finding and could not be opened to
// check (the site refuses automated visitors): the owner should confirm it.
const links: { label: string; href: string; title?: boolean; after?: string }[] = [
	{ label: "Tîr Aho Studio", href: "https://www.tiraho.com.au" },
	{ label: "Asia Pacific Art Papers", href: "https://apap.qagoma.qld.gov.au/", title: true, after: ", Queensland Art Gallery | Gallery of Modern Art" },
];
</script>

<template>
	<main id="main" tabindex="-1" class="about" :class="{ aside, arriving: becoming.startsWith('into-'), [becoming]: ['wave', 'dissolve'].includes(becoming) }" :data-layout="layout">
		<!-- The panel's coloured shape, apart from its contents so that the picture can sit across its edge. -->
		<div class="back" aria-hidden="true">
			<MenuFigure v-if="sky === 'behind' || sky === 'seal'" class="trine" :class="{ seal: sky === 'seal' }" kind="sky" />
		</div>
		<div class="ground">
			<p v-if="layout === 'almanac'" class="heading key">
				<span>{{ readout.place }}</span>
				<span>Human time {{ readout.time }}</span>
			</p>
			<!-- The way back to the main screen, at the head of the page. -->
			<p class="leave"><a href="/" @click.prevent="closeToMenu">Close</a></p>
			<header class="row">
				<p class="key">About</p>
				<div>
					<!-- The opening line is the page's heading: it begins with the name, so the name is not set above it as well. -->
					<h1 class="statement">{{ statement }}</h1>
				</div>
			</header>

			<figure class="row">
				<figcaption class="key">
					Portrait<br />Photograph by
					<a class="credit" href="https://www.ameliajdowd.com/" target="_blank" rel="noopener" aria-label="Amelia J Dowd (opens in a new tab)">Amelia J Dowd</a>
				</figcaption>
				<!-- The owner's portrait, cropped square for the layouts that show it as a disc or a
				     square, and upright (four to five) for the others. The files are named for who is in
				     them and who made them, and carry the photographer's credit inside them (IPTC, which
				     Google Images reads), so that searches for the owner find this picture. -->
				<img
					class="picture inline"
					:src="['panel', 'klein'].includes(layout) ? '/about/nabil-sabio-azadi-by-amelia-j-dowd.jpg' : '/about/nabil-sabio-azadi-by-amelia-j-dowd-tall.jpg'"
					width="1120"
					:height="['panel', 'klein'].includes(layout) ? 1120 : 1400"
					alt="Nabil Sabio Azadi in black and white, seated at a table in a dark jacket, hands pressed together upright in front of the face so that one eye looks out past them. Along the edges of the hands are tattooed the words Long heal and Sun bearing."
				/>
			</figure>

			<div class="row words">
				<p class="key">Biography</p>
				<div>
					<!-- eslint-disable-next-line vue/no-v-html -->
					<p v-for="paragraph in paragraphs" :key="paragraph" class="text" v-html="paragraph" />
				</div>
			</div>

			<nav class="row" aria-label="Elsewhere">
				<p class="key">Elsewhere</p>
				<ul>
					<li v-for="link in links" :key="link.label">
						<a :href="link.href"><cite v-if="link.title">{{ link.label }}</cite><template v-else>{{ link.label }}</template>{{ link.after }}</a>
					</li>
				</ul>
			</nav>
		</div>
		<!-- The panel's disc. It lies across the panel's edge, so it is kept outside the panel's
		     scrolling box: inside it, some browsers (Safari) cut the picture off at the box's edge.
		     On a wide screen this is the picture shown and the one in the text above is hidden; on a
		     narrow screen it is the other way about, so only one is ever seen or read out. -->
		<img
			v-if="layout === 'panel'"
			class="picture disc"
			src="/about/nabil-sabio-azadi-by-amelia-j-dowd.jpg"
			width="1120"
			height="1120"
			alt="Nabil Sabio Azadi in black and white, seated at a table in a dark jacket, hands pressed together upright in front of the face so that one eye looks out past them. Along the edges of the hands are tattooed the words Long heal and Sun bearing."
		/>
	</main>
</template>

<style scoped>
.about {
	/* Pearl on the dark grounds: 14.8:1 on the green, 9.5:1 on Klein Blue; the dimmer tone 8.9:1 and 5.7:1. */
	--ink: #f4f1e8;
	--dim: #b4c0b3;
	--green: #10211a;
	--deep: #0b1f2e;
	--klein: #002fa7;
	--unit: 0.5rem;
	--key: 9rem;
	--bar: 4rem;
	color: var(--ink);
	font: 300 1rem/1.75 "Helvetica Neue LT", "Helvetica Neue", Helvetica, Arial, sans-serif;
	letter-spacing: 0.03em;
}
.about:focus {
	outline: none;
}
/* Out of sight, and out of reach of the keyboard and screen readers, while the menu is open.
   The sheet stays: it lies below the drawer, not beside it. */
.about {
	/* Eased, never sudden: it surfaces once the drawer is at rest, and sinks as the drawer comes. */
	transition: opacity 0.7s ease-out;
}
.about.aside:not([data-layout="sheet"]) {
	visibility: hidden;
	opacity: 0;
	transition: opacity 0.4s ease-in, visibility 0s 0.4s;
}
@media (prefers-reduced-motion: reduce) {
	.about,
	.about.aside {
		transition-duration: 0.2s;
	}
}
/* The drawer has become this page's ground, so the ground is shown at once, and only what is on
   it surfaces. */
.about.arriving {
	transition: none;
}
.about.arriving:not(.aside) .ground,
.about.arriving:not(.aside) .disc {
	animation: surface 0.6s ease-out both;
}
/* Coming in over the drawer, from the left, as the menu's drawer itself comes: quick at first and
   spending itself as it arrives. It is lifted over the drawer while it does. */
.about.wave .back,
.about.wave .ground,
.about.wave .picture.disc {
	z-index: 21;
	animation: tide-in 1.1s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.about.wave .ground {
	animation: tide-in 1.1s cubic-bezier(0.16, 1, 0.3, 1) both, surface 0.8s ease-out 0.35s both;
}
@keyframes surface {
	from {
		opacity: 0;
	}
}
@keyframes tide-in {
	from {
		transform: translateX(calc(-1 * var(--wide, 46rem) - 8rem));
	}
}
@media (prefers-reduced-motion: reduce) {
	.about.arriving:not(.aside) .ground,
	.about.arriving:not(.aside) .disc,
	.about.wave .back,
	.about.wave .ground,
	.about.wave .picture.disc {
		animation: surface 0.2s linear both;
	}
}

/* The grid: a narrow column for what a thing is, a wide one for the thing. */
.row {
	display: grid;
	grid-template-columns: var(--key) minmax(0, 1fr);
	column-gap: calc(var(--unit) * 4);
	align-items: baseline;
	padding: calc(var(--unit) * 4) 0;
	border-top: 1px solid color-mix(in srgb, currentColor 35%, transparent);
}
header.row {
	border-top: 0;
	padding-top: 0;
}
.key {
	font-size: 0.75rem;
	font-weight: 400;
	line-height: 1.75;
	letter-spacing: 0.18em;
	text-transform: uppercase;
	color: var(--dim);
}
/* Close: small capitals like the bar's items, as tall as a finger needs. */
.leave {
	margin-bottom: calc(var(--unit) * 3);
}
.leave a {
	min-height: 2.75rem;
	font: 400 0.75rem/1 "Helvetica Neue LT", "Helvetica Neue", Helvetica, Arial, sans-serif;
	letter-spacing: 0.18em;
	text-transform: uppercase;
	text-underline-offset: 0.5em;
}
h1:not(.statement) {
	font-size: 1.5rem;
	font-weight: 300;
	line-height: 1.4;
	letter-spacing: 0.08em;
}
.statement {
	max-width: 24em;
	font: 300 2rem/1.3 "Lyon Display", "Lyon Text", Georgia, serif;
	letter-spacing: 0.01em;
}
.text {
	max-width: 34em;
	font: 400 1.125rem/1.75 "Lyon Text", Georgia, "Times New Roman", serif;
	letter-spacing: 0.01em;
}
/* Titles of works. (Reached through :deep, since they come in with the paragraph's own HTML.) */
.text :deep(cite) {
	font-style: italic;
}
.text + .text {
	margin-top: calc(var(--unit) * 3);
}
/* The picture: upright, four to five, unless a layout says otherwise. */
.picture {
	display: block;
	width: min(100%, 22rem);
	height: auto;
	aspect-ratio: 4 / 5;
	object-fit: cover;
	border: 1px solid color-mix(in srgb, currentColor 45%, transparent);
}
ul {
	display: grid;
	gap: var(--unit);
}
a,
.waiting {
	display: inline-flex;
	align-items: center;
	min-height: 2.75rem;
	font: 400 1.125rem/1.5 "Lyon Text", Georgia, serif;
}
/* A link's words run on and wrap as one piece of text, with room above and below for a finger. */
li a {
	display: inline-block;
	min-height: 0;
	padding: calc(var(--unit) * 1.25) 0;
}
li cite {
	font-style: italic;
}
a {
	text-decoration: underline;
	text-decoration-thickness: 1px;
	text-underline-offset: 0.2em;
}
a:hover {
	text-decoration-thickness: 2px;
}
/* The photographer's name in the portrait's credit is part of the label, not a link set apart. */
a.credit {
	display: inline;
	min-height: 0;
	font: inherit;
	text-underline-offset: 0.35em;
}
a:focus-visible {
	outline: 3px solid currentColor;
	outline-offset: 3px;
}
.waiting {
	color: var(--dim);
}

/* 1. Sheet. The ocean is the cover; the page is an off-white sheet that scrolls up over it.
   Dark green on off-white, 14.8:1; the quieter tone 8:1. */
[data-layout="sheet"] {
	--ink: #10211a;
	--dim: #3d4a42;
	--key: 11rem;
	position: relative;
	z-index: 5;
	margin-top: calc(var(--bar) + 38vh);
	padding: calc(var(--unit) * 10) clamp(1.25rem, 5vw, 5rem) calc(var(--unit) * 16);
	background: #f4f1e8;
}
[data-layout="sheet"] .ground {
	max-width: 58rem;
}

/* 2. Panel. The menu's own shape and colour, kept on screen: Klein Blue deepening to green,
   its outer edge the limb of a moon, with the faint trine behind the words. The picture is a
   disc sitting across that edge at its widest point: a second, smaller moon. It has an opaque
   face and a pearl rim, since half of it lies over the moving picture. */
.back,
.heading {
	display: none;
}
[data-layout="panel"] .back,
[data-layout="almanac"] .back,
[data-layout="klein"] .back,
[data-layout="poster"] .back {
	display: block;
	position: fixed;
	z-index: 4;
	inset: var(--bar) auto 0 0;
	width: var(--wide);
	max-width: 100vw;
}
[data-layout="panel"] .ground,
[data-layout="almanac"] .ground,
[data-layout="klein"] .ground,
[data-layout="poster"] .ground {
	position: fixed;
	z-index: 5;
	inset: var(--bar) auto 0 0;
	box-sizing: border-box;
	width: var(--wide);
	max-width: 100vw;
	overflow-y: auto;
}
.trine {
	display: none;
}
[data-layout="panel"] {
	--wide: 46rem;
}
[data-layout="panel"] .back {
	background: linear-gradient(to bottom, var(--klein), var(--deep) 45%, var(--green));
	--radius: 80vh;
	clip-path: circle(var(--radius) at calc(100% - var(--radius)) 50%);
}
[data-layout="panel"] .trine {
	display: block;
	position: absolute;
	top: 14%;
	left: 4%;
	width: 62%;
	color: var(--ink);
	opacity: 0.3;
}
/* The seal: small, in the clear blue between the words and the panel's edge, above the picture. */
[data-layout="panel"] .trine.seal {
	top: calc(50% - 18.5rem);
	left: auto;
	right: 4.5rem;
	width: 8rem;
	opacity: 0.8;
}
@media (max-height: 720px) {
	[data-layout="panel"] .trine.seal {
		display: none;
	}
}
[data-layout="panel"] .ground {
	padding: calc(var(--unit) * 10) 16rem calc(var(--unit) * 12) calc(var(--unit) * 6);
}
[data-layout="panel"] .statement {
	font-size: 1.75rem;
}
[data-layout="panel"] figure {
	padding: 0;
	border: 0;
}
[data-layout="panel"] figure .key {
	padding: calc(var(--unit) * 4) 0;
	border-top: 1px solid color-mix(in srgb, currentColor 35%, transparent);
	grid-column: 1 / -1;
}
[data-layout="panel"] .picture.inline {
	display: none;
}
[data-layout="panel"] .picture.disc {
	position: fixed;
	z-index: 6;
	top: calc(var(--bar) + (100vh - var(--bar)) / 2 - 8rem);
	left: calc(var(--wide) - 10.5rem);
	width: 16rem;
	aspect-ratio: 1;
	border: 1px solid var(--ink);
	border-radius: 50%;
	background: #16283a;
}

/* 2a. Almanac. A page from a nautical almanac, the book of the sun's, moon's and stars' places
   that navigators work from, which is what this site computes. Upright and ruled, every row
   between hairlines, figures in columns, and at the head of the page where the boat is and
   what time it keeps. The picture is a plate with the corner marks of a printer's proof. */
[data-layout="almanac"] {
	--wide: 42rem;
	font-variant-numeric: tabular-nums;
}
[data-layout="almanac"] .back {
	background: var(--deep);
	border-right: 1px solid var(--ink);
}
[data-layout="almanac"] .ground {
	padding: calc(var(--unit) * 8) calc(var(--unit) * 6) calc(var(--unit) * 10);
}
[data-layout="almanac"] .heading {
	display: flex;
	justify-content: space-between;
	gap: calc(var(--unit) * 4);
	margin-bottom: calc(var(--unit) * 5);
	padding: calc(var(--unit) * 1.5) 0;
	border-top: 3px double var(--ink);
	border-bottom: 1px solid var(--ink);
	color: var(--ink);
}
[data-layout="almanac"] .row {
	padding: calc(var(--unit) * 3) 0;
	border-top-color: var(--ink);
}
[data-layout="almanac"] .statement {
	font-size: 1.5rem;
}
[data-layout="almanac"] .picture {
	position: relative;
	width: 13rem;
	border: 0;
	outline: 1px solid color-mix(in srgb, currentColor 45%, transparent);
	outline-offset: calc(var(--unit) * 1.5);
	margin: calc(var(--unit) * 1.5);
}

/* 2b. Klein. After Yves Klein's monochromes: the panel is one flat, unbroken field of his blue.
   No rules, no gradient, no ornament; a great deal of room; the statement large. Even the
   picture is given over to the blue. */
[data-layout="klein"] {
	--wide: 50vw;
	--key: 7rem;
}
[data-layout="klein"] .back {
	background: var(--klein);
}
[data-layout="klein"] .ground {
	padding: calc(var(--unit) * 14) clamp(2rem, 6vw, 7rem) calc(var(--unit) * 14) calc(var(--unit) * 6);
}
[data-layout="klein"] .row {
	padding: calc(var(--unit) * 5) 0;
	border: 0;
}
[data-layout="klein"] h1:not(.statement) {
	font-size: 1rem;
	letter-spacing: 0.18em;
	text-transform: uppercase;
}
[data-layout="klein"] .statement {
	margin-top: calc(var(--unit) * 5);
	font-size: 2.5rem;
	line-height: 1.2;
}
[data-layout="klein"] .picture {
	width: 14rem;
	aspect-ratio: 1;
	border: 0;
	background: #2a55cf;
}

/* 2c. Poster. After the Swiss poster (Müller-Brockmann, Hofmann): the grounds change places.
   The panel is the off-white of the mark and the ink is Klein's blue, 9.5:1 on it. One sans,
   light and large and set tight, flush left; the parts are numbered; one heavy rule at the head. */
[data-layout="poster"] {
	--wide: 44rem;
	--ink: #002fa7;
	--dim: #002fa7;
	counter-reset: part;
}
[data-layout="poster"] .back {
	background: #f4f1e8;
}
[data-layout="poster"] .ground {
	padding: calc(var(--unit) * 8) calc(var(--unit) * 7) calc(var(--unit) * 10) calc(var(--unit) * 6);
}
[data-layout="poster"] .row {
	counter-increment: part;
	border-top-color: var(--ink);
}
[data-layout="poster"] header.row {
	padding-top: calc(var(--unit) * 4);
	border-top: 6px solid var(--ink);
}
[data-layout="poster"] .row > .key::before {
	content: "0" counter(part) "\A";
	white-space: pre;
	font-weight: 700;
}
[data-layout="poster"] h1:not(.statement) {
	font-weight: 700;
	letter-spacing: 0.02em;
}
[data-layout="poster"] .statement {
	max-width: none;
	font: 300 2.5rem/1.1 "Helvetica Neue LT", "Helvetica Neue", Helvetica, Arial, sans-serif;
	letter-spacing: -0.01em;
}
[data-layout="poster"] .text,
[data-layout="poster"] a,
[data-layout="poster"] .waiting {
	font-family: "Helvetica Neue LT", "Helvetica Neue", Helvetica, Arial, sans-serif;
	font-weight: 400;
	font-size: 1rem;
	letter-spacing: 0.01em;
}
[data-layout="poster"] .picture {
	width: 15rem;
	border: 0;
	background: #002fa7;
	color: #f4f1e8;
}

/* 3. Portrait. The picture has the left of the screen to itself, full height; the words are
   on the dark green at the right and scroll if they are long. */
[data-layout="portrait"] .ground {
	position: fixed;
	z-index: 5;
	inset: var(--bar) 0 0 0;
	display: grid;
	grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
	grid-template-rows: auto auto 1fr;
	column-gap: clamp(1.5rem, 5vw, 5rem);
	box-sizing: border-box;
	padding: 0 clamp(1.25rem, 5vw, 5rem) 0 0;
	overflow-y: auto;
	background: var(--green);
}
[data-layout="portrait"] header,
[data-layout="portrait"] .words,
[data-layout="portrait"] nav {
	grid-column: 2;
}
[data-layout="portrait"] header {
	padding-top: calc(var(--unit) * 12);
}
[data-layout="portrait"] figure {
	grid-column: 1;
	grid-row: 1 / span 3;
	display: block;
	position: sticky;
	top: 0;
	height: calc(100vh - var(--bar));
	padding: 0;
	border: 0;
}
[data-layout="portrait"] .picture {
	width: 100%;
	height: 100%;
	aspect-ratio: auto;
	border: 0;
}
[data-layout="portrait"] figure .key {
	position: absolute;
	left: calc(var(--unit) * 3);
	bottom: calc(var(--unit) * 3);
}
[data-layout="portrait"] nav {
	padding-bottom: calc(var(--unit) * 10);
}

/* 4. Band. A low band on the deep blue across the foot of the screen, in three parts side by
   side; the ocean keeps most of the picture. */
[data-layout="band"] .ground {
	position: fixed;
	z-index: 5;
	inset: auto 0 0 0;
	display: grid;
	grid-template-columns: minmax(0, 5fr) auto minmax(0, 5fr) minmax(0, 3fr);
	column-gap: clamp(1.5rem, 3.5vw, 4rem);
	align-items: start;
	box-sizing: border-box;
	max-height: calc(100vh - var(--bar) - 6rem);
	padding: calc(var(--unit) * 6) clamp(1.25rem, 4vw, 4rem) calc(var(--unit) * 7);
	overflow-y: auto;
	background: var(--deep);
}
[data-layout="band"] .row {
	display: block;
	padding: 0;
	border: 0;
}
[data-layout="band"] .key {
	margin-bottom: calc(var(--unit) * 2);
}
[data-layout="band"] .statement {
	margin-top: calc(var(--unit) * 2);
	font-size: 1.5rem;
}
[data-layout="band"] .picture {
	width: 9rem;
}
[data-layout="band"] figure .key br,
[data-layout="band"] figure .key {
	max-width: 9rem;
}
[data-layout="band"] .text {
	font-size: 1rem;
}

/* Narrow screens: every layout becomes one column on an opaque ground, in reading order. */
@media (max-width: 820px) {
	.about[data-layout] .ground {
		position: relative;
		inset: auto;
		display: block;
		width: auto;
		max-height: none;
		margin-top: calc(var(--bar) + 30vh);
		padding: calc(var(--unit) * 7) calc(var(--unit) * 3) calc(var(--unit) * 10);
		clip-path: none;
		overflow: visible;
	}
	.about[data-layout="sheet"] {
		margin-top: 0;
		padding: 0;
		background: none;
	}
	.about[data-layout="sheet"] .ground {
		background: #f4f1e8;
	}
	.about[data-layout] .row {
		display: block;
		padding: calc(var(--unit) * 4) 0;
	}
	.about[data-layout] figure {
		position: static;
		height: auto;
	}
	.about[data-layout] .back {
		display: none;
	}
	.about[data-layout="panel"] .ground,
	.about[data-layout="almanac"] .ground {
		background: var(--deep);
	}
	.about[data-layout="klein"] .ground {
		background: var(--klein);
	}
	.about[data-layout="poster"] .ground {
		background: #f4f1e8;
	}
	.about[data-layout] .picture.disc {
		display: none;
	}
	.about[data-layout="panel"] .picture.inline {
		display: block;
	}
	.about[data-layout] .picture {
		position: static;
		margin: 0;
		width: min(100%, 20rem);
		height: auto;
		aspect-ratio: 4 / 5;
		border-radius: 0;
	}
	.about[data-layout] figure .key {
		position: static;
	}
	.key {
		margin-bottom: var(--unit);
	}
	.statement {
		font-size: 1.5rem;
	}
}
</style>
