// scripts/Modals.jsx

const ROLES = ["admin", "moderator", "member", "guest"];

const Modals = () => {

  //--------------------------------------------------------------------------------------- Confirm

  const confirmModal = (
    <Modal title="Confirm" size="sm" footer={<>
      <Button onClick={() => confirmModal.close()}>Cancel</Button>
      <Button variant="primary" icon="check"
        onClick={() => { confirmModal.close(); Alert.ok("Confirmed"); }}>
        OK
      </Button>
    </>}>
      <p>Proceed? This cannot be undone.</p>
    </Modal>
  );

  //------------------------------------------------------------------------------------------ Form

  const nameIn = <Input icon="person" placeholder="Full name" />;
  const emailIn = <Input icon="mail" placeholder="Email" />;
  const roleSel = (
    <Select value="member">{ROLES.map(r => <option value={r}>{r}</option>)}</Select>
  );
  const tosChk = <Checkbox label="I accept terms" />;
  const formModal = (
    <Modal title="Create user" footer={<>
      <Button onClick={() => formModal.close()}>Cancel</Button>
      <Button variant="primary" icon="person_add" onClick={() => {
        if(!tosChk.checked) { Alert.wrn("Accept terms first"); return; }
        formModal.close();
        Alert.ok(`${nameIn.value || "Anonymous"} created as ${roleSel.value}`);
      }}>Create</Button>
    </>}>
      <row>{nameIn}{emailIn}</row>
      <row>{roleSel}{tosChk}</row>
    </Modal>
  );

  //----------------------------------------------------------------------------------------- Large

  const largeModal = (
    <Modal title="Large" size="lg"
      footer={<Button onClick={() => largeModal.close()}>Close</Button>}>
      <p>
        Anything goes inside: inputs, rows, buttons with tooltips.
        Body scrolls when it outgrows viewport, Tab cycles inside dialog,
        Escape and backdrop close it.
      </p>
      <h4>Inputs</h4>
      <row>
        <Input icon="search" placeholder="Search anything..." />
        <Select value="b">
          <option value="a">Option A</option>
          <option value="b">Option B</option>
          <option value="c">Option C</option>
        </Select>
      </row>
      <h4>Checkboxes</h4>
      <row>
        <Checkbox label="Notifications" checked />
        <Checkbox label="Auto-update" />
        <Checkbox label="Beta features" />
      </row>
      <h4>Buttons</h4>
      <row>
        <Button icon="info" title="Show info">Info</Button>
        <Button variant="primary" icon="play_arrow" title="Start job"
          onClick={() => Alert.inf("Started")}>Run</Button>
        <Button variant="danger" icon="delete" title="Delete forever"
          onClick={() => Alert.err("Deleted")}>Delete</Button>
      </row>
    </Modal>
  );

  //------------------------------------------------------------------------------------------ View

  return (
    <Panel title="Modals">
      <p>
        Create a modal once, then open and close it from code:
        <code>modal.open()</code>, <code>modal.close()</code>, <code>modal.opened</code>.
      </p>
      <row>
        <Button icon="open_in_new" onClick={() => confirmModal.open()}>Small confirm</Button>
        <Button icon="open_in_new" onClick={() => formModal.open()}>Form</Button>
        <Button variant="primary" icon="open_in_new" onClick={() => largeModal.open()}>
          Large
        </Button>
      </row>
    </Panel>
  );
};
