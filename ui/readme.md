# 🧩 Tonka UI

Component kit for TonkaJSX: real DOM elements, no virtual DOM, no CSS in app.
Layout is tags with attributes, components return elements with a few mutators, and one dictionary of colors and sizes serves everything.
Demo is the manual: every panel in its sidebar is one `.jsx` file.

```jsx
const rows = <stack gap="sm"></stack>;
const render = () => rows.replaceChildren(...users.map(u => (
  <Panel inline stripe color={u.color} icon="person"
    actions={<IconConfirmBtn onConfirm={() => remove(u)} />}>
    <strong>{u.name}</strong>
    <Badge color={u.color} variant="tint">{u.role}</Badge>
  </Panel>
)));

<Panel title="Users" icon="group" toolbar={<Input icon="search" clear onChange={filter} />}
  actions={<Button variant="primary" icon="add" onClick={add}>New</Button>}>
  {rows}
</Panel>
```

## 📐 Layout

| Tag | |
|:----|:-|
| `<row>` | flex row, wraps, full width |
| `<stack>` | flex column, full width; `fill` takes parent's height and lets `grow` child scroll |
| `<inline>` | inline flex, small gap |
| `<list>` | bordered column with dividers |
| `<sep />` `<spacer />` | a bullet or rule, a flexible gap |

| On container | On a child |
|:-----------------|:-----------|
| `gap="no xs sm md lg"` | `flex="1..12"` weight, `basis="xs sm md lg xl"` fixed width |
| `justify="start center end between"` | `grow` `stretch` `scroll` |
| `align="start center end stretch"` | `pad="no xs sm md lg"` `text="center right"` |
| `split` `nowrap` | `tone="tag meta note log"` `mono` `wrap` `quoted` `link` `hide-narrow` |

Narrow screens (≤ 720px): weighted columns of a `row` become lines unless the row is `nowrap`, a panel head and an inline panel's content wrap, an inline panel with actions puts them under its content unless it is `nowrap`, the topbar wraps, a modal takes the width, `hide-narrow` hides and `only-narrow` shows only there.
The shell is one screen tall in `dvh`, so a phone's sliding toolbars leave no strip of page to scroll past; a view scrolls inside it.

Colors: `neutral inf ok wrn err` and `red orange amber green teal blue purple pink gray`, everywhere as `color=`.
Sizes: `size="sm"` or `size="lg"`, everywhere.
`title` is a tooltip, `hidden` hides anything, native attributes pass through to root element.

## 🧩 Components

**Shell**

```jsx
<Shell
  sidebar={<Sidebar>{navButtons}<spacer /><SidebarBtn icon="settings" title="Settings" /></Sidebar>}
  topbar={<Topbar><TopbarLogo img="logo.svg">App</TopbarLogo><spacer /><Login session={Session} /></Topbar>}
  footer={<Footer left={statusTag} center={credits} />}>
  <Content>{views}</Content>
</Shell>

<SidebarBtn icon="home" title="Home" active onClick={() => show("home")} />
<Dock pos="left" width="220px" tint scroll>{nav}</Dock>
```

A view that owns its whole area sets `content.fullbleed = true` and is a `<stack fill gap="no">` of docks with a `<DockRow grow>` in the middle.

**Panel**

```jsx
<Panel title="Users" icon="group" meta={<Badge>12</Badge>} actions={<Button icon="add">New</Button>}
  toolbar={<Input icon="search" clear onChange={filter} />}>
  {rows}
</Panel>

<Panel title="Settings" tabs={[{ key: "general", icon: "tune", label: "General" }]} onChange={(key) => ...}>
  <TabPanel value="general">...</TabPanel>
</Panel>

<Panel inline stripe color="red" icon="key" actions={<IconConfirmBtn onConfirm={remove} />}>
  <strong>API_KEY</strong>
  <Badge color="red" variant="tint">secret</Badge>
</Panel>

<Empty icon="inbox" title="No messages" description="Nothing yet." fill />
<FileDrop accept="image/*" maxSize={2e6} onFiles={([file]) => save(file)} onError={Alert.err} />
```

Looks: `stripe color tint dashed ghost glow flash pointer top size compact flush`; space: `grow fill height maxWidth maxHeight`; state: `selected armed confirm moved danger`. A `<TabPanel>` of a `grow` or `fill` panel fills the body too, so a surface inside a pane ends where the panel ends.
Mutators: `.title .icon .color .state .selected .tab` on a Panel, `.icon .title .description` on an Empty, `.selected .loading` on a FileDrop.

**Buttons**

