// scripts/ui/Topbar.jsx

/** Header row; `<spacer>` splits the left and right groups. */
const Topbar = ({ size, class: className, children, ...rest }) => (
  <header {...rest} class={["topbar", size, className]}>{children}</header>
);

/**
 * Brand link at the start of the topbar: a mark of its own, an image, a glyph or any of them
 * together, plus a label.
 *
 * Mutators: .img (the picture source, a no-op when the logo has no picture)
 *
 * @param {Object} props
 * @param {string} [props.href]
 * @param {string} [props.target]
 * @param {Element} [props.mark]  an element as the mark, a canvas for instance
 * @param {string} [props.img]
 * @param {string} [props.alt=""]
 * @param {string} [props.icon]
 * @param {string} [props.title]
 */
const TopbarLogo = ({ mark, img, alt = "", icon, class: className, children, ...rest }) => {
  const imgEl = img ? <img src={img} alt={alt} /> : null;
  const el = (
    <a {...rest} class={["topbar-logo", className]}>
      {mark}
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
