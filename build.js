import fs from "fs"
import path from "path"
import http from "http"
import https from "https"
import { PATH, readFile, fileList, loadVars, replaceVars, hasFlag, getFlagValues, COLOR as c } from "./utils.js"

const INLINE_REMOTE = hasFlag("--inline-remote", "-i")
const FONTS_INLINE = hasFlag("--fonts", "-f")
const SVG_INLINE = hasFlag("--svg", "-s")
const COMPRESS = hasFlag("--compress", "-c")
const SUBSET_TEXT = getFlagValues("--subset-text", "-t")
const SUBSET_LIGATURE = getFlagValues("--subset-ligature", "-l")
const FONTS = FONTS_INLINE || SUBSET_TEXT.length > 0 || SUBSET_LIGATURE.length > 0

class Log {
  static head(s) { console.log(`${c.blue}✦${c.reset} ${s}`) }
  static ok(s)   { console.log(`${c.green}✔${c.reset} ${s}`) }
  static warn(s) { console.log(`${c.yellow}!${c.reset} ${s}`) }
  static err(s)  { console.log(`${c.red}✖${c.reset} ${s}`) }
  static info(s) { console.log(`${c.grey}${s}${c.reset}`) }
  static run(s)  { console.log(`${c.cyan}▶${c.reset} ${s}`) }
}

const bytes = (s) => Buffer.byteLength(String(s || ""), "utf8")

const kb = (n) => (n / 1024).toFixed(1)

