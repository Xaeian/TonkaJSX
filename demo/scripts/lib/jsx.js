// scripts/lib/jsx.js
// Minimal JSX runtime: createElement builds real DOM nodes, no virtual DOM and no diffing.
// Conscious limits: SVG covers icon-grade tags with native attributes (stroke-width,
// not strokeWidth), event names are lowercased, so custom events must be lowercase too.

//------------------------------------------------------------------------------------------ Create

const JSX = {
  Fragment: Symbol.for("jsx.fragment"),
  // tags colliding with HTML (a, title, style, script) stay out and resolve as HTML
  SvgTags: new Set([
    "svg", "path", "circle", "ellipse", "line", "rect", "polygon", "polyline",
    "g", "defs", "use", "symbol", "marker", "mask", "pattern", "clipPath",
    "linearGradient", "radialGradient", "stop", "filter", "feBlend", "feColorMatrix",
    "feComposite", "feDropShadow", "feFlood", "feGaussianBlur", "feMerge",
    "feMergeNode", "feOffset", "feTurbulence", "text", "tspan", "textPath",
    "image", "foreignObject", "animate", "animateMotion", "animateTransform",
    "desc", "metadata", "view", "switch", "mpath"
  ]),
  createElement: (tag, props, ...children) => {
    if(tag === JSX.Fragment) return JSX.createFragment(props, ...children);
    if(typeof tag === "function") {
      return tag({ ...(props || {}), children });
    }
    if(typeof tag !== "string") throw new TypeError("Invalid JSX tag");
    const element = JSX.SvgTags.has(tag)
      ? document.createElementNS("http://www.w3.org/2000/svg", tag)
      : document.createElement(tag);
    let _deferValue;
    let _ref;
    Object.entries(props || {}).forEach(([name, value]) => {
      if(name === "children" || name === "key") return;
      if(name === "ref") {
        _ref = value;
        return;
      }
      if(name === "class" || name === "className") {
        const className = JSX.NormalizeClass(value);
        // attribute, not property: SVG className is a read-only SVGAnimatedString
        if(className) element.setAttribute("class", className);
        return;
      }
      if(name === "htmlFor") {
        if(value === false || value == null) return;
        element.setAttribute("for", value.toString());
        return;
      }
      // contentEditable is a string property, booleans must become "true"/"false"
      if(name === "contentEditable" || name === "contenteditable") {
        if(value == null) return;
        element.contentEditable = value === true ? "true"
          : value === false ? "false" : value.toString();
        return;
      }
      if(name === "style") {
        JSX.AssignStyle(element, value);
        return;
      }
      if(name === "dataset" && value && typeof value === "object") {
        JSX.AssignData(element, value);
        return;
      }
      // camelCase on*: functions become listeners, other values are dropped
      // (lowercase on* hits the property path: known handler props null out
      //  strings, unknown on* names become inert attributes)
      if(/^on[A-Z]/.test(name)) {
        if(typeof value === "function")
          element.addEventListener(JSX.GetEventName(name), value);
        return;
      }
      if(name === "readonly") name = "readOnly";
      else if(name === "tabindex") name = "tabIndex";
      // Defer select value until options exist
      if(name === "value" && tag === "select") {
        _deferValue = value;
        return;
      }
      JSX.AssignProp(element, name, value);
    });
    JSX.AppendChild(element, children);
    if(_deferValue !== undefined) JSX.SetValue(element, _deferValue);
    JSX.SetRef(_ref, element);
    return element;
  },

//---------------------------------------------------------------------------------------- Children

  AppendChild: (parent, child) => {
    if(Array.isArray(child)) {
      child.forEach((nested) => JSX.AppendChild(parent, nested));
      return;
    }
    // Set/generator children; strings and nodes are iterable too, hence the guards
    if(
      child &&
      typeof child !== "string" &&
      !child.nodeType &&
      typeof child[Symbol.iterator] === "function"
    ) {
      for(const item of child) JSX.AppendChild(parent, item);
      return;
    }
    if(child === false || child === true || child == null) return;
    if(child && child.nodeType) {
      parent.appendChild(child);
      return;
    }
    if(
      typeof child === "string" ||
      typeof child === "number" ||
      typeof child === "bigint"
    ) {
      parent.appendChild(document.createTextNode(child.toString()));
      return;
    }
    throw new TypeError("Invalid JSX child");
  },
  createFragment: (props, ...children) => {
    const frag = document.createDocumentFragment();
    JSX.AppendChild(frag, children);
    return frag;
  },

//------------------------------------------------------------------------------------------- Props

  GetEventName: (name) => {
    if(name === "onDoubleClick") return "dblclick";
    return name.substring(2).toLowerCase();
  },
  NormalizeClass: (value) => {
    if(value === false || value == null) return "";
    if(Array.isArray(value)) {
      return value
        .map((item) => JSX.NormalizeClass(item))
        .filter(Boolean)
        .join(" ");
    }
    if(typeof value === "object") {
      return Object.entries(value)
        .filter(([, enabled]) => !!enabled)
        .map(([name]) => name)
        .join(" ");
    }
    return value.toString();
  },
  AssignStyle: (element, styles) => {
    if(styles === false || styles == null) return;
    if(typeof styles === "string") {
      element.setAttribute("style", styles);
      return;
    }
    if(typeof styles !== "object") return;
    Object.entries(styles).forEach(([name, value]) => {
      if(value === false || value == null) return;
      // custom properties and kebab-case names reach the style object only via setProperty
      if(name.startsWith("--") || name.includes("-")) {
        element.style.setProperty(name, value.toString());
        return;
      }
      element.style[name] = value;
    });
  },
  AssignData: (element, data) => {
    Object.entries(data).forEach(([key, value]) => {
      if(value == null) return;
      // dataset can't express dashed keys, those go straight to the data-* attribute
      if(key.includes("-")) {
        element.setAttribute(`data-${key}`, value.toString());
        return;
      }
      element.dataset[key] = value.toString();
    });
  },
  AssignProp: (element, name, value) => {
    const attrOnly = name.startsWith("data-") || name.startsWith("aria-");
    const canAssign = !attrOnly && JSX.CanAssignProperty(element, name);
    if(value == null) return;
    // false: attr for aria/data, boolean and setter-only props take the value,
    // drop otherwise so `value={cond && x}` stays an absence
    if(value === false) {
      if(attrOnly) {
        element.setAttribute(name, "false");
        return;
      }
      const type = typeof element[name];
      if(canAssign && (type === "boolean" || type === "undefined")) {
        element[name] = false;
      }
      return;
    }
    // true: boolean and setter-only props take the value, else empty attr
    if(value === true) {
      const type = typeof element[name];
      if(canAssign && (type === "boolean" || type === "undefined")) {
        element[name] = true;
        return;
      }
      element.setAttribute(name, attrOnly ? "true" : "");
      return;
    }
    // a writable property wins over the attribute
    if(canAssign) {
      element[name] = value;
      return;
    }
    // attributes can't hold object/function, stash as expando
    if(
      !attrOnly &&
      !(name in element) &&
      (typeof value === "object" || typeof value === "function")
    ) {
      element[name] = value;
      return;
    }
    element.setAttribute(name, value.toString());
  },
  // DOM properties sit on prototypes, so the whole chain is walked, not just the instance
  CanAssignProperty: (element, name) => {
    let target = element;
    while(target) {
      const desc = Object.getOwnPropertyDescriptor(target, name);
      if(desc) return !!desc.set || !!desc.writable;
      target = Object.getPrototypeOf(target);
    }
    return false;
  },
  SetValue: (element, value) => {
    // multi-select ignores element.value, the selection has to be written per option
    if(
      element instanceof HTMLSelectElement &&
      element.multiple &&
      Array.isArray(value)
    ) {
      const values = new Set(
        value.map((item) => item == null ? "" : item.toString())
      );
      Array.from(element.options).forEach((option) => {
        option.selected = values.has(option.value);
      });
      return;
    }
    element.value = value == null ? "" : value;
  },
  SetRef: (ref, element) => {
    if(!ref) return;
    if(typeof ref === "function") {
      ref(element);
      return;
    }
    if(typeof ref === "object") ref.current = element;
  },

//------------------------------------------------------------------------------------------- Mount

  // a plain word is looked up as an id first, then retried as a selector
  ResolveTarget: (target) => {
    if(target instanceof Element) return target;
    if(typeof target !== "string") return null;
    const first = target[0];
    const isSelector =
      first === "#" ||
      first === "." ||
      first === "[" ||
      target.includes(" ") ||
      target.includes(">") ||
      target.includes(":") ||
      target.includes("+") ||
      target.includes("~") ||
      target.includes(",");
    try {
      if(isSelector) return document.querySelector(target);
      return document.getElementById(target) || document.querySelector(target);
    }
    catch(err) {
      return null;
    }
  },
  /** Runs `fnc` once the target is connected, waiting on the tree. Returns a disposer. */
  onMount: (target, fnc) => {
    if(typeof fnc !== "function") return () => {};
    let done = false;
    let disposed = false;
    let observer = null;
    const bind = () => {
      if(done) return true;
      const element = JSX.ResolveTarget(target);
      if(element && element.isConnected) {
        done = true;
        if(observer) observer.disconnect();
        // the disposer may still run before this microtask fires
        queueMicrotask(() => {
          if(!disposed) fnc(element);
        });
        return true;
      }
      return false;
    };
    const dispose = () => {
      done = true;
      disposed = true;
      if(observer) observer.disconnect();
    };
    if(bind()) return dispose;
    observer = new MutationObserver(() => {
      bind();
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
    return dispose;
  }
};

//------------------------------------------------------------------------------------------- Babel

// Babel 8 defaults JSX to the automatic runtime; scripts opt back into the
// classic JSX.* pragma via data-presets="tonka"
if(typeof Babel !== "undefined") {
  Babel.registerPreset("tonka", {
    presets: [
      [Babel.availablePresets.react, {
        runtime: "classic",
        pragma: "JSX.createElement",
        pragmaFrag: "JSX.Fragment"
      }]
    ]
  });
}
