// scripts/ui/Markdown.jsx
//
// A text read in two passes: `_mdParse` turns its lines into blocks of plain data,
// and `_mdRender` draws those, the one part that knows the page.

/**
 * Markdown as a page to read: headings, paragraphs, lists within lists,
 * quotes holding blocks of their own, rules, tables, pictures and fenced code.
 * Inline marks are `UI.markup`'s, plus Markdown's own `[label](url)` links, `<url>` addresses
 * and `![alt](src)` pictures, and a fence is painted by `Syntax` in the language it names.
 * A manual or a readme is the measure: HTML stays text.
 * A line ending in two spaces or a backslash breaks where it ends.
 * A picture opens full size on a click.
 * `image` turns the name a page gives it into an address,
 * so a name can stand for a file the app keeps elsewhere.
 * A line or a list item opening with `[ ]` or `[x]` wears a box.
 * With `onCheck` a click flips the box in the text itself, and the page draws again from it.
 *
 * Mutators: .text
 *
 * @param {object} props
 * @param {string} [props.text]
 * @param {string|number} [props.height]  as `Code` takes it, the page scrolling within;
 *   without one it runs as long as its text, the way a file reads
 * @param {(src:string) => string|Promise<string>} [props.image]  address of a picture,
 *   `src` as written by default; one that fails leaves the alt text in its place
 * @param {boolean} [props.breaks]  a line break of the text breaks the line on the page too,
 *   as a note has it, where a readme joins the lines; a blank line starts a paragraph either way
 * @param {(text:string) => void} [props.onCheck]  the text with a box flipped by a click;
 *   without it the boxes only show
 */
const Markdown = ({ text = "", height, image = (src) => src, breaks, onCheck,
  class: className, ...rest }) => {
  const tall = _height(height);
  const el = <div {...rest} {...tall} class={["markdown", className]} scroll={!!tall}></div>;
  let source = "";

  // the box on line `at` of the text flipped, the page drawn again and the text handed on
  function check(at) {
    const lines = source.split("\n");
    lines[at] = lines[at].replace(/\[([ xX])\]/, (box, mark) => mark === " " ? "[x]" : "[ ]");
    el.text = lines.join("\n");
    onCheck(source);
  }

  UI.prop(el, "text", () => source, (v) => {
    // one kind of line end, so a line number points at the same line in both
    source = String(v ?? "").replace(/\r\n?/g, "\n");
    const blocks = _mdParse(source.split("\n"), 0);
    el.replaceChildren(..._mdRender(blocks, { image, breaks, check: onCheck && check }));
  });
  el.text = text;
  return el;
};

//------------------------------------------------------------------------------------------- Parse

// a table's second line: dashes for every column, a colon on the side it aligns to
const _MD_TABLE_RULE = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

// The blocks a line may open, tried in this order: `test` asks whether `lines[i]` opens one,
// `read` takes it from there and gives it with the index of the line after it.
// A line that opens none starts a paragraph, and the next line that opens one ends it.
const _MD_OPENERS = [
  { test: (lines, i) => _MD_FENCE.test(lines[i]), read: _mdFence },
  { test: (lines, i) => _MD_HEADING.test(lines[i]), read: _mdHeading },
  { test: (lines, i) => _MD_RULE.test(lines[i]), read: _mdRule },
  { test: (lines, i) => _MD_QUOTE.test(lines[i]), read: _mdQuote },
  { test: (lines, i) => _MD_ITEM.test(lines[i]), read: _mdList },
  { test: _mdTableAt, read: _mdTable },
];

// the opener of the block `lines[i]` starts, none for a line of a paragraph
const _mdOpener = (lines, i) => _MD_OPENERS.find(opener => opener.test(lines, i));

// The blocks of `lines` as plain data, top to bottom.
// `base` is where `lines` start in the source, so a line keeps its number inside a quote.
// A block is one of:
//   { type: "code", lang, text }, { type: "heading", level, text }, { type: "rule" },
//   { type: "quote", blocks }, { type: "list", ordered, start, items: [{ lines, lists }] },
//   { type: "table", head, align, rows }, { type: "para", lines };
// a line of text is `{ text, at, hard }`, as `_mdLine` gives it.
function _mdParse(lines, base) {
  const blocks = [];
  let i = 0;
  while(i < lines.length) {
    if(!lines[i].trim()) { i++; continue; }
    const opener = _mdOpener(lines, i);
    const { block, next } = opener ? opener.read(lines, i, base) : _mdPara(lines, i, base);
    blocks.push(block);
    i = next;
  }
  return blocks;
}

