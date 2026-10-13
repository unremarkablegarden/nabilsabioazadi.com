// The sky at dawn, dusk and through twilight, by patching the shader source (Sky.js, r186).
//
// The three.js Sky is a daylight model (Preetham's). With the sun on or under the horizon it is
// outside what it was made for, and it gave a green-teal sky over a brown and dark-red band of
// the same depth all the way along the horizon: the owner called the colours horrible, and saw
// that it read as a flat gradient behind the water.
//
// So for those hours the sky is worked out as what it is: two great spheres, the planet
// (6,371 km) and the shell of air round it (100 km deep), with the eye standing on the first.
// For every point of the sky a line is walked from the eye out through the air to the top of
// the shell, and at each step along it: is the sun's light reaching this bit of air, or is it in
// the planet's shadow? how much air and ozone has that light already come through? how much of it
// is turned towards the eye? Nothing is painted. The glow stands as an arch over where the
// sun went down, deep and warm there and thinning away to either side; opposite it the planet's
// own shadow rises blue-grey from the horizon with the rose band (the Belt of Venus) above it;
// and overhead the sky stays blue, which is the ozone's doing: it takes the orange out of light
// that has come the long way through it. (Leaving ozone out is what turns a twilight sky green.)
//
// The air is the air where the boat is (uTwilightAir): its pressure, its warmth, how far one
// can see and how much haze stands overhead, all from the live figures. The ozone is not: no
// free source gives it for a place and hour, so it is the standard layer.
//
// Sources, all free to use:
//   - the walk through the air follows glsl-atmosphere by Rye Terrell (wwwtyro), released into
//     the public domain (The Unlicense): https://github.com/wwwtyro/glsl-atmosphere
//   - the ozone layer (how much it absorbs of red, green and blue, and where it lies) is taken
//     from Eric Bruneton's Precomputed Atmospheric Scattering (BSD 3-Clause):
//     https://github.com/ebruneton/precomputed_atmospheric_scattering
//
// Light scattered once is worked out in full. Light scattered twice or more, which is most of
// what lights a deep twilight and all of what lights the air inside the planet's shadow, is
// only stood in for: the sunlight still reaching the high air overhead (from 20 km up, blued
// by the ozone it has crossed) is taken as a soft light falling on all the air alike
// (twilightFill). That is an approximation, Claude's, and the one figure in it (FILL) was set by eye.
// Even so this goes dark sooner than a real sky, so the picture's brightness is not taken from
// it. It gives the colours and their shape over the sky, and the brightness is set from
// outside (uTwilightLevel) so that the part of the sky in view is exposed as an eye would see it.
//
// The walk is long (twenty steps out, and six more towards the sun from each), and this sky only
// changes when the sun or the air does: the sun moves once a minute. So it is not walked for
// every point of the screen in every frame, which took longer than all the rest of the picture
// together. It is walked once into a small picture of the whole sky (uTwilightSky, drawn by
// `draw` below only when something has changed), and the screen looks its colours up there.
// The sky is alike on both sides of the sun, so the picture holds one side: across it, the turn
// away from the sun's bearing (0 to 180 degrees); up it, the height above the horizon, with most
// of its rows low down, where the colours change quickest.
import { Camera, HalfFloatType, LinearFilter, Mesh, PlaneGeometry, Scene, ShaderMaterial, Vector3, Vector4, WebGLRenderTarget, type IUniform, type Texture, type WebGLRenderer } from "three";
import type { Sky } from "three/addons/objects/Sky.js";

export interface TwilightSkyUniforms {
	// 0..1 how far this sky has taken over from the daylight one.
	uTwilight: IUniform<number>;
	// How bright the sky ahead is to be, as scene light before exposure.
	uTwilightLevel: IUniform<number>;
	// The air where the boat is: see uTwilightAir in the shader.
	uTwilightAir: IUniform<Vector4>;
	// The small picture of the whole sky that the screen looks its colours up in.
	uTwilightSky: IUniform<Texture>;
}

export interface TwilightSky extends TwilightSkyUniforms {
	// To be called before each frame is drawn: walks the sky again if the sun or the air has changed.
	draw: (renderer: WebGLRenderer) => void;
}

// How many points of the sky are walked, across and up.
const SKY_SIZE = 256;

