// scripts/ui/Empty.jsx

/**
 * Dashed placeholder for empty lists and results: icon, title, description, an action.
 *
 * Mutators: .icon, .title, .description (empty hides the line).
 *
 * @param {Object} props
 * @param {string} [props.icon]
 * @param {string} [props.title]
 * @param {string} [props.description]
 * @param {JSX.Element} [props.action]   slot below the description
 * @param {boolean} [props.fill]         take the parent's free height
 * @param {string} [props.height]
 * @param {"sm"|"lg"} [props.size]
 */
const Empty = ({ icon, title, description, action, fill, height, size, class: className,
  children, ...rest }) => {
  const iconEl = <span class="icon empty-icon" hidden={!icon}>{icon}</span>;
  const titleEl = <h4 class="empty-title" hidden={!title}>{title}</h4>;
  const descEl = <p class="empty-desc" hidden={!description}>{description}</p>;
  const el = (
    <div {...rest} class={["empty", size, className]} style={{ height }} grow={fill}>
      {iconEl}
      {titleEl}
      {descEl}
      {action}
      {children}
    </div>
  );
  const line = (name, target) => UI.prop(el, name,
    () => target.textContent,
    (v) => { target.textContent = v || ""; target.hidden = !v; });
  line("icon", iconEl);
  line("title", titleEl);
  line("description", descEl);
  return el;
};
