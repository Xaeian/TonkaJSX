// .tests/markdown.test.cjs
//
// `scripts/ui/Markdown.jsx` in its two passes, over the library's real `jsx.js`,
// the kit's `ui.js`, `kind.js` and `syntax.js`, and its own `Checkbox` and `Code`,
// compiled by Babel as `tonka build` compiles them.
// `_mdParse` gives plain blocks: headings, lists and their numbers, tables, quotes in quotes,
// fences, rules and hard breaks.
// `_mdRender` draws them onto a stand-in document: links, code spans, pictures,
// aligned columns and painted fences; `Markdown` ticks a task box back into its text.

const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const APP = path.join(__dirname, "..");
const LIB = path.join(APP, "..", ".r2", "scripts");
const KIT = path.join(APP, "scripts", "ui");

let pass = 0, fail = 0;

function ok(name, cond) {
  if(cond) pass++;
  else fail++;
  console.log(`  ${cond ? "ok  " : "FAIL"} ${name}`);
}

const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

//---------------------------------------------------------------------------------------- Document

// Just enough of a document for `JSX.createElement`:
// elements with attributes, children and listeners, text and fragments.
// Markup set as `innerHTML` stays the string it came as.
class FakeNode {
  constructor(nodeType, nodeName) {
    this.nodeType = nodeType;
    this.nodeName = nodeName;
    this.childNodes = [];
    this.parentNode = null;
  }
  appendChild(child) {
    if(child.nodeType === 11) {
      [...child.childNodes].forEach(c => this.appendChild(c));
      return child;
    }
    child.parentNode?.removeChild(child);
    child.parentNode = this;
    this.childNodes.push(child);
    return child;
  }
  removeChild(child) {
    this.childNodes.splice(this.childNodes.indexOf(child), 1);
    child.parentNode = null;
    return child;
  }
  append(...kids) {
    for(const kid of kids) this.appendChild(typeof kid === "string" ? new FakeText(kid) : kid);
  }
  replaceChildren(...kids) {
    [...this.childNodes].forEach(c => this.removeChild(c));
    this.append(...kids);
  }
  get textContent() { return this.childNodes.map(c => c.textContent).join(""); }
  set textContent(v) { this.replaceChildren(String(v ?? "")); }
}

class FakeText extends FakeNode {
  constructor(data) {
    super(3, "#text");
    this.data = data;
  }
  get textContent() { return this.data; }
}

class FakeElement extends FakeNode {
  constructor(tag) {
    super(1, tag.toUpperCase());
    this.attrs = new Map();
    this.listeners = {};
    this.markup = null;
    this.style = { setProperty(name, value) { this[name] = value; } };
  }
  setAttribute(name, value) { this.attrs.set(name, String(value)); }
  getAttribute(name) { return this.attrs.has(name) ? this.attrs.get(name) : null; }
  hasAttribute(name) { return this.attrs.has(name); }
  removeAttribute(name) { this.attrs.delete(name); }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  dispatch(type) { for(const fn of this.listeners[type] || []) fn({ type, target: this }); }
  set innerHTML(v) { this.replaceChildren(); this.markup = v; }
  get innerHTML() { return this.markup ?? this.childNodes.map(html).join(""); }
}

const document = {
  createElement: (tag) => new FakeElement(tag),
  createElementNS: (ns, tag) => new FakeElement(tag),
  createTextNode: (text) => new FakeText(text),
  createDocumentFragment: () => new FakeNode(11, "#document-fragment"),
};

// a tree as markup, attributes in the order they were set
function html(node) {
  if(node.nodeType === 3) return node.data;
  const tag = node.nodeName.toLowerCase();
  const attrs = [...node.attrs].map(([k, v]) => v === "" ? ` ${k}` : ` ${k}="${v}"`).join("");
  return `<${tag}${attrs}>${node.innerHTML}</${tag}>`;
}

// every element under `node` that `test` takes, in document order
function all(node, test, out = []) {
  for(const child of node.childNodes) {
    if(child.nodeType === 1 && test(child)) out.push(child);
    all(child, test, out);
  }
  return out;
}

const tags = (node, name) => all(node, el => el.nodeName === name.toUpperCase());

// plain data: what JSON keeps, with no node and no function anywhere in it
function plain(v) {
  if(v === null || ["string", "number", "boolean"].includes(typeof v)) return true;
  if(Array.isArray(v)) return v.every(plain);
  return typeof v === "object" && !(v instanceof FakeNode) && Object.values(v).every(plain);
}

//--------------------------------------------------------------------------------------------- Kit

