// scripts/ui/ui.js
//
// Glue the components share, a section per concern:
// mutators, the clipboard, scripts loaded on demand, inline marks, overlays and placement.
// The `_` names before `UI` belong to the kit, shared by its files and never by an app.

// `title` in JSX is the library tooltip, `Tooltip`, never the native one
JSX.TitleAttr = "data-tooltip";

// an http(s) address, running to the next space: what `linkify` and `markup` both take
const _URL = "https?://\\S+";

// What a code span holds, and the marks a backslash keeps as text,
// read alike by `UI.markup` and `Markdown`: no other mark opens inside either
const _MARK_CODE = "[^`\\n]+";
const _MARK_ESCAPED = "[\\\\`*_~\\[\\]()#+\\-.!|<>]";

// the glyph every spinner of the kit turns
const _SPIN_ICON = "progress_activity";

// a link that opens in a new tab, wearing `label` or else its own address
const _link = (url, label = url) =>
  JSX.createElement("a", { link: true, href: url, target: "_blank", rel: "noopener" }, label);

// `el` taken out of the page once its closing transition is over
const _unmount = (el) => setTimeout(() => el.remove(), UI.duration(el));

// The overlays open now, the newest last, as Escape reaches them.
// The key belongs to the newest, which closes, or stays when it is held open (no `fn`),
// and either way keeps it from the overlays under it.
// A field inside the newest may keep the key for itself (`preventDefault`, as `onEscape` does).
// `_escape(root, fn)` puts an overlay on top and hands back its way off, for its close.
const _escape = (() => {
  const open = [];
  // the newest overlay still in the page: one taken out without its close holds nothing
  function newest() {
    while(open.length && !open.at(-1).root.isConnected) open.pop();
    return open.at(-1);
  }
  // a key from outside the newest overlay is that overlay's before anything else hears it
  document.addEventListener("keydown", (e) => {
    if(e.key !== "Escape") return;
    const top = newest();
    if(!top || top.root.contains(e.target)) return;
    e.stopPropagation();
    e.preventDefault();
    top.fn?.();
  }, true);
  // a key from inside reaches its field first
  document.addEventListener("keydown", (e) => {
    if(e.key !== "Escape" || e.defaultPrevented) return;
    const top = newest();
    if(!top?.fn) return;
    e.preventDefault();
    top.fn();
  });
  return (root, fn) => {
    const entry = { root, fn };
    open.push(entry);
    return () => {
      const at = open.indexOf(entry);
      if(at >= 0) open.splice(at, 1);
    };
  };
})();

