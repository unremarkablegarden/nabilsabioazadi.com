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
// Third pass, at the owner's direction: the menu is reached the way it is on the Rick Owens site.
// A thin bar runs across the head of the page and the picture is otherwise left clear. On the
// left, Menu; in the middle, the signature mark, which leads home; on the right, the one or two
// things wanted most often. Menu opens the slab as a drawer below the bar. Unlike that site's
// bar, this one has an opaque ground, because text laid straight over a moving picture cannot
// keep a contrast ratio.
//
// The typeface files are licensed to the owner and are kept out of this public repository
// (public/fonts/licensed/ is git-ignored). Where they are missing, the system's own Helvetica
// Neue, Helvetica or Arial, and Georgia, stand in.
//
// Accessibility is as in the earlier slabs: all text is on an opaque ground (about 16:1),
// nothing moves but the drawer's own coming and going (stilled for anyone who asks their
// device for less motion), controls are at least 44px tall with a white focus ring, the form is labelled
// and speaks its status, there is a skip link, the ocean can be paused, and the slab folds away.

// Shared with OceanBackground, which stops drawing while this is true.
const paused = useState("motion-paused", () => false);
// Filled in by OceanBackground. This slab shows it, so the floating caption is turned off.
const readout = useState<{ place?: string; time: string; waves?: string; wind?: string }>("scene-readout", () => ({ time: "" }));
const captionInNavigation = useState("caption-in-navigation", () => false);
captionInNavigation.value = true;
onBeforeUnmount(() => (captionInNavigation.value = false));

