// scripts/ui/Badge.jsx

/**
 * Small label or chip. `pos` pins it to a corner of a positioned parent.
 *
 * Mutators: .color, .text, .icon, .title
 *
 * @param {Object} props
 * @param {string} [props.color="neutral"]   semantic or palette name
 * @param {"solid"|"tint"|"outline"} [props.variant="solid"]
 * @param {"sm"|"lg"} [props.size]
 * @param {boolean} [props.mono]
 * @param {string} [props.icon]
 * @param {string} [props.title]
 * @param {"top-right"|"top-left"|"bottom-right"|"bottom-left"} [props.pos]
 * @param {JSX.Element|JSX.Element[]|string} [props.children]
 */
const Badge = ({ color = "neutral", variant = "solid", size, mono, icon, pos,
  class: className, children, ...rest }) => {
  const iconEl = icon ? <span class="icon">{icon}</span> : null;
  const textEl = <span class="badge-text">{children}</span>;
  const el = (
    <span {...rest} color={color}
      class={["badge", "badge-" + variant, size, className,
        mono && "badge-mono", pos && "badge-abs badge-" + pos]}>
      {iconEl}
      {textEl}
    </span>
  );
  UI.prop(el, "color", () => el.getAttribute("color"), (v) => el.setAttribute("color", v));
  UI.text(el, "text", textEl);
  UI.text(el, "icon", iconEl);
  // Without this, `badge.title = "..."` writes the native attribute and the browser draws
  // its own grey box, while the same word passed in JSX goes to `data-tooltip` and gets the
  // library's. One property, one tooltip, whichever way it is set.
  UI.title(el);
  return el;
};
