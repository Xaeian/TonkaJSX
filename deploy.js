// deploy.js
//
// A built page onto a Cloudflare Worker, as static assets.
// `build` made `index.html`; this takes it and what it reaches for, stages them in a temp
// folder beside the config wrangler needs, and runs `wrangler deploy`.
// It never builds and never touches git.
//
// `app.ini` names the Workers a project may go to, one per key, `main` being the default:
//   [deploy]
//   main = noti
//   alfa = alfa-noti
//   include = images   ; folders the page reaches for at runtime, with no path in the HTML
// The account and the token come from the environment, `CLOUDFLARE_ACCOUNT`
// and `CLOUDFLARE_TOKEN`, or from a `.env` beside this file, `NAME=value` per line.
//
//   node deploy.js <project> [-w <key>] [--dry] [-r]

import fs from "fs";
import os from "os";
import path from "path";
import url from "url";
import { spawnSync } from "child_process";
import { PATH, Log, loadSection, fileList, hasFlag, getFlagValues, COLOR as c }
  from "./utils.js";

const ROOT = path.dirname(url.fileURLToPath(import.meta.url));
const WRANGLER = path.join(ROOT, "node_modules", "wrangler", "bin", "wrangler.js");

// keys of `[deploy]` that name no Worker
const RESERVED = ["include"];
// what `build` reads; an `index.html` older than any of it is not the page on disk
const SOURCES = ["app.html", "app.jsx", "app.ini", "scripts", "styles"];
// our name -> the one wrangler reads
const ENV = {
  CLOUDFLARE_ACCOUNT: "CLOUDFLARE_ACCOUNT_ID",
  CLOUDFLARE_TOKEN: "CLOUDFLARE_API_TOKEN",
};

