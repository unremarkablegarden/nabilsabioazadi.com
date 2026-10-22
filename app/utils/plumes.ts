// The serpents (the owner, 23 October, with the Herodias illustration, seven blue and gold serpents
// rising from one interlace: "try and make shapes like this emerge in a thermodynamically accurate
// way"; then, of a first try with stars, a braid and stiff cones: "neither found in nature in
// thermodynamics and they look goofy. Remember, we are building the rules for powerful, beautiful,
// fluid, air and water-like channeling"). They are what the sea's own heat does, made visible by the
// twelve, who trace it as it rises: water's colour for its bodies, akasha's gold for its warmest.
//
// Heat leaves a warm sea not as a steady column but as a train of thermals: the warmed air next to
// the water gathers where the shallow overturning rolls over the sea converge, and goes up in puffs,
// one after another, each a vortex ring rolling in over itself (a buoyant thermal is a vortex ring),
// up a stem that snakes as it rises. Each puff swells as it climbs, drawing the air about it in
// (Morton, Taylor and Turner: its radius grows as about a fifth of its height), and slows; where its
// buoyancy is spent against the air's stratification, at about 3.76 (F / N³)^¼ (F its buoyancy flux,
// from how much warmer the sea is and the wind over it; N how stably the air is layered, from the
// measured temperatures aloft), it flattens and spreads sideways and is lost into the air. The plumes
// stand as convection cells do, about 2.8 times the depth of the heated layer apart: three to seven
// over the three kilometres ahead. The wind leans them. With the air as warm as the sea or warmer
// nothing rises, and there are none: they are never put there.
import * as THREE from "three";
import { lines } from "./embroidery";
import { lapseAloft, thermal, type SeaConditions } from "./manawatawhi";
import { pixelRatio, ribbonShaderChunk, WEAVE_RENDER_ORDER } from "./weave";

const MOST = 7;
// Where they stand: this far ahead of the boat (m), across this breadth (m).
const AHEAD = 1600;
const BREADTH = 2600;
// Puffs going up each plume at once, and the filaments of each.
const PUFFS = 6;
const PUFF_FILAMENTS = 36;
const STEM_FILAMENTS = 40;
const SEGMENTS = 110;
// How long a puff takes from the sea to where it is spent (s).
const CLIMB = 140;

const vertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute vec2 aCell;
attribute vec4 aSeed;
uniform float uTime;
uniform vec3 uBoat;
uniform vec2 uAhead;
uniform vec3 uLean;
uniform float uCount;
// Each plume: across (m), its height (m), and its own phase.
uniform vec4 uPlume[ ${MOST} ];
uniform float uSea;
uniform float uDay;
uniform vec3 uWater;
uniform vec3 uGold;
varying float vAlpha;
varying float vEdge;
varying vec3 vTint;
${ribbonShaderChunk}

vec3 aheadDir() { return vec3( uAhead.x, 0.0, uAhead.y ); }
vec3 acrossDir() { return vec3( - uAhead.y, 0.0, uAhead.x ); }
// The stem at height fraction z (0 the sea, 1 where it is spent): snaking on several scales, slowly,
// the wind leaning it more the higher it goes.
vec3 stemAt( int p, float z ) {
	vec4 plume = uPlume[ p ];
	float h = plume.y;
	float ph = plume.w;
	vec3 root = uBoat + aheadDir() * ${AHEAD}.0 + acrossDir() * plume.x + vec3( 0.0, uSea - uBoat.y, 0.0 );
	float t = uTime;
	vec3 snake = acrossDir() * h * ( 0.07 * sin( z * 3.1 + t * 0.031 + ph ) + 0.03 * sin( z * 7.3 - t * 0.047 + ph * 2.3 ) )
		+ aheadDir() * h * ( 0.06 * sin( z * 2.6 - t * 0.027 + ph * 1.7 ) + 0.025 * sin( z * 6.1 + t * 0.052 + ph ) );
	return root + vec3( 0.0, z * h, 0.0 ) + uLean * h * z * z + snake * smoothstep( 0.0, 0.3, z );
}
// Its radius at z: a thermal's grows as about a fifth of its height.
float radiusAt( int p, float z ) { return 8.0 + 0.2 * uPlume[ p ].y * z; }

