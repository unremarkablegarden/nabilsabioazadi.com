// Great Island of Manawatāwhi, where the voyage began, in view ahead of the boat (the owner's, 31 October, on seeing an island
// of real elevation data made in a game engine). It is not where it really is, some hundreds of kilometres astern: it is the
// one thing in the picture that is placed for the picture. Everything else about it is measured or follows from what is: the
// shape is the survey's (scripts/bake-manawatawhi.mjs), north on it is true north, so the real sun falls on its real faces,
// and the live sun, moon, cloud, mist and swell are the sea's own. What grows where is not placed by hand either: rock, scrub,
// salt and birds each go where height, steepness and nearness to the water would put them. ?island=off leaves it out.
import * as THREE from "three";
import type { GerstnerUniforms } from "./gerstner-waves";

// Where it lies from the boat: a little to starboard, its near shore about a mile and a half off.
const LIES = new THREE.Vector2(900, -3000);

const NOISE = /* glsl */ `
	float hash( vec2 p ) {
		vec3 q = fract( vec3( p.xyx ) * 0.1031 );
		q += dot( q, q.yzx + 33.33 );
		return fract( ( q.x + q.y ) * q.z );
	}
	float bumps( vec2 p ) {
		vec2 i = floor( p ), f = fract( p );
		f = f * f * ( 3.0 - 2.0 * f );
		return mix( mix( hash( i ), hash( i + vec2( 1.0, 0.0 ) ), f.x ), mix( hash( i + vec2( 0.0, 1.0 ) ), hash( i + vec2( 1.0, 1.0 ) ), f.x ), f.y );
	}
	float layers( vec2 p ) {
		float sum = 0.0, part = 0.5;
		for ( int i = 0; i < 4; i ++ ) { sum += part * bumps( p ); p = p * 2.03 + 17.0; part *= 0.5; }
		return sum;
	}
`;

const terrainVertex = /* glsl */ `
	varying vec2 vMap;
	varying vec3 vWorld;
	void main() {
		vMap = uv;
		vec4 world = modelMatrix * vec4( position, 1.0 );
		vWorld = world.xyz;
		gl_Position = projectionMatrix * viewMatrix * world;
	}
`;

