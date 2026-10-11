// A ship of the colonial era, of the kind of Cook's Endeavour: three masts, square sails, an ochre
// hull. Now and then one sails across the view and is destroyed, not from the sky but from below.
// The weave channels fire and air down under the sea to a point beneath her bow. The water there
// glows and boils and domes up for a few seconds, and then it bursts: a column of water and steam
// throws her bow up out of the sea and sets it alight. She falls back broken, burns from the bow
// aft, and goes down by the head.
// She is flat pictures standing on the sea, drawn here with the 2D canvas so there is nothing to
// download, with a shader for the light on her and for the fire.
//
// What happens to her follows from the wind, which blows from the viewer out to sea, so she is
// on a beam reach with her windward side towards us:
//   - The wind's push on the sails goes with the square of its speed and with the canvas still
//     standing. It drives her, and it heels her over away from us. As the sails burn she comes
//     upright and loses way.
//   - Fire is carried the way the flames lean (Thomas 1965): upward fastest, and downwind. Aboard
//     a moving ship the wind the fire feels blows from ahead, so it works aft. It travels down
//     more slowly, by burning canvas and tarred rope falling. Wind fans it; rain holds it back.
//   - Flames lean with the wind across them, more as the wind's force grows against their own
//     lift (the Froude number), and the true wind bends them away from us, which shortens them.
//   - Canvas and tarred hemp go quickly, heavy wet timber slowly. When the shrouds that stay a
//     mast have burnt through, the wind that was pressing on it takes it over the lee side.
//   - With no sail to steady her she lies broadside to the sea, rolls harder, and drifts downwind.
//   - The hull burns down from the deck. The burst has already opened her bow, so the sea is
//     coming in from that moment; she settles by the head, and the water puts the fire out.
//
// How she is lit, at any hour: the camera looks towards the sun's side of the sky, so she is
// seen against the light. Her hull, in its own shadow, takes only the colour of the sky. Her
// sails are cloth and let the sun through, so they glow, the more the lower and more directly
// behind them the sun is. At dusk that light is orange, at night it is the moon's, under storm
// cloud there is little of it; and mist between her and the viewer greys her towards the horizon.
import * as THREE from "three";

// World units. The pictures are square; the waterline is WATERLINE of the way up them.
const SIZE = 170;
const WATERLINE = 0.18;
// Her speed in a moderate wind with all sail set.
const SPEED = 14;
const TRACK_Z = -620;
const TRACK_HALF_LENGTH = 1000;
// In the pictures (x, y from the bottom left, 0..1): the masts from aft, the deck, and the foot
// of the bow at the waterline, where the burst comes up and the fire starts.
const MAST_X = [0.29, 0.47, 0.64];
const DECK = 0.3;
const BOW = new THREE.Vector2(0.75, 0.22);
// Seconds the sea under the bow glows and boils before it bursts.
const GATHERING = 5;

