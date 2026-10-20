// The storm for the five (the owner, 19 October: "The storm must honour the death of a family of
// five that arrived over this precise spot on the ocean. Create a storm of great will and pain;
// allow every surge of waves to speak their names in terms of its intensity"). Set by "five" in
// storm.json, while the storm is on; ?five shows it from the moment the page opens, ?five=40 forty
// seconds in, ?five=off without it.
//
// The place is where the boat is: they came here. It is kept 650 m ahead, where the wave stands.
//
// Will is a storm held. Peta's storm was anger, and its weaves thrashed and turned; this one is
// held in its place by fourteen at once, and what shows is the holding: every rope taut and
// steady under a load, quivering only with the real wind's gusts, never let go. Pain is what the
// holding costs: on each beat of a name they all draw together, as one (will), and as the name
// ends they bow under it, the ropes sinking low towards the sea and their colour cooling towards
// a bruised dusk; after the fifth name they bow lowest and hold there through the silence, and
// then lift again and begin the names once more. The ache grows through the hours and never goes.
//
// The sea speaks the names (namesSea in channelled-storm.ts): each name a group of swells, one to
// each beat of it, and at the stressed beat the twelve's trains meet at the place and stand up some
// 40 m (Peta's wave, the same focusing; layPetasWave in wrath.ts). Each in their part, grounded in
// what the sea and air do:
//   the strongest   keeps the place: a great white rope out low over the sea and down into the
//                   water at the place itself, riding the wave up when it stands there;
//   Siuan's four    lay the trains: each a long rope out along the sea, far past the place on her
//                   own heading, its far end under the water; the swell runs in along it, and on
//                   each beat she draws it in;
//   Leane's four    hold the wind off the place: each a long bowed arch up from the rail, over the
//                   place at her own height and down to the sea beyond it, upwind; the gale bows it
//                   back and she draws it up into the wind again on each beat (the eye of a storm
//                   is its calm; she makes one over them);
//   Moiraine's four hold the cloud up over the place: each climbs to the cloud base over it and
//                   spreads there, wide and slow, as a palm laid flat under a weight;
//   Manulani        at night, her sphere (wrath.ts), so that the place is never in the dark.
// Every line one curve, staggered, nothing in rows, no point where all meet: each ends a little
// apart from the others round the place.
import * as THREE from "three";
import type { GodsBreath } from "./channelled-storm";
import { manulaniSphere, CORE_AHEAD, MANULANI } from "./wrath";
import { giveMinds, mindChunk, type Minds } from "./psyche";
import { pixelRatio, ribbonShaderChunk, stripIndices, tameShaderChunk, unplaced, WEAVE_RENDER_ORDER } from "./weave";

