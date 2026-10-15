// The sky opened by breath alone, at ?sky=breath: the next version of the channelled storm (16
// October), beside the one with everything at once (sky-all.ts). Nothing is drawn in the sky. The
// weave is felt only in what the weather does, which is what the owner kept asking for ("more
// natural", "more abstract", "painterly": away from drawn objects, towards gesture and weather):
//   the in-breath: the rain round the boat leans in towards it, slows, and hangs glimmering
//   the out-breath: the rain goes back up, beginning at the boat and spreading out over the sea
//     in one slow wave, each drop rising and turning a little as it goes, thinning into mist
//   the cloud opens: a real hole, ahead and high, its edge made of the cloud's own shapes,
//     streaming past and unable to close it while it is held; through it the night's real stars
//     (or by day the sky), the fog thinning under it, and the hole breathing with them
//   lanterns: a few slow motes let go into it, one on each out-breath, lost into the stars
//   let go: the hole closes, and the rain comes back down out of the cloud.
import * as THREE from "three";
import type { Sky } from "three/addons/objects/Sky.js";
import { WEAVE_RENDER_ORDER } from "./weave";

export const SKY_BREATH_CYCLE = 160;
// Where the hole is: its middle, as a direction's x and z over its y (a point on a flat cloud
// deck, a unit's height up), straight ahead and about 11 degrees up (the screen shows the sky only
// to about 17 degrees above the horizon); and its widest reach.
export const HOLE_AHEAD = 5;
const HOLE_REACH = 1.8;
// How fast the rising spreads out over the sea, in metres a second.
const FRONT_SPEED = 14;
// Their slow breathing while they hold it, in seconds a breath.
const BREATH = 8;

export function skyBreathAt(seconds: number) {
	const t = ((seconds % SKY_BREATH_CYCLE) + SKY_BREATH_CYCLE) % SKY_BREATH_CYCLE;
	const { smoothstep } = THREE.MathUtils;
	const letGo = 1 - smoothstep(t, 124, 142);
	// While held, the hole swells a little with each out-breath.
	const breathing = 1 + 0.05 * Math.sin(((t - 62) / BREATH) * Math.PI * 2) * smoothstep(t, 70, 80);
	return {
		cycle: t,
		breath: smoothstep(t, 38, 46) * (1 - smoothstep(t, 50, 58)),
		// Hanging from the in-breath until the rain is let go (by then all of it has gone up).
		hang: smoothstep(t, 42, 48) * (1 - smoothstep(t, 127, 131)),
		// How far out the rising has reached, in metres (-1: none).
		front: t >= 50 && t < 127 ? (t - 50) * FRONT_SPEED : -1,
		hole: smoothstep(t, 60, 98) * letGo * breathing,
		// The air under the opened sky cleared, for the fog and the shelter.
		canopy: smoothstep(t, 52, 85) * letGo,
		// The rain coming back down out of the cloud: the height of its lowest drops.
		curtain: t >= 127 && t < 152 ? THREE.MathUtils.lerp(110, -10, smoothstep(t, 130, 150)) : -1000,
		lanterns: t,
	};
}

// How far a direction is in the hole, 0..1. `ragged` is the cloud's own density there, so its edge
// is made of the cloud's shapes; without it (the stars) the edge is soft and a little inside.
export const skyHoleChunk = /* glsl */ `
uniform vec3 uSkyHole;
float skyHole( vec3 direction, float ragged ) {
	if ( uSkyHole.z <= 0.0 || direction.y <= 0.02 ) return 0.0;
	vec2 deck = direction.xz / direction.y - uSkyHole.xy;
	// (Wider than deep, as a hole in a deck of cloud is.)
	float d = length( deck * vec2( 0.75, 1.0 ) ) / uSkyHole.z;
	d += ( ragged - 0.5 ) * 0.9;
	return 1.0 - smoothstep( 0.55, 0.95, d );
}
`;

// The sky's clouds give way in the hole (Sky.js, r186, as twilight-sky.ts and sky-vortex.ts patch it).
export function openSkyHole(sky: Sky, hole: THREE.IUniform<THREE.Vector3>) {
	const material = sky.material;
	material.uniforms.uSkyHole = hole;
	let fragment = material.fragmentShader;
	const swap = (from: string, to: string) => {
		if (!fragment.includes(from)) throw new Error(`sky-breath: shader has changed, cannot find: ${from}`);
		fragment = fragment.replace(from, to);
	};
	swap("uniform float showSunDisc;", `uniform float showSunDisc;\n${skyHoleChunk}`);
	swap("float edge = cloudMask * ( 1.0 - cloudMask ) * 4.0;", "float opened = skyHole( direction, cloudNoise );\n\t\t\t\tcloudMask *= 1.0 - opened;\n\t\t\t\tfloat edge = cloudMask * ( 1.0 - cloudMask ) * 4.0;");
	swap("float alpha = ( 1.0 - exp( depth * cloudDensity * -12.0 ) ) * horizonFade;", "float alpha = ( 1.0 - exp( depth * cloudDensity * -12.0 ) ) * horizonFade * ( 1.0 - opened );");
	material.fragmentShader = fragment;
	material.needsUpdate = true;
}

