<script setup lang="ts">
// Based on the three.js example webgl_shaders_ocean (r186).
import * as THREE from "three";
import { Water } from "three/addons/objects/Water.js";
import { Sky } from "three/addons/objects/Sky.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const container = ref<HTMLDivElement>();
const overlayCanvas = ref<HTMLCanvasElement>();
const veil = ref<HTMLDivElement>();
// Seconds into the story (see storm-cycle.ts). The dev slider moves it.
const cycle = ref(0);
// The look the page opens on, chosen by the owner for its sharpness and colour grading: late
// morning, a light sea, a strong storm sky and only the first threads of the weave. It holds
// until the "now", "live" or "play" links hand over to the clock, the live conditions or the story.
const OPENING = { hour: 11.05, weather: 0.08, weave: 0.11, storm: 0.69, bond: 0.9 };
// The weave (the channelling) and the storm (the weather) are separate things, both 0..1.
// The story sets them. Moving either dev slider stops the story and sets them by hand.
const followStory = ref(false);
const weaveLevel = ref(OPENING.weave);
const stormLevel = ref(OPENING.storm);
// 0..1 how far the channelling takes hold of the weather once the knot has formed. At 0 the fog,
// the air and the gusts follow the wind as in any storm; at 1 they all turn about the knot.
const bondLevel = ref(OPENING.bond);
const showFog = ref(true);
const showAir = ref(true);
const showThunder = ref(true);
// The dev sliders are hidden for now (the owner's request, for looks). Adding ?controls to the
// address brings them back.
const showControls = ref(false);
// Set by the navigation's pause button (WCAG 2.2.2): while true nothing is redrawn.
const motionPaused = useState("motion-paused", () => false);
// The navigation can show the place, time and conditions itself, in which case the caption here is left out.
const readout = useState<{ time: string; waves?: string; wind?: string }>("scene-readout", () => ({ time: "" }));
const captionInNavigation = useState("caption-in-navigation", () => false);
let dispose: (() => void) | undefined;

const clockHour = () => aotearoaHour();
// Time of day in Aotearoa in hours (0..24). The dev slider sets it and stops it following the clock.
const hour = ref(OPENING.hour);
const followClock = ref(false);
const hourLabel = computed(() => {
	const minutes = Math.round(hour.value * 60) % 1440;
	return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});
const resetToClock = () => {
	followClock.value = true;
	hour.value = clockHour();
};
// 0 = calm, 1 = storm. Used until the live conditions arrive, and when the dev slider overrides them.
const weather = ref(OPENING.weather);
const conditions = ref<SeaConditions>();
const followLive = ref(false);
const live = computed(() => (followLive.value ? conditions.value : undefined));
// The sea here is never calm: live conditions only move it between a gale and a full storm.
const STORM_FLOOR = 0.6;
const stormy = (state: number) => STORM_FLOOR + (1 - STORM_FLOOR) * state;
const seaAmount = computed(() => (live.value ? stormy(seaState(live.value)) : weather.value));
const skyAmount = computed(() => (live.value ? stormy(skyState(live.value)) : weather.value));

watchEffect(() => {
	readout.value = {
		time: hourLabel.value,
		waves: live.value && `${live.value.waveHeight.toFixed(1)} m`,
		wind: live.value && `${Math.round(live.value.windSpeed)} km/h`,
	};
});

