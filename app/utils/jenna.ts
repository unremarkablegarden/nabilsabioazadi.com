// Jenna's storm, as it is seen (channelled-storm.ts, jennaStorm, has the weather; gerstner-waves.ts,
// strikeRing, the swells). The owner, 24 October: "We are doing a new storm in honour of Jenna, the
// channellers are now channeling lightning that has water and air weaves along with it that then
// cause swells of waters and waves." The bolt is the storm's own, as real lightning is (lightning.ts);
// what the channellers do is draw it down to the sea where they mean it to strike, and take what it
// gives. Each channelled bolt, by one of them at a time:
//
//   the reach  before it strikes she sends a rope out from her hands low over the sea, its air and
//              its water wound round each other at one twist, and at its end it rises from the
//              water to meet the bolt, as a real strike's upward streamer rises to meet the leader
//              coming down; it is there when the leader touches it, then let go.
//   the air    the stroke heats the air of its channel to tens of thousands of degrees; she takes
//              that heat into a weave of air wound round the channel, a soft tube that follows it
//              without its kinks and widens as the air expands, and lets it go from the top, so
//              that it rolls down into the sea; there it spreads out over the water as a ring
//              rolling over itself, as the outflow of a thunderstorm's downburst does, carried
//              a little downwind, slowing as it widens.
//   the water  where the bolt meets the sea her water weave presses a hollow into it, and the sea
//              answers with a ring of swell running out from that place to the boat and beyond,
//              the longest waves first (strikeRing); the weave's water rides on it, lying on the
//              swell where its energy is, carried out at the swell's own group speed.
//
// The first to draw a bolt down is the strongest, who looks first into any weather out of the way;
// after that whoever is free of the others, most often those of both air and water. As many
// filaments as her strength carries, and the swell she makes as great as her strength (its root).
// Everything in the weave curves: only the bolt itself is jagged, being lightning.
import * as THREE from "three";
import { lines } from "./embroidery";
import { NAMES, ropeMight, STRONGEST_MIND, TEMPERS } from "./psyche";
import { seatOf } from "./treason";
import { pixelRatio, ribbonShaderChunk, WEAVE_RELAX, WEAVE_RENDER_ORDER } from "./weave";

// How many bolts can be in hand at once: each weave is done within two minutes.
export const JENNA_SLOTS = 5;
const SLOT_LENGTH = 115;
// Filaments in each part of one weave at the greatest strength, and points along each.
const PARTS = [160, 80, 96, 72];
const SEGMENTS = 96;
// The greatest of the strengths, for each one's share of the filaments.
const MOST = Math.max(...TEMPERS.map((_, who) => ropeMight(who)));
// The swell's group speed (m/s): that of the two-hundred-metre waves it is mostly made of.
const RING_SPEED = 0.5 * Math.sqrt((9.8 * 200) / (2 * Math.PI));
// The water weave presses the sea this long after the stroke.
const PRESS = 0.6;

const vertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute vec2 aCell;
attribute vec4 aSeed;
uniform float uTime;
uniform vec3 uHands[ ${JENNA_SLOTS} ];
// Where it meets the sea (and the height of the swell it sends out), and the four points of the
// bolt's channel, top to sea, its kinks smoothed away.
uniform vec4 uFoot[ ${JENNA_SLOTS} ];
uniform vec3 uAxis[ ${JENNA_SLOTS * 4} ];
// When she called it, when it struck, her share of the filaments, and 1 while it is in hand.
uniform vec4 uWhen[ ${JENNA_SLOTS} ];
uniform vec3 uWindDir;
uniform float uDay;
uniform vec3 uAir;
uniform vec3 uWater;
varying float vAlpha;
varying float vEdge;
varying vec3 vTint;
varying float vSky;
${ribbonShaderChunk}

