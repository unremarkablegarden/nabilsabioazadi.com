// The contest of strength (the owner, 21 October: "give them all 80% more strength and then make
// them fight in a scenario to declare strength"; the strongest six, in a knockout). Once they have
// healed the ocean, the strongest six unlink and fight to declare who is the strongest of the boat:
// seeded by their true strength (each 1.8 times what it was, SIX_STRONGER), the two strongest wait
// while the four mighty meet; the winners meet the two; the two left meet in the final.
//
//   a bout    each casts her rope out from her hands, sweeping wide on her own side and coming in
//             to meet the other's head-on, high over the sea ahead; there they press. Where they
//             meet is driven towards the weaker, by how much stronger the other is, until it is
//             at her side: then her rope is driven back to her hands, and she is beaten. The
//             filaments of both splay and curl out where they press, the more the harder.
//   strength  her true strength (as the weaves' MIGHT: the four 64 times an ordinary sister, the
//             strongest 1.8 times all twelve, Manulani 1.12 times the strongest), held at its
//             fullest by her steadiness and worn down as she spends herself, the faster the less
//             stamina she has (TEMPERS in psyche.ts); she hauls on her own slow breath. So the
//             close bouts can turn, and are not settled by their seeds alone.
//   declared  the one left standing raises her rope from her hands into a great ring about the
//             boat, high over the sea, turning slowly: the strongest of the boat, declared. Held
//             three minutes, then let go.
// It is the same for everyone: every bout follows from when it began, nothing from chance.
// Strength is shown in mass, never in brightness: the stronger carry more filaments.
import * as THREE from "three";
import { lines } from "./embroidery";
import { NAMES, SIX_STRONGER, TEMPERS } from "./psyche";
import { seatOf } from "./treason";
import { pixelRatio, ribbonShaderChunk, WEAVE_RENDER_ORDER } from "./weave";

// The six, in seed order, by their place among the minds: Manulani, the strongest, Keel, Kite,
// Fathom, Listener; and their true strength, in an ordinary sister's (channellers.ts: the four 64
// times theirs, the strongest 1.8 times all twelve, Manulani 1.12 times the strongest).
const SIX = [13, 12, 0, 1, 2, 5];
const TWELVE = 64 * (0.95 + 0.9 + 0.82 + 0.64) + 0.78 + 0.7 + 0.58 + 0.52 + 0.47 + 0.42 + 0.38 + 0.34;
const TRUE = [1.12 * 1.8 * TWELVE, 1.8 * TWELVE, 64 * 0.95, 64 * 0.9, 64 * 0.82, 64 * 0.64].map((one) => one * SIX_STRONGER);
// Their ropes' measures, as the weaves draw them (MIGHT), with the 80% by its cube root.
const MEASURES = [4.9 * Math.cbrt(1.12), 4.9, 2.5, 2.5, 2.5, 2.5].map((one) => one * Math.cbrt(SIX_STRONGER));
// The bouts, by seed: the four mighty first, then the two strongest meet the winners.
type Slot = number | { winnerOf: number };
const BOUTS: [Slot, Slot][] = [
	[2, 5],
	[3, 4],
	[0, { winnerOf: 1 }],
	[1, { winnerOf: 0 }],
	[{ winnerOf: 2 }, { winnerOf: 3 }],
];
// Seconds: casting out to meet, a beaten rope driven back, the winner letting go, the rest after.
const CAST = 6;
const DRIVEN = 3;
const RELEASE = 4;
const REST = 15;
const DECLARED = 180;
const LET_GO = 10;
const STEP = 0.05;
// How long after the healing they begin (s).
export const CONTEST_AFTER = 300;

interface Bout {
	a: number;
	b: number;
	// Where they meet, -1 (at a's side) to 1 (at b's), and how long they have pressed.
	x: number;
	pressed: number;
	winner?: number;
	// When it ended (contest seconds).
	ended?: number;
}

