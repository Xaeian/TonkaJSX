// scripts/Docs.jsx
//
// A whole view built from kit: top dock with search, left dock with filters,
// a document list in the middle, details on the right, status at the bottom.
// Made for a fullbleed content area:
// `<stack fill>` takes all of it and docks sit on its edges.

const STATUS_COLOR = { draft: "wrn", review: "inf", approved: "ok", archived: "neutral" };

const DOCS = [
  { id: "ENG-142", status: "review", version: "v2.0-rc", starred: true, updated: "2026-04-18",
    entity: "Engineering", author: "Ada Lovelace",
    title: "Async auth middleware rewrite",
    info: "Moves JWT verification to an async DB lookup; v1 tokens keep working." },
  { id: "ENG-139", status: "draft", version: "v0.3", starred: false, updated: "2026-04-20",
    entity: "Engineering", author: "Kai Chen",
    title: "Rate limiting strategy for /login",
    info: "Sliding window with Redis. Caps at 20 req/min per IP, 100 per user." },
  { id: "DES-208", status: "approved", version: "v1.4", starred: true, updated: "2026-01-30",
    entity: "Design", author: "Mel Ortiz",
    title: "Component library: dark mode tokens",
    info: "Full token map for light-dark() pairs. Supersedes DES-191." },
  { id: "RES-055", status: "approved", version: "v1.0", starred: false, updated: "2025-10-14",
    entity: "Research", author: "Sam Iyer",
    title: "Latency measurement across EU regions",
    info: "P95 median 47ms, tail 180ms. Frankfurt and Warsaw outperform." },
  { id: "ENG-141", status: "review", version: "v1.2", starred: false, updated: "2026-04-15",
    entity: "Engineering", author: "Jun Park",
    title: "Migration: in-memory store to Postgres",
    info: "Blue-green deploy plan. Estimated 4h downtime for cutover." },
  { id: "DES-212", status: "draft", version: "v0.1", starred: false, updated: "2026-04-19",
    entity: "Design", author: "Noa Berg",
    title: "Icon audit: Material Symbols subset",
    info: "218 glyphs in active use. Proposal to freeze it." },
  { id: "ENG-088", status: "archived", version: "v1.0", starred: false, updated: "2026-02-01",
    entity: "Engineering", author: "Eli Stone",
    title: "Legacy API v1 deprecation schedule",
    info: "Retired 2026-02-01. Kept for reference; do not cite in new work." },
  { id: "RES-061", status: "review", version: "v0.8", starred: false, updated: "2026-04-17",
    entity: "Research", author: "Ravi Shah",
    title: "Client telemetry: opt-in flow",
    info: "Three-tier consent model. Requires legal review before merge." },
];

const ME = "Ada Lovelace";
const status = (s) => (d) => d.status === s;
const BUCKETS = [
  { key: "all", label: "All", icon: "inbox", test: () => true },
  { key: "draft", label: "Drafts", icon: "edit_note", test: status("draft") },
  { key: "review", label: "In review", icon: "rate_review", test: status("review") },
  { key: "approved", label: "Approved", icon: "task_alt", test: status("approved") },
  { key: "archived", label: "Archived", icon: "archive", test: status("archived") },
  { key: "starred", label: "Starred", icon: "star", test: (d) => d.starred },
  { key: "mine", label: "Mine", icon: "person", test: (d) => d.author === ME },
];

