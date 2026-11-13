// The shapes of the clouds, worked out as voxel grids off the main thread (clouds.ts asks for
// them, one message a shape, and gets each back as bytes). Two kinds:
//
// - a cumulus cluster: a few cells sitting on one flat base (the condensation level, where every
//   rising parcel of air reaches the same temperature and its vapour condenses), each a rounded
//   tower eroded into billows by cellular noise, finer at the edges; under a lid (an inversion)
//   the tops flatten and spread sideways, as stratocumulus and anvils do;
// - a sheet: a slab of cloud broken into cells by noise, with `cover` the share of it that is
//   cloud seen from above (the gaps are cut at the level that gives exactly that), a lumpy top, and tiles that fade at their sides so that neighbours add up to one; with
//   `streets` the cells stretch along x, which clouds.ts turns along the wind.
//
// Nothing here is an emblem: every shape is noise cut by the plain geometry of a cloud, a flat
// bottom, a rounded top, a lid.

export type ShapeKind = "cumulus" | "sheet";

export interface ShapeAsk {
	id: number;
	kind: ShapeKind;
	// Voxels on x, y and z. y is up.
	size: [number, number, number];
	seed: number;
	// Cumulus: how wide the cells are against their height (2.2 is a flat fair-weather cumulus,
	// 0.8 a tower), how many cells, how much their tops are held flat (0..1), how far they spread
	// under that lid (0..1), and how far the tallest reaches up (0..1).
	aspect: number;
	cells: number;
	// How many times the usual width the box is (a bank of more cells, each the usual size): the
	// noise is that much finer across it, so the billows are the usual size.
	widen: number;
	lid: number;
	spread: number;
	tower: number;
	// How ragged its base is, hanging as scud below it (0..1): in rain.
	ragged?: number;
	// Sheet: the share of the slab that is cloud (0..1), how much its cells run in streets (0..1),
	// its thickness as a share of the box's height (0..0.75), and how many cells across the tile.
	cover: number;
	streets: number;
	thickness: number;
	lumps: number;
	// How the renderer will see it from above: the optical depth a column has for each unit of
	// `column` (the volume's extinction times its box's height over its longest side), and the
	// optical depth from which a column counts as cloud.
	depthScale: number;
	seenAt: number;
}

export interface ShapeAnswer {
	id: number;
	size: [number, number, number];
	// Density 0..255, x fastest, then y, then z.
	data: Uint8Array;
	// Each column's depth seen from above (x fastest, then z): the sum down it of the density over
	// the mean density of the cloudy voxels, over the voxels down it, which is how the renderer
	// weighs density. Times the extinction and the box's height over its longest side, it is the
	// column's optical depth.
	column: Float32Array;
}

// The columns of a grid, as ShapeAnswer.column.
function columnsOf(data: Uint8Array, [nx, ny, nz]: [number, number, number]) {
	let sum = 0;
	let count = 0;
	for (const d of data)
		if (d > 0) {
			sum += d;
			count++;
		}
	const mean = count ? sum / count : 1;
	const column = new Float32Array(nx * nz);
	for (let k = 0; k < nz; k++)
		for (let j = 0; j < ny; j++)
			for (let i = 0; i < nx; i++) column[i + nx * k]! += data[i + nx * (j + ny * k)]! / mean / ny;
	return column;
}

// Seeded, sinless hash: the same on every machine.
const hash3 = (x: number, y: number, z: number, seed: number) => {
	let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1442695041) + Math.imul(seed, 2246822519)) | 0;
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a: number, b: number, v: number) => smooth(clamp01((v - a) / (b - a)));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Value noise, 0..1.
const value3 = (x: number, y: number, z: number, seed: number) => {
	const xi = Math.floor(x);
	const yi = Math.floor(y);
	const zi = Math.floor(z);
	const fx = smooth(x - xi);
	const fy = smooth(y - yi);
	const fz = smooth(z - zi);
	const c = (dx: number, dy: number, dz: number) => hash3(xi + dx, yi + dy, zi + dz, seed);
	const x00 = lerp(c(0, 0, 0), c(1, 0, 0), fx);
	const x10 = lerp(c(0, 1, 0), c(1, 1, 0), fx);
	const x01 = lerp(c(0, 0, 1), c(1, 0, 1), fx);
	const x11 = lerp(c(0, 1, 1), c(1, 1, 1), fx);
	return lerp(lerp(x00, x10, fy), lerp(x01, x11, fy), fz);
};