const SEGMENTS = 120;
// Filaments to a measure; the four mighty carry 2.5 measures, the strongest about 4.9, Manulani
// about 5.1 (by the cube root of their strength, as MIGHT in channellers.ts).
const FIBRES = 64;
const SLOTS = [0, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const THIRDS = [0, 1, 0, 1, 2, 2, 1, 0, 2, 1, 0, 2];
const MEMBERS = THIRDS.map((third, i) => THIRDS.slice(0, i).filter((other) => other === third).length);
const MIGHTY = [0, 1, 2, 5];
const STRONGEST = 12;
const MANULANI_AT = 13;
const MANULANI_MEASURES = 4.9 * Math.cbrt(MANULANI);
// How eager each is to take hold (AES_SEDAI's eager, in SLOTS' order).
const EAGER = [0.55, 0.8, 0.4, 0.8, 0.45, 0.35, 0.75, 0.45, 0.35, 0.75, 0.35, 0.45];

const vertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute float aWho;
attribute vec4 aSeed;
uniform float uTime;
uniform vec3 uBoat;
uniform vec2 uAhead;
uniform vec3 uWindDir;
uniform vec3 uPlace;
uniform float uCloud;
uniform float uGust;
uniform float uDay;
// Faded in from well before the eye: close by, a rope is a broad band across the view, and by day,
// laid as colour on a pale sea, many of them together crossed the foreground in pale bands; so by
// day they come in from further off (the ancestors' strands further still).
float nearFade( float d, bool own ) {
	if ( ! own ) return smoothstep( mix( 80.0, 160.0, uDay ), mix( 400.0, 650.0, uDay ), d );
	// (The five's ropes run low over the sea all the way out to the place, so from the boat they
	// fan across the whole foreground: by day they come in from further off still, out of the
	// spray, and are seen where they gather at the place.)
	return smoothstep( mix( 50.0, 260.0, uDay ), mix( 180.0, 850.0, uDay ), d );
}
// How far the quiver has run (integrated, so it can slow without a jump); 0..1 how far they bow
// under the name just spoken (lowest in the silence after the fifth).
uniform float uFlow;
uniform float uBow;
// For each of the fourteen (the strongest, then Manulani, last): her ache (0..1, growing), her draw
// on this beat (0..1), how far her rope has gone out (0..1).
uniform vec4 uState[ 14 ];
// 0..1 how far it is drawn at all (in the storm for both, it gives way to Peta's: wrath.ts).
uniform float uPresence;
uniform vec3 uSphere;
// Where each of the twelve's ropes ends (on the sea as it is there, or at the cloud base).
uniform vec3 uEnd[ 12 ];
uniform vec3 uTints[ 3 ];
uniform float uWhiteMesh;
uniform float uSheathPass;
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;
${ribbonShaderChunk}
${tameShaderChunk}
${mindChunk}
const float THIRD_OF[ 14 ] = float[ 14 ]( ${THIRDS.map((x) => `${x}.0`).join(", ")}, 3.0, 4.0 );
const float MEMBER_OF[ 14 ] = float[ 14 ]( ${MEMBERS.map((x) => `${x}.0`).join(", ")}, 0.0, 0.0 );
const float SEAT_OF[ 14 ] = float[ 14 ]( ${SLOTS.map((x) => `${x}.0`).join(", ")}, 2.0, 13.0 );
// Pain's colour: a bruised dusk, cooler than any of theirs.
const vec3 BRUISE = vec3( 0.36, 0.34, 0.62 );

vec3 aheadDir() { return vec3( uAhead.x, 0.0, uAhead.y ); }
vec3 acrossDir() { return vec3( - uAhead.y, 0.0, uAhead.x ); }
vec3 seatAt( float who ) {
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
vec3 flat3( vec3 v ) { return normalize( vec3( v.x, 0.0, v.z ) + vec3( 1e-4 ) ); }

// The strongest's: out low over the sea, and down into the water at the place.
vec3 strongestRope( float t, float draw ) {
	vec3 seat = seatAt( 2.0 );
	vec3 toward = flat3( uPlace - seat );
	vec3 into = uPlace - vec3( 0.0, 26.0, 0.0 );
	return bezier( seat, seat + vec3( 0.0, 10.0 + 8.0 * draw, 0.0 ) + toward * 120.0 + acrossDir() * 30.0, uPlace + vec3( 0.0, 34.0 * ( 1.0 - 0.6 * uBow ) + 18.0 * draw, 0.0 ) - toward * 240.0, into, t );
}

// Manulani's: up from the bow to her sphere, in one long curve.
vec3 manulaniRope( float t ) {
	vec3 seat = seatAt( 13.0 );
	return bezier( seat, seat + vec3( 0.0, 400.0, 0.0 ) + aheadDir() * 60.0, uSphere - vec3( 0.0, 1800.0, 0.0 ) - aheadDir() * 500.0, uSphere, t );
}

// Siuan's: out along the sea, past the place on her own heading, the far end under the water.
vec3 siuanRope( float who, float t, float draw ) {
	vec3 seat = seatAt( SEAT_OF[ int( who ) ] );
	vec3 end = uEnd[ int( who ) ];
	vec3 toward = flat3( end - seat );
	float d = length( ( end - seat ).xz );
	// (Drawn in a little on each beat: the far end lifts towards the surface.)
	vec3 far = end - vec3( 0.0, 14.0 * ( 1.0 - draw ), 0.0 );
	vec3 p = bezier( seat, seat + toward * d * 0.25 + vec3( 0.0, 12.0 + 10.0 * draw - 8.0 * uBow, 0.0 ), far - toward * d * 0.35 + vec3( 0.0, 18.0 * ( 1.0 - uBow ), 0.0 ) + acrossDir() * 60.0 * ( MEMBER_OF[ int( who ) ] - 1.5 ), far, t );
	return p;
}

// Leane's: a long bowed arch up from the rail, over the place at her own height, and down to the
// sea beyond it, bowed back by the gale and drawn up into it on each beat.
vec3 leaneRope( float who, float t, float draw ) {
	vec3 seat = seatAt( SEAT_OF[ int( who ) ] );
	vec3 end = uEnd[ int( who ) ];
	float member = MEMBER_OF[ int( who ) ];
	// (Low enough that the whole arch is in view; each her own height and her own crown, so that
	// the four never stand in a row.)
	float h = ( 70.0 + 38.0 * member + 30.0 * fract( member * 0.618 + 0.3 ) ) * ( 1.0 - 0.35 * uBow ) * ( 0.92 + 0.08 * draw );
	vec3 over = uPlace + vec3( 0.0, h, 0.0 ) + acrossDir() * ( member - 1.5 ) * 150.0 + aheadDir() * ( fract( member * 0.618 ) - 0.5 ) * 200.0;
	vec3 p = bezier( seat, seat + vec3( 0.0, h * 0.7, 0.0 ) + flat3( over - seat ) * 220.0, over + flat3( end - over ) * 320.0 + vec3( 0.0, h * 0.35, 0.0 ), end, t );
	// The load: the gale bows the arch downwind, most at its crown, less as she draws it up; and it
	// swings wide to one side and back, never a straight fall.
	float crown = sin( 3.14159 * t );
	float load = crown * ( 45.0 + 40.0 * uGust ) * ( 1.0 - 0.45 * draw );
	return p + uWindDir * load + acrossDir() * crown * crown * ( member - 1.5 + 0.4 ) * 90.0;
}

// Moiraine's: up to the cloud base over the place, and spread out wide along it.
vec3 moiraineRope( float who, float t, float draw ) {
	vec3 seat = seatAt( SEAT_OF[ int( who ) ] );
	vec3 top = uEnd[ int( who ) ];
	vec3 toward = flat3( top - seat );
	if ( t < 0.55 ) return bezier( seat, seat + vec3( 0.0, 140.0, 0.0 ) + toward * 90.0, top - vec3( 0.0, 280.0 - 50.0 * draw, 0.0 ) - toward * 160.0, top, t / 0.55 );
	float s = ( t - 0.55 ) / 0.45;
	vec2 out2 = top.xz - uPlace.xz;
	float a = atan( out2.y, out2.x ) + ( aSeed.z - 0.5 ) * 2.4;
	// (Pressed down a little under the weight as they bow; lifted on each beat.)
	return top + vec3( cos( a ), 0.0, sin( a ) ) * ( 900.0 * s ) + vec3( 0.0, - ( 60.0 + 120.0 * uBow ) * s * s + 25.0 * draw * s, 0.0 );
}

vec3 placeOwn( float who, float t ) {
	vec4 st = uState[ int( who ) ];
	if ( who > 12.5 ) return manulaniRope( t );
	if ( who > 11.5 ) return strongestRope( t, st.y );
	float third = THIRD_OF[ int( who ) ];
	if ( third < 0.5 ) return siuanRope( who, t, st.y );
	if ( third < 1.5 ) return leaneRope( who, t, st.y );
	return moiraineRope( who, t, st.y );
}

vec3 placeAt( float t ) { return placeOwn( aWho, t ); }

void main() {
	vec4 st = uState[ int( aWho ) ];
	float ache = st.x;
	float draw = st.y;
	float third = THIRD_OF[ int( aWho ) ];
	vec3 here = placeAt( aT );
	vec3 next = placeAt( min( aT + 0.01, 1.0 ) ) + ( aT >= 0.99 ? here - placeAt( aT - 0.01 ) : vec3( 0.0 ) );
	// Part of the rope of one who tends goes out from her hands to lie beside the rope of the one
	// she tends (psyche.ts).
	bool ownRope = true;
	// (Lying along the rope of one being stilled, it goes with hers when the cut runs out.)
	float alongside = 1.0;
	if ( ownRope && tending( aWho, aSeed.x ) ) {
		float other = uTendTo[ int( aWho ) ];
		float k = 0.92 * smoothstep( 0.04, 0.4, aT );
		alongside = lawShown( other, aT );
		here = mix( here, placeOwn( other, aT ) + vec3( 0.0, 3.0, 0.0 ), k );
		next = mix( next, placeOwn( other, min( aT + 0.01, 1.0 ) ) + vec3( 0.0, 3.0, 0.0 ), k );
	}
	// Each filament about the line: a hawser's girth, drawn tight on each beat, loosening as they
	// bow and as the ache grows (the strands begin to part).
	vec3 n1 = normalize( cross( next - here + vec3( 1e-5 ), vec3( 0.0, 1.0, 0.0 ) ) + vec3( 1e-4 ) );
	float girth = aWho > 11.5 ? 3.5 : 7.0;
	float spread = ( 0.4 + girth * sin( 3.14159 * aT ) ) * sqrt( aSeed.z ) * ( 1.0 - 0.35 * draw ) * ( 1.0 + 0.35 * uBow + 0.3 * ache );
	// (Barely twisted: ropes that run away from the eye, twisted, read end-on as hoops.)
	float turn = aSeed.y * 6.28318 + aT * 2.0 + uFlow * 0.2 * ( aSeed.x - 0.5 );
	vec3 off = ( n1 * cos( turn ) + vec3( 0.0, sin( turn ), 0.0 ) ) * spread;
	// The quiver under the load: slow and small, the real wind's gusts in it. Never a thrash.
	off += n1 * sin( aT * 7.0 - uFlow + aSeed.x * 3.0 ) * ( 1.5 + 4.0 * uGust ) * sin( 3.14159 * aT );
	// Her state of mind in the line itself: taut and trembling, or slack (psyche.ts).
	if ( ownRope ) off += mindBend( aWho, aT, n1, aSeed.x );
	here += off;
	next += off;
	// Grown out from the hands.
	float grow = st.z * 1.1 - 0.1 * aSeed.w;
	float shown = smoothstep( grow, grow - 0.04, aT );
	// Fullest on each beat; laid on unevenly along its length, as a brush lays colour; never dark
	// in a bow (they hold).
	shown *= mix( 0.65 + 0.5 * draw, 0.7, uBow ) * ( 0.55 + 0.45 * smoothstep( - 0.6, 0.6, sin( aT * 6.0 + aSeed.y * 6.0 ) + 0.5 * sin( aT * 15.0 + 2.0 ) ) );
	shown *= smoothstep( 1.0, 0.9, aT ) * nearFade( length( here - cameraPosition ), true );
	vAlpha = shown * uPresence * mindShown( aWho, aT ) * lawShown( aWho, aT ) * alongside;
	// Tamed to the background's colour, cooling towards the bruise as they bow and as the ache grows.
	// (The strongest's white; Manulani's the colour of her light.)
	if ( aWho > 12.5 ) vTint = vec3( 1.0, 0.88, 0.66 );
	else if ( aWho > 11.5 ) vTint = vec3( 1.0 );
	else vTint = mindTint( aWho, tame( mix( uTints[ int( third + 0.5 ) ], BRUISE, 0.25 * ache + 0.35 * uBow ), 0.24 + 0.08 * draw ) );
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
		// By day, under the white, a soft sheath of the site's deep blue (never white on white).
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

export interface FiveFrame {
	// The fourteen's minds (psyche.ts).
	minds?: Minds;
	time: number;
	delta: number;
	// Seconds since it began.
	since: number;
	camera: THREE.Camera;
	// The sea speaking the names (namesSea).
	breath: GodsBreath;
	boat: THREE.Vector3;
	ahead: THREE.Vector2;
	wind: THREE.Vector3;
	// 0..1 how much of a gust is blowing.
	gust: number;
	seaAt: (x: number, z: number) => number;
	cloud: number;
	day: number;
	gain: number;
	white: number;
	sheath: THREE.Color;
	tints: THREE.Color[];
	bg: THREE.Color;
	// Whether this is the silence after the last name.
	silent: boolean;
	// 0..1 how far it is drawn (1 unless given).
	presence?: number;
}

function fiveLines(lines: number[]) {
	const vertices = lines.length * (SEGMENTS + 1) * 2;
	const along = new Float32Array(vertices);
	const side = new Float32Array(vertices);
	const who = new Float32Array(vertices);
	const seeds = new Float32Array(vertices * 4);
	lines.forEach((one, l) => {
		const own = [Math.random(), Math.random(), Math.random(), Math.random()];
		for (let i = 0; i <= SEGMENTS; i++) {
			for (let edge = 0; edge < 2; edge++) {
				const v = (l * (SEGMENTS + 1) + i) * 2 + edge;
				along[v] = i / SEGMENTS;
				side[v] = edge ? 1 : -1;
				who[v] = one;
				seeds.set(own, v * 4);
			}
		}
	});
	const geometry = unplaced(new THREE.BufferGeometry());
	geometry.setAttribute("aT", new THREE.BufferAttribute(along, 1));
	geometry.setAttribute("aSide", new THREE.BufferAttribute(side, 1));
	geometry.setAttribute("aWho", new THREE.BufferAttribute(who, 1));
	geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
	geometry.setIndex(stripIndices(lines.length, SEGMENTS));
	return geometry;
}

export function createFive(scene: THREE.Scene, layer: number) {
	const twelve: number[] = [];
	SLOTS.forEach((_, i) => {
		for (let f = 0; f < Math.round(FIBRES * (MIGHTY.includes(i) ? 2.5 : 1)); f++) twelve.push(i);
	});
	const strongest: number[] = [];
	for (let f = 0; f < Math.round(FIBRES * 4.9); f++) strongest.push(STRONGEST);
	for (let f = 0; f < Math.round(FIBRES * MANULANI_MEASURES); f++) strongest.push(MANULANI_AT);

	const shared = {
		uTime: { value: 0 },
		uBoat: { value: new THREE.Vector3() },
		uAhead: { value: new THREE.Vector2(0, -1) },
		uWindDir: { value: new THREE.Vector3(1, 0, 0) },
		uPlace: { value: new THREE.Vector3() },
		uCloud: { value: 900 },
		uGust: { value: 0 },
		uFlow: { value: 0 },
		uBow: { value: 0 },
		uPresence: { value: 1 },
		uMind: { value: Array.from({ length: 14 }, () => new THREE.Vector4()) },
		uMindFlow: { value: new Array<number>(14).fill(0) },
		uTendTo: { value: new Array<number>(14).fill(-1) },
		uLaw: { value: new Array<number>(14).fill(-0.05) },
		uState: { value: Array.from({ length: 14 }, () => new THREE.Vector4()) },
		uSphere: { value: new THREE.Vector3() },
		uEnd: { value: Array.from({ length: 12 }, () => new THREE.Vector3()) },
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
	const twelveGeometry = fiveLines(twelve);
	const strongestGeometry = fiveLines(strongest);
	const twelveMesh = meshOf(twelveGeometry, 0, 0, 0.12);
	const strongestMesh = meshOf(strongestGeometry, 1, 0, 0.05);
	const strongestSheath = meshOf(strongestGeometry, 1, 1, 1);
	const meshes = [twelveMesh, strongestMesh, strongestSheath];

	// When each takes hold: the strongest first and alone, Manulani with them, then the eager.
	const courses = [...EAGER, 1, 0.9].map((eager, i) => ({
		begins: i === STRONGEST ? 0 : i === MANULANI_AT ? 6 : 10 + 24 * (1 - eager) + 5 * Math.random(),
	}));
	// Where each of the twelve's ropes ends, about the place (bearing from the boat, metres out, and
	// for Moiraine's, how far round the place at the cloud base). Staggered: no two alike.
	const ends = SLOTS.map((_, i) => {
		const m = MEMBERS[i]!;
		const third = THIRDS[i]!;
		const jitter = Math.sin((i + 1) * 12.9898) * 0.5;
		if (third === 0) return { a: (m - 1.5) * 0.48 + 0.1 * jitter, d: 1100 + 900 * ((m * 0.618 + 0.2) % 1) };
		if (third === 1) return { a: (m - 1.5) * 0.4 + 0.1 * jitter, d: 900 + 600 * ((m * 0.618 + 0.55) % 1) };
		return { a: (m - 1.5) * 0.5 + 0.1 * jitter, d: CORE_AHEAD + 120 * jitter };
	});
	let flow = 0;
	let bow = 0;
	const across = new THREE.Vector2();
	// The wind blowing to, flat, for where Leane's arches come down (upwind of the place).
	const upwind = new THREE.Vector2();

	const update = (frame: FiveFrame | undefined) => {
		for (const mesh of meshes) mesh.visible = !!frame;
		if (!frame) return;
		strongestSheath.visible = frame.day > 0.3;
		const dt = Math.min(frame.delta, 0.1);
		giveMinds(shared, frame.minds);
		const b = frame.breath;
		// They bow as each name ends and through the breath before the next; lowest in the silence.
		const bowTo = frame.silent ? 0.5 + 0.5 * b.held : 0.75 * b.held;
		bow += (bowTo - bow) * (1 - Math.exp(-dt / 2.5));
		// (The ache grows over the first hours and stays.)
		const ache = Math.min(1, 0.3 + frame.since / 14_400);
		courses.forEach((course, i) => {
			const into = frame.since - course.begins;
			const grow = THREE.MathUtils.smoothstep(into, 0, 14);
			// On each beat all draw together, as one: the draw rises with the swell's crest and its height.
			const draw = i === MANULANI_AT ? 0 : Math.max(0, Math.sin(Math.PI * b.phase)) ** 2 * b.depth * (1 - b.held);
			shared.uState.value[i]!.set(ache, draw * grow, grow, 0);
		});
		flow += dt * (0.6 + 0.6 * frame.gust);
		shared.uFlow.value = flow;
		shared.uBow.value = bow;
		shared.uPresence.value = frame.presence ?? 1;
		const ahead = frame.ahead;
		across.set(-ahead.y, ahead.x);
		const place = shared.uPlace.value.set(frame.boat.x + ahead.x * CORE_AHEAD, 0, frame.boat.z + ahead.y * CORE_AHEAD);
		place.y = frame.seaAt(place.x, place.z);
		upwind.set(-frame.wind.x, -frame.wind.z);
		if (upwind.lengthSq() > 1e-6) upwind.normalize();
		ends.forEach(({ a, d }, i) => {
			const third = THIRDS[i]!;
			const out = shared.uEnd.value[i]!;
			if (third === 2) {
				// Round the place at the cloud base.
				out.set(place.x + Math.cos(a * 3 + 1) * 160, frame.cloud * 0.8, place.z + Math.sin(a * 3 + 1) * 160);
				return;
			}
			let x = frame.boat.x + (ahead.x * Math.cos(a) + across.x * Math.sin(a)) * d;
			let z = frame.boat.z + (ahead.y * Math.cos(a) + across.y * Math.sin(a)) * d;
			// Leane's come down beyond the place on its upwind side, where the wind is held off.
			if (third === 1) {
				x += upwind.x * 260;
				z += upwind.y * 260;
			}
			out.set(x, frame.seaAt(x, z), z);
		});
		manulaniSphere(frame.boat, ahead, shared.uSphere.value);
		shared.uCloud.value = frame.cloud;
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
		strongestGeometry.dispose();
	};

	return { update, dispose };
}
