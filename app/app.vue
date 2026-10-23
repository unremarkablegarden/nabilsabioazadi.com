<script setup lang="ts">
// Six navigations are kept. The Swiss top bar is shown unless the address ends in ?type=slab
// (the Swiss slab the bar grew out of), ?type=neptune,
// ?type=4788 (the Uranus slab), ?type=4788a (the first Uranus slab) or ?type=6500 (hairlines
// on the horizon). The other five, and the typefaces only they use, are fetched only when asked
// for, so every visitor is not sent them.
const route = useRoute();
const kept = ["slab", "neptune", "4788", "4788a", "6500"];
const typography = computed(() => (kept.includes(route.query.type as string) ? route.query.type : "swiss"));

// The ocean (three.js and every weave, most of the site's code) is fetched alongside the page
// but run apart from it, so that the words and the navigation are ready to use before it, not
// after: on a slow machine that was seconds. The picture is the same.
const OceanBackground = defineAsyncComponent(() => import("~/components/OceanBackground.vue"));
// On the server it is loaded before the page is written, so that it still fills in the place,
// time and conditions before the navigation shows them (otherwise the server's menu went out
// without them and the browser's did not match it).
if (import.meta.server) await OceanBackground.__asyncLoader?.();

// What every page tells search engines and link previews unless it says otherwise. The canonical
// address leaves out the query, so the views above are not counted as pages of their own.
const canonical = computed(() => siteUrl(route.path));
useHead({
	link: [{ rel: "canonical", href: canonical }],
	script: [jsonLd({ "@type": "WebSite", "@id": `${SITE.url}/#website`, url: SITE.url, name: SITE.name, inLanguage: "en-GB", publisher: { "@id": person["@id"] } })],
});
useSeoMeta({
	description: SITE.description,
	ogSiteName: SITE.name,
	ogType: "website",
	ogLocale: "en_GB",
	ogUrl: canonical,
	ogTitle: SITE.name,
	ogDescription: SITE.description,
	ogImage: SITE.url + SITE.image,
	twitterCard: "summary_large_image",
	themeColor: "#002fa7",
});
</script>

<template>
	<OceanBackground />
	<LazySiteNav6500 v-if="typography === '6500'" />
	<LazySiteNav4788First v-else-if="typography === '4788a'" />
	<LazySiteNav4788 v-else-if="typography === '4788'" />
	<LazySiteNavNeptune v-else-if="typography === 'neptune'" />
	<LazySiteNavSwissSlab v-else-if="typography === 'slab'" />
	<SiteNavSwiss v-else />
	<NuxtPage />
</template>
