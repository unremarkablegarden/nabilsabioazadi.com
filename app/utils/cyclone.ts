// The cyclone (the owner, 14 November 2026: "All channellers must cease weaving. The strongest will lead the
// formation of a cyclone. Innovate how the others lead or follow." Then: "For the cyclone weaving, have the
// channellers link to the strongest channeller and begin weaving from the boat to extremely far away —
// almost out of line of sight into the clouds. Then, as the 'ocean narrative' goes, enormous swells arise.
// Then it should become more evident that flows of water and akasha are permeating the ocean at the same
// time as flows of fire and akasha are permeating the sky at almost every point separated by degree and by
// channeller — physically meaning the sky is overrun with weaving, and then the weather should become like
// a cyclone").
//
// What each visitor sees, from when they turn to it:
//   0 s     everyone ceases: every weave out is let go (as for the alarm and Ranat), and for some seconds
//           nothing at all is woven.
//   4 s     Laeni opens her hands, and the others link to her, the strongest first, one after another:
//           each one's threads come forward from where she stands behind or beside the eye and run into
//           Laeni's within some metres, so that the rope ahead thickens as each joins (TRUE strength drawn
//           as all strength is, in threads). Ember, beheaded on 9 November, is not among them: fourteen.
//   17 s    Laeni runs the linked rope out from the boat, low over the sea and riding the swells, twelve
//           kilometres to near the horizon, almost out of sight, and there up into the cloud, opening as
//           it goes in. That is where the cyclone will turn about.
//   46 s    the swells arise from there (cycloneStorm in channelled-storm.ts): long and enormous, some
//           twelve metres at seventeen seconds when they are full, running in at the boat from ahead.
//   78 s    the permeation. Every degree of the compass is given a flow of water and akasha into the sea
//           and a flow of fire and akasha into the sky, and the degrees are shared out by channeller, each
//           holding a sector by the square root of her strength (Laeni's 72°, centred ahead; Pardis's and
//           Manulani's some fifty on either side of hers; the eight weakest about ten each). Each flow
//           leaves her own palms. The sky's run out low and sweep up into the cloud, two to four
//           kilometres out and as high again, and there go apart, permeating it; the sea's go down into
//           the water within some tens of metres of the boat and on under it, seen through the water as
//           light from below (the sea shader, `permeate`), out to hundreds of metres.
//   140 s   the weather becomes a cyclone, raised over three minutes (cycloneStorm; the cloud's volumes
//           gather into it and turn about the centre, clouds.ts): its wind round the centre, clockwise in
//           the southern hemisphere, its rain in bands, the glass falling; the sky's flows are carried by
//           its winds, in round the centre low down and out at the top, as a cyclone's air goes.
//
// How the others lead and follow (the owner: "innovate"). Laeni leads, and the others follow her in two
// ways that are new here:
//   - by linking, in the order of their strength, each running her threads into Laeni's;
//   - by taking the turn from the one before. The permeation does not begin everywhere at once: it begins
//     in Laeni's own degrees and passes round the compass from sector to sector, each channeller taking
//     it up as it reaches her, the way a turn passes through a flock (Attanasi et al., 2014: the turn
//     travels through a starling flock at a steady speed, each bird answering her neighbour). Once round,
//     it keeps going round, a wave of light circling through all the flows, quicker each time it comes
//     back to Laeni, from a minute a round to twenty seconds. That circling is the cyclone's own turning:
//     it goes the way the air will (clockwise south of the equator, where the boat is now; the other way
//     north of it), so the order in which they follow her is what sets the sky turning.
// Nothing round is made: the flows radiate and curve, the wave travels through them; there is no ring.
import * as THREE from "three";
import { standOf } from "./alarm";
import { CYCLONE_BEARING, CYCLONE_EYE, CYCLONE_FAR, CYCLONE_SWELL, CYCLONE_WEATHER, cycloneRaised, cycloneSwelled } from "./channelled-storm";
import { lines } from "./embroidery";
import { PERMEATE_SECTORS, type GerstnerUniforms } from "./gerstner-waves";
import { NAMES, ropeMight, STRONGEST_MIND, TEMPERS } from "./psyche";
import { filmLook, filmShaderChunk, pixelRatio, ribbonShaderChunk, WEAVE_RELAX, WEAVE_RENDER_ORDER } from "./weave";

// Each visitor sees them turn to it this long after they come (s).
export const CYCLONE_AFTER = 6;
// How far everyone has let go of what she was doing (0..1).
export const cycloneBusy = (since: number) => THREE.MathUtils.smoothstep(since, 0.3, 3);

// The timeline (s).
const T_OPEN = 4;
const T_LINKS = 6;
const LINK_EVERY = 0.85;
const LINK_TAKES = 1.6;
const T_RUN = 17;
const RUN = 22;
const T_RISE = 37;
const RISE = 12;
const T_PERMEATE = 78;
// The first time round the compass (s), and the wave's round afterwards: from a minute to twenty seconds
// as the cyclone forms.
const FIRST_ROUND = 66;
const ROUND_SLOW = 60;
const ROUND_FAST = 20;

// Ember (3) was stilled and beheaded on 9 November (alarm.ts). The fourteen, Laeni first and the rest by
// strength: the order they link in.
const EMBER = 3;
const CREW = [...Array(15).keys()].filter((who) => who !== EMBER).sort((a, b) => (a === STRONGEST_MIND ? -1 : b === STRONGEST_MIND ? 1 : ropeMight(b) - ropeMight(a)));
const M = CREW.length;
// Her might (threads' measure), and as a share of Laeni's.
const MOST = ropeMight(STRONGEST_MIND);
// Where each joins Laeni's rope (m out from the boat): the nearer she stands, the sooner; Laeni's own, at once.
const JOIN_AT = CREW.map((who, m) => (who === STRONGEST_MIND ? 0 : 9 + ((m * 7.3) % 16)));
// Her colour by her elements: Laeni's white; the others water, air and akasha as their minds lean.
const elementsOf = (who: number) => {
	const t = TEMPERS[who]!;
	return { air: t.air, water: t.water };
};

