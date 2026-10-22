// scripts/App.jsx
//
// The manual's shell: one rail button per panel, each panel one file of `scripts/`.
// On a narrow screen the topbar folds its search and its theme switch under More.

/**
 * A session shaped as `createSession` makes one, with no server behind it:
 * any name signs in with the password `demo`.
 * @returns {{ login, logout, onChange }}
 */
function demoSession() {
  let state = { status: "anon", user: null, error: null };
  const subs = new Set();
  function set(next) {
    state = next;
    for(const fn of subs) fn(state);
  }
  function login(username, password) {
    if(password === "demo") set({ status: "auth", user: { username }, error: null });
    else set({ status: "error", user: null, error: "Wrong password (hint: demo)" });
  }
  const logout = () => set({ status: "anon", user: null, error: null });
  // a new listener hears the state at once, as with `createSession`
  function onChange(fn) {
    subs.add(fn);
    fn(state);
  }
  return { login, logout, onChange };
}

const App = () => {
  const sectionTag = <span>section: hero</span>;
  const clicksTag = <span></span>;
  const itemsTag = <span></span>;
  const itemsBadge = <Badge color="ok" size="sm" pos="top-right"></Badge>;
  const onClicks = (n) => { clicksTag.textContent = n + " clicks"; };
  function onItems(n) {
    itemsTag.textContent = n + " items";
    itemsBadge.text = n;
    itemsBadge.hidden = n === 0;
  }
  const panels = [
    { key: "hero", icon: "home", title: "Welcome", el: <Hero /> },
    { key: "layout", icon: "view_quilt", title: "Layout", el: <Layout /> },
    { key: "input", icon: "edit", title: "Inputs & Select", el: <Inputs /> },
    { key: "button", icon: "smart_button", title: "Buttons & Toggles", badge: itemsBadge,
      el: <Buttons onClicks={onClicks} onItems={onItems} /> },
    { key: "check", icon: "check_box", title: "Checkboxes", el: <Checks /> },
    { key: "alert", icon: "notifications", title: "Alerts & Confirm", el: <Alerts /> },
    { key: "load", icon: "progress_activity", title: "Spinners & Progress", el: <Loaders /> },
    { key: "panel", icon: "table_chart", title: "Panels & Tabs", el: <Panels /> },
    { key: "cards", icon: "view_agenda", title: "Cards", el: <Cards /> },
    { key: "lists", icon: "view_list", title: "Lists & Empty", el: <Lists /> },
    { key: "modal", icon: "open_in_new", title: "Modals", el: <Modals /> },
    { key: "menu", icon: "menu_open", title: "Menus", el: <Menus /> },
    { key: "dock", icon: "dock_to_bottom", title: "Docks", el: <Docks /> },
    { key: "drop", icon: "upload_file", title: "FileDrops", el: <FileDrops /> },
    { key: "files", icon: "folder_open", title: "Files", el: <Files /> },
    { key: "img", icon: "image", title: "Images", el: <Imgs /> },
    { key: "code", icon: "code", title: "Code", el: <Codes /> },
    { key: "library", icon: "menu_book", title: "Documents", el: <Docs />, fullbleed: true },
    { key: "pickers", icon: "palette", title: "Color & Icon Pickers", el: <Pickers /> },
    { key: "qr", icon: "qr_code_2", title: "QR", el: <Qrs /> },
  ];
  for(const p of panels) {
    p.nav = <SidebarBtn icon={p.icon} title={p.title} badge={p.badge}
      onClick={() => show(p.key)} />;
  }
  const content = <Content>{panels.map(p => p.el)}</Content>;

  function show(key) {
    for(const p of panels) {
      const on = p.key === key;
      p.el.hidden = !on;
      p.nav.active = on;
      if(on) content.fullbleed = !!p.fullbleed;
    }
    sectionTag.textContent = "section: " + key;
  }
  show("hero");

  // Enter opens the first panel whose title holds the text, a suggestion being one
  const search = (
    <SearchInput fold placeholder="Jump to..." suggest={panels.map(p => p.title)}
      onEnter={(q) => {
        const needle = q.trim().toLowerCase();
        const hit = needle && panels.find(p => p.title.toLowerCase().includes(needle));
        if(hit) show(hit.key);
      }} />
  );

  // the switch follows the theme, whoever changes it: itself, the rail button or the system
  const themeToggle = (
    <Toggle fold value={Theme.choice()} onChange={Theme.set}>
      <ToggleBtn value="light" icon="light_mode" label="Light" />
      <ToggleBtn value="dark" icon="dark_mode" label="Dark" />
      <ToggleBtn value="system" icon="contrast" label="System" />
    </Toggle>
  );
  Theme.onChange((e) => { themeToggle.value = e.detail; });

  return (
    <Shell
      sidebar={
        <Sidebar>
          {panels.map(p => p.nav)}
          <spacer />
          <ThemeBtn />
        </Sidebar>
      }
      topbar={
        <Topbar>
          <TopbarLogo href="https://ui.tonkajsx.com" target="_blank" img="tonka.svg" alt="T">
            {{title}}
          </TopbarLogo>
          <spacer />
          {search}
          {themeToggle}
          <Login session={demoSession()} />
        </Topbar>
      }
      footer={
        <Footer left={sectionTag} right={<>{clicksTag}{itemsTag}</>}
          center={<>
            <inline>
              2026<span class="icon" translate={false}>copyright</span>{{title}} {{ver}}
            </inline>
            <sep hide-narrow />
            <span hide-narrow>
              Design by <a href="https://github.com/Xaeian" target="_blank">Xaeian</a>
            </span>
            <sep hide-narrow />
            <span hide-narrow>
              {{foot}} by <a href="https://tonkajsx.com" target="_blank">TonkaJSX</a>
            </span>
          </>} />
      }>
      {content}
    </Shell>
  );
};