const UI = (() => {
  //-------------------------------------------------------------------------------------- Mutators

  /** Defines a read/write property on `el`. */
  function prop(el, name, get, set) {
    return Object.defineProperty(el, name, { get, set, configurable: true });
  }

  /** `el[name]` reads and writes `target.textContent`; a missing target makes it a no-op. */
  function text(el, name, target) {
    return prop(el, name,
      () => target ? target.textContent : "",
      (v) => { if(target) target.textContent = v ?? ""; });
  }

  /**
   * `.title`: the tooltip text.
   * An element that carries an `aria-label` when wired keeps that label in step with the tip:
   * a `null` title takes both away, and the next title brings both back.
   */
  function title(el) {
    const labelled = el.hasAttribute("aria-label");
    prop(el, "title", () => el.getAttribute("data-tooltip"), (v) => {
      if(v == null) {
        el.removeAttribute("data-tooltip");
        if(labelled) el.removeAttribute("aria-label");
        return;
      }
      el.setAttribute("data-tooltip", v);
      if(labelled) el.setAttribute("aria-label", v);
    });
  }

  /**
   * `.active`: toggles the `active` class and aria-pressed.
   * @param {Element} el
   * @param {boolean} [initial]  pressed from the start
   */
  function active(el, initial = false) {
    prop(el, "active",
      () => el.classList.contains("active"),
      (v) => {
        el.classList.toggle("active", !!v);
        el.setAttribute("aria-pressed", String(!!v));
      });
    if(initial) el.active = true;
  }

  /** `.loading`: the icon becomes a spinner and the element is disabled. */
  function loading(el, iconEl) {
    let on = false;
    let glyph = "";
    let own = false; // an icon that exists only for the spinner leaves with it
    let wasDisabled = false;
    prop(el, "loading", () => on, (v) => {
      if(!!v === on) return;
      on = !!v;
      if(on) {
        wasDisabled = el.disabled;
        if(iconEl) glyph = iconEl.textContent;
        else {
          // the span of an `Icon` made by hand: the glue sits under the components
          iconEl = document.createElement("span");
          iconEl.className = "icon";
          iconEl.translate = false;
          el.prepend(iconEl);
          own = true;
        }
        iconEl.textContent = _SPIN_ICON;
        iconEl.classList.add("spinner");
        el.disabled = true;
        return;
      }
      if(own) { iconEl.remove(); iconEl = null; own = false; }
      else { iconEl.textContent = glyph; iconEl.classList.remove("spinner"); }
      el.disabled = wasDisabled;
    });
  }

  //------------------------------------------------------------------------------------- Clipboard

  let pendingWipe = null; // the `clearAfter` wipe still to come, if any
  let wipeTimer = null;

  /**
   * Copies `text` and flashes a check on `btn`, a copy button wearing `content_copy`.
   * `text` may be a promise of one, for words still on their way: the button spins meanwhile.
   * @param {Element} btn
   * @param {string|Promise<string>} text
   * @param {object} [opts]
   * @param {number} [opts.clearAfter]  seconds until the copy is taken back,
   *   for a secret that should not sit in the clipboard until the next copy
   * @returns {Promise<void>} settles once the clipboard holds it, rejects when it refused
   */
  function copy(btn, text, { clearAfter = 0 } = {}) {
    const later = typeof text !== "string";
    const asBlob = (t) => new Blob([t], { type: "text/plain" });
    const written = later
      ? clip("text/plain", Promise.resolve(text).then(asBlob))
      : navigator.clipboard.writeText(text);
    copied(btn, written, later);
    // the wipe counts from the text's arrival; a text that never comes is said on `written`
    if(clearAfter > 0) Promise.resolve(text).then((t) => uncopy(t, clearAfter), () => {});
    return written;
  }

  /**
   * Copies a picture, `btn` flashing as for `copy`.
   * Any format goes in and a PNG comes out, the one picture every clipboard takes.
   * @param {Element} btn
   * @param {Blob|Promise<Blob>} picture  a promise spins the button while it loads
   * @returns {Promise<void>} settles once the clipboard holds it, rejects when it refused
   */
  function copyPicture(btn, picture) {
    const written = clip("image/png", Promise.resolve(picture).then(toPng));
    copied(btn, written, picture instanceof Promise);
    return written;
  }

  // `text` taken off the clipboard after `sec`, replacing whatever wipe was pending.
  // A page without focus may not write the clipboard,
  // so a wipe that falls due then waits for the tab to come back.
  // Where the clipboard may be read without asking for it (a granted permission),
  // the wipe lands only while the text is still there;
  // elsewhere it lands blind,
  // since a password left behind costs more than someone else's line of text.
  function uncopy(text, sec) {
    clearTimeout(wipeTimer);
    async function wipe() {
      if(pendingWipe !== wipe) return; // a newer copy owns the clipboard now
      if(!document.hasFocus()) { addEventListener("focus", wipe, { once: true }); return; }
      pendingWipe = null;
      try {
        const can = await navigator.permissions?.query({ name: "clipboard-read" });
        if(can?.state === "granted" && await navigator.clipboard.readText() !== text) return;
      }
      catch {} // no way to ask and no way to read: wipe anyway
      try { await navigator.clipboard.writeText(""); }
      catch {} // refused as well: the text stays, and nothing here can take it
    }
    pendingWipe = wipe;
    wipeTimer = setTimeout(wipe, sec * 1000);
  }

  /** A pending `clearAfter` wipe run now, for a lock that should not leave the copy behind. */
  const uncopyNow = () => { clearTimeout(wipeTimer); pendingWipe?.(); };

  // `data`, a promise of a Blob of `type`, goes to the clipboard now, inside the click:
  // Safari refuses a clipboard asked for after an await, and a promise is how bytes come later
  function clip(type, data) {
    if(typeof ClipboardItem !== "undefined") {
      return navigator.clipboard.write([new ClipboardItem({ [type]: data })]);
    }
    if(type === "text/plain") {
      return data.then(b => b.text()).then(t => navigator.clipboard.writeText(t));
    }
    return Promise.reject(new Error("This browser copies text and nothing else"));
  }

  // the spinner while a promise loads, then the check;
  // the spinner puts its glyph back on the way out, so the check goes on after it
  function copied(btn, written, waiting) {
    if(waiting) btn.loading = true;
    written
      .finally(() => { if(waiting) btn.loading = false; })
      .then(() => {
        btn.icon = "check";
        setTimeout(() => { btn.icon = "content_copy"; }, 1200);
      }, () => {}); // a refusal is the caller's to say, on the promise handed back
  }

  // a picture as PNG, drawn once at its own size; one already PNG goes as it is
  async function toPng(blob) {
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
  }

  //--------------------------------------------------------------------------------------- Scripts

  const loads = {}; // by `src`: a load in flight, or one done

  /**
   * A script loaded once, with SRI when given: the same `src` again shares that load,
   * and one that failed is tried afresh.
   * @returns {Promise<Event>} settles once the script has run, rejects when it would not load
   */
  function script(src, integrity) {
    return loads[src] ??= new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      if(integrity) { s.integrity = integrity; s.crossOrigin = "anonymous"; }
      s.onload = resolve;
      s.onerror = () => {
        delete loads[src];
        s.remove();
        reject(new Error(`Could not load ${src}`));
      };
      document.head.appendChild(s);
    });
  }

  //----------------------------------------------------------------------------------------- Marks

  /** `text` as children: every http(s) address in it a `[link]` that opens in a new tab. */
  function linkify(text) {
    return String(text ?? "")
      .split(new RegExp(`(${_URL})`))
      .map((part, i) => i % 2 ? _link(part) : part);
  }

  /**
   * `text` as children with its inline marks live:
   * `**bold**` or `__bold__`, `*italic*` or `_italic_`, `~~struck~~`,
   * `` `code` `` shown as it is, and every http(s) address a `[link]` in a new tab.
   * A backslash keeps the mark after it as text: `\*` is a star.
   * The marks are Markdown's, so a note reads the same here and in a file it is exported to.
   * A mark inside a word (`snake_case`, `2*3*4`) or a span left open is plain text.
   */
  function markup(text) {
    const src = String(text ?? "");
    const out = [];
    let at = 0;
    for(const m of src.matchAll(MARKS)) {
      const { code, escaped, url, bold, under, struck, italic } = m.groups;
      if(m.index > at) out.push(src.slice(at, m.index));
      at = m.index + m[0].length;
      if(code) out.push(JSX.createElement("code", {}, code));
      else if(escaped) out.push(escaped);
      else if(url) out.push(_link(url));
      else if(bold || under) out.push(JSX.createElement("strong", {}, bold || under));
      else if(struck) out.push(JSX.createElement("del", {}, struck));
      else out.push(JSX.createElement("em", {}, italic));
    }
    if(at < src.length) out.push(src.slice(at));
    return out;
  }

  // Code is taken first, so a mark or an address inside a span stays text, then an escape.
  // A span is one line, starts and ends on a character that is not a space or a mark,
  // and an underscore or italic mark has no letter, digit or mark on its outer side.
  const MARKS = new RegExp([
    "`(?<code>" + _MARK_CODE + ")`",
    "\\\\(?<escaped>" + _MARK_ESCAPED + ")",
    `(?<url>${_URL})`,
    "\\*\\*(?<bold>[^\\s*](?:[^\\n]*?[^\\s*])??)\\*\\*",
    "(?<![\\w_])__(?<under>[^\\s_](?:[^\\n]*?[^\\s_])??)__(?![\\w_])",
    "~~(?<struck>[^\\s~](?:[^\\n]*?[^\\s~])??)~~",
    "(?<![\\w*_])(?<side>[*_])(?<italic>[^\\s*_](?:[^\\n]*?[^\\s*_])??)\\k<side>(?![\\w*_])",
  ].join("|"), "g");

  //--------------------------------------------------------------------------------------- Overlay

  /** Focusable descendants of `root` that are laid out (a hidden one has no offsetParent). */
  function focusable(root) {
    return [...root.querySelectorAll(
      "button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), "
      + "textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"
    )].filter((el) => el.offsetParent);
  }

  /** Length of the element's CSS transition in ms. */
  const duration = (el) => (parseFloat(getComputedStyle(el).transitionDuration) || 0) * 1000;

  /**
   * Overlay lifecycle on `root`: `.open()`, `.close()`, `.toggle()`, `.opened`.
   * Open mounts the root in the body (`portal`), unhides it and adds `show` a frame later,
   * so the CSS transition runs; close removes `show` and hides once the transition ends.
   * While open, a pointer down outside closes it,
   * unless `dismiss` is false or, as a predicate on the pointer event, says no.
   * Escape closes the newest overlay alone, and one whose `dismiss` is false
   * keeps it from the overlays under it; a field inside the newest may keep it for itself.
   * An overlay taken out of the page without its close takes no Escape any more.
   * Focus returns to the previous element when the overlay held it.
   * `onOpen` receives the arguments of `open()`.
   */
  function overlay(root, { onOpen, onClose, dismiss = true, portal = true } = {}) {
    let opened = false;
    let prevFocus = null;
    let hideTimer = null;
    let leave = null; // takes this overlay off the ones Escape reaches
    // capture phase, so a handler that stops propagation cannot hide the event
    function onDown(e) {
      if(root.contains(e.target)) return;
      if(dismiss === true || dismiss(e)) root.close();
    }
    root.open = (...args) => {
      if(opened) return;
      opened = true;
      prevFocus = document.activeElement;
      clearTimeout(hideTimer);
      if(portal && !root.isConnected) document.body.appendChild(root);
      root.hidden = false;
      onOpen?.(...args);
      requestAnimationFrame(() => root.classList.add("show"));
      // through the property, so a component that wraps `close` is asked as well
      leave = _escape(root, dismiss ? () => root.close() : null);
      if(dismiss) document.addEventListener("pointerdown", onDown, true);
    };
    root.close = () => {
      if(!opened) return;
      opened = false;
      leave?.();
      document.removeEventListener("pointerdown", onDown, true);
      root.classList.remove("show");
      hideTimer = setTimeout(() => { root.hidden = true; }, duration(root));
      if(root.contains(document.activeElement)) prevFocus?.focus?.();
      prevFocus = null;
      onClose?.();
    };
    root.toggle = (...args) => opened ? root.close() : root.open(...args);
    prop(root, "opened", () => opened, (v) => v ? root.open() : root.close());
  }

  //------------------------------------------------------------------------------------- Placement

  /**
   * Puts a `position: fixed` element next to `anchor`.
   * `pos` is a main side (top, bottom, left, right) with an optional alignment:
   * `-start`/`-end` for top and bottom, `-top`/`-bottom` for left and right, none centers.
   * The main side flips when it does not fit, then the result is clamped to the viewport.
   * @returns {boolean} true when it needed neither
   */
  function place(el, anchor, pos = "bottom", { gap = 4, margin = 8, dx = 0, dy = 0 } = {}) {
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
  }

  return {
    prop, text, title, active, loading,
    copy, copyPicture, uncopyNow,
    script,
    linkify, markup,
    focusable, duration, overlay,
    place,
  };
})();
