<script setup lang="ts">
const prismic = usePrismic();
const { data: page } = await useAsyncData("homepage", () =>
	prismic.client.getByUID("page", "homepage"),
);

useSeoMeta({
	title: page.value?.data.meta_title || "Nabil Sabio Azadi",
	description: page.value?.data.meta_description,
});
</script>

<!-- The homepage is the ocean and the navigation alone. Its Prismic page now only supplies the title and description. -->
<template>
	<main id="main" tabindex="-1">
		<h1 class="sr-only">{{ page?.data.meta_title || "Nabil Sabio Azadi" }}</h1>
	</main>
</template>