// The compass shared out (the owner: "separated by degree and by channeller"): each a sector by the square
// root of her strength, Laeni's centred ahead, and round from her the way they stand: those on the right
// clockwise from ahead, Leilehua astern at the stern, those on the left coming forward again to Laeni.
const RIGHT = [13, 2, 4, 6, 8, 10];
const LEFT = [11, 7, 9, 5, 0, 1];
const ROUND = [STRONGEST_MIND, ...RIGHT, 14, ...LEFT];
const SHARE = ROUND.map((who) => Math.sqrt(ropeMight(who)));
const SHARE_SUM = SHARE.reduce((sum, s) => sum + s, 0);
const WIDTH = (() => {
	// Whole degrees, adding up to 360.
	const raw = SHARE.map((s) => (360 * s) / SHARE_SUM);
	const whole = raw.map(Math.floor);
	let left = 360 - whole.reduce((sum, w) => sum + w, 0);
	const order = raw.map((r, i) => ({ i, rest: r - Math.floor(r) })).sort((a, b) => b.rest - a.rest);
	for (const { i } of order) if (left-- > 0) whole[i]!++;
	return whole;
})();
const S = ROUND.length;
if (S !== PERMEATE_SECTORS) throw new Error("the sea shader's sectors (PERMEATE_SECTORS) are not one to each of the fourteen");
// Where each sector starts, in degrees from Laeni's left edge going clockwise (rightward).
const SECTOR_FROM = WIDTH.map((_, s) => WIDTH.slice(0, s).reduce((sum, w) => sum + w, 0));
const LAENI_WIDTH = WIDTH[0]!;
// Each degree's owner (sector index).
const OWNER = Array.from({ length: 360 }, (_, d) => {
	let s = 0;
	for (let i = 0; i < S; i++) if (d >= SECTOR_FROM[i]!) s = i;
	return s;
});
// Threads to each degree's flow, by her might: Laeni's four, the weakest's one.
const THREADS_PER_DEGREE = ROUND.map((who) => 1 + Math.round(3 * Math.sqrt(ropeMight(who) / MOST)));
// (The sea's flows need fewer: only their way down into the water is drawn as threads.)
const DIVE_PER_DEGREE = ROUND.map(() => 1);
// Her power over Laeni's, 0..1 by the cube root: how far her flows reach and how much light is in them.
const POWER = ROUND.map((who) => Math.cbrt(ropeMight(who) / MOST));

// The rope: its segments, and the share of them on its run out over the sea (the rest go up into the cloud).
const ROPE_SEGMENTS = 220;
const RUN_SHARE = 0.84;
// How high it goes into the cloud, and how far it opens there (m).
const ROPE_TOP = 3400;
const ROPE_OPEN = 1200;
// How far its run bellies out to the right (m): it leaves the boat towards the right bow and comes round in one
// long curve to the far place, so it is seen along its length (run straight away from the eye, all its light fell
// on one spot of the picture, a white ball).
const ROPE_BELLY = 1500;
const ROPE_THREADS_PER_MEASURE = 1.2;
const SKY_SEGMENTS = 96;
const DIVE_SEGMENTS = 28;
const FIRE = new THREE.Color(0.98, 0.6, 0.34);

const shared = /* glsl */ `
uniform vec3 uBoat;
uniform vec3 uAhead;
uniform vec3 uAcross;
uniform float uTime;
// The sea's own trains (gerstner-waves.ts), so that what lies low over the water rides its swells.
uniform vec4 uWaves[ 32 ];
uniform float uSteep;
// The centre (world x, z), how far formed (0..1), and which way it turns (1 anticlockwise from above, -1
// clockwise), and the cloud base (m).
uniform vec4 uCyclone;
uniform float uCloudBase;
vec3 dirOf( float b ) {
	return uAhead * cos( b ) + uAcross * sin( b );
}
// The sea's height here (as measuredSeaHeight in gerstner-waves.ts).
float seaH( vec2 xz ) {
	float h = 0.0;
	for ( int i = 0; i < 32; i ++ ) {
		vec4 w = uWaves[ i ];
		if ( w.z < 0.002 || w.w < 1.0 ) continue;
		float k = 6.28318 / w.w;
		float along = sin( w.x ) * xz.x - cos( w.x ) * xz.y;
		h += ( w.z * uSteep / k ) * sin( k * ( along - sqrt( 9.8 / k ) * uTime ) + w.y );
	}
	return h;
}
// Where a thread leaves her (the owner, 5 November: from "the palms and bodies of the channellers on the
// boat. Not from the water"): one of her two open palms or her body behind them, a little apart from the
// next as fingers are; let go as the threads gather.
vec3 rootOf( vec3 d, vec4 seed ) {
	vec3 flat_ = normalize( vec3( d.x, 0.0, d.z ) + vec3( 0.0, 0.0, 1e-4 ) );
	vec3 side = vec3( - flat_.z, 0.0, flat_.x );
	float which = fract( seed.x * 7.13 );
	vec3 root = which < 0.4 ? - side * 0.28 : which < 0.8 ? side * 0.28 : - flat_ * 0.22 + vec3( 0.0, 0.3, 0.0 );
	return root + side * ( fract( seed.y * 5.7 ) - 0.5 ) * 0.16 + vec3( 0.0, ( fract( seed.z * 3.3 ) - 0.5 ) * 0.14, 0.0 );
}
float apartFrom( float fromHer ) {
	return 1.0 - smoothstep( 0.0, 4.0, fromHer );
}
// How far a stretch of thread is seen from the side (1) or end on (towards 0.15): a thread looked along lays all
// its length on a few pixels, and so many of them, run out from the boat, stood up as bright posts in the sea.
float sideOn( vec3 here, vec3 next ) {
	vec3 along = normalize( next - here + vec3( 1e-5 ) );
	vec3 view = normalize( here - cameraPosition );
	return 1.0 - 0.85 * pow( abs( dot( along, view ) ), 6.0 );
}
// The cyclone's air at a place, once it has formed: round the centre (at the sea, and turning in across the
// circles; aloft, out and the other way round, as a cyclone's air goes out at its top), metres it carries a
// thing of this reach. Unit-free: the caller scales it.
vec3 carried( vec3 p ) {
	vec2 v = p.xz - uCyclone.xy;
	float r = max( length( v ), 1.0 );
	vec2 round_ = uCyclone.w * vec2( v.y, - v.x ) / r;
	vec2 inward = - v / r;
	float aloft = smoothstep( 2500.0, 6000.0, p.y );
	vec2 at = mix( round_ + 0.6 * inward, - 0.7 * round_ - 0.5 * inward, aloft );
	return vec3( at.x, 0.0, at.y ) * uCyclone.z;
}
`;

