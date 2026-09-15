// scripts/ui/Checkbox.jsx

/**
 * Checkbox with a styled box; label toggles it too.
 *
 * Mutators: .checked (setter is silent), .input
 *
 * @param {Object} props
 * @param {boolean} [props.checked]
 * @param {"lg"} [props.size]
 * @param {string} [props.label]
 * @param {boolean} [props.disabled]
 * @param {string} [props.name]
 * @param {(checked:boolean, e:Event) => void} [props.onChange]
 * @param {string} [props.title]
 */
const Checkbox = ({ checked, size, label, disabled, name, onChange, class: className,
  ...rest }) => {
  const input = (
    <input type="checkbox" class="checkbox-input" checked={checked} disabled={disabled}
      name={name} />
  );
  const wrap = (
    <label {...rest} class={["checkbox", size && `checkbox-${size}`, className]}>
      {input}
      <span class="checkbox-box"><span class="icon">check</span></span>
      {label ? <span class="checkbox-label">{label}</span> : null}
    </label>
  );
  if(onChange) input.addEventListener("change", (e) => onChange(input.checked, e));
  UI.prop(wrap, "checked", () => input.checked, (v) => { input.checked = !!v; });
  wrap.input = input;
  return wrap;
};
