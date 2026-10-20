// Peta's storm (the owner, 18 October: "make all the channelers extremely angry because they have
// encountered a death and they wish to honour the death by creating the most extreme storm
// possible. This death is Peta's"; and then: "They are all so distressed that there are three
// strongest ancestor channellers for each of them that they are linked to"). Set by "wrath" in
// storm.json, while the storm is on; ?wrath shows it from the moment the page opens, ?wrath=40
// forty seconds in.
//
// Fourteen on the boat now, each linked to three ancestors: fifty-six channelling one storm.
// (Manulani joined on 18 October, the owner: "a new strong channeller who has 112% power on the
// boat called Manulani. She is capable of casting a bright light across the ocean at night time as
// though it is almost noon". 1.12 times the strongest, the owner confirmed: see MANULANI.)
//
// Peta's wave (the owner chose three levers at once, 18 October). At the deepest breath of each
// run the four thirds raise one wave together where the strongest's core meets the sea, by the
// ways the sea itself makes its greatest waves:
//   the strongest  sets the place: the core, 650 m ahead;
//   Siuan's four   with Fathom and Keel, and all twelve, lay the lens: each a long train of her
//                  own length and her own heading, timed so that every crest reaches the place at
//                  the same moment (dispersive focusing, the Draupner wave's way): low scattered
//                  waves come in, run together into one wall some 40 m above the storm's sea, and
//                  go apart again as they roll on under the boat (lensWaves in gerstner-waves.ts);
//   Leane's four   drive a current against the swell there, which shortens the waves and stands
//                  them up sheer, as off the Agulhas, hardest at the deepest breath (lensCurrent);
//   Moiraine's four hold the second swell turned 40 degrees across the first, a crossing sea,
//                  whose meeting crests heap into peaks (OceanBackground.vue).
//
// Manulani's light. A sphere, not a cone: she raises a small sun, 5.2 km over the sea and 2.5 km
// ahead, so high that under it the light comes down as it does near noon, and it lights the sea as
// a single bright point must, each place by how squarely it faces it and by the inverse square of
// its distance (manuLight in gerstner-waves.ts): near noon for kilometres about the boat, falling
// away, night again at the horizon under a night sky with its stars. It is above the view; it is
// seen by its light on the sea, its rope going up from the bow, and the haze it lights round it.
// She raises it as each run of the God's breaths begins and lowers it to a glow in the pauses.
//
// Their anger is their grief turned to heat, and what they do with it is the storm's own engine
// run as hard as it will go (Emanuel's heat engine, the great calming in reverse: wind² grows with
// the heat the sea gives the air and the engine's efficiency):
//   the strongest   first, alone: a rope out low over the sea to a point far ahead, and up from it
//                   a great turning column into the cloud, the storm's core; they turn it, slowly,
//                   always, clockwise as a southern storm turns;
//   Siuan's four    heave the sea's heat up: each plunges into the sea and draws it up in a
//                   turning spout that leans in to feed the core;
//   Leane's four    drive the wind round: each flings a rope out low and sends it spiralling in
//                   round the core at her own height, lashing with every gust;
//   Moiraine's four draw the air up out of the low: each climbs steeply to the top of the cloud and
//                   fans out there, the outflow, cold and slow and the largest;
//   the ancestors   three to each, the strongest of those before them: they come in from far out
//                   over the ocean, low along the horizon, and pour into the hands of the one they
//                   are linked to.
// They work with the swell, which is a dying God's breathing (godsBreath in channelled-storm.ts),
// and they work it as Virginia Woolf writes, in conjunctions (the owner: "consider Virginia Woolf's
// style of literary conjunctions"). Her sentences seldom stop; they go on by "and", each clause
// laid on the last before it has finished, so that nothing is set over anything else and the
// whole moves like a wave ("and the waves... and the light... and"); they turn on "but"; and they
// hold on the semicolon, a pause that keeps both sides. So:
//   and      on each breath of the sea the strongest hauls first, the main clause, and the twelve
//            follow round the ring, each beginning before the one before her has let go, so that
//            the haul runs through all thirteen as one long sentence and never once comes to a stop;
//   but      as the run of breaths wanes the chain turns, and runs back round the other way;
//   ;        when the God's breath stops they do not let go: they hold, drawn in, taut and still,
//            lit and waiting, until the sea breathes again.
// How hard each haul is, is how deep the breath is.
//
// Anger shows in how they work, never in anything sharp: each hauls on a short hard in-breath and
// a heavy release; the ropes thrash in long smooth waves; the colour runs hot
// towards ember while it stays tamed to the sea's and sky's; and the mass, ropes thick as hawsers,
// the four mighty two and a half times the others, the strongest's column nearly five. Every line
// one curve; the anger rises in each in her own time (Leane's fast, Siuan's steady, Moiraine's
// slow and deepest), and never flickers.
import * as THREE from "three";
import type { GodsBreath } from "./channelled-storm";
import { pixelRatio, ribbonShaderChunk, stripIndices, tameShaderChunk, unplaced, WEAVE_RENDER_ORDER } from "./weave";

