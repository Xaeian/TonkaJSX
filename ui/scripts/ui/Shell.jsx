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
 *   .fullbleed   no padding, no scroll; the visible view owns both (docks, editors)
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

  // `scrollbar-gutter: stable` reserves a strip inside this box, so every panel ends a
  // scrollbar short of the window. Anything fixed to the window, the alerts above all, has
  // no way to know that and would stand that much wider than the rows it hangs over.
  // Measured here, where the scrollbar is, and published for whoever has to line up with it.
  const gauge = () => {
    const px = el.fullbleed ? 0 : el.offsetWidth - el.clientWidth;
    document.documentElement.style.setProperty("--scrollbar-w", `${px}px`);
  };
  new ResizeObserver(gauge).observe(el);
  return el;
};

/** Left dock + content + right dock in one row; the content shrinks and may `scroll`. */
const DockRow = ({ children, ...rest }) => (
  <div {...rest} class="dock-row">{children}</div>
);
