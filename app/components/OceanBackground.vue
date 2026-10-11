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
// The page opens on the sea as it is now where the boat is: the boat's clock and the live
// conditions there. Only the weave is still set by hand.
const OPENING = { weather: 0.3, weave: 0.11, storm: 0, bond: 0.9 };
// September's opening look, chosen by the owner for its sharpness and colour grading: late
// morning, a light sea, a strong storm sky and the first threads of the weave. ?look=september
// shows it; it holds until the "now", "live" or "play" links are used.
const SEPTEMBER = { hour: 11.05, weather: 0.08, weave: 0.11, storm: 0.69, bond: 0.9 };
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
const readout = useState<{ place?: string; time: string; waves?: string; wind?: string }>("scene-readout", () => ({ time: "" }));
const captionInNavigation = useState("caption-in-navigation", () => false);
let dispose: (() => void) | undefined;

const clockHour = () => boatHour();
// Time of day on the boat in hours (0..24). The dev slider sets it and stops it following the clock.
const hour = ref(clockHour());
const followClock = ref(true);
// A day other than today, for trying (?date=).
const pretendDate = ref<Date>();
// Where the boat is at the time shown, in words.
const placeLabel = computed(() => {
	const boat = boatAt(dateAtBoatHour(hour.value, pretendDate.value ?? new Date()));
	const degrees = (value: number, plus: string, minus: string) => `${Math.abs(value).toFixed(1)}° ${value >= 0 ? plus : minus}`;
	const where = `${degrees(boat.latitude, "N", "S")}, ${degrees(boat.longitude, "E", "W")}`;
	const km = (value: number) => `${Math.round(value).toLocaleString("en-GB")} km`;
	if (boat.done <= 0) return `Manawatāwhi, Three Kings Islands (${where})`;
	if (boat.done >= 1) return `Hawaiʻi (${where})`;
	return `At sea, ${where}: ${km(boat.gone)} out from Manawatāwhi, ${km(boat.left)} to Hawaiʻi`;
});
const hourLabel = computed(() => {
	const minutes = Math.round(hour.value * 60) % 1440;
	return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});
