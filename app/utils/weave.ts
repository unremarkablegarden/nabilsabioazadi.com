// The weave of light, drawn in the 3D scene so that it sits in the sky, passes behind wave
// crests and is mirrored in the water.
//
// It is made of threads, not particles: hard-edged lines a pixel or two wide. Some run alone,
// thin as needles. Others are plied together into something as wide as yarn, though still made of
// the same sharp fibres, which snap and rejoin as they go.
//
// They come from one person: from the two open palms of someone standing just behind the camera.
// Off each palm the threads start spread like fingers. What each hand holds is a tapestry that
// has not been finished:
//   warp   many threads lying side by side along the length of the piece. More join as it goes.
//   weft   threads that cross from edge to edge and back. They are only there in patches.
// Where there is weft the warp is held evenly and the cloth is whole; between the patches the
// warp hangs loose and wanders. The two pieces are drawn together into one before the knot.
//
// They gather strength the way a bird's call does on a sound diagram: a run of notes, each louder
// and sooner than the last and each pitched a little higher. Every note is a front of light that
// travels up the threads with a short ripple behind it, tighter with each note; then a rest, and
// the call again. Along its length, too, the weave thickens and brightens as it goes.
// The left hand works air, earth and fire; the right hand water, metal and akasha.
//
// All the threads are nearly the same pale warm white, with only a light tint for each element.
// Earth and water are drawn a little heavier. Fire gutters and metal throws glints.
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

// How many pixels of the picture are drawn to each pixel of the page. One object, shared by
// everything whose size is counted in pixels (the widths of threads, the sizes of stars),
// because the picture is drawn with fewer when the machine cannot keep up: see watchFrameRate
// in OceanBackground.vue, which sets it.
export const pixelRatio = { value: 1 };

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

