// The spray-bow (the owner, 8 November 2026, of the ways offered to "show to the general public their
// ability to call weather": "I love 1 and 2"; this is the second).
//
// A rainbow needs the sun low behind the eye and water in the air before it, and the site knows the
// sun's true place over the boat. When the sun is up and low (under about 35 degrees) and the sky is
// clear enough for it to shine, and the wind would not tear the water away, three of them throw a
// curtain of fine spray down-sun from their palms, and a bow stands in it over the sea, and dies when
// the spray does. Sea-spray bows are a real thing that fishers see. It is the purest reading of the sky
// the channellers make, because it is only possible when the real sun agrees.
//   Who. Loom, Sail and Lantern, who fling water (Loom and Sail flung it across the view in Ranat's
//   storm, Lantern threw it up to the cloud): each a thread of water from her palms out to the foot of
//   the curtain, some twenty metres off down-sun; on each swell that passes under the boat (the real
//   swell: nothing runs to a clock) a throw runs out along her thread and the water rises from the sea
//   where it lands as a plume of spray, hangs, and falls back, the three plumes merging into one
//   curtain, carried by the real wind as it rises.
//   The bow. Where the eye's line through the spray makes 42 degrees with the line away from the sun,
//   the spray is coloured, violet inside and red outside (the primary bow, 40.6 to 42.4 degrees), with
//   the pastel supernumerary bows inside it that fine drops give; a fainter secondary at 50 to 54
//   degrees with its colours reversed; the spray darker between the two (Alexander's band) and lighter
//   within the primary. The whole is worked out from the sun's place and the eye's, so it stands where
//   a real bow would, and moves as the eye moves.
//   The curtain is as high as the bow's top needs (the lower the sun, the higher the bow), from four to
//   twenty-eight metres. The antisolar point is only in the view at rest when the sun is behind the boat:
//   on this leg, bearing about 30 degrees, the evening sun sets to the west-south-west and the bow stands
//   off the right bow; the morning bow stands behind the left beam and needs the view turned.
//   ?bow for this visit as if the sun allowed it (the sun still where it is; by night there is spray and no
//   bow); ?bow=off for none. __bow() in the console.
import * as THREE from "three";
import { lines } from "./embroidery";
import { NAMES, ropeMight } from "./psyche";
import { seatOf } from "./treason";
import { filmLook, filmShaderChunk, pixelRatio, ribbonShaderChunk, WEAVE_RELAX, WEAVE_RENDER_ORDER } from "./weave";

// Loom, Sail, Lantern (psyche.ts NAMES).
const THROWERS = [4, 6, 9];
const T = THROWERS.length;
// Where each plume stands along the curtain (0..1), and how far the curtain is from the boat (m).
const PLUMES = [0.25, 0.5, 0.75];
const RADIUS = 20;
// The curtain's span about the antisolar point (degrees).
const SPAN = 110;
// Throws kept in hand at once.
const THROWS = 4;
// Seconds a throw takes to run out along her thread to the curtain's foot.
const RUNS_OUT_IN = 1.2;
// Seconds between one swell's throw and the next at least; and the longest they wait for a swell.
const THROWS_APART = 5;
const WAITS_AT_MOST = 14;

const FILAMENTS = 6;
const SEGMENTS = 30;

const curtainVertex = /* glsl */ `
uniform vec3 uBoat;
// The way to the antisolar point over the sea (unit, xz).
uniform vec2 uCentre;
uniform float uHeight;
// How far the wind carries the spray for each metre it rises (xz).
uniform vec3 uLean;
varying vec3 vWorld;
varying vec2 vUv;
void main() {
	vUv = uv;
	float a = atan( uCentre.x, uCentre.y ) + ( uv.x - 0.5 ) * radians( ${SPAN.toFixed(1)} );
	vec3 p = vec3( uBoat.x, 0.0, uBoat.z ) + vec3( sin( a ), 0.0, cos( a ) ) * ${RADIUS.toFixed(1)};
	p.y = uv.y * uHeight;
	p += uLean * uv.y * uHeight;
	vWorld = p;
	gl_Position = projectionMatrix * viewMatrix * vec4( p, 1.0 );
}
`;

