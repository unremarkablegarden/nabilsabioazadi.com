<script setup lang="ts">
// The faint figure drawn behind the words of the menu (and of the About panel). Decoration
// only: it is hidden from screen readers and carries nothing that is not said elsewhere.
//
// The first was the trine, a triangle in a circle: a sign. The others are not signs but the
// thing itself, drawn from the same figures the picture is made from, for the boat's place and
// the moment shown:
//   trine    the triangle in a circle (Neptune trine Moon)
//   sky      the sky over the boat now: the horizon as a circle, the way the boat faces at the
//            top, every star that is up, the planets as rings, the moon in its phase, the sun
//   voyage   the navigator's plot: the track from Manawatāwhi to Hawaiʻi over the lines of
//            latitude and longitude, the part sailed drawn solid, the boat where it is
//   rose     a compass rose with the weather on it: where each swell and the wind come from,
//            as long as they are high or strong
//   moon     the moon as it is tonight, large: its lit part and its dark part
//   none     nothing
const props = defineProps<{ kind: string }>();

// Set by OceanBackground: the moment shown, and the live conditions.
const moment = useState("scene-moment", () => Date.now());
const conditions = useState<SeaConditions | undefined>("sea-conditions", () => undefined);
const date = computed(() => new Date(moment.value));
const boat = computed(() => boatAt(date.value));
const RAD = Math.PI / 180;
// The figures that depend on the moment are drawn only in the visitor's browser: the server's
// moment is a little earlier, and the two drawings would not match.
const live = ref(false);
onMounted(() => (live.value = true));

// The sky as a round chart: the middle is straight overhead, the rim is the horizon, and the
// top is the way the boat faces.
const onChart = (elevation: number, azimuth: number) => {
	const out = (96 * (90 - elevation)) / 90;
	const round = (azimuth - boat.value.bearing) * RAD;
	return { x: 100 + out * Math.sin(round), y: 100 - out * Math.cos(round) };
};
const catalogue = ref<[number, number, number, number][]>([]);
watchEffect(async () => {
	if (import.meta.server || props.kind !== "sky" || catalogue.value.length) return;
	const stars = (await (await fetch("/stars.json")).json()) as [number, number, number, number][];
	// Down to the stars a town-dweller can see: about nine hundred of them.
	catalogue.value = stars.filter((star) => star[2] <= 4.6);
});
const stars = computed(() =>
	catalogue.value
		.map(([rightAscension, declination, magnitude]) => ({ ...starPosition(rightAscension, declination, date.value), magnitude }))
		.filter((star) => star.elevation > 0)
		.map((star) => ({ ...onChart(star.elevation, star.azimuth), size: Math.max(0.22, 1.5 - 0.3 * star.magnitude) })),
);
const planets = computed(() => planetPositions(date.value).filter((planet) => planet.elevation > 0).map((planet) => onChart(planet.elevation, planet.azimuth)));
const sun = computed(() => {
	const place = sunPosition(date.value);
	return place.elevation > 0 ? onChart(place.elevation, place.azimuth) : undefined;
});
const moon = computed(() => {
	const now = moonPosition(date.value);
	// Waxing if more of it will be lit in an hour.
	const waxing = moonPosition(new Date(moment.value + 3_600_000)).illuminated > now.illuminated;
	return { ...now, waxing, up: now.elevation > 0, at: onChart(Math.max(now.elevation, 0), now.azimuth) };
});
// The line between the moon's light and dark as an SVG path, for a disc of the given radius
// about a centre: the lit edge is half a circle, the line across is half an ellipse.
const moonPath = (cx: number, cy: number, radius: number) => {
	const { illuminated, waxing } = moon.value;
	const across = radius * Math.abs(1 - 2 * illuminated);
	// In the southern sky the waxing moon is lit on the left; north of the equator, on the right.
	const litRight = waxing === boat.value.latitude > 0;
	const edge = litRight ? 1 : 0;
	const bulge = illuminated < 0.5 ? 1 - edge : edge;
	return `M ${cx} ${cy - radius} A ${radius} ${radius} 0 0 ${edge} ${cx} ${cy + radius} A ${across} ${radius} 0 0 ${bulge} ${cx} ${cy - radius} Z`;
};

// The voyage on a plain chart: one degree of latitude or longitude the same length everywhere.
const DEGREE = 3.2;
const onPlot = (latitude: number, longitude: number) => ({
	x: 100 + (((longitude + 360) % 360) - 187) * DEGREE,
	y: 104 - (latitude + 6.5) * DEGREE,
});
const leg = (from: number, to: number) =>
	Array.from({ length: 41 }, (_, i) => {
		const at = boatAt(new Date(VOYAGE.leaves.getTime() + (from + ((to - from) * i) / 40) * (VOYAGE.arrives.getTime() - VOYAGE.leaves.getTime())));
		const point = onPlot(at.latitude, at.longitude);
		return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
	}).join(" ");
const sailed = computed(() => leg(0, boat.value.done));
const ahead = computed(() => leg(boat.value.done, 1));
const here = computed(() => onPlot(boat.value.latitude, boat.value.longitude));
const parallels = [-30, -20, -10, 0, 10, 20].map((latitude) => ({ latitude, y: onPlot(latitude, 180).y }));
const meridians = [170, 180, 190, 200].map((longitude) => ({ longitude, x: onPlot(0, longitude).x }));