const atmosphere = /* glsl */ `
const float PLANET = 6371e3;
const float AIR = 6471e3;
// The air where the boat is, from the weather data (twilightAir in manawatawhi.ts): how much
// of it there is against standard air (x), the height in metres over which it thins to 37% (y),
// how much haze there is at the sea, per metre (z), and the height over which that thins (w).
uniform vec4 uTwilightAir;
// How strongly clean, standard air scatters red, green and blue, per metre at sea level.
const vec3 RAYLEIGH = vec3( 5.802e-6, 13.558e-6, 33.1e-6 );
// Haze: nine tenths of the light it takes from a beam is scattered, the rest absorbed.
#define MIE ( 0.9 * uTwilightAir.z )
#define MIE_TAKEN uTwilightAir.z
// What ozone absorbs, per metre where it is thickest (about 25 km up).
const vec3 OZONE = vec3( 0.650e-6, 1.881e-6, 0.085e-6 );

// How much there is at a height of clean air (x), haze (y) and ozone (z), against sea level.
vec3 airAt( float height ) {
	height = max( height, 0.0 );
	return vec3( uTwilightAir.x * exp( - height / uTwilightAir.y ), exp( - height / uTwilightAir.w ), max( 0.0, 1.0 - abs( height - 25000.0 ) / 15000.0 ) );
}

// Where a line from p along d crosses a sphere about the planet's centre: near and far distances.
vec2 crossSphere( vec3 p, vec3 d, float radius ) {
	float b = dot( p, d );
	float c = dot( p, p ) - radius * radius;
	float h = b * b - c;
	if ( h < 0.0 ) return vec2( 1.0, - 1.0 );
	h = sqrt( h );
	return vec2( - b - h, - b + h );
}

// How much sunlight reaches a point: none in the planet's shadow, and otherwise what the air
// and ozone on the way have left of it.
vec3 sunlightAt( vec3 here, vec3 sun, vec3 through ) {
	vec2 ground = crossSphere( here, sun, PLANET );
	if ( ground.x > 0.0 && ground.y > 0.0 ) return vec3( 0.0 );
	const int SUN_STEPS = 6;
	float sunPace = crossSphere( here, sun, AIR ).y / float( SUN_STEPS );
	for ( int j = 0; j < SUN_STEPS; j ++ ) {
		through += airAt( length( here + sun * ( float( j ) + 0.5 ) * sunPace ) - PLANET ) * sunPace;
	}
	return exp( - ( RAYLEIGH * through.x + MIE_TAKEN * through.y + OZONE * through.z ) );
}

// The soft light from the rest of the sky: the sunlight still on the high air overhead.
const float FILL = 0.2;
vec3 twilightFill( vec3 sun ) {
	// Layer by layer up from 20 km, each counted by how much air it holds. As the sun sinks the
	// lower layers fall into shadow or get only reddened light, and the thin high ones, still
	// in clear light, are what is left: so the fill turns from pale to blue, and fades.
	vec3 fill = vec3( 0.0 );
	for ( int i = 0; i < 12; i ++ ) {
		float height = 20e3 + 8e3 * float( i );
		fill += sunlightAt( vec3( 0.0, PLANET + height, 0.0 ), sun, vec3( 0.0 ) ) * exp( - ( height - 20e3 ) / 8000.0 );
	}
	// It has been scattered once already on its way down, which blues it as it blues the day sky.
	return FILL * fill * RAYLEIGH / RAYLEIGH.b;
}

// The light from one direction of the sky, for a sun of strength 1.
vec3 twilightSky( vec3 view, vec3 sun, vec3 fill ) {
	// The sea hides everything under the horizon; what is asked for there is the horizon itself.
	view = normalize( vec3( view.x, max( view.y, 0.0005 ), view.z ) );
	vec3 eye = vec3( 0.0, PLANET + 30.0, 0.0 );
	float far = crossSphere( eye, view, AIR ).y;
	const int STEPS = 20;
	vec3 through = vec3( 0.0 );
	vec3 rayleigh = vec3( 0.0 );
	vec3 mie = vec3( 0.0 );
	vec3 filled = vec3( 0.0 );
	// Short steps near the eye, where the air is thick, and long ones far out.
	float before = 0.0;
	for ( int i = 0; i < STEPS; i ++ ) {
		float after = far * pow( float( i + 1 ) / float( STEPS ), 2.5 );
		float pace = after - before;
		vec3 here = eye + view * ( before + 0.5 * pace );
		before = after;
		vec3 air = airAt( length( here ) - PLANET ) * pace;
		through += air;
		// (The haze takes that soft light too, and gives it back uncoloured: without this the haze
		// on the horizon only hid what was behind it, and stood there as a dark band.)
		filled += ( air.x * RAYLEIGH + air.y * MIE ) * exp( - ( RAYLEIGH * through.x + MIE_TAKEN * through.y + OZONE * through.z ) );
		vec3 kept = sunlightAt( here, sun, through );
		rayleigh += air.x * kept;
		mie += air.y * kept;
	}
	float mu = dot( view, sun );
	float g = 0.76;
	float towardsRayleigh = 3.0 / ( 16.0 * 3.14159265 ) * ( 1.0 + mu * mu );
	float towardsMie = 3.0 / ( 8.0 * 3.14159265 ) * ( ( 1.0 - g * g ) * ( 1.0 + mu * mu ) ) / ( ( 2.0 + g * g ) * pow( 1.0 + g * g - 2.0 * mu * g, 1.5 ) );
	return rayleigh * RAYLEIGH * towardsRayleigh + mie * MIE * towardsMie + filled * fill / ( 4.0 * 3.14159265 );
}
`;

