// scripts/ui/Input.jsx

/**
 * Wraps a native field in `.input-group`.
 * The wrapper is what the app holds: `.value`, `.title`, `.focus()`, `.input` (the field).
 * `accessor` replaces the value get/set.
 */
const _group = (field, { icon, trailing, size, ghost, title, accessor, class: className,
  ...rest }) => {
  const wrap = (
    <div {...rest} class={["input-group", size, ghost && "input-group-ghost", className]}
      title={title}>
      {icon ? <span class="icon">{icon}</span> : null}
      {field}
      {trailing}
    </div>
  );
  // the trailing control reads the field, so it has to hear about a value set from code
  const write = accessor?.set || ((v) => { field.value = v ?? ""; });
  UI.prop(wrap, "value",
    accessor?.get || (() => field.value),
    (v) => { write(v); trailing?.sync?.(); });
  UI.title(wrap);
  wrap.input = field;
  wrap.focus = () => field.focus();
  return wrap;
};

/** Keyboard wiring shared by the text fields. */
const _keys = (field, { onChange, onEnter, onKeyDown }) => {
  if(onChange) field.addEventListener("input", (e) => onChange(field.value, e));
  if(onEnter) field.addEventListener("keydown", (e) => {
    if(e.key === "Enter") onEnter(field.value, e);
  });
  if(onKeyDown) field.addEventListener("keydown", onKeyDown);
};

/** Trailing X that wipes the field; kept in the layout so the width never jumps. */
const _clearBtn = (field, onChange) => {
  const btn = <span class="icon input-group-btn" title="Clear">close</span>;
  btn.sync = () => { btn.style.visibility = field.value ? "visible" : "hidden"; };
  field.addEventListener("input", btn.sync);
  btn.addEventListener("click", () => {
    field.value = "";
    btn.sync();
    onChange?.("", null);
    field.focus();
  });
  btn.sync();
  return btn;
};

/**
 * Text input.
 *
 * Mutators: .value, .title, .focus(), .input
 *
 * @param {Object} props
 * @param {string} [props.type="text"]
 * @param {string} [props.placeholder]
 * @param {string} [props.value]
 * @param {string} [props.icon]
 * @param {"sm"|"lg"} [props.size]
 * @param {boolean} [props.ghost]     borderless
 * @param {boolean} [props.clear]     trailing X
 * @param {boolean} [props.disabled]
 * @param {string} [props.name]
 * @param {(value:string, e:Event|null) => void} [props.onChange]   e is null after Clear
 * @param {(value:string, e:KeyboardEvent) => void} [props.onEnter]
 * @param {(e:KeyboardEvent) => void} [props.onKeyDown]
 * @param {string} [props.title]
 */
const Input = ({ type = "text", placeholder, value, clear, disabled, name,
  onChange, onEnter, onKeyDown, ...rest }) => {
  const field = (
    <input type={type} placeholder={placeholder} value={value ?? ""}
      name={name} disabled={disabled} />
  );
  _keys(field, { onChange, onEnter, onKeyDown });
  if(!clear) return _group(field, rest);
  // a programmatic `.value` keeps the X in step with the field
  const btn = _clearBtn(field, onChange);
  return _group(field, { ...rest, trailing: btn, accessor: {
    get: () => field.value,
    set: (v) => { field.value = v ?? ""; btn.sync(); },
  } });
};

/**
 * One line of a form: its name on the left, its controls on the right.
 *
 * A dozen settings packed several to a line is a wall; laid out as a sheet they read one at
 * a time, which is the shape anything with more of them than a row can carry ends up in.
 *
 * @param {string} label
 * @param {...(Element|null)} ctrl  a null does not appear, so a field that belongs to one
 *   case only can be passed on every call
 */
const formRow = (label, ...ctrl) => (
  <row>
    <strong flex="2">{label}</strong>
    <row flex="10">{ctrl}</row>
  </row>
);

/**
 * Number input; `onChange` gets `null` for an empty field.
 * @param {Object} props
 * @param {number} [props.value]
 * @param {number} [props.min]
 * @param {number} [props.max]
 * @param {number} [props.step=1]
 * @param {(value:number|null, e:Event) => void} [props.onChange]
 */
const NumberInput = ({ value, min, max, step = 1, placeholder, disabled, name,
  onChange, onEnter, onKeyDown, ...rest }) => {
  const field = (
    <input type="number" placeholder={placeholder} value={value != null ? String(value) : ""}
      min={min} max={max} step={step} name={name} disabled={disabled} />
  );
  const num = () => field.value === "" ? null : Number(field.value);
  _keys(field, {
    onChange: onChange && ((_, e) => onChange(num(), e)),
    onEnter: onEnter && ((_, e) => onEnter(num(), e)),
    onKeyDown,
  });
  return _group(field, rest);
};