// 0..1 whether a point is seen against the sky and not the sea: it is, once it stands above
// the eye's own height, which is where the horizon lies. Eased in gradually, from a little under
// the horizon to some ten degrees above it. (It was all at once, at the horizon itself: and the
// eye rides the waves, so on every weave rising from the boat the place where it turned from a
// fine line to a broad blur slid up and down with each wave, and the weave shuddered.)
float againstSky( vec3 p ) {
	float rise = ( p.y - cameraPosition.y ) / max( length( p.xz - cameraPosition.xz ), 1.0 );
	return smoothstep( - 0.03, 0.18, rise );
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
// The palm the thread leaves from, relative to the camera.
attribute vec3 aStart;
// Unused, sideways bow, upward bow, unused.
attribute vec4 aShape;
// Element, width in pixels, unused, delay before it sets off.
attribute vec4 aKind;
// Warp: where across the piece it lies (-1..1). Weft: where in its crossing it starts.
// Then 0 for warp or 1 for weft, which hand (-1 left, 1 right), and the angle it leaves the palm at.
attribute vec4 aBraid;
// Two random numbers, and how far along the piece this thread joins it (0 = from the hand).
attribute vec3 aSeed;
attribute float aT;
attribute float aSide;
uniform float uTime;
// 0..1 how far the pack has charged.
uniform float uGrow;
// Seconds into the current call.
uniform float uCall;
// 0..1 how much of the knot has formed.
uniform float uFormed;
uniform vec3 uOrigin;
uniform vec3 uKnot;
uniform vec3 uTints[ 6 ];
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;
${ribbonShaderChunk}

// 0..1 how fully woven the piece is at a point along it: in patches, more towards the knot.
float woven( float t ) {
	float patches = sin( t * 19.0 + aBraid.z * 2.3 - uTime * 0.07 ) * 0.6 + sin( t * 7.3 + aBraid.z - uTime * 0.04 ) * 0.4;
	return smoothstep( 0.1, 0.25, t ) * smoothstep( - 0.25, 0.45, patches + ( t - 0.5 ) * 1.2 );
}

// The call: eight notes, each sooner, louder, faster and higher than the one before.
// Returns how bright the note passing this point makes it (x) and how far it shakes it (y).
vec2 call( float t ) {
	vec2 sum = vec2( 0.0 );
	float starts = 0.0;
	float gap = 0.55;
	for ( int i = 0; i < 8; i ++ ) {
		float n = float( i );
		float loud = pow( ( n + 1.0 ) / 8.0, 1.5 );
		// Where this note's front has got to, and how far behind it this point is.
		float behind = ( uCall - starts ) * ( 0.7 + 0.12 * n ) - t;
		if ( behind > 0.0 && behind < 0.3 ) {
			float front = exp( - behind * behind / ( 0.002 + 0.0007 * ( 8.0 - n ) ) );
			sum.x += loud * front;
			sum.y += loud * exp( - behind * 22.0 ) * sin( behind * ( 70.0 + 30.0 * n ) );
		}
		starts += gap;
		gap *= 0.8;
	}
	return sum;
}

vec3 threadPoint( float t ) {
	vec3 palm = uOrigin + aStart;
	// Both hands' work is drawn in towards one line, from between the palms to the knot.
	vec3 between = uOrigin + vec3( 0.0, aStart.y, aStart.z );
	float gathered = smoothstep( 0.3, 0.68, t );
	vec3 start = mix( palm, between, gathered );
	vec3 axis = normalize( uKnot - between );
	vec3 side = normalize( cross( axis, vec3( 0.0, 1.0, 0.0 ) ) );
	vec3 up = cross( side, axis );
	// Widest in the middle of the run, gathered to a point at the knot.
	float arch = sin( 3.14159 * t );
	float taper = 1.0 - smoothstep( 0.82, 1.0, t );
	vec3 p = mix( start, uKnot, t ) + side * aShape.y * ( 1.0 - gathered ) * arch;
	// Seen from so close to where they start, threads going straight to the knot would be looked
	// along, not at. So they run out low over the water first and only then sweep up to it.
	p.y = mix( start.y, uKnot.y, pow( t, 2.6 ) ) + aShape.z * 0.25 * arch;

	// Off the open palm the threads are spread like fingers, and close up as they are taken in hand.
	float spread = 1.0 - smoothstep( 0.0, 0.14, t );
	p += ( side * sin( aBraid.w ) + up * 0.45 * cos( aBraid.w ) ) * 9.0 * spread;

	// Once the two pieces meet they lie one each side of the line, not through each other.
	p += side * aBraid.z * 7.0 * gathered * taper;

	// Half the width of the piece: broad at first, drawn narrow towards the knot.
	float reach = mix( 13.0, 4.0, smoothstep( 0.35, 1.0, t ) ) * smoothstep( 0.0, 0.12, t ) * taper;
	float whole = woven( t );
	float across;
	float lift;
	if ( aBraid.y < 0.5 ) {
		// Warp. Held in its place where the cloth is woven; loose and wandering where it is not.
		float wander = sin( t * 11.0 + aSeed.x * 40.0 - uTime * 0.5 ) * 0.6 + sin( t * 27.0 + aSeed.y * 40.0 + uTime * 0.3 ) * 0.4;
		across = aBraid.x + ( 1.0 - whole ) * 0.75 * wander;
		// Loose threads sag and lift; woven ones only dip under and over each weft in turn.
		lift = ( 1.0 - whole ) * 4.0 * sin( t * 13.0 + aSeed.y * 30.0 - uTime * 0.4 )
			+ whole * 0.45 * sin( t * 420.0 + aBraid.x * 40.0 );
	} else {
		// Weft. Crosses from one edge to the other and back, again and again.
		across = abs( fract( t * 34.0 + aBraid.x ) * 2.0 - 1.0 ) * 2.0 - 1.0;
		lift = 0.45 * sin( t * 34.0 * 6.28318 * 3.0 );
	}
	p += side * across * reach + up * lift;

	// The note passing through shakes the thread.
	p += up * call( t ).y * 3.0 * arch;
	return p;
}

void main() {
	float t = aT;
	mat4 viewProjection = projectionMatrix * viewMatrix;
	vec4 clip = viewProjection * vec4( threadPoint( t ), 1.0 );
	vec4 clipAhead = viewProjection * vec4( threadPoint( t + 0.004 ), 1.0 );
	// The threads fatten as the weave gathers strength along its length.
	gl_Position = ribbonPosition( clip, clipAhead, aSide, aKind.y * ( 0.8 + 0.7 * t ) );

	float element = aKind.x;
	// The thread shoots out from its start once its turn comes, led by a bright tip.
	float grown = clamp( ( uGrow * 1.5 - aKind.w ) / 0.3, 0.0, 1.0 );
	float tip = grown < 1.0 ? smoothstep( grown - 0.05, grown, t ) : 0.0;
	// Faint near the hands, stronger as it goes; and lit by each note of the call as it passes.
	float brightness = 0.18 + 0.4 * t + 1.6 * call( t ).x + 2.0 * tip;
	// Fire gutters; metal throws glints.
	if ( element > 1.5 && element < 2.5 ) brightness *= 0.5 + 0.8 * hash1( floor( uTime * 18.0 ) + aSeed.x * 50.0 );
	if ( element > 3.5 && element < 4.5 ) brightness += 2.0 * pow( max( 0.0, sin( t * 20.0 - uTime * 9.0 + aSeed.y * 6.0 ) ), 40.0 );
	// Some warp threads only join part of the way along. Weft is only there where the cloth is woven.
	float present = smoothstep( aSeed.z, aSeed.z + 0.05, t );
	if ( aBraid.y > 0.5 ) present *= smoothstep( 0.35, 0.7, woven( t ) );

	vTint = uTints[ int( element + 0.5 ) ];
	// Until there is a knot for them to run into, the threads thin away to nothing before they
	// reach its place. Gathered there they made a bright point in the sky, a false sun.
	float ending = mix( 1.0 - smoothstep( 0.6, 0.95, t ), 1.0, uFormed );
	vAlpha = step( t, grown ) * smoothstep( 0.0, 0.04, t ) * brightness * present * ending;
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

// The palms, relative to the camera: a little below it, a little behind it, either side.
const PALM = { apart: 22, below: 12, behind: 14 };
// The elements each hand works, one to each thread of a plait.
const HANDS = [
	{ side: -1, elements: [AIR, EARTH, FIRE] },
	{ side: 1, elements: [WATER, METAL, AKASHA] },
];
// Width of a thread in pixels, by element.
const WIDTH: Record<number, number> = { [AIR]: 1, [EARTH]: 1.5, [FIRE]: 1.1, [WATER]: 1.4, [METAL]: 0.9, [AKASHA]: 1.2 };
// Threads in each hand's piece.
const WARP = 15;
const WEFT = 6;
// Enough points along each thread to draw the weft's crossings as straight runs.
const THREAD_SEGMENTS = 420;

function createThreads(shared: Record<string, THREE.IUniform>) {
	const strips = HANDS.length * (WARP + WEFT);
	const count = strips * (THREAD_SEGMENTS + 1) * 2;
	const start = new Float32Array(count * 3);
	const shape = new Float32Array(count * 4);
	const kind = new Float32Array(count * 4);
	const braid = new Float32Array(count * 4);
	const seed = new Float32Array(count * 3);
	const along = new Float32Array(count);
	const side = new Float32Array(count);
	let vertex = 0;
	for (const hand of HANDS) {
		const handStart = [hand.side * PALM.apart, -PALM.below, PALM.behind];
		const handShape = [0, hand.side * 40, 34, 0];
		for (let thread = 0; thread < WARP + WEFT; thread++) {
			const weft = thread >= WARP;
			const element = hand.elements[thread % 3]!;
			// Warp threads are spaced evenly across the piece; every third or so joins part-way along.
			const across = weft ? Math.random() : (thread / (WARP - 1)) * 2 - 1;
			const joins = weft || thread % 3 === 1 ? 0 : thread % 3 === 0 ? Math.random() * 0.2 : 0.15 + Math.random() * 0.3;
			const finger = (thread / (WARP + WEFT - 1) - 0.5) * 2.2;
			const threadKind = [element, WIDTH[element]! * (weft ? 0.8 : 1), 0, Math.random()];
			const threadBraid = [across, weft ? 1 : 0, hand.side, finger];
			const threadSeed = [Math.random(), Math.random(), joins];
			for (let i = 0; i <= THREAD_SEGMENTS; i++) {
				for (const edge of [-1, 1]) {
					start.set(handStart, vertex * 3);
					shape.set(handShape, vertex * 4);
					kind.set(threadKind, vertex * 4);
					braid.set(threadBraid, vertex * 4);
					seed.set(threadSeed, vertex * 3);
					along[vertex] = i / THREAD_SEGMENTS;
					side[vertex] = edge;
					vertex++;
				}
			}
		}
	}
	const geometry = new THREE.BufferGeometry();
	// The shader works out the real positions; three.js only needs the count.
	geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
	geometry.setAttribute("aStart", new THREE.BufferAttribute(start, 3));
	geometry.setAttribute("aShape", new THREE.BufferAttribute(shape, 4));
	geometry.setAttribute("aKind", new THREE.BufferAttribute(kind, 4));
	geometry.setAttribute("aBraid", new THREE.BufferAttribute(braid, 4));
	geometry.setAttribute("aSeed", new THREE.BufferAttribute(seed, 3));
	geometry.setAttribute("aT", new THREE.BufferAttribute(along, 1));
	geometry.setAttribute("aSide", new THREE.BufferAttribute(side, 1));
	geometry.setIndex(stripIndices(strips, THREAD_SEGMENTS));
	const uniforms = {
		...shared,
		uGrow: { value: 0 },
		uCall: { value: 0 },
		uFormed: { value: 0 },
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

const CALL_PERIOD = 6.5;

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
		uPixelRatio: pixelRatio,
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
		// The call takes about three and a half seconds; then a rest before it comes again.
		threads.uniforms.uCall.value = time % CALL_PERIOD;
		threads.uniforms.uOrigin.value.copy(camera.position);
		threads.uniforms.uKnot.value.copy(knotPosition);

		const formed = knotFormed(amount);
		threads.uniforms.uFormed.value = formed;
		// Before it has begun to form, the knot is not there at all: not even as a speck.
		knot.visible = formed > 0;
		knot.lookAt(camera.position);
		knot.scale.setScalar(Math.max(1e-3, formed * 55 * (1 + 1.6 * spread)));
		for (const { figure, mesh, axis } of figures) {
			mesh.rotateOnAxis(axis, figure.speed * (1 + spread) * delta);
			if (figure.dashes) mesh.scale.setScalar(1 + 0.8 * spread);
		}
	};

	return { update };
}
