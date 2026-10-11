// The night sky, as it really stands over the boat at the time shown: the stars, the five
// planets the eye can see, and the Milky Way.
//
// public/stars.json is the Yale Bright Star Catalogue (5th edition, public domain): every star
// the eye can see, about nine thousand of them, as [right ascension°, declination°, magnitude,
// surface temperature in kelvin], brightest first. The positions are for the year 2000; the sky
// has since slipped about a third of a degree, which is left out.
// public/milky-way.jpg is NASA's map of the Milky Way's glow, made from the Gaia star survey
// (Deep Star Maps 2020; credit NASA/Goddard Space Flight Center Scientific Visualization Studio
// and ESA/Gaia/DPAC), laid out by right ascension and declination like the catalogue.
// The planets are worked out (planetPositions). Shooting stars are not drawn.
import * as THREE from "three";

const RAD = Math.PI / 180;
// Far beyond the sea, inside the sky's box.
const DISTANCE = 4500;

export interface Wanderer {
	// Elevation and compass azimuth in degrees, magnitude, colour as a temperature in kelvin.
	elevation: number;
	azimuth: number;
	magnitude: number;
	kelvin: number;
}

// A star's colour from its temperature: blue-white for the hottest (10,000 K and over), white
// near 7,000, yellow near 5,800 (the sun), orange to red towards 3,000. Kept pale, as stars look to the eye.
function starColour(kelvin: number, target: THREE.Color) {
	const t = THREE.MathUtils.clamp((9500 - kelvin) / 6500, 0, 1);
	return target.setRGB(
		THREE.MathUtils.lerp(0.72, 1, Math.min(1, t * 2.2)),
		THREE.MathUtils.lerp(0.82, 1, Math.min(1, t * 2.2)) - 0.28 * Math.max(0, t - 0.45),
		1 - 0.75 * Math.max(0, t - 0.3),
	);
}

const vertexShader = /* glsl */ `
attribute vec3 aColour;
// Brightness, after the air has taken its share.
attribute float aLight;
uniform float uPixelRatio;
uniform float uGain;
uniform float uShown;
varying vec3 vColour;

void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
	// A star is a point. A bright one is drawn a little larger, as it looks to the eye, and a
	// faint one is never smaller than a pixel, only dimmer.
	float size = clamp( 1.4 + 1.8 * sqrt( aLight ), 1.4, 5.0 );
	gl_PointSize = size * uPixelRatio;
	// A star a hundred times fainter does not look a hundred times fainter: the eye squeezes
	// the range, and so does this, or only a handful of stars would show on a screen.
	vColour = aColour * uGain * uShown * pow( aLight, 0.45 ) * step( 0.0, position.y );
}
`;

const fragmentShader = /* glsl */ `
varying vec3 vColour;

void main() {
	float fromCentre = length( gl_PointCoord - 0.5 ) * 2.0;
	gl_FragColor = vec4( vColour * ( 1.0 - smoothstep( 0.3, 1.0, fromCentre ) ), 1.0 );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

// The Milky Way is a picture on the inside of a ball round the viewer. The ball's own x, y and z
// are the directions of the sky's map (x to right ascension 0, z to the north celestial pole),
// and the ball is turned with the sky.
const glowVertexShader = /* glsl */ `
varying vec3 vSky;
varying float vUp;

