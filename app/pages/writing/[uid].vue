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

useSeoMeta({
	title: `${article.value.title} | Nabil Sabio Azadi`,
	description: article.value.standfirst.replace(/<[^>]+>/g, ""),
});
</script>

<template>
	<ArticleTemplate v-if="article" :article="article" />
</template>
