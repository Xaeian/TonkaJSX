// scripts/ui/Button.jsx

/**
 * Button with an optional leading icon.
 * Native attributes (`onClick`, `disabled`, `id`, `data-*`) pass straight through.
 *
 * Mutators:
 *   .icon      leading glyph (no-op without one)
 *   .label     text
 *   .title     tooltip
 *   .active    pressed look
 *   .loading   spinner + disabled
 *
 * @param {Object} props
 * @param {"primary"|"danger"|"ghost"|"rail"} [props.variant]
 * @param {"sm"|"lg"} [props.size]
 * @param {string} [props.icon]
 * @param {string} [props.title]
 * @param {JSX.Element|JSX.Element[]|string} [props.children]
 */
const Button = ({ variant, size, icon, title, class: className, children, ...rest }) => {
  const iconEl = icon ? <span class="icon">{icon}</span> : null;
  const labelEl = <span class="btn-label">{children}</span>;
  const btn = (
    <button {...rest} title={title}
      class={["btn", variant && "btn-" + variant, size, className]}>
      {iconEl}
      {labelEl}
    </button>
  );
  UI.text(btn, "icon", iconEl);
  UI.text(btn, "label", labelEl);
  UI.title(btn);
  UI.active(btn);
  UI.loading(btn, iconEl);
  return btn;
};

/**
 * Square icon-only button; `title` is both the tooltip and the accessible name.
 * @param {Object} props
 * @param {string} props.icon
 * @param {string} [props.title]
 * @param {"primary"|"danger"|"ghost"|"rail"} [props.variant]
 * @param {"sm"|"lg"} [props.size]
 */
const IconBtn = ({ title, class: className, ...rest }) => (
  <Button {...rest} class={["btn-icon", className]} title={title} aria-label={title} />
);

/**
 * Button that toggles its own `.active` state on click.
 *
 * Mutators: `.active` (setter is silent), `.toggle()` flips and fires `onChange`.
 *
 * @param {Object} props
 * @param {boolean} [props.active=false]
 * @param {(active:boolean) => void} [props.onChange]
 */
const ActiveBtn = ({ active = false, onChange, ...rest }) => {
  const btn = <Button {...rest} />;
  btn.active = active;
  btn.addEventListener("click", () => {
    btn.active = !btn.active;
    onChange?.(btn.active);
  });
  btn.toggle = () => btn.click();
  return btn;
};
