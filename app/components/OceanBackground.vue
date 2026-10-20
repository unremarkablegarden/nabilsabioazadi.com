<script setup lang="ts">
// Based on the three.js example webgl_shaders_ocean (r186).
import * as THREE from "three";
import { Water } from "three/addons/objects/Water.js";
import { Sky } from "three/addons/objects/Sky.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const container = ref<HTMLDivElement>();
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
// September's weave to the knot in the sky is put away (its threads read as lightning striking the
// sea, and the owner's channellers are healers). It shows in September's look, in the story, and
// when its own dev slider is moved.
const weaveByHand = ref(false);
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
// The elements' colours, for talking about them with the owner: /?colours shows a strip of four
// swatches at the foot of the page. A change shows at once and is kept in the address
// (?air=9e7bf3&water=...), so an address is a palette and can be kept, compared or sent.
const showColours = ref(false);
const colours = reactive({ ...ELEMENT_COLOURS });
const COLOUR_NAMES = ["air", "water", "akasha", "strongest"] as const;
let applyColours: ((picked: typeof ELEMENT_COLOURS) => void) | undefined;
const pickColour = () => {
	applyColours?.(colours);
	const address = new URL(window.location.href);
	for (const name of COLOUR_NAMES) address.searchParams.set(name, colours[name].slice(1));
	window.history.replaceState(null, "", address);
};
// Set by the navigation's pause button (WCAG 2.2.2): while true nothing is redrawn.
const motionPaused = useState("motion-paused", () => false);
// Set once the sea has come up; the analytics wait for it (plugins/analytics.client.ts).
const seaShown = useState("sea-shown", () => false);
// The navigation's drawer; while it is open the view holds still.
const menuOpen = useState("menu-open", () => false);
// The navigation can show the place, time and conditions itself, in which case the caption here is left out.
const readout = useState<{ place?: string; time: string; waves?: string; wind?: string; weather?: string; whales?: string }>("scene-readout", () => ({ time: "" }));
// When the weather is not the measured weather (a channelled storm, or ?pretend=), the menu says so.
const channelled = ref(false);
// Peta's storm (wrath.ts), whose words the menu gives in place of the storm's.
const wrathRaised = ref(false);
// The storm for the five (five.ts), likewise.
const fiveRaised = ref(false);
// The whales who greet it, where they were last heard (server/api/whales.get.ts).
const whalesLine = ref<string>();
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
// Who at the front is at what, and what is calling them, in words (from channellers.ts).
const crewNow = ref("");
// How fast the picture is being drawn and with how many pixels, in words (see watchFrameRate).
const drawingNow = ref("");
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
		["twilight air", `${Math.round(twilightAir(c).density * 100)}% of standard · thins over ${(twilightAir(c).height / 1000).toFixed(1)} km · haze overhead ${twilightAir(c).overhead.toFixed(2)}${c.aerosolDepth == null ? " (assumed)" : ""}, standing ${Math.round(twilightAir(c).hazeHeight)} m deep`],
		["air · sea", `${c.airTemperature.toFixed(1)} °C · ${c.seaTemperature.toFixed(1)} °C · ${c.humidity}%`],
		["next 3 h", `wind ${c.windTrend >= 0 ? "+" : ""}${c.windTrend.toFixed(0)} km/h · waves ${c.waveTrend >= 0 ? "+" : ""}${c.waveTrend.toFixed(1)} m · pressure ${c.pressureTrend >= 0 ? "+" : ""}${c.pressureTrend.toFixed(1)} hPa`],
		["picture", `sea ${Math.round(seaState(c) * 100)}% · sky ${Math.round(skyState(c) * 100)}% · storm ${Math.round(stormFury(c) * 100)}%`],
		["channellers", `building ${Math.round(building(c) * 100)}% · called for ${Math.round(calling(c) * 100)}%`],
		["pace", `carried ${carried(c, PLACE.bearing).toFixed(1)} km/h · needs ${PACE.toFixed(1)} · holding back ${Math.round(holdingBack(c, PLACE.bearing) * 100)}%`],
		["storm", `linked on the waves ${Math.round(stormy(c) * 100)}%`],
		["unusual", `air ${Math.round(unusual(c).air * 100)}% · water ${Math.round(unusual(c).water * 100)}% (the strongest attends to 84% of it, and looks into it when that passes 50%)`],
		["strongest", `${Math.round((1 - strengthBelow(c, PLACE.bearing)) * 100)}% ahead (${calling(c) >= 0.6 ? "linked" : "not linked"}) · ${Math.round(strengthBelow(c, PLACE.bearing) * 100)}% below, round the boat`],
		["tomorrow", `wind ${c.tomorrowWindSpeed.toFixed(0)} km/h from the ${compassPoint(c.tomorrowWindDirection)} · quiet enough to scout ${Math.round(quietEnoughToScout(c) * 100)}%`],
		["sky", windsAloft(c).map((layer, height) => `${["sea", "750 m", "1.5 km", "3 km", "5.5 km"][height]} ${layer.speed.toFixed(0)} ${compassPoint(layer.from)}`).join(" · ")],
		["sky cools by", lapseAloft(c).map((lapse, layer) => `${["sea to 750 m", "to 1.5 km", "to 3 km", "to 5.5 km"][layer]} ${lapse.toFixed(1)}`).join(" · ") + " °C/km (9.8 rises freely · under 0 is a lid)"],
		["air", thermal(c) > 0.1 ? `sea warmer by ${(c.seaTemperature - c.airTemperature).toFixed(1)} °C: thermals ${Math.round(thermal(c) * 100)}%` : thermal(c) < -0.1 ? `air warmer by ${(c.airTemperature - c.seaTemperature).toFixed(1)} °C: still, layered ${Math.round(-thermal(c) * 100)}%` : "sea and air alike: neither rising nor layered"],
		["drawing", drawingNow.value],
		["at the front", crewNow.value.split(" | ")[0] ?? ""],
		["calling", crewNow.value.split(" | ")[1] ?? ""],
	];
});

watchEffect(() => {
	shownAt.value = dateAtBoatHour(hour.value, pretendDate.value ?? new Date()).getTime();
	readout.value = { place: placeLabel.value, time: timeLabel.value, waves: wavesLabel.value, wind: windLabel.value, weather: channelled.value ? (fiveRaised.value && wrathRaised.value ? BOTH_WORDS : fiveRaised.value ? FIVE_WORDS : wrathRaised.value ? WRATH_WORDS : CHANNELLED_WORDS) : undefined, whales: channelled.value && fiveRaised.value ? whalesLine.value : undefined };
});

