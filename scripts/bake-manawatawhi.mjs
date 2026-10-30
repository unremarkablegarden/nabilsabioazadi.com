// node scripts/bake-manawatawhi.mjs <survey.f32> <gebco.json> <out>: makes public/textures/manawatawhi.bin, the islands of
// Manawatāwhi as they are drawn (island.ts). The land is the Copernicus GLO-30 survey (tile Copernicus_DSM_COG_10_S35_00_E172_00_DEM,
// 1 arc second, about 30 m; the window below read out to 32-bit floats, north row first). The coast is the survey's own. Its narrow
// summits read low, so each island's top is brought up to its recorded height, the ground near the sea left where it is. Between the
// survey's cells only one thing is worked out rather than measured: rain run down the land to cut the gullies. The islands stand where
// they are, seen from a real place in open water (BOAT). The seabed is GEBCO 2020, about 450 m a cell (sampled through api.opentopodata.org as a 64 by 44 grid over the same
// window): it says how deep the bank is, not how the rock falls in the last hundreds of metres, so there the depth is held to a
// steep slope from the shore.
import { readFileSync, writeFileSync } from "node:fs";

const [surveyPath, gebcoPath, out] = process.argv.slice(2);
const WEST = 171.98, NORTH = -34.08, WIDE = 864, TALL = 576, ARC = 1 / 3600;
const BOAT = { latitude: -34.1778, longitude: 172.1158 };
const TO_EAST = 111320 * Math.cos((34.16 * Math.PI) / 180), TO_SOUTH = 110950;
const CELL = 8;
const eastOf = (longitude) => (longitude - BOAT.longitude) * TO_EAST;
const southOf = (latitude) => (BOAT.latitude - latitude) * TO_SOUTH;

// Names and heights from the records; `kind` says what grows there (island.ts).
const ISLANDS = [
	{ name: "Manawatāwhi, Great Island", latitude: -34.1564, longitude: 172.139, top: 295, kind: 0 },
	{ name: "Moekawa, South West Island", latitude: -34.1768, longitude: 172.0725, top: 207, kind: 1 },
	{ name: "Ōhau, West Island", latitude: -34.1855, longitude: 172.034, top: 177, kind: 1 },
	{ name: "Oromaki, North East Island", latitude: -34.1323, longitude: 172.1675, top: 111, kind: 1 },
	{ name: "the Princes Islands", latitude: -34.1775, longitude: 172.048, top: 106, kind: 2 },
];

const survey = new Float32Array(readFileSync(surveyPath).buffer.slice(0));
const pieces = new Int32Array(WIDE * TALL).fill(-1);
const found = [];
for (let start = 0; start < WIDE * TALL; start++) {
	if (survey[start] <= 0 || pieces[start] >= 0) continue;
	const piece = found.length, stack = [start];
	pieces[start] = piece;
	let cells = 0, top = 0, sumX = 0, sumY = 0;
	while (stack.length) {
		const i = stack.pop();
		cells++; top = Math.max(top, survey[i]); sumX += i % WIDE; sumY += (i / WIDE) | 0;
		for (const next of [i - 1, i + 1, i - WIDE, i + WIDE]) if (next >= 0 && next < WIDE * TALL && survey[next] > 0 && pieces[next] < 0) { pieces[next] = piece; stack.push(next); }
	}
	const [latitude, longitude] = [NORTH - (sumY / cells) * ARC, WEST + (sumX / cells) * ARC];
	// (Speckle of the survey at sea level left out; rocks that stand three metres clear kept.)
	const owner = top < 3 ? -1 : ISLANDS.map((island, n) => [Math.hypot(eastOf(island.longitude) - eastOf(longitude), southOf(island.latitude) - southOf(latitude)), n]).sort((a, b) => a[0] - b[0])[0][1];
	found.push({ owner, top, cells });
}

function bicubic(values, x, y) {
	const cubic = (a, b, c, d, t) => b + 0.5 * t * (c - a + t * (2 * a - 5 * b + 4 * c - d + t * (3 * (b - c) + d - a)));
	const i = Math.floor(x), j = Math.floor(y), row = [];
	for (let dy = -1; dy <= 2; dy++) {
		const v = (dx) => values(i + dx, j + dy);
		row.push(cubic(v(-1), v(0), v(1), v(2), x - i));
	}
	return cubic(row[0], row[1], row[2], row[3], y - j);
}

let seed = 11;
const random = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

