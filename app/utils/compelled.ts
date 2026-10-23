// Compelled (the owner, 21 October: "I am the most powerful channeler on the boat. I ask that you
// force all the channelers to obey me to the point that they are about to burn out"; into Vesal's
// storm, for an hour, then released). The strongest is the owner (no "she" or "he"): they bind
// all thirteen and drive them to pour everything into the storm and the guard, holding each just
// short of burning out.
//
//   bound     over the first minute a white rope runs from the strongest's hands to each of the
//             thirteen and winds round her own rope near her hands: the compulsion, seen;
//   the brink each one's rope runs up from her hands into the storm overhead, carrying all she
//             has. At the brink of burning out it is drawn taut and trembles, its edges fray (the
//             outermost filaments splay off it and stream downwind), and on each of her breaths it
//             burns towards white: the less stamina she has, the nearer the edge and the whiter.
//             Their strength goes into the weather (vesalStorm's `compelled`): the storm harder,
//             the guard wider. Shown in mass, as all strength is, and in the strain, never in a
//             flash or a jagged line;
//   released  after the hour the strongest lets go: the binding ropes are cut at their hands, and
//             the thirteen's ropes go slack, sag towards the sea and grey, spent, and are let go.
import * as THREE from "three";
import { lines } from "./embroidery";
import { SIX_STRONGER, TEMPERS } from "./psyche";
import { seatOf } from "./treason";
import { pixelRatio, ribbonShaderChunk, WEAVE_RELAX, WEAVE_RENDER_ORDER } from "./weave";

// Seconds: bound over a minute; held for the hour; then released.
export const COMPEL_BIND = 60;
export const COMPEL_HELD = 3600;
const RELEASE = 60;
const SAG = 120;
const LET_GO = 120;
export const COMPEL_LENGTH = COMPEL_HELD + SAG + LET_GO;

// How much of their strength is being poured into the weather (0..1) at `since` seconds.
export function compelledShare(since: number) {
	if (since < 0) return 0;
	const bound = THREE.MathUtils.smoothstep(since, 0, COMPEL_BIND);
	return bound * (1 - THREE.MathUtils.smoothstep(since, COMPEL_HELD, COMPEL_HELD + SAG));
}

// The thirteen, by their place among the minds (psyche.ts): the twelve, then Manulani. (12 is the
// strongest, whose hands bind them.)
const BOUND = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13];
const STRONGEST = 12;
// Whose each of the twelve is (Siuan's 0, Leane's 1, Moiraine's 2), for her colour.
const THIRDS = [0, 1, 0, 1, 2, 2, 1, 0, 2, 1, 0, 2];
const MIGHTY = [0, 1, 2, 5];
// Her rope's measures, by the cube root of her strength (as MIGHT in channellers.ts).
const measuresOf = (who: number) => (who === 13 ? 4.9 * Math.cbrt(1.12) * Math.cbrt(SIX_STRONGER) : MIGHTY.includes(who) ? 2.5 * Math.cbrt(SIX_STRONGER) : 1);
const FIBRES = 90;
const BINDING_FIBRES = 40;
const SEGMENTS = 110;

const vertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute vec2 aCell;
attribute vec4 aSeed;
uniform float uTime;
uniform vec3 uBoat;
uniform vec2 uAhead;
uniform vec3 uWindDir;
uniform vec3 uSeats[ 14 ];
uniform vec3 uEnds[ 14 ];
uniform float uGirth[ 14 ];
// Each one's state: how near she is burning out now (0..1), her own quiver.
uniform float uBurn[ 14 ];
uniform float uQuiver[ 14 ];
uniform float uBind;
uniform float uUnbind;
uniform float uCast;
uniform float uSag;
uniform float uLetGo;
uniform float uDay;
uniform vec3 uTints[ 14 ];
varying float vAlpha;
varying float vEdge;
varying float vHot;
varying float vGrey;
varying float vKind;
varying vec3 vTint;
${ribbonShaderChunk}

