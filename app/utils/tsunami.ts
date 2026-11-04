// The rogue's tsunami (the owner, 3 November 2026: "Let's have rogue channeller on the boat create a
// tsunami of IMMENSE force and size that approaches the POV and let's have all the other channellers
// suddenly choose parts of it to tackle, siphoning parts of it and its gravity into spurts of air flows
// and akashic flows, basically rapidly breaking it apart before it reaches the boat until by the time
// it should have reached the boat/POV, it is completely dissipated. Make one of the channellers do a
// light weave that is so strong the entire ocean is illuminated as though it is daylight. EVERYONE IS
// IN EMERGENCY MODE.")
//
// The rogue is Leane · Ember. From her seat she throws her rope out low over the sea six kilometres
// ahead and plunges it in, and the sea there heaves up into a wall three hundred metres high across
// the whole of the view, as a megatsunami stands near where it is made, and runs at the boat. From
// foot to foot it is about two and a half kilometres, so it runs as deep water lets a wave that long
// run, 62 m/s (√(g λ / 2π)), and would reach the boat in a hundred seconds; its front is no steeper
// than water stands (some thirty degrees). She keeps feeding it, her rope over its crest and down into
// its back. (The wall itself is drawn in the sea: tsunamiHeight in gerstner-waves.ts. Further off, or
// lower, it was only a line on the horizon.)
//
// Every other channeller drops what she is doing at once. The strongest is first, as always into what
// is out of the ordinary, and takes the heart of it, the part bearing on the boat; then the rest, as
// quickly as each is eager, each the part of the wall before her own side of the boat, the strongest
// of them nearest the middle, her rope laid along it. Each draws her part off in pulls timed to the
// real swell under the boat (working with the sea, as Siuan taught them): a great first pull, then it
// is worn down while it stands, and in the last quarter of her work it falls. At every pull a stretch
// of its crest is drawn up together into one leaping column of spray, as a siphon draws, and its
// weight goes on up as a flow of air (violet), which rolls out and spreads downwind, or of akasha
// (gold), which climbs: each a great puff rolling in over itself, as a thermal does; the column's
// water falls back as rain. The mighty finish first, beside the heart, so the wall is torn open there
// and stands as towers while the weaker hold on further out; whoever has finished turns her rope
// along the crest to the heart, so that at the last all of them are on what is left before the bow,
// and it falls some two hundred and fifty metres off. Nothing reaches the boat but broken water.
//
// Some of them burn it off instead (the owner, 4 November: "that fire that's helping to evaporate the
// fucking tidal wave: that should look strong"): the fire-minded, Leane's eager ones, and the strongest
// at the heart. At such a pull a sheet of fire runs along that stretch of crest and boils it: flames a
// few hundred metres high, as fire is, hot at the root and cooling as they climb (the colour of glowing
// soot, deep red near 900 K, through orange, to a cream white near 3000 K, and far brighter the hotter),
// rolling up in slow puffs as a great fire does (a pool fire puffs about 1.5/√D times a second), and
// raked back over the crest, since the crest runs on under them at 62 m/s and the hot gas keeps only
// some of that; the strongest's white-hot. What they boil goes up as steam, white, lit from below by the
// fire, and rises and spreads instead of falling back as rain.
//
// Manulani, as only she can, weaves light: her rope up from the bow into a sun she holds high ahead,
// so strong that the whole sea is lit as by day (OceanBackground.vue lifts the sun the sky is drawn
// from to hers, as for the six's noon). She holds it a minute after the wave is gone and gives the
// light back over two. Nothing jagged: every rope and flow one continuous curve.
import * as THREE from "three";
import { lines } from "./embroidery";
import { TSUNAMI_ARC, TSUNAMI_PARTS, tsunamiHeight, type GerstnerUniforms } from "./gerstner-waves";
import { NAMES, ropeMight, STRONGEST_MIND, TEMPERS } from "./psyche";
import { seatOf } from "./treason";
import { filmLook, filmShaderChunk, pixelRatio, ribbonShaderChunk, WEAVE_RELAX, WEAVE_RENDER_ORDER } from "./weave";

// Leane · Ember, and Manulani, by their place among the minds.
export const TSUNAMI_ROGUE = 3;
const LIGHT_BEARER = 13;
// Where the rogue raises it (m ahead), how high (m), how fast it runs (m/s), and its front and back (m).
const RAISED_AT = 6000;
const HEIGHT = 300;
const SPEED = 62;
const FRONT = 380;
const BACK = 1300;
// It begins to run this long after she throws (s); and when it would reach the boat.
const RUNS = 5;
export const TSUNAMI_ARRIVES = RUNS + RAISED_AT / SPEED;
// The heart is gone this long before then (s): some two hundred and fifty metres out.
const HEART_GONE = TSUNAMI_ARRIVES - 4;
// It is over when her light has been given back.
export const TSUNAMI_LASTS = TSUNAMI_ARRIVES + 180;
// Each visitor sees it begin this long after they come (s).
export const TSUNAMI_AFTER = 20;
// How far Manulani's light is lit (0..1): from five seconds in, full by twenty-two, held until a
// minute after the wave is gone, given back over two.
export function tsunamiLight(since: number) {
	return THREE.MathUtils.smoothstep(since, 5, 22) * (1 - THREE.MathUtils.smoothstep(since, TSUNAMI_ARRIVES + 60, TSUNAMI_LASTS));
}
// How far all of them are taken up with it (0..1): the everyday flow is let go at once, and taken up
// again over the minute after.
export function tsunamiBusy(since: number) {
	return THREE.MathUtils.smoothstep(since, 2, 5) * (1 - THREE.MathUtils.smoothstep(since, HEART_GONE + 10, HEART_GONE + 70));
}
// Where its crest is (m from the boat) and how high it stands (m), as yet unbroken.
const softplus = (u: number, k: number) => k * Math.log(1 + Math.exp(u / k));
const crestAt = (since: number) => RAISED_AT - SPEED * softplus(since - RUNS, 4);
const raisedTo = (since: number) => HEIGHT * THREE.MathUtils.smoothstep(since, 3, 16);