vec3 bezier( vec3 a, vec3 b, vec3 c, vec3 d, float t ) {
	float s = 1.0 - t;
	return s * s * s * a + 3.0 * s * s * t * b + 3.0 * s * t * t * c + t * t * t * d;
}
vec3 axisAt( int s, float u ) {
	return bezier( uAxis[ s * 4 ], uAxis[ s * 4 + 1 ], uAxis[ s * 4 + 2 ], uAxis[ s * 4 + 3 ], clamp( u, 0.0, 1.0 ) );
}
// The reach: out low over the sea from her hands, and up from the water to meet the bolt.
vec3 reachAt( int s, float t ) {
	vec3 hands = uHands[ s ];
	vec3 foot = uFoot[ s ].xyz;
	vec3 across = foot - hands;
	across.y = 0.0;
	float L = max( length( across ), 1.0 );
	vec3 dir = across / L;
	vec3 low = foot + vec3( 0.0, 14.0, 0.0 );
	vec3 arrive = normalize( dir * 0.3 * L - vec3( 0.0, 0.03 * L, 0.0 ) );
	if ( t < 0.8 ) return bezier( hands, hands + dir * 0.25 * L + vec3( 0.0, 20.0 + 0.02 * L, 0.0 ), low - arrive * 0.3 * L, low, t / 0.8 );
	vec3 top = axisAt( s, 0.86 );
	return bezier( low, low + arrive * 60.0, top - vec3( 0.0, 50.0, 0.0 ), top, ( t - 0.8 ) / 0.2 );
}
// How high her swell stands at p (as strikeRing in gerstner-waves.ts, without its sway).
float ringAt( int s, vec2 p ) {
	vec4 q = vec4( uFoot[ s ].xz, uWhen[ s ].y + ${PRESS.toFixed(2)}, uFoot[ s ].w );
	float t = uTime - q.z;
	if ( t <= 0.0 ) return 0.0;
	float r = length( p - q.xy );
	float reach = sqrt( r * r + 3600.0 );
	float k = 9.8 * t * t / ( 4.0 * reach * reach );
	float sorted = exp( - pow( log( 6.28318 / k / 200.0 ) / 0.55, 2.0 ) );
	float a = min( q.w * sorted * inversesqrt( ( 1.0 + r / 300.0 ) * ( 1.0 + t / 60.0 ) ) * smoothstep( 0.0, 3.0, t ), 0.12 / k );
	return a * sin( 2.35619 - 9.8 * t * t / ( 4.0 * reach ) );
}

