// scripts/ui/Checkbox.jsx

/**
 * Checkbox with a styled box; label toggles it too.
 *
 * Mutators: .checked (setter is silent), .disabled, .title, .input
 *
 * @param {object} props
 * @param {boolean} [props.checked]
 * @param {"sm"|"lg"} [props.size]
 * @param {string} [props.label]
 * @param {boolean} [props.disabled]
 * @param {string} [props.name]
 * @param {(checked:boolean) => void} [props.onChange]
 * @param {string} [props.title]
 */
const Checkbox = ({ checked, size, label, disabled, name, onChange, class: className,
  ...rest }) => {
  const input = (
    <input type="checkbox" class="checkbox-input" checked={checked} disabled={disabled}
      name={name} />
  );
  const wrap = (
    <label {...rest} class={["checkbox", size, className]}>
      {input}
      <span class="checkbox-box"><span class="icon" translate={false}>check</span></span>
      {label && <span class="checkbox-label">{label}</span>}
    </label>
  );
  if(onChange) input.addEventListener("change", () => onChange(input.checked));
  UI.prop(wrap, "checked", () => input.checked, (v) => { input.checked = !!v; });
  UI.prop(wrap, "disabled", () => input.disabled, (v) => { input.disabled = !!v; });
  UI.title(wrap);
  wrap.input = input;
  return wrap;
};
