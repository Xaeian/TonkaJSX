// scripts/ui/Shell.jsx

/**
 * App frame: sidebar on the left, then topbar, content and footer stacked.
 * @param {object} props
 * @param {Element} [props.sidebar]
 * @param {Element} [props.topbar]
 * @param {Element} [props.footer]
 * @param {Element|Element[]} [props.children]  usually one `<Content>`
 */
const Shell = ({ sidebar, topbar, footer, class: className, children, ...rest }) => (
  <div {...rest} class={["shell", className]}>
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
 * `fullbleed` takes away its padding and its scroll: the visible view owns both (docks, editors).
 *
 * Mutators: .fullbleed
 *
 * @param {object} props
 * @param {boolean} [props.fullbleed]
 * @param {Element|Element[]} [props.children]
 */
const Content = ({ fullbleed, class: className, children, ...rest }) => {
  const el = <div {...rest} class={["content", className]}>{children}</div>;
  UI.prop(el, "fullbleed",
    () => el.classList.contains("content-fullbleed"),
    (v) => el.classList.toggle("content-fullbleed", !!v));
  el.fullbleed = !!fullbleed;

  // `scrollbar-gutter: stable` reserves a strip inside this box,
  // so every panel ends a scrollbar short of the window.
  // Anything fixed to the window, the alerts above all, has no way to know that,
  // and would stand that much wider than the rows it hangs over.
  // Measured here, where the scrollbar is, and published for whoever has to line up with it.
  function gauge() {
    const px = el.fullbleed ? 0 : el.offsetWidth - el.clientWidth;
    document.documentElement.style.setProperty("--scrollbar-w", `${px}px`);
  }
  new ResizeObserver(gauge).observe(el);
  return el;
};