const fbm3 = (x: number, y: number, z: number, seed: number, octaves: number) => {
	let sum = 0;
	let amplitude = 0.5;
	let total = 0;
	for (let o = 0; o < octaves; o++) {
		sum += amplitude * value3(x, y, z, seed + o * 131);
		total += amplitude;
		x = x * 2.03 + 7.1;
		y = y * 2.03 + 3.7;
		z = z * 2.03 + 1.3;
		amplitude *= 0.5;
	}
	return sum / total;
};

// Cellular (Worley) noise, 1 at the heart of each cell and 0 at its edges: the billows of a cloud.
const worley3 = (x: number, y: number, z: number, seed: number) => {
	const xi = Math.floor(x);
	const yi = Math.floor(y);
	const zi = Math.floor(z);
	let nearest = 4;
	for (let dz = -1; dz <= 1; dz++)
		for (let dy = -1; dy <= 1; dy++)
			for (let dx = -1; dx <= 1; dx++) {
				const cx = xi + dx;
				const cy = yi + dy;
				const cz = zi + dz;
				const px = cx + hash3(cx, cy, cz, seed) - x;
				const py = cy + hash3(cx, cy, cz, seed + 17) - y;
				const pz = cz + hash3(cx, cy, cz, seed + 29) - z;
				const d = px * px + py * py + pz * pz;
				if (d < nearest) nearest = d;
			}
	return 1 - clamp01(Math.sqrt(nearest));
};

const worleyFbm3 = (x: number, y: number, z: number, seed: number) =>
	worley3(x, y, z, seed) * 0.625 + worley3(x * 2, y * 2, z * 2, seed + 7) * 0.25 + worley3(x * 4, y * 4, z * 4, seed + 13) * 0.125;

// A seeded run of numbers, 0..1.
const runFrom = (seed: number) => {
	let n = 0;
	return () => hash3(n++, 11, 23, seed);
};

interface Cell {
	x: number;
	z: number;
	// Half-height, horizontal radii; the centre sits half-height above the base.
	h: number;
	rx: number;
	rz: number;
}

