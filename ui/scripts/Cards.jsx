// scripts/Cards.jsx

const STATES = ["selected", "armed", "confirm", "moved", "danger", null];

const Cards = () => {

  //------------------------------------------------------------------------ Click cycles state

  const stateTag = <Badge variant="tint" mono>state: none</Badge>;
  const cycler = (
    <Panel inline pointer stripe color="blue" icon="touch_app" actions={stateTag}
      onClick={() => {
        const next = STATES[(STATES.indexOf(cycler.state) + 1) % STATES.length];
        cycler.state = next;
        stateTag.text = `state: ${next || "none"}`;
      }}>
      <strong>Click me</strong>
      <span>each click moves to next state</span>
    </Panel>
  );

  //------------------------------------------------------------------------------ Single selection

  const USERS = [
    ["red", "shield_person", "alice", "admin"],
    ["amber", "verified_user", "bob", "moderator"],
    ["green", "person", "carol", "member"],
    ["blue", "person", "dave", "guest"],
  ];
  const pickedTag = <Badge variant="tint" color="neutral">nobody</Badge>;
  let picked = null;
  const userRows = USERS.map(([color, icon, name, role]) => {
    const row = (
      <Panel inline pointer glow stripe color={color} icon={icon} onClick={() => {
        if(picked) picked.selected = false;
        picked = picked === row ? null : row;
        if(picked) picked.selected = true;
        pickedTag.text = picked ? name : "nobody";
        pickedTag.color = picked ? color : "neutral";
      }}>
        <strong>{name}</strong>
        <Badge color={color} variant="tint">{role}</Badge>
      </Panel>
    );
    return row;
  });

  //------------------------------------------------------------------------------------------ View

  return (
    <Panel title="Cards and rows">
      <p>
        An inline panel is one row: icon, content, actions.
        Everything below is the same component with different flags.
      </p>

      <h4>Stripe and color</h4>
      <row split>
        <Panel inline stripe color="red" icon="shield_person">
          <strong>alice</strong>
          <Badge color="red" variant="tint">admin</Badge>
        </Panel>
        <Panel inline stripe color="amber" icon="verified_user">
          <strong>bob</strong>
          <Badge color="amber" variant="tint">moderator</Badge>
        </Panel>
        <Panel inline stripe tint color="green" icon="person">
          <strong>carol</strong>
          <Badge color="green" variant="tint">tint</Badge>
        </Panel>
      </row>

      <h4>Ghost, dashed, hover</h4>
      <row split>
        <Panel inline ghost glow pointer icon="folder"
          onClick={() => Alert.inf("Opening documents")}>
          <strong>documents</strong>
          <span tone="meta">ghost + glow</span>
        </Panel>
        <Panel inline dashed glow flash pointer icon="person_add"
          onClick={() => Alert.inf("Add user")}>
          Add user
        </Panel>
        <Panel inline stripe flash pointer icon="link"
          onClick={() => Alert.inf("Copied link")}>
          <strong>flash</strong>
          <span>hover lights icon</span>
        </Panel>
      </row>

      <h4>Two lines and actions</h4>
      <Panel inline stack stripe color="red" icon="shield_person"
        actions={<>
          <IconBtn icon="edit" variant="ghost" title="Edit"
            onClick={() => Alert.inf("Edit alice")} />
          <IconConfirmBtn variant="ghost" onConfirm={() => Alert.ok("alice deleted")} />
        </>}>
        <row gap="sm">
          <strong>alice</strong>
          <Badge color="red" variant="tint">admin</Badge>
        </row>
        <row gap="sm" tone="meta">
          <span>alice@example.com</span>
          <sep />
          <span>last login 2h ago</span>
        </row>
      </Panel>

      <h4>Columns</h4>
      <p>Rows with <code>flex</code> weights give table-like columns; long text truncates.</p>
      <stack gap="sm">
        <Panel inline stripe color="red" icon="key">
          <row>
            <strong flex="2">API_KEY</strong>
            <span flex="11">sk-proj-abc123def456ghi789</span>
            <i flex="7">production, do not share</i>
          </row>
        </Panel>
        <Panel inline stripe color="amber" icon="lan">
          <row>
            <strong flex="2">DB_HOST</strong>
            <span flex="11">postgres.prod.example.com</span>
            <i flex="7">primary db</i>
          </row>
        </Panel>
        <Panel inline stripe color="green" icon="link">
          <row>
            <strong flex="2">URL</strong>
            <span flex="11">https://staging.example.com</span>
            <i flex="7">auto-deploy from main</i>
          </row>
        </Panel>
      </stack>

      <h4>States</h4>
      <p>One at a time: <code>state="selected|armed|confirm|moved|danger"</code>.</p>
      {cycler}
      <row split>
        <Panel inline stripe color="amber" state="armed">
          <Badge variant="tint" color="wrn">armed</Badge>
        </Panel>
        <Panel inline stripe color="red" state="confirm">
          <Badge variant="tint" color="err">confirm</Badge>
        </Panel>
        <Panel inline stripe color="green" state="moved">
          <Badge variant="tint" color="ok">moved</Badge>
        </Panel>
        <Panel inline stripe color="red" state="danger">
          <Badge variant="tint" color="err">danger</Badge>
        </Panel>
      </row>

      <h4>Selection</h4>
      <row>
        <span tone="meta">Click a row, click again to clear. Selected:</span>
        {pickedTag}
      </row>
      {userRows}
    </Panel>
  );
};
