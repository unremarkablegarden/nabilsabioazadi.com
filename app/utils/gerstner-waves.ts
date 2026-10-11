// Adds Gerstner wave displacement to the three.js Water material (examples/jsm/objects/Water.js, r186)
// by patching its shader source. The add-on only animates a normal map on a flat plane.
// Reference: GPU Gems 1, ch. 1, "Effective Water Simulation from Physical Models".
import * as THREE from "three";
import type { Water } from "three/addons/objects/Water.js";

// Small seeded random generator, so the sea looks the same on every visit.
function seededRandom(seed: number) {
	return () => {
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// Per wave: angle off the wind in radians, phase, share of the total steepness,
// wavelength in world units at waveScale 1.
// A real sea is many wave trains with unrelated lengths, headings and phases. Long swell
// runs close to the wind; short chop spreads widely around it.
const WAVE_COUNT = 12;
const WAVES = (() => {
	const random = seededRandom(7);
	const waves = Array.from({ length: WAVE_COUNT }, (_, i) => {
		const spread = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(12, 55, i / (WAVE_COUNT - 1)));
		const length = 150 * 0.8 ** i * THREE.MathUtils.lerp(0.9, 1.1, random());
		return new THREE.Vector4((random() * 2 - 1) * spread, random() * Math.PI * 2, length ** 0.4, length);
	});
	const total = waves.reduce((sum, wave) => sum + wave.z, 0);
	for (const wave of waves) wave.z /= total;
	return waves;
})();

// Giant swells raised at the height of the storm. Same layout as WAVES, but the wavelength is fixed
// and the steepness comes from the surge uniform. Few and regular, so the camera can ride them.
const GIANT_WAVES = [
	[-8, 0.0, 0.4, 420],
	[14, 2.1, 0.33, 310],
	[-22, 4.4, 0.27, 230],
].map(([angle, phase, share, length]) => new THREE.Vector4(THREE.MathUtils.degToRad(angle!), phase, share, length));

// Height of the giant swells at a point, for lifting the camera with them.
export function giantWaveHeight(x: number, z: number, time: number, surge: number) {
	let height = 0;
	for (const wave of GIANT_WAVES) {
		const k = (2 * Math.PI) / wave.w;
		const along = Math.sin(wave.x) * x - Math.cos(wave.x) * z;
		height += ((surge * wave.z) / k) * Math.sin(k * (along - Math.sqrt(9.8 / k) * time) + wave.y);
	}
	return height;
}

export interface GerstnerUniforms {
	waveTime: THREE.IUniform<number>;
	// Sum of the steepness of all waves. Above 1 the crests loop over themselves.
	waveSteepness: THREE.IUniform<number>;
	// Multiplies every wavelength, and with it the wave height.
	waveScale: THREE.IUniform<number>;
	// 0..1 amount of white foam on the steepest crests.
	foam: THREE.IUniform<number>;
	// 0..1 how unevenly the wind roughens the surface: 0 is a uniform sea, 1 has calm slicks and rough patches.
	gustiness: THREE.IUniform<number>;
	// Sum of the steepness of the giant swells. 0 leaves them out.
	surge: THREE.IUniform<number>;
	// Point on the sea directly below the knot of the weave (world x, z).
	weaveCentre: THREE.IUniform<THREE.Vector2>;
	// 0 and up: how strongly the knot shapes the sea around that point.
	weavePull: THREE.IUniform<number>;
	// 0..1 how far the gusts have stopped running with the wind and turn about that point instead.
	gustSwirl: THREE.IUniform<number>;
	// Brightness of the threads of the weave that run under the water, before tone mapping. 0 hides them.
	weaveGlow: THREE.IUniform<number>;
	// A ship making way: where she is (world x, z) and 0..1 how strong her wake is.
	shipWake: THREE.IUniform<THREE.Vector3>;
	// Fire and air channelled under the sea to one point: where (world x, z), the height of the
	// water raised there, and 0..1 how brightly it glows. burstLight is that glow before tone mapping.
	burst: THREE.IUniform<THREE.Vector4>;
	burstLight: THREE.IUniform<number>;
	// 0..1 strength of the stream of fresh water running out through the salt, and of the bands of
	// smooth water that internal waves leave on the surface.
	freshFlow: THREE.IUniform<number>;
	internalWaves: THREE.IUniform<number>;
}

const vertexPars = /* glsl */ `
uniform float waveTime;
uniform float waveSteepness;
uniform float waveScale;
uniform float gustiness;
uniform float surge;
uniform vec2 weaveCentre;
uniform float weavePull;
uniform float gustSwirl;
uniform vec4 burst;
uniform vec4 waves[${WAVES.length}];
uniform vec4 giantWaves[${GIANT_WAVES.length}];
varying vec3 vWaveNormal;
varying float vCrest;
varying float vGust;

float waveHash( vec2 p ) {
	return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 );
}

float waveNoise( vec2 p ) {
	vec2 i = floor( p );
	vec2 f = fract( p );
	f = f * f * ( 3.0 - 2.0 * f );
	return mix(
		mix( waveHash( i ), waveHash( i + vec2( 1.0, 0.0 ) ), f.x ),
		mix( waveHash( i + vec2( 0.0, 1.0 ) ), waveHash( i + vec2( 1.0, 1.0 ) ), f.x ),
		f.y
	);
}

// Wind strength 0..1 over the surface: patches stretched along the wind that drift downwind.
// The wind always blows away from the viewer (-z), towards Hawai'i.
float gustPattern( vec2 q ) {
	return 0.6 * waveNoise( q * vec2( 0.006, 0.0025 ) ) + 0.4 * waveNoise( q * vec2( 0.017, 0.007 ) + 31.0 );
}

// When the channelling takes hold of the wind, the same patches wheel round the point below
// the knot in spiral bands instead of running straight downwind.
float gustField( vec2 p ) {
	float straight = gustPattern( vec2( p.x, p.y + waveTime * 14.0 ) );
	if ( gustSwirl <= 0.0 ) return straight;
	vec2 rel = p - weaveCentre;
	float turn = waveTime * 0.15 + length( rel ) * 0.0015;
	vec2 turned = mat2( cos( turn ), sin( turn ), - sin( turn ), cos( turn ) ) * rel;
	return mix( straight, gustPattern( turned ), gustSwirl );
}

// The knot of the weave prints its turning figures on the sea below it: spiral arms that wind
// outward one way, a second set that winds the other way, and plain rings. Where they cross
// they make a shifting pattern. Under the knot itself the water is drawn up into a mound.
// One term: height in h, slope (d/dx, d/dz) in slope. arms is the number of spiral arms, signed
// by the way they turn; 0 gives rings.
void weaveRipple( vec2 rel, float r, float theta, float distanceToEye, float amplitude, float wavelength, float arms, float speed, inout float h, inout vec2 slope ) {
	float k = 2.0 * PI / wavelength;
	float a = amplitude * exp( - r / 1500.0 ) * smoothstep( 0.0, 80.0, r )
		* ( 1.0 - smoothstep( 0.5 * pow( wavelength, 1.5 ), pow( wavelength, 1.5 ), distanceToEye ) );
	float f = k * r - speed * waveTime + arms * theta;
	h += a * sin( f );
	slope += a * cos( f ) * ( k * rel / r + arms * vec2( - rel.y, rel.x ) / ( r * r ) );
}

// Short waves fade out with distance, where the grid is too coarse to sample them.
// The normal ignores the gust and warp gradients; both vary slowly enough not to show.
vec3 gerstner( vec3 p, out vec3 normal, out float crest, out float gust ) {
	vec3 offset = vec3( 0.0 );
	vec3 tangent = vec3( 1.0, 0.0, 0.0 );
	vec3 binormal = vec3( 0.0, 0.0, 1.0 );
	float distanceToEye = length( p.xz - cameraPosition.xz );
	gust = gustField( p.xz );
	// Slow sideways drift of the phase, so crests bend and break up instead of running as straight lines.
	vec2 warp = vec2(
		waveNoise( p.xz * 0.005 + vec2( 0.0, waveTime * 0.03 ) ),
		waveNoise( p.xz * 0.005 + vec2( 47.0, - waveTime * 0.02 ) )
	) - 0.5;
	crest = 0.0;
	for ( int i = 0; i < ${WAVES.length}; i ++ ) {
		vec2 d = vec2( sin( waves[ i ].x ), - cos( waves[ i ].x ) );
		float wavelength = waves[ i ].w * waveScale;
		// Gusts act on the wind-driven chop, not on the long swell.
		float windSea = 1.0 - smoothstep( 40.0, 110.0, waves[ i ].w );
		float steepness = waves[ i ].z * waveSteepness
			* mix( 1.0, mix( 0.35, 1.5, gust ), gustiness * windSea )
			* ( 1.0 - smoothstep( 0.5 * pow( wavelength, 1.5 ), pow( wavelength, 1.5 ), distanceToEye ) );
		float k = 2.0 * PI / wavelength;
		float c = sqrt( 9.8 / k );
		float f = k * ( dot( d, p.xz + warp * wavelength * 0.7 ) - c * waveTime ) + waves[ i ].y;
		float a = steepness / k;
		offset += vec3( d.x * a * cos( f ), a * sin( f ), d.y * a * cos( f ) );
		tangent += vec3( - d.x * d.x * steepness * sin( f ), d.x * steepness * cos( f ), - d.x * d.y * steepness * sin( f ) );
		binormal += vec3( - d.x * d.y * steepness * sin( f ), d.y * steepness * cos( f ), - d.y * d.y * steepness * sin( f ) );
		crest += steepness * sin( f );
	}
	for ( int i = 0; i < ${GIANT_WAVES.length}; i ++ ) {
		vec2 d = vec2( sin( giantWaves[ i ].x ), - cos( giantWaves[ i ].x ) );
		float steepness = giantWaves[ i ].z * surge;
		float k = 2.0 * PI / giantWaves[ i ].w;
		float f = k * ( dot( d, p.xz ) - sqrt( 9.8 / k ) * waveTime ) + giantWaves[ i ].y;
		float a = steepness / k;
		offset += vec3( d.x * a * cos( f ), a * sin( f ), d.y * a * cos( f ) );
		tangent += vec3( - d.x * d.x * steepness * sin( f ), d.x * steepness * cos( f ), - d.x * d.y * steepness * sin( f ) );
		binormal += vec3( - d.x * d.y * steepness * sin( f ), d.y * steepness * cos( f ), - d.y * d.y * steepness * sin( f ) );
		// Counted lightly, or the whole upper half of every giant swell turns to foam.
		crest += 0.4 * steepness * sin( f );
	}
	if ( weavePull > 0.0 ) {
		vec2 rel = p.xz - weaveCentre;
		float r = max( length( rel ), 1.0 );
		float theta = atan( rel.y, rel.x );
		float h = 0.0;
		vec2 slope = vec2( 0.0 );
		weaveRipple( rel, r, theta, distanceToEye, 6.0, 170.0, 3.0, 1.1, h, slope );
		weaveRipple( rel, r, theta, distanceToEye, 4.0, 115.0, - 2.0, 1.6, h, slope );
		weaveRipple( rel, r, theta, distanceToEye, 2.5, 75.0, 0.0, 2.3, h, slope );
		float mound = 45.0 * exp( - r * r / 32400.0 );
		h += mound;
		slope += mound * - 2.0 * rel / 32400.0;
		offset.y += weavePull * h;
		tangent.y += weavePull * slope.x;
		binormal.y += weavePull * slope.y;
		crest += weavePull * 0.035 * ( h - mound );
	}
	// Water raised over the point where fire and air are gathering below: a dome, then a column.
	if ( burst.z > 0.0 ) {
		vec2 rel = p.xz - burst.xy;
		float raised = burst.z * exp( - dot( rel, rel ) / 1600.0 );
		offset.y += raised;
		tangent.y += raised * - 2.0 * rel.x / 1600.0;
		binormal.y += raised * - 2.0 * rel.y / 1600.0;
		crest += min( 1.0, raised * 0.06 );
	}
	normal = normalize( cross( binormal, tangent ) );
	return p + offset;
}
`;

// Runs after the original flat-plane transform and overwrites its results.
const vertexMain = /* glsl */ `
	worldPosition.xyz = gerstner( worldPosition.xyz, vWaveNormal, vCrest, vGust );
	mirrorCoord = textureMatrix * worldPosition;
	mvPosition = viewMatrix * worldPosition;
	gl_Position = projectionMatrix * mvPosition;
`;

const fragmentPars = /* glsl */ `
uniform float foam;
uniform float gustiness;
uniform float weaveGlow;
uniform float waveTime;
uniform vec2 weaveCentre;
uniform vec3 shipWake;
uniform vec4 burst;
uniform float burstLight;
uniform float freshFlow;
uniform float internalWaves;
varying vec3 vWaveNormal;
varying float vCrest;
varying float vGust;
`;

// Combines the wave normal with the normal-map detail (whiteout blend).
// Ripples are stronger where the wind is, which leaves glassy slicks between the gusts.
// Two finer layers of ripple are added near the viewer, running downwind at their own speeds:
// the small, sharp facets that break the sun into glitter. They fade out with distance, where
// they would only shimmer.
//
// Two waters. A stream of fresh water runs out through the salt sea from behind the viewer
// towards the horizon, wandering from side to side. It is lighter than the salt and rides over
// it without mixing at once, so it keeps its own motion: fastest down its middle, with eddies
// turning along both edges, where the two waters meet in a line that gathers foam. Its ripples
// are carried along by that current (two copies of the ripple pattern, each sliding with the
// flow and fading into the other before it has slid too far to look right).
// And over everything, slow bands of smoother water: the mark that internal waves, travelling
// on the boundary between layers far below, leave on the surface.
const fragmentNormal = /* glsl */ `
	vec2 place = worldPosition.xz;
	float fromEye = length( eye - worldPosition.xyz );
	float bendA = 0.004 * place.y + waveTime * 0.05;
	float bendB = 0.011 * place.y - waveTime * 0.08;
	float midstream = 70.0 * sin( bendA ) + 35.0 * sin( bendB );
	float slope = 0.28 * cos( bendA ) + 0.385 * cos( bendB );
	// The stream spreads as it goes out.
	float acrossStream = ( place.x - midstream ) / ( 60.0 + 0.06 * max( 0.0, 100.0 - place.y ) );
	float fresh = freshFlow * ( 1.0 - smoothstep( 0.7, 1.0, abs( acrossStream ) ) );
	float meeting = freshFlow * exp( - pow( ( abs( acrossStream ) - 0.88 ) / 0.1, 2.0 ) );
	vec2 current = normalize( vec2( - slope, - 1.0 ) ) * ( 1.0 - min( 1.0, acrossStream * acrossStream ) ) * 16.0 * fresh;
	float whorl = place.y * 0.045 + waveTime * 0.5;
	current += vec2( cos( whorl ), sin( whorl ) * sign( acrossStream ) ) * 6.0 * meeting;
	if ( fresh + meeting > 0.01 ) {
		float beat = fract( waveTime * 0.15 );
		vec2 early = texture2D( normalSampler, place / 21.0 - current * beat * 0.12 ).xy;
		vec2 late = texture2D( normalSampler, place / 21.0 + 0.41 - current * fract( beat + 0.5 ) * 0.12 ).xy;
		noise.xy += ( mix( early, late, abs( 2.0 * beat - 1.0 ) ) - 0.5 ) * 2.2 * ( fresh + meeting ) * ( 1.0 - smoothstep( 500.0, 1500.0, fromEye ) );
	}
	float slick = smoothstep( 0.55, 0.95, 0.5 + 0.5 * sin( place.x * 0.011 + place.y * 0.021 - waveTime * 0.22 ) );
	float ripple = 1.5 * mix( 1.0, mix( 0.4, 2.0, vGust ), gustiness ) * ( 1.0 - 0.5 * internalWaves * slick );
	float nearness = 1.0 - smoothstep( 120.0, 700.0, fromEye );
	if ( nearness > 0.0 ) {
		vec2 fine = texture2D( normalSampler, worldPosition.xz / 31.0 + vec2( time / 23.0, time / 7.0 ) ).xy
			+ texture2D( normalSampler, worldPosition.xz / 11.0 + vec2( - time / 13.0, time / 4.0 ) ).xy - 1.0;
		noise.xy += fine * 0.9 * nearness;
	}
	vec3 surfaceNormal = normalize( noise.xzy * vec3( ripple, 1.0, ripple ) );
	surfaceNormal = normalize( vec3(
		surfaceNormal.x / surfaceNormal.y + vWaveNormal.x / vWaveNormal.y,
		1.0,
		surfaceNormal.z / surfaceNormal.y + vWaveNormal.z / vWaveNormal.y
	) );
`;

// Foam takes its brightness from the reflected sky plus sunlight, so it follows the time of day.
const fragmentFoam = /* glsl */ `
	vec3 outgoingLight = albedo;
	// In a storm the foam reaches further down the crests.
	float foamMask = foam * smoothstep( mix( 0.35, 0.12, foam ), mix( 0.8, 0.5, foam ), vCrest + noise.x * 0.3 );
	// Streaks of foam torn off by the gusts, stretched along the wind and drifting with it.
	float streak = texture2D( normalSampler, worldPosition.xz * vec2( 0.03, 0.004 ) + vec2( 0.0, time * 0.05 ) ).r;
	foamMask = max( foamMask, foam * foam * vGust * smoothstep( 0.55, 0.8, streak ) * 0.7 * ( 1.0 - smoothstep( 600.0, 2000.0, distance ) ) );
	vec3 foamColor = vec3( dot( reflectionSample, vec3( 0.3, 0.59, 0.11 ) ) ) * 1.2 + sunColor * diffuseLight;
	// Light passes through the thin tops of waves and comes out green-blue, most of all when the
	// viewer looks towards the light through them. The troughs, where the water is deep, stay dark.
	float thinWater = smoothstep( 0.05, 0.75, vCrest * 1.5 + 0.15 );
	float throughLight = 0.35 + 0.65 * pow( max( 0.0, dot( normalize( eyeDirection.xz ), - normalize( sunDirection.xz + 1e-4 ) ) ), 2.0 );
	outgoingLight += vec3( 0.12, 0.95, 0.78 ) * 0.5 * length( waterColor ) * sunColor.g * thinWater * throughLight * ( 1.0 - reflectance );
	outgoingLight *= mix( 0.82, 1.0, smoothstep( - 0.5, 0.2, vCrest ) );

	// A ship's wake: the churned water straight astern, and the two arms of waves she trails,
	// which stand at about 19 degrees to her track whatever her speed (Kelvin's wake).
	if ( shipWake.z > 0.0 ) {
		vec2 astern = vec2( shipWake.x - worldPosition.x, abs( worldPosition.z - shipWake.y ) );
		if ( astern.x > 0.0 ) {
			float churn = exp( - pow( astern.y / ( 5.0 + astern.x * 0.04 ), 2.0 ) ) * exp( - astern.x / 170.0 );
			float arms = exp( - pow( ( astern.y - astern.x * 0.354 ) / ( 3.0 + astern.x * 0.05 ), 2.0 ) ) * exp( - astern.x / 260.0 )
				* ( 0.6 + 0.4 * sin( astern.x * 0.5 - waveTime * 3.0 ) );
			foamMask = max( foamMask, shipWake.z * max( churn, arms * 0.8 ) * ( 0.7 + 0.3 * noise.x ) );
		}
	}
	// Fresh water is clearer and greener than salt, and shows what is under it more.
	outgoingLight = mix( outgoingLight, outgoingLight * vec3( 0.8, 1.2, 1.0 ) + vec3( 0.04, 0.2, 0.14 ) * length( waterColor ) * sunColor.g, fresh * 0.7 * ( 1.0 - reflectance ) );
	// Where the two waters meet, a broken line of foam.
	foamMask = max( foamMask, meeting * 0.75 * smoothstep( 0.3, 0.7, 0.5 + 0.5 * noise.x + 0.2 * sin( worldPosition.z * 0.3 ) ) );

	// Fire and air gathering under the sea: the water boils white over it.
	vec2 fromBurst = worldPosition.xz - burst.xy;
	float awayFromBurst = length( fromBurst );
	float heart = exp( - awayFromBurst * awayFromBurst / 1800.0 );
	foamMask = max( foamMask, burst.w * heart * ( 0.55 + 0.45 * noise.x ) );
	outgoingLight = mix( outgoingLight, foamColor, foamMask );
	// And glows from below: orange at the heart, with threads of fire and of air (white) running
	// in to it under the surface from all round, pulsing inward.
	if ( burstLight > 0.0 ) {
		float runners = pow( abs( sin( atan( fromBurst.y, fromBurst.x ) * 4.5 + sin( awayFromBurst * 0.03 ) ) ), 14.0 )
			* exp( - awayFromBurst / 160.0 ) * ( 0.5 + 0.5 * sin( awayFromBurst * 0.12 + waveTime * 7.0 ) );
		outgoingLight += ( vec3( 1.0, 0.45, 0.12 ) * ( heart * 1.6 + runners * 0.8 ) + vec3( 0.85, 0.95, 1.0 ) * runners * 0.5 ) * burstLight;
	}

	// The weave under the sea: threads of light fanning out from below the knot and running under
	// the viewer, seen through the moving surface, with pulses that travel out along them.
	if ( weaveGlow > 0.0 ) {
		// Looking through a tilted surface shifts what is seen below it.
		vec2 under = worldPosition.xz + surfaceNormal.xz * 16.0 - weaveCentre;
		float radius = max( length( under ), 1.0 );
		float bearing = atan( under.y, under.x );
		float threads = 0.0;
		for ( int i = 0; i < 4; i ++ ) {
			float n = float( i );
			float count = 9.0 + n * 7.0;
			// Each thread wanders as it goes out, the finer sets more than the heavier.
			float across = bearing * count / 6.28319 + 0.3 * ( 1.0 + n ) * sin( radius * 0.004 * ( 1.0 + n ) + n * 1.7 ) + n * 0.37;
			float offLine = abs( fract( across ) - 0.5 ) * 6.28319 / count * radius;
			// Thin close by; widened with distance so far threads do not break up into dots.
			float thickness = ( 0.7 + 0.5 * n ) * ( 1.0 + distance * 0.012 );
			float pulse = 0.3 + 0.7 * pow( 0.5 + 0.5 * sin( radius * 0.02 * ( 1.0 + 0.3 * n ) - waveTime * ( 2.0 + n * 0.7 ) + n ), 6.0 );
			threads += exp( - offLine * offLine / ( thickness * thickness ) ) * pulse / ( 1.0 + distance * 0.004 );
		}
		// Light from below comes through where the surface is not acting as a mirror, and not through foam.
		outgoingLight += vec3( 0.78, 0.95, 1.0 ) * threads * weaveGlow * ( 1.0 - reflectance ) * ( 1.0 - foamMask );
	}
`;

export function replaceOrThrow(source: string, search: string, replacement: string) {
	if (!source.includes(search)) throw new Error(`Water shader patch: "${search}" not found`);
	return source.replace(search, replacement);
}

export function addGerstnerWaves(water: Water): GerstnerUniforms {
	const material = water.material;
	const uniforms: GerstnerUniforms = {
		waveTime: { value: 0 },
		waveSteepness: { value: 0.2 },
		waveScale: { value: 1 },
		foam: { value: 0 },
		gustiness: { value: 0.8 },
		surge: { value: 0 },
		weaveCentre: { value: new THREE.Vector2() },
		weavePull: { value: 0 },
		gustSwirl: { value: 0 },
		weaveGlow: { value: 0 },
		shipWake: { value: new THREE.Vector3() },
		burst: { value: new THREE.Vector4() },
		burstLight: { value: 0 },
		freshFlow: { value: 1 },
		internalWaves: { value: 0.6 },
	};
	Object.assign(material.uniforms, uniforms, { waves: { value: WAVES }, giantWaves: { value: GIANT_WAVES } });

	let vertex = material.vertexShader;
	vertex = replaceOrThrow(vertex, "#include <common>", `#include <common>\n${vertexPars}`);
	vertex = replaceOrThrow(vertex, "gl_Position = projectionMatrix * mvPosition;", vertexMain);

	let fragment = material.fragmentShader;
	fragment = replaceOrThrow(fragment, "#include <common>", `#include <common>\n${fragmentPars}`);
	fragment = replaceOrThrow(fragment, "vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );", fragmentNormal);
	// The stock single highlight is replaced by a broad one and a tight, bright one: sheen and glitter.
	fragment = replaceOrThrow(
		fragment,
		"sunLight( surfaceNormal, eyeDirection, 100.0, 2.0, 0.5, diffuseLight, specularLight );",
		"sunLight( surfaceNormal, eyeDirection, 60.0, 1.2, 0.5, diffuseLight, specularLight );\n\tsunLight( surfaceNormal, eyeDirection, 420.0, 5.0, 0.0, diffuseLight, specularLight );",
	);
	fragment = replaceOrThrow(fragment, "vec3 outgoingLight = albedo;", fragmentFoam);

	material.vertexShader = vertex;
	material.fragmentShader = fragment;
	material.needsUpdate = true;
	return uniforms;
}

// Plane in the xy plane (rotate -90° about x for water) with vertices packed towards the centre:
// a vertex at grid coordinate u in -1..1 is placed at radius * sign(u) * |u|^3.
// Gives sub-unit spacing in front of the camera and a single mesh out to the horizon.
export function createFocusedPlane(radius: number, segments: number) {
	const geometry = new THREE.PlaneGeometry(2, 2, segments, segments);
	const position = geometry.attributes.position!;
	const warp = (u: number) => radius * Math.sign(u) * Math.abs(u) ** 3;
	for (let i = 0; i < position.count; i++) {
		position.setXY(i, warp(position.getX(i)), warp(position.getY(i)));
	}
	geometry.computeBoundingSphere();
	return geometry;
}
