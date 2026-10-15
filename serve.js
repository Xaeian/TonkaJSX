// serve.js
//
// Dev server for one project: a built `index.html` when there is one, else `app.html`
// with every stylesheet and script linked in. Text files go out with `{{key}}` filled.

import http from "http"
import fs from "fs"
import path from "path"
import { useProject, readFile, fileList, getPort, loadVars, replaceVars, COLOR as c, hasFlag }
  from "./utils.js"

const PATH = useProject()

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".jsx": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
}

const TEXT_EXTS = new Set([".html", ".htm", ".css", ".js", ".jsx"])

function statusColor(code) {
  if(code >= 200 && code < 300) return c.green
  if(code >= 500) return c.red
  if(code >= 400) return c.yellow
  return c.grey
}

function logTime() {
  const dt = new Date()
  const hh = String(dt.getHours()).padStart(2, "0")
  const mm = String(dt.getMinutes()).padStart(2, "0")
  const ss = String(dt.getSeconds()).padStart(2, "0")
  return `${hh}:${mm}:${ss}`
}

function logRequest(req, res, start) {
  const ms = Date.now() - start
  console.log(`→ ${req.method} ${req.url}`)
  const time = logTime()
  const col = statusColor(res.statusCode)
  console.log(`← ${req.method} ${req.url} ${col}${res.statusCode}${c.reset} `
    + `${c.grey}[${time}] ${ms}ms${c.reset}`)
}

function getUrlPath(req) {
  let pathname = "/"
  try { pathname = new URL(req.url, "http://localhost").pathname }
  catch {
    const raw = String(req.url || "/")
    pathname = raw.split("?")[0].split("#")[0] || "/"
  }
  try { pathname = decodeURIComponent(pathname) }
  catch { /* a malformed escape stays as sent */ }
  if(!pathname.startsWith("/")) pathname = "/" + pathname
  return pathname
}

// the file a path names, `ok` while it stays inside the project
function safeResolve(urlPath) {
  const fp = path.resolve(PATH, "." + urlPath)
  const ok = fp === PATH || fp.startsWith(PATH + path.sep)
  return { filePath: fp, ok }
}

function injectLinks(html) {
  const match = html.match(/\n(\s*)<head/)
  const space = match ? match[1] : "  "
  const space2 = space + space
  const cssFiles = fileList(path.join(PATH, "styles"), [".css"])
    .map(f => `${space2}<link rel="stylesheet" href="./styles/${f}">`)
    .join("\n")
  const js = fileList(path.join(PATH, "scripts"), [".js"])
  const jsx = fileList(path.join(PATH, "scripts"), [".jsx"])
  const tag = (f) => f.endsWith(".jsx")
    ? `${space2}<script type="text/babel" data-presets="tonka" src="./scripts/${f}"></script>`
    : `${space2}<script src="./scripts/${f}"></script>`
  const scriptFiles = [...js, ...jsx].map(tag).join("\n")
  return html.replace(
    /([\t ]*)<\/head>/,
    [cssFiles, scriptFiles].filter(Boolean).join("\n") + `\n${space}</head>`
  )
}

// the page: a built `index.html` over the sources, `false` when there is neither
function getIndex(res, vars) {
  let html = readFile("index.html")
  if(html) {
    console.warn(`Serving production version of app from ${c.orange}index.html${c.reset}`)
  }
  else {
    html = readFile("app.html")
    if(!html) return false
    html = injectLinks(html)
  }
  html = replaceVars(html, vars)
  res.writeHead(200, {
    "Content-Type": MIME_TYPES[".html"],
    "Cache-Control": "no-store",
  })
  res.end(html)
  return true
}

if(hasFlag("-r", "--remove")) {
  const fp = path.join(PATH, "index.html")
  if(fs.existsSync(fp)) {
    fs.unlinkSync(fp)
    console.log(`Deleted ${c.orange}index.html${c.reset}`)
  }
}

const server = http.createServer((req, res) => {
  const vars = loadVars("serve")
  const start = Date.now()
  const urlPath = getUrlPath(req)
  const noExt = !path.posix.basename(urlPath).includes(".")
  if(urlPath === "/" || noExt) {
    if(!getIndex(res, vars)) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" })
      res.end("Server error: missing index.html")
    }
    logRequest(req, res, start)
    return
  }
  const { filePath, ok } = safeResolve(urlPath)
  if(!ok) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" })
    res.end("Forbidden")
    logRequest(req, res, start)
    return
  }
  fs.readFile(filePath, (err, data) => {
    if(err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" })
      res.end("Not Found")
      logRequest(req, res, start)
      return
    }
    const ext = path.extname(filePath).toLowerCase()
    const body = TEXT_EXTS.has(ext) ? Buffer.from(replaceVars(data.toString("utf8"), vars)) : data
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      "Cache-Control": "no-store",
    })
    res.end(body)
    logRequest(req, res, start)
  })
})

const PORT = getPort()
server.listen(PORT, () => {
  console.log(`Server running at ${c.blue}http://localhost:${PORT}${c.reset}`)
})

process.on("SIGINT", () => {
  console.log(`Server stopped ${c.orange}(Ctrl+C)${c.reset}`)
  process.exit(0)
})
