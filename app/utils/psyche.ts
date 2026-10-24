// The channellers' minds (the owner, 21 October: "you can psycho-analyse the channellers — make
// them react appropriately"). Each of the fourteen meets the storm as a person would, by her own
// temperament (AES_SEDAI in channellers.ts), and the weaves show what is happening in her.
//
// The model is the one clinicians use for overwhelm, the window of tolerance (Siegel): within
// her window a person can feel what is happening and still act; pushed above it she is in
// hyperarousal, and fights or flees; held there too long, or pushed far past it, she drops below
// it into hypoarousal: freeze, collapse, numbness. And people are not alone in it: arousal spreads
// to those beside them (emotional contagion), and is eased by those who come to them (co-
// regulation; "tend and befriend", Taylor, the other answer to threat besides fight and flight),
// most of all by a secure base (Bowlby): here the strongest, while they hold.
//
// For each, every moment:
//   load      the weather's demand (the storm's gusts and sea, against Peta's storm as 1), less
//             her strength: the mighty and the strongest meet the same storm as a smaller thing;
//   grief     the dead being honoured, felt the more the more she is bound to others (sociable);
//   arousal   eases towards load by her eagerness and grief by her bonds, plus the arousal of those
//             beside her, less the comfort she is given; slowly in the steady, quickly in the rest;
//   window    its top is set by her steadiness and stamina, and lowered by what she has spent;
//   above it  she fights (the eager, the air-minded: the rope pulled taut, quick, hot) or flees (the
//             wary, the water-minded: the rope drawn back towards her hands); and it spends her;
//   below it  spent past bearing, or pushed so far past her window that she cannot stay in it, she
//             freezes: the rope goes slack and sags, still, grey; she comes back only once rested;
//   tending   one who is within her window, and bound to others, sends part of her rope to lie
//             beside the most troubled of those next to her, and eases her; the strongest, the
//             secure base, goes to whoever on the boat is worst, and while they hold, all are eased.
//   the law   (the owner, 21 October: "the channellers on the boat [to] still each other based on
//             laws of treachery", then "the strongest channellers will try the others for treason;
//             they will suddenly send bodies away from the boat into the POV and burn them in
//             spheres of fire") by Tower law a sister who deserts the work is a traitor. One who
//             flees, drawing her rope back while the others hold, is deserting; held long enough,
//             it is treason. Then the strongest channellers (the strongest, Manulani and the four
//             mighty), those of them within their windows, try her: they shield her, part of each
//             of their ropes lying along hers, while the trial lasts. The sentence is sudden: she
//             is stilled, the cut made at her hands and running out along her rope in a moment, and
//             her body is sent from the boat out before the eye, burning in a sphere of fire, and
//             falls into the sea (treason.ts). Her seat is empty after, and her death spreads to
//             those who sat beside her. Only the others are tried, never the strongest.
// Nothing runs to a clock: all of it follows the weather and each other.
import * as THREE from "three";
import type { SeaConditions } from "./manawatawhi";

