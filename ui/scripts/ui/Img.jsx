// scripts/ui/Img.jsx

/**
 * Image with a fallback for empty and error states and a loading overlay.
 *
 * Size: `height` and `width` are independent.
 * Each is a preset ("sm" 40px, "md" 80px, "lg" 160px), a number of pixels or a CSS length.
 * With one of them picture keeps its aspect ratio;
 * `minSquare` then stops it from getting narrower (or shorter) than given side.
 *
 * Mutators: .src, .alt, .loading
 *
 * @param {Object} props
 * @param {string} [props.src]
 * @param {string} [props.alt]
 * @param {string} [props.title]
 * @param {string|number} [props.height]
 * @param {string|number} [props.width]
 * @param {"contain"|"cover"|"fill"} [props.fit="contain"]
 * @param {boolean} [props.minSquare]
 * @param {boolean} [props.rounded]
 * @param {boolean} [props.circle]
 * @param {boolean} [props.border]
 * @param {string} [props.fallbackIcon]
 * @param {string} [props.fallbackText]
 * @param {() => void} [props.onClick]
 */
const Img = ({ src, alt, height, width, fit = "contain", minSquare, rounded, circle, border,
  fallbackIcon, fallbackText, onClick, class: className, ...rest }) => {
  const img = <img class="image-inner" alt={alt || ""} loading="lazy" />;
  const iconEl = <span class="icon"></span>;
  const el = (
    <div {...rest} onClick={onClick}
      class={["image", "image-fit-" + fit, className, {
        "image-rounded": rounded, "image-circle": circle,
        "image-border": border, "image-click": onClick,
      }]}>
      {img}
      <div class="image-fallback">
        {iconEl}
        {fallbackText ? <span class="image-fallback-text">{fallbackText}</span> : null}
      </div>
      <div class="image-overlay"><Spinner /></div>
    </div>
  );

  const PRESET = { sm: "40px", md: "80px", lg: "160px" };
  const css = (v) => {
    if(v == null || v === "") return null;
    return PRESET[v] || (typeof v === "number" ? v + "px" : String(v));
  };
  const h = css(height), w = css(width);
  if(h) el.style.height = h;
  if(w) el.style.width = w;
  if(h && !w) {
    el.style.width = "auto";
    el.classList.add("image-auto-width");
    if(minSquare) el.style.minWidth = h;
  }
  if(w && !h) {
    el.style.height = "auto";
    if(minSquare) el.style.minHeight = w;
  }

  let _src = "";
  const setState = (state) => {
    el.classList.remove("image-ok", "image-error", "image-empty");
    el.classList.add("image-" + state);
    iconEl.textContent = fallbackIcon || (state === "error" ? "broken_image" : "image");
  };
  img.addEventListener("load", () => { if(_src) setState("ok"); });
  img.addEventListener("error", () => { if(_src) setState("error"); });
  UI.prop(el, "src", () => _src, (v) => {
    _src = v || "";
    setState("empty");
    if(_src) img.src = _src;
    else img.removeAttribute("src");
  });
  UI.prop(el, "alt", () => img.alt, (v) => { img.alt = v || ""; });
  UI.prop(el, "loading",
    () => el.classList.contains("image-loading"),
    (v) => el.classList.toggle("image-loading", !!v));
  el.src = src;
  return el;
};
