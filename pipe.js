// pipe.js
//
// Ships the apps a list names, one after another: `build` with the app's flags,
// then `deploy -r`, and around them a commit when the line asks for one.
// The list is a text file in the workspace, `pipe.txt` unless named, one app per line
// with its build flags as they follow `tonka build`; a line starting with `#` is a comment:
//   shop -f -s
//   blog -m "Update libs"
// `-m` commits what changed in that app before its build, and once the page is out
// pushes the commit when the branch has an upstream; an app with no change commits nothing.
// `build` and `deploy` get the rest of the line and each takes what it knows, `-w test` too.
// Every line is checked before the first app goes, and the first failure stops the run.
//
//   tonka pipe [<list>] [--dry]

import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { ROOT, Log, splitArgs, joinArgs, COLOR as c } from "./utils.js";

const TONKA = path.join(ROOT, "tonka.js");

const names = (apps) => apps.join(", ") || "none";

// what the command line asks for; a list named without an extension is a `.txt`,
// and everything else lives in the list
function options(args) {
  const name = args[0] && !args[0].startsWith("-") ? args.shift() : "pipe";
  const file = path.resolve(ROOT, path.extname(name) ? name : `${name}.txt`);
  const other = args.find(arg => arg !== "--dry");
  if(other) throw new Error(`${other} is no pipe option: build flags and -m go in the list`);
  return { file, dry: args.includes("--dry") };
}

// one line as `{ app, args, message }`: `-m` and its message leave what `build` gets
function entry(line) {
  const args = splitArgs(line);
  const at = args.indexOf("-m");
  if(at < 0) return { app: args[0], args, message: null };
  const message = args[at + 1];
  args.splice(at, 2);
  if(!message) throw new Error(`-m takes a message: ${line.trim()}`);
  if(!args.length) throw new Error(`No app: ${line.trim()}`);
  return { app: args[0], args, message };
}

// the list, one entry per line that is neither blank nor a `#` comment
function readList(file) {
  if(!fs.existsSync(file)) throw new Error(`List not found: ${file}`);
  return fs.readFileSync(file, "utf8").split(/\r?\n/)
    .filter(line => line.trim() && !line.trim().startsWith("#"))
    .map(entry);
}

// git in a folder: its output when it went through, git's own words when not
function git(dir, ...args) {
  const run = spawnSync("git", ["-C", dir, ...args], { encoding: "utf8" });
  if(run.status === 0) return run.stdout;
  const why = run.error ? run.error.message : run.stderr.trim();
  throw new Error(`git ${args[0]}: ${why}`);
}

// the branch's upstream, `origin/main`, or `null` for a branch that syncs nowhere
function upstream(dir) {
  const args = ["-C", dir, "rev-parse", "--abbrev-ref", "@{u}"];
  const run = spawnSync("git", args, { encoding: "utf8" });
  return run.status === 0 ? run.stdout.trim() : null;
}

// whatever changed in the app's folder, committed, `true` when there was something;
// `add` and `commit` stay in the folder, so an app inside a bigger repo commits its own files
function commit(dir, message) {
  if(!git(dir, "status", "--porcelain", ".").trim()) return false;
  git(dir, "add", "-A", ".");
  git(dir, "commit", "-q", "-m", message, "--", ".");
  Log.ok(`Committed: ${message}`);
  return true;
}

// the commit out to the upstream, as a sync does; a branch with none keeps it local
function push(dir) {
  const to = upstream(dir);
  if(!to) { Log.info("No upstream, the commit stays local"); return; }
  git(dir, "push", "-q");
  Log.ok(`Pushed to ${to}`);
}

// one `tonka` command in a process of its own: `build` and `deploy` read their argv once
function tonka(args) {
  return spawnSync(process.execPath, [TONKA, ...args], { stdio: "inherit" }).status === 0;
}

// one app out: its commit when the line asks, `build`, `deploy -r`, then the push,
// so the remote gets only what went out
function ship({ app, args, message }) {
  const dir = path.resolve(ROOT, app);
  const committed = message ? commit(dir, message) : false;
  if(!tonka(["build", ...args])) throw new Error("build failed");
  if(!tonka(["deploy", ...args, "-r"])) throw new Error("deploy failed");
  if(committed) push(dir);
}

// what `ship` would run, for `--dry`
function show({ app, args, message }) {
  if(message) {
    Log.run(`git commit -m ${joinArgs([message])} ${c.grey}when ${app} changed${c.reset}`);
  }
  Log.run(`tonka build ${joinArgs(args)}`);
  Log.run(`tonka deploy ${joinArgs([...args, "-r"])}`);
  const to = message ? upstream(path.resolve(ROOT, app)) : null;
  if(to) Log.run(`git push ${c.grey}to ${to}, after a commit${c.reset}`);
}

function pipe() {
  const { file, dry } = options(process.argv.slice(2));
  const list = readList(file);
  if(!list.length) throw new Error(`${file} names no app`);
  const missing = list.map(({ app }) => app)
    .filter(app => !fs.existsSync(path.resolve(ROOT, app, "app.html")));
  if(missing.length) throw new Error(`Not a project: ${missing.join(", ")}`);
  Log.head(`Pipe ${c.grey}${file}${c.reset}`);
  if(dry) {
    for(const item of list) show(item);
    Log.warn("Dry run, nothing run.");
    return;
  }
  const shipped = [];
  for(const item of list) {
    Log.head(`${item.app} ${c.grey}${shipped.length + 1}/${list.length}${c.reset}`);
    try { ship(item); }
    catch(e) {
      const rest = list.slice(shipped.length + 1).map(({ app }) => app);
      throw new Error(`${item.app}: ${e.message}; `
        + `shipped: ${names(shipped)}, not run: ${names(rest)}`);
    }
    shipped.push(item.app);
  }
  Log.ok(`Shipped ${shipped.length}: ${names(shipped)}`);
}

try { pipe(); }
catch(e) {
  Log.err(e.message);
  process.exit(1);
}
