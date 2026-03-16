import http from "http"
import fs from "fs"
import path from "path"
import { PATH, readFile, fileList, getPort, loadVars, replaceVars, COLOR }
  from "./utils.js"

const vars = loadVars("serve")

const mimeTypes = {
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
  ".mp4": "video/mp4"
}

const statusColor = (code) => {
  if(code >= 200 && code < 300) return COLOR.green
  if(code >= 500) return COLOR.red
  if(code >= 400) return COLOR.yellow
  return COLOR.gray
}

const logTime = () => {
  const dt = new Date()
  const hh = String(dt.getHours()).padStart(2, "0")
  const mm = String(dt.getMinutes()).padStart(2, "0")
  const ss = String(dt.getSeconds()).padStart(2, "0")
  return `${hh}:${mm}:${ss}`
}

function logRequest(req,res,start) {
  const ms = Date.now()-start
  console.log(`→ ${req.method} ${req.url}`)
  const time = logTime()
  const col=statusColor(res.statusCode)
  console.log(
    `← ${req.method} ${req.url} ${col}${res.statusCode}${COLOR.reset} `+
    `${COLOR.gray}[${time}] ${ms}ms${COLOR.reset}`
  )
}

const getUrlPath = (req)=> {
  let path = "/"
  try { path = new URL(req.url,"http://localhost").pathname }
  catch {
    const raw = String(req.url || "/")
    path = raw.split("?")[0].split("#")[0] || "/"
  }
  try { path = decodeURIComponent(path) } catch {}
  if(!path.startsWith("/")) path = "/" + path
  return path
}

const safeResolve = (urlPath) => {
  const fp = path.resolve(PATH, "." + urlPath)
  const ok = (fp === PATH) || fp.startsWith(PATH + path.sep)
  return { filePath: fp, ok }
}

const injectLinks = (html) => {
  const match = html.match(/\n(\s*)<head/)
  const space = match ? match[1] : "  "
  const space2 = space + space
  const cssFiles = fileList(path.join(PATH,"styles"),[".css"])
    .map(f=> `${space2}<link rel="stylesheet" href="./styles/${f}">`)
    .join("\n")
  const js = fileList(path.join(PATH,"scripts"),[".js"])
  const jsx = fileList(path.join(PATH,"scripts"),[".jsx"])
  const tag = (f)=> f.endsWith(".jsx")
    ? `${space2}<script type="text/babel" src="./scripts/${f}"></script>`
    : `${space2}<script src="./scripts/${f}"></script>`
  const scriptFiles = [...js, ...jsx].map(tag).join("\n")
  return html.replace(
    /([\t ]*)<\/head>/,
    [cssFiles,scriptFiles].filter(Boolean).join("\n")+`\n${space}</head>`
  )
}

const getIndex = (res) => {
  let html = readFile("index.html");
  if(html) {
    console.warn(
      `Serving production version of app from ${COLOR.orange}index.html${COLOR.end}`
    )
  }
  else {
    html = readFile("app.html");
    if(!html) return false;
    html = injectLinks(html)
  }
  html = replaceVars(html, vars)
  res.writeHead(200, {
    "Content-Type": mimeTypes[".html"],
    "Cache-Control": "no-store"
  })
  res.end(html)
  return true
}

const TEXT_EXTS = new Set([".html", ".htm", ".css", ".js", ".jsx"])

const server = http.createServer((req, res) => {
  const start = Date.now()
  const urlPath = getUrlPath(req)
  const noExt = !(path.posix.basename(urlPath)).includes(".")
  if(urlPath === "/" || noExt) {
    const index = getIndex(res);
    if(!index) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" })
      res.end("Server error: missing index.html")
    }
    logRequest(req, res, start)
    return
  }
  const { filePath, ok } = safeResolve(urlPath)
  if(!ok) {
    res.writeHead(403, { "Content-Type":"text/plain; charset=utf-8" })
    res.end("Forbidden")
    logRequest(req,res,start)
    return
  }
  fs.readFile(filePath, (err, data) => {
    if(err) {
      res.writeHead(404, { "Content-Type":"text/plain; charset=utf-8" })
      res.end("Not Found")
      logRequest(req,res,start)
      return
    }
    const ext = path.extname(filePath).toLowerCase()
    let mime = mimeTypes[ext] || "application/octet-stream"
    let body = data
    if(TEXT_EXTS.has(ext)) {
      let src = data.toString("utf8")
      src = replaceVars(src, vars)
      if(ext === ".jsx")
        src = `/** @jsx JSX.createElement */\n/** @jsxFrag JSX.createFragment */\n\n${src}`
      body = Buffer.from(src)
    }
    res.writeHead(200,{
      "Content-Type": mime,
      "Cache-Control":"no-store"
    })
    res.end(body)
    logRequest(req,res,start)
  })
})

const PORT = getPort()
server.listen(PORT, () => {
  console.log(`Server running at ${COLOR.blue}http://localhost:${PORT}${COLOR.reset}`)
})

process.on("SIGINT", () => {
  console.log(`Server stopped ${COLOR.orange}(Ctrl+C)${COLOR.reset}`)
  process.exit(0)
})
