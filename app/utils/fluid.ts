// A real fluid simulation for the storm's air and fog, run on the GPU with the scene's own renderer.
// It is Jos Stam's "stable fluids" method (the one behind most WebGL smoke demos): a grid of
// velocities is carried along by itself, pushed by forces, and then corrected so that air neither
// piles up nor vanishes anywhere, which is what makes it curl and eddy. Fog and streaks of air are
// carried in that flow as two "dyes" and drawn over the scene.
//
// The grid covers the screen, not the world. What moves the air:
//   the wind    a gusting drift along the horizon, with small restless eddies everywhere
//   the bond    a vortex about the knot of the weave, as strong as the channelling's hold
//   the charge  a draught up the middle while the threads race for the knot
//   the pointer whoever is visiting can stir it
//   heat        air heated by lightning is lighter than the air round it, and rises
//
// Lightning acts on the air the way the measurements say it does. The channel reaches some
// 24,000-30,000 K, but it is back at ordinary pressure within about 40 millionths of a second, by
// which time its shock wave has gone about 10 cm. So there is no blast to see at this scale. What a
// stroke does leave behind is a thread of very hot, thin air, and its chemistry:
//   - the heat boils off fog along the channel, and the heated thread drifts upward;
//   - nitric oxide forms in the hot core;
//   - hydroxyl forms in a sheath round the core, not in it, from water vapour broken up by the
//     channel's ultraviolet light and its corona, so there is more of it in warm, humid air;
//   - where the two meet they react and remove each other.
// The dye texture holds all of this in its four channels: fog, streaks of air, heat, and a single
// signed number for the chemistry (positive nitric oxide, negative hydroxyl), so that mixing the
// two cancels them with no extra work.
// Sources: US National Research Council, "The Earth's Electrical Environment", ch. 4 (channel
// temperature, pressure and shock); Jenkins & Brune, Atmos. Chem. Phys. 25, 5041 (2025) (hydroxyl
// made apart from nitric oxide); Perez-Invernon et al., JGR Atmospheres (2025) (humidity, ultraviolet).
import * as THREE from "three";

const VELOCITY_SIZE = 256;
const DYE_SIZE = 512;
// Fewer rounds of the pressure correction on slower machines: the flow gets a little softer.
const PRESSURE_ITERATIONS = [16, 10, 6];
// The bolt is handed over as this many points along its length.
export const BOLT_POINTS = 8;

// Distance from a pixel to the bolt, with the screen's shape allowed for.
const boltShaderChunk = /* glsl */ `
uniform vec2 uBolt[ ${BOLT_POINTS} ];
float boltDistance( vec2 uv, float aspect ) {
	float nearest = 1e3;
	for ( int i = 0; i < ${BOLT_POINTS - 1}; i ++ ) {
		vec2 a = uBolt[ i ] * vec2( aspect, 1.0 );
		vec2 ab = uBolt[ i + 1 ] * vec2( aspect, 1.0 ) - a;
		vec2 ap = uv * vec2( aspect, 1.0 ) - a;
		nearest = min( nearest, length( ap - ab * clamp( dot( ap, ab ) / max( dot( ab, ab ), 1e-6 ), 0.0, 1.0 ) ) );
	}
	return nearest;
}
`;

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
	vUv = uv;
	gl_Position = vec4( position.xy, 0.0, 1.0 );
}
`;

// Moves a field along the flow by looking upstream. Velocity is in screen widths per second.
const advectShader = /* glsl */ `
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform float uDelta;
uniform vec4 uDecay;
varying vec2 vUv;
void main() {
	vec2 from = vUv - uDelta * texture2D( uVelocity, vUv ).xy;
	gl_FragColor = texture2D( uSource, from ) / ( 1.0 + uDecay * uDelta );
}
`;

const forceShader = /* glsl */ `
uniform sampler2D uVelocity;
uniform sampler2D uDye;
uniform float uDelta;
uniform float uTime;
uniform float uAspect;
uniform float uBuoyancy;
uniform float uInstability;
uniform float uWind;
uniform float uCross;
uniform float uBond;
uniform float uCharge;
uniform vec2 uKnot;
uniform vec2 uHorizon;
uniform vec2 uPointer;
uniform vec2 uPointerVelocity;
varying vec2 vUv;

