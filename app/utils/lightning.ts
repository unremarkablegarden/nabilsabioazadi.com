// Lightning as real bolts in the 3D scene, so they strike a place on the sea, pass behind wave
// crests and are mirrored in the water. A real channel is tortuous, not a wobbling line: short
// straight runs with a sharp kink between them, each a few tens of degrees, wandering about its
// way down. So each bolt is walked step by step, keeping its heading for a while and then
// turning. Branches leave it mostly high up, heading down and outward, and die out in mid-air;
// its top is lost in the cloud base. Each is drawn as a fine white-hot core inside a soft blue
// glow, the light scattered by the rain and cloud round it. Where it leaves the cloud, the cloud
// base is lit from inside in a broad, flattened glow, and where it meets the sea there is a small
// fierce point of light, which the water mirrors.
//
// A flash unfolds the way a real one does, slowed only where the eye could not otherwise follow:
//   1. a dim leader works its way down from the cloud in steps, branching as it goes;
//   2. when it touches the sea the return stroke lights the whole channel at once, and the
//      branches, which carry no more current, go dark almost immediately;
//   3. one to three further strokes run down the same channel, each weaker than the last;
//   4. the channel cools and its glow fades, losing its blue as it does.
// The light is that of nitrogen and oxygen at tens of thousands of degrees: blue-white. Water
// vapour adds the red of hydrogen, so in warm wet air the bolt leans towards pink, and seen
// through fog it yellows, as anything bright and distant does.
import * as THREE from "three";

// Seconds the leader takes to reach the sea. Really a few hundredths; stretched to be seen.
export const LIGHTNING_LEADER_TIME = 0.14;

const MAIN_SEGMENTS = 128;
const BRANCH_SEGMENTS = 32;
const BRANCHES = 14;

const vertexShader = /* glsl */ `
attribute vec3 aNext;
attribute float aSide;
attribute float aWidth;
attribute float aBrightness;
// How far from cloud (0) to sea (1) this point is reached by the leader, and 1 for a branch.
attribute float aAlong;
attribute float aBranch;
uniform float uLeader;
uniform float uMain;
uniform float uBranches;
uniform float uWidth;
uniform vec3 uTint;
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;
${ribbonShaderChunk}

void main() {
	mat4 viewProjection = projectionMatrix * viewMatrix;
	gl_Position = ribbonPosition( viewProjection * vec4( position, 1.0 ), viewProjection * vec4( aNext, 1.0 ), aSide, aWidth * uWidth );
	// Only as much of the channel as the leader has reached, with its tip the brightest part.
	float tip = uLeader < 1.0 ? smoothstep( uLeader - 0.06, uLeader, aAlong ) : 0.0;
	vTint = uTint;
	vAlpha = aBrightness * step( aAlong, uLeader ) * ( mix( uMain, uBranches, aBranch ) + 0.5 * tip );
	vEdge = aSide;
}
`;