// The ship is drawn as four pictures that lie over one another: the hull, and each mast with its
// own sails and rigging, so that a mast can fall on its own.
type Layer = "hull" | 0 | 1 | 2;
function drawLayer(layer: Layer) {
	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = 1024;
	const c = canvas.getContext("2d")!;
	c.scale(1.024, 1.024);
	// Drawn on a 1000 x 1000 grid, bow to the right, waterline at y = 820.
	const sailcloth = "#e8e2d2";
	const spar = "#3a2d20";
	c.lineJoin = "round";

	// Standing rigging, behind everything.
	c.strokeStyle = "rgb(40 32 24 / 0.55)";
	c.lineWidth = 1.2;
	const masts = [
		{ x: 290, top: 230 },
		{ x: 470, top: 110 },
		{ x: 640, top: 170 },
	];
	for (const [i, mast] of masts.entries()) {
		if (layer !== i) continue;
		for (const side of [-1, 1]) {
			for (const reach of [38, 52, 66]) {
				c.beginPath();
				c.moveTo(mast.x, mast.top + 60);
				c.lineTo(mast.x + side * reach, 700);
				c.stroke();
			}
		}
	}
	// Stays from mast to mast and down to the bowsprit.
	// Each stay belongs to the mast it comes down from.
	for (const [owner, x1, y1, x2, y2] of [[0, 290, 230, 470, 420], [1, 470, 110, 640, 330], [2, 640, 170, 950, 640], [2, 640, 330, 880, 665], [1, 470, 110, 290, 230]]) {
		if (layer !== owner) continue;
		c.beginPath();
		c.moveTo(x1!, y1!);
		c.lineTo(x2!, y2!);
		c.stroke();
	}

	// Bowsprit and masts.
	c.strokeStyle = spar;
	c.lineCap = "round";
	c.lineWidth = 7;
	if (layer === "hull") {
		c.beginPath();
		c.moveTo(770, 705);
		c.lineTo(950, 640);
		c.stroke();
	}
	for (const [i, mast] of masts.entries()) {
		if (layer !== i) continue;
		c.lineWidth = 8;
		c.beginPath();
		c.moveTo(mast.x, 705);
		c.lineTo(mast.x, mast.top + 150);
		c.stroke();
		c.lineWidth = 4.5;
		c.beginPath();
		c.moveTo(mast.x, mast.top + 150);
		c.lineTo(mast.x, mast.top);
		c.stroke();
	}

	// A square sail: hung from a yard, wider at the foot, the foot bellied by the wind.
	const sail = (x: number, top: number, bottom: number, headWidth: number, footWidth: number) => {
		const shade = c.createLinearGradient(x - footWidth / 2, 0, x + footWidth / 2, 0);
		shade.addColorStop(0, "#cfc8b6");
		shade.addColorStop(0.45, sailcloth);
		shade.addColorStop(1, "#f4f0e6");
		c.fillStyle = shade;
		c.beginPath();
		c.moveTo(x - headWidth / 2, top);
		c.lineTo(x + headWidth / 2, top);
		c.quadraticCurveTo(x + footWidth / 2 + 14, (top + bottom) / 2, x + footWidth / 2, bottom);
		c.quadraticCurveTo(x + 10, bottom + 16, x - footWidth / 2, bottom);
		c.quadraticCurveTo(x - footWidth / 2 + 10, (top + bottom) / 2, x - headWidth / 2, top);
		c.fill();
		// Seams in the cloth.
		c.strokeStyle = "rgb(120 110 90 / 0.25)";
		c.lineWidth = 1;
		for (let seam = 1; seam < 6; seam++) {
			const at = x - headWidth / 2 + (headWidth * seam) / 6;
			c.beginPath();
			c.moveTo(at, top + 2);
			c.lineTo(x - footWidth / 2 + (footWidth * seam) / 6 + 6, bottom);
			c.stroke();
		}
		// The yard it hangs from.
		c.strokeStyle = spar;
		c.lineWidth = 4;
		c.beginPath();
		c.moveTo(x - headWidth / 2 - 10, top);
		c.lineTo(x + headWidth / 2 + 10, top);
		c.stroke();
	};
	// Mizzen, main, fore: topgallant, topsail, course.
	if (layer === 0) {
		sail(290, 250, 345, 80, 104);
		sail(290, 358, 500, 108, 140);
	}
	if (layer === 1) {
		sail(470, 130, 240, 96, 124);
		sail(470, 254, 420, 128, 166);
		sail(470, 436, 668, 172, 206);
	}
	if (layer === 2) {
		sail(640, 190, 290, 88, 112);
		sail(640, 304, 455, 116, 150);
		sail(640, 470, 672, 156, 186);
	}

	// Fore-and-aft sails: the spanker at the stern and three jibs over the bowsprit.
	c.fillStyle = "#ddd6c4";
	if (layer === 0) {
		c.beginPath();
		c.moveTo(290, 515);
		c.lineTo(170, 480);
		c.lineTo(150, 660);
		c.lineTo(290, 680);
		c.fill();
	}
	for (const [headY, tackX, tackY] of [[200, 940, 642], [300, 880, 664], [400, 820, 684]]) {
		if (layer !== 2) continue;
		c.beginPath();
		c.moveTo(646, headY!);
		c.lineTo(tackX!, tackY!);
		c.quadraticCurveTo(720, 650, 660, 640);
		c.fill();
	}

	if (layer === "hull") {
		// Hull: tarred below, ochre sides with a dark wale, a pale strake above.
		const hull = () => {
			c.beginPath();
			c.moveTo(138, 692);
			c.quadraticCurveTo(470, 722, 800, 690);
			c.quadraticCurveTo(800, 770, 752, 822);
			c.lineTo(196, 822);
			c.quadraticCurveTo(150, 790, 138, 692);
			c.closePath();
		};
		hull();
		c.fillStyle = "#b9812f";
		c.fill();
		c.save();
		hull();
		c.clip();
		c.fillStyle = "#1c1814";
		c.fillRect(100, 782, 800, 60);
		c.fillRect(100, 738, 800, 12);
		c.fillStyle = "#d9c9a0";
		c.fillRect(100, 700, 800, 8);
		c.restore();
		// Stern windows and the ensign.
		c.fillStyle = "#1c1814";
		for (let pane = 0; pane < 3; pane++) c.fillRect(156 + pane * 16, 716, 9, 12);
		c.strokeStyle = spar;
		c.lineWidth = 3;
		c.beginPath();
		c.moveTo(142, 694);
		c.lineTo(128, 610);
		c.stroke();
		c.fillStyle = "#b3202a";
		c.fillRect(84, 612, 44, 26);

	}

	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	return texture;
}

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

