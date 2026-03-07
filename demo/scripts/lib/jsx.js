// scripts/lib/jsx.js

const JSX = {
  createElement: (tag, props, ...children) => {
    if(typeof tag === "function") {
      // return tag(props || {}, ...children);
      return tag({ ...props, children });
    }
    const element = document.createElement(tag);
    let _deferValue;
    let _ref;
    Object.entries(props || {}).forEach(([name, value]) => {
      // Handle ref callback
      if(name === "ref" && typeof value === "function") {
        _ref = value;
        return;
      }
      // Handle className -> class
      if(name === "className") {
        if(value === false || value == null) return;
        element.setAttribute("class", value);
        return;
      }
      // Handle htmlFor -> for
      if(name === "htmlFor") {
        if(value === false || value == null) return;
        element.setAttribute("for", value);
        return;
      }
      // Handle style object
      if(name === "style" && value && typeof value === "object") {
        JSX.AssignStyle(element, value);
        return;
      }
      // Handle dataset object
      if(name === "dataset" && value && typeof value === "object") {
        Object.entries(value).forEach(([key, item]) => {
          if(item === false || item == null) return;
          element.dataset[key] = item.toString();
        });
        return;
      }
      // Handle events
      if(name.startsWith("on") && typeof value === "function") {
        const event = JSX.GetEventName(name);
        element.addEventListener(event, value);
        return;
      }
      // Handle checked/disabled/value and common DOM properties
      if(
        name === "checked" ||
        name === "disabled" ||
        name === "selected" ||
        name === "multiple" ||
        name === "readOnly" ||
        name === "value"
      ) {
        if(name === "value" && tag === "select") {
          _deferValue = value;
          return;
        }
        element[name] = value;
        return;
      }
      // Skip false/null/undefined
      if(value === false || value == null) return;
      // Prefer property when possible
      if(
        name in element &&
        typeof value !== "object" &&
        typeof value !== "function" &&
        !name.startsWith("data-") &&
        !name.startsWith("aria-")
      ) {
        element[name] = value;
        return;
      }
      // Set attribute
      element.setAttribute(name, value === true ? "" : value.toString());
    });
    JSX.AppendChild(element, children);
    if(_deferValue !== undefined) JSX.SetValue(element, _deferValue);
    if(_ref) _ref(element);
    return element;
  },

  AppendChild: (parent, child) => {
    if(Array.isArray(child)) {
      child.forEach((nested) => JSX.AppendChild(parent, nested));
    }
    else if(child === false || child === true || child == null) {
      return;
    }
    else {
      parent.appendChild(
        child.nodeType ? child : document.createTextNode(child)
      );
    }
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

  AssignStyle: (element, styles) => {
    Object.entries(styles).forEach(([name, value]) => {
      if(value === false || value == null) return;
      if(name.startsWith("--")) {
        element.style.setProperty(name, value.toString());
        return;
      }
      element.style[name] = value;
    });
  },

  SetValue: (element, value) => {
    if(
      element instanceof HTMLSelectElement &&
      element.multiple &&
      Array.isArray(value)
    ) {
      const values = new Set(value.map((item) => item.toString()));
      Array.from(element.options).forEach((option) => {
        option.selected = values.has(option.value);
      });
      return;
    }
    element.value = value;
  },

  onMount: (target, fnc) => {
    let tries = 0;
    const bind = () => {
      let element = null;
      if(typeof target === "string") element = document.getElementById(target);
      else if(target instanceof Element) element = target;
      if(element && element.isConnected) {
        fnc(element);
        return;
      }
      if(tries++ < 120) requestAnimationFrame(bind);
    };
    requestAnimationFrame(bind);
  }
};