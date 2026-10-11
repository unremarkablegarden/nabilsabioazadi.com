<script setup lang="ts">
// The About page. The owner chose the panel (11 October 2026); ?about= tries the others.
// The panel and three more in its family, each from a line of graphic design that the site
// already draws on. All four leave the ocean in view at the right:
//   panel     Klein Blue deepening to green, its edge the limb of a moon, like the menu; the
//             picture is a disc sitting on that edge, a second moon (default)
//   almanac   a page from a nautical almanac: ruled, tabular, headed by the boat's position and time
//   klein     after Yves Klein's monochromes: one flat field of his blue, no rules, very little on it
//   poster    after the Swiss poster: his blue as ink on off-white, large light Helvetica, numbered parts
// And the first round's other three:
//   sheet     an off-white sheet that scrolls up over the ocean, like the writing pages
//   portrait  the picture large at the left, the words on a dark ground at the right
//   band      a low band along the foot of the picture; the ocean stays the main thing
// The words and the picture here are stand-ins. The real ones are to come from the owner.
const route = useRoute();
const LAYOUTS = ["panel", "almanac", "klein", "poster", "sheet", "portrait", "band"];
const layout = computed(() => (LAYOUTS.includes(route.query.about as string) ? (route.query.about as string) : "panel"));

useSeoMeta({ title: "About · Nabil Sabio Azadi" });
</script>

<template>
	<AboutPage :layout="layout" />
</template>
