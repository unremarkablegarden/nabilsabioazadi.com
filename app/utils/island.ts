// The islands of Manawatāwhi, where the voyage began, as a preview only: /?island (the owner's, 31 October: first in view for everyone,
// then "make it geographically accurate", then, told that the boat is really far past them, "true place"). In the true place they are
// not to be seen: the boat left them on 10 October, and a summit of 295 m shows at most about 70 km off, which it passed within days and
// never comes back to. So the live sea is open water, and nothing here is fetched or drawn. The preview draws the boat as if at a real
// place in open water among them, 34.1778°S 172.1158°E, which it is not. From there each island stands at its true distance and direction:
// Great Island, Manawatāwhi, ahead and to starboard; Oromaki behind it; Moekawa, the Princes Islands and Ōhau off to port, abeam and beyond
// what the view shows until it is turned. North is true north, so the real sun falls on the real faces, and the live sun, moon, cloud,
// mist and swell are the sea's own. Shapes, heights and depths are in scripts/bake-manawatawhi.mjs. What grows is from the botanists'
// records (kind: 0 Great Island's kānuka, 1 the broadleaf forest of the islands the goats never reached, 2 the near-bare Princes), and goes
// where height, steepness and nearness to the water would put it.
import * as THREE from "three";
import type { GerstnerUniforms } from "./gerstner-waves";

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
	uniform vec2 texel;
	uniform float cell;
	uniform vec2 across;
	uniform vec2 origin;
	uniform float kind;
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
		vec2 ground = origin + vMap * across;
		float dx = ( heightAt( vMap + vec2( texel.x, 0.0 ) ) - heightAt( vMap - vec2( texel.x, 0.0 ) ) ) / ( 2.0 * cell );
		float dz = ( heightAt( vMap + vec2( 0.0, texel.y ) ) - heightAt( vMap - vec2( 0.0, texel.y ) ) ) / ( 2.0 * cell );
		float steep = sqrt( dx * dx + dz * dz );
		float grain = layers( ground * 0.11 );
		float fine = layers( ground * 0.5 );
		// Steepness as an angle's share: 0 flat, 1 sheer.
		float sheer = atan( steep ) / 1.5708;
		// Bare rock on what is too steep to hold soil, sooner in the salt of the coast and on the Princes, which are nearly bare.
		float rockyness = smoothstep( mix( 0.28, 0.4, smoothstep( 15.0, 70.0, height ) ), mix( 0.42, 0.56, smoothstep( 15.0, 70.0, height ) ), sheer + ( grain - 0.5 ) * 0.22 );
		if ( kind > 1.5 ) rockyness = max( rockyness, smoothstep( 0.35, 0.62, fine ) );
		// On rock the grain is the old lava flows and tuffs, lying in beds.
		float bedding = layers( vec2( ground.x * 0.012 + ground.y * 0.007, height * 0.34 + ground.x * 0.008 ) );
		float bumpScale = mix( 0.9, 2.2, rockyness );
		float eastward = layers( ( ground + vec2( 3.0, 0.0 ) ) * 0.11 ) - grain;
		float southward = layers( ( ground + vec2( 0.0, 3.0 ) ) * 0.11 ) - grain;
		vec3 mapNormal = normalize( vec3( - dx - eastward * bumpScale, 1.0, - dz - southward * bumpScale ) );

		// Salt reaches up the coast about thirty metres; nothing grows in the wash below ten.
		float salt = 1.0 - smoothstep( 12.0, 34.0, height + ( fine - 0.5 ) * 18.0 );
		float wind = clamp( 0.5 - 0.5 * dot( mapNormal.xz, normalize( vec2( 1.0, 0.45 ) ) ) * 2.4, 0.0, 1.0 );

		// Great Island: kānuka, a "monotonous and extremely dense" canopy since the goats went in 1946, grey-green and fine, falling
		// in places since 1989 with brighter porokaiwhiri and māngeao coming up where it has.
		vec3 canopy = mix( vec3( 0.04, 0.052, 0.03 ), vec3( 0.08, 0.088, 0.052 ), smoothstep( 0.3, 0.72, grain + 0.25 * fine ) );
		canopy = mix( canopy, vec3( 0.042, 0.095, 0.032 ), smoothstep( 0.56, 0.68, layers( ground * 0.018 ) ) * 0.8 );
		// The others never had goats: broadleaf coastal forest with puka, big glossy leaves, a stronger green.
		if ( kind > 0.5 ) canopy = mix( vec3( 0.03, 0.078, 0.024 ), vec3( 0.07, 0.135, 0.038 ), smoothstep( 0.3, 0.7, grain + 0.3 * fine ) );
		// Altered submarine basalt (spilite) with paler tuffs in it: dark and greenish grey, rust where it weathers.
		vec3 rock = mix( vec3( 0.082, 0.088, 0.078 ), vec3( 0.165, 0.162, 0.142 ), smoothstep( 0.32, 0.68, bedding ) );
		rock = mix( rock, vec3( 0.12, 0.08, 0.055 ), 0.45 * smoothstep( 0.5, 0.75, fine ) );
		vec3 colour = mix( canopy, rock, rockyness );
		// Salt-burnt turf and bare stone.
		colour = mix( colour, mix( vec3( 0.18, 0.165, 0.125 ), rock, rockyness ), salt );
		// Where red-billed gulls and the rest sit: ledges of the seaward cliffs, whitened by them.
		float ledges = smoothstep( 0.68, 0.8, bedding ) * rockyness * smoothstep( 12.0, 30.0, height ) * ( 1.0 - smoothstep( 90.0, 170.0, height ) );
		colour = mix( colour, vec3( 0.58, 0.56, 0.5 ), 0.55 * ledges * smoothstep( 0.45, 0.65, fine ) );
		// Wet and dark to where the swell reaches; black weed at the tide's edge.
		float reach = 2.0 + 5.0 * surf + 2.5 * ( grain - 0.5 ) * 4.0;
		colour *= mix( 1.0, 0.42, 1.0 - smoothstep( reach, reach + 4.0, height ) );

		vec3 normal = vec3( mapNormal.x * turned.x + mapNormal.z * turned.y, mapNormal.y, - mapNormal.x * turned.y + mapNormal.z * turned.x );
		float sun = max( 0.0, dot( normal, sunWorld ) ) * sunlit( vMap, height, sunTowards );
		// The sky lights what faces up; gullies see less of it; the bright sea lights what faces down the coast.
		float openness = 0.55 + 0.45 * normal.y;
		float hollow = clamp( 0.72 + ( height - heightAt( vMap + vec2( texel.x * 6.0, 0.0 ) ) + height - heightAt( vMap - vec2( texel.x * 6.0, 0.0 ) ) + height - heightAt( vMap + vec2( 0.0, texel.y * 6.0 ) ) + height - heightAt( vMap - vec2( 0.0, texel.y * 6.0 ) ) ) * 0.012, 0.3, 1.15 );
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

