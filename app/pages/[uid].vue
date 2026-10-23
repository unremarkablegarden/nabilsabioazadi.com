<script setup lang="ts">
import { asText } from "@prismicio/client";
const prismic = usePrismic();
const route = useRoute();
const uid = route.params.uid as string;
const { data: page } = await useAsyncData(uid, () => prismic.client.getByUID("page", uid).catch(() => null));
if (!page.value) throw createError({ statusCode: 404, statusMessage: "Page not found", fatal: true });

const title = page.value.data.meta_title || `${asText(page.value.data.title)} · Nabil Sabio Azadi`;
const description = page.value.data.meta_description || undefined;
useSeoMeta({ title, description, ogTitle: title, ogDescription: description, ogImage: page.value.data.meta_image?.url || undefined });
</script>

<template>
	<PageTemplate v-if="page" :page="page" />
</template>
