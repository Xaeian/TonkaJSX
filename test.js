// test.js
//
// Tests a project: its scripts read as `build` reads them, then its suites,
// each in a process of its own, its exit code the verdict.
// A suite is a `*.test.js`, `*.test.cjs` or `*.test.mjs` right in the project's `.tests/`;
// whatever else lies there belongs to the suites.
// Each step gets one line with its time, and a failed one what went wrong below it.
// Unnamed, the run takes every project.
//
//   tonka test [<project>]

import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { ROOT, Log, getBasePath, listProjects, COLOR as c } from "./utils.js";

const LIMIT_ms = 600000; // a hang, not a slow suite

const seconds = (ms) => `${(ms / 1000).toFixed(1)}s`;

// the projects to test: the one named, else all; `test` takes no options
function projects(args) {
  const flag = args.find(arg => arg.startsWith("-"));
  if(flag) throw new Error(`${flag} is no test option`);
  return args.length ? [getBasePath()] : listProjects().map(name => path.join(ROOT, name));
}

// the suites of a project, by name
function suites(dir) {
  const tests = path.join(dir, ".tests");
  if(!fs.existsSync(tests)) return [];
  return fs.readdirSync(tests)
    .filter(name => /\.test\.[cm]?js$/.test(name))
    .sort()
    .map(name => path.join(tests, name));
}

// why a suite failed, `null` when it passed
function failure(run) {
  if(run.error?.code === "ETIMEDOUT") return `cut after ${seconds(LIMIT_ms)}`;
  if(run.error) return run.error.message;
  if(run.signal) return `killed by ${run.signal}`;
  return run.status ? `exit code ${run.status}` : null;
}

// a step's line with its time, `why` it failed after it and `output` below; `true` on a pass
function report(name, start, why, output) {
  const line = `${name} ${c.grey}${seconds(Date.now() - start)}${c.reset}`;
  if(!why) { Log.ok(line); return true; }
  Log.err(`${line} ${why}`);
  if(output) console.log(output);
  return false;
}

// the line of the project's scripts, read as `build` reads them
function reportCheck(problems, start) {
  const why = problems.length ? `${problems.length} to fix` : null;
  return report("scripts", start, why, problems.map(problem => `  ${problem}`).join("\n"));
}

// one suite, run inside its project
function runSuite(file, dir) {
  const start = Date.now();
  const run = spawnSync(process.execPath, [file],
    { cwd: dir, encoding: "utf8", timeout: LIMIT_ms, maxBuffer: Infinity });
  const output = `${run.stdout || ""}${run.stderr || ""}`.trimEnd();
  return report(path.basename(file), start, failure(run), output);
}

// every step of the projects; `1` when one failed
async function test() {
  // loaded here, so a missing Babel says what to install, as `build` does, and not a stack
  const { checkScripts } = await import("./check.js");
  const start = Date.now();
  let total = 0, failed = 0;
  for(const dir of projects(process.argv.slice(2))) {
    const checkStart = Date.now();
    const problems = checkScripts(dir);
    const files = suites(dir);
    if(!problems && !files.length) continue;
    Log.head(path.basename(dir));
    const results = [];
    if(problems) results.push(reportCheck(problems, checkStart));
    for(const file of files) results.push(runSuite(file, dir));
    total += results.length;
    failed += results.filter(passed => !passed).length;
  }
  if(!total) { Log.warn("Nothing to test: no scripts and no .tests/<name>.test.js"); return 0; }
  const time = `${c.grey}in ${seconds(Date.now() - start)}${c.reset}`;
  if(failed) { Log.err(`${failed} of ${total} failed ${time}`); return 1; }
  Log.ok(`All ${total} passed ${time}`);
  return 0;
}

try { process.exit(await test()); }
catch(e) {
  Log.err(e.message);
  process.exit(1);
}
