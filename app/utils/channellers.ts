// On the nights when the moon's light is weakest (about the new moon), four channellers who are linked to each other sit side by side in the small boat, just
// behind the viewer, and weave towards Hawai'i. Each sends out a tress of fine filaments,
// loosely plaited. The four are not equals, and each gives more and less from moment to moment.
// Within 3 to 7 metres of the boat the tresses have run together into a single great flow, which
// goes out low over the water, mounts into the air and dives down into the horizon, where it
// vanishes; on the way it wanders, and the wind carries it a little.
//
// The voyage is a pilgrimage, to take until 1 July 2027 (the owner's). When the current and the
// wind would carry the boat faster than that, the four hold it back, at any hour and whatever
// the moon: they do not channel towards Hawai'i then, but lay their tresses out on the water to
// either side like the lines of a sea anchor, in the sea's own blue, drawn the way the current
// runs, with the light in them travelling slowly back towards the boat.
//
// In stormy weather, at any hour, they link all the same, and are seen channelling into the
// waves to keep them in hand: the linked flow is thrown wide and low over the sea ahead, its
// filaments riding over each crest and going down into each trough, brightest on the crests.
// The waves themselves go on doing exactly what the weather data says.
//
// They always work with the sea and the wind, never against them (the owner's rule): they feed
// whatever those are already doing by the weather data. So the flow is fuller and faster the more
// is going on, the wind takes its loose filaments with it, its light rises and falls with each
// real wave that passes under it, and along it the waves stand a little steeper and the gusts
// bite a little harder (`fed` in gerstner-waves.ts). Their light is what
// shows the sea (the water's share of this is in gerstner-waves.ts).
//
// The filaments are the same hard-edged ribbons as the weave's, and ride just above the waves.
import * as THREE from "three";
import { CHANNELLERS, channelPathChunk } from "./channel-path";
import type { GerstnerUniforms } from "./gerstner-waves";
import { ribbonShaderChunk, stripIndices, WEAVE_RENDER_ORDER } from "./weave";

// What the weaving looks like follows the owner's reference (the women channelling together in
// The Wheel of Time): not a few drawn lines but a great many hair-fine filaments streaming
// together like silk in a current. They lie in loose tresses that open out and gather again;
// each filament shows only for a stretch at a time, and those stretches travel outward, which
// is what makes the whole seem to flow. Most are a pale blue-white. A few are gold, shorter and
// brighter and looser, and fly about the tress like sparks.
const TINTS = [0xb0cdfb, 0xdde8fd, 0xf0c98e].map((hex) => new THREE.Color(hex));
// When the four are linked and working with their whole strength, every element shows in its
// own colour (the owner's): akasha whiter, air bluer, earth green, fire yellow to red, water a
// deeper blue, metal grey and half seen through. Graded, at the owner's direction, so that they
// are not six paints but leanings of one tone, the pale silver-blue of the flow: each goes only
// part of the way from that tone towards its own, and how far it goes keeps shifting along the
// filament and from moment to moment.
const BASE = new THREE.Color(0xcdd9ec);
const ELEMENTS = [0xf6f7fb, 0xa9c8f4, 0xb4d0bd, 0xecbd98, 0x8099d2, 0xa7afba].map((hex) => new THREE.Color(hex));
const METAL = 5;
const BLUE = 0;
const WHITE = 1;
const GOLD = 2;
// Besides the filaments each tress has a few veils: broad, soft-edged and very faint. They are
// the glow that hangs in a tress between its filaments, the light the filaments shed on the air.
const VEILS = 6;
// Filaments to each channeller, and how many of them are gold.
const FILAMENTS = 64;
const GOLDEN = 14;
const SEGMENTS = 300;