// A path the page reaches for: quoted or in `url()`, with an extension, the query and
// the hash left off. What it matches is a candidate; being a file in the project decides.
const PATH_RE = /["'(]([^"'()<>\s]+\.[a-z0-9]{1,5})(?:[?#][^"'()<>\s]*)?["')]/gi;

const kb = (n) => `${(n / 1024).toFixed(1)}kB`;

//------------------------------------------------------------------------------------------ Choice

/**
 * The target to go to: the key `-w` names, else `main`, else the one key there is.
 * @param {Record<string, string>} deploy the `[deploy]` section
 * @returns {{ key: string, name: string }}
 */
function pickWorker(deploy) {
  const keys = Object.keys(deploy).filter(k => !RESERVED.includes(k));
  if(!keys.length) throw new Error("app.ini has no [deploy] section naming a Worker");
  // `-w` names it; otherwise `main`, or the one key there is
  const key = getFlagValues("--worker", "-w")[0] || (keys.length === 1 ? keys[0] : "main");
  if(!deploy[key] || RESERVED.includes(key)) {
    throw new Error(`[deploy] has no "${key}", it has: ${keys.join(", ")}`);
  }
  return { key, name: deploy[key] };
}

// a target with a path separator is a folder on this machine, filled instead of a Worker
const isFolder = (target) => /[\\/]/.test(target);

/**
 * The environment wrangler needs, `.env` read first, what is still missing named.
 * Wrangler is a child of this process, so it reads what is set here.
 */
function checkEnv() {
  const env = path.join(ROOT, ".env");
  if(fs.existsSync(env)) process.loadEnvFile(env);
  const missing = Object.keys(ENV).filter(name => !process.env[name]);
  if(missing.length) throw new Error(`Not set in the environment: ${missing.join(", ")}`);
  for(const [ours, theirs] of Object.entries(ENV)) process.env[theirs] = process.env[ours];
}

//------------------------------------------------------------------------------------------- Files

// the newest moment among the files under `rel`, 0 when there are none
function newest(rel) {
  const at = path.join(PATH, rel);
  if(!fs.existsSync(at)) return 0;
  if(fs.statSync(at).isFile()) return fs.statSync(at).mtimeMs;
  return Math.max(0, ...fileList(at).map(f => fs.statSync(path.join(at, f)).mtimeMs));
}

/** Says so when a source moved after the page was built. */
function checkFresh() {
  const built = newest("index.html");
  const stale = SOURCES.filter(rel => newest(rel) > built);
  if(stale.length) Log.warn(`index.html is older than ${stale.join(", ")}: build again?`);
}

// `true` for a project file the page may reach for: inside the project, and a file
function isProjectFile(rel) {
  const full = path.resolve(PATH, rel);
  if(!full.startsWith(PATH + path.sep)) return false;
  return fs.existsSync(full) && fs.statSync(full).isFile();
}

/**
 * Every file the page reaches for, by the addresses in it. Local ones only: a remote
 * address names no file here, and a data URL none at all.
 * @param {string} html
 * @returns {string[]} relative paths, each once, in the order found
 */
function referenced(html) {
  const found = new Set();
  for(const [, hit] of html.matchAll(PATH_RE)) {
    const rel = hit.replace(/^\.?\//, "");
    if(rel !== "index.html" && isProjectFile(rel)) found.add(rel);
  }
  return [...found];
}

/** Every file under the folders `include` names. */
function included(include) {
  const folders = String(include || "").split(",").map(s => s.trim()).filter(Boolean);
  return folders.flatMap(dir => fileList(path.join(PATH, dir)).map(f => `${dir}/${f}`));
}

//------------------------------------------------------------------------------------------- Stage

/** The files as they lie in the project, over whatever `dir` holds under the same names. */
function copy(dir, files) {
  for(const rel of files) {
    const to = path.join(dir, rel);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(path.join(PATH, rel), to);
  }
}

/**
 * A temp folder holding the config wrangler reads and, under `site/`, the files as they
 * lie in the project. The config sits beside the site, not in it, so it is never served.
 * @param {string} name the Worker
 * @param {string[]} files relative paths
 * @returns {string} the folder
 */
function stage(name, files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tonka-deploy-"));
  copy(path.join(dir, "site"), files);
  const config = {
    name,
    compatibility_date: new Date().toISOString().slice(0, 10),
    // one page answers every path, the way it does when served
    assets: { directory: "./site", not_found_handling: "single-page-application" },
  };
  fs.writeFileSync(path.join(dir, "wrangler.json"), JSON.stringify(config, null, 2));
  return dir;
}

//------------------------------------------------------------------------------------------ Deploy

async function deploy() {
  Log.head(`Deploy ${c.grey}${PATH}${c.reset}`);
  const settings = loadSection("deploy");
  const { key, name } = pickWorker(settings);
  const folder = isFolder(name) ? path.resolve(PATH, name) : null;
  const dry = hasFlag("--dry");
  if(!dry && !folder) checkEnv();
  if(!folder && !fs.existsSync(WRANGLER)) {
    Log.err("wrangler missing in node_modules.");
    Log.run("npm i -D wrangler");
    process.exit(1);
  }

  const html = fs.existsSync(path.join(PATH, "index.html"))
    ? fs.readFileSync(path.join(PATH, "index.html"), "utf8")
    : null;
  if(html === null) throw new Error("index.html not found: run tonka build first");
  checkFresh();

  const files = [...new Set(["index.html", ...referenced(html), ...included(settings.include)])];
  // a folder is opened by people too, so the readme goes along
  if(folder && fs.existsSync(path.join(PATH, "readme.md"))) files.push("readme.md");
  let total = 0;
  for(const rel of files) {
    const size = fs.statSync(path.join(PATH, rel)).size;
    total += size;
    Log.info(`+ ${rel} ${kb(size)}`);
  }
  const where = folder
    ? `folder ${c.green}${folder}${c.reset}`
    : `Worker ${c.green}${name}${c.reset}`;
  Log.ok(`${files.length} files, ${kb(total)} → ${where} (${key})`);

  if(folder) {
    if(dry) { Log.warn("Dry run, nothing copied."); return; }
    copy(folder, files);
    Log.ok(`Copied to ${folder}`);
  }
  else {
    const dir = stage(name, files);
    const args = [WRANGLER, "deploy", "--config", path.join(dir, "wrangler.json")];
    try {
      if(dry) {
        Log.warn("Dry run, nothing sent. The command would be:");
        Log.run(`node ${args.map(a => a.includes(" ") ? `"${a}"` : a).join(" ")}`);
        return;
      }
      Log.run("wrangler deploy");
      const run = spawnSync(process.execPath, args, { stdio: "inherit" });
      if(run.status !== 0) throw new Error(`wrangler exited with ${run.status}`);
      Log.ok(`Deployed ${name}`);
    }
    finally { fs.rmSync(dir, { recursive: true, force: true }); }
  }
  // the page is out, so the folder goes back to the app being edited, as `serve -r` does
  if(hasFlag("-r", "--remove")) {
    fs.unlinkSync(path.join(PATH, "index.html"));
    Log.ok(`Deleted ${c.orange}index.html${c.reset}`);
  }
}

try { await deploy(); }
catch(e) {
  Log.err(e.message);
  process.exit(1);
}