// Who breaks it, and which part each takes: the strongest the heart, the others the part before
// their own side of the boat, the strongest of them nearest the middle; the parts widen outward.
const HEART = 500;
const REACHES = 8000;
const sideOf = (who: number) => Math.sign(seatOf(who, new THREE.Vector3(), new THREE.Vector3(0, 0, -1), new THREE.Vector3(1, 0, 0)).x);
const others = [...Array(14).keys()].filter((who) => who !== TSUNAMI_ROGUE && who !== LIGHT_BEARER && who !== STRONGEST_MIND);
const byMight = (a: number, b: number) => ropeMight(b) - ropeMight(a);
const outward = (count: number) => Array.from({ length: count + 1 }, (_, k) => HEART + (REACHES - HEART) * (k / count) ** 1.5);
const onLeft = others.filter((who) => sideOf(who) < 0).sort(byMight);
const onRight = others.filter((who) => sideOf(who) > 0).sort(byMight);
const leftEdges = outward(onLeft.length);
const rightEdges = outward(onRight.length);
// From the left: whose each part is, and where it lies across the wall (m).
const PARTS = [
	...onLeft.map((who, k) => ({ who, from: -leftEdges[k + 1]!, to: -leftEdges[k]! })).reverse(),
	{ who: STRONGEST_MIND, from: -HEART, to: HEART },
	...onRight.map((who, k) => ({ who, from: rightEdges[k]!, to: rightEdges[k + 1]! })),
].map(({ who, from, to }) => {
	const temper = TEMPERS[who]!;
	const middle = (from + to) / 2;
	const heart = who === STRONGEST_MIND;
	// She joins as quickly as she is eager (the strongest first of all), and her rope is on it 2.5 s later.
	const joins = heart ? 3.5 : 6 + 4 * (1 - temper.eager);
	return {
		who,
		from,
		to,
		middle,
		half: (to - from) / 2,
		joins,
		draws: joins + 2.5,
		// Her part is gone as soon as her strength allows: the mighty's first, beside the heart, so that
		// it is torn open there while the weaker hold on further out; the heart last of all.
		gone: heart ? HEART_GONE : THREE.MathUtils.lerp(TSUNAMI_ARRIVES - 12, 0.5 * TSUNAMI_ARRIVES, (ropeMight(who) / ropeMight(0)) ** 0.7),
		// How great her first pull is, and her place in the swell's rhythm.
		first: heart ? 0.3 : 0.08 + 0.2 * temper.eager,
		phase: (who * 2.399) % (2 * Math.PI),
		// How much of what she draws goes up as air, the rest as akasha.
		air: temper.air / (temper.air + temper.water),
		// And how much of it she burns off as steam instead: the eager (Leane's, chiefly), and the strongest.
		fire: heart ? 0.6 : THREE.MathUtils.clamp((temper.eager - 0.5) * 2.4, 0, 0.7),
		size: Math.cbrt(ropeMight(who) / ropeMight(STRONGEST_MIND)),
	};
});
const HEART_PART = PARTS.findIndex((part) => part.who === STRONGEST_MIND);
if (PARTS.length !== TSUNAMI_PARTS) throw new Error(`the tsunami has ${PARTS.length} parts, the sea ${TSUNAMI_PARTS}`);

// How much of a part is left (0..1) at `since`, and how hard it is being drawn just then. She draws in
// pulls with the real swell (pull 0.6 - 0.4 cos ωτ, whose integral is known, so a visit can begin
// part-way through): a first great pull, then it is worn down steadily while it still stands, and
// over the last quarter of her work it falls.
const pulled = (tau: number, omega: number, phase: number) => 0.6 * tau - (0.4 / omega) * (Math.sin(omega * tau + phase) - Math.sin(phase));
function partNow(part: (typeof PARTS)[number], since: number, omega: number) {
	const tau = since - part.draws;
	if (tau <= 0) return { left: 1, pulling: 0 };
	const done = THREE.MathUtils.clamp(pulled(tau, omega, part.phase) / pulled(part.gone - part.draws, omega, part.phase), 0, 1);
	const left = (1 - part.first * THREE.MathUtils.smoothstep(done, 0, 0.12)) * (1 - 0.2 * done) * (1 - THREE.MathUtils.smoothstep(done, 0.75, 1));
	return { left, pulling: since < part.gone ? 0.6 - 0.4 * Math.cos(omega * tau + part.phase) : 0 };
}

const FILAMENTS = 22;
const SEGMENTS = 80;
// Each part's spurts at once (one to each of her last four pulls), and the filaments of each.
const SPURTS = 4;
const STEM = 24;
const RING = 40;
const SPURT_SEGMENTS = 64;
// The tongues of each burning.
const FLAMES = 160;

const ropeVertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute vec2 aCell;
attribute vec4 aSeed;
uniform float uTime;
uniform vec3 uBoat;
uniform vec2 uFrom;
uniform float uCrest;
uniform float uBack;
uniform vec3 uSeats[ 14 ];
uniform vec3 uTints[ 14 ];
uniform float uGirth[ 14 ];
// For each: where her rope lands along the crest (m across), how far it fans along it (m), the
// crest's height there (m), and how far out the rope is cast (0..1).
uniform vec4 uWork[ 14 ];
// And the crest's height (m) where her rope ends each way along it.
uniform vec2 uEnds[ 14 ];
uniform vec3 uLight;
uniform float uDay;
varying float vAlpha;
varying float vEdge;
varying float vSky;
varying vec3 vTint;
varying float vCore;
${ribbonShaderChunk}