// The drawer starts shut: the page opens on the picture. Shared, so that a page with a panel of
// its own in the same place (About) can step aside while the drawer is open.
const open = useState("menu-open", () => false);
// True from the moment the drawer starts to open or shut until it has come to rest. A panel
// page (About, Contact) keeps out of sight for as long: the owner must never see one appear
// suddenly while the drawer is still moving. Set at once, before anything is drawn again.
const moving = useState("menu-moving", () => false);
watch(open, () => (moving.value = true), { flush: "sync" });
const settled = () => (moving.value = false);
// The cut of the drawer's outer edge. ?shape= tries the others:
//   moon      part of a great disc, its edge the lit limb of a moon (the first, and the default)
//   straight  no cut: a plain upright slab
//   wave      the edge is a swell, running in and out down its length
//   sail      a straight edge leaning inward to the foot, like the leech of a sail
//   corner    upright, with the lower outer corner rounded off in one large curve
//   full      no edge at all: the drawer covers the whole picture
const SHAPES = ["moon", "straight", "wave", "sail", "corner", "full"];
const shape = computed(() => (SHAPES.includes(route.query.shape as string) ? (route.query.shape as string) : "moon"));
// The faint figure behind the words: the sky over the boat (the owner's choice). ?figure= shows the others.
const figure = computed(() => (route.query.figure as string) || "sky");
// How the sky chart and the words share the drawer. The first way, the chart's circle behind
// the links with the links' hairlines running across it, was a mess of crossing lines (the
// owner: "truly awful"). ?menu= tries the ways out of it:
//   field   no circle at all: the stars alone, spread behind the whole drawer like a night sky.
//           Nothing for the hairlines to cross (default while the owner chooses)
//   clear   the circle stays behind the links, and the links lose their hairlines
//   seal    the chart is small and stands by itself beside the name; nothing lies over it
//   within  the links are set inside the circle, centred, with no hairlines: the chart is their
//           frame. The owner is trying versions of this one (11 October 2026):
//     within        the serif links centred in a roomier circle (default while they choose)
//     within-caps   the links as small, widely spaced capitals in the sans: quiet, like the labels on a chart
//     within-left   a much larger circle running off the drawer's edge; the links flush left on
//                   the name's line with their numbers, as on the Swiss grid
//     within-name   the name goes inside too, small at the head of the circle, over the links
//   lines   as it was, for comparison
const MENUS = ["within", "within-caps", "within-left", "within-name", "field", "clear", "seal", "lines"];
const menu = computed(() => (MENUS.includes(route.query.menu as string) ? (route.query.menu as string) : "within"));
// How the name is set where the links are centred. The owner chose the stack (12 October 2026):
// three centred lines in the links' serif, large and set solid, larger than the links, so the
// name is the title. They then asked that Azadi be marked as the family name, apart from the
// two given names. A first round of ways to do it was turned down, and rightly: it dressed the
// family name up (capitals made smaller, a text face blown up to display size) and left the
// real fault alone, which is that three equal lines break the name by its shape and not by its
// sense. So, by the book: break where the sense breaks; let lines differ plainly in length;
// space capitals out and never the lower case; use each face at the size it was drawn for.
// ?name= tries them (and opens the drawer, to save a press):
//   stack   as first chosen: three equal lines, the middle name in italic
//   apart   the stack kept: the given names in italic and close together, the family name upright and a little apart
//   sense   two lines, as the mark itself has it (N S over A): the given names in italic on one long line, the family name upright beneath (the owner's choice, and the default)
//   grid    each of the three names has five letters: capitals on a grid of five by three, a hairline over the family name
//   credit  one small line in the reading serif, the family name in its true small capitals: how a bibliography marks a surname
const NAMES = ["stack", "apart", "sense", "grid", "credit"];
const name = computed(() => (NAMES.includes(route.query.name as string) ? (route.query.name as string) : "sense"));
const NAME = [
	{ word: "Nabil", part: "given" },
	{ word: "Sabio", part: "given" },
	{ word: "Azadi", part: "family" },
];
// The swell, as points down the drawer's right edge.
const wave = `polygon(0 0, ${Array.from({ length: 41 }, (_, i) => `${(89 + 10 * Math.sin((i / 40) * Math.PI * 2.6 + 0.6)).toFixed(1)}% ${(i * 2.5).toFixed(1)}%`).join(", ")}, 0 100%)`;
const menuButton = ref<HTMLButtonElement>();
onMounted(() => {
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) paused.value = true;
	if (route.query.name) open.value = true;
});
// A page that is itself a panel over the picture (About) says so here. Closing the drawer on
// such a page goes back to the main screen, the picture alone: to the owner the drawer and the
// panel are one thing, and Close should put both away.
const pageIsPanel = useState("page-is-panel", () => false);
// The panel page lingers a moment after the address has changed, while the main screen is
// made ready. It is told it has been put away, so it does not show itself again in that moment
// once the drawer has gone (it did: About came back for a second after Close).
const putAway = useState("panel-put-away", () => false);
const toggle = () => {
	if (open.value && pageIsPanel.value) {
		putAway.value = true;
		navigateTo("/");
	}
	open.value = !open.value;
};
// Escape shuts the drawer and hands the keyboard back to the button that opened it.
const shut = () => {
	if (!open.value) return;
	toggle();
	menuButton.value?.focus();
};
// The Newsletter item in the bar opens the drawer and goes straight to the field.
const toNewsletter = async () => {
	open.value = true;
	await nextTick();
	document.getElementById("news-email")?.focus();
};
// Following a link shuts the drawer, so the page it leads to is not hidden behind it.
const route = useRoute();
watch(() => route.path, () => (open.value = false));

// The newsletter form signs the address up on Kit and says, in words, how that went.
const email = ref("");
const notice = ref("");
const sending = ref(false);
// Google's check is fetched when the visitor comes to the field, so it is ready by the time they press Join.
const prepare = () => prepareNewsletter().catch(() => {});
// Two quiet guards against programs that fill in every form they find, in place of a captcha.
// A field no person can see or reach: only a program fills it in. And no person opens the page,
// finds the form and types an address inside three seconds.
const trap = ref("");
let arrived = 0;
onMounted(() => (arrived = Date.now()));
const join = async () => {
	if (sending.value) return;
	if (trap.value || Date.now() - arrived < 3000) {
		// It is told what a person would be told, and nothing is sent.
		notice.value = NEWSLETTER_WELCOME;
		return;
	}
	sending.value = true;
	notice.value = "Sending…";
	const result = await joinNewsletter(email.value).catch((error) => ({ joined: false, why: String(error?.message ?? error) }));
	sending.value = false;
	// If it fails, the reason Kit gave is shown too: it tells the visitor (and the owner) what to put right.
	notice.value = result.joined ? NEWSLETTER_WELCOME : `That did not go through, and your address was not saved.${result.why ? ` (${result.why})` : ""} Please try again in a moment.`;
	if (result.joined) email.value = "";
};

