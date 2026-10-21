// Rain as real drops in the scene, round the boat (the owner, 15 October: "we need a 3d rain
// approach", so that a channeller's shelter can part it).
//
// Each drop is at a real place in the air and falls at a real speed: about 8 m/s, driven sideways
// by the wind at the wind's own speed, so that in a gale it slants and past hurricane force it
// flies almost level, the slant rising and easing with the gusts. What the eye sees of a drop is
// the path it travels while the eye takes it in, so each is drawn as a short streak along its
// own motion: long for near, fast drops, short for far ones. Near drops are out of focus, so
// they are broader and fainter; far ones fine and many; the farthest are lost in the rain itself.
// It falls in sheets, heavier and lighter, that are carried along with the wind.
//
// Three volumes of drops follow the boat: a close one, the few metres round the eye where
// single drops pass large and blurred; a middle one of a few tens of metres; and a far one out to
// a few hundred metres. Each drop's place is worked out in the
// shader from its seed and the time and wrapped round inside its volume, so the rain never
// runs out and costs nothing to move.
//
// The shelter: one channeller beside the viewer holds a weave of Air in front of their eyes to
// keep the rain out of them, so that they can see to channel (the owner's). It is never drawn.
// It shows only in what the rain does: near it every drop's path is bent round it, so the
// streaks part and close again behind it; those that strike its windward face bead and run off
// it, a faint sheen of short slow streaks on a surface no one can see. In a gust it gives a little
// and some rain gets through.
import * as THREE from "three";

