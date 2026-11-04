// Ranat's storm (the owner, 5 November 2026: "I want the strongest channellers on the boat each
// channelling out in 35 degree directions roughly to call on a storm. No more circles in the sky. This
// time the channellers are reaching into the horizon to pull water towards them that they then use
// complex weaves of multiple elements to explode into rain. They are mourning someone. We will log this
// in the side bar as Channelling for Ranat. One of the weaker channellers will call the rain using only
// weaves of water into the sky in very disparate ways").
//
// Everyone drops what she is doing (as for the freshening). The six strongest (Laeni, Pardis, Manulani,
// Keel, Mohabat, Listener) each send a rope out low over the sea, 35 degrees from the next, Laeni's
// straight ahead, and reach into the horizon, some seven kilometres out, where it goes down into the
// sea. Each then hauls: a long body of the sea's water comes in along her rope, low over the water as
// spray and spindrift, its front densest, over four of the real swell's periods; the rope is drawn taut
// and the light in it runs back towards the boat. Some two kilometres out (the stronger she is, the
// nearer she brings it) she takes hold of it with a weave of all five elements, water, earth, fire,
// air and akasha, wound about a rising column the way a vortex tube is, some one way and some the
// other, and lets it burst: the water goes up as a column of cloud, spreading as it rises, and out of it
// a shaft of rain falls to the sea, leaning downwind, and goes on falling long after.
//
// They are mourning: everything is slow; after each burst comes a long stillness, the rope slack and low
// over the sea, before the next haul ("a catch, and a long letting go"); each keeps her own time, as
// grief does, so the six are never in step; and their colours are cooled towards the grey of the sea.
// Nothing in the sky is round: no light, no sun, no ring or eye.
//
// Lantern, the youngest of the eight and still learning to hold, calls the rain over the boat with
// weaves of water alone, thrown up into the sky, and no two alike: a single thread climbing in one long
// curve and fraying at its top; a loose sheaf, each of its threads to a different place; one laid up
// the wind and carried far downwind as it climbs; one low over the sea far out and then steeply up into
// the distant cloud; a few separate threads at once, at their own bearings, each in its own time. Each
// time hers reaches the cloud the rain over the boat comes on harder (`rainCalled`, which the storm's
// figures follow, ranatStorm in channelled-storm.ts).
//
// And (the owner, the same morning: "intensify the storm: one weaker channeller should add akasha to
// the ocean while another one helps her aspirate the water into weak swells that fly across the POV like
// rain") the storm's figures are raised further, and two more of the eight work close by the boat.
// Loom, who joins without binding, lays akasha into the sea some forty metres out on the right: a rope
// of it from her hands down into the water, opening as a root does. Sail, who answers a strong wind
// fully, helps her: her air goes out to the same water and then low across the front of the boat, and
// with each weak swell the two lift the water that akasha is in off the sea and fling it right across
// the view, a few metres up, as rain driven sideways: streaks of water in gusts, one gust to each of the
// swells they raise, passing within twenty or thirty metres of the eye.
import * as THREE from "three";
import { lines } from "./embroidery";
import { NAMES, ropeMight, STRONGEST_MIND, TEMPERS } from "./psyche";
import { seatOf } from "./treason";
import { filmLook, filmShaderChunk, pixelRatio, ribbonShaderChunk, WEAVE_RELAX, WEAVE_RENDER_ORDER } from "./weave";

// Each visitor sees them turn to it this long after they come (s).
export const RANAT_AFTER = 6;
export const ranatBusy = (since: number) => THREE.MathUtils.smoothstep(since, 0.3, 3);

// The six, and their bearings off ahead (degrees, + to the right): Laeni straight ahead, the others
// 35 degrees apart out to each side, each to the side she sits on.
const SIX = [
	{ who: STRONGEST_MIND, bearing: 0 },
	{ who: 1, bearing: -35 },
	{ who: 13, bearing: 35 },
	{ who: 0, bearing: -70 },
	{ who: 2, bearing: 70 },
	{ who: 5, bearing: -105 },
];
const LANTERN = 9;
const MOST = Math.max(...SIX.map(({ who }) => ropeMight(who)));
const ROPES = SIX.map(({ who, bearing }, r) => {
	const temper = TEMPERS[who]!;
	const size = Math.cbrt(ropeMight(who) / MOST);
	return {
		who,
		bearing: THREE.MathUtils.degToRad(bearing),
		// Out to the horizon, and the stronger she is the nearer she brings the water in.
		far: 6800 + 500 * ((0.37 + r * 0.618) % 1),
		burst: 1500 + 2500 * (1 - size),
		size,
		joins: 0.6 + 4 * (1 - temper.eager),
		// The stillness after each burst: longer in the less eager.
		rest: 14 + 26 * (1 - temper.eager),
		// How much of her rope is water, air and akasha (the reaching is water carried by air), and fire;
		// Laeni's her four, and white.
		mix: who === STRONGEST_MIND ? [0.3, 0.3, 0.25, 0.15] : [0.5 + 0.3 * temper.water - 0.15 * temper.air, 0.25 + 0.3 * temper.air, 0.15, 0],
		white: who === STRONGEST_MIND ? 1 : 0,
	};
});
const R = ROPES.length;
// Two bursts at a time to each: the last one's rain is still falling as the next comes.
const BURSTS = 2 * R;
const FILAMENTS = 16;
const SEGMENTS = 110;
const STREAM = 140;
const PLUME = 44;
const SHAFTS = 5;
const BURST_FILAMENTS = 36;
const BURST_SEGMENTS = 50;
// How long a burst's weave, its cloud and its rain go on (s).
const WEAVE_LASTS = 18;
const PLUME_LASTS = 80;
const RAIN_LASTS = 95;
// Lantern's throws: how many at once, their threads, and when she begins (s).
const THROWS = 5;
const THROW_FILAMENTS = 26;
const THROW_SEGMENTS = 80;
const LANTERN_FROM = 50;
// Their colours cooled this far towards grey (grief).
const GRIEF = 0.35;
// Loom's akasha into the sea, and Sail's air with it: who, when each begins (s), their threads, and
// where (bearing off ahead in degrees, metres out): the akasha's water, and where Sail carries it to.
const LOOM = 4;
const SAIL = 6;
const AKASHA_FROM = 25;
const ASPIRATE_FROM = 33;
const HELPER_FILAMENTS = 40;
const HELPER_SEGMENTS = 70;
const AKASHA_AT = { bearing: 30, far: 36 };
const CARRIED_TO = { bearing: -45, far: 32 };
// The water they fling across: how many streaks.
const FLUNG = 640;

const shared = /* glsl */ `
uniform vec3 uBoat;
uniform vec3 uAhead;
uniform vec3 uAcross;
uniform float uTime;
vec3 dirOf( float b ) {
	return uAhead * cos( b ) + uAcross * sin( b );
}
vec3 bezier( vec3 a, vec3 b, vec3 c, vec3 d, float t ) {
	float s = 1.0 - t;
	return s * s * s * a + 3.0 * s * s * t * b + 3.0 * s * t * t * c + t * t * t * d;
}
vec3 grieved( vec3 c, float grief ) {
	return mix( c, vec3( dot( c, vec3( 0.3, 0.5, 0.2 ) ) ), grief );
}
`;