// Writing and Art wait until there is work to show; their pages are still in the project.
const links = [
	{ to: "/about", label: "About" },
	// The studio has a site of its own.
	{ to: "https://www.tiraho.com.au", label: "Tîr Aho Studio" },
	{ to: "/contact", label: "Contact" },
];
</script>

<template>
	<header class="site" @keydown.esc="shut">
		<a class="skip" href="#main">Skip to content</a>

		<div class="bar">
			<div class="side">
				<button ref="menuButton" type="button" class="item" :aria-expanded="open" aria-controls="menu" @click="toggle">
					{{ open ? "Close" : "Menu" }}
				</button>

				<!-- The drawer comes straight after its button, so the keyboard goes from one into the other. -->
				<Transition name="tide" @after-enter="settled" @after-leave="settled" @enter-cancelled="settled" @leave-cancelled="settled">
				<div v-show="open" id="menu" class="slab" :data-shape="shape" :data-menu="menu" :data-name="name" :style="shape === 'wave' ? { clipPath: wave } : undefined">
					<!-- Decoration only: a faint figure behind the text. ?figure= tries the others (see MenuFigure). -->
					<MenuFigure class="trine" :kind="figure" :ring="menu !== 'field'" />
					<div class="body">
			<div class="row">
				<!-- The grid sets the name letter by letter, so there it is drawn for the eye and said once, whole, for screen readers. -->
				<p v-if="name === 'grid'" class="name">
					<span class="said">Nabil Sabio Azadi</span>
					<span class="set" aria-hidden="true"><span v-for="n in NAME" :key="n.word" :class="n.part"><i v-for="(letter, k) in n.word" :key="k">{{ letter }}</i></span></span>
				</p>
				<p v-else class="name"><span class="given">Nabil</span><br /> <span class="given">Sabio</span><br /> <span class="family">Azadi</span></p>
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

			<!-- Not on the two-column grid: the field is given the slab's whole width, and room above and below. -->
			<form class="rule news" @submit.prevent="join">
				<label for="news-email" class="key">Newsletter</label>
				<p id="news-hint" class="reading">Your email address</p>
				<input id="news-email" v-model="email" type="email" required autocomplete="email" aria-describedby="news-hint news-status" @focus="prepare" />
				<button type="submit" class="solid" :aria-disabled="sending">Join</button>
				<p id="news-status" class="reading" role="status">{{ notice }}</p>
				<!-- The trap: out of sight, out of the keyboard's way and hidden from screen readers. -->
				<input v-model="trap" class="trap" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" />
				<!-- Google asks for this wording wherever its badge is not shown. -->
				<p v-if="NEWSLETTER_CAPTCHA" class="small">
					This form is protected by reCAPTCHA. Google's
					<a class="link" href="https://policies.google.com/privacy">Privacy Policy</a> and
					<a class="link" href="https://policies.google.com/terms">Terms of Service</a> apply.
				</p>
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
				</div>
				</Transition>

				<NuxtLink to="/contact" class="item wide">Contact</NuxtLink>
			</div>

			<!-- The owner's signed mark, made from their own artwork (Logo Signé, Version 2) as a
			     single-colour image that takes the ink colour. It leads home. -->
			<NuxtLink to="/" class="home" aria-label="Nabil Sabio Azadi, home"><span class="mark" /></NuxtLink>

			<div class="side end">
				<button type="button" class="item wide" @click="toNewsletter">Newsletter</button>
				<!-- The pause button: the sign everyone knows, two bars; a triangle once paused. It is drawn
				     as one more word of the bar would be: the height of its capitals, the weight of their strokes.
				     Its name for screen readers is the one word, Pause or Play, and changes with it
				     (so it is not also marked as pressed, which would say the same thing twice). -->
				<button type="button" class="control" :aria-label="paused ? 'Play' : 'Pause'" :title="paused ? 'Play the moving background' : 'Pause the moving background'" @click="paused = !paused">
					<svg viewBox="0 0 12 12" aria-hidden="true">
						<path v-if="paused" d="M2.5 1 L11 6 L2.5 11 Z" />
						<path v-else d="M2.5 1 H4.2 V11 H2.5 Z M7.8 1 H9.5 V11 H7.8 Z" />
					</svg>
				</button>
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

