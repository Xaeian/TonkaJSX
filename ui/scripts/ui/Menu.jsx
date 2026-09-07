// scripts/ui/Menu.jsx

// auto placement tries these in order and takes first that fits
const _MENU_PLACES = ["bottom-start", "top-start", "right-top", "left-top"];

/**
 * Popup anchored to a trigger element.
 * Non-blocking (no backdrop, no scroll lock) and interactive.
 * One instance can serve many anchors.
 *
 * Mutators: .open(anchor), .close(), .toggle(anchor), .opened
 *
 * @param {Object} props
 * @param {string} [props.title]
 * @param {string} [props.pos="auto"]   see `UI.place`; "auto" tries `_MENU_PLACES` in order
 * @param {string} [props.width]        CSS width, default fits content
 * @param {string} [props.maxWidth]
 * @param {number} [props.offsetX=0]    px nudge after placement
 * @param {number} [props.offsetY=0]
 * @param {(opened:boolean) => void} [props.onChange]
 */
const Menu = ({ title, pos = "auto", width, maxWidth, offsetX = 0, offsetY = 0, onChange,
  class: className, children, ...rest }) => {
  const body = <div class="menu-body">{children}</div>;
  const root = (
    <div {...rest} class={["menu", className]} role="menu" style={{ width, maxWidth }} hidden>
      {title ? <div class="menu-head"><h4 class="menu-title">{title}</h4></div> : null}
      {body}
    </div>
  );
  let anchor = null;
  const opts = { dx: offsetX, dy: offsetY };
  const place = () => {
    if(pos !== "auto") { UI.place(root, anchor, pos, opts); return; }
    for(const p of _MENU_PLACES) if(UI.place(root, anchor, p, opts)) return;
  };
  // menu is fixed, so scrolling under it moves anchor away
  const follow = () => place();

  UI.overlay(root, {
    dismiss: (e) => !(anchor && anchor.contains(e.target)),
    onOpen: (anchorEl) => {
      if(!anchorEl) throw new Error("Menu.open needs an anchor element");
      anchor = anchorEl;
      place();
      requestAnimationFrame(() => UI.focusable(body)[0]?.focus());
      window.addEventListener("resize", follow);
      window.addEventListener("scroll", follow, true);
      onChange?.(true);
    },
    onClose: () => {
      window.removeEventListener("resize", follow);
      window.removeEventListener("scroll", follow, true);
      anchor = null;
      onChange?.(false);
    },
  });
  // open() on an open menu moves it to new anchor
  const open = root.open;
  root.open = (anchorEl) => {
    if(!root.opened) open(anchorEl);
    else if(anchorEl && anchorEl !== anchor) { anchor = anchorEl; place(); }
  };
  return root;
};
