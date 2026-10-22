// scripts/ui/Button.jsx

/**
 * Button with an optional leading icon.
 * Native attributes (`onClick`, `disabled`, `id`, `data-*`) pass straight through.
 *
 * Mutators: .icon (no-op without one), .label, .title, .active, .loading (spinner, disabled)
 *
 * @param {object} props
 * @param {"primary"|"danger"|"ghost"|"rail"} [props.variant]
 * @param {"sm"|"lg"} [props.size]
 * @param {string} [props.icon]
 * @param {boolean} [props.active] pressed look
 * @param {string} [props.title]
 * @param {Element|Element[]|string} [props.children]
 */
const Button = ({ variant, size, icon, active, class: className, children, ...rest }) => {
  const iconEl = icon && <span class="icon" translate={false}>{icon}</span>;
  const labelEl = <span class="btn-label">{children}</span>;
  const btn = (
    <button {...rest} class={["btn", variant && "btn-" + variant, size, className]}>
      {iconEl}
      {labelEl}
    </button>
  );
  UI.text(btn, "icon", iconEl);
  UI.text(btn, "label", labelEl);
  UI.title(btn);
  UI.active(btn, active);
  UI.loading(btn, iconEl);
  return btn;
};

/**
 * Square icon-only button; `title` is both the tooltip and the accessible name.
 * @param {object} props
 * @param {string} props.icon
 * @param {string} [props.title]
 * @param {"primary"|"danger"|"ghost"|"rail"} [props.variant]
 * @param {"sm"|"lg"} [props.size]
 */
const IconBtn = ({ title, class: className, ...rest }) => (
  <Button {...rest} class={["btn-icon", className]} title={title} aria-label={title} />
);

/**
 * Button that toggles its own `.active` state on click and tells `onChange`.
 *
 * Mutators: .icon, .label, .title, .active (setter is silent), .loading
 *
 * @param {object} props
 * @param {boolean} [props.active]
 * @param {(active:boolean) => void} [props.onChange]
 */
const ActiveBtn = ({ onChange, ...rest }) => {
  // `aria-pressed` from the start: a toggle reads as one before its first press
  const btn = <Button aria-pressed="false" {...rest} />;
  btn.addEventListener("click", () => {
    btn.active = !btn.active;
    onChange?.(btn.active);
  });
  return btn;
};
