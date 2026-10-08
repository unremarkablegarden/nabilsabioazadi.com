<script setup lang="ts">
// Based on the three.js example webgl_shaders_ocean (r186).
import * as THREE from "three";
import { Water } from "three/addons/objects/Water.js";
import { Sky } from "three/addons/objects/Sky.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const isDev = import.meta.dev;
const container = ref<HTMLDivElement>();
let dispose: (() => void) | undefined;

const clockHour = () => {
	const now = new Date();
	return now.getHours() + now.getMinutes() / 60;
};
// Local time of day in hours (0..24). The dev slider sets it and stops it following the clock.
const hour = ref(clockHour());
const followClock = ref(true);
const hourLabel = computed(() => {
	const minutes = Math.round(hour.value * 60) % 1440;
	return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});
const resetToClock = () => {
	followClock.value = true;
	hour.value = clockHour();
};
// 0 = calm, 1 = storm.
const weather = ref(0.2);

onMounted(() => {
	const el = container.value!;
	const lerp = THREE.MathUtils.lerp;

	const renderer = new THREE.WebGLRenderer({ outputBufferType: THREE.HalfFloatType });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	el.appendChild(renderer.domElement);

	const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.1, 0, 0);
	renderer.setEffects([bloomPass]);

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
	// High enough to stay above the storm crests (about 14 units).
	camera.position.set(0, 18, 100);
	camera.rotation.order = "YXZ";

	// Pointer position in -1..1 on both axes; the camera eases towards it each frame.
	const pointer = new THREE.Vector2();
	const onPointerMove = (event: PointerEvent) => {
		pointer.set((event.clientX / window.innerWidth) * 2 - 1, (event.clientY / window.innerHeight) * 2 - 1);
	};
	window.addEventListener("pointermove", onPointerMove);
	const maxYaw = THREE.MathUtils.degToRad(20);
	const maxPitch = THREE.MathUtils.degToRad(6);

	const water = new Water(createFocusedPlane(10000, 512), {
		textureWidth: 512,
		textureHeight: 512,
		waterNormals: new THREE.TextureLoader().load("/textures/waternormals.jpg", (texture) => {
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		}),
		sunDirection: new THREE.Vector3(),
	});
	water.rotation.x = -Math.PI / 2;
	// Grid is densest under the camera.
	water.position.set(camera.position.x, 0, camera.position.z);
	scene.add(water);
	const waterUniforms = water.material.uniforms;
	const waveUniforms = addGerstnerWaves(water);

	const sky = new Sky();
	sky.scale.setScalar(10000);
	scene.add(sky);
	const skyUniforms = sky.material.uniforms;
	skyUniforms.mieDirectionalG.value = 0.8;
	skyUniforms.cloudElevation.value = 0.5;

	// Moon disc, about 2° wide. Not tone-mapped so it stays bright at night exposure;
	// the water's mirror reflection picks it up as a moon path.
	const moon = new THREE.Mesh(
		new THREE.CircleGeometry(70, 48),
		new THREE.MeshBasicMaterial({ color: 0xf4f1e8, toneMapped: false, transparent: true, fog: false }),
	);
	scene.add(moon);

	const NIGHT_EXPOSURE = 15;

	// Sun intensity term of the Sky shader (sunIntensity() in Sky.js) for an elevation in degrees.
	const skySunIntensity = (elevation: number) => {
		const cutoffAngle = 1.6110731556870734;
		const zenithAngle = THREE.MathUtils.degToRad(90 - elevation);
		return 1000 * Math.max(0, 1 - Math.exp(-(cutoffAngle - zenithAngle) / 1.5));
	};

	const daySunColor = new THREE.Color(0xffffff);
	// Moonlight on the water, scaled for NIGHT_EXPOSURE.
	const nightSunColor = new THREE.Color(0xc8d4ff).multiplyScalar(0.05);
	const stormSunColor = new THREE.Color(0x333333);
	// Above 1 so the water body holds colour against the HDR sky reflection.
	const dayWaterColor = new THREE.Color(0x0b4f63).multiplyScalar(3);
	const nightWaterColor = new THREE.Color(0x021020).multiplyScalar(0.05);
	const stormWaterColor = new THREE.Color(0x0a1214);

	// Sun position from the local time: rises 06:00, peaks 60° at 12:00, sets 18:00.
	// Azimuth sweeps 120°..240° so the sun stays near the view direction (180°).
	// The sky shader's light falls about 20x from noon to the horizon and is zero below
	// -2.3°, so day exposure is raised as the sun sets to keep dusk visible. At night the
	// sky keeps the real (set) sun and shows only its faint ambient term, at high exposure.
	// The moon is a separate light: a disc mesh plus the water's specular source.
	// Weather blends towards a storm: overcast sky, haze, grey light, longer and steeper waves, foam.
	const directionFrom = (elevation: number, azimuth: number) =>
		new THREE.Vector3().setFromSphericalCoords(
			1,
			THREE.MathUtils.degToRad(90 - elevation),
			THREE.MathUtils.degToRad(azimuth),
		);
	const updateEnvironment = ([hour, weather]: [number, number]) => {
		const sunElevation = 60 * Math.sin(((hour - 6) / 12) * Math.PI);
		const isNight = sunElevation < -2;
		const sunAzimuth = 120 + THREE.MathUtils.clamp((hour - 6) / 12, 0, 1) * 120;
		const moonElevation = THREE.MathUtils.clamp(-sunElevation * 0.35, 8, 20);
		const moonAzimuth = 120 + (((hour + 6) % 24) / 12) * 120;
		const daylight = THREE.MathUtils.smoothstep(sunElevation, -2, 8);
		const night = THREE.MathUtils.smoothstep(-sunElevation, 2, 12);

		const sun = directionFrom(sunElevation, sunAzimuth);
		const moonDirection = directionFrom(moonElevation, moonAzimuth);
		skyUniforms.sunPosition.value.copy(sun);
		waterUniforms.sunDirection.value.copy(isNight ? moonDirection : sun);
		moon.visible = isNight;
		moon.position.copy(moonDirection).multiplyScalar(4000).add(camera.position);
		moon.lookAt(camera.position);
		moon.material.opacity = night * lerp(1, 0.15, weather);

		skyUniforms.turbidity.value = lerp(2, 20, weather);
		skyUniforms.rayleigh.value = lerp(2, 0.5, weather);
		skyUniforms.mieCoefficient.value = lerp(0.002, 0.05, weather);
		skyUniforms.cloudCoverage.value = weather ** 0.8;
		skyUniforms.cloudDensity.value = lerp(0.3, 1, weather);

		// Storm colours are scaled like the night colours so a night storm stays dark.
		const brightness = lerp(0.05, 1, daylight);
		waterUniforms.sunColor.value
			.lerpColors(nightSunColor, daySunColor, daylight)
			.lerp(stormSunColor.clone().multiplyScalar(brightness), weather);
		waterUniforms.waterColor.value
			.lerpColors(nightWaterColor, dayWaterColor, daylight)
			.lerp(stormWaterColor.clone().multiplyScalar(brightness), weather);
		waterUniforms.distortionScale.value = lerp(2, 8, weather);
		waveUniforms.waveSteepness.value = lerp(0.15, 0.8, weather);
		waveUniforms.waveScale.value = lerp(0.6, 1.8, weather);
		waveUniforms.foam.value = THREE.MathUtils.smoothstep(weather, 0.3, 1);

		const duskBoost = Math.min(5, (skySunIntensity(8) / Math.max(skySunIntensity(sunElevation), 1e-3)) ** 0.7);
		const exposure = isNight ? lerp(0.35, NIGHT_EXPOSURE, night) : 0.07 * Math.max(1, duskBoost);
		renderer.toneMappingExposure = exposure * lerp(1, 0.5, weather);
	};
	watch([hour, weather], updateEnvironment, { immediate: true });
	const clockInterval = setInterval(() => {
		if (followClock.value) hour.value = clockHour();
	}, 60_000);

	const timer = new THREE.Timer();
	renderer.setAnimationLoop(() => {
		timer.update();
		const time = timer.getElapsed();
		camera.rotation.y += (-pointer.x * maxYaw - camera.rotation.y) * 0.03;
		camera.rotation.x += (-pointer.y * maxPitch - camera.rotation.x) * 0.03;

		waterUniforms.time.value += timer.getDelta() * lerp(0.6, 2, weather.value);
		waveUniforms.waveTime.value = time;
		skyUniforms.time.value = time * lerp(1, 4, weather.value);
		renderer.render(scene, camera);
	});

	const onResize = () => {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	};
	window.addEventListener("resize", onResize);

	dispose = () => {
		window.removeEventListener("resize", onResize);
		window.removeEventListener("pointermove", onPointerMove);
		clearInterval(clockInterval);
		renderer.setAnimationLoop(null);
		renderer.dispose();
		renderer.domElement.remove();
	};
});

onBeforeUnmount(() => dispose?.());
</script>

<template>
	<div ref="container" class="fixed inset-0 -z-10" aria-hidden="true" />
	<!-- Client only: the server's clock and time zone differ from the visitor's. -->
	<ClientOnly v-if="isDev">
		<div
			class="fixed top-4 right-4 z-10 grid grid-cols-[auto_12rem_auto] items-center gap-x-3 gap-y-2 rounded bg-black/50 px-3 py-2 font-mono text-sm text-white"
		>
			<label for="ocean-hour">time</label>
			<input
				id="ocean-hour"
				v-model.number="hour"
				type="range"
				min="0"
				max="24"
				:step="1 / 60"
				@input="followClock = false"
			/>
			<span>
				{{ hourLabel }}
				<button v-if="!followClock" type="button" class="underline" @click="resetToClock">now</button>
			</span>

			<label for="ocean-weather">weather</label>
			<input id="ocean-weather" v-model.number="weather" type="range" min="0" max="1" step="0.001" />
			<span>{{ Math.round(weather * 100) }}%</span>
		</div>
	</ClientOnly>
</template>
