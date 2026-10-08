// Adds Gerstner wave displacement to the three.js Water material (examples/jsm/objects/Water.js, r186)
// by patching its shader source. The add-on only animates a normal map on a flat plane.
// Reference: GPU Gems 1, ch. 1, "Effective Water Simulation from Physical Models".
import * as THREE from "three";
import type { Water } from "three/addons/objects/Water.js";

// Per wave: direction x, direction z (world xz, normalised in the shader),
// share of the total steepness, wavelength in world units at waveScale 1.
const WAVES = [
	[1.0, 0.6, 0.24, 120],
	[0.7, 1.0, 0.2, 83],
	[1.0, -0.3, 0.17, 57],
	[0.3, 1.0, 0.15, 39],
	[1.0, 0.1, 0.13, 26],
	[-0.4, 1.0, 0.11, 17],
].map(([x, z, share, length]) => new THREE.Vector4(x, z, share, length));

export interface GerstnerUniforms {
	waveTime: THREE.IUniform<number>;
	// Sum of the steepness of all waves. Above 1 the crests loop over themselves.
	waveSteepness: THREE.IUniform<number>;
	// Multiplies every wavelength, and with it the wave height.
	waveScale: THREE.IUniform<number>;
	// 0..1 amount of white foam on the steepest crests.
	foam: THREE.IUniform<number>;
}

const vertexPars = /* glsl */ `
uniform float waveTime;
uniform float waveSteepness;
uniform float waveScale;
uniform vec4 waves[${WAVES.length}];
varying vec3 vWaveNormal;
varying float vCrest;

// Short waves fade out with distance, where the grid is too coarse to sample them.
vec3 gerstner( vec3 p, out vec3 normal, out float crest ) {
	vec3 offset = vec3( 0.0 );
	vec3 tangent = vec3( 1.0, 0.0, 0.0 );
	vec3 binormal = vec3( 0.0, 0.0, 1.0 );
	float distanceToEye = length( p.xz - cameraPosition.xz );
	crest = 0.0;
	for ( int i = 0; i < ${WAVES.length}; i ++ ) {
		vec2 d = normalize( waves[ i ].xy );
		float wavelength = waves[ i ].w * waveScale;
		float steepness = waves[ i ].z * waveSteepness
			* ( 1.0 - smoothstep( 0.5 * pow( wavelength, 1.5 ), pow( wavelength, 1.5 ), distanceToEye ) );
		float k = 2.0 * PI / wavelength;
		float c = sqrt( 9.8 / k );
		float f = k * ( dot( d, p.xz ) - c * waveTime );
		float a = steepness / k;
		offset += vec3( d.x * a * cos( f ), a * sin( f ), d.y * a * cos( f ) );
		tangent += vec3( - d.x * d.x * steepness * sin( f ), d.x * steepness * cos( f ), - d.x * d.y * steepness * sin( f ) );
		binormal += vec3( - d.x * d.y * steepness * sin( f ), d.y * steepness * cos( f ), - d.y * d.y * steepness * sin( f ) );
		crest += steepness * sin( f );
	}
	normal = normalize( cross( binormal, tangent ) );
	return p + offset;
}
`;

// Runs after the original flat-plane transform and overwrites its results.
const vertexMain = /* glsl */ `
	worldPosition.xyz = gerstner( worldPosition.xyz, vWaveNormal, vCrest );
	mirrorCoord = textureMatrix * worldPosition;
	mvPosition = viewMatrix * worldPosition;
	gl_Position = projectionMatrix * mvPosition;
`;

const fragmentPars = /* glsl */ `
uniform float foam;
varying vec3 vWaveNormal;
varying float vCrest;
`;

// Combines the wave normal with the normal-map detail (whiteout blend).
const fragmentNormal = /* glsl */ `
	vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );
	surfaceNormal = normalize( vec3(
		surfaceNormal.x / surfaceNormal.y + vWaveNormal.x / vWaveNormal.y,
		1.0,
		surfaceNormal.z / surfaceNormal.y + vWaveNormal.z / vWaveNormal.y
	) );
`;

// Foam takes its brightness from the reflected sky plus sunlight, so it follows the time of day.
const fragmentFoam = /* glsl */ `
	vec3 outgoingLight = albedo;
	float foamMask = foam * smoothstep( 0.35, 0.8, vCrest + noise.x * 0.3 );
	vec3 foamColor = vec3( dot( reflectionSample, vec3( 0.3, 0.59, 0.11 ) ) ) * 1.2 + sunColor * diffuseLight;
	outgoingLight = mix( outgoingLight, foamColor, foamMask );
`;

function replaceOrThrow(source: string, search: string, replacement: string) {
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
	};
	Object.assign(material.uniforms, uniforms, { waves: { value: WAVES } });

	let vertex = material.vertexShader;
	vertex = replaceOrThrow(vertex, "#include <common>", `#include <common>\n${vertexPars}`);
	vertex = replaceOrThrow(vertex, "gl_Position = projectionMatrix * mvPosition;", vertexMain);

	let fragment = material.fragmentShader;
	fragment = replaceOrThrow(fragment, "#include <common>", `#include <common>\n${fragmentPars}`);
	fragment = replaceOrThrow(fragment, "vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );", fragmentNormal);
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