onMounted(async () => {
	// Setting the picture up is long work (every weave is built), and it is done in pieces with
	// the browser let in between, so that the page answers a click, a key or a scroll all through
	// it: on a slow machine it was seconds in which the menu could not be opened. Nothing is drawn
	// until it is all set up, so the picture is the same.
	const breathe = () =>
		new Promise<void>((resolve) => {
			const scheduler = (window as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
			if (scheduler?.yield) return void scheduler.yield().then(resolve);
			// (A message, not a timer: a timer in a tab that is out of sight waits a second or more.)
			const channel = new MessageChannel();
			channel.port1.onmessage = () => resolve();
			channel.port2.postMessage(null);
		});
	// Taken up here and no sooner. The server's answer reaches it only after it has drawn the menu,
	// so its menu has no Waves or Wind rows; taken up any earlier in the browser, the browser's
	// menu had them, and Vue complained on every load that the two did not match.
	if (served.value && !conditions.value) conditions.value = served.value;
	const query = new URLSearchParams(window.location.search);
	showControls.value = query.has("controls");
	showColours.value = query.has("colours");
	for (const name of COLOUR_NAMES) {
		const given = query.get(name);
		if (given && /^[0-9a-f]{6}$/i.test(given)) colours[name] = `#${given.toLowerCase()}`;
	}
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
	// Checking each shader for mistakes makes the browser wait for it to be built. That is for
	// while developing; on the live site the shaders are known to be sound.
	renderer.debug.checkShaderErrors = import.meta.dev;
	// Beyond 2 the extra pixels cost a great deal and show very little. And on a machine that
	// cannot keep the picture moving smoothly at that, it is drawn with fewer (see watchFrameRate):
	// these are the steps down, never below one pixel of the picture to one of the page.
	const fullRatio = Math.min(window.devicePixelRatio, 2);
	const RATIOS = [fullRatio, ...[1.5, 1.25, 1].filter((ratio) => ratio < fullRatio)];
	// (/?ratio=2, or 1.5, 1.25, 1, holds the picture at that, for comparing them by eye.)
	const heldRatio = Number(query.get("ratio"));
	if (heldRatio >= 0.5 && heldRatio <= fullRatio) RATIOS.splice(0, RATIOS.length, heldRatio);
	let ratioStep = 0;
	const usePixelRatio = (step: number) => {
		ratioStep = step;
		pixelRatio.value = RATIOS[step]!;
		renderer.setPixelRatio(RATIOS[step]!);
	};
	usePixelRatio(0);
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

	// Pointer position in -1..1 on both axes.
	const pointer = new THREE.Vector2();
	// Where the view is aimed, in the same terms; the camera eases towards it each frame. It is
	// the pointer, less the reaching for things (the owner, October: going to the menu turned the
	// view far to the left and high up, which could disorientate). The view follows the pointer
	// as it wanders, not as it is carried quickly across the screen to something, and it holds
	// while the pointer is on the navigation or anything else to be pressed, and while the menu is
	// open. When the pointer settles again the view goes on to where it now is.
	const aim = new THREE.Vector2();
	const lastPointer = new THREE.Vector2();
	// How fast the pointer has lately been moving, in screen half-widths a second.
	let pointerSpeed = 0;
	// Above about this speed the pointer is reaching for something rather than looking about.
	// (/?reach=1.5, or another speed, tries it by feel.)
	const REACH = Number(query.get("reach")) > 0 ? Number(query.get("reach")) : 1.5;
	let onControl = false;
	const onPointerMove = (event: PointerEvent) => {
		pointer.set((event.clientX / window.innerWidth) * 2 - 1, (event.clientY / window.innerHeight) * 2 - 1);
		onControl = event.target instanceof Element && !!event.target.closest("header.site, a, button, input, select, textarea, label, summary, [role='button']");
	};
	window.addEventListener("pointermove", onPointerMove);
	// How far the view turns with the pointer (the owner's, October: "viewing higher than we do
	// and wider than we do, at least 180 degrees wide"). To either side 95°, so 190° from the far
	// left of the screen to the far right; up 62°, to see what is sent into the sky; down 6°, as
	// before. About the middle of the screen it turns as gently as it used to (20° and 6° for the
	// whole way, were it kept up): it is towards the edges that the view swings wide.
	const maxYaw = THREE.MathUtils.degToRad(95);
	const maxUp = THREE.MathUtils.degToRad(62);
	const maxDown = THREE.MathUtils.degToRad(6);
	const lookAcross = (x: number) => x * (20 / 95 + (1 - 20 / 95) * x * x) * maxYaw;
	const lookUp = (y: number) => (y > 0 ? y * maxDown : y * (6 / 62 + (1 - 6 / 62) * y * y) * maxUp);

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
	const twilightUniforms = addTwilightSky(sky);
	await breathe();

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
	const TWILIGHT_GLOW = Number(query.get("glow") ?? 0.24);

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
	// How bright the twilight sky ahead is to come out on the screen (see twilight-sky.ts).
	let twilightGlow = 0;
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
	// 0..1 how far they are tending the sea and the air, each in their own way, linking every so
	// often: always (the owner's: moon or no moon), but for dawn and dusk, when all thirteen link.
	let seaAtBoat = 0;
	let toldAt = -1;
	let tending = -1;
	let tendingNow = 0;
	// 0..1 how far it is day: then their weaving is seen as colour and not as light.
	let dayNow = 0;
	let day = -1;
	// The moment shown, 0..1 how much of the stars' light the cloud lets through at it, and the
	// magnitude of the faintest star the sky then leaves to be seen.
	let shownMoment = new Date();
	let starsOut = 0;
	let faintestStar = -6;
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
		// Tending takes over from the linking of dawn as that ends, and hands back to dusk's the same way.
		tendingNow = staged ? 0 : 1 - gatheringNow;
		dayNow = staged ? 0 : THREE.MathUtils.smoothstep(sunElevation, 3, 8);

		// Stars need a dark sky. As it darkens the brightest come out first, and a bright moon
		// drowns the faint ones (faintestSeen in stars.ts). Cloud hides them. (The cloud here dims
		// them all alike; it cannot yet hide the ones behind each cloud.)
		starsOut = staged ? 0 : 1 - sky ** 0.8;
		faintestStar = faintestSeen(sunElevation, moonlight);
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

		// With the sun low, down or just down, the sky is the one worked out from the planet and
		// its air (twilight-sky.ts); the daylight sky hands over to it between 10 and 3 degrees.
		// It dims as the sun goes down, to nothing by the end of nautical twilight, and under cloud.
		twilightUniforms.uTwilight.value = staged ? 0 : 1 - THREE.MathUtils.smoothstep(sunElevation, 3, 10);
		twilightGlow = TWILIGHT_GLOW * THREE.MathUtils.smoothstep(sunElevation, -14, 2) ** 1.5 * lerp(1, 0.4, sky);

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
	const asPretended = Object.fromEntries((query.get("pretend") ?? "").split(",").filter(Boolean).map((pair) => [pair.split(":")[0], Number(pair.split(":")[1])]));
	// A channelled storm (see channelled-storm.ts): on for everyone by storm.json, or for this
	// visit by ?storm; ?storm=off looks at the site without it. Its figures go under any pretended.
	const stormAsked = query.get("storm");
	// The strongest's stilling (channelled-storm.ts, stilling.ts): set in storm.json, or ?still for
	// this visit from now, ?still=0.5 half-way through, ?still=off without it. Once it is done the
	// weather is the measured again: no storm, nothing pretended.
	const stillAsked = query.get("still");
	const pageOpened = Date.now();
	let stillDone = false;
	const stormNow = () => (stillDone || stormAsked === "off" ? false : stormAsked !== null ? true : channelledStormOn(new Date()));
	let stormOn = stormNow();
	// (With the rain cut, the storm's figures say no rain: storm.json "rain": false.)
	const noRain = stormRainCut();
	// Peta's storm (wrath.ts): "wrath" in storm.json, or ?wrath for this visit from now, ?wrath=40
	// forty seconds in, ?wrath=off without it. While it is raised its figures are the storm's.
	const wrathAsked = query.get("wrath");
	// The storm for the five (five.ts): "five" in storm.json, or ?five, ?five=40, ?five=off, the
	// same way; it goes before Peta's.
	const fiveAsked = query.get("five");
	const fiveFigures = fiveAsked !== "off" && (fiveAsked !== null || fiveSet());
	const wrathFigures = wrathAsked !== "off" && (wrathAsked !== null || wrathSet());
	// Both at once (bothSea): Peta's storm and the five's, taking turns in one sea.
	const bothFigures = fiveFigures && wrathFigures;
	// Fifteen times worse, or as storm.json or ?worse= says (worsened).
	const worse = worseTimes(query.get("worse"));
	const pretendNow = () => (stillDone ? {} : stormOn ? { ...worsened(bothFigures ? BOTH_STORM : fiveFigures ? FIVE_STORM : wrathFigures ? WRATH_STORM : CHANNELLED_STORM, worse), ...(noRain ? { precipitation: 0 } : {}), ...asPretended } : asPretended);
	let pretend = pretendNow();
	channelled.value = Object.keys(pretend).length > 0;
	wrathRaised.value = wrathFigures;
	fiveRaised.value = fiveFigures;
	// The whales are real, and none is near: each is given at her true distance and direction from
	// the boat, and the day she was last heard.
	if (fiveFigures)
		$fetch<{ latitude: number; longitude: number; at: string }[]>("/api/whales")
			.then((whales) => {
				if (!whales.length) return;
				const boat = boatAt(new Date());
				const rad = THREE.MathUtils.degToRad;
				const told = whales
					.map((w) => {
						const [a, b, dl] = [rad(boat.latitude), rad(w.latitude), rad(w.longitude - boat.longitude)];
						const km = 6371 * Math.acos(Math.min(1, Math.sin(a) * Math.sin(b) + Math.cos(a) * Math.cos(b) * Math.cos(dl)));
						const towards = THREE.MathUtils.radToDeg(Math.atan2(Math.sin(dl) * Math.cos(b), Math.cos(a) * Math.sin(b) - Math.sin(a) * Math.cos(b) * Math.cos(dl)));
						return { km, towards, at: new Date(w.at) };
					})
					.sort((x, y) => x.km - y.km)
					.map((w) => `${(Math.round(w.km / 10) * 10).toLocaleString("en-GB")} km ${compassPoint(w.towards)}, ${w.at.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`);
				const count = ["", "One tohorā", "Two tohorā", "Three tohorā", "Four tohorā", "Five tohorā"][told.length] ?? `${told.length} tohorā`;
				whalesLine.value = `${count} greet the storm from where last heard: ${told.join("; ")}`;
			})
			.catch(() => {});
	// Its colours, unless the address gives colours of its own.
	const coloursGiven = COLOUR_NAMES.some((name) => query.has(name));
	// The Aes Sedai may stay on after the storm is released (aesSedaiKept).
	const weaversStay = aesSedaiKept();
	if ((stormOn || weaversStay) && !coloursGiven) Object.assign(colours, GRADED_COLOURS);
	// The last measured figures, to go back to when a storm ends.
	let measured = conditions.value;
	// The conditions come from the site's own server, which keeps one fresh copy for everyone;
	// failing that (no server, or a pretended day, which means a different place) straight from
	// Open-Meteo. The last real figures are also kept in the visitor's browser for next time.
	const REMEMBERED = "sea-conditions";
	const loadConditions = () =>
		(pretendDate.value ? Promise.reject() : $fetch<SeaConditions>("/api/conditions"))
			.catch(() => fetchSeaConditions(boatAt(pretendDate.value ?? new Date())))
			.then((result) => {
				measured = result;
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
		seaShown.value = true;
	};
	const revealAnyway = setTimeout(reveal, 1500);

	const rainfall = createRain(scene, camera, SCREEN_LAYER);
	// Opening the sky (sky-opening.ts): in a channelled storm, every 160 seconds, the channellers
	// lift a weave to the cloud base and part the rain round the boat. ?show=sky begins with it.
	const skyOpening = createSkyOpening(scene, SCREEN_LAYER);
	const skyAhead = new THREE.Vector2(0, -1);
	const skyFoot = new THREE.Vector3();
	const skyCanopy = new THREE.Vector4();
	const skySheath = [new THREE.Color(), new THREE.Color(), new THREE.Color(), new THREE.Color()];
	const NO_SKY = { gather: 0, lift: 0, open: 0, release: 0, canopy: 0 };
	// Every way of opening the sky at once, as one piece (sky-all.ts; the owner's choice, 15
	// October). ?sky=column shows the column alone, as it first was.
	// ?sky=breath: the next version, the sky opened by breath alone, nothing drawn in it (sky-breath.ts).
	const byBreath = query.get("sky") === "breath";
	// ?sky=sacred: the channellers overcommand the weather, hold the sea up round them and weave
	// all six elements together (sacred.ts). It begins at once, storm or no storm.
	const bySacred = query.get("sky") === "sacred";
	const allAtOnce = query.get("sky") !== "column" && !byBreath && !bySacred;
	const skyAll = createSkyAll(scene, SCREEN_LAYER);
	const skyBreath = createSkyBreath(scene, sky, SCREEN_LAYER);
	await breathe();
	const sacred = createSacred(scene, SCREEN_LAYER);
	// The great calming (channelled-storm.ts, embroidery.ts): set in storm.json; ?calm=0.4 shows it
	// that far through.
	await breathe();
	const embroidery = createEmbroidery(scene, SCREEN_LAYER, GIANT_WAVES);
	const calmAsked = query.get("calm") !== null && Number.isFinite(Number(query.get("calm"))) ? Number(query.get("calm")) : undefined;
	// The twelve mourning into the waves (mourning.ts): "mourning" in storm.json, or ?mourn.
	await breathe();
	const mourning = createMourning(scene, SCREEN_LAYER);
	const mournAsked = query.has("mourn");
	const wrath = createWrath(scene, SCREEN_LAYER);
	const wrathFrom = Date.now() - (wrathAsked !== null && wrathAsked !== "" && Number.isFinite(Number(wrathAsked)) ? Number(wrathAsked) * 1000 : 0);
	const five = createFive(scene, SCREEN_LAYER);
	const fiveFrom = Date.now() - (fiveAsked !== null && fiveAsked !== "" && Number.isFinite(Number(fiveAsked)) ? Number(fiveAsked) * 1000 : 0);
	const embroideryTints = [new THREE.Color(), new THREE.Color(), new THREE.Color()];
	await breathe();
	const stilling = createStilling(scene, SCREEN_LAYER);
	// Leane cutting the rain off (rain-cut.ts): set in storm.json, or ?raincut for this visit.
	await breathe();
	const rainCut = createRainCut(scene, SCREEN_LAYER);
	const rainCutAsked = query.get("raincut");
	const stillSheath = new THREE.Color();
	// The measured weather alone, eased as drawnFrom is: what the stilling goes to.
	let drawnMeasured: SeaConditions | undefined;
	// The stilling's gap and hours, worked out once there are measured figures to go to.
	let stillHours = 0;
	let stillGap = 0;
	const holeSeen = { x: 0.5, y: 0.2, across: 0.2, up: 0.2, open: 0 };
	const holeEdge = { x: 0, y: 0 };
	const holeDirection = new THREE.Vector3();
	// When the storm began, in the picture's seconds (-1: at the next frame).
	let stormSince = 0;
	// The shelter one channeller holds against the rain (see rain.ts): the one beside the viewer
	// on the left, about 2.5 m in front of their eyes, a little below the viewer's own. Taken up
	// only in a channelled storm, once the rain is heavy, and let go when it eases.
	let shelterHold = 0;
	const shelterAt = new THREE.Vector3();
	const rainLight = new THREE.Color();
	const rainWind = new THREE.Vector3();
	const rainNight = new THREE.Color(0.2, 0.22, 0.26);
	const rainDay = new THREE.Color(0.9, 0.93, 0.96);
	await breathe();
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
	// The wind now at five heights, lowest first, as the sky-scanning weave parts into it: each
	// across and along the view and scaled by its speed, in true proportion (the owner's: "widen
	// the speed"), an 80 km/h wind counting as 1. A wind four times as fast carries four times as far.
	const STILL_AIR = [NO_WIND, NO_WIND, NO_WIND, NO_WIND, NO_WIND];
	const windsOverhead = (c: SeaConditions) =>
		windsAloft(c).map((layer) => {
			const blowsTowards = THREE.MathUtils.degToRad(layer.from + 180 - PLACE.bearing);
			const strength = Math.min(1.5, layer.speed / 80);
			return { across: Math.sin(blowsTowards) * strength, along: Math.cos(blowsTowards) * strength };
		});
	// How long air takes to rise through each of the four layers between those heights, against
	// an ordinary sky's 1: from how fast each layer cools with height (see `lapseAloft`). Through
	// a layer that cools as fast as lifted air does (9.8 °C a kilometre) it rises freely, 0.75;
	// under an inversion it all but stops, 2.9, and is carried sideways instead.
	const ORDINARY_SKY = [1, 1, 1, 1];
	const slowToRise = (c: SeaConditions) => lapseAloft(c).map((lapse) => 1 / (0.35 + THREE.MathUtils.clamp(lapse / 9.8, 0, 1)));
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
	// Before that, and sooner, the whole picture is drawn with fewer pixels (RATIOS above): a
	// picture a little softer that moves smoothly is better than a sharp one that stutters. Once
	// the machine has kept up for a while the sharper picture is tried again; each time that fails
	// it is left three times as long before the next try, so the picture does not keep changing.
	// And if the fewest pixels are hardly quicker than the most were, it is not the pixels that
	// are slow (some phones saving their battery draw only 30 frames a second whatever is asked):
	// the sharp picture is put back and left.
	let quality = 0;
	let frameAverage = 1 / 60;
	let sinceQualityChange = 0;
	// (The first six seconds are not judged: the machine is still building the picture then.)
	let sinceRatioChange = -3;
	let patience = 12;
	let justRaised = false;
	let adapting = RATIOS.length > 1;
	let slowAtFull = 0;
	const changeRatio = (step: number) => {
		usePixelRatio(step);
		sinceRatioChange = 0;
		// (Judged afresh: the change itself costs a slow frame or two.)
		frameAverage = 1 / 60;
	};
	const watchFrameRate = (delta: number) => {
		// (A gap of a quarter of a second is not slowness: the page was out of sight.)
		if (delta > 0.25) return;
		frameAverage += (Math.min(delta, 0.1) - frameAverage) * 0.05;
		sinceQualityChange += delta;
		sinceRatioChange += delta;
		if (sinceRatioChange > 10) justRaised = false;
		// (A further step down is weighed for longer than the first: just after a change, and in the
		// page's first seconds, a machine is often slow for reasons that pass.)
		if (adapting && sinceRatioChange >= (ratioStep > 0 ? 5 : 3)) {
			const slow = frameAverage > 1 / 48;
			if (slow && ratioStep < RATIOS.length - 1) {
				if (ratioStep === 0) slowAtFull = frameAverage;
				if (justRaised) patience = Math.min(patience * 3, 900);
				justRaised = false;
				changeRatio(ratioStep + 1);
			} else if (slow && frameAverage > 0.85 * slowAtFull) {
				adapting = false;
				changeRatio(0);
			} else if (frameAverage < 1 / 57 && ratioStep > 0 && sinceRatioChange > patience) {
				justRaised = true;
				changeRatio(ratioStep - 1);
			}
		}
		if (sinceQualityChange < 3) return;
		if (frameAverage > 1 / 42 && quality < 2) quality++;
		else if (frameAverage < 1 / 57 && quality > 0 && sinceQualityChange > 12) quality--;
		else return;
		sinceQualityChange = 0;
	};

	// Lightning, as a real storm has it: most flashes stay inside the cloud and only light it
	// from within; one in two or three comes down to the sea as a bolt. They fall near and far,
	// the far ones dimmer and half lost in the rain. The light over the whole scene rises and
	// fades once per flash; the flicker of the strokes is only in the bolt itself, so the
	// picture never strobes. Past hurricane force they come faster, never under about a second apart.
	// Skipped, with the sway and the rain, for visitors who ask for reduced motion.
	// While the picture follows the live conditions there is lightning only if there is thunder there.
	const calmMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	let strikeAt = 4;
	let struck = 0;
	let inCloud = false;
	let nearness = 1;
	const lightning = (time: number, sky: number, fury: number, thunder: number, extreme: number, staged: boolean) => {
		if (calmMotion || !showThunder.value || sky < 0.5 || thunder <= 0) return 0;
		if (time > strikeAt + 1) strikeAt = time + lerp(lerp(14, 5, sky), lerp(1.8, 1.1, extreme), fury) * lerp(0.75, 1.4, Math.random());
		if (time < strikeAt) return 0;
		if (struck !== strikeAt) {
			struck = strikeAt;
			if (staged) {
				// The story's: down from the knot once it has formed. Until then the weave under the
				// sea breaks out upward: the bolt rises from the water into the cloud.
				inCloud = false;
				nearness = 1;
				if (knotReady) {
					strikeFrom.copy(knotPosition);
					strikeTo.set(knotPosition.x + spread(700), 0, knotPosition.z + spread(700) + 100);
				} else {
					strikeTo.set(spread(1200), 0, -700 + spread(900));
					strikeFrom.set(strikeTo.x + spread(400), 800, strikeTo.z - 200 + spread(300));
				}
				bolts.strike(strikeFrom, strikeTo, time, !knotReady);
			} else {
				inCloud = Math.random() < 0.6;
				// From 400 m to 4 km off, across the view ahead.
				const distance = lerp(400, 4000, Math.random() ** 1.5);
				nearness = lerp(1, 0.3, (distance - 400) / 3600);
				if (!inCloud) {
					const bearing = spread(1.0);
					strikeTo.set(camera.position.x + Math.sin(bearing) * distance, 0, camera.position.z - Math.cos(bearing) * distance);
					// From the cloud base, seldom straight above where it lands.
					strikeFrom.set(strikeTo.x + spread(500), 700 + Math.random() * 400, strikeTo.z + spread(500));
					bolts.strike(strikeFrom, strikeTo, time, false, nearness);
				}
			}
		}
		// The sky lights when the leader has reached the sea and the return stroke fires; a flash
		// in the cloud swells and lingers a little longer, and is less bright.
		const since = time - strikeAt - (inCloud ? 0 : LIGHTNING_LEADER_TIME);
		if (since < 0) return 0;
		if (inCloud) return 0.55 * nearness * (1 - Math.exp(-since / 0.04)) * Math.exp(-since / 0.22);
		return nearness * (Math.exp(-since / 0.07) + (since > 0.2 ? 0.7 * Math.exp(-(since - 0.2) / 0.18) : 0));
	};

	// Colours as they should appear on screen.
	const nightMist = new THREE.Color(0x10161d);
	const dayFog = new THREE.Color(0x2b3844);
	// The air lit by Manulani's sphere, and where the sphere is; how bright its light on the sea.
	const litAir = new THREE.Color(0x5a6f80);
	const manuAt = new THREE.Vector3();
	const MANU_BRIGHT = 0.9;
	const dayVoid = new THREE.Color(0xc4c8cc);
	const white = new THREE.Color(0xffffff);
	const mist = new THREE.Color();
	// The knot of the weave hangs over the sea straight ahead, about 15° above the horizon.
	const knotPosition = new THREE.Vector3(0, 250, -800);
	await breathe();
	const weave = createWeave(scene, camera, knotPosition);
	await breathe();
	const channellers = createChannellers(scene, camera, waveUniforms);
	applyColours = channellers.setColours;
	channellers.setColours(colours);
	channellers.setChannelledStorm(stormOn || weaversStay);
	// A storm begins or ends while the page is open: the sea and sky move over to the new figures
	// over a few seconds as they always do, and the crew and colours change over gradually.
	const followSwitch = () => {
		if (stormNow() === stormOn && !(stillDone && channelled.value)) return;
		stormOn = stormNow();
		pretend = pretendNow();
		channelled.value = Object.keys(pretend).length > 0;
		channellers.setChannelledStorm(stormOn || weaversStay);
		stormSince = -1;
		if (!coloursGiven) {
			Object.assign(colours, stormOn || weaversStay ? GRADED_COLOURS : ELEMENT_COLOURS);
			channellers.setColours(colours, true);
		}
		if (measured) conditions.value = { ...measured, ...pretend };
	};
	const stormInterval = setInterval(followSwitch, 30_000);
	await breathe();
	const stars = createStars(scene, camera, PLACE, planetPositions, skyBreath.hole);
	waveUniforms.weaveCentre.value.set(knotPosition.x, knotPosition.z);
	const projected = new THREE.Vector3();
	const knotScreen = { x: 0.5, y: 0.25 };
	const horizonScreen = { x: 0.5, y: 0.5 };
	const horizonAhead = { x: 0.5, y: 0.5 };
	// Writes where a world position falls on screen (0..1) into target.
	const toScreen = (x: number, y: number, z: number, target: { x: number; y: number }) => {
		// (Something behind the viewer has no place on the screen: it is put well off to its side.)
		projected.set(x, y, z).applyMatrix4(camera.matrixWorldInverse);
		if (projected.z > -1) {
			target.x = projected.x < 0 ? -3 : 4;
			target.y = 0.5;
			return;
		}
		projected.applyMatrix4(camera.projectionMatrix);
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
	// The sea's shaders are built while the page goes on loading, where the browser can do that
	// alongside (KHR_parallel_shader_compile), and nothing is drawn until they are ready. Drawing
	// at once made the browser build them there and then, holding the whole page still for a
	// second or more on loading. Only what the first picture shows is waited for (about half of
	// them). The rest, the story's weaves that are not out yet, are built one at a time afterwards
	// while the browser has nothing else to do, so that none of them makes the picture catch when
	// it first comes out.
	let compiled = false;
	let compiling = false;
	let warming = true;
	let notYetShown: THREE.Object3D[] = [];
	const whenIdle = (then: () => void) => ("requestIdleCallback" in window ? requestIdleCallback(then, { timeout: 2000 }) : setTimeout(then, 100));
	const warmNext = () => {
		const next = notYetShown.shift();
		if (!next || !warming) return;
		whenIdle(() => {
			if (!warming) return;
			renderer.compileAsync(next, camera, scene).catch(() => {}).finally(warmNext);
		});
	};
	// (Called with the first picture set out, so that what it shows is known.)
	const compileShown = () => {
		compiling = true;
		notYetShown = scene.children.filter((object) => !object.visible);
		Promise.all(scene.children.filter((object) => object.visible).map((object) => renderer.compileAsync(object, camera, scene)))
			.catch(() => {})
			.finally(() => {
				compiled = true;
				warmNext();
			});
	};
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
		if (stormSince < 0) stormSince = time;
		const skySeconds = time - stormSince + (query.get("show") === "sky" ? 33 : 0);
		const calming = stormOn && !calmMotion ? calmingNow(new Date(), calmAsked) : undefined;
		const mourningOn = stormOn && !calmMotion && (mournAsked || mourningSince(new Date()) !== undefined);
		const wrathSeconds = !wrathFigures ? undefined : bothFigures ? (fiveAsked !== null ? (Date.now() - fiveFrom) / 1000 : wrathAsked !== null ? (Date.now() - wrathFrom) / 1000 : fiveSince(new Date())) : wrathAsked !== null ? (Date.now() - wrathFrom) / 1000 : wrathSince(new Date());
		const wrathOn = stormOn && !calmMotion && wrathSeconds !== undefined;
		// (Both at once keep one clock, the five's.)
		const fiveSeconds = !fiveFigures ? undefined : fiveAsked !== null ? (Date.now() - fiveFrom) / 1000 : bothFigures && wrathAsked !== null ? (Date.now() - wrathFrom) / 1000 : fiveSince(new Date());
		const fiveOn = stormOn && !calmMotion && fiveSeconds !== undefined;
		// (Either act: the twelve's own weaving and the sky openings stand aside for it.)
		const actOn = wrathOn || fiveOn;
		// (Nor is the sky opened while the strongest is stilling it.)
		const stillingAny = stillingBegun(new Date(), stillAsked, pageOpened, stormAsked !== null) !== undefined;
		// (While the twelve are linked, and resting after, the sky is not opened.)
		const together = stormOn && !calmMotion && allAtOnce && !calming && !stillingAny && !mourningOn && !actOn ? skyAllAt(skySeconds) : undefined;
		const breathing = stormOn && !calmMotion && byBreath ? skyBreathAt(skySeconds) : undefined;
		const holding = !calmMotion && bySacred ? sacredAt(skySeconds, drawnFrom) : undefined;
		const opening = together ?? (breathing ? { ...NO_SKY, canopy: breathing.canopy } : holding ? { ...NO_SKY, canopy: holding.command } : stormOn && !calmMotion && !calming && !stillingAny && !mourningOn && !actOn ? skyOpeningAt(skySeconds) : NO_SKY);
		// The figures the picture is drawn from move towards the latest real ones, or towards the
		// usual sea while there are none yet. (At once for a single still frame.)
		drawnFrom = towardsConditions(drawnFrom, conditions.value ?? drawnFrom, motionPaused.value ? 1 : 1 - Math.exp(-delta / 1.5));
		// Once the channellers have overcommanded it (sacred.ts), the weather is theirs.
		const onScreen = holding && holding.command > 0
			? towardsConditions(drawnFrom, { ...drawnFrom, ...STILLED }, holding.command)
			: calming
				? { ...drawnFrom, ...calmedConditions(drawnFrom, calming.progress) }
				: drawnFrom;
		// The strongest's stilling takes whatever is on screen to the measured weather.
		const stillBegun = stillingBegun(new Date(), stillAsked, pageOpened, stormAsked !== null);
		const measuredNow = measured ?? drawnMeasured ?? drawnFrom;
		drawnMeasured = drawnMeasured ? towardsConditions(drawnMeasured, measuredNow, motionPaused.value ? 1 : 1 - Math.exp(-delta / 1.5)) : measuredNow;
		let stillShare = -1;
		// What they still: the weather on screen as they began (the twelve let go of the calming then).
		let stillFrom = onScreen;
		if (stillBegun) {
			// How far it has to go is measured from the weather as it was when they began (the
			// calming as far as it had got then), so that every visitor sees the same moment.
			const begunAt = stillBegun.hours !== undefined ? new Date(Date.now() - stillBegun.hours * 3_600_000) : new Date();
			const calmThen = stormOn ? calmingNow(begunAt, calmAsked) : undefined;
			if (calmThen && !calmMotion && !(holding && holding.command > 0)) stillFrom = { ...drawnFrom, ...calmedConditions(drawnFrom, calmThen.progress) };
			stillGap = stillingGap(stillFrom, drawnMeasured);
			stillHours = stillingHours(stillGap);
			stillShare = stillBegun.share ?? Math.min(1, stillBegun.hours! / stillHours);
			// Done: they let go, and the site follows the measured weather again.
			if (stillShare >= 1 && stillBegun.share === undefined && !stillDone) {
				stillDone = true;
				followSwitch();
			}
		}
		const standBack = stillShare < 0 ? 1 : stillDone ? THREE.MathUtils.smoothstep((stillBegun?.hours ?? 0) - stillHours, 0.05, 0.5) : 0;
		const uncut = !followLive.value
			? undefined
			: stillDone
				? drawnMeasured
				: stillShare >= 0
					? stilledConditions(stillFrom, drawnMeasured, stillShare, stillHours)
					: onScreen;
		// Under Leane's canopy the rain no longer reaches the sea, though the cloud still rains.
		const cutSince = rainCutSince(new Date(), rainCutAsked, pageOpened, stormAsked !== null);
		const rainAloft = uncut?.precipitation ?? 0;
		const leane = cutSince !== undefined ? leaneAct(cutSince) : undefined;
		const cutCover = leane?.rain ?? 0;
		// And then she begins to stop the waves: the wind's sea and the swell sink round the boat.
		const pressing = stillShare >= 0 && !stillDone ? 0 : (leane?.sea ?? 0);
		const drawn = uncut && leane ? leaneConditions(uncut, cutCover, pressing) : uncut;
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
				// (In Peta's storm Moiraine's four hold the second swell turned 40 degrees across the
				// first: a crossing sea, whose meeting crests heap into peaks.)
				secondSwell: { height: liveOnly.secondSwellHeight, period: liveOnly.secondSwellPeriod, from: wrathOn ? (liveOnly.swellDirection + 40) % 360 : liveOnly.secondSwellDirection },
				windSea: { height: liveOnly.windWaveHeight, period: liveOnly.windWavePeriod, from: liveOnly.windWaveDirection },
				wind: { speed: windSpeed, from: liveOnly.windDirection },
				facing: PLACE.bearing,
			}, time);
			waveUniforms.foam.value = whitecaps(windSpeed);
			steepness = 1;
			crosswind = Math.sin(THREE.MathUtils.degToRad(liveOnly.windDirection + 180 - PLACE.bearing)) * Math.min(1, windSpeed / 15);
			gustiness = THREE.MathUtils.clamp((liveOnly.windGusts / Math.max(liveOnly.windSpeed, 1) - 1) * 2, 0, 1);
		} else if (measuredSea) useDialSea(waveUniforms);
		measuredSea = !!liveOnly;

		// At the height of the storm giant swells rise under the ordinary waves, which give up
		// some steepness so the crests don't fold over themselves. They belong to the story: a
		// measured sea already has its real height.
		// Past hurricane force (gusts over 120 km/h) they rise under the measured sea as well.
		const extreme = liveOnly ? beyondHurricane(liveOnly) : 0;
		// (Leane, pressing the waves, holds these down round the boat too.)
		// In Peta's storm the swell is a dying God's breathing (godsBreath): each swell a breath, the
		// runs of them deepening and fading, and between them the sea lies down.
		// In the storm for the five the swell speaks the five instead, by intensity alone (namesSea).
		const bothNow = fiveOn && wrathOn && liveOnly ? bothSea(fiveSeconds!, liveOnly.swellPeriod) : undefined;
		const namesNow = bothNow ?? (fiveOn && liveOnly ? namesSea(fiveSeconds!, liveOnly.swellPeriod) : undefined);
		const godBreath = bothNow ?? (wrathOn && liveOnly ? godsBreath(wrathSeconds!, liveOnly.swellPeriod) : namesNow);
		const breathed = godBreath?.sea ?? 1;
		const surge = (liveOnly ? 0.35 * extreme * (1 - 0.6 * pressing) : 0.55 * fury) * breathed;
		// The wind never holds steady: the whole sea swells and eases over a minute or two.
		const lull = 0.5 * Math.sin(time * 0.11) + 0.5 * Math.sin(time * 0.047 + 1.3);
		waveUniforms.surge.value = surge;
		waveUniforms.waveSteepness.value = liveOnly ? alive * breathed : steepness * (1 + 0.2 * lull) * (1 - 0.3 * fury) * alive;
		waveUniforms.gustiness.value = 0.8 * alive;
		waveUniforms.foam.value *= alive * (godBreath ? 0.45 + 0.55 * godBreath.depth : 1);
		// Peta's wave, raised at the deepest breath of each run (wrath.ts).
		layPetasWave(waveUniforms, godBreath, (fiveOn ? fiveSeconds : wrathSeconds) ?? 0, time, camera.position, skyAhead, Math.cbrt(worse) ** 2);
		waterUniforms.distortionScale.value *= lerp(0.15, 1, alive);

		// In heavy seas the view heaves, pitches and rolls like a ship's deck, and rides the giant swells.
		const sway = calmMotion ? 0 : THREE.MathUtils.smoothstep(sea, 0.3, 1) * (1 + 0.6 * fury + 0.8 * extreme) * alive;
		const heave = sway * (2 * Math.sin(time * 0.45) + Math.sin(time * 0.71 + 2));
		const pitch = sway * 0.035 * Math.sin(time * 0.52 + 1);
		if (liveOnly) {
			// On a measured sea the viewer is on a small boat: eyes EYE_HEIGHT above the water, and
			// carried up and down by the very waves that are drawn.
			const surface = measuredSeaHeight(waveUniforms, camera.position.x, camera.position.z, time) + giantWaveHeight(camera.position.x, camera.position.z, time, surge) + lensWaveHeight(waveUniforms, camera.position.x, camera.position.z, time);
			seaAtBoat = surface;
			camera.position.y += (EYE_HEIGHT + surface - camera.position.y) * follow(0.2);
		} else {
			const swell = giantWaveHeight(camera.position.x, camera.position.z, time, surge);
			camera.position.y += (cameraHeight + swell + heave - camera.position.y) * follow(0.05);
		}
		camera.rotation.z = sway * (0.06 * Math.sin(time * 0.33) + 0.025 * Math.sin(time * 0.83 + 0.7));
		// The speed rises at once with a quick movement and falls away slowly, so the slowing down
		// at the end of a reach still counts as reaching.
		if (delta > 0) {
			const speedNow = pointer.distanceTo(lastPointer) / delta;
			pointerSpeed += (speedNow - pointerSpeed) * Math.min(1, delta / (speedNow > pointerSpeed ? 0.05 : 0.4));
		}
		lastPointer.copy(pointer);
		if (!onControl && !menuOpen.value) {
			const wandering = 1 / (1 + (pointerSpeed / REACH) ** 4);
			aim.lerp(pointer, follow((1 - Math.exp(-delta / 0.08)) * wandering));
		}
		camera.rotation.y += (-lookAcross(aim.x) - camera.rotation.y) * 0.03;
		camera.rotation.x += (-lookUp(aim.y) + pitch - camera.rotation.x) * 0.03;

		const flash = alive > 0.5 ? lightning(time, sky, fury, liveOnly ? thunderAmount(liveOnly) : 1, extreme, !liveOnly) : 0;
		// The storm darkens the day. At night it is lifted instead, or the sea would be lost in black.
		const steadyExposure = exposure * lerp(1, lerp(2.5, 0.6, daylight), fury);
		renderer.toneMappingExposure = steadyExposure * (1 + 5 * flash) * (1 + 4 * moment.white * moment.veil);
		twilightUniforms.uTwilightLevel.value = twilightGlow / steadyExposure;
		// The air it is worked out from is the air at the boat (not during the storm's story, which is staged).
		const skyAir = twilightAir(liveOnly);
		twilightUniforms.uTwilightAir.value.set(skyAir.density, skyAir.height, skyAir.haze, skyAir.hazeHeight);

		// Fog thickens with the storm and fills the stillness. The fog colour is set before tone
		// mapping, so it is divided by the exposure to land on the intended screen colour.
		// And it is there whenever the air at the islands is thick, storm or no storm.
		const liveMist = liveOnly ? mistAmount(liveOnly) : 0;
		// (Under the opened sky the air clears, as the rain is held off it.)
		const stormFog = showFog.value ? 0.8 * Math.max(THREE.MathUtils.smoothstep(fury, 0.2, 1) * air.fogginess, liveMist) * (1 - 0.6 * opening.canopy) : 0;
		const fogAmount = Math.max(stormFog, moment.stillness);
		mist.lerpColors(nightMist, dayFog, daylight);
		// Manulani's light (wrath.ts) lights the air about the boat, and the sea.
		// (For the five she holds it steady over the place, lowered a little in the silence.)
		const night = 1 - THREE.MathUtils.smoothstep(daylight, 0.15, 0.5);
		const manu = namesNow ? night * THREE.MathUtils.smoothstep(fiveSeconds!, 6, 30) * (0.85 - 0.25 * (namesNow.silent ? namesNow.held : 0)) : godBreath ? manulaniLevel(godBreath, wrathSeconds!, night) : 0;
		mist.lerp(litAir, 0.3 * manu);
		manulaniSphere(camera.position, skyAhead, manuAt);
		waveUniforms.manuLight.value.set(manuAt.x, manuAt.y, manuAt.z, (MANU_BRIGHT * manu) / steadyExposure);
		fog.density = 0.0025 * fogAmount;
		fog.color.copy(mist).multiplyScalar(1 / steadyExposure);
		fogTint.copy(mist);
		mist.lerp(mist.clone().lerpColors(nightMist, dayVoid, daylight), moment.stillness);
		mist.lerp(white, Math.max(moment.white, Math.min(1, 0.4 * flash)));
		veil.value!.style.backgroundColor = mist.getStyle();
		veil.value!.style.opacity = String(Math.max(0.15 * fogAmount, moment.veil));

		// (The rain drawn is the rain falling out of the cloud: under Leane's canopy it is cut off on
		// its way down, in rain.ts.)
		const liveRain = liveOnly ? rainAmount(cutSince !== undefined ? { ...liveOnly, precipitation: rainAloft } : liveOnly) : 0;
		const rain = calmMotion || (stormOn && noRain) ? 0 : Math.max(THREE.MathUtils.smoothstep(fury, 0.15, 0.6), liveRain) * alive;
		// The weave, and what its knot does to the sea and the clouds around it.
		const oldWeave = stagedLight.value || followStory.value || weaveByHand.value ? moment.weave * (1 - Math.max(darkness, controlLevel, gathering)) : 0;
		const formed = knotFormed(oldWeave);
		knotReady = formed > 0.8;
		// The bond: how far the channelling has taken hold of the storm's wind, air and fog.
		const bond = bondLevel.value * formed * alive;
		// While the four are at work the weave to the knot is put away: nothing bright is to
		// hang in the sky.
		weave.update({
			time,
			delta,
			amount: oldWeave,
			spread: fury + 2 * moment.white * moment.veil,
			gain: 0.5 / steadyExposure,
		});
		stars.update({ date: shownMoment, shown: starsOut * (1 - fogAmount) * alive, faintest: faintestStar, glow: milkyWayOut * (1 - fogAmount) * alive, gain: 2.2 / steadyExposure, throughHole: breathing ? alive : 0 });
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
		// (Not while September's weave is out: that is another telling.)
		const tendingWanted = oldWeave > 0 || followStory.value ? 0 : tendingNow;
		if (tending < 0) tending = tendingWanted;
		tending += (tendingWanted - tending) * Math.min(1, delta / 25);
		if (day < 0) day = dayNow;
		day += (dayNow - day) * Math.min(1, delta / 25);
		const gustNow = 0.5 * Math.sin(time * 0.37) + 0.3 * Math.sin(time * 0.13 + 1.3) + 0.2 * Math.sin(time * 0.83 + 4);
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
			showOnly: query.get("show") ?? undefined,
			// Each channeller's own hand, from their temperament (the plan's first part): try it with ?hands.
			hands: query.has("hands"),
			gathering,
			// Soft against a light sky, fine against a dark one.
			soften: skyLight,
			tending: tending * alive,
			day,
			// What is really there for them to read (a barometer moving 1.5 hPa in three hours is "fast").
			pressure: liveOnly ? THREE.MathUtils.clamp(liveOnly.pressureTrend / 1.5, -1, 1) : 0,
			// (The wind's force, direction and gustiness are the forecast's. When each gust comes is
			// not in any forecast: that is made here, and its size is the real gust factor.)
			wind: liveOnly
				? {
						across: Math.sin(THREE.MathUtils.degToRad(liveOnly.windDirection + 180 - PLACE.bearing)),
						away: Math.cos(THREE.MathUtils.degToRad(liveOnly.windDirection + 180 - PLACE.bearing)),
						force: THREE.MathUtils.clamp((liveOnly.windSpeed / 3.6 / 15) * (1 + 0.6 * gustiness * gustNow), 0, 1),
						gusty: gustiness,
						// How much of a gust is blowing at this moment, 0 between gusts.
						gust: gustiness * Math.max(0, gustNow),
					}
				: { across: 1, away: 0, force: sea, gusty: 0, gust: 0 },
			heave: liveOnly ? seaAtBoat : 0,
			swellFrom: liveOnly ? THREE.MathUtils.degToRad(((liveOnly.swellDirection - PLACE.bearing + 540) % 360) - 180) : 0,
			// Enough to stand whiter than a day sky; less at night, where little is needed to read as white.
			white: lerp(0.5, 3.5, daylight) / steadyExposure,
			// (While the strongest stills it, their looking into it is the stilling's own reading.)
			unusual: liveOnly && standBack > 0.5 ? unusual(liveOnly) : NOTHING_UNUSUAL,
			below: liveOnly ? strengthBelow(liveOnly, PLACE.bearing) : 0,
			// On a quiet night of theirs one of them scouts: not in a storm, nor while the boat is
			// being held back, nor when the sea calls for nearly all four.
			scout: liveOnly ? darkness * quietEnoughToScout(liveOnly) * (1 - controlLevel) * (1 - THREE.MathUtils.smoothstep(need, 0.45, 0.6)) * alive * standBack : 0,
			tomorrow: liveOnly ? tomorrowsWind(liveOnly) : NO_WIND,
			aloft: liveOnly ? windsOverhead(liveOnly) : STILL_AIR,
			slowToRise: liveOnly ? slowToRise(liveOnly) : ORDINARY_SKY,
			thermal: liveOnly ? thermal(liveOnly) : 0,
			current: liveOnly ? Math.sin(THREE.MathUtils.degToRad(liveOnly.currentDirection - PLACE.bearing)) * Math.min(1, liveOnly.currentSpeed / 3) : 0,
			// (All twelve are in the calming while it lasts, and rest for hours after it.)
			// (And while the strongest stills the weather the twelve stand back, coming back over the
			// half hour after it is done.)
			strength: Math.max(darkness, controlLevel, gathering) * alive * (1 - (holding?.quiet ?? 0)) * (calming ? THREE.MathUtils.smoothstep(calming.after, 2, 10) : 1) * standBack * (1 - (leane?.watching ?? 0)) * (mourningOn || actOn ? 0 : 1),
			// More light by day, when it has a bright sea to show against.
			// (And more under a moon, whose light on the sea would otherwise drown it.)
			gain: (0.3 + 0.6 * daylight + 0.6 * nightfall * (1 - darkness)) / steadyExposure,
		});
		if (showControls.value && Math.floor(time) !== toldAt) {
			toldAt = Math.floor(time);
			crewNow.value = channelling.told();
			drawingNow.value = `${Math.round(1 / frameAverage)} frames a second · ${RATIOS[ratioStep]} pixels of the picture to one of the page (${RATIOS[0]} at most) · fluid at ${["full", "less", "least"][quality]} work`;
		}
		FLOW_DISTANCES.forEach((ahead, i) => {
			channelling.flowPoint(ahead, flowWorld);
			toScreen(flowWorld.x, flowWorld.y, flowWorld.z, flowScreen[i]!);
		});
		// The weaker channellers' deep weaves round the boat, slowing it: by day or night, as much as it needs.
		// (More of it, and more of the sea round the boat, when the strongest have taken it over.)
		waveUniforms.deepWeave.value = (0.3 * Math.max(holdLevel, 0.6 * channelling.masters) * alive) / steadyExposure;
		waveUniforms.deepMaster.value = channelling.masters;
		waveUniforms.channelLoss.value = lightIsLoss;
		waveUniforms.channelBalm.value = 0.9 * channelling.working * tending * lerp(0.5, 1, day) * alive;
		waveUniforms.channelBalmGlow.value = (lerp(0.012, 0.05, day) * channelling.working * tending * alive) / steadyExposure;
		waveUniforms.channelFeed.value = channelling.working * (0.6 + 0.4 * channelling.surge) * need * darkness * (1 - controlLevel) * alive;
		// Driven hard, the flow lights the sea more.
		// (In the trial the flow sheds far less light on the sea.)
		waveUniforms.channelLight.value = (1 - 0.7 * lightIsLoss) * (0.06 * (1 + 0.5 * channelling.surge) * (0.45 + 0.55 * need) * Math.max(darkness, controlLevel * nightfall, 0.6 * tending * nightfall) * alive) / steadyExposure;
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

		// (Peta's storm mixes the fresh water into the salt: no stream lies apart in such a sea, and
		// under Manulani's light the foam along its edges showed as rows of blots.)
		waveUniforms.freshFlow.value = alive * (actOn ? 0 : 1);
		waveUniforms.internalWaves.value = (0.5 + 0.5 * moment.weave) * alive;
		vortexUniforms.vortexSpin.value = time * 0.8;
		vortexUniforms.vortexGlow.value.copy(knotGlow).multiplyScalar((0.06 * formed) / steadyExposure);
		toScreen(knotPosition.x, knotPosition.y, knotPosition.z, knotScreen);
		toScreen(camera.position.x, 0, camera.position.z - 8000, horizonScreen);
		// Where the horizon crosses the middle of the screen, and its tilt, for the navigation to stand on.
		toScreen(camera.position.x - Math.sin(camera.rotation.y) * 8000, 0, camera.position.z - Math.cos(camera.rotation.y) * 8000, horizonAhead);
		// (Turned far round, the point ahead of the boat is behind the viewer; the horizon is still where it is.)
		horizonScreen.y = horizonAhead.y;
		document.documentElement.style.setProperty("--horizon", `${(horizonAhead.y * 100).toFixed(2)}vh`);
		document.documentElement.style.setProperty("--roll", `${camera.rotation.z.toFixed(4)}rad`);
		// The rain is driven by the real wind, at its own speed and the way it blows.
		if (liveOnly) {
			const blowsTowards = THREE.MathUtils.degToRad(liveOnly.windDirection + 180 - PLACE.bearing);
			rainWind.set(Math.sin(blowsTowards), 0, -Math.cos(blowsTowards)).multiplyScalar((liveOnly.windSpeed / 3.6) * alive);
		} else rainWind.set(crosswind * 20 * fury, 0, 0);
		const gustFactor = liveOnly ? THREE.MathUtils.clamp(liveOnly.windGusts / Math.max(liveOnly.windSpeed, 1) - 1, 0, 1) : 0.3;
		const gustNowRain = gustFactor * (0.5 + 0.5 * Math.sin(time * 0.9) * Math.sin(time * 0.37 + 1.1));
		// (Not needed once the sky is open over them.)
		// (Nor once Leane has cut the rain off before it reaches them.)
		shelterHold += ((stormOn && rain > 0.3 && opening.canopy < 0.5 && cutCover < 0.5 ? 1 : 0) - shelterHold) * Math.min(1, delta / 4);
		skyFoot.set(camera.position.x + skyAhead.x * SKY_OPENING.ahead, 0, camera.position.z + skyAhead.y * SKY_OPENING.ahead);
		// (The dry circle is the reach of its arms: the edge of the rain sweeps out over the boat and away.)
		skyCanopy.set(skyFoot.x, skyFoot.z, 0.9 * SKY_OPENING.spread * opening.canopy, SKY_OPENING.height);
		// All at once, the parting is the ring of calm rolling out from the boat itself.
		if (together) skyCanopy.set(camera.position.x, camera.position.z, 1300 * together.ring, 260);
		// By breath alone nothing is held over the boat: the rain itself goes.
		if (breathing) skyCanopy.setZ(0);
		skySheath.forEach((colour, i) => colour.set(colours[COLOUR_NAMES[i]!]));
		skyOpening.update({ time, boat: camera.position, ahead: skyAhead, gather: opening.gather, lift: opening.lift, open: opening.open, release: opening.release, day: daylight, gain: 1.5 / steadyExposure, sheath: skySheath, wind: rainWind });
		shelterAt.set(-0.75, -0.3, -2.5).applyEuler(camera.rotation).add(camera.position);
		rainLight.copy(rainNight).lerp(rainDay, daylight).multiplyScalar(1 / steadyExposure);
		const cutLayer = rainCut.update(
			cutSince !== undefined && !calmMotion
				? { time, delta, seconds: cutSince, aloft: rainAloft, boat: camera.position, ahead: skyAhead, wind: rainWind, day: daylight, gain: 1.5 / steadyExposure, tint: skySheath[0]! }
				: undefined,
		);
		rainfall.update({ cut: cutLayer, time, delta, rain, wind: rainWind, gust: gustNowRain, light: rainLight, flash, shelter: shelterAt, shelterRadius: 0.9, hold: shelterHold, canopy: skyCanopy, hang: together?.hang ?? breathing?.hang ?? 0, rise: together?.rise ?? 0, murmur: together?.murmur ?? 0, curtain: together && together.curtain > 0 ? -10 + 320 * together.curtain : (breathing?.curtain ?? -1000), breath: breathing?.breath ?? 0, front: breathing?.front ?? holding?.rainFront ?? -1 });
		skyBreath.update(breathing && { boat: camera.position, ahead: skyAhead, day: daylight, gain: 1.5 / steadyExposure, at: breathing });
		// Where the hole is seen, for the fog to thin under it: its middle, and how far its edge
		// reaches across and up the screen.
		holeSeen.open = breathing ? Math.min(1, breathing.hole) : 0;
		if (holeSeen.open > 0) {
			const reach = skyBreath.reach();
			const [hx, hz] = [skyAhead.x * HOLE_AHEAD, skyAhead.y * HOLE_AHEAD];
			const seenAt = (dx: number, dz: number, target: { x: number; y: number }) => {
				holeDirection.set(hx + dx, 1, hz + dz).normalize().multiplyScalar(5000).add(camera.position);
				toScreen(holeDirection.x, holeDirection.y, holeDirection.z, target);
			};
			seenAt(0, 0, holeSeen);
			seenAt(reach / 0.75, 0, holeEdge);
			holeSeen.across = Math.max(0.02, Math.abs(holeEdge.x - holeSeen.x));
			seenAt(0, reach, holeEdge);
			holeSeen.up = Math.max(0.02, Math.abs(holeEdge.y - holeSeen.y));
		}
		sacred.update(holding && { time, delta, boat: camera.position, ahead: skyAhead, wind: rainWind, day: daylight, gain: 1.5 / steadyExposure, at: holding, bg: mist });
		embroideryTints[0]!.copy(skySheath[1]!);
		embroideryTints[1]!.copy(skySheath[0]!);
		embroideryTints[2]!.copy(skySheath[2]!);
		mourning.update(
			mourningOn && liveOnly
				? {
						time,
						delta,
						boat: camera.position,
						ahead: skyAhead,
						trains: waveUniforms.waves.value,
						steepness: waveUniforms.waveSteepness.value,
						surge: waveUniforms.surge.value,
						force: Math.min(1, (rainWind.length() / 40) * (1 + 0.4 * gustNowRain)),
						aloft: windsOverhead(liveOnly),
						deficit: THREE.MathUtils.clamp((1013 - liveOnly.pressure) / 100, 0, 1),
						free: THREE.MathUtils.clamp((2 - slowToRise(liveOnly).reduce((sum, one) => sum + one, 0) / 4) / 1.5, 0, 1),
						swellFrom: THREE.MathUtils.degToRad(((liveOnly.swellDirection - PLACE.bearing + 540) % 360) - 180),
						day: daylight,
						gain: 1.5 / steadyExposure,
						tints: embroideryTints,
						bg: mist,
					}
				: undefined,
		);
		// Peta's storm: the thirteen, each linked to three ancestors, raising it.
		wrath.update(
			wrathOn && liveOnly
				? {
						time,
						delta,
						since: wrathSeconds!,
						breath: godBreath!,
						presence: bothNow ? 1 - bothNow.five : undefined,
						camera,
						manu,
						glowGain: 1.2 / steadyExposure,
						boat: camera.position,
						ahead: skyAhead,
						wind: rainWind,
						force: Math.min(1, (rainWind.length() / 40) * (1 + 0.4 * gustNowRain)),
						gust: gustNowRain,
						seaAt: (x, z) => measuredSeaHeight(waveUniforms, x, z, time) + giantWaveHeight(x, z, time, waveUniforms.surge.value) + lensWaveHeight(waveUniforms, x, z, time),
						day: daylight,
						gain: 1.5 / steadyExposure,
						white: lerp(0.5, 3.5, daylight) / steadyExposure,
						sheath: stillSheath.set(colours.strongest),
						tints: embroideryTints,
						bg: mist,
					}
				: undefined,
		);
		// The storm for the five: the fourteen holding it, and the sea speaking their names.
		five.update(
			fiveOn && liveOnly && namesNow
				? {
						time,
						delta,
						since: fiveSeconds!,
						breath: namesNow,
						silent: namesNow.silent,
						presence: bothNow?.five,
						camera,
						boat: camera.position,
						ahead: skyAhead,
						wind: rainWind,
						gust: gustNowRain,
						seaAt: (x, z) => measuredSeaHeight(waveUniforms, x, z, time) + giantWaveHeight(x, z, time, waveUniforms.surge.value) + lensWaveHeight(waveUniforms, x, z, time),
						cloud: 900,
						day: daylight,
						gain: 1.5 / steadyExposure,
						white: lerp(0.5, 3.5, daylight) / steadyExposure,
						sheath: stillSheath.set(colours.strongest),
						tints: embroideryTints,
						bg: mist,
					}
				: undefined,
		);
		embroidery.update(
			calming && {
				time,
				delta,
				force: Math.min(1, (rainWind.length() / 40) * (1 + 0.4 * gustNowRain)),
				gust: gustNowRain,
				boat: camera.position,
				ahead: skyAhead,
				wind: rainWind,
				trains: waveUniforms.waves.value,
				steepness: waveUniforms.waveSteepness.value,
				surge: waveUniforms.surge.value,
				progress: calming.progress,
				after: calming.after,
				day: daylight,
				gain: 1.5 / steadyExposure,
				tints: embroideryTints,
				bg: mist,
				pressed: waveUniforms.pressed.value,
				pressGlow: waveUniforms.pressGlow,
				// The twelve let go of it as the strongest takes the weather in hand.
				// The twelve stop their flows about the water to watch Leane.
				watching: leane?.watching ?? 0,
				// (First, while the strongest reads it: the strongest goes in alone.)
				letGo: stillShare >= 0 ? THREE.MathUtils.smoothstep(stillShare, 0, 0.035) : stillDone ? 1 : 0,
			},
		);
		// The strongest's stilling, and the water they have stilled with the weather still beyond it.
		const stillingSeen = stillShare >= 0 && !stillDone && !calmMotion && !!drawn;
		stilling.update(
			stillingSeen
				? {
						time,
						delta,
						share: stillShare,
						presence: THREE.MathUtils.smoothstep(stillGap, 0.004, 0.03),
						force: Math.min(1, (rainWind.length() / 40) * (1 + 0.4 * gustNowRain)),
						gust: gustNowRain,
						boat: camera.position,
						ahead: skyAhead,
						wind: rainWind,
						day: daylight,
						gain: 1.5 / steadyExposure,
						white: lerp(0.5, 3.5, daylight) / steadyExposure,
						sheath: stillSheath.set(colours.strongest),
					}
				: undefined,
		);
		const seaEdge = stillingSeen ? stilledSeaEdge(stillShare) : { reach: 0, width: 0 };
		waveUniforms.stillFront.value.set(camera.position.x, camera.position.z, seaEdge.reach * stilling.breath(), seaEdge.width * stilling.breath());
		waveUniforms.stillAhead.value.copy(skyAhead);
		waveUniforms.stillGlow.value = 0;
		if (seaEdge.reach > 0 && drawn) {
			const lift = THREE.MathUtils.clamp(stillFrom.waveHeight / Math.max(drawn.waveHeight, 0.1), 0.3, 3);
			const breaking = THREE.MathUtils.smoothstep(stillShare, 0.2, 0.26) * (1 - THREE.MathUtils.smoothstep(stillShare, 0.93, 0.99));
			waveUniforms.stillSea.value.set(lift, 0.9 * Math.min(1, Math.abs(lift - 1) * 1.5) * breaking * alive, whitecaps(stillFrom.windSpeed / 3.6) * alive, stilling.edgePhase());
		} else if (leane && pressing > 0.001 && uncut && drawn) {
			// The water Leane is stilling: a broad lobe round the boat, the storm's sea breaking at
			// its edge, and her moonlight lying on it.
			// (Round the boat, not out from it: begun at the boat, the storm's whole sea stood up
			// close on either side of it like a wall.)
			waveUniforms.stillFront.value.set(camera.position.x - skyAhead.x * 0.5 * leane.reach, camera.position.z - skyAhead.y * 0.5 * leane.reach, 1.5 * leane.reach, 0.85 * leane.reach);
			const lift = THREE.MathUtils.clamp(uncut.waveHeight / Math.max(drawn.waveHeight, 0.1), 0.3, 3);
			waveUniforms.stillSea.value.set(lift, 0.9 * Math.min(1, Math.abs(lift - 1) * 1.5) * pressing * alive, whitecaps(uncut.windSpeed / 3.6) * alive, time * 0.004);
			waveUniforms.foam.value *= 1 - 0.7 * pressing;
			waveUniforms.stillGlow.value = ((0.006 + 0.012 * (1 - leane.spent)) * pressing * alive) / steadyExposure;
		}
		skyAll.update({ time, boat: camera.position, ahead: skyAhead, wind: rainWind, day: daylight, gain: 1.5 / steadyExposure, sheath: skySheath, at: together ?? skyAllAt(0) });
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
			charge: oldWeave > 0 ? (Math.sin(Math.PI * Math.min(1, moment.weave / 0.5)) + 0.25 * formed) * (1 - Math.max(darkness, controlLevel, gathering)) * alive : 0,
			flow: flowScreen,
			flowPull: calmMotion ? 0 : channelling.pull,
			knot: knotScreen,
			horizon: horizonScreen,
			pointer: pointerScreen,
			fogColour: fogTint,
			gain: 1 / steadyExposure,
			hole: holeSeen,
		});

		waterUniforms.time.value += delta * lerp(0.6, 2, sea) * alive;
		waveUniforms.waveTime.value = time;
		workOutTrains(waveUniforms);
		twilightUniforms.draw(renderer);
		skyUniforms.time.value += delta * lerp(1, 4, sky) * (1 + 2 * fury);
		if (!compiled) {
			if (!compiling) compileShown();
			// (Not drawn yet, so a visitor who starts paused is still owed their one still frame.)
			drawnOnce = false;
			return;
		}
		renderer.render(scene, camera);
		// Shown once it has been drawn a few times in the form it will keep.
		if (!revealed && ++framesDrawn > 2) reveal();
	});

	const onResize = () => {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	};
	window.addEventListener("resize", onResize);

	dispose = () => {
		warming = false;
		window.removeEventListener("resize", onResize);
		window.removeEventListener("pointermove", onPointerMove);
		clearInterval(clockInterval);
		clearInterval(conditionsInterval);
		clearInterval(stormInterval);
		clearTimeout(revealAnyway);
		rainfall.dispose();
		skyOpening.dispose();
		skyAll.dispose();
		skyBreath.dispose();
		sacred.dispose();
		embroidery.dispose();
		mourning.dispose();
		wrath.dispose();
		five.dispose();
		stilling.dispose();
		rainCut.dispose();
		stopWatching();
		fluid.dispose();
		renderer.setAnimationLoop(null);
		renderer.dispose();
		renderer.domElement.remove();
	};
	if (unmounted) dispose();
});

// (Left part-way through setting up, it finishes and then puts everything away at once.)
let unmounted = false;
onBeforeUnmount(() => {
	unmounted = true;
	dispose?.();
});
</script>

<template>
	<div ref="container" class="fixed inset-0 -z-10" aria-hidden="true">
		<div ref="veil" class="pointer-events-none absolute inset-0 z-10 opacity-0" />
	</div>
	<!-- Client only: the server's clock and time zone differ from the visitor's. -->
	<ClientOnly>
		<div v-if="showColours" class="fixed inset-x-0 bottom-0 z-30 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 bg-black/80 px-3 py-2 font-mono text-sm text-white">
			<label v-for="name in COLOUR_NAMES" :key="name" class="flex items-center gap-2">
				<input v-model="colours[name]" type="color" class="h-7 w-9 cursor-pointer border-0 bg-transparent p-0" @input="pickColour" />
				<span>{{ name === "strongest" ? "the strongest's edge" : name }} {{ colours[name] }}</span>
			</label>
		</div>
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
				@input="followStory = false; weaveByHand = true"
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
