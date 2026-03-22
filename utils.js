import fs from "fs"
import path from "path"
import url from "url"

export const COLOR = {
  reset: "\x1b[0m",
  gray: "\x1b[90m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  orange: "\x1b[38;5;173m"
};

/**
 * Get port number from CLI args.
 * Looks for a port option in `argv`:
 * - `-p 3000` or `--port 3000`
 * - `-p=3000` or `--port=3000`
 * - `-p3000`
 * Stops parsing at `--` (everything after `--` is treated as positional args).
 * If the found value is not a valid TCP port (1..65535), returns `def`.
 * @param {number} [def=3000] Fallback port when no valid port is provided.
 * @param {string[]} [argv=process.argv.slice(2)] CLI args to parse (without `node` and script path).
 * @returns {number} The chosen port number.
 */
export function getPort(def = 3000, argv = process.argv.slice(2)) {
  const stop = argv.indexOf("--")
  const a = stop >= 0 ? argv.slice(0, stop) : argv
  for(let i = 0; i < a.length; i++) {
    const s = a[i]
    if(s === "-p" || s === "--port") {
      const n = Number(a[i+1])
      return Number.isInteger(n) && n > 0 && n < 65536 ? n : def
    }
    if(s.startsWith("-p=") || s.startsWith("--port=")) {
      const n = Number(s.split("=", 2)[1])
      return Number.isInteger(n) && n > 0 && n < 65536 ? n : def
    }
    if(s.startsWith("-p") && s.length > 2) {
      const n = Number(s.slice(2))
      return Number.isInteger(n) && n > 0 && n < 65536 ? n : def
    }
  }
  return def
}

const OPTS_WITH_VALUE = new Set(["-p", "--port" /*, "--host", "--root", ... */])

/**
 * Get target directory.
 * - If argv[2] exists -> resolve it from `dirname` and use it.
 * - Else -> pick preferred dir name (web/public/site/app/src), otherwise first directory.
 * - Skips hidden dirs and ignored names.
 * @param {string[]} [ignore=["node_modules"]] Directory names to ignore.
 * @param {string|null} [dirname=null] Base directory (default: directory of this module).
 * @returns {string} Absolute path to target directory.
 */
export function getBasePath(ignore = ["node_modules"], dirname = null) {
  if(dirname === null) dirname=path.dirname(url.fileURLToPath(import.meta.url))
  const argv = process.argv.slice(2)
  let argPath = null
  for(let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if(a === "--") { argPath = argv[i + 1] ?? null; break }
    if(OPTS_WITH_VALUE.has(a)) { i++; continue }
    if(a.includes("=") && OPTS_WITH_VALUE.has(a.split("=", 1)[0])) continue
    if(a.startsWith("-")) continue
    argPath = a; break
  }
  if(argPath) return path.resolve(dirname, argPath)
  const prefer = ["web", "public", "site", "app", "src"]
  const dirs = fs.readdirSync(dirname,{withFileTypes:true})
    .filter(d => d.isDirectory() && !d.name.startsWith(".") && !ignore.includes(d.name))
    .map(d => d.name)
    .sort((a,b) => a.localeCompare(b))
  if(!dirs.length) throw new Error("Folder not found")
  const picked = prefer.find(p=> dirs.includes(p)) ?? dirs[0]
  return path.join(dirname, picked)
}

export const PATH = getBasePath()

/**
 * Check if any of the given flags is present in CLI args.
 * Stops parsing at `--` (same convention as `getPort`).
 * @param {...string} names Flag names to look for (e.g. "-d", "--delete").
 * @returns {boolean}
 */
export function hasFlag(...names) {
  const argv = process.argv.slice(2)
  const stop = argv.indexOf("--")
  const a = stop >= 0 ? argv.slice(0, stop) : argv
  return names.some(n => a.includes(n))
}

/**
 * Read UTF-8 text file.
 * Accepts path relative to project root `PATH` or absolute path.
 * Returns `null` when file does not exist (ENOENT).
 * Re-throws any other I/O errors (permissions, EISDIR, etc).
 * @param {string} name File path relative to `PATH` (e.g. "index.html") or absolute path.
 * @returns {string|null} File contents as string, or `null` if missing.
 */
export function readFile(name) {
  const fp = path.isAbsolute(name) ? name : path.join(PATH, name)
  try { return fs.readFileSync(fp, "utf8") }
  catch(e) {
    if(e?.code === "ENOENT") return null
    throw e
  }
}

/**
 * Recursively collect files from directory.
 * Primitive order: folders first (depth-first), then files in current folder.
 * Skips hidden entries (starting with '.').
 * @param {string} dir Base directory (absolute or relative).
 * @param {string[]} [exts=[]] Allowed extensions (e.g. [".js",".jsx"]), empty = all.
 * @returns {string[]} List of relative file paths (POSIX style).
 */
export function fileList(dir, exts=[]) {
  let entries = []
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) }
  catch { return [] }
  const out = []
  const dirs = []
  const files = []
  const normExts = exts.map(e => e.toLowerCase())
  for(const e of entries) {
    if(e.name.startsWith(".")) continue
    if(e.isDirectory()) dirs.push(e.name)
    else if(e.isFile()) {
      if(!normExts.length || normExts.some(ext => e.name.toLowerCase().endsWith(ext))) files.push(e.name)
    }
  }
  dirs.sort()
  files.sort()
  for(const d of dirs) {
    const sub = fileList(path.join(dir,d),exts)
    for(const p of sub) out.push(path.posix.join(d,p))
  }
  for(const f of files) out.push(f)
  return out
}

const VARS_FILE = "app.ini"

/**
 * Parse app.ini — top-level vars merged with [section] overrides.
 * Returns flat {key: string} map. Missing file → empty {}.
 * @param {string} section "serve" | "build"
 * @returns {Record<string, string>}
 */
export function loadVars(section) {
  const raw = readFile(VARS_FILE)
  if(!raw) return {}
  const vars = {}
  let current = null
  for(const line of raw.split(/\r?\n/)) {
    const t = line.trim()
    if(!t || t[0] === ";" || t[0] === "#") continue
    const sm = t.match(/^\[(.+?)\]$/)
    if(sm) { current = sm[1].trim().toLowerCase(); continue }
    const eq = t.indexOf("=")
    if(eq < 0) continue
    const k = t.slice(0, eq).trim()
    let v = t.slice(eq + 1).trim()
    if((v[0] === '"' && v.at(-1) === '"') || (v[0] === "'" && v.at(-1) === "'"))
      v = v.slice(1, -1)
    if(!k) continue
    if(current === null || current === section?.toLowerCase())
      vars[k] = v
  }
  return vars
}

/**
 * Replace `{{key}}` placeholders in content.
 * Undefined keys → warning + empty string.
 * @param {string} content
 * @param {Record<string, string>} vars
 * @returns {string}
 */
export function replaceVars(content, vars) {
  if(!content) return content
  return content.replace(/\{\{(\w+)\}\}/g, (m, k) => {
    if(k in vars) return vars[k]
    console.warn(`[vars] undefined: {{${k}}}`)
    return ""
  })
}