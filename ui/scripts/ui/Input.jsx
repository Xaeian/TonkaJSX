// scripts/ui/Input.jsx

// Wraps a native field in `.input-group`.
// The wrapper is what the app holds:
// `.value`, `.disabled`, `.placeholder`, `.title`, `.focus()`, `.input` (the field).
// `accessor` replaces how `.value` reads and writes the field.
// `onSet` runs after a value set from code,
// so whatever follows the typing, a clear button or a growing height, follows that too.
function _group(field, { icon, trailing, size, ghost, placeholder, disabled, accessor, onSet,
  class: className, ...rest }) {
  const wrap = (
    <div {...rest} class={["input-group", size, ghost && "input-group-ghost", className]}>
      {icon && <span class="icon" translate={false}>{icon}</span>}
      {field}
      {trailing}
    </div>
  );
  const write = accessor?.set || ((v) => { field.value = v ?? ""; });
  UI.prop(wrap, "value", accessor?.get || (() => field.value), (v) => { write(v); onSet?.(); });
  UI.prop(wrap, "disabled", () => field.disabled, (v) => { field.disabled = !!v; });
  UI.prop(wrap, "placeholder", () => field.placeholder, (v) => { field.placeholder = v || ""; });
  UI.title(wrap);
  wrap.disabled = disabled;
  if(placeholder) wrap.placeholder = placeholder;
  wrap.input = field;
  wrap.focus = () => field.focus();
  return wrap;
}

// Typing, Enter and Escape on the field of `wrap`, each handler given `wrap.value`
function _keys(wrap, { onChange, onEnter, onEscape, onKeyDown }) {
  const field = wrap.input;
  if(onChange) field.addEventListener("input", () => onChange(wrap.value));
  field.addEventListener("keydown", (e) => {
    if(e.key === "Enter") onEnter?.(wrap.value);
    if(e.key === "Escape" && onEscape) { e.preventDefault(); onEscape(wrap.value); }
  });
  if(onKeyDown) field.addEventListener("keydown", onKeyDown);
}

// Trailing X that wipes the field, inert and unseen while there is nothing to wipe;
// it keeps its place in the layout, so the width never jumps
function _clearBtn(field, onChange) {
  const btn = <span class="icon input-group-btn" translate={false} title="Clear">close</span>;
  btn.sync = () => { btn.inert = !field.value; };
  field.addEventListener("input", btn.sync);
  btn.addEventListener("click", () => {
    field.value = "";
    btn.sync();
    onChange?.("");
    field.focus();
  });
  btn.sync();
  return btn;
}

// Values offered while typing: a native datalist the field names by id.
// It draws nothing, so the wrapper can hold it, and it is made on the first `.suggest` set.
function _suggest(wrap) {
  let list = null;
  let offered = [];
  UI.prop(wrap, "suggest", () => offered, (v) => {
    offered = v || [];
    if(!list) {
      list = <datalist id={`input-suggest-${Math.random().toString(36).slice(2)}`}></datalist>;
      wrap.appendChild(list);
      wrap.input.setAttribute("list", list.id);
    }
    list.replaceChildren(...offered.map(x => <option value={x} />));
  });
}

/**
 * Text input.
 *
 * Mutators: .value, .disabled, .placeholder, .title, .focus(), .input, .suggest
 *
 * @param {object} props
 * @param {string} [props.type="text"]
 * @param {string} [props.placeholder]
 * @param {string} [props.value]
 * @param {string} [props.icon]
 * @param {"sm"|"lg"} [props.size]
 * @param {boolean} [props.ghost] borderless
 * @param {boolean} [props.clear] trailing X
 * @param {string[]} [props.suggest] offered while typing, anything else still goes
 * @param {boolean} [props.disabled]
 * @param {string} [props.name]
 * @param {(value:string) => void} [props.onChange]
 * @param {(value:string) => void} [props.onEnter]
 * @param {(value:string) => void} [props.onEscape]
 * @param {(e:KeyboardEvent) => void} [props.onKeyDown]
 * @param {string} [props.title]
 */
const Input = ({ type = "text", value, clear, suggest, name, onChange, onEnter, onEscape,
  onKeyDown, ...rest }) => {
  const field = <input type={type} value={value ?? ""} name={name} />;
  const btn = clear && _clearBtn(field, onChange);
  const wrap = _group(field, { ...rest, trailing: btn, onSet: btn?.sync });
  _keys(wrap, { onChange, onEnter, onEscape, onKeyDown });
  _suggest(wrap);
  if(suggest) wrap.suggest = suggest;
  return wrap;
};

/**
 * One line of a form: its name on the left, its controls on the right.
 *
 * A dozen settings packed several to a line is a wall;
 * laid out as a sheet they read one at a time,
 * which is the shape anything with more of them than a row can carry ends up in.
 *
 * @param {string} label
 * @param {...(Element|null)} ctrl  a null does not appear,
 *   so a field that belongs to one case only can be passed on every call
 */
function formRow(label, ...ctrl) {
  return (
    <row>
      <strong flex="2">{label}</strong>
      <row flex="10">{ctrl}</row>
    </row>
  );
}

/**
 * What the lines above mean, in the controls' own column.
 * @param {...Element} lines
 */
function formNote(...lines) {
  return (
    <row>
      <span flex="2"></span>
      <stack flex="10" gap="no">{lines}</stack>
    </row>
  );
}

/**
 * One control with its own small name, for a line that carries several.
 * @param {string} label
 * @param {Element} ctrl
 */
