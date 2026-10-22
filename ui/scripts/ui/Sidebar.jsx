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
 * @param {object} props
 * @param {string} props.icon
 * @param {boolean} [props.active]
 * @param {Element} [props.badge]
 */
const SidebarBtn = ({ active, badge, ...rest }) => {
  const btn = <IconBtn {...rest} variant="rail" data-tooltip-pos="right-bottom" />;
  if(badge) btn.append(badge);
  btn.active = !!active;
  return btn;
};

/**
 * Rail button that flips the page between the light and the dark theme (`Theme.toggle()`).
 * Its icon names what is showing and its tooltip what a click brings, whoever made the change.
 * The choice is kept where `Theme.remember` was given a store.
 *
 * @param {object} props
 * @param {string} [props.light="Light theme"]  tooltip while dark is showing
 * @param {string} [props.dark="Dark theme"]  tooltip while light is showing
 */
const ThemeBtn = ({ light = "Light theme", dark = "Dark theme", onClick, ...rest }) => {
  // a tooltip from the start, so the accessible name follows every later one
  const btn = <SidebarBtn {...rest} icon="light_mode" title={dark}
    onClick={(e) => { Theme.toggle(); onClick?.(e); }} />;
  function show() {
    const isDark = Theme.isDark();
    btn.icon = isDark ? "dark_mode" : "light_mode";
    btn.title = isDark ? light : dark;
  }
  Theme.onChange(show);
  show();
  return btn;
};
