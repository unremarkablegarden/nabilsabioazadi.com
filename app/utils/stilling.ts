// The stilling, as it is seen (channelled-storm.ts has the why and the weather): the strongest,
// alone, stills whatever weather is on screen until it is the weather as measured. Their weave is
// white, and it is one great thing, never a few threads: 1,400 filaments in their sea weave, which
// is 1.8 times all the twelve's hawsers together (the owner: "strongest... immensely stronger").
//
//   reading   first, alone, as the strongest always goes into what is unusual: one long rope out
//             low from their hands, up in a curve to the cloud base, over and down into the sea
//             far ahead, and back under the water to the boat. Air first, then water.
//   the sky   out of their two hands, one either side, a great rope runs out and up to the cloud
//             base and along it, all one curve from the left hand round to the right: the edge of
//             what they have stilled overhead. It lies along that edge as a loose roller of many
//             filaments, turning over as it goes, and rolls outward across the sky while the
//             thunder, the rain and the cloud go out of the weather behind it.
//   the sea   then the same on the sea: the rope lies along the edge of the water they have
//             stilled, half in the sea, rolling outward from the boat to the horizon. Within it the
//             sea is the stilled sea; beyond it, still the weather being stilled, which piles up
//             against the roller and breaks white and dies there (gerstner-waves.ts, stillChunk).
//   let go    each is cut at the hands when its work is done, and the cut runs out along it.
//
// Effort, shown in the sea and the sky and in how the rope behaves, never in brightness: they roll
// it out with the breath, a slow stroke of some ten seconds (deeper than the twelve's), the roller
// tightening and turning faster as they haul and the edge going out a little further each time; a
// real gust bows it back downwind; under the real wind's load it quivers, slowly. Every line is one
// curve: the roller's filaments wind loosely round it, each at its own pace, so none line up; the
// edge runs in and out; both ends come back to the boat, to the strongest's two hands.
//
// Linked (the mighty's stilling), Siuan leads the link (the owner, 21 October: "let Siuan create
// the body for the linking on the boat"): as in the books one sister holds a circle and all the
// others' strength flows into her hands, so the sky's and the sea's rollers are cast from Siuan's
// hands (Siuan · Fathom's, at the rail right of the strongest) and are her colour, the tamed sea
// glass of her four. The strongest, the greatest strength in the link, flows through her: their
// white is wound through her roller along all its length, as many filaments as their 4.9 measures
// carry. The reading is still the strongest's own, alone, before the link is made.
import * as THREE from "three";
import { lines } from "./embroidery";
import { pixelRatio, ribbonShaderChunk, WEAVE_RENDER_ORDER } from "./weave";

const SEA_FILAMENTS = 1400;
const SKY_FILAMENTS = 900;
const READING_FILAMENTS = 360;
// Siuan's telling: Siuan · Fathom's strands, at the mighty's 2.5 measures.
const TELLING_FILAMENTS = 300;
// Where the hands are that cast the rollers, across from the eye (m): the strongest's, Siuan's.
const STRONGEST_HANDS = 0.75;
const SIUAN_HANDS = 2.25;

const vertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute vec2 aCell;
attribute vec4 aSeed;
uniform float uKind;
// Whose hands cast it: how far right of the eye they sit (m).
uniform float uHandsAt;
uniform float uTime;
uniform vec3 uBoat;
uniform vec2 uAhead;
// The edge: how far ahead it reaches (m), its widest half-width (m), its height (0 on the sea, the
// cloud base in the sky), and how thick the roller is for its distance.
uniform vec4 uFront;
uniform float uEdgePhase;
uniform float uCast;
uniform float uLetGo;
uniform float uRoll;
uniform float uHaul;
uniform float uGust;
uniform float uTension;
uniform vec3 uWindDir;
uniform float uFade;
uniform float uDay;
varying float vAlpha;
varying float vEdge;
${ribbonShaderChunk}

vec3 aheadDir() { return vec3( uAhead.x, 0.0, uAhead.y ); }
vec3 acrossDir() { return vec3( - uAhead.y, 0.0, uAhead.x ); }
vec3 bearing( float a ) { return aheadDir() * cos( a ) + acrossDir() * sin( a ); }

