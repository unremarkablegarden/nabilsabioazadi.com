// Leane cuts the rain off (the owner, 16 October: "Leane has cut the rain off using an innovative
// weave"). Leane · Kite, the most air-minded of Leane's four, at the front beside the viewer.
//
// The cloud keeps raining; she does not touch it. What she cuts is the rain's way down. Below
// the cloud the drops fall through air she has warmed and dried, and a drop in warm dry air
// evaporates (as virga does over a desert): the rain still falls out of the cloud, thins as it
// comes down, and is gone some tens of metres above the sea, which it no longer reaches. So the
// rain at the sea is cut off while the storm overhead goes on.
//
// The cost is heat. Evaporating rain takes its latent heat from the air, some 2.5 MJ for every
// kilogram: the channelled storm's 56 mm an hour asks about 40 kW of every square metre she keeps
// dry, far more than the sun gives. So her weave is a heater, laid where the wind will carry its
// warmth over the boat: out of her two hands two ropes rise and run out upwind and across it, a
// long gentle curve each way, and all along them their filaments peel off one by one and stream
// downwind over the boat, level, a few tens of metres up, like the tails of kites: a canopy of
// warm thread the rain falls into. The ropes thin as they go, as their filaments leave them.
//
// Effort, as heat (as the twelve's is in the calming): the harder it rains above, the hotter she
// runs, Leane's quick temperament the quickest; hot, her threads shimmer and stir; when she can
// hold no more she sighs, the canopy billows up and out, and for a moment the layer cools and the
// rain gets nearer the sea before she has it again. Over the hours she tires: the canopy sags,
// and the rain is cut off lower. She holds it while there is rain above to cut; when the cloud has
// no more (the storm's end, or the strongest's stilling emptying it) she lets go, the cut running
// out along the ropes from her hands.
//
// It takes an extraordinary amount from her (the owner, the same morning: "Give her credit. Make
// her weaves shine like the moon, make the other flows around the water stop because they impress
// the other channellers so much. She first cuts the rain and then she begins to stop the waves.
// She almost burns out from all of this over 9 minutes"), then "do this in 88 seconds". So it
// is one act of 88 seconds:
//   0 to 32 s        the rain cut off, as above
//   35 to 88 s       she turns to the sea as well and begins to press the waves out of it round the
//                    boat: some of her canopy's threads come down and lie out over the water, and
//                    under them the wind's sea and the swell sink (the wind still blows: she stops
//                    the waves, not the weather), the stilled water spreading out from the boat to
//                    a kilometre and more, the storm's sea breaking against its edge
//   all through      her weave shines like the moon, silver, brighter the more she pours into it;
//                    the twelve stop their own flows about the water and watch her
//   to 88 s          her heat climbs towards burning out; in the last twelve seconds her light gutters
//                    and her threads fray and hang; then she has to let go. The storm is still
//                    there: the rain comes back down out of the cloud and the waves rise again,
//                    and she rests.
// Set in storm.json ("rainCut": { "from": ISO time }); ?raincut begins it as the page opens,
// ?raincut=60 shows it a minute in, ?raincut=off without it.
import * as THREE from "three";
import { lines } from "./embroidery";
import { pixelRatio, ribbonShaderChunk, WEAVE_RENDER_ORDER } from "./weave";
import stormSwitch from "~~/storm.json";
import type { SeaConditions } from "./manawatawhi";

const FILAMENTS = 520;

// Seconds since she began, if she has.
export function rainCutSince(now: Date, asked: string | null, opened: number, ownStorm = false): number | undefined {
	if (asked === "off") return undefined;
	if (asked !== null) return asked !== "" && Number.isFinite(Number(asked)) ? Math.max(0, Number(asked)) : (now.getTime() - opened) / 1000;
	if (ownStorm) return undefined;
	const { rainCut } = stormSwitch as { rainCut?: { from: string | null } };
	if (!rainCut?.from) return undefined;
	const seconds = (now.getTime() - new Date(rainCut.from).getTime()) / 1000;
	return seconds < 0 ? undefined : seconds;
}

const { smoothstep } = THREE.MathUtils;
// How long she can hold it: 88 seconds (the owner, after the first nine-minute version: "I want
// you to be able to do this in 88 seconds"), and then she is all but burnt out. Everything in it
// keeps its order and its share of the time.
export const LEANE_HOLDS = 88;

