// scripts/ui/Lightbox.jsx

/**
 * Fullscreen image over the backdrop of a `Modal`;
 * a click outside the picture, the close button or Escape closes it.
 *
 * Mutators: .open(), .close(), .toggle(), .opened, .src, .alt
 *
 * @param {object} props
 * @param {string} [props.src]
 * @param {string} [props.alt]
 * @param {(opened:boolean) => void} [props.onChange]
 */
const Lightbox = ({ src, alt, onChange, class: className, ...rest }) => {
  const img = <img class="lightbox-img" src={src || ""} alt={alt || ""} />;
  const closeBtn = <IconBtn icon="close" title="Close" />;
  const root = (
    <div {...rest} class={["modal", "lightbox", className]} role="dialog" aria-modal="true"
      aria-label="Image" hidden>
      {closeBtn}
      {img}
    </div>
  );
  root.addEventListener("click", (e) => { if(e.target !== img) root.close(); });
  UI.overlay(root, {
    // Escape only: the backdrop covers the page, so a press outside it lands on a toast above
    dismiss: () => false,
    onOpen: () => {
      requestAnimationFrame(() => closeBtn.focus());
      onChange?.(true);
    },
    onClose: () => onChange?.(false),
  });
  UI.prop(root, "src", () => img.src, (v) => { img.src = v || ""; });
  UI.prop(root, "alt", () => img.alt, (v) => { img.alt = v || ""; });
  return root;
};

/** One-shot: opens a lightbox for `src` and removes it once closed. */
Lightbox.open = (src, alt) => {
  const box = (
    <Lightbox src={src} alt={alt} onChange={(opened) => { if(!opened) UI._unmount(box); }} />
  );
  box.open();
  return box;
};
