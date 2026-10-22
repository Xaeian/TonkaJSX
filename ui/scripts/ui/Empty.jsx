// scripts/ui/Empty.jsx

/**
 * Dashed placeholder for empty lists and results: icon, title, description,
 * then the children, an action for one.
 * A line left empty takes no room.
 *
 * Mutators: .icon, .title, .description
 *
 * @param {object} props
 * @param {string} [props.icon]
 * @param {string} [props.title]
 * @param {string} [props.description]
 * @param {"sm"|"lg"} [props.size]
 */
const Empty = ({ icon, title, description, size, class: className, children, ...rest }) => {
  const iconEl = <span class="icon empty-icon" translate={false}>{icon}</span>;
  const titleEl = <h4 class="empty-title">{title}</h4>;
  const descEl = <p class="empty-desc">{description}</p>;
  const el = (
    <div {...rest} class={["empty", size, className]}>
      {iconEl}
      {titleEl}
      {descEl}
      {children}
    </div>
  );
  UI.text(el, "icon", iconEl);
  UI.text(el, "title", titleEl);
  UI.text(el, "description", descEl);
  return el;
};
