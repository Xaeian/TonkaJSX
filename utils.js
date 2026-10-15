// utils.js
//
// What every script here shares: the project and its `app.ini`, the command line, the log.

import fs from "fs"
import path from "path"
import url from "url"

/** The workspace: the folder of these scripts, beside every project. */
export const ROOT = path.dirname(url.fileURLToPath(import.meta.url))

export const COLOR = {
  reset: "\x1b[0m",
  grey: "\x1b[90m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  orange: "\x1b[38;5;173m",
}

const c = COLOR

/** One voice for every script here: a glyph, a colour, a line. */
export class Log {
  static head(s) { console.log(`${c.blue}✦${c.reset} ${s}`) }
  static ok(s)   { console.log(`${c.green}✔${c.reset} ${s}`) }
  static warn(s) { console.log(`${c.yellow}!${c.reset} ${s}`) }
  static err(s)  { console.log(`${c.red}✖${c.reset} ${s}`) }
  static info(s) { console.log(`${c.grey}${s}${c.reset}`) }
  static run(s)  { console.log(`${c.cyan}▶${c.reset} ${s}`) }
}

// the arguments before a `--`, past which nothing is an option
function optionArgs(argv = process.argv.slice(2)) {
  const stop = argv.indexOf("--")
  return stop >= 0 ? argv.slice(0, stop) : argv
}

/**
 * The port `-p` or `--port` names, as `-p 3000`, `-p=3000` or `-p3000`, else `def`.
 * A value that is no TCP port (1..65535) gives `def` too.
 * @param {number} [def]
 * @param {string[]} [argv] the command line without `node` and the script
 * @returns {number}
 */
export function getPort(def = 3000, argv = process.argv.slice(2)) {
  const port = (value) => {
    const n = Number(value)
    return Number.isInteger(n) && n > 0 && n < 65536 ? n : def
  }
  const args = optionArgs(argv)
  for(let i = 0; i < args.length; i++) {
    const s = args[i]
    if(s === "-p" || s === "--port") return port(args[i + 1])
    if(s.startsWith("-p=") || s.startsWith("--port=")) return port(s.split("=", 2)[1])
    if(s.startsWith("-p") && s.length > 2) return port(s.slice(2))
  }
  return def
}

// options whose next argument is their value, never a project name
const OPTS_WITH_VALUE = new Set(["-p", "--port", "-w", "--worker"])

/**
 * The folder the command line names, resolved from `dirname`; with none named,
 * `web`, `public`, `site`, `app` or `src` when there is one, else the first folder.
 * A named folder that does not exist ends the process with `Folder not found`.
 * @param {string[]} [ignore] folder names never picked
 * @param {string} [dirname] where names resolve from, the workspace by default
 * @returns {string} absolute path
 */
export function getBasePath(ignore = ["node_modules"], dirname = ROOT) {
  const argv = process.argv.slice(2)
  let argPath = null
  for(let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if(a === "--") { argPath = argv[i + 1] ?? null; break }
    if(OPTS_WITH_VALUE.has(a)) { i++; continue }
    if(a.includes("=") && OPTS_WITH_VALUE.has(a.split("=", 1)[0])) continue
    if(!a.startsWith("-")) { argPath = a; break }
  }
  if(argPath) {
    const resolved = path.resolve(dirname, argPath)
    // a named folder must exist: a command fails loudly instead of running on a missing one
    if(!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
      console.log(`${c.red}Folder not found${c.grey}:${c.reset} ${argPath}`)
      process.exit(1)
    }
    return resolved
  }
  const prefer = ["web", "public", "site", "app", "src"]
  const dirs = fs.readdirSync(dirname, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith(".") && !ignore.includes(d.name))
    .map(d => d.name)
    .sort((a, b) => a.localeCompare(b))
  if(!dirs.length) throw new Error("Folder not found")
  const picked = prefer.find(p => dirs.includes(p)) ?? dirs[0]
  return path.join(dirname, picked)
}

// the project folder `useProject` picked, where a relative `readFile` reads from
let project = null

/**
 * The project folder the command line names, else the default one, as `getBasePath` picks it.
 * From then on `readFile`, `loadIni` and `loadVars` read from it.
 * A command on one project calls it first: importing this file reads no argv.
 * @returns {string}
 */
export function useProject() {
  project = getBasePath()
  return project
}

/**
 * `true` when the command line carries any of `names` before a `--`.
 * @param {...string} names flag names, `-r` and `--remove`
 * @returns {boolean}
 */
export function hasFlag(...names) {
  const args = optionArgs()
  return names.some(n => args.includes(n))
}

/**
 * A UTF-8 text file, relative to the project `useProject` picked or absolute,
 * `null` when it does not exist; any other read error throws.
 * @param {string} name `index.html`, or an absolute path
 * @returns {string|null}
 */
export function readFile(name) {
  const fp = path.isAbsolute(name) ? name : path.join(project, name)
  try { return fs.readFileSync(fp, "utf8") }
  catch(e) {
    if(e?.code === "ENOENT") return null
    throw e
  }
}

/**
 * Files under `dir` as POSIX paths relative to it: deeper folders first, then its own,
 * each level sorted. Entries starting with `.` are left out, an unreadable folder gives none.
 * @param {string} dir
 * @param {string[]} [exts] endings to keep, `.js`; every file when empty
 * @returns {string[]}
 */
export function fileList(dir, exts = []) {
  let entries = []
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) }
  catch { return [] }
  const ends = exts.map(e => e.toLowerCase())
  const wanted = (name) => !ends.length || ends.some(end => name.toLowerCase().endsWith(end))
  const dirs = []
  const files = []
  for(const e of entries) {
    if(e.name.startsWith(".")) continue
    if(e.isDirectory()) dirs.push(e.name)
    else if(e.isFile() && wanted(e.name)) files.push(e.name)
  }
  dirs.sort()
  files.sort()
  const nested = []
  for(const d of dirs) {
    for(const f of fileList(path.join(dir, d), exts)) nested.push(path.posix.join(d, f))
  }
  return [...nested, ...files]
}

