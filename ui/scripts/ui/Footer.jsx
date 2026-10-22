// scripts/ui/Footer.jsx

/**
 * Status bar with `left`, `center` and `right` slots.
 * On a narrow bar the center gives way to whichever side slot has something to say,
 * and a footer that is its center alone keeps it.
 * An icon and its words are one `<inline>`.
 * Mutate the slot elements for live content.
 *
 * @param {object} props
 * @param {Element|Element[]} [props.left]
 * @param {Element|Element[]} [props.center]
 * @param {Element|Element[]} [props.right]
 */
const Footer = ({ left, center, right, class: className, ...rest }) => (
  <footer {...rest} class={["footer", className]}>
    <div class="footer-slot footer-left">{left}</div>
    <div class="footer-slot footer-center">{center}</div>
    <div class="footer-slot footer-right">{right}</div>
  </footer>
);
