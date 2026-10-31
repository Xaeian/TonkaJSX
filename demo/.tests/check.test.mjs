// .tests/check.test.mjs
//
// `checkScripts` of the CLI on a project made up here, read as `build` reads it:
// `scripts/` without its dot folders, any case of `.js`, and the scripts the page's `<body>`
// loads. Its problems are names at the top level of two scripts, a script that would not
// build and one the page loads that is not there; a namespace and JSX beside them are none.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { checkScripts } from "../../check.js";

let pass = 0, fail = 0;

function ok(name, cond) {
  if(cond) pass++;
  else fail++;
  console.log(`  ${cond ? "ok  " : "FAIL"} ${name}`);
}

const FILES = {
  "app.html": `<body>
    <script type="text/babel" data-presets="tonka" src="app.jsx"></script>
    <script src="missing.js"></script>
  </body>`,
  "app.jsx": "const Shared = 1;",
  "scripts/store.js": `
    const Store = (() => {
      const secret = 1;
      return { get: () => secret };
    })();
    const Twice = 1, Shared = 2, Hidden = 3, Upper = 4;`,
  "scripts/views/View.jsx": `
    const Twice = 2;
    const View = () => <div title={Store.get()}><Panel /></div>;
    const Panel = () => <b />;`,
  "scripts/broken.jsx": "const Broken = <div>;",
  "scripts/.hidden/d.js": "const Hidden = 5;",
  "scripts/F.JS": "const Upper = 6;",
};

// what `checkScripts` finds in a project made of `files`, path -> text
function checkProject(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tonka-check-"));
  for(const [file, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), text);
  }
  const problems = checkScripts(dir);
  fs.rmSync(dir, { recursive: true, force: true });
  return problems;
}

const problems = checkProject(FILES);
const about = (name) => problems.some(problem => problem.startsWith(`${name}:`));

ok("a name at the top level of two scripts", about("Twice"));
ok("the page's own app.jsx counts", about("Shared"));
ok("so does a .JS in capitals", about("Upper"));
ok("a dot folder is no script, as for build", !about("Hidden"));
ok("a script that would not build, named by its path", about("scripts/broken.jsx"));
ok("a script the page loads that is not there", about("missing.js"));
ok("nothing else", problems.length === 5);

const lone = checkProject({
  "app.html": `<body><script src="./boot.jsx?v=2"></script></body>`,
  "boot.jsx": "const Boot = <div>;",
});
ok("a body script under any name, with no scripts/ beside it",
  lone?.length === 1 && lone[0].startsWith("boot.jsx:"));
ok("a project without scripts has nothing to check", checkProject({}) === null);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
