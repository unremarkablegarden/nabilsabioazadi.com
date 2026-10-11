// The weave of light, drawn in the 3D scene so that it sits in the sky, passes behind wave
// crests and is mirrored in the water.
//
// It is made of threads, not particles: hard-edged lines a pixel or two wide. Some run alone,
// thin as needles. Others are plied together into something as wide as yarn, though still made of
// the same sharp fibres, which snap and rejoin as they go. They burst out from the viewer in a
// pack, and bright fronts keep racing up them towards a knot in the sky.
//
// All the threads are nearly the same pale warm white. Each element is told apart mostly by how
// it moves, and only lightly by tint:
//   air     needles in wide, loose, fast spirals that flutter
//   earth   yarn that climbs in heavy straight runs with hard corners, out of the deep
//   fire    needles that jag and flicker, never the same from one moment to the next
//   water   yarn in long, slow, rolling waves, out of the sea
//   metal   needles in dead-straight facets, with glints that run along them
//   akasha  fine, steady, tightly wound coils from the viewer themself
// The knot is a set of nested figures drawn with the same threads, turning about different axes.
import * as THREE from "three";

const AIR = 0;
const EARTH = 1;
const FIRE = 2;
const WATER = 3;
const METAL = 4;
const AKASHA = 5;
// Mixed 40% into the shared pale thread colour.
const TINTS = [0xc6dcff, 0xcdb98a, 0xffb07a, 0x8fd0ec, 0xbcc6d2, 0xfff0c4].map((hex) => new THREE.Color(hex));

const smooth = THREE.MathUtils.smoothstep;
// Drawn after the fog (see fluid.ts), so the threads stay sharp.
export const WEAVE_RENDER_ORDER = 10;

// Shared by both shaders: turns a centre line into a ribbon of a set width in pixels, facing the screen.
export const ribbonShaderChunk = /* glsl */ `
uniform vec2 uResolution;
uniform float uPixelRatio;

vec4 ribbonPosition( vec4 clip, vec4 clipAhead, float side, float widthPx ) {
	vec2 direction = ( clipAhead.xy / clipAhead.w - clip.xy / clip.w ) * uResolution;
	direction = normalize( direction + vec2( 1e-5, 0.0 ) );
	float width = widthPx * uPixelRatio * clamp( 300.0 / clip.w, 0.7, 2.6 );
	clip.xy += vec2( - direction.y, direction.x ) * side * width / uResolution * clip.w;
	return clip;
}

float hash1( float n ) {
	return fract( sin( n * 127.1 ) * 43758.5453 );
}

// Noise with straight runs and hard corners, -1..1.
float kink( float x ) {
	float i = floor( x );
	return mix( hash1( i ), hash1( i + 1.0 ), fract( x ) ) * 2.0 - 1.0;
}
`;

export const threadFragmentShader = /* glsl */ `
uniform float uGain;
uniform float uOpacity;
uniform vec3 uBase;
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;

void main() {
	// A hard edge, softened by no more than it takes to stop it shimmering.
	float edge = 1.0 - smoothstep( 0.55, 1.0, abs( vEdge ) );
	gl_FragColor = vec4( mix( uBase, vTint, 0.4 ) * uGain, edge * vAlpha * uOpacity );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

const threadVertexShader = /* glsl */ `
// Start of the thread, relative to the camera on the ground plane. w = 1: y is a height above
// sea level; w = 0: y is relative to the camera.
attribute vec4 aStart;
// Phase, sideways bow, upward bow, speed of the fronts that race along it.
attribute vec4 aShape;
// Element, width in pixels, angle of this fibre within its yarn (-1 for a lone needle), delay before it sets off.
attribute vec4 aKind;
attribute vec3 aSeed;
attribute float aT;
attribute float aSide;
uniform float uTime;
// 0..1 how far the pack has charged.
uniform float uGrow;
uniform vec3 uOrigin;
uniform vec3 uKnot;
uniform vec3 uTints[ 6 ];
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;
${ribbonShaderChunk}