// Specks at this distance, as gulls are at a few kilometres, wheeling off the cliffs where they sit.
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

export function createIsland(scene: THREE.Scene, sea: GerstnerUniforms, boat: THREE.Vector3, shown = false) {
	const group = new THREE.Group();
	group.visible = false;
	// Everything is laid out east and south of the boat, and turns about it to true north.
	group.position.set(boat.x, 0, boat.z);
	scene.add(group);
	const uniforms = {
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
	const birdMaterial = new THREE.ShaderMaterial({ uniforms: birdUniforms, vertexShader: birdVertex, fragmentShader: birdFragment, transparent: true, depthWrite: false });
	const held: { dispose(): void }[] = [];
	let shoreTexture: THREE.DataTexture | undefined;
	let birdGeometry: THREE.BufferGeometry | undefined;
	let gone = false;

	const build = (data: ArrayBuffer) => {
		const head = new Float32Array(data, 0, 8);
		const [count, shoreWide, shoreTall, shoreCell, eastMin, southMin, metres] = head as unknown as number[];
		const places = new Float32Array(data, 32, count! * 8);
		let at = 32 + count! * 32;
		// Birds gather over steep ground above the water: each island's steepest such places, kept apart.
		const roosts: [number, number, number][] = [];
		for (let n = 0; n < count!; n++) {
			const [across, down, east0, south0, kind] = places.subarray(n * 8, n * 8 + 5) as unknown as [number, number, number, number, number];
			const stored = new Int16Array(data, at, across * down);
			at += across * down * 2;
			const heightOf = (x: number, y: number) => stored[Math.max(0, Math.min(down - 1, y)) * across + Math.max(0, Math.min(across - 1, x))]! / 50;
			const half = new Uint16Array(across * down);
			for (let i = 0; i < half.length; i++) half[i] = THREE.DataUtils.toHalfFloat(stored[i]! / 50);
			const texture = new THREE.DataTexture(half, across, down, THREE.RedFormat, THREE.HalfFloatType);
			texture.minFilter = texture.magFilter = THREE.LinearFilter;
			texture.needsUpdate = true;

			// Every second cell of the grid, and only the land and the rock just under the water.
			const STEP = 2;
			const wide = Math.floor((across - 1) / STEP) + 1, tall = Math.floor((down - 1) / STEP) + 1;
			const positions = new Float32Array(wide * tall * 3), uvs = new Float32Array(wide * tall * 2);
			for (let j = 0; j < tall; j++) for (let i = 0; i < wide; i++) {
				const p = j * wide + i;
				positions.set([east0 + i * STEP * metres!, heightOf(i * STEP, j * STEP), south0 + j * STEP * metres!], p * 3);
				uvs.set([(i * STEP + 0.5) / across, (j * STEP + 0.5) / down], p * 2);
			}
			const faces: number[] = [];
			for (let j = 0; j < tall - 1; j++) for (let i = 0; i < wide - 1; i++) {
				const a = j * wide + i, b = a + 1, c = a + wide, d = c + 1;
				if (Math.max(positions[a * 3 + 1]!, positions[b * 3 + 1]!, positions[c * 3 + 1]!, positions[d * 3 + 1]!) > -30) faces.push(a, c, b, b, c, d);
			}
			const geometry = new THREE.BufferGeometry();
			geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
			geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
			geometry.setIndex(faces);
			geometry.computeBoundingSphere();
			const material = new THREE.ShaderMaterial({
				uniforms: {
					...uniforms,
					heights: { value: texture },
					texel: { value: new THREE.Vector2(1 / across, 1 / down) },
					cell: { value: metres },
					across: { value: new THREE.Vector2(across * metres!, down * metres!) },
					origin: { value: new THREE.Vector2(east0, south0) },
					kind: { value: kind },
				},
				vertexShader: terrainVertex,
				fragmentShader: terrainFragment,
			});
			group.add(new THREE.Mesh(geometry, material));
			held.push(texture, geometry, material);

			const candidates: [number, number, number, number][] = [];
			for (let y = 8; y < down - 8; y += 6) for (let x = 8; x < across - 8; x += 6) {
				const height = heightOf(x, y);
				if (height < 14 || height > 170) continue;
				let lowest = Infinity;
				for (const [dx, dy] of [[25, 0], [-25, 0], [0, 25], [0, -25]] as const) lowest = Math.min(lowest, heightOf(x + dx, y + dy));
				if (lowest > 2) continue;
				candidates.push([Math.hypot(heightOf(x + 3, y) - heightOf(x - 3, y), heightOf(x, y + 3) - heightOf(x, y - 3)), east0 + x * metres!, south0 + y * metres!, height]);
			}
			candidates.sort((a, b) => b[0] - a[0]);
			const own: [number, number, number][] = [];
			for (const [, east, south, height] of candidates) {
				if (own.every(([ox, oy]) => Math.hypot(ox - east, oy - south) > 500)) own.push([east, south, height]);
				if (own.length === (kind === 0 ? 6 : 2)) break;
			}
			roosts.push(...own);
		}
		shoreTexture = new THREE.DataTexture(new Uint8Array(data, at, shoreWide! * shoreTall! * 2), shoreWide!, shoreTall!, THREE.RGFormat, THREE.UnsignedByteType);
		shoreTexture.minFilter = shoreTexture.magFilter = THREE.LinearFilter;
		shoreTexture.needsUpdate = true;
		sea.shoreMap.value = shoreTexture;
		sea.shoreAt.value.set(group.position.x, group.position.z, 0, 1);
		sea.shoreRect.value.set(eastMin!, southMin!, shoreWide! * shoreCell!, shoreTall! * shoreCell!);

		let seed = 3;
		const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
		const BIRDS = 42 * Math.max(1, roosts.length);
		const birdAt = new Float32Array(BIRDS * 3);
		const wheels = new Float32Array(BIRDS * 4);
		for (let n = 0; n < BIRDS; n++) {
			const [east, south, height] = roosts[n % roosts.length] ?? [0, -3000, 60];
			birdAt.set([east + (random() - 0.5) * 240, height + random() ** 1.5 * 90, south + (random() - 0.5) * 240], n * 3);
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
		for (const thing of held) thing.dispose();
		birdGeometry?.dispose();
		birdMaterial.dispose();
		shoreTexture?.dispose();
		sea.shoreAt.value.w = 0;
	};
	return { group, update, dispose };
}