// a fence up to the one that closes it, or to the end of the text
function _mdFence(lines, i) {
  const [, fence, lang] = lines[i].match(_MD_FENCE);
  const end = new RegExp(`^\\s{0,3}${fence[0]}{${fence.length},}\\s*$`);
  const code = [];
  for(i++; i < lines.length && !end.test(lines[i]); i++) code.push(lines[i]);
  return { block: { type: "code", lang, text: code.join("\n") }, next: i + 1 };
}

function _mdHeading(lines, i) {
  const [, marks, text] = lines[i].match(_MD_HEADING);
  return { block: { type: "heading", level: marks.length, text }, next: i + 1 };
}

function _mdRule(lines, i) {
  return { block: { type: "rule" }, next: i + 1 };
}

// what a quote holds is a page of its own, a quote within it included
function _mdQuote(lines, i, base) {
  const from = i;
  const quoted = [];
  for(let m; i < lines.length && (m = lines[i].match(_MD_QUOTE)); i++) quoted.push(m[1]);
  return { block: { type: "quote", blocks: _mdParse(quoted, base + from) }, next: i };
}

// a table: its head, how each column aligns, and every row cut or padded to the head
function _mdTable(lines, i) {
  const head = _mdCells(lines[i]);
  const align = _mdCells(lines[i + 1]).map(_mdAlign);
  const rows = [];
  for(i += 2; i < lines.length && lines[i].includes("|"); i++) {
    const cells = _mdCells(lines[i]);
    rows.push(head.map((_, at) => cells[at] ?? ""));
  }
  return { block: { type: "table", head, align, rows }, next: i };
}

// a paragraph: its lines up to a blank one or one that opens a block
function _mdPara(lines, i, base) {
  const para = [];
  for(; i < lines.length && lines[i].trim() && !_mdOpener(lines, i); i++) {
    para.push(_mdLine(lines[i], base + i));
  }
  return { block: { type: "para", lines: para }, next: i };
}

// the cells of a table line, its outer pipes dropped; `\|` is a pipe inside a cell
function _mdCells(line) {
  return line.trim().replace(/^\|/, "").replace(/(?<!\\)\|$/, "")
    .split(/(?<!\\)\|/)
    .map(cell => cell.trim().replace(/\\\|/g, "|"));
}

// `true` where a line of cells stands over a rule line with as many of them
function _mdTableAt(lines, i) {
  const rule = lines[i + 1];
  return lines[i].includes("|") && rule !== undefined && _MD_TABLE_RULE.test(rule)
    && _mdCells(lines[i]).length === _mdCells(rule).length;
}

// how a column aligns by its rule cell: `:-:` center, `-:` right, the way text runs otherwise
function _mdAlign(rule) {
  if(!rule.endsWith(":")) return null;
  return rule.startsWith(":") ? "center" : "right";
}

// One line of a block as `{text, at, hard}`: `at` its line in the source,
// `hard` when two spaces or a backslash end it, which breaks the line there
function _mdLine(raw, at) {
  return { text: raw.trim().replace(/\\$/, ""), at, hard: / {2,}$|\\$/.test(raw) };
}

// A list from `lines[i]` on: items at its indent,
// a deeper item opening a list inside the one above it,
// an indented line carrying an item on; anything else ends it
function _mdList(lines, i, base) {
  const [, lead, marker] = lines[i].match(_MD_ITEM);
  const ordered = /\d/.test(marker);
  const items = [];
  while(i < lines.length) {
    const line = lines[i];
    const m = line.match(_MD_ITEM);
    const indent = line.length - line.trimStart().length;
    if(m && m[1].length === lead.length && /\d/.test(m[2]) === ordered) {
      items.push({ lines: [_mdLine(m[3], base + i)], lists: [] });
      i++;
    }
    else if(m && m[1].length > lead.length && items.length) {
      const inner = _mdList(lines, i, base);
      items[items.length - 1].lists.push(inner.block);
      i = inner.next;
    }
    else if(!m && line.trim() && indent > lead.length && items.length) {
      items[items.length - 1].lines.push(_mdLine(line, base + i));
      i++;
    }
    else break;
  }
  // an ordered list counts on from the number its first item gives
  const start = ordered && parseInt(marker, 10) !== 1 ? parseInt(marker, 10) : null;
  return { block: { type: "list", ordered, start, items }, next: i };
}

//------------------------------------------------------------------------------------------ Render

// a box opening a line or a list item: `[ ]` to do, `[x]` done
const _MD_BOX = /^\[([ xX])\]\s+/;