// The contest at a moment, played from its beginning.
function play() {
	const spent = new Array<number>(6).fill(0);
	const bouts: Bout[] = [];
	let at = 0;
	let begun = 0;
	let declared: number | undefined;
	let declaredAt = 0;
	const winnerOf = (slot: Slot) => (typeof slot === "number" ? slot : bouts[slot.winnerOf]!.winner!);
	const force = (seed: number, t: number) => {
		const temper = TEMPERS[SIX[seed]!]!;
		const breath = 1 + 0.08 * Math.sin((2 * Math.PI * t) / (8 + 4 * temper.steady) + seed * 1.7);
		return TRUE[seed]! * (0.75 + 0.25 * temper.steady) * (0.4 + 0.6 * (1 - spent[seed]!)) * breath;
	};
	const step = () => {
		at += STEP;
		const current = bouts[bouts.length - 1];
		if (declared !== undefined) return;
		if (!current || (current.ended !== undefined && at > current.ended + DRIVEN + RELEASE + REST)) {
			if (bouts.length === BOUTS.length) {
				if (current?.winner !== undefined && declared === undefined) {
					declared = current.winner;
					declaredAt = at;
				}
				return;
			}
			const [a, b] = BOUTS[bouts.length]!;
			bouts.push({ a: winnerOf(a), b: winnerOf(b), x: 0, pressed: 0 });
			begun = at;
			return;
		}
		// Resting between bouts, they come back a little.
		for (let seed = 0; seed < 6; seed++) if (current.ended !== undefined || (seed !== current.a && seed !== current.b)) spent[seed] = Math.max(0, spent[seed]! - STEP * 0.002);
		if (current.ended !== undefined || at - begun < CAST) return;
		const fa = force(current.a, at);
		const fb = force(current.b, at);
		current.x += THREE.MathUtils.clamp((0.5 * (fa - fb)) / (fa + fb), -0.09, 0.09) * STEP;
		current.pressed += STEP;
		for (const seed of [current.a, current.b]) spent[seed] = Math.min(1, spent[seed]! + STEP * (1.4 - TEMPERS[SIX[seed]!]!.stamina) * 0.003);
		if (Math.abs(current.x) >= 1) {
			current.winner = current.x > 0 ? current.a : current.b;
			current.ended = at;
		}
	};
	return {
		advance(to: number) {
			while (at + STEP <= to) step();
		},
		get at() {
			return at;
		},
		bouts,
		begun: () => begun,
		declared: () => (declared === undefined ? undefined : { seed: declared, at: declaredAt }),
		spent,
	};
}

// The bouts so far, and who is declared, in words.
function tell(played: ReturnType<typeof play>) {
	const name = (seed: number) => NAMES[SIX[seed]!]!;
	const told = played.bouts.map((bout, i) => {
		const label = ["first of the mighty", "second of the mighty", "semi-final", "semi-final", "final"][i];
		if (bout.winner === undefined) return `${label}: ${name(bout.a)} against ${name(bout.b)}, pressing (${bout.x > 0 ? name(bout.a) : name(bout.b)} ahead, ${Math.abs(bout.x * 100).toFixed(0)}%)`;
		return `${label}: ${name(bout.winner)} beat ${name(bout.winner === bout.a ? bout.b : bout.a)} after ${bout.pressed.toFixed(0)} s (ended ${bout.ended!.toFixed(0)} s in)`;
	});
	const declared = played.declared();
	if (declared) told.push(`declared the strongest of the boat: ${name(declared.seed)} (${declared.at.toFixed(0)} s in)`);
	return told;
}

// The contest as it stands at a moment (s since it began), in words.
export function contestAt(since: number) {
	const played = play();
	played.advance(since);
	return tell(played);
}

// How long the whole contest lasts, declaration and all (s): played through once.
export function contestLength() {
	const whole = play();
	whole.advance(3600);
	const declared = whole.declared();
	return declared ? declared.at + DECLARED + LET_GO : 3600;
}

const vertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute vec4 aSeed;
uniform float uTime;
uniform vec3 uBoat;
uniform vec2 uAhead;
uniform vec3 uSeat;
uniform vec3 uMeet;
// Which side her rope sweeps out on (-1 left, 1 right), and its girth (m).
uniform float uSwing;
uniform float uGirth;
uniform float uCast;
uniform float uBack;
uniform float uPress;
uniform float uStrain;
uniform float uCrown;
uniform float uFade;
uniform float uDay;
varying float vAlpha;
varying float vEdge;
${ribbonShaderChunk}

