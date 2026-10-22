// scripts/ui/Code.jsx

// What a height puts on a box as `Code` and `Markdown` take it, null for none:
// a preset as an attribute the stylesheet sizes, any other length as a style, a number in pixels
function _height(height) {
  if(height == null || height === "") return null;
  if(["sm", "md", "lg"].includes(height)) return { height };
  return { style: { height: typeof height === "number" ? height + "px" : String(height) } };
}

// Painting rebuilds the whole document and hands it to the parser.
// A short file can afford that on every keystroke;
// past this many characters it cannot, so its colours land once the typing has settled instead.
const _PAINT_ALL = 40000;
const _PAINT_MS = 120;

/**
 * Source in its own colours, to read or to write.
 * A transparent field lies over a painted copy of the same text, so the caret, the selection
 * and the scrolling are the browser's own while the colours are ours.
 * `Syntax` decides what a name is written in; without `onChange` the field is still there,
 * and `readOnly` takes it away.
 * `.focus()` puts the caret at the top, so the view starts there too.
 *
 * Mutators: .value, .lang, .readOnly, .focus(), .input
 *
 * @param {object} props
 * @param {string} [props.value]
 * @param {string} [props.lang]  a language id, or a file name to take one from
 * @param {string|number} [props.height]  "sm" 12rem, "md" 20rem, "lg" a page, or any length
 * @param {boolean} [props.readOnly]
 * @param {boolean} [props.wrap]  long lines fold instead of running off the side
 * @param {boolean} [props.numbers]  a gutter counting the source lines, folds and all;
 *   the column holds three digits and the count starts over past them, so it never widens
 * @param {(text:string) => void} [props.onChange]
 */
const Code = ({ value = "", lang, height, readOnly, wrap, numbers, onChange,
  class: className, ...rest }) => {
  const paint = <pre class="code-paint" aria-hidden="true"></pre>;
  const field = <textarea class="code-field" spellcheck={false}></textarea>;
  const el = (
    <div {...rest} {..._height(height)}
      class={["code", wrap && "code-wrap", numbers && "code-num", className]}>
      {paint}
      {field}
    </div>
  );

  let _lang = lang;
  let _soon = null;
  // A number wider than the column would push the text of that one line out of line
  // with the field, so the count wraps instead of the column growing.
  const no = numbers ? (i) => `<span class="code-no">${(i + 1) % 1000}</span>` : () => "";
  function repaint() {
    clearTimeout(_soon);
    paint.innerHTML = Syntax.paintLines(field.value, _lang)
      .map((r, i) => `<div class="code-line">${no(i)}${r}</div>`).join("");
  }
  function repaintSoon() {
    if(field.value.length < _PAINT_ALL) { repaint(); return; }
    clearTimeout(_soon);
    _soon = setTimeout(repaint, _PAINT_MS);
  }

  field.value = value ?? "";
  field.wrap = wrap ? "soft" : "off";
  field.addEventListener("input", () => { repaintSoon(); onChange?.(field.value); });
  field.addEventListener("scroll", () => {
    paint.scrollTop = field.scrollTop;
    paint.scrollLeft = field.scrollLeft;
  });

  // Tab indents a field open to writing rather than leaving it,
  // and the modal's focus trap never sees it
  field.addEventListener("keydown", (e) => {
    if(e.key !== "Tab" || field.readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    field.setRangeText("  ", field.selectionStart, field.selectionEnd, "end");
    repaintSoon();
    onChange?.(field.value);
  });

  UI.prop(el, "value", () => field.value, (v) => { field.value = v ?? ""; repaint(); });
  UI.prop(el, "lang", () => _lang, (v) => { _lang = v; repaint(); });
  UI.prop(el, "readOnly", () => field.readOnly, (v) => { field.readOnly = !!v; });
  el.focus = () => { field.setSelectionRange(0, 0); field.focus(); };
  el.input = field;

  el.readOnly = !!readOnly;
  repaint();
  return el;
};

/**
 * The same box in a dialog, titled by the file it holds.
 * `onSave` is what makes it writable:
 * given one, the footer gains a Save, and closing with unsaved text asks first.
 * It may return a promise, and the button waits on it.
 *
 * @param {string} name
 * @param {string} text
 * @param {object} [opts]
 * @param {(text:string) => (void|Promise)} [opts.onSave]
 * @param {string} [opts.lang]  a painter's own id, when the name would pick the wrong one
 * @returns {Element} the dialog, already open
 */
Code.open = (name, text, { onSave, lang } = {}) => {
  let dirty = false;

  const box = (
    <Code height="lg" wrap numbers value={text} lang={lang || name} readOnly={!onSave}
      onChange={() => { if(!dirty) hold(); }} />
  );

  const saveBtn = onSave
    ? <Button variant="primary" icon="check" disabled onClick={save}>Save</Button>
    : null;
  const closeBtn = <Button icon="close" onClick={() => modal.close()}>
    {onSave ? "Cancel" : "Close"}
  </Button>;
  // once there is something to lose, leaving takes a second click and says what it costs
  const dropBtn = onSave
    ? <ConfirmBtn icon="close" label="Cancel" confirmLabel="Discard" hidden
        onConfirm={() => close()} />
    : null;

  // The first change swaps the plain way out for the one that asks
  function hold() {
    dirty = true;
    saveBtn.disabled = false;
    closeBtn.hidden = true;
    dropBtn.hidden = false;
  }

  async function save() {
    saveBtn.loading = true;
    try { await onSave(box.value); }
    catch(e) { Alert.err(e.detail || e.message); return; }
    finally { saveBtn.loading = false; }
    dirty = false;
    close();
  }

  const badge = (
    <Badge variant="tint" color="neutral" size="sm" mono>{lang || Syntax.lang(name)}</Badge>
  );
  const title = <span>{name} {badge}</span>;
  const modal = (
    <Modal once title={title} size="xl" noClickAway footer={<>{closeBtn}{dropBtn}{saveBtn}</>}
      onChange={(opened) => { if(opened) requestAnimationFrame(() => box.focus()); }}>
      {box}
    </Modal>
  );

  // Escape and the close button go through this property, so wrapping it sends every way out
  // to the one that asks: the first press arms Cancel, the next one takes it.
  const close = modal.close;
  modal.close = () => dirty ? dropBtn.click() : close();

  modal.open();
  return modal;
};
