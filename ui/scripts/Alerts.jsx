// scripts/Alerts.jsx

const LONG = "This is one of those deliberately long alert messages that spills onto "
  + "several lines the moment horizontal space gets tight, and still keeps its icon and "
  + "its close button in place instead of collapsing into a cramped mess.";

const Alerts = () => {
  const msgIn = <Input placeholder="Your own message" value="Disk almost full" />;

  return (
    <Panel title="Alerts">
      <p>
        Toasts stack above footer.
        Firing the same message again refreshes its timer instead of adding a copy.
      </p>
      <h4>Types</h4>
      <row>
        <Button icon="info" onClick={() => Alert.inf("Refreshed")}>inf</Button>
        <Button icon="check_circle" onClick={() => Alert.ok("Saved")}>ok</Button>
        <Button icon="warning" onClick={() => Alert.wrn(msgIn.value || "Empty message")}>
          wrn
        </Button>
        <Button variant="danger" icon="error" onClick={() => Alert.err("Connection lost")}>
          err
        </Button>
        {msgIn}
      </row>

      <h4>Timing</h4>
      <row>
        <Button onClick={() => Alert.inf("Quick flash", 800)}>800 ms</Button>
        <Button onClick={() => Alert.ok("Sticky until dismissed", 0)}>Sticky</Button>
        <Button icon="wrap_text" onClick={() => Alert.inf(LONG, 6000)}>Long text</Button>
        <Button icon="clear_all" variant="ghost" onClick={() => Alert.clear()}>
          Clear all
        </Button>
      </row>

      <h4>Ask</h4>
      <p>
        <code>Alert.ask</code> returns a promise:
        check confirms, Escape or X cancels.
      </p>
      <row>
        <Button variant="danger" icon="delete" onClick={async () => {
          const yes = await Alert.ask("err", "Delete 3 files? This cannot be undone.");
          if(yes) Alert.ok("Deleted");
          else Alert.inf("Kept");
        }}>Delete files</Button>
        <Button variant="primary" icon="cookie" onClick={async () => {
          const icons = { ok: "thumb_up", cancel: "thumb_down" };
          const yes = await Alert.ask("inf", "Accept all cookies?", icons);
          Alert.ok(yes ? "Cookies accepted" : "Only necessary ones");
        }}>Cookie consent</Button>
      </row>

      <h4>Stack limit</h4>
      <row>
        <span tone="meta">Max visible:</span>
        <Toggle value="5" onChange={(v) => Alert.config({ max: Number(v) })}>
          <ToggleBtn value="3" label="3" />
          <ToggleBtn value="5" label="5" />
          <ToggleBtn value="10" label="10" />
        </Toggle>
        <Button icon="stacks" onClick={() => {
          for(let i = 1; i <= 6; i++) Alert.inf(`Message ${i} of 6`, 4000);
        }}>Fire six</Button>
      </row>
    </Panel>
  );
};
