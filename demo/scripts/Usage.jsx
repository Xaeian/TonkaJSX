// Literal double brace, built at runtime so vars substitution never matches it
const DB = String.fromCharCode(123, 123);

const EXAMPLE_INI = `title = TonkaJSX
accent = #d8a57f
[serve]
foot = Serve
[build]
foot = Build ${DB}date}}
`

const Usage = () => {
  const el = (
    <Section title="Usage">
      <p class="subdesc">Start demo/project with <code>tonka serve</code> and build deploy version with <code>tonka build</code></p>
      <div class="code-block">
        <code>$ tonka serve [&lt;project&gt;] [--port|-p &lt;port&gt;] [--remove|-r]</code>
        <code>$ tonka build [&lt;project&gt;] [options]</code>
      </div>
      <ul>
        <li>Server and build work on the chosen project. Skip the name and it picks the first one.</li>
        <li>If the project contains <code>app.ini</code>, variables are replaced in JS/JSX/CSS/HTML using double-brace syntax. Top-level values are shared; <code>[serve]</code> and <code>[build]</code> sections override per mode.</li>
        <li>Built-in <code>{DB + "date}}"}</code> and <code>{DB + "time}}"}</code> are always available, and values may reference other vars.</li>
      </ul>
      <pre class="code-block"><code class="language-ini">{EXAMPLE_INI}</code></pre>
      <ul>
        <li>If built, <code>index.html</code> exists and the server serves it.</li>
        <li>Otherwise the server uses <code>app.html</code> and injects styles from <code>styles/</code> and scripts from <code>scripts/</code>.</li>
        <li>With <code>--remove</code>/<code>-r</code> the server deletes a built <code>index.html</code> first, so you're sure it serves the app you're editing.</li>
        <li>Script order: <code>.js</code> first, then <code>.jsx</code>. Deeper folders load before parents.</li>
        <li>All other files are served as static assets.</li>
      </ul>
    </Section>
  );
  JSX.onMount(el, () => Prism.highlightAll());
  return el;
};
