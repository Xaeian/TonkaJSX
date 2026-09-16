// scripts/ui/kind.js
//
// What a file name says about its file: the glyph it wears, the colour that glyph carries,
// and whether the app can open it as a picture or as text. Names out of the kit's own
// vocabulary, so a row drawn from these needs nothing else to look like every other row.
//
// Every app that lists files asks the same questions of a name, and a table that lives in
// one of them answers "draft" and "neutral" in the next.

/** Extensions shown as a picture rather than as a glyph. */
const IMAGE_EXT = ["png", "jpg", "jpeg", "jfif", "gif", "webp", "avif", "bmp", "svg", "ico"];

// What opens as text. `Syntax` colours the ones it knows and escapes the rest, which is all
// a plain file needs. Anything not listed is bytes, and bytes only download.
const TEXT_EXT = ["txt", "md", "markdown", "csv", "tsv", "json", "ini", "toml", "cfg", "conf",
  "env", "properties", "yaml", "yml", "sql", "log", "xml", "html", "css", "js", "ts", "py",
  "sh", "svg"];

/** A glyph per kind, for a file that is not a picture. */
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

/** A colour per glyph, so a row's stripe carries the same meaning as its icon. */
const ICON_COLORS = {
  image: "teal", picture_as_pdf: "red", article: "blue", markdown: "blue",
  text_snippet: "gray",
  csv: "green", table_chart: "green", slideshow: "pink", folder_zip: "orange",
  data_object: "amber", settings: "purple", html: "orange", css: "blue",
  javascript: "amber", code: "purple", terminal: "purple", database: "teal", memory: "purple",
  audio_file: "teal", video_file: "pink", font_download: "gray",
};

// An object url with no type is served as bytes, and an img tag will not take it. The name
// decides instead. Two extensions do not spell their own type.
const IMAGE_TYPE = { jpg: "jpeg", jfif: "jpeg", svg: "svg+xml", ico: "x-icon" };

// A suffix a copy wears says nothing about the file, so every question here looks past it:
// `passwords.ini.bak` is an INI that happens to be a copy.
const COPY_SUFFIX = /\.(bak|old|orig)$/i;

/** The name without a copy's suffix, or as it is. */
const plainName = (name) => String(name).replace(COPY_SUFFIX, "");

/** The bit after the last dot, lowercased, a copy's suffix looked past; empty for none. */
function fileExt(name) {
  const plain = plainName(name);
  const dot = plain.lastIndexOf(".");
  return dot > 0 ? plain.slice(dot + 1).toLowerCase() : "";
}

const isImage = (name) => IMAGE_EXT.includes(fileExt(name));
const isText = (name) => TEXT_EXT.includes(fileExt(name));
const isPdf = (name) => fileExt(name) === "pdf";
const isGzip = (name) => fileExt(name) === "gz";

/** What a gzip holds, by name: `index.html.gz` holds `index.html`. */
const gunzipName = (name) => plainName(name).replace(/\.gz$/i, "");

const imageType = (name) => {
  const ext = fileExt(name);
  return `image/${IMAGE_TYPE[ext] || ext}`;
};

const fileIcon = (name) => isImage(name) ? "image" : FILE_ICONS[fileExt(name)] || "draft";
const fileColor = (name) => ICON_COLORS[fileIcon(name)] || "neutral";

/** Bytes as a person reads them: `860B`, `1.4kB`, `2.3MB`. */
function sizeText(bytes) {
  const units = ["B", "kB", "MB", "GB"];
  let n = Number(bytes) || 0, i = 0;
  while(n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${i ? n.toFixed(1) : n}${units[i]}`;
}
