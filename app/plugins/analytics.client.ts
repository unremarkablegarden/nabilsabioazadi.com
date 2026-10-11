// Google Analytics (GA4), at the owner's request. The owner gave the property's number
// (365685777); the Measurement ID below is the one the owner's earlier site already carried.
// It is public: every page that uses it shows it.
const MEASUREMENT_ID = "G-20Q8W806FV";
// Whether visitors are counted with cookies. The owner has not yet said how visitors are to be
// asked, and in the EU and the UK they must be asked first, so this is false: visits are sent to
// Google without cookies and without anything that identifies a visitor from one visit to the
// next (Google's "consent mode", storage denied). The reports are thinner for it. Set it to true
// only once there is a consent banner, or the owner decides to do without one.
const WITH_COOKIES = false;

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
	const storage = WITH_COOKIES ? "granted" : "denied";
	gtag("consent", "default", { analytics_storage: storage, ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
	gtag("js", new Date());
	gtag("config", MEASUREMENT_ID);
	const script = document.createElement("script");
	script.async = true;
	script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
	document.head.appendChild(script);
	// The site changes page without reloading; each change is counted as a page seen.
	useRouter().afterEach((to) => gtag("event", "page_view", { page_path: to.fullPath, page_location: window.location.origin + to.fullPath }));
});