const terrainFragment = /* glsl */ `
	uniform sampler2D heights;
	uniform float texel;
	uniform float cell;
	uniform float across;
	uniform vec3 sunTowards;
	uniform vec3 sunWorld;
	uniform vec3 sunLight;
	uniform vec3 skyLight;
	uniform vec3 haze;
	uniform vec3 eye;
	uniform float clearAir;
	uniform vec3 mistColor;
	uniform float mistDensity;
	uniform float surf;
	uniform float seaTime;
	uniform vec2 turned;
	varying vec2 vMap;
	varying vec3 vWorld;
	${NOISE}
	float heightAt( vec2 map ) { return texture2D( heights, map ).r; }
	// How much of the sun gets here past the rest of the island, walking up the line towards it.
	float sunlit( vec2 map, float height, vec3 towards ) {
		if ( towards.y <= 0.0 ) return 0.0;
		float open = 1.0, step_ = 24.0;
		vec2 along = towards.xz / max( length( towards.xz ), 0.001 );
		float rise = towards.y / max( length( towards.xz ), 0.001 );
		float out_ = 12.0;
		for ( int i = 0; i < 22; i ++ ) {
			float over = height + 1.5 + rise * out_ - heightAt( map + along * out_ / across );
			open = min( open, clamp( 0.5 + over * 28.0 / out_, 0.0, 1.0 ) );
			if ( open <= 0.0 ) break;
			out_ += step_;
			step_ *= 1.09;
		}
		return open;
	}
	void main() {
		float height = heightAt( vMap );
		// Survey and rain give the shape down to a few metres; below that is the grain of rock and leaf.
		vec2 ground = vMap * across;
		float dx = ( heightAt( vMap + vec2( texel, 0.0 ) ) - heightAt( vMap - vec2( texel, 0.0 ) ) ) / ( 2.0 * cell );
		float dz = ( heightAt( vMap + vec2( 0.0, texel ) ) - heightAt( vMap - vec2( 0.0, texel ) ) ) / ( 2.0 * cell );
		float steep = sqrt( dx * dx + dz * dz );
		float grain = layers( ground * 0.11 );
		float fine = layers( ground * 0.5 );
		// Steepness as an angle's share: 0 flat, 1 sheer.
		float sheer = atan( steep ) / 1.5708;
		float rockyness = smoothstep( 0.4, 0.56, sheer + ( grain - 0.5 ) * 0.22 );
		// Scrub stands to about ten metres over the plateau; on rock the grain is bedding, lying nearly level.
		float bedding = layers( vec2( ground.x * 0.012 + ground.y * 0.007, height * 0.34 + ground.x * 0.008 ) );
		float bumpScale = mix( 0.9, 2.2, rockyness );
		float eastward = layers( ( ground + vec2( 3.0, 0.0 ) ) * 0.11 ) - grain;
		float southward = layers( ( ground + vec2( 0.0, 3.0 ) ) * 0.11 ) - grain;
		vec3 mapNormal = normalize( vec3( - dx - eastward * bumpScale, 1.0, - dz - southward * bumpScale ) );

		// Salt reaches up the coast about thirty metres; nothing grows in the wash below ten.
		float salt = 1.0 - smoothstep( 12.0, 34.0, height + ( fine - 0.5 ) * 18.0 );
		float wind = clamp( 0.5 - 0.5 * dot( mapNormal.xz, normalize( vec2( 1.0, 0.45 ) ) ) * 2.4, 0.0, 1.0 );

		// Kānuka, karo and flax in a dense low canopy, darker in the gullies, wind-clipped paler on the tops.
		vec3 canopy = mix( vec3( 0.022, 0.044, 0.018 ), vec3( 0.062, 0.088, 0.03 ), smoothstep( 0.3, 0.72, grain + 0.25 * fine ) );
		canopy = mix( canopy, vec3( 0.105, 0.112, 0.047 ), smoothstep( 0.55, 0.8, fine ) * ( 0.25 + 0.5 * wind ) );
		// Grey wacke, browner where it is weathered, banded by its bedding.
		vec3 rock = mix( vec3( 0.135, 0.118, 0.098 ), vec3( 0.235, 0.215, 0.185 ), smoothstep( 0.32, 0.68, bedding ) );
		rock = mix( rock, vec3( 0.105, 0.078, 0.058 ), 0.5 * smoothstep( 0.45, 0.75, fine ) );
		vec3 colour = mix( canopy, rock, rockyness );
		// Salt-burnt turf and bare stone.
		colour = mix( colour, mix( vec3( 0.18, 0.165, 0.125 ), rock, rockyness ), salt );
		// Where the sea birds sit: ledges of the seaward cliffs, whitened by them.
		float ledges = smoothstep( 0.68, 0.8, bedding ) * rockyness * smoothstep( 12.0, 30.0, height ) * ( 1.0 - smoothstep( 90.0, 170.0, height ) );
		colour = mix( colour, vec3( 0.58, 0.56, 0.5 ), 0.55 * ledges * smoothstep( 0.45, 0.65, fine ) );
		// Wet and dark to where the swell reaches; black weed at the tide's edge.
		float reach = 2.0 + 5.0 * surf + 2.5 * ( grain - 0.5 ) * 4.0;
		colour *= mix( 1.0, 0.42, 1.0 - smoothstep( reach, reach + 4.0, height ) );

		vec3 normal = vec3( mapNormal.x * turned.x + mapNormal.z * turned.y, mapNormal.y, - mapNormal.x * turned.y + mapNormal.z * turned.x );
		float sun = max( 0.0, dot( normal, sunWorld ) ) * sunlit( vMap, height, sunTowards );
		// The sky lights what faces up; gullies see less of it; the bright sea lights what faces down the coast.
		float openness = 0.55 + 0.45 * normal.y;
		float hollow = clamp( 0.72 + ( height - heightAt( vMap + vec2( texel * 6.0, 0.0 ) ) + height - heightAt( vMap - vec2( texel * 6.0, 0.0 ) ) + height - heightAt( vMap + vec2( 0.0, texel * 6.0 ) ) + height - heightAt( vMap - vec2( 0.0, texel * 6.0 ) ) ) * 0.012, 0.3, 1.15 );
		vec3 light = sunLight * sun + skyLight * openness * hollow + skyLight * 0.16 * ( 1.0 - normal.y ) * vec3( 0.5, 0.75, 0.85 );
		vec3 lit = colour * light;
		// White water on the rock, thrown up as the swell comes in.
		float thrown = ( 1.0 - smoothstep( 0.0, 2.0 + 6.0 * surf, height + ( fine - 0.5 ) * 7.0 ) ) * smoothstep( 0.32, 0.72, bumps( ground * 0.03 + vec2( seaTime * 0.1, - seaTime * 0.07 ) ) + 0.25 * fine ) * ( 0.25 + 0.75 * surf );
		lit = mix( lit, ( sunLight * max( 0.0, normal.y * 0.5 + 0.5 ) + skyLight ) * 0.72, thrown );

		// The air between: blue with distance, and thick air takes it altogether.
		float fromEye = length( vWorld - eye );
		lit = mix( lit, haze, 1.0 - exp( - fromEye * clearAir ) );
		float mist = mistDensity * fromEye;
		gl_FragColor = vec4( mix( lit, mistColor, 1.0 - exp( - mist * mist ) ), 1.0 );
	}
`;

