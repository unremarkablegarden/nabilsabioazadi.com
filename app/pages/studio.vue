<script setup lang="ts">
// A borrowed room: the owner's word on where they work, in their own voice, with Ben Clement's
// photographs of a temporary studio (2016). Since 2013 they have had no studio of their own.
// It is a page to be come upon rather than led to: it is not in the menu, though search engines
// are told of it (the sitemap), so that the pictures of the owner in it are found, each in words
// that say who and what it shows, named for who is in it and who made it, credited inside the file.
const pictures = [
	{
		src: "/studio/nabil-sabio-azadi-studio-by-ben-clement.jpg",
		width: 1334,
		height: 2000,
		alt: "Nabil Sabio Azadi sitting on the floor of a temporary studio in a black T-shirt and jeans, smiling, a notebook open on one knee and open notebooks laid out on the floor before him. Above, four white pelts and a drawing of a hand hang from coat hangers.",
		caption: "Nabil Sabio Azadi in a temporary studio, 2016, among notebooks of anthropological research, ethnographic interviews, sketches and poems. Photograph by Ben Clement",
	},
	{
		src: "/studio/nabil-sabio-azadi-writing-by-ben-clement.jpg",
		width: 1333,
		height: 2000,
		alt: "Nabil Sabio Azadi stretched across the studio floor, writing in one of the many notebooks laid out open around him.",
		caption: "Nabil Sabio Azadi working across the notebooks on the floor. Photograph by Ben Clement",
	},
	{
		src: "/studio/nabil-sabio-azadi-pelt-by-ben-clement.jpg",
		width: 1334,
		height: 2000,
		alt: "Nabil Sabio Azadi's hands at work on a white pelt across his lap, one holding a fine wooden tool, the other parting the fur.",
		caption: "Nabil Sabio Azadi at work on one of the white pelts. Photograph by Ben Clement",
	},
];

const description = "Since 2013 Nabil Sabio Azadi has worked without a studio of his own. This was one of the temporary ones, photographed by Ben Clement in 2016.";
useSeoMeta({
	title: "A borrowed room · Nabil Sabio Azadi",
	description,
	ogTitle: "A borrowed room",
	ogDescription: description,
	ogImage: SITE.url + pictures[0]!.src,
	ogImageAlt: pictures[0]!.alt,
});
useHead({
	script: [
		jsonLd({
			"@type": "WebPage",
			url: siteUrl("/studio"),
			name: "A borrowed room",
			description,
			author: { "@id": person["@id"] },
			about: { "@id": person["@id"] },
			image: pictures.map((picture) => ({
				"@type": "ImageObject",
				contentUrl: SITE.url + picture.src,
				width: picture.width,
				height: picture.height,
				caption: picture.alt,
				creator: { "@type": "Person", name: "Ben Clement" },
				creditText: "Photograph by Ben Clement",
				copyrightNotice: "© Ben Clement",
				about: { "@id": person["@id"] },
			})),
		}),
	],
});
</script>