const patches = ISLANDS.map((island, n) => {
	let x0 = WIDE, x1 = 0, y0 = TALL, y1 = 0;
	for (let i = 0; i < WIDE * TALL; i++) if (pieces[i] >= 0 && found[pieces[i]].owner === n) { const x = i % WIDE, y = (i / WIDE) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
	const margin = 240;
	const east0 = eastOf(WEST + x0 * ARC) - margin, east1 = eastOf(WEST + x1 * ARC) + margin, south0 = southOf(NORTH - y0 * ARC) - margin, south1 = southOf(NORTH - y1 * ARC) + margin;
	const across = Math.ceil((east1 - east0) / CELL), down = Math.ceil((south1 - south0) / CELL);
	const here = (x, y) => {
		const cx = Math.max(0, Math.min(WIDE - 1, x)), cy = Math.max(0, Math.min(TALL - 1, y)), i = cy * WIDE + cx;
		// The sea a little under nought, so that the coast between cells is a curve and not the survey's stairs.
		return pieces[i] >= 0 && found[pieces[i]].owner === n ? survey[i] : -8;
	};
	const field = new Float32Array(across * down);
	for (let y = 0; y < down; y++) for (let x = 0; x < across; x++) {
		const longitude = BOAT.longitude + (east0 + x * CELL) / TO_EAST, latitude = BOAT.latitude - (south0 + y * CELL) / TO_SOUTH;
		field[y * across + x] = bicubic(here, (longitude - WEST) / ARC, (NORTH - latitude) / ARC);
	}
	const at = (x, y) => field[Math.max(0, Math.min(down - 1, y)) * across + Math.max(0, Math.min(across - 1, x))];
	const slopeAt = (x, y) => {
		const i = Math.floor(x), j = Math.floor(y), u = x - i, v = y - j, a = at(i, j), b = at(i + 1, j), c = at(i, j + 1), d = at(i + 1, j + 1);
		return { height: a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v, gx: (b - a) * (1 - v) + (d - c) * v, gy: (c - a) * (1 - u) + (d - b) * u };
	};
	// Smoothed, as bicubic enlargement still shows the survey's cells, and rain would cut along them.
	for (let pass = 0; pass < 4; pass++) {
		const from = field.slice();
		for (let y = 1; y < down - 1; y++) for (let x = 1; x < across - 1; x++) {
			const i = y * across + x;
			if (from[i] > 4) field[i] = (from[i] * 2 + from[i - 1] + from[i + 1] + from[i - across] + from[i + across]) / 6;
		}
	}
	// Rain: each drop runs downhill from where it fell, taking soil where it goes fast and leaving it where it slows.
	const drops = Math.round(across * down * 1.2);
	for (let drop = 0; drop < drops; drop++) {
		let x = 1 + random() * (across - 3), y = 1 + random() * (down - 3), dx = 0, dy = 0, speed = 1, water = 1, soil = 0;
		if (at(x | 0, y | 0) <= 2) continue;
		for (let step = 0; step < 60; step++) {
			const i = Math.floor(x), j = Math.floor(y), u = x - i, v = y - j, was = slopeAt(x, y);
			dx = dx * 0.25 - was.gx * 0.75; dy = dy * 0.25 - was.gy * 0.75;
			const length = Math.hypot(dx, dy);
			if (length < 1e-4) break;
			dx /= length; dy /= length; x += dx; y += dy;
			if (x < 1 || y < 1 || x > across - 3 || y > down - 3) break;
			const now = slopeAt(x, y).height, fall = was.height - now;
			if (now <= 1) break;
			const room = Math.max(fall, 0.02) * speed * water * 4;
			// Positive leaves soil here, negative takes it.
			const change = fall < 0 ? Math.min(-fall, soil) : soil > room ? (soil - room) * 0.3 : -Math.min((room - soil) * 0.06, fall * 0.5);
			soil -= change;
			[[i, j, (1 - u) * (1 - v)], [i + 1, j, u * (1 - v)], [i, j + 1, (1 - u) * v], [i + 1, j + 1, u * v]].forEach(([cx, cy, w]) => { const p = cy * across + cx; if (field[p] > 1) field[p] = Math.max(1, field[p] + change * w); });
			speed = Math.sqrt(Math.max(0.01, speed * speed + fall * 4));
			water *= 0.98;
		}
	}
	// Up to the recorded height, the more the higher: the coast stays where the survey has it.
	let high = 0;
	for (const value of field) high = Math.max(high, value);
	const more = island.top / high - 1;
	for (let i = 0; i < field.length; i++) if (field[i] > 0) field[i] *= 1 + more * (field[i] / high) ** 2;
	// Under the water, the rock falling away, for what shows in the troughs of a swell.
	for (let i = 0; i < field.length; i++) if (field[i] <= 0) field[i] = Math.max(-45, field[i] * 3);
	return { island, east0, south0, across, down, field, surveyTop: high };
});

// The seabed, and the sea's distance from the nearest shore, over the whole group at 16 m.
const gebco = JSON.parse(readFileSync(gebcoPath, "utf8"));
function seabedAt(latitude, longitude) {
	const x = Math.max(0, Math.min(gebco.nx - 1.001, ((longitude - gebco.lo0) / (gebco.lo1 - gebco.lo0)) * (gebco.nx - 1))), y = Math.max(0, Math.min(gebco.ny - 1.001, ((latitude - gebco.la0) / (gebco.la1 - gebco.la0)) * (gebco.ny - 1)));
	const i = Math.floor(x), j = Math.floor(y), u = x - i, v = y - j, cell = (a, b) => gebco.elev[b * gebco.nx + a];
	return cell(i, j) * (1 - u) * (1 - v) + cell(i + 1, j) * u * (1 - v) + cell(i, j + 1) * (1 - u) * v + cell(i + 1, j + 1) * u * v;
}
const eastMin = Math.min(...patches.map((p) => p.east0)) - 1000, eastMax = Math.max(...patches.map((p) => p.east0 + p.across * CELL)) + 1000;
const southMin = Math.min(...patches.map((p) => p.south0)) - 1000, southMax = Math.max(...patches.map((p) => p.south0 + p.down * CELL)) + 1000;
const SHORE_CELL = 16, shoreWide = Math.ceil((eastMax - eastMin) / SHORE_CELL), shoreTall = Math.ceil((southMax - southMin) / SHORE_CELL);
const distance = new Float32Array(shoreWide * shoreTall).fill(1e9), depths = [];
for (const { east0, south0, across, down, field } of patches) for (let y = 0; y < down; y += 2) for (let x = 0; x < across; x += 2) {
	if (field[y * across + x] <= 0) continue;
	const cx = Math.floor((east0 + x * CELL - eastMin) / SHORE_CELL), cy = Math.floor((south0 + y * CELL - southMin) / SHORE_CELL);
	distance[cy * shoreWide + cx] = 0;
}
for (let round = 0; round < 2; round++) {
	for (let y = 1; y < shoreTall - 1; y++) for (let x = 1; x < shoreWide - 1; x++) { const i = y * shoreWide + x; distance[i] = Math.min(distance[i], distance[i - 1] + 1, distance[i - shoreWide] + 1, distance[i - shoreWide - 1] + Math.SQRT2, distance[i - shoreWide + 1] + Math.SQRT2); }
	for (let y = shoreTall - 2; y > 0; y--) for (let x = shoreWide - 2; x > 0; x--) { const i = y * shoreWide + x; distance[i] = Math.min(distance[i], distance[i + 1] + 1, distance[i + shoreWide] + 1, distance[i + shoreWide + 1] + Math.SQRT2, distance[i + shoreWide - 1] + Math.SQRT2); }
}
const shore = new Uint8Array(shoreWide * shoreTall * 2);
for (let y = 0; y < shoreTall; y++) for (let x = 0; x < shoreWide; x++) {
	const i = y * shoreWide + x, metres = distance[i] * SHORE_CELL;
	shore[i * 2] = Math.min(255, metres / 4);
	const longitude = BOAT.longitude + (eastMin + x * SHORE_CELL) / TO_EAST, latitude = BOAT.latitude - (southMin + y * SHORE_CELL) / TO_SOUTH;
	// (The chart's cells over the land read as hills, and nearest the shore it knows nothing; a steep-to coast falls 3 m in 10.)
	const depth = Math.min(Math.max(0, -seabedAt(latitude, longitude)) || 500, metres * 0.3);
	if (metres > 0 && metres < 1000) depths.push(depth);
	shore[i * 2 + 1] = Math.min(255, depth / 2);
}
depths.sort((a, b) => a - b);
console.log("seabed within 1 km of shore, m:", { min: depths[0], p10: depths[depths.length * 0.1 | 0], median: depths[depths.length >> 1], p90: depths[depths.length * 0.9 | 0], max: depths.at(-1) });

const head = [patches.length, shoreWide, shoreTall, SHORE_CELL, eastMin, southMin, CELL, 0];
for (const p of patches) head.push(p.across, p.down, p.east0, p.south0, p.island.kind, 0, 0, 0);
const parts = [Buffer.from(new Float32Array(head).buffer)];
for (const p of patches) {
	const stored = new Int16Array(p.field.length);
	for (let i = 0; i < stored.length; i++) stored[i] = Math.round(p.field[i] * 50);
	parts.push(Buffer.from(stored.buffer));
	let land = 0, high = 0;
	for (const value of p.field) { if (value > 0) land++; high = Math.max(high, value); }
	const [dE, dS] = [p.east0 + (p.across * CELL) / 2, p.south0 + (p.down * CELL) / 2];
	console.log(p.island.name, { hectares: +((land * CELL * CELL) / 1e4).toFixed(1), top: +high.toFixed(0), surveyTop: +p.surveyTop.toFixed(0), km: +(Math.hypot(dE, dS) / 1000).toFixed(1), bearing: Math.round(((Math.atan2(dE, -dS) * 180) / Math.PI + 360) % 360), grid: `${p.across}x${p.down}` });
}
parts.push(Buffer.from(shore));
const whole = Buffer.concat(parts);
writeFileSync(out, whole);
console.log({ boatOver: seabedAt(BOAT.latitude, BOAT.longitude), kb: Math.round(whole.length / 1024), shore: `${shoreWide}x${shoreTall}` });