const VARS_FILE = "app.ini"

// `{{date}}` and `{{time}}`, there in every project
function builtinVars() {
  const d = new Date()
  const p = n => String(n).padStart(2, "0")
  return {
    date: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`,
    time: `${p(d.getHours())}:${p(d.getMinutes())}`,
  }
}

/**
 * `app.ini` as sections: the lines above any header under "", the rest under their header.
 * A header is lowercased; a `;` or `#` starts a comment, at the start of a line or after a value.
 * A value holding either is quoted, `color = "#fff"`, a quote inside it escaped as `\"`.
 * @param {string} raw
 * @returns {Record<string, Record<string, string>>}
 */
export function parseIni(raw) {
  const sections = { "": {} }
  let current = ""
  for(const line of String(raw || "").split(/\r?\n/)) {
    const t = line.trim()
    if(!t || t[0] === ";" || t[0] === "#") continue
    if(t[0] === "[" && t.includes("]")) {
      current = t.slice(1, t.indexOf("]")).trim().toLowerCase()
      sections[current] ??= {}
      continue
    }
    const eq = t.indexOf("=")
    if(eq < 0) continue
    const k = t.slice(0, eq).trim()
    if(k) sections[current][k] = iniValue(t.slice(eq + 1).trim())
  }
  return sections
}

// one value: a quoted one ends at its closing quote and unescapes `\"` and `\\`,
// any other ends before a `;` or `#` comment
function iniValue(text) {
  const quote = text[0]
  if(quote !== '"' && quote !== "'") return text.split(/[;#]/)[0].trimEnd()
  let value = ""
  for(let i = 1; i < text.length; i++) {
    if(text[i] === quote) break
    if(text[i] === "\\" && (text[i + 1] === quote || text[i + 1] === "\\")) i++
    value += text[i]
  }
  return value
}

/** The project's `app.ini` as `parseIni` reads it, empty when there is none. */
export function loadIni() {
  return parseIni(readFile(VARS_FILE))
}

/**
 * Vars of one mode: built-ins, then the top of `app.ini`, then its `[section]` over them.
 * A value may name another var, `foot = Build {{date}}`, resolved one level deep.
 * @param {string} [section] `serve` or `build`
 * @returns {Record<string, string>}
 */
export function loadVars(section) {
  const all = loadIni()
  const own = section ? all[section.toLowerCase()] || {} : {}
  const vars = { ...builtinVars(), ...all[""], ...own }
  for(const k of Object.keys(vars)) {
    vars[k] = vars[k].replace(/\{\{(\w+)\}\}/g, (m, n) => Object.hasOwn(vars, n) ? vars[n] : m)
  }
  return vars
}

// kinds of target `[deploy]` names its default by
const DEPLOY_KINDS = ["worker", "folder"]

/**
 * Where a project goes, as its `app.ini` says: first the target `[deploy]` names by its kind,
 * the default, under key "", then each Worker of `[worker]` under its own key.
 * A key `[deploy]` does not take throws, and so does a worker beside a folder.
 * @param {Record<string, Record<string, string>>} ini `app.ini` as `parseIni` reads it
 * @returns {{ key: string, kind: "worker"|"folder", name: string }[]}
 */
export function deployTargets(ini) {
  const deploy = ini.deploy || {}
  const unknown = Object.keys(deploy).find(k => !DEPLOY_KINDS.includes(k) && k !== "include")
  if(unknown) {
    throw new Error(`app.ini [deploy] takes worker, folder and include, not ${unknown};`
      + " another Worker goes under [worker]")
  }
  const kinds = DEPLOY_KINDS.filter(kind => Object.hasOwn(deploy, kind))
  if(kinds.length > 1) throw new Error("app.ini [deploy] names a worker and a folder: keep one")
  const workers = Object.entries(ini.worker || {})
  return [
    ...kinds.map(kind => ({ key: "", kind, name: deploy[kind] })),
    ...workers.map(([key, name]) => ({ key, kind: "worker", name })),
  ]
}

/**
 * A command line as `argv` would hold it: split at spaces, a quoted run kept whole.
 *   splitArgs('-s -m "Update libs"') -> ["-s", "-m", "Update libs"]
 * @param {string} text
 * @returns {string[]}
 */
export function splitArgs(text) {
  return (String(text).match(/(?:[^\s"]+|"[^"]*")+/g) || []).map(arg => arg.replace(/"/g, ""))
}

/**
 * Arguments as a command line that reads back the same: one holding a space goes in quotes.
 * @param {string[]} args
 * @returns {string}
 */
export function joinArgs(args) {
  return args.map(arg => /\s/.test(arg) ? `"${arg}"` : arg).join(" ")
}

/**
 * Values of a flag that may repeat, `-t Inter --subset-text=Mono`, in the order given.
 * A value never starts with `-`.
 * @param {...string} flags flag names, `--subset-text` and `-t`
 * @returns {string[]}
 */
export function getFlagValues(...flags) {
  const args = optionArgs()
  const vals = []
  for(let i = 0; i < args.length; i++) {
    if(flags.includes(args[i]) && i + 1 < args.length && !args[i + 1].startsWith("-")) {
      vals.push(args[++i])
      continue
    }
    for(const f of flags) {
      if(args[i].startsWith(f + "=")) { vals.push(args[i].slice(f.length + 1)); break }
    }
  }
  return vals
}

/**
 * Size limit a flag carries, `-f 800kB` or `--svg=100kB`, in bytes:
 * `Infinity` for the bare flag, `null` when it is not given.
 * A value without `kB` or `MB` throws.
 * @param {...string} flags flag names, `--fonts` and `-f`
 * @returns {number|null}
 */
export function flagLimit(...flags) {
  if(!hasFlag(...flags)) return null
  const [value] = getFlagValues(...flags)
  if(!value) return Infinity
  const m = value.match(/^(\d+(?:\.\d+)?)(kB|MB)$/i)
  if(!m) throw new Error(`${flags.at(-1)}: size needs a kB or MB suffix, got "${value}"`)
  return Number(m[1]) * (m[2].toLowerCase() === "mb" ? 1048576 : 1024)
}

/**
 * `content` with every `{{key}}` filled from `vars`; an unknown key warns and leaves nothing.
 * @param {string} content
 * @param {Record<string, string>} vars
 * @returns {string}
 */
export function replaceVars(content, vars) {
  if(!content) return content
  return content.replace(/\{\{(\w+)\}\}/g, (m, k) => {
    if(Object.hasOwn(vars, k)) return vars[k]
    console.warn(`[vars] undefined: {{${k}}}`)
    return ""
  })
}
