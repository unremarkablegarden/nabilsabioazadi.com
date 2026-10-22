// Each point along a ribbon worked out once, not twice. A ribbon is drawn as two edges, and both
// vertices of each pair worked out the whole of the same point (its place, the place a little
// ahead for its direction, its colour and light), only to be set apart by the edge at the very
// end. The vertices are the work: the threads and the guard ran to millions of them a frame, and
// it was these, not the pixels, that slowed the picture.
//
// So first the ribbon's own vertex shader is run once for each point, as a point of its own
// (PATH_PASS), and what it would have handed on is written into float textures, one texel to a
// point: the place and the place ahead as the camera sees them, the width, and every varying.
// Then the ribbon's vertices only read their point back and lay out its two edges
// (ribbonPosition), as before. Nothing is worked out differently: the same shader, the same
// values, kept exactly (32-bit floats, read texel for texel). ?ribbons=each works every vertex
// out for itself as before, for comparing.
import * as THREE from "three";
import { ribbonShaderChunk } from "./weave";

// Each point is worked out by itself unless the address asks for the old way.
export const pathsShared = () => typeof location === "undefined" || new URLSearchParams(location.search).get("ribbons") !== "each";

// Goes in the ribbon's vertex shader, before its varyings: in the pass they are handed on flat,
// and pathCell puts the point on its own texel with the two things only the ribbon itself used.
export const pathPassChunk = /* glsl */ `
#ifdef PATH_PASS
#undef varying
#define varying flat out
flat out vec4 pClip;
flat out vec4 pAhead;
flat out float pUnseen;
void pathCell( float unseen, vec4 clip, vec4 ahead ) {
	pUnseen = unseen;
	pClip = clip;
	pAhead = ahead;
	vec2 cell = ( vec2( float( gl_VertexID % PATH_WIDTH ), float( gl_VertexID / PATH_WIDTH ) ) + 0.5 ) / vec2( float( PATH_WIDTH ), float( PATH_HEIGHT ) );
	gl_Position = vec4( cell * 2.0 - 1.0, 0.0, 1.0 );
	gl_PointSize = 1.0;
}
#endif
`;

// How a ribbon's varyings are kept: their declarations, how they are packed into the textures
// after the first two (the place, and the place ahead with the width), how they are read back,
// where the "not seen" mark is kept, and what an unseen vertex is given.
export interface PathLayout {
	varyings: [string, string][];
	pack: string[];
	unpack: string;
	unseenAt: string;
	unseen: string;
}

// The threads (channellers.ts).
export const THREAD_PATH: PathLayout = {
	varyings: [["vec3", "vTint"], ["float", "vAlpha"], ["float", "vEdge"], ["float", "vSoft"], ["float", "vWhite"], ["float", "vWide"], ["float", "vShade"], ["vec3", "vSheath"]],
	pack: ["vec4( vTint, vAlpha )", "vec4( vSheath, vSoft )", "vec4( vWhite, vWide, vShade, pUnseen )"],
	unpack: "vTint = p2.rgb; vAlpha = p2.a; vSheath = p3.rgb; vSoft = p3.a; vWhite = p4.x; vWide = p4.y; vShade = p4.z; vEdge = aSide;",
	unseenAt: "p4.w",
	unseen: "vTint = vSheath = vec3( 0.0 ); vAlpha = vEdge = vSoft = vWhite = vShade = 0.0; vWide = 1.0;",
};

// The guard and the other rollers (stilling.ts).
export const GUARD_PATH: PathLayout = {
	varyings: [["float", "vAlpha"], ["float", "vEdge"]],
	pack: ["vec4( vAlpha, pUnseen, 0.0, 0.0 )"],
	unpack: "vAlpha = p2.x; vEdge = aSide;",
	unseenAt: "p2.y",
	unseen: "vAlpha = vEdge = 0.0;",
};

