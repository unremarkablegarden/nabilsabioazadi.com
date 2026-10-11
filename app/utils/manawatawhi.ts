// The ocean is the sea round a small boat on its way from Manawatāwhi (the Three Kings Islands,
// about 55 km north-west of Te Rerenga Wairua, Cape Reinga) to Hawai'i, seen looking towards
// Hawai'i, at the local time and in the conditions where the boat is right now.
// (September's version stood at the Cape itself: -34.43, 172.68. October's first days stood at
// Manawatāwhi, before the voyage was thought of; the file keeps that name.)

// The voyage (the owner's): from open water beside Manawatāwhi (Great Island) to Hawai'i, to
// arrive by 1 July 2027. It left on 10 October 2026 and makes its landfall at Honolulu (the
// owner's too; the hours of the day are not). The boat keeps one speed along the shortest way over the
// globe, which works out at about 27 km a day: hardly more than drifting.
export const VOYAGE = {
	from: { name: "Manawatāwhi", latitude: -34.16, longitude: 172.14 },
	to: { name: "Hawaiʻi", latitude: 21.31, longitude: -157.86 },
	leaves: new Date("2026-10-10T12:00:00+13:00"),
	arrives: new Date("2027-07-01T12:00:00-10:00"),
};

const RADIANS = Math.PI / 180;
const EARTH_RADIUS = 6371;
// A place on the globe as a direction from its centre.
const onGlobe = ({ latitude, longitude }: { latitude: number; longitude: number }) => [
	Math.cos(latitude * RADIANS) * Math.cos(longitude * RADIANS),
	Math.cos(latitude * RADIANS) * Math.sin(longitude * RADIANS),
	Math.sin(latitude * RADIANS),
];
const START = onGlobe(VOYAGE.from);
const END = onGlobe(VOYAGE.to);
// The angle between the two ends as seen from the centre of the Earth.
const WHOLE_WAY = Math.acos(START.reduce((sum, value, i) => sum + value * END[i]!, 0));

// Where the boat is at a moment: its position, the compass bearing from there to Hawai'i (which
// is the way the view always faces), how much of the voyage is done (0..1), and the kilometres
// behind and ahead. Before it leaves it lies at Manawatāwhi; once arrived it stays.
export function boatAt(date: Date) {
	const done = Math.min(1, Math.max(0, (date.getTime() - VOYAGE.leaves.getTime()) / (VOYAGE.arrives.getTime() - VOYAGE.leaves.getTime())));
	// A point part of the way along the great circle between the two ends.
	const a = Math.sin((1 - done) * WHOLE_WAY) / Math.sin(WHOLE_WAY);
	const b = Math.sin(done * WHOLE_WAY) / Math.sin(WHOLE_WAY);
	const [x, y, z] = START.map((value, i) => a * value + b * END[i]!) as [number, number, number];
	const latitude = Math.asin(z) / RADIANS;
	const longitude = Math.atan2(y, x) / RADIANS;
	const across = (VOYAGE.to.longitude - longitude) * RADIANS;
	const bearing =
		Math.atan2(
			Math.sin(across) * Math.cos(VOYAGE.to.latitude * RADIANS),
			Math.cos(latitude * RADIANS) * Math.sin(VOYAGE.to.latitude * RADIANS) -
				Math.sin(latitude * RADIANS) * Math.cos(VOYAGE.to.latitude * RADIANS) * Math.cos(across),
		) / RADIANS;
	return {
		latitude,
		longitude,
		// At the landfall itself there is no bearing left; the last one is kept.
		bearing: done < 1 ? (bearing + 360) % 360 : 42,
		done,
		gone: done * WHOLE_WAY * EARTH_RADIUS,
		left: (1 - done) * WHOLE_WAY * EARTH_RADIUS,
	};
}

// The pace the pilgrimage keeps, in km/h: the whole way in the whole time. A little over one.
export const PACE = (WHOLE_WAY * EARTH_RADIUS) / ((VOYAGE.arrives.getTime() - VOYAGE.leaves.getTime()) / 3_600_000);

