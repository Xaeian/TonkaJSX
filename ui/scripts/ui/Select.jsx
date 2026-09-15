// scripts/ui/Select.jsx

/**
 * Native `<select>` in the control look; children are `<option>` elements.
 * @param {Object} props
 * @param {string} [props.value]
 * @param {"sm"|"lg"} [props.size]
 * @param {boolean} [props.disabled]
 * @param {string} [props.name]
 * @param {(value:string, e:Event) => void} [props.onChange]
 * @param {string} [props.title]
 */
const Select = ({ value, size, onChange, class: className, children, ...rest }) => {
  const field = <select {...rest} class={["select", size, className]}>{children}</select>;
  if(value != null) field.value = value;
  if(onChange) field.addEventListener("change", (e) => onChange(field.value, e));
  return field;
};
