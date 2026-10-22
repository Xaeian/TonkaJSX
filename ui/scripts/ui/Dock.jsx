// scripts/ui/Dock.jsx

/**
 * Bar glued to one edge of its parent, bordered on the content side.
 * Top and bottom docks are sticky rows; left and right docks are columns inside a `DockRow`.
 * Add `scroll` when the dock should scroll on its own (needs a bounded parent).
 *
 * @param {object} props
 * @param {"top"|"bottom"|"left"|"right"} [props.pos="top"]
 * @param {string} [props.width]  CSS width of a left or right dock
 * @param {boolean} [props.tint]  darker background
 */
const Dock = ({ pos = "top", width, tint, class: className, children, ...rest }) => (
  <div {...rest} class={["dock", "dock-" + pos, tint && "dock-tint", className]}
    style={{ width }}>
    {children}
  </div>
);

/** Left dock + content + right dock in one row; the content shrinks and may `scroll`. */
const DockRow = ({ class: className, children, ...rest }) => (
  <div {...rest} class={["dock-row", className]}>{children}</div>
);
