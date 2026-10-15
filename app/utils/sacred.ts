// The big weave, at ?sky=sacred (the owner, 16 October: "all the channellers immediately
// overcommand the weather conditions completely with new, complex weaves of your own design...
// then create waves that hold and suspend above them while they channel a sacred weave that
// involves all six elements"; and then: "familiarise yourself with the work of Virginia Woolf,
// create a kind of thermodynamic logic around what her idea of a big weave would be, and try
// again").
//
// Woolf's big weave. In "A Sketch of the Past" she says that behind the cotton wool of ordinary
// days a pattern is hidden, that all of us are connected with it, that the whole world is a work
// of art and we are parts of it. Most of a day is non-being; the pattern shows only in moments.
// In The Waves six lives are spoken side by side while the sea breaks through a whole day, and
// twice they come together round a flower on a dinner table: at the farewell dinner it is a
// seven-sided flower, with Percival among them, "a whole flower to which every eye brings its own
// contribution"; at the reunion at Hampton Court it is six-sided, made of six lives. Then they
// part, and it goes. In To the Lighthouse Mrs Ramsay's dinner coheres for an evening, and the
// house is left to the wind and the damp for ten years.
//
// Read as thermodynamics (mine, Claude's): a moment of being is order made locally, against the
// drift of everything towards disorder. Order of that kind cannot be ordered into being, and it
// cannot be kept by holding still. It stands only while energy flows through it from something
// hotter to something colder, as a flame stands, or a whirlpool, or a breaking wave, whose shape
// stays while the water passes through it: what Prigogine called a dissipative structure. And
// when a layer of fluid is heated from below past a threshold, the heat stops creeping through
// it and begins to carry itself in rolling cells, which meet in rough hexagons (Bénard cells): a
// six-sided flower that nobody draws, made by the flow. It lasts while the heat flows, and goes
// when it stops. So, for this weave:
//   - Nothing is destroyed, only turned (the first law). The storm's wind and sea are the energy
//     there is. The channellers do not switch the storm off: they draw its energy in.
//   - The wind's energy goes into the sea. The held waves rise only as fast as the wind is taken
//     out of the air: they are where the storm now is, held up as height.
//   - The flower is fed from the waves: water drawn off their lips runs into the braid, and as
//     the flower is held the waves are slowly spent, lower and lower.
//   - Its waste goes to the cold. The opened sky is the coldest thing there is, and the flower
//     gives off its heat up into it, a few threads at a time, lost among the stars. The earth
//     element gives back what it can to the sea, spreading over it.
//   - It lasts as long as the storm had energy to give (an 18 m sea gives minutes; a calm day a
//     few breaths), then comes apart: the petals open out and go, the waves are let fall and
//     break, and the weather comes back in from the sea all round, as weather does.
//
// What happens, in order:
// I.  The strongest goes first and alone into anything out of the ordinary: one white thread out
//     into the storm, upwind, to feel how much it holds. Then all thirteen:
//       the Stilling  a long tress from each, laid out low over the sea, the thirteen winding out
//                     in one slow spiral turned against the storm's turning; along it the light
//                     runs inward, to the boat: the wind's energy drawn in.
//       the Combing   tresses drawn up through the rain, fanned like the tines of a comb across
//                     the sky: the rain goes back up as vapour, and the cloud breaks.
// II. The held sea: the energy drawn in raises great waves all round the boat, open ahead, held
//     at the moment before they break, curled in towards the boat. Water still runs in them.
// III. The six-sided flower. The six elements are six of the lives in The Waves, each with its
//     own temperament (the thirteen each give all six):
//       Bernard, akasha: the phrase-maker, who sums them all up: wound round the rest, binding;
//                        his petal the widest and faintest.
//       Neville, air:    clear, cutting, precise: his petal blown downwind and kept.
//       Rhoda, water:    the pool, the faceless one, dissolving: her petal heavy, falling back.
//       Jinny, fire:     the body, light, movement: her petal tall and narrow; the warmth that
//                        rises up the braid in slow pulses is hers.
//       Susan, earth:    the fields, rooted: her petal low and wide, and her roots spread out
//                        over the sea.
//       Louis, metal:    iron, order, the ring of steel: the braid's spine; his petal flat and still.
//     All six rise in one braid five hundred metres ahead, an updraught; at the top each turns
//     over in its own rolling cell, out and down and back in, as a Bénard cell does: rising at the
//     braid, sinking at the rim. Six petals, none alike, none quite where the others leave room:
//     a flower made by the flow, not drawn. The strongest's threads, white, make a seventh, under
//     them all: the flower is seven-sided while they are in it, as it was with Percival at the
//     farewell dinner.
import * as THREE from "three";
import type { SeaConditions } from "./manawatawhi";
import { pixelRatio, ribbonShaderChunk, stripIndices, tameShaderChunk, WEAVE_RENDER_ORDER } from "./weave";

// The weather once the storm's energy has been drawn in: a light air, a smooth sea, no rain, a
// clear sky with a little high cloud, the pressure steady. (The periods and directions are left
// as they were: changing those would make the swell jump.)
export const STILLED: Partial<SeaConditions> = {
	windSpeed: 5,
	windGusts: 7,
	windTrend: 0,
	pressure: 1016,
	pressureTrend: 0.5,
	waveHeight: 0.5,
	swellHeight: 0.45,
	secondSwellHeight: 0,
	windWaveHeight: 0.15,
	waveTrend: 0,
	weatherCode: 1,
	cape: 0,
	precipitation: 0,
	cloudCover: 12,
	cloudLow: 0,
	cloudMid: 5,
	cloudHigh: 30,
	visibility: 40_000,
};

