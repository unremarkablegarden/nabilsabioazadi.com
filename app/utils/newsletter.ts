// The newsletter is a form on Kit (kit.com), the owner's mailing service. These are that form's
// public details, taken from the embed code Kit gives for it: nothing here is secret.
// (The owner's second form, made on 11 October 2026 when sign-ups to the first, 10029826, were
// not arriving. Its invisible captcha is off.)
const KIT_FORM = "https://app.kit.com/forms/10030693/subscriptions";
// The owner's own words for a successful sign-up, as set on the form in Kit.
export const NEWSLETTER_WELCOME = "Churr! Lessgo! We’ll stay in touch.";

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

// Sends an address to the form, as Kit's own embed script does: the same fields and the same
// header. Resolves to whether Kit took it and, if it did not, Kit's own words for why.
export async function joinNewsletter(email: string): Promise<{ joined: boolean; why?: string }> {
	const captcha = await prepareNewsletter();
	const fields = new FormData();
	fields.set("email_address", email);
	fields.set("token", captcha ? await captcha.execute(CAPTCHA_KEY, { action: "formsubmit" }) : "");
	fields.set("referrer", document.referrer);
	fields.set("host", window.location.href);
	fields.set("search", window.location.search);
	fields.set("user", "");
	fields.set("ckjs_version", "6");
	const response = await fetch(KIT_FORM, { method: "POST", body: fields, headers: { Accept: "application/json", "X-CKJS-Version": "6" } });
	if (!response.ok) return { joined: false, why: `Kit answered ${response.status}` };
	// Kit answers 200 even when it refuses an address; its reply says which, and why.
	const reply = (await response.json().catch(() => ({}))) as { status?: string; errors?: { messages?: string[] } };
	if (reply.status === "failed") return { joined: false, why: reply.errors?.messages?.join(" ") };
	return { joined: true };
}
