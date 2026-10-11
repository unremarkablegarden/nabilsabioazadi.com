// The ocean is the sea off Te Rerenga Wairua (Cape Reinga), seen looking towards Hawai'i,
// at the local time and in the conditions there right now.

export const CAPE_REINGA = { latitude: -34.43, longitude: 172.68 };
// Compass bearing of the great-circle route from Cape Reinga to Honolulu.
export const BEARING_TO_HAWAII = 31;

const TIME_ZONE = "Pacific/Auckland";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const timeParts = new Intl.DateTimeFormat("en-GB", {
	timeZone: TIME_ZONE,
	hour: "2-digit",
	minute: "2-digit",
	hourCycle: "h23",
});

// Time of day in Aotearoa in hours (0..24).
export function aotearoaHour(date = new Date()) {
	const parts = timeParts.formatToParts(date);
	const part = (type: string) => Number(parts.find((p) => p.type === type)!.value);
	return part("hour") + part("minute") / 60;
}

// The moment today, in Aotearoa, when the clock there shows the given hour.
export function dateAtAotearoaHour(hour: number, now = new Date()) {
	return new Date(now.getTime() + (hour - aotearoaHour(now)) * 3_600_000);
}

// Sun elevation and compass azimuth in degrees at Cape Reinga.
// Low-precision formulas from the Astronomical Almanac, good to a fraction of a degree.
export function sunPosition(date: Date) {
	const rad = Math.PI / 180;
	const days = date.getTime() / 86_400_000 - 10957.5;
	const anomaly = (357.529 + 0.98560028 * days) * rad;
	const longitude = (280.459 + 0.98564736 * days + 1.915 * Math.sin(anomaly) + 0.02 * Math.sin(2 * anomaly)) * rad;
	const tilt = (23.439 - 0.00000036 * days) * rad;
	const rightAscension = Math.atan2(Math.cos(tilt) * Math.sin(longitude), Math.cos(longitude));
	const declination = Math.asin(Math.sin(tilt) * Math.sin(longitude));
	const siderealTime = (18.697374558 + 24.06570982441908 * days) * 15 * rad;
	const hourAngle = siderealTime + CAPE_REINGA.longitude * rad - rightAscension;
	const latitude = CAPE_REINGA.latitude * rad;
	const elevation = Math.asin(
		Math.sin(latitude) * Math.sin(declination) + Math.cos(latitude) * Math.cos(declination) * Math.cos(hourAngle),
	);
	const azimuth = Math.atan2(
		-Math.sin(hourAngle),
		Math.tan(declination) * Math.cos(latitude) - Math.sin(latitude) * Math.cos(hourAngle),
	);
	return { elevation: elevation / rad, azimuth: (azimuth / rad + 360) % 360 };
}

export interface SeaConditions {
	// Significant wave height in metres.
	waveHeight: number;
	// Wind speed and gusts in km/h.
	windSpeed: number;
	windGusts: number;
	// Cloud cover in percent.
	cloudCover: number;
	// Rain in mm over the last 15 minutes.
	precipitation: number;
	// Air and sea surface temperature in °C, and relative humidity in percent.
	airTemperature: number;
	seaTemperature: number;
	humidity: number;
}

// The state of the air as the storm's physics uses it. With no live conditions it is a mild,
// humid day at the Cape: air at 14 °C over a sea at 16 °C, 85% humidity.
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

// Current conditions from Open-Meteo (free, no key, CC BY 4.0: needs the credit shown on the page).
export async function fetchSeaConditions(): Promise<SeaConditions> {
	const place = `latitude=${CAPE_REINGA.latitude}&longitude=${CAPE_REINGA.longitude}`;
	const [marine, weather] = await Promise.all([
		$fetch<{ current: { wave_height: number; sea_surface_temperature: number } }>(
			`https://marine-api.open-meteo.com/v1/marine?${place}&current=wave_height,sea_surface_temperature`,
		),
		$fetch<{
			current: {
				wind_speed_10m: number;
				wind_gusts_10m: number;
				cloud_cover: number;
				precipitation: number;
				temperature_2m: number;
				relative_humidity_2m: number;
			};
		}>(
			`https://api.open-meteo.com/v1/forecast?${place}&current=wind_speed_10m,wind_gusts_10m,cloud_cover,precipitation,temperature_2m,relative_humidity_2m`,
		),
	]);
	return {
		waveHeight: marine.current.wave_height,
		windSpeed: weather.current.wind_speed_10m,
		windGusts: weather.current.wind_gusts_10m,
		cloudCover: weather.current.cloud_cover,
		precipitation: weather.current.precipitation,
		airTemperature: weather.current.temperature_2m,
		seaTemperature: marine.current.sea_surface_temperature,
		humidity: weather.current.relative_humidity_2m,
	};
}


// Sea state 0 (calm) .. 1 (storm), from the larger of wave height and wind.
// 6 m seas or a 75 km/h wind count as a full storm.
export function seaState({ waveHeight, windSpeed, windGusts }: SeaConditions) {
	return clamp01(Math.max((waveHeight - 0.3) / 5.7, ((windSpeed + windGusts) / 2 - 5) / 70));
}

// Sky state 0 (clear) .. 1 (storm sky). Full cloud alone stops short of a storm; rain adds the rest.
export function skyState({ cloudCover, precipitation }: SeaConditions) {
	return clamp01((cloudCover / 100) * 0.8 + Math.min(precipitation, 1) * 0.2);
}