// Where she is in it, s seconds in.
export function leaneAct(s: number) {
	const H = LEANE_HOLDS;
	return {
		// 0..1 how much of the rain at the sea is cut off: her ropes out in four seconds, the canopy
		// over the boat by half a minute; once she lets go it comes back down in half a minute.
		rain: smoothstep(s, 4, 32) * (1 - smoothstep(s, H + 2, H + 30)),
		// 0..1 how far the waves round the boat are pressed down, and how far out from it (m); once
		// she lets go they rise again over a minute.
		sea: smoothstep(s, 35, 76) * (1 - smoothstep(s, H + 5, H + 65)),
		reach: 60 + 1700 * smoothstep(s, 35, 85) ** 1.2,
		// 0..1 how far the twelve have stopped their own flows to watch her.
		watching: smoothstep(s, 7, 20) * (1 - smoothstep(s, H, H + 40)),
		// 0..1 her heat as the act goes on: nearly burnt out at the end.
		strain: 0.2 + 0.77 * smoothstep(s, 3, H) ** 1.3,
		// 0..1 how spent: her light gutters in the last twelve seconds.
		spent: smoothstep(s, H - 12, H),
		// 0..1.05 how far the cut has run out from her hands, once she lets go.
		letGo: THREE.MathUtils.clamp((s - H) / 8, 0, 1.05),
	};
}

// The weather under her: the rain at the sea cut off (thunder is still thunder; rain that no
// longer reaches the sea is only cloud), and, pressing, the waves round the boat sinking, the
// wind's sea first and most, the swell less (the wind still blows: she stops the waves).
export function leaneConditions(c: SeaConditions, rain: number, sea: number): SeaConditions {
	const windWaveHeight = c.windWaveHeight * (1 - 0.8 * sea);
	const swellHeight = c.swellHeight * (1 - 0.6 * sea);
	const secondSwellHeight = c.secondSwellHeight * (1 - 0.6 * sea);
	return {
		...c,
		precipitation: c.precipitation * (1 - rain),
		weatherCode: c.weatherCode < 95 && c.weatherCode >= 51 && rain > 0.5 ? 3 : c.weatherCode,
		windWaveHeight,
		swellHeight,
		secondSwellHeight,
		waveHeight: Math.hypot(windWaveHeight, swellHeight, secondSwellHeight),
	};
}

const vertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute vec2 aCell;
attribute vec4 aSeed;
uniform float uTime;
uniform vec3 uBoat;
uniform vec2 uAhead;
uniform vec3 uUpwind;
// The canopy's height, how far its threads have streamed out (0..1), and how far the ropes are
// cast (0..1); how far the cut has run out from her hands when she lets go (0..1).
uniform float uHeight;
uniform float uSpread;
uniform float uCast;
uniform float uLetGo;
uniform float uHeat;
uniform float uSigh;
uniform float uFatigue;
uniform float uFade;
// 0..1 how far her threads have come down to the sea to press the waves, and how far out (m).
uniform float uSea;
uniform float uReach;
uniform float uShine;
uniform float uSpent;
uniform vec3 uTint;
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;
${ribbonShaderChunk}

vec3 aheadDir() { return vec3( uAhead.x, 0.0, uAhead.y ); }
vec3 acrossDir() { return vec3( - uAhead.y, 0.0, uAhead.x ); }
// Leane · Kite's seat: the second at the rail, just left of the viewer.
vec3 hand( float side ) { return uBoat + acrossDir() * ( - 0.75 + 0.3 * side ) + vec3( 0.0, - 1.2, 0.0 ) + aheadDir() * 0.5; }

vec3 bezier( vec3 a, vec3 b, vec3 c, vec3 d, float t ) {
	float s = 1.0 - t;
	return s * s * s * a + 3.0 * s * s * t * b + 3.0 * s * t * t * c + t * t * t * d;
}

// One of her two ropes, at s along it: up out of her hand, then out upwind and across the wind in
// one long bow.
vec3 rope( float side, float s ) {
	vec3 U = uUpwind;
	vec3 X = normalize( vec3( - U.z, 0.0, U.x ) );
	vec3 up = vec3( 0.0, 1.0, 0.0 );
	vec3 h = hand( side );
	return bezier( h, h + up * uHeight * 0.75 + U * 12.0, uBoat + U * 230.0 + X * side * 220.0 + up * ( uHeight + 10.0 ), uBoat + U * ( 120.0 + 40.0 * side ) + X * side * 780.0 + up * uHeight, s );
}

