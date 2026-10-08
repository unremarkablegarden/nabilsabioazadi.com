<script setup lang="ts">
const prismic = usePrismic();
const route = useRoute();
const { data: page } = await useAsyncData(route.params.uid as string, () =>
	prismic.client.getByUID("page", route.params.uid as string),
);
</script>

<template>
	<PageTemplate v-if="page" :page="page" />
</template>
