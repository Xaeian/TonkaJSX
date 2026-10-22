// scripts/Hero.jsx

// the code of the row it stands under, as a reader writes it
const HELLO = `const name = <Input icon="person" placeholder="Your name" value="World"
  onChange={(v) => { greeting.text = \`Hello, \${v || "World"}!\`; }} />;
const greeting = <Badge color="ok" variant="tint" size="lg">Hello, World!</Badge>;

<row>
  {name}
  <Button variant="primary" icon="waving_hand" onClick={() => Alert.ok(greeting.text)}>
    Say hi
  </Button>
  {greeting}
</row>`;

const Hero = () => {
  const name = <Input icon="person" placeholder="Your name" value="World"
    onChange={(v) => { greeting.text = `Hello, ${v || "World"}!`; }} />;
  const greeting = <Badge color="ok" variant="tint" size="lg">Hello, World!</Badge>;

  return (
    <Panel title="Welcome" icon="home">
      <p>
        <b>{{title}}</b> is a small component kit for <b>TonkaJSX</b>: real DOM elements,
        no virtual DOM, no framework.
        Layout is written as tags with attributes, state lives on elements.
      </p>

      <h4>Try it</h4>
      <row>
        {name}
        <Button variant="primary" icon="waving_hand" onClick={() => Alert.ok(greeting.text)}>
          Say hi
        </Button>
        {greeting}
      </row>
      <Code lang="jsx" readOnly height="16rem" value={HELLO} />

      <h4>How it works</h4>
      <stack gap="xs">
        <Panel inline ghost icon="code">
          Every panel in the rail is one small <code>.jsx</code> file.
          Read it, copy it, change it.
        </Panel>
        <Panel inline ghost icon="tune">
          Components expose mutators,
          like <code>badge.text</code>, <code>panel.state</code> and <code>btn.loading</code>.
        </Panel>
        <Panel inline ghost icon="view_quilt">
          Layout is tags with attributes, like a row with a gap or a span with a flex weight.
          App writes no CSS.
        </Panel>
        <Panel inline ghost icon="contrast">
          Light and dark come from <code>light-dark()</code> tokens.
          The button at the foot of the rail flips them.
        </Panel>
      </stack>
    </Panel>
  );
};
