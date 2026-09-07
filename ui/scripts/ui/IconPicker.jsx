// scripts/ui/IconPicker.jsx

/**
 * Grid of icon tiles; app supplies `icons` list.
 *
 * Mutators: .value
 *
 * @param {Object} props
 * @param {string[]} props.icons
 * @param {string} [props.value]
 * @param {(name:string) => void} [props.onChange]
 * @param {"sm"|"lg"} [props.size]
 * @param {string} [props.title]
 */
const IconPicker = ({ icons, value, onChange, size, class: className, ...rest }) => {
  let current = icons.includes(value) ? value : icons[0];
  const el = <div {...rest} class={["icon-picker", size, className]} role="radiogroup"></div>;
  const select = (name) => {
    if(name === current) return;
    current = name;
    for(const tile of el.children) tile.classList.toggle("active", tile.dataset.icon === name);
    onChange?.(name);
  };
  for(const ic of icons) {
    el.appendChild(
      <button type="button" class={["icon-tile", ic === current && "active"]} data-icon={ic}
        aria-label={ic} title={ic} onClick={() => select(ic)}>
        <span class="icon">{ic}</span>
      </button>
    );
  }
  UI.prop(el, "value", () => current, (v) => { if(icons.includes(v)) select(v); });
  return el;
};
