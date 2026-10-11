<script setup lang="ts">
// The Contact page: a form with a name, an address to answer to, and a message.
// Built to meet WCAG 2.2 AA: every field has a label that is read out (also where the design
// shows none, as in the letter), what went wrong or right is said in words in a live region,
// fields and buttons are at least 44px tall with a visible focus ring, and all of it is on an
// opaque ground.
//
// How it sends (the owner's and Olle's choice: plain email, no sending service). Pressing Send
// opens the visitor's own email program with the letter already written in it, addressed to the
// owner; the visitor sends it themselves. Nothing passes through the site, and nothing is stored.
// The owner's address is protected from the programs that harvest addresses off web pages: it is
// nowhere in the page as written. It is kept here backwards and in pieces, and is only put
// together in the visitor's browser at the moment they press Send. (A person who presses Send
// sees it, as they must to write to it.)
defineProps<{ layout: string }>();

// As on the About page: this is a panel over the picture. It steps aside while the menu is
// open, and Close leads back to the main screen.
const menuOpen = useState("menu-open", () => false);
const pageIsPanel = useState("page-is-panel", () => false);
pageIsPanel.value = true;
onBeforeUnmount(() => (pageIsPanel.value = false));
// Where the boat is and what time it keeps, for the radiogram's heading.
const readout = useState<{ place?: string; time: string }>("scene-readout", () => ({ time: "" }));

const letter = reactive({ name: "", email: "", message: "", website: "" });
const notice = ref("");
// The letter's words, in the language asked for. For now that is ?lang= in the address; when
// the whole site can change language, this is the one place to connect it.
const words = computed(() => LETTER_WORDS[useRoute().query.lang as string] ?? LETTER_WORDS.en!);
const sentence = computed(() => letterSentence(words.value));
const PIECES = ["moc.idazaoibaslibana", "oiduts"];
const address = () => PIECES.map((piece) => [...piece].reverse().join("")).reverse().join(String.fromCharCode(64));
// Shown after Send, for anyone whose email program did not open.
const shownAddress = ref("");
const send = () => {
	const w = words.value;
	// The letter as written on the page, in the page's language.
	const sentence = w.sentence.replace("{name}", letter.name).replace("{email}", letter.email);
	const body = [w.greeting, "", sentence, "", letter.message, "", w.signoff, letter.name].join("\n");
	const to = address();
	window.location.href = `mailto:${to}?subject=${encodeURIComponent(w.subject.replace("{name}", letter.name))}&body=${encodeURIComponent(body)}`;
	notice.value = w.opened;
	shownAddress.value = to;
};
</script>

