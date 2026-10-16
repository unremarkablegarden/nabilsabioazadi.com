// All the ways of opening the sky at once (the owner, 15 October: "What if you apply all of them at
// once? I'd love to see that"), at ?sky=all. Not seven things switched on together but one piece,
// each coming in on its own breath and overlapping the next, in the same two and a half minutes:
//   the rain gathered into shoals and swept off like starlings      (rain.ts, murmur)
//   the in-breath, and the silk column lifted to the cloud base     (sky-opening.ts)
//   what rain is left slowing, hanging, glimmering, and going back up as mist   (rain.ts)
//   a forest of slender threads rising from the sea at the horizon, swaying like kelp in a
//   current, holding the sky up                                    (kelp, here)
//   one broad silk ribbon thrown up by the strongest in long folding arcs, the last fold laid
//   across the cloud base like a roof                              (ribbon, here)
//   the curtain of rain lifted off the sea                         (rain.ts, curtain)
//   a ring of calm rolling out from the boat over the sea          (rain.ts, the canopy)
//   lanterns: a slow mote of light let go on each out-breath, opening where it reaches the cloud
//                                                                  (lanterns, here)
// and all of it let go together, the rain closing back in.
import * as THREE from "three";
import { pixelRatio, ribbonShaderChunk, stripIndices, unplaced, WEAVE_RENDER_ORDER } from "./weave";

export const SKY_ALL_CYCLE = 160;
const CLOUD = 230;

// Where each part is, from the seconds since the channelled storm began (it comes round every 160).
export function skyAllAt(seconds: number) {
	const t = ((seconds % SKY_ALL_CYCLE) + SKY_ALL_CYCLE) % SKY_ALL_CYCLE;
	const { smoothstep } = THREE.MathUtils;
	const letGo = 1 - smoothstep(t, 125, 150);
	return {
		cycle: t,
		murmur: smoothstep(t, 35, 42) * (1 - smoothstep(t, 52, 60)),
		hang: smoothstep(t, 46, 51) * (1 - smoothstep(t, 53, 58)),
		rise: smoothstep(t, 53, 62) * letGo,
		gather: smoothstep(t, 40, 48),
		lift: smoothstep(t, 48, 62),
		open: smoothstep(t, 62, 72),
		release: smoothstep(t, 125, 145),
		kelp: smoothstep(t, 52, 74) * letGo,
		ribbon: smoothstep(t, 58, 78),
		ribbonGone: smoothstep(t, 125, 146),
		curtain: smoothstep(t, 62, 100) * letGo,
		ring: smoothstep(t, 70, 110) * letGo,
		// How far the air round the boat has been cleared, for the fog and the shelter.
		canopy: Math.max(smoothstep(t, 53, 62), smoothstep(t, 70, 110)) * letGo,
		lanterns: t,
	};
}

