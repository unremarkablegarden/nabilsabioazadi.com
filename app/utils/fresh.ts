// The freshening, and the sea breathing (the owner, 4 November 2026: "I need all the channellers to
// focus on something important immediately. They need to create freshwater around the boat by
// desalinating it using all of the elements to do so. It will make the water around the boat seem
// dappled. To help the other channellers work, one of the strongest — me — will create a light in the
// sky using a single, tight weave of akasha, air and fire that looks almost blue-violet but is
// ultimately almost white. While they do this, for the first time, we will see the ocean 'breathe'.
// This means that we will see their collective engagement with the One Power create waves that
// emanate from the boat. The night sky will be lit up but not quite like day time. It will be like a
// torch that only shines light on 300m radius around the boat.")
//
// Everyone drops what she is doing at once (their everyday weaves fade out over the three seconds
// they take to turn, as for the rogue's wave). The strongest is first, and makes the light the rest
// will work by: one rope from their hands up into a small point of light hung in the sky ahead, a
// single weave of three strands wound tight about one another, akasha, air and fire, the fire so hot
// that it burns as the hottest stars do, blue-white; so the whole is almost blue-violet, and at its
// heart almost white. Its light is shaped as a torch's beam is: it falls only on the sea within 300 m
// of the boat, its edge soft, and beyond it the sea is night. It lights the air it passes through as
// a beam does in a little haze, brightest looking into it, so the night sky over the boat is lit, but
// not as by day, and the sky beyond the beam is dark.
//
// The rest each take a place in the water round the boat, by her own side of it, the mightiest
// nearest ahead, and send a rope out low over the sea to it and down into it, its filaments all of the
// elements: water to draw the salt out, earth to take it and let it down, fire to warm what is drawn,
// air to lift it as vapour and lay it back fresh, akasha to bind it all. Steam rises off each place
// in soft puffs and drifts downwind, lit by the strongest's light. The fresh water spreads from each
// place and runs together over minutes, but is not mixed in: it lies on the salt in bodies of its
// own, so the sea about the boat is dappled (gerstner-waves.ts, sweet).
//
// They pull as one, in time with the real swell under the boat, and for the first time the sea
// breathes: rings of swell running out from the boat, rising as more of them join (breathRing in
// gerstner-waves.ts). Nothing jagged: every rope one continuous curve.
import * as THREE from "three";
import { lines } from "./embroidery";
import { FRESH_PLACES, FRESH_RADIUS, type GerstnerUniforms } from "./gerstner-waves";
import { NAMES, ropeMight, STRONGEST_MIND, TEMPERS } from "./psyche";
import { seatOf } from "./treason";
import { filmLook, filmShaderChunk, pixelRatio, ribbonShaderChunk, WEAVE_RELAX, WEAVE_RENDER_ORDER } from "./weave";

// Each visitor sees them turn to it this long after they come (s).
export const FRESH_AFTER = 6;
// How far all of them are taken up with it (0..1): everything else let go at once, and not taken up
// again while it lasts.
export const freshBusy = (since: number) => THREE.MathUtils.smoothstep(since, 0.3, 3);
// How far the strongest's light is lit (0..1): it is the first thing done, for the others to work by.
export const freshLight = (since: number) => THREE.MathUtils.smoothstep(since, 2, 10);
// Where the light hangs: this far ahead (m), a little to the right (radians), and this high (m). It is
// in the view, some twenty degrees up; its beam is shaped to the circle round the boat.
const LIGHT_AHEAD = 470;
const LIGHT_RIGHT = 0.2;
const LIGHT_UP = 150;
// How bright it is on the sea at the boat, before tone mapping (Manulani's near-noon is 0.9 straight
// beneath it, so this is well short of day), and how much of it the air gives back.
const TORCH_BRIGHT = 0.5;
const AIR_GLOW = 15;
// The sea's breathing: when it begins (s), how long it takes to rise to its full as they join, and how
// high it is at the boat then (m).
const BREATH_FROM = 8;
const BREATH_RISE = 26;
const BREATH_HIGH = 1.6;

