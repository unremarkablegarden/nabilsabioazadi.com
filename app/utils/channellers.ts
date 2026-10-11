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
// And each tress has halos: soft doubles of some of its filaments, lying almost but not quite
// on them. They are the blur about a filament: light that has not settled where the filament is.
const HALOS = 28;
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
// 0..1 how light the sky is. Against a light sky a fine bright line reads as a wire, so there
// each filament is drawn broad and soft and fainter: a breath of light, not a line.
uniform float uSoften;
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
varying float vWhite;
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
	// (In the trial, a strong channeller's tress is taut: its filaments hardly stray.)
	float skill = channelOf( channelOwn, who ) * channelLoss;
	across += aSeed.w * 0.55 * ( 1.0 - 0.75 * skill ) * ( 1.0 - 0.6 * channelHold ) * ( 1.0 - 0.85 * smoothstep( 0.3, 0.8, way ) ) * vec2(
		drift( q * 2.3 + aSeed.x * 40.0 - channelTime * 0.22 ),
		drift( q * 2.9 + aSeed.y * 40.0 + channelTime * 0.17 )
	);
	// What is spent shows as trembling, finer and quicker than the wandering, and worse with
	// distance; where the tress has gathered itself the trembling stops and the strays are drawn in.
	float lost = spent( along );
	float held = gathered( who, q ) * ( 0.5 + 0.5 * lost );
	across += 0.16 * lost * ( 1.0 - held ) * ( 1.0 - 0.8 * skill ) * vec2(
		kink( q * 37.0 + aSeed.x * 211.0 - channelTime * 3.1 ),
		kink( q * 41.0 + aSeed.y * 173.0 + channelTime * 2.7 )
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
	// (Lingering, each filament is broad and soft: a blur, not a line.)
	float lingering = channelPresence( aThread.x, aheadAt( aT ) ).y;
	gl_Position = ribbonPosition( clip, clipAhead, aSide, aThread.w * ( 1.0 + 4.0 * lingering + 3.0 * uSoften * ( 1.0 - aSoft ) ) );

	float ahead = max( aheadAt( aT ), 0.0 );
	float q = log( ahead + 12.0 );
	// Lit only in stretches, which run outward along it.
	float lit = smoothstep( - 0.25, 0.3, drift( q * aKind.y - ( channelStream - channelBack ) * aKind.z + aSeed.x * 91.0 ) );
	// A channeller who is giving less has fewer filaments alight, and those fainter.
	float strength = channelStrength( aThread.x );
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
	lit *= mix( 1.0, leak * ( 1.0 - 0.45 * channelSurge ), channelLoss );
	float cutAt = channelOf( channelTail, aThread.x );
	if ( cutAt < 1.09 ) lit *= 1.0 + 4.0 * channelLoss * exp( - pow( ( channelAlong( aheadAt( aT ) ) - cutAt ) / 0.035, 2.0 ) ) * ( 1.0 - channelOf( channelLinger, aThread.x ) );
	lit *= withWaves * strength * ( 1.0 - smoothstep( strength * 1.1 - 0.12, strength * 1.1, aSeed.y ) );
	// A veil does not come and go in stretches: it is a steady glow that breathes with the tress.
	if ( aSoft > 0.9 ) lit = strength * ( 0.75 + 0.25 * withWaves );
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
	// Spent, it cools towards blue; gathered, it burns white.
	vTint = mix( vTint, vec3( 0.42, 0.56, 0.9 ), 0.45 * lost * ( 1.0 - held ) );
	vTint = mix( vTint, vec3( 1.0, 0.98, 0.94 ), 0.7 * held );
	// Held back, it takes the sea's own deeper blue.
	vTint = mix( vTint, vec3( 0.46, 0.62, 0.88 ), 0.6 * channelHold );
	// Fainter all the way down the dive, and gone before the horizon: they must not gather
	// into a light there.
	// (Driven hard there are more filaments alight at once, so each is drawn a little fainter,
	// or their colours would burn out to white where they lie thickest.)
	vAlpha = uStrength * aKind.x * ( 1.0 - 0.4 * channelSurge ) * lit * ( 0.55 + 1.1 * channelPulse( aThread.x, ahead ) ) * smoothstep( 0.0, 0.05, aT )
		* ( 1.0 - smoothstep( 0.7, 1.0, channelWay( ahead ) ) * ( 1.0 - 0.8 * lingering ) ) / ( 1.0 + ahead / 1500.0 ) / ( 1.0 + 2.0 * lingering ) / ( 1.0 + 1.6 * uSoften );
	vEdge = aSide;
	vSoft = max( aSoft, max( lingering, 0.9 * uSoften ) );
	// The strongest's own weaves show white against anything. By day they are not thinned away
	// with the rest, or there would be nothing to turn the sky white with.
	vWhite = aThread.x > ${STRONGEST - 0.5} && aThread.x < ${STRONGEST + 0.5} ? 1.0 : 0.0;
	vAlpha *= mix( 1.0, 1.0 + 0.7 * uSoften, vWhite * ( 1.0 - aSoft ) );
}
`;

const fragmentShader = /* glsl */ `
uniform float uGain;
uniform float uSoften;
uniform float uWhite;
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;
varying float vSoft;
varying float vWhite;

