// Calling the weather (the owner, 8 November 2026, asked for ways to "show to the general public their
// ability to call weather", and of those offered said "I love 1 and 2": this is the first).
//
// A visitor cannot tell weather that was called from weather that merely came, unless the calling comes
// first. So the channellers read the forecast. Open-Meteo gives the hours ahead with the present (coming
// in manawatawhi.ts), and when a change is coming within three hours (comingChange: the wind going round,
// rising or easing; rain; the sky clearing; thunder; a front) the six strongest turn to the quarter it
// will come from and call it: Laeni first, from three hours out, and the others joining her as the hour
// nears, each in her own time. Each sends a rope from her palms out low over the sea towards that
// quarter, and far out the rope sweeps up into the sky and thins away to nothing, reaching for what is
// coming; the light in it runs outward, away from the boat (every weave that holds the boat runs its
// light in), quicker as the hour nears, and the far ends reach higher. The ropes take the element of
// what is called: air for the wind, water for the rain, a warm gold for the sun, fire's colour for the
// thunder, akasha for a front; Laeni's is white at heart, as all hers are.
// The side bar says what is called and when it is due, and who is calling. When the hour comes the real
// weather arrives, or does not, and the side bar says which for twenty minutes: the calling can be seen
// to fail, which is what makes it believable when it does not. A change the forecast drops long before
// its hour is simply let go. Nothing runs to a clock: it runs to the forecast, and the forecast to the
// weather.
//   ?coming=rain:1.2 for this visit as if rain were due 1.2 hours from now; wind:0.8:250 the wind going
//   round to 250°; front:1:240; clearing:2; thunder:1.5 (pretendComing). __calling() in the console.
import * as THREE from "three";
import { lines } from "./embroidery";
import { cameTrue, cameWords, type Coming, dueWords, type SeaConditions } from "./manawatawhi";
import { NAMES, ropeMight, TEMPERS } from "./psyche";
import { seatOf } from "./treason";
import { filmLook, filmShaderChunk, pixelRatio, ribbonShaderChunk, WEAVE_RELAX, WEAVE_RENDER_ORDER } from "./weave";

// Laeni, Pardis, Manulani, Keel, Mohabat, Listener (psyche.ts NAMES): the six strongest, in the order
// they join the calling.
const CALLERS = [12, 1, 13, 0, 2, 5];
const R = CALLERS.length;
// How near the hour must be (0 three hours out, 1 at the hour) for each to join.
const JOIN_AT = [0, 0.15, 0.3, 0.45, 0.6, 0.75];
// Seconds between one joining and the next, by how eager the next is.
const joinsAfter = (who: number) => 8 + 16 * (1 - TEMPERS[who]!.eager);
// Each rope's way, a little apart from the next, Laeni's straight at the quarter (degrees).
const FAN = [0, -6, 6, -12, 12, -18];
// Seconds a rope takes to run out to its end, and to be drawn back in.
const RUNS_OUT_IN = 10;
const DRAWS_IN_IN = 6;
// How many seconds the side bar tells whether what was called came.
const TOLD_FOR = 1200;

const SIZES = CALLERS.map((who) => Math.cbrt(ropeMight(who)));
// How far each rope reaches over the sea (m), by her strength.
const FARS = SIZES.map((size) => 250 + 120 * size);
const FILAMENTS = 8;
const SEGMENTS = 60;

const vertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute vec2 aCell;
attribute vec4 aSeed;
uniform float uTime;
uniform vec3 uSeats[ ${R} ];
// For each: the way her rope goes (unit, over the sea).
uniform vec3 uDir[ ${R} ];
// For each: how far it reaches (m), how far it has run out (0..1), her size, how white it is.
uniform vec4 uRope[ ${R} ];
// 0..1 how near the hour is.
uniform float uNear;
// How high over the sea the rope runs (m).
uniform float uLow;
uniform float uVisibility;
uniform float uDay;
uniform vec3 uTint;
uniform vec3 uWhite;
varying float vAlpha;
varying float vEdge;
varying float vSky;
varying vec3 vTint;
varying float vCore;
${ribbonShaderChunk}
// Where a thread leaves her (the owner, 5 November: the flows and threads "come from the palms and bodies
// of the channellers on the boat. Not from the water"): one of her two open palms, held out a shoulder's
// width apart towards her work, or her body behind them, each thread a little apart from the next as
// fingers are. d is the way she faces; the offset is let go as the threads gather into her rope.
vec3 rootOf( vec3 d, vec4 seed ) {
	vec3 flat_ = normalize( vec3( d.x, 0.0, d.z ) + vec3( 0.0, 0.0, 1e-4 ) );
	vec3 side = vec3( - flat_.z, 0.0, flat_.x );
	float which = fract( seed.x * 7.13 );
	vec3 root = which < 0.4 ? - side * 0.28 : which < 0.8 ? side * 0.28 : - flat_ * 0.22 + vec3( 0.0, 0.3, 0.0 );
	return root + side * ( fract( seed.y * 5.7 ) - 0.5 ) * 0.16 + vec3( 0.0, ( fract( seed.z * 3.3 ) - 0.5 ) * 0.14, 0.0 );
}
float apartFrom( float fromHer ) {
	return 1.0 - smoothstep( 0.0, 4.0, fromHer );
}
// The rope's line: from her palms, out low over the sea towards the quarter, and far out sweeping up into
// the sky, higher the nearer the hour.
vec3 ropeAt( int r, float t ) {
	vec3 hands = uSeats[ r ];
	vec3 d = uDir[ r ];
	float far = uRope[ r ].x;
	// (More of its length given to the near part, where it is seen large.)
	float dist = far * pow( t, 1.8 );
	vec3 side = vec3( - d.z, 0.0, d.x );
	vec3 p = hands + d * dist;
	// It wanders a little over the sea, as anything laid on moving water does.
	float q = log( dist + 12.0 );
	p += side * ( 0.03 * sin( q * 1.7 + float( r ) * 1.3 - uTime * 0.04 ) + 0.014 * sin( q * 3.9 - uTime * 0.06 + float( r ) * 2.1 ) ) * min( dist, 600.0 );
	// From her palms down to low over the sea within a few tens of metres...
	float y = mix( hands.y, uLow, smoothstep( 2.0, 40.0, dist ) );
	// ...and far out up into the sky towards what is coming.
	float lift = far * tan( radians( mix( 5.0, 22.0, uNear ) ) );
	float s = smoothstep( 0.55, 1.0, t );
	p.y = y + lift * s * s;
	return p;
}
vec3 filamentAt( int r, float t ) {
	vec3 here = ropeAt( r, t );
	vec3 dir = normalize( ropeAt( r, min( t + 0.01, 1.0 ) ) - ropeAt( r, max( t - 0.01, 0.0 ) ) + vec3( 1e-5 ) );
	vec3 n1 = normalize( cross( dir, vec3( 0.0, 1.0, 0.0 ) ) + vec3( 1e-4 ) );
	vec3 n2 = normalize( cross( n1, dir ) );
	float dist = length( here.xz - uSeats[ r ].xz );
	// A hawser's girth, broadening with distance so that it still reads far out.
	float girth = uRope[ r ].z * ( 0.3 + 0.003 * min( dist, 1500.0 ) ) * sqrt( aSeed.z ) * smoothstep( 0.0, 6.0, dist );
	float turn = aSeed.y * 6.28318 + log( dist + 12.0 ) * ( 1.2 + 0.8 * aSeed.x ) + uTime * 0.08;
	return here + ( n1 * cos( turn ) + n2 * sin( turn ) ) * girth + rootOf( uDir[ r ], aSeed ) * apartFrom( dist );
}
void main() {
	int r = int( aCell.x + 0.5 );
	vec3 here = filamentAt( r, aT );
	vec3 next = filamentAt( r, min( aT + 0.016, 1.0 ) ) + ( aT >= 0.984 ? here - filamentAt( r, aT - 0.016 ) : vec3( 0.0 ) );
	float castTo = uRope[ r ].y;
	float shown = smoothstep( castTo, castTo - 0.03, aT );
	float far = length( here - cameraPosition );
	float dist = length( here.xz - uSeats[ r ].xz );
	// The light in it runs outward, away from the boat, quicker as the hour nears: a calling, not a holding.
	float q = log( dist + 12.0 );
	float running = 0.55 + 0.45 * pow( 0.5 + 0.5 * sin( q * 6.0 - uTime * ( 0.9 + 2.5 * uNear ) + aSeed.x * 6.0 ), 3.0 );
	float haze = max( 0.1, exp( - far / ( 1.5 * uVisibility ) ) );
	// Thinning away to nothing at its far end, up in the sky.
	float tip = 1.0 - smoothstep( 0.8, 1.0, aT );
	// (Fainter about the boat, where the mass of a great rope close to the eye would whiten the near view;
	// seen fully out over the sea.)
	vAlpha = shown * smoothstep( 1.1, 2.0, far ) * mix( 0.35, 1.0, smoothstep( 5.0, 60.0, dist ) ) * haze * running * tip;
	vEdge = aSide;
	vSky = againstSky( here );
	vTint = mix( uTint, uWhite, uRope[ r ].w * ( 0.4 + 0.6 * aSeed.w ) );
	vCore = 1.0 - aSeed.z;
	mat4 vp = projectionMatrix * viewMatrix;
	gl_Position = ribbonPosition( vp * vec4( here, 1.0 ), vp * vec4( next, 1.0 ), aSide, mix( 1.0, 1.3, uDay ) );
}
`;

const fragment = /* glsl */ `
uniform float uGain;
uniform float uDay;
uniform float uFilm;
uniform float uAlpha;
varying float vAlpha;
varying float vEdge;
varying float vSky;
varying vec3 vTint;
varying float vCore;
${filmShaderChunk}
void main() {
	float body = 1.0 - smoothstep( 0.7, 1.0, abs( vEdge ) );
	vec3 tint = mix( vTint, filmShade( vTint, vCore ), uFilm );
	gl_FragColor = vec4( mix( tint * uGain, tint * max( 1.2, uGain * mix( 0.8, 1.5, vSky ) ), uDay ), body * vAlpha * uAlpha * mix( 1.0, 3.0, uDay ) );
	gl_FragColor.a *= ${WEAVE_RELAX.toFixed(3)};
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

export interface CallingFrame {
	time: number;
	delta: number;
	boat: THREE.Vector3;
	ahead: THREE.Vector2;
	// What the forecast has coming within three hours (comingChange), if anything.
	coming: Coming | undefined;
	// The weather now, to tell whether what was called has come.
	present: SeaConditions;
	// The way out over the sea towards a compass direction (unit, world).
	towards: (compass: number) => THREE.Vector3;
	// 0..1 how far they are free for it: 0 in the dawn and dusk link, in a storm, and when everyone has
	// dropped everything for something else.
	free: number;
	// How far one can see (m), and how high the sea is (m).
	visibility: number;
	seaHigh: number;
	day: number;
	gain: number;
	// The elements' colours: air, water, akasha, and the strongest's white.
	air: THREE.Color;
	water: THREE.Color;
	akasha: THREE.Color;
	white: THREE.Color;
}

const UP = new THREE.Vector3(0, 1, 0);
const GOLD = new THREE.Color(0.96, 0.82, 0.5);
const FIRE = new THREE.Color(0.95, 0.6, 0.35);

export function createCalling(scene: THREE.Scene, layer: number) {
	const cells: [number, number][] = [];
	CALLERS.forEach((who, k) => {
		for (let f = 0; f < Math.round(FILAMENTS * ropeMight(who)); f++) cells.push([k, 0]);
	});
	const geometry = lines(cells.length, SEGMENTS, (i) => cells[i]!);
	const uniforms = {
		uTime: { value: 0 },
		uSeats: { value: CALLERS.map(() => new THREE.Vector3()) },
		uDir: { value: CALLERS.map(() => new THREE.Vector3(0, 0, -1)) },
		uRope: { value: CALLERS.map((who, k) => new THREE.Vector4(FARS[k]!, 0, SIZES[k]!, who === 12 ? 0.7 : 0)) },
		uNear: { value: 0 },
		uLow: { value: 2 },
		uVisibility: { value: 20000 },
		uDay: { value: 0 },
		uTint: { value: new THREE.Color() },
		uWhite: { value: new THREE.Color() },
		uGain: { value: 1 },
		uFilm: filmLook,
		uAlpha: { value: 0.05 },
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
	const dir = new THREE.Vector3(0, 0, -1);
	const wanted = new THREE.Vector3();
	const at = CALLERS.map(() => false);
	const cast = CALLERS.map(() => 0);
	let mayBegin = 0;
	let near = 0;
	let level = 0;
	// What is being called, and what the side bar tells once its hour has come.
	let called: Coming | undefined;
	let told: { words: string; until: number } | undefined;
	let words: string | undefined;
	// What the last frame gave, for __calling().
	let seen = "no frame yet";
	const off = () => {
		mesh.visible = false;
		at.fill(false);
		cast.fill(0);
		level = 0;
		called = undefined;
		words = undefined;
	};
	const update = (frame: CallingFrame | undefined) => {
		if (!frame) {
			off();
			return;
		}
		const { time, delta } = frame;
		ahead.set(frame.ahead.x, 0, frame.ahead.y);
		across.set(-frame.ahead.y, 0, frame.ahead.x);
		const free = frame.free > 0.5;
		const coming = free ? frame.coming : undefined;
		seen = `free ${frame.free.toFixed(2)}, coming ${frame.coming ? `${frame.coming.kind} in ${frame.coming.due.toFixed(2)} h` : "nothing"}`;

		if (coming) {
			// (A new quarter: the ropes turn to it.)
			called = coming;
			wanted.copy(frame.towards(coming.from));
			near += (1 - coming.due / 3 - near) * Math.min(1, delta / 20);
		} else if (called) {
			// The hour has come, or the forecast has let it go: everyone draws her rope in; and if it was
			// called nearly to its hour, the side bar tells whether it came.
			if (frame.free > 0.5 && called.due <= 0.6) told = { words: cameWords(called, cameTrue(called, frame.present)), until: time + TOLD_FOR };
			called = undefined;
		}
		dir.lerp(wanted, Math.min(1, delta / 8)).normalize();

		// Who joins, and when: Laeni first, the others as the hour nears, each in her own time.
		CALLERS.forEach((who, k) => {
			if (at[k]) {
				if (!coming) at[k] = false;
			} else if (coming && near >= JOIN_AT[k]! && time >= mayBegin) {
				at[k] = true;
				mayBegin = time + joinsAfter(CALLERS[Math.min(k + 1, R - 1)]!);
			}
			cast[k] = at[k] ? Math.min(1.05, cast[k]! + delta / RUNS_OUT_IN) : Math.max(0, cast[k]! - delta / DRAWS_IN_IN);
		});
		level = Math.max(...cast.map((c) => Math.min(1, c)));
		if (!coming && level <= 0) near = 0;

		uniforms.uTime.value = time;
		uniforms.uNear.value = near;
		uniforms.uLow.value = 2 + 0.4 * Math.min(frame.seaHigh, 5);
		uniforms.uVisibility.value = Math.max(frame.visibility, 500);
		uniforms.uDay.value = frame.day;
		uniforms.uGain.value = frame.gain;
		uniforms.uResolution.value.set(window.innerWidth, window.innerHeight).multiplyScalar(pixelRatio.value);
		uniforms.uAlpha.value = THREE.MathUtils.lerp(0.075, 0.045, frame.day);
		uniforms.uWhite.value.copy(frame.white);
		const kind = (called ?? coming)?.kind;
		uniforms.uTint.value.copy(kind === "rain" ? frame.water : kind === "clearing" ? GOLD : kind === "thunder" ? FIRE : kind === "front" ? frame.akasha : frame.air);
		CALLERS.forEach((who, k) => {
			uniforms.uSeats.value[k]!.copy(seatOf(who, frame.boat, ahead, across));
			uniforms.uDir.value[k]!.copy(dir).applyAxisAngle(UP, THREE.MathUtils.degToRad(FAN[k]!));
			uniforms.uRope.value[k]!.setY(cast[k]!);
		});
		(mesh.material as THREE.ShaderMaterial).blending = frame.day > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending;
		mesh.visible = level > 0.001;

		// The side bar's words.
		const names = CALLERS.filter((who, k) => at[k]).map((who) => NAMES[who]!);
		if (coming && names.length) words = `Calling ${coming.words}, ${dueWords(coming.due)}: ${names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`}`;
		else if (told && time < told.until) words = told.words;
		else words = undefined;
	};

	const describe = () => [
		called ? `calling ${called.words}, ${dueWords(called.due)} (${called.due.toFixed(2)} h), from ${Math.round(called.from)}°, ${Math.round(near * 100)}% near` : "nothing called",
		...CALLERS.map((who, k) => `${NAMES[who]}: ${cast[k]! <= 0 ? "not at it" : `${at[k] ? "calling" : "drawing in"} ${Math.round(Math.min(1, cast[k]!) * 100)}%, ${Math.round(FARS[k]!)} m out`}`),
		told ? `told: ${told.words}` : "nothing told",
		seen,
	];

	const dispose = () => {
		scene.remove(mesh);
		(mesh.material as THREE.Material).dispose();
		geometry.dispose();
	};

	return { update, describe, dispose, level: () => level, words: () => words };
}