const named = (label, ctrl) => <inline gap="sm" nowrap><i>{label}</i>{ctrl}</inline>;

/**
 * Number input; `.value` and every handler give `null` for an empty field.
 *
 * Mutators: .value, .disabled, .placeholder, .title, .focus(), .input
 *
 * @param {object} props
 * @param {number} [props.value]
 * @param {number} [props.min]
 * @param {number} [props.max]
 * @param {number} [props.step=1]
 * @param {(value:number|null) => void} [props.onChange]
 * @param {(value:number|null) => void} [props.onEnter]
 * @param {(value:number|null) => void} [props.onEscape]
 */
const NumberInput = ({ value, min, max, step = 1, name, onChange, onEnter, onEscape, onKeyDown,
  ...rest }) => {
  const field = (
    <input type="number" value={value ?? ""} min={min} max={max} step={step} name={name} />
  );
  const accessor = { get: () => field.value === "" ? null : Number(field.value) };
  const wrap = _group(field, { ...rest, accessor });
  _keys(wrap, { onChange, onEnter, onEscape, onKeyDown });
  return wrap;
};

// A browser offers to save whatever a `type="password"` field held,
// the moment it leaves the page or hides, and `autocomplete="off"` does not stop it.
// A text field masked by CSS is nothing to a password manager,
// so where the property exists the field is one;
// elsewhere it is a password field and the offer is the browser's to make.
const _MASK_CSS = CSS.supports("-webkit-text-security", "disc");

/**
 * Password input with a show/hide eye. The browser is never asked to remember the value.
 *
 * Mutators: .value, .disabled, .placeholder, .title, .focus(), .input
 *
 * @param {object} props
 * @param {string} [props.icon="lock"]
 */
const PasswordInput = ({ value, icon = "lock", name, onChange, onEnter, onEscape, onKeyDown,
  ...rest }) => {
  const field = (
    <input type={_MASK_CSS ? "text" : "password"} class={_MASK_CSS && "masked"}
      value={value ?? ""} name={name}
      autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck={false} />
  );
  function hidden() {
    return _MASK_CSS
      ? field.classList.contains("masked")
      : field.type === "password";
  }
  function mask(on) {
    if(_MASK_CSS) field.classList.toggle("masked", on);
    else field.type = on ? "password" : "text";
  }
  // the eye tells the state: crossed while the value hides, open while it shows;
  // its tooltip names no "password", since the field holds a secret, a key or a token as often
  const eye = (
    <span class="icon input-group-btn" translate={false} title="Show">visibility_off</span>
  );
  UI.title(eye);
  eye.addEventListener("click", () => {
    const show = hidden();
    mask(!show);
    eye.textContent = show ? "visibility" : "visibility_off";
    eye.title = show ? "Hide" : "Show";
  });
  const wrap = _group(field, { ...rest, icon, trailing: eye });
  _keys(wrap, { onChange, onEnter, onEscape, onKeyDown });
  return wrap;
};

/**
 * Search input: an `Input` with a magnifier and a clear button.
 * @param {object} props
 * @param {string} [props.placeholder="Search..."]
 */
const SearchInput = ({ placeholder = "Search...", ...rest }) => (
  <Input icon="search" clear placeholder={placeholder} {...rest} />
);

/**
 * Multiline field.
 * Fixed `rows` by default; `auto` grows with the content between `minRows` and `maxRows`.
 * `onSubmit` fires on Ctrl+Enter / Cmd+Enter.
 *
 * Mutators: .value, .disabled, .placeholder, .title, .focus(), .input
 *
 * @param {object} props
 * @param {number} [props.rows=3]
 * @param {boolean} [props.auto]
 * @param {number} [props.minRows]
 * @param {number} [props.maxRows]
 * @param {(value:string) => void} [props.onChange]
 * @param {(value:string) => void} [props.onSubmit]
 * @param {(value:string) => void} [props.onEscape]
 */
const Textarea = ({ value, rows = 3, auto, minRows, maxRows, name, onChange, onSubmit, onEscape,
  onKeyDown, class: className, ...rest }) => {
  const field = (
    <textarea rows={auto ? (minRows || rows) : rows} name={name}>{value ?? ""}</textarea>
  );
  if(onSubmit) {
    field.addEventListener("keydown", (e) => {
      if(e.key !== "Enter" || !(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      onSubmit(field.value);
    });
  }
  let grow = null;
  if(auto) {
    // a field not laid out yet, hidden or not mounted, has no metrics: a grow would pin 0px,
    // so the observer grows it once it is laid out
    grow = () => {
      if(!field.offsetHeight) return;
      const cs = getComputedStyle(field);
      const line = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5;
      const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      const border = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
      if(minRows) field.style.minHeight = (line * minRows + pad + border) + "px";
      if(maxRows) field.style.maxHeight = (line * maxRows + pad + border) + "px";
      field.style.height = "auto";
      field.style.height = (field.scrollHeight + border) + "px";
    };
    // Grown inside the observer's call, so the first paint has the height already.
    // The browser reports a resize loop for that, harmlessly; a grow a frame later would jump.
    new ResizeObserver(grow).observe(field);
    field.addEventListener("input", grow);
  }
  const wrap = _group(field, {
    ...rest, onSet: grow,
    class: [
      "input-group-textarea", auto && "input-group-auto", maxRows > 0 && "input-group-capped",
      className,
    ],
  });
  _keys(wrap, { onChange, onEscape, onKeyDown });
  return wrap;
};
