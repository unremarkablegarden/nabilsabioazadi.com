// Where cloud forms over the boat: the lifting condensation level of the air the sea's turbulence
// mixes, from the figures for the boat's place (manawatawhi.ts). Kept from the clouds as volumes
// (clouds.ts, 10 to 14 November, taken out on 14 November when that day's build broke browsers; it is
// in commit 73ba99a), for the cyclone's rope, which runs up into the cloud at this height.
import * as THREE from "three";
import type { SeaConditions } from "./manawatawhi";

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
