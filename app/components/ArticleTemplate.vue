<script setup lang="ts">
// The reading page for a long article, built to meet WCAG 2.2 AA.
//
// The ocean is left showing at the head of the page, like a cover. The article itself is on an
// opaque sheet that scrolls up over it: nobody should have to read six thousand words on top of
// a moving picture. The sheet is the reverse of the navigation: dark green ink on the off-white
// of the owner's mark (about 15:1).
//
// It is set on the same two-column grid as the navigation. The narrow column holds what a thing
// is (the kind of piece, the date, the captions of images, the word "Notes"); the wide column
// holds the thing itself. The text is Lyon, at a size and on a measure for long reading: about
// 65 characters to the line. Helvetica Neue is used for everything that is not the text.
const props = defineProps<{ article: Article }>();

const minutes = computed(() => Math.max(1, Math.round(props.article.words / 230)));
const published = computed(() =>
	props.article.date ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(props.article.date)) : "",
);
const print = () => window.print();
</script>

<template>
	<main id="main" tabindex="-1" class="sheet">
		<article>
			<header class="row head">
				<p class="key">{{ article.kind }}</p>
				<div>
					<h1>{{ article.title }}</h1>
					<p v-if="article.authors.length" class="authors">{{ article.authors.join(", ") }}</p>
					<!-- eslint-disable-next-line vue/no-v-html -->
					<p v-if="article.standfirst" class="standfirst" v-html="article.standfirst" />
					<p class="facts key">
						<time v-if="published" :datetime="article.date">{{ published }}</time>
						<span>About {{ minutes }} minutes to read</span>
						<button type="button" class="print" @click="print">Print</button>
					</p>
				</div>
			</header>

			<template v-for="(block, i) in article.blocks" :key="i">
				<!-- eslint-disable vue/no-v-html -->
				<div v-if="block.type === 'text'" class="row">
					<p class="text" v-html="block.html" />
				</div>
				<div v-else-if="block.type === 'heading'" class="row">
					<component :is="`h${block.level}`" :id="block.id" class="text" v-html="block.html" />
				</div>
				<div v-else-if="block.type === 'quote'" class="row">
					<blockquote class="text"><p v-html="block.html" /></blockquote>
				</div>
				<div v-else-if="block.type === 'list'" class="row">
					<component :is="block.ordered ? 'ol' : 'ul'" class="text list">
						<li v-for="(item, j) in block.items" :key="j" v-html="item" />
					</component>
				</div>
				<!-- An image or a pair, with the caption in the narrow column beside it. -->
				<figure v-else class="row figure">
					<figcaption class="key caption" v-html="block.caption" />
					<div class="images" :class="{ pair: block.images.length > 1 }">
						<img
							v-for="image in block.images"
							:key="image.src"
							:src="image.src"
							:alt="image.alt"
							:width="image.width"
							:height="image.height"
							loading="lazy"
							decoding="async"
						/>
					</div>
				</figure>
				<!-- eslint-enable vue/no-v-html -->
			</template>

			<section v-if="article.notes.length" class="row notes" aria-labelledby="notes-heading">
				<h2 id="notes-heading" class="key">Notes</h2>
				<ol>
					<li v-for="(note, i) in article.notes" :id="`note-${i + 1}`" :key="i">
						<!-- eslint-disable-next-line vue/no-v-html -->
						<span v-html="note" />
						<a class="back" :href="`#ref-${i + 1}`" :aria-label="`Back to the text at note ${i + 1}`">↩</a>
					</li>
				</ol>
			</section>

			<footer class="row end">
				<p class="key">{{ article.keywords.length ? "Keywords" : "" }}</p>
				<div>
					<p v-if="article.keywords.length" class="keywords">{{ article.keywords.join(" / ") }}</p>
					<NuxtLink to="/writing" class="more">All writing</NuxtLink>
				</div>
			</footer>
		</article>
	</main>
</template>

<style scoped>
.sheet {
	--ground: #f4f1e8;
	--ink: #10211a;
	/* The quieter tone, for labels and captions: still about 8:1 on the ground. */
	--dim: #3d4a42;
	--unit: 0.5rem;
	--key: 11rem;
	position: relative;
	z-index: 5;
	/* The ocean shows above the sheet, below the bar. */
	margin-top: calc(4rem + 38vh);
	padding: calc(var(--unit) * 10) clamp(1.25rem, 5vw, 5rem) calc(var(--unit) * 16);
	background: var(--ground);
	color: var(--ink);
	font: 400 1.1875rem/1.75 "Lyon Text", Georgia, "Times New Roman", serif;
}
.sheet:focus {
	outline: none;
}

/* The grid: a narrow column and a wide one, as in the navigation. */
.row {
	display: grid;
	grid-template-columns: var(--key) minmax(0, 1fr);
	column-gap: calc(var(--unit) * 5);
	max-width: 68rem;
}
.row > :only-child {
	grid-column: 2;
}
/* The measure: about 65 characters. */
.text,
.head h1,
.authors,
.standfirst,
.notes ol,
.keywords {
	max-width: 36rem;
}
.key {
	font: 400 0.75rem/1.75rem "Helvetica Neue LT", "Helvetica Neue", Helvetica, Arial, sans-serif;
	letter-spacing: 0.16em;
	text-transform: uppercase;
	color: var(--dim);
}