<template>
	<main id="main" tabindex="-1" class="contact" :class="{ aside: menuOpen }" :data-layout="layout">
		<div class="back" aria-hidden="true" />
		<div class="ground">
			<p class="leave" :lang="layout === 'letter' ? words.lang : undefined"><NuxtLink to="/">{{ layout === "letter" ? words.close : "Close" }}</NuxtLink></p>
			<p v-if="layout === 'signal'" class="heading key">
				<span>{{ readout.place }}</span>
				<span>Human time {{ readout.time }}</span>
			</p>

			<!-- The letter: the form is a letter with blanks. Each blank still has its own label for screen readers. -->
			<form v-if="layout === 'letter'" class="written" :lang="words.lang" :dir="words.dir" @submit.prevent="send">
				<h1>{{ words.greeting }}</h1>
				<!-- The sentence, with a blank wherever this language puts one. -->
				<p>
					<template v-for="(piece, i) in sentence" :key="i">
						<span v-if="'text' in piece">{{ piece.text }}</span>
						<input v-else-if="piece.blank === 'name'" v-model="letter.name" type="text" required autocomplete="name" size="14" :aria-label="words.nameLabel" />
						<input v-else v-model="letter.email" type="email" required autocomplete="email" size="20" dir="ltr" :aria-label="words.emailLabel" />
					</template>
				</p>
				<textarea v-model="letter.message" required rows="6" :aria-label="words.messageLabel" aria-describedby="contact-status" />
				<p class="close">{{ words.signoff }}</p>
				<input v-model="letter.website" class="trap" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" />
				<button type="submit" class="send">{{ words.send }}</button>
				<p id="contact-status" class="status" role="status">
					{{ notice }}
					<template v-if="shownAddress">{{ words.orWriteTo }} <a :href="`mailto:${shownAddress}`">{{ shownAddress }}</a>.</template>
				</p>
			</form>

			<!-- The others: a heading, then label and field in rows. -->
			<form v-else @submit.prevent="send">
				<header class="row">
					<p class="key">{{ layout === "signal" ? "Radiogram" : "Contact" }}</p>
					<div>
						<h1>{{ layout === "signal" ? "To the boat" : "Write to Nabil" }}</h1>
						<p class="statement">A line about what to write for, and how soon to expect an answer.</p>
					</div>
				</header>
				<div class="row field message">
					<label for="contact-message" class="key">{{ layout === "signal" ? "Message" : "Your message" }}</label>
					<textarea id="contact-message" v-model="letter.message" required rows="6" aria-describedby="contact-status" />
				</div>
				<div class="row field">
					<label for="contact-name" class="key">{{ layout === "signal" ? "From" : "Your name" }}</label>
					<input id="contact-name" v-model="letter.name" type="text" required autocomplete="name" />
				</div>
				<div class="row field">
					<label for="contact-email" class="key">{{ layout === "signal" ? "Reply to" : "Your email address" }}</label>
					<input id="contact-email" v-model="letter.email" type="email" required autocomplete="email" />
				</div>
				<input v-model="letter.website" class="trap" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" />
				<div class="row end">
					<span />
					<div>
						<button type="submit" class="send">Send</button>
						<p id="contact-status" class="status" role="status">
					{{ notice }}
					<template v-if="shownAddress">{{ words.orWriteTo }} <a :href="`mailto:${shownAddress}`">{{ shownAddress }}</a>.</template>
				</p>
					</div>
				</div>
			</form>
		</div>
	</main>
</template>

<style scoped>
.contact {
	/* Pearl on the dark grounds: 14.8:1 on the green, 9.5:1 on Klein Blue; the dimmer tone 8.9:1 and 5.7:1. */
	--ink: #f4f1e8;
	--dim: #b4c0b3;
	--green: #10211a;
	--deep: #0b1f2e;
	--klein: #002fa7;
	--unit: 0.5rem;
	--key: 9rem;
	--bar: 4rem;
	--wide: 46rem;
	color: var(--ink);
	font: 300 1rem/1.75 "Helvetica Neue LT", "Helvetica Neue", Helvetica, Arial, sans-serif;
	letter-spacing: 0.03em;
}
.contact:focus {
	outline: none;
}
/* Out of sight and out of reach while the menu is open in the same place. */
.contact.aside {
	visibility: hidden;
}
.back,
.ground {
	position: fixed;
	inset: var(--bar) auto 0 0;
	box-sizing: border-box;
	width: var(--wide);
	max-width: 100vw;
}
.back {
	z-index: 4;
}
.ground {
	z-index: 5;
	overflow-y: auto;
}
.heading {
	display: none;
}

