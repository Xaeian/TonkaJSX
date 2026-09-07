// scripts/ui/Footer.jsx

/**
 * Status bar with `left`, `center` and `right` slots; center hides when bar is narrow.
 * Mutate slot elements for live content.
 *
 * @param {Object} props
 * @param {boolean} [props.status]   compact, center always stays
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