// Where this filament is at a along it, and how much of it is there. Each is one curve: along
// the rope to where it leaves it, then streaming downwind.
vec3 placeAt( float a, out float shown ) {
	float side = aCell.x;
	// Where along the rope this filament leaves it: the ropes thin as they go.
	float peel = 0.12 + 0.88 * pow( aSeed.x, 0.8 );
	vec3 U = uUpwind;
	vec3 X = normalize( vec3( - U.z, 0.0, U.x ) );
	shown = 1.0;
	const float ON_ROPE = 0.35;
	if ( a < ON_ROPE ) {
		float s = a / ON_ROPE * peel;
		vec3 c = rope( side, s );
		float dist = length( ( c - uBoat ).xz );
		// Laid up as a rope near her hands, splaying there as she tires.
		float r = ( 0.25 + 0.012 * dist ) * sqrt( aSeed.w ) * ( 1.0 + 1.5 * uFatigue * aSeed.z * smoothstep( 0.1, 0.0, s ) );
		float turn = aSeed.y * 6.28318 + s * 30.0;
		// Cast out along the rope from her hand.
		shown = smoothstep( uCast, uCast - 0.03, s );
		return c + ( X * cos( turn ) + vec3( 0.0, sin( turn ), 0.0 ) ) * r;
	}
	float b = ( a - ON_ROPE ) / ( 1.0 - ON_ROPE );
	vec3 start = rope( side, peel );
	vec3 along = normalize( rope( side, peel + 0.01 ) - rope( side, peel - 0.01 ) );
	// Streamed out as far as the canopy has got, each to its own length.
	float L = ( 300.0 + 1200.0 * aSeed.y ) * uSpread * ( 1.0 + 0.25 * uSigh );
	vec3 q1 = start + along * 90.0 - U * 0.15 * L;
	vec3 q2 = start - U * L + X * ( aSeed.z - 0.5 ) * 260.0;
	vec3 p = ( 1.0 - b ) * ( 1.0 - b ) * start + 2.0 * b * ( 1.0 - b ) * q1 + b * b * q2;
	// Level, each a little above or below the next, wandering slowly across the wind; the heat in
	// it shimmers; sighing, it billows up; cooling towards its end, it sinks a little.
	// (Like a kite's tail: each sways across the wind in long S-curves of its own, never a straight
	// line; seen from beneath, straight threads all ran together into one point.)
	p += X * ( sin( b * 4.0 + aSeed.w * 20.0 + uTime * 0.07 ) * 55.0 + sin( b * 11.0 + aSeed.z * 30.0 + uTime * 0.15 ) * 14.0 ) * b * ( 1.0 + 0.6 * uSigh );
	p -= U * sin( b * 6.0 + aSeed.y * 17.0 + uTime * 0.05 ) * 30.0 * b;
	p.y = mix( start.y, uHeight + ( aSeed.z - 0.5 ) * 10.0, smoothstep( 0.0, 0.2, b ) ) - ( 6.0 + 10.0 * uFatigue ) * b * b + 8.0 * uSigh * sin( 3.14159 * b );
	p.y += sin( uTime * ( 0.9 + 1.4 * uHeat ) + b * 14.0 + aSeed.x * 30.0 ) * ( 0.4 + 2.2 * uHeat ) * b + sin( b * 7.0 + aSeed.w * 13.0 + uTime * 0.1 ) * 5.0 * b;
	// Pressing the waves: some come down off the canopy and lie out over the sea round the boat,
	// each its own way, in a long curve down from where it left the rope to the edge of the water
	// she is stilling, a little above the sea.
	if ( aSeed.z > 0.7 && uSea > 0.0 ) {
		float turned = ( aSeed.y - 0.5 ) * 2.8 + 0.25 * sin( b * 3.0 + aSeed.w * 9.0 + uTime * 0.05 );
		vec3 way = - U * cos( turned ) + X * sin( turned );
		float out_ = uReach * ( 0.55 + 0.45 * aSeed.x ) * b;
		vec3 onSea = uBoat + way * out_ + X * sin( b * 5.0 + aSeed.w * 20.0 ) * 0.06 * out_;
		onSea.y = mix( start.y, 0.8 + 0.6 * sin( b * 17.0 + aSeed.x * 40.0 + uTime * 0.4 ), smoothstep( 0.0, 0.35, b ) );
		p = mix( p, onSea, smoothstep( 0.0, 1.0, uSea ) );
	}
	// Spent, her threads fray and hang.
	p.y -= uSpent * ( 8.0 + 20.0 * aSeed.w ) * b * b * step( 0.5, fract( aSeed.x * 7.3 ) );
	// (Its far end fades out, as warmth does into the air.)
	shown = ( 1.0 - smoothstep( 0.7, 1.0, b ) ) * step( peel, uCast );
	return p;
}

