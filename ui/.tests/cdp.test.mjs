// .tests/cdp.test.mjs
//
// The manual in headless Edge over CDP: `tonka serve` hands out a copy of the sources,
// a scenario runs in the page, and its answer prints with every error the page reported.
// The library comes from `.r2/scripts` in place of lib.tonkajsx.com,
// so what a sync would publish is what runs.
// Ports, profile and copy belong to the run and leave with it.
// The exit code is 1 when a step failed or none passed, when the page reported any error,
// and when the scenario never ended.
//
//   node ui/.tests/cdp.test.mjs                                        the whole scenario
//   node ui/.tests/cdp.test.mjs shot.js --shot --panel=Modals --press=Form
//
// `--shot` saves the page as it shows, `--light` sets the light theme,
// `--width=600` starts narrow, `--ready=<selector>` waits for that instead of `.shell`;
// every `--key=value` also reaches the page as `window.__ARGS.key`.
// A shot lands in `.run/`, named after its panel, its button and the flags that shaped it:
// `shot-Modals-Form-light-w600.png`.
// A scenario resizes the viewport by calling `__viewport(JSON.stringify({ width }))`;
// the driver runs `window.__viewportDone()` once the page has the new size.

import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.dirname(HERE);
const ROOT = path.dirname(APP);
const LIB = path.join(ROOT, ".r2", "scripts"); // what lib.tonkajsx.com serves once synced
const RUN = path.join(HERE, ".run");
const EDGE = [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
].find(file => fs.existsSync(file));
if(!EDGE) throw new Error("cdp: Microsoft Edge not found");
const HEIGHT = 900;
const READY_ms = 30000; // Babel compiles every .jsx of the page before the app mounts
const SCENARIO_ms = 120000;

const flag = (name) => process.argv.find(a => a.startsWith(`--${name}=`))?.split("=")[1];
const has = (name) => process.argv.includes(`--${name}`);
const SCRIPT = process.argv.slice(2).find(a => !a.startsWith("--")) ?? "scenario.js";
const WIDTH = Number(flag("width")) || 1280;
const LIGHT = has("light");

const sleep = (ms) => new Promise(done => setTimeout(done, ms));

