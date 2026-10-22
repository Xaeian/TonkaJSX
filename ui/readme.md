# 🧩 Tonka UI

Component kit for TonkaJSX: real DOM elements, no virtual DOM, no CSS in app.
Layout is tags with attributes, components return elements with a few mutators, and one dictionary of colours and sizes serves everything.
Demo is the manual: every panel in its rail is one `.jsx` file.

```jsx
const rows = <stack gap="sm"></stack>;
const render = () => rows.replaceChildren(...users.map(u => (
  <Panel inline stripe color={u.color} icon="person"
    actions={<IconConfirmBtn onConfirm={() => remove(u)} />}>
    <strong>{u.name}</strong>
    <Badge color={u.color} variant="tint">{u.role}</Badge>
  </Panel>
)));

<Panel title="Users" icon="group" toolbar={<SearchInput onChange={filter} />}
  actions={<Button variant="primary" icon="add" onClick={add}>New</Button>}>
  {rows}
</Panel>
```

## ▶️ Run

```sh
tonka serve ui  # the manual
```

A page needs `jsx.js` of the library.
`QrCode` needs `qrcode-generator` on the page; `QrScan` reads with `BarcodeDetector`, else with `jsQR`.
`Login` takes a session as `createSession` of `session.js` makes one, and `Theme.remember` a store such as `createCache` of `cache.js`.

## 📐 Layout

| Tag | |
|:----|:-|
| `<row>` | flex row, wraps, full width |
| `<stack>` | flex column, full width; `fill` takes parent's height and gives the rest to a `grow` child |
| `<inline>` | inline flex, small gap: an icon and its words |
| `<list>` | bordered column with dividers |
| `<sep />` `<spacer />` | a dot, a rule in a `<stack>`, nothing with `blank`; a flexible gap |

| On container | On a child |
|:-----------------|:-----------|
| `gap="no xs sm md lg"` | `flex="1..12"` weight, `basis="xs sm md lg xl"` fixed width |
| `justify="start center end between"` | `grow` `stretch` `scroll` `pointer` |
| `align="start center end stretch baseline"` | `pad="no xs sm md lg"` `text="center right"` |
| `split` `nowrap` | `tone="tag meta note log"` `mono` `wrap` `quoted` `link` |
| | `sunken` ground, `glow` on hover, `edge` line and `wash` ground in its `color=` |
| | `hide-narrow` `only-narrow` |

A text tag (`span strong code b i small p`) with `flex` or `basis` cuts its text with an ellipsis.
An `.icon` takes `color=` and `size="sm"`, and sits mid-word in a row with `align="baseline"`.

Narrow screens (≤ 720px): weighted children of a `row` take a line each unless the row is `nowrap`, a panel head and an inline panel's content wrap, an inline panel with actions puts them under its content unless it is `nowrap`, the topbar wraps and folds its `fold` children under More, a modal takes the width, `hide-narrow` hides and `only-narrow` shows only there.
A footer under 700px wide gives its centre up to the side slots that hold something.
The shell is one screen tall in `dvh`, so a phone's sliding toolbars leave no strip of page to scroll past; a view scrolls inside it.

Colours: `neutral inf ok wrn err` and `red orange amber green teal blue purple pink gray`, everywhere as `color=`.
Sizes: `size="sm"` or `size="lg"`; a Modal also takes `xl`, a QrCode takes pixels, an `.icon` takes `sm` alone.
An Img's `height` and `width` take `sm md lg` (40, 80, 160px), a Code's or a Markdown's `height` `sm md lg` (12rem, 20rem, a page); each also takes a length.
`title` is the kit tooltip, and the heading on a component that has one; `hidden` hides anything; native attributes pass through to root element.

## 🧩 Components

**Shell**

```jsx
<Shell
  sidebar={<Sidebar>{navButtons}<spacer /><ThemeBtn /></Sidebar>}
  topbar={<Topbar><TopbarLogo mark={<Logo />}>App</TopbarLogo><spacer /><SearchInput fold /><Login session={Session} /></Topbar>}
  footer={<Footer left={section} center={credits} right={counters} />}>
  <Content>{views}</Content>
</Shell>
```

- `SidebarBtn icon title active badge` is a rail button, `badge` a `<Badge pos="top-right">` on its corner.
- `ThemeBtn` flips light and dark; its icon and tooltip follow whoever changed the theme.
- `Theme.set("dark" | "light" | "system")`, `.toggle()`, `.current()`, `.choice()`, `.isDark()`, `.onChange(fn)`; every change fires `theme:change` on `document`, and `Theme.remember(store)` keeps the choice.
- A `Topbar` child with `fold` moves under a More button on a narrow screen and back on a wide one.
- `TopbarLogo mark img alt` with `.img`: a mark offering `_spin()` and `_rest()`, as `Logo` does, spins while its link is hovered or focused.
- `Footer left center right` slots are elements to mutate; an icon and its words are one `<inline>`.
- `Login session` signs in through `login(user, pass)`, `logout()` and `onChange(fn)` reporting `{status, user, error}`; signed in, its button names the user and a click signs out.
- `content.fullbleed = true` hands padding and scroll to the view, a `<stack fill gap="no">` of `<Dock pos="top|bottom|left|right" width tint scroll>` around a `<DockRow>`.
- A `DockRow` takes the free height of its parent, or its content's where the parent sets none.