.site {
	/* Pearl on deep sea: the owner's off-white, on a ground that runs from sea-blue at the head
	   to their dark green at the foot. About 15:1 throughout; the dimmer tone about 9:1. */
	--ground: #10211a;
	--deep: #0b1f2e;
	/* International Klein Blue, the ground of the bar. It is opaque, so the text on it keeps its
	   contrast whatever the picture behind is doing: the off-white ink is 9.5:1 on it, the dimmer
	   tone 5.7:1, the white focus ring 10.7:1 (WCAG 2.2 AA asks 4.5:1 for text and 3:1 for the
	   ring). Should a light ground ever be wanted, the same blue serves as the ink: 10.7:1 on white. */
	--klein: #002fa7;
	--ink: #f4f1e8;
	--dim: #b4c0b3;
	/* The unit all spacing is a multiple of, the width of the narrow column, and the bar's height. */
	--unit: 0.5rem;
	--key: 6.5rem;
	--bar: 4rem;
	color: var(--ink);
	font: 300 1rem/1.75 "Helvetica Neue LT", "Helvetica Neue", Helvetica, Arial, sans-serif;
	letter-spacing: 0.03em;
}

/* The bar: one thin, opaque line of small capitals across the head of the page. */
.bar {
	position: fixed;
	z-index: 21;
	inset: 0 0 auto 0;
	display: grid;
	grid-template-columns: 1fr auto 1fr;
	/* The row is the bar's own height and no more. Left to itself it grew to the height of the
	   mark, which hangs below the bar, and the words were centred in that: nearer the foot of
	   the blue than its head. */
	grid-template-rows: var(--bar);
	align-items: center;
	height: var(--bar);
	padding: 0 calc(var(--unit) * 3);
	background: var(--klein);
}
.side {
	display: flex;
	align-items: center;
	gap: calc(var(--unit) * 2);
}
.side.end {
	justify-content: flex-end;
}
.item {
	display: inline-flex;
	align-items: center;
	min-height: 2.75rem;
	/* (The little at the top sets the capitals themselves, which have nothing below the line,
	   midway between the head and foot of the blue.) */
	padding: 0.22em calc(var(--unit) * 1.5) 0;
	font-size: 0.75rem;
	font-weight: 400;
	letter-spacing: 0.18em;
	text-transform: uppercase;
	cursor: pointer;
}
.item:hover,
.item:focus-visible,
.item[aria-expanded="true"],
.item[aria-current="page"] {
	text-decoration: underline;
	text-decoration-thickness: 1px;
	text-underline-offset: 0.5em;
}
/* The pause button. No ring: in a bar this thin a ring was the heaviest thing in it. The sign
   alone, the size of the bar's capitals and in their ink, set at the same distance from the
   right edge as Menu is from the left. The button round it is still 44px each way to press. */
.control {
	display: inline-grid;
	place-items: center;
	width: 2.75rem;
	height: 2.75rem;
	min-height: 0;
	cursor: pointer;
}
.control svg {
	width: 0.75rem;
	height: 0.75rem;
	fill: var(--ink);
	overflow: visible;
}
/* Hover and focus mark it as they mark the bar's words: with a line beneath. */
.control:hover svg,
.control:focus-visible svg {
	border-bottom: 1px solid var(--ink);
	padding-bottom: 0.4rem;
	margin-bottom: calc(-0.4rem - 1px);
	box-sizing: content-box;
}
/* The signature, in the middle. Its loops are let hang a little below the bar. */
/* It stays above the open drawer, with its disc, so the drawer never cuts across it. */
.home {
	position: relative;
	z-index: 21;
	display: block;
	align-self: start;
	padding: 0.35rem 0.75rem 0;
}
.mark {
	display: block;
	height: 4.5rem;
	aspect-ratio: 733 / 757;
	background: var(--ink);
	/* Copies of the mark made at the sizes it is shown at (one for each screen density), shrunk
	   smoothly with its fine pen lines kept. Left to the browser to shrink from the full-size
	   image, those lines broke up into steps and dots. */
	-webkit-mask: -webkit-image-set(url("/brand/nsa-signed-72.png") 1x, url("/brand/nsa-signed-144.png") 2x, url("/brand/nsa-signed-216.png") 3x) center / contain no-repeat;
	mask: image-set(url("/brand/nsa-signed-72.png") 1x, url("/brand/nsa-signed-144.png") 2x, url("/brand/nsa-signed-216.png") 3x) center / contain no-repeat;
}
/* A dark disc behind the part of the mark that hangs below the bar, so it never sits on the bare picture. */
.home::before {
	content: "";
	position: absolute;
	z-index: -1;
	top: -1.4rem;
	left: 50%;
	width: 7rem;
	height: 7rem;
	border-radius: 50%;
	background: var(--klein);
	transform: translateX(-50%);
}

