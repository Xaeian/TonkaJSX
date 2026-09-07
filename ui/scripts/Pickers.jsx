// scripts/Pickers.jsx

const ICONS = [
  "key", "lock", "badge", "verified", "account_circle", "mail", "credit_card", "phone",
  "wifi", "cloud", "database", "terminal", "rocket_launch", "build", "devices", "tag",
  "link", "business",
];

const Pickers = () => {
  // row below follows three controls
  const nameIn = (
    <Input icon="label" value="API Keys" placeholder="Name"
      onChange={(v) => { label.textContent = v || "Untitled"; }} />
  );
  const colorPick = <ColorPicker value="teal" gray onChange={(c) => { preview.color = c; }} />;
  const iconPick = (
    <IconPicker icons={ICONS} value="key" onChange={(ic) => { preview.icon = ic; }} />
  );
  const label = <strong>API Keys</strong>;
  const preview = (
    <Panel inline stripe color="teal" icon="key">
      {label}
      <span tone="meta">preview</span>
    </Panel>
  );

  return (
    <Panel title="Pickers">
      <p>
        Both pickers expose <code>.value</code> and fire <code>onChange</code> with name.
      </p>
      <h4>Category editor</h4>
      {nameIn}
      {colorPick}
      {iconPick}
      {preview}

      <h4>Sizes</h4>
      <row gap="lg" align="center">
        <ColorPicker size="sm" value="blue" />
        <ColorPicker size="lg" value="blue" />
      </row>
      <row gap="lg" align="center">
        <IconPicker size="sm" icons={ICONS.slice(0, 6)} value="key" />
        <IconPicker size="lg" icons={ICONS.slice(0, 6)} value="key" />
      </row>
    </Panel>
  );
};