// Their slow breathing, in seconds a breath.
const BREATH = 9;

// Where each part is, from the seconds since it began and the weather they draw on (the
// measured or channelled weather, before they have it).
export function sacredAt(seconds: number, storm: Pick<SeaConditions, "waveHeight" | "windSpeed">) {
	const { smoothstep, clamp } = THREE.MathUtils;
	// How long the flower can be held: as long as the storm has energy to feed it.
	const hold = clamp(30 + 7 * storm.waveHeight + 0.25 * storm.windSpeed, 45, 220);
	const spent = 74 + hold;
	const cycle = spent + 90;
	const t = Math.max(0, seconds) % cycle;
	const fall = smoothstep(t, spent, spent + 7);
	return {
		seconds: t,
		// 0..1 how far the weather is theirs; given back once the flower is spent.
		command: smoothstep(t, 6, 32) * (1 - smoothstep(t, spent + 15, spent + 75)),
		// 0..1 how far their ordinary weaving has given way to this.
		quiet: smoothstep(t, 0, 6) * (1 - smoothstep(t, spent + 20, spent + 40)),
		first: smoothstep(t, 0.5, 6),
		firstGone: smoothstep(t, 12, 20),
		stilling: smoothstep(t, 4, 18),
		stillingGone: smoothstep(t, 30, 40),
		combing: smoothstep(t, 10, 22),
		combingGone: smoothstep(t, 34, 44),
		// How far out from the boat the rain has gone back up, in metres (-1: not): see rain.ts.
		rainFront: t >= 13 && t < 70 ? (t - 13) * 14 : -1,
		// The waves rise as the wind is taken out of the air, are spent as they feed the flower, and
		// are let fall when it is done.
		waves: smoothstep(t, 14, 42) * (1 - 0.55 * smoothstep(t, 62, spent)) * (1 - fall),
		fall: fall * (1 - smoothstep(t, spent + 7, spent + 22)),
		holding: smoothstep(t, 12, 26),
		holdingGone: smoothstep(t, spent - 1, spent + 3),
		strands: smoothstep(t, 40, 54),
		braid: smoothstep(t, 48, 60),
		bloom: smoothstep(t, 56, 72),
		roots: smoothstep(t, 50, 66),
		drawn: smoothstep(t, 58, 70),
		// The flower coming apart.
		undone: smoothstep(t, spent + 2, spent + 22),
		// How big the storm was: the waves it can raise.
		scale: clamp(0.35 + (0.65 * storm.waveHeight) / 12, 0.35, 1),
		// -1..1 the breath, eased in once the weave is up.
		breath: Math.sin((t / BREATH) * Math.PI * 2) * smoothstep(t, 60, 75),
	};
}

// The held waves: the bearing of each from straight ahead (radians, right positive), how far out
// it stands, how tall it is held at most, and how wide it runs (radians). Open ahead, where the
// strands go out to the braid.
const WAVES: [number, number, number, number][] = [
	[-0.5, 240, 58, 0.62],
	[0.52, 225, 62, 0.6],
	[-1.25, 180, 52, 0.7],
	[1.28, 188, 50, 0.7],
	[-2.05, 165, 46, 0.75],
	[2.1, 170, 46, 0.75],
	[3.14, 175, 50, 0.9],
];
const WAVE_COUNT = WAVES.length;
// Where the braid stands: this far straight ahead, and this tall.
const FOOT = 520;
const BRAID = 95;
const SEATS = 13;
const STRONGEST = 2;

// Shared by the threads and the waves: where the channellers' hands are, and the held waves' shape.
const common = /* glsl */ `
uniform float uTime;
uniform vec3 uBoat;
uniform vec2 uAhead;
uniform float uWaveRise;
uniform float uBreath;
uniform vec4 uWaves[ ${WAVE_COUNT} ];

vec3 aheadDir() { return vec3( uAhead.x, 0.0, uAhead.y ); }
vec3 acrossDir() { return vec3( - uAhead.y, 0.0, uAhead.x ); }
vec3 bearing( float a ) { return aheadDir() * cos( a ) + acrossDir() * sin( a ); }

// The four at the front stand along the rail; the other nine behind them down both sides.
vec3 seatAt( float who ) {
	if ( who < 3.5 ) return uBoat + acrossDir() * ( who - 1.5 ) * 1.5 + vec3( 0.0, - 1.2, 0.0 ) + aheadDir() * 0.5;
	float k = who - 4.0;
	float side = mod( k, 2.0 ) * 2.0 - 1.0;
	float back = floor( k / 2.0 );
	return uBoat + acrossDir() * side * ( 2.2 + 0.2 * back ) + vec3( 0.0, - 1.6, 0.0 ) - aheadDir() * ( 1.0 + 1.6 * back );
}

// A held wave: along its crest u, up its face from the sea to the lip v, both 0..1. Not a dome:
// a long ridge, peaking off its middle where it is steepest and curls furthest in towards the
// boat, as a wave held while it peels along its length. Water still moves in it: the whole leans
// and the lip stirs, slowly.
vec3 wavePoint( int i, float u, float v ) {
	vec4 w = uWaves[ i ];
	float a = w.x + ( u - 0.5 ) * w.w;
	float peakAt = 0.3 + 0.4 * fract( float( i ) * 0.618 );
	float peak = exp( - pow( ( u - peakAt ) / 0.22, 2.0 ) );
	float ridge = ( 0.35 + 0.65 * peak ) * ( 0.85 + 0.15 * sin( u * 9.0 + float( i ) ) );
	float H = w.z * uWaveRise * ridge * smoothstep( 0.0, 0.2, u ) * smoothstep( 1.0, 0.8, u ) * ( 1.0 + 0.015 * uBreath );
	float R = w.y + 6.0 * sin( u * 7.0 + float( i ) * 2.0 + uTime * 0.13 );
	// The face, as a cubic from the foot (0, 0) to the curled lip, in (outward, up).
	vec2 p0 = vec2( 0.0 ), p1 = vec2( 0.22, 0.6 ), p2 = vec2( 0.06, 1.25 ), p3 = vec2( - 0.35 - 0.7 * peak, 0.9 - 0.3 * peak );
	p3.x -= 0.06 * sin( u * 11.0 + uTime * 0.21 + float( i ) );
	float s = 1.0 - v;
	vec2 q = s * s * s * p0 + 3.0 * s * s * v * p1 + 3.0 * s * v * v * p2 + v * v * v * p3;
	q.x += 0.04 * v * sin( uTime * 0.17 + float( i ) * 1.3 );
	return vec3( uBoat.x, - 3.0, uBoat.z ) + bearing( a ) * ( R + q.x * H ) + vec3( 0.0, q.y * H + 3.0 * v, 0.0 );
}
`;

