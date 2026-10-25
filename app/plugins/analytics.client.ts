// Google Analytics (GA4), at the owner's request. The owner gave the property's number
// (365685777); the Measurement ID below is the one the owner's earlier site already carried.
// It is public: every page that uses it shows it.
const MEASUREMENT_ID = "G-20Q8W806FV";
// Every visitor is counted with cookies, at the owner's word (25 October 2026), as on the owner's
// studio site: no consent banner. Google's advertising uses stay off.

export default defineNuxtPlugin(() => {
	// Not while developing, so that the owner's own work is not counted as visits.
	if (["localhost", "127.0.0.1"].includes(window.location.hostname)) return;
	const w = window as unknown as { dataLayer: unknown[] };
	w.dataLayer = w.dataLayer || [];
	// Google's own snippet: it must push the arguments object itself, not an array.
	function gtag(..._args: unknown[]) {
		// eslint-disable-next-line prefer-rest-params
		w.dataLayer.push(arguments);
	}
	gtag("consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
	gtag("js", new Date());
	// Google's own page view is turned off: the router below counts every page, the first among
	// them, and with both each visit was counted twice.
	gtag("config", MEASUREMENT_ID, { send_page_view: false });
	// Google's script is fetched and run only once the sea is up (or after ten seconds, for a
	// browser that cannot draw it): run while the picture was being set up, it took the same
	// seconds from a slow machine. Nothing is lost: what is counted before it arrives waits in
	// dataLayer and is sent when it does.
	let loaded = false;
	const load = () => {
		if (loaded) return;
		loaded = true;
		const script = document.createElement("script");
		script.async = true;
		script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
		document.head.appendChild(script);
	};
	const seaShown = useState("sea-shown", () => false);
	const whenIdle = (then: () => void) => ("requestIdleCallback" in window ? requestIdleCallback(then, { timeout: 3000 }) : setTimeout(then, 500));
	watch(seaShown, (shown) => shown && whenIdle(load), { immediate: true });
	setTimeout(load, 10_000);
	// The site changes page without reloading; each change is counted as a page seen.
	useRouter().afterEach((to) => gtag("event", "page_view", { page_path: to.fullPath, page_location: window.location.origin + to.fullPath }));
});
