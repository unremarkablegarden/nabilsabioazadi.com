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
// Every now and then three or four of them sound the water with braids that duck into the sea
// and come back to the boat (see the soundings, further down).
//
// There are thirteen of them on the boat (the owner's): four at the front at a time, and they
// take turns. When the boat has to be slowed, that is done by some of the weaker ones, who form
// deeper weaves close to the sea near the boat, almost wholly out of the picture; the weaving
// ahead is not interrupted by it.
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
import { pixelRatio, ribbonShaderChunk, stripIndices, WEAVE_RENDER_ORDER } from "./weave";

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
// And each tress has halos: soft doubles of some of its filaments, lying almost but not quite
// on them. They are the blur about a filament: light that has not settled where the filament is.
const HALOS = 28;
// Filaments to each channeller, and how many of them are gold.
const FILAMENTS = 64;
const GOLDEN = 14;
const SEGMENTS = 300;

// The height of the sea at a place (x), and beside it (y) the height of the long swell alone,
// without the shorter waves that ride on it: what lies on the swell is lifted slowly, and the
// short waves pass under and over it. (Shared by the weaves that lie on the sea; each declares
// the wave uniforms.)
const seaPartsChunk = (trains: number) => /* glsl */ `
vec2 seaParts( vec2 p ) {
	float distanceToEye = length( p - cameraPosition.xz );
	vec2 height = vec2( 0.0 );
	for ( int i = 0; i < ${trains}; i ++ ) {
		float steepness = waves[ i ].z * waveSteepness
			* ( 1.0 - smoothstep( 0.5 * waveFade[ i ], waveFade[ i ], distanceToEye ) );
		if ( steepness <= 0.0 ) continue;
		float k = waveForm[ i ].z;
		float h = steepness / k * sin( k * dot( waveForm[ i ].xy, p ) - waveForm[ i ].w * waveTime + waves[ i ].y );
		height += h * vec2( 1.0, 1.0 - smoothstep( 0.08, 0.2, k ) );
	}
	return height;
}
`;

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
// 0..1 how light the sky is. Against a light sky a fine bright line reads as a wire, so there
// each filament is drawn broad and soft and fainter: a breath of light, not a line.
// Only there: where the sea is behind it, it is drawn fine and sharp whatever the hour (the
// owner saw the weaving lose its sharpness against the ocean when all of it was softened).
uniform float uSoften;
// For each seat, 0..1 how restless its occupant is (their temperament): a restless one's
// filaments stray further and wander quicker; a steady one's lie close and still.
uniform vec4 uRestless;
// How far each seat's filaments have wandered, along and across, added up as they go: a restless
// one's the faster. (Not the time multiplied by how restless: then when another took the seat
// the whole tress was thrown sideways at once.)
uniform vec4 uWanderX;
uniform vec4 uWanderY;
// Each one's hand (see \`hands\` in update): how high they carry a reading (-1 low, for the
// water-minded, to 1 high, for the air-minded), how open their tress lies (1 as before), how
// loosely they hold it (0.5 as before), and how far its filaments have wound round, added up as
// they go at each one's own pace. All as before unless ?hands is in the address.
uniform vec4 uCarry;
uniform vec4 uOpen;
uniform vec4 uLoose;
uniform vec4 uTempo;
// 0..1 how far it is day. By day a weave is not seen as light (see the fragment shader), and
// what they weave is akasha, air and water: for each seat, the element its occupant is weaving.
uniform float uDay;
uniform vec4 uSeatElement;
// Tending. For each seat: which reading its occupant is at (0 the water, 1 the wind, 2 the
// pressure), and for how many seconds. And what is really there to be read, from the forecast:
// the pressure's trend (-1 falling fast, 0 steady, 1 rising fast), the wind over the sea as it
// crosses the view (x to the right, y away from the boat, z its force 0..1), and the heat between
// sea and air (-1 the sea the colder, 1 the warmer).
uniform vec4 uAct;
uniform vec4 uAge;
// Turning from one thing to another (the owner's: never a switch; the intention and the force
// move steadily to the new place, and the turning is done at the boat). For each seat, the
// reading it is turning from, and 0..1 how far the turn has gone. And for all four together,
// between their readings and the healing flow: which way they are turning (1 towards their
// readings) and how far out along the weave the turn has reached (0 at the boat, 1.6 all of it).
uniform vec4 uWas;
uniform vec4 uTurn;
// Where each seat's reading is sent, in radians right of straight ahead.
uniform vec4 uBearing;
uniform float uToReading;
uniform float uFront;
uniform float uPressure;
uniform vec3 uWindView;
// How far the wind reading's filaments have flapped, added up as it goes: the harder the wind the
// faster. (Not the time multiplied by the wind's force: then every change in the force, every
// gust, threw the flapping forward or back by as much more as the page had been open longer.)
uniform float uFlap;
uniform float uWarm;
uniform vec3 uTints[ 3 ];
uniform vec3 uElements[ 6 ];
uniform vec3 uBaseTone;
// The sea, to ride on it: the same wave trains the water is drawn with.
uniform vec4 waves[ ${trains} ];
uniform vec4 waveForm[ ${trains} ];
uniform float waveFade[ ${trains} ];
uniform float waveSteepness;
uniform float waveTime;
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;
varying float vSoft;
varying float vWhite;
varying float vWide;
varying float vShade;
varying vec3 vSheath;
uniform vec3 uSheath[ 4 ];
${ribbonShaderChunk}
${channelPathChunk}

// Height of the sea under the last point worked out, for lighting the filaments by the waves.
float seaUnder;
// From the last reading worked out: how much of the filament is there, and the colour it has
// taken from what it found, and how far.
float formShown;
vec3 formTint;
float formTinted;
// 0..1 how far the point last worked out is in its reading's form and not in the flow, and how
// much of the force of a turn is on it.
float formWeight;
float formPush;
// 0..1 how far a turn is under way at all (0 before and after it).
float formGoing;
// 0..1 how far the reading keeps its filaments hair-fine by night, and is not drawn broad and
// soft: a tress laid close on the sea, not one spread over the dark of the sky.
float formFine;
// 0..1 how far it keeps its filaments as threads against a day sky, not softened to a blur there:
// the wind reading's streaming ends (the owner, 14 October: blurred, they turned "into oblong
// pieces rather than filaments").
float formSharp;
// 0..1 how far what it has taken its colour from is its own element (see the water reading),
// which by day must show in the sheath beside the thread too.
float formDye;

// A turn begins at the hands and runs out along the weave: what is near the boat is in the new
// place first, and the far end follows. 0..1 how far a point has turned, for a turn that has
// reached "front". The force of it lies near the boat, where the turning is done, and on the
// bend itself as it travels out.
float turned( float tt, float front ) {
	return smoothstep( tt, tt + 0.6, front );
}

// A point part-way from one place to another by way of a third: the path bends, it does not cut across.
vec3 arced( vec3 from, vec3 by, vec3 to, float gone ) {
	return mix( mix( from, by, gone ), mix( by, to, gone ), gone );
}

float pushed( float tt, float front ) {
	float going = sin( 3.14159 * clamp( front / 1.6, 0.0, 1.0 ) );
	return going * ( 0.45 * ( 1.0 - smoothstep( 0.0, 0.45, tt ) ) + 0.8 * exp( - pow( ( tt - front + 0.3 ) / 0.14, 2.0 ) ) );
}

float seaHeight( vec2 p ) {
	float distanceToEye = length( p - cameraPosition.xz );
	float height = 0.0;
	// (The way each train runs, its wave number, its pace and where it fades out are worked out
	// once a frame: see workOutTrains in gerstner-waves.ts.)
	for ( int i = 0; i < ${trains}; i ++ ) {
		float steepness = waves[ i ].z * waveSteepness
			* ( 1.0 - smoothstep( 0.5 * waveFade[ i ], waveFade[ i ], distanceToEye ) );
		if ( steepness <= 0.0 ) continue;
		float k = waveForm[ i ].z;
		height += steepness / k * sin( k * dot( waveForm[ i ].xy, p ) - waveForm[ i ].w * waveTime + waves[ i ].y );
	}
	return height;
}

${seaPartsChunk(trains)}

// A filament is energy sent out along a line, and it behaves as energy does: the further it
// goes the more of it is lost. It spreads, it trembles (the heat of its going shakes it, more
// and more), it dims and it cools from white towards blue. That is "spent", 0 at the boat and
// rising with distance.
float spent( float ahead ) {
	return 1.0 - exp( - ahead / 260.0 );
}

