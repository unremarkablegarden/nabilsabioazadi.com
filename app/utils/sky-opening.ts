// Opening the sky (the owner, 15 October: the channellers cut the rain off by channelling up to
// the sky; "make it beautiful and make it fluid. Make it the way that humans are capable of
// moving energy in this world (think Qi Gong experts)").
//
// It follows two things people really do with qi. The first move of the Ba Duan Jin, "two hands
// hold up the sky": the breath drawn in low, then the palms turned up and lifted slowly on a long
// out-breath. And the silk-reeling of Chen taijiquan: force that is never pushed straight but
// wound, in unbroken spirals, rooted below and light above. So it goes in breaths, not steps:
//   gathering (in-breath)   fine threads rise off the sea in a wide ring round the boat and are
//                           drawn in, low over the water, to their hands;
//   lifting (out-breath)    from the hands they go out low over the water and climb in one slow
//                           spiral ahead of the boat, widening as it rises like reeled silk, the
//                           light travelling up it;
//   opening                 at the cloud base it fans into slowly turning arms, and under them
//                           the rain parts (rain.ts): it pours down round a widening dry circle
//                           like a curtain round a tent;
//   holding                 it breathes, slowly, while it is held;
//   releasing               it is let go from the hands upward and the rain closes back in.
// Nothing in it is hard or bright: fine, soft threads, fading as they climb, never a light hung
// in the sky (the owner's standing rule), and the strongest's threads alone are white.
import * as THREE from "three";
import { pixelRatio, ribbonShaderChunk, stripIndices, unplaced, WEAVE_RELAX, WEAVE_RENDER_ORDER } from "./weave";

const GATHERING = 48;
const LIFTING = 120;
const SEGMENTS = 120;

