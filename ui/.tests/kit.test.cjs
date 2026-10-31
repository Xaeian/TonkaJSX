// .tests/kit.test.cjs
//
// `Kind`, `Dump`, `Syntax`, `UI` and `Theme` of `scripts/ui` as the page loads them,
// over the few stand-ins they reach for: a fake clipboard, script tag, element and store.
// Names, icons, colours and what opens how, the fetch cap included, and sizes in SI;
// a dump of bytes, of a text whatever its name, of an Intel HEX at a high linear address;
// Markdown painted line by line as it reads, and every language without losing a character;
// marks, titles, the clipboard's wipe, script loads, an unmount and a theme kept in a store.

const { readFileSync } = require("node:fs");
const { gzipSync } = require("node:zlib");
const path = require("node:path");
const vm = require("node:vm");

const APP = path.join(__dirname, "..");
const KIT = path.join(APP, "scripts", "ui");

// timers held instead of run, so a test reads what was armed and for how long
const timers = [];
let clip = ""; // what the fake clipboard holds
const head = { appendChild() {} };
const ctx = vm.createContext({
  TextDecoder, Blob, Response, DecompressionStream, queueMicrotask,
  setTimeout: (fn, ms) => timers.push({ fn, ms }),
  clearTimeout: () => {},
  getComputedStyle: () => ({ transitionDuration: "0.2s" }),
  navigator: { clipboard: { writeText: async (t) => { clip = t; }, readText: async () => clip } },
  JSX: { TitleAttr: "title", createElement: (tag, props, ...kids) => ({ tag, props, kids }) },
  document: {
    head,
    documentElement: { dataset: {} },
    createElement: (tag) => ({ tag }),
    dispatchEvent: () => true,
  },
  matchMedia: () => ({ matches: false, addEventListener() {} }),
  CustomEvent: class {
    constructor(type, opts) {
      this.type = type;
      this.detail = opts?.detail;
    }
  },
});
for(const file of ["dump.js", "kind.js", "syntax.js", "theme.js", "ui.js"]) {
  vm.runInContext(readFileSync(path.join(KIT, file), "utf8"), ctx, { filename: file });
}
const run = (code) => vm.runInContext(code, ctx);
const [Kind, Dump, Syntax, Theme, UI] = ["Kind", "Dump", "Syntax", "Theme", "UI"].map(run);

let pass = 0, fail = 0;

function ok(name, cond) {
  if(cond) pass++;
  else fail++;
  console.log(`  ${cond ? "ok  " : "FAIL"} ${name}`);
}

const tick = () => new Promise(resolve => setImmediate(resolve));
const bytes = (text) => new TextEncoder().encode(text);
const MB = 1000 * 1000;

// an Intel HEX record, its checksum bringing the sum of its bytes to a multiple of 0x100
function record(addr, type, data) {
  const all = [data.length, Math.floor(addr / 0x100), addr % 0x100, type, ...data];
  const sum = all.reduce((n, b) => n + b, 0);
  all.push((0x100 - sum % 0x100) % 0x100);
  return ":" + all.map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

// painted HTML back to its source: what a painter adds is spans and escapes, nothing else
const unpaint = (html) => html
  .replace(/<span class="cd-[\w-]+">|<\/span>/g, "")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&amp;/g, "&");

// parts of `UI.markup` and `UI.linkify` as text, an element as its tag around its children
const flat = (parts) => parts
  .map(p => typeof p === "string" ? p : `<${p.tag}>${flat(p.kids.flat())}</${p.tag}>`)
  .join("");

// a stand-in element: its attributes in a map, the four calls `UI.title` makes
function element(attrs) {
  const map = new Map(Object.entries(attrs));
  return {
    map,
    hasAttribute: (k) => map.has(k),
    getAttribute: (k) => map.get(k) ?? null,
    setAttribute: (k, v) => map.set(k, String(v)),
    removeAttribute: (k) => map.delete(k),
  };
}