// The small picture. How bright this sky is where the boat is looking (towards Hawai'i, scene
// north), low and higher up, is worked out with it: the picture is exposed for that, wherever
// the sun has gone down, so what is kept is each colour against that brightness.
const walkVertex = /* glsl */ `
uniform vec3 uSun;
varying vec2 vAt;
varying float vTwilightAhead;
varying vec3 vTwilightFill;
${atmosphere}
void main() {
	vAt = uv;
	vec3 weights = vec3( 0.2126, 0.7152, 0.0722 );
	vTwilightFill = twilightFill( uSun );
	vTwilightAhead = max( 1e-9, 0.5 * dot( weights, twilightSky( normalize( vec3( 0.0, 0.1, - 1.0 ) ), uSun, vTwilightFill ) )
		+ 0.5 * dot( weights, twilightSky( normalize( vec3( 0.0, 0.45, - 1.0 ) ), uSun, vTwilightFill ) ) );
	gl_Position = vec4( position.xy, 0.0, 1.0 );
}
`;

const walkFragment = /* glsl */ `
uniform vec3 uSun;
varying vec2 vAt;
varying float vTwilightAhead;
varying vec3 vTwilightFill;
${atmosphere}
void main() {
	// (The first and last points across and up stand exactly on the ends: straight towards the
	// sun's bearing and straight away from it, the horizon and the zenith.)
	vec2 at = clamp( ( vAt * ${SKY_SIZE}.0 - 0.5 ) / ${SKY_SIZE - 1}.0, 0.0, 1.0 );
	float turn = at.x * 3.14159265;
	float up = 1.57079633 * at.y * at.y;
	vec2 bearing = normalize( uSun.xz + vec2( 0.0, - 1e-6 ) );
	vec2 level = vec2( bearing.x * cos( turn ) - bearing.y * sin( turn ), bearing.x * sin( turn ) + bearing.y * cos( turn ) );
	vec3 view = vec3( level.x * cos( up ), sin( up ), level.y * cos( up ) );
	gl_FragColor = vec4( twilightSky( view, uSun, vTwilightFill ) / vTwilightAhead, 1.0 );
}
`;

const fragmentPars = /* glsl */ `
uniform float showSunDisc;
uniform float uTwilight;
uniform float uTwilightLevel;
uniform sampler2D uTwilightSky;

// The light from one direction of the twilight sky, against its brightness ahead: looked up in
// the small picture of it (see walkFragment in twilight-sky.ts for how that is laid out).
vec3 twilightSkyAt( vec3 view, vec3 sun ) {
	vec2 bearing = normalize( sun.xz + vec2( 0.0, - 1e-6 ) );
	float turn = atan( abs( view.x * bearing.y - view.z * bearing.x ), dot( view.xz, bearing ) );
	// (The sea hides everything under the horizon; what is asked for there is the horizon itself.)
	float up = atan( max( view.y, 0.0005 ), length( view.xz ) );
	vec2 at = vec2( turn / 3.14159265, sqrt( up / 1.57079633 ) );
	return texture2D( uTwilightSky, ( at * ${SKY_SIZE - 1}.0 + 0.5 ) / ${SKY_SIZE}.0 ).rgb;
}
`;