/* The drawer: the slab, hung below the bar. */
.slab {
	position: fixed;
	z-index: 20;
	inset: var(--bar) auto 0 0;
	box-sizing: border-box;
	width: 33rem;
	max-width: 100vw;
	/* Wide margins, and more on the right and at the foot, where the curved edge takes some of the slab away. */
	padding: calc(var(--unit) * 7) 9.5rem calc(var(--unit) * 14) calc(var(--unit) * 6);
	overflow-y: auto;
	/* It hangs from the bar in the bar's blue and deepens to the owner's dark green. */
	background: linear-gradient(to bottom, var(--klein), var(--deep) 45%, var(--ground));
	/* The slab is part of a great disc: its outer edge is a true arc of a circle, the lit limb of
	   a moon, bowing out to the slab's full width at mid-height and falling well back at head and foot. */
	--radius: 74vh;
	clip-path: circle(var(--radius) at calc(100% - var(--radius)) 50%);
}
/* The drawer comes in as a tide does: from the left, quick at first and spending itself as it
   arrives, its moon-edge leading; its words surface a little after the water has. It goes out
   the way it came, a little sooner, words first. */
.tide-enter-active {
	transition: transform 1.1s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.7s ease-out;
}
.tide-leave-active {
	transition: transform 0.8s cubic-bezier(0.6, 0, 0.75, 0.3), opacity 0.6s ease-in 0.2s;
}
.tide-enter-from,
.tide-leave-to {
	transform: translateX(-100%);
	opacity: 0;
}
.tide-enter-active .body,
.tide-enter-active .trine {
	transition: opacity 0.8s ease-out 0.3s, transform 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.15s;
}
.tide-leave-active .body,
.tide-leave-active .trine {
	transition: opacity 0.35s ease-in;
}
.tide-enter-from .body {
	transform: translateX(-2rem);
}
.tide-enter-from .body,
.tide-enter-from .trine,
.tide-leave-to .body,
.tide-leave-to .trine {
	opacity: 0;
}
/* For anyone who has asked for less motion nothing travels: it fades, briefly. */
@media (prefers-reduced-motion: reduce) {
	.tide-enter-active,
	.tide-leave-active,
	.tide-enter-active .body,
	.tide-enter-active .trine,
	.tide-leave-active .body,
	.tide-leave-active .trine {
		transition: opacity 0.2s linear;
	}
	.tide-enter-from,
	.tide-leave-to,
	.tide-enter-from .body {
		transform: none !important;
	}
}
/* Ways for the sky chart and the words to share the drawer (?menu=). */
/* Field: the stars alone, larger than the drawer and bled off its edges, fixed while the words scroll. */
.slab[data-menu="field"] .trine:not([data-kind="trine"]) {
	position: fixed;
	top: calc(var(--bar) + 2vh);
	left: -6rem;
	width: 46rem;
	opacity: 0.38;
}
/* Clear: the circle keeps its place, and the links go without hairlines, parted by space alone. */
.slab[data-menu="clear"] nav a,
.slab[data-menu^="within"] nav a {
	border-top: 0;
}
.slab[data-menu="clear"] form.rule,
.slab[data-menu^="within"] form.rule {
	margin-top: calc(var(--unit) * 6);
}
/* Seal: small, in the narrow column beside the name, with nothing over it. */
.slab[data-menu="seal"] .trine:not([data-kind="trine"]) {
	top: calc(var(--unit) * 7);
	left: calc(var(--unit) * 5);
	width: 6.5rem;
	opacity: 0.85;
}

/* Within: the circle is the frame, and the links are set inside it with no hairlines.
   --ring is the circle's width; the list of links is a square of the same size laid over it. */