```jsx
<Button variant="primary" icon="add" onClick={create}>Create</Button>
<Button variant="ghost" size="sm" title="Tooltip">Cancel</Button>
<IconBtn icon="edit" title="Edit" />
<ActiveBtn icon="bolt" active onChange={(on) => ...}>Toggle</ActiveBtn>
<Toggle value="list" onChange={(v) => ...}>
  <ToggleBtn value="list" icon="view_list" label="List" />
  <ToggleBtn value="grid" icon="grid_view" label="Grid" />
</Toggle>
<ConfirmBtn label="Delete" onConfirm={remove} />
<IconConfirmBtn variant="ghost" color="purple" onConfirm={signOut} />
```

Mutators: `.icon .label .title .active .loading` on a Button, `.title` on a ConfirmBtn, `.value` on a Toggle; confirm buttons fire on second click within three seconds.

**Inputs**

```jsx
<Input icon="person" placeholder="Name" value="Ada" onChange={(v) => ...} />
<Input icon="search" clear onEnter={(q) => search(q)} />
<NumberInput value={8080} min={1} max={65535} onChange={(n) => ...} />
<PasswordInput />
<SearchInput onSearch={(q) => ...} />
<Textarea auto minRows={3} maxRows={10} onSubmit={(v) => ...} />
<DatePicker format="%Y-%m-%d %H:%M" value="2026-10-01 12:00" onChange={(v) => ...} />
<Select value="b" onChange={(v) => ...}><option value="b">B</option></Select>
<Checkbox label="Enable" checked onChange={(on) => ...} />
```

A text field returns a wrapper with `.value`, `.title`, `.focus()` and native `.input`; a Select is native element, a Checkbox has `.checked` and `.input`.

A file name answers for itself: `fileIcon(name)` `fileColor(name)` `isImage(name)` `isText(name)` `isPdf(name)` `imageType(name)` `fileExt(name)`, and `sizeText(bytes)` gives `860B`, `1.4kB`, `2.3MB`. One table for every app that lists files, so the same extension never wears two glyphs.

Helpers: `UI.copy(btn, text, {icon, clearAfter})` copies and flashes a check on an icon button, `clearAfter` seconds later taking the copy back (`UI.uncopyNow()` does it at once); `UI.linkify(text)` gives text as children with every http(s) address a `[link]`; `UI.script(src, sri)` loads a script once, on demand; `<TopbarLogo mark={canvas}>` takes any element as the brand mark.

**Feedback and overlays**

```jsx
Alert.ok("Saved");
Alert.err("Failed", 0);
const yes = await Alert.ask("err", "Delete?");

<Badge color="err" variant="tint" icon="lock">locked</Badge>
<Spinner color="inf" text="Loading..." />
<Progress value={75} color="ok" label />
<Img src="logo.svg" height="md" rounded border title="Logo" />
<Code lang="conf.ini" height="md" value={text} onChange={(t) => ...} />   // readOnly, wrap
Code.open("notes.md", text, { onSave });   // the same box in a dialog
Syntax.paint(text, "query.sql");   // just the colours, no element
<ColorPicker value="teal" gray onChange={(c) => ...} />
<IconPicker icons={["key", "lock"]} value="key" onChange={(ic) => ...} />
<QrCode text="HELLO" size={200} />   // needs qrcode-generator on the page; .text, .svg
<QrScan onScan={(text) => ...} onError={Alert.err} />   // .start() .stop(); BarcodeDetector or jsQR

const modal = <Modal title="Edit" size="sm" footer={<Button>Save</Button>}>...</Modal>;
// size sm | lg | xl; noClickAway keeps a stray click outside from closing it
modal.open();
const menu = <Menu title="Actions">...</Menu>;
menu.toggle(anchorBtn);
Lightbox.open(src);
Theme.toggle();
```

Mutators: `.text .color .icon` on a Badge, `.text` on a Spinner, `.value .max` on a Progress, `.src .alt .loading` on an Img, `.value` on a picker, `.value .lang .readOnly` on a Code.
A Code paints json, ini, yaml, sql, md, log and csv, csv by column; anything else comes back escaped. Colours are the syntax tokens in `brand.css`.
Overlays share `.open() .close() .toggle() .opened`; Escape or a click outside closes them.

## 🗂️ Files

```
scripts/
  App.jsx            Shell, Sidebar, Topbar, Content, Footer
  <View>.jsx         one file per view
  lib/jsx.js         runtime, JSX.*
  ui/ui.js           glue shared by components, UI.*
  ui/kind.js         what a file name says about its file, `fileIcon` and friends
  ui/syntax.js       the languages `Code` paints, `Syntax.*`
  ui/<Component>.jsx
styles/
  face/              tokens, reset, fonts, icons
  ui/layout.css      tags and attributes above
  ui/<component>.css one file per component
```

Colors are `light-dark()` pairs in `styles/face/brand.css`; a new color is one token there and one line in its dictionary in `ui/layout.css`.
CSS sits in four cascade layers, `tokens < base < components < utilities`, which is why an attribute in JSX never fights a component.
