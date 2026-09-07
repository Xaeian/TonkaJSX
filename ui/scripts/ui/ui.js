// scripts/ui/ui.js
// Glue shared by components: property mutators, overlay lifecycle, anchored placement.

// `title` in JSX is library tooltip (Tooltip.jsx), never native `title`
JSX.TitleAttr = "data-tooltip";

const UI = {

  //----------------------------------------------------------------------------------------- Props

  /** Defines a read/write property on `el`. */
  prop: (el, name, get, set) =>
    Object.defineProperty(el, name, { get, set, configurable: true }),

  /** `el[name]` reads and writes `target.textContent`; a missing target makes it a no-op. */
  text: (el, name, target) => UI.prop(el, name,
    () => target ? target.textContent : "",
    (v) => { if(target) target.textContent = v ?? ""; }),

  /** `.title`: tooltip text, mirrored to aria-label when element carries one. */
  title: (el) => UI.prop(el, "title",
    () => el.getAttribute("data-tooltip"),
    (v) => {
      for(const attr of ["data-tooltip", "aria-label"]) {
        if(attr === "aria-label" && !el.hasAttribute(attr)) continue;
        if(v == null) el.removeAttribute(attr);
        else el.setAttribute(attr, v);
      }
    }),

  /** `.active`: toggles `active` class and aria-pressed. */
  active: (el, initial = false) => {
    UI.prop(el, "active",
      () => el.classList.contains("active"),
      (v) => {
        el.classList.toggle("active", !!v);
        el.setAttribute("aria-pressed", String(!!v));
      });
    if(initial) el.active = true;
  },

  /** `.loading`: icon becomes a spinner and element is disabled. */
  loading: (el, iconEl) => {
    let on = false;
    let glyph = "";
    let own = false; // an icon that exists only for spinner leaves with it
    let wasDisabled = false;
    UI.prop(el, "loading", () => on, (v) => {
      if(!!v === on) return;
      on = !!v;
      if(on) {
        wasDisabled = el.disabled;
        if(iconEl) glyph = iconEl.textContent;
        else {
          iconEl = document.createElement("span");
          iconEl.className = "icon";
          el.prepend(iconEl);
          own = true;
        }
        iconEl.textContent = "progress_activity";
        iconEl.classList.add("spinner");
        el.disabled = true;
        return;
      }
      if(own) { iconEl.remove(); iconEl = null; own = false; }
      else { iconEl.textContent = glyph; iconEl.classList.remove("spinner"); }
      el.disabled = wasDisabled;
    });
  },

  //--------------------------------------------------------------------------------------- Overlay

  /** Focusable descendants of `root` that are laid out (a hidden one has no offsetParent). */
  focusable: (root) => [...root.querySelectorAll(
    "button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), "
    + "textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"
  )].filter((el) => el.offsetParent),

  /** Length of element's CSS transition in ms. */
  duration: (el) => (parseFloat(getComputedStyle(el).transitionDuration) || 0) * 1000,

  /**
   * Overlay lifecycle on `root`: `.open()`, `.close()`, `.toggle()`, `.opened`.
   * Open mounts root in body (`portal`), unhides it and adds `show` a frame later,
   * so CSS transition runs; close removes `show` and hides once transition ends.
   * While open, Escape closes it and so does a pointer down outside,
   * unless `dismiss` is false or, as a predicate on pointer event, says no.
   * Focus returns to previous element when overlay held it.
   * `onOpen` receives arguments of `open()`.
   */
  overlay: (root, { onOpen, onClose, dismiss = true, portal = true } = {}) => {
    let opened = false;
    let prevFocus = null;
    let hideTimer = null;
    // capture phase, so a handler that stops propagation cannot hide event
    const onDown = (e) => {
      if(root.contains(e.target)) return;
      if(dismiss === true || dismiss(e)) root.close();
    };
    const onKey = (e) => { if(e.key === "Escape") root.close(); };
    root.open = (...args) => {
      if(opened) return;
      opened = true;
      prevFocus = document.activeElement;
      clearTimeout(hideTimer);
      if(portal && !root.isConnected) document.body.appendChild(root);
      root.hidden = false;
      onOpen?.(...args);
      requestAnimationFrame(() => root.classList.add("show"));
      if(dismiss) {
        document.addEventListener("pointerdown", onDown, true);
        document.addEventListener("keydown", onKey, true);
      }
    };
    root.close = () => {
      if(!opened) return;
      opened = false;
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey, true);
      root.classList.remove("show");
      hideTimer = setTimeout(() => { root.hidden = true; }, UI.duration(root));
      if(root.contains(document.activeElement)) prevFocus?.focus?.();
      prevFocus = null;
      onClose?.();
    };
    root.toggle = (...args) => opened ? root.close() : root.open(...args);
    UI.prop(root, "opened", () => opened, (v) => v ? root.open() : root.close());
  },

  //------------------------------------------------------------------------------------- Placement

  /**
   * Puts a `position: fixed` element next to `anchor`.
   * `pos` is a main side (top, bottom, left, right) with an optional alignment:
   * `-start`/`-end` for top and bottom, `-top`/`-bottom` for left and right, none centers.
   * Main side flips when it does not fit, then result is clamped to viewport.
   * Returns true when neither was needed.
   */
  place: (el, anchor, pos = "bottom", { gap = 4, margin = 8, dx = 0, dy = 0 } = {}) => {
    const r = anchor.getBoundingClientRect();
    const w = el.offsetWidth, h = el.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight;
    const [main, side] = pos.split("-");
    const vertical = main === "top" || main === "bottom";
    let m = main;
    if(m === "top" && r.top - h - gap < 0) m = "bottom";
    else if(m === "bottom" && r.bottom + h + gap > vh) m = "top";
    else if(m === "left" && r.left - w - gap < 0) m = "right";
    else if(m === "right" && r.right + w + gap > vw) m = "left";
    let x, y;
    if(vertical) {
      x = side === "start" ? r.left
        : side === "end" ? r.right - w
        : r.left + (r.width - w) / 2;
      y = m === "top" ? r.top - h - gap : r.bottom + gap;
    }
    else {
      y = side === "top" ? r.top
        : side === "bottom" ? r.bottom - h
        : r.top + (r.height - h) / 2;
      x = m === "left" ? r.left - w - gap : r.right + gap;
    }
    x += dx;
    y += dy;
    const cx = Math.min(Math.max(x, margin), vw - w - margin);
    const cy = Math.min(Math.max(y, margin), vh - h - margin);
    el.style.left = cx + "px";
    el.style.top = cy + "px";
    return m === main && cx === x && cy === y;
  },
};
