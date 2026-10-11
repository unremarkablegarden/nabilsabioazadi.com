// The storm is a story that repeats. It opens on rough water. Threads of light then rise from the
// viewer into the sky and are woven into a knot there, and the weather answers: cloud, fog, rain,
// lightning and giant swells, until it is too much to hold and everything cancels out into a
// still, empty white. The rough water then slowly returns.
import { MathUtils } from "three";

// Seconds from the start of the cycle.
const WEAVE_START = 10;
const WEAVE_END = 32;
const BUILD_START = 20;
const BUILD_END = 80;
const PEAK_END = 100;
const WHITE_OUT = 103;
const WHITE_END = 106;
const VOID_SETTLED = 112;
const VOID_END = 125;
export const STORM_CYCLE_LENGTH = 150;

// How much of the picture the veil still covers once the white-out has settled into the void.
const VOID_VEIL = 0.88;

export interface StormMoment {
	// 0..1 how far the weave of light has been drawn: threads first, then the knot in the sky.
	weave: number;
	// 0..1 how far the storm has been worked up beyond the rough sea.
	fury: number;
	// 0..1 how completely everything has cancelled out: flat water, no wind, no rain.
	stillness: number;
	// 0..1 opacity of the veil over the whole picture.
	veil: number;
	// 0..1 how white the veil is, as opposed to the colour of the mist.
	white: number;
}

export function stormMoment(t: number): StormMoment {
	const { smoothstep, lerp } = MathUtils;
	const weave = smoothstep(t, WEAVE_START, WEAVE_END);
	if (t < PEAK_END) return { weave, fury: smoothstep(t, BUILD_START, BUILD_END), stillness: 0, veil: 0, white: 0 };
	// The switch from full storm to stillness happens behind the opaque white.
	if (t < WHITE_OUT) return { weave, fury: 1, stillness: 0, veil: smoothstep(t, PEAK_END, WHITE_OUT) ** 2, white: 1 };
	if (t < WHITE_END) return { weave: 0, fury: 0, stillness: 1, veil: 1, white: 1 };
	const settle = smoothstep(t, WHITE_END, VOID_SETTLED);
	if (t < VOID_END) return { weave: 0, fury: 0, stillness: 1, veil: lerp(1, VOID_VEIL, settle), white: 1 - settle };
	return {
		weave: 0,
		fury: 0,
		stillness: 1 - smoothstep(t, VOID_END, STORM_CYCLE_LENGTH - 5),
		veil: VOID_VEIL * (1 - smoothstep(t, VOID_END, STORM_CYCLE_LENGTH)),
		white: 0,
	};
}
