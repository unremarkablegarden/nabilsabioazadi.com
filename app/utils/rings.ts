// The rings the flow sheds (channellers.ts, CLEAN: the owner, 23 October, from a film of two vortex
// rings reconnecting and a stretched loop breaking into a chain of small rings, and the beaded ring
// of the Cerîde-i Adliye cosmogram). The flow keeps its order only by spending, and what it spends
// leaves it as small vortex rings that pinch off its far reach and go: the disorder carried away.
//
//   born      where the flow is spent, out over the water, as often as the flow is working hard
//             and the sea and wind feed it (each ring a quantum of what it lets go);
//   going     a vortex ring carries itself along its own axis, onward and a little up, the wind
//             taking it too; it slowly widens and slows as it goes;
//   its form  a glass tube closed on itself: filaments on the shell of its core, so it is bright at
//             its rims and clear through, as a bubble ring is; a standing wave of a whole number of
//             crests runs round it (3 to 6), as on the cosmogram's ring, and slowly turns;
//   gone      it thins and fades into the air over some ten to sixteen seconds.
// Soft, never a hard line: nothing jagged, nothing flashing.
import * as THREE from "three";
import { pixelRatio, ribbonShaderChunk, stripIndices, unplaced, WEAVE_RENDER_ORDER } from "./weave";

const RINGS = 24;
const FILAMENTS = 16;
const SEGMENTS = 120;

const vertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute vec2 aCell;
uniform float uTime;
// Each ring: its centre and radius (m); its axis and how far through its life it is; its
// standing wave's number of crests, its phase, and how far it leans.
uniform vec4 uRing[ ${RINGS} ];
uniform vec4 uAxis[ ${RINGS} ];
uniform vec4 uMode[ ${RINGS} ];
uniform float uDay;
varying float vAlpha;
varying float vEdge;
${ribbonShaderChunk}

vec3 ringAt( int i, float t ) {
	vec4 ring = uRing[ i ];
	vec3 axis = normalize( uAxis[ i ].xyz + vec3( 1e-4 ) );
	vec3 u = normalize( cross( axis, abs( axis.y ) < 0.9 ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 ) ) );
	vec3 v = cross( axis, u );
	float a = t * 6.28318;
	vec4 mode = uMode[ i ];
	// A standing wave of mode n round it: the radius breathes in and out n times, and the ring
	// bends a little along its axis with it.
	float wave = sin( mode.x * a + mode.y );
	// (Gently: at more than a few per cent its crests read as corners, a polygon, from far off.)
	float r = ring.w * ( 1.0 + 0.025 * wave );
	vec3 centreLine = ring.xyz + ( u * cos( a ) + v * sin( a ) ) * r + axis * ring.w * 0.06 * wave * mode.z;
	// On the shell of its core, each filament at its own place round it.
	float f = aCell.y / ${FILAMENTS}.0 * 6.28318 + a * 2.0 + uTime * 0.6;
	vec3 radial = u * cos( a ) + v * sin( a );
	float core = 0.16 * ring.w;
	return centreLine + ( radial * cos( f ) + axis * sin( f ) ) * core;
}