// How far the fire has to travel from where it started to reach a point, in the pictures' own
// units. Shorter upward and the way the flames lean, longer downward. Used by the shader and,
// through fireDistance below, by the ship's own reckoning of what has burnt.
const FIRE_UP = 0.6;
const FIRE_DOWN = 1.3;
const FIRE_WITH_LEAN = 0.75;
const FIRE_AGAINST_LEAN = 1.25;

function fireDistance(x: number, y: number, lean: number) {
	const dx = (x - BOW.x) * (Math.sign(x - BOW.x) === Math.sign(lean) ? FIRE_WITH_LEAN : FIRE_AGAINST_LEAN);
	const dy = (y - BOW.y) * (y > BOW.y ? FIRE_UP : FIRE_DOWN);
	return Math.hypot(dx, dy);
}

const fragmentShader = /* glsl */ `
uniform sampler2D uPicture;
// Light from the whole sky, light from the sun or moon, how far behind her that light is (0..1),
// and the colour and amount of the mist in front of her.
uniform vec3 uAmbient;
uniform vec3 uSun;
uniform float uBacklit;
uniform vec3 uHaze;
uniform float uHazeAmount;
uniform float uGain;
uniform float uTime;
uniform vec2 uStruck;
// How far the fire has reached from where it started.
uniform float uReach;
// 1 for the hull's picture, and 0..1 how far it has burnt down from the deck to the waterline.
uniform float uIsHull;
uniform float uHullBurn;
// Sideways lean of the flames (signed), their height, how hard the wind is fanning them, and
// 0..1 how far the sea has put them out.
uniform float uLean;
uniform float uFlameHeight;
uniform float uFan;
uniform float uQuench;
varying vec2 vUv;

float hash( vec2 p ) {
	vec3 q = fract( vec3( p.xyx ) * 0.1031 );
	q += dot( q, q.yzx + 33.33 );
	return fract( ( q.x + q.y ) * q.z );
}
float noise( vec2 p ) {
	vec2 i = floor( p );
	vec2 f = fract( p );
	f = f * f * ( 3.0 - 2.0 * f );
	return mix( mix( hash( i ), hash( i + vec2( 1.0, 0.0 ) ), f.x ), mix( hash( i + vec2( 0.0, 1.0 ) ), hash( i + vec2( 1.0, 1.0 ) ), f.x ), f.y );
}

// How far the fire has got at a point: below 0 untouched, around 0 alight, above 0 burnt out.
float fireFront( vec2 uv ) {
	vec2 d = uv - uStruck;
	d.x *= d.x * uLean > 0.0 ? ${FIRE_WITH_LEAN} : ${FIRE_AGAINST_LEAN};
	d.y *= d.y > 0.0 ? ${FIRE_UP} : ${FIRE_DOWN};
	return uReach - length( d ) - ( noise( uv * 16.0 ) - 0.5 ) * 0.3;
}
// The line the hull has burnt down to, ragged along its length.
float hullLine( vec2 uv ) {
	return mix( ${DECK} + 0.02, ${WATERLINE} + 0.005, uHullBurn ) + ( noise( vec2( uv.x * 34.0, 3.0 ) ) - 0.5 ) * 0.03;
}
// 0..1 how fiercely a point of the ship is burning.
float alight( vec2 uv ) {
	float front = fireFront( uv );
	float rigging = smoothstep( - 0.1, 0.0, front ) * ( 1.0 - smoothstep( 0.0, 0.22, front ) );
	// The hull burns along the line it has burnt down to, once the fire has reached it.
	float timber = uIsHull * step( 0.001, uHullBurn ) * step( 0.0, front ) * ( 1.0 - smoothstep( 0.0, 0.03, abs( uv.y - hullLine( uv ) ) ) );
	return max( rigging * ( 1.0 - uIsHull * 0.6 ), timber );
}

void main() {
	vec4 picture = texture2D( uPicture, vUv );
	float burnt = smoothstep( 0.0, 0.2, fireFront( vUv ) );
	// Canvas, rope and spars burn away. The hull only chars where the fire has passed, and is
	// gone above the line it has burnt down to.
	float gone = mix( burnt, step( hullLine( vUv ), vUv.y ) * step( 0.001, uHullBurn ), uIsHull );
	float alpha = picture.a * ( 1.0 - gone );
	// Pale cloth above the deck lets light through; everything else only reflects it.
	float cloth = step( ${DECK}, vUv.y ) * smoothstep( 0.5, 0.78, dot( picture.rgb, vec3( 0.3, 0.59, 0.11 ) ) );
	vec3 facing = uSun * ( 1.0 - uBacklit ) * 0.9;
	vec3 through = uSun * uBacklit * vec3( 1.0, 0.92, 0.78 ) * 0.85;
	vec3 lit = picture.rgb * ( uAmbient + facing + through * cloth );
	vec3 colour = mix( lit, vec3( 0.015, 0.012, 0.01 ) * ( uAmbient + facing ), burnt );
	colour = mix( colour, uHaze, uHazeAmount );

	// Flames: light rising, and leaning with the wind, from whatever is alight below this point.
	float flames = 0.0;
	if ( uReach > 0.0 && uQuench < 1.0 ) {
		for ( int i = 0; i < 7; i ++ ) {
			float k = float( i );
			vec2 below = vUv - vec2( uLean * k + 0.004 * sin( uTime * 5.0 + vUv.y * 30.0 ) * k, 0.022 * uFlameHeight * k );
			float fuel = texture2D( uPicture, below ).a * alight( below );
			float lick = noise( vec2( below.x * 40.0, below.y * 22.0 - uTime * ( 2.4 + 1.6 * uFan ) ) );
			flames += fuel * lick * ( 1.0 - k / 7.0 );
		}
		flames = min( 1.0, flames * ( 0.7 + 0.5 * uFan ) ) * ( 1.0 - uQuench );
	}
	// White-yellow at the heart, orange, then red at the tips.
	vec3 fire = mix( vec3( 0.9, 0.12, 0.02 ), mix( vec3( 1.0, 0.5, 0.08 ), vec3( 1.0, 0.92, 0.7 ), smoothstep( 0.6, 1.0, flames ) ), smoothstep( 0.15, 0.6, flames ) );

	gl_FragColor = vec4( colour * alpha + fire * flames * uGain * 3.0, max( alpha, flames ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

export interface ShipFrame {
	time: number;
	delta: number;
	// The light on her, as it should look on screen: from the whole sky, from the sun or moon,
	// how far behind her that light is (0..1), and the colour and amount (0..1) of the mist in
	// front of her. Then the factor that undoes the exposure.
	ambient: THREE.Color;
	sun: THREE.Color;
	backlit: number;
	haze: THREE.Color;
	hazeAmount: number;
	gain: number;
	// 0..1 strength of the wind, its gusting about that (-1..1), and 0..1 rain.
	wind: number;
	gust: number;
	rain: number;
	// Height of the sea's large swells at a point.
	swell: (x: number, z: number) => number;
}

export function createShip(scene: THREE.Scene) {
	const shared = {
		uAmbient: { value: new THREE.Color() },
		uSun: { value: new THREE.Color() },
		uBacklit: { value: 0 },
		uHaze: { value: new THREE.Color() },
		uHazeAmount: { value: 0 },
		uGain: { value: 1 },
		uTime: { value: 0 },
		uStruck: { value: BOW },
		uReach: { value: 0 },
		uHullBurn: { value: 0 },
		uLean: { value: 0 },
		uFlameHeight: { value: 1 },
		uFan: { value: 0 },
		uQuench: { value: 0 },
	};
	// Every picture is the same size and hangs from the waterline, so they register exactly.
	const geometry = new THREE.PlaneGeometry(SIZE, SIZE).translate(0, SIZE * (0.5 - WATERLINE), 0);
	const picture = (layer: Layer) => {
		const mesh = new THREE.Mesh(
			geometry,
			new THREE.ShaderMaterial({
				uniforms: { ...shared, uPicture: { value: drawLayer(layer) }, uIsHull: { value: layer === "hull" ? 1 : 0 } },
				vertexShader,
				fragmentShader,
				transparent: true,
				premultipliedAlpha: true,
				depthWrite: false,
			}),
		);
		return mesh;
	};
	const root = new THREE.Group();
	root.visible = false;
	root.add(picture("hull"));
	// Each mast hangs from a hinge at its foot on the deck, so it can fall about that point.
	const masts = MAST_X.map((x, i) => {
		const hinge = new THREE.Group();
		hinge.position.set((x - 0.5) * SIZE, (DECK - WATERLINE) * SIZE, 0);
		const mesh = picture(i as Layer);
		mesh.position.copy(hinge.position).negate();
		mesh.renderOrder = 1;
		hinge.add(mesh);
		root.add(hinge);
		return { hinge, x, angle: 0, speed: 0, falling: false };
	});
	scene.add(root);

	// Seconds until the next ship appears; the first comes soon.
	let wait = 20;
	let sailing = false;
	// Where along her track she will be when the sea under her begins to gather, when it began,
	// and when it burst.
	let strikeX = 0;
	let gatheringSince = Infinity;
	let burstAt = Infinity;
	// How far the burst has thrown her bow up (radians) and lifted her (world units), and how fast each is changing.
	let thrown = 0;
	let thrownRate = 0;
	let lifted = 0;
	let liftedRate = 0;
	// Her state: speed through the water, heel and its rate of change, how far the fire has
	// reached, how far the hull has burnt down, and how much water she has taken (all 0..1 but speed).
	let speed = SPEED;
	let heel = 0;
	let heelRate = 0;
	let reach = 0;
	let hullBurn = 0;
	let flooded = 0;
	// What is happening in the sea under her bow, for the water to show: where (world x, z),
	// 0..1 how brightly it glows, and the height of the water raised there.
	const under = { x: 0, z: 0, glow: 0, height: 0 };
	const fire = { position: new THREE.Vector3(), strength: 0 };
	// Where she is and how strong a wake she leaves: it goes with the square of her speed.
	const wake = new THREE.Vector3();

	// Returns what is happening under her bow, how strongly she is burning, and her wake.
	const update = ({ time, delta, ambient, sun, backlit, haze, hazeAmount, gain, wind, gust, rain, swell }: ShipFrame) => {
		fire.strength = 0;
		under.glow = under.height = 0;
		if (!sailing) {
			wait -= delta;
			wake.z = 0;
			if (wait > 0) return { under, fire, wake };
			sailing = true;
			gatheringSince = burstAt = Infinity;
			thrown = thrownRate = lifted = liftedRate = 0;
			strikeX = THREE.MathUtils.randFloatSpread(500);
			speed = SPEED;
			heel = heelRate = reach = hullBurn = flooded = 0;
			for (const mast of masts) {
				mast.angle = mast.speed = 0;
				mast.falling = false;
				mast.hinge.rotation.set(0, 0, 0);
				mast.hinge.visible = true;
			}
			root.position.set(-TRACK_HALF_LENGTH, 0, TRACK_Z + THREE.MathUtils.randFloatSpread(160));
			root.visible = true;
		}
		const dt = Math.min(delta, 1 / 20);
		// Wind speed against a moderate breeze (1), gusts included.
		const blow = (0.5 + 1.1 * wind) * (1 + 0.3 * gust);

		// Fire. The wind she feels along her length is her own speed, from ahead: the flames trail aft.
		// The sea under her bow: gathering, then the burst.
		if (gatheringSince === Infinity && root.position.x > strikeX) gatheringSince = time;
		const gathering = THREE.MathUtils.clamp((time - gatheringSince) / GATHERING, 0, 1);
		if (gathering >= 1 && burstAt === Infinity) {
			burstAt = time;
			// The blow comes up under the bow: it is thrown upward and the whole ship lifted.
			thrownRate += 1.9;
			liftedRate += 62;
		}
		const sinceBurst = time - burstAt;
		// Thrown up, she falls back and rocks to rest, as anything afloat does when struck from below.
		thrownRate += (-6 * thrown - 2.2 * thrownRate) * dt;
		thrown += thrownRate * dt;
		liftedRate += (-5 * lifted - 2 * liftedRate) * dt;
		lifted += liftedRate * dt;
		const burning = sinceBurst >= 0;
		const lean = -THREE.MathUtils.clamp(speed / SPEED, 0, 1.2) + 0.25 * gust;
		if (burning) {
			reach = Math.min(2, reach + 0.03 * (0.6 + 0.7 * blow) * (1 - 0.35 * rain) * dt);
			// Timber takes far longer than canvas, and only starts once the fire is down at the deck.
			if (reach > fireDistance(BOW.x, DECK, lean)) hullBurn = Math.min(1, hullBurn + (dt / 55) * (0.6 + 0.6 * blow) * (1 - 0.3 * rain));
		}

		// What canvas is left. A mast's sails go as the fire passes down it, and all at once if it falls.
		let canvas = 0;
		for (const mast of masts) {
			const burnt = THREE.MathUtils.clamp((reach - fireDistance(mast.x, 0.62, lean)) / 0.4, 0, 1);
			if (!mast.falling) canvas += (1 - burnt) / masts.length;
			// The shrouds come down to the deck either side of the mast. Once they have burnt through,
			// nothing holds it against the wind.
			if (!mast.falling && reach - fireDistance(mast.x, DECK + 0.06, lean) > 0.2) mast.falling = true;
			if (mast.falling && mast.angle < 1.75) {
				// It topples to leeward, away from us, slowly at first and then fast, like any falling pole.
				mast.speed += (2.2 * Math.sin(mast.angle + 0.06) + 0.5 * blow) * dt;
				mast.angle = Math.min(1.75, mast.angle + mast.speed * dt);
				mast.hinge.rotation.set(-mast.angle, 0, -0.2 * mast.angle);
				mast.hinge.visible = mast.angle < 1.7;
			}
		}

		// Way. The drive of the sails goes with the square of the wind and the canvas standing; the
		// water's drag with the square of her speed. So her speed settles in proportion to the wind
		// and to the square root of her canvas, and she takes some seconds to gain or lose it.
		speed += (SPEED * blow * Math.sqrt(canvas) - speed) * (dt / 6);
		// A hull with no sail and no way on is pushed bodily downwind.
		const leeway = (1 + 3 * wind) * (0.4 + 0.6 * (1 - canvas));
		root.position.x += speed * dt;
		root.position.z -= leeway * dt;

		// Heel. The same push, acting high up, lays her over to leeward until her weight rights her.
		// She swings to a new angle and settles, as a pendulum does.
		const heelFor = Math.min(0.42, 0.2 * blow * blow * canvas);
		heelRate += ((heelFor - heel) * 3 - heelRate * 2.2) * dt;
		heel += heelRate * dt;
		// The sea rolls her about that angle: the swell's slope where she lies, and the shorter waves.
		// Sails damp the roll. Without them, broadside to the sea, she rolls much harder.
		const slopeAcross = (swell(root.position.x, root.position.z + 12) - swell(root.position.x, root.position.z - 12)) / 24;
		const slopeAlong = (swell(root.position.x + 30, root.position.z) - swell(root.position.x - 30, root.position.z)) / 60;
		const loose = 0.5 + 1.3 * (1 - canvas);
		const roll = loose * (slopeAcross + 0.04 * wind * Math.sin(time * 0.9) + 0.025 * wind * Math.sin(time * 1.37 + 1));
		const pitch = slopeAlong + 0.02 * Math.sin(time * 0.6);

		// The burst has opened her bow, so the sea comes in from then on, faster once the fire has
		// taken the hull down too. She settles by the head.
		if (burning) flooded = Math.min(1, flooded + dt / (hullBurn > 0.7 ? 22 : 48));
		const settle = flooded * flooded;
		root.position.y = swell(root.position.x, root.position.z) * 0.6 + 1.5 * Math.sin(time * 0.6) + lifted - settle * SIZE * 0.36;
		root.rotation.set(-heel + roll, 0, pitch + thrown - 0.32 * settle);

		shared.uAmbient.value.copy(ambient);
		shared.uSun.value.copy(sun);
		shared.uBacklit.value = backlit;
		shared.uHaze.value.copy(haze);
		shared.uHazeAmount.value = hazeAmount;
		shared.uGain.value = gain;
		shared.uTime.value = time;
		shared.uReach.value = reach;
		shared.uHullBurn.value = hullBurn;
		// How far over the flames lean goes with the wind across them against their own lift, and
		// levels off. The true wind, blowing away from us, bends them back and so shortens them.
		shared.uLean.value = 0.02 * Math.tanh(1.2 * lean * blow);
		shared.uFlameHeight.value = 1.2 / (1 + 0.5 * blow);
		shared.uFan.value = THREE.MathUtils.clamp(blow - 0.5, 0, 1.5);
		shared.uQuench.value = THREE.MathUtils.smoothstep(flooded, 0.45, 0.95);

		root.updateMatrixWorld();
		// Under the bow. While it gathers, the water glows brighter and domes a little. At the burst a
		// column goes up in a quarter of a second and falls back, and the glow dies over a few seconds.
		under.x = root.position.x + (BOW.x - 0.5) * SIZE;
		under.z = root.position.z;
		if (burning) {
			const pulse = sinceBurst / 0.25;
			under.height = 85 * pulse * Math.exp(1 - pulse) + 8 * Math.exp(-sinceBurst / 2);
			under.glow = Math.exp(-sinceBurst / 2.5);
		} else {
			under.height = 8 * gathering * gathering;
			under.glow = gathering;
		}
		wake.set(root.position.x - SIZE * 0.3, root.position.z, Math.min(1, (speed / SPEED) ** 2) * (1 - flooded));
		fire.position.set(0, SIZE * 0.3, 0).applyMatrix4(root.matrixWorld);
		// Steam from the burst itself, then the smoke of the fire. A little vapour while it gathers.
		fire.strength = burning ? Math.max(Math.exp(-sinceBurst / 1.5), Math.min(1, reach * 2) * (1 - shared.uQuench.value) * (reach < 1.9 || hullBurn < 1 ? 1 : 0.4)) : 0.3 * gathering;

		if (flooded >= 1 || root.position.x > TRACK_HALF_LENGTH) {
			sailing = false;
			root.visible = false;
			wait = 70 + Math.random() * 90;
			wake.z = 0;
		}
		return { under, fire, wake };
	};

	return { update };
}
