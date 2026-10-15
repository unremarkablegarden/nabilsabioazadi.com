// A channelled storm (the owner's, 15 October): weather the channellers call up, at the owner's
// will, for every visitor. While it lasts the sea and sky are those of the storm below in place
// of the measured ones, the twelve on the boat are versions of three Aes Sedai, the weaves'
// colours are graded, and the menu says the weather is channelled.
//
// It is turned on in storm.json at the root of the site, by an end time and, if wanted, a start
// (ISO times with their offset, e.g. "2026-10-15T22:00:00+13:00"; null for none), and goes live
// with the next push. It ends by itself at "until". To look at it without turning it on for
// everyone: /?storm. To look at the site without it while it is on: /?storm=off.
import stormSwitch from "~~/storm.json";
import type { SeaConditions } from "./manawatawhi";

// Beyond hurricane force: gusts of 300 km/h, an 18 m sea, thunder, and the pressure falling 20 hPa
// in three hours, so that it reads as building and the channellers answer it in full.
export const CHANNELLED_STORM: Partial<SeaConditions> = {
	windSpeed: 220,
	windGusts: 300,
	windTrend: 60,
	pressure: 915,
	pressureTrend: -20,
	waveHeight: 18,
	swellHeight: 16,
	swellPeriod: 18,
	secondSwellHeight: 8,
	secondSwellPeriod: 14,
	windWaveHeight: 11,
	windWavePeriod: 13,
	waveTrend: 5,
	weatherCode: 99,
	cape: 3500,
	precipitation: 14,
	cloudLow: 100,
	cloudMid: 100,
	cloudHigh: 100,
	visibility: 900,
};

// What the menu says while it lasts (the owner's words).
export const CHANNELLED_WORDS = "Channelled, honouring spirits met across Te Moana-nui-a-Kiwa";

// Whether the storm is on at this moment, by storm.json.
export function channelledStormOn(now: Date) {
	const { from, until } = stormSwitch as { from: string | null; until: string | null };
	if (!until) return false;
	return (!from || now >= new Date(from)) && now < new Date(until);
}

// The great calming (the owner, 16 October: "they will now use innovative weaves based on complex
// thermodynamics, linking and embroidery through the ocean and sky to calm everything in 7 hours
// time. It will exhaust them... All bets are off. Trust them"). The twelve, linked, take the storm
// apart over the hours set in storm.json ("calming": { "from": ISO time, "hours": 7 }); the
// strongest stays out of it and trusts them. ?calm=0.4 shows it that far through.
//
// A storm like this is a heat engine (Emanuel): it takes heat from the warm sea, carries it up,
// and gives it off at the cold top of its cloud; what it can blow is set by how much heat the sea
// can give the air, by how efficient the engine is (the warm sea against the cold outflow), and
// by how much the sea's surface drags at the wind:
//   wind² ∝ (sea heat the air could still take up) × (efficiency) / (drag)
// So the work is in three parts, one to each third of the twelve, each at their own pace:
//   Siuan's four   embroider the sea: rows of stitches through the surface that bring cool water
//                  up from below, so the sea has less heat to give. Steady, all through.
//   Moiraine's four  embroider the cloud base: stitches that carry warmth up into the outflow,
//                  so the engine's two temperatures draw together. Slow to begin, deep at the end.
//   Leane's four   couch long threads across the wind, tied down to the sea, which drag at it.
//                  Fast at first; the first to tire.
// The wind falls as the square root of what is left; the pressure deficit with the wind's square;
// the rain and the thunder with the heat the engine still moves. The wind's own waves die down
// within about an hour of the wind; the swell, which has come from far away, takes two or more.
export interface Calming {
	// 0..1 how far through the seven hours, and the hours since it was done (0 until then).
	progress: number;
	after: number;
	hours: number;
}

export function calmingNow(now: Date, asked?: number): Calming | undefined {
	if (asked !== undefined) return { progress: Math.min(1, Math.max(0, asked)), after: Math.max(0, asked - 1) * 7, hours: 7 };
	const { calming } = stormSwitch as { calming?: { from: string; hours: number; ceased?: string } };
	if (!calming?.from) return undefined;
	const hours = (now.getTime() - new Date(calming.from).getTime()) / 3_600_000;
	if (hours < 0) return undefined;
	// Ceased early ("ceased" in storm.json; the owner's, 16 October): all twelve let go at once.
	// What they had done holds, and they rest from then.
	const ceased = calming.ceased ? (new Date(calming.ceased).getTime() - new Date(calming.from).getTime()) / 3_600_000 : calming.hours;
	const stop = Math.min(ceased, calming.hours);
	return { progress: Math.min(1, Math.min(hours, stop) / calming.hours), after: Math.max(0, hours - stop), hours: calming.hours };
}