const vertexShader = (trains: number) => /* glsl */ `
attribute float aT;
attribute float aSide;
// Which channeller (0..3), which of the three strands of their tress (0..2), colour, width in pixels.
attribute vec4 aThread;
// Two random numbers, how far from the middle of its strand it lies (0..1), and how loosely it is held.
attribute vec4 aSeed;
// Brightness, how many lit stretches it has along its length, how fast they travel, and its element.
attribute vec4 aKind;
// 1 for a veil, 0 for a filament.
attribute float aSoft;
uniform float uStrength;
uniform vec3 uTints[ 3 ];
uniform vec3 uElements[ 6 ];
uniform vec3 uBaseTone;
// The sea, to ride on it: the same wave trains the water is drawn with.
uniform vec4 waves[ ${trains} ];
uniform float waveSteepness;
uniform float waveScale;
uniform float waveTime;
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;
varying float vSoft;
${ribbonShaderChunk}
${channelPathChunk}

// Height of the sea under the last point worked out, for lighting the filaments by the waves.
float seaUnder;

float seaHeight( vec2 p ) {
	float distanceToEye = length( p - cameraPosition.xz );
	float height = 0.0;
	for ( int i = 0; i < ${trains}; i ++ ) {
		float wavelength = waves[ i ].w * waveScale;
		float k = 6.28319 / wavelength;
		vec2 d = vec2( sin( waves[ i ].x ), - cos( waves[ i ].x ) );
		float steepness = waves[ i ].z * waveSteepness
			* ( 1.0 - smoothstep( 0.5 * pow( wavelength, 1.5 ), pow( wavelength, 1.5 ), distanceToEye ) );
		height += steepness / k * sin( k * ( dot( d, p ) - sqrt( 9.8 / k ) * waveTime ) + waves[ i ].y );
	}
	return height;
}

// Smooth noise, -1..1: slow bends with no corners, unlike kink().
float drift( float x ) {
	float i = floor( x );
	float f = fract( x );
	return mix( hash1( i ), hash1( i + 1.0 ), f * f * ( 3.0 - 2.0 * f ) ) * 2.0 - 1.0;
}

// Metres ahead of the boat for a point along the thread. Even steps along the thread are even
// steps on the screen, more or less: each covers a fixed share of the distance already gone.
float aheadAt( float t ) {
	return 3.0 * pow( 1100.0, t ) - 5.0;
}

vec3 threadPoint( float t ) {
	float who = aThread.x;
	float ahead = aheadAt( t );
	float along = max( ahead, 0.0 );
	// Distance as the eye counts it; everything that varies along a filament varies with this.
	float q = log( along + 12.0 );
	float way = channelWay( along );
	// The tress opens out as it goes, breathes (loosens and is drawn tight again, in waves that
	// travel outward), and is gathered to nothing as it comes down to the horizon.
	float breath = 0.6 + 0.4 * sin( q * 3.3 - channelTime * 0.35 + who * 1.9 );
	// A channeller who is giving more has a fuller tress.
	// The more the sea and wind are doing, the more there is to feed, and the fuller the flow.
	// (Held back, a tress is opened out wide and thin over the water.)
	// (In a storm the linked flow is thrown wide over the waves ahead.)
	float width = ( 0.1 + 0.04 * along ) * ( 1.0 + 1.8 * channelHold ) * ( 1.0 + 1.4 * channelControl ) * ( 0.75 + 0.7 * channelSea.x ) * ( 1.0 + 0.4 * channelSurge ) * smoothstep( - 4.0, 8.0, ahead ) * breath * ( 0.55 + 0.7 * channelStrength( who ) ) * ( 1.0 - smoothstep( 0.6, 0.97, way ) );
	// Its three strands pass over and under each other: a plait, loosely kept.
	float phase = q * 6.0 - channelTime * 0.4 + aThread.y * 2.0944 + who * 0.7;
	vec2 across = vec2( sin( phase ), 0.5 * sin( 2.0 * phase ) ) * 0.42;
	// Each filament has its own place in its strand, and winds slowly round it.
	float wind = aSeed.x * 6.28319 + q * ( 1.2 + 1.6 * aSeed.y ) - channelTime * 0.15;
	across += aSeed.z * 0.5 * vec2( cos( wind ), sin( wind ) );
	// And strays from it, some hardly at all and some a long way.
	// (Less and less as the flow goes down to the horizon, where strays would only make a tangle.)
	across += aSeed.w * 0.55 * ( 1.0 - 0.6 * channelHold ) * ( 1.0 - 0.85 * smoothstep( 0.3, 0.8, way ) ) * vec2(
		drift( q * 2.3 + aSeed.x * 40.0 - channelTime * 0.22 ),
		drift( q * 2.9 + aSeed.y * 40.0 + channelTime * 0.17 )
	);
	// The wind takes the loose ones with it.
	across.x += channelWind.x * aSeed.w * 0.9;
	// They leave the channeller's two open hands spread like fingers, as loose wisps, and are
	// only drawn into a tress a little way out.
	float fromHands = channelApart( along ) * ( 1.0 - aSoft );
	float hand = aSeed.x < 0.5 ? - 1.0 : 1.0;
	vec2 loose = vec2( hand * 0.32 + ( aSeed.y - 0.5 ) * 0.5, ( fract( aSeed.x * 7.0 ) - 0.5 ) * 0.35 ) * fromHands;
	vec2 p = channelBoat + vec2( channelLine( who, along ) + across.x * width + loose.x, - ahead );
	// Out of raised hands, then down to run just clear of the water.
	// Held back, it lies on the water itself.
	float low = mix( max( 0.35, 1.3 + across.y * width * 0.7 + loose.y ), 0.15, channelHold * smoothstep( 4.0, 14.0, ahead ) ) + channelRise( who, along );
	seaUnder = seaHeight( p );
	// In a storm they channel into the waves themselves: the filaments ride over each crest and
	// go down into the water of each trough, so the weaving is seen entering wave after wave.
	float crest = clamp( seaUnder / max( 0.25 * channelSea.y, 0.1 ), - 1.0, 1.0 );
	low = mix( low, 0.2 + 0.7 * crest, channelControl * smoothstep( 6.0, 20.0, ahead ) );
	float height = mix( cameraPosition.y - 1.2, seaUnder + low, smoothstep( - 2.0, 14.0, ahead ) );
	return vec3( p.x, height, p.y );
}

void main() {
	mat4 viewProjection = projectionMatrix * viewMatrix;
	vec4 clip = viewProjection * vec4( threadPoint( aT ), 1.0 );
	// They work with the waves: each crest that passes under the flow lifts its light, each trough dims it.
	// (Far more so in a storm, when the waves are what they are working on.)
	float withWaves = 1.0 + ( 0.7 + 0.3 * channelControl ) * clamp( seaUnder / max( 0.25 * channelSea.y, 0.1 ), - 1.0, 1.0 );
	vec4 clipAhead = viewProjection * vec4( threadPoint( aT + 0.002 ), 1.0 );
	gl_Position = ribbonPosition( clip, clipAhead, aSide, aThread.w );

	float ahead = max( aheadAt( aT ), 0.0 );
	float q = log( ahead + 12.0 );
	// Lit only in stretches, which run outward along it.
	float lit = smoothstep( - 0.25, 0.3, drift( q * aKind.y - ( channelStream - channelBack ) * aKind.z + aSeed.x * 91.0 ) );
	// A channeller who is giving less has fewer filaments alight, and those fainter.
	float strength = channelStrength( aThread.x );
	lit *= withWaves * strength * ( 1.0 - smoothstep( strength * 1.1 - 0.12, strength * 1.1, aSeed.y ) );
	// A veil does not come and go in stretches: it is a steady glow that breathes with the tress.
	if ( aSoft > 0.5 ) lit = strength * ( 0.75 + 0.25 * withWaves );
	// Where the four tresses have run together there are four times the filaments in one place,
	// and each is drawn fainter, or the middle of the flow would burn out to plain white.
	lit /= 1.0 + 2.8 * ( 1.0 - channelApart( ahead ) ) * ( 1.0 - channelHold );
	// Held back, the weaving does not reach for the horizon: it is spent within a few hundred metres.
	lit *= mix( 1.0, 1.0 - smoothstep( 50.0, 300.0, ahead ), channelHold );
	int element = int( aKind.w + 0.5 );
	// How far this stretch of the filament leans towards its element's colour just now.
	float leaning = 0.5 + 0.5 * drift( q * 1.1 - channelStream * 0.12 + aSeed.y * 57.0 );
	vTint = mix( uTints[ int( aThread.z + 0.5 ) ], mix( uBaseTone, uElements[ element ], 0.35 + 0.65 * leaning ), channelSurge );
	// Metal is half seen through.
	if ( element == ${METAL} ) lit *= 1.0 - 0.5 * channelSurge;
	// Held back, it takes the sea's own deeper blue.
	vTint = mix( vTint, vec3( 0.46, 0.62, 0.88 ), 0.6 * channelHold );
	// Fainter all the way down the dive, and gone before the horizon: they must not gather
	// into a light there.
	// (Driven hard there are more filaments alight at once, so each is drawn a little fainter,
	// or their colours would burn out to white where they lie thickest.)
	vAlpha = uStrength * aKind.x * ( 1.0 - 0.4 * channelSurge ) * lit * ( 0.55 + 1.1 * channelPulse( aThread.x, ahead ) ) * smoothstep( 0.0, 0.05, aT )
		* ( 1.0 - smoothstep( 0.7, 1.0, channelWay( ahead ) ) ) / ( 1.0 + ahead / 1500.0 );
	vEdge = aSide;
	vSoft = aSoft;
}
`;