.head {
	margin-bottom: calc(var(--unit) * 9);
}
h1 {
	font: 300 clamp(2.25rem, 4.6vw, 3.75rem) / 1.12 "Lyon Display", "Lyon Text", Georgia, serif;
	letter-spacing: 0.005em;
	text-wrap: balance;
}
.authors {
	margin-top: calc(var(--unit) * 4);
	font: 400 1.0625rem/1.6 "Helvetica Neue LT", "Helvetica Neue", Helvetica, Arial, sans-serif;
	letter-spacing: 0.02em;
}
.standfirst {
	margin-top: calc(var(--unit) * 3);
	font-size: 1.375rem;
	line-height: 1.55;
}
.facts {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0 calc(var(--unit) * 4);
	margin-top: calc(var(--unit) * 4);
}
.print {
	min-height: 2.75rem;
	padding: 0 calc(var(--unit) * 1);
	font: inherit;
	letter-spacing: inherit;
	text-transform: inherit;
	text-decoration: underline;
	text-underline-offset: 0.4em;
	cursor: pointer;
}

/* Paragraphs are parted by a line space, with no indents. */
p.text {
	margin-bottom: 1.75rem;
	hanging-punctuation: first;
}
h2.text,
h3.text {
	margin: calc(var(--unit) * 5) 0 calc(var(--unit) * 2);
	font: 500 1.25rem/1.4 "Helvetica Neue LT", "Helvetica Neue", Helvetica, Arial, sans-serif;
	letter-spacing: 0.01em;
}
h3.text {
	font-size: 1.0625rem;
}
/* A quotation: another voice. Larger, italic, hung from a rule, with room round it. */
blockquote {
	margin: calc(var(--unit) * 3) 0 calc(var(--unit) * 6.5);
	padding-left: calc(var(--unit) * 3);
	border-left: 1px solid var(--ink);
	font-size: 1.3125rem;
	font-style: italic;
	line-height: 1.6;
}
.list {
	margin-bottom: 1.75rem;
	padding-left: 1.25em;
	list-style: revert;
}
.sheet :deep(a) {
	text-decoration: underline;
	text-decoration-thickness: 1px;
	text-underline-offset: 0.18em;
}
.sheet :deep(a:hover) {
	text-decoration-thickness: 2px;
}
/* Note numbers: small and raised, but with a target large enough to hit. */
.sheet :deep(sup) {
	font: 500 0.6875rem/1 "Helvetica Neue LT", "Helvetica Neue", Helvetica, Arial, sans-serif;
	vertical-align: 0.5em;
}
.sheet :deep(.note-ref) {
	display: inline-block;
	min-width: 1.5rem;
	margin: -0.5rem -0.2rem;
	padding: 0.5rem 0.2rem;
	text-align: center;
	text-decoration: none;
}
.sheet :deep(.note-ref:hover) {
	text-decoration: underline;
}

/* Images run wider than the text; their captions stand beside them in the narrow column. */
.figure {
	align-items: end;
	margin: calc(var(--unit) * 4) 0 calc(var(--unit) * 7.5);
}
.images {
	display: grid;
	gap: calc(var(--unit) * 2);
}
.images.pair {
	grid-template-columns: 1fr 1fr;
}
img {
	width: 100%;
	height: auto;
	background: #dcdfd6;
}
.caption {
	letter-spacing: 0.02em;
	text-transform: none;
	line-height: 1.5;
	font-size: 0.8125rem;
}

.notes {
	margin-top: calc(var(--unit) * 10);
	padding-top: calc(var(--unit) * 4);
	border-top: 1px solid var(--ink);
}
.notes ol {
	padding-left: 1.5em;
	list-style: decimal;
	font-size: 1rem;
	line-height: 1.6;
}
.notes li {
	margin-bottom: calc(var(--unit) * 1.5);
	padding-left: 0.3em;
	scroll-margin-top: 6rem;
}
/* The note just arrived at is marked, so the eye finds it. */
.notes li:target {
	background: #e3e0d2;
	box-shadow: 0 0 0 0.4rem #e3e0d2;
}
.back {
	display: inline-block;
	min-width: 1.5rem;
	min-height: 1.5rem;
	margin-left: 0.4rem;
	text-align: center;
	text-decoration: none !important;
}
.sheet :deep(.note-ref),
.sheet :deep([id]) {
	scroll-margin-top: 6rem;
}

.end {
	margin-top: calc(var(--unit) * 8);
	padding-top: calc(var(--unit) * 4);
	border-top: 1px solid var(--ink);
}
.keywords {
	font: 400 0.9375rem/1.6 "Helvetica Neue LT", "Helvetica Neue", Helvetica, Arial, sans-serif;
	color: var(--dim);
}
.more {
	display: inline-flex;
	align-items: center;
	min-height: 2.75rem;
	margin-top: calc(var(--unit) * 2);
	font: 500 1rem/1 "Helvetica Neue LT", "Helvetica Neue", Helvetica, Arial, sans-serif;
}

.sheet :deep(a:focus-visible),
button:focus-visible {
	outline: 3px solid var(--ink);
	outline-offset: 3px;
}

/* Narrower screens: one column. What was in the narrow column goes above or below its partner. */
@media (max-width: 900px) {
	.sheet {
		margin-top: calc(4rem + 28vh);
		padding-top: calc(var(--unit) * 6);
		font-size: 1.125rem;
	}
	.row {
		display: block;
	}
	.figure {
		display: flex;
		flex-direction: column-reverse;
		gap: var(--unit);
	}
	.head .key {
		margin-bottom: var(--unit);
	}
}

/* On paper: the sheet alone, in black on white, with nothing cut in half that need not be. */
@media print {
	.sheet {
		margin: 0;
		padding: 0;
		background: none;
		color: #000;
		font-size: 11pt;
	}
	.print,
	.back,
	.more {
		display: none;
	}
	figure,
	blockquote {
		break-inside: avoid;
	}
}
</style>

<!-- Printing shows only the article: the ocean and the navigation are left out. -->
<style>
@media print {
	body > div > :not(main),
	header,
	canvas {
		display: none !important;
	}
}
</style>
