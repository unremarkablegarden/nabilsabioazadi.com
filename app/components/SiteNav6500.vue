<script setup lang="ts">
// The newsletter form has nowhere to send addresses yet, so it says so instead of pretending.
const email = ref("");
const notice = ref("");
const join = () => {
	notice.value = "Not open yet";
};

const links = [
	{ to: "/writing", label: "Writing" },
	{ to: "/art", label: "Art" },
	{ to: "/contact", label: "Contact" },
];
</script>

<!-- The words stand on the horizon. OceanBackground sets --horizon and --roll on the page each
     frame, so the line of type lifts and tilts with the sea. -->
<template>
	<header>
		<p class="mark"><GlyphWord text="Nabil Sabio Azadi" /></p>
		<div class="horizon">
			<nav aria-label="Main">
				<NuxtLink v-for="(link, i) in links" :key="link.to" :to="link.to" :style="{ '--delay': `${0.4 + i * 0.5}s` }">
					<GlyphWord :text="link.label" />
				</NuxtLink>
			</nav>
			<form style="--delay: 1.9s" @submit.prevent="join">
				<label for="news-email"><GlyphWord text="Newsletter" /></label>
				<span class="field">
					<input id="news-email" v-model="email" type="email" required placeholder="address" autocomplete="email" />
					<button type="submit" aria-label="Join">→</button>
					<span role="status">{{ notice }}</span>
				</span>
			</form>
		</div>
	</header>
</template>

<style scoped>
header {
	color: #fff;
}

.mark {
	position: fixed;
	z-index: 20;
	top: clamp(1rem, 3vh, 2rem);
	left: clamp(1rem, 3vw, 2.5rem);
	font-size: 0.6rem;
	--hair: 0.8;
}

.horizon {
	position: fixed;
	z-index: 20;
	left: 0;
	right: 0;
	top: var(--horizon, 50vh);
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: 2rem;
	padding: 0 7vw 0.7em;
	font-size: clamp(1.2rem, 3.6vh, 2.4rem);
	--hair: 0.36;
	/* Lifted so the foot of the letters rests just above the horizon, then turned about it. */
	transform: translateY(-100%) rotate(var(--roll, 0rad));
	transform-origin: 50% 100%;
	pointer-events: none;
}
nav {
	display: contents;
}
a,
form {
	position: relative;
	pointer-events: auto;
	opacity: 0.92;
	transition: opacity 0.3s;
}
/* Attention thickens the line and drops a plumb line from the word into the sea. */
a::after,
form::after {
	content: "";
	position: absolute;
	left: 0;
	top: calc(100% + 0.7em);
	width: 1px;
	height: 0;
	background: currentColor;
	transition: height 0.5s cubic-bezier(0.2, 0, 0, 1);
}
a:hover,
a:focus-visible,
form:focus-within,
form:hover {
	opacity: 1;
	--hair: 0.62;
	outline: none;
}
a:hover::after,
a:focus-visible::after {
	height: 28vh;
}

/* The address field hangs below the horizon under its word, as fine as the letters. */
.field {
	position: absolute;
	left: 0;
	top: calc(100% + 0.7em + 0.6rem);
	display: flex;
	align-items: baseline;
	gap: 0.5rem;
	font: 300 0.75rem/1 ui-monospace, monospace;
	letter-spacing: 0.12em;
	text-shadow: 0 0 3px rgb(0 0 0 / 0.7);
}
.field input {
	width: 11rem;
	padding: 0.3rem 0;
	border-bottom: 1px solid rgb(255 255 255 / 0.7);
	color: #fff;
}
.field input::placeholder {
	color: rgb(255 255 255 / 0.6);
}
.field input:focus-visible {
	outline: none;
	border-color: #fff;
}
.field button {
	padding: 0.3rem 0.4rem;
	cursor: pointer;
}
.field button:focus-visible {
	outline: 1px solid #fff;
}
.field [role="status"] {
	white-space: nowrap;
}

/* Too narrow for one line of words: they hang in a column from the horizon instead. */
@media (max-width: 720px) {
	.horizon {
		flex-direction: column;
		align-items: flex-start;
		justify-content: flex-start;
		gap: 1.6em;
		padding: 1.2em 8vw 0;
		transform: rotate(var(--roll, 0rad));
		transform-origin: 50% 0;
	}
	a::after,
	form::after {
		display: none;
	}
}
</style>
