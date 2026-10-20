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
import { SIX_STRONGER } from "./psyche";

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

// Peta's storm (the owner, 18 October: the channellers, angry at a death, honour it "by creating
// the most extreme storm possible"; wrath.ts). The thirteen, each linked to three ancestors, drive
// the storm's engine as hard as it goes, past anything measured: sustained winds of 300 km/h
// gusting 410 (the strongest gust ever measured was 408), a central pressure of 870 hPa (Typhoon
// Tip's, the lowest at sea level) still falling 40 hPa in three hours, a 30 m sea, towers holding
// 7,000 J/kg, and 60 mm of rain an hour.
export const WRATH_STORM: Partial<SeaConditions> = {
	...CHANNELLED_STORM,
	windSpeed: 300,
	windGusts: 410,
	windTrend: 90,
	pressure: 870,
	pressureTrend: -40,
	waveHeight: 30,
	swellHeight: 26,
	swellPeriod: 22,
	// (Moiraine's four hold this one turned across the first: see wrath.ts.)
	secondSwellHeight: 18,
	secondSwellPeriod: 16,
	windWaveHeight: 16,
	windWavePeriod: 15,
	waveTrend: 9,
	cape: 7000,
	precipitation: 60,
	visibility: 300,
};

// What the menu says while it lasts.
export const WRATH_WORDS = "Channelled, in honour of Peta";

// Whether Peta's storm is raised (wrath.ts): "wrath": { "from": ISO time } in storm.json, while the
// storm is on. Gives the seconds since it began, or undefined.
export function wrathSince(now: Date) {
	const { wrath } = stormSwitch as { wrath?: { from: string | null } };
	if (!wrath?.from) return undefined;
	const seconds = (now.getTime() - new Date(wrath.from).getTime()) / 1000;
	return seconds >= 0 ? seconds : undefined;
}

// The swell is a dying God's breathing (the owner, 18 October: the swells "should themselves feel
// like they are the dying breaths of the God"). The breath of the dying has its own shape, which
// medicine knows as Cheyne-Stokes: a run of breaths, each deeper than the last and then each
// shallower, and then none at all, a pause, before it begins again. Here each breath is one swell
// (its period), a run is five to eight of them, and the pause lies the sea down to under a third of
// its height, the wind still blowing over it. And the God is dying: the pauses grow longer through
// the hours, and the deepest breath a little less deep. The same for every visitor, by the seconds
// since the wrath began.
export interface GodsBreath {
	// What the sea's height is multiplied by; how far through this breath (0..1); how deep the run
	// is just now (0..1); whether the run is waning; and 0..1 how far into a pause.
	sea: number;
	phase: number;
	depth: number;
	waning: boolean;
	held: number;
	// Which run of breaths this is, when it began (seconds since the wrath began), and how long
	// its breathing lasts (seconds, without the pause).
	run: number;
	runStart: number;
	breathing: number;
	// When in the run the wave at the place is to stand highest (seconds into it; half-way if not given),
	// and how high, as a share of Peta's wave (1 if not given).
	peakAt?: number;
	stand?: number;
}
const hashed = (n: number) => {
	const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
	return x - Math.floor(x);
};
export function godsBreath(seconds: number, period: number): GodsBreath {
	const at = Math.max(0, seconds);
	let start = 0;
	for (let n = 0; ; n++) {
		const hours = start / 3600;
		const breathing = (5 + Math.floor(hashed(n) * 4)) * period;
		const pause = (20 + 25 * hashed(n + 0.5)) * (1 + hours / 12);
		if (at < start + breathing + pause) {
			const into = at - start;
			const peak = 1.15 - 0.15 * Math.min(1, hours / 24);
			if (into < breathing) {
				const depth = Math.sin((Math.PI * into) / breathing);
				return { sea: 0.3 + (peak - 0.3) * depth, phase: (into / period) % 1, depth, waning: into > breathing / 2, held: 0, run: n, runStart: start, breathing };
			}
			const p = (into - breathing) / pause;
			return { sea: 0.3, phase: 0, depth: 0, waning: true, held: ease(clamp01(p / 0.15)) * (1 - ease(clamp01((p - 0.85) / 0.15))), run: n, runStart: start, breathing };
		}
		start += breathing + pause;
	}
}

