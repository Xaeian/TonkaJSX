// scripts/Cards.jsx

// every state a Panel can stand in
const STATES = ["selected", "armed", "moved", "danger", "done"];

// cards of uneven heights, so the columns show they keep their own
const COLUMN_CARDS = [
  ["blue", "Monday", ["standup", "review"]],
  ["green", "Tuesday", ["release"]],
  ["amber", "Wednesday", ["design", "budget", "call with the client", "notes"]],
  ["red", "Thursday", ["outage drill"]],
  ["purple", "Friday", ["retro", "deploy"]],
];

const Cards = () => {

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
      <Panel inline pointer glow stripe tint={name === "dave"} color={color} icon={icon}
        onClick={() => {
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

      <h4>Stripe, colour and selection</h4>
      <p>
        A <code>stripe</code> wears the row's <code>color</code>.
        On dave's row <code>tint</code> mutes it.
        A click selects a row, a second one clears it.
      </p>
      <row>
        <span tone="meta">Selected:</span>
        {pickedTag}
      </row>
      {userRows}

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
      <p>
        A click on the row opens it, a click among its actions stays theirs.
        The <code>title</code> of an inline row is its tooltip.
      </p>
      <Panel inline stack stripe pointer glow color="red" icon="shield_person" title="Open alice"
        onClick={() => Alert.inf("Opening alice")}
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

      <h4>States</h4>
      <p>
        A <code>state</code> tints a panel, and <code>done</code> fades one that is finished.
        From code, <code>panel.state = "armed"</code> sets one and <code>null</code> clears it.
      </p>
      <row split>
        {STATES.map(state => (
          <Panel inline stripe color="blue" state={state}><code>{state}</code></Panel>
        ))}
      </row>

      <h4>Columns</h4>
      <p>
        A <code>Columns</code> opens one more column at each of its <code>breaks</code>:
        two from 600px of its width, three from 900px.
        Each card joins the shortest column on its turn and keeps it while it grows.
      </p>
      <Columns breaks={[600, 900]} gap="sm">
        {COLUMN_CARDS.map(([color, title, lines]) => (
          <Panel compact stripe color={color} title={title}>
            <stack gap="xs">{lines.map(line => <span>{line}</span>)}</stack>
          </Panel>
        ))}
      </Columns>
    </Panel>
  );
};
