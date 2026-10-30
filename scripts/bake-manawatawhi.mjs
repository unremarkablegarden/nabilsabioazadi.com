// node scripts/bake-manawatawhi.mjs <tile folder> <out>: makes public/textures/manawatawhi.bin, Great Island of Manawatāwhi
// as it is drawn (island.ts), from Mapzen's Terrarium elevation tiles (zoom 14, x 16024-16028, y 9846-9849; open data on AWS,
// credited on the page). The shape is real to about 30 m, which is what the survey behind the tiles can see. What is finer is
// worked out from that shape: rain run down it to cut the gullies, then the coast steepened. Nothing is placed by hand.
import { readFileSync, writeFileSync } from "node:fs";
import { inflateSync } from "node:zlib";

const [folder, out] = process.argv.slice(2);
const X0 = 16024, Y0 = 9846, ACROSS = 5, DOWN = 4, TILE = 256;
const METRES = (40075016 * Math.cos((34.16 * Math.PI) / 180)) / 2 ** 14 / TILE;

function readTile(path) {
	const bytes = readFileSync(path);
	let at = 8, width, height, parts = [];
	while (at < bytes.length) {
		const length = bytes.readUInt32BE(at), kind = bytes.toString("latin1", at + 4, at + 8), body = bytes.subarray(at + 8, at + 8 + length);
		if (kind === "IHDR") [width, height] = [body.readUInt32BE(0), body.readUInt32BE(4)];
		if (kind === "IDAT") parts.push(body);
		at += 12 + length;
	}
	const raw = inflateSync(Buffer.concat(parts)), stride = width * 3, pixels = new Uint8Array(height * stride);
	for (let y = 0; y < height; y++) {
		const filter = raw[y * (stride + 1)];
		for (let i = 0; i < stride; i++) {
			const value = raw[y * (stride + 1) + 1 + i], a = i >= 3 ? pixels[y * stride + i - 3] : 0, b = y ? pixels[(y - 1) * stride + i] : 0, c = i >= 3 && y ? pixels[(y - 1) * stride + i - 3] : 0;
			const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
			pixels[y * stride + i] = value + [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][filter];
		}
	}
	return pixels;
}

// The island alone, the sea-level speckle of the survey and the other islands left out.
const WIDE = ACROSS * TILE, TALL = DOWN * TILE, whole = new Float32Array(WIDE * TALL);
for (let i = 0; i < ACROSS; i++) for (let j = 0; j < DOWN; j++) {
	const pixels = readTile(`${folder}/t_14_${X0 + i}_${Y0 + j}.png`);
	for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
		const p = (y * TILE + x) * 3;
		whole[(j * TILE + y) * WIDE + i * TILE + x] = pixels[p] * 256 + pixels[p + 1] + pixels[p + 2] / 256 - 32768;
	}
}
// The survey's coast is smeared outwards over 30 m of sea; its true area (about 4 km²) comes back with the waterline here.
const SHORE = 11;
let top = 0, topAt = 0;
whole.forEach((value, i) => { if (value > top) [top, topAt] = [value, i]; });
const island = new Uint8Array(WIDE * TALL), stack = [topAt];
island[topAt] = 1;
while (stack.length) {
	const i = stack.pop();
	for (const next of [i - 1, i + 1, i - WIDE, i + WIDE]) if (next >= 0 && next < WIDE * TALL && !island[next] && whole[next] > SHORE) { island[next] = 1; stack.push(next); }
}

// A square about the island, 7 km across, one in four kept for the sea's distance from shore at 16 m a texel.
const SIZE = 880, cx = 563, cy = 449, left = cx - SIZE / 2 | 0, up = cy - SIZE / 2 | 0;
const field = new Float32Array(SIZE * SIZE);
for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
	const X = x + left, Y = y + up, inside = X >= 0 && Y >= 0 && X < WIDE && Y < TALL;
	field[y * SIZE + x] = inside && island[Y * WIDE + X] ? (whole[Y * WIDE + X] - SHORE) * (top / (top - SHORE)) : -1;
}
const at = (x, y) => field[Math.max(0, Math.min(SIZE - 1, y)) * SIZE + Math.max(0, Math.min(SIZE - 1, x))];

// Smoothed once, as the tiles are 30 m cells enlarged and show their stairs.
{
	const copy = field.slice();
	for (let pass = 0; pass < 2; pass++) {
		const from = copy.slice();
		for (let y = 1; y < SIZE - 1; y++) for (let x = 1; x < SIZE - 1; x++) {
			if (from[y * SIZE + x] < 0) continue;
			let sum = 0, n = 0;
			for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const v = from[(y + dy) * SIZE + x + dx]; if (v >= 0) { sum += v; n++; } }
			copy[y * SIZE + x] = sum / n;
		}
	}
	field.set(copy);
}

