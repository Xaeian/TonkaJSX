// scripts/Codes.jsx

// a sample per language `Syntax` paints, in the order the picker offers them
const SAMPLES = {
  json: `{
  "name": "tonka",
  "port": 8080,
  "debug": true,
  "note": "a colon: inside a string"
}`,
  ini: `; a comment
[server]
host = 127.0.0.1
port = 8000
debug = true`,
  yaml: `---
name: tonka   # a comment
port: 8080
path: a#b
debug: true`,
  csv: `id,name,city,score
1,Ada,Warszawa,98
2,Kai,Kraków,71
3,Mel,Gdańsk,84`,
  sql: `-- SELECT is a keyword here, not there
SELECT id, name FROM users
WHERE city = 'select me'
ORDER BY name;`,
  md: `# Title

A paragraph with **bold**, ~~struck~~ and \`code\`.

- one
  - one inside it
- two

- [x] a box ticked
- [ ] one to tick

> a quote
[link](https://tonkajsx.com)

| fruit | count |
|:------|------:|
| apples | 12 |
| pears | 7 |

![Tonka](tonka.svg)

\`\`\`c
#include <stdint.h>
uint8_t count = 0x0F; // a comment
\`\`\``,
  log: `2026-04-18 09:12:04 INFO  ready on :8000
2026-04-18 09:12:31 WARN  slow query, 840ms
2026-04-18 09:13:02 ERROR upstream refused`,
  c: `#include <stdint.h>
#include <stdio.h>

// a counter that wraps after 255
static uint8_t count = 0;

void tick(void) {
  if(++count == 0) puts("wrapped");
}`,
  cpp: `#include <vector>

class Stack {
public:
  void push(int value) { items.push_back(value); }
  bool empty() const { return items.empty(); }
private:
  std::vector<int> items;
};`,
  js: `// a greeting for whoever loads it
const greet = (name) => \`Hello, \${name}!\`;

export async function load(url) {
  const res = await fetch(url);
  return res.ok ? res.json() : null;
}`,
  py: `@dataclass
class Point:
  x: float = 0.0
  y: float = 0.0

def norm(p: Point) -> float:
  """Distance from the origin."""
  return (p.x ** 2 + p.y ** 2) ** 0.5`,
  sh: `#!/bin/sh
# copy every page next to the server
for f in dist/*.html; do
  cp "$f" "$TARGET/" --verbose
done`,
  rust: `#[derive(Debug)]
struct Point { x: f64, y: f64 }

fn main() {
  let p = Point { x: 3.0, y: 4.0 };
  println!("{:?} is {} away", p, (p.x * p.x + p.y * p.y).sqrt());
}`,
  html: `<!-- a card with a link -->
<div class="card">
  <a href="https://tonkajsx.com" target="_blank">TonkaJSX</a>
</div>`,
  css: `/* a card that lifts on hover */
.card {
  padding: 12px;
  border-radius: 6px;
  color: #569cd6;
}
@media (max-width: 720px) {
  .card { padding: 8px; }
}`,
  dump: `# Intel HEX: 1 segment, 32B, entry 0x08000199
! line 5: bad checksum E3, expected E1
@ 08000000-0800001f  32B
08000000  00 50 00 20 99 01 00 08  6d 0d 00 08 71 0d 00 08  |.P. ....m...q...|
08000010  54 6f 6e 6b 61 4a 53 58  00 00 00 00 ff ff ff ff  |TonkaJSX........|`,
};

const Codes = () => {
  //------------------------------------------------------------------------------------- Languages

  const langBox = <Code height="md" lang="json" value={SAMPLES.json} readOnly />;
  const langPick = (
    <Select value="json" onChange={(id) => { langBox.lang = id; langBox.value = SAMPLES[id]; }}>
      {Object.keys(SAMPLES).map(id => <option value={id}>{id}</option>)}
    </Select>
  );

  //--------------------------------------------------------------------------------------- Writing

  const editBox = <Code height="sm" lang="conf.ini" value={SAMPLES.ini} />;
  const readTgl = <ActiveBtn icon="lock" size="sm"
    onChange={(on) => { editBox.readOnly = on; }}>read only</ActiveBtn>;

  //------------------------------------------------------------------------------------------ View

  return (
    <Panel title="Code">
      <p>
        Source in its own colours, over a field that stays the browser's own.
        A file name is enough: <code>Syntax.lang</code> reads the extension off it.
        A language nothing paints comes back escaped, which is all a plain file needs.
      </p>

      <h4>Languages</h4>
      <row>{langPick}</row>
      {langBox}

      <h4>Rainbow columns</h4>
      <p>
        A column's colour comes from its place in the row, so the eye follows it down the page.
        The separator is sniffed from the first line, and a comma inside quotes stays in its field.
      </p>
      <Code height="sm" lang="table.csv" readOnly
        value={`name,note,size\n"Ada, Lovelace",first,98\nKai,"a ""quoted"" note",71`} />

      <h4>Reading and writing</h4>
      <p>
        Without <code>readOnly</code> the text is yours to change;
        Tab indents instead of leaving the field.
      </p>
      <row>{readTgl}</row>
      {editBox}

      <h4>In a dialog</h4>
      <p>
        <code>Code.open(name, text)</code> shows a file.
        Given <code>onSave</code> it gains a Save, and closing with unsaved text asks first.
      </p>
      <row gap="sm">
        <Button icon="visibility"
          onClick={() => Code.open("notes.md", SAMPLES.md)}>Read a file</Button>
        <Button icon="edit" onClick={() => Code.open("query.sql", SAMPLES.sql, {
          onSave: (text) => Alert.ok(`Saved ${text.length} characters`),
        })}>Edit a file</Button>
      </row>

      <h4>Markdown</h4>
      <p>
        A <code>Markdown</code> shows the page rather than its source:
        headings, lists, quotes, links, tables, pictures, and fences painted in their language.
        A picture opens full size on a click; <code>image</code> turns its name into an address.
        Lines join as in a readme, or keep their breaks with <code>breaks</code>, as in a note.
        A <code>[ ]</code> box ticks on a click once <code>onCheck</code> takes the new text.
      </p>
      <Markdown height="sm" text={SAMPLES.md}
        onCheck={(text) => Alert.inf(`${text.split("[x]").length - 1} boxes ticked`)} />
    </Panel>
  );
};