// The storm for the five (the owner, 19 October: "The storm must honour the death of a family of
// five that arrived over this precise spot on the ocean. Create a storm of great will and pain;
// allow every surge of waves to speak their names in terms of its intensity"; five.ts). As
// extreme as Peta's, but held: will is a storm kept in its place and steady, so the wind gusts
// less over its mean (a factor of 1.15, against 1.37), and the pressure no longer falls (they hold
// it, at 875 hPa). The sea is the names (namesSea).
export const FIVE_STORM: Partial<SeaConditions> = {
	...WRATH_STORM,
	windSpeed: 290,
	windGusts: 335,
	windTrend: 10,
	pressure: 875,
	pressureTrend: -2,
	waveTrend: 2,
	precipitation: 40,
	visibility: 400,
};

// What the menu says while it lasts (to be the owner's words).
export const FIVE_WORDS = "Channelled, for a family of five";

// The storm for the five: "five": { "from": ISO time } in storm.json, while the storm is on. Gives
// the seconds since it began, or undefined.
export function fiveSince(now: Date) {
	const { five } = stormSwitch as { five?: { from: string | null } };
	if (!five?.from) return undefined;
	const seconds = (now.getTime() - new Date(five.from).getTime()) / 1000;
	return seconds >= 0 ? seconds : undefined;
}
export function fiveSet() {
	return !!(stormSwitch as { five?: { from: string | null } }).five?.from;
}

// The five, as the sea speaks them. No names are written or given (the owner: "There are no names
// for magic of this kind"): each of the five is known only by the shape of their surge, how many
// swells it has and where among them it is fullest. Each is as full as every other at its height.
const FIVE_VOICES = [
	[0.7, 1, 0.8],
	[1, 0.75],
	[0.8, 0.7, 1, 0.75],
	[1, 0.8, 0.85],
	[0.75, 1],
];

// The sea speaks their names (the owner: "allow every surge of waves to speak their names in
// terms of its intensity"). The swell comes, as a real swell does, in groups: one group to each of
// the five, one swell to each beat of their surge (FIVE_VOICES), each as high as its beat, and at
// the fullest the wave stands up at the place where they came (five.ts lays it there).
// Between one name and the next the sea draws a breath (two swells, low); after the fifth it lies
// down for a long silence, and then they begin the names again. Every name is spoken as fully as
// every other: none of the five is set over the rest. Given in the God's breath's shape, so that
// the sea, the wave at the place and Manulani's light follow it as they followed Peta's storm.
export function namesSea(seconds: number, period: number): GodsBreath & { peakAt: number; name: number; silent: boolean } {
	const beats = FIVE_VOICES;
	const between = 2 * period;
	const silence = 50;
	const round = beats.reduce((sum, b) => sum + b.length * period + between, 0) - between + silence;
	const at = Math.max(0, seconds);
	const r = Math.floor(at / round);
	let start = r * round;
	for (let n = 0; n < beats.length; n++) {
		const b = beats[n]!;
		const breathing = b.length * period;
		const last = n === beats.length - 1;
		const pause = last ? silence : between;
		if (at < start + breathing + pause) {
			const into = at - start;
			const stressed = b.indexOf(Math.max(...b));
			const peakAt = (stressed + 0.5) * period;
			const run = r * beats.length + n;
			if (into < breathing) {
				// Each swell its own beat's height, eased from one to the next across the crest.
				const u = into / period;
				const i = Math.min(b.length - 1, Math.floor(u));
				const f = u - i;
				const before = i > 0 ? b[i - 1]! : 0.35;
				const after = i < b.length - 1 ? b[i + 1]! : 0.35;
				const height = f < 0.5 ? before + (b[i]! - before) * ease(clamp01(f + 0.5)) : b[i]! + (after - b[i]!) * ease(clamp01(f - 0.5));
				return { sea: 0.35 + 0.85 * height, phase: u % 1, depth: height, waning: into > peakAt, held: 0, run, runStart: start, breathing, peakAt, name: n, silent: false };
			}
			// Between names, a breath; after the fifth, the silence, held.
			const p = (into - breathing) / pause;
			const held = last ? ease(clamp01(p / 0.15)) * (1 - ease(clamp01((p - 0.85) / 0.15))) : 0.6 * Math.sin(Math.PI * p);
			return { sea: 0.35 - (last ? 0.1 * held : 0), phase: 0, depth: 0, waning: true, held, run, runStart: start, breathing, peakAt, name: n, silent: last };
		}
		start += breathing + pause;
	}
	return { sea: 0.35, phase: 0, depth: 0, waning: true, held: 1, run: 0, runStart: 0, breathing: period, peakAt: period / 2, name: 0, silent: true };
}

