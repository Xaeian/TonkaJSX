// scripts/ui/Topbar.jsx

/** Header row; `<spacer>` splits left and right groups. */
const Topbar = ({ size, class: className, children, ...rest }) => (
  <header {...rest} class={["topbar", size, className]}>{children}</header>
);

/**
 * Brand link at the start of topbar: an image, a glyph or both, plus a label.
 *
 * Mutators: .img (picture source, a no-op when logo has no picture)
 *
 * @param {Object} props
 * @param {string} [props.href]
 * @param {string} [props.target]
 * @param {string} [props.img]
 * @param {string} [props.alt=""]
 * @param {string} [props.icon]
 * @param {string} [props.title]
 */
const TopbarLogo = ({ img, alt = "", icon, class: className, children, ...rest }) => {
  const imgEl = img ? <img src={img} alt={alt} /> : null;
  const el = (
    <a {...rest} class={["topbar-logo", className]}>
      {imgEl}
      {icon ? <span class="icon">{icon}</span> : null}
      {children ? <span>{children}</span> : null}
    </a>
  );
  UI.prop(el, "img",
    () => imgEl ? imgEl.getAttribute("src") : "",
    (v) => { if(imgEl) imgEl.src = v ?? ""; });
  return el;
};
