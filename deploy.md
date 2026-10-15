# 🚀 Deploy

`tonka deploy` takes a built `index.html` and puts it where it runs.
It never builds and never touches git, so `tonka build` comes first.

```sh
tonka deploy [<project-name>] [--worker|-w <key>] [--dry] [--remove|-r]
```

## Targets

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

### Worker

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

### Folder

Files are copied into `folder` instead.
A relative path starts from project folder.
Folder has to exist, so a path gone stale stops deploy instead of making a new folder.
Nothing is deleted: a file with the same name is replaced, the rest of folder stays.
Project's `readme.md` goes along when it exists, because a folder is opened by people too.

```ini
[deploy]
folder = D:/www/app
```

## What goes in

Deploy reads addresses out of `index.html` and takes every one that is a file in project: `href="favicon.ico"`, `url(fonts/inter.woff2)`, `<img src="logo.svg">` in JSX.
Remote and `data:` addresses name no file here, so they are skipped.
After `build -f` and `-s` fonts and SVGs sit inline, and nothing is left to copy.

A path built at runtime, like `"img/" + name + ".png"`, is invisible to it.
Put it in `include`: a file as it is, a folder with everything under it.
An entry that matches no file is reported.

## Dry run and cleanup

`--dry` prints every file with its size and the target, then stops.
For a Worker it also shows the wrangler command it would run.

`-r` deletes `index.html` once the page is out, the way `serve -r` deletes it before serving, and the `.gz` and `.br` that `build -c` put beside it.
The folder is back to the app you edit, and nothing stale waits for the next `serve`.

```
+ index.html 274.1kB
+ logo.svg 1.2kB
✔ 2 files, 275.3kB → Worker shop
```
