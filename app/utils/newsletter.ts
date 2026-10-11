// The newsletter is a form on Kit (kit.com), the owner's mailing service. These are that form's
// public details, taken from the embed code Kit gives for it: nothing here is secret.
const KIT_FORM = "https://app.kit.com/forms/10029826/subscriptions";
// The owner's own words for a successful sign-up, as set on the form in Kit.
export const NEWSLETTER_WELCOME = "Churr! Lessgo! We'll stay in touch.";

// Whether the form on Kit has its "invisible captcha" switched on. The owner would sooner not
// bring Google's script to the site (it is also blocked by some visitors' browsers, who then
// cannot sign up), so it is off here AND MUST BE OFF ON THE FORM IN KIT, or Kit will refuse every
// address. Bots are kept out without it by the trap and the wait in the menu's form, and by
// Kit's confirmation email. Set this to true only if the captcha is switched back on in Kit.
export const NEWSLETTER_CAPTCHA = false;

// Kit's invisible captcha is Google's reCAPTCHA (version 3):
// the visitor's browser asks Google for a token, with no puzzle shown, and Kit checks the token
// before it accepts the address. This is Kit's own public key for it, as in Kit's form script
// (f.kit.com/ckjs/ck.5.js). If sign-ups ever start failing for everyone, look there first: Kit
// may have changed it.
const CAPTCHA_KEY = "6LdkIV0UAAAAABtNVAAP99TC6f_18LiETnPK6ziX";
const CAPTCHA_SCRIPT = `https://www.google.com/recaptcha/api.js?render=${CAPTCHA_KEY}`;

interface Captcha {
	ready(done: () => void): void;
	execute(key: string, options: { action: string }): Promise<string>;
}

// Google's script is fetched only when someone actually goes to sign up, not on every visit.
let loading: Promise<Captcha | undefined> | undefined;
export function prepareNewsletter() {
	if (!NEWSLETTER_CAPTCHA) return Promise.resolve(undefined);
	loading ??= new Promise<Captcha>((resolve, reject) => {
		const script = document.createElement("script");
		script.src = CAPTCHA_SCRIPT;
		script.async = true;
		script.onload = () => {
			const captcha = (window as unknown as { grecaptcha: Captcha }).grecaptcha;
			captcha.ready(() => resolve(captcha));
		};
		script.onerror = () => {
			loading = undefined;
			reject(new Error("reCAPTCHA could not be loaded"));
		};
		document.head.appendChild(script);
	});
	return loading;
}

// Sends an address to the form, as Kit's own embed does. Resolves to true if Kit took it.
export async function joinNewsletter(email: string) {
	const captcha = await prepareNewsletter();
	const fields = new FormData();
	fields.set("email_address", email);
	if (captcha) fields.set("token", await captcha.execute(CAPTCHA_KEY, { action: "formsubmit" }));
	fields.set("host", window.location.origin + window.location.pathname);
	fields.set("referrer", "");
	const response = await fetch(KIT_FORM, { method: "POST", body: fields, headers: { Accept: "application/json" } });
	if (!response.ok) return false;
	// Kit answers 200 even when it refuses an address; its reply says which.
	const reply = (await response.json().catch(() => ({}))) as { status?: string };
	return reply.status !== "failed";
}
