// node scripts/shoot.mjs <url> <outPrefix> <seconds...>: loads the page in headless Brave and saves a JPEG at each second given (the picture keeps moving even when the app's browser pane is hidden, which stops a page drawing). EVAL="..." evaluates an expression at the end and prints it.
import { spawn } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const [url, out, ...times] = process.argv.slice(2);
const port = 9333 + Math.floor(Math.random() * 500);
const profile = mkdtempSync(join(tmpdir(), "brave-"));
const browser = spawn("/Applications/Brave Browser.app/Contents/MacOS/Brave Browser", [
	"--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--window-size=1280,860",
	"--no-first-run", "--enable-gpu", "--use-angle=metal", "--ignore-gpu-blocklist", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) { await sleep(200); try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page"); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const waiting = new Map();
const logs = [];
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (waiting.has(d.id)) { waiting.get(d.id)(d.result); waiting.delete(d.id); } if (d.method === "Runtime.consoleAPICalled" && /error|warn/.test(d.params.type)) logs.push(d.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 1500)); if (d.method === "Runtime.exceptionThrown") logs.push("EXC " + JSON.stringify(d.params.exceptionDetails).slice(0, 800)); };
const send = (method, params = {}) => new Promise((r) => { waiting.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
await send("Page.enable");
await send("Runtime.enable");
await send("Page.navigate", { url });
const start = Date.now();
for (const t of times.map(Number)) {
	await sleep(Math.max(0, t * 1000 - (Date.now() - start)));
	const { data } = await send("Page.captureScreenshot", { format: "jpeg", quality: 80 });
	writeFileSync(`${out}-${t}s.jpg`, Buffer.from(data, "base64"));
}
const { result } = await send("Runtime.evaluate", { expression: process.env.EVAL || "JSON.stringify({loop: window.__loop, f: window.__rainFrame && {hold: window.__rainFrame.hold}})", returnByValue: true, awaitPromise: true });
console.log(result.value);
for (const l of logs.filter((l) => !/Hydration|Suspense/.test(l))) console.log("LOG", l);
ws.close(); browser.kill();