(async () => {
  const esm = (mod) => mod.default || mod;
  const babel = esm(await import("@babel/core"));
  const jsx = esm(await import("@babel/plugin-transform-react-jsx"));
  const compile = (file) => babel.transformSync(readFileSync(file, "utf8"), {
    babelrc: false, configFile: false, sourceType: "unambiguous", comments: false,
    plugins: [[jsx, {
      runtime: "classic", pragma: "JSX.createElement", pragmaFrag: "JSX.Fragment",
      throwIfNamespace: false,
    }]],
  }).code;

  const ctx = vm.createContext({ document, console });
  const load = (file, code = readFileSync(file, "utf8")) =>
    vm.runInContext(code, ctx, { filename: file });
  load(path.join(LIB, "jsx.js"));
  for(const file of ["ui.js", "kind.js", "syntax.js"]) load(path.join(KIT, file));
  for(const file of ["Checkbox.jsx", "Code.jsx", "Markdown.jsx"]) {
    load(path.join(KIT, file), compile(path.join(KIT, file)));
  }
  const run = (code) => vm.runInContext(code, ctx);
  const parse = (text) => run("_mdParse")(text.split("\n"), 0);
  const Markdown = run("Markdown");

  // the blocks of `text` drawn into a box, a picture's address as written unless `opts` say
  function render(text, opts = {}) {
    const box = document.createElement("div");
    box.append(...run("_mdRender")(parse(text), { image: (s) => s, ...opts }));
    return box;
  }

  //---------------------------------------------------------------------------------------- Blocks

  const heads = parse("# One\n## Two ##\n###### Six\n####### seven");
  ok("headings: level and text, closing hashes dropped",
    eq(heads.slice(0, 3).map(b => [b.type, b.level, b.text]),
      [["heading", 1, "One"], ["heading", 2, "Two"], ["heading", 6, "Six"]]));
  ok("seven hashes are a paragraph", heads[3].type === "para");

  const [list] = parse("3. three\n4. four\n   - inner\n     1. deep\n5. five");
  const inner = list.items[1].lists[0];
  const deep = inner.items[0].lists[0];
  ok("an ordered list counts on from its first number",
    list.type === "list" && list.ordered && list.start === 3 && list.items.length === 3);
  ok("a deeper item opens a list inside the item above it",
    !inner.ordered
    && inner.items[0].lines[0].text === "inner"
    && list.items[2].lines[0].text === "five");
  ok("a list starting at 1 says no start, and a line keeps its number",
    deep.ordered
    && deep.start === null
    && eq(deep.items[0].lines[0], { text: "deep", at: 3, hard: false }));
  const [carried] = parse("- a\n  carried on\n- b");
  ok("an indented line carries its item on",
    eq(carried.items.map(item => item.lines.map(line => line.text)),
      [["a", "carried on"], ["b"]]));

  const [table] = parse("| a | b | c |\n|:--|:-:|--:|\n| 1 | 2 | 3 |\n| 4 |\n\nafter");
  ok("a table: its head and how each column aligns",
    eq(table.head, ["a", "b", "c"]) && eq(table.align, [null, "center", "right"]));
  ok("a short row is padded to the head", eq(table.rows, [["1", "2", "3"], ["4", "", ""]]));
  ok("a pipe line without its rule line is a paragraph", parse("a | b\nc | d")[0].type === "para");

  const [quote] = parse("> outer\n> > inner\n> > - item");
  const nested = quote.blocks[1];
  ok("a quote holds blocks, a quote among them",
    eq(quote.blocks.map(b => b.type), ["para", "quote"])
    && eq(nested.blocks.map(b => b.type), ["para", "list"]));
  ok("a line in a quote in a quote keeps its number in the text",
    nested.blocks[1].items[0].lines[0].at === 2);

  const fences = parse("```js\nconst a = 1;\n```\n~~~~\n```\nstill code\n~~~~\n```\nto the end");
  ok("fences: the language and the lines between",
    eq(fences[0], { type: "code", lang: "js", text: "const a = 1;" }));
  ok("a fence closes only on its own kind, as long or longer",
    eq(fences[1], { type: "code", lang: "", text: "```\nstill code" }));
  ok("a fence left open runs to the end",
    eq(fences[2], { type: "code", lang: "", text: "to the end" }));

  ok("rules of dashes, stars and underscores, spaced or not, a dashed item too",
    parse("---\n* * *\n___\n- - -").every(b => b.type === "rule"));
  ok("two dashes are no rule", parse("--")[0].type === "para");

  const opened = parse("text\n# Head\nmore\n> quote");
  ok("a line opening a block ends the paragraph before it",
    eq(opened.map(b => b.type), ["para", "heading", "para", "quote"]));

  const [hard] = parse("one  \ntwo\\\nthree\nfour");
  ok("hard breaks: two spaces or a backslash, which is dropped",
    eq(hard.lines.map(line => [line.text, line.hard]),
      [["one", true], ["two", true], ["three", false], ["four", false]]));

  const page = parse("# H\n\n- [ ] a\n\n| x |\n|---|\n| 1 |\n\n> q\n\n```\nc\n```\n\n---\n\np");
  ok("the parse is plain data", plain(page) && page.length === 7);

  //------------------------------------------------------------------------------------------ Page

  const broken = tags(render("one  \ntwo\\\nthree\nfour"), "p")[0];
  ok("hard breaks drawn, the other lines joined by a space",
    broken.innerHTML === "one<br></br>two<br></br>three four");
  ok("with `breaks` every line breaks",
    tags(render("one\ntwo", { breaks: true }), "p")[0].innerHTML === "one<br></br>two");

  const spans = render("see `[a](b)` here, \\[c](d) too, and [e](f)");
  ok("a code span holding a link is code, not a link",
    tags(spans, "code").map(el => el.textContent).join() === "[a](b)");
  ok("an escaped bracket opens no link, the link after it does",
    spans.textContent.includes("[c](d) too")
    && tags(spans, "a").length === 1
    && tags(spans, "a")[0].getAttribute("href") === "f");
  const crossed = render("[not a `link](/foo`) but [`code`](/bar) is");
  ok("a code span closing past a label's end leaves no link, one inside a label stays in it",
    tags(crossed, "code")[0]?.textContent === "link](/foo"
    && tags(crossed, "a").length === 1
    && tags(tags(crossed, "a")[0], "code")[0]?.textContent === "code");
  const open = render("[x [a](b)");
  ok("a bracket left open before a link is text",
    open.textContent === "[x a" && tags(open, "a")[0]?.getAttribute("href") === "b");

  const nest = render("[see https://x.io and **this**](https://y.io) or <https://z.io>");
  const [label, address] = tags(nest, "a");
  ok("an address inside a label stays text: no link in a link",
    tags(nest, "a").length === 2
    && tags(label, "a").length === 0
    && label.getAttribute("href") === "https://y.io"
    && label.textContent === "see https://x.io and this");
  ok("marks inside a label live", tags(label, "strong")[0]?.textContent === "this");
  ok("an address in angle brackets is a link to itself",
    address.getAttribute("href") === "https://z.io" && address.textContent === "https://z.io");

  const [picture] = tags(render("![a cat](cat.png)", { image: (src) => `/files/${src}` }), "img");
  // a picture takes its address once `image` has answered, which may be a promise
  await new Promise(resolve => setTimeout(resolve, 0));
  ok("a picture's address comes from `image`, its alt from the text",
    picture?.src === "/files/cat.png" && picture.getAttribute("alt") === "a cat");

  const aligned = render("| a | b | c |\n|:--|:-:|--:|\n| 1 | 2 | 3 |");
  ok("a column aligns its head and its cells",
    eq(tags(aligned, "th").map(el => el.getAttribute("text")), [null, "center", "right"])
    && eq(tags(aligned, "td").map(el => el.getAttribute("text")), [null, "center", "right"]));

  const fence = tags(render("```js\nconst a = 1;\n```"), "pre")[0];
  ok("a fence is painted in the language it names",
    fence.getAttribute("class") === "code"
    && fence.innerHTML.includes(`<span class="cd-kw">const</span>`));
  ok("a quote in a quote is drawn inside it",
    tags(tags(render("> a\n> > b"), "blockquote")[0], "blockquote").length === 1);

  const items = render("1. one\n   - two\n\n3. three");
  ok("lists drawn as `ol` and `ul`, a start where it is not 1",
    tags(items, "ol").length === 2
    && tags(items, "ul").length === 1
    && tags(items, "ol")[1].getAttribute("start") === "3");

  //------------------------------------------------------------------------------------- Component

  const shown = Markdown({ text: "- [ ] todo\n- [x] done" });
  const boxes = tags(shown, "input");
  ok("boxes: one per item, ticked as the text has it",
    boxes.length === 2 && !boxes[0].hasAttribute("checked") && boxes[1].hasAttribute("checked"));
  ok("without `onCheck` the boxes only show", boxes.every(box => box.hasAttribute("disabled")));
  ok("the box stands first, its brackets gone from the text",
    tags(shown, "li")[0].childNodes.map(node => node.textContent).join("|") === "check|todo");

  let handed = null;
  const live = Markdown({
    text: "> > - [ ] deep\r\n- [ ] top",
    onCheck: (text) => { handed = text; },
  });
  ok("one kind of line end", live.text === "> > - [ ] deep\n- [ ] top");
  tags(live, "input")[0].dispatch("change");
  ok("a click flips the box on its own line of the text, a quote in a quote deep",
    handed === "> > - [x] deep\n- [ ] top" && live.text === handed);
  ok("and the page draws again from it", tags(live, "input")[0].hasAttribute("checked"));

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log("FAIL", e.stack || e); process.exit(1); });