vec3 aheadDir() { return vec3( uAhead.x, 0.0, uAhead.y ); }
vec3 acrossDir() { return vec3( - uAhead.y, 0.0, uAhead.x ); }
vec3 bezier( vec3 a, vec3 b, vec3 c, vec3 d, float t ) {
	float s = 1.0 - t;
	return s * s * s * a + 3.0 * s * s * t * b + 3.0 * s * t * t * c + t * t * t * d;
}

// Out from her hands, sweeping wide on her side, and in to where they meet.
vec3 boutAt( float t ) {
	vec3 side = acrossDir() * uSwing;
	return bezier( uSeat, uSeat + vec3( 0.0, 45.0, 0.0 ) + side * 130.0 + aheadDir() * 90.0, uMeet + side * 150.0 + vec3( 0.0, 45.0, 0.0 ), uMeet, t );
}
// Declared: up from her hands into a great ring about the boat, turning slowly.
vec3 crownAt( float t ) {
	float a0 = uTime * 0.015;
	vec3 start = uBoat + vec3( 0.0, 230.0, 0.0 ) + ( aheadDir() * cos( a0 ) + acrossDir() * sin( a0 ) ) * 520.0;
	if ( t < 0.18 ) return bezier( uSeat, uSeat + vec3( 0.0, 120.0, 0.0 ) + aheadDir() * 40.0, start - ( acrossDir() * cos( a0 ) - aheadDir() * sin( a0 ) ) * 200.0, start, t / 0.18 );
	float a = a0 + ( t - 0.18 ) / 0.82 * 6.28318;
	float wave = 14.0 * sin( a * 3.0 + uTime * 0.1 );
	return uBoat + vec3( 0.0, 230.0 + wave, 0.0 ) + ( aheadDir() * cos( a ) + acrossDir() * sin( a ) ) * 520.0;
}
vec3 placeAt( float t ) { return mix( boutAt( t ), crownAt( t ), uCrown ); }