// In the order the weaves use: the twelve in SLOTS order (wrath.ts, five.ts), the strongest, Manulani.
export const NAMES = [
	"Siuan · Keel", "Leane · Kite", "Siuan · Fathom", "Leane · Ember", "Moiraine · Loom", "Moiraine · Listener",
	"Leane · Sail", "Siuan · Reef", "Moiraine · Glass", "Leane · Lantern", "Siuan · Ballast", "Moiraine · Mist",
	"the strongest", "Manulani",
];
// air, water, eager, stamina, steady, sociable (AES_SEDAI in channellers.ts; Manulani's her own:
// she who holds the light is steady and long-lasting, and close to the others).
export const TEMPERS = [
	[0.5, 0.7, 0.55, 0.95, 0.95, 0.6],
	[0.9, 0.35, 0.8, 0.6, 0.65, 0.5],
	[0.3, 0.95, 0.4, 0.85, 0.85, 0.4],
	[0.6, 0.45, 0.8, 0.6, 0.65, 0.55],
	[0.55, 0.55, 0.45, 0.75, 0.85, 0.7],
	[0.8, 0.6, 0.35, 0.7, 0.9, 0.35],
	[0.9, 0.35, 0.75, 0.6, 0.6, 0.55],
	[0.3, 0.95, 0.45, 0.9, 0.9, 0.35],
	[0.4, 0.45, 0.35, 0.7, 0.95, 0.35],
	[0.65, 0.65, 0.75, 0.55, 0.6, 0.65],
	[0.3, 0.85, 0.35, 0.85, 0.95, 0.6],
	[0.6, 0.6, 0.45, 0.6, 0.7, 0.6],
	[0.84, 0.84, 1, 1, 1, 0.5],
	[0.7, 0.7, 0.6, 0.95, 0.9, 0.7],
].map(([air, water, eager, stamina, steady, sociable]) => ({ air: air!, water: water!, eager: eager!, stamina: stamina!, steady: steady!, sociable: sociable! }));
// The strongest six (the strongest, Manulani and the four mighty) given 80% more strength (the
// owner, 21 October: "give them all 80% more strength"), and then that doubled ("aggravate my
// commands"): their true strength, 3.6 times what it was.
// Drawn, as all strength is, in mass by its cube root.
export const SIX_STRONGER = 3.6;
// The ter'angreal (the owner, 23 October: "The other Aes Sedai now have a ter'angreal, each one of
// them. It is a small figurine of a dog made of pounamu. Every one of them has had their strength
// increase by up to 800% and now their style of weaving to support Siuan are changing"). Each of
// the eleven besides Siuan (Siuan · Fathom) holds one. Pounamu is river stone, so each is
// strengthened by how near water she is: Siuan · Reef, the most water-minded, nine times (800%
// more), the air-minded Leane's about twice. Their true strength, by mind (Siuan, the strongest and
// Manulani, who hold none, 1).
export const TER_ANGREAL = TEMPERS.map((temper, i) => (i === 2 || i >= 12 ? 1 : 1 + 8 * (temper.water / 0.95) ** 2));
// Strength as their ropes' measures (MIGHT in channellers.ts): the four mighty, the strongest, Manulani.
const MIGHT = [2.5, 2.5, 2.5, 1, 1, 2.5, 1, 1, 1, 1, 1, 1, 4.9, 5.1].map((might, i) => (might > 2 ? might * Math.cbrt(SIX_STRONGER) : might) * Math.cbrt(TER_ANGREAL[i]!));
// (For the weaves that draw one channeller at a time by her strength: jenna.ts.)
export const ropeMight = (who: number) => MIGHT[who]!;
export const STRONGEST_MIND = 12;
// The strongest channellers, who try the others: the four mighty, the strongest, Manulani.
// (Named, not read off their might: with the ter'angreal some of the others are nearly as strong.)
const JUDGES = [0, 1, 2, 5, 12, 13];
// Treason: deserting the work, fled for this long (s, at full flight) while the others held.
const TREASON = 45;
// The trial (s), and the cut that stills her, running out along her rope (s).
const TRIAL = 20;
const CUT = 0.8;
// Who sits beside whom, along the rail: by place (the twelve's seats, the strongest's 2, Manulani
// at the bow beside the front two).
const SEATS = [0, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 2, 1.5];
const ALONG = SEATS.map((seat, i) => ({ seat, i })).sort((a, b) => a.seat - b.seat).map(({ i }) => i);
const BESIDE = SEATS.map((_, i) => {
	const at = ALONG.indexOf(i);
	return [ALONG[at - 1], ALONG[at + 1]].filter((one): one is number => one !== undefined);
});

