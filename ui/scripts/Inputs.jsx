// scripts/Inputs.jsx

const FRUITS = ["apple", "banana", "cherry", "grape", "lemon", "mango"];

const Inputs = () => {
  const picked = <Badge color="ok" variant="tint" mono>banana</Badge>;

  //------------------------------------------------------------------------------------------ Form

  const hostIn = <Input icon="dns" value="localhost"
    onEscape={() => { hostIn.value = "localhost"; }} />;
  const proxyIn = <Input icon="vpn_lock" placeholder="off" disabled />;
  const proxyChk = <Checkbox label="via proxy" onChange={(on) => {
    proxyIn.disabled = !on;
    proxyIn.placeholder = on ? "host:port" : "off";
  }} />;

  //------------------------------------------------------------------------------------------ View

  return (
    <Panel title="Inputs">
      <p>
        A field wraps its native <code>.input</code> and reaches it with <code>.focus()</code>.
        It holds <code>.value</code>, <code>.disabled</code> and <code>.placeholder</code>.
        Every handler gets the value, never the event.
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
      <row>
        <Input icon="list" suggest={FRUITS} placeholder="Fruit (suggested while typing)" />
      </row>

      <h4>Number, password, search</h4>
      <row>
        <NumberInput value={5} min={0} max={100} />
        <PasswordInput placeholder="Password" />
        <SearchInput onEnter={(q) => Alert.inf(`Search: ${q}`)} />
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

      <h4>Form</h4>
      <p>
        A <code>formRow</code> sets a name beside its controls, line under line.
        Where a line carries several, <code>named</code> gives each its own small name.
        A <code>formNote</code> says what the lines above it mean.
      </p>
      {formRow("Server", hostIn, <NumberInput icon="numbers" value={8080} min={1} max={65535} />)}
      {formRow("Proxy", proxyChk, proxyIn)}
      {formRow("Retry",
        named("times", <NumberInput value={3} min={0} />),
        named("every", <NumberInput value={10} min={1} />))}
      {formNote(
        <span tone="note">Escape puts the host back.</span>,
        <span tone="note">The proxy field opens with its box.</span>,
      )}
    </Panel>
  );
};