.row {
	display: grid;
	grid-template-columns: var(--key) minmax(0, 1fr);
	column-gap: calc(var(--unit) * 4);
	align-items: baseline;
	padding: calc(var(--unit) * 3) 0;
}
.key {
	font-size: 0.75rem;
	font-weight: 400;
	line-height: 1.75;
	letter-spacing: 0.18em;
	text-transform: uppercase;
	color: var(--dim);
}
.leave {
	margin-bottom: calc(var(--unit) * 3);
}
.leave a {
	display: inline-flex;
	align-items: center;
	min-height: 2.75rem;
	font-size: 0.75rem;
	font-weight: 400;
	letter-spacing: 0.18em;
	text-transform: uppercase;
	text-decoration: underline;
	text-decoration-thickness: 1px;
	text-underline-offset: 0.5em;
}
h1 {
	font-size: 1.5rem;
	font-weight: 300;
	line-height: 1.4;
	letter-spacing: 0.08em;
}
.statement {
	max-width: 26em;
	margin-top: calc(var(--unit) * 2);
	font: 400 1.125rem/1.6 "Lyon Text", Georgia, "Times New Roman", serif;
	letter-spacing: 0.01em;
}
/* The fields: roomy, in the reading serif, on a single line beneath; the message a ruled box. */
input,
textarea {
	display: block;
	width: 100%;
	box-sizing: border-box;
	min-height: 3.25rem;
	padding: 0 calc(var(--unit) * 0.5);
	border: 0;
	border-bottom: 1px solid var(--ink);
	border-radius: 0;
	background: transparent;
	color: var(--ink);
	font: 400 1.25rem/1.5 "Lyon Text", Georgia, "Times New Roman", serif;
	letter-spacing: 0.01em;
}
textarea {
	padding: calc(var(--unit) * 1.5);
	border: 1px solid color-mix(in srgb, currentColor 55%, transparent);
	line-height: 1.6;
	resize: vertical;
}
.send {
	min-height: 3rem;
	padding: 0 calc(var(--unit) * 5);
	border: 1px solid var(--ink);
	border-radius: 2rem;
	color: var(--ink);
	font-size: 0.75rem;
	font-weight: 400;
	letter-spacing: 0.18em;
	text-transform: uppercase;
	cursor: pointer;
}
.send:hover,
.send:focus-visible {
	background: var(--ink);
	color: var(--ground, var(--green));
}
/* The address, once shown, is a link: underlined, in the ink. */
.status a {
	text-decoration: underline;
	text-underline-offset: 0.2em;
}
.status {
	min-height: 1.75rem;
	margin-top: calc(var(--unit) * 2);
	font: italic 400 1.0625rem/1.75 "Lyon Text", Georgia, serif;
}
a:focus-visible,
button:focus-visible,
input:focus-visible,
textarea:focus-visible {
	outline: 3px solid currentColor;
	outline-offset: 3px;
}
.trap {
	position: absolute;
	left: -200vw;
	width: 1px;
	height: 1px;
	min-height: 0;
	border: 0;
	opacity: 0;
}
.sr {
	position: absolute;
	width: 1px;
	height: 1px;
	overflow: hidden;
	clip-path: inset(50%);
	white-space: nowrap;
}

/* 1. Panel. The menu's and the About page's own: Klein Blue deepening to green, the moon's edge. */
[data-layout="panel"] .back {
	background: linear-gradient(to bottom, var(--klein), var(--deep) 45%, var(--green));
	--radius: 80vh;
	clip-path: circle(var(--radius) at calc(100% - var(--radius)) 50%);
}
[data-layout="panel"] .ground {
	padding: calc(var(--unit) * 10) 12rem calc(var(--unit) * 12) calc(var(--unit) * 6);
}

/* 2. Letter. The form is a letter: a greeting, a sentence with blanks for the name and the
   address, room for the message, a sign-off. Klein's blue as ink on the off-white of the
   mark, 9.5:1; set large in the display serif, as if written. */
[data-layout="letter"] {
	--ink: #002fa7;
	--dim: #002fa7;
	--ground: #f4f1e8;
	--wide: 44rem;
}
[data-layout="letter"] .back {
	background: #f4f1e8;
}
[data-layout="letter"] .ground {
	padding: calc(var(--unit) * 8) calc(var(--unit) * 8) calc(var(--unit) * 10) calc(var(--unit) * 7);
}
.written,
.written h1,
.written span,
.written input,
.written textarea,
.written .close {
	font: 300 2rem/1.6 "Lyon Display", "Lyon Text", Georgia, serif;
	letter-spacing: 0.005em;
}
.written h1 {
	margin-bottom: calc(var(--unit) * 3);
}
.written p input {
	display: inline-block;
	width: auto;
	max-width: 100%;
	margin: 0 0.25em;
	padding: 0 0.15em;
	vertical-align: baseline;
	font-style: italic;
}
.written textarea {
	margin: calc(var(--unit) * 4) 0;
	padding: 0;
	border: 0;
	/* Ruled like writing paper: a line under each line of the message. */
	line-height: 3.2rem;
	background: repeating-linear-gradient(to bottom, transparent 0 calc(3.2rem - 1px), var(--ink) calc(3.2rem - 1px) 3.2rem);
	font-style: italic;
}
.written .close {
	margin-bottom: calc(var(--unit) * 3);
}

