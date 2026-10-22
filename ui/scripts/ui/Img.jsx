// scripts/ui/Img.jsx

/**
 * Image with a fallback for the empty and error states and a loading overlay.
 *
 * Size: `height` and `width` are independent.
 * Each is a preset ("sm" 40px, "md" 80px, "lg" 160px), a number of pixels or a CSS length.
 * With one of them the picture keeps its aspect ratio;
 * `minSquare` then stops it from getting narrower (or shorter) than the given side.
 * `maxWidth` beside `height` lets a wide picture spread that far and no further,
 * losing height rather than its edges; the box keeps the height it was given.
 *
 * Mutators: .src, .loading
 *
 * @param {object} props
 * @param {string} [props.src]
 * @param {string} [props.alt]
 * @param {string} [props.title]
 * @param {string|number} [props.height]
 * @param {string|number} [props.width]
 * @param {string|number} [props.maxWidth]  pixels or a CSS length
 * @param {"contain"|"cover"|"fill"} [props.fit="contain"]
 * @param {boolean} [props.minSquare]
 * @param {boolean} [props.rounded]
 * @param {boolean} [props.circle]
 * @param {boolean} [props.border]
 * @param {string} [props.fallbackText]
 * @param {() => void} [props.onClick]
 */
const Img = ({ src, alt, height, width, maxWidth, fit = "contain", minSquare, rounded, circle,
  border, fallbackText, onClick, class: className, ...rest }) => {
  // a side as the stylesheet takes it: a preset by name, else a length, a number in pixels
  const side = (v) => v == null || v === "" ? null
    : ["sm", "md", "lg"].includes(v) ? { preset: v }
    : { length: typeof v === "number" ? v + "px" : String(v) };
  const h = side(height), w = side(width), mw = side(maxWidth)?.length;
  // given one side alone, the other follows the picture
  const heightOnly = h && !w, widthOnly = w && !h;
  const img = <img class="image-inner" alt={alt || ""} loading="lazy" />;
  const iconEl = <span class="icon" translate={false}></span>;
  const el = (
    <div {...rest} onClick={onClick} height={h?.preset} width={w?.preset}
      style={{ "--image-h": h?.length, "--image-w": w?.length, "--image-max-w": mw }}
      class={["image", "image-fit-" + fit, className, {
        "image-rounded": rounded, "image-circle": circle,
        "image-border": border, "image-click": onClick,
        "image-auto-width": heightOnly, "image-square": minSquare && (heightOnly || widthOnly),
        "image-bounded": mw,
      }]}>
      {img}
      <div class="image-fallback">
        {iconEl}
        {fallbackText && <span class="image-fallback-text">{fallbackText}</span>}
      </div>
      <div class="image-overlay"><Spinner /></div>
    </div>
  );

  let _src = "";
  function setState(state) {
    el.classList.remove("image-ok", "image-error", "image-empty");
    el.classList.add("image-" + state);
    iconEl.textContent = state === "error" ? "broken_image" : "image";
  }
  img.addEventListener("load", () => { if(_src) setState("ok"); });
  img.addEventListener("error", () => { if(_src) setState("error"); });
  UI.prop(el, "src", () => _src, (v) => {
    _src = v || "";
    setState("empty");
    if(_src) img.src = _src;
    else img.removeAttribute("src");
  });
  UI.prop(el, "loading",
    () => el.classList.contains("image-loading"),
    (v) => el.classList.toggle("image-loading", !!v));
  el.src = src;
  return el;
};
