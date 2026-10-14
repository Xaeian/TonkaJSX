// scripts/ui/ui.js
// Glue shared by the components: property mutators, overlay lifecycle, anchored placement.

// `title` in JSX is the library tooltip, `Tooltip`, never the native one
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

  /**
   * Copies `text` and flashes a check on `btn` (an icon button), then its `icon` is back.
   * `text` may be a promise of one, for words still on their way: the button spins meanwhile.
   * `clearAfter` seconds later the copy is taken back,
   * for a secret that should not sit in the clipboard until the next copy.
   * @returns {Promise<void>} settles once the clipboard holds it, rejects when it refused
   */
  copy: (btn, text, { icon = "content_copy", clearAfter = 0 } = {}) => {
    const later = typeof text !== "string";
    const asBlob = (t) => new Blob([t], { type: "text/plain" });
    const written = later
      ? UI._clip("text/plain", Promise.resolve(text).then(asBlob))
      : navigator.clipboard.writeText(text);
    UI._copied(btn, icon, written, later);
    if(clearAfter > 0 && !later) UI.uncopy(text, clearAfter);
    return written;
  },

  /**
   * Copies a picture, `btn` flashing as for `copy`.
   * Any format goes in and a PNG comes out, the one picture every clipboard takes.
   * @param {Element} btn
   * @param {Blob|Promise<Blob>} picture  a promise spins the button while it loads
   * @returns {Promise<void>} settles once the clipboard holds it, rejects when it refused
   */
  copyPicture: (btn, picture, { icon = "content_copy" } = {}) => {
    const written = UI._clip("image/png", Promise.resolve(picture).then(UI._png));
    UI._copied(btn, icon, written, picture instanceof Promise);
    return written;
  },

  /**
   * Takes `text` off the clipboard after `sec`, replacing whatever wipe was pending.
   * A page without focus may not write the clipboard,
   * so a wipe that falls due then waits for the tab to come back.
   * Where the clipboard may be read without asking for it (a granted permission)
   * the wipe lands only while the text is still there;
   * elsewhere it lands blind,
   * since a password left behind costs more than someone else's line of text.
   */
  uncopy: (text, sec) => {
    clearTimeout(UI._wipeTimer);
    async function wipe() {
      if(UI._wipe !== wipe) return; // a newer copy owns the clipboard now
      if(!document.hasFocus()) { addEventListener("focus", wipe, { once: true }); return; }
      UI._wipe = null;
      try {
        const can = await navigator.permissions?.query({ name: "clipboard-read" });
        if(can?.state === "granted" && await navigator.clipboard.readText() !== text) return;
      }
      catch {} // no way to ask and no way to read: wipe anyway
      try { await navigator.clipboard.writeText(""); }
      catch {} // refused as well: the text stays, and nothing here can take it
    }
    UI._wipe = wipe;
    UI._wipeTimer = setTimeout(wipe, sec * 1000);
  },

  /** Runs a pending `uncopy` now, for a lock that should not leave the copy behind. */
  uncopyNow: () => { clearTimeout(UI._wipeTimer); UI._wipe?.(); },

  _wipe: null,
  _wipeTimer: null,

  // `data`, a promise of a Blob of `type`, goes to the clipboard now, inside the click:
  // Safari refuses a clipboard asked for after an await, and a promise is how bytes come later
  _clip: (type, data) => {
    if(typeof ClipboardItem !== "undefined") {
      return navigator.clipboard.write([new ClipboardItem({ [type]: data })]);
    }
    if(type === "text/plain") {
      return data.then(b => b.text()).then(t => navigator.clipboard.writeText(t));
    }
    return Promise.reject(new Error("This browser copies text and nothing else"));
  },

  // the spinner while a promise loads, then the check;
  // the spinner puts its glyph back on the way out, so the check goes on after it
  _copied: (btn, icon, written, waiting) => {
    if(waiting) btn.loading = true;
    written
      .finally(() => { if(waiting) btn.loading = false; })
      .then(() => {
        btn.icon = "check";
        setTimeout(() => { btn.icon = icon; }, 1200);
      }, () => {}); // a refusal is the caller's to say, on the promise handed back
  },

  // a picture as PNG, drawn once at its own size; one already PNG goes as it is
  _png: async (blob) => {
    if(blob.type === "image/png") return blob;
    const url = URL.createObjectURL(blob);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const cv = document.createElement("canvas");
      // an SVG with no size of its own lands on 512px square
      cv.width = img.naturalWidth || 512;
      cv.height = img.naturalHeight || 512;
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      const png = await new Promise(resolve => cv.toBlob(resolve, "image/png"));
      if(!png) throw new Error("This picture would not turn into a PNG");
      return png;
    }
    finally { URL.revokeObjectURL(url); }
  },

  /** Loads a script once, with SRI when given; the same `src` again resolves at once. */
  script: (src, integrity) => UI._scripts[src] ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    if(integrity) { s.integrity = integrity; s.crossOrigin = "anonymous"; }
    s.onload = resolve;
    s.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.appendChild(s);
  }),
  _scripts: {},

  /** `text` as children: every http(s) address in it a `[link]` that opens in a new tab. */
  linkify: (text) => String(text ?? "").split(/(https?:\/\/[^\s]+)/).map((part, i) => i % 2
    ? UI._link(part)
    : part),

  /**
   * `text` as children with its inline marks live: `**bold**`, `*italic*` or `_italic_`,
   * `` `code` `` shown as it is, and every http(s) address a `[link]` in a new tab.
   * The marks are Markdown's, so a note reads the same here and in a file it is exported to.
   * A mark inside a word (`snake_case`, `2*3*4`) or a span left open is plain text.
   */
  markup: (text) => {
    const src = String(text ?? "");
    const out = [];
    let at = 0;
    for(const m of src.matchAll(UI._MARKS)) {
      const [, code, url, bold, , italic] = m;
      if(m.index > at) out.push(src.slice(at, m.index));
      at = m.index + m[0].length;
      if(code) out.push(JSX.createElement("code", {}, code));
      else if(url) out.push(UI._link(url));
      else if(bold) out.push(JSX.createElement("strong", {}, bold));
      else out.push(JSX.createElement("em", {}, italic));
    }
    if(at < src.length) out.push(src.slice(at));
    return out;
  },

  // Code is taken first, so a mark or an address inside a span stays text.
  // A span is one line, starts and ends on a character that is not a space or a mark,
  // and an italic mark has no letter, digit or mark on its outer side.
  _MARKS: new RegExp([
    "`([^`\\n]+)`",
    "(https?://[^\\s]+)",
    "\\*\\*([^\\s*](?:[^\\n]*?[^\\s*])??)\\*\\*",
    "(?<![\\w*_])([*_])([^\\s*_](?:[^\\n]*?[^\\s*_])??)\\4(?![\\w*_])",
  ].join("|"), "g"),

  _link: (url) =>
    JSX.createElement("a", { link: true, href: url, target: "_blank", rel: "noopener" }, url),

  /** `.title`: the tooltip text, mirrored to aria-label when the element carries one. */
  title: (el) => UI.prop(el, "title",
    () => el.getAttribute("data-tooltip"),
    (v) => {
      for(const attr of ["data-tooltip", "aria-label"]) {
        if(attr === "aria-label" && !el.hasAttribute(attr)) continue;
        if(v == null) el.removeAttribute(attr);
        else el.setAttribute(attr, v);
      }
    }),

  /** `.active`: toggles the `active` class and aria-pressed. */
  active: (el, initial = false) => {
    UI.prop(el, "active",
      () => el.classList.contains("active"),
      (v) => {
        el.classList.toggle("active", !!v);
        el.setAttribute("aria-pressed", String(!!v));
      });
    if(initial) el.active = true;
  },

  /** `.loading`: the icon becomes a spinner and the element is disabled. */
  loading: (el, iconEl) => {
    let on = false;
    let glyph = "";
    let own = false; // an icon that exists only for the spinner leaves with it
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
          iconEl.translate = false;
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

  /** Length of the element's CSS transition in ms. */
  duration: (el) => (parseFloat(getComputedStyle(el).transitionDuration) || 0) * 1000,

  /**
   * Overlay lifecycle on `root`: `.open()`, `.close()`, `.toggle()`, `.opened`.
   * Open mounts the root in the body (`portal`), unhides it and adds `show` a frame later,
   * so the CSS transition runs; close removes `show` and hides once the transition ends.
   * While open, Escape closes it and so does a pointer down outside,
   * unless `dismiss` is false or, as a predicate on the pointer event, says no.
   * Focus returns to the previous element when the overlay held it.
   * `onOpen` receives the arguments of `open()`.
   */
  overlay: (root, { onOpen, onClose, dismiss = true, portal = true } = {}) => {
    let opened = false;
    let prevFocus = null;
    let hideTimer = null;
    // capture phase, so a handler that stops propagation cannot hide the event
    function onDown(e) {
      if(root.contains(e.target)) return;
      if(dismiss === true || dismiss(e)) root.close();
    }
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
   * The main side flips when it does not fit, then the result is clamped to the viewport.
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
