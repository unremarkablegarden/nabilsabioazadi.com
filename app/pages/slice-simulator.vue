<script setup lang="ts">
import { components } from "~/slices";
// Prismic's preview of a slice, for the editor alone.
useSeoMeta({ robots: "noindex, nofollow" });
</script>

<template>
	<SliceSimulator #default="{ slices }">
		<SliceZone :slices="slices" :components="components" />
	</SliceSimulator>
</template>