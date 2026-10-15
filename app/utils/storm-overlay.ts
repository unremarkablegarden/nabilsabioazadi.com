// Rain, drawn on a 2D canvas over the ocean.
//
// Drawn as rain is seen through a lens, not as even lines. Each drop is at its own distance:
// near ones pass quickly, long, soft and faint (out of focus, smeared by their own speed); far
// ones are short, fine and slower across the view, and there are many more of them. The wind
// drives it: in a light air it falls nearly straight, in a gale it is driven slanting, and past
// hurricane force almost level, the slant rising and easing with every gust. And it does not
// fall evenly: it comes in sheets that sweep across with the wind, heavier and lighter, as rain
// in a squall does.

interface Point {
	x: number;
	y: number;
}

const MAX_DROPS = 1400;
// Near, middle and far: how the drops at each distance are drawn.
const LAYERS = [
	{ share: 0.12, speed: 2.6, length: 0.14, width: 2, alpha: 0.16 },
	{ share: 0.33, speed: 1.6, length: 0.06, width: 1, alpha: 0.32 },
	{ share: 0.55, speed: 1.0, length: 0.025, width: 0.7, alpha: 0.26 },
];

export function createStormOverlay(canvas: HTMLCanvasElement) {
	const context = canvas.getContext("2d")!;
	let cut = 0;
	const drops = LAYERS.flatMap((layer, depth) => {
		const count = Math.round(MAX_DROPS * layer.share);
		const from = cut;
		cut += count;
		return Array.from({ length: count }, (_, i) => ({
			depth,
			x: Math.random(),
			y: Math.random(),
			length: layer.length * (0.7 + 0.6 * Math.random()),
			speed: layer.speed * (0.85 + 0.3 * Math.random()),
			// Whether it is drawn at a given amount of rain: spread evenly through the layers.
			rank: (from + i) / MAX_DROPS,
			pick: Math.random(),
		}));
	});
	let time = 0;

	const resize = () => {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	};
	resize();

	// rain, flash and bond are 0..1. roll is the roll of the view. across is the wind across the
	// view (-1..1, which way it blows and how much of it is across), and gale its strength, 0..1
	// (1 is past hurricane force). knot is the screen position (0..1) of the knot of the weave,
	// which the bond makes the rain turn about.
	const draw = (delta: number, rain: number, flash: number, roll: number, across: number, gale: number, bond: number, knot: Point) => {
		const { width, height } = canvas;
		context.clearRect(0, 0, width, height);
		if (rain <= 0) return;
		time += delta;
		// Gusts: the drive comes and goes over some seconds.
		const gust = 1 + 0.35 * gale * Math.sin(time * 0.9) * Math.sin(time * 0.37 + 1.1);
		const drive = roll * 0.5 + across * (0.3 + 2.6 * gale) * gust;
		const paths = LAYERS.map(() => new Path2D());
		for (const drop of drops) {
			// Each drop falls, and is also carried round the knot, faster the nearer it is.
			const dx = drop.x - knot.x;
			const dy = drop.y - knot.y;
			const carry = (bond * 0.5) / (0.25 + dx * dx + dy * dy);
			// (A little flutter in a strong wind: the air the drops fall through is not smooth.)
			const flutter = gale * 0.25 * Math.sin(time * 7 + drop.pick * 40);
			const vx = (drive + flutter) * drop.speed - dy * carry;
			const vy = drop.speed + dx * carry;
			drop.x += vx * delta;
			drop.y += vy * delta;
			if (drop.y > 1 || drop.x < -0.1 || drop.x > 1.1) {
				// Back in from the top, or from the side the wind comes from, as often as the
				// slant brings drops in from there.
				const fromSide = Math.random() < Math.abs(vx) / (Math.abs(vx) + Math.abs(vy));
				drop.x = fromSide ? (vx > 0 ? -0.05 : 1.05) : Math.random() * 1.2 - 0.1;
				drop.y = fromSide ? Math.random() : -drop.length;
			}
			// Sheets of heavier rain sweeping across with the wind, and lighter between.
			const sheet = 0.5 + 0.5 * Math.sin((drop.x - 0.35 * drop.y * Math.sign(drive || 1)) * 7 - time * (0.6 + 1.6 * Math.abs(drive)));
			if (drop.rank > rain * (0.45 + 0.75 * sheet)) continue;
			const stretch = drop.length / Math.hypot(vx, vy);
			const path = paths[drop.depth]!;
			path.moveTo(drop.x * width, drop.y * height);
			path.lineTo((drop.x + vx * stretch) * width, (drop.y + vy * stretch) * height);
		}
		context.lineCap = "round";
		LAYERS.forEach((layer, depth) => {
			context.strokeStyle = `rgb(215 225 235 / ${Math.min(0.8, layer.alpha * (1 + 1.6 * flash))})`;
			context.lineWidth = layer.width;
			context.stroke(paths[depth]!);
		});
	};

	return { resize, draw };
}