// Lanterns: on each out-breath while the sky is held open, one of the four lets a slow mote of soft
// light go from their hands. It drifts out and up into the hole and is lost there among the stars.
const LANTERNS = 8;
const LANTERNS_FROM = 90;
const LANTERN_CLIMB = 46;
const CLOUD = 230;
const lanternVertex = /* glsl */ `
attribute float aIndex;
uniform float uCycle;
uniform vec3 uBoat;
uniform vec2 uAhead;
uniform float uFade;
varying float vAlpha;
void main() {
	float age = uCycle - ( ${LANTERNS_FROM}.0 + aIndex * ${BREATH}.0 * 0.5 );
	float s = clamp( age / ${LANTERN_CLIMB}.0, 0.0, 1.0 );
	vec3 ahead = vec3( uAhead.x, 0.0, uAhead.y );
	vec3 across = vec3( - uAhead.y, 0.0, uAhead.x );
	vec3 p = uBoat + across * ( mod( aIndex, 4.0 ) - 1.5 ) * 1.5 + vec3( 0.0, - 1.0, 0.0 );
	// Out over the sea first and then up, slowing, towards the middle of the hole.
	float rise = s * s * ( 3.0 - 2.0 * s );
	p += ahead * ${CLOUD}.0 * ${HOLE_AHEAD}.0 * s + vec3( 0.0, ${CLOUD}.0 * rise, 0.0 );
	p += across * sin( age * 0.31 + aIndex * 2.1 ) * 18.0 * s;
	vAlpha = step( 0.0, age ) * smoothstep( 0.0, 3.0, age ) * ( 1.0 - smoothstep( 0.7, 1.0, s ) ) * ( 1.0 - uFade );
	vec4 view = viewMatrix * vec4( p, 1.0 );
	gl_Position = projectionMatrix * view;
	gl_PointSize = clamp( 1.1 * 900.0 / max( - view.z, 1.0 ), 1.5, 9.0 );
}
`;
const lanternFragment = /* glsl */ `
uniform float uGain;
uniform float uDay;
varying float vAlpha;
void main() {
	float r = length( gl_PointCoord - 0.5 ) * 2.0;
	float glow = exp( - r * r * 4.0 ) * ( 1.0 - smoothstep( 0.8, 1.0, r ) );
	gl_FragColor = vec4( vec3( 1.0, 0.94, 0.84 ) * mix( uGain, 1.0, uDay ), glow * vAlpha * mix( 0.22, 0.4, uDay ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

export interface SkyBreathFrame {
	boat: THREE.Vector3;
	ahead: THREE.Vector2;
	day: number;
	gain: number;
	at: ReturnType<typeof skyBreathAt>;
}

export function createSkyBreath(scene: THREE.Scene, sky: Sky, layer: number) {
	// Shared with the sky's clouds and the stars: the hole's middle on the deck, and its reach.
	const hole = { value: new THREE.Vector3(0, -HOLE_AHEAD, 0) };
	openSkyHole(sky, hole);

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(LANTERNS * 3), 3));
	geometry.setAttribute("aIndex", new THREE.BufferAttribute(Float32Array.from({ length: LANTERNS }, (_, i) => i), 1));
	const uniforms = {
		uCycle: { value: 0 },
		uBoat: { value: new THREE.Vector3() },
		uAhead: { value: new THREE.Vector2(0, -1) },
		uFade: { value: 0 },
		uGain: { value: 1 },
		uDay: { value: 0 },
	};
	const lanterns = new THREE.Points(geometry, new THREE.ShaderMaterial({ uniforms, vertexShader: lanternVertex, fragmentShader: lanternFragment, transparent: true, depthWrite: false }));
	lanterns.frustumCulled = false;
	lanterns.renderOrder = WEAVE_RENDER_ORDER;
	lanterns.layers.set(layer);
	lanterns.visible = false;
	scene.add(lanterns);

	// Where the middle of the hole is seen, for the fog to thin under it.
	const middle = new THREE.Vector3();

	const update = (frame: SkyBreathFrame | undefined) => {
		hole.value.z = frame ? HOLE_REACH * frame.at.hole : 0;
		if (!frame) {
			lanterns.visible = false;
			return;
		}
		hole.value.set(frame.ahead.x * HOLE_AHEAD, frame.ahead.y * HOLE_AHEAD, HOLE_REACH * frame.at.hole);
		const { at } = frame;
		lanterns.visible = at.lanterns > LANTERNS_FROM && at.lanterns < 150;
		uniforms.uCycle.value = at.lanterns;
		uniforms.uFade.value = THREE.MathUtils.smoothstep(at.lanterns, 124, 140);
		uniforms.uBoat.value.copy(frame.boat);
		uniforms.uAhead.value.copy(frame.ahead);
		uniforms.uDay.value = frame.day;
		uniforms.uGain.value = frame.gain;
		(lanterns.material as THREE.ShaderMaterial).blending = frame.day > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending;
	};

	// A point far along the middle of the hole, from the eye.
	const holeMiddle = (eye: THREE.Vector3) => middle.set(hole.value.x, 1, hole.value.y).normalize().multiplyScalar(5000).add(eye);

	const dispose = () => {
		scene.remove(lanterns);
		geometry.dispose();
		(lanterns.material as THREE.Material).dispose();
	};

	return { update, dispose, hole, holeMiddle, reach: () => hole.value.z };
}