.slab[data-menu^="within"] {
	--ring: 26rem;
}
.slab[data-menu^="within"] .trine:not([data-kind="trine"]) {
	/* Below the name, whatever its height: the drawer's margin, the name (--name), and the
	   room the list of links leaves above itself. The circle is not in the run of the text,
	   so it has to be told; without this a taller name pushed the links down out of it. */
	top: calc(6rem + var(--name, 6.5rem));
	left: calc(var(--unit) * 6 + (20.5rem - var(--ring)) / 2);
	width: var(--ring);
	opacity: 0.45;
}
.slab[data-menu^="within"] ol {
	display: grid;
	align-content: center;
	width: var(--ring);
	height: var(--ring);
	margin: calc(var(--unit) * 5) 0 0 calc((20.5rem - var(--ring)) / 2);
}
.slab[data-menu^="within"] nav a {
	display: block;
	min-height: 0;
	padding: calc(var(--unit) * 1.25) 0;
	text-align: center;
}
.slab[data-menu^="within"] nav .key {
	display: none;
}
.slab[data-menu^="within"] .title {
	font-size: 2.375rem;
	line-height: 1.15;
}
.slab[data-menu^="within"] nav a:hover,
.slab[data-menu^="within"] nav a:focus-visible {
	background: none;
	color: var(--ink);
	box-shadow: none;
}
.slab[data-menu^="within"] nav a:hover .title,
.slab[data-menu^="within"] nav a:focus-visible .title {
	text-decoration: underline;
	text-decoration-thickness: 1px;
	text-underline-offset: 0.2em;
}

/* The name, where the links are centred. Hung on the grid's second line in the light sans and
   broken over three lines, it stood beside the centred serif links without belonging to them
   (the owner: it "ruins the menu"). Here it is on the links' own axis, straight under the signed
   mark, in the links' serif, large and set solid: the title, and the links what follows it.
   ?name= marks the family name in different ways (see NAMES above). */
.slab:is([data-menu="within"], [data-menu="within-caps"]) .body > .row:first-child {
	display: block;
	text-align: center;
}
.slab:is([data-menu="within"], [data-menu="within-caps"]) .name {
	font: 300 3.5rem/1 "Lyon Display", "Lyon Text", Georgia, serif;
	letter-spacing: 0;
}
/* The height of each setting of the name, for the circle to hang below (see --name above). */
.slab:is([data-menu="within"], [data-menu="within-caps"])[data-name="stack"] {
	--name: 10.5rem;
}
.slab:is([data-menu="within"], [data-menu="within-caps"])[data-name="apart"] {
	--name: 11.5rem;
}
.slab:is([data-menu="within"], [data-menu="within-caps"])[data-name="sense"] {
	--name: 8.65rem;
}
.slab:is([data-menu="within"], [data-menu="within-caps"])[data-name="grid"] {
	--name: 11.65rem;
}
.slab:is([data-menu="within"], [data-menu="within-caps"])[data-name="credit"] {
	--name: 2.05rem;
}
.slab:is([data-menu="within"], [data-menu="within-caps"])[data-name="stack"] .given:nth-of-type(2) {
	font-style: italic;
}
/* Apart: the given names are one thing, in the italic, and the family name another, upright
   and with a little more room above it than there is between the two of them. */
.slab:is([data-menu="within"], [data-menu="within-caps"]):is([data-name="apart"], [data-name="sense"]) .given {
	font-style: italic;
}
.slab:is([data-menu="within"], [data-menu="within-caps"])[data-name="apart"] .family {
	display: inline-block;
	margin-top: 0.28em;
}
/* Sense: the line breaks once, where the name does. A long line over a short one. The size
   gives way on a narrow screen so the long line never has to turn. */
.slab:is([data-menu="within"], [data-menu="within-caps"])[data-name="sense"] .name {
	font-size: min(4rem, 17vw);
	line-height: 1.08;
}
.slab:is([data-menu="within"], [data-menu="within-caps"])[data-name="sense"] .name br:first-of-type {
	display: none;
}
/* Grid: capitals, each in a cell of its own, so the fifteen letters stand in five columns.
   The hairline is the one the drawer uses everywhere to part one thing from the next. */
