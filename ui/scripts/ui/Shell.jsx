// scripts/ui/Shell.jsx

/**
 * App frame: sidebar on the left, then topbar, content and footer stacked.
 * @param {Object} props
 * @param {JSX.Element} [props.sidebar]
 * @param {JSX.Element} [props.topbar]
 * @param {JSX.Element} [props.footer]
 * @param {JSX.Element|JSX.Element[]} [props.children]  usually one `<Content>`
 */
const Shell = ({ sidebar, topbar, footer, children, ...rest }) => (
  <div {...rest} class="shell">
    {sidebar}
    <div class="shell-main">
      {topbar}
      {children}
      {footer}
    </div>
  </div>
);

/**
 * Scrolling view area between topbar and footer.
 *
 * Mutators:
 *   .fullbleed   no padding, no scroll; visible view owns both (docks, editors)
 *
 * @param {Object} props
 * @param {boolean} [props.fullbleed]
 * @param {JSX.Element|JSX.Element[]} [props.children]
 */
const Content = ({ fullbleed, children, ...rest }) => {
  const el = <div {...rest} class="content">{children}</div>;
  UI.prop(el, "fullbleed",
    () => el.classList.contains("content-fullbleed"),
    (v) => el.classList.toggle("content-fullbleed", !!v));
  el.fullbleed = !!fullbleed;
  return el;
};

/** Left dock + content + right dock in one row; content shrinks and may `scroll`. */
const DockRow = ({ children, ...rest }) => (
  <div {...rest} class="dock-row">{children}</div>
);
