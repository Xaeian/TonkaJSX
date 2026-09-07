// scripts/ui/Input.jsx

/**
 * Wraps a native field in `.input-group`.
 * Wrapper is what app holds: `.value`, `.title`, `.focus()`, `.input` (field).
 * `accessor` replaces value get/set.
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
  UI.prop(wrap, "value",
    accessor?.get || (() => field.value),
    accessor?.set || ((v) => { field.value = v ?? ""; }));
  UI.title(wrap);
  wrap.input = field;
  wrap.focus = () => field.focus();
  return wrap;
};

/** Keyboard wiring shared by text fields. */
const _keys = (field, { onChange, onEnter, onKeyDown }) => {
  if(onChange) field.addEventListener("input", (e) => onChange(field.value, e));
  if(onEnter) field.addEventListener("keydown", (e) => {
    if(e.key === "Enter") onEnter(field.value, e);
  });
  if(onKeyDown) field.addEventListener("keydown", onKeyDown);
};

/** Trailing X that wipes field; kept in layout so width never jumps. */
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
  // a programmatic `.value` keeps X in step with field
  const btn = _clearBtn(field, onChange);
  return _group(field, { ...rest, trailing: btn, accessor: {
    get: () => field.value,
    set: (v) => { field.value = v ?? ""; btn.sync(); },
  } });
};

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

/**
 * Password input with a show/hide eye.
 * @param {Object} props
 * @param {string} [props.icon="lock"]
 */
const PasswordInput = ({ placeholder, value, icon = "lock", disabled, name,
  onChange, onEnter, onKeyDown, ...rest }) => {
  const field = (
    <input type="password" placeholder={placeholder} value={value ?? ""} name={name}
      disabled={disabled} />
  );
  _keys(field, { onChange, onEnter, onKeyDown });
  const eye = <span class="icon input-group-btn" title="Show password">visibility</span>;
  eye.addEventListener("click", () => {
    const show = field.type === "password";
    field.type = show ? "text" : "password";
    eye.textContent = show ? "visibility_off" : "visibility";
    eye.setAttribute("data-tooltip", show ? "Hide password" : "Show password");
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
 * Fixed `rows` by default; `auto` grows with content between `minRows` and `maxRows`.
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
    const grow = () => {
      field.style.height = "auto";
      field.style.height = (field.scrollHeight + border) + "px";
    };
    // metrics exist only once field is laid out; observer retries until then
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
