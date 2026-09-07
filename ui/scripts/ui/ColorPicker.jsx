// scripts/ui/ColorPicker.jsx

const _PALETTE = ["red", "orange", "amber", "green", "teal", "blue", "purple", "pink"];

/**
 * Row of palette dots; `gray` adds a neutral slot at the end.
 *
 * Mutators: .value
 *
 * @param {Object} props
 * @param {string} [props.value]
 * @param {boolean} [props.gray]
 * @param {(name:string) => void} [props.onChange]
 * @param {"sm"|"lg"} [props.size]
 * @param {string} [props.title]
 */
const ColorPicker = ({ value, gray, onChange, size, class: className, ...rest }) => {
  const colors = gray ? [..._PALETTE, "gray"] : _PALETTE;
  let current = colors.includes(value) ? value : colors[0];
  const el = <div {...rest} class={["color-picker", size, className]} role="radiogroup"></div>;
  const select = (name) => {
    if(name === current) return;
    current = name;
    for(const dot of el.children) {
      dot.classList.toggle("active", dot.getAttribute("color") === name);
    }
    onChange?.(name);
  };
  for(const c of colors) {
    el.appendChild(
      <button type="button" class={["color-dot", c === current && "active"]} color={c}
        aria-label={c} onClick={() => select(c)}></button>
    );
  }
  UI.prop(el, "value", () => current, (v) => { if(colors.includes(v)) select(v); });
  return el;
};