void main() {
	int i = int( aCell.x + 0.5 );
	float life = uAxis[ i ].w;
	vec3 here = ringAt( i, aT );
	vec3 next = ringAt( i, aT + 0.004 );
	float far = length( here - cameraPosition );
	// Pinching off, then thinning away.
	float shown = smoothstep( 0.0, 0.12, life ) * ( 1.0 - smoothstep( 0.55, 1.0, life ) );
	shown *= life > 0.0 && life < 1.0 ? 1.0 : 0.0;
	shown *= smoothstep( 15.0, 60.0, far ) * exp( - far / 4000.0 );
	vAlpha = shown;
	vEdge = aSide;
	mat4 vp = projectionMatrix * viewMatrix;
	gl_Position = ribbonPosition( vp * vec4( here, 1.0 ), vp * vec4( next, 1.0 ), aSide, mix( 1.6, 2.0, uDay ) );
}
`;

const fragment = /* glsl */ `
uniform float uGain;
uniform float uDay;
uniform float uWhite;
uniform vec3 uTint;
varying float vAlpha;
varying float vEdge;
void main() {
	float across = abs( vEdge );
	float body = pow( max( 1.0 - across * across, 0.0 ), 1.5 );
	gl_FragColor = vec4( mix( uTint * uGain, uTint * uWhite, uDay ), body * vAlpha * mix( 0.07, 0.12, uDay ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

export interface RingsFrame {
	time: number;
	delta: number;
	// 0..1 how hard the flow is working, and how much the sea and wind are feeding it.
	working: number;
	energy: number;
	// Where along the flow it is spent (a point on the flow, from channellers' flowPoint).
	spentAt: (ahead: number, out: THREE.Vector3) => THREE.Vector3;
	boat: THREE.Vector3;
	wind: THREE.Vector3;
	day: number;
	gain: number;
	white: number;
}

export function createRings(scene: THREE.Scene, layer: number) {
	// A ring of filaments each, closed on itself.
	const count = RINGS * FILAMENTS;
	const vertices = count * (SEGMENTS + 1) * 2;
	const along = new Float32Array(vertices);
	const side = new Float32Array(vertices);
	const cells = new Float32Array(vertices * 2);
	let v = 0;
	for (let ring = 0; ring < RINGS; ring++)
		for (let filament = 0; filament < FILAMENTS; filament++)
			for (let i = 0; i <= SEGMENTS; i++)
				for (const edge of [-1, 1]) {
					along[v] = i / SEGMENTS;
					side[v] = edge;
					cells[v * 2] = ring;
					cells[v * 2 + 1] = filament;
					v++;
				}
	const geometry = unplaced(new THREE.BufferGeometry());
	geometry.setAttribute("aT", new THREE.BufferAttribute(along, 1));
	geometry.setAttribute("aSide", new THREE.BufferAttribute(side, 1));
	geometry.setAttribute("aCell", new THREE.BufferAttribute(cells, 2));
	geometry.setIndex(stripIndices(count, SEGMENTS));
	const uniforms = {
		uTime: { value: 0 },
		uRing: { value: Array.from({ length: RINGS }, () => new THREE.Vector4()) },
		uAxis: { value: Array.from({ length: RINGS }, () => new THREE.Vector4(0, 0, 1, -1)) },
		uMode: { value: Array.from({ length: RINGS }, () => new THREE.Vector4(3, 0, 0, 0)) },
		uDay: { value: 0 },
		uGain: { value: 1 },
		uWhite: { value: 1 },
		// The flow's own pale blue-white.
		uTint: { value: new THREE.Color(0xcdd9ec) },
		uResolution: { value: new THREE.Vector2(1, 1) },
		uPixelRatio: pixelRatio,
	};
	const mesh = new THREE.Mesh(geometry, new THREE.ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
	mesh.frustumCulled = false;
	mesh.renderOrder = WEAVE_RENDER_ORDER;
	mesh.layers.set(layer);
	mesh.visible = false;
	scene.add(mesh);

	type Ring = { age: number; life: number; at: THREE.Vector3; axis: THREE.Vector3; radius: number; speed: number; mode: number; turn: number; lean: number };
	const rings: (Ring | undefined)[] = new Array(RINGS).fill(undefined);
	let owed = 0;
	const born = new THREE.Vector3();
	const update = (frame: RingsFrame | undefined) => {
		if (!frame) {
			mesh.visible = false;
			return;
		}
		const dt = Math.min(frame.delta, 0.1);
		// What the flow lets go, a ring at a time: up to one every couple of seconds when it works its hardest.
		owed += dt * frame.working * (0.15 + 0.35 * Math.min(1, frame.energy));
		if (owed >= 1) {
			owed -= 1;
			const free = rings.findIndex((one) => !one);
			if (free >= 0) {
				frame.spentAt(140 + 360 * Math.random(), born);
				const onward = born.clone().sub(frame.boat).setY(0).normalize();
				rings[free] = {
					age: 0,
					life: 10 + 6 * Math.random(),
					at: born.clone().add(new THREE.Vector3((Math.random() - 0.5) * 30, 2 + 6 * Math.random(), (Math.random() - 0.5) * 30)),
					axis: onward.add(new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.25 + 0.2 * Math.random(), (Math.random() - 0.5) * 0.4)).normalize(),
					radius: 5 + 4 * Math.random(),
					speed: 4 + 3 * Math.random(),
					mode: 3 + Math.floor(Math.random() * 4),
					turn: (Math.random() < 0.5 ? -1 : 1) * (0.2 + 0.3 * Math.random()),
					lean: Math.random() < 0.5 ? -1 : 1,
				};
			}
		}
		let any = false;
		rings.forEach((ring, i) => {
			if (!ring) {
				uniforms.uAxis.value[i]!.w = -1;
				return;
			}
			ring.age += dt;
			const life = ring.age / ring.life;
			if (life >= 1) {
				rings[i] = undefined;
				uniforms.uAxis.value[i]!.w = -1;
				return;
			}
			// It carries itself along its axis, slowing as it widens; the wind takes it too.
			const speed = ring.speed / (1 + life * 1.5);
			ring.at.addScaledVector(ring.axis, speed * dt).addScaledVector(frame.wind, 0.15 * dt);
			const radius = ring.radius * (1 + 0.8 * life);
			uniforms.uRing.value[i]!.set(ring.at.x, ring.at.y, ring.at.z, radius);
			uniforms.uAxis.value[i]!.set(ring.axis.x, ring.axis.y, ring.axis.z, life);
			uniforms.uMode.value[i]!.set(ring.mode, ring.turn * ring.age, ring.lean, 0);
			any = true;
		});
		uniforms.uTime.value = frame.time;
		uniforms.uDay.value = frame.day;
		uniforms.uGain.value = frame.gain;
		uniforms.uWhite.value = frame.white;
		uniforms.uResolution.value.set(window.innerWidth, window.innerHeight).multiplyScalar(pixelRatio.value);
		(mesh.material as THREE.ShaderMaterial).blending = frame.day > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending;
		mesh.visible = any;
	};

	const dispose = () => {
		scene.remove(mesh);
		(mesh.material as THREE.Material).dispose();
		geometry.dispose();
	};

	return { update, dispose };
}