const SEGMENTS = 120;
// Filaments to a measure; the four mighty carry 2.5 measures, the strongest about 4.9 (as MIGHT in
// channellers.ts).
const FIBRES = 64;
const ANCESTOR_FIBRES = 36;
const STRONGEST_ANCESTOR_FIBRES = 80;
// As in mourning.ts: the twelve's places at the rail, whose third each is (0 Siuan's, 1 Leane's,
// 2 Moiraine's), which of its four, and who of them are the mighty (Keel, Kite, Fathom, Listener).
const SLOTS = [0, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const THIRDS = [0, 1, 0, 1, 2, 2, 1, 0, 2, 1, 0, 2];
const MEMBERS = THIRDS.map((third, i) => THIRDS.slice(0, i).filter((other) => other === third).length);
const MIGHTY = [0, 1, 2, 5];
const STRONGEST = 12;
const MANULANI_AT = 13;
// Manulani's strength against the strongest's ("112% power"), and so how many measures of
// filaments her rope carries (by the cube root, as MIGHT in channellers.ts: about 5.1).
export const MANULANI = 1.12;
const MANULANI_MEASURES = 4.9 * Math.cbrt(MANULANI);
// How eager each is to begin, and how fast her anger climbs (AES_SEDAI's eager, in SLOTS' order).
const EAGER = [0.55, 0.8, 0.4, 0.8, 0.45, 0.35, 0.75, 0.45, 0.35, 0.75, 0.35, 0.45];

const vertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute float aWho;
attribute float aLine;
attribute vec4 aSeed;
uniform float uTime;
uniform vec3 uBoat;
uniform vec2 uAhead;
uniform vec3 uWindDir;
uniform vec3 uCore;
uniform float uCloud;
uniform float uSpin;
uniform float uGust;
// How far the swirl, lash and thrash have run (their speed integrated, so that they can slow and
// still without a jump), and 0..1 how far they hold through a pause in the God's breath.
uniform float uFlow;
uniform float uHold;
// For each of the thirteen (the strongest last): how far her anger has risen, her haul (0..1),
// how far her own rope has grown out (0..1), how far her ancestors have come in (0..1).
uniform vec4 uState[ 14 ];
// 0..1 how far it is drawn at all (in the storm for both, it gives way to the five's: five.ts).
uniform float uPresence;
// Manulani's sphere of light.
uniform vec3 uSphere;
// Where each of the twelve goes into the sea (Siuan's, on the water as it is there).
uniform vec3 uFoot[ 12 ];
uniform vec3 uTints[ 3 ];
uniform float uWhiteMesh;
uniform float uSheathPass;
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;
${ribbonShaderChunk}
${tameShaderChunk}
const float THIRD_OF[ 14 ] = float[ 14 ]( ${THIRDS.map((x) => `${x}.0`).join(", ")}, 3.0, 4.0 );
const float MEMBER_OF[ 14 ] = float[ 14 ]( ${MEMBERS.map((x) => `${x}.0`).join(", ")}, 0.0, 0.0 );
const float SEAT_OF[ 14 ] = float[ 14 ]( ${SLOTS.map((x) => `${x}.0`).join(", ")}, 2.0, 13.0 );
const vec3 EMBER = vec3( 1.0, 0.36, 0.14 );

vec3 aheadDir() { return vec3( uAhead.x, 0.0, uAhead.y ); }
vec3 acrossDir() { return vec3( - uAhead.y, 0.0, uAhead.x ); }
vec3 bearing( float a ) { return aheadDir() * cos( a ) + acrossDir() * sin( a ); }
// (Round the core, in the world's own frame: a growing angle turns clockwise seen from above.)
vec3 circling( float a ) { return vec3( cos( a ), 0.0, sin( a ) ); }
vec3 seatAt( float who ) {
	// (Manulani at the bow, a little ahead of the four.)
	if ( who > 12.5 ) return uBoat + aheadDir() * 2.6 + vec3( 0.0, - 0.8, 0.0 );
	if ( who < 3.5 ) return uBoat + acrossDir() * ( who - 1.5 ) * 1.5 + vec3( 0.0, - 1.2, 0.0 ) + aheadDir() * 0.5;
	float k = who - 4.0;
	float side = mod( k, 2.0 ) * 2.0 - 1.0;
	float back = floor( k / 2.0 );
	return uBoat + acrossDir() * side * ( 2.2 + 0.2 * back ) + vec3( 0.0, - 1.6, 0.0 ) - aheadDir() * ( 1.0 + 1.6 * back );
}
vec3 bezier( vec3 a, vec3 b, vec3 c, vec3 d, float t ) {
	float s = 1.0 - t;
	return s * s * s * a + 3.0 * s * s * t * b + 3.0 * s * t * t * c + t * t * t * d;
}
// The core's axis at a height share s: leaning downwind as it climbs (the wind is stronger aloft),
// and wandering a little, never plumb.
vec3 coreAxis( float s ) {
	return uCore + vec3( 0.0, s * uCloud * 1.15, 0.0 ) + uWindDir * s * s * 220.0
		+ acrossDir() * 40.0 * sin( s * 3.0 + uTime * 0.05 ) * s;
}

// The strongest's: out low to the core's foot, and up it as a broad turning column.
vec3 strongestRope( float t, float haul ) {
	vec3 seat = seatAt( 2.0 );
	vec3 toward = normalize( vec3( uCore.x - seat.x, 0.0, uCore.z - seat.z ) + vec3( 1e-4 ) );
	if ( t < 0.3 ) return bezier( seat, seat + vec3( 0.0, 8.0, 0.0 ) + toward * 60.0, uCore - toward * 260.0 + vec3( 0.0, 25.0, 0.0 ), uCore, t / 0.3 );
	float s = ( t - 0.3 ) / 0.7;
	float r = ( 160.0 * pow( s, 1.2 ) + 30.0 * smoothstep( 0.0, 0.15, s ) ) * ( 0.7 + 0.6 * aSeed.z ) * ( 1.0 - 0.12 * haul );
	float a = aSeed.y * 6.28318 + s * 3.4 + uSpin;
	return coreAxis( s ) + circling( a ) * r + vec3( 0.0, 30.0 * haul * s, 0.0 );
}

// Manulani's: up from the bow to her sphere, in one long curve.
vec3 manulaniRope( float t ) {
	vec3 seat = seatAt( 13.0 );
	return bezier( seat, seat + vec3( 0.0, 400.0, 0.0 ) + aheadDir() * 60.0, uSphere - vec3( 0.0, 1800.0, 0.0 ) - aheadDir() * 500.0, uSphere, t );
}

// Siuan's: plunged into the sea, and drawn up out of it in a turning spout leaning in to the core.
vec3 siuanRope( float who, float t, float haul ) {
	vec3 seat = seatAt( SEAT_OF[ int( who ) ] );
	vec3 foot = uFoot[ int( who ) ];
	vec3 toward = normalize( vec3( foot.x - seat.x, 0.0, foot.z - seat.z ) + vec3( 1e-4 ) );
	if ( t < 0.3 ) return bezier( seat, seat + vec3( 0.0, 6.0 + 10.0 * haul, 0.0 ) + toward * 40.0, foot + vec3( 0.0, 30.0, 0.0 ) - toward * 90.0, foot - vec3( 0.0, 4.0, 0.0 ), t / 0.3 );
	float s = ( t - 0.3 ) / 0.7;
	float member = MEMBER_OF[ int( who ) ];
	vec3 top = coreAxis( 0.75 ) + circling( member * 1.57 + uSpin ) * 140.0;
	vec3 axis = bezier( foot - vec3( 0.0, 4.0, 0.0 ), foot + vec3( 0.0, 320.0, 0.0 ), mix( foot, top, 0.6 ) + vec3( 0.0, 120.0, 0.0 ), top, s );
	float r = ( 5.0 + 45.0 * s ) * ( 0.6 + 0.8 * aSeed.z ) * ( 1.0 + 0.25 * haul * sin( 3.14159 * s ) );
	float a = aSeed.y * 6.28318 + s * ( 7.0 + member ) + uSpin * 1.6;
	return axis + circling( a ) * r;
}

// Leane's: flung out low, and spiralling in round the core at her own height, lashing.
vec3 leaneRope( float who, float t, float haul, float rage ) {
	vec3 seat = seatAt( SEAT_OF[ int( who ) ] );
	float member = MEMBER_OF[ int( who ) ];
	vec2 fromCore = seat.xz - uCore.xz;
	float r0 = length( fromCore );
	float a0 = atan( fromCore.y, fromCore.x );
	float h = 50.0 + 85.0 * member;
	float sweep = 3.6 + 0.45 * member;
	float r = mix( r0, 140.0 + 40.0 * member, pow( t, 0.8 ) );
	float a = a0 + t * sweep;
	float y = seat.y + h * smoothstep( 0.0, 0.25, t ) + 0.45 * uCloud * smoothstep( 0.7, 1.0, t );
	vec3 p = vec3( uCore.x, 0.0, uCore.z ) + circling( a ) * r + vec3( 0.0, y, 0.0 );
	// The lash: long waves run out along it, faster and fuller the angrier she is and the harder it gusts.
	float lash = sin( t * 11.0 - uFlow * 1.2 + who ) * ( 10.0 + 40.0 * rage * ( 0.6 + 0.6 * uGust ) ) * ( 1.0 - 0.85 * uHold ) * smoothstep( 0.0, 0.3, t );
	return p + vec3( 0.0, lash * 0.6, 0.0 ) + circling( a ) * lash * 0.8 + vec3( 0.0, 20.0 * haul * t, 0.0 );
}

// Moiraine's: steeply up to the top of the cloud, and fanned out along it, away from the core.
vec3 moiraineRope( float who, float t, float haul ) {
	vec3 seat = seatAt( SEAT_OF[ int( who ) ] );
	float member = MEMBER_OF[ int( who ) ];
	vec3 top = coreAxis( 1.0 ) + circling( member * 1.57 + 0.8 + uSpin * 0.5 ) * 120.0;
	vec3 toward = normalize( vec3( top.x - seat.x, 0.0, top.z - seat.z ) + vec3( 1e-4 ) );
	if ( t < 0.5 ) return bezier( seat, seat + vec3( 0.0, 160.0, 0.0 ) + toward * 120.0, top - vec3( 0.0, 360.0 - 60.0 * haul, 0.0 ) - toward * 120.0, top, t / 0.5 );
	float s = ( t - 0.5 ) / 0.5;
	vec2 out2 = top.xz - uCore.xz;
	float a = atan( out2.y, out2.x ) + ( aSeed.z - 0.5 ) * 2.0 - s * 0.6;
	return top + circling( a ) * ( 1100.0 * s ) + vec3( 0.0, - 140.0 * s * s + 30.0 * haul * s + 12.0 * sin( uTime * 0.12 + aSeed.y * 6.0 ) * s, 0.0 );
}

// An ancestor, from far out over the ocean, low on the horizon, into the hands of the one she is
// linked to.
vec3 ancestor( float who, float line, float t ) {
	vec3 seat = seatAt( SEAT_OF[ int( who ) ] );
	float a = ( fract( sin( ( who * 3.0 + line ) * 12.9898 ) * 43758.5453 ) - 0.5 ) * 3.0;
	float d = 3500.0 + 3500.0 * fract( sin( ( who * 3.0 + line ) * 78.233 ) * 43758.5453 );
	vec3 far = uBoat + bearing( a ) * d + vec3( 0.0, 30.0 + 40.0 * line, 0.0 );
	far.y = uBoat.y + 30.0 + 40.0 * line;
	vec3 toward = normalize( vec3( seat.x - far.x, 0.0, seat.z - far.z ) + vec3( 1e-4 ) );
	vec3 p = bezier( far, far + toward * d * 0.4 + vec3( 0.0, 50.0, 0.0 ), seat - toward * 160.0 + bearing( a + 1.2 ) * 120.0 + vec3( 0.0, 60.0, 0.0 ), seat, t );
	// (Riding in over the ocean in a long slow swell.)
	return p + vec3( 0.0, 14.0 * sin( t * 9.0 - uTime * 0.5 + who + line ) * ( 1.0 - t ), 0.0 );
}

vec3 placeAt( float t ) {
	vec4 st = uState[ int( aWho ) ];
	if ( aLine > - 0.5 ) return ancestor( aWho, aLine, t );
	if ( aWho > 12.5 ) return manulaniRope( t );
	if ( aWho > 11.5 ) return strongestRope( t, st.y );
	float third = THIRD_OF[ int( aWho ) ];
	if ( third < 0.5 ) return siuanRope( aWho, t, st.y );
	if ( third < 1.5 ) return leaneRope( aWho, t, st.y, st.x );
	return moiraineRope( aWho, t, st.y );
}

void main() {
	vec4 st = uState[ int( aWho ) ];
	float rage = st.x;
	float haul = st.y;
	float third = THIRD_OF[ int( aWho ) ];
	bool own = aLine < - 0.5;
	vec3 here = placeAt( aT );
	vec3 next = placeAt( min( aT + 0.01, 1.0 ) ) + ( aT >= 0.99 ? here - placeAt( aT - 0.01 ) : vec3( 0.0 ) );
	// Each filament wanders about the line: a hawser's girth, wider and wilder the angrier she is,
	// drawn tighter on each haul.
	vec3 n1 = normalize( cross( next - here + vec3( 1e-5 ), vec3( 0.0, 1.0, 0.0 ) ) + vec3( 1e-4 ) );
	float girth = own ? ( aWho > 11.5 ? 3.0 : 6.0 + 9.0 * rage ) : 7.0;
	// (Held through a pause, everything is drawn in, as a held breath is.)
	float spread = ( 0.4 + girth * sin( 3.14159 * aT ) ) * sqrt( aSeed.z ) * ( 1.0 - 0.3 * haul ) * ( 1.0 - 0.4 * uHold );
	float turn = aSeed.y * 6.28318 + aT * 12.0 + uFlow * 0.4 * ( aSeed.x - 0.5 );
	vec3 off = ( n1 * cos( turn ) + vec3( 0.0, sin( turn ), 0.0 ) ) * spread;
	// The thrash: a long smooth wave through every filament.
	off += n1 * sin( aT * 9.0 - uFlow + aSeed.x * 3.0 ) * ( 2.0 + 10.0 * rage ) * ( 1.0 - 0.85 * uHold ) * sin( 3.14159 * aT ) * ( own ? 1.0 : 0.3 );
	here += off;
	next += off;
	float shown;
	if ( own ) {
		// Grown out from the hands.
		float grow = st.z * 1.1 - 0.1 * aSeed.w;
		shown = smoothstep( grow, grow - 0.04, aT );
		// Brighter on each haul; laid on unevenly along its length, as a brush lays colour.
		// (Held, steady and lit, waiting.)
		shown *= mix( 0.6 + 0.6 * haul, 0.8, uHold ) * ( 0.55 + 0.45 * smoothstep( - 0.6, 0.6, sin( aT * 6.0 + aSeed.y * 6.0 ) + 0.5 * sin( aT * 15.0 + 2.0 ) ) );
	} else {
		// Coming in from far off, and pouring into her hands with each of her hauls.
		float come = st.w * 1.1 - 0.1 * aSeed.w;
		shown = smoothstep( 1.0 - come, 1.04 - come, aT );
		shown *= 0.5 + 0.5 * smoothstep( 0.5, 1.0, sin( aT * 8.0 - uFlow * 1.2 + aSeed.y * 6.0 ) * 0.5 + 0.5 ) + 0.3 * haul * aT;
	}
	shown *= uPresence;
	// (The ancestors' strands fade well before the boat: all fifty-odd meeting at the hands filled
	// the foreground with a fan of broad bands, worst when the boat rides high on the sea.)
	shown *= smoothstep( 1.0, 0.9, aT ) * ( own ? smoothstep( 25.0, 110.0, length( here - cameraPosition ) ) : smoothstep( 80.0, 400.0, length( here - cameraPosition ) ) );
	vAlpha = shown;
	// Tamed to the background's colour, running hot towards ember with her anger; her ancestors
	// in her own colour, cooler and paler.
	// (The strongest's white; Manulani's the colour of her light, near noon's.)
	if ( aWho > 12.5 ) vTint = vec3( 1.0, 0.88, 0.66 );
	else if ( aWho > 11.5 ) vTint = vec3( 1.0 );
	else if ( own ) vTint = tame( mix( uTints[ int( third + 0.5 ) ], EMBER, 0.5 * rage * ( 0.6 + 0.4 * haul ) ), mix( 0.22, 0.38, rage ) ) * ( 1.0 + 0.3 * rage );
	else vTint = tame( uTints[ int( third + 0.5 ) ], 0.18 );
	vEdge = aSide;
	mat4 vp = projectionMatrix * viewMatrix;
	float width = uSheathPass > 0.5 ? 5.0 : ( uWhiteMesh > 0.5 ? 1.0 : 1.1 );
	gl_Position = ribbonPosition( vp * vec4( here, 1.0 ), vp * vec4( next, 1.0 ), aSide, width );
}
`;

const fragment = /* glsl */ `
uniform float uGain;
uniform float uDay;
uniform float uWhite;
uniform vec3 uSheath;
uniform float uWhiteMesh;
uniform float uSheathPass;
uniform float uOpacity;
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;
void main() {
	float across = abs( vEdge );
	if ( uSheathPass > 0.5 ) {
		// By day, under the strongest's white, a soft sheath of the site's deep blue (never white on white).
		gl_FragColor = vec4( uSheath, exp( - across * across * 2.5 ) * min( 1.0, vAlpha * 0.5 ) );
	} else if ( uWhiteMesh > 0.5 ) {
		float body = 1.0 - smoothstep( 0.7, 1.0, across );
		vec3 night = vec3( 0.93, 0.96, 1.0 ) * vTint * uGain;
		gl_FragColor = vec4( mix( night, vTint * uWhite, uDay ), body * vAlpha * uOpacity * mix( 1.0, 3.0, uDay ) );
	} else {
		float body = exp( - across * across * 3.0 ) * ( 1.0 - smoothstep( 0.8, 1.0, across ) );
		vec3 colour = mix( vTint, pow( vTint, vec3( 2.6 ) ) * 0.35, uDay );
		gl_FragColor = vec4( colour * uGain, body * vAlpha * uOpacity * mix( 1.0, 3.5, uDay ) );
	}
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

export interface WrathFrame {
	time: number;
	delta: number;
	// Seconds since the wrath began.
	since: number;
	camera: THREE.Camera;
	// 0..1 how bright Manulani's light is (manulaniLevel), and its brightness before tone mapping.
	manu: number;
	glowGain: number;
	// The God's breath, which is the swell's.
	breath: GodsBreath;
	boat: THREE.Vector3;
	ahead: THREE.Vector2;
	wind: THREE.Vector3;
	// 0..1 how hard the wind blows, and how much of a gust is blowing.
	force: number;
	gust: number;
	// The sea's height at a point.
	seaAt: (x: number, z: number) => number;
	day: number;
	gain: number;
	white: number;
	sheath: THREE.Color;
	tints: THREE.Color[];
	bg: THREE.Color;
	// 0..1 how far it is drawn (1 unless given).
	presence?: number;
}

// The lines of one mesh: [who, ancestor line (-1 for her own rope)] for each.
function wrathLines(lines: [number, number][]) {
	const vertices = lines.length * (SEGMENTS + 1) * 2;
	const along = new Float32Array(vertices);
	const side = new Float32Array(vertices);
	const who = new Float32Array(vertices);
	const line_ = new Float32Array(vertices);
	const seeds = new Float32Array(vertices * 4);
	lines.forEach(([one, ancestorLine], l) => {
		const own = [Math.random(), Math.random(), Math.random(), Math.random()];
		for (let i = 0; i <= SEGMENTS; i++) {
			for (let edge = 0; edge < 2; edge++) {
				const v = (l * (SEGMENTS + 1) + i) * 2 + edge;
				along[v] = i / SEGMENTS;
				side[v] = edge ? 1 : -1;
				who[v] = one;
				line_[v] = ancestorLine;
				seeds.set(own, v * 4);
			}
		}
	});
	const geometry = unplaced(new THREE.BufferGeometry());
	geometry.setAttribute("aT", new THREE.BufferAttribute(along, 1));
	geometry.setAttribute("aSide", new THREE.BufferAttribute(side, 1));
	geometry.setAttribute("aWho", new THREE.BufferAttribute(who, 1));
	geometry.setAttribute("aLine", new THREE.BufferAttribute(line_, 1));
	geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
	geometry.setIndex(stripIndices(lines.length, SEGMENTS));
	return geometry;
}

export function createWrath(scene: THREE.Scene, layer: number) {
	const twelve: [number, number][] = [];
	SLOTS.forEach((_, i) => {
		const fibres = Math.round(FIBRES * (MIGHTY.includes(i) ? 2.5 : 1));
		for (let f = 0; f < fibres; f++) twelve.push([i, -1]);
		for (let a = 0; a < 3; a++) for (let f = 0; f < ANCESTOR_FIBRES; f++) twelve.push([i, a]);
	});
	const strongest: [number, number][] = [];
	for (let f = 0; f < Math.round(FIBRES * 4.9); f++) strongest.push([STRONGEST, -1]);
	for (let a = 0; a < 3; a++) for (let f = 0; f < STRONGEST_ANCESTOR_FIBRES; f++) strongest.push([STRONGEST, a]);
	for (let f = 0; f < Math.round(FIBRES * MANULANI_MEASURES); f++) strongest.push([MANULANI_AT, -1]);
	for (let a = 0; a < 3; a++) for (let f = 0; f < STRONGEST_ANCESTOR_FIBRES; f++) strongest.push([MANULANI_AT, a]);

	const shared = {
		uTime: { value: 0 },
		uBoat: { value: new THREE.Vector3() },
		uAhead: { value: new THREE.Vector2(0, -1) },
		uWindDir: { value: new THREE.Vector3(1, 0, 0) },
		uCore: { value: new THREE.Vector3() },
		uCloud: { value: 900 },
		uSpin: { value: 0 },
		uGust: { value: 0 },
		uFlow: { value: 0 },
		uHold: { value: 0 },
		uState: { value: Array.from({ length: 14 }, () => new THREE.Vector4()) },
		uPresence: { value: 1 },
		uSphere: { value: new THREE.Vector3() },
		uFoot: { value: Array.from({ length: 12 }, () => new THREE.Vector3()) },
		uTints: { value: [new THREE.Color(), new THREE.Color(), new THREE.Color()] },
		uBg: { value: new THREE.Color() },
		uGain: { value: 1 },
		uDay: { value: 0 },
		uWhite: { value: 1 },
		uSheath: { value: new THREE.Color() },
		uResolution: { value: new THREE.Vector2(1, 1) },
		uPixelRatio: pixelRatio,
	};
	const meshOf = (geometry: THREE.BufferGeometry, white: number, sheath: number, opacity: number) => {
		const mesh = new THREE.Mesh(
			geometry,
			new THREE.ShaderMaterial({
				uniforms: { ...shared, uWhiteMesh: { value: white }, uSheathPass: { value: sheath }, uOpacity: { value: opacity } },
				vertexShader: vertex,
				fragmentShader: fragment,
				transparent: true,
				depthWrite: false,
				side: THREE.DoubleSide,
			}),
		);
		mesh.frustumCulled = false;
		mesh.renderOrder = WEAVE_RENDER_ORDER - sheath;
		mesh.layers.set(layer);
		mesh.visible = false;
		scene.add(mesh);
		return mesh;
	};
	const twelveGeometry = wrathLines(twelve);
	const strongestGeometry = wrathLines(strongest);
	const twelveMesh = meshOf(twelveGeometry, 0, 0, 0.12);
	const strongestMesh = meshOf(strongestGeometry, 1, 0, 0.05);
	const strongestSheath = meshOf(strongestGeometry, 1, 1, 1);
	const meshes = [twelveMesh, strongestMesh, strongestSheath];
	// Manulani's sphere seen from below through the storm's air: a small hot disc and a broad soft
	// aureole round it (light scattered forward by the haze), which reaches down into the view.
	const glowUniforms = { uLevel: { value: 0 } };
	const glow = new THREE.Mesh(
		new THREE.PlaneGeometry(GLOW_SIZE, GLOW_SIZE),
		new THREE.ShaderMaterial({
			uniforms: glowUniforms,
			vertexShader: /* glsl */ `
varying vec2 vUv;
void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,
			fragmentShader: /* glsl */ `
uniform float uLevel;
varying vec2 vUv;
void main() {
	// Angle from the sphere's centre, in radians (the quad spans ${GLOW_ANGLE} either side).
	float a = length( vUv - 0.5 ) * 2.0 * ${GLOW_ANGLE};
	float light = 6.0 * ( 1.0 - smoothstep( 0.006, 0.012, a ) ) + 0.6 * exp( - a / 0.05 ) + 0.3 * exp( - a / 0.45 );
	light *= 1.0 - smoothstep( 0.8, 1.0, a / ${GLOW_ANGLE} );
	gl_FragColor = vec4( vec3( 1.0, 0.92, 0.78 ) * light * uLevel, 1.0 );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,
			transparent: true,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
		}),
	);
	glow.frustumCulled = false;
	glow.renderOrder = 7;
	glow.layers.set(layer);
	glow.visible = false;
	scene.add(glow);

	// Each one's own: when she begins (the strongest first and alone, then the eager), how fast her
	// anger climbs, and where she is in her breath.
	const courses = [...EAGER, 1, 0.9].map((eager, i) => ({
		begins: i === STRONGEST ? 0 : i === MANULANI_AT ? 6 : 12 + 30 * (1 - eager) + 6 * Math.random(),
		climbs: i >= STRONGEST ? 60 : 50 + 160 * (1 - eager),
	}));
	const feet = SLOTS.map((_, i) => ({ a: (MEMBERS[i]! - 1.5) * 0.32 + (THIRDS[i] === 0 ? 0 : 0.1), d: 260 + 70 * MEMBERS[i]! }));
	let spin = Math.random() * Math.PI * 2;
	let flow = 0;
	// One haul: a short hard draw and a long heavy release, over x 0..1.
	const hauled = (x: number) => (x <= 0 || x >= 1 ? 0 : THREE.MathUtils.smoothstep(x, 0, 0.3) * (1 - THREE.MathUtils.smoothstep(x, 0.35, 1)));
	// Each haul lasts a quarter of a breath, and the next begins before it is done: the thirteen's
	// spread over the whole breath, so that one runs into the next ("and... and... and").
	const HAUL = 0.26;

	const update = (frame: WrathFrame | undefined) => {
		for (const mesh of meshes) mesh.visible = !!frame;
		if (!frame) {
			glow.visible = false;
			return;
		}
		strongestSheath.visible = frame.day > 0.3;
		const dt = Math.min(frame.delta, 0.1);
		let anger = 0;
		courses.forEach((course, i) => {
			const into = frame.since - course.begins;
			// Her ancestors come in first, then her own rope goes out.
			const come = THREE.MathUtils.smoothstep(into, 0, 12);
			const grow = THREE.MathUtils.smoothstep(into, 6, 18);
			// Her anger rises in her own time, and further with each gust.
			const rage = Math.min(1, THREE.MathUtils.smoothstep(into, 0, course.climbs) * (0.85 + 0.15 * frame.gust) + 0.1 * frame.gust);
			anger += rage / courses.length;
			// Her place in the sentence: the strongest first, always; the twelve after round the ring,
			// and back the other way as the breaths wane ("but").
			const place = i === STRONGEST ? 0 : frame.breath.waning ? 12 - i : i + 1;
			// (Manulani holds her light steady: she does not haul.)
			const haul = i === MANULANI_AT ? 0 : hauled((frame.breath.phase - (place * (1 - HAUL)) / 12) / HAUL) * (0.3 + 0.7 * frame.breath.depth) * (1 - frame.breath.held);
			shared.uState.value[i]!.set(rage, haul * grow, grow, come);
		});
		// They turn the storm, always the same way, faster as the wind rises and their anger with it.
		// (Through a pause in the God's breath the turning all but stops, and the thrash with it.)
		const going = 1 - 0.85 * frame.breath.held;
		spin += dt * (0.015 + 0.05 * frame.force) * (0.5 + 0.8 * anger) * going * (0.6 + 0.4 * frame.breath.depth);
		flow += dt * (0.8 + 1.4 * anger) * going;
		shared.uFlow.value = flow;
		shared.uHold.value = frame.breath.held;
		shared.uPresence.value = frame.presence ?? 1;
		const ahead = frame.ahead;
		const across = new THREE.Vector2(-ahead.y, ahead.x);
		const core = shared.uCore.value.set(frame.boat.x + ahead.x * CORE_AHEAD, 0, frame.boat.z + ahead.y * CORE_AHEAD);
		core.y = frame.seaAt(core.x, core.z);
		feet.forEach(({ a, d }, i) => {
			const x = frame.boat.x + (ahead.x * Math.cos(a) + across.x * Math.sin(a)) * d;
			const z = frame.boat.z + (ahead.y * Math.cos(a) + across.y * Math.sin(a)) * d;
			shared.uFoot.value[i]!.set(x, frame.seaAt(x, z), z);
		});
		manulaniSphere(frame.boat, ahead, shared.uSphere.value);
		shared.uSpin.value = spin;
		// Her sphere and the haze it lights about it.
		glow.visible = frame.manu > 0.001;
		glow.position.copy(shared.uSphere.value);
		glow.quaternion.copy(frame.camera.quaternion);
		glowUniforms.uLevel.value = frame.manu * frame.glowGain;
		shared.uTime.value = frame.time;
		shared.uGust.value = frame.gust;
		shared.uBoat.value.copy(frame.boat);
		shared.uAhead.value.copy(ahead);
		shared.uWindDir.value.copy(frame.wind).setY(0);
		if (shared.uWindDir.value.lengthSq() > 1e-6) shared.uWindDir.value.normalize();
		frame.tints.forEach((tint, i) => shared.uTints.value[i]!.copy(tint));
		shared.uBg.value.copy(frame.bg);
		shared.uDay.value = frame.day;
		shared.uGain.value = frame.gain;
		shared.uWhite.value = frame.white;
		shared.uSheath.value.copy(frame.sheath);
		shared.uResolution.value.set(window.innerWidth, window.innerHeight).multiplyScalar(pixelRatio.value);
		const blending = frame.day > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending;
		(twelveMesh.material as THREE.ShaderMaterial).blending = blending;
		(strongestMesh.material as THREE.ShaderMaterial).blending = blending;
	};

	const dispose = () => {
		for (const mesh of meshes) {
			scene.remove(mesh);
			(mesh.material as THREE.Material).dispose();
		}
		twelveGeometry.dispose();
		scene.remove(glow);
		glow.geometry.dispose();
		(glow.material as THREE.Material).dispose();
		strongestGeometry.dispose();
	};

	return { update, dispose };
}

// Where the strongest's core meets the sea, ahead of the boat: the place of Peta's wave.
export const CORE_AHEAD = 650;
// Manulani's sphere: 5.2 km up and 2.5 km ahead (so about 64 degrees up, near noon's height here).
const SPHERE_UP = 5200;
const SPHERE_AHEAD = 2500;
const SPHERE_DISTANCE = Math.hypot(SPHERE_UP, SPHERE_AHEAD);
const GLOW_ANGLE = "0.75";
const GLOW_SIZE = 2 * SPHERE_DISTANCE * Math.tan(0.75);
export function manulaniSphere(boat: THREE.Vector3, ahead: THREE.Vector2, out: THREE.Vector3) {
	return out.set(boat.x + ahead.x * SPHERE_AHEAD, SPHERE_UP, boat.z + ahead.y * SPHERE_AHEAD);
}

// 0..1 how bright Manulani's light is: only at night; raised as each run of the God's breaths
// begins (over some twenty seconds), held through it, and lowered to a glow through the pause.
export function manulaniLevel(breath: GodsBreath, since: number, night: number) {
	if (night <= 0) return 0;
	const begun = THREE.MathUtils.smoothstep(since, 6, 30);
	const into = since - breath.runStart;
	const raised = into < breath.breathing ? THREE.MathUtils.smoothstep(into, 0, 20) * (1 - THREE.MathUtils.smoothstep(into, breath.breathing - 8, breath.breathing)) : 0;
	return night * begun * (0.25 + 0.75 * raised);
}

// Peta's wave: lays the twelve's trains for this run of breaths so that they meet at the core at
// its deepest breath, and Leane's current against the swell there.
const LENS_HEIGHT = 42;
const lensRun = { run: -1, x: 0, z: 0, at: 0, scale: 1 };
export function layPetasWave(
	uniforms: { lensWaves: { value: THREE.Vector4[] }; lensAmount: { value: number }; lensCurrent: { value: THREE.Vector4 } },
	breath: GodsBreath | undefined,
	since: number,
	time: number,
	boat: THREE.Vector3,
	ahead: THREE.Vector2,
	// How many times taller the sea is than the storm's own (a worse storm, worsened): the wave is
	// raised as much, and each train made as much longer, so that it can still stand.
	scale = 1,
) {
	if (!breath) {
		uniforms.lensAmount.value = 0;
		uniforms.lensCurrent.value.w = 0;
		return;
	}
	if (breath.run !== lensRun.run || scale !== lensRun.scale) {
		lensRun.scale = scale;
		// (Fixed for the whole run: the place, and the moment on the page's clock.)
		lensRun.run = breath.run;
		lensRun.x = boat.x + ahead.x * CORE_AHEAD;
		lensRun.z = boat.z + ahead.y * CORE_AHEAD;
		lensRun.at = time + (breath.runStart + (breath.peakAt ?? breath.breathing / 2) - since);
		uniforms.lensWaves.value.forEach((train, i) => {
			// Each rolls in towards the boat from a little another way (within about 24 degrees),
			// and each is of another length (160 to 420 m), so that they meet only once.
			// (Not evenly spread: even headings made their meeting crests line up in rows of foam.)
			const turn = (((Math.sin((i + 1) * 12.9898 + breath.run * 7.13) * 43758.5453) % 1) + 1) % 1 * 0.84 - 0.42;
			const dx = -(ahead.x * Math.cos(turn) - ahead.y * Math.sin(turn));
			const dz = -(ahead.y * Math.cos(turn) + ahead.x * Math.sin(turn));
			const length = (160 + 260 * ((i * 0.618 + 0.3 + breath.run * 0.37) % 1)) * scale;
			const k = (2 * Math.PI) / length;
			const heading = Math.atan2(dx, -dz);
			// Its crest at the place at the moment: k (d·P - c t) + phase = pi / 2.
			const phase = Math.PI / 2 - k * (dx * lensRun.x + dz * lensRun.z - Math.sqrt(9.8 / k) * lensRun.at);
			train.set(heading, phase, (LENS_HEIGHT * scale) / 12, length);
		});
	}
	// (Fullest when the trains meet: half-way through the run, or at the stressed beat of a name.)
	const into = since - breath.runStart;
	const peak = breath.peakAt ?? breath.breathing / 2;
	const u = into < peak ? 0.5 * THREE.MathUtils.clamp(into / peak, 0, 1) : 0.5 + 0.5 * THREE.MathUtils.clamp((into - peak) / Math.max(breath.breathing - peak, 1), 0, 1);
	uniforms.lensAmount.value = breath.held > 0 || into >= breath.breathing ? 0 : Math.sin(Math.PI * u) ** 0.6 * (breath.stand ?? 1);
	uniforms.lensCurrent.value.set(lensRun.x, lensRun.z, 420, 0.9 * breath.depth * (1 - breath.held));
}
