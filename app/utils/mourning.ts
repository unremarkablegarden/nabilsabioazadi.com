// The twelve mourn into the waves (the owner, 16 October: "let the weaves from these strong
// channellers be divergent in how they try to read the sky and then channel into waves as though
// they are mourning death"). Set by "mourning" in storm.json, while the storm is on; ?mourn shows
// it from the moment the page opens.
//
// Each of the twelve goes her own way, in her own time, and they do not agree:
//   reading the sky   each third reads it as it is in her nature to, from what is really there:
//     Siuan's four    weigh it: a thread climbs high and hangs down from there like a plumb line,
//                     a curtain that sags the further the lower the real pressure;
//     Leane's four    chase it: each runs far out along her own height of the real wind aloft
//                     (the sea, 750 m, 1.5, 3, 5.5 km), quick and restless, each another way;
//     Moiraine's four listen: a slow fan opened under the cloud, waiting, wider where the real air
//                     rises freely;
//   mourning          then she turns to the sea and lays her weave down on it: a small lift and a
//                     long heavy fall, as grief comes (a catch, and a long letting go), the thread
//                     lying along the real swell's crests, riding them, sinking slowly from sight;
//                     grief cools her: its motion slows and its colour goes grey towards the sea's;
//                     when the one beside her mourns too, some of her threads go to lie beside hers;
//   still             and then a while of nothing, before she reads again.
// The time each spends reading is her temperament's and the sky's: Leane's short and restless,
// Moiraine's long, Siuan's steady, all longer in a harder wind; so at any moment some read while
// others mourn. Nothing in rows, every line one curve; colour tamed to the background's.
import * as THREE from "three";
import { GIANT_WAVES } from "./gerstner-waves";
import { pixelRatio, ribbonShaderChunk, stripIndices, tameShaderChunk, unplaced, WEAVE_RELAX, WEAVE_RENDER_ORDER } from "./weave";

