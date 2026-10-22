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
    <Modal title="Create user" noClickAway footer={<>
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

  //------------------------------------------------------------------------------------------ Wide

  const wideModal = (
    <Modal title="Wide" size="xl"
      footer={<Button onClick={() => wideModal.close()}>Close</Button>}>
      <p>
        The widest of the three, for a dialog holding text rather than a form.
        A file in a <code>Code</code> box is what it was added for.
      </p>
      <Code height="md" lang="query.sql" readOnly
        value={"-- the widest dialog, so a long line still fits\nSELECT id, name, city"
          + "\nFROM users\nWHERE city = 'Warszawa'\nORDER BY name;"} />
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

  //------------------------------------------------------------------------------------------ Once

  // built on the click and taken out of the page once it closes
  function openOnce() {
    const modal = (
      <Modal once title="Once" size="sm"
        footer={<Button onClick={() => modal.close()}>Close</Button>}>
        <p>Built for this click, and gone from the page once closed.</p>
      </Modal>
    );
    modal.open();
  }

  //------------------------------------------------------------------------------------------ View

  return (
    <Panel title="Modals">
      <p>
        A modal is built once and opened from code with <code>modal.open()</code>.
        Then <code>modal.close()</code> shuts it; <code>modal.opened</code> reads or sets either.
      </p>
      <p>
        Escape, the backdrop and the close button all dismiss a modal; a toast above it never does.
        The form wears <code>noClickAway</code>: a click beside it keeps what was typed.
        With <code>noClose</code> none of the three works.
        With <code>once</code>, a modal built for one answer leaves the page when it closes.
      </p>
      <row>
        <Button icon="open_in_new" onClick={() => confirmModal.open()}>Small confirm</Button>
        <Button icon="open_in_new" onClick={() => formModal.open()}>Form</Button>
        <Button icon="add_comment" onClick={openOnce}>Once</Button>
        <Button variant="primary" icon="open_in_new" onClick={() => largeModal.open()}>
          Large
        </Button>
        <Button variant="primary" icon="open_in_new" onClick={() => wideModal.open()}>
          Wide
        </Button>
      </row>
    </Panel>
  );
};