// ---- The threads ---------------------------------------------------------------------------
// Kinds: 0 the strongest's first thread; 1 the Stilling; 2 the Combing; 3 holding the waves;
// 4 the six strands, the braid and the flower; 5 earth's roots; 6 water drawn from the waves.
const threadVertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute vec4 aSeed;
attribute float aWho;
uniform float uKind;
uniform float uGrow;
uniform float uGone;
uniform float uOpen;
uniform float uSpin;
uniform vec3 uWindDir;
uniform vec3 uTints[ 8 ];
uniform float uWidth;
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;
varying float vPulse;
${common}
${ribbonShaderChunk}
${tameShaderChunk}

vec3 bezier( vec3 a, vec3 b, vec3 c, vec3 d, float t ) {
	float s = 1.0 - t;
	return s * s * s * a + 3.0 * s * s * t * b + 3.0 * s * t * t * c + t * t * t * d;
}

vec3 footAt() { return vec3( uBoat.x, 3.0, uBoat.z ) + aheadDir() * ${FOOT}.0; }

// Where the middle of the braid is at height h (0..1). It leans a little with what air there is.
vec3 braidAxis( float h ) {
	return footAt() + vec3( 0.0, h * ${BRAID}.0, 0.0 ) + uWindDir * 14.0 * h * h + acrossDir() * 5.0 * sin( h * 4.0 + uTime * 0.11 );
}

// The six (and the strongest's, 6): 0 akasha, 1 air, 2 water, 3 fire, 4 earth, 5 metal.
vec3 braidPoint( float element, float h, float phase ) {
	float r = element > 4.5 && element < 5.5 ? 1.2 : element < 0.5 || element > 5.5 ? 8.0 : 4.5;
	r *= 1.0 + 0.12 * uBreath;
	// Akasha, and the strongest, wind the other way round, binding the rest.
	float turn = element < 0.5 || element > 5.5 ? - 5.0 : 7.0;
	float a = element * 1.047 + phase + h * turn - uTime * 0.3;
	return braidAxis( h ) + ( acrossDir() * cos( a ) + aheadDir() * sin( a ) ) * r;
}

// Each element's rolling cell at the top of the braid: how far out it reaches, how tall it is,
// and how high its middle stands against the braid's top (in metres).
vec3 cellOf( float element ) {
	if ( element < 0.5 ) return vec3( 58.0, 36.0, 6.0 );
	if ( element < 1.5 ) return vec3( 46.0, 38.0, 4.0 );
	if ( element < 2.5 ) return vec3( 40.0, 44.0, - 10.0 );
	if ( element < 3.5 ) return vec3( 20.0, 62.0, 20.0 );
	if ( element < 4.5 ) return vec3( 52.0, 26.0, - 18.0 );
	if ( element < 5.5 ) return vec3( 42.0, 18.0, - 2.0 );
	return vec3( 75.0, 28.0, - 6.0 );
}

// Along an element's cell, s 0..1: out of the braid, up, over and out, down at the rim and back in,
// as a convection cell turns; phi its own bearing. Some threads leave it at the top and go up into
// the cold sky: the heat it gives off.
vec3 cellPoint( float element, float s, float phi, float open ) {
	vec3 size = cellOf( element ) * ( 0.85 + 0.3 * aSeed.w );
	vec3 d = acrossDir() * cos( phi ) + aheadDir() * sin( phi );
	vec3 inner = braidAxis( 0.85 );
	vec3 centre = inner + d * size.x * open + vec3( 0.0, size.z * open, 0.0 );
	// Air's is carried off downwind.
	if ( element > 0.5 && element < 1.5 ) centre += uWindDir * 40.0 * open;
	// (Not closed: it turns over and sinks, and is lost before it comes back in.)
	float th = s * 6.28318 * 0.8;
	float a = size.x * open * ( 1.0 + 0.15 * sin( th * 3.0 + aSeed.y * 6.0 + uTime * 0.07 ) );
	float b = size.y * open * ( 1.0 + 0.15 * sin( th * 2.0 + aSeed.w * 6.0 ) );
	vec3 p = centre - d * a * cos( th ) + vec3( 0.0, b * sin( th ), 0.0 );
	if ( aSeed.w > 0.82 && s > 0.25 ) {
		// Given off upward from the top of the cell, into the cold.
		vec3 top = centre + vec3( 0.0, b, 0.0 );
		p = top + vec3( 0.0, ( s - 0.25 ) * 260.0, 0.0 ) + d * ( s - 0.25 ) * 40.0;
	}
	return p;
}