// And yet it does what spent energy cannot. Along every tress run stretches where the filaments
// draw together again, stop trembling and burn whiter and brighter than they left the hand: and
// those stretches grow stronger the further out they travel, not weaker. They are taking in
// energy that was never theirs: the sea's, the wind's. "gathered" is 0..1 how far a point is
// inside such a stretch.
float gathered( float who, float q ) {
	float runs = sin( q * 4.2 - channelStream * ( 0.55 + 0.08 * who ) + who * 2.1 );
	return smoothstep( 0.55, 0.95, runs );
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

// A reading (the owner's: each act has its own form, and each answers to what is really there).
// Where a point of this seat's weave lies while its occupant is at a reading of their own.
//
//   pressure   A slender stem up into the air, which at its top opens level in every direction
//              and settles there, like a held breath. What the barometer is doing is in how it
//              lies: steady, a flat still disc; falling, it sinks lower and its rim droops, a
//              canopy settling; rising, it stands higher and its rim lifts, a cup. Faster change,
//              wider. Falling it greys towards slate; rising it clears towards gold.
//   wind       A stem up at a slant, and from its top the filaments stream away the way the wind
//              is really blowing, flapping, spreading and torn off at their own lengths. In a
//              light air they hang and droop; in a gale they lie out long and flat and flap fast;
//              in gusts the tearing comes and goes.
//   water      One long open line laid with the sea, never a loop across it (the owner, 13 October:
//              the loop staggered and "sometimes bends into rectangles"; seen from so low, a loop
//              lying flat on the sea is a level bar with two upright sides). Each element in it
//              has the one thing to do that it has in an ocean:
//                metal   goes first and alone: one hair-fine line, cast like a lead line, that
//                        finds the current and lies along it in one curve. The rest follow it.
//                water   the body of the tress, close and low, sinking little by little along
//                        its length, each filament in its own place.
//                air     breath taken down: where a real crest passes over the weave a few
//                        filaments are folded under it. A flat sea takes none.
//                fire    warmth moved, never flame: over a sea warmer than the air it lifts
//                        slowly off the far end and thins away downwind. Over a colder sea it
//                        is not there.
//                earth   the heaviest and slowest: lowest, soonest under and deepest, the more
//                        the sea is doing. It is what stays (see the mended water in tend).
//              Nothing comes back as a second strand: what is learnt runs home as light along
//              the same line. It rides the long swell only; the short waves pass under it.
vec3 formPoint( float t, float act, float age ) {
	float who = aThread.x;
	// (A reading is a near thing: the visible part of the thread is laid along the whole of it.)
	float tt = clamp( t / 0.7, 0.0, 1.0 );
	vec2 boat = channelBoat + vec2( ( who - 1.5 ) * 1.5, 0.0 );
	float bearing = channelOf( uBearing, who ) + 0.03 * sin( channelTime * ( 0.04 + 0.01 * who ) + who * 2.4 );
	vec2 dir = vec2( sin( bearing ), - cos( bearing ) );
	vec2 side = vec2( - dir.y, dir.x );
	float hands = cameraPosition.y - 1.2;
	// Each filament's own small place in the tress.
	float turn = aSeed.x * 6.28319 + tt * ( 4.0 + 5.0 * aSeed.y ) - 0.15 * channelOf( uTempo, who );
	vec2 own = aSeed.z * vec2( cos( turn ), sin( turn ) ) * channelOf( uOpen, who );
	// How high they carry it, and how loosely.
	float carry = channelOf( uCarry, who );
	float loose = channelOf( uLoose, who );
	formShown = smoothstep( 0.0, 0.06, tt );
	formTint = vec3( 1.0 );
	formTinted = 0.0;
	formFine = 0.0;
	formDye = 0.0;
	formSharp = 0.0;
	vec2 xz;
	float y;
	// How a weave leaves the boat (the owner: "too angular... in how they heave in the early step
	// from the boat. Weaves are rarely so angular"). Nothing goes straight from the hands to where
	// it is going. It is cast out low and a little wide of its mark, on the other side from its
	// neighbour, runs along over the water, and comes round and up in one curve, quickest in the
	// middle and easing as it nears its top; and what it opens into at the top has already begun
	// to open before it gets there, so there is no corner where the two meet.
	float swing = mod( who, 2.0 ) < 0.5 ? 0.3 : - 0.3;
	vec2 thrown = vec2( sin( bearing + swing ), - cos( bearing + swing ) );
	if ( act > 1.5 ) {
		float s = smoothstep( 0.0, 0.66, tt );
		float u = smoothstep( 0.34, 1.0, tt );
		float sag = - uPressure;
		float breath = sin( channelTime * 0.33 + who );
		float top = ( 36.0 - 11.0 * sag + 1.5 * breath ) * ( 1.0 + 0.4 * carry );
		// (It opens slowly once it is up, and then holds.)
		float reach = ( 26.0 + 14.0 * abs( uPressure ) ) * ( 1.0 - exp( - age / 5.0 ) ) * ( 0.93 + 0.07 * breath );
		vec2 bend = boat + thrown * 70.0;
		xz = mix( mix( boat, bend, s ), mix( bend, boat + dir * 135.0, s ), s ) + side * own.x * ( 0.25 + 0.9 * s );
		// (Plain from the hands by day: every weave begins at the boat, and faint there it seemed to
		// rise out of the open sea. By night still faint by the boat, where a broad ribbon so near
		// the eye was a bar of light.)
		formShown = mix( smoothstep( 0.04, 0.3, tt ), smoothstep( 0.0, 0.06, tt ), uDay );
		y = mix( hands, 2.4, smoothstep( 0.0, 0.22, s ) ) + ( top - 2.4 ) * pow( smoothstep( 0.1, 1.0, s ), 1.5 ) + own.y * ( 0.25 + 0.5 * s );
		float spoke = aSeed.x * 6.28319 + 0.9 * u + channelTime * 0.03;
		float r = reach * pow( u, 1.3 ) * ( 0.55 + 0.45 * fract( aSeed.y * 7.3 ) );
		xz += vec2( cos( spoke ), sin( spoke ) ) * r;
		y += - sag * 0.42 * r * r / max( reach, 1.0 ) + 0.35 * u * sin( r * 0.45 - channelTime * 0.45 );
		formShown *= 1.0 - smoothstep( 0.75, 1.0, u );
		// (Where all its filaments meet at the top of the stem they would make a point of light
		// in the sky, which nothing of theirs may: each is drawn fainter there.)
		formShown *= 1.0 - 0.8 * exp( - pow( ( tt - 0.5 ) / 0.07, 2.0 ) );
		formTint = sag > 0.0 ? vec3( 0.5, 0.52, 0.72 ) : vec3( 1.0, 0.86, 0.6 );
		formTinted = 0.75 * abs( sag ) * smoothstep( 0.0, 0.3, u );
	} else if ( act > 0.5 ) {
		float s = smoothstep( 0.0, 0.58, tt );
		float u = smoothstep( 0.28, 1.0, tt );
		u *= u;
		float force = uWindView.z;
		vec2 w = dot( uWindView.xy, uWindView.xy ) > 0.0001 ? normalize( vec2( uWindView.x, - uWindView.y ) ) : side;
		vec2 crosswise = vec2( - w.y, w.x );
		float top = ( 22.0 + 3.0 * sin( channelTime * 0.21 + who ) ) * ( 1.0 + 0.4 * carry );
		vec2 bend = boat + thrown * 54.0;
		xz = mix( mix( boat, bend, s ), mix( bend, boat + dir * 105.0, s ), s ) + w * 12.0 * force * s * s + side * own.x * ( 0.25 + 0.9 * s );
		formShown = mix( smoothstep( 0.04, 0.26, tt ), smoothstep( 0.0, 0.06, tt ), uDay );
		y = mix( hands, 2.0, smoothstep( 0.0, 0.22, s ) ) + ( top - 2.0 ) * pow( smoothstep( 0.1, 1.0, s ), 1.5 ) + own.y * ( 0.25 + 0.5 * s );
		float gust = 1.0 + 0.8 * channelWind.y * sin( channelTime * 0.7 + who );
		float longness = ( 28.0 + 115.0 * force ) * ( 0.85 + 0.15 * gust );
		float flap = u * 8.0 - uFlap + aSeed.x * 2.2 + who;
		float sway = ( 0.4 + 4.0 * u ) * ( 0.35 + 0.9 * force ) * gust * ( 0.6 + 0.8 * loose );
		xz += w * longness * u + crosswise * ( sin( flap ) * sway + own.x * u * longness * 0.1 );
		// (With no wind to carry it, it hangs.)
		y += cos( flap * 0.8 ) * sway * 0.6 + own.y * u * longness * 0.06 - ( 1.0 - force ) * u * u * 16.0;
		float torn = 0.4 + 0.6 * fract( aSeed.x * 13.7 ) - 0.25 * channelWind.y * ( 0.5 + 0.5 * sin( channelTime * 0.9 + aSeed.y * 30.0 ) );
		formShown *= 1.0 - smoothstep( torn - 0.22, torn, u );
		formShown *= 1.0 - 0.8 * exp( - pow( ( tt - 0.42 ) / 0.07, 2.0 ) );
		y = max( y, 0.6 );
		formSharp = smoothstep( 0.3, 0.5, tt );
	} else {
		// (Each to their own side of the boat, so that no two lines cross.)
		float sgn = who < 1.5 ? - 1.0 : 1.0;
		// Which element this filament is. (A veil or a halo is of the water, the body of it.)
		float lot = fract( aSeed.y * 57.3 );
		bool fine = aSoft < 0.5;
		bool metal = fine && aSeed.y < 0.05;
		bool air = fine && ! metal && lot > 0.5 && lot <= 0.68;
		bool fire = fine && ! metal && lot > 0.68 && lot <= 0.82;
		bool earth = fine && ! metal && lot > 0.82;
		// The line: out the way it is sent, and round in one curve to the side the current runs
		// (with no current to speak of, to its own side), further the harder it runs.
		float carry = abs( channelCurrent );
		float aside = mix( sgn * 38.0, sign( channelCurrent ) * ( 44.0 + 50.0 * carry ), smoothstep( 0.03, 0.2, carry ) );
		vec2 bend = boat + dir * 50.0 + side * aside * 0.2;
		xz = mix( mix( boat, bend, tt ), mix( bend, boat + dir * 80.0 + side * aside * 1.2, tt ), tt );
		// (The tress opens a little as it goes. The metal is the line itself.)
		float open = ( 0.3 + 1.0 * tt ) * ( metal ? 0.12 : 1.0 );
		xz += side * own.x * open;
		vec2 sea = seaParts( xz );
		// Clear of the short waves, which pass under it.
		float clear = ( 0.4 + 0.25 * channelSea.y ) * ( 1.0 + 0.3 * carry );
		y = clear * ( earth ? 0.4 : air ? 1.5 : 1.0 ) + own.y * open * 0.5;
		// Air: folded under each crest that passes.
		float crest = smoothstep( 0.2, 0.7, ( sea.x - sea.y ) / max( 0.25 * channelSea.y, 0.1 ) );
		if ( air ) y = mix( y, sea.x - sea.y - 0.5, crest * smoothstep( 0.15, 0.35, tt ) );
		// Sinking, little by little, each in its own place: earth soonest and deepest.
		float from = earth ? 0.22 + 0.2 * fract( aSeed.x * 7.3 ) : 0.45 + 0.35 * fract( aSeed.x * 7.3 );
		float sunk = metal || fire ? 0.0 : smoothstep( from, from + 0.35, tt );
		y = mix( y, - ( earth ? 1.5 + 3.0 * channelSea.x : 1.0 ) - aSeed.z, sunk );
		// (Lost to sight as it goes under, not seen going down: seen from so low, a line that
		// runs out and then visibly dips draws a small hoop standing on the sea.)
		formShown *= 1.0 - smoothstep( 0.0, 0.3, sunk );
		// Fire: the sea's warmth, lifted off the far end and carried away downwind.
		if ( fire ) {
			float warm = max( uWarm, 0.0 );
			float u = smoothstep( 0.5, 1.0, tt );
			vec2 w = dot( uWindView.xy, uWindView.xy ) > 0.0001 ? normalize( vec2( uWindView.x, - uWindView.y ) ) : side;
			y += warm * 16.0 * u * u;
			xz += w * ( 8.0 + 30.0 * uWindView.z ) * u * u + side * own.x * 4.0 * u;
			formShown *= smoothstep( 0.0, 0.12, warm ) * ( 1.0 - smoothstep( 0.45, 0.95, u ) );
		}
		y += sea.y;
		y = mix( hands, y, smoothstep( 0.0, 0.12, tt ) );
		// Metal first: the others follow its line out a few seconds after, and on a quiet sea
		// there is less of them. (Not next to nothing, as was tried: by night that left no weave.)
		if ( ! metal ) {
			float follows = ( age - 3.0 ) / 7.0;
			formShown *= ( 1.0 - smoothstep( follows - 0.2, follows, tt ) ) * mix( 0.6, 1.0, smoothstep( 0.05, 0.3, channelSea.x ) );
		}
		// What is learnt runs home along it as light.
		formShown *= mix( 1.0, 0.5 + 1.1 * pow( 0.5 + 0.5 * sin( tt * 7.0 + channelTime * 0.9 + who ), 6.0 ), metal ? 1.0 : 0.3 );
		formShown *= smoothstep( 1.0, 0.9, tt );
		formTint = metal ? vec3( 0.78, 0.84, 0.92 ) : air ? vec3( 0.66, 0.6, 1.0 ) : fire ? vec3( 1.0, 0.68, 0.5 ) : earth ? vec3( 0.62, 0.74, 0.4 )
			: mix( vec3( 0.45, 1.0, 0.84 ), vec3( 0.6, 0.72, 1.0 ), smoothstep( 0.1, 0.7, - uWarm ) );
		formTinted = 0.85 * smoothstep( 0.08, 0.3, tt );
		formFine = metal ? 0.85 : 0.1;
		formDye = 1.0;
	}
	return vec3( xz.x, y, xz.y );
}

// Where a point of this seat's weave lies in its occupant's reading: the one they are at, or,
// while they turn from another, part-way between the two, the near end first.
vec3 readingPoint( float t ) {
	float who = aThread.x;
	float turn = channelOf( uTurn, who );
	vec3 now = formPoint( t, channelOf( uAct, who ), channelOf( uAge, who ) );
	if ( turn > 0.999 ) return now;
	float shownNow = formShown;
	vec3 tintNow = formTint;
	float tintedNow = formTinted;
	float fineNow = formFine;
	float dyeNow = formDye;
	float sharpNow = formSharp;
	vec3 was = formPoint( t, channelOf( uWas, who ), 60.0 );
	float tt = clamp( t / 0.7, 0.0, 1.0 );
	float gone = turned( tt, turn * 1.6 );
	formShown = mix( formShown, shownNow, gone );
	formTint = mix( formTint, tintNow, gone );
	formTinted = mix( formTinted, tintedNow, gone );
	formFine = mix( formFine, fineNow, gone );
	formDye = mix( formDye, dyeNow, gone );
	formSharp = mix( formSharp, sharpNow, gone );
	formPush = max( formPush, pushed( tt, turn * 1.6 ) );
	formGoing = max( formGoing, sin( 3.14159 * turn ) );
	// The turn itself is a curve (the owner's): a point does not go straight from its old place to
	// its new one. It is drawn down and in, towards the water ahead of the boat, and goes out
	// again from there: which is also where the one turning it puts their strength.
	float bearing = channelOf( uBearing, who );
	vec2 low = channelBoat + vec2( ( who - 1.5 ) * 1.5, 0.0 ) + vec2( sin( bearing ), - cos( bearing ) ) * ( 18.0 + 95.0 * tt );
	vec3 by = mix( 0.5 * ( was + now ), vec3( low.x, 2.0, low.y ), 0.6 );
	return arced( was, by, now, gone );
}

// (onlyPlace: nothing but the place is wanted, as for the point a little further along that
// gives a filament its direction. Wholly in its reading's form, a point's place is the reading's
// alone, and the flow, with the sea under it, need not be worked out for it.)
vec3 threadPoint( float t, bool onlyPlace ) {
	float who = aThread.x;
	float tt = clamp( t / 0.7, 0.0, 1.0 );
	formWeight = uToReading > 0.5 ? turned( tt, uFront ) : 1.0 - turned( tt, uFront );
	if ( onlyPlace && formWeight >= 1.0 ) return readingPoint( t );
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
	float width = ( 0.1 + 0.04 * along ) * ( 1.0 + 1.8 * channelHold ) * ( 1.0 + 1.4 * channelControl ) * ( 0.75 + 0.7 * channelSea.x ) * ( 1.0 + 0.4 * channelSurge ) * smoothstep( - 4.0, 8.0, ahead ) * breath * ( 0.55 + 0.7 * channelStrength( who ) ) * ( 1.0 - smoothstep( 0.6, 0.97, way ) )
		// (Each for themselves by day, a tress lies open and loose on the sea, not drawn tight.)
		* ( 1.0 + 0.5 * ( 1.0 - channelLink ) )
		// (Each as open or as close as they hold it: see uOpen.)
		* mix( channelOf( uOpen, who ), 1.0, channelLink );
	// Its three strands pass over and under each other: a plait, loosely kept.
	float phase = q * 6.0 - channelTime * 0.4 + aThread.y * 2.0944 + who * 0.7;
	vec2 across = vec2( sin( phase ), 0.5 * sin( 2.0 * phase ) ) * 0.42;
	// (In a storm the three strands lie side by side, broad and parallel, and only sway: thrown
	// wide, the plait's figures of eight lay on the sea as great loops.)
	across = mix( across, vec2( ( aThread.y - 1.0 ) * 0.36 + 0.08 * sin( phase ), 0.0 ), channelControl );
	// Each filament has its own place in its strand, and winds slowly round it.
	float wind = aSeed.x * 6.28319 + q * ( 1.2 + 1.6 * aSeed.y ) - channelTime * 0.15;
	across += aSeed.z * 0.5 * vec2( cos( wind ), sin( wind ) );
	// And strays from it, some hardly at all and some a long way.
	// (Less and less as the flow goes down to the horizon, where strays would only make a tangle.)
	// (In the trial, a strong channeller's tress is taut: its filaments hardly stray.)
	float skill = channelOf( channelOwn, who ) * channelLoss;
	float restless = channelOf( uRestless, who );
	// (Each for themselves, the tresses are kept close: four clean lines over the sea, like strings.)
	// (In a storm the strays are drawn in: thrown wide over the waves, they were loops and
	// scribbles across the sea. Its breadth is in the tress, not in its strays.)
	across += ( 1.0 - 0.6 * ( 1.0 - channelLink ) ) * aSeed.w * 0.55 * ( 0.55 + 1.1 * restless ) * ( 1.0 - 0.75 * skill ) * ( 1.0 - 0.6 * channelHold ) * ( 1.0 - 0.85 * smoothstep( 0.3, 0.8, way ) ) * ( 1.0 - 0.75 * channelControl ) * vec2(
		drift( q * 2.3 + aSeed.x * 40.0 - channelOf( uWanderX, who ) ),
		drift( q * 2.9 + aSeed.y * 40.0 + channelOf( uWanderY, who ) )
	);
	// What is spent shows as a loosening, finer than the wandering, and more with distance; where
	// the tress has gathered itself it stops and the strays are drawn in.
	// (It used to tremble in sharp corners. The owner saw electricity in that, which is the
	// opposite of what they are about: nothing in a weave has a corner now.)
	float lost = spent( along );
	float held = gathered( who, q ) * ( 0.5 + 0.5 * lost );
	across += 0.16 * lost * ( 1.0 - held ) * ( 1.0 - 0.8 * skill ) * vec2(
		drift( q * 11.0 + aSeed.x * 211.0 - channelTime * 0.9 ),
		drift( q * 13.0 + aSeed.y * 173.0 + channelTime * 0.8 )
	);
	across *= 1.0 - 0.55 * held;
	// A weave cut loose and lingering has run together: its filaments lie almost on one line.
	across *= 1.0 - 0.85 * channelPresence( who, along ).y;
	// The wind takes the loose ones with it.
	across.x += channelWind.x * aSeed.w * 0.9;
	// They leave the channeller's two open hands spread like fingers, as loose wisps, and are
	// only drawn into a tress a little way out.
	float fromHands = channelApart( along ) * ( aSoft > 0.9 ? 0.0 : 1.0 );
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
	// Healing (the owner's): linked, the one flow does not run on to the horizon. A little way out
	// it sinks into the sea, each filament to its own depth, and is lost to sight in the water.
	low = mix( low, - 0.8 - 0.012 * ahead - 2.5 * aSeed.z, channelHeal * smoothstep( 70.0, 150.0, ahead ) );
	float height = mix( cameraPosition.y - 1.2, seaUnder + low, smoothstep( - 2.0, 14.0, ahead ) );
	formShown = 1.0;
	formTinted = 0.0;
	formFine = 0.0;
	formDye = 0.0;
	formSharp = 0.0;
	vec3 flowing = vec3( p.x, height, p.y );
	formPush = pushed( tt, uFront );
	formGoing = sin( 3.14159 * clamp( uFront / 1.6, 0.0, 1.0 ) );
	if ( formWeight > 0.001 ) {
		// (Between the flow and a reading the way is a curve too: it keeps low over the water for
		// the first of it and rises late, and coming back it drops early and runs in low.)
		vec3 reading = readingPoint( t );
		vec3 by = vec3( mix( flowing.xz, reading.xz, 0.5 ), mix( flowing.y, reading.y, 0.12 ) ).xzy;
		return arced( flowing, by, reading, formWeight );
	}
	return flowing;
}

void main() {
	// What cannot be seen is not worked out: a seat with no weave out; the part of a filament that
	// its weave has not yet run out to, or that has been cut away behind it; and, while all are
	// settled at their readings, the far part of the thread, which a reading does not use. (With a
	// little to spare on every side, so that a filament still thins away to nothing as it did.)
	float head_ = channelOf( channelHead, aThread.x );
	float tail_ = channelOf( channelTail, aThread.x );
	bool unseen = channelOf( channelGate, aThread.x ) <= 0.0
		|| ( uToReading > 0.5 && uFront >= 1.6 && aT > 0.71 )
		|| ( aSoft < 0.9 && aT - 0.01 >= head_ && ( tail_ >= 1.09 || aT + 0.01 <= tail_ - 0.16 ) );
	if ( unseen ) {
		gl_Position = vec4( 0.0, 0.0, 2.0, 1.0 );
		vTint = vSheath = vec3( 0.0 );
		vAlpha = vEdge = vSoft = vWhite = vShade = 0.0;
		vWide = 1.0;
		return;
	}
	mat4 viewProjection = projectionMatrix * viewMatrix;
	vec3 here = threadPoint( aT, false );
	// (atReading: this point's own share of its reading's form, which is not the same all along
	// a weave while it turns.)
	float atReading = formWeight;
	float push = formPush;
	float going = formGoing;
	// (The force of a turn shows what is near the boat, which a settled reading leaves faint.)
	float shown = max( formShown, 0.6 * push );
	vec3 found = formTint;
	float finding = formTinted * atReading;
	float fine = formFine * atReading;
	float dyed = formDye * finding;
	vec4 clip = viewProjection * vec4( here, 1.0 );
	// (Soft only where it is seen against the sky; against the sea it keeps its fine, sharp line.)
	float soften = uSoften * againstSky( here ) * ( 1.0 - formSharp * atReading );
	// They work with the waves: each crest that passes under the flow lifts its light, each trough dims it.
	// (Far more so in a storm, when the waves are what they are working on.)
	float withWaves = 1.0 + ( 0.7 + 0.3 * channelControl ) * clamp( seaUnder / max( 0.25 * channelSea.y, 0.1 ), - 1.0, 1.0 );
	vec4 clipAhead = viewProjection * vec4( threadPoint( aT + 0.002, true ), 1.0 );
	// (Lingering, each filament is broad and soft: a blur, not a line.)
	float lingering = channelPresence( aThread.x, aheadAt( aT ) ).y;
	// (By day each filament has room beside it for its shade: see the fragment shader.)
	vWide = 1.0 + 1.6 * uDay * ( 1.0 - aSoft );
	vShade = uDay;
	// (A hair of colour needs a pixel and a half to be seen at all; a hair of light does not.)
	float body = mix( 1.0, max( 1.0, 2.5 / uPixelRatio ), uDay * ( 1.0 - aSoft ) );
	// (A reading by night is drawn broad and soft, as it is against the day sky: hair-fine lines
	// spread over so much dark could not be seen at all.)
	// (Not by the boat, where a broad ribbon so close to the eye is a bar of light.)
	float nightReading = atReading * ( 1.0 - uDay ) * ( 1.0 - aSoft ) * smoothstep( 0.1, 0.45, aT / 0.7 ) * ( 1.0 - fine );
	gl_Position = ribbonPosition( clip, clipAhead, aSide, body * vWide * aThread.w * ( 1.0 + 4.0 * lingering + 3.0 * soften * ( 1.0 - aSoft ) + 3.5 * nightReading ) );

	float ahead = max( aheadAt( aT ), 0.0 );
	float q = log( ahead + 12.0 );
	// Lit only in stretches, which run outward along it.
	float lit = smoothstep( - 0.25, 0.3, drift( q * aKind.y - ( channelStream - channelBack ) * aKind.z + aSeed.x * 91.0 ) );
	// (By day, long unbroken lines: colour in short dashes looks like scratches on the sea.)
	lit = mix( lit, 1.0, 0.35 * uDay );
	// A channeller who is giving less has fewer filaments alight, and those fainter.
	float strength = channelStrength( aThread.x );
	// (By day even the least of them, at the ebb of their effort, lays a weave that can be seen:
	// colour has no faint glow to fall back on.)
	strength = mix( strength, max( strength, 0.3 * channelOf( channelGate, aThread.x ) ), uDay );
	// Spent: dimmer with distance. Gathered: brighter again, and more so the further out.
	float lost = spent( ahead );
	float held = gathered( aThread.x, q ) * ( 0.5 + 0.5 * lost );
	lit *= ( 1.0 - 0.45 * lost ) * ( 1.0 + 1.5 * held );
	// Only between the cut and where the weave has run out to (see channelShown).
	lit *= channelShown( aThread.x, aheadAt( aT ) );
	// The trial (channelLoss): light is what a weave wastes. The stronger and more skilled the
	// channeller, the less escapes: the strongest's tress is the darkest, the weakest's the palest.
	// Linked and driven, the work is great and some is lost, but it does not blaze. And where a
	// weave is cut, what was in it is let go at once: a brief flare at the cut end.
	float own_ = channelOf( channelOwn, aThread.x );
	float leak = 0.16 + 1.7 * ( 1.0 - own_ ) * ( 1.0 - own_ );
	// (By day there is no light to lose: a weave of colour is as plain linked as apart.)
	lit *= mix( 1.0, leak * ( 1.0 - 0.45 * channelSurge ), channelLoss * ( 1.0 - uDay ) );
	float cutAt = channelOf( channelTail, aThread.x );
	if ( cutAt < 1.09 ) lit *= 1.0 + 4.0 * channelLoss * exp( - pow( ( channelAlong( aheadAt( aT ) ) - cutAt ) / 0.035, 2.0 ) ) * ( 1.0 - channelOf( channelLinger, aThread.x ) );
	lit *= withWaves * strength * ( 1.0 - smoothstep( strength * 1.1 - 0.12, strength * 1.1, aSeed.y ) );
	// A veil does not come and go in stretches: it is a steady glow that breathes with the tress.
	if ( aSoft > 0.9 ) lit = strength * ( 0.75 + 0.25 * withWaves );
	// Where the four tresses have run together there are four times the filaments in one place,
	// and each is drawn fainter, or the middle of the flow would burn out to plain white.
	lit /= 1.0 + 2.8 * ( 1.0 - channelApart( ahead ) ) * ( 1.0 - channelHold ) * ( 1.0 - 0.45 * uDay );
	// Held back, the weaving does not reach for the horizon: it is spent within a few hundred metres.
	lit *= mix( 1.0, 1.0 - smoothstep( 50.0, 300.0, ahead ), channelHold );
	int element = int( aKind.w + 0.5 );
	// By day they weave akasha, air and water, for the good of the sea and the sky (the owner's):
	// each their own while they work apart, all three together in the flow when they link.
	float tendingNow = clamp( channelReading + channelHeal, 0.0, 1.0 );
	if ( uDay > 0.5 || tendingNow > 0.5 ) {
		int third = element - 3 * ( element / 3 );
		element = channelLink > 0.5 ? ( third == 0 ? 0 : third == 1 ? 1 : 4 ) : int( channelOf( uSeatElement, aThread.x ) + 0.5 );
	}
	// How far this stretch of the filament leans towards its element's colour just now.
	float leaning = 0.5 + 0.5 * drift( q * 1.1 - channelStream * 0.12 + aSeed.y * 57.0 );
	vTint = mix( uTints[ int( aThread.z + 0.5 ) ], mix( uBaseTone, uElements[ element ], 0.35 + 0.65 * leaning ), max( channelSurge, 0.85 * uDay ) );
	// Metal is half seen through.
	if ( element == ${METAL} ) lit *= 1.0 - 0.5 * channelSurge;
	// Spent, it cools towards blue; gathered, it burns white.
	vTint = mix( vTint, vec3( 0.42, 0.56, 0.9 ), 0.45 * lost * ( 1.0 - held ) );
	vTint = mix( vTint, vec3( 1.0, 0.98, 0.94 ), 0.7 * held );
	// Held back, it takes the sea's own deeper blue.
	vTint = mix( vTint, vec3( 0.46, 0.62, 0.88 ), 0.6 * channelHold );
	// By day, seen as colour and not as light, each element has a colour that holds against a
	// pale sea and sky: water the green-blue of clear shallows, air the blue of the high sky,
	// akasha a warm pearl.
	vec3 byDay = element == 4 ? vec3( 0.2, 0.74, 0.76 ) : element == 1 ? vec3( 0.42, 0.62, 1.0 ) : vec3( 1.0, 0.95, 0.85 );
	vTint = mix( vTint, mix( byDay, vTint, 0.25 + 0.3 * leaning ), uDay );
	// By night, tending, the light of each leans to its element's colour.
	// (The same colour as its sheath by day, at its fullest and then paled.)
	vec3 dye = uSheath[ element == 4 ? 1 : element == 1 ? 0 : 2 ];
	vec3 byNight = mix( vec3( 1.0 ), dye / max( max( dye.r, dye.g ), max( dye.b, 0.001 ) ), 0.62 );
	vTint = mix( vTint, byNight, 0.85 * tendingNow * ( 1.0 - uDay ) );
	// A reading takes the colour of what it finds.
	vTint = mix( vTint, found, finding );
	// (Healing, its colours are muted by 46%, the owner's figure: that far towards a grey as light as they are.)
	float muted = 0.46 * channelHeal;
	vTint = mix( vTint, vec3( dot( vTint, vec3( 0.2126, 0.7152, 0.0722 ) ) ), muted );
	// Fainter all the way down the dive, and gone before the horizon: they must not gather
	// into a light there. (It fades as it draws together into one line, from some 600 m out: when
	// it began only at a kilometre, the last kilometres of all four, drawn into one line and seen
	// edge on, made a small bright knot just over the horizon at dawn and dusk.)
	// (Driven hard there are more filaments alight at once, so each is drawn a little fainter,
	// or their colours would burn out to white where they lie thickest.)
	vAlpha = uStrength * aKind.x * ( 1.0 - 0.4 * channelSurge ) * lit * ( 0.55 + 1.1 * channelPulse( aThread.x, ahead ) ) * smoothstep( 0.0, 0.05, aT )
		* ( 1.0 - smoothstep( 0.5, 0.88, channelWay( ahead ) ) * ( 1.0 - 0.8 * lingering ) ) / ( 1.0 + ahead / 1500.0 ) / ( 1.0 + 2.0 * lingering ) / ( 1.0 + 1.6 * soften );
	vEdge = aSide;
	vSoft = max( aSoft, max( lingering, max( 0.9 * soften, 0.85 * nightReading ) ) );
	// The strongest's own weaves show white against anything. By day they are not thinned away
	// with the rest, or there would be nothing to turn the sky white with.
	vWhite = aThread.x > ${STRONGEST - 0.5} && aThread.x < ${STRONGEST + 0.5} ? 1.0 : 0.0;
	vSheath = mix( element == 4 ? uSheath[ 1 ] : element == 1 ? uSheath[ 0 ] : uSheath[ 2 ], uSheath[ 3 ], vWhite );
	vSheath = mix( vSheath, vec3( dot( vSheath, vec3( 0.2126, 0.7152, 0.0722 ) ) ), muted );
	// (Each element of a water reading has its own colour beside it by day, deeper than its light.)
	vSheath = mix( vSheath, found * found * 0.75, dyed * ( 1.0 - vWhite ) );
	vAlpha *= mix( 1.0, 1.0 + 0.7 * soften, vWhite * ( 1.0 - aSoft ) );
	// By day the others' weaves are colour, not light, and colour needs more of itself to be seen.
	vAlpha *= mix( 1.0, ${DAY_BODY}, uDay * ( 1.0 - vWhite ) );
	// By day it is gone well before the horizon: pale colour gathering there shows as glints.
	vAlpha *= 1.0 - uDay * ( 1.0 - atReading ) * smoothstep( 0.3, 0.7, channelWay( ahead ) );
	// At a reading, only as much of the filament as the reading's form has.
	vAlpha *= mix( 1.0, shown * ( 1.0 - smoothstep( 0.66, 0.7, aT ) ), atReading );
	// (And up against the day sky a reading is given more of itself: spread thin over all that
	// air it was hardly there.)
	vAlpha *= 1.0 + 1.2 * atReading * soften * uDay;
	// (By night too: its filaments are spread over far more dark than a tress's are.)
	vAlpha = min( vAlpha * ( 1.0 + 7.0 * atReading * ( 1.0 - uDay ) ), mix( 4.0, 0.5, atReading * ( 1.0 - uDay ) ) );
	// Turning, they put more into it: most by the boat, where the turning is done, and along the
	// bend as it runs out.
	vAlpha *= 1.0 + 1.1 * push * ( 0.3 + 0.7 * uDay );
	// (By night a weave in mid-turn has its filaments lying on one another, and light on light
	// adds up to a glare: so each is drawn much fainter while the turn lasts.)
	vAlpha *= 1.0 - 0.65 * ( 1.0 - uDay ) * going;
	// (By night, never more than a soft glow, however the turn is pressed.)
	vAlpha = min( vAlpha, mix( 4.0, mix( 0.95, 0.75, atReading ), ( 1.0 - uDay ) * clamp( channelReading + channelHeal, 0.0, 1.0 ) ) );
	// (By night the healing flow is given more light: as colour and not white it carries less.)
	vAlpha *= 1.0 + 1.4 * channelHeal * ( 1.0 - uDay );
	// Healing, it is gone where it has sunk.
	vAlpha *= 1.0 - channelHeal * smoothstep( 130.0, 240.0, ahead );
	// (In a storm by day the linked flow is thrown wide over the waves; as colour it is far too much.)
	vAlpha *= 1.0 - 0.65 * uDay * channelControl;
	// (And at any hour, so much of it lying on itself burnt out to a white sheet over the sea, the
	// strongest's most of all: a storm is met with strength, which is not brightness.)
	vAlpha /= 1.0 + ( 1.5 + 2.0 * vWhite ) * channelControl;
	// (Thrown widest far out, it was pressed into a bright band along the horizon: it thins away
	// before that, over the nearer waves, which are the ones being worked.)
	vAlpha *= 1.0 - channelControl * smoothstep( 0.3, 0.65, channelWay( ahead ) );
	// (Not the veils: a broad veil of colour lies on the day sea as a stain.)
	vAlpha *= 1.0 - 0.8 * uDay * step( 0.9, aSoft );
}
`;

// The elements' colours (the owner, 12 October: the elements had lost all distinction, and
// agreed to try this). By day it is the sheath beside each thread that is seen, so the element is
// put there: air a violet-blue, water a sea green, akasha a warm bronze-gold. The
// strongest's alone is white, edged in the deep blue of the site's own bar. By night, as light,
// each leans to a paler colour of the same family.
// (Air is not the sky's own blue, which cannot be seen against the sky: it leans to violet.)
// (They are uniforms, uSheath, in this order, so that the owner can change them on the page:
// /?colours shows a strip of four swatches, and the choice is kept in the address.)
export const ELEMENT_COLOURS = { air: "#9e7bf3", water: "#00b0a2", akasha: "#e0b065", strongest: "#0050cb" };
export type ElementColours = typeof ELEMENT_COLOURS;

// By day: how much more of itself a weave of colour needs than one of light, how deep that
// colour is against white, and how strong the shade beside each filament.
const DAY_BODY = "1.8";
const DAY_TONE = "0.6";
const DAY_SHADE = "1.6";

const fragmentShader = /* glsl */ `
uniform float uGain;
uniform float uSoften;
uniform float uWhite;
uniform float uDay;
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;
varying float vSoft;
varying float vWhite;
varying float vWide;
varying float vShade;
varying vec3 vSheath;

void main() {
	// A filament has a hard edge, softened by no more than it takes to stop it shimmering.
	// A veil has none: it is brightest along its middle and fades away to both sides.
	// (The filament itself is the middle of its ribbon; by day the ribbon is wider than it.)
	float across = abs( vEdge ) * vWide;
	float edge = mix( 1.0 - smoothstep( 0.55, 1.0, across ), pow( max( 1.0 - across * across, 0.0 ), 2.0 ), vSoft );
	float amount = clamp( edge * vAlpha, 0.0, 1.0 );
	gl_FragColor = vec4( vTint * uGain, 1.0 );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	// A weave is light, and is added to what is behind it; so against a bright sky it cannot be
	// seen. The strongest's own weaves are another matter (the owner's): they always become
	// white, or a coloured white, against any other colour. So they are not added: they turn
	// what is behind them towards white, which shows on a day sky as it does on a night sea.
	// (The colour in it is only for the dark. Against a light sky any colour at all would read as
	// grey, darker than what is behind it; there it is plain white.)
	vec3 pale = mix( vec3( 1.0 ), vTint / max( max( vTint.r, vTint.g ), max( vTint.b, 0.001 ) ), 0.18 * ( 1.0 - uSoften ) );
	// (What is written here is still scene light, mapped to the screen afterwards with the day's or
	// night's exposure; uWhite is the amount of light that comes out as white under it.)
	// By day nobody's weaving can be seen as light: the sun's drowns it. So by day the others'
	// weaves are seen as colour laid on what is behind them: their element's own, pale as silk,
	// never quite white (white is the strongest's alone). On the sea they lie over water their
	// own work has cleared and deepened (channelBalm in gerstner-waves.ts), and show against that.
	vec3 hue = vTint / max( max( vTint.r, vTint.g ), max( vTint.b, 0.001 ) );
	// (The thread itself is a pale tint of its element's colour, leaning to whatever it has found:
	// where many lie together, as in the healing flow, there is no room for sheaths, and the
	// threads must carry the colour themselves.)
	vec3 body = mix( mix( mix( vec3( 1.0 ), vSheath, 0.42 ), hue * hue, 0.4 ) * 0.96, pale, vWhite ) * uWhite;
	float solid = max( vWhite, uDay );
	vec3 colour = mix( gl_FragColor.rgb, body, solid ) * amount;
	float cover = amount * solid;
	// Pale on pale is nothing (the owner: "white on white is ugly"), and the day sea and sky are
	// both pale. So by day every filament is two things: its pale thread, and close on both sides
	// of it a sheath of deeper colour, its element's. It is the sheath that is seen against the
	// sky and the glare, and the thread against deep water.
	float beside = pow( max( 1.0 - vEdge * vEdge, 0.0 ), mix( 0.6, 1.5, vSoft ) );
	float shade = vShade * clamp( ${DAY_SHADE} * vAlpha, 0.0, 0.85 ) * beside * ( 1.0 - cover );
	vec3 deep = vSheath;
	colour += deep * uWhite * shade;
	cover += shade;
	gl_FragColor = vec4( colour, cover );
}
`;

// What happens when the page opens on one of their nights (the owner's story). They are
// channelling as the page opens. After a few seconds it stops, for 4 to 9 seconds. Then the
// strongest of them begins again alone, and for 20 to 25 seconds they work; then it stops, and
// the sea stays dark.
// How they work in that time depends on what the sea and wind call for (`need`, from the weather
// data), because force that is not needed is not used, and neither is linking:
//   little         the strongest works alone, lightly
//   some           one or two of the others work beside the strongest, each for themselves
//   a good deal    all four work, still each for themselves
//   much           the others link with the strongest one by one within 2 to 5 seconds, and linked they
//                  drive the flow hard along the surface of the sea in all the elements' colours
const between = (low: number, high: number) => low + Math.random() * (high - low);
const STRONGEST = 2;
// The order the others come in, as more is called for: by their strength.
const ORDER = [STRONGEST, 1, 0, 3];
// How many of them work, and whether they link, for a given need.
const workingFor = (need: number) => (need < 0.2 ? 1 : need < 0.4 ? 2 : need < 0.6 ? 3 : 4);
const LINK_FROM = 0.6;

// The scout weave (the owner's). On a quiet night one of the four, the one at the far right, who
// is not needed for the work on the sea, channels away from the others: up into the night, to
// sense the winds for tomorrow. This one is a master weaver, who knows how to make a weaving
// disperse and regather. The weave works in an order: it goes out low on the water first, using
// the surface current; then lifts up into the air; finds the air's current and leans with it;
// and only then disperses, in a few companies that keep together, each hunting its own quarter of
// the night; then they are drawn back in; and so on, like slow breathing. (Two earlier versions
// were turned down by the owner: one line going to one place was too specific, and forty
// filaments each going its own way from the hand were too individual and skipped the water.)
// The air it moves through is treated as air: heated from below by a warmer sea it rises in
// thermals, and the weave winds up them in a widening spiral, quivering, and fans out level at
// their top; over a colder sea the air lies in still layers, and the weave keeps to the water
// longer, gets less high, lies flat and slides out along the layers; and the wind it leans with
// strengthens with height as wind over water does. All from the real temperatures and wind.
// They thin away to nothing at their far ends: nothing may make a light in the sky. What they
// work with is real: the current and wind as they are now, and, once dispersed, they are carried
// the way tomorrow's forecast wind will blow. What they learn comes back down them: the light in
// them travels downward, towards the boat.
//
// October (the owner's): it is the sky-scanning weave, and it is not one channeller's. Two to
// five of them, of varying strengths, send it up, each their own tress from their own place at
// the rail; the tresses run together on the water and go up as one. A stronger one's tress has
// more filaments in it. How many take part is a matter of how differently the sky's layers are
// blowing: the more there is to scan, the more of them. And the flows it parts into are the real
// air: five of them, one bound for each of five heights (the sea, and about 750 m, 1.5 km, 3 km
// and 5.5 km up). Each literally follows the airflow (the owner's: "literally allow it to follow
// airflow but remember the rules of thermodynamics"). It is carried as air let go there would
// be: as it climbs it passes through each layer below its own and is taken along by that
// layer's wind for as long as it is in it, so where the wind turns with height the flow curves;
// arrived, it runs level downwind. How far it is carried is the wind's speed in true proportion.
// How fast it can climb through a layer is that layer's doing: through air that cools quickly
// with height it rises freely and steeply; through air that cools slowly it rises slowly and is
// carried far sideways meanwhile; and under an inversion it is held down and spreads out
// beneath it, as smoke does under a lid, and may never reach its height. Nothing in it runs to
// a clock any more: the flows are drawn in while a gust blows and let out as it passes, and
// waver only as much as the air is gusty. (Tomorrow's wind no longer bends them: only today's
// air does.)
const SCOUT_FILAMENTS = 50;
const SCOUT_SENDERS = 5;
const SCOUT_VEILS = 3;
const SCOUT_SEGMENTS = 220;

const scoutVertexShader = /* glsl */ `
attribute float aT;
attribute float aSide;
// Two random numbers, how far from the middle of the tress it lies (0..1), and how loosely it is held.
attribute vec4 aSeed;
// Brightness, how many lit stretches it has along its length, how fast they travel, width in pixels.
attribute vec4 aKind;
attribute float aSoft;
// A random number, 0..1: whose tress it is in (see uShare).
attribute float aWho;
uniform float uTime;
uniform float uStrength;
// Those sending it up, the strongest of them first. For each: where along the boat's rail they
// stand (metres right of the middle), their strength as drawn (0..1), and how far behind the
// first of them they begin. And where in 0..1 each one's share of the filaments begins (2 for
// one who is not taking part): a stronger one has the larger share.
uniform vec3 uSender[ ${SCOUT_SENDERS} ];
uniform float uShare[ ${SCOUT_SENDERS} ];
// The wind now at five heights, lowest first: x how much it blows to the right across the view,
// y how much away from the viewer, both scaled by its speed (1 at 80 km/h). And how long air
// takes to rise through each of the four layers between them, against an ordinary sky's 1.
uniform vec2 uAloft[ 5 ];
uniform float uSlow[ 4 ];
// 0..1 how far the flows are let out into those winds (they are drawn in while a gust blows).
uniform float uSpread;
// How far it has run up from the boat; how far the cut has travelled up it once let go (past
// the end when there is none); and 0..1 how far a weave let go has faded.
uniform float uHead;
uniform float uTail;
uniform float uFade;
// How light the sky is (see uSoften in the main weaving).
uniform float uSoften;
uniform float uDay;
varying float vWide;
varying float vShade;
varying vec3 vSheath;
uniform vec3 uSheath[ 4 ];
// 1 when it is the strongest's own weave.
uniform float uOwn;
// The real surface current across the view, and the real wind across it now (both -1..1, to
// the right when positive): see channel-path.ts.
uniform float channelCurrent;
uniform vec2 channelWind;
// The heat between sea and air, -1..1, from their real temperatures. Above 0 the sea is warmer
// than the air: the air is heated from below, turns over, and rises in thermals. Below 0 the air
// is warmer than the sea: it lies still in layers, and what is in it stays low.
uniform float uThermal;
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;
varying float vSoft;
varying float vWhite;
${ribbonShaderChunk}

float drift( float x ) {
	float i = floor( x );
	float f = fract( x );
	return mix( hash1( i ), hash1( i + 1.0 ), f * f * ( 3.0 - 2.0 * f ) ) * 2.0 - 1.0;
}

// The filaments go in companies, not one by one: five loose tresses of them, one to each of
// the five heights the wind is known at, the lowest first.
float scoutCompany() {
	return floor( aSeed.x * 5.0 );
}

// Whose tress this filament is in.
vec3 scoutSender() {
	vec3 mine = uSender[ 0 ];
	for ( int i = 1; i < ${SCOUT_SENDERS}; i++ ) {
		if ( aWho >= uShare[ i ] ) mine = uSender[ i ];
	}
	return mine;
}

// The wind at a height: 0 at the sea, 4 at the highest of the five, and between them as it
// changes from one to the next.
vec2 scoutWind( float level ) {
	vec2 blows = uAloft[ 0 ];
	for ( int i = 1; i < 5; i++ ) {
		blows = mix( blows, uAloft[ i ], clamp( level - float( i - 1 ), 0.0, 1.0 ) );
	}
	return blows;
}

// How high air let go at the top of the stem has climbed after a time (0..1 of the flow's
// length), bound for the height top: layer by layer, each taking as long as it takes.
float scoutLevel( float time, float top ) {
	float left = time / 0.18;
	float level = 0.0;
	for ( int i = 0; i < 4; i++ ) {
		float room = clamp( top - float( i ), 0.0, 1.0 );
		float climbed = min( left / uSlow[ i ], room );
		level += climbed;
		left -= climbed * uSlow[ i ];
	}
	return level;
}

// 0..1 how far this filament's company is let out just now. The lowest is let out first and
// drawn in last; the highest, in the hardest wind, is the first to be drawn in.
float scoutSpread() {
	if ( aSoft > 0.9 ) return 0.0;
	float turn = scoutCompany() / 4.0;
	return smoothstep( turn * 0.4, turn * 0.4 + 0.5, uSpread );
}

// How far up into the air a point along the weave is, 0 while it is still on the water.
float scoutRise( float t ) {
	// (It comes up off the water in a curve, not at a corner. Over a cold sea, in still layered
	// air, it keeps to the water for longer before it can get up at all.)
	float leaves = 0.22 + 0.16 * max( - uThermal, 0.0 );
	float up = max( t - leaves, 0.0 ) / ( 1.0 - leaves );
	return up * up * ( 1.6 - 0.6 * up );
}

// The whole weave as one, before any of it disperses. It works in an order (the owner's):
//   on the water   it goes out low over the sea first, and lets the surface current carry and
//                  bend it, as the real current there runs;
//   up             then it lifts off the water, steeply;
//   in the air     and as it climbs it finds the air's own current, and leans away downwind,
//                  as the real wind blows now.
vec3 scoutStem( float t ) {
	float rise = scoutRise( t );
	float out_ = 4.0 + 90.0 * smoothstep( 0.0, 0.34, t ) + 230.0 * rise;
	float onWater = smoothstep( 0.0, 0.34, t );
	// (Each tress leaves the rail where its sender stands; they run together over the water.)
	vec3 p = vec3( scoutSender().x * ( 1.0 - smoothstep( 0.02, 0.3, t ) ), mix( cameraPosition.y - 1.2, 1.4, smoothstep( 0.0, 0.07, t ) ), - out_ );
	// Carried by the current, and meandering as water does.
	p.x += channelCurrent * 55.0 * onWater * onWater + 3.5 * onWater * sin( out_ * 0.07 - uTime * 0.3 );
	// Up off the sea.
	// How high it gets is the air's doing. A thermal carries it up, half as high again; still
	// layered air holds it down to less than half.
	float warm = max( uThermal, 0.0 );
	float still = max( - uThermal, 0.0 );
	p.y += 82.0 * rise * ( 1.0 + 0.5 * warm ) * ( 1.0 - 0.6 * still );
	// In a thermal it does not go straight up. Rising air turns as it goes and draws in the air
	// round it, so the column widens with height: the weave winds up it in an opening spiral.
	float turn = rise * 8.0 - uTime * 0.35;
	p.xz += warm * ( 1.5 + 16.0 * rise ) * rise * vec2( cos( turn ), sin( turn ) );
	// Leaning downwind, more the higher it is.
	// The wind is slowed by the sea and freer above it: it strengthens quickly in the first of
	// the climb and more slowly after (the logarithmic profile of wind over water). So the lean
	// comes on early and then steadies. In still layered air the layers slide over one another
	// and the difference is greater.
	float shear = log( 1.0 + 9.0 * rise ) / log( 10.0 );
	p.x += channelWind.x * 80.0 * shear * ( 1.0 + 0.6 * still ) + 6.0 * rise * sin( uTime * 0.23 + rise * 3.0 );
	return p;
}

vec3 scoutPoint( float t ) {
	vec3 p = scoutStem( t );
	// Within the weave the filaments lie close, as in any tress, a little looser with height.
	float wind = aSeed.x * 41.0 + t * ( 5.0 + 4.0 * aSeed.y ) - uTime * 0.12;
	float warm = max( uThermal, 0.0 );
	float still = max( - uThermal, 0.0 );
	// (Wider in a thermal, which mixes it; and flattened into a ribbon in still air.)
	p.xy += aSeed.z * vec2( cos( wind ), ( 0.5 - 0.35 * still ) * sin( wind ) ) * ( 0.3 + 2.2 * smoothstep( 0.0, 0.2, t ) + 9.0 * ( 1.0 + 1.2 * warm ) * scoutRise( t ) * scoutRise( t ) );
	// Heated air shimmers: in a thermal the filaments waver, finer than their wandering. (Smoothly:
	// a quiver with corners in it read as lightning, which no weave of theirs is.)
	p.xy += warm * scoutRise( t ) * 1.2 * vec2( drift( t * 17.0 + aSeed.x * 97.0 - uTime * 1.1 ), drift( t * 19.0 + aSeed.y * 89.0 + uTime * 0.9 ) );
	p.y = max( p.y, 0.5 );
	// Only then, having found the air's current, does it part: each company goes to its own
	// height and streams the way the wind really blows there now, the further the harder it blows.
	float from = 0.3;
	float gone = max( scoutRise( t ) - from, 0.0 ) / ( 1.0 - from );
	if ( gone > 0.0 ) {
		float company = scoutCompany();
		// Each filament a little off its company's line; and in gusty air the whole flow wavers
		// (in a steady wind it lies still).
		float off = ( aSeed.y - 0.5 ) * 0.2 + 0.3 * channelWind.y * drift( uTime * 0.06 + company * 7.3 + gone * 2.0 );
		// Where the air has carried it by now: the wind it has been in, added up over the time
		// since it left the stem, at whatever height it had reached at each moment.
		vec2 wind = vec2( 0.0 );
		for ( int i = 0; i < 8; i++ ) {
			wind += scoutWind( scoutLevel( gone * ( float( i ) + 0.5 ) / 8.0, company ) ) * gone / 8.0;
		}
		vec2 blows = vec2( wind.x * cos( off ) - wind.y * sin( off ), wind.x * sin( off ) + wind.y * cos( off ) );
		// And how high it has got. (Over a sea much warmer or colder than the air the lowest air
		// is in thermals or in still layers: see uThermal. Rising air stops where it is no longer
		// warmer than what is round it, and there it can only spread sideways.)
		float lift = ( 30.0 * gone + 38.0 * scoutLevel( gone, company ) + ( fract( aSeed.x * 5.0 ) - 0.5 ) * 30.0 * gone ) * ( 1.0 - 0.75 * max( warm, still ) );
		vec3 own = scoutStem( 0.62 ) + vec3( blows.x * 650.0, lift, - blows.y * 650.0 );
		p = mix( p, own, scoutSpread() * smoothstep( 0.0, 0.25, gone ) );
	}
	return vec3( cameraPosition.x, 0.0, cameraPosition.z ) + p;
}

void main() {
	mat4 viewProjection = projectionMatrix * viewMatrix;
	vec3 here = scoutPoint( aT );
	vec4 clip = viewProjection * vec4( here, 1.0 );
	// (Soft only where it is seen against the sky; against the sea it keeps its fine, sharp line.)
	float soften = uSoften * againstSky( here );
	vec4 clipAhead = viewProjection * vec4( scoutPoint( aT + 0.004 ), 1.0 );
	// Let go, it lingers soft and broad like any weave cut loose.
	float loose = uTail < 1.09 ? smoothstep( uTail - 0.2, uTail, aT ) : 0.0;
	// (Each sender's tress runs out when they begin: the eager first, the slow after.)
	vec3 sender = scoutSender();
	float head = uHead - sender.z;
	float inHand = 1.0 - smoothstep( head - 0.05, head, aT );
	float lingering = loose * uFade * ( 1.0 - inHand );
	vWide = 1.0 + 1.6 * uDay * ( 1.0 - aSoft );
	vShade = uDay;
	gl_Position = ribbonPosition( clip, clipAhead, aSide, vWide * aKind.w * ( 1.0 + 3.0 * lingering + 3.0 * soften * ( 1.0 - aSoft ) ) );

	// The light in it runs downward: what is sensed comes back to the one who sent it.
	float lit = smoothstep( - 0.2, 0.35, drift( aT * aKind.y + uTime * aKind.z + aSeed.x * 91.0 ) );
	if ( aSoft > 0.9 ) lit = 0.8;
	float there = max( inHand, loose * pow( 1.0 - uFade, 1.5 ) );
	// Pale, and bluer and fainter the higher it goes; gone before its top.
	vTint = mix( vec3( 0.84, 0.9, 1.0 ), vec3( 0.52, 0.66, 0.96 ), aT );
	// Each is faint, a thread in the dark. Gathered, fifty lie on one line, so each is drawn fainter
	// still, or the stem would stand in the sky as a bar of light. (A weaker one's are a little
	// fainter again; mostly their tress is simply the thinner.)
	vAlpha = uStrength * mix( 0.7, 1.0, sender.y ) * aKind.x * lit * there * mix( 0.13, 0.6, scoutSpread() * smoothstep( 0.3, 0.6, scoutRise( aT ) ) ) * smoothstep( 0.0, 0.06, aT ) * ( 1.0 - smoothstep( 0.62, 0.98, aT ) ) / ( 1.0 + 1.5 * lingering ) / ( 1.0 + 1.6 * soften );
	vEdge = aSide;
	vSoft = max( aSoft, max( lingering, 0.9 * soften ) );
	// The strongest's own weaves show white against anything. By day they are not thinned away
	// with the rest, or there would be nothing to turn the sky white with. (Only the strongest's
	// own tress in it, which is the first: the others' beside it keep the air's colour.)
	vWhite = uOwn * step( aWho, uShare[ 1 ] );
	vSheath = mix( uSheath[ 0 ], uSheath[ 3 ], vWhite );
	vAlpha *= mix( 1.0, 1.0 + 0.7 * soften, vWhite * ( 1.0 - aSoft ) );
	// (Seeking into the day sky it is hardly there: nothing of theirs may hang bright in the sky.)
	vAlpha *= 1.0 - 0.55 * uDay * ( 1.0 - vWhite );
}
`;

// Soundings (the owner's). Every now and then three or four of the channellers feel the water:
// its temperature and its currents. Each sends a tress of fine filaments, plaited in three, out
// low over the sea ahead, and slips under the surface to feel. None of it is drawn to a pattern,
// and no two do it alike:
//   each begins when they are ready, reaches as far as they can, holds as long as they need,
//                  and lets go in their own time;
//   together       at times their tresses are laid in one and wound round each other on the way
//                  out, but under water they part, each to feel its own quarter;
//   the line      one long easy curve out, to its own side and with the current: never a loop
//                  (the owner, 14 October: out under the water and back again, the soundings
//                  stood on the sea as hoops; they are to be "beautiful and elegant and natural").
//   on the water   it rides the long swell, low over the short waves, which pass under it. It
//                  does not climb and dive: seen from so low, any line that runs out and then
//                  visibly dips draws a hoop standing on the sea.
//   in the water   it is lost to sight as it nears the water and slips under, out where it will;
//                  never seen going down, and never shallow enough for a trough to uncover. In
//                  water warmer than the air the plait slackens and shimmers; in colder it draws
//                  tight and lies lower.
//   coming back    nothing comes back as a second strand: what was felt runs home along it as
//                  light, towards the hands, and its colour leans a little to the water's warmth
//                  or cold.
// It is a light touch and is drawn as one: faint threads, nothing near the bow.
const SOUNDERS = 4;
const SOUNDING_FILAMENTS = 15;
const SOUNDING_SEGMENTS = 220;

const soundingVertexShader = (trains: number) => /* glsl */ `
attribute float aT;
attribute float aSide;
// Which sounder (0..3), which strand of the plait (0..2), a random number, width in pixels.
attribute vec4 aBraid;
// Brightness, how many lit stretches along its length, how fast they travel, and how far off its
// strand's line it lies (-1..1).
attribute vec4 aKind;
uniform float uTime;
uniform float uStrength;
// For each sounder: how far their tress has run out, and how far the cut has followed
// once they let go (past the end when there is none).
uniform vec4 uHead;
uniform vec4 uTail;
// How far out each one's tress goes, in metres: the stronger and the more water-minded, the further.
uniform vec4 uReach;
uniform float uSoften;
uniform float uDay;
varying float vWide;
varying float vShade;
varying vec3 vSheath;
uniform vec3 uSheath[ 4 ];
// 1 when the strongest is sounding alone: that tress is their own weave.
uniform float uOwn;
// 0..1 how far they are doing it together just now.
uniform float uTogether;
uniform float uThermal;
uniform float channelCurrent;
// The sea, to ride on it.
uniform vec4 waves[ ${trains} ];
uniform vec4 waveForm[ ${trains} ];
uniform float waveFade[ ${trains} ];
uniform float waveSteepness;
uniform float waveTime;
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;
varying float vSoft;
varying float vWhite;
${ribbonShaderChunk}
${seaPartsChunk(trains)}

float drift( float x ) {
	float i = floor( x );
	float f = fract( x );
	return mix( hash1( i ), hash1( i + 1.0 ), f * f * ( 3.0 - 2.0 * f ) ) * 2.0 - 1.0;
}

float ofSounder( vec4 each, float who ) {
	return who < 0.5 ? each.x : who < 1.5 ? each.y : who < 2.5 ? each.z : each.w;
}

// 0..1 how far a point along the tress has gone into the sea. Each goes in where it will.
float soundingUnder( float t, float who ) {
	float enters = 0.72 + 0.14 * hash1( who * 3.7 + 1.0 );
	return smoothstep( enters - 0.16, enters + 0.12, t );
}

// Where the line of one sounder's tress lies, relative to the boat (y: height above the sea's
// mean level).
vec3 soundingStem( float t, float who ) {
	float under = soundingUnder( t, who );
	float warm = max( uThermal, 0.0 );
	float still = max( - uThermal, 0.0 );
	// Together near the boat; further out each feels its own quarter.
	float held = uTogether * ( 1.0 - 0.8 * smoothstep( 0.25, 0.75, t ) );
	float own = ( who - 1.5 ) * 0.36 + 0.14 * drift( uTime * 0.04 + who * 7.1 );
	float bearing = mix( own, 0.1 * drift( uTime * 0.03 ), held );
	float reach = mix( ofSounder( uReach, who ), 50.0, uTogether * 0.6 );
	vec2 out_ = vec2( sin( bearing ), - cos( bearing ) );
	vec2 across = vec2( - out_.y, out_.x );
	// One long easy curve: out the way it is sent, and round to its own side and with the current.
	// (Each to their own side of the boat, the left ones left: they open like a fan and no two cross.)
	float aside = reach * ( 0.3 + 0.15 * hash1( who * 2.3 ) ) * ( who < 1.5 ? - 1.0 : 1.0 ) + channelCurrent * 16.0;
	vec2 hands = vec2( ( who - 1.5 ) * 1.5, 0.0 );
	vec2 bend = hands + out_ * reach * 0.55;
	vec2 level = mix( mix( hands, bend, t ), mix( bend, hands + out_ * reach + across * aside, t ), t );
	// Together, the tresses wind round one another.
	float wind = t * 14.0 - uTime * 0.2 + who * 1.5708;
	vec2 wound = vec2( cos( wind ), sin( wind ) ) * 0.55 * held * smoothstep( 0.0, 0.2, t );
	level += across * wound.x;
	// Riding the long swell, low over the short waves: clear of them near the boat, nearer them
	// as it goes. Warm water lifts it; cold lets it lie lower.
	vec2 sea = seaParts( vec2( cameraPosition.x, cameraPosition.z - 2.0 ) + level );
	float clear = mix( 1.0, 0.45, smoothstep( 0.1, 0.5, t ) ) * ( 1.0 + 0.3 * warm - 0.3 * still ) + 0.25 * wound.y;
	// And into the water, gently and out of sight (see soundingLost).
	float y = sea.y + mix( clear, - 1.2 - 0.6 * still, under );
	// It leaves from hands held a little below the eye, and comes down to the water slowly and
	// in one easy curve: brought down quickly, so near the eye, it drew a hook.
	y = mix( cameraPosition.y - 1.2, y, smoothstep( 0.0, 0.4, t ) );
	return vec3( level.x, y, level.y );
}

// 0..1 how far a point is lost to sight: going into the water it fades before it gets there, so
// that it is never seen going down.
float soundingLost( float t, float who ) {
	return smoothstep( 0.0, 0.3, soundingUnder( t, who ) );
}

vec3 soundingPoint( float t ) {
	float who = aBraid.x;
	vec3 p = soundingStem( t, who );
	vec2 way = soundingStem( t + 0.01, who ).xz - p.xz;
	way = normalize( way + vec2( 1e-4, 0.0 ) );
	vec2 across = vec2( - way.y, way.x );
	float under = soundingUnder( t, who );
	float warm = max( uThermal, 0.0 );
	float still = max( - uThermal, 0.0 );
	float ends = smoothstep( 0.0, 0.1, t ) * smoothstep( 1.0, 0.9, t );
	// Three strands passing over and under: a plait. Close in the air. In the water it slackens,
	// more in warm water, which mixes it; cold water draws it tight.
	float slack = 1.0 + under * ( 0.8 + 1.6 * warm - 0.5 * still );
	// (A long, slow plait: wound tight and often it looked like a scribble on the sea.)
	float phase = t * 16.0 - uTime * 0.25 + aBraid.y * 2.0944;
	vec2 off = vec2( sin( phase ), 0.5 * sin( 2.0 * phase ) ) * 0.2 * slack;
	// Each filament a little off its strand's line, and looser under water.
	float turn = aBraid.z * 41.0 + t * ( 6.0 + 5.0 * aBraid.z ) - uTime * 0.15;
	off += aKind.w * vec2( cos( turn ), sin( turn ) ) * ( 0.07 + 0.4 * under * ( 0.6 + warm ) );
	// Warm water shimmers.
	off += warm * under * 0.12 * vec2( drift( t * 20.0 + aBraid.z * 97.0 - uTime * 0.9 ), drift( t * 23.0 + aBraid.z * 89.0 + uTime * 0.8 ) );
	off *= ends;
	p.xz += across * off.x;
	p.y += off.y;
	return vec3( cameraPosition.x + p.x, p.y, cameraPosition.z - 2.0 + p.z );
}

void main() {
	mat4 viewProjection = projectionMatrix * viewMatrix;
	vec3 here = soundingPoint( aT );
	vec4 clip = viewProjection * vec4( here, 1.0 );
	// (Soft only where it is seen against the sky; against the sea it keeps its fine, sharp line.)
	float soften = uSoften * againstSky( here );
	vec4 clipAhead = viewProjection * vec4( soundingPoint( aT + 0.004 ), 1.0 );
	float who = aBraid.x;
	float head = ofSounder( uHead, who );
	float tail = ofSounder( uTail, who );
	float inHand = 1.0 - smoothstep( head - 0.06, head, aT );
	// Let go at the hands, the cut follows round; what is just ahead of it goes soft and broad.
	float cut = tail < 1.5 ? 1.0 : 0.0;
	float kept = mix( 1.0, smoothstep( tail - 0.1, tail + 0.02, aT ), cut );
	float loose = cut * ( 1.0 - smoothstep( tail, tail + 0.3, aT ) );
	vWide = 1.0 + 1.6 * uDay;
	vShade = uDay;
	gl_Position = ribbonPosition( clip, clipAhead, aSide, mix( 1.0, max( 1.0, 2.5 / uPixelRatio ), uDay ) * vWide * aBraid.w * ( 1.0 + 2.5 * loose + 3.0 * soften ) );
	// What is felt runs along it towards the hands.
	float lit = smoothstep( - 0.25, 0.4, drift( aT * aKind.y + uTime * aKind.z + aBraid.z * 91.0 ) );
	// Going out it is the pale of any weave. Coming back it leans to the water's warmth or cold.
	vec3 pale = vec3( 0.8, 0.88, 1.0 );
	vec3 felt = uThermal > 0.0 ? mix( pale, vec3( 1.0, 0.82, 0.64 ), 0.6 * uThermal ) : mix( pale, vec3( 0.5, 0.72, 1.0 ), - 0.6 * uThermal );
	vTint = mix( pale, felt, smoothstep( 0.3, 0.65, aT ) );
	// Seen from the hands, as every weave begins at the boat, until it goes in.
	float away = smoothstep( 0.0, 0.06, aT ) * ( 1.0 - soundingLost( aT, who ) );
	vAlpha = uStrength * aKind.x * lit * inHand * kept * away / ( 1.0 + 1.5 * loose ) / ( 1.0 + 1.6 * soften );
	vEdge = aSide;
	vSoft = max( loose, 0.9 * soften );
	// The strongest's own weaves show white against anything. By day they are not thinned away
	// with the rest, or there would be nothing to turn the sky white with.
	vWhite = uOwn * step( ${STRONGEST - 0.5}, who ) * step( who, ${STRONGEST + 0.5} );
	vSheath = mix( uSheath[ 1 ], uSheath[ 3 ], vWhite );
	vAlpha *= mix( 1.0, 1.0 + 0.7 * soften, vWhite );
	// (A sounding is a light touch, by day as by night.)
	vAlpha *= 1.0 - 0.7 * uDay;
}
`;

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
	// The scout: 0..1 whether one of them is up sensing tomorrow's wind, and that wind as it
	// will blow across the view (right when positive) and along it (away when positive), each
	// scaled by how strong it will be (0..1).
	scout: number;
	// For looking at the strongest's deep weaving without waiting for it.
	showMasters?: boolean;
	// The same for the soundings.
	showSoundings?: boolean;
	// Each channeller's own hand, from their temperament (?hands in the address): see \`hand\`.
	hands?: boolean;
	// And for one kind of reading (?show=pressure, wind or water), or the healing (?show=healing):
	// all four at the front do that, and nothing else.
	showOnly?: string;
	// 0..1 how far it is dawn or dusk. Then all thirteen link (the owner's): it is when there is
	// most qi in the air for them to draw upon. Nobody is below, sounding or scouting: all are in it.
	gathering: number;
	// 0..1 how light the sky is (see uSoften).
	soften: number;
	// 0..1 how far they are tending the sea and the air, each in their own way, linking every so
	// often (see `tend`): at every hour but dawn and dusk.
	tending: number;
	// 0..1 how far it is day: then their weaving is seen as colour, not as light.
	day: number;
	// What is really there for them to read: the pressure's trend (-1 falling fast .. 1 rising
	// fast), and the wind as it crosses the view (to the right, away, and its force 0..1).
	pressure: number;
	wind: { across: number; away: number; force: number; gusty: number; gust: number };
	// The height of the sea under the boat just now, in metres, and where the swell comes from,
	// in radians right of straight ahead.
	heave: number;
	swellFrom: number;
	// How much scene light comes out as white on the screen just now (see uWhite).
	white: number;
	// 0..1 how far something out of the ordinary is happening in the air and in the water (`unusual`).
	unusual: { air: number; water: number };
	// 0..1 how much of the strongest's strength the sea asks for below, round the boat, and not ahead.
	below: number;
	tomorrow: { across: number; along: number };
	// The wind now at five heights, lowest first (the sea, then about 750 m, 1.5 km, 3 km and
	// 5.5 km), each as `tomorrow` is.
	aloft: { across: number; along: number }[];
	// How long air takes to rise through each of the four layers between those heights (1 in an
	// ordinary sky, less where it rises freely, up to 2.9 under an inversion).
	slowToRise: number[];
	// -1..1 the heat between sea and air: above 0 the sea is the warmer and the air rises in
	// thermals; below 0 the air is the warmer and lies still in layers.
	thermal: number;
	// 0..1 how much they are at work: 0 while the sun or moon lights the sea.
	strength: number;
	// Multiplies the light so it holds its brightness at any exposure.
	gain: number;
}

export function createChannellers(scene: THREE.Scene, camera: THREE.Camera, sea: GerstnerUniforms) {
	const strips = CHANNELLERS * (FILAMENTS + VEILS + HALOS);
	const count = strips * (SEGMENTS + 1) * 2;
	const along = new Float32Array(count);
	const side = new Float32Array(count);
	const thread = new Float32Array(count * 4);
	const seed = new Float32Array(count * 4);
	const kind = new Float32Array(count * 4);
	const soft = new Float32Array(count);
	let vertex = 0;
	for (let who = 0; who < CHANNELLERS; who++) {
		// The filaments' own values, kept so that a halo can double one of them.
		const made: number[][][] = [];
		for (let filament = 0; filament < FILAMENTS + VEILS + HALOS; filament++) {
			const veil = filament >= FILAMENTS && filament < FILAMENTS + VEILS;
			const halo = filament >= FILAMENTS + VEILS;
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
			if (!veil && !halo) made.push([threadValues, seedValues, kindValues]);
			// A halo takes a filament's values and shifts them a hair: nearly the same line, a
			// little behind it, several pixels wide, soft and faint.
			if (halo) {
				const [ofThread, ofSeed, ofKind] = made[Math.floor(Math.random() * made.length)]!;
				threadValues.splice(0, 4, ofThread![0]!, ofThread![1]!, ofThread![2]!, 4 + 4 * Math.random());
				seedValues.splice(0, 4, ofSeed![0]! + 0.004, ofSeed![1]!, ofSeed![2]! * 1.06, ofSeed![3]!);
				kindValues.splice(0, 4, ofKind![0]! * 0.3, ofKind![1]!, ofKind![2]! * 0.97, ofKind![3]!);
			}
			for (let i = 0; i <= SEGMENTS; i++) {
				for (const edge of [-1, 1]) {
					along[vertex] = i / SEGMENTS;
					side[vertex] = edge;
					thread.set(threadValues, vertex * 4);
					seed.set(seedValues, vertex * 4);
					kind.set(kindValues, vertex * 4);
					soft[vertex] = veil ? 1 : halo ? 0.75 : 0;
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
		uSoften: { value: 0 },
		uWhite: { value: 1 },
		uDay: { value: 0 },
		uSeatElement: { value: new THREE.Vector4() },
		uSheath: { value: [new THREE.Color(), new THREE.Color(), new THREE.Color(), new THREE.Color()] },
		uAct: { value: new THREE.Vector4() },
		uAge: { value: new THREE.Vector4() },
		uWas: { value: new THREE.Vector4() },
		uBearing: { value: new THREE.Vector4() },
		uTurn: { value: new THREE.Vector4(1, 1, 1, 1) },
		uToReading: { value: 0 },
		uFront: { value: 1.6 },
		uPressure: { value: 0 },
		uWindView: { value: new THREE.Vector3() },
		uFlap: { value: 0 },
		uWarm: { value: 0 },
		uGain: { value: 1 },
		uRestless: { value: new THREE.Vector4() },
		uWanderX: { value: new THREE.Vector4() },
		uWanderY: { value: new THREE.Vector4() },
		uCarry: { value: new THREE.Vector4() },
		uOpen: { value: new THREE.Vector4(1, 1, 1, 1) },
		uLoose: { value: new THREE.Vector4(0.5, 0.5, 0.5, 0.5) },
		uTempo: { value: new THREE.Vector4() },
		uTints: { value: TINTS },
		uElements: { value: ELEMENTS },
		uBaseTone: { value: BASE },
		uPixelRatio: pixelRatio,
		uResolution: { value: new THREE.Vector2(1, 1) },
		// The same objects the water uses, so both always agree.
		channelBoat: sea.channelBoat,
		channelTime: sea.channelTime,
		channelWind: sea.channelWind,
		channelSea: sea.channelSea,
		channelLoss: sea.channelLoss,
		channelGate: sea.channelGate,
		channelHead: sea.channelHead,
		channelTail: sea.channelTail,
		channelLinger: sea.channelLinger,
		channelControl: sea.channelControl,
		channelHold: sea.channelHold,
		channelCurrent: sea.channelCurrent,
		channelBack: sea.channelBack,
		channelSurge: sea.channelSurge,
		channelStream: sea.channelStream,
		channelLink: sea.channelLink,
		channelInto: sea.channelInto,
		channelReading: sea.channelReading,
		channelHeal: sea.channelHeal,
		waves: sea.waves,
		waveForm: sea.waveForm,
		waveFade: sea.waveFade,
		waveSteepness: sea.waveSteepness,
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
			blending: THREE.NormalBlending,
			premultipliedAlpha: true,
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
	// The scout's tress: its own small mesh.
	const scoutStrips = SCOUT_FILAMENTS + SCOUT_VEILS;
	const scoutCount = scoutStrips * (SCOUT_SEGMENTS + 1) * 2;
	const scoutAlong = new Float32Array(scoutCount);
	const scoutSide = new Float32Array(scoutCount);
	const scoutSeed = new Float32Array(scoutCount * 4);
	const scoutKind = new Float32Array(scoutCount * 4);
	const scoutSoft = new Float32Array(scoutCount);
	const scoutWho = new Float32Array(scoutCount);
	let at = 0;
	for (let filament = 0; filament < scoutStrips; filament++) {
		const veil = filament >= SCOUT_FILAMENTS;
		const whose = Math.random();
		const seedValues = [Math.random(), Math.random(), veil ? 0.3 * Math.random() : Math.sqrt(Math.random()), veil ? 0.05 : Math.random() ** 2 * 0.9];
		const kindValues = veil ? [0.05, 1, 0.2, 10 + 8 * Math.random()] : [0.2 + 0.35 * Math.random(), 3 + 5 * Math.random(), 0.25 + 0.4 * Math.random(), 0.55 + 0.3 * Math.random()];
		for (let i = 0; i <= SCOUT_SEGMENTS; i++) {
			for (const edge of [-1, 1]) {
				scoutAlong[at] = i / SCOUT_SEGMENTS;
				scoutSide[at] = edge;
				scoutSeed.set(seedValues, at * 4);
				scoutKind.set(kindValues, at * 4);
				scoutSoft[at] = veil ? 1 : 0;
				scoutWho[at] = whose;
				at++;
			}
		}
	}
	const scoutGeometry = new THREE.BufferGeometry();
	scoutGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(scoutCount * 3), 3));
	scoutGeometry.setAttribute("aT", new THREE.BufferAttribute(scoutAlong, 1));
	scoutGeometry.setAttribute("aSide", new THREE.BufferAttribute(scoutSide, 1));
	scoutGeometry.setAttribute("aSeed", new THREE.BufferAttribute(scoutSeed, 4));
	scoutGeometry.setAttribute("aKind", new THREE.BufferAttribute(scoutKind, 4));
	scoutGeometry.setAttribute("aSoft", new THREE.BufferAttribute(scoutSoft, 1));
	scoutGeometry.setAttribute("aWho", new THREE.BufferAttribute(scoutWho, 1));
	scoutGeometry.setIndex(stripIndices(scoutStrips, SCOUT_SEGMENTS));
	const scoutUniforms = {
		uTime: { value: 0 },
		uStrength: { value: 0 },
		uGain: uniforms.uGain,
		uHead: { value: 0 },
		uTail: { value: 2 },
		uFade: { value: 0 },
		uSender: { value: Array.from({ length: SCOUT_SENDERS }, () => new THREE.Vector3()) },
		uShare: { value: Array.from({ length: SCOUT_SENDERS }, (_, slot) => (slot ? 2 : 0)) },
		uAloft: { value: Array.from({ length: 5 }, () => new THREE.Vector2()) },
		uSlow: { value: [1, 1, 1, 1] },
		uSpread: { value: 1 },
		uOwn: { value: 0 },
		uSoften: uniforms.uSoften,
		uSheath: uniforms.uSheath,
		uDay: uniforms.uDay,
		uWhite: uniforms.uWhite,
		uThermal: { value: 0 },
		channelCurrent: sea.channelCurrent,
		channelWind: sea.channelWind,
		uPixelRatio: uniforms.uPixelRatio,
		uResolution: uniforms.uResolution,
	};
	const scoutMesh = new THREE.Mesh(
		scoutGeometry,
		new THREE.ShaderMaterial({
			uniforms: scoutUniforms,
			vertexShader: scoutVertexShader,
			fragmentShader,
			transparent: true,
			depthWrite: false,
			side: THREE.DoubleSide,
			blending: THREE.NormalBlending,
			premultipliedAlpha: true,
		}),
	);
	scoutMesh.frustumCulled = false;
	scoutMesh.renderOrder = WEAVE_RENDER_ORDER;
	scoutMesh.visible = false;
	scene.add(scoutMesh);
	// The scout's weave begins and ends as the others do: it runs up from the boat, and when it
	// is let go it is cut at the boat, goes on up by itself, and fades high and soft.
	let scouting = false;
	let scoutStrength = 0;
	// Who is sending it up just now (their names, for ?controls).
	let scanning = "";
	// Where along the rail those scanning stand: between and outside the four seats at the front.
	const SCAN_PLACES = [-3, -1.5, 0, 1.5, 3];
	type Wind = { across: number; along: number };
	// 0..1 how differently the sky's layers are blowing: how far apart, on average, any two of the five winds are.
	const layered = (aloft: Wind[]) => {
		let apart = 0;
		for (let low = 0; low < aloft.length; low++) for (let high = low + 1; high < aloft.length; high++) apart += Math.hypot(aloft[high]!.across - aloft[low]!.across, aloft[high]!.along - aloft[low]!.along);
		return Math.min(1, apart / 10 / 0.35);
	};
	const tendScout = (delta: number, time: number, wanted: number, aloft: Wind[], slowToRise: number[], gust: number, thermal: number, byStrongest: boolean) => {
		const u = scoutUniforms;
		if (wanted > 0.3 && !scouting) {
			scouting = true;
			u.uHead.value = 0;
			u.uOwn.value = byStrongest ? 1 : 0;
			// Two to five of them send it up (the owner's): two when the whole sky blows one way, five
			// when every layer of it blows differently. The strongest, looking into something, is the
			// first of them and stays in their own seat; the rest are from those not at the front,
			// the air-minded and the curious likeliest, and stand at the rail between the seats.
			const count = 2 + Math.round(3 * layered(aloft));
			const free = TEMPERS.map((_, member) => member).filter((member) => !atFront.includes(member));
			const senders = byStrongest ? [0] : [];
			while (senders.length < count) {
				const member = pick(free, (candidate) => TEMPERS[candidate]!.air + 0.5 * TEMPERS[candidate]!.curious);
				free.splice(free.indexOf(member), 1);
				senders.push(member);
			}
			senders.sort((a, b) => CREW[b]! - CREW[a]!);
			const places = [...SCAN_PLACES].sort(() => Math.random() - 0.5);
			const whole = senders.reduce((sum, member) => sum + CREW[member]!, 0);
			// The eager begin at once, the slow a few seconds after (the strongest always first).
			const late = senders.map((member) => (member === 0 ? 0 : 0.05 + 0.25 * (1 - TEMPERS[member]!.eager)));
			const first = Math.min(...late);
			let share = 0;
			for (let slot = 0; slot < SCOUT_SENDERS; slot++) {
				const member = senders[slot];
				if (member === undefined) {
					u.uShare.value[slot] = 2;
					continue;
				}
				u.uSender.value[slot]!.set(member === 0 ? 0.75 : places[slot]!, CREW[member]!, late[slot]! - first);
				u.uShare.value[slot] = share;
				share += CREW[member]! / whole;
			}
			scanning = senders.map((member) => TEMPERS[member]!.name).join(", ");
		} else if (wanted < 0.15 && scouting) {
			scouting = false;
			u.uHead.value = 0;
			u.uTail.value = 0;
			u.uFade.value = 0;
		}
		if (scouting) {
			scoutStrength = wanted;
			// It goes up slowly: it is feeling its way.
			u.uHead.value = Math.min(1.4, u.uHead.value + delta / 9);
			if (u.uTail.value < 2 && u.uHead.value >= u.uTail.value - 0.06) u.uTail.value = 2;
		}
		if (u.uTail.value < 2) {
			if (u.uTail.value < 0.6) u.uTail.value += delta * 0.07;
			else {
				u.uTail.value += delta * 0.01;
				u.uFade.value += delta / 18;
				if (u.uFade.value >= 1) {
					u.uTail.value = 2;
					u.uFade.value = 0;
				}
			}
		}
		scoutMesh.visible = scouting || u.uTail.value < 2;
		u.uTime.value = time;
		u.uThermal.value += (thermal - u.uThermal.value) * Math.min(1, delta / 4);
		u.uStrength.value = scoutStrength;
		// The winds ease over: a forecast does not swing about.
		slowToRise.forEach((slow, layer) => (u.uSlow.value[layer]! += (slow - u.uSlow.value[layer]!) * Math.min(1, delta / 4)));
		u.uAloft.value.forEach((wind, height) => wind.set(wind.x + (aloft[height]!.across - wind.x) * Math.min(1, delta / 4), wind.y + (aloft[height]!.along - wind.y) * Math.min(1, delta / 4)));
		// While a gust blows the flows are drawn in, the highest first; as it passes they are let
		// out again. Slowly both ways: it is done with intent.
		const out = 1 - 0.75 * Math.min(1, gust * 1.5);
		u.uSpread.value += (out - u.uSpread.value) * Math.min(1, delta / (out < u.uSpread.value ? 5 : 8));
		if (!scoutMesh.visible) scanning = "";
	};

	// The soundings' tresses: their own small mesh.
	const soundingStrips = SOUNDERS * SOUNDING_FILAMENTS;
	const soundingCount = soundingStrips * (SOUNDING_SEGMENTS + 1) * 2;
	const soundingAlong = new Float32Array(soundingCount);
	const soundingSide = new Float32Array(soundingCount);
	const soundingBraid = new Float32Array(soundingCount * 4);
	const soundingKind = new Float32Array(soundingCount * 4);
	let place = 0;
	for (let who = 0; who < SOUNDERS; who++) {
		for (let filament = 0; filament < SOUNDING_FILAMENTS; filament++) {
			// Unequal, as filaments are: most are faint and fine, a few carry more.
			const braid = [who, filament % 3, Math.random(), between(0.5, 1)];
			const kind = [between(0.03, 0.09) + (Math.random() < 0.2 ? 0.08 : 0), between(5, 14), between(0.15, 0.5), between(-1, 1)];
			for (let i = 0; i <= SOUNDING_SEGMENTS; i++) {
				for (const edge of [-1, 1]) {
					soundingAlong[place] = i / SOUNDING_SEGMENTS;
					soundingSide[place] = edge;
					soundingBraid.set(braid, place * 4);
					soundingKind.set(kind, place * 4);
					place++;
				}
			}
		}
	}
	const soundingGeometry = new THREE.BufferGeometry();
	soundingGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(soundingCount * 3), 3));
	soundingGeometry.setAttribute("aT", new THREE.BufferAttribute(soundingAlong, 1));
	soundingGeometry.setAttribute("aSide", new THREE.BufferAttribute(soundingSide, 1));
	soundingGeometry.setAttribute("aBraid", new THREE.BufferAttribute(soundingBraid, 4));
	soundingGeometry.setAttribute("aKind", new THREE.BufferAttribute(soundingKind, 4));
	soundingGeometry.setIndex(stripIndices(soundingStrips, SOUNDING_SEGMENTS));
	const soundingUniforms = {
		uTime: { value: 0 },
		uStrength: { value: 1 },
		uGain: uniforms.uGain,
		uSoften: uniforms.uSoften,
		uSheath: uniforms.uSheath,
		uDay: uniforms.uDay,
		uWhite: uniforms.uWhite,
		uOwn: { value: 0 },
		uReach: { value: new THREE.Vector4(40, 50, 60, 45) },
		uHead: { value: new THREE.Vector4(0, 0, 0, 0) },
		uTail: { value: new THREE.Vector4(2, 2, 2, 2) },
		uTogether: { value: 0 },
		uThermal: { value: 0 },
		channelCurrent: sea.channelCurrent,
		waves: sea.waves,
		waveForm: sea.waveForm,
		waveFade: sea.waveFade,
		waveSteepness: sea.waveSteepness,
		waveTime: sea.waveTime,
		uPixelRatio: uniforms.uPixelRatio,
		uResolution: uniforms.uResolution,
	};
	const soundingMesh = new THREE.Mesh(
		soundingGeometry,
		new THREE.ShaderMaterial({
			uniforms: soundingUniforms,
			vertexShader: soundingVertexShader(sea.waves.value.length),
			fragmentShader,
			transparent: true,
			depthWrite: false,
			side: THREE.DoubleSide,
			blending: THREE.NormalBlending,
			premultipliedAlpha: true,
		}),
	);
	soundingMesh.frustumCulled = false;
	soundingMesh.renderOrder = WEAVE_RENDER_ORDER;
	soundingMesh.visible = false;
	scene.add(soundingMesh);
	// A sounding. Each of those taking part runs their tress out when they are ready, holds it
	// while they feel, and lets it go at the hands in their own time, the cut following round.
	// While it lasts they drift between working together and apart. Then a rest of a minute or three.
	const sounders = Array.from({ length: SOUNDERS }, () => ({ begins: 0, lets: 0, out: 6, back: 5, sounding: false }));
	// (Now and then the page opens just as a sounding is about to begin.)
	let nextSounding = Math.random() < 0.3 ? between(1, 6) : between(18, 45);
	let togetherWanted = 0;
	let togetherTurns = 0;
	let soundingSociable = 0.5;
	const tendSoundings = (delta: number, time: number, thermal: number, always: boolean, linkedAll: boolean, strongestAlone: boolean, calls: Calls) => {
		const u = soundingUniforms;
		// The strongest, looking into something in the water, sounds it alone, and for as long as the looking lasts.
		const own = sounders[STRONGEST]!;
		if (strongestAlone && !own.sounding) {
			sounders.forEach((one) => (one.lets = Math.min(one.lets, time)));
			Object.assign(own, { sounding: true, begins: time, lets: Infinity, out: 4, back: 5 });
			u.uHead.value.setComponent(STRONGEST, 0);
			u.uTail.value.setComponent(STRONGEST, 2);
			togetherWanted = 0;
			u.uOwn.value = 1;
			u.uReach.value.setComponent(STRONGEST, 62);
		} else if (!strongestAlone && own.lets === Infinity) own.lets = time;
		if (!own.sounding) u.uOwn.value = 0;
		// (Not while all thirteen are linked: whoever is sounding then lets go and joins.)
		if (linkedAll && !always && !strongestAlone) {
			nextSounding = Math.max(nextSounding, time + 30);
			sounders.forEach((one) => (one.lets = Math.min(one.lets, time)));
		}
		if (strongestAlone) nextSounding = Math.max(nextSounding, time + 40);
		if (!sounders.some((one) => one.sounding) && (time > nextSounding || always)) {
			// Three of them, or all four: from those not at the front, the curious and the
			// water-minded likeliest, and more so when the sea is doing something.
			const rests = Math.random() < 0.5 ? Math.floor(Math.random() * SOUNDERS) : -1;
			const free = TEMPERS.map((_, member) => member).filter((member) => !atFront.includes(member));
			soundingSociable = 0;
			sounders.forEach((one, who) => {
				if (who === rests) return;
				const member = pick(free, (candidate) => TEMPERS[candidate]!.curious + (0.5 + calls.water) * TEMPERS[candidate]!.water);
				free.splice(free.indexOf(member), 1);
				const temper = TEMPERS[member]!;
				// Each does it as they are: the eager begin at once and are soon done, the patient
				// begin late and hold long; the stronger and the more water-minded reach further.
				one.sounding = true;
				one.begins = time + 5 * (1 - temper.eager) + between(0, 1);
				one.lets = one.begins + 12 + 14 * (1 - temper.eager) + between(0, 3);
				one.out = 5 + 3 * (1 - temper.eager);
				one.back = between(4, 7);
				u.uHead.value.setComponent(who, 0);
				u.uTail.value.setComponent(who, 2);
				u.uReach.value.setComponent(who, 28 + 34 * (CREW[member]! / CREW[1]!) * (0.6 + 0.4 * temper.water));
				soundingSociable += temper.sociable / (rests < 0 ? 4 : 3);
			});
			// Whether they begin together is a matter of how sociable those sounding are.
			togetherWanted = Math.random() < soundingSociable ? 1 : 0;
			u.uTogether.value = togetherWanted;
			togetherTurns = time + between(6, 11);
			nextSounding = time + between(100, 220);
		}
		// Together, apart, or part-way: it changes as they go.
		if (time > togetherTurns) {
			const mood = Math.random();
			togetherWanted = mood < 0.7 * soundingSociable ? 1 : mood < 0.7 * soundingSociable + 0.3 ? 0.5 : 0;
			togetherTurns = time + between(6, 11);
		}
		u.uTogether.value += (togetherWanted - u.uTogether.value) * Math.min(1, delta / 5);
		sounders.forEach((one, who) => {
			if (!one.sounding || time < one.begins) return;
			u.uHead.value.setComponent(who, Math.min(1.1, u.uHead.value.getComponent(who) + delta / one.out));
			if (time < one.lets) return;
			const tail = u.uTail.value.getComponent(who);
			const cut = (tail >= 2 ? 0 : tail) + delta / one.back;
			if (cut >= 1.15) {
				one.sounding = false;
				u.uHead.value.setComponent(who, 0);
				u.uTail.value.setComponent(who, 2);
			} else {
				u.uTail.value.setComponent(who, cut);
			}
		});
		soundingMesh.visible = sounders.some((one) => one.sounding);
		u.uTime.value = time;
		u.uThermal.value = thermal;
	};

	// Who the story, or the steady work, wants channelling at this moment.
	const want = [true, true, true, true];
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
				// (Within 2 to 5 seconds, as the owner set: the eager ones at the 2, the slow ones at the 5.)
				joins = joins.map((_, who) => (who === STRONGEST ? 0 : ORDER.indexOf(who) < workingFor(need) ? 2 + 2.6 * (1 - TEMPERS[memberAt(who)]!.eager) + between(0, 0.4) : Infinity));
				lasts = Math.max(...joins.filter(Number.isFinite)) + between(20, 25);
			} else {
				part = "stopped";
				lasts = between(4, 9);
			}
		}
		for (let who = 0; who < CHANNELLERS; who++) want[who] = (part === "opening" || part === "working") && since >= joins[who]!;
		// Their whole strength comes only when they link, and only once all four are in.
		const driven = part === "working" && linking && since >= Math.max(...joins);
		surge += ((driven ? 1 : 0) - surge) * Math.min(1, delta / (part === "working" ? 1.6 : 0.4));
	};

	// Tending (the owner's). They are on a pilgrimage, and what they channel into the ocean and the
	// air is for its well-being. Each at the front reads the weather in their own way, in a form of
	// its own (see `formPoint`), and they come together to heal the water.
	//
	// None of it runs to a clock (the owner: "too loopy and repetitive instead of responsive to
	// actual wind, wave, air, air pressure etc data"). What they do, how many of them, where they
	// turn to and for how long all come from what is there:
	//   the wind      how hard it blows, how gusty it is, and each gust as it comes
	//   the pressure  how fast the barometer is moving; steady, it is hardly looked at
	//   the water     each set of higher waves as it passes under the boat (from the very sea that
	//                 is drawn), the heat between sea and air, and the current
	// Each of these "calls" 0..1. One of them turns to whatever calls loudest for someone of their
	// temperament that nobody else has in hand, holds it for as long as it goes on calling, and
	// lets go when it has gone quiet. What nobody has looked at for some minutes is looked at once,
	// briefly. When nothing calls, they sit: on a still day there may be one weave out, or none.
	// A wind reading is sent towards where the wind comes from, a water reading towards where the
	// swell comes from.
	// And they heal in the sea's own time: when a set of waves has passed and the water eases,
	// they link, and hold it until the next set is on them.
	type Reading = "pressure" | "wind" | "water" | "rest";
	type Kind = Exclude<Reading, "rest">;
	const KINDS: Kind[] = ["pressure", "wind", "water"];
	const INTO: Record<Reading, number> = { pressure: 1, wind: 0.6, water: 0, rest: 0.3 };
	const ACT: Record<Reading, number> = { water: 0, wind: 1, pressure: 2, rest: 0 };
	// (`act` is the form the seat's weave now has, `was` the one it is turning from and `turn`
	// 0..1 how far that turn has gone; `bearing` is where it is sent, in radians right of ahead.)
	const seats = [0, 1, 2, 3].map(() => ({ doing: "rest" as Reading, act: 0, was: 0, turn: 1, age: 0, until: between(0, 6), bearing: 0, heard: 0 }));
	const into = seats.map(() => 0.3);
	const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
	const calls: Record<Kind, number> = { pressure: 0, wind: 0, water: 0 };
	const towards: Record<Kind, number> = { pressure: 0, wind: 0, water: 0 };
	let clock = 0;
	// When each was last in someone's hands. (As a visit opens, each has gone unread for a
	// different while: so no two visits begin alike, though nothing is thrown by chance after this.)
	const lastRead: Record<Kind, number> = { pressure: -between(20, 220), wind: -between(20, 220), water: -between(20, 220) };
	// The sea under the boat: how far it is swinging just now against how far it has been, which
	// tells a set of higher waves from the lull after it; and the wind against its own late average.
	const sensed = { level: 0, short: -1, long: 0, set: 0, peak: 0, windMean: -1, gust: 0 };
	let sinceStart = 0;
	// (Whether each seat's restlessness has been set yet: at first it is simply its occupant's.)
	let restlessSet = false;
	interface Weather {
		heave: number;
		energy: number;
		need: number;
		pressure: number;
		wind: { across: number; away: number; force: number; gusty: number };
		thermal: number;
		current: number;
		swellFrom: number;
	}
	const sense = (delta: number, weather: Weather) => {
		const swing = Math.abs(weather.heave - sensed.level);
		sensed.level += (weather.heave - sensed.level) * Math.min(1, delta / 40);
		if (sensed.short < 0) sensed.short = sensed.long = swing;
		sensed.short += (swing - sensed.short) * Math.min(1, delta / 5);
		// (It learns what is usual quickly in the first seconds of a visit, then slowly.)
		sensed.long += (swing - sensed.long) * Math.min(1, delta / Math.min(45, 4 + clock + sinceStart));
		sinceStart += delta;
		sensed.set = sensed.long > 0.01 ? clamp01((sensed.short / sensed.long - 0.8) / 0.5) : 0;
		sensed.peak = Math.max(sensed.peak, sensed.set);
		if (sensed.windMean < 0) sensed.windMean = weather.wind.force;
		sensed.windMean += (weather.wind.force - sensed.windMean) * Math.min(1, delta / 25);
		sensed.gust = clamp01(((weather.wind.force - sensed.windMean) / Math.max(0.06, sensed.windMean)) * 1.5);
		// (Each call is taken in slowly, over some ten seconds: nobody turns for a single gust or a
		// single wave, only for something that goes on.)
		const taken = Math.min(1, delta / 10);
		calls.wind += (clamp01(0.55 * weather.wind.force + 0.3 * weather.wind.gusty + 0.7 * sensed.gust) - calls.wind) * taken;
		// (A barometer moving 3 hPa in three hours calls as loudly as anything can.)
		calls.pressure += (clamp01(0.55 * Math.abs(weather.pressure)) - calls.pressure) * taken;
		calls.water += (clamp01(0.45 * sensed.set + 0.4 * Math.abs(weather.thermal) + 0.5 * Math.abs(weather.current) + 0.25 * weather.energy) - calls.water) * taken;
		// Where each is to be read. The wind from where it comes, if that is anywhere ahead; the
		// water from where the swell comes; the pressure overhead.
		// (From behind, the more nearly behind the more nearly straight ahead: not to whichever side
		// it leans, which threw a reading across from one side to the other, unasked, each time the
		// swell or the wind passed dead astern.)
		const ahead = (angle: number, most: number) =>
			Math.abs(angle) > 1.3 ? (Math.sign(angle) * most * (Math.PI - Math.abs(angle))) / (Math.PI - 1.3) : Math.max(-most, Math.min(most, angle));
		towards.wind = ahead(Math.atan2(-weather.wind.across, -weather.wind.away), 0.5);
		towards.water = ahead(weather.swellFrom, 0.42);
	};
	// How much something not looked at for a while asks to be: nothing for the first minute, then
	// more, up to a point.
	const unread = (kind: Kind) => 0.4 * THREE.MathUtils.smoothstep(clock - lastRead[kind], 60, 240);
	const NAMES: Record<Reading, string> = { pressure: "the pressure", wind: "the wind", water: "the water", rest: "" };
	// What one of them turns to now, if anything.
	const hears = (who: number): Reading => {
		const temper = TEMPERS[memberAt(who)]!;
		// (The strongest attends to all of it alike.)
		const leaning: Record<Kind, number> = who === STRONGEST ? { pressure: 1, wind: 1, water: 1 } : { pressure: 0.35 + 0.65 * temper.air, wind: 0.3 + 0.7 * temper.air, water: 0.3 + 0.7 * temper.water };
		let best: Reading = "rest";
		let loudest = 0.25 - 0.09 * temper.curious;
		for (const kind of KINDS) {
			const taken = seats.some((seat, other) => other !== who && seat.doing === kind);
			// (What they already have in hand they do not drop for something only a little louder.)
			const heard = (calls[kind] + unread(kind)) * leaning[kind] * (taken ? 0.4 : 1) * (seats[who]!.doing === kind ? 1.5 : 1);
			if (heard > loudest) [best, loudest] = [kind, heard];
		}
		seats[who]!.heard = best === "rest" ? 0 : loudest;
		return best;
	};
	type Way = "water" | "sky" | "few";
	let way: Way = "water";
	let linked = false;
	let sinceLink = between(0, 50);
	let linkedFor = 0;
	// Seats left out of this link.
	let sitsOut: number[] = [];
	let link = 1;
	// 0..1 how far each is at their own reading, and how far they are linked to heal.
	let reading = 0;
	let healing = 0;
	// Seconds a turn takes to run from the hands to the far end of a weave: one reading to another,
	// or all of them between their readings and the healing flow.
	// (The owner found 6.5 seconds erratic, not intentional: a turn is a slow, meant thing.)
	const TURNS_IN = 12;
	// Each one's hand (the owner, 14 October: "a recognisable hand for each channeller"; the
	// first part of the plan to make the weaving more human). Who is in the seat shows in how the
	// weave is worked, not only in when:
	//   pace     how briskly they cast out, turn and let go: the eager briskly, the patient
	//            laying it out slowly (a turn takes 10 to 14 seconds; never hurried)
	//   carry    how high they hold a reading: the air-minded higher, the water-minded lower
	//   open     how open their tress lies: the sociable more open, the reserved close
	//   loose    how loosely they hold it: the less steady let it flap and stray more
	// Eased over a few seconds when another takes the seat. All as before without ?hands.
	let handsOn = false;
	const hand = [0, 1, 2, 3].map(() => ({ pace: 1, carry: 0, open: 1, loose: 0.5, set: false }));
	let toReading = false;
	let front = 1.6;
	// Water they have healed stays altered for minutes (the owner's): up to four places.
	// (`most` and `widest`: how far it is mended and how far it spreads while it is being worked.
	// The healing flow mends wholly and widely; the earth of one water reading, a little.)
	const mended = [0, 1, 2, 3].map(() => ({ x: 0, z: 0, reach: 0, left: 0, growing: false, most: 1, widest: 70 }));
	// Where each seat's water reading has laid its earth, while it does.
	const settling: ((typeof mended)[number] | undefined)[] = [undefined, undefined, undefined, undefined];
	const flowAt = new THREE.Vector3();
	// (All of it unhurried, the owner's "elegant, Odyssey-like".)
	// Whether the strongest has asked them to link, and they have not yet done so.
	let askedToLink = false;
	const tend = (delta: number, linkNow: boolean, weather: Weather, only?: string) => {
		if (linkNow) askedToLink = true;
		sense(delta, weather);
		const { need, energy } = weather;
		// Healing, in the sea's own time: a set of waves has passed and the water eases. (If the
		// sea gives no such sign for over a minute, they do it anyway.)
		const eased = sensed.peak > 0.6 && sensed.set < 0.3;
		let wanted = linked;
		if (!linked) {
			sinceLink += delta;
			if ((eased && sinceLink > 32) || sinceLink > 90 || askedToLink) wanted = true;
		} else {
			linkedFor += delta;
			// Until the next set is on them.
			if ((linkedFor > 20 && sensed.set > 0.55) || linkedFor > 34) wanted = false;
		}
		// (For looking at one thing: ?show=...)
		if (only === "healing") wanted = true;
		else if (only === "pressure" || only === "wind" || only === "water") {
			wanted = false;
			seats.forEach((seat) => {
				if (seat.act !== ACT[only]) Object.assign(seat, { doing: only, act: ACT[only], was: ACT[only], turn: 1, age: 0 });
				seat.doing = only;
				seat.until = clock + 5;
			});
		}
		// (Not until the turn they are in has run out to the far ends of their weaves: a turn taken
		// back half-way jumped, and is not meant.)
		if (wanted !== linked && front >= 1.6) {
			linked = wanted;
			askedToLink = false;
			if (linked) {
				linkedFor = 0;
				sensed.peak = 0;
				// How they do it is the weather's too: a working sea is healed by driving the flow
				// into it; a quiet one lightly, and by fewer of them when little is called for.
				way = energy > 0.4 ? "water" : need < 0.3 ? "few" : "sky";
				sitsOut = way === "few" ? [0, 1, 3].filter((who) => seats[who]!.doing === "rest").slice(0, 2) : [];
				// Where the flow will sink into the sea, the water begins to mend: in the place of
				// whichever of the four has faded most.
				const place = mended.reduce((least, one) => (one.left < least.left ? one : least));
				flowPoint(115, flowAt);
				Object.assign(place, { x: flowAt.x, z: flowAt.z, reach: 12, left: Math.max(place.left * 0.3, 0.02), growing: true, most: 1, widest: 70 });
			} else {
				sinceLink = 0;
				mended.forEach((one) => (one.growing = false));
				// Parting, each listens again: and the weave goes straight out to what calls them now,
				// not out to what they were at before and then, a breath later, turned to another.
				// (And they give it its time before turning again.)
				seats.forEach((seat, who) => {
					seat.until = Math.min(seat.until, clock + 1 + 2 * Math.random());
					if (seat.doing === "rest" || only) return;
					const next = hears(who);
					if (next !== "rest" && next !== seat.doing) Object.assign(seat, { doing: next, act: ACT[next], was: ACT[next], turn: 1, bearing: towards[next] + (who - 1.5) * 0.08 });
					seat.age = 0;
				});
			}
		}
		// (Their own time stands still while they are linked.)
		if (!linked) clock += delta;
		// How many weave at once is a matter of how much the sea and wind call for.
		const room = workingFor(need);
		seats.forEach((seat, who) => {
			if (!linked && clock > seat.until && !only) {
				const temper = TEMPERS[memberAt(who)]!;
				const next = hears(who);
				const busy = seats.filter((one) => one.doing !== "rest").length;
				if (next === "rest" || (seat.doing === "rest" && busy >= room)) {
					// Nothing calls them (or enough are at it already): they let go, and sit.
					seat.doing = "rest";
					seat.until = clock + (4 + 5 * (1 - temper.eager)) * (1.5 - 0.5 * need);
				} else if (seat.doing === "rest") {
					// (Not until the last one's cut end has run off the end of its form.)
					if (tail[who]! < 0.72) return;
					seat.doing = next;
					seat.act = seat.was = ACT[next];
					seat.turn = 1;
					seat.age = 0;
					seat.bearing = towards[next] + (who - 1.5) * 0.08;
				} else if (next !== seat.doing && seat.age > 18) {
					// (And never before they have given the one in hand its time.)
					// They do not let go to take up another (the owner's): they turn the weave they
					// have to it, steadily, from the boat outward.
					seat.was = seat.act;
					seat.doing = next;
					seat.act = ACT[next];
					seat.turn = 0;
					seat.age = 0;
				}
				// They hold it for as long as it is loud: a thing only glanced at because nobody had
				// for a while is let go again in a few breaths.
				if (seat.doing !== "rest") seat.until = clock + (10 + 24 * clamp01(seat.heard)) * (0.7 + 0.5 * temper.stamina);
			}
			if (seat.doing !== "rest") {
				lastRead[seat.doing] = clock;
				// (Where it is sent follows the wind and the swell as they come round, slowly.)
				seat.bearing += (towards[seat.doing] + (who - 1.5) * 0.08 - seat.bearing) * Math.min(1, delta / 16);
			}
			// Earth is what stays (the owner's water reading, 13 October): where the earth of a water
			// reading has gone down, the water mends a little, the more the more the sea is doing,
			// and stays so for minutes after the weave is let go. (The place is the far part of the
			// reading's line: see the water form in the shader.)
			if (!linked && seat.doing === "water" && seat.turn >= 1 && seat.age > 9) {
				if (!settling[who]) {
					const place = mended.reduce((least, one) => (one.left < least.left ? one : least));
					const carry = Math.abs(weather.current);
					const aside = THREE.MathUtils.lerp((who < 1.5 ? -1 : 1) * 38, Math.sign(weather.current) * (44 + 50 * carry), THREE.MathUtils.smoothstep(carry, 0.03, 0.2));
					const [sin, cos] = [Math.sin(seat.bearing), Math.cos(seat.bearing)];
					Object.assign(place, { x: camera.position.x + (who - 1.5) * 1.5 + sin * 68 + cos * aside * 0.7, z: camera.position.z - cos * 68 + sin * aside * 0.7, reach: 8, left: Math.max(place.left * 0.3, 0.02), most: 0.2 + 0.4 * clamp01(energy * 1.5), widest: 26 });
					settling[who] = place;
				}
				settling[who]!.growing = true;
			} else if (settling[who]) {
				settling[who]!.growing = false;
				settling[who] = undefined;
			}
			seat.age += delta;
			// (At each one's own pace, which moves a turn's 12 seconds no further than 10 to 14.)
			seat.turn = Math.min(1, seat.turn + (delta * (1 + 0.6 * (hand[who]!.pace - 1))) / TURNS_IN);
			want[who] = linked ? !sitsOut.includes(who) : seat.doing !== "rest";
			// (Eased: a weave let go keeps its way while it fades, and bends only slowly to the next.)
			into[who] = into[who]! + (INTO[seat.doing] - into[who]!) * Math.min(1, delta / 2.5);
		});
		const driven = !linked ? 0 : way === "water" ? 0.45 + 0.4 * clamp01(energy * 1.5) : way === "sky" ? 0.18 : 0.4;
		surge += (driven - surge) * Math.min(1, delta / 3.5);
		link += ((linked ? 1 : 0) - link) * Math.min(1, delta / (linked ? 2.6 : 4.5));
	};
	// In words, for /?controls: who is at what, and how loudly each thing is calling.
	const told = () =>
		`${linked ? "linked, healing" : seats.map((seat, who) => `${TEMPERS[memberAt(who)]!.name}${seat.doing === "rest" ? " sits" : `: ${NAMES[seat.doing]}`}`).join(" · ")}${scanning ? ` · scanning the sky: ${scanning}` : ""} | calling: wind ${Math.round(calls.wind * 100)}% · pressure ${Math.round(calls.pressure * 100)}% · water ${Math.round(calls.water * 100)}% (a set of waves ${Math.round(sensed.set * 100)}%)`;
	// (Whether or not they are tending just now: what is mended fades in its own time, over minutes.)
	const tendMended = (delta: number, current: number) => {
		mended.forEach((one, i) => {
			if (one.growing) one.left += (one.most - one.left) * Math.min(1, delta / 4);
			else one.left *= Math.exp(-delta / 100);
			// It spreads in the water as it fades, and the current takes it.
			one.reach = Math.min(one.growing ? Math.max(one.widest, one.reach) : 70, one.reach + delta * (one.growing ? 3 : 0.18));
			one.x += current * delta * 0.25;
			sea.healed.value[i]!.set(one.x, one.z, one.reach, one.left);
		});
	};
	// Now and then by day one of them seeks into the sky, to understand the wind (the owner's):
	// for half a minute or so, and at the opening of some visits.
	let skyFrom = Math.random() < 0.3 ? 0 : between(20, 80);
	let skyUntil = 0;

	// There are thirteen channellers on the boat, not four (the owner's): four are at the front at
	// any one time and the other nine rest or work elsewhere, and they take turns. Their strengths:
	// The strongest is immensely stronger than the rest (the owner's, never to be forgotten): 1.8
	// times as strong as the other twelve put together. A tress cannot be drawn to that scale, or
	// the others' would not be seen at all beside the strongest's; so the others are drawn at about six tenths
	// of what they were, clearly the lesser, and the true measure is kept in the rules instead:
	// the strongest is the first to look into anything out of the ordinary and the first to work
	// with it, begins the story alone, and what the strongest gives below is taken from the whole
	// flow ahead. (The strongest is the owner: no "she" or "he" here.)
	const STRONGEST_TO_THE_REST = 1.8;
	const REST = [0.95, 0.9, 0.82, 0.78, 0.7, 0.64, 0.58, 0.52, 0.47, 0.42, 0.38, 0.34];
	const TRUE_STRENGTH = [STRONGEST_TO_THE_REST * REST.reduce((sum, one) => sum + one, 0), ...REST];
	// As drawn, 0..1.
	const CREW = TRUE_STRENGTH.map((strength, member) => (member === 0 ? 1 : 0.62 * strength));
	// Temperaments (the owner asked for them: the twelve are people, and their powers will only
	// look natural if they do not all behave alike). In CREW's order, strongest first. Each figure
	// is 0..1 and is used by a rule further down; none is decoration.
	//   air, water   how much of what the wind and pressure, or the sea, current and temperature,
	//                are doing reaches them: who steps forward for which weather, who sounds
	//   eager        how soon they come in after the strongest, and how readily they step forward
	//   stamina      how long they keep a place at the front before they are relieved
	//   steady       how still their tress lies (the restless one's filaments stray and wander)
	//   sociable     whether, sounding, they would sooner lay their tress in with the others'
	//   curious      how often they are among those who sound the water
	// The strongest's attention to air, pressure, waves and the rest is 0.84: the owner had it
	// brought down by 16%, so that not every small thing is looked into.
	//
	// (14 October, the owner: more maturity, more nuanced, less unruliness, after Kahlil Gibran's
	// The Prophet, which was read for it. They are grown people at a shared work. Their reason and
	// their passion are "the rudder and the sails" of each: so none is all sail, rash and soon
	// spent, and none all rudder; the steadiest are not the dullest, and the quickest still keep
	// their line (steady is never under 0.6, eager between 0.3 and 0.8, stamina at least 0.5). They
	// work together with "spaces in your togetherness", "as the strings of a lute are alone though
	// they quiver with the same music": none wholly joins, none holds wholly apart (sociable 0.35
	// to 0.8). And they differ in how much they long and how fast, which is no fault: "let not him
	// who longs much say to him who longs little, 'Wherefore are you slow and halting?'" Three were
	// renamed for it: Gale, Spark and Drift are Sail, Lantern and Mist.)
	const TEMPERS = [
		{ name: "the strongest", air: 0.84, water: 0.84, eager: 1, stamina: 1, steady: 1, sociable: 0.5, curious: 1 },
		// The rudder: holds a place longest and lies stillest; reason that serves and does not rule.
		{ name: "Keel", air: 0.5, water: 0.55, eager: 0.55, stamina: 0.95, steady: 0.95, sociable: 0.65, curious: 0.35 },
		// Air, and free because held: first to feel a shift in the wind, never carried off by it.
		{ name: "Kite", air: 0.9, water: 0.35, eager: 0.75, stamina: 0.6, steady: 0.65, sociable: 0.5, curious: 0.7 },
		// Patient water: comes in slowly, goes deepest, and does not hurry back with what it finds.
		{ name: "Fathom", air: 0.3, water: 0.95, eager: 0.35, stamina: 0.85, steady: 0.85, sociable: 0.4, curious: 0.9 },
		// Warmth that lasts: comes in readily, and burns low and long rather than bright and short.
		{ name: "Ember", air: 0.6, water: 0.45, eager: 0.8, stamina: 0.55, steady: 0.65, sociable: 0.55, curious: 0.5 },
		// Joins without binding: lays a tress in with the others and keeps a space between them.
		{ name: "Loom", air: 0.5, water: 0.55, eager: 0.5, stamina: 0.75, steady: 0.8, sociable: 0.8, curious: 0.5 },
		// Quiet and attentive, to pressure most of all: listens long before moving, often sounding.
		{ name: "Listener", air: 0.75, water: 0.6, eager: 0.35, stamina: 0.7, steady: 0.9, sociable: 0.4, curious: 0.85 },
		// Passion with a rudder: answers a strong wind fully, and lets it go when it has passed.
		{ name: "Sail", air: 0.9, water: 0.35, eager: 0.7, stamina: 0.55, steady: 0.6, sociable: 0.5, curious: 0.45 },
		// Constant water: holds a place a long time, keeps their own counsel without turning away.
		{ name: "Reef", air: 0.3, water: 0.85, eager: 0.4, stamina: 0.9, steady: 0.9, sociable: 0.35, curious: 0.55 },
		// For still weather: forward when little is happening; clear, and still.
		{ name: "Glass", air: 0.35, water: 0.45, eager: 0.35, stamina: 0.7, steady: 0.95, sociable: 0.35, curious: 0.45 },
		// The youngest: open to all of it, still learning to hold; carries what is given and passes
		// it on ("empty and dark shall I raise my lantern").
		{ name: "Lantern", air: 0.65, water: 0.65, eager: 0.7, stamina: 0.5, steady: 0.6, sociable: 0.65, curious: 0.8 },
		// Slow and grounding: late in, unhurried once there, a weight the others steady themselves by.
		{ name: "Ballast", air: 0.3, water: 0.75, eager: 0.3, stamina: 0.85, steady: 0.95, sociable: 0.6, curious: 0.35 },
		// A dreamer, who wanders in thought and not in hand: goes where the others are and sees what
		// they miss ("life, and all that lives, is conceived in the mist and not in the crystal").
		{ name: "Mist", air: 0.55, water: 0.6, eager: 0.45, stamina: 0.6, steady: 0.65, sociable: 0.7, curious: 0.8 },
	];
	// One of them, more likely the more a weight favours them.
	const pick = <T>(from: T[], weight: (one: T) => number) => {
		const weights = from.map((one) => Math.max(0.01, weight(one)));
		let at = Math.random() * weights.reduce((sum, one) => sum + one, 0);
		for (let i = 0; i < from.length; i++) {
			at -= weights[i]!;
			if (at <= 0) return from[i]!;
		}
		return from[from.length - 1]!;
	};
	// How well the weather just now suits one of them: what it is doing in their element, their
	// readiness, and, when little is happening, how steady they are.
	type Calls = { air: number; water: number; need: number };
	const suits = (member: number, calls: Calls) => {
		const temper = TEMPERS[member]!;
		return 0.25 + 0.5 * temper.eager + 2 * (calls.air * temper.air + calls.water * temper.water) + 0.8 * (1 - Math.max(calls.air, calls.water, calls.need)) * temper.steady;
	};
	// Who is at the front, as places in CREW, and how strong each seat's occupant is. Whoever is
	// strongest of the four always sits second from the right; the rest sit by strength.
	// (Who of the twelve is beside the strongest as the page opens is different every time: there
	// are thirteen of them, and the owner saw the same opening on every visit.)
	let atFront = [0, ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].sort(() => Math.random() - 0.5).slice(0, 3).sort((a, b) => a - b)];
	const seatStrength = [CREW[atFront[2]!]!, CREW[atFront[1]!]!, 1, CREW[atFront[3]!]!];
	const SEATS_BY_STRENGTH = [STRONGEST, 1, 0, 3];
	const memberAt = (seat: number) => atFront[SEATS_BY_STRENGTH.indexOf(seat)]!;
	// While someone is changing places, their seat's weave is let go; the newcomer begins afresh.
	const changingUntil = [0, 0, 0, 0];
	let nextTurn = between(20, 110);
	const takeTurns = (delta: number, time: number, linkedAll: boolean, calls: Calls) => {
		// (Nobody changes places while all thirteen are linked.)
		if (linkedAll) nextTurn = Math.max(nextTurn, time + 20);
		if (time > nextTurn) {
			// One of the four is relieved by one of the nine. Who goes and who comes is a matter of
			// temperament and of the weather: the one with least stamina, or least suited to what is
			// happening, goes; the one it suits best is likeliest to come.
			// (Never the strongest, who is always at the front: only ever below, or looking into something.)
			const relieved = atFront.filter((member) => member !== 0);
			const leaving = pick(relieved, (member) => 1.2 - TEMPERS[member]!.stamina + 1 / (0.5 + suits(member, calls)));
			const resting = CREW.map((_, member) => member).filter((member) => !atFront.includes(member));
			const arriving = pick(resting, (member) => suits(member, calls));
			atFront = atFront.map((member) => (member === leaving ? arriving : member)).sort((a, b) => CREW[b]! - CREW[a]!);
			changingUntil[SEATS_BY_STRENGTH[atFront.indexOf(arriving)]!] = time + 3;
			// The next change comes sooner when those at the front tire quickly.
			const lasting = atFront.filter((member) => member !== 0).reduce((sum, member) => sum + TEMPERS[member]!.stamina, 0) / 3;
			nextTurn = time + between(60, 130) * (0.5 + lasting);
		}
		// (Eased, so that a seat's strength does not jump when its occupant changes.)
		atFront.forEach((member, rank) => {
			const seat = SEATS_BY_STRENGTH[rank]!;
			// All thirteen linked, their strength is pooled: no tress is the weaker one.
			const strength = linkedAll ? 1 : CREW[member]!;
			seatStrength[seat] = seatStrength[seat]! + (strength - seatStrength[seat]!) * Math.min(1, delta / (linkedAll ? 6 : 3));
		});
	};

	// Anything out of the ordinary in the wind, the waves or the weather (`unusual`, from the data):
	// the strongest is the first to look into it (the owner's). The strongest lets their own tress go and sends
	// an investigative weave, up into the air (the scout's weave, from their seat) or down into the
	// water (a sounding, alone), whichever it is in, for ten to sixteen seconds. Then the strongest channels
	// with it: see `update`. It happens once for each occurrence, and again if it passes from the
	// air to the water or back.
	let responding = false;
	let wasProbing = false;
	let lookedInto: "air" | "water" | undefined;
	let probesUntil = 0;
	const tendOccurrence = (delta: number, time: number, noticed: { air: number; water: number }) => {
		// (Only as much of it as the strongest attends to.)
		const air = noticed.air * TEMPERS[0]!.air;
		const water = noticed.water * TEMPERS[0]!.water;
		const level = Math.max(air, water);
		const kind = air >= water ? "air" : "water";
		if (level < 0.3) {
			responding = false;
			lookedInto = undefined;
		} else if (level > 0.5 && lookedInto !== kind && time > probesUntil) {
			responding = true;
			lookedInto = kind;
			probesUntil = time + between(10, 16);
		}
		return responding && time < probesUntil ? lookedInto : undefined;
	};

	// Now and then, while the boat is being slowed, the strongest take that work over from the
	// weaker ones for half a minute or so (the owner's: the pilgrimage is so sacred). The strongest
	// seat at the front is then empty, and the sea about the boat is dappled (see `deepMaster`).
	let masters = 0;
	let alwaysMasters = false;
	let mastersFrom = between(25, 55);
	let mastersUntil = 0;
	const tendMasters = (delta: number, time: number, slowing: number, below: number) => {
		if (slowing <= 0.02) {
			// Nothing to slow: the next time is counted from when there is.
			mastersFrom = Math.max(mastersFrom, time + 20);
			mastersUntil = 0;
		} else if (time > mastersFrom) {
			mastersUntil = time + between(30, 45);
			mastersFrom = mastersUntil + between(90, 200);
		}
		// (?show=masters keeps them at it, for looking at.)
		const visiting = time < mastersUntil || alwaysMasters;
		// How much of the strongest's strength is below is a matter of what the sea asks (`below`,
		// from the weather data): a steady share. On top of that they still go down wholly now and
		// then, whatever the share, for the pilgrimage's sake.
		const share = visiting ? 1 : below;
		masters += (share - masters) * Math.min(1, delta / (share > masters ? 5 : 8));
		// The strongest leaves the seat at the front only when most of their strength is below.
		return masters > 0.6;
	};

	// Each channeller's weaving. `head` is how far the weave now in their hands has run out from
	// the boat. When they let go, that weave is cut at the boat and becomes one cut loose: `tail` is
	// how far its cut end has travelled out (NONE when there is no such weave) and `linger` how far
	// it has faded on the horizon. A weave is never wiped away where it lies (the owner's rule):
	// cut loose, it goes on at its own pace, lingers far out, soft and run together, and fades slowly.
	const weaving = [false, false, false, false];
	const head = [0, 0, 0, 0];
	const NONE = 2;
	const tail = [NONE, NONE, NONE, NONE];
	const linger = [0, 0, 0, 0];
	// Seconds for a weave to run out from the boat to its far end.
	const RUNS_OUT_IN = 2.6;
	// How fast a cut end travels, as a share of the weave's length a second (in a moderate sea):
	// the pace of what streams along the weave, so that it is seen leaving, not snatched away.
	const CUT_TRAVELS = 0.055;
	// How far along the cut end is when the loose weave begins to linger and fade, and for how many seconds.
	const LINGERS_FROM = 0.84;
	const LINGERS_FOR = 26;
	// Past the far end of a thread, so that a weave fully run out is whole.
	const ALL = 1.1;
	// True until they have been seen at work once: the page opens on weaving already under way.
	let opening = true;
	// The brightness the weaving last had, kept while a cut is travelling.
	let lastStrength = 0;

	// Where the middle of the joined flow is, in the world, at a distance ahead of the boat: the
	// same as channelFlow and channelRise in the shader, worked out here for the air simulation,
	// which needs to know where the flow lies on the screen.
	const flowPoint = (ahead: number, target: THREE.Vector3) => {
		const t = sea.channelTime.value;
		const q = Math.log(ahead + 12);
		const way = Math.min(1, Math.max(0, Math.log(Math.max(ahead, 40) / 40) / Math.log(3300 / 40)));
		const wander = 0.075 * Math.sin(q * 1.25 - t * 0.06 + 0.6) + 0.03 * Math.sin(q * 2.6 + t * 0.09 + 2) + 0.012 * Math.sin(q * 5.1 - t * 0.2);
		const wind = sea.channelWind.value;
		const gust = 1 + 0.4 * wind.y * Math.sin(t * 0.5 - q * 1.5) + 0.2 * wind.y * Math.sin(t * 1.3 - q * 3.1);
		const side = ahead * (wander + wind.x * (0.04 + 0.12 * way) * gust) * THREE.MathUtils.smoothstep(ahead, 0, 30);
		const rise = 0.06 * (1 - 0.92 * surge) * (1 - sea.channelHold.value) * ahead * Math.sin(Math.PI * way ** 0.7) ** 1.5;
		return target.set(camera.position.x + side, 1.3 + rise, camera.position.z - ahead);
	};

	const update = ({ time, delta, energy, waveHeight, need, hold: slowing, current, control, scout, showMasters, showSoundings, showOnly, hands, gathering, soften, tending, day, pressure, wind, heave, swellFrom, white, unusual, below, aloft, slowToRise, thermal, strength, gain }: ChannellerState) => {
		// (`byDay` is from when this was only done by day. It is now every hour but dawn and dusk.)
		const byDay = tending > 0.5 && control <= 0.05;
		// (As it comes in, `strength` is how far it is one of the nights without a moon.)
		const moonless = strength;
		const linkedAll = gathering > 0.05 && !byDay;
		const probing = tendOccurrence(delta, time, unusual);
		if (byDay && day > 0.5 && time > skyFrom) {
			skyUntil = time + between(25, 40);
			skyFrom = skyUntil + between(50, 120);
		}
		// (The readers at the front now do the seeking into the day sky; the scout is the night's.)
		const seeking = 0;
		// (Not while all thirteen are in the dawn or dusk link, when there is nobody free to send it
		// up; nor in a storm, which would tear it, and when every hand is wanted on the waves.)
		const sparing = (1 - THREE.MathUtils.smoothstep(gathering, 0.05, 0.3)) * (1 - THREE.MathUtils.smoothstep(control, 0.05, 0.3));
		tendScout(delta, time, (probing === "air" ? 1 : Math.max(scout * (1 - gathering), seeking)) * sparing, aloft, slowToRise, wind.gust, thermal, probing === "air");
		const calls = { air: unusual.air, water: unusual.water, need };
		takeTurns(delta, time, linkedAll, calls);
		// (Nor does anyone sound the water in a storm: they let go, as for the dawn and dusk link.)
		tendSoundings(delta, time, thermal, showSoundings === true, linkedAll || control > 0.05, probing === "water" && control <= 0.05, calls);
		// Slowing the boat is not the work of the four at the front. The weaker ones do it, with deep
		// weaves close round the boat (drawn in the water: `deepWeave` in gerstner-waves.ts). So the
		// weaving ahead goes on as it otherwise would, with its story, however the boat is held.
		const hold = 0;
		alwaysMasters = showMasters === true;
		const mastersBelow = tendMasters(delta, time, linkedAll ? 0 : slowing, linkedAll ? 0 : below);
		// What is given below is not given ahead: the linked flow is driven that much less hard.

		// The story only runs on their nights, and starts from its beginning on each.
		// Holding the boat back is not part of the story: it is steady work, for as long as the sea
		// would carry them too fast, by as many of them as it takes. The story starts afresh after it.
		// Nor is a storm: then all four are linked for as long as it lasts, and work on the waves.
		// Something out of the ordinary calls them whatever the hour or the moon. While the strongest
		// is still looking into it, nobody begins anything on its account.
		const answering = responding && !probing;
		if (answering) strength = Math.max(strength, 0.8);
		if (byDay) strength = Math.max(strength, (0.95 - 0.2 * day) * tending);
		const called = strength > 0.12;
		// By day, when the strongest has found what it is, they all link on it at once.
		const found = wasProbing && !probing;
		if (found && called && !byDay) {
			// The strongest has found what it is, and now channels with it: beginning alone, at once, and the
			// others come in afterwards as the sea and wind call for (the story's own second part).
			part = "stopped";
			since = 0;
			lasts = 0;
			surge = 0;
		}
		wasProbing = probing !== undefined;
		if (called && byDay) tend(delta, found, { heave, energy, need, pressure, wind, thermal, current, swellFrom }, showOnly);
		else if (called && linkedAll && control <= 0.05) {
			// Dawn or dusk: all linked, drawing on what is in the air. It is not force for the sea's
			// sake, so the flow is not driven harder than the sea and wind call for.
			want.fill(true);
			surge += (0.35 + 0.45 * need - surge) * Math.min(1, delta / 4);
			part = "opening";
			since = 0;
		} else if (called && control > 0.05) {
			want.fill(true);
			surge += (1 - surge) * Math.min(1, delta / 1.6);
			part = "opening";
			since = 0;
		} else if (called && hold > 0.02) {
			for (let who = 0; who < CHANNELLERS; who++) want[who] = ORDER.indexOf(who) < workingFor(0.2 + hold);
			surge += (0 - surge) * Math.min(1, delta / 0.4);
			part = "opening";
			since = 0;
		} else if (called) tell(delta, need);
		else {
			// Nothing calls for them (day has come, or the sea has eased): whatever is still out is cut off.
			want.fill(false);
			part = "opening";
			since = 0;
			lasts = between(3, 5);
			surge += (0 - surge) * Math.min(1, delta / 0.4);
			linking = false;
		}
		for (let who = 0; who < CHANNELLERS; who++) {
			if (time < changingUntil[who]!) want[who] = false;
			// The strongest is looking into something: their own tress is not out.
			if (who === STRONGEST && probing) want[who] = false;
			// The strongest is at the deep weaving, not at the front.
			if (who === STRONGEST && mastersBelow) want[who] = false;
			if (want[who] && !weaving[who]) {
				weaving[who] = true;
				// (As the page opens, most weaves are already out; one or another is only just begun.)
				head[who] = !opening ? 0 : Math.random() < 0.65 ? ALL : between(0, 0.5);
			} else if (!want[who] && weaving[who]) {
				// Let go: what was in hand is cut at the boat and is on its own from here.
				weaving[who] = false;
				head[who] = 0;
				tail[who] = 0;
				linger[who] = 0;
			}
			if (weaving[who]) {
				head[who] = Math.min(ALL, head[who]! + (delta * hand[who]!.pace) / RUNS_OUT_IN);
				// A new weave that reaches the one cut loose before it takes it up again.
				if (tail[who]! < NONE && head[who]! >= tail[who]! - 0.06) {
					tail[who] = NONE;
					linger[who] = 0;
				}
			}
			if (tail[who]! < NONE) {
				if (tail[who]! < LINGERS_FROM) tail[who] = tail[who]! + delta * hand[who]!.pace * CUT_TRAVELS * (0.6 + 1.2 * energy) * (1 + 1.6 * reading);
				else {
					tail[who] = tail[who]! + delta * 0.008;
					linger[who] = linger[who]! + delta / LINGERS_FOR;
					if (linger[who]! >= 1) {
						tail[who] = NONE;
						linger[who] = 0;
					}
				}
			}
			// While any of a weave is left, in hand or loose, it keeps its full form.
			gate[who] = weaving[who] || tail[who]! < NONE ? 1 : 0;
		}
		const any = gate.some((there) => there > 0);
		if (called) {
			opening = false;
			lastStrength = strength;
		} else if (!any) opening = true;
		mesh.visible = any;
		sea.channelGate.value.fromArray(gate);
		sea.channelOwn.value.fromArray(seatStrength);
		sea.channelHead.value.fromArray(head);
		sea.channelTail.value.fromArray(tail);
		sea.channelLinger.value.fromArray(linger);
		// What the strongest give below is not given ahead: the linked flow is driven that much less hard.
		sea.channelSurge.value = surge * (1 - masters);
		// At any other hour they are one flow, as they always were.
		if (!byDay) {
			link += (1 - link) * Math.min(1, delta / 1.5);
			mended.forEach((one) => (one.growing = false));
		}
		sea.channelLink.value = link;
		// (Wholly the one or the other but for a second or two between: a weave half-way between its
		// reading's form and the flow is neither.)
		// (The turn between the two runs out along the weaves from the boat: see `turned`.)
		if ((byDay && !linked) !== toReading) {
			toReading = !toReading;
			front = Math.max(0, 1.6 - front);
		}
		front = Math.min(1.6, front + (delta * 1.6) / (byDay ? TURNS_IN : 1.5));
		uniforms.uToReading.value = toReading ? 1 : 0;
		uniforms.uFront.value = front;
		const apart = byDay && !linked ? 1 : 0;
		reading += Math.sign(apart - reading) * Math.min(Math.abs(apart - reading), delta / 4);
		const together = byDay && linked ? 1 : 0;
		healing += Math.sign(together - healing) * Math.min(Math.abs(together - healing), delta / 4);
		sea.channelReading.value = reading;
		sea.channelHeal.value = healing;
		tendMended(delta, current);
		seats.forEach((seat, who) => {
			uniforms.uAct.value.setComponent(who, seat.act);
			uniforms.uWas.value.setComponent(who, seat.was);
			uniforms.uBearing.value.setComponent(who, seat.bearing);
			// (Eased at both ends: a turn begins and ends gently.)
			uniforms.uTurn.value.setComponent(who, seat.turn * seat.turn * (3 - 2 * seat.turn));
			uniforms.uAge.value.setComponent(who, seat.age);
		});
		uniforms.uPressure.value += (pressure - uniforms.uPressure.value) * Math.min(1, delta / 4);
		uniforms.uWindView.value.set(wind.across, wind.away, wind.force);
		uniforms.uFlap.value += delta * (1 + 4.5 * wind.force);
		uniforms.uWarm.value += (thermal - uniforms.uWarm.value) * Math.min(1, delta / 4);
		for (let seat = 0; seat < CHANNELLERS; seat++) {
			// What each is reading: the air (pressure, wind) or the water.
			sea.channelInto.value.setComponent(seat, into[seat]!);
			uniforms.uSeatElement.value.setComponent(seat, seat === STRONGEST ? 0 : seats[seat]!.act > 0.5 ? 1 : 4);
		}
		uniforms.uDay.value = day;
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
		// No more light than the work calls for. (A weave being cut keeps the light it had.)
		uniforms.uStrength.value = (called ? strength : lastStrength) * (0.45 + 0.55 * Math.max(need, hold, control, gathering));
		// (Tending by night, each alone, there is far less light out than when the four were one
		// flow, and it could hardly be seen: so each weave is given more.)
		// (And three times as much again on a night without a moon, when the picture is shown at so
		// low an exposure that their light all but vanished.)
		if (byDay) uniforms.uStrength.value *= (1 + 1.6 * (1 - day) * (1 - 0.6 * link)) * (1 + 1.2 * moonless * (1 - day));
		uniforms.uSoften.value = soften;
		for (let seat = 0; seat < CHANNELLERS; seat++) {
			// (When another takes the seat their restlessness comes on over a few seconds, not at once.)
			const was = uniforms.uRestless.value.getComponent(seat);
			const restless = restlessSet ? was + (1 - TEMPERS[memberAt(seat)]!.steady - was) * Math.min(1, delta / 3) : 1 - TEMPERS[memberAt(seat)]!.steady;
			uniforms.uRestless.value.setComponent(seat, restless);
			uniforms.uWanderX.value.setComponent(seat, uniforms.uWanderX.value.getComponent(seat) + delta * (0.14 + 0.2 * restless));
			uniforms.uWanderY.value.setComponent(seat, uniforms.uWanderY.value.getComponent(seat) + delta * (0.11 + 0.16 * restless));
		}
		restlessSet = true;
		handsOn = hands === true;
		hand.forEach((one, seat) => {
			const temper = TEMPERS[memberAt(seat)]!;
			const want = handsOn
				? { pace: 0.8 + 0.45 * temper.eager, carry: temper.air - temper.water, open: 0.65 + 0.8 * temper.sociable, loose: 1 - temper.steady }
				: { pace: 1, carry: 0, open: 1, loose: 0.5 };
			const ease = one.set ? Math.min(1, delta / 3) : 1;
			one.pace += (want.pace - one.pace) * ease;
			one.carry += (want.carry - one.carry) * ease;
			one.open += (want.open - one.open) * ease;
			one.loose += (want.loose - one.loose) * ease;
			one.set = true;
			uniforms.uCarry.value.setComponent(seat, one.carry);
			uniforms.uOpen.value.setComponent(seat, one.open);
			uniforms.uLoose.value.setComponent(seat, one.loose);
			uniforms.uTempo.value.setComponent(seat, uniforms.uTempo.value.getComponent(seat) + delta * one.pace);
		});
		uniforms.uWhite.value = white;
		uniforms.uGain.value = gain;
		uniforms.uResolution.value.set(window.innerWidth, window.innerHeight).multiplyScalar(uniforms.uPixelRatio.value);
		// 0..1 how much channelling there is, and how hard it is driven.
		// How strongly the flow is taking the air with it: only where it is one flow (not held back
		// in four), and with the force it is driven by.
		const pull = weaving.some(Boolean) ? Math.max(...gate) * (called ? strength : lastStrength) * (0.5 + 0.5 * Math.max(need, control, gathering)) * (1 - hold) : 0;
		// (`anything`: 1 while any weave at all is out, the scout's and the soundings' too. The boat's
		// lamps are only the light there is when nobody is channelling.)
		return { told, working: any ? 1 : 0, anything: any || scoutMesh.visible || soundingMesh.visible ? 1 : 0, surge: surge * (1 - masters), pull, flowPoint, masters };
	};

	// The elements' colours, as the owner picks them (CSS colours, as seen on a screen).
	const setColours = (colours: ElementColours) => {
		[colours.air, colours.water, colours.akasha, colours.strongest].forEach((colour, i) => uniforms.uSheath.value[i]!.set(colour));
	};
	setColours(ELEMENT_COLOURS);
	return { update, setColours };
}