// The ribbon's geometry has its vertices in pairs (the two edges of one point, aSide -1 and 1,
// in that order) and `width` points to a strip. `vertexShader` is the ribbon's own, with
// pathPassChunk and pathCell in it. Gives the shader and uniforms for the ribbon's material, and
// `run`, to be called before the ribbon is drawn, with the camera it is drawn with.
export function ribbonPaths(ribbon: THREE.BufferGeometry, width: number, vertexShader: string, uniforms: Record<string, THREE.IUniform>, layout: PathLayout) {
	const points = ribbon.attributes.aSide!.count / 2;
	const height = points / width;
	const outputs = 2 + layout.pack.length;
	// One point for each pair: the first edge's values, which are the second's too (all but aSide).
	const geometry = new THREE.BufferGeometry();
	for (const [name, attribute] of Object.entries(ribbon.attributes)) {
		if (name === "aSide") continue;
		const size = attribute.itemSize;
		const from = attribute.array as Float32Array;
		const to = new Float32Array(points * size);
		for (let i = 0; i < points; i++) to.set(from.subarray(2 * i * size, 2 * i * size + size), i * size);
		geometry.setAttribute(name, new THREE.BufferAttribute(to, size));
	}
	geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 0);
	// (With no "position" among them, three.js cannot count the points for itself.)
	geometry.setDrawRange(0, points);
	// (Made when the ribbon is first drawn: a part never shown takes no memory.)
	const target = new THREE.WebGLRenderTarget(1, 1, {
		count: outputs,
		type: THREE.FloatType,
		format: THREE.RGBAFormat,
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		generateMipmaps: false,
		depthBuffer: false,
	});
	const fragmentShader = /* glsl */ `
flat in vec4 pClip;
flat in vec4 pAhead;
flat in float pUnseen;
${layout.varyings.map(([type, name]) => `flat in ${type} ${name};`).join("\n")}
${layout.pack.map((_, i) => `layout( location = ${i + 2} ) out highp vec4 pathOut${i + 2};`).join("\n")}
layout( location = 1 ) out highp vec4 pathOut1;
void main() {
	gl_FragColor = pClip;
	pathOut1 = pAhead;
${layout.pack.map((value, i) => `	pathOut${i + 2} = ${value};`).join("\n")}
}
`;
	const pass = new THREE.Points(
		geometry,
		new THREE.ShaderMaterial({
			uniforms,
			vertexShader,
			fragmentShader,
			defines: { PATH_PASS: "", PATH_WIDTH: width, PATH_HEIGHT: height },
			blending: THREE.NoBlending,
			depthTest: false,
			depthWrite: false,
		}),
	);
	pass.frustumCulled = false;
	const passScene = new THREE.Scene();
	passScene.add(pass);
	const textures: Record<string, THREE.IUniform> = {};
	for (let i = 0; i < outputs; i++) textures[`uPath${i}`] = { value: target.textures[i] };
	const fetchShader = /* glsl */ `
attribute float aSide;
${Array.from({ length: outputs }, (_, i) => `uniform highp sampler2D uPath${i};`).join("\n")}
${layout.varyings.map(([type, name]) => `varying ${type} ${name};`).join("\n")}
${ribbonShaderChunk}
void main() {
	int n = gl_VertexID / 2;
	ivec2 cell = ivec2( n % ${width}, n / ${width} );
${Array.from({ length: outputs }, (_, i) => `	vec4 p${i} = texelFetch( uPath${i}, cell, 0 );`).join("\n")}
	if ( ${layout.unseenAt} > 0.5 ) {
		gl_Position = vec4( 0.0, 0.0, 2.0, 1.0 );
		${layout.unseen}
		return;
	}
	gl_Position = ribbonPosition( p0, vec4( p1.xy, 0.0, p1.z ), aSide, p1.w );
	${layout.unpack}
}
`;
	const run = (renderer: THREE.WebGLRenderer, camera: THREE.Camera) => {
		if (target.width !== width) target.setSize(width, height);
		const was = renderer.getRenderTarget();
		renderer.setRenderTarget(target);
		renderer.render(passScene, camera);
		renderer.setRenderTarget(was);
	};
	const dispose = () => {
		target.dispose();
		geometry.dispose();
		pass.material.dispose();
	};
	return { vertexShader: fetchShader, uniforms: { ...uniforms, ...textures }, run, dispose };
}