// A wandering pattern of small pushes that keeps the air restless.
vec2 eddies( vec2 p, float t ) {
	float a = cos( p.x * 7.0 + t * 0.31 ) * cos( p.y * 5.0 - t * 0.23 );
	float b = sin( p.x * 13.0 - t * 0.4 ) * sin( p.y * 11.0 + t * 0.37 );
	return vec2( a - b, ( b - a ) * 0.6 );
}

void main() {
	vec2 velocity = texture2D( uVelocity, vUv ).xy;

	// Wind: eases the air near the horizon towards a drift that swings from side to side.
	float nearHorizon = exp( - pow( ( vUv.y - uHorizon.y ) / 0.25, 2.0 ) );
	vec2 drift = vec2( 0.07 * sin( uTime * 0.13 ) + 0.04 * sin( vUv.y * 9.0 + uTime * 0.4 ), 0.0 ) * uWind + vec2( 0.06 * uCross, 0.0 );
	velocity += ( drift * nearHorizon - velocity ) * min( 1.0, 0.5 * uDelta );
	// A sea warmer than the air above it keeps that air turning over.
	velocity += eddies( vUv, uTime ) * 0.02 * uWind * ( 1.0 + 2.0 * uInstability ) * uDelta;

	// Heat: lightning-heated air rises.
	velocity.y += uBuoyancy * texture2D( uDye, vUv ).b * uDelta;

	// Bond: the air is swept round the knot, fastest close in.
	vec2 fromKnot = ( vUv - uKnot ) * vec2( uAspect, 1.0 );
	float distanceSquared = dot( fromKnot, fromKnot );
	velocity += uBond * vec2( - fromKnot.y / uAspect, fromKnot.x ) / ( 0.03 + distanceSquared ) * 0.3 * uDelta;

	// Charge: a draught along the line from the foot of the screen up to the knot.
	vec2 foot = vec2( 0.5, 0.0 );
	vec2 run = uKnot - foot;
	float along = clamp( dot( vUv - foot, run ) / dot( run, run ), 0.0, 1.0 );
	vec2 off = ( vUv - ( foot + run * along ) ) * vec2( uAspect, 1.0 );
	velocity += normalize( run ) * uCharge * 1.5 * exp( - dot( off, off ) / 0.004 ) * uDelta;

	// Pointer: drags the air along with it.
	vec2 fromPointer = ( vUv - uPointer ) * vec2( uAspect, 1.0 );
	velocity += uPointerVelocity * exp( - dot( fromPointer, fromPointer ) / 0.003 ) * min( 1.0, 6.0 * uDelta );

	gl_FragColor = vec4( velocity, 0.0, 1.0 );
}
`;

const curlShader = /* glsl */ `
uniform sampler2D uVelocity;
uniform vec2 uTexel;
varying vec2 vUv;
void main() {
	float left = texture2D( uVelocity, vUv - vec2( uTexel.x, 0.0 ) ).y;
	float right = texture2D( uVelocity, vUv + vec2( uTexel.x, 0.0 ) ).y;
	float bottom = texture2D( uVelocity, vUv - vec2( 0.0, uTexel.y ) ).x;
	float top = texture2D( uVelocity, vUv + vec2( 0.0, uTexel.y ) ).x;
	gl_FragColor = vec4( 0.5 * ( right - left - top + bottom ), 0.0, 0.0, 1.0 );
}
`;

// Puts back the small whirls that the grid smooths away.
const vorticityShader = /* glsl */ `
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform vec2 uTexel;
uniform float uStrength;
uniform float uDelta;
varying vec2 vUv;
void main() {
	float left = texture2D( uCurl, vUv - vec2( uTexel.x, 0.0 ) ).x;
	float right = texture2D( uCurl, vUv + vec2( uTexel.x, 0.0 ) ).x;
	float bottom = texture2D( uCurl, vUv - vec2( 0.0, uTexel.y ) ).x;
	float top = texture2D( uCurl, vUv + vec2( 0.0, uTexel.y ) ).x;
	float centre = texture2D( uCurl, vUv ).x;
	vec2 force = 0.5 * vec2( abs( top ) - abs( bottom ), abs( right ) - abs( left ) );
	force = force / ( length( force ) + 1e-4 ) * uStrength * centre * vec2( 1.0, - 1.0 );
	vec2 velocity = texture2D( uVelocity, vUv ).xy + force * uTexel * uDelta;
	gl_FragColor = vec4( clamp( velocity, - 2.0, 2.0 ), 0.0, 1.0 );
}
`;

const divergenceShader = /* glsl */ `
uniform sampler2D uVelocity;
uniform vec2 uTexel;
varying vec2 vUv;
void main() {
	float left = texture2D( uVelocity, vUv - vec2( uTexel.x, 0.0 ) ).x;
	float right = texture2D( uVelocity, vUv + vec2( uTexel.x, 0.0 ) ).x;
	float bottom = texture2D( uVelocity, vUv - vec2( 0.0, uTexel.y ) ).y;
	float top = texture2D( uVelocity, vUv + vec2( 0.0, uTexel.y ) ).y;
	gl_FragColor = vec4( 0.5 * ( right - left + top - bottom ), 0.0, 0.0, 1.0 );
}
`;

const pressureShader = /* glsl */ `
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 uTexel;
varying vec2 vUv;
void main() {
	float left = texture2D( uPressure, vUv - vec2( uTexel.x, 0.0 ) ).x;
	float right = texture2D( uPressure, vUv + vec2( uTexel.x, 0.0 ) ).x;
	float bottom = texture2D( uPressure, vUv - vec2( 0.0, uTexel.y ) ).x;
	float top = texture2D( uPressure, vUv + vec2( 0.0, uTexel.y ) ).x;
	gl_FragColor = vec4( ( left + right + bottom + top - texture2D( uDivergence, vUv ).x ) * 0.25, 0.0, 0.0, 1.0 );
}
`;

const gradientShader = /* glsl */ `
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform vec2 uTexel;
varying vec2 vUv;
void main() {
	float left = texture2D( uPressure, vUv - vec2( uTexel.x, 0.0 ) ).x;
	float right = texture2D( uPressure, vUv + vec2( uTexel.x, 0.0 ) ).x;
	float bottom = texture2D( uPressure, vUv - vec2( 0.0, uTexel.y ) ).x;
	float top = texture2D( uPressure, vUv + vec2( 0.0, uTexel.y ) ).x;
	gl_FragColor = vec4( texture2D( uVelocity, vUv ).xy - vec2( right - left, top - bottom ), 0.0, 1.0 );
}
`;

// Adds to what the flow has carried here: new fog (red), new streaks of air (green), and, while a
// bolt is lit, its heat (blue) and its chemistry (alpha).
const sourceShader = /* glsl */ `
uniform sampler2D uDye;
uniform float uDelta;
uniform float uTime;
uniform float uAspect;
uniform float uFog;
uniform float uAir;
uniform float uBond;
uniform float uStrike;
uniform float uVapour;
uniform float uInstability;
uniform vec2 uKnot;
uniform vec2 uHorizon;
varying vec2 vUv;
${boltShaderChunk}

