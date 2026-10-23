<script setup lang="ts">
const prismic = usePrismic();
const { data: page } = await useAsyncData("homepage", () =>
	prismic.client.getByUID("page", "homepage"),
);

// The homepage says who the owner is; the Prismic page's own title and description come first.
const title = page.value?.data.meta_title || SITE.name;
const description = page.value?.data.meta_description || SITE.description;
useSeoMeta({ title, description, ogTitle: title, ogDescription: description, ogImage: page.value?.data.meta_image?.url || undefined });
useHead({ script: [jsonLd(person)] });
</script>

<!-- The homepage is the ocean and the navigation alone. Its Prismic page now only supplies the title and description.
     Both are given in words, out of sight, for screen readers and for search engines, which otherwise had only the menu's credits to quote. -->
<template>
	<main id="main" tabindex="-1">
		<h1 class="sr-only">{{ title }}</h1>
		<p class="sr-only">{{ description }}</p>
	</main>
</template>
