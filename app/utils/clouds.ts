// The clouds as the forecast has them, as volumes of real cloud (three-openvdb's frame renderer:
// every volume is written into one view-aligned voxel grid, lit by the sun, the moon and the sky
// with multiple scattering, and composited over the picture in one pass).
//
// Everything about them is read from the figures for the boat's place (manawatawhi.ts):
//
// - where the cloud base is: the lifting condensation level, 125 m for every degree between the
//   air and its dew point (Espy), of the air of the lowest 150 m as the sea's turbulence mixes it
//   (condensationLevel), so a humid day has a low deck and a dry one a high; rain and a channelled
//   storm lower it; a sheet reaches up to the top of the mixed layer, where its lid is;
// - how deep the low cloud is: rising air climbs through each layer of the sky that cools fast
//   enough with height (lapseAloft) and is held under the first lid, and the energy the air has
//   for thunder (CAPE) sends towers up through everything;
// - what kind it is: fair-weather cumulus when the cover is broken, a stratocumulus or stratus
//   sheet when it is near full and shallow or held under a lid; cells in streets along the wind
//   when the lowest air is unstable under a lid and the wind is fresh (cloud streets);
// - the middle cloud where the air between 3 and 7 km is nearest saturation (the humidity aloft):
//   altocumulus cells where that air is unstable, an altostratus sheet where it is not; the high
//   cloud stays the sky shader's thin veil;
// - how much of the sky each deck covers, seen from above as the forecast's cover is: cumulus are
//   placed, and a sheet's gaps cut, until that share of the field has an optical depth of SEEN_AT;
// - how grey it is (rain, thunder, a storm), how far it can be seen (the visibility), and how each
//   deck drifts: with the wind at its own height, from windsAloft.
//
// Shapes are worked out in a worker (workers/cloud-shapes.worker.ts) for the plan the figures make, a few
// each, and placed as instances: clusters gathered by low noise (and stretched along the wind in
// streets), sheets as tiles that overlap by a tenth and add up to one. When the plan changes the
// new deck fades in over the old. ?clouds=off leaves the sky shader's clouds as they were.
import * as THREE from "three";
import { FrameVolume, frameRenderer } from "three-openvdb/webgl";
import { PLACE, lapseAloft, windsAloft, rainAmount, type SeaConditions } from "./manawatawhi";
import type { ShapeAsk, ShapeAnswer, ShapeKind } from "../workers/cloud-shapes.worker";
import type { CycloneSky } from "./cyclone";

export type LowKind = "none" | "cumulus" | "sheet";
export type MidKind = "none" | "cells" | "sheet";

export interface CloudPlan {
	// Low cloud: base and depth in metres, how firmly a lid holds its tops (0..1) and where that lid
	// is, how far the tops spread under it, how tall the thunder towers are, how much the cells run
	// in streets, what kind of deck it is and how much of the sky it covers (0..1), and the wind that
	// carries it (compass direction it comes from, km/h).
	base: number;
	depth: number;
	lid: number;
	lidAt: number;
	spread: number;
	tower: number;
	streets: number;
	lowKind: LowKind;
	lowCover: number;
	lowFrom: number;
	lowSpeed: number;
	// Middle cloud.
	midKind: MidKind;
	midCover: number;
	midBase: number;
	midThickness: number;
	midFrom: number;
	midSpeed: number;
	// High cloud, left to the sky shader's veil.
	highCover: number;
	// 0..1 how grey and dense the cloud is (rain, thunder, a storm).
	grey: number;
	// Metres at which cloud is lost in the haze, and the visibility (m) the haze is reckoned from.
	fadeRadius: number;
	visibility: number;
	words: string;
}

// Tops of the four layers lapseAloft gives the cooling for, in metres.
const LAYER_TOPS = [760, 1460, 3010, 5570];
const clamp01 = (v: number) => THREE.MathUtils.clamp(v, 0, 1);
const lerp = THREE.MathUtils.lerp;

// Heights in metres of the four levels the humidity aloft is given for (700, 600, 500, 400 hPa).
const MOIST_LEVELS = [3010, 4210, 5570, 7190];

// Where between 3 and 7 km the air is nearest saturation: the heights weighed by how near each
// is (a level at 95% counts some seven times one at 80%), and the depth over which the air is
// within ten points of the wettest and moist (70% or more). With no figures, about 3.8 km.
export function moistLayer(c: SeaConditions) {
	const moist = [c.moistMid, c.moistUpper, c.moistHigh, c.moistTop];
	if (moist.every((rh) => rh == null)) return { centre: 3800, moistDepth: 0, wettest: undefined };
	let sum = 0;
	let weighed = 0;
	moist.forEach((rh, level) => {
		if (rh == null) return;
		const weight = Math.exp((rh - 100) / 8);
		sum += weight * MOIST_LEVELS[level]!;
		weighed += weight;
	});
	const wettest = Math.max(...moist.filter((rh) => rh != null));
	const near = MOIST_LEVELS.filter((_, level) => moist[level] != null && moist[level]! >= Math.max(70, wettest - 10));
	return { centre: sum / weighed, moistDepth: near.length ? Math.max(...near) - Math.min(...near) : 0, wettest };
}

// The water vapour in each kilogram of air, in kilograms, at `air` °C, `humidity` % and `pressure` hPa.
const vapourIn = (air: number, humidity: number, pressure: number) => {
	const vapour = 6.112 * Math.exp((17.62 * air) / (243.12 + air)) * (THREE.MathUtils.clamp(humidity, 1, 100) / 100);
	return (0.622 * vapour) / (pressure - vapour);
};
// The dew point in °C of air holding `ratio` of vapour at `pressure`.
const dewPointOf = (ratio: number, pressure: number) => {
	const g = Math.log((ratio * pressure) / (0.622 + ratio) / 6.112);
	return (243.12 * g) / (17.62 - g);
};
// How deep the air is that a rising parcel brings up with it: the lowest 150 m. Tried against the
// German model's (ICON's) own cumulus bases over August to November 2026 at the boat's place, from
// its own figures: air from the sea alone put 58% of them within 100 m, mixed over the lowest
// 150 m 70%; deeper mixing, up to the whole mixed layer, came out ever higher than its bases.
const MIXED = 150;

// The height in metres at which air rising from the sea condenses into cloud: the lifting
// condensation level of the air of the lowest MIXED metres. That air is taken as running
// straight from the figures at the sea to those at about 760 m (925 hPa), so its mean is the
// value at half the depth; its warmth is mixed as potential temperature (what it would be brought
// down to 1000 hPa), which is what mixing keeps. With no figures aloft, the air at the sea alone.
export function condensationLevel(c: SeaConditions) {
	const pressure = c.pressure || 1013.25;
	const potential = (air: number, at: number) => (air + 273.15) * (1000 / at) ** 0.286;
	let warmth = potential(c.airTemperature, pressure);
	let ratio = vapourIn(c.airTemperature, c.humidity, pressure);
	if (c.airLowTemperature != null && c.moistLow != null) {
		const share = MIXED / 2 / 760;
		warmth += (potential(c.airLowTemperature, 925) - warmth) * share;
		ratio += (vapourIn(c.airLowTemperature, c.moistLow, 925) - ratio) * share;
	}
	const air = warmth * (pressure / 1000) ** 0.286 - 273.15;
	return Math.max(0, 125 * (air - dewPointOf(ratio, pressure)));
}