float hash( vec2 p ) {
	vec3 q = fract( vec3( p.xyx ) * 0.1031 );
	q += dot( q, q.yzx + 33.33 );
	return fract( ( q.x + q.y ) * q.z );
}

void main() {
	vec4 dye = texture2D( uDye, vUv );

	// Fog rises off the sea in uneven banks along the horizon, and gathers in a ring round the knot.
	float banks = 0.5 + 0.5 * sin( vUv.x * 17.0 + uTime * 0.2 ) * sin( vUv.x * 5.3 - uTime * 0.11 );
	float offSea = exp( - pow( ( vUv.y - uHorizon.y - 0.02 ) / 0.08, 2.0 ) ) * banks;
	vec2 fromKnot = ( vUv - uKnot ) * vec2( uAspect, 1.0 );
	float ring = exp( - pow( ( length( fromKnot ) - 0.2 ) / 0.06, 2.0 ) ) * uBond;
	// A warm sea under cold air steams, which thickens the banks.
	dye.r = min( 1.6, dye.r + uFog * ( offSea * ( 1.0 + uInstability ) + ring ) * 0.9 * uDelta );

	if ( uStrike > 0.001 ) {
		float distance = boltDistance( vUv, uAspect );
		float core = exp( - pow( distance / 0.004, 2.0 ) );
		float sheath = max( 0.0, exp( - pow( distance / 0.022, 2.0 ) ) - core );
		dye.b = max( dye.b, uStrike * core * 1.6 );
		dye.a += uStrike * ( core * 3.0 - sheath * uVapour * 1.2 ) * 20.0 * uDelta;
		// Where the bolt meets the sea, water flashes to steam.
		vec2 fromFoot = ( vUv - uBolt[ ${BOLT_POINTS - 1} ] ) * vec2( uAspect, 1.0 );
		float foot = dot( fromFoot, fromFoot );
		dye.r = min( 1.6, dye.r + uStrike * exp( - foot / 0.0009 ) * 6.0 * uDelta );
		dye.b = max( dye.b, uStrike * exp( - foot / 0.0005 ) );
	}
	// Fog cannot stay as droplets in hot air.
	dye.r *= exp( - dye.b * 8.0 * uDelta );
	// Hydroxyl is gone within about a second even where it meets no nitric oxide.
	if ( dye.a < 0.0 ) dye.a *= exp( - 1.6 * uDelta );
	dye.a = clamp( dye.a, - 1.5, 1.5 );

	// Air shows as short-lived specks that the flow draws out into streaks.
	// Each speck is a fine point at a random place in its grid cell.
	vec2 grid = vUv * vec2( 70.0 * uAspect, 70.0 );
	vec2 cell = floor( grid );
	float tick = floor( uTime * 12.0 ) * 7.0;
	vec2 place = vec2( hash( cell + tick + 3.1 ), hash( cell + tick + 9.7 ) );
	float speck = step( 0.985, hash( cell + tick ) ) * ( 1.0 - smoothstep( 0.0, 0.07, length( fract( grid ) - place ) ) );
	dye.g = min( 1.5, dye.g + speck * uAir );

	gl_FragColor = dye;
}
`;

const displayShader = /* glsl */ `
uniform sampler2D uDye;
uniform vec3 uFogColour;
uniform vec3 uAirColour;
uniform float uGain;
varying vec2 vUv;
// Faint, and true to the gases: nitrogen dioxide is brown, and the cold glow of the sheath is blue-violet.
const vec3 nitricColour = vec3( 0.8, 0.55, 0.3 );
const vec3 hydroxylColour = vec3( 0.55, 0.62, 1.0 );
void main() {
	vec4 dye = texture2D( uDye, vUv );
	float fog = min( 0.85, 1.0 - exp( - dye.r * 1.3 ) );
	vec3 light = uFogColour * fog + uAirColour * dye.g * 0.35;
	light += vec3( 1.0, 0.96, 0.9 ) * dye.b * 0.25 + nitricColour * max( dye.a, 0.0 ) * 0.22 + hydroxylColour * max( - dye.a, 0.0 ) * 0.3;
	gl_FragColor = vec4( light * uGain, fog );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

export interface FluidFrame {
	delta: number;
	time: number;
	// All 0..1.
	fog: number;
	air: number;
	wind: number;
	// -1..1 how hard the wind blows across the view: to the right when positive.
	crosswind: number;
	bond: number;
	charge: number;
	// Screen positions, 0..1 from the top left.
	knot: { x: number; y: number };
	horizon: { x: number; y: number };
	pointer: { x: number; y: number };
	// 0..1 how brightly a bolt is lit, and its path as BOLT_POINTS screen positions from cloud to sea.
	strike: number;
	bolt: { x: number; y: number }[];
	// Water vapour in the air against a mild, humid day (1), and 0..1 how much warmer the sea is than the air.
	vapour: number;
	instability: number;
	// 0 best .. 2 lightest on the machine.
	quality: number;
	// Colour of the fog as it should appear on screen, and the factor that undoes the exposure.
	fogColour: THREE.Color;
	gain: number;
}

export function createFluid(renderer: THREE.WebGLRenderer, scene: THREE.Scene, displayLayer: number) {
	const target = (size: number) =>
		new THREE.WebGLRenderTarget(size, size, {
			type: THREE.HalfFloatType,
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			depthBuffer: false,
		});
	// Fields that are read and written in the same step need two copies to swap between.
	const pair = (size: number) => ({ read: target(size), write: target(size) });
	const swap = (targets: { read: THREE.WebGLRenderTarget; write: THREE.WebGLRenderTarget }) => {
		[targets.read, targets.write] = [targets.write, targets.read];
	};
	const velocity = pair(VELOCITY_SIZE);
	const pressure = pair(VELOCITY_SIZE);
	const dye = pair(DYE_SIZE);
	const curl = target(VELOCITY_SIZE);
	const divergence = target(VELOCITY_SIZE);

	const texel = new THREE.Vector2(1 / VELOCITY_SIZE, 1 / VELOCITY_SIZE);
	const pass = (fragmentShader: string, uniforms: Record<string, THREE.IUniform>) =>
		new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, depthTest: false, depthWrite: false });
	const shared = {
		uDelta: { value: 0 },
		uTime: { value: 0 },
		uAspect: { value: 1 },
		uTexel: { value: texel },
		uBond: { value: 0 },
		uKnot: { value: new THREE.Vector2(0.5, 0.75) },
		uHorizon: { value: new THREE.Vector2(0.5, 0.5) },
		uInstability: { value: 0 },
		uBolt: { value: Array.from({ length: BOLT_POINTS }, () => new THREE.Vector2()) },
	};
	const advect = pass(advectShader, { ...shared, uVelocity: { value: null }, uSource: { value: null }, uDecay: { value: new THREE.Vector4() } });
	const force = pass(forceShader, {
		...shared,
		uVelocity: { value: null },
		uDye: { value: null },
		uBuoyancy: { value: 1.2 },
		uWind: { value: 0 },
		uCross: { value: 0 },
		uCharge: { value: 0 },
		uPointer: { value: new THREE.Vector2(0.5, 0.5) },
		uPointerVelocity: { value: new THREE.Vector2() },
	});
	const curlPass = pass(curlShader, { ...shared, uVelocity: { value: null } });
	const vorticity = pass(vorticityShader, { ...shared, uVelocity: { value: null }, uCurl: { value: null }, uStrength: { value: 18 } });
	const divergencePass = pass(divergenceShader, { ...shared, uVelocity: { value: null } });
	const pressurePass = pass(pressureShader, { ...shared, uPressure: { value: null }, uDivergence: { value: null } });
	const gradient = pass(gradientShader, { ...shared, uPressure: { value: null }, uVelocity: { value: null } });
	const source = pass(sourceShader, { ...shared, uDye: { value: null }, uFog: { value: 0 }, uAir: { value: 0 }, uStrike: { value: 0 }, uVapour: { value: 1 } });

	const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
	quad.frustumCulled = false;
	const simulationScene = new THREE.Scene();
	simulationScene.add(quad);
	const simulationCamera = new THREE.Camera();
	const run = (material: THREE.ShaderMaterial, into: THREE.WebGLRenderTarget) => {
		quad.material = material;
		renderer.setRenderTarget(into);
		renderer.render(simulationScene, simulationCamera);
	};

	// Drawn over the sea and sky by the main camera only, so it stays out of the water's mirror image.
	const display = new THREE.Mesh(
		new THREE.PlaneGeometry(2, 2),
		new THREE.ShaderMaterial({
			vertexShader,
			fragmentShader: displayShader,
			uniforms: {
				uDye: { value: null },
				uFogColour: { value: new THREE.Color() },
				uAirColour: { value: new THREE.Color(0xdcebff) },
				uGain: { value: 1 },
			},
			transparent: true,
			premultipliedAlpha: true,
			depthTest: false,
			depthWrite: false,
		}),
	);
	display.frustumCulled = false;
	display.renderOrder = 5;
	display.layers.set(displayLayer);
	scene.add(display);

	const lastPointer = new THREE.Vector2(0.5, 0.5);

	// Seconds since there was last anything in the air to show.
	let idle = 0;

	const step = (frame: FluidFrame) => {
		// With no fog, no air and no lightning, and what was there faded, the whole thing rests.
		idle = frame.fog > 0 || frame.air > 0 || frame.strike > 0 ? 0 : idle + frame.delta;
		display.visible = idle < 6;
		if (!display.visible) return;
		// A long pause (a hidden tab) must not become one huge step.
		const delta = Math.min(frame.delta, 1 / 30);
		const previousTarget = renderer.getRenderTarget();
		shared.uDelta.value = delta;
		shared.uTime.value = frame.time;
		shared.uAspect.value = window.innerWidth / window.innerHeight;
		shared.uBond.value = frame.bond;
		// The simulation's y runs upwards, the screen's downwards.
		shared.uKnot.value.set(frame.knot.x, 1 - frame.knot.y);
		shared.uHorizon.value.set(frame.horizon.x, 1 - frame.horizon.y);
		shared.uInstability.value = frame.instability;
		shared.uBolt.value.forEach((point, i) => point.set(frame.bolt[i]!.x, 1 - frame.bolt[i]!.y));

		advect.uniforms.uVelocity!.value = velocity.read.texture;
		advect.uniforms.uSource!.value = velocity.read.texture;
		advect.uniforms.uDecay!.value.set(0.25, 0.25, 0, 0);
		run(advect, velocity.write);
		swap(velocity);

		const pointerX = frame.pointer.x;
		const pointerY = 1 - frame.pointer.y;
		force.uniforms.uVelocity!.value = velocity.read.texture;
		force.uniforms.uDye!.value = dye.read.texture;
		force.uniforms.uWind!.value = frame.wind;
		force.uniforms.uCross!.value = frame.crosswind;
		force.uniforms.uCharge!.value = frame.charge;
		force.uniforms.uPointer!.value.set(pointerX, pointerY);
		force.uniforms.uPointerVelocity!.value.set(pointerX - lastPointer.x, pointerY - lastPointer.y).divideScalar(delta).clampLength(0, 1.5);
		lastPointer.set(pointerX, pointerY);
		run(force, velocity.write);
		swap(velocity);

		curlPass.uniforms.uVelocity!.value = velocity.read.texture;
		run(curlPass, curl);
		vorticity.uniforms.uVelocity!.value = velocity.read.texture;
		vorticity.uniforms.uCurl!.value = curl.texture;
		run(vorticity, velocity.write);
		swap(velocity);

		divergencePass.uniforms.uVelocity!.value = velocity.read.texture;
		run(divergencePass, divergence);
		pressurePass.uniforms.uDivergence!.value = divergence.texture;
		for (let i = 0; i < PRESSURE_ITERATIONS[frame.quality]!; i++) {
			pressurePass.uniforms.uPressure!.value = pressure.read.texture;
			run(pressurePass, pressure.write);
			swap(pressure);
		}
		gradient.uniforms.uPressure!.value = pressure.read.texture;
		gradient.uniforms.uVelocity!.value = velocity.read.texture;
		run(gradient, velocity.write);
		swap(velocity);

		advect.uniforms.uVelocity!.value = velocity.read.texture;
		advect.uniforms.uSource!.value = dye.read.texture;
		// Fog lingers, streaks of air fade in a second or two, heat in about a second, nitric oxide slowly.
		advect.uniforms.uDecay!.value.set(0.3, 1.4, 0.9, 0.35);
		run(advect, dye.write);
		swap(dye);
		source.uniforms.uDye!.value = dye.read.texture;
		source.uniforms.uFog!.value = frame.fog;
		source.uniforms.uAir!.value = frame.air;
		source.uniforms.uStrike!.value = frame.strike;
		source.uniforms.uVapour!.value = frame.vapour;
		run(source, dye.write);
		swap(dye);

		renderer.setRenderTarget(previousTarget);
		const uniforms = display.material.uniforms;
		uniforms.uDye!.value = dye.read.texture;
		uniforms.uFogColour!.value.copy(frame.fogColour);
		uniforms.uGain!.value = frame.gain;
	};

	const dispose = () => {
		for (const item of [velocity.read, velocity.write, pressure.read, pressure.write, dye.read, dye.write, curl, divergence]) item.dispose();
	};

	return { step, dispose };
}
