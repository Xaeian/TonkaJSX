// scripts/ui/Spinner.jsx

/**
 * Spinning glyph, alone or with a text label.
 *
 * Mutators (with `text`): .text
 *
 * @param {Object} props
 * @param {string} [props.color]   semantic or palette name, else current text color
 * @param {"sm"|"lg"} [props.size]
 * @param {string} [props.text]
 */
const Spinner = ({ color, size, text, class: className, ...rest }) => {
  const glyph = (
    <span class={["spinner", "icon", size, className]} color={color}>progress_activity</span>
  );
  if(text == null) return glyph;
  const label = <span class="spinner-text">{text}</span>;
  const el = <span {...rest} class="spinner-wrap">{glyph}{label}</span>;
  UI.text(el, "text", label);
  return el;
};