// The hands it is cast from: the strongest's (the third seat at the rail, just right of the
// viewer), or Siuan's when she leads the link (the fourth).
vec3 hand( float side ) { return uBoat + acrossDir() * ( uHandsAt + 0.35 * side ) + vec3( 0.0, - 1.2, 0.0 ) + aheadDir() * 0.5; }

// The same edge as the water's (stillHalfWidth in gerstner-waves.ts): how far it reaches across
// at x ahead, on one side.
float halfWidth( float x, float side ) {
	float f = clamp( x / max( uFront.x, 1.0 ), 0.0, 1.0 );
	return uFront.y * 1.45 * sqrt( f ) * pow( 1.0 - f, 0.15 ) * ( 1.0 + 0.1 * sin( x * 0.0021 + 1.7 + 2.1 * side + uEdgePhase ) + 0.05 * sin( x * 0.0063 + side + 2.0 * uEdgePhase ) );
}

// The edge at s, from the left hand (0) out and round the far tip (0.5) and back to the right
// hand (1): leaving the boat sideways and curving forward, never straight.
vec3 edgeAt( float s ) {
	float side = s < 0.5 ? - 1.0 : 1.0;
	float x = uFront.x * 0.5 * ( 1.0 - cos( 6.28318 * clamp( s, 0.0, 1.0 ) ) );
	vec3 p = uBoat + aheadDir() * x + acrossDir() * side * halfWidth( x, side );
	float away = 2.0 * min( s, 1.0 - s );
	vec3 h = hand( side );
	// Out of the hands, and (in the sky) up in one long rise.
	float y = mix( h.y, uFront.z, uFront.z > 1.0 ? smoothstep( 0.0, 0.5, away ) : smoothstep( 0.0, 0.03, away ) );
	p = mix( h, p, smoothstep( 0.0, 0.02, away ) );
	p.y = y;
	return p;
}

vec3 rollerPoint( float s ) {
	vec3 c = edgeAt( s );
	vec3 along = normalize( edgeAt( s + 0.003 ) - edgeAt( s - 0.003 ) + vec3( 1e-5 ) );
	vec3 radial = c - uBoat;
	radial.y = 0.0;
	float dist = length( radial );
	vec3 outward = normalize( cross( along, vec3( 0.0, 1.0, 0.0 ) ) + vec3( 1e-5 ) );
	if ( dot( outward, radial ) < 0.0 ) outward = - outward;
	vec3 up = normalize( cross( outward, along ) );
	if ( up.y < 0.0 ) up = - up;
	float span = sin( 3.14159 * s );
	// As thick for its distance as a hawser is, drawn in a little as they haul; and like a stroke
	// of a brush, not a pipe, swelling and thinning along its length.
	float swell = max( 0.22, 0.6 + 0.4 * sin( s * 9.0 + 1.3 + uTime * 0.02 + uKind ) + 0.3 * sin( s * 23.0 + 0.7 + 2.0 * uKind ) );
	float rad = ( 0.5 + uFront.w * 0.045 * dist ) * ( 1.0 - 0.16 * uHaul ) * swell;
	// A gust bows it back downwind; under load it quivers, slowly.
	c += uWindDir * uGust * 0.012 * dist * span;
	c += up * uTension * 0.004 * dist * sin( uTime * 0.9 + s * 14.0 + uKind ) * span;
	// Each filament winds round it at its own pace, so that none line up with another.
	float turns = 7.0 + 5.0 * aSeed.x;
	float phi = aSeed.y * 6.28318 + s * turns * 6.28318 - uRoll * ( 0.85 + 0.3 * aSeed.z );
	float rr = rad * ( 0.15 + 0.85 * sqrt( aSeed.z ) ) * ( 1.0 + 0.5 * sin( s * ( 13.0 + 11.0 * aSeed.w ) + aSeed.x * 30.0 + uTime * 0.15 ) );
	// A quarter of them trail back from it over what is stilled, as a brush drags: on the sea
	// lying low on the water and in and out of it, in the sky hanging under the cloud.
	if ( aSeed.w > 0.75 ) {
		float back = ( aSeed.w - 0.75 ) / 0.25;
		vec3 behind = - outward * rad * ( 1.5 + 9.0 * back ) * ( 0.6 + 0.4 * sin( s * 7.0 + aSeed.x * 20.0 + uTime * 0.05 ) );
		vec3 along_ = along * rad * 2.0 * sin( s * 5.0 + aSeed.y * 9.0 );
		float low = uFront.z > 1.0 ? - rad * ( 0.3 + 0.8 * back ) : 0.4 + 0.4 * sin( s * 31.0 + aSeed.z * 9.0 + uTime * 0.3 );
		return c + behind + along_ + vec3( 0.0, low, 0.0 ) + up * rr * 0.15 * sin( phi );
	}
	// The curl leans forward at its top, as a breaking sea's does.
	return c + outward * rr * ( cos( phi ) + 0.3 * ( 1.0 + sin( phi ) ) ) + up * rr * 0.9 * sin( phi );
}