void main() {
	// A filament has a hard edge, softened by no more than it takes to stop it shimmering.
	// A veil has none: it is brightest along its middle and fades away to both sides.
	float edge = mix( 1.0 - smoothstep( 0.55, 1.0, abs( vEdge ) ), pow( 1.0 - vEdge * vEdge, 2.0 ), vSoft );
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
	gl_FragColor = vec4( mix( gl_FragColor.rgb, pale * uWhite, vWhite ) * amount, amount * vWhite );
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
const SCOUT_FILAMENTS = 40;
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
uniform float uTime;
uniform float uStrength;
// How far it has run up from the boat; how far the cut has travelled up it once let go (past
// the end when there is none); and 0..1 how far a weave let go has faded.
uniform float uHead;
uniform float uTail;
uniform float uFade;
// Tomorrow's wind as seen from the boat: x how much it will blow to the right across the view,
// y how much away from the viewer, both scaled by how strong it will be (0..1).
uniform vec2 uLean;
// Where along the boat's rail it is sent up from (metres right of the middle), and how light
// the sky is (see uSoften in the main weaving).
uniform float uSeat;
uniform float uSoften;
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

// The filaments hunt in companies, not one by one: five loose tresses of them.
float scoutCompany() {
	return floor( aSeed.x * 5.0 );
}

// 0..1 how far this filament's company is dispersed just now. The weaving breathes: over about
// forty seconds the companies are let go to hunt, one after another, and are then drawn back in.
float scoutSpread() {
	if ( aSoft > 0.9 ) return 0.0;
	float breath = 0.5 - 0.5 * cos( uTime * 0.16 );
	float turn = scoutCompany() / 4.0;
	return smoothstep( turn * 0.4, turn * 0.4 + 0.5, breath );
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
	vec3 p = vec3( uSeat, mix( cameraPosition.y - 1.2, 1.4, smoothstep( 0.0, 0.07, t ) ), - out_ );
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
	// Heated air shimmers: in a thermal the filaments quiver, quicker and finer than their wandering.
	p.xy += warm * scoutRise( t ) * 1.8 * vec2( kink( t * 60.0 + aSeed.x * 97.0 - uTime * 4.0 ), kink( t * 67.0 + aSeed.y * 89.0 + uTime * 3.6 ) );
	p.y = max( p.y, 0.5 );
	// Only then, having found the air's current, does it disperse: each company goes to hunt its
	// own quarter of the night, keeping together, questing about as it goes.
	float from = 0.3;
	float gone = max( scoutRise( t ) - from, 0.0 ) / ( 1.0 - from );
	if ( gone > 0.0 ) {
		float company = scoutCompany();
		float bearing = ( company / 4.0 - 0.5 ) * 2.1 + 0.35 * drift( uTime * 0.06 + company * 7.3 ) + 0.3 * gone * drift( gone * 2.5 + uTime * 0.1 + company * 3.1 );
		float height = 0.22 + 0.13 * mod( company * 2.0, 5.0 ) + 0.12 * drift( uTime * 0.05 + company * 11.0 );
		// Where they go when they disperse is the air's doing too. Rising air stops where it is no
		// longer warmer than what is round it, and there it can only spread sideways: at the top of
		// a thermal the companies fan out nearly level, like the flat top of a cloud. In still
		// layered air they cannot rise either, and slide out along the layers, one above another.
		height = mix( height, 0.03 + 0.035 * company, 0.85 * max( warm, still ) );
		// Each filament a little off its company's line.
		bearing += ( aSeed.y - 0.5 ) * 0.2;
		height += ( fract( aSeed.x * 5.0 ) - 0.5 ) * 0.12;
		vec3 own = scoutStem( 0.62 ) + vec3( sin( bearing ) * cos( height ), sin( height ), - cos( bearing ) * cos( height ) ) * 300.0 * gone;
		// Where tomorrow's wind will blow, the hunters are carried that way.
		own.x += uLean.x * 130.0 * gone;
		own.z -= uLean.y * 100.0 * gone;
		p = mix( p, own, scoutSpread() * smoothstep( 0.0, 0.25, gone ) );
	}
	return vec3( cameraPosition.x, 0.0, cameraPosition.z ) + p;
}

void main() {
	mat4 viewProjection = projectionMatrix * viewMatrix;
	vec4 clip = viewProjection * vec4( scoutPoint( aT ), 1.0 );
	vec4 clipAhead = viewProjection * vec4( scoutPoint( aT + 0.004 ), 1.0 );
	// Let go, it lingers soft and broad like any weave cut loose.
	float loose = uTail < 1.09 ? smoothstep( uTail - 0.2, uTail, aT ) : 0.0;
	float inHand = 1.0 - smoothstep( uHead - 0.05, uHead, aT );
	float lingering = loose * uFade * ( 1.0 - inHand );
	gl_Position = ribbonPosition( clip, clipAhead, aSide, aKind.w * ( 1.0 + 3.0 * lingering + 3.0 * uSoften * ( 1.0 - aSoft ) ) );

	// The light in it runs downward: what is sensed comes back to the one who sent it.
	float lit = smoothstep( - 0.2, 0.35, drift( aT * aKind.y + uTime * aKind.z + aSeed.x * 91.0 ) );
	if ( aSoft > 0.9 ) lit = 0.8;
	float there = max( inHand, loose * pow( 1.0 - uFade, 1.5 ) );
	// Pale, and bluer and fainter the higher it goes; gone before its top.
	vTint = mix( vec3( 0.84, 0.9, 1.0 ), vec3( 0.52, 0.66, 0.96 ), aT );
	// Each is faint, a thread in the dark. Gathered, forty lie on one line, so each is drawn fainter
	// still, or the stem would stand in the sky as a bar of light.
	vAlpha = uStrength * aKind.x * lit * there * mix( 0.16, 0.6, scoutSpread() * smoothstep( 0.3, 0.6, scoutRise( aT ) ) ) * smoothstep( 0.0, 0.06, aT ) * ( 1.0 - smoothstep( 0.62, 0.98, aT ) ) / ( 1.0 + 1.5 * lingering ) / ( 1.0 + 1.6 * uSoften );
	vEdge = aSide;
	vSoft = max( aSoft, max( lingering, 0.9 * uSoften ) );
	// The strongest's own weaves show white against anything. By day they are not thinned away
	// with the rest, or there would be nothing to turn the sky white with.
	vWhite = uOwn;
	vAlpha *= mix( 1.0, 1.0 + 0.7 * uSoften, vWhite * ( 1.0 - aSoft ) );
}
`;

// Soundings (the owner's). Every now and then three or four of the channellers feel the water:
// its temperature and its currents. Each sends a tress of fine filaments, plaited in three, out
// low over the sea ahead; it slips under the surface, quests about down there, comes up again
// and returns to the boat. None of it is drawn to a pattern, and no two do it alike:
//   each begins when they are ready, reaches as far as they can, holds as long as they need,
//                  and lets go in their own time;
//   together       at times their tresses are laid in one and wound round each other on the way
//                  out, but under water they part, each to feel its own quarter;
//   in the water   it runs shallow, just under the mean surface, so the real waves cover it and
//                  their troughs uncover it: it ducks in and out as the sea moves. The real
//                  current carries it, further the longer it has been under. In water warmer than
//                  the air the plait slackens, lifts and shimmers; in colder it draws tight and
//                  lies deeper.
//   coming back    what was felt runs along it towards the hands, and its colour leans a little
//                  to the water's warmth or cold.
// It is a light touch and is drawn as one: faint threads, nothing near the bow.
const SOUNDERS = 4;
const SOUNDING_FILAMENTS = 15;
const SOUNDING_SEGMENTS = 220;

const soundingVertexShader = /* glsl */ `
attribute float aT;
attribute float aSide;
// Which sounder (0..3), which strand of the plait (0..2), a random number, width in pixels.
attribute vec4 aBraid;
// Brightness, how many lit stretches along its length, how fast they travel, and how far off its
// strand's line it lies (-1..1).
attribute vec4 aKind;
uniform float uTime;
uniform float uStrength;
// For each sounder: how far their tress has run round its loop, and how far the cut has followed
// once they let go (past the end when there is none).
uniform vec4 uHead;
uniform vec4 uTail;
uniform float uSoften;
// 1 when the strongest is sounding alone: that tress is their own weave.
uniform float uOwn;
// 0..1 how far they are doing it together just now.
uniform float uTogether;
uniform float uThermal;
uniform float channelCurrent;
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

float ofSounder( vec4 each, float who ) {
	return who < 0.5 ? each.x : who < 1.5 ? each.y : who < 2.5 ? each.z : each.w;
}

// 0..1 how far a point along the loop is under the sea. Each goes in and comes out where it will.
float soundingUnder( float t, float who ) {
	float enters = 0.25 + 0.05 * hash1( who * 3.7 + 1.0 );
	float leaves = 0.75 - 0.06 * hash1( who * 5.3 + 2.0 );
	return smoothstep( enters - 0.06, enters + 0.06, t ) * ( 1.0 - smoothstep( leaves - 0.06, leaves + 0.06, t ) );
}

// The line one sounder's tress lies along, relative to the boat.
vec3 soundingStem( float t, float who ) {
	float under = soundingUnder( t, who );
	float warm = max( uThermal, 0.0 );
	float still = max( - uThermal, 0.0 );
	// Together in the air; under water each feels its own quarter.
	float held = uTogether * ( 1.0 - 0.7 * under );
	float own = ( who - 1.5 ) * 0.36 + 0.14 * drift( uTime * 0.04 + who * 7.1 );
	float bearing = mix( own, 0.1 * drift( uTime * 0.03 ), held );
	float reach = mix( 34.0 + 30.0 * hash1( who * 9.1 + 0.5 ), 50.0, held );
	vec2 out_ = vec2( sin( bearing ), - cos( bearing ) );
	vec2 across = vec2( - out_.y, out_.x );
	// Out along one side and back along the other: which side, and how wide, is each one's own.
	float arc = sin( 3.14159 * t );
	float aside = reach * ( 0.16 + 0.1 * hash1( who * 2.3 ) ) * sin( 6.28319 * t ) * ( hash1( who * 4.9 ) < 0.5 ? 1.0 : - 1.0 );
	// Under water it quests about.
	aside += under * 3.0 * drift( t * 5.0 + uTime * 0.07 + who * 13.0 );
	vec2 level = vec2( ( who - 1.5 ) * 1.5, 0.0 ) * ( 1.0 - arc ) + out_ * reach * arc + across * aside;
	// The current carries it, further the longer it has been under, and it is drawn back against
	// the current as it comes home.
	float carried = smoothstep( 0.25, 0.75, t );
	level.x += channelCurrent * 16.0 * carried * carried * ( 1.0 - smoothstep( 0.78, 1.0, t ) );
	// Together, the tresses wind round one another.
	float wind = t * 14.0 - uTime * 0.2 + who * 1.5708;
	vec2 wound = vec2( cos( wind ), sin( wind ) ) * 0.55 * held * arc;
	// Low over the sea, not arched high; and shallow under it, where the real waves cover and
	// uncover it. Warm water lifts it; cold lets it lie deeper.
	float air = 1.0 + 0.6 * arc + 0.5 * drift( t * 3.0 + who * 5.0 + uTime * 0.05 );
	float depth = 0.45 + 0.5 * still - 0.25 * warm + 0.3 * drift( t * 7.0 + uTime * 0.09 + who * 3.0 );
	vec3 p = vec3( level.x + across.x * wound.x, mix( air + wound.y, - depth, under ), level.y + across.y * wound.x );
	// It leaves from, and returns to, hands held a little below the eye.
	p.y = mix( cameraPosition.y - 1.2, p.y, smoothstep( 0.0, 0.16, t ) * smoothstep( 1.0, 0.84, t ) );
	return p;
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
	float phase = t * 40.0 - uTime * 0.4 + aBraid.y * 2.0944;
	vec2 off = vec2( sin( phase ), 0.5 * sin( 2.0 * phase ) ) * 0.26 * slack;
	// Each filament a little off its strand's line, and looser under water.
	float turn = aBraid.z * 41.0 + t * ( 6.0 + 5.0 * aBraid.z ) - uTime * 0.15;
	off += aKind.w * vec2( cos( turn ), sin( turn ) ) * ( 0.07 + 0.4 * under * ( 0.6 + warm ) );
	// Warm water shimmers.
	off += warm * under * 0.12 * vec2( kink( t * 70.0 + aBraid.z * 97.0 - uTime * 3.0 ), kink( t * 77.0 + aBraid.z * 89.0 + uTime * 2.6 ) );
	off *= ends;
	p.xz += across * off.x;
	p.y += off.y;
	return vec3( cameraPosition.x + p.x, p.y, cameraPosition.z - 2.0 + p.z );
}

void main() {
	mat4 viewProjection = projectionMatrix * viewMatrix;
	vec4 clip = viewProjection * vec4( soundingPoint( aT ), 1.0 );
	vec4 clipAhead = viewProjection * vec4( soundingPoint( aT + 0.004 ), 1.0 );
	float who = aBraid.x;
	float head = ofSounder( uHead, who );
	float tail = ofSounder( uTail, who );
	float inHand = 1.0 - smoothstep( head - 0.06, head, aT );
	// Let go at the hands, the cut follows round; what is just ahead of it goes soft and broad.
	float cut = tail < 1.5 ? 1.0 : 0.0;
	float kept = mix( 1.0, smoothstep( tail - 0.1, tail + 0.02, aT ), cut );
	float loose = cut * ( 1.0 - smoothstep( tail, tail + 0.3, aT ) );
	gl_Position = ribbonPosition( clip, clipAhead, aSide, aBraid.w * ( 1.0 + 2.5 * loose + 3.0 * uSoften ) );
	// What is felt runs along it towards the hands.
	float lit = smoothstep( - 0.25, 0.4, drift( aT * aKind.y - uTime * aKind.z + aBraid.z * 91.0 ) );
	// Going out it is the pale of any weave. Coming back it leans to the water's warmth or cold.
	vec3 pale = vec3( 0.8, 0.88, 1.0 );
	vec3 felt = uThermal > 0.0 ? mix( pale, vec3( 1.0, 0.82, 0.64 ), 0.6 * uThermal ) : mix( pale, vec3( 0.5, 0.72, 1.0 ), - 0.6 * uThermal );
	vTint = mix( pale, felt, smoothstep( 0.3, 0.65, aT ) );
	// Nothing near the bow: it is seen from where it nears the water.
	float away = smoothstep( 0.05, 0.2, aT ) * smoothstep( 0.95, 0.8, aT );
	vAlpha = uStrength * aKind.x * lit * inHand * kept * away / ( 1.0 + 1.5 * loose ) / ( 1.0 + 1.6 * uSoften );
	vEdge = aSide;
	vSoft = max( loose, 0.9 * uSoften );
	// The strongest's own weaves show white against anything. By day they are not thinned away
	// with the rest, or there would be nothing to turn the sky white with.
	vWhite = uOwn * step( ${STRONGEST - 0.5}, who ) * step( who, ${STRONGEST + 0.5} );
	vAlpha *= mix( 1.0, 1.0 + 0.7 * uSoften, vWhite );
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
	// 0..1 how far it is dawn or dusk. Then all thirteen link (the owner's): it is when there is
	// most qi in the air for them to draw upon. Nobody is below, sounding or scouting: all are in it.
	gathering: number;
	// 0..1 how light the sky is (see uSoften).
	soften: number;
	// How much scene light comes out as white on the screen just now (see uWhite).
	white: number;
	// 0..1 how far something out of the ordinary is happening in the air and in the water (`unusual`).
	unusual: { air: number; water: number };
	// 0..1 how much of the strongest's strength the sea asks for below, round the boat, and not ahead.
	below: number;
	tomorrow: { across: number; along: number };
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
	let at = 0;
	for (let filament = 0; filament < scoutStrips; filament++) {
		const veil = filament >= SCOUT_FILAMENTS;
		const seedValues = [Math.random(), Math.random(), veil ? 0.3 * Math.random() : Math.sqrt(Math.random()), veil ? 0.05 : Math.random() ** 2 * 0.9];
		const kindValues = veil ? [0.05, 1, 0.2, 10 + 8 * Math.random()] : [0.2 + 0.35 * Math.random(), 3 + 5 * Math.random(), 0.25 + 0.4 * Math.random(), 0.55 + 0.3 * Math.random()];
		for (let i = 0; i <= SCOUT_SEGMENTS; i++) {
			for (const edge of [-1, 1]) {
				scoutAlong[at] = i / SCOUT_SEGMENTS;
				scoutSide[at] = edge;
				scoutSeed.set(seedValues, at * 4);
				scoutKind.set(kindValues, at * 4);
				scoutSoft[at] = veil ? 1 : 0;
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
	scoutGeometry.setIndex(stripIndices(scoutStrips, SCOUT_SEGMENTS));
	const scoutUniforms = {
		uTime: { value: 0 },
		uStrength: { value: 0 },
		uGain: uniforms.uGain,
		uHead: { value: 0 },
		uTail: { value: 2 },
		uFade: { value: 0 },
		uLean: { value: new THREE.Vector2() },
		uSeat: { value: 2.25 },
		uOwn: { value: 0 },
		uSoften: uniforms.uSoften,
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
	const tendScout = (delta: number, time: number, wanted: number, tomorrow: { across: number; along: number }, thermal: number, byStrongest: boolean) => {
		const u = scoutUniforms;
		if (wanted > 0.3 && !scouting) {
			scouting = true;
			u.uHead.value = 0;
			// The night scout sits at the far right. The strongest, looking into something, is second from the right.
			u.uSeat.value = byStrongest ? 0.75 : 2.25;
			u.uOwn.value = byStrongest ? 1 : 0;
		} else if (wanted < 0.15 && scouting) {
			scouting = false;
			u.uHead.value = 0;
			u.uTail.value = 0;
			u.uFade.value = 0;
		}
		if (scouting) {
			scoutStrength = wanted;
			// It goes up slowly: it is feeling its way.
			u.uHead.value = Math.min(1.1, u.uHead.value + delta / 9);
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
		// The lean eases over: a forecast does not swing about.
		u.uLean.value.x += (tomorrow.across - u.uLean.value.x) * Math.min(1, delta / 4);
		u.uLean.value.y += (tomorrow.along - u.uLean.value.y) * Math.min(1, delta / 4);
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
		uWhite: uniforms.uWhite,
		uOwn: { value: 0 },
		uHead: { value: new THREE.Vector4(0, 0, 0, 0) },
		uTail: { value: new THREE.Vector4(2, 2, 2, 2) },
		uTogether: { value: 0 },
		uThermal: { value: 0 },
		channelCurrent: sea.channelCurrent,
		uPixelRatio: uniforms.uPixelRatio,
		uResolution: uniforms.uResolution,
	};
	const soundingMesh = new THREE.Mesh(
		soundingGeometry,
		new THREE.ShaderMaterial({
			uniforms: soundingUniforms,
			vertexShader: soundingVertexShader,
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
	let nextSounding = between(18, 45);
	let togetherWanted = 0;
	let togetherTurns = 0;
	const tendSoundings = (delta: number, time: number, thermal: number, always: boolean, linkedAll: boolean, strongestAlone: boolean) => {
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
		} else if (!strongestAlone && own.lets === Infinity) own.lets = time;
		if (!own.sounding) u.uOwn.value = 0;
		// (Not while all thirteen are linked: whoever is sounding then lets go and joins.)
		if (linkedAll && !always && !strongestAlone) {
			nextSounding = Math.max(nextSounding, time + 30);
			sounders.forEach((one) => (one.lets = Math.min(one.lets, time)));
		}
		if (strongestAlone) nextSounding = Math.max(nextSounding, time + 40);
		if (!sounders.some((one) => one.sounding) && (time > nextSounding || always)) {
			// Three of them, or all four.
			const rests = Math.random() < 0.5 ? Math.floor(Math.random() * SOUNDERS) : -1;
			sounders.forEach((one, who) => {
				if (who === rests) return;
				one.sounding = true;
				one.begins = time + between(0, 5);
				one.lets = one.begins + between(14, 26);
				one.out = between(5, 8);
				one.back = between(4, 7);
				u.uHead.value.setComponent(who, 0);
				u.uTail.value.setComponent(who, 2);
			});
			togetherWanted = Math.random() < 0.5 ? 1 : 0;
			u.uTogether.value = togetherWanted;
			togetherTurns = time + between(6, 11);
			nextSounding = time + between(100, 220);
		}
		// Together, apart, or part-way: it changes as they go.
		if (time > togetherTurns) {
			togetherWanted = [0, 0.5, 1][Math.floor(Math.random() * 3)]!;
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
				joins = joins.map((_, who) => (who === STRONGEST ? 0 : ORDER.indexOf(who) < workingFor(need) ? between(2, 5) : Infinity));
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
	// Who is at the front, as places in CREW, and how strong each seat's occupant is. Whoever is
	// strongest of the four always sits second from the right; the rest sit by strength.
	let atFront = [0, 3, 7, 10];
	const seatStrength = [0.36, 0.51, 1, 0.26];
	const SEATS_BY_STRENGTH = [STRONGEST, 1, 0, 3];
	// While someone is changing places, their seat's weave is let go; the newcomer begins afresh.
	const changingUntil = [0, 0, 0, 0];
	let nextTurn = between(50, 110);
	const takeTurns = (delta: number, time: number, linkedAll: boolean) => {
		// (Nobody changes places while all thirteen are linked.)
		if (linkedAll) nextTurn = Math.max(nextTurn, time + 20);
		if (time > nextTurn) {
			nextTurn = time + between(70, 160);
			// One of the four is relieved by one of the nine.
			// (Never the strongest, who is always at the front: only ever below, or looking into something.)
			const relieved = atFront.filter((member) => member !== 0);
			const leaving = relieved[Math.floor(Math.random() * relieved.length)]!;
			const resting = CREW.map((_, member) => member).filter((member) => !atFront.includes(member));
			const arriving = resting[Math.floor(Math.random() * resting.length)]!;
			atFront = atFront.map((member) => (member === leaving ? arriving : member)).sort((a, b) => CREW[b]! - CREW[a]!);
			changingUntil[SEATS_BY_STRENGTH[atFront.indexOf(arriving)]!] = time + 3;
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
	const tendOccurrence = (delta: number, time: number, { air, water }: { air: number; water: number }) => {
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

	const update = ({ time, delta, energy, waveHeight, need, hold: slowing, current, control, scout, showMasters, showSoundings, gathering, soften, white, unusual, below, tomorrow, thermal, strength, gain }: ChannellerState) => {
		const linkedAll = gathering > 0.05;
		const probing = tendOccurrence(delta, time, unusual);
		tendScout(delta, time, probing === "air" ? 1 : scout * (1 - gathering), tomorrow, thermal, probing === "air");
		takeTurns(delta, time, linkedAll);
		tendSoundings(delta, time, thermal, showSoundings === true, linkedAll, probing === "water");
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
		const called = strength > 0.12;
		if (wasProbing && !probing && called) {
			// The strongest has found what it is, and now channels with it: beginning alone, at once, and the
			// others come in afterwards as the sea and wind call for (the story's own second part).
			part = "stopped";
			since = 0;
			lasts = 0;
			surge = 0;
		}
		wasProbing = probing !== undefined;
		if (called && linkedAll && control <= 0.05) {
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
				head[who] = opening ? ALL : 0;
			} else if (!want[who] && weaving[who]) {
				// Let go: what was in hand is cut at the boat and is on its own from here.
				weaving[who] = false;
				head[who] = 0;
				tail[who] = 0;
				linger[who] = 0;
			}
			if (weaving[who]) {
				head[who] = Math.min(ALL, head[who]! + delta / RUNS_OUT_IN);
				// A new weave that reaches the one cut loose before it takes it up again.
				if (tail[who]! < NONE && head[who]! >= tail[who]! - 0.06) {
					tail[who] = NONE;
					linger[who] = 0;
				}
			}
			if (tail[who]! < NONE) {
				if (tail[who]! < LINGERS_FROM) tail[who] = tail[who]! + delta * CUT_TRAVELS * (0.6 + 1.2 * energy);
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
		uniforms.uSoften.value = soften;
		uniforms.uWhite.value = white;
		uniforms.uGain.value = gain;
		uniforms.uResolution.value.set(window.innerWidth, window.innerHeight).multiplyScalar(uniforms.uPixelRatio.value);
		// 0..1 how much channelling there is, and how hard it is driven.
		// How strongly the flow is taking the air with it: only where it is one flow (not held back
		// in four), and with the force it is driven by.
		const pull = weaving.some(Boolean) ? Math.max(...gate) * (called ? strength : lastStrength) * (0.5 + 0.5 * Math.max(need, control, gathering)) * (1 - hold) : 0;
		return { working: any ? 1 : 0, surge: surge * (1 - masters), pull, flowPoint, masters };
	};

	return { update };
}