**Panel**

```jsx
<Panel title="Users" icon="group" meta={<Badge>12</Badge>} actions={<Button icon="add">New</Button>}
  toolbar={<Input icon="search" clear onChange={filter} />}>
  {rows}
</Panel>

<Panel title="Settings" tabs={[{ key: "general", icon: "tune", label: "General" }]} onChange={(key) => ...}>
  <TabPanel value="general">...</TabPanel>
</Panel>

<Panel inline stripe color="red" icon="key" title="Open" onClick={open} actions={<IconConfirmBtn onConfirm={remove} />}>
  <strong>API_KEY</strong>
</Panel>
```

- Looks: `stripe color tint dashed ghost glow flash compact flush size`; space: `grow height maxWidth`; `inline` is one row, `inline stack` piles its content.
- `state="selected|armed|moved|danger|done"` tints a panel, `done` fades it; `selected` is short for `state="selected"`.
- A card's `title` is its heading, an inline row's its tooltip; a click among `actions` never reaches the Panel's `onClick`.
- A `<TabPanel>` of a `grow` panel fills the body, so a surface inside a pane ends where the panel ends.
- Mutators: `.title .icon .color .state .selected .value` (the open tab).
- `<Columns breaks={[600, 900]} gap="sm">` deals cards into one column, and one more at each width its box reaches; `.items` deals new ones.
- `<Empty icon title description size>` holds the place of an empty list, an action as its child; `grow` fills; `.icon .title .description`.

**Files**

```jsx
<FileDrop accept="image/*" maxSize={2e6} onFiles={([file]) => save(file)} onError={Alert.err} />
<FileRow name="photo.jpg" size={2300000} meta={date} actions={removeBtn}>
  <FileThumb name="photo.jpg" src={url} /><span>photo.jpg</span>
</FileRow>
<Table columns={["name", "bytes"]} rows={[["a.txt", 860], { name: "b.txt", bytes: null }]} />
```

- `FileDrop accept multiple maxSize maxCount icon title description size`: nothing reaches `onFiles` unless every file passes, the first failure goes to `onError`; `.selected` shows a file until a click clears it (`onClear`), `.loading` spins.
- A `FileRow` wears the glyph and colour of its name, its weight in SI, then `meta`; every row stands as tall as one with a `FileThumb`.
- A `Table` keeps its head in view, sets a column of numbers right and colours a value by its kind; a long cell is cut and its tooltip holds the whole.
- `Kind` reads a file name, a copy's `.bak` `.old` `.orig` looked past: `ext`, `icon`, `color`, `isImage`, `isText`, `isPdf`, `isGzip`, `imageType`, `gunzipName`, `opens(name, size)` (`image pdf text gzip dump`, `null` past 8MB), `sizeText(bytes)` (`860B`, `1.4kB`, `2.3MB`), and the tables `IMAGE_EXT`, `TEXT_EXT`, `LANG`.
- `Dump.text(name, bytes)` writes bytes out to read, an Intel HEX as its memory, for a `Code` in `dump`; `Dump.gunzip(bytes)` opens a gzip.

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

Variants `primary danger ghost rail`; mutators `.icon .label .title .active .loading` on a Button, `.title .loading` on a confirm button, `.value` on a Toggle.
A confirm button fires on a second click within three seconds; `waitLabel` and `confirmLabel` name its steps, `onArm` hears the first click.

**Inputs**

```jsx
<Input icon="person" placeholder="Name" value="Ada" onChange={(v) => ...} />
<Input icon="dns" clear suggest={hosts} onEnter={(v) => ...} onEscape={(v) => ...} />
<NumberInput value={8080} min={1} max={65535} onChange={(n) => ...} />
<PasswordInput />
<SearchInput onEnter={(q) => ...} />
<Textarea auto minRows={3} maxRows={10} onSubmit={(v) => ...} />
<DatePicker format="%Y-%m-%d %H:%M" value="2026-10-01 12:00" onChange={(v) => ...} />
<Select value="b" onChange={(v) => ...}><option value="b">B</option></Select>
<Checkbox label="Enable" size="sm" checked onChange={(on) => ...} />
{formRow("Retry", named("times", timesIn), named("every", everyIn))}
{formNote(<span tone="note">Escape puts the host back.</span>)}
```

- A field is a wrapper with `.value .disabled .placeholder .title .focus() .input`, an Input also `.suggest`; every handler gets the value, `onKeyDown` the event.
- A NumberInput reads `null` when empty, a PasswordInput is never offered to the browser to remember, a Textarea submits on Ctrl+Enter.
- A DatePicker takes its native type from `format` (`%Y %m %d %H %M %S`), which also writes its value.
- A Select is the native element; a Checkbox has `.checked .disabled .title .input`, and a set `.checked` fires nothing.
- `formRow(label, ...ctrl)` is one line of a sheet, `named(label, ctrl)` gives one control of several its own small name, `formNote(...lines)` says what the lines above mean.