vec3 bezier( vec3 a, vec3 b, vec3 c, vec3 d, float t ) {
	float s = 1.0 - t;
	return s * s * s * a + 3.0 * s * s * t * b + 3.0 * s * t * t * c + t * t * t * d;
}

// The reading: out low and long from the left hand over the sea, up in a broad curve leaning with
// the wind to the cloud base, along under it, and down into the sea far ahead; back under the
// water to the right hand. Three curves meeting smoothly.
vec3 readingCentre( float s ) {
	vec3 A = aheadDir();
	vec3 X = acrossDir();
	vec3 W = uWindDir * 0.35;
	vec3 top = uBoat + A * 1300.0 + X * 150.0 + W * 400.0 + vec3( 0.0, 420.0, 0.0 );
	vec3 into = uBoat + A * 2300.0 + X * 450.0 + vec3( 0.0, - 15.0, 0.0 );
	vec3 before = uBoat + A * 2200.0 + X * 380.0 + vec3( 0.0, 160.0, 0.0 );
	if ( s < 0.45 ) return bezier( hand( - 1.0 ), uBoat + A * 400.0 - X * 140.0 + vec3( 0.0, 2.0, 0.0 ), uBoat + A * 950.0 - X * 60.0 + W * 200.0 + vec3( 0.0, 330.0, 0.0 ), top, s / 0.45 );
	vec3 onward = normalize( top - ( uBoat + A * 950.0 - X * 60.0 + W * 200.0 + vec3( 0.0, 330.0, 0.0 ) ) );
	if ( s < 0.75 ) return bezier( top, top + onward * 450.0, before, into, ( s - 0.45 ) / 0.3 );
	return bezier( into, into + ( into - before ) * 0.3, uBoat + A * 400.0 + X * 60.0 + vec3( 0.0, - 40.0, 0.0 ), hand( 1.0 ), ( s - 0.75 ) / 0.25 );
}

vec3 readingPoint( float s ) {
	vec3 c = readingCentre( s );
	float dist = length( ( c - uBoat ).xz );
	// (Swelling and thinning along its length, as a stroke of a brush does, never a pipe.)
	float rad = ( 0.3 + 0.02 * dist ) * ( 1.0 - 0.2 * uHaul ) * max( 0.3, 0.7 + 0.35 * sin( s * 11.0 + 0.4 ) + 0.25 * sin( s * 29.0 + 1.9 ) );
	vec3 side = normalize( cross( readingCentre( s + 0.003 ) - readingCentre( s - 0.003 ), vec3( 0.0, 1.0, 0.0 ) ) + vec3( 1e-5 ) );
	vec3 up = vec3( 0.0, 1.0, 0.0 );
	float phi = aSeed.y * 6.28318 + s * ( 5.0 + 4.0 * aSeed.x ) * 6.28318 + uTime * 0.1 * ( aSeed.z - 0.5 );
	// Loose, each filament wandering in and out of it at its own pace: a rope feeling its way.
	float rr = rad * ( 0.2 + 0.8 * sqrt( aSeed.z ) ) * ( 1.0 + 0.45 * sin( s * ( 11.0 + 9.0 * aSeed.w ) + aSeed.x * 30.0 + uTime * 0.2 ) );
	c += uWindDir * uGust * 0.01 * dist * sin( 3.14159 * s );
	return c + ( side * cos( phi ) + up * sin( phi ) ) * rr;
}

// Wound through the linked roller along all its length: the strongest's white through Siuan's
// roller, the strongest flowing through her.
// (Cast out alone to the sea's edge, seen end-on it stood up as a pillar.)
vec3 placeAt( float t ) { return uKind < 0.5 ? readingPoint( t ) : rollerPoint( t ); }