const varyings = /* glsl */ `
varying float vAlpha;
varying float vEdge;
varying vec3 vTint;
varying float vCore;
`;

const lightFragment = /* glsl */ `
uniform float uGain;
uniform float uDay;
uniform float uFilm;
uniform float uStrength;
${varyings}
${filmShaderChunk}
void main() {
	float body = 1.0 - smoothstep( 0.7, 1.0, abs( vEdge ) );
	vec3 tint = mix( vTint, filmShade( vTint, vCore ), uFilm );
	gl_FragColor = vec4( tint * uGain * mix( 1.0, 1.4, uDay ), body * vAlpha * uStrength * 0.075 * mix( 1.0, 3.0, uDay ) );
	gl_FragColor.a *= ${WEAVE_RELAX.toFixed(3)};
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;
const denser = (alpha: string) => lightFragment.replace("0.075 * mix( 1.0, 3.0, uDay )", alpha);

// The link and the rope: each one's threads from her palms into Laeni's rope, which runs out low over the
// sea to near the horizon and goes up into the cloud there.
const ropeVertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute vec2 aCell;
attribute vec4 aSeed;
uniform vec3 uStand[ ${M} ];
// Each: how far her threads have come out to the rope (0..1), where she joins it (m), her white (Laeni 1).
uniform float uJoin[ ${M} ];
uniform float uJoinAt[ ${M} ];
uniform vec3 uTint[ ${M} ];
uniform float uWhite[ ${M} ];
// The rope: its bearing (radians off ahead), how far its run goes (m), how far it is cast (0..1 along), its
// girth (m, by the strength joined in it).
uniform vec4 uRope;
uniform vec3 uRopeHands;
uniform float uVisibility;
uniform float uDay;
${varyings}
${shared}
${ribbonShaderChunk}
float distAt( float t ) {
	return 0.4 * pow( uRope.y / 0.4, t / ${RUN_SHARE.toFixed(3)} );
}
// The rope's own line on its run: from Laeni's hands out low over the sea, riding the swells, in one long
// curve to its far end.
vec3 runFlat( float dist ) {
	vec3 d = dirOf( uRope.x );
	vec3 side = vec3( - d.z, 0.0, d.x );
	float u = dist / uRope.y;
	vec3 p = uBoat + d * dist + side * ${ROPE_BELLY.toFixed(1)} * sin( 3.14159 * u );
	p.xz += ( uRopeHands.xz - uBoat.xz ) * ( 1.0 - smoothstep( 2.0, 40.0, dist ) );
	p.y = uRopeHands.y;
	return p;
}
vec3 runAt( float dist ) {
	vec3 p = runFlat( dist );
	float low = 2.4 + seaH( p.xz );
	p.y = mix( uRopeHands.y, low, smoothstep( 1.0, 40.0, dist ) );
	return p;
}
vec3 threadAt( int m, float t ) {
	vec3 d = dirOf( uRope.x );
	vec3 side = vec3( - d.z, 0.0, d.x );
	vec3 up = vec3( 0.0, 1.0, 0.0 );
	if ( t <= ${RUN_SHARE.toFixed(3)} ) {
		float dist = distAt( t );
		vec3 line_ = runAt( dist );
		vec3 along = normalize( runFlat( dist + 1.0 + 0.01 * dist ) - runFlat( dist ) );
		vec3 n1 = normalize( cross( along, up ) + vec3( 1e-4 ) );
		vec3 n2 = normalize( cross( n1, along ) );
		// Spreading as it goes (its girth as the root of the distance come), a vortex tube's filaments on its shell.
		// (A river of light across the water near the boat, tens of metres broad, the whole link's strength in it.)
		float river = 6.0 * uRope.w * smoothstep( 5.0, 220.0, dist ) * ( 1.0 - 0.6 * smoothstep( 1500.0, 8000.0, dist ) );
		float girth = ( uRope.w * ( 0.6 + 0.08 * sqrt( dist ) ) + river + 140.0 * smoothstep( 0.4, 1.0, dist / uRope.y ) ) * sqrt( aSeed.z ) * smoothstep( 0.0, 3.0, dist );
		float turn = aSeed.y * 6.28318 + log( dist + 12.0 ) * ( 1.4 + 0.8 * aSeed.x ) - uTime * 0.09;
		// (Broad across the water and shallow over it, as anything lying on the sea is: spread up and down as
		// much as across, its threads stacked into a white post where it is seen end on.)
		vec3 onRope = line_ + ( n1 * cos( turn ) + n2 * sin( turn ) * min( 0.25, 0.8 / max( girth, 0.01 ) ) ) * girth;
		// Her own way in to it: from her palms forward past the eye, gathering into the rope by where she joins.
		vec3 hands = uStand[ m ];
		vec3 own = hands + d * dist + rootOf( d, aSeed ) * apartFrom( dist );
		// (Down from her hands towards the rope's height at once, so that it comes in low past the eye.)
		own.y = mix( hands.y, onRope.y - 0.6, smoothstep( 0.0, 0.5 * uJoinAt[ m ] + 1.0, dist ) );
		return mix( own, onRope, smoothstep( 0.15 * uJoinAt[ m ], uJoinAt[ m ] + 0.5, dist ) );
	}
	// Up into the cloud at its far end: on a little further, rising, opening as it goes in, its filaments
	// wound the way the cyclone will turn.
	float u = ( t - ${RUN_SHARE.toFixed(3)} ) / ${(1 - RUN_SHARE).toFixed(3)};
	vec3 foot = runAt( uRope.y );
	vec3 centre = foot + d * 700.0 * pow( u, 0.6 ) + vec3( 0.0, ${ROPE_TOP.toFixed(1)} * pow( u, 1.3 ), 0.0 );
	float girth = ( uRope.w * ( 0.3 + 0.05 * sqrt( uRope.y ) ) + 140.0 ) * sqrt( aSeed.z ) + ${ROPE_OPEN.toFixed(1)} * u * u * ( 0.4 + 0.6 * aSeed.z );
	float turn = aSeed.y * 6.28318 + uCyclone.w * ( u * 7.0 + uTime * 0.05 );
	return centre + ( side * cos( turn ) + d * sin( turn ) ) * girth;
}
void main() {
	int m = int( aCell.x + 0.5 );
	float joined = uJoin[ m ];
	if ( joined <= 0.0 ) {
		vAlpha = 0.0;
		gl_Position = vec4( 2.0, 2.0, 2.0, 1.0 );
		return;
	}
	vec3 here = threadAt( m, aT );
	vec3 next = threadAt( m, min( aT + 0.004, 1.0 ) ) + ( aT >= 0.996 ? here - threadAt( m, aT - 0.004 ) : vec3( 0.0 ) );
	float far = length( here - cameraPosition );
	float dist = aT <= ${RUN_SHARE.toFixed(3)} ? distAt( aT ) : uRope.y;
	// Hers come out to the rope first; beyond it, as far as the rope is cast.
	float ownReach = joined * ( uJoinAt[ m ] + 6.0 );
	// (Each thread's end its own, a little short of the rope's, so they do not all end in one place.)
	float end = uRope.z - 0.03 * aSeed.w * ( 1.0 - step( 0.999, uRope.z ) );
	float shown = dist < uJoinAt[ m ] + 6.0 ? 1.0 - smoothstep( ownReach - 2.0, ownReach, dist ) : ( 1.0 - smoothstep( end - 0.02, end, aT ) ) * step( 0.999, joined );
	// The light carried out along it, outward only, in pulses; and its tip bright as it runs out.
	float q = aT * 40.0;
	float carried_ = pow( 0.5 + 0.5 * sin( q - uTime * 1.3 + aSeed.x * 6.28318 ), 3.0 );
	// (Its light conserved as it spreads, so it is the fainter the broader it has grown.)
	float spreadOut = 0.6 + 0.08 * sqrt( dist ) + 0.5 * smoothstep( 5.0, 220.0, dist ) + 1.2 * smoothstep( 0.4, 1.0, dist / uRope.y );
	float lit = ( 0.4 + 0.5 * carried_ ) * pow( 0.6 / spreadOut, 0.7 );
	float haze = max( 0.12, exp( - far / ( 1.6 * uVisibility ) ) );
	// (Tamer about the boat, where so many threads so near the eye would whiten the near view.)
	float nearHer = mix( 0.05, 1.0, smoothstep( 3.0, 300.0, dist ) );
	// Up in the cloud it goes faint as it opens, almost out of sight.
	// Up at its far end it goes faint and is lost in the cloud base, almost out of sight.
	float rising = aT > ${RUN_SHARE.toFixed(3)} ? 0.3 * ( 1.0 - smoothstep( 0.5 * uCloudBase, 1.4 * uCloudBase, here.y ) ) : 1.0;
	vAlpha = shown * smoothstep( 0.45, 0.9, far ) * haze * lit * nearHer * rising * sideOn( here, next ) * ( 1.0 - smoothstep( 0.97, 1.0, aT ) );
	vEdge = aSide;
	vTint = mix( uTint[ m ], vec3( 0.97, 0.96, 0.99 ), 0.75 * uWhite[ m ] );
	vCore = 1.0 - aSeed.z;
	mat4 vp = projectionMatrix * viewMatrix;
	gl_Position = ribbonPosition( vp * vec4( here, 1.0 ), vp * vec4( next, 1.0 ), aSide, mix( 1.0, 1.3, uDay ) );
}
`;