// The time with what it is the time of: people's clock time, as against the sun's.
const timeLabel = computed(() => `${hourLabel.value} (${boatTimeZone(dateAtBoatHour(hour.value, pretendDate.value ?? new Date()))})`);
const resetToClock = () => {
	followClock.value = true;
	hour.value = clockHour();
};
// 0 = calm, 1 = storm. Used until the live conditions arrive, and when the dev slider overrides them.
const weather = ref(OPENING.weather);
// Shared, so the menu's figure can draw the weather too.
const conditions = useState<SeaConditions | undefined>("sea-conditions", () => undefined);
// The moment shown, for the same reason.
const shownAt = useState("scene-moment", () => Date.now());
// The weather and storm sliders stop the picture following the live conditions; "live" resumes it.
const followLive = ref(true);
// September's light was staged: the sun kept near the view, and a full moon up every night.
// ?look=september keeps it. Otherwise the sun and moon are where they really are.
const stagedLight = ref(false);
const live = computed(() => (followLive.value ? conditions.value : undefined));
// The server fetches the conditions too and sends the page out with them already in it, so the
// first sea a visitor sees is the real one. (Where there is no server the page asks for itself.)
const { data: served } = useFetch<SeaConditions>("/api/conditions", { key: "sea-conditions-served" });
if (served.value && !conditions.value) conditions.value = served.value;
const seaAmount = computed(() => (live.value ? seaState(live.value) : weather.value));
const skyAmount = computed(() => (live.value ? skyState(live.value) : weather.value));
const wavesLabel = computed(
	() => live.value && `${live.value.waveHeight.toFixed(1)} m from the ${compassPoint(live.value.waveDirection)}, every ${Math.round(live.value.wavePeriod)} s`,
);
const windLabel = computed(
	() => live.value && `${Math.round(live.value.windSpeed)} km/h from the ${compassPoint(live.value.windDirection)}, gusts ${Math.round(live.value.windGusts)}`,
);
// How far the weather models are apart on a figure, when they are.
const between = (doubt?: [number, number]) => (doubt && doubt[1] - doubt[0] >= 1 ? ` (models ${doubt[0].toFixed(0)} to ${doubt[1].toFixed(0)})` : "");
// Every live figure, for checking the picture against the data in the dev panel.
const liveFigures = computed(() => {
	const c = conditions.value;
	if (!c) return [];
	return [
		["as of", `${c.observedAt.slice(11)} UTC`],
		["waves", `${c.waveHeight.toFixed(1)} m · ${compassPoint(c.waveDirection)} · ${c.wavePeriod.toFixed(0)} s`],
		["swell", `${c.swellHeight.toFixed(1)} m · ${compassPoint(c.swellDirection)} · ${c.swellPeriod.toFixed(0)} s`],
		["2nd swell", `${c.secondSwellHeight.toFixed(1)} m · ${compassPoint(c.secondSwellDirection)} · ${c.secondSwellPeriod.toFixed(0)} s`],
		["wind sea", `${c.windWaveHeight.toFixed(1)} m · ${compassPoint(c.windWaveDirection)} · ${c.windWavePeriod.toFixed(0)} s`],
		["wind", `${c.windSpeed.toFixed(0)} km/h · ${compassPoint(c.windDirection)} · gusts ${c.windGusts.toFixed(0)}${between(c.doubt.windSpeed)}`],
		["current", `${c.currentSpeed.toFixed(1)} km/h to ${compassPoint(c.currentDirection)}`],
		["tide", `${c.tide.toFixed(2)} m`],
		["cloud", `low ${c.cloudLow.toFixed(0)}%${between(c.doubt.cloudLow)} · mid ${c.cloudMid.toFixed(0)}% · high ${c.cloudHigh.toFixed(0)}%`],
		["rain", `${(c.precipitation * 4).toFixed(1)} mm/h`],
		["visibility", `${(c.visibility / 1000).toFixed(1)} km`],
		["thunder", `code ${c.weatherCode} · ${c.cape.toFixed(0)} J/kg`],
		["pressure", `${c.pressure.toFixed(0)} hPa`],
		["air · sea", `${c.airTemperature.toFixed(1)} °C · ${c.seaTemperature.toFixed(1)} °C · ${c.humidity}%`],
		["next 3 h", `wind ${c.windTrend >= 0 ? "+" : ""}${c.windTrend.toFixed(0)} km/h · waves ${c.waveTrend >= 0 ? "+" : ""}${c.waveTrend.toFixed(1)} m · pressure ${c.pressureTrend >= 0 ? "+" : ""}${c.pressureTrend.toFixed(1)} hPa`],
		["picture", `sea ${Math.round(seaState(c) * 100)}% · sky ${Math.round(skyState(c) * 100)}% · storm ${Math.round(stormFury(c) * 100)}%`],
		["channellers", `building ${Math.round(building(c) * 100)}% · called for ${Math.round(calling(c) * 100)}%`],
		["pace", `carried ${carried(c, PLACE.bearing).toFixed(1)} km/h · needs ${PACE.toFixed(1)} · holding back ${Math.round(holdingBack(c, PLACE.bearing) * 100)}%`],
		["storm", `linked on the waves ${Math.round(stormy(c) * 100)}%`],
		["unusual", `air ${Math.round(unusual(c).air * 100)}% · water ${Math.round(unusual(c).water * 100)}% (the strongest attends to 84% of it, and looks into it when that passes 50%)`],
		["strongest", `${Math.round((1 - strengthBelow(c, PLACE.bearing)) * 100)}% ahead (${calling(c) >= 0.6 ? "linked" : "not linked"}) · ${Math.round(strengthBelow(c, PLACE.bearing) * 100)}% below, round the boat`],
		["tomorrow", `wind ${c.tomorrowWindSpeed.toFixed(0)} km/h from the ${compassPoint(c.tomorrowWindDirection)} · quiet enough to scout ${Math.round(quietEnoughToScout(c) * 100)}%`],
		["air", thermal(c) > 0.1 ? `sea warmer by ${(c.seaTemperature - c.airTemperature).toFixed(1)} °C: thermals ${Math.round(thermal(c) * 100)}%` : thermal(c) < -0.1 ? `air warmer by ${(c.airTemperature - c.seaTemperature).toFixed(1)} °C: still, layered ${Math.round(-thermal(c) * 100)}%` : "sea and air alike: neither rising nor layered"],
	];
});

watchEffect(() => {
	shownAt.value = dateAtBoatHour(hour.value, pretendDate.value ?? new Date()).getTime();
	readout.value = { place: placeLabel.value, time: timeLabel.value, waves: wavesLabel.value, wind: windLabel.value };
});

