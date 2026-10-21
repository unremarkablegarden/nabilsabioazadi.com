// The sentence for treason (the owner, 21 October: "the strongest channellers will try the others
// for treason; they will suddenly send bodies away from the boat into the POV and burn them in
// spheres of fire"). psyche.ts has the law and the trial; this is what is seen when it ends.
//
//   sent      in a moment, the condemned is thrown up from her seat on the boat, over the eye and
//             out before it: fast as she leaves, slowing as she goes, and falling at last far ahead;
//   burned    she is in a sphere of fire as she goes, its flames licking up and back off it, and
//             her body is seen in it, turning, darkening as it burns and lost in the fire;
//   the sea   where she falls into it the fire goes out.
// The fire is of the weather: it streams with the real wind, and the sphere is a body's size, not
// a sun's (realistic beauty).
import * as THREE from "three";
import { WEAVE_RENDER_ORDER } from "./weave";

// In the order of the minds (psyche.ts): the twelve's seats (SLOTS), the strongest's, Manulani's.
const SEAT_OF = [0, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 2, 13];
// How long from the boat to the sea (s), and the sphere's radius (m).
const FLIGHT = 9;
const RADIUS = 3.2;
// Whose each is (Siuan's, Leane's, Moiraine's), for the colour of her shawl.
const THIRD_OF = [0, 1, 0, 1, 2, 2, 1, 0, 2, 1, 0, 2, 0, 0];

const vertex = /* glsl */ `
uniform vec3 uCentre;
uniform float uRadius;
varying vec2 vAt;
varying float vFar;
void main() {
	// Always facing the eye, a little larger than the sphere so its flames have room.
	vec3 right = vec3( viewMatrix[ 0 ][ 0 ], viewMatrix[ 1 ][ 0 ], viewMatrix[ 2 ][ 0 ] );
	vec3 up = vec3( viewMatrix[ 0 ][ 1 ], viewMatrix[ 1 ][ 1 ], viewMatrix[ 2 ][ 1 ] );
	vAt = position.xy * 1.6;
	vec3 here = uCentre + ( right * position.x + up * position.y ) * uRadius * 1.6;
	vFar = length( uCentre - cameraPosition );
	gl_Position = projectionMatrix * viewMatrix * vec4( here, 1.0 );
}
`;

