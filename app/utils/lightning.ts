// Lightning as real bolts in the 3D scene, so they strike a place on the sea, pass behind wave
// crests and are mirrored in the water. Each bolt is a jagged path made by midpoint displacement:
// start with a straight line, push its middle sideways by a random amount, then do the same to
// each half with half the push, and so on. Branches are shorter bolts that leave the main one
// and die out in mid-air. Drawn with the same hard-edged ribbons as the weave.
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
const BRANCHES = 6;

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

// A jagged path between two points, with 2^levels segments.
function jaggedPath(from: THREE.Vector3, to: THREE.Vector3, levels: number, roughness: number) {
	let path = [from.clone(), to.clone()];
	let push = from.distanceTo(to) * roughness;
	const offset = new THREE.Vector3();
	for (let level = 0; level < levels; level++) {
		const next: THREE.Vector3[] = [];
		for (let i = 0; i < path.length - 1; i++) {
			offset.randomDirection().multiplyScalar(push * Math.random());
			next.push(path[i]!, path[i]!.clone().lerp(path[i + 1]!, 0.5).add(offset));
		}
		next.push(path[path.length - 1]!);
		path = next;
		push *= 0.5;
	}
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
		uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
		uResolution: { value: new THREE.Vector2(1, 1) },
	};
	const mesh = new THREE.Mesh(
		geometry,
		new THREE.ShaderMaterial({
			uniforms,
			vertexShader,
			fragmentShader: threadFragmentShader,
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

	// Writes one path into the buffers from point index `first`. reached(i) says when the leader
	// gets to point i. A branch thins and dims towards its end.
	const write = (path: THREE.Vector3[], first: number, thickness: number, fades: boolean, reached: (fraction: number) => number) => {
		path.forEach((point, i) => {
			const ahead = path[Math.min(i + 1, path.length - 1)]!;
			const fraction = i / (path.length - 1);
			const remaining = fades ? 1 - fraction : 1;
			for (let edge = 0; edge < 2; edge++) {
				const vertex = (first + i) * 2 + edge;
				position.setXYZ(vertex, point.x, point.y, point.z);
				next.setXYZ(vertex, ahead.x, ahead.y, ahead.z);
				width.setX(vertex, thickness * (0.4 + 0.6 * remaining));
				brightness.setX(vertex, fades ? 0.6 * remaining : 1);
				along.setX(vertex, reached(fraction));
			}
		});
	};

	let main: THREE.Vector3[] = [];
	let struckAt = -Infinity;
	// When each stroke after the leader happens, in seconds after the first, and how strong it is.
	let strokes: { at: number; strength: number }[] = [];

	// from is the upper end and to the lower. A rising bolt starts at the lower end: the weave
	// under the sea breaking out upward. Otherwise the leader comes down from above.
	const strike = (from: THREE.Vector3, to: THREE.Vector3, time: number, rising = false) => {
		main = jaggedPath(from, to, 7, 0.16);
		write(main, 0, 3.4, false, (fraction) => (rising ? 1 - fraction : fraction));
		// Branches fork the way the leader is travelling.
		const down = to.clone().sub(from).multiplyScalar(rising ? -1 : 1);
		for (let branch = 0; branch < BRANCHES; branch++) {
			const rootIndex = 8 + Math.floor(Math.random() * (MAIN_SEGMENTS - 30));
			const root = main[rootIndex]!;
			// Leaves the main bolt at an angle, still heading roughly the same way.
			const length = 0.15 + Math.random() * 0.3;
			const reach = down.clone().multiplyScalar(length);
			reach.add(new THREE.Vector3().randomDirection().multiplyScalar(reach.length() * 0.8));
			const start = rising ? 1 - rootIndex / MAIN_SEGMENTS : rootIndex / MAIN_SEGMENTS;
			write(jaggedPath(root, root.clone().add(reach), 5, 0.2), MAIN_SEGMENTS + 1 + branch * (BRANCH_SEGMENTS + 1), 1.6, true, (fraction) =>
				Math.min(1, start + fraction * length),
			);
		}
		for (const attribute of [position, next, width, brightness, along]) attribute.needsUpdate = true;

		struckAt = time;
		strokes = [{ at: 0, strength: 1 }];
		const further = 1 + Math.floor(Math.random() * 3);
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
		mesh.visible = sinceLeader >= 0 && sinceReturn < 1;
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
		const afterglow = 0.25 * Math.exp(-sinceReturn / 0.25);
		uniforms.uLeader.value = 1;
		uniforms.uMain.value = current + afterglow;
		uniforms.uBranches.value = 0.7 * Math.exp(-sinceReturn / 0.03);
		uniforms.uWidth.value = 0.7 + 0.9 * Math.min(1, current);
		uniforms.uTint.value.copy(hot).lerp(cooled, Math.min(1, sinceLast / 0.12));
		return Math.min(1, current + afterglow);
	};

	// Point i of `count` evenly spaced along the main channel, from cloud to sea.
	const pathPoint = (i: number, count: number) => main[Math.round((i / (count - 1)) * MAIN_SEGMENTS)];

	return { strike, update, pathPoint };
}