const threadFragment = /* glsl */ `
uniform float uGain;
uniform float uDay;
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;
void main() {
	float across = abs( vEdge );
	float body = exp( - across * across * 3.0 ) * ( 1.0 - smoothstep( 0.8, 1.0, across ) );
	gl_FragColor = vec4( vTint * mix( uGain, 1.0, uDay ), body * vAlpha * mix( 1.0, 2.6, uDay ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

// The kelp forest: slender threads standing up out of the sea all round, far off, leaning with the
// wind and swaying as kelp does in a current, each its own way, up into the cloud.
const kelpVertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute vec4 aThread;
uniform float uTime;
uniform vec3 uBoat;
uniform vec3 uWindDir;
uniform float uGrow;
uniform vec3 uSheath[ 4 ];
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;
${ribbonShaderChunk}
vec3 kelpPoint( float t ) {
	float a = aThread.x * 6.28318;
	float r = mix( 900.0, 1700.0, aThread.y );
	vec3 base = vec3( uBoat.x + cos( a ) * r, -2.0, uBoat.z + sin( a ) * r );
	vec3 across = normalize( cross( uWindDir + vec3( 1e-4 ), vec3( 0.0, 1.0, 0.0 ) ) );
	float sway = sin( t * 4.0 + uTime * ( 0.25 + 0.1 * aThread.z ) + aThread.w * 6.0 ) * 22.0 * t;
	return base + vec3( 0.0, t * ${CLOUD}.0, 0.0 ) + uWindDir * t * t * 110.0 + across * sway;
}
void main() {
	vec3 here = kelpPoint( aT );
	vec3 ahead = kelpPoint( min( aT + 0.02, 1.0 ) ) + ( aT >= 0.98 ? here - kelpPoint( aT - 0.02 ) : vec3( 0.0 ) );
	mat4 vp = projectionMatrix * viewMatrix;
	// It grows up out of the sea, each in its own time; its top is lost in the cloud.
	float front = uGrow * 1.3 - 0.3 * aThread.z;
	float shown = smoothstep( front, front - 0.05, aT ) * smoothstep( 1.0, 0.8, aT ) * smoothstep( 0.0, 0.05, aT );
	vec3 water = uSheath[ 1 ] / max( max( uSheath[ 1 ].r, uSheath[ 1 ].g ), uSheath[ 1 ].b );
	vec3 akasha = uSheath[ 2 ] / max( max( uSheath[ 2 ].r, uSheath[ 2 ].g ), uSheath[ 2 ].b );
	vTint = mix( vec3( 1.0 ), mix( water, akasha, step( 0.75, aThread.w ) ), 0.45 );
	vAlpha = shown * 0.13 * ( 0.7 + 0.3 * sin( aT * 12.0 - uTime * 0.8 + aThread.w * 30.0 ) );
	vEdge = aSide;
	gl_Position = ribbonPosition( vp * vec4( here, 1.0 ), vp * vec4( ahead, 1.0 ), aSide, 0.8 );
}
`;

