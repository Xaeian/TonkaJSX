// .tests/serve.test.mjs
//
// `tonka serve` on a folder holding both pages: by default the built `index.html`,
// left in place; with `-r` or `--remove` the built page deleted first and `app.html` served.

import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const TONKA = path.join(ROOT, "tonka.js");

let pass = 0, fail = 0;

function ok(name, cond) {
  if(cond) pass++;
  else fail++;
  console.log(`  ${cond ? "ok  " : "FAIL"} ${name}`);
}

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

// a process and every one it started
function stop(child) {
  if(process.platform !== "win32") { child.kill(); return; }
  spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
}

// the page `tonka serve` hands out with `flags`, and whether the built one is still there
async function serveWith(flags) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tonka-serve-"));
  fs.writeFileSync(path.join(dir, "app.html"),
    "<html><head><title>t</title></head><body>DEV</body></html>");
  fs.writeFileSync(path.join(dir, "index.html"), "<html><body>PROD</body></html>");
  const port = await freePort();
  const serve = spawn(process.execPath, [TONKA, "serve", dir, "-p", String(port), ...flags],
    { stdio: "ignore" });
  let page = "";
  for(let i = 0; i < 40 && !page; i++) {
    try { page = await (await fetch(`http://localhost:${port}/`)).text(); }
    catch { await sleep(150); } // not listening yet
  }
  stop(serve);
  const built = fs.existsSync(path.join(dir, "index.html"));
  fs.rmSync(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 });
  return { served: ["PROD", "DEV"].find(mark => page.includes(mark)) ?? "nothing", built };
}

const plain = await serveWith([]);
ok("by default the built page is served and kept", plain.served === "PROD" && plain.built);
const short = await serveWith(["-r"]);
ok("-r deletes the built page and serves app.html", short.served === "DEV" && !short.built);
const long = await serveWith(["--remove"]);
ok("--remove does the same", long.served === "DEV" && !long.built);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