// The plan for the clouds from the figures, with `fury` the channelled storm's 0..1 and `sky` the
// dial's amount for when there are no figures (the story).
export function cloudPlan(c: SeaConditions | undefined, sky: number, fury: number): CloudPlan {
	if (!c) {
		const cover = clamp01(lerp(sky, 1, fury));
		const depth = lerp(500, 3200, Math.max(sky, fury));
		return {
			base: lerp(900, 350, Math.max(sky, fury)),
			depth,
			lid: 0,
			lidAt: Infinity,
			spread: 0,
			tower: fury,
			streets: 0,
			lowKind: cover < 0.03 ? "none" : cover > 0.8 && depth < 800 ? "sheet" : "cumulus",
			lowCover: cover,
			lowFrom: 220,
			lowSpeed: lerp(15, 60, Math.max(sky, fury)),
			midKind: "none",
			midCover: 0,
			midBase: 3200,
			midThickness: 400,
			midFrom: 240,
			midSpeed: 40,
			highCover: 0.3 * sky,
			grey: fury,
			fadeRadius: lerp(14000, 8000, Math.max(sky, fury)),
			visibility: lerp(30000, 8000, Math.max(sky, fury)),
			words: "the dial's sky",
		};
	}
	const rain = rainAmount(c);
	// The base: every rising parcel condenses at the same height.
	let base = THREE.MathUtils.clamp(condensationLevel(c), 200, 2500);
	base *= (1 - 0.25 * rain) * (1 - 0.35 * fury);
	const lapse = lapseAloft(c);
	// 0..1 how freely air rises through each layer: not at all cooling under 5 °C/km (a lifted,
	// cloudy parcel cools about 6), freely at the dry 9.8.
	const unstable = lapse.map((rate) => clamp01((rate - 5) / 4.8));
	// Depth: up through the unstable layers above the base, to the first lid.
	let depth = 250;
	let lid = 0;
	let lidAt = Infinity;
	for (let layer = 0; layer < 4; layer++) {
		const bottom = layer ? LAYER_TOPS[layer - 1]! : 0;
		const top = LAYER_TOPS[layer]!;
		if (top <= base) continue;
		if (lapse[layer]! < 2.5) {
			lid = clamp01((2.5 - lapse[layer]!) / 4);
			lidAt = Math.max(bottom, base + 150);
			break;
		}
		depth += unstable[layer]! * (top - Math.max(bottom, base));
	}
	if (lidAt < Infinity) depth = Math.min(depth, Math.max(200, lidAt - base));
	// Thunder energy sends towers up through the lid.
	const tower = clamp01((c.cape - 300) / 1700);
	depth = Math.max(depth, 1500 * clamp01((c.cape - 300) / 1200) + 2500 * clamp01((c.cape - 1500) / 2000));
	depth = Math.max(depth, 2800 * fury);
	lid *= 1 - fury;
	depth = THREE.MathUtils.clamp(depth, 200, 6000);
	// The top of the air the sea mixes, where a sheet of cloud has its lid (the forecast's boundary
	// layer); missing in figures kept from before it was asked for.
	const mixedTop = c.mixedDepth != null && c.mixedDepth > base + 100 ? c.mixedDepth : undefined;
	const lowCover = clamp01(lerp(c.cloudLow / 100, 1, 0.9 * fury));
	const lowKind: LowKind = lowCover < 0.03 ? "none" : lowCover >= 0.72 && ((lid > 0.2 && lidAt - base < 900) || depth < 700) ? "sheet" : "cumulus";
	// A sheet fills the mixed air from its base up to that lid.
	if (lowKind === "sheet" && mixedTop != null && fury < 0.5) depth = THREE.MathUtils.clamp(mixedTop - base, 150, 1200);
	const winds = windsAloft(c);
	const lowWind = (base > 1100 ? winds[2] : winds[1])!;
	const midWind = winds[3]!;
	// Streets: unstable air under a near lid, in a fresh wind, rolls into lines along it.
	const streets = unstable[0]! * (lidAt < 1600 ? lid : 0) * clamp01((lowWind.speed - 15) / 20);
	const spread = lid * (lidAt - base < 1200 ? 1 : 0.4);
	// The middle cloud (the forecast's is from 3 to 8 km) stands where the air there is nearest
	// saturation, and is as deep as the air near that is moist.
	const midCover = clamp01((c.cloudMid / 100) * (1 - 0.5 * fury));
	const { centre: midCentre, moistDepth } = moistLayer(c);
	const midUnstable = midCentre < LAYER_TOPS[2]! ? unstable[2]! : unstable[3]!;
	const midThickness = THREE.MathUtils.clamp(lerp(250, 900, midUnstable) + 0.5 * moistDepth, 250, 2000);
	const midBase = THREE.MathUtils.clamp(midCentre - midThickness / 2, 2600, 7000);
	const midKind: MidKind = midCover < 0.03 ? "none" : midUnstable > 0.35 ? "cells" : "sheet";
	const highCover = clamp01(c.cloudHigh / 100);
	const grey = clamp01(0.6 * rain + 0.55 * fury + (c.weatherCode >= 95 ? 0.25 : 0));
	const fadeRadius = THREE.MathUtils.clamp(lerp(c.visibility * 1.4, 9000, fury), 7000, 18000);
	const kinds: Record<LowKind, string> = {
		none: "no low cloud",
		cumulus: depth < 500 ? "fair-weather cumulus" : depth < 1500 ? "cumulus" : tower > 0.3 ? "towering cumulus" : "deep cumulus",
		sheet: depth < 450 ? "stratus" : "stratocumulus",
	};
	const mids: Record<MidKind, string> = { none: "", cells: "altocumulus", sheet: "altostratus" };
	const words = [
		`${kinds[lowKind]} ${Math.round(lowCover * 100)}%`,
		lowKind !== "none" ? `base ${Math.round(base / 10) * 10} m · ${(depth / 1000).toFixed(1)} km deep` : "",
		mixedTop != null ? `air mixed to ${Math.round(mixedTop / 10) * 10} m` : "",
		lidAt < Infinity && lowKind !== "none" ? `lid at ${(lidAt / 1000).toFixed(1)} km (${Math.round(lid * 100)}%)` : "",
		streets > 0.15 ? `streets ${Math.round(streets * 100)}%` : "",
		lowKind !== "none" ? `drifting ${Math.round(lowWind.speed)} km/h from ${Math.round(lowWind.from)}°` : "",
		midKind !== "none" ? `${mids[midKind]} ${Math.round(midCover * 100)}% at ${(midBase / 1000).toFixed(1)} km` : "",
		`high veil ${Math.round(highCover * 100)}%`,
		grey > 0.1 ? `grey ${Math.round(grey * 100)}%` : "",
		`seen to ${(fadeRadius / 1000).toFixed(0)} km`,
	]
		.filter(Boolean)
		.join(" · ");
	return { base, depth, lid, lidAt, spread, tower, streets, lowKind, lowCover, lowFrom: lowWind.from, lowSpeed: lowWind.speed, midKind, midCover, midBase, midThickness, midFrom: midWind.from, midSpeed: midWind.speed, highCover, grey, fadeRadius, visibility: Math.max(500, c.visibility), words };
}