onMounted(() => {
	const query = new URLSearchParams(window.location.search);
	showControls.value = query.has("controls");
	// For seeing another time of day without the panel: ?hour=22 (or 21.5 for half past nine).
	if (query.has("hour")) {
		followClock.value = false;
		hour.value = Number(query.get("hour"));
	}
	if (query.get("look") === "september") {
		followClock.value = followLive.value = false;
		stagedLight.value = true;
		hour.value = SEPTEMBER.hour;
		weather.value = SEPTEMBER.weather;
		weaveLevel.value = SEPTEMBER.weave;
		stormLevel.value = SEPTEMBER.storm;
		bondLevel.value = SEPTEMBER.bond;
	}
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
	// It starts at the height of the boat's deck, where the live picture keeps it. (It used to
	// start at September's 18 m and sink to the boat in the first second: the "duck" on loading.)
	camera.position.set(0, 5, 100);
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

	// The moon's face, drawn for its phase with the lit edge to the right; the disc is then turned
	// so that edge faces the sun. Redrawn only when the phase has moved on.
	const moonCanvas = document.createElement("canvas");
	moonCanvas.width = moonCanvas.height = 128;
	const moonFace = new THREE.CanvasTexture(moonCanvas);
	let drawnPhase = -1;
	const drawMoon = (illuminated: number) => {
		if (Math.abs(illuminated - drawnPhase) < 0.004) return;
		drawnPhase = illuminated;
		const context = moonCanvas.getContext("2d")!;
		context.clearRect(0, 0, 128, 128);
		context.beginPath();
		// The lit edge is half a circle. The line between light and dark is half an ellipse:
		// on the lit side of the middle for a crescent, on the dark side for a gibbous moon.
		context.arc(64, 64, 62, -Math.PI / 2, Math.PI / 2);
		context.ellipse(64, 64, 62 * Math.abs(1 - 2 * illuminated), 62, 0, Math.PI / 2, -Math.PI / 2, illuminated < 0.5);
		context.fillStyle = "#fff";
		context.fill();
		moonFace.needsUpdate = true;
	};
	// Moon disc at its true size, half a degree wide (September's was 2°). Not tone-mapped so it
	// stays bright at night exposure; the water's mirror reflection picks it up as a moon path.
	const moon = new THREE.Mesh(
		new THREE.CircleGeometry(1, 48),
		new THREE.MeshBasicMaterial({ color: 0xf4f1e8, map: moonFace, toneMapped: false, transparent: true, fog: false }),
	);
	scene.add(moon);
	const towardsSun = new THREE.Vector3();

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

	// The sun and moon are where they really are over the boat for the time shown, and the moon
	// shows its real phase. The camera looks along the bearing to Hawai'i (scene azimuth 180°), so
	// for much of the day the sun is out of the picture, and with no moon up the night is dark.
	// (September halved the sun's angle off the bearing to keep it near the view, and hung a
	// full moon in every night: stagedLight.)
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
	// 0..1 how far the four channellers are at work: at night, in the days about the new moon.
	let darkness = 0;
	// 0..1 how far night has fallen.
	let nightfall = 0;
	// 0..1 how far it is dawn or dusk: then all thirteen channellers link.
	let gathering = -1;
	let skyLight = 0;
	let gatheringNow = 0;
	let skyLightNow = 0;
	// The moment shown, and 0..1 how far the stars are out at it.
	let shownMoment = new Date();
	let starsOut = 0;
	let milkyWayOut = 0;
	const updateEnvironment = ([hour, sea, sky]: [number, number, number]) => {
		const when = dateAtBoatHour(hour, pretendDate.value ?? new Date());
		// The boat is wherever its voyage has brought it by then.
		sailTo(when);
		const realSun = sunPosition(when);
		const sunElevation = realSun.elevation;
		const isNight = sunElevation < -2;
		const staged = stagedLight.value;
		// Scene azimuth of a compass direction.
		const offBearing = (azimuth: number) => ((azimuth - PLACE.bearing + 540) % 360) - 180;
		const sunAzimuth = 180 - offBearing(realSun.azimuth) / (staged ? 2 : 1);
		const realMoon = staged
			? { elevation: isNight ? THREE.MathUtils.clamp(-sunElevation * 0.35, 8, 20) : -90, azimuth: 0, illuminated: 1 }
			: moonPosition(when);
		const moonAzimuth = staged ? 120 + (((hour + 6) % 24) / 12) * 120 : 180 - offBearing(realMoon.azimuth);
		daylight = THREE.MathUtils.smoothstep(sunElevation, -2, 8);
		const night = THREE.MathUtils.smoothstep(-sunElevation, 2, 12);
		// 0..1 how much moonlight there is. It falls off far faster than the lit share of the face:
		// a half moon gives less than a tenth of a full moon's light. And none from below the horizon.
		const moonlight = realMoon.illuminated ** 3.5 * THREE.MathUtils.smoothstep(realMoon.elevation, -1, 8);

		shownMoment = when;
		nightfall = staged ? 0 : night;
		// Dawn and dusk (the owner's): from the sun 9 degrees under the horizon to 8 degrees over it,
		// about an hour and a half each, there is most qi in the air, and they all link to draw on it.
		// (The clock moves the sun once a minute, so both of these are eased, or the weaving would
		// change in steps: the owner saw it "suddenly get blurrier" at first light.)
		gatheringNow = staged ? 0 : THREE.MathUtils.smoothstep(sunElevation, -9, -5) * (1 - THREE.MathUtils.smoothstep(sunElevation, 3, 8));
		// 0..1 how light the sky itself is. It is still dark when they first link before dawn, and
		// only a light sky calls for soft filaments.
		skyLightNow = staged ? 1 : THREE.MathUtils.smoothstep(sunElevation, -6, 3);

		// Stars need a dark sky: they are drowned by a bright moon and hidden by cloud. (The cloud
		// here dims them all alike; it cannot yet hide the ones behind each cloud.)
		starsOut = staged ? 0 : night * (1 - 0.6 * moonlight) * (1 - sky ** 0.8);
		// The Milky Way needs full night and goes with any moon worth the name.
		milkyWayOut = starsOut * THREE.MathUtils.smoothstep(-sunElevation, 12, 18) * (1 - Math.min(1, 4 * moonlight));
		// The four work only in the phase when the moon's light is weakest: fully while less than
		// a tenth of its face is lit (about three days either side of new), not at all past a quarter.
		darkness = staged ? 0 : night * (1 - THREE.MathUtils.smoothstep(realMoon.illuminated, 0.1, 0.25));

		const sun = directionFrom(sunElevation, sunAzimuth);
		const moonDirection = directionFrom(realMoon.elevation, moonAzimuth);
		skyUniforms.sunPosition.value.copy(sun);
		waterUniforms.sunDirection.value.copy(isNight && moonlight > 0 ? moonDirection : sun);
		// By day the moon is a pale mark in the sky; a new moon cannot be seen at all.
		moon.visible = realMoon.elevation > -1 && realMoon.illuminated > 0.01;
		moon.position.copy(moonDirection).multiplyScalar(4000).add(camera.position);
		moon.scale.setScalar(staged ? 70 : 4000 * Math.tan(THREE.MathUtils.degToRad(0.26)));
		moon.lookAt(camera.position);
		drawMoon(realMoon.illuminated);
		towardsSun.copy(sun).applyQuaternion(moon.quaternion.clone().invert());
		moon.rotateZ(Math.atan2(towardsSun.y, towardsSun.x));
		moon.material.opacity = lerp(0.35, 1, night) * lerp(1, 0.15, sky);

		skyUniforms.turbidity.value = lerp(2, 20, sky);
		skyUniforms.rayleigh.value = lerp(2, 0.5, sky);
		skyUniforms.mieCoefficient.value = lerp(0.002, 0.05, sky);
		skyUniforms.cloudCoverage.value = sky ** 0.8;
		skyUniforms.cloudDensity.value = lerp(0.3, 1, sky);

		// Storm colours are scaled like the night colours so a night storm stays dark.
		const brightness = lerp(0.05, 1, daylight);
		waterUniforms.sunColor.value
			.lerpColors(nightSunColor.clone().multiplyScalar(moonlight), daySunColor, daylight)
			.lerp(stormSunColor.clone().multiplyScalar(brightness), sky);
		waterUniforms.waterColor.value
			.lerpColors(nightWaterColor.clone().multiplyScalar(lerp(0.15, 1, moonlight)), dayWaterColor, daylight)
			.lerp(stormWaterColor.clone().multiplyScalar(brightness), sky);
		waterUniforms.distortionScale.value = lerp(2, 8, sea);
		steepness = lerp(0.15, 0.85, sea);
		waveUniforms.waveScale.value = lerp(0.6, 2.6, sea);
		// Storm crests reach about 25 units when the wave trains line up.
		cameraHeight = lerp(18, 27, THREE.MathUtils.smoothstep(sea, 0.4, 1));
		waveUniforms.foam.value = THREE.MathUtils.smoothstep(sea, 0.3, 1);

		const duskBoost = Math.min(5, (skySunIntensity(8) / Math.max(skySunIntensity(sunElevation), 1e-3)) ** 0.7);
		// Without the moon there is only starlight, about an eighth of what a full moon gives the picture.
		const clearExposure = isNight ? lerp(0.35, NIGHT_EXPOSURE * lerp(0.12, 1, moonlight), night) : 0.07 * Math.max(1, duskBoost);
		// The exposure was set with the sun in the picture. Now that it may be anywhere, the eye
		// opens up as it looks away from it, as an eye or a camera does: up to about a stop and a half.
		const awayFromSun = staged || isNight ? 0 : (1 + sun.z * Math.hypot(sun.x, sun.z)) / 2;
		exposure = clearExposure * lerp(1, 0.5, sky) * lerp(1, 2.8, awayFromSun);
	};
	const clockInterval = setInterval(() => {
		if (followClock.value) hour.value = clockHour();
	}, 60_000);

	// Keeps the last conditions if a request fails.
	// For seeing another day: ?date=2026-10-26 (a full moon) or ?date=2027-03-01 (the boat near the
	// equator). The sun, moon and stars are that day's and the boat is where it will be; the
	// weather is today's forecast for that spot.
	// A trial the owner is weighing: ?light=loss treats light as what a weave wastes, not its strength.
	// 0 is light as strength (how it was first built), 1 is light purely as loss. The owner wants
	// something between the two: half-way unless ?light= gives another amount (0..1, or "loss" for 1).
	const asked = query.get("light");
	const lightIsLoss = asked === "loss" ? 1 : asked !== null && asked !== "" && Number.isFinite(Number(asked)) ? Math.min(1, Math.max(0, Number(asked))) : 0.5;
	if (query.get("date")) pretendDate.value = new Date(`${query.get("date")}T00:00:00Z`);
	// For trying weather that is not there today: ?pretend=waveHeight:6,windSpeed:70,windGusts:95
	// replaces those live figures (names as in SeaConditions).
	const pretend = Object.fromEntries((query.get("pretend") ?? "").split(",").filter(Boolean).map((pair) => [pair.split(":")[0], Number(pair.split(":")[1])]));
	// The conditions come from the site's own server, which keeps one fresh copy for everyone;
	// failing that (no server, or a pretended day, which means a different place) straight from
	// Open-Meteo. The last real figures are also kept in the visitor's browser for next time.
	const REMEMBERED = "sea-conditions";
	const loadConditions = () =>
		(pretendDate.value ? Promise.reject() : $fetch<SeaConditions>("/api/conditions"))
			.catch(() => fetchSeaConditions(boatAt(pretendDate.value ?? new Date())))
			.then((result) => {
				conditions.value = { ...result, ...pretend };
				try {
					localStorage.setItem(REMEMBERED, JSON.stringify({ at: Date.now(), conditions: result }));
				} catch {
					// A browser that will not keep it simply starts from a guess next time.
				}
			})
			.catch(() => {});
	if (conditions.value && Object.keys(pretend).length) conditions.value = { ...conditions.value, ...pretend };
	// Asked for again only if the page did not arrive with them, or they are for another day.
	if (!conditions.value || pretendDate.value) loadConditions();
	const conditionsInterval = setInterval(loadConditions, 15 * 60_000);
	// What the picture is drawn from. It never waits and never jumps. It starts from the best
	// figures to hand: the real ones if the page arrived with them; else the ones this browser
	// saw last, if they are less than six hours old; else what the sea there is usually like.
	// Whenever better figures come, it moves over to them over a few seconds.
	const startingPoint = () => {
		try {
			const kept = JSON.parse(localStorage.getItem(REMEMBERED) ?? "null") as { at: number; conditions: SeaConditions } | null;
			if (kept && Date.now() - kept.at < 6 * 3_600_000 && !pretendDate.value) return kept.conditions;
		} catch {
			// Nothing usable was kept.
		}
		return typicalConditions(boatAt(pretendDate.value ?? new Date()));
	};
	let drawnFrom: SeaConditions = conditions.value ?? startingPoint();
	// The first frames are drawn unseen, and the picture then comes up quickly: not a wait for
	// anything, only so that the very first frame does not snap on.
	let revealed = false;
	let framesDrawn = 0;
	el.style.opacity = "0";
	const reveal = () => {
		if (revealed) return;
		revealed = true;
		el.style.transition = "opacity 0.5s ease";
		el.style.opacity = "1";
	};
	const revealAnyway = setTimeout(reveal, 1500);

	const overlay = createStormOverlay(overlayCanvas.value!);
	const fluid = createFluid(renderer, scene, SCREEN_LAYER);
	const bolts = createLightning(scene);
	const fogTint = new THREE.Color();
	const pointerScreen = { x: 0.5, y: 0.5 };
	const strikeFrom = new THREE.Vector3();
	const strikeTo = new THREE.Vector3();
	const spread = THREE.MathUtils.randFloatSpread;
	let measuredSea = false;
	let holdLevel = 0;
	// 0..1 how far the boat's lamps show on the water (eased).
	let lampLevel = 0;
	// Tomorrow's forecast wind as the scout feels it: across and along the view, scaled by its
	// strength (a 40 km/h wind counts as full).
	const NO_WIND = { across: 0, along: 0 };
	const NOTHING_UNUSUAL = { air: 0, water: 0 };
	const tomorrowsWind = (c: SeaConditions) => {
		const blowsTowards = THREE.MathUtils.degToRad(c.tomorrowWindDirection + 180 - PLACE.bearing);
		const strength = Math.min(1, c.tomorrowWindSpeed / 40);
		return { across: Math.sin(blowsTowards) * strength, along: Math.cos(blowsTowards) * strength };
	};
	let controlLevel = 0;
	// Metres above the water on a measured sea. September looked down from 18 to 27.
	const EYE_HEIGHT = 5;
	const boltScreen = Array.from({ length: BOLT_POINTS }, () => ({ x: 0, y: 0 }));
	// Where the channellers' flow lies on the screen, for the air it takes with it.
	const flowScreen = Array.from({ length: FLOW_POINTS }, () => ({ x: 0.5, y: 1 }));
	const FLOW_DISTANCES = [8, 20, 45, 100, 220, 500, 1200];
	const flowWorld = new THREE.Vector3();
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
	// Skipped, with the sway and the rain, for visitors who ask for reduced motion.
	// While the picture follows the live conditions there is lightning only if there is thunder there.
	const calmMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	let strikeAt = 4;
	let struck = 0;
	const lightning = (time: number, sky: number, fury: number, thunder: number) => {
		if (calmMotion || !showThunder.value || sky < 0.5 || thunder <= 0) return 0;
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
	const channellers = createChannellers(scene, camera, waveUniforms);
	const stars = createStars(scene, camera, PLACE, planetPositions);
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
	// A visitor who starts paused sees one still frame. When the live figures arrive they are
	// given one more, drawn from them.
	const stopWatching = watch(conditions, () => (drawnOnce = false));
	// How quickly the eye follows the height it should be at. Before the picture is shown, and for
	// a single still frame, it is simply put there.
	const follow = (rate: number) => (revealed && !motionPaused.value ? rate : 1);
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
		// The figures the picture is drawn from move towards the latest real ones, or towards the
		// usual sea while there are none yet. (At once for a single still frame.)
		drawnFrom = towardsConditions(drawnFrom, conditions.value ?? drawnFrom, motionPaused.value ? 1 : 1 - Math.exp(-delta / 1.5));
		const drawn = followLive.value ? drawnFrom : undefined;
		const air = ambientAir(drawn);
		// By hand, the story stands still and its white-out and stillness are left out.
		let moment: StormMoment;
		if (followStory.value) {
			cycle.value = (cycle.value + delta) % STORM_CYCLE_LENGTH;
			moment = stormMoment(cycle.value);
			weaveLevel.value = moment.weave;
			stormLevel.value = moment.fury;
		} else {
			if (drawn) stormLevel.value = stormFury(drawn);
			moment = { weave: weaveLevel.value, fury: stormLevel.value, stillness: 0, veil: 0, white: 0 };
		}
		// The story and the sliders make their own weather; only the live picture waits for real thunder.
		const liveOnly = followStory.value ? undefined : drawn;
		const { fury } = moment;
		const alive = 1 - moment.stillness;
		// The weaving moves the sea before the weather does: the waves rise with the weave, and the storm takes them further.
		const sea = lerp(drawn ? seaState(drawn) : weather.value, 1, Math.max(fury, 0.7 * THREE.MathUtils.smoothstep(moment.weave, 0.1, 0.9)));
		const sky = lerp(drawn ? skyState(drawn) : weather.value, 1, fury);
		updateEnvironment([hour.value, sea, sky]);

		// The live sea is drawn to measure: each swell and the wind's waves at their real height,
		// length and direction, and foam and fine roughness from the real wind. The dial and the
		// story keep September's sea, which only ever ran away from the viewer.
		let crosswind = 0;
		let gustiness = 0;
		if (liveOnly) {
			const windSpeed = liveOnly.windSpeed / 3.6;
			useMeasuredSea(waveUniforms, {
				swell: { height: liveOnly.swellHeight, period: liveOnly.swellPeriod, from: liveOnly.swellDirection },
				secondSwell: { height: liveOnly.secondSwellHeight, period: liveOnly.secondSwellPeriod, from: liveOnly.secondSwellDirection },
				windSea: { height: liveOnly.windWaveHeight, period: liveOnly.windWavePeriod, from: liveOnly.windWaveDirection },
				wind: { speed: windSpeed, from: liveOnly.windDirection },
				facing: PLACE.bearing,
			});
			waveUniforms.foam.value = whitecaps(windSpeed);
			steepness = 1;
			crosswind = Math.sin(THREE.MathUtils.degToRad(liveOnly.windDirection + 180 - PLACE.bearing)) * Math.min(1, windSpeed / 15);
			gustiness = THREE.MathUtils.clamp((liveOnly.windGusts / Math.max(liveOnly.windSpeed, 1) - 1) * 2, 0, 1);
		} else if (measuredSea) useDialSea(waveUniforms);
		measuredSea = !!liveOnly;

		// At the height of the storm giant swells rise under the ordinary waves, which give up
		// some steepness so the crests don't fold over themselves. They belong to the story: a
		// measured sea already has its real height.
		const surge = liveOnly ? 0 : 0.55 * fury;
		// The wind never holds steady: the whole sea swells and eases over a minute or two.
		const lull = 0.5 * Math.sin(time * 0.11) + 0.5 * Math.sin(time * 0.047 + 1.3);
		waveUniforms.surge.value = surge;
		waveUniforms.waveSteepness.value = liveOnly ? alive : steepness * (1 + 0.2 * lull) * (1 - 0.3 * fury) * alive;
		waveUniforms.gustiness.value = 0.8 * alive;
		waveUniforms.foam.value *= alive;
		waterUniforms.distortionScale.value *= lerp(0.15, 1, alive);

		// In heavy seas the view heaves, pitches and rolls like a ship's deck, and rides the giant swells.
		const sway = calmMotion ? 0 : THREE.MathUtils.smoothstep(sea, 0.3, 1) * (1 + 0.6 * fury) * alive;
		const heave = sway * (2 * Math.sin(time * 0.45) + Math.sin(time * 0.71 + 2));
		const pitch = sway * 0.035 * Math.sin(time * 0.52 + 1);
		if (liveOnly) {
			// On a measured sea the viewer is on a small boat: eyes EYE_HEIGHT above the water, and
			// carried up and down by the very waves that are drawn.
			const surface = measuredSeaHeight(waveUniforms, camera.position.x, camera.position.z, time);
			camera.position.y += (EYE_HEIGHT + surface - camera.position.y) * follow(0.2);
		} else {
			const swell = giantWaveHeight(camera.position.x, camera.position.z, time, surge);
			camera.position.y += (cameraHeight + swell + heave - camera.position.y) * follow(0.05);
		}
		camera.rotation.z = sway * (0.06 * Math.sin(time * 0.33) + 0.025 * Math.sin(time * 0.83 + 0.7));
		camera.rotation.y += (-pointer.x * maxYaw - camera.rotation.y) * 0.03;
		camera.rotation.x += (-pointer.y * maxPitch + pitch - camera.rotation.x) * 0.03;

		const flash = alive > 0.5 ? lightning(time, sky, fury, liveOnly ? thunderAmount(liveOnly) : 1) : 0;
		// The storm darkens the day. At night it is lifted instead, or the sea would be lost in black.
		const steadyExposure = exposure * lerp(1, lerp(2.5, 0.6, daylight), fury);
		renderer.toneMappingExposure = steadyExposure * (1 + 5 * flash) * (1 + 4 * moment.white * moment.veil);

		// Fog thickens with the storm and fills the stillness. The fog colour is set before tone
		// mapping, so it is divided by the exposure to land on the intended screen colour.
		// And it is there whenever the air at the islands is thick, storm or no storm.
		const liveMist = liveOnly ? mistAmount(liveOnly) : 0;
		const stormFog = showFog.value ? 0.8 * Math.max(THREE.MathUtils.smoothstep(fury, 0.2, 1) * air.fogginess, liveMist) : 0;
		const fogAmount = Math.max(stormFog, moment.stillness);
		mist.lerpColors(nightMist, dayFog, daylight);
		fog.density = 0.0025 * fogAmount;
		fog.color.copy(mist).multiplyScalar(1 / steadyExposure);
		fogTint.copy(mist);
		mist.lerp(mist.clone().lerpColors(nightMist, dayVoid, daylight), moment.stillness);
		mist.lerp(white, Math.max(moment.white, Math.min(1, 0.4 * flash)));
		veil.value!.style.backgroundColor = mist.getStyle();
		veil.value!.style.opacity = String(Math.max(0.15 * fogAmount, moment.veil));

		const liveRain = liveOnly ? rainAmount(liveOnly) : 0;
		const rain = calmMotion ? 0 : Math.max(THREE.MathUtils.smoothstep(fury, 0.15, 0.6), liveRain) * alive;
		// The weave, and what its knot does to the sea and the clouds around it.
		const formed = knotFormed(moment.weave * (1 - Math.max(darkness, controlLevel, gathering)));
		knotReady = formed > 0.8;
		// The bond: how far the channelling has taken hold of the storm's wind, air and fog.
		const bond = bondLevel.value * formed * alive;
		// While the four are at work the weave to the knot is put away: nothing bright is to
		// hang in the sky.
		weave.update({
			time,
			delta,
			amount: moment.weave * (1 - Math.max(darkness, controlLevel, gathering)),
			spread: fury + 2 * moment.white * moment.veil,
			gain: 0.5 / steadyExposure,
		});
		stars.update({ date: shownMoment, shown: starsOut * (1 - fogAmount) * alive, glow: milkyWayOut * (1 - fogAmount) * alive, gain: 2.2 / steadyExposure });
		// In the dark the four channellers weave along the water, and their braids light it.
		waveUniforms.channelWind.value.set(crosswind, gustiness);
		// By the dial and the story there is no forecast to read, so the need goes with the weather set.
		const need = liveOnly ? calling(liveOnly) : sea;
		// When the sea and wind would carry the boat faster than the pilgrimage's pace, they hold it
		// back, by day or night. It comes on and goes off gently.
		// In a storm they link and work on the waves instead, whatever the hour; that comes first.
		const storm = liveOnly ? stormy(liveOnly) : 0;
		controlLevel += (storm - controlLevel) * Math.min(1, delta / 3);
		const held = liveOnly ? holdingBack(liveOnly, PLACE.bearing) * (1 - controlLevel) : 0;
		holdLevel += (held - holdLevel) * Math.min(1, delta / 3);
		// (Eased over half a minute; as the page opens they are simply what the hour makes them.)
		if (gathering < 0) [gathering, skyLight] = [gatheringNow, skyLightNow];
		gathering += (gatheringNow - gathering) * Math.min(1, delta / 25);
		skyLight += (skyLightNow - skyLight) * Math.min(1, delta / 25);
		const channelling = channellers.update({
			time,
			delta,
			energy: sea,
			need,
			waveHeight: liveOnly ? liveOnly.waveHeight : lerp(0.5, 6, sea),
			hold: holdLevel,
			control: controlLevel,
			showMasters: query.get("show") === "masters",
			showSoundings: query.get("show") === "soundings",
			gathering,
			// Soft against a light sky, fine against a dark one.
			soften: skyLight,
			// Enough to stand whiter than a day sky; less at night, where little is needed to read as white.
			white: lerp(0.5, 3.5, daylight) / steadyExposure,
			unusual: liveOnly ? unusual(liveOnly) : NOTHING_UNUSUAL,
			below: liveOnly ? strengthBelow(liveOnly, PLACE.bearing) : 0,
			// On a quiet night of theirs one of them scouts: not in a storm, nor while the boat is
			// being held back, nor when the sea calls for nearly all four.
			scout: liveOnly ? darkness * quietEnoughToScout(liveOnly) * (1 - controlLevel) * (1 - THREE.MathUtils.smoothstep(need, 0.45, 0.6)) * alive : 0,
			tomorrow: liveOnly ? tomorrowsWind(liveOnly) : NO_WIND,
			thermal: liveOnly ? thermal(liveOnly) : 0,
			current: liveOnly ? Math.sin(THREE.MathUtils.degToRad(liveOnly.currentDirection - PLACE.bearing)) * Math.min(1, liveOnly.currentSpeed / 3) : 0,
			strength: Math.max(darkness, controlLevel, gathering) * alive,
			// More light by day, when it has a bright sea to show against.
			gain: (0.3 + 0.6 * daylight) / steadyExposure,
		});
		FLOW_DISTANCES.forEach((ahead, i) => {
			channelling.flowPoint(ahead, flowWorld);
			toScreen(flowWorld.x, flowWorld.y, flowWorld.z, flowScreen[i]!);
		});
		// The weaker channellers' deep weaves round the boat, slowing it: by day or night, as much as it needs.
		// (More of it, and more of the sea round the boat, when the strongest have taken it over.)
		waveUniforms.deepWeave.value = (0.3 * Math.max(holdLevel, 0.6 * channelling.masters) * alive) / steadyExposure;
		waveUniforms.deepMaster.value = channelling.masters;
		waveUniforms.channelLoss.value = lightIsLoss;
		waveUniforms.channelFeed.value = channelling.working * (0.6 + 0.4 * channelling.surge) * need * darkness * (1 - controlLevel) * alive;
		// Driven hard, the flow lights the sea more.
		// (In the trial the flow sheds far less light on the sea.)
		waveUniforms.channelLight.value = (1 - 0.7 * lightIsLoss) * (0.06 * (1 + 0.5 * channelling.surge) * (0.45 + 0.55 * need) * Math.max(darkness, controlLevel * nightfall) * alive) / steadyExposure;
		// Whenever there is no channelling at night, the boat's electric lamps are all the light there is near by.
		// (Twelve per cent brighter than it first was, at the owner's request.)
		// (The lamps do not snap on and off with the weaving, which made the water at the bottom of
		// the page turn brown and back in an instant. Their light is lost in the weaving's over two
		// or three seconds as it runs out, and comes back over six once the weaving has gone.)
		const lampWanted = nightfall * (1 - channelling.anything);
		lampLevel += (lampWanted - lampLevel) * Math.min(1, delta / (lampWanted > lampLevel ? 6 : 2.5));
		waveUniforms.boatLamp.value = (0.01344 * lampLevel * alive) / steadyExposure;
		waveUniforms.weavePull.value = formed * (0.6 + 0.8 * fury);
		vortexUniforms.knotDirection.value.subVectors(knotPosition, camera.position).normalize();
		vortexUniforms.vortex.value = formed;
		vortexUniforms.vortexTwist.value = formed > 0 ? vortexUniforms.vortexTwist.value + delta * 0.1 * (0.3 + fury) * bond : 0;
		waveUniforms.gustSwirl.value = bond;
		// The weave under the sea is always there, breathing slowly, and brightens as the weave is worked.
		waveUniforms.weaveGlow.value = ((0.3 + 0.9 * moment.weave) * (0.75 + 0.25 * Math.sin(time * 0.9)) * alive * 1.3) / steadyExposure;

		waveUniforms.freshFlow.value = alive;
		waveUniforms.internalWaves.value = (0.5 + 0.5 * moment.weave) * alive;
		vortexUniforms.vortexSpin.value = time * 0.8;
		vortexUniforms.vortexGlow.value.copy(knotGlow).multiplyScalar((0.06 * formed) / steadyExposure);
		toScreen(knotPosition.x, knotPosition.y, knotPosition.z, knotScreen);
		toScreen(camera.position.x, 0, camera.position.z - 8000, horizonScreen);
		// Where the horizon crosses the middle of the screen, and its tilt, for the navigation to stand on.
		toScreen(camera.position.x - Math.sin(camera.rotation.y) * 8000, 0, camera.position.z - Math.cos(camera.rotation.y) * 8000, horizonAhead);
		document.documentElement.style.setProperty("--horizon", `${(horizonAhead.y * 100).toFixed(2)}vh`);
		document.documentElement.style.setProperty("--roll", `${camera.rotation.z.toFixed(4)}rad`);
		overlay.draw(delta, rain, flash, camera.rotation.z * 0.5 + 0.5 * crosswind, bond, knotScreen);
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
			crosswind: crosswind * alive,
			strike,
			bolt: boltScreen,
			vapour: air.vapour,
			instability: air.instability,
			quality,
			bond,
			// The threads drag the air after them while they race for the knot, and a little once they are laid.
			// (Not while the channellers are at work: the old weave is put away then, and its draught
			// would carry the air they have gathered up into the sky.)
			charge: (Math.sin(Math.PI * Math.min(1, moment.weave / 0.5)) + 0.25 * formed) * (1 - Math.max(darkness, controlLevel, gathering)) * alive,
			flow: flowScreen,
			flowPull: calmMotion ? 0 : channelling.pull,
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
		// Shown once it has been drawn a few times in the form it will keep.
		if (!revealed && ++framesDrawn > 2) reveal();
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
		clearTimeout(revealAnyway);
		stopWatching();
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
				@input="followStory = followLive = false"
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
			<dl v-if="liveFigures.length" class="col-span-3 grid grid-cols-[auto_1fr] gap-x-3 border-t border-white/30 pt-2 text-xs">
				<template v-for="[name, figure] in liveFigures" :key="name">
					<dt>{{ name }}</dt>
					<dd>{{ figure }}</dd>
				</template>
			</dl>
		</div>
		<!-- On an opaque ground, so the text keeps its contrast whatever the sky is doing. -->
		<p v-if="!captionInNavigation" class="fixed top-0 right-0 z-10 max-w-[60vw] bg-[#041318] px-3 py-2 text-right text-sm text-[#c9f6f3]">
			{{ placeLabel }} · human time {{ timeLabel }}
			<template v-if="live">· waves {{ wavesLabel }} · wind {{ windLabel }}</template>
			<br />
			<a href="https://open-meteo.com/" class="underline">Weather data by Open-Meteo</a>
			· Milky Way: NASA/Goddard Space Flight Center Scientific Visualization Studio, ESA/Gaia/DPAC
		</p>
	</ClientOnly>
</template>