function cumulus(ask: ShapeAsk): Uint8Array {
	// (14 November, rebuilt after the owner found the first ones "fake": each cell was an ellipsoid sat on the
	// base by its lowest point, so every cloud had a round bottom, and the billows were all of one size, so
	// they read as cotton balls. A cumulus is rising air that condenses at one height: its base cut flat there,
	// a little narrower than the body that bulges above it, its top domed and heaped into billows on billows,
	// crisp where it is growing. Upright sides, tried first, read as loaves.)
	const [nx, ny, nz] = ask.size;
	const data = new Uint8Array(nx * ny * nz);
	const random = runFrom(ask.seed);
	const BASE = 0.08;
	const TOP = 0.88;
	const cells: Cell[] = [];
	const count = Math.max(1, Math.round(ask.cells));
	for (let i = 0; i < count; i++) {
		// The first cell stands at the middle and is the largest; the rest gather round it, of every size.
		const tallest = i === 0 || random() < 0.22;
		// Half-height in box units: the tallest reach for the top, the rest lower, most of them small.
		// (The tallest's dome stops some way under the box's top, and none is wider than leaves room at the walls:
		// the billows heap out beyond the body, and cut off by the box a cloud showed a flat top or a straight
		// side, a loaf.)
		const h = tallest ? lerp(0.22, (TOP - 0.1 - BASE) / 2, ask.tower * 0.7 + 0.3) : lerp(0.07, 0.26, random() ** 1.6);
		const r = Math.min(0.19, h * ask.aspect * lerp(0.75, 1.25, random()));
		const rx = r * lerp(0.8, 1.2, random());
		const rz = r * lerp(0.8, 1.2, random());
		// (Kept clear of the box's walls, with room for the billows: cut by a wall, a cloud showed a straight side.)
		const room = Math.max(0, 0.33 - 1.4 * Math.max(rx, rz));
		const spreadOut = i === 0 ? 0 : Math.min(room, 0.1 + 0.27 * random() * Math.min(1, count / 6));
		const angle = random() * Math.PI * 2;
		cells.push({ x: Math.cos(angle) * spreadOut, z: Math.sin(angle) * spreadOut, h, rx, rz });
	}
	const seedOff = random() * 100;
	const ragged = clamp01(ask.ragged ?? 0);
	let peak = 0;
	const field = new Float32Array(nx * ny * nz);
	for (let k = 0; k < nz; k++) {
		const z = (k + 0.5) / nz - 0.5;
		for (let j = 0; j < ny; j++) {
			const y = (j + 0.5) / ny;
			// (Scud hangs below a raining base.)
			if (y < BASE - 0.06 * ragged) continue;
			// Under a lid the cells widen as they near it (spreading), and the top is cut flat.
			const underLid = smoothstep(TOP - 0.38, TOP - 0.06, y);
			const widen = 1 + ask.spread * 0.7 * underLid;
			const capped = 1 - ask.lid * smoothstep(TOP - 0.07, TOP, y);
			for (let i = 0; i < nx; i++) {
				const x = (i + 0.5) / nx - 0.5;
				// Envelope: each cell a column from the base with a domed top; the nearest, with a little of the
				// others so that they join. How high in the cell this is decides how much it is heaped.
				let best = -1;
				let glue = 0;
				let heaped = 0;
				for (const c of cells) {
					const dx = (x - c.x) / (c.rx * widen);
					const dz = (z - c.z) / (c.rz * widen);
					// A rounded body whose middle stands a little above the base, so that the base cuts it flat a
					// little narrower than its widest; the dome over it a little taller than the body is wide.
					const mid = BASE + 0.62 * c.h;
					const dy = y > mid ? (y - mid) / (1.38 * c.h) : (y - mid) / (1.0 * c.h);
					const e = 1 - Math.sqrt(dx * dx + dz * dz + dy * dy);
					if (e > best) {
						best = e;
						heaped = clamp01((y - BASE) / (2 * c.h));
					}
					if (e > 0) glue += e;
				}
				// (The joining is capped: summed over the many cells of a bank it swelled the whole bank out to the box's
				// walls, and the walls showed as straight sides.)
				let e = best + 0.12 * Math.min(0.7, glue - Math.max(0, best));
				if (e <= -0.45) continue;
				// Billows on billows, at three scales, heaped more the higher in the cell (cauliflower), none at the
				// base: each scale's cells push the surface out where they are and leave clefts between.
				const wx = x * ask.widen + seedOff;
				const wz = z * ask.widen + seedOff;
				// (Heaped everywhere above the base, most on top: billows on the sides too, or the sides are walls.)
				const heap = 0.45 * smoothstep(0.03, 0.15, heaped) + 0.55 * smoothstep(0.25, 0.7, heaped);
				// (Turrets: the largest billows a third of a tall cell across, so that its top breaks into several; at a
				// third of that size again, smooth domes seen far off stood as tombstones.)
				const big = worley3(wx * 4.6, y * 4.6, wz * 4.6, ask.seed);
				const mid_ = worley3(wx * 10, y * 10, wz * 10, ask.seed + 7);
				const small = worley3(wx * 21, y * 21, wz * 21, ask.seed + 13);
				// (In rain the cloud is no longer growing crisp: its billows sink into it and it frays.)
				e += heap * (1 - 0.55 * ragged) * (0.55 * (big - 0.55) + 0.26 * (mid_ - 0.55) + 0.11 * (small - 0.55));
				// The sides are softer and torn a little by the wind's eddies; the top is crisp.
				const torn = fbm3(wx * 24, y * 24, wz * 24, ask.seed + 3, 3);
				e -= (0.09 * (1 - heap) + 0.16 * ragged) * (1 - torn);
				// The base: flat where the air condenses, a little uneven; ragged and hanging in rain.
				const baseLine = BASE + 0.008 * (fbm3(wx * 9, 0.5, wz * 9, ask.seed + 21, 2) - 0.5) - 0.06 * ragged * fbm3(wx * 6, 1.5, wz * 6, ask.seed + 23, 3);
				e *= smoothstep(baseLine, baseLine + 0.012, y) * capped;
				// Nothing reaches the box's walls.
				e *= smoothstep(0, 0.1, 0.5 - Math.abs(x)) * smoothstep(0, 0.1, 0.5 - Math.abs(z)) * (1 - smoothstep(0.93, 1, y));
				if (e <= 0) continue;
				// Dense almost at once inside its surface where it is heaped (a growing top is sharp), more softly at
				// the sides and base; a little uneven inside.
				const edge = lerp(0.16, 0.06, heap * (1 - ragged)) + 0.12 * ragged;
				const d = smoothstep(0, edge, e) * (0.8 + 0.2 * fbm3(wx * 5, y * 5, wz * 5, ask.seed + 31, 2));
				field[i + nx * (j + ny * k)] = d;
				if (d > peak) peak = d;
			}
		}
	}
	for (let n = 0; n < field.length; n++) data[n] = Math.round((field[n]! / (peak || 1)) * 255);
	return data;
}

