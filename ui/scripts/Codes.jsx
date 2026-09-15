// scripts/Codes.jsx

const SAMPLES = {
  json: `{
  "name": "tonka",
  "port": 8080,
  "debug": true,
  "note": "a colon: inside a string"
}`,
  csv: `id,name,city,score
1,Ada,Warszawa,98
2,Kai,Kraków,71
3,Mel,Gdańsk,84`,
  md: `# Title

A paragraph with **bold** and \`code\`.

- one
- two

> a quote
[link](https://tonkajsx.com)`,
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
  sql: `-- SELECT is a keyword here, not there
SELECT id, name FROM users
WHERE city = 'select me'
ORDER BY name;`,
  log: `2026-04-18 09:12:04 INFO  ready on :8000
2026-04-18 09:12:31 WARN  slow query, 840ms
2026-04-18 09:13:02 ERROR upstream refused`,
};

const Codes = () => {
  //------------------------------------------------------------------------------------- Languages

  const langBox = <Code height="md" lang="json" value={SAMPLES.json} readOnly />;
  const langPick = (
    <Toggle value="json" onChange={(v) => { langBox.lang = v; langBox.value = SAMPLES[v]; }}>
      {Object.keys(SAMPLES).map((id) => <ToggleBtn value={id} label={id} />)}
    </Toggle>
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
      <row gap="sm">{langPick}</row>
      <row>{langBox}</row>

      <h4>Rainbow columns</h4>
      <p>
        A column takes its colour from its place in the row, so the eye follows one down the
        page. The separator is sniffed from the first line, and a comma inside quotes stays
        inside its field.
      </p>
      <row>
        <Code height="sm" lang="table.csv" readOnly
          value={'name,note,size\n"Ada, Lovelace",first,98\nKai,"a ""quoted"" note",71'} />
      </row>

      <h4>Reading and writing</h4>
      <p>
        Without <code>readOnly</code> the text is yours to change; Tab indents instead of
        leaving the field.
      </p>
      <row gap="sm">{readTgl}</row>
      <row>{editBox}</row>

      <h4>In a dialog</h4>
      <p>
        <code>Code.open(name, text)</code> shows a file.
        Give it <code>onSave</code> and it gains a Save, and closing with unsaved text asks
        first.
      </p>
      <row gap="sm">
        <Button icon="visibility"
          onClick={() => Code.open("notes.md", SAMPLES.md)}>Read a file</Button>
        <Button icon="edit" onClick={() => Code.open("query.sql", SAMPLES.sql, {
          onSave: (text) => Alert.ok(`Saved ${text.length} characters`),
        })}>Edit a file</Button>
      </row>
    </Panel>
  );
};