const fragmentShader = /* glsl */ `
uniform float uGain;
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;
varying float vSoft;

void main() {
	// A filament has a hard edge, softened by no more than it takes to stop it shimmering.
	// A veil has none: it is brightest along its middle and fades away to both sides.
	float edge = mix( 1.0 - smoothstep( 0.55, 1.0, abs( vEdge ) ), pow( 1.0 - vEdge * vEdge, 2.0 ), vSoft );
	gl_FragColor = vec4( vTint * uGain, edge * vAlpha );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

// What happens when the page opens on one of their nights (the owner's story). They are
// channelling as the page opens. After a few seconds it stops, for 4 to 9 seconds. Then the
// strongest of them begins again alone, and for 20 to 25 seconds they work; then it stops, and
// the sea stays dark.
// How they work in that time depends on what the sea and wind call for (`need`, from the weather
// data), because force that is not needed is not used, and neither is linking:
//   little         the strongest works alone, lightly
//   some           one or two of the others work beside her, each for themselves
//   a good deal    all four work, still each for themselves
//   much           the others link with her one by one within 2 to 5 seconds, and linked they
//                  drive the flow hard along the surface of the sea in all the elements' colours
const between = (low: number, high: number) => low + Math.random() * (high - low);
const STRONGEST = 2;
// The order the others come in, as more is called for: by their strength.
const ORDER = [STRONGEST, 1, 0, 3];
// How many of them work, and whether they link, for a given need.
const workingFor = (need: number) => (need < 0.2 ? 1 : need < 0.4 ? 2 : need < 0.6 ? 3 : 4);
const LINK_FROM = 0.6;

export interface ChannellerState {
	time: number;
	delta: number;
	// What the sea and wind are doing, which is what they work with: 0..1 from calm to storm,
	// and the height of the waves in metres.
	energy: number;
	waveHeight: number;
	// 0..1 how much the sea and wind call for from them.
	need: number;
	// 0..1 how much the boat has to be held back, and the current across the view (-1..1).
	hold: number;
	current: number;
	// 0..1 how stormy it is: in a storm they link and channel into the waves.
	control: number;
	// 0..1 how much they are at work: 0 while the sun or moon lights the sea.
	strength: number;
	// Multiplies the light so it holds its brightness at any exposure.
	gain: number;
}

export function createChannellers(scene: THREE.Scene, camera: THREE.Camera, sea: GerstnerUniforms) {
	const strips = CHANNELLERS * (FILAMENTS + VEILS);
	const count = strips * (SEGMENTS + 1) * 2;
	const along = new Float32Array(count);
	const side = new Float32Array(count);
	const thread = new Float32Array(count * 4);
	const seed = new Float32Array(count * 4);
	const kind = new Float32Array(count * 4);
	const soft = new Float32Array(count);
	let vertex = 0;
	for (let who = 0; who < CHANNELLERS; who++) {
		for (let filament = 0; filament < FILAMENTS + VEILS; filament++) {
			const veil = filament >= FILAMENTS;
			const gold = filament < GOLDEN;
			// One blue-white filament in ten is a bright one, the glint on the tress.
			const bright = !gold && Math.random() < 0.1;
			const threadValues = [who, filament % 3, gold ? GOLD : veil || Math.random() >= 0.35 ? BLUE : WHITE, veil ? 9 + 9 * Math.random() : gold ? 0.8 : bright ? 1 : 0.6];
			// Most lie close in their strand; the gold ones stray far.
			const seedValues = [Math.random(), veil ? 0 : Math.random(), veil ? 0.4 * Math.random() : Math.sqrt(Math.random()), veil ? 0.1 : gold ? 1.4 + 1.8 * Math.random() : Math.random() ** 3 * 1.6];
			// Between them the four work every element; each has two that are most their own.
			const element = Math.random() < 0.6 ? (who + (filament % 2) * 3) % 6 : Math.floor(Math.random() * 6);
			const kindValues = gold
				? [0.9, 9 + 8 * Math.random(), 1.6 + 1.4 * Math.random(), element]
				: [veil ? 0.05 : bright ? 0.95 : 0.22 + 0.3 * Math.random(), 1.6 + 3 * Math.random(), 0.5 + 0.8 * Math.random(), element];
			for (let i = 0; i <= SEGMENTS; i++) {
				for (const edge of [-1, 1]) {
					along[vertex] = i / SEGMENTS;
					side[vertex] = edge;
					thread.set(threadValues, vertex * 4);
					seed.set(seedValues, vertex * 4);
					kind.set(kindValues, vertex * 4);
					soft[vertex] = veil ? 1 : 0;
					vertex++;
				}
			}
		}
	}
	const geometry = new THREE.BufferGeometry();
	// The shader works out the real positions; three.js only needs the count.
	geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
	geometry.setAttribute("aT", new THREE.BufferAttribute(along, 1));
	geometry.setAttribute("aSide", new THREE.BufferAttribute(side, 1));
	geometry.setAttribute("aThread", new THREE.BufferAttribute(thread, 4));
	geometry.setAttribute("aSeed", new THREE.BufferAttribute(seed, 4));
	geometry.setAttribute("aKind", new THREE.BufferAttribute(kind, 4));
	geometry.setAttribute("aSoft", new THREE.BufferAttribute(soft, 1));
	geometry.setIndex(stripIndices(strips, SEGMENTS));
	const uniforms = {
		uStrength: { value: 0 },
		uGain: { value: 1 },
		uTints: { value: TINTS },
		uElements: { value: ELEMENTS },
		uBaseTone: { value: BASE },
		uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
		uResolution: { value: new THREE.Vector2(1, 1) },
		// The same objects the water uses, so both always agree.
		channelBoat: sea.channelBoat,
		channelTime: sea.channelTime,
		channelWind: sea.channelWind,
		channelSea: sea.channelSea,
		channelGate: sea.channelGate,
		channelControl: sea.channelControl,
		channelHold: sea.channelHold,
		channelCurrent: sea.channelCurrent,
		channelBack: sea.channelBack,
		channelSurge: sea.channelSurge,
		channelStream: sea.channelStream,
		waves: sea.waves,
		waveSteepness: sea.waveSteepness,
		waveScale: sea.waveScale,
		waveTime: sea.waveTime,
	};
	const mesh = new THREE.Mesh(
		geometry,
		new THREE.ShaderMaterial({
			uniforms,
			vertexShader: vertexShader(sea.waves.value.length),
			fragmentShader,
			transparent: true,
			depthWrite: false,
			side: THREE.DoubleSide,
			blending: THREE.AdditiveBlending,
		}),
	);
	mesh.frustumCulled = false;
	mesh.renderOrder = WEAVE_RENDER_ORDER;
	scene.add(mesh);

	// The story. `since` is seconds into the present part of it.
	let part: "opening" | "stopped" | "working" | "over" = "opening";
	let linking = false;
	let since = 0;
	let lasts = between(3, 5);
	// When each of the four comes in after the strongest has begun, and for how long they then hold it.
	let joins = [0, 0, 0, 0];
	const gate = [1, 1, 1, 1];
	let surge = 0;
	const tell = (delta: number, need: number) => {
		since += delta;
		// Before the pause they work as the weather calls for, each for themselves.
		if (part === "opening") joins = joins.map((_, who) => (ORDER.indexOf(who) < workingFor(need) ? 0 : Infinity));
		if (since > lasts && part !== "over") {
			since = 0;
			if (part === "working") part = "over";
			else if (part === "stopped") {
				part = "working";
				linking = need >= LINK_FROM;
				// Those not called for do not come in at all.
				joins = joins.map((_, who) => (who === STRONGEST ? 0 : ORDER.indexOf(who) < workingFor(need) ? between(2, 5) : Infinity));
				lasts = Math.max(...joins.filter(Number.isFinite)) + between(20, 25);
			} else {
				part = "stopped";
				lasts = between(4, 9);
			}
		}
		const ease = (value: number, towards: number, seconds: number) => value + (towards - value) * Math.min(1, delta / seconds);
		for (let who = 0; who < CHANNELLERS; who++) {
			const working = (part === "opening" || part === "working") && since >= joins[who]!;
			// It is let go of at once and taken up again more slowly.
			gate[who] = ease(gate[who]!, working ? 1 : 0, working ? 0.9 : 0.35);
		}
		// Their whole strength comes only when they link, and only once all four are in.
		surge = ease(surge, part === "working" && linking && since >= Math.max(...joins) ? 1 : 0, part === "working" ? 1.6 : 0.4);
	};

	const update = ({ time, delta, energy, waveHeight, need, hold, current, control, strength, gain }: ChannellerState) => {
		mesh.visible = strength > 0.001;
		// The story only runs on their nights, and starts from its beginning on each.
		// Holding the boat back is not part of the story: it is steady work, for as long as the sea
		// would carry them too fast, by as many of them as it takes. The story starts afresh after it.
		// Nor is a storm: then all four are linked for as long as it lasts, and work on the waves.
		const holding = hold > 0.02;
		if (mesh.visible && control > 0.05) {
			for (let who = 0; who < CHANNELLERS; who++) gate[who] += (1 - gate[who]!) * Math.min(1, delta / 0.9);
			surge += (1 - surge) * Math.min(1, delta / 1.6);
			part = "opening";
			since = 0;
		} else if (mesh.visible && holding) {
			for (let who = 0; who < CHANNELLERS; who++) {
				const working = ORDER.indexOf(who) < workingFor(0.2 + hold);
				gate[who] += ((working ? 1 : 0) - gate[who]!) * Math.min(1, delta / 0.9);
			}
			surge += (0 - surge) * Math.min(1, delta / 0.4);
			part = "opening";
			since = 0;
		} else if (mesh.visible) tell(delta, need);
		else {
			part = "opening";
			since = 0;
			lasts = between(3, 5);
			gate.fill(1);
			surge = 0;
			linking = false;
		}
		sea.channelGate.value.fromArray(gate);
		sea.channelSurge.value = surge;
		sea.channelSea.value.set(energy, waveHeight);
		// What streams along the flow runs faster the more the sea and wind are doing, and three
		// times as fast again when it is driven.
		sea.channelStream.value += delta * (0.6 + 1.2 * energy) * (1 + 2 * surge) * (1 - hold);
		// Held back, what streams along the weaving runs the other way, in towards the boat, and slowly.
		sea.channelBack.value += delta * 0.45 * hold;
		sea.channelHold.value = hold;
		sea.channelControl.value = control;
		sea.channelCurrent.value = current;
		sea.channelBoat.value.set(camera.position.x, camera.position.z);
		sea.channelTime.value = time;
		// No more light than the work calls for.
		uniforms.uStrength.value = strength * (0.45 + 0.55 * Math.max(need, hold, control));
		uniforms.uGain.value = gain;
		uniforms.uResolution.value.set(window.innerWidth, window.innerHeight).multiplyScalar(uniforms.uPixelRatio.value);
		// 0..1 how much channelling there is, and how hard it is driven.
		return { working: mesh.visible ? Math.max(...gate) : 0, surge };
	};

	return { update };
}
