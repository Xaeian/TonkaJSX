// scripts/Usage.jsx

// Literal double brace, built at runtime so vars substitution never matches it
const DB = String.fromCharCode(123, 123);

const EXAMPLE_INI = `title = TonkaJSX
accent = "#d8a57f"
[serve]
foot = Serve
[build]
foot = Build ${DB}date}}
`;

const Usage = () => {
  const el = (
    <Section title="Usage">
      <p class="subdesc">
        Start demo/project with <code>tonka serve</code> and build
        deploy version with <code>tonka build</code>
      </p>
      <div class="code-block">
        <code>$ tonka serve [&lt;project&gt;] [--port|-p &lt;port&gt;] [--remove|-r]</code>
        <code>$ tonka build [&lt;project&gt;] [options]</code>
        <code>
          $ tonka deploy [&lt;project&gt;] [--worker|-w &lt;key&gt;] [--dry] [--remove|-r]
        </code>
        <code>$ tonka pipe [&lt;list&gt;] [--dry]</code>
        <code>$ tonka test [&lt;project&gt;]</code>
      </div>
      <p class="subdesc">
        <code>test</code>, <code>deploy</code> and <code>pipe</code> in depth:{" "}
        <a href="https://github.com/Xaeian/TonkaJSX/blob/main/pipeline.md">pipeline.md</a>
      </p>
      <ul>
        <li>
          Server and build work on chosen project. Skip name and it picks the first one.
          A name is a project of workspace;
          a path, <code>./site</code> or <code>C:/sites/site</code>, takes a project from anywhere.
        </li>
        <li>
          If project contains <code>app.ini</code>, variables are replaced in JS/JSX/CSS/HTML
          using double-brace syntax.
          Top-level values are shared; <code>[serve]</code> and <code>[build]</code> sections
          override per mode.
        </li>
        <li>
          Built-in <code>{DB + "date}}"}</code> and <code>{DB + "time}}"}</code> are always
          available, and values may reference other vars.
        </li>
        <li>
          A <code>#</code> or <code>;</code> after a value starts a comment,
          so a value holding one is quoted.
        </li>
      </ul>
      <pre class="code-block"><code class="language-ini">{EXAMPLE_INI}</code></pre>
      <ul>
        <li>If built, <code>index.html</code> exists and server serves it.</li>
        <li>
          Otherwise server uses <code>app.html</code> and injects
          styles from <code>styles/</code> and scripts from <code>scripts/</code>.
        </li>
        <li>
          With <code>--remove</code>/<code>-r</code> server deletes
          a built <code>index.html</code> first,
          so you're sure it serves the app you're editing.
        </li>
        <li>
          Script order: <code>.js</code> first, then <code>.jsx</code>.
          Deeper folders load before parents.
        </li>
        <li>All other files are served as static assets.</li>
      </ul>
    </Section>
  );
  JSX.onMount(el, () => Prism.highlightAll());
  return el;
};
