const Usage = () => (
  <Section title="Usage">
    <div class="code-block">
      <code>$ tonka serve [&lt;project&gt;] [--port|-p &lt;port&gt;]</code>
      <code>$ tonka build [&lt;project&gt;] [--inline-remote|-i]</code>
    </div>
    <ul>
      <li>Server and build work on the chosen project. Skip the name and it picks the first one.</li>
      <li>If built, <code>index.html</code> exists and the server serves it.</li>
      <li>Otherwise the server uses <code>main.html</code> and injects styles from <code>styles/</code> and scripts from <code>scripts/</code>.</li>
      <li>Script order: <code>.js</code> first, then <code>.jsx</code>. Deeper folders load before parents.</li>
      <li>All other files are served as static assets.</li>
      <li>Use <code>--inline-remote</code> to embed CDN resources for offline use.</li>
    </ul>
  </Section>
);