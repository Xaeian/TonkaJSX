// scripts/Panels.jsx

const Panels = () => {

  //------------------------------------------------------------------------------------ Head slots

  const headPanel = (
    <Panel title="Release notes" icon="description"
      meta={<>
        <span>2026-04-13</span>
        <Badge variant="tint" size="sm">v1.2.0</Badge>
        <Badge variant="tint" size="sm" color="wrn">draft</Badge>
      </>}
      actions={<>
        <IconBtn icon="edit" title="Edit" onClick={() => Alert.inf("Edit")} />
        <IconBtn icon="more_vert" title="More" onClick={() => Alert.inf("More")} />
      </>}>
      <p>Icon and meta sit left of title, actions on the right.</p>
    </Panel>
  );

  //------------------------------------------------------------------------------------------ Tabs

  const TITLES = { general: "General settings", network: "Network", advanced: "Advanced" };
  const tabbed = (
    <Panel title={TITLES.general} onChange={(key) => { tabbed.title = TITLES[key]; }}
      tabs={[
        { key: "general",  icon: "tune",     label: "General" },
        { key: "network",  icon: "lan",      label: "Network" },
        { key: "advanced", icon: "settings", label: "Advanced" },
      ]}>
      <TabPanel value="general">
        <Input icon="badge" placeholder="Display name" value="Tonka" />
        <Checkbox label="Start with system" checked />
      </TabPanel>
      <TabPanel value="network">
        <row>
          <Input icon="lan" placeholder="Hostname" value="localhost" />
          <NumberInput icon="numbers" value={8080} min={1} max={65535} />
        </row>
      </TabPanel>
      <TabPanel value="advanced">
        <Checkbox label="Verbose logging" />
        <row>
          <Button size="sm" icon="arrow_back" onClick={() => { tabbed.tab = "general"; }}>
            Back to General
          </Button>
          <span tone="meta"><code>panel.tab = "general"</code></span>
        </row>
      </TabPanel>
    </Panel>
  );

  //-------------------------------------------------------------------- Toolbar with a live filter

  const PEOPLE = [
    ["Ada Lovelace", "Engineering"],
    ["Grace Hopper", "Compilers"],
    ["Linus Torvalds", "Kernel"],
    ["Margaret Hamilton", "Flight software"],
    ["Ken Thompson", "Unix"],
    ["Barbara Liskov", "Types"],
  ];
  const people = <list></list>;
  const nobody = <Empty icon="search_off" title="No match" size="sm" />;
  const renderPeople = (q) => {
    const needle = q.toLowerCase();
    const hits = PEOPLE.filter(([name, team]) => (name + team).toLowerCase().includes(needle));
    people.replaceChildren(...hits.map(([name, team]) => (
      <Panel inline ghost icon="person">
        <strong>{name}</strong>
        <span tone="meta">{team}</span>
      </Panel>
    )));
    people.hidden = !hits.length;
    nobody.hidden = !!hits.length;
  };
  renderPeople("");
  const filter = (
    <Input icon="search" clear placeholder="Filter people..." onChange={renderPeople} />
  );
  const toolbarPanel = (
    <Panel title="People"
      toolbar={<>{filter}<Button icon="person_add" variant="primary">Invite</Button></>}>
      {people}
      {nobody}
    </Panel>
  );

  //-------------------------------------------------------------------------------- Scrolling body

  const VARS = [
    ["red", "key", "API_KEY", "sk-proj-abc123def456"],
    ["amber", "lan", "DB_HOST", "postgres.prod.example.com"],
    ["amber", "lan", "DB_PORT", "5432"],
    ["green", "link", "PROD_URL", "https://app.example.com"],
    ["blue", "mail", "SMTP_HOST", "smtp.sendgrid.net"],
    ["blue", "mail", "SMTP_PORT", "587"],
    ["purple", "code", "GIT_BRANCH", "main"],
    ["teal", "tune", "LOG_LEVEL", "info"],
    ["teal", "tune", "CACHE_TTL", "3600"],
    ["pink", "person", "ADMIN_EMAIL", "ops@example.com"],
  ];
  const scrollPanel = (
    <Panel ghost flush height="14rem">
      <stack fill>
        <Panel grow title="Environment" icon="terminal"
          meta={<Badge variant="tint" size="sm">{VARS.length} vars</Badge>}>
          <stack gap="sm">
            {VARS.map(([color, icon, key, val]) => (
              <Panel inline size="sm" stripe color={color} icon={icon}>
                <row>
                  <strong flex="1">{key}</strong>
                  <span flex="3">{val}</span>
                </row>
              </Panel>
            ))}
          </stack>
        </Panel>
      </stack>
    </Panel>
  );

  //------------------------------------------------------------------------------------------ View

  return (
    <stack>
      <Panel title="Head slots" icon="web_asset">
        <p>Icon, meta, title and actions share head row.</p>
        {headPanel}
      </Panel>

      <Panel title="Tabs" icon="tab">
        <p>
          Panes are <code>&lt;TabPanel&gt;</code> children.
          Here <code>onChange</code> drives title and <code>.tab</code> switches from code.
        </p>
        {tabbed}
      </Panel>

      <Panel title="Toolbar" icon="build">
        <p>
          Toolbar is a strip between head and body.
          Type to filter, clear with X.
        </p>
        {toolbarPanel}
      </Panel>

      <Panel title="Fixed height" icon="unfold_less">
        <p>Inside a fixed height, <code>grow</code> panel scrolls its body.</p>
        {scrollPanel}
      </Panel>

      <Panel title="Looks" icon="palette">
        <row split align="stretch">
          <Panel title="size sm" size="sm"><p>Tighter body padding.</p></Panel>
          <Panel title="compact" compact><p>Slimmer head.</p></Panel>
          <Panel dashed><p>Dashed, no head.</p></Panel>
          <Panel ghost><p>Ghost: no border, no background.</p></Panel>
        </row>
      </Panel>

      <Panel title="Empty states" icon="inbox">
        <row split>
          <Empty icon="inbox" title="No messages"
            description="New messages will appear here." />
          <Empty icon="search_off" title="No results"
            action={<Button size="sm" icon="refresh">Clear filters</Button>} />
        </row>
      </Panel>
    </stack>
  );
};