// A browser offers to save whatever a `type="password"` field held
// the moment it leaves the page or hides, and `autocomplete="off"` does not stop it.
// A text field masked by CSS is nothing to a password manager, so where the property exists
// the field is one; elsewhere it is a password field and the offer is the browser's to make.
const _MASK_CSS = CSS.supports("-webkit-text-security", "disc");

/**
 * Password input with a show/hide eye. The browser is never asked to remember the value.
 * @param {Object} props
 * @param {string} [props.icon="lock"]
 */
const PasswordInput = ({ placeholder, value, icon = "lock", disabled, name,
  onChange, onEnter, onKeyDown, ...rest }) => {
  const field = (
    <input type={_MASK_CSS ? "text" : "password"} class={_MASK_CSS && "masked"}
      placeholder={placeholder} value={value ?? ""} name={name} disabled={disabled}
      autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck={false} />
  );
  _keys(field, { onChange, onEnter, onKeyDown });
  const hidden = () => _MASK_CSS
    ? field.classList.contains("masked")
    : field.type === "password";
  const mask = (on) => {
    if(_MASK_CSS) field.classList.toggle("masked", on);
    else field.type = on ? "password" : "text";
  };
  // the eye tells the state: crossed while the value hides, open while it shows;
  // its tooltip names no "password", since the field holds a secret, a key or a token as often
  const eye = <span class="icon input-group-btn" title="Show">visibility_off</span>;
  eye.addEventListener("click", () => {
    const show = hidden();
    mask(!show);
    eye.textContent = show ? "visibility" : "visibility_off";
    eye.setAttribute("data-tooltip", show ? "Hide" : "Show");
  });
  return _group(field, { ...rest, icon, trailing: eye });
};

/**
 * Search input: magnifier, clear button, `onSearch` on Enter.
 * @param {Object} props
 * @param {string} [props.placeholder="Search..."]
 * @param {(value:string, e:KeyboardEvent) => void} [props.onSearch]
 */
const SearchInput = ({ placeholder = "Search...", onSearch, ...rest }) => (
  <Input icon="search" clear placeholder={placeholder} onEnter={onSearch} {...rest} />
);

/**
 * Multiline field.
 * Fixed `rows` by default; `auto` grows with the content between `minRows` and `maxRows`.
 * `onSubmit` fires on Ctrl+Enter / Cmd+Enter.
 *
 * @param {Object} props
 * @param {number} [props.rows=3]
 * @param {boolean} [props.auto]
 * @param {number} [props.minRows]
 * @param {number} [props.maxRows]
 * @param {(value:string, e:KeyboardEvent) => void} [props.onSubmit]
 */
const Textarea = ({ placeholder, value, rows = 3, auto, minRows, maxRows, disabled, name,
  onChange, onSubmit, onKeyDown, class: className, ...rest }) => {
  const field = (
    <textarea placeholder={placeholder} rows={auto ? (minRows || rows) : rows} name={name}
      disabled={disabled}>{value ?? ""}</textarea>
  );
  _keys(field, { onChange, onKeyDown });
  if(onSubmit) field.addEventListener("keydown", (e) => {
    if(e.key !== "Enter" || !(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    onSubmit(field.value, e);
  });
  if(auto) {
    let border = 0;
    let ready = false;
    // hidden or not yet mounted, a field has no layout: a grow now would pin 0px,
    // so it waits for the observer to see it laid out
    const grow = () => {
      if(!field.getClientRects().length) return;
      field.style.height = "auto";
      field.style.height = (field.scrollHeight + border) + "px";
    };
    // metrics exist only once the field is laid out; the observer retries until then
    const init = () => {
      if(!field.offsetHeight) return;
      ready = true;
      const cs = getComputedStyle(field);
      const line = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5;
      const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      border = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
      if(minRows) field.style.minHeight = (line * minRows + pad + border) + "px";
      if(maxRows) {
        field.style.maxHeight = (line * maxRows + pad + border) + "px";
        field.style.overflow = "auto";
      }
      grow();
    };
    new ResizeObserver(() => ready ? grow() : init()).observe(field);
    field.addEventListener("input", grow);
  }
  return _group(field, {
    ...rest, class: ["input-group-textarea", auto && "input-group-auto", className],
  });
};
