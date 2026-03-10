const EXAMPLE_INI = `title = TonkaJSX
accent = #d8a57f
[serve]
foot = Serve
[build]
foot = Build
`

const Usage = () => {
  const el = (
    <Section title="Usage">
      <p class="subdesc">Start demo/project with <code>tonka serve</code> and build deploy version with <code>tonka build</code></p>
      <div class="code-block">
        <code>$ tonka serve [&lt;project&gt;] [--port|-p &lt;port&gt;]</code>
        <code>$ tonka build [&lt;project&gt;] [--inline-remote|-i]</code>
      </div>
      <ul>
        <li>Server and build work on the chosen project. Skip the name and it picks the first one.</li>
        <li>If the project contains <code>app.ini</code>, variables are replaced in JS/JSX/CSS/HTML using double-brace syntax. Top-level values are shared; <code>[serve]</code> and <code>[build]</code> sections override per mode.</li>
      </ul>
      <pre class="code-block"><code class="language-ini">{EXAMPLE_INI}</code></pre>
      <ul>
        <li>If built, <code>index.html</code> exists and the server serves it.</li>
        <li>Otherwise the server uses <code>app.html</code> and injects styles from <code>styles/</code> and scripts from <code>scripts/</code>.</li>
        <li>Script order: <code>.js</code> first, then <code>.jsx</code>. Deeper folders load before parents.</li>
        <li>All other files are served as static assets.</li>
        <li>Use <code>--inline-remote</code> to embed CDN resources for offline use.</li>
      </ul>
    </Section>
  );
  JSX.onMount(el, () => Prism.highlightAll());
  return el;
};