onMounted(() => {
	showControls.value = new URLSearchParams(window.location.search).has("controls");
	const el = container.value!;
	const lerp = THREE.MathUtils.lerp;

	const renderer = new THREE.WebGLRenderer({ outputBufferType: THREE.HalfFloatType });
	// Beyond 2 the extra pixels cost a great deal and show very little.
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	el.appendChild(renderer.domElement);

	const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.1, 0, 0);
	renderer.setEffects([bloomPass]);

	const scene = new THREE.Scene();
	// Density is set each frame; 0 is no fog. Only the water is fogged, the veil covers the sky.
	const fog = new THREE.FogExp2(0x000000, 0);
	scene.fog = fog;
	const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
	// Height is set with the sea state, to stay above the crests.
	camera.position.set(0, 18, 100);
	camera.rotation.order = "YXZ";
	// Layer 1 holds what only this camera should see, not the water's mirror camera.
	const SCREEN_LAYER = 1;
	camera.layers.enable(SCREEN_LAYER);

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
		fog: true,
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
	const vortexUniforms = addSkyVortex(sky);

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

	// Sun position is the real one at Cape Reinga for the time shown. The camera looks along the
	// bearing to Hawai'i (scene azimuth 180°). The sun's angle off that bearing is halved, so it
	// rises to the right and sets to the left but stays near the view instead of going behind it.
	// The sky shader's light falls about 20x from noon to the horizon and is zero below
	// -2.3°, so day exposure is raised as the sun sets to keep dusk visible. At night the
	// sky keeps the real (set) sun and shows only its faint ambient term, at high exposure.
	// The moon is a separate light: a disc mesh plus the water's specular source.
	// Sky blends towards a storm sky: overcast, haze, grey light.
	// Sea blends towards a storm sea: longer and steeper waves, foam.
	const directionFrom = (elevation: number, azimuth: number) =>
		new THREE.Vector3().setFromSphericalCoords(
			1,
			THREE.MathUtils.degToRad(90 - elevation),
			THREE.MathUtils.degToRad(azimuth),
		);
	let steepness = 0.2;
	let cameraHeight = 18;
	let exposure = 1;
	let daylight = 1;
	// Where the sun and moon are and how high the sun is, for lighting the ship.
	let sunHeight = 45;
	const sunVector = new THREE.Vector3(0, 1, -1);
	const moonVector = new THREE.Vector3(0, 1, -1);
	const updateEnvironment = ([hour, sea, sky]: [number, number, number]) => {
		const realSun = sunPosition(dateAtAotearoaHour(hour));
		const sunElevation = realSun.elevation;
		const isNight = sunElevation < -2;
		const offBearing = ((realSun.azimuth - BEARING_TO_HAWAII + 540) % 360) - 180;
		const sunAzimuth = 180 - offBearing / 2;
		const moonElevation = THREE.MathUtils.clamp(-sunElevation * 0.35, 8, 20);
		const moonAzimuth = 120 + (((hour + 6) % 24) / 12) * 120;
		daylight = THREE.MathUtils.smoothstep(sunElevation, -2, 8);
		const night = THREE.MathUtils.smoothstep(-sunElevation, 2, 12);

		const sun = directionFrom(sunElevation, sunAzimuth);
		const moonDirection = directionFrom(moonElevation, moonAzimuth);
		skyUniforms.sunPosition.value.copy(sun);
		waterUniforms.sunDirection.value.copy(isNight ? moonDirection : sun);
		sunHeight = sunElevation;
		sunVector.copy(sun);
		moonVector.copy(moonDirection);
		moon.visible = isNight;
		moon.position.copy(moonDirection).multiplyScalar(4000).add(camera.position);
		moon.lookAt(camera.position);
		moon.material.opacity = night * lerp(1, 0.15, sky);

		skyUniforms.turbidity.value = lerp(2, 20, sky);
		skyUniforms.rayleigh.value = lerp(2, 0.5, sky);
		skyUniforms.mieCoefficient.value = lerp(0.002, 0.05, sky);
		skyUniforms.cloudCoverage.value = sky ** 0.8;
		skyUniforms.cloudDensity.value = lerp(0.3, 1, sky);

		// Storm colours are scaled like the night colours so a night storm stays dark.
		const brightness = lerp(0.05, 1, daylight);
		waterUniforms.sunColor.value
			.lerpColors(nightSunColor, daySunColor, daylight)
			.lerp(stormSunColor.clone().multiplyScalar(brightness), sky);
		waterUniforms.waterColor.value
			.lerpColors(nightWaterColor, dayWaterColor, daylight)
			.lerp(stormWaterColor.clone().multiplyScalar(brightness), sky);
		waterUniforms.distortionScale.value = lerp(2, 8, sea);
		steepness = lerp(0.15, 0.85, sea);
		waveUniforms.waveScale.value = lerp(0.6, 2.6, sea);
		// Storm crests reach about 25 units when the wave trains line up.
		cameraHeight = lerp(18, 27, THREE.MathUtils.smoothstep(sea, 0.4, 1));
		waveUniforms.foam.value = THREE.MathUtils.smoothstep(sea, 0.3, 1);

		const duskBoost = Math.min(5, (skySunIntensity(8) / Math.max(skySunIntensity(sunElevation), 1e-3)) ** 0.7);
		const clearExposure = isNight ? lerp(0.35, NIGHT_EXPOSURE, night) : 0.07 * Math.max(1, duskBoost);
		exposure = clearExposure * lerp(1, 0.5, sky);
	};
	const clockInterval = setInterval(() => {
		if (followClock.value) hour.value = clockHour();
	}, 60_000);

	// Keeps the last conditions if a request fails.
	const loadConditions = () =>
		fetchSeaConditions()
			.then((result) => (conditions.value = result))
			.catch(() => {});
	loadConditions();
	const conditionsInterval = setInterval(loadConditions, 15 * 60_000);

	const overlay = createStormOverlay(overlayCanvas.value!);
	const fluid = createFluid(renderer, scene, SCREEN_LAYER);
	const bolts = createLightning(scene);
	const fogTint = new THREE.Color();
	const pointerScreen = { x: 0.5, y: 0.5 };
	const strikeFrom = new THREE.Vector3();
	const strikeTo = new THREE.Vector3();
	const spread = THREE.MathUtils.randFloatSpread;
	const ship = createShip(scene);
	const shipSun = new THREE.Color();
	const shipAmbient = new THREE.Color();
	const fireScreen = { x: 0.5, y: 0.5, strength: 0 };
	const boltScreen = Array.from({ length: BOLT_POINTS }, () => ({ x: 0, y: 0 }));
	// Watches the frame rate and gives the fluid less work if the machine is struggling
	// (0 full, 2 lightest), then more again once it has kept up for a while.
	let quality = 0;
	let frameAverage = 1 / 60;
	let sinceQualityChange = 0;
	const watchFrameRate = (delta: number) => {
		frameAverage += (Math.min(delta, 0.1) - frameAverage) * 0.05;
		sinceQualityChange += delta;
		if (sinceQualityChange < 3) return;
		if (frameAverage > 1 / 42 && quality < 2) quality++;
		else if (frameAverage < 1 / 57 && quality > 0 && sinceQualityChange > 12) quality--;
		else return;
		sinceQualityChange = 0;
	};

	// Lightning: a double flash of the whole scene with a bolt. Strikes are at least two seconds
	// apart even at the height of the storm, so it never strobes.
	// Skipped, with the ship's sway and the rain, for visitors who ask for reduced motion.
	const calmMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	let strikeAt = 4;
	let struck = 0;
	const lightning = (time: number, sky: number, fury: number) => {
		if (calmMotion || !showThunder.value || sky < 0.5) return 0;
		if (time > strikeAt + 1) strikeAt = time + lerp(lerp(14, 5, sky), 1.8, fury) * lerp(0.7, 1.4, Math.random());
		if (time < strikeAt) return 0;
		if (struck !== strikeAt) {
			struck = strikeAt;
			// Down from the knot once it has formed. Until then the weave under the sea breaks out
			// upward: the bolt rises from the water into the cloud.
			if (knotReady) {
				strikeFrom.copy(knotPosition);
				strikeTo.set(knotPosition.x + spread(700), 0, knotPosition.z + spread(700) + 100);
			} else {
				strikeTo.set(spread(1200), 0, -700 + spread(900));
				strikeFrom.set(strikeTo.x + spread(400), 800, strikeTo.z - 200 + spread(300));
			}
			bolts.strike(strikeFrom, strikeTo, time, !knotReady);
		}
		// The sky lights when the leader has reached the sea and the return stroke fires.
		const since = time - strikeAt - LIGHTNING_LEADER_TIME;
		if (since < 0) return 0;
		return Math.exp(-since / 0.07) + (since > 0.2 ? 0.7 * Math.exp(-(since - 0.2) / 0.18) : 0);
	};

	// Colours as they should appear on screen.
	const nightMist = new THREE.Color(0x10161d);
	const dayFog = new THREE.Color(0x2b3844);
	const dayVoid = new THREE.Color(0xc4c8cc);
	const white = new THREE.Color(0xffffff);
	const mist = new THREE.Color();
	// The knot of the weave hangs over the sea straight ahead, about 15° above the horizon.
	const knotPosition = new THREE.Vector3(0, 250, -800);
	const weave = createWeave(scene, camera, knotPosition);
	waveUniforms.weaveCentre.value.set(knotPosition.x, knotPosition.z);
	const projected = new THREE.Vector3();
	const knotScreen = { x: 0.5, y: 0.25 };
	const horizonScreen = { x: 0.5, y: 0.5 };
	const horizonAhead = { x: 0.5, y: 0.5 };
	// Writes where a world position falls on screen (0..1) into target.
	const toScreen = (x: number, y: number, z: number, target: { x: number; y: number }) => {
		projected.set(x, y, z).project(camera);
		target.x = (projected.x + 1) / 2;
		target.y = (1 - projected.y) / 2;
	};
	const knotGlow = new THREE.Color(0xbcd6ff);
	let knotReady = false;

	const timer = new THREE.Timer();
	let drawnOnce = false;
	renderer.setAnimationLoop(() => {
		// The timer is still updated while paused, so that motion resumes without a jump in speed.
		timer.update();
		// One frame is always drawn first, so a visitor who starts paused sees a still sea, not a blank.
		// On a reading page the sheet scrolls up over the ocean. Once it covers the whole window
		// there is nothing to draw, and a long read should not cost the reader's battery.
		const covered = window.scrollY > window.innerHeight * 0.38 + 72;
		if ((motionPaused.value || covered) && drawnOnce) return;
		drawnOnce = true;
		const time = timer.getElapsed();
		const delta = timer.getDelta();
		watchFrameRate(delta);
		const air = ambientAir(live.value);
		// By hand, the story stands still and its white-out and stillness are left out.
		let moment: StormMoment;
		if (followStory.value) {
			cycle.value = (cycle.value + delta) % STORM_CYCLE_LENGTH;
			moment = stormMoment(cycle.value);
			weaveLevel.value = moment.weave;
			stormLevel.value = moment.fury;
		} else {
			moment = { weave: weaveLevel.value, fury: stormLevel.value, stillness: 0, veil: 0, white: 0 };
		}
		const { fury } = moment;
		const alive = 1 - moment.stillness;
		// The weaving moves the sea before the weather does: the waves rise with the weave, and the storm takes them further.
		const sea = lerp(seaAmount.value, 1, Math.max(fury, 0.7 * THREE.MathUtils.smoothstep(moment.weave, 0.1, 0.9)));
		const sky = lerp(skyAmount.value, 1, fury);
		updateEnvironment([hour.value, sea, sky]);

		// At the height of the storm giant swells rise under the ordinary waves, which give up
		// some steepness so the crests don't fold over themselves.
		const surge = 0.55 * fury;
		// The wind never holds steady: the whole sea swells and eases over a minute or two.
		const lull = 0.5 * Math.sin(time * 0.11) + 0.5 * Math.sin(time * 0.047 + 1.3);
		waveUniforms.surge.value = surge;
		waveUniforms.waveSteepness.value = steepness * (1 + 0.2 * lull) * (1 - 0.3 * fury) * alive;
		waveUniforms.gustiness.value = 0.8 * alive;
		waveUniforms.foam.value *= alive;
		waterUniforms.distortionScale.value *= lerp(0.15, 1, alive);

		// In heavy seas the view heaves, pitches and rolls like a ship's deck, and rides the giant swells.
		const sway = calmMotion ? 0 : THREE.MathUtils.smoothstep(sea, 0.3, 1) * (1 + 0.6 * fury) * alive;
		const heave = sway * (2 * Math.sin(time * 0.45) + Math.sin(time * 0.71 + 2));
		const pitch = sway * 0.035 * Math.sin(time * 0.52 + 1);
		const swell = giantWaveHeight(camera.position.x, camera.position.z, time, surge);
		camera.position.y += (cameraHeight + swell + heave - camera.position.y) * 0.05;
		camera.rotation.z = sway * (0.06 * Math.sin(time * 0.33) + 0.025 * Math.sin(time * 0.83 + 0.7));
		camera.rotation.y += (-pointer.x * maxYaw - camera.rotation.y) * 0.03;
		camera.rotation.x += (-pointer.y * maxPitch + pitch - camera.rotation.x) * 0.03;

		const flash = alive > 0.5 ? lightning(time, sky, fury) : 0;
		// The storm darkens the day. At night it is lifted instead, or the sea would be lost in black.
		const steadyExposure = exposure * lerp(1, lerp(2.5, 0.6, daylight), fury);
		renderer.toneMappingExposure = steadyExposure * (1 + 5 * flash) * (1 + 4 * moment.white * moment.veil);

		// Fog thickens with the storm and fills the stillness. The fog colour is set before tone
		// mapping, so it is divided by the exposure to land on the intended screen colour.
		const stormFog = showFog.value ? 0.8 * THREE.MathUtils.smoothstep(fury, 0.2, 1) * air.fogginess : 0;
		const fogAmount = Math.max(stormFog, moment.stillness);
		mist.lerpColors(nightMist, dayFog, daylight);
		fog.density = 0.0025 * fogAmount;
		fog.color.copy(mist).multiplyScalar(1 / steadyExposure);
		fogTint.copy(mist);
		mist.lerp(mist.clone().lerpColors(nightMist, dayVoid, daylight), moment.stillness);
		mist.lerp(white, Math.max(moment.white, Math.min(1, 0.4 * flash)));
		veil.value!.style.backgroundColor = mist.getStyle();
		veil.value!.style.opacity = String(Math.max(0.15 * fogAmount, moment.veil));

		const liveRain = live.value && live.value.precipitation > 0 ? 0.4 : 0;
		const rain = calmMotion ? 0 : Math.max(THREE.MathUtils.smoothstep(fury, 0.15, 0.6), liveRain) * alive;
		// The weave, and what its knot does to the sea and the clouds around it.
		const formed = knotFormed(moment.weave);
		knotReady = formed > 0.8;
		// The bond: how far the channelling has taken hold of the storm's wind, air and fog.
		const bond = bondLevel.value * formed * alive;
		weave.update({
			time,
			delta,
			amount: moment.weave,
			spread: fury + 2 * moment.white * moment.veil,
			gain: 0.5 / steadyExposure,
		});
		waveUniforms.weavePull.value = formed * (0.6 + 0.8 * fury);
		vortexUniforms.knotDirection.value.subVectors(knotPosition, camera.position).normalize();
		vortexUniforms.vortex.value = formed;
		vortexUniforms.vortexTwist.value = formed > 0 ? vortexUniforms.vortexTwist.value + delta * 0.1 * (0.3 + fury) * bond : 0;
		waveUniforms.gustSwirl.value = bond;
		// The weave under the sea is always there, breathing slowly, and brightens as the weave is worked.
		waveUniforms.weaveGlow.value = ((0.3 + 0.9 * moment.weave) * (0.75 + 0.25 * Math.sin(time * 0.9)) * alive * 1.3) / steadyExposure;

		// The ship's light. Direct light is the sun's by day (orange when it is low) and the
		// moon's by night, and little of either gets through storm cloud. The rest is skylight.
		const lowSun = THREE.MathUtils.smoothstep(sunHeight, 2, 28);
		const cloud = lerp(1, 0.25, sky);
		shipSun
			.setRGB(1, lerp(0.5, 0.97, lowSun), lerp(0.25, 0.9, lowSun))
			.multiplyScalar(0.95 * daylight * cloud);
		shipSun.r += 0.1 * (1 - daylight) * cloud;
		shipSun.g += 0.13 * (1 - daylight) * cloud;
		shipSun.b += 0.2 * (1 - daylight) * cloud;
		shipAmbient.setRGB(lerp(0.035, 0.42, daylight), lerp(0.05, 0.5, daylight), lerp(0.085, 0.6, daylight)).multiplyScalar(lerp(1, 0.6, sky));
		// She shows us one side. The light is behind her when it lies beyond her from here, and
		// matters less the higher it stands.
		const lamp = daylight > 0.5 ? sunVector : moonVector;
		const backlit = THREE.MathUtils.clamp(-lamp.z / (Math.hypot(lamp.x, lamp.z) || 1), 0, 1) * (1 - 0.6 * THREE.MathUtils.smoothstep(sunHeight, 30, 70));
		const voyage = ship.update({
			time,
			delta,
			ambient: shipAmbient,
			sun: shipSun,
			backlit,
			haze: fogTint,
			hazeAmount: THREE.MathUtils.clamp(0.1 + 0.55 * stormFog, 0, 0.7),
			gain: 1 / steadyExposure,
			wind: sea * alive,
			gust: lull,
			rain,
			swell: (x, z) => giantWaveHeight(x, z, time, surge),
		});
		// What the weave is doing in the sea under her bow.
		waveUniforms.burst.value.set(voyage.under.x, voyage.under.z, voyage.under.height, voyage.under.glow);
		waveUniforms.burstLight.value = (1.6 * voyage.under.glow) / steadyExposure;
		waveUniforms.freshFlow.value = alive;
		waveUniforms.internalWaves.value = (0.5 + 0.5 * moment.weave) * alive;
		waveUniforms.shipWake.value.copy(voyage.wake);
		toScreen(voyage.fire.position.x, voyage.fire.position.y, voyage.fire.position.z, fireScreen);
		fireScreen.strength = voyage.fire.strength;
		vortexUniforms.vortexSpin.value = time * 0.8;
		vortexUniforms.vortexGlow.value.copy(knotGlow).multiplyScalar((0.06 * formed) / steadyExposure);
		toScreen(knotPosition.x, knotPosition.y, knotPosition.z, knotScreen);
		toScreen(camera.position.x, 0, camera.position.z - 8000, horizonScreen);
		// Where the horizon crosses the middle of the screen, and its tilt, for the navigation to stand on.
		toScreen(camera.position.x - Math.sin(camera.rotation.y) * 8000, 0, camera.position.z - Math.cos(camera.rotation.y) * 8000, horizonAhead);
		document.documentElement.style.setProperty("--horizon", `${(horizonAhead.y * 100).toFixed(2)}vh`);
		document.documentElement.style.setProperty("--roll", `${camera.rotation.z.toFixed(4)}rad`);
		overlay.draw(delta, rain, flash, camera.rotation.z * 0.5, bond, knotScreen);
		const strike = bolts.update(time, 4 / steadyExposure, air.vapour, stormFog);
		if (strike > 0) {
			for (let i = 0; i < BOLT_POINTS; i++) {
				const point = bolts.pathPoint(i, BOLT_POINTS)!;
				toScreen(point.x, point.y, point.z, boltScreen[i]!);
			}
		}
		pointerScreen.x = (pointer.x + 1) / 2;
		pointerScreen.y = (pointer.y + 1) / 2;
		fluid.step({
			delta,
			time,
			// The fog banks stay out of the stillness, which has its own even veil.
			fog: stormFog * alive,
			air: showAir.value && !calmMotion ? lerp(0.25, 1, fury) * sea * alive : 0,
			wind: sea * alive,
			strike,
			bolt: boltScreen,
			vapour: air.vapour,
			instability: air.instability,
			fire: fireScreen,
			quality,
			bond,
			// The threads drag the air after them while they race for the knot, and a little once they are laid.
			charge: (Math.sin(Math.PI * Math.min(1, moment.weave / 0.5)) + 0.25 * formed) * alive,
			knot: knotScreen,
			horizon: horizonScreen,
			pointer: pointerScreen,
			fogColour: fogTint,
			gain: 1 / steadyExposure,
		});

		waterUniforms.time.value += delta * lerp(0.6, 2, sea) * alive;
		waveUniforms.waveTime.value = time;
		skyUniforms.time.value += delta * lerp(1, 4, sky) * (1 + 2 * fury);
		renderer.render(scene, camera);
	});

	const onResize = () => {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
		overlay.resize();
	};
	window.addEventListener("resize", onResize);

	dispose = () => {
		window.removeEventListener("resize", onResize);
		window.removeEventListener("pointermove", onPointerMove);
		clearInterval(clockInterval);
		clearInterval(conditionsInterval);
		fluid.dispose();
		renderer.setAnimationLoop(null);
		renderer.dispose();
		renderer.domElement.remove();
	};
});