// The centre of this filament's tress at t (0..1 from the hands).
vec3 path( float t ) {
	float who = aWho;
	if ( uKind < 0.5 ) {
		// The strongest's first thread, out upwind into the storm and up.
		vec3 d = normalize( mix( aheadDir(), - uWindDir, 0.45 ) + vec3( 1e-4 ) );
		return seatAt( ${STRONGEST}.0 ) + d * 380.0 * t + vec3( 0.0, 130.0 * t * t, 0.0 ) + acrossDir() * sin( t * 5.0 + uTime * 0.3 ) * 22.0 * t;
	}
	if ( uKind < 1.5 ) {
		// The Stilling: out low and winding, all thirteen in one spiral against the storm's turning.
		vec3 seat = seatAt( who );
		float r = 4.0 + 680.0 * pow( t, 1.3 );
		float a = who / ${SEATS}.0 * 6.28318 + uSpin + t * 3.4;
		vec3 low = vec3( uBoat.x, 5.0 + 22.0 * t * ( 1.0 - t ), uBoat.z ) + ( acrossDir() * cos( a ) + aheadDir() * sin( a ) ) * r;
		return mix( seat, low, smoothstep( 0.0, 0.08, t ) );
	}
	if ( uKind < 2.5 ) {
		// The Combing: up through the rain to the cloud, fanned across the sky and drawn slowly over it.
		float a = ( who / ${SEATS - 1}.0 - 0.5 ) * 1.5 + 0.25 * sin( uTime * 0.06 );
		return seatAt( who ) + bearing( a ) * 950.0 * t + vec3( 0.0, 270.0 * t * t, 0.0 );
	}
	if ( uKind < 3.5 ) {
		// Holding a wave: from the rail out and up to the middle of its lip.
		int i = int( who );
		vec3 seat = seatAt( mod( who * 3.0, ${SEATS}.0 ) );
		vec3 lip = wavePoint( i, 0.5, 0.97 );
		return bezier( seat, seat + ( lip - seat ) * 0.35 + vec3( 0.0, - 8.0, 0.0 ), lip + ( seat - lip ) * 0.25 - vec3( 0.0, 4.0, 0.0 ), lip, t );
	}
	if ( uKind < 4.5 ) {
		// The flower: element = who, the seat from the filament's own seed. The strongest's are a
		// seventh of their own.
		float seat = floor( aSeed.x * ${SEATS}.0 );
		float element = seat == ${STRONGEST}.0 ? 6.0 : who;
		float phase = aSeed.y * 0.8;
		vec3 base = braidPoint( element, 0.0, phase );
		if ( t < 0.32 ) {
			vec3 from = seatAt( seat );
			return bezier( from, from + aheadDir() * 60.0 + vec3( 0.0, - 10.0, 0.0 ), base - aheadDir() * 120.0 + vec3( 0.0, 4.0, 0.0 ), base, t / 0.32 );
		}
		if ( t < 0.7 ) return braidPoint( element, 0.85 * ( t - 0.32 ) / 0.38, phase );
		// Six petals, none where the others leave room for it: each element its own bearing, a
		// little off the even sixths, turning slowly round the braid.
		float phi = element * 1.047 + 0.35 * sin( element * 2.3 ) + ( aSeed.z - 0.5 ) * 0.3 + uTime * 0.015;
		vec3 cell = cellPoint( element, ( t - 0.7 ) / 0.3, phi, uOpen );
		// (Joined smoothly to the braid where it leaves it.)
		return mix( braidPoint( element, 0.85, phase ), cell, smoothstep( 0.7, 0.74, t ) );
	}
	if ( uKind < 5.5 ) {
		// Earth's roots, over the surface of the sea from the foot of the braid.
		vec3 from = footAt();
		float phi = aSeed.z * 6.28318;
		vec3 d = acrossDir() * cos( phi ) + aheadDir() * sin( phi );
		vec3 side = acrossDir() * cos( phi + 1.57 ) + aheadDir() * sin( phi + 1.57 );
		float reach = 160.0 + 120.0 * aSeed.x;
		return vec3( from.x, 1.2, from.z ) + d * reach * t + side * sin( t * 6.0 + aSeed.w * 9.0 ) * 18.0 * t;
	}
	// Water drawn off a held wave's lip into the braid: what feeds the flower.
	int i = int( who );
	vec3 lip = wavePoint( i, 0.3 + 0.4 * aSeed.x, 0.97 );
	vec3 into = braidAxis( 0.3 + 0.3 * aSeed.y );
	return bezier( lip, lip + vec3( 0.0, 30.0, 0.0 ), into + vec3( 0.0, 40.0, 0.0 ) - aheadDir() * 80.0, into, t );
}

// How far this filament stands from the middle of its tress at t.
float spread( float t ) {
	if ( uKind < 0.5 ) return 0.3 + 7.0 * t;
	if ( uKind < 1.5 ) return 0.25 + 16.0 * t;
	if ( uKind < 2.5 ) return 0.25 + 22.0 * t;
	if ( uKind < 3.5 ) return 0.2 + 3.0 * t;
	if ( uKind < 4.5 ) return t < 0.32 ? 0.15 + 1.5 * sin( 3.14159 * t / 0.32 ) : t < 0.7 ? 0.6 : 0.6 + 3.0 * ( t - 0.7 );
	if ( uKind < 5.5 ) return 0.2 + 2.0 * t;
	return 0.3 + 2.0 * sin( 3.14159 * t );
}

