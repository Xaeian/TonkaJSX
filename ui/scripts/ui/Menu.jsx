// scripts/ui/Menu.jsx

// auto placement tries these in order and takes the first that fits
const _MENU_PLACES = ["bottom-start", "top-start", "right-top", "left-top"];

/**
 * Popup anchored to a trigger element, above a Modal it is opened from.
 * Non-blocking (no backdrop) and interactive.
 * One instance can serve many anchors.
 *
 * Mutators: .open(anchor), .close(), .toggle(anchor), .opened
 *
 * @param {object} props
 * @param {string} [props.title]
 * @param {string} [props.pos="auto"]  a side as `UI.place` reads it;
 *   "auto" takes the first that fits of bottom-start, top-start, right-top and left-top
 * @param {string} [props.width]  CSS width, the content's own by default
 * @param {number} [props.offsetX=0]  px nudge after placement
 * @param {(opened:boolean) => void} [props.onChange]
 */
const Menu = ({ title, pos = "auto", width, offsetX = 0, onChange, class: className, children,
  ...rest }) => {
  const body = <div class="menu-body">{children}</div>;
  const root = (
    <div {...rest} class={["menu", className]} role="menu" style={{ width }} hidden>
      {title ? <div class="menu-head"><h4 class="menu-title">{title}</h4></div> : null}
      {body}
    </div>
  );
  let anchor = null;
  const opts = { dx: offsetX };
  // the menu is fixed, so it is placed again on every scroll that moves its anchor
  function place() {
    if(pos !== "auto") { UI.place(root, anchor, pos, opts); return; }
    for(const p of _MENU_PLACES) if(UI.place(root, anchor, p, opts)) return;
  }

  UI.overlay(root, {
    dismiss: (e) => !(anchor && anchor.contains(e.target)),
    onOpen: (anchorEl) => {
      if(!anchorEl) throw new Error("Menu.open needs an anchor element");
      anchor = anchorEl;
      place();
      requestAnimationFrame(() => UI.focusable(body)[0]?.focus());
      window.addEventListener("resize", place);
      window.addEventListener("scroll", place, true);
      onChange?.(true);
    },
    onClose: () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      anchor = null;
      onChange?.(false);
    },
  });
  // open() on an open menu moves it to the new anchor
  const open = root.open;
  root.open = (anchorEl) => {
    if(!root.opened) open(anchorEl);
    else if(anchorEl && anchorEl !== anchor) { anchor = anchorEl; place(); }
  };
  return root;
};
