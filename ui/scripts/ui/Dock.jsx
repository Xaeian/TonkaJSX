// scripts/ui/Dock.jsx

/**
 * Bar glued to one edge of its parent, bordered on content side.
 * Top and bottom docks are sticky rows; left and right docks are columns inside a `DockRow`.
 * Add `scroll` when dock should scroll on its own (needs a bounded parent).
 *
 * Mutators: .pos, .width, .hidden
 *
 * @param {Object} props
 * @param {"top"|"bottom"|"left"|"right"} [props.pos="top"]
 * @param {string} [props.width]      left and right docks
 * @param {"sm"|"lg"} [props.size]    padding scale
 * @param {boolean} [props.tint]      darker background
 * @param {boolean} [props.dashed]    dashed content-side border
 * @param {boolean} [props.flush]     no border
 */
const Dock = ({ pos = "top", width, size, tint, dashed, flush, class: className, children,
  ...rest }) => {
  const el = (
    <div {...rest} class={["dock", size, className,
      { "dock-tint": tint, "dock-dashed": dashed, "dock-flush": flush }]}>
      {children}
    </div>
  );
  let _pos = null;
  UI.prop(el, "pos", () => _pos, (v) => {
    if(_pos) el.classList.remove("dock-" + _pos);
    _pos = v;
    el.classList.add("dock-" + v);
  });
  UI.prop(el, "width", () => el.style.width || null, (v) => { el.style.width = v || ""; });
  el.pos = pos;
  el.width = width;
  return el;
};