vec3 bezier( vec3 a, vec3 b, vec3 c, vec3 d, float t ) {
	float s = 1.0 - t;
	return s * s * s * a + 3.0 * s * s * t * b + 3.0 * s * t * t * c + t * t * t * d;
}
// A point on the crest, at x across it and h over the sea, s in front of it.
vec3 crestPoint( float x, float h, float s ) {
	vec2 m = vec2( - uFrom.y, uFrom.x );
	vec2 centre = uBoat.xz + uFrom * ( uCrest + ${TSUNAMI_ARC.toFixed(1)} );
	float a = x / ${TSUNAMI_ARC.toFixed(1)};
	vec2 q = centre + ( - uFrom * cos( a ) + m * sin( a ) ) * ( ${TSUNAMI_ARC.toFixed(1)} + s );
	return vec3( q.x, h, q.y );
}
vec3 ropeAt( int who, float t, float fan ) {
	vec3 seat = uSeats[ who ];
	vec4 work = uWork[ who ];
	vec3 ahead = vec3( uFrom.x, 0.0, uFrom.y );
	if ( who == ${LIGHT_BEARER} ) {
		// Up from the bow, out a little, and into the light she holds.
		vec3 hands = seat + ahead * 15.0 + vec3( 0.0, 1.0, 0.0 );
		return bezier( hands, hands + vec3( 0.0, 120.0, 0.0 ) + ahead * 140.0, uLight - normalize( uLight - hands ) * 900.0 + vec3( 0.0, - 200.0, 0.0 ), uLight, t );
	}
	vec3 lands = crestPoint( work.x, work.z + 3.0, 0.0 );
	vec3 out_ = lands - seat;
	vec3 towards = normalize( vec3( out_.x, 0.0, out_.z ) + vec3( 1e-4 ) );
	// (Drawn from fifteen metres out: several sit behind the eye, and a rope passing by it was stretched
	// across the whole picture.)
	vec3 hands = seat + towards * 15.0 + vec3( 0.0, 0.5, 0.0 );
	float far = length( out_.xz );
	if ( who == ${TSUNAMI_ROGUE} ) {
		// Out low over the sea to its crest, and over it and down into its back.
		vec3 behind = crestPoint( 0.0, 0.4 * work.z, - 0.7 * uBack );
		if ( t < 0.8 ) return bezier( hands, hands + towards * 0.15 * far + vec3( 0.0, 3.0, 0.0 ), lands - towards * 0.35 * far + vec3( 0.0, 0.3 * work.z + 10.0, 0.0 ), lands, t / 0.8 );
		return bezier( lands, lands + towards * 0.25 * uBack + vec3( 0.0, 20.0, 0.0 ), behind + vec3( 0.0, 0.5 * work.z + 20.0, 0.0 ), behind, ( t - 0.8 ) / 0.2 );
	}
	// Out low over the sea and up onto its crest, and laid along her part of it each way, on the crest
	// as high as it stands there.
	vec2 ends = uEnds[ who ];
	float along = t < 0.75 ? 0.3 : mix( 0.3, 1.0, ( t - 0.75 ) / 0.25 );
	float on = mix( work.z, fan < 0.0 ? ends.x : ends.y, along * abs( fan ) ) + 3.0;
	// (Low near the boat: a rise of ten metres within forty of the eye stands up past the top of the picture.)
	if ( t < 0.75 ) return bezier( hands, hands + towards * 0.15 * far + vec3( 0.0, 3.0, 0.0 ), crestPoint( work.x + 0.2 * fan * work.y, 0.25 * on + 12.0, 0.3 * far ), crestPoint( work.x + 0.3 * fan * work.y, on, 0.0 ), t / 0.75 );
	return crestPoint( work.x + along * fan * work.y, on, 0.0 );
}

