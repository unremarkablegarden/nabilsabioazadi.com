// The whales who greet the storm for the five (the owner, 19 October: "read live shark and whale
// positions. Have them visible. May they greet our storm out of respect"; five.ts). Only real
// positions, never made up: the satellite tags of the University of Auckland's Tohorā Voyages
// (southern right whales, tagged at the Auckland Islands and off Australia), from the map on their
// site. No tag near the boat is sending today; what is given is where each whale was last heard,
// and when, for those last heard in the Pacific. Fetched by the server (the map's host allows no
// other site to ask) and kept for six hours.
const MAP = "6323957431af5908c7071913";

interface Fix {
	date: number;
	latitude: number;
	longitude: number;
}

export default defineCachedEventHandler(
	async () => {
		try {
			const body = new URLSearchParams({ data: JSON.stringify({ id: MAP }) });
			// (It answers JSON under another type, so it is read as text.)
			const text = await $fetch<string>("https://my.wildlifecomputers.com/data/map/data/", { method: "POST", body, timeout: 20_000, responseType: "text" });
			const map = JSON.parse(text) as { deployments?: { locations?: Fix[] }[] };
			return (map.deployments ?? [])
				.map((deployment) => deployment.locations?.reduce<Fix | undefined>((last, fix) => (!last || fix.date > last.date ? fix : last), undefined))
				.filter((fix): fix is Fix => !!fix && Number.isFinite(fix.latitude) && Number.isFinite(fix.longitude))
				// (The Pacific, by longitude: east of Australia's south coast round to the Americas.)
				.filter((fix) => fix.longitude >= 140 || fix.longitude <= -70)
				.map((fix) => ({ latitude: fix.latitude, longitude: fix.longitude, at: new Date(fix.date * 1000).toISOString() }));
		} catch (error) {
			// (Not kept: the next visitor asks again.)
			throw createError({ statusCode: 502, statusMessage: `Tohorā map not to be had: ${error}` });
		}
	},
	{ name: "tohora-whales-last-heard", maxAge: 6 * 3600, swr: true },
);