// Shared by the weaves' shaders: each one's state, how far her own quiver has run, and whom she tends.
//   uMind     fight, flight, freeze, tend (each 0..1)
//   uMindFlow her own quiver, integrated (it quickens in fear and stills in a freeze, without a jump)
//   uTendTo   who she tends (an index as above), or -1
export const mindChunk = /* glsl */ `
uniform vec4 uMind[ 14 ];
uniform float uMindFlow[ 14 ];
uniform float uTendTo[ 14 ];
// The law (each): how far the cut that stills her has run out along her rope from her hands.
uniform float uLaw[ 14 ];
// How her state bends her rope at t along it (n1 across it): in a fight it trembles taut and quick;
// frozen, it sags slack towards the sea and is still.
vec3 mindBend( float who, float t, vec3 n1, float seedX ) {
	vec4 m = uMind[ int( who ) ];
	float body = sin( 3.14159 * t );
	vec3 tremble = n1 * sin( t * 13.0 - uMindFlow[ int( who ) ] * 2.0 + seedX * 3.0 ) * 14.0 * m.x * body;
	vec3 sag = vec3( 0.0, - ( 25.0 + 110.0 * t ) * m.z * body, 0.0 );
	return tremble + sag;
}
// How much of her rope shows: fleeing, she draws it back towards her hands; frozen, it dims.
float mindShown( float who, float t ) {
	vec4 m = uMind[ int( who ) ];
	float reach = 1.0 - 0.5 * m.y;
	return smoothstep( reach, reach - 0.06, t ) * ( 1.0 + 0.45 * m.x ) * ( 1.0 - 0.25 * m.y ) * ( 1.0 - 0.55 * m.z );
}
// Her colour: hotter in a fight, greyed in a freeze.
vec3 mindTint( float who, vec3 c ) {
	vec4 m = uMind[ int( who ) ];
	c = mix( c, c * vec3( 1.25, 0.88, 0.72 ), 0.55 * m.x );
	return mix( c, vec3( dot( c, vec3( 0.3, 0.45, 0.25 ) ) ) * 0.8, 0.65 * m.z );
}
// What of her own rope the law leaves: nothing behind the cut.
float lawShown( float who, float t ) {
	float cut = uLaw[ int( who ) ];
	return smoothstep( cut - 0.03, cut, t );
}
// And of what is linked to her (her ancestors' strands): it goes out with her rope.
float lawWhole( float who ) {
	return 1.0 - clamp( uLaw[ int( who ) ], 0.0, 1.0 );
}
// Whether this filament is one she has sent to lie beside the one she tends.
bool tending( float who, float seedX ) {
	return uTendTo[ int( who ) ] > - 0.5 && seedX < 0.4 * uMind[ int( who ) ].w;
}
`;

// What the weaves are given of the fourteen's minds.
export interface Minds {
	mind: THREE.Vector4[];
	flow: number[];
	tendTo: number[];
	law: number[];
}
// Copies them into a weave's uniforms.
export function giveMinds(uniforms: { uMind: { value: THREE.Vector4[] }; uMindFlow: { value: number[] }; uTendTo: { value: number[] }; uLaw: { value: number[] } }, minds: Minds | undefined) {
	if (!minds) return;
	minds.law.forEach((l, i) => (uniforms.uLaw.value[i] = l));
	minds.mind.forEach((m, i) => uniforms.uMind.value[i]!.copy(m));
	minds.flow.forEach((f, i) => (uniforms.uMindFlow.value[i] = f));
	minds.tendTo.forEach((t, i) => (uniforms.uTendTo.value[i] = t));
}

export interface PsycheFrame {
	delta: number;
	// The weather as drawn.
	weather: SeaConditions;
	// 0..1 how much the storm is a mourning (Peta's, the five's).
	grief: number;
}