(async () => {
  //--------------------------------------------------------------------------------------- Globals

  const loose = [
    "fileExt", "fileIcon", "fileColor", "sizeText", "isImage", "isText",
    "imageType", "gunzipName", "IMAGE_EXT", "TEXT_EXT", "DUMP_FETCH_MAX", "DUMP_BYTES",
    "dump", "gunzip", "hexdump", "intelHex", "_hex", "_row", "readable", "TEXT_CONTROLS",
    "PLAIN_EXT", "MAIN",
  ];
  ok("kind.js and dump.js leave no global but their namespace",
    loose.every(name => run(`typeof ${name}`) === "undefined"));
  ok("Syntax hands out no esc or RAINBOW",
    Syntax.esc === undefined && Syntax.RAINBOW === undefined);

  //------------------------------------------------------------------------------------------ Kind

  ok("ext looks past a copy's suffix",
    Kind.ext("passwords.ini.bak") === "ini"
    && Kind.ext("site.tar.gz.old") === "gz"
    && Kind.ext("Photo.JPG") === "jpg");
  ok("ext is empty without a dot or for a dotfile",
    Kind.ext("README") === "" && Kind.ext(".env") === "");
  ok("icon by kind, a picture's own, draft for none",
    Kind.icon("a.pdf") === "picture_as_pdf"
    && Kind.icon("a.png") === "image"
    && Kind.icon("fw.hex") === "memory"
    && Kind.icon("a.xyz") === "draft");
  ok("color follows the icon",
    Kind.color("a.pdf") === "red"
    && Kind.color("a.png") === "teal"
    && Kind.color("a.xyz") === "neutral");
  ok("a name an object inherits is no kind",
    Kind.icon("x.constructor") === "draft"
    && Kind.color("x.constructor") === "neutral"
    && Kind.icon("x.toString") === "draft"
    && Kind.imageType("x.constructor") === "image/constructor");
  ok("imageType spells the type an extension does not",
    Kind.imageType("a.jpg") === "image/jpeg"
    && Kind.imageType("a.svg") === "image/svg+xml"
    && Kind.imageType("a.png") === "image/png");
  ok("isText: every painted extension and plain text, bytes not",
    ["a.c", "App.jsx", "notes.md", "app.log", "a.txt"].every(Kind.isText)
    && !Kind.isText("fw.bin"));
  const sources = [
    "startup.s", "boot.asm", "flash.ld", "rules.mk", "blink.ino", "main.go",
    "run.bat", "run.cmd", "make.ps1",
  ];
  ok("isText: the sources, scripts and build files beside code", sources.every(Kind.isText));
  ok("TEXT_EXT holds every key of LANG",
    Object.keys(Kind.LANG).every(e => Kind.TEXT_EXT.includes(e)));
  ok("opens: picture, pdf, text",
    Kind.opens("a.png") === "image"
    && Kind.opens("a.pdf") === "pdf"
    && Kind.opens("main.c") === "text");
  ok("opens: gzip for what it holds, dump for the rest",
    Kind.opens("site.tar.gz") === "gzip"
    && Kind.opens("fw.bin", 100) === "dump"
    && Kind.opens("fw.hex") === "dump");
  ok("opens: a dump or a gzip past 8MB is null",
    Kind.opens("fw.bin", 8 * MB) === "dump"
    && Kind.opens("fw.bin", 8 * MB + 1) === null
    && Kind.opens("a.gz", 9 * MB) === null);
  ok("opens: a picture, a pdf or a text of any size opens",
    Kind.opens("a.png", 99 * MB) === "image"
    && Kind.opens("a.pdf", 99 * MB) === "pdf"
    && Kind.opens("big.log", 99 * MB) === "text");
  ok("main: words and pictures copy, a PDF opens, the rest downloads",
    Kind.main("notes.md") === "copy"
    && Kind.main("a.png") === "copy"
    && Kind.main("a.pdf") === "open"
    && Kind.main("fw.bin") === "download"
    && Kind.main("site.tar.gz") === "download");
  ok("sizeText counts in SI",
    Kind.sizeText(999) === "999B"
    && Kind.sizeText(1000) === "1.0kB"
    && Kind.sizeText(1500000) === "1.5MB");
  ok("gunzipName drops the gzip", Kind.gunzipName("index.html.gz") === "index.html");

  //------------------------------------------------------------------------------------------ Dump

  const image = [
    record(0, 0x04, [0x90, 0x00]),
    record(0, 0x00, [0xde, 0xad, 0xbe, 0xef]),
    record(0, 0x05, [0x90, 0x00, 0x01, 0x99]),
    record(0, 0x01, []),
  ].join("\n");
  const shown = Dump.text("fw.hex", bytes(image)).split("\n");
  ok("an extended linear address 0x9000 puts the data at 90000000",
    shown.includes("@ 90000000-90000003  4B"));
  ok("the note counts in SI and the entry reads unsigned",
    shown[0] === "# Intel HEX: 1 segment, 4B, entry 0x90000199");
  ok("the row sits at its own address",
    shown.some(l => l.startsWith("90000000  de ad be ef") && l.endsWith("|....|")));
  const segmented = Dump.text("a.hex", bytes([
    record(0, 0x02, [0x10, 0x00]),
    record(0x0004, 0x00, [0x01]),
    record(0, 0x03, [0x10, 0x00, 0x00, 0x04]),
    record(0, 0x01, []),
  ].join("\n")));
  ok("a segment address counts in paragraphs", segmented.includes("@ 00010004-00010004  1B"));
  ok("and an entry is its segment and offset", segmented.includes("entry 0x00010004"));
  const faulty = Dump.text("a.hex", bytes(":04000000DEADBEEF00\nnot a record\n:00000001FF"));
  ok("a bad checksum names the one expected",
    faulty.includes("! line 1: bad checksum 00, expected C4"));
  ok("a line that is no record says so", faulty.includes("! line 2: not a record"));
  ok("a file with no end record is told",
    Dump.text("a.hex", bytes(record(0, 0, [1]))).includes("# no end record"));
  const gap = " ".repeat(18), half = " ".repeat(23);
  ok("bytes as offset, hex and text",
    Dump.text("fw.bin", bytes("Hi")) === `00000000  48 69${gap}  ${half}  |Hi|`);
  ok("an empty file says so", Dump.text("x.bin", new Uint8Array(0)) === "# empty file");
  ok("a long file shows its head and says how much it holds",
    Dump.text("x.bin", new Uint8Array(70000)).startsWith("# first 64.0kB of 70.0kB\n00000000"));
  const inflated = await Dump.gunzip(gzipSync(Buffer.from("hello")));
  ok("gunzip opens a gzip", new TextDecoder().decode(inflated) === "hello");
  const read = (name, text) => Dump.read(name, bytes(text));
  ok("read: words whatever the name, for the name to paint",
    read("Makefile", "all:\n\tgcc main.c\n").text === "all:\n\tgcc main.c\n"
    && read("Makefile", "all:").lang === null);
  ok("read: tabs, line ends, a form feed and a colour escape stay words",
    read("run.out", "a\tb\r\n\f\u001b[31mred\u001b[0m\n").lang === null);
  ok("read: a NUL or another control makes bytes",
    read("fw.bin", "MZ\u0000\u0001").lang === "dump" && read("x.dat", "a\u0007b").lang === "dump");
  ok("read: letters past ASCII stay words", read("pl.txt", "zażółć").text === "zażółć");
  ok("read: an Intel HEX is its memory, an empty file says so",
    read("fw.hex", image).text === Dump.text("fw.hex", bytes(image))
    && read("fw.hex", image).lang === "dump"
    && read("x", "").text === "# empty file");

  //---------------------------------------------------------------------------------------- Syntax

  const md = (line) => Syntax.paint(line, "md");
  ok("md: `- - -` and `* * *` are rules",
    md("- - -") === `<span class="cd-meta">- - -</span>`
    && md("* * *") === `<span class="cd-meta">* * *</span>`);
  ok("md: `1) item` is a bullet", md("1) item") === `<span class="cd-kw">1)</span> item`);
  ok("md: an indented `# Title` is a heading",
    md("  # Title") === `<span class="cd-type">  # Title</span>`);
  ok("md: inline marks after a bullet",
    md("- **b** `c`") === `<span class="cd-kw">-</span> `
      + `<span class="cd-kw">**b**</span> <span class="cd-str">\`c\`</span>`);
  ok("md: a fence, a quote",
    md("  ```js") === `<span class="cd-meta">  \`\`\`js</span>`
    && md("> said") === `<span class="cd-comment">&gt; said</span>`);
  ok("md: four spaces of indent open no rule", md("    ---") === "    ---");
  ok("lang by extension, txt for a name an object inherits",
    Syntax.lang("main.c") === "c"
    && Syntax.lang("App.jsx") === "js"
    && Syntax.lang("x.constructor") === "txt");
  ok("paint takes a fence name, an extension and a file name alike",
    Syntax.paint("x", "c++") === Syntax.paint("x", "cpp")
    && Syntax.paint("x", "rs") === Syntax.paint("x", "a.rs"));
  ok("a name an object inherits paints as plain text",
    Syntax.paint("<b>", "constructor") === "&lt;b&gt;" && Syntax.paint("a", "toString") === "a");
  const SAMPLE = [
    `# head <b> & "q" 'r' \`t\` **s** [a](b)`,
    "key = value ; note",
    "- item: yes # c",
    "/* block <x>",
    "still */ int x = 0x1F; // c",
    `SELECT 'a''b' AS "c" FROM t -- c`,
    "2026-04-18 09:12:04 WARN slow & late",
    `a,"b,c";d|e`,
    `<div class="x">&amp;</div>`,
    `fn main() { println!("hi"); }`,
    "def f(): return '''doc",
    "''' $HOME --flag @deco",
  ].join("\n");
  const ids = [...Object.keys(Kind.LANG), ...new Set(Object.values(Kind.LANG)), "dump", "txt"];
  let thrown = "";
  const whole = ids.every((id) => {
    try { return unpaint(Syntax.paint(SAMPLE, id)) === SAMPLE; }
    catch(e) { thrown = ` (${id}: ${e.message})`; return false; }
  });
  ok(`every language paints, losing no character${thrown}`, whole);
  ok("a dump paints back to itself",
    unpaint(Syntax.paint(shown.join("\n"), "dump")) === shown.join("\n"));
  const split = Syntax.paintLines("/* a\nb */ x", "c");
  ok("paintLines closes and reopens a span over a line end",
    split.length === 2
    && split[0] === `<span class="cd-comment">/* a</span>`
    && split[1] === `<span class="cd-comment">b */</span> x`);
  ok("sql: a keyword inside a literal stays the literal",
    Syntax.paint("SELECT 'from'", "sql")
    === `<span class="cd-kw">SELECT</span> <span class="cd-str">'from'</span>`);

  //----------------------------------------------------------------------------------------- Marks

  ok("markup: every mark",
    flat(UI.markup("**b** __u__ *i* _j_ ~~s~~ `c` \\* https://a.b/c"))
    === "<strong>b</strong> <strong>u</strong> <em>i</em> <em>j</em> <del>s</del> "
      + "<code>c</code> * <a>https://a.b/c</a>");
  ok("markup: a mark inside a word or left open is text",
    flat(UI.markup("snake_case and 2*3*4 and *open")) === "snake_case and 2*3*4 and *open");
  ok("markup: code keeps a mark and an address as text",
    flat(UI.markup("`**x** https://a.b`")) === "<code>**x** https://a.b</code>");
  ok("linkify: an address up to the next space",
    flat(UI.linkify("see https://a.b/c, now")) === "see <a>https://a.b/c,</a> now");
  ok("_link wears its label, or else its address",
    UI._link("https://a.b", "here").kids[0] === "here"
    && UI._link("https://a.b").kids[0] === "https://a.b"
    && UI._link("https://a.b").props.target === "_blank");

  //----------------------------------------------------------------------------------------- Title

  const labelled = element({ "data-tooltip": "Copy", "aria-label": "Copy" });
  UI.title(labelled);
  labelled.title = null;
  const cleared = !labelled.map.has("data-tooltip") && !labelled.map.has("aria-label");
  labelled.title = "Copied";
  ok("title: null takes both away, the next title brings both back",
    cleared
    && labelled.map.get("data-tooltip") === "Copied"
    && labelled.map.get("aria-label") === "Copied");
  const plain = element({});
  UI.title(plain);
  plain.title = "Tip";
  ok("title: an element without a label gets none",
    plain.title === "Tip" && !plain.map.has("aria-label"));

  //------------------------------------------------------------------------------------- Clipboard

  ok("uncopy is private", UI.uncopy === undefined && typeof UI._uncopy === "function");
  const btn = { loading: false, icon: "content_copy" };
  const armed = () => timers.some(t => t.ms === 30000);
  // a text that never comes fails the copy, as it should: the wipe is what is checked
  await UI.copy(btn, Promise.reject(new Error("gone")), { clearAfter: 30 }).catch(() => {});
  await tick();
  ok("copy: a text that never comes arms no wipe", UI._wipe === null && !armed());
  let give;
  const later = new Promise((resolve) => { give = resolve; });
  const written = UI.copy(btn, later, { clearAfter: 30 });
  await tick();
  ok("copy: no wipe while the text is on its way", UI._wipe === null && !armed());
  give("secret");
  await written;
  await tick();
  ok("copy: the wipe is armed once the text has come",
    typeof UI._wipe === "function" && armed() && clip === "secret");
  const flash = timers.find(t => t.ms === 1200);
  flash?.fn();
  ok("copy: the check flashes and the copy glyph comes back",
    !!flash && btn.icon === "content_copy");

  //---------------------------------------------------------------------------------------- Script

  let attempts = 0, removed = 0;
  ctx.document.createElement = (tag) => ({ tag, remove: () => { removed++; } });
  // the first load fails, every later one loads
  head.appendChild = (s) => queueMicrotask(() => attempts++ ? s.onload() : s.onerror());
  const first = UI.script("lib.js");
  ok("script: a second call while loading shares the load", UI.script("lib.js") === first);
  const refused = await first.then(() => false, () => true);
  ok("script: a failed load rejects and leaves no tag behind", refused && removed === 1);
  const again = UI.script("lib.js");
  ok("script: the next call tries afresh",
    again !== first && await again.then(() => true, () => false));
  ok("script: a loaded script is kept", UI.script("lib.js") === again && attempts === 2);

  //--------------------------------------------------------------------------------------- Unmount

  let gone = false;
  UI._unmount({ remove: () => { gone = true; } });
  const last = timers.at(-1);
  last.fn();
  ok("_unmount waits out the transition, then removes", last.ms === 200 && gone);

  //----------------------------------------------------------------------------------------- Theme

  const kept = { theme: "dark" };
  Theme.remember({ get: (k) => kept[k], set: (k, v) => { kept[k] = v; } });
  ok("remember takes up a store's choice", Theme.current() === "dark" && Theme.isDark());
  Theme.set("light");
  ok("and keeps every later one under theme",
    kept.theme === "light" && Theme.choice() === "light");

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
