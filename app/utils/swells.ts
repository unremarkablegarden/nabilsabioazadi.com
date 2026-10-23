// Siuan's swells and mist, as they are seen (channelled-storm.ts, siuanSea, has the sea and the
// air). Siuan (Siuan · Fathom), the fisher's daughter, works with the sea and never against it:
//
//   the haul  two great ropes of hers in the tamed sea glass of her four run from her hands out
//             low over the water, each towards where one of the two swells comes from, and down
//             into the sea a couple of kilometres off. She hauls on them with the sea itself, as
//             she commanded the six to: drawn tight as the water under the boat rises and falls
//             fastest, slack at crest and trough, twice to each swell. As many filaments as her
//             strength carries (the mighty's 2.5 measures, and the six's greater strength).
//   the mist  as she pulls them up she channels mist off them: long soft veils of it lying low
//             over the swells, lifted by them as they pass and laid down again, streaming slowly
//             downwind, thickest over the water near the boat and lost in the haze she has made
//             of the air further off.
//   support since the ter'angreal (23 October: each of the other eleven Aes Sedai holds a pounamu
//             dog, her strength up to nine times, "and now their style of weaving to support Siuan
//             are changing"): each of the eleven sends a rope of her own from her hands, green with
//             the pounamu where it leaves them, that crosses to one of Siuan's haul ropes and winds
//             round it along all its length, so that hers are braided cables of all their strength
//             (as the serpents' bodies wind round one another); as many filaments as her strength
//             carries, in her own colour.
// Nothing jagged and nothing flashing: lines that curve and breathe with the sea.
import * as THREE from "three";
import { lines } from "./embroidery";
import { SIX_STRONGER, TER_ANGREAL } from "./psyche";
import { seatOf } from "./treason";
import { pixelRatio, ribbonShaderChunk, WEAVE_RELAX, WEAVE_RENDER_ORDER } from "./weave";

