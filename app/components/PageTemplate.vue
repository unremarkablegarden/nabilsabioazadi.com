<script setup lang="ts">
import type { Content } from "@prismicio/client";
import { components } from "~/slices";

defineProps<{ page: Content.PageDocument }>();
</script>

<template>
	<main>
		<h1 class="font-bold"><PrismicText :field="page.data.title" /></h1>
		<PrismicRichText :field="page.data.body" />
		<figure v-for="(item, i) in page.data.gallery" :key="i">
			<PrismicImage :field="item.image" />
			<figcaption v-if="item.caption">{{ item.caption }}</figcaption>
		</figure>
		<SliceZone :slices="page.data.slices" :components="components" />
	</main>
</template>
