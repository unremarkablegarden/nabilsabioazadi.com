<script setup lang="ts">
const prismic = usePrismic();
const route = useRoute();
const uid = route.params.uid as string;
const { data: page } = await useAsyncData(uid, () => prismic.client.getByUID("page", uid).catch(() => null));
if (!page.value) throw createError({ statusCode: 404, statusMessage: "Page not found", fatal: true });
</script>

<template>
	<PageTemplate v-if="page" :page="page" />
</template>
