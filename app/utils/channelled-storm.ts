// A channelled storm (the owner's, 15 October): weather the channellers call up, at the owner's
// will, for every visitor. While it lasts the sea and sky are those of the storm below in place
// of the measured ones, the twelve on the boat are versions of three Aes Sedai, the weaves'
// colours are graded, and the menu says the weather is channelled.
//
// It is turned on in storm.json at the root of the site, by an end time and, if wanted, a start
// (ISO times with their offset, e.g. "2026-10-15T22:00:00+13:00"; null for none), and goes live
// with the next push. It ends by itself at "until". To look at it without turning it on for
// everyone: /?storm. To look at the site without it while it is on: /?storm=off.
import stormSwitch from "~~/storm.json";
import type { SeaConditions } from "./manawatawhi";

// Beyond hurricane force: gusts of 300 km/h, an 18 m sea, thunder, and the pressure falling 20 hPa
// in three hours, so that it reads as building and the channellers answer it in full.
export const CHANNELLED_STORM: Partial<SeaConditions> = {
	windSpeed: 220,
	windGusts: 300,
	windTrend: 60,
	pressure: 915,
	pressureTrend: -20,
	waveHeight: 18,
	swellHeight: 16,
	swellPeriod: 18,
	secondSwellHeight: 8,
	secondSwellPeriod: 14,
	windWaveHeight: 11,
	windWavePeriod: 13,
	waveTrend: 5,
	weatherCode: 99,
	cape: 3500,
	precipitation: 14,
	cloudLow: 100,
	cloudMid: 100,
	cloudHigh: 100,
	visibility: 900,
};

// What the menu says while it lasts (the owner's words).
export const CHANNELLED_WORDS = "Channelled, honouring spirits met across Te Moana-nui-a-Kiwa";

// Whether the storm is on at this moment, by storm.json.
export function channelledStormOn(now: Date) {
	const { from, until } = stormSwitch as { from: string | null; until: string | null };
	if (!until) return false;
	return (!from || now >= new Date(from)) && now < new Date(until);
}
