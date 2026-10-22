// scripts/ui/dump.js
//
// Bytes as a person reads them: an offset, sixteen of them as hex, the same sixteen as text.
// A file nothing else opens is opened this way,
// and an Intel HEX is opened as the memory it describes, not as the records that describe it.
// Pure functions, no DOM: the text comes back and `Syntax` paints it as `dump`.
//
// The text is lines of four kinds, and the painter reads them by their first character:
//   # a note        what the dump is and what it leaves out
//   ! a fault       a record the file got wrong
//   @ a segment     where the bytes that follow live
//   00000000  ...   the bytes themselves

/** A file as text to read: its bytes, or the memory an Intel HEX describes. */
const Dump = (() => {
  // bytes a dump shows; what a file holds past that is said in a note rather than drawn
  const DUMP_BYTES = 64 * 1000;

  const hex = (n, width) => n.toString(16).padStart(width, "0");

  // a byte as text: itself where the eye can read it, a dot everywhere else
  const glyph = (b) => b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : ".";

  // one row of sixteen from `at`, addressed as `base + at`
  function row(bytes, at, base) {
    const chunk = bytes.subarray(at, at + 16);
    const pairs = [...chunk].map(b => hex(b, 2));
    const left = pairs.slice(0, 8).join(" ").padEnd(23);
    const right = pairs.slice(8).join(" ").padEnd(23);
    return `${hex(base + at, 8)}  ${left}  ${right}  |${[...chunk].map(glyph).join("")}|`;
  }

  // rows for the first `limit` bytes; `[]` for none
  function rows(bytes, base, limit) {
    const out = [];
    for(let at = 0; at < Math.min(bytes.length, limit); at += 16) out.push(row(bytes, at, base));
    return out;
  }

  // raw bytes, the first `DUMP_BYTES` of them, a note first when that is not the whole
  function hexdump(bytes) {
    const lines = [];
    if(!bytes.length) lines.push("# empty file");
    if(bytes.length > DUMP_BYTES) {
      lines.push(`# first ${Kind.sizeText(DUMP_BYTES)} of ${Kind.sizeText(bytes.length)}`);
    }
    lines.push(...rows(bytes, 0, DUMP_BYTES));
    return lines.join("\n");
  }

  //------------------------------------------------------------------------------------- Intel HEX

  // A record: `:` then bytes as hex pairs: the count, the address, the type, the data,
  // and a checksum that brings the sum of every byte to zero.
  // Types 02 and 04 move the base the addresses that follow are counted from,
  // 03 and 05 name where execution starts, 01 ends it.
  const HEX_RECORD = /^:([0-9a-f]{2})([0-9a-f]{4})([0-9a-f]{2})((?:[0-9a-f]{2})*)([0-9a-f]{2})$/i;

  // how many faults a dump lists before it counts the rest
  const FAULTS_SHOWN = 20;

  // the checksum byte that brings the sum of `bytes` and itself to a multiple of 0x100
  const checksum = (bytes) => (0x100 - bytes.reduce((n, b) => n + b, 0) % 0x100) % 0x100;

  // the big-endian word at `at` of a record's data, a byte it lacks read as zero
  const word = (data, at) => (data[at] ?? 0) * 0x100 + (data[at + 1] ?? 0);

  // An Intel HEX read up to its end record: its data in segments where it lies,
  // the entry when one is named, and a fault line for each record the file got wrong
  function parseHex(src) {
    const chunks = [];
    const faults = [];
    let base = 0;
    let entry = null;
    let ended = false;
    const lines = String(src).split(/\r?\n/);
    for(let i = 0; i < lines.length && !ended; i++) {
      const line = lines[i].trim();
      if(!line) continue;
      const m = line.match(HEX_RECORD);
      if(!m || Number.parseInt(m[1], 16) * 2 !== m[4].length) {
        faults.push(`! line ${i + 1}: not a record`);
        continue;
      }
      const raw = line.slice(1).match(/../g).map(h => Number.parseInt(h, 16));
      const want = checksum(raw.slice(0, -1));
      if(want !== raw.at(-1)) {
        const expected = hex(want, 2).toUpperCase();
        faults.push(`! line ${i + 1}: bad checksum ${m[5].toUpperCase()}, expected ${expected}`);
        continue;
      }
      const addr = Number.parseInt(m[2], 16);
      const data = raw.slice(4, -1);
      const value = data.length >= 2 ? word(data, 0) : 0;
      switch(Number.parseInt(m[3], 16)) {
        case 0x00: chunks.push({ addr: base + addr, data }); break;
        case 0x01: ended = true; break;
        case 0x02: base = value * 0x10; break;
        case 0x03: entry = value * 0x10 + word(data, 2); break;
        case 0x04: base = value * 0x10000; break;
        case 0x05: entry = value * 0x10000 + word(data, 2); break;
        default: faults.push(`! line ${i + 1}: unknown record type ${m[3].toUpperCase()}`);
      }
    }
    return { segments: merge(chunks), entry, ended, faults };
  }

  // chunks in address order, the ones that touch merged into one segment
  function merge(chunks) {
    const segments = [];
    for(const c of chunks.sort((a, b) => a.addr - b.addr)) {
      const last = segments.at(-1);
      if(last && last.addr + last.bytes.length === c.addr) last.bytes.push(...c.data);
      else segments.push({ addr: c.addr, bytes: [...c.data] });
    }
    return segments;
  }

  // An Intel HEX as the memory it describes: a note naming its segments, its size and its entry,
  // each record the file got wrong, then every segment as a dump at its own address.
  // Records after the end record and data past the shown bytes are left out and said.
  function intelHex(src) {
    const { segments, entry, ended, faults } = parseHex(src);
    const total = segments.reduce((n, s) => n + s.bytes.length, 0);
    const lines = [];
    if(!segments.length) lines.push("# Intel HEX: no data records");
    else {
      const what = `${segments.length} segment${segments.length === 1 ? "" : "s"}`;
      const where = entry === null ? "" : `, entry 0x${hex(entry, 8)}`;
      lines.push(`# Intel HEX: ${what}, ${Kind.sizeText(total)}${where}`);
    }
    if(total > DUMP_BYTES) {
      lines.push(`# first ${Kind.sizeText(DUMP_BYTES)} of ${Kind.sizeText(total)}`);
    }
    if(!ended && (segments.length || faults.length)) lines.push("# no end record");
    lines.push(...faults.slice(0, FAULTS_SHOWN));
    if(faults.length > FAULTS_SHOWN) lines.push(`! and ${faults.length - FAULTS_SHOWN} more`);
    let left = DUMP_BYTES;
    for(const s of segments) {
      if(left <= 0) break;
      const bytes = Uint8Array.from(s.bytes);
      const end = s.addr + bytes.length - 1;
      lines.push(`@ ${hex(s.addr, 8)}-${hex(end, 8)}  ${Kind.sizeText(bytes.length)}`);
      lines.push(...rows(bytes, s.addr, left));
      left -= bytes.length;
    }
    return lines.join("\n");
  }

  //--------------------------------------------------------------------------------------- Opening

  /**
   * The dump a file gets: its memory for an Intel HEX, its bytes for anything else.
   * @param {string} name  what the bytes are called, which says how to read them
   * @param {Uint8Array} bytes
   * @returns {string} text for `Code` under the `dump` language
   */
  function text(name, bytes) {
    if(Kind.ext(name) === "hex") return intelHex(new TextDecoder().decode(bytes));
    return hexdump(bytes);
  }

  /**
   * A gzip opened, in the browser's own inflater.
   * @param {Uint8Array} bytes
   * @returns {Promise<Uint8Array>}
   */
  async function gunzip(bytes) {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  return { text, gunzip };
})();
