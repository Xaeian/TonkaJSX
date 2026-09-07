// scripts/Menus.jsx

const ACTIONS = [
  ["post_add", "New document"],
  ["upload_file", "Upload"],
  ["share", "Share link"],
  ["archive", "Archive"],
];

const PLACEMENTS = [
  ["arrow_forward", "right-top"],
  ["arrow_downward", "bottom-start"],
  ["arrow_downward", "bottom-end"],
  ["arrow_upward", "top"],
  ["auto_awesome", "auto"],
];

const Menus = () => {

  //--------------------------------------------------------------------------------------- Actions

  const actions = (
    <Menu title="Document">
      <stack gap="xs">
        {ACTIONS.map(([icon, label]) => (
          <Panel inline ghost glow pointer icon={icon}
            onClick={() => { Alert.ok(label); actions.close(); }}>
            {label}
          </Panel>
        ))}
      </stack>
    </Menu>
  );

  //------------------------------------------------------------------------------------ Quick note

  const note = (
    <Textarea auto minRows={3} maxRows={6} placeholder="Write a note, Ctrl+Enter saves"
      onSubmit={saveNote} />
  );
  function saveNote() {
    if(!note.value.trim()) { Alert.wrn("Note is empty"); return; }
    Alert.ok(`Saved ${note.value.length} characters`);
    note.value = "";
    noteMenu.close();
  }
  const noteMenu = (
    <Menu title="Quick note" width="280px">
      <stack gap="sm">
        {note}
        <row justify="end">
          <Button variant="primary" icon="check" size="sm" onClick={saveNote}>Save</Button>
        </row>
      </stack>
    </Menu>
  );

  //--------------------------------------------------------------------------------------- Filters

  const filterMenu = (
    <Menu title="Filters">
      <stack gap="xs">
        <Checkbox label="Archived" />
        <Checkbox label="Drafts" checked />
        <Checkbox label="Mine only" />
        <Checkbox label="Last 30 days" checked />
        <sep />
        <row justify="end">
          <Button variant="primary" size="sm" icon="check" onClick={() => filterMenu.close()}>
            Apply
          </Button>
        </row>
      </stack>
    </Menu>
  );

  //------------------------------------------------------------------------------------- Placement

  const placed = (pos) => (
    <Menu title={pos} pos={pos}>
      <span>
        Anchored <code>{pos}</code>.
        It flips to the other side when viewport ends.
      </span>
    </Menu>
  );
  const shared = (
    <Menu title="Shared">
      <span>One menu, two anchors: it moves to whichever button opened it.</span>
    </Menu>
  );

  // button opens menu against itself
  const trigger = (btn, menu) => {
    btn.addEventListener("click", () => menu.toggle(btn));
    return btn;
  };

  //------------------------------------------------------------------------------------------ View

  return (
    <Panel title="Menus">
      <p>
        A menu is a popup anchored to whatever opened it.
        Escape, a click outside or a second click on anchor closes it;
        first field inside gets focus.
      </p>

      <h4>Content</h4>
      <row>
        {trigger(<Button variant="primary" icon="bolt">Actions</Button>, actions)}
        {trigger(<Button icon="edit_note">Quick note</Button>, noteMenu)}
        {trigger(<Button icon="filter_list">Filters</Button>, filterMenu)}
      </row>

      <h4>Placement</h4>
      <row>
        {PLACEMENTS.map(([icon, pos]) => (
          trigger(<Button size="sm" icon={icon}>{pos}</Button>, placed(pos))
        ))}
      </row>

      <h4>Shared instance</h4>
      <row>
        {trigger(<Button size="sm" icon="link">Anchor A</Button>, shared)}
        {trigger(<Button size="sm" icon="link">Anchor B</Button>, shared)}
      </row>
    </Panel>
  );
};