export function createPsyche() {
	const n = NAMES.length;
	const arousal = new Array<number>(n).fill(0.3);
	const spent = new Array<number>(n).fill(0);
	const collapsed = new Array<boolean>(n).fill(false);
	// What the weaves are given, eased so that nothing jumps.
	const mind = Array.from({ length: n }, () => new THREE.Vector4());
	const flow = new Array<number>(n).fill(0);
	const tendTo = new Array<number>(n).fill(-1);
	const eased = (from: number, to: number, dt: number, seconds: number) => from + (to - from) * (1 - Math.exp(-dt / seconds));
	// The law: how long each has deserted, the cut that stills her, and the dead.
	const deserted = new Array<number>(n).fill(0);
	const law = new Array<number>(n).fill(-0.05);
	const dead = new Array<boolean>(n).fill(false);
	let trial: { who: number; judges: number[]; held: number } | undefined;
	// Those sentenced since the last look, for their bodies to be sent from the boat (treason.ts).
	const sentenced: number[] = [];

	const update = ({ delta, weather, grief }: PsycheFrame) => {
		const dt = Math.min(delta, 0.1);
		// The weather's demand, against Peta's storm (gusts 410 km/h, a 30 m sea) as about 1.
		const demand = Math.sqrt(0.5 * (weather.windGusts / 410) + 0.5 * (weather.waveHeight / 30));
		const distress = mind.map((m) => Math.min(1, m.x + m.y + m.z));
		// The secure base: while the strongest holds, all are eased.
		const held = 1 - distress[STRONGEST_MIND]!;
		// Comfort given this moment, to each.
		const comfort = new Array<number>(n).fill(0);
		mind.forEach((m, i) => {
			if (tendTo[i]! >= 0) comfort[tendTo[i]!]! += m.w;
		});
		for (let i = 0; i < n; i++) {
			if (dead[i]) {
				// Her rope cut out along its length in a moment; nothing more of her on the boat.
				law[i] = Math.min(1.05, law[i]! + (dt * 1.1) / CUT);
				mind[i]!.set(0, 0, 0, 0);
				tendTo[i] = -1;
				continue;
			}
			const t = TEMPERS[i]!;
			const load = demand / Math.sqrt(MIGHT[i]!);
			const beside = BESIDE[i]!;
			// (The death of one beside her is felt as the worst of fear.)
			const contagion = beside.reduce((sum, j) => sum + (dead[j] ? 1.2 : Math.max(0, arousal[j]! - arousal[i]!)), 0) / Math.max(1, beside.length);
			const want = Math.max(0, load * (0.55 + 0.6 * t.eager) + grief * (0.3 + 0.5 * t.sociable) + 0.35 * contagion - 0.45 * comfort[i]! - 0.15 * held * (i === STRONGEST_MIND ? 0 : 1));
			arousal[i] = eased(arousal[i]!, want, dt, 3 + 10 * t.steady);
			const top = 1.1 + 0.9 * t.steady + 0.5 * t.stamina - 0.6 * spent[i]!;
			const above = THREE.MathUtils.smoothstep(arousal[i]!, top, top + 0.8);
			// Above her window she spends herself (the less stamina, the faster); within it she rests.
			spent[i] = Math.max(0, spent[i]! + (dt * (above * (1.4 - t.stamina)) / 240 - (dt * (1 - above) * 0.25) / 300));
			if (spent[i]! > 1) collapsed[i] = true;
			if (spent[i]! < 0.45) collapsed[i] = false;
			// Frozen: spent past bearing, or pushed so far past her window she cannot stay in it.
			const freeze = Math.max(collapsed[i] ? 1 : 0, THREE.MathUtils.smoothstep(arousal[i]!, top + 1.2, top + 2.2) * (1 - t.eager));
			// Fight or flight, by her nature.
			const fights = THREE.MathUtils.clamp(0.5 + (t.eager - 0.5) + 0.4 * (t.air - t.water), 0, 1);
			const m = mind[i]!;
			m.x = eased(m.x, above * fights * (1 - freeze), dt, 3);
			m.y = eased(m.y, above * (1 - fights) * (1 - freeze), dt, 3);
			m.z = eased(m.z, freeze, dt, 4);
			// Her own quiver: quicker in fear, stilled in a freeze.
			flow[i] = flow[i]! + dt * (1 + 2.5 * m.x + m.y) * (1 - 0.9 * m.z);
		}
		// Desertion: fleeing while the others hold. (Briefly, and it is soon forgotten.)
		const holding = distress.filter((d, j) => !dead[j] && d < 0.5).length / Math.max(1, dead.filter((one) => !one).length);
		for (let i = 0; i < n; i++) {
			if (dead[i] || JUDGES.includes(i)) continue;
			const fleeing = THREE.MathUtils.smoothstep(mind[i]!.y, 0.4, 0.8);
			deserted[i] = Math.max(0, deserted[i]! + dt * (fleeing * holding - 0.1 * (1 - fleeing)));
		}
		// The trial: the strongest channellers within their windows try the worst deserter, one at a
		// time, and while it lasts they shield her.
		if (!trial) {
			let accused = -1;
			for (let i = 0; i < n; i++) if (!dead[i] && deserted[i]! > TREASON && (accused < 0 || deserted[i]! > deserted[accused]!)) accused = i;
			const judges = JUDGES.filter((j) => !dead[j] && distress[j]! < 0.5);
			if (accused >= 0 && judges.length >= 3) trial = { who: accused, judges, held: 0 };
		}
		if (trial) {
			trial.held += dt;
			for (const j of trial.judges) {
				tendTo[j] = trial.who;
				mind[j]!.w = eased(mind[j]!.w, 1, dt, 3);
			}
			// The sentence, sudden: stilled, and her body sent from the boat.
			if (trial.held > TRIAL) {
				dead[trial.who] = true;
				sentenced.push(trial.who);
				trial = undefined;
			}
		}
		// Who tends whom: one within her window, and bound to others, goes to the most troubled
		// beside her; the strongest to the most troubled on the boat.
		for (let i = 0; i < n; i++) {
			if (dead[i] || trial?.judges.includes(i)) continue;
			const t = TEMPERS[i]!;
			const m = mind[i]!;
			const free = 1 - Math.min(1, m.x + m.y + m.z);
			const among = (i === STRONGEST_MIND ? NAMES.map((_, j) => j).filter((j) => j !== i) : BESIDE[i]!).filter((j) => !dead[j]);
			let worst = -1;
			for (const j of among) if (worst < 0 || distress[j]! > distress[worst]!) worst = j;
			const need = worst >= 0 ? THREE.MathUtils.smoothstep(distress[worst]!, 0.3, 0.8) : 0;
			const bond = i === STRONGEST_MIND ? 1 : THREE.MathUtils.smoothstep(t.sociable, 0.45, 0.7);
			const will = free * need * bond;
			// (She keeps to whom she tends while she tends: no darting between two.)
			if (m.w < 0.05 || tendTo[i]! < 0) tendTo[i] = will > 0.05 ? worst : -1;
			m.w = eased(m.w, tendTo[i]! === worst ? will : 0, dt, 4);
		}
	};

	// For ?controls and for checking: each one's state in words.
	const describe = () =>
		NAMES.map((name, i) => {
			const m = mind[i]!;
			if (dead[i]) return `${name}: stilled for treason and burned`;
			if (trial?.who === i) return `${name}: on trial for treason (${trial.held.toFixed(0)} of ${TRIAL} s)`;
			if (trial?.judges.includes(i)) return `${name}: trying ${NAMES[trial.who]}`;
			const state = m.z > 0.5 ? "frozen" : m.x > 0.5 ? "fighting" : m.y > 0.5 ? "fleeing" : m.w > 0.3 ? `tending ${NAMES[tendTo[i]!] ?? ""}` : "steady";
			return `${name}: ${state} (arousal ${arousal[i]!.toFixed(2)}, spent ${spent[i]!.toFixed(2)}${deserted[i]! > 1 ? `, deserted ${deserted[i]!.toFixed(0)} of ${TREASON} s` : ""})`;
		});

	// For checking: brings one of the others to trial as though she had deserted.
	const accuse = (who: number) => {
		if (dead[who] || JUDGES.includes(who) || !NAMES[who]) return "only the others can be tried";
		deserted[who] = TREASON + 1;
		return `${NAMES[who]} accused`;
	};

	return { update, mind, flow, tendTo, law, sentenced, describe, accuse };
}
