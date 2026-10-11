// The live conditions where the boat is now, fetched by the server and kept for ten minutes.
// The page is sent out with these figures already in it, so the sea a visitor first sees is the
// real one, with no wait; and all visitors share one set of requests to Open-Meteo instead of
// each making their own. (On a host with no server this does not exist, and the page asks
// Open-Meteo itself: see OceanBackground.)
import { boatAt, fetchSeaConditions } from "~~/app/utils/manawatawhi";

export default defineCachedEventHandler(() => fetchSeaConditions(boatAt(new Date())), {
	name: "sea-conditions",
	maxAge: 600,
	// An answer a little out of date is sent at once while a fresh one is fetched behind it.
	swr: true,
});