/* 3. Signal. A ship's radiogram form, the printed slip a radio officer fills in: upright,
   every part between ruled lines, labels in small capitals, the message on ruled lines, and at
   its head where the boat is and what time it keeps. */
[data-layout="signal"] {
	--wide: 42rem;
	font-variant-numeric: tabular-nums;
}
[data-layout="signal"] .back {
	background: var(--deep);
	border-right: 1px solid var(--ink);
}
[data-layout="signal"] .ground {
	padding: calc(var(--unit) * 7) calc(var(--unit) * 6) calc(var(--unit) * 10);
}
[data-layout="signal"] .heading {
	display: flex;
	justify-content: space-between;
	gap: calc(var(--unit) * 4);
	padding: calc(var(--unit) * 1.5) 0;
	border-top: 3px double var(--ink);
	border-bottom: 1px solid var(--ink);
	color: var(--ink);
}
[data-layout="signal"] .row {
	border-bottom: 1px solid var(--ink);
}
[data-layout="signal"] .row.end {
	border-bottom: 0;
}
[data-layout="signal"] input {
	border-bottom: 0;
}
[data-layout="signal"] textarea {
	padding: 0 calc(var(--unit) * 0.5);
	border: 0;
	line-height: 2.5rem;
	background: repeating-linear-gradient(to bottom, transparent 0 calc(2.5rem - 1px), color-mix(in srgb, currentColor 45%, transparent) calc(2.5rem - 1px) 2.5rem);
}
[data-layout="signal"] .send {
	border-radius: 0;
}

/* 4. Klein. One flat field of his blue and almost nothing on it. The message comes first and
   is the largest thing on the page; the name and address follow quietly. No rules but the
   lines to write on. */
[data-layout="klein"] {
	--wide: 50vw;
	--key: 100%;
}
[data-layout="klein"] .back {
	background: var(--klein);
}
[data-layout="klein"] .ground {
	padding: calc(var(--unit) * 10) clamp(2rem, 6vw, 7rem) calc(var(--unit) * 12) calc(var(--unit) * 6);
}
[data-layout="klein"] .row {
	display: block;
	padding: calc(var(--unit) * 2.5) 0;
}
[data-layout="klein"] header.row {
	padding-bottom: calc(var(--unit) * 6);
}
[data-layout="klein"] h1 {
	font: 300 2.75rem/1.15 "Lyon Display", "Lyon Text", Georgia, serif;
	letter-spacing: 0.005em;
}
[data-layout="klein"] textarea {
	padding: 0;
	border: 0;
	border-bottom: 1px solid var(--ink);
	font: 300 1.75rem/1.4 "Lyon Display", "Lyon Text", Georgia, serif;
}
[data-layout="klein"] .send {
	border: 0;
	padding: 0;
	font-size: 1rem;
	text-decoration: underline;
	text-underline-offset: 0.5em;
}
[data-layout="klein"] .send:hover,
[data-layout="klein"] .send:focus-visible {
	background: none;
	color: var(--ink);
	text-decoration-thickness: 2px;
}

/* Narrow screens: one column on an opaque ground that scrolls with the page. */
@media (max-width: 820px) {
	.contact[data-layout] .back {
		display: none;
	}
	.contact[data-layout] .ground {
		position: relative;
		inset: auto;
		width: auto;
		margin-top: calc(var(--bar) + 26vh);
		padding: calc(var(--unit) * 6) calc(var(--unit) * 3) calc(var(--unit) * 10);
		overflow: visible;
		background: var(--deep);
	}
	.contact[data-layout="klein"] .ground {
		background: var(--klein);
	}
	.contact[data-layout="letter"] .ground {
		background: #f4f1e8;
	}
	.contact[data-layout] .row {
		display: block;
	}
	.written,
	.written h1,
	.written span,
	.written input,
	.written textarea,
	.written .close {
		font-size: 1.5rem;
	}
}
</style>