onBeforeUnmount(() => dispose?.());
</script>

<template>
	<div ref="container" class="fixed inset-0 -z-10" aria-hidden="true">
		<div ref="veil" class="pointer-events-none absolute inset-0 z-10 opacity-0" />
		<canvas ref="overlayCanvas" class="pointer-events-none absolute inset-0 z-20 h-full w-full" />
	</div>
	<!-- Client only: the server's clock and time zone differ from the visitor's. -->
	<ClientOnly>
		<div
			v-if="showControls"
			class="fixed top-4 right-4 z-30 grid grid-cols-[auto_12rem_auto] items-center gap-x-3 gap-y-2 rounded bg-black/50 px-3 py-2 font-mono text-sm text-white"
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
			<input
				id="ocean-weather"
				v-model.number="weather"
				type="range"
				min="0"
				max="1"
				step="0.001"
				@input="followLive = false"
			/>
			<span>
				{{ Math.round(seaAmount * 100) }}%
				<button v-if="!followLive" type="button" class="underline" @click="followLive = true">live</button>
			</span>

			<label for="ocean-cycle">story</label>
			<input
				id="ocean-cycle"
				v-model.number="cycle"
				type="range"
				min="0"
				:max="STORM_CYCLE_LENGTH"
				step="0.1"
				@input="followStory = true"
			/>
			<span>
				{{ Math.round(cycle) }} s
				<button v-if="!followStory" type="button" class="underline" @click="followStory = true">play</button>
			</span>

			<label for="ocean-weave">weave</label>
			<input
				id="ocean-weave"
				v-model.number="weaveLevel"
				type="range"
				min="0"
				max="1"
				step="0.001"
				@input="followStory = false"
			/>
			<span>{{ Math.round(weaveLevel * 100) }}%</span>

			<label for="ocean-storm">storm</label>
			<input
				id="ocean-storm"
				v-model.number="stormLevel"
				type="range"
				min="0"
				max="1"
				step="0.001"
				@input="followStory = false"
			/>
			<span>{{ Math.round(stormLevel * 100) }}%</span>

			<label for="ocean-bond">bond</label>
			<input id="ocean-bond" v-model.number="bondLevel" type="range" min="0" max="1" step="0.001" />
			<span>{{ Math.round(bondLevel * 100) }}%</span>

			<div class="col-span-3 flex gap-4">
				<label><input v-model="showFog" type="checkbox" /> fog</label>
				<label><input v-model="showAir" type="checkbox" /> air</label>
				<label><input v-model="showThunder" type="checkbox" /> thunder</label>
			</div>
		</div>
		<!-- On an opaque ground, so the text keeps its contrast whatever the sky is doing. -->
		<p v-if="!captionInNavigation" class="fixed top-0 right-0 z-10 max-w-[60vw] bg-[#041318] px-3 py-2 text-right text-sm text-[#c9f6f3]">
			Te Rerenga Wairua · Cape Reinga, looking towards Hawaiʻi · {{ hourLabel }}
			<template v-if="live">
				· waves {{ live.waveHeight.toFixed(1) }} m · wind {{ Math.round(live.windSpeed) }} km/h
			</template>
			<br />
			<a href="https://open-meteo.com/" class="underline" target="_blank" rel="noopener">Weather data by Open-Meteo</a>
		</p>
	</ClientOnly>
</template>