const curtainFragment = /* glsl */ `
uniform float uTime;
// When the last throws were made (seconds; below 0 none).
uniform float uThrows[ ${THROWS} ];
// Towards the sun (unit).
uniform vec3 uSun;
// The sunlight's colour on the spray, and 0..1 how clear the sky is for it.
uniform vec3 uSprayColour;
uniform float uSunlight;
uniform float uOn;
uniform float uGain;
uniform float uDay;
varying vec3 vWorld;
varying vec2 vUv;
float hash( vec2 p ) {
	return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 );
}
float vnoise( vec2 p ) {
	vec2 i = floor( p );
	vec2 f = fract( p );
	f = f * f * ( 3.0 - 2.0 * f );
	return mix( mix( hash( i ), hash( i + vec2( 1.0, 0.0 ) ), f.x ), mix( hash( i + vec2( 0.0, 1.0 ) ), hash( i + vec2( 1.0, 1.0 ) ), f.x ), f.y );
}
float fbm( vec2 p ) {
	return 0.5 * vnoise( p ) + 0.3 * vnoise( p * 2.1 + 3.7 ) + 0.2 * vnoise( p * 4.3 + 9.1 );
}
vec3 hue( float h ) {
	vec3 k = vec3( 0.0, 2.0 / 3.0, 1.0 / 3.0 );
	return clamp( abs( fract( h + k ) * 6.0 - 3.0 ) - 1.0, 0.0, 1.0 );
}
void main() {
	// The spray: each throw a plume from each thrower's place along the curtain, rising, hanging, falling.
	float density = 0.0;
	for ( int i = 0; i < ${THROWS}; i ++ ) {
		if ( uThrows[ i ] < 0.0 ) continue;
		for ( int j = 0; j < ${T}; j ++ ) {
			// (The throw runs out along her thread first, and each of the three a little after the last.)
			float s = uTime - uThrows[ i ] - ${RUNS_OUT_IN.toFixed(2)} - 0.4 * float( j );
			if ( s < 0.0 || s > 8.0 ) continue;
			float rise = smoothstep( 0.0, 2.4, s );
			float fall = smoothstep( 2.6, 7.5, s );
			float top = rise * ( 1.0 - 0.35 * fall );
			float under = 1.0 - smoothstep( top - 0.2, top + 0.02, vUv.y );
			float c = ${PLUMES[0]!.toFixed(2)} + ${(PLUMES[1]! - PLUMES[0]!).toFixed(2)} * float( j );
			float n = fbm( vec2( vUv.x * 9.0 + float( i ) * 3.1, vUv.y * 5.0 - s * 0.9 + float( j ) * 7.0 ) );
			// A column from its foot, broadening as it rises, its edges torn by the air.
			float w = ( 0.05 + 0.13 * vUv.y ) * ( 0.7 + 0.6 * n );
			float d = ( vUv.x - c ) / w;
			float across = exp( - d * d );
			density += under * ( 1.0 - fall ) * across * smoothstep( 0.42, 0.78, n + 0.1 * ( 1.0 - vUv.y ) );
		}
	}
	// (Thin: spray, not fog; and nothing at the curtain's foot but the plumes' own roots.)
	density = min( density, 1.0 ) * uOn * 0.75 * smoothstep( 0.0, 0.06, vUv.y );
	if ( density < 0.003 ) discard;
	// The bow: where the eye's line through the spray makes the rainbow's angle with the line away from the sun.
	vec3 ray = normalize( vWorld - cameraPosition );
	float theta = degrees( acos( clamp( dot( ray, - uSun ), - 1.0, 1.0 ) ) );
	// The primary, violet inside at 40.6 degrees to red outside at 42.4.
	float x = ( theta - 40.6 ) / 1.8;
	float band = smoothstep( - 0.15, 0.1, x ) * ( 1.0 - smoothstep( 0.85, 1.1, x ) );
	vec3 bow = hue( mix( 0.78, 0.0, clamp( x, 0.0, 1.0 ) ) ) * band;
	// The supernumeraries inside it, pastel, that fine drops give.
	float sup = smoothstep( - 1.6, - 0.1, x ) * step( x, 0.0 ) * pow( 0.5 + 0.5 * cos( x * 7.5 ), 2.0 );
	bow += mix( vec3( 0.75, 0.6, 1.0 ), vec3( 1.0, 0.8, 0.7 ), 0.5 + 0.5 * cos( x * 7.5 + 1.5 ) ) * sup * 0.35;
	// The secondary, red inside at 50.4 to violet at 53.6, fainter.
	float y = ( theta - 50.4 ) / 3.2;
	float band2 = smoothstep( - 0.1, 0.15, y ) * ( 1.0 - smoothstep( 0.85, 1.1, y ) );
	bow += hue( mix( 0.0, 0.78, clamp( y, 0.0, 1.0 ) ) ) * band2 * 0.3;
	// Alexander's dark band between the two; the spray within the primary the lighter.
	float dark = smoothstep( 42.4, 43.6, theta ) * ( 1.0 - smoothstep( 49.2, 50.4, theta ) );
	float within = 1.0 - smoothstep( 39.0, 40.6, theta );
	vec3 spray = uSprayColour * ( 0.9 + 0.25 * within ) * ( 1.0 - 0.35 * dark );
	vec3 colour = ( spray + bow * 1.6 * uSunlight ) * mix( uGain, 1.4, uDay );
	gl_FragColor = vec4( colour, density * 0.5 );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

// The threads of water from their palms to the curtain's foot, a throw running out along each.
const threadVertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute vec2 aCell;
attribute vec4 aSeed;
uniform float uTime;
uniform float uThrows[ ${THROWS} ];
uniform vec3 uSeats[ ${T} ];
uniform vec3 uFeet[ ${T} ];
uniform float uOn;
uniform float uDay;
varying float vAlpha;
varying float vEdge;
varying float vSky;
varying float vCore;
${ribbonShaderChunk}
vec3 bezier( vec3 a, vec3 b, vec3 c, vec3 d, float t ) {
	float s = 1.0 - t;
	return s * s * s * a + 3.0 * s * s * t * b + 3.0 * s * t * t * c + t * t * t * d;
}
vec3 rootOf( vec3 d, vec4 seed ) {
	vec3 flat_ = normalize( vec3( d.x, 0.0, d.z ) + vec3( 0.0, 0.0, 1e-4 ) );
	vec3 side = vec3( - flat_.z, 0.0, flat_.x );
	float which = fract( seed.x * 7.13 );
	vec3 root = which < 0.4 ? - side * 0.28 : which < 0.8 ? side * 0.28 : - flat_ * 0.22 + vec3( 0.0, 0.3, 0.0 );
	return root + side * ( fract( seed.y * 5.7 ) - 0.5 ) * 0.16 + vec3( 0.0, ( fract( seed.z * 3.3 ) - 0.5 ) * 0.14, 0.0 );
}
vec3 threadAt( int j, float t, vec4 seed ) {
	vec3 hands = uSeats[ j ];
	vec3 foot = uFeet[ j ];
	vec3 d = foot - hands;
	vec3 flat_ = normalize( vec3( d.x, 0.0, d.z ) + vec3( 1e-4, 0.0, 0.0 ) );
	vec3 up = vec3( 0.0, 1.0, 0.0 );
	vec3 p = bezier( hands, hands + flat_ * 5.0 + up * 2.5, foot - flat_ * 5.0 + up * 3.0, foot, t );
	vec3 side = vec3( - flat_.z, 0.0, flat_.x );
	float fromHer = length( p - hands );
	// A few threads loosely together, gathering from her palms.
	p += ( side * sin( t * 9.0 + seed.y * 6.28 ) + up * cos( t * 7.0 + seed.z * 6.28 ) ) * 0.18 * sqrt( seed.w ) * smoothstep( 0.0, 0.15, t ) * ( 1.0 - smoothstep( 0.85, 1.0, t ) );
	return p + rootOf( flat_, seed ) * ( 1.0 - smoothstep( 0.0, 4.0, fromHer ) );
}
void main() {
	int j = int( aCell.x + 0.5 );
	vec3 here = threadAt( j, aT, aSeed );
	vec3 next = threadAt( j, min( aT + 0.033, 1.0 ), aSeed ) + ( aT >= 0.967 ? here - threadAt( j, aT - 0.033, aSeed ) : vec3( 0.0 ) );
	// The throws: each a knot of light running out along the thread to the water.
	float throwing = 0.0;
	for ( int i = 0; i < ${THROWS}; i ++ ) {
		if ( uThrows[ i ] < 0.0 ) continue;
		float s = ( uTime - uThrows[ i ] - 0.4 * float( j ) ) / ${RUNS_OUT_IN.toFixed(2)};
		if ( s < 0.0 || s > 1.1 ) continue;
		throwing += exp( - 40.0 * ( aT - s ) * ( aT - s ) );
	}
	float far = length( here - cameraPosition );
	vAlpha = uOn * ( 0.3 + 0.7 * min( throwing, 1.0 ) ) * smoothstep( 1.1, 2.0, far ) * ( 1.0 - smoothstep( 0.9, 1.0, aT ) );
	vEdge = aSide;
	vSky = againstSky( here );
	vCore = 1.0 - aSeed.z;
	mat4 vp = projectionMatrix * viewMatrix;
	gl_Position = ribbonPosition( vp * vec4( here, 1.0 ), vp * vec4( next, 1.0 ), aSide, mix( 1.0, 1.3, uDay ) );
}
`;