// Scene angle of the way a wind from `from` blows: its unit vector is (sin, 0, -cos), ahead being -z.
const blowsTowards = (from: number) => THREE.MathUtils.degToRad(from + 180 - PLACE.bearing);

export interface CloudLight {
	sun: THREE.Vector3;
	moon: THREE.Vector3;
	sunElevation: number;
	daylight: number;
	moonlight: number;
	storm: number;
}

export interface CloudState {
	conditions?: SeaConditions;
	sky: number;
	fury: number;
	alive: number;
	// The cyclone (cyclone.ts), while there is one: its cloud is laid out and turned about its centre.
	cyclone?: CycloneSky;
	// Where the eye is (for the haze between it and each cloud).
	eye: THREE.Vector3;
}

type Layer = "low" | "mid";

interface Item {
	// Where it stands in the deck's frame: `a` along the wind, `b` across it.
	a: number;
	b: number;
	slot: THREE.Object3D;
	volume: FrameVolume;
}

interface Deck {
	layer: Layer;
	key: string;
	group: THREE.Group;
	sources: FrameVolume[];
	items: Item[];
	along: THREE.Vector3;
	across: THREE.Vector3;
	speed: number;
	half: number;
	born: number;
	dying: number;
	// Extinction for each metre, and the volumes' longest side.
	extinction: number;
	longest: number;
}

// The haze between the eye and a cloud (the renderer has none of its own): how much of the cloud is still
// seen through the air at a distance, Koschmieder's law, the visibility being where it is lost (a contrast
// of 2%), and the light the air scatters in being near enough the sky behind the cloud, which shows as it
// fades. Without it a cloud in rain stood as sharp kilometres off as one overhead.
const hazeAt = (distance: number, visibility: number) => Math.exp((-3.912 * distance) / Math.max(visibility, 500));
// Seconds a new deck takes to come in over the old.
const CROSSFADE = 25;
// Light on the clouds, in the sky shader's units (its daylight sky is about 1; a light's radiance
// is spread over the sphere by the phase function, so a light is many times the sky it matches).
// (14 November: at 24 and 4.5 a fair-weather cumulus was grey, never white in the sun, and in rain the
// cloud was ink against a paler overcast, darker than any rain cloud is; tried by eye against both.)
const SUN = 52;
const MOON = 1.3;
// The sky's light: under a blue sky with the sun out, and under a full overcast, where it is all there is.
const HEMISPHERE_CLEAR = 4.5;
const HEMISPHERE_OVERCAST = 18;
// The light reaching a cloud's base from below, against the sky's from above: a cloud's base is lit by
// the daylight that has come down through it (a quarter to a third of what falls on its top, for the
// optical depths of cumulus), which the renderer's own scattering gives too little of; the sea gives
// almost nothing.
const BASE_LIGHT = new THREE.Color(0.38, 0.42, 0.46);
// The optical depth from which a column of the deck counts as cloud seen from above, for its
// cover: where it dims the sun behind it by two-fifths.
const SEEN_AT = 0.5;
// Most cumulus a deck holds; past this, more cover makes each a wider bank of more cells.
const MOST_CUMULUS = 140;
// About how much of its box a cumulus shape covers seen from above, to know beforehand how many
// are wanted (the deck is then filled until its cover is right, whatever this is).
const CUMULUS_FOOTPRINT = 0.3;
// (?cloudquality=0.625 makes the cumulus shapes coarser, as they were, to compare.)
const QUALITY = Number((typeof location !== "undefined" ? new URLSearchParams(location.search).get("cloudquality") : null) ?? 1) || 1;

// The cyclone's cloud (cyclone.ts; the owner, 14 November: "the weather should become like a cyclone"). Three
// kinds of cell, each a cumulus cluster from the worker: the great walls about the eye with their tops spread
// under the tropopause (anvils: the central dense overcast), the towers in the inner arms, and the lower cells
// of the outer bands. A real cyclone's bands are not the same air going round: cells are born on the arms,
// carried round by the wind (faster near the eye, as the wind is), rise, and die, and new ones are born on the
// arms again; so the arms keep their place, turning slowly, while the cloud in them streams through. For each
// kind: its box (m), what the worker is asked for, how many, how long each lives (s), where it is born (in
// eyes' radii from the centre) and how soon in the cyclone's forming it comes in (0..1).
const CYCLONE_CELLS = [
	{ width: 4200, height: 9000, voxels: [112, 64, 112], aspect: 0.75, cells: 14, widen: 2.2, lid: 0.55, spread: 0.9, tower: 1, count: 26, life: [300, 520], from: 0.9, to: 2.1, comes: 0 },
	{ width: 2400, height: 6500, voxels: [88, 64, 88], aspect: 0.8, cells: 7, widen: 1.4, lid: 0.25, spread: 0.5, tower: 1, count: 40, life: [160, 320], from: 1.6, to: 4.5, comes: 0.2 },
	{ width: 2600, height: 2600, voxels: [88, 40, 88], aspect: 1.3, cells: 8, widen: 1.8, lid: 0.15, spread: 0.3, tower: 0.5, count: 60, life: [120, 260], from: 2.5, to: 7.2, comes: 0.35 },
] as const;
// The arms: how many, how tightly they wind (the angle at which a band crosses the circles about the centre),
// and how long the pattern takes to go round once (s).
const CYCLONE_ARMS = 3;
const CYCLONE_ARM_ANGLE = THREE.MathUtils.degToRad(16);
const CYCLONE_PATTERN_ROUND = 1500;
// The wind at the eye's edge that carries the cells (m/s), and how it falls away outside it (as the root of
// the radius, nearly: a cyclone's tangential wind); a little inflow as they go round.
const CYCLONE_WIND = 45;
const CYCLONE_WIND_FALL = 0.6;
const CYCLONE_INFLOW = 0.12;

interface CycloneCell {
	kind: number;
	slot: THREE.Object3D;
	volume: FrameVolume;
	on: boolean;
	r: number;
	phi: number;
	born: number;
	life: number;
	size: number;
	rise: number;
}
interface CycloneDeck {
	group: THREE.Group;
	sources: FrameVolume[];
	cells: CycloneCell[];
	born: number;
	dying: number;
	extinction: number;
	// The arms' angle at the eye when the deck was made (radians, anticlockwise from x seen from above).
	phi0: number;
}

// Small value noise for gathering the clusters.
const hash2 = (x: number, y: number, seed: number) => {
	let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2246822519)) | 0;
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const noise2 = (x: number, y: number, seed: number) => {
	const xi = Math.floor(x);
	const yi = Math.floor(y);
	const fx = THREE.MathUtils.smoothstep(x - xi, 0, 1);
	const fy = THREE.MathUtils.smoothstep(y - yi, 0, 1);
	return lerp(lerp(hash2(xi, yi, seed), hash2(xi + 1, yi, seed), fx), lerp(hash2(xi, yi + 1, seed), hash2(xi + 1, yi + 1, seed), fx), fy);
};
const fbm2 = (x: number, y: number, seed: number) => 0.5 * noise2(x, y, seed) + 0.3 * noise2(x * 2.1 + 5, y * 2.1 + 3, seed + 7) + 0.2 * noise2(x * 4.3 + 1, y * 4.3 + 9, seed + 13);