function sheet(ask: ShapeAsk): Uint8Array {
	const [nx, ny, nz] = ask.size;
	const data = new Uint8Array(nx * ny * nz);
	const random = runFrom(ask.seed);
	const seedOff = random() * 100;
	const BASE = 0.18;
	const freq = Math.max(1.5, ask.lumps);
	const stretch = 1 - 0.72 * clamp01(ask.streets);
	// First the slab with no gaps, and the cell noise that will cut them.
	const slab = new Float32Array(nx * ny * nz);
	const cellNoise = new Float32Array(nx * nz);
	// Each column's slab summed down it, and its cloudy voxels.
	const slabSum = new Float32Array(nx * nz);
	const slabCount = new Uint16Array(nx * nz);
	for (let k = 0; k < nz; k++) {
		const z = (k + 0.5) / nz - 0.5;
		for (let i = 0; i < nx; i++) {
			const x = (i + 0.5) / nx - 0.5;
			const u = x * stretch;
			const c = i + nx * k;
			cellNoise[c] = fbm3(u * freq + seedOff, 0.37, z * freq + seedOff, ask.seed, 4);
			// A lumpy top; the base is flat.
			const top = BASE + ask.thickness * (0.55 + 0.45 * worley3(u * freq * 1.6 + seedOff, 0.5, z * freq * 1.6, ask.seed + 5));
			// Tiles fade at their sides over a tenth, as neighbours overlap by a tenth: they add up to one.
			const side = clamp01((0.5 - Math.abs(x)) / 0.1) * clamp01((0.5 - Math.abs(z)) / 0.1);
			for (let j = 0; j < ny; j++) {
				const y = (j + 0.5) / ny;
				const inside = smoothstep(BASE, BASE + 0.05, y) * (1 - smoothstep(top - 0.1, top, y));
				if (inside <= 0) continue;
				const body = 0.55 + 0.45 * fbm3(x * 10 + seedOff, y * 4, z * 10, ask.seed + 9, 2);
				const v = clamp01(inside * body * side);
				if (v <= 0) continue;
				slab[i + nx * (j + ny * k)] = v;
				slabSum[c]! += v;
				slabCount[c]!++;
			}
		}
	}
	// The gaps are where the cell noise is under a level; the level is found that leaves `cover` of
	// the tile's middle (away from its fading sides) cloud seen from above.
	const mask = (level: number, c: number) => smoothstep(level - 0.12, level + 0.12, cellNoise[c]!);
	const coverAt = (level: number) => {
		let sum = 0;
		let count = 0;
		for (let c = 0; c < nx * nz; c++) {
			const m = mask(level, c);
			if (m <= 0) continue;
			sum += m * slabSum[c]!;
			count += slabCount[c]!;
		}
		const mean = count ? sum / count : 1;
		let seen = 0;
		let all = 0;
		for (let k = 0; k < nz; k++) {
			if (Math.abs((k + 0.5) / nz - 0.5) > 0.4) continue;
			for (let i = 0; i < nx; i++) {
				if (Math.abs((i + 0.5) / nx - 0.5) > 0.4) continue;
				const c = i + nx * k;
				all++;
				if ((ask.depthScale * mask(level, c) * slabSum[c]!) / mean / ny >= ask.seenAt) seen++;
			}
		}
		return seen / all;
	};
	let low = -0.4;
	let high = 1.4;
	for (let step = 0; step < 28; step++) {
		const mid = (low + high) / 2;
		if (coverAt(mid) > ask.cover) low = mid;
		else high = mid;
	}
	const level = (low + high) / 2;
	let peak = 0;
	for (let n = 0; n < slab.length; n++) {
		const m = slab[n]! > 0 ? mask(level, n % nx + nx * Math.floor(n / (nx * ny))) : 0;
		slab[n] = slab[n]! * m;
		if (slab[n]! > peak) peak = slab[n]!;
	}
	for (let n = 0; n < slab.length; n++) data[n] = Math.round((slab[n]! / (peak || 1)) * 255);
	return data;
}

self.onmessage = (event: MessageEvent<ShapeAsk>) => {
	const ask = event.data;
	const data = ask.kind === "cumulus" ? cumulus(ask) : sheet(ask);
	const column = columnsOf(data, ask.size);
	const answer: ShapeAnswer = { id: ask.id, size: ask.size, data, column };
	(self as unknown as Worker).postMessage(answer, [data.buffer, column.buffer]);
};