// Siuan · Fathom, among the minds.
const SIUAN = 2;
const HAUL_FILAMENTS = Math.round(120 * 2.5 * Math.cbrt(SIX_STRONGER));
const MIST_VEILS = 700;
// The eleven who support her, by their place among the minds; whose each is (Siuan's 0, Leane's 1,
// Moiraine's 2), for her colour; and as many filaments as each one's strength carries.
const SUPPORT = [0, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const THIRDS = [0, 1, 0, 1, 2, 2, 1, 0, 2, 1, 0, 2];
const MIGHTY = [0, 1, 5];
const supportFilaments = (who: number) => Math.round(36 * (MIGHTY.includes(who) ? 2.5 * Math.cbrt(SIX_STRONGER) : 1) * Math.cbrt(TER_ANGREAL[who]!));

const vertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute vec2 aCell;
attribute vec4 aSeed;
uniform float uTime;
uniform vec3 uBoat;
uniform vec3 uHands;
// Towards where each swell comes from (flat, unit), and the heights and periods of the two swells.
uniform vec3 uFrom[ 2 ];
uniform vec2 uSwell[ 2 ];
uniform vec3 uWindDir;
// The eleven's hands, and their colours.
uniform vec3 uSupportSeats[ 11 ];
uniform vec3 uSupportTints[ 11 ];
uniform float uHaul;
uniform float uRaised;
uniform float uDay;
varying float vAlpha;
varying float vEdge;
varying float vMist;
varying vec3 vTint;
${ribbonShaderChunk}

vec3 bezier( vec3 a, vec3 b, vec3 c, vec3 d, float t ) {
	float s = 1.0 - t;
	return s * s * s * a + 3.0 * s * s * t * b + 3.0 * s * t * t * c + t * t * t * d;
}
// How high her two swells lift the water at p (m): as they cross, their crests heap into peaks.
float swellsAt( vec3 p ) {
	float h = 0.0;
	for ( int i = 0; i < 2; i ++ ) {
		float k = 6.28318 / ( 1.56 * uSwell[ i ].y * uSwell[ i ].y );
		float w = 6.28318 / uSwell[ i ].y;
		h += 0.5 * uSwell[ i ].x * cos( k * dot( p.xz - uBoat.xz, - uFrom[ i ].xz ) - w * uTime );
	}
	return h * uRaised;
}
// A haul rope: out low over the water towards where its swell comes from, and down into the sea.
vec3 haulAt( int i, float t ) {
	vec3 from = uFrom[ i ];
	vec3 side = vec3( - from.z, 0.0, from.x ) * ( i == 0 ? 1.0 : - 1.0 );
	vec3 end = uBoat + from * 2200.0 + side * 150.0 - vec3( 0.0, 30.0, 0.0 );
	vec3 p = bezier( uHands, uHands + from * 60.0 + vec3( 0.0, 14.0, 0.0 ), uBoat + from * 1100.0 + side * 220.0 + vec3( 0.0, 40.0, 0.0 ), end, t );
	// Riding the swells it pulls on, a little above them.
	p.y = mix( p.y, uBoat.y - 2.0 + swellsAt( p ) + 18.0 * ( 1.0 - t ), smoothstep( 0.05, 0.4, t ) * ( 1.0 - smoothstep( 0.85, 1.0, t ) ) );
	return p;
}
// One of the eleven's support: from her hands across to one of Siuan's haul ropes, and wound round it.
vec3 supportAt( int k, float t ) {
	int h = k - 2 * ( k / 2 );
	vec3 seat = uSupportSeats[ k ];
	vec3 join = haulAt( h, 0.12 );
	if ( t < 0.22 ) return bezier( seat, seat + vec3( 0.0, 12.0, 0.0 ), join + vec3( 0.0, 8.0, 0.0 ), join, t / 0.22 );
	float s = ( t - 0.22 ) / 0.78;
	float along = 0.12 + 0.82 * s;
	vec3 c = haulAt( h, along );
	vec3 dir = normalize( haulAt( h, along + 0.01 ) - c + vec3( 1e-5 ) );
	vec3 n1 = normalize( cross( dir, vec3( 0.0, 1.0, 0.0 ) ) + vec3( 1e-4 ) );
	vec3 n2 = normalize( cross( n1, dir ) );
	float a = s * 6.28318 * 16.0 + float( k ) * 0.5712 + uTime * 0.25;
	float r = ( 5.0 + 6.0 * s ) * ( 0.8 + 0.4 * aSeed.z );
	return c + ( n1 * cos( a ) + n2 * sin( a ) ) * r;
}
// A veil of mist: a long soft strand lying low across the swells, lifted as they pass, drifting downwind.
vec3 mistAt( float t ) {
	float r = 120.0 + 2600.0 * aSeed.x * aSeed.x;
	float a = aSeed.y * 6.28318;
	vec3 centre = uBoat + vec3( cos( a ), 0.0, sin( a ) ) * r;
	// (Drifting downwind, and wrapping round so the boat is never left without it.)
	vec3 drift = uWindDir * mod( uTime * ( 2.0 + 3.0 * aSeed.z ) + aSeed.w * 900.0, 900.0 ) - uWindDir * 450.0;
	vec3 along = normalize( vec3( - uWindDir.z, 0.0, uWindDir.x ) + vec3( cos( a * 3.0 ), 0.0, sin( a * 3.0 ) ) * 0.4 );
	float length_ = 90.0 + 260.0 * aSeed.z;
	vec3 p = centre + drift + along * ( t - 0.5 ) * length_;
	p += uWindDir * sin( t * 3.14159 ) * 30.0 * ( aSeed.w - 0.5 );
	p.y = uBoat.y - 2.0 + swellsAt( p ) + 4.0 + 20.0 * aSeed.w + 6.0 * sin( t * 5.0 + aSeed.x * 20.0 + uTime * 0.05 );
	return p;
}

void main() {
	bool mist = aCell.y > 0.5 && aCell.y < 1.5;
	bool support = aCell.y > 1.5;
	vec3 here;
	vec3 next;
	float shown;
	vTint = vec3( 0.0 );
	if ( support ) {
		int k = int( aCell.x + 0.5 );
		here = supportAt( k, aT );
		next = supportAt( k, min( aT + 0.006, 1.0 ) ) + ( aT >= 0.994 ? here - supportAt( k, aT - 0.006 ) : vec3( 0.0 ) );
		vec3 dir = normalize( next - here + vec3( 1e-5 ) );
		vec3 n1 = normalize( cross( dir, vec3( 0.0, 1.0, 0.0 ) ) + vec3( 1e-4 ) );
		vec3 n2 = normalize( cross( n1, dir ) );
		// A hawser of her own, on its shell, at one twist.
		float turn = aSeed.y * 6.28318 + aT * 30.0;
		vec3 off = ( n1 * cos( turn ) + n2 * sin( turn ) ) * ( 0.3 + 1.6 * sin( 3.14159 * min( aT * 1.2, 1.0 ) ) ) * ( 0.62 + 0.38 * aSeed.z );
		here += off;
		next += off;
		shown = ( 0.6 + 0.3 * uHaul ) * smoothstep( 1.0, 0.9, aT );
		// Green with the pounamu where it leaves her hands.
		vTint = mix( vec3( 0.24, 0.58, 0.4 ), uSupportTints[ k ], smoothstep( 0.04, 0.2, aT ) );
		vMist = 0.0;
	} else if ( mist ) {
		here = mistAt( aT );
		next = mistAt( min( aT + 0.02, 1.0 ) ) + ( aT >= 0.98 ? here - mistAt( aT - 0.02 ) : vec3( 0.0 ) );
		shown = sin( 3.14159 * aT ) * ( 0.5 + 0.5 * aSeed.z );
		vMist = 1.0;
	} else {
		int i = int( aCell.x + 0.5 );
		here = haulAt( i, aT );
		next = haulAt( i, min( aT + 0.01, 1.0 ) ) + ( aT >= 0.99 ? here - haulAt( i, aT - 0.01 ) : vec3( 0.0 ) );
		vec3 dir = normalize( next - here + vec3( 1e-5 ) );
		vec3 n1 = normalize( cross( dir, vec3( 0.0, 1.0, 0.0 ) ) + vec3( 1e-4 ) );
		vec3 n2 = normalize( cross( n1, dir ) );
		// A hawser's girth, drawn in as she hauls.
		float spread = ( 0.4 + 6.0 * sin( 3.14159 * aT ) * ( 1.0 - 0.4 * uHaul ) ) * sqrt( aSeed.z );
		float turn = aSeed.y * 6.28318 + aT * 6.0 + uTime * 0.1 * ( aSeed.x - 0.5 );
		vec3 off = ( n1 * cos( turn ) + n2 * sin( turn ) ) * spread;
		here += off;
		next += off;
		shown = ( 0.7 + 0.4 * uHaul ) * smoothstep( 1.0, 0.85, aT );
		vTint = vec3( - 1.0 );
		shown *= 0.55 + 0.45 * smoothstep( - 0.6, 0.6, sin( aT * 6.0 + aSeed.y * 6.0 ) + 0.5 * sin( aT * 15.0 + 2.0 ) );
		vMist = 0.0;
	}
	float far = length( here - cameraPosition );
	shown *= smoothstep( 10.0, 50.0, far ) * exp( - far / ( mist ? 3000.0 : 6000.0 ) );
	vAlpha = shown * uRaised;
	vEdge = aSide;
	mat4 vp = projectionMatrix * viewMatrix;
	// (The mist laid on broad and soft, as a brush wide with water.)
	gl_Position = ribbonPosition( vp * vec4( here, 1.0 ), vp * vec4( next, 1.0 ), aSide, mist ? 14.0 : mix( 1.0, 1.3, uDay ) );
}
`;

const fragment = /* glsl */ `
uniform float uGain;
uniform float uDay;
uniform vec3 uTint;
uniform vec3 uMistColour;
varying float vAlpha;
varying float vEdge;
varying float vMist;
varying vec3 vTint;
void main() {
	float across = abs( vEdge );
	// (Her own colour for her haul; each supporter's for hers.)
	vec3 tint = vTint.r < 0.0 ? uTint : vTint;
	if ( vMist > 0.5 ) {
		// Soft all through, with no edge.
		gl_FragColor = vec4( uMistColour, exp( - across * across * 3.0 ) * vAlpha * 0.06 );
	} else {
		float body = 1.0 - smoothstep( 0.7, 1.0, across );
		gl_FragColor = vec4( mix( tint * uGain, tint * 1.2, uDay ), body * vAlpha * 0.035 * mix( 1.0, 3.0, uDay ) );
	}
	// (Relaxed by half: WEAVE_RELAX.)
	gl_FragColor.a *= ${WEAVE_RELAX.toFixed(3)};
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

export interface SwellsFrame {
	// 0..1 how far her swells are up.
	raised: number;
	time: number;
	delta: number;
	boat: THREE.Vector3;
	ahead: THREE.Vector2;
	wind: THREE.Vector3;
	// Where the two swells come from (radians off the way ahead), their heights (m) and periods (s).
	swells: [{ from: number; height: number; period: number }, { from: number; height: number; period: number }];
	// The water under the boat (m), for her haul with the sea.
	heave: number;
	day: number;
	gain: number;
	// Her colour, the tamed sea glass of her four; and the mist's, the colour of the air.
	tint: THREE.Color;
	mist: THREE.Color;
	// The three's colours (Siuan's, Leane's, Moiraine's), for the eleven's support.
	tints: THREE.Color[];
}

export function createSwells(scene: THREE.Scene, layer: number) {
	const cells: [number, number][] = [];
	for (let i = 0; i < 2; i++) for (let f = 0; f < HAUL_FILAMENTS; f++) cells.push([i, 0]);
	for (let f = 0; f < MIST_VEILS; f++) cells.push([0, 1]);
	SUPPORT.forEach((who, k) => {
		for (let f = 0; f < supportFilaments(who); f++) cells.push([k, 2]);
	});
	const geometry = lines(cells.length, 90, (i) => cells[i]!);
	const uniforms = {
		uTime: { value: 0 },
		uBoat: { value: new THREE.Vector3() },
		uHands: { value: new THREE.Vector3() },
		uFrom: { value: [new THREE.Vector3(), new THREE.Vector3()] },
		uSwell: { value: [new THREE.Vector2(1, 10), new THREE.Vector2(1, 10)] },
		uWindDir: { value: new THREE.Vector3(1, 0, 0) },
		uSupportSeats: { value: Array.from({ length: 11 }, () => new THREE.Vector3()) },
		uSupportTints: { value: Array.from({ length: 11 }, () => new THREE.Color()) },
		uHaul: { value: 0 },
		uRaised: { value: 0 },
		uDay: { value: 0 },
		uGain: { value: 1 },
		uTint: { value: new THREE.Color() },
		uMistColour: { value: new THREE.Color() },
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
	// Her haul with the sea: against the water's own going under the boat (as in stilling.ts).
	let lastHeave: number | undefined;
	let lift = 0;
	const update = (frame: SwellsFrame | undefined) => {
		if (!frame || frame.raised <= 0.001) {
			mesh.visible = false;
			lastHeave = undefined;
			return;
		}
		ahead.set(frame.ahead.x, 0, frame.ahead.y);
		across.set(-frame.ahead.y, 0, frame.ahead.x);
		uniforms.uTime.value = frame.time;
		uniforms.uBoat.value.copy(frame.boat);
		uniforms.uHands.value.copy(seatOf(SIUAN, frame.boat, ahead, across));
		SUPPORT.forEach((who, k) => {
			uniforms.uSupportSeats.value[k]!.copy(seatOf(who, frame.boat, ahead, across));
			uniforms.uSupportTints.value[k]!.copy(frame.tints[THIRDS[who]!]!);
		});
		frame.swells.forEach((swell, i) => {
			uniforms.uFrom.value[i]!.copy(ahead).multiplyScalar(Math.cos(swell.from)).addScaledVector(across, Math.sin(swell.from));
			uniforms.uSwell.value[i]!.set(swell.height, Math.max(swell.period, 4));
		});
		uniforms.uWindDir.value.copy(frame.wind).setY(0);
		if (uniforms.uWindDir.value.lengthSq() > 1e-6) uniforms.uWindDir.value.normalize();
		else uniforms.uWindDir.value.set(1, 0, 0);
		if (frame.delta > 0) {
			const moving = lastHeave === undefined ? 0 : (frame.heave - lastHeave) / frame.delta;
			lastHeave = frame.heave;
			lift += (moving - lift) * Math.min(1, frame.delta / 0.6);
		}
		const fastest = (Math.PI * Math.max(frame.swells[0].height, 0.1)) / Math.max(frame.swells[0].period, 2);
		uniforms.uHaul.value = Math.min(1, Math.abs(lift) / fastest) ** 0.7;
		uniforms.uRaised.value = frame.raised;
		uniforms.uDay.value = frame.day;
		uniforms.uGain.value = frame.gain;
		uniforms.uTint.value.copy(frame.tint);
		uniforms.uMistColour.value.copy(frame.mist);
		uniforms.uResolution.value.set(window.innerWidth, window.innerHeight).multiplyScalar(pixelRatio.value);
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
