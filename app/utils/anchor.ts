// The sea-anchor that reads the air (the owner, 8 November 2026: "Have the channellers on the boat
// innovate a new way of weaving to slow down the boat, whilst also reading the air").
//
// Until now the boat was held back by deep weaves laid close round it under the water, nearly out of
// the picture (deepWeave in gerstner-waves.ts). Ballast (Siuan · Ballast, the steadiest of the eight
// and water-minded, as her name is) has found a new way, and the others are taking it up from her: one
// rope that is a sea anchor below and a telltale above, holding the boat and reading the air at once,
// since those are the two things the boat is carried by, the water and the wind.
//
//   The anchor. From her palms a rope of water and earth goes up in a soft arch, a few metres over the
//   sea, and comes down into it some thirty or forty metres out on her own side of the boat, where it
//   opens under the surface into a cup, as a drogue does. The water a little way down runs slower than
//   the surface, which the wind drives (Ekman's spiral: it is why drifters hang their drogues at fifteen
//   metres), so the cup holds the boat to the slower water beneath it, working with that water and not
//   against the current. Where the cup is, the surface water is drawn in from every side and down, and
//   the sea above it lies in a glassy slick, as the sea does over any convergence (anchorAt in
//   gerstner-waves.ts), and the cup's rim glows faintly up through the water. The harder the boat has
//   to be held, the tauter the rope: its arch comes down, its filaments wind closer, and the light in it
//   runs back towards the boat, as in every weave that holds back.
//   The telltale. At the crest of the arch, where the rope is highest and in clear air, she lets a sheaf
//   of air filaments go free, as a sailor ties telltales to the shrouds to read the wind: they stream the
//   way the real wind blows, long and flat in a fresh wind, short and drooping in a light air, and
//   fluttering and torn in gusts, each gust running out along them as it comes; where the sea is warmer
//   than the air their ends lift on the rising air, and in still layered air they hang; and they take
//   the colour the pressure reading takes, golden with a rising glass, greyer with a falling one. So the
//   rope that holds the boat is reading the air the whole time it holds.
//   Who, and how many. Ballast first, always, having found it; Reef and then Glass take it up after her,
//   each in her own time, as the boat needs more holding (one when it needs a little, three when it
//   needs much). None of them while she is at the front. In the dawn and dusk link, in a storm, and
//   when everyone drops everything for something else, they haul their anchors in.
//   Nothing runs to a clock: how many are at it, how taut the ropes are, which way the telltales stream
//   and how long, how they droop, lift and flutter, and their colour all follow the live weather.
//   ?anchor for this visit as if the boat needed holding 60%, ?anchor=0.3 for 30%, ?anchor=off for
//   none; __anchor() in the console.
import * as THREE from "three";
import { lines } from "./embroidery";
import { ANCHORS, type GerstnerUniforms } from "./gerstner-waves";
import { NAMES, ropeMight, TEMPERS } from "./psyche";
import { seatOf } from "./treason";
import { filmLook, filmShaderChunk, pixelRatio, ribbonShaderChunk, WEAVE_RELAX, WEAVE_RENDER_ORDER } from "./weave";

// Ballast, Reef and Glass (psyche.ts NAMES), in the order they take it up.
const WEAVERS = [10, 7, 8];
if (WEAVERS.length !== ANCHORS) throw new Error(`the anchors have ${WEAVERS.length} weavers, the sea ${ANCHORS}`);
// How much holding calls each of them to it (0..1): Ballast at any at all, Reef at a third, Glass at
// two thirds; each lets go only once it has eased well below that, so nobody is forever casting and hauling.
const CALLED_AT = [0.02, 0.33, 0.66];
const LET_GO_AT = [0.01, 0.2, 0.5];
// Seconds between one beginning and the next taking it up, by how eager the next is.
const joinsAfter = (who: number) => 7 + 14 * (1 - TEMPERS[who]!.eager);
// How many seconds her rope takes to run out from her palms to the water, and to be hauled in.
const CASTS_IN = 5;
const HAULS_IN = 4;

