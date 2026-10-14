// scripts/ui/theme.js

/**
 * Theme: the page follows the system until `set` writes `data-theme`,
 * and follows it again once `set("system")` takes that attribute away.
 * Nothing is kept unless `remember` ties the choice to storage;
 * an app holding it in its own state calls `set`.
 * Every change fires `theme:change` on `document` with the choice, which may be "system";
 * what is actually showing is always `current()`.
 */
const Theme = (() => {
  const KEY = "theme";
  const root = document.documentElement;
  const media = matchMedia("(prefers-color-scheme: dark)");
  let cache = null;

  /** What is showing now: dark or light, whoever chose it. */
  const current = () => root.dataset.theme || (media.matches ? "dark" : "light");

  /** What was chosen: dark, light, or system while nothing was. */
  const choice = () => root.dataset.theme || "system";

  /** Whether dark is what is showing. */
  const isDark = () => current() === "dark";

  function emit() {
    return document.dispatchEvent(
      new CustomEvent("theme:change", { detail: choice() }));
  }

  /**
   * A theme to show, or `system` to hand the page back to the operating system.
   * @param {"dark"|"light"|"system"} t
   */
  function set(t) {
    if(t === "system") delete root.dataset.theme;
    else root.dataset.theme = t;
    cache?.set(KEY, t);
    emit();
  }

  /** The other of the two themes, chosen outright. */
  const toggle = () => set(isDark() ? "light" : "dark");

  /**
   * Take up the choice kept under `name`, and keep every later one there.
   * @param {string} name storage namespace, the choice lands under `name:theme`
   */
  function remember(name) {
    cache = createCache(name);
    const saved = cache.get(KEY);
    if(saved) set(saved);
  }

  /**
   * A listener on every change, the choice in `event.detail`.
   * @returns {() => void} stops listening
   */
  function onChange(fn) {
    document.addEventListener("theme:change", fn);
    return () => document.removeEventListener("theme:change", fn);
  }

  // a system change counts only while no explicit choice is set
  media.addEventListener("change", () => { if(!root.dataset.theme) emit(); });

  return { current, choice, isDark, set, toggle, remember, onChange };
})();