export function createClouds(scene: THREE.Scene, { on }: { on: boolean }) {
	const group = new THREE.Group();
	group.name = "clouds";
	scene.add(group);

	// Light: the sun or the moon as one directional light, and the sky above and the sea below as a
	// hemisphere. Nothing else in the scene is lit by lights, so they touch only the clouds.
	const sunLight = new THREE.DirectionalLight(0xffffff, 0);
	const moonLight = new THREE.DirectionalLight(0xb8c6e6, 0);
	const hemisphere = new THREE.HemisphereLight(0x8fb0e0, BASE_LIGHT, 0);
	if (on) {
		scene.add(sunLight, sunLight.target, moonLight, moonLight.target, hemisphere);
		// (?cloudgrid=640x512x48 tries another grid: across, up, deep.)
		const grid = (typeof location !== "undefined" ? new URLSearchParams(location.search).get("cloudgrid") : null)?.split("x").map(Number);
		// (14 November: 480 by 384 by 40, where it was 320 by 256 by 32, and no blending of one frame into the next:
		// the boat moves the eye every frame, and the blending smeared every near cloud sideways into a pillar.
		// Measured against the old in one headless page, second by second: about 9.7 frames a second for 10.7;
		// 640 by 512 by 48 was 9, for little more to see.)
		Object.assign(frameRenderer.settings, {
			width: grid?.[0] || 480,
			height: grid?.[1] || 384,
			depth: grid?.[2] || 40,
			subSteps: 12,
			// The shadow grid's last cascade covers the whole field (30 km and more); the finer ones,
			// each half the size, give the near clouds shadowed undersides.
			shadowResolution: 64,
			shadowCascades: 4,
			shadowDistance: 8000,
			multipleScattering: "neural",
			phase: "henyey-greenstein",
			phaseG: 0.8,
			// The picture is composited in linear light before the tone mapping (setEffects).
			srgbBlending: false,
			temporal: false,
			temporalBlend: 0.15,
			jitter: false,
			near: 50,
			environmentLighting: "outward",
		});
		// (?cloudset=temporal:false,subSteps:16 tries other settings of the renderer, to compare.)
		const trying = typeof location !== "undefined" ? new URLSearchParams(location.search).get("cloudset") : null;
		for (const pair of trying?.split(",") ?? []) {
			const [key, raw] = pair.split(":");
			if (!key || raw === undefined) continue;
			(frameRenderer.settings as unknown as Record<string, unknown>)[key] = raw === "true" ? true : raw === "false" ? false : Number.isFinite(Number(raw)) ? Number(raw) : raw;
		}
		// The renderer would draw the whole scene again for its depth, to stop the march at things in
		// front of the cloud. Nothing solid is ever in front of a cloud here (the sea is below it, the
		// weaves write no depth), so the depth is only cleared: the march runs to the far slice.
		// (For looking into how they are drawn, in the console.)
		(globalThis as unknown as { __cloudRenderer?: unknown }).__cloudRenderer = { renderer: frameRenderer, sunLight, moonLight, hemisphere };
		frameRenderer.renderDepth = (renderer) => {
			if (!frameRenderer.depthTarget) return;
			renderer.setRenderTarget(frameRenderer.depthTarget);
			renderer.clear(false, true, false);
		};
	}

	let plan = cloudPlan(undefined, 0, 0);
	// The figures the plan was last read from, for describe.
	let readFrom: SeaConditions | undefined;
	let planAt = -Infinity;
	let fade = plan.fadeRadius;
	const decks: Deck[] = [];
	// How much of the field each layer's newest deck covers seen from above, against the forecast.
	const cover: Partial<Record<Layer, { wanted: number; seen: number }>> = {};
	const building = new Set<Layer>();
	let worker: Worker | undefined;
	let nextAsk = 1;
	const waiting = new Map<number, (answer: ShapeAnswer) => void>();
	const ensureWorker = () => {
		if (worker) return worker;
		worker = new Worker(new URL("../workers/cloud-shapes.worker.ts", import.meta.url), { type: "module" });
		worker.onmessage = (event: MessageEvent<ShapeAnswer>) => {
			waiting.get(event.data.id)?.(event.data);
			waiting.delete(event.data.id);
		};
		return worker;
	};
	const askShape = (ask: Omit<ShapeAsk, "id">) =>
		new Promise<ShapeAnswer>((resolve) => {
			const id = nextAsk++;
			waiting.set(id, resolve);
			ensureWorker().postMessage({ ...ask, id });
		});

	const quantize = (v: number, step: number) => Number((Math.round(v / step) * step).toFixed(3));
	// What a deck is built from, so that a small change in the figures does not rebuild it.
	const layerKey = (p: CloudPlan, layer: Layer) =>
		layer === "low"
			? p.lowKind === "none"
				? "none"
				: [p.lowKind, quantize(p.grey, 0.5), quantize(p.depth, 400), quantize(p.lid, 0.5), quantize(p.spread, 0.5), quantize(p.tower, 0.5), quantize(p.streets, 0.5), p.lowKind === "sheet" ? quantize(p.lowCover, 0.15) : quantize(p.lowCover, 0.2), quantize(p.lowFrom, 30) % 360, quantize(p.base, 200)].join("/")
			: p.midKind === "none"
				? "none"
				: [p.midKind, quantize(p.midCover, 0.15), quantize(p.midThickness, 300), quantize(p.midFrom, 30) % 360, quantize(p.midBase, 400)].join("/");

	// The deck's wind frame.
	const frameOf = (from: number) => {
		const angle = blowsTowards(from);
		const along = new THREE.Vector3(Math.sin(angle), 0, -Math.cos(angle));
		const across = new THREE.Vector3(-along.z, 0, along.x);
		// rotation.y that turns a shape's x axis along the wind.
		const turn = Math.PI / 2 - angle;
		return { along, across, turn };
	};

	// A sheet deck's tiles: how wide and how deep each is.
	const tileOf = (p: CloudPlan, layer: Layer) =>
		layer === "low" ? { tile: 6000, thickness: Math.max(300, p.depth * 1.6) } : { tile: 9000, thickness: Math.max(400, p.midThickness * 1.6) };
	// A column's optical depth is its `column` times this: the extinction for each metre times the box's height.
	const sheetDepthScale = (p: CloudPlan, layer: Layer) => extinctionFor(p, layer) * tileOf(p, layer).thickness;

	// The field's half-width: the clouds are seen to the fade, and come round at its edge.
	const halfField = () => Math.min(fade, 16000) * 0.95;
	// A cumulus box's usual width, and how many times that it is made for the cover to be reached
	// with at most MOST_CUMULUS of them (allowing a third more for their overlapping).
	const usualWidth = (p: CloudPlan) => lerp(950, 1500, 0.4 + 0.6 * p.lowCover);
	const cumulusWidth = (p: CloudPlan) => {
		const width = usualWidth(p);
		const needed = (1.3 * p.lowCover * (2 * halfField()) ** 2) / (CUMULUS_FOOTPRINT * width * width * 1.17);
		const widen = needed > MOST_CUMULUS ? Math.min(2.5, Math.sqrt(needed / MOST_CUMULUS)) : 1;
		return { width: width * widen, widen };
	};

	const asksFor = (p: CloudPlan, layer: Layer): Omit<ShapeAsk, "id">[] => {
		const seedBase = Math.floor((layer === "low" ? p.base : p.midBase) / 50) * 7 + (layer === "low" ? 1 : 1000);
		const blank = { aspect: 1, cells: 1, widen: 1, lid: 0, spread: 0, tower: 0, cover: 1, streets: 0, thickness: 0.5, lumps: 4, depthScale: 0, seenAt: SEEN_AT };
		if (layer === "low" && p.lowKind === "cumulus") {
			const aspect = p.depth < 500 ? 2.2 : p.depth < 1500 ? 1.3 : 0.8;
			const { widen } = cumulusWidth(p);
			// (128 voxels across a usual cloud, 64 up: at 80 by 48 a cloud a kilometre off was blurred over some
			// twenty-five pixels of the picture, every voxel nineteen metres.)
			const across = Math.round(QUALITY * 128 * Math.min(widen, 2));
			// Four shapes: a fragment of a cell or two, up to a bank of many.
			return [0, 1, 2, 3].map((n) => ({ ...blank, kind: "cumulus" as ShapeKind, size: [across, Math.round(QUALITY * 64), across] as [number, number, number], seed: seedBase + n, aspect: (aspect * (n === 0 ? 1.2 : 1)) / widen, cells: Math.min(36, Math.round(([2, 4, 6, 8][n]! + Math.round(p.lowCover * 2)) * widen * widen)), widen, lid: p.lid, spread: p.spread, tower: p.tower, ragged: clamp01(1.8 * p.grey) }));
		}
		if (layer === "low" && p.lowKind === "sheet") {
			return [0, 1].map((n) => ({ ...blank, kind: "sheet" as ShapeKind, size: [96, 16, 96] as [number, number, number], seed: seedBase + n, cover: p.lowCover, depthScale: sheetDepthScale(p, "low"), streets: p.streets, thickness: THREE.MathUtils.clamp(p.depth / 900, 0.25, 0.75), lumps: p.depth < 450 ? 2.5 : 4.5 }));
		}
		if (layer === "mid" && p.midKind !== "none") {
			return [0, 1].map((n) => ({ ...blank, kind: "sheet" as ShapeKind, size: [96, 16, 96] as [number, number, number], seed: seedBase + n, cover: p.midCover, depthScale: sheetDepthScale(p, "mid"), streets: 0, thickness: THREE.MathUtils.clamp(p.midThickness / 1200, 0.2, 0.7), lumps: p.midKind === "cells" ? 9 : 2.5 }));
		}
		return [];
	};

	// The cloud's extinction for each metre at its mean density: about 0.06 in cumulus (half a gram
	// of water a cubic metre in droplets of 10 µm), 0.027 in a sheet, 0.01 in middle cloud, which is
	// thinner and part ice; more in grey, raining cloud.
	const extinctionFor = (p: CloudPlan, layer: Layer) => (layer === "low" ? (p.lowKind === "sheet" ? 0.0267 : 0.0583) * (1 + 1.2 * p.grey) : 0.01 * (1 + 0.5 * p.grey));
	const albedoFor = (p: CloudPlan) => 1 - 0.12 * p.grey;

	const buildDeck = (layer: Layer, p: CloudPlan, key: string, answers: ShapeAnswer[], widen: number, now: number) => {
		const frame = frameOf(layer === "low" ? p.lowFrom : p.midFrom);
		const deckGroup = new THREE.Group();
		const extinction = extinctionFor(p, layer);
		const albedo = albedoFor(p);
		const items: Item[] = [];
		const sources: FrameVolume[] = [];
		const seed = Math.floor(p.base) + (layer === "low" ? 0 : 500);
		let random = 0;
		const rand = () => hash2(random++, 3, seed);
		const half = halfField();
		const y = layer === "low" ? p.base : p.midBase;
		let count = 0;
		// Half the field's width in the deck's frame; the tiles' is a whole number of tiles.
		let deckHalf = half;
		// The box's longest side, which the renderer's extinction is given over.
		let longest = 1;
		const place = (source: FrameVolume, a: number, b: number, scale: number, turn: number) => {
			const volume = source.createInstance();
			volume.proxy.renderOrder = -1;
			const slot = new THREE.Object3D();
			slot.rotation.y = turn;
			slot.scale.set(scale, 1 + 0.25 * (scale - 1), scale);
			slot.add(volume);
			deckGroup.add(slot);
			items.push({ a, b, slot, volume });
			count++;
		};
		// What the deck covers seen from above, on a grid over the field in its own frame (wrapping,
		// as the clouds do): each cell's optical depth summed from every volume over it.
		// A sheet's tiles reach past the field, to a whole number of them: the grid spans them all.
		const { tile } = tileOf(p, layer);
		const sheetTiles = Math.ceil((2 * half) / (tile * 0.9)) + 1;
		const gridHalf = layer === "low" && p.lowKind === "cumulus" ? half : (sheetTiles * tile * 0.9) / 2;
		const cellSize = Math.max(50, (2 * gridHalf) / 800);
		const cellsAcross = Math.ceil((2 * gridHalf) / cellSize);
		const depthGrid = new Float32Array(cellsAcross * cellsAcross);
		let seenCells = 0;
		// Lays a volume's columns onto the grid: its box `boxWidth` across at `scale`, turned by
		// `turn`, its columns' optical depths `depthScale` times `column`.
		const stamp = (answer: ShapeAnswer, depthScale: number, boxWidth: number, a: number, b: number, scale: number, turn: number) => {
			const [nx, , nz] = answer.size;
			const reach = (boxWidth * scale) / Math.SQRT2;
			const cos = Math.cos(turn);
			const sin = Math.sin(turn);
			const cells = Math.ceil(reach / cellSize);
			const ci = Math.floor((a + gridHalf) / cellSize);
			const cj = Math.floor((b + gridHalf) / cellSize);
			for (let di = -cells; di <= cells; di++)
				for (let dj = -cells; dj <= cells; dj++) {
					// The cell's centre against the volume's, in the deck's frame, then in the world, then in the
					// volume's own turned box (three.js turns (x, z) by rotation.y as (x cos + z sin, -x sin + z cos)).
					const da = (ci + di + 0.5) * cellSize - gridHalf - a;
					const db = (cj + dj + 0.5) * cellSize - gridHalf - b;
					const wx = frame.along.x * da + frame.across.x * db;
					const wz = frame.along.z * da + frame.across.z * db;
					const x = (wx * cos - wz * sin) / (boxWidth * scale) + 0.5;
					const z = (wx * sin + wz * cos) / (boxWidth * scale) + 0.5;
					if (x < 0 || x >= 1 || z < 0 || z >= 1) continue;
					const depth = depthScale * answer.column[Math.floor(x * nx) + nx * Math.floor(z * nz)]!;
					if (depth <= 0) continue;
					const i = (((ci + di) % cellsAcross) + cellsAcross) % cellsAcross;
					const j = (((cj + dj) % cellsAcross) + cellsAcross) % cellsAcross;
					const cell = i + cellsAcross * j;
					const before = depthGrid[cell]!;
					depthGrid[cell] = before + depth;
					if (before < SEEN_AT && before + depth >= SEEN_AT) seenCells++;
				}
		};
		const seenCover = () => seenCells / (cellsAcross * cellsAcross);
		const wantedCover = layer === "low" ? p.lowCover : p.midCover;
		if (layer === "low" && p.lowKind === "cumulus") {
			const height = p.depth * 1.15;
			// How much each shape covers at the usual width, to know how many are wanted; if that is more
			// than the deck holds, they are made bigger instead.
			const depthScale = extinction * height;
			// The width the shapes were made for.
			const width = usualWidth(p) * widen;
			longest = Math.max(width, height);
			for (const answer of answers) {
				sources.push(new FrameVolume(answer.data, { dimensions: answer.size, bbox: new THREE.Box3(new THREE.Vector3(-width / 2, 0, -width / 2), new THREE.Vector3(width / 2, height, width / 2)), extinction: extinction * longest, baseColor: new THREE.Color(albedo, albedo, albedo), absorbance: 1, mipmaps: true }));
			}
			const placed: { a: number; b: number; w: number }[] = [];
			const stretch = 1 + 5 * p.streets;
			const apart = 0.45 * (1 - 0.7 * THREE.MathUtils.smoothstep(p.lowCover, 0.15, 0.6));
			for (let tries = 0; tries < 60000 && placed.length < MOST_CUMULUS && seenCover() < p.lowCover; tries++) {
				const a = (rand() - 0.5) * 2 * half;
				const b = (rand() - 0.5) * 2 * half;
				// Gathered by low noise into banks and clear lanes; the banks stretch along the wind in streets.
				const weight = THREE.MathUtils.smoothstep(fbm2(a / stretch / 5000, b / 5000, seed), 0.42, 0.7);
				if (rand() > 0.06 + 0.94 * weight * weight) continue;
				const scale = lerp(0.6, 1.5, rand());
				const w = width * scale;
				// Kept apart when the cover is broken; as it closes they touch and merge, as cumulus do.
				if (placed.some((other) => Math.hypot(other.a - a, other.b - b) < apart * (other.w + w))) continue;
				placed.push({ a, b, w });
				const turn = p.streets > 0.3 ? frame.turn + Math.round(rand()) * Math.PI : rand() * Math.PI * 2;
				const shape = Math.floor(rand() * sources.length);
				place(sources[shape]!, a, b, scale, turn);
				stamp(answers[shape]!, depthScale, width, a, b, scale, turn);
			}
		} else {
			// Tiles that overlap by a tenth, over the whole field, in the wind's frame.
			const { thickness } = tileOf(p, layer);
			const depthScale = sheetDepthScale(p, layer);
			longest = Math.max(tile, thickness);
			for (const answer of answers) {
				sources.push(new FrameVolume(answer.data, { dimensions: answer.size, bbox: new THREE.Box3(new THREE.Vector3(-tile / 2, 0, -tile / 2), new THREE.Vector3(tile / 2, thickness, tile / 2)), extinction: extinction * longest, baseColor: new THREE.Color(albedo, albedo, albedo), absorbance: 1, mipmaps: true }));
			}
			const spacing = tile * 0.9;
			const n = sheetTiles;
			deckHalf = gridHalf;
			for (let i = 0; i < n; i++)
				for (let j = 0; j < n; j++) {
					const a = (i - (n - 1) / 2) * spacing;
					const b = (j - (n - 1) / 2) * spacing;
					const shape = (i + j) % sources.length;
					const turn = frame.turn + (Math.floor(rand() * 2) === 0 ? 0 : Math.PI);
					place(sources[shape]!, a, b, 1, turn);
					stamp(answers[shape]!, depthScale, tile, a, b, 1, turn);
				}
		}
		cover[layer] = { wanted: wantedCover, seen: seenCover() };
		group.add(deckGroup);
		const deck: Deck = { layer, key, group: deckGroup, sources, items, along: frame.along, across: frame.across, speed: (layer === "low" ? p.lowSpeed : p.midSpeed) / 3.6, half: deckHalf, born: now, dying: Infinity, extinction, longest };
		for (const item of items) item.slot.position.set(0, y, 0);
		decks.push(deck);
		return count;
	};

	const disposeDeck = (deck: Deck) => {
		group.remove(deck.group);
		for (const item of deck.items) item.volume.dispose();
		for (const source of deck.sources) source.dispose();
		decks.splice(decks.indexOf(deck), 1);
	};

	const rebuild = (layer: Layer, p: CloudPlan, key: string, now: number) => {
		building.add(layer);
		const asks = asksFor(p, layer);
		Promise.all(asks.map(askShape)).then((answers) => {
			building.delete(layer);
			if (disposed) return;
			for (const deck of decks) if (deck.layer === layer && deck.dying === Infinity) deck.dying = now;
			if (answers.length) buildDeck(layer, p, key, answers, asks[0]!.widen, now);
		});
	};

	let now = 0;
	let disposed = false;

	// The cyclone's deck: built once when it begins (the worker's shapes), its cells born and carried round.
	let cyclone: CycloneDeck | undefined;
	let cycloneBuilding = false;
	let cycloneFormed = 0;
	let cycloneOverhead = 0;
	const cycloneRandom = () => Math.random();
	const buildCyclone = (p: CloudPlan, sky: CycloneSky) => {
		cycloneBuilding = true;
		const asks = CYCLONE_CELLS.flatMap((kind, k) =>
			[0, 1].map((n) => ({ kind: "cumulus" as ShapeKind, size: [...kind.voxels] as [number, number, number], seed: 9000 + 10 * k + n, aspect: kind.aspect, cells: kind.cells, widen: kind.widen, lid: kind.lid, spread: kind.spread, tower: kind.tower, ragged: k === 2 ? 0.6 : 0.3, cover: 1, streets: 0, thickness: 0.5, lumps: 4, depthScale: 0, seenAt: SEEN_AT })),
		);
		Promise.all(asks.map(askShape)).then((answers) => {
			cycloneBuilding = false;
			if (disposed) return;
			const deckGroup = new THREE.Group();
			const extinction = 0.0583 * (1 + 1.2 * Math.max(0.5, p.grey));
			const albedo = albedoFor(p);
			const sources = answers.map((answer, i) => {
				const kind = CYCLONE_CELLS[Math.floor(i / 2)]!;
				const longest = Math.max(kind.width, kind.height);
				return new FrameVolume(answer.data, { dimensions: answer.size, bbox: new THREE.Box3(new THREE.Vector3(-kind.width / 2, 0, -kind.width / 2), new THREE.Vector3(kind.width / 2, kind.height, kind.width / 2)), extinction: extinction * longest, baseColor: new THREE.Color(albedo, albedo, albedo), absorbance: 1, mipmaps: true });
			});
			const cells: CycloneCell[] = [];
			CYCLONE_CELLS.forEach((kind, k) => {
				for (let i = 0; i < kind.count; i++) {
					const volume = sources[2 * k + (i % 2)]!.createInstance();
					volume.proxy.renderOrder = -1;
					volume.opacity = 0;
					const slot = new THREE.Object3D();
					slot.rotation.y = cycloneRandom() * Math.PI * 2;
					slot.add(volume);
					slot.visible = false;
					deckGroup.add(slot);
					cells.push({ kind: k, slot, volume, on: false, r: 0, phi: 0, born: 0, life: 1, size: 1, rise: 60 });
				}
			});
			group.add(deckGroup);
			// The arms are laid so that one lies over the boat as the deck is made.
			const boatR = Math.max(1, Math.hypot(sky.centre.x, sky.centre.y));
			const boatPhi = Math.atan2(sky.centre.y, -sky.centre.x);
			const phi0 = boatPhi + sky.turn * Math.log(boatR / sky.eye) / Math.tan(CYCLONE_ARM_ANGLE);
			cyclone = { group: deckGroup, sources, cells, born: now, dying: Infinity, extinction, phi0 };
		});
	};
	// The arms' angle at radius r (radians, anticlockwise from x seen from above): log spirals trailing the
	// way the cyclone turns, so that going in along one goes round with the wind; the pattern turning slowly.
	const armAngle = (sky: CycloneSky, deck: CycloneDeck, arm: number, r: number) =>
		deck.phi0 + (arm * 2 * Math.PI) / CYCLONE_ARMS + sky.turn * ((2 * Math.PI * (now - deck.born)) / CYCLONE_PATTERN_ROUND) - (sky.turn * Math.log(r / sky.eye)) / Math.tan(CYCLONE_ARM_ANGLE);
	const windAt = (r: number, eye: number) => (r < eye ? (CYCLONE_WIND * r) / eye : CYCLONE_WIND * (eye / r) ** CYCLONE_WIND_FALL);
	const bornAt = (cell: CycloneCell, sky: CycloneSky, deck: CycloneDeck) => {
		const kind = CYCLONE_CELLS[cell.kind]!;
		// At first only about where the rope went up; the rest as it forms, out to the bands.
		const formed = sky.formed;
		const out = THREE.MathUtils.lerp(kind.from, kind.to, cycloneRandom() ** 0.8) * THREE.MathUtils.lerp(0.35, 1, THREE.MathUtils.smoothstep(formed, 0, 0.6));
		cell.r = Math.max(150, out * sky.eye);
		cell.phi =
			cell.kind === 0
				? cycloneRandom() * Math.PI * 2
				: armAngle(sky, deck, Math.floor(cycloneRandom() * CYCLONE_ARMS), cell.r) + (cycloneRandom() - 0.5) * (cell.kind === 1 ? 0.5 : 0.35);
		cell.born = now;
		cell.life = THREE.MathUtils.lerp(kind.life[0], kind.life[1], cycloneRandom());
		cell.size = THREE.MathUtils.lerp(0.6, 1.15, cycloneRandom()) * (cell.kind === 0 ? THREE.MathUtils.lerp(0.55, 1, formed) : 1);
		cell.rise = THREE.MathUtils.lerp(40, 80, cycloneRandom());
		cell.on = true;
		cell.slot.visible = true;
	};
	const updateCyclone = (delta: number, sky: CycloneSky | undefined, alive: number) => {
		const deck = cyclone;
		if (!deck) return;
		if (sky && deck.dying < Infinity) deck.dying = Infinity;
		if (!sky && deck.dying === Infinity) deck.dying = now;
		const going = deck.dying === Infinity ? 0 : THREE.MathUtils.smoothstep(now - deck.dying, 0, CROSSFADE);
		if (going >= 1) {
			group.remove(deck.group);
			for (const cell of deck.cells) cell.volume.dispose();
			for (const source of deck.sources) source.dispose();
			cyclone = undefined;
			cycloneOverhead = 0;
			return;
		}
		const extinction = 0.0583 * (1 + 1.2 * Math.max(0.5, plan.grey));
		deck.extinction += (extinction - deck.extinction) * Math.min(1, delta * 0.1);
		const albedo = albedoFor(plan);
		let overhead = 0;
		CYCLONE_CELLS.forEach((kind, k) => {
			const cells = deck.cells.filter((cell) => cell.kind === k);
			// How many are alive by how far it has formed.
			const wanted = !sky ? 0 : Math.round(kind.count * THREE.MathUtils.smoothstep(sky.formed, kind.comes, kind.comes + 0.5) + (k === 0 && sky.formed > 0.005 ? 3 : 0));
			let living = cells.filter((cell) => cell.on).length;
			for (const cell of cells) {
				if (!cell.on && sky && living < Math.min(wanted, kind.count)) {
					bornAt(cell, sky, deck);
					living++;
				}
				if (!cell.on) continue;
				const age = now - cell.born;
				if (age > cell.life) {
					cell.on = false;
					cell.slot.visible = false;
					cell.volume.opacity = 0;
					continue;
				}
				// Carried round by the wind and a little in; the turning's sense from the hemisphere.
				const turn = sky?.turn ?? -1;
				const wind = windAt(cell.r, sky?.eye ?? 2400) * alive;
				cell.phi += (turn * wind * delta) / cell.r;
				cell.r = Math.max(0.6 * (sky?.eye ?? 2400), cell.r - CYCLONE_INFLOW * wind * delta * (cell.kind === 0 ? 0.2 : 1));
				const cx = sky?.centre.x ?? 0;
				const cz = sky?.centre.y ?? 0;
				const x = cx + cell.r * Math.cos(cell.phi);
				const z = cz - cell.r * Math.sin(cell.phi);
				// Rising as a tower does: the top climbs over its first minute; and comes in and goes softly.
				const up = 0.12 + 0.88 * THREE.MathUtils.smoothstep(age, 0, cell.rise);
				cell.slot.position.set(x, plan.base * 0.8, z);
				cell.slot.scale.set(cell.size, up * (0.85 + 0.15 * cell.size), cell.size);
				const seen = THREE.MathUtils.smoothstep(age, 0, 25) * (1 - THREE.MathUtils.smoothstep(age, cell.life - 40, cell.life));
				// (Beyond what is seen it is let go.)
				const fromBoat = Math.hypot(x, z);
				cell.volume.opacity = seen * (1 - going) * (1 - THREE.MathUtils.smoothstep(fromBoat, 16000, 18500)) * hazeAt(Math.hypot(fromBoat, plan.base), plan.visibility);
				cell.volume.extinction = deck.extinction * Math.max(kind.width, kind.height);
				cell.volume.baseColor.setRGB(albedo, albedo, albedo);
				// How much of it is over the boat, for the rain (the band cells and towers).
				if (k > 0) overhead += cell.volume.opacity * up * Math.max(0, 1 - fromBoat / (0.55 * kind.width * cell.size));
			}
		});
		cycloneOverhead += (THREE.MathUtils.clamp(overhead, 0, 1) - cycloneOverhead) * Math.min(1, delta / 8);
	};
	const sunColour = new THREE.Color();
	const warm = new THREE.Color(1, 0.55, 0.3);
	const white = new THREE.Color(1, 0.98, 0.95);
	const daySky = new THREE.Color(0.55, 0.7, 1);
	const nightSky = new THREE.Color(0.25, 0.3, 0.45);
	const stormSky = new THREE.Color(0.5, 0.52, 0.55);
	// The colour of an overcast's light, from above: grey, a little cool.
	const overcastSky = new THREE.Color(0.74, 0.77, 0.81);
	const skyColour = new THREE.Color();

	return {
		on,
		group,
		// While the water draws its mirror the clouds are out of the way: the mirror has its own
		// camera, and the frame renderer would do all its work again for it.
		hide(hidden: boolean) {
			group.visible = !hidden;
		},
		// 0..1 how much of the sky the high veil, left to the sky shader, covers.
		veil: () => plan.highCover,
		plan: () => plan,
		light(l: CloudLight) {
			if (!on) return;
			// (In the console, __cloudTune = { sun, moon, hemisphere, sky: [r,g,b], ground: [r,g,b] } scales or sets these, to try.)
			const tune = (globalThis as unknown as { __cloudTune?: { sun?: number; moon?: number; hemisphere?: number; sky?: number[]; ground?: number[] } }).__cloudTune;
			const sunUp = THREE.MathUtils.smoothstep(l.sunElevation, -3, 12);
			sunColour.lerpColors(warm, white, THREE.MathUtils.smoothstep(l.sunElevation, -1, 18));
			sunLight.color.copy(sunColour);
			sunLight.intensity = SUN * sunUp * (1 - 0.7 * l.storm);
			sunLight.position.copy(l.sun).multiplyScalar(5000);
			moonLight.intensity = MOON * l.moonlight * (1 - l.daylight);
			moonLight.position.copy(l.moon).multiplyScalar(5000);
			// (The sky's light from above is the blue sky's where it is clear and the cloud's own grey where it is
			// covered: the deck above, the middle cloud and the high veil.)
			const overcast = clamp01(0.45 * plan.lowCover + 0.8 * plan.midCover + 0.4 * plan.highCover);
			skyColour.lerpColors(nightSky, daySky.clone().lerp(overcastSky, overcast), l.daylight).lerp(stormSky, l.storm * 0.8);
			hemisphere.color.copy(skyColour);
			// (Under a blue sky with the sun out the sky's light is a small part, and the sun models the clouds; under
			// an overcast it is all the light there is. Held high always, it lit fair-weather cumulus evenly grey.)
			hemisphere.intensity = lerp(HEMISPHERE_CLEAR, HEMISPHERE_OVERCAST, overcast) * lerp(0.012 + 0.05 * l.moonlight, 1, l.daylight) * lerp(1, 0.6, l.storm);
			if (tune) {
				sunLight.intensity *= tune.sun ?? 1;
				moonLight.intensity *= tune.moon ?? 1;
				hemisphere.intensity *= tune.hemisphere ?? 1;
				if (tune.sky) hemisphere.color.setRGB(tune.sky[0]!, tune.sky[1]!, tune.sky[2]!);
				if (tune.ground) hemisphere.groundColor.setRGB(tune.ground[0]!, tune.ground[1]!, tune.ground[2]!);
			}
		},
		update(delta: number, state: CloudState) {
			if (!on) return;
			now += delta;
			// The plan is read again every few seconds; a deck is built again only when what it is
			// made of changes, and comes in over the old one.
			// The cyclone: its deck made once it begins; once it has half formed it takes the low cloud's place.
			const sky = state.cyclone && state.cyclone.formed > 0.002 ? state.cyclone : undefined;
			cycloneFormed = sky?.formed ?? 0;
			if (sky && !cyclone && !cycloneBuilding) buildCyclone(plan, sky);
			updateCyclone(delta, sky, state.alive);
			const cycloneHolds = !!sky && sky.formed > 0.35;
			if (now - planAt > 4) {
				planAt = now;
				plan = cloudPlan(state.conditions, state.sky, state.fury);
				readFrom = state.conditions;
				for (const layer of ["low", "mid"] as Layer[]) {
					const key = layer === "low" && cycloneHolds ? "none" : layerKey(plan, layer);
					const current = decks.find((deck) => deck.layer === layer && deck.dying === Infinity);
					if ((current?.key ?? "none") !== key && !building.has(layer)) {
						if (key === "none") {
							if (current) current.dying = now;
						} else rebuild(layer, plan, key, now);
					}
				}
			}
			fade += (plan.fadeRadius - fade) * Math.min(1, delta * 0.05);
			frameRenderer.settings.fadeRadius = fade;
			for (const deck of [...decks]) {
				const coming = THREE.MathUtils.smoothstep(now - deck.born, 0, CROSSFADE);
				const going = deck.dying === Infinity ? 0 : THREE.MathUtils.smoothstep(now - deck.dying, 0, CROSSFADE);
				if (going >= 1) {
					disposeDeck(deck);
					continue;
				}
				// Greyness follows the plan without a rebuild.
				const wantedExtinction = extinctionFor(plan, deck.layer);
				deck.extinction += (wantedExtinction - deck.extinction) * Math.min(1, delta * 0.1);
				const albedo = albedoFor(plan);
				const step = deck.speed * delta * state.alive;
				for (const item of deck.items) {
					item.a += step;
					if (item.a > deck.half) item.a -= 2 * deck.half;
					item.slot.position.set(deck.along.x * item.a + deck.across.x * item.b, item.slot.position.y, deck.along.z * item.a + deck.across.z * item.b);
					// Gone before it reaches the field's edge, where it comes round again.
					const edge = (1 - THREE.MathUtils.smoothstep(Math.abs(item.a), deck.half * 0.8, deck.half * 0.98)) * (1 - THREE.MathUtils.smoothstep(Math.abs(item.b), deck.half * 0.8, deck.half * 0.98));
					const away = Math.hypot(item.slot.position.x - state.eye.x, item.slot.position.y - state.eye.y, item.slot.position.z - state.eye.z);
					item.volume.opacity = edge * coming * (1 - going) * hazeAt(away, plan.visibility);
					item.volume.extinction = deck.extinction * deck.longest;
					item.volume.baseColor.setRGB(albedo, albedo, albedo);
				}
			}
		},
		// 0..1 how much of the cyclone's band cloud is over the boat (for its rain).
		cycloneOverhead: () => cycloneOverhead,
		describe: () => [
			on ? "volumes on (?clouds=off for the sky shader's clouds alone)" : "off",
			...(cyclone ? [`cyclone: ${CYCLONE_CELLS.map((kind, k) => `${cyclone!.cells.filter((cell) => cell.kind === k && cell.on).length} of ${kind.count} ${["walls", "towers", "band cells"][k]}`).join(", ")} · formed ${Math.round(cycloneFormed * 100)}% · over the boat ${Math.round(cycloneOverhead * 100)}%${cyclone.dying < Infinity ? " · going" : ""}`] : []),
			plan.words,
			readFrom
				? `from: air ${readFrom.airTemperature.toFixed(1)} °C at ${Math.round(readFrom.humidity)}%, at 760 m ${readFrom.airLowTemperature?.toFixed(1) ?? "?"} °C at ${readFrom.moistLow ?? "?"}%, ${readFrom.pressure.toFixed(0)} hPa, mixed layer ${readFrom.mixedDepth ?? "?"} m, rain ${readFrom.precipitation} mm, condensation level ${Math.round(condensationLevel(readFrom))} m`
				: "from: the dial (no figures)",
			...decks.map((deck) => `${deck.layer}: ${deck.items.length} volumes · ${deck.key}${deck.dying < Infinity ? " · going" : ""}`),
			...(["low", "mid"] as Layer[]).map((layer) => (cover[layer] ? `${layer} cover seen from above ${Math.round(cover[layer].seen * 100)}%, forecast ${Math.round(cover[layer].wanted * 100)}%` : "")).filter(Boolean),
		],
		dispose() {
			disposed = true;
			for (const deck of [...decks]) disposeDeck(deck);
			if (cyclone) {
				for (const cell of cyclone.cells) cell.volume.dispose();
				for (const source of cyclone.sources) source.dispose();
			}
			worker?.terminate();
			scene.remove(group, sunLight, sunLight.target, moonLight, moonLight.target, hemisphere);
			if (on) frameRenderer.dispose?.();
		},
	};
}

export type Clouds = ReturnType<typeof createClouds>;