// The rose: a line from the rim towards the middle for each thing that comes from somewhere,
// from the side it comes from, the boat's heading at the top.
const arrivals = computed(() => {
	const c = conditions.value;
	if (!c) return [];
	const from = (compass: number, strength: number, kind: string) => {
		const round = (compass - boat.value.bearing) * RAD;
		const reach = 96 - 70 * Math.min(1, strength);
		return { kind, x1: 100 + 96 * Math.sin(round), y1: 100 - 96 * Math.cos(round), x2: 100 + reach * Math.sin(round), y2: 100 - reach * Math.cos(round) };
	};
	return [
		from(c.swellDirection, c.swellHeight / 5, "swell"),
		from(c.secondSwellDirection, c.secondSwellHeight / 5, "swell"),
		from(c.windWaveDirection, c.windWaveHeight / 5, "swell"),
		from(c.windDirection, c.windSpeed / 70, "wind"),
	];
});
const ticks = Array.from({ length: 36 }, (_, i) => {
	const round = i * 10 * RAD;
	const inner = i % 9 === 0 ? 86 : 92;
	return { x1: 100 + 96 * Math.sin(round), y1: 100 - 96 * Math.cos(round), x2: 100 + inner * Math.sin(round), y2: 100 - inner * Math.cos(round) };
});
</script>

<template>
	<svg v-if="kind !== 'none'" class="figure" :data-kind="kind" viewBox="0 0 200 200" aria-hidden="true">
		<template v-if="kind === 'trine' || !live">
			<circle v-if="kind === 'trine'" cx="100" cy="100" r="96" />
			<path v-if="kind === 'trine'" d="M100 4 L183.1 148 L16.9 148 Z" />
		</template>

		<template v-else-if="kind === 'sky'">
			<circle cx="100" cy="100" r="96" />
			<!-- A mark at the top of the rim: the way the boat faces, towards Hawaiʻi. -->
			<path d="M100 4 L100 -2" />
			<circle v-for="(star, i) in stars" :key="i" :cx="star.x" :cy="star.y" :r="star.size" class="solid" />
			<circle v-for="(planet, i) in planets" :key="`p${i}`" :cx="planet.x" :cy="planet.y" r="2.2" />
			<g v-if="sun">
				<circle :cx="sun.x" :cy="sun.y" r="4" />
				<circle :cx="sun.x" :cy="sun.y" r="0.8" class="solid" />
			</g>
			<g v-if="moon.up">
				<circle :cx="moon.at.x" :cy="moon.at.y" r="4.5" />
				<path :d="moonPath(moon.at.x, moon.at.y, 4.5)" class="lit" />
			</g>
		</template>

		<template v-else-if="kind === 'voyage'">
			<line v-for="line in parallels" :key="line.latitude" x1="40" x2="160" :y1="line.y" :y2="line.y" :class="line.latitude === 0 ? 'strong' : 'fine'" />
			<line v-for="line in meridians" :key="line.longitude" :x1="line.x" :x2="line.x" y1="0" y2="200" :class="line.longitude === 180 ? 'dashed' : 'fine'" />
			<polyline :points="ahead" class="dashed" />
			<polyline :points="sailed" class="strong" />
			<circle :cx="onPlot(VOYAGE.from.latitude, VOYAGE.from.longitude).x" :cy="onPlot(VOYAGE.from.latitude, VOYAGE.from.longitude).y" r="2.5" />
			<circle :cx="onPlot(VOYAGE.to.latitude, VOYAGE.to.longitude).x" :cy="onPlot(VOYAGE.to.latitude, VOYAGE.to.longitude).y" r="2.5" />
			<circle :cx="here.x" :cy="here.y" r="1.6" class="solid" />
			<circle :cx="here.x" :cy="here.y" r="5" />
		</template>

		<template v-else-if="kind === 'rose'">
			<circle cx="100" cy="100" r="96" />
			<line v-for="(tick, i) in ticks" :key="i" v-bind="tick" class="fine" />
			<path d="M100 4 L100 -2" />
			<line v-for="(arrival, i) in arrivals" :key="`a${i}`" :x1="arrival.x1" :y1="arrival.y1" :x2="arrival.x2" :y2="arrival.y2" :class="arrival.kind === 'wind' ? 'dashed' : 'strong'" />
			<circle cx="100" cy="100" r="1.6" class="solid" />
		</template>

		<template v-else-if="kind === 'moon'">
			<circle cx="100" cy="100" r="96" />
			<path :d="moonPath(100, 100, 96)" class="lit" />
		</template>
	</svg>
</template>

<style scoped>
.figure {
	overflow: visible;
	fill: none;
	stroke: currentColor;
	stroke-width: 0.4;
	pointer-events: none;
}
.solid {
	fill: currentColor;
	stroke: none;
}
.lit {
	fill: currentColor;
	fill-opacity: 0.5;
}
.fine {
	stroke-width: 0.2;
}
.strong {
	stroke-width: 0.9;
}
.dashed {
	stroke-dasharray: 2 2.5;
}
</style>
