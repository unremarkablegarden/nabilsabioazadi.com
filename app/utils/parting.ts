// The parting of the sea, in Jenna's storm (the owner, 24 October: "Jenna's storm has used a waygate
// on the boat to summon in 16 more chanellers of my strength. Together, they part the sea whilst
// creating huge swells around the part"). The gate stands aft on the boat, behind the eye; through
// it the sixteen step one after another, each as strong as the strongest, who is the owner, and
// take their places along the after rail. Each sends a rope of the strongest's white, leaning to
// the water's colour, forward over the boat and out to one of the two walls, eight to each, landing
// on its lip at its own distance (from a hundred and forty metres to two and a half kilometres) and lying along the lip
// there; and when all have come they part the sea between them (gerstner-waves.ts, partedSea): a
// lane opening ahead of the boat to the horizon, its water pressed down to a still floor between two
// walls some forty metres high from floor to lip, and off the walls huge swells running out, away from the lane. As
// Siuan taught them, they work with the sea and never against it: each rope draws tight as the
// swell leaves its wall and eases between. As many filaments as the strongest's strength carries.
// Nothing jagged: every rope one continuous curve.
//
// After the first (the owner, 24 October: "every visitor will see the sixteen come through the
// waygate and part the sea in Jenna's storm... after about 30 seconds and then improvise on the
// rest of it using meteo conditions"): the gate opens for each visitor half a minute after they
// come, and the parting is then shaped by the weather as measured (partingWeather): as wide as the
// real swell is long, as deep as it is high, its walls rising and settling with each real swell that
// passes under them, bent downwind by the real wind across it, spray torn off its lips by the real
// gusts, and the swells off its walls longer and higher as the real sea is.
import * as THREE from "three";
import { lines } from "./embroidery";
import type { SeaConditions } from "./manawatawhi";
import { ropeMight, STRONGEST_MIND } from "./psyche";
import { pixelRatio, ribbonShaderChunk, WEAVE_RELAX, WEAVE_RENDER_ORDER } from "./weave";

export const PART_COUNT = 16;
// The gate opens this long after each visitor comes (s).
export const PART_AFTER = 30;
// The lane as the real weather shapes it: its half-width at its head and its depth (m, its floor as far
// under the sea as its lips stand over it), its swells' height (m, crest over the mean) and period (s),
// how far it bends downwind, how much its walls breathe with the real swell and how fast, and the spray.
export function partingWeather(real: SeaConditions | undefined, bearing: number) {
	const clamp = THREE.MathUtils.clamp;
	const swellHeight = real?.swellHeight ?? 1.5;
	const swellPeriod = real?.swellPeriod ?? 10;
	const windSpeed = real?.windSpeed ?? 15;
	const across = Math.sin(THREE.MathUtils.degToRad((real?.windDirection ?? bearing) + 180 - bearing)) * Math.min(1, windSpeed / 30);
	return {
		halfWidth: clamp(25 + 2.5 * swellPeriod, 40, 75),
		depth: clamp(12 + 4 * swellHeight, 14, 24),
		swellHeight: clamp(6 + 2.5 * (real?.waveHeight ?? swellHeight), 8, 14),
		swellPeriod: clamp(1.4 * swellPeriod, 12, 20),
		bend: 0.00004 * across,
		breath: 0.06 + 0.06 * Math.min(1, swellHeight / 3),
		breathRate: (2 * Math.PI) / Math.max(swellPeriod, 4),
		spray: clamp(((real?.windGusts ?? windSpeed) - 30) / 60, 0, 1),
	};
}
export type PartingWeather = ReturnType<typeof partingWeather>;
// When each of the sixteen comes through the gate (s), and when the sea is parted between them.
export const partArrives = (j: number) => 6 + 5 * j;
export const partShare = (since: number) => {
	const p = THREE.MathUtils.clamp((since - partArrives(PART_COUNT - 1) - 10) / 240, 0, 1);
	return p * p * (3 - 2 * p);
};
const FILAMENTS = Math.round(24 * ropeMight(STRONGEST_MIND));
const SEGMENTS = 80;

const vertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute vec2 aCell;
attribute vec4 aSeed;
uniform float uTime;
uniform float uSince;
uniform vec3 uBoat;
uniform vec3 uAhead;
uniform vec3 uAcross;
uniform vec4 uShape;
uniform vec2 uSwell;
uniform vec4 uMore;
uniform float uDay;
varying float vAlpha;
varying float vEdge;
varying float vSky;
${ribbonShaderChunk}

