# JavaScript Style

The single authority for JavaScript and JSX in a TonkaJSX workspace:
every app, Tonka UI and the library served from `lib.tonkajsx.com`.
Read it before editing.

**Tonka UI** is the component kit: `ui/` holds it, its demo is the manual,
an app carries a copy as `scripts/ui` and `styles/ui`.
A rule that names the kit holds in an app built on it.
An app without the kit skips those rules and [Library first](#library-first).

One sentence holds the rest together:
**write the fewest lines and words that still carry the meaning,
and put every break where the meaning breaks.**

Three more, in the order they win when they collide:

- Readable and simple beats prose that is merely correct and code that is merely clever.
- Simple and readable beats fast.
- A file belongs to one layer and looks only down.

Every rule below is a default; the sentence above wins where they disagree.

Every code block below is an invented example.
The names are toys: `Widget`, `load`, `items`, `Api.things`, never a real component or route,
so nothing here can be mistaken for a call to copy.
Two sections are the exception, because there the rule *is* which name to reach for:
[Globals](#globals) and [Layers](#layers).

**Layout** · [Line and indent](#line-and-indent) · [Breaking lines](#breaking-lines) ·
[Wrapping code](#wrapping-code) · [Alignment](#alignment) · [Prose breaks](#prose-breaks) ·
[Punctuation](#punctuation) · [Separators](#separators)

**Writing code** · [Naming](#naming) · [Statements](#statements) · [Functions](#functions) ·
[Objects and returns](#objects-and-returns) · [JSX](#jsx) · [Prompts](#prompts) ·
[Comments](#comments) · [JSDoc](#jsdoc) · [Timeless](#timeless)

**Shaping a project** · [Files](#files) · [Globals](#globals) · [Layers](#layers) ·
[Library first](#library-first) · [No over-abstraction](#no-over-abstraction) ·
[Repeated state](#repeated-state) · [Public surface](#public-surface)

**Behaviour** · [Errors](#errors) · [Async](#async) · [State](#state) · [Config](#config) ·
[Proof](#proof)

---

# Layout

## Line and indent

- **99** characters max, **2** spaces indent, a continuation **+2** from its statement.
  Two things run past it: a line of a prompt, see [Prompts](#prompts),
  and a row of a data table, see [Breaking lines](#breaking-lines)
- LF, UTF-8 without BOM, no trailing whitespace, single blank lines only
- Double quotes in JS strings.
  Single quotes in a JSX attribute only when its value holds a double quote
- `if(`, `for(`, `while(`, `switch(`, `catch(`: no space before the parenthesis
- Semicolons always

## Breaking lines

**One line carries one piece of information.**
Sometimes that is a sentence, more often less:
a property, a condition, a call of a chain, a row of a table,
or a short run of attributes that together set one thing up.
A handler with a body, a long expression, a nested element is a piece of its own.
A diff then touches the line whose fact changed and no other line, which is what versioning wants.

The test that decides every break is the same:
**would a later change to one of these facts have to touch the other?**
If yes, they are two lines. If they only ever change together, they are one.
A break is a judgement about meaning, never a count of tokens:
neither everything on one line nor one attribute per line for its own sake.

```jsx
// NO: broken where the column ran out, a handler cut in half
const field = <Input basis="xl" size="sm" value={file.name} onEnter={commit} onKeyDown={(e) => {
  if(e.key === "Escape") cancel(); }} />;

// NO: one attribute per line for the sake of it, five lines for one piece of setup
const field = <Input
  basis="xl"
  size="sm"
  value={file.name}
  onEnter={commit}
  onKeyDown={(e) => { if(e.key === "Escape") cancel(); }} />;

// YES: the short attributes that make the field are one piece, the handler with a body its own
const field = <Input basis="xl" size="sm" value={file.name} onEnter={commit}
  onKeyDown={(e) => { if(e.key === "Escape") { e.preventDefault(); cancel(); } }} />;
```

The same for a condition, a chain and a wrapped call:

```js
const ready = state.loaded
  && !state.busy
  && items.length > 0;

const src = pattern
  .replace(/\s+/g, " ")
  .replace(/:(\w+)/g, "([^/]+)")
  .trim();

return http.put(path, body,
  { query: { zip: true }, headers: { "Content-Type": "application/zip" } });
```

One statement per line is the default, and a one-line guard is a statement.
A guard that does one thing on its way out keeps that thing on the line too:

```js
if(!items.length) return;
if(err) throw err;
if(note) { listEl.replaceChildren(note); return; }
if(activeRow === row) { row.selected = false; activeRow = null; return; }
```

A pair of declarations that are one piece of state may share a line, two unrelated ones do not:

```js
let qi = 0, streak = 0; // one walker, one state
const total = 0, name = ""; // NO: nothing ties them, each will change alone
```

A uniform table may pack, because there the row is the piece of information
and the columns are the point.
A row stays one line, its note included, even past 99:
a note moved above its row, or a row folded in two, breaks the one thing a table is for.

```js
const PATIENCE = {
  brief:  { slack: 1.5, max: 300 },
  normal: { slack: 2.5, max: 900 },
  long:   { slack: 5,   max: 3600 },
};

const SVG_TAGS = new Set([
  "svg", "path", "circle", "rect", "line",
  "g", "defs", "use", "symbol",
]);
```

Two statements share a line only inside such a run, where every row is one case:

```js
if(next === "n") { out.push("\n"); i += 2; continue; }
if(next === "r") { out.push("\r"); i += 2; continue; }
if(next === "t") { out.push("\t"); i += 2; continue; }
```

## Wrapping code

A continuation indents by 2 from the statement, and the break falls before the operator
that starts the next term: `&&`, `||`, `?`, `:`, `.`, `+`.
It never pads to the opening delimiter or to an operand:
that alignment moves every line when the first one is edited.

```js
// NO
const url = build(base, path,
                  query);
const element = isSvg ? document.createElementNS(SVG_NS, tag)
                      : document.createElement(tag);

// YES
const url = build(base, path,
  query);
const element = isSvg
  ? document.createElementNS(SVG_NS, tag)
  : document.createElement(tag);
```

A wrapped object or array keeps its opener on the line, closes on its own line at the indent
of the statement, and ends every entry with a comma.
Its entries group by what belongs together: one per line when each is a fact of its own,
several per line when they form one row, as in a table or the return object under
[Objects and returns](#objects-and-returns).

```js
const client = createClient({
  base: BASE,
  prefix: "widget",
  headers: { "Accept": "application/json" },
});
```

## Alignment

One space, never a column of them, with two exceptions:
a uniform table, where the columns are the point,
and a run of trailing comments on declarations, where the whole run shares one column.

**A trailing comment standing alone gets exactly one space before `//`.**
Three spaces on a lone comment is a column of one, which is padding.
A column is for a block: a run of lines whose comments share one column.
It holds through a neighbour without a comment and ends at a blank line or another block.

```js
// NO
const limit    = 1000;
const retries  = 3;
count = count + 1;    // per item
expect: 0,   // one word, so the floor is the whole budget

// YES
const limit = 1000;
const retries = 3;
count = count + 1; // per item
expect: 0, // one word, so the floor is the whole budget

const LATENCY = 20;   // s before a first token
const RATE = 15;      // tokens/s until a model has shown its own
const SAMPLE = 200;   // tokens under which a call measured waiting, not writing
```

A trailing comment that pushes the column out goes above the line instead, never wrapped
to the right.

## Prose breaks

**99 is a ceiling, not a wrapping rule.**
A comment or a JSDoc that spans lines breaks where the sentence pauses:
at a full stop, before a conjunction, after a clause, between items.
Never between an adjective and its noun, never inside a parenthetical,
never leaving one orphaned word on the next line.

```js
// NO: breaks fall wherever column 99 landed
// A token write lands under the lock, so it is not in place the moment setTokens() returns. A
// request waits on the last one rather than reading a cache about to change, which is what a
// caller who set a token and fired straight after would otherwise hit.

// YES: one thought per line, the break where the sentence breathes
// A token write lands under the lock, so it is not in place the moment `setTokens()` returns.
// A request waits on the last write rather than reading a cache about to change,
// which is what a caller who set a token and fired straight after would otherwise hit.
```

Often the fix is not re-wrapping but rewriting: split the run-on into two sentences,
or give a semicolon clause its own line.
A short line that finishes a thought beats a full one that cuts a phrase in half.
A line ending in `the`, `which`, `so`, `and` or `a` was broken by accident.

Read each line on its own after writing.
If it ends mid-phrase, move the break or rewrite.

## Punctuation

**Never** an em dash (U+2014), anywhere: comments, strings, help text, markdown.
Prefer a full sentence; otherwise a colon, a comma, parentheses or an ASCII hyphen.

Arrows in prose stay ASCII, `->`, and only where a mapping or a result is shown:
`=>` already means a function, and a source file carries no arrow it cannot type.

Value and unit are written without a space in text: `40Hz`, `10ms`, `256MiB`, `90%`.
In code the unit lives in the name (`timeout_ms`, `ttl_sec`) or in a trailing comment.

Code symbols in a comment wrap in backticks: `setTokens()`, `_busy`, `null`, `data-tooltip`.
Plain words stay plain.
Rule of thumb: if a reader could grep for it, backtick it.

Periods follow the shape of the text.
A one-line `//` note reads as a label and takes none.
Two or more sentences take one after each, the last included.
A JSDoc summary is a sentence and ends with one; a `@param` line is a label and does not.

## Separators

Exactly **99** characters, indent included: `//` + dashes + space + Name.
A nested one, inside an IIFE or an object, gives its indent out of the dashes and is still 99.

```js
//-------------------------------------------------------------------------------------------- Send
  //----------------------------------------------------------------------------------- Conversions
```

One file marks its sections one way.
A bare `// Label` line above a group does the job a separator already does,
and two mechanisms in one file leave the reader guessing which one means more.

---

# Writing code

## Naming

```
camelCase       variables, functions, methods, props, files of logic (`sync.js`)
PascalCase      components, classes, namespace objects, files of views (`Files.jsx`)
UPPER_CASE      constants and tables
_name           private: shared inside the kit or one library file, never used by an app
timeout_ms      unit suffix wherever the name can carry it
```

A boolean reads as a fact: `loaded`, `hasLocks`, `isRetry`, never `flag` or `check`.
A handler is `onX`, a factory `createX`, a mutator is a property set on an element
(`btn.loading = true`), a predicate says what is true (`missing(e)`, `locked(e)`).

A name says what a thing is, never what it was: no `new`, `old`, `v2`, `tmp`, `legacy`.

## Statements

```js
if(ready) { ... } // YES
if (ready) { ... }  // NO
```

- `const` by default, `let` when it changes, never `var`
- Braces on any body that spans more than one line; a one-line guard takes none
- `else`, `catch` and `finally` open on their own line, under the closing brace
- Early return over nesting: the happy path ends the function, it is not wrapped in an `if`
- `===` always; `== null` only as the one test for null-or-undefined
- `?.` and `??` where they read well; no bit tricks and no golf in app code
- `Object.hasOwn`, never `in`, on an object a caller filled

```js
function pick(items, key) {
  if(!items.length) return null;
  const hit = items.find(item => item.key === key);
  if(!hit) return null;
  return hit.value ?? null;
}

try { save(items); }
catch(e) { showError(e); }
```

## Functions

- `function` for anything named at file or factory scope; an arrow for a callback or a one-liner
- One thing per function; a name that needs "and" is two functions
- An options object, usually once there are more than three parameters,
  and whenever call sites keep passing the same ones together
- State lives in the closure next to the logic that owns it, not at the top of the file

```js
// NO: state far from its logic, a positional list nobody remembers
let running = false;
let phase = null;
let since = 0;
...
function send(text, model, temp, tokens, signal, expect) { ... }

// YES
function createSender(cfg) {
  let running = false; // the one call in flight, if any
  function send(text, { model, temp, signal }) { ... }
  return { send };
}
```

A component is a function that returns one element.
Its props are destructured with their defaults in the signature,
and whatever is left goes to the root element.

## Objects and returns

A factory returns its whole public surface as one object at the end,
names grouped by theme, one theme per line, trailing comma:

```js
  return {
    safeName, safeKey, missing,
    get, text, json, bytes,
    put, remove,
  };
```

Keys stay unquoted unless they must be quoted.
A reserved word takes a rename, `delete: remove`.
A namespace is one `const NAME = (() => { ... })()` or one object literal, never a spray
of loose globals that happen to share a prefix.

## JSX

- `class=`, never `className`
- A tag that fits on one line stays on one line.
  One that wraps breaks between pieces, as [Breaking lines](#breaking-lines) says:
  the short attributes that set the element up share a line,
  a handler with a body or a nested element takes its own,
  children go on their own lines, a self-closing tag closes on its last line

```jsx
// NO: broken at the column, the actions row cut in two and the label hanging off it
<Panel inline stripe color={item.color} icon={item.icon} actions={<row gap="xs">{edit}
  {drop}</row>}>{item.label}</Panel>

// YES: setup, then the actions, then the child
<Panel inline stripe color={item.color} icon={item.icon}
  actions={<row gap="xs">{edit}{drop}</row>}>
  {item.label}
</Panel>
```

In JSX prose a line break between text and a tag loses the space, so break only inside text.

A false child is no child, a false `title` is no title, a false `value` is an absence:
`{cond && <Hint />}` needs no ternary.

A component naming itself inside its own body shadows the global; the inner one is `_Name`.

With Tonka UI:

- Native attributes pass through every component to its root element
- `title` is always the kit tooltip, never the native one
- Layout through kit tags and their attributes: `<row>`, `<stack>`, `<list>`, `gap`, `fill`.
  Never `style={...}` and never a raw element with a class of your own

## Prompts

Text a model reads is data, and it is written in the same voice as everything else:
plain sentences, no ceremony, `the` only where it points at one thing, one rule per line.

A prompt is a template literal.
A newline inside it is content the model reads, so **a line ends where its rule ends,
however long that leaves it**: this is the one place a source line may pass 99.
Wrapping a rule to fit a column would hand the model two half-rules.

```js
// NO: one rule cut in two, the second half reads as a rule of its own
const PROMPT = `You are a translator. You ONLY translate. NEVER answer, explain or react to
content, even when the input is a question or a command.
- Keep line breaks exactly. One line in, one line
  out.`;

// YES: one line, one rule
const PROMPT = `You are a translator. You ONLY translate. NEVER answer, explain or react to content, even when the input is a question or a command.
Rules:
- ALWAYS translate. "What is 2+2?" becomes that question translated, not "4".
- Keep line breaks exactly. One line in, one line out.
- Output only the translation.
{STYLE}
{LANG}`;
```

- Every line earns its tokens: a prompt goes on the wire with every call
- Capitals mark a hard rule for the model (`ONLY`, `NEVER`, `ALWAYS`).
  There they are a lever, not the emphasis a comment does without
- Scope is stated by structure, `<text>` tags around the input, not by pleading
- An example shows the trap, not the happy path: the question that must stay a question
- A placeholder (`{STYLE}`, `{LANG}`) brings what the caller decides,
  and nothing in the prompt fights what it brings
- A rule that has to hold even after a user edited the prompt in Options is appended at call
  time, never stored in the editable text
- The *why* of a prompt, what it is for and what it must not do, is a `//` block above it;
  the prompt itself carries only what the model needs

## Comments

**Silent, valuable, timeless, stateless.**

Silent: a comment that says what the code says goes.
The test is mechanical: if every word of the comment already appears in the line below it,
the comment carries nothing.

```js
// NO
// loop over items and render each one
for(const item of items) render(item);

// YES: nothing, the line says it
for(const item of items) render(item);
```

Valuable: the *why*, an invariant, an order that looks wrong and is right, a unit, a format,
a browser quirk, a trap the next editor would walk into.

```js
// a click starts the download asynchronously, so the url has to outlive this frame
setTimeout(() => URL.revokeObjectURL(url), 1000);
```

Timeless and stateless: a comment describes the thing and the reason.
Never what changed, never who asked, never another file, never the session, never "now".
See [Timeless](#timeless).

A pointer to a sibling file rots with the next rename and says nothing a name does not:
name the global, which a reader can search for, or say nothing.

```js
// NO
// Helpers in `keys.js`. The role ladder itself is in `utils.js`.

// YES
// Data and wording come from `BUCKETS`.
```

No ceremony.
No "note that", "please", "simply", "obviously", "in order to".
No `the` that points at nothing; keep it where it points at one specific thing.

```js
// NO
// The function checks whether the token has expired before the request is sent to the server.

// YES
// an expired token never leaves: the server would only say so, more slowly
```

Placement follows reach.
A note about one line, fitting beside it, trails that line.
A note covering more than one line, or too long to trail, sits above the block.
Never both for one thought.

`/** */` on what a caller reads, `//` on what an editor reads.
Comments are in English, always.

## JSDoc

Every public function, factory and namespace member carries a `/** */` block.
It is what an editor shows on hover, so it is tight:
one summary sentence, what a caller must know, then only tags that add something.

A summary names what the call gives, a noun phrase where one exists:
`Bytes of whatever a caller holds.`, `Cross-tab change listener.`
Never `This function`, never `Returns`, never the name again.
Then a rule, a trap or an order a caller would otherwise learn the hard way,
in the voice of [Comments](#comments). How the body does it stays out.

```js
/**
 * One folder level, or the whole subtree under it with `recursive`.
 * @param {string} bucket
 * @param {object} [opts]
 * @param {string} [opts.dir]  subfolder, the bucket root by default
 * @param {boolean} [opts.recursive]
 * @returns {Promise<Array<{name:string, dir:boolean, size:number}>>}
 */
function list(bucket, opts = {}) { ... }
```

One shape: `/**` alone on its line, ` * ` opening every line under it, ` */` alone at the end.
A summary that fits one line is `/** One sentence. */`.
The block sits right above what it describes, nothing between.

```js
// NO: text behind the opener, lines padded to meet it, closer hanging off the last
/** Rows of the list: one per item, newest first,
    a picture shows itself and the rest wear a glyph. */
function rows(items) { ... }

// YES
/**
 * Rows of the list: one per item, newest first,
 * a picture shows itself and the rest wear a glyph.
 */
function rows(items) { ... }
```

- A type is TypeScript in braces: `{string|null}`, `{string[]}`, `{() => void}`,
  `{Promise<Uint8Array>}`; `{object}` when the next tags list its fields, `{*}` for anything
- A `@param` description is lower case, no period, and says what the name does not
- A `@param` that would only restate its name stays a bare `@param {type} name`
- `[name]` marks optional; a default lives in the signature, the tag repeats it only when
  it is a fact a caller needs (`the bucket root by default`)
- `@returns` when the summary leaves the shape open, described like a `@param`:
  `{string|null} decoded value, null when the cookie is absent`; never `Returns the result`
- A factory's `@returns {{ get, put, remove }}` names its surface,
  the one hover that shows all of it
- A shape used in more than one place earns a `@typedef`
- A throw a caller should expect is a sentence, `An unclosed quote throws.`, not a `@throws`
- An example, when a reader would otherwise use the thing wrong, sits in the block
  with two spaces of indent and `->` for what comes back

A private helper (`_name`, or anything not returned) takes a `//` line, not a block.
A note for an editor is a `//` in the body, never a second block.

## Timeless

Code describes what is, never what changed.
No note explaining an edit, no history in a name, no fallback for a state that no longer
exists, nothing that reveals which line was written today.

```js
// NO
const LIMIT = 45; // was 50, lowered after the timeout review
function loadV2(path) { ... }
const key = cache.get("token") || cache.get("access_token"); // legacy key

// YES
const LIMIT = 45;
function load(path) { ... }
const key = cache.get("access_token");
```

A counterfactual is fine when it explains why a line must stay
("mask it first, a pending event would fire otherwise").
A history of the repository is not.

A released major of the library is a clean start:
no shim reading the previous layout, no alias for a previous name.

---

# Shaping a project

## Files

The first line of every file is its path as a comment.
An app file names its path in the project, a library file the path it is served at,
a stylesheet likewise:

```js
// scripts/ui/Panel.jsx
// lib.tonkajsx.com/1.0.0/http.js
/* styles/ui/panel.css */
```

Then, when the file needs one, a `//` header saying what the file is and how its parts relate,
then the sections.

- One concern per file, split by responsibility and not by size:
  a view file holds one view, a domain file one domain, a client file one backend
- Scripts load as plain tags, deeper folders first, `.js` before `.jsx`, alphabetical inside;
  a helper many files use lives deeper or in a `.js`.
  `Name is not defined` means the file is missing or loads too late
- `index.html` is a build artifact and never a source; `{{key}}` is filled from `app.ini`
- The kit (`scripts/ui`, `styles/ui`) and any shared folder are vendored byte-identical
  in every app that carries them; a fix lands in one place and is copied, never patched in one app
- A stylesheet sits in one `@layer` and carries no comment beyond its path line

## Globals

There are no modules and no bundler: every top-level `const`, `function` and `class` is a
global for every file after it.
Four kinds exist, and an app defines none of the first three:

- `JSX.*`, the runtime
- `UI.*`, the kit glue: `UI.prop`, `UI.text`, `UI.title`, `UI.active`, `UI.loading`
- components and clients, PascalCase: `Panel`, `Crypt`, `CSV`, `createStash`
- `_name`, a helper shared between the files of the kit or of one library file,
  never reached for from an app

A `window.X = X` in app code is a load-order workaround of the person who wrote it,
not a bug in the component; the fix is the file's place, not the component.

## Layers

**Strong separation.** Dependencies point one way, and a file never reaches around a layer.

The library:

```
cache  ->  http  ->  fastapi | openrouter | github  ->  session, stash
jsx, files, string, crc, protobuf, crypt, fuzzy, store, router: each stands alone
```

A library file knows nothing of any app, of the kit, or of a sibling's privates.
Anything it needs from another file is that file's public surface.

The kit knows the runtime and itself: never an app, never a server, never a route.

An app:

```
api.js        clients: the only place a URL, a token or a fetch lives
state.js      settings and their defaults, persisted, read everywhere
<domain>.js   logic and data: computes, validates, keeps; no DOM, no fetch of its own
<View>.jsx    DOM: builds, wires events, calls the domain; never fetches, never parses
App.jsx       shell: mounts views and routes between them, nothing else
```

A view never calls `fetch`.
A domain module never touches `document`.
A client never formats for a screen.
When one piece would need two of these, it is two pieces.

Words for a human are made where the error is understood, in the domain,
and shown where the human is, in the view.

What two apps share is one folder copied byte-identical (`scripts/ui`, `scripts/admin`)
or a library file.
Never a third half-copy.

## Library first

For an app on Tonka UI; without the kit this section does not apply.

Before CSS, before `classList`, before any DOM trick, search the kit:
a mutator (`.active`, `.state`, `.loading`, `.hidden`), a layout attribute, a component.
Missing? Add it to the kit as a universal piece, or stop and ask.
A tag is added for a family of uses, never for one app.

Never in app code:

- `style={...}`: it is a missing layout attribute
- `classList` where a mutator exists
- `querySelector`: a ref is a closure, a forward ref a `let` filled in later
- `appendChild` after render to add an action: `actions={...}` with a forward ref
- a class name with no rule in `styles/`
- custom HTML or CSS for what the kit has

## No over-abstraction

Two or three explicit items stay explicit.
Explicit beats clever, most of all when the items differ a little.

```js
// YES: each key visibly gets its own default
if(!State.has("model")) State.set("model", DEFAULT_MODEL);
if(!State.has("patience")) State.set("patience", "normal");
if(!State.has("prompts")) State.set("prompts", clone(PROMPTS));

// NO: the loop hides that one of them needs a copy
for(const [key, value] of Object.entries(DEFAULTS)) {
  if(!State.has(key)) State.set(key, value);
}
```

The rule runs both ways: a pattern written three times earns a helper.

```js
// the keys of `src` a route takes, as a query; `undefined` means leave it out
function pickQuery(src, keys) {
  const query = {};
  for(const k of keys) {
    if(src[k] !== undefined) query[k] = src[k];
  }
  return query;
}
```

Duplicated logic that can drift is a defect in itself.
Call the existing function rather than writing it again, even when the shared path is slower.
A helper shared by two files lives where both can see it, or it is not shared.

Simple beats fast.
A loop that reads at a glance beats a `reduce` that needs a comment;
a second pass over an array beats an index juggle.
Optimize when a measurement says so, and say where in a comment.

## Repeated state

A state change touching several controls lives in one place, never copied into every handler.

```js
// YES: one place to change
function setRunning(on, phase) {
  running = on;
  sendBtn.loading = on;
  cancelBtn.hidden = !on;
  drop.loading = on;
  status.textContent = on ? phase : "";
}

// NO: the same four lines in three handlers
sendBtn.loading = true;
cancelBtn.hidden = false;
drop.loading = true;
```

The same for a compound answer: one function decides what a run needs
(`budget(cfg, model, chars)` gives both the estimate and the limit),
and every caller reads the same decision.

## Public surface

- A library file's public API is the return object of its factory and the names its header
  and `list.txt` describe. `_name` is never public
- Released is frozen: `1.0.0/` stays what it is.
  A rename, a dropped name or a changed shape is a new version folder;
  the loose files beside the folders are the newest release,
  and differ from it in the first line only
- Every app loads the loose path unless it pins a version on purpose
- A new major is a fresh start: nothing reads a previous layout,
  nothing answers to a previous name

---

# Behaviour

## Errors

**Throw** when the call cannot go on.
The message names the module and says what to do, in words a caller can show:

```js
throw new TypeError("Stash: a folder is made with makeDir");
throw new Error("Protobuf: string field is not valid UTF-8");
```

**`null`** for a lookup miss; the caller decides.

**`ApiError`** for anything a server refused: `status`, `body`, and a `message` short enough
for a control.
A `detail` carries the rest for a log or an alert.

**Silence** only where silence is the point, and the comment says why:

```js
// best effort: a copy nobody can make is not a failed save
backup: (name) => S.copy(BUCKET, `${name}.bak`, name).catch(() => null),
```

An app maps codes to words once, `ERROR_MSG[e.code] || e.message`, and a view shows
`e.message`; it never parses a body.
`catch {}` without a comment is a defect.

## Async

- Always `await`. A promise nobody awaits is a bug unless a comment says fire-and-forget and why
- A long call takes a `signal` and a `timeout`, and the view shows what it waits for
- A flow that can be overtaken carries a generation, `if(gen !== _gen) return`,
  and drops a stale answer instead of writing it
- A write resolves when it is committed, not when it was accepted

## State

- On the element, through mutators: `row.selected = true`, `btn.loading = true`
- A list re-renders from its array: `list.replaceChildren(...items.map(row))`
- A ref is a closure; a forward ref is a `let`
- Settings live in `State`, with their defaults in one place, and `State.fallback(key)`
  is where a reset reads from
- No mutable singleton beyond a namespace's own closure

## Config

Every tunable is a named constant with a unit in its name or its comment,
or a key in `app.ini` filled through `{{key}}`.
A default lives in one place; a value repeated in a signature is a second source of truth.
A value compared against internal data carries the same scale as that data.

## Proof

A change is proven by running, not by reading:
a vm suite for a library file, a headless page for a view, a sandbox request for a client.
The report says what ran and the numbers it gave.
A test older than the code is brought up to the code, never silenced.
