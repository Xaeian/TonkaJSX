// scripts/ui/syntax.js
//
// Text to coloured HTML.
// Pure functions: no DOM, no element, nothing but a string in and a string out,
// so a caller wanting the colours without the box can take just this.
// The box is `Code`, and the colours are its `cd-` classes.
//
// A painter escapes each piece of text as it emits it.
// Escaping the whole source first would turn `<` into `&lt;`,
// and a word rule would then colour the `lt` inside it.
// `json` and the inline marks of `md` escape first all the same,
// because none of their rules can match part of an entity.

// the lines that open a block of Markdown, read alike by `Markdown` and the `md` painter
const _MD_FENCE = /^\s{0,3}(`{3,}|~{3,})\s*([\w.+-]*)/;
const _MD_HEADING = /^\s{0,3}(#{1,6})\s+(.*?)[\s#]*$/;
const _MD_ITEM = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
const _MD_QUOTE = /^\s{0,3}>\s?(.*)$/;
const _MD_RULE = /^\s{0,3}([-*_])(\s*\1){2,}\s*$/;

const Syntax = (() => {
  const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };
  // text made safe in HTML: `&`, `<` and `>` escaped
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ESC[c]);
  const tag = (cls, text) => `<span class="cd-${cls}">${text}</span>`;
  const mark = (cls, raw) => tag(cls, esc(raw));
  const lines = (src, fn) => String(src).split("\n").map(fn).join("\n");
  const names = (list) => new Set(list.split(" "));
  // a table's own entry, never one every object inherits (`constructor`, `toString`)
  const own = (table, key) => Object.hasOwn(table, key) ? table[key] : undefined;

  //------------------------------------------------------------------------------------- Languages

  // what a fence of Markdown may call a language, beside the extensions of `Kind.LANG`
  const ALIASES = {
    "c++": "cpp", javascript: "js", typescript: "js",
    python: "py", shell: "sh", zsh: "sh",
  };

  /** The language a file name spells, or `txt` when it spells none. */
  function lang(name) {
    return own(Kind.LANG, Kind.ext(name)) ?? "txt";
  }

  // A bare value carries its own kind, and prose keeps the colour of prose
  function scalar(raw) {
    const v = raw.trim();
    if(/^-?\d+(\.\d+)?$/.test(v)) return mark("num", raw);
    if(/^(true|false|null|yes|no|on|off)$/i.test(v)) return mark("kw", raw);
    if(/^".*"$|^'.*'$/.test(v)) return mark("str", raw);
    return esc(raw);
  }

  // The line, and what a trailing comment took off it.
  // A comment opens only after a space and never inside quotes,
  // so a path, an id or a hash written into a value keeps it.
  function splitComment(line, chars) {
    let quote = "";
    for(let i = 0; i < line.length; i++) {
      const ch = line[i];
      if(quote) { if(ch === quote) quote = ""; continue; }
      if(ch === `"` || ch === "'") { quote = ch; continue; }
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

  function json(src) {
    return esc(src).replace(JSON_RE, (m, str, colon, kw) =>
      tag(str !== undefined ? (colon ? "key" : "str") : kw !== undefined ? "kw" : "num", m));
  }

  //------------------------------------------------------------------------------------------- Ini

  function ini(src) {
    return lines(src, (line) => {
      const [main, tail] = splitComment(line, ";#");
      const section = main.match(/^(\s*)(\[[^\]]*\])(\s*)$/);
      if(section) return esc(section[1]) + mark("type", section[2]) + esc(section[3]) + tail;
      const pair = main.match(/^(\s*)([^=\s][^=]*?)(\s*=\s*)(.*)$/);
      if(!pair) return esc(main) + tail;
      return esc(pair[1]) + mark("key", pair[2]) + esc(pair[3]) + scalar(pair[4]) + tail;
    });
  }

  //------------------------------------------------------------------------------------------ Yaml

  function yaml(src) {
    return lines(src, (line) => {
      const [main, tail] = splitComment(line, "#");
      if(/^---\s*$/.test(main)) return mark("meta", main) + tail;
      const pair = main.match(/^(\s*)([^\s][^:]*?)(:\s*)(.*)$/);
      if(!pair) return esc(main) + tail;
      return esc(pair[1]) + mark("key", pair[2]) + esc(pair[3]) + scalar(pair[4]) + tail;
    });
  }

  //------------------------------------------------------------------------------------------- Sql

  const SQL_WORDS = names("select from where insert into values update set delete create"
    + " table drop alter add column index view join left right full inner outer cross on as and"
    + " or not null is in like between order by group having limit offset distinct union all"
    + " case when then else end primary key foreign references default unique constraint check"
    + " begin commit rollback transaction with exists returning conflict do nothing asc desc"
    + " count sum avg min max cast coalesce integer text real blob boolean timestamp");

  // Strings and comments are taken whole before anything else looks at the text,
  // so a keyword inside either of them stays where it belongs.
  const SQL_RE = new RegExp([
    "('(?:''|[^'])*')",                 // a literal, a doubled quote staying inside it
    `("(?:""|[^"])*")`,                 // a quoted identifier
    "(--[^\\n]*|/\\*[\\s\\S]*?\\*/)",   // a comment, to the line end or to its closing pair
    "(\\b\\d+(?:\\.\\d+)?\\b)",
    "([A-Za-z_][\\w$]*)",
  ].join("|"), "g");

  // The gaps between matches are escaped too: `replace` would hand them back untouched
  function sql(src) {
    const text = String(src);
    let out = "", at = 0;
    for(const m of text.matchAll(SQL_RE)) {
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

  // The source, coloured as source, a line opening a block read the way `Markdown` reads it.
  // Nothing here builds a document: a half parser reads worse than the markup it hides,
  // and rendering one belongs to whatever owns the document.
  function md(src) {
    return lines(src, (line) => {
      if(_MD_FENCE.test(line)) return mark("meta", line);
      if(_MD_HEADING.test(line)) return mark("type", line);
      if(_MD_RULE.test(line)) return mark("meta", line);
      if(_MD_QUOTE.test(line)) return mark("comment", line);
      const item = line.match(_MD_ITEM);
      if(!item) return inline(line);
      const [, pad, bullet] = item;
      return esc(pad) + tag("kw", bullet) + inline(line.slice(pad.length + bullet.length));
    });
  }

  // the inline marks of a line: code, bold, and a link's label and address
  function inline(text) {
    return esc(text)
      .replace(/`[^`]+`/g, (m) => tag("str", m))
      .replace(/\*\*[^*]+\*\*/g, (m) => tag("kw", m))
      .replace(/(\[[^\]]*\])(\([^)]*\))/g,
        (m, label, url) => tag("str", label) + tag("meta", url));
  }

  //------------------------------------------------------------------------------------------- Log

  const LOG_RE = /^(\s*)(\d{4}-\d\d-\d\d[ T][\d:.,]+)?(\s*)(\[?[A-Z]{3,8}\]?)?([\s\S]*)$/;

  function log(src) {
    return lines(src, (line) => {
      const m = line.match(LOG_RE);
      return esc(m[1]) + (m[2] ? mark("meta", m[2]) : "") + esc(m[3])
        + (m[4] ? mark("kw", m[4]) : "") + esc(m[5]);
    });
  }

  //------------------------------------------------------------------------------------------- Csv

  // column colours, `cd-c0` to `cd-c7`, cycled so neighbouring columns never share one
  const RAINBOW = 8;

  // The separator is whichever candidate rules the first line that holds any of them
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

  // One line into its fields, a doubled quote staying inside the field that holds it
  function fields(line, delim) {
    const out = [];
    let cur = "", quoted = false;
    for(let i = 0; i < line.length; i++) {
      const ch = line[i];
      if(quoted) {
        cur += ch;
        if(ch !== `"`) continue;
        if(line[i + 1] === `"`) { cur += line[i + 1]; i++; }
        else quoted = false;
      }
      else if(ch === `"`) { cur += ch; quoted = true; }
      else if(ch === delim) { out.push(cur); cur = ""; }
      else cur += ch;
    }
    out.push(cur);
    return out;
  }

  function csv(src) {
    const delim = delimiter(src);
    const sep = mark("sep", delim);
    return lines(src, (line) => line === ""
      ? ""
      : fields(line, delim).map((f, i) => mark("c" + (i % RAINBOW), f)).join(sep));
  }

  //------------------------------------------------------------------------------------------ Dump

  // The lines `Dump.text` writes: a note, a fault, a segment,
  // or an offset, the bytes and the same bytes as text.
  // A zero byte is dimmed, so what is written stands out from what is not.
  const DUMP_RE = /^([0-9a-f]{8})(  )([0-9a-f ]{48})(  \|)(.*)(\|)$/;

  function dump(src) {
    return lines(src, (line) => {
      if(line.startsWith("#")) return mark("comment", line);
      if(line.startsWith("!")) return mark("err", line);
      if(line.startsWith("@")) return mark("kw", line);
      const m = line.match(DUMP_RE);
      if(!m) return esc(line);
      const bytes = m[3].replace(/\b00\b/g, (z) => tag("sep", z));
      return mark("meta", m[1]) + m[2] + bytes + m[4] + mark("str", m[5]) + m[6];
    });
  }

  //------------------------------------------------------------------------------------------ Code

  // Pieces many languages share: a pattern for what stands next in the text and its class;
  // `word` hands a name to the lists of its language, `null` leaves the text plain
  const SLASHES = [/\/\/.*/, "comment"];
  const BLOCK = [/\/\*[\s\S]*?(?:\*\/|$)/, "comment"];
  const HASH = [/#.*/, "comment"];
  const QUOTED = [/"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?/, "str"];
  const NUMBER = [/0[xX][\dA-Fa-f]+|0[bB][01]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?[fFuUlL]*/, "num"];
  const NAME = [/[A-Za-z_$][\w$]*/, "word"];
  const REST = [/\s+|[\s\S]/, null];

  const C_KEYS = "if else for while do switch case default break continue return goto typedef"
    + " struct enum union const static extern volatile register inline restrict sizeof";
  const C_TYPES = "void char short int long float double signed unsigned bool";

  // Each language: `rules` tried in order at every point of the text, the last taking anything,
  // and the names that are a keyword, a type, or a constant painted as a number
  const LANGS = {
    c: {
      rules: [SLASHES, BLOCK, [/#\s*[a-z]+/, "meta"], [/<[\w/.]+\.h>/, "str"],
        QUOTED, NUMBER, NAME, REST],
      kw: names(C_KEYS),
      type: names(`${C_TYPES} FILE`),
      num: names("NULL true false EOF"),
      typed: /_t$/, // a name the shape of which makes it a type, `uint8_t`
    },
    cpp: {
      rules: [SLASHES, BLOCK, [/#\s*[a-z]+/, "meta"], [/<[\w/.]+>(?=\s*$)/m, "str"],
        QUOTED, NUMBER, NAME, REST],
      kw: names(`${C_KEYS} class namespace template typename public private protected virtual`
        + " override new delete using constexpr auto this operator try catch throw"),
      type: names(`${C_TYPES} string vector`),
      num: names("NULL nullptr true false"),
      typed: /_t$/,
    },
    js: {
      rules: [SLASHES, BLOCK, [/`(?:\\.|[^`\\])*`?/, "str"], QUOTED, NUMBER, NAME, REST],
      kw: names("const let var function return if else for while do switch case default"
        + " break continue new class extends import export from async await try catch"
        + " finally throw typeof instanceof in of this yield delete interface type enum"
        + " implements readonly private public protected declare as"),
      type: names("Object Array String Number Boolean Promise Map Set Date Math JSON"),
      num: names("true false null undefined NaN Infinity"),
    },
    py: {
      rules: [HASH, [/("""|''')[\s\S]*?(?:\1|$)/, "str"],
        [/[bBfFrRuU]{0,2}(?:"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)/, "str"],
        NUMBER, [/@\w+/, "meta"], NAME, REST],
      kw: names("def class return if elif else for while in not and or is import from as"
        + " with try except finally raise pass break continue lambda yield async await"
        + " global nonlocal del assert"),
      type: names("int float str bool list dict set tuple bytes object"),
      num: names("True False None"),
    },
    sh: {
      rules: [HASH, QUOTED, [/\$\{?\w+\}?/, "type"], [/(?<=\s)--?[\w-]+/, "meta"],
        NUMBER, NAME, REST],
      kw: names("if then else elif fi for in do done while case esac function return"
        + " export local"),
    },
    rust: {
      rules: [SLASHES, BLOCK, [/#!?\[[^\]\n]*\]/, "meta"], [/[a-z_]\w*!/, "meta"],
        [/"(?:\\.|[^"\\])*"?|'(?:\\.|[^'\\])'/, "str"], NUMBER, NAME, REST],
      kw: names("fn let mut const static if else match for while loop in return break"
        + " continue struct enum impl trait pub use mod crate self Self super as where"
        + " unsafe move ref type dyn extern"),
      type: names("u8 u16 u32 u64 u128 usize i8 i16 i32 i64 i128 isize f32 f64 bool char str"
        + " String Vec Option Result Box"),
      num: names("true false None Some Ok Err"),
    },
    html: {
      rules: [[/<!--[\s\S]*?(?:-->|$)/, "comment"], [/<\/?[\w-]+|\/?>/, "kw"],
        [/[\w-]+(?==)/, "type"], QUOTED, REST],
    },
    css: {
      rules: [BLOCK, [/@[\w-]+/, "meta"], [/[\w-]+(?=\s*:[^:])/, "type"], QUOTED,
        [/#[\dA-Fa-f]{3,8}\b|-?\d+(?:\.\d+)?(?:%|[a-z]+)?/, "num"], NAME, REST],
    },
  };
  // the same patterns read in place, from wherever the painter stands
  for(const language of Object.values(LANGS)) {
    language.sticky = language.rules
      .map(([re, cls]) => [new RegExp(re.source, re.flags + "y"), cls]);
  }

  // a name's class in its language: a keyword, a type, a constant, or plain
  function wordKind(word, language) {
    if(language.kw?.has(word)) return "kw";
    if(language.type?.has(word) || language.typed?.test(word)) return "type";
    if(language.num?.has(word)) return "num";
    return null;
  }

  // Code painted piece by piece: at every point the first rule matching there takes its piece.
  // A block comment or a quoted run of many lines is one piece, and `paintLines` cuts it.
  function code(src, language) {
    const text = String(src);
    let out = "", at = 0;
    while(at < text.length) {
      for(const [re, cls] of language.sticky) {
        re.lastIndex = at;
        const piece = re.exec(text)?.[0];
        if(!piece) continue;
        const kind = cls === "word" ? wordKind(piece, language) : cls;
        out += kind ? mark(kind, piece) : esc(piece);
        at += piece.length;
        break;
      }
    }
    return out;
  }

  //----------------------------------------------------------------------------------------- Paint

  const PAINTERS = { json, ini, yaml, sql, md, log, csv, dump };
  for(const [id, language] of Object.entries(LANGS)) PAINTERS[id] = (src) => code(src, language);

  /**
   * Source to HTML carrying `cd-*` classes.
   * A language nothing paints comes back escaped,
   * which is the whole of what a plain text file needs.
   *
   * @param {string} text
   * @param {string} [name]  a language id, a name a Markdown fence gives one,
   *   or a file name to take one from
   * @returns {string}
   */
  function paint(text, name) {
    const id = own(ALIASES, name) ?? own(Kind.LANG, name) ?? name;
    const painter = own(PAINTERS, id) ?? own(PAINTERS, lang(name)) ?? esc;
    return painter(String(text ?? ""));
  }

  // Every painter emits flat spans,
  // so an open one can be closed and opened again around a line end.
  // Only a block comment or a quoted run ever reaches over one.
  const SPLIT = /<span class="(cd-[\w-]+)">|<\/span>|\n/g;

  /**
   * The same paint, one string per source line, so a caller can give each line a box.
   * A span reaching over a line end is closed and opened again,
   * because a line has to be an element and an element cannot straddle two of them.
   *
   * @param {string} text
   * @param {string} [name]
   * @returns {string[]} one entry per line, always at least one
   */
  function paintLines(text, name) {
    const html = paint(text, name);
    const out = [];
    let line = "", open = null, at = 0;
    for(const m of html.matchAll(SPLIT)) {
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

  return { lang, paint, paintLines };
})();