void main() {
	int p = int( aCell.x + 0.5 );
	int puff = int( aCell.y + 0.5 ) - 1;
	if ( float( p ) >= uCount ) { gl_Position = vec4( 0.0, 0.0, 2.0, 1.0 ); vAlpha = 0.0; return; }
	vec3 here;
	vec3 next;
	float shown;
	float warm;
	if ( puff < 0 ) {
		// The stem: faint wisps up the middle, each wandering about the line.
		for ( int k = 0; k < 2; k ++ ) {
			float z = min( aT + float( k ) * 0.008, 1.0 );
			float w = aSeed.y * 6.28318 + z * ( 9.0 + 6.0 * aSeed.x ) + uTime * 0.05;
			vec3 q = stemAt( p, z ) + ( acrossDir() * cos( w ) + aheadDir() * sin( w ) ) * radiusAt( p, z ) * 0.35 * aSeed.z;
			if ( k == 0 ) here = q; else next = q;
		}
		shown = 0.35 * smoothstep( 0.0, 0.1, aT ) * ( 1.0 - smoothstep( 0.7, 1.0, aT ) );
		warm = 0.15;
	} else {
		// A puff: where it is in its climb (each its own, staggered), rising fast at first and slowing.
		float age = fract( uTime / ${CLIMB}.0 + float( puff ) / ${PUFFS}.0 + uPlume[ p ].w * 0.13 );
		float z = 1.0 - pow( 1.0 - age, 1.6 );
		vec3 centre = stemAt( p, z );
		vec3 axis = normalize( stemAt( p, min( z + 0.02, 1.0 ) ) - stemAt( p, max( z - 0.02, 0.0 ) ) + vec3( 1e-4 ) );
		vec3 u = normalize( cross( axis, aheadDir() ) + vec3( 1e-4 ) );
		vec3 v = cross( axis, u );
		// Spent: it flattens and spreads sideways.
		float spent = smoothstep( 0.75, 1.0, age );
		float R = radiusAt( p, z ) * ( 0.8 + 1.6 * spent );
		float k_ = aSeed.x;
		float s = fract( k_ * 3.0 + uTime * 0.05 );
		for ( int k = 0; k < 2; k ++ ) {
			float a = ( aT + float( k ) * 0.004 ) * 6.28318;
			// Rolling in over itself, its rim wavering as a real one does.
			float roll = aSeed.y * 6.28318 + s * 12.566 + uTime * 0.6 + a * 2.0;
			vec3 radial = u * cos( a ) + v * sin( a );
			float rim = R * ( 1.0 + 0.06 * sin( 3.0 * a + uTime * 0.07 + float( puff ) ) + 0.04 * sin( 5.0 * a - uTime * 0.05 ) );
			vec3 q = centre + radial * rim + ( radial * cos( roll ) + axis * sin( roll ) * ( 1.0 - 0.7 * spent ) ) * R * ( 0.45 - 0.33 * s );
			if ( k == 0 ) here = q; else next = q;
		}
		shown = smoothstep( 0.0, 0.08, age ) * ( 1.0 - smoothstep( 0.8, 1.0, age ) ) * smoothstep( 0.0, 0.15, s ) * ( 1.0 - smoothstep( 0.8, 1.0, s ) );
		// The warmest is in a young puff's core.
		warm = ( 1.0 - s ) * ( 1.0 - age ) * step( aSeed.w, 0.4 );
	}
	float far = length( here - cameraPosition );
	shown *= exp( - far / 9000.0 );
	vAlpha = shown;
	vEdge = aSide;
	vTint = mix( uWater, uGold, warm );
	mat4 vp = projectionMatrix * viewMatrix;
	gl_Position = ribbonPosition( vp * vec4( here, 1.0 ), vp * vec4( next, 1.0 ), aSide, mix( 1.2, 1.5, uDay ) );
}
`;

const fragment = /* glsl */ `
uniform float uGain;
uniform float uDay;
uniform float uShown;
varying float vAlpha;
varying float vEdge;
varying vec3 vTint;
void main() {
	float across = abs( vEdge );
	float body = pow( max( 1.0 - across * across, 0.0 ), 1.5 );
	gl_FragColor = vec4( mix( vTint * uGain, vTint * 1.1, uDay ), body * vAlpha * uShown * mix( 0.05, 0.1, uDay ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

// What the sea's heat and the air make of them now: how strongly, how many, how high, the wind.
export function plumesFrom(c: SeaConditions) {
	const warmer = c.seaTemperature - c.airTemperature;
	const shown = THREE.MathUtils.smoothstep(warmer, 0.3, 2) * (thermal(c) > 0 ? 1 : 0);
	const wind = c.windSpeed / 3.6;
	// The heated layer's depth (m), deeper the warmer the sea; and so how many cells over the breadth.
	const depth = 120 + 60 * Math.max(0, warmer);
	const count = THREE.MathUtils.clamp(Math.round(BREADTH / (2.8 * depth)), 3, MOST);
	// Their buoyancy flux (m⁴/s³), and how stably the air is layered (N, from the lowest layer's lapse).
	const flux = 250 * Math.max(0.1, warmer) * (1 + wind / 10);
	const lapse = lapseAloft(c)[0]!;
	const n = Math.sqrt((9.81 / 290) * Math.max((9.8 - lapse) / 1000, 0.0006));
	const height = THREE.MathUtils.clamp(3.76 * (flux / n ** 3) ** 0.25, 250, 1400);
	return { shown, count, height, wind };
}

export interface PlumesFrame {
	conditions: SeaConditions;
	time: number;
	boat: THREE.Vector3;
	ahead: THREE.Vector2;
	wind: THREE.Vector3;
	sea: number;
	day: number;
	gain: number;
	// The elements' colours: water, akasha.
	water: THREE.Color;
	gold: THREE.Color;
}

export function createPlumes(scene: THREE.Scene, layer: number) {
	const cells: [number, number][] = [];
	for (let p = 0; p < MOST; p++) {
		for (let f = 0; f < STEM_FILAMENTS; f++) cells.push([p, 0]);
		for (let puff = 0; puff < PUFFS; puff++) for (let f = 0; f < PUFF_FILAMENTS; f++) cells.push([p, puff + 1]);
	}
	const geometry = lines(cells.length, SEGMENTS, (i) => cells[i]!);
	const uniforms = {
		uTime: { value: 0 },
		uBoat: { value: new THREE.Vector3() },
		uAhead: { value: new THREE.Vector2(0, -1) },
		uLean: { value: new THREE.Vector3() },
		uCount: { value: 0 },
		uPlume: { value: Array.from({ length: MOST }, () => new THREE.Vector4()) },
		uSea: { value: 0 },
		uDay: { value: 0 },
		uGain: { value: 1 },
		uShown: { value: 0 },
		uWater: { value: new THREE.Color() },
		uGold: { value: new THREE.Color() },
		uResolution: { value: new THREE.Vector2(1, 1) },
		uPixelRatio: pixelRatio,
	};
	const mesh = new THREE.Mesh(geometry, new THREE.ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
	mesh.frustumCulled = false;
	mesh.renderOrder = WEAVE_RENDER_ORDER;
	mesh.layers.set(layer);
	mesh.visible = false;
	scene.add(mesh);

	// Eased, so that a change of the figures never makes them jump.
	let shown = 0;
	let height = 600;
	const update = (frame: PlumesFrame | undefined, delta: number) => {
		const now = frame ? plumesFrom(frame.conditions) : undefined;
		const ease = Math.min(1, delta / 20);
		shown += ((now?.shown ?? 0) - shown) * ease;
		if (!frame || !now || shown < 0.002) {
			mesh.visible = false;
			return;
		}
		height += (now.height - height) * ease;
		uniforms.uTime.value = frame.time;
		uniforms.uBoat.value.copy(frame.boat);
		uniforms.uAhead.value.copy(frame.ahead);
		// The wind leans them over, up to a third of their height at the top.
		uniforms.uLean.value.copy(frame.wind).setY(0);
		if (uniforms.uLean.value.lengthSq() > 1e-6) uniforms.uLean.value.normalize();
		uniforms.uLean.value.multiplyScalar(Math.min(0.33, now.wind / 30));
		uniforms.uCount.value = now.count;
		// Spaced across the breadth, not quite evenly (cells are never a grid), each its own height.
		for (let p = 0; p < MOST; p++) {
			const along = now.count > 1 ? p / (now.count - 1) - 0.5 : 0;
			uniforms.uPlume.value[p]!.set((along + 0.06 * Math.sin(p * 4.1)) * BREADTH * 0.85, height * (0.8 + 0.2 * Math.sin(p * 2.3 + 1)), 0, p * 1.7);
		}
		uniforms.uSea.value = frame.sea;
		uniforms.uDay.value = frame.day;
		uniforms.uGain.value = frame.gain;
		uniforms.uShown.value = shown;
		uniforms.uWater.value.copy(frame.water);
		uniforms.uGold.value.copy(frame.gold);
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
