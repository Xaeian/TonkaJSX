# 🤖 LLM brief

Written for a language model working in this workspace.
Kept short on purpose, humans can read it too.

**Scope** is one project folder, one named.

**Components** are global functions returning real DOM.
No imports, no modules, no bundler, no virtual DOM, no hooks.

**State** lives on the element and changes through mutators, `btn.loading = true`.
Lists re-render from data, `list.replaceChildren(...items.map(row))`.
Refs are closures, a forward reference is a `let` filled in later.

**Files** load from `scripts/` and `styles/`, deeper folders first, `.js` before `.jsx`.
`Name is not defined` means the file is missing or loads too late.

**Traps.**
`class=` not `className`.
A component naming itself inside its own body shadows the global, rename the inner one to `_Name`.
`index.html` is a build artifact, never a source file.
`{{key}}` is replaced from `app.ini`.