// Rain: each drop runs downhill from where it fell, taking soil where it goes fast and leaving it where it slows.
let seed = 11;
const random = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
function slopeAt(x, y) {
	const i = Math.floor(x), j = Math.floor(y), u = x - i, v = y - j;
	const a = at(i, j), b = at(i + 1, j), c = at(i, j + 1), d = at(i + 1, j + 1);
	return { height: a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v, gx: (b - a) * (1 - v) + (d - c) * v, gy: (c - a) * (1 - u) + (d - b) * u };
}
const DROPS = 500_000;
for (let drop = 0; drop < DROPS; drop++) {
	let x = 1 + random() * (SIZE - 3), y = 1 + random() * (SIZE - 3), dx = 0, dy = 0, speed = 1, water = 1, soil = 0;
	if (at(x | 0, y | 0) <= 0) continue;
	for (let step = 0; step < 60; step++) {
		const i = Math.floor(x), j = Math.floor(y), u = x - i, v = y - j;
		const here = slopeAt(x, y);
		dx = dx * 0.25 - here.gx * 0.75; dy = dy * 0.25 - here.gy * 0.75;
		const length = Math.hypot(dx, dy);
		if (length < 1e-4) break;
		dx /= length; dy /= length; x += dx; y += dy;
		if (x < 1 || y < 1 || x > SIZE - 3 || y > SIZE - 3) break;
		const fall = here.height - slopeAt(x, y).height;
		if (slopeAt(x, y).height <= 0) break;
		const room = Math.max(fall, 0.02) * speed * water * 4;
		// Positive leaves soil here, negative takes it.
		const change = fall < 0 ? Math.min(-fall, soil) : soil > room ? (soil - room) * 0.3 : -Math.min((room - soil) * 0.3, fall);
		soil -= change;
		const w = [(1 - u) * (1 - v), u * (1 - v), (1 - u) * v, u * v], cells = [[i, j], [i + 1, j], [i, j + 1], [i + 1, j + 1]];
		cells.forEach(([cellX, cellY], k) => { const p = cellY * SIZE + cellX; if (field[p] > 0) field[p] = Math.max(0.05, field[p] + change * w[k]); });
		speed = Math.sqrt(Math.max(0.01, speed * speed + fall * 4));
		water *= 0.98;
	}
}

// How far each place is from the shore, by sweeping, in metres: positive on the water, negative ashore.
function distanceFromShore(isOn) {
	const far = 1e9, d = new Float32Array(SIZE * SIZE).fill(far);
	for (let i = 0; i < SIZE * SIZE; i++) if (isOn(i)) d[i] = 0;
	const STRAIGHT = 1, SLANT = Math.SQRT2;
	for (let round = 0; round < 2; round++) {
		for (let y = 1; y < SIZE - 1; y++) for (let x = 1; x < SIZE - 1; x++) { const i = y * SIZE + x; d[i] = Math.min(d[i], d[i - 1] + STRAIGHT, d[i - SIZE] + STRAIGHT, d[i - SIZE - 1] + SLANT, d[i - SIZE + 1] + SLANT); }
		for (let y = SIZE - 2; y > 0; y--) for (let x = SIZE - 2; x > 0; x--) { const i = y * SIZE + x; d[i] = Math.min(d[i], d[i + 1] + STRAIGHT, d[i + SIZE] + STRAIGHT, d[i + SIZE + 1] + SLANT, d[i + SIZE - 1] + SLANT); }
	}
	return d;
}
const fromLand = distanceFromShore((i) => field[i] > 0), fromSea = distanceFromShore((i) => field[i] <= 0);

// The coast of an island in a great ocean is cut back to cliffs: the land within 70 m of the sea lifts sharply off the water.
// And the sea bed falls away from the shore, for the rock showing in the troughs of the swell.
for (let i = 0; i < SIZE * SIZE; i++) {
	if (field[i] > 0) {
		const lift = Math.min(1, (fromSea[i] * METRES) / 70);
		field[i] += 26 * lift * lift * (3 - 2 * lift) * (1 - Math.min(1, field[i] / 120));
	} else field[i] = -Math.min(45, 1 + fromLand[i] * METRES * 0.25);
}

// Half a metre in a grid of 16 bits, then the sea's distance from shore, a quarter the size, 8 bits, 4 m a step.
const COARSE = 220, heights = new Int16Array(SIZE * SIZE), shore = new Uint8Array(COARSE * COARSE);
for (let i = 0; i < SIZE * SIZE; i++) heights[i] = Math.round(field[i] * 50);
for (let y = 0; y < COARSE; y++) for (let x = 0; x < COARSE; x++) shore[y * COARSE + x] = Math.min(255, (fromLand[y * 4 * SIZE + x * 4] * METRES) / 4);
const head = new Float32Array([SIZE, COARSE, METRES, 0]);
writeFileSync(out, Buffer.concat([Buffer.from(head.buffer), Buffer.from(heights.buffer), Buffer.from(shore.buffer)]));
let high = 0, land = 0;
for (const value of field) { if (value > high) high = value; if (value > 0) land++; }
console.log({ metres: METRES, top: high, landKm2: (land * METRES * METRES) / 1e6, kb: Math.round((16 + heights.byteLength + shore.byteLength) / 1024) });
