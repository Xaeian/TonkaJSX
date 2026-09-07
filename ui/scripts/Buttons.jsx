// scripts/Buttons.jsx

/**
 * Buttons showcase.
 * `onClicks(n)` and `onItems(n)` report counters to shell (footer, sidebar badge);
 * both fire once with initial value.
 */
const Buttons = ({ onClicks, onItems }) => {
  let clicks = 0;
  let items = 3;
  const clicksTag = <Badge variant="outline" mono>0 clicks</Badge>;
  const itemsTag = <Badge variant="outline" mono>3 items</Badge>;
  const click = () => {
    clicks++;
    clicksTag.text = `${clicks} clicks`;
    onClicks?.(clicks);
  };
  const setItems = (n) => {
    items = Math.max(0, n);
    itemsTag.text = `${items} items`;
    onItems?.(items);
  };
  onClicks?.(clicks);
  onItems?.(items);

  //--------------------------------------------------------------------------------------- Loading

  // a fake request: button spins and stays disabled until it resolves
  const busy = (btn, ms) => {
    btn.loading = true;
    setTimeout(() => { btn.loading = false; Alert.ok("Done"); }, ms);
  };
  const saveBtn = (
    <Button variant="primary" icon="save" onClick={() => busy(saveBtn, 1500)}>Save</Button>
  );
  const syncBtn = <IconBtn icon="sync" title="Sync now" onClick={() => busy(syncBtn, 1000)} />;
  const plainBtn = <Button onClick={() => busy(plainBtn, 1000)}>No icon</Button>;

  //-------------------------------------------------------------------------- Active and segmented

  const muteBtn = <ActiveBtn icon="volume_up" onChange={(on) => {
    muteBtn.icon = on ? "volume_off" : "volume_up";
    muteBtn.label = on ? "Muted" : "Mute";
  }}>Mute</ActiveBtn>;

  //------------------------------------------------------------------------------------------ View

  return (
    <Panel title="Buttons">
      <h4>Variants</h4>
      <row>
        <Button onClick={click}>Default</Button>
        <Button variant="primary" icon="add" onClick={click}>Primary</Button>
        <Button variant="danger" icon="delete" onClick={click}>Danger</Button>
        <Button variant="ghost" icon="settings" onClick={click}>Ghost</Button>
        <Button disabled>Disabled</Button>
        <IconBtn icon="refresh" title="Icon button" onClick={click} />
        <IconBtn icon="add" variant="primary" title="Primary icon" onClick={click} />
        <IconBtn icon="edit" variant="ghost" title="Ghost icon" onClick={click} />
        {clicksTag}
      </row>

      <h4>Sizes</h4>
      <row>
        <Button size="sm" icon="bolt">Small</Button>
        <Button icon="bolt">Default</Button>
        <Button size="lg" icon="bolt">Large</Button>
        <IconBtn size="sm" icon="bolt" title="Small" />
        <IconBtn icon="bolt" title="Default" />
        <IconBtn size="lg" icon="bolt" title="Large" />
      </row>

      <h4>Loading</h4>
      <row>
        {saveBtn}
        {syncBtn}
        {plainBtn}
        <span tone="meta">
          click one: <code>btn.loading</code> holds until request resolves
        </span>
      </row>

      <h4>Active and segmented</h4>
      <row>
        {muteBtn}
        <ActiveBtn icon="push_pin" active>Pinned</ActiveBtn>
        <sep />
        <Toggle value="list" onChange={(v) => Alert.inf(`View: ${v}`)}>
          <ToggleBtn value="list" icon="view_list" label="List" />
          <ToggleBtn value="grid" icon="grid_view" label="Grid" />
          <ToggleBtn value="card" icon="view_agenda" label="Card" />
        </Toggle>
        <Toggle value="left" size="sm">
          <ToggleBtn value="left" icon="format_align_left" />
          <ToggleBtn value="center" icon="format_align_center" />
          <ToggleBtn value="right" icon="format_align_right" />
        </Toggle>
      </row>

      <h4>Confirm in two clicks</h4>
      <p>
        First click arms button, second one within three seconds confirms.
        Try to click fast: short grace period after arming swallows a double click.
      </p>
      <row>
        <ConfirmBtn label="Delete one" onConfirm={() => setItems(items - 1)} />
        <ConfirmBtn icon="delete_sweep" label="Delete all"
          waitLabel="Hold on" confirmLabel="Yes, wipe" onConfirm={() => setItems(0)} />
        <ConfirmBtn variant="primary" icon="add" label="Restock" confirmLabel="Add three"
          onConfirm={() => setItems(items + 3)} />
        <IconConfirmBtn variant="ghost" onConfirm={() => setItems(items - 1)} />
        <IconConfirmBtn icon="logout" title="Sign out" color="purple"
          onConfirm={() => Alert.inf("Signed out")} />
        {itemsTag}
      </row>
    </Panel>
  );
};