vec3 bezier( vec3 a, vec3 b, vec3 c, vec3 d, float t ) {
	float s = 1.0 - t;
	return s * s * s * a + 3.0 * s * s * t * b + 3.0 * s * t * t * c + t * t * t * d;
}
// Her place along the after rail: two rows of eight behind the eye.
vec3 handsOf( float j ) {
	float row = floor( j / 8.0 );
	float k = j - 8.0 * row;
	float x = ( k - 3.5 ) * 0.9;
	return uBoat + uAcross * x - uAhead * ( 4.0 + 1.4 * row ) + vec3( 0.0, - 1.2 + 0.3 * row, 0.0 );
}
// Where her rope comes down on the lip of her wall, and how far it lies along it.
vec3 lipAt( float j, float side, float along ) {
	float w = ( uShape.x + 0.02 * along ) * ( 1.0 + 0.1 * sin( along * 0.0013 + 1.3 ) + 0.04 * sin( along * 0.0041 ) );
	float wall = 25.0 + 0.035 * along;
	float held = uShape.y * ( 1.0 + uMore.y * sin( uMore.z * uTime - 0.004 * along ) );
	return uBoat + uAhead * along + uAcross * ( side * ( w + 0.3 * wall ) + uMore.x * along * along ) + vec3( 0.0, held * uShape.z * exp( - 0.3 * wall / 260.0 ) + 3.0, 0.0 );
}
vec3 ropeAt( float j, float t ) {
	float side = mod( j, 2.0 ) < 0.5 ? - 1.0 : 1.0;
	float k = floor( j / 2.0 );
	float land = 140.0 + 2400.0 * pow( k / 7.0, 1.4 );
	vec3 hands = handsOf( j );
	vec3 down = lipAt( j, side, land );
	if ( t < 0.7 ) {
		float u = t / 0.7;
		// (Low over the sea, and coming onto the lip level, so it lies on along it without a corner.)
		return bezier( hands, hands + uAhead * 25.0 + vec3( 0.0, 6.0, 0.0 ), down - uAhead * ( 0.35 * land ), down, u );
	}
	// Then along the lip, as far again as a fifth of the way out.
	float u = ( t - 0.7 ) / 0.3;
	return lipAt( j, side, land + u * ( 120.0 + 0.2 * land ) );
}