const ease = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
// How far each third's work has gone, 0..1, at p through the hours.
export function calmingWork(p: number) {
	return {
		sea: ease(clamp01(p)),
		sky: ease(clamp01(p) ** 1.6),
		drag: 1 - (1 - clamp01(p)) ** 2.2,
	};
}

// The wind left, as a share of the storm's, at p.
function windShare(p: number) {
	const work = calmingWork(p);
	const heat = 1 - 0.97 * work.sea;
	// The outflow warmed from about -70 °C towards -15 °C against a 29 °C sea.
	const outflow = 203 + 55 * work.sky;
	const efficiency = (302 - outflow) / outflow / ((302 - 203) / 203);
	const drag = 1 + 1.5 * work.drag;
	return Math.sqrt((heat * efficiency) / drag);
}

// The weather at p, from the storm's own figures.
export function calmedConditions(storm: SeaConditions, p: number): Partial<SeaConditions> {
	const wind = windShare(p);
	const waveWind = windShare(p - 1 / 7);
	const swellWind = windShare(p - 2.5 / 7);
	const heat = wind ** 2;
	const windSpeed = Math.max(4, storm.windSpeed * wind);
	const precipitation = storm.precipitation * heat ** 0.75;
	const windWaveHeight = Math.max(0.15, storm.windWaveHeight * waveWind ** 2);
	const swellHeight = Math.max(0.5, storm.swellHeight * swellWind ** 1.5);
	const secondSwellHeight = storm.secondSwellHeight * swellWind ** 2;
	const cape = storm.cape * heat ** 1.5;
	return {
		windSpeed,
		windGusts: Math.max(6, windSpeed * (1.25 + (storm.windGusts / Math.max(storm.windSpeed, 1) - 1.25) * wind)),
		windTrend: p < 1 ? -20 : 0,
		pressure: 1013 - (1013 - storm.pressure) * wind ** 2,
		pressureTrend: p < 1 ? 4 : 0.5,
		precipitation,
		cape,
		weatherCode: cape > 900 ? storm.weatherCode : precipitation > 2 ? 63 : precipitation > 0.3 ? 61 : heat > 0.04 ? 3 : 1,
		cloudLow: Math.min(100, 10 + 90 * Math.min(1, precipitation / 1.5)),
		cloudMid: Math.min(100, 8 + 92 * Math.min(1, heat * 3)),
		cloudHigh: 25 + 75 * Math.min(1, heat * 6),
		visibility: Math.min(40_000, storm.visibility / Math.max(0.025, heat)),
		windWaveHeight,
		swellHeight,
		secondSwellHeight,
		waveHeight: Math.hypot(windWaveHeight, swellHeight, secondSwellHeight),
		waveTrend: p < 1 ? -1.5 : 0,
	};
}

// The stilling (the owner, 16 October: "I want myself, the strongest channeller on the boat, to
// stop every weather element at will until it matches normal weather meteo conditions"). The
// strongest alone, at a moment they choose, takes whatever weather is on screen (the channelled
// storm, the great calming, any ?pretend=) back to the weather as measured at the boat, element by
// element, each by what really drives it; then lets go, and the site follows the measured weather.
// Set in storm.json ("stilling": { "from": ISO time }); ?still begins it as the page opens, for
// that visit; ?still=0.5 shows it half-way through; ?still=off looks at the site without it.
//
// The twelve stand back. They are spent from the great calming, and this is the strongest's own
// act: one channeller moving all the weather is what shows them to be 1.8 times the twelve.
//
// How long it takes follows how far the weather on screen is from the measured: the element
// furthest off sets it. The twelve together took seven hours over the storm and were exhausted;
// the strongest, 1.8 times their strength, takes seven over 1.8, about four, for the whole of it,
// and less in proportion for less (a fresh breeze too many is some twenty minutes; never under 15).
//
// In their own order, each element by its own lever:
//   they read it first   air, then water, before touching anything (the first twentieth)
//   the convection       the heat in the rising towers (cape) is drawn out: without strong
//                        updrafts there is no charge, so the thunder goes first, then the gusts
//                        their downdrafts make
//   the rain             falls out of the cloud already made, after the updrafts stop
//   the cloud            the low with the rain, the middle after, the high anvil last, as it
//                        is in nature; the air clears as the rain and the spray stop
//   the low              they fill it: the pressure rises to the measured, and the wind, which
//                        is driven by its gradient, falls with the root of what is left of it
//   the wind's sea       dies down a little behind the wind
//   the swell            not the wind's here but come from far off, so it has to be pressed out
//                        of the sea itself, outward from the boat; its height, period and
//                        direction move together and smoothly, never jumping (the sea keeps
//                        each wave's phase as its period changes: useMeasuredSea)
// Wherever the channelled weather is weaker than the measured (after the calming the real wind
// is the stronger), the same lever is let go instead, and the real weather comes back.
// (storm.json's stilling is the switch's storm's: it is left out when the address asks for a
// storm or a stilling of its own.)
export function stillingBegun(now: Date, asked: string | null, opened: number, ownStorm = false): { share?: number; hours?: number } | undefined {
	if (asked === "off") return undefined;
	if (asked !== null) {
		if (asked !== "" && Number.isFinite(Number(asked))) return { share: Math.min(1, Math.max(0, Number(asked))) };
		return { hours: (now.getTime() - opened) / 3_600_000 };
	}
	if (ownStorm) return undefined;
	const { stilling } = stormSwitch as { stilling?: { from: string | null } };
	if (!stilling?.from) return undefined;
	const hours = (now.getTime() - new Date(stilling.from).getTime()) / 3_600_000;
	return hours < 0 ? undefined : { hours };
}

