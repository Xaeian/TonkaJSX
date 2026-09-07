// scripts/Checks.jsx

const Checks = () => {
  const channels = [
    { label: "Email",  icon: "mail",          on: true },
    { label: "Push",   icon: "notifications", on: true },
    { label: "SMS",    icon: "sms",           on: false },
    { label: "Digest", icon: "newspaper",     on: false },
  ];
  for(const c of channels) c.box = <Checkbox label={c.label} checked={c.on} onChange={sync} />;

  const summary = <Badge variant="tint" color="ok">2 channels</Badge>;
  function sync() {
    const on = channels.filter(c => c.box.checked);
    summary.text = on.length ? on.map(c => c.label).join(", ") : "nothing";
    summary.color = on.length ? "ok" : "neutral";
  }
  sync();
  const setAll = (v) => {
    for(const c of channels) c.box.checked = v;
    sync();
  };

  return (
    <Panel title="Checkboxes">
      <p>
        Label toggles box too.
        Reading and writing <code>.checked</code> never fires <code>onChange</code>,
        so bulk updates call one sync at the end.
      </p>
      <h4>Notify me by</h4>
      <row>{channels.map(c => c.box)}</row>
      <row>
        <span tone="meta">Selected:</span>
        {summary}
        <spacer />
        <Button size="sm" icon="done_all" onClick={() => setAll(true)}>All</Button>
        <Button size="sm" icon="remove_done" onClick={() => setAll(false)}>None</Button>
      </row>

      <h4>States</h4>
      <row>
        <Checkbox label="Unchecked" />
        <Checkbox label="Checked" checked />
        <Checkbox label="Disabled" disabled />
        <Checkbox label="Disabled, checked" disabled checked />
        <Checkbox title="No label at all" />
      </row>
    </Panel>
  );
};
