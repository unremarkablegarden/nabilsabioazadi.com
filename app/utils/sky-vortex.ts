// Makes the three.js Sky clouds answer the knot of the weave, by patching the shader source (Sky.js, r186).
// The cloud deck is twisted round the point above the knot, banded into rings that travel outward,
// and opened into an eye through which the knot shows. The sky around the knot glows.
import * as THREE from "three";
import type { Sky } from "three/addons/objects/Sky.js";

export interface SkyVortexUniforms {
	// Direction from the camera to the knot.
	knotDirection: THREE.IUniform<THREE.Vector3>;
	// 0..1 strength of the rings and the eye.
	vortex: THREE.IUniform<number>;
	// Radians the clouds nearest the knot have been turned. Grows while the storm builds.
	vortexTwist: THREE.IUniform<number>;
	// Phase of the rings.
	vortexSpin: THREE.IUniform<number>;
	// Light added to the sky around the knot, before tone mapping.
	vortexGlow: THREE.IUniform<THREE.Color>;
}

const pars = /* glsl */ `
uniform vec3 knotDirection;
uniform float vortex;
uniform float vortexTwist;
uniform float vortexSpin;
uniform vec3 vortexGlow;
`;

// Clouds near the knot turn further than clouds far from it, which winds them into spiral arms.
const twist = /* glsl */ `
	vec2 knotUV = knotDirection.xz / ( max( knotDirection.y, 0.05 ) * elevation );
	vec2 fromKnot = cloudUV - knotUV;
	float vortexDistance = length( fromKnot );
	float turn = vortexTwist / ( 1.0 + vortexDistance * vortexDistance / 9.0 );
	cloudUV = knotUV + mat2( cos( turn ), sin( turn ), - sin( turn ), cos( turn ) ) * fromKnot;
	cloudUV *= cloudScale;
`;

const coverage = /* glsl */ `
	float cov = cloudCoverage + ( region - 0.5 ) * 0.6;
	cov += vortex * 0.22 * sin( vortexDistance * 2.2 - vortexSpin ) * exp( - vortexDistance * 0.12 );
	cov -= vortex * 0.9 * exp( - vortexDistance * vortexDistance / 2.0 );
	cov = clamp( cov, 0.0, 1.0 );
`;

const glow = /* glsl */ `
	texColor += vortexGlow * pow( max( dot( direction, normalize( knotDirection ) ), 0.0 ), 40.0 );
	gl_FragColor = vec4( texColor, 1.0 );
`;

export function addSkyVortex(sky: Sky): SkyVortexUniforms {
	const material = sky.material;
	const uniforms: SkyVortexUniforms = {
		knotDirection: { value: new THREE.Vector3(0, 0.3, -1) },
		vortex: { value: 0 },
		vortexTwist: { value: 0 },
		vortexSpin: { value: 0 },
		vortexGlow: { value: new THREE.Color(0, 0, 0) },
	};
	Object.assign(material.uniforms, uniforms);

	let fragment = material.fragmentShader;
	fragment = replaceOrThrow(fragment, "uniform float showSunDisc;", `uniform float showSunDisc;\n${pars}`);
	fragment = replaceOrThrow(fragment, "cloudUV *= cloudScale;", twist);
	fragment = replaceOrThrow(fragment, "float cov = clamp( cloudCoverage + ( region - 0.5 ) * 0.6, 0.0, 1.0 );", coverage);
	fragment = replaceOrThrow(fragment, "gl_FragColor = vec4( texColor, 1.0 );", glow);
	material.fragmentShader = fragment;
	material.needsUpdate = true;
	return uniforms;
}
