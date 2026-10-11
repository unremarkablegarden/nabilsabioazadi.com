<script setup lang="ts">
// Six navigations are kept. The Swiss top bar is shown unless the address ends in ?type=slab
// (the Swiss slab the bar grew out of), ?type=neptune,
// ?type=4788 (the Uranus slab), ?type=4788a (the first Uranus slab) or ?type=6500 (hairlines
// on the horizon).
const route = useRoute();
const kept = ["slab", "neptune", "4788", "4788a", "6500"];
const typography = computed(() => (kept.includes(route.query.type as string) ? route.query.type : "swiss"));
</script>

<template>
	<OceanBackground />
	<SiteNav6500 v-if="typography === '6500'" />
	<SiteNav4788First v-else-if="typography === '4788a'" />
	<SiteNav4788 v-else-if="typography === '4788'" />
	<SiteNavNeptune v-else-if="typography === 'neptune'" />
	<SiteNavSwissSlab v-else-if="typography === 'slab'" />
	<SiteNavSwiss v-else />
	<NuxtPage />
</template>