const TRAINS = 32;
const FIBRES = 40;
const SEGMENTS = 140;
// As in embroidery.ts: the twelve's places at the rail, whose third each is (0 Siuan's, 1 Leane's,
// 2 Moiraine's), and which of its four.
const SLOTS = [0, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const THIRDS = [0, 1, 0, 1, 2, 2, 1, 0, 2, 1, 0, 2];
const MEMBERS = THIRDS.map((third, i) => THIRDS.slice(0, i).filter((other) => other === third).length);

const vertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute float aWho;
attribute vec4 aSeed;
uniform float uTime;
uniform vec3 uBoat;
uniform vec2 uAhead;
uniform vec4 uTrains[ ${TRAINS} ];
uniform float uSteep;
uniform vec4 uGiant[ 3 ];
uniform float uSurge;
// For each of the twelve: what she is doing (0 reading, 1 mourning, 2 still), how far through
// it (0..1), her breath of grief (0..1), and how far the one beside her is mourning (0..1).
uniform vec4 uState[ 12 ];
// The wind at five heights, across and along the view, scaled by its strength; how far the real
// pressure is below the ordinary (0..1); how freely the air rises (0..1); the swell's bearing.
uniform vec2 uAloft[ 5 ];
uniform float uDeficit;
uniform float uFree;
uniform float uSwellFrom;
uniform vec3 uTints[ 3 ];
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;
${ribbonShaderChunk}
${tameShaderChunk}
const float THIRD_OF[ 12 ] = float[ 12 ]( ${THIRDS.map((x) => `${x}.0`).join(", ")} );
const float MEMBER_OF[ 12 ] = float[ 12 ]( ${MEMBERS.map((x) => `${x}.0`).join(", ")} );
const float SEAT_OF[ 12 ] = float[ 12 ]( ${SLOTS.map((x) => `${x}.0`).join(", ")} );

vec3 aheadDir() { return vec3( uAhead.x, 0.0, uAhead.y ); }
vec3 acrossDir() { return vec3( - uAhead.y, 0.0, uAhead.x ); }
vec3 bearing( float a ) { return aheadDir() * cos( a ) + acrossDir() * sin( a ); }
vec3 seatAt( float who ) {
	if ( who < 3.5 ) return uBoat + acrossDir() * ( who - 1.5 ) * 1.5 + vec3( 0.0, - 1.2, 0.0 ) + aheadDir() * 0.5;
	float k = who - 4.0;
	float side = mod( k, 2.0 ) * 2.0 - 1.0;
	float back = floor( k / 2.0 );
	return uBoat + acrossDir() * side * ( 2.2 + 0.2 * back ) + vec3( 0.0, - 1.6, 0.0 ) - aheadDir() * ( 1.0 + 1.6 * back );
}
float seaAt( vec2 p ) {
	float h = 0.0;
	for ( int i = 0; i < ${TRAINS}; i ++ ) {
		vec4 w = uTrains[ i ];
		float k = 6.28318 / max( w.w, 1.0 );
		float along = sin( w.x ) * p.x - cos( w.x ) * p.y;
		h += ( w.z * uSteep / k ) * sin( k * ( along - sqrt( 9.8 / k ) * uTime ) + w.y );
	}
	for ( int i = 0; i < 3; i ++ ) {
		vec4 w = uGiant[ i ];
		float k = 6.28318 / w.w;
		float along = sin( w.x ) * p.x - cos( w.x ) * p.y;
		h += ( uSurge * w.z / k ) * sin( k * ( along - sqrt( 9.8 / k ) * uTime ) + w.y );
	}
	return h;
}
vec3 bezier( vec3 a, vec3 b, vec3 c, vec3 d, float t ) {
	float s = 1.0 - t;
	return s * s * s * a + 3.0 * s * s * t * b + 3.0 * s * t * t * c + t * t * t * d;
}

// Where on the sea each lays her grief down, and the way it lies there: along the swell's crests.
vec3 mournAt( float who ) {
	float third = THIRD_OF[ int( who ) ];
	float member = MEMBER_OF[ int( who ) ];
	float a = ( third - 1.0 ) * 0.42 + ( member - 1.5 ) * 0.13 + 0.06 * sin( who * 2.3 );
	float d = 120.0 + 300.0 * fract( who * 0.618 + 0.2 );
	vec3 p = uBoat + bearing( a ) * d;
	// (On the sea, not at the eye's height.)
	p.y = seaAt( p.xz ) + 1.4;
	return p;
}
vec3 crestDir() { return bearing( uSwellFrom + 1.5708 ); }

// Her reading of the sky, at t along the thread.
vec3 reading( float who, float t ) {
	float third = THIRD_OF[ int( who ) ];
	float member = MEMBER_OF[ int( who ) ];
	vec3 seat = seatAt( SEAT_OF[ int( who ) ] );
	if ( third < 0.5 ) {
		// Siuan's: up to a high point, and hanging down from it, the lower the pressure the further.
		float a = - 0.55 + member * 0.33 + 0.05 * sin( uTime * 0.02 + who );
		vec3 top = seat + bearing( a ) * ( 380.0 + 140.0 * member ) + vec3( 0.0, 210.0 + 50.0 * member, 0.0 );
		if ( t < 0.55 ) return bezier( seat, seat + vec3( 0.0, 70.0, 0.0 ) + aheadDir() * 20.0, top - bearing( a ) * 90.0 + vec3( 0.0, 30.0, 0.0 ), top, t / 0.55 );
		float s = ( t - 0.55 ) / 0.45;
		vec3 side = bearing( a + 1.5708 );
		// (Never quite plumb: each bows and sways a little as it hangs.)
		return top + side * ( aSeed.z - 0.5 ) * 50.0 * s + vec3( 0.0, - ( 60.0 + 220.0 * uDeficit ) * s, 0.0 )
			+ ( side * ( 18.0 * sin( 3.14159 * s ) + 6.0 * sin( uTime * 0.25 + aSeed.y * 6.0 ) * s ) + bearing( a ) * 12.0 * sin( 3.14159 * s + aSeed.w * 2.0 ) ) * ( 0.6 + 0.8 * aSeed.z );
	}
	if ( third < 1.5 ) {
		// Leane's: far out along her own height of the wind, each another way, restless.
		int layer = int( member ) + 1;
		vec2 w = uAloft[ layer ];
		float strength = length( w );
		vec3 down = normalize( acrossDir() * w.x + aheadDir() * w.y + aheadDir() * 0.15 + vec3( 1e-4 ) );
		float h = 25.0 + 95.0 * float( layer );
		vec3 up = seat + aheadDir() * 60.0 + vec3( 0.0, h, 0.0 );
		vec3 far = up + down * ( 300.0 + 900.0 * min( strength, 1.5 ) );
		vec3 p = bezier( seat, seat + vec3( 0.0, h * 0.6, 0.0 ) + aheadDir() * 30.0, up - down * 120.0, far, t );
		return p + acrossDir() * sin( t * 9.0 - uTime * 1.2 + aSeed.y * 6.0 ) * 6.0 * t;
	}
	// Moiraine's: a slow fan opened under the cloud, waiting; wider where the air rises freely.
	float a = - 0.45 + member * 0.3;
	vec3 c = seat + bearing( a ) * 420.0 + vec3( 0.0, 300.0, 0.0 );
	if ( t < 0.5 ) return bezier( seat, seat + vec3( 0.0, 60.0, 0.0 ) + aheadDir() * 20.0, c - bearing( a ) * 140.0, c, t / 0.5 );
	float s = ( t - 0.5 ) / 0.5;
	float fan = a + ( aSeed.z - 0.5 ) * ( 0.7 + 1.1 * uFree );
	return c + bearing( fan ) * 380.0 * s + vec3( 0.0, - 25.0 * s * s + 6.0 * sin( uTime * 0.15 + aSeed.y * 6.0 ) * s, 0.0 );
}

// Her grief laid on the sea, at t along the thread: a small lift from her hands and a long heavy
// fall to the water, then lying along the swell, riding it, sinking.
vec3 mourning( float who, float t, float sob, float sink, float beside ) {
	vec3 seat = seatAt( SEAT_OF[ int( who ) ] );
	vec3 at = mournAt( who );
	// (Some of her threads go to lie beside the one next to her, when she mourns too.)
	if ( aSeed.x < 0.3 * beside ) at = mix( at, mournAt( mod( who + 1.0, 12.0 ) ), 0.85 ) + crestDir() * 4.0;
	vec3 toward = normalize( vec3( at.x - seat.x, 0.0, at.z - seat.z ) + vec3( 1e-4 ) );
	// The way it lies on the sea: along the crests, turned from the way it came (one curve, no corner).
	vec3 along = crestDir() * ( mod( who, 2.0 ) * 2.0 - 1.0 );
	if ( dot( along, toward ) < 0.0 ) along = - along;
	if ( t < 0.35 ) {
		vec3 p = bezier( seat, seat + vec3( 0.0, 5.0 + 9.0 * sob, 0.0 ) + toward * 25.0, at + vec3( 0.0, 25.0, 0.0 ) - along * 70.0, at, t / 0.35 );
		return p;
	}
	float s = ( t - 0.35 ) / 0.65;
	vec3 q = at + along * s * 240.0 + toward * sin( s * 5.0 + who ) * 12.0 * s;
	q.y = seaAt( q.xz ) + 1.4 - 4.5 * sink;
	return q;
}

vec3 placeAt( float t ) {
	vec4 st = uState[ int( aWho ) ];
	if ( st.x < 0.5 ) return reading( aWho, t );
	return mourning( aWho, t, st.z, smoothstep( 0.4, 1.0, st.y ), st.w );
}

void main() {
	vec4 st = uState[ int( aWho ) ];
	float third = THIRD_OF[ int( aWho ) ];
	vec3 here = placeAt( aT );
	vec3 next = placeAt( min( aT + 0.01, 1.0 ) ) + ( aT >= 0.99 ? here - placeAt( aT - 0.01 ) : vec3( 0.0 ) );
	// Each filament wanders a little about the line; less as grief cools her.
	vec3 n1 = normalize( cross( next - here + vec3( 1e-5 ), vec3( 0.0, 1.0, 0.0 ) ) + vec3( 1e-4 ) );
	float cool = st.x > 0.5 ? smoothstep( 0.2, 1.0, st.y ) : 0.0;
	float spread = ( 0.4 + 2.2 * sin( 3.14159 * aT ) ) * sqrt( aSeed.z ) * ( 1.0 - 0.5 * cool );
	float turn = aSeed.y * 6.28318 + aT * 10.0 + uTime * ( 0.3 - 0.25 * cool ) * ( aSeed.x - 0.5 );
	vec3 off = ( n1 * cos( turn ) + vec3( 0.0, sin( turn ), 0.0 ) ) * spread;
	here += off;
	next += off;
	// Grown out from her hands, and drawn back in or let sink.
	float shown;
	if ( st.x < 0.5 ) {
		float grow = smoothstep( 0.0, 0.3, st.y ) * 1.1 - 0.1 * aSeed.w;
		float back = 1.0 - smoothstep( 0.82, 1.0, st.y ) * 1.1 + 0.1 * aSeed.w;
		shown = smoothstep( grow, grow - 0.04, aT ) * smoothstep( back, back - 0.04, aT );
		// (Leane's are the quickest and brightest; Moiraine's the stillest.)
		shown *= 0.55 + 0.45 * sin( aT * 16.0 - uTime * ( third > 0.5 && third < 1.5 ? 1.8 : 0.7 ) + aSeed.x * 30.0 );
	} else if ( st.x < 1.5 ) {
		float lay = smoothstep( 0.0, 0.35, st.y ) * 1.1 - 0.1 * aSeed.w;
		shown = smoothstep( lay, lay - 0.04, aT );
		// Brighter on the catch of each breath, fading as she lets it go, and as it sinks.
		shown *= ( 0.5 + 0.6 * st.z ) * ( 1.0 - smoothstep( 0.55, 1.0, st.y ) );
	} else shown = 0.0;
	shown *= smoothstep( 1.0, 0.85, aT ) * smoothstep( 25.0, 110.0, length( here - cameraPosition ) );
	vAlpha = shown;
	// Tamed to the background's colour; cooling, she goes greyer still.
	vTint = tame( uTints[ int( third + 0.5 ) ], mix( 0.22, 0.1, cool ) ) * mix( 1.0, 0.7, cool );
	vEdge = aSide;
	mat4 vp = projectionMatrix * viewMatrix;
	gl_Position = ribbonPosition( vp * vec4( here, 1.0 ), vp * vec4( next, 1.0 ), aSide, 0.9 );
}
`;

const fragment = /* glsl */ `
uniform float uGain;
uniform float uDay;
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;
void main() {
	float across = abs( vEdge );
	float body = exp( - across * across * 3.0 ) * ( 1.0 - smoothstep( 0.8, 1.0, across ) );
	vec3 colour = mix( vTint, pow( vTint, vec3( 2.6 ) ) * 0.35, uDay );
	gl_FragColor = vec4( colour * uGain, body * vAlpha * 0.14 * mix( 1.0, 3.5, uDay ) );
	// (Relaxed by half: WEAVE_RELAX.)
	gl_FragColor.a *= ${WEAVE_RELAX.toFixed(3)};
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

export interface MourningFrame {
	time: number;
	delta: number;
	boat: THREE.Vector3;
	ahead: THREE.Vector2;
	trains: THREE.Vector4[];
	steepness: number;
	surge: number;
	// 0..1 how hard the real wind blows; the wind at five heights; the pressure below ordinary
	// (0..1); how freely the air rises (0..1); the swell's bearing from ahead (radians).
	force: number;
	aloft: { across: number; along: number }[];
	deficit: number;
	free: number;
	swellFrom: number;
	day: number;
	gain: number;
	tints: THREE.Color[];
	bg: THREE.Color;
}

export function createMourning(scene: THREE.Scene, layer: number) {
	const count = SLOTS.length * FIBRES;
	const vertices = count * (SEGMENTS + 1) * 2;
	const along = new Float32Array(vertices);
	const side = new Float32Array(vertices);
	const who = new Float32Array(vertices);
	const seeds = new Float32Array(vertices * 4);
	for (let line = 0; line < count; line++) {
		const own = [Math.random(), Math.random(), Math.random(), Math.random()];
		for (let i = 0; i <= SEGMENTS; i++) {
			for (let edge = 0; edge < 2; edge++) {
				const v = (line * (SEGMENTS + 1) + i) * 2 + edge;
				along[v] = i / SEGMENTS;
				side[v] = edge ? 1 : -1;
				who[v] = line % SLOTS.length;
				seeds.set(own, v * 4);
			}
		}
	}
	const geometry = unplaced(new THREE.BufferGeometry());
	geometry.setAttribute("aT", new THREE.BufferAttribute(along, 1));
	geometry.setAttribute("aSide", new THREE.BufferAttribute(side, 1));
	geometry.setAttribute("aWho", new THREE.BufferAttribute(who, 1));
	geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
	geometry.setIndex(stripIndices(count, SEGMENTS));
	const uniforms = {
		uTime: { value: 0 },
		uBoat: { value: new THREE.Vector3() },
		uAhead: { value: new THREE.Vector2(0, -1) },
		uTrains: { value: Array.from({ length: TRAINS }, () => new THREE.Vector4(0, 0, 0, 100)) },
		uSteep: { value: 0 },
		uGiant: { value: GIANT_WAVES },
		uSurge: { value: 0 },
		uState: { value: SLOTS.map(() => new THREE.Vector4(2, 0, 0, 0)) },
		uAloft: { value: Array.from({ length: 5 }, () => new THREE.Vector2()) },
		uDeficit: { value: 0 },
		uFree: { value: 0.5 },
		uSwellFrom: { value: 0 },
		uTints: { value: [new THREE.Color(), new THREE.Color(), new THREE.Color()] },
		uBg: { value: new THREE.Color() },
		uGain: { value: 1 },
		uDay: { value: 0 },
		uResolution: { value: new THREE.Vector2(1, 1) },
		uPixelRatio: pixelRatio,
	};
	const mesh = new THREE.Mesh(geometry, new THREE.ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
	mesh.frustumCulled = false;
	mesh.renderOrder = WEAVE_RENDER_ORDER;
	mesh.layers.set(layer);
	mesh.visible = false;
	scene.add(mesh);

	// Each one's own course: what she is doing, for how long, how far she is into it, and her
	// breath of grief. Begun at different points, so that from the first they are not together.
	const READING = [40, 22, 55];
	const courses = SLOTS.map((_, i) => ({
		doing: Math.random() < 0.5 ? 0 : 1,
		length: 30,
		at: Math.random(),
		breath: Math.random(),
		breathLength: 5 + 3 * Math.random(),
		third: THIRDS[i]!,
	}));
	const next = (course: (typeof courses)[number], force: number) => {
		course.doing = (course.doing + 1) % 3;
		course.at = 0;
		course.length =
			course.doing === 0
				? READING[course.third]! * (0.7 + 0.6 * Math.random()) * (0.8 + 0.6 * force)
				: course.doing === 1
					? 50 + 40 * Math.random()
					: 8 + 17 * Math.random();
	};

	const update = (frame: MourningFrame | undefined) => {
		mesh.visible = !!frame;
		if (!frame) return;
		const dt = Math.min(frame.delta, 0.1);
		courses.forEach((course, i) => {
			course.at += dt / course.length;
			if (course.at >= 1) next(course, frame.force);
			// Grief's breath: a catch, and a long letting go; slower as it goes on.
			course.breath = (course.breath + dt / (course.breathLength * (1 + 0.6 * course.at))) % 1;
			const sob = course.breath < 0.15 ? THREE.MathUtils.smoothstep(course.breath, 0, 0.15) : 1 - THREE.MathUtils.smoothstep(course.breath, 0.15, 1);
			const beside = courses[(i + 1) % courses.length]!;
			uniforms.uState.value[i]!.set(course.doing, course.at, sob, beside.doing === 1 ? Math.min(1, beside.at * 3) : 0);
		});
		uniforms.uTime.value = frame.time;
		uniforms.uBoat.value.copy(frame.boat);
		uniforms.uAhead.value.copy(frame.ahead);
		frame.trains.forEach((train, i) => i < TRAINS && uniforms.uTrains.value[i]!.copy(train));
		uniforms.uSteep.value = frame.steepness;
		uniforms.uSurge.value = frame.surge;
		frame.aloft.forEach((layer_, i) => i < 5 && uniforms.uAloft.value[i]!.set(layer_.across, layer_.along));
		uniforms.uDeficit.value = frame.deficit;
		uniforms.uFree.value = frame.free;
		uniforms.uSwellFrom.value = frame.swellFrom;
		frame.tints.forEach((tint, i) => uniforms.uTints.value[i]!.copy(tint));
		uniforms.uBg.value.copy(frame.bg);
		uniforms.uDay.value = frame.day;
		uniforms.uGain.value = frame.gain;
		uniforms.uResolution.value.set(window.innerWidth, window.innerHeight).multiplyScalar(pixelRatio.value);
		(mesh.material as THREE.ShaderMaterial).blending = frame.day > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending;
	};

	const dispose = () => {
		scene.remove(mesh);
		geometry.dispose();
		(mesh.material as THREE.Material).dispose();
	};

	return { update, dispose };
}