const vertexShader = /* glsl */ `
attribute vec2 aCorner;
attribute vec4 aSeed;
uniform vec3 uBox;
uniform vec3 uCentre;
uniform vec3 uWind;
uniform float uTime;
// How far the wind has carried the rain so far (wrapped to the box) and how far it has fallen,
// both added up frame by frame, so that a change in the wind or the fall never makes it jump;
// and how fast each is going just now (1 is ordinary).
uniform vec3 uDrift;
// The same, not wrapped: for the sheets, which travel with it.
uniform vec3 uCarried;
uniform float uFall;
uniform vec2 uSpeed;
// Channelled (sky-opening.ts, ?sky=all): how far the drops hang in the air glimmering, how far
// they have gone back up as mist, how far they are gathered into shoals like starlings, and how
// high the bottom edge of the rain has been lifted off the sea.
uniform float uHang;
uniform float uRise;
uniform float uMurmur;
uniform float uCurtain;
// Opened by breath alone (sky-breath.ts, ?sky=breath): 0..1 how far the in-breath has drawn the rain
// in towards the boat, and how far out from it the rain has begun to go back up, in metres (-1: not).
uniform vec3 uBoat;
uniform float uBreath;
uniform float uFront;
uniform float uRain;
uniform float uExposure;
uniform float uFocus;
uniform vec2 uResolution;
uniform vec4 uShelter;
uniform float uHold;
// The opened sky (sky-opening.ts): where its column stands on the sea (x, z), how wide the dry
// circle under it is, and how high its arms are.
uniform vec4 uCanopy;
// Cut off by Leane (rain-cut.ts): the height under which the drops are gone, the depth of the band
// in which they evaporate, and how far out from the boat (0: not cut).
uniform vec3 uCut;
uniform float uFar;
// The longest a streak is drawn, in metres (the owner, 18 October: the rain "less visually
// intrusive"; in a storm's wind the near streaks ran right across the view).
uniform float uStreak;
varying float vAlpha;
varying float vEdge;

float hash( vec3 p ) {
	p = fract( p * 0.3183099 + 0.1 );
	p *= 17.0;
	return fract( p.x * p.y * p.z * ( p.x + p.y + p.z ) );
}
float noise( vec3 p ) {
	vec3 i = floor( p );
	vec3 f = fract( p );
	f = f * f * ( 3.0 - 2.0 * f );
	return mix( mix( mix( hash( i ), hash( i + vec3( 1, 0, 0 ) ), f.x ), mix( hash( i + vec3( 0, 1, 0 ) ), hash( i + vec3( 1, 1, 0 ) ), f.x ), f.y ),
		mix( mix( hash( i + vec3( 0, 0, 1 ) ), hash( i + vec3( 1, 0, 1 ) ), f.x ), mix( hash( i + vec3( 0, 1, 1 ) ), hash( i + vec3( 1, 1, 1 ) ), f.x ), f.y ), f.z );
}

// Where a drop's path is bent by the shelter: points are pushed out from its centre, all of them
// within it to its surface and beyond, less and less the further they were, so that the rain
// parts round it and closes behind. (r' = sqrt( r^2 + R^2 ): nothing is left inside.)
vec3 parted( vec3 p, float hold ) {
	vec3 d = p - uShelter.xyz;
	float r = length( d );
	float R = uShelter.w * hold;
	if ( R <= 0.0 || r > R * 4.0 ) return p;
	return uShelter.xyz + d * ( sqrt( r * r + R * R ) / max( r, 1e-3 ) );
}

// Under the opened sky the rain is parted round a dry circle: every drop below its arms is
// pushed out from the column, those within the circle to its edge and beyond, so it falls round
// it like a curtain round a tent, heaviest at the edge, and closes again above and outside.
vec3 canopied( vec3 p ) {
	if ( uCanopy.z <= 0.0 ) return p;
	vec2 d = p.xz - uCanopy.xy;
	float r = length( d );
	float under = 1.0 - smoothstep( uCanopy.w - 40.0, uCanopy.w + 10.0, p.y );
	float R = uCanopy.z * under;
	if ( R <= 0.0 || r > R * 4.0 ) return p;
	p.xz = uCanopy.xy + d * ( sqrt( r * r + R * R ) / max( r, 1e-3 ) );
	return p;
}

void main() {
	// Bigger drops fall faster (about 6 to 9 m/s) and the wind carries them all at its own speed.
	vec3 fall = vec3( 0.0, - ( 6.0 + 3.0 * aSeed.w ), 0.0 );
	vec3 velocity = uWind * uSpeed.x + fall * uSpeed.y;
	vec3 corner = uCentre - 0.5 * uBox;
	vec3 at = corner + mod( aSeed.xyz * uBox + uDrift + fall * uFall - corner, uBox );
	// (A little flutter: the air they fall through is not smooth.)
	at.xz += length( uWind.xz ) * 0.004 * vec2( sin( uTime * 3.1 + aSeed.x * 40.0 ), cos( uTime * 2.7 + aSeed.y * 40.0 ) );
	// Gathered into shoals: carried round in great slow swirls, and only those in the shoals seen.
	vec3 swirlAt = at * 0.012 + vec3( uTime * 0.05, 0.0, - uTime * 0.04 );
	at += uMurmur * 30.0 * vec3( sin( swirlAt.y * 3.0 + swirlAt.z * 2.0 ), 0.4 * sin( swirlAt.x * 2.5 + uTime * 0.2 ), cos( swirlAt.x * 3.0 - swirlAt.y * 2.0 ) );

	// Sheets of heavier rain, carried along with the wind; at less rain, fewer drops.
	float sheet = noise( at * 0.035 - uCarried * 0.035 + vec3( 0.0, uTime * 0.05, 0.0 ) );
	float shown = step( fract( aSeed.w * 7.13 + aSeed.x * 3.7 ), uRain * ( 0.35 + 1.1 * sheet ) );
	shown *= mix( 1.0, smoothstep( 0.5, 0.62, noise( at * 0.02 + vec3( uTime * 0.12, uTime * 0.03, 0.0 ) ) ) * 1.6, uMurmur );
	// The in-breath: drawn in a little towards the boat, as breath draws the air.
	vec2 fromBoat = at.xz - uBoat.xz;
	float out_ = length( fromBoat );
	vec2 outward = fromBoat / max( out_, 1e-3 );
	at.xz -= uBreath * outward * min( out_ * 0.2, 5.0 );
	// The out-breath: once the wave spreading from the boat has passed a drop, it goes back up,
	// slowly and then faster, as warm air does, out a little and turning a little about the boat,
	// broadening into mist and gone some tens of metres up. (The wave spreads at 14 m/s.)
	float since = uFront > 0.0 ? max( 0.0, uFront - out_ ) / 14.0 : 0.0;
	float risen = 1.2 * since + 0.09 * since * since;
	if ( risen > 0.0 ) {
		float turn = 0.004 * risen * ( 1.0 + aSeed.y );
		fromBoat = mat2( cos( turn ), sin( turn ), - sin( turn ), cos( turn ) ) * ( at.xz - uBoat.xz );
		at.xz = uBoat.xz + fromBoat + outward * risen * 0.3;
		at.y += risen;
	}
	float mist = smoothstep( 0.0, 14.0, risen );
	shown *= 1.0 - smoothstep( 18.0, 55.0, risen );
	// The curtain lifted: nothing below its bottom edge.
	shown *= smoothstep( uCurtain - 6.0, uCurtain + 6.0, at.y );
	// Falling into the warm dry air under Leane's canopy, a drop evaporates: it thins and is gone
	// before the sea, raggedly, where the warmth lies unevenly.
	float evaporating = 0.0;
	if ( uCut.z > 0.0 ) {
		float under = 1.0 - smoothstep( 0.8 * uCut.z, uCut.z, out_ );
		float base = uCut.x + ( noise( at * 0.04 + vec3( uTime * 0.05, 0.0, - uTime * 0.03 ) ) - 0.5 ) * uCut.y * 1.6;
		evaporating = under * smoothstep( base + uCut.y, base, at.y );
		shown *= 1.0 - under * smoothstep( base, base - 0.5 * uCut.y, at.y );
	}

	// The streak: where the drop is, and where it was a moment ago, both bent by the shelter.
	vec3 head = at;
	// (Evaporating, it is smaller and shows a shorter streak.)
	vec3 smear = velocity * uExposure * ( 1.0 - 0.7 * evaporating );
	vec3 tail = at - smear * min( 1.0, uStreak / max( length( smear ), 1e-4 ) );
	// (Going up, it is seen as a soft upward smudge.)
	if ( risen > 0.0 ) tail = mix( tail, at - vec3( 0.0, 0.4 + 0.15 * risen, 0.0 ), smoothstep( 0.0, 2.0, risen ) );
	float hold = uHold * ( 1.0 - 0.35 * step( 0.82, fract( aSeed.z * 13.1 + floor( uTime * 0.7 ) * 0.37 ) ) );
	vec3 d = head - uShelter.xyz;
	float struck = uHold > 0.0 ? 1.0 - smoothstep( 0.0, uShelter.w * hold, length( d ) ) : 0.0;
	head = parted( canopied( head ), hold );
	tail = parted( canopied( tail ), hold );
	// Those that would have struck it lie on its face instead, as beads running down and off
	// it: on the windward side only, slow and short.
	float windward = step( 0.0, - dot( normalize( d ), normalize( uWind + vec3( 0.0, -6.0, 0.0 ) ) ) );
	float beading = step( 0.001, struck ) * windward * step( 0.7, aSeed.y );
	if ( beading > 0.0 ) {
		head = uShelter.xyz + normalize( d ) * uShelter.w * hold * 1.01;
		tail = head + vec3( 0.0, 0.06, 0.0 );
	}

	vec4 headClip = projectionMatrix * viewMatrix * vec4( head, 1.0 );
	vec4 tailClip = projectionMatrix * viewMatrix * vec4( tail, 1.0 );
	// (A drop flying away from the eye began its streak behind it: the streak starts where it
	// comes into sight, just in front of the eye, so the nearest drops still show, long.)
	if ( tailClip.w < 1.2 && headClip.w > 1.2 ) tailClip = mix( tailClip, headClip, ( 1.2 - tailClip.w ) / ( headClip.w - tailClip.w ) );
	if ( headClip.w < 1.2 && tailClip.w > 1.2 ) headClip = mix( headClip, tailClip, ( 1.2 - headClip.w ) / ( tailClip.w - headClip.w ) );
	vec4 clip = mix( tailClip, headClip, aCorner.x );
	// Across the streak in pixels: a drop is a few millimetres, so a pixel or so, but near ones
	// are out of focus and blurred broad and faint.
	float distance = max( headClip.w, 0.5 );
	float blur = uFocus / distance;
	float width = ( 0.9 + 3.0 * blur ) * ( 1.0 + 2.5 * uRise + 1.2 * mist );
	vec2 a = headClip.xy / max( headClip.w, 1e-3 );
	vec2 b = tailClip.xy / max( tailClip.w, 1e-3 );
	vec2 along = ( a - b ) * uResolution;
	float len = length( along );
	vec2 dir = len > 1e-3 ? along / len : vec2( 0.0, 1.0 );
	vec2 side = vec2( - dir.y, dir.x );
	clip.xy += side * aCorner.y * width / uResolution * clip.w;
	// A drop coming straight at the eye is still a drop: never drawn shorter than it is wide.
	// (Its streak, seen end-on, had no length, and was drawn as a hair-thin sideways line that
	// broke into pairs of dashes all over the sky.)
	clip.xy += dir * ( aCorner.x - 0.5 ) * max( 0.0, width - len ) / uResolution * clip.w;
	gl_Position = clip;
	// Fainter for being blurred, and lost in the rain with distance.
	// Hanging, each drop glimmers a little, as a drop held in the light does; gone back up, it is
	// mist: broad, faint.
	float glimmer = 1.0 + uHang * 0.9 * sin( uTime * 2.3 + aSeed.z * 60.0 );
	vAlpha = shown * ( 1.0 - 0.75 * evaporating ) * glimmer * ( 1.0 - 0.75 * max( uRise, mist ) ) * ( 0.35 / ( 1.0 + 3.0 * blur ) ) * exp( - distance / uFar ) * ( beading > 0.0 ? 0.5 : 1.0 );
	// Behind the camera: nothing.
	vAlpha *= step( 1.2, headClip.w ) * step( 1.2, tailClip.w );
	vEdge = aCorner.y;
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uColour;
uniform float uOpacity;
varying float vAlpha;
varying float vEdge;
void main() {
	float edge = 1.0 - smoothstep( 0.3, 1.0, abs( vEdge ) );
	gl_FragColor = vec4( uColour, edge * vAlpha * uOpacity );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

// count drops in a box of the given size, how far ahead of the eye its middle is, and the
// distance over which they are lost in the rain.
// order: the near rain is in front of the fog the storm drawn over the scene (fluid.ts, drawn at
// 5), the far rain inside it.
function rainVolume(count: number, box: THREE.Vector3, ahead: number, far: number, layer: number, order: number, streak: number, faint: number) {
	const geometry = new THREE.InstancedBufferGeometry();
	geometry.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(12), 3));
	geometry.setAttribute("aCorner", new THREE.Float32BufferAttribute([0, -1, 0, 1, 1, -1, 1, 1], 2));
	geometry.setIndex([0, 1, 2, 1, 3, 2]);
	const seeds = new Float32Array(count * 4);
	for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
	geometry.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 4));
	geometry.instanceCount = count;
	const uniforms = {
		uBox: { value: box },
		uCentre: { value: new THREE.Vector3() },
		uWind: { value: new THREE.Vector3() },
		uTime: { value: 0 },
		uRain: { value: 0 },
		// (About a twenty-fifth of a second: what the eye, like a film camera, smears a moving drop over.)
		uExposure: { value: 0.04 },
		uFocus: { value: 1.2 },
		uResolution: { value: new THREE.Vector2(1, 1) },
		uShelter: { value: new THREE.Vector4(0, 0, 0, 0) },
		uHold: { value: 0 },
		uDrift: { value: new THREE.Vector3() },
		uCarried: { value: new THREE.Vector3() },
		uFall: { value: 0 },
		uSpeed: { value: new THREE.Vector2(1, 1) },
		uHang: { value: 0 },
		uRise: { value: 0 },
		uMurmur: { value: 0 },
		uCurtain: { value: -1000 },
		uBoat: { value: new THREE.Vector3() },
		uBreath: { value: 0 },
		uFront: { value: -1 },
		uCanopy: { value: new THREE.Vector4(0, 0, 0, 0) },
		uCut: { value: new THREE.Vector3(0, 0, 0) },
		uFar: { value: far },
		uStreak: { value: streak },
		uColour: { value: new THREE.Color() },
		uOpacity: { value: 0 },
	};
	const mesh = new THREE.Mesh(
		geometry,
		new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
	);
	mesh.frustumCulled = false;
	mesh.renderOrder = order;
	// Seen by the eye only, not the water's mirror (rain is not seen reflected at this scale).
	mesh.layers.set(layer);
	return { mesh, uniforms, ahead, faint };
}

export interface RainFrame {
	time: number;
	delta: number;
	// 0..1 how hard it is raining.
	rain: number;
	// The wind in m/s, as a vector the way it blows (x across, z along the scene's axes).
	wind: THREE.Vector3;
	// 0..1 how strong the gusts are just now, on top of it.
	gust: number;
	// Colour of the light the rain is seen by, and 0..1 a lightning flash.
	light: THREE.Color;
	flash: number;
	// Where the shelter is wanted (world position) and its radius, and 0..1 how far it is held.
	shelter: THREE.Vector3;
	shelterRadius: number;
	hold: number;
	// The opened sky: where its column stands on the sea (x, z), the radius of the dry circle,
	// and the height of its arms.
	canopy: THREE.Vector4;
	// Channelled (?sky=all): 0..1 how far the rain hangs, how far it has gone back up, how far it is
	// gathered into shoals, and the height in metres of its lifted bottom edge (-1000: on the sea).
	hang: number;
	rise: number;
	murmur: number;
	curtain: number;
	// Opened by breath alone (?sky=breath): 0..1 the in-breath, and how far out the rain has begun
	// to go back up, in metres (-1: not).
	breath: number;
	front: number;
	// Cut off by Leane (rain-cut.ts), if she is: the height it is gone under, the depth it thins
	// over, and how far out from the boat.
	cut?: { height: number; depth: number; reach: number };
}

export function createRain(scene: THREE.Scene, camera: THREE.PerspectiveCamera, layer: number) {
	const volumes = [
		// (Kept quiet: the near drops, which cross the whole view, faintest and shortest; the far
		// ones, which read as the weather's own texture, least changed.)
		rainVolume(2500, new THREE.Vector3(14, 10, 14), 6, 30, layer, 6, 0.35, 0.3),
		rainVolume(7000, new THREE.Vector3(60, 36, 70), 30, 90, layer, 6, 1.2, 0.5),
		rainVolume(9000, new THREE.Vector3(260, 120, 320), 150, 300, layer, 4, 4, 0.75),
	];
	for (const volume of volumes) scene.add(volume.mesh);
	const forward = new THREE.Vector3();
	// The shelter is held, not fixed: it trails the boat's heave and roll a moment behind.
	const held = new THREE.Vector3();
	// Kept for each frame, rather than made anew.
	const wind = new THREE.Vector3();
	const WHITE = new THREE.Color(1, 1, 1);
	let started = false;
	const drift = new THREE.Vector3();
	let fallen = 0;

	const update = (frame: RainFrame) => {
		const visible = frame.rain > 0.001;
		camera.getWorldDirection(forward);
		forward.y = 0;
		forward.normalize();
		if (!started) {
			held.copy(frame.shelter);
			started = true;
		}
		held.lerp(frame.shelter, Math.min(1, frame.delta * 2.5));
		wind.copy(frame.wind).multiplyScalar(1 + 0.35 * frame.gust);
		// (Past some 45 m/s rain is torn to spray: drops drawn going faster only rushed at the eye
		// as streaks out of one point, like stars in a jump to light speed.)
		if (wind.length() > 45) wind.setLength(45);
		// Hanging, they all but stop; going back up, they rise slowly and the wind barely moves them.
		const along = THREE.MathUtils.lerp(THREE.MathUtils.lerp(1, 0.04, frame.hang), 0.12, frame.rise);
		const down = THREE.MathUtils.lerp(THREE.MathUtils.lerp(1, 0.03, frame.hang), -0.35, frame.rise);
		drift.addScaledVector(wind, along * frame.delta);
		fallen += down * frame.delta;
		for (const volume of volumes) {
			volume.mesh.visible = visible;
			if (!visible) continue;
			const u = volume.uniforms;
			u.uCentre.value.copy(camera.position).addScaledVector(forward, volume.ahead);
			u.uCentre.value.y = camera.position.y + 2;
			u.uWind.value.copy(wind);
			const box = u.uBox.value;
			u.uDrift.value.set(drift.x % box.x, drift.y % box.y, drift.z % box.z);
			u.uCarried.value.copy(drift);
			u.uFall.value = fallen;
			u.uSpeed.value.set(along, down);
			u.uHang.value = frame.hang;
			u.uRise.value = frame.rise;
			u.uMurmur.value = frame.murmur;
			u.uCurtain.value = frame.curtain;
			u.uBoat.value.copy(camera.position);
			u.uBreath.value = frame.breath;
			u.uFront.value = frame.front;
			u.uTime.value = frame.time;
			u.uRain.value = frame.rain;
			u.uResolution.value.set(window.innerWidth, window.innerHeight);
			u.uShelter.value.set(held.x, held.y, held.z, frame.shelterRadius);
			// In a gust it gives a little.
			u.uHold.value = frame.hold * (1 - 0.25 * frame.gust);
			u.uCanopy.value.copy(frame.canopy);
			u.uCut.value.set(frame.cut?.height ?? 0, frame.cut?.depth ?? 0, frame.cut?.reach ?? 0);
			u.uColour.value.copy(frame.light).lerp(WHITE, 0.6 * frame.flash);
			u.uOpacity.value = (0.6 + 0.4 * frame.flash) * volume.faint;
		}
	};

	const dispose = () => {
		for (const volume of volumes) {
			scene.remove(volume.mesh);
			volume.mesh.geometry.dispose();
			(volume.mesh.material as THREE.Material).dispose();
		}
	};

	return { update, dispose };
}