<template>
	<main id="main" tabindex="-1" class="sheet">
		<header class="row head">
			<p class="key">A temporary studio, 2016</p>
			<div>
				<h1>A borrowed room</h1>
				<p class="standfirst">
					I haven’t had a studio of my own since 2013. I have had rooms, floors and other people’s tables, lent for a season, and the work has learned to travel light.
				</p>
			</div>
		</header>

		<figure class="row figure">
			<figcaption class="key caption">{{ pictures[0]!.caption }}</figcaption>
			<img :src="pictures[0]!.src" :alt="pictures[0]!.alt" :width="pictures[0]!.width" :height="pictures[0]!.height" fetchpriority="high" />
		</figure>

		<div class="row">
			<p class="text">
				This one was temporary, as they all are. By the time Ben Clement came to photograph it the floor had become the desk. What looks like mess was a kind of filing: notebooks of anthropological research, of ethnographic interviews, of sketches and of poems, laid open in the order I needed to read them. A poem next to the conversation that set it off. A drawing next to the interview it was trying to remember. Above them, four white pelts on coat hangers, waiting to see what I would ask of them.
			</p>
		</div>
		<div class="row">
			<p class="text">
				I like to work quietly, and I like to work in strange places. A room that isn’t mine asks less of me. Nothing in it has been there long enough to disappear; the light is new every morning; I can’t pretend to be anywhere other than where I am. An interview reads differently on a stranger’s floorboards. So does a poem.
			</p>
		</div>

		<figure class="row figure">
			<figcaption class="key caption">
				{{ pictures[1]!.caption }}<br /><br />
				{{ pictures[2]!.caption }}
			</figcaption>
			<div class="pair">
				<img v-for="picture in pictures.slice(1)" :key="picture.src" :src="picture.src" :alt="picture.alt" :width="picture.width" :height="picture.height" loading="lazy" decoding="async" />
			</div>
		</figure>

		<div class="row">
			<p class="text">
				In Aotearoa we speak of <span lang="mi">tūrangawaewae</span>, a place to stand. I have come to think that mine folds shut and fits in a bag. Wherever the notebooks lie open, I know where I am.
			</p>
		</div>
		<div class="row">
			<p class="text">The room has gone back to whoever it belonged to. The notebooks came with me.</p>
		</div>

		<footer class="row end">
			<p class="key">Nabil Sabio Azadi</p>
			<p><NuxtLink to="/about" class="more">About</NuxtLink></p>
		</footer>
	</main>
</template>

<style scoped>
/* The sheet of the writing pages: off-white, scrolling up over the ocean, on the navigation's grid. */
.sheet {
	--ground: #f4f1e8;
	--ink: #10211a;
	--dim: #3d4a42;
	--unit: 0.5rem;
	--key: 11rem;
	position: relative;
	z-index: 5;
	margin-top: calc(4rem + 38vh);
	padding: calc(var(--unit) * 10) clamp(1.25rem, 5vw, 5rem) calc(var(--unit) * 16);
	background: var(--ground);
	color: var(--ink);
	font: 400 1.1875rem/1.75 "Lyon Text", Georgia, "Times New Roman", serif;
}
.sheet:focus {
	outline: none;
}
.row {
	display: grid;
	grid-template-columns: var(--key) minmax(0, 1fr);
	column-gap: calc(var(--unit) * 5);
	max-width: 68rem;
}
.row > :only-child {
	grid-column: 2;
}
.text,
.head h1,
.standfirst {
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
.standfirst {
	margin-top: calc(var(--unit) * 3);
	font-size: 1.375rem;
	line-height: 1.55;
}
p.text {
	margin-bottom: 1.75rem;
}
/* Pictures run wider than the text; their captions stand beside them in the narrow column. */
.figure {
	align-items: end;
	margin: calc(var(--unit) * 4) 0 calc(var(--unit) * 7.5);
}
.pair {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: calc(var(--unit) * 2);
}
img {
	width: 100%;
	height: auto;
	background: #dcdfd6;
}
/* The photographs are upright: one alone is kept within the screen's height, not run the column's width. */
.figure > img {
	justify-self: start;
	width: auto;
	max-width: 100%;
	max-height: calc(100vh - 8rem);
}
.caption {
	letter-spacing: 0.02em;
	text-transform: none;
	line-height: 1.5;
	font-size: 0.8125rem;
}
.end {
	margin-top: calc(var(--unit) * 8);
	padding-top: calc(var(--unit) * 4);
	border-top: 1px solid var(--ink);
}
.more {
	display: inline-flex;
	align-items: center;
	min-height: 2.75rem;
	font: 500 1rem/1 "Helvetica Neue LT", "Helvetica Neue", Helvetica, Arial, sans-serif;
	text-decoration: underline;
	text-decoration-thickness: 1px;
	text-underline-offset: 0.3em;
}
.more:focus-visible {
	outline: 3px solid var(--ink);
	outline-offset: 3px;
}
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
		align-items: stretch;
		gap: var(--unit);
	}
	.figure > img {
		align-self: flex-start;
	}
}
</style>
