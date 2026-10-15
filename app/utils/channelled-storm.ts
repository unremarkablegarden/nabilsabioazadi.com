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
