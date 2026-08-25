#!/usr/bin/env node

import fs from "fs"
import path from "path"
import url from "url"

const ROOT = path.dirname(url.fileURLToPath(import.meta.url))
const { version } = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"))

const cmd = process.argv[2]
const rest = process.argv.slice(3)
const wantHelp = !cmd || cmd === "-h" || cmd === "--help" || rest.includes("-h") || rest.includes("--help")
const wantVersion = cmd === "-v" || cmd === "--version" || rest.includes("-v") || rest.includes("--version")

if(wantVersion) { console.log("TonkaJSX " + version); process.exit(0) }

if((cmd === "serve" || cmd === "build") && !wantHelp) {
  process.argv.splice(2, 1)
}

const { hasFlag, COLOR: c } = await import("./utils.js")

function listProjects() {
  return fs.readdirSync(ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith(".") && d.name !== "node_modules")
    .map(d => d.name)
    .filter(n => fs.existsSync(path.join(ROOT, n, "app.html")))
    .sort()
}

function help() {
  const projects = listProjects()
  const plist = projects.length
    ? projects.map(p => `  ${c.green}•${c.reset} ${p}`).join("\n")
    : `  ${c.grey}(none: create a folder with app.html)${c.reset}`
  console.log(`
${c.cyan}TonkaJSX${c.reset} ${c.grey}${version}${c.reset}: lightweight JSX frontend framework

${c.grey}Usage:${c.reset}
  ${c.yellow}tonka${c.reset} serve [<${c.green}project${c.reset}>] [${c.blue}-p${c.reset} <${c.grey}port${c.reset}>] [${c.blue}-r${c.reset}]  start dev server
  ${c.yellow}tonka${c.reset} build [<${c.green}project${c.reset}>] [${c.blue}options${c.reset}]         build production index.html

${c.grey}Serve options:${c.reset}
  ${c.blue}-r${c.reset}, --remove                  delete built index.html before serving

${c.grey}Build options:${c.reset}
  ${c.blue}-i${c.reset}, --inline-remote           inline remote CSS/JS from CDN
  ${c.blue}-f${c.reset}, --fonts                   drop unused @font-face, inline as base64
  ${c.blue}-s${c.reset}, --svg                     inline SVGs as data URIs
  ${c.blue}-c${c.reset}, --compress                generate .gz + .br alongside index.html
  ${c.blue}-t${c.reset}, --subset-text ${c.orange}"Name"${c.reset}      subset text font to chars in source
  ${c.blue}-l${c.reset}, --subset-ligature ${c.orange}"Name"${c.reset}  subset icon font to ligatures in source
  ${c.blue}-h${c.reset}, --help                    show this message
  ${c.blue}-v${c.reset}, --version                 show version

${c.grey}Projects(${c.green}${projects.length}${c.grey}):${c.reset}
${plist}
`)
}

if(wantHelp) { help(); process.exit(0) }
if(cmd === "serve") await import("./serve.js")
else if(cmd === "build") await import("./build.js")
else {
  console.log(`${c.red}Unknown command:${c.reset} ${cmd}\n`)
  help()
  process.exit(1)
}