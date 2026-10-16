// The pages are kept at Vercel's edge for ten minutes, as long as the conditions in them are
// (see api/conditions.get.ts), instead of being made afresh for every visitor. A page older
// than that is still sent at once while a fresh one is made behind it. Each address is kept
// apart, ?type= and the rest included, so every view of a page is kept as itself. Browsers
// themselves keep nothing, and ask the edge again each time.
export default defineNitroPlugin((nitroApp) => {
	nitroApp.hooks.hook("render:response", (response, { event }) => {
		if (response.statusCode && response.statusCode !== 200) return;
		// Someone previewing unpublished writing from Prismic sees it fresh, and it is kept from others.
		if (getCookie(event, "io.prismic.preview")) {
			response.headers = { ...response.headers, "cache-control": "private, no-store" };
			return;
		}
		response.headers = { ...response.headers, "cache-control": "public, max-age=0, s-maxage=600, stale-while-revalidate=600" };
	});
});
