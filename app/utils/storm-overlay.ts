// Rain, drawn on a 2D canvas over the ocean.

interface Point {
	x: number;
	y: number;
}

const MAX_DROPS = 600;

export function createStormOverlay(canvas: HTMLCanvasElement) {
	const context = canvas.getContext("2d")!;
	const drops = Array.from({ length: MAX_DROPS }, () => ({
		x: Math.random(),
		y: Math.random(),
		length: 0.02 + Math.random() * 0.05,
		speed: 0.9 + Math.random() * 0.9,
	}));

	const resize = () => {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	};
	resize();

	// rain, flash and bond are 0..1. slant leans the rain with the roll of the view. knot is the
	// screen position (0..1) of the knot of the weave, which the bond makes the rain turn about.
	const draw = (delta: number, rain: number, flash: number, slant: number, bond: number, knot: Point) => {
		const { width, height } = canvas;
		context.clearRect(0, 0, width, height);
		const count = Math.floor(MAX_DROPS * rain);
		if (count === 0) return;
		context.beginPath();
		for (let i = 0; i < count; i++) {
			const drop = drops[i]!;
			// Each drop falls, and is also carried round the knot, faster the nearer it is.
			const dx = drop.x - knot.x;
			const dy = drop.y - knot.y;
			const carry = (bond * 0.5) / (0.25 + dx * dx + dy * dy);
			const vx = slant * drop.speed - dy * carry;
			const vy = drop.speed + dx * carry;
			drop.x += vx * delta;
			drop.y += vy * delta;
			if (drop.y > 1 || drop.x < -0.05 || drop.x > 1.05) {
				drop.y = -drop.length;
				drop.x = Math.random();
			}
			const stretch = drop.length / Math.hypot(vx, vy);
			context.moveTo(drop.x * width, drop.y * height);
			context.lineTo((drop.x + vx * stretch) * width, (drop.y + vy * stretch) * height);
		}
		context.strokeStyle = `rgb(215 225 235 / ${Math.min(0.75, 0.28 + 0.5 * flash)})`;
		context.lineWidth = 1;
		context.stroke();
	};

	return { resize, draw };
}
