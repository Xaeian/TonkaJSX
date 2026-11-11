// scripts/ui/Icon.jsx

/**
 * A Material Symbols glyph by its name, `color` and `size="sm"` taken as on any `.icon`.
 * The glyph is a ligature of its name, so the icon stays out of a browser's translation,
 * which would turn `lock` into a word.
 *
 * Mutators: .name
 *
 * @param {object} props
 * @param {string} [props.name]  none for a glyph set later
 * @param {string} [props.color]  semantic or palette name
 * @param {"sm"} [props.size]
 */
const Icon = ({ name, class: className, ...rest }) => {
  // `translate` is a boolean property: the string "no" would read as true
  const el = <span {...rest} class={["icon", className]} translate={false}>{name}</span>;
  UI.text(el, "name", el);
  return el;
};