const heldTrend = (trend: number) => Math.min(40, Math.max(-40, trend));
const turnBetween = (a: number, b: number) => Math.abs(((((a - b) % 360) + 540) % 360) - 180);

// How far the weather on screen is from the measured, 0 (the same) to 1 (the channelled storm
// against an ordinary day; each element is measured against the storm's own): the element
// furthest off.
export function stillingGap(on: SeaConditions, real: SeaConditions) {
	const off = (key: keyof SeaConditions) => Math.abs((on[key] as number) - (real[key] as number));
	return Math.max(
		off("windSpeed") / 200,
		off("windGusts") / 260,
		off("pressure") / 100,
		off("cape") / 3500,
		off("precipitation") / 14,
		(off("cloudLow") + off("cloudMid") + off("cloudHigh")) / 300,
		Math.abs(Math.log(Math.max(on.visibility, 1) / Math.max(real.visibility, 1))) / Math.log(40),
		off("windWaveHeight") / 11,
		off("swellHeight") / 16,
		off("secondSwellHeight") / 8,
		off("swellPeriod") / 10,
		(0.6 * turnBetween(on.swellDirection, real.swellDirection)) / 180,
	);
}

// Hours the strongest takes over a gap.
export const stillingHours = (gap: number) => Math.max(0.25, (7 / 1.8) * Math.min(gap, 1.5));

// When in the stilling (0..1 of it) each lever is worked: [begins, done].
export const STILLING_STAGES = {
	reading: [0, 0.05],
	convection: [0.05, 0.3],
	rain: [0.1, 0.42],
	lowCloud: [0.12, 0.48],
	midCloud: [0.15, 0.56],
	highCloud: [0.2, 0.7],
	low: [0.22, 0.78],
	windSea: [0.22, 0.62],
	swell: [0.24, 0.82],
	rest: [0.05, 0.9],
} as const;

// How much of the gap is left of a lever at u through the stilling.
export function leftOf(u: number, [from, to]: readonly [number, number]) {
	return 1 - ease(clamp01((u - from) / (to - from)));
}