const fragment = /* glsl */ `
uniform float uTime;
uniform float uLife;
uniform float uSeed;
uniform float uSpin;
uniform float uQuench;
uniform float uGain;
uniform float uDay;
// Which way the real wind streams the flames, across the eye (x, y).
uniform vec2 uStream;
// Her shawl's colour: her third's.
uniform vec3 uShawl;
varying vec2 vAt;
varying float vFar;

float hash( vec3 p ) { return fract( sin( dot( p, vec3( 127.1, 311.7, 74.7 ) ) ) * 43758.5453 ); }
float noise( vec3 p ) {
	vec3 i = floor( p );
	vec3 f = fract( p );
	f = f * f * ( 3.0 - 2.0 * f );
	return mix( mix( mix( hash( i ), hash( i + vec3( 1, 0, 0 ) ), f.x ), mix( hash( i + vec3( 0, 1, 0 ) ), hash( i + vec3( 1, 1, 0 ) ), f.x ), f.y ),
		mix( mix( hash( i + vec3( 0, 0, 1 ) ), hash( i + vec3( 1, 0, 1 ) ), f.x ), mix( hash( i + vec3( 0, 1, 1 ) ), hash( i + vec3( 1, 1, 1 ) ), f.x ), f.y ), f.z );
}
float fbm( vec3 p ) {
	float sum = 0.0;
	float amp = 0.5;
	for ( int i = 0; i < 5; i ++ ) {
		sum += amp * noise( p );
		p = p * 2.03 + vec3( 1.7, 9.2, 3.1 );
		amp *= 0.5;
	}
	return sum;
}
float capsule( vec2 p, vec2 a, vec2 b, float r ) {
	vec2 pa = p - a;
	vec2 ba = b - a;
	return length( pa - ba * clamp( dot( pa, ba ) / dot( ba, ba ), 0.0, 1.0 ) ) - r;
}
// Her body, as an Aes Sedai is seen: a woman in a long gown flaring to its hem, her shawl over her
// shoulders and arms with its long fringe hanging, her hair streaming with the wind; turning
// slowly over in the fire. x: the body; y: the shawl (fringe and all).
vec2 body( vec2 p ) {
	float c = cos( uSpin );
	float s = sin( uSpin );
	p = mat2( c, - s, s, c ) * p;
	// Head, neck and the bodice, narrow at the waist.
	float d = length( p - vec2( 0.0, 0.6 ) ) - 0.095;
	d = min( d, capsule( p, vec2( 0.0, 0.5 ), vec2( 0.0, 0.34 ), 0.07 ) );
	d = min( d, capsule( p, vec2( 0.0, 0.36 ), vec2( 0.0, 0.1 ), 0.085 ) );
	// The gown: flaring from the waist to a wide hem, its hem blown in folds.
	float y = clamp( ( 0.1 - p.y ) / 0.92, 0.0, 1.0 );
	float wide = mix( 0.09, 0.4, pow( y, 0.8 ) ) + 0.03 * sin( p.y * 18.0 + uTime * 3.0 ) * y;
	float hem = - 0.82 + 0.05 * sin( p.x * 22.0 + uTime * 4.0 );
	d = min( d, max( abs( p.x + 0.06 * y * uStream.x ) - wide, max( p.y - 0.12, hem - p.y ) ) );
	// Her arms, out a little from her sides.
	d = min( d, capsule( p, vec2( 0.09, 0.38 ), vec2( 0.3, 0.12 ), 0.04 ) );
	d = min( d, capsule( p, vec2( - 0.09, 0.38 ), vec2( - 0.3, 0.12 ), 0.04 ) );
	// Her hair, long, streaming downwind from her head.
	vec2 flow = normalize( vec2( uStream.x, - 0.6 ) + vec2( 1e-4 ) );
	d = min( d, capsule( p, vec2( 0.0, 0.62 ), vec2( 0.0, 0.62 ) + flow * 0.42 + vec2( 0.0, 0.03 * sin( uTime * 5.0 ) ), 0.07 ) );
	// The shawl: over the shoulders and down along the arms, its fringe hanging from its edge.
	float ax = abs( p.x );
	float top = 0.46 - 0.85 * ax;
	float edge = 0.3 - 1.25 * ax;
	float shawl = max( max( p.y - top, edge - p.y ), ax - 0.33 );
	float fringe = max( max( p.y - edge, edge - 0.09 - p.y + 0.02 * sin( p.x * 31.0 + uTime * 6.0 ) ), max( ax - 0.33, abs( fract( p.x * 45.0 ) - 0.5 ) - 0.22 ) );
	return vec2( d, min( shawl, fringe ) );
}
// Fire's colour by its heat: deep red at its edges, orange, yellow, white at its heart.
vec3 heat( float h ) {
	return mix( mix( vec3( 0.45, 0.04, 0.0 ), vec3( 1.0, 0.36, 0.04 ), smoothstep( 0.0, 0.45, h ) ), mix( vec3( 1.0, 0.78, 0.3 ), vec3( 1.0, 0.96, 0.85 ), smoothstep( 0.8, 1.0, h ) ), smoothstep( 0.4, 0.8, h ) );
}

void main() {
	vec2 p = vAt;
	float r = length( p );
	// The flames stream off it with the wind and up, licking out past the sphere.
	vec2 stream = normalize( uStream + vec2( 0.0, 0.8 ) + vec2( 1e-4 ) );
	float downwind = max( 0.0, dot( p, stream ) );
	vec3 q = vec3( p * 2.6 - stream * uTime * 2.4, uTime * 0.9 + uSeed * 17.0 );
	float f = fbm( q );
	float reach = 1.0 + 0.55 * downwind * f + 0.25 * ( f - 0.5 );
	float edge = r / reach;
	// Hottest at its heart, roiling all through.
	float h = clamp( ( 1.0 - edge * edge ) * ( 0.55 + 0.9 * f ) + 0.25 * fbm( q * 1.7 + 4.0 ), 0.0, 1.0 );
	float alpha = smoothstep( 1.0, 0.75, edge ) * smoothstep( 0.05, 0.3, h );
	vec3 colour = heat( h );
	// Her in it, dark against the fire, burning away late in her fall: charred, the edges of her
	// glowing, then lost. Her shawl in her own colour, lit by the fire, burns first.
	float burnt = smoothstep( 0.45, 1.0, uLife );
	vec2 d = body( p );
	float left = 1.0 - burnt * smoothstep( 0.35, 0.65, f + 0.3 * burnt );
	float shape = smoothstep( 0.012, - 0.012, d.x ) * left;
	float shawl = smoothstep( 0.012, - 0.012, d.y ) * ( 1.0 - smoothstep( 0.2, 0.7, uLife ) * smoothstep( 0.3, 0.7, f ) );
	// (The fire thinner over her, so that she is seen in it.)
	colour = mix( colour, vec3( 0.05, 0.025, 0.02 ) + heat( 0.3 ) * 0.25 * burnt, shape * 0.95 );
	colour = mix( colour, uShawl * ( 0.55 + 0.6 * heat( 0.6 ) ), shawl * 0.9 );
	colour += heat( 0.6 ) * smoothstep( 0.025, 0.0, abs( d.x ) ) * shape * 0.8;
	alpha = max( alpha, max( shape, shawl ) * 0.95 );
	// Lit up into the dark by night; out where it meets the sea.
	alpha *= 1.0 - uQuench;
	alpha *= smoothstep( 3.0, 9.0, vFar );
	gl_FragColor = vec4( colour * mix( 1.6 * uGain, 1.2, uDay ), alpha );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

// Her seat, as the weaves place it (seatAt in five.ts), by her place among the minds.
export function seatOf(who: number, boat: THREE.Vector3, ahead: THREE.Vector3, across: THREE.Vector3) {
	const seat = SEAT_OF[who]!;
	if (seat > 12.5) return boat.clone().addScaledVector(ahead, 2.6).add(new THREE.Vector3(0, -0.8, 0));
	if (seat < 3.5) return boat.clone().addScaledVector(across, (seat - 1.5) * 1.5).addScaledVector(ahead, 0.5).add(new THREE.Vector3(0, -1.2, 0));
	const k = seat - 4;
	const side = (k % 2) * 2 - 1;
	const back = Math.floor(k / 2);
	return boat.clone().addScaledVector(across, side * (2.2 + 0.2 * back)).addScaledVector(ahead, -(1 + 1.6 * back)).add(new THREE.Vector3(0, -1.6, 0));
}

export interface TreasonFrame {
	time: number;
	delta: number;
	boat: THREE.Vector3;
	ahead: THREE.Vector2;
	wind: THREE.Vector3;
	camera: THREE.Camera;
	seaAt: (x: number, z: number) => number;
	day: number;
	gain: number;
	// The three's colours.
	tints: THREE.Color[];
}

export function createTreason(scene: THREE.Scene, layer: number) {
	const geometry = new THREE.PlaneGeometry(2, 2);
	// One fire kept in the scene, never shown, so that its shader is built while the page warms up
	// (OceanBackground's warmNext) and stays built: each sentence's fire is a copy of it and shares
	// the shader, where a fire of its own had to be built there and then, and the picture caught.
	const kept = new THREE.Mesh(geometry, new THREE.ShaderMaterial({ uniforms: { uCentre: { value: new THREE.Vector3() }, uRadius: { value: 0 }, uTime: { value: 0 }, uLife: { value: 0 }, uSeed: { value: 0 }, uSpin: { value: 0 }, uQuench: { value: 0 }, uGain: { value: 1 }, uDay: { value: 0 }, uStream: { value: new THREE.Vector2() }, uShawl: { value: new THREE.Color() } }, vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false }));
	kept.visible = false;
	kept.frustumCulled = false;
	kept.layers.set(layer);
	scene.add(kept);
	// Kept for each frame, rather than made anew.
	const ahead = new THREE.Vector3();
	const across = new THREE.Vector3();
	const right = new THREE.Vector3();
	const up = new THREE.Vector3();
	const wind = new THREE.Vector3();
	const burning: { who: number; mesh: THREE.Mesh; uniforms: Record<string, THREE.IUniform>; path: THREE.CubicBezierCurve3; age: number; spin: number; fell?: number }[] = [];
	// Those sentenced since the last frame, waiting for the boat's place to be known.
	const waiting: number[] = [];

	const send = (who: number) => waiting.push(who);

	const update = (frame: TreasonFrame | undefined) => {
		if (!frame) {
			for (const one of burning) one.mesh.visible = false;
			return;
		}
		if (!burning.length && !waiting.length) return;
		ahead.set(frame.ahead.x, 0, frame.ahead.y);
		across.set(-frame.ahead.y, 0, frame.ahead.x);
		// Sent: up from her seat over the eye, out before it, and down far ahead into the sea.
		for (const who of waiting.splice(0)) {
			const seat = seatOf(who, frame.boat, ahead, across);
			const side = Math.sign(seat.clone().sub(frame.boat).dot(across)) || 1;
			const lands = frame.boat.clone().addScaledVector(ahead, 340 + 80 * Math.random()).addScaledVector(across, side * (40 + 50 * Math.random()));
			lands.y = frame.seaAt(lands.x, lands.z) - 4;
			const path = new THREE.CubicBezierCurve3(
				seat,
				frame.boat.clone().addScaledVector(ahead, 6).addScaledVector(across, side * 2).add(new THREE.Vector3(0, 4, 0)),
				frame.boat.clone().addScaledVector(ahead, 40).addScaledVector(across, side * 6).add(new THREE.Vector3(0, 6, 0)),
				lands,
			);
			const uniforms = {
				uCentre: { value: seat.clone() },
				uRadius: { value: 0 },
				uTime: { value: 0 },
				uLife: { value: 0 },
				uSeed: { value: Math.random() },
				uSpin: { value: 0 },
				uQuench: { value: 0 },
				uGain: { value: 1 },
				uDay: { value: 0 },
				uStream: { value: new THREE.Vector2() },
				uShawl: { value: new THREE.Color() },
			};
			const material = (kept.material as THREE.ShaderMaterial).clone();
			material.uniforms = uniforms;
			const mesh = new THREE.Mesh(geometry, material);
			mesh.frustumCulled = false;
			mesh.renderOrder = WEAVE_RENDER_ORDER + 1;
			mesh.layers.set(layer);
			scene.add(mesh);
			burning.push({ who, mesh, uniforms, path, age: 0, spin: (Math.random() < 0.5 ? -1 : 1) * (0.35 + 0.3 * Math.random()) });
		}
		// The wind across the eye, for the flames to stream with.
		right.setFromMatrixColumn(frame.camera.matrixWorld, 0);
		up.setFromMatrixColumn(frame.camera.matrixWorld, 1);
		wind.copy(frame.wind).normalize();
		for (let i = burning.length - 1; i >= 0; i--) {
			const one = burning[i]!;
			one.age += frame.delta;
			const s = Math.min(1, one.age / FLIGHT);
			// Fast as she leaves the boat, slowing as she goes out.
			const along = 1 - (1 - s) ** 1.3;
			const centre = one.path.getPoint(along);
			const sea = frame.seaAt(centre.x, centre.z);
			// Into the sea, and the fire goes out.
			if (one.fell === undefined && s > 0.5 && centre.y < sea + RADIUS * 0.4) one.fell = one.age;
			const quench = one.fell === undefined ? 0 : Math.min(1, (one.age - one.fell) / 0.9);
			const u = one.uniforms;
			u.uCentre!.value.copy(centre);
			// Taking fire as she leaves her seat.
			u.uRadius!.value = RADIUS * THREE.MathUtils.smoothstep(one.age, 0, 0.5) * (1 - 0.4 * quench);
			u.uTime!.value = frame.time;
			u.uLife!.value = s;
			u.uSpin!.value = one.spin * one.age;
			u.uQuench!.value = quench;
			u.uGain!.value = frame.gain;
			u.uDay!.value = frame.day;
			u.uStream!.value.set(wind.dot(right), wind.dot(up));
			u.uShawl!.value.copy(frame.tints[THIRD_OF[one.who]!]!);
			(one.mesh.material as THREE.ShaderMaterial).blending = frame.day > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending;
			one.mesh.visible = true;
			if (quench >= 1 || one.age > FLIGHT + 2) {
				scene.remove(one.mesh);
				(one.mesh.material as THREE.Material).dispose();
				burning.splice(i, 1);
			}
		}
	};

	const dispose = () => {
		for (const one of burning) {
			scene.remove(one.mesh);
			(one.mesh.material as THREE.Material).dispose();
		}
		scene.remove(kept);
		(kept.material as THREE.Material).dispose();
		geometry.dispose();
	};

	return { send, update, dispose };
}
