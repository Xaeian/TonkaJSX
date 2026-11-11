// scripts/ui/Spinner.jsx

/**
 * Spinning glyph, with a text label beside it when given one.
 *
 * @param {object} props
 * @param {string} [props.color]  semantic or palette name, else the current text colour
 * @param {"sm"|"lg"} [props.size]
 * @param {string} [props.text]
 */
const Spinner = ({ color, size, text, class: className, ...rest }) => (
  <span {...rest} class={["spinner-wrap", size, className]}>
    <Icon name={_SPIN_ICON} class="spinner" color={color} />
    <span class="spinner-text">{text}</span>
  </span>
);
