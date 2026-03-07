// scripts/lib/jsx.js

const JSX = {
  Fragment: Symbol.for("jsx.fragment"),
  createElement: (tag, props, ...children) => {
    if(tag === JSX.Fragment) return JSX.createFragment(props, ...children);
    if(typeof tag === "function") {
      return tag({ ...(props || {}), children });
    }
    if(typeof tag !== "string") throw new TypeError("Invalid JSX tag");
    const element = document.createElement(tag);
    let _deferValue;
    let _ref;
    Object.entries(props || {}).forEach(([name, value]) => {
      // Skip internal props
      if(name === "children" || name === "key") return;
      // Handle ref callback/object
      if(name === "ref") {
        _ref = value;
        return;
      }
      // Handle class/className
      if(name === "class" || name === "className") {
        const className = JSX.NormalizeClass(value);
        if(className) element.className = className;
        return;
      }
      // Handle htmlFor -> for
      if(name === "htmlFor") {
        if(value === false || value == null) return;
        element.setAttribute("for", value.toString());
        return;
      }
      // Handle style object/string
      if(name === "style") {
        JSX.AssignStyle(element, value);
        return;
      }
      // Handle dataset object
      if(name === "dataset" && value && typeof value === "object") {
        JSX.AssignData(element, value);
        return;
      }
      // Handle events
      if(name.startsWith("on") && typeof value === "function") {
        element.addEventListener(JSX.GetEventName(name), value);
        return;
      }
      // Handle prop aliases
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
  AppendChild: (parent, child) => {
    if(Array.isArray(child)) {
      child.forEach((nested) => JSX.AppendChild(parent, nested));
      return;
    }
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
    // Keep false for aria/data, set false for boolean DOM props, skip rest
    if(value === false) {
      if(attrOnly) {
        element.setAttribute(name, "false");
        return;
      }
      if(canAssign && typeof element[name] === "boolean") {
        element[name] = false;
      }
      return;
    }
    // Keep true for boolean DOM props, set attribute for rest
    if(value === true) {
      if(canAssign && typeof element[name] === "boolean") {
        element[name] = true;
        return;
      }
      element.setAttribute(name, attrOnly ? "true" : "");
      return;
    }
    // Prefer writable property when possible
    if(canAssign) {
      element[name] = value;
      return;
    }
    // Keep object/function on unknown expando props
    if(
      !attrOnly &&
      !(name in element) &&
      (typeof value === "object" || typeof value === "function")
    ) {
      element[name] = value;
      return;
    }
    // Set attribute
    element.setAttribute(name, value.toString());
  },
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
  onMount: (target, fnc) => {
    if(typeof fnc !== "function") return () => {};
    let done = false;
    let observer = null;
    const bind = () => {
      if(done) return true;
      const element = JSX.ResolveTarget(target);
      if(element && element.isConnected) {
        done = true;
        if(observer) observer.disconnect();
        queueMicrotask(() => fnc(element));
        return true;
      }
      return false;
    };
    if(bind()) return () => {};
    observer = new MutationObserver(() => {
      bind();
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
    return () => {
      done = true;
      observer.disconnect();
    };
  }
};