**Feedback and overlays**

```jsx
Alert.ok("Saved");
Alert.err("Failed", 0);
const yes = await Alert.ask("err", "Delete?");

<Badge color="err" variant="tint" icon="lock">locked</Badge>
<Spinner color="inf" text="Loading..." />
<Progress value={4} max={10} color="ok" label />
<Img src="logo.svg" height="md" rounded border title="Logo" onClick={() => Lightbox.open("logo.svg")} />

const modal = <Modal title="Edit" size="sm" footer={<Button>Save</Button>}>...</Modal>;
modal.open();
const menu = <Menu title="Actions">...</Menu>;
menu.toggle(anchorBtn);
```

- `Alert.inf ok wrn err(msg, ms)`, `.show(type, msg, ms)`, `.ask(type, msg, {ok, cancel})`, `.clear()`, `.config({max})`: the same message refreshes its toast, `ms` 0 keeps one until dismissed, past `max` the oldest goes.
- `Badge color variant="solid|tint|outline" size icon mono pos` with `.color .text .title`; `mono` also selects it whole on a click.
- `Spinner color size text`; `Progress value max color size label` with `.value`, indeterminate without one.
- `Img src alt height width maxWidth fit minSquare rounded circle border fallbackText` with `.src .loading`.
- `Modal title size noClose noClickAway once actions footer onChange`: Escape, the backdrop and its close button dismiss it, a press on a toast never does, and `once` takes it out of the page on close.
- `Menu title pos width offsetX onChange` opens at `.open(anchor)`, one menu for many anchors; `Lightbox.open(src, alt)` shows a picture full size.
- Overlays share `.open() .close() .toggle() .opened`.
- A tooltip follows a mouse or a pen, never a finger; `data-tooltip-pos` places it.

**Code**

```jsx
<Code lang="conf.ini" height="md" value={text} onChange={(t) => ...} />   // readOnly, wrap, numbers
Code.open("notes.md", text, { onSave });   // the same box in a dialog
Syntax.paint(text, "query.sql");   // the colours, no element
<Markdown text={md} height="md" onCheck={(t) => save(t)} />   // a page to read
```

- A Code paints `json ini yaml sql md log csv dump c cpp js py sh rust html css`, the language read off a file name where one is given; anything else comes back escaped; `.value .lang .readOnly .focus() .input`.
- `Syntax.lang(name)`, `Syntax.paint(text, lang)` and `Syntax.paintLines(text, lang)` give the colours without the box.
- `Markdown text height image breaks onCheck` with `.text`: headings, lists, quotes, tables, pictures and painted fences; a `[ ]` box ticks once `onCheck` takes the text.

**Pickers and QR**

```jsx
<ColorPicker value="teal" gray onChange={(c) => ...} />
<IconPicker icons={["key", "lock"]} value="key" onChange={(ic) => ...} />
<QrCode text="HELLO" size={200} />   // .text, .svg
<QrScan onScan={(text) => ...} onError={Alert.err} />   // .start() .stop()
```

**Helpers**

- `UI.copy(btn, text, {clearAfter})` copies and flashes a check on a copy button, spinning over a promise of text; `clearAfter` seconds later the copy goes, at once with `UI.uncopyNow()`.
- `UI.copyPicture(btn, blob)` copies a picture in any format as PNG.
- `UI.linkify(text)` gives text as children with every http(s) address a link, `UI.markup(text)` with Markdown's inline marks live as well.
- `UI.script(src, sri)` loads a script once, on demand.
- For a component of one's own: `UI.prop`, `UI.text`, `UI.title`, `UI.active` and `UI.loading` make mutators, `UI.overlay` opens and closes, `UI.place` sets by an anchor, `UI.focusable` lists what takes focus, `UI.duration(el)` reads a transition in ms.

## 🗂️ Files

```
scripts/
  App.jsx            Shell, Sidebar, Topbar, Content, Footer
  <View>.jsx         one file per view
  Logo.jsx           house mark, a TopbarLogo mark
  ui/ui.js           glue shared by components, UI.*
  ui/theme.js        Theme
  ui/kind.js         what a file name says, Kind
  ui/dump.js         bytes as text, Dump
  ui/syntax.js       languages Code paints, Syntax
  ui/<Component>.jsx
styles/
  face/              tokens, reset, fonts, icons
  ui/layout.css      tags and attributes above
  ui/card.css        frame of panels, modals and menus
  ui/<component>.css one file per component
```

Colours are tokens in `styles/face/brand.css`, the semantic ones `light-dark()` pairs; a new colour is two tokens there (`--x`, `--x2`) and one line in `ui/layout.css`.
CSS sits in four cascade layers, `tokens < base < components < utilities`, which is why an attribute in JSX never fights a component.