const threadFragment = /* glsl */ `
uniform vec3 uTint;
uniform float uGain;
uniform float uDay;
uniform float uFilm;
uniform float uAlpha;
varying float vAlpha;
varying float vEdge;
varying float vSky;
varying float vCore;
${filmShaderChunk}
void main() {
	float body = 1.0 - smoothstep( 0.7, 1.0, abs( vEdge ) );
	vec3 tint = mix( uTint, filmShade( uTint, vCore ), uFilm );
	gl_FragColor = vec4( mix( tint * uGain, tint * max( 1.2, uGain * mix( 0.8, 1.5, vSky ) ), uDay ), body * vAlpha * uAlpha * mix( 1.0, 3.0, uDay ) );
	gl_FragColor.a *= ${WEAVE_RELAX.toFixed(3)};
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

export interface BowFrame {
	time: number;
	delta: number;
	boat: THREE.Vector3;
	ahead: THREE.Vector2;
	// Towards the sun as it is drawn (unit, world).
	sun: THREE.Vector3;
	// 0..1 how clear the sky is for the sun to shine (cloud cover).
	sunlight: number;
	// The wind's speed (km/h) and the way it blows (m/s, world).
	windSpeed: number;
	wind: THREE.Vector3;
	// The sea's height at the boat (m): they throw on each swell.
	heave: number;
	// 0..1 how far they are free for it.
	free: number;
	// undefined: as the sun and sky allow; true: thrown anyway; false: never.
	force: boolean | undefined;
	day: number;
	gain: number;
	// Water's colour.
	water: THREE.Color;
}

const WARM = new THREE.Color(1.0, 0.88, 0.74);
const WHITE = new THREE.Color(1, 1, 1);

export function createBow(scene: THREE.Scene, layer: number) {
	const curtainGeometry = new THREE.PlaneGeometry(1, 1, 96, 32);
	const curtainUniforms = {
		uBoat: { value: new THREE.Vector3() },
		uCentre: { value: new THREE.Vector2(0, -1) },
		uHeight: { value: 8 },
		uLean: { value: new THREE.Vector3() },
		uTime: { value: 0 },
		uThrows: { value: new Array(THROWS).fill(-1) as number[] },
		uSun: { value: new THREE.Vector3(0, 1, 0) },
		uSprayColour: { value: new THREE.Color(1, 1, 1) },
		uSunlight: { value: 1 },
		uOn: { value: 0 },
		uGain: { value: 1 },
		uDay: { value: 1 },
	};
	const curtain = new THREE.Mesh(curtainGeometry, new THREE.ShaderMaterial({ uniforms: curtainUniforms, vertexShader: curtainVertex, fragmentShader: curtainFragment, transparent: true, depthWrite: false, side: THREE.DoubleSide }));

	const cells: [number, number][] = [];
	THROWERS.forEach((who, k) => {
		for (let f = 0; f < Math.round(FILAMENTS * ropeMight(who)); f++) cells.push([k, 0]);
	});
	const threadGeometry = lines(cells.length, SEGMENTS, (i) => cells[i]!);
	const threadUniforms = {
		uTime: curtainUniforms.uTime,
		uThrows: curtainUniforms.uThrows,
		uSeats: { value: THROWERS.map(() => new THREE.Vector3()) },
		uFeet: { value: THROWERS.map(() => new THREE.Vector3()) },
		uOn: curtainUniforms.uOn,
		uDay: curtainUniforms.uDay,
		uTint: { value: new THREE.Color() },
		uGain: curtainUniforms.uGain,
		uFilm: filmLook,
		uAlpha: { value: 0.06 },
		uResolution: { value: new THREE.Vector2(1, 1) },
		uPixelRatio: pixelRatio,
	};
	const threads = new THREE.Mesh(threadGeometry, new THREE.ShaderMaterial({ uniforms: threadUniforms, vertexShader: threadVertex, fragmentShader: threadFragment, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
	for (const mesh of [curtain, threads]) {
		mesh.frustumCulled = false;
		mesh.renderOrder = WEAVE_RENDER_ORDER;
		mesh.layers.set(layer);
		mesh.visible = false;
		scene.add(mesh);
	}

	const ahead = new THREE.Vector3();
	const across = new THREE.Vector3();
	const centre = new THREE.Vector2(0, -1);
	let on = 0;
	let throwing = false;
	let want = 0;
	let elevation = 0;
	let lastThrow = -1e9;
	let nextThrow = 0;
	let lastHeave = 0;
	let lastRise = 0;
	let height = 8;
	const off = () => {
		curtain.visible = false;
		threads.visible = false;
		on = 0;
		throwing = false;
		curtainUniforms.uThrows.value.fill(-1);
	};
	const update = (frame: BowFrame | undefined) => {
		if (!frame) {
			off();
			return;
		}
		const { time, delta, sun } = frame;
		ahead.set(frame.ahead.x, 0, frame.ahead.y);
		across.set(-frame.ahead.y, 0, frame.ahead.x);

		// Whether the sun allows it: up, and low; the sky clear enough; the wind not too strong; and they free.
		elevation = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(sun.y, -1, 1)));
		const geometry = THREE.MathUtils.smoothstep(elevation, 1, 4) * (1 - THREE.MathUtils.smoothstep(elevation, 30, 40));
		const calm = 1 - THREE.MathUtils.smoothstep(frame.windSpeed, 30, 50);
		want = frame.force === false ? 0 : frame.force === true ? (frame.free > 0.5 ? 1 : 0) : geometry * frame.sunlight * calm * frame.free;
		if (throwing ? want < 0.2 : want > 0.35) throwing = !throwing;
		on += ((throwing ? 1 : 0) - on) * Math.min(1, delta / 4);

		// They throw on each swell that passes under the boat: as it crests.
		const rise = frame.heave - lastHeave;
		const crest = lastRise > 0 && rise <= 0;
		lastHeave = frame.heave;
		lastRise = rise;
		if (throwing && time - lastThrow >= THROWS_APART && (crest || time - lastThrow >= WAITS_AT_MOST)) {
			curtainUniforms.uThrows.value[nextThrow] = time;
			nextThrow = (nextThrow + 1) % THROWS;
			lastThrow = time;
		}

		// The curtain stands down-sun, as high as the bow's top needs, leaning with the wind.
		if (sun.x * sun.x + sun.z * sun.z > 1e-6) centre.set(-sun.x, -sun.z).normalize();
		// (From the eye's own height: the bow's top stands 44 degrees less the sun's height above the eye's level.)
		height = THREE.MathUtils.clamp(frame.boat.y + RADIUS * Math.tan(THREE.MathUtils.degToRad(THREE.MathUtils.clamp(44 - elevation, 5, 60))), 4, 28);
		curtainUniforms.uBoat.value.copy(frame.boat);
		curtainUniforms.uCentre.value.copy(centre);
		curtainUniforms.uHeight.value = height;
		curtainUniforms.uLean.value.set(frame.wind.x, 0, frame.wind.z).multiplyScalar(0.05);
		curtainUniforms.uTime.value = time;
		curtainUniforms.uSun.value.copy(sun);
		// Sunlit spray: white, warmed as the sun goes down.
		curtainUniforms.uSprayColour.value.copy(WARM).lerp(WHITE, THREE.MathUtils.smoothstep(elevation, 0, 12)).multiplyScalar(THREE.MathUtils.lerp(0.25, 1, frame.day));
		curtainUniforms.uSunlight.value = frame.force === true ? Math.max(frame.sunlight, 0.6) * THREE.MathUtils.smoothstep(elevation, -1, 2) : frame.sunlight;
		curtainUniforms.uOn.value = on;
		curtainUniforms.uGain.value = frame.gain;
		curtainUniforms.uDay.value = frame.day;

		// Their threads, each to the foot of her own plume: the one on the left to the left plume.
		const base = Math.atan2(centre.x, centre.y);
		const seats = THROWERS.map((who) => seatOf(who, frame.boat, ahead, across));
		const order = THROWERS.map((who, k) => k).sort((a, b) => {
			const angle = (k: number) => Math.atan2(seats[k]!.x - frame.boat.x, seats[k]!.z - frame.boat.z);
			return Math.sin(angle(a) - base) - Math.sin(angle(b) - base);
		});
		order.forEach((k, j) => {
			const a = base + (PLUMES[j]! - 0.5) * THREE.MathUtils.degToRad(SPAN);
			threadUniforms.uSeats.value[j]!.copy(seats[k]!);
			threadUniforms.uFeet.value[j]!.set(frame.boat.x + Math.sin(a) * RADIUS, 0.3, frame.boat.z + Math.cos(a) * RADIUS);
		});
		threadUniforms.uTint.value.copy(frame.water);
		threadUniforms.uAlpha.value = THREE.MathUtils.lerp(0.08, 0.05, frame.day);
		threadUniforms.uResolution.value.set(window.innerWidth, window.innerHeight).multiplyScalar(pixelRatio.value);
		(threads.material as THREE.ShaderMaterial).blending = frame.day > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending;
		curtain.visible = on > 0.002;
		threads.visible = on > 0.002;
	};

	const describe = () => [
		`sun ${elevation.toFixed(1)}° up, wanted ${Math.round(want * 100)}%, ${throwing ? "throwing" : "not throwing"} (${Math.round(on * 100)}% out)`,
		`the curtain ${RADIUS} m off down-sun, ${height.toFixed(1)} m high, bearing ${Math.round(THREE.MathUtils.radToDeg(Math.atan2(centre.x, -centre.y)))}° off ahead`,
		`throwers: ${THROWERS.map((who) => NAMES[who]).join(", ")}; last throw ${lastThrow > -1e8 ? `${(curtainUniforms.uTime.value - lastThrow).toFixed(1)} s ago` : "none"}`,
	];

	const dispose = () => {
		for (const mesh of [curtain, threads]) {
			scene.remove(mesh);
			(mesh.material as THREE.Material).dispose();
		}
		curtainGeometry.dispose();
		threadGeometry.dispose();
	};

	return { update, describe, dispose, level: () => on };
}
