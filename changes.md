## Changes 🌰TonkaJSX

### `1.2.3` Deploy:

- `deploy` puts built page on a Cloudflare Worker _(`[deploy]` in `app.ini`)_
- `build` runs Babel on JSX only

### `1.2.2` Limits + libs:

- `-i` `-f` `-s` take a size _(`-f 800kB`)_
- Remote libs [lib.tonkajsx.com](https://lib.tonkajsx.com/list.html)

### `1.2.1` TonkaUI + font lookup:

- `ui` demo project: TonkaUI component kit
- `-f` takes a face from any folder, else from its `@font-face` url

### `1.2.0` Babel 8 compatibility:

- `tonka` preset _(classic runtime + `JSX.*` pragma)_ instead of `@jsx` comments
- `jsx.js`: SVG namespace, `onMount` disposer, safer `on*` and boolean props
- deps and `@babel/standalone` bumped to 8, browser tests in `.tests`

### `1.1.2` Built-in vars + remove flag:

- `{{date}}` and `{{time}}` available in serve and build
- `app.ini` values may reference other vars, e.g. `foot = Build {{date}}`
- `serve -r` / `--remove` deletes built `index.html` _(serve the app you're editing)_

### `1.1.1` Version flag + folder guard:

- `-v` / `--version` command
- `serve` / `build` fail on missing folder/project

### `1.1.0` Build optimization flags:

- `-f` font filter + inline base64 _(unused `@font-face` dropped)_
- `-s` SVG inline via SVGO
- `-c` gzip + brotli pre-compression
- `-t "Name"` / `-l "Name"` font subsetting _(text / ligature)_

### `1.0.0` Stable version

Lightweight **JSX** framework for small sites, prototypes, and internal tools. No modules, no bundler, just scripts in the browser.

- `tonka serve`: dev server with auto-injection of scripts and styles
- `tonka build`: single-file production build `index.html`
- JSX components without imports: global, composable, debuggable
- `app.ini` variable substitution `{{key}}` in dev and build