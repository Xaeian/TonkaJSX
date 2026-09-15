// scripts/ui/Sidebar.jsx

/** Vertical icon rail; holds `SidebarBtn`s, `<spacer>` pushes the rest to the bottom. */
const Sidebar = ({ class: className, children, ...rest }) => (
  <nav {...rest} class={["sidebar", className]}>{children}</nav>
);

/**
 * Rail button: an `IconBtn` in the rail look with the tooltip beside the rail.
 * `badge` puts a corner Badge on it (`<Badge pos="top-right">`).
 *
 * Mutators: .icon, .active, .title, .loading
 *
 * @param {Object} props
 * @param {string} props.icon
 * @param {string} [props.title]
 * @param {boolean} [props.active]
 * @param {boolean} [props.disabled]
 * @param {JSX.Element} [props.badge]
 * @param {() => void} [props.onClick]
 */
const SidebarBtn = ({ active, badge, ...rest }) => {
  const btn = <IconBtn {...rest} variant="rail" data-tooltip-pos="right-bottom" />;
  if(badge) btn.append(badge);
  btn.active = !!active;
  return btn;
};
