<script setup lang="ts">
// One article. It comes from Prismic; "sample" is the built-in stand-in essay used to prove the layout.
const prismic = usePrismic();
const route = useRoute();
const uid = route.params.uid as string;
const { data: article } = await useAsyncData(`article-${uid}`, async () => {
	if (uid === "sample") return sampleArticle();
	try {
		return articleFromPrismic(await prismic.client.getByUID("article", uid));
	} catch {
		return null;
	}
});
if (!article.value) throw createError({ statusCode: 404, statusMessage: "No article at this address", fatal: true });

// What search engines and link previews are told: the article's own title and standfirst, its
// first picture, its authors and date, and its place in the writing.
const a = article.value;
const title = a.meta?.title || `${a.title} | Nabil Sabio Azadi`;
const description = a.meta?.description || a.standfirst.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const firstImage = a.blocks.find((block) => block.type === "figure")?.images[0]?.src;
const image = a.meta?.image || (firstImage && !firstImage.startsWith("data:") ? firstImage : undefined);
const authors = a.authors.length ? a.authors : [SITE.name];
useSeoMeta({
	title,
	description,
	ogTitle: a.meta?.title || a.title,
	ogDescription: description,
	ogType: "article",
	ogImage: image,
	// The site-wide picture is the portrait; an article's own picture is described by its title.
	ogImageAlt: image ? a.title : undefined,
	articlePublishedTime: a.date || undefined,
	articleAuthor: authors,
	articleTag: a.keywords,
	// The stand-in essay is there to prove the layout, not to be found.
	robots: uid === "sample" ? "noindex, nofollow" : undefined,
});
useHead({
	meta: a.keywords.length ? [{ name: "keywords", content: a.keywords.join(", ") }] : [],
	script: [
		jsonLd({
			"@type": "Article",
			headline: a.title,
			description,
			url: siteUrl(route.path),
			mainEntityOfPage: siteUrl(route.path),
			...(image ? { image } : {}),
			...(a.date ? { datePublished: a.date } : {}),
			author: authors.map((name) => (name === SITE.name ? { "@id": person["@id"] } : { "@type": "Person", name })),
			publisher: person,
			keywords: a.keywords.join(", ") || undefined,
			wordCount: a.words,
			inLanguage: "en-GB",
			articleSection: a.kind,
		}),
		jsonLd({
			"@type": "BreadcrumbList",
			itemListElement: [
				{ "@type": "ListItem", position: 1, name: "Writing", item: siteUrl("/writing") },
				{ "@type": "ListItem", position: 2, name: a.title, item: siteUrl(route.path) },
			],
		}),
	],
});
</script>

<template>
	<ArticleTemplate v-if="article" :article="article" />
</template>
