// scripts/ui/syntax.js
//
// Text to coloured HTML. Pure functions: no DOM, no element, nothing but a string in and
// a string out, so a caller wanting the colours without the box can take just this.
// The box is `Code.jsx`, the colours are in `styles/ui/code.css`.
//
// Every painter escapes the text it emits and nothing else. Escaping the whole source first
// would turn `<` into `&lt;`, and a word rule would then colour the `lt` inside it.

const Syntax = (() => {
  const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ESC[c]);
  const tag = (cls, text) => `<span class="cd-${cls}">${text}</span>`;
  const mark = (cls, raw) => tag(cls, esc(raw));
  const lines = (src, fn) => String(src).split("\n").map(fn).join("\n");

  //------------------------------------------------------------------------------------- Languages

  const BY_EXT = {
    json: "json", jsonc: "json", map: "json", webmanifest: "json",
    ini: "ini", toml: "ini", cfg: "ini", conf: "ini", env: "ini", properties: "ini",
    yaml: "yaml", yml: "yaml",
    sql: "sql",
    md: "md", markdown: "md",
    csv: "csv", tsv: "csv",
    log: "log",
  };

  /** The language a file name spells, or `txt` when it spells none. */
  function lang(name) {
    return BY_EXT[fileExt(name)] || "txt";
  }

  /** A bare value carries its own kind, and prose keeps the colour of prose. */
  function scalar(raw) {
    const v = raw.trim();
    if(/^-?\d+(\.\d+)?$/.test(v)) return mark("num", raw);
    if(/^(true|false|null|yes|no|on|off)$/i.test(v)) return mark("kw", raw);
    if(/^"[^]*"$|^'[^]*'$/.test(v)) return mark("str", raw);
    return esc(raw);
  }

  /**
   * The line, and what a trailing comment took off it.
   * A comment opens only after a space and never inside quotes, so a path, an id or a hash
   * written into a value keeps it.
   */
  function splitComment(line, chars) {
    let quote = "";
    for(let i = 0; i < line.length; i++) {
      const ch = line[i];
      if(quote) { if(ch === quote) quote = ""; continue; }
      if(ch === '"' || ch === "'") { quote = ch; continue; }
      if(!chars.includes(ch)) continue;
      if(i && !/\s/.test(line[i - 1])) continue;
      return [line.slice(0, i), mark("comment", line.slice(i))];
    }
    return [line, ""];
  }

  //------------------------------------------------------------------------------------------ Json

  // Quoted runs come first, so a colon or a keyword inside a string stays part of the string.
  // This painter reads escaped text: no branch of it can match what escaping leaves behind.
  const JSON_RE =
    /("(?:\\.|[^"\\])*"(\s*:)?)|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

  const json = (src) => esc(src).replace(JSON_RE, (m, str, colon, kw) =>
    tag(str !== undefined ? (colon ? "key" : "str") : kw !== undefined ? "kw" : "num", m));

  //------------------------------------------------------------------------------------------- Ini

  const ini = (src) => lines(src, (line) => {
    const [main, tail] = splitComment(line, ";#");
    const section = main.match(/^(\s*)(\[[^\]]*\])(\s*)$/);
    if(section) return esc(section[1]) + mark("type", section[2]) + esc(section[3]) + tail;
    const pair = main.match(/^(\s*)([^=\s][^=]*?)(\s*=\s*)(.*)$/);
    if(!pair) return esc(main) + tail;
    return esc(pair[1]) + mark("key", pair[2]) + esc(pair[3]) + scalar(pair[4]) + tail;
  });

  //------------------------------------------------------------------------------------------ Yaml

  const yaml = (src) => lines(src, (line) => {
    const [main, tail] = splitComment(line, "#");
    if(/^---\s*$/.test(main)) return mark("meta", main) + tail;
    const pair = main.match(/^(\s*)([^\s][^:]*?)(:\s*)(.*)$/);
    if(!pair) return esc(main) + tail;
    return esc(pair[1]) + mark("key", pair[2]) + esc(pair[3]) + scalar(pair[4]) + tail;
  });

  //------------------------------------------------------------------------------------------- Sql

  const SQL_WORDS = new Set(("select from where insert into values update set delete create " +
    "table drop alter add column index view join left right full inner outer cross on as and " +
    "or not null is in like between order by group having limit offset distinct union all " +
    "case when then else end primary key foreign references default unique constraint check " +
    "begin commit rollback transaction with exists returning conflict do nothing asc desc " +
    "count sum avg min max cast coalesce integer text real blob boolean timestamp").split(" "));

  // Strings and comments are taken whole before anything else looks at the text, so a keyword
  // inside either of them stays where it belongs.
  const SQL_RE = new RegExp([
    "('(?:''|[^'])*')",                 // a literal, a doubled quote staying inside it
    '("(?:""|[^"])*")',                 // a quoted identifier
    "(--[^\\n]*|/\\*[\\s\\S]*?\\*/)",   // a comment, to the line end or to its closing pair
    "(\\b\\d+(?:\\.\\d+)?\\b)",
    "([A-Za-z_][\\w$]*)",
  ].join("|"), "g");

  // The gaps between matches are escaped too: `replace` would hand them back untouched.
  function sql(src) {
    const text = String(src);
    let out = "", at = 0;
    SQL_RE.lastIndex = 0;
    for(let m; (m = SQL_RE.exec(text));) {
      const [whole, str, quoted, comment, num, word] = m;
      out += esc(text.slice(at, m.index));
      out += str !== undefined ? mark("str", whole)
        : quoted !== undefined ? mark("key", whole)
        : comment !== undefined ? mark("comment", whole)
        : num !== undefined ? mark("num", whole)
        : SQL_WORDS.has(word.toLowerCase()) ? mark("kw", whole)
        : esc(whole);
      at = m.index + whole.length;
    }
    return out + esc(text.slice(at));
  }

  //-------------------------------------------------------------------------------------------- Md

  // The source, coloured as source. Nothing here builds a document: a half parser reads worse
  // than the markup it hides, and rendering one belongs to whatever owns the document.
  const md = (src) => lines(src, (line) => {
    if(/^\s*(```|~~~)/.test(line)) return mark("meta", line);
    if(/^#{1,6}\s/.test(line)) return mark("type", line);
    if(/^\s*>/.test(line)) return mark("comment", line);
    if(/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) return mark("meta", line);
    return esc(line)
      .replace(/^(\s*)([-*+]|\d+\.)(\s)/, (m, pad, bullet, gap) => pad + tag("kw", bullet) + gap)
      .replace(/`[^`]+`/g, (m) => tag("str", m))
      .replace(/\*\*[^*]+\*\*/g, (m) => tag("kw", m))
      .replace(/(\[[^\]]*\])(\([^)]*\))/g, (m, text, url) => tag("str", text) + tag("meta", url));
  });

  //------------------------------------------------------------------------------------------- Log

  const LOG_RE = /^(\s*)(\d{4}-\d\d-\d\d[ T][\d:.,]+)?(\s*)(\[?[A-Z]{3,8}\]?)?([\s\S]*)$/;

  const log = (src) => lines(src, (line) => {
    const m = line.match(LOG_RE);
    if(!m) return esc(line);
    return esc(m[1]) + (m[2] ? mark("meta", m[2]) : "") + esc(m[3])
      + (m[4] ? mark("kw", m[4]) : "") + esc(m[5]);
  });

  //------------------------------------------------------------------------------------------- Csv

  /** Column colours cycle, so neighbouring columns never share one. */
  const RAINBOW = 8;

  // The separator is whichever candidate rules the first line that holds any of them.
  const DELIMS = [",", ";", "\t", "|"];

  function delimiter(src) {
    const first = String(src).split("\n").find((l) => l.trim()) || "";
    let best = ",", most = 0;
    for(const d of DELIMS) {
      const n = first.split(d).length - 1;
      if(n > most) { most = n; best = d; }
    }
    return best;
  }

  /** One line into its fields, a doubled quote staying inside the field that holds it. */
  function fields(line, delim) {
    const out = [];
    let cur = "", quoted = false;
    for(let i = 0; i < line.length; i++) {
      const ch = line[i];
      if(quoted) {
        cur += ch;
        if(ch !== '"') continue;
        if(line[i + 1] === '"') cur += line[++i];
        else quoted = false;
      }
      else if(ch === '"') { cur += ch; quoted = true; }
      else if(ch === delim) { out.push(cur); cur = ""; }
      else cur += ch;
    }
    out.push(cur);
    return out;
  }

  const csv = (src) => {
    const delim = delimiter(src);
    const sep = mark("sep", delim);
    return lines(src, (line) => line === ""
      ? ""
      : fields(line, delim).map((f, i) => mark("c" + (i % RAINBOW), f)).join(sep));
  };

  //------------------------------------------------------------------------------------------ Dump

  // The lines `dump.js` writes: a note, a fault, a segment,
  // or an offset, the bytes and the same bytes as text.
  // A zero byte is dimmed, so what is written stands out from what is not.
  const DUMP_RE = /^([0-9a-f]{8})(  )([0-9a-f ]{48})(  \|)(.*)(\|)$/;

  const dump = (src) => lines(src, (line) => {
    if(line.startsWith("#")) return mark("comment", line);
    if(line.startsWith("!")) return mark("err", line);
    if(line.startsWith("@")) return mark("kw", line);
    const m = line.match(DUMP_RE);
    if(!m) return esc(line);
    const bytes = m[3].replace(/\b00\b/g, (z) => tag("sep", z));
    return mark("meta", m[1]) + m[2] + bytes + m[4] + mark("str", m[5]) + m[6];
  });

  //----------------------------------------------------------------------------------------- Paint

  const PAINTERS = { json, ini, yaml, sql, md, log, csv, dump };

  /**
   * Source to HTML carrying `cd-*` classes. A language nothing paints comes back escaped,
   * which is the whole of what a plain text file needs.
   *
   * @param {string} text
   * @param {string} [name]  a language id, or a file name to take one from
   * @returns {string}
   */
  function paint(text, name) {
    const id = PAINTERS[name] ? name : lang(name);
    return (PAINTERS[id] || esc)(String(text ?? ""));
  }

  // Every painter emits flat spans, so an open one can be closed and opened again around
  // a line end. Only a block comment or a quoted run ever reaches over one.
  const SPLIT = /<span class="(cd-[\w-]+)">|<\/span>|\n/g;

  /**
   * The same paint, one string per source line, so a caller can give each line a box.
   * A span reaching over a line end is closed and opened again, because a line has to be an
   * element and an element cannot straddle two of them.
   *
   * @param {string} text
   * @param {string} [name]
   * @returns {string[]} one entry per line, always at least one
   */
  function paintLines(text, name) {
    const html = paint(text, name);
    const out = [];
    let line = "", open = null, at = 0;
    SPLIT.lastIndex = 0;
    for(let m; (m = SPLIT.exec(html));) {
      line += html.slice(at, m.index);
      at = m.index + m[0].length;
      if(m[0] === "\n") {
        out.push(open ? line + "</span>" : line);
        line = open ? `<span class="${open}">` : "";
      }
      else if(m[1]) { open = m[1]; line += m[0]; }
      else { open = null; line += m[0]; }
    }
    out.push(line + html.slice(at));
    return out;
  }

  return { lang, paint, paintLines, esc, RAINBOW };
})();