// The core is a small part of the ribbon's width; the rest is glow.
const GLOW_WIDTH = 3;
const fragmentShader = /* glsl */ `
uniform float uGain;
uniform float uOpacity;
uniform vec3 uBase;
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;

void main() {
	float across = abs( vEdge );
	float core = 1.0 - smoothstep( 0.08, 0.2, across );
	float glow = 0.12 * exp( - across * across * 10.0 ) * ( 1.0 - smoothstep( 0.7, 1.0, across ) );
	gl_FragColor = vec4( mix( vTint, uBase, core ) * uGain, ( core + glow ) * vAlpha * uOpacity );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

// A tortuous path from one point to another with the given number of segments. It keeps its
// heading for a step or two, then kinks; leaning only a little towards where it is going. The
// end it reaches is then sheared gently onto the true end, spread along the whole length.
function tortuousPath(from: THREE.Vector3, to: THREE.Vector3, segments: number, kink = 0.9) {
	const path = [from.clone()];
	const step = from.distanceTo(to) / segments;
	const heading = to.clone().sub(from).normalize();
	const toward = new THREE.Vector3();
	const turn = new THREE.Vector3();
	const at = from.clone();
	for (let i = 1; i <= segments; i++) {
		if (Math.random() < 0.4) heading.add(turn.randomDirection().multiplyScalar(kink * Math.random())).normalize();
		heading.lerp(toward.copy(to).sub(at).normalize(), 0.035).normalize();
		at.addScaledVector(heading, step * (0.5 + Math.random()));
		path.push(at.clone());
	}
	const miss = to.clone().sub(at);
	path.forEach((point, i) => point.addScaledVector(miss, i / segments));
	return path;
}

export function createLightning(scene: THREE.Scene) {
	const points = MAIN_SEGMENTS + 1 + BRANCHES * (BRANCH_SEGMENTS + 1);
	const position = new THREE.BufferAttribute(new Float32Array(points * 2 * 3), 3);
	const next = new THREE.BufferAttribute(new Float32Array(points * 2 * 3), 3);
	const width = new THREE.BufferAttribute(new Float32Array(points * 2), 1);
	const brightness = new THREE.BufferAttribute(new Float32Array(points * 2), 1);
	const along = new THREE.BufferAttribute(new Float32Array(points * 2), 1);
	const isBranch = new Float32Array(points * 2).fill(1);
	isBranch.fill(0, 0, (MAIN_SEGMENTS + 1) * 2);
	const side = new Float32Array(points * 2);
	for (let i = 0; i < points * 2; i++) side[i] = i % 2 ? 1 : -1;
	// The main bolt and its branches are separate strips: no triangles join one to the next.
	const indices: number[] = [];
	const strip = (first: number, segments: number) => {
		for (let i = 0; i < segments; i++) {
			const a = (first + i) * 2;
			indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
		}
	};
	strip(0, MAIN_SEGMENTS);
	for (let branch = 0; branch < BRANCHES; branch++) strip(MAIN_SEGMENTS + 1 + branch * (BRANCH_SEGMENTS + 1), BRANCH_SEGMENTS);

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute("position", position);
	geometry.setAttribute("aNext", next);
	geometry.setAttribute("aWidth", width);
	geometry.setAttribute("aBrightness", brightness);
	geometry.setAttribute("aAlong", along);
	geometry.setAttribute("aBranch", new THREE.BufferAttribute(isBranch, 1));
	geometry.setAttribute("aSide", new THREE.BufferAttribute(side, 1));
	geometry.setIndex(indices);

	const uniforms = {
		uGain: { value: 1 },
		uOpacity: { value: 1 },
		uBase: { value: new THREE.Color(0xffffff) },
		uLeader: { value: 0 },
		uMain: { value: 0 },
		uBranches: { value: 0 },
		uWidth: { value: 1 },
		uTint: { value: new THREE.Color() },
		uPixelRatio: pixelRatio,
		uResolution: { value: new THREE.Vector2(1, 1) },
	};
	const mesh = new THREE.Mesh(
		geometry,
		new THREE.ShaderMaterial({
			uniforms,
			vertexShader,
			fragmentShader,
			transparent: true,
			depthWrite: false,
			side: THREE.DoubleSide,
			blending: THREE.AdditiveBlending,
		}),
	);
	mesh.frustumCulled = false;
	mesh.renderOrder = WEAVE_RENDER_ORDER;
	mesh.visible = false;
	scene.add(mesh);

	// The glow in the cloud base and the point where the bolt meets the sea.
	const glowTexture = (() => {
		const canvas = document.createElement("canvas");
		canvas.width = canvas.height = 64;
		const context = canvas.getContext("2d")!;
		const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
		gradient.addColorStop(0, "rgba(255,255,255,1)");
		gradient.addColorStop(0.35, "rgba(255,255,255,0.35)");
		gradient.addColorStop(1, "rgba(255,255,255,0)");
		context.fillStyle = gradient;
		context.fillRect(0, 0, 64, 64);
		return new THREE.CanvasTexture(canvas);
	})();
	const glow = (colour: number) => {
		const sprite = new THREE.Sprite(
			new THREE.SpriteMaterial({ map: glowTexture, color: colour, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }),
		);
		sprite.renderOrder = WEAVE_RENDER_ORDER;
		sprite.visible = false;
		scene.add(sprite);
		return sprite;
	};
	// Cloud lit from inside goes violet-pink; the point at the sea is white-hot.
	const cloudGlow = glow(0xd8b8f0);
	const footGlow = glow(0xf4f6ff);
	let glowStrength = 1;

	// Writes one path into the buffers from point index `first`. reached(i) says when the leader
	// gets to point i. A branch thins and dims towards its end.
	const write = (path: THREE.Vector3[], first: number, thickness: number, fades: boolean, strength: number, reached: (fraction: number) => number) => {
		path.forEach((point, i) => {
			const ahead = path[Math.min(i + 1, path.length - 1)]!;
			const fraction = i / (path.length - 1);
			const remaining = fades ? 1 - fraction : 1;
			for (let edge = 0; edge < 2; edge++) {
				const vertex = (first + i) * 2 + edge;
				position.setXYZ(vertex, point.x, point.y, point.z);
				next.setXYZ(vertex, ahead.x, ahead.y, ahead.z);
				width.setX(vertex, GLOW_WIDTH * thickness * (0.4 + 0.6 * remaining));
				// (The main channel's top is lost in the cloud base.)
				brightness.setX(vertex, strength * (fades ? 0.6 * remaining : Math.min(1, fraction / 0.08)));
				along.setX(vertex, reached(fraction));
			}
		});
	};

	let main: THREE.Vector3[] = [];
	let struckAt = -Infinity;
	// When each stroke after the leader happens, in seconds after the first, and how strong it is.
	let strokes: { at: number; strength: number }[] = [];

	// from is the upper end and to the lower. A rising bolt starts at the lower end: the weave
	// under the sea breaking out upward. Otherwise the leader comes down from above. strength
	// is less for a distant bolt, seen through more rain.
	const strike = (from: THREE.Vector3, to: THREE.Vector3, time: number, rising = false, strength = 1) => {
		main = tortuousPath(from, to, MAIN_SEGMENTS);
		glowStrength = rising ? 0 : strength;
		// Where it comes out of the cloud: a little below the top, which is lost in it.
		cloudGlow.position.copy(main[Math.round(MAIN_SEGMENTS * 0.04)]!);
		const distance = Math.max(300, from.length());
		cloudGlow.scale.set(0.45 * distance, 0.1 * distance, 1);
		// (Raised a little, or every crest between hides it.)
		footGlow.position.copy(to).setY(15);
		footGlow.scale.setScalar(Math.max(40, 0.06 * to.length()));
		write(main, 0, 0.9 + 1.5 * strength, false, strength, (fraction) => (rising ? 1 - fraction : fraction));
		// Branches fork the way the leader is travelling.
		const down = to.clone().sub(from).multiplyScalar(rising ? -1 : 1);
		for (let branch = 0; branch < BRANCHES; branch++) {
			// Mostly from the upper part, and shorter the lower down they leave.
			const rootIndex = 6 + Math.floor(Math.random() ** 1.6 * (MAIN_SEGMENTS * 0.8));
			const root = main[rootIndex]!;
			const rootFraction = rootIndex / MAIN_SEGMENTS;
			// Leaves the main bolt at an angle, heading down and outward.
			const length = (0.08 + Math.random() * 0.3) * (1 - 0.6 * rootFraction);
			const reach = down.clone().multiplyScalar(length);
			reach.add(new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize().multiplyScalar(reach.length() * (0.5 + 0.6 * Math.random())));
			const start = rising ? 1 - rootFraction : rootFraction;
			write(tortuousPath(root, root.clone().add(reach), BRANCH_SEGMENTS, 1.1), MAIN_SEGMENTS + 1 + branch * (BRANCH_SEGMENTS + 1), 0.4 + 0.8 * strength * (1 - rootFraction), true, strength, (fraction) =>
				Math.min(1, start + fraction * length),
			);
		}
		for (const attribute of [position, next, width, brightness, along]) attribute.needsUpdate = true;

		struckAt = time;
		strokes = [{ at: 0, strength: 1 }];
		// Three to five strokes in all is usual.
		const further = 1 + Math.floor(Math.random() * 4);
		for (let i = 0; i < further; i++) {
			strokes.push({ at: strokes[i]!.at + 0.05 + Math.random() * 0.04, strength: 0.7 * 0.72 ** i });
		}
	};

	const hot = new THREE.Color();
	const cooled = new THREE.Color(0xe0b0d8);
	const blueWhite = new THREE.Color(0xc4dcff);
	const hydrogenPink = new THREE.Color(0xffc8e6);
	const hazeYellow = new THREE.Color(0xffedc4);

	// Call every frame. vapour is the water vapour in the air (1 = a mild humid day) and fog is 0..1;
	// gain undoes the exposure. Returns 0..1 how brightly the channel is lit, which is also how hard
	// it is heating the air.
	const update = (time: number, gain: number, vapour: number, fog: number) => {
		const sinceLeader = time - struckAt;
		const sinceReturn = sinceLeader - LIGHTNING_LEADER_TIME;
		mesh.visible = sinceLeader >= 0 && sinceReturn < 0.7;
		cloudGlow.visible = footGlow.visible = mesh.visible && sinceReturn >= 0 && glowStrength > 0;
		if (!mesh.visible) return 0;
		uniforms.uGain.value = gain;
		uniforms.uResolution.value.set(window.innerWidth, window.innerHeight).multiplyScalar(uniforms.uPixelRatio.value);
		hot.copy(blueWhite).lerp(hydrogenPink, Math.min(0.5, 0.25 * vapour)).lerp(hazeYellow, 0.35 * fog);

		if (sinceReturn < 0) {
			// The leader comes down in about twenty jumps, not smoothly.
			uniforms.uLeader.value = Math.ceil((sinceLeader / LIGHTNING_LEADER_TIME) * 20) / 20;
			uniforms.uMain.value = 0.2;
			uniforms.uBranches.value = 0.2;
			uniforms.uWidth.value = 0.6;
			uniforms.uTint.value.copy(hot);
			return 0;
		}
		let current = 0;
		let sinceLast = sinceReturn;
		for (const stroke of strokes) {
			if (sinceReturn < stroke.at) break;
			sinceLast = sinceReturn - stroke.at;
			current += stroke.strength * Math.exp(-sinceLast / 0.035);
		}
		const afterglow = 0.12 * Math.exp(-sinceReturn / 0.15);
		uniforms.uLeader.value = 1;
		uniforms.uMain.value = current + afterglow;
		uniforms.uBranches.value = 0.7 * Math.exp(-sinceReturn / 0.06);
		uniforms.uWidth.value = 0.7 + 0.5 * Math.min(1, current);
		uniforms.uTint.value.copy(hot).lerp(cooled, Math.min(1, sinceLast / 0.12));
		// The cloud stays lit a little after the channel has gone dim; the foot only while current flows.
		cloudGlow.material.opacity = glowStrength * Math.min(1, 0.6 * current + 2.5 * afterglow);
		footGlow.material.opacity = glowStrength * Math.min(1, current);
		return Math.min(1, current + afterglow);
	};

	// Point i of `count` evenly spaced along the main channel, from cloud to sea.
	const pathPoint = (i: number, count: number) => main[Math.round((i / (count - 1)) * MAIN_SEGMENTS)];

	return { strike, update, pathPoint };
}