// Specks at this distance, as sea birds are at a mile and a half, wheeling off the cliffs where they nest.
const birdVertex = /* glsl */ `
	attribute vec4 wheel;
	uniform float seaTime;
	uniform float pixels;
	varying float vWing;
	void main() {
		float turn = seaTime * wheel.w + wheel.z * 6.2832;
		vec3 local = position + vec3( cos( turn ) * wheel.x, 8.0 * sin( turn * 2.3 + wheel.z * 9.0 ), sin( turn ) * wheel.x * 0.7 );
		vec4 view = modelViewMatrix * vec4( local, 1.0 );
		gl_Position = projectionMatrix * view;
		vWing = 0.55 + 0.45 * sin( seaTime * ( 5.0 + wheel.z * 2.0 ) + wheel.z * 40.0 );
		gl_PointSize = max( 1.15, pixels * 2.4 / - view.z ) ;
	}
`;
const birdFragment = /* glsl */ `
	uniform vec3 birdLight;
	uniform float birdsOut;
	varying float vWing;
	void main() {
		if ( birdsOut <= 0.0 ) discard;
		gl_FragColor = vec4( birdLight, birdsOut * vWing * ( 1.0 - smoothstep( 0.2, 0.5, length( gl_PointCoord - 0.5 ) ) ) );
	}
`;

export interface IslandFrame {
	time: number;
	eye: THREE.Vector3;
	sunDirection: THREE.Vector3;
	sunColor: THREE.Color;
	daylight: number;
	sky: number;
	// Metres one can see through the air (the forecast's), and the mist drawn over the sea.
	visibility: number;
	fog: THREE.FogExp2;
	waveHeight: number;
	sunElevation: number;
	bearing: number;
}