// Who works where: everyone but the strongest, each on her own side of the boat, the mightiest nearest
// ahead; Manulani, at the bow, straight ahead. Bearings off ahead (radians, + to the right) and
// distances (m); and how far her fresh water spreads (m).
const sideOf = (who: number) => Math.sign(seatOf(who, new THREE.Vector3(), new THREE.Vector3(0, 0, -1), new THREE.Vector3(1, 0, 0)).x);
const WORKERS = [...Array(14).keys()].filter((who) => who !== STRONGEST_MIND);
const byMight = (a: number, b: number) => ropeMight(b) - ropeMight(a);
const PLACES = WORKERS.map((who) => {
	const side = sideOf(who);
	const row = WORKERS.filter((other) => sideOf(other) === side).sort(byMight);
	const k = row.indexOf(who);
	const bearing = side === 0 ? 0 : side * THREE.MathUtils.degToRad(8 + 102 * ((k + 0.5) / row.length) ** 1.3);
	const size = Math.cbrt(ropeMight(who) / ropeMight(STRONGEST_MIND));
	const temper = TEMPERS[who]!;
	const joins = 4 + 6 * (1 - temper.eager);
	return {
		who,
		bearing,
		far: side === 0 ? 200 : 80 + 160 * ((0.37 + who * 0.618) % 1),
		spread: 30 + 40 * size,
		size,
		joins,
		lands: joins + 2.5,
	};
});
if (PLACES.length !== FRESH_PLACES) throw new Error(`the freshening has ${PLACES.length} places, the sea ${FRESH_PLACES}`);

const FILAMENTS = 18;
const SEGMENTS = 72;
// The strongest's rope: its filaments, and enough segments along it for its tight twist.
const LIGHT_FILAMENTS = 150;
const LIGHT_SEGMENTS = 240;
// The steam off each place.
const PUFFS = 24;

const ropeVertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute vec2 aCell;
attribute vec4 aSeed;
uniform float uTime;
uniform vec3 uSeats[ ${FRESH_PLACES} ];
// For each: where her rope goes into the sea (x, z), how far out it is cast (0..1), and her size.
uniform vec4 uWork[ ${FRESH_PLACES} ];
uniform vec3 uElements[ 5 ];
uniform float uPull;
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
// Out low over the sea from her hands, and down into it at her place.
vec3 ropeAt( int who, float t ) {
	vec3 seat = uSeats[ who ];
	vec4 work = uWork[ who ];
	vec3 place = vec3( work.x, 0.0, work.y );
	vec3 out_ = place - seat;
	float far = length( out_.xz );
	vec3 towards = normalize( vec3( out_.x, 0.0, out_.z ) + vec3( 1e-4 ) );
	// (Drawn from twelve metres out: a rope passing by the eye is stretched across the whole picture.)
	vec3 hands = seat + towards * 8.0 + vec3( 0.0, 0.3, 0.0 );
	vec3 low = vec3( 0.0, 2.5 - hands.y, 0.0 );
	return bezier( hands, hands + towards * 0.3 * far + low * 0.6, place - towards * 0.35 * far + vec3( 0.0, 2.5 + 0.01 * far, 0.0 ), place + towards * 15.0 + vec3( 0.0, - 5.0, 0.0 ), t );
}

