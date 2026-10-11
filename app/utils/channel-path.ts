// Where the four channellers' weaving runs over the sea, as shader source shared by the threads
// themselves (channellers.ts) and by the water they light (gerstner-waves.ts).

export const CHANNELLERS = 4;

export const channelPathChunk = /* glsl */ `
// The boat (world x and z); the weaving runs from it towards -z, which is the bearing to Hawai'i.
uniform vec2 channelBoat;
uniform float channelTime;
// The wind across the view: x is how hard it blows to the right (-1..1, 1 being a gale straight
// across), y how gusty it is (0 steady, 1 gusts half as strong again as the wind).
uniform vec2 channelWind;
// The story (channellers.ts): 0..1 how far each of the four is channelling at all, 0..1 how far
// they are linked and working with their whole strength, and a clock for what streams along
// the flow, which runs faster then.
// The sea and wind they are working with: x is 0..1 how much is going on (calm to storm), y the
// height of the waves in metres.
uniform vec2 channelSea;
uniform vec4 channelGate;
uniform float channelSurge;
uniform float channelStream;

// How far along its way the weaving is, 0..1: 0 while it still runs low by the boat, 1 where it
// meets the horizon. Counted in shares of distance, as it looks to the eye.
float channelWay( float ahead ) {
	return clamp( log( max( ahead, 40.0 ) / 40.0 ) / log( 3300.0 / 40.0 ), 0.0, 1.0 );
}

// The four are not equals, and none of them gives the same from one moment to the next.
// 0..1 how much channeller k (0..3) is putting out now: a strength of their own, a slow swell
// and ebb of effort that each has in their own time, and a quick unsteadiness on top.
float channelStrength( float k ) {
	// The strongest always sits second from the right.
	float own = k < 0.5 ? 0.58 : k < 1.5 ? 0.82 : k < 2.5 ? 1.0 : 0.42;
	float gate = k < 0.5 ? channelGate.x : k < 1.5 ? channelGate.y : k < 2.5 ? channelGate.z : channelGate.w;
	float effort = 0.5 + 0.3 * sin( channelTime * ( 0.11 + 0.037 * k ) + k * 2.4 ) + 0.2 * sin( channelTime * ( 0.29 - 0.041 * k ) + k * 5.1 );
	float unsteady = 0.92 + 0.08 * sin( channelTime * ( 2.1 + 0.6 * k ) + k );
	// Linked, they all give nearly everything.
	return gate * mix( own * mix( 0.4, 1.0, effort ), 0.7 + 0.3 * own, channelSurge ) * unsteady;
}

// Metres ahead of the boat at which the four tresses have become a single flow: between about
// 3 and 7, never the same from one second to the next.
float channelJoin() {
	return 5.0 + 1.2 * sin( channelTime * 0.83 ) + 0.6 * sin( channelTime * 2.3 + 1.0 ) + 0.2 * sin( channelTime * 5.9 );
}

// Where the middle of that one great flow lies at a distance ahead, sideways of the line
// straight ahead. It wanders as a river does, and the wind carries it: a little near the boat,
// more the further it has gone, swaying with the gusts.
float channelFlow( float ahead ) {
	float q = log( ahead + 12.0 );
	float wander = 0.075 * sin( q * 1.25 - channelTime * 0.06 + 0.6 ) + 0.03 * sin( q * 2.6 + channelTime * 0.09 + 2.0 ) + 0.012 * sin( q * 5.1 - channelTime * 0.2 );
	float gust = 1.0 + 0.4 * channelWind.y * sin( channelTime * 0.5 - q * 1.5 ) + 0.2 * channelWind.y * sin( channelTime * 1.3 - q * 3.1 );
	float carried = channelWind.x * ( 0.04 + 0.12 * channelWay( ahead ) ) * gust;
	return ahead * ( wander + carried ) * smoothstep( 0.0, 30.0, ahead );
}

// Where channeller k's tress lies at a distance ahead, sideways of the line straight ahead.
// The four sit side by side across the boat. Their tresses run in to each other and are one
// flow within a few metres; inside it each still keeps a place of its own, winding slowly round
// the others, the stronger ones nearer the middle.
float channelLine( float k, float ahead ) {
	float apart = 1.0 - smoothstep( 0.0, channelJoin(), ahead );
	float turn = log( ahead + 12.0 ) * 2.2 * ( mod( k, 2.0 ) < 0.5 ? 1.0 : - 1.0 ) + k * 1.5708 - channelTime * 0.06;
	float within = ( 0.5 + 0.04 * ahead ) * ( 1.25 - channelStrength( k ) ) * ( 1.0 - smoothstep( 0.6, 0.97, channelWay( ahead ) ) );
	return ( k - 1.5 ) * 1.5 * apart + channelFlow( ahead ) + cos( turn ) * within * ( 1.0 - apart );
}

// Metres the flow climbs above the water there. It runs low over the sea by the boat, mounts
// into the air (to about three degrees above the horizon as seen from the boat), then dives
// down into the horizon and is gone. Nothing of it is left hanging in the sky.
float channelRise( float k, float ahead ) {
	// The climb is quicker than the descent, which is long and shallow.
	// Driven with their whole strength it does not climb: it keeps to the surface all the way.
	return 0.06 * ( 1.0 - 0.92 * channelSurge ) * ahead * pow( sin( 3.14159 * pow( channelWay( ahead ), 0.7 ) ), 1.5 );
}

// A wave of brightness that travels out along a tress, 0..1.
float channelPulse( float k, float ahead ) {
	return pow( 0.5 + 0.5 * sin( log( ahead + 12.0 ) * 7.0 - channelStream * ( 1.3 + 0.25 * k ) + k * 0.9 ), 6.0 );
}
`;