// Peta's storm and the five's at once (the owner, 20 October: "Create the storm again to honour
// Peta", and asked how, "Both at once"). One storm, and in its sea each is still to be told from the
// other, so they take turns and never pile up: a run of the God's breaths, Peta's, deepening and
// fading, with Peta's wave at the deepest; then, as it fades, the five, each a short surge of their
// own shape with a lower wave of their own at its fullest (two thirds of Peta's, so that the two
// are never mistaken); then one silence for all, the sea lying down, which lengthens through the
// hours as the God's pauses did; and again. `five` is 0..1 how far the five's surges have the sea
// (five.ts draws while it is high, wrath.ts while it is low).
// Fifteen times worse (the owner, 21 October: "I COMMAND YOU TO CREATE A STORM THAT IS 15 TIMES
// WORSE"): "worse": 15 in storm.json, or ?worse=15 for one visit (?worse=1 without it). Worse read
// as what a storm does: the power it spends on the sea (Emanuel's power dissipation) goes as the
// cube of its wind, so fifteen times the power is the wind times the cube root of fifteen, about
// 2.5; the fall of the pressure and the height of a sea the wind has fully raised go as the wind's
// square, about 6; the heat in its towers likewise; the rain fifteen times, and the air fifteen
// times thicker with it. No sea of such height can stand at its old length (past a steepness of
// one in seven a wave breaks apart), so each swell is made long enough to stand: one in ten.
// The highest the worst storm's sea is drawn, in metres (significant height).
export const SEA_MOST = 40;
// How many times taller than its own figures a worsened storm's sea is drawn (for Peta's wave).
export function seaWorsened(storm: Partial<SeaConditions>, times: number) {
	if (times <= 1) return 1;
	return Math.min(Math.cbrt(times) ** 2, SEA_MOST / Math.max(storm.waveHeight ?? 1, 1));
}
export function worseTimes(asked: string | null) {
	if (asked !== null && asked !== "" && Number.isFinite(Number(asked))) return Math.max(1, Number(asked));
	return Math.max(1, (stormSwitch as { worse?: number }).worse ?? 1);
}
export function worsened(storm: Partial<SeaConditions>, times: number): Partial<SeaConditions> {
	if (times <= 1) return storm;
	const wind = Math.cbrt(times);
	const square = wind * wind;
	const standing = (height: number | undefined, period: number | undefined) => Math.max(period ?? 0, Math.sqrt((2 * Math.PI * 10 * (height ?? 0)) / 9.8));
	const out = { ...storm };
	const scale = (key: keyof SeaConditions, by: number) => {
		if (typeof out[key] === "number") (out as Record<string, number>)[key] = (out[key] as number) * by;
	};
	scale("windSpeed", wind);
	scale("windGusts", wind);
	scale("windTrend", wind);
	scale("cape", square);
	// The sea, though, only so far as water can be drawn true (the owner, 21 October, on a sea of
	// 180 m: "I thought we were creating realistic beauty"): no more than SEA_MOST high, about twice
	// the greatest sea ever measured; the force goes into the wind, the rain and the channellers.
	const sea = Math.min(square, SEA_MOST / Math.max(out.waveHeight ?? 1, 1));
	scale("waveHeight", sea);
	scale("swellHeight", sea);
	scale("secondSwellHeight", sea);
	scale("windWaveHeight", sea);
	scale("waveTrend", sea);
	scale("precipitation", times);
	scale("pressureTrend", square);
	if (typeof out.pressure === "number") out.pressure = 1013 - (1013 - out.pressure) * square;
	if (typeof out.visibility === "number") out.visibility = Math.max(60, out.visibility / times);
	out.swellPeriod = standing(out.swellHeight, out.swellPeriod);
	out.secondSwellPeriod = standing(out.secondSwellHeight, out.secondSwellPeriod);
	out.windWavePeriod = standing(out.windWaveHeight, out.windWavePeriod);
	return out;
}