const Docs = () => {
  let bucket = BUCKETS[0];
  let query = "";
  let current = DOCS[0];
  const text = (d) => [d.id, d.title, d.author, d.entity, d.info].join(" ").toLowerCase();
  const matches = (d) => bucket.test(d) && (!query || text(d).includes(query));
  const visible = () => DOCS.filter(matches);

  const nav = <list></list>;
  const list = <list></list>;
  const details = <stack></stack>;
  const statusBar = <row gap="sm" tone="meta"></row>;
  const search = <SearchInput placeholder="Search..."
    onChange={(v) => { query = v.toLowerCase(); render(); }} />;
  const navDock = <Dock pos="left" width="220px" scroll>{nav}</Dock>;

  //------------------------------------------------------------------------------------- Renderers

  function renderNav() {
    nav.replaceChildren(...BUCKETS.map(b => (
      <Panel inline ghost glow pointer icon={b.icon} selected={b === bucket}
        onClick={() => { bucket = b; render(); }}>
        <span flex="1">{b.label}</span>
        <Badge variant="tint" size="sm" mono color={b === bucket ? "inf" : "neutral"}>
          {DOCS.filter(b.test).length}
        </Badge>
      </Panel>
    )));
  }

  function renderList() {
    const docs = visible();
    if(!docs.length) {
      list.replaceChildren(<Empty icon="search_off" title="No documents match" size="sm" />);
      return;
    }
    list.replaceChildren(...docs.map(d => (
      <Panel inline stack ghost glow pointer selected={d === current}
        icon={d.starred ? "star" : "description"}
        onClick={() => { current = d; render(); }}>
        <row gap="sm">
          <code>{d.id}</code>
          <Badge variant="tint" color={STATUS_COLOR[d.status]} size="sm">{d.status}</Badge>
          <strong flex="1">{d.title}</strong>
        </row>
        <row gap="sm" tone="meta">
          <span>{d.author}</span>
          <sep />
          <span>{d.entity}</span>
          <sep />
          <span>{d.updated}</span>
        </row>
      </Panel>
    )));
  }

  function renderDetails() {
    const d = current;
    details.replaceChildren(
      <row gap="sm">
        <code>{d.id}</code>
        <Badge variant="tint" color={STATUS_COLOR[d.status]} size="sm">{d.status}</Badge>
        <Badge variant="tint" size="sm" mono>{d.version}</Badge>
      </row>,
      <strong>{d.title}</strong>,
      <span tone="note">{d.info}</span>,
      <stack gap="xs">
        <row gap="sm" tone="meta">
          <span class="icon">person</span>
          <span flex="1">Author</span>
          <span>{d.author}</span>
        </row>
        <row gap="sm" tone="meta">
          <span class="icon">business</span>
          <span flex="1">Entity</span>
          <span>{d.entity}</span>
        </row>
        <row gap="sm" tone="meta">
          <span class="icon">schedule</span>
          <span flex="1">Updated</span>
          <span>{d.updated}</span>
        </row>
      </stack>,
      <row gap="xs">
        <Button variant="primary" icon="open_in_new" size="sm"
          onClick={() => Alert.inf(`Opening ${d.id}`)}>Open</Button>
        <Button icon="download" size="sm" onClick={() => Alert.ok(`${d.id}.md downloaded`)}>
          Download
        </Button>
        <IconBtn icon={d.starred ? "star" : "star_outline"}
          title={d.starred ? "Unstar" : "Star"}
          onClick={() => { d.starred = !d.starred; render(); }} />
      </row>,
    );
  }

  function renderStatus() {
    statusBar.replaceChildren(
      <span class="icon">filter_list</span>,
      <span>{bucket.label}</span>,
      <sep />,
      <span>{visible().length} of {DOCS.length} documents</span>,
      query ? <sep /> : null,
      query ? <span>search: "{query}"</span> : null,
    );
  }

  // eight documents: redrawing everything is cheaper than tracking what changed
  function render() {
    renderNav();
    renderList();
    renderDetails();
    renderStatus();
  }
  render();

  //------------------------------------------------------------------------------------------ View

  return (
    <stack fill gap="no">
      <Dock pos="top">
        <row justify="between">
          <row gap="sm">
            <IconBtn icon="menu_open" title="Toggle filters" variant="ghost"
              onClick={() => { navDock.hidden = !navDock.hidden; }} />
            <span class="icon">menu_book</span>
            <strong>Documents</strong>
          </row>
          <row gap="sm">
            {search}
            <Button variant="primary" icon="post_add" size="sm"
              onClick={() => Alert.inf("New document")}>New</Button>
          </row>
        </row>
      </Dock>
      <DockRow grow>
        {navDock}
        <div scroll pad="md">{list}</div>
        <Dock pos="right" width="320px" tint scroll>{details}</Dock>
      </DockRow>
      <Dock pos="bottom" tint>{statusBar}</Dock>
    </stack>
  );
};
