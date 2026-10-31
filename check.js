// check.js
//
// A project's scripts read as `build` reads them, the step `test` runs before any suite:
// those under `scripts/` and those the page's `<body>` loads beside them.
// Every script goes through the JSX transform.
// No name stands at the top level of two scripts: they share one global scope, where
// a second `const` stops its file and a second `function` silently replaces the first.
// Whether a name read has a source is left to the browser: the page takes names from
// whatever it links, which a check of the project's own files cannot see.

import fs from "fs";
import path from "path";
import { fileList, bodyScripts, loadBabel, JSX_OPTIONS } from "./utils.js";

const { babel, jsxPlugin } = await loadBabel();
const BABEL = {
  babelrc: false, configFile: false, sourceType: "unambiguous", ast: true, code: false,
  plugins: [[jsxPlugin, JSX_OPTIONS]],
};

// the scripts `build` bundles, as paths from the project
function scripts(dir) {
  const page = path.join(dir, "app.html");
  const html = fs.existsSync(page) ? fs.readFileSync(page, "utf8") : "";
  const own = fileList(path.join(dir, "scripts"), [".js", ".jsx"]).map(file => `scripts/${file}`);
  return [...own, ...bodyScripts(html).scripts];
}

// the names a script declares at its top level, where every other script sees them
function topNames(ast) {
  const names = [];
  for(const node of ast.program.body) {
    if(node.type === "VariableDeclaration") {
      for(const { id } of node.declarations) {
        names.push(...Object.keys(babel.types.getBindingIdentifiers(id)));
      }
    }
    else if(node.type === "FunctionDeclaration" || node.type === "ClassDeclaration") {
      names.push(node.id.name);
    }
  }
  return names;
}

/**
 * Problems of a project's scripts, a line each, none when they read as `build` reads them.
 * @param {string} dir project folder
 * @returns {string[]|null} `null` when the project has no scripts
 */
export function checkScripts(dir) {
  const files = scripts(dir);
  if(!files.length) return null;
  const problems = [];
  const declared = new Map();
  for(const file of files) {
    const full = path.join(dir, file);
    if(!fs.existsSync(full)) { problems.push(`${file}: missing`); continue; }
    let ast;
    try { ast = babel.transformSync(fs.readFileSync(full, "utf8"), BABEL).ast; }
    catch(e) {
      // given no file name, Babel opens its message with `unknown: `
      problems.push(`${file}: ${e.message.split("\n")[0].replace(/^unknown: /, "")}`);
      continue;
    }
    for(const name of topNames(ast)) declared.set(name, [...declared.get(name) || [], file]);
  }
  for(const [name, where] of declared) {
    if(where.length > 1) problems.push(`${name}: declared in ${where.join(", ")}`);
  }
  return problems;
}
