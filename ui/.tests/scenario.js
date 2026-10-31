// .tests/scenario.js
//
// The manual walked in the page: every rail button found by its tooltip,
// then each panel's components through their props, mutators and events.
// A step reports PASS or FAIL, a throw ends the walk as THROW, and the last line counts them.

(async () => {
  const out = [];
  const t0 = performance.now();
  // `seen` is printed beside a failure, to say what the page held instead
  function ok(name, cond, seen) {
    const at = `@${Math.round(performance.now() - t0)}ms`;
    const why = seen === undefined ? "" : `: ${seen}`;
    out.push(cond ? `PASS ${name} ${at}` : `FAIL ${name} ${at}${why}`);
  }
  const frame = (ms = 60) => new Promise((r) => setTimeout(r, ms));
  const q = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => [...root.querySelectorAll(sel)];
  const vis = (el) => !!el && el.getClientRects().length > 0;
  const css = (el, prop) => getComputedStyle(el)[prop];
  const cur = () => qa(".content > *").find(vis);
  const rail = () => qa(".sidebar .btn-rail");
  const nav = (title) => rail().find((b) => b.dataset.tooltip === title);
  async function open(title) {
    nav(title).click();
    await frame();
    return cur();
  }
  // a button by its words, looked for inside: its icon's ligature is text as well
  const button = (words, root = cur()) =>
    qa(".btn", root).find((b) => b.textContent.includes(words));
  const key = (el, k) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
  function typed(group, text) {
    group.value = text;
    group.input.dispatchEvent(new Event("input"));
  }
  const pointer = (el, type, init = {}) =>
    el.dispatchEvent(new PointerEvent(type, { pointerType: "mouse", bubbles: true, ...init }));
  const alerts = () => qa(".alerts .alert.show .alert-msg").map((m) => m.textContent);
  const shownModal = () => qa(".modal").find((m) => m.opened);
  // the viewport at `width`, set by the harness over CDP; resolves once the page has it
  const viewport = (width) => new Promise((resolve) => {
    window.__viewportDone = resolve;
    __viewport(JSON.stringify({ width }));
  });
  // files as a picker hands them to a drop, `[name, type, bytes]` each
  function feed(drop, files) {
    const input = q("input[type=file]", drop);
    const dt = new DataTransfer();
    for(const [name, type, bytes = 1] of files) {
      dt.items.add(new File(["x".repeat(bytes)], name, { type }));
    }
    input.files = dt.files;
    input.dispatchEvent(new Event("change"));
  }
  const PANELS = [
    "Welcome", "Layout", "Inputs & Select", "Buttons & Toggles", "Checkboxes",
    "Alerts & Confirm", "Spinners & Progress", "Panels & Tabs", "Cards", "Lists & Empty",
    "Modals", "Menus", "Docks", "FileDrops", "Files", "Images", "Code", "Documents",
    "Color & Icon Pickers", "QR",
  ];
  let view;

  try {
    //--------------------------------------------------------------------------------------- Shell

    const globals = [
      JSX, UI, Kind, Dump, Syntax, Theme, Shell, Content, Sidebar, SidebarBtn,
      ThemeBtn, Topbar, TopbarLogo, Footer, Dock, DockRow, Panel, TabPanel, Empty, FileDrop,
      FileRow, FileThumb, Table, Columns, Button, IconBtn, ActiveBtn, Toggle, ToggleBtn,
      ConfirmBtn, IconConfirmBtn, Input, NumberInput, PasswordInput, SearchInput, Textarea,
      DatePicker, Select, Checkbox, Badge, Progress, Spinner, Img, Modal, Lightbox, Menu, Alert,
      Tooltip, Login, Code, Markdown, QrCode, QrScan, ColorPicker, IconPicker, formRow,
      formNote, named,
    ];
    ok("globals", globals.every(Boolean));
    ok("shell",
      vis(q(".shell > .sidebar"))
      && vis(q(".shell-main > .topbar"))
      && vis(q(".shell-main > .content"))
      && vis(q(".shell-main > .footer")));
    ok("one view shows", qa(".content > *").filter(vis).length === 1);
    ok("rail has every panel", PANELS.every(nav) && rail().length === PANELS.length + 1);
    for(const title of PANELS) {
      nav(title).click();
      await frame(40);
      ok("panel " + title,
        qa(".content > *").filter(vis).length === 1
        && nav(title).active
        && nav(title).getAttribute("aria-pressed") === "true");
    }
    ok("rail badge", q(".badge", nav("Buttons & Toggles")).textContent === "3");
    await open("Documents");
    ok("documents fullbleed",
      q(".content").fullbleed && vis(q(".content > stack[fill] .dock-row")));
    await open("Welcome");
    ok("fullbleed off", !q(".content").fullbleed);
    ok("footer slots",
      q(".footer-left").textContent === "section: hero"
      && q(".footer-right").textContent === "0 clicks3 items");
    const copyright = q(".footer-center > inline");
    // a flex item of its slot, so its own display is blockified: the gap is what tells
    ok("footer inline",
      css(copyright, "columnGap") === "4px"
      && css(copyright, "alignItems") === "center"
      && q(".icon", copyright).textContent === "copyright"
      && copyright.textContent.includes("TonkaUI"));
    ok("welcome code painted", !!q(".code .cd-kw", cur()) && q(".code", cur()).readOnly);

    ok("the brand is the kit's own",
      !!q(".topbar-logo img[src='tonka.svg']")
      && q(".topbar-logo").textContent.includes("TonkaUI"));
    // a brand link drives a mark offering `_spin` and `_rest` from its own hover
    let spun = 0, rested = 0;
    const mark = document.createElement("canvas");
    mark._spin = () => { spun++; };
    mark._rest = () => { rested++; };
    const logo = JSX.createElement(TopbarLogo, { mark }, "Brand");
    logo.dispatchEvent(new PointerEvent("pointerenter"));
    logo.dispatchEvent(new PointerEvent("pointerleave"));
    ok("logo link spins its mark", spun === 1 && rested === 1);

    //--------------------------------------------------------------------------------------- Theme

    const themeBtn = rail().find((b) => /theme/.test(b.dataset.tooltip));
    const themeSwitch = q(".topbar .toggle");
    const was = Theme.current();
    themeBtn.click();
    await frame();
    const now = Theme.current();
    ok("themebtn flips", now !== was && document.documentElement.dataset.theme === now);
    ok("themebtn shows the theme",
      themeBtn.icon === now + "_mode"
      && themeBtn.dataset.tooltip === (now === "dark" ? "Light theme" : "Dark theme")
      && themeBtn.getAttribute("aria-label") === themeBtn.dataset.tooltip);
    ok("topbar switch follows", themeSwitch.value === now);
    q("[data-value='system']", themeSwitch).click();
    await frame();
    ok("system theme", Theme.choice() === "system" && !document.documentElement.dataset.theme);
    ok("themebtn follows the switch", themeBtn.icon === Theme.current() + "_mode");

    //----------------------------------------------------------------------------- Search and fold

    const search = q(".topbar .input-group");
    ok("search suggests every panel", search.suggest.length === PANELS.length);
    search.value = "mod";
    key(search.input, "Enter");
    await frame();
    ok("search jumps to a panel", nav("Modals").active);
    search.value = "";
    const topbar = q(".shell-main > .topbar");
    const strip = topbar.nextElementSibling;
    const more = qa(".btn", topbar).find((b) => b.dataset.tooltip === "More");
    await viewport(600);
    await frame(200);
    ok("narrow folds search and switch",
      !topbar.contains(search)
      && strip.contains(search)
      && strip.contains(themeSwitch)
      && vis(more)
      && strip.hidden);
    more.click();
    await frame();
    ok("More opens the strip", !strip.hidden && vis(search) && vis(themeSwitch));
    await open("Layout");
    ok("only-narrow shows", vis(q("[only-narrow]", cur())) && !vis(q("[hide-narrow]", cur())));
    ok("footer centre gives way", !vis(q(".footer-center")));
    ok("narrow weights take lines", css(q("list > row > [flex]", cur()), "flexBasis") === "100%");
    await viewport(1280);
    await frame(200);
    const order = [...topbar.children];
    ok("wide puts folds back",
      topbar.contains(search)
      && topbar.contains(themeSwitch)
      && order.indexOf(search) < order.indexOf(themeSwitch)
      && !vis(more)
      && !vis(strip));
    ok("hide-narrow shows", vis(q("[hide-narrow]", cur())) && !vis(q("[only-narrow]", cur())));

    //-------------------------------------------------------------------------------------- Layout

    view = cur();
    const logLines = qa("stack[sunken] > row[edge]", view);
    ok("sunken ground",
      css(q("stack[sunken]", view), "backgroundColor")
      !== css(q(".panel-body", view), "backgroundColor"));
    ok("edge in its colour",
      logLines.length === 3
      && css(logLines[0], "borderLeftColor") === "rgba(0, 0, 0, 0)"
      && css(logLines[1], "borderLeftColor") !== css(logLines[2], "borderLeftColor"));
    ok("wash grounds the worst",
      logLines.filter((l) => l.hasAttribute("wash")).length === 1
      && css(logLines[2], "backgroundColor") !== "rgba(0, 0, 0, 0)"
      && css(logLines[1], "backgroundColor") === "rgba(0, 0, 0, 0)");
    ok("align baseline", css(logLines[0], "alignItems") === "baseline");
    ok("a baseline icon sits mid-word", css(q(".icon", logLines[0]), "translate") !== "none");
    ok("small icon", css(q(".icon[size='sm']", view), "fontSize") === "14px");
    ok("wrap keeps breaks", css(q("[wrap]", view), "whiteSpace") === "pre-wrap");
    const stretched = q("stack[stretch]", view);
    ok("stretch spans the row",
      stretched.offsetHeight === stretched.previousElementSibling.offsetHeight);
    ok("basis fixes a width", q("list > row > [basis='md']", view).offsetWidth === 128);
    ok("flex text is cut", css(q("list > row > [flex='3']", view), "textOverflow") === "ellipsis");

    //------------------------------------------------------------------------------------- Buttons

    view = await open("Buttons & Toggles");
    ok("button label span", q(".btn-label", button("Default")).textContent === "Default");
    const mute = button("Mute");
    mute.click();
    await frame(30);
    ok("activebtn toggles",
      mute.active
      && mute.getAttribute("aria-pressed") === "true"
      && mute.label === "Muted"
      && mute.icon === "volume_off");
    ok("button active prop", button("Pinned").active);
    const viewSwitch = q(".toggle", view);
    viewSwitch.children[1].click();
    await frame(30);
    ok("toggle switches",
      viewSwitch.value === "grid"
      && viewSwitch.children[1].active
      && !viewSwitch.children[0].active);
    const save = button("Save");
    save.loading = true;
    ok("loading spins", save.disabled && q(".icon", save).classList.contains("spinner"));
    save.loading = false;
    ok("loading ends", !save.disabled && save.icon === "save");
    const confirm = button("Delete one");
    ok("confirm colour", confirm.getAttribute("color") === "err");
    confirm.click();
    await frame(30);
    ok("confirm waits", confirm.classList.contains("wait"));
    await frame(700);
    ok("confirm arms",
      confirm.classList.contains("confirm") && q(".icon", confirm).textContent === "check");
    confirm.click();
    await frame(30);
    ok("confirm fires",
      q(".badge", nav("Buttons & Toggles")).textContent === "2"
      && q(".footer-right").textContent.endsWith("2 items"));

    //-------------------------------------------------------------------------------------- Inputs

    view = await open("Inputs & Select");
    const first = q(".input-group", view);
    ok("field wrapper",
      first.input instanceof HTMLInputElement && typeof first.focus === "function");
    first.value = "abc";
    first.disabled = true;
    first.placeholder = "off";
    ok("field mutators",
      first.input.value === "abc" && first.input.disabled && first.input.placeholder === "off");
    first.disabled = false;
    const date = q(".input-group-date", view);
    date.value = "2026-01-02 03:04";
    ok("datepicker value",
      date.value === "2026-01-02 03:04" && date.input.value === "2026-01-02T03:04");
    const fruit = q(".select", view);
    fruit.value = "mango";
    fruit.dispatchEvent(new Event("change"));
    ok("select hands its value", q(".badge", fruit.parentElement).textContent === "mango");
    const find = qa(".input-group", view).find((g) => g.placeholder === "Search...");
    find.value = "kit";
    key(find.input, "Enter");
    await frame(30);
    ok("search onEnter", alerts().includes("Search: kit"));
    const host = qa(".input-group", view).find((g) => g.value === "localhost");
    host.value = "example.com";
    key(host.input, "Escape");
    ok("onEscape", host.value === "localhost");
    const proxy = qa(".input-group", view).find((g) => g.placeholder === "off" && g.disabled);
    const viaProxy = qa(".checkbox", view)
      .find((c) => q(".checkbox-label", c)?.textContent === "via proxy");
    viaProxy.input.click();
    await frame(30);
    ok("checkbox hands checked", !proxy.disabled && proxy.placeholder === "host:port");
    ok("formRow lines",
      qa("row > strong[flex='2']", view).map((s) => s.textContent).join()
      === "Server,Proxy,Retry");
    ok("named controls",
      qa("inline[nowrap] > i", view).map((i) => i.textContent).join() === "times,every");
    ok("formNote", qa("row > stack[flex='10'] > [tone='note']", view).length === 2);

    // the tooltip follows a mouse, never a finger
    const tipped = nav("Layout");
    pointer(tipped, "pointerover", { pointerType: "touch" });
    await frame(500);
    ok("no tooltip for touch", !q(".tooltip.show"));
    pointer(tipped, "pointerover");
    await frame(550);
    ok("tooltip shows", vis(q(".tooltip.show")) && q(".tooltip").textContent === "Layout");
    pointer(tipped, "pointerout", { relatedTarget: document.body });
    await frame(150);
    ok("tooltip hides", !q(".tooltip.show") && !tipped.hasAttribute("title"));

    //---------------------------------------------------------------------------------- Checkboxes

    view = await open("Checkboxes");
    ok("checkbox sizes", !!q(".checkbox.sm", view) && !!q(".checkbox.lg", view));
    button("None").click();
    ok("bulk set and one sync",
      qa(".checkbox-input", view).slice(0, 4).every((c) => !c.checked)
      && q("row .badge", view).textContent === "nothing");

    //-------------------------------------------------------------------------------------- Alerts

    await open("Alerts & Confirm");
    Alert.clear();
    await frame(300);
    Alert.ok("harness");
    await frame(50);
    ok("alert stack",
      qa(".alerts .alert.show").length === 1
      && q(".alerts .alert.show").getAttribute("color") === "ok");
    Alert.ok("harness");
    await frame(20);
    ok("alert dedupe", qa(".alerts .alert.show").length === 1);
    const asked = Alert.ask("inf", "q?");
    await frame(50);
    q(".alert-confirm").click();
    ok("alert ask", (await asked) === true);
    Alert.config({ max: 2 });
    for(let i = 0; i < 4; i++) Alert.inf("burst " + i, 0);
    // a toast closed in the frame it opened in leaves the page one transition later
    await frame(300);
    ok("alert max", alerts().join() === "burst 2,burst 3", alerts().join());
    Alert.config({ max: 5 });
    Alert.clear();

    //------------------------------------------------------------------------------------- Loaders

    view = await open("Spinners & Progress");
    const bar = q(".progress[color='teal']", view);
    ok("progress of a max", q(".badge", bar).textContent === "4/10");
    bar.value = 12;
    ok("progress stands at its end",
      bar.value === 10
      && q(".progress-fill", bar).style.width === "100%"
      && q(".badge", bar).textContent === "10/10");
    bar.value = 4;
    ok("progress indeterminate", !!q(".progress-indeterminate", view));
    ok("spinner colour",
      css(q(".spinner[color='err']", view), "color") !== css(document.body, "color"));

    //-------------------------------------------------------------------------------------- Panels

    view = await open("Panels & Tabs");
    const tabbed = qa(".panel", view).find((p) => p.value === "general");
    ok("tabs open the first", qa("[data-tab]:not([hidden])", tabbed).length === 1);
    tabbed.value = "network";
    ok("tab value",
      !q("[data-tab='network']", tabbed).hidden && q("[data-tab='general']", tabbed).hidden);
    q(".panel-tab[data-value='advanced']", tabbed).click();
    ok("tab onChange", tabbed.value === "advanced" && tabbed.title === "Advanced");
    button("Back to General", tabbed).click();
    ok("tab from code", tabbed.value === "general" && !q("[data-tab='general']", tabbed).hidden);
    const logs = qa(".panel-grow", view).find((p) => p.title === "Logs");
    q(".panel-tab[data-value='auth']", logs).click();
    await frame(30);
    ok("empty grows in a pane", q("[data-tab='auth'] > .empty", logs).offsetHeight > 100);
    const envRow = q(".panel-inline[color]", view);
    envRow.state = "done";
    ok("state done", envRow.getAttribute("state") === "done" && css(envRow, "opacity") === "0.55");
    envRow.state = null;
    envRow.color = "blue";
    ok("state and colour mutators",
      !envRow.hasAttribute("state") && envRow.getAttribute("color") === "blue");
    const people = qa(".panel", view).find((p) => p.title === "People");
    typed(q(".panel-toolbar .input-group", people), "zzz");
    ok("toolbar filter", q(".panel-body > list", people).hidden && vis(q(".empty", people)));
    typed(q(".panel-toolbar .input-group", people), "");

    //--------------------------------------------------------------------------------------- Cards

    view = await open("Cards");
    const alice = qa(".panel-inline", view).find((p) => p.dataset.tooltip === "Open alice");
    ok("inline title is a tooltip", !!alice && !alice.hasAttribute("title"));
    Alert.clear();
    await frame(250);
    q(".panel-actions .btn", alice).click();
    await frame(30);
    ok("an action's click stays its own",
      alerts().includes("Edit alice") && !alerts().includes("Opening alice"));
    q(".panel-main", alice).click();
    await frame(30);
    ok("a row's click opens it", alerts().includes("Opening alice"));
    const dave = qa(".panel-inline", view).find((p) => q("strong", p)?.textContent === "dave");
    dave.click();
    ok("selection",
      dave.selected && dave.getAttribute("state") === "selected" && dave.hasAttribute("tint"));
    dave.click();
    ok("selection clears", !dave.selected);
    ok("states row",
      qa("[state]", view).map((p) => p.getAttribute("state")).join()
      === "selected,armed,moved,danger,done");
    ok("columns at width", qa("row[split][nowrap] > stack", view).length === 3);

    //--------------------------------------------------------------------------------------- Lists

    view = await open("Lists & Empty");
    const dynamic = q(".panel", view);
    const dropRow = q(".btn-confirm", dynamic);
    dropRow.click();
    await frame(30);
    ok("icon confirm waits", dropRow.classList.contains("wait"));
    await frame(700);
    dropRow.click();
    await frame(30);
    ok("list re-renders",
      qa(".panel-body > stack > .panel", dynamic).length === 2
      && q(".panel-meta .badge", dynamic).textContent === "2");
    ok("list and stack rows",
      qa("list > .panel-inline", view).length === 3
      && qa("stack[gap='sm'] > .panel-inline", view).length >= 3);
    ok("empty with a child action", !!q(".empty .btn", view) && !!q(".empty .empty-desc", view));

    //-------------------------------------------------------------------------------------- Modals

    view = await open("Modals");
    button("Small confirm").click();
    await frame(100);
    const modal = shownModal();
    ok("modal opens",
      modal.classList.contains("show") && q(".modal-dialog", modal).classList.contains("sm"));
    ok("modal takes focus", modal.contains(document.activeElement));
    Alert.inf("over the modal", 0);
    await frame(50);
    const toast = q(".alerts .alert.show");
    pointer(toast, "pointerdown");
    toast.click();
    await frame(50);
    ok("a press on a toast keeps it open", modal.opened);
    Alert.clear();
    key(document, "Escape");
    await frame(300);
    ok("escape closes", !modal.opened && modal.hidden);
    ok("no scroll lock", css(document.body, "overflow") === "hidden" && !document.body.className);
    const modals = qa(".modal").length;
    button("Once").click();
    await frame(100);
    const once = shownModal();
    ok("once opens", !!once && qa(".modal").length === modals + 1);
    qa(".modal-foot .btn", once)[0].click();
    await frame(400);
    ok("once leaves the page", !once.isConnected && qa(".modal").length === modals);
    button("Form").click();
    await frame(100);
    const form = shownModal();
    q(".modal-dialog", form).click();
    form.click();
    await frame(50);
    ok("noClickAway", form.opened);
    form.close();
    await frame(300);

    //--------------------------------------------------------------------------------------- Menus

    view = await open("Menus");
    const trigger = button("right-top");
    trigger.click();
    await frame(100);
    const menu = q(".menu.show");
    ok("menu opens", vis(menu) && menu.opened && parseFloat(menu.style.left) > 0);
    trigger.click();
    await frame(300);
    ok("anchor toggles it", !menu.opened);
    trigger.click();
    await frame(100);
    pointer(document.body, "pointerdown");
    await frame(300);
    ok("a press outside closes it", !menu.opened && menu.hidden);
    button("Quick note").click();
    await frame(100);
    const noteMenu = q(".menu.show");
    ok("menu width and focus",
      noteMenu.style.width === "280px" && noteMenu.contains(document.activeElement));
    noteMenu.close();
    await frame(300);

    //--------------------------------------------------------------------------------------- Login

    const loginBtn = q(".login > .btn");
    loginBtn.click();
    await frame(80);
    const loginPanel = q(".login-panel");
    ok("login opens", !loginPanel.hidden && document.activeElement === q(".login-fields input"));
    const [userIn, passIn] = qa(".login-fields .input-group");
    userIn.value = "ada";
    passIn.value = "nope";
    key(passIn.input, "Enter");
    ok("login refuses", q(".login-error").textContent === "Wrong password (hint: demo)");
    passIn.value = "demo";
    key(passIn.input, "Enter");
    await frame(300);
    ok("login signs in",
      loginBtn.label === "ada"
      && loginBtn.icon === "person"
      && loginBtn.dataset.tooltip === "Logout"
      && loginPanel.hidden);
    loginBtn.click();
    await frame(50);
    ok("a click signs out", loginBtn.label === "Login" && !loginBtn.hasAttribute("data-tooltip"));

    //--------------------------------------------------------------------------------------- Docks

    view = await open("Docks");
    ok("dock width", q(".dock-left", view).style.width === "160px");
    const scrolling = qa(".dock[scroll]", view).pop();
    ok("dock scrolls",
      css(scrolling, "overflowY") === "auto" && scrolling.scrollHeight > scrolling.clientHeight);
    ok("middle stack scrolls", qa(".dock-row > stack[scroll][pad='md']", view).length === 2);
    const grow = qa(".panel", view).find((p) => p.title === "grow");
    ok("grow panel holds its dock", q(".dock-left", grow).offsetHeight > 100);

    //----------------------------------------------------------------------------------- FileDrops

    view = await open("FileDrops");
    const drop = q(".file-drop", view);
    ok("filedrop is an empty", drop.classList.contains("empty") && !!q("input[type=file]", drop));
    drop.selected = { name: "x.csv", size: 2048 };
    ok("filedrop selected",
      drop.classList.contains("file-drop-selected")
      && drop.title === "x.csv"
      && drop.icon === "description"
      && drop.description.startsWith("2.0kB"));
    drop.selected = null;
    drop.loading = true;
    ok("filedrop loading", q(".empty-icon", drop).classList.contains("spinner"));
    drop.loading = false;
    feed(drop, [["huge.png", "image/png", 2600000]]);
    await frame(30);
    ok("too big, in SI", alerts().some((a) => a.includes("too large (2.6MB, max 2.0MB)")));
    feed(drop, [["avatar.png", "image/png"]]);
    await frame(50);
    const avatar = q(".file-row", view);
    ok("an image becomes a FileRow with a thumb",
      !!q(".image", avatar)
      && !drop.isConnected
      && avatar.getAttribute("color") === "teal"
      && q(".icon", avatar).textContent === "image");
    q(".panel-actions .btn", avatar).click();
    await frame(50);
    ok("remove brings the drop back", drop.isConnected && !q(".file-row", view));
    feed(qa(".file-drop", view)[1],
      [["notes.md", "text/markdown", 1400], ["blink.hex", "", 2100]]);
    await frame(50);
    const attached = qa("list > .file-row", view);
    ok("attachments as FileRows",
      attached.length === 2
      && attached[0].getAttribute("color") === "blue"
      && q(".badge", attached[0]).textContent === "1.4kB"
      && attached.every((r) => !q(".image", r)));
    const keep = qa(".file-drop", view).pop();
    feed(keep, [["notes.txt", "text/plain"]]);
    await frame(50);
    ok("a drop keeps its file", keep.selected?.name === "notes.txt");
    keep.selected = null;

    //--------------------------------------------------------------------------------------- Files

    view = await open("Files");
    const table = q(".table", view);
    const column = (at) => qa("tbody tr", table).map((tr) => tr.children[at].textContent).join();
    ok("table heads",
      qa("th", table).map((th) => th.textContent).join() === "name,glyph,bytes,size,opens,main");
    ok("kind opens", column(4) === "image,pdf,text,text,gzip,dump,null");
    ok("kind main", column(5) === "copy,open,copy,copy,download,download,download");
    ok("kind sizes", column(3) === "2.3MB,860.0kB,1.4kB,320B,5.6MB,2.1kB,94.0MB");
    ok("kind glyphs",
      column(1) === "image,picture_as_pdf,markdown,settings,folder_zip,memory,video_file");
    const num = q("td.table-num", table);
    ok("numbers to the right",
      num.getAttribute("text") === "right" && css(num, "textAlign") === "right");
    ok("null in grey", qa("td.table-null", table).length === 1);
    const fileRows = qa(".file-row", view);
    ok("file rows",
      fileRows.length === 3 && !!q(".image", fileRows[0]) && !q(".image", fileRows[1]));
    const mainHeight = (r) => q(".panel-main", r).offsetHeight;
    ok("rows stand alike",
      fileRows.every((r) => mainHeight(r) === mainHeight(fileRows[0])),
      fileRows.map(mainHeight).join());
    ok("a row with no size",
      !q(".badge", fileRows[2]) && fileRows[2].getAttribute("color") === "neutral");
    const dump = qa(".code", view).pop();
    ok("dump of bytes",
      dump.value.split("\n").length === 3
      && dump.value.startsWith("00000000  00 50 00 20")
      && dump.value.includes("|TonkaJSX....")
      && !!q(".cd-meta", dump));

    //-------------------------------------------------------------------------------------- Images

    view = await open("Images");
    const lightbox = Lightbox.open("tonka.svg", "t");
    await frame(100);
    ok("lightbox opens", lightbox.opened && vis(lightbox));
    lightbox.close();
    await frame(400);
    ok("lightbox leaves", !lightbox.isConnected);
    button("empty").click();
    await frame(30);
    ok("img empty state", !!q(".image-empty", view));
    button("src").click();

    //---------------------------------------------------------------------------------------- Code

    view = await open("Code");
    const langs = q(".select", view);
    const ids = qa("option", langs).map((o) => o.value);
    ok("a sample per language",
      [...new Set(Object.values(Kind.LANG)), "dump"].every((id) => ids.includes(id)));
    const sampleBox = q(".code", view);
    const painted = ids.filter((id) => {
      langs.value = id;
      langs.dispatchEvent(new Event("change"));
      return sampleBox.lang === id && !!q(".code-paint [class^='cd-']", sampleBox);
    });
    ok("every sample paints", painted.length === ids.length);
    const md = q(".markdown", view);
    ok("markdown renders",
      !!q("h1", md)
      && qa(".checkbox", md).length === 2
      && !!q("table", md)
      && !!q("pre.code .cd-meta", md));
    button("Edit a file").click();
    await frame(150);
    const dialog = shownModal();
    ok("Code.open", q(".modal-title", dialog).textContent.startsWith("query.sql"));
    key(document, "Escape");
    await frame(400);
    ok("Code.open leaves", !dialog.isConnected);

    //----------------------------------------------------------------------------------- Documents

    view = await open("Documents");
    const docSearch = q(".dock-top .input-group", view);
    const statusText = () => q(".dock-bottom", view).textContent;
    ok("documents status", statusText() === "filter_listAll8 of 8 documents");
    typed(docSearch, "rate");
    ok("documents filter",
      qa("stack[scroll] > list > .panel", view).length === 1
      && statusText().endsWith(`search: "rate"`));
    typed(docSearch, "");
    ok("documents details", qa(".dock-right row[nowrap]", view).length === 3);

    //------------------------------------------------------------------------------------- Pickers

    view = await open("Color & Icon Pickers");
    const colors = q(".color-picker", view);
    ok("colorpicker value", colors.value === "teal");
    q(".color-dot[color='red']", colors).click();
    ok("colorpicker onChange",
      colors.value === "red" && q(".panel-inline[color]", view).getAttribute("color") === "red");

    //------------------------------------------------------------------------------------------ QR

    view = await open("QR");
    ok("qr save is an IconBtn", !!q(".btn-icon[data-tooltip='Save as .svg file']", view));
    typed(q(".input-group", view), "ABC");
    const qr = q(".qr", view);
    ok("qr follows its text",
      qr.text === "ABC" && (typeof qrcode !== "function" || qr.svg.startsWith("<svg")));

    //-------------------------------------------------------------------------------------- Layers

    const loose = document.createElement("div");
    loose.className = "panel";
    loose.hidden = true;
    document.body.appendChild(loose);
    ok("[hidden] beats .panel", css(loose, "display") === "none");
    loose.remove();
    ok("no flex-basis leak", css(q("h4"), "flexBasis") !== "100%");
  }
  catch(e) { out.push("THROW " + (e.stack || e)); }
  const failed = out.filter((line) => !line.startsWith("PASS")).length;
  out.push(`${out.length} steps, ${out.length - failed} pass, ${failed} fail`);
  return out.join("\n");
})();