void main() {
	vec3 here = placeAt( aT );
	vec3 next = placeAt( min( aT + 0.004, 1.0 ) ) + ( aT >= 0.996 ? here - placeAt( aT - 0.004 ) : vec3( 0.0 ) );
	float shown = 1.0;
	if ( uKind < 0.5 ) {
		// Cast out from the left hand; cut at the hands and the cut runs on round.
		shown *= smoothstep( uCast, uCast - 0.03, aT ) * smoothstep( uLetGo, uLetGo + 0.03, aT );
	} else {
		// Cast out of both hands at once, meeting far off; let go the same way.
		float m = min( aT, 1.0 - aT );
		shown *= smoothstep( 0.5 * uCast, 0.5 * uCast - 0.015, m ) * smoothstep( 0.5 * uLetGo, 0.5 * uLetGo + 0.015, m );
		// (In the sky, the top of the roller turns up into the cloud and is lost in it.)
		if ( uKind < 1.5 ) shown *= 0.4 + 0.6 * smoothstep( uFront.z + 0.4 * uFront.w * 0.045 * length( ( here - uBoat ).xz ) + 2.0, uFront.z - 2.0, here.y );
	}
	float far = length( here - cameraPosition );
	// (Not right by the eye, where it would fill the picture; and fading into the far air.)
	shown *= smoothstep( 12.0, 70.0, far ) * exp( - far / 9000.0 );
	// A little brighter as they haul.
	shown *= 0.8 + 0.35 * uHaul;
	// Laid on unevenly along its length, as a brush lays colour, never in dashes.
	shown *= 0.55 + 0.45 * smoothstep( - 0.6, 0.6, sin( aT * 5.0 + aSeed.y * 2.0 + 1.0 ) + 0.5 * sin( aT * 13.0 + 2.0 ) );
	vAlpha = shown * uFade;
	vEdge = aSide;
	mat4 vp = projectionMatrix * viewMatrix;
	gl_Position = ribbonPosition( vp * vec4( here, 1.0 ), vp * vec4( next, 1.0 ), aSide, mix( 1.0, 1.3, uDay ) );
}
`;

const fragment = /* glsl */ `
uniform float uGain;
uniform float uDay;
uniform float uWhite;
uniform float uOpacity;
// Siuan's own colour, the tamed water of her four, when it is hers (1); the strongest's white (0).
uniform vec3 uTint;
uniform float uTinted;
varying float vAlpha;
varying float vEdge;
void main() {
	float across = abs( vEdge );
	// By night white light; by day white threads.
	float body = 1.0 - smoothstep( 0.7, 1.0, across );
	vec3 night = mix( vec3( 0.93, 0.96, 1.0 ), uTint, uTinted ) * uGain;
	gl_FragColor = vec4( mix( night, mix( vec3( uWhite ), uTint, uTinted ), uDay ), body * vAlpha * uOpacity * mix( 1.0, 3.0, uDay ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

export interface StillingFrame {
	time: number;
	delta: number;
	// 0..1 how far through it is, and 0..1 how much there is to still at all.
	share: number;
	presence: number;
	// How strong the real wind is against them, and how much of a gust is blowing.
	force: number;
	gust: number;
	boat: THREE.Vector3;
	ahead: THREE.Vector2;
	wind: THREE.Vector3;
	day: number;
	gain: number;
	white: number;
	// Siuan's telling (the owner, 21 October: "Siuan, command the channellers"), when the mighty
	// still it: her colour, and the sea under the boat (m) and its swell, which she works by.
	siuan?: { tint: THREE.Color; heave: number; swellHeight: number; swellPeriod: number };
}

const { smoothstep } = THREE.MathUtils;
const ease = (x: number) => smoothstep(x, 0, 1);
const within = (u: number, from: number, to: number) => THREE.MathUtils.clamp((u - from) / (to - from), 0, 1);

// Where the stilled water reaches at u: how far ahead in metres (0: not yet), and its widest
// half-width. A narrow leaf ahead at first, opening wide to hold all the sea in sight.
export function stilledSeaEdge(u: number) {
	if (u < 0.2 || u >= 1) return { reach: 0, width: 0 };
	// (Held within a few kilometres for most of it, where the work can be seen, and pushed out
	// past the horizon only at the end.)
	// (Its sides kept slanting across the view while it goes out, so that they are seen sweeping
	// through it as curves; flung wide only at the end. Wide early, it was only ever a straight
	// band along the horizon.)
	const out = ease(within(u, 0.22, 0.97));
	const reach = 80 + 9000 * out ** 2.2;
	return { reach, width: reach * (0.35 + 0.45 * out) + 6000 * smoothstep(out, 0.8, 1) };
}

// (`strength`: how much stronger than the strongest alone those who still it are together: linked
// with the mighty and Manulani the weave carries the cube root of that many more filaments, each
// as faint and as white, as the mighty's tresses do.)
// (`siuanLeads`: linked, Siuan holds the link, and the strongest's white is wound through hers.)
export function createStilling(scene: THREE.Scene, layer: number, strength = 1, siuanLeads = false) {
	const mass = (filaments: number) => Math.round(filaments * Math.cbrt(strength));
	const shared = {
		uTime: { value: 0 },
		uBoat: { value: new THREE.Vector3() },
		uAhead: { value: new THREE.Vector2(0, -1) },
		uEdgePhase: { value: 0 },
		uRoll: { value: 0 },
		uHaul: { value: 0 },
		uGust: { value: 0 },
		uTension: { value: 0 },
		uWindDir: { value: new THREE.Vector3(1, 0, 0) },
		uDay: { value: 0 },
		uGain: { value: 1 },
		uWhite: { value: 1 },
		uResolution: { value: new THREE.Vector2(1, 1) },
		uPixelRatio: pixelRatio,
	};
	const parts = [
		{ geometry: lines(mass(READING_FILAMENTS), 200, (i) => [i, 0]), opacity: 0.03 },
		{ geometry: lines(mass(SKY_FILAMENTS), 260, (i) => [i, 0]), opacity: 0.018 },
		{ geometry: lines(mass(SEA_FILAMENTS), 300, (i) => [i, 0]), opacity: 0.018 },
		{ geometry: lines(siuanLeads ? Math.round((TELLING_FILAMENTS * 4.9) / 2.5) : TELLING_FILAMENTS, 220, (i) => [i, 0]), opacity: 0.03 },
	].map(({ geometry, opacity }, kind) => {
		const own = {
			uKind: { value: kind },
			uOpacity: { value: opacity },
			uFront: { value: new THREE.Vector4() },
			uCast: { value: 0 },
			uLetGo: { value: 0 },
			uFade: { value: 0 },
			uTint: { value: new THREE.Color() },
			uTinted: { value: 0 },
			uHandsAt: { value: STRONGEST_HANDS },
		};
		const mesh = new THREE.Mesh(geometry, new THREE.ShaderMaterial({ uniforms: { ...shared, ...own }, vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
		mesh.frustumCulled = false;
		mesh.renderOrder = WEAVE_RENDER_ORDER;
		mesh.layers.set(layer);
		mesh.visible = false;
		scene.add(mesh);
		return { own, mesh };
	});

	// Where they are in the slow stroke of their breath (0..1).
	let stroke = 0;
	let roll = 0;
	// Siuan's way with the sea: how fast the water under the boat is rising or falling (m/s).
	let lastHeave: number | undefined;
	let lift = 0;
	const update = (frame: StillingFrame | undefined) => {
		if (!frame || frame.presence <= 0.001) {
			for (const { mesh } of parts) mesh.visible = false;
			return;
		}
		const u = frame.share;
		stroke = (stroke + frame.delta / 10) % 1;
		const breathed = smoothstep(stroke, 0, 0.3) * (1 - smoothstep(stroke, 0.5, 0.85));
		// Siuan tells them how she would command the sea, as a fisher's daughter who has known it
		// all her life: never against the swell, always with it. Each wave is drained of what it
		// carries by a hold that goes against the water's own going, so they haul as the water
		// under them rises (pressing it down) and again as it falls (holding it up), hardest where
		// it moves fastest and slack at crest and trough: twice to every swell, the sea's own
		// time and not a breath's. (Force against velocity: as a damper takes a wave's energy.)
		const siuan = frame.siuan;
		let haul = breathed;
		if (siuan && frame.delta > 0) {
			const moving = lastHeave === undefined ? 0 : (siuan.heave - lastHeave) / frame.delta;
			lastHeave = siuan.heave;
			lift += (moving - lift) * Math.min(1, frame.delta / 0.6);
			// (Against the fastest a swell of that height and period can move the water.)
			const fastest = (Math.PI * Math.max(siuan.swellHeight, 0.1)) / Math.max(siuan.swellPeriod, 2);
			const withSea = Math.min(1, Math.abs(lift) / fastest) ** 0.7;
			haul = THREE.MathUtils.lerp(breathed, withSea, smoothstep(siuan.swellHeight, 0.3, 1.2));
		} else lastHeave = undefined;
		// Rolled outward, faster as they haul.
		roll += frame.delta * (0.06 + 0.3 * haul);
		shared.uTime.value = frame.time;
		shared.uBoat.value.copy(frame.boat);
		shared.uAhead.value.copy(frame.ahead);
		shared.uEdgePhase.value = frame.time * 0.004;
		shared.uRoll.value = roll;
		shared.uHaul.value = haul;
		shared.uGust.value = Math.max(0, frame.gust - 0.4) * 1.5;
		shared.uTension.value = Math.min(1, frame.force);
		shared.uWindDir.value.copy(frame.wind).setY(0);
		if (shared.uWindDir.value.lengthSq() > 1e-6) shared.uWindDir.value.normalize();
		shared.uDay.value = frame.day;
		shared.uGain.value = frame.gain;
		shared.uWhite.value = frame.white;
		shared.uResolution.value.set(window.innerWidth, window.innerHeight).multiplyScalar(pixelRatio.value);
		// Each edge goes out a little further with each haul.
		const breath = 1 + 0.012 * haul;
		const [reading, sky, sea, telling] = parts as [(typeof parts)[0], (typeof parts)[0], (typeof parts)[0], (typeof parts)[0]];
		reading.own.uCast.value = smoothstep(u, 0, 0.025) * 1.05;
		reading.own.uLetGo.value = smoothstep(u, 0.045, 0.07) * 1.05;
		reading.own.uFade.value = u < 0.075 ? frame.presence : 0;
		const skyOut = ease(within(u, 0.05, 0.45));
		const skyReach = 300 + 8500 * skyOut ** 1.3;
		sky.own.uFront.value.set(skyReach * breath, skyReach * (0.4 + 2.0 * skyOut ** 1.5), 420, 1.3);
		sky.own.uCast.value = smoothstep(u, 0.045, 0.085) * 1.05;
		sky.own.uLetGo.value = smoothstep(u, 0.42, 0.47) * 1.05;
		sky.own.uFade.value = u > 0.04 && u < 0.475 ? frame.presence : 0;
		const edge = stilledSeaEdge(u);
		sea.own.uFront.value.set(edge.reach * breath, edge.width * breath, 0, 2);
		sea.own.uCast.value = smoothstep(u, 0.2, 0.25) * 1.05;
		sea.own.uLetGo.value = smoothstep(u, 0.955, 0.995) * 1.05;
		sea.own.uFade.value = edge.reach > 0 ? frame.presence : 0;
		// She tells them as they turn to the sea, and holds it in their roller until they let go.
		telling.own.uFront.value.copy(sea.own.uFront.value);
		telling.own.uCast.value = smoothstep(u, 0.19, 0.24) * 1.05;
		telling.own.uLetGo.value = smoothstep(u, 0.955, 0.995) * 1.05;
		telling.own.uFade.value = siuan && edge.reach > 0 ? frame.presence : 0;
		// Siuan holds the link: the rollers from her hands in her colour, the strongest's white wound
		// through. (Without her, the strongest's own, as before.)
		const leads = !!siuan && siuanLeads;
		for (const part of [sky, sea, telling]) part.own.uHandsAt.value = leads ? SIUAN_HANDS : STRONGEST_HANDS;
		for (const part of [sky, sea]) part.own.uTinted.value = leads ? 1 : 0;
		telling.own.uTinted.value = leads ? 0 : 1;
		if (siuan) for (const part of [sky, sea, telling]) part.own.uTint.value.copy(siuan.tint);
		const blending = frame.day > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending;
		for (const { mesh, own } of parts) {
			mesh.visible = own.uFade.value > 0.001;
			(mesh.material as THREE.ShaderMaterial).blending = blending;
		}
	};

	// The breath's own share of the sea edge, for the water to go out with it.
	const breath = () => 1 + 0.012 * shared.uHaul.value;

	const dispose = () => {
		for (const { mesh } of parts) {
			scene.remove(mesh);
			(mesh.material as THREE.Material).dispose();
			mesh.geometry.dispose();
		}
	};

	return { update, dispose, breath, edgePhase: () => shared.uEdgePhase.value };
}
