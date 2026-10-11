<script setup lang="ts">
// Sets a word to exactly the width of the space it is given, by changing the width of the
// letters themselves (the typeface's width axis, 50% to 150%) instead of their size. If the
// widest letters still fall short, the rest is made up with space between them. So a short word
// comes out broad and open and a long one tight and tall-looking, and every line ends flush.
import "@fontsource-variable/anybody/wdth.css";

defineProps<{ text: string }>();

const line = ref<HTMLElement>();
const word = ref<HTMLElement>();

const fit = () => {
	if (!line.value || !word.value) return;
	const target = line.value.clientWidth;
	const style = word.value.style;
	style.letterSpacing = "0px";
	style.marginRight = "0px";
	// offsetWidth, not the bounding box: the slant applied to the line must not count.
	const widthAt = (stretch: number) => {
		style.fontStretch = `${stretch}%`;
		return word.value!.offsetWidth;
	};
	if (widthAt(150) <= target) {
		const gaps = Math.max(1, word.value.textContent!.length - 1);
		const space = (target - word.value.offsetWidth) / gaps;
		style.letterSpacing = `${space}px`;
		// Letter-spacing also follows the last letter; take that back so the line ends flush.
		style.marginRight = `${-space}px`;
		return;
	}
	let narrow = 50;
	let wide = 150;
	for (let i = 0; i < 10; i++) {
		const middle = (narrow + wide) / 2;
		if (widthAt(middle) > target) wide = middle;
		else narrow = middle;
	}
	widthAt(narrow);
};

let observer: ResizeObserver | undefined;
onMounted(() => {
	fit();
	// Again once the typeface has arrived, and whenever the space or the text size changes.
	document.fonts.ready.then(fit);
	observer = new ResizeObserver(fit);
	observer.observe(line.value!);
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
	<span ref="line" class="line"
		><span ref="word" class="word">{{ text }}</span></span
	>
</template>

<style scoped>
.line {
	display: block;
	overflow: hidden;
	white-space: nowrap;
}
.word {
	display: inline-block;
	font-family: "Anybody Variable", "Arial Narrow", sans-serif;
}
</style>