.slab:is([data-menu="within"], [data-menu="within-caps"])[data-name="grid"] .name {
	font-size: min(2.5rem, 10.5vw);
	line-height: 1.4;
	text-transform: uppercase;
}
.slab:is([data-menu="within"], [data-menu="within-caps"])[data-name="grid"] .set {
	display: inline-block;
}
.slab:is([data-menu="within"], [data-menu="within-caps"])[data-name="grid"] .set > span {
	display: block;
}
.slab:is([data-menu="within"], [data-menu="within-caps"])[data-name="grid"] .set i {
	display: inline-block;
	width: 1.2em;
	font-style: normal;
	text-align: center;
}
.slab:is([data-menu="within"], [data-menu="within-caps"])[data-name="grid"] .family {
	margin-top: 0.22em;
	padding-top: 0.22em;
	border-top: 1px solid rgb(180 192 179 / 0.45);
}
.said {
	position: absolute;
	width: 1px;
	height: 1px;
	overflow: hidden;
	clip-path: inset(50%);
	white-space: nowrap;
}
/* Credit: the reading serif at a reading size, where its small capitals belong. The family
   name keeps its capital A; the small capitals after it are spaced out a little, as they ask. */
.slab:is([data-menu="within"], [data-menu="within-caps"])[data-name="credit"] .name {
	font: 400 1.375rem/1.5 "Lyon Text", Georgia, "Times New Roman", serif;
	letter-spacing: 0.01em;
}
.slab:is([data-menu="within"], [data-menu="within-caps"])[data-name="credit"] .name br {
	display: none;
}
.slab:is([data-menu="within"], [data-menu="within-caps"])[data-name="credit"] .family {
	font-variant-caps: small-caps;
	letter-spacing: 0.07em;
	margin-right: -0.07em;
}

/* Capitals: the links as small capitals in the sans, set wide: the voice of a chart's labels. */
.slab[data-menu="within-caps"] {
	--ring: 22rem;
}
.slab[data-menu="within-caps"] nav a {
	padding: calc(var(--unit) * 2.5) 0;
}
.slab[data-menu="within-caps"] .title,
.slab[data-menu="within-caps"] nav a:hover .title,
.slab[data-menu="within-caps"] nav a[aria-current="page"] .title {
	font: 300 1.125rem/1.4 "Helvetica Neue LT", "Helvetica Neue", Helvetica, Arial, sans-serif;
	letter-spacing: 0.3em;
	text-transform: uppercase;
}
.slab[data-menu="within-caps"] nav a[aria-current="page"] .title {
	font-weight: 500;
}

/* Left: a circle much larger than the drawer, running off its edge, so only part of its sweep
   shows. The links stay on the Swiss grid inside it: numbers in the narrow column, words flush
   left on the name's line. */
.slab[data-menu="within-left"] .trine:not([data-kind="trine"]) {
	top: 8rem;
	left: -11rem;
	width: 38rem;
	opacity: 0.4;
}
.slab[data-menu="within-left"] ol {
	display: block;
	width: auto;
	height: auto;
	margin: calc(var(--unit) * 8) 0 0;
}
.slab[data-menu="within-left"] nav a {
	display: grid;
	min-height: 4.75rem;
	text-align: left;
}
.slab[data-menu="within-left"] nav .key {
	display: block;
}
.slab[data-menu="within-left"] .title {
	font-size: 3rem;
	line-height: 1.25;
}

/* Name: the circle holds the whole head of the drawer. The name is small at its top, in
   capitals, and the links follow beneath it. */
.slab[data-menu="within-name"] {
	--ring: 27rem;
}
.slab[data-menu="within-name"] .trine:not([data-kind="trine"]) {
	top: calc(var(--unit) * 5);
}
.slab[data-menu="within-name"] .body > .row:first-child {
	display: block;
	width: var(--ring);
	margin-left: calc((20.5rem - var(--ring)) / 2);
	padding-top: calc(var(--unit) * 11);
	text-align: center;
}
.slab[data-menu="within-name"] .name {
	font-size: 0.8125rem;
	font-weight: 400;
	letter-spacing: 0.3em;
	text-transform: uppercase;
}
.slab[data-menu="within-name"] .name br {
	display: none;
}
.slab[data-menu="within-name"] ol {
	height: auto;
	margin-top: calc(var(--unit) * 4);
	padding-bottom: calc(var(--unit) * 10);
}