void main() {
	float j = aCell.x;
	float arrived = uSince - ( 6.0 + 5.0 * j );
	// Out from her hands over four seconds once she has come through.
	float grow = clamp( arrived / 4.0, 0.0, 1.0 );
	vec3 here = ropeAt( j, aT );
	vec3 next = ropeAt( j, min( aT + 0.0125, 1.0 ) ) + ( aT >= 0.9875 ? here - ropeAt( j, aT - 0.0125 ) : vec3( 0.0 ) );
	vec3 dir = normalize( next - here + vec3( 1e-5 ) );
	vec3 n1 = normalize( cross( dir, vec3( 0.0, 1.0, 0.0 ) ) + vec3( 1e-4 ) );
	vec3 n2 = normalize( cross( n1, dir ) );
	// Drawn tight as the swell leaves her wall, eased between: a hawser's girth that breathes with it.
	float haul = 0.5 + 0.5 * sin( - uSwell.y * uTime );
	float girth = ( 0.3 + ( 3.0 + 6.0 * aT ) * sin( 3.14159 * min( aT * 1.15, 1.0 ) ) * ( 1.0 - 0.35 * haul * uShape.z ) ) * sqrt( aSeed.z );
	float turn = aSeed.y * 6.28318 + aT * 9.0 + uTime * 0.08;
	vec3 off = ( n1 * cos( turn ) + n2 * sin( turn ) ) * girth;
	here += off;
	next += off;
	float shown = smoothstep( grow, grow - 0.04, aT ) * step( 0.0, arrived ) * smoothstep( 1.0, 0.94, aT ) * ( 0.7 + 0.3 * haul * uShape.z );
	float far = length( here - cameraPosition );
	vAlpha = shown * smoothstep( 15.0, 60.0, far ) * exp( - far / 7000.0 );
	vEdge = aSide;
	vSky = againstSky( here );
	mat4 vp = projectionMatrix * viewMatrix;
	gl_Position = ribbonPosition( vp * vec4( here, 1.0 ), vp * vec4( next, 1.0 ), aSide, mix( 1.0, 1.3, uDay ) );
}
`;

const fragment = /* glsl */ `
uniform float uGain;
uniform float uDay;
uniform vec3 uTint;
varying float vAlpha;
varying float vEdge;
varying float vSky;
void main() {
	float body = 1.0 - smoothstep( 0.7, 1.0, abs( vEdge ) );
	// (By day as bright as the storm's lowered exposure needs, lighter against the sky: never a dark line.)
	gl_FragColor = vec4( mix( uTint * uGain, uTint * max( 1.2, uGain * mix( 0.8, 1.5, vSky ) ), uDay ), body * vAlpha * 0.03 * mix( 1.0, 3.0, uDay ) );
	// (Relaxed by half: WEAVE_RELAX.)
	gl_FragColor.a *= ${WEAVE_RELAX.toFixed(3)};
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

export interface PartingFrame {
	// Seconds since the gate opened, and 0..1 how far the sea is parted.
	since: number;
	share: number;
	time: number;
	boat: THREE.Vector3;
	ahead: THREE.Vector2;
	day: number;
	gain: number;
	// The water's colour, which their white leans to.
	water: THREE.Color;
	// The lane as the real weather shapes it.
	weather: PartingWeather;
}

export function createParting(scene: THREE.Scene, layer: number, sea: { partFront: { value: THREE.Vector4 }; partShape: { value: THREE.Vector4 }; partSwell: { value: THREE.Vector2 }; partMore: { value: THREE.Vector4 } }) {
	const cells: [number, number][] = [];
	for (let j = 0; j < PART_COUNT; j++) for (let f = 0; f < FILAMENTS; f++) cells.push([j, 0]);
	const geometry = lines(cells.length, SEGMENTS, (i) => cells[i]!);
	const uniforms = {
		uTime: { value: 0 },
		uSince: { value: 0 },
		uBoat: { value: new THREE.Vector3() },
		uAhead: { value: new THREE.Vector3(0, 0, -1) },
		uAcross: { value: new THREE.Vector3(1, 0, 0) },
		uShape: { value: sea.partShape.value },
		uSwell: { value: sea.partSwell.value },
		uMore: { value: sea.partMore.value },
		uDay: { value: 0 },
		uGain: { value: 1 },
		uTint: { value: new THREE.Color() },
		uResolution: { value: new THREE.Vector2(1, 1) },
		uPixelRatio: pixelRatio,
	};
	const mesh = new THREE.Mesh(geometry, new THREE.ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
	mesh.frustumCulled = false;
	mesh.renderOrder = WEAVE_RENDER_ORDER;
	mesh.layers.set(layer);
	mesh.visible = false;
	scene.add(mesh);

	const white = new THREE.Color(0xffffff);
	const update = (frame: PartingFrame | undefined) => {
		if (!frame) {
			mesh.visible = false;
			sea.partShape.value.setZ(0);
			return;
		}
		uniforms.uTime.value = frame.time;
		uniforms.uSince.value = frame.since;
		uniforms.uBoat.value.copy(frame.boat);
		uniforms.uAhead.value.set(frame.ahead.x, 0, frame.ahead.y);
		uniforms.uAcross.value.set(-frame.ahead.y, 0, frame.ahead.x);
		sea.partFront.value.set(frame.boat.x, frame.boat.z, frame.ahead.x, frame.ahead.y);
		const w = frame.weather;
		sea.partShape.value.set(w.halfWidth, w.depth, frame.share, w.swellHeight * frame.share);
		sea.partSwell.value.set((2 * Math.PI) / (1.56 * w.swellPeriod ** 2), (2 * Math.PI) / w.swellPeriod);
		sea.partMore.value.set(w.bend * frame.share, w.breath, w.breathRate, w.spray);
		uniforms.uDay.value = frame.day;
		uniforms.uGain.value = frame.gain;
		uniforms.uTint.value.copy(white).lerp(frame.water, 0.3);
		uniforms.uResolution.value.set(window.innerWidth, window.innerHeight).multiplyScalar(pixelRatio.value);
		(mesh.material as THREE.ShaderMaterial).blending = frame.day > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending;
		mesh.visible = true;
	};

	const dispose = () => {
		scene.remove(mesh);
		(mesh.material as THREE.Material).dispose();
		geometry.dispose();
	};

	return { update, dispose };
}
