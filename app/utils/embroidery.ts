// The great calming, as it is seen (channelled-storm.ts has the why and the weather): the twelve,
// linked, embroider the storm still over seven hours. The sea and the cloud base are the cloth.
//   Siuan's four   rows of running stitches through the surface of the sea, riding the real
//                  swell: each stitch shows for a few metres above the water and goes under it
//                  for the next few, as stitches do through cloth. The rows are not ruled: each
//                  bends its own way, as a hand-worked row does. The work spreads out from the
//                  boat over the hours; the newest stitches are bright, the older ones lie quiet.
//   Moiraine's four  the same through the cloud base, four hundred metres up: stitches hanging
//                  below the cloud and passing up into it.
//   Leane's four   couching: long threads laid across the wind, high over the sea, each tied
//                  down to the water at intervals by short stitches, as a laid thread is caught
//                  down to the cloth. The nearest are laid first and fastest.
// The link: from each of the twelve a tress runs out to one knot ahead of the boat, where all
// twelve meet and are one, and out of it to the three needles at work: the edge of the sea work,
// the end of the thread Leane's four are laying, the edge of the sky work. As the hours go by they
// tire, each third at its own pace: fewer filaments in each tress, moving more slowly. When it is
// done the tresses are let go and the embroidery stays, fading slowly, while they rest.
import * as THREE from "three";
import { calmingWork } from "./channelled-storm";
import { pixelRatio, ribbonShaderChunk, WEAVE_RENDER_ORDER } from "./weave";