void main() {
	int who = int( aCell.x + 0.5 );
	vec4 work = uWork[ who ];
	vec3 here = ropeAt( who, aT );
	vec3 next = ropeAt( who, min( aT + 0.014, 1.0 ) ) + ( aT >= 0.986 ? here - ropeAt( who, aT - 0.014 ) : vec3( 0.0 ) );
	vec3 dir = normalize( next - here + vec3( 1e-5 ) );
	vec3 n1 = normalize( cross( dir, vec3( 0.0, 1.0, 0.0 ) ) + vec3( 1e-4 ) );
	vec3 n2 = normalize( cross( n1, dir ) );
	// A hawser's girth, swelling a little with each of their pulls, and opening at its end as it goes
	// into the water, as a root does into the ground.
	float girth = ( 0.3 + work.w * ( 0.25 + 0.7 * aT * aT ) * ( 0.9 + 0.2 * uPull ) ) * sqrt( aSeed.z ) + 2.5 * work.w * smoothstep( 0.85, 1.0, aT ) * aSeed.z;
	float turn = aSeed.y * 6.28318 + aT * 8.0 + uTime * 0.1;
	vec3 off = ( n1 * cos( turn ) + n2 * sin( turn ) ) * girth;
	here += off;
	next += off;
	// Cast out from her hands.
	float shown = smoothstep( work.z, work.z - 0.04, aT );
	float far = length( here - cameraPosition );
	vAlpha = shown * smoothstep( 8.0, 25.0, far ) * exp( - far / 6000.0 ) * ( 0.85 + 0.3 * uPull );
	vEdge = aSide;
	vSky = againstSky( here );
	// All of the elements in every rope: water to draw the salt out, earth to take it down, fire to warm
	// it, air to lift it, akasha to bind it.
	float e = aSeed.w;
	vTint = e < 0.34 ? uElements[ 0 ] : e < 0.52 ? uElements[ 1 ] : e < 0.68 ? uElements[ 2 ] : e < 0.84 ? uElements[ 3 ] : uElements[ 4 ];
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
	gl_FragColor = vec4( mix( tint * uGain, tint * max( 1.2, uGain * mix( 0.8, 1.5, vSky ) ), uDay ), body * vAlpha * 0.035 * mix( 1.0, 3.0, uDay ) );
	gl_FragColor.a *= ${WEAVE_RELAX.toFixed(3)};
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

// The strongest's rope: one weave, three strands wound tight about one another and about its line.
const lightVertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute vec2 aCell;
attribute vec4 aSeed;
uniform float uTime;
uniform vec3 uHands;
uniform vec3 uLight;
uniform float uCast;
uniform float uDay;
varying float vAlpha;
varying float vEdge;
varying float vStrand;
varying float vCore;
${ribbonShaderChunk}

vec3 bezier( vec3 a, vec3 b, vec3 c, vec3 d, float t ) {
	float s = 1.0 - t;
	return s * s * s * a + 3.0 * s * s * t * b + 3.0 * s * t * t * c + t * t * t * d;
}
vec3 lineAt( float t ) {
	vec3 to = uLight - uHands;
	vec3 flat_ = normalize( vec3( to.x, 0.0, to.z ) );
	return bezier( uHands, uHands + flat_ * 130.0 + vec3( 0.0, 14.0, 0.0 ), uLight - normalize( to ) * 150.0 - vec3( 0.0, 20.0, 0.0 ), uLight, t );
}
vec3 woundAt( float t, float strand ) {
	vec3 here = lineAt( t );
	vec3 dir = normalize( lineAt( min( t + 0.004, 1.0 ) ) - lineAt( max( t - 0.004, 0.0 ) ) );
	vec3 n1 = normalize( cross( dir, vec3( 0.0, 1.0, 0.0 ) ) + vec3( 1e-4 ) );
	vec3 n2 = normalize( cross( n1, dir ) );
	// Tight: each strand a third of a turn from the next, a turn in every fifteen metres or so, and the
	// whole hardly wider than a hand's breadth or two, narrowing into the light.
	float turn = strand * 2.0944 + t * 210.0 - uTime * 0.6;
	float wound = 0.06 * ( 1.0 - 0.6 * t );
	float own = aSeed.y * 6.28318 + t * 37.0;
	float loose = 0.05 * sqrt( aSeed.z ) * ( 1.0 - 0.5 * t );
	return here + ( n1 * cos( turn ) + n2 * sin( turn ) ) * wound + ( n1 * cos( own ) + n2 * sin( own ) ) * loose;
}
void main() {
	float strand = floor( aSeed.w * 3.0 );
	vec3 here = woundAt( aT, strand );
	vec3 next = woundAt( min( aT + 0.0042, 1.0 ), strand ) + ( aT >= 0.9958 ? here - woundAt( aT - 0.0042, strand ) : vec3( 0.0 ) );
	float far = length( here - cameraPosition );
	vAlpha = smoothstep( uCast, uCast - 0.03, aT ) * smoothstep( 12.0, 40.0, far ) * ( 1.0 - smoothstep( 0.985, 1.0, aT ) );
	vEdge = aSide;
	vStrand = strand;
	vCore = 1.0 - aSeed.z;
	mat4 vp = projectionMatrix * viewMatrix;
	gl_Position = ribbonPosition( vp * vec4( here, 1.0 ), vp * vec4( next, 1.0 ), aSide, mix( 1.1, 1.4, uDay ) );
}
`;

const lightFragment = /* glsl */ `
uniform float uGain;
uniform float uDay;
varying float vAlpha;
varying float vEdge;
varying float vStrand;
varying float vCore;
void main() {
	float body = 1.0 - smoothstep( 0.7, 1.0, abs( vEdge ) );
	// Akasha, air and fire, each lifted to a blue-violet white: the akasha's gold gone pale and violet,
	// the air its lavender, the fire burning blue-white as only the hottest fire does. Its heart white.
	vec3 flank = vStrand < 0.5 ? vec3( 0.8, 0.7, 1.0 ) : vStrand < 1.5 ? vec3( 0.62, 0.58, 1.0 ) : vec3( 0.64, 0.74, 1.0 );
	vec3 tint = mix( flank, vec3( 0.97, 0.96, 1.0 ), 0.85 * smoothstep( 0.35, 1.0, vCore ) );
	gl_FragColor = vec4( tint * uGain * mix( 1.0, 1.6, uDay ), body * vAlpha * 0.06 * mix( 1.0, 2.5, uDay ) );
	gl_FragColor.a *= ${WEAVE_RELAX.toFixed(3)};
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

// The light itself: a small point, white at its heart, falling away blue-violet.
const coreVertex = /* glsl */ `
uniform vec3 uLight;
uniform float uSize;
varying vec2 vAt;
void main() {
	vAt = position.xy;
	vec4 seen = viewMatrix * vec4( uLight, 1.0 );
	seen.xy += position.xy * uSize;
	gl_Position = projectionMatrix * seen;
}
`;
const coreFragment = /* glsl */ `
uniform float uBright;
uniform float uTwinkle;
varying vec2 vAt;
void main() {
	float d = length( vAt );
	float heart = exp( - d * d * 60.0 );
	float halo = exp( - d * 7.0 ) * ( 1.0 - smoothstep( 0.8, 1.0, d ) );
	vec3 c = vec3( 0.97, 0.96, 1.0 ) * heart * 6.0 + vec3( 0.52, 0.47, 1.0 ) * halo * ( 0.9 + 0.1 * uTwinkle );
	gl_FragColor = vec4( c * uBright, 1.0 );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

// The beam in the air: what the haze about the boat gives back of the light, worked out along each
// line of sight (single scattering, for a point of light in a thin even haze). The beam is the cone
// from the light to the circle on the sea round the boat; nothing above the light is lit, for a torch
// shines down. Along a line of sight the light falls as one over the square of its distance, so it is
// summed in equal steps of the angle at the light, where that is even. More looking into it (the haze
// over the sea scatters forward). Drawn in the water's mirror too: there the line starts at the water.
const airVertex = /* glsl */ `
varying vec3 vWorld;
void main() {
	vec4 world = modelMatrix * vec4( position, 1.0 );
	vWorld = world.xyz;
	gl_Position = projectionMatrix * viewMatrix * world;
}
`;
const airFragment = /* glsl */ `
uniform vec3 uLight;
uniform vec4 uFoot;
uniform vec3 uTint;
uniform float uPower;
varying vec3 vWorld;
void main() {
	vec3 ro = cameraPosition;
	vec3 rd = normalize( vWorld - ro );
	float from_ = 0.0;
	float to_ = 4000.0;
	if ( ro.y < 0.0 ) {
		if ( rd.y <= 0.0 ) discard;
		from_ = - ro.y / rd.y;
	} else if ( rd.y < 0.0 ) to_ = min( to_, ro.y / - rd.y );
	float t0 = dot( uLight - ro, rd );
	float h = max( length( ro + rd * t0 - uLight ), 1.5 );
	float a = atan( ( from_ - t0 ) / h );
	float b = atan( ( to_ - t0 ) / h );
	float sum = 0.0;
	for ( int i = 0; i < 20; i ++ ) {
		float phi = mix( a, b, ( float( i ) + 0.5 ) / 20.0 );
		vec3 q = ro + rd * ( t0 + h * tan( phi ) );
		float drop = uLight.y - q.y;
		if ( drop <= 0.5 ) continue;
		vec2 foot = uLight.xz + ( q.xz - uLight.xz ) * ( uLight.y / drop );
		float inBeam = 1.0 - smoothstep( uFoot.z - uFoot.w, uFoot.z + uFoot.w, length( foot - uFoot.xy ) );
		float mu = dot( rd, normalize( uLight - q ) );
		// Henyey and Greenstein's forward scattering (g 0.75), with a little that goes every way.
		float hg = 0.4375 / ( 12.566 * pow( 1.5625 - 1.5 * mu, 1.5 ) );
		sum += inBeam * ( 0.8 * hg + 0.2 * 0.0796 );
	}
	float glow = uPower * sum * ( b - a ) / 20.0 / h;
	gl_FragColor = vec4( uTint * glow, 1.0 );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

// The steam off each place: soft puffs rising and spreading, drifting downwind, lit by the light.
const puffVertex = /* glsl */ `
attribute vec2 aCell;
attribute vec4 aSeed;
uniform float uTime;
uniform vec4 uWork[ ${FRESH_PLACES} ];
uniform vec2 uSpread[ ${FRESH_PLACES} ];
uniform vec3 uWind;
uniform vec3 uLight;
uniform vec4 uFoot;
varying float vAlpha;
varying float vLit;
varying vec2 vAt;
void main() {
	int p = int( aCell.x + 0.5 );
	vec4 work = uWork[ p ];
	vec2 spread = uSpread[ p ];
	float life = 14.0 + 10.0 * aSeed.z;
	float age = fract( uTime / life + aSeed.w ) * life;
	float u = age / life;
	float angle = aSeed.x * 6.28318;
	vec2 at = work.xy + vec2( cos( angle ), sin( angle ) ) * sqrt( aSeed.y ) * 0.8 * spread.x;
	vec3 centre = vec3( at.x, 1.0 + ( 0.5 + 0.7 * aSeed.z ) * age, at.y ) + uWind * age * 0.7;
	float size = ( 2.0 + 8.0 * u ) * ( 0.7 + 0.6 * aSeed.y );
	float far = length( centre - cameraPosition );
	vAlpha = spread.y * smoothstep( 0.0, 0.15, u ) * ( 1.0 - smoothstep( 0.5, 1.0, u ) ) * smoothstep( 15.0, 50.0, far );
	// (Lit only within the beam.)
	vec3 toLight = uLight - centre;
	float drop = max( toLight.y, 1.0 );
	vec2 foot = uLight.xz - toLight.xz * ( uLight.y / drop );
	vLit = 1.0 - smoothstep( uFoot.z - uFoot.w, uFoot.z + uFoot.w, length( foot - uFoot.xy ) );
	vAt = position.xy;
	vec4 seen = viewMatrix * vec4( centre, 1.0 );
	seen.xy += position.xy * size * vec2( 1.0 + 1.5 * u, 0.6 );
	gl_Position = projectionMatrix * seen;
}
`;
const puffFragment = /* glsl */ `
uniform vec3 uTint;
uniform float uBright;
uniform float uDay;
varying float vAlpha;
varying float vLit;
varying vec2 vAt;
void main() {
	float d = dot( vAt, vAt );
	float soft = exp( - 3.0 * d ) * ( 1.0 - smoothstep( 0.6, 1.0, d ) );
	vec3 c = mix( uTint * uBright * ( 0.15 + 0.85 * vLit ), vec3( 1.0 ), uDay );
	gl_FragColor = vec4( c, soft * vAlpha * mix( 0.015, 0.06, uDay ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

export interface FreshFrame {
	// Seconds since they turned to it.
	since: number;
	time: number;
	boat: THREE.Vector3;
	ahead: THREE.Vector2;
	// The real swell's period (s), and the real wind (m/s).
	swellPeriod: number;
	wind: THREE.Vector3;
	// The measured visibility (m): the thicker the air, the more of the beam it gives back.
	visibility: number;
	day: number;
	gain: number;
	exposure: number;
	// The elements' colours.
	air: THREE.Color;
	water: THREE.Color;
	gold: THREE.Color;
}

const FIRE = new THREE.Color(0.78, 0.46, 0.32);
const EARTH = new THREE.Color(0.56, 0.54, 0.42);
const TORCH = new THREE.Color(0.76, 0.74, 1.0);

export function createFresh(scene: THREE.Scene, layer: number, sea: GerstnerUniforms) {
	const ropeCells: [number, number][] = [];
	PLACES.forEach((place, k) => {
		for (let f = 0; f < Math.round(FILAMENTS * ropeMight(place.who)); f++) ropeCells.push([k, 0]);
	});
	const ropeGeometry = lines(ropeCells.length, SEGMENTS, (i) => ropeCells[i]!);
	const ropeUniforms = {
		uTime: { value: 0 },
		uSeats: { value: PLACES.map(() => new THREE.Vector3()) },
		uWork: { value: PLACES.map(() => new THREE.Vector4()) },
		uElements: { value: [new THREE.Color(), EARTH.clone(), FIRE.clone(), new THREE.Color(), new THREE.Color()] },
		uPull: { value: 0 },
		uDay: { value: 0 },
		uFilm: filmLook,
		uGain: { value: 1 },
		uResolution: { value: new THREE.Vector2(1, 1) },
		uPixelRatio: pixelRatio,
	};
	const ropes = new THREE.Mesh(ropeGeometry, new THREE.ShaderMaterial({ uniforms: ropeUniforms, vertexShader: ropeVertex, fragmentShader: ropeFragment, transparent: true, depthWrite: false, side: THREE.DoubleSide }));

	const lightGeometry = lines(LIGHT_FILAMENTS, LIGHT_SEGMENTS, () => [0, 0]);
	const lightUniforms = {
		uTime: { value: 0 },
		uHands: { value: new THREE.Vector3() },
		uLight: { value: new THREE.Vector3() },
		uCast: { value: 0 },
		uDay: { value: 0 },
		uGain: { value: 1 },
		uResolution: ropeUniforms.uResolution,
		uPixelRatio: pixelRatio,
	};
	const rope = new THREE.Mesh(lightGeometry, new THREE.ShaderMaterial({ uniforms: lightUniforms, vertexShader: lightVertex, fragmentShader: lightFragment, transparent: true, depthWrite: false, side: THREE.DoubleSide }));

	const quad = new THREE.PlaneGeometry(2, 2);
	const coreUniforms = { uLight: lightUniforms.uLight, uSize: { value: 30 }, uBright: { value: 0 }, uTwinkle: { value: 0 } };
	const core = new THREE.Mesh(quad, new THREE.ShaderMaterial({ uniforms: coreUniforms, vertexShader: coreVertex, fragmentShader: coreFragment, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));

	// (Round the eye, inside out, and in the mirror too: on the scene's own layer.)
	const airGeometry = new THREE.SphereGeometry(3000, 32, 16);
	const airUniforms = { uLight: lightUniforms.uLight, uFoot: { value: new THREE.Vector4() }, uTint: { value: TORCH.clone() }, uPower: { value: 0 } };
	const air = new THREE.Mesh(airGeometry, new THREE.ShaderMaterial({ uniforms: airUniforms, vertexShader: airVertex, fragmentShader: airFragment, transparent: true, depthWrite: false, depthTest: false, side: THREE.BackSide, blending: THREE.AdditiveBlending }));

	const puffGeometry = new THREE.InstancedBufferGeometry();
	puffGeometry.index = quad.index;
	puffGeometry.setAttribute("position", quad.getAttribute("position"));
	const puffCount = FRESH_PLACES * PUFFS;
	const puffCells = new Float32Array(puffCount * 2);
	const puffSeeds = new Float32Array(puffCount * 4);
	for (let i = 0; i < puffCount; i++) {
		puffCells.set([Math.floor(i / PUFFS), 0], i * 2);
		puffSeeds.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
	}
	puffGeometry.setAttribute("aCell", new THREE.InstancedBufferAttribute(puffCells, 2));
	puffGeometry.setAttribute("aSeed", new THREE.InstancedBufferAttribute(puffSeeds, 4));
	puffGeometry.instanceCount = puffCount;
	const puffUniforms = {
		uTime: { value: 0 },
		uWork: ropeUniforms.uWork,
		uSpread: { value: PLACES.map(() => new THREE.Vector2()) },
		uWind: { value: new THREE.Vector3() },
		uLight: lightUniforms.uLight,
		uFoot: airUniforms.uFoot,
		uTint: { value: TORCH.clone() },
		uBright: { value: 1 },
		uDay: { value: 0 },
	};
	const puffs = new THREE.Mesh(puffGeometry, new THREE.ShaderMaterial({ uniforms: puffUniforms, vertexShader: puffVertex, fragmentShader: puffFragment, transparent: true, depthWrite: false, side: THREE.DoubleSide }));

	for (const mesh of [ropes, rope, core, air, puffs]) {
		mesh.frustumCulled = false;
		mesh.renderOrder = WEAVE_RENDER_ORDER;
		if (mesh !== air) mesh.layers.set(layer);
		mesh.visible = false;
		scene.add(mesh);
	}
	// (The beam's haze under the weaves, which stay sharp over it.)
	air.renderOrder = WEAVE_RENDER_ORDER - 1;

	const ahead = new THREE.Vector3();
	const across = new THREE.Vector3();
	// The breath's beat, taken from the real swell as they begin, and kept.
	let breathBegan: number | undefined;
	let beat = 0;
	let now = { since: -1, lit: 0 };
	const off = () => {
		for (const mesh of [ropes, rope, core, air, puffs]) mesh.visible = false;
		sea.breath.value.setW(0);
		sea.torch.value.setW(0);
		sea.freshWhole.value = 0;
		for (const at of sea.freshAt.value) at.setW(0);
		breathBegan = undefined;
		now = { since: -1, lit: 0 };
	};
	const update = (frame: FreshFrame | undefined) => {
		if (!frame || frame.since < 0) {
			off();
			return;
		}
		const since = frame.since;
		ahead.set(frame.ahead.x, 0, frame.ahead.y);
		across.set(-frame.ahead.y, 0, frame.ahead.x);
		const boat = frame.boat;

		// The breath: one slow beat, the real swell's, out from the boat.
		if (breathBegan === undefined) {
			breathBegan = frame.time - (since - BREATH_FROM);
			beat = (2 * Math.PI) / THREE.MathUtils.clamp(frame.swellPeriod || 10, 8, 13);
		}
		const k = (beat * beat) / 9.8;
		sea.breath.value.set(boat.x, boat.z, breathBegan, BREATH_HIGH);
		sea.breathForm.value.set(k, beat, 0, BREATH_RISE);
		// (Their pulls, as the sea at the boat is drawn up by them.)
		const pull = since > BREATH_FROM ? 0.5 - 0.5 * Math.sin(-beat * (frame.time - breathBegan)) : 0;

		// The light.
		const lit = freshLight(since);
		const light = lightUniforms.uLight.value
			.copy(boat)
			.addScaledVector(ahead, LIGHT_AHEAD * Math.cos(LIGHT_RIGHT))
			.addScaledVector(across, LIGHT_AHEAD * Math.sin(LIGHT_RIGHT))
			.setY(LIGHT_UP);
		const toBoat = light.distanceToSquared(new THREE.Vector3(boat.x, 0, boat.z));
		sea.torch.value.set(light.x, light.y, light.z, (TORCH_BRIGHT * lit) / frame.exposure);
		sea.torchFoot.value.set(boat.x, boat.z, FRESH_RADIUS, 30);
		sea.torchTint.value.set(TORCH.r, TORCH.g, TORCH.b, toBoat);
		airUniforms.uFoot.value.copy(sea.torchFoot.value);
		// (The thicker the air, the more of the beam it gives back.)
		const haze = THREE.MathUtils.clamp(20_000 / Math.max(frame.visibility || 25_000, 500), 0.5, 3);
		airUniforms.uPower.value = (AIR_GLOW * haze * TORCH_BRIGHT * lit * toBoat) / 1e6 / frame.exposure;
		coreUniforms.uBright.value = (lit * 1.4) / frame.exposure;
		coreUniforms.uTwinkle.value = Math.sin(frame.time * 0.7);
		air.position.copy(boat);

		// The strongest's rope, from their hands up into it.
		lightUniforms.uTime.value = frame.time;
		lightUniforms.uHands.value.copy(seatOf(STRONGEST_MIND, boat, ahead, across)).addScaledVector(ahead, 10).setY(boat.y - 0.5);
		lightUniforms.uCast.value = 1.05 * THREE.MathUtils.smoothstep(since, 0.5, 4);
		lightUniforms.uDay.value = frame.day;
		lightUniforms.uGain.value = frame.gain;

		// The others' ropes, their places, and the water they make fresh.
		ropeUniforms.uTime.value = frame.time;
		ropeUniforms.uPull.value = pull;
		ropeUniforms.uDay.value = frame.day;
		ropeUniforms.uGain.value = frame.gain;
		ropeUniforms.uElements.value[0]!.copy(frame.water);
		ropeUniforms.uElements.value[3]!.copy(frame.air);
		ropeUniforms.uElements.value[4]!.copy(frame.gold);
		ropeUniforms.uResolution.value.set(window.innerWidth, window.innerHeight).multiplyScalar(pixelRatio.value);
		PLACES.forEach((place, i) => {
			const x = boat.x + (ahead.x * Math.cos(place.bearing) + across.x * Math.sin(place.bearing)) * place.far;
			const z = boat.z + (ahead.z * Math.cos(place.bearing) + across.z * Math.sin(place.bearing)) * place.far;
			ropeUniforms.uSeats.value[i]!.copy(seatOf(place.who, boat, ahead, across));
			ropeUniforms.uWork.value[i]!.set(x, z, 1.05 * THREE.MathUtils.clamp((since - place.joins) / 2.5, 0, 1), 1.4 * Math.cbrt(ropeMight(place.who)));
			const working = since - place.lands;
			const made = THREE.MathUtils.smoothstep(working, 0, 20);
			const spread = place.spread * (0.3 + 0.7 * (1 - Math.exp(-Math.max(working, 0) / 90)));
			sea.freshAt.value[i]!.set(x, z, spread, made);
			puffUniforms.uSpread.value[i]!.set(spread, made * (0.6 + 0.4 * place.size));
		});
		// (Never quite 0 while they are at it: the sea looks for their water only then.)
		sea.freshWhole.value = Math.max(1e-4, 0.9 * THREE.MathUtils.smoothstep(since, 50, 330));
		puffUniforms.uTime.value = frame.time;
		puffUniforms.uWind.value.copy(frame.wind);
		puffUniforms.uBright.value = (0.5 * lit) / frame.exposure;
		puffUniforms.uDay.value = frame.day;

		const blending = frame.day > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending;
		(ropes.material as THREE.ShaderMaterial).blending = blending;
		(rope.material as THREE.ShaderMaterial).blending = blending;
		for (const mesh of [ropes, rope, puffs]) mesh.visible = true;
		core.visible = lit > 0.001;
		air.visible = lit > 0.001;
		now = { since, lit };
	};

	const describe = () =>
		now.since < 0
			? []
			: [
					`${Math.round(now.since)} s · the strongest's light ${Math.round(now.lit * 100)}% · the sea breathing every ${((2 * Math.PI) / beat).toFixed(1)} s, ${BREATH_HIGH} m at the boat at the full · the water round the boat run together ${Math.round(sea.freshWhole.value * 100)}%`,
					...PLACES.map((place, i) => `${NAMES[place.who]}: ${Math.round(THREE.MathUtils.radToDeg(place.bearing))}° off ahead, ${Math.round(place.far)} m out, ${Math.round(sea.freshAt.value[i]!.w * 100)}% fresh over ${Math.round(sea.freshAt.value[i]!.z)} m`),
				];

	const dispose = () => {
		for (const mesh of [ropes, rope, core, air, puffs]) {
			scene.remove(mesh);
			(mesh.material as THREE.Material).dispose();
		}
		ropeGeometry.dispose();
		lightGeometry.dispose();
		airGeometry.dispose();
		puffGeometry.dispose();
		quad.dispose();
	};

	return { update, describe, dispose };
}