// a port nothing listens on, as the system hands one out
function freePort() {
  return new Promise(resolve => {
    const probe = net.createServer().listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

// what an address answers once it is up: its JSON, or `true` for a page
async function waitJson(url, tries = 80) {
  for(let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if(res.ok) return await res.json().catch(() => true);
    }
    catch {} // not listening yet
    await sleep(150);
  }
  throw new Error(`no answer from ${url}`);
}

// a process and every one it started
function stop(child) {
  if(process.platform !== "win32") { child.kill(); return; }
  spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
}

// Edge runs on under another process than the one it was started as,
// so it is asked to close itself before its tree is stopped by force
async function closeBrowser(port) {
  try {
    const { webSocketDebuggerUrl } = await waitJson(`http://localhost:${port}/json/version`, 5);
    const browser = new WebSocket(webSocketDebuggerUrl);
    await new Promise((res, rej) => { browser.onopen = res; browser.onerror = rej; });
    const closed = new Promise(res => { browser.onclose = res; });
    browser.send(JSON.stringify({ id: 1, method: "Browser.close" }));
    await Promise.race([closed, sleep(3000)]);
  }
  catch {} // no browser left to ask
}

// a temp dir of the run, removed once whatever wrote it lets go, `false` when it never does:
// Edge writes its profile for a moment after it closed, and `rmSync` gives up at once on Windows
async function removeDir(dir) {
  for(let i = 0; i < 40; i++) {
    try { fs.rmSync(dir, { recursive: true, force: true }); return true; }
    catch { await sleep(250); } // still held
  }
  return false;
}

// the app's sources without history, tests and a build `tonka build` left, which serve prefers
function copyApp() {
  const copy = fs.mkdtempSync(path.join(os.tmpdir(), "tonka-app-"));
  const skip = [".git", ".tests", "index.html"].map(name => path.join(APP, name));
  fs.cpSync(APP, copy, { recursive: true, filter: src => !skip.includes(src) });
  return copy;
}

// the library as `.r2/scripts` holds it, ahead of what lib.tonkajsx.com serves
function libraryAnswer({ requestId, request }) {
  const local = path.join(LIB, new URL(request.url).pathname.slice(1));
  if(!fs.existsSync(local)) return { method: "Fetch.continueRequest", params: { requestId } };
  return {
    method: "Fetch.fulfillRequest",
    params: {
      requestId,
      responseCode: 200,
      responseHeaders: [{ name: "Content-Type", value: "text/javascript; charset=utf-8" }],
      body: fs.readFileSync(local).toString("base64"),
    },
  };
}

// where a busy page spins: the frames of a pause, innermost first
function trace(frames) {
  return frames.map(f => {
    const file = f.url.split("/").pop();
    return `  at ${f.functionName || "(anon)"} ${file}:${f.location.lineNumber + 1}`;
  }).join("\n");
}

// the page as it shows, into `.run/`, named after the panel, the button and the flags
async function shoot(send) {
  // in the page's own fonts: until the icons' one has come, a glyph shows as its name
  await send("Runtime.evaluate", { expression: "document.fonts.ready", awaitPromise: true });
  const width = flag("width") && `w${flag("width")}`;
  const name = ["shot", flag("panel"), flag("press"), LIGHT && "light", width]
    .filter(Boolean)
    .join("-")
    .replace(/[^\w-]+/g, "_");
  const shot = await send("Page.captureScreenshot", { format: "png" });
  fs.mkdirSync(RUN, { recursive: true });
  fs.writeFileSync(path.join(RUN, `${name}.png`), Buffer.from(shot.result.data, "base64"));
  console.log(`screenshot: .run/${name}.png`);
}

const scenario = fs.readFileSync(path.resolve(HERE, SCRIPT), "utf8");
const PORT = await freePort();
const DEBUG = await freePort();
const copy = copyApp();
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "tonka-edge-"));
const serve = spawn(process.execPath,
  [path.join(ROOT, "tonka.js"), "serve", copy, "-p", String(PORT)], { stdio: "ignore" });
const edge = spawn(EDGE, ["--headless", "--disable-gpu", "--no-first-run",
  `--remote-debugging-port=${DEBUG}`, `--user-data-dir=${profile}`,
  `--window-size=${WIDTH},${HEIGHT}`, "about:blank"], { stdio: "ignore" });

