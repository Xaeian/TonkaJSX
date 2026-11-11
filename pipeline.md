# 📦 Pipeline

From project to running page: `test` checks it, `build` packs it, `deploy` puts it where it runs.
`pipe` runs all three for every app of a list, and GitHub runs `test` on every push.

## Test

`tonka test` checks a project's scripts, then runs its suites.
Unnamed, it takes every project.

```sh
tonka test [<project-name>]
```

```
✦ shop
✔ scripts 0.3s
✔ cart.test.mjs 0.4s
✔ All 2 passed in 0.9s
```

### Scripts

Scripts are read as `build` reads them: those under `scripts/` and those the page's `<body>` loads beside them.
Each goes through the JSX transform, so a syntax error, or a script the page loads but the project lacks, shows here.
No name may stand at the top level of two scripts: they share one global scope, where a second `const` stops its file and a second `function` silently replaces the first.

### Suites

A suite is a `*.test.js`, `*.test.cjs` or `*.test.mjs` right in project's `.tests/`.
Anything else there belongs to the suites, such as a shared harness or fixtures.
Each suite runs in a process of its own, inside the project folder, and its exit code is the verdict.
A failed one prints its output below its line, a passing one stays one line.
A suite still running after 10 minutes is cut as a hang.

## Deploy

`tonka deploy` takes a built `index.html` and puts it where it runs.
It never builds and never touches git, so `tonka build` comes first.

```sh
tonka deploy [<project-name>] [--worker|-w <key>] [--dry] [--remove|-r]
```

### Targets

Project's `app.ini` names its default target in `[deploy]`, by kind: `worker` is a Cloudflare Worker, `folder` a folder on this machine.
More Workers stand in `[worker]`, one per key.

```ini
[deploy]
worker = shop
include = images
[worker]
test = shop-test
```

- `[deploy]` target needs no flag, `-w test` goes to `shop-test` instead
- `[deploy]` takes `worker` or `folder`, never both, and `include`; any other key stops deploy
- `include` names files and folders that go along, see [What goes in](#what-goes-in)

`tonka -h` lists projects with their targets: `shop (shop, test:shop-test)`.

#### Worker

Page goes to Cloudflare as static assets of the Worker, named with `a-z`, `0-9` and `-` only.
One page answers every path, the way `serve` does it.

Wrangler needs `CLOUDFLARE_ACCOUNT` and `CLOUDFLARE_TOKEN`, from the environment or from `.env` in workspace root.
`.env` is one `NAME=value` per line and git ignores it.

```
CLOUDFLARE_ACCOUNT=32 hex characters
CLOUDFLARE_TOKEN=40 characters
```

Account ID sits in dashboard URL right after `dash.cloudflare.com/`.
Token comes from _My Profile → API Tokens_, template **Edit Cloudflare Workers**, and is shown once.
The S3 keys printed beside it belong to R2 and do nothing here.

#### Folder

Files are copied into `folder` instead.
A relative path starts from project folder.
Folder has to exist, so a path gone stale stops deploy instead of making a new folder.
Nothing is deleted: a file with the same name is replaced, the rest of folder stays.
Project's `readme.md` goes along when it exists, because a folder is opened by people too.

```ini
[deploy]
folder = D:/www/app
```

### What goes in

Deploy reads addresses out of `index.html` and takes every one that is a file in project: `href="favicon.ico"`, `url(fonts/inter.woff2)`, `<img src="logo.svg">` in JSX.
Remote and `data:` addresses name no file here, so they are skipped.
After `build -f` and `-s` fonts and SVGs sit inline, and nothing is left to copy.

A path built at runtime, like `"img/" + name + ".png"`, is invisible to it.
Put it in `include`: a file as it is, a folder with everything under it.
An entry that matches no file is reported.

### Dry run and cleanup

`--dry` prints every file with its size and the target, then stops.
For a Worker it also shows the wrangler command it would run.

`-r` deletes `index.html` once the page is out, the way `serve -r` deletes it before serving, and the `.gz` and `.br` that `build -c` put beside it.
The folder is back to the app you edit, and nothing stale waits for the next `serve`.

```
+ index.html 274.1kB
+ logo.svg 1.2kB
✔ 2 files, 275.3kB → Worker shop
```

## Pipe

`tonka pipe` ships many apps in one go: each gets `tonka test`, then `build` with its flags, then `deploy -r`.
The list is a text file in workspace, `pipe.txt` unless named, one app per line with its build flags; a line starting with `#` is a comment.

```
shop -f -s
blog -m "Update libs"
docs
```

```sh
tonka pipe       # every app of pipe.txt
tonka pipe all   # every app of all.txt
tonka pipe --dry # show the commands, run nothing
```

`-m` in a line commits what changed in that app before its build, and pushes the commit once the page is out.
App with no change commits nothing, and a branch with no upstream keeps the commit local.
A line goes to `deploy` too, so `-w test` works there.
Every line is checked before the first app goes, and the first failure stops the run, a red test as much as a failed build.

## GitHub

An app repository runs its tests on every push with `.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    uses: Xaeian/TonkaJSX/.github/workflows/app.yml@main
```

The run puts the app in a fresh TonkaJSX workspace on Windows with Edge, as on a developer's computer, installs with `npm ci` and calls `tonka test` on it, within 30 minutes.
The library the tests read from `.r2/scripts` comes from lib.tonkajsx.com, every file its `list.txt` names.
`@main` is the TonkaJSX a developer has: today's, not a pinned release.
Only what the repository and the library hold is there: a suite that needs another file skips itself with exit code 0.
