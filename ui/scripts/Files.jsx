// scripts/Files.jsx

// a listing as a server hands one over: names and weights in bytes, one per way a file opens
const LISTING = [
  ["photo.jpg", 2300000],
  ["report.pdf", 860000],
  ["notes.md", 1400],
  ["app.ini.bak", 320],
  ["backup.tar.gz", 5600000],
  ["blink.hex", 2100],
  ["film.mp4", 94000000],
];

// the head of a firmware image: its first vectors, then a name and erased flash
const FIRMWARE = Uint8Array.from([
  0x00, 0x50, 0x00, 0x20, 0x99, 0x01, 0x00, 0x08, 0x6d, 0x0d, 0x00, 0x08, 0x71, 0x0d, 0x00, 0x08,
  0x75, 0x0d, 0x00, 0x08, 0x79, 0x0d, 0x00, 0x08, 0x7d, 0x0d, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00,
  0x54, 0x6f, 0x6e, 0x6b, 0x61, 0x4a, 0x53, 0x58, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff,
]);

const Files = () => {
  const rows = LISTING.map(([name, bytes]) => ({
    name, bytes,
    glyph: <span class="icon" translate={false} color={Kind.color(name)}>{Kind.icon(name)}</span>,
    size: Kind.sizeText(bytes),
    opens: Kind.opens(name, bytes),
  }));

  return (
    <Panel title="Files">
      <h4>What a name says</h4>
      <p>
        <code>Kind</code> reads a file name: the glyph it wears, the colour of that glyph
        and how it opens, past a copy's <code>.bak</code>.
        Weights are SI, from <code>Kind.sizeText</code>.
        The table is a <code>Table</code>: numbers to the right, a <code>null</code> in grey.
      </p>
      <Table columns={["name", "glyph", "bytes", "size", "opens"]} rows={rows} />

      <h4>Rows</h4>
      <p>
        A <code>FileRow</code> is a file in a list: its glyph and colour, its name, its weight
        and what follows, such as a date.
        A <code>FileThumb</code> before the name shows a picture, and every row is as tall as one.
      </p>
      <list>
        <FileRow name="tonka.svg" size={1689} meta={<span tone="meta">2026-04-21</span>}>
          <FileThumb name="tonka.svg" src="tonka.svg"
            onClick={() => Lightbox.open("tonka.svg")} />
          <span>tonka.svg</span>
        </FileRow>
        <FileRow name="report.pdf" size={860000} meta={<span tone="meta">2026-10-02</span>}
          actions={<IconBtn icon="download" variant="ghost" size="sm" title="Download"
            onClick={() => Alert.ok("report.pdf downloaded")} />}>
          <span>report.pdf</span>
        </FileRow>
        <FileRow name="LICENSE">
          <span>LICENSE</span>
        </FileRow>
      </list>

      <h4>Bytes</h4>
      <p>
        <code>Dump.text(name, bytes)</code> writes bytes out to read,
        an offset and sixteen of them as hex and as text, for a <code>Code</code> to paint.
        An Intel HEX comes out as the memory its records describe.
      </p>
      <Code lang="dump" readOnly height="6rem" value={Dump.text("boot.bin", FIRMWARE)} />
    </Panel>
  );
};