void main() {
	vSky = normalize( position );
	vUp = normalize( mat3( modelMatrix ) * position ).y;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

const glowFragmentShader = /* glsl */ `
uniform sampler2D uMap;
uniform float uGain;
varying vec3 vSky;
varying float vUp;

void main() {
	vec3 sky = normalize( vSky );
	// The map has right ascension 0 in the middle, growing to the left, and north at the top.
	vec2 uv = vec2( 0.5 - atan( sky.y, sky.x ) / 6.28319, 0.5 + asin( sky.z ) / 3.14159 );
	// A glow this faint is lost in the thick air near the horizon, and there is none below it.
	// The picture's empty sky is a dark grey, not black; that much is taken off.
	gl_FragColor = vec4( max( texture2D( uMap, uv ).rgb - 0.075, 0.0 ) * uGain * smoothstep( 0.0, 0.3, vUp ), 1.0 );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

export interface StarState {
	// The moment shown.
	date: Date;
	// 0..1 how far the stars are out: none by day, fewer under cloud or a bright moon.
	shown: number;
	// 0..1 the same for the Milky Way, which needs a darker sky than the stars do.
	glow: number;
	// Multiplies the light so it holds its brightness at any exposure.
	gain: number;
}

// `place` is where on Earth the boat is and the compass bearing its view faces (scene -z); it
// moves, and is read afresh each time the sky is arranged. `wanderers` gives the planets for a moment.
export function createStars(
	scene: THREE.Scene,
	camera: THREE.Camera,
	place: { latitude: number; longitude: number; bearing: number },
	wanderers: (date: Date) => Wanderer[],
) {
	const uniforms = {
		uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
		uGain: { value: 1 },
		uShown: { value: 0 },
	};
	const material = new THREE.ShaderMaterial({
		uniforms,
		vertexShader,
		fragmentShader,
		transparent: true,
		depthWrite: false,
		blending: THREE.AdditiveBlending,
	});
	let points: THREE.Points | undefined;
	let catalogue: [number, number, number, number][] = [];
	let placedFor = Number.NaN;
	const planetCount = wanderers(new Date()).length;

	const glowUniforms = { uMap: { value: null as THREE.Texture | null }, uGain: { value: 0 } };
	const glow = new THREE.Mesh(
		new THREE.SphereGeometry(DISTANCE + 100, 48, 24),
		new THREE.ShaderMaterial({
			uniforms: glowUniforms,
			vertexShader: glowVertexShader,
			fragmentShader: glowFragmentShader,
			side: THREE.BackSide,
			transparent: true,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
		}),
	);
	glow.frustumCulled = false;
	glow.matrixAutoUpdate = false;
	// Over the sky, under the stars.
	glow.renderOrder = 1;
	glow.visible = false;
	scene.add(glow);
	// Without the picture the night simply has no Milky Way.
	new THREE.TextureLoader().load("/milky-way.jpg", (texture) => {
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.wrapS = THREE.RepeatWrapping;
		// Smaller copies of the picture would show as a seam where its two ends meet.
		texture.generateMipmaps = false;
		texture.minFilter = THREE.LinearFilter;
		glowUniforms.uMap.value = texture;
	});

	fetch("/stars.json")
		.then((response) => response.json())
		.then((stars: [number, number, number, number][]) => {
			catalogue = stars;
			// The planets take the last places.
			const count = stars.length + planetCount;
			const geometry = new THREE.BufferGeometry();
			const colours = new Float32Array(count * 3);
			const colour = new THREE.Color();
			stars.forEach((star, i) => starColour(star[3], colour).toArray(colours, i * 3));
			geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
			geometry.setAttribute("aColour", new THREE.BufferAttribute(colours, 3));
			geometry.setAttribute("aLight", new THREE.BufferAttribute(new Float32Array(count), 1));
			points = new THREE.Points(geometry, material);
			points.frustumCulled = false;
			// Over the sky and the Milky Way, under the fog and the weave.
			points.renderOrder = 2;
			scene.add(points);
		})
		// Without the catalogue the night simply has no stars.
		.catch(() => {});

	// Works out the turn of the sky for a moment, and returns where a point of it then is in the
	// scene (x to the right of the view, y up, z behind), from its right ascension and declination
	// in degrees.
	const skyAt = (date: Date) => {
		const days = date.getTime() / 86_400_000 - 10957.5;
		const siderealTime = (18.697374558 + 24.06570982441908 * days) * 15 * RAD + place.longitude * RAD;
		const sinHere = Math.sin(place.latitude * RAD);
		const cosHere = Math.cos(place.latitude * RAD);
		return (rightAscension: number, declination: number) => {
			const hourAngle = siderealTime - rightAscension * RAD;
			const sinDec = Math.sin(declination * RAD);
			const cosDec = Math.cos(declination * RAD);
			return fromHorizon(
				cosHere * sinDec - sinHere * cosDec * Math.cos(hourAngle),
				-cosDec * Math.sin(hourAngle),
				sinHere * sinDec + cosHere * cosDec * Math.cos(hourAngle),
			);
		};
	};
	// The same from how far north, east and up a direction points. The scene's -z is the bearing faced.
	const fromHorizon = (north: number, east: number, up: number): [number, number, number] => {
		const turn = place.bearing * RAD;
		return [east * Math.cos(turn) - north * Math.sin(turn), up, -(north * Math.cos(turn) + east * Math.sin(turn))];
	};
	// Each magnitude is a factor of about 2.5 in light; magnitude 0 is given as 1. Near the
	// horizon the light comes through far more air, which takes about a quarter of a magnitude
	// for each thickness of atmosphere over a hazy sea.
	const lightOf = (magnitude: number, up: number) => {
		const airMass = 1 / Math.max(0.03, up + 0.025 * Math.exp(-11 * Math.max(up, 0)));
		return 10 ** (-0.4 * (magnitude + 0.25 * (airMass - 1)));
	};

	// Puts everything where it stands in the sky at that moment. The sky turns a degree in four
	// minutes, so this is done again only when the time has moved by half a minute.
	const basis = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] as const;
	const colour = new THREE.Color();
	const arrange = (date: Date) => {
		const sky = skyAt(date);
		basis[0].set(...sky(0, 0));
		basis[1].set(...sky(90, 0));
		basis[2].set(...sky(0, 90));
		glow.matrix.makeBasis(...basis);
		if (!points) return;
		const position = points.geometry.attributes.position as THREE.BufferAttribute;
		const light = points.geometry.attributes.aLight as THREE.BufferAttribute;
		const colours = points.geometry.attributes.aColour as THREE.BufferAttribute;
		catalogue.forEach(([rightAscension, declination, magnitude], i) => {
			const [x, y, z] = sky(rightAscension, declination);
			position.setXYZ(i, x * DISTANCE, y * DISTANCE, z * DISTANCE);
			light.setX(i, lightOf(magnitude, y));
		});
		wanderers(date).forEach((planet, n) => {
			const i = catalogue.length + n;
			const height = planet.elevation * RAD;
			const [x, y, z] = fromHorizon(Math.cos(height) * Math.cos(planet.azimuth * RAD), Math.cos(height) * Math.sin(planet.azimuth * RAD), Math.sin(height));
			position.setXYZ(i, x * DISTANCE, y * DISTANCE, z * DISTANCE);
			light.setX(i, lightOf(planet.magnitude, y));
			starColour(planet.kelvin, colour).toArray(colours.array, i * 3);
		});
		position.needsUpdate = true;
		light.needsUpdate = true;
		colours.needsUpdate = true;
	};

	const update = ({ date, shown, glow: glowShown, gain }: StarState) => {
		const out = shown > 0.001;
		if (points) points.visible = out;
		glow.visible = glowShown > 0.001 && !!glowUniforms.uMap.value;
		if (!out && !glow.visible) return;
		const halfMinute = Math.round(date.getTime() / 30_000);
		if (halfMinute !== placedFor || (points && !arranged)) {
			placedFor = halfMinute;
			arranged = !!points;
			arrange(date);
		}
		// The sky is too far to move as the boat does.
		points?.position.copy(camera.position);
		glow.matrix.setPosition(camera.position);
		uniforms.uShown.value = shown;
		uniforms.uGain.value = gain;
		glowUniforms.uGain.value = 0.35 * glowShown * gain;
	};
	// Whether the stars themselves have been placed yet: they arrive a moment after the first frame.
	let arranged = false;

	return { update };
}
