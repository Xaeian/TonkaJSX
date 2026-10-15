// scripts/ui/Markdown.jsx

const _MD_FENCE = /^\s{0,3}(`{3,}|~{3,})\s*([\w.+-]*)/;
const _MD_HEADING = /^\s{0,3}(#{1,6})\s+(.*?)[\s#]*$/;
const _MD_ITEM = /^\s{0,3}([-*+]|\d+[.)])\s+(.*)$/;
const _MD_QUOTE = /^\s{0,3}>\s?(.*)$/;
const _MD_RULE = /^\s{0,3}([-*_])(\s*\1){2,}\s*$/;
const _MD_LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/**
 * Markdown as a page to read: headings, paragraphs, lists, quotes, rules and fenced code.
 * Inline marks are `UI.markup`'s, plus Markdown's own `[label](url)` links,
 * and a fence is painted by `Syntax` in the language it names.
 * A manual or a readme is the measure: tables, nesting and HTML stay text.
 *
 * Mutators: .text
 *
 * @param {Object} props
 * @param {string} [props.text]
 * @param {string|number} [props.height]  as `Code` takes it, the page scrolling within;
 *   without one it runs as long as its text, the way a file reads
 */
const Markdown = ({ text = "", height, class: className, ...rest }) => {
  const tall = _height(height);
  const el = (
    <div {...rest} class={["markdown", className]} scroll={tall != null}
      style={{ height: tall }}></div>
  );
  let source = "";
  UI.prop(el, "text", () => source, (v) => {
    source = String(v ?? "");
    el.replaceChildren(..._mdBlocks(source));
  });
  el.text = text;
  return el;
};

// A line that starts a block of its own, and so ends the paragraph before it
function _mdOpens(line) {
  return [_MD_FENCE, _MD_HEADING, _MD_ITEM, _MD_QUOTE, _MD_RULE].some(re => re.test(line));
}

// The blocks of a Markdown text as elements, top to bottom
function _mdBlocks(text) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const out = [];
  let i = 0, m;
  while(i < lines.length) {
    const line = lines[i];
    if(!line.trim()) { i++; continue; }
    if((m = line.match(_MD_FENCE))) {
      const end = new RegExp(`^\\s{0,3}${m[1][0]}{${m[1].length},}\\s*$`);
      const code = [];
      for(i++; i < lines.length && !end.test(lines[i]); i++) code.push(lines[i]);
      i++; // past the closing fence
      const pre = <pre class="code"></pre>;
      pre.innerHTML = Syntax.paint(code.join("\n"), m[2]);
      out.push(pre);
    }
    else if((m = line.match(_MD_HEADING))) {
      out.push(JSX.createElement(`h${m[1].length}`, {}, ..._mdInline(m[2])));
      i++;
    }
    else if(_MD_RULE.test(line)) { out.push(<hr />); i++; }
    else if(_MD_QUOTE.test(line)) {
      const quoted = [];
      for(; i < lines.length && (m = lines[i].match(_MD_QUOTE)); i++) quoted.push(m[1]);
      out.push(<blockquote>{_mdInline(quoted.join(" "))}</blockquote>);
    }
    else if((m = line.match(_MD_ITEM))) {
      const items = [];
      for(; i < lines.length; i++) {
        const item = lines[i].match(_MD_ITEM);
        if(item) { items.push(item[2]); continue; }
        // a line indented under an item carries that item on
        if(!/^\s{2,}\S/.test(lines[i])) break;
        items[items.length - 1] += " " + lines[i].trim();
      }
      out.push(JSX.createElement(/\d/.test(m[1]) ? "ol" : "ul", {},
        ...items.map(item => <li>{_mdInline(item)}</li>)));
    }
    else {
      const para = [];
      for(; i < lines.length && lines[i].trim() && !_mdOpens(lines[i]); i++) {
        para.push(lines[i].trim());
      }
      out.push(<p>{_mdInline(para.join(" "))}</p>);
    }
  }
  return out;
}

// Inline marks as `UI.markup` reads them, with `[label](url)` links between them
function _mdInline(text) {
  const out = [];
  let at = 0;
  for(const link of text.matchAll(_MD_LINK)) {
    out.push(...UI.markup(text.slice(at, link.index)));
    const attrs = { link: true, href: link[2], target: "_blank", rel: "noopener" };
    out.push(JSX.createElement("a", attrs, ...UI.markup(link[1])));
    at = link.index + link[0].length;
  }
  out.push(...UI.markup(text.slice(at)));
  return out;
}
