// scripts/ui/Topbar.jsx

// the kit's narrow screen, where `hide-narrow` and `only-narrow` switch as well
const _TOPBAR_NARROW = "(max-width: 720px)";

/**
 * Header row; `<spacer>` splits the left and right groups.
 * On a narrow screen the children carrying `fold` move, in their order,
 * to a strip under the row that a More button at its end opens,
 * and a wide screen stands them back where they were.
 * The strip goes in right after the row once the row is in the page,
 * so the row's parent holds both, as a Shell's column does.
 *
 * @param {object} props
 * @param {"sm"|"lg"} [props.size]
 */
const Topbar = ({ size, class: className, children, ...rest }) => {
  const el = <header {...rest} class={["topbar", size, className]}>{children}</header>;
  const folds = [...el.children].filter((child) => child.hasAttribute("fold"));
  if(!folds.length) return el;

  // a mark where each one stood, which is where a wide screen puts it back
  const marks = folds.map((child) => {
    const mark = document.createComment("fold");
    child.before(mark);
    return mark;
  });
  const folded = <stack gap="sm"></stack>;
  const strip = <div class="topbar sm" only-narrow hidden>{folded}</div>;
  const narrow = matchMedia(_TOPBAR_NARROW);
  function place() {
    if(narrow.matches) folded.append(...folds);
    else folds.forEach((child, i) => marks[i].after(child));
  }
  el.append(
    <ActiveBtn icon="tune" only-narrow title="More" onChange={(on) => { strip.hidden = !on; }} />
  );
  JSX.onMount(el, () => el.after(strip));
  narrow.addEventListener("change", place);
  place();
  return el;
};

/**
 * Brand link at the start of the topbar: a mark of its own, a picture or both, and a label.
 * A mark offering `_spin()` and `_rest()` answers the whole link, its hover and its focus.
 *
 * Mutators: .img (a no-op when the logo has no picture)
 *
 * @param {object} props
 * @param {Element} [props.mark]  an element as the mark, a canvas for instance
 * @param {string} [props.img]  picture source
 * @param {string} [props.alt=""]
 */
const TopbarLogo = ({ mark, img, alt = "", class: className, children, ...rest }) => {
  const imgEl = img ? <img src={img} alt={alt} /> : null;
  const el = (
    <a {...rest} class={["topbar-logo", className]}>
      {mark}
      {imgEl}
      {children ? <span class="topbar-logo-label">{children}</span> : null}
    </a>
  );
  if(mark?._spin && mark._rest) {
    for(const ev of ["pointerenter", "focus"]) el.addEventListener(ev, () => mark._spin());
    for(const ev of ["pointerleave", "blur"]) el.addEventListener(ev, () => mark._rest());
  }
  UI.prop(el, "img",
    () => imgEl ? imgEl.getAttribute("src") : "",
    (v) => { if(imgEl) imgEl.src = v ?? ""; });
  return el;
};