const vertexShader = /* glsl */ `
attribute float aT;
attribute float aSide;
// The thread's own number 0..1, its seat (0..3), whether it gathers (0) or lifts (1), and a seed.
attribute vec4 aThread;
uniform float uTime;
uniform vec3 uBoat;
uniform vec2 uAhead;
uniform float uGather;
uniform float uLift;
uniform float uOpen;
uniform float uRelease;
uniform float uBreath;
uniform float uHeight;
uniform float uSpread;
uniform float uFar;
// The wind's way on the water and its strength (1 at 60 m/s): the column leans with it.
uniform vec2 uLean;
uniform float uDay;
uniform vec3 uSheath[ 4 ];
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;
varying float vWhite;
// Painterly (the owner: "more painterly"): how far along the thread, the thread's own seed, how
// much of a brush stroke this is (0 a fine thread, 1 a broad stroke), and whether it is the wash.
varying float vAlong;
varying float vSeed;
varying float vBrush;
varying float vWash;
${ribbonShaderChunk}

const float PI2 = 6.28318;

// The column is not a figure but a vortex in moving air, so nothing about it is regular (the
// owner: "still so mathematical or geometrically perfect"). Its axis leans downwind with the
// real wind, more the higher it goes, and wanders slowly; its waist swells and narrows, the
// bulges travelling up it like breath; the threads are gathered into a few loose ropes that wind
// about one another, with gaps between; some strands stray out and flutter; and each goes over
// into the arms at its own height, so its top is ragged, not a rim.
vec3 columnAxis( float u ) {
	vec3 lean = vec3( uLean.x, 0.0, uLean.y ) * 110.0 * pow( u, 1.5 );
	vec3 wander = vec3( sin( u * 2.1 + uTime * 0.031 + 1.0 ), 0.0, sin( u * 1.7 - uTime * 0.027 + 4.0 ) ) * 24.0 * u;
	return lean + wander;
}
vec3 columnPoint( float u, float phase, float breath, vec3 foot ) {
	float seed = aThread.w;
	// Five ropes, each its own width and its own rate of winding.
	float rope = floor( fract( seed * 7.77 ) * 5.0 );
	float ropeAngle = rope * 1.25664 + ( fract( seed * 31.3 ) - 0.5 ) * 0.5;
	float ropeWidth = 0.7 + 0.6 * fract( rope * 0.618 + 0.3 );
	float turns = 1.9 + 0.12 * rope;
	float waist = 1.0 + 0.28 * sin( u * 6.3 - uTime * 0.35 ) + 0.15 * sin( u * 11.0 + uTime * 0.21 + 2.0 );
	float r = mix( 9.0, 58.0, pow( u, 1.5 ) ) * breath * ropeWidth * waist;
	// Strays, loose of the rest and fluttering.
	r += step( 0.86, fract( seed * 4.3 ) ) * u * u * 34.0 * ( 0.6 + 0.4 * sin( uTime * 0.6 + seed * 20.0 ) );
	float a = phase - aThread.x * 6.28318 + ropeAngle + turns * 6.28318 * u;
	// Not round: a little flattened, and the flattening turns as it rises.
	float squash = 0.2 * sin( u * 3.0 + uTime * 0.05 );
	vec2 round_ = vec2( cos( a ) * ( 1.0 + squash ), sin( a ) * ( 1.0 - squash ) ) * r;
	float height = uHeight * ( 0.86 + 0.22 * fract( seed * 2.13 ) );
	return foot + columnAxis( u ) + vec3( round_.x, mix( 7.0, height, u * u * ( 3.0 - 2.0 * u ) ), round_.y );
}

// A point on the thread at t (0 at its far end for one gathering, at the hands for one lifting).
vec3 threadPoint( float t ) {
	float seat = aThread.y;
	float seed = aThread.w;
	vec2 across = vec2( - uAhead.y, uAhead.x );
	vec3 hands = uBoat + vec3( across.x, 0.0, across.y ) * ( seat - 1.5 ) * 1.5 + vec3( 0.0, - 1.2, 0.0 );
	// Where the column stands: ahead of the boat, on the water.
	vec3 foot = vec3( uBoat.x, 0.0, uBoat.z ) + vec3( uAhead.x, 0.0, uAhead.y ) * uFar;
	if ( aThread.z < 0.5 ) {
		// Gathering: from a ring on the sea round the boat, in over the water to the hands, low,
		// curving as it comes (wound, like everything here).
		float a = aThread.x * PI2 + 0.4 * sin( uTime * 0.05 + seed * 9.0 );
		float r = mix( 70.0, 3.0, t );
		float wind = a + 1.4 * t * t;
		vec3 p = vec3( uBoat.x, 0.0, uBoat.z ) + vec3( cos( wind ), 0.0, sin( wind ) ) * r;
		p.y = mix( 0.6 + 0.8 * sin( t * 3.14 ), hands.y - uBoat.y + uBoat.y, smoothstep( 0.7, 1.0, t ) );
		p = mix( p, hands, smoothstep( 0.85, 1.0, t ) );
		return p;
	}
	// Lifting. Out low from the hands to the column's foot (one easy curve, no corner), then up
	// in a spiral that widens as it rises, then out into the opening arms at the cloud base.
	// All wound at the one rate, so they lie side by side like reeled silk and never cross into
	// a net; each a little in or out of the others, which gives the column its depth.
	float turns = 2.2 + 0.08 * seed;
	float phase = aThread.x * PI2 + uTime * 0.035;
	float breath = ( 1.0 + 0.08 * uBreath ) * ( 0.85 + 0.3 * fract( seed * 5.7 ) );
	if ( t < 0.18 ) {
		float u = t / 0.18;
		vec3 low = mix( hands, foot + vec3( 0.0, 2.0, 0.0 ), u );
		low.y = mix( hands.y, 3.0, smoothstep( 0.0, 0.6, u ) ) + 4.0 * smoothstep( 0.6, 1.0, u ) * u;
		// Each thread loosens from the hands into its own way over the water: a tress, not a beam.
		low += vec3( across.x, 0.0, across.y ) * ( fract( seed * 11.3 ) - 0.5 ) * 40.0 * sin( u * 3.14159 );
		low.y += ( fract( seed * 3.9 ) - 0.5 ) * 2.0 * sin( u * 3.14159 );
		// Already beginning to wind as it nears the foot.
		vec3 round_ = vec3( cos( phase ), 0.0, sin( phase ) ) * 10.0 * smoothstep( 0.3, 1.0, u );
		return low + round_;
	}
	if ( t < 0.78 ) return columnPoint( ( t - 0.18 ) / 0.6, phase, breath, foot );
	// The arms: not a disc. Like smoke that reaches a ceiling, each thread leaves the top its own
	// way and spreads in a short uneven sweep, wandering as it goes, some stopping short and a few
	// reaching far, all of it carried downwind, so the shape is lopsided and has no rim (the owner:
	// "more abstract and less geometric").
	float u = ( t - 0.78 ) / 0.22;
	vec3 top = columnPoint( 1.0, phase, breath, foot );
	vec3 centre = foot + columnAxis( 1.0 );
	vec2 out_ = top.xz - centre.xz;
	float rope = floor( fract( seed * 7.77 ) * 5.0 );
	float sweep = ( 0.25 + 0.9 * fract( seed * 9.1 ) ) * ( mod( rope, 2.0 ) < 0.5 ? 1.0 : - 0.6 );
	float a = atan( out_.y, out_.x ) + sweep * u;
	float reach = uSpread * ( 0.12 + 0.88 * pow( fract( seed * 5.1 ), 2.0 ) );
	float r = mix( length( out_ ), reach, pow( u, 0.8 ) ) * breath;
	vec3 p = centre + vec3( cos( a ) * r, 0.0, sin( a ) * r );
	p += vec3( uLean.x, 0.0, uLean.y ) * 260.0 * u;
	p += vec3( sin( u * 4.0 + seed * 20.0 + uTime * 0.05 ), 0.0, cos( u * 3.3 + seed * 13.0 - uTime * 0.04 ) ) * 45.0 * u;
	p.y = top.y + 40.0 * sin( u * 3.0 + seed * 10.0 + uTime * 0.07 ) * u + ( fract( seed * 8.3 ) - 0.5 ) * 70.0 * u - 30.0 * u * u;
	return p;
}
void main() {
	float t = aT;
	vec3 here = threadPoint( t );
	vec3 ahead = threadPoint( min( t + 0.01, 1.0 ) ) + ( t >= 0.99 ? here - threadPoint( t - 0.01 ) : vec3( 0.0 ) );
	mat4 viewProjection = projectionMatrix * viewMatrix;
	vec4 clip = viewProjection * vec4( here, 1.0 );
	vec4 clipAhead = viewProjection * vec4( ahead, 1.0 );
	float lifting = step( 0.5, aThread.z );
	float seed = aThread.w;
	// How far along it has been drawn: gathering, from the ring in; lifting, from the hands up,
	// each thread in its own time (so the column grows like reeled silk, not as a block). And
	// let go, from the hands upward.
	float delay = 0.25 * fract( seed * 13.7 );
	float drawn = mix( uGather, mix( uLift, 1.0, uOpen ), lifting );
	float front = drawn * ( 1.0 + delay ) - delay;
	float shown = smoothstep( front, front - 0.04, t );
	shown *= smoothstep( uRelease - 0.04, uRelease, t );
	// Gathering threads are gone once the lift has begun.
	shown *= mix( 1.0 - smoothstep( 0.2, 0.6, uLift ), 1.0, lifting );
	// Fainter the higher and further it goes: nothing bright left hanging in the sky.
	float high = lifting * smoothstep( 0.3, 1.0, t );
	// The arms are not rings: they break into wisps, with gaps that drift.
	float wisps = mix( 1.0, smoothstep( 0.25, 0.65, 0.5 + 0.5 * sin( t * 23.0 + seed * 50.0 + uTime * 0.1 ) ), lifting * smoothstep( 0.76, 0.84, t ) );
	// And they thin away to nothing as they spread.
	wisps *= 1.0 - lifting * smoothstep( 0.82, 1.0, t ) * 0.85;
	// Light travels along each: inward on the in-breath, upward on the out-breath; in longer,
	// slower swells the higher it is, so the arms are not broken into beads.
	float pulse = 0.6 + 0.4 * sin( t * mix( 38.0, 9.0, high ) - uTime * ( 1.6 + 0.6 * seed ) * ( lifting > 0.5 ? 1.0 : - 1.0 ) + seed * 40.0 );
	// (Faint, each one: a hundred and twenty of them lie on one another in the column, and
	// strength is not brightness.)
	// The column is laid in brush strokes, not drawn in line: each thread is broken into strokes
	// of its own lengths, each pressed on, carried and lifted (broad and full where pressed, thin
	// and dry as it lifts), with gaps between. A few very broad, faint strokes behind are the wash
	// that gives it body.
	float inColumn = lifting * smoothstep( 0.16, 0.24, t ) * ( 1.0 - smoothstep( 0.74, 0.86, t ) );
	float strokeLength = 0.07 + 0.08 * fract( seed * 3.17 );
	float along = fract( ( t + fract( seed * 5.3 ) ) / strokeLength );
	float press = smoothstep( 0.0, 0.18, along ) * ( 1.0 - smoothstep( 0.55, 0.95, along ) );
	float wash = step( 0.82, fract( seed * 2.71 ) );
	float brush = inColumn * ( 1.0 - wash );
	vAlpha = shown * wisps * pulse * ( 0.16 - 0.11 * high ) * smoothstep( 0.0, 0.03, t ) * ( lifting > 0.5 ? 1.0 : 0.8 );
	vAlpha *= mix( 1.0, 0.2 + 0.75 * press, brush );
	vAlpha *= mix( 1.0, 0.22, inColumn * wash );
	vAlong = along;
	vSeed = seed;
	vBrush = brush;
	vWash = inColumn * wash;
	// Colour: mostly air, for this is the air's work, some water from the gathering, the
	// strongest's white.
	vWhite = step( 0.94, fract( seed * 7.31 ) );
	vec3 air = uSheath[ 0 ] / max( max( uSheath[ 0 ].r, uSheath[ 0 ].g ), uSheath[ 0 ].b );
	vec3 water = uSheath[ 1 ] / max( max( uSheath[ 1 ].r, uSheath[ 1 ].g ), uSheath[ 1 ].b );
	vec3 hue = mix( air, water, ( 1.0 - lifting ) * 0.7 + 0.15 * step( 0.7, fract( seed * 3.3 ) ) );
	vTint = mix( mix( vec3( 1.0 ), hue, 0.45 ), vec3( 1.0 ), vWhite );
	vEdge = aSide;
	float width = mix( 0.9, 0.6, high ) * ( 1.0 + 0.5 * vWhite );
	// Strokes broad where the brush is pressed; the wash broadest of all.
	width *= mix( 1.0, 1.5 + 4.0 * press * ( 0.5 + fract( seed * 6.1 ) ), brush );
	width *= mix( 1.0, 16.0, vWash );
	gl_Position = ribbonPosition( clip, clipAhead, aSide, width );
}
`;

