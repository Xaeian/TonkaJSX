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

/** Bytes a dump shows; what a file holds past that is said in a note rather than drawn. */
const DUMP_BYTES = 64 * 1024;

/** Size past which a file is left to download: the whole of it travels to show its head. */
const DUMP_FETCH_MAX = 8 * 1024 * 1024;

const _hex = (n, width) => n.toString(16).padStart(width, "0");

// a byte as text: itself where the eye can read it, a dot everywhere else
const _glyph = (b) => b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : ".";

// one row of sixteen from `at`, addressed as `base + at`
function _row(bytes, at, base) {
  const chunk = bytes.subarray(at, at + 16);
  const hex = [...chunk].map(b => _hex(b, 2));
  const left = hex.slice(0, 8).join(" ").padEnd(23);
  const right = hex.slice(8).join(" ").padEnd(23);
  return `${_hex(base + at, 8)}  ${left}  ${right}  |${[...chunk].map(_glyph).join("")}|`;
}

// rows for the first `limit` bytes; `[]` for none
function _rows(bytes, base, limit) {
  const out = [];
  for(let at = 0; at < Math.min(bytes.length, limit); at += 16) out.push(_row(bytes, at, base));
  return out;
}

/**
 * Raw bytes, the first `DUMP_BYTES` of them, a note first when that is not the whole.
 * @param {Uint8Array} bytes
 * @param {object} [opts]
 * @param {number} [opts.base=0] address of the first byte
 * @returns {string}
 */
function hexdump(bytes, { base = 0 } = {}) {
  const lines = [];
  if(!bytes.length) lines.push("# empty file");
  if(bytes.length > DUMP_BYTES) {
    lines.push(`# first ${sizeText(DUMP_BYTES)} of ${sizeText(bytes.length)}`);
  }
  lines.push(..._rows(bytes, base, DUMP_BYTES));
  return lines.join("\n");
}

//--------------------------------------------------------------------------------------- Intel HEX

// A record: `:` then bytes as hex pairs: the count, the address, the type, the data,
// and a checksum that brings the sum of every byte to zero.
// Types 02 and 04 move the base the addresses that follow are counted from,
// 03 and 05 name where execution starts, 01 ends it.
const HEX_RECORD = /^:([0-9a-f]{2})([0-9a-f]{4})([0-9a-f]{2})((?:[0-9a-f]{2})*)([0-9a-f]{2})$/i;

// how many faults a dump lists before it counts the rest
const FAULTS_SHOWN = 20;

/**
 * An Intel HEX as the memory it describes: a note naming its segments, its size and its entry,
 * each record the file got wrong, then every segment as a dump at its own address.
 * Records after the end record and data past the shown bytes are left out and said.
 * @param {string} text
 * @returns {string}
 */
function intelHex(text) {
  const chunks = [];
  const faults = [];
  let base = 0;
  let entry = null;
  let ended = false;
  const lineList = String(text).split(/\r?\n/);
  for(let i = 0; i < lineList.length && !ended; i++) {
    const line = lineList[i].trim();
    if(!line) continue;
    const m = line.match(HEX_RECORD);
    if(!m || Number.parseInt(m[1], 16) * 2 !== m[4].length) {
      faults.push(`! line ${i + 1}: not a record`);
      continue;
    }
    const raw = line.slice(1).match(/../g).map(h => Number.parseInt(h, 16));
    const sum = raw.reduce((n, b) => n + b, 0) & 0xff;
    if(sum) {
      const want = _hex((raw.at(-1) - sum) & 0xff, 2).toUpperCase();
      faults.push(`! line ${i + 1}: bad checksum ${m[5].toUpperCase()}, expected ${want}`);
      continue;
    }
    const addr = Number.parseInt(m[2], 16);
    const data = Uint8Array.from(raw.slice(4, -1));
    const value = data.length >= 2 ? (data[0] << 8) | data[1] : 0;
    switch(Number.parseInt(m[3], 16)) {
      case 0x00: chunks.push({ addr: base + addr, data }); break;
      case 0x01: ended = true; break;
      case 0x02: base = value << 4; break;
      case 0x03: entry = (value << 4) + ((data[2] << 8) | data[3]); break;
      case 0x04: base = value << 16; break;
      case 0x05: entry = ((value << 16) | (data[2] << 8) | data[3]) >>> 0; break;
      default: faults.push(`! line ${i + 1}: unknown record type ${m[3].toUpperCase()}`);
    }
  }
  // records in address order, and the ones that touch are one segment
  chunks.sort((a, b) => a.addr - b.addr);
  const segments = [];
  for(const c of chunks) {
    const last = segments.at(-1);
    if(last && last.addr + last.parts.length === c.addr) {
      last.parts.push(...c.data);
      continue;
    }
    segments.push({ addr: c.addr, parts: [...c.data] });
  }
  const total = segments.reduce((n, s) => n + s.parts.length, 0);

  const lines = [];
  if(!segments.length) lines.push("# Intel HEX: no data records");
  else {
    const what = `${segments.length} segment${segments.length === 1 ? "" : "s"}`;
    const where = entry === null ? "" : `, entry 0x${_hex(entry, 8)}`;
    lines.push(`# Intel HEX: ${what}, ${sizeText(total)}${where}`);
  }
  if(total > DUMP_BYTES) lines.push(`# first ${sizeText(DUMP_BYTES)} of ${sizeText(total)}`);
  if(!ended && (segments.length || faults.length)) lines.push("# no end record");
  lines.push(...faults.slice(0, FAULTS_SHOWN));
  if(faults.length > FAULTS_SHOWN) lines.push(`! and ${faults.length - FAULTS_SHOWN} more`);
  let left = DUMP_BYTES;
  for(const s of segments) {
    if(left <= 0) break;
    const bytes = Uint8Array.from(s.parts);
    lines.push(`@ ${_hex(s.addr, 8)}-${_hex(s.addr + bytes.length - 1, 8)}  ${bytes.length} B`);
    lines.push(..._rows(bytes, s.addr, left));
    left -= bytes.length;
  }
  return lines.join("\n");
}

//----------------------------------------------------------------------------------------- Opening

/**
 * The dump a file gets: its memory for an Intel HEX, its bytes for anything else.
 * @param {string} name what the bytes are called, which says how to read them
 * @param {Uint8Array} bytes
 * @returns {string} text for `Code` under the `dump` language
 */
function dump(name, bytes) {
  if(fileExt(name) === "hex") return intelHex(new TextDecoder().decode(bytes));
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
