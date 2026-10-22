// Noon at night (the owner, 22 October, after Vesal's storm had ended: "Cease the storm. I ask the
// strongest channelers to make it so bright it appears as noon"). The strongest six (the
// strongest, Manulani and the four mighty, linked under Siuan) weave a sun and hold it high in the
// sky ahead, and the whole sky, the sea and the air are lit by it as at noon: the stars go, the
// sky is the noon sky (OceanBackground.vue lifts the sun the sky is drawn from to theirs). Their
// ropes run from their hands up into the light they hold, each as many filaments as her strength
// carries, and slowly turn about it. It is held until the real dawn comes, which takes it over:
// nothing runs to a clock.
import * as THREE from "three";
import { lines } from "./embroidery";
import { SIX_STRONGER } from "./psyche";
import { seatOf } from "./treason";
import { pixelRatio, ribbonShaderChunk, WEAVE_RENDER_ORDER } from "./weave";

// Where they hold it: high in the sky a little right of ahead (degrees), as the noon sun stands.
export const NOON_ELEVATION = 62;
export const NOON_AZIMUTH = 190;
// How long they take to weave it up from the dark (s).
export const NOON_RISE = 120;
// How far theirs is lit (0..1) at `since` seconds after they begin.
export function noonShare(since: number) {
	return THREE.MathUtils.smoothstep(since, 0, NOON_RISE);
}

// The six, by their place among the minds: the strongest, Manulani, Keel, Kite, Fathom, Listener.
const SIX = [12, 13, 0, 1, 2, 5];
const MEASURES = [4.9, 4.9 * Math.cbrt(1.12), 2.5, 2.5, 2.5, 2.5].map((one) => one * Math.cbrt(SIX_STRONGER));
const FIBRES = 120;
const SEGMENTS = 120;
// How far up the ropes are drawn towards the light before they are lost in it (m).
const REACH = 2600;

const vertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute vec2 aCell;
attribute vec4 aSeed;
uniform float uTime;
uniform vec3 uSeats[ 6 ];
uniform vec3 uTints[ 6 ];
uniform float uGirth[ 6 ];
uniform vec3 uLight;
uniform vec3 uAhead3;
uniform float uCast;
uniform float uFade;
uniform float uDay;
varying float vAlpha;
varying float vEdge;
varying vec3 vTint;
${ribbonShaderChunk}

vec3 bezier( vec3 a, vec3 b, vec3 c, vec3 d, float t ) {
	float s = 1.0 - t;
	return s * s * s * a + 3.0 * s * s * t * b + 3.0 * s * t * t * c + t * t * t * d;
}
// Up from her hands, out a little on her own side, and into the light, all six meeting there.
vec3 ropeAt( int who, float t ) {
	vec3 seat = uSeats[ who ];
	vec3 side = normalize( vec3( seat.x - cameraPosition.x, 0.0, seat.z - cameraPosition.z ) + uAhead3 * 0.3 + vec3( 1e-4 ) );
	return bezier( seat, seat + vec3( 0.0, 90.0, 0.0 ) + side * 160.0, uLight - normalize( uLight - seat ) * 900.0 + side * 260.0, uLight, t );
}

