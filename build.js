import fs from "fs"
import path from "path"
import http from "http"
import https from "https"
import { PATH, readFile, fileList, COLOR } from "./utils.js"

const ARGS = new Set(process.argv.slice(2))
const INLINE_REMOTE = ARGS.has("--inline-remote") || ARGS.has("-i")

class Log {
  static c = COLOR
  static head(s) { console.log(`${this.c.blue}✦${this.c.reset} ${s}`) } 
  static ok(s) { console.log(`${this.c.green}✔${this.c.reset} ${s}`) }
  static warn(s) { console.log(`${this.c.yellow}!${this.c.reset} ${s}`) }
  static err(s) { console.log(`${this.c.red}✖${this.c.reset} ${s}`) }
  static info(s) { console.log(`${this.c.gray}${s}${this.c.reset}`) }
  static run(s) { console.log(`${this.c.cyan}▶${this.c.reset} ${s}`) }
}

const bytes = (s) => Buffer.byteLength(String(s || ""), "utf8")

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
        dead_code: true,
        drop_debugger: true,
        conditionals: true,
        booleans: true,
        loops: true,
        if_return: true,
        join_vars: true,
        sequences: true,
        reduce_funcs: true,
        reduce_vars: true,
        comparisons: true,
        evaluate: true,
        hoist_funs: true,
        hoist_vars: false,
        keep_fargs: false
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

function fetchText(url, depth = 0) {
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
        resolve(fetchText(next, depth + 1))
        return
      }
      if(sc < 200 || sc >= 300) {
        res.resume()
        reject(new Error(`HTTP ${sc} ${url}`))
        return
      }
      const chunks = []
      res.on("data", (c) => chunks.push(c))
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
    })
    req.on("error", (e) => reject(new Error(`${url}: ${e?.message || e}`)))
    req.end()
  })
}

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

async function build()
{
  Log.head(`Build ${COLOR.gray}${PATH}${COLOR.reset}`)
  if(INLINE_REMOTE) Log.warn("--inline-remote enabled")
  const indexPath = path.join(PATH, "main.html")
  if(!fs.existsSync(indexPath)) throw new Error("main.html not found in PATH")
  let html = readFile(indexPath)
  if(html == null) throw new Error("main.html read failed")
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
    const b0 = bytes(cssBundle)
    cssBundle = await minifyCssSmart(cssBundle)
    Log.ok(`CSS min: ${b0} → ${bytes(cssBundle)}`)
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
  if(rawJS){
    const { transformSync, jsxPlugin } = await loadBabel()
    Log.ok("Babel: JSX → JS")
    const out = transformSync(rawJS, { babelrc: false, configFile: false, sourceType: "unambiguous", comments: false, plugins: [[jsxPlugin, { pragma: "JSX.createElement", pragmaFrag: "JSX.createFragment", throwIfNamespace: false }]] })
    jsBundle = out?.code || ""
    if(jsBundle){
      const b0 = bytes(jsBundle)
      jsBundle = await minifyJs(jsBundle)
      Log.ok(`JS min: ${b0} → ${bytes(jsBundle)}`)
    }
    else Log.warn("Babel returned empty output")
  }
  else Log.warn("JS bundle empty")
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
  const outPath = path.join(PATH, "index.html")
  fs.writeFileSync(outPath, html, "utf8")
  Log.ok(`Wrote ${COLOR.gray}${outPath}${COLOR.reset}`)
}

build().catch((e)=>{
  Log.err(e?.message || String(e))
  process.exit(1)
})