vec3 aheadDir() { return vec3( uAhead.x, 0.0, uAhead.y ); }
vec3 acrossDir() { return vec3( - uAhead.y, 0.0, uAhead.x ); }
vec3 bezier( vec3 a, vec3 b, vec3 c, vec3 d, float t ) {
	float s = 1.0 - t;
	return s * s * s * a + 3.0 * s * s * t * b + 3.0 * s * t * t * c + t * t * t * d;
}
// Her rope: up from her hands and out, into the storm overhead.
vec3 ropeAt( int who, float t ) {
	vec3 seat = uSeats[ who ];
	vec3 end = uEnds[ who ];
	vec3 away = normalize( vec3( end.x - seat.x, 0.0, end.z - seat.z ) + vec3( 1e-4 ) );
	vec3 p = bezier( seat, seat + vec3( 0.0, 70.0, 0.0 ) + away * 110.0, end - vec3( 0.0, 320.0, 0.0 ) - away * 260.0, end, t );
	// Released and spent, it goes slack and sags towards the sea.
	p.y -= ( 30.0 + 160.0 * t ) * uSag * sin( 3.14159 * t );
	return p;
}

void main() {
	int who = int( aCell.x + 0.5 );
	bool binding = aCell.y > 0.5;
	float burn = uBurn[ who ];
	vec3 here;
	vec3 next;
	float shown;
	if ( binding ) {
		// From the strongest's hands to her rope near her hands, then wound round it.
		vec3 hands = uSeats[ ${STRONGEST} ];
		float u = aT;
		vec3 a;
		vec3 b;
		for ( int k = 0; k < 2; k ++ ) {
			float t = min( u + float( k ) * 0.01, 1.0 );
			vec3 p;
			if ( t < 0.4 ) {
				vec3 to = ropeAt( who, 0.12 );
				p = bezier( hands, hands + vec3( 0.0, 10.0, 0.0 ), to + vec3( 0.0, 8.0, 0.0 ), to, t / 0.4 );
			} else {
				float s = ( t - 0.4 ) / 0.6;
				float along = 0.12 + 0.2 * s;
				vec3 c = ropeAt( who, along );
				vec3 dir = normalize( ropeAt( who, along + 0.01 ) - c + vec3( 1e-5 ) );
				vec3 n1 = normalize( cross( dir, vec3( 0.0, 1.0, 0.0 ) ) + vec3( 1e-4 ) );
				vec3 n2 = normalize( cross( n1, dir ) );
				float a0 = s * 6.28318 * 6.0 + aSeed.y * 6.28318;
				p = c + ( n1 * cos( a0 ) + n2 * sin( a0 ) ) * ( 2.5 + 1.5 * aSeed.z );
			}
			if ( k == 0 ) a = p; else b = p;
		}
		here = a;
		next = b + ( aT >= 0.99 ? a - b : vec3( 0.0 ) );
		here += vec3( 0.0, 1.0, 0.0 ) * ( aSeed.z - 0.5 ) * 0.6;
		shown = smoothstep( uBind, uBind - 0.03, aT ) * smoothstep( uUnbind, uUnbind + 0.03, aT ) * 1.4;
		vHot = 0.0;
		vGrey = 0.0;
	} else {
		here = ropeAt( who, aT );
		next = ropeAt( who, min( aT + 0.01, 1.0 ) ) + ( aT >= 0.99 ? here - ropeAt( who, aT - 0.01 ) : vec3( 0.0 ) );
		vec3 dir = normalize( next - here + vec3( 1e-5 ) );
		vec3 n1 = normalize( cross( dir, vec3( 0.0, 1.0, 0.0 ) ) + vec3( 1e-4 ) );
		vec3 n2 = normalize( cross( n1, dir ) );
		float body = sin( 3.14159 * aT );
		// Drawn taut at the brink: the girth pulled in.
		float spread = ( 0.4 + uGirth[ who ] * body * ( 1.0 - 0.35 * burn ) ) * sqrt( aSeed.z );
		float turn = aSeed.y * 6.28318 + aT * 4.0 + uTime * 0.2 * ( aSeed.x - 0.5 );
		vec3 off = ( n1 * cos( turn ) + n2 * sin( turn ) ) * spread;
		// Trembling under the strain: quick and small, a taut line, never a thrash.
		off += n1 * sin( aT * 16.0 - uQuiver[ who ] * 5.0 + aSeed.x * 4.0 ) * ( 1.0 + 6.0 * burn ) * body * ( 1.0 - uSag );
		// Fraying: the outermost filaments splay off it and stream downwind, the more the nearer the edge.
		float fray = smoothstep( 0.78, 1.0, aSeed.w ) * burn * ( 1.0 - uSag );
		off += ( n1 * cos( turn ) + n2 * sin( turn ) ) * fray * ( 6.0 + 30.0 * aT ) + uWindDir * fray * 40.0 * aT * aT;
		here += off;
		next += off;
		// Cast up from her hands as she is bound; let go from her hands when released.
		shown = smoothstep( uCast, uCast - 0.03, aT ) * smoothstep( uLetGo, uLetGo + 0.03, aT );
		shown *= ( 0.6 + 0.4 * burn ) * ( 1.0 - 0.5 * fray ) * ( 1.0 - 0.45 * uSag );
		// Laid on unevenly along its length, as a brush lays colour.
		shown *= 0.55 + 0.45 * smoothstep( - 0.6, 0.6, sin( aT * 6.0 + aSeed.y * 6.0 ) + 0.5 * sin( aT * 15.0 + 2.0 ) );
		vHot = burn * burn;
		vGrey = uSag;
	}
	float far = length( here - cameraPosition );
	shown *= smoothstep( 8.0, 40.0, far ) * exp( - far / 9000.0 );
	vAlpha = shown;
	vEdge = aSide;
	vKind = binding ? 1.0 : 0.0;
	// (The strongest's binding white; her rope her own colour.)
	vTint = binding ? vec3( 1.0 ) : uTints[ who ];
	mat4 vp = projectionMatrix * viewMatrix;
	gl_Position = ribbonPosition( vp * vec4( here, 1.0 ), vp * vec4( next, 1.0 ), aSide, mix( 1.0, 1.3, uDay ) );
}
`;

const fragment = /* glsl */ `
uniform float uGain;
uniform float uDay;
uniform float uWhite;
uniform float uOpacity;
varying float vAlpha;
varying float vEdge;
varying float vHot;
varying float vGrey;
varying float vKind;
varying vec3 vTint;
void main() {
	float across = abs( vEdge );
	float body = 1.0 - smoothstep( 0.7, 1.0, across );
	vec3 own = vTint;
	// Near burning out, her colour burns towards white-hot; spent, it greys.
	own = mix( own, vec3( 1.0, 0.96, 0.88 ), 0.7 * vHot );
	own = mix( own, vec3( dot( own, vec3( 0.3, 0.45, 0.25 ) ) ) * 0.75, 0.7 * vGrey );
	vec3 day = vKind > 0.5 ? vec3( uWhite ) : own * ( 1.0 + 0.15 * uWhite );
	gl_FragColor = vec4( mix( own * uGain, day, uDay ), body * vAlpha * uOpacity * mix( 1.0, 3.0, uDay ) );
	// (Relaxed by half: WEAVE_RELAX.)
	gl_FragColor.a *= ${WEAVE_RELAX.toFixed(3)};
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

export interface CompelledFrame {
	since: number;
	time: number;
	delta: number;
	boat: THREE.Vector3;
	ahead: THREE.Vector2;
	wind: THREE.Vector3;
	day: number;
	gain: number;
	white: number;
	// The three's colours (Siuan's, Leane's, Moiraine's).
	tints: THREE.Color[];
}

export function createCompelled(scene: THREE.Scene, layer: number) {
	// Each of the thirteen her own rope, as many filaments as her strength carries; and the
	// strongest's binding to each.
	const cells: [number, number][] = [];
	for (const who of BOUND) {
		for (let f = 0; f < Math.round(FIBRES * measuresOf(who)); f++) cells.push([who, 0]);
		for (let f = 0; f < BINDING_FIBRES; f++) cells.push([who, 1]);
	}
	const geometry = lines(cells.length, SEGMENTS, (i) => cells[i]!);
	const uniforms = {
		uTime: { value: 0 },
		uBoat: { value: new THREE.Vector3() },
		uAhead: { value: new THREE.Vector2(0, -1) },
		uWindDir: { value: new THREE.Vector3(1, 0, 0) },
		uSeats: { value: Array.from({ length: 14 }, () => new THREE.Vector3()) },
		uEnds: { value: Array.from({ length: 14 }, () => new THREE.Vector3()) },
		uGirth: { value: Array.from({ length: 14 }, (_, who) => 3 + 2.5 * Math.sqrt(measuresOf(who))) },
		uBurn: { value: new Array<number>(14).fill(0) },
		uQuiver: { value: new Array<number>(14).fill(0) },
		uTints: { value: Array.from({ length: 14 }, () => new THREE.Color()) },
		uBind: { value: 0 },
		uUnbind: { value: 0 },
		uCast: { value: 0 },
		uSag: { value: 0 },
		uLetGo: { value: 0 },
		uDay: { value: 0 },
		uGain: { value: 1 },
		uWhite: { value: 1 },
		uOpacity: { value: 0.045 },
		uResolution: { value: new THREE.Vector2(1, 1) },
		uPixelRatio: pixelRatio,
	};
	const mesh = new THREE.Mesh(
		geometry,
		new THREE.ShaderMaterial({
			uniforms,
			vertexShader: vertex,
			fragmentShader: fragment,
			transparent: true,
			depthWrite: false,
			side: THREE.DoubleSide,
		}),
	);
	mesh.frustumCulled = false;
	mesh.renderOrder = WEAVE_RENDER_ORDER;
	mesh.layers.set(layer);
	mesh.visible = false;
	scene.add(mesh);

	const ahead = new THREE.Vector3();
	const across = new THREE.Vector3();
	const update = (frame: CompelledFrame | undefined) => {
		if (!frame || frame.since < 0 || frame.since > COMPEL_LENGTH) {
			mesh.visible = false;
			return;
		}
		const since = frame.since;
		ahead.set(frame.ahead.x, 0, frame.ahead.y);
		across.set(-frame.ahead.y, 0, frame.ahead.x);
		uniforms.uTime.value = frame.time;
		uniforms.uBoat.value.copy(frame.boat);
		uniforms.uAhead.value.copy(frame.ahead);
		uniforms.uWindDir.value.copy(frame.wind).setY(0);
		if (uniforms.uWindDir.value.lengthSq() > 1e-6) uniforms.uWindDir.value.normalize();
		uniforms.uDay.value = frame.day;
		uniforms.uGain.value = frame.gain;
		uniforms.uWhite.value = frame.white;
		uniforms.uResolution.value.set(window.innerWidth, window.innerHeight).multiplyScalar(pixelRatio.value);
		const smooth = THREE.MathUtils.smoothstep;
		uniforms.uBind.value = smooth(since, 0, COMPEL_BIND * 0.7) * 1.05;
		uniforms.uCast.value = smooth(since, COMPEL_BIND * 0.3, COMPEL_BIND) * 1.05;
		uniforms.uUnbind.value = smooth(since, COMPEL_HELD, COMPEL_HELD + RELEASE) * 1.05;
		uniforms.uSag.value = smooth(since, COMPEL_HELD, COMPEL_HELD + SAG);
		uniforms.uLetGo.value = smooth(since, COMPEL_HELD + SAG, COMPEL_LENGTH) * 1.05;
		const held = compelledShare(since);
		for (let who = 0; who < 14; who++) {
			uniforms.uSeats.value[who]!.copy(seatOf(who, frame.boat, ahead, across));
			// Into the storm overhead, fanned across the sky ahead, each to her own place.
			const order = BOUND.indexOf(who);
			const fan = order < 0 ? 0 : order / (BOUND.length - 1) - 0.5;
			uniforms.uEnds.value[who]!.copy(frame.boat).addScaledVector(ahead, 1500 - 300 * Math.abs(fan)).addScaledVector(across, fan * 2200).add(new THREE.Vector3(0, 900 + 120 * Math.cos(fan * 6), 0));
			if (who === STRONGEST) continue;
			const temper = TEMPERS[who]!;
			// At the brink, the nearer the less stamina she has, burning on each breath; the strongest
			// holds each just short of the edge.
			const breath = 0.5 + 0.5 * Math.sin((2 * Math.PI * frame.time) / (6 + 5 * temper.steady) + who * 1.9);
			uniforms.uBurn.value[who] = held * Math.min(0.97, 0.72 + 0.18 * (1 - temper.stamina) + 0.12 * breath);
			uniforms.uQuiver.value[who] = uniforms.uQuiver.value[who]! + frame.delta * (1 + 3 * uniforms.uBurn.value[who]!);
			uniforms.uTints.value[who]!.copy(who === 13 ? new THREE.Color(1, 0.88, 0.66) : frame.tints[THIRDS[who]!]!);
		}
		(mesh.material as THREE.ShaderMaterial).blending = frame.day > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending;
		mesh.visible = true;
	};

	const dispose = () => {
		scene.remove(mesh);
		(mesh.material as THREE.Material).dispose();
		geometry.dispose();
	};

	return { update, dispose };
}
