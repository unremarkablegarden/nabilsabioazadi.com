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
// Set in storm.json ("rainCut": { "from": ISO time }); ?raincut begins it as the page opens,
// ?raincut=300 shows it five minutes in, ?raincut=off without it.
import * as THREE from "three";
import { lines } from "./embroidery";
import { pixelRatio, ribbonShaderChunk, tameShaderChunk, WEAVE_RENDER_ORDER } from "./weave";
import stormSwitch from "~~/storm.json";

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
// 0..1 how much of the rain at the sea she has cut off, s seconds in: her ropes are out in
// twenty seconds, and the canopy streams out over the boat in the next three minutes.
export const rainCutCover = (seconds: number) => smoothstep(seconds, 20, 200);

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
uniform vec3 uTint;
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;
${ribbonShaderChunk}
${tameShaderChunk}

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
	vAlpha = shown * uFade * ( 0.6 + 0.6 * uHeat );
	// Air's colour, warming towards ember as she heats, and tamed (13 to 26%), as the twelve's are.
	vTint = tame( mix( uTint, vec3( 1.0, 0.72, 0.5 ), 0.55 * uHeat ), 0.13 + 0.13 * uHeat );
	vEdge = aSide;
	mat4 vp = projectionMatrix * viewMatrix;
	gl_Position = ribbonPosition( vp * vec4( here, 1.0 ), vp * vec4( next, 1.0 ), aSide, 0.8 );
}
`;

// As the twelve's work is drawn: light by night, laid colour by day, deeper (never white on white).
const fragment = /* glsl */ `
uniform float uGain;
uniform float uDay;
uniform float uOpacity;
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;
void main() {
	float across = abs( vEdge );
	float body = exp( - across * across * 3.0 ) * ( 1.0 - smoothstep( 0.8, 1.0, across ) );
	vec3 colour = mix( vTint, pow( vTint, vec3( 2.6 ) ) * 0.4, uDay );
	gl_FragColor = vec4( colour * uGain, body * vAlpha * uOpacity * mix( 1.0, 3.5, uDay ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

export interface RainCutFrame {
	time: number;
	delta: number;
	// Seconds since she began, and 0..1 whether there is rain above to cut (she lets go without).
	seconds: number;
	held: number;
	// How hard it is raining above her canopy, mm in 15 minutes (as SeaConditions.precipitation).
	aloft: number;
	boat: THREE.Vector3;
	ahead: THREE.Vector2;
	wind: THREE.Vector3;
	day: number;
	gain: number;
	tint: THREE.Color;
	bg: THREE.Color;
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
		uTint: { value: new THREE.Color() },
		uGain: { value: 1 },
		uDay: { value: 0 },
		uOpacity: { value: 0.06 },
		uBg: { value: new THREE.Color() },
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

	let heat = 0.2;
	let sighing = 0;
	const SIGH = 7;
	// Leane · Kite: eager, not the most stamina (AES_SEDAI in channellers.ts).
	const EAGER = 0.8;
	const STAMINA = 0.6;
	let letGo = 0;
	let started = false;
	const layerNow: RainCutLayer = { height: 0, depth: 0, reach: 0 };

	const update = (frame: RainCutFrame | undefined): RainCutLayer => {
		if (!frame) {
			mesh.visible = false;
			started = false;
			layerNow.reach = 0;
			return layerNow;
		}
		const dt = Math.min(frame.delta, 0.1);
		const cover = rainCutCover(frame.seconds);
		// Tired over the hours.
		const fatigue = (1 - Math.exp(-frame.seconds / 3600 / 2.5)) * (1.3 - STAMINA);
		// Her heat: the latent heat of all the rain she keeps from the sea, through her temperament,
		// the more for being tired; given off slowly, and in a sigh when she can hold no more.
		const strain = 0.05 * Math.min(1, frame.aloft / 14) * cover * (0.7 + 0.6 * EAGER) * (1 + 1.5 * fatigue);
		if (sighing <= 0 && heat > 0.78) sighing = SIGH;
		const sigh = sighing > 0 ? Math.sin(Math.PI * (1 - sighing / SIGH)) : 0;
		sighing = Math.max(0, sighing - dt);
		heat = THREE.MathUtils.clamp(heat + dt * (strain - 0.025 * (heat - 0.15) - 0.12 * sigh), 0, 1);
		// (Arriving after she has let go, there is nothing of it to see go.)
		if (!started) letGo = frame.held > 0.5 ? 0 : 1.05;
		started = true;
		// She lets go once there is no rain above to cut, the cut running out from her hands.
		letGo = frame.held > 0.5 ? Math.max(0, letGo - dt / 20) : Math.min(1.05, letGo + dt / 25);
		const fade = 1 - smoothstep(letGo, 0.9, 1.05);
		mesh.visible = fade > 0.001;
		const u = uniforms;
		u.uTime.value = frame.time;
		u.uBoat.value.copy(frame.boat);
		u.uAhead.value.copy(frame.ahead);
		u.uUpwind.value.copy(frame.wind).setY(0).negate();
		if (u.uUpwind.value.lengthSq() > 1e-6) u.uUpwind.value.normalize();
		else u.uUpwind.value.set(-frame.ahead.x, 0, -frame.ahead.y);
		// Tired, the canopy sags lower.
		u.uHeight.value = 48 - 12 * fatigue;
		u.uSpread.value = cover;
		u.uCast.value = smoothstep(frame.seconds, 0, 20) * 1.05;
		u.uLetGo.value = letGo;
		u.uHeat.value = heat;
		u.uSigh.value = sigh;
		u.uFatigue.value = fatigue;
		u.uFade.value = fade;
		u.uTint.value.copy(frame.tint);
		u.uGain.value = frame.gain;
		u.uDay.value = frame.day;
		u.uBg.value.copy(frame.bg);
		u.uResolution.value.set(window.innerWidth, window.innerHeight).multiplyScalar(pixelRatio.value);
		(mesh.material as THREE.ShaderMaterial).blending = frame.day > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending;
		// Under the canopy the rain is gone some way above the sea: lower as she tires, and for a
		// moment lower still while she sighs and the layer cools.
		layerNow.height = 40 - 12 * fatigue - 14 * sigh;
		layerNow.depth = 12 + 8 * fatigue;
		layerNow.reach = 450 * cover * (1 - smoothstep(letGo, 0, 0.6));
		return layerNow;
	};

	const dispose = () => {
		scene.remove(mesh);
		mesh.geometry.dispose();
		(mesh.material as THREE.Material).dispose();
	};

	return { update, dispose };
}
