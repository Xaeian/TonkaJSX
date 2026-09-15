// scripts/ui/Lightbox.jsx

/**
 * Fullscreen image; a click outside the picture, the close button or Escape closes it.
 *
 * Mutators: .open(), .close(), .toggle(), .opened, .src, .alt
 *
 * @param {Object} props
 * @param {string} [props.src]
 * @param {string} [props.alt]
 * @param {() => void} [props.onClose]
 */
const Lightbox = ({ src, alt, onClose, class: className, ...rest }) => {
  const img = <img class="lightbox-img" src={src || ""} alt={alt || ""} />;
  const closeBtn = <IconBtn icon="close" variant="ghost" title="Close" />;
  const root = (
    <div {...rest} class={["lightbox", className]} role="dialog" aria-modal="true"
      aria-label="Image" hidden>
      {closeBtn}
      {img}
    </div>
  );
  root.addEventListener("click", (e) => { if(e.target !== img) root.close(); });
  UI.overlay(root, { onOpen: () => requestAnimationFrame(() => closeBtn.focus()), onClose });
  UI.prop(root, "src", () => img.src, (v) => { img.src = v || ""; });
  UI.prop(root, "alt", () => img.alt, (v) => { img.alt = v || ""; });
  return root;
};

/** One-shot: opens a lightbox for `src` and removes it once closed. */
Lightbox.open = (src, alt) => {
  const box = (
    <Lightbox src={src} alt={alt}
      onClose={() => setTimeout(() => box.remove(), UI.duration(box))} />
  );
  box.open();
  return box;
};
