// The great calming, as it is seen (channelled-storm.ts has the why and the weather): the twelve,
// linked, embroider the storm still over seven hours. The sea and the cloud base are the cloth.
//   Siuan's four   rows of running stitches through the surface of the sea, riding the real
//                  swell: each stitch shows for a few metres above the water and goes under it
//                  for the next few, as stitches do through cloth. The rows are not ruled: each
//                  bends its own way, as a hand-worked row does. The work spreads out from the
//                  boat over the hours; the newest stitches are bright, the older ones lie quiet.
//   Moiraine's four  the same through the cloud base, four hundred metres up: stitches hanging
//                  below the cloud and passing up into it.
//   Leane's four   couching: long threads laid across the wind, high over the sea, each tied
//                  down to the water at intervals by short stitches, as a laid thread is caught
//                  down to the cloth. The nearest are laid first and fastest.
// The link: from each of the twelve a tress runs out to one knot ahead of the boat, where all
// twelve meet and are one, and out of it each to her own place in the work, as a great rope of
// many filaments (the owner: "this is how you render the strongest channellers working with
// this weather?" when it was three thin threads; barely coloured is not barely there): the edge of the sea work,
// the end of the thread Leane's four are laying, the edge of the sky work. When it is done the
// tresses are let go and the embroidery stays, fading slowly, while they rest.
//
// Feeling, as heat (the owner, 16 October: "make this look like people's emotion with
// thermodynamics"). What each of the twelve feels in this work is heat, and her weave behaves as
// heat does:
//   - the strain of holding the storm warms her: the real wind's force, through her temperament
//     (Leane's eager four the quickest to heat, Siuan's steady four the slowest), and the more so
//     the more tired she is;
//   - hot, her rope's filaments stir and swell apart and lean faintly warm (still tamed); cool,
//     they lie still and close: agitation is temperature;
//   - when she can hold no more she lets it go, a sigh: her rope blooms outward, as a gas expanding
//     cools, and wisps of her warmth rise off it into the sky;
//   - feeling is shared as heat is, from the hotter to the cooler: when one is struggling, strands
//     cross from her neighbour's rope to her work, and her neighbour warms as she eases;
//   - the newest stitches shimmer with the heat of those who made them, and cool into still order;
//   - over the hours, as the storm is calmed, they come to one temperature together: equilibrium.
//
// Effort (the owner, 16 October: "the most effortful and barely coloured weaves possible"). It is
// work against the storm (force through distance), and it shows in how the lines behave, not in
// colour, which is all but the sea's and the sky's own:
//   - the lines out of the knot are hawsers, each one long unbroken curve from the hands through
//     the knot to the work (the owner: "too angular" when they were pulled straight): hauling,
//     the curve tightens and its belly is drawn up; easing, it deepens again, and the wind they
//     pull against bows it downwind;
//   - they haul with the breath: each stroke draws the line in and it goes taut, a little brighter;
//     then it is held, and eased; a real gust stronger than their hold pays it back out;
//   - under load the line quivers, slowly, as much as the real wind is strong (never a flicker);
//   - each new stitch is pulled through and stands proud a moment before it is drawn down tight;
//   - as the hours go by they tire: the hauls come more slowly, the tresses splay apart at the
//     hands, and the filaments that give out do not vanish but hang slack from the knot and droop
//     towards the sea.
import * as THREE from "three";
import { calmingWork } from "./channelled-storm";
import { pixelRatio, ribbonShaderChunk, tameShaderChunk, WEAVE_RENDER_ORDER } from "./weave";