// The six ropes, out low over the sea to the horizon.
const ropeVertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute vec2 aCell;
attribute vec4 aSeed;
uniform vec3 uSeats[ ${R} ];
// bearing (radians), how far out (m), how far cast (0..1), girth
uniform vec4 uRope[ ${R} ];
// the hauled water's front (m out; < 0: none), its length (m), how taut (0..1), how slack (0..1)
uniform vec4 uHaul[ ${R} ];
// shares of water, air, akasha and fire in her rope
uniform vec4 uMix[ ${R} ];
uniform float uWhite[ ${R} ];
uniform vec3 uElements[ 5 ];
uniform float uSeaHigh;
uniform float uVisibility;
uniform float uDay;
varying float vAlpha;
varying float vEdge;
varying vec3 vTint;
varying float vCore;
${shared}
${ribbonShaderChunk}
vec3 ropeAt( int r, float t ) {
	vec4 rope = uRope[ r ];
	vec4 haul = uHaul[ r ];
	vec3 d = dirOf( rope.x );
	vec3 side = vec3( - d.z, 0.0, d.x );
	float dist = 10.0 * pow( rope.y / 10.0, t );
	float q = log( dist + 12.0 );
	// From her hands; it wanders a little over the sea as anything laid on moving water does, less when
	// drawn taut.
	vec3 hands = uSeats[ r ];
	vec3 p = uBoat + d * dist + ( hands - uBoat ) * vec3( 1.0, 0.0, 1.0 ) * ( 1.0 - smoothstep( 10.0, 150.0, dist ) );
	// (Its wander and girth held in far out, where all of it is crowded into the horizon line.)
	float wander = ( 0.03 * sin( q * 1.7 + float( r ) * 1.3 - uTime * 0.03 ) + 0.014 * sin( q * 3.9 - uTime * 0.05 + float( r ) * 2.1 ) ) * min( dist, 900.0 );
	p += side * wander * ( 1.0 - 0.75 * haul.z );
	// Low over the sea, lower still when slack in the stillness; down into the sea at the horizon.
	// (Well under the eye, which is five metres up: at the eye's height it would lie along the horizon.)
	float low = ( 1.5 + 0.3 * min( uSeaHigh, 4.0 ) ) * ( 1.0 - 0.4 * haul.w );
	p.y = mix( hands.y, low, smoothstep( 10.0, 60.0, dist ) ) - 8.0 * smoothstep( 0.97, 1.0, t );
	return p;
}
void main() {
	int r = int( aCell.x + 0.5 );
	vec4 rope = uRope[ r ];
	vec4 haul = uHaul[ r ];
	vec3 here = ropeAt( r, aT );
	vec3 next = ropeAt( r, min( aT + 0.01, 1.0 ) ) + ( aT >= 0.99 ? here - ropeAt( r, aT - 0.01 ) : vec3( 0.0 ) );
	vec3 dir = normalize( next - here + vec3( 1e-5 ) );
	vec3 n1 = normalize( cross( dir, vec3( 0.0, 1.0, 0.0 ) ) + vec3( 1e-4 ) );
	vec3 n2 = normalize( cross( n1, dir ) );
	float dist = length( here.xz - uBoat.xz );
	// A hawser's girth, broadening with distance so that it still reads far out; drawn in tight as she
	// hauls, loosening in the stillness.
	// (Broad across the sea and shallow over it, as a rope lying on water is: far out its breadth would
	// otherwise stand up and down over tens of metres, and its threads be seen winding round it.)
	float girth = rope.w * ( 0.35 + 0.0025 * min( dist, 2500.0 ) ) * sqrt( aSeed.z ) * ( 1.0 - 0.3 * haul.z + 0.3 * haul.w );
	float turn = aSeed.y * 6.28318 + log( min( dist, 2500.0 ) + 12.0 ) * ( 1.2 + 0.8 * aSeed.x ) - uTime * 0.05;
	vec3 off = ( n1 * cos( turn ) + n2 * sin( turn ) * min( 1.0, 3.0 / girth ) ) * girth;
	here += off;
	next += off;
	float far = length( here - cameraPosition );
	// The light in it runs back towards the boat while she hauls; dimmer in the stillness.
	float q = log( dist + 12.0 );
	float running = pow( 0.5 + 0.5 * sin( q * 6.0 + uTime * 1.3 + aSeed.x * 6.0 ), 4.0 );
	float lit = ( 0.7 + 0.6 * haul.z * running ) * ( 1.0 - 0.4 * haul.w );
	float haze = max( 0.12, exp( - far / ( 1.5 * uVisibility ) ) );
	vAlpha = smoothstep( rope.z, rope.z - 0.02, aT ) * smoothstep( 8.0, 30.0, far ) * haze * lit;
	vEdge = aSide;
	vec4 mixed = uMix[ r ];
	float e = aSeed.w;
	vec3 tint = e < mixed.x ? uElements[ 0 ] : e < mixed.x + mixed.y ? uElements[ 3 ] : e < mixed.x + mixed.y + mixed.z ? uElements[ 4 ] : uElements[ 2 ];
	tint = mix( tint, vec3( 0.97, 0.96, 0.99 ), 0.7 * uWhite[ r ] );
	vTint = grieved( tint, ${GRIEF.toFixed(2)} * ( 1.0 - 0.5 * uWhite[ r ] ) );
	vCore = 1.0 - aSeed.z;
	mat4 vp = projectionMatrix * viewMatrix;
	gl_Position = ribbonPosition( vp * vec4( here, 1.0 ), vp * vec4( next, 1.0 ), aSide, mix( 1.0, 1.3, uDay ) );
}
`;

const ropeFragment = /* glsl */ `
uniform float uGain;
uniform float uDay;
uniform float uFilm;
uniform float uStrength;
varying float vAlpha;
varying float vEdge;
varying vec3 vTint;
varying float vCore;
${filmShaderChunk}
void main() {
	float body = 1.0 - smoothstep( 0.7, 1.0, abs( vEdge ) );
	vec3 tint = mix( vTint, filmShade( vTint, vCore ), uFilm );
	gl_FragColor = vec4( tint * uGain * mix( 1.0, 1.4, uDay ), body * vAlpha * uStrength * 0.07 * mix( 1.0, 3.0, uDay ) );
	gl_FragColor.a *= ${WEAVE_RELAX.toFixed(3)};
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

// The weave of all five elements a burst is made with, wound up about its rising column.
const burstVertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute vec2 aCell;
attribute vec4 aSeed;
// where (x, z), how long since it began (s; < 0: none), and her size
uniform vec4 uBurst[ ${BURSTS} ];
// how high its cloud goes (m)
uniform float uTop[ ${BURSTS} ];
uniform vec3 uWind;
uniform vec3 uElements[ 5 ];
uniform float uVisibility;
uniform float uDay;
varying float vAlpha;
varying float vEdge;
varying vec3 vTint;
varying float vCore;
${shared}
${ribbonShaderChunk}
vec3 woundAt( vec4 b, float top, float t, float age ) {
	float grow = smoothstep( 0.0, 5.0, age );
	float burst = smoothstep( 6.0, 12.0, age );
	float h = 0.8 * top * t * ( 0.3 + 0.7 * grow ) + burst * 140.0 * aSeed.w * t;
	// A sheaf: close about the water at the sea, flaring out into the cloud above, each strand turned
	// gently about the column, some one way and some the other (no coil at its foot).
	float r = ( 3.0 + 140.0 * t * t * t ) * b.w * ( 1.0 + 1.5 * burst * ( 0.3 + aSeed.x ) );
	float sense = aSeed.z < 0.5 ? 1.0 : - 1.0;
	float a = aSeed.y * 6.28318 + sense * t * ( 0.6 + 1.2 * aSeed.x ) + uTime * 0.05 * sense;
	return vec3( b.x, 2.0, b.y ) + vec3( cos( a ), 0.0, sin( a ) ) * r + vec3( 0.0, h, 0.0 ) + uWind * h * 0.02;
}
void main() {
	int s = int( aCell.x + 0.5 );
	vec4 b = uBurst[ s ];
	float age = b.z;
	if ( age < 0.0 || age > ${WEAVE_LASTS.toFixed(1)} ) {
		vAlpha = 0.0;
		gl_Position = vec4( 2.0, 2.0, 2.0, 1.0 );
		return;
	}
	vec3 here = woundAt( b, uTop[ s ], aT, age );
	vec3 next = woundAt( b, uTop[ s ], min( aT + 0.02, 1.0 ), age ) + ( aT >= 0.98 ? here - woundAt( b, uTop[ s ], aT - 0.02, age ) : vec3( 0.0 ) );
	float far = length( here - cameraPosition );
	float drawn = smoothstep( 0.0, 5.0, age );
	vAlpha = smoothstep( drawn * 1.02, drawn * 1.02 - 0.05, aT ) * ( 1.0 - smoothstep( 10.0, ${WEAVE_LASTS.toFixed(1)}, age ) ) * smoothstep( 0.0, 0.05, aT ) * max( 0.15, exp( - far / ( 1.5 * uVisibility ) ) );
	vEdge = aSide;
	float e = aSeed.w;
	vec3 tint = e < 0.2 ? uElements[ 0 ] : e < 0.4 ? uElements[ 1 ] : e < 0.6 ? uElements[ 2 ] : e < 0.8 ? uElements[ 3 ] : uElements[ 4 ];
	vTint = grieved( tint, ${GRIEF.toFixed(2)} );
	vCore = 1.0 - aSeed.z;
	mat4 vp = projectionMatrix * viewMatrix;
	gl_Position = ribbonPosition( vp * vec4( here, 1.0 ), vp * vec4( next, 1.0 ), aSide, mix( 1.1, 1.4, uDay ) );
}
`;

// Lantern's throws of water into the sky.
//   uThrowA  bearing, how far out (m), how high (m), which way (0 a thread, 1 a sheaf, 2 up the wind,
//            3 far and then up, 4 a few apart)
//   uThrowB  how long since thrown (s; < 0: none), how long it takes to rise, held, let go
//   uThrowC  how far its threads go apart, how far the wind carries it, its own seed
const throwVertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute vec2 aCell;
attribute vec4 aSeed;
uniform vec4 uThrowA[ ${THROWS} ];
uniform vec4 uThrowB[ ${THROWS} ];
uniform vec4 uThrowC[ ${THROWS} ];
uniform vec3 uHands;
uniform vec3 uWindDir;
uniform float uVisibility;
uniform float uDay;
varying float vAlpha;
varying float vEdge;
varying float vCore;
${shared}
${ribbonShaderChunk}
vec3 throwAt( int s, float t ) {
	vec4 A = uThrowA[ s ];
	vec4 C = uThrowC[ s ];
	float style = A.w;
	float b = A.x;
	if ( style > 3.5 ) b += ( aSeed.x - 0.5 ) * C.x;
	vec3 d = dirOf( b );
	vec3 side = vec3( - d.z, 0.0, d.x );
	float D = A.y * ( style > 3.5 ? 0.6 + 0.8 * aSeed.y : 1.0 );
	float H = A.z * ( style > 3.5 ? 0.7 + 0.5 * aSeed.z : 1.0 );
	vec3 top = uBoat + d * D;
	top.y = H;
	if ( style > 0.5 && style < 1.5 ) top += ( side * ( aSeed.x - 0.5 ) + d * ( aSeed.y - 0.5 ) * 0.5 ) * C.x * D + vec3( 0.0, ( aSeed.z - 0.5 ) * 0.4 * H, 0.0 );
	top += uWindDir * C.y * H;
	vec3 c1;
	vec3 c2;
	if ( style > 2.5 && style < 3.5 ) {
		c1 = uHands + d * 0.8 * D + vec3( 0.0, 4.0 - uHands.y, 0.0 );
		c2 = uBoat + d * D + vec3( 0.0, 0.15 * H, 0.0 );
	} else {
		c1 = uHands + d * 0.25 * D + vec3( 0.0, 0.15 * H, 0.0 );
		c2 = top - vec3( 0.0, 0.45 * H, 0.0 ) - d * 0.1 * D - uWindDir * C.y * H * 0.5;
	}
	vec3 p = bezier( uHands, c1, c2, top, t );
	// Each thread its own way about the line: a thread frays towards its top; the others keep apart.
	float spread = style < 0.5 ? 0.6 + 0.05 * D * t * t * t : style > 3.5 ? 0.5 : 0.6 + 0.02 * D * t;
	float a = aSeed.y * 6.28318 + t * ( 2.0 + 3.0 * aSeed.x ) + uTime * 0.2 * ( aSeed.z - 0.5 );
	// And the whole of it swaying as it climbs, as water thrown up into a wind does, never straight.
	float sway = sin( t * ( 2.5 + 2.0 * C.z ) + C.z * 6.28318 + uTime * 0.25 ) * 0.12 * D * t * t;
	return p + side * sway + ( side * cos( a ) + vec3( 0.0, 1.0, 0.0 ) * sin( a ) ) * spread * sqrt( aSeed.w );
}
void main() {
	int s = int( aCell.x + 0.5 );
	vec4 B = uThrowB[ s ];
	float age = B.x - ( uThrowA[ s ].w > 3.5 ? aSeed.x * 3.0 : 0.0 );
	if ( B.x < 0.0 ) {
		vAlpha = 0.0;
		gl_Position = vec4( 2.0, 2.0, 2.0, 1.0 );
		return;
	}
	vec3 here = throwAt( s, aT );
	vec3 next = throwAt( s, min( aT + 0.0125, 1.0 ) ) + ( aT >= 0.9875 ? here - throwAt( s, aT - 0.0125 ) : vec3( 0.0 ) );
	float far = length( here - cameraPosition );
	float drawn = smoothstep( 0.0, B.y, age );
	float gone = smoothstep( B.y + B.z, B.y + B.z + B.w, age );
	vAlpha = smoothstep( drawn * 1.02, drawn * 1.02 - 0.04, aT ) * ( 1.0 - gone ) * smoothstep( 6.0, 20.0, far ) * max( 0.2, exp( - far / ( 1.5 * uVisibility ) ) ) * step( 0.0, age );
	vEdge = aSide;
	vCore = 1.0 - aSeed.w;
	mat4 vp = projectionMatrix * viewMatrix;
	gl_Position = ribbonPosition( vp * vec4( here, 1.0 ), vp * vec4( next, 1.0 ), aSide, mix( 1.0, 1.3, uDay ) );
}
`;
const throwFragment = /* glsl */ `
uniform float uGain;
uniform float uDay;
uniform float uFilm;
uniform vec3 uWater;
varying float vAlpha;
varying float vEdge;
varying float vCore;
${filmShaderChunk}
void main() {
	float body = 1.0 - smoothstep( 0.7, 1.0, abs( vEdge ) );
	vec3 water = mix( uWater, vec3( dot( uWater, vec3( 0.3, 0.5, 0.2 ) ) ), ${(GRIEF * 0.6).toFixed(2)} );
	vec3 tint = mix( water, filmShade( water, vCore ), uFilm );
	gl_FragColor = vec4( tint * uGain * mix( 1.0, 1.4, uDay ), body * vAlpha * 0.04 * mix( 1.0, 2.0, uDay ) );
	gl_FragColor.a *= ${WEAVE_RELAX.toFixed(3)};
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

// Loom's akasha (0) down into the sea, and Sail's air (1) out to it and on across the front of the boat.
const helperVertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute vec2 aCell;
attribute vec4 aSeed;
uniform vec3 uHelperHands[ 2 ];
uniform float uHelperCast[ 2 ];
uniform vec3 uHelperTint[ 2 ];
// where the akasha goes into the sea, and where Sail carries the water to
uniform vec3 uPlace;
uniform vec3 uCarried;
uniform float uSwell;
uniform float uDay;
varying float vAlpha;
varying float vEdge;
varying vec3 vTint;
varying float vCore;
${shared}
${ribbonShaderChunk}
vec3 helperAt( int k, float t ) {
	vec3 h = uHelperHands[ k ];
	if ( k == 0 ) {
		// Each of her threads to its own place in the water, opening there as a root does.
		vec3 end = uPlace + ( uAcross * ( aSeed.x - 0.5 ) + uAhead * ( aSeed.y - 0.5 ) ) * 24.0 + vec3( 0.0, - 4.0 * aSeed.z, 0.0 );
		vec3 to = end - h;
		vec3 flat_ = normalize( vec3( to.x, 0.0, to.z ) + vec3( 1e-4 ) );
		float span = length( to.xz );
		return bezier( h, h + flat_ * 0.3 * span + vec3( 0.0, 0.3, 0.0 ), end - flat_ * 0.25 * span + vec3( 0.0, 1.2 - end.y, 0.0 ), end, t );
	}
	// Out to the water, then low over it across the front of the boat (well under the eye, so that it is
	// seen lying over the sea), rising a little with each swell.
	vec3 lift = vec3( 0.0, 0.8 + 1.2 * uSwell, 0.0 );
	vec3 p = bezier( h, uPlace + lift, mix( uPlace, uCarried, 0.6 ) + lift * 1.5, uCarried + vec3( 0.0, 0.6, 0.0 ), t );
	return p + vec3( 0.0, 1.0, 0.0 ) * sin( t * 9.0 + aSeed.y * 6.28318 + uTime * 0.7 ) * 0.6 * aSeed.z;
}
void main() {
	int k = int( aCell.x + 0.5 );
	vec3 here = helperAt( k, aT );
	vec3 next = helperAt( k, min( aT + 0.015, 1.0 ) ) + ( aT >= 0.985 ? here - helperAt( k, aT - 0.015 ) : vec3( 0.0 ) );
	vec3 dir = normalize( next - here + vec3( 1e-5 ) );
	vec3 n1 = normalize( cross( dir, vec3( 0.0, 1.0, 0.0 ) ) + vec3( 1e-4 ) );
	vec3 n2 = normalize( cross( n1, dir ) );
	float girth = ( 0.25 + 0.9 * aT ) * sqrt( aSeed.z ) * ( k == 0 ? 1.0 + 1.5 * smoothstep( 0.8, 1.0, aT ) : 1.0 );
	float turn = aSeed.y * 6.28318 + aT * ( 1.5 + aSeed.x ) - uTime * 0.08;
	vec3 off = ( n1 * cos( turn ) + n2 * sin( turn ) ) * girth;
	here += off;
	next += off;
	float far = length( here - cameraPosition );
	float cast = uHelperCast[ k ];
	vAlpha = smoothstep( cast, cast - 0.04, aT ) * smoothstep( 6.0, 18.0, far ) * ( k == 1 ? 0.75 + 0.5 * uSwell : 1.0 );
	vEdge = aSide;
	vTint = grieved( uHelperTint[ k ], ${GRIEF.toFixed(2)} );
	vCore = 1.0 - aSeed.z;
	mat4 vp = projectionMatrix * viewMatrix;
	gl_Position = ribbonPosition( vp * vec4( here, 1.0 ), vp * vec4( next, 1.0 ), aSide, mix( 1.0, 1.3, uDay ) );
}
`;

// The water they fling across the view: streaks, each lifted off the sea where the akasha is and
// thrown across in an arc, a gust of them to each swell. Drawn as each drop's track over a moment, as
// the eye sees falling rain.
const flungVertex = /* glsl */ `
attribute vec4 aSeed;
uniform vec3 uPlace;
uniform vec3 uCarried;
uniform float uSwellPeriod;
uniform float uFlung;
uniform vec2 uResolution;
uniform float uPixelRatio;
varying float vAlpha;
varying float vAcross;
${shared}
vec3 flight( float u ) {
	vec3 from = uPlace + ( uAcross * ( aSeed.x - 0.5 ) + uAhead * ( aSeed.y - 0.5 ) ) * 22.0 + vec3( 0.0, 0.5, 0.0 );
	vec3 to = uCarried + ( uAcross * ( aSeed.y - 0.5 ) + uAhead * ( aSeed.x - 0.5 ) ) * 30.0;
	vec3 p = mix( from, to, u );
	p.y += ( 4.0 + 9.0 * aSeed.z ) * 4.0 * u * ( 1.0 - u );
	return p;
}
void main() {
	float life = 1.4 + 1.2 * aSeed.w;
	float clock = uTime / life + aSeed.x * 7.0;
	float u = fract( clock );
	// When it was lifted, and how much of a swell that was: one gust to each.
	float lifted = ( floor( clock ) - aSeed.x * 7.0 ) * life;
	float swell = pow( max( 0.0, sin( 6.28318 * lifted / uSwellPeriod ) ), 2.0 );
	vec4 here = projectionMatrix * viewMatrix * vec4( flight( u ), 1.0 );
	vec4 back = projectionMatrix * viewMatrix * vec4( flight( max( u - 0.035, 0.0 ) ), 1.0 );
	float along = position.y * 0.5 + 0.5;
	vec4 clip = mix( back, here, along );
	vec2 direction = normalize( ( here.xy / here.w - back.xy / back.w ) * uResolution + vec2( 1e-5, 0.0 ) );
	float width = ( 0.7 + 0.8 * aSeed.z ) * uPixelRatio;
	clip.xy += vec2( - direction.y, direction.x ) * position.x * width / uResolution * clip.w;
	gl_Position = clip;
	vAlpha = uFlung * swell * smoothstep( 0.0, 0.08, u ) * ( 1.0 - smoothstep( 0.8, 1.0, u ) ) * ( 0.5 + 0.5 * along );
	vAcross = position.x;
}
`;
const flungFragment = /* glsl */ `
uniform vec3 uDrop;
varying float vAlpha;
varying float vAcross;
void main() {
	float body = 1.0 - smoothstep( 0.4, 1.0, abs( vAcross ) );
	gl_FragColor = vec4( uDrop, body * vAlpha );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

// What is soft (the hauled water, the bursts' cloud, their rain), drawn as sprites facing the eye.
const softFragment = /* glsl */ `
uniform vec3 uMist;
uniform float uVisibility;
varying float vAlpha;
varying vec2 vAt;
varying vec3 vColour;
varying float vFar;
void main() {
	float d = dot( vAt, vAt );
	float soft = exp( - 2.6 * d ) * ( 1.0 - smoothstep( 0.6, 1.0, d ) );
	vec3 c = mix( vColour, uMist, 1.0 - exp( - vFar / uVisibility ) );
	gl_FragColor = vec4( c, soft * vAlpha );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

// The hauled water: spray and spindrift low over the sea along her rope, densest at its front.
const streamVertex = /* glsl */ `
attribute vec2 aCell;
attribute vec4 aSeed;
uniform vec4 uRope[ ${R} ];
uniform vec4 uHaul[ ${R} ];
uniform vec3 uSpray;
uniform float uSeaHigh;
varying float vAlpha;
varying vec2 vAt;
varying vec3 vColour;
varying float vFar;
${shared}
void main() {
	int r = int( aCell.x + 0.5 );
	vec4 haul = uHaul[ r ];
	if ( haul.x < 0.0 ) {
		vAlpha = 0.0;
		gl_Position = vec4( 2.0, 2.0, 2.0, 1.0 );
		return;
	}
	float u = aSeed.x;
	// (Each tumbles forward a little within the body as it goes.)
	float dist = haul.x + u * haul.y - 40.0 * fract( uTime * ( 0.08 + 0.1 * aSeed.w ) + aSeed.w );
	vec3 d = dirOf( uRope[ r ].x );
	vec3 side = vec3( - d.z, 0.0, d.x );
	vec3 c = uBoat + d * dist + side * ( aSeed.y - 0.5 ) * ( 20.0 + 0.012 * dist ) * ( 1.0 + u );
	c.y = ( 0.5 + 0.4 * uSeaHigh + 20.0 * aSeed.z * aSeed.z * ( 1.0 - 0.5 * u ) ) * ( 0.8 + 0.2 * sin( uTime * ( 0.6 + aSeed.w ) + aSeed.y * 9.0 ) );
	float size = ( 8.0 + 26.0 * aSeed.z ) * ( 1.0 + 0.8 * u ) * ( 1.0 + dist / 3500.0 );
	vFar = length( c - cameraPosition );
	vAlpha = pow( 1.0 - u, 1.5 ) * 0.09 * haul.z * smoothstep( 20.0, 80.0, vFar );
	vColour = uSpray * ( 0.85 + 0.3 * aSeed.y );
	vAt = position.xy;
	vec4 seen = viewMatrix * vec4( c, 1.0 );
	seen.xy += position.xy * size * vec2( 1.6, 0.8 );
	gl_Position = projectionMatrix * seen;
}
`;

// Each burst's cloud: a column going up fast, then slowing, spreading as it rises, drifting downwind.
// At first it is lit from within by the weave that burst it.
const plumeVertex = /* glsl */ `
attribute vec2 aCell;
attribute vec4 aSeed;
uniform vec4 uBurst[ ${BURSTS} ];
uniform float uTop[ ${BURSTS} ];
uniform vec3 uWind;
uniform vec3 uCloud;
uniform vec3 uGlow;
varying float vAlpha;
varying vec2 vAt;
varying vec3 vColour;
varying float vFar;
${shared}
void main() {
	int s = int( aCell.x + 0.5 );
	vec4 b = uBurst[ s ];
	float age = b.z;
	if ( age < 0.0 || age > ${PLUME_LASTS.toFixed(1)} ) {
		vAlpha = 0.0;
		gl_Position = vec4( 2.0, 2.0, 2.0, 1.0 );
		return;
	}
	// Its share of the column's height: the column grows upward, its top running up and slowing.
	float k = aSeed.x;
	float front = 1.0 - exp( - max( age - 5.0, 0.0 ) / 6.0 );
	float risen = smoothstep( k, k + 0.12, front * 1.12 );
	float h = uTop[ s ] * k * ( 0.85 + 0.15 * aSeed.z ) + 15.0;
	// Narrow at its foot, spreading out under the cloud at its top.
	float out_ = ( 25.0 + 320.0 * k * k * k ) * b.w * ( 0.3 + aSeed.w ) * ( 1.0 + age / 70.0 );
	float a = aSeed.y * 6.28318 + aSeed.z * 3.0;
	vec3 c = vec3( b.x, h, b.y ) + uAcross * cos( a ) * out_ + uAhead * sin( a ) * out_ * 0.6 + uWind * min( age, 40.0 ) * ( 0.05 + 0.35 * k );
	float size = ( 30.0 + 120.0 * k ) * b.w * ( 0.7 + 0.6 * aSeed.z ) * ( 1.0 + age / 50.0 );
	vFar = length( c - cameraPosition );
	vAlpha = risen * ( 1.0 - smoothstep( 35.0, ${PLUME_LASTS.toFixed(1)}, age ) ) * ( 0.55 + 0.45 * k ) * 0.12;
	float glow = exp( - max( age - 6.0, 0.0 ) / 4.0 ) * smoothstep( 5.0, 7.0, age ) * ( 1.0 - 0.5 * k );
	vColour = uCloud * ( 0.88 + 0.18 * aSeed.w ) + uGlow * glow;
	vAt = position.xy;
	vec4 seen = viewMatrix * vec4( c, 1.0 );
	seen.xy += position.xy * size;
	gl_Position = projectionMatrix * seen;
}
`;

// And its rain: a shaft falling from its cloud to the sea, leaning downwind as rain does, streaked.
const shaftVertex = /* glsl */ `
attribute vec2 aCell;
attribute vec4 aSeed;
uniform vec4 uBurst[ ${BURSTS} ];
uniform float uTop[ ${BURSTS} ];
uniform vec3 uWind;
uniform vec3 uWindDir;
varying float vAlpha;
varying vec2 vUv;
varying float vSeed;
varying float vFar;
${shared}
void main() {
	int s = int( aCell.x + 0.5 );
	vec4 b = uBurst[ s ];
	float age = b.z;
	if ( age < 4.0 || age > ${RAIN_LASTS.toFixed(1)} ) {
		vAlpha = 0.0;
		gl_Position = vec4( 2.0, 2.0, 2.0, 1.0 );
		return;
	}
	float base = 0.55 * uTop[ s ];
	float width = ( 140.0 + 240.0 * aSeed.x ) * b.w * ( 0.8 + age / 50.0 );
	vec3 centre = vec3( b.x, 0.0, b.y ) + ( uAcross * ( aSeed.y - 0.5 ) + uAhead * ( aSeed.z - 0.5 ) ) * 320.0 * b.w + uWind * min( age, 40.0 ) * 0.25;
	vec3 toEye = cameraPosition - centre;
	vec3 right = normalize( vec3( toEye.z, 0.0, - toEye.x ) + vec3( 1e-4, 0.0, 0.0 ) );
	float y = position.y * 0.5 + 0.5;
	vec3 p = centre + right * position.x * width * 0.5 + vec3( 0.0, y * base, 0.0 ) + uWindDir * ( 1.0 - y ) * base * 0.18;
	vUv = vec2( position.x * 0.5 + 0.5, y );
	vSeed = aSeed.w;
	vFar = length( p - cameraPosition );
	vAlpha = smoothstep( 4.0, 14.0, age ) * ( 1.0 - smoothstep( 55.0, ${RAIN_LASTS.toFixed(1)}, age ) );
	gl_Position = projectionMatrix * viewMatrix * vec4( p, 1.0 );
}
`;
const shaftFragment = /* glsl */ `
uniform vec3 uRain;
uniform float uShaft;
uniform vec3 uMist;
uniform float uVisibility;
uniform float uTime;
varying float vAlpha;
varying vec2 vUv;
varying float vSeed;
varying float vFar;
void main() {
	float edge = smoothstep( 0.0, 0.3, vUv.x ) * smoothstep( 1.0, 0.7, vUv.x );
	float top = 1.0 - smoothstep( 0.72, 1.0, vUv.y );
	float x = vUv.x * 6.28318;
	float streaks = 0.65 + 0.35 * sin( x * 7.0 + vSeed * 40.0 ) * sin( x * 3.0 + vSeed * 17.0 + 1.0 );
	float falling = 0.8 + 0.2 * sin( vUv.y * 9.0 + uTime * 2.0 + sin( x * 5.0 + vSeed * 9.0 ) * 3.0 );
	vec3 c = mix( uRain, uMist, 1.0 - exp( - vFar / uVisibility ) );
	gl_FragColor = vec4( c, edge * top * streaks * falling * vAlpha * 0.14 * uShaft );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

export interface RanatFrame {
	since: number;
	time: number;
	boat: THREE.Vector3;
	ahead: THREE.Vector2;
	swellPeriod: number;
	waveHeight: number;
	wind: THREE.Vector3;
	visibility: number;
	day: number;
	gain: number;
	exposure: number;
	// The colour of the air (the fog), and the elements'.
	mist: THREE.Color;
	air: THREE.Color;
	water: THREE.Color;
	gold: THREE.Color;
}

const FIRE = new THREE.Color(0.78, 0.46, 0.32);
const EARTH = new THREE.Color(0.56, 0.54, 0.42);
// (A fixed little hash, for each haul's own place.)
const jitter = (n: number, r: number) => {
	const x = Math.sin(n * 12.9898 + r * 78.233) * 43758.5453;
	return x - Math.floor(x) - 0.5;
};
const between = (a: number, b: number) => a + (b - a) * Math.random();

function sprites(quad: THREE.PlaneGeometry, groups: number, each: number) {
	const geometry = new THREE.InstancedBufferGeometry();
	geometry.index = quad.index;
	geometry.setAttribute("position", quad.getAttribute("position"));
	const count = groups * each;
	const cells = new Float32Array(count * 2);
	const seeds = new Float32Array(count * 4);
	for (let i = 0; i < count; i++) {
		cells.set([Math.floor(i / each), 0], i * 2);
		seeds.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
	}
	geometry.setAttribute("aCell", new THREE.InstancedBufferAttribute(cells, 2));
	geometry.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 4));
	geometry.instanceCount = count;
	return geometry;
}

export function createRanat(scene: THREE.Scene, layer: number) {
	const resolution = { value: new THREE.Vector2(1, 1) };
	const common = {
		uBoat: { value: new THREE.Vector3() },
		uAhead: { value: new THREE.Vector3(0, 0, -1) },
		uAcross: { value: new THREE.Vector3(1, 0, 0) },
		uTime: { value: 0 },
	};
	const elements = [new THREE.Color(), EARTH.clone(), FIRE.clone(), new THREE.Color(), new THREE.Color()];
	const visibility = { value: 20_000 };
	const day = { value: 0 };
	const gain = { value: 1 };
	const seaHigh = { value: 1 };
	const wind = { value: new THREE.Vector3() };
	const windDir = { value: new THREE.Vector3(1, 0, 0) };
	const mist = { value: new THREE.Color() };

	// The six ropes.
	const ropeCells: [number, number][] = [];
	ROPES.forEach((rope, r) => {
		for (let f = 0; f < Math.round(FILAMENTS * ropeMight(rope.who)); f++) ropeCells.push([r, 0]);
	});
	const ropeGeometry = lines(ropeCells.length, SEGMENTS, (i) => ropeCells[i]!);
	const ropeUniforms = {
		...common,
		uSeats: { value: ROPES.map(() => new THREE.Vector3()) },
		uRope: { value: ROPES.map(() => new THREE.Vector4()) },
		uHaul: { value: ROPES.map(() => new THREE.Vector4(-1, 0, 0, 0)) },
		uMix: { value: ROPES.map((rope) => new THREE.Vector4(...rope.mix)) },
		uWhite: { value: ROPES.map((rope) => rope.white) },
		uElements: { value: elements },
		uSeaHigh: seaHigh,
		uVisibility: visibility,
		uDay: day,
		uGain: gain,
		uFilm: filmLook,
		uStrength: { value: 0 },
		uResolution: resolution,
		uPixelRatio: pixelRatio,
	};
	const ropes = new THREE.Mesh(ropeGeometry, new THREE.ShaderMaterial({ uniforms: ropeUniforms, vertexShader: ropeVertex, fragmentShader: ropeFragment, transparent: true, depthWrite: false, side: THREE.DoubleSide }));

	// The bursts' weaves.
	const burstGeometry = lines(BURSTS * BURST_FILAMENTS, BURST_SEGMENTS, (i) => [Math.floor(i / BURST_FILAMENTS), 0]);
	const burstUniforms = {
		...common,
		uBurst: { value: Array.from({ length: BURSTS }, () => new THREE.Vector4(0, 0, -1, 1)) },
		uTop: { value: Array.from({ length: BURSTS }, () => 700) },
		uWind: wind,
		uElements: { value: elements },
		uVisibility: visibility,
		uDay: day,
		uGain: gain,
		uFilm: filmLook,
		uStrength: { value: 1 },
		uResolution: resolution,
		uPixelRatio: pixelRatio,
	};
	const bursts = new THREE.Mesh(burstGeometry, new THREE.ShaderMaterial({ uniforms: burstUniforms, vertexShader: burstVertex, fragmentShader: ropeFragment.replace("0.07 * mix( 1.0, 3.0, uDay )", "0.035 * mix( 1.0, 2.0, uDay )"), transparent: true, depthWrite: false, side: THREE.DoubleSide }));

	// Lantern's throws.
	const throwGeometry = lines(THROWS * THROW_FILAMENTS, THROW_SEGMENTS, (i) => [Math.floor(i / THROW_FILAMENTS), 0]);
	const throwUniforms = {
		...common,
		uThrowA: { value: Array.from({ length: THROWS }, () => new THREE.Vector4()) },
		uThrowB: { value: Array.from({ length: THROWS }, () => new THREE.Vector4(-1, 1, 1, 1)) },
		uThrowC: { value: Array.from({ length: THROWS }, () => new THREE.Vector4()) },
		uHands: { value: new THREE.Vector3() },
		uWindDir: windDir,
		uWater: { value: new THREE.Color() },
		uVisibility: visibility,
		uDay: day,
		uGain: gain,
		uFilm: filmLook,
		uResolution: resolution,
		uPixelRatio: pixelRatio,
	};
	const throws = new THREE.Mesh(throwGeometry, new THREE.ShaderMaterial({ uniforms: throwUniforms, vertexShader: throwVertex, fragmentShader: throwFragment, transparent: true, depthWrite: false, side: THREE.DoubleSide }));

	// The soft things.
	const quad = new THREE.PlaneGeometry(2, 2);
	const streamGeometry = sprites(quad, R, STREAM);
	const streamUniforms = { ...common, uRope: ropeUniforms.uRope, uHaul: ropeUniforms.uHaul, uSpray: { value: new THREE.Color() }, uSeaHigh: seaHigh, uMist: mist, uVisibility: visibility };
	const stream = new THREE.Mesh(streamGeometry, new THREE.ShaderMaterial({ uniforms: streamUniforms, vertexShader: streamVertex, fragmentShader: softFragment, transparent: true, depthWrite: false }));
	const plumeGeometry = sprites(quad, BURSTS, PLUME);
	const plumeUniforms = { ...common, uBurst: burstUniforms.uBurst, uTop: burstUniforms.uTop, uWind: wind, uCloud: { value: new THREE.Color() }, uGlow: { value: new THREE.Color() }, uMist: mist, uVisibility: visibility };
	const plume = new THREE.Mesh(plumeGeometry, new THREE.ShaderMaterial({ uniforms: plumeUniforms, vertexShader: plumeVertex, fragmentShader: softFragment, transparent: true, depthWrite: false }));
	const shaftGeometry = sprites(quad, BURSTS, SHAFTS);
	const shaftUniforms = { ...common, uBurst: burstUniforms.uBurst, uTop: burstUniforms.uTop, uWind: wind, uWindDir: windDir, uRain: { value: new THREE.Color() }, uShaft: { value: 1 }, uMist: mist, uVisibility: visibility };
	const shafts = new THREE.Mesh(shaftGeometry, new THREE.ShaderMaterial({ uniforms: shaftUniforms, vertexShader: shaftVertex, fragmentShader: shaftFragment, transparent: true, depthWrite: false, side: THREE.DoubleSide }));

	// Loom's akasha and Sail's air, and the water they fling across.
	const helperGeometry = lines(2 * HELPER_FILAMENTS, HELPER_SEGMENTS, (i) => [Math.floor(i / HELPER_FILAMENTS), 0]);
	const helperUniforms = {
		...common,
		uHelperHands: { value: [new THREE.Vector3(), new THREE.Vector3()] },
		uHelperCast: { value: [0, 0] },
		uHelperTint: { value: [new THREE.Color(), new THREE.Color()] },
		uPlace: { value: new THREE.Vector3() },
		uCarried: { value: new THREE.Vector3() },
		uSwell: { value: 0 },
		uDay: day,
		uGain: gain,
		uFilm: filmLook,
		uStrength: { value: 1 },
		uResolution: resolution,
		uPixelRatio: pixelRatio,
	};
	const helpers = new THREE.Mesh(helperGeometry, new THREE.ShaderMaterial({ uniforms: helperUniforms, vertexShader: helperVertex, fragmentShader: ropeFragment.replace("0.07 * mix( 1.0, 3.0, uDay )", "0.04 * mix( 1.0, 2.5, uDay )"), transparent: true, depthWrite: false, side: THREE.DoubleSide }));
	const flungGeometry = sprites(quad, 1, FLUNG);
	const flungUniforms = {
		...common,
		uPlace: helperUniforms.uPlace,
		uCarried: helperUniforms.uCarried,
		uSwellPeriod: { value: 6 },
		uFlung: { value: 0 },
		uDrop: { value: new THREE.Color() },
		uResolution: resolution,
		uPixelRatio: pixelRatio,
	};
	const flung = new THREE.Mesh(flungGeometry, new THREE.ShaderMaterial({ uniforms: flungUniforms, vertexShader: flungVertex, fragmentShader: flungFragment, transparent: true, depthWrite: false, side: THREE.DoubleSide }));

	const meshes = [shafts, plume, stream, ropes, bursts, throws, helpers, flung];
	for (const mesh of meshes) {
		mesh.frustumCulled = false;
		mesh.renderOrder = WEAVE_RENDER_ORDER;
		mesh.layers.set(layer);
		mesh.visible = false;
		scene.add(mesh);
	}
	// (The rain and cloud under the weaves.)
	shafts.renderOrder = plume.renderOrder = stream.renderOrder = WEAVE_RENDER_ORDER - 1;

	const ahead = new THREE.Vector3();
	const across = new THREE.Vector3();
	// The haul's length, from the real swell as they begin, and kept.
	let pull: number | undefined;
	// Lantern's throws, and the last of them (so that the next is unlike it).
	const thrown = Array.from({ length: THROWS }, () => ({ at: -1, lasts: 0, reached: 0 }));
	let nextThrow = LANTERN_FROM;
	let lastStyle = -1;
	let lastBearing = 0;
	let called = 0;
	let now = { since: -1 };
	const STYLES = ["a thread", "a sheaf", "up the wind", "far and then up", "a few apart"];

	const off = () => {
		for (const mesh of meshes) mesh.visible = false;
		pull = undefined;
		for (const one of thrown) one.at = -1;
		nextThrow = LANTERN_FROM;
		called = 0;
		now = { since: -1 };
	};

	const throwOne = (slot: number, since: number) => {
		let style = Math.floor(Math.random() * STYLES.length);
		if (style === lastStyle) style = (style + 1 + Math.floor(Math.random() * (STYLES.length - 1))) % STYLES.length;
		let bearing = between(-65, 65);
		if (Math.abs(bearing - lastBearing) < 25) bearing = bearing > 0 ? bearing - 50 : bearing + 50;
		lastStyle = style;
		lastBearing = bearing;
		const far = [between(100, 500), between(150, 600), between(200, 800), between(900, 2200), between(60, 250)][style]!;
		const rise = between(4, 14);
		const hold = between(4, 18);
		const fade = between(3, 9);
		throwUniforms.uThrowA.value[slot]!.set(THREE.MathUtils.degToRad(bearing), far, between(450, 900), style);
		throwUniforms.uThrowC.value[slot]!.set(style === 1 ? between(0.25, 0.6) : style === 4 ? between(0.5, 1.1) : 0, style === 2 ? between(0.3, 0.9) : between(0, 0.15), Math.random(), 0);
		throwUniforms.uThrowB.value[slot]!.set(0, rise, hold, fade);
		thrown[slot] = { at: since, lasts: rise + hold + fade + (style === 4 ? 3 : 0), reached: 0 };
	};

	const update = (frame: RanatFrame | undefined) => {
		if (!frame || frame.since < 0) {
			off();
			return;
		}
		const since = frame.since;
		ahead.set(frame.ahead.x, 0, frame.ahead.y);
		across.set(-frame.ahead.y, 0, frame.ahead.x);
		const boat = frame.boat;
		common.uBoat.value.copy(boat);
		common.uAhead.value.copy(ahead);
		common.uAcross.value.copy(across);
		common.uTime.value = frame.time;
		resolution.value.set(window.innerWidth, window.innerHeight).multiplyScalar(pixelRatio.value);
		visibility.value = Math.max(frame.visibility || 20_000, 800);
		day.value = frame.day;
		gain.value = frame.gain;
		seaHigh.value = frame.waveHeight || 1;
		wind.value.copy(frame.wind);
		windDir.value.copy(frame.wind).setY(0);
		if (windDir.value.lengthSq() < 1e-6) windDir.value.copy(across);
		windDir.value.normalize();
		mist.value.copy(frame.mist);
		elements[0]!.copy(frame.water);
		elements[3]!.copy(frame.air);
		elements[4]!.copy(frame.gold);
		if (pull === undefined) pull = THREE.MathUtils.clamp(4 * (frame.swellPeriod || 10), 30, 52);

		// The six: each casts out, then hauls, bursts it, and is still, in her own time.
		ropeUniforms.uStrength.value = THREE.MathUtils.smoothstep(since, 0.5, 3);
		ROPES.forEach((rope, r) => {
			const hands = seatOf(rope.who, boat, ahead, across);
			ropeUniforms.uSeats.value[r]!.copy(hands).addScaledVector(ahead, 6).setY(boat.y - 2.2);
			const cast = THREE.MathUtils.smoothstep(since, rope.joins, rope.joins + 5);
			ropeUniforms.uRope.value[r]!.set(rope.bearing, rope.far, 1.05 * cast, 1.4 * Math.cbrt(ropeMight(rope.who)));
			const cycle = pull! + 12 + rope.rest;
			const phase = since - (rope.joins + 5);
			const haul = ropeUniforms.uHaul.value[r]!;
			if (phase < 0) {
				haul.set(-1, 0, 0, 0);
			} else {
				const n = Math.floor(phase / cycle);
				const p = phase - n * cycle;
				if (p < pull!) {
					const u = p / pull!;
					const eased = u * u * (3 - 2 * u);
					const front = rope.far - (rope.far - rope.burst) * eased;
					haul.set(front, 150 + 650 * (1 - eased), THREE.MathUtils.smoothstep(p, 0, 3) * (1 - THREE.MathUtils.smoothstep(p, pull! - 1.5, pull!)), 0);
				} else {
					// In the stillness after it, slack.
					haul.set(-1, 0, 0, THREE.MathUtils.smoothstep(p, pull! + 8, pull! + 14) * (1 - THREE.MathUtils.smoothstep(p, cycle - 4, cycle)));
				}
				// Her last two bursts (where, how long since, and her size).
				for (let back = 0; back < 2; back++) {
					const m = n - back - (p < pull! ? 1 : 0);
					const slot = 2 * r + (((m % 2) + 2) % 2);
					const at = burstUniforms.uBurst.value[slot]!;
					if (m < 0) {
						at.setZ(-1);
						continue;
					}
					const bearing = rope.bearing + THREE.MathUtils.degToRad(6 * jitter(m, r));
					const out = rope.burst + 500 * jitter(m + 7, r);
					at.set(
						boat.x + (ahead.x * Math.cos(bearing) + across.x * Math.sin(bearing)) * out,
						boat.z + (ahead.z * Math.cos(bearing) + across.z * Math.sin(bearing)) * out,
						since - (rope.joins + 5 + m * cycle + pull!),
						0.6 + 0.6 * rope.size,
					);
					burstUniforms.uTop.value[slot] = 650 + 250 * rope.size;
				}
			}
		});

		// Lantern's throws of water into the sky, each unlike the last.
		throwUniforms.uHands.value.copy(seatOf(LANTERN, boat, ahead, across)).setY(boat.y - 1.4);
		throwUniforms.uWater.value.copy(frame.water);
		let reaching = 0;
		thrown.forEach((one, slot) => {
			const b = throwUniforms.uThrowB.value[slot]!;
			if (one.at >= 0) {
				const age = since - one.at;
				if (age > one.lasts) {
					one.at = -1;
					b.setX(-1);
				} else {
					b.setX(age);
					// (Reaching the cloud once it has risen, until it is let go.)
					one.reached = THREE.MathUtils.smoothstep(age, b.y * 0.8, b.y) * (1 - THREE.MathUtils.smoothstep(age, b.y + b.z, b.y + b.z + b.w));
					reaching += one.reached;
				}
			}
			if (one.at < 0 && since >= nextThrow) {
				throwOne(slot, since);
				// (Unsteady: sometimes two close together, sometimes a long wait.)
				nextThrow = since + (Math.random() < 0.3 ? between(1, 4) : between(6, 20));
			}
		});
		const want = THREE.MathUtils.clamp(reaching / 2, 0, 1);
		called += (want - called) * Math.min(1, (1 / 60) * (want > called ? 3 : 1));

		// Loom's akasha into the sea, and Sail's air lifting it off and across, a gust to each weak swell
		// (two to each of the real swell's periods).
		const toPlace = (where: { bearing: number; far: number }, target: THREE.Vector3) => {
			const b = THREE.MathUtils.degToRad(where.bearing);
			return target.set(boat.x + (ahead.x * Math.cos(b) + across.x * Math.sin(b)) * where.far, 0, boat.z + (ahead.z * Math.cos(b) + across.z * Math.sin(b)) * where.far);
		};
		toPlace(AKASHA_AT, helperUniforms.uPlace.value);
		toPlace(CARRIED_TO, helperUniforms.uCarried.value);
		helperUniforms.uHelperHands.value[0]!.copy(seatOf(LOOM, boat, ahead, across)).addScaledVector(ahead, 3).setY(boat.y - 1.2);
		helperUniforms.uHelperHands.value[1]!.copy(seatOf(SAIL, boat, ahead, across)).addScaledVector(ahead, 3).setY(boat.y - 1.2);
		helperUniforms.uHelperCast.value[0] = 1.05 * THREE.MathUtils.smoothstep(since, AKASHA_FROM, AKASHA_FROM + 4);
		helperUniforms.uHelperCast.value[1] = 1.05 * THREE.MathUtils.smoothstep(since, ASPIRATE_FROM, ASPIRATE_FROM + 4);
		helperUniforms.uHelperTint.value[0]!.copy(frame.gold);
		helperUniforms.uHelperTint.value[1]!.copy(frame.air);
		const swellPeriod = THREE.MathUtils.clamp((frame.swellPeriod || 10) / 2, 3, 7);
		helperUniforms.uSwell.value = Math.max(0, Math.sin((2 * Math.PI * frame.time) / swellPeriod)) ** 2;
		flungUniforms.uSwellPeriod.value = swellPeriod;
		flungUniforms.uFlung.value = THREE.MathUtils.smoothstep(since, ASPIRATE_FROM + 4, ASPIRATE_FROM + 14) * THREE.MathUtils.lerp(0.5, 0.35, frame.day);
		flungUniforms.uDrop.value.copy(frame.mist).lerp(new THREE.Color(1, 1, 1), THREE.MathUtils.lerp(0.35, 0.7, frame.day)).lerp(frame.gold, 0.15).multiplyScalar(THREE.MathUtils.lerp(1.8, 1, frame.day));

		// Colours: the spray and cloud the air's own, lifted by day; the rain a little darker than the air.
		const lift = THREE.MathUtils.lerp(0.12, 0.3, frame.day);
		streamUniforms.uSpray.value.copy(frame.mist).lerp(new THREE.Color(1, 1, 1), lift).multiplyScalar(THREE.MathUtils.lerp(1.2, 1, frame.day));
		// (By night a cloud is as dark as the night: seen only where the weave that burst it lights it.)
		plumeUniforms.uCloud.value.copy(frame.mist).lerp(new THREE.Color(1, 1, 1), lift * 0.8).multiplyScalar(THREE.MathUtils.lerp(0.55, 1, frame.day));
		plumeUniforms.uGlow.value.copy(frame.gold).lerp(FIRE, 0.4).multiplyScalar((THREE.MathUtils.lerp(0.5, 0.15, frame.day) * frame.gain) / 1.5);
		// (By night rain is darker than the air, not lighter: it is seen only where it hides what is behind it.)
		shaftUniforms.uRain.value.copy(frame.mist).multiplyScalar(THREE.MathUtils.lerp(0.8, 0.72, frame.day));
		shaftUniforms.uShaft.value = THREE.MathUtils.lerp(0.5, 1, frame.day);

		const blending = frame.day > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending;
		for (const mesh of [ropes, bursts, throws, helpers]) (mesh.material as THREE.ShaderMaterial).blending = blending;
		for (const mesh of meshes) mesh.visible = true;
		now = { since };
	};

	// 0..1 how far Lantern's calls have brought the rain on over the boat, eased.
	const rainCalled = () => (now.since < 0 ? 0 : called);

	const describe = () =>
		now.since < 0
			? []
			: [
					`${Math.round(now.since)} s · each haul ${pull?.toFixed(0)} s · Lantern's rain called ${Math.round(called * 100)}%`,
					...ROPES.map((rope, r) => {
						const haul = ropeUniforms.uHaul.value[r]!;
						const doing = haul.x >= 0 ? `hauling, the water ${Math.round(haul.x)} m out` : haul.w > 0.5 ? "still" : "bursting it";
						return `${NAMES[rope.who]}: ${Math.round(THREE.MathUtils.radToDeg(rope.bearing))}° off ahead to ${Math.round(rope.far)} m, bursting at about ${Math.round(rope.burst)} m; ${doing}`;
					}),
					`${NAMES[LOOM]}: akasha into the sea ${AKASHA_AT.far} m out at ${AKASHA_AT.bearing}°${now.since >= AKASHA_FROM ? "" : " (not yet)"} · ${NAMES[SAIL]}: lifting it across to ${CARRIED_TO.bearing}°, ${Math.round(flungUniforms.uFlung.value * 100)}%`,
					...thrown.map((one, slot) => (one.at < 0 ? `Lantern ${slot + 1}: free` : `Lantern ${slot + 1}: ${STYLES[throwUniforms.uThrowA.value[slot]!.w]!} at ${Math.round(THREE.MathUtils.radToDeg(throwUniforms.uThrowA.value[slot]!.x))}°, ${Math.round(throwUniforms.uThrowA.value[slot]!.y)} m out, ${Math.round(now.since - one.at)} s`)),
				];

	const dispose = () => {
		for (const mesh of meshes) {
			scene.remove(mesh);
			(mesh.material as THREE.Material).dispose();
		}
		for (const geometry of [ropeGeometry, burstGeometry, throwGeometry, streamGeometry, plumeGeometry, shaftGeometry, helperGeometry, flungGeometry, quad]) geometry.dispose();
	};

	return { update, rainCalled, describe, dispose };
}
