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
| `split` `nowrap` | `tone="tag meta note log"` `mono` `wrap` `quoted` `hide-narrow` |

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

Looks: `stripe color tint dashed ghost glow flash pointer top size compact flush`; space: `grow fill height maxWidth maxHeight`; state: `selected armed confirm moved danger`.
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

**Feedback and overlays**

```jsx
Alert.ok("Saved");
Alert.err("Failed", 0);
const yes = await Alert.ask("err", "Delete?");

<Badge color="err" variant="tint" icon="lock">locked</Badge>
<Spinner color="inf" text="Loading..." />
<Progress value={75} color="ok" label />
<Img src="logo.svg" height="md" rounded border title="Logo" />
<ColorPicker value="teal" gray onChange={(c) => ...} />
<IconPicker icons={["key", "lock"]} value="key" onChange={(ic) => ...} />

const modal = <Modal title="Edit" size="sm" footer={<Button>Save</Button>}>...</Modal>;
modal.open();
const menu = <Menu title="Actions">...</Menu>;
menu.toggle(anchorBtn);
Lightbox.open(src);
Theme.toggle();
```

Mutators: `.text .color .icon` on a Badge, `.text` on a Spinner, `.value .max` on a Progress, `.src .alt .loading` on an Img, `.value` on a picker.
Overlays share `.open() .close() .toggle() .opened`; Escape or a click outside closes them.

## 🗂️ Files

```
scripts/
  App.jsx            Shell, Sidebar, Topbar, Content, Footer
  <View>.jsx         one file per view
  lib/jsx.js         runtime, JSX.*
  ui/ui.js           glue shared by components, UI.*
  ui/<Component>.jsx
styles/
  face/              tokens, reset, fonts, icons
  layout.css         tags and attributes above
  ui/<component>.css one file per component
```

Colors are `light-dark()` pairs in `styles/face/brand.css`; a new color is one token there and one line in its dictionary in `layout.css`.
CSS sits in four cascade layers, `tokens < base < components < utilities`, which is why an attribute in JSX never fights a component.
