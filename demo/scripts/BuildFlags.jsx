const Flag = ({ flag, long, desc }) => (
  <tr>
    <td><code>{flag}</code></td>
    <td><code>{long}</code></td>
    <td>{desc}</td>
  </tr>
);

const BuildFlags = () => (
  <Section title="Build Flags">
    <p class="subdesc">
      All flags are optional. Without them, build works the same as before.
      <code>-t</code> and <code>-l</code> imply <code>-f</code>.
    </p>
    <div class="table-wrap">
      <table class="flags">
        <thead><tr><th>Flag</th><th>Long</th><th>Description</th></tr></thead>
        <tbody>
          <Flag flag="-i" long='--inline-remote' desc="Inline remote CSS/JS from CDN" />
          <Flag flag="-f" long='--fonts' desc="Drop unused @font-face, inline rest as base64" />
          <Flag flag="-s" long='--svg' desc="Inline SVGs as data URIs (optimized with SVGO)" />
          <Flag flag="-c" long='--compress' desc="Generate .gz + .br alongside index.html" />
          <Flag flag="-t" long='--subset-text "…"' desc="Subset text font to chars found in source" />
          <Flag flag="-l" long='--subset-ligature "…"' desc="Subset icon font to ligatures found in source" />
        </tbody>
      </table>
      <div class="code-block" style="margin-top:10px">
        <code>$ tonka build -i -f -s -c -l "Material Symbols"</code>
      </div>
    </div>
  </Section>
);
