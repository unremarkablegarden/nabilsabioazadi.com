// The colour grade (the owner, 23 October: "research the best colour-grading possible for ocean scenes
// using filmic and scientific research"). The picture is tone mapped with AgX, not ACES: ACES skews
// bright saturated blues towards purple and water towards cyan (ACES Central's own corrective LMTs;
// three.js forum's tone-mapping overview), which in a picture that is nearly all sea and sky is the
// worst case; AgX rolls bright colour smoothly towards white without turning its hue, and a small
// saturation and contrast restore after it is the usual practice (a CDL-like slope and saturation).
// This pass runs in linear light before the tone mapping, and by the hour:
//   day          saturation 1.15, contrast 1.08 about middle grey (0.18);
//   golden hour  a little warmth, +0.06;
//   blue hour    a little cooler, −0.04: the twilight sky is blue chiefly by the ozone's Chappuis
//                absorption of yellow-orange (Hulburt 1953), which the sky model leaves out, so it is
//                kept blue rather than let go grey;
//   night        the eye's own night (the Purkinje shift; Jensen et al. 2000, Kirk and O'Brien
//                2011): colour fades and what is left leans blue, but under a moon the eye is
//                mesopic, not blind to colour, so it is never wholly grey (and the weaves' faint
//                element colours, the owner's, still show);
//   storm        less saturated, a little cooler.
// Highlights lose some saturation as they brighten, so sun glitter goes to a warm white and not to a
// hue. The sea's own blue is never rotated: no teal-and-orange.
import * as THREE from "three";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

const shader = {
	uniforms: {
		tDiffuse: { value: null as THREE.Texture | null },
		// How much of daylight vision there is (1 day, about 0.45 under a moon).
		uPhotopic: { value: 1 },
		uSaturation: { value: 1 },
		uContrast: { value: 1 },
		// Warmer (+) or cooler (−).
		uWarmth: { value: 0 },
		// The exposure the tone mapping will apply, to know what will read as bright.
		uExposure: { value: 1 },
	},
	vertexShader: /* glsl */ `
varying vec2 vUv;
void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`,
	fragmentShader: /* glsl */ `
uniform sampler2D tDiffuse;
uniform float uPhotopic;
uniform float uSaturation;
uniform float uContrast;
uniform float uWarmth;
uniform float uExposure;
varying vec2 vUv;
void main() {
	vec4 texel = texture2D( tDiffuse, vUv );
	vec3 c = max( texel.rgb, vec3( 0.0 ) );
	float luma = dot( c, vec3( 0.2126, 0.7152, 0.0722 ) );
	// Night vision: colour fades towards a blue-leaning grey.
	c = mix( vec3( luma ) * vec3( 0.8, 0.9, 1.15 ), c, uPhotopic );
	// Saturation, less in the highlights (as the tone mapping will see them).
	float bright = luma * uExposure;
	float saturation = uSaturation * ( 1.0 - 0.5 * smoothstep( 0.6, 4.0, bright ) );
	luma = dot( c, vec3( 0.2126, 0.7152, 0.0722 ) );
	c = mix( vec3( luma ), c, saturation );
	// Contrast about middle grey, in exposure terms.
	vec3 e = c * uExposure;
	e = 0.18 * pow( max( e, vec3( 1e-6 ) ) / 0.18, vec3( uContrast ) );
	c = e / max( uExposure, 1e-6 );
	// Warmth.
	c *= vec3( 1.0 + uWarmth, 1.0, 1.0 - uWarmth );
	gl_FragColor = vec4( c, texel.a );
}
`,
};

export interface GradeFrame {
	// 0..1 how far it is day (the sun up), and how far night (the sun well down).
	day: number;
	night: number;
	// The sun's height (degrees), for the golden and blue hours.
	sunElevation: number;
	// 0..1 how stormy.
	storm: number;
	exposure: number;
}

export function createGradePass() {
	const pass = new ShaderPass(shader);
	const u = pass.uniforms as unknown as typeof shader.uniforms;
	const { smoothstep, lerp } = THREE.MathUtils;
	const update = ({ day, night, sunElevation, storm, exposure }: GradeFrame) => {
		const golden = smoothstep(sunElevation, -1, 3) * (1 - smoothstep(sunElevation, 6, 12));
		const blue = smoothstep(sunElevation, -10, -4) * (1 - smoothstep(sunElevation, -2, 1));
		u.uPhotopic.value = lerp(1, 0.45, night) * (1 - 0.3 * blue * (1 - night));
		u.uSaturation.value = lerp(lerp(1.15, 0.95, night), 0.7, storm * 0.6) * (1 - 0.05 * blue);
		u.uContrast.value = lerp(1.08, 1.1, night) * lerp(1, 0.95, storm);
		u.uWarmth.value = 0.06 * golden * day - 0.04 * blue - 0.03 * storm;
		u.uExposure.value = exposure;
	};
	return { pass, update };
}
