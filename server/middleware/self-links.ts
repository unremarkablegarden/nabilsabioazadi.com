// A link to the site written elsewhere without its https:// is read as a page of the site, so
// that someone following it (and Google) asks for /http://www.nabilsabioazadi.com/ or
// /www.nabilsabioazadi.com/about. Vercel folds the double slash first, to /http:/www…. Each of
// these is sent on, permanently, to the page it meant, the home page when it meant no other.
export default defineEventHandler((event) => {
	const meant = event.path.match(/^\/(?:https?:\/+)?(?:www\.)?nabilsabioazadi\.com(\/.*)?$/i);
	if (meant) return sendRedirect(event, meant[1] || "/", 301);
	if (/^\/https?:\//i.test(event.path)) return sendRedirect(event, "/", 301);
});