const removeExternalTags = (html) => {
  const linkRe = /<link\b[^>]*href=["'](?:\.?\/)?styles\/[^"']+\.css[^"']*["'][^>]*>\s*/gi
  const scriptRe = /<script\b[^>]*src=["'](?:\.?\/)?scripts\/[^"']+\.(?:js|jsx)[^"']*["'][^>]*>\s*<\/script>\s*/gi
  return html.replace(linkRe, "").replace(scriptRe, "")
}

const removeBabelTags = (html) => {
  const re = /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>\s*/gi
  const removed = []
  const out = html.replace(re, (tag, src) => {
    const s = String(src || "").trim().toLowerCase()
    const hit =
      s.includes("babel") && (
        s.includes("standalone") ||
        s.includes("@babel") ||
        /(^|\/)babel(\.min)?\.js(\?|#|$)/i.test(s)
      )
    if(!hit) return tag
    removed.push(String(src || "").trim())
    return ""
  })
  return { html: out, removed }
}

const injectBefore = (html, needle, block) => {
  const i = html.toLowerCase().lastIndexOf(needle.toLowerCase())
  if(i < 0) return null
  return html.slice(0, i) + block + html.slice(i)
}

const minifyCss = (css) => {
  css = String(css || "")
  let out = "", q = null
  for(let i = 0; i < css.length; i++) {
    const ch = css[i]
    if(q) {
      if(ch === "\\") { out += ch; if(i + 1 < css.length) out += css[++i]; continue }
      if(ch === q) q = null
      out += ch
      continue
    }
    if(ch === "'" || ch === '"') { q = ch; out += ch; continue }
    if(ch === "/" && css[i + 1] === "*") {
      i += 2
      while(i < css.length && !(css[i] === "*" && css[i + 1] === "/")) i++
      i++
      continue
    }
    out += ch
  }
  out = out.replace(/\s+/g, " ")
  out = out.replace(/\s*([{}:;,>+~])\s*/g, "$1")
  out = out.replace(/;}/g, "}")
  return out.trim()
}

async function minifyCssSmart(css) {
  css = String(css || "")
  try {
    const lc = await import("lightningcss")
    const { code } = lc.transform({
      filename: "bundle.css",
      code: Buffer.from(css),
      minify: true
    })
    return Buffer.from(code).toString("utf8").trim()
  } catch(e) {
    const msg = String(e?.message || e)
    const missing =
      e?.code === "ERR_MODULE_NOT_FOUND" ||
      /Cannot find (package|module) 'lightningcss'/i.test(msg)
    if(missing) {
      Log.warn("lightningcss missing: CSS basic minify only")
      Log.run("npm i -D lightningcss")
    } else {
      Log.warn("lightningcss failed: CSS basic minify only")
      Log.info(msg)
    }
    return minifyCss(css)
  }
}

async function loadBabel() {
  try {
    const babelMod = await import("@babel/core")
    const jsxMod = await import("@babel/plugin-transform-react-jsx")
    const babel = babelMod?.default || babelMod
    const jsxPlugin = jsxMod?.default || jsxMod
    if(!babel?.transformSync) throw new Error("Babel transformSync missing (module shape mismatch)")
    return { transformSync: babel.transformSync, jsxPlugin }
  }
  catch(e) {
    Log.err("Babel missing in node_modules.")
    Log.run("npm i -D @babel/core @babel/plugin-transform-react-jsx")
    throw e
  }
}

async function minifyJs(js) {
  try {
    const terser = await import("terser")
    const r = await terser.minify(String(js || ""), {
      ecma: 2020,
      toplevel: true,
      compress: {
        defaults: true,
        passes: 3,
        toplevel: true,
        keep_fargs: false,
        // Babel exists only in dev, folding it drops the jsx.js preset bootstrap
        global_defs: { Babel: undefined }
      },
      mangle: {
        toplevel: true,
        keep_fnames: true,
        keep_classnames: true
      },
      format: { comments: false }
    })
    return r?.code || ""
  }
  catch(e) {
    Log.warn("Terser missing: JS not minified")
    Log.run("npm i -D terser")
    return String(js || "")
  }
}

const isRemoteUrl = (u) => /^(https?:)?\/\//i.test(String(u || "").trim())
const normRemoteUrl = (u) => {
  u = String(u || "").trim()
  if(u.startsWith("//")) return "https:" + u
  return u
}

function extractRemoteHeadAssets(html) {
  const m = html.match(/<head\b[^>]*>[\s\S]*?<\/head>/i)
  if(!m) return { html, css: [], js: [] }
  const head0 = m[0]
  const css = [], js = []
  const seen = new Set()
  const take = (arr, url) => {
    url = normRemoteUrl(url)
    const k = url.toLowerCase()
    if(seen.has(k)) return
    seen.add(k)
    arr.push(url)
  }
  let head = head0
  head = head.replace(/[ \t]*<link\b[^>]*>[ \t]*(?:\r?\n)?/gi, (tag) => {
    const hrefM = tag.match(/\bhref=["']([^"']+)["']/i)
    if(!hrefM) return tag
    const href = String(hrefM[1] || "").trim()
    if(!isRemoteUrl(href)) return tag
    const relM = tag.match(/\brel=["']([^"']+)["']/i)
    const rel = String(relM?.[1] || "").toLowerCase()
    const p = href.split("#")[0].split("?")[0].toLowerCase()
    const isCss = rel.includes("stylesheet") || p.endsWith(".css")
    if(!isCss) return tag
    take(css, href)
    return ""
  })
  head = head.replace(/[ \t]*<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>[ \t]*(?:\r?\n)?/gi, (tag, src) => {
    src = String(src || "").trim()
    if(!isRemoteUrl(src)) return tag
    const p = src.split("#")[0].split("?")[0].toLowerCase()
    if(!p || p.startsWith("data:")) return tag
    take(js, src)
    return ""
  })
  if(head === head0) return { html, css: [], js: [] }
  return { html: html.replace(head0, head), css, js }
}

function fetchBytes(url, depth = 0) {
  return new Promise((resolve, reject) => {
    let u
    try { u = new URL(url) }
    catch(e) { reject(new Error(`Bad URL: ${url}`)); return }
    const lib = u.protocol === "https:" ? https : http
    const req = lib.request(u, {
      method: "GET",
      headers: {
        "user-agent": "inline-remote",
        "accept": "*/*",
        "accept-encoding": "identity"
      }
    }, (res) => {
      const sc = res.statusCode || 0
      const loc = res.headers?.location
      if((sc === 301 || sc === 302 || sc === 303 || sc === 307 || sc === 308) && loc && depth < 5) {
        res.resume()
        const next = new URL(loc, u).toString()
        resolve(fetchBytes(next, depth + 1))
        return
      }
      if(sc < 200 || sc >= 300) {
        res.resume()
        reject(new Error(`HTTP ${sc} ${url}`))
        return
      }
      const chunks = []
      res.on("data", (c) => chunks.push(c))
      res.on("end", () => resolve(Buffer.concat(chunks)))
    })
    req.on("error", (e) => reject(new Error(`${url}: ${e?.message || e}`)))
    req.end()
  })
}

const fetchText = async (url) => (await fetchBytes(url)).toString("utf8")

async function fetchMany(urls, label) {
  if(!urls.length) return ""
  Log.ok(`REMOTE ${label}:${urls.length}`)
  const out = []
  for(const u of urls) {
    Log.info(`+ ${u}`)
    const t = await fetchText(u)
    Log.info(`  bytes:${bytes(t)}`)
    out.push(String(t || "").trimEnd())
  }
  return out.join("\n")
}

//---------------------------------------------------------------------------- Font inline (-f)

const FONT_MAX_KB = 500

//--------------------------------------------------------------------------------- Font lookup

const FONT_FILE = /\.(?:woff2?|ttf|otf)$/i

// Every font file the project carries, wherever it sits, keyed by its path from the
// project root. No folder name is a convention, so any layout is read the same way.
function fontIndex(root) {
  const out = []
  const walk = (dir, rel) => {
    for(const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if(entry.name.startsWith(".") || entry.name === "node_modules") continue
      const at = rel ? `${rel}/${entry.name}` : entry.name
      if(entry.isDirectory()) walk(path.join(dir, entry.name), at)
      else if(FONT_FILE.test(entry.name)) out.push({ file: path.join(dir, entry.name), rel: at })
    }
  }
  if(fs.existsSync(root)) walk(root, "")
  return out
}

// The src path without host or query, then every shorter tail of it:
// "inter/400-italic.woff2" first, "400-italic.woff2" after.
function pathTails(ref) {
  const parts = ref.replace(/^\w+:\/\/[^/]+/, "").replace(/[?#].*$/, "")
    .split("/").filter(part => part && part !== "." && part !== "..")
  return parts.map((_, i) => parts.slice(i).join("/"))
}

/**
 * The local file a font `src` points at, or null when the project does not carry it.
 * The longest tail of the src path that ends a file path wins, so a remote url finds a
 * mirrored folder and a bare name finds the file whatever folder holds it.
 * Nothing is guessed here: a miss means the caller reaches for the address instead.
 */
function findFont(ref, index) {
  for(const tail of pathTails(ref)) {
    const hit = index.find(entry => entry.rel === tail || entry.rel.endsWith(`/${tail}`))
    if(hit) return hit
  }
  return null
}

/**
 * The bytes behind a font `src`, with the name to report them under, or null when neither
 * the project nor the network gives them up.
 * What the project carries is read from disk, the rest comes from the address the
 * `@font-face` already states, so a project holding no fonts still builds whole.
 */
async function fontBytes(ref, index) {
  const found = findFont(ref, index)
  if(found) return { buf: fs.readFileSync(found.file), name: path.basename(found.rel) }
  if(!/^https?:/i.test(ref)) return null
  const name = path.basename(ref.replace(/[?#].*$/, ""))
  try {
    const buf = await fetchBytes(ref)
    Log.info(`  fetched: ${name} (${kb(buf.length)}KB)`)
    return { buf, name }
  }
  catch(e) {
    Log.warn(`Font fetch failed: ${ref} (${e?.message || e})`)
    return null
  }
}

async function processFonts(css, projectDir, subsetText, subsetLigature, srcDir) {
  const faces = []
  const cssBody = css.replace(/@font-face\s*\{[^}]+\}/g, block => {
    faces.push(block); return ""
  })
  if(!faces.length) return css

  // Detect used font-family names (check if defined name appears in rest of CSS)
  const defined = new Set()
  for(const f of faces) {
    const fam = f.match(/font-family:\s*["']?([^"';,}]+)/)?.[1]?.trim().replace(/["']/g, "")
    if(fam) defined.add(fam)
  }
  const usedFamilies = new Set()
  for(const fam of defined) {
    if(cssBody.includes(fam)) usedFamilies.add(fam)
  }

  // Detect used weights (shorthand `font: 500 11px` + `font-weight: 600`)
  const usedWeights = new Set(["400"])
  for(const m of cssBody.matchAll(/font-weight:\s*(\d+)/g)) usedWeights.add(m[1])
  for(const m of cssBody.matchAll(/font:\s*(\d{3})\b/g)) usedWeights.add(m[1])
  // Detect italic usage (`font-style: italic` or shorthand `font: italic ...`)
  const usesItalic = /font-style:\s*italic/i.test(cssBody)
    || /font:\s*italic\b/i.test(cssBody)

  // Filter @font-face to only used entries
  let kept = 0, skipped = 0
  const keptFaces = faces.filter(block => {
    const fam = block.match(/font-family:\s*["']?([^"';,}]+)/)?.[1]?.trim().replace(/["']/g, "")
    const wm = block.match(/font-weight:\s*(\d+)(?:\s+(\d+))?/)
    const style = block.match(/font-style:\s*(\w+)/)?.[1] || "normal"
    if(!fam || !usedFamilies.has(fam)) { skipped++; return false }
    if(style === "italic" && !usesItalic) { skipped++; return false }
    if(wm && !wm[2] && !usedWeights.has(wm[1])) { skipped++; return false }
    kept++; return true
  })

  Log.ok(`Fonts:${kept} (${skipped} skipped)`)
  for(const f of keptFaces) {
    const fam = f.match(/font-family:\s*["']?([^"';,}]+)/)?.[1]?.trim()
    const wm = f.match(/font-weight:\s*(\d+)(?:\s+(\d+))?/)
    const w = wm ? (wm[2] ? `${wm[1]}-${wm[2]}` : wm[1]) : "400"
    const s = f.match(/font-style:\s*(\w+)/)?.[1] || "normal"
    Log.info(`+ ${fam} ${w}${s === "italic" ? " italic" : ""}`)
  }

  // Load `subset-font` if any subset requested
  const needSubset = subsetText.length > 0 || subsetLigature.length > 0
  let subsetFn = null
  if(needSubset) {
    try {
      const mod = await import("subset-font")
      subsetFn = mod.default || mod
    } catch {
      Log.warn("subset-font missing: fonts not subsetted")
      Log.run("npm i -D subset-font")
    }
  }

  // Collect subset sources
  let ligatureText = null, charText = null
  if(subsetFn && needSubset) {
    const srcFiles = fileList(srcDir, [".js", ".jsx"])
    const rawSrc = srcFiles
      .map(f => readFile(path.join(srcDir, ...f.split(/[\\/]+/))) || "").join("\n")
    if(subsetLigature.length) {
      const icons = new Set()
      const NAME = "[a-z][a-z0-9_]*"
      // JSX: <span class="icon">name</span>
      for(const m of rawSrc.matchAll(new RegExp(`class=["'][^"']*\\bicon\\b[^"']*["'][^>]*>(${NAME})<`, "g")))
        icons.add(m[1].trim())
      // Data: { icon: "name" }
      for(const m of rawSrc.matchAll(new RegExp(`\\bicon:\\s*["'](${NAME})["']`, "g")))
        icons.add(m[1])
      // Arrays: const *ICON[S] = ["name", ...] — variable name must end in ICON or ICONS
      for(const m of rawSrc.matchAll(/\b\w*ICONS?\s*=\s*\[([\s\S]*?)\]/gi)) {
        for(const s of m[1].matchAll(new RegExp(`["'](${NAME})["']`, "g")))
          icons.add(s[1])
      }
      ligatureText = [...icons].join("\n")
      Log.info(`  ligatures: ${icons.size} (${[...icons].slice(0, 12).join(", ")}${icons.size > 12 ? "…" : ""})`)
    }
    if(subsetText.length) {
      charText = [...new Set(rawSrc)].join("")
      Log.info(`  text chars: ${charText.length} unique`)
    }
  }

  // Every kept face becomes a data uri, cut down first where that was asked for
  const index = fontIndex(projectDir)
  const inlined = []
  for(const block of keptFaces) {
    const fam = block.match(/font-family:\s*["']?([^"';,}]+)/)?.[1]?.trim().replace(/["']/g, "")
    const srcMatch = block.match(/url\(["']?([^"')]+)["']?\)/)
    if(!srcMatch) { inlined.push(block); continue }
    const source = await fontBytes(srcMatch[1], index)
    if(!source) {
      Log.warn(`Font missing: ${srcMatch[1]}`)
      inlined.push(block); continue
    }
    let { buf, name } = source
    let subsetted = false
    if(subsetFn) {
      const text = subsetLigature.includes(fam) ? ligatureText
        : subsetText.includes(fam) ? charText
        : null
      if(text) {
        const before = buf.length
        try {
          buf = await subsetFn(buf, text, { targetFormat: "woff2" })
          subsetted = true
          Log.info(`  subset: ${name} ${kb(before)}KB → ${kb(buf.length)}KB`)
        }
        catch(e) { Log.warn(`  subset failed: ${name} (${e?.message || e})`) }
      }
    }
    // a cut face is already as small as it gets, so only a whole one meets the cap
    if(!subsetted && buf.length / 1024 > FONT_MAX_KB) {
      Log.warn(`Font too large: ${name} (${kb(buf.length)}KB > ${FONT_MAX_KB}KB)`
        + ` ${c.grey}(skipped)${c.reset}`)
      continue
    }
    // subsetting answers in woff2 whatever went in, and both the type and the hint that
    // follows the url have to name what the data now is
    const ext = subsetted ? "woff2" : name.split(".").pop().toLowerCase()
    const mime = { woff2: "font/woff2", woff: "font/woff", otf: "font/otf" }[ext] || "font/ttf"
    Log.info(`  inline: ${name} (${kb(buf.length)}KB)`)
    let face = block.replace(srcMatch[0], `url(data:${mime};base64,${buf.toString("base64")})`)
    if(subsetted) face = face.replace(/format\(\s*["']?[\w-]+["']?\s*\)/i, `format("woff2")`)
    inlined.push(face)
  }
  return inlined.join("\n") + "\n" + cssBody
}

//----------------------------------------------------------------------------- SVG inline (-s)

async function inlineSvgs(code, baseDir) {
  const refs = new Set()
  for(const m of code.matchAll(/["']([^"']*\.svg)["']/g)) refs.add(m[1])
  if(!refs.size) return code
  let optimize = null
  try {
    const svgo = await import("svgo")
    optimize = (s) => svgo.optimize(s, {
      multipass: true,
      plugins: ["preset-default"]
    }).data
  } catch {
    Log.warn("svgo missing: SVGs not optimized")
    Log.run("npm i -D svgo")
  }
  for(const ref of refs) {
    const fp = path.join(baseDir, ref)
    if(!fs.existsSync(fp)) continue
    let svg = fs.readFileSync(fp, "utf8")
    const b0 = bytes(svg)
    if(optimize) svg = optimize(svg)
    const uri = `data:image/svg+xml,${encodeURIComponent(svg)}`
    code = code.split(`"${ref}"`).join(`"${uri}"`)
    code = code.split(`'${ref}'`).join(`'${uri}'`)
    Log.ok(`SVG inline: ${ref} (${b0} → ${bytes(svg)})`)
  }
  return code
}

//------------------------------------------------------------------------ Pre-compression (-c)

async function precompress(filePath) {
  const { gzip, brotliCompress, constants } = await import("node:zlib")
  const { promisify } = await import("node:util")
  const gz = promisify(gzip)
  const br = promisify(brotliCompress)
  const input = fs.readFileSync(filePath)
  const gzipped = await gz(input, { level: constants.Z_BEST_COMPRESSION })
  fs.writeFileSync(filePath + ".gz", gzipped)
  const brotlied = await br(input, { params: {
    [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
    [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
    [constants.BROTLI_PARAM_SIZE_HINT]: input.length,
  }})
  fs.writeFileSync(filePath + ".br", brotlied)
  const fmt = (b) => (b / 1024).toFixed(1) + "KB"
  Log.ok(`Compress: ${fmt(input.length)} → gz:${fmt(gzipped.length)} br:${fmt(brotlied.length)}`)
}

async function build()
{
  Log.head(`Build ${c.grey}${PATH}${c.reset}`)
  const vars = loadVars("build")
  if(Object.keys(vars).length)
    Log.ok(`Vars:${Object.keys(vars).length} (${Object.keys(vars).join(", ")})`)
  if(INLINE_REMOTE) Log.warn("-i inline-remote enabled")
  if(FONTS) Log.ok("-f fonts enabled")
  if(SVG_INLINE) Log.ok("-s svg enabled")
  if(COMPRESS) Log.ok("-c compress enabled")
  if(SUBSET_TEXT.length) Log.ok(`-t subset-text: ${SUBSET_TEXT.join(", ")}`)
  if(SUBSET_LIGATURE.length) Log.ok(`-l subset-ligature: ${SUBSET_LIGATURE.join(", ")}`)
  const indexPath = path.join(PATH, "app.html")
  if(!fs.existsSync(indexPath)) throw new Error("app.html not found in PATH")
  let html = readFile(indexPath)
  if(html == null) throw new Error("app.html read failed")
  const r = removeBabelTags(html)
  html = r.html
  if(r.removed.length) {
    Log.ok(`Babel script removed`)
    for(const s of r.removed) Log.info(`- ${s}`)
  }
  let remoteCss = "", remoteJs = ""
  if(INLINE_REMOTE) {
    const x = extractRemoteHeadAssets(html)
    html = x.html
    if(x.css.length || x.js.length) {
      remoteCss = await fetchMany(x.css, "CSS")
      remoteJs = await fetchMany(x.js, "JS")
    } else {
      Log.warn("INLINE REMOTE: no remote CSS/JS found in <head>")
    }
  }
  const m = html.match(/\n(\s*)<head/)
  const space = m ? m[1] : "  "
  const space2 = space + space
  const cssDir = path.join(PATH, "styles")
  const cssList = fileList(cssDir, [".css"])
  Log.ok(`CSS:${cssList.length}`)
  for(const f of cssList) Log.info(`+ styles/${f}`)
  let cssBundleLocal = cssList.length ? cssList.map(f => {
    const t = readFile(path.join(cssDir, ...String(f).split(/[\\/]+/)))
    if(t == null) throw new Error(`Missing: styles/${f}`)
    return t.trimEnd()
  }).join("\n") : ""
  let cssBundle = [remoteCss, cssBundleLocal].filter(Boolean).join("\n")
  if(cssBundle) {
    cssBundle = replaceVars(cssBundle, vars)
    const b0 = bytes(cssBundle)
    cssBundle = await minifyCssSmart(cssBundle)
    Log.ok(`CSS min: ${b0} → ${bytes(cssBundle)}`)
    if(FONTS) {
      // A face is looked up among the project files whatever folder holds them, and one
      // the project does not carry is fetched from the address its @font-face states.
      cssBundle = await processFonts(cssBundle, PATH, SUBSET_TEXT, SUBSET_LIGATURE,
        path.join(PATH, "scripts"))
    }
  }
  else Log.warn("CSS bundle empty")
  const jsDir = path.join(PATH, "scripts")
  const jsList = fileList(jsDir, [".js"])
  const jsxList = fileList(jsDir, [".jsx"])
  const lo = html.toLowerCase()
  const b0 = lo.indexOf("<body")
  const add = []
  if(b0 >= 0) {
    const b1 = html.indexOf(">", b0)
    const b2 = lo.lastIndexOf("</body>")
    if(b1 >= 0) {
      const pre = html.slice(0, b1 + 1)
      const body = html.slice(b1 + 1, b2 >= 0 ? b2 : html.length)
      const post = html.slice(b2 >= 0 ? b2 : html.length)
      const re = /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>\s*/gi
      const seen = new Set()
      const body2 = body.replace(re, (tag, src) => {
        src = String(src || "").trim()
        if(/^(https?:)?\/\//i.test(src)) return tag
        let p = src.split("#")[0].split("?")[0].replace(/\\/g, "/").trim()
        while(p.startsWith("./")) p = p.slice(2)
        while(p.startsWith("/")) p = p.slice(1)
        if(!p || p.startsWith("..") || !/\.(js|jsx)$/i.test(p)) return tag
        if(/^scripts\//i.test(p)) return tag
        const k = p.toLowerCase()
        if(seen.has(k)) return ""
        seen.add(k); add.push(p)
        return ""
      })
      if(add.length) {
        html = pre + body2 + post
        for(const p of add) (p.toLowerCase().endsWith(".jsx") ? jsxList : jsList).push(`../${p}`)
        for(const p of add) Log.info(`+ ${p}`)
      }
    }
  }
  Log.ok(`JS:${jsList.length} JSX:${jsxList.length} BODY:${add.length}`)
  for(const f of jsList) Log.info(`+ scripts/${f}`)
  for(const f of jsxList) Log.info(`+ scripts/${f}`)
  const allScripts = [...jsList, ...jsxList]
  const localJS = allScripts.length ? allScripts.map(f => {
    const t = readFile(path.join(jsDir, ...String(f).split(/[\\/]+/)))
    if(t == null) throw new Error(`Missing: scripts/${f}`)
    return t.trimEnd()
  }).join("\n;\n") : ""
  const rawJS = [String(remoteJs || "").trimEnd(), localJS].filter(Boolean).join("\n;\n")
  let jsBundle = ""
  if(rawJS) {
    const src = replaceVars(rawJS, vars)
    const { transformSync, jsxPlugin } = await loadBabel()
    Log.ok("Babel: JSX → JS")
    const out = transformSync(src, { babelrc: false, configFile: false, sourceType: "unambiguous", comments: false, plugins: [[jsxPlugin, { runtime: "classic", pragma: "JSX.createElement", pragmaFrag: "JSX.Fragment", throwIfNamespace: false }]] })
    jsBundle = out?.code || ""
    if(jsBundle){
      const b0 = bytes(jsBundle)
      jsBundle = await minifyJs(jsBundle)
      Log.ok(`JS min: ${b0} → ${bytes(jsBundle)}`)
    }
    else Log.warn("Babel returned empty output")
  }
  else Log.warn("JS bundle empty")
  if(SVG_INLINE && jsBundle) jsBundle = await inlineSvgs(jsBundle, PATH)
  html = removeExternalTags(html)

  if(cssBundle) {
    const styleBlock = `${space}<style>\n${cssBundle}\n${space2}</style>\n${space}`
    const next = injectBefore(html, `</head>`, styleBlock)
    if(!next) throw new Error("Missing </head> in HTML")
    html = next
    Log.ok("Injected <style> CSS")
  }
  if(jsBundle) {
    const scriptBlock = `<script>\n${jsBundle}\n${space2}</script>\n${space}`
    const next = injectBefore(html, "</body>", scriptBlock)
    if(!next) throw new Error("Missing </body> in HTML")
    html = next
    Log.ok("Injected <script> JS")
  }
  html = replaceVars(html, vars)
  const outPath = path.join(PATH, "index.html")
  fs.writeFileSync(outPath, html, "utf8")
  Log.ok(`Wrote ${c.grey}${outPath}${c.reset}`)
  if(COMPRESS) await precompress(outPath)
}

build().catch((e)=>{
  Log.err(e?.message || String(e))
  process.exit(1)
})