// What inline text holds beside the marks of `UI.markup`: `[label](url)` links,
// `![alt](src)` pictures, a `"title"` after either left out, and `<https://...>` addresses
const _MD_LINK = /(!?)\[([^[\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)|<(https?:\/\/[^>\s]+)>/dg;

// a code span and an escape, as `UI.markup` reads them: no link opens or closes inside one
const _MD_KEPT = /`[^`\n]+`|\\[\\`*_~\[\]()#+\-.!|<>]/g;

// The blocks `_mdParse` gives as elements; `opts` is what the page asks of them:
// `image` for the address of a picture, `breaks`, and `check`, which flips a box, if any
function _mdRender(blocks, opts) {
  return blocks.map(block => _MD_DRAW[block.type](block, opts));
}

// each kind of block, drawn
const _MD_DRAW = {
  code: ({ lang, text }) => {
    const pre = <pre class="code"></pre>;
    pre.innerHTML = Syntax.paint(text, lang);
    return pre;
  },
  heading: ({ level, text }, { image }) =>
    JSX.createElement(`h${level}`, {}, ..._mdInline(text, image)),
  rule: () => <hr />,
  quote: ({ blocks }, opts) => <blockquote>{_mdRender(blocks, opts)}</blockquote>,
  list: ({ ordered, start, items }, opts) => JSX.createElement(ordered ? "ol" : "ul", { start },
    ...items.map(item => <li>{_mdLines(item.lines, opts)}{_mdRender(item.lists, opts)}</li>)),
  table: ({ head, align, rows }, { image }) => {
    const cell = (tag, value, at) =>
      JSX.createElement(tag, { text: align[at] }, ..._mdInline(value, image));
    return (
      <div class="markdown-table">
        <table>
          <thead><tr>{head.map((value, at) => cell("th", value, at))}</tr></thead>
          <tbody>
            {rows.map(row => <tr>{row.map((value, at) => cell("td", value, at))}</tr>)}
          </tbody>
        </table>
      </div>
    );
  },
  para: ({ lines }, opts) => <p>{_mdLines(lines, opts)}</p>,
};

// The lines of one block as inline marks: joined by a space,
// and broken where a line is `hard` or everywhere with `breaks`
function _mdLines(lines, opts) {
  const runs = [];
  lines.forEach((line, i) => {
    if(i === 0 || opts.breaks || lines[i - 1].hard) runs.push([line]);
    else runs[runs.length - 1].push(line);
  });
  const out = [];
  runs.forEach((run, i) => {
    if(i) out.push(<br />);
    out.push(..._mdText(run.map(line => line.text).join(" "), run[0].at, opts));
  });
  return out;
}

// One run of inline marks, a box first when it opens with one; `check` flips that box
function _mdText(text, at, { image, check }) {
  const box = text.match(_MD_BOX);
  if(!box) return _mdInline(text, image);
  const done = box[1] !== " ";
  return [
    <Checkbox checked={done} disabled={!check} onChange={check && (() => check(at))} />,
    ..._mdInline(text.slice(box[0].length), image),
  ];
}

// Inline marks as `UI.markup` reads them, with links, addresses and pictures between them.
// Links are looked for in a copy with every code span and escape blanked out,
// so a bracket inside one is no bracket at all;
// the copy is as long as the text, so what it finds stands at the same place in the text.
function _mdInline(text, image) {
  const blank = text.replace(_MD_KEPT, (kept) => "x".repeat(kept.length));
  const out = [];
  let at = 0;
  for(const m of blank.matchAll(_MD_LINK)) {
    // each group as the text has it, a label's blanked spans back as they were written
    const [bang, label, url, address] = m.indices.slice(1)
      .map(span => span && text.slice(...span));
    out.push(...UI.markup(text.slice(at, m.index)));
    if(bang) out.push(_mdPicture(url, label, image));
    else if(address) out.push(UI._link(address));
    else out.push(UI._link(url, label ? _mdLabel(label) : url));
    at = m.index + m[0].length;
  }
  out.push(...UI.markup(text.slice(at)));
  return out;
}

// a link's label with its marks live and an address in it as text: a link holds no link
function _mdLabel(label) {
  return UI.markup(label).map(part => part.nodeName === "A" ? part.textContent : part);
}

// A picture at the address `image` gives, full size on a click;
// one that does not come leaves its alt text where it stood
function _mdPicture(src, alt, image) {
  const lost = () => img.replaceWith(<i>{alt || src}</i>);
  const img = <img alt={alt} loading="lazy" onClick={() => Lightbox.open(img.src, alt)} />;
  img.addEventListener("error", lost);
  Promise.resolve()
    .then(() => image(src))
    .then((url) => { img.src = url; })
    .catch(lost);
  return img;
}
