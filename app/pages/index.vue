<script setup lang="ts">
const prismic = usePrismic();
const { data: page } = await useAsyncData("homepage", () =>
	prismic.client.getByUID("page", "homepage"),
);

useSeoMeta({
	title: page.value?.data.meta_title,
	description: page.value?.data.meta_description,
});
</script>

<template>
	<PageTemplate
		v-if="page"
		:page="page"
		class="flex min-h-screen flex-col items-center justify-center"
	/>
</template>
