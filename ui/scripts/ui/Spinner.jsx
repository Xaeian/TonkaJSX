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
    <span class="spinner icon" translate={false} color={color}>{_SPIN_ICON}</span>
    <span class="spinner-text">{text}</span>
  </span>
);