// What the sky's and the sea's flows share: whose each degree is, where she stands, how the permeation
// has come round to it, and the wave going round.
const compass = /* glsl */ `
uniform vec3 uSectorStand[ ${S} ];
uniform vec3 uSectorTint[ ${S} ];
uniform float uSectorWhite[ ${S} ];
uniform float uSectorPower[ ${S} ];
// The permeation: how far round it has come (degrees, from where it began), where the circling wave is
// (degrees, the same way), Laeni's width (degrees), and which way it goes (1 clockwise, rightward; -1 not).
uniform vec4 uSweep;
// A degree's bearing off ahead (radians): degrees from Laeni's left edge, rightward.
float bearingOf( float degree ) {
	return radians( degree + 0.5 - 0.5 * uSweep.z );
}
// How far round the permeation had to come to reach this degree.
float sweptTo( float degree ) {
	return uSweep.w > 0.0 ? degree : mod( uSweep.z - 1.0 - degree, 360.0 );
}
// The wave going round: brightest where it is now, a long tail behind it.
float waveAt( float swept ) {
	float behind = mod( uSweep.y - swept, 360.0 );
	return 0.5 + 1.1 * ( exp( - behind / 40.0 ) + exp( - ( 360.0 - behind ) / 3.0 ) );
}
`;