void main() {
	int who = int( aCell.x + 0.5 );
	vec4 work = uWork[ who ];
	float fan = ( aSeed.x - 0.5 ) * 2.0;
	vec3 here = ropeAt( who, aT, fan );
	vec3 next = ropeAt( who, min( aT + 0.0125, 1.0 ), fan ) + ( aT >= 0.9875 ? here - ropeAt( who, aT - 0.0125, fan ) : vec3( 0.0 ) );
	vec3 dir = normalize( next - here + vec3( 1e-5 ) );
	vec3 n1 = normalize( cross( dir, vec3( 0.0, 1.0, 0.0 ) ) + vec3( 1e-4 ) );
	vec3 n2 = normalize( cross( n1, dir ) );
	// A hawser's girth, wound about its line, widening out along it.
	float girth = ( 0.4 + uGirth[ who ] * ( 0.3 + 3.0 * aT * aT ) ) * sqrt( aSeed.z );
	float turn = aSeed.y * 6.28318 + aT * 9.0 + uTime * 0.12;
	vec3 off = ( n1 * cos( turn ) + n2 * sin( turn ) ) * girth;
	here += off;
	next += off;
	// Cast out from her hands, and drawn back into them.
	float shown = smoothstep( work.w, work.w - 0.04, aT );
	if ( who == ${LIGHT_BEARER} ) shown *= 1.0 - smoothstep( 0.75, 1.0, aT );
	float far = length( here - cameraPosition );
	vAlpha = shown * smoothstep( 15.0, 50.0, far ) * exp( - far / 12000.0 );
	vEdge = aSide;
	vSky = againstSky( here );
	vTint = uTints[ who ];
	// (Its filaments nearest the line are its heart, the outermost its flank.)
	vCore = 1.0 - aSeed.z;
	mat4 vp = projectionMatrix * viewMatrix;
	gl_Position = ribbonPosition( vp * vec4( here, 1.0 ), vp * vec4( next, 1.0 ), aSide, mix( 1.0, 1.3, uDay ) );
}
`;

const ropeFragment = /* glsl */ `
uniform float uGain;
uniform float uDay;
uniform float uFilm;
varying float vAlpha;
varying float vEdge;
varying float vSky;
varying vec3 vTint;
varying float vCore;
${filmShaderChunk}
void main() {
	float body = 1.0 - smoothstep( 0.7, 1.0, abs( vEdge ) );
	vec3 tint = mix( vTint, filmShade( vTint, vCore ), uFilm );
	// (By day lighter against the sky: never a dark line.)
	gl_FragColor = vec4( mix( tint * uGain, tint * max( 1.2, uGain * mix( 0.8, 1.5, vSky ) ), uDay ), body * vAlpha * 0.03 * mix( 1.0, 3.0, uDay ) );
	// (Relaxed by half: WEAVE_RELAX.)
	gl_FragColor.a *= ${WEAVE_RELAX.toFixed(3)};
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

// Shared by the spurts' flows and their spray: where and when each spurt is, from the part (aCell.x)
// and which of her last pulls it is (aCell.y, counted round).
const spurtCommon = /* glsl */ `
uniform float uTime;
uniform float uSince;
uniform vec3 uBoat;
uniform vec2 uFrom;
uniform float uOmega;
uniform vec3 uWind;
// For each part, from the left: when she begins to draw, when her own part is gone, her place in the
// swell's rhythm, and when the heart is gone; where her part lies (middle, half-width, m); the crest's
// height there and at the heart now (m); her size, how much of what she draws goes up as air, and how
// much she burns off.
uniform vec4 uBite[ ${TSUNAMI_PARTS} ];
uniform vec2 uPart[ ${TSUNAMI_PARTS} ];
uniform vec2 uHigh[ ${TSUNAMI_PARTS} ];
uniform vec3 uKind[ ${TSUNAMI_PARTS} ];
uniform float uDay;
uniform float uFilm;
uniform vec3 uAir;
uniform vec3 uGold;
uniform vec3 uSpray;
varying float vAlpha;
varying vec3 vTint;

float spurtHash( float a, float b ) { return fract( sin( a * 12.9898 + b * 78.233 ) * 43758.5453 ); }
float crestAt( float since ) {
	float u = ( since - ${RUNS.toFixed(1)} ) / 4.0;
	return ${RAISED_AT.toFixed(1)} - ${SPEED.toFixed(1)} * 4.0 * ( u > 20.0 ? u : log( 1.0 + exp( u ) ) );
}
vec3 crestPoint( float x, float h, float crest ) {
	vec2 m = vec2( - uFrom.y, uFrom.x );
	vec2 centre = uBoat.xz + uFrom * ( crest + ${TSUNAMI_ARC.toFixed(1)} );
	float a = x / ${TSUNAMI_ARC.toFixed(1)};
	vec2 q = centre + ( - uFrom * cos( a ) + m * sin( a ) ) * ${TSUNAMI_ARC.toFixed(1)};
	return vec3( q.x, h, q.y );
}
`;

// Inside main: everything about this spurt (it returns, unseen, if there is none).
const spurtTiming = /* glsl */ `
	int p = int( aCell.x + 0.5 );
	float slot = mod( aCell.y, ${SPURTS}.0 );
	vec4 bite = uBite[ p ];
	// Her pulls come at the swell's troughs under the boat: the latest that is this spurt's.
	float tau = uSince - bite.x;
	float latest = floor( ( uOmega * tau + bite.z - 3.14159 ) / 6.28318 );
	float n = latest - mod( latest - slot, ${SPURTS}.0 );
	float born = ( 3.14159 * ( 2.0 * n + 1.0 ) - bite.z ) / uOmega;
	float age = tau - born;
	float bornAt = bite.x + born;
	float life = ${SPURTS}.0 * 6.28318 / uOmega;
	if ( tau <= 0.0 || born < 0.0 || bornAt > bite.w + 1.0 ) { gl_Position = vec4( 0.0, 0.0, 2.0, 1.0 ); vAlpha = 0.0; return; }
	// Once her own part is gone she draws on the heart.
	bool helping = bornAt > bite.y;
	vec2 part = helping ? uPart[ ${HEART_PART} ] : uPart[ p ];
	float high = helping ? uHigh[ p ].y : uHigh[ p ].x;
	float x = part.x + part.y * 0.8 * ( 2.0 * spurtHash( n, float( p ) ) - 1.0 );
	bool fire = spurtHash( n + 13.0, float( p ) ) < uKind[ p ].z;
	bool air = ! fire && spurtHash( n + 7.0, float( p ) ) < uKind[ p ].y;
	// A burning: how far its fire is alight (it boils the crest first, and is out before the steam is).
	float burning = fire ? smoothstep( 0.0, 0.8, age ) * ( 1.0 - smoothstep( 6.0, 11.0, age ) ) : 0.0;
	float size = uKind[ p ].x * ( 0.7 + 0.5 * spurtHash( n + 3.0, float( p ) ) );
	float crest = crestAt( bornAt );
	vec3 root = crestPoint( x, high, crest );
	// Thrown up off the moving crest, it keeps a little of its run, and the wind takes it.
	vec3 run = - vec3( uFrom.x, 0.0, uFrom.y );
	vec3 side = vec3( run.z, 0.0, - run.x );
	vec3 drift = run * ${SPEED.toFixed(1)} * 1.5 * ( 1.0 - exp( - age / 1.5 ) ) + uWind * age * 0.6;
	// Its head: leaping fast and slowing, then rising as a thermal does, akasha faster than air.
	float jet = ( 300.0 + 450.0 * size ) * ( 0.7 + 0.3 * spurtHash( n + 11.0, float( p ) ) );
	float z = jet * ( 1.0 - exp( - age / 3.0 ) ) + ( air ? 5.0 : 12.0 ) * age;
	float spent = smoothstep( 0.55, 1.0, age / life );
	vec3 head = root + drift + vec3( 0.0, z, 0.0 );
	// A stretch of the crest, this wide each way, is drawn up into it.
	float spread = max( 60.0, 0.35 * part.y );
`;

const spurtVertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute vec2 aCell;
attribute vec4 aSeed;
${spurtCommon}
varying float vEdge;
varying float vCore;
${ribbonShaderChunk}

void main() {
${spurtTiming}
	bool ring = aCell.y > ${SPURTS - 0.5};
	vec3 here;
	vec3 next;
	float shown;
	vec3 tint;
	if ( ! ring ) {
		// The spurt: a stretch of the crest drawn up together into one column, as a siphon draws, its
		// water leaping and snaking a little, and falling away as its weight goes on up.
		vec3 base = crestPoint( x + spread * ( 2.0 * aSeed.x - 1.0 ), high, crest );
		for ( int k = 0; k < 2; k ++ ) {
			float t = min( aT + float( k ) * 0.01, 1.0 );
			float gather = smoothstep( 0.0, 0.75, t );
			vec3 line = vec3( mix( base.x, head.x, gather ), mix( base.y, head.y, t ), mix( base.z, head.z, gather ) ) + side * z * 0.06 * sin( t * 3.0 + n ) * t;
			float w = aSeed.y * 6.28318 + t * ( 7.0 + 5.0 * aSeed.x ) + uTime * 0.4;
			vec3 q = line + ( side * cos( w ) + run * sin( w ) ) * ( 6.0 + 0.1 * z * t ) * aSeed.z;
			if ( k == 0 ) here = q; else next = q;
		}
		shown = 0.8 * smoothstep( 0.0, 0.5, age ) * ( 1.0 - smoothstep( 4.0, 11.0, age ) ) * smoothstep( 0.0, 0.03, aT );
		tint = uSpray;
		// (Boiled, it is steam: white, and lit from below by the fire while it burns.)
		if ( fire ) tint = mix( vec3( 1.0 ), vec3( 1.0, 0.62, 0.32 ), 0.8 * burning * ( 1.0 - smoothstep( 0.0, 0.45, aT ) ) );
		vCore = 1.0 - aSeed.z;
	} else {
		// Its head, a great puff rolling in over itself, widening as it rises; the air's spreading wide
		// and flattening as it is spent, the akasha's climbing. Each filament on its own shell, so it
		// is a body and not a hoop.
		float tilt = 0.35 * ( spurtHash( n + 5.0, float( p ) ) - 0.5 );
		vec3 axis = normalize( vec3( 0.0, 1.0, 0.0 ) + side * tilt );
		vec3 u = normalize( side - axis * dot( side, axis ) );
		vec3 v = cross( axis, u );
		float R = ( 40.0 + 0.25 * z ) * ( air ? 1.5 : 1.0 ) * ( 1.0 + ( air ? 1.4 : 0.4 ) * spent ) * ( 0.7 + 0.6 * aSeed.w );
		float s = fract( aSeed.x * 3.0 + uTime * 0.05 );
		for ( int k = 0; k < 2; k ++ ) {
			float a = ( aT + float( k ) * 0.004 ) * 6.28318;
			float roll = aSeed.y * 6.28318 + s * 12.566 + uTime * 0.6 + a * 2.0;
			vec3 radial = u * cos( a ) + v * sin( a );
			float rim = R * ( 1.0 + 0.1 * sin( 3.0 * a + uTime * 0.07 + n ) + 0.06 * sin( 5.0 * a - uTime * 0.05 + aSeed.y * 3.0 ) );
			vec3 q = head + radial * rim + ( radial * cos( roll ) + axis * sin( roll ) * ( 1.0 - ( air ? 0.7 : 0.3 ) * spent ) ) * R * ( 0.6 - 0.35 * s );
			if ( k == 0 ) here = q; else next = q;
		}
		shown = smoothstep( 0.5, 3.0, age ) * ( 1.0 - smoothstep( 0.7 * life, life, age ) ) * smoothstep( 0.0, 0.15, s ) * ( 1.0 - smoothstep( 0.8, 1.0, s ) );
		tint = fire ? vec3( 1.0, 0.98, 0.95 ) : air ? uAir : uGold;
		// (The strongest's own are white.)
		if ( p == ${HEART_PART} && ! helping ) tint = mix( tint, vec3( 1.0 ), 0.65 );
		vCore = 1.0 - aSeed.w;
	}
	float far = length( here - cameraPosition );
	vAlpha = shown * ( 0.6 + 0.4 * size ) * smoothstep( 10.0, 60.0, far ) * exp( - far / 14000.0 );
	vEdge = aSide;
	vTint = tint;
	mat4 vp = projectionMatrix * viewMatrix;
	gl_Position = ribbonPosition( vp * vec4( here, 1.0 ), vp * vec4( next, 1.0 ), aSide, mix( 1.2, 1.5, uDay ) );
}
`;

const spurtFragment = /* glsl */ `
uniform float uGain;
uniform float uDay;
uniform float uFilm;
varying float vAlpha;
varying float vEdge;
varying vec3 vTint;
varying float vCore;
${filmShaderChunk}
void main() {
	float across = abs( vEdge );
	float body = pow( max( 1.0 - across * across, 0.0 ), 1.5 );
	vec3 tint = mix( vTint, filmShade( vTint, vCore ), uFilm );
	gl_FragColor = vec4( mix( tint * uGain, tint * max( 1.8, 1.4 * uGain ), uDay ), body * vAlpha * mix( 0.08, 0.2, uDay ) );
	// (Relaxed by half: WEAVE_RELAX.)
	gl_FragColor.a *= ${WEAVE_RELAX.toFixed(3)};
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

// The water of each spurt, as soft drifting spray (the flows it becomes are the filaments above):
// drawn up the column from its stretch of crest, widening as it climbs, and once the pull is over
// falling back to the sea, the lower the sooner, while the top goes on up into the flow.
const SPRAY = 50;
const sprayVertex = /* glsl */ `
attribute vec2 aCell;
attribute vec4 aSeed;
${spurtCommon}
varying vec2 vAt;
void main() {
${spurtTiming}
	float t = aSeed.x;
	vec3 base = crestPoint( x + spread * ( 2.0 * aSeed.y - 1.0 ), high, crest );
	float gather = smoothstep( 0.0, 0.75, t );
	vec3 line = vec3( mix( base.x, head.x, gather ), mix( base.y, head.y, t ), mix( base.z, head.z, gather ) ) + side * z * 0.06 * sin( t * 3.0 + n ) * t;
	float fall = fire ? 0.0 : max( 0.0, age - 3.0 - 6.0 * t );
	line.y = max( line.y - 4.9 * fall * fall, 0.0 );
	// (Steam rises, and spreads the more.)
	if ( fire ) line.y += ( 4.0 + 8.0 * t ) * age;
	float width = 12.0 + 0.12 * z * t + ( fire ? 9.0 : 5.0 ) * age;
	vec3 centre = line + ( side * ( aSeed.z - 0.5 ) + run * ( aSeed.w - 0.5 ) ) * width * 1.4;
	float puff = ( 16.0 + 0.1 * z * t + 3.0 * age ) * ( 0.6 + 0.8 * fract( aSeed.z * 7.13 ) );
	float far = length( centre - cameraPosition );
	// (Thinner where all of them are on the heart at once, or it whitened the sky.)
	vAlpha = smoothstep( 0.0, 0.6, age ) * ( 1.0 - ( fire ? smoothstep( 8.0 + 6.0 * t, 16.0 + 8.0 * t, age ) : smoothstep( 3.0 + 6.0 * t, 6.0 + 9.0 * t, age ) ) ) * smoothstep( 10.0, 60.0, far ) * exp( - far / 14000.0 ) * ( 0.6 + 0.4 * size ) * ( helping ? 0.35 : 1.0 );
	vTint = fire ? mix( vec3( 1.0 ), vec3( 1.0, 0.62, 0.32 ), 0.8 * burning * ( 1.0 - smoothstep( 0.0, 0.4, t ) ) ) : uSpray;
	vAt = position.xy;
	vec4 seen = viewMatrix * vec4( centre, 1.0 );
	seen.xy += position.xy * puff;
	gl_Position = projectionMatrix * seen;
}
`;

const sprayFragment = /* glsl */ `
uniform float uGain;
uniform float uDay;
uniform float uFilm;
varying float vAlpha;
varying vec3 vTint;
varying vec2 vAt;
void main() {
	float soft = exp( - 3.0 * dot( vAt, vAt ) );
	// (The film look: a cream white where it is thick, and its thin edges cooler, as the photograph's clouds.)
	vec3 tint = mix( vTint, vTint * mix( vec3( 0.8, 0.94, 1.0 ), vec3( 1.0, 0.97, 0.9 ), soft ), uFilm );
	// (Lit spray is white: by day as bright as the sky, or it reads as smoke.)
	gl_FragColor = vec4( mix( tint * uGain, tint * max( 2.4, 1.6 * uGain ), uDay ), soft * vAlpha * mix( 0.1, 0.17, uDay ) );
	// (Relaxed by half: WEAVE_RELAX.)
	gl_FragColor.a *= ${WEAVE_RELAX.toFixed(3)};
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

// The fire of a burning, as soft tongues of flame: each leaves the crest where it then was, along the
// stretch being boiled, and climbs, narrowing in towards the column and drawn out upward, cooling as it
// goes, and is gone at the top; the whole sheet rises and falls in slow puffs that roll along it. The
// crest runs on under them, so they are raked back over it.
const flameVertex = /* glsl */ `
attribute vec2 aCell;
attribute vec4 aSeed;
${spurtCommon}
varying vec2 vAt;
varying float vHeat;
void main() {
${spurtTiming}
	if ( burning <= 0.0 ) { gl_Position = vec4( 0.0, 0.0, 2.0, 1.0 ); vAlpha = 0.0; return; }
	float rise = 1.8 + 1.4 * aSeed.w;
	float u = fract( aSeed.x + uTime / rise );
	float left = u * rise;
	// (Where the crest was when it left it, less half the run since, as the hot gas keeps half of it.)
	float crestThen = max( crestAt( uSince - left ) - 0.5 * ${SPEED.toFixed(1)} * left, crestAt( uSince ) );
	// (Lower towards the ends of the stretch, as a fire is lowest where it has least to burn.)
	float tall = ( 180.0 + 320.0 * size ) * ( 0.85 + 0.25 * sin( 0.95 * uTime + n * 1.7 + aSeed.y * 2.0 ) ) * ( 0.4 + 0.6 * burning ) * ( 1.0 - 0.65 * pow( abs( 2.0 * aSeed.y - 1.0 ), 2.5 ) );
	float along = x + spread * 1.1 * ( 2.0 * aSeed.y - 1.0 ) * ( 1.0 - 0.35 * u ) + 0.12 * tall * u * sin( 0.6 * uTime + aSeed.y * 9.0 );
	vec3 centre = crestPoint( along, high - 6.0 + tall * pow( u, 0.85 ), crestThen ) + uWind * left * 0.8;
	// (Broad and overlapping, so that they are one body of flame and not sparks.)
	float puff = ( 16.0 + 30.0 * size ) * ( 0.9 + 1.1 * u ) * ( 1.0 - 0.5 * u * u ) * ( 0.7 + 0.6 * aSeed.z ) * ( 0.5 + 0.5 * burning );
	// Hot at the root, cooling as it climbs; the strongest's hotter.
	vHeat = clamp( pow( 1.0 - u, 0.8 ) * ( 0.9 + 0.15 * aSeed.z ), 0.0, 1.0 ) * ( 0.6 + 0.4 * burning );
	if ( p == ${HEART_PART} && ! helping ) vHeat = min( 1.0, 1.1 * vHeat + 0.08 );
	float far = length( centre - cameraPosition );
	vAlpha = burning * smoothstep( 0.0, 0.12, u ) * ( 1.0 - smoothstep( 0.65, 1.0, u ) ) * smoothstep( 10.0, 60.0, far ) * exp( - far / 14000.0 ) * ( 0.6 + 0.4 * size );
	vTint = vec3( 1.0 );
	vAt = position.xy;
	vec4 seen = viewMatrix * vec4( centre, 1.0 );
	seen.xy += position.xy * puff * vec2( 1.0, mix( 1.0, 1.8, smoothstep( 0.2, 0.7, u ) ) );
	gl_Position = projectionMatrix * seen;
}
`;

const flameFragment = /* glsl */ `
uniform float uGain;
uniform float uDay;
varying float vAlpha;
varying float vHeat;
varying vec2 vAt;
void main() {
	float d = dot( vAt, vAt );
	float soft = exp( - 3.5 * d );
	float k = clamp( vHeat * ( 0.75 + 0.3 * exp( - 3.0 * d ) ), 0.0, 1.0 );
	// Glowing soot (Planck): deep red near 900 K, through orange, to a cream white near 3000 K, and far
	// brighter the hotter.
	vec3 glow = vec3( 1.0, mix( 0.03, 0.55, pow( k, 1.2 ) ), 0.28 * pow( k, 2.2 ) ) * ( 0.4 + 2.8 * k * k );
	float a = soft * vAlpha;
	// Fire is light: it gives its own (premultiplied), and is thick enough to hide a little of what is
	// behind it, the more by day, or the day sky shows through it as a peach haze.
	gl_FragColor = vec4( glow * uGain * mix( 1.0, 1.6, uDay ) * a * 0.5, a * mix( 0.12, 0.5, uDay ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

export interface TsunamiFrame {
	// Seconds since the rogue threw.
	since: number;
	time: number;
	boat: THREE.Vector3;
	ahead: THREE.Vector2;
	// Where the real swell comes from, off ahead (radians), and its period (s).
	swellFrom: number;
	swellPeriod: number;
	// The real wind (m/s).
	wind: THREE.Vector3;
	// The direction of the sun the sky is drawn from (hers, while she holds it).
	light: THREE.Vector3;
	day: number;
	gain: number;
	// The three's colours (Siuan's, Leane's, Moiraine's), and the elements'.
	tints: THREE.Color[];
	air: THREE.Color;
	gold: THREE.Color;
	water: THREE.Color;
}

// Whose each is (Siuan's, Leane's, Moiraine's).
const THIRD_OF = [0, 1, 0, 1, 2, 2, 1, 0, 2, 1, 0, 2, 0, 0];
const EMBER = new THREE.Color(0.86, 0.34, 0.16);
const HER_LIGHT = new THREE.Color(1, 0.88, 0.66);
const WHITE = new THREE.Color(1, 1, 1);

export function createTsunami(scene: THREE.Scene, layer: number, sea: GerstnerUniforms) {
	const ropeCells: [number, number][] = [];
	for (let who = 0; who < 14; who++) for (let f = 0; f < Math.round(FILAMENTS * ropeMight(who)); f++) ropeCells.push([who, 0]);
	const ropeGeometry = lines(ropeCells.length, SEGMENTS, (i) => ropeCells[i]!);
	const ropeUniforms = {
		uTime: { value: 0 },
		uBoat: { value: new THREE.Vector3() },
		uFrom: { value: new THREE.Vector2(0, -1) },
		uCrest: { value: RAISED_AT },
		uBack: { value: BACK },
		uSeats: { value: Array.from({ length: 14 }, () => new THREE.Vector3()) },
		uTints: { value: Array.from({ length: 14 }, () => new THREE.Color()) },
		uGirth: { value: Array.from({ length: 14 }, (_, who) => 1.4 * Math.cbrt(ropeMight(who))) },
		uWork: { value: Array.from({ length: 14 }, () => new THREE.Vector4()) },
		uEnds: { value: Array.from({ length: 14 }, () => new THREE.Vector2()) },
		uLight: { value: new THREE.Vector3() },
		uDay: { value: 0 },
		uFilm: filmLook,
		uGain: { value: 1 },
		uResolution: { value: new THREE.Vector2(1, 1) },
		uPixelRatio: pixelRatio,
	};
	const ropes = new THREE.Mesh(ropeGeometry, new THREE.ShaderMaterial({ uniforms: ropeUniforms, vertexShader: ropeVertex, fragmentShader: ropeFragment, transparent: true, depthWrite: false, side: THREE.DoubleSide }));

	const spurtCells: [number, number][] = [];
	for (let p = 0; p < TSUNAMI_PARTS; p++)
		for (let slot = 0; slot < SPURTS; slot++) {
			for (let f = 0; f < STEM; f++) spurtCells.push([p, slot]);
			for (let f = 0; f < RING; f++) spurtCells.push([p, slot + SPURTS]);
		}
	const spurtGeometry = lines(spurtCells.length, SPURT_SEGMENTS, (i) => spurtCells[i]!);
	const spurtUniforms = {
		uTime: { value: 0 },
		uSince: { value: 0 },
		uBoat: { value: new THREE.Vector3() },
		uFrom: { value: new THREE.Vector2(0, -1) },
		uOmega: { value: 0.6 },
		uWind: { value: new THREE.Vector3() },
		uBite: { value: PARTS.map((part) => new THREE.Vector4(part.draws, part.gone, part.phase, HEART_GONE)) },
		uPart: { value: PARTS.map((part) => new THREE.Vector2(part.middle, part.half)) },
		uHigh: { value: PARTS.map(() => new THREE.Vector2()) },
		uKind: { value: PARTS.map((part) => new THREE.Vector3(part.size, part.air, part.fire)) },
		uDay: { value: 0 },
		uFilm: filmLook,
		uGain: { value: 1 },
		uAir: { value: new THREE.Color() },
		uGold: { value: new THREE.Color() },
		uSpray: { value: new THREE.Color() },
		uResolution: { value: new THREE.Vector2(1, 1) },
		uPixelRatio: pixelRatio,
	};
	const spurts = new THREE.Mesh(spurtGeometry, new THREE.ShaderMaterial({ uniforms: spurtUniforms, vertexShader: spurtVertex, fragmentShader: spurtFragment, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
	const quad = new THREE.PlaneGeometry(2, 2);
	const sprayGeometry = new THREE.InstancedBufferGeometry();
	sprayGeometry.index = quad.index;
	sprayGeometry.setAttribute("position", quad.getAttribute("position"));
	const sprayCount = TSUNAMI_PARTS * SPURTS * SPRAY;
	const sprayCells = new Float32Array(sprayCount * 2);
	const spraySeeds = new Float32Array(sprayCount * 4);
	for (let i = 0; i < sprayCount; i++) {
		sprayCells.set([Math.floor(i / (SPURTS * SPRAY)), Math.floor(i / SPRAY) % SPURTS], i * 2);
		// (More of it low down, where the water is thickest.)
		spraySeeds.set([Math.random() ** 1.4, Math.random(), Math.random(), Math.random()], i * 4);
	}
	sprayGeometry.setAttribute("aCell", new THREE.InstancedBufferAttribute(sprayCells, 2));
	sprayGeometry.setAttribute("aSeed", new THREE.InstancedBufferAttribute(spraySeeds, 4));
	sprayGeometry.instanceCount = sprayCount;
	const spray = new THREE.Mesh(sprayGeometry, new THREE.ShaderMaterial({ uniforms: spurtUniforms, vertexShader: sprayVertex, fragmentShader: sprayFragment, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
	const flameGeometry = new THREE.InstancedBufferGeometry();
	flameGeometry.index = quad.index;
	flameGeometry.setAttribute("position", quad.getAttribute("position"));
	const flameCount = TSUNAMI_PARTS * SPURTS * FLAMES;
	const flameCells = new Float32Array(flameCount * 2);
	const flameSeeds = new Float32Array(flameCount * 4);
	for (let i = 0; i < flameCount; i++) {
		flameCells.set([Math.floor(i / (SPURTS * FLAMES)), Math.floor(i / FLAMES) % SPURTS], i * 2);
		flameSeeds.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
	}
	flameGeometry.setAttribute("aCell", new THREE.InstancedBufferAttribute(flameCells, 2));
	flameGeometry.setAttribute("aSeed", new THREE.InstancedBufferAttribute(flameSeeds, 4));
	flameGeometry.instanceCount = flameCount;
	// (Premultiplied: its own light added, and a little of what is behind it hidden.)
	const flames = new THREE.Mesh(
		flameGeometry,
		new THREE.ShaderMaterial({ uniforms: spurtUniforms, vertexShader: flameVertex, fragmentShader: flameFragment, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor }),
	);
	for (const mesh of [ropes, spurts, spray, flames]) {
		mesh.frustumCulled = false;
		mesh.renderOrder = WEAVE_RENDER_ORDER;
		mesh.layers.set(layer);
		mesh.visible = false;
		scene.add(mesh);
	}

	// The sea's parts, from the left: where they meet.
	PARTS.slice(1).forEach((part, k) => (sea.tsuEdges.value[k] = part.from));
	const ahead = new THREE.Vector3();
	const across = new THREE.Vector3();
	const from = new THREE.Vector2();
	// The crest's height, as the sea draws it, at x across it.
	const crestHigh = (x: number, crest: number, boat: THREE.Vector3) => {
		const a = x / TSUNAMI_ARC;
		const cx = boat.x + from.x * (crest + TSUNAMI_ARC) + (-from.x * Math.cos(a) - from.y * Math.sin(a)) * TSUNAMI_ARC;
		const cz = boat.z + from.y * (crest + TSUNAMI_ARC) + (-from.y * Math.cos(a) + from.x * Math.sin(a)) * TSUNAMI_ARC;
		return Math.max(0, tsunamiHeight(sea, cx, cz, Math.hypot(cx - boat.x, cz - boat.z)));
	};
	let told: string[] = [];
	const update = (frame: TsunamiFrame | undefined) => {
		if (!frame || frame.since < 0 || frame.since > TSUNAMI_LASTS) {
			ropes.visible = false;
			spurts.visible = false;
			spray.visible = false;
			flames.visible = false;
			sea.tsuShape.value.setY(0);
			told = [];
			return;
		}
		const since = frame.since;
		ahead.set(frame.ahead.x, 0, frame.ahead.y);
		across.set(-frame.ahead.y, 0, frame.ahead.x);
		// It comes from ahead, turned a little towards where the real swell comes from.
		const turn = THREE.MathUtils.clamp(0.1 * frame.swellFrom, -0.1, 0.1);
		from.set(frame.ahead.x * Math.cos(turn) - frame.ahead.y * Math.sin(turn), frame.ahead.x * Math.sin(turn) + frame.ahead.y * Math.cos(turn));
		const omega = (2 * Math.PI) / THREE.MathUtils.clamp(frame.swellPeriod, 7, 16);
		const crest = crestAt(since);
		const raised = raisedTo(since);
		const now = PARTS.map((part) => partNow(part, since, omega));
		// Once their own parts are gone, those who have finished draw on the heart with the strongest.
		const helping = PARTS.filter((part, k) => k !== HEART_PART && since > part.gone && since < HEART_GONE).length;

		// The sea: the wall as they have left it, until the last of the broken water has reached the boat.
		sea.tsuFront.value.set(frame.boat.x, frame.boat.z, from.x, from.y);
		sea.tsuShape.value.set(crest, since < TSUNAMI_ARRIVES + 15 ? raised : 0, FRONT, BACK);
		now.forEach((part, k) => sea.tsuRemain.value[k]!.set(part.left, k === HEART_PART ? Math.min(1.5, part.pulling + 0.08 * helping) : part.pulling));

		// The ropes.
		ropeUniforms.uTime.value = frame.time;
		ropeUniforms.uBoat.value.copy(frame.boat);
		ropeUniforms.uFrom.value.copy(from);
		ropeUniforms.uCrest.value = crest;
		ropeUniforms.uLight.value.copy(frame.boat).addScaledVector(frame.light, 2600);
		const heartHigh = crestHigh(0, crest, frame.boat);
		// (Drawn back as the heart falls, before what is left of the crest has passed the boat.)
		const letGo = 1 - THREE.MathUtils.smoothstep(since, HEART_GONE + 1, HEART_GONE + 4);
		for (let who = 0; who < 14; who++) {
			ropeUniforms.uSeats.value[who]!.copy(seatOf(who, frame.boat, ahead, across));
			ropeUniforms.uTints.value[who]!.copy(who === STRONGEST_MIND ? WHITE : who === LIGHT_BEARER ? HER_LIGHT : who === TSUNAMI_ROGUE ? EMBER : frame.tints[THIRD_OF[who]!]!);
			const work = ropeUniforms.uWork.value[who]!;
			const ends = ropeUniforms.uEnds.value[who]!;
			if (who === LIGHT_BEARER) work.set(0, 0, 0, tsunamiLight(since) > 0.001 ? 1.05 * Math.min(1, THREE.MathUtils.smoothstep(since, 4, 14), tsunamiLight(since) * 3) : 0);
			else if (who === TSUNAMI_ROGUE) {
				work.set(0, 0, heartHigh, THREE.MathUtils.clamp(since / 3, 0, 1) * letGo);
				ends.set(heartHigh, heartHigh);
			} else {
				const k = PARTS.findIndex((part) => part.who === who);
				const part = PARTS[k]!;
				// When her part is gone she turns her rope along the crest to the heart.
				const turned = k === HEART_PART ? 0 : THREE.MathUtils.smoothstep(since, part.gone, part.gone + 5);
				const toHeart = THREE.MathUtils.clamp(part.middle * 0.06, -350, 350);
				const x = THREE.MathUtils.lerp(part.middle, toHeart, turned);
				const half = THREE.MathUtils.lerp(0.9 * part.half, 0.4 * HEART, turned);
				work.set(x, half, crestHigh(x, crest, frame.boat), THREE.MathUtils.clamp((since - part.joins) / 2.5, 0, 1) * letGo);
				ends.set(crestHigh(x - half, crest, frame.boat), crestHigh(x + half, crest, frame.boat));
			}
		}
		ropeUniforms.uDay.value = frame.day;
		ropeUniforms.uGain.value = frame.gain;
		ropeUniforms.uResolution.value.set(window.innerWidth, window.innerHeight).multiplyScalar(pixelRatio.value);

		// The spurts, and the flows they become.
		spurtUniforms.uTime.value = frame.time;
		spurtUniforms.uSince.value = since;
		spurtUniforms.uBoat.value.copy(frame.boat);
		spurtUniforms.uFrom.value.copy(from);
		spurtUniforms.uOmega.value = omega;
		spurtUniforms.uWind.value.copy(frame.wind);
		PARTS.forEach((part, k) => spurtUniforms.uHigh.value[k]!.set(crestHigh(part.middle, crest, frame.boat), heartHigh));
		spurtUniforms.uDay.value = frame.day;
		spurtUniforms.uGain.value = frame.gain;
		spurtUniforms.uAir.value.copy(frame.air);
		spurtUniforms.uGold.value.copy(frame.gold);
		spurtUniforms.uSpray.value.copy(WHITE).lerp(frame.water, 0.35);
		spurtUniforms.uResolution.value.copy(ropeUniforms.uResolution.value);

		const blending = frame.day > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending;
		(ropes.material as THREE.ShaderMaterial).blending = blending;
		(spurts.material as THREE.ShaderMaterial).blending = blending;
		(spray.material as THREE.ShaderMaterial).blending = blending;
		ropes.visible = true;
		spurts.visible = since < HEART_GONE + 60;
		spray.visible = spurts.visible;
		flames.visible = spurts.visible;
		told = [
			`${Math.round(since)} s · the wave ${Math.round(crest)} m off, ${Math.round(raised)} m high where unbroken · Manulani's light ${Math.round(tsunamiLight(since) * 100)}% · the rogue: ${NAMES[TSUNAMI_ROGUE]}`,
			...PARTS.map((part, k) => `${NAMES[part.who]}: ${Math.round(part.from)} to ${Math.round(part.to)} m, ${Math.round(now[k]!.left * 100)}% left${since > part.gone && k !== HEART_PART ? ", on the heart" : ""}`),
		];
	};

	const describe = () => told;

	const dispose = () => {
		for (const mesh of [ropes, spurts, spray, flames]) {
			scene.remove(mesh);
			(mesh.material as THREE.Material).dispose();
		}
		ropeGeometry.dispose();
		spurtGeometry.dispose();
		sprayGeometry.dispose();
		flameGeometry.dispose();
		quad.dispose();
	};

	return { update, describe, dispose };
}