void main() {
	float shown;
	float ignored;
	vec3 here = placeAt( aT, shown );
	vec3 next = placeAt( min( aT + 0.005, 1.0 ), ignored ) + ( aT >= 0.995 ? here - placeAt( aT - 0.005, ignored ) : vec3( 0.0 ) );
	// Let go: the cut runs out from her hands along everything.
	shown *= smoothstep( uLetGo, uLetGo + 0.04, aT );
	float far = length( here - cameraPosition );
	// (Not right overhead, where any curve seen from beneath is a straight stroke across the sky;
	// fading into the far air.)
	shown *= smoothstep( 40.0, 160.0, far ) * exp( - far / 3500.0 );
	// Shining like the moon (the owner's): silver, brighter the more she pours into it, guttering
	// unevenly along each thread as she nears burning out (slowly: never a flicker).
	float gutter = 1.0 - uSpent * smoothstep( 0.3, 0.8, sin( aT * 9.0 + aSeed.y * 20.0 + uTime * 0.3 ) * 0.5 + 0.5 );
	vAlpha = shown * uFade * uShine * gutter;
	// Moonlight, a little warmer as she runs hot. (Not the twelve's tamed colour: hers is the
	// light of the whole morning.)
	vTint = mix( vec3( 0.84, 0.9, 1.0 ), vec3( 1.0, 0.9, 0.78 ), 0.3 * uHeat );
	vEdge = aSide;
	mat4 vp = projectionMatrix * viewMatrix;
	gl_Position = ribbonPosition( vp * vec4( here, 1.0 ), vp * vec4( next, 1.0 ), aSide, 1.6 );
}
`;

// Moonlight: by night a silver light with a soft glow about it; by day a silver thread in a sheath
// of her air colour, deepened, so that it shows against the pale sky (never white on white).
const fragment = /* glsl */ `
uniform float uGain;
uniform float uDay;
uniform float uOpacity;
uniform vec3 uSheath;
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;
void main() {
	float across = abs( vEdge );
	float core = 1.0 - smoothstep( 0.25, 0.55, across );
	float glow = exp( - across * across * 4.0 );
	vec3 night = vTint * uGain * ( 0.5 + 1.5 * core );
	vec3 day = mix( pow( uSheath, vec3( 2.2 ) ) * 0.5, vTint * uGain * 1.6, core );
	gl_FragColor = vec4( mix( night, day, uDay ), mix( glow, max( glow * 0.8, core ), uDay ) * vAlpha * uOpacity * mix( 1.0, 3.0, uDay ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

export interface RainCutFrame {
	time: number;
	delta: number;
	// Seconds since she began.
	seconds: number;
	// How hard it is raining above her canopy, mm in 15 minutes (as SeaConditions.precipitation).
	aloft: number;
	boat: THREE.Vector3;
	ahead: THREE.Vector2;
	wind: THREE.Vector3;
	day: number;
	gain: number;
	tint: THREE.Color;
}

// What the rain is to do below her canopy (rain.ts): the height under which it is gone, how deep
// the band is in which it thins away, and how far out from the boat it is cut (0: not at all).
export interface RainCutLayer {
	height: number;
	depth: number;
	reach: number;
}

export function createRainCut(scene: THREE.Scene, layer: number) {
	const uniforms = {
		uTime: { value: 0 },
		uBoat: { value: new THREE.Vector3() },
		uAhead: { value: new THREE.Vector2(0, -1) },
		uUpwind: { value: new THREE.Vector3(0, 0, 1) },
		uHeight: { value: 45 },
		uSpread: { value: 0 },
		uCast: { value: 0 },
		uLetGo: { value: 0 },
		uHeat: { value: 0.2 },
		uSigh: { value: 0 },
		uFatigue: { value: 0 },
		uFade: { value: 0 },
		uSea: { value: 0 },
		uReach: { value: 0 },
		uShine: { value: 1 },
		uSpent: { value: 0 },
		uSheath: { value: new THREE.Color() },
		uTint: { value: new THREE.Color() },
		uGain: { value: 1 },
		uDay: { value: 0 },
		uOpacity: { value: 0.06 },
		uResolution: { value: new THREE.Vector2(1, 1) },
		uPixelRatio: pixelRatio,
	};
	// (Half the filaments from each hand: the first number is the side, -1 or 1.)
	const mesh = new THREE.Mesh(
		lines(FILAMENTS, 220, (i) => [i % 2 ? 1 : -1, 0]),
		new THREE.ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
	);
	mesh.frustumCulled = false;
	mesh.renderOrder = WEAVE_RENDER_ORDER;
	mesh.layers.set(layer);
	mesh.visible = false;
	scene.add(mesh);

	let heat = -1;
	let sighing = 0;
	let sinceSigh = 0;
	const SIGH = 3;
	const layerNow: RainCutLayer = { height: 0, depth: 0, reach: 0 };

	const update = (frame: RainCutFrame | undefined): RainCutLayer => {
		if (!frame) {
			mesh.visible = false;
			heat = -1;
			layerNow.reach = 0;
			return layerNow;
		}
		const dt = Math.min(frame.delta, 0.1);
		const act = leaneAct(frame.seconds);
		// Her heat follows the strain of the act; and when she can hold no more she sighs, a breath
		// let out, and for a moment it eases (never sooner than twelve seconds after the last).
		if (heat < 0) heat = act.strain;
		sinceSigh += dt;
		if (sighing <= 0 && heat > 0.6 && sinceSigh > 12 && act.letGo <= 0) {
			sighing = SIGH;
			sinceSigh = 0;
		}
		const sigh = sighing > 0 ? Math.sin(Math.PI * (1 - sighing / SIGH)) : 0;
		sighing = Math.max(0, sighing - dt);
		heat += (act.strain - 0.15 * sigh - heat) * Math.min(1, dt / 1.5);
		const fade = 1 - smoothstep(act.letGo, 0.9, 1.05);
		mesh.visible = fade > 0.001;
		const u = uniforms;
		u.uTime.value = frame.time;
		u.uBoat.value.copy(frame.boat);
		u.uAhead.value.copy(frame.ahead);
		u.uUpwind.value.copy(frame.wind).setY(0).negate();
		if (u.uUpwind.value.lengthSq() > 1e-6) u.uUpwind.value.normalize();
		else u.uUpwind.value.set(-frame.ahead.x, 0, -frame.ahead.y);
		// Tiring as it goes on, the canopy sags lower.
		const fatigue = smoothstep(frame.seconds, 10, LEANE_HOLDS);
		u.uHeight.value = 48 - 14 * fatigue;
		u.uSpread.value = smoothstep(frame.seconds, 4, 32);
		u.uCast.value = smoothstep(frame.seconds, 0, 4) * 1.05;
		u.uLetGo.value = act.letGo;
		u.uHeat.value = heat;
		u.uSigh.value = sigh;
		u.uFatigue.value = fatigue;
		u.uFade.value = fade;
		u.uSea.value = smoothstep(frame.seconds, 33, 50);
		u.uReach.value = act.reach;
		// Brighter the more she pours into it; guttering as she is spent.
		u.uShine.value = (0.6 + 1.1 * heat) * (1 - 0.45 * act.spent);
		u.uSpent.value = act.spent;
		u.uTint.value.copy(frame.tint);
		u.uSheath.value.copy(frame.tint);
		u.uGain.value = frame.gain;
		u.uDay.value = frame.day;
		u.uResolution.value.set(window.innerWidth, window.innerHeight).multiplyScalar(pixelRatio.value);
		(mesh.material as THREE.ShaderMaterial).blending = frame.day > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending;
		// Under the canopy the rain is gone some way above the sea: lower as she tires, for a moment
		// lower still while she sighs and the layer cools; and once she lets go it comes back down.
		layerNow.height = THREE.MathUtils.lerp(-80, 40 - 12 * fatigue - 14 * sigh, smoothstep(act.rain, 0, 0.6));
		layerNow.depth = 12 + 8 * fatigue;
		layerNow.reach = 450 * Math.min(1, act.rain * 3);
		return layerNow;
	};

	const dispose = () => {
		scene.remove(mesh);
		mesh.geometry.dispose();
		(mesh.material as THREE.Material).dispose();
	};

	return { update, dispose };
}
