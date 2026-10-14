// deploy.js
//
// A built page onto a Cloudflare Worker, as static assets, or into a folder on this machine.
// `build` made `index.html`; this takes it and what it reaches for.
// For a Worker it stages them in a temp folder beside the config wrangler needs
// and runs `wrangler deploy`, for a folder it copies them.
// It never builds and never touches git.
//
// `app.ini` names the default target in `[deploy]` by its kind, and more Workers in `[worker]`:
//   [deploy]
//   worker = noti # or `folder = C:/www/noti`, never both
//   include = images, logo.svg # what the page reaches for at runtime, no path in the HTML
//   [worker]
//   alfa = noti-alfa # picked with `-w alfa`
// A Worker's account and token come from the environment, `CLOUDFLARE_ACCOUNT`
// and `CLOUDFLARE_TOKEN`, or from a `.env` beside this file, `NAME=value` per line.
//
//   tonka deploy <project> [-w <key>] [--dry] [-r]

import fs from "fs";
import os from "os";
import path from "path";
import url from "url";
import { spawnSync } from "child_process";
import { PATH, Log, loadIni, deployTargets, fileList, hasFlag, getFlagValues, COLOR as c }
  from "./utils.js";

const ROOT = path.dirname(url.fileURLToPath(import.meta.url));
const WRANGLER = path.join(ROOT, "node_modules", "wrangler", "bin", "wrangler.js");

// what `build` reads; an `index.html` older than any of it is not the page on disk
const SOURCES = ["app.html", "app.jsx", "app.ini", "scripts", "styles"];
// a Worker name as Cloudflare takes it
const WORKER_NAME = /^[a-z0-9-]+$/;
// our name -> the one wrangler reads
const ENV = {
  CLOUDFLARE_ACCOUNT: "CLOUDFLARE_ACCOUNT_ID",
  CLOUDFLARE_TOKEN: "CLOUDFLARE_API_TOKEN",
};

// A path where the page resolves one: an attribute (`src="…"`, `href="…"`), the same as
// a prop in compiled JSX (`src:"…"`), or CSS `url(…)`. A path anywhere else is words:
// a page that talks about `app.ini` does not reach for it. Being a file here decides the rest.
const REF_RE = new RegExp([
  String.raw`\b(?:src|href|poster)\s*[=:]\s*["']([^"'\s<>]+)["']`,
  String.raw`url\(\s*["']?([^"'()\s]+)["']?\s*\)`,
].join("|"), "gi");

const kb = (n) => `${(n / 1024).toFixed(1)}kB`;

//------------------------------------------------------------------------------------------ Choice

/**
 * The target to go to: the `[worker]` entry `-w` names, else the one `[deploy]` names.
 * @param {Record<string, Record<string, string>>} ini app.ini
 * @returns {{ key: string, kind: string, name: string }}
 */
function pickTarget(ini) {
  const targets = deployTargets(ini);
  const key = getFlagValues("--worker", "-w")[0] || "";
  const target = targets.find(t => t.key === key);
  if(target) return target;
  if(!key) throw new Error("app.ini [deploy] names no worker and no folder");
  const keys = targets.filter(t => t.key).map(t => t.key);
  throw new Error(`app.ini [worker] has no "${key}", it has: ${keys.join(", ") || "none"}`);
}

/**
 * The folder a `folder` target names, a relative path resolved from the project.
 * It has to exist: a path gone stale stops here instead of making a new folder.
 */
function folderOf(name) {
  const full = path.resolve(PATH, name);
  if(full === PATH) throw new Error(`folder "${name}" is the project itself`);
  if(!fs.existsSync(full) || !fs.statSync(full).isDirectory()) {
    throw new Error(`folder not found: ${full}`);
  }
  return full;
}

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
  const stat = fs.statSync(at);
  if(stat.isFile()) return stat.mtimeMs;
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
 * Every file the page reaches for, by the addresses in it, the query and the hash left off.
 * Local ones only: a remote address names no file here, and a data URL none at all.
 * @param {string} html
 * @returns {string[]} relative paths, each once, in the order found
 */
function referenced(html) {
  const found = new Set();
  for(const [, attr, css] of html.matchAll(REF_RE)) {
    const rel = (attr || css).split(/[?#]/)[0].replace(/^\.?\//, "");
    if(rel !== "index.html" && isProjectFile(rel)) found.add(rel);
  }
  return [...found];
}

/** Every entry of `include`: a file as it is, a folder with everything under it. */
function included(include) {
  const names = String(include || "").split(",").map(s => s.trim()).filter(Boolean);
  return names.flatMap((name) => {
    if(isProjectFile(name)) return [name];
    const files = fileList(path.join(PATH, name)).map(f => `${name}/${f}`);
    if(!files.length) Log.warn(`include: no file at ${name}`);
    return files;
  });
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
  const ini = loadIni();
  const { kind, name } = pickTarget(ini);
  const folder = kind === "folder" ? folderOf(name) : null;
  if(!folder && !WORKER_NAME.test(name)) {
    throw new Error(`Worker name "${name}" takes a-z, 0-9 and - only`);
  }
  const dry = hasFlag("--dry");
  if(!dry && !folder) checkEnv();
  if(!folder && !fs.existsSync(WRANGLER)) {
    Log.err("wrangler missing in node_modules.");
    Log.run("npm i -D wrangler");
    process.exit(1);
  }

  const index = path.join(PATH, "index.html");
  if(!fs.existsSync(index)) throw new Error("index.html not found: run tonka build first");
  const html = fs.readFileSync(index, "utf8");
  checkFresh();

  const include = included(ini.deploy?.include);
  const files = [...new Set(["index.html", ...referenced(html), ...include])];
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
  Log.ok(`${files.length} files, ${kb(total)} → ${where}`);

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
      // wrangler keeps its scratch under `.wrangler` wherever it runs from, so it runs from
      // the stage and the scratch leaves with it
      const run = spawnSync(process.execPath, args, { stdio: "inherit", cwd: dir });
      if(run.status !== 0) throw new Error(`wrangler exited with ${run.status}`);
      Log.ok(`Deployed ${name}`);
    }
    finally { fs.rmSync(dir, { recursive: true, force: true }); }
  }
  // the page is out, so the folder goes back to the app being edited, as `serve -r` does,
  // and a `.wrangler` an earlier run left in the workspace goes with it
  if(hasFlag("-r", "--remove")) {
    fs.unlinkSync(path.join(PATH, "index.html"));
    Log.ok(`Deleted ${c.orange}index.html${c.reset}`);
    const scratch = path.join(ROOT, ".wrangler");
    if(fs.existsSync(scratch)) {
      fs.rmSync(scratch, { recursive: true, force: true });
      Log.ok(`Deleted ${c.orange}.wrangler${c.reset}`);
    }
  }
}

try { await deploy(); }
catch(e) {
  Log.err(e.message);
  process.exit(1);
}