const fragmentShader = /* glsl */ `
uniform float uGain;
uniform float uDay;
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;
varying float vWhite;
varying float vAlong;
varying float vSeed;
varying float vBrush;
varying float vWash;
void main() {
	// Soft across: a thread of light, not a wire.
	float across = abs( vEdge );
	float body = exp( - across * across * 3.0 ) * ( 1.0 - smoothstep( 0.8, 1.0, across ) );
	// A brush stroke: the bristles' streaks run along it, and as the brush lifts and runs dry the
	// streaks break up; its edges are ragged, not even.
	float bristles = 0.55 + 0.45 * sin( vEdge * 19.0 + vSeed * 40.0 ) * sin( vEdge * 7.0 - vSeed * 13.0 );
	float dry = smoothstep( 0.35, 0.9, vAlong ) * ( 0.5 + 0.5 * sin( vAlong * 90.0 + vEdge * 11.0 + vSeed * 70.0 ) );
	float ragged = 1.0 - smoothstep( 0.55 + 0.3 * sin( vAlong * 40.0 + vSeed * 9.0 ), 1.0, across );
	body = mix( body, ( 1.0 - across * 0.4 ) * bristles * ( 1.0 - 0.8 * dry ) * ragged, vBrush );
	// The wash: one soft breadth, with no line in it.
	body = mix( body, exp( - across * across * 2.0 ), vWash );
	// By night it is light added to the dark; by day light cannot be seen against the day, so it
	// is drawn as a pale colour laid over the sky.
	vec3 colour = vTint * mix( uGain, 1.0, uDay );
	// (Laid colour needs more of itself to be seen than light does.)
	gl_FragColor = vec4( colour, body * vAlpha * mix( 1.0, 2.6, uDay ) );
	// (Relaxed by half: WEAVE_RELAX.)
	gl_FragColor.a *= ${WEAVE_RELAX.toFixed(3)};
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

export interface SkyOpeningFrame {
	time: number;
	// The eye, and which way is ahead (a unit vector on the water).
	boat: THREE.Vector3;
	ahead: THREE.Vector2;
	// 0..1 each: how far the gathering, the lift and the opening have gone; release is how far
	// up it has been let go from the hands (0 not at all, 1 all gone).
	gather: number;
	lift: number;
	open: number;
	release: number;
	day: number;
	gain: number;
	// The elements' colours: air, water, akasha, the strongest's.
	sheath: THREE.Color[];
	// The wind, in m/s, the way it blows.
	wind: THREE.Vector3;
}

// Where it is in its breaths, from the seconds since a channelled storm began. It comes round
// every 160 seconds: some half a minute of the storm's full rain, then the in-breath (8 s), the
// long out-breath (14 s), the opening (10 s), nearly a minute held, and the letting go (20 s).
// canopy is how far the rain is parted under it, 0..1.
export const SKY_CYCLE = 160;
export function skyOpeningAt(seconds: number) {
	const t = ((seconds % SKY_CYCLE) + SKY_CYCLE) % SKY_CYCLE;
	const { smoothstep } = THREE.MathUtils;
	return {
		gather: smoothstep(t, 35, 43),
		lift: smoothstep(t, 43, 57),
		open: smoothstep(t, 57, 67),
		release: smoothstep(t, 125, 145),
		canopy: smoothstep(t, 55, 72) * (1 - smoothstep(t, 127, 150)),
	};
}

// Height of the cloud base where it opens, and how far the arms reach.
// (Far enough out that the whole of it, foot to opening, is in sight from the boat; its arms
// reach back over the boat, and beyond.)
export const SKY_OPENING = { height: 230, spread: 750, ahead: 600 };

export function createSkyOpening(scene: THREE.Scene, layer: number) {
	const strips = GATHERING + LIFTING;
	const vertices = strips * (SEGMENTS + 1) * 2;
	const along = new Float32Array(vertices);
	const side = new Float32Array(vertices);
	const thread = new Float32Array(vertices * 4);
	for (let strip = 0; strip < strips; strip++) {
		const lifting = strip >= GATHERING ? 1 : 0;
		const own = lifting ? (strip - GATHERING) / LIFTING : strip / GATHERING;
		const seed = Math.random();
		for (let i = 0; i <= SEGMENTS; i++) {
			for (let edge = 0; edge < 2; edge++) {
				const v = (strip * (SEGMENTS + 1) + i) * 2 + edge;
				along[v] = i / SEGMENTS;
				side[v] = edge ? 1 : -1;
				thread.set([own, strip % 4, lifting, seed], v * 4);
			}
		}
	}
	const geometry = unplaced(new THREE.BufferGeometry());
	geometry.setAttribute("aT", new THREE.BufferAttribute(along, 1));
	geometry.setAttribute("aSide", new THREE.BufferAttribute(side, 1));
	geometry.setAttribute("aThread", new THREE.BufferAttribute(thread, 4));
	geometry.setIndex(stripIndices(strips, SEGMENTS));
	const uniforms = {
		uTime: { value: 0 },
		uBoat: { value: new THREE.Vector3() },
		uAhead: { value: new THREE.Vector2(0, -1) },
		uGather: { value: 0 },
		uLift: { value: 0 },
		uOpen: { value: 0 },
		uRelease: { value: 0 },
		uBreath: { value: 0 },
		uHeight: { value: SKY_OPENING.height },
		uSpread: { value: SKY_OPENING.spread },
		uFar: { value: SKY_OPENING.ahead },
		uLean: { value: new THREE.Vector2() },
		uDay: { value: 0 },
		uGain: { value: 1 },
		uSheath: { value: [new THREE.Color(), new THREE.Color(), new THREE.Color(), new THREE.Color()] },
		uResolution: { value: new THREE.Vector2(1, 1) },
		uPixelRatio: pixelRatio,
	};
	const mesh = new THREE.Mesh(
		geometry,
		new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
	);
	mesh.frustumCulled = false;
	mesh.renderOrder = WEAVE_RENDER_ORDER;
	mesh.layers.set(layer);
	mesh.visible = false;
	scene.add(mesh);

	const update = (frame: SkyOpeningFrame) => {
		mesh.visible = (frame.gather > 0.001 || frame.lift > 0.001) && frame.release < 0.999;
		if (!mesh.visible) return;
		// The night's additive light and the day's laid colour need different blending.
		mesh.material.blending = frame.day > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending;
		uniforms.uTime.value = frame.time;
		uniforms.uBoat.value.copy(frame.boat);
		uniforms.uAhead.value.copy(frame.ahead);
		uniforms.uGather.value = frame.gather;
		uniforms.uLift.value = frame.lift;
		uniforms.uOpen.value = frame.open;
		uniforms.uRelease.value = frame.release;
		// A slow breath, about eight seconds in and out, as it is held.
		uniforms.uBreath.value = Math.sin((frame.time * Math.PI * 2) / 8);
		uniforms.uDay.value = frame.day;
		uniforms.uLean.value.set(frame.wind.x, frame.wind.z).multiplyScalar(1 / 60);
		if (uniforms.uLean.value.length() > 1) uniforms.uLean.value.normalize();
		uniforms.uGain.value = frame.gain;
		frame.sheath.forEach((colour, i) => uniforms.uSheath.value[i]!.copy(colour));
		uniforms.uResolution.value.set(window.innerWidth, window.innerHeight).multiplyScalar(pixelRatio.value);
	};

	const dispose = () => {
		scene.remove(mesh);
		geometry.dispose();
		mesh.material.dispose();
	};

	return { update, dispose };
}