void main() {
	int s = int( aCell.x + 0.5 );
	int part = int( aCell.y + 0.5 );
	vec4 when = uWhen[ s ];
	float tau = uTime - when.y;
	bool air = aSeed.w < 0.5;
	vec3 here;
	vec3 next;
	float shown = 0.0;
	float width = 1.2;
	if ( part == 0 ) {
		// The reach: grown out to its end as the leader comes down, so the two meet.
		float grow = clamp( ( uTime - when.x ) / max( when.y - when.x, 0.1 ), 0.0, 1.0 );
		here = reachAt( s, aT );
		next = reachAt( s, min( aT + 0.01, 1.0 ) ) + ( aT >= 0.99 ? here - reachAt( s, aT - 0.01 ) : vec3( 0.0 ) );
		vec3 dir = normalize( next - here + vec3( 1e-5 ) );
		vec3 n1 = normalize( cross( dir, vec3( 0.0, 1.0, 0.0 ) ) + vec3( 1e-4 ) );
		vec3 n2 = normalize( cross( n1, dir ) );
		float L = length( uFoot[ s ].xz - uHands[ s ].xz );
		// Its air and its water wound round each other on the shell of one tube, at one twist.
		float girth = ( 0.5 + ( 2.0 + 0.004 * L ) * sin( 3.14159 * min( aT * 1.1, 1.0 ) ) ) * ( 0.75 + 0.25 * aSeed.z ) * ( 0.6 + 0.4 * when.z );
		float turn = aSeed.y * 3.14159 + ( air ? 0.0 : 3.14159 ) + aT * 14.0 + uTime * 0.2;
		vec3 off = ( n1 * cos( turn ) + n2 * sin( turn ) ) * girth;
		here += off;
		next += off;
		shown = smoothstep( grow, grow - 0.05, aT ) * ( 1.0 - smoothstep( 3.0, 9.0, tau ) ) * smoothstep( 0.0, 0.03, aT );
	} else if ( part == 1 ) {
		// The air: wound round the channel, let go from the top and rolling down into the sea.
		float d = 0.85 * smoothstep( 1.5, 10.0, tau );
		float u = d + ( 1.0 - d ) * aT;
		vec3 c = axisAt( s, u );
		vec3 dir = normalize( axisAt( s, u + 0.01 ) - axisAt( s, u - 0.01 ) + vec3( 1e-5 ) );
		vec3 n1 = normalize( cross( dir, vec3( 1.0, 0.0, 0.0 ) ) + vec3( 1e-4 ) );
		vec3 n2 = normalize( cross( dir, n1 ) );
		float rho = ( 4.0 + 14.0 * smoothstep( 0.0, 4.0, tau ) ) * ( 0.7 + 0.3 * aSeed.z ) * ( 0.6 + 0.4 * when.z ) ;
		float a = aSeed.y * 6.28318 + u * 31.4159 + tau * 0.6;
		here = c + ( n1 * cos( a ) + n2 * sin( a ) ) * rho;
		float u2 = u + 0.01;
		vec3 c2 = axisAt( s, u2 );
		float a2 = aSeed.y * 6.28318 + u2 * 31.4159 + tau * 0.6;
		next = c2 + ( n1 * cos( a2 ) + n2 * sin( a2 ) ) * rho;
		// (Its top is lost in the cloud.)
		// (And it goes into the outflow at the sea, not on into a coil there.)
		shown = smoothstep( 0.1, 0.8, tau ) * ( 1.0 - smoothstep( 6.0, 11.0, tau ) ) * smoothstep( 0.0, 0.1, u ) * ( 1.0 - smoothstep( 0.88, 1.0, u ) );
		air = true;
		width = 1.0;
	} else if ( part == 2 ) {
		// The air spreading over the sea as a ring rolling over itself, its top going outward.
		float t2 = tau - 1.5;
		float R = 20.0 + 320.0 * ( 1.0 - exp( - max( t2, 0.0 ) / 18.0 ) );
		float core = ( 5.0 + 12.0 * ( 1.0 - exp( - max( t2, 0.0 ) / 12.0 ) ) ) * ( 0.6 + 0.4 * when.z );
		vec3 centre = uFoot[ s ].xyz + uWindDir * 2.0 * max( t2, 0.0 );
		float psi = aSeed.y * 6.28318 - t2 * 0.5;
		float rs = core * ( 0.35 + 0.65 * aSeed.z );
		for ( int k = 0; k < 2; k ++ ) {
			float th = ( aT + float( k ) * 0.004 ) * 6.28318;
			float rr = R * ( 1.0 + 0.025 * sin( 3.0 * th + float( s ) + t2 * 0.05 ) ) + rs * cos( psi + 0.15 * sin( 5.0 * th + aSeed.x * 6.0 ) );
			vec3 p = centre + vec3( cos( th ), 0.0, sin( th ) ) * rr + vec3( 0.0, 1.1 * core + 0.8 * rs * sin( psi ), 0.0 );
			if ( k == 0 ) here = p;
			else next = p;
		}
		shown = smoothstep( 0.0, 2.5, t2 ) * ( 1.0 - smoothstep( 22.0, 40.0, t2 ) );
		air = true;
	} else {
		// The water: riding out on her swell where its energy is, at its group speed.
		float tw = tau - ${PRESS.toFixed(2)};
		float rc = 30.0 + ${RING_SPEED.toFixed(3)} * max( tw, 0.0 );
		float r = rc + ( aSeed.x - 0.5 ) * ( 20.0 + 0.15 * rc );
		vec2 foot = uFoot[ s ].xz;
		for ( int k = 0; k < 2; k ++ ) {
			float th = ( aT + float( k ) * 0.004 ) * 6.28318 + aSeed.y * 0.3;
			vec2 at = foot + vec2( cos( th ), sin( th ) ) * r;
			vec3 p = vec3( at.x, ringAt( s, at ) + 1.5 + 2.0 * aSeed.z, at.y );
			if ( k == 0 ) here = p;
			else next = p;
		}
		shown = smoothstep( 0.0, 4.0, tw ) * ( 1.0 - smoothstep( 60.0, 110.0, tw ) );
		air = false;
		width = 1.4;
	}
	// (Only as many filaments as her strength carries.)
	shown *= step( aSeed.x * 0.999, when.z ) * when.w;
	vTint = air ? uAir : uWater;
	vSky = againstSky( here );
	float far = length( here - cameraPosition );
	vAlpha = shown * smoothstep( 10.0, 50.0, far ) * exp( - far / 6000.0 ) * ( part == 0 ? 1.0 : part == 1 ? 1.1 : part == 2 ? 0.75 : 0.85 );
	vEdge = aSide;
	mat4 vp = projectionMatrix * viewMatrix;
	gl_Position = ribbonPosition( vp * vec4( here, 1.0 ), vp * vec4( next, 1.0 ), aSide, width * mix( 1.0, 1.3, uDay ) );
}
`;

const fragment = /* glsl */ `
uniform float uGain;
uniform float uDay;
varying float vAlpha;
varying float vEdge;
varying vec3 vTint;
varying float vSky;
void main() {
	float body = 1.0 - smoothstep( 0.7, 1.0, abs( vEdge ) );
	// (By day as bright as the storm's lowered exposure needs, and lighter against the pale sky, or it
	// reads there as a dark line: nothing dark is laid under a weave.)
	gl_FragColor = vec4( mix( vTint * uGain, vTint * max( 1.2, uGain * mix( 0.8, 1.5, vSky ) ), uDay ), body * vAlpha * 0.045 * mix( 1.0, 3.0, uDay ) );
	// (Relaxed by half: WEAVE_RELAX.)
	gl_FragColor.a *= ${WEAVE_RELAX.toFixed(3)};
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

export interface JennaFrame {
	time: number;
	boat: THREE.Vector3;
	ahead: THREE.Vector2;
	wind: THREE.Vector3;
	day: number;
	gain: number;
	// The colours of air and water.
	air: THREE.Color;
	water: THREE.Color;
}

export function createJenna(scene: THREE.Scene, layer: number, rings: THREE.Vector4[]) {
	const cells: [number, number][] = [];
	for (let s = 0; s < JENNA_SLOTS; s++) PARTS.forEach((count, part) => {
		for (let f = 0; f < count; f++) cells.push([s, part]);
	});
	const geometry = lines(cells.length, SEGMENTS, (i) => cells[i]!);
	const uniforms = {
		uTime: { value: 0 },
		uHands: { value: Array.from({ length: JENNA_SLOTS }, () => new THREE.Vector3()) },
		uFoot: { value: Array.from({ length: JENNA_SLOTS }, () => new THREE.Vector4(0, 0, 0, 0)) },
		uAxis: { value: Array.from({ length: JENNA_SLOTS * 4 }, () => new THREE.Vector3()) },
		uWhen: { value: Array.from({ length: JENNA_SLOTS }, () => new THREE.Vector4(-1e6, -1e6, 0, 0)) },
		uWindDir: { value: new THREE.Vector3(1, 0, 0) },
		uDay: { value: 0 },
		uGain: { value: 1 },
		uAir: { value: new THREE.Color() },
		uWater: { value: new THREE.Color() },
		uResolution: { value: new THREE.Vector2(1, 1) },
		uPixelRatio: pixelRatio,
	};
	const mesh = new THREE.Mesh(geometry, new THREE.ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
	mesh.frustumCulled = false;
	mesh.renderOrder = WEAVE_RENDER_ORDER;
	mesh.layers.set(layer);
	mesh.visible = false;
	scene.add(mesh);

	// Who holds each bolt, by her place among the minds; and whether the strongest has drawn the first.
	const holder: (number | undefined)[] = Array.from({ length: JENNA_SLOTS }, () => undefined);
	let first = true;
	const freeSlot = (time: number) => {
		const when = uniforms.uWhen.value;
		return when.findIndex((w) => w.w === 0 || time - w.y > SLOT_LENGTH);
	};
	const freeRing = (time: number) => rings.findIndex((q) => q.w <= 0 || time - q.z > 280);
	// Whether a bolt can be drawn down just now: one of them free, the sea ready for its swell, and
	// the air charged again since the last; it charges as fast as it has energy for (its CAPE, J/kg):
	// a bolt in about 35 s at 1200, 20 s at 3000.
	let lastCalled = -Infinity;
	const ready = (time: number, cape: number) => freeSlot(time) >= 0 && freeRing(time) >= 0 && time - lastCalled > 40 / (0.5 + Math.max(cape, 0) / 2000);

	// She calls the bolt: from `top` in the cloud to `foot` on the sea, striking at `strikeAt`.
	const call = (top: THREE.Vector3, foot: THREE.Vector3, time: number, strikeAt: number) => {
		const slot = freeSlot(time);
		const ring = freeRing(time);
		if (slot < 0 || ring < 0) return false;
		const busy = holder.filter((who, s) => who !== undefined && time - uniforms.uWhen.value[s]!.y < SLOT_LENGTH);
		let who = STRONGEST_MIND;
		if (!first || busy.includes(who)) {
			// Whoever is free, most often those of both air and water.
			const weights = TEMPERS.map((t, i) => (busy.includes(i) ? 0 : (t.air * t.water) ** 2 * ropeMight(i)));
			let pick = Math.random() * weights.reduce((a, b) => a + b, 0);
			who = weights.findIndex((w) => (pick -= w) <= 0);
			if (who < 0) who = 0;
		}
		first = false;
		lastCalled = time;
		holder[slot] = who;
		const might = ropeMight(who);
		const height = Math.min(9, 2 + 0.9 * might);
		uniforms.uFoot.value[slot]!.set(foot.x, 0, foot.z, height);
		uniforms.uWhen.value[slot]!.set(time, strikeAt, Math.max(0.3, might / MOST), 1);
		// (Until it strikes, the channel is taken to run straight.)
		for (let i = 0; i < 4; i++) uniforms.uAxis.value[slot * 4 + i]!.lerpVectors(top, foot, i / 3);
		rings[ring]!.set(foot.x, foot.z, strikeAt + PRESS, height);
		return true;
	};
	// The bolt has struck down her reach: its channel at a quarter, a third and two thirds (smoothed
	// so that the curve passes through them without the kinks between).
	const a = new THREE.Vector3();
	const struck = (foot: THREE.Vector3, channel: (i: number) => THREE.Vector3) => {
		const slot = uniforms.uFoot.value.findIndex((f, s) => uniforms.uWhen.value[s]!.w > 0 && Math.abs(f.x - foot.x) < 1 && Math.abs(f.z - foot.z) < 1);
		if (slot < 0) return;
		const [p0, b1, b2, p3] = [0, 1, 2, 3].map(channel) as [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3];
		const axis = uniforms.uAxis.value;
		axis[slot * 4]!.copy(p0);
		axis[slot * 4 + 1]!.copy(p0).multiplyScalar(-5).addScaledVector(b1, 18).addScaledVector(b2, -9).addScaledVector(p3, 2).divideScalar(6);
		axis[slot * 4 + 2]!.copy(p0).multiplyScalar(2).addScaledVector(b1, -9).addScaledVector(b2, 18).addScaledVector(p3, -5).divideScalar(6);
		axis[slot * 4 + 3]!.copy(a.copy(p3).setY(0));
	};

	const ahead = new THREE.Vector3();
	const across = new THREE.Vector3();
	const update = (frame: JennaFrame | undefined) => {
		const live = frame && uniforms.uWhen.value.some((w) => w.w > 0 && frame.time - w.y < SLOT_LENGTH);
		if (!frame || !live) {
			mesh.visible = false;
			return;
		}
		ahead.set(frame.ahead.x, 0, frame.ahead.y);
		across.set(-frame.ahead.y, 0, frame.ahead.x);
		uniforms.uTime.value = frame.time;
		holder.forEach((who, s) => {
			if (who !== undefined) uniforms.uHands.value[s]!.copy(seatOf(who, frame.boat, ahead, across));
		});
		uniforms.uWindDir.value.copy(frame.wind).setY(0);
		if (uniforms.uWindDir.value.lengthSq() > 1e-6) uniforms.uWindDir.value.normalize();
		else uniforms.uWindDir.value.set(1, 0, 0);
		uniforms.uDay.value = frame.day;
		uniforms.uGain.value = frame.gain;
		uniforms.uAir.value.copy(frame.air);
		uniforms.uWater.value.copy(frame.water);
		uniforms.uResolution.value.set(window.innerWidth, window.innerHeight).multiplyScalar(pixelRatio.value);
		(mesh.material as THREE.ShaderMaterial).blending = frame.day > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending;
		mesh.visible = true;
	};

	const dispose = () => {
		scene.remove(mesh);
		(mesh.material as THREE.Material).dispose();
		geometry.dispose();
	};

	// (For the console, __jenna(): who holds each bolt, how long since it struck, and its swell's height.)
	const describe = () =>
		holder.map((who, s) => {
			const w = uniforms.uWhen.value[s]!;
			return who === undefined || w.w === 0 ? "free" : `${NAMES[who]}: ${(uniforms.uTime.value - w.y).toFixed(1)} s since it struck, swell ${uniforms.uFoot.value[s]!.w.toFixed(1)} m, ${Math.round(Math.hypot(uniforms.uFoot.value[s]!.x - uniforms.uHands.value[s]!.x, uniforms.uFoot.value[s]!.z - uniforms.uHands.value[s]!.z))} m off`;
		});

	return { ready, call, struck, update, describe, dispose };
}