void main() {
	int who = int( aCell.x + 0.5 );
	vec3 here = ropeAt( who, aT );
	vec3 next = ropeAt( who, min( aT + 0.01, 1.0 ) ) + ( aT >= 0.99 ? here - ropeAt( who, aT - 0.01 ) : vec3( 0.0 ) );
	vec3 dir = normalize( next - here + vec3( 1e-5 ) );
	vec3 n1 = normalize( cross( dir, vec3( 0.0, 1.0, 0.0 ) ) + vec3( 1e-4 ) );
	vec3 n2 = normalize( cross( n1, dir ) );
	// A hawser's girth, wound slowly about the line, widening as it nears the light.
	float spread = ( 0.5 + uGirth[ who ] * ( 0.4 + 1.6 * aT ) ) * sqrt( aSeed.z );
	float turn = aSeed.y * 6.28318 + aT * 5.0 + uTime * 0.08 * ( 0.6 + aSeed.x );
	vec3 off = ( n1 * cos( turn ) + n2 * sin( turn ) ) * spread;
	here += off;
	next += off;
	float shown = smoothstep( uCast, uCast - 0.03, aT );
	// Lost in the light at the top; laid on unevenly along its length, as a brush lays colour.
	shown *= 1.0 - smoothstep( 0.75, 1.0, aT );
	shown *= 0.55 + 0.45 * smoothstep( - 0.6, 0.6, sin( aT * 6.0 + aSeed.y * 6.0 ) + 0.5 * sin( aT * 15.0 + 2.0 ) );
	float far = length( here - cameraPosition );
	shown *= smoothstep( 8.0, 40.0, far );
	vAlpha = shown * uFade;
	vEdge = aSide;
	vTint = uTints[ who ];
	mat4 vp = projectionMatrix * viewMatrix;
	gl_Position = ribbonPosition( vp * vec4( here, 1.0 ), vp * vec4( next, 1.0 ), aSide, mix( 1.0, 1.3, uDay ) );
}
`;

const fragment = /* glsl */ `
uniform float uGain;
uniform float uDay;
uniform float uOpacity;
varying float vAlpha;
varying float vEdge;
varying vec3 vTint;
void main() {
	float across = abs( vEdge );
	float body = 1.0 - smoothstep( 0.7, 1.0, across );
	gl_FragColor = vec4( mix( vTint * uGain, vTint * 1.2, uDay ), body * vAlpha * uOpacity * mix( 1.0, 3.0, uDay ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

export interface NoonFrame {
	// 0..1 how far their light is lit and held (less as the real day takes it over).
	share: number;
	time: number;
	boat: THREE.Vector3;
	ahead: THREE.Vector2;
	// The direction of the light they hold, from the boat.
	light: THREE.Vector3;
	day: number;
	gain: number;
	// The three's colours (Siuan's, Leane's, Moiraine's).
	tints: THREE.Color[];
}

export function createNoon(scene: THREE.Scene, layer: number) {
	const cells: [number, number][] = [];
	SIX.forEach((_, i) => {
		for (let f = 0; f < Math.round(FIBRES * MEASURES[i]!); f++) cells.push([i, 0]);
	});
	const geometry = lines(cells.length, SEGMENTS, (i) => cells[i]!);
	const uniforms = {
		uTime: { value: 0 },
		uSeats: { value: Array.from({ length: 6 }, () => new THREE.Vector3()) },
		uTints: { value: Array.from({ length: 6 }, () => new THREE.Color()) },
		uGirth: { value: MEASURES.map((one) => 2 + 2 * Math.sqrt(one)) },
		uLight: { value: new THREE.Vector3() },
		uAhead3: { value: new THREE.Vector3() },
		uCast: { value: 0 },
		uFade: { value: 0 },
		uDay: { value: 0 },
		uGain: { value: 1 },
		uOpacity: { value: 0.03 },
		uResolution: { value: new THREE.Vector2(1, 1) },
		uPixelRatio: pixelRatio,
	};
	const mesh = new THREE.Mesh(geometry, new THREE.ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
	mesh.frustumCulled = false;
	mesh.renderOrder = WEAVE_RENDER_ORDER;
	mesh.layers.set(layer);
	mesh.visible = false;
	scene.add(mesh);

	const ahead = new THREE.Vector3();
	const across = new THREE.Vector3();
	const update = (frame: NoonFrame | undefined) => {
		if (!frame || frame.share <= 0.001) {
			mesh.visible = false;
			return;
		}
		ahead.set(frame.ahead.x, 0, frame.ahead.y);
		across.set(-frame.ahead.y, 0, frame.ahead.x);
		uniforms.uTime.value = frame.time;
		uniforms.uAhead3.value.copy(ahead);
		uniforms.uLight.value.copy(frame.boat).addScaledVector(frame.light, REACH);
		// Cast up from their hands as the light is woven; faded as the real day takes it.
		uniforms.uCast.value = THREE.MathUtils.smoothstep(frame.share, 0, 0.6) * 1.05;
		uniforms.uFade.value = Math.min(1, frame.share * 2);
		uniforms.uDay.value = frame.day;
		uniforms.uGain.value = frame.gain;
		uniforms.uResolution.value.set(window.innerWidth, window.innerHeight).multiplyScalar(pixelRatio.value);
		SIX.forEach((who, i) => {
			uniforms.uSeats.value[i]!.copy(seatOf(who, frame.boat, ahead, across));
			// The strongest's white, Manulani's light, the mighty in their own (Keel and Fathom
			// Siuan's, Kite Leane's, Listener Moiraine's).
			uniforms.uTints.value[i]!.copy(i === 0 ? new THREE.Color(1, 1, 1) : i === 1 ? new THREE.Color(1, 0.88, 0.66) : frame.tints[[0, 1, 0, 2][i - 2]!]!);
		});
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