// The sky's flows: fire and akasha, from her palms out and up into the cloud, going apart in it.
const skyVertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute vec2 aCell;
attribute vec4 aSeed;
uniform vec3 uFire;
uniform vec3 uGold;
uniform vec3 uWind;
uniform float uVisibility;
uniform float uDay;
${varyings}
${shared}
${compass}
${ribbonShaderChunk}
vec3 skyAt( float degree, int o, float s ) {
	float power = uSectorPower[ o ];
	// Each winds round the boat as it climbs, the way the air will turn (clockwise, to the right, south of the
	// equator), 40 to 80 degrees by the time it is in the cloud, so the sky fills with strands sweeping across
	// it that cross and weave, not with posts.
	float wound = radians( mix( 40.0, 80.0, fract( aSeed.z * 6.1 + aSeed.x ) ) ) * uSweep.w;
	float b0 = bearingOf( degree ) + ( aSeed.w - 0.5 ) * 0.02;
	vec3 d = dirOf( b0 + wound * pow( s, 1.2 ) );
	vec3 side = vec3( - d.z, 0.0, d.x );
	// How far out it reaches the cloud, and how high it goes into it (m): by her power, and each its own.
	float reach = mix( 800.0, 2600.0, fract( aSeed.x * 3.71 + aSeed.y ) ) * ( 0.75 + 0.4 * power );
	float top = uCloudBase + mix( 600.0, 3000.0, fract( aSeed.y * 5.3 + aSeed.z ) ) * ( 0.6 + 0.5 * power );
	float out_ = reach * ( 1.0 - pow( 1.0 - s, 1.5 ) );
	vec3 hands = uSectorStand[ o ];
	vec3 p = uBoat + d * out_;
	p.xz += ( hands.xz - uBoat.xz ) * ( 1.0 - smoothstep( 2.0, 40.0, out_ ) );
	// Up from her hands at once, steeper as it goes (it is never low over the sea: lying along it, all of them
	// together made a bright band on the horizon).
	p.y = mix( hands.y, top, pow( s, 1.35 ) );
	// None is a ruled line: each sways a little its own way as it climbs.
	p += side * sin( s * 2.4 + aSeed.w * 6.28 ) * 0.05 * out_;
	// In the cloud its filaments go apart, permeating it.
	float inCloud = smoothstep( 0.6 * uCloudBase, top, p.y );
	p += ( side * ( aSeed.z - 0.5 ) * 1.4 + d * ( fract( aSeed.x * 9.1 ) - 0.5 ) * 0.8 + vec3( 0.0, ( fract( aSeed.y * 4.7 ) - 0.5 ) * 0.5, 0.0 ) ) * inCloud * inCloud * 500.0 * ( 0.6 + 0.6 * power );
	// The cyclone's air carries it, the more the higher and further it goes.
	p += carried( p ) * ( 0.15 * out_ + 0.2 * p.y ) * s;
	// And leans a little with the wind.
	p += uWind * 4.0 * s * s;
	return p + rootOf( dirOf( b0 ), aSeed ) * apartFrom( out_ );
}
void main() {
	float degree = aCell.x;
	int o = int( aCell.y + 0.5 );
	float swept = sweptTo( degree );
	// It runs out from her palms once the permeation has come round to it (over sixteen degrees of the sweep).
	float grown = clamp( ( uSweep.x - swept ) / 16.0, 0.0, 1.0 );
	if ( grown <= 0.0 ) {
		vAlpha = 0.0;
		gl_Position = vec4( 2.0, 2.0, 2.0, 1.0 );
		return;
	}
	vec3 here = skyAt( degree, o, aT );
	vec3 next = skyAt( degree, o, min( aT + 0.01, 1.0 ) ) + ( aT >= 0.99 ? here - skyAt( degree, o, aT - 0.01 ) : vec3( 0.0 ) );
	float far = length( here - cameraPosition );
	float carried_ = pow( 0.5 + 0.5 * sin( aT * 14.0 - uTime * 1.1 + aSeed.x * 6.28318 ), 3.0 );
	float lit = ( 0.35 + 0.45 * carried_ ) * waveAt( swept ) * ( 0.55 + 0.45 * uSectorPower[ o ] );
	float haze = max( 0.1, exp( - far / ( 1.5 * uVisibility ) ) );
	// (So many leave the boat that near the eye they are only just seen: faint until they are out over the sea.)
	float nearHer = mix( 0.05, 1.0, smoothstep( 6.0, 200.0, far ) );
	// (One thread of a degree in three shows from her palms; the rest run out along it and show only some hundreds
	// of metres out, where the flow goes apart: so fewer of them crowd the eye.)
	float joins = aSeed.z < 0.34 ? 0.0 : mix( 60.0, 240.0, fract( aSeed.z * 7.7 ) );
	vAlpha = ( 1.0 - smoothstep( grown - 0.02, grown, aT ) ) * smoothstep( 0.45, 0.9, far ) * haze * lit * nearHer * smoothstep( joins, joins + 80.0, far ) * sideOn( here, next ) * ( 1.0 - smoothstep( 0.9, 1.0, aT ) );
	vEdge = aSide;
	// Fire and akasha; Laeni's white.
	vec3 tint = mix( uFire, uGold, fract( aSeed.w * 3.1 ) * 0.75 );
	tint = mix( tint, uSectorTint[ o ], 0.2 );
	vTint = mix( tint, vec3( 0.97, 0.96, 0.99 ), 0.7 * uSectorWhite[ o ] );
	vCore = 1.0 - aSeed.z;
	mat4 vp = projectionMatrix * viewMatrix;
	gl_Position = ribbonPosition( vp * vec4( here, 1.0 ), vp * vec4( next, 1.0 ), aSide, mix( 1.0, 1.3, uDay ) );
}
`;

// The sea's flows: water and akasha, from her palms out and down into the water some metres off (beyond
// that the sea shader shows them, `permeate`, as light from under the water). The same place each degree's
// flow goes in as the sea shader's: the hash is the same.
const diveVertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute vec2 aCell;
attribute vec4 aSeed;
uniform vec3 uWater;
uniform vec3 uGold;
uniform float uDay;
${varyings}
${shared}
${compass}
${ribbonShaderChunk}
float diveOf( float degree ) {
	return 8.0 + 20.0 * fract( sin( degree * 12.9898 ) * 43758.5453 );
}
vec3 diveAt( float degree, int o, float s ) {
	float into = diveOf( degree );
	float out_ = into * 1.15 * s;
	// Wound round as they go, as the sea's light beyond them is (gerstner-waves.ts): eighty degrees by 700 m.
	float b = bearingOf( degree ) + ( aSeed.w - 0.5 ) * 0.014 + uSweep.w * radians( 80.0 ) * log( 1.0 + out_ / 40.0 ) / log( 18.5 );
	vec3 d = dirOf( b );
	vec3 hands = uSectorStand[ o ];
	vec3 p = uBoat + d * out_;
	p.xz += ( hands.xz - uBoat.xz ) * ( 1.0 - smoothstep( 1.0, 12.0, out_ ) );
	// Down in one curve from her hands into the water, and a little way on under it.
	float sea = seaH( p.xz );
	p.y = mix( hands.y, sea - 2.5, pow( smoothstep( 0.0, 1.0, s ), 1.6 ) );
	// Its filaments plaited loosely about one another as they go.
	float turn = aSeed.y * 6.28318 + s * 5.0 - uTime * 0.3;
	vec3 side = vec3( - d.z, 0.0, d.x );
	p += ( side * cos( turn ) + vec3( 0.0, 0.6, 0.0 ) * sin( turn ) ) * 0.25 * sqrt( aSeed.z ) * smoothstep( 0.0, 0.3, s );
	return p + rootOf( d, aSeed ) * apartFrom( out_ );
}
void main() {
	float degree = aCell.x;
	int o = int( aCell.y + 0.5 );
	float swept = sweptTo( degree );
	float grown = clamp( ( uSweep.x - swept ) / 10.0, 0.0, 1.0 );
	if ( grown <= 0.0 ) {
		vAlpha = 0.0;
		gl_Position = vec4( 2.0, 2.0, 2.0, 1.0 );
		return;
	}
	vec3 here = diveAt( degree, o, aT );
	vec3 next = diveAt( degree, o, min( aT + 0.03, 1.0 ) ) + ( aT >= 0.97 ? here - diveAt( degree, o, aT - 0.03 ) : vec3( 0.0 ) );
	float far = length( here - cameraPosition );
	float carried_ = pow( 0.5 + 0.5 * sin( aT * 9.0 - uTime * 1.4 + aSeed.x * 6.28318 ), 3.0 );
	float lit = ( 0.4 + 0.5 * carried_ ) * waveAt( swept ) * ( 0.55 + 0.45 * uSectorPower[ o ] );
	vAlpha = ( 1.0 - smoothstep( grown - 0.04, grown, aT ) ) * smoothstep( 0.45, 1.2, far ) * lit * mix( 0.03, 0.22, smoothstep( 4.0, 25.0, far ) ) * sideOn( here, next );
	vEdge = aSide;
	vec3 tint = mix( uWater, uGold, fract( aSeed.w * 3.1 ) * 0.6 );
	tint = mix( tint, uSectorTint[ o ], 0.2 );
	vTint = mix( tint, vec3( 0.97, 0.96, 0.99 ), 0.6 * uSectorWhite[ o ] );
	vCore = 1.0 - aSeed.z;
	mat4 vp = projectionMatrix * viewMatrix;
	gl_Position = ribbonPosition( vp * vec4( here, 1.0 ), vp * vec4( next, 1.0 ), aSide, mix( 1.0, 1.3, uDay ) );
}
`;