// Where the boat is for the picture being drawn. The sun, moon, stars and planets are worked
// out for this place and the view faces this bearing. `sailTo` moves it; nothing else does.
export const PLACE = boatAt(new Date());
export function sailTo(date: Date) {
	return Object.assign(PLACE, boatAt(date));
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

// Hours the boat's clock is ahead of Greenwich. It keeps Aotearoa's time while within 370 km
// (200 sea miles) of where it left, and Hawai'i's within 370 km of where it lands. Between,
// it keeps the time zones of the open sea, as ships do: one hour for each 15 degrees of
// longitude, which here means the clock goes back a day where the boat crosses the date line.
function clockAhead(date: Date) {
	const boat = boatAt(date);
	if (boat.left < 370) return -10;
	if (boat.gone < 370) {
		const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Pacific/Auckland", timeZoneName: "shortOffset" }).formatToParts(date);
		return Number(parts.find((part) => part.type === "timeZoneName")!.value.replace("GMT", "") || 0);
	}
	return Math.round(boat.longitude / 15);
}

// What the boat's clock is set to, in words: "UTC+13, Aotearoa time".
export function boatTimeZone(date = new Date()) {
	const ahead = clockAhead(date);
	const boat = boatAt(date);
	const whose = boat.left < 370 ? "Hawaiʻi time" : boat.gone < 370 ? "Aotearoa time" : "ship's time at sea";
	return `UTC${ahead >= 0 ? "+" : "−"}${Math.abs(ahead)}, ${whose}`;
}

// Time of day on the boat in hours (0..24).
export function boatHour(date = new Date()) {
	return (((date.getTime() / 3_600_000 + clockAhead(date)) % 24) + 24) % 24;
}

// The moment today, on the boat, when the clock there shows the given hour.
export function dateAtBoatHour(hour: number, now = new Date()) {
	return new Date(now.getTime() + (hour - boatHour(now)) * 3_600_000);
}

const RAD = Math.PI / 180;
// Days since noon on 1 January 2000 (UTC), the starting point of the almanac's formulas.
const daysSince2000 = (date: Date) => date.getTime() / 86_400_000 - 10957.5;
const tiltOfEarth = (days: number) => (23.439 - 0.00000036 * days) * RAD;

// The sun's longitude along its yearly path, in radians.
function sunLongitude(days: number) {
	const anomaly = (357.529 + 0.98560028 * days) * RAD;
	return (280.459 + 0.98564736 * days + 1.915 * Math.sin(anomaly) + 0.02 * Math.sin(2 * anomaly)) * RAD;
}

// Where something at the given longitude and latitude on the sun's path stands in the sky at
// the boat: elevation and compass azimuth in degrees.
function inTheSky(longitude: number, latitude: number, days: number) {
	const tilt = tiltOfEarth(days);
	const rightAscension = Math.atan2(
		Math.sin(longitude) * Math.cos(tilt) - Math.tan(latitude) * Math.sin(tilt),
		Math.cos(longitude),
	);
	const declination = Math.asin(
		Math.sin(latitude) * Math.cos(tilt) + Math.cos(latitude) * Math.sin(tilt) * Math.sin(longitude),
	);
	const siderealTime = (18.697374558 + 24.06570982441908 * days) * 15 * RAD;
	const hourAngle = siderealTime + PLACE.longitude * RAD - rightAscension;
	const here = PLACE.latitude * RAD;
	const elevation = Math.asin(
		Math.sin(here) * Math.sin(declination) + Math.cos(here) * Math.cos(declination) * Math.cos(hourAngle),
	);
	const azimuth = Math.atan2(
		-Math.sin(hourAngle),
		Math.tan(declination) * Math.cos(here) - Math.sin(here) * Math.cos(hourAngle),
	);
	return { elevation: elevation / RAD, azimuth: (azimuth / RAD + 360) % 360 };
}

// Sun elevation and compass azimuth in degrees where the boat is.
// Low-precision formulas from the Astronomical Almanac, good to a fraction of a degree.
export function sunPosition(date: Date) {
	const days = daysSince2000(date);
	return inTheSky(sunLongitude(days), 0, days);
}

// A star where the boat is at a moment, from its place on the sky's map (right ascension and
// declination in degrees): elevation and compass azimuth in degrees.
export function starPosition(rightAscension: number, declination: number, date: Date) {
	const boat = boatAt(date);
	const hourAngle = (18.697374558 + 24.06570982441908 * daysSince2000(date)) * 15 * RAD + boat.longitude * RAD - rightAscension * RAD;
	const here = boat.latitude * RAD;
	const star = declination * RAD;
	return {
		elevation: Math.asin(Math.sin(here) * Math.sin(star) + Math.cos(here) * Math.cos(star) * Math.cos(hourAngle)) / RAD,
		azimuth: (Math.atan2(-Math.cos(star) * Math.sin(hourAngle), Math.cos(here) * Math.sin(star) - Math.sin(here) * Math.cos(star) * Math.cos(hourAngle)) / RAD + 360) % 360,
	};
}

// The moon where the boat is: elevation and compass azimuth in degrees, and the share of its face
// that is lit (0 new, 1 full). The Almanac's low-precision series, good to about half a degree.
export function moonPosition(date: Date) {
	const days = daysSince2000(date);
	const centuries = days / 36525;
	const sin = (degrees: number, rate: number) => Math.sin((degrees + rate * centuries) * RAD);
	const longitude =
		(218.32 +
			481267.881 * centuries +
			6.29 * sin(135.0, 477198.87) -
			1.27 * sin(259.3, -413335.36) +
			0.66 * sin(235.7, 890534.22) +
			0.21 * sin(269.9, 954397.74) -
			0.19 * sin(357.5, 35999.05) -
			0.11 * sin(186.5, 966404.03)) *
		RAD;
	const latitude =
		(5.13 * sin(93.3, 483202.02) + 0.28 * sin(228.2, 960400.89) - 0.28 * sin(318.3, 6003.15) - 0.17 * sin(217.6, -407332.21)) * RAD;
	const sky = inTheSky(longitude, latitude, days);
	// The moon is near enough that it stands up to a degree lower seen from the surface than from the Earth's centre.
	sky.elevation -= 0.95 * Math.cos(sky.elevation * RAD);
	// Lit share from how far round the sky the moon is from the sun.
	const fromSun = Math.cos(latitude) * Math.cos(longitude - sunLongitude(days));
	return { ...sky, illuminated: (1 - fromSun) / 2 };
}

// The five planets the eye can see. Their paths round the sun as six figures each, with how
// much each figure changes in a century: size of the path (in Earth-sun distances), how far it
// is from a circle, its tilt, where the planet was along it at the start of 2000, and the
// directions of its nearest point to the sun and of the line where it crosses the Earth's path
// (all in degrees). From NASA JPL's "Approximate Positions of the Planets" (Standish), good to
// a small fraction of a degree between 1800 and 2050. Then how bright it is at 1 distance from
// both sun and Earth, how that falls as less of its face is lit (three terms, from Meeus,
// "Astronomical Algorithms"), and its colour as a temperature.
const PATHS = {
	Mercury: [[0.38709927, 0.20563593, 7.00497902, 252.2503235, 77.45779628, 48.33076593], [0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081], [-0.42, 0.038, -0.000273, 0.000002, 5200]],
	Venus: [[0.72333566, 0.00677672, 3.39467605, 181.9790995, 131.60246718, 76.67984255], [0.0000039, -0.00004107, -0.0007889, 58517.81538729, 0.00268329, -0.27769418], [-4.4, 0.0009, 0.000239, -0.00000065, 6200]],
	Earth: [[1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0], [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0], [0, 0, 0, 0, 0]],
	Mars: [[1.52371034, 0.0933941, 1.84969142, -4.55343205, -23.94362959, 49.55953891], [0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343], [-1.52, 0.016, 0, 0, 4000]],
	Jupiter: [[5.202887, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909], [-0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106], [-9.4, 0.005, 0, 0, 5600]],
	Saturn: [[9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448], [-0.0012506, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794], [-8.88, 0, 0, 0, 5300]],
} as const;

// Where a planet is, with the sun at the centre: x towards the March equinox, z up out of the
// plane of the Earth's path, in Earth-sun distances.
function aroundTheSun(planet: keyof typeof PATHS, centuries: number) {
	const [start, rate] = PATHS[planet];
	const [size, flatness, tilt, place, nearest, crossing] = start.map((value, i) => value + rate[i]! * centuries) as [number, number, number, number, number, number];
	// How far round from its nearest point it would be if it moved evenly; then how far it
	// really is, since it moves faster when nearer the sun (Kepler's equation, by repetition).
	const even = ((place - nearest) % 360) * RAD;
	let angle = even;
	for (let i = 0; i < 8; i++) angle = even + flatness * Math.sin(angle);
	const x = size * (Math.cos(angle) - flatness);
	const y = size * Math.sqrt(1 - flatness ** 2) * Math.sin(angle);
	// Turned from the plane of its own path into the plane of the Earth's.
	const w = (nearest - crossing) * RAD;
	const node = crossing * RAD;
	const lean = tilt * RAD;
	return [
		(Math.cos(w) * Math.cos(node) - Math.sin(w) * Math.sin(node) * Math.cos(lean)) * x + (-Math.sin(w) * Math.cos(node) - Math.cos(w) * Math.sin(node) * Math.cos(lean)) * y,
		(Math.cos(w) * Math.sin(node) + Math.sin(w) * Math.cos(node) * Math.cos(lean)) * x + (-Math.sin(w) * Math.sin(node) + Math.cos(w) * Math.cos(node) * Math.cos(lean)) * y,
		Math.sin(w) * Math.sin(lean) * x + Math.cos(w) * Math.sin(lean) * y,
	] as const;
}

// The planets as they stand over the boat: elevation and compass azimuth in degrees, how
// bright (in magnitudes, like the stars; Saturn's rings are left out, so it may be up to a
// magnitude brighter than given), and colour as a temperature.
export function planetPositions(date: Date) {
	const days = daysSince2000(date);
	const earth = aroundTheSun("Earth", days / 36525);
	return (["Mercury", "Venus", "Mars", "Jupiter", "Saturn"] as const).map((name) => {
		const planet = aroundTheSun(name, days / 36525);
		const seen = planet.map((value, i) => value - earth[i]!) as [number, number, number];
		const fromSun = Math.hypot(...planet);
		const fromEarth = Math.hypot(...seen);
		// The angle at the planet between the sun and us: how much of its lit face is turned away.
		const phase = Math.acos((fromSun ** 2 + fromEarth ** 2 - Math.hypot(...earth) ** 2) / (2 * fromSun * fromEarth)) / RAD;
		const [atOne, first, second, third, kelvin] = PATHS[name][2];
		return {
			name,
			...inTheSky(Math.atan2(seen[1], seen[0]), Math.asin(seen[2] / fromEarth), days),
			magnitude: atOne + 5 * Math.log10(fromSun * fromEarth) + first * phase + second * phase ** 2 + third * phase ** 3,
			kelvin,
		};
	});
}

export interface SeaConditions {
	// When the models say this was true, as the clock in Aotearoa shows it ("2026-10-11T16:15").
	observedAt: string;
	// Significant wave height in metres, the compass direction the waves come from, and their period in seconds.
	waveHeight: number;
	waveDirection: number;
	wavePeriod: number;
	// The same for the two parts of that sea: swell that has travelled in from distant weather,
	// and the waves the wind here is raising now.
	swellHeight: number;
	swellDirection: number;
	swellPeriod: number;
	windWaveHeight: number;
	windWaveDirection: number;
	windWavePeriod: number;
	// A second swell, when the model finds one crossing the first (height 0 when it does not).
	secondSwellHeight: number;
	secondSwellDirection: number;
	secondSwellPeriod: number;
	// Surface current in km/h and the compass direction it flows towards.
	currentSpeed: number;
	currentDirection: number;
	// Height of the tide in metres against mean sea level.
	tide: number;
	// Wind speed and gusts in km/h, and the compass direction the wind comes from.
	windSpeed: number;
	windGusts: number;
	windDirection: number;
	// Cloud cover in percent: all of it, then low, middle and high cloud apart.
	cloudCover: number;
	cloudLow: number;
	cloudMid: number;
	cloudHigh: number;
	// Rain in mm over the last 15 minutes.
	precipitation: number;
	// How far one can see, in metres.
	visibility: number;
	// WMO weather code (95 and above are thunderstorms), and the energy in J/kg that the air
	// has for building thunderclouds.
	weatherCode: number;
	cape: number;
	// Air pressure at sea level in hPa.
	pressure: number;
	// Air and sea surface temperature in °C, and relative humidity in percent.
	airTemperature: number;
	seaTemperature: number;
	humidity: number;
	// What the weather is about to do: how much the wind (km/h), the waves (m) and the air
	// pressure (hPa) are forecast to change over the next three hours.
	windTrend: number;
	waveTrend: number;
	pressureTrend: number;
	// The wind forecast for this time tomorrow: its speed in km/h and the compass direction it
	// will come from. What the scout weave reaches up to feel for.
	tomorrowWindSpeed: number;
	tomorrowWindDirection: number;
	// Where the weather models disagree, the lowest and highest of their figures (see WEATHER_MODELS).
	doubt: Partial<Record<keyof typeof BLENDED, [number, number]>>;
}

// The state of the air as the storm's physics uses it. With no live conditions it is a mild,
// humid day: air at 14 °C over a sea at 16 °C, 85% humidity.
export function ambientAir(conditions?: SeaConditions) {
	const air = conditions?.airTemperature ?? 14;
	const sea = conditions?.seaTemperature ?? 16;
	const humidity = conditions?.humidity ?? 85;
	// Water vapour pressure in hPa (Magnus formula). Warm air holds far more water than cold.
	const vapourPressure = (humidity / 100) * 6.112 * Math.exp((17.62 * air) / (243.12 + air));
	return {
		// Against about 14 hPa, a mild humid day.
		vapour: vapourPressure / 14,
		// A sea warmer than the air heats it from below: it overturns, and the sea steams.
		instability: clamp01((sea - air) / 8),
		// Fog needs air close to saturated.
		fogginess: 0.5 + 0.7 * clamp01((humidity - 60) / 38),
	};
}

const MARINE = {
	waveHeight: "wave_height",
	waveDirection: "wave_direction",
	wavePeriod: "wave_period",
	swellHeight: "swell_wave_height",
	swellDirection: "swell_wave_direction",
	swellPeriod: "swell_wave_period",
	windWaveHeight: "wind_wave_height",
	windWaveDirection: "wind_wave_direction",
	windWavePeriod: "wind_wave_period",
	secondSwellHeight: "secondary_swell_wave_height",
	secondSwellDirection: "secondary_swell_wave_direction",
	secondSwellPeriod: "secondary_swell_wave_period",
	currentSpeed: "ocean_current_velocity",
	currentDirection: "ocean_current_direction",
	tide: "sea_level_height_msl",
	seaTemperature: "sea_surface_temperature",
} as const;

const WEATHER = {
	windSpeed: "wind_speed_10m",
	windGusts: "wind_gusts_10m",
	windDirection: "wind_direction_10m",
	cloudCover: "cloud_cover",
	cloudLow: "cloud_cover_low",
	cloudMid: "cloud_cover_mid",
	cloudHigh: "cloud_cover_high",
	precipitation: "precipitation",
	visibility: "visibility",
	weatherCode: "weather_code",
	cape: "cape",
	pressure: "pressure_msl",
	airTemperature: "temperature_2m",
	humidity: "relative_humidity_2m",
} as const;

// No one measures the weather out here, so every figure is a model's, and the models
// differ: on one afternoon four of them put the wind between 7 and 14 km/h and the low cloud
// between 0 and 53%. For what the picture leans on most, each of these is asked and the middle
// answer taken, which is right more often than any one of them. (The waves are not blended: the
// wave models split the sea into swell and wind sea in different ways, and only Météo-France's,
// the finest at about 8 km, gives every part.)
const WEATHER_MODELS = ["ecmwf_ifs025", "gfs_seamless", "icon_seamless", "ukmo_seamless"];
const BLENDED = {
	windSpeed: WEATHER.windSpeed,
	windGusts: WEATHER.windGusts,
	windDirection: WEATHER.windDirection,
	cloudCover: WEATHER.cloudCover,
	cloudLow: WEATHER.cloudLow,
	cloudMid: WEATHER.cloudMid,
	cloudHigh: WEATHER.cloudHigh,
	precipitation: WEATHER.precipitation,
} as const;

const median = (values: number[]) => {
	const sorted = [...values].sort((a, b) => a - b);
	return (sorted[(sorted.length - 1) >> 1]! + sorted[sorted.length >> 1]!) / 2;
};
// Compass directions cannot be averaged as numbers (350° and 10° are neighbours): their arrows are added.
const meanDirection = (degrees: number[]) => {
	const rad = Math.PI / 180;
	const east = degrees.reduce((sum, d) => sum + Math.sin(d * rad), 0);
	const north = degrees.reduce((sum, d) => sum + Math.cos(d * rad), 0);
	return (Math.atan2(east, north) / rad + 360) % 360;
};

// Current conditions from Open-Meteo (free for non-commercial use, no key, CC BY 4.0: needs the
// credit shown on the page). These are the forecast models' figures for now, refreshed every
// 15 minutes.
export async function fetchSeaConditions(at: { latitude: number; longitude: number }): Promise<SeaConditions> {
	const place = `latitude=${at.latitude.toFixed(3)}&longitude=${at.longitude.toFixed(3)}&timezone=GMT`;
	type Current = { current: Record<string, number | null> & { time: string }; hourly?: Record<string, (number | null)[]> };
	// The next three hours as well as now, for the figures that say where the weather is heading.
	const ahead = "&forecast_hours=4&hourly=";
	// And the wind for a day ahead, for the hour this time tomorrow.
	const dayAhead = "&forecast_hours=25&hourly=";
	const forecast = (variables: object, model?: string) =>
		$fetch<Current>(`https://api.open-meteo.com/v1/forecast?${place}&current=${Object.values(variables).join(",")}${model ? `&models=${model}` : ""}`);
	const [marine, weather, ...models] = await Promise.all([
		$fetch<Current>(`https://marine-api.open-meteo.com/v1/marine?${place}&current=${Object.values(MARINE).join(",")}${ahead}wave_height`),
		$fetch<Current>(`https://api.open-meteo.com/v1/forecast?${place}&current=${Object.values(WEATHER).join(",")}${dayAhead}wind_speed_10m,wind_direction_10m,pressure_msl`),
		// A model that cannot be reached is left out of the blend.
		...WEATHER_MODELS.map((model) => forecast(BLENDED, model).catch(() => undefined)),
	]);
	// A model that has no figure for something sends null; it is read as 0.
	const read = <Names extends Record<string, string>>(names: Names, from: Current) =>
		Object.fromEntries(Object.entries(names).map(([key, name]) => [key, from.current[name] ?? 0])) as Record<keyof Names, number>;
	// Change over the next three hours; 0 if the model did not send them.
	const trend = (from: Current, name: string) => {
		const hours = from.hourly?.[name] ?? [];
		return hours[0] != null && hours[3] != null ? hours[3] - hours[0] : 0;
	};
	// The figure for this hour tomorrow, or failing that today's.
	const tomorrow = (name: string, today: number) => weather.hourly?.[name]?.[24] ?? today;
	const conditions: SeaConditions = {
		observedAt: weather.current.time,
		...read(MARINE, marine),
		...read(WEATHER, weather),
		windTrend: trend(weather, "wind_speed_10m"),
		waveTrend: trend(marine, "wave_height"),
		pressureTrend: trend(weather, "pressure_msl"),
		tomorrowWindSpeed: 0,
		tomorrowWindDirection: 0,
		doubt: {},
	};
	conditions.tomorrowWindSpeed = tomorrow("wind_speed_10m", conditions.windSpeed);
	conditions.tomorrowWindDirection = tomorrow("wind_direction_10m", conditions.windDirection);
	for (const [key, name] of Object.entries(BLENDED) as [keyof typeof BLENDED, string][]) {
		const answers = models.map((model) => model?.current[name]).filter((answer) => answer != null);
		if (answers.length < 2) continue;
		conditions[key] = key === "windDirection" ? meanDirection(answers) : median(answers);
		conditions.doubt[key] = [Math.min(...answers), Math.max(...answers)];
	}
	return conditions;
}

// What the sea and sky are usually like where the boat is: a guess to draw from for the moment
// before the real figures arrive, so that the picture can open at once and move over to them
// instead of starting from nothing. Rough figures by latitude: the westerlies and long
// south-westerly swell of the seas north of Aotearoa, the steady trade winds of the tropics
// (south-easterly south of the equator, north-easterly north of it), the light airs of the
// doldrums between.
export function typicalConditions(boat: { latitude: number }): SeaConditions {
	const south = boat.latitude < 0;
	const belt = Math.abs(boat.latitude) < 5 ? "doldrums" : Math.abs(boat.latitude) < 26 ? "trades" : "westerlies";
	const wind = belt === "westerlies" ? { speed: 22, from: 260 } : belt === "trades" ? { speed: 24, from: south ? 120 : 60 } : { speed: 9, from: 90 };
	const warmth = 27.5 - 0.42 * Math.max(0, Math.abs(boat.latitude) - 8);
	return {
		observedAt: "",
		waveHeight: belt === "doldrums" ? 1.4 : 2.1,
		waveDirection: belt === "westerlies" ? 225 : wind.from,
		wavePeriod: 10,
		swellHeight: belt === "westerlies" ? 1.7 : 1.2,
		swellDirection: south ? 215 : 330,
		swellPeriod: 12,
		secondSwellHeight: 0.6,
		secondSwellDirection: south ? 270 : 60,
		secondSwellPeriod: 7,
		windWaveHeight: belt === "doldrums" ? 0.2 : belt === "trades" ? 1.3 : 0.8,
		windWaveDirection: wind.from,
		windWavePeriod: belt === "doldrums" ? 2 : 5,
		currentSpeed: 0.5,
		currentDirection: 270,
		tide: 0,
		seaTemperature: warmth + 0.5,
		windSpeed: wind.speed,
		windGusts: wind.speed * 1.4,
		windDirection: wind.from,
		cloudCover: 55,
		cloudLow: 30,
		cloudMid: 20,
		cloudHigh: 30,
		precipitation: 0,
		visibility: 25_000,
		weatherCode: 2,
		cape: 0,
		pressure: 1015,
		airTemperature: warmth,
		humidity: 80,
		tomorrowWindSpeed: wind.speed,
		tomorrowWindDirection: wind.from,
		windTrend: 0,
		waveTrend: 0,
		pressureTrend: 0,
		doubt: {},
	};
}

// One set of conditions moved part of the way (0..1) towards another: every figure in step,
// and the compass directions the short way round. For bringing the picture over smoothly from
// what it was drawn from to what it should now be drawn from.
export function towardsConditions(from: SeaConditions, to: SeaConditions, share: number): SeaConditions {
	const moved = { ...to } as Record<string, unknown>;
	for (const [key, target] of Object.entries(to)) {
		const start = (from as unknown as Record<string, unknown>)[key];
		if (typeof target !== "number" || typeof start !== "number") continue;
		// The weather code is a label, not a quantity: it changes over at the half-way point.
		if (key === "weatherCode") moved[key] = share < 0.5 ? start : target;
		else if (key.endsWith("Direction")) moved[key] = (start + ((((target - start) % 360) + 540) % 360 - 180) * share + 360) % 360;
		else moved[key] = start + (target - start) * share;
	}
	return moved as unknown as SeaConditions;
}

// Sea state 0 (calm) .. 1 (storm), from the larger of wave height and wind.
// 6 m seas or a 75 km/h wind count as a full storm.
export function seaState({ waveHeight, windSpeed, windGusts }: SeaConditions) {
	return clamp01(Math.max((waveHeight - 0.3) / 5.7, ((windSpeed + windGusts) / 2 - 5) / 70));
}

// Sky state 0 (clear) .. 1 (storm sky). Low cloud is thick and dark, middle cloud less so, and
// high cloud is a thin veil the sun shines through, so a sky full of it is still a bright one.
// Full low cloud alone stops short of a storm; rain adds the rest.
export function skyState({ cloudLow, cloudMid, cloudHigh, precipitation }: SeaConditions) {
	const open = (1 - cloudLow / 100) * (1 - (0.7 * cloudMid) / 100) * (1 - (0.3 * cloudHigh) / 100);
	return clamp01((1 - open) * 0.8 + Math.min(rainRate(precipitation) / 4, 1) * 0.2);
}

// Rain in mm an hour, from the mm that fell in the last 15 minutes.
const rainRate = (precipitation: number) => precipitation * 4;

// 0..1 how hard it is raining. A drizzle (0.5 mm an hour) is about 0.2, steady rain (4) 0.5,
// a downpour (16 and over) 1.
export function rainAmount({ precipitation }: SeaConditions) {
	return clamp01(Math.sqrt(rainRate(precipitation) / 16));
}

// 0..1 how much the air hides: nothing while one can see 20 km, a thick fog at 500 m.
// Steps of visibility are felt as ratios, so it is measured on a logarithmic scale.
export function mistAmount({ visibility }: SeaConditions) {
	return clamp01(Math.log(20_000 / Math.max(visibility, 1)) / Math.log(40));
}

// 0..1 whether there is thunder about. A thunderstorm in the weather code is certain. Short of
// that, showers falling through air with a great deal of energy to build cloud may carry some.
export function thunderAmount({ weatherCode, cape, precipitation }: SeaConditions) {
	if (weatherCode >= 95) return 1;
	return precipitation > 0 ? 0.6 * clamp01((cape - 800) / 1700) : 0;
}

// 0..1 how far the weather has gone beyond a rough sea into a storm: thunder, gusts from a gale
// (60 km/h) up to hurricane force (120), or a cloudburst.
export function stormFury(conditions: SeaConditions) {
	return clamp01(
		Math.max(
			thunderAmount(conditions),
			(conditions.windGusts - 60) / 60,
			(rainRate(conditions.precipitation) - 8) / 24,
		),
	);
}

// 0..1 how hard the weather is building: the wind rising (15 km/h in three hours counts as
// fully), the sea getting up (0.8 m), or the pressure falling (3 hPa). Steady or easing weather is 0.
export function building({ windTrend, waveTrend, pressureTrend }: SeaConditions) {
	return clamp01(Math.max(windTrend / 15, waveTrend / 0.8, -pressureTrend / 3));
}

// 0..1 how much the sea and wind call for from the channellers, who only ever feed what those
// are already trying to do. Weather that is building asks for a great deal. Weather that is
// steady or easing asks for little, however rough it is: a rough sea needs some tending, no more.
export function calling(conditions: SeaConditions) {
	return clamp01(0.85 * building(conditions) + 0.3 * seaState(conditions));
}

// How fast, in km/h, the sea and the wind would carry the boat towards Hawai'i if it were left
// to them: the part of the surface current that runs along the boat's bearing, and the part of
// the wind that blows along it, of which a small boat takes about three parts in a hundred.
// Negative when they are setting it back.
export function carried({ currentSpeed, currentDirection, windSpeed, windDirection }: SeaConditions, bearing: number) {
	const along = (towards: number) => Math.cos((towards - bearing) * RADIANS);
	return currentSpeed * along(currentDirection) + 0.03 * windSpeed * along(windDirection + 180);
}

// 0..1 how much the boat has to be held back. The voyage is a pilgrimage and is to take until
// 1 July 2027 (the owner's): when the sea and wind would carry the boat faster than its pace
// the channellers slow it, working with the current, more the faster it would go. Fully when
// it would go at three times the pace.
export function holdingBack(conditions: SeaConditions, bearing: number) {
	return clamp01((carried(conditions, bearing) - PACE) / (2 * PACE));
}

const COMPASS = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
// -1..1 the heat between sea and air. Above 0 the sea is warmer than the air (fully at 3 °C):
// the air is heated from below and rises in thermals. Below 0 the air is the warmer: it is
// cooled from below and lies still, in layers.
export function thermal({ seaTemperature, airTemperature }: SeaConditions) {
	return Math.min(1, Math.max(-1, (seaTemperature - airTemperature) / 3));
}

// Where the strongest channellers put their strength, 0..1: 0 is all of it ahead, into the
// weaving towards Hawai'i (where, if the weather calls for enough, they link); 1 is all of it
// below, into the deep weaving round the boat that slows it. It is decided by which the sea is
// asking for more: how hard the boat has to be held back, against how much the weather ahead
// calls for. With nothing to hold back it is 0, whatever the weather.
export function strengthBelow(conditions: SeaConditions, bearing: number) {
	const hold = holdingBack(conditions, bearing);
	if (hold <= 0.02) return 0;
	return clamp01(hold / (hold + calling(conditions) + 0.05));
}

// 0..1 whether it is a night for scouting: quiet enough that the work on the sea does not need
// everyone. Fully in light airs (under 12 km/h), not at all in a fresh breeze (22 and over).
export function quietEnoughToScout({ windSpeed }: SeaConditions) {
	return clamp01((22 - windSpeed) / 10);
}

// 0..1 how stormy it is, for the channellers: a real storm by the weather (thunder, gale gusts,
// a cloudburst), or simply a very heavy sea. In a storm they link and work on the waves.
export function stormy(conditions: SeaConditions) {
	return clamp01(Math.max(stormFury(conditions), (seaState(conditions) - 0.55) / 0.3));
}

// 0..1 how far something out of the ordinary is happening, in the air and in the water. The
// strongest channeller looks into it first (the owner's): see `tendOccurrence` in channellers.ts.
// The owner had every benchmark first tried brought down by 40% (`EASILY`), so that less counts:
//   air     the wind rising or dropping fast (9 km/h in three hours counts as fully), the
//           pressure moving fast either way (1.8 hPa), gusts far above the steady wind, thunder,
//           or tomorrow's wind coming from quite another quarter than today's
//   water   the sea getting up or going down fast (0.48 m in three hours), or a surface current
//           running hard (1.8 km/h and more)
const EASILY = 0.6;
export function unusual(conditions: SeaConditions) {
	const { windTrend, waveTrend, pressureTrend, windSpeed, windGusts, windDirection, tomorrowWindSpeed, tomorrowWindDirection, currentSpeed } = conditions;
	const turn = Math.abs(((tomorrowWindDirection - windDirection + 540) % 360) - 180);
	const backing = Math.max(windSpeed, tomorrowWindSpeed) > 12 * EASILY ? (turn - 60 * EASILY) / (80 * EASILY) : 0;
	return {
		air: clamp01(
			Math.max(
				Math.abs(windTrend) / (15 * EASILY),
				Math.abs(pressureTrend) / (3 * EASILY),
				(windGusts - 1.6 * windSpeed - 6 * EASILY) / (20 * EASILY),
				thunderAmount(conditions),
				backing,
			),
		),
		water: clamp01(Math.max(Math.abs(waveTrend) / (0.8 * EASILY), (currentSpeed - 1.5 * EASILY) / (1.5 * EASILY))),
	};
}

// A compass direction in degrees as a word.
export const compassPoint = (degrees: number) => COMPASS[Math.round((((degrees % 360) + 360) % 360) / 45) % 8]!;