export function createIsland(scene: THREE.Scene, sea: GerstnerUniforms, shown = true) {
	const group = new THREE.Group();
	group.visible = false;
	group.position.set(LIES.x, 0, LIES.y);
	scene.add(group);
	const uniforms = {
		heights: { value: null as THREE.Texture | null },
		texel: { value: 0 },
		cell: { value: 0 },
		across: { value: 1 },
		sunTowards: { value: new THREE.Vector3(0, 1, 0) },
		sunWorld: { value: new THREE.Vector3(0, 1, 0) },
		sunLight: { value: new THREE.Color() },
		skyLight: { value: new THREE.Color() },
		haze: { value: new THREE.Color() },
		eye: { value: new THREE.Vector3() },
		clearAir: { value: 0.00005 },
		mistColor: { value: new THREE.Color() },
		mistDensity: { value: 0 },
		surf: { value: 0.3 },
		seaTime: { value: 0 },
		turned: { value: new THREE.Vector2(1, 0) },
	};
	const birdUniforms = {
		seaTime: uniforms.seaTime,
		pixels: { value: window.innerHeight / (2 * Math.tan((55 * Math.PI) / 360)) },
		birdLight: { value: new THREE.Color() },
		birdsOut: { value: 0 },
	};
	const material = new THREE.ShaderMaterial({ uniforms, vertexShader: terrainVertex, fragmentShader: terrainFragment });
	const birdMaterial = new THREE.ShaderMaterial({ uniforms: birdUniforms, vertexShader: birdVertex, fragmentShader: birdFragment, transparent: true, depthWrite: false });
	let heightTexture: THREE.DataTexture | undefined;
	let shoreTexture: THREE.DataTexture | undefined;
	let geometry: THREE.BufferGeometry | undefined;
	let birdGeometry: THREE.BufferGeometry | undefined;
	let gone = false;

	const build = (data: ArrayBuffer) => {
		const [size, coarse, metres] = new Float32Array(data, 0, 3) as unknown as [number, number, number];
		const stored = new Int16Array(data, 16, size * size);
		const heightOf = (x: number, y: number) => stored[y * size + x]! / 50;
		const half = new Uint16Array(size * size);
		for (let i = 0; i < half.length; i++) half[i] = THREE.DataUtils.toHalfFloat(stored[i]! / 50);
		heightTexture = new THREE.DataTexture(half, size, size, THREE.RedFormat, THREE.HalfFloatType);
		heightTexture.minFilter = heightTexture.magFilter = THREE.LinearFilter;
		heightTexture.needsUpdate = true;
		const across = size * metres;
		uniforms.heights.value = heightTexture;
		uniforms.texel.value = 1 / size;
		uniforms.cell.value = metres;
		uniforms.across.value = across;
		shoreTexture = new THREE.DataTexture(new Uint8Array(data, 16 + size * size * 2, coarse * coarse), coarse, coarse, THREE.RedFormat, THREE.UnsignedByteType);
		shoreTexture.minFilter = shoreTexture.magFilter = THREE.LinearFilter;
		shoreTexture.needsUpdate = true;
		sea.shoreMap.value = shoreTexture;
		sea.shoreAt.value.set(LIES.x, LIES.y, across, 1);

		// Every second cell of the survey's grid, and only the land and the rock just under the water.
		const STEP = 2;
		const count = Math.floor((size - 1) / STEP) + 1;
		const positions = new Float32Array(count * count * 3);
		const uvs = new Float32Array(count * count * 2);
		for (let j = 0; j < count; j++) for (let i = 0; i < count; i++) {
			const p = j * count + i;
			positions.set([(i * STEP - size / 2) * metres, heightOf(i * STEP, j * STEP), (j * STEP - size / 2) * metres], p * 3);
			uvs.set([(i * STEP + 0.5) / size, (j * STEP + 0.5) / size], p * 2);
		}
		const faces: number[] = [];
		for (let j = 0; j < count - 1; j++) for (let i = 0; i < count - 1; i++) {
			const a = j * count + i, b = a + 1, c = a + count, d = c + 1;
			if (Math.max(positions[a * 3 + 1]!, positions[b * 3 + 1]!, positions[c * 3 + 1]!, positions[d * 3 + 1]!) > -30) faces.push(a, c, b, b, c, d);
		}
		geometry = new THREE.BufferGeometry();
		geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
		geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
		geometry.setIndex(faces);
		geometry.computeBoundingSphere();
		group.add(new THREE.Mesh(geometry, material));

		// Birds gather over steep ground within two hundred metres of the water: the highest-scoring places, kept apart.
		const roosts: [number, number, number][] = [];
		const candidates: [number, number, number, number][] = [];
		for (let y = 8; y < size - 8; y += 6) for (let x = 8; x < size - 8; x += 6) {
			const height = heightOf(x, y);
			if (height < 18 || height > 170) continue;
			const steep = Math.hypot(heightOf(x + 3, y) - heightOf(x - 3, y), heightOf(x, y + 3) - heightOf(x, y - 3)) / (6 * metres);
			let lowest = Infinity;
			for (const [dx, dy] of [[25, 0], [-25, 0], [0, 25], [0, -25]] as const) lowest = Math.min(lowest, heightOf(Math.min(size - 1, Math.max(0, x + dx)), Math.min(size - 1, Math.max(0, y + dy))));
			if (lowest > 2) continue;
			candidates.push([steep, x, y, height]);
		}
		candidates.sort((a, b) => b[0] - a[0]);
		for (const [, x, y, height] of candidates) {
			if (roosts.every(([ox, oy]) => Math.hypot(ox - x, oy - y) > 70)) roosts.push([x, y, height]);
			if (roosts.length === 7) break;
		}
		let seed = 3;
		const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
		const BIRDS = 42 * Math.max(1, roosts.length);
		const birdAt = new Float32Array(BIRDS * 3);
		const wheels = new Float32Array(BIRDS * 4);
		for (let n = 0; n < BIRDS; n++) {
			const [x, y, height] = roosts[n % roosts.length] ?? [size / 2, size / 2, 60];
			birdAt.set([(x - size / 2) * metres + (random() - 0.5) * 240, height + random() ** 1.5 * 90, (y - size / 2) * metres + (random() - 0.5) * 240], n * 3);
			wheels.set([25 + random() * 150, 0, random(), (random() < 0.5 ? -1 : 1) * (0.08 + random() * 0.14)], n * 4);
		}
		birdGeometry = new THREE.BufferGeometry();
		birdGeometry.setAttribute("position", new THREE.BufferAttribute(birdAt, 3));
		birdGeometry.setAttribute("wheel", new THREE.BufferAttribute(wheels, 4));
		const birds = new THREE.Points(birdGeometry, birdMaterial);
		birds.frustumCulled = false;
		group.add(birds);
		group.visible = true;
	};
	if (shown) {
		fetch("/textures/manawatawhi.bin")
			.then((response) => response.arrayBuffer())
			.then((data) => { if (!gone) build(data); })
			.catch(() => {});
	}

	const update = (now: IslandFrame) => {
		if (!group.visible) return;
		const turn = THREE.MathUtils.degToRad(now.bearing);
		group.rotation.y = turn;
		const [cos, sin] = [Math.cos(turn), Math.sin(turn)];
		uniforms.turned.value.set(cos, sin);
		sea.shoreAt.value.w = 1;
		sea.shoreTurn.value.set(cos, sin);
		const to = now.sunDirection;
		uniforms.sunWorld.value.copy(to);
		// (The way to the sun as the map has it, the map being turned with true north.)
		uniforms.sunTowards.value.set(to.x * cos - to.z * sin, to.y, to.x * sin + to.z * cos);
		// Daylight on the land is the sun's, reddening as it goes down; the cloud takes the direct light first.
		const low = 1 - THREE.MathUtils.smoothstep(now.sunElevation, 0, 18);
		const clear = 1 - now.sky * 0.92;
		uniforms.sunLight.value.copy(now.sunColor).multiplyScalar(now.daylight > 0.02 ? 3.3 : 2.4);
		uniforms.sunLight.value.r *= THREE.MathUtils.lerp(1, 1.12, low);
		uniforms.sunLight.value.g *= THREE.MathUtils.lerp(1, 0.88, low);
		uniforms.sunLight.value.b *= THREE.MathUtils.lerp(1, 0.7, low);
		uniforms.skyLight.value.setRGB(0.5, 0.62, 0.82).multiplyScalar(THREE.MathUtils.lerp(0.012, 0.92, now.daylight) * THREE.MathUtils.lerp(1, 0.72, now.sky));
		uniforms.skyLight.value.lerp(new THREE.Color(0.5, 0.42, 0.42).multiplyScalar(0.6), low * now.daylight * 0.35);
		uniforms.haze.value.setRGB(0.48, 0.6, 0.76).multiplyScalar(THREE.MathUtils.lerp(0.012, 0.8, now.daylight) * THREE.MathUtils.lerp(1, 0.55, now.sky));
		uniforms.haze.value.lerp(new THREE.Color(0.85, 0.52, 0.42), low * now.daylight * 0.5);
		uniforms.eye.value.copy(now.eye);
		// A clear day's forecast says 24 km or more; the haze at this distance comes from that.
		uniforms.clearAir.value = 0.5 / Math.max(800, Math.min(60000, now.visibility));
		uniforms.mistColor.value.copy(now.fog.color);
		uniforms.mistDensity.value = now.fog.density;
		uniforms.surf.value = Math.min(1, 0.15 + now.waveHeight / 4);
		uniforms.seaTime.value = now.time;
		sea.shoreSurf.value = uniforms.surf.value;
		birdUniforms.birdsOut.value = THREE.MathUtils.smoothstep(now.daylight, 0.15, 0.5) * (1 - now.sky * 0.5);
		birdUniforms.birdLight.value.setRGB(0.7, 0.72, 0.74).multiplyScalar(Math.max(0.2, now.daylight * clear));
	};
	const dispose = () => {
		gone = true;
		scene.remove(group);
		geometry?.dispose();
		birdGeometry?.dispose();
		material.dispose();
		birdMaterial.dispose();
		heightTexture?.dispose();
		shoreTexture?.dispose();
		sea.shoreAt.value.w = 0;
	};
	return { group, update, dispose };
}