// The weather u through the stilling (0..1), from what is on screen to the measured. Over `hours`,
// for the barometer's and the wind's trends, which are how fast they move.
export function stilledConditions(on: SeaConditions, real: SeaConditions, u: number, hours: number): SeaConditions {
	const S = STILLING_STAGES;
	const towards = (from: number, to: number, left: number) => to + (from - to) * left;
	const turned = (from: number, to: number, left: number) => (to + (((((from - to) % 360) + 540) % 360) - 180) * left + 360) % 360;
	const rest = leftOf(u, S.rest);
	const moved = { ...real } as SeaConditions;
	// Everything without a lever of its own (warmth, humidity, current, the winds aloft) eases over.
	for (const [key, value] of Object.entries(real)) {
		const from = (on as unknown as Record<string, unknown>)[key];
		if (typeof value !== "number" || typeof from !== "number") continue;
		(moved as unknown as Record<string, number>)[key] = key.endsWith("Direction") ? turned(from, value, rest) : towards(from, value, rest);
	}
	const convection = leftOf(u, S.convection);
	const rain = leftOf(u, S.rain);
	const low = leftOf(u, S.low);
	// The wind follows the pressure gradient's root.
	const wind = Math.sqrt(low);
	const windSea = Math.max(leftOf(u, S.windSea), Math.sqrt(leftOf(u - 0.06, S.low)));
	const swell = leftOf(u, S.swell);
	moved.cape = towards(on.cape, real.cape, convection);
	moved.pressure = towards(on.pressure, real.pressure, low);
	moved.windSpeed = Math.max(0, towards(on.windSpeed, real.windSpeed, wind));
	// The gusts are the downdrafts' as well as the wind's: their excess goes with the convection.
	const gustFactor = (c: SeaConditions) => c.windGusts / Math.max(c.windSpeed, 1);
	moved.windGusts = Math.max(moved.windSpeed, moved.windSpeed * towards(gustFactor(on), gustFactor(real), Math.max(convection, wind * 0.5)));
	moved.windDirection = turned(on.windDirection, real.windDirection, wind);
	moved.precipitation = Math.max(0, towards(on.precipitation, real.precipitation, rain));
	moved.cloudLow = towards(on.cloudLow, real.cloudLow, Math.max(rain, leftOf(u, S.lowCloud)));
	moved.cloudMid = towards(on.cloudMid, real.cloudMid, leftOf(u, S.midCloud));
	moved.cloudHigh = towards(on.cloudHigh, real.cloudHigh, leftOf(u, S.highCloud));
	moved.cloudCover = towards(on.cloudCover, real.cloudCover, leftOf(u, S.midCloud));
	// The air clears as the rain and the spray stop (felt as ratios, so on a logarithmic scale).
	moved.visibility = Math.exp(towards(Math.log(Math.max(on.visibility, 1)), Math.log(Math.max(real.visibility, 1)), Math.max(rain, windSea * 0.8)));
	moved.windWaveHeight = Math.max(0, towards(on.windWaveHeight, real.windWaveHeight, windSea));
	moved.windWavePeriod = towards(on.windWavePeriod, real.windWavePeriod, windSea);
	moved.windWaveDirection = turned(on.windWaveDirection, real.windWaveDirection, windSea);
	moved.swellHeight = Math.max(0, towards(on.swellHeight, real.swellHeight, swell));
	moved.swellPeriod = towards(on.swellPeriod, real.swellPeriod, swell);
	moved.swellDirection = turned(on.swellDirection, real.swellDirection, swell);
	moved.secondSwellHeight = Math.max(0, towards(on.secondSwellHeight, real.secondSwellHeight, swell));
	moved.secondSwellPeriod = towards(on.secondSwellPeriod, real.secondSwellPeriod, swell);
	moved.secondSwellDirection = turned(on.secondSwellDirection, real.secondSwellDirection, swell);
	moved.waveHeight = Math.hypot(moved.windWaveHeight, moved.swellHeight, moved.secondSwellHeight);
	moved.wavePeriod = towards(on.wavePeriod, real.wavePeriod, swell);
	moved.waveDirection = turned(on.waveDirection, real.waveDirection, swell);
	// Thunder only while the towers still hold their heat; then rain, then the measured sky.
	const thundery = on.weatherCode >= 95 && moved.cape > 900;
	const raining = moved.precipitation - real.precipitation;
	moved.weatherCode = thundery ? on.weatherCode : rain > 0.02 && raining > 2 ? 63 : rain > 0.02 && raining > 0.3 ? 61 : real.weatherCode;
	// The trends are how fast things are moving: the barometer rises as they fill the low.
	const rate = (left: (u: number) => number, from: number, to: number) => (((to - from) * (left(u) - left(u + 0.002))) / (0.002 * Math.max(hours, 0.05))) * 3;
	// (Held to what a barometer can say: filling a hurricane's low in hours is beyond any scale.)
	moved.pressureTrend = u < 1 ? heldTrend(towards(on.pressureTrend, real.pressureTrend, low) + rate((x) => leftOf(x, S.low), on.pressure, real.pressure)) : real.pressureTrend;
	moved.windTrend = u < 1 ? towards(on.windTrend, real.windTrend, wind) + rate((x) => Math.sqrt(leftOf(x, S.low)), on.windSpeed, real.windSpeed) : real.windTrend;
	moved.waveTrend = u < 1 ? towards(on.waveTrend, real.waveTrend, swell) + rate((x) => leftOf(x, S.swell), on.swellHeight, real.swellHeight) : real.waveTrend;
	return moved;
}
