<script setup lang="ts">
// The list of writing, newest first. Until the article type exists in Prismic the list is empty;
// while developing, the stand-in essay is listed so the layout can be seen.
const prismic = usePrismic();
const { data: articles } = await useAsyncData("articles", async () => {
	let found: Article[] = [];
	try {
		const documents = await prismic.client.getAllByType("article", { orderings: [{ field: "my.article.date", direction: "desc" }] });
		found = documents.map(articleFromPrismic);
	} catch {
		// No article type yet, or Prismic could not be reached.
	}
	// The list needs only the head of each article, not its body.
	const all = import.meta.dev ? [...found, sampleArticle()] : found;
	return all.map(({ uid, kind, title, authors, date, standfirst, words }) => ({ uid, kind, title, authors, date, standfirst, words }));
});

const description = "Essays and other writing by Nabil Sabio Azadi.";
// While nothing is published the page is a single line, and search engines are asked not to list
// it (nor is it in the sitemap); the first article published lists it again, with nothing to change.
useSeoMeta({
	title: "Writing | Nabil Sabio Azadi",
	description,
	ogTitle: "Writing by Nabil Sabio Azadi",
	ogDescription: description,
	robots: () => (articles.value?.length ? undefined : "noindex, follow"),
});
const year = (date: string) => (date ? new Date(date).getFullYear() : "");
</script>

<template>
	<main id="main" tabindex="-1" class="sheet">
		<h1>Writing</h1>
		<p v-if="!articles?.length" class="none">Nothing has been published here yet.</p>
		<ol v-else>
			<li v-for="article in articles" :key="article.uid">
				<NuxtLink :to="`/writing/${article.uid}`" class="row">
					<span class="key">{{ article.kind }}<br />{{ year(article.date) }}</span>
					<span>
						<span class="title">{{ article.title }}</span>
						<span v-if="article.authors.length" class="authors">{{ article.authors.join(", ") }}</span>
						<!-- eslint-disable-next-line vue/no-v-html -->
						<span v-if="article.standfirst" class="standfirst" v-html="article.standfirst" />
						<span class="key">About {{ Math.max(1, Math.round(article.words / 230)) }} minutes to read</span>
					</span>
				</NuxtLink>
			</li>
		</ol>
	</main>
</template>

<style scoped>
.sheet {
	--ground: #f4f1e8;
	--ink: #10211a;
	--dim: #3d4a42;
	--unit: 0.5rem;
	position: relative;
	z-index: 5;
	min-height: 62vh;
	margin-top: calc(4rem + 38vh);
	padding: calc(var(--unit) * 10) clamp(1.25rem, 5vw, 5rem) calc(var(--unit) * 16);
	background: var(--ground);
	color: var(--ink);
	font: 400 1.125rem/1.6 "Lyon Text", Georgia, "Times New Roman", serif;
}
.sheet:focus {
	outline: none;
}
h1 {
	margin-bottom: calc(var(--unit) * 6);
	font: 400 0.75rem/1.75rem "Helvetica Neue LT", "Helvetica Neue", Helvetica, Arial, sans-serif;
	letter-spacing: 0.16em;
	text-transform: uppercase;
	color: var(--dim);
}
ol {
	max-width: 68rem;
	border-bottom: 1px solid var(--ink);
}
.row {
	display: grid;
	grid-template-columns: 11rem minmax(0, 1fr);
	column-gap: calc(var(--unit) * 5);
	padding: calc(var(--unit) * 4) 0 calc(var(--unit) * 5);
	border-top: 1px solid var(--ink);
}
.row > span > span {
	display: block;
	max-width: 40rem;
}
.key {
	font: 400 0.75rem/1.75rem "Helvetica Neue LT", "Helvetica Neue", Helvetica, Arial, sans-serif;
	letter-spacing: 0.16em;
	text-transform: uppercase;
	color: var(--dim);
}
.title {
	font: 300 clamp(1.75rem, 3vw, 2.5rem) / 1.15 "Lyon Display", "Lyon Text", Georgia, serif;
	text-wrap: balance;
}
.row:hover .title,
.row:focus-visible .title {
	font-style: italic;
}
.authors {
	margin-top: calc(var(--unit) * 1.5);
	font: 400 1rem/1.6 "Helvetica Neue LT", "Helvetica Neue", Helvetica, Arial, sans-serif;
}
.standfirst {
	margin: calc(var(--unit) * 1.5) 0;
}
.row:focus-visible {
	outline: 3px solid var(--ink);
	outline-offset: 3px;
}
@media (max-width: 900px) {
	.sheet {
		margin-top: calc(4rem + 28vh);
	}
	.row {
		display: block;
	}
	.key br {
		display: none;
	}
}
</style>