void main() {
	vec3 here = placeAt( aT );
	vec3 next = placeAt( min( aT + 0.006, 1.0 ) ) + ( aT >= 0.994 ? here - placeAt( aT - 0.006 ) : vec3( 0.0 ) );
	vec3 along = normalize( next - here + vec3( 1e-5 ) );
	vec3 n1 = normalize( cross( along, vec3( 0.0, 1.0, 0.0 ) ) + vec3( 1e-4 ) );
	vec3 n2 = normalize( cross( n1, along ) );
	// A hawser's girth, twisted barely; like a stroke of a brush, swelling and thinning.
	float body = sin( 3.14159 * min( aT * 1.15, 1.0 ) ) + 0.15;
	float spread = ( 0.4 + uGirth * body ) * sqrt( aSeed.z ) * ( 0.75 + 0.35 * sin( aT * 9.0 + aSeed.x * 2.0 + uTime * 0.2 ) );
	float turn = aSeed.y * 6.28318 + aT * 3.0 + uTime * 0.15 * ( aSeed.x - 0.5 );
	vec3 off = ( n1 * cos( turn ) + n2 * sin( turn ) ) * spread;
	// Losing, her rope trembles taut, slowly; never a thrash.
	off += n1 * sin( aT * 8.0 - uTime * 2.0 + aSeed.x * 3.0 ) * 5.0 * uStrain * sin( 3.14159 * aT );
	// Where they press: the filaments of both splay and curl out from the meeting, the more the harder.
	float near = smoothstep( 0.78, 1.0, aT ) * uPress * ( 1.0 - uCrown );
	float curl = aSeed.y * 6.28318 + uTime * ( 0.3 + 0.4 * aSeed.w ) + aT * 6.0;
	off += ( n1 * cos( curl ) + n2 * sin( curl ) * 1.3 ) * near * ( 8.0 + 34.0 * aSeed.w ) - along * near * 12.0 * aSeed.z;
	here += off;
	next += off;
	// Cast out from her hands; driven back to them when beaten.
	float shown = smoothstep( uCast, uCast - 0.03, aT ) * smoothstep( 1.0 - uBack, 0.97 - uBack, aT );
	float far = length( here - cameraPosition );
	shown *= smoothstep( 12.0, 70.0, far ) * exp( - far / 9000.0 );
	shown *= 0.55 + 0.45 * smoothstep( - 0.6, 0.6, sin( aT * 5.0 + aSeed.y * 2.0 + 1.0 ) + 0.5 * sin( aT * 13.0 + 2.0 ) );
	vAlpha = shown * uFade * ( 1.0 + 0.6 * near );
	vEdge = aSide;
	mat4 vp = projectionMatrix * viewMatrix;
	gl_Position = ribbonPosition( vp * vec4( here, 1.0 ), vp * vec4( next, 1.0 ), aSide, mix( 1.0, 1.3, uDay ) );
}
`;

const fragment = /* glsl */ `
uniform float uGain;
uniform float uDay;
uniform float uWhite;
uniform vec3 uTint;
uniform float uWhiteRope;
uniform float uOpacity;
varying float vAlpha;
varying float vEdge;
void main() {
	float across = abs( vEdge );
	// By night her colour as light; by day her threads (the strongest's the day's white, the others
	// their own colour).
	float body = 1.0 - smoothstep( 0.7, 1.0, across );
	gl_FragColor = vec4( mix( uTint * uGain, uWhiteRope > 0.5 ? vec3( uWhite ) : uTint * ( 1.0 + 0.15 * uWhite ), uDay ), body * vAlpha * uOpacity * mix( 1.0, 3.0, uDay ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

export interface ContestFrame {
	// Seconds since the contest began.
	since: number;
	time: number;
	boat: THREE.Vector3;
	ahead: THREE.Vector2;
	day: number;
	gain: number;
	white: number;
	// The three's colours (Siuan's, Leane's, Moiraine's).
	tints: THREE.Color[];
}

// Whose each of the four mighty is (Keel and Fathom Siuan's, Kite Leane's, Listener Moiraine's).
const THIRD = [-1, -1, 0, 1, 0, 2];
const MANULANI_TINT = new THREE.Color(1, 0.88, 0.66);
const WHITE = new THREE.Color(1, 1, 1);

export function createContest(scene: THREE.Scene, layer: number) {
	const shared = {
		uTime: { value: 0 },
		uBoat: { value: new THREE.Vector3() },
		uAhead: { value: new THREE.Vector2(0, -1) },
		uDay: { value: 0 },
		uGain: { value: 1 },
		uWhite: { value: 1 },
		uResolution: { value: new THREE.Vector2(1, 1) },
		uPixelRatio: pixelRatio,
	};
	// Each of the six her own rope, as many filaments as her strength carries.
	const ropes = SIX.map((_, seed) => {
		const geometry = lines(Math.round(220 * MEASURES[seed]!), 180, (i) => [i, 0]);
		const own = {
			uSeat: { value: new THREE.Vector3() },
			uMeet: { value: new THREE.Vector3() },
			uSwing: { value: 1 },
			uGirth: { value: 3 * Math.sqrt(MEASURES[seed]!) },
			uCast: { value: 0 },
			uBack: { value: 0 },
			uPress: { value: 0 },
			uStrain: { value: 0 },
			uCrown: { value: 0 },
			uFade: { value: 0 },
			uTint: { value: new THREE.Color() },
			uWhiteRope: { value: seed === 1 ? 1 : 0 },
			uOpacity: { value: 0.035 },
		};
		const mesh = new THREE.Mesh(geometry, new THREE.ShaderMaterial({ uniforms: { ...shared, ...own }, vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
		mesh.frustumCulled = false;
		mesh.renderOrder = WEAVE_RENDER_ORDER;
		mesh.layers.set(layer);
		mesh.visible = false;
		scene.add(mesh);
		return { geometry, own, mesh };
	});

	let played = play();
	const ahead = new THREE.Vector3();
	const across = new THREE.Vector3();
	const update = (frame: ContestFrame | undefined) => {
		const hide = () => {
			for (const rope of ropes) rope.mesh.visible = false;
		};
		if (!frame || frame.since < 0) return hide();
		if (frame.since < played.at) played = play();
		played.advance(frame.since);
		const since = frame.since;
		shared.uTime.value = frame.time;
		shared.uBoat.value.copy(frame.boat);
		shared.uAhead.value.copy(frame.ahead);
		shared.uDay.value = frame.day;
		shared.uGain.value = frame.gain;
		shared.uWhite.value = frame.white;
		shared.uResolution.value.set(window.innerWidth, window.innerHeight).multiplyScalar(pixelRatio.value);
		ahead.set(frame.ahead.x, 0, frame.ahead.y);
		across.set(-frame.ahead.y, 0, frame.ahead.x);
		for (const [seed, rope] of ropes.entries()) {
			rope.own.uFade.value = 0;
			rope.own.uSeat.value.copy(seatOf(SIX[seed]!, frame.boat, ahead, across));
			rope.own.uTint.value.copy(seed === 0 ? MANULANI_TINT : seed === 1 ? WHITE : frame.tints[THIRD[seed]!]!);
		}
		const declared = played.declared();
		const bout = played.bouts[played.bouts.length - 1];
		if (declared) {
			// The strongest of the boat, declared: the ring raised, held, and let go.
			const rope = ropes[declared.seed]!;
			const into = since - declared.at;
			if (into > DECLARED + LET_GO) return hide();
			rope.own.uCrown.value = 1;
			rope.own.uCast.value = THREE.MathUtils.smoothstep(into, 0, 12) * 1.05;
			rope.own.uBack.value = THREE.MathUtils.smoothstep(into, DECLARED, DECLARED + LET_GO) * 1.05;
			rope.own.uPress.value = rope.own.uStrain.value = 0;
			rope.own.uFade.value = 1;
		} else if (bout) {
			// Where they meet, high over the sea ahead, driven towards the weaker.
			const meet = frame.boat.clone().addScaledVector(ahead, 380).addScaledVector(across, bout.x * 230).add(new THREE.Vector3(0, 70, 0));
			const cast = THREE.MathUtils.smoothstep(since - played.begun(), 0, CAST) * 1.05;
			for (const [seed, swing] of [
				[bout.a, -1],
				[bout.b, 1],
			] as const) {
				const rope = ropes[seed]!;
				const beaten = bout.winner !== undefined && bout.winner !== seed;
				const after = bout.ended === undefined ? 0 : since - bout.ended;
				rope.own.uCrown.value = 0;
				rope.own.uSwing.value = swing;
				rope.own.uMeet.value.copy(meet);
				rope.own.uCast.value = cast;
				// Beaten, driven back to her hands; the winner lets go after.
				rope.own.uBack.value = beaten ? THREE.MathUtils.smoothstep(after, 0, DRIVEN) * 1.05 : THREE.MathUtils.smoothstep(after, DRIVEN, DRIVEN + RELEASE) * 1.05;
				// (Pressing hardest as they meet and while it is close; the one being driven back strains.)
				const losing = swing * bout.x;
				rope.own.uPress.value = bout.ended === undefined ? THREE.MathUtils.smoothstep(since - played.begun(), CAST * 0.8, CAST + 2) * (0.6 + 0.4 * (1 - Math.abs(bout.x))) : 0;
				rope.own.uStrain.value = bout.ended === undefined ? THREE.MathUtils.smoothstep(losing, 0.1, 0.8) : 0;
				rope.own.uFade.value = 1;
			}
		}
		const blending = frame.day > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending;
		for (const rope of ropes) {
			rope.mesh.visible = rope.own.uFade.value > 0.001;
			(rope.mesh.material as THREE.ShaderMaterial).blending = blending;
		}
	};

	// For the console: the bouts so far, and who is declared.
	const describe = () => tell(played);

	const dispose = () => {
		for (const rope of ropes) {
			scene.remove(rope.mesh);
			(rope.mesh.material as THREE.Material).dispose();
			rope.geometry.dispose();
		}
	};

	return { update, describe, dispose };
}
