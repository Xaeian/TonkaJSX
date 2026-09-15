// scripts/ui/Footer.jsx

/**
 * Status bar with `left`, `center` and `right` slots. On a narrow bar the center gives way to
 * whichever side slot has something to say, and a footer that is its center alone keeps it.
 * Mutate the slot elements for live content.
 *
 * @param {Object} props
 * @param {boolean} [props.status]   compact, the center always stays
 * @param {JSX.Element|JSX.Element[]} [props.left]
 * @param {JSX.Element|JSX.Element[]} [props.center]
 * @param {JSX.Element|JSX.Element[]} [props.right]
 */
const Footer = ({ status, left, center, right, class: className, ...rest }) => (
  <footer {...rest} class={["footer", status && "footer-status", className]}>
    <div class="footer-slot footer-left">{left}</div>
    <div class="footer-slot footer-center">{center}</div>
    <div class="footer-slot footer-right">{right}</div>
  </footer>
);
