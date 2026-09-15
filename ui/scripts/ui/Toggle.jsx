// scripts/ui/Toggle.jsx

/**
 * Segmented single-select group of `ToggleBtn`.
 *
 * Mutators: `.value` (setter is silent).
 *
 * @param {Object} props
 * @param {string} [props.value]
 * @param {"sm"|"lg"} [props.size]
 * @param {string} [props.title]
 * @param {(value:string) => void} [props.onChange]
 * @param {JSX.Element|JSX.Element[]} props.children
 */
const Toggle = ({ value, size, title, onChange, class: className, children, ...rest }) => {
  const wrap = (
    <div {...rest} class={["toggle", size, className]} title={title}>{children}</div>
  );
  let current = value;
  const sync = () => {
    for(const btn of wrap.children) btn.active = btn.dataset.value === current;
  };
  wrap.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-value]");
    if(!btn || btn.disabled || btn.dataset.value === current) return;
    current = btn.dataset.value;
    sync();
    onChange?.(current);
  });
  sync();
  UI.prop(wrap, "value", () => current, (v) => { current = v; sync(); });
  return wrap;
};

/**
 * One option of a `Toggle`; the parent handles clicks and the active state.
 * @param {Object} props
 * @param {string} props.value
 * @param {string} [props.icon]
 * @param {string} [props.label]
 * @param {boolean} [props.disabled]
 * @param {string} [props.title]
 */
const ToggleBtn = ({ value, label, children, ...rest }) => (
  <Button {...rest} data-value={value}>{label}{children}</Button>
);
