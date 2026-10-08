<script setup lang="ts">
// Based on the three.js example webgl_shaders_ocean (r186).
import * as THREE from "three";
import { Water } from "three/addons/objects/Water.js";
import { Sky } from "three/addons/objects/Sky.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const container = ref<HTMLDivElement>();
let dispose: (() => void) | undefined;

onMounted(() => {
	const el = container.value!;

	const renderer = new THREE.WebGLRenderer({ outputBufferType: THREE.HalfFloatType });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 0.1;
	el.appendChild(renderer.domElement);

	const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.1, 0, 0);
	renderer.setEffects([bloomPass]);

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
	camera.position.set(0, 12, 100);
	camera.rotation.order = "YXZ";

	// Pointer position in -1..1 on both axes; the camera eases towards it each frame.
	const pointer = new THREE.Vector2();
	const onPointerMove = (event: PointerEvent) => {
		pointer.set((event.clientX / window.innerWidth) * 2 - 1, (event.clientY / window.innerHeight) * 2 - 1);
	};
	window.addEventListener("pointermove", onPointerMove);
	const maxYaw = THREE.MathUtils.degToRad(20);
	const maxPitch = THREE.MathUtils.degToRad(6);

	const water = new Water(new THREE.PlaneGeometry(10000, 10000), {
		textureWidth: 512,
		textureHeight: 512,
		waterNormals: new THREE.TextureLoader().load("/textures/waternormals.jpg", (texture) => {
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		}),
		sunDirection: new THREE.Vector3(),
		sunColor: 0xffffff,
		waterColor: 0x001e0f,
		distortionScale: 3.7,
	});
	water.rotation.x = -Math.PI / 2;
	scene.add(water);

	const sky = new Sky();
	sky.scale.setScalar(10000);
	const skyUniforms = sky.material.uniforms;
	skyUniforms.turbidity.value = 10;
	skyUniforms.rayleigh.value = 2;
	skyUniforms.mieCoefficient.value = 0.005;
	skyUniforms.mieDirectionalG.value = 0.8;
	skyUniforms.cloudCoverage.value = 0.4;
	skyUniforms.cloudDensity.value = 0.5;
	skyUniforms.cloudElevation.value = 0.5;

	// The sky is rendered into an environment map so the water reflects it.
	const pmremGenerator = new THREE.PMREMGenerator(renderer);
	const sceneEnv = new THREE.Scene();
	let envTarget: THREE.WebGLRenderTarget | undefined;

	const daySunColor = new THREE.Color(0xffffff);
	const nightSunColor = new THREE.Color(0x6677aa);
	const dayWaterColor = new THREE.Color(0x001e0f);
	const nightWaterColor = new THREE.Color(0x000308);

	// Sun position from the visitor's local clock: rises 06:00, peaks 60° at 12:00, sets 18:00.
	// Azimuth sweeps 120°..240° so the sun stays near the view direction (180°).
	// `?hour=21.5` overrides the clock for testing.
	// Below -4° the light source switches to a moon mirrored above the horizon,
	// rendered with the same sky shader at low exposure.
	const updateTimeOfDay = () => {
		const now = new Date();
		const override = new URLSearchParams(location.search).get("hour");
		const hour = override ? Number(override) : now.getHours() + now.getMinutes() / 60;

		const sunElevation = 60 * Math.sin(((hour - 6) / 12) * Math.PI);
		const isNight = sunElevation < -4;
		const elevation = isNight ? Math.max(-sunElevation, 15) : sunElevation;
		const hoursSinceRise = isNight ? (hour + 6) % 24 : hour - 6;
		const azimuth = 120 + THREE.MathUtils.clamp(hoursSinceRise / 12, 0, 1) * 120;
		const daylight = THREE.MathUtils.smoothstep(sunElevation, -4, 8);

		const light = new THREE.Vector3().setFromSphericalCoords(
			1,
			THREE.MathUtils.degToRad(90 - elevation),
			THREE.MathUtils.degToRad(azimuth),
		);
		skyUniforms.sunPosition.value.copy(light);
		water.material.uniforms.sunDirection.value.copy(light).normalize();
		water.material.uniforms.sunColor.value.lerpColors(nightSunColor, daySunColor, daylight);
		water.material.uniforms.waterColor.value.lerpColors(nightWaterColor, dayWaterColor, daylight);
		renderer.toneMappingExposure = isNight ? 0.008 : THREE.MathUtils.lerp(0.02, 0.1, daylight);

		envTarget?.dispose();
		sceneEnv.add(sky);
		envTarget = pmremGenerator.fromScene(sceneEnv);
		scene.add(sky);
		scene.environment = envTarget.texture;
	};
	updateTimeOfDay();
	const clockInterval = setInterval(updateTimeOfDay, 60_000);

	const timer = new THREE.Timer();
	renderer.setAnimationLoop(() => {
		timer.update();
		camera.rotation.y += (-pointer.x * maxYaw - camera.rotation.y) * 0.03;
		camera.rotation.x += (-pointer.y * maxPitch - camera.rotation.x) * 0.03;
		water.material.uniforms.time.value += timer.getDelta();
		skyUniforms.time.value = performance.now() * 0.001;
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
		envTarget?.dispose();
		pmremGenerator.dispose();
		renderer.dispose();
		renderer.domElement.remove();
	};
});

onBeforeUnmount(() => dispose?.());
</script>

<template>
	<div ref="container" class="fixed inset-0 -z-10" aria-hidden="true" />
</template>
