// scripts/ui/Panel.jsx

/**
 * Content container. Two layouts:
 *   default  card: head (icon, meta, title, actions, tabs), toolbar, body
 *   inline   one row: icon, main, actions; `stack` piles the main (a name over its details)
 *
 * Looks, combined freely:
 *   stripe    right edge accent
 *   color     palette name for the stripe and the icon; `tint` picks the muted twin
 *   dashed, ghost
 *   glow      hover border
 *   flash     hover icon
 *   size      sm/lg body padding
 *   compact   slimmer head
 *   flush     body without padding
 *
 * Space: `grow` takes the free height and scrolls the body, which a tab pane then fills;
 * `height` fixes the height, `maxWidth` caps the width and centers the panel.
 *
 * State: `state` selected|armed|moved|danger tints the background,
 * and `done` steps the row back, faded on a darker ground.
 * `selected` is a shortcut for `state="selected"`.
 *
 * `title` heads a card and is the tooltip of an inline row.
 * A click among the `actions` is theirs, never the Panel's `onClick` as well.
 *
 * Mutators: .title, .icon, .color, .state, .selected, .value (the open tab)
 *
 * @param {object} props
 * @param {Array<{key:string, label?:string, icon?:string}>} [props.tabs]
 * @param {string} [props.value]  open tab key, the first by default
 * @param {(key:string) => void} [props.onChange]  tab change
 */
const Panel = ({
  inline, stack, stripe, color, tint, dashed, ghost, glow, flash, size, compact, grow, flush,
  height, maxWidth, selected, state, icon, title, meta, actions, toolbar, tabs, value, onChange,
  onClick, class: className, children, ...rest
}) => {
  const cls = ["panel", size, className, {
    "panel-inline": inline, "panel-stack": stack, "panel-stripe": stripe,
    "panel-dashed": dashed, "panel-ghost": ghost, "panel-glow": glow, "panel-flash": flash,
    "panel-compact": compact, "panel-flush": flush, "panel-grow": grow, "panel-cap": maxWidth,
  }];
  const iconEl = icon ? <span class="icon panel-icon" translate={false}>{icon}</span> : null;
  const actionsEl = actions ? <div class="panel-actions">{actions}</div> : null;
  const attrs = {
    class: cls, style: { height, maxWidth }, color, tint, grow,
    state: state || (selected ? "selected" : null),
    onClick: onClick && ((e) => { if(!actionsEl?.contains(e.target)) onClick(e); }),
  };

  function attach(el) {
    // `el[name]` mirrors the attribute of that name, which an empty value takes away
    const reflect = (name) => UI.prop(el, name,
      () => el.getAttribute(name),
      (v) => v ? el.setAttribute(name, v) : el.removeAttribute(name));
    UI.text(el, "icon", iconEl);
    reflect("color");
    reflect("state");
    UI.prop(el, "selected",
      () => el.state === "selected",
      (v) => { el.state = v ? "selected" : null; });
    return el;
  }

  if(inline) {
    const el = attach(
      <div {...rest} {...attrs} title={title}>
        {iconEl}
        <div class="panel-main">{children}</div>
        {actionsEl}
      </div>
    );
    UI.title(el);
    return el;
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
  function sync() {
    for(const pane of body.querySelectorAll("[data-tab]")) {
      pane.hidden = pane.dataset.tab !== current;
    }
    for(const btn of tabBar.children) {
      btn.classList.toggle("active", btn.dataset.value === current);
    }
  }
  if(hasTabs) {
    for(const t of tabs) {
      tabBar.appendChild(
        <button class="panel-tab" data-value={t.key} onClick={() => {
          if(current === t.key) return;
          current = t.key;
          sync();
          onChange?.(current);
        }}>
          {t.icon ? <span class="icon" translate={false}>{t.icon}</span> : null}
          {t.label}
        </button>
      );
    }
    sync();
  }
  UI.prop(el, "value", () => current, (v) => { if(hasTabs) { current = v; sync(); } });
  return el;
};

/** Tab pane inside `<Panel tabs>`; shown when `value` is the open key. */
const TabPanel = ({ value, class: className, children, ...rest }) => (
  <div {...rest} class={className} data-tab={value}>{children}</div>
);
