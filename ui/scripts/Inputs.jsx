// scripts/Inputs.jsx

const FRUITS = ["apple", "banana", "cherry", "grape", "lemon", "mango"];

const Inputs = () => {
  const picked = <Badge color="ok" variant="tint" mono>banana</Badge>;

  return (
    <Panel title="Inputs">
      <p>
        Every field returns a wrapper with <code>.value</code>, <code>.focus()</code> and
        native <code>.input</code>.
      </p>

      <h4>Text</h4>
      <row>
        <Input icon="person" placeholder="First name" />
        <Input icon="person" placeholder="Last name" />
        <Input icon="mail" placeholder="Email" />
      </row>
      <row>
        <Input placeholder="Plain" />
        <Input size="sm" placeholder="Small" />
        <Input size="lg" placeholder="Large" />
      </row>
      <row>
        <Input icon="search" clear placeholder="Type, then clear it" />
        <Input ghost placeholder="Ghost: no border" />
        <Input disabled value="Disabled" />
      </row>

      <h4>Number, password, search</h4>
      <row>
        <NumberInput value={5} min={0} max={100} />
        <PasswordInput placeholder="Password" />
        <SearchInput onSearch={(q) => Alert.inf(`Search: ${q}`)} />
      </row>

      <h4>Date and time</h4>
      <row>
        <DatePicker value="2026-10-01 12:00" />
        <DatePicker format="%Y-%m-%d" />
        <DatePicker format="%H:%M" />
      </row>

      <h4>Textareas</h4>
      <Textarea rows={3} placeholder="Fixed height, scrolls inside" />
      <Textarea auto minRows={2} maxRows={6}
        placeholder="Grows with text, Ctrl+Enter submits"
        onSubmit={(v) => Alert.ok(`Submitted ${v.length} characters`)} />

      <h4>Select</h4>
      <row>
        <Select value="banana" onChange={(v) => { picked.text = v; }}>
          {FRUITS.map(f => <option value={f}>{f}</option>)}
        </Select>
        <span tone="meta">picked:</span>
        {picked}
      </row>
    </Panel>
  );
};
