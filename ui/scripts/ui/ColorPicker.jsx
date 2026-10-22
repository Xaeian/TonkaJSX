// scripts/ui/ColorPicker.jsx

const _PALETTE = ["red", "orange", "amber", "green", "teal", "blue", "purple", "pink"];

/**
 * Row of palette dots; `gray` adds a neutral slot at the end.
 *
 * Mutators: .value (setter is silent), .title
 *
 * @param {object} props
 * @param {string} [props.value]
 * @param {boolean} [props.gray]
 * @param {(name:string) => void} [props.onChange]
 * @param {"sm"|"lg"} [props.size]
 * @param {string} [props.title]
 */
const ColorPicker = ({ value, gray, onChange, size, class: className, ...rest }) => {
  const colors = gray ? [..._PALETTE, "gray"] : _PALETTE;
  let current = null;
  const el = (
    <div {...rest} class={["color-picker", size, className]}>
      {colors.map(c => (
        <button type="button" class="color-dot" color={c} aria-label={c}
          onClick={() => pick(c)}></button>
      ))}
    </div>
  );
  function select(name) {
    current = name;
    for(const dot of el.children) dot.active = dot.getAttribute("color") === name;
  }
  function pick(name) {
    if(name === current) return;
    select(name);
    onChange?.(name);
  }
  for(const dot of el.children) UI.active(dot);
  select(colors.includes(value) ? value : colors[0]);
  UI.prop(el, "value", () => current, (v) => { if(colors.includes(v)) select(v); });
  UI.title(el);
  return el;
};