const SEA_ROWS = 70;
const SEA_SLOTS = 90;
const SKY_ROWS = 40;
const SKY_SLOTS = 70;
const LAID = 36;
const TIES = 24;
const FIBRES = 22;
const CLOTH = 420;
const TRAINS = 32;
// The twelve's places at the rail (the strongest's, 2, is left out: they trust them), and whose
// third each is (0 Siuan's, 1 Leane's, 2 Moiraine's), in the order of AES_SEDAI in channellers.ts.
const SLOTS = [0, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const THIRDS = [0, 1, 0, 1, 2, 2, 1, 0, 2, 1, 0, 2];

const vertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute vec2 aCell;
attribute vec4 aSeed;
uniform float uKind;
uniform float uTime;
uniform vec3 uBoat;
uniform vec2 uAhead;
uniform vec3 uWindDir;
uniform vec4 uTrains[ ${TRAINS} ];
uniform float uSteep;
uniform vec4 uGiant[ 3 ];
uniform float uSurge;
uniform float uSeaFront;
uniform float uSkyFront;
uniform float uLaid;
uniform vec3 uVigour;
uniform float uLinkGone;
uniform float uFade;
uniform vec3 uTints[ 3 ];
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;
${ribbonShaderChunk}

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

// The height of the sea, from the same trains of waves the water is drawn with (measuredSeaHeight
// and giantWaveHeight in gerstner-waves.ts).
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

// Where the edge of the sea work is, on a bearing, and of the sky work.
float seaFront( float a ) { return uSeaFront * ( 1.0 + 0.18 * sin( a * 3.0 + 1.3 ) + 0.08 * sin( a * 11.0 ) ); }
float skyFront( float a ) { return uSkyFront * ( 1.0 + 0.15 * sin( a * 2.0 + 0.4 ) + 0.07 * sin( a * 9.0 + 2.0 ) ); }

// One of Leane's laid threads, i, at s along it.
vec3 laidPoint( float i, float s ) {
	float d = 160.0 * pow( 1.075, i );
	float h = 18.0 + 25.0 * fract( i * 0.37 );
	vec3 across = normalize( cross( uWindDir, vec3( 0.0, 1.0, 0.0 ) ) + vec3( 1e-4 ) );
	vec3 p = uBoat + aheadDir() * d + across * ( s - 0.5 ) * 2.4 * d + aheadDir() * 0.08 * d * sin( s * 3.0 + i );
	// Laid on the cloth: each end comes down to the sea.
	float span = sin( 3.14159 * s );
	p.y = h * pow( span, 0.35 ) + 3.0 * span * sin( s * 9.0 + i + uTime * 0.1 );
	return p;
}
float laidSoFar() { return uLaid * ${LAID}.0; }

vec3 needle( float third ) {
	if ( third < 0.5 ) {
		float a = 0.6 * sin( uTime * 0.004 + 1.0 );
		vec3 p = uBoat + bearing( a ) * seaFront( a );
		return vec3( p.x, seaAt( p.xz ) + 2.0, p.z );
	}
	if ( third < 1.5 ) {
		float n = min( laidSoFar(), ${LAID}.0 - 0.001 );
		return laidPoint( floor( n ), fract( n ) );
	}
	float a = 0.6 * sin( uTime * 0.003 + 2.0 );
	vec3 p = uBoat + bearing( a ) * skyFront( a );
	return vec3( p.x, ${CLOTH}.0, p.z );
}

vec3 bezier( vec3 a, vec3 b, vec3 c, vec3 d, float t ) {
	float s = 1.0 - t;
	return s * s * s * a + 3.0 * s * s * t * b + 3.0 * s * t * t * c + t * t * t * d;
}

// A running stitch on row k of the cloth (its distance d0), slot j of slots: its bearing a, its
// distance d, its length L, and the way it runs, tb.
void stitchOf( float k, float j, float slots, float d0, out float a, out float d, out float L, out float tb ) {
	a = ( ( j + 0.5 + 0.6 * ( aSeed.x - 0.5 ) ) / slots - 0.5 ) * 2.0;
	d = d0 * ( 1.0 + 0.06 * sin( a * 7.0 + k * 1.7 ) + 0.03 * sin( a * 17.0 + k * 0.6 ) );
	tb = a + 1.5708 + 0.3 * sin( k * 0.9 + a * 3.0 );
	L = 0.7 * d * 2.0 / slots;
}
vec3 stitchPoint( float k, float j, float slots, float d0, float lift, float t ) {
	float a, d, L, tb;
	stitchOf( k, j, slots, d0, a, d, L, tb );
	vec3 p = uBoat + bearing( a ) * d + bearing( tb ) * ( t - 0.5 ) * L;
	p.y = lift * L * ( 0.1 * sin( 3.14159 * t ) - 0.03 );
	return p;
}

float seaRow() { return 30.0 * pow( 1.068, aCell.x ); }
float skyRow() { return 1300.0 * pow( 1.045, aCell.x ); }

// Where this line is at t.
vec3 placeAt( float t ) {
	if ( uKind < 0.5 ) {
		vec3 p = stitchPoint( aCell.x, aCell.y, ${SEA_SLOTS}.0, seaRow(), 1.0, t );
		p.y += seaAt( p.xz );
		return p;
	}
	if ( uKind < 1.5 ) return stitchPoint( aCell.x, aCell.y, ${SKY_SLOTS}.0, skyRow(), - 1.2, t ) + vec3( 0.0, ${CLOTH}.0, 0.0 );
	if ( uKind < 2.5 ) return laidPoint( aCell.x, t );
	if ( uKind < 3.5 ) {
		// The short stitches that catch a laid thread down: each a loose turn round it.
		float s = ( aCell.y + 0.5 ) / ${TIES}.0;
		vec3 on = laidPoint( aCell.x, s );
		vec3 tangent = normalize( laidPoint( aCell.x, s + 0.003 ) - laidPoint( aCell.x, s - 0.003 ) + vec3( 1e-5 ) );
		vec3 n1 = normalize( cross( tangent, vec3( 0.0, 1.0, 0.0 ) ) + vec3( 1e-4 ) );
		vec3 n2 = cross( n1, tangent );
		float a = 6.28318 * t * 1.3;
		return on + ( n1 * cos( a ) + n2 * sin( a ) ) * 1.6 + tangent * ( t - 0.5 ) * 3.0;
	}
	// The link: from a place at the rail to the knot where all twelve meet, and out to their needle.
	float third = aCell.y;
	float vigour = third < 0.5 ? uVigour.x : third < 1.5 ? uVigour.y : uVigour.z;
	vec3 seat = seatAt( aCell.x );
	vec3 knot = uBoat + aheadDir() * 70.0 + vec3( 0.0, - 4.0, 0.0 );
	vec3 to = needle( third );
	vec3 centre = t < 0.25
		? bezier( seat, seat + aheadDir() * 12.0 - vec3( 0.0, 3.0, 0.0 ), knot - aheadDir() * 15.0, knot, t / 0.25 )
		: bezier( knot, knot + aheadDir() * 25.0 + vec3( 0.0, 6.0, 0.0 ), to + vec3( 0.0, 60.0, 0.0 ) - ( to - knot ) * 0.2, to, ( t - 0.25 ) / 0.75 );
	// Gathered tight at the knot, loose between.
	float r = ( 0.3 + 3.0 * sin( 3.14159 * t ) ) * sqrt( aSeed.z ) * ( 0.15 + 0.85 * smoothstep( 0.0, 0.12, abs( t - 0.25 ) ) );
	float turn = aSeed.y * 6.28318 + uTime * 0.2 * vigour * ( aSeed.x - 0.5 ) + t * 5.0;
	return centre + ( acrossDir() * cos( turn ) + vec3( 0.0, sin( turn ), 0.0 ) ) * r;
}

void main() {
	vec3 here = placeAt( aT );
	vec3 next = placeAt( min( aT + 0.01, 1.0 ) ) + ( aT >= 0.99 ? here - placeAt( aT - 0.01 ) : vec3( 0.0 ) );
	float shown = 1.0;
	// How far this line has been made (0..1 along it; past 1 all of it), and how new it is.
	float grown = 2.0;
	float fresh = 0.0;
	vec3 tint = uTints[ 0 ];
	float width = 1.3;
	if ( uKind < 1.5 ) {
		float sea = uKind < 0.5 ? 1.0 : 0.0;
		float a, d, L, tb;
		stitchOf( aCell.x, aCell.y, sea > 0.5 ? ${SEA_SLOTS}.0 : ${SKY_SLOTS}.0, sea > 0.5 ? seaRow() : skyRow(), a, d, L, tb );
		float front = sea > 0.5 ? seaFront( a ) : skyFront( a );
		grown = ( front - d ) / L;
		fresh = exp( - max( front - d, 0.0 ) / ( 0.12 * front + 40.0 ) );
		if ( sea > 0.5 ) {
			tint = mix( uTints[ 0 ], vec3( 1.0 ), 0.5 * fresh );
			shown = 0.22 + 0.55 * fresh;
		} else {
			// (Only below the cloud: above it, it is in it.)
			tint = mix( uTints[ 2 ], vec3( 1.0 ), 0.4 * fresh );
			shown = ( 0.25 + 0.75 * fresh ) * smoothstep( ${CLOTH}.0 + 1.0, ${CLOTH}.0 - 1.0, here.y ) * exp( - d / 5000.0 );
			width = 1.5;
		}
	} else if ( uKind < 2.5 ) {
		grown = clamp( laidSoFar() - aCell.x, 0.0, 1.0 );
		fresh = exp( - max( laidSoFar() - aCell.x, 0.0 ) / 6.0 );
		tint = mix( uTints[ 1 ], vec3( 1.0 ), 0.3 * fresh );
		shown = 0.35 + 0.65 * fresh;
		width = 1.1;
	} else if ( uKind < 3.5 ) {
		// Tied once the thread has been laid past it.
		grown = ( laidSoFar() - aCell.x - ( aCell.y + 0.5 ) / ${TIES}.0 ) * 10.0;
		fresh = exp( - max( laidSoFar() - aCell.x, 0.0 ) / 6.0 );
		tint = uTints[ 1 ];
		shown = 0.25 + 0.4 * fresh;
		width = 0.8;
	} else {
		float third = aCell.y;
		float vigour = third < 0.5 ? uVigour.x : third < 1.5 ? uVigour.y : uVigour.z;
		// Tired, fewer filaments carry it, and more slowly.
		shown = step( aSeed.w, vigour ) * ( 0.55 + 0.45 * sin( aT * 18.0 - uTime * ( 0.4 + 0.9 * vigour ) + aSeed.x * 30.0 ) );
		// Let go from the needle's end back to the hands.
		shown *= smoothstep( 1.0 - uLinkGone * 1.1, 1.0 - uLinkGone * 1.1 - 0.05, aT );
		// (Not drawn right by the eye, where the twelve tresses from the rail would fill the picture.)
		shown *= smoothstep( 25.0, 110.0, length( here - cameraPosition ) );
		tint = uTints[ int( third ) ];
		width = 0.9;
	}
	// The part not yet made is not there; the cloth fades slowly once the work is done.
	float made = smoothstep( grown, grown - 0.05, aT );
	vAlpha = shown * made * ( uKind < 3.5 ? uFade : 1.0 );
	vTint = tint;
	vEdge = aSide;
	mat4 vp = projectionMatrix * viewMatrix;
	gl_Position = ribbonPosition( vp * vec4( here, 1.0 ), vp * vec4( next, 1.0 ), aSide, width );
}
`;

const fragment = /* glsl */ `
uniform float uGain;
uniform float uDay;
uniform float uOpacity;
uniform float uKind;
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;
void main() {
	float across = abs( vEdge );
	float body = exp( - across * across * 3.0 ) * ( 1.0 - smoothstep( 0.8, 1.0, across ) );
	// By day laid colour, deeper (never white on white).
	vec3 colour = mix( vTint, pow( vTint, vec3( 2.6 ) ) * 0.4, uDay );
	gl_FragColor = vec4( colour * uGain, body * vAlpha * uOpacity * mix( 1.0, uKind > 0.5 && uKind < 1.5 ? 1.2 : 3.5, uDay ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

// count lines of segments each; cell(i) gives each line's two numbers.
function lines(count: number, segments: number, cell: (i: number) => [number, number]) {
	const vertices = count * (segments + 1) * 2;
	const along = new Float32Array(vertices);
	const side = new Float32Array(vertices);
	const cells = new Float32Array(vertices * 2);
	const seeds = new Float32Array(vertices * 4);
	const index: number[] = [];
	for (let line = 0; line < count; line++) {
		const own = [Math.random(), Math.random(), Math.random(), Math.random()];
		const [a, b] = cell(line);
		for (let i = 0; i <= segments; i++) {
			for (let edge = 0; edge < 2; edge++) {
				const v = (line * (segments + 1) + i) * 2 + edge;
				along[v] = i / segments;
				side[v] = edge ? 1 : -1;
				cells[v * 2] = a;
				cells[v * 2 + 1] = b;
				seeds.set(own, v * 4);
			}
			if (i < segments) {
				const v = (line * (segments + 1) + i) * 2;
				index.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
			}
		}
	}
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(vertices * 3), 3));
	geometry.setAttribute("aT", new THREE.BufferAttribute(along, 1));
	geometry.setAttribute("aSide", new THREE.BufferAttribute(side, 1));
	geometry.setAttribute("aCell", new THREE.BufferAttribute(cells, 2));
	geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
	geometry.setIndex(index);
	return geometry;
}

export interface EmbroideryFrame {
	time: number;
	boat: THREE.Vector3;
	ahead: THREE.Vector2;
	wind: THREE.Vector3;
	// The sea's wave trains (GerstnerUniforms.waves), their steepness, and the giant swells' surge.
	trains: THREE.Vector4[];
	steepness: number;
	surge: number;
	// 0..1 how far through the hours, and the hours since it was done.
	progress: number;
	after: number;
	day: number;
	gain: number;
	// Water, air and akasha, as the channellers' colours are just now.
	tints: THREE.Color[];
}

export function createEmbroidery(scene: THREE.Scene, layer: number, giant: THREE.Vector4[]) {
	const shared = {
		uTime: { value: 0 },
		uBoat: { value: new THREE.Vector3() },
		uAhead: { value: new THREE.Vector2(0, -1) },
		uWindDir: { value: new THREE.Vector3(1, 0, 0) },
		uTrains: { value: Array.from({ length: TRAINS }, () => new THREE.Vector4(0, 0, 0, 100)) },
		uSteep: { value: 0 },
		uGiant: { value: giant },
		uSurge: { value: 0 },
		uSeaFront: { value: 0 },
		uSkyFront: { value: 0 },
		uLaid: { value: 0 },
		uVigour: { value: new THREE.Vector3(1, 1, 1) },
		uLinkGone: { value: 0 },
		uFade: { value: 1 },
		uTints: { value: [new THREE.Color(), new THREE.Color(), new THREE.Color()] },
		uGain: { value: 1 },
		uDay: { value: 0 },
		uResolution: { value: new THREE.Vector2(1, 1) },
		uPixelRatio: pixelRatio,
	};
	const parts = [
		{ geometry: lines(SEA_ROWS * SEA_SLOTS, 8, (i) => [Math.floor(i / SEA_SLOTS), i % SEA_SLOTS]), opacity: 0.5 },
		{ geometry: lines(SKY_ROWS * SKY_SLOTS, 8, (i) => [Math.floor(i / SKY_SLOTS), i % SKY_SLOTS]), opacity: 0.45 },
		{ geometry: lines(LAID, 200, (i) => [i, 0]), opacity: 0.4 },
		{ geometry: lines(LAID * TIES, 6, (i) => [Math.floor(i / TIES), i % TIES]), opacity: 0.3 },
		{ geometry: lines(SLOTS.length * FIBRES, 180, (i) => [SLOTS[i % SLOTS.length]!, THIRDS[i % SLOTS.length]!]), opacity: 0.16 },
	].map(({ geometry, opacity }, kind) => {
		const mesh = new THREE.Mesh(
			geometry,
			new THREE.ShaderMaterial({ uniforms: { ...shared, uKind: { value: kind }, uOpacity: { value: opacity } }, vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
		);
		mesh.frustumCulled = false;
		mesh.renderOrder = WEAVE_RENDER_ORDER;
		mesh.layers.set(layer);
		mesh.visible = false;
		scene.add(mesh);
		return mesh;
	});

	const update = (frame: EmbroideryFrame | undefined) => {
		// Done and faded, or not happening: nothing to draw.
		const fade = frame ? 1 - THREE.MathUtils.smoothstep(frame.after, 0.5, 3) : 0;
		for (const mesh of parts) mesh.visible = fade > 0.001;
		if (!frame || fade <= 0.001) return;
		const { smoothstep } = THREE.MathUtils;
		const p = frame.progress;
		const work = calmingWork(p);
		shared.uTime.value = frame.time;
		shared.uBoat.value.copy(frame.boat);
		shared.uAhead.value.copy(frame.ahead);
		shared.uWindDir.value.copy(frame.wind).setY(0);
		if (shared.uWindDir.value.lengthSq() > 1e-6) shared.uWindDir.value.normalize();
		else shared.uWindDir.value.set(frame.ahead.x, 0, frame.ahead.y);
		frame.trains.forEach((train, i) => i < TRAINS && shared.uTrains.value[i]!.copy(train));
		shared.uSteep.value = frame.steepness;
		shared.uSurge.value = frame.surge;
		// The work spreads out from the boat as it goes on: the sea's from a few tens of metres to
		// past the horizon, the sky's from overhead to far off, Leane's threads laid nearest first.
		shared.uSeaFront.value = 40 + 3400 * work.sea;
		shared.uSkyFront.value = 1200 + 7000 * work.sky;
		shared.uLaid.value = work.drag;
		// They tire: Leane's first (the least stamina), Siuan's last.
		shared.uVigour.value.set(1 - 0.6 * smoothstep(p, 0.3, 1), 1 - 0.7 * smoothstep(p, 0.15, 0.85), 1 - 0.6 * smoothstep(p, 0.45, 1));
		// Let go once it is done.
		shared.uLinkGone.value = smoothstep(frame.after, 0, 0.15);
		parts[4]!.visible = shared.uLinkGone.value < 0.999;
		shared.uFade.value = fade;
		frame.tints.forEach((tint, i) => shared.uTints.value[i]!.copy(tint));
		shared.uDay.value = frame.day;
		shared.uGain.value = frame.gain;
		shared.uResolution.value.set(window.innerWidth, window.innerHeight).multiplyScalar(pixelRatio.value);
		const blending = frame.day > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending;
		for (const mesh of parts) (mesh.material as THREE.ShaderMaterial).blending = blending;
	};

	const dispose = () => {
		for (const mesh of parts) {
			scene.remove(mesh);
			mesh.geometry.dispose();
			(mesh.material as THREE.Material).dispose();
		}
	};

	return { update, dispose };
}
