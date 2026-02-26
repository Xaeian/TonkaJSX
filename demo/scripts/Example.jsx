const EXAMPLE_CODE = `const Greeting = ({ name }) => (
  <div class="greeting">
    <h1>Hello {name}!</h1>
    <p>This is a component.</p>
  </div>
);
const App = () => (
  <div>
    <Greeting name="World" />
    <Greeting name="TonkaJSX" />
  </div>
);
document.body.appendChild(<App />);`

const Example = () => {
  const el = (
    <Section title="Example">
      <p class="subdesc">No imports, no modules, just global components composed with JSX.</p>
      <pre class="code-block"><code class="language-jsx">{EXAMPLE_CODE}</code></pre>
    </Section>
  );
  setTimeout(() => Prism.highlightAll(), 0);
  return el;
};