// The silk ribbon: one broad, translucent band thrown up by the strongest from their hands in long
// folding arcs, turning as it goes so its folds catch the light, the last laid across the cloud
// base. Real width, in metres, unlike the threads.
const ribbonVertex = /* glsl */ `
attribute float aT;
attribute float aSide;
uniform float uTime;
uniform vec3 uHands;
uniform vec2 uAhead;
uniform float uThrow;
uniform float uGone;
varying float vAlpha;
varying float vEdge;
varying float vSheen;
vec3 ribbonPoint( float t ) {
	vec3 ahead = vec3( uAhead.x, 0.0, uAhead.y );
	vec3 across = vec3( - uAhead.y, 0.0, uAhead.x );
	float rise = t * t * ( 3.0 - 2.0 * t );
	return uHands + ahead * t * 380.0 + vec3( 0.0, rise * ${CLOUD}.0, 0.0 ) + across * sin( t * 9.42 - uTime * 0.25 ) * 70.0 * t;
}
void main() {
	float t = aT;
	vec3 p = ribbonPoint( t );
	vec3 tangent = normalize( ribbonPoint( min( t + 0.005, 1.0 ) ) - ribbonPoint( max( t - 0.005, 0.0 ) ) );
	vec3 flat_ = normalize( cross( tangent, vec3( 0.0, 1.0, 0.0 ) ) + vec3( 1e-4 ) );
	// It turns about itself as it goes, and the turning travels along it.
	float turn = 1.3 * sin( t * 11.0 - uTime * 0.45 );
	vec3 up = normalize( cross( flat_, tangent ) );
	vec3 wide = flat_ * cos( turn ) + up * sin( turn );
	float halfWidth = 0.3 + 14.0 * t;
	p += wide * aSide * halfWidth;
	vec3 normal = normalize( cross( tangent, wide ) );
	vSheen = pow( abs( dot( normal, normalize( cameraPosition - p ) ) ), 2.0 );
	float front = uThrow * 1.05;
	// (Not near the hands: so close to the eye it was a broad grey band, not silk.)
	vAlpha = smoothstep( front, front - 0.06, t ) * smoothstep( uGone - 0.06, uGone, t ) * smoothstep( 1.0, 0.85, t ) * smoothstep( 0.08, 0.25, t );
	vEdge = aSide;
	gl_Position = projectionMatrix * viewMatrix * vec4( p, 1.0 );
}
`;
const ribbonFragment = /* glsl */ `
uniform float uGain;
uniform float uDay;
varying float vAlpha;
varying float vEdge;
varying float vSheen;
void main() {
	// Silk: nearly clear, catching the light where a fold turns to the eye; soft at its edges.
	float edge = 1.0 - smoothstep( 0.6, 1.0, abs( vEdge ) );
	float a = vAlpha * edge * ( 0.012 + 0.1 * vSheen * vSheen * vSheen ) * mix( 1.0, 2.2, uDay );
	gl_FragColor = vec4( vec3( 1.0, 0.99, 0.97 ) * mix( uGain, 1.0, uDay ), a );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

// Lanterns: on each out-breath one of the four lets go of a slow mote of soft light from their
// hands. It drifts up, wavering, and where it reaches the cloud it opens, spreading and fading.
const LANTERNS = 48;
const lanternVertex = /* glsl */ `
attribute float aIndex;
uniform float uCycle;
uniform vec3 uBoat;
uniform vec2 uAhead;
uniform float uFade;
varying float vAlpha;
void main() {
	float launch = 74.0 + aIndex * 1.0;
	float age = uCycle - launch;
	vec3 across = vec3( - uAhead.y, 0.0, uAhead.x );
	float seat = mod( aIndex, 4.0 );
	vec3 p = uBoat + across * ( seat - 1.5 ) * 1.5 + vec3( 0.0, - 1.0, 0.0 );
	// A long low rise out over the sea towards the opening, so each can be followed all the way.
	float climb = age * 5.5;
	p += vec3( uAhead.x, 0.0, uAhead.y ) * climb * 3.2;
	p.y += min( climb, ${CLOUD}.0 );
	p += vec3( sin( age * 0.7 + aIndex ), 0.0, cos( age * 0.5 + aIndex * 2.0 ) ) * min( age, 20.0 ) * 0.4;
	// Opening at the cloud: spreading and fading over some seconds.
	float opened = smoothstep( ${CLOUD}.0 - 10.0, ${CLOUD}.0, climb );
	float spread = 1.0 + 7.0 * smoothstep( 0.0, 6.0, age - ${CLOUD}.0 / 5.5 ) * opened;
	vAlpha = step( 0.0, age ) * smoothstep( 0.0, 2.0, age ) * ( 1.0 - smoothstep( 0.0, 6.0, age - ${CLOUD}.0 / 5.5 ) ) * ( 1.0 - uFade );
	vec4 view = viewMatrix * vec4( p, 1.0 );
	gl_Position = projectionMatrix * view;
	gl_PointSize = clamp( 2.2 * spread * 900.0 / max( - view.z, 1.0 ), 1.5, 120.0 );
}
`;
const lanternFragment = /* glsl */ `
uniform float uGain;
uniform float uDay;
varying float vAlpha;
void main() {
	float r = length( gl_PointCoord - 0.5 ) * 2.0;
	float glow = exp( - r * r * 4.0 ) * ( 1.0 - smoothstep( 0.8, 1.0, r ) );
	gl_FragColor = vec4( vec3( 1.0, 0.93, 0.82 ) * mix( uGain, 1.0, uDay ), glow * vAlpha * mix( 0.35, 0.6, uDay ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

export interface SkyAllFrame {
	time: number;
	boat: THREE.Vector3;
	ahead: THREE.Vector2;
	wind: THREE.Vector3;
	day: number;
	gain: number;
	sheath: THREE.Color[];
	at: ReturnType<typeof skyAllAt>;
}

function strips(count: number, segments: number, seeded: boolean) {
	const vertices = count * (segments + 1) * 2;
	const along = new Float32Array(vertices);
	const side = new Float32Array(vertices);
	const thread = new Float32Array(vertices * 4);
	for (let strip = 0; strip < count; strip++) {
		const own = [strip / count, Math.random(), Math.random(), Math.random()];
		for (let i = 0; i <= segments; i++) {
			for (let edge = 0; edge < 2; edge++) {
				const v = (strip * (segments + 1) + i) * 2 + edge;
				along[v] = i / segments;
				side[v] = edge ? 1 : -1;
				if (seeded) thread.set(own, v * 4);
			}
		}
	}
	const geometry = unplaced(new THREE.BufferGeometry());
	geometry.setAttribute("aT", new THREE.BufferAttribute(along, 1));
	geometry.setAttribute("aSide", new THREE.BufferAttribute(side, 1));
	if (seeded) geometry.setAttribute("aThread", new THREE.BufferAttribute(thread, 4));
	geometry.setIndex(stripIndices(count, segments));
	return geometry;
}

export function createSkyAll(scene: THREE.Scene, layer: number) {
	const shared = {
		uTime: { value: 0 },
		uBoat: { value: new THREE.Vector3() },
		uAhead: { value: new THREE.Vector2(0, -1) },
		uDay: { value: 0 },
		uGain: { value: 1 },
	};
	const kelpUniforms = {
		...shared,
		uWindDir: { value: new THREE.Vector3(1, 0, 0) },
		uGrow: { value: 0 },
		uSheath: { value: [new THREE.Color(), new THREE.Color(), new THREE.Color(), new THREE.Color()] },
		uResolution: { value: new THREE.Vector2(1, 1) },
		uPixelRatio: pixelRatio,
	};
	const kelp = new THREE.Mesh(
		strips(70, 60, true),
		new THREE.ShaderMaterial({ uniforms: kelpUniforms, vertexShader: kelpVertex, fragmentShader: threadFragment, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
	);
	const ribbonUniforms = { ...shared, uHands: { value: new THREE.Vector3() }, uThrow: { value: 0 }, uGone: { value: 0 } };
	const ribbon = new THREE.Mesh(
		strips(1, 200, false),
		new THREE.ShaderMaterial({ uniforms: ribbonUniforms, vertexShader: ribbonVertex, fragmentShader: ribbonFragment, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
	);
	const lanternGeometry = new THREE.BufferGeometry();
	lanternGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(LANTERNS * 3), 3));
	lanternGeometry.setAttribute("aIndex", new THREE.BufferAttribute(Float32Array.from({ length: LANTERNS }, (_, i) => i), 1));
	const lanternUniforms = { ...shared, uCycle: { value: 0 }, uFade: { value: 0 } };
	const lanterns = new THREE.Points(
		lanternGeometry,
		new THREE.ShaderMaterial({ uniforms: lanternUniforms, vertexShader: lanternVertex, fragmentShader: lanternFragment, transparent: true, depthWrite: false }),
	);
	const parts = [kelp, ribbon, lanterns];
	for (const part of parts) {
		part.frustumCulled = false;
		part.renderOrder = WEAVE_RENDER_ORDER;
		part.layers.set(layer);
		part.visible = false;
		scene.add(part);
	}
	const windDir = new THREE.Vector3();

	const update = (frame: SkyAllFrame) => {
		const { at } = frame;
		shared.uTime.value = frame.time;
		shared.uBoat.value.copy(frame.boat);
		shared.uAhead.value.copy(frame.ahead);
		shared.uDay.value = frame.day;
		shared.uGain.value = frame.gain;
		const blending = frame.day > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending;
		for (const part of parts) (part.material as THREE.ShaderMaterial).blending = blending;

		kelp.visible = at.kelp > 0.001;
		windDir.copy(frame.wind).setY(0);
		if (windDir.lengthSq() > 1e-6) windDir.normalize();
		kelpUniforms.uWindDir.value.copy(windDir);
		kelpUniforms.uGrow.value = at.kelp;
		frame.sheath.forEach((colour, i) => kelpUniforms.uSheath.value[i]!.copy(colour));
		kelpUniforms.uResolution.value.set(window.innerWidth, window.innerHeight).multiplyScalar(pixelRatio.value);

		ribbon.visible = at.ribbon > 0.001 && at.ribbonGone < 0.999;
		// From the strongest's hands, the seat right of the middle.
		ribbonUniforms.uHands.value.set(frame.boat.x - frame.ahead.y * 0.75, frame.boat.y - 1.2, frame.boat.z + frame.ahead.x * 0.75);
		ribbonUniforms.uThrow.value = at.ribbon;
		ribbonUniforms.uGone.value = at.ribbonGone;

		lanterns.visible = at.lanterns > 74 && at.lanterns < 150;
		lanternUniforms.uCycle.value = at.lanterns;
		lanternUniforms.uFade.value = at.release;
	};

	const dispose = () => {
		for (const part of parts) {
			scene.remove(part);
			part.geometry.dispose();
			(part.material as THREE.Material).dispose();
		}
	};

	return { update, dispose };
}