vec3 strand( float t ) {
	vec3 here = path( t );
	vec3 next = path( min( t + 0.004, 1.0 ) ) - path( max( t - 0.004, 0.0 ) );
	vec3 tangent = normalize( next + vec3( 1e-5 ) );
	vec3 n1 = normalize( cross( tangent, vec3( 0.0, 1.0, 0.0 ) ) + vec3( 1e-4, 0.0, 0.0 ) );
	vec3 n2 = cross( n1, tangent );
	// Each filament wanders a little about the tress, slowly, in its own way.
	float a = aSeed.y * 6.28318 + uTime * 0.15 * ( aSeed.w - 0.5 ) + t * 4.0 * ( aSeed.z - 0.5 );
	float r = spread( t ) * sqrt( aSeed.z ) * ( 1.0 + 0.2 * sin( t * 9.0 + uTime * 0.2 + aSeed.w * 6.0 ) );
	return here + ( n1 * cos( a ) + n2 * sin( a ) ) * r;
}

void main() {
	float t = aT;
	vec3 here = strand( t );
	vec3 ahead = strand( min( t + 0.01, 1.0 ) ) + ( t >= 0.99 ? here - strand( t - 0.01 ) : vec3( 0.0 ) );
	mat4 vp = projectionMatrix * viewMatrix;
	// Grown out from the hands, each filament a little behind or ahead of the rest; drawn back in
	// from the far end when it is let go.
	float front = uGrow * 1.15 - 0.15 * aSeed.w;
	float back = 1.0 - uGone * 1.15 + 0.15 * aSeed.w;
	float shown = smoothstep( front, front - 0.04, t ) * smoothstep( back, back - 0.04, t );
	// Each filament shows only for stretches, and the stretches travel the way the energy goes:
	// in to the boat along the Stilling, out everywhere else.
	float way = uKind > 0.5 && uKind < 1.5 ? - 1.0 : 1.0;
	float flow = 0.55 + 0.45 * sin( t * ( 14.0 + 10.0 * aSeed.y ) - way * uTime * ( 0.9 + 0.5 * aSeed.z ) + aSeed.w * 30.0 );
	// The tips fade out into the air; the hands' end is fine.
	float ends = smoothstep( 0.0, 0.02, t ) * smoothstep( 1.0, uKind > 3.5 && uKind < 4.5 ? 0.9 : 0.75, t );
	// What is given off to the sky thins out as it goes.
	if ( uKind > 3.5 && uKind < 4.5 && aSeed.w > 0.82 && t > 0.78 ) ends *= 1.0 - smoothstep( 0.78, 1.0, t );
	// Faint close to the eye, where the many filaments from the rail would otherwise fill the picture.
	float near = smoothstep( 6.0, 70.0, length( here - cameraPosition ) );
	vAlpha = shown * flow * ends * mix( 0.12, 1.0, near );
	float seat = floor( aSeed.x * ${SEATS}.0 );
	vec3 tint = uTints[ 6 ];
	if ( uKind > 3.5 && uKind < 4.5 ) tint = seat == ${STRONGEST}.0 ? uTints[ 7 ] : uTints[ int( aWho ) ];
	else if ( uKind > 4.5 && uKind < 5.5 ) tint = uTints[ 4 ];
	else if ( uKind > 2.5 ) tint = uTints[ 2 ];
	else if ( uKind > 0.5 ) tint = mix( uTints[ 6 ], uTints[ 1 ], 0.5 * aSeed.y );
	// The strongest's own are white.
	if ( uKind < 0.5 || ( uKind < 2.5 && aWho == ${STRONGEST}.0 ) ) tint = uTints[ 7 ];
	// Tamed to the colour behind it, 13 to 26%; the strongest's white stays white.
	vTint = all( greaterThan( tint, vec3( 0.99 ) ) ) ? tint : tame( tint, 0.13 + 0.13 * aSeed.y );
	// Warmth going up the braid in slow pulses: fire's most, the rest a little.
	vPulse = ( uKind > 3.5 && uKind < 4.5 && t > 0.3 && t < 0.75 ) ? exp( - pow( fract( t * 2.0 - uTime * 0.07 ) - 0.5, 2.0 ) * 60.0 ) * ( aWho > 2.5 && aWho < 3.5 ? 1.0 : 0.3 ) : 0.0;
	vEdge = aSide;
	gl_Position = ribbonPosition( vp * vec4( here, 1.0 ), vp * vec4( ahead, 1.0 ), aSide, uWidth );
}
`;

const threadFragment = /* glsl */ `
uniform float uGain;
uniform float uDay;
uniform float uOpacity;
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;
varying float vPulse;
void main() {
	float across = abs( vEdge );
	float body = exp( - across * across * 3.0 ) * ( 1.0 - smoothstep( 0.8, 1.0, across ) );
	vec3 colour = vTint * ( 1.0 + 1.2 * vPulse ) + vec3( 1.0, 0.75, 0.5 ) * 0.5 * vPulse;
	// By day it is laid colour, deeper, never white on a white sky (the owner's).
	colour = mix( colour, pow( colour, vec3( 2.6 ) ) * 0.35, uDay );
	gl_FragColor = vec4( colour * uGain, body * vAlpha * uOpacity * mix( 1.0, 4.0, uDay ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

// ---- The held waves --------------------------------------------------------------------------
const waveVertex = /* glsl */ `
attribute float aWave;
attribute vec2 aUV;
varying vec3 vWorld;
varying vec2 vUV;
varying float vWave;
${common}
void main() {
	vec3 p = wavePoint( int( aWave ), aUV.x, aUV.y );
	vWorld = p;
	vUV = aUV;
	vWave = aWave;
	gl_Position = projectionMatrix * viewMatrix * vec4( p, 1.0 );
}
`;
const waveFragment = /* glsl */ `
uniform float uTime;
uniform float uGain;
uniform float uDay;
uniform float uWaveRise;
uniform float uFall;
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uSky;
uniform vec3 uFoam;
uniform vec3 uLight;
uniform vec3 uLightAt;
varying vec3 vWorld;
varying vec2 vUV;
varying float vWave;
float hash( vec2 p ) { return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 ); }
float noise( vec2 p ) {
	vec2 i = floor( p ), f = fract( p );
	f = f * f * ( 3.0 - 2.0 * f );
	return mix( mix( hash( i ), hash( i + vec2( 1.0, 0.0 ) ), f.x ), mix( hash( i + vec2( 0.0, 1.0 ) ), hash( i + vec2( 1.0, 1.0 ) ), f.x ), f.y );
}
void main() {
	vec3 n = normalize( cross( dFdx( vWorld ), dFdy( vWorld ) ) );
	vec3 toEye = normalize( cameraPosition - vWorld );
	if ( dot( n, toEye ) < 0.0 ) n = - n;
	float fresnel = pow( 1.0 - abs( dot( n, toEye ) ), 4.0 );
	// Thin towards the lip, where light comes through it green.
	float thin = smoothstep( 0.5, 0.95, vUV.y );
	// The water in it still runs: streaks moving down the face, held in place as a whole (a
	// wave is a shape the water passes through).
	float run = noise( vec2( vUV.x * 160.0 + vWave * 13.0 + 6.0 * noise( vUV * vec2( 8.0, 3.0 ) ), vUV.y * 4.0 + uTime * 0.35 ) );
	float streak = smoothstep( 0.6, 0.95, run ) * smoothstep( 0.15, 0.6, vUV.y ) * ( 1.0 - thin ) * 0.35;
	float lipFoam = smoothstep( 0.86, 0.99, vUV.y ) * smoothstep( 0.35, 0.75, noise( vec2( vUV.x * 90.0 + vWave * 7.0, uTime * 0.25 ) ) );
	vec3 body = mix( uDeep, uShallow, thin * thin * 0.9 + 0.08 * run );
	// The light of the weave, caught in it: most where it is thin.
	float near = exp( - length( vWorld - uLightAt ) / 450.0 );
	body += uLight * near * ( 0.15 + 0.85 * thin );
	// Let fall, it breaks white.
	float broken = uFall * smoothstep( 0.2, 0.9, vUV.y ) * smoothstep( 0.3, 0.7, noise( vec2( vUV.x * 40.0, vUV.y * 6.0 - uTime * 1.5 ) ) );
	vec3 colour = mix( body, uSky, fresnel * mix( 0.6, 0.3, uDay ) ) + uFoam * ( streak * 0.4 + lipFoam + broken );
	float alpha = mix( 0.96, 0.6, thin ) * smoothstep( 0.0, 0.1, vUV.y ) * smoothstep( 0.0, 0.06, vUV.x ) * smoothstep( 1.0, 0.94, vUV.x );
	alpha = max( alpha, ( lipFoam + broken ) * 0.9 ) * smoothstep( 0.0, 0.15, uWaveRise + uFall );
	gl_FragColor = vec4( colour * uGain * mix( 0.22, 0.4, uDay ), alpha );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

// Spray hanging from the lips of the held waves, held in the air with them, glinting.
const SPRAY = 2500;
const sprayVertex = /* glsl */ `
attribute vec4 aSeed;
uniform float uFall;
uniform float uPixelRatio;
varying float vAlpha;
${common}
void main() {
	int i = int( aSeed.x * ${WAVE_COUNT}.0 );
	float u = 0.08 + 0.84 * aSeed.y;
	vec3 lip = wavePoint( i, u, 0.97 );
	vec3 inward = normalize( vec3( uBoat.x, lip.y, uBoat.z ) - lip );
	float H = uWaves[ i ].z * uWaveRise;
	// Hanging under and before the lip, a little more each breath; let fall, it comes down.
	vec3 p = lip + inward * ( 2.0 + 10.0 * aSeed.z ) - vec3( 0.0, H * 0.45 * aSeed.w * aSeed.w + uFall * 40.0 * aSeed.z, 0.0 );
	p += vec3( sin( uTime * 0.3 + aSeed.y * 40.0 ), sin( uTime * 0.23 + aSeed.z * 30.0 ), cos( uTime * 0.27 + aSeed.w * 50.0 ) ) * 0.8;
	vec4 view = viewMatrix * vec4( p, 1.0 );
	gl_Position = projectionMatrix * view;
	gl_PointSize = clamp( 1.6 * 200.0 / max( - view.z, 1.0 ), 1.0, 2.5 ) * uPixelRatio;
	float glint = 0.35 + 0.65 * pow( 0.5 + 0.5 * sin( uTime * ( 1.0 + aSeed.y * 2.0 ) + aSeed.w * 60.0 ), 6.0 );
	vAlpha = glint * smoothstep( 0.2, 0.6, uWaveRise + uFall ) * ( 1.0 - uFall );
}
`;
const sprayFragment = /* glsl */ `
uniform float uGain;
uniform float uDay;
varying float vAlpha;
void main() {
	float r = length( gl_PointCoord - 0.5 ) * 2.0;
	gl_FragColor = vec4( vec3( 0.85, 0.93, 0.95 ) * uGain * mix( 0.5, 1.0, uDay ), ( 1.0 - smoothstep( 0.4, 1.0, r ) ) * vAlpha * mix( 0.5, 0.8, uDay ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

// Strip geometry for `count` filaments of `segments` each, each with its own seed and `who`.
function filaments(count: number, segments: number, who: (i: number) => number) {
	const vertices = count * (segments + 1) * 2;
	const along = new Float32Array(vertices);
	const side = new Float32Array(vertices);
	const seed = new Float32Array(vertices * 4);
	const whose = new Float32Array(vertices);
	for (let strip = 0; strip < count; strip++) {
		const own = [Math.random(), Math.random(), Math.random(), Math.random()];
		const w = who(strip);
		for (let i = 0; i <= segments; i++) {
			for (let edge = 0; edge < 2; edge++) {
				const v = (strip * (segments + 1) + i) * 2 + edge;
				along[v] = i / segments;
				side[v] = edge ? 1 : -1;
				seed.set(own, v * 4);
				whose[v] = w;
			}
		}
	}
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(vertices * 3), 3));
	geometry.setAttribute("aT", new THREE.BufferAttribute(along, 1));
	geometry.setAttribute("aSide", new THREE.BufferAttribute(side, 1));
	geometry.setAttribute("aSeed", new THREE.BufferAttribute(seed, 4));
	geometry.setAttribute("aWho", new THREE.BufferAttribute(whose, 1));
	geometry.setIndex(stripIndices(count, segments));
	return geometry;
}

function waveGeometry(across: number, up: number) {
	const positions: number[] = [];
	const uv: number[] = [];
	const wave: number[] = [];
	const index: number[] = [];
	for (let w = 0; w < WAVE_COUNT; w++) {
		const first = positions.length / 3;
		for (let j = 0; j <= up; j++) {
			for (let i = 0; i <= across; i++) {
				positions.push(0, 0, 0);
				uv.push(i / across, j / up);
				wave.push(w);
			}
		}
		for (let j = 0; j < up; j++) {
			for (let i = 0; i < across; i++) {
				const a = first + j * (across + 1) + i;
				index.push(a, a + 1, a + across + 1, a + 1, a + across + 2, a + across + 1);
			}
		}
	}
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
	geometry.setAttribute("aUV", new THREE.Float32BufferAttribute(uv, 2));
	geometry.setAttribute("aWave", new THREE.Float32BufferAttribute(wave, 1));
	geometry.setIndex(index);
	return geometry;
}

// One pale tone, and each element's own (akasha, air, water, fire, earth, metal), each taken only
// part of the way from the one to the other; then the flow's own pale silver-blue, and white for
// the strongest.
const PALE = new THREE.Color(0xd6dde9);
const OWN = [0xf6f2ea, 0x9c98d4, 0x52aa9e, 0xe39a62, 0x8fab72, 0xa3acb8].map((hex) => new THREE.Color(hex));
const TINTS = [...OWN.map((own) => PALE.clone().lerp(own, 0.7)), new THREE.Color(0xcdd9ec), new THREE.Color(1, 1, 1)];

export interface SacredFrame {
	time: number;
	delta: number;
	boat: THREE.Vector3;
	ahead: THREE.Vector2;
	// The wind as it is now (theirs), m/s.
	wind: THREE.Vector3;
	day: number;
	gain: number;
	at: ReturnType<typeof sacredAt>;
	// The colour of what is behind the weave (the air's).
	bg: THREE.Color;
}

export function createSacred(scene: THREE.Scene, layer: number) {
	const shared = {
		uTime: { value: 0 },
		uBoat: { value: new THREE.Vector3() },
		uAhead: { value: new THREE.Vector2(0, -1) },
		uWaveRise: { value: 0 },
		uBreath: { value: 0 },
		uWaves: { value: WAVES.map(([a, r, h, w]) => new THREE.Vector4(a, r, h, w)) },
		uGain: { value: 1 },
		uDay: { value: 0 },
		uBg: { value: new THREE.Color() },
	};
	const windDir = { value: new THREE.Vector3(1, 0, 0) };
	const spin = { value: 0 };
	// One mesh to each kind of thread, so that what is not out costs nothing.
	const kinds = [
		{ count: 22, segments: 160, who: () => STRONGEST, width: 1.0, opacity: 0.3 },
		{ count: SEATS * 26, segments: 200, who: (i: number) => i % SEATS, width: 0.9, opacity: 0.12 },
		{ count: SEATS * 22, segments: 160, who: (i: number) => i % SEATS, width: 0.9, opacity: 0.12 },
		{ count: WAVE_COUNT * 12, segments: 120, who: (i: number) => i % WAVE_COUNT, width: 0.8, opacity: 0.12 },
		{ count: 6 * 80, segments: 320, who: (i: number) => i % 6, width: 0.9, opacity: 0.09 },
		{ count: 90, segments: 120, who: () => 4, width: 0.8, opacity: 0.16 },
		{ count: WAVE_COUNT * 8, segments: 120, who: (i: number) => i % WAVE_COUNT, width: 0.7, opacity: 0.16 },
	].map((kind, k) => {
		const uniforms = {
			...shared,
			uKind: { value: k },
			uGrow: { value: 0 },
			uGone: { value: 0 },
			uOpen: { value: 0 },
			uSpin: spin,
			uWindDir: windDir,
			uTints: { value: TINTS },
			uWidth: { value: kind.width },
			uOpacity: { value: kind.opacity },
			uResolution: { value: new THREE.Vector2(1, 1) },
			uPixelRatio: pixelRatio,
		};
		const mesh = new THREE.Mesh(
			filaments(kind.count, kind.segments, kind.who),
			new THREE.ShaderMaterial({ uniforms, vertexShader: threadVertex, fragmentShader: threadFragment, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
		);
		mesh.frustumCulled = false;
		mesh.renderOrder = WEAVE_RENDER_ORDER;
		mesh.layers.set(layer);
		mesh.visible = false;
		scene.add(mesh);
		return { mesh, uniforms };
	});

	const waveUniforms = {
		...shared,
		uFall: { value: 0 },
		uDeep: { value: new THREE.Color() },
		uShallow: { value: new THREE.Color() },
		uSky: { value: new THREE.Color() },
		uFoam: { value: new THREE.Color() },
		uLight: { value: new THREE.Color() },
		uLightAt: { value: new THREE.Vector3() },
	};
	const waves = new THREE.Mesh(
		waveGeometry(90, 40),
		new THREE.ShaderMaterial({ uniforms: waveUniforms, vertexShader: waveVertex, fragmentShader: waveFragment, transparent: true, depthWrite: true, side: THREE.DoubleSide }),
	);
	waves.frustumCulled = false;
	// Under the fog and the weave, over the sea.
	waves.renderOrder = 3;
	waves.layers.set(layer);
	waves.visible = false;
	scene.add(waves);

	const sprayGeometry = new THREE.BufferGeometry();
	sprayGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(SPRAY * 3), 3));
	sprayGeometry.setAttribute("aSeed", new THREE.BufferAttribute(Float32Array.from({ length: SPRAY * 4 }, () => Math.random()), 4));
	const sprayUniforms = { ...shared, uFall: waveUniforms.uFall, uPixelRatio: pixelRatio };
	const spray = new THREE.Points(sprayGeometry, new THREE.ShaderMaterial({ uniforms: sprayUniforms, vertexShader: sprayVertex, fragmentShader: sprayFragment, transparent: true, depthWrite: false }));
	spray.frustumCulled = false;
	spray.renderOrder = 4;
	spray.layers.set(layer);
	spray.visible = false;
	scene.add(spray);

	const night = { deep: new THREE.Color(0.006, 0.02, 0.028), shallow: new THREE.Color(0.03, 0.11, 0.12), sky: new THREE.Color(0.02, 0.03, 0.05), foam: new THREE.Color(0.16, 0.18, 0.2) };
	const daylit = { deep: new THREE.Color(0.01, 0.08, 0.12), shallow: new THREE.Color(0.05, 0.3, 0.3), sky: new THREE.Color(0.62, 0.72, 0.82), foam: new THREE.Color(0.85, 0.9, 0.92) };

	const update = (frame: SacredFrame | undefined) => {
		if (!frame) {
			for (const kind of kinds) kind.mesh.visible = false;
			waves.visible = false;
			spray.visible = false;
			return;
		}
		const { at } = frame;
		shared.uTime.value = frame.time;
		shared.uBoat.value.copy(frame.boat);
		shared.uAhead.value.copy(frame.ahead);
		// (The height the storm's energy can raise.)
		shared.uWaveRise.value = at.waves * at.scale;
		shared.uBreath.value = at.breath;
		shared.uDay.value = frame.day;
		shared.uGain.value = frame.gain;
		shared.uBg.value.copy(frame.bg);
		windDir.value.copy(frame.wind).setY(0);
		if (windDir.value.lengthSq() > 1e-6) windDir.value.normalize();
		else windDir.value.set(frame.ahead.x, 0, frame.ahead.y);
		// The Stilling turns steadily against the storm, slowing as the storm is drawn in.
		spin.value += frame.delta * 0.05 * (1 - 0.7 * at.command);
		// The flower's strands run out first, and the braid and the cells follow along the same filaments.
		const flower = 0.32 * at.strands + 0.38 * at.braid + 0.3 * at.bloom;
		const grow = [at.first, at.stilling, at.combing, at.holding, flower, at.roots, at.drawn];
		const gone = [at.firstGone, at.stillingGone, at.combingGone, at.holdingGone, at.undone, at.undone, Math.max(at.holdingGone, at.undone)];
		const blending = frame.day > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending;
		kinds.forEach((kind, k) => {
			kind.uniforms.uGrow.value = grow[k]!;
			kind.uniforms.uGone.value = gone[k]!;
			kind.mesh.visible = grow[k]! > 0.001 && gone[k]! < 0.999;
			kind.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight).multiplyScalar(pixelRatio.value);
			(kind.mesh.material as THREE.ShaderMaterial).blending = blending;
		});
		// The cells open as they form, and open further as the flower comes apart.
		kinds[4]!.uniforms.uOpen.value = Math.max(0.05, at.bloom) * (1 + 0.6 * at.undone) * (1 + 0.04 * at.breath);

		waves.visible = at.waves > 0.001 || at.fall > 0.001;
		waveUniforms.uFall.value = at.fall;
		spray.visible = waves.visible;
		(spray.material as THREE.ShaderMaterial).blending = frame.day > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending;
		waveUniforms.uDeep.value.lerpColors(night.deep, daylit.deep, frame.day);
		waveUniforms.uShallow.value.lerpColors(night.shallow, daylit.shallow, frame.day);
		waveUniforms.uSky.value.lerpColors(night.sky, daylit.sky, frame.day);
		waveUniforms.uFoam.value.lerpColors(night.foam, daylit.foam, frame.day);
		// The braid's light, warm white, as it rises.
		waveUniforms.uLight.value.setRGB(0.32, 0.3, 0.26).multiplyScalar(at.braid * (1 - at.undone) * (1 - 0.7 * frame.day) * (1 + 0.15 * at.breath));
		waveUniforms.uLightAt.value.set(frame.boat.x + frame.ahead.x * FOOT, 60, frame.boat.z + frame.ahead.y * FOOT);
	};

	const dispose = () => {
		for (const { mesh } of [...kinds, { mesh: waves }, { mesh: spray }]) {
			scene.remove(mesh);
			mesh.geometry.dispose();
			(mesh.material as THREE.Material).dispose();
		}
	};

	return { update, dispose };
}
