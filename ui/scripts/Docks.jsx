// scripts/Docks.jsx

const Docks = () => {
  const TWELVE = Array.from({ length: 12 }, (_, i) => i + 1);
  const THREE = TWELVE.slice(0, 3);

  return (
    <stack>
      <Panel title="Four edges" icon="dock_to_bottom" flush height="240px">
        <Dock pos="top">
          <row gap="sm">
            <span class="icon">north</span>
            <strong>top</strong>
            <span tone="meta">toolbar</span>
          </row>
        </Dock>
        <DockRow>
          <Dock pos="left" width="160px">
            <stack gap="xs">
              <strong>left</strong>
              <span tone="meta">nav rail</span>
            </stack>
          </Dock>
          <div scroll pad="md"><span tone="meta">middle content</span></div>
          <Dock pos="right" width="160px" tint>
            <stack gap="xs">
              <strong>right</strong>
              <span tone="meta">details</span>
            </stack>
          </Dock>
        </DockRow>
        <Dock pos="bottom" tint>
          <row gap="sm">
            <span class="icon">south</span>
            <strong>bottom</strong>
            <span tone="meta">status</span>
          </row>
        </Dock>
      </Panel>

      <Panel title="Navigation and content" icon="view_sidebar" flush height="300px">
        <Dock pos="top">
          <row justify="between">
            <row gap="sm"><span class="icon">settings</span><strong>Settings</strong></row>
            <Button variant="primary" icon="save" size="sm" onClick={() => Alert.ok("Saved")}>
              Save
            </Button>
          </row>
        </Dock>
        <DockRow>
          <Dock pos="left" width="200px" scroll>
            <list>
              <Panel inline ghost glow pointer icon="person" selected>Account</Panel>
              <Panel inline ghost glow pointer icon="lock">Security</Panel>
              <Panel inline ghost glow pointer icon="credit_card">Billing</Panel>
              <Panel inline ghost glow pointer icon="notifications">Notifications</Panel>
            </list>
          </Dock>
          <div scroll pad="md">
            <stack>
              <row>
                <Input icon="badge" placeholder="Display name" value="Ada Lovelace" />
                <Input icon="mail" value="ada@example.com" />
              </row>
              <Textarea auto minRows={2} placeholder="Bio" value="Working on async code." />
              <Checkbox label="Public profile" checked />
            </stack>
          </div>
        </DockRow>
      </Panel>

      <Panel title="Scroll or grow" icon="unfold_more">
        <p>
          With <code>scroll</code> a dock scrolls inside a bounded parent;
          without it, it grows with its content.
        </p>
        <row split align="stretch">
          <Panel title="scroll" flush height="220px">
            <DockRow>
              <Dock pos="left" width="140px" scroll>
                <stack gap="xs">
                  {TWELVE.map(i => <Panel inline ghost>Item {i}</Panel>)}
                </stack>
              </Dock>
              <div scroll pad="md">
                <stack gap="xs">
                  {TWELVE.map(i => <Panel inline ghost>Row {i}</Panel>)}
                </stack>
              </div>
            </DockRow>
          </Panel>
          <Panel title="grow" flush>
            <DockRow>
              <Dock pos="left" width="140px">
                <stack gap="xs">
                  {THREE.map(i => <Panel inline ghost>Item {i}</Panel>)}
                </stack>
              </Dock>
              <div pad="md">
                <stack gap="xs">
                  {THREE.map(i => <Panel inline ghost>Row {i}</Panel>)}
                </stack>
              </div>
            </DockRow>
          </Panel>
        </row>
      </Panel>
    </stack>
  );
};