const SEA_ROWS = 70;
const SEA_SLOTS = 90;
const SKY_ROWS = 40;
const SKY_SLOTS = 70;
const LAID = 36;
const TIES = 24;
const FIBRES = 64;
const CLOTH = 420;
const TRAINS = 32;
// The twelve's places at the rail (the strongest's, 2, is left out: they trust them), and whose
// third each is (0 Siuan's, 1 Leane's, 2 Moiraine's), in the order of AES_SEDAI in channellers.ts.
const SLOTS = [0, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const THIRDS = [0, 1, 0, 1, 2, 2, 1, 0, 2, 1, 0, 2];
// Which of her third's four each is.
const MEMBERS = THIRDS.map((third, i) => THIRDS.slice(0, i).filter((other) => other === third).length);
// Each one's temperament, as AES_SEDAI in channellers.ts gives it (in the order of SLOTS).
const TEMPERS = [
	{ eager: 0.55, steady: 0.95, stamina: 0.95 },
	{ eager: 0.8, steady: 0.65, stamina: 0.6 },
	{ eager: 0.4, steady: 0.85, stamina: 0.85 },
	{ eager: 0.8, steady: 0.65, stamina: 0.6 },
	{ eager: 0.45, steady: 0.85, stamina: 0.75 },
	{ eager: 0.35, steady: 0.9, stamina: 0.7 },
	{ eager: 0.75, steady: 0.6, stamina: 0.6 },
	{ eager: 0.45, steady: 0.9, stamina: 0.9 },
	{ eager: 0.35, steady: 0.95, stamina: 0.7 },
	{ eager: 0.75, steady: 0.6, stamina: 0.55 },
	{ eager: 0.35, steady: 0.95, stamina: 0.85 },
	{ eager: 0.45, steady: 0.7, stamina: 0.6 },
];

const vertex = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute vec2 aCell;
attribute vec4 aSeed;
uniform float uKind;
uniform float uTime;
uniform vec3 uBoat;
uniform vec2 uAhead;
uniform vec3 uWindDir;
uniform vec4 uTrains[ ${TRAINS} ];
uniform float uSteep;
uniform vec4 uGiant[ 3 ];
uniform float uSurge;
uniform float uSeaFront;
uniform float uSkyFront;
uniform float uLaid;
uniform vec3 uVigour;
uniform float uLinkGone;
// The haul: how far this stroke has drawn the lines in (less any paid out to a gust), how hard
// they are pulling just now, how strong the wind is that they pull against, and how tired they are.
uniform float uHaul;
uniform float uPull;
uniform float uTension;
uniform float uFatigue;
// Each of the twelve's heat (0..1), her sigh (0..1 through it), and how much of her rope crosses
// to her neighbour's work; and each third's heat together (Siuan's, Leane's, Moiraine's).
uniform float uHeat[ 12 ];
uniform float uSigh[ 12 ];
uniform float uBridge[ 12 ];
uniform vec3 uThirdHeat;
// Where each of the twelve's braid goes down into the sea (x, z), and the calm it has pressed there.
uniform vec4 uPress[ 12 ];

// Whose third, and which of its four, each of the twelve is (in the order of SLOTS).
const float THIRD_OF[ 12 ] = float[ 12 ]( ${THIRDS.map((x) => `${x}.0`).join(", ")} );
const float MEMBER_OF[ 12 ] = float[ 12 ]( ${MEMBERS.map((x) => `${x}.0`).join(", ")} );
// Which of the twelve a place at the rail is (the strongest's, 2, is not among them).
int whoAt( float seat ) { return int( seat < 1.5 ? seat : seat - 1.0 ); }
uniform float uFade;
uniform vec3 uTints[ 3 ];
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;
${ribbonShaderChunk}
${tameShaderChunk}

vec3 aheadDir() { return vec3( uAhead.x, 0.0, uAhead.y ); }
vec3 acrossDir() { return vec3( - uAhead.y, 0.0, uAhead.x ); }
vec3 bearing( float a ) { return aheadDir() * cos( a ) + acrossDir() * sin( a ); }

vec3 seatAt( float who ) {
	if ( who < 3.5 ) return uBoat + acrossDir() * ( who - 1.5 ) * 1.5 + vec3( 0.0, - 1.2, 0.0 ) + aheadDir() * 0.5;
	float k = who - 4.0;
	float side = mod( k, 2.0 ) * 2.0 - 1.0;
	float back = floor( k / 2.0 );
	return uBoat + acrossDir() * side * ( 2.2 + 0.2 * back ) + vec3( 0.0, - 1.6, 0.0 ) - aheadDir() * ( 1.0 + 1.6 * back );
}

// The height of the sea, from the same trains of waves the water is drawn with (measuredSeaHeight
// and giantWaveHeight in gerstner-waves.ts).
float seaAt( vec2 p ) {
	float h = 0.0;
	for ( int i = 0; i < ${TRAINS}; i ++ ) {
		vec4 w = uTrains[ i ];
		float k = 6.28318 / max( w.w, 1.0 );
		float along = sin( w.x ) * p.x - cos( w.x ) * p.y;
		h += ( w.z * uSteep / k ) * sin( k * ( along - sqrt( 9.8 / k ) * uTime ) + w.y );
	}
	for ( int i = 0; i < 3; i ++ ) {
		vec4 w = uGiant[ i ];
		float k = 6.28318 / w.w;
		float along = sin( w.x ) * p.x - cos( w.x ) * p.y;
		h += ( uSurge * w.z / k ) * sin( k * ( along - sqrt( 9.8 / k ) * uTime ) + w.y );
	}
	return h;
}

vec3 pressAt( int who ) {
	vec2 p = uPress[ who ].xy;
	return vec3( p.x, seaAt( p ) + 1.0, p.y );
}

// Where the edge of the sea work is, on a bearing, and of the sky work.
float seaFront( float a ) { return uSeaFront * ( 1.0 + 0.18 * sin( a * 3.0 + 1.3 ) + 0.08 * sin( a * 11.0 ) ); }
float skyFront( float a ) { return uSkyFront * ( 1.0 + 0.15 * sin( a * 2.0 + 0.4 ) + 0.07 * sin( a * 9.0 + 2.0 ) ); }

// One of Leane's laid threads, i, at s along it.
vec3 laidPoint( float i, float s ) {
	float d = 160.0 * pow( 1.075, i );
	float h = 18.0 + 25.0 * fract( i * 0.37 );
	vec3 across = normalize( cross( uWindDir, vec3( 0.0, 1.0, 0.0 ) ) + vec3( 1e-4 ) );
	vec3 p = uBoat + aheadDir() * d + across * ( s - 0.5 ) * 2.4 * d + aheadDir() * 0.08 * d * sin( s * 3.0 + i );
	// Laid on the cloth: each end comes down to the sea.
	float span = sin( 3.14159 * s );
	p.y = h * pow( span, 0.35 ) + 3.0 * span * sin( s * 9.0 + i + uTime * 0.1 );
	return p;
}
float laidSoFar() { return uLaid * ${LAID}.0; }

// Where each of the twelve is working: each third's four spread along their edge of the work.
vec3 needle( float third, float member ) {
	float spread = ( member - 1.5 ) * 0.32;
	if ( third < 0.5 ) {
		float a = 0.6 * sin( uTime * 0.004 + 1.0 ) * 0.5 + spread;
		vec3 p = uBoat + bearing( a ) * seaFront( a );
		return vec3( p.x, seaAt( p.xz ) + 2.0, p.z );
	}
	if ( third < 1.5 ) {
		// Each lays her own thread, the four nearest the newest.
		float n = min( laidSoFar(), ${LAID}.0 - 0.001 );
		return laidPoint( max( floor( n ) - member, 0.0 ), member < 0.5 ? fract( n ) : 0.5 + 0.4 * sin( uTime * 0.01 + member ) );
	}
	float a = 0.6 * sin( uTime * 0.003 + 2.0 ) * 0.5 + spread;
	vec3 p = uBoat + bearing( a ) * skyFront( a );
	return vec3( p.x, ${CLOTH}.0, p.z );
}

vec3 bezier( vec3 a, vec3 b, vec3 c, vec3 d, float t ) {
	float s = 1.0 - t;
	return s * s * s * a + 3.0 * s * s * t * b + 3.0 * s * t * t * c + t * t * t * d;
}

// A running stitch on row k of the cloth (its distance d0), slot j of slots. Fine thread, not
// dashes (the owner: "oblong blobs have got to stop"): each stitch lies along its row's own curve
// and fills nearly all of its slot, so that a row reads as one thread lying on the cloth, going
// under it only for a moment between stitches. Gives its bearing a, its distance d and its length L.
float rowAt( float k, float a, float d0 ) {
	return d0 * ( 1.0 + 0.06 * sin( a * 7.0 + k * 1.7 ) + 0.03 * sin( a * 17.0 + k * 0.6 ) );
}
void stitchOf( float k, float j, float slots, float d0, out float a, out float d, out float L, out float tb ) {
	float slot = 2.0 / slots;
	// Each row's stitches staggered against the last, as a hand sews (lined up, their gaps made a grid).
	a = ( ( j + 0.5 + fract( k * 0.618 ) ) / slots - 0.5 ) * 2.0 + ( aSeed.x - 0.5 ) * 0.2 * slot;
	d = rowAt( k, a, d0 );
	L = 0.97 * d * slot;
	tb = 0.0;
}
vec3 stitchPoint( float k, float j, float slots, float d0, float lift, float front, float heat, float t ) {
	float a, d, L, tb;
	stitchOf( k, j, slots, d0, a, d, L, tb );
	float along = a + ( t - 0.5 ) * 0.97 * 2.0 / slots;
	vec3 p = uBoat + bearing( along ) * rowAt( k, along, d0 );
	// Lying on the cloth, barely raised; just pulled through, it stands a little proud, then is
	// drawn down tight.
	float proud = 1.0 + 2.5 * exp( - max( front - d, 0.0 ) / ( 3.0 * L ) );
	// (Its ends fade where it goes under, rather than dipping: a dip showed as a tick.)
	p.y = lift * L * 0.03 * proud * sin( 3.14159 * t );
	// New work still holds its makers' heat and shimmers with it; it cools into still order.
	float warm = heat * exp( - max( front - d, 0.0 ) / ( 0.12 * front + 40.0 ) );
	p += ( vec3( 0.0, 1.0, 0.0 ) * sin( uTime * 1.1 + t * 9.0 + aSeed.y * 6.0 ) + bearing( a ) * 0.6 * sin( uTime * 0.8 + t * 7.0 + aSeed.z * 6.0 ) ) * L * 0.08 * warm;
	return p;
}

float seaRow() { return 30.0 * pow( 1.068, aCell.x ); }
float skyRow() { return 1300.0 * pow( 1.045, aCell.x ); }

// Where this line is at t.
vec3 placeAt( float t ) {
	if ( uKind < 0.5 ) {
		float a = ( ( aCell.y + 0.5 ) / ${SEA_SLOTS}.0 - 0.5 ) * 2.0;
		vec3 p = stitchPoint( aCell.x, aCell.y, ${SEA_SLOTS}.0, seaRow(), 1.0, seaFront( a ), uThirdHeat.x, t );
		p.y += seaAt( p.xz );
		return p;
	}
	if ( uKind < 1.5 ) return stitchPoint( aCell.x, aCell.y, ${SKY_SLOTS}.0, skyRow(), - 1.2, skyFront( ( ( aCell.y + 0.5 ) / ${SKY_SLOTS}.0 - 0.5 ) * 2.0 ), uThirdHeat.z, t ) + vec3( 0.0, ${CLOTH}.0, 0.0 );
	if ( uKind < 2.5 ) return laidPoint( aCell.x, t );
	if ( uKind < 3.5 ) {
		// The short stitches that catch a laid thread down: each a loose turn round it.
		float s = ( aCell.y + 0.5 ) / ${TIES}.0;
		vec3 on = laidPoint( aCell.x, s );
		vec3 tangent = normalize( laidPoint( aCell.x, s + 0.003 ) - laidPoint( aCell.x, s - 0.003 ) + vec3( 1e-5 ) );
		vec3 n1 = normalize( cross( tangent, vec3( 0.0, 1.0, 0.0 ) ) + vec3( 1e-4 ) );
		vec3 n2 = cross( n1, tangent );
		float a = 6.28318 * t * 1.3;
		return on + ( n1 * cos( a ) + n2 * sin( a ) ) * 0.7 + tangent * ( t - 0.5 ) * 1.2;
	}
	// The link: from a place at the rail to the knot where all twelve meet, and out to their needle.
	float third = mod( aCell.y, 3.0 );
	float member = floor( aCell.y / 3.0 );
	float vigour = third < 0.5 ? uVigour.x : third < 1.5 ? uVigour.y : uVigour.z;
	vec3 seat = seatAt( aCell.x );
	// The knot: not a point but a loose gathering low ahead of the boat, each third's strand
	// through it side by side.
	vec3 knot = uBoat + aheadDir() * 32.0 + vec3( 0.0, - 7.0, 0.0 ) + acrossDir() * ( third - 1.0 ) * 5.0;
	int who = whoAt( aCell.x );
	float heat = uHeat[ who ];
	float sigh = uSigh[ who ];
	// Drawn in a little with each stroke; paid back out to a gust. Some of her strands, when her
	// neighbour is the hotter, cross to her neighbour's work and take some of it.
	// Each drives her braid down into the sea where she is pressing the swell out of it (the owner:
	// "you are dealing now with the strongest living channellers... think about how they would work
	// with the ocean").
	vec3 to = pressAt( who );
	if ( aSeed.x < uBridge[ who ] ) to = pressAt( ( who + 1 ) % 12 );
	to += ( knot - to ) * 0.05 * uHaul;
	// Each leaves the knot already turned towards its work, the way it came in: no corner.
	vec3 toward = to - knot;
	toward.y = 0.0;
	vec3 leave = normalize( aheadDir() + normalize( toward + vec3( 1e-4 ) ) );
	float taut = 0.35 + 0.65 * uPull;
	vec3 centre;
	float r;
	vec3 stir = vec3( 0.0 );
	if ( t < 0.25 ) {
		centre = bezier( seat, seat + aheadDir() * 8.0 - vec3( 0.0, 2.0, 0.0 ), knot - leave * 12.0, knot, t / 0.25 );
		// Splayed apart at the hands as they tire; loosely gathered at the knot.
		r = ( 0.3 + 1.5 * sin( 3.14159 * t / 0.25 ) * ( 1.0 + 3.0 * uFatigue * aSeed.x ) ) * sqrt( aSeed.z ) * smoothstep( 0.25, 0.2, t ) + 1.2 * sqrt( aSeed.z );
	} else {
		float s = ( t - 0.25 ) / 0.75;
		if ( aSeed.w > vigour ) {
			// Given out: hanging slack from the knot, drooping towards the sea, swaying.
			vec3 end = knot + ( to - knot ) * ( 0.12 + 0.2 * aSeed.x ) + acrossDir() * ( aSeed.z - 0.5 ) * 40.0;
			end.y = 1.0;
			centre = bezier( knot, knot + leave * 8.0, end + vec3( 0.0, 10.0, 0.0 ), end, s ) + acrossDir() * sin( uTime * 0.3 + aSeed.y * 6.0 ) * 3.0 * s;
			r = 0.2;
		} else {
			// One curve on from the knot, leaving it the way the tress came in (no corner), arriving at
			// the work from above; its belly drawn up as they haul and deepening as they ease, and
			// bowed downwind by the wind they are pulling against.
			float far = length( to - knot );
			// (Down into the sea from high above it, as a blow is struck.)
			centre = bezier( knot, knot + leave * 0.35 * far + vec3( 0.0, 0.08 * far, 0.0 ), to + vec3( 0.0, 0.35 * far, 0.0 ) + acrossDir() * 0.12 * far * ( mod( float( who ), 2.0 ) * 2.0 - 1.0 ) - ( to - knot ) * 0.1, to, s );
			float belly = 4.0 * s * ( 1.0 - s );
			// (In proportion to its length: a long line bows as much as a short one, to the eye.)
			centre -= vec3( 0.0, far * ( 0.03 + 0.06 * ( 1.0 - taut ) ) * belly, 0.0 );
			centre += uWindDir * far * ( 0.06 + 0.1 * uTension ) * belly;
			// Under load it quivers, slowly, as much as the wind is strong.
			vec3 side = normalize( cross( to - knot, vec3( 0.0, 1.0, 0.0 ) ) + vec3( 1e-4 ) );
			float q = uTension * ( 1.8 * sin( 3.14159 * s ) * sin( uTime * 4.0 + third * 2.0 ) + 0.8 * sin( 6.28318 * s ) * sin( uTime * 5.3 + 1.0 + third ) );
			centre += side * q + vec3( 0.0, 0.5 * q, 0.0 );
			// A great rope of many filaments, as thick for its length as a hawser is (tens of metres
			// across at a kilometre out), drawn in tight as they pull and loosening as they ease.
			r = ( 0.6 + far * 0.022 * sin( 3.14159 * s ) * ( 1.0 - 0.45 * taut ) ) * sqrt( aSeed.z );
			// Her heat: the warmer she is the more the rope swells and its filaments stir; sighing,
			// it blooms out wide, and some of its filaments rise off it as wisps of warmth.
			r *= ( 0.7 + 0.8 * heat ) * ( 1.0 + 1.1 * sigh );
			// Drawn into one dense blasting braid where it goes down into the water.
			r *= mix( 1.0, 0.18, smoothstep( 0.7, 1.0, s ) );
			stir = vec3(
				sin( uTime * ( 0.6 + 0.9 * heat ) + aSeed.x * 40.0 + s * 11.0 ),
				sin( uTime * ( 0.5 + 0.8 * heat ) * 1.3 + aSeed.y * 30.0 + s * 7.0 ),
				cos( uTime * ( 0.7 + 0.9 * heat ) + aSeed.z * 50.0 + s * 13.0 )
			) * r * 0.5 * heat;
			if ( aSeed.y > 0.72 ) stir += ( vec3( 0.0, 1.0, 0.0 ) * ( 15.0 + far * 0.05 ) * aSeed.z + uWindDir * 20.0 * s ) * sigh * sin( 3.14159 * s );
		}
	}
	// Laid up as a rope is: the filaments wind round each other along it.
	// (And, driving down into the sea, winding ever tighter round the braid, as water drawn down
	// into a vortex does.)
	float turn = aSeed.y * 6.28318 + uTime * 0.2 * vigour * ( aSeed.x - 0.5 ) + t * 14.0 + ( t > 0.25 ? 18.0 * pow( smoothstep( 0.7, 1.0, ( t - 0.25 ) / 0.75 ), 2.0 ) - uTime * 0.6 * smoothstep( 0.7, 1.0, ( t - 0.25 ) / 0.75 ) : 0.0 );
	return centre + ( acrossDir() * cos( turn ) + vec3( 0.0, sin( turn ), 0.0 ) ) * r + stir;
}

void main() {
	vec3 here = placeAt( aT );
	vec3 next = placeAt( min( aT + 0.01, 1.0 ) ) + ( aT >= 0.99 ? here - placeAt( aT - 0.01 ) : vec3( 0.0 ) );
	float shown = 1.0;
	// How far this line has been made (0..1 along it; past 1 all of it), and how new it is.
	float grown = 2.0;
	float fresh = 0.0;
	vec3 tint = uTints[ 0 ];
	float width = 0.7;
	if ( uKind < 1.5 ) {
		float sea = uKind < 0.5 ? 1.0 : 0.0;
		float a, d, L, tb;
		stitchOf( aCell.x, aCell.y, sea > 0.5 ? ${SEA_SLOTS}.0 : ${SKY_SLOTS}.0, sea > 0.5 ? seaRow() : skyRow(), a, d, L, tb );
		float front = sea > 0.5 ? seaFront( a ) : skyFront( a );
		grown = ( front - d ) / L;
		fresh = exp( - max( front - d, 0.0 ) / ( 0.12 * front + 40.0 ) );
		if ( sea > 0.5 ) {
			tint = mix( uTints[ 0 ], vec3( 1.0 ), 0.5 * fresh );
			shown = 0.35 + 0.65 * fresh;
		} else {
			// (Only below the cloud: above it, it is in it.)
			tint = mix( uTints[ 2 ], vec3( 1.0 ), 0.4 * fresh );
			shown = ( 0.25 + 0.75 * fresh ) * smoothstep( ${CLOTH}.0 + 1.0, ${CLOTH}.0 - 1.0, here.y ) * exp( - d / 5000.0 );
			width = 0.8;
		}
	} else if ( uKind < 2.5 ) {
		grown = clamp( laidSoFar() - aCell.x, 0.0, 1.0 );
		fresh = exp( - max( laidSoFar() - aCell.x, 0.0 ) / 6.0 );
		tint = mix( uTints[ 1 ], vec3( 1.0 ), 0.3 * fresh );
		shown = 0.35 + 0.65 * fresh;
		width = 1.1;
	} else if ( uKind < 3.5 ) {
		// Tied once the thread has been laid past it.
		grown = ( laidSoFar() - aCell.x - ( aCell.y + 0.5 ) / ${TIES}.0 ) * 10.0;
		fresh = exp( - max( laidSoFar() - aCell.x, 0.0 ) / 6.0 );
		tint = uTints[ 1 ];
		shown = 0.25 + 0.4 * fresh;
		width = 0.8;
	} else {
		float third = mod( aCell.y, 3.0 );
		float vigour = third < 0.5 ? uVigour.x : third < 1.5 ? uVigour.y : uVigour.z;
		// Tired, fewer filaments carry it, and more slowly; the ones that have given out hang faint.
		// Pulling, the line is a little brighter.
		shown = ( aSeed.w > vigour && aT > 0.25 ? 0.3 : 1.0 ) * ( 0.55 + 0.45 * sin( aT * 18.0 - uTime * ( 0.4 + 0.9 * vigour ) + aSeed.x * 30.0 ) ) * ( 0.7 + 0.5 * uPull );
		// Into the water at its end, brightest where it goes in.
		shown *= 1.0 + 1.5 * smoothstep( 0.8, 1.0, aT );
		// Let go from the needle's end back to the hands.
		shown *= smoothstep( 1.0 - uLinkGone * 1.1, 1.0 - uLinkGone * 1.1 - 0.05, aT );
		// (Not drawn right by the eye, where the twelve tresses from the rail would fill the picture.)
		shown *= smoothstep( 25.0, 110.0, length( here - cameraPosition ) );
		// Warmer, a little brighter and leaning faintly towards ember.
		float heat = uHeat[ whoAt( aCell.x ) ];
		shown *= 0.6 + 0.7 * heat;
		tint = mix( uTints[ int( third + 0.5 ) ], vec3( 1.0, 0.72, 0.5 ), 0.6 * heat );
		fresh = heat;
		width = 0.9;
	}
	// The part not yet made is not there; the cloth fades slowly once the work is done.
	float made = smoothstep( grown, grown - 0.05, aT );
	if ( uKind < 1.5 ) made *= smoothstep( 0.0, 0.04, aT ) * smoothstep( 1.0, 0.96, aT );
	vAlpha = shown * made * ( uKind < 3.5 ? uFade : 1.0 );
	// The newest work the most coloured, 26%; the oldest and the link's own threads from 13%.
	// (The hawsers at the least: 13%.)
	// (The hawsers at 13%, up to 26% as they warm.)
	vTint = tame( tint, 0.13 + 0.13 * fresh );
	vEdge = aSide;
	mat4 vp = projectionMatrix * viewMatrix;
	vec4 clip = vp * vec4( here, 1.0 );
	// (Stitches stay fine thread close to the eye too: not broadened as much as the weave's lines.)
	if ( uKind < 1.5 ) width *= clamp( 300.0 / clip.w, 0.7, 1.2 ) / clamp( 300.0 / clip.w, 0.7, 2.6 );
	gl_Position = ribbonPosition( clip, vp * vec4( next, 1.0 ), aSide, width );
}
`;

const fragment = /* glsl */ `
uniform float uGain;
uniform float uDay;
uniform float uOpacity;
uniform float uKind;
varying vec3 vTint;
varying float vAlpha;
varying float vEdge;
void main() {
	float across = abs( vEdge );
	float body = exp( - across * across * 3.0 ) * ( 1.0 - smoothstep( 0.8, 1.0, across ) );
	// By day laid colour, deeper (never white on white).
	vec3 colour = mix( vTint, pow( vTint, vec3( 2.6 ) ) * 0.4, uDay );
	gl_FragColor = vec4( colour * uGain, body * vAlpha * uOpacity * mix( 1.0, uKind > 0.5 && uKind < 1.5 ? 1.2 : 3.5, uDay ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

// count lines of segments each; cell(i) gives each line's two numbers.
function lines(count: number, segments: number, cell: (i: number) => [number, number]) {
	const vertices = count * (segments + 1) * 2;
	const along = new Float32Array(vertices);
	const side = new Float32Array(vertices);
	const cells = new Float32Array(vertices * 2);
	const seeds = new Float32Array(vertices * 4);
	const index: number[] = [];
	for (let line = 0; line < count; line++) {
		const own = [Math.random(), Math.random(), Math.random(), Math.random()];
		const [a, b] = cell(line);
		for (let i = 0; i <= segments; i++) {
			for (let edge = 0; edge < 2; edge++) {
				const v = (line * (segments + 1) + i) * 2 + edge;
				along[v] = i / segments;
				side[v] = edge ? 1 : -1;
				cells[v * 2] = a;
				cells[v * 2 + 1] = b;
				seeds.set(own, v * 4);
			}
			if (i < segments) {
				const v = (line * (segments + 1) + i) * 2;
				index.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
			}
		}
	}
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(vertices * 3), 3));
	geometry.setAttribute("aT", new THREE.BufferAttribute(along, 1));
	geometry.setAttribute("aSide", new THREE.BufferAttribute(side, 1));
	geometry.setAttribute("aCell", new THREE.BufferAttribute(cells, 2));
	geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
	geometry.setIndex(index);
	return geometry;
}

export interface EmbroideryFrame {
	time: number;
	delta: number;
	// 0..1 how strong the real wind is just now against them, and how much of a gust is blowing.
	force: number;
	gust: number;
	boat: THREE.Vector3;
	ahead: THREE.Vector2;
	wind: THREE.Vector3;
	// The sea's wave trains (GerstnerUniforms.waves), their steepness, and the giant swells' surge.
	trains: THREE.Vector4[];
	steepness: number;
	surge: number;
	// 0..1 how far through the hours, and the hours since it was done.
	progress: number;
	after: number;
	day: number;
	gain: number;
	// Water, air and akasha, as the channellers' colours are just now.
	tints: THREE.Color[];
	// The water's pressed places (GerstnerUniforms.pressed), filled in here, and its pressGlow.
	pressed: THREE.Vector4[];
	pressGlow: { value: number };
	// The colour of what is behind the weave (the air's).
	bg: THREE.Color;
}

export function createEmbroidery(scene: THREE.Scene, layer: number, giant: THREE.Vector4[]) {
	const shared_ = {
		uTime: { value: 0 },
		uBoat: { value: new THREE.Vector3() },
		uAhead: { value: new THREE.Vector2(0, -1) },
		uWindDir: { value: new THREE.Vector3(1, 0, 0) },
		uTrains: { value: Array.from({ length: TRAINS }, () => new THREE.Vector4(0, 0, 0, 100)) },
		uSteep: { value: 0 },
		uGiant: { value: giant },
		uSurge: { value: 0 },
		uSeaFront: { value: 0 },
		uSkyFront: { value: 0 },
		uLaid: { value: 0 },
		uVigour: { value: new THREE.Vector3(1, 1, 1) },
		uLinkGone: { value: 0 },
		uHaul: { value: 0 },
		uPull: { value: 0 },
		uTension: { value: 0 },
		uFatigue: { value: 0 },
		uHeat: { value: Array.from({ length: 12 }, () => 0.2) },
		uSigh: { value: Array.from({ length: 12 }, () => 0) },
		uBridge: { value: Array.from({ length: 12 }, () => 0) },
		uThirdHeat: { value: new THREE.Vector3() },
		uPress: { value: Array.from({ length: 12 }, () => new THREE.Vector4()) },
		uFade: { value: 1 },
		uTints: { value: [new THREE.Color(), new THREE.Color(), new THREE.Color()] },
		uGain: { value: 1 },
		uDay: { value: 0 },
		uBg: { value: new THREE.Color() },
		uResolution: { value: new THREE.Vector2(1, 1) },
		uPixelRatio: pixelRatio,
	};
	const shared = shared_;
	const parts = [
		{ geometry: lines(SEA_ROWS * SEA_SLOTS, 8, (i) => [Math.floor(i / SEA_SLOTS), i % SEA_SLOTS]), opacity: 0.85 },
		{ geometry: lines(SKY_ROWS * SKY_SLOTS, 8, (i) => [Math.floor(i / SKY_SLOTS), i % SKY_SLOTS]), opacity: 0.8 },
		{ geometry: lines(LAID, 200, (i) => [i, 0]), opacity: 0.65 },
		{ geometry: lines(LAID * TIES, 10, (i) => [Math.floor(i / TIES), i % TIES]), opacity: 0.18 },
		// (Each third's four told apart: the second number is the third, plus three for each before her in it.)
		{ geometry: lines(SLOTS.length * FIBRES, 150, (i) => [SLOTS[i % SLOTS.length]!, THIRDS[i % SLOTS.length]! + 3 * MEMBERS[i % SLOTS.length]!]), opacity: 0.1 },
	].map(({ geometry, opacity }, kind) => {
		const mesh = new THREE.Mesh(
			geometry,
			new THREE.ShaderMaterial({ uniforms: { ...shared, uKind: { value: kind }, uOpacity: { value: opacity } }, vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
		);
		mesh.frustumCulled = false;
		mesh.renderOrder = WEAVE_RENDER_ORDER;
		mesh.layers.set(layer);
		mesh.visible = false;
		scene.add(mesh);
		return mesh;
	});

	// The water's pressed places, to let go of when the work is gone.
	let lastPressed: THREE.Vector4[] | undefined;
	// Where they are in the stroke they are hauling (0..1).
	let stroke = 0;
	// Each of the twelve's heat, and how long is left of her sigh (seconds; 0 when not sighing).
	const heat = TEMPERS.map(() => 0.15 + 0.1 * Math.random());
	const sighing = TEMPERS.map(() => 0);
	const SIGH = 7;
	const feel = (frame: EmbroideryFrame, fatigue: number) => {
		const dt = Math.min(frame.delta, 0.1);
		const thirds = [0, 1, 2].map((third) => {
			const ones = heat.filter((_, i) => THIRDS[i] === third);
			return ones.reduce((sum, h) => sum + h, 0) / ones.length;
		});
		const was = [...heat];
		TEMPERS.forEach(({ eager, steady, stamina }, i) => {
			// Warmed by the strain, through her temperament, the more for being tired.
			const strain = 0.25 * frame.force * (1.15 - steady) * (0.7 + 0.6 * eager) * (1 + (1.5 * fatigue) / stamina);
			// Shared with those beside her in the link, and with her own third.
			const shared = 0.05 * (was[(i + 11) % 12]! - was[i]! + was[(i + 1) % 12]! - was[i]!) + 0.03 * (thirds[THIRDS[i]!]! - was[i]!);
			// Given off slowly, and in a sigh when she can hold no more.
			if (sighing[i]! <= 0 && was[i]! > 0.7 + 0.15 * steady) sighing[i] = SIGH;
			const sigh = sighing[i]! > 0 ? Math.sin(Math.PI * (1 - sighing[i]! / SIGH)) : 0;
			sighing[i] = Math.max(0, sighing[i]! - dt);
			heat[i] = THREE.MathUtils.clamp(was[i]! + dt * (strain + shared - 0.03 * (was[i]! - 0.1) - 0.14 * sigh), 0, 1);
			shared_.uHeat.value[i] = heat[i]!;
			shared_.uSigh.value[i] = sigh;
			// When her neighbour is the hotter, some of her strands cross to help.
			shared_.uBridge.value[i] = THREE.MathUtils.clamp((was[(i + 1) % 12]! - was[i]!) * 0.9, 0, 0.35);
		});
		shared_.uThirdHeat.value.set(thirds[0]!, thirds[1]!, thirds[2]!);
	};

	const update = (frame: EmbroideryFrame | undefined) => {
		// Done and faded, or not happening: nothing to draw.
		const fade = frame ? 1 - THREE.MathUtils.smoothstep(frame.after, 0.5, 3) : 0;
		for (const mesh of parts) mesh.visible = fade > 0.001;
		if (!frame || fade <= 0.001) {
			if (lastPressed) for (const place of lastPressed) place.w = 0;
			return;
		}
		lastPressed = frame.pressed;
		const { smoothstep } = THREE.MathUtils;
		const p = frame.progress;
		const work = calmingWork(p);
		shared.uTime.value = frame.time;
		shared.uBoat.value.copy(frame.boat);
		shared.uAhead.value.copy(frame.ahead);
		shared.uWindDir.value.copy(frame.wind).setY(0);
		if (shared.uWindDir.value.lengthSq() > 1e-6) shared.uWindDir.value.normalize();
		else shared.uWindDir.value.set(frame.ahead.x, 0, frame.ahead.y);
		frame.trains.forEach((train, i) => i < TRAINS && shared.uTrains.value[i]!.copy(train));
		shared.uSteep.value = frame.steepness;
		shared.uSurge.value = frame.surge;
		// The work spreads out from the boat as it goes on: the sea's from a few tens of metres to
		// past the horizon, the sky's from overhead to far off, Leane's threads laid nearest first.
		shared.uSeaFront.value = 40 + 3400 * work.sea;
		shared.uSkyFront.value = 1200 + 7000 * work.sky;
		shared.uLaid.value = work.drag;
		// They tire: Leane's first (the least stamina), Siuan's last.
		shared.uVigour.value.set(1 - 0.6 * smoothstep(p, 0.3, 1), 1 - 0.7 * smoothstep(p, 0.15, 0.85), 1 - 0.6 * smoothstep(p, 0.45, 1));
		// Let go once it is done.
		shared.uLinkGone.value = smoothstep(frame.after, 0, 0.15);
		parts[4]!.visible = shared.uLinkGone.value < 0.999;
		// The haul: a stroke to each slow breath, slower as they tire. Drawn in, held, eased.
		const vigour = shared.uVigour.value;
		const fatigue = 1 - (vigour.x + vigour.y + vigour.z) / 3;
		stroke = (stroke + frame.delta / (7 + 6 * fatigue)) % 1;
		const pull = smoothstep(stroke, 0, 0.3) * (1 - smoothstep(stroke, 0.45, 0.7));
		// A gust stronger than their hold pays the line back out.
		const slip = Math.max(0, frame.gust - 0.45) * 1.6;
		shared.uPull.value = pull * (1 - 0.5 * slip);
		shared.uHaul.value = smoothstep(stroke, 0, 0.45) * (1 - smoothstep(stroke, 0.6, 1)) - slip;
		shared.uTension.value = Math.min(1, frame.force);
		shared.uFatigue.value = fatigue;
		feel(frame, fatigue);
		// Where each drives her braid into the sea, spread across the sea ahead, and the calm she
		// has pressed out there: growing over the hours until they meet and the whole sea is still.
		const along = 1 - (1 - p) ** 2.2;
		TEMPERS.forEach((_, i) => {
			// Each third works together, loosely: Siuan's to the left, Leane's ahead, Moiraine's to the
			// right, each of the four her own way off from the others, near and far (not in a row).
			const third = THIRDS[i]!;
			const a = [-0.5, 0.02, 0.5][third]! + (MEMBERS[i]! - 1.5) * 0.11 + 0.08 * Math.sin(i * 2.3) + 0.04 * Math.sin(frame.time * 0.01 + i);
			const d = 230 + 950 * ((i * 0.618 + 0.3) % 1) ** 1.3;
			const x = frame.boat.x + (frame.ahead.x * Math.cos(a) - frame.ahead.y * Math.sin(a)) * d;
			const z = frame.boat.z + (frame.ahead.y * Math.cos(a) + frame.ahead.x * Math.sin(a)) * d;
			const reach = (70 + 1100 * along * (0.8 + 0.4 * ((i * 0.37) % 1))) * (1 + 0.15 * shared_.uSigh.value[i]!);
			const strength = Math.min(1, 0.45 + 0.55 * smoothstep(p, 0, 0.3)) * (0.7 + 0.3 * heat[i]!) * fade;
			shared_.uPress.value[i]!.set(x, z, reach, 0);
			frame.pressed[i]!.set(x, z, reach, strength);
		});
		frame.pressGlow.value = 0.04 * frame.gain * (1 - shared.uLinkGone.value);
		shared.uFade.value = fade;
		frame.tints.forEach((tint, i) => shared.uTints.value[i]!.copy(tint));
		shared.uDay.value = frame.day;
		shared.uGain.value = frame.gain;
		shared.uBg.value.copy(frame.bg);
		shared.uResolution.value.set(window.innerWidth, window.innerHeight).multiplyScalar(pixelRatio.value);
		const blending = frame.day > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending;
		for (const mesh of parts) (mesh.material as THREE.ShaderMaterial).blending = blending;
	};

	const dispose = () => {
		for (const mesh of parts) {
			scene.remove(mesh);
			mesh.geometry.dispose();
			(mesh.material as THREE.Material).dispose();
		}
	};

	return { update, dispose };
}