vec3 threadPoint( float t ) {
	vec3 start = vec3( uOrigin.x, 0.0, uOrigin.z ) + aStart.xyz;
	if ( aStart.w < 0.5 ) start.y += uOrigin.y;
	vec3 axis = normalize( uKnot - start );
	vec3 side = normalize( cross( axis, vec3( 0.0, 1.0, 0.0 ) ) );
	vec3 up = cross( side, axis );
	// Widest in the middle of the run, gathered to a point at both ends.
	float arch = sin( 3.14159 * t );
	float taper = 1.0 - smoothstep( 0.7, 1.0, t );
	float phase = aShape.x;
	float element = aKind.x;
	vec3 p = mix( start, uKnot, t ) + ( side * aShape.y + up * aShape.z ) * arch;

	// Every shape travels towards the knot (the "- uTime" terms), so the whole thread drives forward.
	if ( element < 0.5 ) {
		float angle = t * 34.0 + phase - uTime * 2.2;
		float radius = ( 22.0 + 12.0 * sin( t * 9.0 + phase ) ) * ( 0.25 + arch ) * mix( 0.2, 1.0, taper );
		p += ( side * cos( angle ) + up * sin( angle ) ) * radius;
		p += side * kink( t * 60.0 - uTime * 8.0 + phase ) * 2.0 * arch;
	} else if ( element < 1.5 ) {
		p += side * kink( t * 7.0 - uTime * 0.6 + phase ) * 26.0 * arch;
		p += up * kink( t * 5.0 - uTime * 0.4 + phase * 2.0 ) * 14.0 * arch;
	} else if ( element < 2.5 ) {
		p += side * sin( t * 6.0 + phase ) * 30.0 * arch;
		p += ( side * kink( t * 40.0 - uTime * 14.0 + phase ) + up * kink( t * 33.0 - uTime * 11.0 + phase * 3.0 ) ) * 7.0 * arch;
	} else if ( element < 3.5 ) {
		p += side * sin( t * 14.0 - uTime * 2.4 + phase ) * 20.0 * arch;
		p += up * cos( t * 9.0 - uTime * 1.6 + phase ) * 9.0 * arch;
	} else if ( element < 4.5 ) {
		p += side * kink( t * 2.5 + phase ) * 18.0 * arch;
	} else {
		float angle = t * 90.0 + phase - uTime * 3.0;
		p += ( side * cos( angle ) + up * sin( angle ) ) * 4.0 * taper;
	}

	// The fibres of a yarn wind round each other, each with its own small cracks.
	if ( aKind.z >= 0.0 ) {
		float ply = t * 220.0 + aKind.z - uTime * 4.0;
		float reach = ( 1.8 + 0.8 * kink( t * 150.0 + aKind.z * 13.0 ) ) * ( 0.3 + arch );
		p += ( side * cos( ply ) + up * sin( ply ) ) * reach;
	}
	// The pounding of the charge: a fast, small shudder through every thread.
	p += ( side * kink( t * 18.0 - uTime * 20.0 + aSeed.x * 9.0 ) + up * kink( t * 15.0 - uTime * 17.0 + aSeed.y * 9.0 ) ) * 1.2 * arch;
	return p;
}

void main() {
	float t = aT;
	mat4 viewProjection = projectionMatrix * viewMatrix;
	vec4 clip = viewProjection * vec4( threadPoint( t ), 1.0 );
	vec4 clipAhead = viewProjection * vec4( threadPoint( t + 0.004 ), 1.0 );
	gl_Position = ribbonPosition( clip, clipAhead, aSide, aKind.y );

	float element = aKind.x;
	// The thread shoots out from its start once its turn comes, led by a bright tip.
	float grown = clamp( ( uGrow * 1.5 - aKind.w ) / 0.3, 0.0, 1.0 );
	float tip = grown < 1.0 ? smoothstep( grown - 0.05, grown, t ) : 0.0;
	// Fronts that race up the finished thread: each brightens to a sharp leading edge, then drops.
	float front = pow( fract( t * 1.5 - uTime * aShape.w + aSeed.y ), 6.0 );
	float brightness = 0.35 + 1.4 * front + 2.0 * tip;
	// Fire gutters; metal throws glints.
	if ( element > 1.5 && element < 2.5 ) brightness *= 0.5 + 0.8 * hash1( floor( uTime * 18.0 ) + aSeed.z * 50.0 );
	if ( element > 3.5 && element < 4.5 ) brightness += 3.0 * pow( max( 0.0, sin( t * 20.0 - uTime * 9.0 + aShape.x ) ), 40.0 );
	// Yarn fibres snap: short gaps that travel with the charge.
	float whole = aKind.z >= 0.0 ? step( 0.14, hash1( floor( t * 90.0 - uTime * aShape.w * 20.0 ) + aSeed.z * 100.0 ) ) : 1.0;

	vTint = uTints[ int( element + 0.5 ) ];
	vAlpha = step( t, grown ) * smoothstep( 0.0, 0.04, t ) * brightness * whole;
	vEdge = aSide;
}
`;

const figureVertexShader = /* glsl */ `
attribute vec3 aNext;
attribute float aTheta;
attribute float aSide;
uniform vec3 uTint;
uniform float uWidth;
uniform float uTime;
// Ripple that runs round the figure: depth, number of waves, speed.
uniform vec3 uWave;
// Number of dashes round the figure and how much of each is drawn. 0 dashes: an unbroken line.
uniform vec2 uDash;
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;
${ribbonShaderChunk}