const sideOf = (who: number) => Math.sign(seatOf(who, new THREE.Vector3(), new THREE.Vector3(0, 0, -1), new THREE.Vector3(1, 0, 0)).x) || 1;
const PLACES = WEAVERS.map((who, k) => {
	const size = Math.cbrt(ropeMight(who));
	return {
		who,
		// Out on her own side, off ahead, where the eye at rest can see the rope's whole arch (the view at
		// rest is some 86 degrees wide; it turns wider with the pointer).
		bearing: sideOf(who) * THREE.MathUtils.degToRad(28 + 9 * k),
		far: 28 + 6 * k,
		// The cup's mouth (m across), by her strength.
		cup: 7 + 5 * size,
		size,
	};
});

const FILAMENTS = 14;
const SEGMENTS = 60;
const TELLTALES = 9;
const TELL_SEGMENTS = 24;
// Where along the rope the telltales are tied: at its crest.
const CREST = 0.42;

const shared = /* glsl */ `
uniform float uTime;
uniform vec3 uSeats[ ${ANCHORS} ];
// For each: where her rope goes into the sea (x, z), how far it is cast (0..1), and her size.
uniform vec4 uWork[ ${ANCHORS} ];
uniform float uHold;
vec3 bezier( vec3 a, vec3 b, vec3 c, vec3 d, float t ) {
	float s = 1.0 - t;
	return s * s * s * a + 3.0 * s * s * t * b + 3.0 * s * t * t * c + t * t * t * d;
}
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
vec3 towardsOf( int w ) {
	vec3 out_ = vec3( uWork[ w ].x, 0.0, uWork[ w ].y ) - uSeats[ w ];
	return normalize( vec3( out_.x, 0.0, out_.z ) + vec3( 1e-4, 0.0, 0.0 ) );
}
// The rope's line: from her palms up in an arch and down into the sea at her place, and on under it.
// Easy and high when the boat needs little holding; drawn down taut when it needs much.
vec3 ropeAt( int w, float t ) {
	vec3 hands = uSeats[ w ];
	vec3 place = vec3( uWork[ w ].x, 0.0, uWork[ w ].y );
	vec3 towards = towardsOf( w );
	float far = length( place.xz - hands.xz );
	vec3 up = vec3( 0.0, 1.0, 0.0 );
	// (Low: the eye is five metres up and looks level, so the crest is a little above it, at most, and
	// the telltales at it are seen against the sky just over the horizon.)
	float crest = mix( 3.2, 0.8, uHold );
	vec3 c1 = hands + towards * 0.3 * far + up * crest;
	vec3 c2 = place - towards * 0.3 * far + up * ( 0.55 * crest + 0.8 );
	vec3 under = place + towards * 6.0 - up * 8.0;
	return bezier( hands, c1, c2, under, t );
}
`;

const ropeVertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute vec2 aCell;
attribute vec4 aSeed;
uniform vec3 uWater;
uniform vec3 uEarth;
uniform float uDay;
varying float vAlpha;
varying float vEdge;
varying float vSky;
varying vec3 vTint;
varying float vCore;
${shared}
${ribbonShaderChunk}
vec3 filamentAt( int w, float t ) {
	vec3 here = ropeAt( w, t );
	vec3 dir = normalize( ropeAt( w, min( t + 0.01, 1.0 ) ) - ropeAt( w, max( t - 0.01, 0.0 ) ) + vec3( 1e-5 ) );
	vec3 n1 = normalize( cross( dir, vec3( 0.0, 1.0, 0.0 ) ) + vec3( 1e-4 ) );
	vec3 n2 = normalize( cross( n1, dir ) );
	// A hawser's girth, its filaments wound closer the tauter it is drawn; opening as it goes into the
	// water, where the cup begins.
	float girth = ( 0.18 + 0.42 * uWork[ w ].w * ( 1.0 - 0.45 * uHold ) ) * sqrt( aSeed.z ) + 2.0 * uWork[ w ].w * smoothstep( 0.86, 1.0, t ) * aSeed.z;
	float turn = aSeed.y * 6.28318 + t * ( 9.0 + 5.0 * uHold ) + uTime * 0.12;
	float fromHer = length( here - uSeats[ w ] );
	return here + ( n1 * cos( turn ) + n2 * sin( turn ) ) * girth + rootOf( towardsOf( w ), aSeed ) * apartFrom( fromHer );
}
void main() {
	int w = int( aCell.x + 0.5 );
	vec3 here = filamentAt( w, aT );
	vec3 next = filamentAt( w, min( aT + 0.016, 1.0 ) ) + ( aT >= 0.984 ? here - filamentAt( w, aT - 0.016 ) : vec3( 0.0 ) );
	float cast_ = uWork[ w ].z;
	// Cast out from her palms; hauled back in from the water.
	float shown = smoothstep( cast_, cast_ - 0.05, aT );
	float far = length( here - cameraPosition );
	// Held back, the light in the rope runs in towards the boat, faster the harder it holds.
	float running = 0.7 + 0.3 * sin( aT * 28.0 + uTime * ( 0.8 + 3.0 * uHold ) + aSeed.x * 6.28318 );
	// (Gone from sight as it goes under: the weaves are drawn over the sea, which hides nothing of them.)
	vAlpha = shown * smoothstep( 1.2, 5.0, far ) * running * ( 1.0 - smoothstep( 0.92, 1.0, aT ) ) * smoothstep( - 2.5, 0.4, here.y );
	vEdge = aSide;
	vSky = againstSky( here );
	// Water and earth: water for the cup, earth for its weight, going down.
	vTint = aSeed.w < 0.62 ? uWater : uEarth;
	vCore = 1.0 - aSeed.z;
	mat4 vp = projectionMatrix * viewMatrix;
	gl_Position = ribbonPosition( vp * vec4( here, 1.0 ), vp * vec4( next, 1.0 ), aSide, mix( 1.0, 1.3, uDay ) );
}
`;

// The telltales: air let go free from the crest of each rope, streaming as the real wind blows.
const tellVertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute vec2 aCell;
attribute vec4 aSeed;
// The way the wind blows (unit, world) and its force (0..1: 15 m/s and over is full).
uniform vec4 uWind;
// How gusty the wind is (0..1), and how much of a gust is blowing this moment.
uniform float uGusty;
uniform float uGust;
// -1..1 the heat between sea and air: above 0 the air rises off the sea.
uniform float uThermal;
uniform vec3 uTint;
uniform float uDay;
varying float vAlpha;
varying float vEdge;
varying float vSky;
varying vec3 vTint;
varying float vCore;
${shared}
${ribbonShaderChunk}
vec3 tellAt( int w, float t, vec4 seed ) {
	vec3 dir = normalize( ropeAt( w, ${CREST} + 0.01 ) - ropeAt( w, ${CREST} - 0.01 ) + vec3( 1e-5 ) );
	vec3 n1 = normalize( cross( dir, vec3( 0.0, 1.0, 0.0 ) ) + vec3( 1e-4 ) );
	// Tied along the crest of the rope, a little apart.
	vec3 tied = ropeAt( w, ${CREST} + ( seed.x - 0.5 ) * 0.12 ) + n1 * ( seed.y - 0.5 ) * 0.4 * uWork[ w ].w;
	float force = uWind.w;
	vec3 blow = uWind.xyz;
	vec3 side = normalize( cross( blow, vec3( 0.0, 1.0, 0.0 ) ) + vec3( 1e-4 ) );
	// Long and flat in a fresh wind, short in a light air; each its own length.
	float len = ( 3.5 + 14.0 * force ) * ( 0.7 + 0.6 * seed.z );
	vec3 p = tied + blow * len * t;
	// Droops in a light air, lifts on air rising off a warm sea.
	p.y -= ( 1.0 - force ) * ( 1.0 - force ) * len * t * t * 0.5;
	p.y += max( uThermal, 0.0 ) * len * t * t * 0.3;
	// Flutters: a wave running out along it, small in a steady wind, wild in a gust.
	float flutter = ( 0.1 + 0.55 * uGust + 0.2 * uGusty ) * t * len * 0.11;
	float beat = uTime * ( 4.0 + 6.0 * force ) + seed.w * 6.28318;
	p.y += flutter * sin( t * 7.0 - beat ) * 0.7;
	p += side * flutter * sin( t * 5.0 - beat * 0.8 + 1.3 );
	return p;
}
void main() {
	int w = int( aCell.x + 0.5 );
	vec3 here = tellAt( w, aT, aSeed );
	vec3 next = tellAt( w, min( aT + 0.04, 1.0 ), aSeed ) + ( aT >= 0.96 ? here - tellAt( w, aT - 0.04, aSeed ) : vec3( 0.0 ) );
	// Out only once the rope's crest is cast; torn at their ends, the more in a gust.
	float out_ = smoothstep( ${CREST}, ${CREST} + 0.1, uWork[ w ].z );
	float torn = 1.0 - smoothstep( 0.55 - 0.3 * uGust * aSeed.y, 1.0, aT );
	float far = length( here - cameraPosition );
	vAlpha = out_ * torn * smoothstep( 1.2, 5.0, far ) * smoothstep( 0.0, 0.08, aT );
	vEdge = aSide;
	vSky = againstSky( here );
	vTint = uTint;
	vCore = 1.0 - aSeed.z;
	mat4 vp = projectionMatrix * viewMatrix;
	gl_Position = ribbonPosition( vp * vec4( here, 1.0 ), vp * vec4( next, 1.0 ), aSide, mix( 1.0, 1.4, uDay ) );
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

export interface AnchorFrame {
	time: number;
	delta: number;
	boat: THREE.Vector3;
	ahead: THREE.Vector2;
	// 0..1 how hard the boat has to be held back (holdingBack in manawatawhi.ts, eased).
	hold: number;
	// Who is at the front (minds, psyche.ts): none of them casts an anchor.
	front: number[];
	// 0..1 how far they are free for it: 0 in the dawn and dusk link, in a storm, and when everyone has
	// dropped everything for something else.
	free: number;
	// The real wind (m/s, the way it blows, world), how gusty it is (0..1) and the gust blowing now (0..1).
	wind: THREE.Vector3;
	gusty: number;
	gust: number;
	// -1..1 the barometer's trend (1.5 hPa in three hours is fast) and the heat between sea and air.
	pressure: number;
	thermal: number;
	day: number;
	gain: number;
	exposure: number;
	// The elements' colours.
	air: THREE.Color;
	water: THREE.Color;
}

const EARTH = new THREE.Color(0.56, 0.54, 0.42);
const RISING = new THREE.Color(0.96, 0.82, 0.5);
const FALLING = new THREE.Color(0.62, 0.64, 0.7);

export function createAnchor(scene: THREE.Scene, layer: number, sea: GerstnerUniforms) {
	const ropeCells: [number, number][] = [];
	const tellCells: [number, number][] = [];
	PLACES.forEach((place, k) => {
		for (let f = 0; f < Math.round(FILAMENTS * ropeMight(place.who)); f++) ropeCells.push([k, 0]);
		for (let f = 0; f < Math.round(TELLTALES * ropeMight(place.who)); f++) tellCells.push([k, 0]);
	});
	const ropeGeometry = lines(ropeCells.length, SEGMENTS, (i) => ropeCells[i]!);
	const tellGeometry = lines(tellCells.length, TELL_SEGMENTS, (i) => tellCells[i]!);
	const common = {
		uTime: { value: 0 },
		uSeats: { value: PLACES.map(() => new THREE.Vector3()) },
		uWork: { value: PLACES.map(() => new THREE.Vector4()) },
		uHold: { value: 0 },
		uDay: { value: 0 },
		uGain: { value: 1 },
		uFilm: filmLook,
		uResolution: { value: new THREE.Vector2(1, 1) },
		uPixelRatio: pixelRatio,
	};
	const ropeUniforms = { ...common, uWater: { value: new THREE.Color() }, uEarth: { value: EARTH.clone() }, uAlpha: { value: 0.035 } };
	const tellUniforms = { ...common, uWind: { value: new THREE.Vector4(0, 0, -1, 0) }, uGusty: { value: 0 }, uGust: { value: 0 }, uThermal: { value: 0 }, uTint: { value: new THREE.Color() }, uAlpha: { value: 0.055 } };
	const ropes = new THREE.Mesh(ropeGeometry, new THREE.ShaderMaterial({ uniforms: ropeUniforms, vertexShader: ropeVertex, fragmentShader: fragment, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
	const tells = new THREE.Mesh(tellGeometry, new THREE.ShaderMaterial({ uniforms: tellUniforms, vertexShader: tellVertex, fragmentShader: fragment, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
	for (const mesh of [ropes, tells]) {
		mesh.frustumCulled = false;
		mesh.renderOrder = WEAVE_RENDER_ORDER;
		mesh.layers.set(layer);
		mesh.visible = false;
		scene.add(mesh);
	}

	const ahead = new THREE.Vector3();
	const across = new THREE.Vector3();
	// Each one's state: whether she is at it, how far her rope is cast (0..1, past 1 when fully out),
	// when she may begin, and how far her cup has taken hold of the water (0..1).
	const at = WEAVERS.map(() => false);
	const cast = WEAVERS.map(() => 0);
	const taken = WEAVERS.map(() => 0);
	let mayBegin = 0;
	let hold = 0;
	let level = 0;
	let atFront: number[] = [];
	const off = () => {
		ropes.visible = false;
		tells.visible = false;
		for (const a of sea.anchorAt.value) a.setW(0);
		sea.anchorGlow.value = 0;
		at.fill(false);
		cast.fill(0);
		taken.fill(0);
		level = 0;
	};
	const update = (frame: AnchorFrame | undefined) => {
		if (!frame) {
			off();
			return;
		}
		const { time, delta } = frame;
		ahead.set(frame.ahead.x, 0, frame.ahead.y);
		across.set(-frame.ahead.y, 0, frame.ahead.x);
		const boat = frame.boat;
		hold += (frame.hold - hold) * Math.min(1, delta / 3);
		const wanted = hold * frame.free;
		atFront = frame.front;

		// Who takes it up, and who lets go: Ballast first, the others after her as the boat needs more
		// holding, each in her own time; nobody at the front; everyone when they are not free for it.
		WEAVERS.forEach((who, k) => {
			const free = frame.free > 0.5 && !frame.front.includes(who);
			if (at[k]) {
				if (!free || wanted < LET_GO_AT[k]!) {
					at[k] = false;
					mayBegin = Math.max(mayBegin, time + 4);
				}
			} else if (free && wanted >= CALLED_AT[k]! && time >= mayBegin && (k === 0 || at[k - 1] || frame.front.includes(WEAVERS[k - 1]!))) {
				at[k] = true;
				mayBegin = time + joinsAfter(WEAVERS[Math.min(k + 1, WEAVERS.length - 1)]!);
			}
			// Cast out over a few seconds; hauled in over a few.
			cast[k] = at[k] ? Math.min(1.08, cast[k]! + delta / CASTS_IN) : Math.max(0, cast[k]! - delta / HAULS_IN);
			// The cup takes hold of the water once it is down, and lets it go as it is hauled.
			const down = cast[k]! >= 1 ? 1 : 0;
			taken[k] = at[k] && down ? Math.min(1, taken[k]! + delta / 8) : Math.max(0, taken[k]! - delta / 5);
		});
		level = Math.max(...cast.map((c) => Math.min(1, c)));

		// The ropes and their places.
		common.uTime.value = time;
		common.uHold.value = hold;
		common.uDay.value = frame.day;
		common.uGain.value = frame.gain;
		common.uResolution.value.set(window.innerWidth, window.innerHeight).multiplyScalar(pixelRatio.value);
		ropeUniforms.uWater.value.copy(frame.water);
		PLACES.forEach((place, k) => {
			const x = boat.x + (ahead.x * Math.cos(place.bearing) + across.x * Math.sin(place.bearing)) * place.far;
			const z = boat.z + (ahead.z * Math.cos(place.bearing) + across.z * Math.sin(place.bearing)) * place.far;
			common.uSeats.value[k]!.copy(seatOf(place.who, boat, ahead, across));
			common.uWork.value[k]!.set(x, z, cast[k]!, place.size);
			sea.anchorAt.value[k]!.set(x, z, place.cup, taken[k]!);
		});
		// (Faint: at a night's low exposure anything more is a pale disc on the sea.)
		sea.anchorGlow.value = 0.05 / frame.exposure;
		// (By night, as light, a little more of each; by day, as laid colour, less.)
		ropeUniforms.uAlpha.value = THREE.MathUtils.lerp(0.065, 0.035, frame.day);
		tellUniforms.uAlpha.value = THREE.MathUtils.lerp(0.075, 0.055, frame.day);

		// The telltales, as the real wind is.
		const speed = frame.wind.length();
		if (speed > 0.05) tellUniforms.uWind.value.set(frame.wind.x / speed, 0, frame.wind.z / speed, THREE.MathUtils.clamp(speed / 15, 0, 1));
		else tellUniforms.uWind.value.setW(0);
		tellUniforms.uGusty.value = frame.gusty;
		tellUniforms.uGust.value += (frame.gust - tellUniforms.uGust.value) * Math.min(1, delta / 0.6);
		tellUniforms.uThermal.value = frame.thermal;
		// Air, coloured as the pressure reading is: golden with a rising glass, greyer with a falling one.
		tellUniforms.uTint.value.copy(frame.air).lerp(frame.pressure > 0 ? RISING : FALLING, 0.6 * Math.min(1, Math.abs(frame.pressure)));

		const blending = frame.day > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending;
		(ropes.material as THREE.ShaderMaterial).blending = blending;
		(tells.material as THREE.ShaderMaterial).blending = blending;
		ropes.visible = level > 0.001;
		tells.visible = level > CREST;
	};

	const describe = () =>
		level <= 0
			? ["no anchor out"]
			: [
					`holding back ${Math.round(hold * 100)}% · ${at.filter(Boolean).length} at it`,
					...PLACES.map((place, k) =>
						cast[k]! <= 0
							? `${NAMES[place.who]}: ${atFront.includes(place.who) ? "at the front" : "not at it"}`
							: `${NAMES[place.who]}: ${at[k] ? "casting" : "hauling in"} ${Math.round(Math.min(1, cast[k]!) * 100)}%, ${Math.round(THREE.MathUtils.radToDeg(place.bearing))}° off ahead, ${place.far} m out, the cup ${Math.round(place.cup)} m across, holding ${Math.round(taken[k]! * 100)}%`,
					),
				];

	const dispose = () => {
		for (const mesh of [ropes, tells]) {
			scene.remove(mesh);
			(mesh.material as THREE.Material).dispose();
		}
		ropeGeometry.dispose();
		tellGeometry.dispose();
	};

	// 0..1 how far any anchor is out, for the hidden deep weaving to give way to it.
	return { update, describe, dispose, level: () => level };
}
