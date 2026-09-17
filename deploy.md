# 🚀 Deploy

`tonka deploy` takes a built `index.html` and puts it where it runs.
It never builds and never touches git, so `tonka build` comes first.

```sh
tonka deploy [<project-name>] [--worker|-w <key>] [--dry] [--remove|-r]
```

## Targets

Project's `app.ini` names targets in `[deploy]`, one per key.
A value is a Cloudflare Worker name or a folder on this machine.

```ini
[deploy]
main = editest
alfa = editest-alfa
include = images
```

- `main` is the default, any other key is picked with `-w alfa`
- a section with one key needs no `-w`, whatever the key is called
- `include` names folders copied whole, see [What goes in](#what-goes-in)

`tonka -h` lists projects with their targets: `editest (editest, alfa:editest-alfa)`.

### Worker

A Worker name goes to Cloudflare as static assets.
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

### Folder

A value with a path separator is a folder, and files are copied there instead.
Nothing is deleted: a file with the same name is replaced, the rest of folder stays.
Project's `readme.md` goes along when it exists, because a folder is opened by people too.

```ini
[deploy]
copy = D:/www/app
```

## What goes in

Deploy reads addresses out of `index.html` and takes every one that is a file in project: `href="favicon.ico"`, `url(fonts/inter.woff2)`, `"logo.svg"` inside a script.
Remote and `data:` addresses name no file here, so they are skipped.
After `build -f` and `-s` fonts and SVGs sit inline, and nothing is left to copy.

A path built at runtime, like `"img/" + name + ".png"`, is invisible to it.
Put that folder in `include`.

## Dry run and cleanup

`--dry` prints every file with its size and the target, then stops.
For a Worker it also shows the wrangler command it would run.

`-r` deletes `index.html` once the page is out, the way `serve -r` deletes it before serving.
The folder is back to the app you edit, and nothing stale waits for the next `serve`.

```
+ index.html 274.1kB
+ xaeian.svg 1.2kB
✔ 2 files, 275.3kB -> Worker noti (main)
```