void main() {
	float ripple = 1.0 + uWave.x * sin( uWave.y * aTheta - uTime * uWave.z );
	mat4 modelViewProjection = projectionMatrix * modelViewMatrix;
	vec4 clip = modelViewProjection * vec4( position * ripple, 1.0 );
	vec4 clipAhead = modelViewProjection * vec4( aNext * ripple, 1.0 );
	gl_Position = ribbonPosition( clip, clipAhead, aSide, uWidth );

	float turns = aTheta / 6.28319;
	float front = pow( fract( turns * 3.0 - uTime * 0.7 ), 4.0 );
	float dash = uDash.x > 0.0 ? step( fract( turns * uDash.x ), uDash.y ) : 1.0;
	vTint = uTint;
	vAlpha = ( 0.45 + 0.9 * front ) * dash;
	vEdge = aSide;
}
`;

// One ribbon strip per polyline: two vertices per point, joined into triangles.
export function stripIndices(strips: number, segments: number) {
	const indices: number[] = [];
	for (let strip = 0; strip < strips; strip++) {
		for (let i = 0; i < segments; i++) {
			const a = (strip * (segments + 1) + i) * 2;
			indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
		}
	}
	return indices;
}

interface Pack {
	element: number;
	count: number;
	// Width of each fibre in pixels, and fibres per thread (1 = a lone needle).
	width: number;
	fibres: number;
	// Centre of the starting area and how far threads are scattered round it (x, y, z).
	from: [number, number, number];
	scatter: [number, number, number];
	// Whether the starting height is above sea level (true) or relative to the camera.
	fromSea: boolean;
	bow: [number, number];
	speed: number;
}

const PACKS: Pack[] = [
	// From the wind, on both sides and above.
	{ element: AIR, count: 4, width: 1.1, fibres: 1, from: [-110, 30, -30], scatter: [50, 30, 40], fromSea: false, bow: [100, 60], speed: 1.2 },
	{ element: AIR, count: 4, width: 1.1, fibres: 1, from: [110, 35, -30], scatter: [50, 30, 40], fromSea: false, bow: [-100, 70], speed: 1.2 },
	// From the deep, below the sea ahead.
	{ element: EARTH, count: 2, width: 1.5, fibres: 6, from: [-70, -50, -120], scatter: [40, 10, 60], fromSea: true, bow: [40, 20], speed: 0.5 },
	{ element: EARTH, count: 2, width: 1.5, fibres: 6, from: [80, -50, -160], scatter: [40, 10, 60], fromSea: true, bow: [-40, 25], speed: 0.5 },
	// From close by the viewer, low on either flank.
	{ element: FIRE, count: 4, width: 1.2, fibres: 1, from: [-28, -6, -20], scatter: [14, 4, 10], fromSea: false, bow: [50, 40], speed: 1.4 },
	{ element: FIRE, count: 3, width: 1.2, fibres: 1, from: [28, -6, -20], scatter: [14, 4, 10], fromSea: false, bow: [-50, 45], speed: 1.4 },
	// Out of the surface of the sea ahead.
	{ element: WATER, count: 2, width: 1.4, fibres: 6, from: [-120, 0, -220], scatter: [50, 0, 90], fromSea: true, bow: [50, 45], speed: 0.7 },
	{ element: WATER, count: 2, width: 1.4, fibres: 6, from: [110, 0, -200], scatter: [50, 0, 90], fromSea: true, bow: [-55, 40], speed: 0.7 },
	// Skimming in level from far out on the flanks.
	{ element: METAL, count: 3, width: 1, fibres: 1, from: [-220, 6, -90], scatter: [40, 4, 50], fromSea: true, bow: [30, 10], speed: 1 },
	{ element: METAL, count: 3, width: 1, fibres: 1, from: [220, 6, -90], scatter: [40, 4, 50], fromSea: true, bow: [-30, 10], speed: 1 },
	// From the viewer.
	{ element: AKASHA, count: 4, width: 1.3, fibres: 1, from: [0, -11, -14], scatter: [9, 2, 3], fromSea: false, bow: [0, 26], speed: 0.9 },
];
const THREAD_SEGMENTS = 220;

function createThreads(shared: Record<string, THREE.IUniform>) {
	const strips = PACKS.reduce((sum, pack) => sum + pack.count * pack.fibres, 0);
	const count = strips * (THREAD_SEGMENTS + 1) * 2;
	const start = new Float32Array(count * 4);
	const shape = new Float32Array(count * 4);
	const kind = new Float32Array(count * 4);
	const seed = new Float32Array(count * 3);
	const along = new Float32Array(count);
	const side = new Float32Array(count);
	const spread = (range: number) => (Math.random() * 2 - 1) * range;
	let vertex = 0;
	for (const pack of PACKS) {
		for (let thread = 0; thread < pack.count; thread++) {
			// Everything a yarn's fibres share is chosen once per thread.
			const threadStart = [pack.from[0] + spread(pack.scatter[0]), pack.from[1] + spread(pack.scatter[1]), pack.from[2] + spread(pack.scatter[2]), pack.fromSea ? 1 : 0];
			const threadShape = [Math.random() * Math.PI * 2, pack.bow[0] * (0.6 + Math.random() * 0.8), pack.bow[1] * (0.6 + Math.random() * 0.8), pack.speed * (0.75 + Math.random() * 0.5)];
			const delay = Math.random();
			for (let fibre = 0; fibre < pack.fibres; fibre++) {
				const fibreKind = [pack.element, pack.width, pack.fibres > 1 ? (fibre / pack.fibres) * Math.PI * 2 : -1, delay];
				const fibreSeed = [Math.random(), Math.random(), Math.random()];
				for (let i = 0; i <= THREAD_SEGMENTS; i++) {
					for (const edge of [-1, 1]) {
						start.set(threadStart, vertex * 4);
						shape.set(threadShape, vertex * 4);
						kind.set(fibreKind, vertex * 4);
						seed.set(fibreSeed, vertex * 3);
						along[vertex] = i / THREAD_SEGMENTS;
						side[vertex] = edge;
						vertex++;
					}
				}
			}
		}
	}
	const geometry = new THREE.BufferGeometry();
	// The shader works out the real positions; three.js only needs the count.
	geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
	geometry.setAttribute("aStart", new THREE.BufferAttribute(start, 4));
	geometry.setAttribute("aShape", new THREE.BufferAttribute(shape, 4));
	geometry.setAttribute("aKind", new THREE.BufferAttribute(kind, 4));
	geometry.setAttribute("aSeed", new THREE.BufferAttribute(seed, 3));
	geometry.setAttribute("aT", new THREE.BufferAttribute(along, 1));
	geometry.setAttribute("aSide", new THREE.BufferAttribute(side, 1));
	geometry.setIndex(stripIndices(strips, THREAD_SEGMENTS));
	const uniforms = {
		...shared,
		uGrow: { value: 0 },
		uOrigin: { value: new THREE.Vector3() },
		uKnot: { value: new THREE.Vector3() },
		uTints: { value: TINTS },
	};
	const mesh = new THREE.Mesh(geometry, lineMaterial(uniforms, threadVertexShader));
	mesh.frustumCulled = false;
	mesh.renderOrder = WEAVE_RENDER_ORDER;
	return { mesh, uniforms };
}

function lineMaterial(uniforms: Record<string, THREE.IUniform>, vertexShader: string) {
	return new THREE.ShaderMaterial({
		uniforms,
		vertexShader,
		fragmentShader: threadFragmentShader,
		transparent: true,
		depthWrite: false,
		side: THREE.DoubleSide,
		blending: THREE.AdditiveBlending,
	});
}

type Curve = (theta: number) => [number, number, number];

const circle = (radius: number): Curve => (theta) => [radius * Math.cos(theta), radius * Math.sin(theta), 0];
// A ring pinched into petals.
const rose =
	(radius: number, depth: number, petals: number): Curve =>
	(theta) => {
		const r = radius * (1 + depth * Math.cos(petals * theta));
		return [r * Math.cos(theta), r * Math.sin(theta), 0];
	};
// A figure with straight sides drawn in one stroke: `points` corners, joining every `skip`-th one.
// skip 1 is a plain polygon, more is a star.
const star =
	(radius: number, points: number, skip: number): Curve =>
	(theta) => {
		const along = (theta / (Math.PI * 2)) * points;
		const corner = (i: number) => (i * skip * Math.PI * 2) / points;
		const from = corner(Math.floor(along));
		const to = corner(Math.floor(along) + 1);
		const f = along % 1;
		return [
			radius * THREE.MathUtils.lerp(Math.cos(from), Math.cos(to), f),
			radius * THREE.MathUtils.lerp(Math.sin(from), Math.sin(to), f),
			0,
		];
	};
// A closed loop that winds through itself.
const torusKnot =
	(radius: number, tube: number, p: number, q: number): Curve =>
	(theta) => {
		const r = radius + tube * Math.cos(q * theta);
		return [r * Math.cos(p * theta), r * Math.sin(p * theta), tube * Math.sin(q * theta)];
	};
// Goes round a curve several times, a little off each lap, like a loop drawn over and over by hand.
const scribble =
	(curve: Curve, laps: number): Curve =>
	(theta) => {
		const wobble = 1 + 0.05 * Math.sin((theta * laps * 3) / laps + theta * laps * 0.37) + 0.03 * Math.sin(theta * laps * 2.3);
		const [x, y, z] = curve(theta * laps);
		return [x * wobble, y * wobble, z + 0.03 * Math.sin(theta * laps * 1.7)];
	};

interface Figure {
	element: number;
	curve: Curve;
	points: number;
	width: number;
	// Starting tilt (x, y) and the local axis it turns about, with its speed in radians a second.
	tilt?: [number, number];
	axis: [number, number, number];
	speed: number;
	wave?: [number, number, number];
	// Broken into this many short dashes thrown off round the knot; widens as the storm builds.
	dashes?: number;
}

// Sizes are fractions of the knot's radius, from the outside in.
const FIGURES: Figure[] = [
	// Air: three great loops that tumble like a gyroscope, each about its own axis.
	{ element: AIR, curve: scribble(circle(1), 3), points: 900, width: 1, tilt: [1.1, 0.2], axis: [1, 0.3, 0], speed: 0.5, wave: [0.015, 24, 6] },
	{ element: AIR, curve: scribble(circle(0.93), 2), points: 700, width: 1, tilt: [0.3, 1.2], axis: [0.2, 1, 0.3], speed: -0.7, wave: [0.015, 18, -5] },
	{ element: AIR, curve: scribble(circle(0.86), 2), points: 700, width: 1, tilt: [-0.8, -0.6], axis: [0.5, -0.4, 1], speed: 0.9, wave: [0.02, 30, 7] },
	// Water: petalled loops that turn against each other while waves run round them.
	{ element: WATER, curve: scribble(rose(0.74, 0.12, 6), 2), points: 900, width: 1.5, axis: [0, 0, 1], speed: -0.25, wave: [0.05, 12, 2] },
	{ element: WATER, curve: scribble(rose(0.6, 0.2, 4), 2), points: 800, width: 1.5, axis: [0, 0, 1], speed: 0.35, wave: [0.06, 8, -2.5] },
	// Earth: heavy, slow, straight-sided.
	{ element: EARTH, curve: star(0.68, 6, 1), points: 360, width: 2.2, axis: [0, 0, 1], speed: 0.08 },
	{ element: EARTH, curve: star(0.52, 4, 1), points: 280, width: 2.2, tilt: [0.5, 0.3], axis: [0.2, 0.3, 1], speed: -0.12 },
	// Fire: a many-pointed star that never holds still.
	{ element: FIRE, curve: star(0.47, 9, 4), points: 720, width: 1.1, axis: [0, 0, 1], speed: 0.6, wave: [0.07, 41, 19] },
	// Metal: two exact triangles turning against each other.
	{ element: METAL, curve: star(0.38, 3, 1), points: 240, width: 1, axis: [0, 0, 1], speed: 0.4 },
	{ element: METAL, curve: star(0.38, 3, 1), points: 240, width: 1, axis: [0, 0, 1], speed: -0.4 },
	// Akasha: a still star at the heart, and a knot at the very centre.
	{ element: AKASHA, curve: star(0.25, 5, 2), points: 400, width: 1.2, axis: [0, 0, 1], speed: -0.2 },
	{ element: AKASHA, curve: torusKnot(0.11, 0.045, 2, 3), points: 500, width: 1.2, axis: [0.6, 1, 0.2], speed: 1.4 },
	// Short lengths of thread flung off round the knot.
	{ element: AKASHA, curve: circle(1.3), points: 600, width: 1.6, axis: [0, 0, 1], speed: 0.25, wave: [0.06, 7, 1], dashes: 38 },
	{ element: AIR, curve: circle(1.65), points: 600, width: 1.5, axis: [0, 0, 1], speed: -0.18, wave: [0.07, 5, -1], dashes: 31 },
	{ element: METAL, curve: circle(2.05), points: 600, width: 1.4, axis: [0, 0, 1], speed: 0.12, wave: [0.08, 9, 0.7], dashes: 27 },
];

function createFigure(figure: Figure, shared: Record<string, THREE.IUniform>) {
	const count = (figure.points + 1) * 2;
	const position = new Float32Array(count * 3);
	const next = new Float32Array(count * 3);
	const theta = new Float32Array(count);
	const side = new Float32Array(count);
	for (let i = 0; i <= figure.points; i++) {
		const angle = (i / figure.points) * Math.PI * 2;
		const here = figure.curve(angle);
		const ahead = figure.curve(angle + (Math.PI * 2) / figure.points);
		for (const [j, edge] of [-1, 1].entries()) {
			const vertex = i * 2 + j;
			position.set(here, vertex * 3);
			next.set(ahead, vertex * 3);
			theta[vertex] = angle;
			side[vertex] = edge;
		}
	}
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
	geometry.setAttribute("aNext", new THREE.BufferAttribute(next, 3));
	geometry.setAttribute("aTheta", new THREE.BufferAttribute(theta, 1));
	geometry.setAttribute("aSide", new THREE.BufferAttribute(side, 1));
	geometry.setIndex(stripIndices(1, figure.points));
	const mesh = new THREE.Mesh(
		geometry,
		lineMaterial(
			{
				...shared,
				uTint: { value: TINTS[figure.element] },
				uWidth: { value: figure.width },
				uWave: { value: new THREE.Vector3(...(figure.wave ?? [0, 0, 0])) },
				uDash: { value: new THREE.Vector2(figure.dashes ?? 0, 0.22) },
			},
			figureVertexShader,
		),
	);
	mesh.frustumCulled = false;
	mesh.renderOrder = WEAVE_RENDER_ORDER;
	if (figure.tilt) mesh.rotation.set(figure.tilt[0], figure.tilt[1], 0);
	return mesh;
}

export interface WeaveState {
	time: number;
	delta: number;
	// 0..1 how far the weave has been drawn: the threads first, then the knot.
	amount: number;
	// 0 and up: how far the storm has swollen the knot.
	spread: number;
	// Multiplies the light so it holds its brightness at any exposure.
	gain: number;
}

// 0..1 how much of the knot has formed for a given weave amount.
export const knotFormed = (amount: number) => smooth(amount, 0.4, 1);

export function createWeave(scene: THREE.Scene, camera: THREE.Camera, knotPosition: THREE.Vector3) {
	// Uniform objects shared by every material, so one write updates them all.
	const shared = {
		uTime: { value: 0 },
		uGain: { value: 1 },
		uOpacity: { value: 0 },
		uBase: { value: new THREE.Color(0xf4ecd6) },
		uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
		uResolution: { value: new THREE.Vector2(1, 1) },
	};
	const threads = createThreads(shared);
	scene.add(threads.mesh);

	const knot = new THREE.Group();
	const figures = FIGURES.map((figure) => ({ figure, mesh: createFigure(figure, shared), axis: new THREE.Vector3(...figure.axis).normalize() }));
	for (const { mesh } of figures) knot.add(mesh);
	knot.position.copy(knotPosition);
	scene.add(knot);

	const update = ({ time, delta, amount, spread, gain }: WeaveState) => {
		const visible = amount > 0;
		threads.mesh.visible = visible;
		knot.visible = visible;
		if (!visible) return;
		shared.uTime.value = time;
		shared.uGain.value = gain;
		shared.uOpacity.value = Math.min(1, amount * 4);
		shared.uResolution.value.set(window.innerWidth, window.innerHeight).multiplyScalar(shared.uPixelRatio.value);
		threads.uniforms.uGrow.value = smooth(amount, 0, 0.5);
		threads.uniforms.uOrigin.value.copy(camera.position);
		threads.uniforms.uKnot.value.copy(knotPosition);

		const formed = knotFormed(amount);
		knot.lookAt(camera.position);
		knot.scale.setScalar(Math.max(1e-3, formed * 55 * (1 + 1.6 * spread)));
		for (const { figure, mesh, axis } of figures) {
			mesh.rotateOnAxis(axis, figure.speed * (1 + spread) * delta);
			if (figure.dashes) mesh.scale.setScalar(1 + 0.8 * spread);
		}
	};

	return { update };
}
