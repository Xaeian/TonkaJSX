// scripts/App.jsx

const App = () => {
  const sectionTag = <span>section: hero</span>;
  const clicksTag  = <span></span>;
  const itemsTag   = <span></span>;
  const itemsBadge = <Badge color="ok" size="sm" pos="top-right"></Badge>;
  const login = (
    <Login onSubmit={({ user, pass }) => {
      if(pass === "demo") login.logged(user);
      else login.error("Wrong password (hint: demo)");
    }} onLogout={() => {
      login.logout();
      Alert.inf("Logged out");
    }} />
  );
  const onClicks = (n) => clicksTag.textContent = n + " clicks";
  const onItems = (n) => {
    itemsTag.textContent = n + " items";
    itemsBadge.text = n;
    itemsBadge.hidden = n === 0;
  };
  const panels = [
    { key: "hero", icon: "home", title: "Welcome", el: <Hero /> },
    { key: "input", icon: "edit", title: "Inputs & Select", el: <Inputs /> },
    { key: "button", icon: "smart_button", title: "Buttons & Toggles", badge: itemsBadge,
      el: <Buttons onClicks={onClicks} onItems={onItems} /> },
    { key: "check", icon: "check_box", title: "Checkboxes", el: <Checks /> },
    { key: "alert", icon: "notifications", title: "Alerts & Confirm", el: <Alerts /> },
    { key: "load", icon: "progress_activity", title: "Spinners & Progress", el: <Loaders /> },
    { key: "panel", icon: "table_chart", title: "Panels & Tabs", el: <Panels /> },
    { key: "cards", icon: "view_agenda", title: "Cards", el: <Cards /> },
    { key: "lists", icon: "view_list", title: "Lists", el: <Lists /> },
    { key: "modal", icon: "open_in_new", title: "Modals", el: <Modals /> },
    { key: "menu", icon: "menu_open", title: "Menus", el: <Menus /> },
    { key: "dock", icon: "dock_to_bottom", title: "Docks", el: <Docks /> },
    { key: "drop", icon: "upload_file", title: "FileDrops", el: <FileDrops /> },
    { key: "img", icon: "image", title: "Images", el: <Imgs /> },
    { key: "library", icon: "menu_book", title: "Documents", el: <Docs />, fullbleed: true },
    { key: "pickers", icon: "palette", title: "Color & Icon Pickers", el: <Pickers /> },
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

  // shortcuts to every panel plus theme toggle, anchored to rail
  // rail insets its button, so 6px moves placement gap out to sidebar line
  const quickMenu = (
    <Menu title="Quick actions" pos="right-top" offsetX={6} width="220px">
      <stack gap="xs">
        <span tone="meta">Jump to panel</span>
        {panels.map(p => (
          <Panel inline ghost glow pointer
            onClick={() => { show(p.key); quickMenu.close(); }}>
            <span class="icon">{p.icon}</span>
            <span>{p.title}</span>
          </Panel>
        ))}
        <sep blank />
        <Panel inline ghost glow pointer
          onClick={() => { Theme.toggle(); quickMenu.close(); }}>
          <span class="icon">contrast</span>
          <span>Toggle theme</span>
        </Panel>
      </stack>
    </Menu>
  );
  const quickBtn = <SidebarBtn icon="bolt" title="Quick actions"
    onClick={() => quickMenu.toggle(quickBtn)} />;

  // switch mirrors theme, whoever changes it
  const themeToggle = (
    <Toggle value={Theme.current()} onChange={(v) => Theme.set(v)}>
      <ToggleBtn value="light" icon="light_mode" label="Light" />
      <ToggleBtn value="dark"  icon="dark_mode"  label="Dark" />
    </Toggle>
  );
  document.addEventListener("theme:change", (e) => { themeToggle.value = e.detail; });

  return (
    <Shell
      sidebar={
        <Sidebar>
          {panels.map(p => p.nav)}
          <spacer />
          {quickBtn}
          <SidebarBtn icon="settings" title="Settings (soon)" disabled />
        </Sidebar>
      }
      topbar={
        <Topbar>
          <TopbarLogo href="https://ui.tonkajsx.com" target="_blank" img="tonka.svg" alt="T">
            {{title}}</TopbarLogo>
          <spacer />
          {themeToggle}
          {login}
        </Topbar>
      }
      footer={
        <Footer
          left={sectionTag}
          center={<>
            <span>2026 <span class="icon">copyright</span>
              <a href="https://ui.tonkajsx.com" target="_blank">{{title}}</a> {{ver}}</span>
            <sep />
            <span>
              Design by <a href="https://github.com/Xaeian" target="_blank">Xaeian</a>
            </span>
            <sep />
            <span>
              {{foot}} by <a href="https://tonkajsx.com" target="_blank">TonkaJSX</a>
            </span>
          </>}
          right={<>{clicksTag}{itemsTag}</>}
        />
      }>
      {content}
    </Shell>
  );
};