const fragmentSky = /* glsl */ `
	vec3 texColor = ( Lin + L0 ) * 0.04 + sundiscColor + vec3( 0.0, 0.0003, 0.00075 );
	vec3 twilight = vec3( 0.0 );
	if ( uTwilight > 0.0 ) {
		twilight = twilightSkyAt( direction, vSunDirection );
		// Late in twilight the last of what this works out is a trace of red light scattered once,
		// where a real sky by then is all deep blue from light scattered many times. So as the sun
		// goes from 2 to 11 degrees under, the colour is led to that blue, keeping its brightness.
		// (Set by eye, Claude's: not worked out.)
		float late = 0.9 * smoothstep( - 0.03, - 0.19, vSunDirection.y );
		twilight = mix( twilight, dot( twilight, vec3( 0.2126, 0.7152, 0.0722 ) ) * vec3( 0.61, 0.97, 2.43 ), late ) * uTwilightLevel;
		// The glow close round the sun is many times brighter than the sky ahead; held in, so
		// that it stays colour and does not burn out to a white patch.
		float most = max( twilight.r, max( twilight.g, twilight.b ) );
		twilight *= 1.0 / ( 1.0 + most / ( 6.0 * max( uTwilightLevel, 1e-6 ) ) );
		texColor = mix( texColor, twilight + L0 * 0.04 + vec3( 0.0, 0.0003, 0.00075 ), uTwilight );
	}
`;

// Cloud at these hours is seen against the light, not lit by it: a darker, greyer shape of the
// sky behind it, a little of the glow caught in its thin parts.
const fragmentCloud = /* glsl */ `
	cloudColor *= max( dayFactor, 0.03 );
	if ( uTwilight > 0.0 ) {
		float grey = dot( twilight, vec3( 0.2126, 0.7152, 0.0722 ) );
		vec3 against = mix( vec3( grey ), twilight, 0.6 ) * mix( 0.3, 0.85, shade );
		cloudColor = mix( cloudColor, against, uTwilight );
	}
`;

export function addTwilightSky(sky: Sky): TwilightSky {
	const material = sky.material;
	const walked = new WebGLRenderTarget(SKY_SIZE, SKY_SIZE, { type: HalfFloatType, minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: false });
	const uniforms: TwilightSkyUniforms = {
		uTwilight: { value: 0 },
		uTwilightLevel: { value: 0 },
		uTwilightAir: { value: new Vector4(1, 8000, 4.4e-6, 1200) },
		uTwilightSky: { value: walked.texture },
	};
	Object.assign(material.uniforms, uniforms);

	let fragment = material.fragmentShader;
	fragment = replaceOrThrow(fragment, "uniform float showSunDisc;", fragmentPars);
	fragment = replaceOrThrow(fragment, "vec3 texColor = ( Lin + L0 ) * 0.04 + sundiscColor + vec3( 0.0, 0.0003, 0.00075 );", fragmentSky);
	fragment = replaceOrThrow(fragment, "cloudColor *= max( dayFactor, 0.03 );", fragmentCloud);
	material.fragmentShader = fragment;
	material.needsUpdate = true;

	const sun = new Vector3();
	const walk = new Mesh(
		new PlaneGeometry(2, 2),
		new ShaderMaterial({ vertexShader: walkVertex, fragmentShader: walkFragment, uniforms: { uSun: { value: sun }, uTwilightAir: uniforms.uTwilightAir }, depthTest: false, depthWrite: false }),
	);
	walk.frustumCulled = false;
	const walkScene = new Scene();
	walkScene.add(walk);
	const walkCamera = new Camera();
	// The sun and the air it was last walked for.
	const walkedSun = new Vector3();
	const walkedAir = new Vector4();
	let walkedOnce = false;
	const draw = (renderer: WebGLRenderer) => {
		// By day it is not looked at.
		if (uniforms.uTwilight.value <= 0) return;
		sun.copy(material.uniforms.sunPosition!.value).normalize();
		const air = uniforms.uTwilightAir.value;
		// (A change too small to see is let pass: a hundredth of a degree of sun, a part in a
		// thousand of the air.)
		const same =
			walkedOnce &&
			sun.distanceToSquared(walkedSun) < 3e-8 &&
			[0, 1, 2, 3].every((i) => Math.abs(air.getComponent(i) - walkedAir.getComponent(i)) <= 1e-3 * Math.abs(walkedAir.getComponent(i)));
		if (same) return;
		walkedOnce = true;
		walkedSun.copy(sun);
		walkedAir.copy(air);
		const previousTarget = renderer.getRenderTarget();
		renderer.setRenderTarget(walked);
		renderer.render(walkScene, walkCamera);
		renderer.setRenderTarget(previousTarget);
	};
	return Object.assign(uniforms, { draw });
}