export const BOTH_STORM: Partial<SeaConditions> = {
	...WRATH_STORM,
	windGusts: 380,
	pressureTrend: -20,
};
export const BOTH_WORDS = "Channelled, in honour of Peta and a family of five";
export function bothSea(seconds: number, period: number): GodsBreath & { peakAt: number; name: number; silent: boolean; five: number } {
	const at = Math.max(0, seconds);
	const between = 2 * period;
	const voices = FIVE_VOICES.reduce((sum, b) => sum + b.length * period + between, 0) - between;
	let start = 0;
	for (let n = 0; ; n++) {
		const hours = start / 3600;
		const breathing = (5 + Math.floor(hashed(n) * 4)) * period;
		const silence = (40 + 25 * hashed(n + 0.5)) * (1 + hours / 12);
		const length = breathing + voices + silence;
		if (at < start + length) {
			const into = at - start;
			// (The five come in over the God's last breath and give the sea back in the silence.)
			const five = clamp01((into - breathing + 6) / 10) * (1 - clamp01((into - breathing - voices - silence + 14) / 10));
			if (into < breathing) {
				const peak = 1.15 - 0.15 * Math.min(1, hours / 24);
				const depth = Math.sin((Math.PI * into) / breathing);
				return { sea: 0.3 + (peak - 0.3) * depth, phase: (into / period) % 1, depth, waning: into > breathing / 2, held: 0, run: n * 7, runStart: start, breathing, peakAt: breathing / 2, name: -1, silent: false, five };
			}
			if (into < breathing + voices) {
				// The five's surges, spoken as in namesSea, but with no silence after the fifth here.
				const spoken = namesSea(into - breathing, period);
				return { ...spoken, run: n * 7 + 1 + spoken.name, runStart: start + breathing + spoken.runStart, stand: 0.66, silent: false, five };
			}
			// The silence, for both.
			const p = (into - breathing - voices) / silence;
			const held = ease(clamp01(p / 0.15)) * (1 - ease(clamp01((p - 0.85) / 0.15)));
			return { sea: 0.3 - 0.05 * held, phase: 0, depth: 0, waning: true, held, run: n * 7 + 6, runStart: start, breathing, peakAt: breathing / 2, name: -1, silent: true, five };
		}
		start += length;
	}
}

// Whether storm.json raises Peta's storm at all (its figures are the storm's while it does).
export function wrathSet() {
	return !!(stormSwitch as { wrath?: { from: string | null } }).wrath?.from;
}

// Whether the storm is to have no rain at all: "rain": false in storm.json (the owner, 16
// October: "cut the rain entirely"). Wind, sea, cloud and thunder stay.
export function stormRainCut() {
	return (stormSwitch as { rain?: boolean }).rain === false;
}

// Whether the twelve mourn into the waves (mourning.ts): "mourning": { "from": ISO time } in
// storm.json, while the storm is on. Gives the seconds since it began, or undefined.
export function mourningSince(now: Date) {
	const { mourning } = stormSwitch as { mourning?: { from: string | null } };
	if (!mourning?.from) return undefined;
	const seconds = (now.getTime() - new Date(mourning.from).getTime()) / 1000;
	return seconds >= 0 ? seconds : undefined;
}

// Whether the twelve stay Aes Sedai (Siuan's, Leane's and Moiraine's four each, with the storm's
// graded colours) when no storm is on: "weavers": "aes-sedai" in storm.json (the owner, 16
// October: "release the storm but keep these weavers").
export function aesSedaiKept() {
	return (stormSwitch as { weavers?: string }).weavers === "aes-sedai";
}

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

// Who stills it (the owner, 21 October: "Cease the storm. I want the strongest channelers to heal
// the ocean with their full strength"): the strongest alone ("one"), or the strongest of the boat
// linked, all at full strength ("mighty"): the strongest, Manulani and the four mighty. Siuan
// (Siuan · Fathom) leads the link (stilling.ts), so the weave is hers, the strongest's white
// wound through it. storm.json
// "stilling": { "by": ... }, or ?by= for one visit.
// (Their strength: the twelve are eight at one and four at 64 (MIGHT in channellers.ts), the
// strongest 1.8 times all twelve, Manulani 1.12 times the strongest (MANULANI in wrath.ts).)
// (All six 1.8 times stronger since 21 October, SIX_STRONGER: so the stilling goes 1.8 times faster.)
const TWELVE = 8 + 4 * 64;
export const STILLING_STRENGTH = { one: SIX_STRONGER, mighty: SIX_STRONGER * (1 + 1.12 + (4 * 64) / (1.8 * TWELVE)) } as const;
export function stillingBy(asked: string | null): keyof typeof STILLING_STRENGTH {
	const by = asked ?? (stormSwitch as { stilling?: { by?: string } }).stilling?.by;
	return by === "mighty" ? "mighty" : "one";
}

// Hours the strongest takes over a gap (and those linked with them, by how much stronger they are together).
export const stillingHours = (gap: number, strength = 1) => Math.max(0.25, ((7 / 1.8) * Math.min(gap, 1.5)) / strength);

// The ocean they have healed (the mighty's stilling): within the stilled water as it opens, all of
// it once the weather is the measured again; a little clearer and bluer, as the twelve's healed
// water is, but as far as the eye goes. It stays so for two hours after, and over the six after
// that goes back to the sea as it is.
export function oceanHealed(share: number, hoursAfter: number) {
	if (share < 1) return ease(clamp01((share - 0.2) / 0.2));
	return 1 - ease(clamp01((hoursAfter - 2) / 6));
}

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
