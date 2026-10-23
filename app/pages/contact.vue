<script setup lang="ts">
// The Contact page. The owner chose the letter (11 October 2026); ?contact= tries the others.
// All are panels at the left with the ocean in view, in the family of the menu and the About page:
//   letter  the form is a letter with blanks to fill in, in Klein's blue on off-white (default).
//           Its words come from letter-words.ts, a set for each language; ?lang=fr tries one.
//   panel   Klein Blue deepening to green with the moon's edge; labels beside underlined fields
//   signal  a ship's radiogram form: ruled, headed by the boat's position and time
//   klein   one flat field of Klein's blue and little else: the message first and large
const route = useRoute();
const FORMS = ["letter", "panel", "signal", "klein"];
const layout = computed(() => (FORMS.includes(route.query.contact as string) ? (route.query.contact as string) : "letter"));

const description = "Write to Nabil Sabio Azadi: artist, anthropologist, editor and poet.";
useSeoMeta({ title: "Contact · Nabil Sabio Azadi", description, ogTitle: "Contact Nabil Sabio Azadi", ogDescription: description });
</script>

<template>
	<ContactPage :layout="layout" />
</template>