export interface CycloneFrame {
	since: number;
	time: number;
	delta: number;
	boat: THREE.Vector3;
	ahead: THREE.Vector2;
	// 1 south of the equator, where it turns clockwise; -1 north of it.
	south: number;
	cloudBase: number;
	wind: THREE.Vector3;
	visibility: number;
	day: number;
	gain: number;
	exposure: number;
	air: THREE.Color;
	water: THREE.Color;
	gold: THREE.Color;
}

// What the sky is given of it (the sky shader's cloud wound about the centre, OceanBackground.vue): the centre (world x, z), the eye's radius, how far formed,
// which way it turns, and how far round its bands have come.
export interface CycloneSky {
	centre: THREE.Vector2;
	eye: number;
	formed: number;
	turn: number;
	since: number;
}

export function createCyclone(scene: THREE.Scene, layer: number, sea: GerstnerUniforms) {
	const resolution = { value: new THREE.Vector2(1, 1) };
	const common = {
		uBoat: { value: new THREE.Vector3() },
		uAhead: { value: new THREE.Vector3(0, 0, -1) },
		uAcross: { value: new THREE.Vector3(1, 0, 0) },
		uTime: { value: 0 },
		uWaves: sea.waves,
		uSteep: sea.waveSteepness,
		uCyclone: { value: new THREE.Vector4(0, -CYCLONE_FAR, 0, -1) },
		uCloudBase: { value: 700 },
		uWind: { value: new THREE.Vector3() },
		uFire: { value: FIRE.clone() },
		uGold: { value: new THREE.Color(0.88, 0.7, 0.4) },
		uWater: { value: new THREE.Color(0.3, 0.7, 0.6) },
		uVisibility: { value: 20_000 },
		uDay: { value: 0 },
		uGain: { value: 1 },
		uFilm: filmLook,
		uStrength: { value: 0 },
		uResolution: resolution,
		uPixelRatio: pixelRatio,
	};
	const ribbon = (geometry: THREE.BufferGeometry, uniforms: Record<string, THREE.IUniform>, vertexShader: string, fragmentShader = lightFragment) =>
		new THREE.Mesh(geometry, new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthWrite: false, side: THREE.DoubleSide }));

	// Each one's colour: water, air and akasha as her mind leans (Laeni's white).
	const tintOf = (who: number, air: THREE.Color, water: THREE.Color, gold: THREE.Color, out: THREE.Color) => {
		const { air: a, water: w } = elementsOf(who);
		return out.copy(water).multiplyScalar(w).add(work.copy(air).multiplyScalar(a)).add(work.copy(gold).multiplyScalar(0.35)).multiplyScalar(1 / (a + w + 0.35));
	};
	const work = new THREE.Color();

	// The link and the rope: every one's threads by her strength.
	const ropeCells: [number, number][] = [];
	CREW.forEach((who, m) => {
		const own = Math.max(3, Math.round(ROPE_THREADS_PER_MEASURE * ropeMight(who)));
		for (let f = 0; f < own; f++) ropeCells.push([m, f / own]);
	});
	const ropeUniforms = {
		...common,
		uStand: { value: CREW.map(() => new THREE.Vector3()) },
		uJoin: { value: new Array<number>(M).fill(0) },
		uJoinAt: { value: [...JOIN_AT] },
		uTint: { value: CREW.map(() => new THREE.Color()) },
		uWhite: { value: CREW.map((who) => (who === STRONGEST_MIND ? 1 : 0)) },
		uRope: { value: new THREE.Vector4(THREE.MathUtils.degToRad(CYCLONE_BEARING), CYCLONE_FAR, 0, 1) },
		uRopeHands: { value: new THREE.Vector3() },
	};
	const rope = ribbon(lines(ropeCells.length, ROPE_SEGMENTS, (i) => ropeCells[i]!), ropeUniforms, ropeVertex);

	// The sky's and the sea's flows: a flow to each degree, by her might in threads.
	const skyCells: [number, number][] = [];
	const diveCells: [number, number][] = [];
	for (let degree = 0; degree < 360; degree++) {
		const s = OWNER[degree]!;
		for (let f = 0; f < THREADS_PER_DEGREE[s]!; f++) skyCells.push([degree, s]);
		for (let f = 0; f < DIVE_PER_DEGREE[s]!; f++) diveCells.push([degree, s]);
	}
	const compassUniforms = {
		uSectorStand: { value: ROUND.map(() => new THREE.Vector3()) },
		uSectorTint: { value: ROUND.map(() => new THREE.Color()) },
		uSectorWhite: { value: ROUND.map((who) => (who === STRONGEST_MIND ? 1 : 0)) },
		uSectorPower: { value: [...POWER] },
		uSweep: { value: new THREE.Vector4(0, 0, LAENI_WIDTH, 1) },
	};
	const skyUniforms = { ...common, ...compassUniforms };
	const sky = ribbon(lines(skyCells.length, SKY_SEGMENTS, (i) => skyCells[i]!), skyUniforms, skyVertex, denser("0.1 * mix( 1.0, 2.6, uDay )"));
	const dive = ribbon(lines(diveCells.length, DIVE_SEGMENTS, (i) => diveCells[i]!), skyUniforms, diveVertex, denser("0.07 * mix( 1.0, 2.6, uDay )"));

	const meshes = [rope, sky, dive];
	// (For looking into it in the console: each mesh by name.)
	(globalThis as unknown as { __cycloneMeshes?: unknown }).__cycloneMeshes = { rope, sky, dive };
	for (const mesh of meshes) {
		mesh.frustumCulled = false;
		mesh.renderOrder = WEAVE_RENDER_ORDER + 1;
		mesh.layers.set(layer);
		mesh.visible = false;
		scene.add(mesh);
	}

	const ahead = new THREE.Vector3();
	const across = new THREE.Vector3();
	const centre = new THREE.Vector2();
	let wasOn = false;
	let lastSince = 0;
	let strength = 0;
	let cast = 0;
	let front = 0;
	let wave = 0;
	let formed = 0;
	let swelled = 0;
	let southern = 1;
	const joins = new Array<number>(M).fill(0);
	const skyState: CycloneSky = { centre, eye: CYCLONE_EYE, formed: 0, turn: -1, since: 0 };

	const update = (frame: CycloneFrame | undefined) => {
		if (!frame || frame.since < 0) {
			if (wasOn) {
				for (const mesh of meshes) mesh.visible = false;
				sea.permeateB.value.setX(0);
				wasOn = false;
			}
			return;
		}
		wasOn = true;
		const { since, time, boat } = frame;
		const delta = Math.min(frame.delta, 0.1);
		// (A visitor who comes late, or ?cyclone=200, finds it as far on as it would be.)
		const jumped = since - lastSince > 5 || since < lastSince;
		lastSince = since;
		southern = frame.south;
		ahead.set(frame.ahead.x, 0, frame.ahead.y);
		across.set(-frame.ahead.y, 0, frame.ahead.x);
		common.uBoat.value.copy(boat);
		common.uAhead.value.copy(ahead);
		common.uAcross.value.copy(across);
		common.uTime.value = time;
		common.uWind.value.copy(frame.wind);
		common.uGold.value.copy(frame.gold).lerp(new THREE.Color(1, 0.85, 0.55), 0.5);
		common.uWater.value.copy(frame.water);
		common.uVisibility.value = frame.visibility;
		common.uDay.value = frame.day;
		common.uGain.value = frame.gain;
		common.uCloudBase.value = THREE.MathUtils.clamp(frame.cloudBase, 300, 1500);
		resolution.value.set(window.innerWidth, window.innerHeight);
		strength = cycloneBusy(since);
		common.uStrength.value = strength;

		// The centre: where the rope goes up into the cloud.
		const b = THREE.MathUtils.degToRad(CYCLONE_BEARING);
		centre.set(boat.x + (ahead.x * Math.cos(b) + across.x * Math.sin(b)) * CYCLONE_FAR, boat.z + (ahead.z * Math.cos(b) + across.z * Math.sin(b)) * CYCLONE_FAR);
		formed = cycloneRaised(since);
		swelled = cycloneSwelled(since);
		// (Anticlockwise from above is +1 in the shaders; south of the equator it turns clockwise.)
		const turn = -southern;
		common.uCyclone.value.set(centre.x, centre.y, formed, turn);

		// The link: Laeni opens her hands, and the others' threads come to hers in order of strength.
		CREW.forEach((who, m) => {
			ropeUniforms.uStand.value[m]!.copy(standOf(who, boat, ahead, across));
			tintOf(who, frame.air, frame.water, frame.gold, ropeUniforms.uTint.value[m]!);
			const from = m === 0 ? T_OPEN : T_LINKS + LINK_EVERY * (m - 1);
			const want = THREE.MathUtils.smoothstep(since, from, from + LINK_TAKES);
			joins[m] = jumped ? want : joins[m]! + (want - joins[m]!) * Math.min(1, delta / 0.3);
			ropeUniforms.uJoin.value[m] = joins[m]!;
		});
		ropeUniforms.uRopeHands.value.copy(ropeUniforms.uStand.value[0]!);
		// Its girth by the strength joined in it.
		const joined = CREW.reduce((sum, who, m) => sum + ropeMight(who) * joins[m]!, 0);
		// Run out: over the sea, then up into the cloud.
		const run = THREE.MathUtils.smoothstep(since, T_RUN, T_RUN + RUN);
		const rise = THREE.MathUtils.smoothstep(since, T_RISE, T_RISE + RISE);
		const castWant = since < T_RUN ? Math.min(0.42, 0.42 * THREE.MathUtils.smoothstep(since, T_OPEN, T_OPEN + 3)) : RUN_SHARE * (0.42 / RUN_SHARE + (1 - 0.42 / RUN_SHARE) * run) + (1 - RUN_SHARE) * rise;
		cast = jumped ? castWant : cast + (castWant - cast) * Math.min(1, delta / 0.4);
		ropeUniforms.uRope.value.set(b, CYCLONE_FAR, cast, 1.1 * Math.sqrt(joined / MOST));

		// The permeation: round the compass from Laeni's degrees, sector by sector; then the wave goes on round.
		const permeating = since - T_PERMEATE;
		front = permeating <= 0 ? 0 : Math.min(400, (360 * permeating) / FIRST_ROUND);
		if (permeating <= 0) wave = 0;
		else if (front < 360) wave = front;
		else if (jumped) wave = 360 + ((permeating - FIRST_ROUND) * 360) / ROUND_SLOW;
		else wave += (360 * delta) / THREE.MathUtils.lerp(ROUND_SLOW, ROUND_FAST, formed);
		const dirSign = southern;
		compassUniforms.uSweep.value.set(front, wave % 360, LAENI_WIDTH, dirSign);
		ROUND.forEach((who, s) => {
			compassUniforms.uSectorStand.value[s]!.copy(standOf(who, boat, ahead, across));
			tintOf(who, frame.air, frame.water, frame.gold, compassUniforms.uSectorTint.value[s]!);
		});

		// The sea under them lit along the flows (gerstner-waves.ts, permeate).
		const level = strength * THREE.MathUtils.smoothstep(permeating, 0, 6);
		sea.permeateA.value.set(boat.x, boat.z, ahead.x, ahead.z);
		sea.permeateB.value.set((level * (1 - 0.8 * frame.day)) / frame.exposure, front, wave % 360, LAENI_WIDTH);
		// (The way the cyclone's air carries things at the boat, near the sea: round the centre and in.)
		const vx = boat.x - centre.x;
		const vz = boat.z - centre.y;
		const r = Math.max(1, Math.hypot(vx, vz));
		const carriedX = (turn * vz) / r - (0.6 * vx) / r;
		const carriedZ = (-turn * vx) / r - (0.6 * vz) / r;
		const carriedLength = Math.hypot(carriedX, carriedZ);
		sea.permeateC.value.set(dirSign, formed, carriedX / carriedLength, carriedZ / carriedLength);
		ROUND.forEach((who, s) => {
			sea.permeateSectors.value[s]!.set(SECTOR_FROM[s]!, WIDTH[s]!, 220 + 520 * POWER[s]!, 0.45 + 0.55 * POWER[s]!);
			sea.permeateTints.value[s]!.copy(compassUniforms.uSectorTint.value[s]!).lerp(frame.water, 0.5);
			if (who === STRONGEST_MIND) sea.permeateTints.value[s]!.lerp(new THREE.Color(0.85, 0.95, 1), 0.5);
		});

		skyState.formed = THREE.MathUtils.clamp((since - T_RISE) / (CYCLONE_WEATHER + 160 - T_RISE), 0, 1);
		skyState.turn = turn;
		skyState.since = since;

		const blending = frame.day > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending;
		for (const mesh of meshes) (mesh.material as THREE.ShaderMaterial).blending = blending;
		rope.visible = strength > 0.001 && since > T_OPEN;
		sky.visible = strength > 0.001 && front > 0;
		dive.visible = sky.visible;
	};

	const offAhead = (degrees: number) => Math.round(((((degrees + 180) % 360) + 360) % 360) - 180);
	const describe = () =>
		!wasOn
			? ["no cyclone"]
			: [
					lastSince < T_OPEN ? "all weaving ceased" : `linked to Laeni: ${CREW.filter((_, m) => joins[m]! > 0.99).length} of ${M} (${CREW.filter((_, m) => joins[m]! > 0.99).map((who) => NAMES[who]).join(", ")})`,
					`the linked rope out ${Math.round(0.4 * (CYCLONE_FAR / 0.4) ** (Math.min(cast, RUN_SHARE) / RUN_SHARE))} m of ${CYCLONE_FAR / 1000} km, ${Math.round(Math.max(0, (cast - RUN_SHARE) / (1 - RUN_SHARE)) * 100)}% up into the cloud`,
					`the swells ${Math.round(swelled * 100)}% risen (from ${CYCLONE_SWELL} s)`,
					`the permeation ${Math.round(Math.min(front, 360))}° of 360 round, ${southern > 0 ? "clockwise (south of the equator)" : "anticlockwise (north of it)"}; the wave going round at ${Math.round(wave % 360)}°, a round in ${Math.round(THREE.MathUtils.lerp(ROUND_SLOW, ROUND_FAST, formed))} s`,
					`the weather a cyclone ${Math.round(formed * 100)}% (from ${CYCLONE_WEATHER} s); its centre ${CYCLONE_FAR / 1000} km out, ${CYCLONE_BEARING}° right of ahead; the cloud gathered ${Math.round(skyState.formed * 100)}%`,
					...ROUND.map((who, s) => `${NAMES[who]}: ${WIDTH[s]}° (from ${offAhead(SECTOR_FROM[s]! - LAENI_WIDTH / 2)}° to ${offAhead(SECTOR_FROM[s]! + WIDTH[s]! - LAENI_WIDTH / 2)}° off ahead, + right), ${THREADS_PER_DEGREE[s]} threads to each degree into the sky`),
				];

	const dispose = () => {
		for (const mesh of meshes) {
			scene.remove(mesh);
			(mesh.material as THREE.Material).dispose();
			mesh.geometry.dispose();
		}
	};

	return { update, describe, dispose, sky: () => (wasOn ? skyState : undefined) };
}
