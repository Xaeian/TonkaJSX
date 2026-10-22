// scripts/ui/kind.js
//
// What a file name says about its file: the glyph it wears, the colour that glyph carries,
// and how the app opens it, as a picture, a PDF, text, what a gzip holds or bytes.
// Names out of the kit's own vocabulary,
// so a row drawn from these needs nothing else to look like every other row.
//
// Every app that lists files asks the same questions of a name, and a table that lives in
// one of them answers "draft" and "neutral" in the next.

/** What a file name says about its file, every question looking past a copy's suffix. */
const Kind = (() => {
  /** Extensions shown as a picture rather than as a glyph. */
  const IMAGE_EXT = ["png", "jpg", "jpeg", "jfif", "gif", "webp", "avif", "bmp", "svg", "ico"];

  /** The language `Syntax` paints a file in, by its extension. */
  const LANG = {
    json: "json", jsonc: "json", map: "json", webmanifest: "json",
    ini: "ini", toml: "ini", cfg: "ini", conf: "ini", env: "ini", properties: "ini",
    yaml: "yaml", yml: "yaml",
    sql: "sql",
    md: "md", markdown: "md",
    csv: "csv", tsv: "csv",
    log: "log",
    c: "c", h: "c", cpp: "cpp", cc: "cpp", cxx: "cpp", hpp: "cpp",
    js: "js", mjs: "js", cjs: "js", jsx: "js", ts: "js", tsx: "js",
    py: "py", sh: "sh", bash: "sh", rs: "rust",
    html: "html", htm: "html", xml: "html", svg: "html", css: "css",
  };

  /** Extensions opened as text: every one `LANG` paints, and plain text, which needs no paint. */
  const TEXT_EXT = [...Object.keys(LANG), "txt"];

  // a glyph per kind, for a file that is not a picture
  const FILE_ICONS = {
    pdf: "picture_as_pdf",
    doc: "article", docx: "article", odt: "article", rtf: "article",
    md: "markdown",
    txt: "text_snippet", log: "text_snippet",
    csv: "csv", tsv: "csv",
    xls: "table_chart", xlsx: "table_chart", ods: "table_chart",
    ppt: "slideshow", pptx: "slideshow", odp: "slideshow",
    zip: "folder_zip", rar: "folder_zip", "7z": "folder_zip", tar: "folder_zip", gz: "folder_zip",
    json: "data_object", xml: "data_object", yaml: "data_object", yml: "data_object",
    ini: "settings", toml: "settings", cfg: "settings", env: "settings",
    html: "html", css: "css", js: "javascript", ts: "javascript",
    py: "code", c: "code", h: "code", cpp: "code", rs: "code", go: "code",
    sh: "terminal", bat: "terminal", ps1: "terminal",
    sql: "database", db: "database",
    hex: "memory", bin: "memory", elf: "memory", uf2: "memory", dfu: "memory",
    mp3: "audio_file", wav: "audio_file", ogg: "audio_file", flac: "audio_file", m4a: "audio_file",
    mp4: "video_file", mov: "video_file", mkv: "video_file", webm: "video_file", avi: "video_file",
    ttf: "font_download", otf: "font_download", woff: "font_download", woff2: "font_download",
  };

  // a colour per glyph, so a row's stripe carries the same meaning as its icon
  const ICON_COLORS = {
    image: "teal", picture_as_pdf: "red", article: "blue", markdown: "blue",
    text_snippet: "gray",
    csv: "green", table_chart: "green", slideshow: "pink", folder_zip: "orange",
    data_object: "amber", settings: "purple", html: "orange", css: "blue",
    javascript: "amber", code: "purple", terminal: "purple", database: "teal", memory: "purple",
    audio_file: "teal", video_file: "pink", font_download: "gray",
  };

  // An object url with no type is served as bytes, and an img tag will not take it.
  // The name decides instead. A few extensions do not spell their own type.
  const IMAGE_TYPE = { jpg: "jpeg", jfif: "jpeg", svg: "svg+xml", ico: "x-icon" };

  // A suffix a copy wears says nothing about the file, so every question here looks past it:
  // `passwords.ini.bak` is an INI that happens to be a copy.
  const COPY_SUFFIX = /\.(bak|old|orig)$/i;

  // the name without a copy's suffix, or as it is
  const plainName = (name) => String(name).replace(COPY_SUFFIX, "");

  // a table's own entry, never one every object inherits (`constructor`, `toString`)
  const own = (table, key) => Object.hasOwn(table, key) ? table[key] : undefined;

  /** The bit after the last dot, lowercased, a copy's suffix looked past; empty for none. */
  function ext(name) {
    const plain = plainName(name);
    const dot = plain.lastIndexOf(".");
    return dot > 0 ? plain.slice(dot + 1).toLowerCase() : "";
  }

  /** Whether the name is a picture a browser shows. */
  const isImage = (name) => IMAGE_EXT.includes(ext(name));

  /** Whether the name opens as text. */
  const isText = (name) => TEXT_EXT.includes(ext(name));

  /** Whether the name is a PDF. */
  const isPdf = (name) => ext(name) === "pdf";

  /** Whether the name is a gzip. */
  const isGzip = (name) => ext(name) === "gz";

  // A dump or a gzip fetches the whole file to show its head,
  // so past this size such a file only downloads.
  const FETCH_MAX = 8 * 1000 * 1000; // B

  /**
   * How a file opens: `image`, `pdf`, `text`, `gzip` for what it holds, `dump` for its bytes.
   * The last two fetch the whole file, so one past 8MB is `null`: it only downloads.
   * @param {string} name
   * @param {number} [size]  bytes, when the listing knows
   * @returns {"image"|"pdf"|"text"|"gzip"|"dump"|null}
   */
  function opens(name, size = 0) {
    if(isImage(name)) return "image";
    if(isPdf(name)) return "pdf";
    if(isText(name)) return "text";
    if(size > FETCH_MAX) return null;
    return isGzip(name) ? "gzip" : "dump";
  }

  /** What a gzip holds, by name: `index.html.gz` holds `index.html`. */
  const gunzipName = (name) => plainName(name).replace(/\.gz$/i, "");

  /** The MIME type a picture is served as, by its name. */
  function imageType(name) {
    const extension = ext(name);
    return `image/${own(IMAGE_TYPE, extension) || extension}`;
  }

  /** The glyph a file wears: a picture's own, anything else by its kind, `draft` for none. */
  const icon = (name) => isImage(name) ? "image" : own(FILE_ICONS, ext(name)) || "draft";

  /** The colour of the glyph a file wears. */
  const color = (name) => own(ICON_COLORS, icon(name)) || "neutral";

  /** Bytes as a person reads them, in SI units: `860B`, `1.4kB`, `2.3MB`. */
  function sizeText(bytes) {
    const units = ["B", "kB", "MB", "GB"];
    let n = Number(bytes) || 0, i = 0;
    while(n >= 1000 && i < units.length - 1) { n /= 1000; i++; }
    return `${i ? n.toFixed(1) : n}${units[i]}`;
  }

  return {
    IMAGE_EXT, TEXT_EXT, LANG,
    ext, isImage, isText, isPdf, isGzip, opens,
    imageType, gunzipName,
    icon, color, sizeText,
  };
})();
