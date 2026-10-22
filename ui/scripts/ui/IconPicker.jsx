// scripts/ui/IconPicker.jsx

/**
 * Grid of icon tiles; the app supplies the `icons` list.
 *
 * Mutators: .value (setter is silent), .title
 *
 * @param {object} props
 * @param {string[]} props.icons
 * @param {string} [props.value]
 * @param {(name:string) => void} [props.onChange]
 * @param {"sm"|"lg"} [props.size]
 * @param {string} [props.title]
 */
const IconPicker = ({ icons, value, onChange, size, class: className, ...rest }) => {
  let current = null;
  const el = (
    <div {...rest} class={["icon-picker", size, className]}>
      {icons.map(ic => (
        <button type="button" class="icon-tile" data-icon={ic} aria-label={ic} title={ic}
          onClick={() => pick(ic)}>
          <span class="icon" translate={false}>{ic}</span>
        </button>
      ))}
    </div>
  );
  function select(name) {
    current = name;
    for(const tile of el.children) tile.active = tile.dataset.icon === name;
  }
  function pick(name) {
    if(name === current) return;
    select(name);
    onChange?.(name);
  }
  for(const tile of el.children) UI.active(tile);
  select(icons.includes(value) ? value : icons[0]);
  UI.prop(el, "value", () => current, (v) => { if(icons.includes(v)) select(v); });
  UI.title(el);
  return el;
};
