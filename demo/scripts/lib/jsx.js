/** @jsx JSX.createElement */
/** @jsxFrag JSX.createFragment */

const JSX = {
  createElement: (tag, props, ...children) => {
    if(typeof tag === "function") {
      // return tag(props || {}, ...children);
      return tag({ ...props, children });
    }
    const element = document.createElement(tag);
    Object.entries(props || {}).forEach(([name, value]) => {
      // Handle ref callback
      if(name === "ref" && typeof value === "function") {
        value(element);
        return;
      }
      // Handle className -> class
      if(name === "className") {
        element.setAttribute("class", value);
        return;
      }
      // Handle style object
      if(name === "style" && typeof value === "object") {
        Object.assign(element.style, value);
        return;
      }
      // Handle events
      if(name.startsWith("on") && typeof value === "function") {
        const event = name.substring(2).toLowerCase();
        element.addEventListener(event, value);
        return;
      }
      // Handle checked/disabled/value for inputs
      if(name === "checked" || name === "disabled" || name === "value") {
        element[name] = value;
        return;
      }
      // Skip false/null/undefined
      if(value === false || value == null) return;
      // Set attribute
      element.setAttribute(name, value === true ? "" : value.toString());
    });
    JSX.AppendChild(element, children);
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
  
  onMount: (target, fnc) => {
    queueMicrotask(() => {
      let element = null;
      if(typeof target === "string") element = document.getElementById(target);
      else if(target instanceof HTMLElement) element = target;
      if(element) fnc(element);
    });
  }
};