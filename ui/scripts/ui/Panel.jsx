// scripts/ui/Panel.jsx

/**
 * Content container. Two layouts:
 *   default  card: head (icon, meta, title, actions, tabs), toolbar, body
 *   inline   one row: icon, main, actions
 *
 * Looks, combined freely:
 *   stripe    right edge accent
 *   color     palette name for the stripe and the icon; `tint` picks the muted twin
 *   dashed, ghost, pointer
 *   glow      hover border
 *   flash     hover icon
 *   top       aligns an inline row to the top
 *   size      sm/lg body padding
 *   compact   slimmer head
 *   flush     body without padding
 *
 * Space: `grow` takes the free height and scrolls the body, `fill` takes it without scrolling;
 * `height`, `maxWidth` (centered), `maxHeight`. A tab pane of either fills the body it is in.
 *
 * State: `state` selected|armed|confirm|moved|danger tints the background.
 * `selected` is a shortcut for `state="selected"`.
 *
 * Mutators: .title, .icon, .color, .state, .selected, .tab.
 *
 * @param {Object} props
 * @param {Array<{key:string, label?:string, icon?:string}>} [props.tabs]
 * @param {string} [props.value]  active tab key
 * @param {(key:string) => void} [props.onChange]  tab change
 */
const Panel = ({
  inline, stack, top, stripe, color, tint, dashed, ghost, glow, flash, pointer,
  size, compact, grow, fill, flush, height, maxWidth, maxHeight, selected, state,
  icon, title, meta, actions, toolbar, tabs, value, onChange, class: className, children,
  ...rest
}) => {
  const cls = ["panel", size, className, {
    "panel-inline": inline, "panel-stack": stack, "panel-top": top, "panel-stripe": stripe,
    "panel-dashed": dashed, "panel-ghost": ghost, "panel-glow": glow, "panel-flash": flash,
    "panel-pointer": pointer, "panel-compact": compact, "panel-flush": flush,
    "panel-grow": grow, "panel-fill": fill, "panel-cap": maxWidth,
  }];
  const iconEl = icon ? <span class="icon panel-icon">{icon}</span> : null;
  const actionsEl = actions ? <div class="panel-actions">{actions}</div> : null;
  const attrs = {
    class: cls, style: { height, maxWidth, maxHeight },
    color, tint, grow: grow || fill, state: state || (selected ? "selected" : null),
  };

  const attach = (el) => {
    UI.text(el, "icon", iconEl);
    UI.prop(el, "color",
      () => el.getAttribute("color"),
      (v) => v ? el.setAttribute("color", v) : el.removeAttribute("color"));
    UI.prop(el, "state",
      () => el.getAttribute("state"),
      (v) => v ? el.setAttribute("state", v) : el.removeAttribute("state"));
    UI.prop(el, "selected",
      () => el.state === "selected",
      (v) => { el.state = v ? "selected" : null; });
    return el;
  };

  if(inline) {
    return attach(
      <div {...rest} {...attrs}>
        {iconEl}
        <div class="panel-main">{children}</div>
        {actionsEl}
      </div>
    );
  }

  const hasTabs = Array.isArray(tabs) && tabs.length > 0;
  const hasHead = title != null || meta || actionsEl || hasTabs;
  const titleEl = hasHead ? <h3 class="panel-title" hidden={!title}>{title || ""}</h3> : null;
  const tabBar = hasTabs ? <div class="panel-tabs"></div> : null;
  const body = <div class="panel-body">{children}</div>;
  const el = attach(
    <div {...rest} {...attrs}>
      {hasHead ? (
        <div class="panel-head">
          <div class="panel-head-row">
            {iconEl}
            {meta ? <div class="panel-meta">{meta}</div> : null}
            {titleEl}
            {actionsEl}
          </div>
          {tabBar}
        </div>
      ) : null}
      {toolbar ? <div class="panel-toolbar">{toolbar}</div> : null}
      {body}
    </div>
  );
  UI.prop(el, "title",
    () => titleEl ? titleEl.textContent : "",
    (v) => { if(titleEl) { titleEl.textContent = v || ""; titleEl.hidden = !v; } });

  // tabs: buttons in the head, panes (`[data-tab]`) in the body
  let current = hasTabs ? (value || tabs[0].key) : null;
  const sync = () => {
    for(const pane of body.querySelectorAll("[data-tab]")) {
      pane.hidden = pane.dataset.tab !== current;
    }
    for(const btn of tabBar.children) {
      btn.classList.toggle("active", btn.dataset.value === current);
    }
  };
  if(hasTabs) {
    for(const t of tabs) {
      tabBar.appendChild(
        <button class="panel-tab" data-value={t.key} onClick={() => {
          if(current === t.key) return;
          current = t.key;
          sync();
          onChange?.(current);
        }}>
          {t.icon ? <span class="icon">{t.icon}</span> : null}
          {t.label}
        </button>
      );
    }
    sync();
  }
  UI.prop(el, "tab", () => current, (v) => { if(hasTabs) { current = v; sync(); } });
  return el;
};

/** Tab pane inside `<Panel tabs>`; shown when `value` is the active key. */
const TabPanel = ({ value, children }) => <div data-tab={value}>{children}</div>;