/* The other cuts (?shape=). Each sets the drawer's width, the room kept clear on its right
   for the cut, and the cut itself. */
.slab[data-shape="straight"] {
	width: 28rem;
	padding-right: calc(var(--unit) * 6);
	clip-path: none;
}
.slab[data-shape="wave"] {
	width: 34rem;
	padding-right: 9.5rem;
}
.slab[data-shape="sail"] {
	width: 40rem;
	padding-right: 15.5rem;
	clip-path: polygon(0 0, 100% 0, 66% 100%, 0 100%);
}
.slab[data-shape="corner"] {
	width: 30rem;
	padding-right: calc(var(--unit) * 8);
	padding-bottom: 14rem;
	clip-path: inset(0 round 0 0 16rem 0);
}
.slab[data-shape="full"] {
	width: 100vw;
	padding-right: calc(100vw - 30rem);
	clip-path: none;
}
/* Faint enough to make no difference to the contrast of the text over it. */
.trine {
	position: absolute;
	top: 22%;
	left: 8%;
	width: 70%;
	color: var(--ink);
	opacity: 0.16;
}
/* The figures drawn from the sky and the sea have more in them, and are let show a little more. */
.trine:not([data-kind="trine"]) {
	top: 16%;
	left: 4%;
	width: 78%;
	opacity: 0.32;
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


.body {
	position: relative;
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
	padding-top: calc(var(--unit) * 5);
	padding-bottom: calc(var(--unit) * 5);
}
/* A roomy field: the full width of the slab's text, tall, in the reading serif at a larger size,
   with the button on a line of its own beneath it. */
.news input {
	display: block;
	width: 100%;
	box-sizing: border-box;
	min-height: 3.75rem;
	margin: calc(var(--unit) * 1.5) 0 calc(var(--unit) * 3);
	padding: 0 calc(var(--unit) * 0.5);
	font: 400 1.375rem/1.5 "Lyon Text", Georgia, "Times New Roman", serif;
	letter-spacing: 0.01em;
}
.news .solid {
	min-height: 3rem;
	padding: 0 calc(var(--unit) * 5);
}
.news [role="status"] {
	margin-top: calc(var(--unit) * 2);
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
/* The trap for programs: there for them to find, not for anyone to see. */
.trap {
	position: absolute;
	left: -200vw;
	width: 1px;
	height: 1px;
	min-height: 0;
	border: 0;
	opacity: 0;
}
/* The small print under the form. Still 4.5:1 and more: the dimmer tone on the slab's ground. */
.small {
	margin-top: calc(var(--unit) * 2);
	color: var(--dim);
	font-size: 0.8125rem;
	line-height: 1.6;
}
.small .link {
	display: inline;
	min-height: 0;
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

/* Narrow screens: Menu, the mark and Pause stay in the bar; Contact and Newsletter are in the
   drawer, which fills the width below the bar. */
@media (max-width: 720px) {
	.site {
		--key: 5.5rem;
	}
	.bar {
		padding: 0 var(--unit);
	}
	.wide {
		display: none;
	}
	/* Whatever its cut on a wide screen, here it is a plain sheet. */
	.slab,
	.slab[data-shape] {
		inset: var(--bar) 0 auto 0;
		width: 100%;
		max-height: calc(100dvh - var(--bar));
		padding: calc(var(--unit) * 7) calc(var(--unit) * 3.5) calc(var(--unit) * 5);
		clip-path: none !important;
	}
	/* Here it hangs from the bar, so it comes down from behind it and goes back up. */
	.tide-enter-from,
	.tide-leave-to {
		transform: translateY(-2rem);
	}
	.trine {
		display: none;
	}
	.title {
		font-size: 2.5rem;
	}
	/* The links' square was a fixed width hung from the left, so on any screen but one its
	   middle was not the screen's: the links sat a little left of the mark and the name. Here it
	   takes the drawer's own width, and all three share one axis. */
	.slab[data-menu="within"] ol,
	.slab[data-menu="within-caps"] ol,
	.slab[data-menu="within-name"] ol {
		width: auto;
		margin-left: 0;
	}
}
</style>
