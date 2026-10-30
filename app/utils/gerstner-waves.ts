// Adds Gerstner wave displacement to the three.js Water material (examples/jsm/objects/Water.js, r186)
// by patching its shader source. The add-on only animates a normal map on a flat plane.
// Reference: GPU Gems 1, ch. 1, "Effective Water Simulation from Physical Models".
import * as THREE from "three";
import type { Water } from "three/addons/objects/Water.js";
import { CHANNELLERS, channelPathChunk } from "./channel-path";

// Small seeded random generator, so the sea looks the same on every visit.
function seededRandom(seed: number) {
	return () => {
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// Per wave: angle off the wind in radians, phase, share of the total steepness,
// wavelength in world units at waveScale 1.
// A real sea is many wave trains with unrelated lengths, headings and phases. Long swell
// runs close to the wind; short chop spreads widely around it.
const WAVE_COUNT = 12;
// How many wave trains the shader adds up. The dial's sea uses the first twelve; a measured sea uses all.
const TRAIN_COUNT = 32;
const WAVES = (() => {
	const random = seededRandom(7);
	const waves = Array.from({ length: WAVE_COUNT }, (_, i) => {
		const spread = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(12, 55, i / (WAVE_COUNT - 1)));
		const length = 150 * 0.8 ** i * THREE.MathUtils.lerp(0.9, 1.1, random());
		return new THREE.Vector4((random() * 2 - 1) * spread, random() * Math.PI * 2, length ** 0.4, length);
	});
	const total = waves.reduce((sum, wave) => sum + wave.z, 0);
	for (const wave of waves) wave.z /= total;
	return waves;
})();

// On the dial, the shorter a wave the more it is the wind's.
const dialWindSea = (wave: THREE.Vector4) => 1 - THREE.MathUtils.smoothstep(wave.w, 40, 110);

// The sea of the weather dial and the story (September's sea): the wave trains above, running
// away from the viewer, sized by the waveSteepness and waveScale uniforms.
export function useDialSea(uniforms: GerstnerUniforms) {
	uniforms.waves.value.forEach((train, i) => {
		const wave = WAVES[i];
		// A train with no steepness adds nothing.
		if (wave) train.copy(wave);
		else train.set(0, 0, 0, 1);
		uniforms.waveWind.value[i] = wave ? dialWindSea(wave) : 0;
	});
	uniforms.windHeading.value.set(0, -1);
	uniforms.windDrift.value = 14;
	uniforms.ripple.value = 1;
	uniforms.crestWarp.value = 1;
}

// A measured sea is several seas on top of each other: swell that has come from weather far away
// (long, regular, all from nearly one direction), often a second, shorter swell crossing it from
// somewhere else, and the waves the wind here is raising (short, steep, spread widely about the
// wind). The wave model gives each as three figures: a significant height, a mean period and a
// direction. A real sea is not three waves but a whole spectrum of them, and the model does not
// publish its spectrum for this spot. So each system is filled out the way oceanographers and
// ship designers do it: its energy is spread over wave frequencies in the JONSWAP shape
// (Hasselmann and others, 1973; the measured form of a sea's spectrum), and over directions as
// cos^2s of half the angle off the mean (Mitsuyasu and others, 1975). `peakedness` is how sharply
// the energy gathers at one period, `spreading` (the s) how tightly at one direction; the values
// below are the usual ones for old swell, young swell and a wind sea.
interface Spectrum {
	// Per train: its frequency as a multiple of the peak frequency, its angle off the mean
	// direction in radians, and its phase. Every train carries an equal share of the energy.
	trains: { frequency: number; off: number; phase: number }[];
	// The peak period as a multiple of the mean period, which is the one the model gives.
	peakOverMean: number;
}

function spectrum(count: number, peakedness: number, spreading: number, seed: number): Spectrum {
	const random = seededRandom(seed);
	// The spectrum in fine steps of frequency (as a multiple of the peak's), from waves much
	// longer than the peak to ones too short for the grid to draw.
	const STEPS = 4000;
	const energy: number[] = [];
	const frequencies: number[] = [];
	let total = 0;
	let moment = 0;
	for (let step = 0; step < STEPS; step++) {
		const f = 0.6 + (2.0 * (step + 0.5)) / STEPS;
		const width = f < 1 ? 0.07 : 0.09;
		const e = f ** -5 * Math.exp(-1.25 * f ** -4) * peakedness ** Math.exp(-((f - 1) ** 2) / (2 * width ** 2));
		frequencies.push(f);
		energy.push(e);
		total += e;
		moment += e * f;
	}
	// Cut into bands of equal energy, one train each, at the band's centre of energy.
	const bands: number[] = [];
	let step = 0;
	for (let band = 0; band < count; band++) {
		let sum = 0;
		let weighted = 0;
		while (step < STEPS && sum < total / count) {
			sum += energy[step]!;
			weighted += energy[step]! * frequencies[step]!;
			step++;
		}
		bands.push(weighted / sum);
	}
	// Directions that follow the spreading law, at equal steps of its running total, dealt out
	// at random so that a train's direction has nothing to do with its length.
	const ANGLES = 2000;
	const density = Array.from({ length: ANGLES }, (_, i) => Math.cos(((i + 0.5) / ANGLES - 0.5) * Math.PI) ** (2 * spreading));
	const whole = density.reduce((sum, d) => sum + d, 0);
	const offs: number[] = [];
	let running = 0;
	let angle = 0;
	for (let n = 0; n < count; n++) {
		while (angle < ANGLES && running + density[angle]! < ((n + 0.5) / count) * whole) running += density[angle++]!;
		offs.push(((angle + 0.5) / ANGLES - 0.5) * 2 * Math.PI);
	}
	for (let n = count - 1; n > 0; n--) {
		const other = Math.floor(random() * (n + 1));
		[offs[n], offs[other]] = [offs[other]!, offs[n]!];
	}
	return {
		trains: bands.map((frequency, n) => ({ frequency, off: offs[n]!, phase: random() * Math.PI * 2 })),
		peakOverMean: moment / total,
	};
}

// Old swell from far away, a younger swell crossing it, and the wind's own waves.
const SWELL = spectrum(10, 7, 30, 11);
const SECOND_SWELL = spectrum(8, 3.3, 15, 23);
const WIND_SEA = spectrum(TRAIN_COUNT - 18, 3.3, 6, 37);

export interface WaveSystem {
	// Significant height in metres, mean period in seconds, and the compass direction it comes from.
	height: number;
	period: number;
	from: number;
}

// The sea as measured, in metres and true directions. The scene is in metres and the viewer
// faces the compass bearing `facing`.
// Each train's phase is k x - ω t: when its period changes slowly (the stilling moves the swell's
// period over hours), ω t would leap by ever more the longer the page is open, and the crests
// would race. So each train keeps the shift that holds its phase where it was as ω changes.
const phaseKept = { omega: new Array<number>(TRAIN_COUNT).fill(0), shift: new Array<number>(TRAIN_COUNT).fill(0) };

export function useMeasuredSea(
	uniforms: GerstnerUniforms,
	sea: { swell: WaveSystem; secondSwell: WaveSystem; windSea: WaveSystem; wind: { speed: number; from: number }; facing: number },
	time = 0,
) {
	// Angle off the view of something travelling away from the compass direction it comes from.
	const heading = (from: number) => THREE.MathUtils.degToRad(from + 180 - sea.facing);
	let i = 0;
	const lay = (system: WaveSystem, shape: Spectrum, wind: number) => {
		const peakPeriod = Math.max(system.period, 1) * shape.peakOverMean;
		// Significant height is four times the root of the sea's variance, and a train of
		// amplitude a carries a² / 2 of it.
		const amplitude = (system.height / 4) * Math.sqrt(2 / shape.trains.length);
		for (const train of shape.trains) {
			// In deep water a wave's length follows from its period: g T² / 2π.
			const length = (9.8 * (peakPeriod / train.frequency) ** 2) / (2 * Math.PI);
			const omega = Math.sqrt((9.8 * 2 * Math.PI) / length);
			if (phaseKept.omega[i]) phaseKept.shift[i] = (phaseKept.shift[i]! + (omega - phaseKept.omega[i]!) * time) % (2 * Math.PI);
			phaseKept.omega[i] = omega;
			uniforms.waves.value[i]!.set(heading(system.from) + train.off, train.phase + phaseKept.shift[i]!, (amplitude * 2 * Math.PI) / length, length);
			uniforms.waveWind.value[i] = wind;
			i++;
		}
	};
	lay(sea.swell, SWELL, 0);
	lay(sea.secondSwell, SECOND_SWELL, 0);
	lay(sea.windSea, WIND_SEA, 1);
	const windAngle = heading(sea.wind.from);
	uniforms.windHeading.value.set(Math.sin(windAngle), -Math.cos(windAngle));
	uniforms.windDrift.value = sea.wind.speed;
	uniforms.waveScale.value = 1;
	uniforms.crestWarp.value = 0;
	// The fine roughness of the sea grows with the wind: its mean square slope is about
	// 0.003 + 0.00512 × wind speed in m/s (Cox and Munk, 1954). The stock ripple is about right for a gale.
	uniforms.ripple.value = Math.sqrt(0.003 + 0.00512 * sea.wind.speed) / 0.3;
}

// Works out, for every train, what does not differ from one point of the sea to the next: the
// way it runs, its wave number (2π over its length), how fast its phase turns (in deep water a
// wave of that length travels at the root of g over its wave number), and the distance at which
// it has faded out of the picture. Called once a frame, after the sea has been set: the shaders
// used to work all this out again for every train at every point, which was most of their work.
export function workOutTrains(uniforms: GerstnerUniforms) {
	uniforms.waves.value.forEach((train, i) => {
		const wavelength = train.w * uniforms.waveScale.value;
		const k = (2 * Math.PI) / wavelength;
		uniforms.waveForm.value[i]!.set(Math.sin(train.x), -Math.cos(train.x), k, Math.sqrt(9.8 * k));
		uniforms.waveFade.value[i] = wavelength ** 1.5;
	});
}

// Height of a measured sea at a point, for carrying the viewer on it. (It leaves out the small
// sideways shift of the surface and the gusts' unevenness, so it is right to within the chop.)
export function measuredSeaHeight(uniforms: GerstnerUniforms, x: number, z: number, time: number) {
	let height = 0;
	for (const train of uniforms.waves.value) {
		const k = (2 * Math.PI) / train.w;
		const along = Math.sin(train.x) * x - Math.cos(train.x) * z;
		height += ((train.z * uniforms.waveSteepness.value) / k) * Math.sin(k * (along - Math.sqrt(9.8 / k) * time) + train.y);
	}
	return height;
}

// Peta's wave: how many trains the twelve lay (one each), and their height at a point, for carrying
// the viewer on them (without the small sideways shift, as measuredSeaHeight).
export const LENS_TRAINS = 12;
export function lensWaveHeight(uniforms: GerstnerUniforms, x: number, z: number, time: number) {
	const amount = uniforms.lensAmount.value;
	if (amount <= 0) return 0;
	let height = 0;
	for (const w of uniforms.lensWaves.value) {
		const k = (2 * Math.PI) / w.w;
		const along = Math.sin(w.x) * x - Math.cos(w.x) * z;
		height += w.z * amount * Math.sin(k * (along - Math.sqrt(9.8 / k) * time) + w.y);
	}
	return height;
}

// Jenna's swells (jenna.ts). Where a channelled bolt meets the sea the water weave presses a hollow
// into it, and the sea answers as deep water answers any sudden blow (Cauchy and Poisson's problem):
// a ring of waves runs out from it, sorted by length as it goes, for on deep water the long waves
// outrun the short. At a distance r after a time t the waves passing are those whose group speed is
// r / t: their wavenumber g t² / 4r², their phase g t² / 4r. The hollow is some sixty metres across,
// so it sends out chiefly waves of about two hundred metres (a swell of eleven seconds), little
// that is much longer or shorter. Their energy spreads round an ever wider ring and through an ever
// longer train, so they lower as one over the root of each; no steeper than water stands. Each ring
// is gone in about five minutes. (The same in the water shader, strikeRing.)
export const STRIKE_RINGS = 8;
const RING_HOLLOW = 60;
const RING_LENGTH = 200;
export function strikeRing(q: THREE.Vector4, x: number, z: number, time: number) {
	const t = time - q.z;
	if (q.w <= 0 || t <= 0 || t > 300) return undefined;
	const rx = x - q.x;
	const rz = z - q.y;
	const r = Math.hypot(rx, rz);
	const reach = Math.hypot(r, RING_HOLLOW);
	const k = (9.8 * t * t) / (4 * reach * reach);
	const length = (2 * Math.PI) / k;
	const sorted = Math.exp(-((Math.log(length / RING_LENGTH) / 0.55) ** 2));
	const a = Math.min(((q.w * sorted) / Math.sqrt((1 + r / 300) * (1 + t / 60))) * THREE.MathUtils.smoothstep(t, 0, 3) * (1 - THREE.MathUtils.smoothstep(t, 200, 300)), 0.12 / k);
	// (Going outward: the phase grows with r, as a wave train's does along its way.)
	const f = (3 * Math.PI) / 4 - (9.8 * t * t) / (4 * reach);
	return { a, f, k, dirX: r > 1 ? rx / r : 0, dirZ: r > 1 ? rz / r : 0 };
}

// How much of the waves' sideways sway can be kept without any crest folding over itself. A
// Gerstner surface loops where the steepnesses of the waves meeting at a point sum past 1; here
// the sum is taken at its worst (every train in step, the gusts at their strongest, Leane's
// current at its hardest) and the sway drawn in to keep it under 0.8. Any ordinary sea is far
// under, and is drawn exactly as before.
export function crestLimitFor(uniforms: GerstnerUniforms) {
	let sum = 0;
	uniforms.waves.value.forEach((train, i) => (sum += train.z * uniforms.waveSteepness.value * (1 + 0.5 * uniforms.gustiness.value * uniforms.waveWind.value[i]!)));
	for (const wave of GIANT_WAVES) sum += wave.z * uniforms.surge.value;
	for (const w of uniforms.lensWaves.value) sum += 0.5 * w.z * uniforms.lensAmount.value * ((2 * Math.PI) / w.w);
	// (Jenna's rings, at their steepest, each with its sway at 0.6.)
	for (const q of uniforms.strikeRings.value) if (q.w > 0) sum += 0.6 * 0.12;
	sum *= 1 + 0.5 * uniforms.lensCurrent.value.w;
	return Math.min(1, 0.8 / Math.max(sum, 1e-6));
}

// The height of the sea as drawn where the viewer is, sideways sway and all: a Gerstner wave
// carries the water sideways as it lifts it, so the water over a point came from somewhere else;
// it is found by following the sway back a few times. (In a great sea the plain sum of heights
// put the viewer under the water on the steep faces.)
export function seaSurfaceAt(uniforms: GerstnerUniforms, x: number, z: number, time: number) {
	const limit = uniforms.crestLimit.value;
	const at = (px: number, pz: number) => {
		let dx = 0;
		let dz = 0;
		let h = 0;
		const add = (heading: number, phase: number, k: number, a: number, sway: number) => {
			const dirX = Math.sin(heading);
			const dirZ = -Math.cos(heading);
			const f = k * (dirX * px + dirZ * pz - Math.sqrt(9.8 / k) * time) + phase;
			dx += dirX * a * sway * Math.cos(f);
			dz += dirZ * a * sway * Math.cos(f);
			h += a * Math.sin(f);
		};
		for (const train of uniforms.waves.value) {
			const k = (2 * Math.PI) / train.w;
			add(train.x, train.y, k, (train.z * uniforms.waveSteepness.value) / k, 1);
		}
		for (const wave of GIANT_WAVES) {
			const k = (2 * Math.PI) / wave.w;
			add(wave.x, wave.y, k, (uniforms.surge.value * wave.z) / k, 1);
		}
		if (uniforms.lensAmount.value > 0) for (const w of uniforms.lensWaves.value) add(w.x, w.y, (2 * Math.PI) / w.w, w.z * uniforms.lensAmount.value, 0.5);
		for (const q of uniforms.strikeRings.value) {
			const ring = strikeRing(q, px, pz, time);
			if (!ring) continue;
			dx += ring.dirX * ring.a * 0.6 * Math.cos(ring.f);
			dz += ring.dirZ * ring.a * 0.6 * Math.cos(ring.f);
			h += ring.a * Math.sin(ring.f);
		}
		return { dx: dx * limit, dz: dz * limit, h };
	};
	let px = x;
	let pz = z;
	for (let i = 0; i < 4; i++) {
		const { dx, dz } = at(px, pz);
		px = x - dx;
		pz = z - dz;
	}
	return at(px, pz).h;
}

// 0..1 for the foam uniform from the wind speed in m/s. The share of the sea covered by
// whitecaps is about 3.84e-6 × speed^3.41 (Monahan and O'Muircheartaigh, 1980): none to speak
// of below 4 m/s, a few percent in a near gale, a fifth of the sea in a storm.
export function whitecaps(windSpeed: number) {
	return Math.min(1, Math.sqrt((3.84e-6 * windSpeed ** 3.41) / 0.2));
}

// Giant swells raised at the height of the storm. Same layout as WAVES, but the wavelength is fixed
// and the steepness comes from the surge uniform. Few and regular, so the camera can ride them.
export const GIANT_WAVES = [
	[-8, 0.0, 0.4, 420],
	[14, 2.1, 0.33, 310],
	[-22, 4.4, 0.27, 230],
].map(([angle, phase, share, length]) => new THREE.Vector4(THREE.MathUtils.degToRad(angle!), phase, share, length));

// Height of the giant swells at a point, for lifting the camera with them.
export function giantWaveHeight(x: number, z: number, time: number, surge: number) {
	let height = 0;
	for (const wave of GIANT_WAVES) {
		const k = (2 * Math.PI) / wave.w;
		const along = Math.sin(wave.x) * x - Math.cos(wave.x) * z;
		height += ((surge * wave.z) / k) * Math.sin(k * (along - Math.sqrt(9.8 / k) * time) + wave.y);
	}
	return height;
}

export interface GerstnerUniforms {
	// Great Island (island.ts): how far the sea is from its shore, in 4 m steps, where it lies (x, z), how wide the map is,
	// and whether it is there; the map's turn to true north; and how much the swell is breaking.
	shoreMap: THREE.IUniform<THREE.Texture | null>;
	shoreAt: THREE.IUniform<THREE.Vector4>;
	shoreTurn: THREE.IUniform<THREE.Vector2>;
	shoreSurf: THREE.IUniform<number>;
	waveTime: THREE.IUniform<number>;
	// Sum of the steepness of all waves. Above 1 the crests loop over themselves.
	waveSteepness: THREE.IUniform<number>;
	// Multiplies every wavelength, and with it the wave height.
	waveScale: THREE.IUniform<number>;
	// The wave trains themselves: angle off the view in radians, phase, steepness, wavelength in
	// metres. And for each, 0..1 how far it is wind-raised chop and not swell.
	waves: THREE.IUniform<THREE.Vector4[]>;
	waveWind: THREE.IUniform<number[]>;
	// What the shaders need of each train, worked out from the above once a frame and not at
	// every point of the sea (see workOutTrains): the way it runs (world x and z), its wave
	// number, and how fast its phase turns; and the distance at which it has faded out.
	waveForm: THREE.IUniform<THREE.Vector4[]>;
	waveFade: THREE.IUniform<number[]>;
	// Which way the wind blows over the sea (a unit vector, world x and z) and how fast its gusts
	// cross the water, in metres a second.
	windHeading: THREE.IUniform<THREE.Vector2>;
	windDrift: THREE.IUniform<number>;
	// 0..1 how far crests are bent by a slow drifting pattern. The dial's few trains need it to
	// look like a sea; a measured sea has trains enough, and without it the viewer can ride the water.
	crestWarp: THREE.IUniform<number>;
	// The four channellers' braids over the sea (channellers.ts): where their boat is, their
	// clock, and how brightly their weaving lights the water, before tone mapping. 0 is unlit.
	channelBoat: THREE.IUniform<THREE.Vector2>;
	channelTime: THREE.IUniform<number>;
	// The wind across the view, for carrying their flow: see channel-path.ts.
	channelWind: THREE.IUniform<THREE.Vector2>;
	channelSea: THREE.IUniform<THREE.Vector2>;
	// 0..1 how strongly their channelling feeds the sea and the wind along the flow.
	channelFeed: THREE.IUniform<number>;
	channelLoss: THREE.IUniform<number>;
	channelGate: THREE.IUniform<THREE.Vector4>;
	channelOwn: THREE.IUniform<THREE.Vector4>;
	// The deep weaves close round the boat that slow it, as light in the water, before tone mapping. 0 is none.
	deepWeave: THREE.IUniform<number>;
	// 0..1 how far the strongest channellers have taken the deep weaving over from the weaker ones.
	deepMaster: THREE.IUniform<number>;
	channelHead: THREE.IUniform<THREE.Vector4>;
	channelTail: THREE.IUniform<THREE.Vector4>;
	channelLinger: THREE.IUniform<THREE.Vector4>;
	channelControl: THREE.IUniform<number>;
	channelHold: THREE.IUniform<number>;
	channelCurrent: THREE.IUniform<number>;
	channelBack: THREE.IUniform<number>;
	channelSurge: THREE.IUniform<number>;
	channelStream: THREE.IUniform<number>;
	// By day: how far the four are linked, and where each one's own weave goes (channel-path.ts).
	channelLink: THREE.IUniform<number>;
	channelInto: THREE.IUniform<THREE.Vector4>;
	// 0..1 how far the water shows the good their weaving does it by day: clearer where a weave lies.
	channelReading: THREE.IUniform<number>;
	channelHeal: THREE.IUniform<number>;
	// Water they have healed, which stays altered for minutes: for each of four places, world x
	// and z, how far it has spread in metres, and 0..1 how much of it is left.
	healed: THREE.IUniform<THREE.Vector4[]>;
	channelBalm: THREE.IUniform<number>;
	// The glow of healed water from within, before tone mapping.
	channelBalmGlow: THREE.IUniform<number>;
	// The great calming's pressed water (see pressedCalm), and the braids' light in it, before tone mapping.
	pressed: THREE.IUniform<THREE.Vector4[]>;
	pressedAny: THREE.IUniform<number>;
	// The strongest's stilled water (see stillOutside): where it reaches, the way ahead, and how
	// the sea beyond it differs.
	stillFront: THREE.IUniform<THREE.Vector4>;
	stillAhead: THREE.IUniform<THREE.Vector2>;
	stillSea: THREE.IUniform<THREE.Vector4>;
	// Leane's moonlight on the water she is stilling, before tone mapping.
	stillGlow: THREE.IUniform<number>;
	// The ocean the mighty have healed (oceanHealed): 0..1 how far, and its glow from within before
	// tone mapping.
	seaHealed: THREE.IUniform<THREE.Vector2>;
	pressGlow: THREE.IUniform<number>;
	// The boat's electric lamps on the water round it, before tone mapping. 0 is unlit.
	boatLamp: THREE.IUniform<number>;
	channelLight: THREE.IUniform<number>;
	// How rough the wind makes the fine surface. 1 is the stock ripple.
	ripple: THREE.IUniform<number>;
	// 0..1 amount of white foam on the steepest crests.
	foam: THREE.IUniform<number>;
	// 0..1 how unevenly the wind roughens the surface: 0 is a uniform sea, 1 has calm slicks and rough patches.
	gustiness: THREE.IUniform<number>;
	// Sum of the steepness of the giant swells. 0 leaves them out.
	surge: THREE.IUniform<number>;
	// Point on the sea directly below the knot of the weave (world x, z).
	weaveCentre: THREE.IUniform<THREE.Vector2>;
	// 0 and up: how strongly the knot shapes the sea around that point.
	weavePull: THREE.IUniform<number>;
	// 0..1 how far the gusts have stopped running with the wind and turn about that point instead.
	gustSwirl: THREE.IUniform<number>;
	// Brightness of the threads of the weave that run under the water, before tone mapping. 0 hides them.
	weaveGlow: THREE.IUniform<number>;
	// 0..1 strength of the stream of fresh water running out through the salt, and of the bands of
	// smooth water that internal waves leave on the surface.
	freshFlow: THREE.IUniform<number>;
	internalWaves: THREE.IUniform<number>;
	// Peta's wave (wrath.ts, petasWave): twelve trains laid by the twelve so that they arrive
	// together at one place at one moment (each: heading, phase, height in metres, length), and
	// 0..1 how fully they are laid; and the current Leane's four drive against the swell there
	// (world x, z, reach in metres, 0..1 how hard).
	lensWaves: THREE.IUniform<THREE.Vector4[]>;
	lensAmount: THREE.IUniform<number>;
	lensCurrent: THREE.IUniform<THREE.Vector4>;
	// Manulani's light (wrath.ts): where her sphere is (world), and how bright, before tone mapping.
	manuLight: THREE.IUniform<THREE.Vector4>;
	// 0..1 how much of the waves' sideways sway is kept (crestLimitFor): 1 in any ordinary sea.
	crestLimit: THREE.IUniform<number>;
	// Jenna's storm (jenna.ts): the swells running out from where each channelled bolt met the sea
	// (world x, z, the moment the water weave pressed it, in waveTime, and its height in metres).
	strikeRings: THREE.IUniform<THREE.Vector4[]>;
	// The parting (parting.ts): the boat (x, z) and the way ahead (x, z); the lane's half-width and
	// depth (m), 0..1 how far it is parted, and the height of the swells off its walls (m); and their
	// wavenumber and angular frequency.
	partFront: THREE.IUniform<THREE.Vector4>;
	partShape: THREE.IUniform<THREE.Vector4>;
	partSwell: THREE.IUniform<THREE.Vector2>;
	// And as the real weather has it (parting.ts, partingWeather): how far the lane bends downwind
	// (m across for each m² along), how much its walls rise and settle with the real swell and how
	// fast, and 0..1 how much spray the real gusts tear off their lips.
	partMore: THREE.IUniform<THREE.Vector4>;
}

const pressedChunk = /* glsl */ `
// Where the twelve's braids have pressed the swell out of the sea in the great calming
// (embroidery.ts): for each, where it goes into the sea (x, z), the reach of the calm it has made
// there, and 0..1 how fully. Gives 1 where nothing is pressed, less within; in rim how far a point
// is at the edge of a calm, where the storm's waves pile up and die, and in core how near it is to
// where a braid goes down.
uniform vec4 pressed[ 12 ];
// 1 while any of them is pressing, 0 when none is: then there is nothing to look through.
uniform float pressedAny;
float pressedCalm( vec2 p, out float rim, out float core ) {
	float calm = 1.0;
	rim = 0.0;
	core = 0.0;
	if ( pressedAny <= 0.0 ) return calm;
	for ( int i = 0; i < 12; i ++ ) {
		vec4 q = pressed[ i ];
		if ( q.w <= 0.0 ) continue;
		vec2 off = p - q.xy;
		float d = length( off );
		float a = atan( off.y, off.x );
		// Not a circle: its edge runs in and out, and moves.
		float R = q.z * ( 1.0 + 0.16 * sin( a * 3.0 + float( i ) * 1.7 ) + 0.07 * sin( a * 7.0 + float( i ) + waveTime * 0.04 ) );
		calm *= 1.0 - q.w * ( 1.0 - smoothstep( 0.45 * R, R, d ) );
		rim = max( rim, q.w * exp( - pow( ( d - R ) / ( 0.1 * R + 8.0 ), 2.0 ) ) );
		core = max( core, q.w * exp( - d / ( 0.12 * R + 10.0 ) ) );
	}
	return calm;
}
`;

// The strongest's stilling (stilling.ts): the water they have stilled opens out from the boat
// ahead like a great leaf, its two sides leaving the boat sideways and curving round to meet far
// ahead, and widens until it holds all the sea in sight. Within it the sea is the sea of the
// stilled figures (the one the whole picture is drawn from); beyond it, still the weather being
// stilled, which piles up against their weave at the edge and breaks white and dies there.
// stillFront: the boat (x, z), how far ahead the leaf reaches (m) and its widest half-width (m);
// stillSea: how much higher the sea beyond is, the edge's foam, the foam beyond, and a slow
// phase for the edge's wandering. (stillHalfWidth is the same in stilling.ts.)
export const stillChunk = /* glsl */ `
uniform vec4 stillFront;
uniform vec2 stillAhead;
uniform vec4 stillSea;
float stillHalfWidth( float x, float side ) {
	float f = clamp( x / max( stillFront.z, 1.0 ), 0.0, 1.0 );
	return stillFront.w * 1.45 * sqrt( f ) * pow( 1.0 - f, 0.15 ) * ( 1.0 + 0.1 * sin( x * 0.0021 + 1.7 + 2.1 * side + stillSea.w ) + 0.05 * sin( x * 0.0063 + side + 2.0 * stillSea.w ) );
}
// 0 within the stilled water, 1 beyond it; in rim how near a point is to its edge.
float stillOutside( vec2 p, out float rim ) {
	rim = 0.0;
	if ( stillFront.z <= 0.0 ) return 0.0;
	vec2 rel = p - stillFront.xy;
	float x = dot( stillAhead, rel );
	float y = stillAhead.x * rel.y - stillAhead.y * rel.x;
	float w = stillHalfWidth( x, sign( y ) );
	float g = max( abs( y ) - w, max( x - stillFront.z, - x ) );
	float m = 0.03 * stillFront.w + 6.0;
	rim = stillSea.y * exp( - g * g / ( m * m ) ) * smoothstep( 0.0, 40.0, w );
	return smoothstep( - m, m, g );
}
`;

// The parting of the sea (parting.ts): the sixteen hold a lane of the sea open ahead of the boat,
// from a few hundred metres off to the horizon; within it the water is pressed down to a still
// floor between two walls, heaped at their lips where the water they have put aside stands; and
// off each wall huge swells run out, away from the lane, as the sea answers being held. (The boat
// sits at its head, on the sea as it is, and the lane opens off its bow.) The walls soften with distance, as the sea's grid widens.
const partChunk = /* glsl */ `
uniform vec4 partFront;
uniform vec4 partShape;
uniform vec2 partSwell;
uniform vec4 partMore;
float partedSea( vec2 p, out float lane, out float lip, out float swell, out vec2 away ) {
	lane = 0.0;
	lip = 0.0;
	swell = 0.0;
	away = vec2( 0.0 );
	vec2 rel = p - partFront.xy;
	vec2 ahead = partFront.zw;
	float along = dot( rel, ahead );
	vec2 side = vec2( - ahead.y, ahead.x );
	// (Bent downwind as it goes, as the real wind blows across it.)
	float across = dot( rel, side ) - partMore.x * max( along, 0.0 ) * max( along, 0.0 );
	away = across < 0.0 ? - side : side;
	// (Its walls run a little in and out along their length.)
	// (Opening off the bow and widening as it goes.)
	float w = ( partShape.x + 0.02 * max( along, 0.0 ) ) * ( 1.0 + 0.1 * sin( along * 0.0013 + 1.3 ) + 0.04 * sin( along * 0.0041 ) );
	float wall = 25.0 + 0.035 * max( along, 0.0 );
	float d = abs( across ) - w;
	float amount = partShape.z * smoothstep( 25.0, 140.0, along ) * ( 1.0 - smoothstep( 7000.0, 9500.0, along ) );
	if ( amount <= 0.0 ) return 0.0;
	// Pressed down within, and the water put aside heaped as high at each wall, falling away outside.
	float s = smoothstep( - wall, 0.0, d );
	lane = amount * ( 1.0 - s );
	lip = amount * s * exp( - max( d, 0.0 ) / 260.0 );
	// (Its walls rising and settling a little with each real swell that passes under them.)
	float held = partShape.y * ( 1.0 + partMore.y * sin( partMore.z * waveTime - 0.004 * along ) );
	float h = - held * lane + held * lip;
	// The swells, running out from each wall.
	float out_ = max( d, 0.0 );
	float f = partSwell.x * out_ - partSwell.y * waveTime;
	swell = amount * smoothstep( 0.0, 1.5 * wall, d ) * exp( - out_ / 2600.0 ) * sin( f );
	return h + partShape.w * swell;
}
`;

const vertexPars = /* glsl */ `
uniform float crestLimit;
uniform vec4 lensWaves[ 12 ];
uniform float lensAmount;
uniform vec4 lensCurrent;
uniform float waveTime;
uniform float waveSteepness;
uniform float waveScale;
uniform float gustiness;
uniform float surge;
uniform vec2 weaveCentre;
uniform float weavePull;
uniform float gustSwirl;
uniform vec4 waves[${TRAIN_COUNT}];
uniform float waveWind[${TRAIN_COUNT}];
uniform vec4 waveForm[${TRAIN_COUNT}];
uniform float waveFade[${TRAIN_COUNT}];
uniform vec2 windHeading;
uniform float windDrift;
uniform float crestWarp;
uniform float channelFeed;
${channelPathChunk}
uniform vec4 giantWaves[${GIANT_WAVES.length}];
${pressedChunk}
${stillChunk}
${partChunk}
varying vec3 vWaveNormal;
varying float vCrest;
varying float vGust;

float waveHash( vec2 p ) {
	return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 );
}

float waveNoise( vec2 p ) {
	vec2 i = floor( p );
	vec2 f = fract( p );
	f = f * f * ( 3.0 - 2.0 * f );
	return mix(
		mix( waveHash( i ), waveHash( i + vec2( 1.0, 0.0 ) ), f.x ),
		mix( waveHash( i + vec2( 0.0, 1.0 ) ), waveHash( i + vec2( 1.0, 1.0 ) ), f.x ),
		f.y
	);
}

// A place on the sea as the wind sees it: x across the wind, y against it. September's wind
// always blew away from the viewer (-z), where this is the place unchanged.
// Jenna's swells, as strikeRing in gerstner-waves.ts.
uniform vec4 strikeRings[ ${STRIKE_RINGS} ];
void strikeRing( vec4 q, vec2 p, inout vec3 offset, inout vec3 tangent, inout vec3 binormal, inout float crest ) {
	float t = waveTime - q.z;
	if ( q.w <= 0.0 || t <= 0.0 || t > 300.0 ) return;
	vec2 rel = p - q.xy;
	float r = length( rel );
	float reach = sqrt( r * r + ${(RING_HOLLOW * RING_HOLLOW).toFixed(1)} );
	float k = 9.8 * t * t / ( 4.0 * reach * reach );
	float sorted = exp( - pow( log( 6.28318 / k / ${RING_LENGTH.toFixed(1)} ) / 0.55, 2.0 ) );
	float a = min( q.w * sorted * inversesqrt( ( 1.0 + r / 300.0 ) * ( 1.0 + t / 60.0 ) ) * smoothstep( 0.0, 3.0, t ) * ( 1.0 - smoothstep( 200.0, 300.0, t ) ), 0.12 / k );
	if ( a < 0.002 ) return;
	float f = 2.35619 - 9.8 * t * t / ( 4.0 * reach );
	vec2 d = r > 1.0 ? rel / r : vec2( 0.0 );
	float s = a * k;
	offset += vec3( 0.6 * d.x * a * cos( f ), a * sin( f ), 0.6 * d.y * a * cos( f ) );
	tangent += vec3( - 0.6 * d.x * d.x * s * sin( f ), d.x * s * cos( f ), - 0.6 * d.x * d.y * s * sin( f ) );
	binormal += vec3( - 0.6 * d.x * d.y * s * sin( f ), d.y * s * cos( f ), - 0.6 * d.y * d.y * s * sin( f ) );
	crest += 0.5 * s * sin( f );
}
vec2 windFrame( vec2 p ) {
	return vec2( - windHeading.y * p.x + windHeading.x * p.y, - dot( windHeading, p ) );
}

// Wind strength 0..1 over the surface: patches stretched along the wind that drift downwind.
float gustPattern( vec2 q ) {
	return 0.6 * waveNoise( q * vec2( 0.006, 0.0025 ) ) + 0.4 * waveNoise( q * vec2( 0.017, 0.007 ) + 31.0 );
}

// When the channelling takes hold of the wind, the same patches wheel round the point below
// the knot in spiral bands instead of running straight downwind.
float gustField( vec2 p ) {
	float straight = gustPattern( windFrame( p ) + vec2( 0.0, waveTime * windDrift ) );
	if ( gustSwirl <= 0.0 ) return straight;
	vec2 rel = p - weaveCentre;
	float turn = waveTime * 0.15 + length( rel ) * 0.0015;
	vec2 turned = mat2( cos( turn ), sin( turn ), - sin( turn ), cos( turn ) ) * rel;
	return mix( straight, gustPattern( turned ), gustSwirl );
}

// The knot of the weave prints its turning figures on the sea below it: spiral arms that wind
// outward one way, a second set that winds the other way, and plain rings. Where they cross
// they make a shifting pattern. Under the knot itself the water is drawn up into a mound.
// One term: height in h, slope (d/dx, d/dz) in slope. arms is the number of spiral arms, signed
// by the way they turn; 0 gives rings.
void weaveRipple( vec2 rel, float r, float theta, float distanceToEye, float amplitude, float wavelength, float arms, float speed, inout float h, inout vec2 slope ) {
	float k = 2.0 * PI / wavelength;
	float a = amplitude * exp( - r / 1500.0 ) * smoothstep( 0.0, 80.0, r )
		* ( 1.0 - smoothstep( 0.5 * pow( wavelength, 1.5 ), pow( wavelength, 1.5 ), distanceToEye ) );
	float f = k * r - speed * waveTime + arms * theta;
	h += a * sin( f );
	slope += a * cos( f ) * ( k * rel / r + arms * vec2( - rel.y, rel.x ) / ( r * r ) );
}

// Short waves fade out with distance, where the grid is too coarse to sample them.
// The normal ignores the gust and warp gradients; both vary slowly enough not to show.
vec3 gerstner( vec3 p, out vec3 normal, out float crest, out float gust ) {
	vec3 offset = vec3( 0.0 );
	vec3 tangent = vec3( 1.0, 0.0, 0.0 );
	vec3 binormal = vec3( 0.0, 0.0, 1.0 );
	float distanceToEye = length( p.xz - cameraPosition.xz );
	gust = gustField( p.xz );
	// The channellers do not make weather of their own: they feed what the sea and the wind are
	// already doing. Along their flow every wave that is there stands a little steeper and the
	// wind's gusts bite a little harder. (Not close by the boat, which rides the sea as measured.)
	float fed = 0.0;
	if ( channelFeed > 0.0 ) {
		float ahead = channelBoat.y - p.z;
		if ( ahead > 30.0 ) {
			float off = p.x - channelBoat.x - channelFlow( ahead );
			float reach = 6.0 + 0.08 * ahead;
			fed = channelFeed * exp( - off * off / ( reach * reach ) ) * smoothstep( 30.0, 90.0, ahead ) * ( 1.0 - smoothstep( 0.75, 1.0, channelWay( ahead ) ) );
			gust = min( 1.0, gust + 0.5 * fed );
		}
	}
	// Slow sideways drift of the phase, so crests bend and break up instead of running as straight lines.
	vec2 warp = vec2(
		waveNoise( p.xz * 0.005 + vec2( 0.0, waveTime * 0.03 ) ),
		waveNoise( p.xz * 0.005 + vec2( 47.0, - waveTime * 0.02 ) )
	) - 0.5;
	crest = 0.0;
	for ( int i = 0; i < ${TRAIN_COUNT}; i ++ ) {
		vec2 d = waveForm[ i ].xy;
		float wavelength = waves[ i ].w * waveScale;
		// Gusts act on the wind-driven chop, not on the long swell.
		float windSea = waveWind[ i ];
		float steepness = waves[ i ].z * waveSteepness * ( 1.0 + 0.35 * fed )
			* mix( 1.0, mix( 0.35, 1.5, gust ), gustiness * windSea )
			* ( 1.0 - smoothstep( 0.5 * waveFade[ i ], waveFade[ i ], distanceToEye ) );
		// (A train that has faded out with distance, or has no height, adds nothing.)
		if ( steepness <= 0.0 ) continue;
		float k = waveForm[ i ].z;
		float f = k * dot( d, p.xz + warp * wavelength * 0.7 * crestWarp ) - waveForm[ i ].w * waveTime + waves[ i ].y;
		float a = steepness / k;
		offset += vec3( d.x * a * cos( f ), a * sin( f ), d.y * a * cos( f ) );
		tangent += vec3( - d.x * d.x * steepness * sin( f ), d.x * steepness * cos( f ), - d.x * d.y * steepness * sin( f ) );
		binormal += vec3( - d.x * d.y * steepness * sin( f ), d.y * steepness * cos( f ), - d.y * d.y * steepness * sin( f ) );
		crest += steepness * sin( f );
	}
	// (Without a surge they add nothing at all.)
	if ( surge != 0.0 ) for ( int i = 0; i < ${GIANT_WAVES.length}; i ++ ) {
		vec2 d = vec2( sin( giantWaves[ i ].x ), - cos( giantWaves[ i ].x ) );
		float steepness = giantWaves[ i ].z * surge;
		float k = 2.0 * PI / giantWaves[ i ].w;
		float f = k * ( dot( d, p.xz ) - sqrt( 9.8 / k ) * waveTime ) + giantWaves[ i ].y;
		float a = steepness / k;
		offset += vec3( d.x * a * cos( f ), a * sin( f ), d.y * a * cos( f ) );
		tangent += vec3( - d.x * d.x * steepness * sin( f ), d.x * steepness * cos( f ), - d.x * d.y * steepness * sin( f ) );
		binormal += vec3( - d.x * d.y * steepness * sin( f ), d.y * steepness * cos( f ), - d.y * d.y * steepness * sin( f ) );
		// Counted lightly, or the whole upper half of every giant swell turns to foam.
		crest += 0.4 * steepness * sin( f );
	}
	// Peta's wave. Each of the twelve lays a train so that its crest reaches one place at one
	// moment, each from a little another way and each of another length; so they come in as long,
	// low, scattered waves, run together into one wall at that place and moment, and go apart again
	// as they roll on under the boat (focusing, as the sea itself makes its rogue waves). Their
	// sideways sway is halved, so the wall stands up rather than folding over itself.
	if ( lensAmount > 0.0 ) {
		for ( int i = 0; i < 12; i ++ ) {
			vec4 w = lensWaves[ i ];
			vec2 d = vec2( sin( w.x ), - cos( w.x ) );
			float k = 2.0 * PI / w.w;
			float f = k * ( dot( d, p.xz ) - sqrt( 9.8 / k ) * waveTime ) + w.y;
			float a = w.z * lensAmount;
			float s = a * k;
			offset += vec3( 0.5 * d.x * a * cos( f ), a * sin( f ), 0.5 * d.y * a * cos( f ) );
			tangent += vec3( - 0.5 * d.x * d.x * s * sin( f ), d.x * s * cos( f ), - 0.5 * d.x * d.y * s * sin( f ) );
			binormal += vec3( - 0.5 * d.x * d.y * s * sin( f ), d.y * s * cos( f ), - 0.5 * d.y * d.y * s * sin( f ) );
			crest += 0.2 * s * sin( f );
		}
	}
	// Jenna's swells, running out from where each channelled bolt met the sea.
	for ( int i = 0; i < ${STRIKE_RINGS}; i ++ ) strikeRing( strikeRings[ i ], p.xz, offset, tangent, binormal, crest );
	// And Leane's four drive a current against the swell there: waves meeting a current shorten
	// and stand up (as off the Agulhas), so the sea about the place grows taller and sheerer, and
	// breaks. (Never at the boat.)
	if ( lensCurrent.w > 0.0 ) {
		vec2 rel = p.xz - lensCurrent.xy;
		float against = lensCurrent.w * exp( - dot( rel, rel ) / ( lensCurrent.z * lensCurrent.z ) ) * smoothstep( 80.0, 220.0, distanceToEye );
		offset.y *= 1.0 + 0.7 * against;
		offset.xz *= 1.0 + 0.5 * against;
		tangent.y *= 1.0 + 0.7 * against;
		binormal.y *= 1.0 + 0.7 * against;
		crest *= 1.0 + 1.4 * against;
	}
	// No crest may fold over itself (crestLimitFor): in a sea steeper than water can stand the
	// sideways sway of every wave is drawn in together, so the surface leans but never loops and
	// shows its underside.
	if ( crestLimit < 1.0 ) {
		offset.xz *= crestLimit;
		tangent.x = 1.0 + ( tangent.x - 1.0 ) * crestLimit;
		tangent.z *= crestLimit;
		binormal.x *= crestLimit;
		binormal.z = 1.0 + ( binormal.z - 1.0 ) * crestLimit;
	}
	if ( weavePull > 0.0 ) {
		vec2 rel = p.xz - weaveCentre;
		float r = max( length( rel ), 1.0 );
		float theta = atan( rel.y, rel.x );
		float h = 0.0;
		vec2 slope = vec2( 0.0 );
		weaveRipple( rel, r, theta, distanceToEye, 6.0, 170.0, 3.0, 1.1, h, slope );
		weaveRipple( rel, r, theta, distanceToEye, 4.0, 115.0, - 2.0, 1.6, h, slope );
		weaveRipple( rel, r, theta, distanceToEye, 2.5, 75.0, 0.0, 2.3, h, slope );
		float mound = 45.0 * exp( - r * r / 32400.0 );
		h += mound;
		slope += mound * - 2.0 * rel / 32400.0;
		offset.y += weavePull * h;
		tangent.y += weavePull * slope.x;
		binormal.y += weavePull * slope.y;
		crest += weavePull * 0.035 * ( h - mound );
	}
	// Pressed calm by the twelve: the swell taken out of the water, and at the calm's edge the
	// storm's waves piling up and dying in a smooth swell and foam. (Not under the boat, which
	// rides the sea as measured.)
	float pressRim, pressCore;
	float pressCalm = mix( 1.0, pressedCalm( p.xz, pressRim, pressCore ), smoothstep( 150.0, 260.0, distance( p.xz, cameraPosition.xz ) ) );
	offset *= pressCalm;
	tangent = mix( vec3( 1.0, 0.0, 0.0 ), tangent, pressCalm );
	binormal = mix( vec3( 0.0, 0.0, 1.0 ), binormal, pressCalm );
	crest = crest * pressCalm + 1.2 * pressRim;
	offset.y += 4.0 * pressRim;
	// Beyond the strongest's stilled water the sea is still the weather being stilled: higher (or,
	// where the twelve's calm still holds it down, lower). At the edge it piles up and breaks.
	// (Not about the boat, which is always within it.)
	float stillRim;
	// (Nor far off, where the sea is drawn too coarsely to carry it: it stood up as a smooth hill.)
	float beyond = stillOutside( p.xz, stillRim ) * smoothstep( 60.0, 140.0, distanceToEye ) * ( 1.0 - smoothstep( 2500.0, 5000.0, distanceToEye ) );
	float lift = mix( 1.0, stillSea.x, beyond );
	offset.y *= lift;
	offset.xz *= min( lift, 1.3 );
	tangent.y *= lift;
	binormal.y *= lift;
	stillRim *= 1.0 - smoothstep( 2500.0, 5000.0, distanceToEye );
	crest = crest * mix( 1.0, min( lift, 1.6 ), beyond ) + 1.4 * stillRim;
	offset.y += 5.0 * stillRim;
	// The parting: within the lane the sea held still and pressed down, its walls and swells beyond.
	if ( partShape.z > 0.0 ) {
		float lane, lip, swell;
		vec2 away;
		float h = partedSea( p.xz, lane, lip, swell, away );
		if ( lane > 0.0 || lip > 0.001 || swell != 0.0 ) {
			float l2, p2, s2;
			vec2 a2;
			float hx = partedSea( p.xz + vec2( 2.0, 0.0 ), l2, p2, s2, a2 );
			float hz = partedSea( p.xz + vec2( 0.0, 2.0 ), l2, p2, s2, a2 );
			float keep = 1.0 - lane;
			offset *= keep;
			tangent = mix( vec3( 1.0, 0.0, 0.0 ), tangent, keep );
			binormal = mix( vec3( 0.0, 0.0, 1.0 ), binormal, keep );
			crest *= keep;
			offset.y += h;
			tangent.y += ( hx - h ) / 2.0;
			binormal.y += ( hz - h ) / 2.0;
			// (Foam where the put-aside water stands at the lip, and on the swells' crests.)
			crest += ( 0.9 + 1.5 * partMore.w ) * lip * lip + 0.5 * partShape.w * partSwell.x * max( swell, 0.0 );
		}
	}
	normal = normalize( cross( binormal, tangent ) );
	return p + offset;
}
`;

// Runs after the original flat-plane transform and overwrites its results.
const vertexMain = /* glsl */ `
	// The sea reaches all round the boat, and most of it is behind the viewer or off to the side
	// at any moment. Water well outside the picture is left flat: the waves are only worked out
	// where they can be seen (with room to spare, for a wave shifts the water it lifts, and far
	// out one triangle of the grid is wide).
	vec4 flatSea = projectionMatrix * viewMatrix * worldPosition;
	float room = 100.0 + 0.25 * abs( flatSea.w );
	if ( flatSea.w < - room || abs( flatSea.x ) > flatSea.w + room || abs( flatSea.y ) > flatSea.w + room ) {
		vWaveNormal = vec3( 0.0, 1.0, 0.0 );
		vCrest = 0.0;
		vGust = 0.0;
	} else {
		worldPosition.xyz = gerstner( worldPosition.xyz, vWaveNormal, vCrest, vGust );
	}
	mirrorCoord = textureMatrix * worldPosition;
	mvPosition = viewMatrix * worldPosition;
	gl_Position = projectionMatrix * mvPosition;
`;

const fragmentPars = /* glsl */ `
uniform sampler2D shoreMap;
uniform vec4 shoreAt;
uniform vec2 shoreTurn;
uniform float shoreSurf;
uniform float foam;
uniform float gustiness;
uniform float ripple;
uniform vec2 windHeading;
uniform float weaveGlow;
uniform float waveTime;
uniform vec2 weaveCentre;
uniform float freshFlow;
uniform float internalWaves;
uniform float channelLight;
uniform float channelBalm;
uniform vec4 healed[ 4 ];
uniform float channelBalmGlow;
uniform float pressGlow;
uniform float stillGlow;
uniform vec2 seaHealed;
${pressedChunk}
${stillChunk}
uniform float boatLamp;
uniform vec4 manuLight;
uniform float deepWeave;
uniform float deepMaster;
${channelPathChunk}
varying vec3 vWaveNormal;
varying float vCrest;
varying float vGust;
`;

// Combines the wave normal with the normal-map detail (whiteout blend).
// Ripples are stronger where the wind is, which leaves glassy slicks between the gusts.
// Two finer layers of ripple are added near the viewer, running downwind at their own speeds:
// the small, sharp facets that break the sun into glitter. They fade out with distance, where
// they would only shimmer.
//
// Two waters. A stream of fresh water runs out through the salt sea from behind the viewer
// towards the horizon, wandering from side to side. It is lighter than the salt and rides over
// it without mixing at once, so it keeps its own motion: fastest down its middle, with eddies
// turning along both edges, where the two waters meet in a line that gathers foam. Its ripples
// are carried along by that current (two copies of the ripple pattern, each sliding with the
// flow and fading into the other before it has slid too far to look right).
// And over everything, slow bands of smoother water: the mark that internal waves, travelling
// on the boundary between layers far below, leave on the surface.
const fragmentNormal = /* glsl */ `
	vec2 place = worldPosition.xz;
	float fromEye = length( eye - worldPosition.xyz );
	float bendA = 0.004 * place.y + waveTime * 0.05;
	float bendB = 0.011 * place.y - waveTime * 0.08;
	float midstream = 70.0 * sin( bendA ) + 35.0 * sin( bendB );
	float slope = 0.28 * cos( bendA ) + 0.385 * cos( bendB );
	// The stream spreads as it goes out.
	float acrossStream = ( place.x - midstream ) / ( 60.0 + 0.06 * max( 0.0, 100.0 - place.y ) );
	float fresh = freshFlow * ( 1.0 - smoothstep( 0.7, 1.0, abs( acrossStream ) ) );
	float meeting = freshFlow * exp( - pow( ( abs( acrossStream ) - 0.88 ) / 0.1, 2.0 ) );
	vec2 current = normalize( vec2( - slope, - 1.0 ) ) * ( 1.0 - min( 1.0, acrossStream * acrossStream ) ) * 16.0 * fresh;
	float whorl = place.y * 0.045 + waveTime * 0.5;
	current += vec2( cos( whorl ), sin( whorl ) * sign( acrossStream ) ) * 6.0 * meeting;
	if ( fresh + meeting > 0.01 ) {
		float beat = fract( waveTime * 0.15 );
		vec2 early = texture2D( normalSampler, place / 21.0 - current * beat * 0.12 ).xy;
		vec2 late = texture2D( normalSampler, place / 21.0 + 0.41 - current * fract( beat + 0.5 ) * 0.12 ).xy;
		noise.xy += ( mix( early, late, abs( 2.0 * beat - 1.0 ) ) - 0.5 ) * 2.2 * ( fresh + meeting ) * ( 1.0 - smoothstep( 500.0, 1500.0, fromEye ) );
	}
	float slick = smoothstep( 0.55, 0.95, 0.5 + 0.5 * sin( place.x * 0.011 + place.y * 0.021 - waveTime * 0.22 ) );
	float rippled = 1.5 * ripple * mix( 1.0, mix( 0.4, 2.0, vGust ), gustiness ) * ( 1.0 - 0.5 * internalWaves * slick );
	// The place as the wind sees it (x across the wind, y against it), for what the wind carries.
	vec2 downwind = vec2( - windHeading.y * place.x + windHeading.x * place.y, - dot( windHeading, place ) );
	float nearness = 1.0 - smoothstep( 120.0, 700.0, fromEye );
	if ( nearness > 0.0 ) {
		vec2 fine = texture2D( normalSampler, downwind / 31.0 + vec2( time / 23.0, time / 7.0 ) ).xy
			+ texture2D( normalSampler, downwind / 11.0 + vec2( - time / 13.0, time / 4.0 ) ).xy - 1.0;
		noise.xy += fine * 0.9 * nearness;
	}
	// The trial (channelLoss): the strongest channellers' deep weaving gives off no light. It is
	// seen only by what it does to the water, which is what salt meeting fresh really does: the
	// fresher bodies lie smooth and glassy, the saltier ones rough, and where two meet the surface
	// wavers. All of that is done here, to the surface itself, so the stars and lamps mirrored in
	// the sea are what show it.
	if ( deepMaster > 0.0 && channelLoss > 0.0 ) {
		vec2 fromBoat_ = place - channelBoat;
		float hereabouts = ( 1.0 - smoothstep( 40.0, 75.0, length( fromBoat_ ) ) ) * deepMaster * channelLoss;
		float body_ = texture2D( normalSampler, fromBoat_ / 95.0 + vec2( waveTime * 0.003, - waveTime * 0.002 ) ).r
			+ 0.5 * texture2D( normalSampler, fromBoat_ / 41.0 - vec2( waveTime * 0.004, waveTime * 0.003 ) + 0.37 ).g - 0.25;
		rippled *= mix( 1.0, mix( 1.9, 0.15, smoothstep( 0.3, 0.7, body_ ) ), hereabouts );
		float meets = exp( - pow( ( body_ - 0.5 ) / 0.05, 2.0 ) ) * hereabouts;
		noise.xy += meets * 0.7 * vec2( sin( place.x * 0.9 + waveTime * 1.3 ), cos( place.y * 0.8 - waveTime * 1.1 ) );
	}
	// Where the twelve have pressed the swell out of the sea (the great calming) it is glass: its
	// small roughness is gone too, so it mirrors the sky clean, and reads at once against the storm.
	float pressRim, pressCore;
	float pressCalm = pressedCalm( place, pressRim, pressCore );
	rippled *= mix( 0.04, 1.0, pressCalm );
	vec3 surfaceNormal = normalize( noise.xzy * vec3( rippled, 1.0, rippled ) );
	surfaceNormal = normalize( vec3(
		surfaceNormal.x / surfaceNormal.y + vWaveNormal.x / vWaveNormal.y,
		1.0,
		surfaceNormal.z / surfaceNormal.y + vWaveNormal.z / vWaveNormal.y
	) );
`;

// Foam takes its brightness from the reflected sky plus sunlight, so it follows the time of day.
const fragmentFoam = /* glsl */ `
	vec3 outgoingLight = albedo;
	// (Beyond the strongest's stilled water the foam is the stilled weather's.)
	float stillRim;
	float stillBeyond = stillOutside( worldPosition.xz, stillRim );
	float foam = mix( foam, stillSea.z, stillBeyond );
	// In a storm the foam reaches further down the crests.
	float foamMask = foam * smoothstep( mix( 0.35, 0.12, foam ), mix( 0.8, 0.5, foam ), vCrest + noise.x * 0.3 );
	// Streaks of foam torn off by the gusts, stretched along the wind and drifting with it.
	float streak = texture2D( normalSampler, downwind * vec2( 0.03, 0.004 ) + vec2( 0.0, time * 0.05 ) ).r;
	foamMask = max( foamMask, foam * foam * vGust * smoothstep( 0.55, 0.8, streak ) * 0.7 * ( 1.0 - smoothstep( 600.0, 2000.0, distance ) ) );
	vec3 foamColor = vec3( dot( reflectionSample, vec3( 0.3, 0.59, 0.11 ) ) ) * 1.2 + sunColor * diffuseLight;
	// Light passes through the thin tops of waves and comes out green-blue, most of all when the
	// viewer looks towards the light through them. The troughs, where the water is deep, stay dark.
	float thinWater = smoothstep( 0.05, 0.75, vCrest * 1.5 + 0.15 );
	float throughLight = 0.35 + 0.65 * pow( max( 0.0, dot( normalize( eyeDirection.xz ), - normalize( sunDirection.xz + 1e-4 ) ) ), 2.0 );
	outgoingLight += vec3( 0.12, 0.95, 0.78 ) * 0.5 * length( waterColor ) * sunColor.g * thinWater * throughLight * ( 1.0 - reflectance );
	outgoingLight *= mix( 0.82, 1.0, smoothstep( - 0.5, 0.2, vCrest ) );

	// Fresh water is clearer and greener than salt, and shows what is under it more.
	outgoingLight = mix( outgoingLight, outgoingLight * vec3( 0.8, 1.2, 1.0 ) + vec3( 0.04, 0.2, 0.14 ) * length( waterColor ) * sunColor.g, fresh * 0.7 * ( 1.0 - reflectance ) );
	// Where the two waters meet, a broken line of foam.
	foamMask = max( foamMask, meeting * 0.75 * smoothstep( 0.3, 0.7, 0.5 + 0.5 * noise.x + 0.2 * sin( worldPosition.z * 0.3 ) ) );

	// Within a pressed calm no foam at all; at its edge the storm's waves break white and die.
	foamMask *= pressCalm;
	foamMask = max( foamMask, pressRim * smoothstep( 0.2, 0.6, 0.5 + 0.5 * noise.x + 0.3 * sin( worldPosition.x * 0.07 + worldPosition.z * 0.05 + waveTime * 0.6 ) ) );
	// Against the strongest's weave the storm's sea breaks white, in a broken line, and dies.
	foamMask = max( foamMask, stillRim * smoothstep( 0.25, 0.65, 0.5 + 0.5 * noise.x + 0.3 * sin( worldPosition.x * 0.05 - worldPosition.z * 0.06 + waveTime * 0.5 ) ) );

	// Off Great Island's shore (island.ts) the bottom comes up through the blue, and the swell breaks.
	if ( shoreAt.w > 0.0 ) {
		vec2 fromIsland = worldPosition.xz - shoreAt.xy;
		vec2 onMap = vec2( fromIsland.x * shoreTurn.x - fromIsland.y * shoreTurn.y, fromIsland.x * shoreTurn.y + fromIsland.y * shoreTurn.x ) / shoreAt.z + 0.5;
		if ( onMap.x > 0.0 && onMap.x < 1.0 && onMap.y > 0.0 && onMap.y < 1.0 ) {
			float offshore = texture2D( shoreMap, onMap ).r * 1020.0 + ( noise.x + noise.y ) * 9.0;
			float shallows = exp( - offshore / 80.0 ) * ( 1.0 - 0.75 * reflectance );
			outgoingLight = mix( outgoingLight, vec3( 0.03, 0.34, 0.33 ) * length( waterColor ) * sunColor.g, 0.85 * shallows );
			// Each swell breaking as it comes in, and the white wash against the rock.
			float swellIn = 0.5 + 0.5 * sin( offshore * 0.11 + waveTime * 0.75 + 1.3 * sin( place.x * 0.006 ) + 1.7 * sin( place.y * 0.0047 ) );
			float breakers = smoothstep( 0.62, 0.95, swellIn + 0.3 * noise.z ) * ( 1.0 - smoothstep( 16.0, 30.0 + 45.0 * shoreSurf, offshore ) );
			float wash = 1.0 - smoothstep( 2.0, 7.0 + 14.0 * shoreSurf, offshore + 6.0 * noise.x );
			foamMask = max( foamMask, max( breakers * ( 0.35 + 0.65 * shoreSurf ), wash * ( 0.45 + 0.55 * shoreSurf ) ) );
		}
	}

	outgoingLight = mix( outgoingLight, foamColor, foamMask );
	// The channellers' braids light the sea they run over. Each is a line of light a little above
	// the water: bright in a band beneath it, fainter in a wide pool about it, and coming from the
	// side, so the faces of the waves that are turned to it show and the far faces stay dark.
	// Water gives light back from within where it is not acting as a mirror; foam gives back most.
	float mended = 0.0;
	if ( channelLight > 0.0 || channelBalm > 0.0 || channelBalmGlow > 0.0 ) {
		float ahead = channelBoat.y - worldPosition.z;
		if ( ahead > - 6.0 ) {
			float out_ = max( ahead, 0.0 );
			float lit = 0.0;
			float tended = 0.0;
			for ( int i = 0; i < ${CHANNELLERS}; i ++ ) {
				float k = float( i );
				// (A seat with no weave out lights nothing and mends nothing.)
				if ( channelOf( channelGate, k ) <= 0.0 ) continue;
				float off = worldPosition.x - channelBoat.x - channelLine( k, out_ );
				// The higher a braid climbs, the wider and fainter its light falls on the sea.
				float climbed = channelRise( k, out_ );
				float reach = 0.9 + 0.03 * out_ + 0.6 * climbed;
				float near = exp( - off * off / ( reach * reach ) ) + 0.16 * exp( - off * off / ( 49.0 * reach * reach ) );
				float facing = clamp( dot( surfaceNormal, normalize( vec3( - off, 1.3 + 0.02 * out_ + climbed, 0.0 ) ) ), 0.0, 1.0 );
				lit += near * ( 0.25 + 0.75 * facing * facing ) * ( 0.55 + 0.75 * channelPulse( k, out_ ) ) * channelStrength( k ) * channelShown( k, out_ ) / ( 1.0 + climbed / 12.0 );
				// (A wider reach than its light: what is done to the water spreads in it.)
				tended += exp( - off * off / ( 25.0 * reach * reach ) ) * channelStrength( k ) * channelShown( k, out_ ) / ( 1.0 + climbed / 5.0 );
			}
			// (While each is at a reading of their own there is no flow on the sea to light it.)
			lit *= 1.0 - 0.85 * channelReading;
			tended = 0.3 * min( tended, 1.0 ) * channelHeal * smoothstep( 2.0, 14.0, ahead ) * ( 1.0 - smoothstep( 120.0, 220.0, out_ ) );
			lit *= smoothstep( - 6.0, 5.0, ahead ) / ( 1.0 + out_ / 500.0 );
			outgoingLight += vec3( 0.74, 0.92, 1.0 ) * lit * channelLight * ( 0.3 + 0.7 * ( 1.0 - reflectance ) + 1.5 * foamMask );
			mended += tended;
		}
	}
	// Where they have healed the water it shows (the owner's), and goes on showing for minutes
	// after they have let go: it is a little clearer and bluer there, and glows faintly from within.
	for ( int i = 0; i < 4; i ++ ) {
		vec2 off = worldPosition.xz - healed[ i ].xy;
		// (Not a round stain: its edge is drawn out along the waves' own faces.)
		float reach = healed[ i ].z * ( 1.0 + 0.25 * surfaceNormal.x + 0.25 * surfaceNormal.z );
		mended += healed[ i ].w * exp( - dot( off, off ) / max( reach * reach, 1.0 ) );
	}
	mended = min( mended, 1.0 ) * ( 1.0 - foamMask );
	outgoingLight *= mix( vec3( 1.0 ), vec3( 0.46, 0.94, 1.34 ), channelBalm * mended * ( 1.0 - 0.6 * reflectance ) );
	outgoingLight += vec3( 0.03, 0.2, 0.75 ) * channelBalmGlow * mended * ( 1.0 - reflectance );
	// Pressed calm, the cold water drawn up from below shows: darker, clearer, a little greener;
	// and where each braid goes down into the sea its light is seen going down into the water.
	outgoingLight *= mix( vec3( 1.0 ), vec3( 0.78, 0.95, 1.0 ), ( 1.0 - pressCalm ) * 0.6 * ( 1.0 - reflectance ) );
	outgoingLight += vec3( 0.55, 0.7, 0.8 ) * pressGlow * pressCore * ( 1.0 - reflectance );
	// Leane's moonlight lies on the water she is stilling: a silver sheen on the faces of its
	// smoothed waves, brightest where the storm's sea breaks against its edge.
	outgoingLight += vec3( 0.8, 0.86, 1.0 ) * stillGlow * ( ( 1.0 - stillBeyond ) * ( 0.25 + 0.75 * pow( max( surfaceNormal.y, 0.0 ), 8.0 ) ) + 1.5 * stillRim ) * ( 1.0 - smoothstep( 300.0, 2500.0, distance ) );
	// The ocean the strongest, Manulani and the four mighty have healed: the water within their
	// stilled edge, and all of it once the weather is the measured again. Clearer and bluer from
	// within, as the twelve's healed water is, and glowing faintly; never the foam, nor the old sea
	// still breaking against their weave.
	if ( seaHealed.x > 0.0 ) {
		float whole = seaHealed.x * ( 1.0 - stillBeyond ) * ( 1.0 - foamMask ) * ( 1.0 - min( stillRim, 1.0 ) );
		outgoingLight *= mix( vec3( 1.0 ), vec3( 0.46, 0.94, 1.34 ), 0.7 * whole * ( 1.0 - 0.4 * reflectance ) );
		outgoingLight += vec3( 0.03, 0.2, 0.75 ) * seaHealed.y * whole * ( 1.0 - reflectance );
	}

	// Slowing the boat is the work of the weaker channellers (the owner's). They do not weave out
	// towards Hawai'i but down: plaits laid in rings close round the boat, just under the level of
	// the sea, holding the water there against the current. They are behind and beneath the viewer,
	// so little of them is in the picture. They are not painted over the sea: the sea is still the
	// sea, with its own waves and ripples, and the plaits duck in and out of it. In a trough the
	// water has fallen away below a plait and it stands clear, sharp and bright; under a crest it is
	// beneath the surface, seen through moving water, dim, bluer and shifted about by the ripples.
	if ( deepWeave > 0.0 ) {
		float reach = mix( 24.0, 70.0, deepMaster );
		vec2 fromBoat = worldPosition.xz - channelBoat;
		if ( length( fromBoat ) < reach + 12.0 ) {
			// How far this piece of water is below a plait (1, in a trough) or above it (0, on a crest).
			float clear = 1.0 - smoothstep( - 0.12, 0.1, vCrest );
			// Under water, what is seen is shifted by the tilt of the surface; clear of it, it is not.
			vec2 seen = fromBoat + surfaceNormal.xz * 9.0 * ( 1.0 - clear );
			float r = length( seen );
			float bearing = atan( seen.y, seen.x );
			float near = 1.0 - smoothstep( 0.55 * reach, reach, r );
			float plaits = 0.0;
			for ( int i = 0; i < 5; i ++ ) {
				float n = float( i );
				float way = mod( n, 2.0 ) < 0.5 ? 1.0 : - 1.0;
				// The rings are wider apart, and reach further, when the strongest are at the work.
				float ring = 4.5 + ( 3.6 + 7.5 * deepMaster ) * n;
				float turn = bearing * ( 3.0 + n ) + channelTime * 0.3 * way;
				// A plait of three strands: each wavers in and out a third of a turn after the last.
				float fine = mix( 0.2, 0.06, clear ) * ( 1.0 + 0.03 * ring );
				float strands = 0.0;
				for ( int j = 0; j < 3; j ++ ) {
					float d = r - ring - ( 0.7 + 0.03 * ring ) * sin( turn + float( j ) * 2.0944 );
					strands += exp( - d * d / fine );
				}
				float lit = 0.5 + 0.5 * sin( bearing * ( 7.0 + 3.0 * n ) - channelTime * 0.7 * way );
				plaits += strands * lit / ( 1.0 + 0.25 * n );
			}
			// Clear of the water a plait is pale and bright; under it, a deep blue and a quarter as bright.
			vec3 plaitTone = mix( vec3( 0.16, 0.36, 1.0 ) * 0.3, vec3( 0.78, 0.9, 1.0 ), clear );
			// (In the trial the strongest's plaits leak almost nothing: they are seen only faintly.)
			outgoingLight += plaitTone * plaits * 1.4 * ( 1.0 - 0.75 * deepMaster * channelLoss ) * deepWeave * near * ( 1.0 - foamMask ) * mix( 1.0 - reflectance, 1.0, clear );
			outgoingLight += vec3( 0.03, 0.09, 0.34 ) * exp( - r * r / 110.0 ) * deepWeave * ( 1.0 - reflectance ) * ( 1.0 - foamMask );

			// Now and then the strongest take this work over themselves, the pilgrimage being so
			// sacred (the owner's). They weave akasha with water, earth and air, and the sea about the
			// boat is dappled as where salt water meets fresh. It must stay the real sea (a first
			// version laid a marbled pattern over it and lost that). So nothing is drawn on the water:
			// the light comes from the weaving at the boat and falls on the waves that are there. Each
			// wave face and ripple turned towards the boat catches it and the far faces stay dark;
			// the thin tops of waves let it through. What dapples it is the water itself: it lies in
			// broad slow-moving bodies, fresher and saltier, and each takes the light differently
			// (the fresh paler and greener, the salt a deeper blue), with a line of brightness where
			// two bodies meet, as a line of foam gathers there.
			if ( deepMaster > 0.0 ) {
				float t = channelTime;
				float body = texture2D( normalSampler, fromBoat / 95.0 + vec2( t * 0.003, - t * 0.002 ) ).r
					+ 0.5 * texture2D( normalSampler, fromBoat / 41.0 - vec2( t * 0.004, t * 0.003 ) + 0.37 ).g - 0.25;
				// (The bodies have no edges: one shades into the next over tens of metres.)
				float fresh_ = smoothstep( 0.25, 0.75, body );
				float meeting_ = exp( - pow( ( body - 0.5 ) / 0.06, 2.0 ) );
				// The light is at the boat, low: faces of the real surface turned to it are lit.
				// What is lit is decided by the surface alone: how far each facet of it, wave or ripple,
				// leans towards the boat. Flat water and faces leaning away get nothing.
				float lean = dot( surfaceNormal.xz, - normalize( fromBoat + 1e-4 ) );
				float facing = smoothstep( 0.04, 0.45, lean );
				float through = smoothstep( 0.0, 0.5, vCrest );
				vec3 salt = vec3( 0.2, 0.4, 0.95 );
				vec3 sweet = vec3( 0.62, 0.9, 0.78 );
				vec3 tone = mix( salt, sweet, fresh_ );
				// Rings of brightness travelling out from the boat, gently.
				float rings = 0.75 + 0.25 * sin( r * 0.5 - t * 1.2 );
				float falloff = near / ( 1.0 + r / 30.0 );
				outgoingLight += ( tone * ( 0.03 + 1.5 * facing + 0.5 * through ) + vec3( 1.0, 0.98, 0.93 ) * 0.5 * meeting_ * facing )
					* rings * 0.6 * ( 1.0 - channelLoss ) * deepMaster * deepWeave * falloff * ( 1.0 - 0.6 * reflectance ) * ( 1.0 - foamMask );
			}
		}
	}

	// The small boat's electric lamps: a little warm light on the water close round it.
	if ( boatLamp > 0.0 ) {
		vec2 fromBoat = worldPosition.xz - channelBoat;
		outgoingLight += vec3( 1.0, 0.76, 0.48 ) * boatLamp * exp( - dot( fromBoat, fromBoat ) / 320.0 ) * ( 0.3 + 0.7 * ( 1.0 - reflectance ) + foamMask );
	}

	// The weave under the sea: threads of light fanning out from below the knot and running under
	// the viewer, seen through the moving surface, with pulses that travel out along them.
	if ( weaveGlow > 0.0 ) {
		// Looking through a tilted surface shifts what is seen below it.
		vec2 under = worldPosition.xz + surfaceNormal.xz * 16.0 - weaveCentre;
		float radius = max( length( under ), 1.0 );
		float bearing = atan( under.y, under.x );
		float threads = 0.0;
		for ( int i = 0; i < 4; i ++ ) {
			float n = float( i );
			float count = 9.0 + n * 7.0;
			// Each thread wanders as it goes out, the finer sets more than the heavier.
			float across = bearing * count / 6.28319 + 0.3 * ( 1.0 + n ) * sin( radius * 0.004 * ( 1.0 + n ) + n * 1.7 ) + n * 0.37;
			float offLine = abs( fract( across ) - 0.5 ) * 6.28319 / count * radius;
			// Thin close by; widened with distance so far threads do not break up into dots.
			float thickness = ( 0.7 + 0.5 * n ) * ( 1.0 + distance * 0.012 );
			float pulse = 0.3 + 0.7 * pow( 0.5 + 0.5 * sin( radius * 0.02 * ( 1.0 + 0.3 * n ) - waveTime * ( 2.0 + n * 0.7 ) + n ), 6.0 );
			threads += exp( - offLine * offLine / ( thickness * thickness ) ) * pulse / ( 1.0 + distance * 0.004 );
		}
		// Light from below comes through where the surface is not acting as a mirror, and not through foam.
		outgoingLight += vec3( 0.78, 0.95, 1.0 ) * threads * weaveGlow * ( 1.0 - reflectance ) * ( 1.0 - foamMask );
	}

	// Manulani's light: a sphere of light she has raised high over the sea, a small sun at night.
	// It lights the sea as any one bright point does: each place by how squarely it faces the
	// sphere, and by the inverse square of how far it is, here given as a share of the light
	// straight beneath it. So within some kilometres of beneath it it is near noon, the sea's own
	// blue-green coming up out of it, the foam white, the thin tops of the waves lit through,
	// facets turned to it flashing; and further out it falls away, until at the horizon it is night.
	if ( manuLight.w > 0.0 ) {
		vec3 toLight = manuLight.xyz - worldPosition.xyz;
		float r2 = dot( toLight, toLight );
		vec3 toward = toLight * inversesqrt( r2 );
		float overhead = manuLight.y - worldPosition.y;
		float fall = overhead * overhead / r2;
		float facing = max( dot( surfaceNormal, toward ), 0.0 );
		float lit = manuLight.w * fall * facing;
		vec3 noon = vec3( 1.0, 0.97, 0.9 );
		outgoingLight += noon * lit * ( vec3( 0.03, 0.13, 0.17 ) * ( 1.0 - reflectance ) + 0.55 * foamMask );
		outgoingLight += vec3( 0.12, 0.95, 0.78 ) * 0.12 * lit * thinWater * ( 1.0 - reflectance );
		vec3 bounce = reflect( - eyeDirection, surfaceNormal );
		outgoingLight += noon * manuLight.w * fall * ( 1.5 * pow( max( dot( bounce, toward ), 0.0 ), 600.0 ) ) * reflectance * ( 1.0 - foamMask );
	}
`;

export function replaceOrThrow(source: string, search: string, replacement: string) {
	if (!source.includes(search)) throw new Error(`Water shader patch: "${search}" not found`);
	return source.replace(search, replacement);
}

export function addGerstnerWaves(water: Water): GerstnerUniforms {
	const material = water.material;
	const uniforms: GerstnerUniforms = {
		shoreMap: { value: null },
		shoreAt: { value: new THREE.Vector4() },
		shoreTurn: { value: new THREE.Vector2(1, 0) },
		shoreSurf: { value: 0 },
		waveTime: { value: 0 },
		waveSteepness: { value: 0.2 },
		waveScale: { value: 1 },
		waves: { value: Array.from({ length: TRAIN_COUNT }, () => new THREE.Vector4(0, 0, 0, 1)) },
		waveWind: { value: new Array<number>(TRAIN_COUNT).fill(0) },
		waveForm: { value: Array.from({ length: TRAIN_COUNT }, () => new THREE.Vector4(0, -1, 1, 1)) },
		waveFade: { value: new Array<number>(TRAIN_COUNT).fill(1) },
		crestWarp: { value: 1 },
		windHeading: { value: new THREE.Vector2(0, -1) },
		windDrift: { value: 14 },
		ripple: { value: 1 },
		channelBoat: { value: new THREE.Vector2() },
		channelTime: { value: 0 },
		channelWind: { value: new THREE.Vector2() },
		channelSea: { value: new THREE.Vector2(0.3, 2) },
		channelFeed: { value: 0 },
		channelLoss: { value: 0 },
		channelGate: { value: new THREE.Vector4(1, 1, 1, 1) },
		channelOwn: { value: new THREE.Vector4(0.58, 0.82, 1, 0.42) },
		deepWeave: { value: 0 },
		deepMaster: { value: 0 },
		channelHead: { value: new THREE.Vector4() },
		channelTail: { value: new THREE.Vector4(2, 2, 2, 2) },
		channelLinger: { value: new THREE.Vector4() },
		channelControl: { value: 0 },
		channelHold: { value: 0 },
		channelCurrent: { value: 0 },
		channelBack: { value: 0 },
		channelSurge: { value: 0 },
		channelStream: { value: 0 },
		channelLink: { value: 1 },
		channelInto: { value: new THREE.Vector4(0.5, 0.5, 0.5, 0.5) },
		channelReading: { value: 0 },
		channelHeal: { value: 0 },
		healed: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] },
		channelBalm: { value: 0 },
		channelBalmGlow: { value: 0 },
		pressed: { value: Array.from({ length: 12 }, () => new THREE.Vector4()) },
		pressedAny: { value: 0 },
		pressGlow: { value: 0 },
		stillFront: { value: new THREE.Vector4() },
		stillAhead: { value: new THREE.Vector2(0, -1) },
		stillSea: { value: new THREE.Vector4(1, 0, 0, 0) },
		stillGlow: { value: 0 },
		seaHealed: { value: new THREE.Vector2() },
		boatLamp: { value: 0 },
		channelLight: { value: 0 },
		foam: { value: 0 },
		gustiness: { value: 0.8 },
		surge: { value: 0 },
		weaveCentre: { value: new THREE.Vector2() },
		weavePull: { value: 0 },
		gustSwirl: { value: 0 },
		weaveGlow: { value: 0 },
		freshFlow: { value: 1 },
		internalWaves: { value: 0.6 },
		lensWaves: { value: Array.from({ length: LENS_TRAINS }, () => new THREE.Vector4(0, 0, 0, 200)) },
		lensAmount: { value: 0 },
		lensCurrent: { value: new THREE.Vector4() },
		manuLight: { value: new THREE.Vector4() },
		crestLimit: { value: 1 },
		strikeRings: { value: Array.from({ length: STRIKE_RINGS }, () => new THREE.Vector4(0, 0, 0, 0)) },
		partFront: { value: new THREE.Vector4(0, 0, 0, -1) },
		partShape: { value: new THREE.Vector4(0, 0, 0, 0) },
		partSwell: { value: new THREE.Vector2(0.0124, 0.35) },
		partMore: { value: new THREE.Vector4() },
	};
	useDialSea(uniforms);
	Object.assign(material.uniforms, uniforms, { giantWaves: { value: GIANT_WAVES } });

	let vertex = material.vertexShader;
	vertex = replaceOrThrow(vertex, "#include <common>", `#include <common>\n${vertexPars}`);
	vertex = replaceOrThrow(vertex, "gl_Position = projectionMatrix * mvPosition;", vertexMain);

	let fragment = material.fragmentShader;
	fragment = replaceOrThrow(fragment, "#include <common>", `#include <common>\n${fragmentPars}`);
	fragment = replaceOrThrow(fragment, "vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );", fragmentNormal);
	// The stock single highlight is replaced by a broad one and a tight, bright one: sheen and glitter.
	fragment = replaceOrThrow(
		fragment,
		"sunLight( surfaceNormal, eyeDirection, 100.0, 2.0, 0.5, diffuseLight, specularLight );",
		"sunLight( surfaceNormal, eyeDirection, 60.0, 1.2, 0.5, diffuseLight, specularLight );\n\tsunLight( surfaceNormal, eyeDirection, 420.0, 5.0, 0.0, diffuseLight, specularLight );",
	);
	fragment = replaceOrThrow(fragment, "vec3 outgoingLight = albedo;", fragmentFoam);

	material.vertexShader = vertex;
	material.fragmentShader = fragment;
	material.needsUpdate = true;
	return uniforms;
}

// Plane in the xy plane (rotate -90° about x for water) with vertices packed towards the centre:
// a vertex at grid coordinate u in -1..1 is placed at radius * sign(u) * |u|^3.
// Gives sub-unit spacing in front of the camera and a single mesh out to the horizon.
export function createFocusedPlane(radius: number, segments: number) {
	const geometry = new THREE.PlaneGeometry(2, 2, segments, segments);
	const position = geometry.attributes.position!;
	const warp = (u: number) => radius * Math.sign(u) * Math.abs(u) ** 3;
	for (let i = 0; i < position.count; i++) {
		position.setXY(i, warp(position.getX(i)), warp(position.getY(i)));
	}
	geometry.computeBoundingSphere();
	return geometry;
}