const events = [];
let out = "";
let ws;
try {
  await waitJson(`http://localhost:${PORT}/`);
  const targets = await waitJson(`http://localhost:${DEBUG}/json`);
  ws = new WebSocket(targets.find(t => t.type === "page").webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let seq = 0;
  const waiting = new Map();
  const send = (method, params = {}) => new Promise(resolve => {
    const id = ++seq;
    waiting.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = (expression) => send("Runtime.evaluate",
    { expression, awaitPromise: true, returnByValue: true });
  const viewport = (width) => send("Emulation.setDeviceMetricsOverride",
    { width, height: HEIGHT, deviceScaleFactor: 1, mobile: false });

  let onPause = null; // set while a scenario past its time waits for the debugger to stop it
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if(msg.id && waiting.has(msg.id)) { waiting.get(msg.id)(msg); waiting.delete(msg.id); return; }
    const p = msg.params;
    switch(msg.method) {
      case "Runtime.exceptionThrown": {
        const d = p.exceptionDetails;
        events.push(`EXCEPTION ${d.exception?.description || d.text}`);
        break;
      }
      case "Runtime.consoleAPICalled":
        if(p.type !== "error") break;
        events.push(`CONSOLE ${p.args.map(a => a.value ?? a.description ?? "").join(" ")}`);
        break;
      case "Log.entryAdded":
        if(p.entry.level !== "error" || /favicon/.test(p.entry.url || "")) break;
        events.push(`LOG ${p.entry.text} ${p.entry.url || ""}`);
        break;
      case "Page.javascriptDialogOpening":
        events.push(`DIALOG ${p.type} ${p.message}`);
        break;
      case "Runtime.bindingCalled":
        if(p.name !== "__viewport") break;
        // not awaited: the page waits on `__viewportDone`, not on this handler
        viewport(JSON.parse(p.payload).width).then(() => evaluate("window.__viewportDone?.()"));
        break;
      case "Debugger.paused":
        onPause?.(p.callFrames.slice(0, 12));
        onPause = null;
        break;
      case "Fetch.requestPaused":
        ws.send(JSON.stringify({ id: ++seq, ...libraryAnswer(p) }));
        break;
    }
  };

  await send("Runtime.enable");
  await send("Log.enable");
  await send("Page.enable");
  await send("Runtime.addBinding", { name: "__viewport" });
  await send("Fetch.enable", { patterns: [{ urlPattern: "https://lib.tonkajsx.com/*" }] });
  await viewport(WIDTH);
  await send("Page.bringToFront");
  await send("Emulation.setFocusEmulationEnabled", { enabled: true });
  await send("Page.navigate", { url: `http://localhost:${PORT}/` });
  const ready = flag("ready") || ".shell";
  const until = Date.now() + READY_ms;
  while(Date.now() < until) {
    const r = await evaluate(`!!document.querySelector(${JSON.stringify(ready)})`);
    if(r.result?.result?.value) break;
    await sleep(250);
  }
  await sleep(300); // the first frame after mount: rail state, fonts, tooltips' layout

  // every `--key=value` reaches the scenario as `__ARGS.key`
  const args = Object.fromEntries(process.argv
    .filter(a => /^--\w+=/.test(a))
    .map(a => a.slice(2).split("=")));
  await evaluate(`window.__ARGS = ${JSON.stringify(args)}`);
  if(LIGHT) await evaluate(`Theme.set("light")`);
  const answer = await Promise.race([
    evaluate(scenario),
    sleep(SCENARIO_ms).then(() => ({ result: { result: { value: "SCENARIO TIMEOUT" } } })),
  ]);
  const thrown = answer.result?.exceptionDetails;
  const value = answer.result?.result?.value;
  if(thrown) out = `THROW ${thrown.exception?.description || thrown.text}`;
  else out = typeof value === "string" ? value : JSON.stringify(value, null, 1);
  if(out === "SCENARIO TIMEOUT") {
    // the page is busy: pause the debugger and print where it spins
    const paused = new Promise(resolve => { onPause = resolve; });
    await send("Debugger.enable");
    send("Debugger.pause"); // not awaited: its event is the answer, raced against 5s below
    const frames = await Promise.race([paused, sleep(5000).then(() => null)]);
    out += `\n${frames ? trace(frames) : "  (no pause)"}`;
    await send("Debugger.resume");
  }
  console.log("=== scenario ===");
  console.log(out);
  if(has("shot")) await shoot(send);
}
catch(e) {
  out = `HARNESS FAILED: ${e.message}`;
  console.log(out);
}
finally {
  try { ws?.close(); }
  catch {} // gone with the browser
  await closeBrowser(DEBUG);
  stop(edge);
  stop(serve);
  for(const dir of [profile, copy]) {
    if(!await removeDir(dir)) console.log(`left behind: ${dir}`);
  }
}

console.log("=== page events ===");
for(const e of events) console.log(e.slice(0, 800));
console.log(`(${events.length} events)`);

// a scenario that passed nothing has not passed,
// and any error the page reports fails the manual, not only an uncaught exception
const failed = !/^PASS /m.test(out)
  || /^(FAIL|THROW|HARNESS|SCENARIO)/m.test(out)
  || events.length > 0;
// a socket to a browser just stopped would hold the process until its TCP timeout
process.exit(failed ? 1 : 0);
