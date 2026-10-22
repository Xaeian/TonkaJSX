// scripts/ui/Badge.jsx

/**
 * Small label or chip. `pos` pins it to a corner of a positioned parent.
 *
 * Mutators: .color, .text, .title
 *
 * @param {object} props
 * @param {string} [props.color="neutral"]  semantic or palette name
 * @param {"solid"|"tint"|"outline"} [props.variant="solid"]
 * @param {"sm"|"lg"} [props.size]
 * @param {boolean} [props.mono]  monospace, and a click selects it whole
 * @param {string} [props.icon]
 * @param {string} [props.title]
 * @param {"top-right"|"top-left"|"bottom-right"|"bottom-left"} [props.pos]
 * @param {Element|Element[]|string} [props.children]
 */
const Badge = ({ color = "neutral", variant = "solid", size, icon, pos, class: className,
  children, ...rest }) => {
  const textEl = <span class="badge-text">{children}</span>;
  const el = (
    <span {...rest} color={color}
      class={["badge", "badge-" + variant, size, className, pos && "badge-abs badge-" + pos]}>
      {icon && <span class="icon" translate={false}>{icon}</span>}
      {textEl}
    </span>
  );
  UI.prop(el, "color", () => el.getAttribute("color"), (v) => el.setAttribute("color", v));
  UI.text(el, "text", textEl);
  UI.title(el);
  return el;
};
